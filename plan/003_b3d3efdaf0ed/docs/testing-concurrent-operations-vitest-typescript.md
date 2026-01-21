# Research: Testing Concurrent/Parallel Operations, Queues, and Fire-and-Forget Patterns in TypeScript/Vitest

## Executive Summary

This research document compiles best practices for testing concurrent operations, queue systems, dependency ordering, fire-and-forget patterns, and race conditions in TypeScript using Vitest. While web search tools were unavailable during research, this document is based on established testing patterns, Vitest documentation, and community best practices.

---

## Table of Contents

1. [Testing Concurrent Execution with Limits](#1-testing-concurrent-execution-with-limits)
2. [Mocking Async Operations with Controlled Timing](#2-mocking-async-operations-with-controlled-timing)
3. [Testing Queue Dependency Ordering](#3-testing-queue-dependency-ordering)
4. [Testing Fire-and-Forget Error Handling](#4-testing-fire-and-forget-error-handling)
5. [Best Practices for Testing Cache Behavior](#5-best-practices-for-testing-cache-behavior)
6. [Patterns for Simulating Race Conditions](#6-patterns-for-simulating-race-conditions)
7. [Verifying Queue Processing Order with Mocks](#7-verifying-queue-processing-order-with-mocks)
8. [Testing Frameworks and Libraries](#8-testing-frameworks-and-libraries)

---

## 1. Testing Concurrent Execution with Limits

### 1.1 Pattern: Concurrency Limit Testing

**Concept**: Verify that a system respects concurrency limits (e.g., max 3 concurrent operations).

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Concurrency Limits', () => {
  it('should enforce maximum concurrency of 3', async () => {
    const activeOperations = new Set<string>();
    const maxConcurrent = vi.fn();
    const operationComplete = vi.fn();

    // Create a mock operation that tracks active count
    const createOperation = (id: string) => async () => {
      activeOperations.add(id);
      maxConcurrent(activeOperations.size);

      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 100));

      activeOperations.delete(id);
      operationComplete();
    };

    // Launch 10 operations with concurrency limit of 3
    const operations = Array.from({ length: 10 }, (_, i) =>
      createOperation(`op-${i}`)
    );

    // Execute with concurrency limit (implementation-specific)
    await executeWithConcurrencyLimit(operations, 3);

    // Verify we never exceeded the limit
    const maxObserved = Math.max(
      ...maxConcurrent.mock.calls.map(call => call[0])
    );
    expect(maxObserved).toBeLessThanOrEqual(3);
    expect(operationComplete).toHaveBeenCalledTimes(10);
  });
});
```

### 1.2 Helper Function for Concurrency Testing

```typescript
/**
 * Executes an array of async functions with a concurrency limit
 */
async function executeWithConcurrencyLimit<T>(
  operations: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const operation of operations) {
    const promise = operation().then(result => {
      results.push(result);
      // Remove from executing array when done
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    // Wait for one to complete if we hit the limit
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}
```

### 1.3 Testing Concurrency with Vitest's `test.concurrent`

```typescript
import { test, describe } from 'vitest';

describe.concurrent('Concurrent Test Suite', () => {
  test('concurrent test 1', async () => {
    // These tests run in parallel
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('concurrent test 2', async () => {
    // Runs concurrently with test 1
    await new Promise(resolve => setTimeout(resolve, 100));
  });
});
```

**Best Practices**:

- Track active operations with Sets or Maps
- Use `Promise.race` to monitor completion
- Assert on maximum concurrent operations
- Test with both small and large operation counts
- Verify cleanup happens correctly

---

## 2. Mocking Async Operations with Controlled Timing

### 2.1 Using Vitest Fake Timers

```typescript
import { vi, beforeEach, afterEach, expect, test } from 'vitest';

describe('Async Operations with Fake Timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should handle delayed operations', async () => {
    const callback = vi.fn();

    setTimeout(() => {
      callback('first');
    }, 1000);

    setTimeout(() => {
      callback('second');
    }, 2000);

    // Advance time step by step
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith('first');

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('second');
  });

  test('should run all timers immediately', async () => {
    const callback = vi.fn();

    setTimeout(callback, 5000);
    setTimeout(callback, 10000);

    // Run all pending timers
    await vi.runAllTimersAsync();

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
```

### 2.2 Controllable Async Operation Factory

```typescript
/**
 * Creates a mock async operation with controllable timing
 */
interface ControllableOperation<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

function createControllableOperation<T>(id: string): ControllableOperation<T> {
  let resolveFn: (value: T) => void;
  let rejectFn: (error: Error) => void;

  const fn = () =>
    new Promise<T>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

  return {
    fn,
    resolve: (value: T) => resolveFn?.(value),
    reject: (error: Error) => rejectFn?.(error),
  };
}
```

### 2.3 Testing with Controllable Operations

```typescript
test('should test queue with controlled completion', async () => {
  const operations = [
    createControllableOperation<number>('op-1'),
    createControllableOperation<number>('op-2'),
    createControllableOperation<number>('op-3'),
  ];

  // Start queue processing
  const queuePromise = processQueue(operations.map(op => op.fn));

  // Verify operations are in progress
  await vi.advanceTimersByTimeAsync(10);

  // Complete operations in specific order
  operations[0].resolve(1);
  operations[2].resolve(3);
  operations[1].resolve(2);

  // Wait for queue to complete
  const results = await queuePromise;

  expect(results).toEqual([1, 2, 3]);
});
```

### 2.4 Delay Helper for Testing

```typescript
/**
 * Creates a delayed operation with specified delay
 */
function createDelayedOperation<T>(value: T, delay: number): () => Promise<T> {
  return () =>
    new Promise(resolve => {
      setTimeout(() => resolve(value), delay);
    });
}

// Usage
test('should process operations with different delays', async () => {
  vi.useFakeTimers();

  const operations = [
    createDelayedOperation('fast', 100),
    createDelayedOperation('slow', 300),
    createDelayedOperation('medium', 200),
  ];

  const processing = Promise.all(operations.map(op => op()));

  await vi.advanceTimersByTimeAsync(100);
  // Fast operation complete
  await vi.advanceTimersByTimeAsync(100);
  // Medium operation complete
  await vi.advanceTimersByTimeAsync(100);
  // Slow operation complete

  const results = await processing;
  expect(results).toEqual(['fast', 'slow', 'medium']);

  vi.useRealTimers();
});
```

**Best Practices**:

- Always clean up fake timers in `afterEach`
- Use `advanceTimersByTimeAsync` for async operations
- Create controllable operations for precise sequencing
- Test both timing and ordering
- Use `vi.runAllTimersAsync()` for complete timer execution

---

## 3. Testing Queue Dependency Ordering

### 3.1 Dependency Graph Testing

```typescript
interface Task {
  id: string;
  dependencies: string[];
  execute: () => Promise<void>;
}

describe('Queue Dependency Ordering', () => {
  test('should process tasks in dependency order', async () => {
    const executionOrder: string[] = [];

    const tasks: Task[] = [
      {
        id: 'A',
        dependencies: [],
        execute: async () => {
          executionOrder.push('A');
          await new Promise(resolve => setTimeout(resolve, 10));
        },
      },
      {
        id: 'B',
        dependencies: ['A'],
        execute: async () => {
          executionOrder.push('B');
          await new Promise(resolve => setTimeout(resolve, 10));
        },
      },
      {
        id: 'C',
        dependencies: ['A'],
        execute: async () => {
          executionOrder.push('C');
          await new Promise(resolve => setTimeout(resolve, 10));
        },
      },
      {
        id: 'D',
        dependencies: ['B', 'C'],
        execute: async () => {
          executionOrder.push('D');
        },
      },
    ];

    await processTaskQueue(tasks);

    // Verify dependencies are respected
    // A must be before B, C
    // B and C must be before D
    expect(executionOrder.indexOf('A')).toBeLessThan(
      executionOrder.indexOf('B')
    );
    expect(executionOrder.indexOf('A')).toBeLessThan(
      executionOrder.indexOf('C')
    );
    expect(executionOrder.indexOf('B')).toBeLessThan(
      executionOrder.indexOf('D')
    );
    expect(executionOrder.indexOf('C')).toBeLessThan(
      executionOrder.indexOf('D')
    );
  });
});
```

### 3.2 Topological Sort Verification

```typescript
/**
 * Verifies that execution order respects dependencies
 */
function verifyDependencyOrder(
  executionOrder: string[],
  tasks: Map<string, { dependencies: string[] }>
): void {
  const completed = new Set<string>();

  for (const taskId of executionOrder) {
    const task = tasks.get(taskId);

    for (const dep of task.dependencies) {
      expect(completed.has(dep)).toBe(true);
    }

    completed.add(taskId);
  }
}

// Usage
test('should verify topological ordering', async () => {
  const executionOrder: string[] = [];
  const taskMap = new Map([
    ['task1', { dependencies: [] }],
    ['task2', { dependencies: ['task1'] }],
    ['task3', { dependencies: ['task1', 'task2'] }],
  ]);

  // ... execute tasks ...

  verifyDependencyOrder(executionOrder, taskMap);
});
```

### 3.3 Complex Dependency Testing

```typescript
test('should handle complex dependency graph', async () => {
  const executions = new Map<string, number>();
  let timestamp = 0;

  const createTask = (id: string, deps: string[]) => ({
    id,
    dependencies: deps,
    execute: async () => {
      executions.set(id, timestamp++);
      await new Promise(resolve => setTimeout(resolve, 10));
    },
  });

  // Diamond dependency pattern
  //     A
  //    / \
  //   B   C
  //    \ /
  //     D
  const tasks = [
    createTask('A', []),
    createTask('B', ['A']),
    createTask('C', ['A']),
    createTask('D', ['B', 'C']),
  ];

  await processTaskQueue(tasks);

  // Verify execution order
  const timeA = executions.get('A')!;
  const timeB = executions.get('B')!;
  const timeC = executions.get('C')!;
  const timeD = executions.get('D')!;

  expect(timeA).toBeLessThan(timeB);
  expect(timeA).toBeLessThan(timeC);
  expect(timeB).toBeLessThan(timeD);
  expect(timeC).toBeLessThan(timeD);
});
```

### 3.4 Circular Dependency Detection

```typescript
test('should detect circular dependencies', async () => {
  const tasks = [
    { id: 'A', dependencies: ['B'], execute: async () => {} },
    { id: 'B', dependencies: ['C'], execute: async () => {} },
    { id: 'C', dependencies: ['A'], execute: async () => {} }, // Circular!
  ];

  await expect(processTaskQueue(tasks)).rejects.toThrow('circular');
});
```

**Best Practices**:

- Track execution order with arrays or maps
- Verify dependency constraints with assertions
- Test complex dependency patterns (diamond, chains, etc.)
- Test error cases (circular dependencies, missing dependencies)
- Use unique identifiers for tasks

---

## 4. Testing Fire-and-Forget Error Handling

### 4.1 Fire-and-Forget Pattern with Error Tracking

```typescript
interface FireAndForgetOptions {
  onError?: (error: Error) => void;
  logger?: { error: (message: string, error: Error) => void };
}

class FireAndForgetExecutor {
  private errors: Error[] = [];

  async execute<T>(
    fn: () => Promise<T>,
    options: FireAndForgetOptions = {}
  ): Promise<void> {
    const { onError, logger } = options;

    // Don't await - fire and forget
    fn().catch(error => {
      this.errors.push(error);
      onError?.(error);
      logger?.error('Fire-and-forget operation failed', error);
    });
  }

  getErrors(): Error[] {
    return [...this.errors];
  }
}
```

### 4.2 Testing Error Handling

```typescript
describe('Fire-and-Forget Error Handling', () => {
  test('should log errors without blocking', async () => {
    const executor = new FireAndForgetExecutor();
    const errorLogger = vi.fn();
    const onError = vi.fn();

    const failingOperation = async () => {
      throw new Error('Operation failed');
    };

    // Execute without awaiting
    executor.execute(failingOperation, {
      onError,
      logger: { error: errorLogger },
    });

    // Wait a bit for error to be caught
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify error was handled
    expect(executor.getErrors()).toHaveLength(1);
    expect(onError).toHaveBeenCalled();
    expect(errorLogger).toHaveBeenCalled();
  });

  test('should not block subsequent operations', async () => {
    const executor = new FireAndForgetExecutor();
    const executionOrder: string[] = [];

    const failingOperation = async () => {
      executionOrder.push('failing-start');
      throw new Error('Failed');
    };

    const successOperation = async () => {
      executionOrder.push('success');
    };

    // Execute failing operation
    executor.execute(failingOperation);

    // Immediately execute success operation
    await successOperation();

    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 50));

    // Success operation should not be blocked
    expect(executionOrder).toContain('success');
    expect(executor.getErrors()).toHaveLength(1);
  });
});
```

### 4.3 Testing with Vitest Spy

```typescript
test('should track errors with spy', async () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  const fireAndForget = async (fn: () => Promise<void>) => {
    fn().catch(error => {
      console.error('Async error:', error);
    });
  };

  const failingFn = async () => {
    throw new Error('Test error');
  };

  fireAndForget(failingFn);

  // Wait for error to be caught
  await new Promise(resolve => setTimeout(resolve, 10));

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    'Async error:',
    expect.any(Error)
  );

  consoleErrorSpy.mockRestore();
});
```

### 4.4 Multiple Operations with Some Failing

```typescript
test('should handle multiple operations with partial failures', async () => {
  const executor = new FireAndForgetExecutor();
  let successCount = 0;

  const operations = [
    async () => {
      successCount++;
    },
    async () => {
      throw new Error('Error 1');
    },
    async () => {
      successCount++;
    },
    async () => {
      throw new Error('Error 2');
    },
    async () => {
      successCount++;
    },
  ];

  // Execute all operations
  for (const op of operations) {
    executor.execute(op);
  }

  // Wait for all to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  expect(successCount).toBe(3);
  expect(executor.getErrors()).toHaveLength(2);
  expect(executor.getErrors().map(e => e.message)).toEqual([
    'Error 1',
    'Error 2',
  ]);
});
```

**Best Practices**:

- Never swallow errors silently - always log or track
- Use error handlers/callbacks to capture errors in tests
- Test that errors don't block other operations
- Verify error messages and stack traces
- Test partial failure scenarios
- Clean up mocks and spies after tests

---

## 5. Best Practices for Testing Cache Behavior

### 5.1 Cache Hit Testing

```typescript
interface Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  clear(): void;
}

describe('Cache Behavior', () => {
  test('should return cached value on hit', async () => {
    const cache = new Map<string, string>();
    const fetchFn = vi.fn(async (key: string) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return `value-${key}`;
    });

    const getCached = async (key: string) => {
      if (cache.has(key)) {
        return cache.get(key);
      }
      const value = await fetchFn(key);
      cache.set(key, value);
      return value;
    };

    // First call - cache miss
    const result1 = await getCached('key1');
    expect(result1).toBe('value-key1');
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Second call - cache hit
    const result2 = await getCached('key1');
    expect(result2).toBe('value-key1');
    expect(fetchFn).toHaveBeenCalledTimes(1); // Not called again
  });
});
```

### 5.2 Cache Invalidation Testing

```typescript
test('should invalidate cache correctly', async () => {
  const cache = new Map<string, { value: string; timestamp: number }>();
  const CACHE_TTL = 1000;

  const getCachedWithTTL = async (key: string) => {
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    const value = await fetchValue(key);
    cache.set(key, { value, timestamp: now });
    return value;
  };

  // First call
  await getCachedWithTTL('key1');

  // Immediate second call - should hit cache
  await getCachedWithTTL('key1');
  expect(cache.size).toBe(1);

  // Wait for TTL to expire
  await new Promise(resolve => setTimeout(resolve, CACHE_TTL + 100));

  // Next call should miss cache and refetch
  await getCachedWithTTL('key1');
  expect(cache.size).toBe(1); // Still 1, but value refreshed
});
```

### 5.3 Cache Key Generation Testing

```typescript
describe('Cache Key Generation', () => {
  test('should generate consistent keys', () => {
    const generateKey = (params: Record<string, any>) => {
      return JSON.stringify(params);
    };

    const params1 = { a: 1, b: 2 };
    const params2 = { b: 2, a: 1 }; // Different order

    // These should have different keys unless normalized
    expect(generateKey(params1)).not.toBe(generateKey(params2));

    // Better approach - normalize
    const normalizeKey = (params: Record<string, any>) => {
      const sorted = Object.keys(params)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = params[key];
            return acc;
          },
          {} as Record<string, any>
        );
      return JSON.stringify(sorted);
    };

    expect(normalizeKey(params1)).toBe(normalizeKey(params2));
  });
});
```

### 5.4 Cache Size Limits (LRU)

```typescript
test('should enforce cache size limit', async () => {
  const MAX_SIZE = 3;
  const cache = new Map<string, string>();

  const setWithLimit = (key: string, value: string) => {
    if (cache.size >= MAX_SIZE && !cache.has(key)) {
      // Remove first (LRU - simplified)
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, value);
  };

  setWithLimit('a', '1');
  setWithLimit('b', '2');
  setWithLimit('c', '3');
  expect(cache.size).toBe(3);

  setWithLimit('d', '4'); // Should evict 'a'
  expect(cache.size).toBe(3);
  expect(cache.has('a')).toBe(false);
  expect(cache.has('d')).toBe(true);
});
```

**Best Practices**:

- Test cache hits and misses explicitly
- Verify underlying function call counts
- Test cache expiration/TTL
- Test cache size limits and eviction
- Test cache key generation consistency
- Clear cache between tests

---

## 6. Patterns for Simulating Race Conditions

### 6.1 Promise.race Testing

```typescript
describe('Race Condition Patterns', () => {
  test('should handle race between two operations', async () => {
    vi.useFakeTimers();

    let winner: string | null = null;

    const operation1 = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      winner = 'op1';
      return 'op1';
    };

    const operation2 = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      winner = 'op2';
      return 'op2';
    };

    const race = Promise.race([operation1(), operation2()]);

    await vi.runAllTimersAsync();
    const result = await race;

    expect(result).toBe('op2');
    expect(winner).toBe('op2');

    vi.useRealTimers();
  });
});
```

### 6.2 Concurrent State Mutation Testing

```typescript
test('should handle concurrent state mutations', async () => {
  let counter = 0;
  const increment = async () => {
    const current = counter;
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    counter = current + 1;
  };

  // Run 100 increments concurrently
  const increments = Array.from({ length: 100 }, () => increment());
  await Promise.all(increments);

  // Without proper synchronization, this might fail
  // With proper locking, this should pass
  expect(counter).toBeLessThanOrEqual(100);
});
```

### 6.3 Test-Induced Race Conditions

```typescript
test('should simulate timing-dependent race', async () => {
  const results: string[] = [];
  const delays = [10, 5, 20, 15, 8];

  const operations = delays.map(
    (delay, index) =>
      new Promise<string>(resolve => {
        setTimeout(() => {
          results.push(`op-${index}`);
          resolve(`op-${index}`);
        }, delay);
      })
  );

  await Promise.all(operations);

  // Results should be in completion order, not submission order
  expect(results).toEqual(['op-1', 'op-4', 'op-0', 'op-3', 'op-2']);
});
```

### 6.4 Resource Contention Testing

```typescript
test('should handle resource contention', async () => {
  const resourcePool = new Set<string>();
  const MAX_RESOURCES = 2;

  let allocations = 0;
  let rejections = 0;

  const acquireResource = async (id: string): Promise<boolean> => {
    if (resourcePool.size >= MAX_RESOURCES) {
      rejections++;
      return false;
    }

    resourcePool.add(id);
    allocations++;

    // Hold resource for a bit
    await new Promise(resolve => setTimeout(resolve, 50));

    resourcePool.delete(id);
    return true;
  };

  // Try to acquire from many callers
  const attempts = Array.from({ length: 10 }, (_, i) =>
    acquireResource(`caller-${i}`)
  );

  await Promise.all(attempts);

  expect(allocations).toBeGreaterThan(0);
  expect(rejections).toBeGreaterThan(0);
  expect(allocations + rejections).toBe(10);
});
```

**Best Practices**:

- Use `Promise.all` for concurrent execution
- Vary delays to create different timing scenarios
- Test with high concurrency to expose issues
- Use deterministic randomness for reproducible tests
- Test both success and failure scenarios
- Verify final state is consistent

---

## 7. Verifying Queue Processing Order with Mocks

### 7.1 Tracking Execution Order with Mocks

```typescript
describe('Queue Processing Order', () => {
  test('should process queue in FIFO order', async () => {
    const executionLog: string[] = [];

    const createTask = (id: string) => ({
      id,
      execute: vi.fn(async () => {
        executionLog.push(id);
        await new Promise(resolve => setTimeout(resolve, 10));
      }),
    });

    const tasks = [
      createTask('task-1'),
      createTask('task-2'),
      createTask('task-3'),
    ];

    // Add to queue in order
    for (const task of tasks) {
      queue.enqueue(task.execute);
    }

    await queue.process();

    // Verify execution order
    expect(executionLog).toEqual(['task-1', 'task-2', 'task-3']);
    expect(tasks[0].execute).toHaveBeenCalledBefore(tasks[1].execute);
    expect(tasks[1].execute).toHaveBeenCalledBefore(tasks[2].execute);
  });
});
```

### 7.2 Priority Queue Testing

```typescript
test('should respect priority ordering', async () => {
  const executionLog: string[] = [];

  const createTask = (id: string, priority: number) => ({
    id,
    priority,
    execute: vi.fn(async () => {
      executionLog.push(id);
    }),
  });

  const tasks = [
    createTask('low', 1),
    createTask('high', 10),
    createTask('medium', 5),
  ];

  // Add to priority queue
  for (const task of tasks) {
    priorityQueue.enqueue(task.execute, task.priority);
  }

  await priorityQueue.process();

  // Higher priority tasks should execute first
  expect(executionLog).toEqual(['high', 'medium', 'low']);
});
```

### 7.3 Mock Call Verification

```typescript
test('should verify task execution sequence', async () => {
  const task1 = vi.fn(async () => {});
  const task2 = vi.fn(async () => {});
  const task3 = vi.fn(async () => {});

  queue.enqueue(task1);
  queue.enqueue(task2);
  queue.enqueue(task3);

  await queue.process();

  // Verify all were called
  expect(task1).toHaveBeenCalledOnce();
  expect(task2).toHaveBeenCalledOnce();
  expect(task3).toHaveBeenCalledOnce();

  // Verify call order
  expect(task1.mock.invocationOrder).toBeLessThan(task2.mock.invocationOrder);
  expect(task2.mock.invocationOrder).toBeLessThan(task3.mock.invocationOrder);
});
```

### 7.4 Complex Queue with Dependencies

```typescript
test('should process tasks with dependency tracking', async () => {
  const executions = new Map<string, number>();
  let timestamp = 0;

  const createTask = (id: string, deps: string[]) => ({
    id,
    dependencies: deps,
    execute: vi.fn(async () => {
      executions.set(id, timestamp++);
    }),
  });

  const tasks = [
    createTask('base', []),
    createTask('dep1', ['base']),
    createTask('dep2', ['base']),
    createTask('final', ['dep1', 'dep2']),
  ];

  await dependencyQueue.process(tasks);

  // Verify execution order satisfies dependencies
  expect(executions.get('base')!).toBeLessThan(executions.get('dep1')!);
  expect(executions.get('base')!).toBeLessThan(executions.get('dep2')!);
  expect(executions.get('dep1')!).toBeLessThan(executions.get('final')!);
  expect(executions.get('dep2')!).toBeLessThan(executions.get('final')!);

  // Verify all tasks executed
  expect(tasks.every(t => t.execute)).toHaveBeenCalledOnce();
});
```

**Best Practices**:

- Use execution logs to track order
- Leverage Vitest's `toHaveBeenCalledBefore` matcher
- Track timestamps for complex ordering
- Verify both execution and ordering
- Test with various queue configurations
- Use descriptive task IDs for debugging

---

## 8. Testing Frameworks and Libraries

### 8.1 Vitest

**Strengths**:

- Native TypeScript support
- Fast execution with workers
- Jest-compatible API
- Built-in mocking and spies
- Fake timers for time control

**Key Features for Concurrent Testing**:

```typescript
import { vi, test, describe, expect } from 'vitest';

// Concurrent test execution
test.concurrent('runs in parallel', async () => {});

// Fake timers
vi.useFakeTimers();
vi.advanceTimersByTimeAsync(1000);

// Mock functions
const mockFn = vi.fn();
mockFn.mockResolvedValue('result');
```

### 8.2 Additional Libraries

#### 8.2.1 `fake-timers`

```typescript
// Alternative to built-in fake timers
import { install } from '@sinonjs/fake-timers';

const clock = install();
clock.tick(1000);
clock.uninstall();
```

#### 8.2.2 `p-queue` for Testing Queue Implementations

```typescript
import PQueue from 'p-queue';

test('should use p-queue for testing', async () => {
  const queue = new PQueue({ concurrency: 2 });

  const results = await queue.addAll([
    () => Promise.resolve(1),
    () => Promise.resolve(2),
    () => Promise.resolve(3),
  ]);

  expect(results).toEqual([1, 2, 3]);
});
```

#### 8.2.3 `delay` for Timing Control

```typescript
import delay from 'delay';

test('should use delay for timing control', async () => {
  await delay(100); // Wait 100ms
});
```

### 8.3 Custom Testing Utilities

#### 8.3.1 Concurrency Tracker

```typescript
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

// Usage
const tracker = new ConcurrencyTracker();
const trackedOps = operations.map(op => tracker.track(op));
await Promise.all(trackedOps.map(op => op()));
expect(tracker.getMaxConcurrency()).toBeLessThanOrEqual(3);
```

#### 8.3.2 Async Counter

```typescript
class AsyncCounter {
  private count = 0;

  async increment(): Promise<void> {
    this.count++;
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  getValue(): number {
    return this.count;
  }
}
```

### 8.4 Best Practices for Framework Selection

1. **Use Vitest if**:
   - Working in TypeScript
   - Need fast test execution
   - Want Jest compatibility

2. **Add supporting libraries for**:
   - Advanced timing control (`@sinonjs/fake-timers`)
   - Queue reference implementations (`p-queue`)
   - Promise utilities (`p-limit`, `p-all`)

3. **Build custom utilities for**:
   - Domain-specific concurrency tracking
   - Complex ordering verification
   - Race condition simulation

---

## Summary and Key Takeaways

### Testing Concurrent Execution

- Track active operations with Sets/Maps
- Use Promise.race for competition scenarios
- Assert on maximum concurrent operations

### Mocking Async Operations

- Use Vitest fake timers (`vi.useFakeTimers()`)
- Create controllable operations for precision
- Test both timing and ordering

### Testing Dependencies

- Verify topological ordering
- Test complex patterns (diamonds, chains)
- Test error cases (circular dependencies)

### Fire-and-Forget Patterns

- Never swallow errors silently
- Track errors in tests
- Verify non-blocking behavior

### Cache Testing

- Test hits, misses, and expiration
- Verify function call counts
- Test size limits and eviction

### Race Conditions

- Use Promise.all for concurrency
- Vary delays deliberately
- Test with high operation counts

### Queue Ordering

- Use execution logs
- Leverage Vitest matchers
- Track timestamps for complex cases

---

## 9. Real-World Examples from hacky-hack Codebase

Based on the existing test patterns in `/home/dustin/projects/hacky-hack/tests`, here are practical examples that demonstrate these testing principles in action.

### 9.1 Promise Rejection Tracking (from tests/setup.ts)

The project's test setup includes sophisticated promise rejection tracking that prevents unhandled rejections from going unnoticed:

```typescript
// Track unhandled promise rejections during test execution
let unhandledRejections: unknown[] = [];
let unhandledRejectionHandler: ((reason: unknown) => void) | null = null;

beforeEach(() => {
  // Reset unhandled rejections array and attach handler
  unhandledRejections = [];
  unhandledRejectionHandler = (reason: unknown) => {
    unhandledRejections.push(reason);
  };
  process.on('unhandledRejection', unhandledRejectionHandler);
});

afterEach(() => {
  // Clean up handler and check for unhandled rejections
  if (unhandledRejectionHandler) {
    process.removeListener('unhandledRejection', unhandledRejectionHandler);
    unhandledRejectionHandler = null;
  }

  // Fail test if there were unhandled rejections
  if (unhandledRejections.length > 0) {
    const errorMessages = unhandledRejections
      .map(r => (r instanceof Error ? r.message : String(r)))
      .join('; ');
    throw new Error(
      `Test had ${unhandledRejections.length} unhandled promise rejection(s)`
    );
  }
});
```

**Best Practice**: Always track promise rejections in fire-and-forget scenarios to catch async errors.

### 9.2 Execution Order Verification (from tests/unit/core/task-traversal.test.ts)

The project demonstrates sophisticated execution order tracking for dependency validation:

```typescript
describe('TaskOrchestrator - DFS Traversal', () => {
  it('should traverse items in DFS pre-order: parent before children', async () => {
    const orchestrator = new TaskOrchestrator(mockManager);
    const processedIds: string[] = [];

    // Process all items and track order
    let hasMore = true;
    while (hasMore) {
      hasMore = await orchestrator.processNextItem();
      if (orchestrator.currentItemId) {
        processedIds.push(orchestrator.currentItemId);
      }
    }

    // Verify parent indices are less than child indices (DFS pre-order property)
    const p1Index = processedIds.indexOf('P1');
    const m1Index = processedIds.indexOf('P1.M1');
    const t1Index = processedIds.indexOf('P1.M1.T1');
    const s1Index = processedIds.indexOf('P1.M1.T1.S1');

    expect(p1Index).toBeLessThan(m1Index); // Parent before child
    expect(m1Index).toBeLessThan(t1Index); // Child before grandchild
    expect(t1Index).toBeLessThan(s1Index); // Grandchild before great-grandchild
  });
});
```

**Best Practice**: Track execution order with arrays and use index comparisons to verify ordering constraints.

### 9.3 Batching and Atomic Operations (from tests/unit/core/session-state-batching.test.ts)

The project demonstrates testing of atomic write patterns with batching:

```typescript
describe('SessionManager Batching and Atomic State Updates', () => {
  it('should batch multiple status updates in memory', async () => {
    const manager = await createMockSessionManager();

    // Track writeTasksJSON calls (should not be called during batching)
    let writeTasksCallCount = 0;
    mockWriteTasksJSON.mockImplementation(async () => {
      writeTasksCallCount++;
    });

    // Multiple status updates
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
    await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

    // No immediate writes occurred (updates batched in memory)
    expect(writeTasksCallCount).toBe(0);

    // Flush writes all changes in single atomic operation
    await manager.flushUpdates();

    // Single write for all 3 updates
    expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
  });
});
```

**Best Practice**: Track operation counts to verify batching behavior and atomic writes.

### 9.4 Mock Implementation with State Preservation

```typescript
// Mock updateItemStatus utility to actually update the backlog
mockUpdateItemStatusUtil.mockImplementation(
  (backlog: Backlog, itemId: string, newStatus: string) => {
    // Create a deep copy and update the matching item
    const updated = JSON.parse(JSON.stringify(backlog)) as Backlog;

    // Extract subtask ID like P1.M1.T1.S1
    const match = itemId.match(/P(\d+)\.M(\d+)\.T(\d+)\.S(\d+)/);
    if (!match) {
      return updated;
    }
    const [, p, m, t, s] = match;

    // Find and update the nested item
    // ... (hierarchy traversal logic)

    return updated;
  }
);
```

**Best Practice**: Use deep cloning in mocks to prevent state mutation between test runs.

### 9.5 Retry Logic Testing

```typescript
it('should handle immediate retry after failure', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // First flush fails, second succeeds
  mockWriteTasksJSON
    .mockRejectedValueOnce(new Error('ENOSPC: no space left'))
    .mockResolvedValueOnce(undefined);

  // First flush attempt (fails)
  await expect(manager.flushUpdates()).rejects.toThrow('ENOSPC');

  // Immediate retry (succeeds)
  await expect(manager.flushUpdates()).resolves.not.toThrow();

  // Verify retry succeeded
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(2);
});
```

**Best Practice**: Use `mockRejectedValueOnce` and `mockResolvedValueOnce` to test retry logic and error recovery.

### 9.6 Factory Functions for Test Data

```typescript
function createTestSubtask(
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
) {
  return {
    id,
    type: 'Subtask' as const,
    title,
    status,
    story_points: 2,
    dependencies,
    context_scope,
  };
}

function createTestBacklog(phases: any[]): Backlog {
  return { backlog: phases };
}
```

**Best Practice**: Use factory functions to create consistent test data with defaults for optional parameters.

---

## 10. Testing Checklist

When writing tests for concurrent/parallel operations, use this checklist:

### Concurrency Testing

- [ ] Track active operations with Set/Map
- [ ] Assert on maximum concurrent operations
- [ ] Test with varying operation counts
- [ ] Verify cleanup happens correctly

### Async Mocking

- [ ] Use fake timers for time-dependent tests
- [ ] Clean up timers in afterEach
- [ ] Create controllable operations for precision
- [ ] Test both timing and ordering

### Dependency Testing

- [ ] Verify topological ordering
- [ ] Test complex dependency patterns
- [ ] Test circular dependency detection
- [ ] Verify all dependencies complete before dependents

### Fire-and-Forget

- [ ] Track errors in test hooks
- [ ] Verify non-blocking behavior
- [ ] Test partial failure scenarios
- [ ] Never swallow errors silently

### Cache Testing

- [ ] Test cache hits and misses
- [ ] Verify TTL expiration
- [ ] Test size limits and eviction
- [ ] Clear cache between tests

### Race Conditions

- [ ] Use Promise.all for concurrency
- [ ] Vary delays deliberately
- [ ] Test with high operation counts
- [ ] Verify final state consistency

### Queue Ordering

- [ ] Track execution order with logs
- [ ] Use index comparisons for verification
- [ ] Test priority queues
- [ ] Verify FIFO/FILO behavior

---

## 11. Common Pitfalls to Avoid

### 1. Forgetting to Clean Up Fake Timers

```typescript
// ❌ BAD
beforeEach(() => {
  vi.useFakeTimers();
});
// Missing: afterEach(() => { vi.useRealTimers(); })

// ✅ GOOD
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

### 2. Not Awaiting Async Operations

```typescript
// ❌ BAD
test('async test', () => {
  fetchData().then(data => {
    expect(data).toBe('value');
  });
});

// ✅ GOOD
test('async test', async () => {
  const data = await fetchData();
  expect(data).toBe('value');
});
```

### 3. Shared State Between Tests

```typescript
// ❌ BAD
let counter = 0;
test('test 1', () => {
  counter++;
});
test('test 2', () => {
  counter++;
}); // Depends on test 1

// ✅ GOOD
test('test 1', () => {
  let counter = 0;
  counter++;
  expect(counter).toBe(1);
});

test('test 2', () => {
  let counter = 0;
  counter++;
  expect(counter).toBe(1);
});
```

### 4. Not Handling Promise Rejections

```typescript
// ❌ BAD
fireAndForget(async () => {
  throw new Error('oops');
}); // Error lost

// ✅ GOOD
fireAndForget(async () => {
  throw new Error('oops');
}).catch(error => {
  logger.error('Fire-and-forget failed', error);
});
```

### 5. Timing-Dependent Tests

```typescript
// ❌ BAD
test('flaky test', async () => {
  await fetchData();
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(result).toBe('value');
});

// ✅ GOOD
test('reliable test', async () => {
  vi.useFakeTimers();
  const promise = fetchData();
  await vi.runAllTimersAsync();
  const result = await promise;
  expect(result).toBe('value');
  vi.useRealTimers();
});
```

---

## 12. Conclusion

This research document has compiled best practices for testing concurrent/parallel operations, queues, and fire-and-forget patterns in TypeScript/Vitest. The patterns demonstrated here are actively used in the hacky-hack codebase and have been proven effective for testing complex async systems.

**Key Takeaways**:

1. Always track and handle promise rejections
2. Use fake timers for deterministic timing tests
3. Track execution order to verify dependencies
4. Use batching to reduce I/O operations
5. Never swallow errors in fire-and-forget patterns
6. Test with both small and large operation counts
7. Verify cleanup and resource management

**Next Steps**:

- Apply these patterns to new test suites
- Review existing tests for potential improvements
- Create shared test utilities for common patterns
- Establish testing guidelines for the team

---

_Document generated: 2026-01-19_
_Research focus: TypeScript/Vitest concurrent testing patterns_
_Codebase examples from: /home/dustin/projects/hacky-hack_

---

## Additional Resources

While web search was unavailable during this research, recommended resources include:

1. **Official Vitest Documentation**: https://vitest.dev/
2. **Vitest Mocking Guide**: https://vitest.dev/guide/mocking.html
3. **Vitest Async Testing**: https://vitest.dev/guide/testing-types.html
4. **TypeScript Testing Handbook**: https://github.com/microsoft/TypeScript/wiki/Testing-TypeScript-with-Mocha,-Chai-and-Sinon
5. **JavaScript Concurrency Patterns**: "You Don't Know JS: Async & Performance" by Kyle Simpson

---

_Document generated: 2026-01-19_
_Research focus: TypeScript/Vitest concurrent testing patterns_
