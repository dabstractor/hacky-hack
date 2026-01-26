# Test Patterns in Codebase

## Overview

Analysis of test patterns used in the codebase for validation functions and error classes.

## Key Test Files Analyzed

1. **tests/unit/utils/validation/session-validation.test.ts**
   - Session validation tests (target patterns)
   - 432 lines, 45+ test cases
   - Uses Vitest framework

2. **tests/unit/utils/errors.test.ts**
   - Error hierarchy tests
   - 1220 lines, comprehensive error class testing
   - Patterns for BugfixSessionValidationError

## Common Test Patterns

### Pattern 1: describe() Structure

```typescript
describe('Feature name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

### Pattern 2: Validation Testing (Success Path)

```typescript
it('should accept valid input', () => {
  const validInput = 'valid-value';
  expect(() => validateFunction(validInput)).not.toThrow();
});
```

### Pattern 3: Validation Testing (Error Path)

```typescript
it('should reject invalid input', () => {
  const invalidInput = 'invalid-value';
  expect(() => validateFunction(invalidInput)).toThrow(CustomError);
});
```

### Pattern 4: Error Message Validation

```typescript
it('should include descriptive error message', () => {
  const invalidInput = 'invalid';
  try {
    validateFunction(invalidInput);
    expect.fail('Should have thrown CustomError');
  } catch (error) {
    expect(error).toBeInstanceOf(CustomError);
    expect((error as Error).message).toContain(invalidInput);
  }
});
```

### Pattern 5: Instanceof and Type Checking

```typescript
it('should be instanceof CustomError', () => {
  const error = new CustomError('message');
  expect(error instanceof CustomError).toBe(true);
  expect(error instanceof Error).toBe(true);
});
```

### Pattern 6: Property Validation

```typescript
it('should have correct error code', () => {
  const invalidInput = 'invalid';
  try {
    validateFunction(invalidInput);
    expect.fail('Should have thrown CustomError');
  } catch (error) {
    expect((error as CustomError).code).toBe('ERROR_CODE');
  }
});
```

### Pattern 7: test.each() for Multiple Variants

```typescript
it.each([
  ['variant1', 'expected1'],
  ['variant2', 'expected2'],
  ['variant3', 'expected3'],
])('should handle %s', (input, expected) => {
  expect(functionUnderTest(input)).toBe(expected);
});
```

### Pattern 8: Constructor Validation Pattern

```typescript
it('should support early validation pattern in constructor', () => {
  class TestWorkflow {
    constructor(sessionPath: string) {
      validateBugfixSession(sessionPath);
    }
  }

  expect(() => new TestWorkflow('valid/path/bugfix/001')).not.toThrow();
  expect(() => new TestWorkflow('invalid/path/feature/001')).toThrow(BugfixSessionValidationError);
});
```

## Import Patterns

```typescript
// Vitest imports
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Source imports (use .js extension for ES modules)
import { validateBugfixSession, BugfixSessionValidationError } from '../../../../src/utils/validation/session-validation.js';
```

## Assertion Patterns

```typescript
// ToThrow for error checking
expect(() => functionCall()).toThrow(CustomError);

// not.toThrow for success path
expect(() => functionCall()).not.toThrow();

//toBeInstanceOf for type checking
expect(error).toBeInstanceOf(CustomError);

// toContain for substring checking
expect(message).toContain('expected substring');

// toBe for exact matching
expect(value).toBe(expected);

// toEqual for object matching
expect(object).toEqual(expectedObject);
```

## Mock/Cleanup Patterns

```typescript
describe('Feature', () => {
  beforeEach(() => {
    // No state to clear for this module
  });

  afterEach(() => {
    // No cleanup needed
  });
});
```

## Test Naming Conventions

- Test files: `*.test.ts`
- Test descriptions: `'should do something specific'` (lowercase, prescriptive)
- Test groups: `describe('Feature name', () => {})` (PascalCase feature)
- Nested groups: `describe('Sub-feature', () => {})` (specific aspect)

## File Organization

```
tests/
├── unit/
│   └── utils/
│       └── validation/
│           └── session-validation.test.ts  # ← Target file location
└── integration/
    └── ...
```

## Key Takeaways for PRP

1. **Use Vitest** - All validation tests use Vitest framework
2. **Group tests logically** - Use nested describe() blocks for organization
3. **Test both success and failure paths** - Always test both valid and invalid inputs
4. **Validate error messages** - Check that error messages contain useful context
5. **Test instanceof** - Verify error type and prototype chain
6. **Use test.each()** - For multiple similar test cases with different inputs
7. **Import with .js extension** - ES modules require .js extension in imports
8. **Clean test structure** - beforeEach/afterEach for setup/teardown
