# Product Requirement Prompt (PRP): Implement Concurrent Task Executor

> Implement concurrent task executor for PRP Pipeline subtask execution with dependency-aware parallelization

**Status**: Ready for Implementation
**Last Updated**: 2026-01-24
**Work Item**: P3.M1.T1.S2 - Implement concurrent task executor

---

## Goal

**Feature Goal**: Implement `ConcurrentTaskExecutor` class at `src/core/concurrent-executor.ts` that executes subtasks concurrently while respecting dependency constraints, with configurable pool size, resource-aware backpressure, atomic state updates, and isolated error handling.

**Deliverable**:
1. `ConcurrentTaskExecutor` class at `src/core/concurrent-executor.ts` with:
   - Semaphore-based concurrency limiting (configurable pool size)
   - Dependency-aware executable subtask identification
   - Batch execution with `Promise.allSettled()` for error isolation
   - Resource-aware backpressure (memory, file handles)
   - Atomic state updates via `SessionManager`
   - Integration with `TaskOrchestrator` and `PRPRuntime`

2. Unit tests at `tests/unit/core/concurrent-executor.test.ts` covering:
   - Concurrency limit enforcement
   - Dependency ordering verification
   - Error isolation (individual failures don't stop others)
   - Resource backpressure behavior
   - Deadlock detection

3. Integration in `TaskOrchestrator` to replace sequential `processNextItem()` loop

**Success Definition**:
- Subtasks with satisfied dependencies execute in parallel (up to pool size limit)
- Concurrency limit is respected (max N concurrent operations)
- Dependencies are respected (no task starts before deps complete)
- Individual task failures don't block other independent tasks
- State updates are atomic (no corruption from concurrent writes)
- Resource exhaustion is prevented via backpressure
- Tests pass with >90% coverage

## User Persona

**Target User**: Developer implementing P3.M1.T1.S2 (Concurrent Task Executor) - the AI coding agent executing this PRP

**Use Case**: User needs to:
- Understand the `ConcurrentTaskExecutor` class structure and methods
- Know how to implement semaphore-based concurrency limiting
- Understand dependency-aware subtask identification
- Implement error isolation with `Promise.allSettled()`
- Integrate with existing `TaskOrchestrator`, `PRPRuntime`, and `SessionManager`
- Write comprehensive tests for concurrent behavior

**User Journey**:
1. Read this PRP to understand the complete implementation spec
2. Study the existing `ResearchQueue` pattern for reference (lines 57-197)
3. Implement `ConcurrentTaskExecutor` class with all required methods
4. Integrate with `TaskOrchestrator` by adding parallel execution path
5. Write unit tests using `ConcurrencyTracker` pattern
6. Run tests to verify correctness
7. Subtasks now execute in parallel with proper dependency resolution

**Pain Points Addressed**:
- "How do I limit concurrent operations?" - Semaphore pattern documented
- "How do I identify executable subtasks?" - `getExecutableSubtasks()` algorithm provided
- "How do I handle errors without blocking others?" - `Promise.allSettled()` pattern
- "How do I prevent race conditions in state updates?" - Atomic `SessionManager` batching
- "What testing patterns work for concurrent code?" - `ConcurrencyTracker` pattern provided

## Why

- **Performance**: Sequential execution is a bottleneck - with hundreds of subtasks, parallel execution reduces total time significantly
- **ResearchQueue Foundation**: Existing `ResearchQueue` demonstrates parallel execution with concurrency=3 - extend this proven pattern
- **Dependency Resolution Ready**: `canExecute()` and `getBlockingDependencies()` already implemented - just need parallel orchestration
- **Design Complete**: P3.M1.T1.S1 design document (`parallel-execution-design.md`) provides complete algorithm specification
- **Completes P3.M1.T1**: This is the implementation subtask after design (S1) and before CLI option (S3)

## What

Implement `ConcurrentTaskExecutor` class with concurrent subtask execution:

### Success Criteria

- [ ] `src/core/concurrent-executor.ts` created with `ConcurrentTaskExecutor` class
- [ ] `getExecutableSubtasks()` method identifies subtasks with satisfied dependencies
- [ ] `executeParallel()` method executes subtasks with concurrency limit
- [ ] Semaphore pattern limits concurrent operations (configurable pool size)
- [ ] `Promise.allSettled()` used for error isolation
- [ ] Atomic state updates via `SessionManager.updateItemStatus()`
- [ ] Backpressure check before each execution (memory, file handles)
- [ ] Integration in `TaskOrchestrator` with fallback to sequential mode
- [ ] Unit tests at `tests/unit/core/concurrent-executor.test.ts` with >90% coverage
- [ ] All tests pass: `npm run test:run tests/unit/core/concurrent-executor.test.ts`

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:

- Complete `ConcurrentTaskExecutor` class specification with method signatures
- Reference implementation pattern from `ResearchQueue` (existing parallel execution)
- Dependency resolution logic from `TaskOrchestrator` (existing)
- State management patterns from `SessionManager` (existing atomic batching)
- PRP execution pattern from `PRPRuntime` (existing)
- Test patterns from `testing-concurrent-operations-vitest-typescript.md`
- Design pseudocode from `parallel-execution-design.md`
- Specific file paths and line numbers for all integration points

### Documentation & References

```yaml
# MUST READ - Reference Implementation Pattern
- file: /home/dustin/projects/hacky-hack/src/core/research-queue.ts
  why: Existing parallel execution pattern - model ConcurrentTaskExecutor after this
  pattern: Semaphore-like concurrency with maxSize, researching Map, processNext() loop
  lines: 57-197 (queue implementation)
  critical:
    - Line 76-78: researching Map tracks in-flight operations
    - Line 142-197: processNext() shows capacity check and automatic continuation
    - Line 95-97: .finally() ensures cleanup and next task start

# MUST READ - Dependency Resolution Logic
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: canExecute() and getBlockingDependencies() - use to identify executable subtasks
  pattern: Filter subtasks by status='Planned' and all deps='Complete'
  lines: 251-293 (dependency resolution methods)
  critical:
    - Line 251-265: canExecute() returns true if all dependencies are 'Complete'
    - Line 284-293: getBlockingDependencies() returns incomplete dependencies

# MUST READ - State Management Pattern
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Atomic state updates - use for thread-safe status updates in concurrent execution
  pattern: Batching with updateItemStatus(), flushUpdates() for atomic writes
  lines: 748-800 (updateItemStatus), 670-720 (flushUpdates)
  critical:
    - Line 768-800: updateItemStatus() accumulates in memory
    - Line 516-528: flushUpdates() persists atomically via temp file + rename

# MUST READ - PRP Execution Pattern
- file: /home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts
  why: executeSubtask() method - call this from parallel workers
  pattern: Status progression, PRP execution, artifact collection
  lines: 139-232 (executeSubtask method)
  critical:
    - Line 154-175: PRP generation step (skip if already cached)
    - Line 177-200: PRP execution step
    - Line 202-229: Status updates and artifact collection

# MUST READ - Task Hierarchy Models
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Subtask interface with dependencies array - understand data structure
  pattern: Type-safe interfaces, discriminated unions
  lines: 231-293 (Subtask interface, Status type)
  critical:
    - Line 137-143: Status values are string literals ('Planned', 'Implementing', etc.)
    - Line 267-275: Subtask.dependencies is string[] of subtask IDs

# MUST READ - Design Document
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/parallel-execution-design.md
  why: Complete design specification with pseudocode - follow this exactly
  section: "Parallel Scheduler Pseudocode" (lines 743-965)
  critical:
    - Lines 748-791: executeParallel() main loop
    - Lines 794-806: getExecutableSubtasks() algorithm
    - Lines 809-865: executeBatch() with semaphore pattern
    - Lines 934-964: Semaphore class implementation

# MUST READ - Testing Patterns
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/testing-concurrent-operations-vitest-typescript.md
  why: Comprehensive testing patterns - use for validation section
  section: "Testing Concurrent Execution with Limits" (lines 28-98)
  critical:
    - Lines 35-58: ConcurrencyTracker class for testing limits
    - Lines 288-353: Dependency ordering verification
    - Lines 788-866: Race condition testing

# MUST READ - System Context
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Current implementation status - understand the problem being solved
  section: "Limitations & Pain Points" (lines 429-503)
  critical: "Sequential Subtask Execution" - no parallel execution despite dependency resolution

# MUST READ - Test Examples
- file: /home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts
  why: Test patterns, factory functions, mock setup - follow this style
  pattern: Vitest with vi.mock, factory functions, Setup/Execute/Verify
  lines: 1-150 (test setup, factory functions, mock patterns)
  critical:
    - Line 96-130: createTestSubtask() factory function
    - Line 132-165: createTestBacklog() factory function

# MUST READ - Resource Monitoring
- file: /home/dustin/projects/hacky-hack/src/utils/resource-monitor.ts
  why: Resource usage monitoring - use for backpressure checks
  pattern: getCurrentUsage() returns memory and file handles
  (Note: File may not exist - implement simple monitoring if needed)
```

### Current Codebase Tree (Relevant Files)

```bash
src/core/
├── task-orchestrator.ts         # Current sequential execution - integrate parallel here
├── research-queue.ts            # Reference pattern for parallel execution
├── session-manager.ts           # Atomic state updates - use for concurrent writes
├── models.ts                    # Subtask, Status, Backlog types
├── dependency-validator.ts      # Circular dependency detection
└── scope-resolver.ts            # Scope filtering for execution

src/agents/
├── prp-runtime.ts               # PRP execution - call from parallel workers
├── prp-generator.ts             # PRP generation (parallel via ResearchQueue)
└── prp-executor.ts              # PRP execution engine

src/utils/
├── task-utils.ts                # getDependencies(), findItem() utilities
├── logger.ts                    # Logging (use for parallel execution logs)
└── resource-monitor.ts          # Resource monitoring (may need implementation)

tests/unit/core/
├── task-orchestrator.test.ts    # Test patterns, factory functions
├── task-dependencies.test.ts     # Dependency resolution tests
└── research-queue.test.ts       # ResearchQueue test patterns

plan/003_b3d3efdaf0ed/
└── docs/
    ├── parallel-execution-design.md      # Design document with pseudocode
    └── testing-concurrent-operations-vitest-typescript.md  # Testing patterns
```

### Desired Codebase Tree (Files to Add)

```bash
src/core/
└── concurrent-executor.ts       # NEW: ConcurrentTaskExecutor class

tests/unit/core/
└── concurrent-executor.test.ts  # NEW: Unit tests for ConcurrentTaskExecutor
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Current execution is sequential despite dependency resolution
// TaskOrchestrator.processNextItem() (lines 805-834) processes one item at a time
// We add parallel execution alongside, not replacing sequential mode

// PATTERN: Follow ResearchQueue for parallel execution structure
export class ResearchQueue {
  readonly maxSize: number;  // Concurrency limit (currently 3)
  readonly researching: Map<string, Promise<PRPDocument>>;  // In-flight tracking

  async processNext(backlog: Backlog): Promise<void> {
    // Check capacity - BACKPRESSURE
    if (this.queue.length === 0 || this.researching.size >= this.maxSize) {
      return;  // Wait for capacity
    }

    // Start processing with automatic continuation
    const promise = this.#prpGenerator.generate(task, backlog)
      .finally(() => {
        this.researching.delete(task.id);
        this.processNext(backlog);  // AUTOMATIC CONTINUATION
      });
    this.researching.set(task.id, promise);
  }
}

// GOTCHA: State updates need atomicity for concurrent operations
// SessionManager batches updates - must call flushUpdates() after batch
await sessionManager.updateItemStatus(itemId, status);  // Accumulates in memory
await sessionManager.flushUpdates();  // Atomic write via temp file + rename

// PATTERN: Dependency resolution already exists
// Use TaskOrchestrator.canExecute() and getBlockingDependencies()
public canExecute(subtask: Subtask): boolean {
  const dependencies = getDependencies(subtask, this.#backlog);
  return dependencies.every(dep => dep.status === 'Complete');
}

// CRITICAL: Status values are string literals, not enums
type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed';
// Use strict equality: status === 'Complete'

// GOTCHA: Subtask dependencies are within task boundary only
// Subtasks can only depend on other subtasks in the SAME task
interface Subtask {
  dependencies: string[];  // Subtask IDs (same task only)
}

// PATTERN: Promise.allSettled() for error isolation
const results = await Promise.allSettled(workers.map(w => w()));
const failures = results.filter(r => r.status === 'rejected');
// Individual failures don't stop other tasks

// TESTING PATTERN: ConcurrencyTracker for validation
class ConcurrencyTracker {
  private active = 0;
  private max = 0;

  track<T>(fn: () => Promise<T>): () => Promise<T> {
    return async () => {
      this.active++;
      this.max = Math.max(this.max, this.active);
      try {
        return await fn();
      } finally {
        this.active--;
      }
    };
  }

  getMaxConcurrency(): number {
    return this.max;
  }
}

// GOTCHA: File handle monitoring on macOS uses lsof (slower)
// Consider caching file handle counts or reducing check frequency

// PATTERN: Use vi.mock for Vitest tests (see task-orchestrator.test.ts)
vi.mock('../../../src/core/session-manager.js');
vi.mock('../../../src/agents/prp-runtime.js');

// GOTCHA: TaskOrchestrator uses #private fields
// Access via public methods only (setStatus(), canExecute(), etc.)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed - use existing models:

```typescript
// Existing models (from src/core/models.ts)
type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed';

interface Subtask {
  id: string;
  title: string;
  status: Status;
  dependencies: string[];  // Subtask IDs that must Complete first
  // ... other fields
}

interface Backlog {
  backlog: Phase[];  // Task hierarchy
}

// New configuration for parallel execution
interface ParallelismConfig {
  enabled: boolean;
  maxConcurrency: number;  // Pool size (default: 3)
  prpGenerationLimit: number;  // Separate limit for PRP generation (default: 3)
  resourceThreshold: number;  // Backpressure threshold (default: 0.8)
}

// Resource usage interface
interface ResourceUsage {
  memory: number;  // Heap usage ratio (0.0 to 1.0)
  fileHandles: number;  // Open file handles count
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/core/concurrent-executor.ts with ConcurrentTaskExecutor class skeleton
  - IMPLEMENT: Class with constructor accepting TaskOrchestrator, ParallelismConfig
  - IMPLEMENT: Private fields: semaphore, orchestrator, config, logger
  - FOLLOW pattern: src/core/research-queue.ts (class structure, constructor pattern)
  - NAMING: ConcurrentTaskExecutor (PascalCase), concurrent-executor.ts (kebab-case)
  - PLACEMENT: src/core/concurrent-executor.ts
  - EXPORT: class ConcurrentTaskExecutor

Task 2: IMPLEMENT Semaphore inner class
  - IMPLEMENT: acquire() method - wait if available <= 0, then decrement
  - IMPLEMENT: release() method - increment available, wake next waiter
  - IMPLEMENT: Private fields: available (number), waitQueue (Array<() => void>)
  - FOLLOW pattern: parallel-execution-design.md lines 934-964
  - PATTERN:
    ```
    class Semaphore {
      private available: number;
      private waitQueue: Array<() => void> = [];

      constructor(private max: number) {
        this.available = max;
      }

      async acquire(): Promise<void> {
        if (this.available > 0) {
          this.available--;
          return;
        }
        return new Promise<void>(resolve => {
          this.waitQueue.push(resolve);
        });
      }

      release(): void {
        this.available++;
        const next = this.waitQueue.shift();
        if (next) {
          this.available--;
          next();
        }
      }
    }
    ```
  - PLACEMENT: Inner class in concurrent-executor.ts

Task 3: IMPLEMENT getExecutableSubtasks() method
  - IMPLEMENT: Filter subtasks where status === 'Planned' and canExecute() returns true
  - IMPLEMENT: Use orchestrator.canExecute() for dependency checking
  - IMPLEMENT: Return Subtask[] of executable tasks
  - FOLLOW pattern: parallel-execution-design.md lines 796-806
  - PATTERN:
    ```
    private getExecutableSubtasks(subtasks: Subtask[]): Subtask[] {
      return subtasks.filter(subtask => {
        if (subtask.status !== 'Planned') {
          return false;
        }
        return this.orchestrator.canExecute(subtask);
      });
    }
    ```
  - INTEGRATION: Call this.orchestrator.canExecute(subtask) for dependency check

Task 4: IMPLEMENT waitForResourceAvailability() method (backpressure)
  - IMPLEMENT: Loop until memory and file handles below threshold
  - IMPLEMENT: Use process.memoryUsage() for memory check
  - IMPLEMENT: Optional: file handle counting (or skip if not available)
  - IMPLEMENT: 1 second sleep between checks
  - FOLLOW pattern: parallel-execution-design.md lines 862-876
  - PATTERN:
    ```
    private async waitForResourceAvailability(): Promise<void> {
      while (true) {
        const usage = process.memoryUsage();
        const memoryRatio = usage.heapUsed / usage.heapTotal;

        if (memoryRatio < this.config.resourceThreshold) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    ```
  - GOTCHA: File handle counting on macOS is slow - consider optional or cached

Task 5: IMPLEMENT executeParallel() main method
  - IMPLEMENT: Main loop - get planned subtasks, execute in waves until complete
  - IMPLEMENT: Call getExecutableSubtasks() to identify ready tasks
  - IMPLEMENT: Call executeBatch() to execute with concurrency limit
  - IMPLEMENT: Refresh backlog after each batch via orchestrator.refreshBacklog()
  - IMPLEMENT: Detect deadlock - no executable tasks but planned tasks remain
  - FOLLOW pattern: parallel-execution-design.md lines 755-791
  - PATTERN:
    ```
    async executeParallel(subtasks: Subtask[]): Promise<void> {
      while (this.hasIncompleteTasks(subtasks)) {
        const executable = this.getExecutableSubtasks(subtasks);

        if (executable.length === 0) {
          await this.handleDeadlock(subtasks);
          break;
        }

        await this.executeBatch(executable);
        await this.orchestrator.refreshBacklog();
      }
    }
    ```
  - INTEGRATION: Call orchestrator methods for status, backlog refresh

Task 6: IMPLEMENT executeBatch() method
  - IMPLEMENT: Create semaphore for concurrency control
  - IMPLEMENT: Create worker function for each subtask
  - IMPLEMENT: Worker: acquire semaphore, check resources, execute subtask, update status, release
  - IMPLEMENT: Use Promise.allSettled() for error isolation
  - IMPLEMENT: Log aggregated failures
  - FOLLOW pattern: parallel-execution-design.md lines 809-865
  - PATTERN:
    ```
    private async executeBatch(subtasks: Subtask[]): Promise<void> {
      const semaphore = new Semaphore(this.config.maxConcurrency);

      const workers = subtasks.map(subtask => async () => {
        await semaphore.acquire();
        try {
          await this.waitForResourceAvailability();
          await this.orchestrator.prpRuntime.executeSubtask(subtask, backlog);
          await this.orchestrator.setStatus(subtask.id, 'Complete', 'Success');
        } catch (error) {
          await this.orchestrator.setStatus(subtask.id, 'Failed', String(error));
        } finally {
          semaphore.release();
          await this.orchestrator.sessionManager.flushUpdates();
        }
      });

      const results = await Promise.allSettled(workers.map(w => w()));
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warn({ failureCount: failures.length }, 'Some tasks failed');
      }
    }
    ```
  - CRITICAL: Use Promise.allSettled() not Promise.all() for error isolation

Task 7: IMPLEMENT helper methods
  - IMPLEMENT: hasIncompleteTasks() - check if any subtask not Complete/Failed
  - IMPLEMENT: handleDeadlock() - log blocking dependencies, throw error
  - PATTERN:
    ```
    private hasIncompleteTasks(subtasks: Subtask[]): boolean {
      return subtasks.some(s => s.status !== 'Complete' && s.status !== 'Failed');
    }

    private async handleDeadlock(subtasks: Subtask[]): Promise<void> {
      const planned = subtasks.filter(s => s.status === 'Planned');
      for (const subtask of planned) {
        const blockers = this.orchestrator.getBlockingDependencies(subtask);
        this.logger.error({
          subtaskId: subtask.id,
          blockers: blockers.map(b => ({ id: b.id, status: b.status }))
        }, 'Deadlock detected');
      }
      throw new Error('Deadlock: no executable tasks but planned tasks remain');
    }
    ```

Task 8: INTEGRATE with TaskOrchestrator
  - MODIFY: src/core/task-orchestrator.ts
  - IMPLEMENT: Import ConcurrentTaskExecutor
  - IMPLEMENT: Add executeParallel() method to TaskOrchestrator
  - IMPLEMENT: Create ConcurrentTaskExecutor instance, call executeParallel()
  - PRESERVE: Existing sequential processNextItem() for backward compatibility
  - INTEGRATION point: After line 834 in task-orchestrator.ts
  - PATTERN:
    ```
    import { ConcurrentTaskExecutor } from './concurrent-executor.js';

    public async executeParallel(config: ParallelismConfig): Promise<void> {
      const executor = new ConcurrentTaskExecutor(this, config);
      const subtasks = this.getAllSubtasks(this.#backlog);
      await executor.executeParallel(subtasks);
    }
    ```

Task 9: CREATE tests/unit/core/concurrent-executor.test.ts
  - IMPLEMENT: Concurrency limit test with ConcurrencyTracker pattern
  - IMPLEMENT: Dependency ordering test (verify deps execute before dependents)
  - IMPLEMENT: Error isolation test (individual failures don't stop others)
  - IMPLEMENT: Resource backpressure test (mock resource monitor)
  - IMPLEMENT: Deadlock detection test (circular dependencies)
  - FOLLOW pattern: tests/unit/core/task-orchestrator.test.ts
  - FOLLOW pattern: testing-concurrent-operations-vitest-typescript.md
  - MOCK: SessionManager, PRPRuntime, ResourceMonitor
  - COVERAGE: All public methods with edge cases
  - PLACEMENT: tests/unit/core/concurrent-executor.test.ts

Task 10: VALIDATE implementation
  - VERIFY: TypeScript compilation passes (npm run typecheck)
  - VERIFY: All tests pass (npm run test:run tests/unit/core/concurrent-executor.test.ts)
  - VERIFY: Linting passes (npm run lint)
  - VERIFY: Integration test passes (if applicable)
  - VERIFY: Manual testing with small task hierarchy
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CONCURRENT TASK EXECUTOR IMPLEMENTATION PATTERNS
// ============================================================================

// PATTERN 1: Class Structure (follow ResearchQueue pattern)
import type TaskOrchestrator from './task-orchestrator.js';
import type { Subtask, Backlog } from './models.js';
import { getLogger } from '../utils/logger.js';

export interface ParallelismConfig {
  enabled: boolean;
  maxConcurrency: number;
  prpGenerationLimit: number;
  resourceThreshold: number;
}

export class ConcurrentTaskExecutor {
  readonly #orchestrator: TaskOrchestrator;
  readonly #config: ParallelismConfig;
  readonly #logger = getLogger();

  constructor(orchestrator: TaskOrchestrator, config: ParallelismConfig) {
    this.#orchestrator = orchestrator;
    this.#config = config;
  }

  // Public methods...
}

// PATTERN 2: Semaphore Implementation
class Semaphore {
  #available: number;
  #waitQueue: Array<() => void> = [];

  constructor(private max: number) {
    this.#available = max;
  }

  async acquire(): Promise<void> {
    if (this.#available > 0) {
      this.#available--;
      return;
    }

    return new Promise<void>(resolve => {
      this.#waitQueue.push(resolve);
    });
  }

  release(): void {
    this.#available++;
    const next = this.#waitQueue.shift();
    if (next) {
      this.#available--;
      next();
    }
  }
}

// PATTERN 3: Executable Subtask Identification
// CRITICAL: Use orchestrator.canExecute() for dependency checking
#orchestrator.canExecute(subtask: Subtask): boolean {
  const dependencies = getDependencies(subtask, this.#backlog);
  return dependencies.every(dep => dep.status === 'Complete');
}

// PATTERN 4: Backpressure Check
// GOTCHA: File handle counting on macOS is slow - consider optional
async #waitForResourceAvailability(): Promise<void> {
  while (true) {
    const usage = process.memoryUsage();
    const memoryRatio = usage.heapUsed / usage.heapTotal;

    // File handle check (optional - may be slow on macOS)
    // const fileHandles = await this.#getFileHandleCount();

    if (memoryRatio < this.#config.resourceThreshold) {
      break;
    }

    this.#logger.debug({ memoryRatio }, 'Waiting for resources');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// PATTERN 5: Worker Function with Error Isolation
// CRITICAL: Use Promise.allSettled() for error isolation
const workers = subtasks.map(subtask => async () => {
  await semaphore.acquire();
  try {
    await this.#waitForResourceAvailability();
    await this.#orchestrator.prpRuntime.executeSubtask(subtask, backlog);
    await this.#orchestrator.setStatus(subtask.id, 'Complete', 'Success');
  } catch (error) {
    // Log but don't throw - isolate error
    await this.#orchestrator.setStatus(
      subtask.id,
      'Failed',
      error instanceof Error ? error.message : String(error)
    );
    throw error; // Re-throw for aggregation
  } finally {
    semaphore.release();
    // CRITICAL: Flush updates after each task completes
    await this.#orchestrator.sessionManager.flushUpdates();
  }
});

// PATTERN 6: Promise.allSettled() for Aggregation
const results = await Promise.allSettled(workers.map(w => w()));
const failures = results.filter(r => r.status === 'rejected');

if (failures.length > 0) {
  this.#logger.warn(
    { failureCount: failures.length },
    'Some parallel tasks failed'
  );
  // Optional: Aggregate error details
  failures.forEach((f, i) => {
    if (f.status === 'rejected') {
      this.#logger.error({ subtaskId: subtasks[i].id, error: f.reason });
    }
  });
}

// PATTERN 7: Deadlock Detection
// CRITICAL: Detect when no tasks are executable but planned tasks remain
const executable = this.#getExecutableSubtasks(subtasks);
const planned = subtasks.filter(s => s.status === 'Planned');

if (executable.length === 0 && planned.length > 0) {
  // Deadlock - log blocking dependencies
  for (const subtask of planned) {
    const blockers = this.#orchestrator.getBlockingDependencies(subtask);
    this.#logger.error({
      subtaskId: subtask.id,
      blockers: blockers.map(b => ({ id: b.id, status: b.status }))
    }, 'Task blocked with unresolved dependencies');
  }
  throw new Error('Deadlock detected');
}

// PATTERN 8: State Update Pattern
// CRITICAL: Use SessionManager for atomic updates
await this.#orchestrator.sessionManager.updateItemStatus(subtask.id, 'Complete');
await this.#orchestrator.sessionManager.flushUpdates();
// Atomic write via temp file + rename - no corruption

// GOTCHA: Never update the same subtask concurrently
// Each worker processes different subtasks - guaranteed by filtering

// PATTERN 9: Main Execution Loop
async executeParallel(subtasks: Subtask[]): Promise<void> {
  while (this.#hasIncompleteTasks(subtasks)) {
    const executable = this.#getExecutableSubtasks(subtasks);

    if (executable.length === 0) {
      await this.#handleDeadlock(subtasks);
      break;
    }

    await this.#executeBatch(executable);
    await this.#orchestrator.refreshBacklog();
  }
}

// PATTERN 10: Integration with TaskOrchestrator
// Add method to TaskOrchestrator class
public async executeParallel(config: ParallelismConfig): Promise<void> {
  const executor = new ConcurrentTaskExecutor(this, config);
  const subtasks = this.#getAllSubtasks(this.#backlog);
  await executor.executeParallel(subtasks);
}
```

### Integration Points

```yaml
TASK_ORCHESTRATOR_INTEGRATION:
  - file: src/core/task-orchestrator.ts
  - integration: Add executeParallel() method alongside processNextItem()
  - location: After line 834 (after processNextItem method)
  - import: Add import for ConcurrentTaskExecutor at top
  - pattern:
      ```
      import { ConcurrentTaskExecutor } from './concurrent-executor.js';

      public async executeParallel(config: ParallelismConfig): Promise<void> {
        const executor = new ConcurrentTaskExecutor(this, config);
        const subtasks = this.getAllSubtasks(this.#backlog);
        await executor.executeParallel(subtasks);
      }
      ```
  - preserve: Existing processNextItem() for backward compatibility

SESSION_MANAGER_INTEGRATION:
  - file: src/core/session-manager.ts
  - integration: Use existing updateItemStatus() and flushUpdates() methods
  - pattern: Call from workers for atomic state updates
  - lines: 748-800 (updateItemStatus), 670-720 (flushUpdates)
  - gotcha: Call flushUpdates() after each task completes, not at end

PRP_RUNTIME_INTEGRATION:
  - file: src/agents/prp-runtime.ts
  - integration: Call executeSubtask() from parallel workers
  - lines: 139-232 (executeSubtask method)
  - pattern: await orchestrator.prpRuntime.executeSubtask(subtask, backlog)
  - gotcha: Thread-safe status updates via orchestrator.setStatus()

MODELS_INTEGRATION:
  - file: src/core/models.ts
  - integration: Use existing Subtask, Status, Backlog types
  - lines: 137-143 (Status type), 231-293 (Subtask interface)
  - gotcha: Status values are string literals - use strict equality

UTILS_INTEGRATION:
  - file: src/utils/task-utils.ts
  - integration: Use getDependencies() for dependency resolution
  - integration: Use findItem() for backlog traversal
  - pattern: Already called via orchestrator.canExecute()

LOGGER_INTEGRATION:
  - file: src/utils/logger.ts
  - integration: Use getLogger() for parallel execution logging
  - pattern: this.#logger.warn(), this.#logger.error(), this.#logger.debug()
  - gotcha: Include context in log messages (subtaskId, error details)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking
npm run typecheck

# Expected: Zero type errors in src/core/concurrent-executor.ts

# Run linting
npm run lint -- src/core/concurrent-executor.ts

# Expected: Zero linting errors

# Run format check
npm run format:check -- src/core/concurrent-executor.ts

# Expected: Zero formatting issues

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test ConcurrentTaskExecutor specifically
npm run test:run tests/unit/core/concurrent-executor.test.ts

# Expected: All tests pass with detailed output

# Run with coverage
npm run test:coverage -- tests/unit/core/concurrent-executor.test.ts

# Expected: >90% coverage

# Test related components
npm run test:run tests/unit/core/task-orchestrator.test.ts
npm run test:run tests/unit/core/task-dependencies.test.ts

# Expected: All existing tests still pass (no regressions)

# If tests fail, READ error output and fix implementation
```

### Level 3: Integration Testing (System Validation)

```bash
# Test TaskOrchestrator integration
npm run test:run tests/integration/core/task-orchestrator-runtime.test.ts

# Expected: Integration tests pass

# Manual testing with small task hierarchy
# Create test PRD with 5 subtasks, some with dependencies
tsx src/index.ts prd execute --scope P3.M1.T1

# Expected: Subtasks execute in parallel, dependencies respected

# Verify concurrency limit is respected
# Add logging to ConcurrentTaskExecutor to track active workers
# Run with 10 independent subtasks and maxConcurrency=3
# Should see max 3 concurrent executions

# Verify error isolation
# Create test where one subtask fails
# Expected: Other subtasks continue, failed subtask marked 'Failed'
```

### Level 4: Performance & Creative Validation

```bash
# Performance comparison: sequential vs parallel
# Create test with 20 independent subtasks
# Time sequential execution: node --time-limit script
# Time parallel execution: node --time-limit script
# Expected: Parallel execution is faster (approx 3x with maxConcurrency=3)

# Stress test: large task hierarchy
# Create test PRD with 100 subtasks
# Run with maxConcurrency=5
# Monitor memory usage: node --max-old-space-size=4096
# Expected: All subtasks complete, memory usage stable

# Deadlock detection test
# Create circular dependency: S1 -> S2 -> S1
# Expected: Deadlock detected and logged, error thrown

# Resource backpressure test
# Mock resource monitor to return high memory usage
# Expected: Executor waits before starting new tasks
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `src/core/concurrent-executor.ts` created with all required methods
- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting passes: `npm run format:check`
- [ ] All unit tests pass: `npm run test:run tests/unit/core/concurrent-executor.test.ts`
- [ ] Test coverage >90%: `npm run test:coverage`
- [ ] Integration tests pass: `npm run test:run tests/integration/core/task-orchestrator-runtime.test.ts`

### Feature Validation

- [ ] Concurrency limit is respected (verify with ConcurrencyTracker in tests)
- [ ] Dependencies are respected (verify with dependency ordering test)
- [ ] Error isolation works (individual failures don't stop others)
- [ ] State updates are atomic (no corruption, verify with batch test)
- [ ] Deadlock detection works (circular dependencies detected)
- [ ] Backpressure works (resource exhaustion prevented)
- [ ] Integration with TaskOrchestrator works (executeParallel() method callable)

### Code Quality Validation

- [ ] Follows ResearchQueue pattern for consistency
- [ ] Uses Promise.allSettled() for error isolation
- [ ] Semaphore implementation is correct
- [ ] Status updates use SessionManager for atomicity
- [ ] Error messages are informative with context
- [ ] Logging is present but not excessive
- [ ] No anti-patterns from template are present

### Documentation & Deployment

- [ ] Code is self-documenting with clear method names
- [ ] Complex logic has inline comments
- [ ] Test cases document expected behavior
- [ ] Integration points are documented in code comments

---

## Anti-Patterns to Avoid

- Don't use Promise.all() - use Promise.allSettled() for error isolation
- Don't skip state flushes - call flushUpdates() after each task completes
- Don't ignore backpressure - always check resources before executing
- Don't update same subtask concurrently - guaranteed by filtering but verify
- Don't use hardcoded concurrency - make it configurable
- Don't forget to release semaphore - always use finally block
- Don't suppress errors - log them but continue with other tasks
- Don't skip deadlock detection - check for no executable tasks
- Don't use sync operations in async context - all I/O must be async
- Don't ignore test patterns - use ConcurrencyTracker for validation
- Don't break existing sequential mode - preserve processNextItem()
- Don't forget to refresh backlog - reload state after each batch
