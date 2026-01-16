# TDD and TypeScript Testing Best Practices Research

**Research Date:** 2025-01-16
**Project:** hacky-hack PRP Development Pipeline
**Purpose:** Guide TDD implementation for isFatalError type guard function

---

## Executive Summary

This document compiles best practices for Test-Driven Development (TDD) and TypeScript testing, specifically tailored for implementing type guard functions with comprehensive coverage. Research is based on established testing methodologies, industry best practices, and the existing excellent test suite in the hacky-hack project.

---

## Table of Contents

1. [TDD Red-Green-Refactor Methodology](#1-tdd-red-green-refactor-methodology)
2. [TypeScript Type Guard Testing](#2-typescript-type-guard-testing)
3. [Vitest Testing Best Practices](#3-vitest-testing-best-practices)
4. [Error Handling Test Patterns](#4-error-handling-test-patterns)
5. [Test Coverage Best Practices](#5-test-coverage-best-practices)
6. [Project-Specific Patterns](#6-project-specific-patterns)
7. [Reference Implementation](#7-reference-implementation)

---

## 1. TDD Red-Green-Refactor Methodology

### 1.1 Overview

The TDD cycle consists of three phases:

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────┐        │
│  │   RED   │───▶│  GREEN  │───▶│    REFACTOR     │        │
│  │         │    │         │    │                 │        │
│  │ Write   │    │ Make    │    │ Clean up       │        │
│  │ failing │    │ tests   │    │ while keeping  │        │
│  │ test    │    │ pass    │    │ tests passing  │        │
│  └─────────┘    └─────────┘    └─────────────────┘        │
│       │                              │                     │
│       └──────────────────────────────┘                     │
│                  Repeat                                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Red Phase: Writing Failing Tests

**Best Practices:**

1. **Write the Test Before Implementation**
   - Tests MUST fail before writing production code
   - Verify test fails for the right reason (not compilation/syntax errors)
   - Test should fail with a clear, descriptive error message

2. **Characteristics of Good Failing Tests**

   ```typescript
   // ❌ BAD: Test implementation doesn't exist yet
   it('should work', () => {
     expect(true).toBe(true); // Always passes, no value
   });

   // ✅ GOOD: Clear failure, tests specific behavior
   it('should return true for FatalError instances', () => {
     const error = new FatalError('Test error');
     expect(isFatalError(error)).toBe(true); // Will fail until implemented
   });
   ```

3. **Test One Behavior at a Time**
   - Each test should validate a single behavior
   - Use descriptive test names that specify the expected outcome
   - Follow the Arrange-Act-Assert (AAA) or Setup-Execute-Verify pattern

   ```typescript
   // Following your project's SEV pattern (Setup/Execute/Verify)
   it('should identify FatalError by error code', () => {
     // SETUP: Create FatalError instance
     const error = new FatalError('Critical failure');

     // EXECUTE: Run type guard
     const result = isFatalError(error);

     // VERIFY: Check result
     expect(result).toBe(true);
   });
   ```

4. **Test Categories to Write in Red Phase**

   Based on your existing test patterns (`tests/unit/utils/errors-environment.test.ts`):

   - **Constructor tests**: Message, context, cause handling
   - **Property tests**: Error code, name, timestamp, stack trace
   - **Prototype chain tests**: instanceof checks
   - **Serialization tests**: toJSON() output
   - **Type guard tests**: Type narrowing behavior
   - **Edge cases**: Empty/undefined/null inputs
   - **Integration scenarios**: Real-world usage patterns

### 1.3 Green Phase: Making Tests Pass

**Best Practices:**

1. **Write Minimum Viable Code**
   - Implement only what's needed to make the test pass
   - Hard-coded values are acceptable initially
   - Focus on correctness over optimization

   ```typescript
   // Minimum implementation to pass test
   export function isFatalError(error: unknown): error is FatalError {
     return error instanceof FatalError;
   }
   ```

2. **Run Tests Frequently**
   - Run tests after each small change
   - Use watch mode: `npm run test:watch`
   - Ensure all tests pass, not just the new one

3. **No Refactoring in Green Phase**
   - Resist the urge to clean up code
   - Focus solely on making the test pass
   - Keep changes minimal and targeted

### 1.4 Refactor Phase: Cleaning Up

**Best Practices:**

1. **Refactor Only When Tests Pass**
   - Never refactor without test coverage
   - Run tests after each refactoring step
   - Ensure behavior remains unchanged

2. **Refactoring Targets**
   - Remove code duplication
   - Improve readability
   - Optimize performance (without changing behavior)
   - Apply design patterns where appropriate

3. **Red-Green-Refactor Example**

   ```typescript
   // RED: Write failing test
   it('should return false for non-FatalError errors', () => {
     const error = new Error('Plain error');
     expect(isFatalError(error)).toBe(false); // Fails
   });

   // GREEN: Minimal implementation
   export function isFatalError(error: unknown): error is FatalError {
     if (error instanceof FatalError) return true;
     return false; // Passes the test
   }

   // REFACTOR: Simplify
   export function isFatalError(error: unknown): error is FatalError {
     return error instanceof FatalError; // Cleaner, same behavior
   }
   ```

---

## 2. TypeScript Type Guard Testing

### 2.1 Type Guard Fundamentals

**What is a Type Guard?**

A type guard is a function that performs a runtime check and narrows the type of a value within a conditional block.

```typescript
// Type guard signature
function isType(value: unknown): value is SpecificType {
  // Runtime check
  return value instanceof SpecificType;
}
```

### 2.2 Testing Type Guard Behavior

**Essential Test Categories:**

1. **Positive Cases** (should return `true`)

   ```typescript
   describe('isFatalError type guard', () => {
     it('should return true for FatalError instances', () => {
       const error = new FatalError('Test error');
       expect(isFatalError(error)).toBe(true);
     });

     it('should work with subclass instances', () => {
       class CustomFatalError extends FatalError {}
       const error = new CustomFatalError('Custom error');
       expect(isFatalError(error)).toBe(true);
     });
   });
   ```

2. **Negative Cases** (should return `false`)

   ```typescript
   it('should return false for other PipelineError types', () => {
     const error = new SessionError('Session error');
     expect(isFatalError(error)).toBe(false);
   });

   it('should return false for plain Error instances', () => {
     const error = new Error('Plain error');
     expect(isFatalError(error)).toBe(false);
   });

   it('should return false for non-Error values', () => {
     expect(isFatalError(null)).toBe(false);
     expect(isFatalError(undefined)).toBe(false);
     expect(isFatalError('string')).toBe(false);
     expect(isFatalError(123)).toBe(false);
     expect(isFatalError({})).toBe(false);
     expect(isFatalError([])).toBe(false);
   });
   ```

3. **Type Narrowing Validation**

   ```typescript
   it('should narrow type in conditional block', () => {
     const error: unknown = new FatalError('Test error');

     if (isFatalError(error)) {
       // TypeScript should narrow error to FatalError
       expect(error.code).toBeDefined();
       expect(error.message).toBe('Test error');
       // Accessing FatalError-specific properties should not cause TS errors
     }
   });

   it('should narrow type in catch block', () => {
     try {
       throw new FatalError('Fatal error occurred');
     } catch (error) {
       if (isFatalError(error)) {
         // error is narrowed to FatalError
         expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
         expect(error.isFatal).toBe(true);
       }
     }
   });
   ```

4. **Switch-Style Error Handling**

   ```typescript
   it('should work in switch-style error handling', () => {
     const errors: unknown[] = [
       new FatalError('Fatal error'),
       new SessionError('Session error'),
       new Error('Plain error'),
       null,
       undefined,
     ];

     let fatalCount = 0;
     let sessionCount = 0;
     let otherCount = 0;

     for (const error of errors) {
       if (isFatalError(error)) {
         fatalCount++;
         // error is narrowed to FatalError here
       } else if (isSessionError(error)) {
         sessionCount++;
         // error is narrowed to SessionError here
       } else {
         otherCount++;
       }
     }

     expect(fatalCount).toBe(1);
     expect(sessionCount).toBe(1);
     expect(otherCount).toBe(3);
   });
   ```

### 2.3 Type Guard Testing Checklist

Based on your existing `tests/unit/utils/errors-environment.test.ts` patterns:

- [ ] Return `true` for target type instances
- [ ] Return `false` for sibling error types
- [ ] Return `false` for parent error types
- [ ] Return `false` for plain `Error` instances
- [ ] Return `false` for primitive values (`null`, `undefined`, strings, numbers)
- [ ] Return `false` for objects and arrays
- [ ] Narrow type correctly in `if` statements
- [ ] Narrow type correctly in `catch` blocks
- [ ] Work with `switch`/`for` patterns
- [ ] Maintain type safety (no `as` casts needed after guard)

### 2.4 Advanced Type Guard Patterns

**Guard with Property Checking:**

```typescript
// If FatalError has unique properties
function isFatalError(error: unknown): error is FatalError {
  return (
    error instanceof FatalError ||
    (error instanceof PipelineError && error.code === 'PIPELINE_EXECUTION_FATAL_ERROR')
  );
}
```

**Testing Property-Based Guard:**

```typescript
it('should identify FatalError by unique properties', () => {
  const error = new FatalError('Test');
  expect(isFatalError(error)).toBe(true);
  expect(error.isFatal).toBe(true); // Unique property
});
```

---

## 3. Vitest Testing Best Practices

### 3.1 Project Configuration

Your project uses an excellent Vitest setup (`vitest.config.ts`):

```typescript
{
  environment: 'node',
  globals: true,
  include: ['tests/**/*.{test,spec}.ts'],
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
}
```

**Key Points:**
- 100% coverage threshold enforced
- V8 provider for fast coverage
- Node environment for backend testing
- Global test functions available (no imports needed)

### 3.2 Test File Organization

**Pattern from your project:**

```
tests/
├── unit/
│   ├── utils/
│   │   └── errors-environment.test.ts
│   └── core/
│       └── models.test.ts
├── integration/
│   └── utils/
│       └── error-handling.test.ts
└── setup.ts
```

**Best Practices:**
- Mirror source directory structure
- Use `.test.ts` suffix (consistent with your project)
- Co-locate tests with source (optional)
- Separate unit, integration, and e2e tests

### 3.3 Test Structure Patterns

**1. Describe-It Pattern (Used in Your Project)**

```typescript
describe('isFatalError type guard', () => {
  describe('positive cases', () => {
    it('should return true for FatalError', () => {
      // Test implementation
    });
  });

  describe('negative cases', () => {
    it('should return false for other errors', () => {
      // Test implementation
    });
  });
});
```

**2. Setup-Execute-Verify (SEV) Pattern**

Used consistently in your tests:

```typescript
it('should validate error code', () => {
  // SETUP: Create test data
  const error = new FatalError('Test error');

  // EXECUTE: Run function under test
  const result = isFatalError(error);

  // VERIFY: Check expectations
  expect(result).toBe(true);
});
```

**3. Given-When-Then Pattern**

Alternative to SEV:

```typescript
it('should validate error code', () => {
  // GIVEN: A FatalError instance
  const error = new FatalError('Test error');

  // WHEN: Checking if it's a fatal error
  const result = isFatalError(error);

  // THEN: Should return true
  expect(result).toBe(true);
});
```

### 3.4 Vitest Matcher Best Practices

**Common Matchers:**

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality

// Truthiness
expect(value).toBeTruthy();             // Boolean cast true
expect(value).toBeFalsy();              // Boolean cast false
expect(value).toBeDefined();            // Not undefined
expect(value).toBeUndefined();          // Undefined
expect(value).toBeNull();               // Null

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThanOrEqual(10);

// Strings
expect(str).toContain('substring');
expect(str).toMatch(/regex/);

// Arrays
expect(arr).toHaveLength(3);
expect(arr).toContain(item);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Errors
expect(fn).toThrow();
expect(fn).toThrow(Error);
expect(fn).toThrow('message');
expect(fn).toThrow(/regex/);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### 3.5 Mocking and Spying

**From your `tests/unit/core/session-utils.test.ts`:**

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

// Mock entire module
vi.mock('node:crypto', () => ({
  createHash: vi.fn(),
  randomBytes: vi.fn(),
}));

// Setup and teardown
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

// Use mocked functions
const mockCreateHash = createHash as any;
mockCreateHash.mockReturnValue(hashInstance);
```

**Best Practices:**
- Mock external dependencies (filesystem, network, crypto)
- Clear mocks before each test
- Reset mocks after each test
- Type mock assertions properly

### 3.6 Async Testing Patterns

**From your existing tests:**

```typescript
// Async/await pattern
it('should async compute hash', async () => {
  const hash = await hashPRD('/test/path');
  expect(hash).toBe('expected-hash');
});

// Promise rejection
it('should throw on file error', async () => {
  await expect(hashPRD('/invalid/path')).rejects.toThrow(SessionFileError);
});

// Try-catch with type guard
it('should handle async errors', async () => {
  try {
    await hashPRD('/invalid/path');
    expect.fail('Should have thrown');
  } catch (error) {
    if (isSessionError(error)) {
      expect(error.code).toBe('PIPELINE_SESSION_LOAD_FAILED');
    }
  }
});
```

---

## 4. Error Handling Test Patterns

### 4.1 Error Construction Testing

**From your `tests/unit/utils/errors-environment.test.ts`:**

```typescript
describe('EnvironmentError class', () => {
  describe('constructor', () => {
    it('should create error with message only', () => {
      const error = new EnvironmentError('Test error');
      expect(error.message).toBe('Test error');
      expect(error instanceof EnvironmentError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with context', () => {
      const context = { variable: 'API_KEY', environment: 'production' };
      const error = new EnvironmentError('Test error', context);
      expect(error.context).toEqual(context);
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new EnvironmentError('Test error', {}, cause);
      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBe(cause);
    });

    it('should create error with all parameters', () => {
      const context = { variable: 'DATABASE_URL' };
      const cause = new Error('Connection failed');
      const error = new EnvironmentError('Test error', context, cause);

      expect(error.message).toBe('Test error');
      expect(error.context).toEqual(context);
      expect((error as unknown as { cause?: Error }).cause).toBe(cause);
    });
  });
});
```

### 4.2 Error Property Testing

```typescript
describe('EnvironmentError error properties', () => {
  it('should have correct error code', () => {
    const error = new EnvironmentError('Test error');
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
```

### 4.3 Prototype Chain Testing

```typescript
describe('EnvironmentError prototype chain', () => {
  it('should have correct prototype chain', () => {
    const error = new EnvironmentError('Test error');

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
```

### 4.4 Serialization Testing

```typescript
describe('EnvironmentError toJSON() serialization', () => {
  it('should serialize error to plain object', () => {
    const error = new EnvironmentError('Test error');
    const json = error.toJSON();

    expect(json).toBeDefined();
    expect(typeof json).toBe('object');
  });

  it('should include all required fields', () => {
    const error = new EnvironmentError('Test error');
    const json = error.toJSON();

    expect(json.name).toBe('EnvironmentError');
    expect(json.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
    expect(json.message).toBe('Test error');
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should include context when provided', () => {
    const context = { variable: 'API_KEY', environment: 'production' };
    const error = new EnvironmentError('Test error', context);
    const json = error.toJSON();

    expect(json.context).toEqual(context);
  });

  it('should be JSON.stringify compatible', () => {
    const error = new EnvironmentError('Test error');
    expect(() => JSON.stringify(error.toJSON())).not.toThrow();

    const jsonStr = JSON.stringify(error.toJSON());
    const parsed = JSON.parse(jsonStr);
    expect(parsed.name).toBe('EnvironmentError');
  });
});
```

### 4.5 Context Sanitization Testing

```typescript
describe('EnvironmentError context sanitization', () => {
  it('should redact sensitive fields', () => {
    const error = new EnvironmentError('Test error', {
      apiKey: 'sk-secret-key-12345',
      token: 'secret-token-abc',
      password: 'secret-password',
      safeField: 'public-value',
    });

    const json = error.toJSON();
    const context = json.context as Record<string, unknown>;

    expect(context?.apiKey).toBe('[REDACTED]');
    expect(context?.token).toBe('[REDACTED]');
    expect(context?.password).toBe('[REDACTED]');
    expect(context?.safeField).toBe('public-value');
  });

  it('should redact case-insensitively', () => {
    const error = new EnvironmentError('Test error', {
      APIKEY: 'sk-secret',
      ApiSecret: 'secret',
      PASSWORD: 'password',
    });

    const json = error.toJSON();
    const context = json.context as Record<string, unknown>;

    expect(context?.APIKEY).toBe('[REDACTED]');
    expect(context?.ApiSecret).toBe('[REDACTED]');
    expect(context?.PASSWORD).toBe('[REDACTED]');
  });

  it('should handle nested Error objects', () => {
    const cause = new Error('Original error');
    const error = new EnvironmentError('Test error', {
      originalError: cause,
    });

    const json = error.toJSON();
    const context = json.context as Record<string, unknown>;

    expect(context?.originalError).toEqual({
      name: 'Error',
      message: 'Original error',
    });
  });

  it('should handle circular references gracefully', () => {
    const circular: Record<string, unknown> = { name: 'test' };
    circular.self = circular;

    const error = new EnvironmentError('Test error', { data: circular });
    const json = error.toJSON();

    expect(json.context?.data).toBeDefined();
    // Should not throw on stringify
    expect(() => JSON.stringify(json)).not.toThrow();
  });
});
```

### 4.6 Error Throwing and Catching

```typescript
describe('Error handling patterns', () => {
  it('should support typical throwing pattern', () => {
    expect(() => {
      throw new EnvironmentError('Test error');
    }).toThrow(EnvironmentError);
  });

  it('should support try-catch with type guard', () => {
    try {
      throw new EnvironmentError('Test error', { variable: 'API_KEY' });
    } catch (error) {
      if (isEnvironmentError(error)) {
        expect(error.message).toBe('Test error');
        expect(error.context?.variable).toBe('API_KEY');
      } else {
        throw new Error('Expected EnvironmentError');
      }
    }
  });

  it('should support error chaining', () => {
    const originalError = new Error('Network timeout');
    const wrappedError = new EnvironmentError(
      'Failed to load config',
      { operation: 'loadConfig' },
      originalError
    );

    const wrappedWithCause = wrappedError as unknown as { cause?: Error };
    expect(wrappedWithCause.cause).toBe(originalError);
    expect(wrappedWithCause.cause?.message).toBe('Network timeout');
  });
});
```

---

## 5. Test Coverage Best Practices

### 5.1 Coverage Metrics

**Your Project's 100% Coverage Threshold:**

```typescript
coverage: {
  thresholds: {
    global: {
      statements: 100,  // Every statement executed
      branches: 100,     // Every branch taken
      functions: 100,    // Every function called
      lines: 100,        // Every line executed
    },
  },
}
```

**What Each Metric Means:**

- **Statements**: Each executable statement
- **Branches**: Each `if/else`, `switch`, ternary operator
- **Functions**: Each function declaration/expression
- **Lines**: Each line of code (similar to statements)

### 5.2 Achieving 100% Coverage

**1. Happy Path Testing**

Test normal, expected behavior:

```typescript
it('should return true for valid FatalError', () => {
  const error = new FatalError('Test error');
  expect(isFatalError(error)).toBe(true);
});
```

**2. Error Path Testing**

Test error conditions:

```typescript
it('should return false for invalid inputs', () => {
  expect(isFatalError(null)).toBe(false);
  expect(isFatalError(undefined)).toBe(false);
  expect(isFatalError('string')).toBe(false);
});
```

**3. Edge Case Testing**

Test boundary conditions:

```typescript
it('should handle edge cases', () => {
  // Empty message
  expect(() => new FatalError('')).not.toThrow();

  // Very long message
  const longMessage = 'Error '.repeat(1000);
  expect(() => new FatalError(longMessage)).not.toThrow();

  // Special characters
  expect(() => new FatalError('Error: !@#$%^&*()')).not.toThrow();

  // Unicode
  expect(() => new FatalError('錯誤')).not.toThrow();
});
```

**4. Branch Coverage**

Ensure all branches are tested:

```typescript
// Implementation
function isFatalError(error: unknown): error is FatalError {
  if (error === null || error === undefined) {
    return false;  // Branch 1
  }
  if (!(error instanceof PipelineError)) {
    return false;  // Branch 2
  }
  return error.code === ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR; // Branch 3
}

// Tests for all branches
it('should handle null/undefined', () => {
  expect(isFatalError(null)).toBe(false);      // Branch 1
  expect(isFatalError(undefined)).toBe(false); // Branch 1
});

it('should handle non-PipelineError', () => {
  expect(isFatalError(new Error())).toBe(false); // Branch 2
});

it('should handle PipelineError with wrong code', () => {
  const error = new SessionError('Test'); // Branch 3 (false)
  expect(isFatalError(error)).toBe(false);
});

it('should handle FatalError', () => {
  const error = new FatalError('Test'); // Branch 3 (true)
  expect(isFatalError(error)).toBe(true);
});
```

### 5.3 Coverage Checklist

Based on your project's test patterns:

**Function Coverage:**
- [ ] Export the function from module
- [ ] Import and test the function
- [ ] Test all overloads (if applicable)

**Statement Coverage:**
- [ ] Execute every line of code
- [ ] Include `return` statements
- [ ] Include variable assignments
- [ ] Include function calls

**Branch Coverage:**
- [ ] Test all `if` branches (true and false)
- [ ] Test all `else` branches
- [ ] Test all `switch` cases
- [ ] Test all ternary operators
- [ ] Test all logical operators (`&&`, `||`, `??`)

**Line Coverage:**
- [ ] Similar to statement coverage
- [ ] Each line executed at least once

### 5.4 Coverage Tools and Commands

**From your `package.json`:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:bail": "vitest run --bail=1"
  }
}
```

**Usage:**

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Stop on first failure
npm run test:bail
```

**Coverage Report Output:**

```
% Coverage report from v8

----------|---------|---------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|---------|---------|---------|
All files |     100 |     100 |     100 |     100 |
 errors.ts|     100 |     100 |     100 |     100 |
----------|---------|---------|---------|---------|
```

---

## 6. Project-Specific Patterns

### 6.1 Error Hierarchy Pattern

Your project uses a well-designed error hierarchy:

```typescript
Error (built-in)
  └── PipelineError (abstract base class)
        ├── SessionError
        ├── TaskError
        ├── AgentError
        ├── ValidationError
        ├── EnvironmentError
        └── FatalError (to be implemented)
```

**Each Error Class Has:**

1. **Unique Error Code**
   ```typescript
   readonly code = ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR;
   ```

2. **Optional Context**
   ```typescript
   readonly context?: PipelineErrorContext;
   ```

3. **Timestamp**
   ```typescript
   readonly timestamp: Date;
   ```

4. **toJSON() Serialization**
   ```typescript
   toJSON(): Record<string, unknown> {
     return {
       name: this.name,
       code: this.code,
       message: this.message,
       timestamp: this.timestamp.toISOString(),
       context: this.context,
       stack: this.stack,
     };
   }
   ```

5. **Type Guard Function**
   ```typescript
   export function isFatalError(error: unknown): error is FatalError {
     return error instanceof FatalError;
   }
   ```

### 6.2 Test File Template

Based on your existing patterns:

```typescript
/**
 * Unit tests for FatalError class and isFatalError type guard
 *
 * @remarks
 * Tests validate:
 * 1. Constructor with message, context, and cause parameters
 * 2. Error code assignment (PIPELINE_EXECUTION_FATAL_ERROR)
 * 3. Prototype chain setup (instanceof checks)
 * 4. toJSON() serialization for structured logging
 * 5. Context sanitization (sensitive data redaction)
 * 6. Type guard function (isFatalError)
 * 7. Timestamp tracking
 * 8. Error chaining with cause property
 *
 * TDD RED PHASE: All tests must fail before implementation
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/utils/errors.ts | Error Utilities}
 */

import {
  ErrorCodes,
  PipelineErrorContext,
  PipelineError,
  FatalError,
  isFatalError,
} from '../../../src/utils/errors.js';

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================

describe('FatalError class', () => {
  // Test constructors following errors-environment.test.ts pattern
});

// ============================================================================
// ERROR PROPERTY TESTS
// ============================================================================

describe('FatalError error properties', () => {
  // Test properties following errors-environment.test.ts pattern
});

// ============================================================================
// PROTOTYPE CHAIN TESTS
// ============================================================================

describe('FatalError prototype chain', () => {
  // Test prototype chain following errors-environment.test.ts pattern
});

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

describe('FatalError toJSON() serialization', () => {
  // Test serialization following errors-environment.test.ts pattern
});

// ============================================================================
// CONTEXT SANITIZATION TESTS
// ============================================================================

describe('FatalError context sanitization', () => {
  // Test sanitization following errors-environment.test.ts pattern
});

// ============================================================================
// TYPE GUARD TESTS
// ============================================================================

describe('isFatalError type guard', () => {
  describe('positive cases', () => {
    it('should return true for FatalError instances', () => {
      const error = new FatalError('Test error');
      expect(isFatalError(error)).toBe(true);
    });

    it('should work with subclass instances', () => {
      class CustomFatalError extends FatalError {}
      const error = new CustomFatalError('Custom error');
      expect(isFatalError(error)).toBe(true);
    });
  });

  describe('negative cases', () => {
    it('should return false for other PipelineError types', () => {
      const errors = [
        new SessionError('Session error'),
        new TaskError('Task error'),
        new AgentError('Agent error'),
        new ValidationError('Validation error'),
        new EnvironmentError('Environment error'),
      ];

      errors.forEach(error => {
        expect(isFatalError(error)).toBe(false);
      });
    });

    it('should return false for plain Error instances', () => {
      const error = new Error('Plain error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isFatalError(null)).toBe(false);
      expect(isFatalError(undefined)).toBe(false);
      expect(isFatalError('string')).toBe(false);
      expect(isFatalError(123)).toBe(false);
      expect(isFatalError({})).toBe(false);
      expect(isFatalError([])).toBe(false);
    });
  });

  describe('type narrowing', () => {
    it('should narrow type in conditional block', () => {
      const error: unknown = new FatalError('Test error');

      if (isFatalError(error)) {
        // TypeScript should narrow error to FatalError
        expect(error.code).toBeDefined();
        expect(error.message).toBe('Test error');
        expect(error.isFatal).toBe(true);
      }
    });

    it('should narrow type in catch block', () => {
      try {
        throw new FatalError('Fatal error occurred');
      } catch (error) {
        if (isFatalError(error)) {
          // error is narrowed to FatalError
          expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
          expect(error.isFatal).toBe(true);
        }
      }
    });

    it('should work in switch-style error handling', () => {
      const errors: unknown[] = [
        new FatalError('Fatal error'),
        new SessionError('Session error'),
        new Error('Plain error'),
        null,
        undefined,
      ];

      let fatalCount = 0;
      for (const error of errors) {
        if (isFatalError(error)) {
          fatalCount++;
          // error is narrowed to FatalError here
        }
      }

      expect(fatalCount).toBe(1);
    });
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('FatalError edge cases', () => {
  // Test edge cases following errors-environment.test.ts pattern
});

// ============================================================================
// INTEGRATION SCENARIO TESTS
// ============================================================================

describe('FatalError integration scenarios', () => {
  // Test integration scenarios following errors-environment.test.ts pattern
});
```

### 6.3 Error Code Pattern

**Add to `src/utils/errors.ts`:**

```typescript
// In ErrorCodes object
export const ErrorCodes = {
  // ... existing codes
  PIPELINE_EXECUTION_FATAL_ERROR: 'PIPELINE_EXECUTION_FATAL_ERROR',
} as const;

// FatalError class
export class FatalError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR;
  readonly isFatal = true; // Unique property

  constructor(
    message: string,
    context?: PipelineErrorContext,
    cause?: Error
  ) {
    super(message, context, cause);
    Object.setPrototypeOf(this, FatalError.prototype);
  }
}

// Type guard
export function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}
```

### 6.4 TDD Workflow for FatalError

**Step 1: Write Failing Tests (Red)**

Create `tests/unit/utils/errors-fatal.test.ts` with all test cases but no implementation. Run tests - they should fail.

**Step 2: Implement FatalError Class (Green)**

Add `FatalError` class to `src/utils/errors.ts`. Make tests pass with minimal implementation.

**Step 3: Implement isFatalError (Green)**

Add `isFatalError` type guard. Make tests pass.

**Step 4: Refactor (Refactor)**

Clean up code while keeping tests passing.

**Step 5: Verify Coverage**

Run `npm run test:coverage` to ensure 100% coverage.

---

## 7. Reference Implementation

### 7.1 Complete FatalError Test Suite

```typescript
/**
 * Unit tests for FatalError class and isFatalError type guard
 *
 * @remarks
 * Comprehensive test suite following TDD principles and project patterns.
 * All tests must fail before implementation (RED phase).
 *
 * TDD CYCLE:
 * 1. RED: Write failing tests
 * 2. GREEN: Implement minimum code to pass
 * 3. REFACTOR: Clean up while keeping tests passing
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/utils/errors.ts | Error Utilities}
 */

import {
  ErrorCodes,
  PipelineErrorContext,
  PipelineError,
  SessionError,
  TaskError,
  AgentError,
  ValidationError,
  EnvironmentError,
  FatalError,
  isFatalError,
  isSessionError,
} from '../../../src/utils/errors.js';

// ============================================================================
// TDD RED PHASE MARKER
// ============================================================================
//
// The following tests are written BEFORE implementing FatalError class.
// They MUST fail initially. This is the RED phase of TDD.
//
// DO NOT implement FatalError until all tests are written and failing.
//
// ============================================================================

describe('FatalError class (TDD RED PHASE)', () => {
  describe('constructor', () => {
    it('should create FatalError with message only', () => {
      const error = new FatalError('Fatal error occurred');

      expect(error instanceof FatalError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('Fatal error occurred');
    });

    it('should create FatalError with context', () => {
      const context: PipelineErrorContext = {
        operation: 'criticalTask',
        stage: 'execution',
      };

      const error = new FatalError('Fatal error with context', context);

      expect(error.context).toEqual(context);
      expect(error.context?.operation).toBe('criticalTask');
      expect(error.context?.stage).toBe('execution');
    });

    it('should create FatalError with cause', () => {
      const cause = new Error('Original critical error');

      const error = new FatalError('Wrapped fatal error', {}, cause);

      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBe(cause);
      expect(errorWithCause.cause?.message).toBe('Original critical error');
    });

    it('should create FatalError with all parameters', () => {
      const context: PipelineErrorContext = {
        operation: 'databaseMigration',
        stage: 'execution',
        taskId: 'P1.M1.T1',
      };
      const cause = new Error('Database connection lost');

      const error = new FatalError(
        'Database migration failed critically',
        context,
        cause
      );

      expect(error.message).toBe('Database migration failed critically');
      expect(error.context).toEqual(context);
      expect((error as unknown as { cause?: Error }).cause).toBe(cause);
    });

    it('should have isFatal property set to true', () => {
      const error = new FatalError('Test error');
      expect(error.isFatal).toBe(true);
    });
  });

  describe('error properties', () => {
    it('should have correct error code', () => {
      const error = new FatalError('Test error');
      expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
    });

    it('should have correct name', () => {
      const error = new FatalError('Test error');
      expect(error.name).toBe('FatalError');
    });

    it('should have timestamp', () => {
      const before = new Date();
      const error = new FatalError('Test error');
      const after = new Date();

      expect(error.timestamp).toBeDefined();
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have stack trace', () => {
      const error = new FatalError('Test error');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('FatalError');
    });

    it('should have isFatal property', () => {
      const error = new FatalError('Test error');
      expect(error.isFatal).toBe(true);
    });
  });

  describe('prototype chain', () => {
    it('should have correct prototype chain', () => {
      const error = new FatalError('Test error');

      expect(Object.getPrototypeOf(error)).toBe(FatalError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
        PipelineError.prototype
      );
      expect(
        Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(error)))
      ).toBe(Error.prototype);
    });

    it('should work with instanceof for all error types', () => {
      const error = new FatalError('Test error');

      expect(error instanceof FatalError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('toJSON() serialization', () => {
    it('should serialize error to plain object', () => {
      const error = new FatalError('Test error');
      const json = error.toJSON();

      expect(json).toBeDefined();
      expect(typeof json).toBe('object');
    });

    it('should include name in JSON', () => {
      const error = new FatalError('Test error');
      const json = error.toJSON();

      expect(json.name).toBe('FatalError');
    });

    it('should include code in JSON', () => {
      const error = new FatalError('Test error');
      const json = error.toJSON();

      expect(json.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
    });

    it('should include message in JSON', () => {
      const error = new FatalError('Test error message');
      const json = error.toJSON();

      expect(json.message).toBe('Test error message');
    });

    it('should include timestamp in ISO format', () => {
      const error = new FatalError('Test error');
      const json = error.toJSON();

      expect(json.timestamp).toBeDefined();
      expect(typeof json.timestamp).toBe('string');
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include context in JSON when provided', () => {
      const context: PipelineErrorContext = {
        operation: 'criticalTask',
        stage: 'execution',
      };
      const error = new FatalError('Test error', context);
      const json = error.toJSON();

      expect(json.context).toBeDefined();
      expect(json.context).toEqual(context);
    });

    it('should include isFatal in JSON', () => {
      const error = new FatalError('Test error');
      const json = error.toJSON();

      expect(json.isFatal).toBe(true);
    });

    it('should be JSON.stringify compatible', () => {
      const error = new FatalError('Test error', { operation: 'test' });

      expect(() => JSON.stringify(error.toJSON())).not.toThrow();
      const jsonStr = JSON.stringify(error.toJSON());
      const parsed = JSON.parse(jsonStr);

      expect(parsed.name).toBe('FatalError');
      expect(parsed.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
      expect(parsed.isFatal).toBe(true);
    });
  });

  describe('context sanitization', () => {
    it('should redact sensitive fields', () => {
      const error = new FatalError('Test error', {
        apiKey: 'sk-secret-key-12345',
        token: 'secret-token-abc',
        password: 'secret-password',
        safeField: 'public-value',
      });

      const json = error.toJSON();
      const context = json.context as Record<string, unknown>;

      expect(context?.apiKey).toBe('[REDACTED]');
      expect(context?.token).toBe('[REDACTED]');
      expect(context?.password).toBe('[REDACTED]');
      expect(context?.safeField).toBe('public-value');
    });

    it('should redact case-insensitively', () => {
      const error = new FatalError('Test error', {
        APIKEY: 'sk-secret',
        ApiSecret: 'secret',
        PASSWORD: 'password',
      });

      const json = error.toJSON();
      const context = json.context as Record<string, unknown>;

      expect(context?.APIKEY).toBe('[REDACTED]');
      expect(context?.ApiSecret).toBe('[REDACTED]');
      expect(context?.PASSWORD).toBe('[REDACTED]');
    });

    it('should handle nested Error objects', () => {
      const cause = new Error('Original error');
      const error = new FatalError('Test error', {
        originalError: cause,
      });

      const json = error.toJSON();
      const context = json.context as Record<string, unknown>;

      expect(context?.originalError).toEqual({
        name: 'Error',
        message: 'Original error',
      });
    });

    it('should handle circular references gracefully', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      const error = new FatalError('Test error', { data: circular });
      const json = error.toJSON();

      expect(json.context?.data).toBeDefined();
      expect(() => JSON.stringify(json)).not.toThrow();
    });

    it('should handle non-serializable objects', () => {
      const fn = () => 'function';
      const error = new FatalError('Test error', {
        callback: fn,
      });

      const json = error.toJSON();
      const context = json.context as Record<string, unknown>;

      expect(context?.callback).toBe('[non-serializable]');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      const error = new FatalError('');
      expect(error.message).toBe('');
    });

    it('should handle undefined context', () => {
      const error = new FatalError('Test error');
      expect(error.context).toBeUndefined();
    });

    it('should handle null context', () => {
      const error = new FatalError('Test error', null as any);
      expect(error.context).toBeNull();
    });

    it('should handle undefined cause', () => {
      const error = new FatalError('Test error');
      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBeUndefined();
    });

    it('should handle very long messages', () => {
      const longMessage = 'Fatal error '.repeat(100);
      const error = new FatalError(longMessage);
      expect(error.message).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Error: CRITICAL FAILURE! @#$%^&*()';
      const error = new FatalError(specialMessage);
      expect(error.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Fatal error 致命錯誤 occurred';
      const error = new FatalError(unicodeMessage);
      expect(error.message).toBe(unicodeMessage);
    });
  });

  describe('integration scenarios', () => {
    it('should support typical error throwing pattern', () => {
      expect(() => {
        throw new FatalError('Critical failure', {
          operation: 'databaseMigration',
        });
      }).toThrow(FatalError);
    });

    it('should support try-catch with type guard', () => {
      try {
        throw new FatalError('Critical failure', {
          operation: 'databaseMigration',
          stage: 'execution',
        });
      } catch (error) {
        if (isFatalError(error)) {
          expect(error.message).toBe('Critical failure');
          expect(error.context?.operation).toBe('databaseMigration');
          expect(error.context?.stage).toBe('execution');
          expect(error.isFatal).toBe(true);
        } else {
          throw new Error('Expected FatalError');
        }
      }
    });

    it('should support error chaining with cause', () => {
      const originalError = new Error('Database connection lost');
      const wrappedError = new FatalError(
        'Failed to execute critical migration',
        { operation: 'migration' },
        originalError
      );

      const wrappedWithCause = wrappedError as unknown as { cause?: Error };
      expect(wrappedWithCause.cause).toBe(originalError);
      expect(wrappedWithCause.cause?.message).toBe('Database connection lost');
    });

    it('should support structured logging scenario', () => {
      const error = new FatalError('Critical pipeline failure', {
        operation: 'criticalTask',
        stage: 'execution',
        taskId: 'P1.M1.T1',
      });

      const logData = error.toJSON();

      expect(logData.name).toBe('FatalError');
      expect(logData.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
      expect(logData.message).toBe('Critical pipeline failure');
      expect(logData.timestamp).toBeDefined();
      expect(logData.context).toEqual({
        operation: 'criticalTask',
        stage: 'execution',
        taskId: 'P1.M1.T1',
      });
      expect(logData.isFatal).toBe(true);
      expect(logData.stack).toBeDefined();
    });
  });
});

describe('isFatalError type guard (TDD RED PHASE)', () => {
  describe('positive cases', () => {
    it('should return true for FatalError instances', () => {
      const error = new FatalError('Test error');
      expect(isFatalError(error)).toBe(true);
    });

    it('should work with subclass instances', () => {
      class CustomFatalError extends FatalError {}
      const error = new CustomFatalError('Custom error');
      expect(isFatalError(error)).toBe(true);
    });

    it('should identify FatalError by error code', () => {
      const error = new FatalError('Test error');
      expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
      expect(isFatalError(error)).toBe(true);
    });
  });

  describe('negative cases - other PipelineError types', () => {
    it('should return false for SessionError', () => {
      const error = new SessionError('Session error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for TaskError', () => {
      const error = new TaskError('Task error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for AgentError', () => {
      const error = new AgentError('Agent error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for ValidationError', () => {
      const error = new ValidationError('Validation error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for EnvironmentError', () => {
      const error = new EnvironmentError('Environment error');
      expect(isFatalError(error)).toBe(false);
    });
  });

  describe('negative cases - plain Error and primitives', () => {
    it('should return false for plain Error instances', () => {
      const error = new Error('Plain error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isFatalError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isFatalError(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isFatalError('string')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isFatalError(123)).toBe(false);
    });

    it('should return false for objects', () => {
      expect(isFatalError({})).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isFatalError([])).toBe(false);
    });

    it('should return false for booleans', () => {
      expect(isFatalError(true)).toBe(false);
      expect(isFatalError(false)).toBe(false);
    });
  });

  describe('type narrowing', () => {
    it('should narrow type in conditional block', () => {
      const error: unknown = new FatalError('Test error');

      if (isFatalError(error)) {
        // TypeScript should narrow error to FatalError
        expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
        expect(error.message).toBe('Test error');
        expect(error.isFatal).toBe(true);

        // Accessing FatalError-specific properties should not cause TS errors
        expect(typeof error.timestamp).toBe('object');
      }
    });

    it('should narrow type in catch block', () => {
      try {
        throw new FatalError('Fatal error occurred');
      } catch (error) {
        if (isFatalError(error)) {
          // error is narrowed to FatalError
          expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
          expect(error.message).toBe('Fatal error occurred');
          expect(error.isFatal).toBe(true);

          // Should have access to all FatalError properties
          expect(error.timestamp).toBeDefined();
          expect(error.stack).toBeDefined();
        } else {
          throw new Error('Expected FatalError');
        }
      }
    });

    it('should narrow type in array filter', () => {
      const errors: unknown[] = [
        new FatalError('Fatal error'),
        new SessionError('Session error'),
        new Error('Plain error'),
        null,
      ];

      const fatalErrors = errors.filter(isFatalError);

      expect(fatalErrors).toHaveLength(1);
      expect(fatalErrors[0].message).toBe('Fatal error');
      expect(fatalErrors[0].isFatal).toBe(true);
    });

    it('should work in switch-style error handling', () => {
      const errors: unknown[] = [
        new FatalError('Fatal error'),
        new SessionError('Session error'),
        new TaskError('Task error'),
        new Error('Plain error'),
        null,
        undefined,
        'string error',
      ];

      let fatalCount = 0;
      let sessionCount = 0;
      let taskCount = 0;
      let otherCount = 0;

      for (const error of errors) {
        if (isFatalError(error)) {
          fatalCount++;
          // error is narrowed to FatalError here
          expect(error.isFatal).toBe(true);
        } else if (isSessionError(error)) {
          sessionCount++;
          // error is narrowed to SessionError here
        } else if (error instanceof TaskError) {
          taskCount++;
        } else {
          otherCount++;
        }
      }

      expect(fatalCount).toBe(1);
      expect(sessionCount).toBe(1);
      expect(taskCount).toBe(1);
      expect(otherCount).toBe(3); // Error, null, undefined, string
    });
  });

  describe('integration with error handling', () => {
    it('should support error handler with multiple type guards', () => {
      const errorHandler = (error: unknown): string => {
        if (isFatalError(error)) {
          return `FATAL: ${error.message} (isFatal: ${error.isFatal})`;
        }
        if (isSessionError(error)) {
          return `SESSION: ${error.message}`;
        }
        if (error instanceof Error) {
          return `ERROR: ${error.message}`;
        }
        return 'UNKNOWN';
      };

      expect(errorHandler(new FatalError('Critical failure'))).toBe(
        'FATAL: Critical failure (isFatal: true)'
      );
      expect(errorHandler(new SessionError('Session failed'))).toBe(
        'SESSION: Session failed'
      );
      expect(errorHandler(new Error('Generic error'))).toBe(
        'ERROR: Generic error'
      );
      expect(errorHandler(null)).toBe('UNKNOWN');
    });

    it('should support retry logic differentiation', () => {
      const shouldRetry = (error: unknown): boolean => {
        // Fatal errors should not be retried
        if (isFatalError(error)) {
          return false;
        }
        // Other errors might be retryable
        return true;
      };

      expect(shouldRetry(new FatalError('Critical failure'))).toBe(false);
      expect(shouldRetry(new SessionError('Session timeout'))).toBe(true);
      expect(shouldRetry(new Error('Network error'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle Error-like objects', () => {
      const errorLike = { message: 'Fake error', name: 'Error' };
      expect(isFatalError(errorLike)).toBe(false);
    });

    it('should handle objects with code property', () => {
      const fakeError = {
        message: 'Fake error',
        code: ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR,
      };
      expect(isFatalError(fakeError)).toBe(false);
    });

    it('should handle objects with isFatal property', () => {
      const fakeFatal = { message: 'Fake', isFatal: true };
      expect(isFatalError(fakeFatal)).toBe(false);
    });
  });
});
```

### 7.2 Implementation (After Tests Fail)

```typescript
// In src/utils/errors.ts

// Add to ErrorCodes
export const ErrorCodes = {
  // ... existing codes
  PIPELINE_EXECUTION_FATAL_ERROR: 'PIPELINE_EXECUTION_FATAL_ERROR',
} as const;

// Add FatalError class
export class FatalError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR;
  readonly isFatal = true;

  constructor(
    message: string,
    context?: PipelineErrorContext,
    cause?: Error
  ) {
    super(message, context, cause);
    Object.setPrototypeOf(this, FatalError.prototype);
  }
}

// Add type guard
export function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}
```

---

## 8. Conclusion

### 8.1 Key Takeaways

1. **TDD Discipline**: Always write tests before implementation (RED phase)
2. **Type Guard Testing**: Test positive/negative cases, type narrowing, and edge cases
3. **Vitest Best Practices**: Use SEV pattern, proper mocking, and comprehensive assertions
4. **Error Handling**: Test constructor, properties, prototype chain, serialization, and sanitization
5. **100% Coverage**: Ensure all branches, statements, functions, and lines are tested
6. **Project Patterns**: Follow existing test structure and conventions

### 8.2 Testing Workflow

```
1. Write failing tests (RED)
   ├── Create test file
   ├── Write all test cases
   └── Run tests - verify they fail

2. Implement functionality (GREEN)
   ├── Write minimum code to pass
   ├── Run tests frequently
   └── Make all tests pass

3. Refactor and clean up (REFACTOR)
   ├── Remove duplication
   ├── Improve readability
   └── Keep tests passing

4. Verify coverage
   └── Run npm run test:coverage
```

### 8.3 Resources

**Internal Project Resources:**
- `/home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts` - Reference for error testing patterns
- `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts` - Reference for async testing patterns
- `/home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts` - Reference for type guard testing patterns
- `/home/dustin/projects/hacky-hack/src/utils/errors.ts` - Error hierarchy implementation
- `/home/dustin/projects/hacky-hack/vitest.config.ts` - Test configuration

**External Resources (When Web Search Available):**
- Vitest Documentation: https://vitest.dev/guide/
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- TDD Best Practices: https://martinfowler.com/bliki/TestDrivenDevelopment.html

---

**Document Version:** 1.0
**Last Updated:** 2025-01-16
**Author:** Claude Code Research Agent
**Status:** Ready for PRP Implementation
