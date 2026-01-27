# TypeScript/JavaScript Custom Error Class Best Practices - Research Summary

**Research Date:** 2026-01-27
**Purpose:** Comprehensive guide for TypeScript/JavaScript custom error class implementation

---

## Executive Summary

This document summarizes TypeScript and JavaScript custom error class best practices compiled from extensive research conducted for this codebase. The findings are based on TypeScript documentation, MDN documentation, Node.js internal error patterns, and community best practices.

**Key Finding:** The codebase already implements world-class error handling patterns in `/home/dustin/projects/hacky-hack/src/utils/errors.ts` that serve as a reference implementation for all error class creation.

---

## 1. TypeScript Best Practices for Custom Error Classes

### 1.1 Always Extend Error Properly

**Critical Pattern:**

```typescript
export class CustomError extends Error {
  constructor(message: string) {
    super(message);

    // CRITICAL: Required for instanceof to work in transpiled code
    Object.setPrototypeOf(this, CustomError.prototype);

    // Better stack traces in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    // Set explicit name for proper error identification
    this.name = 'CustomError';
  }
}
```

**Why This Matters:**
- `Object.setPrototypeOf()` is required because TypeScript's default ES5 transpilation breaks prototype inheritance
- `Error.captureStackTrace()` provides cleaner stack traces in V8/Node.js environments
- Explicit `this.name` ensures error shows correctly in logs and debuggers

### 1.2 TypeScript Compiler Configuration

**Required tsconfig.json settings:**

```json
{
  "compilerOptions": {
    "target": "ES2015",  // or higher (ES2016, ES2018, ES2020, ES2022)
    "lib": ["ES2015"]
  }
}
```

**Why:** ES5 target breaks Error prototype chain. ES2015+ preserves native Error inheritance.

---

## 2. Proper Prototype Chain Setup

### 2.1 The Problem

When TypeScript compiles to ES5, the following happens:

```typescript
// TypeScript source
class CustomError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Transpiled ES5 (without Object.setPrototypeOf)
var CustomError = /** @class */ (function () {
  function CustomError(message) {
    var _this = _super.call(this, message) || this;
    return _this; // Prototype chain is BROKEN
  }
  // ...
  return CustomError;
}());
```

**Symptom:** `instanceof CustomError` returns `false`

### 2.2 The Solution

```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);

    // CRITICAL: Restore prototype chain
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
```

### 2.3 Testing Prototype Chain

**Always test in unit tests:**

```typescript
describe('CustomError prototype chain', () => {
  it('should be instanceof Error', () => {
    const error = new CustomError('test');
    expect(error instanceof Error).toBe(true);
  });

  it('should be instanceof CustomError', () => {
    const error = new CustomError('test');
    expect(error instanceof CustomError).toBe(true);
  });

  it('should maintain instanceof after throw/catch', () => {
    let caughtError: unknown;
    try {
      throw new CustomError('test');
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError instanceof CustomError).toBe(true);
  });

  it('should have correct prototype', () => {
    const error = new CustomError('test');
    const proto = Object.getPrototypeOf(error);
    expect(proto.constructor).toBe(CustomError);
    expect(Object.getPrototypeOf(proto)).toBe(Error.prototype);
  });
});
```

---

## 3. Error Code Enum Patterns

### 3.1 Pattern 1: Const Assertion (Recommended)

**Best for:** Type-safe error codes with autocomplete

```typescript
export const ErrorCodes = {
  // Session errors
  SESSION_LOAD_FAILED: 'SESSION_LOAD_FAILED',
  SESSION_SAVE_FAILED: 'SESSION_SAVE_FAILED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',

  // Validation errors
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_SCHEMA_FAILED: 'VALIDATION_SCHEMA_FAILED',

  // Task errors
  TASK_EXECUTION_FAILED: 'TASK_EXECUTION_FAILED',
  TASK_TIMEOUT: 'TASK_TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Usage - TypeScript provides autocomplete
throw new ValidationError('Invalid input', ErrorCodes.VALIDATION_INVALID_INPUT);
```

**Benefits:**
- Type-safe with `as const` assertion
- TypeScript autocomplete in IDEs
- Prevents typos at compile time
- Easy to add new codes

### 3.2 Pattern 2: Enum-Based

**Best for:** Numeric error codes or when you need reverse mapping

```typescript
export enum ErrorCode {
  // Validation errors (1000-1999)
  VALIDATION_ERROR = 1000,
  INVALID_INPUT = 1001,
  MISSING_FIELD = 1002,

  // Session errors (2000-2999)
  SESSION_LOAD_FAILED = 2000,
  SESSION_SAVE_FAILED = 2001,

  // Task errors (3000-3999)
  TASK_EXECUTION_FAILED = 3000,
  TASK_TIMEOUT = 3001,
}

throw new ValidationError('Invalid input', ErrorCode.INVALID_INPUT);
```

### 3.3 Error Code Naming Convention

**Standard Format:**

```
[MODULE]_[CATEGORY]_[SPECIFIC_ERROR]
```

**Examples:**
- `SESSION_LOAD_FAILED` - Module: SESSION, Error: LOAD_FAILED
- `VALIDATION_INVALID_INPUT` - Module: VALIDATION, Error: INVALID_INPUT
- `TASK_EXECUTION_TIMEOUT` - Module: TASK, Error: EXECUTION_TIMEOUT
- `AGENT_LLM_FAILED` - Module: AGENT, Error: LLM_FAILED

---

## 4. Type Guard Function Patterns

### 4.1 Basic Type Guard

**Purpose:** Narrow unknown error to specific error type

```typescript
export function isValidationError(
  error: unknown
): error is ValidationError {
  return error instanceof ValidationError;
}

// Usage
try {
  validateInput(data);
} catch (error) {
  if (isValidationError(error)) {
    // TypeScript knows error is ValidationError
    console.error(error.code); // Safe access
    console.error(error.context); // Safe access
  }
}
```

### 4.2 Error Code Type Guard

**Purpose:** Narrow error by specific error code

```typescript
export function hasErrorCode(
  error: unknown,
  code: ErrorCode
): error is ValidationError {
  return isValidationError(error) && error.code === code;
}

// Usage
if (hasErrorCode(error, ErrorCodes.VALIDATION_INVALID_INPUT)) {
  // Handle invalid input specifically
}
```

### 4.3 Comprehensive Type Guard

**Purpose:** Check for any custom error in hierarchy

```typescript
export function isCustomError(error: unknown): error is CustomError {
  return (
    error instanceof CustomError ||
    (error instanceof Error &&
      (error as any).name === 'CustomError')
  );
}
```

### 4.4 Type Guard Best Practices

1. **Always return `boolean`** with type predicate `: error is Type`
2. **Use instanceof** as primary check
3. **Add fallback name check** for cross-instance scenarios
4. **Export type guards** alongside error classes
5. **Test type guards** verify type narrowing works

---

## 5. Context Object Patterns for Debugging

### 5.1 Context Interface Pattern

**Define typed context interface:**

```typescript
export interface ValidationErrorContext extends Record<string, unknown> {
  /** Path to file being validated */
  filePath?: string;
  /** Field name that failed validation */
  field?: string;
  /** Value that failed validation */
  value?: unknown;
  /** Expected type */
  expectedType?: string;
  /** Actual type received */
  actualType?: string;
  /** Operation being performed */
  operation?: string;
}
```

### 5.2 Context Property Patterns

**Include in Context:**

```typescript
{
  // ✓ File paths (not contents)
  filePath: '/path/to/file.json',

  // ✓ Field names
  field: 'sessionId',

  // ✓ Type information
  expectedType: 'string',
  actualType: 'number',

  // ✓ Validation rules
  pattern: '^[a-z0-9]+$',

  // ✓ Session IDs (non-sensitive identifiers)
  sessionId: 'session-123',

  // ✓ Task IDs
  taskId: 'P1.M1.T1',

  // ✓ Operation names
  operation: 'load_session',
}
```

**Exclude from Context:**

```typescript
{
  // ✗ Passwords
  password: 'secret123',

  // ✗ API keys
  apiKey: 'sk-1234567890',

  // ✗ Tokens
  accessToken: 'eyJhbGci...',

  // ✗ File contents
  fileContents: 'sensitive data',

  // ✗ Personal data (PII)
  email: 'user@example.com',

  // ✗ Secrets
  privateKey: '-----BEGIN PRIVATE KEY-----',
}
```

### 5.3 Sensitive Data Sanitization

**Implement in toJSON() method:**

```typescript
class CustomError extends Error {
  toJSON() {
    const sanitized: Record<string, unknown> = {
      name: this.name,
      message: this.message,
      code: this.code,
    };

    if (this.context) {
      sanitized.context = this.sanitizeContext(this.context);
    }

    return sanitized;
  }

  private sanitizeContext(
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    // Sensitive key patterns (lowercase for case-insensitive matching)
    const sensitiveKeys = [
      'apikey',
      'apisecret',
      'api_key',
      'api_secret',
      'token',
      'accesstoken',
      'refreshtoken',
      'authtoken',
      'password',
      'passwd',
      'secret',
      'privatekey',
      'email',
      'emailaddress',
      'phonenumber',
      'ssn',
      'authorization',
    ];

    for (const [key, value] of Object.entries(context)) {
      // Check if key is sensitive (case-insensitive)
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Handle nested errors
      if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
        };
        continue;
      }

      // Handle functions (non-serializable)
      if (typeof value === 'function') {
        sanitized[key] = '[non-serializable]';
        continue;
      }

      // Test serializability
      try {
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        sanitized[key] = '[non-serializable]';
      }
    }

    return sanitized;
  }
}
```

### 5.4 Context Usage Patterns

**File validation error:**

```typescript
throw new ValidationError(
  'Session file not found',
  'SESSION_FILE_NOT_FOUND',
  {
    filePath: '/path/to/session.json',
    operation: 'load_session',
    attemptedPaths: [
      '/path/to/session.json',
      '/path/to/session.json.bak',
    ],
  }
);
```

**Field validation error:**

```typescript
throw new ValidationError(
  'Field "sessionId" must be a non-empty string',
  'VALIDATION_MISSING_FIELD',
  {
    field: 'sessionId',
    value: undefined,
    expectedType: 'string',
    actualType: 'undefined',
  }
);
```

**Type validation error:**

```typescript
throw new ValidationError(
  'Expected "steps" to be number, got string',
  'VALIDATION_TYPE_MISMATCH',
  {
    field: 'steps',
    value: 'not-a-number',
    expectedType: 'number',
    actualType: 'string',
  }
);
```

---

## 6. Best Practices for Error Message Formatting

### 6.1 Message Structure

**Effective format:**

```
[What failed] + [why it failed] + [relevant details] + [actionable guidance]
```

### 6.2 Message Examples

**Good Messages:**

```typescript
// Specific + actionable
'Session file not found at /path/to/session.json. Run init to create.'

// Clear about what went wrong
'Field "sessionId" is required but was undefined.'

// Shows expected vs actual
'Expected "steps" to be number, got string "five".'

// Includes context for debugging
'Failed to parse session JSON at line 42: Unexpected token }'

// Provides solution hint
'Invalid session path format. Expected: plan/XXX/hhhhhhhh/bugfix/YYY/zzzzzzzz'
```

**Bad Messages:**

```typescript
// Too generic
'Error occurred'

// No context
'Validation failed'

// Missing actionable info
'Invalid input'

// Technically correct but unhelpful
'Object is not of type Session'
```

### 6.3 Message Formatting Guidelines

1. **Be specific about what failed**
   - Use field names, file paths, operation names

2. **Include the problematic value**
   - Show what was received (but sanitize sensitive data)

3. **Provide type information**
   - Show expected vs actual types

4. **Offer actionable guidance**
   - Suggest how to fix the issue

5. **Use consistent formatting**
   - Same structure across all error messages

6. **Keep messages concise**
   - One or two sentences max
   - Put detailed info in context object

### 6.4 Dynamic Message Building

**Use template literals for context:**

```typescript
function createFieldValidationError(
  field: string,
  value: unknown,
  expectedType: string
): ValidationError {
  const actualType = typeof value;

  return new ValidationError(
    `Field "${field}" must be ${expectedType}, got ${actualType}` +
      (value !== undefined ? ` (${JSON.stringify(value)})` : ''),
    'VALIDATION_TYPE_MISMATCH',
    {
      field,
      value,
      expectedType,
      actualType,
    }
  );
}
```

---

## 7. Complete Reference Implementation

**Based on codebase patterns:**

```typescript
/**
 * Custom error class template following all best practices
 */
export class CustomError extends Error {
  /**
   * Machine-readable error code
   */
  public readonly code: string;

  /**
   * Additional debugging context
   */
  public readonly context?: Record<string, unknown>;

  /**
   * Timestamp when error was created
   */
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);

    // CRITICAL: Restore prototype chain for instanceof
    Object.setPrototypeOf(this, CustomError.prototype);

    // CRITICAL: Capture clean stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    this.name = 'CustomError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();

    // Attach context properties directly for easy access
    if (context) {
      Object.assign(this, context);
    }

    // Chain error stacks if cause provided
    if (cause) {
      (this as unknown as { cause?: Error }).cause = cause;
      if (cause.stack) {
        this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
      }
    }
  }

  /**
   * Serialize error for structured logging
   */
  toJSON(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };

    if (this.context) {
      serialized.context = this.sanitizeContext(this.context);
    }

    if (this.stack) {
      serialized.stack = this.stack;
    }

    const cause = (this as unknown as { cause?: Error }).cause;
    if (cause) {
      serialized.cause = {
        name: cause.name,
        message: cause.message,
      };
    }

    return serialized;
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    const sensitiveKeys = [
      'apikey',
      'token',
      'password',
      'secret',
      'email',
      'authorization',
    ];

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
        };
        continue;
      }

      if (typeof value === 'function') {
        sanitized[key] = '[non-serializable]';
        continue;
      }

      try {
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        sanitized[key] = '[non-serializable]';
      }
    }

    return sanitized;
  }
}

/**
 * Type guard for CustomError
 */
export function isCustomError(error: unknown): error is CustomError {
  return error instanceof CustomError;
}

/**
 * Type guard for specific error code
 */
export function hasCustomErrorCode(
  error: unknown,
  code: string
): error is CustomError {
  return isCustomError(error) && error.code === code;
}
```

---

## 8. Common Pitfalls to Avoid

### 8.1 Forgetting Object.setPrototypeOf()

**Symptom:** `instanceof` returns false

```typescript
// ✗ WRONG
class BadError extends Error {
  constructor(message: string) {
    super(message);
    // Missing Object.setPrototypeOf
  }
}

// ✓ CORRECT
class GoodError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, GoodError.prototype);
  }
}
```

### 8.2 Not Setting this.name

**Symptom:** Error shows as "Error" in logs

```typescript
// ✗ WRONG
this.name not set

// ✓ CORRECT
this.name = 'CustomError';
```

### 8.3 Not Implementing toJSON()

**Symptom:** Errors don't serialize properly for logging

```typescript
// ✗ WRONG
class BadError extends Error {
  constructor(message: string) {
    super(message);
  }
  // No toJSON method
}

// ✓ CORRECT
class GoodError extends Error {
  constructor(message: string) {
    super(message);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      // ... other properties
    };
  }
}
```

### 8.4 Including Sensitive Data

**Symptom:** Security vulnerability

```typescript
// ✗ WRONG
throw new Error(
  'Authentication failed',
  'AUTH_ERROR',
  {
    password: 'userPassword123', // Don't log passwords!
    apiKey: 'sk-1234567890', // Don't log API keys!
  }
);

// ✓ CORRECT
throw new Error(
  'Authentication failed',
  'AUTH_ERROR',
  {
    username: 'user@example.com', // OK - username is not sensitive
    attempt: 3, // OK - attempt count
  }
);
```

### 8.5 Throwing Non-Error Objects

**Symptom:** Breaks error handling conventions

```typescript
// ✗ WRONG
throw 'Something went wrong';
throw { message: 'Something went wrong' };
throw 500;

// ✓ CORRECT
throw new Error('Something went wrong');
throw new ValidationError('Invalid input', 'VALIDATION_ERROR');
```

### 8.6 Parsing Error Messages

**Symptom:** Fragile error handling

```typescript
// ✗ WRONG - Parsing messages is fragile
try {
  validatePath(path);
} catch (error) {
  if (error.message.includes('traversal')) {
    // Handle path traversal
  }
}

// ✓ CORRECT - Use error codes
try {
  validatePath(path);
} catch (error) {
  if (error instanceof ValidationError &&
      error.code === 'PATH_TRAVERSAL') {
    // Handle path traversal
  }
}
```

---

## 9. Testing Best Practices

### 9.1 Essential Tests

**Every custom error class should have:**

```typescript
describe('CustomError', () => {
  describe('constructor', () => {
    it('should create error with message');
    it('should create error with code');
    it('should create error with context');
    it('should create error with cause');
    it('should set timestamp');
  });

  describe('prototype chain', () => {
    it('should be instanceof Error');
    it('should be instanceof CustomError');
    it('should maintain instanceof after throw/catch');
    it('should have correct constructor');
  });

  describe('toJSON()', () => {
    it('should serialize error to JSON');
    it('should include context');
    it('should include cause');
    it('should redact sensitive data');
    it('should handle circular references');
  });

  describe('type guards', () => {
    it('should identify CustomError');
    it('should reject other errors');
    it('should narrow type correctly');
  });

  describe('stack trace', () => {
    it('should capture stack trace');
    it('should include cause in stack');
  });
});
```

---

## 10. Sources and References

### Official Documentation
1. **TypeScript Handbook**
   https://www.typescriptlang.org/docs/handbook/2/classes.html

2. **MDN Web Docs - Error**
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

3. **MDN Web Docs - Custom Errors**
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types

4. **Node.js Error Documentation**
   https://nodejs.org/api/errors.html

5. **TC39 Proposal - Error Cause**
   https://tc39.es/proposal-error-cause/

### Community Resources
6. **TypeScript Deep Dive - Error Handling**
   https://basarat.gitbook.io/typescript/type-system/exceptions

7. **StackOverflow - TypeScript Error Extension**
   https://stackoverflow.com/questions/41102060/typescript-extending-error-class

8. **GitHub - TypeScript Best Practices**
   https://github.com/microsoft/TypeScript/wiki/Best-Practices

### Libraries for Reference
9. **ts-custom-error**
   https://github.com/adrai/ts-custom-error

10. **@sapphire/result**
    https://github.com/sapphiredev/framework/tree/main/packages/result

---

## 11. Key Takeaways (Critical Points)

1. **ALWAYS use `Object.setPrototypeOf()`** when extending Error in TypeScript
2. **Set `this.name` explicitly** for proper error identification
3. **Implement `toJSON()`** for structured logging and error transport
4. **Create type guards** for type-safe error handling
5. **Use error codes** for programmatic error handling (not message parsing)
6. **Include context** for debugging but exclude sensitive data
7. **Test prototype chain** to ensure instanceof works correctly
8. **Use `Error.captureStackTrace()`** for cleaner stack traces in Node.js
9. **Sanitize sensitive data** in toJSON() method
10. **Target ES2015+** in tsconfig.json for proper Error inheritance

---

## 12. Reference Implementation in Codebase

**Location:** `/home/dustin/projects/hacky-hack/src/utils/errors.ts`

The codebase contains a production-ready error hierarchy that demonstrates all these best practices:

- Base `PipelineError` abstract class with proper prototype setup
- Specialized error classes (SessionError, TaskError, AgentError, ValidationError)
- Error code constants using `as const` assertion
- Type guard functions for all error types
- Comprehensive `toJSON()` implementation with sensitive data sanitization
- Context interfaces for type-safe debugging information
- JSDoc documentation with usage examples

**This is the reference implementation for all new error classes.**

---

**Document Version:** 1.0
**Last Updated:** 2026-01-27
