# Product Requirement Prompt (PRP): Real-Time Progress Display

**PRP ID**: P2.M3.T1.S3
**Work Item**: Add real-time progress display
**Generated**: 2026-01-23

---

## Goal

**Feature Goal**: Create a real-time terminal-based visual progress display for pipeline execution that shows hierarchical progress (Phase/Milestone/Task/Subtask), current task information, estimated time remaining, and recent log entries.

**Deliverable**:
1. `ProgressDisplay` class at `src/utils/progress-display.ts` with cli-progress integration
2. `--progress-mode` CLI option (auto/always/never) in `src/cli/index.ts`
3. Integration with `PRPPipeline.executeBacklog()` for real-time updates
4. Unit tests at `tests/unit/utils/progress-display.test.ts`

**Success Definition**:
- Progress bars update in real-time during pipeline execution
- Four-level hierarchy (Phase/Milestone/Task/Subtask) is displayed
- ETA calculation matches existing ProgressTracker accuracy
- CI/CD environments (non-TTY) gracefully fallback to log-based progress
- All existing tests pass plus new tests achieve 80%+ coverage

---

## User Persona

**Target User**: Developer running the PRP Pipeline CLI

**Use Case**: Developer executes `hack --prd PRD.md` and wants visual feedback on pipeline progress beyond log-based output

**User Journey**:
1. User runs pipeline: `hack --prd PRD.md`
2. Progress display initializes (TTY detected in 'auto' mode)
3. Multi-bar display shows:
   - Overall pipeline progress bar
   - Current phase/milestone/task/subtask being executed
   - Estimated time remaining
   - Recent log entries
4. Display updates in real-time as tasks complete
5. Display stops cleanly on completion or interruption

**Pain Points Addressed**:
- Currently progress is log-based only - no visual indication of progress
- No ETA visibility during long-running pipelines
- No quick way to see which specific task is currently executing
- CI/CD logs can be overwhelming without visual progress indicators

---

## Why

- **Developer Experience**: Visual progress bars provide immediate feedback on pipeline status
- **Observability**: Real-time ETA helps developers plan their time during long-running tasks
- **Integration**: Builds on existing ProgressTracker infrastructure without breaking changes
- **CI/CD Compatibility**: Auto-detection of TTY ensures compatibility with automated pipelines

---

## What

### User-Visible Behavior

**Default (auto mode)**:
- If terminal supports TTY: Show multi-bar progress display
- If CI/CD (non-TTY): Fall back to existing log-based progress

**Always mode**:
- Force progress display even in CI/CD (log-based fallback)

**Never mode**:
- Disable progress display entirely (existing log output only)

**Display Components**:
1. Overall progress bar (total subtasks completed / total subtasks)
2. Current task identifier and title (e.g., "P1.M1.T1.S1: Create model classes")
3. Estimated time remaining (ETA)
4. Recent log entries (last 3 lines)

### Success Criteria

- [ ] Multi-bar progress display renders in TTY environments
- [ ] Progress updates after each subtask completion
- [ ] ETA calculation is accurate (within 10% of actual time after 5+ samples)
- [ ] Current task information updates in real-time
- [ ] Graceful degradation in non-TTY environments
- [ ] `--progress-mode` CLI option accepts auto/always/never values
- [ ] All existing ProgressTracker functionality remains unchanged
- [ ] Tests cover 80%+ of new code paths

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: Would someone unfamiliar with this codebase have everything needed to implement this successfully?

✅ **YES** - This PRP includes:
- Exact file paths and line numbers for integration points
- Complete cli-progress library documentation with URLs
- Existing codebase patterns to follow (ProgressTracker, CLI options, tests)
- TypeScript types and interfaces for all new code
- Specific npm install commands
- Test patterns matching existing codebase conventions

---

### Documentation & References

```yaml
# EXTERNAL LIBRARIES
- url: https://www.npmjs.com/package/cli-progress
  why: Primary library for progress bar functionality - SingleBar, MultiBar classes
  critical: Multi-bar requires newline in log() calls: `multiBar.log('message\n')`

- url: https://github.com/npkgz/cli-progress#multi-bar-mode
  why: Multi-bar mode documentation for hierarchical progress display
  section: Multi Bar Mode section has examples of creating/updating multiple bars

- url: https://www.npmjs.com/package/@types/cli-progress
  why: TypeScript type definitions for cli-progress - install as dev dependency
  critical: Must install separately: `npm install @types/cli-progress --save-dev`

# CODEBASE PATTERNS - Existing ProgressTracker
- file: src/utils/progress.ts
  why: Existing progress tracking implementation to understand patterns and avoid duplication
  pattern: Factory function `progressTracker({ backlog, logInterval, barWidth })` returns ProgressTracker instance
  gotcha: ProgressTracker uses exponential smoothing for ETA - match this algorithm in ProgressDisplay

- file: src/utils/progress.ts
  why: ProgressReport interface shows the data structure for progress metrics
  section: Lines 47-62 define ProgressReport with completed, total, percentage, remaining, averageDuration, eta, elapsed

- file: tests/unit/utils/progress.test.ts
  why: Test patterns to follow for ProgressDisplay tests - fixture usage, mocking, fake timers
  pattern: `createTestBacklog()`, `createTestPhase()`, `createTestMilestone()`, `createTestTask()`, `createTestSubtask()` factories
  gotcha: Always call `clearLoggerCache()` in beforeEach/afterEach for test isolation

# INTEGRATION POINT - PRPPipeline
- file: src/workflows/prp-pipeline.ts
  why: Where ProgressDisplay will be integrated - executeBacklog() method
  section: Lines 733-912 contain executeBacklog() with existing ProgressTracker integration
  pattern: Lines 753-761 show ProgressTracker initialization - follow same pattern for ProgressDisplay
  gotcha: Line 231 declares `#progressTracker?: ProgressTracker` - add `#progressDisplay?: ProgressDisplay` alongside

- file: src/workflows/prp-pipeline.ts
  why: Current progress logging points to replace/augment with ProgressDisplay
  section: Lines 790-795 log progress every 5 tasks - this is where display updates should occur
  gotcha: PRPPipeline uses this.#progressTracker?.formatProgress() for string output

# TASK EXECUTION TRACKING
- file: src/core/task-orchestrator.ts
  why: TaskOrchestrator tracks currentItemId needed for "current task" display
  section: Line 92: `currentItemId: string | null = null` - read this for current task info
  gotcha: currentItemId is set in processNextItem() at line 818

# CLI OPTIONS PATTERN
- file: src/cli/index.ts
  why: Pattern for adding --progress-mode option with choices validation
  section: Lines 127-132 show addOption() pattern with choices array and default value
  pattern: `.addOption(program.createOption('--mode <mode>').choices(['normal', 'bug-hunt']).default('normal'))`

- file: src/cli/index.ts
  why: CLIArgs interface where progressMode field must be added
  section: Lines 52-88 define CLIArgs interface - add progressMode field
  pattern: All option fields are documented with JSDoc comments

# TEST PATTERNS
- file: tests/unit/utils/progress.test.ts
  why: Comprehensive test patterns for progress-related utilities
  pattern: Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()` for time-based tests
  pattern: Mock logger with `vi.spyOn(logger, 'info')` and verify call counts

- file: package.json
  why: Test and build commands to run after implementation
  section: Lines 32-36 define test scripts - `npm run test:run` executes vitest
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── cli/
│   │   └── index.ts                    # CLI argument parser (ADD --progress-mode HERE)
│   ├── core/
│   │   ├── models.ts                   # Backlog, Phase, Milestone, Task, Subtask types
│   │   └── task-orchestrator.ts        # currentItemId for task tracking
│   ├── utils/
│   │   ├── progress.ts                 # EXISTING ProgressTracker (keep unchanged)
│   │   ├── logger.ts                   # Pino logger for log entry display
│   │   └── progress-display.ts         # CREATE: ProgressDisplay class
│   └── workflows/
│       └── prp-pipeline.ts             # INTEGRATION: Add ProgressDisplay here
├── tests/
│   └── unit/
│       └── utils/
│           ├── progress.test.ts        # EXISTING: ProgressTracker tests
│           └── progress-display.test.ts # CREATE: ProgressDisplay tests
├── package.json                        # ADD cli-progress dependencies
└── plan/003_b3d3efdaf0ed/
    ├── P2M3T1S3/
    │   ├── PRP.md                      # THIS FILE
    │   └── research/
    │       └── ts-prompt-progress-references.md
    └── tasks.json
```

---

### Desired Codebase Tree (new files highlighted)

```bash
# NEW FILE TO CREATE
├── src/utils/progress-display.ts       # ProgressDisplay class with cli-progress

# MODIFIED FILES
├── src/cli/index.ts                    # ADD: progressMode field to CLIArgs, --progress-mode option
├── src/workflows/prp-pipeline.ts       # ADD: ProgressDisplay integration in executeBacklog()
├── package.json                        # ADD: cli-progress and @types/cli-progress dependencies
└── tests/unit/utils/progress-display.test.ts  # CREATE: Unit tests
```

---

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: cli-progress MultiBar.log() ALWAYS requires newline
// Gotcha: Forgetting '\n' will cause display corruption
multiBar.log('Processing file...\n');  // CORRECT
multiBar.log('Processing file...');    // WRONG - display breaks

// CRITICAL: Always stop bars in finally block
// Gotcha: If bar.stop() is not called, cursor remains hidden
try {
  bar.start(100, 0);
  // ... work ...
} finally {
  bar.stop();  // MUST be in finally for SIGINT safety
}

// CRITICAL: Use gracefulExit: true for production
// Gotcha: Without gracefulExit, SIGINT/SIGTERM leave terminal in broken state
const multiBar = new cliProgress.MultiBar({
  gracefulExit: true,  // Restores cursor on signals
  hideCursor: true,
});

// GOTCHA: TaskOrchestrator.currentItemId can be null
// Always check null before using for display
const currentTask = orchestrator.currentItemId;
if (currentTask) {
  display.updateCurrentTask(currentTask);
}

// GOTCHA: ProgressTracker uses exponential smoothing for ETA
// Match this algorithm in ProgressDisplay for consistency
// Formula: S_t = alpha * X_t + (1 - alpha) * S_{t-1}
// Default alpha: 0.3
// Min samples: 3

// GOTCHA: Non-TTY detection for 'auto' mode
// Use process.stdout.isTTY, not process.stdin.isTTY
if (process.stdout.isTTY) {
  // Show progress display
} else {
  // Fall back to log-based progress
}

// PATTERN: Test isolation with clearLoggerCache()
beforeEach(() => {
  clearLoggerCache();  // MUST call this for clean logger state
});

// PATTERN: Fake timers for time-based tests
vi.useFakeTimers();
try {
  // ... test code ...
  vi.advanceTimersByTime(100);  // Simulate 100ms passing
} finally {
  vi.useRealTimers();
}
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Progress display mode
 * - auto: Display in TTY environments only
 * - always: Force display (with log fallback in non-TTY)
 * - never: Disable display entirely
 */
export type ProgressMode = 'auto' | 'always' | 'never';

/**
 * Progress display configuration options
 */
export interface ProgressDisplayOptions {
  /** Progress display mode (auto/always/never) */
  readonly progressMode: ProgressMode;
  /** Update interval in milliseconds (default: 100) */
  readonly updateInterval?: number;
  /** Whether to show recent log entries (default: true) */
  readonly showLogs?: boolean;
  /** Number of recent log entries to show (default: 3) */
  readonly logCount?: number;
}

/**
 * Current task information for display
 */
export interface CurrentTaskInfo {
  /** Task ID (e.g., "P1.M1.T1.S1") */
  readonly id: string;
  /** Task title */
  readonly title: string;
  /** Task type */
  readonly type: 'Phase' | 'Milestone' | 'Task' | 'Subtask';
}
```

---

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: INSTALL cli-progress dependencies
  - RUN: npm install cli-progress
  - RUN: npm install @types/cli-progress --save-dev
  - VERIFY: Check package.json has cli-progress in dependencies
  - VERIFY: Check package.json has @types/cli-progress in devDependencies

Task 2: CREATE src/utils/progress-display.ts
  - IMPLEMENT: ProgressDisplay class with MultiBar integration
  - IMPLEMENT: SingleBar for overall progress, optional bars for hierarchy
  - IMPLEMENT: Current task display, ETA display, recent log display
  - FOLLOW pattern: src/utils/progress.ts (class structure, error handling)
  - NAMING: PascalCase class (ProgressDisplay), camelCase methods (start, update, stop)
  - TYPES: Import cliProgress with ES module syntax: `import cliProgress from 'cli-progress';`
  - PLACEMENT: src/utils/progress-display.ts (alongside progress.ts)

Task 3: MODIFY src/cli/index.ts
  - ADD: progressMode field to CLIArgs interface (lines 52-88)
  - ADD: --progress-mode option with .choices(['auto', 'always', 'never'])
  - FOLLOW pattern: Lines 127-132 for addOption() with choices
  - DEFAULT: 'auto' for progressMode
  - PRESERVE: All existing options and validation logic

Task 4: MODIFY src/workflows/prp-pipeline.ts
  - ADD: Import ProgressDisplay at top of file
  - ADD: #progressDisplay?: ProgressDisplay field (alongside line 231)
  - ADD: ProgressDisplay initialization in executeBacklog() (around line 753)
  - INTEGRATE: Update display after task completion (around lines 790-795)
  - ADD: Stop display in cleanup() method (around line 1246)
  - PRESERVE: All existing ProgressTracker functionality

Task 5: CREATE tests/unit/utils/progress-display.test.ts
  - IMPLEMENT: Unit tests for all ProgressDisplay methods
  - FOLLOW pattern: tests/unit/utils/progress.test.ts (structure, fixtures)
  - MOCK: cliProgress MultiBar using vi.mock()
  - NAMING: test_<method>_<scenario> function naming
  - COVERAGE: Constructor, start, update, stop, TTY detection, mode handling
  - PLACEMENT: tests/unit/utils/progress-display.test.ts

Task 6: INTEGRATION TEST - Verify PRPPipeline integration
  - RUN: npm run test:run -- tests/unit/utils/progress-display.test.ts
  - RUN: npm run test:run -- tests/workflows/prp-pipeline.test.ts
  - VERIFY: No regression in existing progress tracking
  - VERIFY: ProgressDisplay updates correctly during execution
```

---

### Implementation Patterns & Key Details

```typescript
/**
 * ProgressDisplay class implementation pattern
 * File: src/utils/progress-display.ts
 */

import cliProgress from 'cli-progress';
import { getLogger } from './logger.js';
import type { Backlog } from '../core/models.js';

export class ProgressDisplay {
  readonly #logger = getLogger('ProgressDisplay');
  readonly #mode: ProgressMode;
  #multiBar: cliProgress.MultiBar | null = null;
  #overallBar: cliProgress.SingleBar | null = null;
  #isActive: boolean = false;

  constructor(options: ProgressDisplayOptions) {
    this.#mode = options.progressMode;
    // TTY detection for 'auto' mode
    if (this.#mode === 'auto' && !process.stdout.isTTY) {
      this.#logger.debug('Non-TTY environment, progress display disabled');
      return;
    }
    if (this.#mode === 'never') {
      return;
    }

    // Initialize MultiBar with gracefulExit for signal safety
    this.#multiBar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      gracefulExit: true,  // CRITICAL: Restore cursor on SIGINT/SIGTERM
      format: ' {bar} | {percentage}% | {value}/{total} | ETA: {eta_formatted}',
      barsize: 40,
    });
  }

  /**
   * Start progress display with backlog totals
   */
  start(backlog: Backlog): void {
    if (!this.#multiBar) return;

    const totalSubtasks = this.#countTotalSubtasks(backlog);
    this.#overallBar = this.#multiBar.create(totalSubtasks, 0, {
      name: 'Overall Progress',
    });
    this.#isActive = true;
  }

  /**
   * Update display with current progress and task info
   */
  update(completed: number, total: number, currentTask?: CurrentTaskInfo): void {
    if (!this.#isActive || !this.#overallBar) return;

    this.#overallBar.update(completed, {
      name: currentTask ? `${currentTask.id}: ${currentTask.title}` : 'Overall Progress',
    });
  }

  /**
   * Stop progress display cleanly
   */
  stop(): void {
    if (!this.#isActive) return;

    try {
      this.#overallBar?.stop();
      this.#multiBar?.stop();
    } finally {
      this.#isActive = false;
      this.#overallBar = null;
      this.#multiBar = null;
    }
  }

  /**
   * Count total subtasks in backlog
   * PATTERN: Follow src/utils/progress.ts #countTotalSubtasks()
   */
  #countTotalSubtasks(backlog: Backlog): number {
    let count = 0;
    for (const phase of backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          count += task.subtasks.length;
        }
      }
    }
    return count;
  }
}
```

```typescript
/**
 * CLI option addition pattern
 * File: src/cli/index.ts
 */

// ADD to CLIArgs interface (around line 52-88)
export interface CLIArgs {
  // ... existing fields ...
  /** Progress display mode (auto/always/never) */
  progressMode?: 'auto' | 'always' | 'never';
}

// ADD in parseCLIArgs() function (around line 146)
export function parseCLIArgs(): CLIArgs {
  const program = new Command();
  program
    // ... existing options ...
    .addOption(
      program
        .createOption('--progress-mode <mode>', 'Progress display mode')
        .choices(['auto', 'always', 'never'])
        .default('auto') as any  // PATTERN: Cast to any for Commander.js type compatibility
    )
    .parse(process.argv);

  return program.opts<CLIArgs>();
}
```

```typescript
/**
 * PRPPipeline integration pattern
 * File: src/workflows/prp-pipeline.ts
 */

// ADD import at top of file
import { ProgressDisplay, type ProgressDisplayOptions } from '../utils/progress-display.js';

// ADD private field (around line 231)
export class PRPPipeline extends Workflow {
  // ... existing fields ...
  readonly #progressTracker?: ProgressTracker;
  readonly #progressDisplay?: ProgressDisplay;  // NEW
}

// ADD initialization in executeBacklog() (around line 753)
async executeBacklog(): Promise<void> {
  // ... existing code ...

  // Initialize ProgressDisplay
  const progressMode = this.#progressMode ?? 'auto';
  this.#progressDisplay = new ProgressDisplay({
    progressMode,
    updateInterval: 100,
    showLogs: true,
    logCount: 3,
  });

  if (this.#progressDisplay.isEnabled()) {
    this.#progressDisplay.start(backlog);
  }

  // ... existing loop ...

  // UPDATE display after task completion (around line 790-795)
  this.completedTasks = this.#countCompletedTasks();
  this.#progressDisplay?.update(
    this.completedTasks,
    this.totalTasks,
    {
      id: this.taskOrchestrator.currentItemId ?? 'unknown',
      title: 'Current Task',  // PATTERN: Get title from backlog if needed
      type: 'Subtask',
    }
  );
}

// ADD cleanup in cleanup() method (around line 1246)
async cleanup(): Promise<void> {
  try {
    // ... existing cleanup ...
    this.#progressDisplay?.stop();
  } finally {
    // ... existing finally block ...
  }
}
```

---

### Integration Points

```yaml
DEPENDENCIES:
  - add to: package.json
  - dependencies: "cli-progress": "^3.12.0"
  - devDependencies: "@types/cli-progress": "^3.12.0"

CLI_OPTIONS:
  - add to: src/cli/index.ts
  - field: progressMode?: 'auto' | 'always' | 'never' in CLIArgs interface
  - option: --progress-mode <mode> with .choices(['auto', 'always', 'never'])

PIPELINE_INTEGRATION:
  - add to: src/workflows/prp-pipeline.ts
  - import: import { ProgressDisplay } from '../utils/progress-display.js'
  - field: readonly #progressDisplay?: ProgressDisplay
  - initialize: In executeBacklog() around line 753
  - update: After task completion around lines 790-795
  - cleanup: In cleanup() method around line 1246

TESTS:
  - create: tests/unit/utils/progress-display.test.ts
  - pattern: Follow tests/unit/utils/progress.test.ts structure
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                    # ESLint check
npm run format                  # Prettier format
npm run typecheck               # TypeScript type checking

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test ProgressDisplay functionality
npm run test:run -- tests/unit/utils/progress-display.test.ts

# Test existing progress tracker (regression check)
npm run test:run -- tests/unit/utils/progress.test.ts

# Test PRPPipeline integration
npm run test:run -- tests/workflows/prp-pipeline.test.ts

# Coverage validation
npm run test:coverage -- tests/unit/utils/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the project
npm run build

# Test CLI option parsing
node dist/cli/index.js --help  # Verify --progress-mode appears in help

# Test TTY detection
node dist/index.js --prd PRD.md --progress-mode auto  # Should show progress in TTY

# Test never mode (no progress display)
node dist/index.js --prd PRD.md --progress-mode never  # Should suppress display

# Expected: All CLI options work correctly, progress display renders in TTY
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual TTY testing (requires terminal)
# Run with small PRD to see progress display in action
node dist/index.js --prd PRD.md --progress-mode always

# Verify display elements:
# - Overall progress bar updates
# - Current task information shows
# - ETA calculation is reasonable
# - Display stops cleanly on completion

# Test graceful shutdown (SIGINT)
# Press Ctrl+C during execution
# Verify: Display stops, cursor is restored, no terminal corruption

# Expected: Progress display renders cleanly, updates in real-time, stops gracefully
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`
- [ ] cli-progress dependency installed
- [ ] @types/cli-progress dependency installed

### Feature Validation

- [ ] --progress-mode option accepts auto/always/never values
- [ ] Progress display renders in TTY with 'auto' mode
- [ ] Progress display falls back to logs in non-TTY with 'auto' mode
- [ ] Progress display works with 'always' mode (with log fallback)
- [ ] 'never' mode suppresses all progress display
- [ ] Overall progress bar shows correct percentage
- [ ] Current task information updates in real-time
- [ ] ETA calculation is accurate (within 10% after 5+ samples)
- [ ] Graceful shutdown works (Ctrl+C stops display cleanly)

### Code Quality Validation

- [ ] Follows existing codebase patterns (ProgressTracker, CLI options)
- [ ] File placement matches desired codebase tree structure
- [ ] ProgressDisplay.stop() always called in finally block
- [ ] MultiBar.log() calls include newline character
- [ ] gracefulExit: true set in MultiBar options
- [ ] TTY detection uses process.stdout.isTTY
- [ ] No breaking changes to existing ProgressTracker

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] JSDoc comments on all public methods
- [ ] CLI option documented in --help output
- [ ] Research notes saved to plan/003_b3d3efdaf0ed/P2M3T1S3/research/

---

## Anti-Patterns to Avoid

- ❌ Don't modify existing ProgressTracker class - add new ProgressDisplay alongside it
- ❌ Don't use sync functions in async context - ProgressDisplay methods should be sync for display updates
- ❌ Don't forget newline in MultiBar.log() calls - `multiBar.log('message\n')`
- ❌ Don't skip gracefulExit: true in MultiBar options - required for SIGINT safety
- ❌ Don't call MultiBar methods without null check - multiBar can be null in 'never' mode
- ❌ Don't stop bars outside finally block - SIGINT can bypass normal cleanup
- ❌ Don't hardcode TTY detection - use process.stdout.isTTY not process.stdin.isTTY
- ❌ Don't ignore 'never' mode - must completely disable display when mode is 'never'
- ❌ Don't couple ProgressDisplay too tightly to PRPPipeline - keep it reusable
- ❌ Don't skip testing non-TTY environments - CI/CD will fail without proper fallback
