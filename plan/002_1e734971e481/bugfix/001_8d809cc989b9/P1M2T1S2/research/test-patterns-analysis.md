# Test Patterns Analysis

**Analysis Date**: 2026-01-16
**Analyzed By**: P1.M2.T1.S2 Research Phase
**Purpose**: Document existing test patterns in the codebase to guide isFatalError test implementation

---

## Overview

This document analyzes the test patterns and conventions used in the `hacky-hack` codebase, specifically focusing on error testing patterns. The analysis provides concrete examples and patterns to follow when implementing the comprehensive test suite for `isFatalError()` function.

---

## Source Files Analyzed

1. **`/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts`** - Primary reference
2. **`/home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts`** - EnvironmentError test patterns
3. **`/home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts`** - Integration test expectations
4. **`/home/dustin/projects/hacky-hack/vitest.config.ts`** - Test configuration
5. **`/home/dustin/projects/hacky-hack/tests/setup.ts`** - Global test setup

---

## Test File Structure Pattern

### Header Documentation

Every test file MUST have comprehensive header documentation:

```typescript
/**
 * Unit tests for [feature/function name]
 *
 * @remarks
 * Tests validate [feature functionality] including:
 * 1. [Category 1 of tests]
 * 2. [Category 2 of tests]
 * 3. [Category 3 of tests]
 * ...
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link [relative-path-to-related-docs] | [Description]}
 */
```

**Example from errors.test.ts:**
```typescript
/**
 * Unit tests for Error hierarchy
 *
 * @remarks
 * Tests validate the complete error hierarchy functionality including:
 * 1. ErrorCodes constant export and type safety
 * 2. PipelineError base class with abstract code property
 * 3. Specialized error classes (SessionError, TaskError, AgentError, ValidationError)
 * 4. Prototype chain setup (instanceof checks)
 * 5. toJSON() serialization for structured logging
 * 6. Context sanitization (sensitive data redaction)
 * 7. Circular reference handling
 * 8. Type guard functions for type narrowing
 * 9. Timestamp tracking
 * 10. Error chaining with cause property
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */
```

### Import Pattern

Imports follow a specific order:

```typescript
// 1. Vitest imports
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 2. Source code imports (with .js extension for ESM)
import {
  ErrorCodes,
  ErrorCode,
  PipelineErrorContext,
  PipelineError,
  SessionError,
  TaskError,
  AgentError,
  ValidationError,
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
} from '../../../src/utils/errors.js';

// 3. Test fixtures (if any)
import { mockSimplePRD } from '../../fixtures/simple-prd.js';
```

**CRITICAL**: All imports MUST use `.js` extension even for `.ts` files (ESM module resolution)

---

## Test Organization Pattern

### Nested Describe Blocks

Tests are organized using nested `describe` blocks for logical grouping:

```typescript
describe('Feature name', () => {
  // Optional setup/teardown
  beforeEach(() => {
    // Test setup
  });

  afterEach(() => {
    // Test cleanup
  });

  // Category 1
  describe('Category 1', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });

  // Category 2
  describe('Category 2', () => {
    describe('Subcategory 2a', () => {
      it('should do another thing', () => {
        // Test implementation
      });
    });
  });
});
```

**Example from errors.test.ts:**
```typescript
describe('Error hierarchy', () => {
  describe('ErrorCodes constant', () => {
    it('should export all error codes', () => {
      // Test implementation
    });
  });

  describe('PipelineError base class', () => {
    describe('Constructor', () => {
      it('should create PipelineError with message only', () => {
        // Test implementation
      });
    });
  });
});
```

---

## SEV (Setup-Execute-Verify) Pattern

Each test follows the SEV pattern for clarity and maintainability:

```typescript
it('should return true for SessionError with LOAD_FAILED code', () => {
  // SETUP: Create error instance
  const error = new SessionError('Session load failed', {
    sessionPath: '/path/to/session',
  });

  // EXECUTE: Call function under test
  const result = isFatalError(error);

  // VERIFY: Assert expected behavior
  expect(result).toBe(true);
});
```

**Benefits of SEV Pattern:**
1. Clear separation of concerns
2. Easy to identify test components
3. Simplifies debugging
4. Makes tests more readable and maintainable

---

## Test Naming Conventions

### Describe Block Names

- Use descriptive names that indicate what is being tested
- Use plural nouns for categories (e.g., "Fatal errors", "Non-fatal errors")
- Use specific feature/function names for root describe (e.g., "isFatalError")

**Examples:**
- `describe('isFatalError', () => { ... })` - Root describe
- `describe('Fatal errors (return true)', () => { ... })` - Category
- `describe('SessionError', () => { ... })` - Subcategory

### Test (it) Names

- Use "should" prefix to indicate expected behavior
- Be specific about what is being tested
- Include the expected result in the description
- Use present tense

**Examples:**
- `it('should return true for SessionError with LOAD_FAILED code', () => { ... })`
- `it('should return false for TaskError instances', () => { ... })`
- `it('should handle null values gracefully', () => { ... })`
- `it('should work with isPipelineError type guard', () => { ... })`

---

## Assertion Patterns

### Basic Value Assertions

```typescript
// Boolean values
expect(result).toBe(true);
expect(result).toBe(false);
expect(isValid).toBeDefined();

// String values
expect(error.name).toBe('SessionError');
expect(error.message).toBe('Test error');

// Numeric values
expect(errorCount).toBe(5);
expect(attempts).toBeGreaterThan(0);
```

### Type Checking Assertions

```typescript
// Instanceof checks
expect(error).toBeInstanceOf(Error);
expect(error).toBeInstanceOf(PipelineError);
expect(error).toBeInstanceOf(SessionError);

// Type property checks
expect(error.name).toBe('SessionError');
expect(typeof error.code).toBe('string');
```

### Array/Object Assertions

```typescript
// Array length
expect(errors).toHaveLength(3);

// Array containment
expect(errorTypes).toContain('SessionError');
expect(codes).toContain(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);

// Object equality
expect(error.context).toEqual({ sessionPath: '/path' });
expect(result).toMatchObject({ status: 'success' });
```

### Error-Related Assertions

```typescript
// Throwing errors
expect(() => { throw error; }).toThrow(ErrorType);
expect(() => { operation(); }).not.toThrow();

// Error properties
expect(error.name).toBe('SessionError');
expect(error.message).toContain('failed');
expect((error as any).code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
```

### Async Assertions

```typescript
// Resolving promises
await expect(promise).resolves.toBe(value);

// Rejecting promises
await expect(promise).rejects.toThrow(message);

// Async/await
const result = await asyncOperation();
expect(result).toBe(expected);
```

---

## Error Testing Patterns

### Constructor Testing

```typescript
describe('SessionError constructor', () => {
  it('should create SessionError with message only', () => {
    const error = new SessionError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PipelineError);
    expect(error).toBeInstanceOf(SessionError);
    expect(error.name).toBe('SessionError');
    expect(error.message).toBe('Test error');
  });

  it('should create SessionError with message and context', () => {
    const context = { sessionPath: '/path/to/session' };
    const error = new SessionError('Test error', context);

    expect((error as any).sessionPath).toBe('/path/to/session');
  });

  it('should create SessionError with message, context, and cause', () => {
    const cause = new Error('Original error');
    const error = new SessionError('Wrapper error', {}, cause);

    expect((error as unknown as { cause?: Error }).cause).toBe(cause);
  });
});
```

### Type Guard Testing

```typescript
describe('isSessionError type guard', () => {
  it('should return true for SessionError instances', () => {
    const error = new SessionError('Test error');
    expect(isSessionError(error)).toBe(true);
  });

  it('should return false for other error types', () => {
    const taskError = new TaskError('Test error');
    const plainError = new Error('Test error');

    expect(isSessionError(taskError)).toBe(false);
    expect(isSessionError(plainError)).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isSessionError(null)).toBe(false);
    expect(isSessionError(undefined)).toBe(false);
  });

  it('should narrow type correctly', () => {
    const error = new SessionError('Test error');

    if (isSessionError(error)) {
      // Type is narrowed to SessionError
      expect(error.code).toBeDefined();
      expect(error.name).toBe('SessionError');
      // Can access SessionError-specific properties
    }
  });
});
```

### Context Property Testing

```typescript
describe('Error context properties', () => {
  it('should preserve context properties', () => {
    const context = {
      sessionPath: '/path/to/session',
      operation: 'loadSession',
    };
    const error = new SessionError('Test error', context);

    expect((error as any).sessionPath).toBe('/path/to/session');
    expect((error as any).operation).toBe('loadSession');
  });

  it('should handle missing context gracefully', () => {
    const error = new SessionError('Test error');

    expect(error.context).toBeUndefined();
    expect(error.message).toBe('Test error');
  });

  it('should handle context with null values', () => {
    const context = {
      sessionPath: null as unknown as string,
    };
    const error = new SessionError('Test error', context);

    expect((error as any).sessionPath).toBeNull();
  });
});
```

### Error Code Testing

```typescript
describe('Error code assignment', () => {
  it('should assign correct error code to SessionError', () => {
    const error = new SessionError('Test error');

    expect((error as any).code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
  });

  it('should use error code constants (not string literals)', () => {
    const code1 = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
    const code2 = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;

    expect(code1).toBe(code2);
    expect(typeof code1).toBe('string');
  });

  it('should follow error code naming pattern', () => {
    const allCodes = Object.values(ErrorCodes);
    const pattern = /^PIPELINE_[A-Z]+_[A-Z_]+$/;

    allCodes.forEach(code => {
      expect(code).toMatch(pattern);
    });
  });
});
```

---

## Setup and Teardown Patterns

### beforeEach Pattern

```typescript
describe('Feature with setup', () => {
  let instance: SomeClass;

  beforeEach(() => {
    // Setup before each test
    instance = new SomeClass();
  });

  it('should use setup instance', () => {
    expect(instance).toBeDefined();
    // Test implementation
  });
});
```

### afterEach Pattern

```typescript
describe('Feature with cleanup', () => {
  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  it('should clean up mocks', () => {
    const mock = vi.fn();
    mock('test');
    // Test implementation
  });
});
```

### Global Setup (from tests/setup.ts)

```typescript
beforeEach(() => {
  // Clear all mock call histories before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore all environment variable stubs
  vi.unstubAllEnvs();

  // Force garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

**Note:** Individual test files typically don't need to repeat this global setup.

---

## Mock and Spy Patterns

### Mock Function Creation

```typescript
describe('Feature with mocks', () => {
  it('should use mock function', () => {
    const mockFn = vi.fn();

    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

### Module Mocking

```typescript
// Mock at top of file before imports
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Import after mocking
import { spawn } from 'node:child_process';
const mockSpawn = vi.mocked(spawn);

it('should use mocked module', () => {
  mockSpawn.mockReturnValue({} as unknown as ChildProcess);
  // Test implementation
});
```

### Mock Factories

```typescript
function createMockError(options: {
  message?: string;
  code?: string;
  context?: Record<string, unknown>;
} = {}) {
  const {
    message = 'Test error',
    code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED,
    context = {},
  } = options;

  return new SessionError(message, context);
}

it('should use mock factory', () => {
  const error = createMockError({ message: 'Custom error' });
  expect(error.message).toBe('Custom error');
});
```

---

## Edge Case Testing Patterns

### Null/Undefined Testing

```typescript
describe('Null/undefined handling', () => {
  it('should handle null input', () => {
    expect(isFatalError(null)).toBe(false);
  });

  it('should handle undefined input', () => {
    expect(isFatalError(undefined)).toBe(false);
  });

  it('should handle null context property', () => {
    const error = new SessionError('Test', {
      sessionPath: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(true);
  });
});
```

### Empty/Invalid Input Testing

```typescript
describe('Empty/invalid input handling', () => {
  it('should handle empty string', () => {
    expect(isFatalError('')).toBe(false);
  });

  it('should handle empty object', () => {
    expect(isFatalError({})).toBe(false);
  });

  it('should handle array input', () => {
    expect(isFatalError([1, 2, 3])).toBe(false);
  });
});
```

### Special Characters Testing

```typescript
describe('Special character handling', () => {
  it('should handle newlines and tabs', () => {
    const error = new SessionError('Error\n\twith\nspecial\tchars');
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle unicode characters', () => {
    const error = new SessionError('Error: 你好 🚀 Ñoño');
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle very long strings', () => {
    const longMessage = 'A'.repeat(10000);
    const error = new SessionError(longMessage);
    expect(isFatalError(error)).toBe(true);
  });
});
```

### Boundary Condition Testing

```typescript
describe('Boundary conditions', () => {
  it('should handle minimum valid input', () => {
    const error = new SessionError(''); // Empty message
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle maximum reasonable input', () => {
    const context = { data: 'x'.repeat(10000) };
    const error = new SessionError('Large context', context);
    expect(isFatalError(error)).toBe(true);
  });
});
```

---

## Parameterized Testing Patterns

### Multiple Variations with describe.each

```typescript
describe.each([
  ['TypeError', new TypeError('Type error')],
  ['ReferenceError', new ReferenceError('Ref error')],
  ['SyntaxError', new SyntaxError('Syntax error')],
  ['RangeError', new RangeError('Range error')],
])('should return false for %s', (name, error) => {
  it('should return false', () => {
    expect(isFatalError(error)).toBe(false);
  });
});
```

### Multiple Variations with Test Loops

```typescript
describe('Standard error types', () => {
  const errorTypes = [
    TypeError,
    ReferenceError,
    SyntaxError,
    RangeError,
    URIError,
  ];

  errorTypes.forEach(ErrorClass => {
    it(`should return false for ${ErrorClass.name}`, () => {
      const error = new ErrorClass('Test error');
      expect(isFatalError(error)).toBe(false);
    });
  });
});
```

---

## Type Narrowing Test Patterns

### Type Guard Integration

```typescript
describe('Type guard integration', () => {
  it('should work with isPipelineError', () => {
    const error = new SessionError('Test error');

    if (isPipelineError(error)) {
      // Type is narrowed to PipelineError
      expect(isFatalError(error)).toBe(true);
      expect(error.code).toBeDefined();
    } else {
      expect.fail('Error should be a PipelineError');
    }
  });

  it('should work with isSessionError', () => {
    const error = new SessionError('Test error');

    if (isSessionError(error)) {
      // Type is narrowed to SessionError
      expect(isFatalError(error)).toBe(true);
      expect(error.isLoadError()).toBe(true); // SessionError method
    }
  });

  it('should handle non-PipelineError types', () => {
    const error = new Error('Standard error');

    if (!isPipelineError(error)) {
      // Type is narrowed to non-PipelineError
      expect(isFatalError(error)).toBe(false);
    }
  });
});
```

---

## Test Coverage Considerations

### Achieving 100% Coverage

The project enforces 100% code coverage thresholds. To achieve this:

1. **Test all branches**: Every `if/else` branch must be tested
2. **Test all edge cases**: Null, undefined, empty, invalid inputs
3. **Test all error conditions**: Every error path must be exercised
4. **Test all parameter combinations**: Different values and combinations
5. **Test type narrowing**: Verify type guards work correctly

### Coverage Verification

```bash
# Run coverage report
npm run test:coverage -- tests/unit/utils/is-fatal-error.test.ts

# Check coverage thresholds are met
# Expected: 100% for statements, branches, functions, lines
```

---

## Summary and Recommendations

### Key Patterns to Follow

1. **File Structure**: Comprehensive header, ordered imports, nested describe blocks
2. **Test Organization**: Logical grouping with clear categorization
3. **SEV Pattern**: Setup-Execute-Verify for clarity
4. **Naming**: "should" prefix for test descriptions
5. **Assertions**: Specific, clear assertions using `expect()`
6. **Coverage**: Comprehensive coverage of all branches and edge cases

### Patterns to Avoid

1. **Vague test names**: Be specific about what is being tested
2. **Missing SEV structure**: Unclear what is setup/execute/verify
3. **Duplicate tests**: Each test should validate a unique scenario
4. **Incomplete coverage**: Missing branches or edge cases
5. **Wrong import extensions**: Always use `.js` for ESM imports

### Next Steps

Use these patterns to implement the comprehensive test suite for `isFatalError()`:
1. Follow the file structure pattern
2. Use nested describe blocks for organization
3. Apply SEV pattern to all tests
4. Include all edge cases and variations
5. Ensure 100% coverage of all branches
6. Verify all tests fail (red phase) before proceeding

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Related PRP**: P1.M2.T1.S2
