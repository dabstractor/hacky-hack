# Research Notes: P1.M2.T1.S1 - Test AUTH_TOKEN to API_KEY mapping

**Research Date**: 2026-01-15
**Researcher**: Claude (PRP Research Agent)

---

## Executive Summary

The test file `tests/unit/config/environment.test.ts` already exists with comprehensive coverage of the `configureEnvironment()` function. The only missing test is **idempotency** - verifying that calling `configureEnvironment()` multiple times produces consistent results.

**Key Finding**: This PRP adds a single test case, not a new test file.

---

## Current State Analysis

### Existing Test Coverage

| Test Name | Line Range | Status |
|-----------|------------|--------|
| should map AUTH_TOKEN to API_KEY when API_KEY is not set | 26-36 | ✅ EXISTS |
| should preserve existing API_KEY when AUTH_TOKEN is also set | 38-48 | ✅ EXISTS |
| should set default BASE_URL when not provided | 50-61 | ✅ EXISTS |
| should preserve custom BASE_URL when already set | 63-74 | ✅ EXISTS |
| **should be idempotent - calling multiple times produces same result** | **N/A** | ❌ MISSING |

### configureEnvironment() Implementation

**File**: `src/config/environment.ts` (lines 55-65)

```typescript
export function configureEnvironment(): void {
  // Map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if API_KEY is not already set
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL if not already provided
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
  }
}
```

**Idempotency Guarantee**: The function uses conditional checks (`!process.env.ANTHROPIC_API_KEY`) which means once values are set, subsequent calls won't overwrite them. This is the behavior we need to test.

---

## Test Pattern Analysis

### Existing Test Structure

```typescript
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

    // ... more tests
  });
});
```

### Key Patterns Identified

1. **Comment Style**: `// SETUP:`, `// EXECUTE:`, `// VERIFY:`
2. **Environment Setup**: Use `vi.stubEnv()` and `delete`
3. **Cleanup**: Global `afterEach` with `vi.unstubAllEnvs()`
4. **Test Naming**: `"should [verb] [condition]"`
5. **Assertion Style**: `expect().toBe()` for primitives

---

## Vitest Environment Variable Testing

### Official Documentation

**Main Reference**: https://vitest.dev/guide/mocking.html#environment-variables
**API Reference**: https://vitest.dev/api/vi.html#stubenv

### Key APIs

| Function | Purpose |
|----------|---------|
| `vi.stubEnv(name, value)` | Set environment variable (with proper cleanup) |
| `vi.unstubAllEnvs()` | Restore all stubbed environment variables |

### Best Practices

1. **Always use `vi.stubEnv()`** instead of direct `process.env` manipulation
2. **Always call `vi.unstubAllEnvs()`** in cleanup (global afterEach already handles this)
3. **Clear existing values** before setting up test using `delete`
4. **Test isolation** is ensured by proper cleanup

---

## Implementation Plan

### New Test Case

**Location**: `tests/unit/config/environment.test.ts`, after line 48

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
  expect(firstResult.baseUrl).toBe('https://api.z.ai/api/anthropic');
});
```

### What This Test Validates

1. **First call**: Sets `ANTHROPIC_API_KEY` from `ANTHROPIC_AUTH_TOKEN`
2. **Second call**: Does NOT overwrite `ANTHROPIC_API_KEY` (already set)
3. **First call**: Sets `ANTHROPIC_BASE_URL` to default
4. **Second call**: Does NOT overwrite `ANTHROPIC_BASE_URL` (already set)

---

## Context for Next Tasks

### P1.M2.T1.S2: Test default BASE_URL configuration

The existing tests already cover BASE_URL default behavior:
- "should set default BASE_URL when not provided" (line 50-61)
- "should preserve custom BASE_URL when already set" (line 63-74)

**Note**: P1.M2.T1.S2 may also need to verify existing tests are complete.

### P1.M2.T1.S3: Test model configuration tier mapping

The `getModel()` function is already tested in `tests/unit/config/environment.test.ts` (lines 77-125).

---

## Environment Configuration Architecture

### Shell Convention vs SDK Expectation

| Context | Variable Name | Purpose |
|---------|---------------|---------|
| Shell | `ANTHROPIC_AUTH_TOKEN` | Authentication token (shell environment) |
| SDK | `ANTHROPIC_API_KEY` | Expected by Anthropic SDK |

**Critical**: The application must map between these.

### API Endpoint

| Variable | Value |
|----------|-------|
| `ANTHROPIC_BASE_URL` | `https://api.z.ai/api/anthropic` |

**Documentation**: See `plan/001_14b9dc2a33c7/architecture/environment_config.md`

---

## Validation Commands

```bash
# Run the specific test file
npm test -- tests/unit/config/environment.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/config/environment.test.ts

# Run specific test
npm test -- -t "should be idempotent"

# Verify 100% coverage
npm run test:coverage
```

---

## Potential Edge Cases

### Edge Case 1: Environment Changes Between Calls

**Scenario**: What if the environment changes between calls to `configureEnvironment()`?

**Current Test**: Does NOT cover this scenario (out of scope for this PRP)

**Recommendation**: Consider adding a test that verifies:
1. Call `configureEnvironment()` with AUTH_TOKEN="token1"
2. Change AUTH_TOKEN to "token2"
3. Call `configureEnvironment()` again
4. Verify API_KEY remains "token1" (not overwritten)

### Edge Case 2: Empty String Values

**Scenario**: What if `ANTHROPIC_AUTH_TOKEN` is an empty string?

**Current Implementation**: The condition `process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY` treats empty string as falsy, so mapping won't occur.

**Test Coverage**: Not explicitly tested (could be added in future)

### Edge Case 3: Undefined Values

**Scenario**: What if environment variables are explicitly set to `undefined`?

**Current Implementation**: The `delete` operation removes the variable entirely. This is the correct approach.

---

## References

### Internal Documentation

- `plan/001_14b9dc2a33c7/architecture/environment_config.md` - Environment configuration guide
- `plan/002_1e734971e481/P1M1T2S3/PRP.md` - Previous PRP for MCP tool registration

### External Documentation

- Vitest Mocking: https://vitest.dev/guide/mocking.html
- Vitest API: https://vitest.dev/api/vi.html

### Source Files

- `src/config/environment.ts` - Implementation
- `tests/unit/config/environment.test.ts` - Existing tests
- `tests/setup.ts` - Global test setup
- `vitest.config.ts` - Test configuration

---

## Conclusion

The PRP for P1.M2.T1.S1 is straightforward: add a single idempotency test to an existing, well-structured test file. The test follows established patterns and integrates seamlessly with the existing test suite.

**Confidence Score**: 10/10 - All context is complete and specific.
