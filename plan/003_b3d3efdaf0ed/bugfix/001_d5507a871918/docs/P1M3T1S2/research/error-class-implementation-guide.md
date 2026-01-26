# BugfixSessionValidationError - Implementation Guide

**Purpose:** Quick reference and implementation guide for the custom error class

---

## Quick Reference: Error Class Template

```typescript
/**
 * Error thrown when bugfix session validation fails
 */
export class BugfixSessionValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);

    // CRITICAL: Required for instanceof to work in transpiled code
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);

    // Better stack traces in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BugfixSessionValidationError);
    }

    this.name = 'BugfixSessionValidationError';

    // Chain error stacks
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      cause: this.cause ? { name: this.cause.name, message: this.cause.message } : undefined,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}

// Type guard
export function isBugfixSessionValidationError(error: unknown): error is BugfixSessionValidationError {
  return error instanceof BugfixSessionValidationError;
}
```

---

## Usage Examples

### Basic Usage

```typescript
// Simple validation error
throw new BugfixSessionValidationError(
  'Session file not found',
  'BUGFIX_SESSION_FILE_NOT_FOUND',
  { filePath: '/path/to/session.json' }
);
```

### With Error Cause

```typescript
try {
  JSON.parse(invalidJson);
} catch (parseError) {
  throw new BugfixSessionValidationError(
    'Failed to parse session file',
    'BUGFIX_SESSION_INVALID_JSON',
    { filePath: sessionPath },
    parseError as Error
  );
}
```

### With Type Guard

```typescript
function handleError(error: unknown) {
  if (isBugfixSessionValidationError(error)) {
    // TypeScript knows error is BugfixSessionValidationError
    console.error(`[${error.code}] ${error.message}`);
    console.error('Context:', error.context);

    // Programmatic handling based on error code
    if (error.code === 'BUGFIX_SESSION_FILE_NOT_FOUND') {
      // Handle file not found
    }
  } else {
    // Handle unknown errors
    console.error('Unknown error:', error);
  }
}
```

### With Validation Items

```typescript
interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

interface ExtendedValidationContext extends Record<string, unknown> {
  validationErrors: ValidationErrorItem[];
}

// Usage
const errors: ValidationErrorItem[] = [
  { field: 'sessionId', message: 'Required field missing', value: undefined },
  { field: 'filePath', message: 'Path does not exist', value: '/invalid/path' },
];

throw new BugfixSessionValidationError(
  'Session validation failed with 2 errors',
  'BUGFIX_SESSION_VALIDATION_FAILED',
  {
    validationErrors: errors,
    sessionId: 'test-session',
  }
);
```

---

## Testing Template

```typescript
describe('BugfixSessionValidationError', () => {
  describe('constructor', () => {
    it('should create error with message and code', () => {
      const error = new BugfixSessionValidationError(
        'Test error',
        'TEST_CODE'
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('BugfixSessionValidationError');
    });

    it('should create error with context', () => {
      const context = { filePath: '/test/path', field: 'sessionId' };
      const error = new BugfixSessionValidationError(
        'Test error',
        'TEST_CODE',
        context
      );

      expect(error.context).toEqual(context);
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new BugfixSessionValidationError(
        'Test error',
        'TEST_CODE',
        undefined,
        cause
      );

      expect(error.cause).toBe(cause);
      expect(error.stack).toContain('Caused by:');
    });
  });

  describe('prototype chain', () => {
    it('should be instanceof Error', () => {
      const error = new BugfixSessionValidationError('Test', 'TEST');
      expect(error instanceof Error).toBe(true);
    });

    it('should be instanceof BugfixSessionValidationError', () => {
      const error = new BugfixSessionValidationError('Test', 'TEST');
      expect(error instanceof BugfixSessionValidationError).toBe(true);
    });

    it('should maintain instanceof after throw/catch', () => {
      let caughtError: unknown;

      try {
        throw new BugfixSessionValidationError('Test', 'TEST');
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError instanceof BugfixSessionValidationError).toBe(true);
    });
  });

  describe('toJSON()', () => {
    it('should serialize error to JSON', () => {
      const error = new BugfixSessionValidationError(
        'Test error',
        'TEST_CODE',
        { field: 'test' }
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'BugfixSessionValidationError',
        message: 'Test error',
        code: 'TEST_CODE',
        context: { field: 'test' },
        cause: undefined,
        stack: undefined,
      });
    });

    it('should include stack in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new BugfixSessionValidationError('Test', 'TEST');
      const json = error.toJSON();

      expect(json.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new BugfixSessionValidationError('Test', 'TEST');
      const json = error.toJSON();

      expect(json.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('type guard', () => {
    it('should identify BugfixSessionValidationError', () => {
      const error = new BugfixSessionValidationError('Test', 'TEST');
      expect(isBugfixSessionValidationError(error)).toBe(true);
    });

    it('should reject other errors', () => {
      const error = new Error('Test');
      expect(isBugfixSessionValidationError(error)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const error: unknown = new BugfixSessionValidationError(
        'Test',
        'TEST_CODE'
      );

      if (isBugfixSessionValidationError(error)) {
        // TypeScript knows error is BugfixSessionValidationError
        expect(error.code).toBe('TEST_CODE');
      }
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON string', () => {
      const error = new BugfixSessionValidationError(
        'Test error',
        'TEST_CODE',
        { filePath: '/test' }
      );

      const jsonString = JSON.stringify(error);
      const parsed = JSON.parse(jsonString);

      expect(parsed.name).toBe('BugfixSessionValidationError');
      expect(parsed.code).toBe('TEST_CODE');
    });

    it('should be loggable without throwing', () => {
      const error = new BugfixSessionValidationError('Test', 'TEST');

      expect(() => {
        console.log(error);
        console.log(error.toJSON());
        JSON.stringify(error);
      }).not.toThrow();
    });
  });
});
```

---

## Error Code Naming Convention

Follow this pattern for error codes:

```
[MODULE]_[CATEGORY]_[SPECIFIC_ERROR]
```

Examples:
- `BUGFIX_SESSION_INVALID_PATH` - Module: BUGFIX, Category: SESSION, Error: INVALID_PATH
- `BUGFIX_SESSION_MISSING_FIELD` - Module: BUGFIX, Category: SESSION, Error: MISSING_FIELD
- `BUGFIX_SESSION_VALIDATION_FAILED` - Module: BUGFIX, Category: SESSION, Error: VALIDATION_FAILED

---

## Common Validation Scenarios

### File Not Found

```typescript
if (!fs.existsSync(filePath)) {
  throw new BugfixSessionValidationError(
    `Session file not found: ${filePath}`,
    'BUGFIX_SESSION_FILE_NOT_FOUND',
    { filePath }
  );
}
```

### Invalid JSON

```typescript
try {
  const data = JSON.parse(fileContent);
} catch (parseError) {
  throw new BugfixSessionValidationError(
    'Invalid JSON in session file',
    'BUGFIX_SESSION_INVALID_JSON',
    { filePath },
    parseError as Error
  );
}
```

### Missing Required Field

```typescript
if (!session.sessionId) {
  throw new BugfixSessionValidationError(
    'Required field "sessionId" is missing',
    'BUGFIX_SESSION_MISSING_FIELD',
    { filePath, field: 'sessionId' }
  );
}
```

### Type Mismatch

```typescript
if (typeof session.steps !== 'number') {
  throw new BugfixSessionValidationError(
    `Expected "steps" to be number, got ${typeof session.steps}`,
    'BUGFIX_SESSION_INVALID_TYPE',
    {
      filePath,
      field: 'steps',
      expectedType: 'number',
      actualType: typeof session.steps,
    }
  );
}
```

### Schema Validation

```typescript
const validationErrors: ValidationErrorItem[] = [];

if (!session.sessionId) {
  validationErrors.push({
    field: 'sessionId',
    message: 'Required',
    value: undefined,
  });
}

if (!session.filePath) {
  validationErrors.push({
    field: 'filePath',
    message: 'Required',
    value: undefined,
  });
}

if (validationErrors.length > 0) {
  throw new BugfixSessionValidationError(
    `Session validation failed with ${validationErrors.length} error(s)`,
    'BUGFIX_SESSION_VALIDATION_FAILED',
    {
      filePath,
      validationErrors,
      errorCount: validationErrors.length,
    }
  );
}
```

---

## Integration with Existing Code

### Update validateBugfixSession Function

```typescript
import { BugfixSessionValidationError, isBugfixSessionValidationError } from './errors';

export function validateBugfixSession(session: unknown, filePath: string): BugfixSession {
  // Validate it's an object
  if (typeof session !== 'object' || session === null) {
    throw new BugfixSessionValidationError(
      'Session must be an object',
      'BUGFIX_SESSION_INVALID_TYPE',
      { filePath, receivedType: typeof session }
    );
  }

  const sessionObj = session as Record<string, unknown>;

  // Validate sessionId
  if (!sessionObj.sessionId || typeof sessionObj.sessionId !== 'string') {
    throw new BugfixSessionValidationError(
      'Session must have a valid sessionId',
      'BUGFIX_SESSION_MISSING_FIELD',
      { filePath, field: 'sessionId', value: sessionObj.sessionId }
    );
  }

  // Validate filePath
  if (!sessionObj.filePath || typeof sessionObj.filePath !== 'string') {
    throw new BugfixSessionValidationError(
      'Session must have a valid filePath',
      'BUGFIX_SESSION_MISSING_FIELD',
      { filePath, field: 'filePath', value: sessionObj.filePath }
    );
  }

  // Return typed session
  return sessionObj as BugfixSession;
}
```

### Error Handling in Calling Code

```typescript
try {
  const session = validateBugfixSession(data, filePath);
  // Use session
} catch (error) {
  if (isBugfixSessionValidationError(error)) {
    // Log structured error
    logger.error('Session validation failed', {
      code: error.code,
      message: error.message,
      context: error.context,
    });

    // Return user-friendly error
    return {
      success: false,
      error: error.message,
    };
  }

  // Re-throw unexpected errors
  throw error;
}
```

---

## Checklist for Implementation

- [ ] Extend Error class
- [ ] Add `Object.setPrototypeOf()` in constructor
- [ ] Add `Error.captureStackTrace()` for Node.js
- [ ] Set `this.name` in constructor
- [ ] Implement `toJSON()` method
- [ ] Create type guard function
- [ ] Add error code enum/constants
- [ ] Define context interface
- [ ] Write comprehensive unit tests
- [ ] Test prototype chain (instanceof)
- [ ] Test serialization (toJSON, JSON.stringify)
- [ ] Test error cause chaining
- [ ] Add JSDoc comments
- [ ] Test with actual validation scenarios

---

## Common Pitfalls to Avoid

1. **Forgetting Object.setPrototypeOf()**
   - Symptom: `instanceof` returns false
   - Fix: Always include `Object.setPrototypeOf(this, ClassName.prototype)`

2. **Not setting this.name**
   - Symptom: Error shows as "Error" in logs
   - Fix: Set `this.name = 'YourErrorName'`

3. **Including sensitive data in context**
   - Symptom: Security issue, credentials logged
   - Fix: Sanitize context before including in error

4. **Not testing prototype chain**
   - Symptom: instanceof fails after transpilation
   - Fix: Always test instanceof in unit tests

5. **Not implementing toJSON()**
   - Symptom: Errors don't serialize properly for logging
   - Fix: Implement toJSON() returning plain object

---

**Document Version:** 1.0
**Last Updated:** 2026-01-26
