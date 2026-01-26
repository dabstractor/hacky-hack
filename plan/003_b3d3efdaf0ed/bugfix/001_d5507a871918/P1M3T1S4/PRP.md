---
name: "P1.M3.T1.S4: Verify and Document Bugfix Session Validation Unit Tests"
description: |

---

## Goal

**Feature Goal**: Verify that comprehensive unit tests exist for bugfix session validation and ensure they provide complete coverage of valid paths, invalid paths, error messages, and edge cases.

**Deliverable**: Verified and documented test suite for `validateBugfixSession` function and `BugfixSessionValidationError` class at `tests/unit/utils/validation/session-validation.test.ts`.

**Success Definition**:
- All existing tests for `validateBugfixSession` pass successfully
- Test coverage includes valid paths, invalid paths, error messages, instanceof checks, and edge cases
- Tests follow established codebase patterns (Vitest, describe/it structure, assertions)
- Tests verify integration with FixCycleWorkflow constructor from P1.M3.T1.S3

## Why

- **Test Coverage Verification**: Work item P1.M3.T1.S4 requires unit tests for bugfix session validation. Research shows comprehensive tests already exist from P1.M3.T1.S1.
- **Quality Assurance**: Verify tests actually pass and catch regressions in validation logic
- **Documentation**: Document existing test coverage for future maintenance
- **Integration Validation**: Ensure tests work with the FixCycleWorkflow constructor changes from P1.M3.T1.S3
- **Contract Compliance**: Satisfy the work item requirement for "test coverage for valid bugfix paths, invalid paths, and edge cases"

## What

### Context Discovery

**IMPORTANT**: Research reveals that comprehensive unit tests already exist at `tests/unit/utils/validation/session-validation.test.ts`. These tests were created in P1.M3.T1.S1 as part of the `validateBugfixSession` function implementation.

**Test Coverage Analysis**:
- ✅ 45+ test cases covering all scenarios
- ✅ Valid bugfix session paths (6 tests)
- ✅ Invalid session paths (8 tests)
- ✅ Error message validation (3 tests)
- ✅ instanceof and prototype chain (5 tests)
- ✅ Edge cases (10 tests)
- ✅ Cross-platform path tests (7 tests)
- ✅ Integration scenarios (6 tests)

### User-Visible Behavior

No user-visible behavior change. This is test verification and documentation work.

### Technical Requirements

**Verification Tasks**:
1. Run existing test suite to confirm all tests pass
2. Review test coverage against work item requirements
3. Document any gaps in coverage
4. Ensure tests work with FixCycleWorkflow integration from P1.M3.T1.S3

**Test Execution**:
- Run: `npm test -- tests/unit/utils/validation/session-validation.test.ts`
- Expected: All tests pass
- If failures: Debug and fix implementation or tests

**Documentation**:
- Create summary of test coverage
- Note any edge cases not covered
- Document test patterns for future reference

### Success Criteria

- [ ] All 45+ existing tests pass successfully
- [ ] Test coverage includes all scenarios from work item context
- [ ] Tests verify valid bugfix paths pass validation
- [ ] Tests verify invalid paths throw BugfixSessionValidationError
- [ ] Tests verify error messages are descriptive
- [ ] Tests verify instanceof checks work correctly
- [ ] Tests work with FixCycleWorkflow constructor from P1.M3.T1.S3

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: If someone knew nothing about this codebase, would they have everything needed to verify the tests successfully?

✅ This PRP provides:
- Exact test file location and structure
- Complete test pattern reference from existing tests
- Specific test commands to run
- Expected test coverage requirements
- Reference to implementation being tested
- Integration context from previous subtask (P1.M3.T1.S3)

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: tests/unit/utils/validation/session-validation.test.ts
  why: Existing comprehensive test suite that needs verification
  pattern: Vitest describe/it structure, validation testing patterns, error testing
  gotcha: Tests already exist - this is verification, not creation

- file: src/utils/validation/session-validation.ts
  why: Implementation being tested - validateBugfixSession function
  pattern: Simple substring validation, throws BugfixSessionValidationError
  section: Lines 73-86 contain the complete validateBugfixSession implementation
  gotcha: Function returns void on success, throws on failure

- file: src/utils/errors.ts
  why: Contains BugfixSessionValidationError class being tested
  pattern: PipelineError base class, error code constants, type guards
  section: Lines 494-502 for BugfixSessionValidationError class definition
  gotcha: Error includes context object, toJSON() method, timestamp

- file: src/workflows/fix-cycle-workflow.ts
  why: Integration point - FixCycleWorkflow constructor uses validateBugfixSession (from P1.M3.T1.S3)
  pattern: Constructor validation pattern with try-catch error handling
  section: Lines 120-140 (modified in P1.M3.T1.S3) show validation call
  gotcha: Constructor must validate session path before any bug fix work

- file: tests/unit/utils/errors.test.ts
  why: Reference for error class testing patterns
  pattern: Instanceof tests, prototype chain tests, error property tests
  section: Lines 676-744 for BugfixSessionValidationError test patterns
  gotcha: Tests name, code, message, context, instanceof chain

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S4/research/test-existing-coverage.md
  why: Research summary documenting existing test coverage
  section: Complete coverage analysis showing 45+ test cases

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S4/research/test-patterns.md
  why: Reference patterns for validation testing in this codebase
  section: Common patterns, import patterns, assertion patterns

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S3/PRP.md
  why: Previous subtask that integrated validation into FixCycleWorkflow
  section: Constructor validation integration pattern
  gotcha: Tests should verify constructor throws on invalid session path
```

### Current Codebase tree

```bash
tests/
├── unit/
│   └── utils/
│       └── validation/
│           └── session-validation.test.ts  # EXISTING - Target for verification (432 lines, 45+ tests)
└── integration/
    └── fix-cycle-workflow-integration.test.ts  # May need updates for constructor validation

src/
├── utils/
│   ├── validation/
│   │   └── session-validation.ts  # Implementation - validateBugfixSession()
│   └── errors.ts  # Error class - BugfixSessionValidationError
└── workflows/
    └── fix-cycle-workflow.ts  # Integration point - uses validateBugfixSession in constructor
```

### Desired Codebase tree with files to be added

```bash
# No new test files needed - comprehensive tests already exist
# Changes to existing files:
tests/unit/utils/validation/session-validation.test.ts  # VERIFY: Run tests, document coverage
tests/integration/fix-cycle-workflow-integration.test.ts  # MAY UPDATE: Add constructor validation tests
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Tests already exist - do NOT create duplicate test file
// File tests/unit/utils/validation/session-validation.test.ts already has 45+ tests

// CRITICAL: Use .js extension in imports (ES modules)
// import { validateBugfixSession } from '../../../../src/utils/validation/session-validation.js';

// CRITICAL: Vitest framework, not Jest or Mocha
// import { describe, expect, it } from 'vitest';

// CRITICAL: Error type checking uses instanceof, not error.code
// expect(error instanceof BugfixSessionValidationError).toBe(true);

// CRITICAL: expect.fail() for test logic errors
// expect.fail('Should have thrown BugfixSessionValidationError');

// CRITICAL: Test paths use ../../../../ for src/utils/ from tests/unit/utils/validation/
// Adjust depth based on test file location

// GOTCHA: validateBugfixSession returns undefined on success (no return statement)
// Test with expect(() => validateBugfixSession(path)).not.toThrow();

// GOTCHA: Error message includes session path for debugging
// expect((error as Error).message).toContain(sessionPath);

// GOTCHA: BugfixSessionValidationError has code property
// expect((error as BugfixSessionValidationError).code).toBe('PIPELINE_SESSION_INVALID_BUGFIX_PATH');

// GOTCHA: Prototype chain is BugfixSessionValidationError -> PipelineError -> Error
// All three instanceof checks should pass

// GOTCHA: FixCycleWorkflow constructor validation (from P1.M3.T1.S3)
// Constructor should throw BugfixSessionValidationError for invalid paths
// Integration tests should verify this behavior

// GOTCHA: Case-sensitive substring check - 'bugfix' only, not 'Bugfix' or 'BUGFIX'
// Tests verify this case sensitivity
```

## Implementation Blueprint

### Data models and structure

No new data models - existing structures:

```typescript
// Implementation being tested
function validateBugfixSession(sessionPath: string): void;

// Error class being tested
class BugfixSessionValidationError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH;
  constructor(message: string, context?: PipelineErrorContext, cause?: Error);
  name: string;
  timestamp: Date;
  context?: PipelineErrorContext;
  toJSON(): object;
}

// Type guard being tested
function isBugfixSessionValidationError(error: unknown): error is BugfixSessionValidationError;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY existing test file exists and is comprehensive
  - CHECK: tests/unit/utils/validation/session-validation.test.ts exists
  - VERIFY: File contains 45+ test cases
  - VERIFY: Tests cover valid paths, invalid paths, error messages, instanceof, edge cases
  - DOCUMENT: Summary of test coverage in research notes

Task 2: RUN existing test suite to verify all tests pass
  - COMMAND: npm test -- tests/unit/utils/validation/session-validation.test.ts
  - EXPECTED: All tests pass (green checkmarks)
  - IF FAILING: Debug failure, fix implementation or test
  - LOG: Test results output

Task 3: VERIFY test coverage against work item requirements
  - REQUIREMENT: "should pass validation for valid bugfix session path"
    CHECK: Tests verify paths like '/plan/001_session/bugfix/' pass
  - REQUIREMENT: "should throw error for non-bugfix session path"
    CHECK: Tests verify paths like '/plan/001_session/main/' throw
  - REQUIREMENT: "should throw error with descriptive message"
    CHECK: Tests verify error message content
  - REQUIREMENT: "should handle paths with bugfix in different positions"
    CHECK: Tests verify various bugfix path patterns
  - REQUIREMENT: "Use test.each() for multiple path variants"
    CHECK: Tests use test.each() or equivalent pattern

Task 4: VERIFY integration with FixCycleWorkflow constructor
  - CHECK: FixCycleWorkflow calls validateBugfixSession in constructor (from P1.M3.T1.S3)
  - VERIFY: Constructor tests exist or create integration test
  - TEST: Valid bugfix path - constructor should not throw
  - TEST: Invalid path - constructor should throw BugfixSessionValidationError
  - PATTERN: Follow constructor validation test pattern from errors.test.ts

Task 5: DOCUMENT test coverage summary
  - CREATE: Summary document listing all test scenarios
  - HIGHLIGHT: Edge cases covered (case sensitivity, whitespace, unicode, paths)
  - NOTE: Any gaps in coverage (if found)
  - REFERENCE: Existing research/test-existing-coverage.md

Task 6: RUN full test suite to ensure no regressions
  - COMMAND: npm test
  - EXPECTED: All tests pass, including new FixCycleWorkflow validation
  - VERIFY: No test failures in related test files
  - CONFIRM: Integration tests pass
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Test File Structure (Task 1)
// ============================================================================
// File: tests/unit/utils/validation/session-validation.test.ts
// Structure: Nested describe() blocks for organization

describe('session-validation', () => {
  describe('validateBugfixSession with valid paths', () => {
    it('should accept path with bugfix substring in middle', () => {
      const validPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });
  });

  describe('validateBugfixSession with invalid paths', () => {
    it('should reject path without bugfix substring', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });
  });
});

// ============================================================================
// PATTERN 2: Error Message Validation (Task 3)
// ============================================================================

it('should include session path in error message', () => {
  const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
  try {
    validateBugfixSession(invalidPath);
    expect.fail('Should have thrown BugfixSessionValidationError');
  } catch (error) {
    expect(error).toBeInstanceOf(BugfixSessionValidationError);
    expect((error as Error).message).toContain(invalidPath);
  }
});

// ============================================================================
// PATTERN 3: Instanceof Validation (Task 3)
// ============================================================================

it('should be instanceof BugfixSessionValidationError', () => {
  const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
  try {
    validateBugfixSession(invalidPath);
    expect.fail('Should have thrown BugfixSessionValidationError');
  } catch (error) {
    expect(error).toBeInstanceOf(BugfixSessionValidationError);
    expect(error).toBeInstanceOf(PipelineError);
    expect(error).toBeInstanceOf(Error);
  }
});

// ============================================================================
// PATTERN 4: Constructor Integration Test (Task 4)
// ============================================================================

it('should support early validation pattern in constructor', () => {
  class TestWorkflow {
    constructor(sessionPath: string) {
      validateBugfixSession(sessionPath);
    }
  }

  // Valid path should not throw
  expect(() => new TestWorkflow('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918'))
    .not.toThrow();

  // Invalid path should throw
  expect(() => new TestWorkflow('plan/003_b3d3efdaf0ed/feature/001_xyz'))
    .toThrow(BugfixSessionValidationError);
});

// ============================================================================
// PATTERN 5: test.each() for Multiple Variants (Task 3)
// ============================================================================

it.each([
  ['plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918', true],
  ['bugfix/001_test', true],
  ['plan/003_b3d3efdaf0ed/feature/001_xyz', false],
  ['plan/003_b3d3efdaf0ed', false],
])('should validate path %s', (sessionPath, shouldPass) => {
  if (shouldPass) {
    expect(() => validateBugfixSession(sessionPath)).not.toThrow();
  } else {
    expect(() => validateBugfixSession(sessionPath)).toThrow(
      BugfixSessionValidationError
    );
  }
});

// ============================================================================
// GOTCHA: Import Path Must Use .js Extension
// ============================================================================

import { validateBugfixSession, BugfixSessionValidationError }
  from '../../../../src/utils/validation/session-validation.js';
  // Note the .js extension even though source file is .ts

// ============================================================================
// GOTCHA: Use expect.fail() for Test Logic Errors
// ============================================================================

try {
  validateBugfixSession(invalidPath);
  expect.fail('Should have thrown BugfixSessionValidationError');
  // If we reach here, test should fail
} catch (error) {
  // Expected path - error was thrown
  expect(error).toBeInstanceOf(BugfixSessionValidationError);
}
```

### Integration Points

```yaml
FIXCYCLEWORKFLOW CONSTRUCTOR:
  - location: src/workflows/fix-cycle-workflow.ts (lines 120-140)
  - modified: P1.M3.T1.S3 added validateBugfixSession() call
  - integration: Constructor should throw BugfixSessionValidationError for invalid paths
  - test: Verify constructor behavior with valid/invalid session paths

ERROR CLASS HIERARCHY:
  - base: PipelineError (src/utils/errors.ts)
  - extends: BugfixSessionValidationError extends PipelineError
  - prototype chain: BugfixSessionValidationError -> PipelineError -> Error
  - test: Verify instanceof checks work at all levels

PRP PIPELINE:
  - entry: src/workflows/prp-pipeline.ts
  - usage: Instantiates FixCycleWorkflow with sessionPath
  - guard: FixCycleWorkflow constructor validates session path
  - integration: PRP Pipeline must handle BugfixSessionValidationError

TEST FRAMEWORK:
  - runner: Vitest
  - config: vitest.config.ts
  - command: npm test -- [test file pattern]
  - coverage: Tests should cover all validation scenarios
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after any test modifications - fix before proceeding
npm test -- tests/unit/utils/validation/session-validation.test.ts
# Expected: All tests pass with green checkmarks

# Check for TypeScript errors in test file
npx tsc --noEmit tests/unit/utils/validation/session-validation.test.ts
# Expected: Zero type errors

# Check linting
npm run lint tests/unit/utils/validation/
# Expected: Zero linting errors

# Format check
npm run format:check tests/unit/utils/validation/
# Expected: Zero formatting issues

# Project-wide validation
npm run validate  # or equivalent project command
# Expected: All validations pass
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run specific test file (Task 2)
npm test -- tests/unit/utils/validation/session-validation.test.ts
# Expected output:
# ✓ tests/unit/utils/validation/session-validation.test.ts (45+ tests)
#   ✓ validateBugfixSession with valid paths (7 tests)
#   ✓ validateBugfixSession with invalid paths (8 tests)
#   ✓ Error message format (3 tests)
#   ✓ BugfixSessionValidationError class (5 tests)
#   ✓ Edge cases (10 tests)
#   ✓ Cross-platform path validation (7 tests)
#   ✓ Integration scenarios (6 tests)
#
# Test Files  1 passed (1)
# Tests  45+ passed (45+)

# Run with coverage (if available)
npm test -- --coverage tests/unit/utils/validation/
# Expected: High coverage percentage for validateBugfixSession and BugfixSessionValidationError

# Run related error tests
npm test -- tests/unit/utils/errors.test.ts
# Expected: All BugfixSessionValidationError tests pass

# Run FixCycleWorkflow tests (integration)
npm test -- tests/integration/fix-cycle-workflow-integration.test.ts
# Expected: Constructor validation tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test FixCycleWorkflow constructor validation (Task 4)
# Manual verification: Test constructor with valid path
node -e "
import { FixCycleWorkflow } from './src/workflows/fix-cycle-workflow.js';
const workflow = new FixCycleWorkflow(
  'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918',
  'PRD content',
  null,
  null
);
console.log('Constructor succeeded with valid bugfix path');
"
# Expected: Constructor succeeds, no error thrown

# Manual verification: Test constructor with invalid path
node -e "
import { FixCycleWorkflow } from './src/workflows/fix-cycle-workflow.js';
try {
  new FixCycleWorkflow(
    'plan/003_b3d3efdaf0ed/feature/001_abc123',
    'PRD content',
    null,
    null
  );
  console.error('ERROR: Constructor should have thrown BugfixSessionValidationError');
} catch (error) {
  if (error.code === 'PIPELINE_SESSION_INVALID_BUGFIX_PATH') {
    console.log('PASS: BugfixSessionValidationError thrown correctly');
  } else {
    console.error('ERROR: Wrong error type thrown:', error);
  }
}
"
# Expected: BugfixSessionValidationError thrown with correct error code

# Test with actual bugfix session from codebase
cd plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918
# Run any workflow task that uses FixCycleWorkflow
# Expected: Success, no validation errors

# Test integration with PRP Pipeline
# Run a PRP Pipeline task in a bugfix session
# Expected: FixCycleWorkflow constructor validates session path successfully
```

### Level 4: Manual Verification & Domain-Specific Validation

```bash
# Verification 1: Check test file exists (Task 1)
ls -la tests/unit/utils/validation/session-validation.test.ts
# Expected: File exists, 432+ lines

# Verification 2: Check test coverage (Task 3)
grep -c "it('" tests/unit/utils/validation/session-validation.test.ts
# Expected: 45+ test cases

# Verification 3: Check for valid path tests
grep "should accept.*bugfix" tests/unit/utils/validation/session-validation.test.ts
# Expected: Multiple tests for valid bugfix paths

# Verification 4: Check for invalid path tests
grep "should reject.*bugfix\|should throw.*bugfix" tests/unit/utils/validation/session-validation.test.ts
# Expected: Multiple tests for invalid paths

# Verification 5: Check for error message tests
grep "error message\|message.*contain" tests/unit/utils/validation/session-validation.test.ts
# Expected: Tests validating error message content

# Verification 6: Check for instanceof tests
grep "instanceof.*BugfixSessionValidationError" tests/unit/utils/validation/session-validation.test.ts
# Expected: Tests verifying instanceof checks

# Verification 7: Check for test.each() usage (Task 3)
grep "test.each\|it.each" tests/unit/utils/validation/session-validation.test.ts
# Expected: Usage of test.each() for multiple variants

# Verification 8: Check FixCycleWorkflow integration (Task 4)
grep "validateBugfixSession" src/workflows/fix-cycle-workflow.ts
# Expected: Constructor calls validateBugfixSession

# Domain-specific: Test actual bugfix session path
node -e "
import { validateBugfixSession } from './src/utils/validation/session-validation.js';
const actualPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
validateBugfixSession(actualPath);
console.log('PASS: Actual bugfix session path validated');
"
# Expected: No error thrown

# Domain-specific: Test actual feature session path
node -e "
import { validateBugfixSession } from './src/utils/validation/session-validation.js';
const featurePath = 'plan/003_b3d3efdaf0ed/feature/001_test';
try {
  validateBugfixSession(featurePath);
  console.error('FAIL: Should have thrown error for feature path');
} catch (error) {
  console.log('PASS: Feature path rejected correctly');
}
"
# Expected: BugfixSessionValidationError thrown
```

## Final Validation Checklist

### Technical Validation

- [ ] Test file exists: `tests/unit/utils/validation/session-validation.test.ts`
- [ ] Test file contains 45+ test cases
- [ ] All tests pass: `npm test -- tests/unit/utils/validation/session-validation.test.ts`
- [ ] No TypeScript errors: `npx tsc --noEmit tests/unit/utils/validation/`
- [ ] No linting errors: `npm run lint tests/unit/utils/validation/`
- [ ] No formatting issues: `npm run format:check tests/unit/utils/validation/`
- [ ] Related error tests pass: `npm test -- tests/unit/utils/errors.test.ts`
- [ ] Integration tests pass: `npm test -- tests/integration/fix-cycle-workflow-integration.test.ts`

### Feature Validation

- [ ] Valid bugfix session paths pass validation (tested)
- [ ] Invalid session paths throw BugfixSessionValidationError (tested)
- [ ] Error messages include session path for debugging (tested)
- [ ] Error messages are descriptive and clear (tested)
- [ ] instanceof checks work correctly (tested)
- [ ] Error code is 'PIPELINE_SESSION_INVALID_BUGFIX_PATH' (tested)
- [ ] Prototype chain is correct (tested)
- [ ] Edge cases covered (case sensitivity, whitespace, unicode) (tested)
- [ ] Cross-platform paths handled correctly (tested)
- [ ] Integration with FixCycleWorkflow constructor works (tested)

### Code Quality Validation

- [ ] Tests follow Vitest patterns (describe/it structure)
- [ ] Test names are descriptive and prescriptive
- [ ] Tests are organized logically with nested describe() blocks
- [ ] Import paths use .js extension (ES modules)
- [ ] Assertions use expect() correctly (toBe, toEqual, toThrow, etc.)
- [ ] Error handling uses expect.fail() for test logic errors
- [ ] Test setup/teardown uses beforeEach/afterEach appropriately
- [ ] Tests use test.each() or equivalent for multiple variants
- [ ] No duplicate test code (DRY principle)

### Documentation & Deployment

- [ ] Test coverage documented in research notes
- [ ] Integration with FixCycleWorkflow documented
- [ ] Any gaps in coverage noted (if found)
- [ ] Test patterns documented for future reference
- [ ] Changes communicated if tests were modified

---

## Anti-Patterns to Avoid

- ❌ Don't create duplicate test file - comprehensive tests already exist
- ❌ Don't use Jest patterns - this codebase uses Vitest
- ❌ Don't use error.code string comparison - use instanceof for type checking
- ❌ Don't skip validation tests - all scenarios must be tested
- ❌ Don't hardcode test values - use descriptive constants or fixtures
- ❌ Don't ignore test failures - debug and fix before proceeding
- ❌ Don't forget .js extension in import paths (ES modules)
- ❌ Don't test implementation details - test behavior and contracts
- ❌ Don't create overly complex test setup - keep tests simple and focused
- ❌ Don't skip edge case testing - validation functions need comprehensive coverage
- ❌ Don't test both success and failure in same test case - separate them
- ❌ Don't use console.log for testing - use expect() assertions
- ❌ Don't forget to test error messages - users need clear error information
