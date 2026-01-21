# SessionManager and Task State Management Analysis

## Summary

Comprehensive analysis of SessionManager implementation, task models, and state management patterns for creating integration tests that verify tasks.json as the single source of truth.

## 1. SessionManager Implementation

**File**: `src/core/session-manager.ts` (1172 lines)

### Key State Properties

```typescript
class SessionManager {
  #currentSession: SessionState | null; // Current loaded session
  #dirty: boolean; // Flag indicating pending changes
  #pendingUpdates: Backlog | null; // Latest accumulated backlog state
  #updateCount: number; // Count of accumulated updates
}
```

### Core State Operations

| Method                             | Purpose                                     | Atomic       | Line Reference |
| ---------------------------------- | ------------------------------------------- | ------------ | -------------- |
| `saveBacklog(backlog)`             | Persists backlog to tasks.json              | Yes          | 636            |
| `loadBacklog()`                    | Loads and validates backlog from tasks.json | N/A          | 740            |
| `updateItemStatus(itemId, status)` | Immutable update with batching              | No (batched) | 768            |
| `flushUpdates()`                   | Atomically flushes accumulated updates      | Yes          | 670            |

### State Update Flow

```
Component → SessionManager.updateItemStatus()
  → task-utils.updateItemStatus() (immutable update)
  → SessionManager.#pendingUpdates = updated
  → SessionManager.#dirty = true
  → SessionManager.#updateCount++
  → (later) SessionManager.flushUpdates()
  → SessionManager.saveBacklog()
  → session-utils.writeTasksJSON()
  → atomicWrite()
  → tasks.json
```

### Batching Mechanism

Updates are accumulated in memory for performance:

```typescript
// From session-manager.ts lines 777-782
this.#pendingUpdates = updated; // Accumulate in memory
this.#dirty = true;
this.#updateCount++;
// No immediate write - waits for flushUpdates()
```

## 2. Task Models

**File**: `src/core/models.ts`

### Hierarchy Structure

```typescript
interface Backlog {
  readonly backlog: Phase[];
}

interface Phase {
  readonly id: string; // "P1"
  readonly type: 'Phase';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly milestones: Milestone[];
}

interface Milestone {
  readonly id: string; // "P1.M1"
  readonly type: 'Milestone';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly tasks: Task[];
}

interface Task {
  readonly id: string; // "P1.M1.T1"
  readonly type: 'Task';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly subtasks: Subtask[];
}

interface Subtask {
  readonly id: string; // "P1.M1.T1.S1"
  readonly type: 'Subtask';
  readonly title: string;
  readonly status: Status;
  readonly story_points: number;
  readonly dependencies: string[];
  readonly context_scope: string;
}
```

### Status Types

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

## 3. Atomic Write Pattern

**File**: `src/core/session-utils.ts` (lines 99-180)

```typescript
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  // Create unique temp filename with random bytes
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    // Write to temp file first
    await writeFile(tempPath, data, { mode: 0o644 });

    // Atomic rename operation (guaranteed atomic on POSIX)
    await rename(tempPath, targetPath);
  } catch (error) {
    // Cleanup temp file on error
    await unlink(tempPath).catch(() => {});
    throw error;
  }
}
```

### Key Benefits

1. **Corruption Prevention**: If process crashes during write, temp file is abandoned
2. **Atomic Visibility**: rename() is atomic - readers see either old or new, never partial
3. **Cleanup Safety**: Temp files are cleaned up on error

## 4. tasks.json Structure

**Location**: `{sessionDirectory}/tasks.json`

### Example Structure

```json
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P1",
      "title": "Phase 1: System Validation",
      "status": "Planned",
      "description": "Validate implementation matches PRD",
      "milestones": [
        {
          "type": "Milestone",
          "id": "P1.M1",
          "title": "Milestone 1.1: Core Verification",
          "status": "Implementing",
          "description": "Verify core components",
          "tasks": [
            {
              "type": "Task",
              "id": "P1.M1.T1",
              "title": "Task 1.1.1: Session Manager",
              "status": "Complete",
              "description": "Verify Session Manager",
              "subtasks": [
                {
                  "type": "Subtask",
                  "id": "P1.M1.T1.S1",
                  "title": "Verify directory structure",
                  "status": "Complete",
                  "story_points": 1,
                  "dependencies": [],
                  "context_scope": "CONTRACT DEFINITION:\n1. RESEARCH NOTE..."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## 5. Immutable Update Pattern

**File**: `src/core/task-utils.ts` (lines 301-399)

```typescript
export function updateItemStatus(
  backlog: Backlog,
  id: string,
  newStatus: Status
): Backlog {
  return {
    ...backlog,
    backlog: backlog.backlog.map(phase => {
      // Recursive search through hierarchy
      // Returns new objects with updated status
      // Preserves immutability
    }),
  };
}
```

### Why Immutable?

1. **Safety**: No shared mutable state
2. **Debugging**: Easy to trace state changes
3. **Batching**: Safe to accumulate updates without side effects

## 6. Session Lifecycle

### Initialization

```typescript
// From session-manager.ts
async initialize(): Promise<SessionState> {
  // 1. Hash PRD content
  const prdHash = this.#hashPRD();

  // 2. Search for existing session by hash
  const existingSession = this.#findSessionByHash(prdHash);

  // 3. If not found: create new session directory
  if (!existingSession) {
    const sessionPath = this.#createSessionDirectory(prdHash);
    // Create subdirectories: architecture/, prps/, artifacts/
    // Write prd_snapshot.md
    // Write initial empty tasks.json
  }

  // 4. Load tasks.json
  return this.loadSession();
}
```

### Session Structure

```
plan/
├── 001_14b9dc2a33c7/          # Session directory (sequence_hash)
│   ├── tasks.json              # Single source of truth for task state
│   ├── prd_snapshot.md         # PRD content hash
│   ├── parent_session.txt      # Delta linkage (optional)
│   ├── prps/                   # Generated PRPs
│   └── artifacts/              # Execution artifacts
```

## 7. Files That Read tasks.json

The following files READ from tasks.json but DO NOT duplicate state:

| File                                             | Purpose                      |
| ------------------------------------------------ | ---------------------------- |
| `src/core/session-manager.ts`                    | Primary state manager        |
| `src/core/task-orchestrator.ts`                  | Task traversal and execution |
| `tests/unit/core/session-manager.test.ts`        | Unit tests (mocked)          |
| `tests/integration/core/session-manager.test.ts` | Integration tests            |

## 8. Files That Write tasks.json

| File                          | Method             | Pattern                          |
| ----------------------------- | ------------------ | -------------------------------- |
| `src/core/session-utils.ts`   | `writeTasksJSON()` | Atomic write via `atomicWrite()` |
| `src/core/session-manager.ts` | `saveBacklog()`    | Delegates to `writeTasksJSON()`  |

**No other files write to tasks.json** - this is the single source of truth.

## 9. Backup/Temp File Handling

### Temp File Creation

- **Pattern**: `.{basename}.{randomHex}.tmp`
- **Location**: Same directory as target (for atomic rename)
- **Cleanup**: Automatic on error

### When Backups Are Created

The system does **NOT** create backup files. The atomic write pattern ensures:

- No partial writes if process crashes
- Always valid state on disk
- No need for backup restoration

### Temp File Cleanup

```typescript
// From session-utils.ts lines 166-177
try {
  await unlink(tempPath);
  logger.debug({ tempPath, operation: 'cleanup' }, 'Temp file cleaned up');
} catch (cleanupError) {
  logger.warn(
    {
      tempPath,
      cleanupErrorCode: (cleanupError as NodeJS.ErrnoException)?.code,
    },
    'Failed to clean up temp file'
  );
}
```

## 10. Key Findings for Testing

### Single Source of Truth Verification

1. **All state updates flow through SessionManager**
   - Path: Component → SessionManager → tasks.json
   - No direct file writes bypass SessionManager

2. **No state duplication**
   - tasks.json is the ONLY persistent state file for task hierarchy
   - Other files reference it but don't duplicate it

3. **Atomic persistence**
   - Write operations use temp file + rename pattern
   - Prevents corruption during crashes

4. **Immutable updates**
   - All updates use immutable patterns via `task-utils.ts`
   - Safe to accumulate in memory before flush

### Test Strategy

To verify tasks.json is the single source of truth:

1. **Test state flow**: Verify all updates go through SessionManager
2. **Test no duplication**: Verify no other files contain task state
3. **Test atomic writes**: Verify temp file + rename pattern
4. **Test cleanup**: Verify temp files are cleaned up after successful writes
5. **Test schema validation**: Verify Zod validation prevents malformed tasks.json
6. **Test authority**: Verify tasks.json is the authoritative source for task execution
