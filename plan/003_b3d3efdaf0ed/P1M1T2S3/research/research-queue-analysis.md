# ResearchQueue Implementation Analysis

## Overview

**File**: `src/core/research-queue.ts`
**Purpose**: Manages parallel PRP generation with concurrency limit of 3, fire-and-forget error handling

## Complete API

### Constructor

```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false
)
```

### Public Methods

| Method          | Signature                                                             | Purpose                                         |
| --------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| `enqueue`       | `async enqueue(task: TaskOrSubtask, backlog: Backlog): Promise<void>` | Add task to queue for background PRP generation |
| `isResearching` | `isResearching(taskId: string): boolean`                              | Check if task is currently being processed      |
| `getPRP`        | `getPRP(taskId: string): PRPDocument \| null`                         | Get cached PRP for task                         |
| `waitForPRP`    | `async waitForPRP(taskId: string): Promise<PRPDocument>`              | Wait for PRP generation to complete             |
| `getStats`      | `getStats(): { queued: number; researching: number; cached: number }` | Get queue statistics                            |
| `clearCache`    | `clearCache(): void`                                                  | Clear cached PRP results                        |

## Key Implementation Details

### Concurrency Limiting (Lines 143-145)

```typescript
if (this.queue.length === 0 || this.researching.size >= this.maxSize) {
  return;
}
```

- `maxSize` defaults to 3 but is configurable
- Tracks in-flight promises in `researching` Map
- New tasks only start if `researching.size < maxSize`

### Fire-and-Forget Pattern (Lines 159-197)

```typescript
const promise = this.#prpGenerator
  .generate(task, backlog)
  .then(prp => {
    this.results.set(task.id, prp);
    return prp;
  })
  .catch(error => {
    // Log error but don't cache failed results
    this.logger.error(`PRP generation failed for ${task.id}: ${error.message}`);
    throw error; // Re-throw for waitForPRP
  })
  .finally(() => {
    this.researching.delete(task.id);
    // Recursive fire-and-forget - start next task
    this.processNext(backlog).catch(error => {
      this.logger.error(`Background task failed: ${error.message}`);
    });
  });

this.researching.set(task.id, promise);
```

Key points:

1. Errors are logged with structured logging
2. Failed results are NOT cached (line 163 skipped)
3. Error is re-thrown for `waitForPRP` to handle
4. `finally` block ensures cleanup even on failure
5. Background failures in `finally` don't block queue processing

### Cache Deduplication (Lines 119-122)

```typescript
if (this.results.has(task.id)) {
  return;
}
```

- Simple deduplication by task ID
- Cache is checked before enqueuing
- Actual cache logic (hash, TTL) is in PRPGenerator

### Dependency Ordering

**CRITICAL**: ResearchQueue does NOT implement dependency ordering:

- Simple FIFO queue
- No consideration of task dependencies
- Dependencies handled by TaskOrchestrator (caller)

### Internal State Management

Three core data structures:

| Property      | Type                                | Purpose                                |
| ------------- | ----------------------------------- | -------------------------------------- |
| `queue`       | `TaskOrSubtask[]`                   | Pending tasks waiting to be researched |
| `researching` | `Map<string, Promise<PRPDocument>>` | In-flight PRP generations              |
| `results`     | `Map<string, PRPDocument>`          | Completed PRP results                  |

## Dependencies

```typescript
import { PRPGenerator } from '../agents/prp-generator.js';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';
import type { PRPDocument, Task, Subtask, Backlog } from './models.js';
import type { SessionManager } from '../core/session-manager.js';
```

## Testing Considerations

### Mockable Components

1. **PRPGenerator** - Primary mock target
2. **Logger** - Verify error logging
3. **SessionManager** - Minimal mocking needed

### Test Hooks

- `isResearching(taskId)` - Check if task is in-flight
- `getStats()` - Monitor queue state during tests
- `getPRP(taskId)` - Check cached results
- `clearCache()` - Reset state between tests

### Edge Cases to Test

1. **Race Conditions**:
   - Multiple enqueues of same task (deduplication)
   - `processNext()` called simultaneously
   - Tasks complete while `maxSize` changes

2. **Error Scenarios**:
   - PRPGenerator throws during generation
   - Background task fails in `finally` block
   - Mixed success/failure in same queue

3. **Concurrency Boundaries**:
   - Behavior when reaching `maxSize` limit
   - Verify no more than `maxSize` tasks run simultaneously
   - Test with `maxSize = 0` (no processing)

4. **State Consistency**:
   - Tasks removed from `researching` after completion
   - Failed tasks don't appear in cache
   - `clearCache()` doesn't affect in-flight operations

## Integration with Previous Work Item (P1.M1.T2.S2)

The previous PRP creates unit tests for `canExecute()` and `getBlockingDependencies()` in TaskOrchestrator. This integration test will verify:

1. ResearchQueue respects the dependency checking done by TaskOrchestrator
2. Only tasks that pass `canExecute()` are enqueued for PRP generation
3. The queue processes tasks in the order they become unblocked

## Gotchas

1. **No Dependency Ordering**: ResearchQueue doesn't know about dependencies - the orchestrator must filter before enqueuing
2. **Failed Results Not Cached**: If generation fails, `getPRP()` returns null, task can be retried
3. **Fire-and-Forget Cleanup**: `finally` block always runs, ensuring state consistency
4. **Recursive processNext**: Each task completion triggers next task processing
5. **Concurrent Access**: Multiple calls to `processNext()` are safe (idempotent)
