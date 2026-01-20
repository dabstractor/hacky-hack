# Product Requirement Prompt (PRP): P1.M1.T2.S3 - Verify parallel PRP generation via ResearchQueue

---

## Goal

**Feature Goal**: Verify that ResearchQueue correctly processes parallel PRP generation with concurrency limit of 3, fire-and-forget error handling, dependency ordering, and cache checking through comprehensive integration tests.

**Deliverable**: Integration test file `tests/integration/core/research-queue.test.ts` with test cases for concurrent PRP generation, error handling, dependency ordering, and cache behavior.

**Success Definition**: All tests pass, verifying:
- ResearchQueue processes up to 3 tasks concurrently (respecting maxSize)
- Queue respects dependency ordering (no research for blocked tasks via TaskOrchestrator)
- Errors are logged but don't block queue processing (fire-and-forget pattern)
- Cache is checked before generating new PRPs (deduplication)
- Queue statistics accurately reflect queue state during concurrent operations

## Why

- ResearchQueue is the core component for parallel PRP generation with controlled concurrency
- The fire-and-forget pattern is critical for resilience - errors should not block the entire queue
- Dependency ordering must be enforced through TaskOrchestrator's `canExecute()` (verified in P1.M1.T2.S2)
- Cache deduplication prevents redundant PRP generation for the same task
- No existing integration tests verify concurrent behavior with real PRPGenerator mocking
- Unit tests exist (`tests/unit/core/research-queue.test.ts`) but don't test concurrent execution with realistic timing

## What

Integration tests that verify ResearchQueue correctly manages concurrent PRP generation with proper error handling, cache checking, and dependency awareness.

### Success Criteria

- [ ] ResearchQueue respects concurrency limit (maxSize=3 by default)
- [ ] Only 3 tasks run simultaneously when more are enqueued
- [ ] Fire-and-forget error handling works - errors logged but don't block queue
- [ ] Failed tasks are not cached and can be retried
- [ ] Cache deduplication prevents duplicate PRP generation
- [ ] Concurrent requests for same task deduplicate (only one generation)
- [ ] Queue statistics accurately reflect state during concurrent operations
- [ ] Background cleanup happens in finally block (even on errors)
- [ ] Dependency ordering is respected when combined with TaskOrchestrator

## All Needed Context

### Context Completeness Check

✓ This PRP provides everything needed to implement the integration tests:
- Exact file paths and patterns to follow from existing integration tests
- ResearchQueue and PRPGenerator implementation details
- Mock patterns for controlling timing and simulating errors
- Specific test scenarios with expected outcomes
- References to existing integration test patterns in the codebase

### Documentation & References

```yaml
# MUST READ - Core implementation details
- file: src/core/research-queue.ts
  why: Contains ResearchQueue class with concurrency limiting, fire-and-forget pattern
  lines: 143-145 (concurrency limit check)
  lines: 159-197 (fire-and-forget promise chain with error handling)
  lines: 119-122 (cache deduplication check)
  pattern: Promise chaining with finally block for cleanup

- file: src/agents/prp-generator.ts
  why: Contains PRPGenerator that ResearchQueue uses for PRP generation
  lines: 403 (generate method signature)
  lines: 433-456 (PRP generation flow with cache check, agent call, validation)
  lines: 151 (CACHE_TTL_MS constant - 24 hours)
  pattern: Cache-first generation with retry logic

- file: src/core/task-orchestrator.ts
  why: Contains canExecute() for dependency checking (tested in P1.M1.T2.S2)
  lines: 617-640 (usage in executeSubtask - blocked subtask handling)
  lines: 251-267 (canExecute and getBlockingDependencies methods)
  pattern: Dependency checking before enqueue

# MUST READ - Research documents (in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T2S3/research/research-queue-analysis.md
  why: Complete ResearchQueue API, concurrency limiting, error handling patterns
  section: "Testing Considerations" (edge cases, mock strategies)

- docfile: plan/003_b3d3efdaf0ed/P1M1T2S3/research/prp-generator-analysis.md
  why: PRPGenerator async behavior, cache integration, mocking strategies
  section: "Mocking for Testing" (mockable components, patterns)

- docfile: plan/003_b3d3efdaf0ed/P1M1T2S3/research/integration-test-patterns.md
  why: Existing integration test patterns in hacky-hack codebase
  section: "Concurrent/Async Operations Testing" (ResearchQueue testing pattern)

- docfile: plan/003_b3d3efdaf0ed/P1M1T2S3/research/concurrent-testing-best-practices.md
  why: Best practices for testing concurrent operations, queues, fire-and-forget
  section: "Testing Concurrent Execution with Limits" (active count tracking pattern)

# MUST READ - Existing test patterns to follow
- file: tests/integration/core/task-orchestrator-runtime.test.ts
  why: Contains existing ResearchQueue integration tests
  pattern: Mock PRPGenerator with controlled timing, queue statistics verification
  lines: Look for ResearchQueue instantiation and enqueue patterns

- file: tests/unit/core/research-queue.test.ts
  why: Unit tests with comprehensive coverage - reference for test scenarios
  pattern: Factory functions, mock setup, SETUP/EXECUTE/VERIFY comments
  lines: 34-99 (factory functions for test data creation)

- file: tests/integration/core/delta-session.test.ts
  why: Example integration test with temp directory setup
  pattern: Temp directory creation/cleanup, beforeEach/afterEach structure

# CRITICAL GOTCHA - Mock patterns for integration tests
- file: tests/integration/core/task-orchestrator-runtime.test.ts
  why: Shows how to mock PRPGenerator for integration testing
  pattern: vi.mock('../../../src/agents/prp-generator.js', () => ({
    PRPGenerator: vi.fn().mockImplementation(() => ({ generate: vi.fn() })),
  }))
  gotcha: Must use vi.hoisted() for variables referenced in mock factory

# CRITICAL GOTCHA - Concurrency tracking pattern
- docfile: plan/003_b3d3efdaf0ed/P1M1T2S3/research/concurrent-testing-best-practices.md
  section: "Testing Concurrent Execution with Limits"
  pattern: Use wrapper objects to track active count, record max concurrent
```

### Current Codebase Tree (integration test directory)

```bash
tests/
├── integration/
│   └── core/
│       ├── delta-session.test.ts          # Existing: SessionManager integration
│       ├── session-manager.test.ts        # Existing: Session manager tests
│       ├── session-structure.test.ts      # Existing: Session structure tests
│       ├── task-orchestrator-e2e.test.ts  # Existing: E2E orchestrator tests
│       ├── task-orchestrator-runtime.test.ts  # Existing: Runtime with ResearchQueue
│       └── task-orchestrator.test.ts      # Existing: Orchestrator integration
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── integration/
│   └── core/
│       ├── delta-session.test.ts          # Existing
│       ├── session-manager.test.ts        # Existing
│       ├── session-structure.test.ts      # Existing
│       ├── task-orchestrator-e2e.test.ts  # Existing
│       ├── task-orchestrator-runtime.test.ts  # Existing
│       ├── task-orchestrator.test.ts      # Existing
│       └── research-queue.test.ts         # NEW: ResearchQueue integration tests
```

**New File**: `tests/integration/core/research-queue.test.ts`
- Tests concurrent PRP generation with realistic timing
- Tests fire-and-forget error handling
- Tests cache deduplication behavior
- Tests dependency ordering with TaskOrchestrator integration

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Vitest mock patterns - must use vi.hoisted() for mock variables
const { mockLogger, mockGenerate } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  mockGenerate: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}));

// CRITICAL: ResearchQueue doesn't implement dependency ordering
// Dependency checking is done by TaskOrchestrator before enqueue
// Integration tests should verify the combined behavior

// GOTCHA: Fire-and-forget pattern errors are logged but re-thrown
// waitForPRP() will throw for failed tasks
// But the queue continues processing (finally block always runs)

// CRITICAL: Cache deduplication happens in enqueue() before processNext()
// If task is already in results Map, enqueue returns immediately
// Test this by checking generate() call count vs enqueue count

// GOTCHA: Concurrency limit is checked in processNext(), not enqueue()
// Tasks can be enqueued beyond limit, but won't start until capacity available
// Test by tracking active operations, not just queue length

// CRITICAL: Use controlled delays for predictable concurrent behavior
// Mock generate() with specific delays to control completion order
// Use arrays to track execution order for verification

// GOTCHA: Queue statistics are computed from internal state
// getStats().queued = queue.length
// getStats().researching = researching.size
// getStats().cached = results.size
// Verify these match expected values during concurrent operations

// CRITICAL: Failed tasks are NOT cached
// After waitForPRP() throws, getPRP() returns null
// Task can be retried (enqueue again)
// Test this explicitly

// GOTCHA: Background task failures in finally() are caught and logged
// These don't propagate to caller (fire-and-forget)
// But main promise errors do propagate to waitForPRP()
```

## Implementation Blueprint

### Data Models and Structure

Use existing test fixtures and factory functions from `tests/unit/core/research-queue.test.ts`:

```typescript
// Factory functions (already exist - reuse from unit tests)
const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask => ({
  id, type: 'Subtask', title, status, story_points: 2, dependencies, context_scope
});

const createTestPRPDocument = (taskId: string): PRPDocument => ({
  taskId,
  objective: `Test objective for ${taskId}`,
  context: '## Context\n\nTest context content.',
  implementationSteps: [`Step 1 for ${taskId}`, `Step 2 for ${taskId}`],
  validationGates: [
    { level: 1, description: 'Syntax check', command: 'npm run lint', manual: false },
    { level: 2, description: 'Unit tests', command: 'npm test', manual: false },
    { level: 3, description: 'Integration tests', command: 'npm run test:integration', manual: false },
    { level: 4, description: 'Manual validation', command: null, manual: true },
  ],
  successCriteria: [
    { description: `Criterion 1 for ${taskId}`, satisfied: false },
    { description: `Criterion 2 for ${taskId}`, satisfied: false },
  ],
  references: [`src/test-${taskId}.ts`],
});

const createTestBacklog = (phases: any[]): Backlog => ({ backlog: phases });
const createMockSessionManager = (currentSession: any): SessionManager => {
  const mockManager = { currentSession } as unknown as SessionManager;
  return mockManager;
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/core/research-queue.test.ts
  - IMPLEMENT: File header with JSDoc comments describing integration test purpose
  - IMPLEMENT: Import statements for Vitest, ResearchQueue, types, mocks
  - IMPLEMENT: Mock setup with vi.hoisted() for logger and PRPGenerator
  - FOLLOW pattern: tests/integration/core/task-orchestrator-runtime.test.ts (mock setup)
  - NAMING: research-queue.test.ts (matches file naming convention)
  - PLACEMENT: tests/integration/core/ directory

Task 2: IMPLEMENT factory functions and test data helpers
  - IMPLEMENT: createTestSubtask (reuse from unit tests)
  - IMPLEMENT: createTestPRPDocument (reuse from unit tests)
  - IMPLEMENT: createTestBacklog (reuse from unit tests)
  - IMPLEMENT: createMockSessionManager (reuse from unit tests)
  - IMPLEMENT: Concurrency tracking helper (new):
    - activeCount: { value: number }
    - maxActive: { value: number }
    - startOrder: string[]
  - DEPENDENCIES: Import Status, Subtask, Backlog, PRPDocument, SessionManager types

Task 3: IMPLEMENT describe block structure with beforeEach/afterEach
  - IMPLEMENT: Main describe block 'ResearchQueue Integration Tests'
  - IMPLEMENT: beforeEach to set up mocks and fresh ResearchQueue instance
  - IMPLEMENT: afterEach to clear all mocks (vi.clearAllMocks())
  - FOLLOW pattern: tests/integration/core/delta-session.test.ts (test structure)

Task 4: IMPLEMENT concurrency limit tests
  - CREATE: describe block 'Concurrent Processing'
  - IMPLEMENT: test 'should process up to maxSize tasks concurrently'
    - SETUP: Create 5 tasks with controlled delays (100ms each)
    - SETUP: Track active operations with wrapper object
    - EXECUTE: Enqueue all 5 tasks with maxSize=3
    - VERIFY: maxActive.value === 3 (never exceeded limit)
    - VERIFY: First 3 tasks started immediately
  - IMPLEMENT: test 'should start waiting task when capacity available'
    - SETUP: Create 4 tasks (3 slow, 1 fast)
    - EXECUTE: Enqueue with maxSize=3
    - VERIFY: 4th task starts after first completes
  - DEPENDENCIES: Mock PRPGenerator with controlled timing

Task 5: IMPLEMENT fire-and-forget error handling tests
  - CREATE: describe block 'Fire-and-Forget Error Handling'
  - IMPLEMENT: test 'should log errors but continue processing queue'
    - SETUP: Mock logger to capture error logs
    - SETUP: Mock generate to fail for first task, succeed for others
    - EXECUTE: Enqueue 3 tasks (first fails)
    - VERIFY: logger.error called with failure message
    - VERIFY: Tasks 2 and 3 complete successfully
  - IMPLEMENT: test 'should not cache failed results'
    - SETUP: Mock generate to reject with error
    - EXECUTE: Enqueue task and wait for error
    - VERIFY: getPRP() returns null after failure
    - VERIFY: Task can be retried (enqueue again)
  - IMPLEMENT: test 'should clean up in finally block even on error'
    - SETUP: Mock generate to reject with error
    - EXECUTE: Enqueue failing task
    - VERIFY: isResearching() returns false after error
    - VERIFY: Task removed from researching Map
  - DEPENDENCIES: Mock logger with error capture

Task 6: IMPLEMENT cache deduplication tests
  - CREATE: describe block 'Cache Deduplication'
  - IMPLEMENT: test 'should skip generation if task already cached'
    - SETUP: Pre-populate results Map with PRP
    - EXECUTE: Enqueue same task
    - VERIFY: generate() not called (call count = 0)
    - VERIFY: getPRP() returns cached result
  - IMPLEMENT: test 'should deduplicate concurrent requests for same task'
    - SETUP: Mock generate with delay (100ms)
    - EXECUTE: Enqueue same task 3 times concurrently
    - VERIFY: generate() called only once
    - VERIFY: All waitForPRP() calls resolve
  - IMPLEMENT: test 'should cache successful results'
    - SETUP: Mock generate to resolve with PRP
    - EXECUTE: Enqueue and wait for completion
    - VERIFY: getPRP() returns cached result
    - VERIFY: waitForPRP() returns immediately on second call
  - DEPENDENCIES: PRPGenerator mock with call count tracking

Task 7: IMPLEMENT queue statistics tests
  - CREATE: describe block 'Queue Statistics'
  - IMPLEMENT: test 'should report accurate stats during concurrent operations'
    - SETUP: Create tasks with varying delays
    - EXECUTE: Enqueue multiple tasks
    - VERIFY: getStats().queued matches queue length
    - VERIFY: getStats().researching ≤ maxSize
    - VERIFY: getStats().cached increases as tasks complete
  - IMPLEMENT: test 'should report zero stats for empty queue'
    - VERIFY: All stats are 0 for fresh queue
  - DEPENDENCIES: Multiple tasks with controlled timing

Task 8: IMPLEMENT dependency ordering integration tests
  - CREATE: describe block 'Dependency Ordering Integration'
  - IMPLEMENT: test 'should not process tasks with incomplete dependencies'
    - SETUP: Create TaskOrchestrator with mock SessionManager
    - SETUP: Create tasks with dependencies (S2 depends on S1)
    - SETUP: Mock S1 as 'Planned' (incomplete)
    - EXECUTE: Try to enqueue S2 via orchestrator
    - VERIFY: S2 not enqueued (blocked by dependency)
    - VERIFY: S1 processed when Complete
  - IMPLEMENT: test 'should process tasks in dependency order'
    - SETUP: Create dependency chain: S3 → S2 → S1
    - SETUP: Mark S1 as Complete, others as Planned
    - EXECUTE: Enqueue all via orchestrator
    - VERIFY: Processing order: S2 first (unblocked), then S3 after S2 Complete
  - DEPENDENCIES: TaskOrchestrator integration with canExecute()

Task 9: IMPLEMENT execution order verification tests
  - CREATE: describe block 'Execution Order Verification'
  - IMPLEMENT: test 'should process tasks in FIFO order'
    - SETUP: Create 3 tasks with same delay
    - EXECUTE: Enqueue in specific order
    - VERIFY: Completion order matches enqueue order
  - IMPLEMENT: test 'should complete tasks out of order based on timing'
    - SETUP: Create tasks with different delays (fast, slow, medium)
    - EXECUTE: Enqueue in fixed order
    - VERIFY: Fast task completes before slow task
  - DEPENDENCIES: Execution order tracking with arrays

Task 10: VERIFY all tests follow project patterns
  - VERIFY: Test file uses vi.mock for logger and PRPGenerator
  - VERIFY: Factory functions match existing patterns
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock variables use vi.hoisted() pattern
  - VERIFY: Concurrency tracking uses wrapper objects
  - VERIFY: Test file location matches conventions (tests/integration/core/)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Mock setup with hoisted variables (REQUIRED for integration tests)
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const { mockLogger, mockGenerate } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  mockGenerate: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}));

// PATTERN: Concurrency tracking for testing limits
const trackConcurrency = () => {
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
};

// PATTERN: Controlled timing for predictable concurrent behavior
const createTimedMock = (delay: number, result: any) => {
  return vi.fn().mockImplementation(async (task: Subtask) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return result;
  });
};

// PATTERN: Test structure with SETUP/EXECUTE/VERIFY comments
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
  expect(tracker.getState().startOrder.slice(0, 3).sort())
    .toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']);
});

// CRITICAL: Fire-and-forget error handling test pattern
it('should log errors but continue processing queue', async () => {
  // SETUP: Mock generator to fail first, succeed others
  mockGenerate
    .mockRejectedValueOnce(new Error('Task 1 failed'))
    .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S2'))
    .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S3'));

  const queue = new ResearchQueue(mockSessionManager, 3);
  const backlog = createTestBacklog([]);

  const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
  const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');
  const task3 = createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned');

  // EXECUTE: Enqueue all tasks
  await queue.enqueue(task1, backlog);
  await queue.enqueue(task2, backlog);
  await queue.enqueue(task3, backlog);

  // Wait for task1 to fail
  await expect(queue.waitForPRP('P1.M1.T1.S1')).rejects.toThrow('Task 1 failed');

  // VERIFY: Error was logged
  expect(mockLogger.error).toHaveBeenCalledWith(
    expect.stringContaining('PRP generation failed for P1.M1.T1.S1')
  );

  // VERIFY: Other tasks still completed
  const prp2 = await queue.waitForPRP('P1.M1.T1.S2');
  const prp3 = await queue.waitForPRP('P1.M1.T1.S3');
  expect(prp2).toBeDefined();
  expect(prp3).toBeDefined();
});

// GOTCHA: Cache deduplication test pattern
it('should deduplicate concurrent requests for same task', async () => {
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
  await queue.waitForPRP('P1.M1.T1.S1');

  // VERIFY: Only generated once
  expect(generateCallCount).toBe(1);
});

// CRITICAL: Integration with TaskOrchestrator for dependency testing
it('should not process tasks with incomplete dependencies', async () => {
  // SETUP: Create orchestrator with dependency checking
  const orchestrator = new TaskOrchestrator(mockSessionManager);

  const task1 = createTestSubtask('P1.M1.T1.S1', 'Dependency', 'Complete', []);
  const task2 = createTestSubtask('P1.M1.T1.S2', 'Dependent', 'Planned', ['P1.M1.T1.S1']);

  const backlog = createTestBacklog([{ backlog: [task1, task2] }]);

  // Mock canExecute to block task2
  vi.spyOn(orchestrator, 'canExecute').mockImplementation((task) => {
    return task.id === 'P1.M1.T1.S1'; // Only task1 can execute
  });

  // EXECUTE: Try to enqueue via orchestrator
  // (orchestrator checks canExecute before enqueuing to researchQueue)

  // VERIFY: Task2 not enqueued due to dependency
  expect(orchestrator.researchQueue.getStats().researching).toBeLessThanOrEqual(1);
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS:
  - This is integration test with mocked PRPGenerator
  - No actual file system operations (SessionManager is mocked)
  - Focus on queue behavior, not PRP file creation

MOCK INTEGRATIONS:
  - Mock: src/utils/logger.js (getLogger) - capture error logs
  - Mock: src/agents/prp-generator.js (PRPGenerator.generate) - control timing and errors

REAL COMPONENTS:
  - Real: ResearchQueue class (actual queue logic)
  - Real: Promise chaining and fire-and-forget behavior

DEPENDENCY ON PREVIOUS WORK ITEM:
  - P1.M1.T2.S2 provides tested canExecute() for dependency checking
  - This integration test verifies ResearchQueue respects those checks
  - TaskOrchestrator acts as gatekeeper before enqueue
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/core/research-queue.test.ts
# OR
npx eslint tests/integration/core/research-queue.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- tests/integration/core/research-queue.test.ts
# OR
npx vitest run tests/integration/core/research-queue.test.ts

# Run with coverage
npm test -- --coverage tests/integration/core/research-queue.test.ts

# Run all ResearchQueue-related tests to ensure no breakage
npm test -- tests/unit/core/research-queue.test.ts
npm test -- tests/integration/core/task-orchestrator-runtime.test.ts

# Expected: All tests pass, good coverage for concurrent scenarios
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full integration test suite still passes
npm test -- tests/integration/
# OR
npx vitest run tests/integration/

# Check that existing tests still work
npx vitest run tests/integration/core/

# Expected: All existing integration tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/core/research-queue.test.ts

# Check test file follows project conventions
head -100 tests/integration/core/research-queue.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/integration/core/research-queue.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage for ResearchQueue
npm test -- --coverage tests/integration/core/research-queue.test.ts
# Should see coverage for concurrent paths, error handling, cache dedup

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npm test -- tests/integration/core/research-queue.test.ts`
- [ ] No linting errors: `npm run lint tests/integration/core/research-queue.test.ts`
- [ ] Coverage shows concurrent scenarios tested (concurrency limit, error handling)
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] Concurrency limit of 3 enforced (max concurrent operations never exceeds limit)
- [ ] Fire-and-forget error handling verified (errors logged, queue continues)
- [ ] Failed tasks not cached (getPRP returns null, task can be retried)
- [ ] Cache deduplication works (concurrent requests for same task deduplicated)
- [ ] Queue statistics accurate during concurrent operations
- [ ] Background cleanup happens in finally block (even on errors)
- [ ] Dependency ordering integration verified with TaskOrchestrator

### Code Quality Validation

- [ ] Follows existing integration test patterns from task-orchestrator-runtime.test.ts
- [ ] Uses factory functions for test data creation
- [ ] SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.hoisted() pattern
- [ ] Concurrency tracking uses wrapper objects
- [ ] Test file location matches conventions (tests/integration/core/)

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Complex scenarios (concurrent execution, error handling) have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Edge cases are explicitly tested and commented

---

## Anti-Patterns to Avoid

- ❌ Don't create new factory functions - reuse existing ones from research-queue.test.ts
- ❌ Don't skip vi.hoisted() for variables in mock factory - causes reference errors
- ❌ Don't use real PRPGenerator in integration tests - mock to control timing
- ❌ Don't test dependency resolution logic here - that's covered in P1.M1.T2.S2
- ❌ Don't forget afterEach to clear mocks between tests
- ❌ Don't use setTimeout without proper waiting/awaiting
- ❌ Don't skip edge cases (concurrent same task, mixed success/failure, cache boundaries)
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't hardcode delays - use consistent values (100ms works well)
- ❌ Don't test unit-level behavior (individual methods) - focus on integration scenarios
- ❌ Don't create temp directories - this test doesn't need file I/O
- ❌ Don't mock the entire ResearchQueue - test the real queue logic
- ❌ Don't ignore race conditions - test concurrent access patterns
- ❌ Don't skip testing the fire-and-forget finally block cleanup
- ❌ Don't assume FIFO completion - tasks complete based on timing, not order

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T2.S3
**Created:** 2026-01-19
**Status:** Ready for Implementation
