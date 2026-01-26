# CLI Command Patterns Research for Cache Management

## Executive Summary

This document captures the CLI command patterns used in the hacky-hack codebase for implementing new `prd cache` subcommands.

## 1. Main CLI Entry Point Pattern

**File**: `src/cli/index.ts`

The main CLI uses Commander.js with this structure:

```typescript
import { Command } from 'commander';

const program = new Command();
program
  .name('prp-pipeline')
  .description('PRD to PRP Pipeline - Automated software development')
  .version('1.0.0');
```

## 2. Subcommand Registration Pattern

### Standard Subcommand Template

```typescript
program
  .command('cache')
  .description('Cache management operations')
  .argument('[action]', 'Action: stats, clean, clear', 'stats')
  .option('--force', 'Force action without confirmation', false)
  .option('--dry-run', 'Show what would be done without executing', false)
  .option('-o, --output <format>', 'Output format: table, json', 'table')
  .action(async (action, options) => {
    try {
      const cacheCommand = new CacheCommand();
      await cacheCommand.execute(action, options);
      process.exit(0);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Cache command failed: ${errorMessage}`);
      process.exit(1);
    }
  });
```

### Existing Subcommand Examples

**Inspect Command** (lines 280-306):
```typescript
program
  .command('inspect')
  .description('Inspect pipeline state and session details')
  .option('-o, --output <format>', 'Output format (table, json, yaml, tree)', 'table')
  .option('--task <id>', 'Show detailed information for specific task')
  .option('-f, --file <path>', 'Override tasks.json file path')
  .option('--session <id>', 'Inspect specific session by hash')
  .action(async options => {
    try {
      const inspectCommand = new InspectCommand();
      await inspectCommand.execute(options as InspectorOptions);
      process.exit(0);
    } catch (error) {
      logger.error(`Inspect command failed: ${errorMessage}`);
      process.exit(1);
    }
  });
```

**Artifacts Command** (lines 309-333):
```typescript
program
  .command('artifacts')
  .description('View and compare pipeline artifacts')
  .argument('[action]', 'Action: list, view, diff', 'list')
  .option('--session <id>', 'Session ID')
  .option('--task <id>', 'Task ID (for view)')
  .option('-o, --output <format>', 'Output format: table, json', 'table')
  .action(async (action, options) => {
    try {
      const artifactsCommand = new ArtifactsCommand(planDir, prdPath);
      await artifactsCommand.execute(action, options);
      process.exit(0);
    } catch (error) {
      logger.error(`Artifacts command failed: ${errorMessage}`);
      process.exit(1);
    }
  });
```

## 3. Command Class Pattern

**File**: `src/cli/commands/cache.ts` (to be created)

### Standard Command Class Structure

```typescript
import { resolve } from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getLogger } from '../../utils/logger.js';

const logger = getLogger('CacheCommand');

export interface CacheOptions {
  output: 'table' | 'json';
  force: boolean;
  dryRun: boolean;
}

export class CacheCommand {
  readonly #planDir: string;
  readonly #prdPath: string;

  constructor(
    planDir: string = resolve('plan'),
    prdPath: string = resolve('PRD.md')
  ) {
    this.#planDir = planDir;
    this.#prdPath = prdPath;
  }

  async execute(action: string, options: CacheOptions): Promise<void> {
    try {
      switch (action) {
        case 'stats':
          await this.#showStats(options);
          break;
        case 'clean':
          await this.#cleanCache(options);
          break;
        case 'clear':
          await this.#clearCache(options);
          break;
        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.info('Valid actions: stats, clean, clear');
          process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );
      logger.error({ error }, 'Cache command failed');
      process.exit(1);
    }
  }

  async #showStats(options: CacheOptions): Promise<void> {
    // Implementation
  }

  async #cleanCache(options: CacheOptions): Promise<void> {
    // Implementation
  }

  async #clearCache(options: CacheOptions): Promise<void> {
    // Implementation
  }
}
```

## 4. Return Type Pattern

Update the return type of `parseCLIArgs()`:

```typescript
export function parseCLIArgs():
  | ValidatedCLIArgs
  | { subcommand: 'inspect'; options: InspectorOptions }
  | { subcommand: 'artifacts'; options: Record<string, unknown> }
  | { subcommand: 'validate-state'; options: Record<string, unknown> }
  | { subcommand: 'cache'; options: CacheOptions } {
  // ... implementation
```

## 5. Subcommand Detection Pattern

```typescript
// Parse arguments
program.parse(process.argv);

// Check if a subcommand was invoked
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === 'cache') {
  return {
    subcommand: 'cache',
    options: {},
  };
}
```

## 6. Output Formatting Pattern

### Table Formatting (using cli-table3)

```typescript
import Table from 'cli-table3';

#formatStatsTable(stats: CacheStatistics): string {
  const table = new Table({
    head: [
      chalk.cyan('Metric'),
      chalk.cyan('Value'),
    ],
    colWidths: [30, 20],
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  });

  table.push(['Total Entries', stats.totalEntries]);
  table.push(['Cache Hits', stats.hits]);
  table.push(['Cache Misses', stats.misses]);
  table.push(['Hit Ratio', `${stats.hitRatio.toFixed(1)}%`]);

  return table.toString();
}
```

### JSON Output

```typescript
if (options.output === 'json') {
  console.log(JSON.stringify(stats, null, 2));
} else {
  console.log(this.#formatStatsTable(stats));
}
```

## 7. Dry-Run Pattern

```typescript
async #cleanCache(options: CacheOptions): Promise<void> {
  const expiredEntries = await this.#findExpiredEntries();

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - would remove:'));
    for (const entry of expiredEntries) {
      console.log(`  - ${entry.taskId} (${entry.path})`);
    }
    console.log(`\nTotal: ${expiredEntries.length} entries`);
    return;
  }

  // Actual cleanup
  for (const entry of expiredEntries) {
    await fs.unlink(entry.path);
  }
}
```

## 8. Confirmation Prompt Pattern

```typescript
async #clearCache(options: CacheOptions): Promise<void> {
  const allEntries = await this.#findAllEntries();

  if (!options.force) {
    console.log(chalk.yellow(`About to remove ${allEntries.length} cache entries`));
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>(resolve => {
      rl.question('Continue? (y/N): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.gray('Cancelled'));
      return;
    }
  }

  // Actual clear
  for (const entry of allEntries) {
    await fs.unlink(entry.path);
  }
}
```

## 9. Error Handling Pattern

```typescript
async #executeWithErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error }, `${operation} failed`);
    console.error(chalk.red(`Error: ${message}`));
    throw error;
  }
}
```

## 10. Integration Checklist

### Files to Create

1. **`src/cli/commands/cache.ts`** - Cache command implementation
2. **`src/utils/cache-manager.ts`** - CacheManager utility class

### Files to Modify

1. **`src/cli/index.ts`**:
   - Import CacheCommand
   - Add .command() registration
   - Update return type
   - Add subcommand detection

### Required Imports

```typescript
// In src/cli/index.ts
import { CacheCommand, type CacheOptions } from './commands/cache.js';
```

## 11. Key Patterns Summary

| Pattern | Description |
|---------|-------------|
| **Class-based** | All commands are classes with execute() method |
| **Private methods** | Use `#` prefix for private methods |
| **Chalk for colors** | chalk for terminal coloring |
| **Table formatting** | cli-table3 for table output |
| **Session integration** | Commands work with SessionManager |
| **Path resolution** | resolve() for absolute paths |
| **Exit codes** | process.exit(0) success, process.exit(1) failure |
| **Dry-run support** | Show what would be done |
| **Force flag** | Bypass confirmation prompts |
| **Multi-format output** | table and json formats |
