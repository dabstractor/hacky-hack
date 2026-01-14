name: "P5.M1.T2.S2: Integrate Progress with Pipeline"
description: |

---

## Goal

**Feature Goal**: Integrate the ProgressTracker utility (created in P5.M1.T2.S1) with the PRPPipeline to provide real-time progress reporting during pipeline execution, including task-by-task progress updates, periodic progress summaries, ETA estimates, and comprehensive progress logging during normal operation and graceful shutdown.

**Deliverable**: Modified `src/workflows/prp-pipeline.ts` with ProgressTracker integration at all task execution points, providing:

- Automatic progress tracking for all subtasks during execution
- Progress logging every 5 tasks with formatted progress bars
- Final summary with completion metrics and timing
- Progress state logging during graceful shutdown
- Full test coverage for the integration

**Success Definition**:

- ProgressTracker instantiated in PRPPipeline.executeBacklog() with session backlog
- recordStart() called before each subtask execution
- recordComplete() called after each subtask completion
- formatProgress() logged every 5 tasks (configurable via logInterval)
- Final summary logged with total progress, time taken, tasks completed
- Shutdown logging includes current progress state before exit
- All existing tests continue to pass
- New tests verify progress integration behavior
- Zero TypeScript errors, zero linting errors

## User Persona

**Target User**: Developers and operators running the PRP Pipeline for long-running PRD decomposition and execution workflows.

**Use Case**: A user initiates a PRP Pipeline that may process 50+ subtasks over 30+ minutes. They need visibility into:

- How many tasks have completed
- How many tasks remain
- Estimated time to completion
- Current execution status

**User Journey**:

1. User runs: `npm run pipeline -- my-prd.md`
2. Pipeline begins processing subtasks
3. Every 5 tasks, user sees: `[=======     ] 15% (15/100) ETA: 8m 30s`
4. User presses Ctrl+C to request shutdown
5. Pipeline shows: `Shutting down: Completed 45/100 tasks (45%)`
6. Progress state saved for potential resumption

**Pain Points Addressed**:

- **No visibility during execution**: Users don't know if pipeline is working or stuck
- **Unknown completion time**: Can't plan around long-running operations
- **Lost progress on shutdown**: No indication of what was completed before interruption

## Why

- **User Experience**: Long-running PRD decomposition (30+ minutes) requires progress feedback to prevent user abandonment and confusion
- **Operational Visibility**: Real-time progress metrics enable monitoring of pipeline health and performance
- **Production Readiness**: Structured progress logging integrates with log aggregation systems for dashboard visualization and alerting
- **Graceful Degradation**: Progress state on shutdown enables informed decisions about resumption or recovery
- **Dependency Chain**: Completes P5.M1.T2 (Progress Reporting) by building on P5.M1.T2.S1 (ProgressTracker) and P5.M1.T1.S1 (Structured Logging)

## What

Modify `src/workflows/prp-pipeline.ts` to integrate ProgressTracker with the following changes:

1. **Add ProgressTracker instance**: Create a private field `#progressTracker?: ProgressTracker`
2. **Instantiate in executeBacklog()**: Initialize tracker with session backlog and logInterval=5
3. **Track task starts**: Call `recordStart(itemId)` before each task execution
4. **Track task completion**: Call `recordComplete(itemId)` after each task succeeds
5. **Log periodic progress**: Call `logger.info(formatProgress())` every 5 tasks
6. **Log final summary**: Print comprehensive summary with getProgress() metrics
7. **Log shutdown progress**: Include progress state in cleanup() shutdown logging

### Success Criteria

- [ ] ProgressTracker imported from `src/utils/progress.js`
- [ ] Private field `#progressTracker?: ProgressTracker` added to PRPPipeline class
- [ ] ProgressTracker instantiated in executeBacklog() with session backlog
- [ ] recordStart() called before each subtask execution
- [ ] recordComplete() called after each subtask completion
- [ ] formatProgress() logged every 5 tasks
- [ ] Final summary logged with completion metrics
- [ ] Shutdown progress logged in cleanup() method
- [ ] Tests verify progress tracking integration
- [ ] All existing tests pass
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors

---

## All Needed Context

### Context Completeness Check

_The implementing agent has everything needed: the ProgressTracker contract from P5.M1.T2.S1, detailed PRPPipeline class analysis, existing logging patterns, test patterns, shutdown handling patterns, and external best practices research._

### Documentation & References

```yaml
# MUST READ - Contract Definition (ProgressTracker API)
- docfile: plan/001_14b9dc2a33c7/P5M1T2S1/PRP.md
  why: Defines the ProgressTracker class API that this PRP must consume
  critical: ProgressTracker constructor options, recordStart(), recordComplete(), getProgress(), formatProgress()
  section: "Implementation Blueprint", "Data Models and Structure"

# MUST READ - ProgressTracker Implementation
- file: src/utils/progress.ts
  why: The actual ProgressTracker class implementation (created by P5.M1.T2.S1)
  pattern: Class with recordStart(), recordComplete(), getProgress(), formatProgress() methods
  gotcha: Constructor requires { backlog, logInterval, barWidth, etaAlpha, minSamples } options
  section: Lines 1-753 (entire file)

# MUST READ - PRPPipeline Class (Target for Integration)
- file: src/workflows/prp-pipeline.ts
  why: The file to modify - contains executeBacklog(), cleanup(), signal handlers
  pattern: @ObservedState() fields, @Step() decorators, async methods, cleanup in finally block
  section: Lines 527-584 (executeBacklog), 894-950 (cleanup), 228-262 (signal handlers)
  gotcha: Signal handlers must be cleaned up in afterEach tests to prevent memory leaks

# MUST READ - TaskOrchestrator Execution Pattern
- file: src/core/task-orchestrator.ts
  why: Understanding where individual subtasks are executed
  pattern: processNextItem() -> #delegateByType() -> executeSubtask()
  section: Lines 783-808 (processNextItem), 568-728 (executeSubtask)
  gotcha: Subtask execution is wrapped in try/catch with setStatus('Complete' | 'Failed')

# MUST READ - Existing Logging Pattern
- file: src/utils/logger.ts
  why: The structured logging utility to use for progress output
  pattern: getLogger('Context') factory, info/debug/warn/error levels, child loggers
  section: Lines 1-200 (Logger interface and factory function)
  gotcha: Use .js extension in imports: "import { getLogger } from './logger.js';"

# MUST READ - Progress Logging Pattern Example
- file: src/workflows/prp-pipeline.ts
  why: Existing progress logging pattern to follow/replace
  pattern: "this.logger.info(`[PRPPipeline] Processed ${iterations} items...`)" on line 560
  section: Lines 552-565 (existing progress and shutdown logging)
  gotcha: Replace string interpolation with formatProgress() for richer output

# MUST READ - Test Patterns for Pipeline
- file: tests/unit/workflows/prp-pipeline.test.ts
  why: Follow existing test structure when adding progress integration tests
  pattern: vi.mock(), beforeEach/afterEach cleanup, mock SessionManager, signal listener cleanup
  section: Lines 1-100 (test setup and basic tests)
  gotcha: Always cleanup signal listeners in afterEach: "process.removeAllListeners('SIGINT')"

# MUST READ - Shutdown Test Pattern
- file: tests/integration/prp-pipeline-shutdown.test.ts
  why: Pattern for testing shutdown with progress state
  pattern: Emit SIGINT, verify cleanup called, check logger calls
  section: Lines 1-80 (signal handling tests)
  gotcha: Use warnSpy to verify shutdown messages

# MUST READ - External Best Practices
- docfile: plan/001_14b9dc2a33c7/P5M1T2S2/research/external-progress-integration-patterns.md
  why: Research on CLI progress reporting best practices, N-task intervals, shutdown handling
  critical: Update every 5 tasks (small/medium sessions), log structured data, clear progress on shutdown
  section: "1.1 Update Frequency", "4.1 Graceful Shutdown Pattern", "6.2 Integration with Existing TaskOrchestrator"
```

### Current Codebase Tree

```bash
src/
├── agents/              # AI agent implementations
├── cli/                 # CLI argument parsing
├── config/              # Configuration modules
├── core/                # Core business logic
│   ├── models.ts        # Task hierarchy types (Backlog, Status, Phase, Milestone, Task, Subtask)
│   ├── task-orchestrator.ts  # Task execution engine (processNextItem, delegateByType)
│   └── session-manager.ts    # Session state management
├── tools/               # MCP tools
├── utils/               # General utilities
│   ├── logger.ts        # Structured logging (Pino-based)
│   ├── task-utils.ts    # Task hierarchy utilities
│   └── progress.ts      # Progress tracking (CREATED IN P5.M1.T2.S1)
└── workflows/           # Workflow orchestrations
    └── prp-pipeline.ts  # TARGET FILE: Main pipeline workflow (MODIFY THIS)

tests/
├── unit/
│   ├── logger.test.ts       # Logger tests (462 test cases)
│   ├── workflows/
│   │   └── prp-pipeline.test.ts  # Pipeline unit tests (ADD PROGRESS TESTS HERE)
│   └── utils/
│       └── progress.test.ts      # ProgressTracker tests (CREATED IN P5.M1.T2.S1)
└── integration/
    └── prp-pipeline-shutdown.test.ts  # Shutdown handling tests (MODIFY FOR PROGRESS)
```

### Desired Codebase Tree

```bash
# No structural changes - modify existing file:
src/workflows/prp-pipeline.ts  # MODIFY: Add ProgressTracker integration

# Add tests to existing files:
tests/unit/workflows/prp-pipeline.test.ts  # ADD: Progress integration tests
tests/integration/prp-pipeline-shutdown.test.ts  # ADD: Shutdown progress tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: ProgressTracker Integration Constraints

// 1. ProgressTracker is created in P5.M1.T2.S1 (parallel execution)
// Assume it exists at src/utils/progress.ts with this API:
// - constructor(options: { backlog: Backlog, logInterval?: number, ... })
// - recordStart(itemId: string): void
// - recordComplete(itemId: string): void
// - getProgress(): ProgressReport
// - formatProgress(): string

// 2. PRPPipeline uses Groundswell @ObservedState() decorator
// Any new fields must be marked @ObservedState() if they need to be tracked
// For ProgressTracker (internal use only), use private field #progressTracker

// 3. executeBacklog() runs taskOrchestrator.processNextItem() in a loop
// The actual subtask execution happens inside TaskOrchestrator, not PRPPipeline
// Therefore: Wrap progress tracking around the loop, not inside TaskOrchestrator
// PATTERN: Record start/completion around processNextItem() call

// 4. Task IDs are the key for progress tracking
// Subtasks have IDs like "P1.M1.T1.S1"
// Pass these IDs to recordStart()/recordComplete()
// Available from: this.taskOrchestrator.currentItemId (observed state)

// 5. Log every N tasks (N=5 per work item specification)
// Don't log on every task (too verbose)
// Always log on completion (100%)
// Use modulo: if (completed % 5 === 0 || completed === total)

// 6. Shutdown handling is complex - PRPPipeline has signal handlers
// Signal handlers set shutdownRequested = true
// Check this flag in executeBacklog() loop
// Log progress before breaking out of loop

// 7. ProgressTracker requires backlog at construction time
// Can't create in PRPPipeline constructor (backlog not loaded yet)
// Create in executeBacklog() after sessionManager.currentSession is available
// Location: After "const backlog = this.sessionManager.currentSession?.taskRegistry;"

// 8. ES Module imports: Use .js extension
// import { ProgressTracker, progressTracker } from '../utils/progress.js';

// 9. Logger pattern: Use getLogger('PRPPipeline')
// Already exists as this.logger in PRPPipeline
// Use this.logger.info() for progress output

// 10. Test cleanup: Signal listeners must be removed
// In tests, afterEach must call:
// process.removeAllListeners('SIGINT');
// process.removeAllListeners('SIGTERM');
// Otherwise tests will interfere with each other

// 11. TaskOrchestrator doesn't expose current executing task ID
// Track this via taskOrchestrator.currentItemId (observed state)
// Or derive from backlog state changes

// 12. Progress format from ProgressTracker.formatProgress()
// Returns: "[=======     ] 15% (15/100) ETA: 8m 30s"
// Log this directly via logger.info()
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// No new data models - use ProgressTracker from P5.M1.T2.S1

// ProgressReport interface (from ProgressTracker):
interface ProgressReport {
  readonly completed: number;
  readonly total: number;
  readonly percentage: number;
  readonly remaining: number;
  readonly averageDuration: number;
  readonly eta: number;
  readonly elapsed: number;
}

// ProgressTrackerOptions (from ProgressTracker):
interface ProgressTrackerOptions {
  readonly backlog: Backlog;
  readonly logInterval?: number;
  readonly barWidth?: number;
  readonly etaAlpha?: number;
  readonly minSamples?: number;
}
```

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: MODIFY src/workflows/prp-pipeline.ts - Add ProgressTracker import
  - ADD: import { ProgressTracker, progressTracker } from '../utils/progress.js';
  - ADD: import type { Backlog } from '../core/models.js';
  - LOCATION: Top of file, after existing imports
  - PATTERN: Follow existing ES module import pattern with .js extensions

Task 2: MODIFY src/workflows/prp-pipeline.ts - Add private ProgressTracker field
  - ADD: private readonly #progressTracker?: ProgressTracker;
  - LOCATION: In PRPPipeline class private fields section (around line 157)
  - PATTERN: Use # prefix for private fields (same as #sigintHandler, #taskOrchestrator)
  - GOTCHA: Don't mark @ObservedState() - this is internal state only

Task 3: MODIFY src/workflows/prp-pipeline.ts - Instantiate ProgressTracker in executeBacklog()
  - LOCATION: executeBacklog() method, after backlog retrieval (around line 529)
  - ADD CODE:
    ```typescript
    // Initialize progress tracker with session backlog
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) {
      throw new Error('Cannot execute pipeline: no backlog found in session');
    }

    this.#progressTracker = progressTracker({
      backlog,
      logInterval: 5,  // Log progress every 5 tasks per work item spec
      barWidth: 40,
    });

    this.logger.info(
      `[PRPPipeline] Progress tracking initialized: ${this.#progressTracker.getProgress().total} subtasks`
    );
    ```
  - PATTERN: Follow existing error handling pattern for missing session data

Task 4: MODIFY src/workflows/prp-pipeline.ts - Track task start in executeBacklog() loop
  - LOCATION: executeBacklog() main loop, before processNextItem() (around line 538)
  - ADD CODE:
    ```typescript
    while (await this.taskOrchestrator.processNextItem()) {
      iterations++;
      this.completedTasks = this.#countCompletedTasks();

      // Track task completion for progress
      this.#progressTracker?.recordComplete(this.taskOrchestrator.currentItemId ?? '');

      // Log progress every 5 tasks
      if (this.completedTasks % 5 === 0) {
        this.logger.info(
          `[PRPPipeline] ${this.#progressTracker?.formatProgress()}`
        );
      }
      // ... rest of loop
    }
    ```
  - GOTCHA: recordComplete() after task completes, recordStart() would be before
  - PATTERN: Use optional chaining (?.) since tracker might not exist

Task 5: MODIFY src/workflows/prp-pipeline.ts - Log shutdown progress
  - LOCATION: executeBacklog() shutdown check (around line 547-556)
  - MODIFY EXISTING CODE to include progress:
    ```typescript
    if (this.shutdownRequested) {
      this.logger.info(
        '[PRPPipeline] Shutdown requested, finishing current task'
      );

      // Log progress state at shutdown
      const progress = this.#progressTracker?.getProgress();
      this.logger.info(
        `[PRPPipeline] Shutting down: ${progress?.completed}/${progress?.total} tasks complete (${progress?.percentage.toFixed(1)}%)`
      );

      this.currentPhase = 'shutdown_interrupted';
      break;
    }
    ```
  - PATTERN: Use getProgress() for structured data access

Task 6: MODIFY src/workflows/prp-pipeline.ts - Log final summary
  - LOCATION: executeBacklog() completion logging (around line 567-579)
  - MODIFY EXISTING CODE to use progress tracker:
    ```typescript
    if (!this.shutdownRequested) {
      this.logger.info(`[PRPPipeline] Processed ${iterations} items total`);

      const progress = this.#progressTracker?.getProgress();
      const failedTasks = this.#countFailedTasks();

      // Log final progress summary
      this.logger.info('[PRPPipeline] ===== Pipeline Complete =====');
      this.logger.info(
        `[PRPPipeline] Progress: ${this.#progressTracker?.formatProgress()}`
      );
      this.logger.info(
        `[PRPPipeline] Duration: ${progress?.elapsed.toFixed(0)}ms (${(progress?.elapsed ?? 0) / 1000}s)`
      );
      this.logger.info(`[PRPPipeline] Complete: ${progress?.completed}`);
      this.logger.info(`[PRPPipeline] Failed: ${failedTasks}`);
      this.logger.info('[PRPPipeline] ===== End Summary =====');
    }
    ```
  - PATTERN: Use ===== delimiters for summary sections (matches QA summary pattern)

Task 7: MODIFY src/workflows/prp-pipeline.ts - Log progress in cleanup()
  - LOCATION: cleanup() method (around line 894-950)
  - ADD PROGRESS LOGGING before state save:
    ```typescript
    // Log progress state before shutdown
    const progress = this.#progressTracker?.getProgress();
    if (progress) {
      this.logger.info(
        '[PRPPipeline] 💾 Saving progress state',
        {
          completedTasks: progress.completed,
          pendingTasks: progress.remaining,
          totalTasks: progress.total,
          completionRate: progress.percentage.toFixed(1) + '%',
          elapsed: progress.elapsed + 'ms',
        }
      );
    }
    ```
  - PATTERN: Use emoji prefix (💾) for visual clarity in logs
  - GOTCHA: Check if progress exists before logging

Task 8: CREATE tests/unit/workflows/prp-pipeline-progress.test.ts
  - IMPLEMENT: Unit tests for ProgressTracker integration
  - TEST CASES:
    - ProgressTracker instantiated with correct backlog
    - recordComplete() called after each task
    - Progress logged every 5 tasks
    - Final summary logged with correct metrics
    - Shutdown progress logged correctly
  - FOLLOW: Pattern from tests/unit/workflows/prp-pipeline.test.ts
  - MOCK: ProgressTracker to verify method calls
  - PLACEMENT: New test file alongside existing pipeline tests

Task 9: MODIFY tests/integration/prp-pipeline-shutdown.test.ts
  - ADD: Test for shutdown progress logging
  - VERIFY: Progress state included in shutdown logs
  - FOLLOW: Existing shutdown test patterns
  - GOTCHA: Cleanup signal listeners in afterEach

Task 10: VERIFY integration
  - RUN: npm run typecheck (zero errors)
  - RUN: npm run lint (zero errors)
  - RUN: npm test -- tests/unit/workflows/prp-pipeline-progress.test.ts (all pass)
  - RUN: npm test -- tests/integration/prp-pipeline-shutdown.test.ts (all pass)
  - RUN: npm test (all existing tests still pass)
````

### Implementation Patterns & Key Details

```typescript
// ===== IMPORT PATTERN =====
// Add to existing imports at top of prp-pipeline.ts
import { ProgressTracker, progressTracker } from '../utils/progress.js';
import type { Backlog } from '../core/models.js';

// ===== PRIVATE FIELD PATTERN =====
// In PRPPipeline class, add alongside other private fields
export class PRPPipeline extends Workflow {
  // ... existing fields ...

  /** Progress tracker for real-time execution metrics */
  readonly #progressTracker?: ProgressTracker;

  // ... rest of class ...
}

// ===== PROGRESS TRACKER INITIALIZATION PATTERN =====
// In executeBacklog() method, after backlog retrieval
@Step({ trackTiming: true })
async executeBacklog(): Promise<void> {
  this.logger.info('[PRPPipeline] Executing backlog');

  // Get backlog from session
  const backlog = this.sessionManager.currentSession?.taskRegistry;
  if (!backlog) {
    throw new Error('Cannot execute pipeline: no backlog found in session');
  }

  // CRITICAL: Initialize progress tracker with backlog
  this.#progressTracker = progressTracker({
    backlog,
    logInterval: 5,  // Per work item specification: every 5 tasks
  });

  this.logger.info(
    `[PRPPipeline] Progress tracking initialized: ${this.#progressTracker.getProgress().total} subtasks`
  );

  // ... rest of executeBacklog()
}

// ===== TASK EXECUTION LOOP PATTERN =====
// In executeBacklog() main loop
let iterations = 0;
const maxIterations = 10_000;

while (await this.taskOrchestrator.processNextItem()) {
  iterations++;

  // Safety check
  if (iterations > maxIterations) {
    throw new Error(`Execution exceeded ${maxIterations} iterations`);
  }

  // Update completed tasks count
  this.completedTasks = this.#countCompletedTasks();

  // CRITICAL: Track task completion for progress
  const currentItemId = this.taskOrchestrator.currentItemId ?? 'unknown';
  this.#progressTracker?.recordComplete(currentItemId);

  // CRITICAL: Log progress every 5 tasks (per work item spec)
  if (this.completedTasks % 5 === 0) {
    this.logger.info(
      `[PRPPipeline] ${this.#progressTracker?.formatProgress()}`
    );
  }

  // Check for shutdown request
  if (this.shutdownRequested) {
    this.logger.info(
      '[PRPPipeline] Shutdown requested, finishing current task'
    );

    // CRITICAL: Log progress state at shutdown
    const progress = this.#progressTracker?.getProgress();
    this.logger.info(
      `[PRPPipeline] Shutting down: ${progress?.completed}/${progress?.total} tasks complete (${progress?.percentage.toFixed(1)}%)`
    );

    this.currentPhase = 'shutdown_interrupted';
    break;
  }
}

// ===== FINAL SUMMARY PATTERN =====
// In executeBacklog() after loop completes
if (!this.shutdownRequested) {
  this.logger.info(`[PRPPipeline] Processed ${iterations} items total`);
  this.completedTasks = this.#countCompletedTasks();
  const failedTasks = this.#countFailedTasks();

  // CRITICAL: Log final progress summary
  const progress = this.#progressTracker?.getProgress();
  this.logger.info('[PRPPipeline] ===== Pipeline Complete =====');
  this.logger.info(
    `[PRPPipeline] Progress: ${this.#progressTracker?.formatProgress()}`
  );
  this.logger.info(
    `[PRPPipeline] Duration: ${(progress?.elapsed ?? 0).toFixed(0)}ms`
  );
  this.logger.info(`[PRPPipeline] Complete: ${progress?.completed ?? 0}`);
  this.logger.info(`[PRPPipeline] Failed: ${failedTasks}`);
  this.logger.info('[PRPPipeline] ===== End Summary =====');
}

// ===== CLEANUP PROGRESS LOGGING PATTERN =====
// In cleanup() method
@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  this.logger.info('[PRPPipeline] Starting cleanup and state preservation');

  try {
    // CRITICAL: Log progress state before shutdown
    const progress = this.#progressTracker?.getProgress();
    if (progress) {
      this.logger.info(
        '[PRPPipeline] 💾 Saving progress state',
        {
          completedTasks: progress.completed,
          pendingTasks: progress.remaining,
          totalTasks: progress.total,
          completionRate: `${progress.percentage.toFixed(1)}%`,
          elapsed: `${progress.elapsed}ms`,
          eta: progress.eta === Infinity ? null : progress.eta,
        }
      );
    }

    // Save current state
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (backlog) {
      await this.sessionManager.saveBacklog(backlog);
      this.logger.info('[PRPPipeline] ✅ State saved successfully');
    }

    // ... rest of cleanup
  } catch (error) {
    this.logger.error('[PRPPipeline] Cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ===== GOTCHA: TaskOrchestrator doesn't expose current task ID directly =====
// Use taskOrchestrator.currentItemId (observed state field)
// Fallback to empty string if null/undefined
const currentItemId = this.taskOrchestrator.currentItemId ?? '';

// ===== GOTCHA: ProgressTracker might not exist =====
// Always use optional chaining when accessing tracker methods
this.#progressTracker?.recordComplete(currentItemId);
const progress = this.#progressTracker?.getProgress();

// ===== PATTERN: Optional chaining for all progress tracker calls =====
// Safe even if tracker initialization failed
this.#progressTracker?.formatProgress();
this.#progressTracker?.getProgress();
```

### Integration Points

```yaml
PRPPIPELINE_MODIFICATIONS:
  - file: src/workflows/prp-pipeline.ts
  - import_progress: 'Add import for ProgressTracker and progressTracker'
  - add_field: 'Add #progressTracker private field'
  - initialize_tracker: 'Instantiate in executeBacklog() after backlog retrieval'
  - track_completion: 'Call recordComplete() in main loop after each task'
  - log_progress: 'Log formatProgress() every 5 tasks'
  - log_shutdown: 'Log getProgress() on shutdown request'
  - log_summary: 'Log final summary with getProgress() metrics'
  - log_cleanup: 'Log progress state in cleanup() before save'

DEPENDENCIES:
  - depends_on: P5.M1.T2.S1 (ProgressTracker utility)
  - depends_on: P5.M1.T1.S1 (Structured logging utility)
  - import_from: src/utils/progress.js
  - import_from: src/core/models.js (Backlog type)

TEST_MODIFICATIONS:
  - add_to: tests/unit/workflows/prp-pipeline-progress.test.ts (NEW FILE)
  - add_to: tests/integration/prp-pipeline-shutdown.test.ts (MODIFY)
  - pattern: 'Mock ProgressTracker, verify method calls, check logger output'

LOGGER_INTEGRATION:
  - use_existing: this.logger (already initialized in PRPPipeline)
  - log_level: INFO for progress updates
  - pattern: 'this.logger.info(`[PRPPipeline] ${formatProgress()}`)'
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying prp-pipeline.ts
npx tsc --noEmit src/workflows/prp-pipeline.ts

# Format and lint
npm run lint -- src/workflows/prp-pipeline.ts
npm run format -- src/workflows/prp-pipeline.ts

# Project-wide validation
npm run typecheck
npm run lint
npm run format

# Expected: Zero TypeScript errors, zero ESLint errors
# If errors exist:
#   - Fix import paths (use .js extensions)
#   - Fix type errors (Backlog type from core/models.js)
#   - Re-run validation
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run progress integration tests
npm test -- tests/unit/workflows/prp-pipeline-progress.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/workflows/prp-pipeline-progress.test.ts

# Run all pipeline tests
npm test -- tests/unit/workflows/

# Expected: All tests pass, good coverage
# If failing:
#   - Check ProgressTracker mock setup
#   - Verify logger spy assertions
#   - Debug with console.log (temporarily)
#   - Fix and re-run
```

### Level 3: Integration Testing (System Validation)

```bash
# Run shutdown integration tests
npm test -- tests/integration/prp-pipeline-shutdown.test.ts

# Run all integration tests
npm test -- tests/integration/

# Build project
npm run build

# Test with real PRD (if available)
npm run pipeline -- tests/fixtures/simple-prd.md

# Expected: Progress logging visible in output
# Format: "[PRPPipeline] [=======     ] 15% (15/100) ETA: 8m 30s"
```

### Level 4: Manual & Domain Validation

```bash
# Test progress tracking with small backlog
# Create PRD with 10 subtasks
# Verify: Progress logged at 5, 10

# Test progress tracking with large backlog
# Create PRD with 50 subtasks
# Verify: Progress logged at 5, 10, 15, 20, 25, 30, 35, 40, 45, 50

# Test shutdown with progress
# Run pipeline, press Ctrl+C at 30% completion
# Verify: Shutdown message includes progress state

# Test final summary
# Let pipeline complete normally
# Verify: Final summary includes duration, completion count

# Test ETA accuracy
# Run pipeline with predictable task durations
# Verify: ETA converges to reasonable estimate
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting correct: `npm run format`
- [ ] All unit tests pass: `npm test -- tests/unit/workflows/prp-pipeline-progress.test.ts`
- [ ] All integration tests pass: `npm test -- tests/integration/prp-pipeline-shutdown.test.ts`
- [ ] All existing tests still pass: `npm test`

### Feature Validation

- [ ] ProgressTracker instantiated with session backlog
- [ ] recordComplete() called after each task completion
- [ ] Progress logged every 5 tasks (not every task)
- [ ] Final summary includes all metrics (duration, complete, failed)
- [ ] Shutdown progress logged with percentage
- [ ] Cleanup progress state logged before save
- [ ] Progress format matches expected: "[======= ] 15% (15/100) ETA: 8m 30s"

### Code Quality Validation

- [ ] Follows existing PRPPipeline code patterns
- [ ] Uses this.logger (not console.log)
- [ ] Optional chaining for all ProgressTracker calls
- [ ] Private field uses # prefix
- [ ] ES module imports with .js extensions
- [ ] Error handling for missing backlog/session
- [ ] No duplicate progress logging (every 5 tasks only)

### Edge Cases Covered

- [ ] No backlog in session throws descriptive error
- [ ] ProgressTracker unavailable doesn't crash pipeline (optional chaining)
- [ ] Shutdown at 0% shows 0/0 tasks
- [ ] Shutdown at 100% shows full completion
- [ ] Final summary logs even if shutdown requested
- [ ] Cleanup handles missing progress gracefully

### Integration Validation

- [ ] ProgressTracker imported from correct path
- [ ] Backlog type imported from core/models.js
- [ ] Logger uses existing this.logger instance
- [ ] TaskOrchestrator.currentItemId accessed correctly
- [ ] SessionManager.saveBacklog() still works after progress logging

---

## Anti-Patterns to Avoid

- ❌ Don't create a new logger instance (use existing this.logger)
- ❌ Don't log progress on every task (too verbose, use every 5)
- ❌ Don't forget optional chaining (?.) when accessing progressTracker
- ❌ Don't hardcode task count (use getProgress().total)
- ❌ Don't use console.log for progress (use logger.info)
- ❌ Don't forget .js extension in imports
- ❌ Don't modify TaskOrchestrator (integrate in PRPPipeline only)
- ❌ Don't add @ObservedState() to private #progressTracker field
- ❌ Don't call recordStart() without corresponding recordComplete()
- ❌ Don't log progress before checking if tracker exists
- ❌ Don't use string interpolation for progress (use formatProgress())
- ❌ Don't skip shutdown progress logging (users need to know what completed)
- ❌ Don't forget to cleanup signal listeners in tests
