# Vitest Testing Patterns for Execution Guard

## Test Framework: Vitest

The codebase uses **Vitest** as the test framework. This is confirmed by:

1. Import statements: `import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';`
2. Test file extensions: `.test.ts`
3. Mocking functions: `vi.stubEnv()`, `vi.unstubAllEnvs()`

## Environment Variable Mocking Patterns

### Pattern 1: Using vi.stubEnv()

```typescript
// Setting environment variables in beforeEach
beforeEach(() => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  vi.stubEnv('SKIP_BUG_FINDING', 'true');
});

// Clearing environment variables
beforeEach(() => {
  delete process.env.PRP_PIPELINE_RUNNING;
  delete process.env.SKIP_BUG_FINDING;
});
```

**Key Points:**

- `vi.stubEnv(name, value)` sets an environment variable for the test
- `delete process.env.VAR` removes an environment variable
- Changes persist across tests unless cleaned up

### Pattern 2: Cleanup with vi.unstubAllEnvs()

```typescript
afterEach(() => {
  // CRITICAL: Always restore environment state
  vi.unstubAllEnvs();
});
```

**Key Points:**

- Must be called in `afterEach` to prevent test pollution
- Restores all environment variables to their original state
- Essential for test isolation

### Pattern 3: Testing Different Values

```typescript
describe('when SKIP_BUG_FINDING has wrong case', () => {
  it('should throw NestedExecutionError for TRUE (uppercase)', () => {
    vi.stubEnv('SKIP_BUG_FINDING', 'TRUE');
    const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
    expect(() => validateNestedExecution(sessionPath)).toThrow(
      NestedExecutionError
    );
  });
});
```

## Error Testing Patterns

### Pattern 1: Testing Error Type

```typescript
it('should throw NestedExecutionError for feature path', () => {
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  expect(() => validateNestedExecution(sessionPath)).toThrow(
    NestedExecutionError
  );
});
```

### Pattern 2: Testing Error Message Content

```typescript
it('should include existing PID in error message', () => {
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
    expect.fail('Should have thrown NestedExecutionError');
  } catch (error) {
    expect((error as Error).message).toContain('99999');
    expect((error as Error).message).toContain(
      'Nested PRP Pipeline execution detected. Only bug fix sessions can recurse'
    );
  }
});
```

### Pattern 3: Testing Error Properties

```typescript
it('should include context with existingPid', () => {
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
    expect.fail('Should have thrown NestedExecutionError');
  } catch (error) {
    expect((error as NestedExecutionError).existingPid).toBe('99999');
  }
});
```

### Pattern 4: Using expect.fail() for Explicit Failure

```typescript
try {
  validateNestedExecution(sessionPath);
  expect.fail('Should have thrown NestedExecutionError');
} catch (error) {
  // Test error properties here
}
```

**Key Points:**

- `expect.fail()` explicitly fails the test if no error is thrown
- Useful when you need to inspect error properties
- Alternative: `expect(() => fn()).toThrow(ErrorClass)` for simple cases

## Test Organization Patterns

### Pattern 1: Nested Describe Blocks

```typescript
describe('execution-guard', () => {
  beforeEach(() => {
    // Setup for all tests
  });

  afterEach(() => {
    // Cleanup for all tests
  });

  describe('validateNestedExecution when PRP_PIPELINE_RUNNING is not set', () => {
    // Tests for this specific scenario
  });

  describe('validateNestedExecution when PRP_PIPELINE_RUNNING is set with bug fix recursion', () => {
    beforeEach(() => {
      // Additional setup for this scenario
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
    });

    // Tests for this scenario
  });
});
```

**Key Points:**

- Outer describe block for overall test suite
- Inner describe blocks for specific scenarios
- beforeEach/afterEach can be nested for specific scenarios

### Pattern 2: Test Naming Convention

```typescript
// Good: Descriptive, follows "should [behavior]" pattern
it('should allow execution for bugfix path', () => {
  // ...
});

it('should throw NestedExecutionError for feature path', () => {
  // ...
});

// Good: Specific about the condition
it('should throw NestedExecutionError for TRUE (uppercase)', () => {
  // ...
});
```

## Assertion Patterns

### Pattern 1: Not Throwing

```typescript
expect(() => validateNestedExecution(sessionPath)).not.toThrow();
```

**Use Case:** Verifying that a function executes without errors

### Pattern 2: Throwing Specific Error

```typescript
expect(() => validateNestedExecution(sessionPath)).toThrow(
  NestedExecutionError
);
```

**Use Case:** Verifying that a function throws a specific error type

### Pattern 3: Property Equality

```typescript
expect((error as NestedExecutionError).existingPid).toBe('99999');
expect((error as NestedExecutionError).currentPid).toBe(process.pid.toString());
expect((error as NestedExecutionError).sessionPath).toBe(sessionPath);
```

**Use Case:** Verifying specific properties on thrown errors

### Pattern 4: String Containment

```typescript
expect((error as Error).message).toContain('99999');
expect((error as Error).message).toContain(
  'Nested PRP Pipeline execution detected'
);
```

**Use Case:** Verifying error messages contain specific text

## Type Guard Testing Patterns

### Pattern 1: Testing Positive Cases

```typescript
it('should identify NestedExecutionError correctly', () => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
    expect.fail('Should have thrown NestedExecutionError');
  } catch (error) {
    expect(isNestedExecutionError(error)).toBe(true);
  }
});
```

### Pattern 2: Testing Negative Cases

```typescript
it('should return false for generic Error', () => {
  const genericError = new Error('Some error');
  expect(isNestedExecutionError(genericError)).toBe(false);
});

it('should return false for null', () => {
  expect(isNestedExecutionError(null)).toBe(false);
});
```

### Pattern 3: Testing Type Narrowing

```typescript
it('should enable type narrowing in catch block', () => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
  } catch (error) {
    if (isNestedExecutionError(error)) {
      // Type should be narrowed to NestedExecutionError
      expect(error.existingPid).toBe('12345');
      expect(error.sessionPath).toBe(sessionPath);
    } else {
      expect.fail('Error should be NestedExecutionError');
    }
  }
});
```

## Instanceof Testing Patterns

### Pattern 1: Testing Instanceof Checks

```typescript
it('should be instanceof NestedExecutionError', () => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
    expect.fail('Should have thrown NestedExecutionError');
  } catch (error) {
    expect(error instanceof NestedExecutionError).toBe(true);
  }
});
```

### Pattern 2: Testing Error Name

```typescript
it('should have correct name property', () => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
  try {
    validateNestedExecution(sessionPath);
    expect.fail('Should have thrown NestedExecutionError');
  } catch (error) {
    expect((error as Error).name).toBe('NestedExecutionError');
  }
});
```

## Import Patterns

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  validateNestedExecution,
  NestedExecutionError,
  isNestedExecutionError,
} from '../../../../src/utils/validation/execution-guard.js';
```

**Key Points:**

- Import from 'vitest' for test functions
- Use relative imports with `..` to navigate to source files
- Include `.js` extension even for TypeScript files (ESM requirement)

## Gotchas and Best Practices

### Gotcha 1: Environment Variable Pollution

```typescript
// WRONG: No cleanup
beforeEach(() => {
  vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
});
// Environment persists to next test!

// RIGHT: Always cleanup
afterEach(() => {
  vi.unstubAllEnvs();
});
```

### Gotcha 2: Case Sensitivity

```typescript
// WRONG: Assuming case insensitivity
process.env.SKIP_BUG_FINDING = 'TRUE'; // This is NOT 'true'!

// RIGHT: Test exact values
vi.stubEnv('SKIP_BUG_FINDING', 'true'); // Must be lowercase
```

### Gotcha 3: Forgetting expect.fail()

```typescript
// WRONG: Test passes even if no error is thrown
try {
  validateNestedExecution(sessionPath);
} catch (error) {
  expect(error.message).toContain('PID');
}

// RIGHT: Explicitly fail if no error
try {
  validateNestedExecution(sessionPath);
  expect.fail('Should have thrown NestedExecutionError');
} catch (error) {
  expect(error.message).toContain('PID');
}
```

### Best Practice 1: Descriptive Test Names

```typescript
// GOOD: Clear what is being tested
it('should throw NestedExecutionError when SKIP_BUG_FINDING is TRUE (uppercase)', () => {
  // ...
});

// BAD: Vague
it('test error case', () => {
  // ...
});
```

### Best Practice 2: Test Isolation

```typescript
// GOOD: Each test is independent
beforeEach(() => {
  delete process.env.PRP_PIPELINE_RUNNING;
  delete process.env.SKIP_BUG_FINDING;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// BAD: Tests depend on order
it('first test sets env', () => {
  process.env.PRP_PIPELINE_RUNNING = '12345';
});

it('second test assumes env is set', () => {
  // Fragile! Breaks if run alone or in different order
});
```

### Best Practice 3: Comprehensive Edge Case Testing

```typescript
// GOOD: Test edge cases
it('should handle very long session paths', () => {
  const longPath =
    'plan/003_b3d3efdaf0ed/' + 'bugfix/'.repeat(100) + '001_test';
  expect(() => validateNestedExecution(longPath)).not.toThrow();
});

it('should handle special characters in session path', () => {
  const specialPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test-123';
  expect(() => validateNestedExecution(specialPath)).not.toThrow();
});

it('should handle unicode characters in session path', () => {
  const unicodePath = 'plan/003_b3d3efdaf0ed/bugfix/001_тест';
  expect(() => validateNestedExecution(unicodePath)).not.toThrow();
});
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- tests/unit/utils/validation/execution-guard.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Watch Mode

```bash
npm test -- --watch
```

## Summary

Vitest provides a clean, modern API for testing with:

- **Simple environment mocking**: `vi.stubEnv()` and `vi.unstubAllEnvs()`
- **Clear assertions**: `expect().toThrow()`, `expect().not.toThrow()`
- **Type safety**: Full TypeScript support
- **Fast execution**: Optimized for speed
- **Watch mode**: Automatic re-running on file changes

The existing test file demonstrates all these patterns effectively, providing comprehensive coverage of the nested execution guard functionality.
