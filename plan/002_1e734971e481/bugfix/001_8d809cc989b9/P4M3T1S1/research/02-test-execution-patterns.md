# Test Execution Patterns Research

**Date**: 2026-01-16
**Task**: P4.M3.T1.S1 - Execute full test suite and validate results
**Purpose**: Research existing test execution patterns, validation utilities, and best practices for running complete test suites and validating >98% pass rate.

---

## Executive Summary

This research document identifies existing test execution utilities, validation patterns, and CI/CD approaches in the codebase. The codebase already has robust infrastructure for running tests programmatically and validating results, including:

1. **Test Runner Utilities**: Single-test-runner and full-test-suite-runner utilities
2. **Validation Utilities**: Pass-rate-analyzer for pass rate calculation and baseline comparison
3. **Memory Error Detection**: Comprehensive OOM error detection and test result parsing
4. **Test Scripts**: npm scripts for running various test configurations
5. **No GitHub Actions**: No CI/CD workflows exist in the repository

**Key Finding**: The existing `runFullTestSuite()` and `analyzePassRate()` functions provide a complete foundation for P4.M3.T1.S1 implementation. The task should leverage these utilities rather than creating new infrastructure.

---

## 1. Existing Test Runner Utilities

### 1.1 Full Test Suite Runner

**File**: `/home/dustin/projects/hacky-hack/src/utils/full-test-suite-runner.ts`

**Purpose**: Execute the complete test suite (1688 tests) with memory monitoring and result parsing.

**Key Features**:
- Spawn-based test execution via `npm run test:run` (no test file argument)
- Stdout/stderr capture with complete output accumulation
- Timeout handling with SIGTERM/SIGKILL escalation (5 min + 10s)
- Memory error detection using existing utility
- Test result parsing using `parseVitestTestCounts()`
- Input condition validation (only runs if single test passed)
- Structured result with completion flag and memory error details

**Function Signature**:
```typescript
export async function runFullTestSuite(
  singleTestResult: SingleTestResult,
  projectRoot?: string
): Promise<FullTestSuiteResult>
```

**Result Type**:
```typescript
export interface FullTestSuiteResult {
  readonly completed: boolean;           // Whether suite completed
  readonly memoryErrors: boolean;        // Memory error detected
  readonly testResults: {                // Parsed test counts
    pass: number;
    fail: number;
    total: number;
  } | null;
  readonly output: string;               // Combined stdout/stderr
  readonly exitCode: number | null;      // Process exit code
  readonly memoryError: MemoryErrorDetectionResult | null;
  readonly error?: string;               // Error message if failed
}
```

**Usage Pattern**:
```typescript
import { runSingleTestFile } from './utils/single-test-runner.js';
import { runFullTestSuite } from './utils/full-test-suite-runner.js';

// Step 1: Run single test file first
const s1Result = await runSingleTestFile();

if (!s1Result.success || s1Result.hasMemoryError) {
  console.error('Cannot run full suite - single test failed');
  process.exit(1);
}

// Step 2: Run full test suite
const result = await runFullTestSuite(s1Result);

if (result.completed && !result.memoryErrors) {
  console.log('✓ Full suite completed without memory issues');
  console.log(`Results: ${result.testResults.pass} passed, ${result.testResults.fail} failed`);
} else if (result.memoryErrors) {
  console.error('Memory error:', result.memoryError?.errorType);
}
```

**Test File**: `/home/dustin/projects/hacky-hack/tests/unit/utils/full-test-suite-runner.test.ts`
- **1422 lines** of comprehensive unit tests
- Tests validate: npm spawn execution, output capture, memory error detection, test result parsing, exit code validation, timeout handling, spawn error handling, input condition validation

---

### 1.2 Single Test Runner

**File**: `/home/dustin/projects/hacky-hack/src/utils/single-test-runner.ts`

**Purpose**: Execute a single test file with memory monitoring for quick verification.

**Key Features**:
- Spawn-based test execution via `npm run test:run -- <test-file>`
- Default test file: `tests/unit/utils/resource-monitor.test.ts` (564 tests)
- Timeout handling with SIGTERM/SIGKILL escalation (30s + 5s)
- Memory error detection using existing utility
- Structured result with success flag and memory error details

**Function Signature**:
```typescript
export async function runSingleTestFile(
  testFile?: string,
  projectRoot?: string
): Promise<SingleTestResult>
```

**Result Type**:
```typescript
export interface SingleTestResult {
  readonly success: boolean;             // Command succeeded
  readonly hasMemoryError: boolean;      // Memory error detected
  readonly output: string;               // Combined stdout/stderr
  readonly exitCode: number | null;      // Process exit code
  readonly memoryError: MemoryErrorDetectionResult | null;
  readonly error?: string;               // Error message if failed
}
```

**Test File**: `/home/dustin/projects/hacky-hack/tests/unit/utils/single-test-runner.test.ts`
- **1063 lines** of comprehensive unit tests
- Tests validate: spawn execution, output capture, memory error detection, exit code handling, timeout handling, spawn error handling

**Note**: The single-test-runner is used as a **pre-flight check** before running the full suite. If the single test fails or has memory errors, the full suite is not executed (saves 5 minutes).

---

## 2. Test Execution Patterns

### 2.1 Spawn-Based Test Execution

**Pattern**: Both test runners use Node.js `spawn()` to execute tests programmatically.

**Implementation Pattern**:
```typescript
import { spawn } from 'node:child_process';

child = spawn('npm', ['run', 'test:run', '--', testFile], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],  // stdin ignored, stdout/stderr captured
  shell: false,                        // Security: no shell injection
});
```

**Key Design Decisions**:
1. **Shell: false** - Prevents shell injection vulnerabilities
2. **Argument arrays** - Commands passed as arrays (not concatenated strings)
3. **Pipe stdio** - Captures stdout/stderr for parsing
4. **Timeout with escalation** - SIGTERM then SIGKILL if process hangs

**Output Accumulation Pattern**:
```typescript
let stdout = '';
let stderr = '';
let killed = false;

child.stdout?.on('data', (data: Buffer) => {
  if (killed) return;  // CRITICAL: Ignore data after kill
  stdout += data.toString();
});

child.stderr?.on('data', (data: Buffer) => {
  if (killed) return;  // CRITICAL: Ignore data after kill
  stderr += data.toString();
});
```

**Pattern: Ignore data after kill** - Set `killed` flag before sending SIGTERM/SIGKILL. Check flag in data event handlers to prevent race conditions where data arrives after timeout.

---

### 2.2 Timeout Handling Pattern

**Single Test Timeout**: 30 seconds + 5 second escalation
```typescript
const DEFAULT_TIMEOUT = 30_000;
const SIGKILL_TIMEOUT = 5_000;

const timeoutId = setTimeout(() => {
  timedOut = true;
  killed = true;
  child.kill('SIGTERM');

  // Escalate to SIGKILL after 5s
  setTimeout(() => {
    child.kill('SIGKILL');
  }, SIGKILL_TIMEOUT);
}, DEFAULT_TIMEOUT);
```

**Full Suite Timeout**: 5 minutes + 10 second escalation
```typescript
const DEFAULT_TIMEOUT = 5 * 60 * 1000;  // 5 minutes
const SIGKILL_TIMEOUT = 10 * 1000;      // 10 seconds
```

**Rationale**: Full suite has 1688 tests and typically takes 3-5 minutes to complete.

---

## 3. Test Result Parsing and Validation

### 3.1 Memory Error Detection Utility

**File**: `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts`

**Purpose**: Detect Node.js memory errors in test output with multi-pattern detection.

**Functions**:

1. **`detectMemoryErrorInTestOutput()`** - Detects memory errors
```typescript
export function detectMemoryErrorInTestOutput(
  output: string,
  exitCode: number | null = null
): MemoryErrorDetectionResult
```

2. **`parseVitestTestCounts()`** - Parses test pass/fail counts
```typescript
export function parseVitestTestCounts(
  output: string
): { fail: number; pass: number; total: number } | null
```

3. **`validateTestResults()`** - CI/CD validation wrapper
```typescript
export function validateTestResults(
  output: string,
  exitCode: number | null = null
): TestValidationResult
```

**Memory Error Patterns**:
- Fatal errors: `FATAL ERROR.*heap out of memory`, `CALL_AND_RETRY_LAST.*heap`
- Worker errors: `Worker terminated.*memory`, `ERR_WORKER_OUT_OF_MEMORY`
- System OOM: `JavaScript heap out of memory`, `SIGKILL.*Out of memory`
- Exit codes: 134 (SIGABRT), 137 (SIGKILL), 1 (general error)

---

### 3.2 Pass Rate Analyzer Utility

**File**: `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts`

**Purpose**: Analyze test suite pass rates against baseline metrics (94.37% from 1593/1688).

**Function**:
```typescript
export function analyzePassRate(
  testResult: TestSuiteResult | null | undefined
): PassRateAnalysis
```

**Analysis Result**:
```typescript
export interface PassRateAnalysis {
  readonly passRate: number;              // Current pass rate (0-100)
  readonly baselinePassRate: number;      // 94.37 (from 1593/1688)
  readonly targetPassRate: number;        // 100.00
  readonly improved: boolean;             // Meets or exceeds baseline
  readonly delta: number;                 // Difference from baseline
  readonly passedCount: number;
  readonly failedCount: number;
  readonly totalCount: number;
  readonly failingTests: readonly string[];  // Extracted from output
  readonly allFailuresAcceptable: boolean;   // True if no failures or known issues
}
```

**Key Features**:
- Zero-division protection (returns 0 if total is 0)
- Baseline comparison (94.37% from 1593/1688)
- Delta calculation (can be negative for degraded)
- Improved flag determination (>= baseline or 100%)
- Failing test extraction from output (JSON and CLI formats)
- Failure classification (acceptable/unacceptable)

**Baseline Calculation**:
```typescript
// From TEST_RESULTS.md: 1593 passing / 1688 total = 94.3720...%
const BASELINE_PASS_RATE = Math.round((1593 / 1688) * 10000) / 100; // 94.37

// Target: All tests should pass
const TARGET_PASS_RATE = 100.0;
```

**Usage Example**:
```typescript
const analysis = analyzePassRate(testResult);

if (analysis.improved) {
  console.log('✓ Pass rate meets or exceeds baseline');
  console.log(`  Current: ${analysis.passRate}%`);
  console.log(`  Baseline: ${analysis.baselinePassRate}%`);
  console.log(`  Delta: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}%`);
} else {
  console.log('✗ Pass rate below baseline');
  console.log(`  Current: ${analysis.passRate}%`);
  console.log(`  Baseline: ${analysis.baselinePassRate}%`);
}
```

---

## 4. NPM Test Scripts

**File**: `/home/dustin/projects/hacky-hack/package.json`

**Available Test Scripts**:
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:watch": "vitest watch",
  "test:coverage": "vitest run --coverage",
  "test:bail": "vitest run --bail=1"
}
```

**Test Script Details**:
- `npm test` - Run tests in watch mode (interactive)
- `npm run test:run` - Run tests once (CI mode) ← **Used by test runners**
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:bail` - Run tests and bail on first failure

**Validation Script**:
```json
{
  "validate": "npm run validate:groundswell && npm run lint && npm run format:check && npm run typecheck"
}
```

---

## 5. Vitest Configuration

**File**: `/home/dustin/projects/hacky-hack/vitest.config.ts`

**Configuration**:
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
```

**Key Settings**:
- **100% coverage thresholds** - Enforces complete code coverage
- **v8 provider** - Fast coverage instrumentation
- **Node environment** - Tests run in Node.js context
- **Setup file** - `tests/setup.ts` for global test configuration

---

## 6. CI/CD Patterns

### 6.1 GitHub Actions

**Finding**: **No GitHub Actions workflows exist in the repository**.

The repository has no `.github/workflows/` directory at the project root level. Only node_modules dependencies have workflow files.

**Implication**: Test validation is currently manual via npm scripts, not automated in CI/CD.

---

### 6.2 Validation Scripts

**File**: `/home/dustin/projects/hacky-hack/src/scripts/validate-groundswell.ts`

**Purpose**: Validates Groundswell library npm link and import accessibility.

**Pattern**: Standalone Node.js script with colored output and exit codes.

**Key Pattern**:
```typescript
function main(): void {
  const results = {
    npmLink: validateNpmLink(),
    version: validateVersionCompatibility(),
    imports: validateImports(),
    decorators: validateDecorators(),
    nodeVersion: validateNodeVersion(),
  };

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    log(colors.green, '\n✓ All validations passed!\n');
    process.exit(0);
  } else {
    log(colors.red, '\n✗ Some validations failed\n');
    process.exit(1);
  }
}
```

**Applicable Pattern for P4.M3.T1.S1**:
- Run validations sequentially
- Collect results in object
- Check all passed with `Object.values(results).every(r => r)`
- Exit with appropriate code (0 for success, 1 for failure)
- Use colored console output for clarity

---

## 7. Related Work Items

### 7.1 Current Task Context

**Task**: P4.M3.T1.S1 - Execute full test suite and validate results

**Status**: Researching

**Context from tasks.json**:
```json
{
  "id": "P4.M3.T1.S1",
  "title": "Run complete test suite",
  "status": "Researching",
  "context_scope": "CONTRACT DEFINITION:\n1. RESEARCH NOTE: From PRD Testing Summary - Original test statistics: 3,303 tests, 93.2% pass rate (3,081 passing, 118 failing). After all bug fixes (P1-P4), should return to >98% pass rate with <50 failing tests.\n2. INPUT: All bug fixes from P1 (Error handling), P2 (E2E pipeline), P3 (Test alignment), P4 (Polish).\n3. LOGIC: Run npm run test:run to execute full test suite. Capture test statistics: total tests, passing count, failing count, skipped count, pass percentage. Verify: all critical issues resolved (0 critical failing tests), all major issues resolved (0 major failing tests), pass rate >98%, no new test failures introduced.\n4. OUTPUT: Full test suite execution results showing >98% pass rate. All bug fixes validated. System fully functional.\n"
}
```

**Baseline Statistics** (from TEST_RESULTS.md):
- Total: 1688 tests
- Passing: 1593 tests
- Failing: 95 tests
- **Pass Rate: 94.37%**

**Target**: >98% pass rate (<35 failing tests)

---

### 7.2 Test Statistics Context

**File**: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/TEST_RESULTS.md`

**Original Test Statistics** (from PRD):
- Total: 3,303 tests
- Pass rate: 93.2%
- Passing: 3,081 tests
- Failing: 118 tests

**Current Baseline** (from TEST_RESULTS.md):
- Total: 1688 tests
- Pass rate: 94.37%
- Passing: 1593 tests
- Failing: 95 tests

**Note**: Discrepancy in test counts suggests TEST_RESULTS.md may have partial suite or different test configuration.

---

## 8. Implementation Recommendations for P4.M3.T1.S1

### 8.1 Recommended Approach

**Leverage existing utilities** instead of creating new infrastructure:

```typescript
import { runSingleTestFile } from './utils/single-test-runner.js';
import { runFullTestSuite } from './utils/full-test-suite-runner.js';
import { analyzePassRate } from './utils/pass-rate-analyzer.js';

async function executeFullTestSuiteAndValidate() {
  // Step 1: Run single test as pre-flight check
  console.log('Step 1: Running single test file...');
  const s1Result = await runSingleTestFile();

  if (!s1Result.success) {
    console.error('✗ Single test failed, skipping full suite');
    process.exit(1);
  }

  if (s1Result.hasMemoryError) {
    console.error('✗ Memory errors in single test, skipping full suite');
    process.exit(1);
  }

  console.log('✓ Single test passed, proceeding to full suite...');

  // Step 2: Run full test suite
  console.log('Step 2: Running full test suite (1688 tests)...');
  const fullResult = await runFullTestSuite(s1Result);

  if (!fullResult.completed) {
    console.error(`✗ Full suite failed: ${fullResult.error}`);
    process.exit(1);
  }

  if (fullResult.memoryErrors) {
    console.error(`✗ Memory errors detected: ${fullResult.memoryError?.errorType}`);
    process.exit(1);
  }

  console.log('✓ Full suite completed');

  // Step 3: Analyze pass rate
  console.log('Step 3: Analyzing pass rate...');
  const analysis = analyzePassRate(fullResult);

  console.log(`Test Results:`);
  console.log(`  Total: ${analysis.totalCount}`);
  console.log(`  Passed: ${analysis.passedCount}`);
  console.log(`  Failed: ${analysis.failedCount}`);
  console.log(`  Pass Rate: ${analysis.passRate}%`);
  console.log(`  Baseline: ${analysis.baselinePassRate}%`);
  console.log(`  Delta: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}%`);

  // Step 4: Validate >98% pass rate
  const targetPassRate = 98.0;

  if (analysis.passRate >= targetPassRate) {
    console.log(`✓ Pass rate meets target (>98%)`);
    process.exit(0);
  } else {
    console.error(`✗ Pass rate below target (<98%)`);
    console.error(`  Current: ${analysis.passRate}%`);
    console.error(`  Target: ${targetPassRate}%`);
    console.error(`  Gap: ${targetPassRate - analysis.passRate}%`);

    if (analysis.failingTests.length > 0) {
      console.error(`\nFailing tests (${analysis.failingTests.length}):`);
      for (const test of analysis.failingTests) {
        console.error(`  - ${test}`);
      }
    }

    process.exit(1);
  }
}
```

---

### 8.2 Key Design Decisions

1. **Use existing utilities** - Don't reinvent test running or parsing
2. **Two-stage execution** - Single test first, then full suite (saves time if single test fails)
3. **Structured logging** - Clear step-by-step output with colors
4. **Exit codes** - 0 for success, 1 for any failure
5. **Detailed failure reporting** - List failing tests if pass rate below target
6. **Leverage pass-rate-analyzer** - Uses baseline (94.37%) and handles edge cases

---

### 8.3 Validation Criteria

Based on task context, validate:

1. **Completion**: `fullResult.completed === true`
2. **No memory errors**: `fullResult.memoryErrors === false`
3. **Pass rate threshold**: `analysis.passRate >= 98.0`
4. **No critical failures**: Verify test names don't indicate critical issues
5. **No new failures**: Compare failing tests against known failures from baseline

---

## 9. External Research (Web Search Limitations)

**Note**: Web search tools reached monthly usage limits during research. Could not fetch external documentation on:
- Vitest programmatic API
- Running Vitest from Node.js scripts
- Best practices for test result validation

**Recommended External Resources** (to be reviewed when search limits reset):
1. [Vitest Guide - Programmatic API](https://vitest.dev/guide/)
2. [Vitest GitHub Repository](https://github.com/vitest-dev/vitest)
3. Search terms: "Vitest programmatic API Node.js", "run Vitest tests programmatically"

---

## 10. Summary and Next Steps

### 10.1 Summary

**Existing Infrastructure**:
- ✅ Full test suite runner (`runFullTestSuite()`)
- ✅ Single test runner (`runSingleTestFile()`)
- ✅ Pass rate analyzer (`analyzePassRate()`)
- ✅ Memory error detector (`detectMemoryErrorInTestOutput()`)
- ✅ Test result parser (`parseVitestTestCounts()`)
- ✅ Validation script pattern (`validate-groundswell.ts`)

**Missing Infrastructure**:
- ❌ GitHub Actions workflows
- ❌ CI/CD automation
- ❌ Automated test reporting

**Recommended Implementation**:
1. Create standalone Node.js script for P4.M3.T1.S1
2. Use existing test runner utilities
3. Use pass-rate-analyzer for validation
4. Follow validation script pattern for exit codes and logging
5. Validate >98% pass rate target
6. Report detailed failure information if validation fails

---

### 10.2 Next Steps for P4.M3.T1.S1

1. **Create validation script** at `src/scripts/validate-test-suite.ts`
2. **Implement executeFullTestSuiteAndValidate()** function
3. **Add npm script** `"validate:test-suite": "tsx src/scripts/validate-test-suite.ts"`
4. **Run validation** and document results
5. **Create PRP** for P4.M3.T1.S2 (if validation fails and fixes needed)

---

## Appendix A: File Reference

### Test Runner Files
- `/home/dustin/projects/hacky-hack/src/utils/full-test-suite-runner.ts` (413 lines)
- `/home/dustin/projects/hacky-hack/src/utils/single-test-runner.ts` (351 lines)
- `/home/dustin/projects/hacky-hack/tests/unit/utils/full-test-suite-runner.test.ts` (1422 lines)
- `/home/dustin/projects/hacky-hack/tests/unit/utils/single-test-runner.test.ts` (1063 lines)

### Validation Files
- `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts` (427 lines)
- `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts` (504 lines)
- `/home/dustin/projects/hacky-hack/src/scripts/validate-groundswell.ts` (279 lines)
- `/home/dustin/projects/hacky-hack/src/scripts/validate-api.ts` (555 lines)

### Configuration Files
- `/home/dustin/projects/hacky-hack/package.json` (91 lines)
- `/home/dustin/projects/hacky-hack/vitest.config.ts` (60 lines)

### Task Files
- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json` (514 lines)
- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/TEST_RESULTS.md`

---

## Appendix B: Code Patterns Reference

### Spawn-Based Test Execution Pattern
```typescript
import { spawn } from 'node:child_process';

const child = spawn('npm', ['run', 'test:run'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false,
});

let stdout = '';
let stderr = '';

child.stdout?.on('data', (data: Buffer) => {
  stdout += data.toString();
});

child.on('close', (exitCode) => {
  const combined = stdout + stderr;
  // Process output...
});
```

### Validation Script Pattern
```typescript
function main(): void {
  const results = {
    check1: validateCheck1(),
    check2: validateCheck2(),
    check3: validateCheck3(),
  };

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('✓ All validations passed');
    process.exit(0);
  } else {
    console.error('✗ Some validations failed');
    process.exit(1);
  }
}
```

### Pass Rate Analysis Pattern
```typescript
const analysis = analyzePassRate(testResult);

if (analysis.improved) {
  console.log('✓ Pass rate meets baseline');
} else {
  console.error('✗ Pass rate below baseline');
  console.error(`  Current: ${analysis.passRate}%`);
  console.error(`  Baseline: ${analysis.baselinePassRate}%`);
}
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Author**: Research Agent (P4.M3.T1.S1)
