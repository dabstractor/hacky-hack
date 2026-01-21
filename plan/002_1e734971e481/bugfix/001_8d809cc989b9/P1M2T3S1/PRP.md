# Product Requirement Prompt (PRP): Run Fatal Error Detection Integration Tests

---

## Goal

**Feature Goal**: Validate that the exported `isFatalError()` function correctly identifies fatal and non-fatal errors in the integration test suite.

**Deliverable**: Successful execution of the fatal error detection integration tests with all 6 `isFatalError`-related tests passing.

**Success Definition**:

- All 6 `isFatalError`-specific integration tests pass
- Combined with P1.M1.T2.S1 (EnvironmentError integration tests), all 11 error handling integration tests pass
- No "isFatalError is not a function" errors
- Correct classification: SessionError and EnvironmentError as fatal, ValidationError/TaskError/AgentError as non-fatal

## Why

This validation step ensures that the `isFatalError` function extracted from PRPPipeline in P1.M2.T2.S1 works correctly in the integration context. The integration tests verify that:

1. The function is properly exported and importable from `src/utils/errors.js`
2. Fatal error classification matches business logic requirements
3. Error propagation through async stacks works correctly
4. The integration with PRPPipeline's error handling is complete

**Integration with Previous Work**:

- **P1.M2.T1.S1-S3**: Extracted `isFatalError` logic and implemented as exported function
- **P1.M2.T2.S1**: Refactored PRPPipeline to use the exported `isFatalError` function
- **P1.M2.T3.S1** (Current): Validates the integration works correctly

**Problems Solved**:

- Verifies the private method → exported function refactoring was successful
- Confirms no regression in error handling behavior
- Provides confidence for downstream work items that depend on `isFatalError`

## What

Execute the integration test suite for error handling, specifically validating the 6 tests that verify `isFatalError` behavior:

1. **should identify SessionError as fatal** - SessionError instances return `true`
2. **should identify EnvironmentError as fatal** - EnvironmentError instances return `true`
3. **should identify ValidationError as non-fatal** - ValidationError instances return `false`
4. **should identify TaskError as non-fatal by default** - TaskError instances return `false`
5. **should handle standard Error as non-fatal** - Standard Error returns `false`
6. **should handle unknown error types as non-fatal** - Non-object types return `false`

### Success Criteria

- [ ] All 23 tests in `tests/integration/utils/error-handling.test.ts` pass
- [ ] Specifically, all 6 `isFatalError`-related tests pass
- [ ] No import errors ("isFatalError is not a function")
- [ ] Test execution completes without crashes or hangs
- [ ] Combined with P1.M1.T2.S1, all 11 error handling integration tests pass

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact test file location and content
- Complete `isFatalError` implementation reference
- Test runner configuration and commands
- Expected test output format
- Success/failure criteria
- Related work item context

### Documentation & References

```yaml
# MUST READ - Integration Test File
- file: /home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts
  why: Contains the 6 isFatalError tests that must pass
  pattern: Fatal Error Detection section (lines 130-160)
  gotcha: Tests import from 'utils/errors.js' with .js extension (ESM requirement)

# MUST READ - isFatalError Implementation
- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Contains the isFatalError function implementation being tested
  pattern: Lines 658-703, function signature and logic
  gotcha: Function uses type guards (isPipelineError, isEnvironmentError, etc.)

# MUST READ - Test Configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Configures Vitest behavior, coverage thresholds, and path aliases
  pattern: Test environment, setupFiles, coverage settings
  gotcha: 100% coverage threshold enforced but test files excluded

# MUST READ - Package.json Scripts
- file: /home/dustin/projects/hacky-hack/package.json
  why: Contains test execution commands
  pattern: Lines 29-33, all test:* scripts
  gotcha: Use 'npm run test:run --' for non-interactive execution

# MUST READ - Global Test Setup
- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test configuration including API endpoint safeguard
  pattern: Environment validation, mock cleanup
  gotcha: Blocks Anthropic API usage, requires z.ai endpoint

# INTERNAL RESEARCH - isFatalError Implementation Details
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T3S1/research/isfatal-error-implementation.md
  why: Complete implementation analysis including function logic, type guards, and PRPPipeline usage
  section: Full implementation

# INTERNAL RESEARCH - Integration Test Analysis
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T3S1/research/integration-test-analysis.md
  why: Analysis of the 23 integration tests including the 6 isFatalError tests
  section: Key Integration Tests for isFatalError

# INTERNAL RESEARCH - Test Runner Configuration
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T3S1/research/test-runner-configuration.md
  why: Complete test runner setup, commands, and expected output format
  section: Primary Execution Command

# VITEST DOCUMENTATION - Test Command Usage
- url: https://vitest.dev/guide/cli.html
  why: Understanding vitest run command and flag usage
  critical: Use 'vitest run' for CI/non-interactive, 'vitest' for watch mode

# VITEST DOCUMENTATION - Configuration
- url: https://vitest.dev/config/
  why: Understanding vitest.config.ts structure and options
  critical: setupFiles, coverage thresholds, environment settings
```

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── utils/
│   │   └── errors.ts                    # isFatalError implementation (lines 658-703)
│   └── workflows/
│       └── prp-pipeline.ts              # Uses isFatalError from errors.js
├── tests/
│   ├── integration/
│   │   └── utils/
│   │       └── error-handling.test.ts   # Integration tests for error handling
│   ├── setup.ts                         # Global test setup
│   └── fixtures/
│       └── simple-prd.ts                # Test data fixtures
├── vitest.config.ts                     # Vitest configuration
├── package.json                         # NPM scripts including test:run
└── plan/
    └── 002_1e734971e481/
        └── bugfix/
            └── 001_8d809cc989b9/
                └── P1M2T3S1/
                    ├── PRP.md           # This file
                    └── research/        # Research findings
```

### Desired Codebase Tree

**No changes required** - This is a validation task only. The code structure remains unchanged.

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: ESM requires .js extension for TypeScript imports
// Even though the source file is .ts, imports use .js
import { isFatalError } from '../../../src/utils/errors.js'; // ✅ Correct
import { isFatalError } from '../../../src/utils/errors.ts';  // ❌ Wrong

// CRITICAL: Vitest globals must be enabled in tsconfig.json
// "types": ["vitest/globals"] must be present
describe('Test Suite', () => { ... }); // Works because globals: true in vitest.config.ts

// CRITICAL: API endpoint safeguard in tests/setup.ts
// Tests will fail if using Anthropic's official API
// Must use z.ai endpoint: https://api.z.ai/api/anthropic
// Blocked endpoints: api.anthropic.com, https://api.anthropic.com, http://api.anthropic.com

// CRITICAL: 100% coverage threshold enforced
// Coverage includes: src/**/*.ts
// Coverage excludes: **/*.test.ts, **/node_modules/**
// Build fails if coverage thresholds not met

// GOTCHA: mkdtemp warning about non-portable templates
// Current code uses 'XXXXXX' suffix which triggers warning
// Can be ignored for now, not a test failure

// GOTCHA: dotenv outputs to stdout during test runs
// [dotenv@17.2.3] injecting env (0) from .env
// This is expected behavior, not an error

// PATTERN: Integration test structure
// 1. Import error classes and isFatalError from utils/errors.js
// 2. Use describe() blocks for test organization
// 3. Use it() for individual test cases
// 4. Use expect() for assertions
// 5. Use beforeEach() for setup, afterEach() for cleanup

// PATTERN: Test file naming
// Integration tests: tests/integration/**/*.{test,spec}.ts
// Unit tests: tests/unit/**/*.{test,spec}.ts
// Vitest discovers both patterns automatically
```

## Implementation Blueprint

### Data Models and Structure

**No data models required** - This is a validation task only.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY isFatalError function exists and is exported
  - CHECK: src/utils/errors.ts contains isFatalError export (lines 658-703)
  - VERIFY: Function signature matches expected: export function isFatalError(error: unknown, continueOnError: boolean = false): boolean
  - CONFIRM: Function uses type guards (isPipelineError, isEnvironmentError, etc.)
  - DEPENDENCIES: None
  - VALIDATION: Read the file and confirm export statement exists

Task 2: VERIFY PRPPipeline imports isFatalError from errors.js
  - CHECK: src/workflows/prp-pipeline.ts imports isFatalError
  - VERIFY: Import statement: import { isFatalError } from '../utils/errors.js';
  - CONFIRM: No private #isFatalError method exists in PRPPipeline class
  - DEPENDENCIES: Task 1 (function must exist first)
  - VALIDATION: Grep for "isFatalError" in prp-pipeline.ts

Task 3: RUN integration tests for error handling
  - EXECUTE: npm run test:run -- tests/integration/utils/error-handling.test.ts
  - VERIFY: Command completes without crashing
  - CAPTURE: Test output for analysis
  - DEPENDENCIES: Tasks 1, 2 (implementation must be complete)
  - VALIDATION: Command exits with code 0

Task 4: ANALYZE test results for isFatalError tests
  - CHECK: All 6 Fatal Error Detection tests pass
  - VERIFY: Specifically look for:
    * "should identify SessionError as fatal" - PASS
    * "should identify EnvironmentError as fatal" - PASS
    * "should identify ValidationError as non-fatal" - PASS
    * "should identify TaskError as non-fatal by default" - PASS
    * "should handle standard Error as non-fatal" - PASS
    * "should handle unknown error types as non-fatal" - PASS
  - CONFIRM: No "isFatalError is not a function" errors
  - DEPENDENCIES: Task 3 (tests must run first)
  - VALIDATION: Test output shows "23 passed (23)"

Task 5: VERIFY combined test pass count
  - CHECK: Combined with P1.M1.T2.S1, all 11 error handling integration tests pass
  - VERIFY: No regressions in previously passing tests
  - CONFIRM: Test suite overall health is maintained
  - DEPENDENCIES: Task 4 (isFatalError tests must pass)
  - VALIDATION: Test output shows all expected tests passing

Task 6: DOCUMENT test results (if any failures)
  - CREATE: Detailed report of any test failures
  - ANALYZE: Root cause of failures (if any)
  - RECOMMEND: Fix approach (not implement, just document)
  - DEPENDENCIES: Task 4 (need test results first)
  - VALIDATION: Report is comprehensive and actionable
```

### Implementation Patterns & Key Details

```bash
# ==============================================================================
# TEST EXECUTION PATTERN
# ==============================================================================

# Pattern 1: Run specific integration test file
npm run test:run -- tests/integration/utils/error-handling.test.ts

# Pattern 2: Run all integration tests
npm run test:run -- tests/integration/

# Pattern 3: Run with coverage
npm run test:coverage

# Pattern 4: Run in watch mode (development)
npm run test:watch -- tests/integration/utils/error-handling.test.ts

# Pattern 5: Stop after first failure (debugging)
npm run test:bail -- tests/integration/utils/error-handling.test.ts

# ==============================================================================
# EXPECTED SUCCESS OUTPUT
# ==============================================================================

# Test Files  1 passed (1)
#      Tests  23 passed (23)
#   Start at  01:09:53
#   Duration  393ms (transform 37ms, setup 20ms, collect 20ms, tests 6ms, environment 0ms, prepare 60ms)

# ==============================================================================
# EXPECTED FAILURE OUTPUT (if isFatalError not exported)
# ==============================================================================

# ✗ tests/integration/utils/error-handling.test.ts (23 tests)
#   ✗ should identify SessionError as fatal
#   ReferenceError: isFatalError is not defined

# ==============================================================================
# KEY TEST ASSERTIONS
# ==============================================================================

# Fatal Error Tests:
# expect(isFatalError(new SessionError('Session not found'))).toBe(true);
# expect(isFatalError(new EnvironmentError('Missing API key'))).toBe(true);

# Non-Fatal Error Tests:
# expect(isFatalError(new ValidationError('Invalid input'))).toBe(false);
# expect(isFatalError(new TaskError('Task execution failed'))).toBe(false);
# expect(isFatalError(new Error('Standard error'))).toBe(false);
# expect(isFatalError('String error')).toBe(false);

# ==============================================================================
# CRITICAL: Import Pattern in Test File
# ==============================================================================

# Tests import from utils/errors.js (ESM requirement)
import {
  PipelineError,
  SessionError,
  TaskError,
  ValidationError,
  EnvironmentError,
  isFatalError,  # This is the function being tested
} from '../../../src/utils/errors.js';

# ==============================================================================
# INTEGRATION TEST STRUCTURE
# ==============================================================================

# describe('Error Handling Integration Tests', () => {
#   let tempDir: string;
#
#   beforeEach(() => {
#     tempDir = setupTestDir();
#   });
#
#   afterEach(() => {
#     if (existsSync(tempDir)) {
#       rmSync(tempDir, { recursive: true, force: true });
#     }
#     vi.clearAllMocks();
#   });
#
#   describe('Fatal Error Detection', () => {
#     it('should identify SessionError as fatal', () => {
#       const error = new SessionError('Session not found');
#       expect(isFatalError(error)).toBe(true);
#     });
#     # ... 5 more tests
#   });
# });

# ==============================================================================
# VALIDATION CHECKPOINTS
# ==============================================================================

# Checkpoint 1: Function exists and is exported
# Command: grep -n "export function isFatalError" src/utils/errors.ts
# Expected: Line 658

# Checkpoint 2: PRPPipeline imports the function
# Command: grep -n "isFatalError" src/workflows/prp-pipeline.ts | head -5
# Expected: Import statement and usage in catch blocks

# Checkpoint 3: Test file imports the function
# Command: grep -n "isFatalError" tests/integration/utils/error-handling.test.ts
# Expected: Import statement and usage in 6 test cases

# Checkpoint 4: Tests execute successfully
# Command: npm run test:run -- tests/integration/utils/error-handling.test.ts
# Expected: Exit code 0, all tests pass

# ==============================================================================
# TROUBLESHOOTING COMMON ISSUES
# ==============================================================================

# Issue 1: "isFatalError is not a function"
# Cause: Function not exported or import path incorrect
# Fix: Verify export in src/utils/errors.ts and .js extension in import

# Issue 2: Tests pass but coverage is below 100%
# Cause: isFatalError not being called in all test scenarios
# Fix: Check test coverage report for uncovered branches

# Issue 3: "Cannot find module '../../../src/utils/errors.js'"
# Cause: Path resolution issue or .ts extension used instead of .js
# Fix: Ensure .js extension is used in ESM imports

# Issue 4: Tests timeout or hang
# Cause: Async operation not completing or promise not resolving
# Fix: Check for missing await or async/await patterns
```

### Integration Points

```yaml
# NO INTEGRATION POINTS TO MODIFY
# This is a validation task only - no code changes required

# Existing Integration Points (for reference):
PRPPipeline:
  - file: src/workflows/prp-pipeline.ts
  - imports: isFatalError from '../utils/errors.js'
  - usage: 5 locations (session init, delta handling, PRD decomposition, backlog execution, QA cycle)
  - pattern: if (isFatalError(error, this.#continueOnError)) { throw error; }

Integration Tests:
  - file: tests/integration/utils/error-handling.test.ts
  - imports: isFatalError from '../../../src/utils/errors.js'
  - usage: 6 test cases in Fatal Error Detection section
  - pattern: expect(isFatalError(error)).toBe(expectedBoolean)
```

## Validation Loop

### Level 1: Syntax & Style (Not Applicable)

**This is a validation task** - no code is being written, so syntax/style checks are not required.

### Level 2: Unit Tests (Not Applicable)

**This is a validation task** - no new unit tests are being written.

### Level 3: Integration Testing (Primary Validation)

```bash
# ==============================================================================
# PRIMARY VALIDATION: Run Fatal Error Detection Integration Tests
# ==============================================================================

# Step 1: Verify isFatalError function exists
grep -n "export function isFatalError" src/utils/errors.ts

# Expected output:
# 658:export function isFatalError(

# Step 2: Verify PRPPipeline imports isFatalError
grep -n "import.*isFatalError" src/workflows/prp-pipeline.ts

# Expected output:
# import {
#   ...
#   isFatalError,
# } from '../utils/errors.js';

# Step 3: Verify test file imports isFatalError
grep -n "isFatalError" tests/integration/utils/error-handling.test.ts | head -5

# Expected output:
# import {
#   PipelineError,
#   ...
#   isFatalError,
# } from '../../../src/utils/errors.js';
#
# describe('Fatal Error Detection', () => {
#   it('should identify SessionError as fatal', () => {
#     expect(isFatalError(error)).toBe(true);
#   ...

# Step 4: Run the integration tests
npm run test:run -- tests/integration/utils/error-handling.test.ts

# Expected output:
# RUN  v1.6.1 /home/dustin/projects/hacky-hack
#
# stdout | _log (/home/dustin/projects/hacky-hack/node_modules/dotenv/lib/main.js:142:11)
# [dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
#
# stdout | tests/setup.ts:28:15
# .env file loaded successfully
#
# (node:XXXXX) Warning: mkdtemp() templates ending with X are not portable. For details see: https://nodejs.org/api/fs.html
# (Use `node --trace-warnings ...` to show where the warning was created)
#  ✓ tests/integration/utils/error-handling.test.ts  (23 tests) 6ms
#
#  Test Files  1 passed (1)
#       Tests  23 passed (23)
#    Start at  01:09:53
#    Duration  393ms (transform 37ms, setup 20ms, collect 20ms, tests 6ms, environment 0ms, prepare 60ms)

# Step 5: Verify specific isFatalError tests passed
npm run test:run -- tests/integration/utils/error-handling.test.ts 2>&1 | grep -A 6 "Fatal Error Detection"

# Expected output:
#   ✓ Fatal Error Detection (6)
#     ✓ should identify SessionError as fatal
#     ✓ should identify EnvironmentError as fatal
#     ✓ should identify ValidationError as non-fatal
#     ✓ should identify TaskError as non-fatal by default
#     ✓ should handle standard Error as non-fatal
#     ✓ should handle unknown error types as non-fatal

# Step 6: Verify no import errors
npm run test:run -- tests/integration/utils/error-handling.test.ts 2>&1 | grep -i "isFatalError is not"

# Expected output:
# (empty - no errors)

# Step 7: Check exit code
npm run test:run -- tests/integration/utils/error-handling.test.ts; echo "Exit code: $?"

# Expected output:
# Exit code: 0

# ==============================================================================
# FAILURE DIAGNOSIS (if tests fail)
# ==============================================================================

# If tests fail, run individual test for more details:
npm run test:run -- tests/integration/utils/error-handling.test.ts --reporter=verbose

# If specific test fails, run just that test:
npm run test:run -- tests/integration/utils/error-handling.test.ts -t "should identify SessionError as fatal"

# Check for isFatalError import issues:
npm run test:run -- tests/integration/utils/error-handling.test.ts 2>&1 | grep -i "cannot find"

# Check for type errors:
npm run typecheck

# ==============================================================================
# COVERAGE VALIDATION (optional)
# ==============================================================================

# Run tests with coverage:
npm run test:coverage -- tests/integration/utils/error-handling.test.ts

# Check coverage for isFatalError function:
npm run test:coverage 2>&1 | grep -A 10 "errors.ts"

# Expected: 100% coverage for isFatalError function
```

### Level 4: Creative & Domain-Specific Validation

```bash
# ==============================================================================
# DOMAIN-SPECIFIC VALIDATION: Error Classification Verification
# ==============================================================================

# Verification 1: Fatal Error Classification
# Create a quick verification script to test isFatalError directly
cat > /tmp/verify-isFatalError.ts << 'EOF'
import {
  SessionError,
  EnvironmentError,
  ValidationError,
  TaskError,
  AgentError,
  isFatalError,
} from '/home/dustin/projects/hacky-hack/src/utils/errors.js';

console.log('Testing isFatalError classification:');
console.log('SessionError:', isFatalError(new SessionError('test')) ? 'FATAL ✅' : 'NON-FATAL ❌');
console.log('EnvironmentError:', isFatalError(new EnvironmentError('test')) ? 'FATAL ✅' : 'NON-FATAL ❌');
console.log('ValidationError:', isFatalError(new ValidationError('test')) ? 'FATAL ❌' : 'NON-FATAL ✅');
console.log('TaskError:', isFatalError(new TaskError('test')) ? 'FATAL ❌' : 'NON-FATAL ✅');
console.log('AgentError:', isFatalError(new AgentError('test')) ? 'FATAL ❌' : 'NON-FATAL ✅');
console.log('Standard Error:', isFatalError(new Error('test')) ? 'FATAL ❌' : 'NON-FATAL ✅');
console.log('String error:', isFatalError('error') ? 'FATAL ❌' : 'NON-FATAL ✅');
EOF

# Run verification script
tsx /tmp/verify-isFatalError.ts

# Expected output:
# Testing isFatalError classification:
# SessionError: FATAL ✅
# EnvironmentError: FATAL ✅
# ValidationError: NON-FATAL ✅
# TaskError: NON-FATAL ✅
# AgentError: NON-FATAL ✅
# Standard Error: NON-FATAL ✅
# String error: NON-FATAL ✅

# ==============================================================================
# DOMAIN-SPECIFIC VALIDATION: continueOnError Flag Behavior
# ==============================================================================

# Verification 2: continueOnError overrides all logic
cat > /tmp/verify-continueOnError.ts << 'EOF'
import {
  SessionError,
  EnvironmentError,
  isFatalError,
} from '/home/dustin/projects/hacky-hack/src/utils/errors.js';

console.log('Testing continueOnError override:');
console.log('SessionError with continueOnError=true:', isFatalError(new SessionError('test'), true) ? 'FATAL ❌' : 'NON-FATAL ✅');
console.log('EnvironmentError with continueOnError=true:', isFatalError(new EnvironmentError('test'), true) ? 'FATAL ❌' : 'NON-FATAL ✅');
console.log('SessionError with continueOnError=false:', isFatalError(new SessionError('test'), false) ? 'FATAL ✅' : 'NON-FATAL ❌');
EOF

# Run verification script
tsx /tmp/verify-continueOnError.ts

# Expected output:
# Testing continueOnError override:
# SessionError with continueOnError=true: NON-FATAL ✅
# EnvironmentError with continueOnError=true: NON-FATAL ✅
# SessionError with continueOnError=false: FATAL ✅

# ==============================================================================
# DOMAIN-SPECIFIC VALIDATION: PRPPipeline Integration
# ==============================================================================

# Verification 3: Check PRPPipeline uses isFatalError correctly
grep -A 5 "isFatalError(error" src/workflows/prp-pipeline.ts | head -20

# Expected pattern:
# if (isFatalError(error, this.#continueOnError)) {
#   this.logger.error(
#     `[PRPPipeline] Fatal {operation} error: ${errorMessage}`
#   );
#   throw error; // Re-throw to abort pipeline
# }

# ==============================================================================
# REGRESSION VALIDATION: Combined Test Pass Count
# ==============================================================================

# Verification 4: Run all error handling integration tests
npm run test:run -- tests/integration/utils/error-handling.test.ts

# Verify combined count:
# - P1.M1.T2.S1 tests (EnvironmentError integration): 5 tests
# - P1.M2.T3.S1 tests (isFatalError integration): 6 tests
# - Total: 11 tests should pass (plus 12 other error handling tests = 23 total)

# Expected output:
# Test Files  1 passed (1)
#      Tests  23 passed (23)

# ==============================================================================
# BUSINESS LOGIC VALIDATION: Error Classification Correctness
# ==============================================================================

# Verification 5: Validate business logic requirements
cat > /tmp/verify-business-logic.md << 'EOF'
# Business Logic Requirements for isFatalError

## Fatal Errors (Should Halt Pipeline)
1. EnvironmentError - Cannot run without proper environment
   - Missing API keys
   - Invalid configuration
   - Required environment variables

2. SessionError (LOAD_FAILED/SAVE_FAILED) - Cannot persist state
   - Cannot load existing session
   - Cannot save session state
   - Filesystem issues

## Non-Fatal Errors (Should Track and Continue)
1. TaskError - Individual task failures
   - Task execution failures
   - Should be tracked but not halt entire pipeline

2. AgentError - LLM/API issues
   - Timeouts
   - API failures
   - Response parsing errors
   - Should retry or skip, not halt

3. ValidationError (non-parse_prd) - Input validation issues
   - Field validation failures
   - Schema validation failures
   - Should be handled gracefully

## Edge Cases
1. Standard Error objects - Non-fatal (default behavior)
2. Unknown error types - Non-fatal (safety default)
3. continueOnError=true - All errors non-fatal (user override)
EOF

cat /tmp/verify-business-logic.md
```

## Final Validation Checklist

### Technical Validation

- [ ] `isFatalError` function exists in `src/utils/errors.ts` (line 658)
- [ ] Function is exported: `export function isFatalError(...)`
- [ ] PRPPipeline imports `isFatalError` from `../utils/errors.js`
- [ ] No private `#isFatalError` method remains in PRPPipeline
- [ ] Test file imports `isFatalError` from `../../../src/utils/errors.js`
- [ ] All 6 Fatal Error Detection tests pass
- [ ] All 23 error handling integration tests pass
- [ ] No "isFatalError is not a function" errors in output
- [ ] Test execution exit code is 0
- [ ] Combined with P1.M1.T2.S1, all 11 error handling integration tests pass

### Feature Validation

- [ ] SessionError correctly identified as fatal
- [ ] EnvironmentError correctly identified as fatal
- [ ] ValidationError correctly identified as non-fatal
- [ ] TaskError correctly identified as non-fatal
- [ ] Standard Error correctly identified as non-fatal
- [ ] Unknown error types correctly identified as non-fatal
- [ ] continueOnError flag behavior correct (overrides all logic)
- [ ] No regressions in previously passing tests
- [ ] Test execution time is reasonable (< 5 seconds)

### Code Quality Validation

- [ ] No TypeScript type errors
- [ ] No ESLint errors
- [ ] Import statements use `.js` extension (ESM requirement)
- [ ] Error classification matches business logic requirements
- [ ] Integration with PRPPipeline is complete
- [ ] Test coverage for `isFatalError` is 100%

### Documentation & Reporting

- [ ] Test results documented if any failures occur
- [ ] Root cause analysis documented for any failures
- [ ] Success criteria met: All 6 isFatalError tests pass
- [ ] Combined success criteria met: All 11 error handling integration tests pass
- [ ] Ready for next work item in sequence

---

## Anti-Patterns to Avoid

- ❌ **Don't modify code** - This is a validation task, not an implementation task
- ❌ **Don't write new tests** - Tests already exist, just run them
- ❌ **Don't skip the verification steps** - Each checkpoint is important
- ❌ **Don't ignore test failures** - All failures must be documented and analyzed
- ❌ **Don't forget to check combined test count** - P1.M1.T2.S1 + P1.M2.T3.S1 = 11 tests
- ❌ **Don't use wrong test command** - Use `npm run test:run --` not `npm test`
- ❌ **Don't panic if you see the mkdtemp warning** - It's expected, not a failure
- ❌ **Don't be confused by .js imports** - ESM requires .js extension even for .ts files
- ❌ **Don't use Anthropic API** - Tests will fail, use z.ai endpoint
- ❌ **Don't assume tests pass without running** - Always execute the test command

---

## Confidence Score

**One-Pass Implementation Success Likelihood: 10/10**

**Rationale**:

1. ✅ All implementation work completed in previous subtasks (P1.M2.T1, P1.M2.T2)
2. ✅ Tests already exist and just need to be executed
3. ✅ No code changes required in this subtask
4. ✅ Clear success criteria and validation checkpoints
5. ✅ Comprehensive research documentation available
6. ✅ Expected test output format documented
7. ✅ Troubleshooting guide provided for common issues
8. ✅ Business logic requirements clearly defined

**Risk Assessment**: LOW

- No code modifications required
- Tests already passing in current codebase (verified during research)
- Clear path to validation success
- Only risk is environmental issues (Node.js version, dependencies)

---

## Appendix: Research Summary

### Related Work Items

- **P1.M2.T1**: Extract isFatalError logic from PRPPipeline
  - P1.M2.T1.S1: Examine existing implementation
  - P1.M2.T1.S2: Write failing tests
  - P1.M2.T1.S3: Implement isFatalError function

- **P1.M2.T2**: Update PRPPipeline to use exported isFatalError
  - P1.M2.T2.S1: Refactor PRPPipeline to import isFatalError

- **P1.M2.T3** (Current): Validate isFatalError integration tests
  - P1.M2.T3.S1: Run fatal error detection integration tests (this PRP)

### Test Count Breakdown

**Total Integration Tests in error-handling.test.ts**: 23 tests

**isFatalError-Specific Tests**: 6 tests (lines 131-159)

1. should identify SessionError as fatal
2. should identify EnvironmentError as fatal
3. should identify ValidationError as non-fatal
4. should identify TaskError as non-fatal by default
5. should handle standard Error as non-fatal
6. should handle unknown error types as non-fatal

**Combined Error Handling Tests**: 11 tests

- P1.M1.T2.S1 (EnvironmentError): 5 tests
- P1.M2.T3.S1 (isFatalError): 6 tests

### Previous Test State

**Before P1.M2.T2.S1**:

- Tests failed with "isFatalError is not a function" error
- Function was private method in PRPPipeline
- Tests couldn't import the function

**After P1.M2.T2.S1**:

- Tests should pass (verified during research)
- Function is exported from src/utils/errors.js
- PRPPipeline imports and uses the exported function

### Expected Test Execution Time

**Approximate Duration**: 400-500ms

- Transform: ~37ms
- Setup: ~20ms
- Collect: ~20ms
- Tests: ~6ms
- Environment: ~0ms
- Prepare: ~60ms

**Total**: < 1 second for full test suite

---

**End of PRP**
