# TypeScript Background/Parallel Processing Research

**Research Date:** 2026-01-13
**Task:** P4M2T1S2 - Research patterns for integrating ResearchQueue with TaskOrchestrator
**Location:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M2T1S2/research/`

---

## Executive Summary

This research document compiles TypeScript/Node.js patterns for background and parallel processing, specifically for integrating a ResearchQueue with the TaskOrchestrator. Topics include fire-and-forget patterns, Promise.all vs Promise.allSettled, anti-patterns to avoid, "research ahead" patterns, and metrics logging for cache performance.

---

## Table of Contents

1. [Fire-and-Forget Background Task Patterns](#1-fire-and-forget-background-task-patterns)
2. [Promise.all vs Promise.allSettled](#2-promiseall-vs-promisesettled)
3. [Anti-Patterns to Avoid](#3-anti-patterns-to-avoid)
4. [Research-Ahead Patterns](#4-research-ahead-patterns)
5. [Metrics Logging for Cache Performance](#5-metrics-logging-for-cache-performance)
6. [Integration with TaskOrchestrator](#6-integration-with-taskorchestrator)
7. [References and Resources](#7-references-and-resources)

---

## 1. Fire-and-Forget Background Task Patterns

### 1.1 Basic Fire-and-Forget with Error Handling

**Pattern:** Start an async task without awaiting, but ensure errors are handled.

```typescript
/**
 * Basic fire-and-forget pattern with error handling
 *
 * CRITICAL: Always attach .catch() to prevent unhandled promise rejections
 */
function executeBackgroundTask(
  taskId: string,
  work: () => Promise<void>
): void {
  // Start the task but don't await
  work().catch(error => {
    console.error(`[BackgroundTask] ${taskId} failed:`, error);
  });

  // Execution continues immediately
  console.log(`[BackgroundTask] ${taskId} started in background`);
}

// Usage
executeBackgroundTask('research-1', async () => {
  await performResearch();
});
console.log('This executes immediately while research runs in background');
```

**Anti-Pattern to Avoid:**

```typescript
// BAD: Unhandled promise rejection
function badBackgroundTask(work: () => Promise<void>): void {
  work(); // No error handling - will crash Node.js in future versions
}
```

### 1.2 PromiseTracker for In-Flight Operations

**Pattern:** Track in-flight promises to prevent duplicate work and enable waiting.

```typescript
/**
 * Tracks in-flight promises by key
 *
 * Use Case: Prevent duplicate research tasks for the same query
 */
class PromiseTracker {
  private promises = new Map<string, Promise<unknown>>();

  /**
   * Executes operation if not already in progress
   *
   * @param key - Unique identifier for the operation
   * @param fn - Async function to execute
   * @returns Promise that resolves when operation completes
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if already in progress
    const existing = this.promises.get(key);
    if (existing) {
      console.log(`[PromiseTracker] Reusing in-flight promise for ${key}`);
      return existing as Promise<T>;
    }

    // Create new promise with cleanup
    const promise = fn().finally(() => {
      // CRITICAL: Clean up to prevent memory leaks
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }

  /**
   * Checks if operation is in progress
   */
  isInProgress(key: string): boolean {
    return this.promises.has(key);
  }

  /**
   * Gets all in-flight keys
   */
  getInProgressKeys(): string[] {
    return Array.from(this.promises.keys());
  }

  /**
   * Waits for all in-flight operations to complete
   */
  async waitForAll(): Promise<void> {
    const promises = Array.from(this.promises.values());
    await Promise.all(promises);
  }

  /**
   * Gets count of in-flight operations
   */
  get size(): number {
    return this.promises.size;
  }
}

// Usage Example
const tracker = new PromiseTracker();

async function researchWithDeduplication(
  query: string
): Promise<ResearchResult> {
  return tracker.execute(`research:${query}`, async () => {
    console.log(`Starting research for: ${query}`);
    const result = await performExpensiveResearch(query);
    console.log(`Completed research for: ${query}`);
    return result;
  });
}

// First call starts the research
researchWithDeduplication('TypeScript patterns').then(result => {
  console.log('Got result:', result);
});

// Second call reuses the in-flight promise (no duplicate work)
researchWithDeduplication('TypeScript patterns').then(result => {
  console.log('Got same result:', result);
});
```

### 1.3 Background Worker with Queue

**Pattern:** Queue-based background processing with concurrency limits.

```typescript
/**
 * Background worker with queue and concurrency control
 *
 * Use Case: Process research tasks with limited parallelism
 */
class BackgroundWorker<T> {
  private queue: Array<{ task: T; work: () => Promise<void> }> = [];
  private running = 0;
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Adds task to queue and starts processing if capacity available
   */
  add(task: T, work: () => Promise<void>): void {
    this.queue.push({ task, work });
    this.#process();
  }

  /**
   * Processes next task if capacity available
   */
  async #process(): Promise<void> {
    // Check if we can start more work
    if (this.running >= this.maxConcurrency) {
      return;
    }

    const item = this.queue.shift();
    if (!item) {
      return;
    }

    // Increment running count
    this.running++;

    // Execute work with error handling
    item
      .work()
      .catch(error => {
        console.error(`[BackgroundWorker] Task failed:`, error);
      })
      .finally(() => {
        // Decrement and process next
        this.running--;
        this.#process();
      });
  }

  /**
   * Waits for all tasks to complete
   */
  async onIdle(): Promise<void> {
    while (this.queue.length > 0 || this.running > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Gets queue stats
   */
  getStats(): { queued: number; running: number } {
    return {
      queued: this.queue.length,
      running: this.running,
    };
  }
}

// Usage
const worker = new BackgroundWorker<ResearchTask>(3); // Max 3 concurrent

worker.add({ id: '1', query: 'async patterns' }, async () => {
  await performResearch('async patterns');
});

worker.add({ id: '2', query: 'error handling' }, async () => {
  await performResearch('error handling');
});

console.log('Tasks queued, processing in background...');
await worker.onIdle();
console.log('All tasks completed');
```

### 1.4 Event Emitter Pattern for Background Tasks

**Pattern:** Use EventEmitter for task lifecycle events.

```typescript
import { EventEmitter } from 'events';

/**
 * Background task manager with event emissions
 *
 * Use Case: Observe research task lifecycle for logging/metrics
 */
class BackgroundTaskManager extends EventEmitter {
  private tracker = new PromiseTracker();

  /**
   * Executes task with event emissions
   */
  async execute<T>(id: string, work: () => Promise<T>): Promise<T> {
    // Emit start event
    this.emit('task:start', { id, timestamp: Date.now() });

    return this.tracker.execute(id, async () => {
      try {
        const result = await work();

        // Emit success event
        this.emit('task:complete', {
          id,
          timestamp: Date.now(),
          result,
        });

        return result;
      } catch (error) {
        // Emit failure event
        this.emit('task:failed', {
          id,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    });
  }

  /**
   * Gets in-flight task count
   */
  get running(): number {
    return this.tracker.size;
  }
}

// Usage with listeners
const manager = new BackgroundTaskManager();

manager.on('task:start', ({ id }) => {
  console.log(`[TaskManager] Started: ${id}`);
});

manager.on('task:complete', ({ id }) => {
  console.log(`[TaskManager] Completed: ${id}`);
});

manager.on('task:failed', ({ id, error }) => {
  console.error(`[TaskManager] Failed: ${id} - ${error}`);
});

manager.execute('research-1', async () => {
  return await performResearch();
});
```

---

## 2. Promise.all vs Promise.allSettled

### 2.1 Promise.all - Fail Fast Behavior

**Pattern:** Use when all operations must succeed for the result to be valid.

```typescript
/**
 * Promise.all example - fail fast on first error
 *
 * Characteristics:
 * - Rejects immediately if ANY promise rejects
 * - Returns array of results in original order
 * - Use when: All operations are critical (e.g., fetching required dependencies)
 */

async function fetchAllRequiredData(): Promise<[User, Orders, Preferences]> {
  try {
    const results = await Promise.all([
      fetchUser(userId),
      fetchOrders(userId),
      fetchPreferences(userId),
    ]);

    // TypeScript knows the types: [User, Orders, Preferences]
    return results;
  } catch (error) {
    // At least one fetch failed - can't proceed without it
    console.error('Required data fetch failed:', error);
    throw new Error('Cannot proceed without all required data');
  }
}

// Anti-Pattern: Don't use Promise.all for non-critical operations
async function badExample(): Promise<void> {
  // BAD: Analytics/logging failure shouldn't block main operation
  await Promise.all([
    processPayment(), // Critical
    logAnalytics(), // Non-critical - shouldn't block
    sendEmail(), // Non-critical - shouldn't block
  ]);
}
```

### 2.2 Promise.allSettled - Resilient Parallel Execution

**Pattern:** Use when you want all operations to complete regardless of failures.

```typescript
/**
 * Promise.allSettled example - continue despite failures
 *
 * Characteristics:
 * - Waits for ALL promises to complete (success or failure)
 * - Returns array of status objects with outcome
 * - Use when: Operations are independent and partial success is acceptable
 */

interface TaskResult {
  taskId: string;
  status: 'success' | 'failed';
  result?: unknown;
  error?: string;
}

async function executeResearchTasksParallel(
  tasks: Array<{ id: string; query: string }>
): Promise<TaskResult[]> {
  const results = await Promise.allSettled(
    tasks.map(task => performResearch(task.query))
  );

  return results.map((result, index) => {
    const task = tasks[index];

    if (result.status === 'fulfilled') {
      return {
        taskId: task.id,
        status: 'success',
        result: result.value,
      };
    } else {
      return {
        taskId: task.id,
        status: 'failed',
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      };
    }
  });
}

// Usage
const tasks = [
  { id: '1', query: 'TypeScript patterns' },
  { id: '2', query: 'Node.js best practices' },
  { id: '3', query: 'async programming' },
];

const results = await executeResearchTasksParallel(tasks);

const succeeded = results.filter(r => r.status === 'success');
const failed = results.filter(r => r.status === 'failed');

console.log(`Succeeded: ${succeeded.length}, Failed: ${failed.length}`);

// Handle successful results
succeeded.forEach(result => {
  console.log(`✓ ${result.taskId}:`, result.result);
});

// Handle failures
failed.forEach(result => {
  console.error(`✗ ${result.taskId}: ${result.error}`);
});
```

### 2.3 Hybrid Pattern: Critical vs Non-Critical Operations

**Pattern:** Combine Promise.all (critical) and Promise.allSettled (non-critical).

```typescript
/**
 * Execute critical and non-critical operations separately
 *
 * Pattern: Separate operations by criticality, then combine results
 */
async function executeMixedOperations(
  criticalOps: Array<() => Promise<void>>,
  nonCriticalOps: Array<() => Promise<void>>
): Promise<{ criticalSuccess: boolean; nonCriticalResults: unknown[] }> {
  // Execute critical operations with Promise.all (fail-fast)
  let criticalSuccess = false;
  try {
    await Promise.all(criticalOps.map(op => op()));
    criticalSuccess = true;
  } catch (error) {
    console.error('Critical operation failed:', error);
    return { criticalSuccess: false, nonCriticalResults: [] };
  }

  // Execute non-critical operations with Promise.allSettled (resilient)
  const nonCriticalResults = await Promise.allSettled(
    nonCriticalOps.map(op => op())
  );

  return {
    criticalSuccess,
    nonCriticalResults: nonCriticalResults.map(r =>
      r.status === 'fulfilled' ? r.value : null
    ),
  };
}

// Usage for ResearchQueue integration
async function executeSubtaskWithBackgroundResearch(
  subtask: Subtask,
  researchQueries: string[]
): Promise<void> {
  // Critical: Must succeed for subtask to complete
  const criticalOps = [
    () => updateStatus(subtask.id, 'Implementing'),
    () => executeImplementation(subtask),
    () => updateStatus(subtask.id, 'Complete'),
  ];

  // Non-critical: Research for future subtasks (can fail safely)
  const nonCriticalOps = researchQueries.map(
    query => () =>
      performResearch(query).catch(error => {
        console.warn(`Background research failed for ${query}:`, error);
      })
  );

  const { criticalSuccess } = await executeMixedOperations(
    criticalOps,
    nonCriticalOps
  );

  if (!criticalSuccess) {
    await updateStatus(subtask.id, 'Failed');
    throw new Error('Critical operations failed');
  }
}
```

### 2.4 Concurrency-Controlled Parallel Execution

**Pattern:** Limit concurrency while using Promise.allSettled.

```typescript
/**
 * Executes operations in batches with concurrency limit
 *
 * Use Case: Avoid overwhelming APIs or system resources
 */
async function executeBoundedParallel<T>(
  operations: Array<() => Promise<T>>,
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  const batches: Array<Array<() => Promise<T>>> = [];

  // Split into batches
  for (let i = 0; i < operations.length; i += concurrency) {
    batches.push(operations.slice(i, i + concurrency));
  }

  // Execute each batch sequentially
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(batch.map(op => op()));
    results.push(...batchResults);
  }

  return results;
}

// Usage: Research 50 queries with max 5 concurrent
const queries = Array.from({ length: 50 }, (_, i) => `query-${i}`);

const results = await executeBoundedParallel(
  queries.map(query => () => performResearch(query)),
  5 // Max 5 concurrent requests
);

console.log(`Completed ${results.length} research operations`);
```

---

## 3. Anti-Patterns to Avoid

### 3.1 Unhandled Promise Rejections

**Anti-Pattern:** Starting async tasks without error handling.

```typescript
// BAD: Unhandled promise rejection
class BadQueue {
  process(task: () => Promise<void>): void {
    task(); // No .catch() - will cause unhandled rejection
  }
}

// GOOD: Always handle errors
class GoodQueue {
  process(task: () => Promise<void>): void {
    task().catch(error => {
      console.error('[Queue] Task failed:', error);
    });
  }
}
```

**Consequences:**

- Node.js will crash (in future versions) on unhandled rejections
- Errors are silently lost
- No way to track or recover from failures

### 3.2 Memory Leaks from Unbounded Maps

**Anti-Pattern:** Never cleaning up promise tracking maps.

```typescript
// BAD: Promise map grows indefinitely
class BadTracker {
  private promises = new Map<string, Promise<unknown>>();

  execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const promise = fn(); // No cleanup
    this.promises.set(key, promise);
    return promise;
  }
}

// GOOD: Clean up promises after completion
class GoodTracker {
  private promises = new Map<string, Promise<unknown>>();

  execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const promise = fn().finally(() => {
      // CRITICAL: Clean up to prevent memory leaks
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }
}
```

### 3.3 Race Conditions in Status Checks

**Anti-Pattern:** Non-atomic check-and-execute patterns.

```typescript
// BAD: Race condition between check and execute
if (!tracker.isInProgress(key)) {
  // Another task could start here
  await tracker.execute(key, work);
}

// GOOD: Atomic check-and-set
await tracker.execute(key, work); // Handles deduplication internally
```

### 3.4 Blocking the Event Loop

**Anti-Pattern:** Synchronous operations in async functions.

```typescript
// BAD: Synchronous file operations block event loop
async function badProcess(): Promise<void> {
  while (queue.length > 0) {
    const task = queue.shift();
    fs.readFileSync(task.path); // Blocks entire event loop!
  }
}

// GOOD: Use async operations
async function goodProcess(): Promise<void> {
  while (queue.length > 0) {
    const task = queue.shift();
    await fs.readFile(task.path); // Non-blocking
  }
}
```

### 3.5 Lost Promise References

**Anti-Pattern:** Starting promises without storing references.

```typescript
// BAD: Can't wait for background tasks to complete
function badQueueWork(task: () => Promise<void>): void {
  task(); // Promise reference lost - can't wait for completion
}

// GOOD: Track promises for waiting
class GoodQueue {
  private promises: Promise<void>[] = [];

  queueWork(task: () => Promise<void>): void {
    const promise = task().catch(error => {
      console.error('[Queue] Task failed:', error);
    });

    this.promises.push(promise);
  }

  async waitForAll(): Promise<void> {
    await Promise.all(this.promises);
    this.promises = []; // Clear after completion
  }
}
```

### 3.6 Over-Parallelization

**Anti-Pattern:** Creating too many concurrent operations.

```typescript
// BAD: Could create thousands of concurrent requests
async function badParallel(items: string[]): Promise<void> {
  await Promise.all(items.map(item => fetch(item)));
}

// GOOD: Limit concurrency
async function goodParallel(items: string[]): Promise<void> {
  await executeBoundedParallel(
    items.map(item => () => fetch(item)),
    10 // Max 10 concurrent
  );
}
```

---

## 4. Research-Ahead Patterns

### 4.1 Prefetch During Sequential Execution

**Pattern:** Start background research while executing current task.

```typescript
/**
 * Research-ahead orchestrator
 *
 * Pattern: While executing task N, start research for task N+1, N+2, etc.
 */
class ResearchAheadOrchestrator {
  private researchQueue = new PromiseTracker();
  private lookAhead = 3; // Research next 3 tasks

  /**
   * Executes subtasks with research-ahead optimization
   */
  async executeSubtasks(subtasks: Subtask[]): Promise<void> {
    for (let i = 0; i < subtasks.length; i++) {
      const current = subtasks[i];

      // Start background research for upcoming tasks
      for (let j = 1; j <= this.lookAhead; j++) {
        const next = subtasks[i + j];
        if (next) {
          this.#startBackgroundResearch(next);
        }
      }

      // Execute current task (research may already be complete)
      await this.executeSubtask(current);
    }
  }

  /**
   * Starts background research without blocking
   */
  #startBackgroundResearch(subtask: Subtask): void {
    const researchKey = `research:${subtask.id}`;

    // Fire-and-forget with error handling
    this.researchQueue
      .execute(researchKey, async () => {
        console.log(`[ResearchAhead] Starting research for ${subtask.id}`);
        const result = await performResearch(subtask.title);
        console.log(`[ResearchAhead] Completed research for ${subtask.id}`);
        return result;
      })
      .catch(error => {
        console.error(
          `[ResearchAhead] Research failed for ${subtask.id}:`,
          error
        );
      });
  }

  /**
   * Executes subtask with cached research if available
   */
  async executeSubtask(subtask: Subtask): Promise<void> {
    const researchKey = `research:${subtask.id}`;

    // Check if research is already complete
    if (this.researchQueue.isInProgress(researchKey)) {
      console.log(`[ResearchAhead] Waiting for research for ${subtask.id}`);
      await this.researchQueue.execute(researchKey, () => Promise.resolve());
    }

    // Execute implementation
    await this.executeImplementation(subtask);
  }

  async executeImplementation(subtask: Subtask): Promise<void> {
    // Implementation logic here
  }
}
```

### 4.2 Priority-Based Research Queue

**Pattern:** Prioritize research for tasks that will execute soon.

```typescript
/**
 * Priority-based research queue
 *
 * Pattern: Higher priority for immediate tasks, lower for future tasks
 */
interface PriorityResearchTask {
  subtaskId: string;
  query: string;
  priority: number; // Lower = higher priority
}

class PriorityResearchQueue {
  private queue: PriorityResearchTask[] = [];
  private tracker = new PromiseTracker();
  private maxConcurrency = 5;
  private running = 0;

  /**
   * Adds research task with priority
   */
  add(subtask: Subtask, priority: number): void {
    this.queue.push({
      subtaskId: subtask.id,
      query: subtask.title,
      priority,
    });

    // Sort by priority (lower first)
    this.queue.sort((a, b) => a.priority - b.priority);

    this.#process();
  }

  /**
   * Processes next high-priority task
   */
  async #process(): Promise<void> {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.running++;

    this.tracker
      .execute(`research:${task.subtaskId}`, async () => {
        console.log(
          `[PriorityQueue] Processing: ${task.subtaskId} (priority: ${task.priority})`
        );

        try {
          await performResearch(task.query);
        } catch (error) {
          console.error(`[PriorityQueue] Failed: ${task.subtaskId}`, error);
        } finally {
          this.running--;
          this.#process(); // Process next task
        }
      })
      .catch(error => {
        console.error(`[PriorityQueue] Error:`, error);
      });
  }

  /**
   * Checks if research is complete
   */
  isComplete(subtaskId: string): boolean {
    return this.tracker.isInProgress(`research:${subtaskId}`);
  }

  /**
   * Waits for specific research to complete
   */
  async waitFor(subtaskId: string): Promise<void> {
    await this.tracker.execute(`research:${subtaskId}`, () =>
      Promise.resolve()
    );
  }
}
```

### 4.3 Predictive Research Based on Dependencies

**Pattern:** Analyze dependencies to predict which research to start.

```typescript
/**
 * Predictive research based on dependency graph
 *
 * Pattern: Start research for tasks that will soon be unblocked
 */
class PredictiveResearchQueue {
  private researchTracker = new PromiseTracker();

  /**
   * Analyzes backlog and starts research for soon-to-be-unblocked tasks
   */
  async startPredictiveResearch(backlog: Backlog): Promise<void> {
    const allSubtasks = findAllSubtasks(backlog);

    for (const subtask of allSubtasks) {
      // Skip if already researched or currently executing
      if (this.researchTracker.isInProgress(`research:${subtask.id}`)) {
        continue;
      }

      // Calculate "readiness score" based on dependencies
      const score = this.#calculateReadinessScore(subtask, backlog);

      // Start research if task will likely be unblocked soon
      if (score > 0.5) {
        console.log(
          `[Predictive] Starting research for ${subtask.id} (score: ${score.toFixed(2)})`
        );

        this.researchTracker
          .execute(`research:${subtask.id}`, async () => {
            await performResearch(subtask.title);
          })
          .catch(error => {
            console.error(
              `[Predictive] Research failed for ${subtask.id}:`,
              error
            );
          });
      }
    }
  }

  /**
   * Calculates readiness score (0-1) based on dependency completion
   */
  #calculateReadinessScore(subtask: Subtask, backlog: Backlog): number {
    const dependencies = getDependencies(subtask, backlog);

    if (dependencies.length === 0) {
      return 1.0; // No dependencies = ready now
    }

    const completed = dependencies.filter(
      dep => dep.status === 'Complete'
    ).length;
    return completed / dependencies.length;
  }

  /**
   * Gets research results for subtask
   */
  async getResearch(subtaskId: string): Promise<ResearchResult | null> {
    try {
      return await this.researchTracker.execute(`research:${subtaskId}`, () =>
        Promise.resolve(null)
      );
    } catch {
      return null;
    }
  }
}
```

### 4.4 Speculative Research with Validation

**Pattern:** Start research for multiple potential paths, validate later.

```typescript
/**
 * Speculative research engine
 *
 * Pattern: Research multiple alternatives, use the one that's needed
 */
class SpeculativeResearchEngine {
  private cache = new Map<string, ResearchResult>();
  private tracker = new PromiseTracker();

  /**
   * Starts speculative research for multiple alternatives
   */
  async startSpeculativeResearch(alternatives: string[]): Promise<void> {
    for (const alternative of alternatives) {
      this.tracker
        .execute(`speculative:${alternative}`, async () => {
          console.log(`[Speculative] Researching: ${alternative}`);

          const result = await performResearch(alternative);

          // Cache result for later use
          this.cache.set(alternative, result);

          console.log(`[Speculative] Completed: ${alternative}`);
          return result;
        })
        .catch(error => {
          console.error(`[Speculative] Failed: ${alternative}`, error);
        });
    }
  }

  /**
   * Gets research result if available, returns null otherwise
   */
  getResult(alternative: string): ResearchResult | null {
    return this.cache.get(alternative) ?? null;
  }

  /**
   * Checks if research is complete
   */
  isComplete(alternative: string): boolean {
    return this.cache.has(alternative);
  }
}
```

---

## 5. Metrics Logging for Cache Performance

### 5.1 Cache Hit/Miss Tracking

**Pattern:** Track cache performance with detailed metrics.

```typescript
/**
 * Cache metrics tracker
 *
 * Pattern: Record hits, misses, and performance data
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  averageLatency: number;
  totalRequests: number;
}

class ResearchCache {
  private cache = new Map<string, { result: unknown; timestamp: number }>();
  private metrics = {
    hits: 0,
    misses: 0,
    latencies: [] as number[],
  };
  private ttl = 3600000; // 1 hour

  /**
   * Gets result with metrics tracking
   */
  async get(key: string): Promise<unknown | null> {
    const startTime = Date.now();

    const cached = this.cache.get(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;

      // Check if cache entry is still valid
      if (age < this.ttl) {
        // Record hit
        this.metrics.hits++;
        this.metrics.latencies.push(Date.now() - startTime);

        console.log(`[Cache] HIT: ${key} (age: ${age}ms)`);
        return cached.result;
      } else {
        // Expired - remove from cache
        this.cache.delete(key);
      }
    }

    // Record miss
    this.metrics.misses++;
    this.metrics.latencies.push(Date.now() - startTime);

    console.log(`[Cache] MISS: ${key}`);
    return null;
  }

  /**
   * Sets result in cache
   */
  set(key: string, result: unknown): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
    console.log(`[Cache] SET: ${key}`);
  }

  /**
   * Gets cache metrics
   */
  getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    const averageLatency =
      this.metrics.latencies.length > 0
        ? this.metrics.latencies.reduce((a, b) => a + b, 0) /
          this.metrics.latencies.length
        : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate,
      averageLatency,
      totalRequests,
    };
  }

  /**
   * Logs metrics summary
   */
  logMetrics(): void {
    const metrics = this.getMetrics();

    console.log('[Cache Metrics Summary]');
    console.log(`  Total Requests: ${metrics.totalRequests}`);
    console.log(
      `  Hits: ${metrics.hits} (${(metrics.hitRate * 100).toFixed(2)}%)`
    );
    console.log(
      `  Misses: ${metrics.misses} (${((1 - metrics.hitRate) * 100).toFixed(2)}%)`
    );
    console.log(`  Avg Latency: ${metrics.averageLatency.toFixed(2)}ms`);
  }

  /**
   * Clears cache and resets metrics
   */
  clear(): void {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      latencies: [],
    };
  }
}
```

### 5.2 Structured Logging with Metrics

**Pattern:** Use structured logging for cache operations.

```typescript
/**
 * Structured cache logger
 *
 * Pattern: Log cache operations in JSON format for analysis
 */
interface CacheLogEntry {
  timestamp: number;
  operation: 'hit' | 'miss' | 'set' | 'invalidate';
  key: string;
  latency?: number;
  cacheSize?: number;
  hitRate?: number;
}

class StructuredCacheLogger {
  private logs: CacheLogEntry[] = [];
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
  };

  /**
   * Logs cache operation
   */
  log(entry: Omit<CacheLogEntry, 'timestamp'>): void {
    const logEntry: CacheLogEntry = {
      timestamp: Date.now(),
      ...entry,
    };

    this.logs.push(logEntry);

    // Update metrics
    switch (entry.operation) {
      case 'hit':
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'set':
        this.metrics.sets++;
        break;
      case 'invalidate':
        this.metrics.invalidations++;
        break;
    }
  }

  /**
   * Gets metrics summary
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.hits / total : 0,
      totalOperations:
        this.metrics.hits +
        this.metrics.misses +
        this.metrics.sets +
        this.metrics.invalidations,
    };
  }

  /**
   * Exports logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clears logs
   */
  clear(): void {
    this.logs = [];
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
    };
  }
}

// Usage
const logger = new StructuredCacheLogger();
const cache = new ResearchCache();

// Wrap cache operations with logging
async function getCached(key: string): Promise<unknown | null> {
  const startTime = Date.now();
  const result = await cache.get(key);
  const latency = Date.now() - startTime;

  logger.log({
    operation: result ? 'hit' : 'miss',
    key,
    latency,
    cacheSize: cache.getMetrics().hits,
  });

  return result;
}

// Export logs for analysis
console.log(logger.exportLogs());
```

### 5.3 Performance Monitoring with Alerts

**Pattern:** Alert when cache performance degrades.

```typescript
/**
 * Cache performance monitor with alerts
 *
 * Pattern: Monitor cache metrics and alert on thresholds
 */
interface CacheAlertThresholds {
  minHitRate: number; // Alert if hit rate drops below this
  maxLatency: number; // Alert if latency exceeds this
  maxCacheSize: number; // Alert if cache grows too large
}

class CacheMonitor {
  private cache: ResearchCache;
  private thresholds: CacheAlertThresholds;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    cache: ResearchCache,
    thresholds: CacheAlertThresholds = {
      minHitRate: 0.5, // Alert if hit rate < 50%
      maxLatency: 100, // Alert if latency > 100ms
      maxCacheSize: 1000, // Alert if cache > 1000 entries
    }
  ) {
    this.cache = cache;
    this.thresholds = thresholds;
  }

  /**
   * Starts periodic monitoring
   */
  start(intervalMs: number = 60000): void {
    this.checkInterval = setInterval(() => {
      this.checkMetrics();
    }, intervalMs);
  }

  /**
   * Stops monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Checks metrics and alerts on threshold violations
   */
  private checkMetrics(): void {
    const metrics = this.cache.getMetrics();

    // Check hit rate
    if (metrics.hitRate < this.thresholds.minHitRate) {
      console.warn(
        `[CacheMonitor] LOW HIT RATE: ${(metrics.hitRate * 100).toFixed(2)}% < ${(this.thresholds.minHitRate * 100).toFixed(2)}%`
      );
    }

    // Check latency
    if (metrics.averageLatency > this.thresholds.maxLatency) {
      console.warn(
        `[CacheMonitor] HIGH LATENCY: ${metrics.averageLatency.toFixed(2)}ms > ${this.thresholds.maxLatency}ms`
      );
    }

    // Check cache size (if available)
    const cacheSize = this.cache['cache']?.size ?? 0;
    if (cacheSize > this.thresholds.maxCacheSize) {
      console.warn(
        `[CacheMonitor] LARGE CACHE: ${cacheSize} entries > ${this.thresholds.maxCacheSize}`
      );
    }
  }

  /**
   * Gets current metrics
   */
  getMetrics(): CacheMetrics {
    return this.cache.getMetrics();
  }
}
```

### 5.4 Integration with TaskOrchestrator Metrics

**Pattern:** Combine cache metrics with task execution metrics.

```typescript
/**
 * Integrated metrics for TaskOrchestrator + ResearchQueue
 *
 * Pattern: Unified metrics for cache hits and task execution
 */
interface OrchestratorMetrics {
  tasks: {
    total: number;
    completed: number;
    failed: number;
    blocked: number;
  };
  research: {
    total: number;
    cached: number;
    executed: number;
    failed: number;
  };
  cache: {
    hitRate: number;
    averageLatency: number;
  };
}

class OrchestratorMetricsCollector {
  private cache = new ResearchCache();
  private metrics: OrchestratorMetrics = {
    tasks: {
      total: 0,
      completed: 0,
      failed: 0,
      blocked: 0,
    },
    research: {
      total: 0,
      cached: 0,
      executed: 0,
      failed: 0,
    },
    cache: {
      hitRate: 0,
      averageLatency: 0,
    },
  };

  /**
   * Records task execution
   */
  recordTaskExecution(status: 'completed' | 'failed' | 'blocked'): void {
    this.metrics.tasks.total++;
    this.metrics.tasks[status]++;
  }

  /**
   * Records research operation
   */
  recordResearch(type: 'cached' | 'executed' | 'failed'): void {
    this.metrics.research.total++;
    this.metrics.research[type]++;
  }

  /**
   * Gets combined metrics
   */
  getMetrics(): OrchestratorMetrics {
    return {
      ...this.metrics,
      cache: this.cache.getMetrics(),
    };
  }

  /**
   * Logs comprehensive metrics summary
   */
  logSummary(): void {
    const metrics = this.getMetrics();

    console.log('[Orchestrator Metrics Summary]');
    console.log('Tasks:');
    console.log(`  Total: ${metrics.tasks.total}`);
    console.log(
      `  Completed: ${metrics.tasks.completed} (${((metrics.tasks.completed / metrics.tasks.total) * 100).toFixed(2)}%)`
    );
    console.log(
      `  Failed: ${metrics.tasks.failed} (${((metrics.tasks.failed / metrics.tasks.total) * 100).toFixed(2)}%)`
    );
    console.log(
      `  Blocked: ${metrics.tasks.blocked} (${((metrics.tasks.blocked / metrics.tasks.total) * 100).toFixed(2)}%)`
    );

    console.log('Research:');
    console.log(`  Total: ${metrics.research.total}`);
    console.log(
      `  Cached: ${metrics.research.cached} (${((metrics.research.cached / metrics.research.total) * 100).toFixed(2)}%)`
    );
    console.log(
      `  Executed: ${metrics.research.executed} (${((metrics.research.executed / metrics.research.total) * 100).toFixed(2)}%)`
    );
    console.log(
      `  Failed: ${metrics.research.failed} (${((metrics.research.failed / metrics.research.total) * 100).toFixed(2)}%)`
    );

    console.log('Cache:');
    console.log(`  Hit Rate: ${(metrics.cache.hitRate * 100).toFixed(2)}%`);
    console.log(`  Avg Latency: ${metrics.cache.averageLatency.toFixed(2)}ms`);
  }
}
```

---

## 6. Integration with TaskOrchestrator

### 6.1 ResearchQueue Integration Pattern

**Pattern:** Integrate ResearchQueue with TaskOrchestrator for background research.

```typescript
/**
 * TaskOrchestrator with integrated ResearchQueue
 *
 * Pattern: Use PromiseTracker for fire-and-forget research with deduplication
 */
import { TaskOrchestrator } from './task-orchestrator.js';

class ResearchEnabledTaskOrchestrator extends TaskOrchestrator {
  private researchTracker = new PromiseTracker();
  private researchCache = new ResearchCache();
  private metrics = new OrchestratorMetricsCollector();
  private lookAhead = 3;

  /**
   * Executes subtask with research-ahead optimization
   */
  async executeSubtask(subtask: Subtask): Promise<void> {
    // Check if research is already cached
    const cachedResearch = await this.researchCache.get(
      `research:${subtask.id}`
    );

    if (cachedResearch) {
      console.log(`[Orchestrator] Using cached research for ${subtask.id}`);
      this.metrics.recordResearch('cached');
    } else {
      console.log(`[Orchestrator] Research not cached for ${subtask.id}`);
    }

    // Execute implementation
    try {
      await this.executeImplementation(subtask);
      this.metrics.recordTaskExecution('completed');
    } catch (error) {
      this.metrics.recordTaskExecution('failed');
      throw error;
    }
  }

  /**
   * Starts background research for upcoming subtasks
   */
  async startBackgroundResearch(upcomingSubtasks: Subtask[]): Promise<void> {
    for (const subtask of upcomingSubtasks.slice(0, this.lookAhead)) {
      const researchKey = `research:${subtask.id}`;

      // Skip if already cached
      const cached = await this.researchCache.get(researchKey);
      if (cached) {
        console.log(`[Orchestrator] Research already cached for ${subtask.id}`);
        continue;
      }

      // Start background research
      this.researchTracker
        .execute(researchKey, async () => {
          console.log(
            `[Orchestrator] Starting background research for ${subtask.id}`
          );

          try {
            const result = await performResearch(subtask.title);

            // Cache the result
            this.researchCache.set(researchKey, result);
            this.metrics.recordResearch('executed');

            console.log(
              `[Orchestrator] Background research completed for ${subtask.id}`
            );
            return result;
          } catch (error) {
            console.error(
              `[Orchestrator] Background research failed for ${subtask.id}:`,
              error
            );
            this.metrics.recordResearch('failed');
            throw error;
          }
        })
        .catch(error => {
          // Error already logged above
          console.error(`[Orchestrator] Research error handled:`, error);
        });
    }
  }

  /**
   * Gets research metrics
   */
  getMetrics(): OrchestratorMetrics {
    return this.metrics.getMetrics();
  }

  /**
   * Waits for all background research to complete
   */
  async waitForBackgroundResearch(): Promise<void> {
    console.log(
      '[Orchestrator] Waiting for background research to complete...'
    );
    await this.researchTracker.waitForAll();
    console.log('[Orchestrator] All background research completed');
  }

  /**
   * Logs metrics summary
   */
  logMetricsSummary(): void {
    this.metrics.logSummary();
  }

  async executeImplementation(subtask: Subtask): Promise<void> {
    // Implementation logic
  }
}
```

### 6.2 Processing Loop with Research-Ahead

**Pattern:** Modify processNextItem to start background research.

```typescript
/**
 * Enhanced processNextItem with research-ahead
 *
 * Pattern: Start research for upcoming items while processing current
 */
class ResearchAheadOrchestrator extends ResearchEnabledTaskOrchestrator {
  async processNextItem(): Promise<boolean> {
    // Check if execution queue has items
    if (this.executionQueue.length === 0) {
      console.log('[Orchestrator] Execution queue empty');
      return false;
    }

    // Get current item
    const currentItem = this.executionQueue.shift()!;

    // Start background research for upcoming items
    const upcomingItems = this.executionQueue.slice(0, this.lookAhead);
    const upcomingSubtasks = upcomingItems.filter(
      item => item.type === 'Subtask'
    ) as Subtask[];

    await this.startBackgroundResearch(upcomingSubtasks);

    // Execute current item
    console.log(
      `[Orchestrator] Processing: ${currentItem.id} (${currentItem.type})`
    );
    await this.#delegateByType(currentItem);

    // Refresh backlog
    await this.#refreshBacklog();

    return true;
  }

  async #delegateByType(item: HierarchyItem): Promise<void> {
    // Delegate to appropriate execute method
    switch (item.type) {
      case 'Subtask':
        return this.executeSubtask(item);
      // ... other cases
    }
  }
}
```

### 6.3 Graceful Shutdown with Background Tasks

**Pattern:** Ensure background research completes before shutdown.

```typescript
/**
 * Orchestrator with graceful shutdown
 *
 * Pattern: Wait for background research before shutdown
 */
class GracefulShutdownOrchestrator extends ResearchEnabledTaskOrchestrator {
  async shutdown(): Promise<void> {
    console.log('[Orchestrator] Initiating graceful shutdown...');

    // Log final metrics
    this.logMetricsSummary();

    // Wait for background research to complete
    await this.waitForBackgroundResearch();

    console.log('[Orchestrator] Shutdown complete');
  }

  /**
   * Processes all items with graceful shutdown
   */
  async processAll(): Promise<void> {
    try {
      let hasMore = true;
      while (hasMore) {
        hasMore = await this.processNextItem();
      }
    } finally {
      // Always wait for background research
      await this.shutdown();
    }
  }
}
```

---

## 7. References and Resources

### 7.1 Documentation URLs

**TypeScript/JavaScript Official:**

- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [MDN: Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [MDN: Async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

**Node.js:**

- [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Node.js Async Context Tracking](https://nodejs.org/api/async_context.html)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)

**Best Practices:**

- [Node.js Async Patterns](https://nodejs.dev/learn/asynchronous-workflow-and-control-flow-in-nodejs/)
- [JavaScript Promise Patterns](https://javascript.info/async)
- [TypeScript Promise Patterns](https://basarat.gitbook.io/typescript/type-system/promise)

### 7.2 Related Code Locations

**Current Implementation:**

- Task Orchestrator: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- Session Manager: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
- Type Models: `/home/dustin/projects/hacky-hack/src/core/models.ts`

**Related Research:**

- External Queue Patterns: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M2T1S1/research/external-queue-patterns.md`
- Async Error Handling: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P3M2T1S3/research/async_error_handling_research.md`

### 7.3 Recommended Libraries

**Concurrency Control:**

- [p-limit](https://github.com/sindresorhus/p-limit) - Simple concurrency limiting
- [p-queue](https://github.com/sindresorhus/p-queue) - Promise queue with priorities
- [bottleneck](https://github.com/SGrondin/bottleneck) - Comprehensive rate limiting

**Caching:**

- [cache-manager](https://github.com/node-cache-manager/node-cache-manager) - Multi-store caching
- [keyv](https://github.com/jaredwray/keyv) - Simple key-value storage

**Monitoring:**

- [winston](https://github.com/winstonjs/winston) - Structured logging
- [pino](https://getpino.io/) - High-performance logging

---

## Conclusion

This research provides comprehensive patterns for integrating ResearchQueue with TaskOrchestrator:

**Key Insights:**

1. **Fire-and-forget requires error handling** - Always attach `.catch()` to background tasks
2. **PromiseTracker prevents duplicate work** - Deduplicate in-flight operations by key
3. **Promise.all for critical, Promise.allSettled for resilient** - Choose based on failure tolerance
4. **Research-ahead improves performance** - Start background research while executing current tasks
5. **Cache metrics are essential** - Track hit rates, latency, and cache effectiveness
6. **Graceful shutdown is critical** - Wait for background research before exit

**Recommended Next Steps:**

1. Implement PromiseTracker for in-flight operation tracking
2. Add ResearchCache with metrics logging
3. Integrate research-ahead pattern in processNextItem
4. Add graceful shutdown with waitForAll
5. Implement comprehensive metrics collection

**Priority:** High - enables efficient background research processing without blocking task execution

---

**Document Status:** Complete
**Next Action:** Implement ResearchQueue integration in TaskOrchestrator
