# Execution Loop Testing Best Practices

## 1. Testing Main Execution Loops

### Pattern: While Loop with Exit Conditions

```typescript
// Pattern: Loop with explicit exit conditions
while (await this.taskOrchestrator.processNextItem()) {
  try {
    iterations++;

    // Safety check to prevent infinite loops
    if (iterations > maxIterations) {
      throw new Error(`Execution exceeded ${maxIterations} iterations`);
    }

    // Process item
    // ...

    // Check for shutdown
    if (this.shutdownRequested) {
      break;
    }
  } catch (taskError) {
    // Track and continue - don't stop the pipeline
    this.#trackFailure(taskId, taskError);
  }
}
```

### Testing Strategy

- Mock the loop condition to return true N times, then false
- Verify exit conditions (max iterations, shutdown, queue empty)
- Test each exit path independently
- Use counters to track iterations

### Example from Codebase

```typescript
// From tests/integration/core/task-orchestrator.test.ts
let hasMore = true;
while (hasMore) {
  hasMore = await orchestrator.processNextItem();
  if (orchestrator.currentItemId) {
    processedIds.push(orchestrator.currentItemId);
  }
}
expect(processedIds.length).toBeGreaterThan(0);
```

## 2. Testing Progress Metrics

### Metrics to Track

- **Count metrics**: completed, total, remaining
- **Percentage metrics**: completion rate (0-100%)
- **Time metrics**: elapsed, average duration, ETA
- **Rate metrics**: tasks per second, speed trends

### Testing Patterns

```typescript
// Test count accuracy
expect(progress.completed).toBe(5);
expect(progress.total).toBe(10);
expect(progress.remaining).toBe(5);

// Test percentage calculation
expect(progress.percentage).toBe(50);

// Test time-based metrics with fake timers
vi.useFakeTimers();
tracker.recordStart('task1');
vi.advanceTimersByTime(100);
tracker.recordComplete('task1');
const eta = tracker.getETA();
expect(isFinite(eta)).toBe(true);
vi.useRealTimers();
```

### Best Practices

- Use fake timers for time-sensitive tests
- Test edge cases (0 tasks, 1 task, very large counts)
- Test fractional percentages (e.g., 1/3 = 33.33%)
- Verify timestamp accuracy with `Date.now()` mocking
- Test ETA calculation with various sample sizes

## 3. Testing Status Transitions

### Status Flow

```
'init' → 'session_initialized' → 'prd_decomposed' →
'backlog_running' → 'backlog_complete' →
'qa_complete'/'qa_skipped' → 'shutdown_complete'
```

### Testing Strategy

```typescript
// Test each transition
await orchestrator.setStatus('P1.M1.T1.S1', 'Researching');
expect(findItem(backlog, 'P1.M1.T1.S1')?.status).toBe('Researching');

// Test invalid transitions fail
await expect(
  orchestrator.setStatus('P1.M1.T1.S1', 'InvalidStatus')
).rejects.toThrow();

// Test status persistence
await sessionManager.updateItemStatus('P1.M1.T1.S1', 'Complete');
await orchestrator.#refreshBacklog();
expect(orchestrator.backlog).toMatchObject({
  /* updated state */
});
```

## 4. Testing Graceful Shutdown

### Shutdown Patterns

1. **SIGINT handling**
2. **SIGTERM handling**
3. **Duplicate signal handling**
4. **State preservation during shutdown**

### Testing Strategy

```typescript
// Test signal handler registration
const initialSigintCount = process._events?.SIGINT?.length ?? 0;
const pipeline = new PRPPipeline(prdPath);
// ... run pipeline
const finalSigintCount = process._events?.SIGINT?.length ?? 0;
expect(finalSigintCount).toBeLessThanOrEqual(initialSigintCount);

// Test shutdown flag is set
process.emit('SIGINT');
await new Promise(resolve => setImmediate(resolve));
expect(pipeline.shutdownRequested).toBe(true);

// Test current task completes before shutdown
let callCount = 0;
mockOrchestrator.processNextItem = vi.fn().mockImplementation(async () => {
  callCount++;
  if (callCount === 1) {
    (pipeline as any).shutdownRequested = true;
    return true;
  }
  return false;
});
await pipeline.run();
expect(callCount).toBeGreaterThan(0);
```

## 5. Testing Error Handling in Loops

### Pattern: Try-Catch with Continue-on-Error

```typescript
while (await this.taskOrchestrator.processNextItem()) {
  try {
    // Process item
    iterations++;
    // ...
  } catch (taskError) {
    // TRACK failure but CONTINUE
    this.#trackFailure(taskId, taskError);
    this.logger.warn('Task failed, continuing to next task');
    // Don't re-throw - loop continues
  }
}
```

### Testing Strategy

```typescript
// Test individual failures don't stop pipeline
let callCount = 0;
mockOrchestrator.processNextItem = vi
  .fn()
  .mockResolvedValueOnce(true) // First succeeds
  .mockRejectedValueOnce(new Error('Task failed')) // Second fails
  .mockResolvedValueOnce(true); // Third succeeds

const result = await pipeline.run();
expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(3);
expect(result.failedTasks).toBe(1);
expect(result.completedTasks).toBe(2);
```

## 6. Testing Queue-Based Processing

### Pattern: FIFO Queue Processing

```typescript
async processNextItem(): Promise<boolean> {
  if (this.#executionQueue.length === 0) {
    return false; // Queue empty
  }

  const nextItem = this.#executionQueue.shift()!;
  this.currentItemId = nextItem.id;

  await this.#delegateByType(nextItem);
  await this.#refreshBacklog();

  return true; // More items may remain
}
```

### Testing Strategy

```typescript
// Test queue empty condition
const orchestrator = new TaskOrchestrator(sessionManager);
expect(orchestrator.executionQueue.length).toBe(0);
const hasMore = await orchestrator.processNextItem();
expect(hasMore).toBe(false);

// Test FIFO ordering
const processedIds: string[] = [];
while (await orchestrator.processNextItem()) {
  if (orchestrator.currentItemId) {
    processedIds.push(orchestrator.currentItemId);
  }
}
expect(processedIds).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']);
```

## 7. Mocking Orchestrators and Session Managers

### Mock SessionManager Pattern

```typescript
function createMockSessionManager(session: SessionState | null) {
  return {
    currentSession: session,
    initialize: vi.fn().mockResolvedValue(session),
    saveBacklog: vi.fn().mockResolvedValue(undefined),
    hasSessionChanged: vi.fn().mockReturnValue(false),
    createDeltaSession: vi.fn().mockResolvedValue(session),
    updateItemStatus: vi.fn().mockResolvedValue(undefined),
    flushUpdates: vi.fn().mockResolvedValue(undefined),
    prdPath: '/test/prd.md',
  };
}
```

### Mock TaskOrchestrator Pattern

```typescript
function createMockTaskOrchestrator() {
  return {
    processNextItem: vi.fn(),
    currentItemId: null as string | null,
    sessionManager: {},
    canExecute: vi.fn(),
    getBlockingDependencies: vi.fn(),
    setScope: vi.fn(),
  };
}
```

### Mock with Controlled Behavior

```typescript
// Mock that returns true N times, then false
let callCount = 0;
mockOrchestrator.processNextItem = vi.fn().mockImplementation(async () => {
  callCount++;
  return callCount <= 3; // Returns true 3 times, then false
});

// Mock that simulates specific task IDs
mockOrchestrator.currentItemId = 'P1.M1.T1.S1';

// Mock that throws on specific call
mockOrchestrator.processNextItem = vi
  .fn()
  .mockResolvedValueOnce(true)
  .mockRejectedValueOnce(new Error('Simulated failure'))
  .mockResolvedValueOnce(false);
```

## 8. Testing Long-Running Processes

### Strategies

1. **Virtual Time with Fake Timers**
2. **Iteration Limits for Safety**
3. **Resource Monitoring**
4. **Progress Sampling**
5. **Early Exit Conditions**

### Example

```typescript
// Test with fake timers
vi.useFakeTimers();
try {
  tracker.recordStart('task1');
  vi.advanceTimersByTime(100);
  tracker.recordComplete('task1');

  const progress = tracker.getProgress();
  expect(progress.elapsed).toBe(100);
} finally {
  vi.useRealTimers();
}
```

## 9. Verifying Loop Termination Conditions

### Termination Conditions to Test

1. **Natural Completion (Queue Empty)**
2. **Graceful Shutdown**
3. **Resource Limit**
4. **Max Iterations Safety**

### Testing Example

```typescript
test('terminates when queue is empty', async () => {
  const orchestrator = new TaskOrchestrator(sessionManager);
  // Queue has 3 items

  let hasMore = true;
  let count = 0;
  while (hasMore) {
    hasMore = await orchestrator.processNextItem();
    count++;
  }

  expect(count).toBe(3);
  expect(hasMore).toBe(false);
});
```

## 10. Testing Individual Failures Don't Stop Pipeline

### Testing Strategy

```typescript
test('continues after individual task failure', async () => {
  const mockOrchestrator = createMockTaskOrchestrator();

  // Task 1: success, Task 2: failure, Task 3: success
  mockOrchestrator.processNextItem = vi
    .fn()
    .mockResolvedValueOnce(true) // Task 1
    .mockRejectedValueOnce(new Error('Task 2 failed')) // Task 2 fails
    .mockResolvedValueOnce(true) // Task 3
    .mockResolvedValueOnce(false); // Done

  const pipeline = new PRPPipeline(prdPath);
  (pipeline as any).taskOrchestrator = mockOrchestrator;

  const result = await pipeline.run();

  // Verify all tasks were attempted
  expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(4);

  // Verify failure was tracked
  expect(pipeline['#failedTasks'].size).toBe(1);

  // Verify pipeline didn't stop
  expect(result.completedTasks).toBeGreaterThan(0);
  expect(result.failedTasks).toBe(1);
});
```

## Key Testing Patterns Summary

1. **Loop Testing**:
   - Mock loop conditions to control iteration count
   - Test each exit path independently
   - Use counters to track iterations
   - Test infinite loop prevention

2. **Progress Testing**:
   - Use fake timers for time-sensitive tests
   - Test edge cases (0, 1, many tasks)
   - Verify metric accuracy (counts, percentages, time)
   - Test ETA calculation with various samples

3. **Status Testing**:
   - Test each transition in the state machine
   - Verify state persistence
   - Test state refresh mechanisms
   - Spy on logging for audit trails

4. **Shutdown Testing**:
   - Test each signal type (SIGINT, SIGTERM)
   - Verify cleanup in finally block
   - Test duplicate signal handling
   - Verify state preservation on shutdown
   - Clean up listeners in afterEach

5. **Error Testing**:
   - Test individual failures don't stop pipeline
   - Verify failure tracking works
   - Test error report generation
   - Test both fatal and non-fatal errors
   - Verify recovery after errors

6. **Queue Testing**:
   - Test empty queue condition
   - Verify FIFO ordering
   - Test scope filtering
   - Test queue rebuilding
   - Verify currentItemId updates

7. **Mock Patterns**:
   - Use factory functions for consistent mocks
   - Make mocks configurable
   - Use mockImplementation for complex behavior
   - Clear mocks in beforeEach
   - Verify mock calls

8. **Long-Running Process Testing**:
   - Use fake timers
   - Set iteration limits
   - Test early exit conditions
   - Sample progress at intervals
   - Use timeout guards

## Sources

- **Vitest Documentation**: https://vitest.dev/guide/mocking.html
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library-tests
- **Async Testing**: https://vitest.dev/guide/testing-instances.html
- **Fake Timers**: https://vitest.dev/api/vi.html#usetimers
- **Project Pipeline Tests**: `/home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-*.test.ts`
- **Project Orchestrator Tests**: `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator*.test.ts`
