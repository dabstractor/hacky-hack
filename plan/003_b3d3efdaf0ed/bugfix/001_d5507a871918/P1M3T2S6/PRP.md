# Product Requirement Prompt (PRP): Add Unit Tests for Nested Execution Guard

---

## Goal

**Feature Goal**: Validate that comprehensive unit tests exist for the nested execution guard functionality, ensuring all contract requirements are met and tests pass with the implementation from P1.M3.T2.S1-S4.

**Deliverable**: Verified test suite at `/tests/unit/utils/validation/execution-guard.test.ts` that covers all 5 contract scenarios and passes with the `validateNestedExecution` implementation.

**Success Definition**:
- All 5 contract test scenarios are covered by existing tests
- All tests pass when run with the implementation from P1.M3.T2.S1-S4
- No test failures or errors
- Test coverage is comprehensive and production-ready

## User Persona

**Target User**: Developers and QA engineers validating the nested execution guard implementation

**Use Case**: After implementing the nested execution guard (P1.M3.T2.S1-S2) and setting the environment variable (P1.M3.T2.S4), verify that the guard works correctly across all scenarios

**User Journey**:
1. Developer completes implementation of `validateNestedExecution` function and `NestedExecutionError` class
2. Developer sets `PRP_PIPELINE_RUNNING` environment variable in PRP Pipeline
3. Developer runs unit tests to verify guard functionality
4. Tests pass, confirming guard works as specified

**Pain Points Addressed**:
- Ensures nested execution guard actually prevents recursive pipeline execution
- Validates that legitimate bugfix recursion is allowed
- Confirms error messages include proper context for debugging
- Prevents regressions in guard functionality

## Why

- **Implementation Validation**: Tests verify that the guard implementation from P1.M3.T2.S1-S4 works correctly
- **Regression Prevention**: Comprehensive test coverage prevents future changes from breaking guard functionality
- **Contract Compliance**: Validates that all 5 scenarios from the contract definition are covered
- **Debugging Support**: Tests verify error messages include PID and context for troubleshooting
- **Production Readiness**: Guard is critical infrastructure; tests are essential for production deployment

## What

### User-Visible Behavior

**No direct user-visible changes** - this is test validation for infrastructure-level functionality.

**Observable behavior:**
- Running `npm test -- tests/unit/utils/validation/execution-guard.test.ts` executes all guard tests
- All tests pass with green checkmarks
- Test output shows coverage for all scenarios
- No test failures or errors

### Success Criteria

- [ ] All 5 contract test scenarios have corresponding tests
- [ ] Test for first execution (PRP_PIPELINE_RUNNING not set) passes
- [ ] Test for nested execution error (main session path) passes
- [ ] Test for bugfix recursion allowed (SKIP_BUG_FINDING=true) passes
- [ ] Test for non-bugfix path with flag (should error) passes
- [ ] Test for error message includes PID passes
- [ ] All tests pass when run: `npm test -- tests/unit/utils/validation/execution-guard.test.ts`
- [ ] No test failures or errors
- [ ] Test coverage is comprehensive (edge cases, type guards, instanceof checks)

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to validate the tests successfully?

**Answer**: YES - This PRP provides:
- Exact location of existing test file with line numbers
- Complete mapping of contract requirements to test cases
- Implementation logic being tested
- Vitest testing patterns and commands
- Environment variable mocking patterns
- Expected test outcomes for each scenario

### Documentation & References

```yaml
# MUST READ - Existing test file (ALREADY COMPLETE)
- file: tests/unit/utils/validation/execution-guard.test.ts
  why: Contains all unit tests for nested execution guard - this is what we validate
  pattern: |
    - Lines 47-74: First execution tests (PRP_PIPELINE_RUNNING not set)
    - Lines 80-120: Bugfix recursion tests (SKIP_BUG_FINDING=true + path contains 'bugfix')
    - Lines 126-231: Nested execution error tests (throws NestedExecutionError)
    - Lines 237-298: Error properties tests (PID in message, context)
    - Lines 305-353: Type guard tests (isNestedExecutionError)
    - Lines 359-392: Instanceof tests
    - Lines 398-434: Edge case tests
  gotcha: |
    - Tests are already complete and comprehensive
    - This task is VALIDATION, not creation
    - Tests use vi.stubEnv() for environment variable mocking
    - Tests use vi.unstubAllEnvs() for cleanup in afterEach

# MUST READ - Implementation being tested
- file: src/utils/validation/execution-guard.ts
  why: Contains validateNestedExecution function and NestedExecutionError class
  pattern: |
    - Lines 56-85: validateNestedExecution function logic
    - Function checks PRP_PIPELINE_RUNNING environment variable
    - Function checks SKIP_BUG_FINDING environment variable
    - Function checks if sessionPath contains 'bugfix' (case-insensitive)
    - Throws NestedExecutionError for illegitimate nested execution
  critical: |
    - SKIP_BUG_FINDING must be exactly 'true' (case-sensitive)
    - Path check is case-insensitive (toLowerCase().includes('bugfix'))
    - Returns without error if PRP_PIPELINE_RUNNING is not set
    - Returns without error if both SKIP_BUG_FINDING='true' AND path contains 'bugfix'
    - Throws NestedExecutionError otherwise

# MUST READ - Previous subtask PRPs (dependencies)
- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S1/PRP.md
  why: Defines validateNestedExecution function implementation
  section: "Implementation Blueprint"
  note: Tests validate this implementation

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S2/PRP.md
  why: Defines NestedExecutionError class implementation
  section: "Implementation Blueprint"
  note: Tests validate error properties and message format

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S4/PRP.md
  why: Defines PRP_PIPELINE_RUNNING environment variable
  section: "Implementation Blueprint"
  note: Tests validate guard checks this environment variable

# MUST READ - Contract requirement mapping
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S6/research/04_contract_requirement_mapping.md
  why: Complete mapping of 5 contract requirements to existing test cases
  section: "Summary Table"
  critical: |
    - Requirement 1: First execution - Lines 47-74 (5 tests)
    - Requirement 2: Nested execution error - Lines 136-156 (3 tests)
    - Requirement 3: Bugfix recursion allowed - Lines 80-120 (7 tests)
    - Requirement 4: Non-bugfix path with flag - Lines 171-196 (3 tests)
    - Requirement 5: Error message includes PID - Lines 242-298 (5 tests)

# MUST READ - Vitest testing patterns
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S6/research/02_vitest_testing_patterns.md
  why: Complete guide to Vitest patterns used in tests
  section: "Environment Variable Mocking Patterns" and "Error Testing Patterns"
  critical: |
    - Use vi.stubEnv(name, value) to set environment variables
    - Use vi.unstubAllEnvs() in afterEach to restore environment
    - Use expect().toThrow(ErrorClass) to test for specific errors
    - Use expect().not.toThrow() to test for no error
    - Use try-catch with expect.fail() to test error properties

# MUST READ - Test coverage analysis
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S6/research/01_existing_test_coverage_analysis.md
  why: Analysis of existing test coverage vs contract requirements
  section: "Contract Requirement vs Existing Coverage"
  critical: |
    - All 5 contract requirements are already covered
    - Tests are comprehensive and production-ready
    - No additional tests needed
    - This task is validation, not creation

# MUST READ - Implementation analysis
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S6/research/03_implementation_analysis.md
  why: Complete analysis of validateNestedExecution function logic
  section: "Decision Matrix" and "Testing Considerations"
  critical: |
    - Decision matrix shows all execution paths
    - Testing considerations show expected behavior for each scenario
    - Case sensitivity details are critical for test validation
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── utils/
│   ├── validation/
│   │   └── execution-guard.ts         # validateNestedExecution function (lines 56-85)
│   └── errors.ts                       # NestedExecutionError class (lines 522-538)

tests/
└── unit/
    └── utils/
        └── validation/
            └── execution-guard.test.ts # COMPLETE - All tests already exist
                ├── Lines 47-74: First execution tests
                ├── Lines 80-120: Bugfix recursion tests
                ├── Lines 126-231: Nested execution error tests
                ├── Lines 237-298: Error properties tests
                ├── Lines 305-353: Type guard tests
                ├── Lines 359-392: Instanceof tests
                └── Lines 398-434: Edge case tests
```

### Desired Codebase Tree (No Changes)

```bash
# No changes needed - tests already exist

tests/
└── unit/
    └── utils/
        └── validation/
            └── execution-guard.test.ts # NO MODIFICATION NEEDED
                # All 5 contract scenarios are covered
                # All edge cases are tested
                # Tests are production-ready
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: SKIP_BUG_FINDING is case-sensitive
// Only lowercase 'true' works, 'TRUE', 'True', '1', 'yes' do NOT work
process.env.SKIP_BUG_FINDING === 'true'  // ✅ Works
process.env.SKIP_BUG_FINDING === 'TRUE'  // ❌ Does NOT work

// CRITICAL: Path check is case-insensitive
// Matches 'bugfix', 'BUGFIX', 'BugFix', 'bugFiX', etc.
sessionPath.toLowerCase().includes('bugfix')

// CRITICAL: Must use vi.unstubAllEnvs() in afterEach
// Otherwise environment variables leak between tests
afterEach(() => {
  vi.unstubAllEnvs();
});

// CRITICAL: Use expect().toThrow(ErrorClass) for error testing
// Not expect().toThrow('string') - less specific
expect(() => validateNestedExecution(path)).toThrow(NestedExecutionError);

// CRITICAL: Use expect().not.toThrow() for success testing
// Not expect(() => fn()).not.toThrow() without parentheses
expect(() => validateNestedExecution(path)).not.toThrow();

// GOTCHA: Use try-catch with expect.fail() for error property testing
// Cannot use expect().toThrow() if you need to inspect error properties
try {
  validateNestedExecution(path);
  expect.fail('Should have thrown NestedExecutionError');
} catch (error) {
  expect(error.existingPid).toBe('99999');
}

// GOTCHA: Test file uses .js extension in imports (ESM requirement)
import { validateNestedExecution } from '../../../../src/utils/validation/execution-guard.js';
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Tests validate:

- `validateNestedExecution(sessionPath: string): void` - Function being tested
- `NestedExecutionError` - Error class thrown by function
- `isNestedExecutionError(error: unknown): error is NestedExecutionError` - Type guard function

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: VERIFY existing test file exists and is complete
  - CHECK: tests/unit/utils/validation/execution-guard.test.ts exists
  - VERIFY: All 5 contract scenarios have corresponding tests
  - VERIFY: Test file has 436 lines (comprehensive coverage)
  - LOCATION: tests/unit/utils/validation/execution-guard.test.ts

Task 2: VERIFY test implementation from P1.M3.T2.S1-S2
  - CHECK: src/utils/validation/execution-guard.ts exists
  - VERIFY: validateNestedExecution function is implemented (lines 56-85)
  - VERIFY: NestedExecutionError class is implemented (in errors.ts)
  - VERIFY: isNestedExecutionError type guard is implemented
  - LOCATION: src/utils/validation/execution-guard.ts

Task 3: VERIFY environment variable setup from P1.M3.T2.S4
  - CHECK: PRP_PIPELINE_RUNNING is set in PRP Pipeline
  - VERIFY: Environment variable is set after validation passes
  - VERIFY: Environment variable is cleared in finally block
  - LOCATION: src/workflows/prp-pipeline.ts run() method

Task 4: RUN unit tests for execution guard
  - EXECUTE: npm test -- tests/unit/utils/validation/execution-guard.test.ts
  - VERIFY: All tests pass (green checkmarks)
  - VERIFY: No test failures or errors
  - VERIFY: Test output shows 100% pass rate
  - EXPECTED: All 436 lines of tests should pass

Task 5: VERIFY specific test scenarios
  - CHECK: First execution tests pass (lines 47-74)
  - CHECK: Bugfix recursion tests pass (lines 80-120)
  - CHECK: Nested execution error tests pass (lines 126-231)
  - CHECK: Error properties tests pass (lines 237-298)
  - CHECK: Type guard tests pass (lines 305-353)
  - CHECK: Instanceof tests pass (lines 359-392)
  - CHECK: Edge case tests pass (lines 398-434)

Task 6: VALIDATE test coverage
  - RUN: npm test -- --coverage tests/unit/utils/validation/execution-guard.test.ts
  - VERIFY: Coverage report shows 100% for validateNestedExecution function
  - VERIFY: Coverage report shows 100% for NestedExecutionError class
  - VERIFY: All code paths are tested

Task 7: DOCUMENT test results
  - RECORD: Number of tests passed
  - RECORD: Test execution time
  - RECORD: Any warnings or issues
  - CONFIRM: All 5 contract requirements are validated
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Environment variable mocking in tests
// Location: tests/unit/utils/validation/execution-guard.test.ts

beforeEach(() => {
  // Clear environment variables before each test
  delete process.env.PRP_PIPELINE_RUNNING;
  delete process.env.SKIP_BUG_FINDING;
});

afterEach(() => {
  // CRITICAL: Always restore environment state
  vi.unstubAllEnvs();
});

// Pattern 2: Testing first execution (PRP_PIPELINE_RUNNING not set)
// Location: Lines 47-74

it('should allow execution for any path', () => {
  const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
  expect(() => validateNestedExecution(sessionPath)).not.toThrow();
});

// Pattern 3: Testing nested execution error
// Location: Lines 126-156

it('should throw NestedExecutionError for feature path', () => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  expect(() => validateNestedExecution(sessionPath)).toThrow(
    NestedExecutionError
  );
});

// Pattern 4: Testing bugfix recursion allowed
// Location: Lines 80-120

beforeEach(() => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  vi.stubEnv('SKIP_BUG_FINDING', 'true');
});

it('should allow execution for bugfix path', () => {
  const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
  expect(() => validateNestedExecution(sessionPath)).not.toThrow();
});

// Pattern 5: Testing error properties
// Location: Lines 237-298

it('should include existing PID in error message', () => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
    expect.fail('Should have thrown NestedExecutionError');
  } catch (error) {
    expect((error as Error).message).toContain('99999');
    expect((error as NestedExecutionError).existingPid).toBe('99999');
    expect((error as NestedExecutionError).currentPid).toBeDefined();
    expect((error as NestedExecutionError).sessionPath).toBe(sessionPath);
  }
});

// Pattern 6: Testing type guard
// Location: Lines 305-353

it('should identify NestedExecutionError correctly', () => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
    expect.fail('Should have thrown NestedExecutionError');
  } catch (error) {
    expect(isNestedExecutionError(error)).toBe(true);
  }
});

// GOTCHA: Tests are already complete
// Do NOT modify tests unless there are failures
// This task is VALIDATION, not creation

// GOTCHA: Case sensitivity in tests
// Tests verify that SKIP_BUG_FINDING must be exactly 'true'
// Tests verify that path check is case-insensitive

// GOTCHA: Environment variable cleanup is critical
// Always use vi.unstubAllEnvs() in afterEach
// Otherwise tests will pollute each other

// PATTERN: Test organization
- Outer describe block: 'execution-guard'
- Inner describe blocks: Group by scenario
- Test names: 'should [expected behavior]'

// PATTERN: Assertion variety
- expect().toThrow() for error testing
- expect().not.toThrow() for success testing
- expect().toContain() for substring matching
- expect().toBe() for exact equality
- expect().toBeDefined() for existence checking
```

### Integration Points

```yaml
TEST_FRAMEWORK:
  - framework: Vitest
  - runner: npm test --
  - watch mode: npm test -- --watch
  - coverage: npm test -- --coverage

ENVIRONMENT_VARIABLES:
  - PRP_PIPELINE_RUNNING: Set in tests with vi.stubEnv()
  - SKIP_BUG_FINDING: Set in tests with vi.stubEnv()
  - cleanup: vi.unstubAllEnvs() in afterEach

IMPLEMENTATION_DEPENDENCIES:
  - depends_on: P1.M3.T2.S1 (validateNestedExecution function)
  - depends_on: P1.M3.T2.S2 (NestedExecutionError class)
  - depends_on: P1.M3.T2.S4 (PRP_PIPELINE_RUNNING environment variable)
  - sequence: S1 -> S2 -> S4 -> S6 (this task validates the previous tasks)

TEST_FILE:
  - location: tests/unit/utils/validation/execution-guard.test.ts
  - lines: 436 lines total
  - tests: ~40 test cases
  - coverage: All contract requirements + edge cases

VALIDATION_COMMANDS:
  - run specific file: npm test -- tests/unit/utils/validation/execution-guard.test.ts
  - run all unit tests: npm test -- tests/unit/
  - run with coverage: npm test -- --coverage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify test file syntax
npm test -- tests/unit/utils/validation/execution-guard.test.ts --reporter=verbose

# Expected: No syntax errors, tests compile and run

# Run linting on test file
npm run lint tests/unit/utils/validation/execution-guard.test.ts

# Expected: Zero linting errors

# Run type checking on test file
npm run type-check

# Expected: Zero type errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run execution guard tests
npm test -- tests/unit/utils/validation/execution-guard.test.ts

# Expected output:
# ✓ tests/unit/utils/validation/execution-guard.test.ts (40 tests)
#   ✓ execution-guard
#     ✓ validateNestedExecution when PRP_PIPELINE_RUNNING is not set (5 tests)
#     ✓ validateNestedExecution when PRP_PIPELINE_RUNNING is set with bug fix recursion (7 tests)
#     ✓ validateNestedExecution when PRP_PIPELINE_RUNNING is set without bug fix recursion (11 tests)
#     ✓ validateNestedExecution error properties (5 tests)
#     ✓ isNestedExecutionError type guard (5 tests)
#     ✓ NestedExecutionError instanceof checks (3 tests)
#     ✓ validateNestedExecution edge cases (5 tests)
#
# Test Files  1 passed (1)
# Tests  40 passed (40)
# Duration  <X ms

# Verify specific contract scenarios
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "should allow first execution"
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "should throw NestedExecutionError"
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "should allow nested execution for bugfix"
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "should include PID in error"

# Expected: All scenario tests pass

# Run with coverage
npm test -- --coverage tests/unit/utils/validation/execution-guard.test.ts

# Expected:
# - validateNestedExecution function: 100% coverage
# - NestedExecutionError class: 100% coverage
# - isNestedExecutionError function: 100% coverage
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all unit tests to ensure no regressions
npm test -- tests/unit/

# Expected: All unit tests pass, including execution guard tests

# Run all tests (unit + integration)
npm test

# Expected: All tests pass, no regressions

# Verify guard works in PRP Pipeline context
# (This is tested by integration tests, not unit tests)
npm test -- tests/integration/prp-pipeline-integration.test.ts

# Expected: Integration tests pass, guard prevents nested execution
```

### Level 4: Contract Requirement Validation

```bash
# Validate Requirement 1: First execution
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "validateNestedExecution when PRP_PIPELINE_RUNNING is not set"

# Expected: 5 tests pass
# ✓ should allow execution for any path
# ✓ should allow execution for feature path
# ✓ should allow execution for empty path
# ✓ should allow execution when SKIP_BUG_FINDING is not set
# ✓ should allow execution when SKIP_BUG_FINDING is false

# Validate Requirement 2: Nested execution error
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "should throw NestedExecutionError for"

# Expected: Multiple tests pass, all throwing NestedExecutionError

# Validate Requirement 3: Bugfix recursion allowed
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "validateNestedExecution when PRP_PIPELINE_RUNNING is set with bug fix recursion"

# Expected: 7 tests pass
# ✓ should allow execution for bugfix path
# ✓ should allow execution for bugfix path at start
# ✓ should allow execution for bugfix path at end
# ✓ should allow execution for BugFix with mixed case
# ✓ should allow execution for BUGFIX with uppercase
# ✓ should allow execution for bugFiX with random case
# ✓ should allow execution for actual bugfix session from codebase

# Validate Requirement 4: Non-bugfix path with flag
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "when path does not contain bugfix"

# Expected: 3 tests pass, all throwing NestedExecutionError

# Validate Requirement 5: Error message includes PID
npm test -- tests/unit/utils/validation/execution-guard.test.ts -t "validateNestedExecution error properties"

# Expected: 5 tests pass
# ✓ should include existing PID in error message
# ✓ should include context with existingPid
# ✓ should include context with currentPid
# ✓ should include context with sessionPath
# ✓ should have correct error code
```

## Final Validation Checklist

### Technical Validation

- [ ] Test file exists: tests/unit/utils/validation/execution-guard.test.ts
- [ ] Implementation file exists: src/utils/validation/execution-guard.ts
- [ ] All tests pass: `npm test -- tests/unit/utils/validation/execution-guard.test.ts`
- [ ] No test failures or errors
- [ ] Test coverage is 100% for validateNestedExecution function
- [ ] Test coverage is 100% for NestedExecutionError class
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`

### Feature Validation

- [ ] Requirement 1 (First execution): 5 tests pass
- [ ] Requirement 2 (Nested execution error): 3+ tests pass
- [ ] Requirement 3 (Bugfix recursion allowed): 7 tests pass
- [ ] Requirement 4 (Non-bugfix path with flag): 3 tests pass
- [ ] Requirement 5 (Error message includes PID): 5 tests pass
- [ ] Additional edge cases tested: 5 tests pass
- [ ] Type guard functionality tested: 5 tests pass
- [ ] Instanceof behavior tested: 3 tests pass

### Code Quality Validation

- [ ] Tests follow existing codebase patterns
- [ ] Environment variable mocking uses vi.stubEnv()
- [ ] Environment cleanup uses vi.unstubAllEnvs()
- [ ] Error testing uses expect().toThrow(NestedExecutionError)
- [ ] Success testing uses expect().not.toThrow()
- [ ] Error property testing uses try-catch with expect.fail()
- [ ] Test names follow "should [expected behavior]" pattern
- [ ] Tests are organized in clear describe blocks

### Documentation & Deployment

- [ ] Research files are saved in research/ subdirectory
- [ ] Contract requirement mapping is documented
- [ ] Test coverage analysis is documented
- [ ] Implementation analysis is documented
- [ ] Vitest testing patterns are documented
- [ ] PRP is complete and comprehensive

## Anti-Patterns to Avoid

- ❌ Don't modify existing tests unless there are failures (tests are already complete)
- ❌ Don't skip environment variable cleanup in afterEach (causes test pollution)
- ❌ Don't use expect().toThrow('string') instead of expect().toThrow(ErrorClass)
- ❌ Don't forget to use expect().not.toThrow() for success scenarios
- ❌ Don't test implementation details (test behavior, not internals)
- ❌ Don't hardcode process.pid in tests (use process.pid dynamically)
- ❌ Don't assume case insensitivity for SKIP_BUG_FINDING (it's case-sensitive)
- ❌ Don't forget to test all error properties (message, existingPid, currentPid, sessionPath)
- ❌ Don't run tests without cleanup (always use vi.unstubAllEnvs())
- ❌ Don't ignore test failures (all tests must pass)

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass validation success likelihood

**Reasoning**:
- Tests already exist and are comprehensive
- All 5 contract requirements are covered
- Test file has 436 lines with ~40 test cases
- Implementation is complete from P1.M3.T2.S1-S4
- Clear validation commands and expected outcomes
- Comprehensive research documentation
- Exact file locations and line numbers provided
- No ambiguity in validation steps

**Validation**: The completed PRP enables validation of the nested execution guard tests using only the PRP content and codebase access. All contract requirements are covered by existing tests, and validation is straightforward: run tests and verify they pass.

## Critical Note

**This PRP is for VALIDATION, not creation.**

The tests at `/tests/unit/utils/validation/execution-guard.test.ts` are already complete and comprehensive. This task (P1.M3.T2.S6) is about verifying that:

1. The tests exist (✅ they do)
2. The tests cover all 5 contract scenarios (✅ they do)
3. The tests pass with the implementation from P1.M3.T2.S1-S4 (validation step)

**No code changes are needed** unless tests fail, which would indicate a problem with the implementation from P1.M3.T2.S1-S4.
