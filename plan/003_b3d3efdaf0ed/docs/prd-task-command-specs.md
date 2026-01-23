# PRD Task Command Specifications

## Summary

Complete specifications for the `prd task` command subcommands as documented in system_context.md. This includes command definitions, behavior specifications, and implementation requirements.

## Command Structure

```bash
prd task              # Show tasks for current session
prd task next         # Get next task
prd task status       # Show status
prd task -f <file>    # Override with specific file
```

## Command Specifications

### 1. `prd task` (Default/List)

**Behavior**: Display all tasks for the current session

**Output Format**:

```
Current Session: 001_14b9dc2a33c7
==================================================

P1: Phase 1: System Validation & Verification - Complete
  P1.M1: Milestone 1.1: Core Component Verification - Complete
    P1.M1.T1.S1: Verify session directory structure - Complete (1 points)
    P1.M1.T1.S2: Verify PRD hash-based change detection - Complete (1 points)
  P1.M2: Milestone 1.2: PRD Requirement Coverage - Researching
    P1.M2.T1.S1: Verify tasks.json as single source of truth - Complete (1 points)
    P1.M2.T1.S2: Verify plan/ directory structure - Implementing (1 points)
```

**Discovery Priority**:

1. Bugfix session tasks (if incomplete)
2. Main session tasks

### 2. `prd task next`

**Behavior**: Return the next executable task based on DFS traversal

**Output Format**:

```
Next Task: P1.M2.T1.S2
Status: Implementing
Title: Verify plan/ directory structure and artifacts
Points: 1

Context Scope: CONTRACT DEFINITION: ...
```

**Task Selection Logic**:

- Find first task with status 'Planned' or 'Researching'
- Respect dependency ordering
- Bugfix tasks prioritized over main tasks

### 3. `prd task status`

**Behavior**: Show task counts grouped by status

**Output Format**:

```
Task Status Summary
==================================================

Planned: 45
Researching: 8
Implementing: 3
Complete: 127
Failed: 0
Obsolete: 2

Total: 185 tasks
```

**Status Values**:

- `Planned` - Initial state, not started
- `Researching` - PRP generation in progress
- `Implementing` - Code execution in progress
- `Complete` - Finished successfully
- `Failed` - Execution failed
- `Obsolete` - Deprecated/replaced

### 4. `prd task -f <file>`

**Behavior**: Override the default tasks.json file with a specific file

**Usage Examples**:

```bash
prd task -f ./custom/tasks.json
prd task -f ../backup/session-tasks.json
prd task -f plan/002_1e734971e481/tasks.json
```

**File Discovery**:

1. If `-f` is provided, use that file
2. Otherwise, discover session based on PRD hash
3. Create session path: `plan/{sequence}_{hash}/tasks.json`

**Error Handling**:

- File not found: Error message with suggested paths
- Invalid JSON: Parse error with line number
- Invalid schema: Validation error with missing fields

## Session Discovery

### Session Directory Pattern

```
plan/
├── {sequence}_{hash}/              # Session directory
│   ├── tasks.json                  # Task registry
│   ├── prd_snapshot.md             # PRD at session start
│   ├── parent_session.txt          # Parent (delta sessions)
│   ├── architecture/               # Research artifacts
│   ├── prps/                       # PRP documents
│   └── artifacts/                  # Implementation artifacts
```

**Naming Convention**: `{sequence:03d}_{hash:12h}`

- Sequence: 3-digit zero-padded (001, 002, ...)
- Hash: First 12 characters of PRD's SHA-256

### Bugfix Session Discovery

Bugfix sessions are nested under main sessions:

```
plan/001_14b9dc2a33c7/bugfix/001_8d809cc989b9/
```

**Priority Order**:

1. Incomplete bugfix session tasks
2. Main session tasks

## Task Discovery Priority

As specified in system_context.md:

1. **Incomplete bugfix session tasks** - First priority
   - Search for `plan/*/bugfix/*/tasks.json`
   - Check if any tasks have status != 'Complete'
   - Load most recent incomplete bugfix session

2. **Main session tasks** - Second priority
   - Search for `plan/*/*/tasks.json` (non-bugfix)
   - Load based on current PRD hash
   - Create new session if PRD changed

## Integration Points

### CLI Parser (src/cli/index.ts)

Currently uses Commander.js with options only. Need to add:

```typescript
program
  .command('task')
  .description('Show and manage tasks')
  .option('-f, --file <path>', 'Override tasks.json file')
  .action(async options => {
    // Handle 'prd task' (list)
    // Handle 'prd task next'
    // Handle 'prd task status'
  });
```

### Session Manager (src/core/session-manager.ts)

Existing methods to use:

- `loadSession(path: string)` - Load session from directory
- `getCurrentSession()` - Get current session state
- `discoverSessions()` - Find available sessions

### Task Orchestrator (src/core/task-orchestrator.ts)

Existing methods to use:

- `processNextItem()` - Get next task
- `executionQueue` - Current task queue
- `currentItemId` - Currently executing task

## Testing Requirements

### Integration Test Coverage

The test file `tests/integration/prd-task-command.test.ts` must verify:

1. **Task Display**: `prd task` shows current session tasks
2. **Next Task**: `prd task next` returns correct next executable task
3. **Status Display**: `prd task status` shows correct counts
4. **File Override**: `prd task -f <file>` loads specified file
5. **Bugfix Priority**: Bugfix tasks prioritized over main tasks
6. **Session Discovery**: Correct session directory discovery
7. **Error Handling**: Invalid files produce helpful errors

### Mock Requirements

- Mock session directories with tasks.json files
- Mock bugfix and main sessions
- Mock TaskOrchestrator for next task logic
- Mock SessionManager for session loading

## References

- **system_context.md**: `plan/003_b3d3efdaf0ed/docs/system_context.md:536-549`
- **CLI Handler**: `src/cli/index.ts`
- **Session Manager**: `src/core/session-manager.ts`
- **Task Orchestrator**: `src/core/task-orchestrator.ts`
- **Models**: `src/core/models.ts` (task hierarchy types)
