# TypeScript Error Class Best Practices Research

**Research Date:** 2026-01-26
**Purpose:** Create BugfixSessionValidationError class following industry best practices

---

## 1. TypeScript Error Extension Best Practices

### Proper Prototype Chain Setup

**Critical Pattern: Object.setPrototypeOf()**

TypeScript requires explicit prototype chain setup when extending Error due to how ES5 transpilation works:

```typescript
class BugfixSessionValidationError extends Error {
  constructor(message: string) {
    super(message);
    // CRITICAL: Restore prototype chain
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);

    // Maintain proper stack trace (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BugfixSessionValidationError);
    }

    this.name = 'BugfixSessionValidationError';
  }
}
```

**Why this matters:**
- Without `Object.setPrototypeOf()`, `instanceof` checks fail in transpiled code
- TypeScript's default target (ES5) breaks prototype inheritance for Error
- `Error.captureStackTrace()` provides cleaner stack traces in Node.js

**Source:** [TypeScript Handbook - Exception Handling](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#exceptions)

---

### When to Extend Error vs Custom Base Classes

**Extend Error directly when:**
- Creating a specific error type for a domain (e.g., ValidationError, NetworkError)
- The error will be thrown and caught with try/catch
- You need stack traces and standard error properties

**Create a custom base class when:**
- You have multiple related error types sharing common properties
- You need centralized error handling logic
- You want to add consistent serialization or logging

**Recommended Pattern - Base Application Error:**

```typescript
// Base class for all application errors
abstract class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }
}

// Specific validation error
class BugfixSessionValidationError extends AppError {
  constructor(
    message: string,
    public readonly validationErrors: ValidationError[],
    context?: Record<string, unknown>
  ) {
    super(message, 'BUGFIX_SESSION_VALIDATION_ERROR', context);
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
  }
}
```

---

### Error Code Patterns and Conventions

**Best Practices for Error Codes:**

1. **Use hierarchical naming:** `CATEGORY_SPECIFIC_ERROR`
   - Example: `BUGFIX_SESSION_VALIDATION_ERROR`
   - Example: `BUGFIX_SESSION_FILE_NOT_FOUND`

2. **Include error codes for programmatic handling:**
   ```typescript
   enum BugfixSessionErrorCodes {
     INVALID_SESSION_PATH = 'BUGFIX_SESSION_INVALID_PATH',
     MISSING_REQUIRED_FIELD = 'BUGFIX_SESSION_MISSING_FIELD',
     INVALID_JSON_STRUCTURE = 'BUGFIX_SESSION_INVALID_JSON',
     VALIDATION_FAILED = 'BUGFIX_SESSION_VALIDATION_FAILED',
   }
   ```

3. **Make codes unique across the application:**
   - Prefix with module/context
   - Use uppercase with underscores
   - Map to HTTP status codes when applicable

---

### Context Object Patterns for Debugging

**Include contextual information:**

```typescript
interface ValidationErrorContext {
  filePath?: string;
  sessionId?: string;
  field?: string;
  value?: unknown;
  schema?: Record<string, unknown>;
}

class BugfixSessionValidationError extends Error {
  constructor(
    message: string,
    public readonly context: ValidationErrorContext
  ) {
    super(message);
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
    this.name = 'BugfixSessionValidationError';
  }

  // Provide structured debugging info
  getDebugInfo() {
    return {
      ...this.context,
      errorMessage: this.message,
      stack: this.stack,
    };
  }
}
```

**Context Object Best Practices:**
- Include file paths for debugging (useful for validation errors)
- Include the value that failed validation (be mindful of sensitive data)
- Include schema/rule information that caused validation failure
- Make context properties `readonly` to prevent mutation

---

## 2. Error Class Design Patterns

### Constructor Parameter Patterns

**Recommended Constructor Signature:**

```typescript
class BugfixSessionValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: ValidationErrorContext,
    public readonly cause?: Error
  ) {
    super(message);
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);

    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }

    this.name = 'BugfixSessionValidationError';
  }
}
```

**Parameter Order (convention):**
1. `message: string` - Human-readable error description
2. `code: string` - Machine-readable error identifier
3. `context?: Record<string, unknown>` - Additional debugging context
4. `cause?: Error` - The underlying error that caused this error (Error Cause pattern)

---

### Error Code Property Patterns

**Strongly-typed error codes:**

```typescript
// Define error code types
type BugfixSessionErrorCode =
  | 'INVALID_SESSION_PATH'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_JSON_STRUCTURE'
  | 'VALIDATION_FAILED'
  | 'DUPLICATE_SESSION_ID';

// Use readonly assertion to prevent modification
const BugfixSessionErrorCodes = {
  InvalidSessionPath: 'INVALID_SESSION_PATH' as const,
  MissingRequiredField: 'MISSING_REQUIRED_FIELD' as const,
  InvalidJsonStructure: 'INVALID_JSON_STRUCTURE' as const,
  ValidationFailed: 'VALIDATION_FAILED' as const,
  DuplicateSessionId: 'DUPLICATE_SESSION_ID' as const,
};

// Usage in error class
class BugfixSessionValidationError extends Error {
  constructor(
    message: string,
    public readonly code: BugfixSessionErrorCode
  ) {
    super(message);
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
    this.name = 'BugfixSessionValidationError';
  }
}
```

---

### toJSON() Method Implementation

**Essential for structured logging:**

```typescript
class BugfixSessionValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: ValidationErrorContext,
    public readonly cause?: Error
  ) {
    super(message);
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
    this.name = 'BugfixSessionValidationError';
  }

  toJSON(): {
    name: string;
    message: string;
    code: string;
    context?: ValidationErrorContext;
    cause?: {
      name: string;
      message: string;
    };
    stack?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
          }
        : undefined,
      // Only include stack in development
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}
```

**toJSON() Best Practices:**
- Return a plain object (not the error instance)
- Include all custom properties
- Include cause information (if any)
- Conditionally include stack traces (development only)
- Don't include sensitive data (passwords, tokens, etc.)

---

### Type Guard Functions for Error Type Narrowing

**Create type guards for type-safe error handling:**

```typescript
// Type guard for BugfixSessionValidationError
function isBugfixSessionValidationError(
  error: unknown
): error is BugfixSessionValidationError {
  return (
    error instanceof BugfixSessionValidationError ||
    (error instanceof Error &&
      (error as any).name === 'BugfixSessionValidationError')
  );
}

// More specific type guard for checking error codes
function hasErrorCode(
  error: unknown,
  code: string
): error is BugfixSessionValidationError {
  return isBugfixSessionValidationError(error) && error.code === code;
}

// Usage example
function handleError(error: unknown) {
  if (isBugfixSessionValidationError(error)) {
    console.error(`Validation failed: ${error.message}`);
    console.error(`Context:`, error.context);
    console.error(`Error code:`, error.code);

    if (hasErrorCode(error, 'INVALID_SESSION_PATH')) {
      // TypeScript knows error is BugfixSessionValidationError with specific code
      console.log('Session path is invalid');
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## 3. Validation Error Patterns

### How Validation Errors Should Differ from Other Error Types

**Validation Error Characteristics:**

1. **Multiple validation failures:**
   ```typescript
   interface ValidationErrorItem {
     field: string;
     message: string;
     value?: unknown;
   }

   class BugfixSessionValidationError extends Error {
     constructor(
       message: string,
       public readonly validationErrors: ValidationErrorItem[],
       context?: ValidationErrorContext
     ) {
       super(message);
       Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
       this.name = 'BugfixSessionValidationError';
     }
   }
   ```

2. **Structured error reporting:**
   ```typescript
   const error = new BugfixSessionValidationError(
     'Session validation failed',
     [
       { field: 'sessionId', message: 'Required', value: undefined },
       { field: 'filePath', message: 'Invalid path format', value: '???' },
     ],
     { sessionId: 'test-session' }
   );
   ```

3. **No stack trace needed for validation failures (optional):**
   - Validation failures are expected/normal, not exceptional
   - Consider reducing stack trace noise

---

### Best Practices for Error Messages in Validation Contexts

**Message Guidelines:**

1. **Be specific about what failed:**
   ```typescript
   // Good: Specific
   'Session ID must be a non-empty string'

   // Bad: Generic
   'Validation failed'
   ```

2. **Include the problematic value:**
   ```typescript
   `Expected sessionId to be string, got ${typeof sessionId}`
   ```

3. **Provide actionable guidance:**
   ```typescript
   'Session file must exist at path: /path/to/session. Run init to create.'
   ```

4. **Use consistent message format:**
   ```typescript
   // Format: "What failed + why + how to fix"
   'Bugfix session validation failed: filePath is missing. Provide a valid file path.'
   ```

---

### When to Include vs Exclude Sensitive Data

**Exclude from errors:**
- Passwords, API keys, tokens
- Personal identifiable information (PII)
- Internal business logic details
- Database connection strings
- File contents (only include paths)

**Include in errors:**
- File paths (for debugging)
- Field names that failed validation
- Expected vs actual types
- Valid value ranges
- Schema requirements

**Example - Safe Context:**

```typescript
interface SafeValidationErrorContext {
  // Include
  filePath: string; // Path is ok, not content
  sessionId: string; // Non-sensitive identifier
  fieldName: string; // Which field failed
  expectedType: string; // Type information
  actualType: string; // Type information

  // Exclude
  // apiKey: string; // NO - sensitive
  // fileContents: string; // NO - might be sensitive
  // userToken: string; // NO - sensitive
}
```

---

## 4. Testing Error Classes

### Unit Test Patterns for Custom Error Classes

**Comprehensive test suite:**

```typescript
describe('BugfixSessionValidationError', () => {
  describe('constructor', () => {
    it('should create error with message', () => {
      const error = new BugfixSessionValidationError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('BugfixSessionValidationError');
    });

    it('should create error with code', () => {
      const error = new BugfixSessionValidationError(
        'Test error',
        'VALIDATION_FAILED'
      );
      expect(error.code).toBe('VALIDATION_FAILED');
    });

    it('should create error with context', () => {
      const context = { filePath: '/test/path' };
      const error = new BugfixSessionValidationError(
        'Test error',
        'VALIDATION_FAILED',
        context
      );
      expect(error.context).toEqual(context);
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new BugfixSessionValidationError(
        'Test error',
        'VALIDATION_FAILED',
        undefined,
        cause
      );
      expect(error.cause).toBe(cause);
      expect(error.stack).toContain('Caused by:');
    });
  });

  describe('prototype chain', () => {
    it('should be instanceof Error', () => {
      const error = new BugfixSessionValidationError('Test');
      expect(error instanceof Error).toBe(true);
    });

    it('should be instanceof BugfixSessionValidationError', () => {
      const error = new BugfixSessionValidationError('Test');
      expect(error instanceof BugfixSessionValidationError).toBe(true);
    });

    it('should have correct constructor', () => {
      const error = new BugfixSessionValidationError('Test');
      expect(error.constructor).toBe(BugfixSessionValidationError);
    });
  });

  describe('toJSON()', () => {
    it('should serialize error to JSON', () => {
      const error = new BugfixSessionValidationError(
        'Test error',
        'VALIDATION_FAILED',
        { field: 'test' }
      );
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'BugfixSessionValidationError',
        message: 'Test error',
        code: 'VALIDATION_FAILED',
        context: { field: 'test' },
        cause: undefined,
        stack: undefined,
      });
    });

    it('should include cause in serialization', () => {
      const cause = new Error('Cause error');
      const error = new BugfixSessionValidationError(
        'Test error',
        'VALIDATION_FAILED',
        undefined,
        cause
      );
      const json = error.toJSON();

      expect(json.cause).toEqual({
        name: 'Error',
        message: 'Cause error',
      });
    });

    it('should not include sensitive data', () => {
      const error = new BugfixSessionValidationError(
        'Test error',
        'VALIDATION_FAILED',
        { password: 'secret123' }
      );
      const json = error.toJSON();

      // Ensure context is included but be careful with sensitive data
      expect(json.context?.password).toBe('secret123');
      // In production, you would sanitize this
    });
  });

  describe('type guards', () => {
    it('should identify BugfixSessionValidationError', () => {
      const error = new BugfixSessionValidationError('Test');
      expect(isBugfixSessionValidationError(error)).toBe(true);
    });

    it('should reject other errors', () => {
      const error = new Error('Test');
      expect(isBugfixSessionValidationError(error)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const error: unknown = new BugfixSessionValidationError(
        'Test',
        'VALIDATION_FAILED'
      );

      if (isBugfixSessionValidationError(error)) {
        // TypeScript knows error is BugfixSessionValidationError
        expect(error.code).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('stack trace', () => {
    it('should capture stack trace', () => {
      const error = new BugfixSessionValidationError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('BugfixSessionValidationError');
    });
  });
});
```

---

### How to Test Prototype Chain and instanceof

**Testing prototype chain:**

```typescript
describe('Prototype chain tests', () => {
  it('should maintain prototype chain after throw/catch', () => {
    let caughtError: unknown;

    try {
      throw new BugfixSessionValidationError('Test error');
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError instanceof BugfixSessionValidationError).toBe(true);
    expect(caughtError instanceof Error).toBe(true);
  });

  it('should have correct prototype properties', () => {
    const error = new BugfixSessionValidationError('Test');
    const proto = Object.getPrototypeOf(error);

    expect(proto.constructor).toBe(BugfixSessionValidationError);
    expect(Object.getPrototypeOf(proto)).toBe(Error.prototype);
  });

  it('should work with Object.setPrototypeOf', () => {
    const error = new BugfixSessionValidationError('Test');
    // Verify the prototype is set correctly
    expect(Object.getPrototypeOf(error)).toBe(
      BugfixSessionValidationError.prototype
    );
  });
});
```

---

### Testing Error Serialization

**JSON serialization tests:**

```typescript
describe('Error serialization', () => {
  it('should serialize to JSON', () => {
    const error = new BugfixSessionValidationError(
      'Test error',
      'VALIDATION_FAILED',
      { filePath: '/test/path' }
    );

    const jsonString = JSON.stringify(error);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toEqual({
      name: 'BugfixSessionValidationError',
      message: 'Test error',
      code: 'VALIDATION_FAILED',
      context: { filePath: '/test/path' },
      cause: undefined,
      stack: undefined,
    });
  });

  it('should serialize cause chain', () => {
    const rootCause = new Error('Root cause');
    const intermediateError = new BugfixSessionValidationError(
      'Intermediate',
      'INTERMEDIATE_ERROR',
      undefined,
      rootCause
    );
    const finalError = new BugfixSessionValidationError(
      'Final error',
      'FINAL_ERROR',
      undefined,
      intermediateError
    );

    const json = finalError.toJSON();

    expect(json.cause).toBeDefined();
    expect(json.cause?.name).toBe('BugfixSessionValidationError');
  });

  it('should be loggable', () => {
    const error = new BugfixSessionValidationError(
      'Test error',
      'VALIDATION_FAILED'
    );

    // Ensure error can be logged without throwing
    expect(() => {
      console.log(error);
      console.log(error.toJSON());
      JSON.stringify(error);
    }).not.toThrow();
  });
});
```

---

## 5. Recommended Implementation for BugfixSessionValidationError

Based on research findings, here's the recommended implementation:

```typescript
/**
 * Error codes for bugfix session validation
 */
export enum BugfixSessionErrorCode {
  INVALID_SESSION_PATH = 'BUGFIX_SESSION_INVALID_PATH',
  MISSING_REQUIRED_FIELD = 'BUGFIX_SESSION_MISSING_FIELD',
  INVALID_JSON_STRUCTURE = 'BUGFIX_SESSION_INVALID_JSON',
  VALIDATION_FAILED = 'BUGFIX_SESSION_VALIDATION_FAILED',
  FILE_NOT_FOUND = 'BUGFIX_SESSION_FILE_NOT_FOUND',
  DUPLICATE_SESSION_ID = 'BUGFIX_SESSION_DUPLICATE_SESSION_ID',
}

/**
 * Context information for validation errors
 */
export interface ValidationErrorContext {
  filePath?: string;
  sessionId?: string;
  field?: string;
  value?: unknown;
  schema?: Record<string, unknown>;
}

/**
 * Individual validation error item
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Custom error for bugfix session validation failures
 *
 * @example
 * ```typescript
 * throw new BugfixSessionValidationError(
 *   'Session validation failed',
 *   BugfixSessionErrorCode.VALIDATION_FAILED,
 *   { filePath: '/path/to/session.json' }
 * );
 * ```
 */
export class BugfixSessionValidationError extends Error {
  constructor(
    message: string,
    public readonly code: BugfixSessionErrorCode,
    public readonly context?: ValidationErrorContext,
    public readonly cause?: Error
  ) {
    super(message);

    // CRITICAL: Restore prototype chain for instanceof to work
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);

    // Capture clean stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BugfixSessionValidationError);
    }

    this.name = 'BugfixSessionValidationError';

    // Append cause to stack trace if present
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * Serialize error for logging/transport
   */
  toJSON(): {
    name: string;
    message: string;
    code: BugfixSessionErrorCode;
    context?: ValidationErrorContext;
    cause?: {
      name: string;
      message: string;
    };
    stack?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
          }
        : undefined,
      // Only include stack traces in development
      stack:
        process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}

/**
 * Type guard for BugfixSessionValidationError
 *
 * @example
 * ```typescript
 * try {
 *   validateSession(session);
 * } catch (error) {
 *   if (isBugfixSessionValidationError(error)) {
 *     console.error(`Validation failed: ${error.code}`);
 *   }
 * }
 * ```
 */
export function isBugfixSessionValidationError(
  error: unknown
): error is BugfixSessionValidationError {
  return (
    error instanceof BugfixSessionValidationError ||
    (error instanceof Error &&
      (error as any).name === 'BugfixSessionValidationError')
  );
}

/**
 * Type guard for specific error codes
 *
 * @example
 * ```typescript
 * if (hasBugfixSessionErrorCode(error, BugfixSessionErrorCode.FILE_NOT_FOUND)) {
 *   // Handle file not found specifically
 * }
 * ```
 */
export function hasBugfixSessionErrorCode(
  error: unknown,
  code: BugfixSessionErrorCode
): error is BugfixSessionValidationError {
  return isBugfixSessionValidationError(error) && error.code === code;
}
```

---

## 6. Sources and References

### Official Documentation
1. **TypeScript Handbook - Exception Handling**
   https://www.typescriptlang.org/docs/handbook/2/basic-types.html#exceptions

2. **MDN Web Docs - Error**
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

3. **MDN Web Docs - Custom Errors**
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types

### TypeScript Error Handling Libraries
4. **ts-custom-error**
   https://github.com/adrai/ts-custom-error
   - Popular library for creating custom error classes in TypeScript
   - Handles prototype chain setup automatically

5. **error-factory**
   https://github.com/ziven/error-factory
   - Factory pattern for creating consistent error objects

6. **@sapphire/result**
   https://github.com/sapphiredev/framework/tree/main/packages/result
   - Result type pattern for functional error handling

### Community Resources
7. **StackOverflow - TypeScript Error Extension**
   https://stackoverflow.com/questions/41102060/typescript-extending-error-class

8. **TypeScript Deep Dive - Error Handling**
   https://basarat.gitbook.io/typescript/type-system/exceptions

9. **GitHub - TypeScript Best Practices**
   https://github.com/microsoft/TypeScript/wiki/Best-Practices

### Error Cause Pattern
10. **TC39 Proposal - Error Cause**
    https://tc39.es/proposal-error-cause/
    - Standard proposal for error cause chain
    - Now supported in modern Node.js versions

### Additional Reading
11. **Effective TypeScript - Error Handling**
    https://effectivetypescript.com/2020/09/28/error-handling/

12. **TypeScript Compiler Options - tsconfig.json**
    https://www.typescriptlang.org/tsconfig
    - Ensure target is ES2015+ for proper Error extension

---

## 7. Key Takeaways

1. **ALWAYS use `Object.setPrototypeOf()`** when extending Error in TypeScript
2. **Use `Error.captureStackTrace()`** for cleaner stack traces in Node.js
3. **Implement `toJSON()`** for structured logging and error transport
4. **Create type guards** for type-safe error handling
5. **Use error codes** for programmatic error handling
6. **Include context** for debugging but exclude sensitive data
7. **Test prototype chain** to ensure instanceof works correctly
8. **Consider the Error Cause pattern** for error chaining

---

**Document Version:** 1.0
**Last Updated:** 2026-01-26
