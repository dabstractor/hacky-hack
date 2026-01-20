# Vitest Environment Variable Testing Best Practices

**Research Date:** 2025-01-15
**Researcher:** Claude Code Agent
**Related Task:** P1.M2.T1.S2 - Test default BASE_URL configuration

---

## Executive Summary

This research document addresses three critical questions about Vitest environment variable testing:

1. **`vi.stubEnv()` vs `vi.stubGlobalEnv()`**: Clarifying the correct API
2. **Best practices for testing default configuration values**: How to test constants
3. **Test isolation patterns**: Proper cleanup with environment variables

**Key Finding:** `vi.stubGlobalEnv()` does not exist in Vitest. The correct API is `vi.stubEnv()`. The contract definition in tasks.json contains a typo that should be corrected.

---

## 1. vi.stubEnv() vs vi.stubGlobalEnv()

### Finding: `stubGlobalEnv` Does Not Exist

After searching the Vitest v1.6.1 type definitions (installed in this project), **`vi.stubGlobalEnv()` does not exist**.

The correct Vitest APIs are:

| API | Purpose | Type Definition |
|-----|---------|-----------------|
| `vi.stubEnv(name, value)` | Stub `process.env` and `import.meta.env` | `<T extends string>(name: T, value: T extends 'PROD' \| 'DEV' \| 'SSR' ? boolean : string) => VitestUtils` |
| `vi.stubGlobal(name, value)` | Stub global variables | `(name: string \| symbol \| number, value: unknown) => VitestUtils` |
| `vi.unstubAllEnvs()` | Restore all environment variables | `() => VitestUtils` |
| `vi.unstubAllGlobals()` | Restore all global variables | `() => VitestUtils` |

**Source:** `/home/dustin/projects/hacky-hack/node_modules/vitest/dist/index.d.ts`

```typescript
/**
 * Changes the value of `import.meta.env` and `process.env`.
 * You can return it back to original value with `vi.unstubAllEnvs`, or by enabling `unstubEnvs` config option.
 */
stubEnv: <T extends string>(name: T, value: T extends 'PROD' | 'DEV' | 'SSR' ? boolean : string) => VitestUtils;

/**
 * Reset environmental variables to the ones that were available before first `vi.stubEnv` was called.
 */
unstubAllEnvs: () => VitestUtils;
```

### Recommendation

**Update the contract definition** in `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/tasks.json`:

**Line 122** (P1.M2.T1.S1 contract definition):
```diff
- 3. LOGIC: Create test file at tests/unit/config/environment.test.ts. Test 1: Set process.env.ANTHROPIC_AUTH_TOKEN = 'test_token', clear ANTHROPIC_API_KEY, call configureEnvironment(), verify process.env.ANTHROPIC_API_KEY === 'test_token'. Test 2: Verify mapping doesn't override existing API_KEY if already set. Test 3: Verify mapping is idempotent (calling multiple times doesn't change result). Use vi.stubGlobalEnv() and vi.unstubAllEnvs() for isolation. Follow test patterns from tests/unit/config/.
+ 3. LOGIC: Create test file at tests/unit/config/environment.test.ts. Test 1: Set process.env.ANTHROPIC_AUTH_TOKEN = 'test_token', clear ANTHROPIC_API_KEY, call configureEnvironment(), verify process.env.ANTHROPIC_API_KEY === 'test_token'. Test 2: Verify mapping doesn't override existing API_KEY if already set. Test 3: Verify mapping is idempotent (calling multiple times doesn't change result). Use vi.stubEnv() and vi.unstubAllEnvs() for isolation. Follow test patterns from tests/unit/config/.
```

**Line 133** (P1.M2.T1.S2 contract definition):
```diff
- 3. LOGIC: Extend tests/unit/config/environment.test.ts. Test 1: Clear ANTHROPIC_BASE_URL, call configureEnvironment(), verify process.env.ANTHROPIC_BASE_URL === 'https://api.z.ai/api/anthropic'. Test 2: Set custom BASE_URL before configureEnvironment(), verify it's preserved (not overridden). Test 3: Verify default matches constant DEFAULT_BASE_URL from constants.ts. Use vi.stubGlobalEnv() for isolation.
+ 3. LOGIC: Extend tests/unit/config/environment.test.ts. Test 1: Clear ANTHROPIC_BASE_URL, call configureEnvironment(), verify process.env.ANTHROPIC_BASE_URL === 'https://api.z.ai/api/anthropic'. Test 2: Set custom BASE_URL before configureEnvironment(), verify it's preserved (not overridden). Test 3: Verify default matches constant DEFAULT_BASE_URL from constants.ts. Use vi.stubEnv() for isolation.
```

---

## 2. Best Practices for Testing Default Configuration Values

### Pattern: Constant Synchronization Testing

When testing that a default value matches a constant import, there are two approaches:

#### Approach 1: Import and Compare (Recommended)

**Best for:** Ensuring the runtime value matches the constant

```typescript
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';
import { configureEnvironment } from '../../../src/config/environment.js';

describe('default BASE_URL configuration', () => {
  it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
    // SETUP: Clear any existing BASE_URL
    delete process.env.ANTHROPIC_BASE_URL;

    // EXECUTE
    configureEnvironment();

    // VERIFY: Default matches the constant
    expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
  });
});
```

**Advantages:**
- ✅ Ensures runtime behavior matches the constant
- ✅ Fails if constant is changed but `configureEnvironment()` is not updated
- ✅ Tests the actual code path
- ✅ Single source of truth (the constant)

**Disadvantages:**
- Requires importing the constant
- Tests implementation details

#### Approach 2: Hardcode Expected Value

**Best for:** Testing against a specification/contract

```typescript
describe('default BASE_URL configuration', () => {
  it('should set default z.ai endpoint', () => {
    // SETUP: Clear any existing BASE_URL
    delete process.env.ANTHROPIC_BASE_URL;

    // EXECUTE
    configureEnvironment();

    // VERIFY: Default z.ai endpoint (per specification)
    expect(process.env.ANTHROPIC_BASE_URL).toBe(
      'https://api.z.ai/api/anthropic'
    );
  });
});
```

**Advantages:**
- ✅ Tests against specification/contract
- ✅ No import dependency
- ✅ Clear documentation of expected behavior

**Disadvantages:**
- ❌ Doesn't detect if constant is changed
- ❌ Duplicate definition (DRY violation)

### Recommended Pattern for This Project

**Use Approach 1 (Import and Compare)** for the following reasons:

1. **The project already has a well-defined constant** (`DEFAULT_BASE_URL` in `/src/config/constants.ts`)
2. **The constant serves as single source of truth**
3. **This prevents drift between the constant and runtime behavior**
4. **Aligns with existing test patterns** in the codebase

### Example from Existing Codebase

The current test suite (`/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`) uses Approach 2 (hardcoded values):

```typescript
it('should set default BASE_URL when not provided', () => {
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe(
    'https://api.z.ai/api/anthropic'  // Hardcoded value
  );
});
```

**Recommendation:** Update this test to use Approach 1:

```typescript
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';

it('should set default BASE_URL when not provided', () => {
  delete process.env.ANTHROPIC_BASE_URL;
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);  // Use constant
});
```

### Testing Model Configuration (Multiple Constants)

For model configuration with multiple constants, use a data-driven test pattern:

```typescript
import { MODEL_NAMES, MODEL_ENV_VARS } from '../../../src/config/constants.js';
import { getModel } from '../../../src/config/environment.js';

describe('getModel default values', () => {
  it.each([
    ['opus', MODEL_NAMES.opus],
    ['sonnet', MODEL_NAMES.sonnet],
    ['haiku', MODEL_NAMES.haiku],
  ])('should return %s for %s tier', (tier, expectedModel) => {
    // SETUP: Clear environment override
    delete process.env[MODEL_ENV_VARS[tier]];

    // EXECUTE & VERIFY
    expect(getModel(tier)).toBe(expectedModel);
  });
});
```

---

## 3. Test Isolation Patterns

### Best Practice: Always Clean Up Environment Variables

**Rule:** Always use `vi.unstubAllEnvs()` in `afterEach` hooks when stubbing environment variables.

#### Pattern 1: afterEach in Test File (Recommended for Specific Tests)

```typescript
import { afterEach, vi } from 'vitest';

describe('environment configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('test with env vars', () => {
    vi.stubEnv('API_KEY', 'test-key');
    // test code
  });

  it('another test with env vars', () => {
    vi.stubEnv('API_KEY', 'different-key');
    // test code - isolated from previous test
  });
});
```

#### Pattern 2: Global Setup (Current Project Approach)

The project already implements global cleanup in `/home/dustin/projects/hacky-hack/tests/setup.ts`:

```typescript
afterEach(() => {
  // CLEANUP: Restore all environment variable stubs
  // This prevents environment variable leaks between tests
  vi.unstubAllEnvs();

  // CLEANUP: Force garbage collection if available
  // Requires Node.js to be started with --expose-gc flag
  // This helps manage memory in long-running test suites
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

**Advantages:**
- ✅ Automatic cleanup for all tests
- ✅ Prevents environment variable leaks across the entire test suite
- ✅ No need to remember cleanup in individual test files

**Disadvantages:**
- ⚠️ May hide issues in tests that forget to clean up (but this is generally acceptable)

### Gotchas with Environment Variable Testing

#### Gotcha 1: process.env vs vi.stubEnv()

**❌ Wrong:** Directly modifying `process.env`

```typescript
// BAD: Direct modification
delete process.env.API_KEY;
process.env.API_KEY = 'test-value';
```

**Why it's wrong:**
- Changes persist across tests (isolation violation)
- No automatic cleanup mechanism
- Can't be restored with `vi.unstubAllEnvs()`

**✅ Correct:** Using `vi.stubEnv()`

```typescript
// GOOD: Using Vitest stubbing
vi.stubEnv('API_KEY', 'test-value');
```

**Why it's correct:**
- Automatic cleanup with `vi.unstubAllEnvs()`
- Proper test isolation
- Mocks both `process.env` AND `import.meta.env` (Vite-specific)

#### Gotcha 2: Delete vs Stub Empty String

**❌ Wrong:** Using `delete` to clear environment variables

```typescript
// BAD: Using delete
delete process.env.API_KEY;
```

**Issue:** If you're using `vi.stubEnv()`, `delete` may not work as expected because Vitest has stubbed the property.

**✅ Correct:** Stub with empty string or undefined

```typescript
// GOOD: Stub with empty string
vi.stubEnv('API_KEY', '');

// OR: Stub with undefined (if your code handles undefined)
vi.stubEnv('API_KEY', undefined as any);
```

**Note:** The current codebase uses `delete process.env.VARIABLE` before calling `configureEnvironment()`. This works because `configureEnvironment()` reads from the actual `process.env` before any stubbing occurs. However, once you've used `vi.stubEnv()`, you should continue using stubs for that test.

#### Gotcha 3: Order of Operations

**Scenario:** Testing that `configureEnvironment()` sets a default value.

**❌ Wrong:** Stubbing before clearing

```typescript
// BAD: Stubbing then deleting (doesn't work)
vi.stubEnv('ANTHROPIC_BASE_URL', 'custom-value');
delete process.env.ANTHROPIC_BASE_URL;
configureEnvironment();
// RESULT: BASE_URL might still be 'custom-value'
```

**✅ Correct:** Clear first, then test

```typescript
// GOOD: Clear in beforeEach, then test
beforeEach(() => {
  vi.unstubAllEnvs();  // Clear all stubs
  delete process.env.ANTHROPIC_BASE_URL;  // Clear actual env
});

it('should set default', () => {
  configureEnvironment();
  expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
});
```

#### Gotcha 4: Module Import Caching

**Issue:** Environment variables read at module import time are cached.

```typescript
// config.ts
const apiKey = process.env.API_KEY;  // Read at import time

// test.ts
import { config } from './config.js';
vi.stubEnv('API_KEY', 'new-value');
console.log(config.apiKey);  // Still has old value!
```

**Solution:** Read environment variables dynamically, not at import time.

```typescript
// config.ts (BETTER)
export function getConfig() {
  return {
    apiKey: process.env.API_KEY,  // Read when called
  };
}

// test.ts
vi.stubEnv('API_KEY', 'new-value');
console.log(getConfig().apiKey);  // Has new value!
```

**This project's approach:** The `configureEnvironment()` function reads from `process.env` at call time, which is the correct pattern.

---

## Summary of Recommendations

### For P1.M2.T1.S2 (Test default BASE_URL configuration)

1. **Fix the contract typo:** Replace `vi.stubGlobalEnv()` with `vi.stubEnv()` in tasks.json
2. **Use constant synchronization:** Import `DEFAULT_BASE_URL` and compare against it
3. **Follow existing patterns:** The test file already exists at `/tests/unit/config/environment.test.ts`
4. **Leverage global cleanup:** The project already has `vi.unstubAllEnvs()` in global setup

### Example Implementation

```typescript
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';
import { configureEnvironment } from '../../../src/config/environment.js';

describe('default BASE_URL configuration', () => {
  it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
    // SETUP: Clear any existing BASE_URL
    delete process.env.ANTHROPIC_BASE_URL;

    // EXECUTE
    configureEnvironment();

    // VERIFY: Default matches the constant (ensures synchronization)
    expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
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
```

---

## References

### Official Documentation
- **Vitest GitHub:** https://github.com/vitest-dev/vitest
- **Vitest Documentation:** https://vitest.dev/
- **Vitest API Reference:** https://vitest.dev/api/

### Local Files
- **Vitest Type Definitions:** `/home/dustin/projects/hacky-hack/node_modules/vitest/dist/index.d.ts`
- **Project Test Setup:** `/home/dustin/projects/hacky-hack/tests/setup.ts`
- **Environment Configuration Tests:** `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`
- **Constants Module:** `/home/dustin/projects/hacky-hack/src/config/constants.ts`
- **Environment Module:** `/home/dustin/projects/hacky-hack/src/config/environment.ts`

### Related Research
- **Environment Setup Documentation:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/environment_setup.md`
- **Test Memory Cleanup Research:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/test-memory-cleanup-research.md`

---

## Appendices

### Appendix A: Vitest Environment Variable API Reference

```typescript
// Stub an environment variable
vi.stubEnv(name: string, value: string): VitestUtils

// Restore all environment variables to their original values
vi.unstubAllEnvs(): VitestUtils

// Stub a global variable (not env vars)
vi.stubGlobal(name: string | symbol | number, value: unknown): VitestUtils

// Restore all global variables
vi.unstubAllGlobals(): VitestUtils
```

### Appendix B: Configuration Options

**Vitest Config (vitest.config.ts):**

```typescript
export default defineConfig({
  test: {
    // Automatically unstub envs after each test (if not using manual cleanup)
    unstubEnvs: true,

    // Automatically unstub globals after each test
    unstubGlobals: true,

    // Global setup file (already configured in this project)
    setupFiles: ['./tests/setup.ts'],
  },
});
```

**Note:** This project uses manual cleanup via `afterEach(() => vi.unstubAllEnvs())` in the global setup file, which provides more explicit control.

### Appendix C: Test Pattern Checklist

- [x] Use `vi.stubEnv()` instead of direct `process.env` manipulation
- [x] Always clean up with `vi.unstubAllEnvs()` in `afterEach`
- [x] Test default values against constant imports (constant synchronization)
- [x] Clear environment variables before testing default behavior
- [x] Use data-driven tests for multiple similar cases
- [x] Document why specific patterns are used in test comments
