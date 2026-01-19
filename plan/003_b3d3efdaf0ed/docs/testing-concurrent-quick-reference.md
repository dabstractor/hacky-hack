# Quick Reference: Testing Concurrent Operations in TypeScript/Vitest

A condensed cheat sheet for common testing patterns in concurrent/parallel operations, queues, and fire-and-forget scenarios.

---

## Table of Contents
1. [Fake Timers](#1-fake-timers)
2. [Concurrency Tracking](#2-concurrency-tracking)
3. [Execution Order](#3-execution-order)
4. [Fire-and-Forget](#4-fire-and-forget)
5. [Cache Testing](#5-cache-testing)
6. [Race Conditions](#6-race-conditions)
7. [Queue Testing](#7-queue-testing)
8. [Mock Patterns](#8-mock-patterns)

---

## 1. Fake Timers

### Basic Setup
```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

### Advance Time
```typescript
test('timed operation', async () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);

  await vi.advanceTimersByTimeAsync(1000);
  expect(callback).toHaveBeenCalled();
});
```

### Run All Timers
```typescript
test('all timers', async () => {
  const callback = vi.fn();
  setTimeout(callback, 5000);

  await vi.runAllTimersAsync();
  expect(callback).toHaveBeenCalled();
});
```

---

## 2. Concurrency Tracking

### Track Active Operations
```typescript
test('concurrency limit', async () => {
  const active = new Set<string>();
  const maxConcurrent = vi.fn();

  const createOp = (id: string) => async () => {
    active.add(id);
    maxConcurrent(active.size);
    await new Promise(resolve => setTimeout(resolve, 100));
    active.delete(id);
  };

  const ops = Array.from({ length: 10 }, (_, i) => createOp(`op-${i}`));
  await Promise.all(ops.map(op => op()));

  const max = Math.max(...maxConcurrent.mock.calls.map(c => c[0]));
  expect(max).toBeLessThanOrEqual(3);
});
```

---

## 3. Execution Order

### Track Order with Array
```typescript
test('execution order', async () => {
  const order: string[] = [];

  await op1();
  order.push('op1');

  await op2();
  order.push('op2');

  expect(order).toEqual(['op1', 'op2']);
});
```

### Verify Parent Before Child
```typescript
test('parent before child', async () => {
  const processed: string[] = [];

  // Process items...
  await processParent();
  processed.push('parent');
  await processChild();
  processed.push('child');

  const parentIndex = processed.indexOf('parent');
  const childIndex = processed.indexOf('child');

  expect(parentIndex).toBeLessThan(childIndex);
});
```

---

## 4. Fire-and-Forget

### Track Errors
```typescript
let unhandledRejections: unknown[] = [];

beforeEach(() => {
  unhandledRejections = [];
  process.on('unhandledRejection', (reason) => {
    unhandledRejections.push(reason);
  });
});

afterEach(() => {
  process.removeAllListeners('unhandledRejection');
  if (unhandledRejections.length > 0) {
    throw new Error(`Had ${unhandledRejections.length} unhandled rejections`);
  }
});
```

### Test Non-Blocking
```typescript
test('fire-and-forget non-blocking', async () => {
  let successCount = 0;

  const failingOp = async () => {
    throw new Error('Failed');
  };

  const successOp = async () => {
    successCount++;
  };

  fireAndForget(failingOp());
  await successOp();

  expect(successCount).toBe(1);
});
```

---

## 5. Cache Testing

### Cache Hit/Miss
```typescript
test('cache behavior', async () => {
  const cache = new Map<string, string>();
  const fetchFn = vi.fn(async (key: string) => `value-${key}`);

  const getCached = async (key: string) => {
    if (cache.has(key)) return cache.get(key);
    const value = await fetchFn(key);
    cache.set(key, value);
    return value;
  };

  // Cache miss
  await getCached('key1');
  expect(fetchFn).toHaveBeenCalledTimes(1);

  // Cache hit
  await getCached('key1');
  expect(fetchFn).toHaveBeenCalledTimes(1); // Not called again
});
```

---

## 6. Race Conditions

### Promise.race
```typescript
test('promise race', async () => {
  vi.useFakeTimers();

  const op1 = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'op1';
  };

  const op2 = async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return 'op2';
  };

  const race = Promise.race([op1(), op2()]);
  await vi.runAllTimersAsync();

  const result = await race;
  expect(result).toBe('op2');

  vi.useRealTimers();
});
```

### Concurrent State Mutation
```typescript
test('concurrent mutations', async () => {
  let counter = 0;

  const increment = async () => {
    const current = counter;
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    counter = current + 1;
  };

  const increments = Array.from({ length: 100 }, () => increment());
  await Promise.all(increments);

  expect(counter).toBeLessThanOrEqual(100);
});
```

---

## 7. Queue Testing

### FIFO Order
```typescript
test('FIFO queue', async () => {
  const processed: string[] = [];

  const task1 = vi.fn(async () => { processed.push('task1'); });
  const task2 = vi.fn(async () => { processed.push('task2'); });
  const task3 = vi.fn(async () => { processed.push('task3'); });

  queue.enqueue(task1);
  queue.enqueue(task2);
  queue.enqueue(task3);

  await queue.process();

  expect(processed).toEqual(['task1', 'task2', 'task3']);
});
```

### Priority Queue
```typescript
test('priority queue', async () => {
  const processed: string[] = [];

  const createTask = (id: string, priority: number) => ({
    id,
    priority,
    execute: vi.fn(async () => { processed.push(id); })
  });

  queue.enqueue(createTask('low', 1));
  queue.enqueue(createTask('high', 10));
  queue.enqueue(createTask('medium', 5));

  await queue.process();

  expect(processed).toEqual(['high', 'medium', 'low']);
});
```

---

## 8. Mock Patterns

### Retry Logic
```typescript
test('retry logic', async () => {
  const mockFn = vi.fn()
    .mockRejectedValueOnce(new Error('Fail'))
    .mockResolvedValueOnce('Success');

  await expect(retry(mockFn)).resolves.toBe('Success');
  expect(mockFn).toHaveBeenCalledTimes(2);
});
```

### State Preservation
```typescript
test('mock state preservation', async () => {
  mockUpdateItem.mockImplementation((backlog, id, status) => {
    // Deep clone to prevent mutation
    const updated = JSON.parse(JSON.stringify(backlog));
    // Update logic...
    return updated;
  });
});
```

### Factory Functions
```typescript
function createTestTask(
  id: string,
  status = 'Planned',
  dependencies: string[] = []
) {
  return {
    id,
    type: 'Task' as const,
    status,
    dependencies,
  };
}
```

---

## Common Assertions

### Timing
```typescript
expect(callback).toHaveBeenCalled();
expect(callback).toHaveBeenCalledTimes(1);
expect(callback).toHaveBeenLastCalledWith('arg');
expect(callback).toHaveBeenCalledBefore(callback2);
```

### Order
```typescript
expect(order).toEqual(['a', 'b', 'c']);
expect(index1).toBeLessThan(index2);
expect(array).toContain('item');
```

### Errors
```typescript
await expect(promise).resolves.toBe('value');
await expect(promise).rejects.toThrow('Error');
expect(mock).toHaveBeenCalledTimes(1);
```

---

## Test Checklist

- [ ] Fake timers setup/cleanup
- [ ] Track active operations
- [ ] Verify execution order
- [ ] Handle promise rejections
- [ ] Test cache hit/miss
- [ ] Simulate race conditions
- [ ] Verify queue ordering
- [ ] Mock retry logic
- [ ] Clean up mocks in afterEach
- [ ] Clear state between tests

---

*Generated: 2026-01-19*
*Companion to: testing-concurrent-operations-vitest-typescript.md*
