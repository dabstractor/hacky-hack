# Product Requirement Prompt (PRP): Add validation script API checks

**PRP ID**: P1.M2.T2.S2
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Verify and ensure the validation script at `/src/scripts/validate-api.ts` has comprehensive API safety checks that prevent accidental Anthropic production API usage, with clear exit codes and actionable error messages.

**Deliverable**: Reviewed and enhanced validation script (`/src/scripts/validate-api.ts`) with:

1. BASE_URL check before any API calls
2. Exit code 1 if Anthropic API detected
3. Clear error message with fix instructions
4. Tests z.ai endpoint with `/v1/messages`
5. Validates response structure includes `id`, `type`, `role`, `content`
6. Warning if endpoint is neither z.ai nor localhost/mock/test

**Success Definition**:

- `npx tsx src/scripts/validate-api.ts` runs successfully with z.ai endpoint
- Script exits with code 1 if Anthropic API detected
- Script exits with code 0 on successful validation
- Script shows warning for non-z.ai endpoints (except localhost/mock/test)
- All response structure validations pass

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Fifth subtask in Phase 1 Milestone 2 (P1.M2) to ensure the API validation script has comprehensive safety checks before allowing any API operations.

**User Journey**:

1. Pipeline completes P1.M2.T2.S1 (Enhance test setup API validation)
2. Pipeline starts P1.M2.T2.S2 (Add validation script API checks)
3. Review existing validation script implementation
4. Verify or add missing API safety checks
5. Ensure proper exit codes and error messages
6. Run validation script to confirm it works correctly

**Pain Points Addressed**:

- **Risk of Accidental API Usage**: Without proper safeguards, developers could accidentally run the script with Anthropic's production API
- **Unclear Exit Behavior**: Exit codes need to be consistent for CI/CD integration
- **Missing Warnings**: Non-standard endpoints should trigger warnings
- **Incomplete Validation**: Response structure validation ensures API compatibility

---

## Why

- **Prevent Costly API Mistakes**: The validation script is a gatekeeper - it must stop execution if configured for Anthropic's production API
- **CI/CD Integration**: Proper exit codes (0=success, 1=failure) enable automation and pipelines
- **Developer Experience**: Clear error messages with fix instructions reduce debugging time
- **API Compatibility**: Response structure validation ensures z.ai API compatibility
- **Problems Solved**:
  - Accidental Anthropic API usage during validation
  - Inconsistent exit codes breaking automation
  - Missing warnings for unexpected endpoints
  - Incomplete API compatibility verification

---

## What

Review and enhance the validation script at `/src/scripts/validate-api.ts` to ensure comprehensive API safety checks. The script already implements most required functionality - verify completeness and add any missing pieces.

### Current State Analysis

**Existing Implementation** (`/src/scripts/validate-api.ts`):

- ✅ Checks BASE_URL before API calls (lines 104-120)
- ✅ Exits with code 1 if Anthropic API detected (line 119: `process.exit(1)`)
- ✅ Provides clear error message (lines 106-118)
- ✅ Tests z.ai endpoint with `/v1/messages` (lines 338-448)
- ✅ Validates response structure with type guard (lines 75-88, 388-417)
- ❓ Missing: Warning for non-z.ai endpoints (needs verification)
- ❓ Missing: Warning for localhost/mock/test exceptions (needs verification)

**Current Error Message** (lines 106-118):

```typescript
log.error('========================================');
log.error('CRITICAL: Configured to use Anthropic API!');
log.error('========================================');
log.error(`Current ANTHROPIC_BASE_URL: ${configuredBaseUrl}`);
log.error('');
log.error(
  'This script requires z.ai API endpoint, never Anthropic official API.'
);
log.error(`Expected: ${ZAI_ENDPOINT}`);
log.error('');
log.error('Fix: Unset ANTHROPIC_BASE_URL or set to z.ai endpoint:');
log.error(`  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`);
log.error('========================================');
process.exit(1);
```

**Response Structure Validation** (lines 75-88):

```typescript
function isValidMessageResponse(data: unknown): data is MessageResponse {
  if (typeof data !== 'object' || data === null) return false;
  const response = data as Record<string, unknown>;
  return (
    typeof response.id === 'string' &&
    typeof response.type === 'string' &&
    response.role === 'assistant' &&
    Array.isArray(response.content) &&
    typeof response.model === 'string' &&
    typeof response.stop_reason === 'string' &&
    typeof response.usage === 'object' &&
    response.usage !== null
  );
}
```

### Implementation Status

**EXISTING IMPLEMENTATION**: The validation script at `/src/scripts/validate-api.ts` already exists and implements most required safeguards. This task is primarily about:

1. **Verification**: Confirm all required checks are present
2. **Enhancement**: Add warning for non-z.ai endpoints if missing
3. **Testing**: Verify exit codes work correctly
4. **Documentation**: Ensure behavior is well-documented

### Required Changes

**Change 1: Verify BASE_URL check exists**

- ✅ Already implemented (lines 104-120)
- The check uses `.includes(ANTHROPIC_ENDPOINT)` pattern
- This catches variations like `https://api.anthropic.com/v1`

**Change 2: Verify exit code 1 for Anthropic API**

- ✅ Already implemented (line 119: `process.exit(1)`)
- Error message is clear and actionable

**Change 3: Verify /v1/messages endpoint test**

- ✅ Already implemented (lines 338-448: `testMessageCompletion()`)
- Tests with `getModel('sonnet')` and validates response

**Change 4: Verify response structure validation**

- ✅ Already implemented (lines 75-88: `isValidMessageResponse()`)
- Validates: `id`, `type`, `role`, `content`, `model`, `stop_reason`, `usage`

**Change 5: ADD Warning for non-z.ai endpoints** (MISSING - needs implementation)

```typescript
// ADD THIS after the Anthropic API check (after line 120)
// Warn if using a non-z.ai endpoint (unless it's a mock/test endpoint)
if (
  configuredBaseUrl &&
  configuredBaseUrl !== ZAI_ENDPOINT &&
  !configuredBaseUrl.includes('localhost') &&
  !configuredBaseUrl.includes('127.0.0.1') &&
  !configuredBaseUrl.includes('mock') &&
  !configuredBaseUrl.includes('test')
) {
  log.warn('========================================');
  log.warn('WARNING: Non-z.ai API endpoint detected');
  log.warn('========================================');
  log.warn(`Current ANTHROPIC_BASE_URL: ${configuredBaseUrl}`);
  log.warn('');
  log.warn(`Recommended: ${ZAI_ENDPOINT}`);
  log.warn('');
  log.warn('Ensure this endpoint is intended for testing.');
  log.warn('========================================');
}
```

### Success Criteria

- [ ] BASE_URL check verified before any API calls
- [ ] Exit code 1 confirmed when Anthropic API detected
- [ ] Exit code 0 confirmed on successful validation
- [ ] Error message includes clear fix instructions
- [ ] Response structure validation includes id, type, role, content
- [ ] Warning added for non-z.ai endpoints (except localhost/mock/test)
- [ ] Script can be run with: `npm run validate:api`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] Validation script implementation analyzed (535 lines)
- [x] Existing safeguard patterns documented (tests/setup.ts)
- [x] Environment configuration patterns understood
- [x] Exit code conventions established
- [x] Console output patterns documented (colors, logging)
- [x] Type guard patterns for API responses
- [x] Test patterns for process.exit() behavior

---

### Documentation & References

```yaml
# MUST READ - Target file for review/enhancement
- file: /home/dustin/projects/hacky-hack/src/scripts/validate-api.ts
  why: The validation script to review and enhance
  section: Full file (535 lines)
  critical: |
    Lines 94-121: API endpoint safeguard (ALREADY EXISTS)
    Lines 75-88: Response structure type guard (ALREADY EXISTS)
    Lines 338-448: Message completion test (ALREADY EXISTS)
    MISSING: Warning for non-z.ai endpoints (NEEDS IMPLEMENTATION)

# MUST READ - Similar safeguard pattern from P1.M2.T2.S1
- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Shows the warning pattern for non-z.ai endpoints
  section: Lines 82-104 (warning logic)
  critical: |
    if (baseUrl && baseUrl !== ZAI_ENDPOINT &&
        !baseUrl.includes('localhost') &&
        !baseUrl.includes('127.0.0.1') &&
        !baseUrl.includes('mock') &&
        !baseUrl.includes('test')) {
      console.warn(/* ... */);
    }
    Use this exact pattern in validate-api.ts

# MUST READ - Environment configuration
- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Contains configureEnvironment() and validateEnvironment() used by script
  section: Lines 55-145 (configureEnvironment, validateEnvironment, getModel)
  critical: |
    configureEnvironment() MUST be called before accessing ANTHROPIC_API_KEY
    Maps ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY
    Sets default ANTHROPIC_BASE_URL to DEFAULT_BASE_URL

# MUST READ - Constants
- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Contains ZAI_ENDPOINT constant used in safeguard
  section: DEFAULT_BASE_URL export
  critical: |
    export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic';
    Use inline constant in validate-api.ts (already defined on line 96)

# MUST READ - Test version for reference
- file: /home/dustin/projects/hacky-hack/tests/validation/zai-api-test.ts
  why: Similar validation script with comprehensive test suite
  section: Lines 33-58 (safeguard implementation), lines 102-688 (test class)
  critical: |
    Shows similar safeguard pattern with colored output
    Warning NOT implemented in test version either
    Use as reference for test structure, not for warning pattern

# PROJECT CONFIGURATION
- file: /home/dustin/projects/hacky-hack/package.json
  why: Contains script to run validation
  section: Scripts section, line 44
  critical: |
    "validate:api": "tsx src/scripts/validate-api.ts"
    Run with: npm run validate:api

# VITEST CONFIGURATION
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test configuration showing coverage requirements
  section: Coverage thresholds
  critical: |
    100% code coverage required for all source files
    Changes to validate-api.ts must maintain 100% coverage

# PREVIOUS PRP OUTPUT - Test setup safeguard from S1
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T2S1/PRP.md
  why: Previous work item that implemented test setup safeguard
  usage: Use the warning pattern from S1 as a reference for validate-api.ts

# EXTERNAL RESEARCH - Node.js CLI best practices
- url: https://nodejs.dev/en/learn/#exit-codes-in-nodejs
  why: Understanding exit code conventions
  critical: |
    Exit code 0: Success
    Exit code 1: Errors/failures
    Exit code 130: SIGINT interrupt (128 + 2)

- url: https://nodejs.dev/en/learn/#working-with-file-paths
  why: Understanding script execution patterns
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # Script: "validate:api": "tsx src/scripts/validate-api.ts"
├── vitest.config.ts              # 100% coverage requirement
├── src/
│   ├── config/
│   │   ├── constants.ts          # DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic'
│   │   ├── environment.ts        # configureEnvironment(), validateEnvironment(), getModel()
│   │   └── types.ts              # EnvironmentValidationError, ModelTier
│   └── scripts/
│       └── validate-api.ts       # TARGET: Validation script with API safety checks
├── tests/
│   ├── setup.ts                  # REFERENCE: Warning pattern (lines 82-104)
│   ├── unit/
│   │   └── config/
│   │       └── environment.test.ts  # Environment configuration tests
│   └── validation/
│       └── zai-api-test.ts       # Similar validation script for reference
└── plan/
    └── 002_1e734971e481/
        └── P1M2T2S2/
            ├── PRP.md            # This file
            └── research/
                └── api-validation-patterns.md  # External research findings
```

---

### Desired Codebase Tree (files to be modified)

```bash
hacky-hack/
└── src/
    └── scripts/
        └── validate-api.ts       # MODIFY: Add warning for non-z.ai endpoints
                                  # ADD: Warning after line 120
                                  # PATTERN: Follow tests/setup.ts lines 82-104
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: The script ALREADY EXISTS with most safeguards
// This task is primarily about adding the warning for non-z.ai endpoints
// Be careful not to break existing functionality

// GOTCHA: The script uses configureEnvironment() from environment.ts
// Line 101: configureEnvironment();
// This MUST be called before accessing ANTHROPIC_API_KEY
// The shell uses ANTHROPIC_AUTH_TOKEN, but SDK expects ANTHROPIC_API_KEY

// CRITICAL: The validation uses .includes() for pattern matching
// Line 105: if (configuredBaseUrl.includes(ANTHROPIC_ENDPOINT))
// This catches variations like:
// - https://api.anthropic.com
// - https://api.anthropic.com/v1
// - https://api.anthropic.com:443
// But may NOT catch:
// - http://api.anthropic.com (different protocol)

// GOTCHA: Warning allows localhost, 127.0.0.1, mock, and test endpoints
// This is intentional for local development and testing
// Pattern from tests/setup.ts (lines 86-89):
// !baseUrl.includes('localhost')
// !baseUrl.includes('127.0.0.1')
// !baseUrl.includes('mock')
// !baseUrl.includes('test')

// CRITICAL: Exit codes must be correct for CI/CD integration
// process.exit(0): All validations passed (line 499)
// process.exit(1): Validation failed (line 119, 507)
// process.exit(130): SIGINT interrupt (line 527)

// GOTCHA: The script has process event handlers
// Lines 515-528: unhandledRejection, uncaughtException, SIGINT
// These ensure clean exit even on unexpected errors
// Don't remove or modify these handlers

// CRITICAL: Colored console output
// Lines 30-47: colors object with ANSI codes
// Lines 39-46: log object with info, success, error, warn methods
// Use these methods consistently for output

// GOTCHA: Type guard for response validation
// Lines 75-88: isValidMessageResponse()
// This is a type guard function: `data is MessageResponse`
// Used on line 388 to validate API response

// CRITICAL: The script runs async main function
// Line 534: await main();
// Uses top-level await which requires Node.js 18+
// Package.json specifies "node": ">=20.0.0"

// GOTCHA: Response structure validation requirements
// Must validate: id, type, role, content (contract requirement)
// Current implementation also validates: model, stop_reason, usage
// This is good - exceeds minimum requirements

// CRITICAL: The safeguard runs BEFORE any API calls
// Lines 101-120: Configuration and safeguard
// Lines 129-151: testEnvironmentConfig() (uses configureEnvironment)
// Lines 195-265: testEndpointAvailability()
// Lines 271-332: testAuthentication()
// Lines 338-448: testMessageCompletion()

// GOTCHA: Warning should be informational, not blocking
// Unlike the Anthropic API check (which throws and exits),
// the warning should just log to console and continue
// Use log.warn() from the log object (line 44)

// CRITICAL: Warning placement
// Add warning AFTER the Anthropic API check
// Add warning BEFORE configureEnvironment() call completes
// Placement: After line 120, before line 122

// GOTCHA: The script is 535 lines long
# Most functionality already exists
# Only add the warning - don't refactor existing code

// CRITICAL: 100% code coverage requirement
# Any changes must maintain 100% coverage
# Tests may need to be added for the new warning

// GOTCHA: Package.json script
# "validate:api": "tsx src/scripts/validate-api.ts"
# Run with: npm run validate:api
# This is how users will invoke the script
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. The script uses existing interfaces:

- `ValidationResult` (lines 53-59)
- `MessageResponse` (lines 61-72)
- Type guard `isValidMessageResponse()` (lines 75-88)

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: REVIEW existing safeguard implementation
  - FILE: src/scripts/validate-api.ts
  - REVIEW: Lines 94-121 (API endpoint safeguard)
  - VERIFY: BASE_URL check exists
  - VERIFY: Exit code 1 for Anthropic API
  - VERIFY: Error message is clear
  - DEPENDENCIES: None

Task 2: REVIEW response structure validation
  - FILE: src/scripts/validate-api.ts
  - REVIEW: Lines 75-88 (isValidMessageResponse type guard)
  - VERIFY: Validates id, type, role, content fields
  - VERIFY: Used in testMessageCompletion() (line 388)
  - DEPENDENCIES: Task 1

Task 3: ADD warning for non-z.ai endpoints
  - FILE: src/scripts/validate-api.ts
  - ADD: After line 120 (after Anthropic API check)
  - PATTERN: Follow tests/setup.ts lines 82-104
  - IMPLEMENT:
    if (configuredBaseUrl &&
        configuredBaseUrl !== ZAI_ENDPOINT &&
        !configuredBaseUrl.includes('localhost') &&
        !configuredBaseUrl.includes('127.0.0.1') &&
        !configuredBaseUrl.includes('mock') &&
        !configuredBaseUrl.includes('test')) {
      log.warn('========================================');
      log.warn('WARNING: Non-z.ai API endpoint detected');
      log.warn('========================================');
      log.warn(`Current ANTHROPIC_BASE_URL: ${configuredBaseUrl}`);
      log.warn('');
      log.warn(`Recommended: ${ZAI_ENDPOINT}`);
      log.warn('');
      log.warn('Ensure this endpoint is intended for testing.');
      log.warn('========================================');
    }
  - DEPENDENCIES: Task 1

Task 4: VERIFY exit codes
  - FILE: src/scripts/validate-api.ts
  - VERIFY: process.exit(0) on success (line 499)
  - VERIFY: process.exit(1) on Anthropic API (line 119)
  - VERIFY: process.exit(1) on validation failure (line 507)
  - VERIFY: process.exit(130) on SIGINT (line 527)
  - DEPENDENCIES: Task 1, Task 2

Task 5: TEST script behavior
  - RUN: npm run validate:api
  - VERIFY: Script runs successfully with z.ai endpoint
  - VERIFY: Exit code 0 on success
  - TEST: Set ANTHROPIC_BASE_URL to Anthropic endpoint
  - VERIFY: Script exits with code 1
  - TEST: Set ANTHROPIC_BASE_URL to unknown endpoint
  - VERIFY: Warning is displayed
  - REVERT: Environment variables
  - DEPENDENCIES: Task 3, Task 4

Task 6: VERIFY tests pass
  - RUN: npm test
  - VERIFY: All existing tests pass
  - VERIFY: No regressions from changes
  - DEPENDENCIES: Task 5
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: API Endpoint Safeguard in Validation Script
// =============================================================================

/*
 * WHAT: Validate ANTHROPIC_BASE_URL is not Anthropic's production API
 * WHY: Prevents massive usage spikes from accidentally hitting production API
 * PATTERN NAME: z.ai API Safeguard
 * LOCATION: src/scripts/validate-api.ts (lines 94-121)
 */

// =============================================================================
// EXISTING IMPLEMENTATION (Already Exists - Do Not Modify)
// =============================================================================

// File: src/scripts/validate-api.ts (current state)

const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com';

// Must call configureEnvironment() BEFORE accessing ANTHROPIC_API_KEY
configureEnvironment();

// Validate that we're not accidentally pointing to Anthropic's official API
const configuredBaseUrl = process.env.ANTHROPIC_BASE_URL || '';
if (configuredBaseUrl.includes(ANTHROPIC_ENDPOINT)) {
  log.error('========================================');
  log.error('CRITICAL: Configured to use Anthropic API!');
  log.error('========================================');
  log.error(`Current ANTHROPIC_BASE_URL: ${configuredBaseUrl}`);
  log.error('');
  log.error(
    'This script requires z.ai API endpoint, never Anthropic official API.'
  );
  log.error(`Expected: ${ZAI_ENDPOINT}`);
  log.error('');
  log.error('Fix: Unset ANTHROPIC_BASE_URL or set to z.ai endpoint:');
  log.error(`  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`);
  log.error('========================================');
  process.exit(1); // CRITICAL: Exit code 1 for failure
}

// =============================================================================
// ADDITION: Warning for Non-z.ai Endpoints (MISSING - Needs Implementation)
// =============================================================================

/*
 * ADD THIS CODE AFTER LINE 120
 * Purpose: Warn if endpoint is not z.ai (but allow localhost/mock/test)
 * Pattern: Copy from tests/setup.ts lines 82-104
 */

// ADD AFTER LINE 120:

// Warn if using a non-z.ai endpoint (unless it's a mock/test endpoint)
if (
  configuredBaseUrl &&
  configuredBaseUrl !== ZAI_ENDPOINT &&
  !configuredBaseUrl.includes('localhost') &&
  !configuredBaseUrl.includes('127.0.0.1') &&
  !configuredBaseUrl.includes('mock') &&
  !configuredBaseUrl.includes('test')
) {
  log.warn('========================================');
  log.warn('WARNING: Non-z.ai API endpoint detected');
  log.warn('========================================');
  log.warn(`Current ANTHROPIC_BASE_URL: ${configuredBaseUrl}`);
  log.warn('');
  log.warn(`Recommended: ${ZAI_ENDPOINT}`);
  log.warn('');
  log.warn('Ensure this endpoint is intended for testing.');
  log.warn('========================================');
}

// =============================================================================
// PATTERN: Response Structure Type Guard (Already Exists)
// =============================================================================

/*
 * WHAT: Type guard for Anthropic API response format
 * WHY: Ensures API response has expected structure
 * LOCATION: Lines 75-88
 */

interface MessageResponse {
  id: string;
  type: string;
  role: 'assistant';
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

function isValidMessageResponse(data: unknown): data is MessageResponse {
  if (typeof data !== 'object' || data === null) return false;
  const response = data as Record<string, unknown>;
  return (
    typeof response.id === 'string' &&
    typeof response.type === 'string' &&
    response.role === 'assistant' &&
    Array.isArray(response.content) &&
    typeof response.model === 'string' &&
    typeof response.stop_reason === 'string' &&
    typeof response.usage === 'object' &&
    response.usage !== null
  );
}

// =============================================================================
// PATTERN: Exit Code Conventions (Already Exists)
// =============================================================================

/*
 * WHAT: Proper exit codes for different scenarios
 * WHY: Enables CI/CD integration and automation
 *
 * Exit Code 0: Success (line 499)
 *   - All validations passed
 *   - API is working correctly
 *
 * Exit Code 1: Failure (lines 119, 507)
 *   - Anthropic API detected (line 119)
 *   - Any validation failed (line 507)
 *
 * Exit Code 130: SIGINT (line 527)
 *   - User interrupted with Ctrl+C
 *   - 128 + 2 (SIGINT signal number)
 */

// =============================================================================
// PATTERN: Colored Console Output (Already Exists)
// =============================================================================

/*
 * WHAT: ANSI color codes for terminal output
 * WHY: Improves readability and highlights important information
 * LOCATION: Lines 30-47
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
} as const;

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) =>
    console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg: string) =>
    console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

// =============================================================================
// GOTCHA: Top-Level Await
// =============================================================================

/*
 * The script uses top-level await (line 534: await main())
 * This requires:
 * - Node.js 18+ (package.json specifies ">=20.0.0")
 * - TypeScript configuration to support top-level await
 * - File extension .ts (tsx handles compilation)
 */

// =============================================================================
// GOTCHA: Process Event Handlers
// =============================================================================

/*
 * The script has process event handlers for clean shutdown
 * LOCATION: Lines 515-528
 *
 * unhandledRejection: Catches unhandled promise rejections
 * uncaughtException: Catches uncaught exceptions
 * SIGINT: Handles Ctrl+C gracefully
 *
 * DO NOT MODIFY these handlers - they ensure clean exit
 */
```

---

### Integration Points

```yaml
INPUT FROM P1.M2.T2.S1 (Enhance test setup API validation):
  - Confidence: Test setup safeguard is working
  - Pattern: Use warning pattern from tests/setup.ts lines 82-104
  - This PRP: Adds same warning pattern to validation script

INPUT FROM EXISTING CODE:
  - File: src/scripts/validate-api.ts
  - Existing: API endpoint safeguard (lines 94-121)
  - Existing: Response structure validation (lines 75-88)
  - Existing: Test functions for API validation
  - This PRP: Adds warning for non-z.ai endpoints

  - File: src/config/environment.ts
  - Function: configureEnvironment()
  - Function: validateEnvironment()
  - Function: getModel(tier: ModelTier)
  - Import: Already imported on lines 20-24

  - File: tests/setup.ts
  - Pattern: Warning logic (lines 82-104)
  - Use as reference for implementing warning in validate-api.ts

OUTPUT FOR SUBSEQUENT WORK:
  - Validation script with comprehensive API safety checks
  - Clear warning for non-z.ai endpoints
  - Proper exit codes for CI/CD integration
  - Enhanced developer experience with actionable error messages

DIRECTORY STRUCTURE:
  - Modify: src/scripts/validate-api.ts (existing file - add warning)

CLEANUP INTEGRATION:
  - None required - script is standalone
  - No side effects on other files
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying src/scripts/validate-api.ts
# Check TypeScript compilation
npx tsc --noEmit src/scripts/validate-api.ts

# Expected: No type errors

# Format check
npx prettier --check "src/scripts/validate-api.ts"

# Expected: No formatting issues

# Linting
npx eslint src/scripts/validate-api.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run all tests to ensure no regressions
npm test

# Expected: All tests pass

# Run environment config tests
npm test -- tests/unit/config/

# Expected: All environment tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test validation script with z.ai endpoint (should pass)
npm run validate:api

# Expected: Exit code 0, all validations pass

# Test with Anthropic endpoint (should fail)
ANTHROPIC_BASE_URL='https://api.anthropic.com' npm run validate:api

# Expected: Exit code 1, error message displayed

# Test with unknown endpoint (should warn but continue)
ANTHROPIC_BASE_URL='https://api.example.com' npm run validate:api

# Expected: Warning displayed, script continues

# Test with localhost (should NOT warn)
ANTHROPIC_BASE_URL='http://localhost:3000' npm run validate:api

# Expected: No warning, script continues

# Test with mock endpoint (should NOT warn)
ANTHROPIC_BASE_URL='http://mock-api' npm run validate:api

# Expected: No warning, script continues
```

### Level 4: Domain-Specific Validation

```bash
# API Safeguard Validation
# Verify the safeguard prevents accidental Anthropic API usage

# Test 1: Anthropic API blocking
# Set to Anthropic endpoint and verify script exits with code 1
export ANTHROPIC_BASE_URL='https://api.anthropic.com'
npm run validate:api
echo $?

# Expected: Exit code 1

# Test 2: Non-z.ai warning
# Set to unknown endpoint and verify warning appears
export ANTHROPIC_BASE_URL='https://api.unknown.com'
npm run validate:api 2>&1 | grep -i "WARNING"

# Expected: Warning in output

# Test 3: z.ai endpoint
# Set to z.ai endpoint and verify normal operation
export ANTHROPIC_BASE_URL='https://api.z.ai/api/anthropic'
npm run validate:api
echo $?

# Expected: Exit code 0

# Test 4: Mock endpoint (no warning)
export ANTHROPIC_BASE_URL='http://mock-api'
npm run validate:api 2>&1 | grep -i "WARNING"

# Expected: No warning

# Test 5: Localhost (no warning)
export ANTHROPIC_BASE_URL='http://localhost:3000'
npm run validate:api 2>&1 | grep -i "WARNING"

# Expected: No warning

# Error Message Clarity Validation
# Verify error messages are clear and actionable
export ANTHROPIC_BASE_URL='https://api.anthropic.com'
npm run validate:api 2>&1 | grep -A 10 "CRITICAL"

# Expected: Clear error with fix instructions

# Response Structure Validation
# The script validates response structure automatically
# Check that testMessageCompletion() passes all validations
npm run validate:api 2>&1 | grep -i "Response structure"

# Expected: No errors about response structure
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] No type errors: `npx tsc --noEmit src/scripts/validate-api.ts`
- [ ] No formatting issues: `npx prettier --check src/scripts/validate-api.ts`
- [ ] No linting errors: `npx eslint src/scripts/validate-api.ts`
- [ ] All tests pass: `npm test`

### Feature Validation

- [ ] BASE_URL check runs before any API calls
- [ ] Exit code 1 when Anthropic API detected
- [ ] Exit code 0 on successful validation
- [ ] Exit code 130 on SIGINT
- [ ] Error message includes clear fix instructions
- [ ] Warning displayed for non-z.ai endpoints (except localhost/mock/test)
- [ ] Response structure validates id, type, role, content
- [ ] Script can be run with: `npm run validate:api`

### Code Quality Validation

- [ ] Warning pattern matches tests/setup.ts implementation
- [ ] Code follows existing patterns in validate-api.ts
- [ ] No breaking changes to existing functionality
- [ ] Colored console output is consistent
- [ ] Log messages use the log object methods

### Documentation & Deployment

- [ ] Error message includes export command for fix
- [ ] Warning message is informational, not blocking
- [ ] Implementation is well-documented with comments
- [ ] Research findings stored in plan/002_1e734971e481/P1M2T2S2/research/

---

## Anti-Patterns to Avoid

- ❌ **Don't break existing functionality** - The current implementation is excellent, only add the warning
- ❌ **Don't change the error messages** - Existing error messages are clear and actionable
- ❌ **Don't modify exit codes** - Exit codes are already correct (0, 1, 130)
- ❌ **Don't change the safeguard logic** - The `.includes()` pattern is intentional
- ❌ **Don't use console.log directly** - Use the `log` object methods (log.warn, log.error, etc.)
- ❌ **Don't block on warning** - Warning should be informational, not exit with error
- ❌ **Don't forget localhost exceptions** - localhost, 127.0.0.1, mock, test should NOT warn
- ❌ **Don't remove process event handlers** - unhandledRejection, uncaughtException, SIGINT are critical
- ❌ **Don't change the ZAI_ENDPOINT constant** - It must match the expected value
- ❌ **Don't skip manual testing** - Test the script with different endpoints
- ❌ **Don't forget to revert test environment variables** - Clean up after manual testing
- ❌ **Don't create unnecessary complexity** - Just add the warning, keep it simple

---

## Appendix: Decision Rationale

### Why is the warning missing?

The validation script was implemented with the critical safeguard (blocking Anthropic API) but the informational warning for non-z.ai endpoints was not included. This is likely because:

1. The critical safeguard was the priority
2. The warning was considered "nice to have"
3. Different developers worked on test setup vs validation script

### Why add the warning now?

The warning provides important context:

1. **Developer awareness**: Developers may be using a custom endpoint for testing
2. **Debugging aid**: If tests fail, the warning helps identify why
3. **Configuration review**: Encourages developers to verify their endpoint choice
4. **Consistency**: Matches the behavior in tests/setup.ts

### What is the priority?

The warning is low-risk and low-complexity:

1. It's informational only - doesn't block execution
2. It follows an existing pattern from tests/setup.ts
3. It can be added without changing any existing behavior
4. It improves developer experience without breaking anything

### Why use the pattern from tests/setup.ts?

Using the exact same pattern ensures:

1. **Consistency**: Same behavior across the codebase
2. **Testability**: Pattern is already tested
3. **Predictability**: Developers know what to expect
4. **Maintainability**: Changes to the pattern can be propagated easily

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from existing implementation
- [x] Current implementation analyzed and documented
- [x] Missing functionality clearly identified
- [x] Reference pattern available (tests/setup.ts)
- [x] Codebase structure documented
- [x] Anti-patterns documented
- [x] Manual verification approach defined

**Risk Mitigation**:

- Minimal change (single feature addition)
- Existing implementation is already excellent
- Clear success criteria
- Manual verification possible
- No new dependencies

**Known Risks**:

- None - this is a verification/addition task with minimal changes

---

**END OF PRP**
