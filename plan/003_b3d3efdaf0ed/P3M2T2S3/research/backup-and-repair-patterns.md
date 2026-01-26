# Backup and Repair Patterns for State Validation

## Research Date

2026-01-24

## Purpose

Document backup and auto-repair patterns for implementing `prd validate-state`.

---

## 1. Backup Before Repair Pattern

### Concept

Create timestamped backup before modifying tasks.json to enable recovery.

### Implementation

```typescript
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

interface BackupOptions {
  maxBackups?: number; // Keep only N most recent backups
  backupDir?: string; // Custom backup directory
}

async function createBackup(
  tasksPath: string,
  options: BackupOptions = {}
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = options.backupDir || dirname(tasksPath);
  const backupName = `tasks.json.backup.${timestamp}`;
  const backupPath = resolve(backupDir, backupName);

  // Ensure backup directory exists
  await mkdir(backupDir, { recursive: true });

  // Create backup
  await copyFile(tasksPath, backupPath);

  // Rotate old backups if maxBackups specified
  if (options.maxBackups) {
    await rotateBackups(backupDir, options.maxBackups);
  }

  return backupPath;
}

async function rotateBackups(
  backupDir: string,
  maxBackups: number
): Promise<void> {
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(backupDir);

  // Get backup files sorted by date (newest first)
  const backups = files
    .filter(f => f.startsWith('tasks.json.backup.'))
    .sort()
    .reverse();

  // Remove old backups beyond limit
  for (const oldBackup of backups.slice(maxBackups)) {
    const { unlink } = await import('node:fs/promises');
    await unlink(resolve(backupDir, oldBackup));
  }
}
```

---

## 2. Auto-Repair Operations

### 2.1 Remove Orphaned Dependencies

```typescript
interface RepairResult {
  repaired: boolean;
  itemsRepaired: number;
  backupPath?: string;
}

async function repairOrphanedDependencies(
  backlog: Backlog,
  backupPath: string
): Promise<RepairResult> {
  let itemsRepaired = 0;

  // Create repair function
  const repairItem = (item: HierarchicalItem): void => {
    if (!item.dependencies || item.dependencies.length === 0) {
      return;
    }

    // Get all valid task IDs
    const allIds = new Set<string>();
    const collect = (i: HierarchicalItem): void => {
      allIds.add(i.id);
      if ('milestones' in i) i.milestones.forEach(collect);
      if ('tasks' in i) i.tasks.forEach(collect);
      if ('subtasks' in i) i.subtasks.forEach(collect);
    };
    backlog.backlog.forEach(collect);

    // Filter out orphaned dependencies
    const originalLength = item.dependencies.length;
    item.dependencies = item.dependencies.filter(id => allIds.has(id));

    if (item.dependencies.length < originalLength) {
      itemsRepaired++;
    }

    // Recursively repair nested items
    if ('milestones' in item) {
      item.milestones.forEach(repairItem);
    }
    if ('tasks' in item) {
      item.tasks.forEach(repairItem);
    }
    if ('subtasks' in item) {
      item.subtasks.forEach(repairItem);
    }
  };

  // Repair all phases
  backlog.backlog.forEach(repairItem);

  return {
    repaired: itemsRepaired > 0,
    itemsRepaired,
  };
}
```

### 2.2 Break Circular Dependencies

```typescript
async function repairCircularDependencies(
  backlog: Backlog,
  cycles: string[][],
  backupPath: string
): Promise<RepairResult> {
  let itemsRepaired = 0;

  for (const cycle of cycles) {
    // Strategy: Remove last dependency in the cycle
    // The last task depends on the first, creating the cycle
    const lastTaskId = cycle[cycle.length - 2]; // Second-to-last
    const firstTaskId = cycle[0];

    // Find and remove the circular dependency
    const findAndRepair = (item: HierarchicalItem): boolean => {
      if (item.id === lastTaskId && item.dependencies) {
        const idx = item.dependencies.indexOf(firstTaskId);
        if (idx !== -1) {
          item.dependencies.splice(idx, 1);
          itemsRepaired++;
          return true;
        }
      }

      if ('milestones' in item) {
        for (const m of item.milestones) {
          if (findAndRepair(m)) return true;
        }
      }
      if ('tasks' in item) {
        for (const t of item.tasks) {
          if (findAndRepair(t)) return true;
        }
      }
      if ('subtasks' in item) {
        for (const s of item.subtasks) {
          if (findAndRepair(s)) return true;
        }
      }
      return false;
    };

    for (const phase of backlog.backlog) {
      if (findAndRepair(phase)) break;
    }
  }

  return {
    repaired: itemsRepaired > 0,
    itemsRepaired,
  };
}
```

### 2.3 Fix Missing Required Fields

```typescript
async function repairMissingFields(
  backlog: Backlog,
  backupPath: string
): Promise<RepairResult> {
  let itemsRepaired = 0;

  const repairItem = (item: HierarchicalItem): void => {
    // Ensure dependencies array exists
    if (!item.dependencies) {
      item.dependencies = [];
      itemsRepaired++;
    }

    // Recursively repair
    if ('milestones' in item) {
      for (const m of item.milestones) {
        if (!m.dependencies) {
          m.dependencies = [];
          itemsRepaired++;
        }
        repairItem(m);
      }
    }
    if ('tasks' in item) {
      for (const t of item.tasks) {
        if (!t.dependencies) {
          t.dependencies = [];
          itemsRepaired++;
        }
        repairItem(t);
      }
    }
    if ('subtasks' in item) {
      for (const s of item.subtasks) {
        if (!s.dependencies) {
          s.dependencies = [];
          itemsRepaired++;
        }
        repairItem(s);
      }
    }
  };

  backlog.backlog.forEach(repairItem);

  return {
    repaired: itemsRepaired > 0,
    itemsRepaired,
  };
}
```

---

## 3. Combined Repair Function

```typescript
interface AutoRepairOptions {
  createBackup?: boolean;
  maxBackups?: number;
  repairOrphans?: boolean;
  repairCircular?: boolean;
  repairMissing?: boolean;
}

async function autoRepairBacklog(
  backlog: Backlog,
  sessionPath: string,
  validation: StateValidationResult,
  options: AutoRepairOptions = {}
): Promise<RepairResult> {
  const tasksPath = resolve(sessionPath, 'tasks.json');
  let backupPath: string | undefined;
  let totalRepaired = 0;

  // Create backup before any repairs
  if (options.createBackup !== false) {
    backupPath = await createBackup(tasksPath, {
      maxBackups: options.maxBackups || 5,
    });
  }

  // Repair orphaned dependencies
  if (options.repairOrphans !== false && validation.orphanedDeps) {
    const result = await repairOrphanedDependencies(backlog, backupPath!);
    totalRepaired += result.itemsRepaired;
  }

  // Repair circular dependencies
  if (options.repairCircular !== false && validation.circularDeps) {
    const result = await repairCircularDependencies(
      backlog,
      [validation.circularDeps],
      backupPath!
    );
    totalRepaired += result.itemsRepaired;
  }

  // Repair missing fields
  if (options.repairMissing !== false) {
    const result = await repairMissingFields(backlog, backupPath!);
    totalRepaired += result.itemsRepaired;
  }

  // Write repaired backlog
  if (totalRepaired > 0) {
    const { writeTasksJSON } = await import('./session-utils.js');
    await writeTasksJSON(sessionPath, backlog);
  }

  return {
    repaired: totalRepaired > 0,
    itemsRepaired: totalRepaired,
    backupPath,
  };
}
```

---

## 4. User Confirmation Pattern

```typescript
import { createInterface } from 'node:readline';

async function promptForRepair(
  validation: StateValidationResult
): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    console.log('\n⚠️  State validation found issues:\n');

    if (validation.circularDeps) {
      console.log(
        `  Circular dependencies: ${validation.circularDeps.join(' → ')}`
      );
    }
    if (validation.orphanedDeps) {
      console.log(`  Orphaned dependencies: ${validation.orphanedDeps.length}`);
    }
    if (validation.statusInconsistencies) {
      console.log(
        `  Status inconsistencies: ${validation.statusInconsistencies.length}`
      );
    }

    rl.question('\nAttempt auto-repair? (y/N): ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}
```

---

## 5. Complete validate-state Command Flow

```typescript
export class ValidateStateCommand {
  async execute(options: ValidateStateOptions): Promise<void> {
    const { getLogger } = await import('../utils/logger.js');
    const logger = getLogger('validate-state');

    // 1. Load backlog
    const { readTasksJSON } = await import('../core/session-utils.js');
    const backlog = await readTasksJSON(options.sessionPath);

    // 2. Run validations
    const validation = await this.runValidations(backlog, options);

    // 3. Output results
    this.outputResults(validation, options.output);

    // 4. Exit if valid
    if (validation.isValid) {
      logger.info('✓ State validation passed');
      process.exit(0);
    }

    // 5. Handle issues
    if (options.autoRepair) {
      logger.info('Attempting auto-repair...');

      const result = await this.autoRepair(
        backlog,
        options.sessionPath,
        validation,
        options
      );

      if (result.repaired) {
        logger.info(`✓ Repaired ${result.itemsRepaired} items`);
        logger.info(`Backup: ${result.backupPath}`);
      }
    } else if (process.stdin.isTTY) {
      // Interactive mode
      const shouldRepair = await promptForRepair(validation);
      if (shouldRepair) {
        // ... run repair
      }
    }

    // 6. Exit with error code if still invalid
    process.exit(1);
  }

  async runValidations(
    backlog: Backlog,
    options: ValidateStateOptions
  ): Promise<StateValidationResult> {
    const results: StateValidationResult = { isValid: true };

    // Zod schema validation
    if (options.checkSchema) {
      try {
        BacklogSchema.parse(backlog);
      } catch (error) {
        results.isValid = false;
        results.schemaErrors = error.errors;
      }
    }

    // Circular dependencies
    if (options.checkCircular) {
      const graph = buildDependencyGraph(backlog);
      const cycleResult = detectCircularDependencies(graph);
      if (cycleResult.hasCycle) {
        results.isValid = false;
        results.circularDeps = [cycleResult.cycle!.join(' → ')];
      }
    }

    // Orphaned dependencies
    if (options.checkOrphans) {
      // ... check orphans
    }

    // Status consistency
    if (options.checkStatus) {
      // ... check status
    }

    return results;
  }

  outputResults(
    validation: StateValidationResult,
    format: 'table' | 'json' | 'yaml'
  ): void {
    if (format === 'json') {
      console.log(JSON.stringify(validation, null, 2));
    } else if (format === 'yaml') {
      const yaml = require('yaml');
      console.log(yaml.stringify(validation));
    } else {
      // Table format
      console.log('\nState Validation Results');
      console.log('========================\n');
      console.log(`Valid: ${validation.isValid ? '✓ Yes' : '✗ No'}`);
      // ... more table output
    }
  }
}
```

---

## 6. Test Pattern for Validation

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ValidateStateCommand } from '../src/cli/commands/validate-state.js';
import { BacklogSchema } from '../src/core/models.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ValidateStateCommand', () => {
  const testDir = resolve('.tmp-validate-state-test');

  beforeEach(() => {
    // Cleanup test directory
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  it('should detect circular dependencies', async () => {
    // Create backlog with circular dep
    const backlog = {
      backlog: [
        {
          type: 'Phase',
          id: 'P1',
          title: 'Test Phase',
          status: 'Planned',
          milestones: [],
          dependencies: ['P2'], // Circular
        },
        {
          type: 'Phase',
          id: 'P2',
          title: 'Test Phase 2',
          status: 'Planned',
          milestones: [],
          dependencies: ['P1'], // Circular
        },
      ],
    };

    // Write tasks.json
    const tasksPath = resolve(testDir, 'tasks.json');
    writeFileSync(tasksPath, JSON.stringify(backlog, null, 2));

    // Run validation
    const command = new ValidateStateCommand();
    const result = await command.execute({
      sessionPath: testDir,
      output: 'json',
    });

    expect(result.isValid).toBe(false);
    expect(result.circularDeps).toBeDefined();
    expect(result.circularDeps).toContain('P1 → P2 → P1');
  });

  it('should detect orphaned dependencies', async () => {
    // Test orphan detection
    // ...
  });

  it('should create backup before repair', async () => {
    // Test backup creation
    // ...
  });
});
```

---

## References

### External Resources

- Node.js fs.promises documentation
- Atomic write pattern: https://blog.heroku.com/better-file-writes-with-node
- File locking: https://github.com/moxystudio/node-proper-lockfile

### Related Code

- `src/core/session-utils.ts` - atomicWrite() pattern
- `tests/unit/core/session-utils.test.ts` - test patterns
