name: "P5.M1.T2.S1: Create Progress Tracker"
description: |

---

## Goal

**Feature Goal**: Create a progress tracking utility that provides real-time visibility into pipeline execution, including completion percentage, remaining task counts, and estimated time remaining (ETA).

**Deliverable**: `src/utils/progress.ts` with a `ProgressTracker` class that integrates with the existing Pino-based logging system and provides structured progress reporting for long-running pipeline operations.

**Success Definition**:

- ProgressTracker class tracks task completion and calculates timing metrics
- ETA calculation using exponential smoothing algorithm
- Human-readable progress bar formatting with configurable width
- Integration with Pino logger for structured progress events
- Progress logging every N tasks (configurable threshold)
- 100% test coverage following existing utility test patterns
- Zero TypeScript errors, zero linting errors

## Why

- **User Experience**: Long-running PRD decomposition and execution can take 30+ minutes; users need visibility into progress and estimated completion time
- **Observability**: Progress metrics enable monitoring of pipeline performance and identification of bottlenecks
- **Debugging**: ETA and timing data help identify slow tasks and optimize resource allocation
- **Production Readiness**: Structured progress logging integrates with log aggregation systems for dashboard visualization
- **Consistency**: Builds on P5.M1.T1.S1 (structured logging) to maintain consistent logging patterns across the codebase

## What

Create `src/utils/progress.ts` with a `ProgressTracker` class that:

1. **Tracks task completion**: Records start times and completion times for individual tasks
2. **Calculates progress metrics**: Computes completion percentage, remaining count, and average task duration
3. **Estimates time remaining**: Uses exponential smoothing to provide accurate ETA estimates
4. **Formats human-readable output**: Generates progress bars and formatted statistics
5. **Logs progress events**: Emits structured log messages at INFO level every N tasks

### Success Criteria

- [ ] ProgressTracker class exported from `src/utils/progress.ts`
- [ ] `recordStart(itemId: string): void` method records task start time
- [ ] `recordComplete(itemId: string): void` records task completion and calculates duration
- [ ] `getProgress(): ProgressReport` calculates completion percentage, remaining count, average duration
- [ ] `getETA(): number` estimates time remaining based on average task duration
- [ ] `formatProgress(): string` returns human-readable progress bar and statistics
- [ ] Progress logged at INFO level every N tasks (configurable, default: 10)
- [ ] Exponential smoothing ETA with alpha=0.3 (industry standard for responsiveness vs stability)
- [ ] Progress bar width configurable (default: 40 characters)
- [ ] Integration with Pino logger (use `getLogger('ProgressTracker')`)
- [ ] 100% test coverage in `tests/unit/utils/progress.test.ts`
- [ ] Zero TypeScript compilation errors
- [ ] Zero ESLint errors
- [ ] All tests pass

---

## All Needed Context

### Context Completeness Check

_The implementing agent has everything needed: contract definition from work item, existing codebase patterns (logger.ts, task-utils.ts), external best practices research, and test patterns from existing utility tests._

### Documentation & References

```yaml
# MUST READ - Contract Definition
- docfile: plan/001_14b9dc2a33c7/P5M1T2S1/research/external-progress-patterns.md
  why: Comprehensive research on progress tracking patterns, ETA algorithms, and best practices
  critical: Use exponential smoothing with alpha=0.3 for ETA; integrate with Pino logger
  section: "2.2 Exponential Smoothing (ETS)", "4.4 Integration with Structured Logging"

# MUST READ - Existing Utility Pattern (Follow This Structure)
- file: src/utils/logger.ts
  why: Follow the same module pattern: factory function, cache management, interface export, comprehensive JSDoc
  pattern: Module-level cache, factory function `getLogger()`, interface export, detailed JSDoc with examples
  gotcha: Use top-level await for pino initialization (same pattern), include sensitive data redaction paths

# MUST READ - Task Model Structure
- file: src/core/models.ts
  why: Understanding Backlog, Status types, and task hierarchy for progress calculation
  pattern: Type definitions with JSDoc, Zod schemas for validation, readonly properties
  gotcha: Status enum: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'

# MUST READ - Test Pattern Reference
- file: tests/unit/logger.test.ts
  why: Follow the test structure: describe blocks, beforeEach/afterEach for cache clearing, spy patterns for logging
  pattern: `beforeEach(() => clearLoggerCache())`, `vi.spyOn(logger, 'info')`, comprehensive edge case coverage
  gotcha: Clear any caches in beforeEach, use vi.clearAllMocks(), test both success and error paths

# MUST READ - Task Counting Pattern
- file: src/workflows/prp-pipeline.ts
  why: #countTasks(), #countCompletedTasks(), #countFailedTasks() methods show existing patterns for counting subtasks
  pattern: Nested for loops through phase.milestones.tasks.subtasks, filter by status
  section: Lines 1033-1085 (Private Helper Methods)
  gotcha: Only count subtasks (leaf nodes), not parent items

# EXTERNAL - ETA Algorithm Reference
- url: https://en.wikipedia.org/wiki/Exponential_smoothing
  why: Mathematical foundation for ETA calculation
  critical: Use formula: S_t = alpha * X_t + (1 - alpha) * S_{t-1} where alpha=0.3

# EXTERNAL - Progress Bar Best Practices
- url: https://www.npmjs.com/package/cli-progress
  why: Industry-standard progress bar format and ETA calculation patterns
  critical: Format: `[=====     ] 50% (50/100) ETA: 1m 30s`

# REFERENCE - Similar Utility (Test Factory Pattern)
- file: tests/unit/core/task-utils.test.ts
  why: CreateTestBacklog factory function pattern for creating test data
  pattern: `const createTestBacklog = (): Backlog => ({ ... })`
  section: Lines 1-200 (Test Data Factories)
```

### Current Codebase Tree

```bash
src/
├── agents/              # AI agent implementations
├── cli/                 # CLI argument parsing
├── config/              # Configuration modules
├── core/                # Core business logic
│   ├── models.ts        # Task hierarchy types (Backlog, Status, Phase, Milestone, Task, Subtask)
│   ├── task-orchestrator.ts  # Task execution with progress tracking (lines 1033-1085)
│   └── ...
├── models/              # Type definitions (merged into core/)
├── tools/               # MCP tools
├── utils/               # General utilities
│   ├── logger.ts        # Structured logging (FOLLOW THIS PATTERN)
│   ├── task-utils.ts    # Task hierarchy utilities
│   ├── git-commit.ts    # Git operations utility
│   └── progress.ts      # NEW FILE TO CREATE
└── workflows/           # Workflow orchestrations
    └── prp-pipeline.ts  # Main pipeline (will use ProgressTracker)

tests/
├── unit/
│   ├── logger.test.ts       # FOLLOW THIS TEST PATTERN
│   ├── utils/
│   │   └── git-commit.test.ts  # Utility test with mocked dependencies
│   └── core/
│       └── task-utils.test.ts  # Complex utility with 1000+ lines of tests
```

### Desired Codebase Tree

```bash
# No structural changes - add new file at:
src/utils/progress.ts    # NEW: Progress tracker utility
tests/unit/utils/progress.test.ts  # NEW: Progress tracker tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Follow existing utility patterns

// 1. Module structure: Use same pattern as logger.ts
// - Top-level imports
// - Type definitions (interfaces)
// - Constants (readonly)
// - Private state (Map for caching if needed)
// - Private helper functions
// - Public API (factory function, class)
// - Export all public types

// 2. Logger integration: MUST use existing Pino logger
// Import: import { getLogger } from './logger.js';
// Pattern: const logger = getLogger('ProgressTracker');
// Log levels: info for progress updates, debug for verbose metrics

// 3. ETA calculation: Use exponential smoothing (not simple average)
// Alpha = 0.3 (standard balance of responsiveness and stability)
// Handle cold start: return Infinity for ETA until minSamples (3) collected
// Formula: avgSpeed = alpha * currentSpeed + (1 - alpha) * avgSpeed

// 4. Progress logging: Every N tasks (configurable, default: 10)
// Don't log on every task (too verbose)
// Always log on completion (100%)
// Log at INFO level for user visibility

// 5. Progress bar formatting: Use ASCII characters
// Complete: '='
// Incomplete: '-' or ' '
// Format: [=====     ] 50% (50/100) ETA: 1m 30s

// 6. Time formatting: Human-readable durations
// < 60s: "30s"
// < 3600s: "1m 30s" (pad seconds to 2 digits)
// >= 3600s: "1h 01m" (pad minutes to 2 digits)

// 7. ES Module imports: Use .js extension
// import { getLogger } from './logger.js';
// import type { Backlog, Status } from '../core/models.js';

// 8. Immutable data: Don't modify Backlog directly
// ProgressTracker reads from Backlog but doesn't modify it
// Only tracks timing data internally

// 9. Type safety: Use readonly properties where possible
// readonly backlog: Backlog
// readonly startTimes: Map<string, number>
// readonly completedItems: Set<string>

// 10. Test coverage: 100% required
// Branch coverage: test all conditional paths
// Function coverage: test all public methods
// Use vi.spyOn for logger verification

// 11. JSDoc comments: Comprehensive documentation
// Every public method needs @param and @returns
// Include @remarks for implementation details
// Add @example for usage patterns

// 12. Cache management: No persistent cache needed
// ProgressTracker instances are short-lived (per pipeline run)
// Don't need clearCache() like logger.ts
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Progress report with completion metrics
 */
interface ProgressReport {
  /** Number of completed subtasks */
  completed: number;
  /** Total number of subtasks */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
  /** Number of remaining subtasks */
  remaining: number;
  /** Average task duration in milliseconds */
  averageDuration: number;
  /** Estimated time remaining in milliseconds (Infinity if unknown) */
  eta: number;
  /** Elapsed time since first task started (milliseconds) */
  elapsed: number;
}

/**
 * Progress tracker configuration options
 */
interface ProgressTrackerOptions {
  /** Backlog to track progress for (readonly reference) */
  readonly backlog: Backlog;
  /** Log progress every N tasks (default: 10) */
  readonly logInterval?: number;
  /** Progress bar width in characters (default: 40) */
  readonly barWidth?: number;
  /** ETA smoothing factor (default: 0.3) */
  readonly etaAlpha?: number;
  /** Minimum samples before showing ETA (default: 3) */
  readonly minSamples?: number;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/progress.ts
  - IMPLEMENT: ProgressReport, ProgressTrackerOptions interfaces
  - IMPLEMENT: ProgressTracker class with constructor
  - IMPLEMENT: Private state: startTimes (Map), completedItems (Set), durations (number[])
  - FOLLOW pattern: src/utils/logger.ts module structure
  - NAMING: ProgressTracker class, progressTracker factory function (optional)
  - PLACEMENT: src/utils/progress.ts (new file)

Task 2: IMPLEMENT recordStart(itemId: string): void
  - STORE: Map.set(itemId, Date.now())
  - LOG: Debug message when task starts
  - HANDLE: Duplicate calls (ignore if already started)
  - PATTERN: this.startTimes.set(itemId, Date.now())

Task 3: IMPLEMENT recordComplete(itemId: string): void
  - CALCULATE: duration = Date.now() - startTimes.get(itemId)
  - STORE: Add to durations array for ETA calculation
  - MARK: Add to completedItems Set
  - LOG: Progress update if (completedItems.size % logInterval === 0) or completed
  - PATTERN: this.durations.push(duration)

Task 4: IMPLEMENT getProgress(): ProgressReport
  - COUNT: Iterate through backlog.backlog to count total subtasks
  - COUNT: Use completedItems.size for completed count
  - CALCULATE: percentage = (completed / total) * 100
  - CALCULATE: averageDuration = mean(durations) or 0
  - CALCULATE: elapsed = Date.now() - firstStartTime
  - RETURN: ProgressReport object
  - PATTERN: Follow #countTasks() in prp-pipeline.ts (nested loops)

Task 5: IMPLEMENT getETA(): number (Exponential Smoothing)
  - CHECK: If durations.length < minSamples, return Infinity
  - CALCULATE: Speed = 1000 / averageDuration (tasks per second)
  - APPLY: Exponential smoothing to speed samples
  - CALCULATE: eta = (total - completed) / smoothedSpeed
  - RETURN: eta in milliseconds (or Infinity if speed is 0)
  - ALGORITHM: S_t = alpha * X_t + (1 - alpha) * S_{t-1}

Task 6: IMPLEMENT formatProgress(): string
  - GET: ProgressReport via getProgress()
  - BUILD: Progress bar: [=====     ] using '=' and '-'
  - FORMAT: Percentage as integer
  - FORMAT: Task count: "50/100"
  - FORMAT: ETA using formatDuration() helper
  - RETURN: Single line progress string
  - FORMAT: "[==========          ] 50% (50/100) ETA: 1m 30s"

Task 7: IMPLEMENT formatDuration(milliseconds: number): string
  - PRIVATE: Helper function for time formatting
  - CASE: < 60000ms → "30s"
  - CASE: < 3600000ms → "1m 30s" (pad seconds)
  - CASE: >= 3600000ms → "1h 01m" (pad minutes)
  - HANDLE: Infinity → "calculating..."

Task 8: INTEGRATE with Pino logger
  - IMPORT: import { getLogger } from './logger.js'
  - CREATE: const logger = getLogger('ProgressTracker')
  - LOG: Structured progress at INFO level
  - INCLUDE: completed, total, percentage, eta in log data
  - PATTERN: logger.info({ type: 'progress', completed, total, percentage, eta }, 'Progress update')

Task 9: CREATE tests/unit/utils/progress.test.ts
  - IMPLEMENT: Tests for all public methods (happy path, edge cases, errors)
  - FOLLOW: Pattern from tests/unit/logger.test.ts
  - MOCK: Logger using vi.spyOn, verify log calls
  - TEST: recordStart(), recordComplete(), getProgress(), getETA(), formatProgress()
  - COVERAGE: 100% required
  - FIXTURES: createTestBacklog() factory for test data

Task 10: VERIFY integration readiness
  - RUN: npm run typecheck (zero errors)
  - RUN: npm run lint (zero errors)
  - RUN: npm test -- tests/unit/utils/progress.test.ts (all pass)
  - RUN: npm run test:coverage (100% coverage)
```

### Implementation Patterns & Key Details

````typescript
// ===== MODULE STRUCTURE (Follow logger.ts) =====
/**
 * Progress tracking utility for pipeline execution
 *
 * @module utils/progress
 *
 * @remarks
 * Provides real-time progress tracking with ETA calculation using
 * exponential smoothing. Integrates with Pino logger for structured
 * progress events.
 *
 * @example
 * ```typescript
 * import { progressTracker } from './utils/progress.js';
 * import type { Backlog } from './core/models.js';
 *
 * const tracker = progressTracker({ backlog: myBacklog, logInterval: 10 });
 * tracker.recordStart('P1.M1.T1.S1');
 * // ... task executes ...
 * tracker.recordComplete('P1.M1.T1.S1');
 * console.log(tracker.formatProgress());
 * // Output: [==========          ] 10% (10/100) ETA: 5m 30s
 * ```
 */

// ===== TYPE DEFINITIONS =====
/**
 * Progress report with completion metrics
 *
 * @remarks
 * Provides snapshot of current progress including completion percentage,
 * remaining tasks, average duration, and ETA.
 */
export interface ProgressReport {
  /** Number of completed subtasks */
  readonly completed: number;
  /** Total number of subtasks in backlog */
  readonly total: number;
  /** Completion percentage (0-100) */
  readonly percentage: number;
  /** Number of remaining subtasks */
  readonly remaining: number;
  /** Average task duration in milliseconds */
  readonly averageDuration: number;
  /** Estimated time remaining in milliseconds (Infinity if unknown) */
  readonly eta: number;
  /** Elapsed time since first task started (milliseconds) */
  readonly elapsed: number;
}

/**
 * Progress tracker configuration options
 *
 * @remarks
 * Configures logging frequency, display options, and ETA calculation
 * parameters. All fields are readonly for immutability.
 */
export interface ProgressTrackerOptions {
  /** Backlog to track progress for */
  readonly backlog: Backlog;
  /** Log progress every N tasks (default: 10) */
  readonly logInterval?: number;
  /** Progress bar width in characters (default: 40) */
  readonly barWidth?: number;
  /** ETA smoothing factor 0-1 (default: 0.3) */
  readonly etaAlpha?: number;
  /** Minimum samples before showing ETA (default: 3) */
  readonly minSamples?: number;
}

// ===== MAIN CLASS =====
/**
 * Progress tracker for pipeline execution
 *
 * @remarks
 * Tracks task start/completion times, calculates progress metrics,
 * and provides ETA estimation using exponential smoothing.
 *
 * Progress is logged at INFO level every N tasks (configurable).
 * All times are stored as millisecond timestamps.
 */
export class ProgressTracker {
  /** Backlog being tracked */
  readonly backlog: Backlog;

  /** Task start timestamps (item ID -> start time) */
  readonly #startTimes: Map<string, number>;

  /** Completed task IDs */
  readonly #completedItems: Set<string>;

  /** Task durations in milliseconds (for ETA calculation) */
  #durations: number[];

  /** Configuration options */
  readonly #options: Required<Omit<ProgressTrackerOptions, 'backlog'>>;

  /** Logger instance */
  readonly #logger: Logger;

  /** Smoothing state for ETA calculation */
  #smoothedSpeed: number | null;

  /** First task start time */
  #firstStartTime: number | null;

  /**
   * Creates a new progress tracker
   *
   * @param options - Configuration options
   * @throws {Error} If backlog is empty
   *
   * @remarks
   * Initializes tracker with backlog. Counts total subtasks on creation
   * for efficient progress calculation.
   */
  constructor(options: ProgressTrackerOptions) {
    this.backlog = options.backlog;
    this.#startTimes = new Map();
    this.#completedItems = new Set();
    this.#durations = [];
    this.#smoothedSpeed = null;
    this.#firstStartTime = null;

    // Default options
    this.#options = {
      logInterval: options.logInterval ?? 10,
      barWidth: options.barWidth ?? 40,
      etaAlpha: options.etaAlpha ?? 0.3,
      minSamples: options.minSamples ?? 3,
    };

    // Get logger
    this.#logger = getLogger('ProgressTracker');

    // Validate backlog has tasks
    const totalSubtasks = this.#countTotalSubtasks();
    if (totalSubtasks === 0) {
      throw new Error('Cannot track progress: backlog contains no subtasks');
    }
  }

  /**
   * Records task start time
   *
   * @param itemId - Task/subtask ID (e.g., "P1.M1.T1.S1")
   *
   * @remarks
   * Stores current timestamp. Ignored if task already started.
   * First task start time is tracked for elapsed time calculation.
   */
  recordStart(itemId: string): void {
    if (this.#startTimes.has(itemId)) {
      return; // Already started
    }

    const startTime = Date.now();
    this.#startTimes.set(itemId, startTime);

    // Track first start time
    if (this.#firstStartTime === null) {
      this.#firstStartTime = startTime;
    }

    this.#logger.debug({ itemId }, 'Task started');
  }

  /**
   * Records task completion
   *
   * @param itemId - Task/subtask ID
   * @throws {Error} If task was not started
   *
   * @remarks
   * Calculates duration, stores for ETA calculation, and logs
   * progress if log interval threshold reached.
   */
  recordComplete(itemId: string): void {
    const startTime = this.#startTimes.get(itemId);
    if (startTime === undefined) {
      throw new Error(`Cannot complete unstarted task: ${itemId}`);
    }

    const duration = Date.now() - startTime;
    this.#durations.push(duration);
    this.#completedItems.add(itemId);

    // Log progress if interval reached
    const completed = this.#completedItems.size;
    const total = this.#countTotalSubtasks();

    if (completed % this.#options.logInterval === 0 || completed === total) {
      const progress = this.getProgress();
      this.#logger.info(
        {
          type: 'progress',
          completed: progress.completed,
          total: progress.total,
          percentage: progress.percentage,
          eta: progress.eta === Infinity ? null : progress.eta,
          elapsed: progress.elapsed,
        },
        'Progress update'
      );
    }

    this.#logger.debug({ itemId, duration }, 'Task completed');
  }

  /**
   * Gets current progress report
   *
   * @returns Progress report with all metrics
   *
   * @remarks
   * Counts total subtasks from backlog (expensive operation).
   * Consider caching result if called frequently.
   */
  getProgress(): ProgressReport {
    const total = this.#countTotalSubtasks();
    const completed = this.#completedItems.size;
    const remaining = total - completed;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const averageDuration = this.#getAverageDuration();
    const elapsed =
      this.#firstStartTime !== null ? Date.now() - this.#firstStartTime : 0;
    const eta = this.getETA();

    return {
      completed,
      total,
      percentage,
      remaining,
      averageDuration,
      eta,
      elapsed,
    };
  }

  /**
   * Estimates time remaining
   *
   * @returns ETA in milliseconds (Infinity if unknown)
   *
   * @remarks
   * Uses exponential smoothing on task speed (tasks/second).
   * Returns Infinity until minSamples tasks completed.
   */
  getETA(): number {
    const minSamples = this.#options.minSamples;

    if (this.#durations.length < minSamples) {
      return Infinity;
    }

    const avgDuration = this.#getAverageDuration();
    if (avgDuration === 0) {
      return Infinity;
    }

    // Calculate current speed (tasks per second)
    const currentSpeed = 1000 / avgDuration;

    // Apply exponential smoothing
    const alpha = this.#options.etaAlpha;
    if (this.#smoothedSpeed === null) {
      this.#smoothedSpeed = currentSpeed;
    } else {
      this.#smoothedSpeed =
        alpha * currentSpeed + (1 - alpha) * this.#smoothedSpeed;
    }

    // Calculate ETA
    const total = this.#countTotalSubtasks();
    const completed = this.#completedItems.size;
    const remaining = total - completed;

    if (this.#smoothedSpeed === 0) {
      return Infinity;
    }

    return (remaining / this.#smoothedSpeed) * 1000;
  }

  /**
   * Formats progress as human-readable string
   *
   * @returns Formatted progress line
   *
   * @remarks
   * Includes progress bar, percentage, task count, and ETA.
   * Example: "[==========          ] 50% (50/100) ETA: 1m 30s"
   */
  formatProgress(): string {
    const progress = this.getProgress();
    const bar = this.#createProgressBar(progress.percentage);
    const eta = this.#formatDuration(progress.eta);

    return (
      `${bar} ${progress.percentage.toFixed(0).padStart(3)}% ` +
      `(${progress.completed}/${progress.total}) ETA: ${eta}`
    );
  }

  /**
   * Counts total subtasks in backlog
   *
   * @returns Total subtask count
   *
   * @remarks
   * Follows pattern from prp-pipeline.ts #countTasks().
   * Only counts leaf subtasks, not parent items.
   *
   * @private
   */
  #countTotalSubtasks(): number {
    let count = 0;
    for (const phase of this.backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          count += task.subtasks.length;
        }
      }
    }
    return count;
  }

  /**
   * Calculates average task duration
   *
   * @returns Average duration in milliseconds (0 if no data)
   *
   * @private
   */
  #getAverageDuration(): number {
    if (this.#durations.length === 0) {
      return 0;
    }
    const sum = this.#durations.reduce((a, b) => a + b, 0);
    return sum / this.#durations.length;
  }

  /**
   * Creates ASCII progress bar
   *
   * @param percentage - Completion percentage (0-100)
   * @returns Progress bar string
   *
   * @private
   */
  #createProgressBar(percentage: number): string {
    const width = this.#options.barWidth;
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;

    return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
  }

  /**
   * Formats duration as human-readable string
   *
   * @param milliseconds - Duration in milliseconds
   * @returns Formatted duration
   *
   * @remarks
   * Formats: "30s", "1m 30s", "1h 01m"
   * Returns "calculating..." for Infinity.
   *
   * @private
   */
  #formatDuration(milliseconds: number): string {
    if (milliseconds === Infinity || !isFinite(milliseconds)) {
      return 'calculating...';
    }

    const seconds = Math.floor(milliseconds / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
  }
}

/**
 * Factory function for creating progress tracker
 *
 * @param options - Configuration options
 * @returns Progress tracker instance
 *
 * @remarks
 * Convenience function for creating tracker. Equivalent to
 * `new ProgressTracker(options)`.
 */
export function progressTracker(
  options: ProgressTrackerOptions
): ProgressTracker {
  return new ProgressTracker(options);
}
````

### Integration Points

```yaml
PRP_INTEGRATION:
  - will_be_used_by: P5.M1.T2.S2 (Integrate progress with pipeline)
  - integrate_at: src/workflows/prp-pipeline.ts
  - pattern: Create tracker in constructor, call recordStart/recordComplete in executeBacklog()
  - log_interval: Every 10 tasks (default)

LOGGER_DEPENDENCY:
  - depends_on: P5.M1.T1.S1 (logger utility)
  - import_from: src/utils/logger.js
  - import_pattern: "import { getLogger } from './logger.js';"
  - context_string: 'ProgressTracker'

FUTURE_INTEGRATION:
  - consider: Adding ProgressTracker to TaskOrchestrator
  - consider: Exposing progress via API endpoint
  - consider: Emitting progress events for WebSocket clients
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating progress.ts
npx tsc --noEmit src/utils/progress.ts

# Format and lint
npm run lint -- src/utils/progress.ts
npm run format -- src/utils/progress.ts

# Project-wide validation
npm run typecheck
npm run lint
npm run format

# Expected: Zero TypeScript errors, zero ESLint errors
# If errors exist:
#   - Fix import paths (use .js extensions)
#   - Fix type errors (use proper types from models.ts)
#   - Re-run validation
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run progress tests
npm test -- tests/unit/utils/progress.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/utils/progress.test.ts

# Expected: All tests pass, 100% coverage
# If failing:
#   - Check test data factory creates valid Backlog
#   - Verify logger spy assertions
#   - Debug with console.log (temporarily)
#   - Fix and re-run
```

### Level 3: Integration Testing (System Validation)

```bash
# Build project
npm run build

# Test progress tracker with real backlog
node -e "
import { progressTracker } from './dist/utils/progress.js';
import { createTestBacklog } from './tests/fixtures/test-data.js';

const backlog = createTestBacklog();
const tracker = progressTracker({ backlog });

tracker.recordStart('P1.M1.T1.S1');
tracker.recordComplete('P1.M1.T1.S1');

console.log(tracker.formatProgress());
"

# Expected: Valid progress output, no runtime errors
# Format: [=====     ] 10% (10/100) ETA: 5m 30s
```

### Level 4: Manual & Domain Validation

```bash
# Test with large backlog (performance)
# Create test with 1000 subtasks
# Verify: No performance degradation

# Test ETA accuracy
# Run with predictable task durations
# Verify: ETA converges to reasonable estimate

# Test progress bar formatting
# Test with: 0%, 25%, 50%, 75%, 100% completion
# Verify: Progress bar renders correctly

# Test logging integration
# Run with --verbose flag
# Verify: Progress logs appear at INFO level
# Verify: Structured data includes all fields
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting correct: `npm run format`
- [ ] All tests pass: `npm test -- tests/unit/utils/progress.test.ts`
- [ ] 100% coverage: `npm run test:coverage -- tests/unit/utils/progress.test.ts`

### Feature Validation

- [ ] recordStart() stores task start time
- [ ] recordComplete() calculates duration and logs progress
- [ ] getProgress() returns accurate ProgressReport
- [ ] getETA() uses exponential smoothing (alpha=0.3)
- [ ] formatProgress() returns human-readable progress bar
- [ ] Progress logged every N tasks (configurable)
- [ ] ETA returns Infinity until minSamples (3) collected
- [ ] Logger integration uses getLogger('ProgressTracker')
- [ ] Zero console.log statements (use logger.info/debug)

### Code Quality Validation

- [ ] Follows logger.ts module structure pattern
- [ ] Comprehensive JSDoc comments on all public APIs
- [ ] Uses readonly properties for immutability
- [ ] Uses .js extensions for imports (ES modules)
- [ ] Private methods use #prefix
- [ ] Error handling with specific error types
- [ ] No external dependencies beyond existing logger

### Edge Cases Covered

- [ ] Empty backlog throws descriptive error
- [ ] recordComplete() before recordStart() throws error
- [ ] Duplicate recordStart() calls ignored
- [ ] ETA returns Infinity when insufficient data
- [ ] Zero average duration handled (returns Infinity)
- [ ] Completion at 100% logs final progress

---

## Anti-Patterns to Avoid

- ❌ Don't use simple average for ETA (use exponential smoothing)
- ❌ Don't log progress on every task (too verbose, use configurable interval)
- ❌ Don't modify the Backlog (read-only reference)
- ❌ Don't use console.log (use Pino logger)
- ❌ Don't forget .js extension in imports
- ❌ Don't calculate total subtasks on every getProgress() call (could cache)
- ❌ Don't show ETA before minSamples collected (show "calculating...")
- ❌ Don't use floating point for progress bar width (use Math.floor)
- ❌ Don't throw generic errors (use descriptive Error messages)
- ❌ Don't forget to handle division by zero (averageDuration = 0)
- ❌ Don't use mutable default parameters (use readonly options object)
- ❌ Don't expose internal state (keep #startTimes private)
