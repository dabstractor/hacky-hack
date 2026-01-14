# External Progress Integration Patterns - Research Report

**Research Date**: 2025-01-13
**Task**: P5.M1.T2.S2 - Integrate ProgressTracker with TaskOrchestrator
**Focus**: CLI progress reporting best practices and integration patterns

---

## Executive Summary

This research document compiles best practices for progress tracking and reporting in CLI applications, specifically for long-running pipeline workflows. The findings are organized to guide the integration of a ProgressTracker into the existing TaskOrchestrator architecture.

**Key Findings:**

- Update progress every N tasks (typically 5-10% of total work)
- Use throttled updates to avoid overwhelming the terminal (100ms-1s intervals)
- Implement graceful shutdown with progress cleanup
- Calculate ETA using moving averages or exponential smoothing
- Support TTY detection for graceful degradation

---

## Table of Contents

1. [Progress Reporting Best Practices](#1-progress-reporting-best-practices)
2. [Integration Patterns for Task Execution Loops](#2-integration-patterns-for-task-execution-loops)
3. [ETA Calculation and Display](#3-eta-calculation-and-display)
4. [Shutdown Handling with Progress](#4-shutdown-handling-with-progress)
5. [Popular Libraries and Implementations](#5-popular-libraries-and-implementations)
6. [Recommended Patterns for TaskOrchestrator](#6-recommended-patterns-for-taskorchestrator)

---

## 1. Progress Reporting Best Practices

### 1.1 Update Frequency

**Consensus across CLI tools:**

| Scenario                        | Recommended Interval        | Rationale                    |
| ------------------------------- | --------------------------- | ---------------------------- |
| Fast operations (< 1s per item) | Every N items (10-100)      | Prevents terminal flicker    |
| Medium operations (1-10s)       | Every 1-2 items             | Keeps feedback responsive    |
| Slow operations (> 10s)         | Every item (100% reporting) | Maximum visibility           |
| High-frequency updates          | Throttled to 100ms-1s       | Avoids overwhelming terminal |

**Industry Examples:**

- **npm**: Updates progress bar approximately every 100-500ms
- **webpack**: Updates every 5-10% of progress
- **docker build**: Updates every layer completion
- **cargo**: Updates every 5-10 packages

### 1.2 N-Task Interval Recommendations

Based on typical backlog sizes in the PRP Pipeline:

```typescript
// Adaptive update interval based on total tasks
function calculateUpdateInterval(totalTasks: number): number {
  if (totalTasks < 10) return 1; // Report every task
  if (totalTasks < 50) return 5; // Report every 5 tasks
  if (totalTasks < 100) return 10; // Report every 10 tasks
  return Math.floor(totalTasks * 0.1); // Report every 10%
}
```

**Recommended defaults for TaskOrchestrator:**

- Small sessions (< 10 subtasks): Update every task (interval = 1)
- Medium sessions (10-50 subtasks): Update every 5 tasks
- Large sessions (50-100 subtasks): Update every 10 tasks
- Very large sessions (> 100 subtasks): Update every 10% or every 20 tasks

### 1.3 Progress Display Best Practices

**Do's:**

- ✅ Detect TTY availability (`process.stdout.isTTY`)
- ✅ Provide fallback to simple logging when not a TTY
- ✅ Use carriage return (`\r`) for in-place updates
- ✅ Clear progress bars on completion/error
- ✅ Show current operation, not just percentage
- ✅ Include timestamps for long-running operations

**Don'ts:**

- ❌ Update more frequently than 100ms (causes flicker)
- ❌ Print excessive debug during progress display
- ❌ Leave progress bars visible after completion
- ❌ Assume 80-column terminal width
- ❌ Mix progress bars with verbose logging

---

## 2. Integration Patterns for Task Execution Loops

### 2.1 Common Integration Approaches

#### Pattern A: Callback-Based Integration

```typescript
// TaskOrchestrator accepts optional progress callback
class TaskOrchestrator {
  async processNextItem(
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<boolean> {
    const nextItem = this.#executionQueue.shift()!;
    const total = this.#executionQueue.length + 1;

    // Execute item
    await this.#delegateByType(nextItem);

    // Report progress
    onProgress?.({
      current: this.#completedCount,
      total: total,
      itemId: nextItem.id,
      status: nextItem.status,
    });

    return true;
  }
}
```

**Pros:**

- Clean separation of concerns
- Easy to test (mock callback)
- Optional integration (nullable callback)

**Cons:**

- Callback hell if multiple progress points
- Manual update tracking required

#### Pattern B: Event Emitter Integration

```typescript
import EventEmitter from 'events';

class TaskOrchestrator extends EventEmitter {
  async processNextItem(): Promise<boolean> {
    const nextItem = this.#executionQueue.shift()!;

    // Emit before execution
    this.emit('task:start', { itemId: nextItem.id });

    await this.#delegateByType(nextItem);

    // Emit after execution
    this.emit('task:complete', {
      itemId: nextItem.id,
      status: nextItem.status,
      progress: this.getProgress(),
    });

    return true;
  }
}

// Usage
orchestrator.on('task:complete', update => {
  progressTracker.update(update);
});
```

**Pros:**

- Decoupled architecture
- Multiple listeners possible
- Standard Node.js pattern

**Cons:**

- More boilerplate
- Event overhead for single listener

#### Pattern C: Direct Progress Tracker Injection

```typescript
class TaskOrchestrator {
  readonly #progressTracker?: ProgressTracker;

  constructor(
    sessionManager: SessionManager,
    progressTracker?: ProgressTracker
  ) {
    this.#progressTracker = progressTracker;
  }

  async processNextItem(): Promise<boolean> {
    const nextItem = this.#executionQueue.shift()!;

    // Update progress before execution
    this.#progressTracker?.updateStart(nextItem.id);

    await this.#delegateByType(nextItem);

    // Update progress after execution
    this.#progressTracker?.updateComplete(nextItem.id);

    return true;
  }
}
```

**Pros:**

- Direct integration, minimal overhead
- Type-safe with ProgressTracker interface
- Easy to make optional

**Cons:**

- Tighter coupling
- ProgressTracker must handle all complexity

### 2.2 Recommended Pattern for TaskOrchestrator

**Hybrid approach: Optional ProgressTracker injection with N-task throttling**

```typescript
class TaskOrchestrator {
  readonly #progressTracker?: ProgressTracker;
  readonly #updateInterval: number;
  #processedCount: number = 0;
  #lastUpdateCount: number = 0;

  constructor(
    sessionManager: SessionManager,
    options?: {
      progressTracker?: ProgressTracker;
      updateInterval?: number; // N tasks between updates
    }
  ) {
    this.#progressTracker = options?.progressTracker;
    this.#updateInterval = options?.updateInterval ?? 5;
  }

  async processNextItem(): Promise<boolean> {
    const nextItem = this.#executionQueue.shift()!;

    // Track start
    this.#progressTracker?.trackStart(nextItem.id);

    try {
      await this.#delegateByType(nextItem);

      // Track completion
      this.#progressTracker?.trackComplete(nextItem.id);

      this.#processedCount++;

      // Throttled progress update
      if (this.#shouldUpdateProgress()) {
        await this.#reportProgress();
        this.#lastUpdateCount = this.#processedCount;
      }

      return true;
    } catch (error) {
      this.#progressTracker?.trackError(nextItem.id, error);
      throw error;
    }
  }

  #shouldUpdateProgress(): boolean {
    // Always update last task
    if (this.#executionQueue.length === 0) return true;

    // Update every N tasks
    return this.#processedCount - this.#lastUpdateCount >= this.#updateInterval;
  }

  async #reportProgress(): Promise<void> {
    const progress = {
      completed: this.#processedCount,
      total: this.#processedCount + this.#executionQueue.length,
      percent: this.calculatePercent(),
      currentItemId: this.#backlog.currentItemId,
    };

    await this.#progressTracker?.update(progress);
  }
}
```

### 2.3 Integration Points in Existing TaskOrchestrator

**Current execution flow:**

```typescript
// Line 783-808 in task-orchestrator.ts
async processNextItem(): Promise<boolean> {
  if (this.#executionQueue.length === 0) {
    this.#logger.info('Execution queue empty - processing complete');
    return false;
  }

  const nextItem = this.#executionQueue.shift()!;
  this.#logger.info({ itemId: nextItem.id, type: nextItem.type }, 'Processing');

  await this.#delegateByType(nextItem);
  await this.#refreshBacklog();

  return true;
}
```

**Recommended injection points:**

1. **Before execution** (Line 795):

   ```typescript
   this.#progressTracker?.trackStart(nextItem.id);
   ```

2. **After execution** (Line 801):

   ```typescript
   this.#progressTracker?.trackComplete(nextItem.id);
   this.#processedCount++;
   if (this.#shouldUpdateProgress()) {
     await this.#progressTracker?.update(this.#getProgress());
   }
   ```

3. **Error handling** (in executeSubtask, Line 706):

   ```typescript
   this.#progressTracker?.trackError(subtask.id, error);
   ```

4. **Final completion** (Line 786):
   ```typescript
   await this.#progressTracker?.complete();
   ```

---

## 3. ETA Calculation and Display

### 3.1 ETA Calculation Algorithms

#### Algorithm 1: Simple Moving Average

```typescript
class ETACalculator {
  #samples: number[] = [];
  readonly #maxSamples = 10;

  record(duration: number): void {
    this.#samples.push(duration);
    if (this.#samples.length > this.#maxSamples) {
      this.#samples.shift();
    }
  }

  calculate(remainingItems: number): number | null {
    if (this.#samples.length === 0) return null;

    const avgDuration =
      this.#samples.reduce((a, b) => a + b, 0) / this.#samples.length;
    return avgDuration * remainingItems;
  }
}
```

**Pros:**

- Simple to implement
- Smooths out outliers
- Reasonable accuracy

**Cons:**

- Equal weight to all samples
- Lags behind performance changes

#### Algorithm 2: Exponential Moving Average (EMA)

```typescript
class ETACalculator {
  #ema: number | null = null;
  readonly #alpha = 0.3; // Smoothing factor (0-1)

  record(duration: number): void {
    if (this.#ema === null) {
      this.#ema = duration;
    } else {
      this.#ema = this.#alpha * duration + (1 - this.#alpha) * this.#ema;
    }
  }

  calculate(remainingItems: number): number | null {
    if (this.#ema === null) return null;
    return this.#ema * remainingItems;
  }
}
```

**Pros:**

- Adapts quickly to performance changes
- Recent samples weighted more heavily
- Minimal memory footprint

**Cons:**

- More sensitive to outliers
- Requires tuning alpha parameter

#### Algorithm 3: Progressive Accuracy (Hybrid)

```typescript
class ETACalculator {
  #samples: number[] = [];
  #totalCompleted = 0;
  #totalTime = 0;

  record(duration: number): void {
    this.#samples.push(duration);
    this.#totalCompleted++;
    this.#totalTime += duration;
  }

  calculate(remainingItems: number): number | null {
    if (this.#totalCompleted < 3) return null; // Need minimum samples

    // Use overall average for stability
    const overallAvg = this.#totalTime / this.#totalCompleted;

    // Use recent average for responsiveness
    const recentSamples = this.#samples.slice(-5);
    const recentAvg =
      recentSamples.reduce((a, b) => a + b, 0) / recentSamples.length;

    // Blend: 70% overall, 30% recent
    const blendedAvg = 0.7 * overallAvg + 0.3 * recentAvg;

    return blendedAvg * remainingItems;
  }
}
```

**Pros:**

- Balances stability and responsiveness
- Minimum sample threshold for accuracy
- Best of both approaches

**Cons:**

- More complex
- Requires tuning blend ratio

### 3.2 ETA Display Formatting

**Human-readable formats:**

```typescript
function formatETA(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Examples:
// 3600000 -> "1h 0m"
// 120000 -> "2m 0s"
// 45000 -> "45s"
```

**Progress bar with ETA:**

```
[========================================] 85% (42/49) ETA: 1m 23s
```

**Conditional ETA display:**

- Don't show ETA for first 3 items (insufficient data)
- Don't show ETA if less than 1 second remaining
- Show "Calculating..." during warmup period

### 3.3 Recommended ETA Implementation for ProgressTracker

```typescript
class ProgressTracker {
  #etaCalculator: ETACalculator;
  #startTime: number;

  constructor(total: number) {
    this.#etaCalculator = new ETACalculator();
    this.#startTime = Date.now();
  }

  updateComplete(itemId: string): void {
    const duration = Date.now() - this.#startTime;
    this.#etaCalculator.record(duration);
  }

  getETA(remainingItems: number): string | null {
    const eta = this.#etaCalculator.calculate(remainingItems);
    if (eta === null) return null;
    return formatETA(eta);
  }
}
```

---

## 4. Shutdown Handling with Progress

### 4.1 Graceful Shutdown Pattern

**Standard Node.js signal handling:**

```typescript
class ProgressTracker {
  #isShuttingDown = false;

  constructor() {
    this.#setupSignalHandlers();
  }

  #setupSignalHandlers(): void {
    // SIGINT (Ctrl+C)
    process.on('SIGINT', () => this.#handleShutdown('SIGINT'));

    // SIGTERM (kill command)
    process.on('SIGTERM', () => this.#handleShutdown('SIGTERM'));
  }

  async #handleShutdown(signal: string): Promise<void> {
    if (this.#isShuttingDown) {
      // Force exit if already shutting down
      process.exit(1);
    }

    this.#isShuttingDown = true;

    // Clear progress bar
    this.clear();

    // Display shutdown message
    console.error(`\n${signal} received. Shutting down gracefully...`);

    // Save progress state
    await this.save();

    // Exit with code
    process.exit(130); // Standard exit code for SIGINT
  }
}
```

### 4.2 Progress State Persistence

**Save progress for resumption:**

```typescript
interface ProgressState {
  completed: string[];
  failed: string[];
  current: string | null;
  timestamp: string;
}

class ProgressTracker {
  async save(): Promise<void> {
    const state: ProgressState = {
      completed: this.#completed,
      failed: this.#failed,
      current: this.#current,
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile('.progress-state.json', JSON.stringify(state, null, 2));
  }

  async load(): Promise<ProgressState | null> {
    try {
      const content = await fs.readFile('.progress-state.json', 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  clear(): void {
    // Remove progress bar from terminal
    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
  }
}
```

### 4.3 Shutdown Integration with TaskOrchestrator

```typescript
class TaskOrchestrator {
  async shutdown(): Promise<void> {
    this.#logger.info('Initiating graceful shutdown...');

    // Stop accepting new work
    this.#executionQueue = [];

    // Wait for current task to complete
    if (this.#currentTask) {
      this.#logger.info('Waiting for current task to complete...');
      await this.#currentTask;
    }

    // Update progress one final time
    await this.#progressTracker?.update(this.#getProgress());

    // Save state
    await this.#progressTracker?.save();

    this.#logger.info('Shutdown complete');
  }
}
```

### 4.4 Shutdown Best Practices

**Do's:**

- ✅ Clear progress bars before shutdown messages
- ✅ Save progress state for resumption
- ✅ Wait for current task to complete (with timeout)
- ✅ Log shutdown reason (SIGINT/SIGTERM)
- ✅ Use appropriate exit codes (130 for SIGINT, 143 for SIGTERM)
- ✅ Set shutdown flag to prevent double-shutdown

**Don'ts:**

- ❌ Leave progress bar visible during shutdown
- ❌ Force immediate exit without cleanup
- ❌ Ignore shutdown signals
- ❌ Allow new tasks during shutdown
- ❌ Lose track of current work item

---

## 5. Popular Libraries and Implementations

### 5.1 cli-progress

**Repository**: https://github.com/npkgz/cli-progress
**NPM**: https://www.npmjs.com/package/cli-progress

**Features:**

- Single and multi-bar support
- Customizable templates
- Preset styles
- ETA calculation built-in
- TypeScript support

**Basic usage:**

```typescript
import { SingleBar } from 'cli-progress';

const bar = new SingleBar(
  {
    format: '[{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total}',
  },
  SingleBar.Presets.shades_classic
);

bar.start(100, 0);
bar.increment();
bar.update(50);
bar.stop();
```

**Integration example:**

```typescript
class ProgressTracker {
  #bar: SingleBar | null = null;

  start(total: number): void {
    if (process.stdout.isTTY) {
      this.#bar = new SingleBar({}, SingleBar.Presets.shades_classic);
      this.#bar.start(total, 0);
    }
  }

  update(current: number, total: number): void {
    this.#bar?.update(current);
  }

  stop(): void {
    this.#bar?.stop();
    this.#bar = null;
  }
}
```

### 5.2 ora

**Repository**: https://github.com/sindresorhus/ora
**NPM**: https://www.npmjs.com/package/ora

**Features:**

- Elegant terminal spinners
- Simple API
- Promise handling
- Color support
- TypeScript support

**Basic usage:**

```typescript
import ora from 'ora';

const spinner = ora('Loading...').start();

// Update text
spinner.text = 'Processing item 42...';

// Success
spinner.succeed('Completed!');

// Failure
spinner.fail('Failed!');
```

**Integration example:**

```typescript
class ProgressTracker {
  #spinner: Ora | null = null;

  start(itemId: string): void {
    if (process.stdout.isTTY) {
      this.#spinner = ora(`Processing ${itemId}...`).start();
    }
  }

  succeed(): void {
    this.#spinner?.succeed();
    this.#spinner = null;
  }

  fail(message: string): void {
    this.#spinner?.fail(message);
    this.#spinner = null;
  }
}
```

### 5.3 listr

**Repository**: https://github.com/listr2/listr2
**NPM**: https://www.npmjs.com/package/listr2

**Features:**

- Task list with subtasks
- Progress bars for each task
- Concurrent task execution
- Error handling
- TypeScript support

**Basic usage:**

```typescript
import { Listr } from 'listr';

const tasks = new Listr([
  {
    title: 'Install dependencies',
    task: () => exec('npm install'),
  },
  {
    title: 'Run tests',
    task: () => exec('npm test'),
  },
]);

await tasks.run();
```

### 5.4 Recommendations

**For TaskOrchestrator integration:**

- Use **cli-progress** for overall progress (Phase/Milestone/Task level)
- Use **ora** for individual subtask execution status
- Use **custom implementation** for maximum control and minimal dependencies

**Why custom over library?**

- Full control over update frequency
- Direct integration with TaskOrchestrator
- No additional dependencies
- Tailored to PRP Pipeline needs
- Easy to test and maintain

---

## 6. Recommended Patterns for TaskOrchestrator

### 6.1 ProgressTracker Interface

```typescript
interface ProgressTracker {
  // Lifecycle
  start(total: number): void;
  complete(): void;
  error(message: string): void;

  // Task tracking
  trackStart(itemId: string): void;
  trackComplete(itemId: string): void;
  trackError(itemId: string, error: Error): void;

  // Progress updates
  update(progress: ProgressUpdate): void;

  // State
  save(): Promise<void>;
  load(): Promise<void>;
  clear(): void;
}

interface ProgressUpdate {
  completed: number;
  total: number;
  percent: number;
  currentItemId: string | null;
  eta?: string;
}
```

### 6.2 Integration with Existing TaskOrchestrator

**Constructor modification:**

```typescript
// Existing constructor (Line 100-123)
constructor(sessionManager: SessionManager, scope?: Scope) {
  this.#logger = getLogger('TaskOrchestrator');
  this.sessionManager = sessionManager;
  // ... existing code ...
}

// Modified constructor with progress tracking
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  options?: {
    progressTracker?: ProgressTracker;
    updateInterval?: number;
  }
) {
  this.#logger = getLogger('TaskOrchestrator');
  this.sessionManager = sessionManager;
  this.#progressTracker = options?.progressTracker;
  this.#updateInterval = options?.updateInterval ?? 5;
  // ... existing code ...
}
```

**processNextItem integration:**

```typescript
// Line 783-808: Modified processNextItem
async processNextItem(): Promise<boolean> {
  if (this.#executionQueue.length === 0) {
    this.#logger.info('Execution queue empty - processing complete');
    await this.#progressTracker?.complete();
    return false;
  }

  const nextItem = this.#executionQueue.shift()!;

  // NEW: Track task start
  this.#progressTracker?.trackStart(nextItem.id);

  this.#logger.info(
    { itemId: nextItem.id, type: nextItem.type },
    'Processing'
  );

  try {
    await this.#delegateByType(nextItem);
    await this.#refreshBacklog();

    // NEW: Track task completion
    this.#progressTracker?.trackComplete(nextItem.id);
    this.#processedCount++;

    // NEW: Throttled progress update
    if (this.#shouldUpdateProgress()) {
      const progress = {
        completed: this.#processedCount,
        total: this.#processedCount + this.#executionQueue.length,
        percent: this.calculatePercent(),
        currentItemId: nextItem.id,
      };
      this.#progressTracker?.update(progress);
      this.#lastUpdateCount = this.#processedCount;
    }

    return true;
  } catch (error) {
    // NEW: Track error
    this.#progressTracker?.trackError(nextItem.id, error as Error);
    throw error;
  }
}
```

### 6.3 CLI Entry Point Integration

**Modified main.ts:**

```typescript
import { ProgressTracker } from './progress/index.js';

async function main() {
  const sessionManager = new SessionManager();
  await sessionManager.initialize();

  // Create progress tracker if TTY
  const progressTracker = process.stdout.isTTY
    ? new ProgressTracker()
    : undefined;

  const orchestrator = new TaskOrchestrator(sessionManager, undefined, {
    progressTracker,
    updateInterval: 5,
  });

  // Setup shutdown handler
  if (progressTracker) {
    process.on('SIGINT', async () => {
      progressTracker.clear();
      console.error('\nShutting down...');
      await progressTracker.save();
      process.exit(130);
    });
  }

  // Start progress tracking
  const totalItems = orchestrator.executionQueue.length;
  progressTracker?.start(totalItems);

  // Process items
  let hasMore = true;
  while (hasMore) {
    hasMore = await orchestrator.processNextItem();
  }

  // Complete progress tracking
  await progressTracker?.complete();
}
```

### 6.4 Testing Progress Integration

**Test double for ProgressTracker:**

```typescript
class MockProgressTracker implements ProgressTracker {
  updates: ProgressUpdate[] = [];
  starts: string[] = [];
  completions: string[] = [];
  errors: Array<{ itemId: string; error: Error }> = [];

  start(total: number): void {
    this.started = true;
  }
  complete(): void {
    this.completed = true;
  }
  error(message: string): void {
    this.errorMessage = message;
  }

  trackStart(itemId: string): void {
    this.starts.push(itemId);
  }
  trackComplete(itemId: string): void {
    this.completions.push(itemId);
  }
  trackError(itemId: string, error: Error): void {
    this.errors.push({ itemId, error });
  }

  update(progress: ProgressUpdate): void {
    this.updates.push(progress);
  }

  async save(): Promise<void> {
    this.saved = true;
  }
  async load(): Promise<void> {
    this.loaded = true;
  }
  clear(): void {
    this.cleared = true;
  }
}
```

**Test example:**

```typescript
describe('TaskOrchestrator with ProgressTracker', () => {
  it('should track task start and completion', async () => {
    const mockProgress = new MockProgressTracker();
    const orchestrator = new TaskOrchestrator(sessionManager, undefined, {
      progressTracker: mockProgress,
    });

    await orchestrator.processNextItem();

    expect(mockProgress.starts).toHaveLength(1);
    expect(mockProgress.completions).toHaveLength(1);
    expect(mockProgress.updates).toHaveLength(1);
  });

  it('should update progress every N tasks', async () => {
    const mockProgress = new MockProgressTracker();
    const orchestrator = new TaskOrchestrator(sessionManager, undefined, {
      progressTracker: mockProgress,
      updateInterval: 5,
    });

    // Process 10 tasks
    for (let i = 0; i < 10; i++) {
      await orchestrator.processNextItem();
    }

    // Should have 2 updates (at 5 and 10)
    expect(mockProgress.updates).toHaveLength(2);
  });
});
```

---

## 7. Summary and Recommendations

### 7.1 Key Takeaways

1. **Update Frequency**: Use adaptive intervals based on workload size
   - Small sessions (< 10 tasks): Every task
   - Medium sessions (10-50): Every 5 tasks
   - Large sessions (> 50): Every 10 tasks or 10%

2. **Integration Pattern**: Optional ProgressTracker injection
   - Clean separation of concerns
   - Easy to test with mocks
   - Graceful degradation when not provided

3. **ETA Calculation**: Use exponential moving average
   - Adapts quickly to performance changes
   - Minimal memory footprint
   - Show after minimum 3 samples

4. **Shutdown Handling**: Graceful cleanup
   - Clear progress bars
   - Save state for resumption
   - Wait for current task completion
   - Use appropriate exit codes

5. **Library vs Custom**: Custom implementation recommended
   - Full control over behavior
   - No additional dependencies
   - Tailored to PRP Pipeline needs

### 7.2 Implementation Priority

**Phase 1 (Core functionality):**

1. Create ProgressTracker interface
2. Implement basic progress tracking
3. Integrate with TaskOrchestrator.processNextItem
4. Add unit tests

**Phase 2 (Enhanced features):**

1. Add ETA calculation with EMA
2. Implement TTY detection and fallback
3. Add shutdown signal handling
4. Add progress state persistence

**Phase 3 (Polish):**

1. Add progress bar display (cli-progress or custom)
2. Add spinner for subtask execution (ora or custom)
3. Enhance error tracking and display
4. Add integration tests

### 7.3 Code Locations

**Files to modify:**

- `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` - Add progress tracking integration
- `/home/dustin/projects/hacky-hack/src/cli/index.ts` - Create ProgressTracker instance
- `/home/dustin/projects/hacky-hack/src/utils/logger.ts` - May need progress-aware logging
- `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts` - Add progress tests

**Files to create:**

- `/home/dustin/projects/hacky-hack/src/progress/index.ts` - ProgressTracker interface
- `/home/dustin/projects/hacky-hack/src/progress/ProgressTracker.ts` - Implementation
- `/home/dustin/projects/hacky-hack/src/progress/ETACalculator.ts` - ETA calculation
- `/home/dustin/projects/hacky-hack/tests/unit/progress/ProgressTracker.test.ts` - Tests

### 7.4 Success Criteria

**Minimum viable functionality:**

- ✅ ProgressTracker interface defined
- ✅ TaskOrchestrator accepts optional ProgressTracker
- ✅ Progress updates every N tasks
- ✅ Unit tests for integration
- ✅ Graceful handling of missing ProgressTracker

**Full functionality:**

- ✅ ETA calculation and display
- ✅ TTY detection and fallback
- ✅ Graceful shutdown with progress cleanup
- ✅ Progress state persistence
- ✅ Integration tests
- ✅ Error tracking and reporting
- ✅ Visual progress bar/spinner display

---

## Appendix: References

**Note**: Web search services were rate-limited during research. This report is based on:

- Established CLI best practices from npm, cargo, webpack, docker
- Common patterns in Node.js ecosystem
- Analysis of existing TaskOrchestrator architecture
- Industry-standard progress tracking algorithms

**Recommended further reading:**

1. cli-progress documentation: https://www.npmjs.com/package/cli-progress
2. ora documentation: https://www.npmjs.com/package/ora
3. Node.js process signals: https://nodejs.org/api/process.html#process_signal_events
4. Terminal output best practices: https://nodejs.org/api/tty.html

---

**Document Version**: 1.0
**Last Updated**: 2025-01-13
**Author**: Research Agent
**Status**: Ready for implementation
