# Timing and Snapshot - Research & Best Practices

## Overview

Research findings on when to track timing, capture state snapshots, and implement time-travel debugging for TypeScript workflows.

---

## Key Resources & Documentation

### Performance Monitoring

- **Node.js Performance Hooks** - https://nodejs.org/api/perf_hooks.html
  - PerformanceObserver API
  - PerformanceEntry timing
  - Timeline measurements

- **Node.js Worker Threads** - https://nodejs.org/api/worker_threads.html
  - CPU-intensive operations
  - Parallel execution
  - Performance measurement

### Profiling Tools

- **Clinic.js** - https://clinicjs.org/
  - Performance profiling
  - Memory profiling
  - Heap analysis

- **0x** - https://github.com/davidmarkclements/0x
  - Flame graph profiling
  - CPU usage visualization
  - Bottleneck identification

- **Node.js Inspector** - https://nodejs.org/en/docs/guides/debugging-getting-started/
  - Chrome DevTools integration
  - Breakpoint debugging
  - Performance profiling

### Snapshot Libraries

- **Redux DevTools** - https://github.com/reduxjs/redux-devtools
  - State history tracking
  - Time-travel debugging
  - Action replay

- **MobX State Tree** - https://mobx-state-tree.js.org/
  - State snapshots
  - Action middleware
  - Time-travel debugging

---

## Best Practices for Timing and Snapshots

### 1. Performance Measurement

Track execution time at multiple levels:

```typescript
// Pattern: Hierarchical timing
interface TimingData {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  children: TimingData[];
  metadata?: Record<string, unknown>;
}

class PerformanceTracker {
  private stack: TimingData[] = [];
  private timings: TimingData[] = [];

  start(name: string, metadata?: Record<string, unknown>): void {
    const timing: TimingData = {
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      children: [],
      metadata,
    };

    if (this.stack.length > 0) {
      const parent = this.stack[this.stack.length - 1];
      parent.children.push(timing);
    } else {
      this.timings.push(timing);
    }

    this.stack.push(timing);
  }

  end(): void {
    const timing = this.stack.pop();
    if (!timing) {
      throw new Error('No timing to end');
    }

    timing.endTime = performance.now();
    timing.duration = timing.endTime - timing.startTime;
  }

  getTimings(): TimingData[] {
    return this.timings;
  }

  printTimings(): void {
    const print = (timing: TimingData, indent = 0) => {
      const prefix = '  '.repeat(indent);
      console.log(`${prefix}${timing.name}: ${timing.duration.toFixed(2)}ms`);

      for (const child of timing.children) {
        print(child, indent + 1);
      }
    };

    for (const timing of this.timings) {
      print(timing);
    }
  }
}

// Usage
const tracker = new PerformanceTracker();

async function executeWorkflow() {
  tracker.start('workflow');

  tracker.start('step1');
  await step1();
  tracker.end();

  tracker.start('step2');
  await step2();
  tracker.end();

  tracker.start('step3');
  await step3();
  tracker.end();

  tracker.end();

  tracker.printTimings();
}
```

**Benefits:**

- Hierarchical timing
- Parent-child relationships
- Detailed metadata
- Easy visualization

### 2. Milestone Tracking

Track key milestones during execution:

```typescript
// Pattern: Milestone tracking
interface Milestone {
  name: string;
  timestamp: Date;
  data?: unknown;
  metadata?: Record<string, unknown>;
}

class MilestoneTracker {
  private milestones: Milestone[] = [];
  private startTime?: Date;
  private endTime?: Date;

  start(): void {
    this.startTime = new Date();
    this.addMilestone('start');
  }

  addMilestone(
    name: string,
    data?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    const milestone: Milestone = {
      name,
      timestamp: new Date(),
      data,
      metadata,
    };

    this.milestones.push(milestone);
    console.log(`[Milestone] ${name} at ${milestone.timestamp.toISOString()}`);
  }

  complete(): void {
    this.endTime = new Date();
    this.addMilestone('complete');
  }

  getTimeline(): Milestone[] {
    return this.milestones.slice();
  }

  getDuration(): number | undefined {
    if (!this.startTime || !this.endTime) {
      return undefined;
    }
    return this.endTime.getTime() - this.startTime.getTime();
  }

  getMilestoneDurations(): Array<{ name: string; duration: number }> {
    const durations: Array<{ name: string; duration: number }> = [];

    for (let i = 0; i < this.milestones.length - 1; i++) {
      const current = this.milestones[i];
      const next = this.milestones[i + 1];

      durations.push({
        name: `${current.name} → ${next.name}`,
        duration: next.timestamp.getTime() - current.timestamp.getTime(),
      });
    }

    return durations;
  }
}

// Usage
const tracker = new MilestoneTracker();

tracker.start();
await step1();
tracker.addMilestone('step1-complete', { result: 'data' });
await step2();
tracker.addMilestone('step2-complete');
await step3();
tracker.complete();

console.log('Timeline:', tracker.getTimeline());
console.log('Total duration:', tracker.getDuration());
console.log('Milestone durations:', tracker.getMilestoneDurations());
```

**Advantages:**

- Key event tracking
- Duration calculations
- Timeline visualization
- Data attachment

### 3. State Snapshots

Capture state at key points:

```typescript
// Pattern: State snapshots
interface StateSnapshot<T> {
  id: string;
  timestamp: Date;
  state: T;
  metadata?: Record<string, unknown>;
}

class SnapshotManager<T> {
  private snapshots: StateSnapshot<T>[] = [];
  private maxSnapshots = 100;

  capture(state: T, metadata?: Record<string, unknown>): StateSnapshot<T> {
    const snapshot: StateSnapshot<T> = {
      id: this.generateId(),
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      metadata,
    };

    this.snapshots.push(snapshot);

    // Limit snapshot count
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getSnapshot(id: string): StateSnapshot<T> | undefined {
    return this.snapshots.find(s => s.id === id);
  }

  getLatestSnapshot(): StateSnapshot<T> | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }

  getAllSnapshots(): StateSnapshot<T>[] {
    return this.snapshots.slice();
  }

  restore(id: string): T | undefined {
    const snapshot = this.getSnapshot(id);
    if (!snapshot) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(snapshot.state));
  }

  private generateId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage
interface WorkflowState {
  step: number;
  status: string;
  data: unknown;
}

const snapshotManager = new SnapshotManager<WorkflowState>();

let currentState: WorkflowState = {
  step: 0,
  status: 'pending',
  data: null,
};

// Capture initial state
snapshotManager.capture(currentState, { name: 'initial' });

// Execute steps
currentState = await step1(currentState);
snapshotManager.capture(currentState, { name: 'after-step1' });

currentState = await step2(currentState);
snapshotManager.capture(currentState, { name: 'after-step2' });

// Restore to previous state if needed
const previousState = snapshotManager.restore('snapshot-123');
```

**Benefits:**

- State history
- Rollback capability
- Debugging support
- Time-travel debugging

### 4. Timing Statistics

Calculate and track timing statistics:

```typescript
// Pattern: Timing statistics
interface TimingStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  count: number;
  standardDeviation: number;
}

class TimingCollector {
  private timings: Map<string, number[]> = new Map();

  record(operation: string, duration: number): void {
    if (!this.timings.has(operation)) {
      this.timings.set(operation, []);
    }

    this.timings.get(operation)!.push(duration);
  }

  getStats(operation: string): TimingStats | undefined {
    const durations = this.timings.get(operation);
    if (!durations || durations.length === 0) {
      return undefined;
    }

    const sorted = [...durations].sort((a, b) => a - b);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: this.mean(sorted),
      median: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      count: sorted.length,
      standardDeviation: this.standardDeviation(sorted),
    };
  }

  getAllStats(): Record<string, TimingStats> {
    const stats: Record<string, TimingStats> = {};

    for (const [operation] of this.timings) {
      const operationStats = this.getStats(operation);
      if (operationStats) {
        stats[operation] = operationStats;
      }
    }

    return stats;
  }

  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private standardDeviation(values: number[]): number {
    const mean = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}

// Usage
const collector = new TimingCollector();

async function measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    collector.record(name, duration);
  }
}

// Collect metrics
await measure('database-query', () => db.query('SELECT * FROM users'));
await measure('api-request', () => fetch('/api/users'));
await measure('data-processing', () => processData(data));

// Get statistics
console.log('Stats:', collector.getAllStats());
```

**Advantages:**

- Statistical analysis
- Performance trending
- Outlier detection
- Capacity planning

### 5. Memory Snapshots

Track memory usage over time:

```typescript
// Pattern: Memory snapshotting
interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

class MemoryTracker {
  private snapshots: MemorySnapshot[] = [];
  private interval?: NodeJS.Timeout;

  start(intervalMs = 1000): void {
    this.snapshots = [];
    this.capture();

    this.interval = setInterval(() => {
      this.capture();
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  capture(): void {
    const usage = process.memoryUsage();

    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      arrayBuffers: usage.arrayBuffers,
    };

    this.snapshots.push(snapshot);
  }

  getSnapshots(): MemorySnapshot[] {
    return this.snapshots.slice();
  }

  getMemoryGrowth():
    | {
        heapUsedGrowth: number;
        heapTotalGrowth: number;
        rssGrowth: number;
      }
    | undefined {
    if (this.snapshots.length < 2) {
      return undefined;
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    return {
      heapUsedGrowth: last.heapUsed - first.heapUsed,
      heapTotalGrowth: last.heapTotal - first.heapTotal,
      rssGrowth: last.rss - first.rss,
    };
  }

  getAverageMemory(): {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  } {
    if (this.snapshots.length === 0) {
      return { heapUsed: 0, heapTotal: 0, rss: 0 };
    }

    const sum = this.snapshots.reduce(
      (acc, s) => ({
        heapUsed: acc.heapUsed + s.heapUsed,
        heapTotal: acc.heapTotal + s.heapTotal,
        rss: acc.rss + s.rss,
      }),
      { heapUsed: 0, heapTotal: 0, rss: 0 }
    );

    const count = this.snapshots.length;

    return {
      heapUsed: sum.heapUsed / count,
      heapTotal: sum.heapTotal / count,
      rss: sum.rss / count,
    };
  }
}

// Usage
const tracker = new MemoryTracker();

tracker.start(1000); // Capture every second

await executeWorkflow();

tracker.stop();

console.log('Memory growth:', tracker.getMemoryGrowth());
console.log('Average memory:', tracker.getAverageMemory());
```

**Benefits:**

- Memory leak detection
- Usage patterns
- Growth tracking
- Capacity planning

---

## Common Pitfalls to Avoid

### 1. Timing Too Frequently

```typescript
// BAD: Timing every operation
for (const item of items) {
  const start = Date.now();
  await process(item);
  const duration = Date.now() - start; // Too much overhead
}

// GOOD: Time aggregates
const start = Date.now();
for (const item of items) {
  await process(item);
}
const duration = Date.now() - start;
```

### 2. Not Accounting for Async

```typescript
// BAD: Doesn't measure async work
function measure<T>(fn: () => T): number {
  const start = Date.now();
  const result = fn();
  return Date.now() - start; // Doesn't wait for promises
}

// GOOD: Handle async
async function measure<T>(fn: () => Promise<T>): Promise<number> {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}
```

### 3. Expensive Snapshots

```typescript
// BAD: Deep cloning large objects
function snapshot(state: unknown) {
  return JSON.parse(JSON.stringify(state)); // Very slow for large objects
}

// GOOD: Selective cloning or structured clone
function snapshot(state: unknown) {
  return structuredClone(state); // Faster, handles more types
}
```

### 4. Missing Context

```typescript
// BAD: Timing without context
const start = Date.now();
await operation();
console.log(`Duration: ${Date.now() - start}ms`); // What operation?

// GOOD: Include context
const start = Date.now();
await operation();
console.log(`Operation "${operation.name}" took ${Date.now() - start}ms`);
```

### 5. Not Cleaning Up

```typescript
// BAD: Leaks memory
const tracker = new Tracker();
tracker.start(); // Never stops

// GOOD: Cleanup
const tracker = new Tracker();
tracker.start();
try {
  await work();
} finally {
  tracker.stop();
}
```

---

## Integration with Existing Code

Based on your `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`:

```typescript
export class InstrumentedTaskOrchestrator extends TaskOrchestrator {
  private performanceTracker = new PerformanceTracker();
  private milestoneTracker = new MilestoneTracker();
  private snapshotManager = new SnapshotManager<Backlog>();

  constructor(sessionManager: SessionManager, scope?: Scope) {
    super(sessionManager, scope);
    this.milestoneTracker.start();
  }

  async processNextItem(): Promise<boolean> {
    this.performanceTracker.start('processNextItem');

    try {
      const result = await super.processNextItem();

      if (result) {
        // Capture snapshot after each item
        this.snapshotManager.capture(this.backlog, {
          event: 'item-processed',
          timestamp: new Date(),
        });
      }

      return result;
    } finally {
      this.performanceTracker.end();
    }
  }

  async setStatus(
    itemId: string,
    status: Status,
    reason?: string
  ): Promise<void> {
    this.performanceTracker.start('setStatus', { itemId, status });

    try {
      await super.setStatus(itemId, status, reason);

      // Track status change as milestone
      this.milestoneTracker.addMilestone('status-change', {
        itemId,
        status,
        reason,
      });
    } finally {
      this.performanceTracker.end();
    }
  }

  getPerformanceReport(): unknown {
    return {
      timings: this.performanceTracker.getTimings(),
      milestones: this.milestoneTracker.getTimeline(),
      milestoneDurations: this.milestoneTracker.getMilestoneDurations(),
      totalDuration: this.milestoneTracker.getDuration(),
      snapshots: this.snapshotManager.getAllSnapshots(),
    };
  }

  printPerformanceReport(): void {
    console.log('=== Performance Report ===');
    console.log('\nTimings:');
    this.performanceTracker.printTimings();

    console.log('\nMilestones:');
    for (const milestone of this.milestoneTracker.getTimeline()) {
      console.log(`  ${milestone.name}: ${milestone.timestamp.toISOString()}`);
    }

    console.log('\nTotal Duration:', this.milestoneTracker.getDuration(), 'ms');
  }
}
```

---

## Recommended Next Steps

1. **Add Timing to Key Operations**
   - Track execution time
   - Calculate statistics
   - Identify bottlenecks

2. **Add Milestone Tracking**
   - Define key milestones
   - Track milestone timing
   - Generate timeline

3. **Add State Snapshots**
   - Capture state at key points
   - Enable rollback
   - Support time-travel debugging

4. **Add Memory Tracking**
   - Monitor memory usage
   - Detect memory leaks
   - Track growth patterns

5. **Add Performance Dashboard**
   - Visualize metrics
   - Show trends over time
   - Alert on anomalies

---

## Additional Resources

- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [Clinic.js Documentation](https://clinicjs.org/)
- [0x Profiler](https://github.com/davidmarkclements/0x)
- [Node.js Inspector](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [V8 Profiling](https://v8.dev/docs/profile)
