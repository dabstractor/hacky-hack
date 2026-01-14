name: "P5.M2.T2.S1: Batch State Updates"
description: |

---

## Goal

**Feature Goal**: Implement batch state updates in SessionManager to reduce expensive writeTasksJSON() calls during task execution.

**Deliverable**:

1. Modified `SessionManager` class with dirty flag and pending updates tracking
2. Batched `updateItemStatus()` method that accumulates updates instead of immediate writes
3. New `flushUpdates()` method for atomic batch writes to disk
4. Modified `TaskOrchestrator` to call `flushUpdates()` after task completion
5. Shutdown-safe `flushUpdates()` integration in PRPPipeline
6. Logging of batch write statistics (items per write)

**Success Definition**:

- SessionManager accumulates status updates in memory during task execution
- Single atomic write occurs when `flushUpdates()` is called
- TaskOrchestrator calls `flushUpdates()` after each task completes
- PRPPipeline ensures `flushUpdates()` on shutdown
- Batch stats logged (items accumulated per write)
- All existing tests pass
- Zero TypeScript errors, zero linting errors

## User Persona

**Target User**: Pipeline developers and users experiencing slow execution due to frequent I/O operations.

**Use Case**: During pipeline execution, status updates occur 3 times per subtask (Researching → Implementing → Complete). With 50+ subtasks, this results in 150+ file writes per pipeline run, causing significant I/O overhead.

**User Journey**:

1. Developer runs pipeline: `npm run pipeline -- --prd ./PRD.md`
2. Each subtask execution causes 3 status updates (Previously: 3 writes)
3. Updates are accumulated in memory (dirty flag set)
4. After task completes, `flushUpdates()` writes all updates in one operation
5. On shutdown, any pending updates are flushed
6. Console logs: `Batch write: 15 items in 1 operation (13 write ops saved)`

**Pain Points Addressed**:

- **Expensive I/O**: Each writeTasksJSON() call involves disk I/O, atomic rename, and JSON serialization
- **Slow execution**: 150+ writes per pipeline run add significant latency
- **Disk wear**: Frequent writes reduce SSD lifespan
- **No visibility**: Current implementation doesn't expose I/O metrics

## Why

- **Performance**: Reducing 150+ writes to ~10 writes (1 per task) provides ~10-15x I/O reduction
- **Latency**: Atomic disk writes with JSON serialization take 5-20ms each; batching saves 1-3 seconds per pipeline
- **System health**: Fewer writes reduce disk wear and improve overall system responsiveness
- **Observability**: Batch stats logging provides visibility into I/O optimization
- **Dependency Chain**: Completes P5.M2.T2 (Optimize I/O Operations) complementing P5.M2.T1 (LLM Caching)

## What

Implement dirty flag pattern with pending updates tracking and batch flush for SessionManager state persistence.

### Success Criteria

- [ ] SessionManager adds `dirty: boolean` and `pendingUpdates: Backlog | null` properties
- [ ] `updateItemStatus()` modifies in-memory state without immediate write
- [ ] `flushUpdates()` writes pending updates atomically and resets dirty flag
- [ ] TaskOrchestrator calls `flushUpdates()` after task/subtask completion
- [ ] PRPPipeline cleanup calls `flushUpdates()` on shutdown
- [ ] Batch stats logged with items-per-operation count
- [ ] All existing tests pass with backward compatibility
- [ ] Zero TypeScript errors

---

## All Needed Context

### Context Completeness Check

_The implementing agent has everything needed: complete SessionManager implementation, TaskOrchestrator integration points, atomic write patterns from session-utils, testing patterns from existing tests, and understanding of the dirty flag pattern._

### Documentation & References

```yaml
# MUST READ - SessionManager Implementation
- file: src/core/session-manager.ts
  why: Primary class to modify for batching
  pattern: updateItemStatus() method (lines 465-486), saveBacklog() method (lines 407-417)
  section: updateItemStatus() calls saveBacklog() which calls writeTasksJSON()
  gotcha: Current implementation writes to disk on EVERY status update

# MUST READ - TaskOrchestrator Integration
- file: src/core/task-orchestrator.ts
  why: Understanding where to call flushUpdates() after task completion
  pattern: executeSubtask() method (lines 568-728), #updateStatus() method (lines 360-383)
  section: Lines 373 (updateItemStatus call), Lines 575, 627, 671-682 (status transitions)
  gotcha: Subtasks have 3 status updates each; flush should happen after subtask completes

# MUST READ - writeTasksJSON() Pattern
- file: src/core/session-utils.ts
  why: Understanding the atomic write pattern that flushUpdates() will use
  pattern: writeTasksJSON() function (lines 265-289), atomicWrite() helper
  section: Lines 265-289 for writeTasksJSON implementation
  gotcha: Uses temp file + rename pattern for atomic writes

# MUST READ - updateItemStatus Utility
- file: src/utils/task-utils.ts
  why: Pure function for immutable status updates that batching will use
  pattern: updateItemStatus() function (lines 261-364)
  section: Lines 261-364 (complete immutable update implementation)
  gotcha: Creates deep copy - we'll accumulate these in pendingUpdates

# MUST READ - PRPPipeline Shutdown
- file: src/workflows/prp-pipeline.ts
  why: Where to ensure flushUpdates() is called on shutdown
  pattern: cleanup() method (lines 940-1008), signal handlers (lines 232-266)
  section: Lines 940-1008 (cleanup implementation), line 979 (saveBacklog call)
  gotcha: Must call flushUpdates() before removing signal listeners

# MUST READ - SessionManager Tests
- file: tests/unit/core/session-manager.test.ts
  why: Follow existing test patterns when adding batch tests
  pattern: Module mocking (vi.mock), factory functions, setup/execute/verify
  section: Lines 1-100 (mock patterns and test setup)

# MUST READ - Structured Logger (from P5.M1.T1.S1)
- file: src/utils/logger.ts
  why: Use for logging batch write statistics with structured data
  pattern: getLogger('SessionManager') factory, info/debug levels
  section: Lines 1-200 (Logger interface and factory function)
  gotcha: Use .js extension in imports: "import { getLogger } from './logger.js';"

# MUST READ - TaskOrchestrator Tests
- file: tests/unit/core/task-orchestrator.test.ts
  why: Understanding how to test TaskOrchestrator integration with flushUpdates()
  pattern: Mock setup for SessionManager, verification of method calls
  section: Lines 1-100 (test patterns and mock setup)

# MUST READ - Shutdown Tests
- file: tests/integration/prp-pipeline-shutdown.test.ts
  why: Understanding how to test shutdown behavior with pending updates
  pattern: Signal handling verification, cleanup assertion
  section: Lines 1-100 (shutdown test patterns)

# MUST READ - Parallel Work Context
- file: plan/001_14b9dc2a33c7/P5M2T1S2/PRP.md
  why: P5.M2.T1.S2 implements PRP caching (parallel work)
  section: Full document - defines cache logging patterns to follow
  gotcha: P5.M2.T1.S2 adds PRP-level caching, P5.M2.T2.S1 adds I/O batching (independent)

# MUST READ - Previous Research Summary
- docfile: plan/001_14b9dc2a33c7/P5M2T2S1/research/session-manager-research.md
  why: Complete analysis of SessionManager, TaskOrchestrator, I/O patterns
  critical: Contains call frequency analysis (3 updates per subtask), integration points
  section: "Call Frequency Analysis" - understanding of I/O impact
```

### Current Codebase Tree

```bash
src/
├── core/                # Core business logic
│   ├── models.ts                # Backlog, Status type definitions
│   ├── session-manager.ts       # MODIFY: Add batching (dirty flag, pendingUpdates, flushUpdates)
│   ├── session-utils.ts         # writeTasksJSON() pattern - uses atomicWrite
│   ├── task-orchestrator.ts     # MODIFY: Call flushUpdates() after task completion
│   └── task-patcher.ts
├── utils/               # General utilities
│   ├── logger.ts                # Structured logging (Pino-based) from P5.M1.T1.S1
│   └── task-utils.ts            # updateItemStatus() utility for immutable updates
└── workflows/           # Workflow orchestrations
    └── prp-pipeline.ts          # MODIFY: Call flushUpdates() in cleanup()

tests/
├── unit/
│   └── core/
│       ├── session-manager.test.ts       # MODIFY: Add batching tests
│       └── task-orchestrator.test.ts     # MODIFY: Add flushIntegration tests
└── integration/
    └── prp-pipeline-shutdown.test.ts     # MODIFY: Verify flush on shutdown

plan/001_14b9dc2a33c7/
└── P5M2T2S1/
    └── PRP.md                          # THIS DOCUMENT
```

### Desired Codebase Tree

```bash
# Modified files:
src/core/
├── session-manager.ts                  # MODIFY: Add dirty flag, pendingUpdates, flushUpdates()
└── task-orchestrator.ts                # MODIFY: Call flushUpdates() after task completion

src/workflows/
└── prp-pipeline.ts                     # MODIFY: Call flushUpdates() in cleanup()

tests/unit/core/
├── session-manager.test.ts             # MODIFY: Add batch state update tests
└── task-orchestrator.test.ts           # MODIFY: Add flush integration tests

tests/integration/
└── prp-pipeline-shutdown.test.ts       # MODIFY: Verify flush on shutdown with dirty flag

# No new files or directories needed
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Understanding Current Behavior

// 1. updateItemStatus() IMMEDIATELY writes to disk
// Current pattern: updateItemStatus() -> saveBacklog() -> writeTasksJSON()
// This means 3 writes per subtask (Researching, Implementing, Complete)
// With 50 subtasks = 150 writes per pipeline run
// Gotcha: Must maintain backward compatibility for external callers

// 2. TaskOrchestrator #updateStatus() returns the updated backlog
// Pattern: const updated = await this.sessionManager.updateItemStatus(id, status);
// The caller expects the updated backlog returned immediately
// Gotcha: updateItemStatus() must still return updated backlog, just not write to disk

// 3. Atomic write pattern MUST be preserved
// Pattern: atomicWrite() uses temp file + rename to prevent corruption
// flushUpdates() MUST use this same pattern via writeTasksJSON()
// Gotcha: Never write directly to tasks.json - always use writeTasksJSON()

// 4. Shutdown MUST flush pending updates
// Pattern: PRPPipeline.cleanup() calls sessionManager.saveBacklog()
// Must add flushUpdates() call before cleanup completes
// Gotcha: Check dirty flag before calling writeTasksJSON() (avoid unnecessary write)

// 5. Logging follows structured format with metadata
// Pattern: logger.info({ itemsWritten, writeOpsSaved }, 'Batch write complete')
// Use info level for flush operations, debug for individual updates
// Gotcha: Log AFTER successful write, not before

// 6. Backlog type is immutable (readonly properties)
// Pattern: Spread operators create new objects, don't mutate originals
// pendingUpdates accumulates these new backlog objects
// Gotcha: Each updateItemStatus() call creates a new backlog - track the latest

// 7. flushUpdates() should be safe to call multiple times
// Pattern: If !dirty, return immediately (no-op)
// This prevents multiple writes when called from multiple places
// Gotcha: Always check dirty flag first

// 8. Test patterns use vi.mock() with hoisting
// Pattern: vi.mock('node:fs/promises') must be at top of file
// Mock setup in beforeEach() for each test
// Gotcha: Can't mock inside test functions - must use vi.mocked()

// 9. TaskOrchestrator has nested status update calls
// Pattern: executePhase() -> executeMilestone() -> executeTask() -> executeSubtask()
// Each level calls sessionManager.updateItemStatus()
// Gotcha: Best flush point is AFTER executeSubtask() completes

// 10. PRPPipeline signal handlers call cleanup()
// Pattern: SIGINT/SIGTERM -> this.cleanup() -> sessionManager.saveBacklog()
// Must ensure flushUpdates() is called before cleanup
// Gotcha: cleanup() is async - signals must be handled correctly

// 11. pendingUpdates should track the LATEST backlog state
// Pattern: Each updateItemStatus() creates new backlog, replace pendingUpdates with latest
// Reason: We only care about the final state, not the intermediate states
// Gotcha: Don't accumulate arrays - just keep the most recent backlog

// 12. Batch stats calculate write operations saved
// Pattern: itemsAccumulated = count updates since last flush
// writeOpsSaved = itemsAccumulated - 1 (one write for all items)
// Log: logger.info({ itemsWritten: N, writeOpsSaved: N-1 }, 'Batch write complete')
// Gotcha: Only log when dirty flag was set (actual write occurred)

// 13. ES Module imports: Use .js extension
// Pattern: import { getLogger } from '../utils/logger.js';
// Gotcha: TypeScript source uses .ts, runtime imports use .js

// 14. Error handling: Batch failures should preserve dirty state
// Pattern: try/catch around writeTasksJSON(), only clear dirty on success
// Reason: If write fails, we want to retry on next flush
// Gotcha: Don't reset dirty flag until write succeeds

// 15. Parallel execution with P5.M2.T1.S2
// That PRP creates PRP caching (independent work)
// This PRP creates I/O batching (independent work)
// Both use structured logging but integrate separately
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// SessionManager batch fields (add to class)
export class SessionManager {
  readonly #logger: Logger;
  readonly prdPath: string;
  readonly planDir: string;
  #currentSession: SessionState | null = null;
  #prdHash: string | null = null;

  // NEW: Batching state
  #dirty: boolean = false; // Flag indicating pending changes
  #pendingUpdates: Backlog | null = null; // Latest accumulated state
  #updateCount: number = 0; // Count of accumulated updates (for stats)
}

// Batch write statistics (for logging)
interface BatchWriteStats {
  readonly itemsWritten: number; // Number of updates accumulated
  readonly writeOpsSaved: number; // How many writes were avoided
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/core/session-manager.ts - Add batch fields
  - ADD private field #dirty: boolean = false
  - ADD private field #pendingUpdates: Backlog | null = null
  - ADD private field #updateCount: number = 0
  - FOLLOW: Existing private field pattern (lines 91-104)
  - NAMING: #dirty, #pendingUpdates, #updateCount (private with # prefix)
  - PLACEMENT: After #prdHash field (line 104)

Task 2: MODIFY src/core/session-manager.ts - updateItemStatus()
  - REMOVE: await this.saveBacklog(updated) call (line 477)
  - ADD: this.#pendingUpdates = updated (accumulate latest state)
  - ADD: this.#dirty = true (mark as dirty)
  - ADD: this.#updateCount++ (track for stats)
  - ADD: Debug log: this.#logger.debug({ itemId, status }, 'Status update batched')
  - PRESERVE: All existing behavior (return updated backlog)
  - PLACEMENT: Replace line 477 with batching logic

Task 3: IMPLEMENT src/core/session-manager.ts - flushUpdates()
  - ADD async flushUpdates(): Promise<void> method
  - CHECK: if (!this.#dirty) return immediately (no-op)
  - VALIDATE: this.#pendingUpdates is not null
  - CALL: await this.saveBacklog(this.#pendingUpdates)
  - LOG: Batch stats with items written and write ops saved
  - RESET: this.#dirty = false, this.#pendingUpdates = null, this.#updateCount = 0
  - CATCH: Log error but preserve dirty state (don't reset on failure)
  - NAMING: flushUpdates (camelCase, public)
  - PLACEMENT: After saveBacklog() method (around line 418)

Task 4: MODIFY src/core/session-manager.ts - saveBacklog()
  - ADD: Optional parameter to force write even if not dirty (for backward compat)
  - OR: Keep as-is, flushUpdates() is the new public API
  - DECISION: Keep saveBacklog() as-is, flushUpdates() calls it
  - NAMING: saveBacklog (existing name, no changes)
  - PLACEMENT: No changes needed

Task 5: MODIFY src/core/session-manager.ts - loadBacklog()
  - ADD: this.flushUpdates() before loading (persist pending changes)
  - OR: Throw error if dirty (data loss risk)
  - DECISION: Flush before load to preserve data consistency
  - PLACEMENT: At start of loadBacklog() method (line 437)

Task 6: MODIFY src/core/session-manager.ts - createDeltaSession()
  - ADD: await this.flushUpdates() before creating delta
  - REASON: Ensure current state is persisted before delta
  - PLACEMENT: At start of createDeltaSession() (line 315)

Task 7: MODIFY src/core/task-orchestrator.ts - flush after subtask
  - ADD: await this.sessionManager.flushUpdates() after executeSubtask()
  - FIND: executeSubtask() method (lines 568-728)
  - ADD: After line 728 (after subtask completion, before error handling)
  - NAMING: flushUpdates (method on sessionManager)
  - PLACEMENT: In finally block of executeSubtask() to ensure flush even on error

Task 8: MODIFY src/core/task-orchestrator.ts - flush after task
  - ADD: await this.sessionManager.flushUpdates() after executeTask()
  - FIND: executeTask() method (lines 515-546)
  - ADD: After all subtasks enqueued/processed
  - REASON: Flush when parent task completes
  - PLACEMENT: At end of executeTask() before return

Task 9: MODIFY src/workflows/prp-pipeline.ts - flush on shutdown
  - ADD: await this.sessionManager.flushUpdates() in cleanup()
  - FIND: cleanup() method (lines 940-1008)
  - ADD: Before line 979 (before existing saveBacklog call)
  - OR: Replace saveBacklog call with flushUpdates
  - DECISION: Add flushUpdates() before saveBacklog for safety
  - PLACEMENT: At start of cleanup() or after error handling

Task 10: CREATE tests/unit/core/session-manager-batching.test.ts
  - IMPLEMENT: updateItemStatus batches without writing test
  - IMPLEMENT: flushUpdates writes accumulated state test
  - IMPLEMENT: flushUpdates no-op when not dirty test
  - IMPLEMENT: batch stats logging test
  - IMPLEMENT: multiple updateItemStatus then flush test
  - IMPLEMENT: flushUpdates preserves dirty state on error test
  - FOLLOW: Pattern from session-manager.test.ts (mock setup, assertions)
  - MOCK: node:fs/promises (writeFile for writeTasksJSON)
  - NAMING: describe('SessionManager Batching'), it('should batch updates...')
  - PLACEMENT: tests/unit/core/

Task 11: MODIFY tests/unit/core/task-orchestrator.test.ts
  - ADD: flushUpdates called after subtask test
  - ADD: flushUpdates called after task test
  - VERIFY: sessionManager.flushUpdates() call order
  - FOLLOW: Existing mock patterns for sessionManager
  - PLACEMENT: Add to existing test suites

Task 12: MODIFY tests/integration/prp-pipeline-shutdown.test.ts
  - ADD: flushUpdates called on cleanup test
  - VERIFY: Pending updates flushed before shutdown
  - FOLLOW: Existing shutdown test patterns
  - PLACEMENT: Add to existing shutdown test suite

Task 13: VERIFY test execution
  - RUN: npm test -- tests/unit/core/session-manager-batching.test.ts
  - RUN: npm run typecheck (zero errors)
  - RUN: npm run lint (zero errors)
  - RUN: npm test (all tests pass)

Task 14: MANUAL verification
  - RUN: npm run pipeline -- --prd ./PRD.md
  - CHECK: Console logs show batch write operations
  - CHECK: "Batch write: N items in 1 operation (N-1 write ops saved)"
  - CHECK: tasks.json only updated after tasks complete
  - CHECK: Graceful shutdown preserves pending updates
```

### Implementation Patterns & Key Details

```typescript
// ===== TASK 1: Add batch fields =====
// File: src/core/session-manager.ts

export class SessionManager {
  readonly #logger: Logger;
  readonly prdPath: string;
  readonly planDir: string;
  #currentSession: SessionState | null = null;
  #prdHash: string | null = null;

  // NEW: Batching state
  #dirty: boolean = false;
  #pendingUpdates: Backlog | null = null;
  #updateCount: number = 0;
}

// ===== TASK 2: Modified updateItemStatus() =====
// File: src/core/session-manager.ts

async updateItemStatus(itemId: string, status: Status): Promise<Backlog> {
  if (!this.#currentSession) {
    throw new Error('Cannot update item status: no session loaded');
  }

  // Get current backlog from session
  const currentBacklog = this.#currentSession.taskRegistry;

  // Immutable update using utility function
  const updated = updateItemStatusUtil(currentBacklog, itemId, status);

  // BATCHING: Accumulate in memory instead of immediate write
  this.#pendingUpdates = updated;
  this.#dirty = true;
  this.#updateCount++;

  // Update internal session state
  this.#currentSession = {
    ...this.#currentSession,
    taskRegistry: updated,
  };

  // Log the batched update (debug level - high frequency)
  this.#logger.debug(
    { itemId, status, pendingCount: this.#updateCount },
    'Status update batched'
  );

  // NOTE: No longer calling await this.saveBacklog(updated)
  // Caller must call flushUpdates() to persist changes

  return updated;
}

// ===== TASK 3: flushUpdates() method =====
// File: src/core/session-manager.ts

async flushUpdates(): Promise<void> {
  // Early return if no pending changes
  if (!this.#dirty) {
    this.#logger.debug('No pending updates to flush');
    return;
  }

  if (!this.#pendingUpdates) {
    this.#logger.warn('Dirty flag set but no pending updates - skipping flush');
    this.#dirty = false;
    return;
  }

  try {
    // Persist accumulated updates atomically
    await this.saveBacklog(this.#pendingUpdates);

    // Calculate stats for logging
    const itemsWritten = this.#updateCount;
    const writeOpsSaved = Math.max(0, itemsWritten - 1);

    // Log batch write completion
    this.#logger.info(
      {
        itemsWritten,
        writeOpsSaved,
        efficiency: itemsWritten > 0
          ? `${((writeOpsSaved / itemsWritten) * 100).toFixed(1)}%`
          : '0%',
      },
      'Batch write complete'
    );

    // Reset batching state
    this.#dirty = false;
    this.#pendingUpdates = null;
    this.#updateCount = 0;

    this.#logger.debug('Batching state reset');
  } catch (error) {
    // Preserve dirty state on error - allow retry
    this.#logger.error(
      { error, pendingCount: this.#updateCount },
      'Batch write failed - pending updates preserved for retry'
    );
    throw error; // Re-throw for caller to handle
  }
}

// ===== TASK 5: Modified loadBacklog() =====
// File: src/core/session-manager.ts

async loadBacklog(): Promise<Backlog> {
  if (!this.#currentSession) {
    throw new Error('Cannot load backlog: no session loaded');
  }

  // Flush any pending updates before loading to avoid data loss
  if (this.#dirty) {
    this.#logger.warn(
      'Loading backlog with pending updates - flushing first'
    );
    await this.flushUpdates();
  }

  return readTasksJSON(this.#currentSession.metadata.path);
}

// ===== TASK 7: TaskOrchestrator flush after subtask =====
// File: src/core/task-orchestrator.ts

async executeSubtask(subtask: Subtask, phase: Phase, milestone: Milestone, task: Task): Promise<void> {
  const startTime = Date.now();

  try {
    // Status: Planned -> Researching
    await this.#updateStatus(subtask.id, 'Researching');

    // ... execute subtask logic ...

    // Status: Researching -> Implementing
    await this.#updateStatus(subtask.id, 'Implementing');

    // ... PRP generation and execution ...

    // Status: Implementing -> Complete
    await this.#updateStatus(subtask.id, 'Complete');

    // FLUSH: Batch write after subtask completes
    await this.sessionManager.flushUpdates();

  } catch (error) {
    // Status: Implementing -> Failed
    await this.#updateStatus(subtask.id, 'Failed');

    // FLUSH: Still flush on error to preserve failure state
    await this.sessionManager.flushUpdates();

    throw error;
  }
}

// ===== TASK 9: PRPPipeline cleanup flush =====
// File: src/workflows/prp-pipeline.ts

async cleanup(): Promise<void> {
  this.#logger.info('Starting cleanup...');

  try {
    // Flush any pending state updates before shutdown
    if (this.sessionManager) {
      await this.sessionManager.flushUpdates();
      this.#logger.debug('Pending updates flushed on shutdown');
    }

    // ... rest of cleanup logic ...

    // Remove signal listeners
    process.off('SIGINT', this.#sigintHandler);
    process.off('SIGTERM', this.#sigtermHandler);

    this.#logger.info('Cleanup complete');
  } catch (error) {
    this.#logger.error({ error }, 'Cleanup failed');
    throw error;
  }
}

// ===== GOTCHA: Backward Compatibility =====
// External callers may still expect immediate writes
// Solution: Provide flushImmediately() method for critical paths

async flushImmediately(itemId: string, status: Status): Promise<Backlog> {
  // Update status
  const updated = await this.updateItemStatus(itemId, status);

  // Immediately flush
  await this.flushUpdates();

  return updated;
}

// ===== GOTCHA: Batch Stats Calculation =====
// Example: 15 status updates accumulated
// itemsWritten = 15
// writeOpsSaved = 15 - 1 = 14 (one write for all 15 updates)
// efficiency = (14 / 15) * 100 = 93.3%

// ===== GOTCHA: Error Handling =====
// If writeTasksJSON() fails, don't reset dirty flag
// This allows retry on next flushUpdates() call
// The error is logged and re-thrown for caller to handle
```

### Integration Points

```yaml
SESSION_MANAGER:
  - modify: src/core/session-manager.ts
  - add_fields: #dirty, #pendingUpdates, #updateCount
  - modify_method: updateItemStatus() - remove immediate write, add batching
  - add_method: flushUpdates() - atomic batch write with stats logging
  - modify_method: loadBacklog() - flush before loading
  - modify_method: createDeltaSession() - flush before delta

TASK_ORCHESTRATOR:
  - modify: src/core/task-orchestrator.ts
  - add_call: sessionManager.flushUpdates() after executeSubtask()
  - add_call: sessionManager.flushUpdates() after executeTask()
  - add_call: sessionManager.flushUpdates() in finally block (error safety)

PIPELINE:
  - modify: src/workflows/prp-pipeline.ts
  - add_call: sessionManager.flushUpdates() in cleanup()
  - ensure: Flush happens before signal listeners removed
  - ensure: Flush happens on SIGINT/SIGTERM (via cleanup)

LOGGING:
  - use_existing: getLogger('SessionManager')
  - log_level: DEBUG for individual updates, INFO for flush operations
  - pattern: "logger.debug({ itemId, status }, 'Status update batched')"
  - pattern: "logger.info({ itemsWritten, writeOpsSaved, efficiency }, 'Batch write complete')"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying each file
npx tsc --noEmit src/core/session-manager.ts
npx tsc --noEmit src/core/task-orchestrator.ts
npx tsc --noEmit src/workflows/prp-pipeline.ts

# Format and lint
npm run lint -- src/core/session-manager.ts
npm run format -- src/core/session-manager.ts

# Project-wide validation
npm run typecheck
npm run lint
npm run format

# Expected: Zero TypeScript errors, zero ESLint errors
# If errors exist:
#   - Fix import paths (use .js extensions)
#   - Fix type annotations (add explicit types where needed)
#   - Re-run validation
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run batching tests
npm test -- tests/unit/core/session-manager-batching.test.ts

# Run all SessionManager tests
npm test -- tests/unit/core/session-manager.test.ts

# Run TaskOrchestrator tests
npm test -- tests/unit/core/task-orchestrator.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/core/

# Expected: All tests pass, good coverage
# If failing:
#   - Check mock setup (vi.mock must be before imports)
#   - Verify flushUpdates() call order in TaskOrchestrator tests
#   - Debug with console.log (temporarily)
#   - Fix and re-run
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all tests
npm test

# Build project
npm run build

# Expected: All tests pass, including existing tests
# If existing tests fail:
#   - Check for backward compatibility (updateItemStatus still returns backlog)
#   - Verify no changes to public API signature
#   - Ensure flush is optional (tests not calling flush still pass)
#   - Fix and re-run
```

### Level 4: Manual & System Validation

```bash
# Run pipeline with batching enabled
npm run pipeline -- --prd ./PRD.md

# Check console output for batch write logs
# Expected output:
# "Status update batched { itemId: 'P1.M1.T1.S1', status: 'Researching', pendingCount: 1 }"
# "Status update batched { itemId: 'P1.M1.T1.S1', status: 'Implementing', pendingCount: 2 }"
# "Status update batched { itemId: 'P1.M1.T1.S1', status: 'Complete', pendingCount: 3 }"
# "Batch write complete { itemsWritten: 3, writeOpsSaved: 2, efficiency: '66.7%' }"

# Check tasks.json update frequency
# Before: tasks.json updated 3 times per subtask
# After: tasks.json updated once per subtask (after completion)

# Test shutdown behavior
npm run pipeline -- --prd ./PRD.md
# Press Ctrl+C during execution
# Expected: Cleanup flushes pending updates before exit

# Verify data integrity
cat plan/001_14b9dc2a33c7/tasks.json | jq '.backlog[0].milestones[0].tasks[0].subtasks[0].status'
# Should show "Complete" or "Failed" (not "Researching" or "Implementing")

# Test error recovery
# Simulate write failure and verify dirty state is preserved
# (Use manual testing or unit test)

# Performance comparison
time npm run pipeline -- --prd ./PRD.md
# Should be measurably faster due to reduced I/O
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting correct: `npm run format`
- [ ] All unit tests pass: `npm test -- tests/unit/core/session-manager-batching.test.ts`
- [ ] All existing tests pass: `npm test`

### Feature Validation

- [ ] SessionManager adds dirty flag and pendingUpdates fields
- [ ] updateItemStatus() batches without immediate write
- [ ] flushUpdates() writes accumulated state atomically
- [ ] flushUpdates() logs batch stats (items, write ops saved, efficiency)
- [ ] flushUpdates() is no-op when not dirty
- [ ] TaskOrchestrator calls flushUpdates() after subtask completion
- [ ] TaskOrchestrator calls flushUpdates() after task completion
- [ ] PRPPipeline cleanup calls flushUpdates() on shutdown
- [ ] Batch stats visible in console output
- [ ] tasks.json only updated after task completion

### Code Quality Validation

- [ ] Follows existing SessionManager patterns (private fields, async methods)
- [ ] Uses atomic write pattern (writeTasksJSON via saveBacklog)
- [ ] Structured logging with metadata
- [ ] ES module imports with .js extensions
- [ ] Private fields use # prefix convention
- [ ] Error handling preserves dirty state on failure
- [ ] Backward compatibility maintained (updateItemStatus returns backlog)

### Integration Validation

- [ ] TaskOrchestrator integration: flush called after subtask/task
- [ ] PRPPipeline integration: flush called in cleanup
- [ ] Shutdown safety: pending updates flushed before exit
- [ ] No interference with P5.M2.T1.S2 (PRP caching)
- [ ] Logger integration matches existing patterns
- [ ] Test structure matches existing test files

### Performance Validation

- [ ] Measurable I/O reduction (fewer tasks.json writes)
- [ ] Console logs show efficiency gains
- [ ] Pipeline execution time improved
- [ ] No data loss on shutdown

---

## Anti-Patterns to Avoid

- **Don't break backward compatibility**: updateItemStatus() must still return updated backlog
- **Don't use sync file operations**: All I/O must use async/await with node:fs/promises
- **Don't skip atomic write pattern**: Always use writeTasksJSON() for persistence
- **Don't reset dirty flag on error**: Preserve state to allow retry
- **Don't forget to flush on shutdown**: Cleanup must call flushUpdates()
- **Don't flush after EVERY update**: That defeats the purpose of batching
- **Don't accumulate arrays of updates**: Just keep the latest backlog state
- **Don't use console.log for metrics**: Use structured logger
- **Don't hardcode batch sizes**: Flush based on task completion, not arbitrary thresholds
- **Don't forget .js extension in imports**: ES modules require explicit extensions
- **Don't modify TaskOrchestrator public API**: flushUpdates is on SessionManager
- **Don't assume dirty means pendingUpdates is set**: Always validate both
- **Don't log at INFO level for every update**: Use DEBUG for batching, INFO for flush
- **Don't call writeTasksJSON directly**: Use saveBacklog() which validates
- **Don't ignore the cleanup() signal handlers**: Ensure flush happens on SIGINT/SIGTERM
