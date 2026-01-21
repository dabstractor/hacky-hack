# Codebase Analysis: Error Handling Infrastructure

**Date:** 2026-01-15
**Purpose:** Analyze existing error handling patterns for EnvironmentError implementation
**Task:** P1.M1.T1.S1 - Write failing tests for EnvironmentError class

---

## Executive Summary

The hacky-hack project has a **mature, well-structured error handling system** with clear patterns to follow. The existing `PipelineError` hierarchy provides an excellent template for implementing `EnvironmentError`.

### Key Findings

1. **Abstract Base Class Pattern**: `PipelineError` is an abstract base class that enforces structure
2. **Consistent Constructor Pattern**: All errors use `(message, context?, cause?)` signature
3. **Prototype Chain Setup**: All errors correctly use `Object.setPrototypeOf()`
4. **Error Code Constants**: `ErrorCodes` object uses const assertion for type safety
5. **Comprehensive Testing**: Existing test files provide patterns to follow
6. **Type Guard Functions**: All errors have corresponding `is*Error()` type guards
7. **Context Sanitization**: Built-in PII redaction with 17 sensitive key patterns
8. **Structured Logging**: `toJSON()` method for Pino integration

---

## 1. Existing Error Class Hierarchy

### 1.1 File Structure

```
src/utils/errors.ts (558 lines)
├── ErrorCodes (const object with 14 error codes)
├── ErrorCode (type)
├── PipelineErrorContext (interface)
├── PipelineError (abstract base class)
├── SessionError (extends PipelineError)
├── TaskError (extends PipelineError)
├── AgentError (extends PipelineError)
├── ValidationError (extends PipelineError)
└── Type guard functions (isPipelineError, isSessionError, etc.)
```

### 1.2 Error Code Structure

```typescript
// Location: src/utils/errors.ts:58-83
export const ErrorCodes = {
  // Session errors
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  PIPELINE_SESSION_SAVE_FAILED: 'PIPELINE_SESSION_SAVE_FAILED',
  PIPELINE_SESSION_NOT_FOUND: 'PIPELINE_SESSION_NOT_FOUND',

  // Task errors
  PIPELINE_TASK_EXECUTION_FAILED: 'PIPELINE_TASK_EXECUTION_FAILED',
  PIPELINE_TASK_VALIDATION_FAILED: 'PIPELINE_TASK_VALIDATION_FAILED',
  PIPELINE_TASK_NOT_FOUND: 'PIPELINE_TASK_NOT_FOUND',

  // Agent errors
  PIPELINE_AGENT_LLM_FAILED: 'PIPELINE_AGENT_LLM_FAILED',
  PIPELINE_AGENT_TIMEOUT: 'PIPELINE_AGENT_TIMEOUT',
  PIPELINE_AGENT_PARSE_FAILED: 'PIPELINE_AGENT_PARSE_FAILED',

  // Validation errors (RELEVANT FOR EnvironmentError)
  PIPELINE_VALIDATION_INVALID_INPUT: 'PIPELINE_VALIDATION_INVALID_INPUT',
  PIPELINE_VALIDATION_MISSING_FIELD: 'PIPELINE_VALIDATION_MISSING_FIELD',
  PIPELINE_VALIDATION_SCHEMA_FAILED: 'PIPELINE_VALIDATION_SCHEMA_FAILED',
  PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY:
    'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY',

  // Resource errors
  PIPELINE_RESOURCE_LIMIT_EXCEEDED: 'PIPELINE_RESOURCE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### 1.3 PipelineErrorContext Interface

```typescript
// Location: src/utils/errors.ts:101-112
export interface PipelineErrorContext extends Record<string, unknown> {
  /** Path to session directory */
  sessionPath?: string;
  /** Task or subtask ID */
  taskId?: string;
  /** Operation being performed */
  operation?: string;
  /** Underlying cause description */
  cause?: string;
  /** Additional properties */
  [key: string]: unknown;
}
```

---

## 2. Constructor Pattern Analysis

### 2.1 PipelineError Base Class Constructor

```typescript
// Location: src/utils/errors.ts:143-204
export abstract class PipelineError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: PipelineErrorContext;
  readonly timestamp: Date;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message);

    // CRITICAL: Set prototype for instanceof to work correctly
    Object.setPrototypeOf(this, new.target.prototype);

    // CRITICAL: Capture stack trace (V8/Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();

    // Store cause if provided (ES2022+)
    if (cause) {
      (this as unknown as { cause?: Error }).cause = cause;
    }
  }
}
```

**Key Patterns to Follow:**

1. ✅ Use `Object.setPrototypeOf(this, new.target.prototype)` for prototype chain
2. ✅ Use `Error.captureStackTrace()` when available
3. ✅ Set `this.name = this.constructor.name`
4. ✅ Store `cause` property for error chaining
5. ✅ Accept optional `context` parameter

### 2.2 Specialized Error Constructor Pattern

**Example: SessionError** (Location: src/utils/errors.ts:356-374)

```typescript
export class SessionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    // Ensure prototype is set for this class
    Object.setPrototypeOf(this, SessionError.prototype);
  }

  isLoadError(): boolean {
    return this.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  }
}
```

**Example: ValidationError** (Location: src/utils/errors.ts:438-465)

```typescript
export class ValidationError extends PipelineError {
  readonly code: ErrorCode;

  constructor(
    message: string,
    context?: PipelineErrorContext,
    errorCodeOrCause?: ErrorCode | Error
  ) {
    // Determine if third argument is an error code or a cause
    let errorCode: ErrorCode;
    let cause: Error | undefined;

    if (errorCodeOrCause) {
      if (typeof errorCodeOrCause === 'string') {
        errorCode = errorCodeOrCause;
      } else {
        cause = errorCodeOrCause;
        errorCode = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
      }
    } else {
      errorCode = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
    }

    super(message, context, cause);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.code = errorCode;
  }
}
```

---

## 3. Context Sanitization Implementation

### 3.1 Sensitive Key Patterns

```typescript
// Location: src/utils/errors.ts:278-301
const sensitiveKeys = [
  'apikey',
  'apisecret',
  'api_key',
  'api_secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'authtoken',
  'bearertoken',
  'idtoken',
  'sessiontoken',
  'password',
  'passwd',
  'secret',
  'privatekey',
  'private',
  'email',
  'emailaddress',
  'phonenumber',
  'ssn',
  'authorization',
];
```

### 3.2 Sanitization Logic

```typescript
// Location: src/utils/errors.ts:273-335
private sanitizeContext(context: PipelineErrorContext): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    // Check if key is sensitive (case-insensitive)
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Handle nested errors
    if (value instanceof Error) {
      sanitized[key] = { name: value.name, message: value.message };
      continue;
    }

    // Handle functions (non-serializable)
    if (typeof value === 'function') {
      sanitized[key] = '[non-serializable]';
      continue;
    }

    // Handle circular references and other non-serializable objects
    try {
      JSON.stringify(value);
      sanitized[key] = value;
    } catch {
      sanitized[key] = '[non-serializable]';
    }
  }

  return sanitized;
}
```

---

## 4. Type Guard Pattern

### 4.1 Existing Type Guards

```typescript
// Location: src/utils/errors.ts:491-557
export function isPipelineError(error: unknown): error is PipelineError {
  return error instanceof PipelineError;
}

export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError;
}

export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
```

**Pattern to Follow:**

```typescript
export function isEnvironmentError(error: unknown): error is EnvironmentError {
  return error instanceof EnvironmentError;
}
```

---

## 5. Test Infrastructure Analysis

### 5.1 Test File Structure

```
tests/
├── unit/utils/
│   └── errors.test.ts (1074 lines) ← Pattern to follow
└── integration/utils/
    └── error-handling.test.ts (370 lines) ← Integration tests
```

### 5.2 Test Configuration

```typescript
// vitest.config.ts
{
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
}
```

### 5.3 Test Patterns from errors.test.ts

**Import Pattern:**

```typescript
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ErrorCodes,
  ErrorCode,
  PipelineErrorContext,
  PipelineError,
  SessionError,
  // ... other imports
} from '../../../src/utils/errors.js';
```

**Test Structure Pattern:**

```typescript
describe('SessionError class', () => {
  it('should create SessionError with message only', () => {
    const error = new SessionError('Session load failed');
    expect(error instanceof SessionError).toBe(true);
    expect(error.message).toBe('Session load failed');
  });

  it('should have correct error code', () => {
    const error = new SessionError('Test error');
    expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
  });

  it('should accept context', () => {
    const context: PipelineErrorContext = {
      sessionPath: '/path/to/session',
      taskId: 'P1.M1.T1',
    };
    const error = new SessionError('Test error', context);
    expect(error.context).toEqual(context);
  });

  it('should accept cause', () => {
    const cause = new Error('File not found');
    const error = new SessionError('Test error', {}, cause);
    const errorWithCause = error as unknown as { cause?: Error };
    expect(errorWithCause.cause).toBe(cause);
  });

  it('should work with instanceof', () => {
    const error = new SessionError('Test error');
    expect(error instanceof SessionError).toBe(true);
    expect(error instanceof PipelineError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});
```

---

## 6. Integration Test Analysis

### 6.1 EnvironmentError Tests Already Exist

```typescript
// Location: tests/integration/utils/error-handling.test.ts:114-124
it('should create EnvironmentError with correct properties', () => {
  const error = new EnvironmentError('Test environment error', {
    variable: 'TEST_VAR',
  });

  expect(error).toBeInstanceOf(PipelineError);
  expect(error.name).toBe('EnvironmentError');
  expect(error.message).toBe('Test environment error');
  expect((error as any).variable).toBe('TEST_VAR');
});
```

**Critical Finding:** Integration tests already expect `EnvironmentError` to exist!

- Test at line 114-124: Creates EnvironmentError instance
- Test at line 136-139: Expects isFatalError to return true for EnvironmentError
- Import at line 32: Exports EnvironmentError from errors.ts

---

## 7. Module Export Patterns

### 7.1 Error Exports from errors.ts

```typescript
// src/utils/errors.ts exports:
export const ErrorCodes = { ... };
export type ErrorCode = ...;
export interface PipelineErrorContext extends ...;
export abstract class PipelineError extends Error { ... }
export class SessionError extends PipelineError { ... }
export class TaskError extends PipelineError { ... }
export class AgentError extends PipelineError { ... }
export class ValidationError extends PipelineError { ... }
export function isPipelineError(error: unknown): error is PipelineError { ... }
export function isSessionError(error: unknown): error is SessionError { ... }
// ... etc
```

### 7.2 Core Module Exports

```typescript
// src/core/index.ts does NOT export error classes
// Errors are exported directly from src/utils/errors.ts
```

---

## 8. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "types": ["vitest/globals"]
  }
}
```

**Implications:**

- ✅ ES2022 target supports native Error cause option
- ✅ Can use modern TypeScript features
- ✅ Vitest globals available without imports

---

## 9. EnvironmentError Implementation Requirements

### 9.1 Error Code Selection

**Per tasks.json and system_context.md:**

```typescript
readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
```

**Rationale:** Environment configuration errors are validation failures (missing/invalid environment variables).

### 9.2 Constructor Signature

**Per existing pattern:**

```typescript
constructor(
  message: string,
  context?: PipelineErrorContext,
  cause?: Error
)
```

### 9.3 Required Methods

1. ✅ `toJSON(): Record<string, unknown>` - Inherited from PipelineError
2. ✅ Prototype chain setup via `Object.setPrototypeOf()`
3. ✅ Type guard: `isEnvironmentError(error: unknown): error is EnvironmentError`

### 9.4 Expected Context Fields

```typescript
interface EnvironmentErrorContext {
  variable?: string; // Missing/invalid environment variable name
  environment?: string; // Environment name (production/development/etc)
  expectedType?: string; // Expected type/format
  actualValue?: string; // Actual value received
  [key: string]: unknown;
}
```

---

## 10. Test File Requirements

### 10.1 File Location

```
tests/unit/utils/errors-environment.test.ts
```

**Naming Convention:** Follows pattern `errors-{classname}.test.ts`

### 10.2 Required Test Coverage

Based on existing `errors.test.ts`, must cover:

1. **Constructor Tests:**
   - Message only
   - Message + context
   - Message + context + cause
   - Context with environment variable name
   - Context with environment name

2. **Error Code Tests:**
   - Correct error code assigned
   - Error code matches ErrorCodes constant

3. **Instanceof Tests:**
   - instanceof EnvironmentError
   - instanceof PipelineError
   - instanceof Error

4. **Prototype Chain Tests:**
   - Correct prototype chain
   - Object.getPrototypeOf validation

5. **toJSON() Tests:**
   - Serializes correctly
   - Context included in JSON
   - Sensitive data redacted

6. **Type Guard Tests:**
   - isEnvironmentError returns true for correct instances
   - Returns false for other error types
   - Type narrowing works correctly

### 10.3 TDD Red Phase Requirements

**All tests must FAIL initially:**

- EnvironmentError class doesn't exist yet
- Import will fail: `EnvironmentError is not defined`
- Tests will fail with compilation/runtime errors

---

## 11. Critical Implementation Patterns

### 11.1 DO NOT Modify These Files

- ✅ `PRD.md` - Product requirements (READ-ONLY)
- ✅ `**/tasks.json` - Task definitions (owned by orchestrator)
- ✅ `**/prd_snapshot.md` - PRD snapshots (owned by orchestrator)
- ✅ `.gitignore` - Do not add plan/ or PRD.md

### 11.2 DO Modify These Files

- ✅ `tests/unit/utils/errors-environment.test.ts` - CREATE new test file
- ⚠️ `src/utils/errors.ts` - NOT in this subtask (next subtask)

### 11.3 File Paths (Absolute)

```
Test file: /home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts
Error source: /home/dustin/projects/hacky-hack/src/utils/errors.ts
Integration tests: /home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts
Existing unit tests: /home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts
```

---

## 12. Gotchas and Constraints

### 12.1 Known Gotchas

1. **Prototype Chain:** Must call `Object.setPrototypeOf(this, EnvironmentError.prototype)` in constructor
2. **Stack Trace:** Must call `Error.captureStackTrace()` when available
3. **Cause Property:** Must store cause using type assertion: `(this as unknown as { cause?: Error }).cause = cause`
4. **Const Assertion:** ErrorCodes uses `as const` for type safety
5. **ESM Imports:** Use `.js` extension in imports: `import { ... } from './errors.js'`
6. **100% Coverage:** Vitest requires 100% code coverage
7. **TDD Red Phase:** Tests MUST fail before implementation exists

### 12.2 Library Quirks

**Vitest:**

- Uses `describe`, `it`, `expect` from global scope
- `toThrow()` for error throwing tests
- `instanceOf()` for instanceof checks

**TypeScript:**

- Target: ES2022
- Module: NodeNext
- Strict mode enabled

---

## 13. Validation Commands

### 13.1 Test Commands

```bash
# Run all tests
npm run test:run

# Run specific test file
npm run test:run -- tests/unit/utils/errors-environment.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### 13.2 Type Checking

```bash
# Type check
npm run typecheck
```

### 13.3 Expected Test Output (Red Phase)

```
FAIL tests/unit/utils/errors-environment.test.ts
  ❌ EnvironmentError class tests
    ❌ should create EnvironmentError with message only
      ReferenceError: EnvironmentError is not defined

Test Files:  1 failed (1)
     Tests:  1 failed (1)
```

---

## 14. Success Criteria

### 14.1 Test File Completeness

- [ ] All constructor variations tested
- [ ] Error code assignment tested
- [ ] Prototype chain validated
- [ ] Type guard function tested
- [ ] toJSON() serialization tested
- [ ] Context sanitization tested
- [ ] instanceof checks tested
- [ ] Error chaining with cause tested
- [ ] Edge cases covered (empty strings, null, undefined)

### 14.2 Test Quality

- [ ] Tests follow existing patterns from errors.test.ts
- [ ] Tests use Vitest globals (describe, it, expect)
- [ ] Tests have clear descriptions
- [ ] Tests are isolated (no dependencies between tests)
- [ ] Tests use TypeScript types correctly
- [ ] Tests fail with clear error messages

---

## 15. References

### 15.1 Existing Files to Reference

1. **Error Implementation:** `/home/dustin/projects/hacky-hack/src/utils/errors.ts`
2. **Unit Test Pattern:** `/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts`
3. **Integration Tests:** `/home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts`
4. **Test Setup:** `/home/dustin/projects/hacky-hack/tests/setup.ts`
5. **Vitest Config:** `/home/dustin/projects/hacky-hack/vitest.config.ts`

### 15.2 Research Documents

1. **TypeScript Error Handling:** `research/typescript-error-handling.md`
2. **TDD Patterns:** `research/tdd-error-testing-patterns.md`
3. **Authoritative Sources:** `research/authoritative-sources.md`

---

## 16. Implementation Checklist

### Phase 1: Test File Structure

- [ ] Create file at correct path
- [ ] Add imports from errors.ts
- [ ] Add describe block for EnvironmentError
- [ ] Add beforeEach/afterEach if needed

### Phase 2: Constructor Tests

- [ ] Test: message only
- [ ] Test: message + context
- [ ] Test: message + context + cause
- [ ] Test: context with variable name
- [ ] Test: context with environment name

### Phase 3: Error Properties

- [ ] Test: error code assignment
- [ ] Test: name property
- [ ] Test: message property
- [ ] Test: timestamp property
- [ ] Test: context property

### Phase 4: Prototype Chain

- [ ] Test: instanceof EnvironmentError
- [ ] Test: instanceof PipelineError
- [ ] Test: instanceof Error
- [ ] Test: Object.getPrototypeOf chain

### Phase 5: Serialization

- [ ] Test: toJSON() returns plain object
- [ ] Test: toJSON() includes name
- [ ] Test: toJSON() includes code
- [ ] Test: toJSON() includes message
- [ ] Test: toJSON() includes timestamp
- [ ] Test: toJSON() includes context

### Phase 6: Type Guard

- [ ] Test: isEnvironmentError returns true
- [ ] Test: isEnvironmentError returns false for other errors
- [ ] Test: type narrowing in catch block

### Phase 7: Edge Cases

- [ ] Test: empty message
- [ ] Test: undefined context
- [ ] Test: null context
- [ ] Test: cause property
- [ ] Test: stack trace exists

---

**End of Codebase Analysis**
