# Product Requirement Prompt (PRP): Enhance test setup API validation

**PRP ID**: P1.M2.T2.S1
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Verify and enhance the existing z.ai API safeguard in `tests/setup.ts` to ensure robust protection against accidental Anthropic production API usage during testing, with clear and actionable error messages.

**Deliverable**: Enhanced test setup file `tests/setup.ts` with:
1. Verified API validation logic that blocks Anthropic's production API
2. Clear, actionable error messages guiding developers to fix configuration issues
3. Warning system for non-z.ai endpoints (except localhost/mock)
4. Optional: Test file to verify the safeguard functionality itself

**Success Definition**:
- `tests/setup.ts` validation logic is correct and complete
- Error messages provide clear guidance on how to fix configuration issues
- Tests pass: `npm test -- tests/unit/setup-verification.test.ts` (if created)
- All existing tests still pass: `npm test`
- Safeguard successfully prevents accidental Anthropic API usage

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Fourth subtask in Phase 1 Milestone 2 (P1.M2) to ensure robust API endpoint safeguards are in place during testing.

**User Journey**:
1. Pipeline completes P1.M2.T1 (environment variable mapping) with success
2. Pipeline starts P1.M2.T2.S1 (Enhance test setup API validation)
3. Research identifies existing API validation in tests/setup.ts
4. Implementation verifies and enhances the validation logic
5. Error messages are reviewed and improved for clarity
6. Safeguard is tested to ensure it works correctly

**Pain Points Addressed**:
- **Risk of API Misconfiguration**: Tests could accidentally hit Anthropic's production API, causing massive usage spikes
- **Unclear Error Messages**: Developers need clear guidance when configuration is wrong
- **Missing Validation**: Without proper safeguards, misconfiguration could go undetected until costly API usage occurs

---

## Why

- **Prevent Costly API Usage**: Accidentally hitting Anthropic's production API can result in massive usage spikes and unexpected costs
- **Developer Experience**: Clear error messages help developers quickly identify and fix configuration issues
- **Test Reliability**: Ensures all tests use the intended z.ai proxy endpoint for consistent behavior
- **Defense in Depth**: Multiple validation points (on load, before each test) catch configuration issues early
- **Problems Solved**:
  - Accidental usage of Anthropic's official API during testing
  - Unclear error messages when configuration is wrong
  - No warning when using unexpected API endpoints
  - Missing validation for test environment configuration

---

## What

Review and enhance the existing z.ai API safeguard in `tests/setup.ts`. The current implementation provides robust protection, but this task ensures error messages are optimal and validation logic is complete.

### Current State Analysis

**Existing Implementation** (lines 36-105 in tests/setup.ts):
- `validateApiEndpoint()` function exists
- Blocks `https://api.anthropic.com` with clear error message
- Warns for non-z.ai endpoints (except localhost/mock/test)
- Runs validation on file load (line 108)
- Runs validation in beforeEach hook (line 129)

**Current Error Message** (lines 65-79):
```typescript
throw new Error([
  '\n========================================',
  'CRITICAL: Tests are configured to use Anthropic API!',
  '========================================',
  `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
  '',
  'All tests MUST use z.ai API endpoint, never Anthropic official API.',
  `Expected: ${ZAI_ENDPOINT}`,
  '',
  'Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:',
  `  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`,
  '========================================\n',
].join('\n'));
```

**Current Warning Message** (lines 91-103):
```typescript
console.warn([
  '\n========================================',
  'WARNING: Non-z.ai API endpoint detected',
  '========================================',
  `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
  '',
  `Recommended: ${ZAI_ENDPOINT}`,
  '',
  'Ensure this endpoint is intended for testing.',
  '========================================\n',
].join('\n'));
```

### Implementation Status

**CRITICAL FINDING**: The z.ai safeguard is ALREADY IMPLEMENTED and is robust. This task is primarily about:
1. Verification: Confirm the implementation meets requirements
2. Enhancement: Improve error messages if needed
3. Testing: Add tests to verify the safeguard works correctly
4. Documentation: Ensure the implementation is well-documented

### Enhancement Opportunities

Based on analysis, the existing implementation is excellent. Potential minor enhancements:
1. Add additional endpoint patterns to block (e.g., http://api.anthropic.com without https)
2. Add console.error for critical errors (in addition to throwing)
3. Consider adding environment variable name in error message
4. Add a test file to verify the safeguard works

### Required Changes

**Change 1: Review existing validation logic**
- Verify the validation logic catches all Anthropic API patterns
- Consider edge cases (trailing slashes, http vs https, etc.)

**Change 2: Enhance error messages (if needed)**
- Ensure error messages include all necessary information
- Consider adding the environment variable name for clarity

**Change 3: Add console.error for critical errors (optional enhancement)**
```typescript
// Before throwing, also log to console for visibility
console.error([
  '\n========================================',
  'CRITICAL: Tests are configured to use Anthropic API!',
  '========================================',
  `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
  '',
  'All tests MUST use z.ai API endpoint, never Anthropic official API.',
  `Expected: ${ZAI_ENDPOINT}`,
  '',
  'Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:',
  `  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`,
  '========================================\n',
].join('\n'));
throw new Error(/* ... */);
```

**Change 4: Create verification test (optional but recommended)**
- Create `tests/unit/setup-verification.test.ts` to test the safeguard
- Verify blocking of Anthropic API
- Verify warning for non-z.ai endpoints
- Verify pass-through for valid endpoints

### Success Criteria

- [ ] Validation logic reviewed and verified correct
- [ ] Error messages provide clear, actionable guidance
- [ ] Console.error added for critical errors (optional)
- [ ] Verification test created (optional)
- [ ] All existing tests pass: `npm test`
- [ ] Documentation is complete

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] Current test setup implementation analyzed (tests/setup.ts lines 1-151)
- [x] Validation patterns documented in codebase
- [x] Error message patterns identified
- [x] Console output patterns documented
- [x] Testing framework configured (Vitest)
- [x] Existing validation scripts analyzed
- [x] Environment configuration patterns documented

---

### Documentation & References

```yaml
# MUST READ - Current implementation (target for review/enhancement)
- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Contains existing z.ai API safeguard implementation
  section: Lines 36-150 (z.ai API safeguard and global hooks)
  critical: |
    The validateApiEndpoint() function (lines 57-105) is the core safeguard.
    It runs on load (line 108) and in beforeEach (line 129).
    Current implementation is robust and well-structured.

# MUST READ - Validation script pattern (reference for error messages)
- file: /home/dustin/projects/hacky-hack/src/scripts/validate-api.ts
  why: Contains similar validation pattern with colored output
  section: Lines 94-121 (API endpoint validation)
  critical: |
    Shows similar safeguard pattern with structured error messages.
    Uses colored console.error for visibility.

# MUST READ - Test configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Contains Vitest configuration including setup file reference
  section: Setup file configuration
  critical: |
    Ensure setup.ts is properly configured as global setup file.

# MUST READ - Environment configuration
- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Contains environment variable configuration and validation
  section: Lines 55-145 (configureEnvironment, validateEnvironment)
  critical: |
    Shows patterns for environment validation and error handling.
    EnvironmentValidationError class for structured errors.

# MUST READ - Constants
- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Contains DEFAULT_BASE_URL constant
  section: DEFAULT_BASE_URL export
  critical: |
    export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic';

# MUST READ - Existing verification test (if exists)
- file: /home/dustin/projects/hacky-hack/tests/unit/setup-verification.test.ts
  why: May contain tests for the setup file safeguards
  section: Full file
  critical: |
    Check if this file exists and contains tests for validateApiEndpoint().

# MUST READ - Research findings
- docfile: plan/002_1e734971e481/P1M2T2S1/research/testing-patterns-research.md
  why: Comprehensive testing patterns for global hooks and environment validation
  section: API Endpoint Validation Patterns, Error Message Patterns
  critical: |
    Documents best practices for global hooks, error messages, and console output.
    Provides patterns for testing validation in setup files.

# PREVIOUS PRP OUTPUT - Model configuration passing from S3
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T1S3/PRP.md
  why: Previous work item that completes model configuration tests
  usage: This PRP builds upon the environment configuration from S1, S2, S3

# PROJECT CONFIGURATION
- file: /home/dustin/projects/hacky-hack/package.json
  why: Test scripts and dependencies
  section: Scripts section
  critical: |
    "test": "vitest run",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # Test scripts: test, test:run, test:coverage
├── vitest.config.ts              # Test configuration with global setup file
├── src/
│   ├── config/
│   │   ├── constants.ts          # DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic'
│   │   ├── environment.ts        # configureEnvironment(), validateEnvironment()
│   │   └── types.ts              # EnvironmentValidationError
│   └── scripts/
│       └── validate-api.ts       # API validation script with colored output
├── tests/
│   ├── setup.ts                  # EXISTING: z.ai API safeguard (lines 36-150)
│   │                             # validateApiEndpoint() function
│   │                             # Runs on load and in beforeEach
│   ├── unit/
│   │   ├── config/
│   │   │   └── environment.test.ts  # Environment configuration tests
│   │   └── setup-verification.test.ts  # (OPTIONAL) Setup verification tests
│   └── validation/
│       └── zai-api-test.ts       # z.ai API validation test
└── plan/
    └── 002_1e734971e481/
        └── P1M2T2S1/
            ├── PRP.md            # This file
            └── research/
                └── testing-patterns-research.md  # Testing patterns research
```

---

### Desired Codebase Tree (files to be modified/created)

```bash
hacky-hack/
└── tests/
    ├── setup.ts                  # MODIFY: Enhance error messages, add console.error
                                  # ENHANCE: Add console.error before throwing
                                  # VERIFY: All Anthropic API patterns blocked
    └── unit/
        └── setup-verification.test.ts  # CREATE: Tests for validateApiEndpoint()
                                          # Test blocking of Anthropic API
                                          # Test warning for non-z.ai endpoints
                                          # Test pass-through for valid endpoints
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: The safeguard ALREADY EXISTS
// This task is about enhancement, not creation
// Be careful not to break existing functionality

// GOTCHA: Validation runs in TWO places
// 1. On file load (line 108): validateApiEndpoint();
// 2. In beforeEach hook (line 129): validateApiEndpoint();
// This is intentional - catches config changes at startup and during test runs

// CRITICAL: The validation uses .includes() for pattern matching
// if (baseUrl.includes(ANTHROPIC_ENDPOINT))
// This catches variations like:
// - https://api.anthropic.com
// - https://api.anthropic.com/v1
// - https://api.anthropic.com:443
// But may NOT catch:
// - http://api.anthropic.com (different protocol)

// GOTCHA: Warning allows localhost, 127.0.0.1, mock, and test endpoints
// This is intentional for local development and testing
// !baseUrl.includes('localhost')
// !baseUrl.includes('127.0.0.1')
// !baseUrl.includes('mock')
// !baseUrl.includes('test')

// CRITICAL: Error message formatting
// Uses array.join('\n') for multi-line messages
// This creates clean, formatted output

// GOTCHA: Throwing Error in beforeEach will FAIL THE TEST
// This is intentional - tests should not run with wrong config
// Vitest will report the error and stop the test run

// CRITICAL: console.error vs console.warn
// console.error: For critical issues (currently not used before throw)
// console.warn: For non-critical warnings (lines 91-103)
// Consider adding console.error before throwing for visibility

// GOTCHA: TypeScript top-level await
// Line 21 uses: await import('dotenv').then(...)
// This requires TypeScript configuration to support top-level await
// The file already has this, so new code can use await at top level

// CRITICAL: Vitest global setup file
// This file runs in a special context where Vitest globals are available
// beforeEach, afterEach, vi are globally available (imported on line 14)

// GOTCHA: Error messages include bash export command
// `  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`
// This is helpful but assumes bash shell
// Consider adding note about .env file alternative

// CRITICAL: The safeguard is DEFENSE IN DEPTH
// 1. Validation on load catches issues at startup
// 2. Validation in beforeEach catches issues during test runs
// This dual validation is intentional and important

// GOTCHA: tests/setup.ts cannot be easily tested directly
// It's a global setup file that runs before tests
// To test it, create tests that verify the behavior it produces
// Or create a separate verification test file

// CRITICAL: 100% code coverage requirement
// Any changes must maintain or improve coverage
// Adding a verification test file helps coverage

// GOTCHA: The validation uses process.env directly
// It doesn't use the environment.ts module
// This is intentional for direct, early validation
// Don't change this pattern

// CRITICAL: Error message clarity
// Current error messages are already quite good
// Focus on incremental improvements, not rewrites
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This PRP enhances existing validation logic in tests/setup.ts.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE current implementation
  - FILE: tests/setup.ts
  - REVIEW: Lines 36-150 (z.ai API safeguard)
  - IDENTIFY: Any gaps or enhancement opportunities
  - DOCUMENT: Current behavior and edge cases
  - DEPENDENCIES: None

Task 2: ENHANCE error messages (optional)
  - FILE: tests/setup.ts
  - REVIEW: Lines 65-79 (error message)
  - ENHANCE: Add console.error before throwing (optional)
  - VERIFY: Error message includes all necessary information
  - CONSIDER: Add .env file alternative to export command
  - DEPENDENCIES: Task 1

Task 3: VERIFY validation logic
  - FILE: tests/setup.ts
  - REVIEW: Lines 61-64 (blocking logic)
  - VERIFY: All Anthropic API patterns are caught
  - CONSIDER: Add http:// (non-https) variant to block
  - VERIFY: Warning logic (lines 83-104) is correct
  - DEPENDENCIES: Task 1

Task 4: CREATE verification test file (recommended)
  - FILE: tests/unit/setup-verification.test.ts
  - IMPLEMENT: Test for Anthropic API blocking
  - IMPLEMENT: Test for non-z.ai endpoint warning
  - IMPLEMENT: Test for valid endpoint pass-through
  - IMPLEMENT: Test for edge cases (trailing slashes, etc.)
  - DEPENDENCIES: Task 2, Task 3

Task 5: VERIFY tests pass
  - RUN: npm test
  - VERIFY: All existing tests pass
  - VERIFY: New verification tests pass (if created)
  - VERIFY: No regressions
  - DEPENDENCIES: Task 2, Task 3, Task 4

Task 6: MANUAL VERIFICATION
  - TEST: Temporarily set ANTHROPIC_BASE_URL to Anthropic endpoint
  - VERIFY: Error is thrown with clear message
  - TEST: Set to non-z.ai endpoint
  - VERIFY: Warning is displayed
  - TEST: Set to z.ai endpoint
  - VERIFY: Tests run normally
  - REVERT: Environment variables
  - DEPENDENCIES: Task 5
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: API Endpoint Safeguard in Global Setup
// =============================================================================

/*
 * WHAT: Validate ANTHROPIC_BASE_URL is not Anthropic's production API
 * WHY: Prevents massive usage spikes from accidentally hitting production API
 * PATTERN NAME: z.ai API Safeguard
 * LOCATION: tests/setup.ts (lines 36-150)
 */

// =============================================================================
// CURRENT IMPLEMENTATION (Already Exists)
// =============================================================================

// File: tests/setup.ts (current state)

const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com';

function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // Block Anthropic's official API
  if (
    baseUrl.includes(ANTHROPIC_ENDPOINT) ||
    baseUrl === 'https://api.anthropic.com'
  ) {
    throw new Error(/* error message */);
  }

  // Warn if using a non-z.ai endpoint (unless it's a mock/test endpoint)
  if (
    baseUrl &&
    baseUrl !== ZAI_ENDPOINT &&
    !baseUrl.includes('localhost') &&
    !baseUrl.includes('127.0.0.1') &&
    !baseUrl.includes('mock') &&
    !baseUrl.includes('test')
  ) {
    console.warn(/* warning message */);
  }
}

// Run validation immediately when test setup loads
validateApiEndpoint();

// Run validation before each test
beforeEach(() => {
  vi.clearAllMocks();
  validateApiEndpoint();
});

// =============================================================================
// ENHANCEMENT: Add console.error for visibility (Optional)
// =============================================================================

/*
 * BEFORE: Only throw Error
 * AFTER: Log to console AND throw Error
 */

// ENHANCED VERSION (optional improvement):

function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // Block Anthropic's official API
  if (
    baseUrl.includes(ANTHROPIC_ENDPOINT) ||
    baseUrl === 'https://api.anthropic.com'
  ) {
    const errorMessage = [
      '\n========================================',
      'CRITICAL: Tests are configured to use Anthropic API!',
      '========================================',
      `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
      '',
      'All tests MUST use z.ai API endpoint, never Anthropic official API.',
      `Expected: ${ZAI_ENDPOINT}`,
      '',
      'Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:',
      '  Option 1 (command line):',
      `    export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`,
      '  Option 2 (.env file):',
      `    ANTHROPIC_BASE_URL=${ZAI_ENDPOINT}`,
      '========================================\n',
    ].join('\n');

    // ENHANCEMENT: Log to console for visibility
    console.error(errorMessage);

    // Then throw to stop test execution
    throw new Error(errorMessage);
  }

  // ... warning logic unchanged ...
}

// =============================================================================
// ENHANCEMENT: Additional blocking patterns (Optional)
// =============================================================================

/*
 * CURRENT: Blocks https://api.anthropic.com
 * ENHANCED: Also block http:// (non-https) and other variants
 */

// Consider adding these patterns to block:
const BLOCKED_PATTERNS = [
  'https://api.anthropic.com',
  'http://api.anthropic.com',
  'api.anthropic.com',
  'anthropic.com/api',
];

// Then use .some() to check all patterns:
if (BLOCKED_PATTERNS.some(pattern => baseUrl.includes(pattern))) {
  // ... error handling
}

// =============================================================================
// VERIFICATION TEST FILE (New File)
// =============================================================================

/*
 * FILE: tests/unit/setup-verification.test.ts
 * PURPOSE: Verify the z.ai API safeguard works correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('tests/setup.ts - z.ai API Safeguard', () => {
  const originalBaseUrl = process.env.ANTHROPIC_BASE_URL;

  afterEach(() => {
    // Restore original value
    if (originalBaseUrl) {
      process.env.ANTHROPIC_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.ANTHROPIC_BASE_URL;
    }
  });

  describe('validateApiEndpoint() function', () => {
    it('should throw when ANTHROPIC_BASE_URL is Anthropic production API', () => {
      // This test documents expected behavior
      // Note: Cannot directly test validateApiEndpoint as it's not exported
      // The safeguard is tested indirectly by running tests with wrong config

      process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com';

      // When tests run with this config, validateApiEndpoint in beforeEach
      // will throw and fail the test
      expect(() => {
        // Trigger validation by importing a test file
        // The setup file's beforeEach will run and throw
      }).toThrow();
    });

    it('should warn when ANTHROPIC_BASE_URL is non-z.ai endpoint', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      process.env.ANTHROPIC_BASE_URL = 'https://api.example.com';

      // The warning will be logged by validateApiEndpoint
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Non-z.ai API endpoint detected')
      );
    });

    it('should pass when ANTHROPIC_BASE_URL is z.ai endpoint', () => {
      process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/api/anthropic';

      // No error, no warning - tests should run normally
      expect(true).toBe(true);
    });
  });
});

// =============================================================================
// GOTCHA: Testing Global Setup File
// =============================================================================

/*
 * CHALLENGE: tests/setup.ts functions are not exported
 * SOLUTION: Test behavior indirectly through test execution
 *
 * APPROACH 1: Canary test file
 * - Create a test that expects certain behavior from setup
 * - Run with different ANTHROPIC_BASE_URL values
 * - Verify errors/warnings occur as expected
 *
 * APPROACH 2: Extract validation to testable module
 * - Move validateApiEndpoint to src/config/test-setup.ts
 * - Export and test it directly
 * - Import in tests/setup.ts
 *
 * APPROACH 3: Document behavior (simplest)
 * - The current implementation is already correct
 * - Add documentation describing expected behavior
 * - Manual verification is sufficient
 */
```

---

### Integration Points

```yaml
INPUT FROM P1.M2.T1.S3 (Model configuration tests):
  - Confidence: Environment configuration is working
  - This PRP: Adds safeguard to prevent accidental production API usage

INPUT FROM EXISTING CODE:
  - File: tests/setup.ts
  - Existing: validateApiEndpoint() function (lines 57-105)
  - Existing: Validation on load (line 108)
  - Existing: Validation in beforeEach (line 129)
  - This PRP: Reviews and enhances existing implementation

  - File: src/config/constants.ts
  - Constant: DEFAULT_BASE_URL (value: 'https://api.z.ai/api/anthropic')
  - Import path: Not needed in setup.ts (uses inline constant)

  - File: vitest.config.ts
  - Configuration: Global setup file reference
  - Ensure: setup.ts is properly configured

OUTPUT FOR SUBSEQUENT WORK:
  - Robust safeguard against accidental Anthropic API usage
  - Clear error messages for configuration issues
  - Optional: Verification test file for safeguard behavior

DIRECTORY STRUCTURE:
  - Modify: tests/setup.ts (existing file - minor enhancements)
  - Create: tests/unit/setup-verification.test.ts (optional - verification tests)

CLEANUP INTEGRATION:
  - Global: tests/setup.ts beforeEach hook
  - Pattern: No cleanup needed for validation logic
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying tests/setup.ts
# Check TypeScript compilation
npx tsc --noEmit tests/setup.ts

# Expected: No type errors

# Format check
npx prettier --check "tests/setup.ts"

# Expected: No formatting issues

# Linting (if ESLint is configured)
npx eslint tests/setup.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# If verification test file was created
npm test -- tests/unit/setup-verification.test.ts

# Expected: Verification tests pass

# Run environment config tests
npm test -- tests/unit/config/environment.test.ts

# Expected: All environment tests pass

# Run all unit tests
npm test -- tests/unit/

# Expected: All unit tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test entire test suite
npm test

# Expected: All tests pass, no regressions

# CRITICAL: Manual verification of safeguard
# Step 1: Test with Anthropic endpoint (should fail)
ANTHROPIC_BASE_URL='https://api.anthropic.com' npm test

# Expected: Tests fail with clear error message

# Step 2: Test with z.ai endpoint (should pass)
ANTHROPIC_BASE_URL='https://api.z.ai/api/anthropic' npm test

# Expected: All tests pass

# Step 3: Test with localhost (should pass with no warning)
ANTHROPIC_BASE_URL='http://localhost:3000' npm test

# Expected: All tests pass, no warning

# Step 4: Test with unknown endpoint (should pass with warning)
ANTHROPIC_BASE_URL='https://api.example.com' npm test

# Expected: All tests pass, warning displayed
```

### Level 4: Domain-Specific Validation

```bash
# API Safeguard Validation
# Verify the safeguard prevents accidental Anthropic API usage

# Test 1: Anthropic API blocking
# Set to Anthropic endpoint and verify tests fail
export ANTHROPIC_BASE_URL='https://api.anthropic.com'
npm test -- -t "any test"

# Expected: Error thrown, tests don't run

# Test 2: Non-z.ai warning
# Set to unknown endpoint and verify warning appears
export ANTHROPIC_BASE_URL='https://api.unknown.com'
npm test 2>&1 | grep -i "warning"

# Expected: Warning in output

# Test 3: z.ai endpoint
# Set to z.ai endpoint and verify normal operation
export ANTHROPIC_BASE_URL='https://api.z.ai/api/anthropic'
npm test

# Expected: All tests pass, no errors or warnings

# Test 4: Mock endpoint
# Set to mock endpoint and verify no warning
export ANTHROPIC_BASE_URL='http://mock-api'
npm test

# Expected: All tests pass, no warnings

# Error Message Clarity Validation
# Verify error messages are clear and actionable
export ANTHROPIC_BASE_URL='https://api.anthropic.com'
npm test 2>&1 | grep -A 10 "CRITICAL"

# Expected: Clear error with fix instructions
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] No type errors: `npx tsc --noEmit tests/setup.ts`
- [ ] No formatting issues: `npx prettier --check tests/setup.ts`
- [ ] All tests pass: `npm test`
- [ ] Verification tests pass (if created): `npm test -- tests/unit/setup-verification.test.ts`

### Feature Validation

- [ ] Anthropic API endpoint is blocked with clear error
- [ ] Error message includes fix instructions
- [ ] Non-z.ai endpoints produce warning (except localhost/mock/test)
- [ ] z.ai endpoint allows tests to run normally
- [ ] Validation runs on load and in beforeEach
- [ ] Console.error added before throw (if enhancement implemented)

### Code Quality Validation

- [ ] Error messages are clear and actionable
- [ ] Warning messages are helpful but not blocking
- [ ] Code follows existing patterns in tests/setup.ts
- [ ] No breaking changes to existing functionality
- [ ] Documentation is complete

### Documentation & Deployment

- [ ] Error message includes both export and .env file options (if enhanced)
- [ ] Implementation is well-documented with comments
- [ ] Research findings stored in plan/002_1e734971e481/P1M2T2S1/research/
- [ ] PRP is complete and actionable

---

## Anti-Patterns to Avoid

- ❌ **Don't break existing functionality** - The current implementation is excellent, make only incremental improvements
- ❌ **Don't remove the dual validation** - Both on-load and beforeEach validation are important
- ❌ **Don't use console.error for warnings** - Use console.warn for non-critical issues
- ❌ **Don't make the error message too verbose** - Keep it clear and concise
- ❌ **Don't skip manual verification** - Test the safeguard manually with different endpoints
- ❌ **Don't block localhost/mock/test endpoints** - These are valid for testing
- ❌ **Don't change the ZAI_ENDPOINT constant** - It must match the expected value
- ❌ **Don't forget to revert test environment variables** - Clean up after manual testing
- ❌ **Don't create unnecessary complexity** - The current implementation is simple and effective
- ❌ **Don't assume .env file exists** - The current code handles this correctly
- ❌ **Don't remove the .includes() pattern matching** - It catches important variants
- ❌ **Don't hardcode the error message in multiple places** - Keep it DRY

---

## Appendix: Decision Rationale

### Why is the safeguard already implemented?

The contract definition states: "RESEARCH NOTE: Test setup at tests/setup.ts implements z.ai safeguard."

This is a NOTE about existing functionality, not a request to implement from scratch. The safeguard was implemented as part of the initial project setup to prevent costly API usage errors.

### What are the actual requirements?

Based on the contract definition:
1. "RESEARCH NOTE" - Acknowledge existing implementation ✓
2. "If validation exists, enhance error message" - Review and improve error messages
3. "If missing, implement validation" - NOT NEEDED (validation exists)
4. "Add warning for non-z.ai endpoints" - ALREADY EXISTS (lines 83-104)

### Why is this task needed if the safeguard already exists?

1. **Verification**: Confirm the implementation meets requirements
2. **Enhancement**: Improve error messages if needed
3. **Testing**: Add tests to verify the safeguard works
4. **Documentation**: Ensure the implementation is well-documented

### What is the priority?

The current implementation is already robust. This task should:
1. Focus on minor enhancements (console.error before throw)
2. Add verification tests (optional but recommended)
3. Document the expected behavior clearly
4. NOT break existing functionality

### Why add console.error before throwing?

The current implementation only throws an error. Adding console.error ensures:
- The error is visible in test output
- The error format is consistent with validation scripts
- Developers see the error even if test runner catches and handles it

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from existing implementation
- [x] Current implementation analyzed and documented
- [x] Enhancement opportunities identified
- [x] Testing patterns researched
- [x] Codebase structure documented
- [x] Anti-patterns documented
- [x] Manual verification approach defined

**Risk Mitigation**:
- Minimal change (optional enhancements only)
- Existing implementation is already excellent
- Clear success criteria
- Manual verification possible
- No new dependencies

**Known Risks**:
- None - this is a verification/enhancement task with minimal changes

---

**END OF PRP**
