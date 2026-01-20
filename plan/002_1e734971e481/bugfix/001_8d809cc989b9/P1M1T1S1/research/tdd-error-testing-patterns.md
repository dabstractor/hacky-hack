# TDD Patterns for Testing Custom Error Classes in TypeScript/Vitest

## Table of Contents

1. [Red-Green-Refactor Cycle for Error Classes](#red-green-refactor-cycle)
2. [Test Coverage Patterns for Error Classes](#test-coverage-patterns)
3. [Writing Failing Tests That Will Pass](#writing-failing-tests)
4. [Vitest-Specific Error Testing Patterns](#vitest-specific-patterns)
5. [Testing Inheritance Chains and instanceof](#testing-inheritance-chains)
6. [Testing toJSON() Serialization](#testing-tojson-serialization)
7. [Testing Context Sanitization](#testing-context-sanitization)
8. [Testing Error Chaining with cause Property](#testing-error-chaining)
9. [Prototype Chain Validation Tests](#prototype-chain-validation)
10. [Type Guard Function Testing Patterns](#type-guard-testing)
11. [Test Organization Best Practices](#test-organization)
12. [Resources and Documentation](#resources)

---

## Red-Green-Refactor Cycle {#red-green-refactor-cycle}

### Overview

The TDD cycle for error classes follows the same Red-Green-Refactor pattern as any other code:

1. **RED**: Write a failing test that describes the desired error behavior
2. **GREEN**: Write the minimum implementation to make the test pass
3. **REFACTOR**: Improve the implementation while keeping tests passing

### Pattern 1.1: Basic Error Class Structure

#### RED Phase - Write Failing Test

```typescript
// File: errors.test.ts
import { describe, expect, it } from 'vitest';

describe('CustomError - RED phase', () => {
  it('should create error with name, message, and code', () => {
    // This test will FAIL because CustomError doesn't exist yet
    const error = new CustomError('Something went wrong', 'ERR_001');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CustomError');
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe('ERR_001');
  });
});
```

**Expected Failure:**
```
ReferenceError: CustomError is not defined
```

#### GREEN Phase - Minimum Implementation

```typescript
// File: errors.ts
export class CustomError extends Error {
  constructor(
    public message: string,
    public code: string
  ) {
    super(message);
    this.name = 'CustomError';
  }
}
```

**Result:** Test passes

#### REFACTOR Phase - Improve Implementation

```typescript
// File: errors.ts - Refactored with proper prototype chain
export class CustomError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);

    // CRITICAL: Set prototype for instanceof to work correctly
    Object.setPrototypeOf(this, CustomError.prototype);

    // CRITICAL: Capture stack trace (V8/Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    this.name = 'CustomError';
  }
}
```

### Pattern 1.2: Error with Context Object

#### RED Phase

```typescript
describe('CustomError with context - RED phase', () => {
  it('should store and serialize context object', () => {
    const context = { userId: '123', action: 'delete' };
    const error = new CustomError('Delete failed', 'ERR_DELETE', context);

    expect(error.context).toEqual(context);
    expect(error.toJSON()).toMatchObject({
      name: 'CustomError',
      message: 'Delete failed',
      code: 'ERR_DELETE',
      context: { userId: '123', action: 'delete' }
    });
  });
});
```

#### GREEN Phase

```typescript
export class CustomError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
    this.name = 'CustomError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context
    };
  }
}
```

---

## Test Coverage Patterns for Error Classes {#test-coverage-patterns}

### Pattern 2.1: Constructor Coverage Matrix

```typescript
describe('CustomError constructor coverage', () => {
  describe('required parameters', () => {
    it('should accept message only', () => {
      const error = new CustomError('Test error');
      expect(error.message).toBe('Test error');
    });

    it('should accept message and code', () => {
      const error = new CustomError('Test error', 'ERR_001');
      expect(error.code).toBe('ERR_001');
    });
  });

  describe('optional parameters', () => {
    it('should accept message, code, and context', () => {
      const context = { userId: '123' };
      const error = new CustomError('Test error', 'ERR_001', context);
      expect(error.context).toEqual(context);
    });

    it('should handle undefined context', () => {
      const error = new CustomError('Test error', 'ERR_001', undefined);
      expect(error.context).toBeUndefined();
    });

    it('should handle null context', () => {
      const error = new CustomError('Test error', 'ERR_001', null as any);
      // Decide on behavior: should it store null or convert to undefined?
      expect(error.context).toBeNull();
    });
  });

  describe('parameter type validation', () => {
    it('should convert number message to string', () => {
      const error = new CustomError(123 as any, 'ERR_001');
      expect(error.message).toBe('123');
    });

    it('should handle object message', () => {
      const error = new CustomError({ error: 'details' } as any, 'ERR_001');
      expect(error.message).toBe('[object Object]');
    });
  });
});
```

### Pattern 2.2: Prototype Property Coverage

```typescript
describe('CustomError prototype properties', () => {
  let error: CustomError;

  beforeEach(() => {
    error = new CustomError('Test error', 'ERR_001');
  });

  it('should have name property', () => {
    expect(error.name).toBe('CustomError');
    expect(typeof error.name).toBe('string');
  });

  it('should have message property', () => {
    expect(error.message).toBe('Test error');
    expect(typeof error.message).toBe('string');
  });

  it('should have stack property', () => {
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    expect(error.stack).toContain('CustomError');
  });

  it('should have code property', () => {
    expect(error.code).toBe('ERR_001');
    expect(typeof error.code).toBe('string');
  });

  it('should have timestamp if implemented', () => {
    if ('timestamp' in error) {
      expect(error.timestamp).toBeInstanceOf(Date);
    }
  });
});
```

### Pattern 2.3: Method Coverage

```typescript
describe('CustomError methods', () => {
  describe('toJSON()', () => {
    it('should return plain object', () => {
      const error = new CustomError('Test', 'ERR_001');
      const json = error.toJSON();

      expect(json).not.toBeInstanceOf(Error);
      expect(typeof json).toBe('object');
    });

    it('should include all error properties', () => {
      const error = new CustomError('Test', 'ERR_001', { userId: '123' });
      const json = error.toJSON();

      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('code');
      expect(json).toHaveProperty('context');
    });

    it('should be JSON.stringify compatible', () => {
      const error = new CustomError('Test', 'ERR_001');
      expect(() => JSON.stringify(error.toJSON())).not.toThrow();
    });
  });

  describe('instance methods', () => {
    it('should have utility methods if implemented', () => {
      const error = new CustomError('Test', 'ERR_TIMEOUT');

      if (typeof error.isTimeout === 'function') {
        expect(error.isTimeout()).toBe(true);
      }
    });
  });
});
```

---

## Writing Failing Tests That Will Pass {#writing-failing-tests}

### Pattern 3.1: Ensuring Tests Fail Before Implementation

```typescript
describe('TDD: Write failing test first', () => {
  // Step 1: Write test that describes the behavior
  it('should redact sensitive data in context', () => {
    const error = new CustomError('Test', 'ERR_001', {
      apiKey: 'secret-key-123',
      userId: 'user-123'
    });

    const json = error.toJSON();

    // This will FAIL because sanitization isn't implemented yet
    expect(json.context?.apiKey).toBe('[REDACTED]');
    expect(json.context?.userId).toBe('user-123');
  });

  // Run test: FAILS with "Expected 'secret-key-123' to be '[REDACTED]'"

  // Step 2: Implement minimum to pass
  // Add toJSON() method that checks for 'apiKey' key

  // Step 3: Run test: PASSES

  // Step 4: Refactor to support all sensitive keys
});
```

### Pattern 3.2: Test-Driven Error Code Constants

```typescript
// RED: Define test first
describe('ErrorCodes constant', () => {
  it('should have all error codes following naming pattern', () => {
    const pattern = /^MODULE_[A-Z]+_[A-Z_]+$/;

    // This will FAIL if ErrorCodes doesn't exist or has wrong format
    const allCodes = Object.values(ErrorCodes);
    allCodes.forEach(code => {
      expect(code).toMatch(pattern);
    });
  });

  it('should have immutable error codes', () => {
    const code1 = ErrorCodes.MODULE_ERROR_001;
    const code2 = ErrorCodes.MODULE_ERROR_001;

    // Should be the same reference (const assertion)
    expect(code1).toBe(code2);
    expect(typeof code1).toBe('string');
  });
});
```

### Pattern 3.3: Progressive Test Building

```typescript
describe('TDD: Progressive feature building', () => {
  // Test 1: Basic error (passes quickly)
  it('should create basic error', () => {
    const error = new CustomError('Test');
    expect(error.message).toBe('Test');
  });

  // Test 2: Add error code (implement code property)
  it('should have error code', () => {
    const error = new CustomError('Test', 'ERR_001');
    expect(error.code).toBe('ERR_001');
  });

  // Test 3: Add context (implement context property)
  it('should store context', () => {
    const error = new CustomError('Test', 'ERR_001', { userId: '123' });
    expect(error.context).toEqual({ userId: '123' });
  });

  // Test 4: Add serialization (implement toJSON)
  it('should serialize to JSON', () => {
    const error = new CustomError('Test', 'ERR_001');
    const json = error.toJSON();
    expect(json).toMatchObject({
      name: 'CustomError',
      message: 'Test',
      code: 'ERR_001'
    });
  });

  // Test 5: Add sanitization (implement sanitize logic)
  it('should redact sensitive data', () => {
    const error = new CustomError('Test', 'ERR_001', {
      apiKey: 'secret',
      userId: '123'
    });
    const json = error.toJSON();
    expect(json.context?.apiKey).toBe('[REDACTED]');
  });
});
```

---

## Vitest-Specific Error Testing Patterns {#vitest-specific-patterns}

### Pattern 4.1: Using toThrow() Matcher

```typescript
import { describe, expect, it } from 'vitest';

describe('Vitest error throwing patterns', () => {
  it('should throw custom error', () => {
    expect(() => {
      throw new CustomError('Test error', 'ERR_001');
    }).toThrow(CustomError);
  });

  it('should throw error with message', () => {
    expect(() => {
      throw new CustomError('Test error', 'ERR_001');
    }).toThrow('Test error');
  });

  it('should throw error matching regex', () => {
    expect(() => {
      throw new CustomError('Test error: validation failed', 'ERR_001');
    }).toThrow(/validation/);
  });

  it('should throw error with specific code', () => {
    expect(() => {
      throw new CustomError('Test error', 'ERR_001');
    }).toThrow(expect.objectContaining({
      code: 'ERR_001'
    }));
  });

  it('should not throw different error type', () => {
    expect(() => {
      throw new CustomError('Test error', 'ERR_001');
    }).not.toThrow(Error);
  });

  it('should not throw with different message', () => {
    expect(() => {
      throw new CustomError('Test error', 'ERR_001');
    }).not.toThrow('Different message');
  });
});
```

### Pattern 4.2: Async Error Testing

```typescript
describe('Vitest async error patterns', () => {
  it('should reject with custom error', async () => {
    await expect(asyncFunction()).rejects.toThrow(CustomError);
  });

  it('should reject with error message', async () => {
    await expect(asyncFunction()).rejects.toThrow('Connection failed');
  });

  it('should reject with error containing context', async () => {
    await expect(asyncFunction()).rejects.toMatchObject({
      code: 'ERR_CONN_FAILED',
      context: { host: 'localhost' }
    });
  });

  it('should handle error in try-catch', async () => {
    let caughtError: unknown;

    try {
      await asyncFunction();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(CustomError);
    if (caughtError instanceof CustomError) {
      expect(caughtError.code).toBe('ERR_001');
    }
  });
});

async function asyncFunction(): Promise<void> {
  throw new CustomError('Connection failed', 'ERR_CONN_FAILED');
}
```

### Pattern 4.3: Error Snapshot Testing

```typescript
import { describe, expect, it } from 'vitest';

describe('Vitest snapshot patterns', () => {
  it('should snapshot error structure', () => {
    const error = new CustomError('Test error', 'ERR_001', {
      userId: '123',
      timestamp: '2024-01-15T10:00:00Z'
    });

    // Snapshot the toJSON() output
    expect(error.toJSON()).toMatchSnapshot();
  });

  it('should snapshot error with different context', () => {
    const error = new CustomError('Different error', 'ERR_002', {
      userId: '456',
      action: 'delete'
    });

    expect(error.toJSON()).toMatchSnapshot();
  });
});
```

### Pattern 4.4: Each() for Multiple Test Cases

```typescript
describe('Vitest parametrized error tests', () => {
  const testCases = [
    {
      code: 'ERR_001',
      message: 'Error 1',
      expectedType: 'CustomError'
    },
    {
      code: 'ERR_002',
      message: 'Error 2',
      expectedType: 'CustomError'
    },
    {
      code: 'ERR_003',
      message: 'Error 3',
      expectedType: 'CustomError'
    }
  ];

  it.each(testCases)('should create error with code $code', ({ code, message }) => {
    const error = new CustomError(message, code);
    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
  });

  it.each([
    { input: 'apiKey', expected: '[REDACTED]' },
    { input: 'token', expected: '[REDACTED]' },
    { input: 'password', expected: '[REDACTED]' },
    { input: 'userId', expected: 'user-123' }
  ])('should redact $input if sensitive', ({ input, expected }) => {
    const context = { [input]: 'secret-value' };
    if (input === 'userId') {
      context[input] = 'user-123';
    }

    const error = new CustomError('Test', 'ERR_001', context);
    const json = error.toJSON();

    expect(json.context?.[input]).toBe(expected);
  });
});
```

---

## Testing Inheritance Chains and instanceof {#testing-inheritance-chains}

### Pattern 5.1: Basic instanceof Chain Tests

```typescript
describe('Error inheritance chain', () => {
  describe('BaseError', () => {
    it('should be instanceof Error', () => {
      const error = new BaseError('Test');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
    });
  });

  describe('CustomError extends BaseError', () => {
    it('should maintain full inheritance chain', () => {
      const error = new CustomError('Test', 'ERR_001');

      // Check from most specific to most general
      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should not be instanceof unrelated error', () => {
      const error = new CustomError('Test', 'ERR_001');
      expect(error).not.toBeInstanceOf(SyntaxError);
      expect(error).not.toBeInstanceOf(TypeError);
    });
  });

  describe('Deep inheritance chain', () => {
    it('should handle three-level inheritance', () => {
      // Error -> BaseError -> NetworkError -> HttpError
      const error = new HttpError('404 Not Found', 'ERR_HTTP_404');

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
```

### Pattern 5.2: Prototype Chain Validation

```typescript
describe('Prototype chain validation', () => {
  it('should have correct prototype for CustomError', () => {
    const error = new CustomError('Test', 'ERR_001');

    // Direct prototype
    expect(Object.getPrototypeOf(error)).toBe(CustomError.prototype);

    // Prototype chain
    const proto1 = Object.getPrototypeOf(error);
    const proto2 = Object.getPrototypeOf(proto1);
    const proto3 = Object.getPrototypeOf(proto2);

    expect(proto1).toBe(CustomError.prototype);
    expect(proto2).toBe(BaseError.prototype);
    expect(proto3).toBe(Error.prototype);
  });

  it('should have constructor pointing to correct class', () => {
    const error = new CustomError('Test', 'ERR_001');

    expect(error.constructor).toBe(CustomError);
    expect(error.constructor.name).toBe('CustomError');
  });

  it('should preserve prototype after JSON serialization', () => {
    const error = new CustomError('Test', 'ERR_001');
    const json = error.toJSON();

    // JSON should not have prototype
    expect(Object.getPrototypeOf(json)).toBe(Object.prototype);
    expect(json.constructor).toBe(Object);
  });
});
```

### Pattern 5.3: Cross-Platform instanceof Tests

```typescript
describe('Cross-platform inheritance', () => {
  it('should work with instanceof across different contexts', () => {
    const error = new CustomError('Test', 'ERR_001');

    // Direct instanceof
    expect(error instanceof CustomError).toBe(true);

    // Using constructor check
    expect(error.constructor.name).toBe('CustomError');

    // Using name property check (fallback)
    expect(error.name).toBe('CustomError');
  });

  it('should handle errors created across boundaries', () => {
    // Simulate error from different module/context
    function createError(): CustomError {
      return new CustomError('Test', 'ERR_001');
    }

    const error = createError();
    expect(error).toBeInstanceOf(CustomError);
  });
});
```

---

## Testing toJSON() Serialization {#testing-tojson-serialization}

### Pattern 6.1: Basic Serialization Tests

```typescript
describe('toJSON() serialization', () => {
  let error: CustomError;

  beforeEach(() => {
    error = new CustomError('Test error', 'ERR_001', { userId: '123' });
  });

  it('should return plain object', () => {
    const json = error.toJSON();

    expect(json).not.toBeInstanceOf(Error);
    expect(json).not.toBe(error);
    expect(typeof json).toBe('object');
  });

  it('should include name property', () => {
    const json = error.toJSON();
    expect(json.name).toBe('CustomError');
  });

  it('should include message property', () => {
    const json = error.toJSON();
    expect(json.message).toBe('Test error');
  });

  it('should include code property', () => {
    const json = error.toJSON();
    expect(json.code).toBe('ERR_001');
  });

  it('should include context if present', () => {
    const json = error.toJSON();
    expect(json.context).toEqual({ userId: '123' });
  });

  it('should not include context if absent', () => {
    const errorNoContext = new CustomError('Test', 'ERR_001');
    const json = errorNoContext.toJSON();

    expect(json.context).toBeUndefined();
  });

  it('should include stack trace', () => {
    const json = error.toJSON();
    expect(json.stack).toBeDefined();
    expect(typeof json.stack).toBe('string');
  });
});
```

### Pattern 6.2: JSON.stringify() Compatibility

```typescript
describe('JSON.stringify() compatibility', () => {
  it('should serialize without errors', () => {
    const error = new CustomError('Test', 'ERR_001', { userId: '123' });

    expect(() => JSON.stringify(error.toJSON())).not.toThrow();
  });

  it('should deserialize correctly', () => {
    const error = new CustomError('Test', 'ERR_001', { userId: '123' });
    const jsonStr = JSON.stringify(error.toJSON());
    const parsed = JSON.parse(jsonStr);

    expect(parsed.name).toBe('CustomError');
    expect(parsed.message).toBe('Test');
    expect(parsed.code).toBe('ERR_001');
    expect(parsed.context).toEqual({ userId: '123' });
  });

  it('should round-trip complex context', () => {
    const context = {
      userId: '123',
      metadata: { timestamp: Date.now(), tags: ['test', 'error'] },
      nested: { deep: { value: 42 } }
    };

    const error = new CustomError('Test', 'ERR_001', context);
    const jsonStr = JSON.stringify(error.toJSON());
    const parsed = JSON.parse(jsonStr);

    expect(parsed.context).toEqual(context);
  });
});
```

### Pattern 6.3: Timestamp Serialization

```typescript
describe('Timestamp serialization', () => {
  it('should include timestamp in ISO format', () => {
    const before = new Date();
    const error = new TimestampedError('Test', 'ERR_001');
    const after = new Date();

    const json = error.toJSON();

    expect(json.timestamp).toBeDefined();
    expect(typeof json.timestamp).toBe('string');

    // Verify ISO 8601 format
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify timestamp is within expected range
    const timestamp = new Date(json.timestamp);
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should serialize timestamp correctly', () => {
    const error = new TimestampedError('Test', 'ERR_001');
    const jsonStr = JSON.stringify(error.toJSON());
    const parsed = JSON.parse(jsonStr);

    // Should be able to parse back to Date
    const timestamp = new Date(parsed.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.toISOString()).toBe(parsed.timestamp);
  });
});
```

### Pattern 6.4: Circular Reference Handling

```typescript
describe('Circular reference handling', () => {
  it('should handle circular references in context', () => {
    const circular: Record<string, unknown> = { name: 'test' };
    circular.self = circular;

    const error = new CustomError('Test', 'ERR_001', { data: circular });

    expect(() => error.toJSON()).not.toThrow();

    const json = error.toJSON();
    expect(json.context).toBeDefined();
  });

  it('should handle self-referencing error', () => {
    const error = new CustomError('Test', 'ERR_001');
    (error as any).self = error;

    expect(() => error.toJSON()).not.toThrow();
  });
});
```

---

## Testing Context Sanitization {#testing-context-sanitization}

### Pattern 7.1: Sensitive Field Redaction

```typescript
describe('Context sanitization', () => {
  describe('Sensitive field redaction', () => {
    const sensitiveFields = [
      'apiKey',
      'apiSecret',
      'api_key',
      'api_secret',
      'token',
      'accessToken',
      'refreshToken',
      'authToken',
      'password',
      'secret',
      'privateKey'
    ];

    it.each(sensitiveFields)('should redact %s field', (field) => {
      const context = { [field]: 'secret-value-123' };
      const error = new CustomError('Test', 'ERR_001', context);
      const json = error.toJSON();

      expect(json.context?.[field]).toBe('[REDACTED]');
    });

    it('should redact multiple sensitive fields', () => {
      const context = {
        apiKey: 'secret-key',
        token: 'secret-token',
        password: 'secret-password',
        safeField: 'public-value'
      };

      const error = new CustomError('Test', 'ERR_001', context);
      const json = error.toJSON();

      expect(json.context?.apiKey).toBe('[REDACTED]');
      expect(json.context?.token).toBe('[REDACTED]');
      expect(json.context?.password).toBe('[REDACTED]');
      expect(json.context?.safeField).toBe('public-value');
    });
  });

  describe('Case-insensitive matching', () => {
    it.each([
      'APIKEY',
      'ApiSecret',
      'PASSWORD',
      'Token'
    ])('should redact %s case-insensitively', (field) => {
      const context = { [field]: 'secret-value' };
      const error = new CustomError('Test', 'ERR_001', context);
      const json = error.toJSON();

      expect(json.context?.[field]).toBe('[REDACTED]');
    });
  });
});
```

### Pattern 7.2: Nested Error Handling

```typescript
describe('Nested error handling in context', () => {
  it('should serialize nested errors', () => {
    const nestedError = new Error('Original error');
    const context = { originalError: nestedError };

    const error = new CustomError('Wrapper error', 'ERR_001', context);
    const json = error.toJSON();

    expect(json.context?.originalError).toEqual({
      name: 'Error',
      message: 'Original error'
    });
  });

  it('should serialize nested custom errors', () => {
    const nestedError = new CustomError('Nested error', 'ERR_NESTED');
    const context = { cause: nestedError };

    const error = new CustomError('Wrapper error', 'ERR_001', context);
    const json = error.toJSON();

    expect(json.context?.cause).toEqual({
      name: 'CustomError',
      message: 'Nested error',
      code: 'ERR_NESTED'
    });
  });

  it('should handle deeply nested error chains', () => {
    const error3 = new Error('Level 3');
    const error2 = new Error('Level 2', { cause: error3 } as any);
    const error1 = new CustomError('Level 1', 'ERR_001', { cause: error2 });

    const json = error1.toJSON();

    expect(json.context?.cause).toBeDefined();
    expect(typeof json.context?.cause).toBe('object');
  });
});
```

### Pattern 7.3: Non-Serializable Object Handling

```typescript
describe('Non-serializable object handling', () => {
  it('should handle functions in context', () => {
    const fn = () => 'function value';
    const context = { callback: fn };

    const error = new CustomError('Test', 'ERR_001', context);
    const json = error.toJSON();

    expect(json.context?.callback).toBe('[non-serializable]');
  });

  it('should handle class instances', () => {
    class MyClass {
      constructor(public value: string) {}
    }

    const instance = new MyClass('test');
    const context = { data: instance };

    const error = new CustomError('Test', 'ERR_001', context);

    // Should either serialize or mark as non-serializable
    expect(() => error.toJSON()).not.toThrow();
  });

  it('should handle symbols', () => {
    const sym = Symbol('test');
    const context = { [sym]: 'value' };

    const error = new CustomError('Test', 'ERR_001', context);

    expect(() => error.toJSON()).not.toThrow();
  });

  it('should handle undefined values', () => {
    const context = { defined: 'value', undefined: undefined };
    const error = new CustomError('Test', 'ERR_001', context);
    const json = error.toJSON();

    expect(json.context?.defined).toBe('value');
    expect(json.context?.undefined).toBeUndefined();
  });
});
```

---

## Testing Error Chaining with cause Property {#testing-error-chaining}

### Pattern 8.1: Basic cause Property Tests

```typescript
describe('Error chaining with cause property', () => {
  it('should store cause error', () => {
    const cause = new Error('Original error');
    const error = new CustomError('Wrapper error', 'ERR_001', undefined, cause);

    const errorWithCause = error as unknown as { cause?: Error };
    expect(errorWithCause.cause).toBeDefined();
    expect(errorWithCause.cause).toBe(cause);
  });

  it('should preserve cause message', () => {
    const cause = new Error('Database connection failed');
    const error = new CustomError('Query failed', 'ERR_QUERY', undefined, cause);

    const errorWithCause = error as unknown as { cause?: Error };
    expect(errorWithCause.cause?.message).toBe('Database connection failed');
  });

  it('should handle undefined cause', () => {
    const error = new CustomError('Test', 'ERR_001');

    const errorWithCause = error as unknown as { cause?: Error };
    expect(errorWithCause.cause).toBeUndefined();
  });

  it('should handle null cause', () => {
    const error = new CustomError('Test', 'ERR_001', undefined, null as any);

    const errorWithCause = error as unknown as { cause?: Error | null };
    expect(errorWithCause.cause).toBeNull();
  });
});
```

### Pattern 8.2: Chained Custom Errors

```typescript
describe('Chained custom errors', () => {
  it('should chain custom errors', () => {
    const original = new CustomError('Original error', 'ERR_ORIG');
    const wrapper = new CustomError('Wrapper error', 'ERR_WRAP', undefined, original);

    const wrapperWithCause = wrapper as unknown as { cause?: Error };
    expect(wrapperWithCause.cause).toBeInstanceOf(CustomError);
    expect(wrapperWithCause.cause).toBe(original);
  });

  it('should maintain error codes through chain', () => {
    const original = new CustomError('DB error', 'ERR_DB');
    const wrapper = new CustomError('Service error', 'ERR_SERVICE', undefined, original);

    const wrapperWithCause = wrapper as unknown as { cause?: CustomError };
    expect(wrapper.code).toBe('ERR_SERVICE');
    expect(wrapperWithCause.cause?.code).toBe('ERR_DB');
  });

  it('should serialize cause in toJSON()', () => {
    const cause = new Error('Original error');
    const error = new CustomError('Wrapper', 'ERR_001', undefined, cause);
    const json = error.toJSON();

    // Decide: should toJSON() include cause?
    // If yes:
    expect(json.cause).toBeDefined();
    expect(json.cause).toEqual({
      name: 'Error',
      message: 'Original error'
    });
  });
});
```

### Pattern 8.3: Deep Error Chains

```typescript
describe('Deep error chains', () => {
  it('should handle three-level error chain', () => {
    const level1 = new Error('Low-level error');
    const level2 = new CustomError('Mid-level error', 'ERR_MID', undefined, level1);
    const level3 = new CustomError('High-level error', 'ERR_HIGH', undefined, level2);

    const level3WithCause = level3 as unknown as { cause?: CustomError };
    expect(level3WithCause.cause).toBeInstanceOf(CustomError);

    const level2WithCause = level3WithCause.cause as unknown as { cause?: Error };
    expect(level2WithCause.cause).toBeInstanceOf(Error);
  });

  it('should preserve stack traces through chain', () => {
    const level1 = new Error('Level 1');
    const level2 = new CustomError('Level 2', 'ERR_2', undefined, level1);
    const level3 = new CustomError('Level 3', 'ERR_3', undefined, level2);

    expect(level3.stack).toBeDefined();
    expect(level3.stack).toContain('CustomError');

    const level2WithCause = level3 as unknown as { cause?: CustomError };
    expect(level2WithCause.cause?.stack).toBeDefined();
  });
});
```

---

## Prototype Chain Validation Tests {#prototype-chain-validation}

### Pattern 9.1: Complete Prototype Chain Tests

```typescript
describe('Complete prototype chain validation', () => {
  describe('Single inheritance', () => {
    it('should validate CustomError prototype chain', () => {
      const error = new CustomError('Test', 'ERR_001');

      // Level 0: Instance
      expect(error.constructor.name).toBe('CustomError');

      // Level 1: CustomError.prototype
      const proto1 = Object.getPrototypeOf(error);
      expect(proto1).toBe(CustomError.prototype);
      expect(proto1.constructor.name).toBe('CustomError');

      // Level 2: BaseError.prototype
      const proto2 = Object.getPrototypeOf(proto1);
      expect(proto2).toBe(BaseError.prototype);
      expect(proto2.constructor.name).toBe('BaseError');

      // Level 3: Error.prototype
      const proto3 = Object.getPrototypeOf(proto2);
      expect(proto3).toBe(Error.prototype);
      expect(proto3.constructor.name).toBe('Error');

      // Level 4: Object.prototype
      const proto4 = Object.getPrototypeOf(proto3);
      expect(proto4).toBe(Object.prototype);
      expect(proto4.constructor.name).toBe('Object');

      // Level 5: null (end of chain)
      const proto5 = Object.getPrototypeOf(proto4);
      expect(proto5).toBeNull();
    });
  });

  describe('Property inheritance', () => {
    it('should inherit properties from prototype chain', () => {
      const error = new CustomError('Test', 'ERR_001');

      // Own properties
      expect(error.hasOwnProperty('message')).toBe(true);
      expect(error.hasOwnProperty('code')).toBe(true);

      // Inherited from Error.prototype
      expect(error.hasOwnProperty('toString')).toBe(false);
      expect('toString' in error).toBe(true);

      // Inherited from Object.prototype
      expect(error.hasOwnProperty('hasOwnProperty')).toBe(false);
      expect('hasOwnProperty' in error).toBe(true);
    });
  });
});
```

### Pattern 9.2: Method Inheritance Tests

```typescript
describe('Method inheritance validation', () => {
  it('should have toString() from Error.prototype', () => {
    const error = new CustomError('Test', 'ERR_001');

    expect(typeof error.toString).toBe('function');
    expect(error.toString()).toContain('CustomError');
  });

  it('should have own toJSON() method', () => {
    const error = new CustomError('Test', 'ERR_001');

    expect(error.hasOwnProperty('toJSON')).toBe(true);
    expect(typeof error.toJSON).toBe('function');
  });

  it('should not interfere with inherited methods', () => {
    const error = new CustomError('Test', 'ERR_001');

    expect(typeof error.valueOf).toBe('function');
    expect(typeof error.toLocaleString).toBe('function');
  });
});
```

### Pattern 9.3: Prototype Integrity After Operations

```typescript
describe('Prototype integrity', () => {
  it('should maintain prototype after JSON serialization', () => {
    const error = new CustomError('Test', 'ERR_001');
    const json = error.toJSON();

    // Error prototype should be unchanged
    expect(error).toBeInstanceOf(CustomError);
    expect(Object.getPrototypeOf(error)).toBe(CustomError.prototype);

    // JSON should have Object.prototype
    expect(Object.getPrototypeOf(json)).toBe(Object.prototype);
  });

  it('should maintain prototype after object spread', () => {
    const error = new CustomError('Test', 'ERR_001');
    const spread = { ...error };

    // Spread creates plain object
    expect(spread).not.toBeInstanceOf(CustomError);
    expect(Object.getPrototypeOf(spread)).toBe(Object.prototype);

    // Original error unchanged
    expect(error).toBeInstanceOf(CustomError);
  });

  it('should maintain prototype after Object.assign', () => {
    const error = new CustomError('Test', 'ERR_001');
    const assigned = Object.assign({}, error);

    expect(assigned).not.toBeInstanceOf(CustomError);
    expect(error).toBeInstanceOf(CustomError);
  });
});
```

---

## Type Guard Function Testing Patterns {#type-guard-testing}

### Pattern 10.1: Basic Type Guard Tests

```typescript
describe('Type guard functions', () => {
  describe('isCustomError()', () => {
    it('should return true for CustomError instances', () => {
      const error = new CustomError('Test', 'ERR_001');
      expect(isCustomError(error)).toBe(true);
    });

    it('should return true for subclasses', () => {
      class SubCustomError extends CustomError {
        constructor(message: string) {
          super(message, 'ERR_SUB');
        }
      }

      const error = new SubCustomError('Test');
      expect(isCustomError(error)).toBe(true);
    });

    it('should return false for plain Error', () => {
      const error = new Error('Test');
      expect(isCustomError(error)).toBe(false);
    });

    it('should return false for other error types', () => {
      expect(isCustomError(new TypeError('Test'))).toBe(false);
      expect(isCustomError(new SyntaxError('Test'))).toBe(false);
      expect(isCustomError(new RangeError('Test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isCustomError(null)).toBe(false);
      expect(isCustomError(undefined)).toBe(false);
      expect(isCustomError('string')).toBe(false);
      expect(isCustomError(123)).toBe(false);
      expect(isCustomError({})).toBe(false);
      expect(isCustomError([])).toBe(false);
      expect(isCustomError(true)).toBe(false);
    });

    it('should return false for objects with error-like properties', () => {
      const errorLike = {
        name: 'CustomError',
        message: 'Test',
        code: 'ERR_001'
      };

      expect(isCustomError(errorLike)).toBe(false);
    });
  });
});
```

### Pattern 10.2: Type Narrowing Validation

```typescript
describe('Type narrowing validation', () => {
  it('should narrow type in if statement', () => {
    const error: unknown = new CustomError('Test', 'ERR_001');

    if (isCustomError(error)) {
      // TypeScript should narrow type to CustomError
      expect(error.code).toBe('ERR_001');
      expect(error.message).toBe('Test');
      expect(error.toJSON).toBeDefined();
    } else {
      // This should not execute
      expect(true).toBe(false);
    }
  });

  it('should narrow type in else branch', () => {
    const error: unknown = new Error('Test');

    if (isCustomError(error)) {
      // Should not execute
      expect(true).toBe(false);
    } else {
      // Type is unknown, can't access CustomError properties
      expect(error).not.toBeInstanceOf(CustomError);
    }
  });

  it('should narrow type in array filter', () => {
    const errors: unknown[] = [
      new CustomError('Test 1', 'ERR_001'),
      new Error('Test 2'),
      new CustomError('Test 3', 'ERR_003'),
      'string error',
      new TypeError('Test 4')
    ];

    const customErrors = errors.filter(isCustomError);

    expect(customErrors).toHaveLength(2);
    customErrors.forEach(error => {
      // Type is narrowed to CustomError
      expect(error.code).toMatch(/^ERR_\d+$/);
    });
  });

  it('should narrow type in array find', () => {
    const errors: unknown[] = [
      new Error('Test'),
      new CustomError('Found', 'ERR_FOUND'),
      new TypeError('Test')
    ];

    const found = errors.find(isCustomError);

    if (found) {
      // Type is narrowed to CustomError
      expect(found.message).toBe('Found');
      expect(found.code).toBe('ERR_FOUND');
    }
  });
});
```

### Pattern 10.3: Switch-Style Error Handling

```typescript
describe('Switch-style error handling', () => {
  it('should handle multiple error types with type guards', () => {
    const errors: unknown[] = [
      new CustomError('Custom', 'ERR_001'),
      new Error('Plain'),
      new TypeError('Type'),
      new SyntaxError('Syntax'),
      null,
      undefined
    ];

    let customCount = 0;
    let plainCount = 0;
    let otherCount = 0;

    for (const error of errors) {
      if (isCustomError(error)) {
        customCount++;
        // Type narrowed: can access error.code
        expect(error.code).toMatch(/^ERR_/);
      } else if (error instanceof Error) {
        plainCount++;
        // Type narrowed: can access error.message
        expect(error.message).toBeDefined();
      } else {
        otherCount++;
      }
    }

    expect(customCount).toBe(1);
    expect(plainCount).toBe(3);
    expect(otherCount).toBe(2);
  });

  it('should support early return pattern', () => {
    function handleError(error: unknown): string {
      if (isCustomError(error)) {
        return `Custom: ${error.code} - ${error.message}`;
      }

      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }

      return 'Unknown error';
    }

    expect(handleError(new CustomError('Test', 'ERR_001'))).toBe('Custom: ERR_001 - Test');
    expect(handleError(new Error('Test'))).toBe('Error: Test');
    expect(handleError('string')).toBe('Unknown error');
  });
});
```

### Pattern 10.4: Type Guard with Property Checks

```typescript
describe('Type guards with property validation', () => {
  it('should check for specific error codes', () => {
    function isTimeoutError(error: unknown): error is CustomError {
      return isCustomError(error) && error.code === 'ERR_TIMEOUT';
    }

    const timeoutError = new CustomError('Timeout', 'ERR_TIMEOUT');
    const otherError = new CustomError('Other', 'ERR_OTHER');

    expect(isTimeoutError(timeoutError)).toBe(true);
    expect(isTimeoutError(otherError)).toBe(false);
    expect(isTimeoutError(new Error('Test'))).toBe(false);
  });

  it('should check for context properties', () => {
    function hasContext(
      error: unknown
    ): error is CustomError & { context: Record<string, unknown> } {
      return isCustomError(error) && error.context !== undefined;
    }

    const withContext = new CustomError('Test', 'ERR_001', { userId: '123' });
    const withoutContext = new CustomError('Test', 'ERR_001');

    expect(hasContext(withContext)).toBe(true);
    expect(hasContext(withoutContext)).toBe(false);
  });

  it('should combine multiple type guards', () => {
    function isCustomErrorWithCode(code: string) {
      return (error: unknown): error is CustomError => {
        return isCustomError(error) && error.code === code;
      };
    }

    const isTimeoutError = isCustomErrorWithCode('ERR_TIMEOUT');
    const isNetworkError = isCustomErrorWithCode('ERR_NETWORK');

    const timeoutError = new CustomError('Timeout', 'ERR_TIMEOUT');
    const networkError = new CustomError('Network', 'ERR_NETWORK');

    expect(isTimeoutError(timeoutError)).toBe(true);
    expect(isTimeoutError(networkError)).toBe(false);
    expect(isNetworkError(networkError)).toBe(true);
    expect(isNetworkError(timeoutError)).toBe(false);
  });
});
```

---

## Test Organization Best Practices {#test-organization}

### Pattern 11.1: Test File Structure

```typescript
/**
 * Recommended test file structure for error classes
 *
 * errors.test.ts
 * ├── Setup (beforeAll, beforeEach)
 * ├── ErrorCodes tests
 * ├── Interface tests (PipelineErrorContext)
 * ├── Base class tests (PipelineError)
 * ├── Subclass tests (SessionError, TaskError, etc.)
 * ├── Prototype chain tests
 * ├── Type guard tests
 * ├── Serialization tests (toJSON)
 * ├── Sanitization tests
 * ├── Error chaining tests
 * └── Integration scenarios
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { CustomError, BaseError, isCustomError } from '../errors.js';

describe('Error hierarchy', () => {
  // Use nested describe blocks for logical grouping
  describe('ErrorCodes', () => { /* ... */ });
  describe('Interfaces', () => { /* ... */ });
  describe('BaseError', () => { /* ... */ });
  describe('CustomError', () => { /* ... */ });
});
```

### Pattern 11.2: Test Naming Conventions

```typescript
describe('Test naming conventions', () => {
  // Good: Clear, descriptive test names
  it('should create error with message and code', () => {
    // Test implementation
  });

  it('should redact apiKey field in context', () => {
    // Test implementation
  });

  it('should maintain prototype chain through inheritance', () => {
    // Test implementation
  });

  // Avoid: Vague or incomplete names
  it('works', () => { /* Bad: too vague */ });
  it('test error', () => { /* Bad: doesn't say what it tests */ });
  it('should error', () => { /* Bad: incomplete thought */ });
});
```

### Pattern 11.3: Setup and Teardown

```typescript
describe('Setup and teardown patterns', () => {
  // Use beforeEach for test isolation
  beforeEach(() => {
    // Reset state, clear mocks, etc.
    vi.clearAllMocks();
  });

  // Use beforeAll for expensive one-time setup
  beforeAll(() => {
    // Load test data, connect to test database, etc.
  });

  // Use afterEach for cleanup
  afterEach(() => {
    // Clean up resources, close connections, etc.
  });

  // Use afterAll for final cleanup
  afterAll(() => {
    // Disconnect from database, clean temp files, etc.
  });
});
```

### Pattern 11.4: Test Independence

```typescript
describe('Test independence', () => {
  // Good: Each test is independent
  it('should create error with message', () => {
    const error = new CustomError('Test');
    expect(error.message).toBe('Test');
  });

  it('should create error with code', () => {
    const error = new CustomError('Test', 'ERR_001');
    expect(error.code).toBe('ERR_001');
  });

  // Bad: Tests depend on execution order
  let error: CustomError;

  it('creates error', () => {
    error = new CustomError('Test', 'ERR_001');
  });

  it('uses error from previous test', () => {
    // This test depends on previous test running first
    expect(error.code).toBe('ERR_001');
  });
});
```

### Pattern 11.5: Fixture Helper Functions

```typescript
describe('Fixture helper functions', () => {
  // Create reusable test fixtures
  function createError(overrides?: Partial<{
    message: string;
    code: string;
    context: Record<string, unknown>;
  }>): CustomError {
    const defaults = {
      message: 'Test error',
      code: 'ERR_001'
    };

    const { message, code, context } = { ...defaults, ...overrides };

    return new CustomError(message, code, context);
  }

  it('should use default values', () => {
    const error = createError();
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('ERR_001');
  });

  it('should override message', () => {
    const error = createError({ message: 'Custom message' });
    expect(error.message).toBe('Custom message');
  });

  it('should override multiple properties', () => {
    const error = createError({
      message: 'Custom',
      code: 'ERR_CUSTOM',
      context: { userId: '123' }
    });

    expect(error.message).toBe('Custom');
    expect(error.code).toBe('ERR_CUSTOM');
    expect(error.context).toEqual({ userId: '123' });
  });
});
```

---

## Resources and Documentation {#resources}

### Vitest Documentation

- [Vitest Official Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Vitest Expect API](https://vitest.dev/api/expect.html)
- [Vitest Configuration](https://vitest.dev/config/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)

### TypeScript Error Handling

- [TypeScript Handbook - Error Handling](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript Error Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [Error.prototype.stack](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack)

### TDD Resources

- [Test-Driven Development Wikipedia](https://en.wikipedia.org/wiki/Test-driven_development)
- [Red-Green-Refactor Cycle](https://martinfowler.com/bliki/TestDrivenRefactoring.html)
- [TDD Best Practices](https://martinfowler.com/bliki/TestDriven.html)

### Error Class Design Patterns

- [JavaScript Error Patterns](https://www.joyent.com/node-js/production/design/errors)
- [Error Handling in Node.js](https://nodejs.org/api/errors.html)
- [Custom Error Classes in TypeScript](https://dev.to/bearer/javascript-custom-errors-and-how-to-catch-them-2o2h)

### Related Testing Patterns

- [Testing Async Code in Vitest](https://vitest.dev/guide/testing-async.html)
- [Mocking in Vitest](https://vitest.dev/api/vi.html)
- [Test Coverage in Vitest](https://vitest.dev/guide/coverage.html)

### Project-Specific Resources

Based on the existing codebase at `/home/dustin/projects/hacky-hack`:

- **Error Implementation**: `/home/dustin/projects/hacky-hack/src/utils/errors.ts`
- **Unit Tests**: `/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts`
- **Integration Tests**: `/home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts`
- **Vitest Config**: `/home/dustin/projects/hacky-hack/vitest.config.ts`

### Key Patterns from Existing Codebase

1. **Abstract Base Class Pattern**: `PipelineError` as abstract base with `abstract readonly code`
2. **Const Assertion for Error Codes**: `as const` for type-safe error codes
3. **Context Sanitization**: Private `sanitizeContext()` method for sensitive data redaction
4. **Type Guard Functions**: `isPipelineError()`, `isSessionError()`, etc. for type narrowing
5. **toJSON() Serialization**: Structured logging compatibility with pino
6. **Prototype Chain Setup**: Explicit `Object.setPrototypeOf()` calls
7. **Stack Trace Capture**: `Error.captureStackTrace()` for V8/Node.js
8. **Error Chaining**: Support for `cause` property (ES2022+)

---

## Quick Reference: TDD Checklist for Error Classes

### Phase 1: RED (Write Failing Tests)

- [ ] Test constructor with all parameter combinations
- [ ] Test instanceof checks for inheritance chain
- [ ] Test prototype chain integrity
- [ ] Test toJSON() serialization
- [ ] Test context sanitization
- [ ] Test error chaining with cause
- [ ] Test type guard functions
- [ ] Test edge cases (null, undefined, circular references)

### Phase 2: GREEN (Make Tests Pass)

- [ ] Implement basic error class structure
- [ ] Set up prototype chain correctly
- [ ] Implement constructor with parameter handling
- [ ] Implement toJSON() method
- [ ] Implement context sanitization
- [ ] Implement cause property support
- [ ] Implement type guard functions

### Phase 3: REFACTOR (Improve Implementation)

- [ ] Extract common patterns to base class
- [ ] Optimize sanitization logic
- [ ] Improve error messages
- [ ] Add convenience methods
- [ ] Ensure cross-platform compatibility
- [ ] Add JSDoc documentation
- [ ] Verify all tests still pass

### Coverage Requirements

- [ ] 100% statement coverage
- [ ] 100% branch coverage
- [ ] 100% function coverage
- [ ] 100% line coverage

---

## Conclusion

This document provides comprehensive TDD patterns for testing custom error classes in TypeScript with Vitest. The patterns are organized from basic to advanced, with specific examples for each testing scenario.

The key principles for effective error class testing are:

1. **Follow TDD rigorously**: Write failing tests first, implement to pass, then refactor
2. **Test all aspects**: Constructor, prototype, serialization, sanitization, chaining
3. **Use Vitest features**: toThrow(), rejects.toThrow(), each(), snapshots
4. **Ensure type safety**: Type guards, type narrowing, instanceof checks
5. **Handle edge cases**: Circular references, non-serializable objects, null/undefined
6. **Maintain coverage**: 100% coverage for all error class code

Use these patterns as a reference when implementing or testing error classes in your project.
