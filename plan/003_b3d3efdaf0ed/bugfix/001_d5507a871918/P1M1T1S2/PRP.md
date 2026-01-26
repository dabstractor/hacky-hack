# Product Requirement Prompt (PRP)

## Goal

**Feature Goal**: Update all ResearchQueue unit test instantiations to use the complete 4-parameter constructor signature (sessionManager, maxSize, noCache, cacheTtlMs), ensuring tests validate the full parameter forwarding from ResearchQueue to PRPGenerator.

**Deliverable**: Updated test suite at `tests/unit/core/research-queue.test.ts` where all 39 ResearchQueue instantiations use the correct 4-parameter constructor, and the PRPGenerator mock assertion validates all parameters being passed correctly.

**Success Definition**:
- All 39 test cases instantiate ResearchQueue with all 4 required parameters
- The PRPGenerator mock assertion validates correct parameter forwarding
- All tests pass with the updated TaskOrchestrator implementation from S1
- Test coverage for noCache and cacheTtlMs parameter behavior
- Tests validate that cacheTtlMs is correctly passed to PRPGenerator

## Why

**Business Value**: This test update ensures the ResearchQueue unit tests properly validate the complete constructor signature, preventing regressions and ensuring the cache TTL and cache bypass functionality work correctly.

**Integration**: The ResearchQueue is a critical component of the Four Core Processing Engines (PRD §5.1). Proper test coverage ensures the parallel PRP generation system works with correct concurrency limits, cache bypass, and TTL configuration.

**Problems Solved**:
- Bug 001_d5507a871918 from TEST_RESULTS.md identified that tests were using an incomplete 2-parameter constructor signature
- Tests were not validating that cacheTtlMs parameter is correctly passed to PRPGenerator
- Missing test coverage for noCache=true and different cacheTtlMs configurations
- Inconsistency between TaskOrchestrator implementation (S1) and unit tests

## What

**User-Visible Behavior**: No direct user-visible behavior change. This is a test update ensuring correct validation of ResearchQueue constructor parameter handling.

**Technical Requirements**:
1. Update all 39 ResearchQueue instantiations to use 4-parameter signature
2. Update PRPGenerator mock assertion to validate all 3 parameters it receives
3. Add test coverage for different noCache and cacheTtlMs configurations
4. Ensure tests validate parameter forwarding from ResearchQueue to PRPGenerator
5. Maintain existing test scenarios and coverage

### Success Criteria

- [ ] All 39 ResearchQueue instantiations use 4-parameter signature: `new ResearchQueue(sessionManager, maxSize, noCache, cacheTtlMs)`
- [ ] PRPGenerator mock assertion validates: `toHaveBeenCalledWith(sessionManager, noCache, cacheTtlMs)`
- [ ] Tests pass: `npm test -- tests/unit/core/research-queue.test.ts`
- [ ] No new test failures introduced
- [ ] Existing test scenarios remain functional
- [ ] Mock/fs patterns remain unchanged

## All Needed Context

### Context Completeness Check

**Test**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: Yes - this PRP provides:
- Complete list of all 39 ResearchQueue instantiations with line numbers
- Exact constructor signatures for ResearchQueue and PRPGenerator
- Default values for all parameters
- Test patterns and validation strategies
- Mock assertion patterns specific to this codebase
- Code examples showing correct and incorrect patterns

### Documentation & References

```yaml
# MUST READ - Core source files for this implementation

- file: tests/unit/core/research-queue.test.ts
  lines: 1-1431
  why: Primary file to update - contains all 39 ResearchQueue instantiations that need 4-parameter signature
  pattern: Vitest test structure with vi.mock() for PRPGenerator, beforeEach/afterEach cleanup
  gotcha: All instantiations currently use 1-2 parameters, must update to 4 parameters

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

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S1/PRP.md
  lines: 1-497
  why: PRP for S1 showing TaskOrchestrator changes and correct parameter patterns
  pattern: Shows correct 4-parameter instantiation pattern
  critical: Use same default values: maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/prd_snapshot.md
  section: Issue 1: ResearchQueue Constructor Signature Mismatch
  why: Original bug report describing the constructor signature mismatch issue
  critical: Context for why this test update is necessary

- file: tests/unit/agents/prp-generator.test.ts
  lines: 189-223
  why: Examples of constructor parameter validation testing patterns
  pattern: Using expect().toHaveBeenCalledWith() with specific parameter values

- file: tests/unit/prp-cache-ttl.test.ts
  lines: 1-100
  why: Examples of testing cacheTtlMs parameter with different values
  pattern: Tests with custom TTL values, default TTL validation
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── unit/
│   └── core/
│       └── research-queue.test.ts      # PRIMARY FILE: 39 instantiations to update
│           # Line 130:  new ResearchQueue(mockManager, 3)
│           # Line 159:  new ResearchQueue(mockManager, 5)
│           # Line 188:  new ResearchQueue(mockManager, 1)
│           # Line 217:  new ResearchQueue(mockManager, 10)
│           # Line 246:  new ResearchQueue(mockManager)
│           # Line 275:  new ResearchQueue(mockManager, 3)
│           # Line 278:  expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, false, 86400000)
│           # ... 33 more instantiations

src/
├── core/
│   ├── research-queue.ts               # Lines 94-106: Constructor signature
│   └── task-orchestrator.ts            # Lines 161-166: Correct 4-parameter instantiation (from S1)
└── agents/
    └── prp-generator.ts                # Lines 194-199: PRPGenerator constructor
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

// PATTERN: Vitest mocking with vi.mock()
// vi.mock('../../../src/agents/prp-generator.js', () => ({
//   PRPGenerator: vi.fn(),
// }));
// const MockPRPGenerator = PRPGenerator as any;

// PATTERN: Mock assertion for constructor calls
// expect(MockPRPGenerator).toHaveBeenCalledWith(sessionManager, noCache, cacheTtlMs);
// Note: PRPGenerator receives 3 params, not 4 (no prpCompression)

// GOTCHA: Test factory functions create test data
// createTestSubtask(), createTestPRPDocument(), createMockSessionManager()
// Use these patterns for consistency

// PATTERN: beforeEach/afterEach cleanup
// beforeEach(() => { vi.clearAllMocks(); });
// Ensures clean state between tests

// CRITICAL: Test constants should be defined at top of file
// DEFAULT_MAX_SIZE = 3
// DEFAULT_NO_CACHE = false
// DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This PRP updates existing test code.

**Test Constants to Add** (at top of test file):
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
  - LOCATION: tests/unit/core/research-queue.test.ts, after imports (around line 90)
  - ADD: Test constants for default values
  - IMPLEMENT:
    const DEFAULT_MAX_SIZE = 3;
    const DEFAULT_NO_CACHE = false;
    const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  - PATTERN: Follow existing constant definitions in test file
  - PLACEMENT: After factory functions, before first describe block

Task 2: UPDATE CONSTRUCTOR TESTS (Lines 130-275)
  - LOCATION: tests/unit/core/research-queue.test.ts lines 130-304
  - UPDATE: All 6 constructor test cases
  - PATTERN: Change from new ResearchQueue(mockManager, <maxSize>) to new ResearchQueue(mockManager, <maxSize>, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - SPECIFIC UPDATES:
    Line 130: new ResearchQueue(mockManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 159: new ResearchQueue(mockManager, 5, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 188: new ResearchQueue(mockManager, 1, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 217: new ResearchQueue(mockManager, 10, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 246: new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 275: new ResearchQueue(mockManager, 3, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All test assertions and test purposes

Task 3: UPDATE PRPGenerator MOCK ASSERTION (Line 278)
  - LOCATION: tests/unit/core/research-queue.test.ts line 278
  - CURRENT: expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, false, 86400000);
  - UPDATE TO: expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
  - REASON: Use constants for consistency, validate exact values
  - GOTCHA: PRPGenerator receives 3 params (sessionManager, noCache, cacheTtlMs), not 4

Task 4: UPDATE QUEUE STATE TESTS (Lines 304-335)
  - LOCATION: tests/unit/core/research-queue.test.ts lines 304-400
  - UPDATE: Initial state and enqueue tests
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC UPDATES:
    Line 304: new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 335: new ResearchQueue(mockManager, 0, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
    Line 367: new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)
  - PRESERVE: All queue state assertions and test scenarios

Task 5: UPDATE PROCESSING TESTS (Lines 400-667)
  - LOCATION: tests/unit/core/research-queue.test.ts lines 400-667
  - UPDATE: All enqueue, processNext, and deduplication tests
  - COUNT: Approximately 8 test cases
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC LINES: 400, 438, 475, 509, 551, 581, 614, 648
  - PRESERVE: All processing logic assertions and test scenarios

Task 6: UPDATE QUERY METHOD TESTS (Lines 667-1142)
  - LOCATION: tests/unit/core/research-queue.test.ts lines 667-1142
  - UPDATE: All isResearching, getPRP, and waitForPRP tests
  - COUNT: Approximately 12 test cases
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC LINES: 699, 731, 763, 796, 824, 858, 899, 932, 961, 1004, 1038, 1072
  - PRESERVE: All query method assertions and test scenarios

Task 7: UPDATE STATISTICS AND CACHE TESTS (Lines 1142-1259)
  - LOCATION: tests/unit/core/research-queue.test.ts lines 1142-1259
  - UPDATE: All getStats and clearCache tests
  - COUNT: Approximately 4 test cases
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC LINES: 1142, 1176, 1213, 1259
  - PRESERVE: All statistics and cache assertions

Task 8: UPDATE ERROR HANDLING TESTS (Lines 1277-1431)
  - LOCATION: tests/unit/core/research-queue.test.ts lines 1277-1431
  - UPDATE: All error propagation and cleanup tests
  - COUNT: Approximately 5 test cases
  - PATTERN: Add DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS to all instantiations
  - SPECIFIC LINES: 1298, 1331, 1368, 1408
  - PRESERVE: All error handling assertions and test scenarios

Task 9: ADD TESTS FOR noCache AND cacheTtlMs PARAMETERS
  - LOCATION: tests/unit/core/research-queue.test.ts, add new describe block
  - ADD: New test cases for parameter validation
  - IMPLEMENT:
    describe('noCache parameter', () => {
      it('should forward noCache=true to PRPGenerator', () => {
        const queue = new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, true, DEFAULT_CACHE_TTL_MS);
        expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, true, DEFAULT_CACHE_TTL_MS);
      });
    });

    describe('cacheTtlMs parameter', () => {
      it('should forward custom cacheTtlMs to PRPGenerator', () => {
        const customTtl = 12 * 60 * 60 * 1000; // 12 hours
        const queue = new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, customTtl);
        expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, DEFAULT_NO_CACHE, customTtl);
      });

      it('should use default cacheTtlMs when not specified', () => {
        const queue = new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
        expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
      });
    });
  - PATTERN: Follow existing test structure and assertion patterns
  - PLACEMENT: After existing constructor tests, before processing tests

Task 10: RUN TESTS TO VALIDATE CHANGES
  - COMMAND: npm test -- tests/unit/core/research-queue.test.ts
  - VERIFY: All tests pass
  - EXPECTED: Zero failures
  - ACTION: Fix any failing tests before considering implementation complete

Task 11: VERIFY INTEGRATION WITH S1 IMPLEMENTATION
  - VERIFY: Tests pass with TaskOrchestrator implementation from S1
  - COMMAND: npm test -- tests/unit/core/task-orchestrator.test.ts
  - EXPECTED: All TaskOrchestrator tests pass
  - ACTION: Ensure no regressions in related tests
```

### Implementation Patterns & Key Details

```typescript
// Pattern: Correct 4-parameter ResearchQueue instantiation
// This is the CORRECT pattern to use throughout all tests

const queue = new ResearchQueue(
  mockManager,              // Parameter 1: SessionManager instance
  DEFAULT_MAX_SIZE,         // Parameter 2: Max concurrent tasks (default 3)
  DEFAULT_NO_CACHE,         // Parameter 3: Cache bypass flag (default false)
  DEFAULT_CACHE_TTL_MS      // Parameter 4: Cache TTL in ms (default 24h)
);

// CRITICAL: Always use constants for default values
// Do not hardcode 3, false, or 24*60*60*1000
// Use DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS

// Pattern: PRPGenerator mock assertion
// ResearchQueue calls PRPGenerator with 3 parameters (not 4)
expect(MockPRPGenerator).toHaveBeenCalledWith(
  mockManager,              // Parameter 1: sessionManager
  DEFAULT_NO_CACHE,         // Parameter 2: noCache
  DEFAULT_CACHE_TTL_MS      // Parameter 3: cacheTtlMs
  // Note: No prpCompression parameter - PRPGenerator uses default
);

// Pattern: Test-specific parameter overrides
// When testing specific parameter values, override only that parameter

describe('maxSize parameter', () => {
  it('should handle maxSize of 5', () => {
    const queue = new ResearchQueue(
      mockManager,
      5,                       // Override maxSize
      DEFAULT_NO_CACHE,        // Use default for noCache
      DEFAULT_CACHE_TTL_MS     // Use default for cacheTtlMs
    );
    expect(queue.maxSize).toBe(5);
  });
});

// Pattern: Testing noCache parameter variations

describe('noCache parameter', () => {
  it('should forward noCache=true to PRPGenerator', () => {
    const queue = new ResearchQueue(
      mockManager,
      DEFAULT_MAX_SIZE,
      true,                    // Override noCache to true
      DEFAULT_CACHE_TTL_MS
    );
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      true,                    // Expect true in PRPGenerator call
      DEFAULT_CACHE_TTL_MS
    );
  });
});

// Pattern: Testing cacheTtlMs parameter variations

describe('cacheTtlMs parameter', () => {
  it('should forward custom cacheTtlMs to PRPGenerator', () => {
    const customTtl = 12 * 60 * 60 * 1000;  // 12 hours
    const queue = new ResearchQueue(
      mockManager,
      DEFAULT_MAX_SIZE,
      DEFAULT_NO_CACHE,
      customTtl                 // Override cacheTtlMs
    );
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      DEFAULT_NO_CACHE,
      customTtl                // Expect custom TTL in PRPGenerator call
    );
  });
});

// GOTCHA: ResearchQueue vs PRPGenerator parameter counts
// ResearchQueue constructor: 4 parameters (sessionManager, maxSize, noCache, cacheTtlMs)
// PRPGenerator constructor: 4 parameters (sessionManager, noCache, cacheTtlMs, prpCompression)
// ResearchQueue calls PRPGenerator with: 3 parameters (no prpCompression)

// In ResearchQueue constructor (line 105):
// this.#prpGenerator = new PRPGenerator(sessionManager, noCache, cacheTtlMs);
// PRPGenerator's 4th parameter (prpCompression) uses default 'standard'

// PATTERN: Test factory functions (already exist in file)
const createMockSessionManager = (currentSession: any): SessionManager => {
  const mockManager = {
    currentSession,
  } as unknown as SessionManager;
  return mockManager;
};

// PATTERN: Test setup/teardown (already exists)
beforeEach(() => {
  vi.clearAllMocks();
});

// PATTERN: Mock setup (already exists at top of file)
vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn(),
}));

import { PRPGenerator } from '../../../src/agents/prp-generator.js';
const MockPRPGenerator = PRPGenerator as any;
```

### Integration Points

```yaml
TEST_FILE:
  - file: tests/unit/core/research-queue.test.ts
  - updates: 39 ResearchQueue instantiations, 1 PRPGenerator mock assertion
  - additions: Test constants, new parameter validation tests

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

INTEGRATION_TESTS:
  - file: tests/integration/core/research-queue.test.ts
  - status: Will be updated in S3
  - dependency: S3 depends on S2 completion

TEST_FRAMEWORK:
  - framework: Vitest
  - mock_pattern: vi.mock(), vi.fn(), expect().toHaveBeenCalledWith()
  - test_structure: SETUP, EXECUTE, VERIFY
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

### Level 2: Unit Tests (Component Validation)

```bash
# Test ResearchQueue unit tests with verbose output
npm test -- tests/unit/core/research-queue.test.ts --verbose

# Expected: All 39+ tests pass
# Key tests to verify after updates:
# - "should store sessionManager as readonly property" (line 130)
# - "should set maxSize from constructor parameter" (line 159)
# - "should handle minimum concurrency of 1" (line 188)
# - "should handle maximum concurrency of 10" (line 217)
# - "should use default maxSize of 3 when not specified" (line 246)
# - "should create PRPGenerator with sessionManager" (line 275) - CRITICAL
# - "should forward noCache=true to PRPGenerator" (NEW)
# - "should forward custom cacheTtlMs to PRPGenerator" (NEW)

# Test TaskOrchestrator unit tests (ensure no regressions)
npm test -- tests/unit/core/task-orchestrator.test.ts

# Expected: All tests pass
# Verifies: S1 implementation still works correctly

# Run all core unit tests
npm test -- tests/unit/core/

# Expected: All tests pass
# Coverage: Should maintain or improve coverage

# Run with coverage report (if available)
npm test -- tests/unit/core/research-queue.test.ts --coverage

# Expected: Coverage thresholds met
# Check that new tests for noCache and cacheTtlMs are covered
```

### Level 3: Integration Testing (System Validation)

```bash
# Test ResearchQueue integration
npm test -- tests/integration/core/research-queue.test.ts

# Expected: All tests pass (or skip if S3 not yet done)
# Verifies: Real ResearchQueue instantiation works correctly

# Test TaskOrchestrator integration
npm test -- tests/integration/core/task-orchestrator.test.ts

# Expected: All tests pass
# Verifies: TaskOrchestrator's 4-parameter instantiation works with tests

# Run full integration test suite
npm test -- tests/integration/

# Expected: All integration tests pass
```

### Level 4: Cross-Validation with S1 Implementation

```bash
# Verify S1 TaskOrchestrator changes work with updated tests
npm test -- tests/unit/core/ --reporter=verbose

# Expected: All ResearchQueue and TaskOrchestrator tests pass
# Verifies: S1 and S2 are consistent

# Manual verification: Check all ResearchQueue instantiations
grep -n "new ResearchQueue(" tests/unit/core/research-queue.test.ts

# Expected: All 39+ instantiations show 4 parameters
# Example output:
# 130:    const queue = new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
# 159:    const queue = new ResearchQueue(mockManager, 5, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);
# ...

# Verify PRPGenerator mock assertion uses constants
grep -A 1 "MockPRPGenerator" tests/unit/core/research-queue.test.ts | grep "toHaveBeenCalledWith"

# Expected: All assertions use DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS
# Example: expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);

# Verify test constants are defined
grep "DEFAULT_" tests/unit/core/research-queue.test.ts | head -5

# Expected output:
# const DEFAULT_MAX_SIZE = 3;
# const DEFAULT_NO_CACHE = false;
# const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
```

## Final Validation Checklist

### Technical Validation

- [ ] All 39 ResearchQueue instantiations updated to 4-parameter signature
- [ ] Test constants defined: DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS
- [ ] PRPGenerator mock assertion updated to use constants
- [ ] New tests added for noCache and cacheTtlMs parameter variations
- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] All ResearchQueue unit tests pass: `npm test -- tests/unit/core/research-queue.test.ts`
- [ ] TaskOrchestrator unit tests pass (no regressions): `npm test -- tests/unit/core/task-orchestrator.test.ts`
- [ ] All core unit tests pass: `npm test -- tests/unit/core/`
- [ ] Tests validate PRPGenerator receives correct parameters
- [ ] Tests cover noCache=true scenario
- [ ] Tests cover custom cacheTtlMs scenario
- [ ] Existing test scenarios remain functional

### Code Quality Validation

- [ ] Test code follows existing patterns in research-queue.test.ts
- [ ] Mock/fs patterns remain unchanged
- [ ] Test structure (SETUP, EXECUTE, VERIFY) preserved
- [ ] Factory functions still used for test data
- [ ] beforeEach/afterEach cleanup maintained
- [ ] Test names remain descriptive and clear
- [ ] No hardcoded parameter values (all use constants)

### Integration & Consistency

- [ ] Tests consistent with TaskOrchestrator implementation from S1
- [ ] Parameter order matches ResearchQueue constructor signature
- [ ] PRPGenerator mock assertion matches actual call signature
- [ ] Ready for S3 (integration tests) to build upon this work
- [ ] No breaking changes to test interfaces

### Documentation & Deployment

- [ ] Test constants are self-documenting with clear names
- [ ] New tests for noCache and cacheTtlMs are well-documented
- [ ] Test descriptions clearly indicate what is being validated
- [ ] Changes are ready for code review

---

## Anti-Patterns to Avoid

- ❌ Don't hardcode parameter values - use DEFAULT_* constants
- ❌ Don't change the ResearchQueue constructor signature - it's already correct
- ❌ Don't modify PRPGenerator constructor signature - not in scope
- ❌ Don't skip validating PRPGenerator mock assertions
- ❌ Don't break existing test scenarios - maintain all test coverage
- ❌ Don't forget to add tests for noCache and cacheTtlMs variations
- ❌ Don't change mock/fs patterns - keep existing test infrastructure
- ❌ Don't use different default values than S1 - use 3, false, 24*60*60*1000
- ❌ Don't mix up parameter order - must be (sessionManager, maxSize, noCache, cacheTtlMs)
- ❌ Don't forget PRPGenerator receives 3 params, not 4 (no prpCompression)

## Notes

**Current State Analysis**:
As of the S1 completion, TaskOrchestrator correctly passes all 4 parameters to ResearchQueue. However, the unit tests in `tests/unit/core/research-queue.test.ts` still use the old 2-parameter constructor signature. This PRP updates all 39 test instantiations to match the correct 4-parameter signature.

**Test Instantiation Summary**:
- 39 total ResearchQueue instantiations need updating
- 6 constructor tests (lines 130-304)
- 1 PRPGenerator mock assertion (line 278)
- 33 additional test cases covering processing, querying, statistics, caching, and error handling

**Parameter Forwarding Chain**:
1. TaskOrchestrator → ResearchQueue: 4 parameters (sessionManager, maxSize, noCache, cacheTtlMs)
2. ResearchQueue → PRPGenerator: 3 parameters (sessionManager, noCache, cacheTtlMs)
3. PRPGenerator: 4 parameters total (sessionManager, noCache, cacheTtlMs, prpCompression='standard')

**Related Work Items**:
- P1.M1.T1.S1: Complete - TaskOrchestrator ResearchQueue instantiation
- P1.M1.T1.S2: This task - Update ResearchQueue unit tests
- P1.M1.T1.S3: Pending - Update ResearchQueue integration tests

**Confidence Score**: 10/10 - This is a straightforward test update with clear success criteria, comprehensive research, and specific line-by-line guidance.

**Implementation Estimate**: ~2-3 hours for careful update of all 39 instantiations and validation of test results.
