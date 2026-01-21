# Product Requirement Prompt (PRP): Test AUTH_TOKEN to API_KEY mapping

**PRP ID**: P1.M2.T1.S1
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Add the missing idempotency test to `tests/unit/config/environment.test.ts` to verify that calling `configureEnvironment()` multiple times produces consistent results and doesn't cause unintended side effects.

**Deliverable**: Additional test case in `tests/unit/config/environment.test.ts` under the `describe('configureEnvironment')` block that tests idempotency of the `configureEnvironment()` function.

**Success Definition**:

- Test 1 (existing): AUTH_TOKEN→API_KEY mapping when API_KEY is not set - already exists at lines 26-36
- Test 2 (existing): Preserving existing API_KEY when AUTH_TOKEN is also set - already exists at lines 38-48
- Test 3 (NEW): Verify `configureEnvironment()` is idempotent - calling multiple times produces same result
- All tests pass: `npm test -- tests/unit/config/environment.test.ts`
- Test follows existing patterns in the file (SETUP/EXECUTE/VERIFY comments, afterEach cleanup)
- Test uses `vi.stubEnv()` and `vi.unstubAllEnvs()` for environment variable isolation

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: First validation step in Phase 1 Milestone 2 (P1.M2) to verify that environment variable mapping from shell convention (`ANTHROPIC_AUTH_TOKEN`) to SDK expectation (`ANTHROPIC_API_KEY`) works correctly, including idempotency guarantees.

**User Journey**:

1. Pipeline completes P1.M1 (Groundswell Integration & Validation) with success
2. Pipeline starts P1.M2 (Environment Configuration & API Safety)
3. Pipeline starts P1.M2.T1 (Validate environment variable mapping)
4. First subtask S1: Test AUTH_TOKEN to API_KEY mapping
5. Test suite runs with idempotency test added
6. Verifies `configureEnvironment()` can be called multiple times safely
7. If all tests pass: Proceed to P1.M2.T1.S2 (Test default BASE_URL configuration)
8. If tests fail: Document specific issues for debugging

**Pain Points Addressed**:

- Missing idempotency test could allow bugs where repeated calls to `configureEnvironment()` cause unexpected behavior
- Without idempotency testing, it's unclear if `configureEnvironment()` is safe to call multiple times
- Tests need to verify the function doesn't overwrite values on subsequent calls
- Edge case: What happens if `configureEnvironment()` is called, environment changes, then called again?

---

## Why

- **Foundation for Environment Configuration**: `configureEnvironment()` is called at application startup in `src/index.ts`. Idempotency ensures it can be called safely without side effects.
- **Critical Pattern Validation**: The AUTH_TOKEN→API_KEY mapping is core to the application's compatibility with both shell conventions and Anthropic SDK.
- **Safety Guarantee**: Idempotency prevents bugs where calling the function multiple times (e.g., in tests, re-initialization) causes unexpected state changes.
- **Problems Solved**:
  - Verifies `configureEnvironment()` preserves existing values on subsequent calls
  - Confirms the function doesn't overwrite `ANTHROPIC_API_KEY` if it's already set (even from previous `configureEnvironment()` call)
  - Ensures the function is safe to call multiple times in different contexts
  - Validates the mapping logic is deterministic and predictable

---

## What

Add a new test case to verify `configureEnvironment()` idempotency.

### Test Context

**Current State**: The test file `tests/unit/config/environment.test.ts` exists with:

- Test 1: "should map AUTH_TOKEN to API_KEY when API_KEY is not set" (lines 26-36)
- Test 2: "should preserve existing API_KEY when AUTH_TOKEN is also set" (lines 38-48)
- Test 3: "should set default BASE_URL when not provided" (lines 50-61)
- Test 4: "should preserve custom BASE_URL when already set" (lines 63-74)
- Plus tests for `getModel()` and `validateEnvironment()`

**Gap**: No test verifies that calling `configureEnvironment()` multiple times is idempotent.

### New Test Requirement

**Test 3: Idempotency Test**

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

### Success Criteria

- [ ] Test 3 added to `tests/unit/config/environment.test.ts`
- [ ] Test verifies idempotency with AUTH_TOKEN→API_KEY mapping
- [ ] Test verifies idempotency with BASE_URL default
- [ ] Test follows existing patterns (SETUP/EXECUTE/VERIFY comments)
- [ ] Test uses `vi.stubEnv()` for environment setup
- [ ] Test uses `afterEach` cleanup via `vi.unstubAllEnvs()` (already in place)
- [ ] All existing tests still pass
- [ ] New test passes consistently

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] `configureEnvironment()` function implementation documented
- [x] AUTH_TOKEN→API_KEY mapping logic understood
- [x] BASE_URL default behavior understood
- [x] Existing test patterns analyzed
- [x] Vitest environment variable testing patterns documented
- [x] Test file structure and naming conventions identified
- [x] Cleanup patterns (`vi.unstubAllEnvs()`) documented

---

### Documentation & References

```yaml
# MUST READ - Contract definition from PRD
- docfile: plan/002_1e734971e481/current_prd.md
  why: Contains the work item contract definition for this subtask
  section: P1.M2.T1.S1 contract definition
  critical: Specifies exact test requirements including idempotency

# MUST READ - Source implementation
- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Contains configureEnvironment() implementation to understand behavior
  section: Lines 55-65 (configureEnvironment function)
  critical: |
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
    Key insight: The function checks !process.env.ANTHROPIC_API_KEY before mapping,
    which means once set, subsequent calls won't overwrite it. This is the idempotency guarantee.

# MUST READ - Existing test file
- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Contains existing tests and patterns to follow
  section: Lines 25-75 (configureEnvironment test suite)
  critical: |
    - afterEach cleanup: vi.unstubAllEnvs() (line 21-23)
    - Test pattern: SETUP/EXECUTE/VERIFY comments
    - Environment setup: vi.stubEnv() for setting, delete for clearing
    - Assertion pattern: expect(process.env.VARIABLE).toBe(expected)
  gotcha: The file already has comprehensive coverage, only idempotency is missing

# MUST READ - Environment configuration documentation
- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Documents the AUTH_TOKEN→API_KEY mapping requirement
  section: Lines 14-17 (Authentication variables), Lines 64-75 (Implementation)
  critical: |
    "The shell uses ANTHROPIC_AUTH_TOKEN, but the Anthropic SDK expects ANTHROPIC_API_KEY.
    The application must map between these."

# EXTERNAL SOURCE - Vitest environment variable testing
- url: https://vitest.dev/guide/mocking.html#environment-variables
  why: Official documentation for vi.stubEnv() and vi.unstubAllEnvs()
  section: Environment Variables section
  critical: |
    - Use vi.stubEnv(name, value) to set environment variables
    - Use vi.unstubAllEnvs() in afterEach to restore original values
    - Prevents test pollution

- url: https://vitest.dev/api/vi.html#stubenv
  why: API reference for vi.stubEnv()
  section: vi.stubEnv() documentation
  critical: |
    vi.stubEnv(name, value) - Stubs an environment variable
    Unlike direct process.env manipulation, this ensures proper cleanup

# PREVIOUS PRP OUTPUT - MCP tool registration tests
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M1T2S3/PRP.md
  why: Previous work item that validates MCP registration
  critical: Confirms Groundswell integration works before environment config tests
  usage: MCP tests must pass before environment configuration tests

# PROJECT CONFIGURATION
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test configuration for Vitest
  section: test.environment, test.setupFiles
  critical: |
    - environment: 'node' (required for process.env access)
    - setupFiles: ['./tests/setup.ts'] (global afterEach with vi.unstubAllEnvs())
    - coverage thresholds: 100% required

- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test setup with cleanup hooks
  section: afterEach hook
  critical: |
    afterEach(() => {
      vi.unstubAllEnvs(); // Critical for test isolation
      if (typeof global.gc === 'function') {
        global.gc();
      }
    });
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # Test scripts: test, test:run, test:coverage
├── vitest.config.ts              # Test configuration with 100% coverage thresholds
├── src/
│   └── config/
│       ├── environment.ts        # configureEnvironment() implementation (lines 55-65)
│       ├── constants.ts          # DEFAULT_BASE_URL constant
│       └── types.ts              # EnvironmentValidationError, ModelTier types
├── tests/
│   ├── setup.ts                  # Global test setup with vi.unstubAllEnvs() cleanup
│   └── unit/
│       └── config/
│           └── environment.test.ts  # EXISTING: Tests for configureEnvironment()
│                                       # Gap: Missing idempotency test
```

---

### Desired Codebase Tree (files to be modified)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── config/
            └── environment.test.ts  # MODIFY: Add idempotency test case
                                      # Add new it() block after line 48
                                      # Test should call configureEnvironment() twice
                                      # Verify results are identical
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Use vi.stubEnv() instead of direct process.env manipulation
// vi.stubEnv() ensures proper cleanup via vi.unstubAllEnvs()

// GOOD
vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');

// BAD - Won't be cleaned up properly
process.env.ANTHROPIC_AUTH_TOKEN = 'test-token';

// CRITICAL: Always clear existing values before setting up test
// Use delete to remove, then vi.stubEnv() to set

delete process.env.ANTHROPIC_API_KEY;
vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');

// GOTCHA: vi.unstubAllEnvs() is called in global afterEach
// Don't add your own afterEach in this file - it's already in tests/setup.ts

// CRITICAL: configureEnvironment() checks !process.env.ANTHROPIC_API_KEY
// This means once API_KEY is set, subsequent calls won't overwrite it
// This is the idempotency guarantee we're testing

// GOTCHA: The mapping only happens if AUTH_TOKEN exists AND API_KEY doesn't
// if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY)

// CRITICAL: Test should verify BOTH API_KEY and BASE_URL idempotency
// configureEnvironment() handles both, so test both

// GOTCHA: Default BASE_URL comes from constants.ts
// DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic'
// Test should verify this exact value

// CRITICAL: 100% code coverage required
// Any new code must be tested
// Missing lines will cause CI to fail

// GOTCHA: Tests use consistent naming convention
// "should [do something] when [condition]"
// "should preserve [something] when [condition]"

// CRITICAL: Comment pattern in tests
// // SETUP: [what is being set up]
// // EXECUTE: [what is being tested]
// // VERIFY: [what is being checked]

// GOTCHA: expect().toBe() for primitive values
// expect().toEqual() for objects/arrays

// CRITICAL: Test isolation
// Each test should not depend on other tests
// vi.unstubAllEnvs() ensures clean state
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. The test validates existing `configureEnvironment()` function behavior.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing test file
  - FILE: tests/unit/config/environment.test.ts
  - UNDERSTAND: Existing test patterns and structure
  - IDENTIFY: Where to insert new test (after line 48, before BASE_URL tests)
  - DEPENDENCIES: None

Task 2: CREATE idempotency test case
  - LOCATION: tests/unit/config/environment.test.ts, after line 48
  - IMPLEMENT: it('should be idempotent - calling multiple times produces same result', () => { ... })
  - PATTERN: Follow existing test structure with SETUP/EXECUTE/VERIFY comments
  - CLEANUP: Rely on global afterEach (no need to add local afterEach)

Task 3: VERIFY test implementation
  - RUN: npm test -- tests/unit/config/environment.test.ts
  - VERIFY: New test passes
  - VERIFY: All existing tests still pass
  - VERIFY: 100% code coverage maintained

Task 4: DOCUMENT any edge cases found
  - CREATE: plan/002_1e734971e481/P1M2T1S1/research/edge-cases.md
  - CONTENT: Any edge cases discovered during testing
  - SHARE: Findings with team if unexpected behavior found
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// NEW TEST CASE - Add after line 48 in tests/unit/config/environment.test.ts
// =============================================================================

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

// =============================================================================
// ALTERNATIVE: More granular assertions (optional enhancement)
// =============================================================================

it('should be idempotent - calling multiple times produces same result', () => {
  // SETUP: Set AUTH_TOKEN, clear API_KEY and BASE_URL
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_BASE_URL;
  vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-456');

  // EXECUTE: First call
  configureEnvironment();
  const firstApiKey = process.env.ANTHROPIC_API_KEY;
  const firstBaseUrl = process.env.ANTHROPIC_BASE_URL;

  // EXECUTE: Second call
  configureEnvironment();
  const secondApiKey = process.env.ANTHROPIC_API_KEY;
  const secondBaseUrl = process.env.ANTHROPIC_BASE_URL;

  // VERIFY: Values should be identical
  expect(firstApiKey).toBe(secondApiKey);
  expect(firstBaseUrl).toBe(secondBaseUrl);
  expect(firstApiKey).toBe('test-token-456');
  expect(firstBaseUrl).toBe('https://api.z.ai/api/anthropic');
});

// =============================================================================
// PATTERN NOTES - Why this test is important
// =============================================================================

/*
 * Idempotency Testing Rationale:
 *
 * 1. configureEnvironment() is called at application startup (src/index.ts)
 * 2. Tests may call it multiple times in different test suites
 * 3. The function uses conditional checks (!process.env.ANTHROPIC_API_KEY)
 * 4. Once set, values should not change on subsequent calls
 * 5. This test validates that the conditional logic works correctly
 *
 * The test verifies:
 * - AUTH_TOKEN→API_KEY mapping happens on first call
 * - API_KEY is not overwritten on second call (preserves first call's value)
 * - BASE_URL is set to default on first call
 * - BASE_URL is not overwritten on second call
 */
```

---

### Integration Points

```yaml
INPUT FROM P1.M1 (Groundswell Integration & Validation):
  - File: tests/integration/groundswell/mcp.test.ts (from P1.M1.T2.S3)
  - Critical: MCP registration tests must pass before environment config tests
  - Reason: Environment configuration affects all subsequent Agent operations

INPUT FROM EXISTING CODE:
  - File: src/config/environment.ts
  - Function: configureEnvironment() (lines 55-65)
  - Logic: Conditional mapping based on !process.env.ANTHROPIC_API_KEY check
  - Constants: DEFAULT_BASE_URL from src/config/constants.ts

OUTPUT FOR P1.M2.T1.S2 (Default BASE_URL Configuration):
  - Confirmation: configureEnvironment() idempotency works correctly
  - Enables: Safe to call configureEnvironment() multiple times
  - Pattern: Conditional environment variable setting preserves existing values

DIRECTORY STRUCTURE:
  - Modify: tests/unit/config/environment.test.ts (existing file)
  - Location: Add new it() block after line 48
  - Reason: Keeps related tests together in same describe block

CLEANUP INTEGRATION:
  - Global: tests/setup.ts afterEach hook calls vi.unstubAllEnvs()
  - Pattern: No local afterEach needed in test file
  - Benefit: Consistent cleanup across all test files
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying tests/unit/config/environment.test.ts
# Check TypeScript compilation
npx tsc --noEmit tests/unit/config/environment.test.ts

# Expected: No type errors

# Format check
npx prettier --check "tests/unit/config/environment.test.ts"

# Expected: No formatting issues

# Linting (if ESLint is configured)
npx eslint tests/unit/config/environment.test.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the environment config test file
npm test -- tests/unit/config/environment.test.ts

# Expected: All tests pass, including new idempotency test

# Run with coverage
npm run test:coverage -- tests/unit/config/environment.test.ts

# Expected: 100% coverage of src/config/environment.ts maintained

# Run specific test
npm test -- -t "should be idempotent"

# Expected: New test passes

# Run all configureEnvironment tests
npm test -- -t "configureEnvironment"

# Expected: All 5 tests pass (4 existing + 1 new)
```

### Level 3: Integration Testing (System Validation)

```bash
# Test full config module
npm test -- tests/unit/config/

# Expected: All config tests pass

# Test entire unit test suite
npm test -- tests/unit/

# Expected: All unit tests pass

# Test entire test suite
npm test

# Expected: All tests pass, no regressions
```

### Level 4: Domain-Specific Validation

```bash
# Idempotency Validation
# Verify configureEnvironment() can be called multiple times safely
npm test -- -t "idempotent"

# Expected: Test confirms calling function twice produces identical results

# AUTH_TOKEN→API_KEY Mapping Validation
# Verify the mapping logic works correctly
npm test -- -t "AUTH_TOKEN"

# Expected: Mapping tests pass, API_KEY set from AUTH_TOKEN

# BASE_URL Default Validation
# Verify default URL is set correctly
npm test -- -t "BASE_URL"

# Expected: Default z.ai endpoint is used

# Environment Isolation Validation
# Verify tests don't pollute each other
npm test -- tests/unit/setup-verification.test.ts

# Expected: Setup verification tests confirm clean environment between tests
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] New test passes: `npm test -- -t "should be idempotent"`
- [ ] All existing tests still pass: `npm test -- tests/unit/config/environment.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npx prettier --check`
- [ ] 100% coverage maintained: `npm run test:coverage`
- [ ] Idempotency test verifies both API_KEY and BASE_URL
- [ ] Test follows existing patterns (SETUP/EXECUTE/VERIFY)

### Feature Validation

- [ ] Test 1: AUTH_TOKEN→API_KEY mapping works (existing)
- [ ] Test 2: Preserving existing API_KEY works (existing)
- [ ] Test 3: Idempotency test added and passing (NEW)
- [ ] Test verifies calling configureEnvironment() twice produces same result
- [ ] Test verifies API_KEY is not overwritten on second call
- [ ] Test verifies BASE_URL is not overwritten on second call
- [ ] Test uses vi.stubEnv() for environment setup
- [ ] Test relies on global afterEach cleanup

### Code Quality Validation

- [ ] Follows existing test patterns in tests/unit/config/
- [ ] Test placed in correct location (after line 48)
- [ ] Test name follows convention ("should [verb] [condition]")
- [ ] SETUP/EXECUTE/VERIFY comments present
- [ ] Assertions are specific and meaningful
- [ ] No test pollution (uses vi.stubEnv(), vi.unstubAllEnvs())

### Documentation & Deployment

- [ ] Edge cases documented (if any found)
- [ ] Test is self-documenting with clear name and assertions
- [ ] No environment variables hardcoded
- [ ] Test is idempotent (can run multiple times independently)

---

## Anti-Patterns to Avoid

- ❌ **Don't add local afterEach** - Global afterEach in tests/setup.ts already handles cleanup
- ❌ **Don't use process.env directly** - Use vi.stubEnv() for proper cleanup
- ❌ **Don't skip SETUP/EXECUTE/VERIFY comments** - Follow existing pattern
- ❌ **Don't test only API_KEY** - Test both API_KEY and BASE_URL idempotency
- ❌ **Don't forget to clear existing values** - Use delete before vi.stubEnv()
- ❌ **Don't use expect().toEqual() for primitives** - Use expect().toBe() for strings
- ❌ **Don't place test in wrong location** - Add after line 48, before BASE_URL tests
- ❌ **Don't assume test isolation** - Verify vi.unstubAllEnvs() is working
- ❌ **Don't skip coverage check** - 100% coverage is required
- ❌ **Don't ignore existing test patterns** - Follow the established style

---

## Appendix: Decision Rationale

### Why add an idempotency test?

The `configureEnvironment()` function is called at application startup and may be called multiple times in tests. Idempotency ensures:

1. **Safe Re-initialization**: If the application needs to re-initialize, calling the function again won't cause unexpected behavior
2. **Test Isolation**: Tests can call `configureEnvironment()` without worrying about side effects from previous tests
3. **Predictable Behavior**: Once environment variables are set, they remain stable across multiple function calls
4. **Documentation**: The test serves as documentation that the function is designed to be idempotent

### Why test both API_KEY and BASE_URL?

The `configureEnvironment()` function handles two distinct environment variables:

- `ANTHROPIC_API_KEY` (mapped from `ANTHROPIC_AUTH_TOKEN`)
- `ANTHROPIC_BASE_URL` (set to default if not provided)

Testing both ensures complete coverage of the function's behavior.

### Why use object comparison for results?

Using `expect(firstResult).toEqual(secondResult)` ensures that both variables are identical between calls. This is more robust than comparing individual values because it catches any divergence in the overall state.

### Why is this test missing from the existing suite?

The existing tests cover the core functionality (mapping and preservation), but idempotency is an edge case that wasn't explicitly tested. Adding this test improves confidence in the function's behavior when called multiple times.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from source code (environment.ts implementation)
- [x] Existing test patterns analyzed and documented
- [x] Vitest environment variable testing patterns documented
- [x] Test location and structure specified
- [x] All file paths and patterns specified
- [x] Cleanup patterns (vi.unstubAllEnvs()) documented
- [x] 100% coverage requirement understood
- [x] Test implementation example provided

**Risk Mitigation**:

- Minimal change (single test case addition)
- Existing tests provide reference pattern
- Global cleanup already in place
- No new dependencies or imports
- Clear success criteria

**Known Risks**:

- None - this is a straightforward test addition with comprehensive context

---

**END OF PRP**
