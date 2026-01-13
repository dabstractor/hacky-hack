# PRP for P4.M2.T1.S2: Integrate Parallel Research with Execution

---

## Goal

**Feature Goal**: Integrate `ResearchQueue` with `TaskOrchestrator` to enable parallel PRP generation for upcoming tasks while current task executes, improving pipeline throughput via "research ahead" behavior with PRP caching.

**Deliverable**: Modified `src/core/task-orchestrator.ts` containing:

- `researchQueue` property of type `ResearchQueue`
- Modified `executeSubtask()` method that checks cache before generating PRP
- Modified `executeTask()` method that enqueues all subtasks for background research
- Metrics logging for cache hits vs. PRP generations
- Integration with `PRPRuntime` for actual PRP execution

**Success Definition**:

- `TaskOrchestrator` has `researchQueue` property initialized in constructor
- `executeTask()` enqueues all subtasks at start via `researchQueue.enqueue()`
- `executeSubtask()` checks `researchQueue.getPRP()` before synchronous generation
- `executeSubtask()` triggers `researchQueue.processNext()` after starting execution
- Cache hits logged as `[TaskOrchestrator] Cache HIT: {taskId}` (count metrics)
- Cache misses logged as `[TaskOrchestrator] Cache MISS: {taskId} - generating PRP`
- All existing tests continue to pass
- New tests validate parallel research and caching behavior
- Zero regressions in pipeline functionality

## User Persona (if applicable)

**Target User**: TaskOrchestrator (internal pipeline automation)

**Use Case**: The TaskOrchestrator processes subtasks sequentially but needs PRPs for each subtask. Instead of waiting for PRP generation before execution, it uses `ResearchQueue` to pre-generate PRPs for upcoming tasks while current task executes.

**User Journey**:

1. TaskOrchestrator creates `ResearchQueue` instance on initialization
2. When processing a Task, `executeTask()` enqueues all subtasks to research queue
3. Research queue starts generating PRPs for first N subtasks (concurrency limit)
4. When `executeSubtask()` is called for a subtask:
   - Check if PRP exists in research queue cache
   - If cached: use cached PRP (skip generation, log cache hit)
   - If not cached: generate PRP synchronously (log cache miss)
5. Start subtask execution via `PRPRuntime.executeSubtask()`
6. Trigger `researchQueue.processNext()` to start background research for next pending task
7. Continue pipeline processing with parallel research in background

**Pain Points Addressed**:

- Eliminates sequential PRP generation bottleneck (research happens while executing)
- Reduces total pipeline time by overlapping research with execution
- Provides cache metrics for monitoring and optimization
- Maintains fallback to synchronous generation if cache miss

## Why

- **Throughput Improvement**: Parallel PRP generation overlaps LLM calls with execution, reducing total pipeline time
- **Research Queue Integration**: `ResearchQueue` (P4.M2.T1.S1) exists but is not integrated with `TaskOrchestrator`
- **Cache Optimization**: PRPs are expensive to generate; caching avoids redundant LLM calls
- **Metrics Visibility**: Logging cache hits/misses provides data for optimization decisions
- **Graceful Degradation**: Falls back to synchronous generation if PRP not in cache
- **Dependency Management**: Integrates with existing `TaskOrchestrator` and `PRPRuntime` without breaking changes

## What

### System Behavior

The modified `TaskOrchestrator`:

1. Creates `ResearchQueue` instance in constructor with `sessionManager` and `maxSize=3`
2. Stores `researchQueue` as readonly property
3. In `executeTask()`:
   - Enqueues all subtasks to `researchQueue` via `await researchQueue.enqueue(subtask, backlog)`
   - This triggers background PRP generation for first N subtasks (concurrency limit)
4. In `executeSubtask()`:
   - Check `researchQueue.getPRP(subtask.id)` for cached PRP
   - If cached: log `[TaskOrchestrator] Cache HIT: {subtask.id}`, increment hit counter
   - If not cached: log `[TaskOrchestrator] Cache MISS: {subtask.id} - generating PRP`, generate synchronously
   - Start execution via `PRPRuntime.executeSubtask(subtask, backlog)`
   - After starting execution, call `researchQueue.processNext(backlog)` to trigger next background research
5. Tracks metrics: `cacheHits`, `cacheMisses`, `prpGenerations` (logged periodically)
6. Integrates with `PRPRuntime` for actual execution (uses existing runtime)

### Success Criteria

- [ ] `TaskOrchestrator` constructor creates `ResearchQueue` instance
- [ ] `executeTask()` enqueues all subtasks at start
- [ ] `executeSubtask()` checks cache before synchronous PRP generation
- [ ] `executeSubtask()` triggers `processNext()` after starting execution
- [ ] Cache hits logged with `[TaskOrchestrator] Cache HIT: {taskId}` format
- [ ] Cache misses logged with `[TaskOrchestrator] Cache MISS: {taskId} - generating PRP`
- [ ] Metrics logged: total hits, total misses, hit ratio
- [ ] All existing tests pass (zero regressions)
- [ ] New tests for cache hit scenario
- [ ] New tests for cache miss scenario
- [ ] New tests for parallel research triggering
- [ ] Integration test validates full pipeline with parallel research

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact file paths to `ResearchQueue` (P4.M2.T1.S1 implementation)
- Exact file paths to `TaskOrchestrator` (to modify)
- Exact file paths to `PRPRuntime` (for execution)
- Complete method signatures for `ResearchQueue` API
- Complete code patterns for status management and logging
- Cache key structure (`taskId` string)
- Metrics logging patterns from existing codebase
- Test patterns matching existing codebase

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: src/core/research-queue.ts
  why: ResearchQueue class - complete API for parallel PRP generation
  pattern: Constructor takes SessionManager, maxSize default 3
  critical: enqueue(), processNext(), getPRP(), waitForPRP(), getStats()
  gotcha: Deduplicates automatically - skips if already researching or cached

- file: src/core/task-orchestrator.ts
  why: TaskOrchestrator class - modify constructor, executeTask(), executeSubtask()
  pattern: Lines 83-96 for constructor pattern
  pattern: Lines 494-506 for executeTask() method
  pattern: Lines 531-637 for executeSubtask() method
  critical: Must preserve setStatus() calls and error handling

- file: src/agents/prp-runtime.ts
  why: PRPRuntime class - executeSubtask() method for actual execution
  pattern: constructor(orchestrator: TaskOrchestrator)
  critical: executeSubtask(subtask: Subtask, backlog: Backlog): Promise<ExecutionResult>

- file: src/core/models.ts
  why: Task, Subtask, Backlog type definitions
  fields: Task has subtasks array, Subtask has id, dependencies, status

- file: tests/unit/core/task-orchestrator.test.ts
  why: Test patterns for TaskOrchestrator
  pattern: Mock SessionManager, test constructor and execute methods

- file: tests/unit/core/research-queue.test.ts
  why: Test patterns for ResearchQueue integration
  pattern: Mock PRPGenerator, test enqueue() and processNext()

- url: https://github.com/isaacs/lru-cache (reference for cache metrics patterns)
  why: Cache hit ratio calculation: hits / (hits + misses)

- url: https://nodejs.org/docs/latest/api/events.html#class-eventemitter
  why: Async patterns for background processing
```

### Current Codebase Tree

```bash
src/
├── core/
│   ├── index.ts                   # Barrel exports
│   ├── models.ts                  # Task, Subtask, Backlog, PRPDocument types
│   ├── research-queue.ts          # ResearchQueue - USE THIS (from P4.M2.T1.S1)
│   ├── session-manager.ts         # SessionManager class
│   ├── task-orchestrator.ts       # TaskOrchestrator - MODIFY THIS
│   ├── scope-resolver.ts          # Scope types and utilities
│   └── task-patcher.ts            # Task patching utilities
├── agents/
│   ├── agent-factory.ts           # createResearcherAgent(), createCoderAgent()
│   ├── prp-generator.ts           # PRPGenerator
│   ├── prp-executor.ts            # PRPExecutor
│   └── prp-runtime.ts             # PRPRuntime - USE THIS for execution
└── utils/
    └── git-commit.ts              # smartCommit utility

tests/
├── unit/
│   ├── core/
│   │   ├── research-queue.test.ts     # ResearchQueue tests
│   │   └── task-orchestrator.test.ts  # TaskOrchestrator tests - EXTEND THIS
│   └── agents/
│       └── prp-runtime.test.ts        # PRPRuntime tests
└── integration/
    └── (integration tests)
```

### Desired Codebase Tree with Files Modified

```bash
src/
├── core/
│   ├── research-queue.ts          # EXISTING - ResearchQueue class
│   └── task-orchestrator.ts       # MODIFY - Add researchQueue property, modify methods

tests/
├── unit/
│   └── core/
│       ├── research-queue.test.ts        # EXISTING
│       └── task-orchestrator.test.ts     # EXTEND - Add cache/parallel research tests
└── integration/
    └── task-orchestrator-parallel-research.test.ts  # NEW - Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports must use .js extension
import { ResearchQueue } from './research-queue.js';
import { PRPRuntime } from '../agents/prp-runtime.js';

// CRITICAL: ResearchQueue constructor takes SessionManager and optional maxSize
const queue = new ResearchQueue(sessionManager, 3);

// CRITICAL: ResearchQueue.enqueue() returns Promise<void>
await this.researchQueue.enqueue(subtask, backlog);

// CRITICAL: ResearchQueue.getPRP() returns PRPDocument | null (not Promise)
const cachedPRP = this.researchQueue.getPRP(subtask.id);

// CRITICAL: ResearchQueue.waitForPRP() returns Promise<PRPDocument>
// Only use if PRP is in-flight or cached, throws if not found
const prp = await this.researchQueue.waitForPRP(subtask.id);

// CRITICAL: ResearchQueue.processNext() returns Promise<void>
// Safe to call multiple times (idempotent)
await this.researchQueue.processNext(backlog);

// CRITICAL: ResearchQueue deduplicates automatically
// enqueue() is no-op if already researching or cached
// No need to check before calling enqueue()

// PATTERN: Cache key is taskId (string)
// ResearchQueue uses taskId as the cache key
const taskId = subtask.id; // e.g., "P1.M1.T1.S1"

// PATTERN: Log format for cache hits
console.log(`[TaskOrchestrator] Cache HIT: ${subtask.id}`);

// PATTERN: Log format for cache misses
console.log(`[TaskOrchestrator] Cache MISS: ${subtask.id} - generating PRP synchronously`);

// GOTCHA: PRPRuntime.executeSubtask() handles PRP generation internally
// If ResearchQueue is empty, PRPRuntime will generate PRP synchronously
// Our cache check is an optimization to avoid duplicate generation

// PATTERN: Metrics tracking
// Use private fields to track cache hits/misses
readonly #cacheHits: number = 0;
readonly #cacheMisses: number = 0;

// Log metrics after each task or on completion
const hitRatio = this.#cacheHits / (this.#cacheHits + this.#cacheMisses);
console.log(`[TaskOrchestrator] Cache metrics: ${this.#cacheHits} hits, ${this.#cacheMisses} misses, ${(hitRatio * 100).toFixed(1)}% hit ratio`);

// CRITICAL: executeTask() must iterate all subtasks
// Use task.subtasks array to enqueue all subtasks
for (const subtask of task.subtasks) {
  await this.researchQueue.enqueue(subtask, this.#backlog);
}

// CRITICAL: executeSubtask() must preserve existing status progression
// Researching → Implementing → Complete/Failed
// The PRPRuntime handles status updates internally

// PATTERN: Trigger background research AFTER starting execution
// Call processNext() after PRPRuntime.executeSubtask() starts
// This ensures background research doesn't interfere with current execution

// GOTCHA: PRPRuntime.executeSubtask() is async
// Use fire-and-forget pattern or await depending on requirements
// For triggering background research, use fire-and-forget:
this.researchQueue.processNext(backlog).catch(console.error);

// PATTERN: SessionManager is accessed via orchestrator.sessionManager
// Use this.sessionManager to pass to ResearchQueue constructor
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from codebase:

```typescript
// Re-export from existing modules
import type {
  Backlog, // From src/core/models.js
  Task, // From src/core/models.js - has subtasks array
  Subtask, // From src/core/models.js
  Status, // From src/core/models.js
} from './models.js';

import type { SessionManager } from './session-manager.js';
import { ResearchQueue } from './research-queue.js';
import { PRPRuntime } from '../agents/prp-runtime.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/core/task-orchestrator.ts - Add imports
  - ADD: Import ResearchQueue from './research-queue.js'
  - ADD: Import PRPRuntime from '../agents/prp-runtime.js'
  - PLACE: At top of file with other imports
  - PRESERVE: All existing imports

Task 2: MODIFY TaskOrchestrator class - Add properties
  - ADD: readonly researchQueue: ResearchQueue property
  - ADD: readonly #prpRuntime: PRPRuntime private property
  - ADD: readonly #cacheHits: number = 0 for metrics
  - ADD: readonly #cacheMisses: number = 0 for metrics
  - PLACE: After existing private fields (#backlog, #scope, #executionQueue)
  - NAMING: camelCase for properties, # prefix for private fields

Task 3: MODIFY constructor - Initialize ResearchQueue and PRPRuntime
  - CREATE: this.researchQueue = new ResearchQueue(this.sessionManager, 3)
  - CREATE: this.#prpRuntime = new PRPRuntime(this)
  - PLACE: After existing initialization code (after this.#executionQueue = this.#buildQueue(scope))
  - PRESERVE: All existing constructor logic

Task 4: MODIFY executeTask() - Enqueue all subtasks
  - FIND: Line ~494-506 (executeTask method)
  - ADD: After status update to 'Implementing', iterate task.subtasks
  - IMPLEMENT: for (const subtask of task.subtasks) { await this.researchQueue.enqueue(subtask, this.#backlog); }
  - LOG: Log enqueue count: `[TaskOrchestrator] Enqueued ${task.subtasks.length} subtasks for parallel research`
  - PLACE: Before console.log for executing task
  - PRESERVE: All existing executeTask() logic

Task 5: MODIFY executeSubtask() - Add cache check
  - FIND: Line ~531-637 (executeSubtask method)
  - ADD: After setStatus to 'Researching', check cache
  - IMPLEMENT: const cachedPRP = this.researchQueue.getPRP(subtask.id);
  - ADD: if (cachedPRP) { this.#cacheHits++; console.log(`[TaskOrchestrator] Cache HIT: ${subtask.id}`); }
  - ADD: else { this.#cacheMisses++; console.log(`[TaskOrchestrator] Cache MISS: ${subtask.id} - will use PRPRuntime`); }
  - PLACE: Before dependency check (canExecute)
  - PRESERVE: All existing executeSubtask() logic

Task 6: MODIFY executeSubtask() - Replace PRP generation with PRPRuntime
  - FIND: Lines ~569-577 (PLACEHOLDER section)
  - REPLACE: console.log('[TaskOrchestrator] PLACEHOLDER: Would generate PRP...')
  - WITH: const result = await this.#prpRuntime.executeSubtask(subtask, this.#backlog);
  - ADD: After starting execution, trigger background research
  - IMPLEMENT: this.researchQueue.processNext(this.#backlog).catch((error) => { console.error(`[TaskOrchestrator] Background research error: ${error}`); });
  - PLACE: After PRPRuntime.executeSubtask() call
  - PRESERVE: Status updates, smart commit, error handling

Task 7: ADD metrics logging method
  - CREATE: private #logCacheMetrics(): void method
  - IMPLEMENT: Log hits, misses, hit ratio percentage
  - IMPLEMENT: Format: `[TaskOrchestrator] Cache metrics: X hits, Y misses, Z% hit ratio`
  - CALL: From executeTask() after all subtasks complete
  - PLACE: After executeTask() loop

Task 8: CREATE tests/unit/core/task-orchestrator-cache.test.ts
  - SETUP: Mock SessionManager, ResearchQueue, PRPRuntime
  - TEST: Constructor creates ResearchQueue with maxSize=3
  - TEST: executeTask() enqueues all subtasks
  - TEST: executeSubtask() checks ResearchQueue.getPRP()
  - TEST: executeSubtask() logs cache hit when PRP found
  - TEST: executeSubtask() logs cache miss when PRP not found
  - TEST: executeSubtask() triggers processNext() after starting execution
  - PATTERN: Use vitest describe/it/expect, vi.mock()
  - FIXTURES: Mock task, subtask, backlog, prp

Task 9: EXTEND tests/unit/core/task-orchestrator.test.ts
  - ADD: Tests for ResearchQueue integration
  - TEST: Verify ResearchQueue is initialized in constructor
  - TEST: Verify PRPRuntime is initialized in constructor
  - TEST: Verify cache metrics are incremented correctly
  - PRESERVE: All existing tests

Task 10: CREATE tests/integration/task-orchestrator-parallel-research.test.ts
  - SETUP: Real TaskOrchestrator with mocked dependencies
  - MOCK: PRPGenerator.generate() to avoid real LLM calls
  - TEST: executeTask() triggers parallel research for all subtasks
  - TEST: executeSubtask() uses cached PRP when available
  - TEST: executeSubtask() triggers background research via processNext()
  - TEST: Cache metrics are tracked correctly across multiple subtasks
  - SKIP: Mark as test.skip if running in CI without API credentials
```

### Implementation Patterns & Key Details

```typescript
// File: src/core/task-orchestrator.ts

// CRITICAL: Import ResearchQueue and PRPRuntime
import { ResearchQueue } from './research-queue.js';
import { PRPRuntime } from '../agents/prp-runtime.js';

// CRITICAL: Add properties to TaskOrchestrator class
export class TaskOrchestrator {
  readonly sessionManager: SessionManager;

  // Existing private fields
  #backlog: Backlog;
  #scope: Scope | undefined;
  #executionQueue: HierarchyItem[];

  // NEW: Research queue for parallel PRP generation
  readonly researchQueue: ResearchQueue;

  // NEW: PRP runtime for execution
  readonly #prpRuntime: PRPRuntime;

  // NEW: Cache metrics
  #cacheHits: number = 0;
  #cacheMisses: number = 0;

  // ... existing constructor code ...

  constructor(sessionManager: SessionManager, scope?: Scope) {
    this.sessionManager = sessionManager;

    // ... existing initialization code ...

    this.#scope = scope;
    this.#executionQueue = this.#buildQueue(scope);

    // NEW: Initialize ResearchQueue with concurrency limit of 3
    this.researchQueue = new ResearchQueue(this.sessionManager, 3);

    // NEW: Initialize PRPRuntime for execution
    this.#prpRuntime = new PRPRuntime(this);

    console.log('[TaskOrchestrator] ResearchQueue initialized with maxSize=3');
    console.log(
      '[TaskOrchestrator] PRPRuntime initialized for subtask execution'
    );
  }

  // ... existing methods ...

  /**
   * Executes a Task item
   *
   * @remarks
   * MODIFIED: Now enqueues all subtasks for parallel research at start.
   */
  async executeTask(task: Task): Promise<void> {
    console.log(
      `[TaskOrchestrator] Task: ${task.id} - Setting status to Implementing`
    );

    await this.#updateStatus(task.id, 'Implementing');
    console.log(
      `[TaskOrchestrator] Executing Task: ${task.id} - ${task.title}`
    );

    // NEW: Enqueue all subtasks for parallel research
    console.log(
      `[TaskOrchestrator] Enqueuing ${task.subtasks.length} subtasks for parallel PRP generation`
    );

    for (const subtask of task.subtasks) {
      await this.researchQueue.enqueue(subtask, this.#backlog);
      console.log(
        `[TaskOrchestrator] Enqueued ${subtask.id} for parallel research`
      );
    }

    // Log queue statistics after enqueueing
    const stats = this.researchQueue.getStats();
    console.log(
      `[TaskOrchestrator] Research queue stats: ${stats.queued} queued, ${stats.researching} researching, ${stats.cached} cached`
    );
  }

  /**
   * Executes a Subtask item
   *
   * @remarks
   * MODIFIED: Now checks ResearchQueue cache before execution and triggers
   * background research after starting execution.
   */
  async executeSubtask(subtask: Subtask): Promise<void> {
    console.log(
      `[TaskOrchestrator] Executing Subtask: ${subtask.id} - ${subtask.title}`
    );

    // PATTERN: Set 'Researching' status at start
    await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');
    console.log(
      `[TaskOrchestrator] Researching: ${subtask.id} - preparing PRP`
    );

    // NEW: Check if PRP is cached in ResearchQueue
    const cachedPRP = this.researchQueue.getPRP(subtask.id);
    if (cachedPRP) {
      this.#cacheHits++;
      console.log(
        `[TaskOrchestrator] Cache HIT: ${subtask.id} - using cached PRP`
      );
    } else {
      this.#cacheMisses++;
      console.log(
        `[TaskOrchestrator] Cache MISS: ${subtask.id} - PRP will be generated by PRPRuntime`
      );
    }

    // Log cache metrics
    this.#logCacheMetrics();

    // NEW: Check if dependencies are satisfied
    if (!this.canExecute(subtask)) {
      const blockers = this.getBlockingDependencies(subtask);

      for (const blocker of blockers) {
        console.log(
          `[TaskOrchestrator] Blocked on: ${blocker.id} - ${blocker.title} (status: ${blocker.status})`
        );
      }

      console.log(
        `[TaskOrchestrator] Subtask ${subtask.id} blocked on dependencies, skipping`
      );

      return;
    }

    // PATTERN: Set 'Implementing' status before work
    await this.setStatus(subtask.id, 'Implementing', 'Starting implementation');

    // PATTERN: Wrap execution in try/catch for error handling
    try {
      // NEW: Use PRPRuntime for execution (handles PRP generation if cache miss)
      console.log(
        `[TaskOrchestrator] Starting PRPRuntime execution for ${subtask.id}`
      );

      const result = await this.#prpRuntime.executeSubtask(
        subtask,
        this.#backlog
      );

      console.log(
        `[TaskOrchestrator] PRPRuntime execution ${result.success ? 'succeeded' : 'failed'} for ${subtask.id}`
      );

      // NEW: Trigger background research for next pending tasks
      // Fire-and-forget: don't await, log errors
      this.researchQueue.processNext(this.#backlog).catch(error => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[TaskOrchestrator] Background research error: ${errorMessage}`
        );
      });

      // Log updated queue statistics
      const stats = this.researchQueue.getStats();
      console.log(
        `[TaskOrchestrator] Research queue stats: ${stats.queued} queued, ${stats.researching} researching, ${stats.cached} cached`
      );

      // PATTERN: Set 'Complete' status on success
      if (result.success) {
        await this.setStatus(
          subtask.id,
          'Complete',
          'Implementation completed successfully'
        );
      } else {
        await this.setStatus(
          subtask.id,
          'Failed',
          result.error ?? 'Execution failed'
        );
      }

      // Smart commit after successful subtask completion
      try {
        const sessionPath = this.sessionManager.currentSession?.metadata.path;
        if (!sessionPath) {
          console.warn(
            '[TaskOrchestrator] Session path not available for smart commit'
          );
        } else {
          const commitMessage = `${subtask.id}: ${subtask.title}`;
          const commitHash = await smartCommit(sessionPath, commitMessage);

          if (commitHash) {
            console.log(`[TaskOrchestrator] Commit created: ${commitHash}`);
          } else {
            console.log('[TaskOrchestrator] No files to commit');
          }
        }
      } catch (error) {
        // Don't fail the subtask if commit fails
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[TaskOrchestrator] Smart commit failed: ${errorMessage}`
        );
      }
    } catch (error) {
      // PATTERN: Set 'Failed' status on exception with error details
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.setStatus(
        subtask.id,
        'Failed',
        `Execution failed: ${errorMessage}`
      );

      console.error(
        `[TaskOrchestrator] ERROR: ${subtask.id} failed: ${errorMessage}`
      );
      if (error instanceof Error && error.stack) {
        console.error(`[TaskOrchestrator] Stack trace: ${error.stack}`);
      }

      // PATTERN: Re-throw error for upstream handling
      throw error;
    }
  }

  /**
   * Logs cache metrics for monitoring
   *
   * @private
   */
  #logCacheMetrics(): void {
    const total = this.#cacheHits + this.#cacheMisses;
    const hitRatio = total > 0 ? (this.#cacheHits / total) * 100 : 0;

    console.log(
      `[TaskOrchestrator] Cache metrics: ${this.#cacheHits} hits, ${this.#cacheMisses} misses, ${hitRatio.toFixed(1)}% hit ratio`
    );
  }
}
```

### Integration Points

```yaml
RESEARCH_QUEUE:
  - import: ResearchQueue from './research-queue.js'
  - constructor: new ResearchQueue(sessionManager, 3)
  - usage: await researchQueue.enqueue(subtask, backlog)
  - usage: researchQueue.getPRP(taskId) returns PRPDocument | null
  - usage: researchQueue.processNext(backlog) triggers next background research
  - usage: researchQueue.getStats() returns statistics

PRPRUNTIME:
  - import: PRPRuntime from '../agents/prp-runtime.js'
  - constructor: new PRPRuntime(this) (passes TaskOrchestrator reference)
  - usage: await prpRuntime.executeSubtask(subtask, backlog)
  - returns: Promise<ExecutionResult>

SESSION_MANAGER:
  - existing: this.sessionManager (readonly property)
  - usage: Pass to ResearchQueue constructor

METRICS:
  - private fields: #cacheHits, #cacheMisses
  - method: #logCacheMetrics() for logging
  - format: hits, misses, hit ratio percentage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npm run lint -- src/core/task-orchestrator.ts     # ESLint with auto-fix
npm run format -- src/core/task-orchestrator.ts   # Prettier formatting
npm run check -- src/core/task-orchestrator.ts    # TypeScript type checking

# Project-wide validation
npm run lint    # Check all files
npm run format  # Format all files
npm run check   # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test TaskOrchestrator specifically
npm test -- tests/unit/core/task-orchestrator.test.ts

# Test new cache functionality
npm test -- tests/unit/core/task-orchestrator-cache.test.ts

# Run with coverage
npm test -- --coverage tests/unit/core/task-orchestrator.test.ts

# Full test suite for core
npm test -- tests/unit/core/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests
npm test -- tests/integration/task-orchestrator-parallel-research.test.ts

# Test parallel research behavior
npm test -- tests/integration/task-orchestrator-parallel-research.test.ts -t "enqueues all subtasks"

# Expected: TaskOrchestrator integrates with ResearchQueue correctly
```

### Level 4: End-to-End Validation

```bash
# Verify integration with existing components
npm test -- tests/unit/core/research-queue.test.ts    # Verify ResearchQueue
npm test -- tests/unit/agents/prp-runtime.test.ts     # Verify PRPRuntime
npm test -- tests/integration/prp-pipeline-integration.test.ts  # Verify full pipeline

# Run full test suite
npm test

# Expected: All existing tests still pass, no regressions introduced
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] `TaskOrchestrator` has `researchQueue` property initialized in constructor
- [ ] `TaskOrchestrator` has `#prpRuntime` property initialized in constructor
- [ ] `executeTask()` enqueues all subtasks via `researchQueue.enqueue()`
- [ ] `executeSubtask()` checks `researchQueue.getPRP()` before execution
- [ ] Cache hits logged as `[TaskOrchestrator] Cache HIT: {taskId}`
- [ ] Cache misses logged as `[TaskOrchestrator] Cache MISS: {taskId} - PRP will be generated by PRPRuntime`
- [ ] `executeSubtask()` triggers `researchQueue.processNext()` after starting execution
- [ ] Cache metrics logged: hits, misses, hit ratio
- [ ] All existing tests pass (zero regressions)

### Code Quality Validation

- [ ] Follows existing codebase patterns (task-orchestrator.ts structure)
- [ ] Uses `.js` extensions for ES module imports
- [ ] Private fields use `#` prefix
- [ ] Readonly public fields for immutability
- [ ] Console logging for cache hits/misses and metrics
- [ ] Fire-and-forget pattern for `processNext()` error handling

### Documentation & Deployment

- [ ] Comprehensive JSDoc comments on modified methods
- [ ] Module-level JSDoc explains ResearchQueue integration
- [ ] Comments explain cache check logic
- [ ] Error handling for background research failures

---

## Anti-Patterns to Avoid

- ❌ Don't access private fields on ResearchQueue - use public API only
- ❌ Don't await `researchQueue.processNext()` - use fire-and-forget pattern
- ❌ Don't duplicate PRP generation logic - let PRPRuntime handle it
- ❌ Don't skip cache check - always check `getPRP()` before execution
- ❌ Don't forget to log cache metrics - critical for monitoring
- ❌ Don't modify existing status progression - preserve Researching → Implementing → Complete/Failed
- ❌ Don't create new PRPGenerator instances - use ResearchQueue
- ❌ Don't hardcode concurrency limit - use parameter (default 3)
- ❌ Don't forget to enqueue all subtasks - iterate task.subtasks array
- ❌ Don't use `.ts` extensions in imports - ES modules require `.js`
- ❌ Don't throw errors on background research failures - log and continue
- ❌ Don't await PRPRuntime before triggering processNext() - start research in parallel
