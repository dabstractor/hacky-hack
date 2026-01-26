# Research Report: Test Patterns Analysis for ResearchQueue Concurrency Configuration

### Existing Test File Paths

1. **Unit Tests**: `tests/unit/core/research-queue.test.ts`
   - 1,375 lines of comprehensive unit tests
   - Tests constructor, enqueue, processNext, isResearching, getPRP, waitForPRP, getStats, clearCache
   - Includes error handling and edge cases

2. **Integration Tests**: `tests/integration/core/research-queue.test.ts`
   - 978 lines of integration tests
   - Tests concurrent processing with maxSize limit
   - Tests fire-and-forget error handling
   - Tests cache deduplication
   - Tests queue statistics during concurrent operations
   - Tests execution order verification

3. **Related Files**:
   - `tests/unit/utils/resource-monitoring.test.ts` - Resource monitoring with configurable parameters
   - `tests/unit/agents/prp-executor.test.ts` - Agent execution patterns
   - `vitest.config.ts` - Testing framework configuration

### Test Patterns for Constructor Parameters

#### Constructor Testing Pattern
```typescript
describe('constructor', () => {
  it('should store sessionManager as readonly property', () => {
    // SETUP: Create mock session manager with active session
    const currentSession = {
      metadata: { /* session data */ },
      prdSnapshot: '# Test PRD',
      taskRegistry: createTestBacklog([]),
      currentItemId: null,
    };
    const mockManager = createMockSessionManager(currentSession);

    // EXECUTE
    const queue = new ResearchQueue(mockManager, 3);

    // VERIFY
    expect(queue.sessionManager).toBe(mockManager);
  });

  it('should set maxSize from constructor parameter', () => {
    // SETUP
    const mockManager = createMockSessionManager(createMockSession());

    // EXECUTE
    const queue = new ResearchQueue(mockManager, 5);

    // VERIFY
    expect(queue.maxSize).toBe(5);
  });

  it('should use default maxSize of 3 when not specified', () => {
    // SETUP
    const mockManager = createMockSessionManager(createMockSession());

    // EXECUTE
    const queue = new ResearchQueue(mockManager);

    // VERIFY
    expect(queue.maxSize).toBe(3);
  });
});
```

### How to Test Different Concurrency Levels

#### 1. Testing maxSize Limit
```typescript
it('should process up to maxSize tasks concurrently', async () => {
  // SETUP: Create mock with concurrency tracking
  const tracker = trackConcurrency();

  mockGenerate.mockImplementation(async (task: Subtask) => {
    tracker.trackStart(task.id);
    await new Promise(resolve => setTimeout(resolve, 100));
    tracker.trackEnd();
    return createTestPRPDocument(task.id);
  });

  const queue = new ResearchQueue(mockSessionManager, 3);

  // EXECUTE: Enqueue more tasks than maxSize
  for (let i = 1; i <= 5; i++) {
    const task = createTestSubtask(`P1.M1.T1.S${i}`, `Task ${i}`, 'Planned');
    await queue.enqueue(task, backlog);
  }

  // Wait for all to complete
  await Promise.all(tasks.map(t => queue.waitForPRP(t.id).catch(() => {})));

  // VERIFY: Concurrency limit was never exceeded
  expect(tracker.getState().max).toBeLessThanOrEqual(3);
});
```

#### 2. Testing Serial vs Parallel Execution
```typescript
it('should only run maxSize tasks simultaneously', async () => {
  // SETUP: Track active operations
  const activeCount = { value: 0 };
  const maxActive = { value: 0 };

  mockGenerate.mockImplementation(async (task: Subtask) => {
    activeCount.value++;
    maxActive.value = Math.max(maxActive.value, activeCount.value);
    await new Promise(resolve => setTimeout(resolve, 100));
    activeCount.value--;
    return createTestPRPDocument(task.id);
  });

  const queue = new ResearchQueue(mockSessionManager, 2);

  // EXECUTE: Enqueue 5 tasks
  for (let i = 1; i <= 5; i++) {
    const task = createTestSubtask(`P1.M1.T1.S${i}`, `Task ${i}`, 'Planned');
    await queue.enqueue(task, backlog);
  }

  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, 300));

  // VERIFY: Never exceeded maxSize
  expect(maxActive.value).toBeLessThanOrEqual(2);
});
```

### Mocking Patterns for Testing

#### 1. Module Mocking Setup
```typescript
// Mock the prp-generator module
vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn(),
}));

// Import PRPGenerator after mocking
import { PRPGenerator } from '../../../src/agents/prp-generator.js';

// Cast mocked constructor
const MockPRPGenerator = PRPGenerator as any;
```

#### 2. Mocked Implementation with Different Behaviors
```typescript
// Basic mock
mockGenerate.mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));

// Sequential mocks
mockGenerate
  .mockRejectedValueOnce(new Error('Task 1 failed'))
  .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S2'))
  .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S3'));

// Mock with timing
mockGenerate.mockImplementation(async (task: Subtask) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return createTestPRPDocument(task.id);
});
```

#### 3. Concurrency Tracking Helper
```typescript
function trackConcurrency() {
  const state = { active: 0, max: 0, startOrder: [] as string[] };

  return {
    trackStart: (id: string) => {
      state.active++;
      state.max = Math.max(state.max, state.active);
      state.startOrder.push(id);
    },
    trackEnd: () => {
      state.active--;
    },
    getState: () => state,
  };
}
```

### Naming Conventions for Test Files

#### File Structure
- Unit tests: `tests/unit/[category]/[filename].test.ts`
- Integration tests: `tests/integration/[category]/[filename].test.ts`
- Manual tests: `tests/manual/[filename].test.ts`

#### Test Naming Patterns
1. **Constructor Tests**:
   - `should store [property] as readonly property`
   - `should set [parameter] from constructor parameter`
   - `should use default [parameter] when not specified`

2. **Concurrency Tests**:
   - `should process up to maxSize tasks concurrently`
   - `should only run maxSize tasks simultaneously`
   - `should start waiting task when capacity available`
   - `should complete tasks out of order based on timing`

3. **Error Handling Tests**:
   - `should propagate [ErrorType] from waitForPRP`
   - `should remove failed task from researching Map`
   - `should not cache failed results`
   - `should continue processing after error`

## Summary

The ResearchQueue test files demonstrate a comprehensive approach to testing concurrency with:

1. **Separate unit and integration test layers**
2. **Comprehensive mocking of dependencies**
3. **Factory functions for test data creation**
4. **Concurrency tracking for verification**
5. **Edge case and error scenario testing**
6. **Performance and timing verification**
7. **Cache deduplication testing**

These patterns provide a solid foundation for implementing tests for concurrency configuration parameters in similar classes.
