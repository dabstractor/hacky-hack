# Test Patterns for Validation Functions in Hacky-Hack Codebase

**Research Date:** 2026-01-26
**Research Task:** P1M3T2S1 - Test patterns for validation functions
**Goal:** Document test patterns for validateNestedExecution

---

## 1. Test Structure Patterns

### describe/it Block Structure

```typescript
describe('module-name', () => {
  beforeEach(() => {
    // Setup and cleanup
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment state
    vi.unstubAllEnvs();
  });

  describe('function-name', () => {
    it('should do X with valid input', () => {
      // Test case
    });
  });
});
```

### Nested Describe Structure

The codebase uses deeply nested `describe` blocks to organize tests logically:
- **Top level**: Module/function being tested
- **Second level**: Main test categories (e.g., "Valid path tests", "Invalid path tests")
- **Third level**: Specific test scenarios

---

## 2. process.env Mocking Patterns

### Using vi.stubEnv()

```typescript
// Set environment variable
vi.stubEnv('ENV_VAR_NAME', 'value');

// Delete environment variable
delete process.env.ENV_VAR_NAME;

// Restore all environment variables
vi.unstubAllEnvs(); // Typically used in afterEach
```

### Environment Variable Test Pattern

```typescript
describe('Environment variable validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL: Always restore environment
  });

  it('should validate when all required vars are set', () => {
    // SETUP
    vi.stubEnv('ENV_VAR_NAME', 'value');

    // EXECUTE & VERIFY
    expect(() => validateFunction()).not.toThrow();
  });

  it('should throw when required var is missing', () => {
    // SETUP
    delete process.env.ENV_VAR_NAME;

    // EXECUTE & VERIFY
    expect(() => validateFunction()).toThrow(ErrorType);
  });
});
```

---

## 3. Assertion Patterns for Validation Functions

### Basic Validation Assertions

```typescript
// Test for no throw (valid case)
expect(() => validateFunction(validInput)).not.toThrow();

// Test for throw (invalid case)
expect(() => validateFunction(invalidInput)).toThrow(ErrorType);

// Test return value
const result = validateFunction(validInput);
expect(result).toBeUndefined(); // For functions that return nothing on success
```

### Error Message Validation

```typescript
// Test error message content
expect(() => validateFunction(invalidInput)).toThrow(
  'Expected error message'
);

// Test specific error message using try-catch
try {
  validateFunction(invalidInput);
  expect.fail('Should have thrown');
} catch (error) {
  expect((error as Error).message).toContain('specific content');
}
```

---

## 4. Error Testing Patterns

### Instanceof Checks

```typescript
// Check specific error type
expect(error).toBeInstanceOf(CustomError);
expect(error).toBeInstanceOf(Error);

// Multiple instanceof checks
expect(error).toBeInstanceOf(BugfixSessionValidationError);
expect(error).toBeInstanceOf(PipelineError);
expect(error).toBeInstanceOf(Error);
```

### Error Property Validation

```typescript
// Test error properties
expect(error.message).toBe('Expected message');
expect(error.name).toBe('ErrorName');
expect(error.code).toBe('ERROR_CODE');

// Test context object
expect(error.context).toEqual({
  variable: 'API_KEY',
  environment: 'production',
});

// Test cause property
expect((error as any).cause).toBeInstanceOf(Error);
expect((error as any).cause?.message).toBe('Original error');
```

### Prototype Chain Testing

```typescript
// Test prototype chain
expect(Object.getPrototypeOf(error)).toBe(CustomError.prototype);
expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
  PipelineError.prototype
);
```

### Type Guard Testing

```typescript
// Test type guard function
expect(isCustomError(error)).toBe(true);
expect(isCustomError(new Error('regular'))).toBe(false);

// Type narrowing in catch block
try {
  // ... code that throws
} catch (error) {
  if (isCustomError(error)) {
    // Now error is typed as CustomError
    expect(error.code).toBe('SPECIFIC_CODE');
  }
}
```

---

## 5. Import Patterns for Tests

### Standard Test Imports

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
```

### Mock Import Pattern

```typescript
// Mock external dependencies
vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  })),
}));
```

### Module Under Test Import

```typescript
// Import the module being tested
import { validateBugfixSession, BugfixSessionValidationError }
  from '../../../../src/utils/validation/session-validation.js';
```

---

## 6. Test Data Patterns

### Test Data Creation Helper Functions

```typescript
function createMockValidationResult(options = {}) {
  const defaults = {
    success: true,
    validationReport: '',
    valid: true,
    exitCode: 0,
  };

  return { ...defaults, ...options };
}
```

### Test Data Constants

```typescript
const fullValidReport = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 2
  Info: 1
============================================================
`;
```

---

## 7. Edge Case Testing Patterns

### Boundary Value Testing

```typescript
// Test maximum/minimum values
const maxValue = 'a'.repeat(1000);
expect(() => validateFunction(maxValue)).not.toThrow();

// Test empty/null/undefined
expect(() => validateFunction('')).toThrow();
expect(() => validateFunction(null)).toThrow();
```

### Special Character Testing

```typescript
// Test special characters
expect(() => validateFunction('path/with@#$%')).toThrow();
expect(() => validateFunction('path/with/unicode🐛')).toThrow();
```

---

## 8. Mock Setup Patterns

### Mock Logger Setup

```typescript
// Mock logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

### Mock Module Setup

```typescript
vi.mock('../../src/utils/execution-guard.js', () => ({
  validateNestedExecutionGuard: vi.fn(),
  NestedExecutionError: class extends Error {
    constructor(message: string, existingPid: string, currentPid: string) {
      super(message);
      this.name = 'NestedExecutionError';
      this.existingPid = existingPid;
      this.currentPid = currentPid;
    }
  },
}));
```

---

## 9. Test Organization Patterns

### Test Categories

- **Happy Path Tests**: Valid inputs that should succeed
- **Error Path Tests**: Invalid inputs that should throw
- **Edge Case Tests**: Boundary values and special cases
- **Integration Scenario Tests**: Real-world usage patterns
- **Cross-Platform Tests**: Different operating systems/paths
- **Performance Tests**: Large inputs and stress testing

### Documentation Comments

Each test file includes comprehensive JSDoc comments:

```typescript
/**
 * Unit tests for [module]
 *
 * @remarks
 * Tests validate [functionality] including:
 * 1. [Feature 1]
 * 2. [Feature 2]
 * 3. [Feature 3]
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */
```

---

## 10. Test Pattern for validateNestedExecution

Based on the existing patterns, here's the recommended test structure:

```typescript
/**
 * Unit tests for validateNestedExecution
 *
 * @remarks
 * Tests validate nested execution guard including:
 * 1. First execution (no PRP_PIPELINE_RUNNING set)
 * 2. Nested execution with bug fix recursion (allowed)
 * 3. Nested execution without bug fix recursion (blocked)
 * 4. Environment variable validation
 * 5. Error message and context
 */

describe('execution-guard', () => {
  describe('validateNestedExecution', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    describe('when PRP_PIPELINE_RUNNING is not set', () => {
      it('should allow execution', () => {
        delete process.env.PRP_PIPELINE_RUNNING;
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).not.toThrow();
      });
    });

    describe('when PRP_PIPELINE_RUNNING is set', () => {
      beforeEach(() => {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      });

      describe('with bug fix recursion (SKIP_BUG_FINDING=true + bugfix path)', () => {
        it('should allow execution', () => {
          vi.stubEnv('SKIP_BUG_FINDING', 'true');
          const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
          expect(() => validateNestedExecution(sessionPath)).not.toThrow();
        });
      });

      describe('without bug fix recursion', () => {
        it('should throw NestedExecutionError when SKIP_BUG_FINDING is not set', () => {
          delete process.env.SKIP_BUG_FINDING;
          const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
          expect(() => validateNestedExecution(sessionPath)).toThrow(
            NestedExecutionError
          );
        });

        it('should throw NestedExecutionError when path does not contain bugfix', () => {
          vi.stubEnv('SKIP_BUG_FINDING', 'true');
          const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
          expect(() => validateNestedExecution(sessionPath)).toThrow(
            NestedExecutionError
          );
        });
      });

      describe('error properties', () => {
        it('should include existing PID in error message', () => {
          vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
          const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
          try {
            validateNestedExecution(sessionPath);
            expect.fail('Should have thrown NestedExecutionError');
          } catch (error) {
            expect((error as Error).message).toContain('12345');
          }
        });

        it('should include context with PIDs and session path', () => {
          vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
          const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
          try {
            validateNestedExecution(sessionPath);
            expect.fail('Should have thrown NestedExecutionError');
          } catch (error) {
            expect((error as NestedExecutionError).existingPid).toBe('12345');
            expect((error as NestedExecutionError).currentPid).toBeDefined();
            expect((error as NestedExecutionError).sessionPath).toBe(sessionPath);
          }
        });
      });
    });
  });
});
```

---

## Summary

This testing pattern provides comprehensive coverage of validation functions with:
- Clear organization with nested describe() blocks
- Proper mocking of environment variables
- Thorough error testing
- Detailed documentation
- Edge case coverage

The `validateNestedExecution` tests should follow these exact patterns.
