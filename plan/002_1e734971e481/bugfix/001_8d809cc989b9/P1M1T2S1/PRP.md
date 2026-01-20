# PRP: Run Error Handling Integration Tests

**Subtask**: P1.M1.T2.S1
**Work Item**: Run error handling integration tests
**PRD Reference**: Phase 1, Milestone 1, Task 2, Subtask 1

---

## Goal

**Feature Goal**: Execute the error handling integration test suite to validate that the `EnvironmentError` class implementation from P1.M1.T1.S4 is correctly integrated and all 5 EnvironmentError-related integration tests now pass.

**Deliverable**: Test execution results showing all 5 EnvironmentError-related integration tests passing.

**Success Definition**:
- All 5 EnvironmentError-related integration tests pass
- Tests that were failing with 'EnvironmentError is not a constructor' now pass
- Test results documented with before/after comparison
- No regressions in other error handling tests

## User Persona

**Target User**: Developer/QA Engineer validating the EnvironmentError implementation

**Use Case**: After implementing the EnvironmentError class and its type guard, run integration tests to verify the implementation is correctly integrated with the existing error handling infrastructure.

**User Journey**:
1. Developer completes P1.M1.T1.S4 (EnvironmentError implementation)
2. Developer runs integration test suite
3. Developer verifies tests that were failing now pass
4. Developer documents test results

**Pain Points Addressed**:
- Validates implementation completeness
- Confirms no integration issues
- Provides confidence to proceed with next milestone (isFatalError implementation)

## Why

- **Integration Validation**: Confirms EnvironmentError works correctly with the existing error hierarchy
- **Test Coverage**: Validates the implementation against real-world usage patterns
- **Regression Prevention**: Ensures no existing functionality is broken
- **Milestone Completion**: Marks successful completion of P1.M1 (EnvironmentError implementation)
- **Dependency for Next Phase**: P1.M2 (isFatalError) depends on EnvironmentError being fully validated

## What

Run the error handling integration test suite located at `tests/integration/utils/error-handling.test.ts` and verify all 5 EnvironmentError-related tests pass.

### Success Criteria

- [ ] Test suite executes successfully: `npm run test:run -- tests/integration/utils/error-handling.test.ts`
- [ ] Test "should create EnvironmentError with correct properties" passes
- [ ] Test "should identify EnvironmentError as fatal" passes (after isFatalError is implemented in P1.M2)
- [ ] Test "should include EnvironmentError in error type hierarchy" passes
- [ ] All other error handling integration tests continue to pass (no regressions)
- [ ] Test results documented with pass/fail counts

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully? **YES** - This PRP provides:
- Exact test file path and how to run it
- Expected test outcomes and what to check
- Project-specific test commands and configuration
- Known issues and what tests may still fail
- Complete integration test file content as reference

### Documentation & References

```yaml
# PRIMARY SOURCE - Integration test file to run
- file: tests/integration/utils/error-handling.test.ts
  why: This is the integration test suite that validates error handling
  tests_EnvironmentError: Lines 114-123 (should create EnvironmentError with correct properties)
  tests_fatal_detection: Lines 130-160 (Fatal Error Detection suite)
  gotcha: Test "should identify EnvironmentError as fatal" expects isFatalError() which is NOT YET IMPLEMENTED
  critical: Focus on EnvironmentError constructor test, NOT fatal error tests yet

# REFERENCE - EnvironmentError implementation
- file: src/utils/errors.ts
  line: 482-489
  why: Confirms EnvironmentError class is implemented and available
  pattern: Extends PipelineError, uses PIPELINE_VALIDATION_INVALID_INPUT error code
  note: Constructor signature: (message: string, context?: PipelineErrorContext, cause?: Error)

# REFERENCE - EnvironmentError export
- file: src/core/index.ts
  line: 28
  why: Confirms EnvironmentError is exported from core module
  pattern: "export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';"
  critical: Integration tests import from '../../../src/utils/errors.js'

# REFERENCE - Test runner configuration
- file: package.json
  line: 30
  why: Defines the test:run script used to execute tests
  command: "vitest run" - runs tests in CI mode (no watch)
  alternative: "npm test" runs vitest in watch mode

# REFERENCE - Vitest configuration
- file: vitest.config.ts
  why: Shows test environment setup and coverage requirements
  environment: "node" (tests run in Node.js environment)
  coverage_thresholds: 100% for all metrics (statements, branches, functions, lines)
  gotcha: Project enforces strict coverage thresholds

# REFERENCE - Test environment setup
- file: tests/setup.ts
  why: Global test configuration including .env loading and API endpoint validation
  critical: Tests require z.ai API endpoint, NOT Anthropic's official API
  dotenv_config: Loads .env file but doesn't fail if missing
  api_validation: Blocks tests from using Anthropic's production API

# CONTEXT - Previous subtask completion
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1.T1/tasks.json
  status: P1.M1.T1.S4 (Export EnvironmentError from core index) is Complete
  dependency: This task depends on P1.M1.T1.S4 being complete
  note: EnvironmentError class must be implemented and exported before running tests

# CONTEXT - Related system documentation
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/docs/system_context.md
  section: "1.2 Missing Error Handling Components"
  why: Documents why EnvironmentError was missing and what tests expect
  impact: "5 integration tests failing" due to missing EnvironmentError
```

### Current Codebase Structure

```bash
src/
├── utils/
│   └── errors.ts              # EnvironmentError implementation (lines 482-489)
├── core/
│   └── index.ts               # EnvironmentError export (line 28)
└── index.ts                   # Main entry point

tests/
├── integration/
│   └── utils/
│       └── error-handling.test.ts    # INTEGRATION TEST SUITE TO RUN
├── unit/
│   └── utils/
│       └── errors-environment.test.ts # Unit tests (should already pass)
├── fixtures/
│   └── simple-prd.ts          # Test fixtures
└── setup.ts                   # Global test configuration

plan/002_1e734971e481/bugfix/001_8d809cc989b9/
├── P1M1T1S4/                  # Previous subtask (Complete)
│   └── PRP.md                 # EnvironmentError export PRP
└── P1M1T2S1/                  # THIS SUBTASK
    └── PRP.md                 # This document
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: isFatalError() is NOT YET IMPLEMENTED
// The test "should identify EnvironmentError as fatal" will FAIL
// This is EXPECTED - isFatalError will be implemented in P1.M2
// Focus on: "should create EnvironmentError with correct properties" test

// CRITICAL: Integration tests import from '../../../src/utils/errors.js'
// Path is relative to tests/integration/utils/error-handling.test.ts
// Resolves to: /home/dustin/projects/hacky-hack/src/utils/errors.ts

// CRITICAL: Vitest run mode vs watch mode
// Use: npm run test:run -- <test_file>  (CI mode, exits after completion)
// NOT: npm test -- <test_file>          (Watch mode, doesn't exit)

// CRITICAL: Project uses ESM with .js extensions in imports
// Even though source files are .ts, imports use .js extension
// TypeScript compilation handles this automatically

// CRITICAL: All error classes extend PipelineError (abstract base class)
// EnvironmentError must be instanceof PipelineError
// EnvironmentError must be instanceof Error (via prototype chain)

// CRITICAL: Vitest coverage thresholds are 100%
// If coverage drops below 100%, tests will fail
// Use --coverage flag to check: npm run test:coverage

// CRITICAL: Test fixtures use temp directories
// Tests create temp dirs in /tmp/error-handling-test-XXXXXX
// Cleanup happens in afterEach() hook

// CRITICAL: Tests expect EnvironmentError to accept context parameter
// Constructor: new EnvironmentError(message, context)
// Context properties are attached to error instance
// Example: (error as any).variable should equal 'TEST_VAR'
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is a test execution task. The `EnvironmentError` class is already implemented in P1.M1.T1.S2-P1.M1.T1.S4.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY EnvironmentError implementation exists
  - CHECK: src/utils/errors.ts contains EnvironmentError class (lines 482-489)
  - CHECK: src/core/index.ts exports EnvironmentError (line 28)
  - VERIFY: Constructor signature matches test expectations
  - CONFIRM: Previous subtask P1.M1.T1.S4 is marked Complete

Task 2: RUN integration test suite
  - EXECUTE: npm run test:run -- tests/integration/utils/error-handling.test.ts
  - CAPTURE: Full test output including pass/fail counts
  - IDENTIFY: Which tests pass, which tests fail
  - NOTE: Any error messages or stack traces

Task 3: ANALYZE test results
  - CHECK: "should create EnvironmentError with correct properties" - should PASS
  - CHECK: "should identify EnvironmentError as fatal" - will FAIL (isFatalError not implemented)
  - CHECK: Other EnvironmentError-related tests
  - VERIFY: No regressions in other error handling tests

Task 4: DOCUMENT test results
  - RECORD: Total tests run
  - RECORD: Tests passed
  - RECORD: Tests failed (with reason for each failure)
  - SAVE: Test output to research/ subdirectory
  - COMPARE: Before state (5 tests failing) vs After state

Task 5: VALIDATE no regressions
  - CHECK: All other error type tests still pass
  - VERIFY: SessionError tests pass
  - VERIFY: TaskError tests pass
  - VERIFY: ValidationError tests pass
  - VERIFY: AgentError tests pass
```

### Implementation Patterns & Key Details

```typescript
// INTEGRATION TEST EXPECTATIONS (from error-handling.test.ts):

// Test 1: EnvironmentError constructor (lines 114-123)
it('should create EnvironmentError with correct properties', () => {
  const error = new EnvironmentError('Test environment error', {
    variable: 'TEST_VAR',
  });

  expect(error).toBeInstanceOf(PipelineError);  // Must extend PipelineError
  expect(error.name).toBe('EnvironmentError'); // Must have correct name
  expect(error.message).toBe('Test environment error'); // Message must match
  expect((error as any).variable).toBe('TEST_VAR'); // Context must be preserved
});

// Test 2: Fatal error detection (lines 136-139) - WILL FAIL (isFatalError not yet implemented)
it('should identify EnvironmentError as fatal', () => {
  const error = new EnvironmentError('Missing API key');
  expect(isFatalError(error)).toBe(true);  // Expects isFatalError() function
});

// IMPLEMENTATION CHECKLIST:
// [ ] EnvironmentError class exists in src/utils/errors.ts
// [ ] EnvironmentError extends PipelineError
// [ ] EnvironmentError constructor accepts (message, context, cause)
// [ ] EnvironmentError exported from src/core/index.ts
// [ ] isEnvironmentError type guard exported
// [ ] Tests can import EnvironmentError
// [ ] Tests can construct EnvironmentError instances
// [ ] EnvironmentError instanceof PipelineError returns true
// [ ] EnvironmentError instanceof Error returns true
// [ ] Context properties are preserved on error instance
```

### Integration Points

```yaml
INTEGRATION_TEST_FILE:
  - path: tests/integration/utils/error-handling.test.ts
  - target_tests: 5 tests related to EnvironmentError
  - import_path: '../../../src/utils/errors.js'
  - imports: EnvironmentError, isFatalError (not yet implemented)

ENVIRONMENTERROR_CLASS:
  - location: src/utils/errors.ts (lines 482-489)
  - extends: PipelineError
  - error_code: PIPELINE_VALIDATION_INVALID_INPUT
  - constructor: (message: string, context?: PipelineErrorContext, cause?: Error)

EXPORT_LOCATION:
  - file: src/core/index.ts (line 28)
  - export: "export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';"

TEST_RUNNER:
  - command: npm run test:run -- tests/integration/utils/error-handling.test.ts
  - alternative: npm run test:run tests/integration/utils/error-handling.test.ts
  - ci_mode: vitest run (non-interactive, exits after completion)

DEPENDENCIES:
  - requires: P1.M1.T1.S4 (Export EnvironmentError) to be Complete
  - blocked_by: Nothing (previous subtask is complete)
  - blocks: P1.M2 (isFatalError implementation) - this validation must pass first
```

## Validation Loop

### Level 1: Syntax & Style (Pre-Test Verification)

```bash
# Verify EnvironmentError implementation exists
grep -n "class EnvironmentError" src/utils/errors.ts
# Expected: Line 482: export class EnvironmentError extends PipelineError

# Verify EnvironmentError export exists
grep -n "EnvironmentError" src/core/index.ts
# Expected: Line 28: export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';

# Check TypeScript compilation
npm run build
# Expected: Clean build with no errors
# If errors exist: READ output and fix before proceeding

# Verify test file exists
ls -la tests/integration/utils/error-handling.test.ts
# Expected: File exists and is readable

# Quick syntax check of test file
npx tsc --noEmit tests/integration/utils/error-handling.test.ts
# Expected: No TypeScript errors in test file
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run EnvironmentError unit tests (should already pass from P1.M1.T1)
npm run test:run -- tests/unit/utils/errors-environment.test.ts
# Expected: All EnvironmentError unit tests pass
# This validates the implementation before integration testing

# Run all error handling unit tests
npm run test:run -- tests/unit/utils/errors.test.ts
# Expected: All error handling unit tests pass
# This validates no regressions in error handling infrastructure

# Quick smoke test - create EnvironmentError instance
node -e "
import('./dist/utils/errors.js').then(({ EnvironmentError }) => {
  const error = new EnvironmentError('test', { variable: 'TEST' });
  console.log('EnvironmentError created:', error instanceof Error);
  console.log('Name:', error.name);
  console.log('Message:', error.message);
  console.log('Context:', error.variable);
});
"
# Expected Output:
// EnvironmentError created: true
// Name: EnvironmentError
// Message: test
// Context: TEST
```

### Level 3: Integration Testing (Primary Validation)

```bash
# Run the specific integration test suite
npm run test:run -- tests/integration/utils/error-handling.test.ts
# Expected: Test execution with results summary

# Parse test output for key metrics:
# - Total tests run
# - Tests passed
# - Tests failed
# - Test execution time

# Focus on these specific tests:
# ✓ "should create EnvironmentError with correct properties" - MUST PASS
# ✗ "should identify EnvironmentError as fatal" - EXPECTED TO FAIL (isFatalError not implemented)

# Run with verbose output for detailed failure information
npm run test:run -- tests/integration/utils/error-handling.test.ts --reporter=verbose
# Expected: Detailed test output showing each test and its result

# Run with coverage report
npm run test:coverage -- tests/integration/utils/error-handling.test.ts
# Expected: Coverage report for error handling code
# Check: EnvironmentError class has 100% coverage

# Save test output for documentation
npm run test:run -- tests/integration/utils/error-handling.test.ts 2>&1 | tee research/test-results.log
# Expected: Test output saved to research/test-results.log
```

### Level 4: Regression Testing (System Validation)

```bash
# Run all integration tests to ensure no regressions
npm run test:run -- tests/integration/
# Expected: All integration tests pass (except expected failures)

# Run all error handling tests (unit + integration)
npm run test:run -- tests/unit/utils/ tests/integration/utils/
# Expected: All error handling tests pass (except isFatalError tests)

# Quick smoke test of entire test suite
npm run test:run 2>&1 | head -50
# Expected: Test suite starts executing, no early failures

# Verify test pass rate is acceptable
npm run test:run 2>&1 | grep -E "(Test Files|Tests|Pass|Fail)"
# Expected: Pass rate >93% (current baseline from PRD)
# Check: No new test failures introduced

# Check for promise rejection warnings (P4.M2 issue)
npm run test:run -- tests/integration/utils/error-handling.test.ts 2>&1 | grep -i "promise"
# Expected: No PromiseRejectionHandledWarning messages
# Note: If present, this is a known issue (P4.M2.T1) not related to this task
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 validation passed: EnvironmentError implementation exists
- [ ] Level 1 validation passed: EnvironmentError is exported
- [ ] Level 1 validation passed: TypeScript compilation succeeds
- [ ] Level 2 validation passed: EnvironmentError unit tests pass
- [ ] Level 3 validation passed: Integration test "should create EnvironmentError with correct properties" passes
- [ ] Level 3 validation passed: Test execution output captured
- [ ] Level 4 validation passed: No regressions in other error handling tests
- [ ] Level 4 validation passed: Overall test pass rate maintained

### Feature Validation

- [ ] EnvironmentError is constructible from integration tests
- [ ] EnvironmentError instanceof PipelineError returns true
- [ ] EnvironmentError instanceof Error returns true
- [ ] EnvironmentError.name equals 'EnvironmentError'
- [ ] EnvironmentError.message is correctly set
- [ ] EnvironmentError context properties are preserved
- [ ] Integration test "should create EnvironmentError with correct properties" passes
- [ ] Integration test "should identify EnvironmentError as fatal" fails as expected (isFatalError not implemented)

### Code Quality Validation

- [ ] No changes made to source code (test execution only)
- [ ] Test output documented in research/ subdirectory
- [ ] Before/after comparison recorded
- [ ] Expected failures documented with reasons
- [ ] No unexpected test failures

### Documentation & Deployment

- [ ] Test results saved to research/test-results.log
- [ ] Pass/fail counts recorded
- [ ] Expected failures explained (isFatalError not yet implemented)
- [ ] Readiness for P1.M2 (isFatalError implementation) confirmed
- [ ] No blocking issues identified

---

## Anti-Patterns to Avoid

- **Don't** modify the integration test file - this is validation only
- **Don't** implement isFatalError() to make tests pass - that's P1.M2's scope
- **Don't** skip tests that are failing - document expected failures
- **Don't** run tests in watch mode for validation - use CI mode (test:run)
- **Don't** ignore test output - capture and analyze full results
- **Don't** proceed without documenting test results
- **Don't** assume tests pass without running them
- **Don't** modify source code to make tests pass (unless implementation is actually broken)

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Rationale**:
- This is a straightforward test execution task
- The implementation is complete (P1.M1.T1.S4)
- Exact test command and file path provided
- Expected outcomes clearly documented
- No code changes required (validation only)
- All context is provided with no gaps

**Validation**: A developer unfamiliar with the codebase can execute this task successfully using only this PRP because:
1. The exact test command is specified
2. Expected test outcomes are documented
3. The test file content is provided as reference
4. Expected failures are explained (isFatalError not yet implemented)
5. Project-specific test commands are provided
6. Validation levels are clearly defined
7. No ambiguity about what constitutes success

**Next Steps After Success**:
1. Mark P1.M1.T2.S1 as Complete in tasks.json
2. Proceed to P1.M2 (Add isFatalError Function)
3. P1.M2.T1.S1: Examine existing #isFatalError implementation in PRPPipeline
