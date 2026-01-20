# Model Tier Testing Patterns Research

## Overview

This document compiles best practices for testing model configuration tier mapping in TypeScript/Vitest projects, with specific focus on the `hacky-hack` project's environment configuration system where `ModelTier = 'opus' | 'sonnet' | 'haiku'`.

**Sources:**
- [Vitest Documentation](https://vitest.dev/guide/)
- [Vitest API Reference - expect](https://vitest.dev/api/expect.html)
- [TypeScript Documentation - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Documentation - Const Assertions](https://www.typescriptlang.org/docs/handbook/2/objects-and-arrays.html#const-assertions)
- Existing test patterns in `/home/dustin/projects/hacky-hack/tests/`

---

## 1. Environment Variable Override Mechanisms

### 1.1 Using `vi.stubEnv()` for Environment Variable Testing

**Pattern:** Use `vi.stubEnv()` to set environment variables in tests and `vi.unstubAllEnvs()` for cleanup.

**Example from existing codebase:**
```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('configureEnvironment', () => {
  // CLEANUP: Always restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should map AUTH_TOKEN to API_KEY when API_KEY is not set', () => {
    // SETUP: Clear API_KEY, set AUTH_TOKEN
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-123');

    // EXECUTE
    configureEnvironment();

    // VERIFY: API_KEY should be set from AUTH_TOKEN
    expect(process.env.ANTHROPIC_API_KEY).toBe('test-token-123');
  });
});
```

**Best Practices:**

1. **Always clean up after tests:** Use `afterEach` with `vi.unstubAllEnvs()` to prevent test pollution.
2. **Clear existing variables first:** Use `delete process.env.VAR_NAME` before setting new values to ensure clean state.
3. **Test both presence and absence:** Test scenarios with and without environment variables set.
4. **Use descriptive test names:** Clearly indicate what environment state is being tested.

**Common Pitfalls:**

- **Not cleaning up:** Environment variables persist between tests, causing flaky behavior.
- **Assuming initial state:** Don't assume environment variables are unset; explicitly clear them.
- **Using process.env directly:** Prefer `vi.stubEnv()` over direct assignment for better test isolation.

---

## 2. Default Value Testing Patterns

### 2.1 Testing Functions with Environment-Based Defaults

**Pattern:** Test both the default path (no environment variable) and the override path (environment variable set).

**Example from existing codebase:**
```typescript
describe('getModel', () => {
  it('should return default model for opus tier', () => {
    // SETUP: No override
    delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;

    // EXECUTE & VERIFY
    expect(getModel('opus')).toBe('GLM-4.7');
  });

  it('should use environment override for opus tier', () => {
    // SETUP: Override via env var
    vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', 'custom-opus-model');

    // EXECUTE & VERIFY
    expect(getModel('opus')).toBe('custom-opus-model');
  });
});
```

**Best Practices:**

1. **Test all union type variants:** For `ModelTier = 'opus' | 'sonnet' | 'haiku'`, test each tier.
2. **Test nullish coalescing:** Verify the `??` operator works correctly when env var is `undefined` or empty string.
3. **Use `beforeEach` for common setup:** If multiple tests need clean state, set it up once.

**Common Pitfalls:**

- **Not testing all variants:** Only testing 'opus' but not 'sonnet' or 'haiku'.
- **Forgetting empty string:** `process.env[VAR]` can be `''`, which is falsy but distinct from `undefined`.
- **Not testing default values:** Assuming defaults work without explicit tests.

---

## 3. Testing Type-Safe Enums/Union Types

### 3.1 Union Type Exhaustiveness Testing

**Pattern:** Use `as const` arrays to define valid values and iterate through them to ensure all cases are tested.

**Example pattern:**
```typescript
describe('ModelTier exhaustiveness', () => {
  const validTiers = ['opus', 'sonnet', 'haiku'] as const;
  type ModelTier = typeof validTiers[number];

  validTiers.forEach((tier) => {
    it(`should accept valid tier: ${tier}`, () => {
      // SETUP: Define valid model for tier
      delete process.env[`ANTHROPIC_DEFAULT_${tier.toUpperCase()}_MODEL`];

      // EXECUTE & VERIFY
      expect(getModel(tier as ModelTier)).toBeDefined();
      expect(typeof getModel(tier as ModelTier)).toBe('string');
    });
  });

  it('should reject invalid tier at compile time', () => {
    // This would cause a TypeScript error:
    // const invalid: ModelTier = 'invalid';
    // Use @ts-expect-error or @ts-ignore if testing runtime validation
  });
});
```

**Best Practices:**

1. **Use `as const` for literal types:** Preserves literal values instead of widening to `string[]`.
2. **Iterate through values:** Use `forEach` to generate tests for each union variant.
3. **Test type safety:** Verify that invalid values are rejected at compile time.
4. **Use type guards:** Create `isModelTier()` function for runtime validation.

**Common Pitfalls:**

- **Not using `as const`:** Arrays become `string[]` instead of readonly tuple of literals.
- **Missing variants:** Adding new union members without updating tests.
- **Testing with `any`:** Using type assertions that bypass TypeScript checks.

---

## 4. Error Testing with `expect().toThrow()` Patterns

### 4.1 Basic Error Throwing Tests

**Pattern:** Use `expect().toThrow()` to verify functions throw expected errors.

**Example from existing codebase:**
```typescript
describe('validateEnvironment', () => {
  it('should throw when API_KEY is missing', () => {
    // SETUP: Missing API_KEY
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

    // EXECUTE & VERIFY
    expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
  });

  it('should pass when all required variables are set', () => {
    // SETUP: All required vars present
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

    // EXECUTE & VERIFY: Should not throw
    expect(() => validateEnvironment()).not.toThrow();
  });
});
```

### 4.2 Error Object Property Testing

**Pattern:** Use try-catch to verify error object properties.

**Example from existing codebase:**
```typescript
it('should include missing variable name in error', () => {
  // SETUP: Missing API_KEY only
  delete process.env.ANTHROPIC_API_KEY;
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

  // EXECUTE
  try {
    validateEnvironment();
    // If we get here, test should fail
    expect(true).toBe(false);
  } catch (e) {
    // VERIFY: Error has missing property with correct variable name
    expect(e).toBeInstanceOf(EnvironmentValidationError);
    if (e instanceof EnvironmentValidationError) {
      expect(e.missing).toEqual(['ANTHROPIC_API_KEY']);
    }
  }
});
```

**Best Practices:**

1. **Test both throw and not-throw:** Verify error conditions and success conditions.
2. **Check error type:** Use `toBeInstanceOf()` for custom error classes.
3. **Verify error properties:** Use type guards to check custom error properties.
4. **Use arrow functions:** Wrap the function call in an arrow function to defer execution.

**Common Pitfalls:**

- **Calling function directly:** `expect(validateEnvironment()).toThrow()` calls the function immediately.
- **Not checking error type:** Only verifying that something is thrown, not the specific error.
- **Assuming error properties:** Not verifying custom error properties like `missing[]` array.

---

## 5. Testing `const`-Assigned Objects

### 5.1 Testing Const Assertions (`as const`)

**Pattern:** Use `as const` to create immutable, type-preserving constants.

**Example from existing codebase:**
```typescript
// constants.ts
export const MODEL_NAMES = {
  opus: 'GLM-4.7',
  sonnet: 'GLM-4.7',
  haiku: 'GLM-4.5-Air',
} as const;

// Test file
describe('MODEL_NAMES constant', () => {
  it('should have readonly properties', () => {
    // Type system enforces readonly, but we can test runtime behavior
    const original = MODEL_NAMES.opus;
    expect(MODEL_NAMES.opus).toBe('GLM-4.7');

    // Attempting to modify would be a TypeScript error
    // MODEL_NAMES.opus = 'modified'; // Error: Cannot assign to 'opus'
  });

  it('should preserve literal types', () => {
    // After as const, values are literal types not string
    type OpusModel = typeof MODEL_NAMES.opus; // 'GLM-4.7' not string
    const opus: OpusModel = MODEL_NAMES.opus;
    expect(opus).toBe('GLM-4.7');
  });

  it('should have all expected keys', () => {
    expect(Object.keys(MODEL_NAMES)).toEqual(['opus', 'sonnet', 'haiku']);
  });
});
```

**Best Practices:**

1. **Use `as const` for configuration:** Ensures type safety and immutability.
2. **Export types from constants:** Derive types like `type OpusModel = typeof MODEL_NAMES.opus`.
3. **Test object shape:** Verify all expected keys exist.
4. **Test readonly behavior:** Attempting mutation should fail at compile time.

**Common Pitfalls:**

- **Not using `as const`:** Properties become `string` instead of literal types like `'GLM-4.7'`.
- **Assuming runtime immutability:** `as const` is a compile-time construct; runtime mutation is still possible with workarounds.
- **Not deriving types:** Missing opportunity to use generated types in function signatures.

---

## 6. Union Type Exhaustiveness Checking

### 6.1 TypeScript Exhaustiveness Pattern

**Pattern:** Use `never` type to ensure all union variants are handled.

**Example pattern:**
```typescript
type ModelTier = 'opus' | 'sonnet' | 'haiku';

function getModelName(tier: ModelTier): string {
  switch (tier) {
    case 'opus':
      return 'GLM-4.7';
    case 'sonnet':
      return 'GLM-4.7';
    case 'haiku':
      return 'GLM-4.5-Air';
    default:
      // If a new tier is added to ModelTier, this will cause TypeScript error
      const exhaustiveCheck: never = tier;
      return exhaustiveCheck;
  }
}

// Test to verify exhaustiveness
describe('getModelName exhaustiveness', () => {
  const tiers: ModelTier[] = ['opus', 'sonnet', 'haiku'];

  tiers.forEach((tier) => {
    it(`should handle ${tier} without throwing`, () => {
      expect(() => getModelName(tier)).not.toThrow();
      expect(getModelName(tier)).toMatch(/^GLM-/);
    });
  });
});
```

**Best Practices:**

1. **Use default case with `never`:** Ensures compile-time error when new variants are added.
2. **Test all variants explicitly:** Don't rely on TypeScript alone; add tests for each case.
3. **Use discriminated unions:** For complex objects, use a `kind` or `type` discriminator.
4. **Create helper functions:** Build reusable functions for exhaustive checking.

**Common Pitfalls:**

- **Not using default case:** Missing the `never` check defeats the purpose.
- **Using `any` in default case:** Using `return tier as never` bypasses type safety.
- **Forgetting to test new variants:** TypeScript enforces it, but tests should verify runtime behavior.

---

## 7. Complete Example: Model Tier Testing

### 7.1 Comprehensive Test Suite

Here's a complete test suite for model tier configuration:

```typescript
/**
 * Unit tests for model tier mapping
 *
 * @remarks
 * Tests validate model tier selection, environment overrides,
 * default values, and error handling with 100% coverage.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getModel, configureEnvironment, validateEnvironment } from './environment.js';
import { MODEL_NAMES, MODEL_ENV_VARS } from './constants.js';
import { EnvironmentValidationError } from './types.js';

describe('Model Tier Configuration', () => {
  // CLEANUP: Always restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getModel() - Default Values', () => {
    const modelTiers = ['opus', 'sonnet', 'haiku'] as const;

    modelTiers.forEach((tier) => {
      it(`should return default model for ${tier}`, () => {
        // SETUP: Clear override env var
        delete process.env[MODEL_ENV_VARS[tier]];

        // EXECUTE & VERIFY
        expect(getModel(tier)).toBe(MODEL_NAMES[tier]);
      });
    });
  });

  describe('getModel() - Environment Overrides', () => {
    const modelTiers = ['opus', 'sonnet', 'haiku'] as const;

    modelTiers.forEach((tier) => {
      it(`should use env override for ${tier}`, () => {
        // SETUP: Set custom model via env var
        const customModel = `custom-${tier}-model`;
        vi.stubEnv(MODEL_ENV_VARS[tier], customModel);

        // EXECUTE & VERIFY
        expect(getModel(tier)).toBe(customModel);
      });
    });
  });

  describe('configureEnvironment() - Idempotency', () => {
    it('should produce identical results on multiple calls', () => {
      // SETUP: Clear all env vars
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_BASE_URL;
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');

      // EXECUTE: Call twice
      configureEnvironment();
      const firstCall = {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
      };

      configureEnvironment();
      const secondCall = {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
      };

      // VERIFY: Results should be identical
      expect(firstCall).toEqual(secondCall);
    });
  });

  describe('validateEnvironment() - Error Handling', () => {
    it('should throw with single missing variable', () => {
      // SETUP: Missing API_KEY only
      delete process.env.ANTHROPIC_API_KEY;
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

      // EXECUTE & VERIFY
      expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

      try {
        validateEnvironment();
        expect(true).toBe(false); // Should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(EnvironmentValidationError);
        if (e instanceof EnvironmentValidationError) {
          expect(e.missing).toEqual(['ANTHROPIC_API_KEY']);
        }
      }
    });

    it('should throw with multiple missing variables', () => {
      // SETUP: Both missing
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_BASE_URL;

      // EXECUTE
      try {
        validateEnvironment();
        expect(true).toBe(false);
      } catch (e) {
        // VERIFY: Error includes both missing variables
        expect(e).toBeInstanceOf(EnvironmentValidationError);
        if (e instanceof EnvironmentValidationError) {
          expect(e.missing).toContain('ANTHROPIC_API_KEY');
          expect(e.missing).toContain('ANTHROPIC_BASE_URL');
          expect(e.missing).toHaveLength(2);
        }
      }
    });

    it('should not throw when all variables present', () => {
      // SETUP: All required vars
      vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

      // EXECUTE & VERIFY
      expect(() => validateEnvironment()).not.toThrow();
    });
  });
});
```

---

## 8. Common Testing Scenarios

### 8.1 Testing Functions That Return Different Values Based on Input

**Pattern:** Use test cases array to parameterize tests.

```typescript
describe('getModel()', () => {
  const testCases = [
    { tier: 'opus' as const, expectedDefault: 'GLM-4.7', envVar: 'ANTHROPIC_DEFAULT_OPUS_MODEL' },
    { tier: 'sonnet' as const, expectedDefault: 'GLM-4.7', envVar: 'ANTHROPIC_DEFAULT_SONNET_MODEL' },
    { tier: 'haiku' as const, expectedDefault: 'GLM-4.5-Air', envVar: 'ANTHROPIC_DEFAULT_HAIKU_MODEL' },
  ];

  testCases.forEach(({ tier, expectedDefault, envVar }) => {
    describe(`tier: ${tier}`, () => {
      it('should return default value', () => {
        delete process.env[envVar];
        expect(getModel(tier)).toBe(expectedDefault);
      });

      it('should return env override when set', () => {
        vi.stubEnv(envVar, `custom-${tier}`);
        expect(getModel(tier)).toBe(`custom-${tier}`);
      });
    });
  });
});
```

### 8.2 Testing Invalid Input Handling

**Pattern:** Test edge cases and invalid inputs.

```typescript
describe('Invalid input handling', () => {
  it('should handle empty string env vars', () => {
    vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', '');
    // Empty string is falsy, so ?? should use default
    expect(getModel('opus')).toBe(MODEL_NAMES.opus);
  });

  it('should handle whitespace in env vars', () => {
    vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', '  custom-model  ');
    // Whitespace is preserved unless trimmed by implementation
    expect(getModel('opus')).toBe('  custom-model  ');
  });

  it('should handle special characters in model names', () => {
    const specialModel = 'GLM-4.7-Turbo@2024';
    vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', specialModel);
    expect(getModel('opus')).toBe(specialModel);
  });
});
```

---

## 9. Best Practices Summary

### 9.1 Test Structure

1. **AAA Pattern:** Arrange-Act-Assert (or Setup-Execute-Verify)
2. **Descriptive names:** Test names should describe the scenario and expected outcome
3. **Single assertion:** Prefer one assertion per test for clarity
4. **Test isolation:** Each test should be independent and clean up after itself

### 9.2 Environment Variable Testing

1. **Always use `vi.stubEnv()`:** Better isolation than direct `process.env` assignment
2. **Always clean up:** Use `afterEach` with `vi.unstubAllEnvs()`
3. **Clear before setting:** Use `delete process.env.VAR` before `vi.stubEnv()`
4. **Test both paths:** Test with and without environment variables

### 9.3 TypeScript Type Safety

1. **Use `as const` for literals:** Preserves literal types in arrays and objects
2. **Test exhaustiveness:** Use `never` type in switch default cases
3. **Derive types:** Export types derived from constants (`type Tier = typeof MODEL_NAMES[keyof typeof MODEL_NAMES]`)
4. **Use type guards:** Create `isX()` functions for runtime type checking

### 9.4 Error Testing

1. **Test error types:** Use `toThrow(CustomError)` not just `toThrow()`
2. **Verify error properties:** Use type guards to check custom properties
3. **Test success cases:** Don't only test error conditions
4. **Use try-catch:** For detailed error property verification

---

## 10. Common Pitfalls to Avoid

### 10.1 Test Isolation Issues

```typescript
// BAD: Environment persists between tests
it('sets API_KEY', () => {
  process.env.ANTHROPIC_API_KEY = 'key1';
  expect(process.env.ANTHROPIC_API_KEY).toBe('key1');
});

it('checks API_KEY', () => {
  // This test fails because the previous test polluted the environment
  expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
});

// GOOD: Clean up after each test
afterEach(() => {
  vi.unstubAllEnvs();
});

it('sets API_KEY', () => {
  vi.stubEnv('ANTHROPIC_API_KEY', 'key1');
  expect(process.env.ANTHROPIC_API_KEY).toBe('key1');
});

it('checks API_KEY', () => {
  // Environment is clean
  expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
});
```

### 10.2 Type Safety Issues

```typescript
// BAD: Type assertion bypasses safety
const tier = 'invalid' as ModelTier;
expect(getModel(tier)).toBe('something'); // No compile-time error

// GOOD: Use type guards or const arrays
const validTiers = ['opus', 'sonnet', 'haiku'] as const;
validTiers.forEach((tier) => {
  expect(getModel(tier)).toBeDefined();
});
```

### 10.3 Error Testing Issues

```typescript
// BAD: Function is called immediately, not wrapped
expect(validateEnvironment()).toThrow(); // Always fails if no error thrown

// GOOD: Arrow function defers execution
expect(() => validateEnvironment()).toThrow();
```

---

## 11. Additional Resources

### 11.1 Vitest Documentation

- [Vitest Mocking - vi.stubEnv](https://vitest.dev/guide/mocking.html#vi-stubenv)
- [Vitest Expect API](https://vitest.dev/api/expect.html#tothrow)
- [Test Context](https://vitest.dev/api/#test-context)

### 11.2 TypeScript Documentation

- [TypeScript Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Const Assertions](https://www.typescriptlang.org/docs/handbook/2/objects-and-arrays.html#const-assertions)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

### 11.3 Internal Project References

- `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts` - Environment configuration tests
- `/home/dustin/projects/hacky-hack/src/config/types.ts` - ModelTier type definition
- `/home/dustin/projects/hacky-hack/src/config/constants.ts` - MODEL_NAMES and MODEL_ENV_VARS constants
- `/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts` - Error testing patterns
- `/home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts` - Union type testing examples

---

## Appendix: Quick Reference

### vi.stubEnv() Cheat Sheet

```typescript
// Set environment variable
vi.stubEnv('MY_VAR', 'value');

// Clear environment variable
delete process.env.MY_VAR;

// Clean up all stubbed variables
vi.unstubAllEnvs();

// Best practice: clean up in afterEach
afterEach(() => {
  vi.unstubAllEnvs();
});
```

### toThrow() Cheat Sheet

```typescript
// Basic error check
expect(() => fn()).toThrow();

// Specific error type
expect(() => fn()).toThrow(CustomError);

// Error message match
expect(() => fn()).toThrow('specific message');
expect(() => fn()).toThrow(/regex pattern/);

// No error thrown
expect(() => fn()).not.toThrow();
```

### Union Type Testing Cheat Sheet

```typescript
// Define union type
type ModelTier = 'opus' | 'sonnet' | 'haiku';

// Create const array for iteration
const tiers = ['opus', 'sonnet', 'haiku'] as const;

// Test each variant
tiers.forEach((tier) => {
  it(`works for ${tier}`, () => {
    expect(getModel(tier)).toBeDefined();
  });
});

// Exhaustiveness check
function handleTier(tier: ModelTier): string {
  switch (tier) {
    case 'opus': return 'high';
    case 'sonnet': return 'medium';
    case 'haiku': return 'low';
    default:
      const _exhaustive: never = tier; // Error if new tier added
      return _exhaustive;
  }
}
```
