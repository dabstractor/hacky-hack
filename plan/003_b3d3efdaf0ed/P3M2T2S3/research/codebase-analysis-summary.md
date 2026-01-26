# Codebase Analysis Summary: State Validation Tools

## Research Date
2026-01-24

## Purpose
Analyze the codebase to find existing patterns for implementing a `prd validate-state` CLI command.

---

## 1. Task Models and Data Structures

### File: `src/core/models.ts`

**Status Enum** (lines 137-144)
```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

**Item Type Enum** (line 186)
```typescript
export type ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask';
```

**Backlog Interface** (lines 671-683)
```typescript
export interface Backlog {
  readonly backlog: Phase[];
  readonly metadata?: BacklogMetadata;
}
```

**Hierarchy Interfaces:**
- `Subtask` (lines 233-295): `dependencies: string[]`, `context_scope`, `story_points`
- `Task` (lines 370-406): `subtasks: Subtask[]`, `dependencies: string[]`
- `Milestone` (lines 465-500): `tasks: Task[]`, `dependencies: string[]`
- `Phase` (lines 562-596): `milestones: Milestone[]`, `dependencies: string[]`

**Note**: Each level has `dependencies: string[]` array containing task IDs.

---

## 2. Zod Validation Schemas

### File: `src/core/models.ts`

**Existing Schemas:**
- `BacklogSchema` (lines 711-713)
- `PhaseSchema` (lines 621-630)
- `MilestoneSchema` (lines 524-538)
- `TaskSchema` (lines 430-442)
- `SubtaskSchema` (lines 320-337)
- `StatusEnum` (lines 161-169)
- `ItemTypeEnum` (line 203)

**Schema Usage Pattern:**
```typescript
// From src/core/session-utils.ts (line 502)
const validated = BacklogSchema.parse(parsed);
```

---

## 3. CLI Command Structure

### File: `src/cli/index.ts`

**Commander.js Pattern** (lines 187-188)
```typescript
program
  .name('prp-pipeline')
  .description('PRD to PRP Pipeline - Automated software development')
```

**Existing Subcommands:**
- `inspect` (lines 262-278)
- `artifacts` (lines 287-315)

**Subcommand Template Pattern:**
```typescript
program
  .command('inspect')
  .description('Inspect pipeline state and session details')
  .option('-o, --output <format>', 'Output format (table, json, yaml, tree)', 'table')
  .action(async options => {
    const inspectCommand = new InspectCommand();
    await inspectCommand.execute(options);
    process.exit(0);
  });
```

**CLI Options Pattern:**
```typescript
export interface CLIArgs {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  // ... more options
}
```

**Validation Location:** Lines 476-520 in cli/index.ts

---

## 4. SessionManager and tasks.json

### File: `src/core/session-manager.ts`

**Load Backlog** (line 557)
```typescript
async loadSession(prdPath: string, sessionPath?: string): Promise<Session>
```

### File: `src/core/session-utils.ts`

**Read with Validation** (lines 489-531)
```typescript
export async function readTasksJSON(sessionPath: string): Promise<Backlog> {
  const tasksPath = resolve(sessionPath, 'tasks.json');
  const content = await readFile(tasksPath, 'utf-8');
  const parsed = JSON.parse(content);
  const validated = BacklogSchema.parse(parsed);
  return validated;
}
```

**Atomic Write** (lines 98-180)
```typescript
export async function atomicWrite(
  path: string,
  content: string,
  options?: { mode?: number }
): Promise<void>
```

---

## 5. Existing Validation Patterns

### File: `src/core/dependency-validator.ts`

**Circular Dependency Detection** (line 32)
```typescript
export function detectCircularDeps(
  items: readonly HierarchicalItem[],
  itemType: ItemType
): void
```

**Pattern:** DFS with three-color marking (WHITE=0, GRAY=1, BLACK=2)

### File: `src/utils/errors.ts`

**Error Hierarchy:**
- `PipelineError` (base class)
- `SessionError` - File operations
- `TaskError` - Task execution
- `AgentError` - LLM calls
- `ValidationError` - Input validation

**Error Code Pattern:**
```typescript
PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME}
```

---

## 6. Task Utilities for Validation

### File: `src/core/task-utils.ts`

**Useful Functions:**
- `findItem(backlog, itemId)` (line 90) - Find item by ID
- `getDependencies(item, backlog)` (line 131) - Get flattened dependencies
- `filterByStatus(backlog, status)` (line 205) - Filter by status
- `getAllSubtasks(backlog)` (line 169) - Get all subtasks recursively

---

## 7. Test Patterns

### File: `tests/unit/core/session-utils.test.ts`

**SessionFileError Test Pattern:**
```typescript
describe('SessionFileError', () => {
  it('should create error with path, operation, and code', () => {
    const cause = new Error('ENOENT: no such file');
    const error = new SessionFileError('/test/path', 'read file', cause);
    expect(error.path).toBe('/test/path');
    expect(error.operation).toBe('read file');
    expect(error.code).toBe('ENOENT');
  });
});
```

**Mock Pattern:**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## 8. Integration Points for validate-state Command

### Required Files:
1. **NEW**: `src/cli/commands/validate-state.ts` - Main command class
2. **MODIFY**: `src/cli/index.ts` - Register the command
3. **NEW**: `src/core/state-validator.ts` - Validation logic
4. **NEW**: `tests/integration/validate-state.test.ts` - Tests

### Dependencies to Reuse:
- `BacklogSchema` from `src/core/models.ts`
- `readTasksJSON()` from `src/core/session-utils.ts`
- `atomicWrite()` from `src/core/session-utils.ts`
- `detectCircularDeps()` from `src/core/dependency-validator.ts`
- `ValidationError` from `src/utils/errors.ts`

### Command Registration Location:
After line 278 in `src/cli/index.ts` (after `inspect` command)

---

## 9. Key Implementation Patterns

### Command Class Structure:
```typescript
export class ValidateStateCommand {
  async execute(options: ValidateStateOptions): Promise<void> {
    // 1. Load tasks.json
    // 2. Run validations
    // 3. Output results
    // 4. Offer auto-repair if issues found
  }
}
```

### Validation Results Structure:
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}
```

### Backup Before Repair:
```typescript
// Create backup before auto-repair
const backupPath = `${sessionPath}/tasks.json.backup.${Date.now()}`;
await copyFile(tasksPath, backupPath);
```

---

## 10. Files to Reference in PRP

| File | Purpose | Key Lines |
|------|---------|-----------|
| `src/core/models.ts` | Task types, Zod schemas | 137-144, 233-295, 671-683 |
| `src/core/session-utils.ts` | Read/write tasks.json | 98-180, 489-531 |
| `src/core/dependency-validator.ts` | Circular dep detection | 32+ |
| `src/core/task-utils.ts` | Task traversal utilities | 90, 131, 169, 205 |
| `src/cli/index.ts` | Command registration | 187-315, 476-520 |
| `src/utils/errors.ts` | Error classes | 58-89, 100+ |
| `tests/unit/core/session-utils.test.ts` | Test patterns | Full file |
