# Action Plan: Constant Synchronization Testing

**Target:** Apply constant testing patterns to `/home/dustin/projects/hacky-hack` codebase

**Date:** 2026-01-15

---

## Executive Summary

This document provides specific, actionable steps to improve constant synchronization testing in the current codebase. Based on research findings and codebase analysis, we identified several instances where tests use "magic strings" instead of comparing against imported constants.

---

## Current State Analysis

### Files Requiring Updates

#### 1. `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`

**Issues Found:**

- Uses magic strings for `DEFAULT_BASE_URL`
- Uses magic strings for model names
- Tests default values without importing constants

**Impact:** Medium - Configuration tests could pass even if constants change

---

## Specific Action Items

### Priority 1: Fix Magic Strings in environment.test.ts

#### File: `tests/unit/config/environment.test.ts`

**Current Issues:**

```typescript
// ❌ Line 83-85: Magic string
expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');

// ❌ Line 108: Magic string
expect(getModel('opus')).toBe('GLM-4.7');

// ❌ Line 116: Magic string
expect(getModel('sonnet')).toBe('GLM-4.7');

// ❌ Line 124: Magic string
expect(getModel('haiku')).toBe('GLM-4.5-Air');
```

**Required Changes:**

1. **Add import statement:**

```typescript
// Add to imports at top of file
import {
  DEFAULT_BASE_URL,
  MODEL_NAMES,
} from '../../../src/config/constants.js';
```

2. **Update tests (line 75-86):**

```typescript
// BEFORE:
it('should set default BASE_URL when not provided', () => {
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
});

// AFTER:
it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
});
```

3. **Update model tests (lines 103-125):**

```typescript
// BEFORE:
describe('getModel', () => {
  it('should return default model for opus tier', () => {
    delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
    expect(getModel('opus')).toBe('GLM-4.7');
  });
  // ... more tests
});

// AFTER:
describe('getModel', () => {
  it('should return default model matching MODEL_NAMES.opus', () => {
    delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
    expect(getModel('opus')).toBe(MODEL_NAMES.opus);
  });

  it('should return default model matching MODEL_NAMES.sonnet', () => {
    delete process.env.ANTHROPIC_DEFAULT_SONNET_MODEL;
    expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);
  });

  it('should return default model matching MODEL_NAMES.haiku', () => {
    delete process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
    expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);
  });
  // ... override tests remain the same
});
```

4. **Update custom URL test (lines 88-99):**

```typescript
// BEFORE:
it('should preserve custom BASE_URL when already set', () => {
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://custom.endpoint.com/api');
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe(
    'https://custom.endpoint.com/api'
  );
});

// AFTER:
it('should preserve custom BASE_URL when already set', () => {
  const customUrl = 'https://custom.endpoint.com/api';
  vi.stubEnv('ANTHROPIC_BASE_URL', customUrl);
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe(customUrl);
});
```

---

### Priority 2: Add Constant Synchronization Test Suite

**Create new file:** `tests/unit/config/constant-synchronization.test.ts`

```typescript
/**
 * Constant synchronization tests
 *
 * @remarks
 * These tests verify that runtime values match compile-time constants.
 * This ensures configuration values don't drift from their source of truth.
 *
 * If any of these tests fail after changing a constant, it means:
 * 1. The constant changed (intentional) - update the test
 * 2. Runtime logic changed (unintentional) - fix the bug
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configureEnvironment,
  getModel,
} from '../../../src/config/environment.js';
import {
  DEFAULT_BASE_URL,
  MODEL_NAMES,
  REQUIRED_ENV_VARS,
} from '../../../src/config/constants.js';

describe('config: constant synchronization', () => {
  // CLEANUP: Restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('BASE_URL constant synchronization', () => {
    it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
      // SETUP: Clear any existing BASE_URL
      delete process.env.ANTHROPIC_BASE_URL;

      // EXECUTE: Configure environment
      configureEnvironment();

      // VERIFY: Runtime value matches compile-time constant
      expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
      expect(process.env.ANTHROPIC_BASE_URL).toBe(
        'https://api.z.ai/api/anthropic'
      );
    });

    it('should preserve custom BASE_URL when provided', () => {
      // SETUP: Custom URL
      const customUrl = 'https://custom.example.com/api';
      vi.stubEnv('ANTHROPIC_BASE_URL', customUrl);

      // EXECUTE
      configureEnvironment();

      // VERIFY: Custom value is preserved (not replaced with constant)
      expect(process.env.ANTHROPIC_BASE_URL).toBe(customUrl);
      expect(process.env.ANTHROPIC_BASE_URL).not.toBe(DEFAULT_BASE_URL);
    });
  });

  describe('MODEL_NAMES constant synchronization', () => {
    it('should return opus model matching MODEL_NAMES.opus constant', () => {
      // SETUP: No override
      delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;

      // EXECUTE & VERIFY
      expect(getModel('opus')).toBe(MODEL_NAMES.opus);
      expect(getModel('opus')).toBe('GLM-4.7');
    });

    it('should return sonnet model matching MODEL_NAMES.sonnet constant', () => {
      // SETUP: No override
      delete process.env.ANTHROPIC_DEFAULT_SONNET_MODEL;

      // EXECUTE & VERIFY
      expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);
      expect(getModel('sonnet')).toBe('GLM-4.7');
    });

    it('should return haiku model matching MODEL_NAMES.haiku constant', () => {
      // SETUP: No override
      delete process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;

      // EXECUTE & VERIFY
      expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);
      expect(getModel('haiku')).toBe('GLM-4.5-Air');
    });
  });

  describe('REQUIRED_ENV_VARS constant synchronization', () => {
    it('should have API_KEY env var matching REQUIRED_ENV_VARS.apiKey', () => {
      // SETUP: Configure environment
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
      configureEnvironment();

      // VERIFY: The env var named in constant exists
      expect(process.env[REQUIRED_ENV_VARS.apiKey]).toBeDefined();
      expect(process.env[REQUIRED_ENV_VARS.apiKey]).toBe('test-token');
    });

    it('should have BASE_URL env var matching REQUIRED_ENV_VARS.baseURL', () => {
      // SETUP: Configure environment
      configureEnvironment();

      // VERIFY: The env var named in constant exists
      expect(process.env[REQUIRED_ENV_VARS.baseURL]).toBeDefined();
      expect(process.env[REQUIRED_ENV_VARS.baseURL]).toBe(DEFAULT_BASE_URL);
    });
  });

  describe('constant immutability', () => {
    it('should have DEFAULT_BASE_URL as const (immutable)', () => {
      // TypeScript const assertion prevents reassignment
      // This test documents the immutability expectation
      expect(DEFAULT_BASE_URL).toBe('https://api.z.ai/api/anthropic');
    });

    it('should have MODEL_NAMES with correct literal types', () => {
      expect(MODEL_NAMES.opus).toBe('GLM-4.7');
      expect(MODEL_NAMES.sonnet).toBe('GLM-4.7');
      expect(MODEL_NAMES.haiku).toBe('GLM-4.5-Air');
    });
  });
});
```

---

### Priority 3: Update Documentation

**Update:** `tests/unit/config/README.md` (create if doesn't exist)

```markdown
# Configuration Tests

This directory contains tests for environment configuration and constant synchronization.

## Test Files

- `environment.test.ts` - Tests for environment variable mapping and validation
- `constant-synchronization.test.ts` - Tests verifying runtime values match compile-time constants

## Testing Philosophy

### Constant Synchronization

We import constants from `src/config/constants.ts` and assert that runtime values match them. This ensures:

1. **Single Source of Truth:** Constants are the authoritative values
2. **Fail Fast:** Tests catch when constants change
3. **No Drift:** Runtime values can't drift from compile-time expectations
4. **Refactor Safety:** IDEs can track constant usage across tests

### Example

\`\`\`typescript
// ✅ GOOD: Import and compare
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';

expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);

// ❌ BAD: Magic string
expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
\`\`\`

## Coverage

- Environment variable mapping (AUTH_TOKEN → API_KEY)
- Default value application (BASE_URL, model names)
- Environment variable validation
- Constant synchronization (runtime matches compile-time)
```

---

## Implementation Checklist

### Phase 1: Fix Existing Tests

- [ ] Add constant imports to `environment.test.ts`
- [ ] Replace magic string for `DEFAULT_BASE_URL`
- [ ] Replace magic strings for model names (opus, sonnet, haiku)
- [ ] Update test descriptions to mention constant names
- [ ] Run tests to verify changes work correctly

### Phase 2: Add New Test Suite

- [ ] Create `constant-synchronization.test.ts`
- [ ] Add BASE_URL synchronization tests
- [ ] Add MODEL_NAMES synchronization tests
- [ ] Add REQUIRED_ENV_VARS synchronization tests
- [ ] Add immutability documentation tests
- [ ] Run new test suite to verify it passes

### Phase 3: Documentation

- [ ] Create/update `tests/unit/config/README.md`
- [ ] Document constant synchronization pattern
- [ ] Add examples of good vs bad patterns
- [ ] Update team testing guidelines

### Phase 4: Verification

- [ ] Run full test suite: `npm test`
- [ ] Check for any new test failures
- [ ] Verify test coverage hasn't decreased
- [ ] Review changes with team

---

## Expected Outcomes

### After Implementation

1. **Improved Reliability:** Tests will catch constant changes
2. **Better Documentation:** Test names show constant relationships
3. **Easier Refactoring:** IDE can track constant usage
4. **Single Source of Truth:** Constants are authoritative
5. **No Magic Strings:** All values trace to constants

### Risk Mitigation

- Tests may initially fail if constants have already drifted
- This is GOOD - it reveals existing issues
- Review and fix any failures deliberately
- Document why values differ if intentional

---

## Testing Commands

```bash
# Run specific test file
npm test -- tests/unit/config/environment.test.ts

# Run new constant synchronization tests
npm test -- tests/unit/config/constant-synchronization.test.ts

# Run all config tests
npm test -- tests/unit/config/

# Run with coverage
npm test -- --coverage tests/unit/config/

# Watch mode during development
npm test -- --watch tests/unit/config/
```

---

## Code Review Checklist

When reviewing these changes, verify:

- [ ] Constants are imported from correct path
- [ ] All magic strings are replaced with constants
- [ ] Test descriptions mention constant names
- [ ] Tests still pass after changes
- [ ] No new magic strings introduced
- [ ] Documentation is updated
- [ ] Team is notified of pattern change

---

## Migration Path for Other Tests

After completing config tests, apply pattern to:

1. **Agent tests** - Model configuration constants
2. **Logger tests** - Log level constants
3. **Validation tests** - Error code constants
4. **Integration tests** - Endpoint URL constants

### Search for Magic Strings

```bash
# Find potential magic strings in tests
grep -r "toBe('" tests/ | grep -v "node_modules" | grep -v ".snap"

# Find toEqual with potential magic strings
grep -r "toEqual({" tests/ | grep -v "node_modules" | grep -v ".snap"
```

---

## Success Metrics

- [ ] Zero magic strings in config tests
- [ ] All runtime values compared against constants
- [ ] Test coverage maintained or improved
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained on pattern

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Status:** Ready for Implementation
**Related:**

- `constant-testing-patterns.md` - Research findings
- `code-examples.md` - Code examples and patterns
