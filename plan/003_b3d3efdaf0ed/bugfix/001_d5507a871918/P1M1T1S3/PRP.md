# Product Requirement Prompt (PRP)

## Goal

**Feature Goal**: Update all ResearchQueue integration test instantiations to use the complete 4-parameter constructor signature (sessionManager, maxSize, noCache, cacheTtlMs), ensuring integration tests validate end-to-end behavior with correctly configured ResearchQueue.

**Deliverable**: Updated integration test suite at `tests/integration/core/research-queue.test.ts` where all 22 ResearchQueue instantiations use the correct 4-parameter constructor, and tests cover cache TTL behavior, concurrent PRP generation limits, and no-cache flag functionality.

**Success Definition**:
- All 22 ResearchQueue instantiations use 4-parameter signature: `new ResearchQueue(sessionManager, maxSize, noCache, cacheTtlMs)`
- Integration tests validate cache TTL behavior with different values
- Integration tests validate concurrent PRP generation limits (maxSize parameter)
- Integration tests validate no-cache flag functionality
- All integration tests pass: `npm test -- tests/integration/core/research-queue.test.ts`
- Tests follow existing integration test patterns (SETUP, EXECUTE, VERIFY)
- Test constants defined for default parameter values

## Why

**Business Value**: This integration test update ensures the ResearchQueue integration tests properly validate the complete constructor signature, preventing regressions and ensuring the cache TTL, concurrency limits, and cache bypass functionality work correctly in real-world scenarios.

**Integration**: The ResearchQueue is a critical component of the Four Core Processing Engines (PRD §5.1). Proper integration test coverage ensures the parallel PRP generation system works with correct concurrency limits, cache bypass, and TTL configuration when integrated with TaskOrchestrator.

**Problems Solved**:
- Bug 001_d5507a871918 from TEST_RESULTS.md identified that integration tests were using an incomplete 2-parameter constructor signature
- Integration tests were not validating that cacheTtlMs parameter is correctly used
- Missing integration test coverage for noCache=true and different cacheTtlMs configurations
- Inconsistency between TaskOrchestrator implementation (S1), unit tests (S2), and integration tests

## What

**User-Visible Behavior**: No direct user-visible behavior change. This is a test update ensuring correct validation of ResearchQueue constructor parameter handling in integration tests.

**Technical Requirements**:
1. Update all 22 ResearchQueue instantiations to use 4-parameter signature
2. Add test constants for default parameter values
3. Add integration tests for cache TTL behavior variations
4. Add integration tests for no-cache flag functionality
5. Add integration tests for concurrent PRP generation limits
6. Ensure tests validate end-to-end behavior with real PRPGenerator mock
7. Maintain existing integration test scenarios and coverage

### Success Criteria

- [ ] All 22 ResearchQueue instantiations use 4-parameter signature: `new ResearchQueue(sessionManager, maxSize, noCache, cacheTtlMs)`
- [ ] Test constants defined: DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS
- [ ] Integration tests added for cache TTL variations
- [ ] Integration tests added for no-cache flag functionality
- [ ] Integration tests validate concurrent execution limits
- [ ] Tests pass: `npm test -- tests/integration/core/research-queue.test.ts`
- [ ] No new test failures introduced
- [ ] Existing integration test scenarios remain functional
- [ ] Mock patterns remain unchanged (vi.hoisted, vi.mock)

## All Needed Context

### Context Completeness Check

**Test**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: Yes - this PRP provides:
- Complete list of all 22 ResearchQueue instantiations with line numbers and current signatures
- Exact constructor signatures for ResearchQueue and PRPGenerator
- Default values for all parameters (from S2 pattern)
- Integration test patterns and validation strategies
- Mock setup patterns specific to this codebase (vi.hoisted, vi.mock)
- Code examples showing correct and incorrect patterns
- Research findings on Vitest integration testing best practices
- Codebase test pattern analysis for consistency

### Documentation & References

```yaml
# MUST READ - Core source files for this implementation

- file: tests/integration/core/research-queue.test.ts
  lines: 1-1015
  why: Primary file to update - contains all 22 ResearchQueue instantiations needing 4-parameter signature
  pattern: Vitest integration test structure with vi.hoisted() mock setup, vi.mock() for PRPGenerator
  gotcha: All instantiations currently use 2 parameters, must update to 4 parameters
  instantiations:
    - Line 236:  new ResearchQueue(mockSessionManager, 3)
    - Line 281:  new ResearchQueue(mockSessionManager, 3)
    - Line 319:  new ResearchQueue(mockSessionManager, 3)
    - Line 349:  new ResearchQueue(mockSessionManager, 1)
    - Line 390:  new ResearchQueue(mockSessionManager, 3)
    - Line 426:  new ResearchQueue(mockSessionManager, 3)
    - Line 453:  new ResearchQueue(mockSessionManager, 3)
    - Line 483:  new ResearchQueue(mockSessionManager, 2)
    - Line 532:  new ResearchQueue(mockSessionManager, 3)
    - Line 559:  new ResearchQueue(mockSessionManager, 3)
    - Line 585:  new ResearchQueue(mockSessionManager, 3)
    - Line 612:  new ResearchQueue(mockSessionManager, 3)
    - Line 648:  new ResearchQueue(mockSessionManager, 3)
    - Line 686:  new ResearchQueue(mockSessionManager, 3)
    - Line 718:  new ResearchQueue(mockSessionManager, 3)
    - Line 769:  new ResearchQueue(mockSessionManager, 1)
    - Line 817:  new ResearchQueue(mockSessionManager, 3)
    - Line 902:  new ResearchQueue(mockSessionManager, 3)
    - Line 929:  new ResearchQueue(mockSessionManager, 3)
    - Line 948:  new ResearchQueue(mockSessionManager, 3)
    - Line 972:  new ResearchQueue(mockSessionManager, 0)
    - Line 991:  new ResearchQueue(mockSessionManager, 3)

- file: src/core/research-queue.ts
  lines: 85-106
  why: ResearchQueue constructor signature showing all 4 required parameters with defaults
  pattern: Constructor with default parameters for backwards compatibility
  critical: Signature is (sessionManager, maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000)

- file: src/agents/prp-generator.ts
  lines: 189-210
  why: PRPGenerator constructor signature (called by ResearchQueue internally)
  pattern: Constructor with 4 parameters including prpCompression (not passed by ResearchQueue)
  gotcha: ResearchQueue calls PRPGenerator with 3 params: (sessionManager, noCache, cacheTtlMs)

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S2/PRP.md
  lines: 1-666
  why: PRP for S2 showing unit test pattern with DEFAULT_ constants
  pattern: Shows correct 4-parameter instantiation pattern for unit tests
  critical: Use same default values: maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S1/PRP.md
  lines: 1-497
  why: PRP for S1 showing TaskOrchestrator changes and correct parameter patterns
  pattern: Shows correct 4-parameter instantiation pattern in production code
  critical: Use same default values: maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/prd_snapshot.md
  section: Issue 1: ResearchQueue Constructor Signature Mismatch
  why: Original bug report describing the constructor signature mismatch issue
  critical: Context for why this test update is necessary

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S3/research/vitest_integration_testing.md
  why: Comprehensive research on Vitest integration testing best practices
  section: Mock Setup Patterns, Testing Concurrent Execution, Testing Cache Behavior
  critical: vi.hoisted() pattern, concurrency tracking helpers, cache testing patterns

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S3/research/codebase_test_patterns.md
  why: Analysis of existing integration test patterns in codebase
  section: Test Constant Patterns, Constructor Testing Patterns, Factory Function Patterns
  critical: DEFAULT_* constant patterns, factory function naming, test structure

- url: https://vitest.dev/guide/mocking.html
  why: Vitest official documentation on vi.hoisted() and vi.mock()
  section: vi.hoisted, vi.mock, Mocking Partials
  critical: vi.hoisted() is REQUIRED for integration tests to avoid hoisting issues

- url: https://vitest.dev/api/expect.html
  why: Vitest expect API documentation for assertion patterns
  section: toHaveBeenCalledWith, toBe, objectContaining
  critical: Assertion patterns for mock verification

- file: tests/unit/core/research-queue.test.ts
  lines: 180-183
  why: Example of test constant definitions from S2 implementation
  pattern: DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS constants
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   └── core/
│       └── research-queue.test.ts         # PRIMARY FILE: 22 instantiations to update
│           # Line 236:  new ResearchQueue(mockSessionManager, 3)
│           # Line 281:  new ResearchQueue(mockSessionManager, 3)
│           # Line 319:  new ResearchQueue(mockSessionManager, 3)
│           # Line 349:  new ResearchQueue(mockSessionManager, 1)
│           # Line 390:  new ResearchQueue(mockSessionManager, 3)
│           # Line 426:  new ResearchQueue(mockSessionManager, 3)
│           # Line 453:  new ResearchQueue(mockSessionManager, 3)
│           # Line 483:  new ResearchQueue(mockSessionManager, 2)
│           # Line 532:  new ResearchQueue(mockSessionManager, 3)
│           # Line 559:  new ResearchQueue(mockSessionManager, 3)
│           # Line 585:  new ResearchQueue(mockSessionManager, 3)
│           # Line 612:  new ResearchQueue(mockSessionManager, 3)
│           # Line 648:  new ResearchQueue(mockSessionManager, 3)
│           # Line 686:  new ResearchQueue(mockSessionManager, 3)
│           # Line 718:  new ResearchQueue(mockSessionManager, 3)
│           # Line 769:  new ResearchQueue(mockSessionManager, 1)
│           # Line 817:  new ResearchQueue(mockSessionManager, 3)
│           # Line 902:  new ResearchQueue(mockSessionManager, 3)
│           # Line 929:  new ResearchQueue(mockSessionManager, 3)
│           # Line 948:  new ResearchQueue(mockSessionManager, 3)
│           # Line 972:  new ResearchQueue(mockSessionManager, 0)
│           # Line 991:  new ResearchQueue(mockSessionManager, 3)

src/
├── core/
│   ├── research-queue.ts                  # Lines 94-106: Constructor signature
│   └── task-orchestrator.ts               # Lines 161-166: Correct 4-parameter instantiation (from S1)
└── agents/
    └── prp-generator.ts                   # Lines 194-199: PRPGenerator constructor

plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S3/
├── research/
│   ├── vitest_integration_testing.md     # Vitest best practices research
│   └── codebase_test_patterns.md          # Codebase pattern analysis
└── PRP.md                                 # This file
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ResearchQueue constructor parameter order is strict
// Order: (sessionManager, maxSize, noCache, cacheTtlMs)
// Do not reorder - TypeScript's positional parameters must match

// GOTCHA: PRPGenerator called by ResearchQueue with 3 params
// ResearchQueue line 105: new PRPGenerator(sessionManager, noCache, cacheTtlMs)
// PRPGenerator has 4th param (prpCompression) but ResearchQueue doesn't pass it
// PRPGenerator uses default 'standard' for prpCompression

// CRITICAL: Default values allow backwards compatibility
// maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000
// Tests may call with fewer parameters due to defaults, but we must pass all 4 explicitly

// CRITICAL: Integration tests use vi.hoisted() for mock setup
// vi.hoisted(() => ({ mockGenerate: vi.fn(), mockLogger: { ... } }));
// This is REQUIRED to avoid hoisting issues with dynamic imports in beforeEach

// PATTERN: Vitest integration test mock setup
// 1. Define mocks in vi.hoisted() at top of file
// 2. Use vi.mock() to mock dependencies
// 3. Import actual module in beforeEach with dynamic import()
// 4. Clear mocks in beforeEach and afterEach

// PATTERN: Integration test structure (SETUP, EXECUTE, VERIFY)
// SETUP: Create test data, configure mocks, instantiate queue
// EXECUTE: Call methods being tested
// VERIFY: Assert expected outcomes

// GOTCHA: Test factory functions create test data
// createTestSubtask(), createTestPRPDocument(), createMockSessionManager(), createMockSession()
// Use these patterns for consistency

// PATTERN: Concurrency tracking helper for testing concurrent execution
// trackConcurrency() returns { trackStart, trackEnd, getState }
// Uses wrapper objects to track state across async operations

// CRITICAL: Test constants should be defined at top of file
// DEFAULT_MAX_SIZE = 3
// DEFAULT_NO_CACHE = false
// DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000

// PATTERN: beforeEach/afterEach cleanup
// beforeEach(() => { vi.clearAllMocks(); mockGenerate.mockReset(); });
// afterEach(() => { vi.clearAllMocks(); });
// Ensures clean state between tests

// GOTCHA: Integration tests use real ResearchQueue class
// Not mocked - only PRPGenerator and logger are mocked
// This tests real queue behavior, not mock behavior

// PATTERN: Mock setup with vi.hoisted() - REQUIRED for integration tests
// const { mockLogger, mockGenerate } = vi.hoisted(() => ({
//   mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
//   mockGenerate: vi.fn(),
// }));
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This PRP updates existing integration test code.

**Test Constants to Add** (at top of test file, after factory functions, before first describe block):
```typescript
// Test constants for ResearchQueue constructor parameters
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
```

**ResearchQueue Constructor Signature** (already exists):
```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
)
```

**PRPGenerator Constructor Signature** (already exists):
```typescript
constructor(
  sessionManager: SessionManager,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard'
)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD TEST CONSTANTS TO research-queue.test.ts
  - LOCATION: tests/integration/core/research-queue.test.ts, after factory functions (around line 180)
  - ADD: Test constants for default values
  - IMPLEMENT:
    const DEFAULT_MAX_SIZE = 3;
    const DEFAULT_NO_CACHE = false;
    const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  - PATTERN: Follow S2 unit test constant definitions
  - PLACEMENT: After createMockSession(), before trackConcurrency() helper
  - GOTCHA: Place before first describe block to be available to all tests

Task 2: UPDATE CONCURRENT PROCESSING TESTS (Lines 218-375)
  - LOCATION: tests/integration/core/research-queue.test.ts lines 218-375
  - UPDATE: All 6 ResearchQueue instantiations in "Concurrent Processing" describe block
  - PATTERN: Change from new ResearchQueue(mockSessionManager, <maxSize>) to new ResearchQueue(mockSessionManager, <maxSize>, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - SPECIFIC UPDATES:
    Line 236: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 281: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 319: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 349: new ResearchQueue(mockSessionManager, 1, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS) # Serial processing test
  - PRESERVE: All test assertions, concurrency tracking, and test scenarios
  - GOTCHA: Line 349 tests concurrency=1, keep the 1 for maxSize parameter

Task 3: UPDATE FIRE-AND-FORGET ERROR HANDLING TESTS (Lines 381-523)
  - LOCATION: tests/integration/core/research-queue.test.ts lines 381-523
  - UPDATE: All 5 ResearchQueue instantiations in "Fire-and-Forget Error Handling" describe block
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC UPDATES:
    Line 390: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 426: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 453: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 483: new ResearchQueue(mockSessionManager, 2, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All error handling assertions and test scenarios
  - GOTCHA: Line 483 tests maxSize=2, keep the 2 for maxSize parameter

Task 4: UPDATE CACHE DEDUPLICATION TESTS (Lines 529-634)
  - LOCATION: tests/integration/core/research-queue.test.ts lines 529-634
  - UPDATE: All 5 ResearchQueue instantiations in "Cache Deduplication" describe block
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC UPDATES:
    Line 532: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 559: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 585: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 612: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All cache deduplication assertions and test scenarios
  - GOTCHA: These tests don't validate cache parameters yet - new tests in Task 10 will cover that

Task 5: UPDATE QUEUE STATISTICS TESTS (Lines 640-751)
  - LOCATION: tests/integration/core/research-queue.test.ts lines 640-751
  - UPDATE: All 3 ResearchQueue instantiations in "Queue Statistics" describe block
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC UPDATES:
    Line 648: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 686: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 718: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All statistics assertions and test scenarios

Task 6: UPDATE EXECUTION ORDER VERIFICATION TESTS (Lines 757-838)
  - LOCATION: tests/integration/core/research-queue.test.ts lines 757-838
  - UPDATE: All 2 ResearchQueue instantiations in "Execution Order Verification" describe block
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC UPDATES:
    Line 769: new ResearchQueue(mockSessionManager, 1, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS) # Serial processing
    Line 817: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All execution order assertions and test scenarios
  - GOTCHA: Line 769 tests concurrency=1, keep the 1 for maxSize parameter

Task 7: UPDATE TASK ORCHESTRATOR INTEGRATION TESTS (Lines 844-920)
  - LOCATION: tests/integration/core/research-queue.test.ts lines 844-920
  - UPDATE: 1 ResearchQueue instantiation in "TaskOrchestrator Integration" describe block
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to instantiation
  - SPECIFIC UPDATE:
    Line 902: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All TaskOrchestrator integration assertions and test scenarios

Task 8: UPDATE EDGE CASES TESTS (Lines 926-1014)
  - LOCATION: tests/integration/core/research-queue.test.ts lines 926-1014
  - UPDATE: All 4 ResearchQueue instantiations in "Edge Cases" describe block
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC UPDATES:
    Line 929: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 948: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 972: new ResearchQueue(mockSessionManager, 0, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS) # maxSize=0 test
    Line 991: new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All edge case assertions and test scenarios
  - GOTCHA: Line 972 tests maxSize=0 (no processing), keep the 0 for maxSize parameter

Task 9: ADD INTEGRATION TESTS FOR noCache PARAMETER
  - LOCATION: tests/integration/core/research-queue.test.ts, add new describe block
  - ADD: New integration tests for no-cache flag functionality
  - IMPLEMENT: Add after "Cache Deduplication" describe block (after line 634)
  - IMPLEMENT:
    describe('noCache Parameter Integration', () => {
      it('should bypass cache when noCache=true', async () => {
        // SETUP: Track generate calls
        let generateCallCount = 0;
        mockGenerate.mockImplementation(async (task: Subtask) => {
          generateCallCount++;
          await new Promise(resolve => setTimeout(resolve, 50));
          return createTestPRPDocument(task.id);
        });

        const queue = new ResearchQueue(mockSessionManager, 3, true, DEFAULT_CACHE_TTL_MS);
        const backlog = createTestBacklog([]);
        const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

        // EXECUTE: Enqueue same task twice
        await queue.enqueue(task, backlog);
        await queue.waitForPRP('P1.M1.T1.S1');

        // Enqueue again - with noCache=true, should call generate again
        queue.clearCache();
        await queue.enqueue(task, backlog);
        await queue.waitForPRP('P1.M1.T1.S1');

        // VERIFY: generate called twice (no cache bypass)
        expect(generateCallCount).toBe(2);
      });

      it('should use cache when noCache=false', async () => {
        // SETUP: Track generate calls
        let generateCallCount = 0;
        mockGenerate.mockImplementation(async (task: Subtask) => {
          generateCallCount++;
          await new Promise(resolve => setTimeout(resolve, 50));
          return createTestPRPDocument(task.id);
        });

        const queue = new ResearchQueue(mockSessionManager, 3, false, DEFAULT_CACHE_TTL_MS);
        const backlog = createTestBacklog([]);
        const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

        // EXECUTE: Enqueue same task twice
        await queue.enqueue(task, backlog);
        await queue.waitForPRP('P1.M1.T1.S1');
        await queue.enqueue(task, backlog);
        await queue.waitForPRP('P1.M1.T1.S1');

        // VERIFY: generate called once (second request uses cache)
        expect(generateCallCount).toBe(1);
      });
    });
  - PATTERN: Follow existing integration test structure (SETUP, EXECUTE, VERIFY)
  - PLACEMENT: After "Cache Deduplication" block, before "Queue Statistics" block
  - GOTCHA: Tests real ResearchQueue behavior, not mock behavior

Task 10: ADD INTEGRATION TESTS FOR cacheTtlMs PARAMETER
  - LOCATION: tests/integration/core/research-queue.test.ts, add new describe block
  - ADD: New integration tests for cache TTL behavior
  - IMPLEMENT: Add after "noCache Parameter Integration" describe block
  - IMPLEMENT:
    describe('cacheTtlMs Parameter Integration', () => {
      it('should accept custom cacheTtlMs value', async () => {
        // SETUP: Use custom TTL (1 hour)
        const customTtl = 60 * 60 * 1000; // 1 hour
        mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));

        const queue = new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, customTtl);
        const backlog = createTestBacklog([]);
        const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

        // EXECUTE: Enqueue and complete
        await queue.enqueue(task, backlog);
        const prp = await queue.waitForPRP('P1.M1.T1.S1');

        // VERIFY: Queue created successfully with custom TTL
        expect(queue).toBeDefined();
        expect(prp).toBeDefined();
      });

      it('should use default cacheTtlMs when not specified', async () => {
        // SETUP: Verify default TTL is used
        mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));

        const queue = new ResearchQueue(mockSessionManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
        const backlog = createTestBacklog([]);
        const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

        // EXECUTE: Enqueue and complete
        await queue.enqueue(task, backlog);
        const prp = await queue.waitForPRP('P1.M1.T1.S1');

        // VERIFY: Queue created successfully with default TTL
        expect(queue).toBeDefined();
        expect(prp).toBeDefined();
      });
    });
  - PATTERN: Follow existing integration test structure
  - PLACEMENT: After "noCache Parameter Integration" block
  - GOTCHA: These tests verify parameter acceptance, not actual TTL expiration (would require time manipulation)

Task 11: RUN INTEGRATION TESTS TO VALIDATE CHANGES
  - COMMAND: npm test -- tests/integration/core/research-queue.test.ts
  - VERIFY: All integration tests pass
  - EXPECTED: Zero failures
  - ACTION: Fix any failing tests before considering implementation complete
  - GOTCHA: Integration tests use real ResearchQueue, so changes affect real behavior

Task 12: VERIFY INTEGRATION WITH S1 AND S2 IMPLEMENTATIONS
  - VERIFY: Integration tests pass with TaskOrchestrator implementation from S1
  - VERIFY: Integration tests are consistent with unit tests from S2
  - COMMAND: npm test -- tests/integration/core/ --reporter=verbose
  - EXPECTED: All integration tests pass
  - ACTION: Ensure no regressions in related integration tests
```

### Implementation Patterns & Key Details

```typescript
// Pattern: Correct 4-parameter ResearchQueue instantiation in integration tests
// This is the CORRECT pattern to use throughout all integration tests

const queue = new ResearchQueue(
  mockSessionManager,         // Parameter 1: SessionManager instance
  DEFAULT_MAX_SIZE,           // Parameter 2: Max concurrent tasks (default 3)
  DEFAULT_NO_CACHE,           // Parameter 3: Cache bypass flag (default false)
  DEFAULT_CACHE_TTL_MS        // Parameter 4: Cache TTL in ms (default 24h)
);

// CRITICAL: Always use constants for default values
// Do not hardcode 3, false, or 24*60*60*1000
// Use DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS

// Pattern: Test-specific parameter overrides
// When testing specific parameter values, override only that parameter

describe('maxSize parameter variations', () => {
  it('should handle maxSize of 5', () => {
    const queue = new ResearchQueue(
      mockSessionManager,
      5,                         // Override maxSize
      DEFAULT_NO_CACHE,          // Use default for noCache
      DEFAULT_CACHE_TTL_MS       // Use default for cacheTtlMs
    );
    expect(queue.maxSize).toBe(5);
  });

  it('should handle maxSize of 1 (serial processing)', () => {
    const queue = new ResearchQueue(
      mockSessionManager,
      1,                         // Override maxSize to 1
      DEFAULT_NO_CACHE,          // Use default for noCache
      DEFAULT_CACHE_TTL_MS       // Use default for cacheTtlMs
    );
    // Test serial processing behavior
  });

  it('should handle maxSize of 0 (no processing)', () => {
    const queue = new ResearchQueue(
      mockSessionManager,
      0,                         // Override maxSize to 0
      DEFAULT_NO_CACHE,          // Use default for noCache
      DEFAULT_CACHE_TTL_MS       // Use default for cacheTtlMs
    );
    // Test that tasks remain queued
  });
});

// Pattern: Testing noCache parameter variations

describe('noCache parameter integration', () => {
  it('should bypass cache when noCache=true', () => {
    const queue = new ResearchQueue(
      mockSessionManager,
      DEFAULT_MAX_SIZE,
      true,                      // Override noCache to true
      DEFAULT_CACHE_TTL_MS
    );
    // Test cache bypass behavior
  });
});

// Pattern: Testing cacheTtlMs parameter variations

describe('cacheTtlMs parameter integration', () => {
  it('should accept custom cacheTtlMs', () => {
    const customTtl = 60 * 60 * 1000; // 1 hour
    const queue = new ResearchQueue(
      mockSessionManager,
      DEFAULT_MAX_SIZE,
      DEFAULT_NO_CACHE,
      customTtl                  // Override cacheTtlMs
    );
    // Test custom TTL acceptance
  });
});

// PATTERN: Integration test structure (SETUP, EXECUTE, VERIFY)

describe('Concurrent Processing', () => {
  it('should process up to maxSize tasks concurrently', async () => {
    // SETUP: Create mock with concurrency tracking
    const tracker = trackConcurrency();
    mockGenerate.mockImplementation(async (task: Subtask) => {
      tracker.trackStart(task.id);
      await new Promise(resolve => setTimeout(resolve, 100));
      tracker.trackEnd();
      return createTestPRPDocument(task.id);
    });

    const queue = new ResearchQueue(
      mockSessionManager,
      DEFAULT_MAX_SIZE,
      DEFAULT_NO_CACHE,
      DEFAULT_CACHE_TTL_MS
    );

    // EXECUTE: Enqueue all tasks
    for (const task of tasks) {
      await queue.enqueue(task, backlog);
    }

    // Wait for all to complete
    await Promise.all(tasks.map(t => queue.waitForPRP(t.id).catch(() => {})));

    // VERIFY: Concurrency limit was never exceeded
    expect(tracker.getState().max).toBeLessThanOrEqual(3);
  });
});

// GOTCHA: Integration tests use real ResearchQueue class
// Only PRPGenerator and logger are mocked
// This tests real queue behavior, not mock behavior

// PATTERN: Mock setup with vi.hoisted() - REQUIRED for integration tests

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

// PATTERN: Dynamic import in beforeEach for clean test isolation
beforeEach(async () => {
  vi.clearAllMocks();
  mockGenerate.mockReset();
  mockGenerate.mockImplementation(async (task: Subtask) => {
    return createTestPRPDocument(task.id);
  });

  // Import ResearchQueue after mocks are set up
  const module = await import('../../../src/core/research-queue.js');
  ResearchQueue = module.ResearchQueue;

  // Create fresh mock session for each test
  mockSessionManager = createMockSessionManager(createMockSession());
});

// PATTERN: Test factory functions (already exist in file)

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
      // ... more gates
    ],
    successCriteria: [
      { description: `Criterion 1 for ${taskId}`, satisfied: false },
      { description: `Criterion 2 for ${taskId}`, satisfied: false },
    ],
    references: [`src/test-${taskId}.ts`],
  };
}

// PATTERN: Concurrency tracking helper (already exists in file)

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

### Integration Points

```yaml
INTEGRATION_TEST_FILE:
  - file: tests/integration/core/research-queue.test.ts
  - updates: 22 ResearchQueue instantiations, 1 new describe block for noCache, 1 new describe block for cacheTtlMs
  - additions: Test constants, new parameter validation integration tests

RESEARCH_QUEUE_CONSTRUCTOR:
  - file: src/core/research-queue.ts
  - lines: 94-106
  - signature: (sessionManager, maxSize, noCache, cacheTtlMs)
  - defaults: maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000

PRP_GENERATOR_CONSTRUCTOR:
  - file: src/agents/prp-generator.ts
  - lines: 194-199
  - signature: (sessionManager, noCache, cacheTtlMs, prpCompression)
  - call_from_research_queue: new PRPGenerator(sessionManager, noCache, cacheTtlMs)
  - note: Does NOT include prpCompression parameter

TASK_ORCHESTRATOR:
  - file: src/core/task-orchestrator.ts
  - lines: 161-166
  - status: Updated in S1 to use 4-parameter signature
  - pattern: Matches test pattern after this PRP is applied

UNIT_TESTS:
  - file: tests/unit/core/research-queue.test.ts
  - status: Updated in S2 to use 4-parameter signature
  - pattern: Shows correct constant usage and test patterns

TEST_FRAMEWORK:
  - framework: Vitest
  - mock_pattern: vi.hoisted(), vi.mock(), vi.fn(), expect().toHaveBeenCalledWith()
  - test_structure: SETUP, EXECUTE, VERIFY
  - dynamic_import: Import module in beforeEach for clean isolation

MOCK_SETUP:
  - hoisted_mocks: mockLogger, mockGenerate defined in vi.hoisted()
  - module_mocks: logger.js, prp-generator.js mocked with vi.mock()
  - cleanup: beforeEach clears mocks, afterEach clears mocks
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking
npm run typecheck

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding

# Run ESLint to check code style
npm run lint

# Expected: Zero linting errors
# If errors exist, run npm run lint:fix to auto-fix

# Run Prettier to check formatting
npm run format:check

# Expected: Zero formatting issues
# If issues exist, run npm run format to fix
```

### Level 2: Integration Tests (Component Validation)

```bash
# Test ResearchQueue integration tests with verbose output
npm test -- tests/integration/core/research-queue.test.ts --verbose

# Expected: All 22+ tests pass
# Key tests to verify after updates:
# - "should process up to maxSize tasks concurrently" (line 218)
# - "should start waiting task when capacity available" (line 256)
# - "should log errors but continue processing queue" (line 382)
# - "should skip generation if task already cached" (line 530)
# - "should bypass cache when noCache=true" (NEW)
# - "should accept custom cacheTtlMs value" (NEW)

# Test all core integration tests
npm test -- tests/integration/core/

# Expected: All tests pass
# Coverage: Should maintain or improve coverage

# Run with coverage report (if available)
npm test -- tests/integration/core/research-queue.test.ts --coverage

# Expected: Coverage thresholds met
# Check that new tests for noCache and cacheTtlMs are covered
```

### Level 3: Cross-Component Integration Testing (System Validation)

```bash
# Test TaskOrchestrator integration
npm test -- tests/integration/core/task-orchestrator.test.ts

# Expected: All tests pass
# Verifies: TaskOrchestrator's 4-parameter instantiation works with integration tests

# Test ResearchQueue unit tests (from S2)
npm test -- tests/unit/core/research-queue.test.ts

# Expected: All tests pass
# Verifies: S2 unit tests still work correctly

# Run full integration test suite
npm test -- tests/integration/

# Expected: All integration tests pass
```

### Level 4: End-to-End Validation

```bash
# Run complete test suite
npm test

# Expected: All tests pass (unit + integration + e2e)
# Coverage thresholds met

# Manual verification: Check all ResearchQueue instantiations
grep -n "new ResearchQueue(" tests/integration/core/research-queue.test.ts

# Expected: All 22+ instantiations show 4 parameters
# Example output:
# 236:    const queue = new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
# 281:    const queue = new ResearchQueue(mockSessionManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
# ...

# Verify test constants are defined
grep "DEFAULT_" tests/integration/core/research-queue.test.ts | head -5

# Expected output:
# const DEFAULT_MAX_SIZE = 3;
# const DEFAULT_NO_CACHE = false;
# const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

# Verify new test blocks exist
grep -n "describe.*noCache" tests/integration/core/research-queue.test.ts
grep -n "describe.*cacheTtlMs" tests/integration/core/research-queue.test.ts

# Expected: New describe blocks for noCache and cacheTtlMs testing
```

## Final Validation Checklist

### Technical Validation

- [ ] All 22 ResearchQueue instantiations updated to 4-parameter signature
- [ ] Test constants defined: DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS
- [ ] New integration tests added for noCache parameter behavior
- [ ] New integration tests added for cacheTtlMs parameter behavior
- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] All ResearchQueue integration tests pass: `npm test -- tests/integration/core/research-queue.test.ts`
- [ ] TaskOrchestrator integration tests pass (no regressions): `npm test -- tests/integration/core/task-orchestrator.test.ts`
- [ ] All core integration tests pass: `npm test -- tests/integration/core/`
- [ ] Tests validate cache bypass with noCache=true
- [ ] Tests validate custom cacheTtlMs values
- [ ] Tests validate concurrent execution limits
- [ ] Existing integration test scenarios remain functional

### Code Quality Validation

- [ ] Test code follows existing integration test patterns in research-queue.test.ts
- [ ] Mock patterns (vi.hoisted, vi.mock) remain unchanged
- [ ] Test structure (SETUP, EXECUTE, VERIFY) preserved
- [ ] Factory functions still used for test data
- [ ] beforeEach/afterEach cleanup maintained
- [ ] Test names remain descriptive and clear
- [ ] No hardcoded parameter values (all use constants)

### Integration & Consistency

- [ ] Integration tests consistent with TaskOrchestrator implementation from S1
- [ ] Integration tests consistent with unit tests from S2
- [ ] Parameter order matches ResearchQueue constructor signature
- [ ] Mock setup uses correct vi.hoisted() pattern
- [ ] No breaking changes to test interfaces
- [ ] Ready for production deployment

### Documentation & Deployment

- [ ] Test constants are self-documenting with clear names
- [ ] New integration tests for noCache and cacheTtlMs are well-documented
- [ ] Test descriptions clearly indicate what is being validated
- [ ] Changes are ready for code review

---

## Anti-Patterns to Avoid

- ❌ Don't hardcode parameter values - use DEFAULT_* constants
- ❌ Don't change the ResearchQueue constructor signature - it's already correct
- ❌ Don't modify PRPGenerator constructor signature - not in scope
- ❌ Don't skip validating parameter forwarding in integration tests
- ❌ Don't break existing integration test scenarios - maintain all test coverage
- ❌ Don't forget to add integration tests for noCache and cacheTtlMs variations
- ❌ Don't change mock setup patterns (vi.hoisted, vi.mock) - keep existing infrastructure
- ❌ Don't use different default values than S1/S2 - use 3, false, 24*60*60*1000
- ❌ Don't mix up parameter order - must be (sessionManager, maxSize, noCache, cacheTtlMs)
- ❌ Don't forget to import module in beforeEach - required for clean test isolation
- ❌ Don't use synchronous imports for mocked modules - use dynamic import in beforeEach
- ❌ Don't skip clearing mocks in beforeEach/afterEach - causes test pollution

## Notes

**Current State Analysis**:
As of the S1 and S2 completion, TaskOrchestrator correctly passes all 4 parameters to ResearchQueue, and unit tests have been updated. However, the integration tests in `tests/integration/core/research-queue.test.ts` still use the old 2-parameter constructor signature. This PRP updates all 22 test instantiations to match the correct 4-parameter signature and adds integration test coverage for the new parameters.

**Test Instantiation Summary**:
- 22 total ResearchQueue instantiations need updating
- Distribution by test category:
  - Concurrent Processing: 4 instantiations (lines 236, 281, 319, 349)
  - Fire-and-Forget Error Handling: 5 instantiations (lines 390, 426, 453, 483, 532)
  - Cache Deduplication: 4 instantiations (lines 559, 585, 612, 648)
  - Queue Statistics: 3 instantiations (lines 686, 718, 769)
  - Execution Order Verification: 2 instantiations (lines 817, 902)
  - TaskOrchestrator Integration: 1 instantiation (line 929)
  - Edge Cases: 4 instantiations (lines 948, 972, 991, and one more)

**Parameter Forwarding Chain**:
1. TaskOrchestrator → ResearchQueue: 4 parameters (sessionManager, maxSize, noCache, cacheTtlMs)
2. ResearchQueue → PRPGenerator: 3 parameters (sessionManager, noCache, cacheTtlMs)
3. PRPGenerator: 4 parameters total (sessionManager, noCache, cacheTtlMs, prpCompression='standard')

**Integration Test vs Unit Test**:
- Unit tests (S2) mock ResearchQueue and PRPGenerator
- Integration tests use real ResearchQueue, only mock PRPGenerator and logger
- This validates real queue behavior with concurrent processing, cache management, and error handling

**Related Work Items**:
- P1.M1.T1.S1: Complete - TaskOrchestrator ResearchQueue instantiation
- P1.M1.T1.S2: Complete - Update ResearchQueue unit tests
- P1.M1.T1.S3: This task - Update ResearchQueue integration tests

**Confidence Score**: 10/10 - This is a straightforward integration test update with clear success criteria, comprehensive research (Vitest best practices and codebase patterns), specific line-by-line guidance, and existing patterns to follow from S1 and S2.

**Implementation Estimate**: ~2-3 hours for careful update of all 22 instantiations, adding new integration test blocks, and validation of test results.
