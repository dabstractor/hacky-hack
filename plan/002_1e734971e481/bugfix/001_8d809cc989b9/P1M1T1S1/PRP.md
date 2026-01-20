# Product Requirement Prompt (PRP): EnvironmentError Test Implementation

**PRP ID:** P1.M1.T1.S1
**Work Item:** Write failing tests for EnvironmentError class
**Date:** 2026-01-15
**Status:** RED Phase - Tests must fail before implementation

---

## Goal

**Feature Goal**: Write comprehensive failing tests (TDD Red Phase) for the EnvironmentError class following established patterns in the codebase.

**Deliverable**: Test file at `tests/unit/utils/errors-environment.test.ts` containing 50+ failing tests that will pass once EnvironmentError is implemented in the next subtask (P1.M1.T1.S2).

**Success Definition**:
- All tests fail with clear error messages (EnvironmentError is not defined)
- Tests follow exact patterns from existing `errors.test.ts`
- Tests cover all constructor variations, prototype chain, type guards, and serialization
- Running `npm run test:run -- tests/unit/utils/errors-environment.test.ts` shows all tests failing
- Tests are ready for implementation phase (Green Phase) in next subtask

---

## User Persona

**Target User**: Developer implementing EnvironmentError class (AI agent or human)

**Use Case**: Developer needs comprehensive test suite to guide EnvironmentError implementation and validate correctness once complete.

**User Journey**:
1. Developer reviews PRP to understand test requirements
2. Developer runs tests to see Red Phase (all failing)
3. Developer implements EnvironmentError class in errors.ts
4. Developer re-runs tests to see Green Phase (all passing)
5. Integration tests at `tests/integration/utils/error-handling.test.ts` also pass

**Pain Points Addressed**:
- No ambiguity about what EnvironmentError should do
- Clear acceptance criteria via test assertions
- Type safety ensured through TypeScript compilation
- Prototype chain correctness validated through instanceof tests
- Context sanitization validated through toJSON() tests

---

## Why

- **Business Value**: EnvironmentError is critical for environment configuration failures (missing API keys, invalid configuration). Currently, 5 integration tests fail because this class doesn't exist.
- **Integration**: Completes the error handling hierarchy alongside SessionError, TaskError, AgentError, and ValidationError.
- **Problems Solved**: Enables proper error handling for environment validation failures throughout the pipeline. Fixes integration tests that expect EnvironmentError to exist.

---

## What

### User-Visible Behavior

**NOT APPLICABLE** - This is a test file only (TDD Red Phase). No user-visible behavior changes until implementation in next subtask.

### Technical Requirements

1. **Test File Location**: `tests/unit/utils/errors-environment.test.ts`
2. **Test Framework**: Vitest with globals (describe, it, expect)
3. **Test Coverage**: 50+ tests covering all aspects of EnvironmentError
4. **Test Status**: All tests must fail (EnvironmentError doesn't exist yet)

### Success Criteria

- [ ] Test file created at correct path
- [ ] All imports from errors.ts include EnvironmentError (will fail to import)
- [ ] 50+ test cases written following patterns from errors.test.ts
- [ ] Tests cover: constructor, error code, prototype chain, toJSON(), type guards
- [ ] Running tests shows all failing with "EnvironmentError is not defined"
- [ ] Tests follow existing naming conventions and structure
- [ ] No implementation code written (tests only)

---

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" Test Passed**: A developer unfamiliar with this codebase has everything needed to implement these tests successfully.

### Documentation & References

```yaml
# CRITICAL IMPLEMENTATION REFERENCES - Read these first

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: COMPLETE reference for error class patterns to follow
  pattern: PipelineError base class, SessionError/TaskError/AgentError/ValidationError implementations
  gotcha: Must use Object.setPrototypeOf() in constructor for instanceof checks
  sections: Lines 143-204 (PipelineError), 356-374 (SessionError), 438-465 (ValidationError)

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts
  why: EXACT test patterns to follow - copy structure, assertions, and organization
  pattern: Complete test suite for existing error classes (1074 lines)
  gotcha: Use Vitest globals (describe, it, expect) - no imports needed
  sections: Lines 474-525 (SessionError tests), 627-668 (ValidationError tests)

- file: /home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts
  why: Shows existing tests that expect EnvironmentError to exist
  pattern: Integration test expectations for EnvironmentError behavior
  gotcha: Lines 114-124, 136-139 already expect EnvironmentError - these currently fail
  sections: Lines 114-124 (EnvironmentError creation), 136-139 (isFatalError check)

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json
  why: Task definition with contract specifying exact requirements
  pattern: CONTRACT DEFINITION format for implementation guidance
  gotcha: Specifies error code as PIPELINE_VALIDATION_INVALID_INPUT
  sections: Lines 23-32 (P1.M1.T1.S1 context_scope)

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md
  why: System architecture showing where EnvironmentError fits
  pattern: Error handling infrastructure documentation
  gotcha: EnvironmentError must follow same pattern as SessionError, TaskError, AgentError
  sections: Lines 560-587 (Error Hierarchy section)

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test configuration showing coverage requirements and setup
  pattern: 100% coverage thresholds, global test environment
  gotcha: Coverage requires 100% statements, branches, functions, lines
  sections: Lines 26-39 (coverage configuration)

- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test setup with API safeguards and mock cleanup
  pattern: beforeEach/afterEach hooks for test isolation
  gotcha: API endpoint validation runs before each test
  sections: Lines 134-142 (beforeEach hook), 151-162 (afterEach hook)

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S1/research/typescript-error-handling.md
  why: TypeScript error handling best practices with code examples
  section: "1.3 Abstract Base Class Pattern" for PipelineError inheritance
  section: "2. Object.setPrototypeOf() Usage" - critical for prototype chain
  section: "6. toJSON() Method Implementation" for serialization tests

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S1/research/tdd-error-testing-patterns.md
  why: TDD patterns specifically for error class testing
  section: "Red-Green-Refactor Cycle" - TDD methodology
  section: "Test Coverage Patterns" - comprehensive test coverage matrix
  section: "Vitest-Specific Patterns" - toThrow(), instanceof, etc.

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S1/research/authoritative-sources.md
  why: Authoritative documentation with specific URLs
  section: "TypeScript Error Inheritance Best Practices" - Official handbook
  section: "Vitest Testing Framework" - Official docs with assertion patterns
  section: "Error Code Patterns" - Node.js error conventions

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S1/research/codebase-analysis.md
  why: Complete analysis of existing error handling patterns
  section: "2. Constructor Pattern Analysis" - exact patterns to follow
  section: "5. Test Infrastructure Analysis" - test file structure
  section: "9. EnvironmentError Implementation Requirements"
```

### Current Codebase Tree

```bash
home/dustin/projects/hacky-hack/
├── src/
│   └── utils/
│       └── errors.ts                    # Error class definitions (558 lines)
│           ├── ErrorCodes (const)
│           ├── ErrorCode (type)
│           ├── PipelineErrorContext (interface)
│           ├── PipelineError (abstract class)
│           ├── SessionError (class)
│           ├── TaskError (class)
│           ├── AgentError (class)
│           ├── ValidationError (class)
│           └── Type guard functions
│
├── tests/
│   ├── setup.ts                         # Global test configuration
│   ├── unit/utils/
│   │   └── errors.test.ts              # Existing error tests (1074 lines)
│   │   └── errors-environment.test.ts  # ⭐ CREATE THIS FILE ⭐
│   └── integration/utils/
│       └── error-handling.test.ts      # Integration tests expecting EnvironmentError
│
├── plan/002_1e734971e481/bugfix/001_8d809cc989b9/
│   ├── P1M1T1S1/
│   │   ├── PRP.md                      # ⭐ THIS DOCUMENT ⭐
│   │   └── research/                   # Research documentation
│   │       ├── typescript-error-handling.md
│   │       ├── tdd-error-testing-patterns.md
│   │       ├── authoritative-sources.md
│   │       └── codebase-analysis.md
│   └── tasks.json                       # Task definitions
│
├── vitest.config.ts                     # Test configuration
└── tsconfig.json                        # TypeScript configuration
```

### Desired Codebase Tree (After Implementation)

```bash
# After next subtask (P1.M1.T1.S2) - NOT THIS SUBTASK

src/utils/errors.ts
├── ...existing errors...
└── EnvironmentError (class)              # ← Will be added in P1.M1.T1.S2
└── isEnvironmentError (function)        # ← Will be added in P1.M1.T1.S3
```

### Known Gotchas of Our Codebase

```typescript
// CRITICAL: Object.setPrototypeOf() is REQUIRED for instanceof to work
// Without this, error instanceof CustomError will return false
// Location: src/utils/errors.ts:186-187
Object.setPrototypeOf(this, new.target.prototype);

// CRITICAL: Must call Object.setPrototypeOf() in subclass constructor too
// Location: src/utils/errors.ts:362 (SessionError pattern)
Object.setPrototypeOf(this, SessionError.prototype);

// CRITICAL: Error.captureStackTrace() is V8/Node.js only
// Check for existence before calling for cross-platform compatibility
// Location: src/utils/errors.ts:191-193
if (Error.captureStackTrace) {
  Error.captureStackTrace(this, this.constructor);
}

// CRITICAL: Cause property requires type assertion (not on Error type in all TS versions)
// Location: src/utils/errors.ts:201-203
if (cause) {
  (this as unknown as { cause?: Error }).cause = cause;
}

// CRITICAL: ESM imports require .js extension
// Even though source is .ts, imports use .js
import { PipelineError } from '../../../src/utils/errors.js';

// CRITICAL: Vitest uses globals - no need to import describe, it, expect
// Tests use globals from vitest.config.ts: globals: true

// CRITICAL: 100% code coverage required
// vitest.config.ts sets thresholds to 100% for all metrics

// CRITICAL: EnvironmentError must use PIPELINE_VALIDATION_INVALID_INPUT error code
// Per tasks.json contract definition, not a custom error code

// CRITICAL: Test file must be named errors-environment.test.ts
// Following pattern: errors-{classname}.test.ts

// CRITICAL: Integration tests already expect EnvironmentError
// tests/integration/utils/error-handling.test.ts:114-124 will fail until implemented
```

---

## Implementation Blueprint

### Data Models and Structure

**NOT APPLICABLE** - This subtask writes tests only. No data model changes.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure
  - CREATE: tests/unit/utils/errors-environment.test.ts
  - ADD: Top-level JSDoc comment describing test suite
  - IMPORT: Error classes and types from errors.ts (will fail)
  - FOLLOW pattern: tests/unit/utils/errors.test.ts (lines 1-36)
  - NAMING: Use describe() for test suites, it() for individual tests
  - PLACEMENT: tests/unit/utils/ directory alongside other error tests

Task 2: ADD constructor tests (RED phase - message only)
  - IMPLEMENT: Tests for EnvironmentError with message only parameter
  - FOLLOW pattern: errors.test.ts lines 475-479 (SessionError pattern)
  - ASSERT: instanceof EnvironmentError, instanceof PipelineError, instanceof Error
  - ASSERT: message property matches input
  - EXPECT: Test fails with "EnvironmentError is not defined"
  - PLACEMENT: First describe block in test file

Task 3: ADD constructor tests (message + context)
  - IMPLEMENT: Tests for EnvironmentError with message and context parameters
  - FOLLOW pattern: errors.test.ts lines 491-498 (SessionError with context)
  - CONTEXT: Include variable name, environment name
  - ASSERT: context property matches input
  - ASSERT: context.variable, context.environment accessible
  - PLACEMENT: Same describe block as Task 2

Task 4: ADD constructor tests (message + context + cause)
  - IMPLEMENT: Tests for EnvironmentError with all three parameters
  - FOLLOW pattern: errors.test.ts lines 500-506 (SessionError with cause)
  - CREATE: Error object for cause parameter
  - ASSERT: cause property stored on error instance
  - USE TYPE ASSERTION: (error as unknown as { cause?: Error }).cause
  - PLACEMENT: Same describe block as Task 2

Task 5: ADD error code tests
  - IMPLEMENT: Tests verifying correct error code assignment
  - FOLLOW pattern: errors.test.ts lines 481-484 (SessionError error code)
  - ASSERT: error.code equals ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT
  - ASSERT: code property is readonly
  - PLACEMENT: New describe block for error code tests

Task 6: ADD error name tests
  - IMPLEMENT: Tests verifying error name property
  - FOLLOW pattern: errors.test.ts lines 486-489 (SessionError name)
  - ASSERT: error.name equals 'EnvironmentError'
  - PLACEMENT: Same describe block as Task 5

Task 7: ADD timestamp tests
  - IMPLEMENT: Tests verifying timestamp property
  - FOLLOW pattern: errors.test.ts lines 174-184 (SessionError timestamp)
  - ASSERT: timestamp is Date object
  - ASSERT: timestamp is within expected time range
  - PLACEMENT: Same describe block as Task 5

Task 8: ADD instanceof tests (prototype chain)
  - IMPLEMENT: Tests validating instanceof checks work correctly
  - FOLLOW pattern: errors.test.ts lines 508-514 (SessionError instanceof)
  - ASSERT: error instanceof EnvironmentError is true
  - ASSERT: error instanceof PipelineError is true
  - ASSERT: error instanceof Error is true
  - PLACEMENT: New describe block for prototype chain tests

Task 9: ADD prototype chain tests
  - IMPLEMENT: Tests validating Object.getPrototypeOf chain
  - FOLLOW pattern: errors.test.ts lines 675-687 (SessionError prototype chain)
  - ASSERT: Object.getPrototypeOf(error) === EnvironmentError.prototype
  - ASSERT: Chain includes PipelineError.prototype and Error.prototype
  - PLACEMENT: Same describe block as Task 8

Task 10: ADD toJSON() serialization tests
  - IMPLEMENT: Tests for toJSON() method (inherited from PipelineError)
  - FOLLOW pattern: errors.test.ts lines 242-269 (SessionError toJSON)
  - ASSERT: toJSON() returns plain object
  - ASSERT: JSON includes name, code, message, timestamp
  - ASSERT: JSON includes context when provided
  - ASSERT: JSON.stringify() compatible
  - PLACEMENT: New describe block for serialization tests

Task 11: ADD context sanitization tests
  - IMPLEMENT: Tests for sensitive data redaction in context
  - FOLLOW pattern: errors.test.ts lines 324-367 (context sanitization)
  - CONTEXT: Include apiKey, token, password fields
  - ASSERT: Sensitive fields show '[REDACTED]' in toJSON()
  - ASSERT: Non-sensitive fields show actual values
  - ASSERT: Case-insensitive redaction works
  - PLACEMENT: New describe block for sanitization tests

Task 12: ADD type guard function tests (isEnvironmentError)
  - IMPLEMENT: Tests for isEnvironmentError type guard function
  - FOLLOW pattern: errors.test.ts lines 792-815 (isSessionError tests)
  - ASSERT: isEnvironmentError(EnvironmentError instance) returns true
  - ASSERT: isEnvironmentError(other errors) returns false
  - ASSERT: isEnvironmentError(non-errors) returns false
  - ASSERT: Type narrowing works in catch blocks
  - PLACEMENT: New describe block for type guard tests

Task 13: ADD edge case tests
  - IMPLEMENT: Tests for edge cases and error conditions
  - EDGE CASES: Empty message, undefined context, null context
  - ASSERT: Appropriate default behavior for each case
  - PLACEMENT: New describe block for edge cases

Task 14: ADD stack trace tests
  - IMPLEMENT: Tests validating stack trace exists and is formatted
  - FOLLOW pattern: errors.test.ts lines 198-203 (SessionError stack trace)
  - ASSERT: error.stack is defined
  - ASSERT: error.stack contains 'EnvironmentError'
  - PLACEMENT: New describe block for stack trace tests

Task 15: VALIDATE test file compiles and runs
  - RUN: npm run typecheck to verify TypeScript compilation
  - RUN: npm run test:run -- tests/unit/utils/errors-environment.test.ts
  - EXPECT: All tests fail with "EnvironmentError is not defined"
  - VERIFY: Test file structure matches errors.test.ts pattern
  - VERIFY: No syntax errors or type errors
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// TEST FILE STRUCTURE - Follow this exact pattern
// ============================================================================

/**
 * Unit tests for EnvironmentError class
 *
 * @remarks
 * Tests validate EnvironmentError functionality including:
 * 1. Constructor with message, context, and cause parameters
 * 2. Error code assignment (PIPELINE_VALIDATION_INVALID_INPUT)
 * 3. Prototype chain setup (instanceof checks)
 * 4. toJSON() serialization for structured logging
 * 5. Context sanitization (sensitive data redaction)
 * 6. Type guard function (isEnvironmentError)
 * 7. Timestamp tracking
 * 8. Error chaining with cause property
 *
 * TDD RED PHASE: All tests must fail before implementation
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/utils/errors.ts | Error Utilities}
 */

// PATTERN: Import from errors.ts with .js extension (ESM)
import {
  ErrorCodes,
  ErrorCode,
  PipelineErrorContext,
  PipelineError,
  // EnvironmentError will be imported here once implemented
  // isEnvironmentError will be imported here once implemented
} from '../../../src/utils/errors.js';

// ============================================================================
// CONSTRUCTOR TESTS - Follow SessionError pattern from errors.test.ts:474-525
// ============================================================================

describe('EnvironmentError class', () => {
  // PATTERN: Test with message only (minimal constructor call)
  it('should create EnvironmentError with message only', () => {
    // This test will FAIL because EnvironmentError doesn't exist yet
    const error = new EnvironmentError('Environment configuration failed');

    // ASSERT: instanceof checks validate prototype chain
    expect(error instanceof EnvironmentError).toBe(true);
    expect(error instanceof PipelineError).toBe(true);
    expect(error instanceof Error).toBe(true);

    // ASSERT: message property matches constructor input
    expect(error.message).toBe('Environment configuration failed');
  });

  // PATTERN: Test with context parameter
  it('should create EnvironmentError with context', () => {
    const context: PipelineErrorContext = {
      variable: 'API_KEY',
      environment: 'production',
    };

    const error = new EnvironmentError(
      'Missing required environment variable',
      context
    );

    // ASSERT: context property matches input
    expect(error.context).toEqual(context);
    expect(error.context?.variable).toBe('API_KEY');
    expect(error.context?.environment).toBe('production');
  });

  // PATTERN: Test with cause parameter
  it('should create EnvironmentError with cause', () => {
    const cause = new Error('Original error from environment validation');

    const error = new EnvironmentError(
      'Environment validation failed',
      {},
      cause
    );

    // PATTERN: Use type assertion to access cause property
    const errorWithCause = error as unknown as { cause?: Error };
    expect(errorWithCause.cause).toBe(cause);
    expect(errorWithCause.cause?.message).toBe('Original error from environment validation');
  });

  // GOTCHA: Test with all three parameters
  it('should create EnvironmentError with message, context, and cause', () => {
    const context: PipelineErrorContext = {
      variable: 'DATABASE_URL',
      environment: 'staging',
    };
    const cause = new Error('Connection timeout');

    const error = new EnvironmentError(
      'Database configuration invalid',
      context,
      cause
    );

    expect(error.message).toBe('Database configuration invalid');
    expect(error.context).toEqual(context);
    expect((error as unknown as { cause?: Error }).cause).toBe(cause);
  });
});

// ============================================================================
// ERROR PROPERTY TESTS - Follow errors.test.ts:481-497 pattern
// ============================================================================

describe('EnvironmentError error properties', () => {
  it('should have correct error code', () => {
    const error = new EnvironmentError('Test error');

    // CRITICAL: Must use PIPELINE_VALIDATION_INVALID_INPUT per tasks.json
    expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
  });

  it('should have correct name', () => {
    const error = new EnvironmentError('Test error');
    expect(error.name).toBe('EnvironmentError');
  });

  it('should have timestamp', () => {
    const before = new Date();
    const error = new EnvironmentError('Test error');
    const after = new Date();

    expect(error.timestamp).toBeDefined();
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should have stack trace', () => {
    const error = new EnvironmentError('Test error');

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    expect(error.stack).toContain('EnvironmentError');
  });
});

// ============================================================================
// PROTOTYPE CHAIN TESTS - Follow errors.test.ts:675-729 pattern
// ============================================================================

describe('EnvironmentError prototype chain', () => {
  it('should have correct prototype chain', () => {
    const error = new EnvironmentError('Test error');

    // CRITICAL: Validates Object.setPrototypeOf() was called
    expect(Object.getPrototypeOf(error)).toBe(EnvironmentError.prototype);
    expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
      PipelineError.prototype
    );
    expect(
      Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(error)))
    ).toBe(Error.prototype);
  });

  it('should work with instanceof for all error types', () => {
    const error = new EnvironmentError('Test error');

    expect(error instanceof EnvironmentError).toBe(true);
    expect(error instanceof PipelineError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

// ============================================================================
// SERIALIZATION TESTS - Follow errors.test.ts:242-317 pattern
// ============================================================================

describe('EnvironmentError toJSON() serialization', () => {
  it('should serialize error to plain object', () => {
    const error = new EnvironmentError('Test error');
    const json = error.toJSON();

    expect(json).toBeDefined();
    expect(typeof json).toBe('object');
  });

  it('should include name in JSON', () => {
    const error = new EnvironmentError('Test error');
    const json = error.toJSON();

    expect(json.name).toBe('EnvironmentError');
  });

  it('should include code in JSON', () => {
    const error = new EnvironmentError('Test error');
    const json = error.toJSON();

    expect(json.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
  });

  it('should include message in JSON', () => {
    const error = new EnvironmentError('Test error message');
    const json = error.toJSON();

    expect(json.message).toBe('Test error message');
  });

  it('should include timestamp in ISO format', () => {
    const error = new EnvironmentError('Test error');
    const json = error.toJSON();

    expect(json.timestamp).toBeDefined();
    expect(typeof json.timestamp).toBe('string');
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should include context in JSON when provided', () => {
    const context: PipelineErrorContext = {
      variable: 'REDIS_URL',
      environment: 'production',
    };
    const error = new EnvironmentError('Test error', context);
    const json = error.toJSON();

    expect(json.context).toBeDefined();
    expect(json.context).toEqual(context);
  });

  it('should be JSON.stringify compatible', () => {
    const error = new EnvironmentError('Test error', { variable: 'PORT' });

    expect(() => JSON.stringify(error.toJSON())).not.toThrow();
    const jsonStr = JSON.stringify(error.toJSON());
    const parsed = JSON.parse(jsonStr);

    expect(parsed.name).toBe('EnvironmentError');
    expect(parsed.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
  });
});

// ============================================================================
// CONTEXT SANITIZATION TESTS - Follow errors.test.ts:324-468 pattern
// ============================================================================

describe('EnvironmentError context sanitization', () => {
  it('should redact apiKey field', () => {
    const error = new EnvironmentError('Test error', {
      apiKey: 'sk-secret-key-12345',
    });
    const json = error.toJSON();
    const context = json.context as Record<string, unknown> | undefined;

    expect(context?.apiKey).toBe('[REDACTED]');
  });

  it('should redact token field', () => {
    const error = new EnvironmentError('Test error', {
      token: 'secret-token-abc',
    });
    const json = error.toJSON();
    const context = json.context as Record<string, unknown> | undefined;

    expect(context?.token).toBe('[REDACTED]');
  });

  it('should redact password field', () => {
    const error = new EnvironmentError('Test error', {
      password: 'secret-password',
    });
    const json = error.toJSON();
    const context = json.context as Record<string, unknown> | undefined;

    expect(context?.password).toBe('[REDACTED]');
  });

  it('should redact case-insensitively', () => {
    const error = new EnvironmentError('Test error', {
      APIKEY: 'sk-secret',
      ApiSecret: 'secret',
      PASSWORD: 'password',
    });
    const json = error.toJSON();
    const context = json.context as Record<string, unknown> | undefined;

    expect(context?.APIKEY).toBe('[REDACTED]');
    expect(context?.ApiSecret).toBe('[REDACTED]');
    expect(context?.PASSWORD).toBe('[REDACTED]');
  });

  it('should not redact non-sensitive fields', () => {
    const error = new EnvironmentError('Test error', {
      variable: 'API_KEY',
      environment: 'production',
      operation: 'validateEnvironment',
    });
    const json = error.toJSON();
    const context = json.context as Record<string, unknown> | undefined;

    expect(context?.variable).toBe('API_KEY');
    expect(context?.environment).toBe('production');
    expect(context?.operation).toBe('validateEnvironment');
  });

  it('should handle nested Error objects in context', () => {
    const cause = new Error('Original error');
    const error = new EnvironmentError('Test error', {
      originalError: cause,
    });
    const json = error.toJSON();
    const context = json.context as Record<string, unknown> | undefined;

    expect(context?.originalError).toEqual({
      name: 'Error',
      message: 'Original error',
    });
  });
});

// ============================================================================
// TYPE GUARD TESTS - Follow errors.test.ts:792-890 pattern
// ============================================================================

describe('isEnvironmentError type guard', () => {
  it('should return true for EnvironmentError instances', () => {
    const error = new EnvironmentError('Test error');
    expect(isEnvironmentError(error)).toBe(true);
  });

  it('should return false for other error types', () => {
    // Note: Can't test this yet because other errors don't exist
    // But this shows the pattern to follow
    const plainError = new Error('Test');
    expect(isEnvironmentError(plainError)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isEnvironmentError(null)).toBe(false);
    expect(isEnvironmentError(undefined)).toBe(false);
    expect(isEnvironmentError('string')).toBe(false);
    expect(isEnvironmentError(123)).toBe(false);
    expect(isEnvironmentError({})).toBe(false);
  });

  it('should narrow type in catch block', () => {
    try {
      throw new EnvironmentError('Environment error');
    } catch (error) {
      if (isEnvironmentError(error)) {
        // Type is narrowed to EnvironmentError
        expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
        expect(error.context).toBeDefined();
      }
    }
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('EnvironmentError edge cases', () => {
  it('should handle empty message', () => {
    const error = new EnvironmentError('');
    expect(error.message).toBe('');
  });

  it('should handle undefined context', () => {
    const error = new EnvironmentError('Test error');
    expect(error.context).toBeUndefined();
  });

  it('should handle null context', () => {
    const error = new EnvironmentError('Test error', null as any);
    expect(error.context).toBeNull();
  });

  it('should handle undefined cause', () => {
    const error = new EnvironmentError('Test error');
    const errorWithCause = error as unknown as { cause?: Error };
    expect(errorWithCause.cause).toBeUndefined();
  });

  it('should handle complex context objects', () => {
    const context: PipelineErrorContext = {
      variable: 'DATABASE_URL',
      environment: 'production',
      operation: 'validate',
      metadata: {
        timestamp: Date.now(),
        attempt: 3,
      },
      tags: ['environment', 'validation', 'critical'],
    };

    const error = new EnvironmentError('Complex error', context);
    expect(error.context).toEqual(context);
  });
});
```

### Integration Points

```yaml
IMPORTS:
  - file: tests/unit/utils/errors-environment.test.ts
  - import_from: ../../../src/utils/errors.js
  - pattern: Use ESM imports with .js extension
  - imports: ErrorCodes, PipelineErrorContext, PipelineError, EnvironmentError, isEnvironmentError

TEST_FRAMEWORK:
  - framework: Vitest
  - globals: describe, it, expect (no imports needed)
  - configuration: vitest.config.ts
  - setup: tests/setup.ts (beforeEach/afterEach hooks)

COVERAGE_REQUIREMENTS:
  - provider: v8
  - thresholds: 100% statements, branches, functions, lines
  - command: npm run test:coverage

INTEGRATION_TESTS:
  - file: tests/integration/utils/error-handling.test.ts
  - lines: 114-124, 136-139
  - status: Will fail until EnvironmentError is implemented in P1.M1.T1.S2
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating test file - fix before proceeding
npx tsc --noEmit tests/unit/utils/errors-environment.test.ts

# Expected: Compilation fails with "Cannot find name 'EnvironmentError'"
# This is CORRECT for RED phase - tests must fail

# Type check entire project
npm run typecheck

# Expected: Type check fails with EnvironmentError errors
# This confirms tests are properly written but implementation doesn't exist
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific test file (RED PHASE - ALL TESTS MUST FAIL)
npm run test:run -- tests/unit/utils/errors-environment.test.ts

# Expected Output:
# FAIL tests/unit/utils/errors-environment.test.ts
#   ❌ EnvironmentError class tests
#     ❌ should create EnvironmentError with message only
#       ReferenceError: EnvironmentError is not defined
#     ❌ should create EnvironmentError with context
#       ReferenceError: EnvironmentError is not defined
#     ... (all tests fail with similar errors)
#
# Test Files:  1 failed (1)
#      Tests:  XX failed (XX)
#
# CRITICAL: If tests PASS, something is wrong - they should fail in RED phase

# Run with verbose output to see all test failures
npm run test:run -- tests/unit/utils/errors-environment.test.ts --reporter=verbose

# Expected: All tests show "ReferenceError: EnvironmentError is not defined"
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests to see what's currently failing
npm run test:run -- tests/integration/utils/error-handling.test.ts

# Current State (BEFORE implementation):
# FAIL tests/integration/utils/error-handling.test.ts
#   ❌ should create EnvironmentError with correct properties
#     ReferenceError: EnvironmentError is not a constructor
#   ❌ should identify EnvironmentError as fatal
#     TypeError: isFatalError is not a function
#
# Expected: These tests currently fail - will be fixed in P1.M2 subtasks

# After P1.M1.T1.S2 (EnvironmentError implementation):
# Expected: EnvironmentError creation test passes
# Expected: isFatalError test still fails (isFatalError implemented in P1.M2)
```

### Level 4: Creative & Domain-Specific Validation

```bash
# No creative validation for test file creation
# This is TDD RED phase - only validation is that tests fail correctly

# Verify test file follows project patterns
diff -u tests/unit/utils/errors.test.ts tests/unit/utils/errors-environment.test.ts | head -100

# Expected: Similar structure, describe blocks, assertion patterns
# Expected: Different error class name and specific tests

# Count test cases
grep -c "it(" tests/unit/utils/errors-environment.test.ts

# Expected: 50+ test cases
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file created at `tests/unit/utils/errors-environment.test.ts`
- [ ] All imports from `errors.ts` include EnvironmentError (will fail to compile)
- [ ] 50+ test cases written following patterns from `errors.test.ts`
- [ ] Tests cover: constructor, error code, prototype chain, toJSON(), type guards, edge cases
- [ ] All tests fail with "EnvironmentError is not defined" (RED phase confirmed)
- [ ] Test file compiles with TypeScript (import errors are expected)
- [ ] Test file structure matches existing test patterns

### Feature Validation

- [ ] Tests follow SessionError/ValidationError patterns from errors.test.ts
- [ ] Tests expect PIPELINE_VALIDATION_INVALID_INPUT error code
- [ ] Tests validate instanceof EnvironmentError, PipelineError, Error
- [ ] Tests validate Object.setPrototypeOf() prototype chain
- [ ] Tests validate toJSON() serialization
- [ ] Tests validate context sanitization (sensitive data redaction)
- [ ] Tests validate isEnvironmentError type guard function
- [ ] Edge cases covered (empty message, undefined context, null, etc.)

### Code Quality Validation

- [ ] JSDoc comment at top of file describing test suite
- [ ] Test descriptions are clear and follow "should..." pattern
- [ ] Tests are isolated (no dependencies between tests)
- [ ] Tests use TypeScript types correctly
- [ ] Tests use Vitest globals (describe, it, expect)
- [ ] Tests follow naming convention: errors-environment.test.ts
- [ ] Tests use ESM imports with .js extension

### TDD Methodology Validation

- [ ] RED phase confirmed: All tests fail with clear error messages
- [ ] No implementation code written (tests only)
- [ ] Tests will guide implementation in next subtask (P1.M1.T1.S2)
- [ ] Tests are comprehensive enough to validate complete implementation
- [ ] Tests follow existing codebase patterns and conventions

### Documentation & Deployment

- [ ] Test file is self-documenting with clear test names
- [ ] JSDoc comment explains TDD RED phase purpose
- [ ] No environment variables needed for test execution
- [ ] Test file ready for version control

---

## Anti-Patterns to Avoid

- ❌ **DON'T implement EnvironmentError class** - This is RED phase, tests only
- ❌ **DON'T make tests pass** - Tests MUST fail until implementation in P1.M1.T1.S2
- ❌ **DON'T skip prototype chain tests** - Critical for instanceof checks
- ❌ **DON'T forget Object.setPrototypeOf() validation** - Most common error
- ❌ **DON'T use sync functions when testing async** - Not applicable for error tests
- ❌ **DON'T hardcode values that should be from ErrorCodes** - Use ErrorCodes constant
- ❌ **DON'T catch all exceptions** - Tests should fail, not catch errors
- ❌ **DON'T write vague test descriptions** - Use "should create..." pattern
- ❌ **DON'T forget type guard tests** - isEnvironmentError must be tested
- ❌ **DON'T skip sanitization tests** - Context redaction is critical
- ❌ **DON'T use console.log for testing** - Use expect() assertions
- ❌ **DON'T create test data files** - Use inline test fixtures
- ❌ **DON'T modify existing test files** - Create new file only
- ❌ **DON'T add implementation code** - Tests only, no production code

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Confidence Reasoning**:
1. ✅ Complete research documentation with code examples
2. ✅ Existing error class patterns provide exact template
3. ✅ Test patterns fully documented in errors.test.ts
4. ✅ Integration tests already exist showing expected behavior
5. ✅ TDD methodology ensures implementation will match tests
6. ✅ All context and gotchas documented
7. ✅ Validation commands are project-specific and verified

**Validation**: The completed test file will enable an AI agent unfamiliar with the codebase to implement EnvironmentError successfully using only these tests and the referenced patterns.

---

## PRP Metadata

**PRP Version:** 1.0
**Last Updated:** 2026-01-15
**Author:** Research Agent (P1.M1.T1.S1)
**Status:** Ready for RED Phase Implementation

**Related Documents:**
- Research: `P1M1T1S1/research/typescript-error-handling.md`
- Research: `P1M1T1S1/research/tdd-error-testing-patterns.md`
- Research: `P1M1T1S1/research/authoritative-sources.md`
- Research: `P1M1T1S1/research/codebase-analysis.md`
- Task Definition: `plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json`

**Next Steps After This PRP:**
1. Execute implementation tasks in order
2. Run validation commands after each task
3. Confirm all tests fail (RED phase complete)
4. Proceed to P1.M1.T1.S2 (EnvironmentError implementation - GREEN phase)

---

**END OF PRP**
