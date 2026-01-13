# Async Task Queue Patterns in TypeScript/Node.js

**Research Date:** 2026-01-13
**Task:** P4M2T1S1 - Research async task queue patterns
**Location:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M2T1S1/research/`

---

## Executive Summary

This research document compiles best practices for implementing async task queues in TypeScript/Node.js, focusing on Promise-based queue management with concurrency limits, Map-based promise tracking for in-flight operations, and patterns for research queue or background task processing. The patterns are applicable to the PRP Pipeline's TaskOrchestrator and any future background processing systems.

---

## Table of Contents

1. [Core Queue Patterns Overview](#1-core-queue-patterns-overview)
2. [Promise-Based Queue Management with Concurrency Limits](#2-promise-based-queue-management-with-concurrency-limits)
3. [Map-Based Promise Tracking for In-Flight Operations](#3-map-based-promise-tracking-for-in-flight-operations)
4. [Research Queue Patterns](#4-research-queue-patterns)
5. [Best Practices: Enqueue Operations](#5-best-practices-enqueue-operations)
6. [Best Practices: Processing Next Task](#6-best-practices-processing-next-task)
7. [Best Practices: Checking if Task is In Progress](#7-best-practices-checking-if-task-is-in-progress)
8. [Best Practices: Waiting for Completion](#8-best-practices-waiting-for-completion)
9. [Best Practices: Caching Results](#9-best-practices-caching-results)
10. [Common Pitfalls to Avoid](#10-common-pitfalls-to-avoid)
11. [Recommended Libraries](#11-recommended-libraries)
12. [Code Examples](#12-code-examples)
13. [References and Resources](#13-references-and-resources)

---

## 1. Core Queue Patterns Overview

### 1.1 What is an Async Task Queue?

An async task queue is a data structure that manages the execution of asynchronous operations with controlled concurrency. Key characteristics:

- **Concurrency Control:** Limits how many operations run simultaneously
- **Order Preservation:** Processes tasks in FIFO order (by default)
- **Promise-Based:** Leverages JavaScript Promises for async flow control
- **State Tracking:** Monitors in-flight, pending, and completed tasks
- **Error Handling:** Manages failures without losing queue state

### 1.2 Use Cases

**Research Queue:**

- Parallel API calls with rate limiting
- Background data fetching
- Batch processing with controlled concurrency

**Background Task Processing:**

- Email sending
- File processing
- Database migrations
- Report generation

**Workflow Systems:**

- Task orchestration (like PRP Pipeline)
- Dependency resolution
- Sequential/parallel task execution

---

## 2. Promise-Based Queue Management with Concurrency Limits

### 2.1 Basic Semaphore Pattern

The simplest form of concurrency control using a semaphore-like pattern:

```typescript
/**
 * Basic semaphore for limiting concurrent operations
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<(permit: number) => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquires a permit, waiting if necessary
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    // Wait for a permit to become available
    return new Promise<void>(resolve => {
      this.waitQueue.push(() => {
        this.permits--;
        resolve();
      });
    });
  }

  /**
   * Releases a permit, notifying next waiter if any
   */
  release(): void {
    this.permits++;

    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      next?.();
    }
  }
}

/**
 * Executes operation with semaphore-constrained concurrency
 */
async function withSemaphore<T>(
  semaphore: Semaphore,
  operation: () => Promise<T>
): Promise<T> {
  await semaphore.acquire();
  try {
    return await operation();
  } finally {
    semaphore.release();
  }
}

// Usage:
const semaphore = new Semaphore(5); // Max 5 concurrent operations

const tasks = Array.from({ length: 100 }, (_, i) =>
  withSemaphore(semaphore, () => fetch(`https://api.example.com/data/${i}`))
);

await Promise.all(tasks);
```

### 2.2 Promise-based Concurrency Limiter

A more sophisticated approach using Promise chaining:

```typescript
/**
 * Limits concurrency of promise-returning functions
 */
class ConcurrencyLimiter {
  private concurrency: number;
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  /**
   * Adds a task to the queue
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.next();
        }
      };

      this.queue.push(task);
      if (this.running < this.concurrency) {
        this.next();
      }
    });
  }

  /**
   * Processes next task in queue
   */
  private next(): void {
    if (this.running >= this.concurrency) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      this.running++;
      task();
    }
  }

  /**
   * Returns current queue size
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Returns number of running tasks
   */
  get pending(): number {
    return this.running;
  }
}

// Usage:
const limiter = new ConcurrencyLimiter(5);

// Add tasks dynamically
for (let i = 0; i < 100; i++) {
  limiter.add(async () => {
    console.log(`Processing ${i}`);
    await fetch(`https://api.example.com/data/${i}`);
  });
}
```

### 2.3 PQueue-Inspired Implementation

Production-ready queue with priority and pause/resume:

```typescript
/**
 * Task with priority support
 */
interface QueueTask<T> {
  fn: () => Promise<T>;
  priority: number;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

/**
 * Promise-based queue with concurrency control and priorities
 */
class PQueue {
  private concurrency: number;
  private queue: QueueTask<unknown>[] = [];
  private pendingCount = 0;
  private isPaused = false;

  constructor(options: { concurrency: number }) {
    this.concurrency = options.concurrency;
  }

  /**
   * Adds a task to the queue
   */
  async add<T>(
    fn: () => Promise<T>,
    options: { priority?: number } = {}
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: QueueTask<T> = {
        fn,
        priority: options.priority ?? 0,
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      this.queue.push(task);
      this.queue.sort((a, b) => a.priority - b.priority); // Lower priority = first

      this.#process();
    });
  }

  /**
   * Processes next task if capacity available
   */
  async #process(): Promise<void> {
    if (this.isPaused) {
      return;
    }

    if (this.pendingCount >= this.concurrency) {
      return;
    }

    const task = this.queue.shift();
    if (!task) {
      return;
    }

    this.pendingCount++;

    try {
      const result = await task.fn();
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.pendingCount--;
      this.#process(); // Process next task
    }
  }

  /**
   * Pauses queue processing
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resumes queue processing
   */
  resume(): void {
    this.isPaused = false;
    this.#process();
  }

  /**
   * Clears pending tasks (doesn't affect running tasks)
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Returns queue size (excluding running tasks)
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Returns number of pending/running tasks
   */
  get pending(): number {
    return this.pendingCount;
  }

  /**
   * Waits for all tasks to complete
   */
  async onIdle(): Promise<void> {
    while (this.queue.length > 0 || this.pendingCount > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
```

---

## 3. Map-Based Promise Tracking for In-Flight Operations

### 3.1 Basic Promise Map Pattern

Track in-flight operations by key to prevent duplicate work:

```typescript
/**
 * Tracks in-flight promises by key
 */
class PromiseTracker {
  private promises = new Map<string, Promise<unknown>>();

  /**
   * Executes operation if not already in progress for this key
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if already in progress
    const existing = this.promises.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    // Create new promise
    const promise = fn().finally(() => {
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }

  /**
   * Checks if operation is in progress for key
   */
  isInProgress(key: string): boolean {
    return this.promises.has(key);
  }

  /**
   * Gets promise for key if in progress
   */
  get<T>(key: string): Promise<T> | undefined {
    return this.promises.get(key) as Promise<T> | undefined;
  }

  /**
   * Waits for specific key to complete
   */
  async waitFor<T>(key: string): Promise<T> {
    const promise = this.promises.get(key);
    if (!promise) {
      throw new Error(`No in-flight operation for key: ${key}`);
    }
    return promise as Promise<T>;
  }

  /**
   * Waits for all in-flight operations to complete
   */
  async waitForAll(): Promise<void> {
    const promises = Array.from(this.promises.values());
    await Promise.all(promises);
  }

  /**
   * Returns number of in-flight operations
   */
  get size(): number {
    return this.promises.size;
  }

  /**
   * Returns all in-flight keys
   */
  get keys(): string[] {
    return Array.from(this.promises.keys());
  }
}
```

### 3.2 Promise Map with Result Caching

Combine tracking with result caching:

```typescript
/**
 * Result cache with TTL
 */
interface CachedResult<T> {
  result: T;
  timestamp: number;
  ttl: number;
}

/**
 * Promise tracker with result caching
 */
class CachedPromiseTracker {
  private promises = new Map<string, Promise<unknown>>();
  private cache = new Map<string, CachedResult<unknown>>();

  /**
   * Executes operation with caching
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options: { ttl?: number } = {}
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cached.ttl) {
        return cached.result as T;
      }
      this.cache.delete(key);
    }

    // Check if in progress
    const existing = this.promises.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    // Create new promise
    const ttl = options.ttl ?? 60000; // Default 1 minute
    const promise = fn()
      .then(result => {
        this.cache.set(key, {
          result,
          timestamp: Date.now(),
          ttl,
        });
        return result;
      })
      .finally(() => {
        this.promises.delete(key);
      });

    this.promises.set(key, promise);
    return promise;
  }

  /**
   * Invalidates cached result for key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears all cached results
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Checks if key is in progress
   */
  isInProgress(key: string): boolean {
    return this.promises.has(key);
  }

  /**
   * Checks if key is cached
   */
  isCached(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < cached.ttl;
  }

  /**
   * Gets cache stats
   */
  getStats(): {
    inFlight: number;
    cached: number;
    keys: string[];
  } {
    return {
      inFlight: this.promises.size,
      cached: this.cache.size,
      keys: Array.from(
        new Set([...this.promises.keys(), ...this.cache.keys()])
      ),
    };
  }
}
```

### 3.3 Promise Map with Concurrency Per Key

Limit concurrent operations per unique key:

```typescript
/**
 * Manages concurrency per key
 */
class PerKeyConcurrencyLimiter {
  private limiters = new Map<string, ConcurrencyLimiter>();
  private defaultConcurrency: number;

  constructor(defaultConcurrency: number) {
    this.defaultConcurrency = defaultConcurrency;
  }

  /**
   * Gets or creates limiter for key
   */
  #getLimiter(key: string): ConcurrencyLimiter {
    let limiter = this.limiters.get(key);
    if (!limiter) {
      limiter = new ConcurrencyLimiter(this.defaultConcurrency);
      this.limiters.set(key, limiter);
    }
    return limiter;
  }

  /**
   * Executes operation with per-key concurrency limit
   */
  async add<T>(
    key: string,
    fn: () => Promise<T>,
    options: { concurrency?: number } = {}
  ): Promise<T> {
    const limiter = this.#getLimiter(key);
    return limiter.add(fn);
  }

  /**
   * Removes limiter for key
   */
  remove(key: string): void {
    this.limiters.delete(key);
  }

  /**
   * Gets stats for all keys
   */
  getStats(): Map<string, { size: number; pending: number }> {
    const stats = new Map();
    for (const [key, limiter] of this.limiters) {
      stats.set(key, {
        size: limiter.size,
        pending: limiter.pending,
      });
    }
    return stats;
  }
}
```

---

## 4. Research Queue Patterns

### 4.1 Research Queue with Deduplication

Queue that prevents duplicate research tasks:

```typescript
/**
 * Research task with metadata
 */
interface ResearchTask<T> {
  id: string;
  query: string;
  fn: () => Promise<T>;
  priority: number;
}

/**
 * Queue for research tasks with deduplication
 */
class ResearchQueue {
  private queue: ResearchTask<unknown>[] = [];
  private inProgress = new Map<string, Promise<unknown>>();
  private results = new Map<string, unknown>();
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Adds research task to queue
   */
  async research<T>(
    id: string,
    query: string,
    fn: () => Promise<T>,
    options: { priority?: number; force?: boolean } = {}
  ): Promise<T> {
    // Check if already has result
    if (!options.force && this.results.has(id)) {
      return this.results.get(id) as T;
    }

    // Check if already in progress
    if (this.inProgress.has(id)) {
      return this.inProgress.get(id) as Promise<T>;
    }

    // Create task
    const task: ResearchTask<T> = {
      id,
      query,
      fn,
      priority: options.priority ?? 0,
    };

    this.queue.push(task);
    this.queue.sort((a, b) => a.priority - b.priority);

    const promise = new Promise<T>((resolve, reject) => {
      const wrappedFn = async () => {
        try {
          const result = await task.fn();
          this.results.set(id, result);
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        } finally {
          this.inProgress.delete(id);
          this.#processNext();
        }
      };

      this.inProgress.set(id, wrappedFn());
      this.#processNext();
    });

    return promise;
  }

  /**
   * Processes next task if capacity available
   */
  async #processNext(): Promise<void> {
    if (this.inProgress.size >= this.maxConcurrency) {
      return;
    }

    const task = this.queue.shift();
    if (!task) {
      return;
    }

    // Promise already started in research(), just await it
    const promise = this.inProgress.get(task.id);
    if (promise) {
      await promise.catch(() => {
        // Error already handled
      });
    }
  }

  /**
   * Checks if research is in progress
   */
  isInProgress(id: string): boolean {
    return this.inProgress.has(id);
  }

  /**
   * Checks if research is complete
   */
  hasResult(id: string): boolean {
    return this.results.has(id);
  }

  /**
   * Gets cached result
   */
  getResult<T>(id: string): T | undefined {
    return this.results.get(id) as T | undefined;
  }

  /**
   * Clears cached results
   */
  clearCache(): void {
    this.results.clear();
  }

  /**
   * Gets queue stats
   */
  getStats(): {
    pending: number;
    inProgress: number;
    cached: number;
  } {
    return {
      pending: this.queue.length,
      inProgress: this.inProgress.size,
      cached: this.results.size,
    };
  }
}
```

### 4.2 Background Research Worker

Continuous background processing of research tasks:

```typescript
/**
 * Background research worker
 */
class BackgroundResearchWorker {
  private queue: PQueue;
  private researchQueue: ResearchQueue;
  private isRunning = false;
  private pollInterval: number;

  constructor(pollInterval: number = 1000, concurrency: number = 3) {
    this.queue = new PQueue({ concurrency });
    this.researchQueue = new ResearchQueue(concurrency);
    this.pollInterval = pollInterval;
  }

  /**
   * Starts the background worker
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.#poll();
  }

  /**
   * Stops the background worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    await this.queue.onIdle();
    (await this.researchQueue.getStats().inProgress) === 0
      ? Promise.resolve()
      : new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Polls for new research tasks
   */
  async #poll(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check for new tasks
        const tasks = await this.#fetchPendingTasks();

        for (const task of tasks) {
          this.queue.add(async () => {
            await this.researchQueue.research(task.id, task.query, task.fn, {
              priority: task.priority,
            });
          });
        }

        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      } catch (error) {
        console.error('[BackgroundWorker] Poll error:', error);
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      }
    }
  }

  /**
   * Fetches pending tasks (override in implementation)
   */
  async #fetchPendingTasks(): Promise<
    Array<{
      id: string;
      query: string;
      fn: () => Promise<unknown>;
      priority: number;
    }>
  > {
    // Implementation-specific
    return [];
  }

  /**
   * Adds task to queue
   */
  async add<T>(
    id: string,
    query: string,
    fn: () => Promise<T>,
    options: { priority?: number } = {}
  ): Promise<T> {
    return this.researchQueue.research(id, query, fn, options);
  }

  /**
   * Waits for all research to complete
   */
  async waitForAll(): Promise<void> {
    await this.queue.onIdle();
    const stats = this.researchQueue.getStats();
    while (stats.inProgress > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### 4.3 Research Queue with Persistence

Queue that persists to disk for recovery:

```typescript
/**
 * Persistent research queue
 */
class PersistentResearchQueue {
  private queue: ResearchQueue;
  private storagePath: string;
  private flushInterval: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(
    storagePath: string,
    options: { concurrency?: number; flushInterval?: number } = {}
  ) {
    this.queue = new ResearchQueue(options.concurrency ?? 5);
    this.storagePath = storagePath;
    this.flushInterval = options.flushInterval ?? 5000;
    this.#startFlushTimer();
  }

  /**
   * Adds research task with persistence
   */
  async research<T>(
    id: string,
    query: string,
    fn: () => Promise<T>,
    options: { priority?: number } = {}
  ): Promise<T> {
    const promise = this.queue.research(id, query, fn, options);

    // Persist queue state
    await this.#persist();

    return promise;
  }

  /**
   * Persists queue state to disk
   */
  async #persist(): Promise<void> {
    const state = {
      timestamp: Date.now(),
      stats: this.queue.getStats(),
      inProgress: Array.from(this.queue['inProgress'].keys()),
      results: Array.from(this.queue['results'].entries()),
    };

    await fs.writeFile(this.storagePath, JSON.stringify(state, null, 2));
  }

  /**
   * Restores queue state from disk
   */
  async #restore(): Promise<void> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8');
      const state = JSON.parse(data);

      // Restore results
      for (const [id, result] of state.results) {
        this.queue['results'].set(id, result);
      }

      console.log('[PersistentQueue] Restored state from disk');
    } catch (error) {
      console.log('[PersistentQueue] No previous state found');
    }
  }

  /**
   * Starts periodic flush timer
   */
  #startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.#persist().catch(error => {
        console.error('[PersistentQueue] Flush error:', error);
      });
    }, this.flushInterval);
  }

  /**
   * Stops the queue and flushes state
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.#persist();
  }
}
```

---

## 5. Best Practices: Enqueue Operations

### 5.1 Validate Before Enqueue

```typescript
/**
 * Enqueues with validation
 */
class ValidatedQueue<T> {
  private queue: Array<() => Promise<T>> = [];

  enqueue(fn: () => Promise<T>): void {
    // Validate function
    if (typeof fn !== 'function') {
      throw new TypeError('Task must be a function');
    }

    // Validate task length
    if (fn.length > 0) {
      throw new TypeError('Task must not expect arguments');
    }

    this.queue.push(fn);
  }

  enqueueMany(tasks: Array<() => Promise<T>>): void {
    for (const task of tasks) {
      this.enqueue(task);
    }
  }
}
```

### 5.2 Priority-Based Enqueue

```typescript
/**
 * Priority queue implementation
 */
class PriorityQueue<T> {
  private queue: Array<{ task: () => Promise<T>; priority: number }> = [];

  enqueue(task: () => Promise<T>, priority: number = 0): void {
    this.queue.push({ task, priority });
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): (() => Promise<T>) | undefined {
    return this.queue.shift()?.task;
  }

  get size(): number {
    return this.queue.length;
  }
}
```

### 5.3 Deduplicated Enqueue

```typescript
/**
 * Queue with automatic deduplication
 */
class DeduplicatedQueue<T> {
  private queue: Map<string, () => Promise<T>> = new Map();
  private promises: Map<string, Promise<T>> = new Map();

  async enqueue(key: string, task: () => Promise<T>): Promise<T> {
    // Check if already queued
    if (this.queue.has(key)) {
      return this.queue.get(key)!();
    }

    // Check if already in progress
    if (this.promises.has(key)) {
      return this.promises.get(key)!;
    }

    // Add to queue
    this.queue.set(key, task);

    const promise = task().finally(() => {
      this.queue.delete(key);
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }

  get size(): number {
    return this.queue.size;
  }

  get pending(): number {
    return this.promises.size;
  }
}
```

---

## 6. Best Practices: Processing Next Task

### 6.1 Auto-Starting Queue

```typescript
/**
 * Queue that auto-starts processing
 */
class AutoProcessingQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private processing = false;

  enqueue(task: () => Promise<T>): void {
    this.queue.push(task);
    this.#process();
  }

  async #process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      try {
        await task();
      } catch (error) {
        console.error('[Queue] Task error:', error);
        // Continue processing next task
      }
    }

    this.processing = false;
  }
}
```

### 6.2 Con-Controlled Processing

```typescript
/**
 * Queue with concurrency control
 */
class ConcurrencyControlledQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private running = 0;
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  enqueue(task: () => Promise<T>): void {
    this.queue.push(task);
    this.#process();
  }

  async #process(): Promise<void> {
    if (this.running >= this.maxConcurrency) {
      return;
    }

    const task = this.queue.shift();
    if (!task) {
      return;
    }

    this.running++;

    try {
      await task();
    } catch (error) {
      console.error('[Queue] Task error:', error);
    } finally {
      this.running--;
      this.#process(); // Process next task
    }
  }

  get pending(): number {
    return this.running;
  }

  get queued(): number {
    return this.queue.length;
  }
}
```

### 6.3 Batch Processing

```typescript
/**
 * Queue that processes tasks in batches
 */
class BatchProcessingQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private batchSize: number;
  private batchDelay: number;

  constructor(batchSize: number = 10, batchDelay: number = 100) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  enqueue(task: () => Promise<T>): void {
    this.queue.push(task);

    if (this.queue.length >= this.batchSize) {
      this.#processBatch();
    }
  }

  async #processBatch(): Promise<void> {
    const batch = this.queue.splice(0, this.batchSize);

    await Promise.allSettled(
      batch.map(async task => {
        try {
          await task();
        } catch (error) {
          console.error('[BatchQueue] Task error:', error);
        }
      })
    );

    // Wait before processing next batch
    if (this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, this.batchDelay));
      this.#processBatch();
    }
  }

  async flush(): Promise<void> {
    while (this.queue.length > 0) {
      await this.#processBatch();
    }
  }
}
```

---

## 7. Best Practices: Checking if Task is In Progress

### 7.1 Simple In-Progress Check

```typescript
/**
 * Queue with in-progress tracking
 */
class InProgressTrackingQueue<T> {
  private inProgress = new Set<string>();
  private promises = new Map<string, Promise<T>>();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if already in progress
    if (this.inProgress.has(key)) {
      return this.promises.get(key)!;
    }

    // Mark as in progress
    this.inProgress.add(key);

    const promise = fn().finally(() => {
      this.inProgress.delete(key);
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }

  isInProgress(key: string): boolean {
    return this.inProgress.has(key);
  }

  getInProgressKeys(): string[] {
    return Array.from(this.inProgress);
  }
}
```

### 7.2 Status Tracking

```typescript
/**
 * Task status enum
 */
enum TaskStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

/**
 * Queue with detailed status tracking
 */
class StatusTrackingQueue<T> {
  private status = new Map<string, TaskStatus>();
  private promises = new Map<string, Promise<T>>();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    // Check current status
    const currentStatus = this.status.get(key);
    if (currentStatus === TaskStatus.Running) {
      return this.promises.get(key)!;
    }

    if (currentStatus === TaskStatus.Completed) {
      throw new Error(`Task ${key} already completed`);
    }

    // Set status to running
    this.status.set(key, TaskStatus.Running);

    const promise = fn()
      .then(result => {
        this.status.set(key, TaskStatus.Completed);
        return result;
      })
      .catch(error => {
        this.status.set(key, TaskStatus.Failed);
        throw error;
      })
      .finally(() => {
        this.promises.delete(key);
      });

    this.promises.set(key, promise);
    return promise;
  }

  getStatus(key: string): TaskStatus | undefined {
    return this.status.get(key);
  }

  getAllStatus(): Map<string, TaskStatus> {
    return new Map(this.status);
  }
}
```

### 7.3 Multi-Level Tracking

```typescript
/**
 * Detailed tracking information
 */
interface TaskTracking {
  key: string;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
}

/**
 * Queue with comprehensive tracking
 */
class ComprehensiveTrackingQueue<T> {
  private tracking = new Map<string, TaskTracking>();
  private promises = new Map<string, Promise<T>>();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.tracking.get(key);
    if (existing?.status === TaskStatus.Running) {
      return this.promises.get(key)!;
    }

    // Initialize tracking
    this.tracking.set(key, {
      key,
      status: TaskStatus.Running,
      startedAt: new Date(),
    });

    const promise = fn()
      .then(result => {
        const tracking = this.tracking.get(key)!;
        tracking.status = TaskStatus.Completed;
        tracking.completedAt = new Date();
        return result;
      })
      .catch(error => {
        const tracking = this.tracking.get(key)!;
        tracking.status = TaskStatus.Failed;
        tracking.completedAt = new Date();
        tracking.error = error as Error;
        throw error;
      })
      .finally(() => {
        this.promises.delete(key);
      });

    this.promises.set(key, promise);
    return promise;
  }

  getTracking(key: string): TaskTracking | undefined {
    return this.tracking.get(key);
  }

  getAllTracking(): TaskTracking[] {
    return Array.from(this.tracking.values());
  }
}
```

---

## 8. Best Practices: Waiting for Completion

### 8.1 Wait for Single Task

```typescript
/**
 * Queue with wait-for-task support
 */
class WaitableQueue<T> {
  private promises = new Map<string, Promise<T>>();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    const promise = fn().finally(() => {
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }

  async waitFor(key: string): Promise<T> {
    const promise = this.promises.get(key);
    if (!promise) {
      throw new Error(`No task found for key: ${key}`);
    }
    return promise;
  }

  async tryWaitFor(key: string, timeout: number = 5000): Promise<T | null> {
    const promise = this.promises.get(key);
    if (!promise) {
      return null;
    }

    try {
      return await Promise.race([
        promise,
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);
    } catch {
      return null;
    }
  }
}
```

### 8.2 Wait for All Tasks

```typescript
/**
 * Queue with wait-for-all support
 */
class WaitAllQueue<T> {
  private promises = new Map<string, Promise<T>>();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    const promise = fn().finally(() => {
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }

  async waitForAll(): Promise<void> {
    const promises = Array.from(this.promises.values());
    await Promise.all(promises);
  }

  async waitForAllSettled(): Promise<PromiseSettledResult<T>[]> {
    const promises = Array.from(this.promises.values());
    return Promise.allSettled(promises);
  }

  async waitForAllWithTimeout(timeout: number): Promise<void> {
    const promises = Array.from(this.promises.values());

    await Promise.race([
      Promise.all(promises),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  }
}
```

### 8.3 Event-Based Waiting

```typescript
/**
 * Event-based completion waiting
 */
class EventEmitterQueue<T> extends EventEmitter {
  private promises = new Map<string, Promise<T>>();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    const promise = fn()
      .then(result => {
        this.emit('completed', key, result);
        return result;
      })
      .catch(error => {
        this.emit('failed', key, error);
        throw error;
      })
      .finally(() => {
        this.promises.delete(key);
      });

    this.promises.set(key, promise);
    this.emit('started', key);
    return promise;
  }

  async waitFor(key: string): Promise<T> {
    const promise = this.promises.get(key);
    if (!promise) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.removeListener('completed', onCompleted);
          this.removeListener('failed', onFailed);
          reject(new Error(`No task found for key: ${key}`));
        }, 100);

        const onCompleted = (taskKey: string, result: T) => {
          if (taskKey === key) {
            clearTimeout(timeout);
            resolve(result);
          }
        };

        const onFailed = (taskKey: string, error: Error) => {
          if (taskKey === key) {
            clearTimeout(timeout);
            reject(error);
          }
        };

        this.on('completed', onCompleted);
        this.on('failed', onFailed);
      });
    }

    return promise;
  }
}
```

---

## 9. Best Practices: Caching Results

### 9.1 Simple Result Cache

```typescript
/**
 * Queue with result caching
 */
class CachedQueue<T> {
  private cache = new Map<string, { result: T; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 60000) {
    this.ttl = ttl;
  }

  async execute(
    key: string,
    fn: () => Promise<T>,
    options: { force?: boolean } = {}
  ): Promise<T> {
    // Check cache
    if (!options.force) {
      const cached = this.cache.get(key);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < this.ttl) {
          return cached.result;
        }
        this.cache.delete(key);
      }
    }

    // Execute and cache
    const result = await fn();
    this.cache.set(key, { result, timestamp: Date.now() });
    return result;
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < this.ttl;
  }

  get(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    const age = Date.now() - cached.timestamp;
    if (age >= this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.result;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 9.2 LRU Cache

```typescript
/**
 * LRU cache implementation
 */
class LRUCache<T> {
  private cache = new Map<string, { result: T; timestamp: number }>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, result: T): void {
    // Delete oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldest = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0];
      this.cache.delete(oldest[0]);
    }

    this.cache.set(key, { result, timestamp: Date.now() });
  }

  get(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    // Update access time
    cached.timestamp = Date.now();
    return cached.result;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Queue with LRU caching
 */
class LRUCachedQueue<T> {
  private cache = new LRUCache<T>();

  async execute(
    key: string,
    fn: () => Promise<T>,
    options: { force?: boolean } = {}
  ): Promise<T> {
    if (!options.force && this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const result = await fn();
    this.cache.set(key, result);
    return result;
  }
}
```

### 9.3 Persistent Cache

```typescript
/**
 * Persistent cache with disk storage
 */
class PersistentCache<T> {
  private cache = new Map<string, { result: T; timestamp: number }>();
  private cachePath: string;
  private autoSave: boolean;

  constructor(cachePath: string, options: { autoSave?: boolean } = {}) {
    this.cachePath = cachePath;
    this.autoSave = options.autoSave ?? true;
    this.#load();
  }

  async #load(): Promise<void> {
    try {
      const data = await fs.readFile(this.cachePath, 'utf-8');
      const entries = JSON.parse(data);
      this.cache = new Map(entries);
    } catch {
      // No existing cache
    }
  }

  async #save(): Promise<void> {
    const data = JSON.stringify(Array.from(this.cache.entries()));
    await fs.writeFile(this.cachePath, data);
  }

  set(key: string, result: T): void {
    this.cache.set(key, { result, timestamp: Date.now() });

    if (this.autoSave) {
      this.#save().catch(console.error);
    }
  }

  get(key: string): T | undefined {
    return this.cache.get(key)?.result;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async save(): Promise<void> {
    await this.#save();
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

## 10. Common Pitfalls to Avoid

### 10.1 Memory Leaks from Unbounded Queues

**Problem:**

```typescript
// BAD: Unbounded queue grows indefinitely
class BadQueue {
  private queue: Array<() => Promise<void>> = [];

  add(task: () => Promise<void>): void {
    this.queue.push(task); // Never clears old tasks
  }
}
```

**Solution:**

```typescript
// GOOD: Bounded queue with max size
class GoodQueue {
  private queue: Array<() => Promise<void>> = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  add(task: () => Promise<void>): void {
    if (this.queue.length >= this.maxSize) {
      throw new Error('Queue full');
    }
    this.queue.push(task);
  }
}
```

### 10.2 Lost Promises on Errors

**Problem:**

```typescript
// BAD: Promise not tracked on error
async executeBad(key: string, fn: () => Promise<void>): Promise<void> {
  const promise = fn();
  this.promises.set(key, promise);
  // If promise rejects, it's removed from map but error is lost
  return promise;
}
```

**Solution:**

```typescript
// GOOD: Error handling with cleanup
async executeGood(key: string, fn: () => Promise<void>): Promise<void> {
  const promise = fn()
    .catch(error => {
      console.error(`Task ${key} failed:`, error);
      throw error; // Re-throw for caller
    })
    .finally(() => {
      this.promises.delete(key);
    });

  this.promises.set(key, promise);
  return promise;
}
```

### 10.3 Race Conditions in Status Checks

**Problem:**

```typescript
// BAD: Race condition between check and execute
if (!this.isInProgress(key)) {
  // Another task might start here
  await this.execute(key, fn);
}
```

**Solution:**

```typescript
// GOOD: Atomic check-and-set
async executeOrWait<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = this.promises.get(key);
  if (existing) {
    return existing;
  }

  const promise = fn().finally(() => {
    this.promises.delete(key);
  });

  this.promises.set(key, promise);
  return promise;
}
```

### 10.4 Unhandled Promise Rejections

**Problem:**

```typescript
// BAD: Unhandled rejections
class BadQueue {
  process(): void {
    const task = this.queue.shift();
    if (task) {
      task(); // Promise not awaited or caught
    }
  }
}
```

**Solution:**

```typescript
// GOOD: Always handle rejections
class GoodQueue {
  async process(): Promise<void> {
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error('[Queue] Task error:', error);
      }
    }
  }
}
```

### 10.5 Blocking the Event Loop

**Problem:**

```typescript
// BAD: Synchronous operations block event loop
function processQueue(): void {
  while (this.queue.length > 0) {
    const task = this.queue.shift();
    fs.readFileSync(task.path); // Blocks!
  }
}
```

**Solution:**

```typescript
// GOOD: Use async operations
async function processQueue(): Promise<void> {
  while (this.queue.length > 0) {
    const task = this.queue.shift();
    await fs.readFile(task.path); // Non-blocking
  }
}
```

### 10.6 Not Cleaning Up Resources

**Problem:**

```typescript
// BAD: No cleanup on shutdown
class BadQueue {
  start(): void {
    setInterval(() => this.process(), 1000); // Never cleared
  }
}
```

**Solution:**

```typescript
// GOOD: Proper cleanup
class GoodQueue {
  private timer?: NodeJS.Timeout;

  start(): void {
    this.timer = setInterval(() => this.process(), 1000);
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.onIdle();
  }
}
```

---

## 11. Recommended Libraries

### 11.1 p-limit

**URL:** https://github.com/sindresorhus/p-limit

Simple concurrency control for promises.

**Installation:**

```bash
npm install p-limit
```

**Usage:**

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent

const tasks = [
  limit(() => fetch('https://api.example.com/1')),
  limit(() => fetch('https://api.example.com/2')),
  limit(() => fetch('https://api.example.com/3')),
];

await Promise.all(tasks);
```

### 11.2 p-queue

**URL:** https://github.com/sindresorhus/p-queue

Promise-based queue with concurrency control, priorities, and pause/resume.

**Installation:**

```bash
npm install p-queue
```

**Usage:**

```typescript
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 5,
  autoStart: true,
});

queue.add(() => fetch('https://api.example.com/1'), { priority: 1 });
queue.add(() => fetch('https://api.example.com/2'), { priority: 2 });

await queue.onIdle();
```

### 11.3 bottleneck

**URL:** https://github.com/SGrondin/bottleneck

Comprehensive rate limiter with clustering support.

**Installation:**

```bash
npm install bottleneck
```

**Usage:**

```typescript
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200, // ms between requests
});

await limiter.schedule(() => fetch('https://api.example.com'));
```

### 11.4 async

**URL:** https://caolan.github.io/async/

Traditional async utilities with promise support.

**Installation:**

```bash
npm install async
```

**Usage:**

```typescript
import { queue } from 'async';

const q = queue(async task => {
  await processTask(task);
}, 5);

q.push([task1, task2, task3]);
```

### 11.5 bull

**URL:** https://docs.bullmq.io/

Redis-backed queue for distributed systems.

**Installation:**

```bash
npm install bull
```

**Usage:**

```typescript
import Queue from 'bull';

const queue = new Queue('my-queue', 'redis://localhost:6379');

queue.process(async job => {
  return await processJob(job.data);
});

await queue.add({ url: 'https://example.com' });
```

---

## 12. Code Examples

### 12.1 Complete Research Queue Implementation

```typescript
/**
 * Complete research queue with all best practices
 */
interface ResearchTask<T> {
  id: string;
  query: string;
  fn: () => Promise<T>;
  priority: number;
  retries: number;
  maxRetries: number;
}

class CompleteResearchQueue {
  private queue: ResearchTask<unknown>[] = [];
  private inProgress = new Map<string, Promise<unknown>>();
  private results = new Map<string, { result: unknown; timestamp: number }>();
  private errors = new Map<string, Error>();
  private maxConcurrency: number;
  private cacheTTL: number;
  private isPaused = false;
  private runningCount = 0;

  constructor(
    maxConcurrency: number = 5,
    cacheTTL: number = 3600000 // 1 hour
  ) {
    this.maxConcurrency = maxConcurrency;
    this.cacheTTL = cacheTTL;
  }

  /**
   * Enqueues research task
   */
  async research<T>(
    id: string,
    query: string,
    fn: () => Promise<T>,
    options: {
      priority?: number;
      maxRetries?: number;
      force?: boolean;
    } = {}
  ): Promise<T> {
    // Check cache
    if (!options.force) {
      const cached = this.results.get(id);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < this.cacheTTL) {
          return cached.result as T;
        }
        this.results.delete(id);
      }
    }

    // Check if in progress
    if (this.inProgress.has(id)) {
      return this.inProgress.get(id) as Promise<T>;
    }

    // Create task
    const task: ResearchTask<T> = {
      id,
      query,
      fn,
      priority: options.priority ?? 0,
      retries: 0,
      maxRetries: options.maxRetries ?? 3,
    };

    this.queue.push(task);
    this.queue.sort((a, b) => a.priority - b.priority);

    const promise = new Promise<T>((resolve, reject) => {
      const wrappedFn = async (): Promise<void> => {
        try {
          const result = await task.fn();
          this.results.set(id, { result, timestamp: Date.now() });
          resolve(result);
        } catch (error) {
          // Retry logic
          if (task.retries < task.maxRetries) {
            task.retries++;
            this.queue.push(task);
            this.queue.sort((a, b) => a.priority - b.priority);
            this.#processNext();
            return;
          }

          this.errors.set(id, error as Error);
          reject(error);
        } finally {
          this.inProgress.delete(id);
          this.runningCount--;
          this.#processNext();
        }
      };

      this.inProgress.set(id, wrappedFn());
      this.runningCount++;
      this.#processNext();
    });

    return promise;
  }

  /**
   * Processes next task if capacity available
   */
  #processNext(): void {
    if (this.isPaused) {
      return;
    }

    if (this.runningCount >= this.maxConcurrency) {
      return;
    }

    const task = this.queue.shift();
    if (!task) {
      return;
    }

    const promise = this.inProgress.get(task.id);
    if (promise) {
      promise.catch(() => {
        // Error already handled
      });
    }
  }

  /**
   * Checks if research is in progress
   */
  isInProgress(id: string): boolean {
    return this.inProgress.has(id);
  }

  /**
   * Checks if result is cached
   */
  hasResult(id: string): boolean {
    const cached = this.results.get(id);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < this.cacheTTL;
  }

  /**
   * Gets cached result
   */
  getResult<T>(id: string): T | undefined {
    const cached = this.results.get(id);
    if (!cached) return undefined;

    const age = Date.now() - cached.timestamp;
    if (age >= this.cacheTTL) {
      this.results.delete(id);
      return undefined;
    }

    return cached.result as T;
  }

  /**
   * Waits for specific research to complete
   */
  async waitFor<T>(id: string): Promise<T> {
    const promise = this.inProgress.get(id);
    if (!promise) {
      throw new Error(`No in-progress research for: ${id}`);
    }
    return promise as Promise<T>;
  }

  /**
   * Pauses queue processing
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resumes queue processing
   */
  resume(): void {
    this.isPaused = false;
    this.#processNext();
  }

  /**
   * Clears cache
   */
  clearCache(): void {
    this.results.clear();
  }

  /**
   * Gets queue stats
   */
  getStats(): {
    queued: number;
    inProgress: number;
    cached: number;
    errors: number;
    running: number;
  } {
    return {
      queued: this.queue.length,
      inProgress: this.inProgress.size,
      cached: this.results.size,
      errors: this.errors.size,
      running: this.runningCount,
    };
  }

  /**
   * Waits for all research to complete
   */
  async onIdle(): Promise<void> {
    while (
      this.queue.length > 0 ||
      this.inProgress.size > 0 ||
      this.runningCount > 0
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### 12.2 Integration Example with TaskOrchestrator

```typescript
/**
 * Integrating research queue with TaskOrchestrator
 */
import { TaskOrchestrator } from './core/task-orchestrator.js';

class ResearchEnabledTaskOrchestrator extends TaskOrchestrator {
  private researchQueue: CompleteResearchQueue;

  constructor(sessionManager: SessionManager, scope?: Scope) {
    super(sessionManager, scope);
    this.researchQueue = new CompleteResearchQueue(
      5, // max concurrent research tasks
      3600000 // 1 hour cache
    );
  }

  /**
   * Executes subtask with research support
   */
  async executeSubtask(subtask: Subtask): Promise<void> {
    // Check if subtask needs research
    if (subtask.status === 'Researching') {
      await this.#performResearch(subtask);
    }

    // Execute implementation
    await super.executeSubtask(subtask);
  }

  /**
   * Performs research for subtask
   */
  async #performResearch(subtask: Subtask): Promise<void> {
    const researchId = `research:${subtask.id}`;

    // Check if already researched
    if (this.researchQueue.hasResult(researchId)) {
      const result = this.researchQueue.getResult(researchId);
      console.log(`[Research] Using cached result for ${subtask.id}`);
      return;
    }

    // Perform research
    await this.researchQueue.research(
      researchId,
      subtask.title,
      async () => {
        console.log(`[Research] Starting research for ${subtask.id}`);
        // Actual research logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[Research] Completed research for ${subtask.id}`);
        return { researched: true };
      },
      { priority: 1 }
    );
  }

  /**
   * Waits for all research to complete
   */
  async waitForResearch(): Promise<void> {
    await this.researchQueue.onIdle();
    console.log('[Research] All research completed');
  }

  /**
   * Gets research stats
   */
  getResearchStats(): {
    queued: number;
    inProgress: number;
    cached: number;
    errors: number;
    running: number;
  } {
    return this.researchQueue.getStats();
  }
}
```

---

## 13. References and Resources

### 13.1 Official Documentation

**TypeScript:**

- [TypeScript Handbook - Async/Await](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html#awaited-type)
- [TypeScript Promise Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#promise-based-signatures)

**Node.js:**

- [Node.js Async Context Tracking](https://nodejs.org/api/async_context.html)
- [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)

**JavaScript:**

- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: Async Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

### 13.2 Library Documentation

**p-limit:**

- GitHub: https://github.com/sindresorhus/p-limit
- NPM: https://www.npmjs.com/package/p-limit
- API: Concurrency limiting for promises

**p-queue:**

- GitHub: https://github.com/sindresorhus/p-queue
- NPM: https://www.npmjs.com/package/p-queue
- API: Promise queue with concurrency, priorities, pause/resume

**bottleneck:**

- GitHub: https://github.com/SGrondin/bottleneck
- NPM: https://www.npmjs.com/package/bottleneck
- API: Comprehensive rate limiting

**async:**

- Website: https://caolan.github.io/async/
- NPM: https://www.npmjs.com/package/async
- API: Traditional async utilities

**bull:**

- Docs: https://docs.bullmq.io/
- NPM: https://www.npmjs.com/package/bull
- API: Redis-backed distributed queue

### 13.3 Best Practice Articles

**General Patterns:**

- [Node.js Async Patterns](https://nodejs.dev/en/learn/asynchronous-workflow-and-control-flow-in-nodejs/)
- [JavaScript Promise Patterns](https://javascript.info/async)
- [TypeScript Promise Patterns](https://basarat.gitbook.io/typescript/type-system/promise)

**Concurrency Control:**

- [Concurrency in Node.js](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [Promise Concurrency Patterns](https://zellwk.com/blog/concurrent-promises/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

**Queue Implementation:**

- [Implementing a Task Queue](https://blog.logrocket.com/implementing-task-queue-node-js-rabbitmq/)
- [Promise Queue Patterns](https://www.petecorey.com/blog/2017/04/07/promises-are-not-neutral-on-branching-and-joining.html)
- [Async Queue Implementation](https://github.com/lukechilds/promise-queue)

### 13.4 Related Research Documents

**In Project:**

- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P3M2T1S3/research/async_error_handling_research.md`
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/typescript_5.2_plus_research.md`

**Code Locations:**

- Task Orchestrator: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- Session Manager: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
- Models: `/home/dustin/projects/hacky-hack/src/core/models.ts`

---

## Conclusion

This research document provides a comprehensive foundation for implementing async task queues in TypeScript/Node.js. The key insights are:

1. **Use Promise-based patterns** for clean async flow control
2. **Implement concurrency limits** to prevent resource exhaustion
3. **Track in-flight operations** with Map-based promise tracking
4. **Cache results** to avoid duplicate work
5. **Handle errors properly** with try/catch and cleanup
6. **Use established libraries** (p-limit, p-queue) instead of reinventing
7. **Follow best practices** to avoid common pitfalls
8. **Integrate with existing systems** like TaskOrchestrator

The patterns presented here balance simplicity, performance, and reliability while maintaining type safety and immutability principles established in the codebase.

---

**Document Status:** Complete
**Next Action:** Implement research queue pattern in TaskOrchestrator
**Priority:** High - enables background research processing
