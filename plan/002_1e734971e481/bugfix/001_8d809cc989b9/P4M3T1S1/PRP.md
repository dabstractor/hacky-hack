# PRP: Run Complete Test Suite - P4.M3.T1.S1

## Goal

**Feature Goal**: Execute the full test suite and validate that all bug fixes from P1-P4 result in >98% pass rate, confirming the system is fully functional after all Polish phase fixes.

**Deliverable**: Test suite execution results showing >98% pass rate with detailed statistics (total tests, passing, failing, skipped, pass percentage) and confirmation that all bug fixes are validated.

**Success Definition**:

- Full test suite (1688+ tests) executes to completion without memory errors
- Test statistics captured: total count, passing count, failing count, skipped count, pass percentage
- Pass rate >= 98% (target: <35 failing tests out of 1688)
- All critical issues resolved (0 critical failing tests)
- All major issues resolved (0 major failing tests)
- No new test failures introduced compared to baseline
- System fully functional with all P1-P4 bug fixes validated

## User Persona

**Target User**: Developer completing Phase P4 (Minor Bug Fixes - Polish) who needs to validate that all bug fixes across P1 (Error handling), P2 (E2E pipeline), P3 (Test alignment), and P4 (Polish) have successfully improved test pass rate to >98%.

**Use Case**: After implementing all bug fixes across P1-P4, the developer runs the complete test suite to confirm that the fixes have resolved the test failures and the system is fully functional. The results serve as the final validation gate before marking P4.M3 as complete.

**User Journey**:

1. Developer reads this PRP to understand validation approach
2. Developer executes full test suite using existing utilities
3. Developer captures and analyzes test statistics
4. Developer validates pass rate >= 98%
5. Developer confirms no new test failures introduced
6. Developer documents results and marks P4.M3.T1.S1 complete

**Pain Points Addressed**:

- **Manual test execution**: Running 1688+ tests manually is time-consuming and error-prone
- **Ambiguous pass rate calculations**: Without clear baseline and target, validation is subjective
- **Hidden regressions**: New test failures may be introduced during bug fixes
- **Memory error uncertainty**: OOM errors can invalidate test results
- **Incomplete validation**: Without comprehensive statistics, success is unclear

## Why

- **Business Value**: Final validation gate ensures all bug fixes have successfully improved system reliability. A >98% pass rate demonstrates production readiness and confirms the investment in P1-P4 bug fixes has paid off.
- **Integration**: This task is the culmination of all P4 work items. It validates the outputs from P4.M1 (dotenv quiet mode) and P4.M2 (promise rejection handlers) in the context of all P1-P3 fixes. It provides the evidence needed to mark P4.M3 as complete and transition to any remaining work.
- **Problems Solved**:
  - Validates that all P1-P4 bug fixes are working correctly in an integrated test suite
  - Confirms the system has returned to >98% pass rate from the original 93.2% baseline
  - Detects any regressions introduced during bug fix implementation
  - Provides clear, measurable success criteria for P4 completion
  - Documents final test statistics for historical reference and CI/CD integration

## What

Execute the full test suite using existing utilities (`runFullTestSuite()`), analyze pass rate using `analyzePassRate()`, and validate that the results meet the >98% target with all critical and major issues resolved.

### Success Criteria

- [ ] Full test suite executes to completion (timeout: 5 minutes)
- [ ] No memory errors detected during execution
- [ ] Test statistics captured: total, passing, failing, skipped counts
- [ ] Pass rate >= 98% (calculated as passing/total \* 100)
- [ ] No critical failing tests (tests that block core functionality)
- [ ] No major failing tests (tests that indicate significant bugs)
- [ ] No new test failures compared to baseline (1593/1688 = 94.37%)
- [ ] All P1-P4 bug fixes validated as working
- [ ] Test results documented and stored for reference

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

1. Complete workflow using existing utilities (no new code needed)
2. Exact commands and functions to execute
3. Specific validation criteria with pass rate thresholds
4. File paths for all referenced utilities and documentation
5. Research findings with implementation recommendations
6. Integration points with P4.M1.T1.S1 and P4.M2.T1.S1
7. Baseline statistics for comparison
8. Expected output formats and how to parse them
9. Error handling for all failure scenarios

### Documentation & References

```yaml
# PRIMARY: Parallel execution context - understand what P4.M2.T1.S1 produces
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M2T1S1/PRP.md
  why: P4.M2.T1.S1 adds promise rejection tracking to tests/setup.ts
  contract: tests/setup.ts will have unhandledRejection tracking when this task starts
  integration: This PRP validates that promise rejection fixes work in full suite
  evidence: P4.M2.T1.S1 eliminates PromiseRejectionHandledWarning messages

# PRIMARY: Full test suite runner utility
- file: src/utils/full-test-suite-runner.ts
  why: Executes complete test suite (1688 tests) with memory monitoring
  function: runFullTestSuite(singleTestResult, projectRoot?)
  returns: FullTestSuiteResult { completed, memoryErrors, testResults, output, exitCode, memoryError, error? }
  timeout: 5 minutes + 10 second SIGKILL escalation
  pattern: Spawn-based npm execution with stdout/stderr capture
  gotcha: Only runs if singleTestResult.success === true (pre-flight check)
  critical: Uses parseVitestTestCounts() for test statistics extraction

# PRIMARY: Pass rate analyzer utility
- file: src/utils/pass-rate-analyzer.ts
  why: Calculates pass rate and compares against baseline (94.37%)
  function: analyzePassRate(testResult: TestSuiteResult)
  returns: PassRateAnalysis { passRate, baselinePassRate, targetPassRate, improved, delta, passedCount, failedCount, totalCount, failingTests, allFailuresAcceptable }
  baseline: 94.37% (from 1593/1688 tests in TEST_RESULTS.md)
  target: 100.00% (all tests should pass)
  pattern: Zero-division protection, JSON and CLI parsing for failing tests
  critical: Provides failingTests array for regression detection

# PRIMARY: Single test runner (pre-flight check)
- file: src/utils/single-test-runner.ts
  why: Quick smoke test before running 5-minute full suite
  function: runSingleTestFile(testFile?, projectRoot?)
  default: tests/unit/utils/resource-monitor.test.ts (564 tests)
  timeout: 30 seconds + 5 second escalation
  pattern: If this fails, skip full suite to save time
  gotcha: Must pass before fullTestSuiteRunner will execute

# PRIMARY: Memory error detector utility
- file: src/utils/memory-error-detector.ts
  why: Detects OOM errors that invalidate test results
  function: detectMemoryErrorInTestOutput(output, exitCode?)
  function: parseVitestTestCounts(output) -> { fail, pass, total } | null
  patterns: heap out of memory, worker terminated, SIGABRT, SIGKILL
  exit codes: 134 (SIGABRT/V8 OOM), 137 (SIGKILL/system OOM)
  critical: Memory errors = fatal (cannot trust test results)

# PRIMARY: NPM test scripts
- file: package.json
  lines: 29-33
  scripts:
    - test:run: "vitest run" (CI mode, no watch)
    - test:coverage: "vitest run --coverage"
    - test:bail: "vitest run --bail=1"
  pattern: Used by test runners via spawn('npm', ['run', 'test:run'])

# PRIMARY: Vitest configuration
- file: vitest.config.ts
  why: Confirms test framework configuration and coverage thresholds
  lines: 14-39 (test configuration)
  coverage thresholds: 100% (statements, branches, functions, lines)
  include: tests/**/*.{test,spec}.ts
  setupFiles: ./tests/setup.ts (modified by P4.M1.T1.S1 and P4.M2.T1.S1)

# PRIMARY: Test setup file (modified by P4.M1.T1.S1 and P4.M2.T1.S1)
- file: tests/setup.ts
  why: P4.M1.T1.S1 adds dotenv quiet mode, P4.M2.T1.S1 adds rejection tracking
  P4.M1.T1.S1: line 23 - dotenv.config({ quiet: true })
  P4.M2.T1.S1: adds unhandledRejection tracking in beforeEach/afterEach
  integration: Both modifications should be present when this task runs

# PRIMARY: Baseline test statistics
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/TEST_RESULTS.md
  why: Baseline for comparison and regression detection
  baseline_total: 1688 tests
  baseline_passing: 1593 tests
  baseline_failing: 95 tests
  baseline_pass_rate: 94.37%
  target_pass_rate: 98.00%
  target_max_failing: 34 tests (2% of 1688)

# PRIMARY: Work item contract definition
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json
  section: P4.M3.T1.S1
  contract: Run npm run test:run, capture statistics, verify >98% pass rate
  validation: All critical/major issues resolved, no new failures

# RESEARCH: Vitest output parsing research
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M3T1S1/research/01-vitest-output-research.md
  why: Comprehensive guide to parsing Vitest test output
  content: JSON reporter structure, CLI patterns, exit codes, regex patterns
  critical: parseVitestTestCounts() implementation reference

# RESEARCH: Test execution patterns research
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M3T1S1/research/02-test-execution-patterns.md
  why: Existing infrastructure and implementation recommendations
  content: Full suite runner usage, pass rate analyzer usage, spawn patterns
  critical: Recommended two-stage execution (single test → full suite)

# EXTERNAL: Vitest documentation (when search available)
- url: https://vitest.dev/guide/reporters.html
  why: JSON reporter output format reference
  section: JSON Reporter

# EXTERNAL: Vitest configuration API (when search available)
- url: https://vitest.dev/config/
  why: Test runner configuration options
  section: Test configuration
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── utils/
│   │   ├── full-test-suite-runner.ts      # USE: Run complete test suite
│   │   ├── single-test-runner.ts           # USE: Pre-flight smoke test
│   │   ├── pass-rate-analyzer.ts           # USE: Analyze pass rate
│   │   └── memory-error-detector.ts        # USE: Detect OOM errors
│   └── scripts/
│       ├── validate-groundswell.ts         # REFERENCE: Validation script pattern
│       └── validate-api.ts                 # REFERENCE: Validation script pattern
├── tests/
│   ├── setup.ts                            # MODIFIED: By P4.M1.T1.S1 and P4.M2.T1.S1
│   ├── unit/                               # 1688 tests total
│   ├── integration/                        # E2E workflow tests
│   └── e2e/                                # End-to-end pipeline tests
├── package.json                            # USE: npm run test:run script
├── vitest.config.ts                        # REFERENCE: Test configuration
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        ├── P4M3T1S1/
        │   ├── PRP.md                       # THIS DOCUMENT
        │   └── research/
        │       ├── 01-vitest-output-research.md
        │       └── 02-test-execution-patterns.md
        ├── TEST_RESULTS.md                 # REFERENCE: Baseline statistics
        └── tasks.json                      # REFERENCE: Work item contract
```

### Desired Codebase Tree (After Implementation)

```bash
# No new files - this task executes and validates using existing utilities
# Output: Test execution results stored in research/execution-results.md
# Optional: Add npm script "validate:test-suite" if reusable validation needed
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Vitest is the testing framework, NOT Jest or Mocha
// Test execution: npm run test:run (vitest run in CI mode)
// Output format: CLI summary with test counts at end
// Exit codes: 0 (success), 1 (some failures), 134/137 (OOM)

// CRITICAL: P4.M1.T1.S1 and P4.M2.T1.S1 run in parallel with this task
// P4.M1.T1.S1: Adds dotenv.config({ quiet: true }) to tests/setup.ts
// P4.M2.T1.S1: Adds promise rejection tracking to tests/setup.ts
// This PRP: Assumes both modifications are present (no conflicts, different lines)

// CRITICAL: Full test suite takes 3-5 minutes to execute
// Timeout in full-test-suite-runner.ts: 5 minutes + 10 second escalation
// Do not reduce timeout - 1688 tests need time to complete

// CRITICAL: runFullTestSuite() requires singleTestResult.success === true
// Pre-flight check: runSingleTestFile() must pass first
// If single test fails, full suite is skipped (saves 5 minutes)
// Pattern: Two-stage execution (smoke test → full suite)

// GOTCHA: Test count parsing uses regex patterns on CLI output
// Pattern: "Tests       58 failed | 1593 passed (1688)"
// Alternative: "58 | 1593" (fail | pass)
// Function: parseVitestTestCounts() in memory-error-detector.ts

// CRITICAL: Memory errors invalidate test results
// Detection: detectMemoryErrorInTestOutput(output, exitCode)
// Patterns: heap out of memory, worker terminated, SIGABRT, SIGKILL
// Action: If memoryErrors === true, do NOT trust test counts

// CRITICAL: Pass rate baseline is 94.37%, not 94.3%
// Calculation: 1593 / 1688 = 94.3720...% → round to 94.37%
// Using 94.3 causes incorrect delta calculation
// Constant: BASELINE_PASS_RATE in pass-rate-analyzer.ts

// CRITICAL: Target pass rate is 98%, not 100%
// Reason: Some tests may be known failures or flaky
// Calculation: 1688 * 0.98 = 1654.24 → 1654 passing minimum
// Max failing: 1688 - 1654 = 34 tests

// GOTCHA: Skipped tests count toward total but not pass/fail
// Vitest output shows: numPassedTests, numFailedTests, numPendingTests (skipped)
// Pass rate calculation: (passed / total) * 100
// Total includes skipped tests

// CRITICAL: analyzePassRate() expects TestSuiteResult interface
// fields: completed, results, hasMemoryErrors, hasPromiseRejections, executionTime, output, exitCode
// Must construct this interface from FullTestSuiteResult before calling analyzePassRate()
// Missing: hasPromiseRejections, executionTime (add these manually)

// GOTCHA: failingTests array is extracted from output, not testResults
// Function: extractFailingTests(output) tries JSON first, then CLI regex
// JSON: results.testResults[].assertionResults[].fullName (if status === 'failed')
// CLI: FAIL pattern + file header pattern parsing

// CRITICAL: Exit code 1 does NOT mean memory error
// Exit codes: 0 (all pass), 1 (some fail), 134 (OOM), 137 (OOM killer)
// Check: memoryCheck.hasMemoryError from detectMemoryErrorInTestOutput()
// Action: Exit code 1 with hasMemoryError === false = normal test failures

// CRITICAL: Test output may be large (100k+ lines for 1688 tests)
// Memory: Accumulate all chunks before parsing (don't stream)
// Pattern: stdout += data.toString() until close event
// Reason: Need complete output for regex parsing

// GOTCHA: Vitest worker threads may cause SIGABRT on OOM
// Detection: Exit code 134 or "FATAL ERROR.*heap out of memory" in output
// Suggestion: Increase NODE_OPTIONS --max-old-space-size if OOM occurs
// Current: P2.M1.T1 should have added memory limits to test scripts

// CRITICAL: Promise rejections from P4.M2.T1.S1 should be eliminated
// Before: PromiseRejectionHandledWarning messages in test output
// After: Clean output with no rejection warnings
// Validation: Check output for "PromiseRejectionHandledWarning" string

// GOTCHA: Test suite includes E2E tests that may be flaky
// E2E tests: tests/e2e/pipeline.test.ts, tests/e2e/delta.test.ts
// Pattern: May fail due to timing, file system, or external dependencies
// Action: If E2E tests fail, check if they're critical or acceptable failures

// CRITICAL: Baseline has 95 failing tests (1593/1688 = 94.37%)
// Target: <35 failing tests (>=98% pass rate)
// Improvement needed: Fix at least 60 failing tests
// Validation: failingTests.length should be < baseline (95)

// CRITICAL: This task is READ-ONLY - no code modifications
// Purpose: Execute tests and validate results
// Do NOT: Modify test files, fix failing tests, update configurations
// Output: Document results in research/execution-results.md
```

## Implementation Blueprint

### Data Models and Structure

This task uses existing data models from the codebase:

```typescript
// Input: SingleTestResult (from single-test-runner.ts)
interface SingleTestResult {
  readonly success: boolean; // Pre-flight check passed
  readonly hasMemoryError: boolean; // No OOM in single test
  readonly output: string;
  readonly exitCode: number | null;
  readonly memoryError: MemoryErrorDetectionResult | null;
  readonly error?: string;
}

// Intermediate: FullTestSuiteResult (from full-test-suite-runner.ts)
interface FullTestSuiteResult {
  readonly completed: boolean; // Suite executed to completion
  readonly memoryErrors: boolean; // No OOM in full suite
  readonly testResults: {
    // Parsed test counts
    pass: number;
    fail: number;
    total: number;
  } | null;
  readonly output: string;
  readonly exitCode: number | null;
  readonly memoryError: MemoryErrorDetectionResult | null;
  readonly error?: string;
}

// Transform: FullTestSuiteResult → TestSuiteResult (for pass-rate-analyzer.ts)
interface TestSuiteResult {
  readonly completed: boolean;
  readonly results: {
    readonly pass: number;
    readonly fail: number;
    readonly total: number;
  };
  readonly hasMemoryErrors: boolean;
  readonly hasPromiseRejections: boolean; // Add: check output for warnings
  readonly executionTime: number; // Add: calculate from timestamps
  readonly output: string;
  readonly exitCode: number;
}

// Output: PassRateAnalysis (from pass-rate-analyzer.ts)
interface PassRateAnalysis {
  readonly passRate: number; // Current pass rate (0-100)
  readonly baselinePassRate: number; // 94.37
  readonly targetPassRate: number; // 100.00
  readonly improved: boolean; // Meets or exceeds baseline
  readonly delta: number; // Difference from baseline
  readonly passedCount: number;
  readonly failedCount: number;
  readonly totalCount: number;
  readonly failingTests: readonly string[]; // Failing test names
  readonly allFailuresAcceptable: boolean; // All match known issues
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: RUN single test file as pre-flight check
  - IMPORT: runSingleTestFile from src/utils/single-test-runner.ts
  - EXECUTE: await runSingleTestFile()
  - VALIDATE: result.success === true
  - VALIDATE: result.hasMemoryError === false
  - ABORT: If pre-flight fails, log error and exit (skip 5-minute suite)
  - OUTPUT: SingleTestResult for next task

Task 2: RUN full test suite using existing utility
  - IMPORT: runFullTestSuite from src/utils/full-test-suite-runner.ts
  - INPUT: SingleTestResult from Task 1
  - EXECUTE: await runFullTestSuite(singleTestResult)
  - TIMEOUT: 5 minutes (handled by utility)
  - VALIDATE: result.completed === true
  - VALIDATE: result.memoryErrors === false
  - VALIDATE: result.testResults !== null
  - OUTPUT: FullTestSuiteResult with test statistics

Task 3: TRANSFORM result for pass rate analyzer
  - INPUT: FullTestSuiteResult from Task 2
  - CONSTRUCT: TestSuiteResult interface
  - ADD: hasPromiseRejections = check for "PromiseRejectionHandledWarning" in output
  - ADD: executionTime = calculate from start/end timestamps or 0 if unavailable
  - MAP: testResults → results, memoryErrors → hasMemoryErrors
  - OUTPUT: TestSuiteResult for analyzePassRate()

Task 4: ANALYZE pass rate against baseline
  - IMPORT: analyzePassRate from src/utils/pass-rate-analyzer.ts
  - INPUT: TestSuiteResult from Task 3
  - EXECUTE: const analysis = analyzePassRate(testSuiteResult)
  - EXTRACT: passRate, baselinePassRate, delta, improved, failingTests
  - LOG: All metrics to console for visibility
  - OUTPUT: PassRateAnalysis with all metrics

Task 5: VALIDATE against >98% target
  - INPUT: PassRateAnalysis from Task 4
  - CHECK: passRate >= 98.0
  - CHECK: analysis.failedCount <= 34 (2% of 1688)
  - CHECK: No critical issues in failingTests names
  - CHECK: No major issues in failingTests names
  - CHECK: failingTests.length < 95 (baseline failure count)
  - OUTPUT: Validation result (pass/fail)

Task 6: CHECK for promise rejection warnings (P4.M2.T1.S1 validation)
  - INPUT: FullTestSuiteResult.output from Task 2
  - SEARCH: "PromiseRejectionHandledWarning" in output
  - EXPECT: No warnings found (P4.M2.T1.S1 should have fixed these)
  - IF FOUND: Log count and locations (indicates incomplete fix)
  - OUTPUT: Promise rejection check result

Task 7: DOCUMENT execution results
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M3T1S1/research/execution-results.md
  - CONTENT: Test statistics (total, pass, fail, skip)
  - CONTENT: Pass rate percentage and delta from baseline
  - CONTENT: Failing tests list (if any)
  - CONTENT: Memory error check result
  - CONTENT: Promise rejection check result
  - CONTENT: Validation result (pass/fail against 98% target)
  - CONTENT: Comparison to baseline (94.37%)
  - OUTPUT: Complete execution report

Task 8: REPORT final status
  - IF: passRate >= 98.0 AND no critical/major issues
    - LOG: "✓ Test suite validation PASSED"
    - LOG: "  Pass rate: {passRate}% (target: 98%)"
    - LOG: "  Delta: {delta}% from baseline"
    - EXIT: 0 (success)
  - ELSE:
    - LOG: "✗ Test suite validation FAILED"
    - LOG: "  Pass rate: {passRate}% (target: 98%)"
    - LOG: "  Gap: {98 - passRate}%"
    - LOG: "  Failing tests: {failedCount} (max: 34)"
    - IF: failingTests.length > 0
      - LOG: "  Failing test names:"
      - LOG: Each failing test from analysis.failingTests
    - EXIT: 1 (failure)
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Two-Stage Test Execution (Pre-flight → Full Suite)
// ============================================================================

// File: src/scripts/validate-test-suite.ts (optional new script)
// Or: Execute directly in terminal/CI

import { runSingleTestFile } from './utils/single-test-runner.js';
import { runFullTestSuite } from './utils/full-test-suite-runner.js';

// Stage 1: Pre-flight check (30 seconds)
console.log('Stage 1: Running pre-flight check...');
const s1Result = await runSingleTestFile();

if (!s1Result.success) {
  console.error('✗ Pre-flight check failed');
  console.error(`  ${s1Result.error}`);
  process.exit(1);
}

if (s1Result.hasMemoryError) {
  console.error('✗ Pre-flight check detected memory errors');
  console.error(`  Error: ${s1Result.memoryError?.errorType}`);
  console.error(`  Suggestion: ${s1Result.memoryError?.suggestion}`);
  process.exit(1);
}

console.log('✓ Pre-flight check passed');

// Stage 2: Full suite (5 minutes) - only runs if Stage 1 passed
console.log('Stage 2: Running full test suite...');
const fullResult = await runFullTestSuite(s1Result);

if (!fullResult.completed) {
  console.error('✗ Full suite failed to complete');
  console.error(`  Error: ${fullResult.error}`);
  process.exit(1);
}

if (fullResult.memoryErrors) {
  console.error('✗ Full suite detected memory errors');
  console.error(`  Error type: ${fullResult.memoryError?.errorType}`);
  console.error(`  Suggestion: ${fullResult.memoryError?.suggestion}`);
  process.exit(1);
}

if (!fullResult.testResults) {
  console.error('✗ Failed to parse test results');
  console.error('  Output may be in unexpected format');
  process.exit(1);
}

console.log('✓ Full suite completed');
console.log(`  Total: ${fullResult.testResults.total}`);
console.log(`  Passed: ${fullResult.testResults.pass}`);
console.log(`  Failed: ${fullResult.testResults.fail}`);

// ============================================================================
// PATTERN 2: Transform FullTestSuiteResult → TestSuiteResult
// ============================================================================

import type { TestSuiteResult } from './utils/pass-rate-analyzer.js';

// Build TestSuiteResult from FullTestSuiteResult
const testSuiteResult: TestSuiteResult = {
  completed: fullResult.completed,
  results: fullResult.testResults!,
  hasMemoryErrors: fullResult.memoryErrors,
  // P4.M2.T1.S1 validation: Check for promise rejection warnings
  hasPromiseRejections: fullResult.output.includes(
    'PromiseRejectionHandledWarning'
  ),
  // Execution time (not provided by fullTestSuiteRunner, estimate or 0)
  executionTime: 0, // or calculate from timestamps if available
  output: fullResult.output,
  exitCode: fullResult.exitCode ?? 1, // Default to failure if null
};

// ============================================================================
// PATTERN 3: Pass Rate Analysis with Validation
// ============================================================================

import { analyzePassRate } from './utils/pass-rate-analyzer.js';

// Analyze pass rate
const analysis = analyzePassRate(testSuiteResult);

// Log results
console.log('\nPass Rate Analysis:');
console.log(`  Current: ${analysis.passRate}%`);
console.log(`  Baseline: ${analysis.baselinePassRate}%`);
console.log(`  Target: 98.00%`);
console.log(`  Delta: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}%`);
console.log(`  Improved: ${analysis.improved}`);
console.log(`  Passed: ${analysis.passedCount}`);
console.log(`  Failed: ${analysis.failedCount}`);
console.log(`  Total: ${analysis.totalCount}`);

// ============================================================================
// PATTERN 4: Validate Against >98% Target
// ============================================================================

const TARGET_PASS_RATE = 98.0;
const MAX_FAILING_TESTS = 34; // 2% of 1688

// Validation checks
const checks = {
  passRate: analysis.passRate >= TARGET_PASS_RATE,
  failingCount: analysis.failedCount <= MAX_FAILING_TESTS,
  noCritical: !analysis.failingTests.some(t => t.includes('critical')),
  noMajor: !analysis.failingTests.some(t => t.includes('major')),
  noRegressions: analysis.failedCount < 95, // Baseline failure count
};

const allPassed = Object.values(checks).every(v => v);

if (allPassed) {
  console.log('\n✓ All validation checks passed');
  console.log('  Pass rate >= 98%');
  console.log('  No critical or major issues');
  console.log('  No new test failures');
} else {
  console.log('\n✗ Validation failed:');
  if (!checks.passRate) {
    console.log(
      `  ✗ Pass rate below target (${analysis.passRate}% < ${TARGET_PASS_RATE}%)`
    );
  }
  if (!checks.failingCount) {
    console.log(
      `  ✗ Too many failing tests (${analysis.failedCount} > ${MAX_FAILING_TESTS})`
    );
  }
  if (!checks.noCritical) {
    console.log('  ✗ Critical issues detected in failing tests');
  }
  if (!checks.noMajor) {
    console.log('  ✗ Major issues detected in failing tests');
  }
  if (!checks.noRegressions) {
    console.log(
      `  ✗ More failures than baseline (${analysis.failedCount} >= 95)`
    );
  }
}

// ============================================================================
// PATTERN 5: Check for Promise Rejection Warnings (P4.M2.T1.S1)
// ============================================================================

const hasPromiseRejections = fullResult.output.includes(
  'PromiseRejectionHandledWarning'
);

if (hasPromiseRejections) {
  // Count occurrences
  const matches = fullResult.output.match(/PromiseRejectionHandledWarning/g);
  const count = matches ? matches.length : 0;

  console.log(
    `\n⚠ Warning: ${count} PromiseRejectionHandledWarning(s) detected`
  );
  console.log('  P4.M2.T1.S1 may not have fully resolved promise rejections');
  console.log('  This may indicate incomplete fix or new issues introduced');

  // Extract context (lines around warnings)
  const lines = fullResult.output.split('\n');
  const warningLines = lines
    .map((line, idx) => ({ line, idx }))
    .filter(({ line }) => line.includes('PromiseRejectionHandledWarning'))
    .map(({ idx }) => lines.slice(Math.max(0, idx - 2), idx + 3).join('\n'));

  if (warningLines.length > 0) {
    console.log('\n  Warning contexts:');
    warningLines.forEach((context, i) => {
      console.log(`\n  Warning ${i + 1}:`);
      console.log(
        context
          .split('\n')
          .map(l => `    ${l}`)
          .join('\n')
      );
    });
  }
} else {
  console.log('\n✓ No promise rejection warnings detected');
  console.log('  P4.M2.T1.S1 fix validated');
}

// ============================================================================
// PATTERN 6: Document Results to File
// ============================================================================

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const reportPath = join(
  process.cwd(),
  'plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M3T1S1/research/execution-results.md'
);

const report = `# Test Suite Execution Results - P4.M3.T1.S1

**Date**: ${new Date().toISOString()}
**Task**: Execute full test suite and validate >98% pass rate

## Executive Summary

- **Status**: ${allPassed ? 'PASSED' : 'FAILED'}
- **Pass Rate**: ${analysis.passRate}%
- **Baseline**: ${analysis.baselinePassRate}%
- **Target**: 98.00%
- **Delta**: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}%
- **Result**: ${analysis.passRate >= TARGET_PASS_RATE ? '✓ Meets target' : '✗ Below target'}

## Test Statistics

| Metric | Count |
|--------|-------|
| Total Tests | ${analysis.totalCount} |
| Passed | ${analysis.passedCount} |
| Failed | ${analysis.failedCount} |
| Pass Rate | ${analysis.passRate}% |

## Validation Checks

| Check | Result |
|-------|--------|
| Pass rate >= 98% | ${checks.passRate ? '✓' : '✗'} |
| Failing <= 34 tests | ${checks.failingCount ? '✓' : '✗'} |
| No critical issues | ${checks.noCritical ? '✓' : '✗'} |
| No major issues | ${checks.noMajor ? '✓' : '✗'} |
| No regressions | ${checks.noRegressions ? '✓' : '✗'} |

## Failing Tests

${analysis.failingTests.length === 0 ? 'None' : analysis.failingTests.map(t => `- ${t}`).join('\n')}

## Memory Error Check

- **Detected**: ${testSuiteResult.hasMemoryErrors ? 'Yes' : 'No'}
- **Details**: ${fullResult.memoryError?.errorType || 'N/A'}

## Promise Rejection Check

- **Warnings Detected**: ${hasPromiseRejections ? 'Yes' : 'No'}
- **Count**: ${hasPromiseRejections ? (fullResult.output.match(/PromiseRejectionHandledWarning/g) || []).length : 0}
- **P4.M2.T1.S1 Status**: ${hasPromiseRejections ? '⚠ Incomplete' : '✓ Validated'}

## Comparison to Baseline

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Pass Rate | 94.37% | ${analysis.passRate}% | ${analysis.delta > 0 ? '+' : ''}${analysis.delta}% |
| Passing | 1593 | ${analysis.passedCount} | ${analysis.passedCount - 1593 > 0 ? '+' : ''}${analysis.passedCount - 1593} |
| Failing | 95 | ${analysis.failedCount} | ${analysis.failedCount - 95 > 0 ? '+' : ''}${analysis.failedCount - 95} |

## Conclusion

${
  allPassed
    ? '✓ Test suite validation PASSED. All P1-P4 bug fixes validated. System fully functional.'
    : '✗ Test suite validation FAILED. Review failing tests and address issues before marking P4.M3 complete.'
}
`;

await writeFile(reportPath, report, 'utf-8');
console.log(`\nReport saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
```

### Integration Points

```yaml
PARALLEL_EXECUTION:
  - task: P4.M2.T1.S1 (Investigate promise rejection warnings)
    status: Implementing in parallel
    contract: Eliminates PromiseRejectionHandledWarning messages
    validation: This task checks output for remaining warnings
    evidence: output.includes('PromiseRejectionHandledWarning') check

CONTRACTS_CONSUMED:
  - P4.M1.T1.S1: dotenv.config({ quiet: true }) in tests/setup.ts
    effect: Reduced test output verbosity
    validation: Test output should be cleaner (less dotenv noise)

  - P4.M2.T1.S1: Promise rejection tracking in tests/setup.ts
    effect: Eliminates PromiseRejectionHandledWarning messages
    validation: No warnings in test output

  - P3.M3.T1: Retry utility jitter calculation fix
    effect: Positive jitter for retry delays
    validation: Retry-related tests should pass

  - P1-P3: All previous bug fixes (Error handling, E2E pipeline, Test alignment)
    effect: Improved test pass rate
    validation: Pass rate >= 98% (up from 94.37% baseline)

MODIFICATIONS_TO:
  - NONE (READ-ONLY task)
    This task executes tests and documents results
    No code modifications required
    No configuration changes needed

OUTPUT_TO:
  - file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M3T1S1/research/execution-results.md
    content: Complete execution report with all statistics
    format: Markdown with tables and checklists
    purpose: Historical record and validation evidence
```

## Validation Loop

### Level 1: Syntax & Style (Not Applicable)

This task does not modify code. Skip syntax/style validation.

### Level 2: Pre-Execution Validation

```bash
# Verify all imports are available
ls -la src/utils/full-test-suite-runner.ts
ls -la src/utils/single-test-runner.ts
ls -la src/utils/pass-rate-analyzer.ts
ls -la src/utils/memory-error-detector.ts

# Expected: All files exist

# Verify test scripts are available
cat package.json | grep "test:run"

# Expected: "test:run": "vitest run"

# Verify parallel tasks are complete (optional, for context)
# P4.M1.T1.S1: dotenv quiet mode
grep -n "quiet: true" tests/setup.ts

# P4.M2.T1.S1: promise rejection tracking
grep -n "unhandledRejection" tests/setup.ts

# Expected: Both modifications present (or at least one if parallel execution incomplete)
```

### Level 3: Test Execution (Primary Validation)

```bash
# ============================================================================
# OPTION 1: Execute using existing utilities (Recommended)
# ============================================================================

# Create temporary execution script
cat > /tmp/validate-test-suite.ts << 'EOF'
import { runSingleTestFile } from './src/utils/single-test-runner.js';
import { runFullTestSuite } from './src/utils/full-test-suite-runner.js';
import { analyzePassRate } from './src/utils/pass-rate-analyzer.js';
import type { TestSuiteResult } from './src/utils/pass-rate-analyzer.js';

async function main() {
  // Stage 1: Pre-flight
  console.log('Stage 1: Pre-flight check');
  const s1Result = await runSingleTestFile();
  if (!s1Result.success || s1Result.hasMemoryError) {
    console.error('Pre-flight failed');
    process.exit(1);
  }
  console.log('✓ Pre-flight passed');

  // Stage 2: Full suite
  console.log('Stage 2: Full suite');
  const fullResult = await runFullTestSuite(s1Result);
  if (!fullResult.completed || fullResult.memoryErrors) {
    console.error('Full suite failed');
    process.exit(1);
  }
  console.log('✓ Full suite completed');

  // Stage 3: Analyze
  const testSuiteResult: TestSuiteResult = {
    completed: fullResult.completed,
    results: fullResult.testResults!,
    hasMemoryErrors: fullResult.memoryErrors,
    hasPromiseRejections: fullResult.output.includes('PromiseRejectionHandledWarning'),
    executionTime: 0,
    output: fullResult.output,
    exitCode: fullResult.exitCode ?? 1,
  };

  const analysis = analyzePassRate(testSuiteResult);

  console.log('\nResults:');
  console.log(`  Pass rate: ${analysis.passRate}%`);
  console.log(`  Target: 98%`);
  console.log(`  Status: ${analysis.passRate >= 98 ? 'PASS' : 'FAIL'}`);

  process.exit(analysis.passRate >= 98 ? 0 : 1);
}

main().catch(console.error);
EOF

# Execute validation script
NODE_OPTIONS="--max-old-space-size=4096" tsx /tmp/validate-test-suite.ts

# Expected output:
# Stage 1: Pre-flight check
# [single test output]
# ✓ Pre-flight passed
# Stage 2: Full suite
# [full suite output]
# ✓ Full suite completed
#
# Results:
#   Pass rate: XX.XX%
#   Target: 98%
#   Status: PASS/FAIL

# ============================================================================
# OPTION 2: Execute using npm script directly
# ============================================================================

# Run full test suite and capture output
npm run test:run 2>&1 | tee /tmp/test-output.txt

# Parse test statistics from output
grep -E "Tests\s+\d+\s+failed\s+\|\s+\d+\s+passed\s+\(\d+\)" /tmp/test-output.txt

# Expected: "Tests       X failed | Y passed (Z)"
# Example: "Tests       20 failed | 1668 passed (1688)"

# Check for memory errors
grep -i "heap out of memory\|worker terminated.*memory\|FATAL ERROR" /tmp/test-output.txt

# Expected: No matches (no memory errors)

# Check for promise rejection warnings
grep -c "PromiseRejectionHandledWarning" /tmp/test-output.txt

# Expected: 0 (no warnings)

# ============================================================================
# OPTION 3: Create reusable npm script (Optional)
# ============================================================================

# Add to package.json scripts:
# "validate:test-suite": "tsx src/scripts/validate-test-suite.ts"

# Then execute:
# npm run validate:test-suite
```

### Level 4: Results Validation

```bash
# ============================================================================
# Validate Pass Rate >= 98%
# ============================================================================

# Extract test counts from output
OUTPUT=$(npm run test:run 2>&1)
TOTAL=$(echo "$OUTPUT" | grep -oP "Tests\s+\d+\s+failed\s+\|\s+\d+\s+passed\s+\(\K\d+(?=\))")
PASS=$(echo "$OUTPUT" | grep -oP "Tests\s+\d+\s+failed\s+\|\s+\K\d+(?=\s+passed)")
FAIL=$(echo "$OUTPUT" | grep -oP "Tests\s+\K\d+(?=\s+failed\s+\|)")

# Calculate pass rate
PASS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASS / $TOTAL) * 100}")

echo "Total: $TOTAL"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "Pass Rate: $PASS_RATE%"

# Validate against target
if (( $(awk "BEGIN {print ($PASS_RATE >= 98)}") )); then
  echo "✓ Pass rate meets target (>=98%)"
else
  echo "✗ Pass rate below target (<98%)"
  echo "  Gap: $(awk "BEGIN {printf \"%.2f\", 98 - $PASS_RATE}")%"
fi

# ============================================================================
# Validate No Critical/Major Issues
# ============================================================================

# Extract failing test names (requires JSON reporter for accuracy)
npm run test:run -- --reporter=json --outputFile=/tmp/test-results.json

# Parse JSON for failing tests
node -e "
const results = JSON.parse(require('fs').readFileSync('/tmp/test-results.json', 'utf-8'));
const failures = results.testResults
  .flatMap(suite => suite.assertionResults.filter(t => t.status === 'failed'))
  .map(t => t.fullName);

console.log('Failing tests:', failures.length);
if (failures.length > 0) {
  console.log('Checking for critical/major issues...');
  const hasCritical = failures.some(f => f.toLowerCase().includes('critical'));
  const hasMajor = failures.some(f => f.toLowerCase().includes('major'));
  console.log('  Critical:', hasCritical ? 'YES ✗' : 'No ✓');
  console.log('  Major:', hasMajor ? 'YES ✗' : 'No ✓');
}
"

# ============================================================================
# Validate No Regressions
# ============================================================================

# Compare failing count to baseline (95)
FAIL_COUNT=$(echo "$OUTPUT" | grep -oP "Tests\s+\K\d+(?=\s+failed\s+\|)")
BASELINE_FAIL=95

if [ "$FAIL_COUNT" -lt "$BASELINE_FAIL" ]; then
  echo "✓ Improvement: $FAIL_COUNT failures < $BASELINE_FAIL baseline"
  echo "  Fixed: $((BASELINE_FAIL - FAIL_COUNT)) tests"
elif [ "$FAIL_COUNT" -eq "$BASELINE_FAIL" ]; then
  echo "⚠ No change: $FAIL_COUNT failures = baseline"
else
  echo "✗ Regression: $FAIL_COUNT failures > $BASELINE_FAIL baseline"
  echo "  New failures: $((FAIL_COUNT - BASELINE_FAIL))"
fi

# ============================================================================
# Document Results
# ============================================================================

# Generate report file
cat > /tmp/validation-report.md << EOF
# Test Suite Validation Report - P4.M3.T1.S1

**Date**: $(date -Iseconds)
**Status**: $([ "$PASS_RATE" -ge 98 ] && echo "PASSED" || echo "FAILED")

## Statistics

- **Total Tests**: $TOTAL
- **Passed**: $PASS
- **Failed**: $FAIL
- **Pass Rate**: ${PASS_RATE}%
- **Target**: 98.00%
- **Result**: $([ "$PASS_RATE" -ge 98 ] && echo "✓ PASS" || echo "✗ FAIL")

## Checks

- [ ] Pass rate >= 98%: $([ "$PASS_RATE" -ge 98 ] && echo "✓" || echo "✗")
- [ ] Failing <= 34: $([ "$FAIL" -le 34 ] && echo "✓" || echo "✗")
- [ ] No critical issues: [To verify]
- [ ] No major issues: [To verify]
- [ ] No regressions: $([ "$FAIL" -lt 95 ] && echo "✓" || echo "✗")

## Baseline Comparison

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Pass Rate | 94.37% | ${PASS_RATE}% | $(awk "BEGIN {printf \"%.2f\", $PASS_RATE - 94.37}")% |
| Passing | 1593 | $PASS | $(awk "BEGIN {print $PASS - 1593}") |
| Failing | 95 | $FAIL | $(awk "BEGIN {print $FAIL - 95}") |
EOF

cat /tmp/validation-report.md

# Copy to research directory
cp /tmp/validation-report.md \
  plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M3T1S1/research/execution-results.md

echo "Report saved to: plan/.../P4M3T1S1/research/execution-results.md"
```

## Final Validation Checklist

### Technical Validation

- [ ] Pre-flight check passed (single test file)
- [ ] Full test suite completed without timeout
- [ ] No memory errors detected (OOM, worker terminated)
- [ ] Test counts parsed successfully from output
- [ ] Pass rate calculated correctly (2 decimal places)
- [ ] Failing tests extracted from output

### Feature Validation

- [ ] Pass rate >= 98% (target threshold)
- [ ] Failing tests <= 34 (2% of 1688)
- [ ] No critical issues in failing test names
- [ ] No major issues in failing test names
- [ ] No regressions (failures < baseline 95)
- [ ] Promise rejection warnings eliminated (P4.M2.T1.S1 validated)
- [ ] All P1-P4 bug fixes validated as working

### Output Validation

- [ ] Execution results documented in research/execution-results.md
- [ ] Report includes all statistics (total, pass, fail, pass rate)
- [ ] Report includes baseline comparison
- [ ] Report includes failing test list (if any)
- [ ] Report includes validation result (PASS/FAIL)
- [ ] Report includes memory error check result
- [ ] Report includes promise rejection check result

### Process Validation

- [ ] No code modifications made (READ-ONLY task)
- [ ] No configuration changes made
- [ ] Used existing utilities (full-test-suite-runner, pass-rate-analyzer)
- [ ] Followed two-stage execution pattern (pre-flight → full suite)
- [ ] Proper exit codes (0 for success, 1 for failure)
- [ ] Results reproducible (can re-run to verify)

## Anti-Patterns to Avoid

- ❌ **Don't modify test files** - This is a READ-ONLY validation task
- ❌ **Don't fix failing tests** - Document them, don't fix them
- ❌ **Don't skip pre-flight check** - It saves 5 minutes if single test fails
- ❌ **Don't ignore memory errors** - OOM means results are untrustworthy
- ❌ **Don't use 94.3 as baseline** - Use 94.37 (1593/1688 rounded correctly)
- ❌ **Don't round pass rate incorrectly** - Use 2 decimal places consistently
- ❌ **Don't assume 100% target** - Target is 98%, not 100%
- ❌ **Don't count exit code 1 as memory error** - Check hasMemoryError flag
- ❌ **Don't skip promise rejection check** - Validates P4.M2.T1.S1 fix
- ❌ **Don't forget to document results** - execution-results.md is required output
- ❌ **Don't modify existing utilities** - Use them as-is, don't refactor
- ❌ **Don't run tests without memory limits** - NODE_OPTIONS should be set (from P2.M1.T1)
- ❌ **Don't interpret flaky E2E failures as critical** - Check test names for context
- ❌ **Don't compare against wrong baseline** - Use 1593/1688 = 94.37% from TEST_RESULTS.md
- ❌ **Don't exit with code 0 if validation fails** - Use exit code 1 for failure

---

## Confidence Score: 10/10

**One-Pass Implementation Success Likelihood**: EXCELLENT

**Rationale**:

1. **No new code required** - Uses existing, well-tested utilities
2. **Clear execution path** - Two-stage process (pre-flight → full suite → analyze)
3. **Specific validation criteria** - >98% pass rate, <=34 failing tests
4. **Comprehensive research** - Two detailed research documents with implementation patterns
5. **Proven utilities** - full-test-suite-runner and pass-rate-analyzer already tested
6. **Clear success definition** - Pass/fail based on measurable thresholds
7. **Complete documentation** - All file paths, interfaces, and patterns specified
8. **Integration context** - Understands P4.M1.T1.S1 and P4.M2.T1.S1 parallel execution
9. **Baseline comparison** - Specific metrics from TEST_RESULTS.md
10. **Error handling** - All failure scenarios documented with actions

**Potential Risks**:

- **Risk 1**: Full suite timeout on slower hardware (Mitigated: 5-minute timeout in utility)
- **Risk 2**: Memory errors on resource-constrained systems (Mitigated: NODE_OPTIONS from P2.M1.T1)
- **Risk 3**: Baseline test count changed (Mitigated: Use parseVitestTestCounts() for accurate counts)
- **Risk 4**: Parallel task P4.M2.T1.S1 not complete (Mitigated: Task checks for warnings, handles both cases)

**Validation**: This PRP provides complete guidance for executing the full test suite and validating results using existing utilities. No code modifications are required. The workflow is straightforward: run pre-flight check, run full suite, analyze pass rate, validate against 98% target, document results. All interfaces, file paths, and validation criteria are specified. The implementation is essentially a script orchestration task with clear success/failure determination. Risk is minimal because the heavy lifting (test execution, result parsing, pass rate analysis) is already implemented and tested in the existing utilities.
