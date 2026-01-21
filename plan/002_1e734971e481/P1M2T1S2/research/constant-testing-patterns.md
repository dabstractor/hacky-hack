# Constant Synchronization Testing Patterns

**Research Document:** Testing patterns for ensuring runtime values match compile-time constants

**Date:** 2026-01-15

**Status:** Research Complete

---

## Executive Summary

This document researches testing patterns for "constant synchronization" - ensuring that runtime values (like `process.env.VARIABLE`) match their corresponding compile-time constants (like `imported.CONSTANT`). This pattern is critical for avoiding configuration drift and maintaining "single source of truth" principles.

---

## Table of Contents

1. [Pattern Names and Terminology](#pattern-names-and-terminology)
2. [Core Testing Approaches](#core-testing-approaches)
3. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
4. [Best Practices](#best-practices)
5. [Real-World Examples](#real-world-examples)
6. [Open-Source References](#open-source-references)
7. [Implementation Patterns](#implementation-patterns)

---

## Pattern Names and Terminology

### Common Names for This Testing Pattern

The practice of testing that runtime values match compile-time constants goes by several names:

1. **Constant Synchronization Testing** - Most descriptive, emphasizes keeping values in sync
2. **Constant Verification Tests** - Focuses on verification aspect
3. **Configuration Synchronization Tests** - Broader, includes all config
4. **Runtime-Compile Time Consistency Tests** - Technical, precise
5. **Environment Constant Alignment Tests** - Specific to env vars
6. **Config-to-Constant Validation** - Describes the validation flow
7. **Schema Synchronization Testing** - Used in schema validation contexts

**Recommended Terminology:** Use **"Constant Synchronization Testing"** as the primary term, with "Constant Verification" as shorthand.

---

## Core Testing Approaches

### Approach 1: Import Constants and Compare (Recommended)

**Pattern:** Import the constants from source and assert that runtime values match them.

```typescript
// ✅ GOOD: Import and compare
import {
  DEFAULT_BASE_URL,
  MODEL_NAMES,
} from '../../../src/config/constants.js';
import { configureEnvironment } from '../../../src/config/environment.js';

describe('constant synchronization', () => {
  it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
    // SETUP: Clear any existing BASE_URL
    delete process.env.ANTHROPIC_BASE_URL;

    // EXECUTE: Configure environment
    configureEnvironment();

    // VERIFY: Runtime value matches compile-time constant
    expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
  });

  it('should return model names matching MODEL_NAMES constants', () => {
    // SETUP: No overrides
    delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;

    // EXECUTE & VERIFY: Runtime value matches constant
    expect(getModel('opus')).toBe(MODEL_NAMES.opus);
    expect(getModel('opus')).toBe('GLM-4.7'); // ✅ Also OK to be explicit
  });
});
```

**Benefits:**

- Single source of truth (the constant)
- Test fails if constant changes (forces conscious decision)
- Self-documenting (shows relationship)
- Type-safe with TypeScript
- Refactor-friendly (IDE can rename/extract)

**When to Use:**

- Testing default values
- Validating configuration mappings
- Ensuring environment setup matches constants

---

### Approach 2: Test Both Constant and Literal (Explicit)

**Pattern:** Assert against both the constant and the literal value for clarity.

```typescript
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';

it('should set default BASE_URL', () => {
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();

  // ✅ GOOD: Test both constant and explicit value
  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
  expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
});
```

**Benefits:**

- Maximum clarity for readers
- Documentation of expected value
- Catches both constant changes and logic errors

**When to Use:**

- Public API contracts
- Security-sensitive values
- Documentation examples

---

### Approach 3: Object/Array Synchronization

**Pattern:** Test that objects/arrays match their constant definitions.

```typescript
import {
  MODEL_NAMES,
  REQUIRED_ENV_VARS,
} from '../../../src/config/constants.js';

describe('object constant synchronization', () => {
  it('should have model tier mappings matching MODEL_NAMES constant', () => {
    expect(MODEL_NAMES.opus).toBe('GLM-4.7');
    expect(MODEL_NAMES.sonnet).toBe('GLM-4.7');
    expect(MODEL_NAMES.haiku).toBe('GLM-4.5-Air');
  });

  it('should have required env var names matching constant', () => {
    expect(REQUIRED_ENV_VARS.apiKey).toBe('ANTHROPIC_API_KEY');
    expect(REQUIRED_ENV_VARS.baseURL).toBe('ANTHROPIC_BASE_URL');
  });

  it('should ensure process.env keys match REQUIRED_ENV_VARS', () => {
    configureEnvironment();

    // After configuration, these should exist
    expect(process.env[REQUIRED_ENV_VARS.apiKey]).toBeDefined();
    expect(process.env[REQUIRED_ENV_VARS.baseURL]).toBeDefined();
  });
});
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Magic Strings Without Constants

**Problem:** Tests have duplicate literal values that can drift from constants.

```typescript
// ❌ BAD: Magic string that can drift
it('should set default BASE_URL', () => {
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
});

// If constant changes to 'https://api.newdomain.com', test still passes!
// But runtime code uses wrong value = BUG
```

**Why It's Bad:**

- Test passes even if constant changes (false positive)
- No clear relationship to source constant
- Hard to refactor
- Duplicates logic (DRY violation)

---

### ❌ Anti-Pattern 2: Not Testing Default Values

**Problem:** Tests only override scenarios, never validating defaults.

```typescript
// ❌ BAD: Only tests overrides, never validates defaults match constants
it('should use custom model from env', () => {
  vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', 'custom-model');
  expect(getModel('opus')).toBe('custom-model');
});

// Missing: Test that default matches MODEL_NAMES.opus constant
```

**Why It's Bad:**

- Defaults can change without test catching it
- Most common usage path is untested
- Configuration drift over time

---

### ❌ Anti-Pattern 3: Testing Implementation Details

**Problem:** Tests depend on internal structure rather than behavior.

```typescript
// ❌ BAD: Tests internal constant file structure
it('should have correct constant exports', () => {
  const constants = require('../../../src/config/constants.js');
  expect(Object.keys(constants)).toContain('DEFAULT_BASE_URL');
  expect(Object.keys(constants)).toContain('MODEL_NAMES');
});

// Better: Test behavior using the constants
```

**Why It's Bad:**

- Brittle to refactoring
- Doesn't test actual functionality
- False failures on valid refactors

---

## Best Practices

### ✅ Best Practice 1: Import Constants in Tests

**Always import and use constants in test assertions.**

```typescript
// ✅ GOOD
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';

expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
```

**Rationale:**

- Single source of truth
- Test fails if constant changes
- Clear relationship between test and code
- Type-safe with TypeScript

---

### ✅ Best Practice 2: Test Both Directions

**Test both that defaults match constants AND that overrides work.**

```typescript
// ✅ GOOD: Test default (constant match)
it('should return default model matching constant', () => {
  delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
  expect(getModel('opus')).toBe(MODEL_NAMES.opus);
});

// ✅ GOOD: Test override
it('should use env override when set', () => {
  vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', 'custom-model');
  expect(getModel('opus')).toBe('custom-model');
});
```

---

### ✅ Best Practice 3: Use `as const` Assertions

**Define constants with TypeScript `as const` for literal types.**

```typescript
// ✅ GOOD: const assertion enables literal types
export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;

export const MODEL_NAMES = {
  opus: 'GLM-4.7',
  sonnet: 'GLM-4.7',
  haiku: 'GLM-4.5-Air',
} as const;

// Now type is 'https://api.z.ai/api/anthropic', not string
```

**Benefits:**

- Prevents accidental reassignment
- Better type inference
- Catches typos at compile time

---

### ✅ Best Practice 4: Separate Test Constants

**Create test-specific constants when needed.**

```typescript
// test/helpers/test-constants.ts
export const TEST_TIMEOUT = 5000;
export const TEST_RETRY_COUNT = 3;

// Use in tests
import { TEST_TIMEOUT } from '../helpers/test-constants.js';
expect(timeout).toBe(TEST_TIMEOUT);
```

---

### ✅ Best Practice 5: Document the Synchronization

**Add comments explaining the synchronization relationship.**

```typescript
it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
  // This ensures runtime configuration matches compile-time constant
  // If DEFAULT_BASE_URL changes, this test will fail, forcing review
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();

  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
});
```

---

## Real-World Examples

### Example from This Codebase

**File:** `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`

**Current State (Anti-Pattern):**

```typescript
// ❌ CURRENT: Magic strings that can drift
it('should set default BASE_URL when not provided', () => {
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();

  expect(process.env.ANTHROPIC_BASE_URL).toBe(
    'https://api.z.ai/api/anthropic' // ❌ Magic string!
  );
});

it('should return default model for opus tier', () => {
  delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
  expect(getModel('opus')).toBe('GLM-4.7'); // ❌ Magic string!
});
```

**Improved Version (Best Practice):**

```typescript
// ✅ IMPROVED: Import constants
import {
  DEFAULT_BASE_URL,
  MODEL_NAMES,
} from '../../../src/config/constants.js';

it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();

  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
});

it('should return default model matching MODEL_NAMES constant', () => {
  delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
  expect(getModel('opus')).toBe(MODEL_NAMES.opus);
});
```

---

### Example: Setup File Verification

**File:** `/home/dustin/projects/hacky-hack/tests/unit/setup-verification.test.ts`

This test uses a good pattern of verifying behavior rather than structure:

```typescript
// ✅ GOOD: Tests behavior, not structure
it('should clear mock calls between tests - test 1', () => {
  mockLeakDetector('first-call');
  expect(mockLeakDetector).toHaveBeenCalledTimes(1);
});

it('should clear mock calls between tests - test 2', () => {
  // FAILS if vi.clearAllMocks() is NOT called in global beforeEach
  expect(mockLeakDetector).toHaveBeenCalledTimes(0);
});
```

---

## Open-Source References

Since web search is unavailable, here are well-known open-source projects that exemplify these patterns (based on general knowledge):

### 1. **Node.js Project Structure**

**Pattern:** Constant synchronization tests

**Reference:** Many Node.js projects test configuration constants

```typescript
// Example pattern used in Node.js projects
import { DEFAULT_PORT, HOST } from './constants.js';

describe('server configuration', () => {
  it('should use default port from constants', () => {
    expect(server.getPort()).toBe(DEFAULT_PORT);
  });
});
```

---

### 2. **TypeScript Configuration Testing**

**Pattern:** Type-safe constant validation

**Reference:** TypeScript projects often test config against constants

```typescript
import { CONFIG } from './config.js';

describe('configuration', () => {
  it('should have API endpoint matching constant', () => {
    expect(CONFIG.apiEndpoint).toBe(API_ENDPOINT);
  });
});
```

---

### 3. **React Testing Library Patterns**

**Pattern:** Avoid testing implementation details

**Reference:** `https://kentcdodds.com/blog/common-mistakes-with-react-testing-library-tests`

While not specifically about constants, RTL emphasizes testing behavior over implementation - a principle that applies to constant testing as well.

---

### 4. **Jest Snapshot Testing**

**Pattern:** Snapshot tests can detect constant changes

**Reference:** `https://jestjs.io/docs/snapshot-testing`

```typescript
// Snapshot tests catch unexpected constant changes
it('should match snapshot', () => {
  expect(getConfiguration()).toMatchSnapshot();
});
```

**Note:** Snapshots are useful but explicit constant comparison is better for catching changes.

---

## Implementation Patterns

### Pattern 1: Constant Import Helper

**Create a test helper that imports all constants.**

```typescript
// test/helpers/constants.ts
export * from '../../../src/config/constants.js';

// test/helpers/test-setup.ts
export function setupCleanEnvironment() {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
}

// Use in tests
import { DEFAULT_BASE_URL, MODEL_NAMES } from '../helpers/constants.js';
import { setupCleanEnvironment } from '../helpers/test-setup.js';

describe('config tests', () => {
  afterEach(setupCleanEnvironment);

  it('should use DEFAULT_BASE_URL', () => {
    expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
  });
});
```

---

### Pattern 2: Constant Synchronization Test Suite

**Create dedicated test suite for constant sync.**

```typescript
// tests/unit/config/constant-synchronization.test.ts
describe('constant synchronization', () => {
  describe('BASE_URL', () => {
    it('should match DEFAULT_BASE_URL constant', () => {
      delete process.env.ANTHROPIC_BASE_URL;
      configureEnvironment();
      expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
    });
  });

  describe('Model Names', () => {
    it('should match MODEL_NAMES constants', () => {
      expect(getModel('opus')).toBe(MODEL_NAMES.opus);
      expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);
      expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);
    });
  });

  describe('Environment Variable Names', () => {
    it('should match REQUIRED_ENV_VARS constant keys', () => {
      configureEnvironment();
      expect(process.env[REQUIRED_ENV_VARS.apiKey]).toBeDefined();
      expect(process.env[REQUIRED_ENV_VARS.baseURL]).toBeDefined();
    });
  });
});
```

---

### Pattern 3: Property-Based Testing

**Use property-based testing for constant validation.**

```typescript
import { test } from 'vitest';

test.each([
  ['opus', MODEL_NAMES.opus],
  ['sonnet', MODEL_NAMES.sonnet],
  ['haiku', MODEL_NAMES.haiku],
])('getModel(%s) should return matching constant', (tier, expectedModel) => {
  delete process.env[`ANTHROPIC_DEFAULT_${tier.toUpperCase()}_MODEL`];
  expect(getModel(tier)).toBe(expectedModel);
});
```

---

## Key Questions Answered

### Q: Should tests import constants and compare against them?

**Answer:** YES, absolutely.

**Rationale:**

- Ensures single source of truth
- Test fails if constant changes (forcing conscious review)
- Documents relationship between test and code
- Type-safe and refactor-friendly
- Prevents configuration drift

**Example:**

```typescript
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';

expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
```

---

### Q: What's the pattern name for this type of test?

**Answer:** "Constant Synchronization Testing" or "Constant Verification Tests"

**Also known as:**

- Configuration Synchronization Tests
- Runtime-Compile Time Consistency Tests
- Environment Constant Alignment Tests
- Config-to-Constant Validation

**Most common:** "Constant Synchronization Testing"

---

### Q: Are there anti-patterns to avoid?

**Answer:** YES, several critical anti-patterns:

1. **Magic Strings:** Don't hardcode values that should match constants
2. **Not Testing Defaults:** Always test default values match constants
3. **Testing Implementation:** Test behavior, not structure
4. **One-Way Testing:** Test both defaults AND overrides
5. **Implicit Relationships:** Make constant relationships explicit with imports

---

## Summary Checklist

### When Testing Constant Synchronization:

- [ ] Import constants from source file
- [ ] Assert runtime values match imported constants
- [ ] Test default values (not just overrides)
- [ ] Use `as const` for type safety
- [ ] Add explanatory comments
- [ ] Test both directions (defaults + overrides)
- [ ] Avoid magic strings
- [ ] Test behavior, not implementation
- [ ] Use descriptive test names
- [ ] Document why synchronization matters

---

## References

**Note:** Web search was unavailable during this research due to rate limits. This document is based on:

1. **Codebase Analysis:** Examined existing patterns in `/home/dustin/projects/hacky-hack`
2. **Testing Best Practices:** Standard testing principles from software engineering
3. **TypeScript Patterns:** TypeScript-specific constant handling patterns
4. **Established Conventions:** Common patterns from the broader testing community

**Key Files Analyzed:**

- `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`
- `/home/dustin/projects/hacky-hack/src/config/constants.ts`
- `/home/dustin/projects/hacky-hack/src/config/environment.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/setup-verification.test.ts`

---

## Next Steps

Based on this research:

1. **Update existing tests** to import and compare against constants
2. **Add constant synchronization test suite** for comprehensive coverage
3. **Document patterns** in team testing guidelines
4. **Consider linting rules** to prevent magic strings in tests
5. **Add pre-commit hooks** to validate constant imports

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Author:** Research based on codebase analysis and testing best practices
