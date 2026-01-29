# PRP: P1.M3.T1.S2 - Add BugfixSessionValidationError class

## Goal

**Feature Goal**: Implement `BugfixSessionValidationError` class in `src/utils/errors.ts` following TypeScript and codebase error handling patterns to provide clear, actionable error messages for bugfix session validation failures.

**Deliverable**: New error class `BugfixSessionValidationError` extending `PipelineError` with proper error code, context support, type guard, and comprehensive unit tests, enabling programmatic distinction of bugfix session validation failures from other errors.

**Success Definition**:

- Error class properly extends `PipelineError` base class with correct prototype chain setup
- Error class implements error code `PIPELINE_SESSION_INVALID_BUGFIX_PATH` in `ErrorCodes` const
- Error class accepts `sessionPath` parameter in context object for debugging
- Error message format: `Bug fix tasks can only be executed within bugfix sessions. Invalid path: {sessionPath}`
- Error class exported alongside `validateBugfixSession` function from `session-validation.ts`
- Type guard `isBugfixSessionValidationError` function created for type narrowing
- Unit tests cover prototype chain, instanceof checks, context handling, toJSON() serialization
- Error class integrates cleanly with existing `validateBugfixSession` function

## User Persona

**Target User**: AI agent implementing bug fix tasks in the PRP Pipeline execution context, developers debugging session validation failures.

**Use Case**: When `validateBugfixSession` function detects an invalid session path (not containing 'bugfix'), it throws `BugfixSessionValidationError` with clear error message including the invalid path. This error can be:

- Caught and logged with structured context
- Distinguished from other error types programmatically via error code or type guard
- Displayed to users with actionable information

**User Journey**:

1. PRP Pipeline instantiates `FixCycleWorkflow` with session path
2. Constructor calls `validateBugfixSession(sessionPath)`
3. If path invalid (no 'bugfix'), function throws `BugfixSessionValidationError`
4. PRP Pipeline catch block uses type guard to identify error type
5. Error logged with `toJSON()` for structured logging including sessionPath context
6. Pipeline halts with clear error message showing invalid path

**Pain Points Addressed**:

- Distinguishes bugfix session validation failures from other validation or session errors
- Provides specific error code for programmatic handling (`PIPELINE_SESSION_INVALID_BUGFIX_PATH`)
- Includes session path in error context for debugging
- Follows existing codebase error patterns for consistency
- Enables type-safe error handling with type guard function

## Why

**Business value**: Provides specific error type for bugfix session validation failures, enabling targeted error handling, monitoring, and debugging. Following established error patterns ensures maintainability and consistency across the codebase.

**Integration with existing features**:

- Replaces placeholder `BugfixSessionValidationError` in `src/utils/validation/session-validation.ts`
- Adds to existing error hierarchy in `src/utils/errors.ts` alongside `SessionError`, `TaskError`, `ValidationError`
- Follows established patterns from codebase error classes
- Integrates with existing type guard pattern (`isSessionError`, `isTaskError`, etc.)

**Problems this solves**:

- Current placeholder error class in `session-validation.ts` is temporary and doesn't follow codebase patterns
- No error code `PIPELINE_SESSION_INVALID_BUGFIX_PATH` exists in `ErrorCodes` const
- No type guard exists for bugfix session validation errors
- No context object support for including session path in error details
- No `toJSON()` method for structured logging

## What

**User-visible behavior**: When `validateBugfixSession` function throws `BugfixSessionValidationError`, the error includes:

- Clear error message with invalid path
- Error code `PIPELINE_SESSION_INVALID_BUGFIX_PATH` for programmatic handling
- Context object with `sessionPath` property for debugging
- Proper stack trace with correct error type name
- JSON serialization support for structured logging

**Technical requirements**:

1. Add error code `PIPELINE_SESSION_INVALID_BUGFIX_PATH` to `ErrorCodes` const in `src/utils/errors.ts`
2. Create `BugfixSessionValidationError` class extending `PipelineError` in `src/utils/errors.ts`
3. Constructor accepts `(message: string, context?: PipelineErrorContext, cause?: Error)`
4. Class sets `readonly code = ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH`
5. Constructor calls `Object.setPrototypeOf(this, BugfixSessionValidationError.prototype)` for prototype chain
6. Class includes `toJSON()` method for structured logging (inherited from `PipelineError`)
7. Export class from `src/utils/errors.ts`
8. Create type guard `isBugfixSessionValidationError(error: unknown)` function
9. Export from `src/utils/validation/session-validation.ts` alongside `validateBugfixSession`
10. Create comprehensive unit tests following existing error test patterns

### Success Criteria

- [ ] Error code `PIPELINE_SESSION_INVALID_BUGFIX_PATH` added to `ErrorCodes` const
- [ ] `BugfixSessionValidationError` class created in `src/utils/errors.ts`
- [ ] Class extends `PipelineError` with correct prototype chain setup
- [ ] Constructor signature: `(message: string, context?: PipelineErrorContext, cause?: Error)`
- [ ] `readonly code` property set to `ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH`
- [ ] `Object.setPrototypeOf()` called in constructor for instanceof checks
- [ ] Class exported from `src/utils/errors.ts`
- [ ] Type guard `isBugfixSessionValidationError` function created
- [ ] Class re-exported from `src/utils/validation/session-validation.ts` for convenience
- [ ] Unit tests cover all scenarios: prototype chain, instanceof, context, toJSON, type guard
- [ ] All tests pass following existing test patterns

## All Needed Context

### Context Completeness Check

✓ **"No Prior Knowledge" test passed**: This PRP provides all necessary context including existing error class patterns from `src/utils/errors.ts`, existing placeholder implementation, test patterns from `tests/unit/utils/errors.test.ts`, TypeScript best practices research, file organization conventions, and specific implementation guidance with code examples.

### Documentation & References

```yaml
# MUST READ - Existing error hierarchy and patterns
- file: src/utils/errors.ts
  why: Complete error class hierarchy showing PipelineError base class, specialized error patterns, error codes, context objects, JSDoc patterns, type guard patterns
  pattern: Extend PipelineError, set error code from ErrorCodes const, use Object.setPrototypeOf for prototype chain, include context parameter, implement toJSON() (inherited)
  gotcha: Must call Object.setPrototypeOf(this, ClassName.prototype) for instanceof checks to work correctly
  critical: Error code format PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME}, use ErrorCodes const for type safety, all errors have readonly code property

- file: src/utils/validation/session-validation.ts
  why: Current placeholder implementation that will be replaced, shows how error is used in validateBugfixSession function
  pattern: Placeholder Error extension with code property and prototype setup
  gotcha: Current implementation is temporary - needs to be replaced with proper PipelineError subclass
  critical: Error message format: `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${sessionPath}`

- file: tests/unit/utils/errors.test.ts
  why: Test patterns for error classes including prototype chain, instanceof checks, context sanitization, toJSON() serialization, type guard tests
  pattern: describe blocks for each error class, test error code values, test instanceof behavior, test context object handling, test toJSON() serialization
  gotcha: Tests verify Error.captureStackTrace behavior and Object.setPrototypeOf setup, test type guard functions

- file: src/core/session-utils.ts
  why: Example of session-related error handling with SessionFileError pattern for file operation errors
  pattern: Import { resolve, join, dirname, basename } from 'node:path', use resolve() for absolute paths
  gotcha: Session directory pattern is {sequence}_{hash} but bugfix sessions add /bugfix/{sequence}_{hash}/ subdirectory

# External Research Documentation
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S2/research/typescript-error-best-practices.md
  why: Best practices for extending Error in TypeScript with proper prototype chain setup, constructor patterns, toJSON() implementation
  section: "Proper Error Extension", "Error Code Patterns", "JSON Serialization", "Type Guard Functions"

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S2/research/error-class-implementation-guide.md
  why: Ready-to-use implementation template with usage examples and comprehensive testing template
  section: "Complete Error Class Template", "Usage Examples", "Testing Template"

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S2/research/error-class-cheat-sheet.md
  why: Quick reference with essential template and critical rules for error class implementation
  section: "Essential Template", "5 Critical Rules", "Type Guard Patterns"

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S2/research/sources-and-references.md
  why: Complete source documentation with URLs to TypeScript documentation, MDN, TC39 proposals, libraries
  section: "Official TypeScript Documentation", "MDN Web Docs", "Testing Resources"
```

### Current Codebase tree

```bash
src/
├── utils/
│   ├── errors.ts                    # PipelineError base class, specialized errors, error codes, type guards
│   │   # Lines 58-88: ErrorCodes const with error code definitions
│   │   # Lines 143-342: PipelineError base class implementation
│   │   # Lines 362-380: SessionError example
│   │   # Lines 444-471: ValidationError example
│   │   # Lines 521-614: Type guard functions (isSessionError, isTaskError, etc.)
│   ├── validation/
│   │   └── session-validation.ts    # validateBugfixSession function with placeholder error class
│   │       # Lines 25-33: TEMPORARY placeholder BugfixSessionValidationError
│   │       # Lines 77-89: validateBugfixSession function using placeholder error
│   ├── errors/                      # Enhanced error reporting utilities
│   │   ├── error-reporter.ts        # Error reporting and timeline tracking
│   │   ├── types.ts                 # Enhanced error types (TaskFailure, TimelineEntry, etc.)
│   │   └── ...                      # Other error utilities
│   └── ...                          # Other utilities
├── workflows/
│   ├── fix-cycle-workflow.ts        # Will integrate validation in P1.M3.T1.S3
│   └── prp-pipeline.ts              # Top-level pipeline orchestrator
└── ...                              # Other source files

tests/
├── unit/
│   └── utils/
│       ├── errors.test.ts           # Error class tests (prototype chain, instanceof, context, toJSON)
│       └── validation/
│           └── session-validation.test.ts  # Tests for validateBugfixSession function
└── ...                              # Other test files
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/
├── utils/
│   ├── errors.ts                    # MODIFY - Add BugfixSessionValidationError class
│   │   # ADD: Error code PIPELINE_SESSION_INVALID_BUGFIX_PATH to ErrorCodes (line ~83)
│   │   # ADD: BugfixSessionValidationError class (after ValidationError, line ~471)
│   │   # ADD: isBugfixSessionValidationError type guard (line ~614)
│   │   # EXPORT: BugfixSessionValidationError class
│   │   # EXPORT: isBugfixSessionValidationError function
│   ├── validation/
│   │   └── session-validation.ts    # MODIFY - Replace placeholder error import
│   │       # REMOVE: Temporary BugfixSessionValidationError class (lines 25-33)
│   │       # IMPORT: BugfixSessionValidationError from '../errors.js'
│   │       # EXPORT: Re-export BugfixSessionValidationError for convenience
│   └── errors/                      # Existing error reporting utilities (no changes)
└── ...                              # Other source files (no changes)

tests/
├── unit/
│   └── utils/
│       ├── errors.test.ts           # MODIFY - Add BugfixSessionValidationError tests
│       │   # ADD: describe block for BugfixSessionValidationError
│       │   # ADD: Tests for error code, instanceof, prototype chain, context, toJSON
│       │   # ADD: Tests for isBugfixSessionValidationError type guard
│       └── validation/
│           └── session-validation.test.ts  # EXISTING - Tests for validateBugfixSession
│               # These tests already validate the error behavior
└── ...                              # Other test files (no changes)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Error class prototype chain setup in TypeScript
// All custom error classes MUST call Object.setPrototypeOf() for instanceof checks
// See src/utils/errors.ts lines 187-189 for pattern
export class CustomError extends PipelineError {
  readonly code = ErrorCodes.SOME_CODE;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    // CRITICAL: Must set prototype for this class explicitly
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// CRITICAL: Error code must be added to ErrorCodes const before using
// See src/utils/errors.ts lines 58-88 for ErrorCodes definition
export const ErrorCodes = {
  // ... existing error codes
  PIPELINE_SESSION_INVALID_BUGFIX_PATH: 'PIPELINE_SESSION_INVALID_BUGFIX_PATH',
} as const;

// CRITICAL: Type guard pattern for type narrowing
// See src/utils/errors.ts lines 521-614 for type guard examples
export function isBugfixSessionValidationError(
  error: unknown
): error is BugfixSessionValidationError {
  return error instanceof BugfixSessionValidationError;
}

// CRITICAL: Context object pattern for debugging
// Context object extends Record<string, unknown> for flexibility
// Common fields: sessionPath, taskId, operation, cause
// See src/utils/errors.ts lines 94-112 for PipelineErrorContext interface
throw new BugfixSessionValidationError(
  'Bug fix tasks can only be executed within bugfix sessions. Invalid path: /path/to/session',
  { sessionPath: '/path/to/session' } // Context with sessionPath for debugging
);

// CRITICAL: toJSON() method for structured logging
// toJSON() is inherited from PipelineError base class
// Returns plain object with all error properties for pino logger
// Automatically sanitizes sensitive data matching REDACT_PATHS from logger.ts

// GOTCHA: Re-export from session-validation.ts for convenience
// The error class is defined in errors.ts but re-exported from session-validation.ts
// This allows imports from either location:
// import { BugfixSessionValidationError } from './errors.js';
// import { BugfixSessionValidationError } from './validation/session-validation.js';

// GOTCHA: Error message format is fixed by validateBugfixSession function
// The error message MUST be: `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${sessionPath}`
// This format is already defined in session-validation.ts line 82-84
// Do NOT change the error message format

// CRITICAL: Import statement must use .js extension for ESM
// Even though source files are .ts, imports use .js extension
// Incorrect: import { BugfixSessionValidationError } from '../errors';
// Correct: import { BugfixSessionValidationError } from '../errors.js';

// CRITICAL: Test patterns for error classes
// See tests/unit/utils/errors.test.ts for comprehensive test patterns
// Tests must verify:
// 1. instanceof checks work correctly
// 2. error.code has correct value
// 3. error.name matches class name
// 4. error.message is set correctly
// 5. context object is stored and accessible
// 6. toJSON() returns proper plain object
// 7. Type guard function works correctly
// 8. Prototype chain is correct (Object.getPrototypeOf)

// CRITICAL: Error code naming convention
// Format: PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME}
// Domain: SESSION (this is a session validation error)
// Action: INVALID (validation failure)
// Outcome: BUGFIX_PATH (specific to bugfix path validation)
// Result: PIPELINE_SESSION_INVALID_BUGFIX_PATH

// GOTCHA: This subtask (P1.M3.T1.S2) creates the proper error class
// Subtask P1.M3.T1.S1 already created the validateBugfixSession function
// Subtask P1.M3.T1.S3 will integrate validation into FixCycleWorkflow constructor
// For this subtask, replace the placeholder error class and add to errors.ts
```

## Implementation Blueprint

### Data models and structure

No new data models required. This implementation uses existing `PipelineErrorContext` interface and extends `PipelineError` base class.

**Key Types**:

- `PipelineError`: Base error class from `src/utils/errors.ts`
- `PipelineErrorContext`: Context interface with optional `sessionPath`, `taskId`, `operation`, `cause` properties
- `ErrorCode`: Union type of all error code values from `ErrorCodes` const

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD error code to ErrorCodes const
  - FILE: src/utils/errors.ts
  - LOCATION: Lines 58-88 (ErrorCodes const definition)
  - ADD: PIPELINE_SESSION_INVALID_BUGFIX_PATH: 'PIPELINE_SESSION_INVALID_BUGFIX_PATH'
  - POSITION: After PIPELINE_SESSION_NOT_FOUND (line 62), before task errors (line 64)
  - FORMAT: Follow existing error code naming pattern
  - VERIFY: No duplicate error codes exist

Task 2: CREATE BugfixSessionValidationError class
  - FILE: src/utils/errors.ts
  - LOCATION: After ValidationError class (line ~471), before EnvironmentError
  - IMPLEMENT: BugfixSessionValidationError extending PipelineError
  - CONSTRUCTOR: (message: string, context?: PipelineErrorContext, cause?: Error)
  - CODE: readonly code = ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH
  - PROTOTYPE: Object.setPrototypeOf(this, BugfixSessionValidationError.prototype)
  - PATTERN: Follow ValidationError class pattern (lines 444-471)
  - JSDOC: Include class description, @example usage

Task 3: CREATE type guard function
  - FILE: src/utils/errors.ts
  - LOCATION: After isEnvironmentError function (line ~614)
  - IMPLEMENT: isBugfixSessionValidationError(error: unknown): error is BugfixSessionValidationError
  - PATTERN: return error instanceof BugfixSessionValidationError;
  - FOLLOW: Existing type guard pattern (isSessionError, isTaskError, etc.)
  - EXPORT: Add to module exports

Task 4: EXPORT new error class and type guard
  - FILE: src/utils/errors.ts
  - ADD: BugfixSessionValidationError to module exports
  - ADD: isBugfixSessionValidationError to module exports
  - PATTERN: Follow existing export structure
  - VERIFY: Export names match class/function names exactly

Task 5: UPDATE session-validation.ts imports
  - FILE: src/utils/validation/session-validation.ts
  - REMOVE: Temporary BugfixSessionValidationError class (lines 25-33)
  - ADD: import { BugfixSessionValidationError } from '../errors.js';
  - RE-EXPORT: export { BugfixSessionValidationError } from '../errors.js';
  - VERIFY: validateBugfixSession function still works correctly

Task 6: CREATE unit tests for BugfixSessionValidationError
  - FILE: tests/unit/utils/errors.test.ts
  - ADD: describe('BugfixSessionValidationError') block
  - TEST: error code value is PIPELINE_SESSION_INVALID_BUGFIX_PATH
  - TEST: instanceof checks work correctly
  - TEST: prototype chain is correct
  - TEST: error.name is 'BugfixSessionValidationError'
  - TEST: error.message is set correctly
  - TEST: context object with sessionPath works
  - TEST: toJSON() returns proper plain object
  - TEST: isBugfixSessionValidationError type guard works
  - PATTERN: Follow existing error test patterns (SessionError, ValidationError tests)
  - COVERAGE: All public properties and methods

Task 7: VERIFY existing session-validation tests still pass
  - FILE: tests/unit/utils/validation/session-validation.test.ts
  - RUN: npm test -- tests/unit/utils/validation/session-validation.test.ts
  - VERIFY: All tests pass with new error class from errors.ts
  - VERIFY: Error behavior unchanged (message, code, instanceof)
```

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// FILE: src/utils/errors.ts
// ============================================================================

// ----------------------------------------------------------------------------
// Task 1: Add error code to ErrorCodes const (line ~63)
// ----------------------------------------------------------------------------
export const ErrorCodes = {
  // Session errors
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  PIPELINE_SESSION_SAVE_FAILED: 'PIPELINE_SESSION_SAVE_FAILED',
  PIPELINE_SESSION_NOT_FOUND: 'PIPELINE_SESSION_NOT_FOUND',

  // NEW CODE - Add this line
  PIPELINE_SESSION_INVALID_BUGFIX_PATH: 'PIPELINE_SESSION_INVALID_BUGFIX_PATH',

  // Task errors
  PIPELINE_TASK_EXECUTION_FAILED: 'PIPELINE_TASK_EXECUTION_FAILED',
  // ... rest of error codes
} as const;

// ----------------------------------------------------------------------------
// Task 2: Create BugfixSessionValidationError class (line ~472, after ValidationError)
// ----------------------------------------------------------------------------

/**
 * Error thrown when bugfix session validation fails
 *
 * @remarks
 * Thrown when attempting to execute bug fix tasks outside of a bugfix session.
 * This prevents state corruption from creating fix tasks in feature implementation
 * sessions or other non-bugfix contexts.
 *
 * @example
 * ```typescript
 * import { BugfixSessionValidationError } from './utils/errors.js';
 *
 * if (!sessionPath.includes('bugfix')) {
 *   throw new BugfixSessionValidationError(
 *     'Bug fix tasks can only be executed within bugfix sessions.',
 *     { sessionPath }
 *   );
 * }
 * ```
 */
export class BugfixSessionValidationError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    // CRITICAL: Must set prototype for this class explicitly
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
  }
}

// ----------------------------------------------------------------------------
// Task 3: Create type guard function (line ~615, after isEnvironmentError)
// ----------------------------------------------------------------------------

/**
 * Type guard for BugfixSessionValidationError
 *
 * @param error - Unknown error to check
 * @returns True if error is BugfixSessionValidationError
 *
 * @example
 * ```typescript
 * try {
 *   validateBugfixSession(sessionPath);
 * } catch (error) {
 *   if (isBugfixSessionValidationError(error)) {
 *     console.error(`Invalid bugfix path: ${error.context?.sessionPath}`);
 *   }
 * }
 * ```
 */
export function isBugfixSessionValidationError(
  error: unknown
): error is BugfixSessionValidationError {
  return error instanceof BugfixSessionValidationError;
}

// ============================================================================
// FILE: src/utils/validation/session-validation.ts
// ============================================================================

// ----------------------------------------------------------------------------
// Task 5: Update imports and remove placeholder (replace lines 23-33)
// ----------------------------------------------------------------------------

// REMOVE: Temporary placeholder class (lines 25-33)
// export class BugfixSessionValidationError extends Error { ... }

// ADD: Import from errors.ts
import { BugfixSessionValidationError } from '../errors.js';

// ADD: Re-export for convenience
export { BugfixSessionValidationError } from '../errors.js';

// validateBugfixSession function remains unchanged (lines 77-89)
export function validateBugfixSession(sessionPath: string): void {
  if (!sessionPath.includes('bugfix')) {
    throw new BugfixSessionValidationError(
      `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${sessionPath}`,
      { sessionPath } // Include sessionPath in context for debugging
    );
  }
}

// ============================================================================
// FILE: tests/unit/utils/errors.test.ts
// ============================================================================

// ----------------------------------------------------------------------------
// Task 6: Add tests for BugfixSessionValidationError
// ----------------------------------------------------------------------------

describe('BugfixSessionValidationError', () => {
  it('should have correct error code', () => {
    const error = new BugfixSessionValidationError('Test message');
    expect(error.code).toBe('PIPELINE_SESSION_INVALID_BUGFIX_PATH');
  });

  it('should be instanceof BugfixSessionValidationError', () => {
    const error = new BugfixSessionValidationError('Test message');
    expect(error).toBeInstanceOf(BugfixSessionValidationError);
    expect(error).toBeInstanceOf(PipelineError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct prototype chain', () => {
    const error = new BugfixSessionValidationError('Test message');
    expect(Object.getPrototypeOf(error)).toBe(
      BugfixSessionValidationError.prototype
    );
  });

  it('should have correct error name', () => {
    const error = new BugfixSessionValidationError('Test message');
    expect(error.name).toBe('BugfixSessionValidationError');
  });

  it('should set error message correctly', () => {
    const message =
      'Bug fix tasks can only be executed within bugfix sessions.';
    const error = new BugfixSessionValidationError(message);
    expect(error.message).toBe(message);
  });

  it('should store and provide context object', () => {
    const context = { sessionPath: '/invalid/path' };
    const error = new BugfixSessionValidationError('Test message', context);
    expect(error.context).toEqual(context);
  });

  it('should serialize to JSON correctly', () => {
    const context = { sessionPath: '/invalid/path' };
    const error = new BugfixSessionValidationError('Test message', context);
    const json = error.toJSON();

    expect(json).toBeInstanceOf(Object);
    expect(json.code).toBe('PIPELINE_SESSION_INVALID_BUGFIX_PATH');
    expect(json.name).toBe('BugfixSessionValidationError');
    expect(json.message).toBe('Test message');
    expect(json.context).toEqual(context);
    expect(json).toHaveProperty('timestamp');
  });

  it('should support error cause chaining', () => {
    const cause = new Error('Underlying error');
    const error = new BugfixSessionValidationError(
      'Test message',
      undefined,
      cause
    );
    expect(error.cause).toBe(cause);
  });

  it('should work with type guard function', () => {
    const error = new BugfixSessionValidationError('Test message');
    const unknownError: unknown = error;

    if (isBugfixSessionValidationError(unknownError)) {
      // Type should be narrowed to BugfixSessionValidationError
      expect(unknownError.code).toBe('PIPELINE_SESSION_INVALID_BUGFIX_PATH');
      expect(unknownError.context).toBeUndefined();
    } else {
      fail('Type guard should recognize BugfixSessionValidationError');
    }
  });

  it('should reject other error types in type guard', () => {
    const otherError = new Error('Some other error');
    expect(isBugfixSessionValidationError(otherError)).toBe(false);
  });

  it('should work with context containing sessionPath', () => {
    const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
    const message = `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${sessionPath}`;

    const error = new BugfixSessionValidationError(message, { sessionPath });

    expect(error.message).toBe(message);
    expect(error.context?.sessionPath).toBe(sessionPath);
  });
});
````

### Integration Points

```yaml
ERROR_CODES:
  - file: src/utils/errors.ts
  - location: Lines 58-88 (ErrorCodes const)
  - add: PIPELINE_SESSION_INVALID_BUGFIX_PATH error code
  - format: Follow PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME} pattern

ERROR_CLASS:
  - file: src/utils/errors.ts
  - location: After ValidationError class (line ~471)
  - add: BugfixSessionValidationError class
  - pattern: Follow ValidationError implementation pattern
  - extends: PipelineError base class
  - properties: readonly code, constructor with message, context, cause
  - methods: toJSON() (inherited from PipelineError)

TYPE_GUARD:
  - file: src/utils/errors.ts
  - location: After isEnvironmentError (line ~614)
  - add: isBugfixSessionValidationError function
  - pattern: Follow existing type guard pattern

SESSION_VALIDATION:
  - file: src/utils/validation/session-validation.ts
  - remove: Temporary BugfixSessionValidationError class (lines 25-33)
  - add: Import from '../errors.js'
  - add: Re-export for convenience
  - verify: validateBugfixSession function works with imported error

TESTS:
  - file: tests/unit/utils/errors.test.ts
  - add: describe block for BugfixSessionValidationError
  - tests: error code, instanceof, prototype, name, message, context, toJSON, cause, type guard
  - pattern: Follow existing error test patterns
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding

# Type checking for modified files
npx tsc --noEmit src/utils/errors.ts
npx tsc --noEmit src/utils/validation/session-validation.ts

# Linting for modified files
npx eslint src/utils/errors.ts
npx eslint src/utils/validation/session-validation.ts

# Project-wide validation
npm run lint                    # Run ESLint on all files
npm run typecheck               # Run TypeScript compiler check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common issues to watch for:
# - Missing error code in ErrorCodes const
# - Incorrect import path (must use .js extension)
# - Missing Object.setPrototypeOf call
# - Type errors with context parameter
# - Incorrect extends clause
# - Missing exports
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new error class
npm test -- tests/unit/utils/errors.test.ts --testNamePattern="BugfixSessionValidationError"

# Test all error classes to ensure no breakage
npm test -- tests/unit/utils/errors.test.ts

# Test session validation to verify error integration
npm test -- tests/unit/utils/validation/session-validation.test.ts

# Run all utils tests
npm test -- tests/unit/utils/

# Full test suite
npm test

# Coverage validation (if coverage tools available)
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Test coverage requirements for BugfixSessionValidationError:
# - Error code is PIPELINE_SESSION_INVALID_BUGFIX_PATH
# - instanceof checks work for BugfixSessionValidationError, PipelineError, Error
# - Prototype chain is correct (Object.getPrototypeOf)
# - error.name is 'BugfixSessionValidationError'
# - error.message is set correctly
# - context object is stored and accessible
# - toJSON() returns proper plain object with all properties
# - Error cause chaining works
# - Type guard function correctly identifies error type
# - Type guard rejects other error types
# - Context with sessionPath works correctly
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test to verify error works in context

# Test 1: Verify error is importable from errors.ts
node -e "
  import { BugfixSessionValidationError } from './src/utils/errors.js';
  const error = new BugfixSessionValidationError('Test', { sessionPath: '/test' });
  console.log('✓ Error imported and created successfully');
  console.log('  code:', error.code);
  console.log('  name:', error.name);
  console.log('  context.sessionPath:', error.context?.sessionPath);
"

# Test 2: Verify error is importable from session-validation.ts
node -e "
  import { BugfixSessionValidationError } from './src/utils/validation/session-validation.js';
  const error = new BugfixSessionValidationError('Test');
  console.log('✓ Error re-exported from session-validation.js');
"

# Test 3: Verify validateBugfixSession throws new error class
node -e "
  import { validateBugfixSession, BugfixSessionValidationError } from './src/utils/validation/session-validation.js';
  try {
    validateBugfixSession('invalid/path');
    console.error('✗ Should have thrown BugfixSessionValidationError');
    process.exit(1);
  } catch (error) {
    if (error instanceof BugfixSessionValidationError) {
      console.log('✓ validateBugfixSession throws correct error type');
      console.log('  code:', error.code);
      console.log('  message:', error.message);
      console.log('  context.sessionPath:', error.context?.sessionPath);
    } else {
      console.error('✗ Wrong error type:', error.constructor.name);
      process.exit(1);
    }
  }
"

# Test 4: Verify type guard function works
node -e "
  import { BugfixSessionValidationError, isBugfixSessionValidationError } from './src/utils/errors.js';
  const error = new BugfixSessionValidationError('Test');
  if (isBugfixSessionValidationError(error)) {
    console.log('✓ Type guard correctly identifies error');
  } else {
    console.error('✗ Type guard failed to identify error');
    process.exit(1);
  }
"

# Test 5: Verify JSON serialization works
node -e "
  import { BugfixSessionValidationError } from './src/utils/errors.js';
  const error = new BugfixSessionValidationError(
    'Test message',
    { sessionPath: '/test/path' }
  );
  const json = error.toJSON();
  console.log('✓ toJSON() works correctly');
  console.log('  Serialized:', JSON.stringify(json, null, 2));
"

# Expected: All integration tests pass.
# The error class should work seamlessly with validateBugfixSession function.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Domain-specific validation for bugfix session errors

# Test error with actual session paths from codebase
npm test -- --testNamePattern="BugfixSessionValidationError with actual paths"

# Verify error message format matches expected pattern
npm test -- --testNamePattern="error message format includes session path"

# Test error in workflow context (simulate FixCycleWorkflow usage)
npm test -- --testNamePattern="BugfixSessionValidationError in workflow context"

# Cross-platform validation (Windows vs Unix path separators)
npm test -- --testNamePattern="BugfixSessionValidationError cross-platform paths"

# Test error logging with pino (structured logging integration)
npm test -- --testNamePattern="BugfixSessionValidationError structured logging"

# Test error handling in async contexts
npm test -- --testNamePattern="BugfixSessionValidationError async handling"

# Expected: All domain-specific validations pass.
# Key validation points:
# - Error works with real session path format from codebase
# - Error message is clear and actionable
# - Error serializes correctly for logging
# - Type guard enables type-safe error handling
# - Error integrates cleanly with existing error handling patterns
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/errors.test.ts`
- [ ] Session validation tests pass: `npm test -- tests/unit/utils/validation/`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Error code added to ErrorCodes const
- [ ] Error class extends PipelineError correctly
- [ ] Prototype chain setup correct with Object.setPrototypeOf
- [ ] Type guard function implemented
- [ ] Error exported from errors.ts
- [ ] Error re-exported from session-validation.ts
- [ ] Placeholder error removed from session-validation.ts

### Feature Validation

- [ ] Error code is `PIPELINE_SESSION_INVALID_BUGFIX_PATH`
- [ ] Error class name is `BugfixSessionValidationError`
- [ ] Constructor signature: `(message: string, context?: PipelineErrorContext, cause?: Error)`
- [ ] `readonly code` property set correctly
- [ ] Error includes sessionPath in context when provided
- [ ] Error message format: `Bug fix tasks can only be executed within bugfix sessions. Invalid path: {sessionPath}`
- [ ] `instanceof` checks work for BugfixSessionValidationError, PipelineError, Error
- [ ] `toJSON()` method works (inherited from PipelineError)
- [ ] Type guard `isBugfixSessionValidationError` works correctly
- [ ] Error integrates cleanly with `validateBugfixSession` function

### Code Quality Validation

- [ ] Follows existing error class patterns from src/utils/errors.ts
- [ ] JSDoc comments follow existing documentation style
- [ ] File placement matches desired codebase tree structure
- [ ] Imports use relative paths with .js extension (ESM module pattern)
- [ ] Error code naming follows convention: PIPELINE*{DOMAIN}*{ACTION}\_{OUTCOME}
- [ ] No code duplication (reuses PipelineError base class functionality)
- [ ] Consistent with other error classes (SessionError, TaskError, ValidationError)
- [ ] Test coverage matches existing error test patterns

### Documentation & Deployment

- [ ] Class-level JSDoc includes description and @example
- [ ] Constructor parameters documented in JSDoc
- [ ] Type guard function has JSDoc with @param and @returns
- [ ] Error code is self-documenting (PIPELINE_SESSION_INVALID_BUGFIX_PATH)
- [ ] Code example in JSDoc shows actual usage pattern
- [ ] Error message is clear and actionable for debugging
- [ ] Context object includes sessionPath for troubleshooting
- [ ] No breaking changes to existing API (validateBugfixSession signature unchanged)

## Anti-Patterns to Avoid

- ❌ **Don't extend Error directly** - Must extend PipelineError to follow codebase patterns
- ❌ **Don't skip Object.setPrototypeOf** - Required for instanceof to work in transpiled code
- ❌ **Don't forget error code** - Must add to ErrorCodes const before using in class
- ❌ **Don't hardcode error code** - Use ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH constant
- ❌ **Don't change error message format** - validateBugfixSession defines the message format
- ❌ **Don't omit type guard** - Type guard is required for type-safe error handling
- ❌ **Don't skip tests** - Comprehensive tests required following existing patterns
- ❌ **Don't use wrong import path** - Must use .js extension for ESM modules
- ❌ **Don't forget re-export** - Re-export from session-validation.ts for convenience
- ❌ **Don't modify validateBugfixSession** - Function is correct, just replace error class
- ❌ **Don't add extra constructor parameters** - Follow PipelineError signature exactly
- ❌ **Don't implement toJSON manually** - Inherited from PipelineError base class
- ❌ **Don't duplicate error class** - Remove placeholder from session-validation.ts
- ❌ **Don't skip context parameter** - Required for including sessionPath in error details
- ❌ **Don't use synchronous-only patterns** - Error must work in both sync and async contexts
- ❌ **Don't ignore existing tests** - Verify all existing session-validation tests still pass
