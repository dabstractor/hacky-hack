# Product Requirement Prompt (PRP): Test default BASE_URL configuration

**PRP ID**: P1.M2.T1.S2
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Fix the **Constant Synchronization Gap** in existing BASE_URL tests by replacing hardcoded magic strings with imports of `DEFAULT_BASE_URL` from `constants.ts`, ensuring tests fail if the constant value changes.

**Deliverable**: Updated test file `tests/unit/config/environment.test.ts` with three modifications:

1. Add import of `DEFAULT_BASE_URL` from constants.ts
2. Replace hardcoded `'https://api.z.ai/api/anthropic'` strings with `DEFAULT_BASE_URL` constant reference
3. Ensure all BASE_URL tests verify against the imported constant

**Success Definition**:

- Import statement added: `import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';`
- Line 72 (idempotency test): `expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL);`
- Line 84 (default BASE_URL test): `expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);`
- All tests pass: `npm test -- tests/unit/config/environment.test.ts`
- Test now fails if `DEFAULT_BASE_URL` in constants.ts changes (catches configuration drift)

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Second validation step in Phase 1 Milestone 2 (P1.M2) to ensure default BASE_URL configuration tests use constant synchronization pattern rather than magic strings.

**User Journey**:

1. Pipeline completes P1.M2.T1.S1 (AUTH_TOKEN to API_KEY mapping + idempotency) with success
2. Pipeline starts P1.M2.T1.S2 (Test default BASE_URL configuration)
3. Research identifies that existing tests use hardcoded strings instead of constant imports
4. Tests are updated to use "Constant Synchronization Testing" pattern
5. Tests now verify runtime values match compile-time constants
6. If `DEFAULT_BASE_URL` changes in constants.ts, tests will fail (detecting drift)

**Pain Points Addressed**:

- **Magic String Anti-Pattern**: Tests currently hardcode `'https://api.z.ai/api/anthropic'` in 3 locations
- **False Sense of Security**: Tests pass even if `DEFAULT_BASE_URL` constant changes
- **Configuration Drift**: No synchronization between test expectations and actual constant values
- **Maintenance Burden**: Changing the default URL requires updating both code AND tests manually

---

## Why

- **Constant Synchronization**: Tests should verify that runtime `process.env.ANTHROPIC_BASE_URL` matches the compile-time `DEFAULT_BASE_URL` constant from `constants.ts`. This prevents configuration drift.
- **Single Source of Truth**: `DEFAULT_BASE_URL` in `constants.ts` should be the only place the default URL is defined. Tests should import and reference it, not duplicate the value.
- **Detect Breaking Changes**: If someone changes `DEFAULT_BASE_URL` in `constants.ts`, the test should fail, alerting them that other code may depend on the old value.
- **Follow Best Practices**: "Constant Synchronization Testing" is an established pattern for ensuring runtime values match compile-time constants.
- **Problems Solved**:
  - Tests currently pass even if the constant changes (false positive security)
  - No relationship between test expectations and source code constants
  - Hard to refactor - changing the default URL requires finding and updating multiple files
  - Violates DRY principle - the URL value is duplicated

---

## What

Fix the "Constant Synchronization Gap" in existing BASE_URL tests by importing `DEFAULT_BASE_URL` from `constants.ts` and using it in assertions instead of hardcoded strings.

### Test Context

**Current State**: The test file `tests/unit/config/environment.test.ts` has tests for BASE_URL configuration:

- Line 50-73: Idempotency test (added in P1.M2.T1.S1) - uses hardcoded `'https://api.z.ai/api/anthropic'`
- Line 75-86: "should set default BASE_URL when not provided" - uses hardcoded `'https://api.z.ai/api/anthropic'`
- Line 88-99: "should preserve custom BASE_URL when already set" - tests custom URL (not affected)

**The Gap**: Tests verify the value is set correctly, but they use hardcoded strings instead of importing and comparing against the `DEFAULT_BASE_URL` constant.

**Risk Scenario**:

1. Developer changes `DEFAULT_BASE_URL` in `src/config/constants.ts` to `'https://new-endpoint.com'`
2. Tests still pass because they compare against hardcoded `'https://api.z.ai/api/anthropic'`
3. Application now uses different endpoint than tests expect
4. Tests provide false sense of security

### Required Changes

**Change 1: Add Import Statement**

```typescript
// Add to existing imports at top of file
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';
```

**Change 2: Update Idempotency Test (line 72)**

```typescript
// BEFORE:
expect(firstResult.baseUrl).toBe('https://api.z.ai/api/anthropic');

// AFTER:
expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL);
```

**Change 3: Update Default BASE_URL Test (line 84)**

```typescript
// BEFORE:
expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');

// AFTER:
expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
```

### Success Criteria

- [ ] Import `DEFAULT_BASE_URL` added to test file
- [ ] Line 72 updated to use `DEFAULT_BASE_URL` constant
- [ ] Line 84 updated to use `DEFAULT_BASE_URL` constant
- [ ] All tests pass: `npm test -- tests/unit/config/environment.test.ts`
- [ ] Test now fails if `DEFAULT_BASE_URL` in constants.ts changes
- [ ] No hardcoded `'https://api.z.ai/api/anthropic'` strings in BASE_URL tests

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] `configureEnvironment()` function implementation understood
- [x] `DEFAULT_BASE_URL` constant location and value identified
- [x] Existing test patterns analyzed
- [x] Gap identified (hardcoded strings vs constant imports)
- [x] "Constant Synchronization Testing" pattern researched
- [x] Vitest environment variable testing patterns documented
- [x] Contract typo identified (`vi.stubGlobalEnv()` → should be `vi.stubEnv()`)

---

### Documentation & References

```yaml
# MUST READ - Source implementation
- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Contains DEFAULT_BASE_URL constant definition (line 22)
  section: Line 22 (DEFAULT_BASE_URL export)
  critical: |
    export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;
    This is the source of truth for the default BASE_URL value.

# MUST READ - Function being tested
- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Contains configureEnvironment() implementation that sets BASE_URL
  section: Lines 61-64 (BASE_URL default setting logic)
  critical: |
    if (!process.env.ANTHROPIC_BASE_URL) {
      process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
    }
    Key insight: Only sets if not already present, uses imported constant.

# MUST READ - Existing test file (target for modification)
- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Contains existing tests with hardcoded strings that need updating
  section: Lines 50-86 (idempotency test and default BASE_URL test)
  critical: |
    Line 72: expect(firstResult.baseUrl).toBe('https://api.z.ai/api/anthropic');
    Line 84: expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
    Both lines need to use DEFAULT_BASE_URL constant instead.
  gotcha: The file already has comprehensive test coverage, this is a quality improvement

# MUST READ - Research findings
- docfile: plan/002_1e734971e481/P1M2T1S2/research/test-gap-analysis.md
  why: Detailed analysis of the constant synchronization gap
  section: Current State, The Gap, Risk Analysis
  critical: |
    Documents the 3 locations with hardcoded strings and the risk of configuration drift.
    Provides recommended implementation approach.

- docfile: plan/002_1e734971e481/P1M2T1S2/research/constant-testing-patterns.md
  why: Documents the "Constant Synchronization Testing" pattern
  section: Recommended Pattern, Anti-Patterns
  critical: |
    Pattern Name: Constant Synchronization Testing
    Recommendation: Import constants and assert runtime values match them
    Anti-Pattern: Magic strings without constants

- docfile: plan/002_1e734971e481/P1M2T1S2/research/vitest-env-testing.md
  why: Vitest environment variable testing best practices
  section: vi.stubEnv() vs vi.stubGlobalEnv()
  critical: |
    vi.stubGlobalEnv() DOES NOT EXIST in Vitest.
    The contract definition has a typo - should use vi.stubEnv().
    This PRP uses the correct vi.stubEnv() approach.

- docfile: plan/002_1e734971e481/P1M2T1S2/research/action-plan.md
  why: Step-by-step implementation plan
  section: Priority 1 Actions
  critical: |
    1. Add import statement for DEFAULT_BASE_URL
    2. Replace hardcoded strings with constant reference
    3. Run tests to verify changes

# PREVIOUS PRP OUTPUT - Idempotency tests
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T1S1/PRP.md
  why: Previous work item that added idempotency test
  critical: The idempotency test added in S1 also has the hardcoded string issue
  usage: This PRP fixes the hardcoded string in the test added by S1

# PROJECT CONFIGURATION
- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test setup with cleanup hooks
  section: afterEach hook (line 139-150)
  critical: |
    afterEach(() => {
      vi.unstubAllEnvs(); // Critical for test isolation
    });
    This PRP relies on this cleanup for test isolation.

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test configuration
  section: coverage thresholds
  critical: 100% coverage required
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # Test scripts: test, test:run, test:coverage
├── vitest.config.ts              # Test configuration with 100% coverage thresholds
├── src/
│   └── config/
│       ├── environment.ts        # configureEnvironment() implementation (lines 61-64)
│       ├── constants.ts          # DEFAULT_BASE_URL constant (line 22)
│       └── types.ts              # EnvironmentValidationError, ModelTier types
├── tests/
│   ├── setup.ts                  # Global test setup with vi.unstubAllEnvs() cleanup
│   └── unit/
│       └── config/
│           └── environment.test.ts  # EXISTING: Tests with hardcoded strings
│                                       # Lines 72, 84: Need DEFAULT_BASE_URL constant
```

---

### Desired Codebase Tree (files to be modified)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── config/
            └── environment.test.ts  # MODIFY: Add import, replace hardcoded strings
                                      # Add: import { DEFAULT_BASE_URL } from '...'
                                      # Change line 72: Use DEFAULT_BASE_URL
                                      # Change line 84: Use DEFAULT_BASE_URL
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: vi.stubGlobalEnv() does NOT exist in Vitest
// The contract definition has a typo. Use vi.stubEnv() instead.
// This PRP uses the correct vi.stubEnv() approach.

// GOTCHA: The existing tests already work correctly
// This is a QUALITY improvement, not a bug fix
// Tests pass today - we're making them more maintainable

// CRITICAL: Import statement placement
// Add DEFAULT_BASE_URL to existing imports, don't create a new import block

// GOOD: Add to existing import block
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureEnvironment,
  getModel,
  validateEnvironment,
  EnvironmentValidationError,
} from '../../../src/config/environment.js';
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js'; // Add this

// BAD: Creating separate import blocks
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';
import {
  configureEnvironment,
  getModel,
  validateEnvironment,
} from '../../../src/config/environment.js';

// GOTCHA: Don't change the custom BASE_URL test (lines 88-99)
// That test verifies custom URLs are preserved - it correctly uses a hardcoded string
// Only change the tests that verify the DEFAULT value

// CRITICAL: 100% code coverage required
// Changing assertion values doesn't change coverage
// Coverage will remain at 100%

// GOTCHA: Test order matters
// The idempotency test (lines 50-73) runs before the default BASE_URL test (lines 75-86)
// Both need to be updated

// CRITICAL: The constant is const-assigned (as const)
// export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;
// This means TypeScript knows it's a literal string type
// Test assertions will be type-safe

// GOTCHA: Pattern consistency
// Previous work (P1.M2.T1.S1) used object comparison in idempotency test
// This PRP maintains that pattern while using the constant

// CRITICAL: Global afterEach cleanup
// tests/setup.ts has vi.unstubAllEnvs() in afterEach
// No need to add local cleanup hooks
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This PRP updates existing tests to use constant imports instead of hardcoded strings.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing test file
  - FILE: tests/unit/config/environment.test.ts
  - IDENTIFY: Lines with hardcoded 'https://api.z.ai/api/anthropic' strings
  - LOCATIONS: Line 72 (idempotency test), Line 84 (default BASE_URL test)
  - DEPENDENCIES: None

Task 2: ADD import statement for DEFAULT_BASE_URL
  - LOCATION: tests/unit/config/environment.test.ts, top of file after existing imports
  - ADD: import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';
  - PATTERN: Add to existing import block, don't create new block
  - DEPENDENCIES: Task 1

Task 3: UPDATE idempotency test assertion (line 72)
  - LOCATION: tests/unit/config/environment.test.ts, line 72
  - CHANGE: expect(firstResult.baseUrl).toBe('https://api.z.ai/api/anthropic');
  - TO: expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL);
  - DEPENDENCIES: Task 2

Task 4: UPDATE default BASE_URL test assertion (line 84)
  - LOCATION: tests/unit/config/environment.test.ts, line 84
  - CHANGE: expect(process.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
  - TO: expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
  - DEPENDENCIES: Task 2

Task 5: VERIFY tests pass
  - RUN: npm test -- tests/unit/config/environment.test.ts
  - VERIFY: All tests pass
  - VERIFY: 100% coverage maintained
  - DEPENDENCIES: Task 3, Task 4

Task 6: VERIFY constant synchronization works
  - TEMPORARILY change: DEFAULT_BASE_URL in src/config/constants.ts to 'https://test.example.com'
  - RUN: npm test -- tests/unit/config/environment.test.ts
  - VERIFY: Tests now FAIL (they detect the constant change)
  - REVERT: Change DEFAULT_BASE_URL back to 'https://api.z.ai/api/anthropic'
  - VERIFY: Tests pass again
  - DEPENDENCIES: Task 5
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Constant Synchronization Testing
// =============================================================================

/*
 * WHAT: Import constants and assert runtime values match them
 * WHY: Ensures tests fail if constants change, detecting configuration drift
 * PATTERN NAME: Constant Synchronization Testing
 */

// =============================================================================
// BEFORE: Magic String Anti-Pattern
// =============================================================================

// File: tests/unit/config/environment.test.ts (current state)

it('should set default BASE_URL when not provided', () => {
  // SETUP: No BASE_URL set
  delete process.env.ANTHROPIC_BASE_URL;

  // EXECUTE
  configureEnvironment();

  // VERIFY: Default z.ai endpoint
  expect(process.env.ANTHROPIC_BASE_URL).toBe(
    'https://api.z.ai/api/anthropic' // ❌ MAGIC STRING
  );
});

// PROBLEM: If DEFAULT_BASE_URL changes in constants.ts, this test still passes
// RISK: Tests provide false sense of security

// =============================================================================
// AFTER: Constant Synchronization Pattern
// =============================================================================

// File: tests/unit/config/environment.test.ts (target state)

// ADD TO IMPORTS (after line 17):
import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';

it('should set default BASE_URL when not provided', () => {
  // SETUP: No BASE_URL set
  delete process.env.ANTHROPIC_BASE_URL;

  // EXECUTE
  configureEnvironment();

  // VERIFY: Default z.ai endpoint matches constant
  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL); // ✅ CONSTANT SYNC
});

// BENEFIT: If DEFAULT_BASE_URL changes in constants.ts, this test fails
// SAFETY: Tests detect configuration drift immediately

// =============================================================================
// COMPLETE FILE MODIFICATION SUMMARY
// =============================================================================

/*
 * File: tests/unit/config/environment.test.ts
 *
 * CHANGE 1: Add import (after line 17)
 * + import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';
 *
 * CHANGE 2: Update idempotency test (line 72)
 * - expect(firstResult.baseUrl).toBe('https://api.z.ai/api/anthropic');
 * + expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL);
 *
 * CHANGE 3: Update default BASE_URL test (line 84)
 * - expect(process.env.ANTHROPIC_BASE_URL).toBe(
 * -   'https://api.z.ai/api/anthropic'
 * - );
 * + expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);
 */

// =============================================================================
// VERIFICATION TEST: Prove Constant Synchronization Works
// =============================================================================

/*
 * Step 1: Temporarily modify src/config/constants.ts
 *   export const DEFAULT_BASE_URL = 'https://test.example.com' as const;
 *
 * Step 2: Run tests
 *   npm test -- tests/unit/config/environment.test.ts
 *
 * Step 3: Expected result - TESTS FAIL
 *   ● configureEnvironment > should be idempotent
 *     expect(received).toBe(expected) // Object.is equality
 *     Expected: "https://test.example.com"
 *     Received: "https://api.z.ai/api/anthropic"
 *
 * Step 4: Revert change
 *   export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;
 *
 * Step 5: Run tests again
 *   npm test -- tests/unit/config/environment.test.ts
 *
 * Step 6: Expected result - TESTS PASS
 *
 * CONCLUSION: Tests now detect configuration drift! ✓
 */

// =============================================================================
// GOTCHA: Don't Change Custom URL Test
// =============================================================================

/*
 * The test at lines 88-99 verifies custom URLs are preserved.
 * This test correctly uses a hardcoded string because it's testing
 * that a CUSTOM value (not the default) is preserved.
 *
 * DO NOT CHANGE:
 * it('should preserve custom BASE_URL when already set', () => {
 *   vi.stubEnv('ANTHROPIC_BASE_URL', 'https://custom.endpoint.com/api');
 *   configureEnvironment();
 *   expect(process.env.ANTHROPIC_BASE_URL).toBe(
 *     'https://custom.endpoint.com/api'  // ✅ Correct - testing custom value
 *   );
 * });
 */
```

---

### Integration Points

```yaml
INPUT FROM P1.M2.T1.S1 (AUTH_TOKEN to API_KEY mapping):
  - File: tests/unit/config/environment.test.ts (from P1.M2.T1.S1)
  - Critical: Idempotency test added in S1 (lines 50-73)
  - Issue: This test also uses hardcoded string for BASE_URL
  - This PRP: Fixes the hardcoded string in the S1 test

INPUT FROM EXISTING CODE:
  - File: src/config/constants.ts
  - Constant: DEFAULT_BASE_URL (line 22)
  - Value: 'https://api.z.ai/api/anthropic'
  - Import path: '../../../src/config/constants.js' (from tests/unit/config/)

  - File: src/config/environment.ts
  - Function: configureEnvironment() (lines 61-64)
  - Logic: if (!process.env.ANTHROPIC_BASE_URL) { process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL; }

OUTPUT FOR P1.M2.T1.S3 (Model configuration tier mapping):
  - Pattern: Use constant imports in tests (not hardcoded strings)
  - Benefit: Tests detect when model name constants change
  - Applies to: getModel() tests for opus/sonnet/haiku tiers

DIRECTORY STRUCTURE:
  - Modify: tests/unit/config/environment.test.ts (existing file)
  - Changes: 3 modifications (1 import, 2 assertions)
  - Lines affected: 17 (import), 72 (assertion), 84 (assertion)

CLEANUP INTEGRATION:
  - Global: tests/setup.ts afterEach hook calls vi.unstubAllEnvs()
  - Pattern: No local afterEach needed
  - Benefit: Consistent cleanup across all test files
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying tests/unit/config/environment.test.ts
# Check TypeScript compilation
npx tsc --noEmit tests/unit/config/environment.test.ts

# Expected: No type errors (import is valid, constant type is 'https://api.z.ai/api/anthropic')

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

# Expected: All tests pass (5 configureEnvironment tests + 7 getModel tests + 5 validateEnvironment tests)

# Run with coverage
npm run test:coverage -- tests/unit/config/environment.test.ts

# Expected: 100% coverage of src/config/environment.ts maintained

# Run specific BASE_URL tests
npm test -- -t "BASE_URL"

# Expected: 3 tests pass (idempotency, default setting, custom preservation)

# Run all configureEnvironment tests
npm test -- -t "configureEnvironment"

# Expected: 5 tests pass
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

# CRITICAL: Verify constant synchronization
# Step 1: Temporarily change constant
# Edit src/config/constants.ts line 22:
#   export const DEFAULT_BASE_URL = 'https://test.example.com' as const;

# Step 2: Run tests - they SHOULD FAIL
npm test -- tests/unit/config/environment.test.ts

# Expected: Tests fail with assertion error showing mismatch

# Step 3: Revert change
# Edit src/config/constants.ts line 22 back to:
#   export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;

# Step 4: Run tests - they SHOULD PASS
npm test -- tests/unit/config/environment.test.ts

# Expected: All tests pass again
```

### Level 4: Domain-Specific Validation

```bash
# Constant Synchronization Validation
# Verify tests detect configuration drift
npm test -- -t "should be idempotent" && npm test -- -t "should set default BASE_URL"

# Expected: Both tests verify against DEFAULT_BASE_URL constant

# Import Validation
# Verify the import statement is correct
grep -n "DEFAULT_BASE_URL" tests/unit/config/environment.test.ts

# Expected output:
#   12:import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';
#   72:  expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL);
#   84:  expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);

# Magic String Elimination Validation
# Verify no hardcoded URLs remain in BASE_URL tests
grep -n "api.z.ai" tests/unit/config/environment.test.ts

# Expected: Only matches in comments, not in assertions
# (Custom URL test may still have 'custom.endpoint.com' which is correct)

# Test Isolation Validation
# Verify tests don't pollute each other
npm test -- tests/unit/setup-verification.test.ts

# Expected: Setup verification tests confirm clean environment between tests
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Import statement added: `import { DEFAULT_BASE_URL } from '../../../src/config/constants.js';`
- [ ] Line 72 updated: `expect(firstResult.baseUrl).toBe(DEFAULT_BASE_URL);`
- [ ] Line 84 updated: `expect(process.env.ANTHROPIC_BASE_URL).toBe(DEFAULT_BASE_URL);`
- [ ] All tests pass: `npm test -- tests/unit/config/environment.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npx prettier --check`
- [ ] 100% coverage maintained: `npm run test:coverage`
- [ ] Constant synchronization verified: tests fail when constant changes

### Feature Validation

- [ ] Test 1: Idempotency test uses DEFAULT_BASE_URL constant
- [ ] Test 2: Default BASE_URL test uses DEFAULT_BASE_URL constant
- [ ] Test 3: Custom BASE_URL test unchanged (correctly uses hardcoded string)
- [ ] Import statement correctly placed in existing import block
- [ ] No new magic strings introduced
- [ ] Tests detect configuration drift (verified by temporarily changing constant)

### Code Quality Validation

- [ ] Follows "Constant Synchronization Testing" pattern
- [ ] Import path is correct relative to test file location
- [ ] TypeScript types are satisfied (const assertion provides literal type)
- [ ] Test comments preserved and accurate
- [ ] No duplicate imports
- [ ] Consistent with codebase patterns

### Documentation & Deployment

- [ ] Research findings stored in plan/002_1e734971e481/P1M2T1S2/research/
- [ ] Pattern documented for future reference (constant-testing-patterns.md)
- [ ] Action plan provided for similar fixes in other test files
- [ ] No environment variables hardcoded (uses constant reference)

---

## Anti-Patterns to Avoid

- ❌ **Don't create separate import blocks** - Add DEFAULT_BASE_URL to existing imports
- ❌ **Don't change the custom URL test** - Lines 88-99 correctly test custom value preservation
- ❌ **Don't use vi.stubGlobalEnv()** - This function doesn't exist, use vi.stubEnv()
- ❌ **Don't add local afterEach** - Global afterEach in tests/setup.ts already handles cleanup
- ❌ **Don't skip verification test** - Prove constant synchronization works by temporarily changing the constant
- ❌ **Don't modify constants.ts** - Only modify the test file
- ❌ **Don't break existing tests** - All existing tests must still pass
- ❌ **Don't introduce new magic strings** - Replace all hardcoded URLs with constant reference
- ❌ **Don't forget to revert test changes** - When verifying synchronization, revert the constant change
- ❌ **Don't skip coverage check** - 100% coverage is required

---

## Appendix: Decision Rationale

### Why is this a separate subtask from S1?

P1.M2.T1.S1 added the idempotency test. P1.M2.T1.S2 fixes the constant synchronization issue. They're separate because:

1. **Different Goals**: S1 verified idempotency, S2 verifies constant synchronization
2. **Incremental Improvement**: S1 added a new test, S2 improves existing tests
3. **Parallel Execution**: S1 and S2 were designed to run in parallel (S1 was implementing while S2 was researching)

### Why use "Constant Synchronization Testing" pattern?

This pattern ensures that tests verify runtime values match compile-time constants:

1. **Detects Drift**: If someone changes the constant, tests fail
2. **Single Source of Truth**: The constant is the only place the value is defined
3. **Refactor-Friendly**: Changing the default URL only requires updating the constant
4. **Type-Safe**: TypeScript's const assertion provides literal type checking

### Is this a bug fix or quality improvement?

It's a **quality improvement**:

- Tests currently pass (no bug)
- Tests work correctly for the current constant value
- The issue is that tests don't detect if the constant changes
- This is a "test the tests" improvement - making tests more robust

### Why didn't S1 use the constant in the first place?

S1 focused on adding idempotency testing. The constant synchronization gap existed in earlier tests too. S2 addresses this as a separate concern to improve overall test quality.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from source code (constants.ts, environment.ts)
- [x] Existing test patterns analyzed and documented
- [x] Constant synchronization pattern researched and documented
- [x] Specific file locations identified (lines 17, 72, 84)
- [x] All modification steps specified
- [x] Verification approach documented (temporarily change constant to prove detection)
- [x] Research findings stored for reference
- [x] Anti-patterns documented

**Risk Mitigation**:

- Minimal change (3 modifications: 1 import, 2 assertions)
- Existing tests provide reference pattern
- No new dependencies or complex logic
- Clear success criteria
- Verification test proves the improvement works

**Known Risks**:

- None - this is a straightforward quality improvement with comprehensive context

---

**END OF PRP**
