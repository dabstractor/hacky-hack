# Concurrent Testing Best Practices for Vitest/TypeScript

## Overview

This document summarizes best practices for testing concurrent operations, queues, and fire-and-forget patterns in TypeScript with Vitest, based on established testing patterns and the hacky-hack codebase conventions.

## 1. Testing Concurrent Execution with Limits

### Pattern: Track Active Operations

```typescript
describe('Concurrency Limits', () => {
  it('should enforce maximum concurrent operations', async () => {
    const activeCount = { value: 0 };
    const maxActive = { value: 0 };
    const startOrder: string[] = [];

    // Create mock that tracks concurrency
    const createMockTask = (id: string, delay: number) => {
      return vi.fn().mockImplementation(async () => {
        activeCount.value++;
        maxActive.value = Math.max(maxActive.value, activeCount.value);
        startOrder.push(id);

        await new Promise(resolve => setTimeout(resolve, delay));

        activeCount.value--;
        return { taskId: id, data: `result-${id}` };
      });
    };

    // Enqueue more tasks than concurrency limit
    const tasks = [
      createMockTask('task-1', 100),
      createMockTask('task-2', 100),
      createMockTask('task-3', 100),
      createMockTask('task-4', 100),  // Should wait
      createMockTask('task-5', 100),  // Should wait
    ];

    const queue = new ResearchQueue(sessionManager, 3, false);

    // Enqueue all tasks
    for (const task of tasks) {
      await queue.enqueue(createTestSubtask(task.id), backlog);
    }

    // Wait for all to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify concurrency limit
    expect(maxActive.value).toBeLessThanOrEqual(3);
    expect(startOrder.slice(0, 3).sort()).toEqual(['task-1', 'task-2', 'task-3']);
  });
});
```

### Key Points

1. **Track active count**: Use a wrapper object to track concurrent operations
2. **Record max concurrent**: Verify the limit is never exceeded
3. **Control timing**: Use consistent delays for predictable behavior
4. **Verify start order**: First N tasks should start immediately

## 2. Mocking Async Operations with Controlled Timing

### Pattern: Controllable Mock Generator

```typescript
describe('Controlled Async Mocking', () => {
  it('should complete tasks in controlled order', async () => {
    const completionOrder: string[] = [];

    // Create mock with controlled timing
    let generateCallCount = 0;
    const mockGenerate = vi.fn()
      .mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        completionOrder.push('slow-first');
        return mockPRPDocument;
      })
      .mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        completionOrder.push('fast-second');
        return mockPRPDocument;
      })
      .mockImplementation(async () => {
        completionOrder.push(`task-${++generateCallCount}`);
        return mockPRPDocument;
      });

    // Use mock in PRPGenerator
    vi.mock('../../../src/agents/prp-generator.js', () => ({
      PRPGenerator: vi.fn().mockImplementation(() => ({
        generate: mockGenerate,
      })),
    }));

    // Execute and verify order
    await queue.enqueue(task1, backlog);
    await queue.enqueue(task2, backlog);

    await new Promise(resolve => setTimeout(resolve, 200));

    // Fast task completes before slow task
    expect(completionOrder).toEqual(['fast-second', 'slow-first']);
  });
});
```

### Pattern: Fake Timers for Deterministic Testing

```typescript
describe('Fake Timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle timeout deterministically', async () => {
    const mockGenerate = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return mockPRPDocument;
    });

    const promise = queue.enqueue(task, backlog);

    // Fast-forward time
    await vi.advanceTimersByTimeAsync(5000);

    await promise;
    expect(mockGenerate).toHaveBeenCalled();
  });
});
```

## 3. Testing Queue Dependency Ordering

### Pattern: Dependency Graph Verification

```typescript
describe('Dependency Ordering', () => {
  it('should not process tasks with incomplete dependencies', async () => {
    const processedOrder: string[] = [];

    // Create tasks with dependencies
    const task1 = createTestSubtask('P1.M1.T1.S1', 'Independent', 'Planned', []);
    const task2 = createTestSubtask('P1.M1.T1.S2', 'Depends on S1', 'Planned', ['P1.M1.T1.S1']);
    const task3 = createTestSubtask('P1.M1.T1.S3', 'Depends on S2', 'Planned', ['P1.M1.T1.S2']);

    const mockGenerate = vi.fn().mockImplementation(async (task: Subtask) => {
      // Check if dependencies are complete before processing
      const canExecute = orchestrator.canExecute(task);

      if (!canExecute) {
        throw new Error(`Task ${task.id} blocked by dependencies`);
      }

      processedOrder.push(task.id);
      return mockPRPDocument;
    });

    // Enqueue in dependency order
    await queue.enqueue(task3, backlog);  // Should be blocked
    await queue.enqueue(task1, backlog);  // Should process first
    await queue.enqueue(task2, backlog);  // Should process second

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify processing order respects dependencies
    expect(processedOrder).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']);
  });
});
```

### Pattern: Topological Sort Verification

```typescript
it('should produce valid topological order', () => {
  const processed = ['P1.M1.T1.S3', 'P1.M1.T1.S1', 'P1.M1.T1.S2'];

  // For each task, its dependencies must come before it
  for (let i = 0; i < processed.length; i++) {
    const taskId = processed[i];
    const task = findTask(taskId, backlog);

    for (const depId of task.dependencies) {
      const depIndex = processed.indexOf(depId);
      expect(depIndex).toBeLessThan(i);
    }
  }
});
```

## 4. Testing Fire-and-Forget Error Handling

### Pattern: Error Tracking Without Blocking

```typescript
describe('Fire-and-Forget Error Handling', () => {
  it('should log errors but continue processing', async () => {
    const loggedErrors: string[] = [];

    // Mock logger to capture errors
    const mockLogger = {
      error: vi.fn((msg: string) => loggedErrors.push(msg)),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    vi.mock('../../../src/utils/logger.js', () => ({
      getLogger: vi.fn(() => mockLogger),
    }));

    // Mock generator that fails for specific task
    const mockGenerate = vi.fn()
      .mockImplementationOnce(async () => {
        throw new Error('Simulated failure');
      })
      .mockImplementation(async () => mockPRPDocument);

    // Enqueue tasks (first will fail)
    await queue.enqueue(failingTask, backlog);
    await queue.enqueue(successTask, backlog);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify error was logged
    expect(loggedErrors.some(e => e.includes('PRP generation failed'))).toBe(true);

    // Verify subsequent task still processed
    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(queue.getPRP(successTask.id)).toBeDefined();
  });

  it('should not cache failed results', async () => {
    const failingTask = createTestSubtask('P1.M1.T1.S1', 'Failing Task');

    mockGenerate.mockRejectedValueOnce(new Error('Failure'));

    await queue.enqueue(failingTask, backlog);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Failed task should not be in cache
    expect(queue.getPRP(failingTask.id)).toBeNull();

    // But task should not be researching
    expect(queue.isResearching(failingTask.id)).toBe(false);
  });
});
```

## 5. Testing Cache Behavior

### Pattern: Cache Hit/Miss Verification

```typescript
describe('Cache Behavior', () => {
  it('should check cache before generating', async () => {
    const taskId = 'P1.M1.T1.S1';
    const task = createTestSubtask(taskId, 'Test Task');

    // First call should generate
    await queue.enqueue(task, backlog);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockGenerate).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await queue.enqueue(task, backlog);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Generate should not be called again
    expect(mockGenerate).toHaveBeenCalledTimes(1);

    // Result should be available
    expect(queue.getPRP(taskId)).toBeDefined();
  });

  it('should deduplicate concurrent requests for same task', async () => {
    const taskId = 'P1.M1.T1.S1';
    const task = createTestSubtask(taskId, 'Test Task');

    let generateCount = 0;
    mockGenerate.mockImplementation(async () => {
      generateCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockPRPDocument;
    });

    // Enqueue same task multiple times concurrently
    const promises = [
      queue.enqueue(task, backlog),
      queue.enqueue(task, backlog),
      queue.enqueue(task, backlog),
    ];

    await Promise.all(promises);
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should only generate once
    expect(generateCount).toBe(1);
  });
});
```

## 6. Patterns for Simulating Race Conditions

### Pattern: Concurrent State Mutation

```typescript
describe('Race Conditions', () => {
  it('should handle concurrent processNext calls', async () => {
    const task = createTestSubtask('P1.M1.T1.S1', 'Test');

    // Call processNext multiple times simultaneously
    const promises = [
      queue['processNext'](backlog),
      queue['processNext'](backlog),
      queue['processNext'](backlog),
    ];

    await Promise.all(promises);

    // Verify no duplicate processing
    expect(mockGenerate).toHaveBeenCalledTimes(1);

    // Verify clean state
    expect(queue.getStats().researching).toBe(0);
  });
});
```

## 7. Verifying Queue Processing Order

### Pattern: Execution Log Verification

```typescript
describe('Queue Processing Order', () => {
  it('should process tasks in FIFO order', async () => {
    const processedOrder: string[] = [];

    mockGenerate.mockImplementation(async (task: Subtask) => {
      processedOrder.push(task.id);
      return { ...mockPRPDocument, taskId: task.id };
    });

    // Enqueue tasks in specific order
    const tasks = [
      createTestSubtask('P1.M1.T1.S1', 'First'),
      createTestSubtask('P1.M1.T1.S2', 'Second'),
      createTestSubtask('P1.M1.T1.S3', 'Third'),
    ];

    for (const task of tasks) {
      await queue.enqueue(task, backlog);
    }

    // Wait for all to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify FIFO order
    expect(processedOrder).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']);
  });
});
```

## Common Assertions for Queue Testing

```typescript
// Concurrency assertions
expect(maxActive.value).toBeLessThanOrEqual(concurrencyLimit);
expect(queue.getStats().researching).toBeLessThanOrEqual(concurrencyLimit);

// State assertions
expect(queue.isResearching(taskId)).toBe(true/false);
expect(queue.getPRP(taskId)).toBeDefined();
expect(queue.getPRP(taskId)).toBeNull();

// Statistics assertions
expect(queue.getStats().queued).toBe(expectedQueued);
expect(queue.getStats().researching).toBe(expectedResearching);
expect(queue.getStats().cached).toBe(expectedCached);

// Error handling assertions
expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('failed'));
expect(queue.getPRP(failedTaskId)).toBeNull();

// Order assertions
expect(processedOrder).toEqual(expectedOrder);
expect(completionOrder[0]).toBe('fast-task');
expect(completionOrder[completionOrder.length - 1]).toBe('slow-task');
```

## Test Checklist

- [ ] Concurrency limit enforced
- [ ] FIFO order maintained
- [ ] Fire-and-forget errors don't block queue
- [ ] Failed results not cached
- [ ] Cache deduplication works
- [ ] Concurrent requests for same task deduplicated
- [ ] Background cleanup always happens
- [ ] Queue statistics accurate
- [ ] Dependencies respected (if applicable)
- [ ] No memory leaks (Maps cleaned up)

## Key Gotchas

1. **Always clean up fake timers**: Use `afterEach` with `vi.useRealTimers()`
2. **Wait for async operations**: Use adequate delays or promises
3. **Track execution order**: Use arrays to record order of operations
4. **Mock error logging**: Verify errors are logged without blocking
5. **Test edge cases**: Empty queue, single task, exactly at limit, over limit
6. **Verify cleanup**: Ensure Maps are cleared after completion
