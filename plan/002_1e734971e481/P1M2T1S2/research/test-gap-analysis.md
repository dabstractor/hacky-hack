# Test Gap Analysis: P1.M2.T1.S2 - Default BASE_URL Configuration

**Date**: 2026-01-15
**Test File**: `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`
**Subtask**: P1.M2.T1.S2 - Test default BASE_URL configuration

---

## Executive Summary

The existing test suite for BASE_URL configuration has a **critical synchronization gap**: the test verifies the default BASE_URL against a hardcoded string literal rather than importing and comparing against the source-of-truth constant (`DEFAULT_BASE_URL`) from `constants.ts`. This creates a maintenance liability where changes to the constant would not be caught by the test.

---

## Current Test Behavior

### Existing Tests (Lines 75-99)

**Test 1: "should set default BASE_URL when not provided"** (lines 75-86)

```typescript
it('should set default BASE_URL when not provided', () => {
  // SETUP: No BASE_URL set
  delete process.env.ANTHROPIC_BASE_URL;

  // EXECUTE
  configureEnvironment();

  // VERIFY: Default z.ai endpoint
  expect(process.env.ANTHROPIC_BASE_URL).toBe(
    'https://api.z.ai/api/anthropic' // ❌ HARDCODED STRING
  );
});
```

**Test 2: "should preserve custom BASE_URL when already set"** (lines 88-99)

```typescript
it('should preserve custom BASE_URL when already set', () => {
  // SETUP: Custom BASE_URL
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://custom.endpoint.com/api');

  // EXECUTE
  configureEnvironment();

  // VERIFY: Custom URL preserved
  expect(process.env.ANTHROPIC_BASE_URL).toBe(
    'https://custom.endpoint.com/api'
  );
});
```

**Test 3: Idempotency check from P1.M2.T1.S1** (lines 50-73)

```typescript
it('should be idempotent - calling multiple times produces same result', () => {
  // ... setup code ...
  expect(firstResult.baseUrl).toBe('https://api.z.ai/api/anthropic'); // ❌ HARDCODED
});
```

---

## The Specific Gap: Constant Synchronization

### Problem Statement

The contract definition for P1.M2.T1.S2 states:

> **Test 3**: Verify default matches constant `DEFAULT_BASE_URL` from constants.ts

However, the current implementation:

- ❌ Does **not** import `DEFAULT_BASE_URL` from `constants.ts`
- ❌ Uses hardcoded string `'https://api.z.ai/api/anthropic'` in three locations
- ❌ Creates a **false sense of security** - test passes even if constant changes

### Source of Truth

**File**: `/home/dustin/projects/hacky-hack/src/config/constants.ts` (Line 22)

```typescript
export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;
```

**File**: `/home/dustin/projects/hacky-hack/src/config/environment.ts` (Line 63)

```typescript
process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
```

The implementation correctly uses the constant, but the test does not validate this relationship.

---

## Risk Analysis

### What Happens If Someone Changes `DEFAULT_BASE_URL`?

**Scenario**: Developer changes `constants.ts`:

```typescript
// Before
export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;

// After (hypothetical change)
export const DEFAULT_BASE_URL = 'https://api.z.ai/v2/anthropic' as const;
```

**Current Test Behavior**:

- ✅ Test **still passes** (hardcoded string unchanged)
- ❌ Code now uses **different URL** than test expects
- ❌ Test provides **false coverage** - thinks it's validating the constant

**Desired Test Behavior**:

- ✅ Test **fails** (detects constant changed)
- ✅ Forces developer to **update test consciously**
- ✅ Maintains **test-to-code synchronization**

---

## Comparison with P1.M2.T1.S1 Approach

### S1 Idempotency Test Pattern (Lines 50-73)

The idempotency test added in P1.M2.T1.S1 demonstrates the correct pattern:

```typescript
it('should be idempotent - calling multiple times produces same result', () => {
  // EXECUTE: Call configureEnvironment() twice
  configureEnvironment();
  const firstResult = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  };

  configureEnvironment();
  const secondResult = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  };

  // VERIFY: Results should be identical
  expect(firstResult).toEqual(secondResult);
});
```

**Key Pattern**: Compare **actual results** between calls, not against hardcoded values.

### S2 Should Follow Similar Pattern

**Recommended Approach**: Import the constant and compare against it:

```typescript
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';

it('should set default BASE_URL from constants.ts', () => {
  // SETUP: No BASE_URL set
  delete process.env.ANTHROPIC_BASE_URL;

  // EXECUTE
  configureEnvironment();

  // VERIFY: Default matches source-of-truth constant
  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
});
```

---

## Recommended Approach

### 1. Import the Constant

**Add to imports** (Line 11-17):

```typescript
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureEnvironment,
  getModel,
  validateEnvironment,
  EnvironmentValidationError,
} from '../../../src/config/environment.js';
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js'; // ✅ ADD THIS
```

### 2. Update Test 1 - Default BASE_URL Verification

**Replace hardcoded string** (Lines 75-86):

```typescript
it('should set default BASE_URL from constants.ts', () => {
  // SETUP: No BASE_URL set
  delete process.env.ANTHROPIC_BASE_URL;

  // EXECUTE
  configureEnvironment();

  // VERIFY: Default matches source-of-truth constant
  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
  expect(DEFAULT_BASE_URL).toBe('https://api.z.ai/api/anthropic'); // Document expected value
});
```

### 3. Update Test 3 - Idempotency Check

**Replace hardcoded string** (Lines 72, 83):

```typescript
it('should be idempotent - calling multiple times produces same result', () => {
  // SETUP: Set AUTH_TOKEN, clear API_KEY and BASE_URL
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_BASE_URL;
  vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-456');

  // EXECUTE: Call configureEnvironment() twice
  configureEnvironment();
  const firstResult = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  };

  configureEnvironment();
  const secondResult = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  };

  // VERIFY: Results should be identical
  expect(firstResult).toEqual(secondResult);
  expect(firstResult.apiKey).toBe('test-token-456');
  expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL); // ✅ USE CONSTANT
});
```

### 4. Add Explicit Constant Value Test

**New test for constant documentation**:

```typescript
it('should document expected DEFAULT_BASE_URL value', () => {
  // VERIFY: Constant has expected value (defensive documentation)
  expect(DEFAULT_BASE_URL).toBe('https://api.z.ai/api/anthropic');
  expect(DEFAULT_BASE_URL).not.toBe('https://api.anthropic.com'); // Safety check
});
```

---

## Code Example: Complete Improved Test

```typescript
/**
 * Unit tests for environment configuration module
 *
 * @remarks
 * Tests validate environment variable mapping, model selection, and validation
 * with 100% code coverage of src/config/environment.ts
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureEnvironment,
  getModel,
  validateEnvironment,
  EnvironmentValidationError,
} from '../../../src/config/environment.js';
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js'; // ✅ IMPORT CONSTANT

describe('config/environment', () => {
  // CLEANUP: Always restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('configureEnvironment', () => {
    it('should map AUTH_TOKEN to API_KEY when API_KEY is not set', () => {
      // SETUP: Clear API_KEY, set AUTH_TOKEN
      delete process.env.ANTHROPIC_API_KEY;
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-123');

      // EXECUTE
      configureEnvironment();

      // VERIFY: API_KEY should be set from AUTH_TOKEN
      expect(process.env.ANTHROPIC_API_KEY).toBe('test-token-123');
    });

    it('should preserve existing API_KEY when AUTH_TOKEN is also set', () => {
      // SETUP: Both API_KEY and AUTH_TOKEN set
      vi.stubEnv('ANTHROPIC_API_KEY', 'original-api-key');
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'different-auth-token');

      // EXECUTE
      configureEnvironment();

      // VERIFY: API_KEY should NOT be overwritten
      expect(process.env.ANTHROPIC_API_KEY).toBe('original-api-key');
    });

    it('should be idempotent - calling multiple times produces same result', () => {
      // SETUP: Set AUTH_TOKEN, clear API_KEY and BASE_URL
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_BASE_URL;
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-456');

      // EXECUTE: Call configureEnvironment() twice
      configureEnvironment();
      const firstResult = {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
      };

      configureEnvironment();
      const secondResult = {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
      };

      // VERIFY: Results should be identical
      expect(firstResult).toEqual(secondResult);
      expect(firstResult.apiKey).toBe('test-token-456');
      expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL); // ✅ USE CONSTANT
    });

    it('should set default BASE_URL from constants.ts', () => {
      // SETUP: No BASE_URL set
      delete process.env.ANTHROPIC_BASE_URL;

      // EXECUTE
      configureEnvironment();

      // VERIFY: Default matches source-of-truth constant
      expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
    });

    it('should document expected DEFAULT_BASE_URL value', () => {
      // VERIFY: Constant has expected value (defensive documentation)
      expect(DEFAULT_BASE_URL).toBe('https://api.z.ai/api/anthropic');
      expect(DEFAULT_BASE_URL).not.toBe('https://api.anthropic.com'); // Safety check
    });

    it('should preserve custom BASE_URL when already set', () => {
      // SETUP: Custom BASE_URL
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://custom.endpoint.com/api');

      // EXECUTE
      configureEnvironment();

      // VERIFY: Custom URL preserved
      expect(process.env.ANTHROPIC_BASE_URL).toBe(
        'https://custom.endpoint.com/api'
      );
    });
  });

  // ... rest of test file unchanged ...
});
```

---

## Benefits of This Approach

### 1. **Synchronization Guarantees**

- ✅ Test fails if `DEFAULT_BASE_URL` constant changes
- ✅ Forces conscious decision when updating the constant
- ✅ Prevents silent drift between test and implementation

### 2. **Single Source of Truth**

- ✅ Both code and test reference same constant
- ✅ Changes propagate through import relationship
- ✅ Reduces duplication from 3 locations to 1

### 3. **Defensive Documentation**

- ✅ Explicit test documents expected constant value
- ✅ Safety check prevents accidental use of production API
- ✅ Self-documenting test intent

### 4. **Maintainability**

- ✅ Future changes require only updating `constants.ts`
- ✅ Test suite automatically validates the change
- ✅ Reduces cognitive load for developers

---

## Implementation Checklist

- [ ] Import `DEFAULT_BASE_URL` from `constants.ts`
- [ ] Replace hardcoded string in Test 1 (lines 75-86)
- [ ] Replace hardcoded string in Test 3 (line 72)
- [ ] Add explicit constant value documentation test
- [ ] Verify all tests pass after changes
- [ ] Run test suite with modified constant to verify failure detection
- [ ] Document test coverage in P1.M2.T1.S2 completion notes

---

## Conclusion

The gap is clear: the current test uses hardcoded strings instead of importing the source-of-truth constant. This creates a maintenance liability where changes to `DEFAULT_BASE_URL` would not be detected by the test suite. The recommended approach follows the pattern established in P1.M2.T1.S1 by importing constants and comparing against them, ensuring test-to-code synchronization and providing defensive documentation of expected values.
