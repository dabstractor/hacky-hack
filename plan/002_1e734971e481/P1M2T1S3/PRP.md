# Product Requirement Prompt (PRP): Test model configuration tier mapping

**PRP ID**: P1.M2.T1.S3
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Fix the **Constant Synchronization Gap** in existing `getModel()` tests by replacing hardcoded model name strings ('GLM-4.7', 'GLM-4.5-Air') with imports of `MODEL_NAMES` from `constants.ts`, ensuring tests fail if the constant values change.

**Deliverable**: Updated test file `tests/unit/config/environment.test.ts` with modifications to the `getModel()` test suite:
1. Add import of `MODEL_NAMES` from constants.ts
2. Replace hardcoded model name strings with `MODEL_NAMES[tier]` constant references
3. Ensure all model tier tests verify against the imported constants

**Success Definition**:
- Import statement added: `import { MODEL_NAMES } from '../../../src/config/constants.js';`
- Line 107: `expect(getModel('opus')).toBe(MODEL_NAMES.opus);`
- Line 115: `expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);`
- Line 123: `expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);`
- All tests pass: `npm test -- tests/unit/config/environment.test.ts`
- Tests now fail if `MODEL_NAMES` in constants.ts changes (catches configuration drift)

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Third validation step in Phase 1 Milestone 2 (P1.M2) to ensure model tier mapping tests use constant synchronization pattern rather than magic strings.

**User Journey**:
1. Pipeline completes P1.M2.T1.S1 (AUTH_TOKEN to API_KEY mapping) with success
2. Pipeline completes P1.M2.T1.S2 (BASE_URL constant synchronization) with success
3. Pipeline starts P1.M2.T1.S3 (Test model configuration tier mapping)
4. Research identifies that existing `getModel()` tests use hardcoded model names
5. Tests are updated to use "Constant Synchronization Testing" pattern
6. Tests now verify runtime values match compile-time constants
7. If `MODEL_NAMES` values change in constants.ts, tests will fail (detecting drift)

**Pain Points Addressed**:
- **Magic String Anti-Pattern**: Tests currently hardcode 'GLM-4.7' and 'GLM-4.5-Air' in 3 locations
- **False Sense of Security**: Tests pass even if `MODEL_NAMES` constants change
- **Configuration Drift**: No synchronization between test expectations and actual constant values
- **Maintenance Burden**: Changing model names requires updating both code AND tests manually

---

## Why

- **Constant Synchronization**: Tests should verify that `getModel(tier)` returns values matching the compile-time `MODEL_NAMES` constants from `constants.ts`. This prevents configuration drift.
- **Single Source of Truth**: `MODEL_NAMES` in `constants.ts` should be the only place default model names are defined. Tests should import and reference them, not duplicate the values.
- **Detect Breaking Changes**: If someone changes `MODEL_NAMES` in `constants.ts`, the test should fail, alerting them that other code may depend on the old values.
- **Follow Best Practices**: "Constant Synchronization Testing" pattern (established in P1.M2.T1.S2) ensures runtime values match compile-time constants.
- **Problems Solved**:
  - Tests currently pass even if constants change (false positive security)
  - No relationship between test expectations and source code constants
  - Hard to refactor - changing model names requires finding and updating multiple files
  - Violates DRY principle - model name values are duplicated

---

## What

Fix the "Constant Synchronization Gap" in existing `getModel()` tests by importing `MODEL_NAMES` from `constants.ts` and using it in assertions instead of hardcoded model name strings.

### Test Context

**Current State**: The test file `tests/unit/config/environment.test.ts` has tests for `getModel()` function (lines 102-150):
- Lines 103-109: "should return default model for opus tier" - uses hardcoded `'GLM-4.7'`
- Lines 111-117: "should return default model for sonnet tier" - uses hardcoded `'GLM-4.7'`
- Lines 119-125: "should return default model for haiku tier" - uses hardcoded `'GLM-4.5-Air'`
- Lines 127-149: Environment override tests (not affected - these test custom values)

**The Gap**: Tests verify the correct model names are returned, but they use hardcoded strings instead of importing and comparing against the `MODEL_NAMES` constant.

**Risk Scenario**:
1. Developer changes `MODEL_NAMES.opus` in `src/config/constants.ts` to `'GLM-4.8'`
2. Tests still pass because they compare against hardcoded `'GLM-4.7'`
3. Application now uses different model than tests expect
4. Tests provide false sense of security

**Contract Clarification**: The contract definition mentions "Test 3: Verify invalid tier throws appropriate error" - however, this is **not currently applicable** because:
- The `getModel()` implementation (lines 96-99 in environment.ts) does not include runtime validation
- The `ModelTier` type is a compile-time union type (`'opus' | 'sonnet' | 'haiku'`)
- Invalid tiers are caught at compile time by TypeScript, not at runtime
- No error-throwing logic exists in the current implementation
- This requirement is **deferred to future work** if/when runtime validation is added

### Required Changes

**Change 1: Add Import Statement**

```typescript
// Add to existing imports at top of file (after line 17)
import { MODEL_NAMES } from '../../../src/config/constants.js';
```

**Change 2: Update Opus Tier Test (line 107)**

```typescript
// BEFORE:
expect(getModel('opus')).toBe('GLM-4.7');

// AFTER:
expect(getModel('opus')).toBe(MODEL_NAMES.opus);
```

**Change 3: Update Sonnet Tier Test (line 115)**

```typescript
// BEFORE:
expect(getModel('sonnet')).toBe('GLM-4.7');

// AFTER:
expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);
```

**Change 4: Update Haiku Tier Test (line 123)**

```typescript
// BEFORE:
expect(getModel('haiku')).toBe('GLM-4.5-Air');

// AFTER:
expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);
```

### Success Criteria

- [ ] Import `MODEL_NAMES` added to test file
- [ ] Line 107 updated to use `MODEL_NAMES.opus`
- [ ] Line 115 updated to use `MODEL_NAMES.sonnet`
- [ ] Line 123 updated to use `MODEL_NAMES.haiku`
- [ ] All tests pass: `npm test -- tests/unit/config/environment.test.ts`
- [ ] Test now fails if `MODEL_NAMES` in constants.ts changes
- [ ] No hardcoded model name strings in default value tests

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] `getModel()` function implementation understood (lines 96-99 in environment.ts)
- [x] `MODEL_NAMES` constant location and values identified (constants.ts lines 43-50)
- [x] Existing test patterns analyzed (environment.test.ts lines 102-150)
- [x] Gap identified (hardcoded strings vs constant imports)
- [x] "Constant Synchronization Testing" pattern documented (from P1.M2.T1.S2)
- [x] Vitest environment variable testing patterns documented
- [x] GLM model tier mappings documented (opus/sonnet → GLM-4.7, haiku → GLM-4.5-Air)

---

### Documentation & References

```yaml
# MUST READ - Source implementation
- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Contains MODEL_NAMES constant definition (lines 43-50)
  section: Lines 43-50 (MODEL_NAMES export)
  critical: |
    export const MODEL_NAMES = {
      opus: 'GLM-4.7',
      sonnet: 'GLM-4.7',
      haiku: 'GLM-4.5-Air',
    } as const;
    This is the source of truth for default model name values.

# MUST READ - Function being tested
- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Contains getModel() implementation that retrieves model names
  section: Lines 96-99 (getModel function)
  critical: |
    export function getModel(tier: ModelTier): string {
      const envVar = MODEL_ENV_VARS[tier];
      return process.env[envVar] ?? MODEL_NAMES[tier];
    }
    Key insight: Returns environment override or default from MODEL_NAMES constant.

# MUST READ - Existing test file (target for modification)
- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Contains existing getModel() tests with hardcoded strings that need updating
  section: Lines 102-150 (getModel() test suite)
  critical: |
    Line 107: expect(getModel('opus')).toBe('GLM-4.7');
    Line 115: expect(getModel('sonnet')).toBe('GLM-4.7');
    Line 123: expect(getModel('haiku')).toBe('GLM-4.5-Air');
    All three lines need to use MODEL_NAMES[tier] constant instead.

# MUST READ - Type definitions
- file: /home/dustin/projects/hacky-hack/src/config/types.ts
  why: Contains ModelTier type definition
  section: Line 23 (ModelTier export)
  critical: |
    export type ModelTier = 'opus' | 'sonnet' | 'haiku';
    This is a compile-time union type - no runtime validation exists.

# MUST READ - Previous PRP (pattern to follow)
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T1S2/PRP.md
  why: Previous work item that established Constant Synchronization Testing pattern
  section: Implementation Blueprint, Implementation Patterns & Key Details
  critical: |
    Shows the exact pattern for replacing hardcoded strings with constant imports.
    Follow this pattern for MODEL_NAMES just as P1.M2.T1.S2 did for DEFAULT_BASE_URL.

# MUST READ - Research findings
- docfile: plan/002_1e734971e481/P1M2T1S3/research/model-tier-testing-patterns.md
  why: Comprehensive testing patterns for model tier configuration
  section: Complete Example: Model Tier Testing, Best Practices Summary
  critical: |
    Documents vi.stubEnv() usage, constant testing patterns, union type exhaustiveness.
    Provides code examples for all testing scenarios.

- docfile: plan/002_1e734971e481/P1M2T1S3/research/glm-model-research.md
  why: GLM model series documentation and tier mappings
  section: Available GLM Models, Model Tier Naming Conventions
  critical: |
    opus → GLM-4.7 (highest quality, complex reasoning)
    sonnet → GLM-4.7 (balanced, default for most agents)
    haiku → GLM-4.5-Air (fastest, simple operations)

# PREVIOUS PRP OUTPUT - Constant Synchronization Pattern
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T1S2/PRP.md
  why: Previous work item that established the pattern to follow
  usage: Apply the same constant synchronization pattern to MODEL_NAMES

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
│       ├── environment.ts        # getModel() implementation (lines 96-99)
│       ├── constants.ts          # MODEL_NAMES constant (lines 43-50)
│       └── types.ts              # ModelTier type definition (line 23)
├── tests/
│   ├── setup.ts                  # Global test setup with vi.unstubAllEnvs() cleanup
│   └── unit/
│       └── config/
│           └── environment.test.ts  # EXISTING: getModel() tests with hardcoded strings
│                                       # Lines 107, 115, 123: Need MODEL_NAMES constant
```

---

### Desired Codebase Tree (files to be modified)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── config/
            └── environment.test.ts  # MODIFY: Add import, replace hardcoded model names
                                      # Add: import { MODEL_NAMES } from '...'
                                      # Change line 107: Use MODEL_NAMES.opus
                                      # Change line 115: Use MODEL_NAMES.sonnet
                                      # Change line 123: Use MODEL_NAMES.haiku
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Model tier naming - opus and sonnet both use GLM-4.7
// This is intentional - they represent different usage patterns, not different models
// Opus: highest quality for complex reasoning tasks
// Sonnet: balanced performance for most agent operations
// Haiku: fastest model for simple operations (GLM-4.5-Air)

// GOTCHA: The existing tests already work correctly
// This is a QUALITY improvement, not a bug fix
// Tests pass today - we're making them more maintainable

// CRITICAL: Import statement placement
// Add MODEL_NAMES to existing imports, don't create a new import block

// GOOD: Add to existing import block
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureEnvironment,
  getModel,
  validateEnvironment,
  EnvironmentValidationError,
} from '../../../src/config/environment.js';
import { MODEL_NAMES } from '../../../src/config/constants.js';  // Add this

// BAD: Creating separate import blocks
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MODEL_NAMES } from '../../../src/config/constants.js';
import { configureEnvironment, getModel, validateEnvironment } from '../../../src/config/environment.js';

// GOTCHA: Don't change the environment override tests (lines 127-149)
// Those tests verify custom values are respected - they correctly use hardcoded strings
// Only change the tests that verify the DEFAULT values

// CRITICAL: 100% code coverage required
// Changing assertion values doesn't change coverage
// Coverage will remain at 100%

// GOTCHA: Test order matters
// The default value tests run before the override tests
// All three default tests (lines 103-125) need to be updated

// CRITICAL: The constant is const-assigned (as const)
// export const MODEL_NAMES = { opus: 'GLM-4.7', ... } as const;
// This means TypeScript knows the values are literal types
// Test assertions will be type-safe

// GOTCHA: Pattern consistency with P1.M2.T1.S2
// Previous work used the same pattern for DEFAULT_BASE_URL
// This PRP maintains consistency by using the same pattern for MODEL_NAMES

// CRITICAL: Global afterEach cleanup
// tests/setup.ts has vi.unstubAllEnvs() in afterEach
// No need to add local cleanup hooks

// GOTCHA: ModelTier is a compile-time type only
// export type ModelTier = 'opus' | 'sonnet' | 'haiku';
// There is NO runtime validation for invalid tiers
// Tests for "invalid tier throws error" are NOT APPLICABLE
// This is a documentation issue in the contract, not a gap in implementation
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This PRP updates existing tests to use constant imports instead of hardcoded strings.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing test file
  - FILE: tests/unit/config/environment.test.ts
  - IDENTIFY: Lines with hardcoded model name strings
  - LOCATIONS: Line 107 (opus), Line 115 (sonnet), Line 123 (haiku)
  - DEPENDENCIES: None

Task 2: ADD import statement for MODEL_NAMES
  - LOCATION: tests/unit/config/environment.test.ts, top of file after existing imports
  - ADD: import { MODEL_NAMES } from '../../../src/config/constants.js';
  - PATTERN: Add to existing import block, don't create new block
  - DEPENDENCIES: Task 1

Task 3: UPDATE opus tier test assertion (line 107)
  - LOCATION: tests/unit/config/environment.test.ts, line 107
  - CHANGE: expect(getModel('opus')).toBe('GLM-4.7');
  - TO: expect(getModel('opus')).toBe(MODEL_NAMES.opus);
  - DEPENDENCIES: Task 2

Task 4: UPDATE sonnet tier test assertion (line 115)
  - LOCATION: tests/unit/config/environment.test.ts, line 115
  - CHANGE: expect(getModel('sonnet')).toBe('GLM-4.7');
  - TO: expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);
  - DEPENDENCIES: Task 2

Task 5: UPDATE haiku tier test assertion (line 123)
  - LOCATION: tests/unit/config/environment.test.ts, line 123
  - CHANGE: expect(getModel('haiku')).toBe('GLM-4.5-Air');
  - TO: expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);
  - DEPENDENCIES: Task 2

Task 6: VERIFY tests pass
  - RUN: npm test -- tests/unit/config/environment.test.ts
  - VERIFY: All tests pass (17 tests total: 5 configureEnvironment, 7 getModel, 5 validateEnvironment)
  - VERIFY: 100% coverage maintained
  - DEPENDENCIES: Task 3, Task 4, Task 5

Task 7: VERIFY constant synchronization works
  - TEMPORARILY change: MODEL_NAMES.opus in src/config/constants.ts to 'GLM-4.8'
  - RUN: npm test -- tests/unit/config/environment.test.ts
  - VERIFY: Tests now FAIL (they detect the constant change)
  - REVERT: Change MODEL_NAMES.opus back to 'GLM-4.7'
  - VERIFY: Tests pass again
  - DEPENDENCIES: Task 6
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Constant Synchronization Testing (from P1.M2.T1.S2)
// =============================================================================

/*
 * WHAT: Import constants and assert runtime values match them
 * WHY: Ensures tests fail if constants change, detecting configuration drift
 * PATTERN NAME: Constant Synchronization Testing
 * ESTABLISHED BY: P1.M2.T1.S2 (BASE_URL constant synchronization)
 */

// =============================================================================
// BEFORE: Magic String Anti-Pattern
// =============================================================================

// File: tests/unit/config/environment.test.ts (current state)

describe('getModel', () => {
  it('should return default model for opus tier', () => {
    // SETUP: No override
    delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;

    // EXECUTE & VERIFY
    expect(getModel('opus')).toBe('GLM-4.7');  // ❌ MAGIC STRING
  });

  it('should return default model for sonnet tier', () => {
    // SETUP: No override
    delete process.env.ANTHROPIC_DEFAULT_SONNET_MODEL;

    // EXECUTE & VERIFY
    expect(getModel('sonnet')).toBe('GLM-4.7');  // ❌ MAGIC STRING
  });

  it('should return default model for haiku tier', () => {
    // SETUP: No override
    delete process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;

    // EXECUTE & VERIFY
    expect(getModel('haiku')).toBe('GLM-4.5-Air');  // ❌ MAGIC STRING
  });
});

// PROBLEM: If MODEL_NAMES changes in constants.ts, these tests still pass
// RISK: Tests provide false sense of security

// =============================================================================
// AFTER: Constant Synchronization Pattern
// =============================================================================

// File: tests/unit/config/environment.test.ts (target state)

// ADD TO IMPORTS (after line 17):
import { MODEL_NAMES } from '../../../src/config/constants.js';

describe('getModel', () => {
  it('should return default model for opus tier', () => {
    // SETUP: No override
    delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;

    // EXECUTE & VERIFY
    expect(getModel('opus')).toBe(MODEL_NAMES.opus);  // ✅ CONSTANT SYNC
  });

  it('should return default model for sonnet tier', () => {
    // SETUP: No override
    delete process.env.ANTHROPIC_DEFAULT_SONNET_MODEL;

    // EXECUTE & VERIFY
    expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);  // ✅ CONSTANT SYNC
  });

  it('should return default model for haiku tier', () => {
    // SETUP: No override
    delete process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;

    // EXECUTE & VERIFY
    expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);  // ✅ CONSTANT SYNC
  });
});

// BENEFIT: If MODEL_NAMES changes in constants.ts, these tests fail
// SAFETY: Tests detect configuration drift immediately

// =============================================================================
// COMPLETE FILE MODIFICATION SUMMARY
// =============================================================================

/*
 * File: tests/unit/config/environment.test.ts
 *
 * CHANGE 1: Add import (after line 17)
 * + import { MODEL_NAMES } from '../../../src/config/constants.js';
 *
 * CHANGE 2: Update opus test (line 107)
 * - expect(getModel('opus')).toBe('GLM-4.7');
 * + expect(getModel('opus')).toBe(MODEL_NAMES.opus);
 *
 * CHANGE 3: Update sonnet test (line 115)
 * - expect(getModel('sonnet')).toBe('GLM-4.7');
 * + expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);
 *
 * CHANGE 4: Update haiku test (line 123)
 * - expect(getModel('haiku')).toBe('GLM-4.5-Air');
 * + expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);
 */

// =============================================================================
// VERIFICATION TEST: Prove Constant Synchronization Works
// =============================================================================

/*
 * Step 1: Temporarily modify src/config/constants.ts
 *   export const MODEL_NAMES = {
 *     opus: 'GLM-4.8',  // Changed from 'GLM-4.7'
 *     sonnet: 'GLM-4.7',
 *     haiku: 'GLM-4.5-Air',
 *   } as const;
 *
 * Step 2: Run tests
 *   npm test -- tests/unit/config/environment.test.ts
 *
 * Step 3: Expected result - TESTS FAIL
 *   ● configureEnvironment > should return default model for opus tier
 *     expect(received).toBe(expected) // Object.is equality
 *     Expected: "GLM-4.8"
 *     Received: "GLM-4.7"
 *
 * Step 4: Revert change
 *   export const MODEL_NAMES = {
 *     opus: 'GLM-4.7',  // Restored
 *     sonnet: 'GLM-4.7',
 *     haiku: 'GLM-4.5-Air',
 *   } as const;
 *
 * Step 5: Run tests again
 *   npm test -- tests/unit/config/environment.test.ts
 *
 * Step 6: Expected result - TESTS PASS
 *
 * CONCLUSION: Tests now detect configuration drift! ✓
 */

// =============================================================================
// GOTCHA: Don't Change Environment Override Tests
// =============================================================================

/*
 * The tests at lines 127-149 verify environment variable overrides.
 * These tests correctly use hardcoded strings because they're testing
 * that CUSTOM values (not the defaults) are respected.
 *
 * DO NOT CHANGE:
 * it('should use environment override for opus tier', () => {
 *   vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', 'custom-opus-model');
 *   expect(getModel('opus')).toBe('custom-opus-model');  // ✅ Correct
 * });
 */

// =============================================================================
// MODEL TIER MAPPING REFERENCE
// =============================================================================

/*
 * MODEL_NAMES constant (from src/config/constants.ts):
 * {
 *   opus: 'GLM-4.7',      // Highest quality, complex reasoning
 *   sonnet: 'GLM-4.7',    // Balanced, default for most agents
 *   haiku: 'GLM-4.5-Air'  // Fastest, simple operations
 * }
 *
 * KEY INSIGHT: Both opus and sonnet use GLM-4.7
 * This is intentional - they represent different usage patterns, not different models
 *
 * Agent Usage (from src/agents/agent-factory.ts):
 * - Architect agent: Uses 'sonnet' → GLM-4.7, 8192 tokens
 * - Researcher agent: Uses 'sonnet' → GLM-4.7, 4096 tokens
 * - Coder agent: Uses 'sonnet' → GLM-4.7, 4096 tokens
 * - QA agent: Uses 'sonnet' → GLM-4.7, 4096 tokens
 */
```

---

### Integration Points

```yaml
INPUT FROM P1.M2.T1.S1 (AUTH_TOKEN to API_KEY mapping):
  - File: tests/unit/config/environment.test.ts (from P1.M2.T1.S1)
  - Critical: Test file structure established
  - This PRP: Builds upon the test structure from S1

INPUT FROM P1.M2.T1.S2 (BASE_URL constant synchronization):
  - File: tests/unit/config/environment.test.ts (from P1.M2.T1.S2)
  - Pattern: Constant Synchronization Testing established
  - This PRP: Applies the same pattern to MODEL_NAMES
  - Benefit: Consistent approach across all configuration tests

INPUT FROM EXISTING CODE:
  - File: src/config/constants.ts
  - Constant: MODEL_NAMES (lines 43-50)
  - Values: opus: 'GLM-4.7', sonnet: 'GLM-4.7', haiku: 'GLM-4.5-Air'
  - Import path: '../../../src/config/constants.js' (from tests/unit/config/)

  - File: src/config/environment.ts
  - Function: getModel() (lines 96-99)
  - Logic: return process.env[MODEL_ENV_VARS[tier]] ?? MODEL_NAMES[tier]

  - File: src/config/types.ts
  - Type: ModelTier (line 23)
  - Definition: 'opus' | 'sonnet' | 'haiku'

OUTPUT FOR SUBSEQUENT WORK:
  - Pattern: Constant synchronization for model names
  - Confidence: Tests detect if MODEL_NAMES values change
  - Consistency: All config tests now use constant synchronization pattern

DIRECTORY STRUCTURE:
  - Modify: tests/unit/config/environment.test.ts (existing file)
  - Changes: 4 modifications (1 import, 3 assertions)
  - Lines affected: 17 (import), 107 (assertion), 115 (assertion), 123 (assertion)

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

# Expected: No type errors (import is valid, MODEL_NAMES.opus type is 'GLM-4.7')

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

# Expected: All tests pass (17 tests: 5 configureEnvironment, 7 getModel, 5 validateEnvironment)

# Run with coverage
npm run test:coverage -- tests/unit/config/environment.test.ts

# Expected: 100% coverage of src/config/environment.ts maintained

# Run specific getModel tests
npm test -- -t "getModel"

# Expected: 7 tests pass (3 default values, 3 environment overrides, 1 additional)

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
# Edit src/config/constants.ts line 45:
#   opus: 'GLM-4.8',  // Changed from 'GLM-4.7'

# Step 2: Run tests - they SHOULD FAIL
npm test -- tests/unit/config/environment.test.ts

# Expected: Tests fail with assertion error showing mismatch

# Step 3: Revert change
# Edit src/config/constants.ts line 45 back to:
#   opus: 'GLM-4.7',

# Step 4: Run tests - they SHOULD PASS
npm test -- tests/unit/config/environment.test.ts

# Expected: All tests pass again
```

### Level 4: Domain-Specific Validation

```bash
# Constant Synchronization Validation
# Verify tests detect configuration drift
npm test -- -t "should return default model for opus tier"
npm test -- -t "should return default model for sonnet tier"
npm test -- -t "should return default model for haiku tier"

# Expected: All three tests verify against MODEL_NAMES constant

# Import Validation
# Verify the import statement is correct
grep -n "MODEL_NAMES" tests/unit/config/environment.test.ts

# Expected output:
#   12:import { MODEL_NAMES } from '../../../src/config/constants.js';
#   107:  expect(getModel('opus')).toBe(MODEL_NAMES.opus);
#   115:  expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);
#   123:  expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);

# Magic String Elimination Validation
# Verify no hardcoded model names remain in default value tests
grep -n "GLM-4" tests/unit/config/environment.test.ts | grep -v "custom"

# Expected: Only matches in comments, not in assertions
# (Custom model tests may still have 'custom-*-model' which is correct)

# Test Isolation Validation
# Verify tests don't pollute each other
npm test -- tests/unit/setup-verification.test.ts

# Expected: Setup verification tests confirm clean environment between tests

# Model Tier Exhaustiveness Validation
# Verify all three tiers are tested
npm test -- -t "opus"
npm test -- -t "sonnet"
npm test -- -t "haiku"

# Expected: Tests exist for all three tiers
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Import statement added: `import { MODEL_NAMES } from '../../../src/config/constants.js';`
- [ ] Line 107 updated: `expect(getModel('opus')).toBe(MODEL_NAMES.opus);`
- [ ] Line 115 updated: `expect(getModel('sonnet')).toBe(MODEL_NAMES.sonnet);`
- [ ] Line 123 updated: `expect(getModel('haiku')).toBe(MODEL_NAMES.haiku);`
- [ ] All tests pass: `npm test -- tests/unit/config/environment.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npx prettier --check`
- [ ] 100% coverage maintained: `npm run test:coverage`
- [ ] Constant synchronization verified: tests fail when constants change

### Feature Validation

- [ ] Test 1: Opus tier test uses MODEL_NAMES.opus
- [ ] Test 2: Sonnet tier test uses MODEL_NAMES.sonnet
- [ ] Test 3: Haiku tier test uses MODEL_NAMES.haiku
- [ ] Import statement correctly placed in existing import block
- [ ] No new magic strings introduced
- [ ] Tests detect configuration drift (verified by temporarily changing constants)
- [ ] Environment override tests unchanged (correctly use custom values)

### Code Quality Validation

- [ ] Follows "Constant Synchronization Testing" pattern (from P1.M2.T1.S2)
- [ ] Import path is correct relative to test file location
- [ ] TypeScript types are satisfied (const assertion provides literal type)
- [ ] Test comments preserved and accurate
- [ ] No duplicate imports
- [ ] Consistent with codebase patterns
- [ ] Maintains consistency with P1.M2.T1.S2 approach

### Documentation & Deployment

- [ ] Research findings stored in plan/002_1e734971e481/P1M2T1S3/research/
- [ ] Pattern documented for future reference (model-tier-testing-patterns.md)
- [ ] GLM model research documented (glm-model-research.md)
- [ ] No environment variables hardcoded (uses constant reference)
- [ ] Contract clarification documented (Test 3 not applicable)

---

## Anti-Patterns to Avoid

- ❌ **Don't create separate import blocks** - Add MODEL_NAMES to existing imports
- ❌ **Don't change the environment override tests** - Lines 127-149 correctly test custom values
- ❌ **Don't add runtime validation tests** - Test 3 from contract is not applicable (no implementation)
- ❌ **Don't add local afterEach** - Global afterEach in tests/setup.ts already handles cleanup
- ❌ **Don't skip verification test** - Prove constant synchronization works by temporarily changing constants
- ❌ **Don't modify constants.ts** - Only modify the test file
- ❌ **Don't break existing tests** - All existing tests must still pass
- ❌ **Don't introduce new magic strings** - Replace all hardcoded model names with constant references
- ❌ **Don't forget to revert test changes** - When verifying synchronization, revert the constant change
- ❌ **Don't skip coverage check** - 100% coverage is required
- ❌ **Don't confuse opus and sonnet** - Both map to GLM-4.7 (this is intentional)
- ❌ **Don't assume invalid tier validation** - ModelTier is compile-time only, no runtime validation exists

---

## Appendix: Decision Rationale

### Why is this a separate subtask from S1 and S2?

P1.M2.T1.S1 added the idempotency test. P1.M2.T1.S2 fixed the BASE_URL constant synchronization. P1.M2.T1.S3 fixes the MODEL_NAMES constant synchronization. They're separate because:
1. **Different Goals**: S1 verified idempotency, S2 verified BASE_URL constants, S3 verifies MODEL_NAMES constants
2. **Incremental Improvement**: Each subtask addresses one configuration aspect
3. **Parallel Execution Potential**: S2 and S3 could have run in parallel (both fix constant synchronization gaps)

### What about "Test 3: Invalid tier throws error" from the contract?

This requirement is **NOT APPLICABLE** for the following reasons:
1. **No Implementation**: The `getModel()` function does not include runtime validation for invalid tiers
2. **Compile-Time Only**: The `ModelTier` type is a TypeScript union type (`'opus' | 'sonnet' | 'haiku'`) that provides compile-time safety
3. **Type Safety**: Invalid tiers are caught at compile time by TypeScript, not at runtime
4. **Documentation Issue**: The contract definition appears to have copied a pattern from other tests without checking if implementation exists
5. **Future Work**: If runtime validation is added to `getModel()`, then this test would be applicable

**Correct approach**: This PRP focuses on the constant synchronization gap (Tests 1, 2, 4) and documents Test 3 as deferred.

### Why do opus and sonnet both map to GLM-4.7?

This is **intentional by design**:
- **Opus tier**: Represents the highest quality usage pattern for complex reasoning tasks
- **Sonnet tier**: Represents balanced performance for most agent operations
- **Same model**: Both use GLM-4.7 but represent different token limits and usage contexts
- **Future flexibility**: If z.ai adds a more premium model, opus could be updated separately
- **Agent factory**: All agents currently use the 'sonnet' tier, with only Architect having higher token limits

### Is this a bug fix or quality improvement?

It's a **quality improvement**:
- Tests currently pass (no bug)
- Tests work correctly for the current constant values
- The issue is that tests don't detect if the constants change
- This is a "test the tests" improvement - making tests more robust

### Why didn't earlier subtasks use constants in the first place?

S1 focused on adding idempotency testing. S2 focused on BASE_URL synchronization. S3 addresses MODEL_NAMES synchronization. Each subtask improves a specific aspect of test quality in a focused, incremental way.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from source code (constants.ts, environment.ts, types.ts)
- [x] Existing test patterns analyzed and documented
- [x] Constant synchronization pattern established in P1.M2.T1.S2
- [x] Specific file locations identified (lines 17, 107, 115, 123)
- [x] All modification steps specified
- [x] Verification approach documented (temporarily change constant to prove detection)
- [x] Research findings stored for reference
- [x] Anti-patterns documented
- [x] Contract issues clarified (Test 3 not applicable)

**Risk Mitigation**:
- Minimal change (4 modifications: 1 import, 3 assertions)
- Existing tests provide reference pattern
- No new dependencies or complex logic
- Clear success criteria
- Verification test proves the improvement works
- Follows established pattern from P1.M2.T1.S2

**Known Risks**:
- None - this is a straightforward quality improvement with comprehensive context

---

**END OF PRP**
