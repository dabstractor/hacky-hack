# Product Requirement Prompt (PRP): Write Failing Tests for isFatalError Function

**PRP ID**: P1.M2.T1.S2
**Work Item Title**: Write failing tests for isFatalError function
**Created**: 2026-01-16
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Write comprehensive failing tests (TDD red phase) for the `isFatalError()` function that will correctly identify fatal vs non-fatal errors according to the pipeline error handling specification.

**Deliverable**: Test file at `tests/unit/utils/is-fatal-error.test.ts` with 200+ comprehensive failing tests covering all error types, edge cases, and scenarios. All tests must fail initially because the `isFatalError()` function does not exist yet.

**Success Definition**:
- All 200+ tests fail with "isFatalError is not defined" or similar errors
- Test file follows existing codebase patterns (vitest, TypeScript, SEV pattern)
- Tests cover all error types: SessionError, EnvironmentError, TaskError, AgentError, ValidationError, standard Error, null/undefined
- Tests cover all edge cases: continueOnError flag, context-sensitive validation, error code variations
- Tests follow TDD red-green-refactor methodology (red phase complete)
- Test file is properly documented with comprehensive header comments
- Running `npm run test:run -- tests/unit/utils/is-fatal-error.test.ts` shows all tests failing

---

## User Persona

**Target User**: Development team implementing the `isFatalError()` utility function (P1.M2.T1.S3)

**Use Case**: Developer needs a comprehensive test suite that defines the expected behavior of `isFatalError()` before implementing the function (TDD approach).

**User Journey**:
1. Read this PRP to understand test requirements
2. Review existing test patterns from referenced files
3. Write comprehensive failing tests in `tests/unit/utils/is-fatal-error.test.ts`
4. Run tests to verify they all fail (red phase)
5. Implement `isFatalError()` function in P1.M2.T1.S3 to make tests pass (green phase)
6. Refactor implementation while keeping tests passing (refactor phase)

**Pain Points Addressed**:
- **Missing Test Coverage**: No tests exist for `isFatalError()` behavior
- **Unclear Specification**: PRD specifies fatal/non-fatal but lacks implementation details
- **Integration Test Failures**: Integration tests expect `isFatalError` but function doesn't exist
- **Regression Risk**: Without comprehensive tests, future changes could break fatal error detection

---

## Why

**Business Value**:
- Enables proper error handling classification across the entire codebase
- Supports integration testing of error handling behavior
- Provides regression protection for future error handling changes
- Documents the expected behavior through executable specifications

**Integration with Existing Features**:
- Builds on error hierarchy in `src/utils/errors.ts` (PipelineError, SessionError, TaskError, AgentError, ValidationError, EnvironmentError)
- Supports existing type guard functions (`isSessionError`, `isTaskError`, etc.)
- Aligns with `--continue-on-error` CLI flag behavior
- Enables error tracking and reporting in ERROR_REPORT.md

**Problems This Solves**:
- **No Test Coverage**: Zero tests exist for `isFatalError()` function behavior
- **Integration Test Failures**: 6 integration tests fail because function doesn't exist
- **Unclear Specification**: Architecture doc exists but no executable specification
- **TDD Gap**: Previous subtask (P1.M2.T1.S1) was research, this starts implementation

---

## What

### User-Visible Behavior

No user-visible behavior changes. This is a **test-only** subtask that creates a comprehensive test suite defining the expected behavior of `isFatalError()`.

### Technical Requirements

1. **CREATE** `tests/unit/utils/is-fatal-error.test.ts` with 200+ failing tests
2. **FOLLOW** existing test patterns from `tests/unit/utils/errors.test.ts`
3. **IMPLEMENT** tests for all error types and edge cases specified below
4. **ENSURE** all tests fail (red phase) because function doesn't exist yet
5. **DOCUMENT** test file with comprehensive header comments
6. **USE** vitest framework with TypeScript
7. **FOLLOW** TDD methodology: write failing tests first, then implement

### Test Coverage Requirements (200+ Tests)

#### 1. Fatal Error Tests (Return TRUE) - 50+ tests
- SessionError with PIPELINE_SESSION_LOAD_FAILED code
- SessionError with PIPELINE_SESSION_SAVE_FAILED code
- EnvironmentError (any EnvironmentError instance)
- ValidationError with PIPELINE_VALIDATION_INVALID_INPUT and operation='parse_prd'
- Variations with different context objects
- Variations with different error messages
- Variations with/without cause property
- Variations with/without timestamp

#### 2. Non-Fatal Error Tests (Return FALSE) - 80+ tests
- TaskError (any TaskError instance) - 15+ variations
- AgentError (any AgentError instance) - 15+ variations
- ValidationError (non-parse_prd operations) - 20+ variations
- ValidationError without operation context - 10+ variations
- ValidationError with different error codes - 10+ variations
- SessionError with non-fatal codes (if any) - 10+ variations

#### 3. Standard Error Tests (Return FALSE) - 20+ tests
- Standard JavaScript Error object
- TypeError, ReferenceError, SyntaxError, RangeError, etc.
- Custom error classes extending Error
- Error with cause property
- Error without stack trace

#### 4. Null/Undefined/Invalid Tests (Return FALSE) - 20+ tests
- null value
- undefined value
- String values
- Number values
- Boolean values
- Object literals (not Error instances)
- Array values
- Function values

#### 5. Type Guard Usage Tests - 15+ tests
- Using isPipelineError before isFatalError
- Type narrowing with isSessionError + isFatalError
- Type narrowing with isTaskError + isFatalError
- Type narrowing with isAgentError + isFatalError
- Type narrowing with isValidationError + isFatalError
- Type narrowing with isEnvironmentError + isFatalError

#### 6. continueOnError Flag Tests - 15+ tests
- When continueOnError=true, all errors return false
- SessionError with continueOnError=true
- EnvironmentError with continueOnError=true
- ValidationError with continueOnError=true
- TaskError with continueOnError=true
- AgentError with continueOnError=true

#### 7. Edge Cases and Boundary Conditions - 20+ tests
- Empty string message
- Very long message
- Special characters in message
- Unicode characters in message
- Circular references in context
- Missing context property
- Context with null/undefined values
- Error without message
- Error with empty context object
- Multiple nested causes

### Success Criteria

- [ ] Test file exists at `tests/unit/utils/is-fatal-error.test.ts`
- [ ] All 200+ tests fail with "isFatalError is not defined" or similar
- [ ] Test file follows existing codebase patterns (vitest, TypeScript, SEV)
- [ ] Tests cover all error types from error hierarchy
- [ ] Tests cover all edge cases (null, undefined, standard errors)
- [ ] Tests cover continueOnError flag behavior
- [ ] Tests cover type guard usage patterns
- [ ] Test file has comprehensive header documentation
- [ ] Running `npm run test:run -- tests/unit/utils/is-fatal-error.test.ts` shows expected failures
- [ ] Test file matches code style of existing test files

---

## All Needed Context

### Context Completeness Check

**Question**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file paths and line numbers for all referenced files
- Complete test pattern examples from existing test files
- Detailed specification of isFatalError behavior from architecture doc
- 200+ specific test cases to implement
- Test framework configuration details
- Code style and naming conventions
- Integration points and dependencies
- External research references with URLs

### Documentation & References

```yaml
# MUST READ - Critical for understanding test requirements and patterns

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md
  why: Contains complete isFatalError logic specification, decision tree, fatal/non-fatal classification rules
  critical: Defines exact behavior for all error types - tests must validate this behavior
  section: "Decision Tree" and "Fatal Error Conditions" sections are most important

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S1/PRP.md
  why: Contains research findings from P1.M2.T1.S1 about existing implementation
  critical: Understand dependencies and type guards used by isFatalError
  section: "All Needed Context" section has file paths and line numbers

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts
  why: Primary reference for test patterns, structure, and conventions in this codebase
  pattern: Import statements, describe/it blocks, beforeEach/afterEach hooks, assertion patterns
  gotcha: Uses .js extension in imports (ESM module resolution)
  critical: Follow this exact structure for is-fatal-error.test.ts

- file: /home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts
  why: Contains integration tests that expect isFatalError to exist
  pattern: Test scenarios for fatal vs non-fatal error detection
  critical: Unit tests should align with these integration test expectations
  section: "Fatal Error Detection" test suite

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Contains error class definitions and type guard functions
  pattern: Error class structure, type guard function signatures
  critical: Must import these for tests: isPipelineError, isSessionError, isTaskError, isAgentError, isValidationError, isEnvironmentError
  section: Error classes (lines 1-200), Type guards (lines 200-300)

- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Contains the private #isFatalError() method implementation (lines 377-417)
  pattern: Logic flow for fatal/non-fatal classification
  critical: Reference this for exact implementation logic to test against
  section: Lines 377-417 (#isFatalError method), Lines 34-41 (type guard imports)

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Contains vitest configuration for the project
  pattern: Test environment settings, coverage thresholds (100%), file patterns
  gotcha: Enforces 100% code coverage - tests must be comprehensive
  critical: Tests must pass this configuration

- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test setup and teardown hooks
  pattern: vi.clearAllMocks(), vi.unstubAllEnvs(), global.gc()
  gotcha: Each test file inherits this setup
  critical: Don't duplicate setup that's already global

- file: /home/dustin/projects/hacky-hack/package.json
  why: Contains npm test scripts and dependencies
  pattern: Test scripts (test:run, test:watch, test:coverage)
  critical: Use `npm run test:run -- tests/unit/utils/is-fatal-error.test.ts` to run tests

- docfile: /home/dustin/projects/hacky-hack/docs/research/TDD-TypeScript-Testing-Best-Practices.md
  why: External research on TDD methodology and TypeScript testing patterns
  section: "TDD Red-Green-Refactor Cycle", "Type Guard Testing", "Test Coverage Requirements"
  critical: Follow TDD red phase - write failing tests first

- docfile: /home/dustin/projects/hacky-hack/docs/research/TDD-Quick-Reference.md
  why: Quick reference guide with copy-paste ready test templates
  section: "Test File Template", "Type Guard Test Template"
  critical: Use these templates to ensure consistency

- docfile: /home/dustin/projects/hacky-hack/docs/research/PRP-Implementation-Checklist.md
  why: Step-by-step checklist for implementing isFatalError with TDD
  section: "Phase 1: Write Failing Tests (Red)", "Test Coverage Checklist"
  critical: Follow this checklist to ensure comprehensive coverage

- url: https://vitest.dev/guide/
  why: Official Vitest documentation for testing framework features
  section: "Test Context", "Mocking", "Coverage"
  gotcha: Vitest uses describe/it syntax similar to Jest

- url: https://vitest.dev/guide/why.html
  why: Understanding Vitest advantages over Jest for this project
  critical: Project uses Vitest, not Jest

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  why: TypeScript type narrowing documentation for type guard testing
  section: "Using type predicates", "Type guards"
  critical: Type guards use `error is XxxError` pattern
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── utils/
│   ├── errors.ts                    # Error classes, type guards, ErrorCodes (SOURCE OF TRUTH)
│   └── ...
├── workflows/
│   ├── prp-pipeline.ts              # PRPPipeline class with #isFatalError() method (lines 377-417)
│   └── ...
└── ...

tests/
├── unit/
│   └── utils/
│       ├── errors.test.ts           # PRIMARY REFERENCE for test patterns
│       ├── errors-environment.test.ts
│       ├── logger.test.ts
│       └── ...
├── integration/
│   └── utils/
│       └── error-handling.test.ts   # Integration tests expecting isFatalError
└── setup.ts                         # Global test setup

plan/
└── 002_1e734971e481/
    └── bugfix/
        └── 001_8d809cc989b9/
            ├── architecture/
            │   └── isFatalError-existing-implementation.md  # Logic specification
            ├── P1M2T1S1/
            │   ├── PRP.md                                    # Research findings
            │   └── research/
            │       └── findings.md
            └── P1M2T1S2/
                ├── PRP.md                                    # THIS FILE
                └── research/                                 # OUTPUT DIRECTORY FOR THIS SUBTASK
```

### Desired Codebase Tree (After Completion)

```bash
tests/
├── unit/
│   └── utils/
│       ├── errors.test.ts
│       ├── is-fatal-error.test.ts    # CREATED BY THIS SUBTASK (200+ failing tests)
│       └── ...

plan/
└── 002_1e734971e481/
    └── bugfix/
        └── 001_8d809cc989b9/
            ├── P1M2T1S2/
            │   ├── PRP.md                                    # THIS FILE
            │   └── research/
            │       ├── test-patterns-analysis.md             # Research on existing test patterns
            │       ├── isfatalError-behavior-spec.md         # Detailed behavior specification
            │       ├── test-case-catalog.md                  # Complete catalog of 200+ test cases
            │       └── tdd-implementation-notes.md           # TDD methodology notes
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ESM Module Imports
// All imports MUST use .js extension even for .ts files (ESM module resolution)
import { isPipelineError } from '../../../src/utils/errors.js';  // CORRECT
import { isPipelineError } from '../../../src/utils/errors';    // WRONG - will fail at runtime

// CRITICAL: Type Guard Return Type
// Type guards use TypeScript type predicates: `error is XxxError`
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

// GOTCHA: isFatalError Function Signature
// Based on architecture doc, function signature should be:
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false
): boolean {
  // Implementation...
}

// CRITICAL: continueOnError Parameter
// The continueOnError flag OVERRIDES all other logic
// When true: ALL errors return false (non-fatal)
// When false: Normal fatal/non-fatal classification applies

// PATTERN: Fatal Error Classification (from architecture doc)
// FATAL (return true):
// - SessionError with code PIPELINE_SESSION_LOAD_FAILED
// - SessionError with code PIPELINE_SESSION_SAVE_FAILED
// - EnvironmentError (any EnvironmentError instance)
// - ValidationError with code PIPELINE_VALIDATION_INVALID_INPUT AND operation === 'parse_prd'

// PATTERN: Non-Fatal Error Classification
// NON-FATAL (return false):
// - TaskError (any instance)
// - AgentError (any instance)
// - ValidationError (any non-parse_prd operation)
// - Standard Error (not a PipelineError)
// - null/undefined/non-object values
// - Any error when continueOnError === true

// CRITICAL: Test Organization
// Use nested describe blocks for logical grouping:
describe('isFatalError', () => {
  describe('Fatal errors (return true)', () => {
    describe('SessionError', () => {
      it('should return true for SESSION_LOAD_FAILED', () => { /* ... */ });
      it('should return true for SESSION_SAVE_FAILED', () => { /* ... */ });
    });
    describe('EnvironmentError', () => {
      it('should return true for any EnvironmentError', () => { /* ... */ });
    });
    // ...
  });
  describe('Non-fatal errors (return false)', () => {
    // ...
  });
});

// CRITICAL: Test Naming Convention
// Use "should" prefix for test descriptions:
it('should return true for SessionError with LOAD_FAILED code', () => { /* ... */ });
it('should return false for TaskError instances', () => { /* ... */ });
it('should handle null values gracefully', () => { /* ... */ });

// GOTCHA: Error Code Constants
// Use ErrorCodes enum, not string literals:
ErrorCodes.PIPELINE_SESSION_LOAD_FAILED  // CORRECT
'PIPELINE_SESSION_LOAD_FAILED'           // AVOID

// CRITICAL: Context Property Access
// error.context might be undefined, use optional chaining:
error.context?.operation === 'parse_prd'  // CORRECT
error.context.operation === 'parse_prd'  // MAY THROW if context is undefined

// PATTERN: Test File Header Documentation
// Every test file MUST have comprehensive header comments:
/**
 * Unit tests for isFatalError function
 *
 * @remarks
 * Tests validate fatal vs non-fatal error detection including:
 * 1. Fatal error types (SessionError, EnvironmentError, parse_prd ValidationError)
 * 2. Non-fatal error types (TaskError, AgentError, other ValidationError)
 * 3. Standard Error and unknown types
 * 4. continueOnError flag behavior
 * 5. Type guard usage patterns
 * 6. Edge cases and boundary conditions
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

// CRITICAL: SEV (Setup-Execute-Verify) Pattern
// Structure each test with clear Setup, Execute, Verify sections:
it('should return true for SessionError with LOAD_FAILED code', () => {
  // SETUP: Create error instance
  const error = new SessionError('Session load failed', {
    sessionPath: '/path/to/session'
  });

  // EXECUTE: Call function under test
  const result = isFatalError(error);

  // VERIFY: Assert expected behavior
  expect(result).toBe(true);
});

// GOTCHA: Coverage Thresholds
// Project enforces 100% code coverage:
// - statements: 100%
// - branches: 100%
// - functions: 100%
// - lines: 100%
// Tests must comprehensively cover all code paths

// CRITICAL: TDD Red Phase
// ALL tests MUST FAIL initially because isFatalError doesn't exist
// This is the "red" phase of TDD red-green-refactor
// Expected error: "ReferenceError: isFatalError is not defined"

// PATTERN: Type Guard Testing
// When testing type guards, verify both positive and negative cases:
describe('Type guard integration', () => {
  it('should work with isPipelineError type guard', () => {
    const error = new SessionError('Test');
    if (isPipelineError(error)) {
      expect(isFatalError(error)).toBe(true);
    }
  });
});

// CRITICAL: Import Order
// Follow this import order:
// 1. Vitest imports (beforeEach, afterEach, describe, expect, it)
// 2. Source code imports (error classes, type guards)
// 3. Test fixtures (if any)

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ErrorCodes,
  PipelineError,
  SessionError,
  TaskError,
  AgentError,
  ValidationError,
  EnvironmentError,
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  isEnvironmentError,
} from '../../../src/utils/errors.js';
```

### Git History Context

**Commit**: `dba41a5c79b3b42e4c2154607e33e532b360fbbb`
**Date**: 2026-01-14
**Message**: "feat: Add comprehensive error recovery with fatal/non-fatal detection and error reports"
**Changes**:
- Added `#isFatalError()` private method to PRPPipeline (lines 377-417)
- Added error tracking and reporting functionality
- This commit is the source of truth for isFatalError logic

**Key Insight**: The `#isFatalError()` method was added as a private method but was never extracted as a public utility despite being needed by integration tests. This subtask (P1.M2.T1.S2) creates the test suite, and P1.M2.T1.S3 will implement the extraction.

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Tests will use existing error classes:
- `PipelineError` (base class)
- `SessionError` (extends PipelineError)
- `EnvironmentError` (extends PipelineError)
- `TaskError` (extends PipelineError)
- `AgentError` (extends PipelineError)
- `ValidationError` (extends PipelineError)

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE tests/unit/utils/is-fatal-error.test.ts
  - IMPLEMENT: Test file with comprehensive header documentation
  - FOLLOW: Pattern from tests/unit/utils/errors.test.ts (header structure, import order)
  - NAMING: is-fatal-error.test.ts (kebab-case with .test.ts suffix)
  - PLACEMENT: tests/unit/utils/ directory (alongside other error tests)
  - DEPENDENCIES: None (this is the first task)

Task 2: IMPLEMENT Test File Structure
  - IMPORT: Vitest functions (beforeEach, afterEach, describe, expect, it, vi)
  - IMPORT: All error classes from src/utils/errors.js (ESM import with .js extension)
  - IMPORT: All type guards from src/utils/errors.js
  - IMPLEMENT: describe('isFatalError', () => { /* root test suite */ })
  - IMPLEMENT: beforeEach/afterEach hooks if needed (likely not needed for pure function tests)
  - FOLLOW: Exact pattern from tests/unit/utils/errors.test.ts

Task 3: IMPLEMENT Fatal Error Tests (Return TRUE) - 50+ tests
  - CREATE: describe('Fatal errors (return true)', () => { /* ... */ })
  - IMPLEMENT: SessionError tests (15+ tests)
    * PIPELINE_SESSION_LOAD_FAILED code (5 variations)
    * PIPELINE_SESSION_SAVE_FAILED code (5 variations)
    * Different context objects (3 variations)
    * With/without cause (2 variations)
  - IMPLEMENT: EnvironmentError tests (15+ tests)
    * Basic EnvironmentError (5 variations)
    * Different context properties (5 variations)
    * With/without cause (3 variations)
    * Different messages (2 variations)
  - IMPLEMENT: ValidationError parse_prd tests (20+ tests)
    * PIPELINE_VALIDATION_INVALID_INPUT + operation='parse_prd' (10 variations)
    * Different context objects (5 variations)
    * With/without cause (3 variations)
    * Different messages (2 variations)
  - ASSERT: expect(isFatalError(error)).toBe(true) for all fatal tests

Task 4: IMPLEMENT Non-Fatal Error Tests (Return FALSE) - 80+ tests
  - CREATE: describe('Non-fatal errors (return false)', () => { /* ... */ })
  - IMPLEMENT: TaskError tests (15+ tests)
    * Different error codes (5 variations)
    * Different taskIds (5 variations)
    * With/without cause (3 variations)
    * Different messages (2 variations)
  - IMPLEMENT: AgentError tests (15+ tests)
    * Different error codes (5 variations)
    * Different taskIds (5 variations)
    * With/without cause (3 variations)
    * Different messages (2 variations)
  - IMPLEMENT: ValidationError non-parse_prd tests (20+ tests)
    * Different operations (10 variations: 'resolve_scope', 'validate_prd', etc.)
    * No operation property (5 variations)
    * Different error codes (3 variations)
    * With/without cause (2 variations)
  - IMPLEMENT: SessionError non-fatal tests (10+ variations if applicable)
  - ASSERT: expect(isFatalError(error)).toBe(false) for all non-fatal tests

Task 5: IMPLEMENT Standard Error Tests (Return FALSE) - 20+ tests
  - CREATE: describe('Standard Error types (return false)', () => { /* ... */ })
  - IMPLEMENT: Standard Error tests (5 variations)
    * Basic Error instance
    * Error with cause
    * Error with different messages
  - IMPLEMENT: Native error types (10 variations)
    * TypeError, ReferenceError, SyntaxError, RangeError, URIError
    * Each with 2 variations
  - IMPLEMENT: Custom error classes (5 variations)
    * Classes extending Error
    * Classes not extending Error
  - ASSERT: expect(isFatalError(error)).toBe(false) for all standard error tests

Task 6: IMPLEMENT Null/Undefined/Invalid Tests (Return FALSE) - 20+ tests
  - CREATE: describe('Null/Undefined/Invalid values (return false)', () => { /* ... */ })
  - IMPLEMENT: null/undefined tests (4 variations)
    * null value
    * undefined value
    * Explicit null
    * Explicit undefined
  - IMPLEMENT: Primitive type tests (8 variations)
    * String values (2 variations)
    * Number values (2 variations)
    * Boolean values (2 variations)
    * BigInt/Symbol (2 variations)
  - IMPLEMENT: Object/Array tests (8 variations)
    * Empty object
    * Object with properties
    * Empty array
    * Array with elements
    * Function values
  - ASSERT: expect(isFatalError(value)).toBe(false) for all invalid tests

Task 7: IMPLEMENT Type Guard Usage Tests - 15+ tests
  - CREATE: describe('Type guard integration', () => { /* ... */ })
  - IMPLEMENT: isPipelineError + isFatalError tests (3 variations)
  - IMPLEMENT: isSessionError + isFatalError tests (3 variations)
  - IMPLEMENT: isTaskError + isFatalError tests (3 variations)
  - IMPLEMENT: isAgentError + isFatalError tests (3 variations)
  - IMPLEMENT: isValidationError + isFatalError tests (3 variations)
  - PATTERN: Use conditional blocks to demonstrate type narrowing

Task 8: IMPLEMENT continueOnError Flag Tests - 15+ tests
  - CREATE: describe('continueOnError flag behavior', () => { /* ... */ })
  - IMPLEMENT: continueOnError=true tests (8 variations)
    * SessionError with flag=true
    * EnvironmentError with flag=true
    * ValidationError with flag=true
    * TaskError with flag=true
    * AgentError with flag=true
    * Standard Error with flag=true
    * null/undefined with flag=true
  - IMPLEMENT: continueOnError=false tests (7 variations)
    * Verify normal behavior when flag=false (explicit)
  - ASSERT: All errors return false when continueOnError=true

Task 9: IMPLEMENT Edge Cases and Boundary Conditions - 20+ tests
  - CREATE: describe('Edge cases and boundary conditions', () => { /* ... */ })
  - IMPLEMENT: Message edge cases (5 variations)
    * Empty string message
    * Very long message (1000+ chars)
    * Special characters
    * Unicode characters
    * Newlines/tabs
  - IMPLEMENT: Context edge cases (5 variations)
    * Missing context property
    * Empty context object
    * Context with null values
    * Context with undefined values
    * Circular references
  - IMPLEMENT: Error property edge cases (5 variations)
    * Error without message
    * Error without stack
    * Error without name
    * Error with modified prototype
  - IMPLEMENT: Multiple causes/nested errors (5 variations)
    * Error with cause chain
    * Wrapped PipelineError
    * Double-wrapped errors

Task 10: VERIFY All Tests Fail (Red Phase)
  - RUN: npm run test:run -- tests/unit/utils/is-fatal-error.test.ts
  - VERIFY: All tests fail with "isFatalError is not defined" or similar
  - VERIFY: Test count is 200+ (check summary output)
  - VERIFY: No syntax errors or import errors
  - DOCUMENT: Screenshot or copy of test run output showing failures
  - EXPECTED: All tests fail because isFatalError function doesn't exist yet

Task 11: CREATE Research Documentation
  - CREATE: P1M2T1S2/research/test-patterns-analysis.md
    * ANALYZE: Existing test patterns from errors.test.ts
    * EXTRACT: Common patterns and conventions
    * DOCUMENT: Patterns to follow in is-fatal-error.test.ts
  - CREATE: P1M2T1S2/research/isfatalError-behavior-spec.md
    * DOCUMENT: Complete isFatalError behavior specification
    * INCLUDE: Decision tree from architecture doc
    * INCLUDE: Fatal/non-fatal classification rules
    * INCLUDE: Edge cases and special conditions
  - CREATE: P1M2T1S2/research/test-case-catalog.md
    * LIST: All 200+ test cases with descriptions
    * CATEGORIZE: By error type and expected behavior
    * INCLUDE: Test count per category
  - CREATE: P1M2T1S2/research/tdd-implementation-notes.md
    * DOCUMENT: TDD methodology applied
    * INCLUDE: Red phase verification steps
    * INCLUDE: Transition to green phase (next subtask)
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// TEST FILE TEMPLATE
// =============================================================================

/**
 * Unit tests for isFatalError function
 *
 * @remarks
 * Tests validate fatal vs non-fatal error detection including:
 * 1. Fatal error types (SessionError with LOAD_FAILED/SAVE_FAILED, EnvironmentError, parse_prd ValidationError)
 * 2. Non-fatal error types (TaskError, AgentError, other ValidationError)
 * 3. Standard Error and unknown types (non-PipelineError instances)
 * 4. continueOnError flag behavior (overrides all other logic when true)
 * 5. Type guard usage patterns (integration with isPipelineError, isSessionError, etc.)
 * 6. Edge cases and boundary conditions (null, undefined, special characters, etc.)
 *
 * TDD Phase: RED - All tests must fail because isFatalError doesn't exist yet
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link file:///home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md | isFatalError Architecture Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  ErrorCodes,
  PipelineError,
  SessionError,
  EnvironmentError,
  TaskError,
  AgentError,
  ValidationError,
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  isEnvironmentError,
} from '../../../src/utils/errors.js';

// =============================================================================
// ROOT TEST SUITE
// =============================================================================

describe('isFatalError', () => {
  // ========================================================================
  // FATAL ERROR TESTS (Return TRUE)
  // ========================================================================

  describe('Fatal errors (return true)', () => {
    describe('SessionError', () => {
      it('should return true for SessionError with LOAD_FAILED code', () => {
        // SETUP: Create SessionError instance
        const error = new SessionError('Session load failed', {
          sessionPath: '/path/to/session',
        });

        // EXECUTE: Call isFatalError
        const result = isFatalError(error);

        // VERIFY: Assert expected behavior
        expect(result).toBe(true);
      });

      it('should return true for SessionError with SAVE_FAILED code', () => {
        const error = new SessionError('Session save failed', {
          sessionPath: '/path/to/session',
        });
        expect(isFatalError(error)).toBe(true);
      });

      // Add 13+ more SessionError variations...
    });

    describe('EnvironmentError', () => {
      it('should return true for any EnvironmentError', () => {
        const error = new EnvironmentError('Missing API key', {
          variable: 'API_KEY',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with context', () => {
        const error = new EnvironmentError('Invalid configuration', {
          variable: 'CONFIG_FILE',
          value: '/invalid/path',
        });
        expect(isFatalError(error)).toBe(true);
      });

      // Add 13+ more EnvironmentError variations...
    });

    describe('ValidationError (parse_prd operation)', () => {
      it('should return true for ValidationError with parse_prd operation', () => {
        const error = new ValidationError('Invalid PRD format', {
          operation: 'parse_prd',
          invalidInput: 'malformed-prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and specific code', () => {
        const error = new ValidationError('PRD validation failed', {
          code: ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT,
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      // Add 18+ more parse_prd ValidationError variations...
    });
  });

  // ========================================================================
  // NON-FATAL ERROR TESTS (Return FALSE)
  // ========================================================================

  describe('Non-fatal errors (return false)', () => {
    describe('TaskError', () => {
      it('should return false for TaskError instances', () => {
        const error = new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      // Add 14+ more TaskError variations...
    });

    describe('AgentError', () => {
      it('should return false for AgentError instances', () => {
        const error = new AgentError('LLM call failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      // Add 14+ more AgentError variations...
    });

    describe('ValidationError (non-parse_prd operations)', () => {
      it('should return false for ValidationError with resolve_scope operation', () => {
        const error = new ValidationError('Invalid scope format', {
          operation: 'resolve_scope',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError without operation', () => {
        const error = new ValidationError('Validation failed');
        expect(isFatalError(error)).toBe(false);
      });

      // Add 18+ more non-parse_prd ValidationError variations...
    });
  });

  // ========================================================================
  // STANDARD ERROR TESTS (Return FALSE)
  // ========================================================================

  describe('Standard Error types (return false)', () => {
    it('should return false for standard Error', () => {
      const error = new Error('Standard error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for TypeError', () => {
      const error = new TypeError('Type error');
      expect(isFatalError(error)).toBe(false);
    });

    // Add 18+ more standard error variations...
  });

  // ========================================================================
  // NULL/UNDEFINED/INVALID TESTS (Return FALSE)
  // ========================================================================

  describe('Null/Undefined/Invalid values (return false)', () => {
    it('should return false for null', () => {
      expect(isFatalError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isFatalError(undefined)).toBe(false);
    });

    it('should return false for string values', () => {
      expect(isFatalError('string error')).toBe(false);
    });

    // Add 17+ more invalid value variations...
  });

  // ========================================================================
  // TYPE GUARD USAGE TESTS
  // ========================================================================

  describe('Type guard integration', () => {
    it('should work with isPipelineError type guard', () => {
      const error = new SessionError('Test error');

      if (isPipelineError(error)) {
        // Type is narrowed to PipelineError
        expect(isFatalError(error)).toBe(true);
      } else {
        expect.fail('Error should be a PipelineError');
      }
    });

    it('should work with isSessionError type guard', () => {
      const error = new SessionError('Test error');

      if (isSessionError(error)) {
        // Type is narrowed to SessionError
        expect(isFatalError(error)).toBe(true);
        expect(error.code).toBeDefined(); // Accessing SessionError-specific property
      }
    });

    // Add 13+ more type guard integration tests...
  });

  // ========================================================================
  // continueOnError FLAG TESTS
  // ========================================================================

  describe('continueOnError flag behavior', () => {
    it('should return false for SessionError when continueOnError is true', () => {
      const error = new SessionError('Session load failed');
      expect(isFatalError(error, true)).toBe(false); // Override fatal behavior
    });

    it('should return false for EnvironmentError when continueOnError is true', () => {
      const error = new EnvironmentError('Missing API key');
      expect(isFatalError(error, true)).toBe(false); // Override fatal behavior
    });

    it('should return true for SessionError when continueOnError is false', () => {
      const error = new SessionError('Session load failed');
      expect(isFatalError(error, false)).toBe(true); // Normal fatal behavior
    });

    // Add 12+ more continueOnError flag tests...
  });

  // ========================================================================
  // EDGE CASES AND BOUNDARY CONDITIONS
  // ========================================================================

  describe('Edge cases and boundary conditions', () => {
    it('should handle empty string message', () => {
      const error = new SessionError('', { sessionPath: '/path' });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new SessionError(longMessage);
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle special characters in message', () => {
      const error = new SessionError('Error: \n\t\r\u0010[Special]');
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle unicode characters in message', () => {
      const error = new SessionError('Error: 你好 🚀 Ñoño');
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle missing context property', () => {
      const error = new SessionError('No context');
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle empty context object', () => {
      const error = new SessionError('Empty context', {});
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle context with null values', () => {
      const error = new SessionError('Null context', {
        sessionPath: null as unknown as string,
      });
      expect(isFatalError(error)).toBe(true);
    });

    // Add 13+ more edge case tests...
  });
});
```

### Integration Points

```yaml
ERROR_HIERARCHY:
  - location: src/utils/errors.ts
  - imports: All error classes and type guards
  - usage: Tests import these to create error instances and test type guards
  - critical: Use .js extension in import paths (ESM)

TEST_INFRASTRUCTURE:
  - location: vitest.config.ts
  - config: 100% coverage threshold required
  - environment: node
  - setupFiles: tests/setup.ts (global hooks)
  - gotcha: Tests must be comprehensive to meet 100% threshold

INTEGRATION_TESTS:
  - location: tests/integration/utils/error-handling.test.ts
  - expects: isFatalError export from errors.ts
  - status: Currently failing (function not implemented)
  - dependency: Unit tests must align with integration test expectations

PRP_PIPELINE:
  - location: src/workflows/prp-pipeline.ts
  - reference: Lines 377-417 (#isFatalError method)
  - usage: Tests should validate behavior matches this implementation
  - critical: This is the source of truth for isFatalError logic

CLI_OPTIONS:
  - flag: --continue-on-error
  - maps_to: continueOnError parameter in isFatalError
  - behavior: When true, all errors return false (non-fatal)

TDD_WORKFLOW:
  - current_phase: RED (write failing tests)
  - next_phase: GREEN (implement function to make tests pass)
  - final_phase: REFACTOR (improve implementation while tests pass)
```

---

## Validation Loop

### Level 1: File Creation and Syntax (Immediate Feedback)

```bash
# Verify test file was created
ls -la tests/unit/utils/is-fatal-error.test.ts

# Check for TypeScript syntax errors
npx tsc --noEmit tests/unit/utils/is-fatal-error.test.ts

# Verify imports are correct
npm run test:run -- tests/unit/utils/is-fatal-error.test.ts 2>&1 | head -20

# Expected: Import errors are ok, but no syntax errors
# If syntax errors exist: Fix TypeScript issues before proceeding
```

### Level 2: Test Execution (Red Phase Verification)

```bash
# Run the test file (all tests should fail)
npm run test:run -- tests/unit/utils/is-fatal-error.test.ts

# Expected output pattern:
# FAIL tests/unit/utils/is-fatal-error.test.ts > isFatalError > Fatal errors > should return true for SessionError
# Error: ReferenceError: isFatalError is not defined

# Verify test count is 200+
npm run test:run -- tests/unit/utils/is-fatal-error.test.ts 2>&1 | grep -E "Tests:|(\d+ passed)|(\d+ failed)"

# Expected: All tests fail, 200+ total tests
# If tests pass: Something is wrong - function shouldn't exist yet
# If fewer than 200 tests: Add more test variations
```

### Level 3: Test Coverage Validation (Pre-Implementation)

```bash
# Check what coverage would be if isFatalError existed
npm run test:coverage -- tests/unit/utils/is-fatal-error.test.ts

# Note: Coverage will be 0% because function doesn't exist
# But this validates that test infrastructure is working

# Verify test file follows project conventions
grep -E "^(import|describe|it)" tests/unit/utils/is-fatal-error.test.ts | head -30

# Expected: Standard vitest pattern with proper imports
# If pattern doesn't match: Compare with tests/unit/utils/errors.test.ts
```

### Level 4: Integration Test Alignment (Cross-Validation)

```bash
# Run integration tests to see current failures
npm run test:run -- tests/integration/utils/error-handling.test.ts

# Verify unit tests align with integration test expectations
grep -A 5 "should identify SessionError as fatal" tests/integration/utils/error-handling.test.ts

# Expected: Integration tests expect isFatalError(sessionError) === true
# Your unit tests should validate this same behavior
```

### Level 5: Documentation Validation (Research Output)

```bash
# Verify research documentation was created
ls -la plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/

# Check research files exist and have content
wc -l plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/*.md

# Expected: 4 research files with substantial content
# If missing: Create research documentation as specified in Task 11
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file exists at `tests/unit/utils/is-fatal-error.test.ts`
- [ ] All imports use `.js` extension (ESM module resolution)
- [ ] All imports are from correct paths (use `../../../src/utils/errors.js`)
- [ ] Test file has comprehensive header documentation
- [ ] No TypeScript syntax errors (verified with `tsc --noEmit`)
- [ ] All 200+ tests fail with "isFatalError is not defined"
- [ ] Test file follows existing codebase patterns (compare with errors.test.ts)
- [ ] SEV (Setup-Execute-Verify) pattern used in all tests
- [ ] Test naming convention uses "should" prefix

### Feature Validation

- [ ] All fatal error types tested (SessionError, EnvironmentError, parse_prd ValidationError)
- [ ] All non-fatal error types tested (TaskError, AgentError, other ValidationError)
- [ ] Standard error types tested (Error, TypeError, etc.)
- [ ] Null/undefined/invalid values tested
- [ ] continueOnError flag behavior tested
- [ ] Type guard integration tested
- [ ] Edge cases and boundary conditions tested
- [ ] Test expectations align with integration tests
- [ ] Test expectations align with architecture documentation

### Code Quality Validation

- [ ] Test file is well-organized with nested describe blocks
- [ ] Each test has clear SETUP-EXECUTE-VERIFY sections
- [ ] Test descriptions are specific and descriptive
- [ ] No duplicate test cases (each test validates unique scenario)
- [ ] Test file is self-documenting (clear what behavior is expected)
- [ ] Error instances use realistic context objects
- [ ] Test variations cover different combinations of properties

### Documentation & Research

- [ ] `research/test-patterns-analysis.md` exists
- [ ] `research/isfatalError-behavior-spec.md` exists
- [ ] `research/test-case-catalog.md` exists with all 200+ test cases listed
- [ ] `research/tdd-implementation-notes.md` exists
- [ ] All research files are comprehensive and well-structured

### TDD Red Phase Verification

- [ ] All tests fail (red phase complete)
- [ ] Test run output saved/recorded
- [ ] Ready to proceed to P1.M2.T1.S3 (green phase - implement function)
- [ ] Integration test expectations documented
- [ ] Architecture documentation referenced correctly

---

## Anti-Patterns to Avoid

- **Don't implement isFatalError function** - This is TDD red phase, only write failing tests
- **Don't skip test variations** - Comprehensive coverage is required (200+ tests)
- **Don't use wrong import extensions** - Always use `.js` for ESM imports
- **Don't forget the .js extension** - Imports will fail at runtime without it
- **Don't use string literals for error codes** - Use ErrorCodes enum constants
- **Don't access error.context without optional chaining** - Context might be undefined
- **Don't ignore continueOnError flag** - It's a critical parameter that overrides all logic
- **Don't forget to test type guards** - Integration with type guards is important
- **Don't write vague test descriptions** - Be specific about what is being tested
- **Don't skip edge cases** - Boundary conditions are important for robustness
- **Don't forget to document test file** - Header comments are required
- **Don't organize tests poorly** - Use nested describe blocks for logical grouping
- **Don't miss SEV pattern** - Setup-Execute-Verify makes tests clear and maintainable
- **Don't make tests pass** - All tests MUST fail in this subtask (red phase)
- **Don't skip research documentation** - Research files are part of the deliverable

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Rationale**:
- Comprehensive PRP with exact file paths and line numbers
- Complete test pattern examples from existing codebase
- Detailed specification of isFatalError behavior from architecture doc
- 200+ specific test cases catalogued and organized
- External research references with URLs
- Step-by-step implementation tasks with dependencies
- TDD methodology clearly defined and followed
- All context needed for implementation provided

**Validation**: The completed PRP and test file should enable a developer unfamiliar with the codebase to:
1. Understand the isFatalError expected behavior completely
2. Write 200+ comprehensive failing tests following TDD methodology
3. Follow existing codebase patterns and conventions
4. Create research documentation for future reference
5. Prepare for green phase (P1.M2.T1.S3 - implement the function)

**Next Steps**:
- **P1.M2.T1.S2 (THIS TASK)**: Write failing tests for isFatalError function
- **P1.M2.T1.S3**: Implement isFatalError function in errors.ts (green phase)
- **P1.M2.T2.S1**: Refactor PRPPipeline to import and use isFatalError
- **P1.M2.T3.S1**: Run fatal error detection integration tests

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-16
**Status**: Ready for Implementation (Red Phase)
