# Vitest Integration Testing Best Practices for Queue-Based Concurrent Processing Systems

**Research Date:** 2026-01-26
**Focus:** Node.js/TypeScript projects with queue-based concurrent processing
**Context:** ResearchQueue implementation testing patterns

---

## Table of Contents

1. [Essential Vitest Documentation](#essential-vitest-documentation)
2. [Mock Setup Patterns for Integration Tests](#mock-setup-patterns-for-integration-tests)
3. [Testing Concurrent Execution Limits](#testing-concurrent-execution-limits)
4. [Testing Cache Behavior and Deduplication](#testing-cache-behavior-and-deduplication)
5. [Testing Error Handling in Async Queue Systems](#testing-error-handling-in-async-queue-systems)
6. [Best Practices for Test Constants and Factory Functions](#best-practices-for-test-constants-and-factory-functions)
7. [Integration Test Structure Patterns (SETUP, EXECUTE, VERIFY)](#integration-test-structure-patterns)
8. [Common Pitfalls and How to Avoid Them](#common-pitfalls-and-how-to-avoid-them)

---

## Essential Vitest Documentation

### Core Documentation URLs

| Resource                 | URL                                                | Description                      |
| ------------------------ | -------------------------------------------------- | -------------------------------- |
| **Vitest Guide**         | https://vitest.dev/guide/                          | Main documentation with examples |
| **API Reference**        | https://vitest.dev/api/                            | Complete API documentation       |
| **Mocking Guide**        | https://vitest.dev/guide/mocking.html              | vi.mock, vi.hoisted patterns     |
| **Testing Requirements** | https://vitest.dev/guide/testing-requirements.html | Test configuration and setup     |
| **Matchers**             | https://vitest.dev/api/expect.html                 | Built-in assertion matchers      |
| **Mock Functions**       | https://vitest.dev/api/vi.html                     | vi.fn(), vi.spyOn() reference    |

### Key Sections for Queue Testing

- **Async Testing:** https://vitest.dev/guide/#testing-async-code
- **Timer Mocks:** https://vitest.dev/guide/mocking.html#timers
- **Module Mocking:** https://vitest.dev/guide/mocking.html#modules
- **Test Context:** https://vitest.dev/advanced/api.html

---

## Mock Setup Patterns for Integration Tests

### Pattern 1: vi.hoisted() with vi.mock() for Early Binding

**When to use:** When you need to mock modules before they're imported, essential for integration tests with real dependencies.

```typescript
// research-queue.integration.test.ts
import { describe, expect, it, beforeEach, vi } from 'vitest';

// =============================================================================
// Mock Setup with vi.hoisted() - REQUIRED for Vitest integration tests
// =============================================================================

const { mockLogger, mockGenerate } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  mockGenerate: vi.fn(),
}));

// Mock modules BEFORE importing the code under test
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}));
```

**Key Benefits:**

- Mocks are available at import time
- Shared mock state across tests
- Real queue logic tested, mocked dependencies

**Best Practices:**

1. Define mock functions in `vi.hoisted()` to make them available before imports
2. Use descriptive names like `mockLogger`, `mockGenerate`
3. Reset mocks in `beforeEach()` to ensure test isolation

### Pattern 2: Partial Mocking with importOriginal

**When to use:** When you need to mock some exports but keep others real.

```typescript
// task-orchestrator.test.ts
vi.mock('../../../src/utils/task-utils.js', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../../src/utils/task-utils.js')>();
  return {
    ...actual, // Preserve real implementations
    getNextPendingItem: vi.fn(), // Mock only what's needed
  };
});
```

**Key Benefits:**

- Keeps real implementations for most functions
- Only mocks what's necessary for test control
- Reduces mock maintenance overhead

### Pattern 3: Dynamic Import in beforeEach

**When to use:** When you need fresh instances for each test with different mock configurations.

```typescript
describe('ResearchQueue Integration Tests', () => {
  let ResearchQueue: any;

  beforeEach(async () => {
    // Clear all mocks and reset mock state
    vi.clearAllMocks();
    mockGenerate.mockReset();
    mockGenerate.mockImplementation(async (task: Subtask) => {
      return createTestPRPDocument(task.id);
    });

    // Import AFTER mocks are set up
    const module = await import('../../../src/core/research-queue.js');
    ResearchQueue = module.ResearchQueue;
  });
});
```

**Key Benefits:**

- Clean test isolation
- Different mock behaviors per test suite
- Prevents state leakage between tests

---

## Testing Concurrent Execution Limits

### Pattern 1: Concurrency Tracking with State Objects

**When to use:** Verifying that queue respects concurrency limits (e.g., maxSize=3).

```typescript
/**
 * Concurrency tracking helper for testing concurrent execution limits
 *
 * Uses wrapper objects to track state across async operations
 */
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

// Test usage
it('should process up to maxSize tasks concurrently', async () => {
  // SETUP: Create mock with concurrency tracking
  const tracker = trackConcurrency();
  const tasks = [
    createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned'),
    createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned'),
    createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned'),
    createTestSubtask('P1.M1.T1.S4', 'Task 4', 'Planned'),
    createTestSubtask('P1.M1.T1.S5', 'Task 5', 'Planned'),
  ];

  mockGenerate.mockImplementation(async (task: Subtask) => {
    tracker.trackStart(task.id);
    await new Promise(resolve => setTimeout(resolve, 100));
    tracker.trackEnd();
    return createTestPRPDocument(task.id);
  });

  const queue = new ResearchQueue(mockSessionManager, 3);
  const backlog = createTestBacklog([]);

  // EXECUTE: Enqueue all tasks
  for (const task of tasks) {
    await queue.enqueue(task, backlog);
  }

  // Wait for all to complete
  await Promise.all(tasks.map(t => queue.waitForPRP(t.id).catch(() => {})));

  // VERIFY: Concurrency limit was never exceeded
  expect(tracker.getState().max).toBeLessThanOrEqual(3);
  expect(tracker.getState().startOrder.slice(0, 3).sort()).toEqual([
    'P1.M1.T1.S1',
    'P1.M1.T1.S2',
    'P1.M1.T1.S3',
  ]);
});
```

**Key Techniques:**

- Use wrapper objects (`{ value: 0 }`) to track state across async operations
- Delay mock operations with `setTimeout()` to simulate real work
- Track `startOrder` to verify which tasks started first

### Pattern 2: Serial Processing Verification

**When to use:** Testing that queue correctly limits to 1 concurrent operation.

```typescript
it('should execute serially with concurrency=1', async () => {
  // SETUP: Track execution order
  const executionOrder: string[] = [];

  mockGenerate.mockImplementation(async (task: Subtask) => {
    executionOrder.push(task.id);
    await new Promise(resolve => setTimeout(resolve, 50));
    return createTestPRPDocument(task.id);
  });

  const queue = new ResearchQueue(mockSessionManager, 1); // Serial processing
  const backlog = createTestBacklog([]);

  const tasks = [
    createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned'),
    createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned'),
    createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned'),
  ];

  // EXECUTE: Enqueue all tasks
  for (const task of tasks) {
    await queue.enqueue(task, backlog);
  }

  // Wait for all to complete sequentially (not in parallel)
  await queue.waitForPRP('P1.M1.T1.S1');
  await queue.waitForPRP('P1.M1.T1.S2');
  await queue.waitForPRP('P1.M1.T1.S3');

  // VERIFY: Tasks executed in order (serial processing)
  expect(executionOrder).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']);
});
```

### Pattern 3: Active Count Tracking

**When to use:** Simple concurrency limit verification without order tracking.

```typescript
it('should only run maxSize tasks simultaneously', async () => {
  // SETUP: Track active operations with wrapper object
  const activeCount = { value: 0 };
  const maxActive = { value: 0 };

  mockGenerate.mockImplementation(async (task: Subtask) => {
    activeCount.value++;
    maxActive.value = Math.max(maxActive.value, activeCount.value);
    await new Promise(resolve => setTimeout(resolve, 100));
    activeCount.value--;
    return createTestPRPDocument(task.id);
  });

  const queue = new ResearchQueue(mockSessionManager, 3);
  const backlog = createTestBacklog([]);

  // Enqueue 5 tasks
  for (let i = 1; i <= 5; i++) {
    const task = createTestSubtask(`P1.M1.T1.S${i}`, `Task ${i}`, 'Planned');
    await queue.enqueue(task, backlog);
  }

  // Wait for all to complete
  await new Promise(resolve => setTimeout(resolve, 300));

  // VERIFY: Never exceeded maxSize
  expect(maxActive.value).toBeLessThanOrEqual(3);
});
```

---

## Testing Cache Behavior and Deduplication

### Pattern 1: Pre-populated Cache Testing

**When to use:** Verifying that queue skips generation when results are cached.

```typescript
it('should skip generation if task already cached', async () => {
  // SETUP: Pre-populate results Map with PRP
  const queue = new ResearchQueue(mockSessionManager, 3);
  const cachedPRP = createTestPRPDocument('P1.M1.T1.S1');
  queue.results.set('P1.M1.T1.S1', cachedPRP);

  const backlog = createTestBacklog([]);
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

  // EXECUTE: Enqueue same task
  await queue.enqueue(task, backlog);

  // VERIFY: generate() not called (call count = 0)
  expect(mockGenerate).not.toHaveBeenCalled();

  // VERIFY: getPRP() returns cached result
  const prp = queue.getPRP('P1.M1.T1.S1');
  expect(prp).toEqual(cachedPRP);
});
```

### Pattern 2: Concurrent Deduplication Testing

**When to use:** Ensuring concurrent requests for the same task only generate once.

```typescript
it('should deduplicate concurrent requests for same task', async () => {
  // SETUP: Mock generate with delay
  let generateCallCount = 0;
  mockGenerate.mockImplementation(async (task: Subtask) => {
    generateCallCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
    return createTestPRPDocument(task.id);
  });

  const queue = new ResearchQueue(mockSessionManager, 3);
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');
  const backlog = createTestBacklog([]);

  // EXECUTE: Enqueue same task 3 times concurrently
  const promises = [
    queue.enqueue(task, backlog),
    queue.enqueue(task, backlog),
    queue.enqueue(task, backlog),
  ];

  await Promise.all(promises);
  const prp = await queue.waitForPRP('P1.M1.T1.S1');

  // VERIFY: Only generated once
  expect(generateCallCount).toBe(1);

  // VERIFY: PRP is available
  expect(prp).toBeDefined();
  expect(queue.getPRP('P1.M1.T1.S1')).toBeDefined();
});
```

### Pattern 3: Cache Speed Verification

**When to use:** Verifying that cached results return immediately.

```typescript
it('should cache successful results', async () => {
  // SETUP: Mock generate to resolve with PRP
  mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));

  const queue = new ResearchQueue(mockSessionManager, 3);
  const backlog = createTestBacklog([]);
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

  // EXECUTE: Enqueue and wait for completion
  await queue.enqueue(task, backlog);
  await queue.waitForPRP('P1.M1.T1.S1');

  // VERIFY: getPRP() returns cached result
  const prp = queue.getPRP('P1.M1.T1.S1');
  expect(prp).toBeDefined();
  expect(prp?.taskId).toBe('P1.M1.T1.S1');

  // VERIFY: waitForPRP() returns immediately on second call
  const startTime = Date.now();
  await queue.waitForPRP('P1.M1.T1.S1');
  const elapsed = Date.now() - startTime;
  expect(elapsed).toBeLessThan(10); // Should be nearly instant
});
```

### Pattern 4: No-Cache Parameter Testing

**When to use:** Verifying that cache bypass flag is correctly forwarded.

```typescript
// Test constants for ResearchQueue constructor parameters
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

describe('noCache parameter', () => {
  it('should forward noCache=true to PRPGenerator', () => {
    // SETUP
    const mockManager = createMockSessionManager(currentSession);
    const mockGenerate = vi
      .fn()
      .mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));
    MockPRPGenerator.mockImplementation(() => ({
      generate: mockGenerate,
    }));

    // EXECUTE
    new ResearchQueue(
      mockManager,
      DEFAULT_MAX_SIZE,
      true, // noCache = true
      DEFAULT_CACHE_TTL_MS
    );

    // VERIFY
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      true, // noCache forwarded correctly
      DEFAULT_CACHE_TTL_MS
    );
  });
});
```

---

## Testing Error Handling in Async Queue Systems

### Pattern 1: Fire-and-Forget Error Handling

**When to use:** Verifying that errors don't block queue processing.

```typescript
describe('Fire-and-Forget Error Handling', () => {
  it('should log errors but continue processing queue', async () => {
    // SETUP: Mock logger to capture error logs
    // Mock generator to fail first, succeed others
    mockGenerate
      .mockRejectedValueOnce(new Error('Task 1 failed'))
      .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S2'))
      .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S3'));

    const queue = new ResearchQueue(mockSessionManager, 3);
    const backlog = createTestBacklog([]);

    const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
    const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');
    const task3 = createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned');

    // EXECUTE: Enqueue all tasks and capture promises
    await queue.enqueue(task1, backlog);
    const task1Promise = queue.waitForPRP('P1.M1.T1.S1');
    await queue.enqueue(task2, backlog);
    await queue.enqueue(task3, backlog);

    // Wait for task1 to fail
    await expect(task1Promise).rejects.toThrow('Task 1 failed');

    // VERIFY: Error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'P1.M1.T1.S1',
        error: 'Task 1 failed',
      }),
      expect.stringContaining('PRP generation failed')
    );

    // VERIFY: Other tasks still completed
    const prp2 = await queue.waitForPRP('P1.M1.T1.S2');
    const prp3 = await queue.waitForPRP('P1.M1.T1.S3');
    expect(prp2).toBeDefined();
    expect(prp3).toBeDefined();
  });
});
```

### Pattern 2: No Caching of Failed Results

**When to use:** Verifying that failed operations aren't cached.

```typescript
it('should not cache failed results', async () => {
  // SETUP: Mock generate to reject with error
  mockGenerate.mockRejectedValueOnce(new Error('Generation failed'));

  const queue = new ResearchQueue(mockSessionManager, 3);
  const backlog = createTestBacklog([]);
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

  // EXECUTE: Enqueue task and wait for error
  await queue.enqueue(task, backlog);

  try {
    await queue.waitForPRP('P1.M1.T1.S1');
  } catch {
    // Expected error
  }

  // VERIFY: getPRP() returns null after failure
  expect(queue.getPRP('P1.M1.T1.S1')).toBeNull();

  // VERIFY: Task can be retried (enqueue again)
  mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));
  await queue.enqueue(task, backlog);
  const prp = await queue.waitForPRP('P1.M1.T1.S1');
  expect(prp).toBeDefined();
});
```

### Pattern 3: Cleanup Verification

**When to use:** Ensuring resources are cleaned up even on errors.

```typescript
it('should clean up in finally block even on error', async () => {
  // SETUP: Mock generate to reject with error
  mockGenerate.mockRejectedValueOnce(new Error('Task failed'));

  const queue = new ResearchQueue(mockSessionManager, 3);
  const backlog = createTestBacklog([]);
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

  // EXECUTE: Enqueue failing task
  await queue.enqueue(task, backlog);

  try {
    await queue.waitForPRP('P1.M1.T1.S1');
  } catch {
    // Expected error
  }

  // VERIFY: isResearching() returns false after error
  expect(queue.isResearching('P1.M1.T1.S1')).toBe(false);

  // VERIFY: Task removed from researching Map
  expect(queue.researching.has('P1.M1.T1.S1')).toBe(false);
});
```

### Pattern 4: Continuation After Error

**When to use:** Verifying queue continues processing after errors.

```typescript
it('should continue processing after error in queue', async () => {
  // SETUP: First task fails, rest succeed
  mockGenerate
    .mockRejectedValueOnce(new Error('Task 1 failed'))
    .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S2'))
    .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S3'))
    .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S4'));

  const queue = new ResearchQueue(mockSessionManager, 2);
  const backlog = createTestBacklog([]);

  const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
  const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');
  const task3 = createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned');
  const task4 = createTestSubtask('P1.M1.T1.S4', 'Task 4', 'Planned');

  // EXECUTE: Enqueue all tasks
  await queue.enqueue(task1, backlog);
  const waitForTask1 = queue.waitForPRP('P1.M1.T1.S1').catch(() => ({}));
  await queue.enqueue(task2, backlog);
  await queue.enqueue(task3, backlog);
  await queue.enqueue(task4, backlog);

  // Wait for task1 to fail
  await waitForTask1;

  // VERIFY: Error was logged
  expect(mockLogger.warn).toHaveBeenCalledWith(
    expect.objectContaining({
      taskId: 'P1.M1.T1.S1',
      error: 'Task 1 failed',
    }),
    expect.stringContaining('PRP generation failed')
  );

  // VERIFY: All other tasks still complete
  const prp2 = await queue.waitForPRP('P1.M1.T1.S2');
  const prp3 = await queue.waitForPRP('P1.M1.T1.S3');
  const prp4 = await queue.waitForPRP('P1.M1.T1.S4');

  expect(prp2).toBeDefined();
  expect(prp3).toBeDefined();
  expect(prp4).toBeDefined();
});
```

---

## Best Practices for Test Constants and Factory Functions

### Pattern 1: Centralized Test Constants

**When to use:** Defining reusable constants that represent production defaults.

```typescript
// Test constants for ResearchQueue constructor parameters
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

describe('ResearchQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default maxSize of 3 when not specified', async () => {
      // SETUP
      const mockManager = createMockSessionManager(currentSession);
      const mockGenerate = vi
        .fn()
        .mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));
      MockPRPGenerator.mockImplementation(() => ({
        generate: mockGenerate,
      }));

      // EXECUTE
      const queue = new ResearchQueue(
        mockManager,
        DEFAULT_MAX_SIZE,
        DEFAULT_NO_CACHE,
        DEFAULT_CACHE_TTL_MS
      );

      // VERIFY
      expect(queue.maxSize).toBe(3);
    });
  });
});
```

**Benefits:**

- Single source of truth for default values
- Easy to update when defaults change
- Self-documenting test intent

### Pattern 2: Factory Functions for Test Data

**When to use:** Creating complex test objects with sensible defaults.

```typescript
/**
 * Creates a test Subtask with configurable properties
 */
function createTestSubtask(
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask {
  return {
    id,
    type: 'Subtask',
    title,
    status,
    story_points: 2,
    dependencies,
    context_scope,
  };
}

/**
 * Creates a test PRPDocument for the given task ID
 */
function createTestPRPDocument(taskId: string): PRPDocument {
  return {
    taskId,
    objective: `Test objective for ${taskId}`,
    context: '## Context\n\nTest context content.',
    implementationSteps: [`Step 1 for ${taskId}`, `Step 2 for ${taskId}`],
    validationGates: [
      {
        level: 1,
        description: 'Syntax check',
        command: 'npm run lint',
        manual: false,
      },
      {
        level: 2,
        description: 'Unit tests',
        command: 'npm test',
        manual: false,
      },
      {
        level: 3,
        description: 'Integration tests',
        command: 'npm run test:integration',
        manual: false,
      },
      {
        level: 4,
        description: 'Manual validation',
        command: null,
        manual: true,
      },
    ],
    successCriteria: [
      { description: `Criterion 1 for ${taskId}`, satisfied: false },
      { description: `Criterion 2 for ${taskId}`, satisfied: false },
    ],
    references: [`src/test-${taskId}.ts`],
  };
}

/**
 * Creates a test Backlog from an array of phases
 */
function createTestBacklog(phases: any[]): Backlog {
  return { backlog: phases };
}

/**
 * Creates a mock SessionManager with the given current session
 */
function createMockSessionManager(currentSession: any): SessionManager {
  const mockManager = {
    currentSession,
  } as unknown as SessionManager;
  return mockManager;
}

/**
 * Creates a default mock session for testing
 */
function createMockSession(): any {
  return {
    metadata: {
      id: '001_14b9dc2a33c7',
      hash: '14b9dc2a33c7',
      path: '/plan/001_14b9dc2a33c7',
      createdAt: new Date(),
      parentSession: null,
    },
    prdSnapshot: '# Test PRD',
    taskRegistry: createTestBacklog([]),
    currentItemId: null,
  };
}
```

**Benefits:**

- Reduces test boilerplate
- Consistent test data structure
- Easy to extend for specific test scenarios
- Default parameters for common cases

### Pattern 3: Helper Functions for Complex Scenarios

**When to use:** Encapsulating complex test setup logic.

```typescript
/**
 * Concurrency tracking helper for testing concurrent execution limits
 *
 * Uses wrapper objects to track state across async operations
 */
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

// Usage in test
it('should respect concurrency limit', async () => {
  const tracker = trackConcurrency();
  mockGenerate.mockImplementation(async (task: Subtask) => {
    tracker.trackStart(task.id);
    await new Promise(resolve => setTimeout(resolve, 100));
    tracker.trackEnd();
    return createTestPRPDocument(task.id);
  });

  // ... test logic ...
  expect(tracker.getState().max).toBeLessThanOrEqual(3);
});
```

---

## Integration Test Structure Patterns (SETUP, EXECUTE, VERIFY)

### Standard Three-Phase Pattern

**Every test should follow this structure:**

```typescript
it('should describe what the test verifies', async () => {
  // ==========================================================================
  // SETUP: Prepare test state, mocks, and data
  // ==========================================================================
  const mockGenerate = vi
    .fn()
    .mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));
  const queue = new ResearchQueue(mockSessionManager, 3);
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

  // ==========================================================================
  // EXECUTE: Perform the action being tested
  // ==========================================================================
  await queue.enqueue(task, backlog);
  const result = await queue.waitForPRP('P1.M1.T1.S1');

  // ==========================================================================
  // VERIFY: Assert expected outcomes
  // ==========================================================================
  expect(result).toBeDefined();
  expect(result.taskId).toBe('P1.M1.T1.S1');
  expect(mockGenerate).toHaveBeenCalledTimes(1);
});
```

### Pattern 1: Simple Action-Verification

```typescript
it('should add task to queue', async () => {
  // SETUP
  const queue = new ResearchQueue(mockSessionManager, 0); // maxSize=0, no processing
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Subtask', 'Planned');
  const backlog = createTestBacklog([]);

  // EXECUTE
  await queue.enqueue(task, backlog);

  // VERIFY: Task should be in queue (not processed because maxSize=0)
  expect(queue.queue).toContain(task);
});
```

### Pattern 2: State Change Verification

```typescript
it('should remove from researching Map after completion', async () => {
  // SETUP
  const expectedPRP = createTestPRPDocument('P1.M1.T1.S1');
  const mockGenerate = vi.fn().mockResolvedValue(expectedPRP);
  MockPRPGenerator.mockImplementation(() => ({
    generate: mockGenerate,
  }));
  const queue = new ResearchQueue(mockSessionManager, DEFAULT_MAX_SIZE);
  const task = createTestSubtask('P1.M1.T1.S1', 'Test Subtask', 'Planned');
  const backlog = createTestBacklog([]);

  // EXECUTE
  await queue.enqueue(task, backlog);
  await queue.waitForPRP('P1.M1.T1.S1'); // Wait for completion

  // VERIFY: Should be removed from researching
  expect(queue.researching.has('P1.M1.T1.S1')).toBe(false);
});
```

### Pattern 3: Multi-Step Scenario

```typescript
it('should handle cache hit during concurrent processing', async () => {
  // SETUP: Mock generate with delay
  mockGenerate.mockImplementation(async (task: Subtask) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return createTestPRPDocument(task.id);
  });

  const queue = new ResearchQueue(mockSessionManager, 3);
  const backlog = createTestBacklog([]);

  const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
  const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');

  // EXECUTE: Enqueue first task twice, then second task
  await queue.enqueue(task1, backlog);
  await queue.enqueue(task2, backlog);

  // Enqueue task1 again while it's still processing
  await queue.enqueue(task1, backlog);

  // Wait for completion
  await queue.waitForPRP('P1.M1.T1.S1');
  await queue.waitForPRP('P1.M1.T1.S2');

  // VERIFY: task1 only generated once
  expect(mockGenerate).toHaveBeenCalledWith(task1, backlog);
  expect(mockGenerate).toHaveBeenCalledWith(task2, backlog);
  expect(mockGenerate).toHaveBeenCalledTimes(2);
});
```

### Pattern 4: Error Scenario Verification

```typescript
it('should throw for unknown task', async () => {
  // SETUP
  const queue = new ResearchQueue(mockSessionManager, DEFAULT_MAX_SIZE);

  // EXECUTE & VERIFY: Should throw for unknown task
  await expect(queue.waitForPRP('P1.M1.T1.S999')).rejects.toThrow(
    'No PRP available for task P1.M1.T1.S999'
  );
});
```

### Pattern 5: Integration Test with Real Dependencies

```typescript
describe('execute() with real dependencies', () => {
  it('should successfully execute PRP with mocked agent and real BashMCP', async () => {
    // SETUP
    const prp = createMockPRPDocument('P1.M2.T2.S2');
    const prpPath = '/tmp/test-session/prps/P1M2T2S2.md';

    // Mock Coder Agent to return success
    mockAgent.prompt.mockResolvedValue(
      JSON.stringify({
        result: 'success',
        message: 'Implementation complete',
      })
    );

    const executor = new PRPExecutor(sessionPath);

    // EXECUTE
    const result = await executor.execute(prp, prpPath);

    // VERIFY: Execution succeeded
    expect(result.success).toBe(true);
    expect(result.fixAttempts).toBe(0);
    expect(result.validationResults).toHaveLength(4);

    // VERIFY: All validation gates executed with real BashMCP
    const level1Result = result.validationResults.find(r => r.level === 1);
    const level2Result = result.validationResults.find(r => r.level === 2);

    expect(level1Result?.success).toBe(true);
    expect(level1Result?.stdout).toContain('Syntax check passed');
    expect(level2Result?.success).toBe(true);
    expect(level2Result?.stdout).toContain('Unit tests passed');
  });
});
```

---

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Not Waiting for Async Cleanup

**Problem:** Tests pass locally but fail in CI due to race conditions.

```typescript
// BAD: Doesn't wait for cleanup
it('should process all tasks', async () => {
  await Promise.all(tasks.map(t => queue.enqueue(t, backlog)));

  // No wait - cleanup might not be complete
  expect(queue.getStats().cached).toBe(4);
});

// GOOD: Waits for cleanup
it('should process all tasks', async () => {
  await Promise.all(tasks.map(t => queue.enqueue(t, backlog)));

  // Wait for all to complete
  await Promise.all(tasks.map(t => queue.waitForPRP(t.id).catch(() => {})));

  // Wait for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 150));

  expect(queue.getStats().cached).toBe(4);
});
```

**Solution:** Always wait for async operations and cleanup to complete.

### Pitfall 2: Shared State Between Tests

**Problem:** Tests interfere with each other.

```typescript
// BAD: Shared state
let globalCounter = 0;

it('should increment counter', async () => {
  globalCounter++;
  expect(globalCounter).toBe(1);
});

it('should have fresh counter', async () => {
  // Fails because globalCounter is still 1
  expect(globalCounter).toBe(0);
});

// GOOD: Isolated state
it('should increment counter', async () => {
  const counter = { value: 0 };
  counter.value++;
  expect(counter.value).toBe(1);
});
```

**Solution:** Use local variables or beforeEach to reset state.

### Pitfall 3: Not Resetting Mocks

**Problem:** Mock call counts accumulate across tests.

```typescript
// BAD: Doesn't reset mocks
describe('tests', () => {
  it('first test', async () => {
    mockGenerate.mockResolvedValueOnce(createTestPRPDocument('T1'));
    await queue.enqueue(task1, backlog);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('second test', async () => {
    // Fails because mockGenerate was called in previous test
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});

// GOOD: Resets mocks in beforeEach
describe('tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerate.mockReset();
    mockGenerate.mockImplementation(async (task: Subtask) => {
      return createTestPRPDocument(task.id);
    });
  });

  it('first test', async () => {
    mockGenerate.mockResolvedValueOnce(createTestPRPDocument('T1'));
    await queue.enqueue(task1, backlog);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('second test', async () => {
    // Passes because mocks were reset
    expect(mockGenerate).toHaveBeenCalledTimes(0);
  });
});
```

**Solution:** Always clear and reset mocks in beforeEach.

### Pitfall 4: Testing Implementation Details

**Problem:** Tests break when implementation changes.

```typescript
// BAD: Tests internal implementation
it('should set researching flag', async () => {
  await queue.enqueue(task, backlog);
  expect(queue.researching.has('P1.M1.T1.S1')).toBe(true);
});

// GOOD: Tests observable behavior
it('should report task as being researched', async () => {
  await queue.enqueue(task, backlog);
  expect(queue.isResearching('P1.M1.T1.S1')).toBe(true);
});
```

**Solution:** Test public APIs and behavior, not internal state.

### Pitfall 5: Inconsistent Mock Timing

**Problem:** Race conditions in tests.

```typescript
// BAD: Inconsistent delays
it('should process concurrently', async () => {
  mockGenerate.mockImplementation(async (task: Subtask) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    return createTestPRPDocument(task.id);
  });
  // Unreliable assertions
});

// GOOD: Predictable delays
it('should process concurrently', async () => {
  mockGenerate.mockImplementation(async (task: Subtask) => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Consistent
    return createTestPRPDocument(task.id);
  });
  // Reliable assertions
});
```

**Solution:** Use consistent timing in mocks for predictable test execution.

### Pitfall 6: Not Using vi.hoisted for Early Mocks

**Problem:** Mocks not applied at import time.

```typescript
// BAD: Mock defined after import
import { ResearchQueue } from './research-queue.js';
vi.mock('./prp-generator.js', () => ({ ... })); // Too late!

// GOOD: Mock defined before import
vi.mock('./prp-generator.js', () => ({ ... })); // Before import
import { ResearchQueue } from './research-queue.js';
```

**Solution:** Always use vi.mock() and vi.hoisted() before imports.

### Pitfall 7: Missing Error Verification

**Problem:** Errors are swallowed without verification.

```typescript
// BAD: Doesn't verify error
it('should handle errors', async () => {
  mockGenerate.mockRejectedValue(new Error('Failed'));
  await queue.enqueue(task, backlog);
  // No verification
});

// GOOD: Verifies error handling
it('should handle errors', async () => {
  mockGenerate.mockRejectedValue(new Error('Failed'));
  await queue.enqueue(task, backlog);

  await expect(queue.waitForPRP('P1.M1.T1.S1')).rejects.toThrow('Failed');
  expect(mockLogger.warn).toHaveBeenCalledWith(
    expect.objectContaining({ error: 'Failed' }),
    expect.stringContaining('PRP generation failed')
  );
});
```

**Solution:** Always verify errors are handled correctly.

---

## Additional Resources

### Vitest Configuration Examples

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.test.ts', '**/*.unit.test.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

### Best Practices Summary

1. **Use vi.hoisted() for mocks that need to be available at import time**
2. **Always reset mocks in beforeEach()**
3. **Use factory functions for test data**
4. **Follow SETUP, EXECUTE, VERIFY pattern**
5. **Wait for async cleanup to complete**
6. **Test behavior, not implementation**
7. **Use consistent timing in mocks**
8. **Verify error handling explicitly**
9. **Use descriptive test names**
10. **Keep tests isolated and independent**

---

## Related Test Files in This Project

- `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` - Unit tests with 100% coverage
- `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` - Integration tests with concurrent behavior
- `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts` - Complex orchestrator tests
- `/home/dustin/projects/hacky-hack/tests/integration/prp-executor-integration.test.ts` - Real dependency integration tests

---

**Document Version:** 1.0
**Last Updated:** 2026-01-26
**Maintained By:** P1.M1.T1.S3 Research Team
