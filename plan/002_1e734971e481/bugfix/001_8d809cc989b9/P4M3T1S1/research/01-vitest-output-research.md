# Vitest Test Output Parsing and Analysis Research

**Research Date:** 2026-01-16
**Vitest Version:** 1.6.1
**Purpose:** Comprehensive guide for parsing Vitest test output to create a PRP (Plan-Request-Proposal) for running a complete test suite and validating results.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vitest Output Formats](#2-vitest-output-formats)
3. [JSON Reporter Deep Dive](#3-json-reporter-deep-dive)
4. [Parsing Test Statistics](#4-parsing-test-statistics)
5. [Exit Codes](#5-exit-codes)
6. [Similar Implementations in Codebase](#6-similar-implementations-in-codebase)
7. [External Research References](#7-external-research-references)
8. [Recommendations for PRP Implementation](#8-recommendations-for-prp-implementation)

---

## 1. Executive Summary

### Key Findings

1. **Vitest Configuration**: The project uses Vitest 1.6.1 with ESM TypeScript support, v8 coverage provider, and 100% code coverage thresholds.

2. **Multiple Reporter Options**: Vitest supports multiple reporters (default, JSON, HTML, custom) that can be combined.

3. **Existing Parsing Infrastructure**: The codebase already contains comprehensive utilities for parsing Vitest output:
   - `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts` - Memory error detection
   - `/home/dustin/projects/hacky-hack/src/utils/full-test-suite-runner.ts` - Full test suite execution
   - `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts` - Pass rate analysis

4. **JSON Reporter Structure**: Vitest's JSON reporter outputs structured data including test counts, results per file, and detailed assertion results.

5. **Exit Codes**: Vitest uses standard exit codes (0=success, 1=failure) with specific codes for OOM errors (134, 137).

---

## 2. Vitest Output Formats

### 2.1 Current Configuration

**File:** `/home/dustin/projects/hacky-hack/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    setupFiles: ['./tests/setup.ts'],
    deps: {
      interopDefault: true,
    },
    fs: {
      allow: ['.', '..'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
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
  esbuild: {
    target: 'esnext',
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '#': new URL('./src/agents', import.meta.url).pathname,
      groundswell: new URL('../groundswell/dist/index.js', import.meta.url)
        .pathname,
    },
    extensions: ['.ts', '.js', '.tsx'],
  },
});
```

**Key Points:**

- Environment: Node.js
- Test files: `tests/**/*.{test,spec}.ts`
- Coverage: v8 provider with 100% thresholds
- Coverage reporters: text, json, html
- **Note:** No test reporters configured (uses default CLI output)

### 2.2 Available Reporter Types

Vitest supports multiple built-in reporters:

| Reporter                 | Description            | Use Case                     |
| ------------------------ | ---------------------- | ---------------------------- |
| `default`                | Standard CLI output    | Interactive terminal usage   |
| `json`                   | JSON structured output | Programmatic parsing, CI/CD  |
| `json` (with outputFile) | JSON to file           | Post-processing, archival    |
| `html`                   | HTML report            | Visual inspection, debugging |
| `junit`                  | JUnit XML format       | CI/CD integration            |
| `tap`                    | TAP format             | TAP consumers                |
| `verbose`                | Detailed output        | Debugging                    |
| `dot`                    | Minimal output         | Quick feedback               |
| `basic`                  | Simple summary         | Clean CI output              |
| Custom                   | User-defined reporters | Specialized requirements     |

### 2.3 Enabling JSON Reporter

**Command Line:**

```bash
# JSON to stdout
npx vitest run --reporter=json

# JSON to file
npx vitest run --reporter=json --outputFile=test-results.json

# Combined: default CLI + JSON file
npx vitest run --reporter=default --reporter=json --outputFile=test-results.json
```

**In vitest.config.ts:**

```typescript
export default defineConfig({
  test: {
    reporters: ['default', ['json', { outputFile: './test-results.json' }]],
  },
});
```

### 2.4 CLI Output Format (Default)

**Standard Vitest CLI Output:**

```
RUN  v1.6.1 /path/to/project

✓ tests/unit/core/models.test.ts  (114 tests) 16ms
✓ tests/unit/utils/errors.test.ts  (94 tests) 39ms
❯ tests/unit/core/task-orchestrator.test.ts  (85 tests | 21 failed) 93ms

Test Files  10 passed (15)
     Tests  1593 passed | 58 failed (1688)
  Start at  12:34:56
  Duration  205.87s (transform 234ms, setup 1s, collect 8s, tests 170s)
```

**Key Patterns:**

- File results: `✓` or `❯` followed by filename, test count, and duration
- Summary: `Test Files`, `Tests`, `Start at`, `Duration`
- Failed tests: `❯` indicates failing files with `| X failed` notation

---

## 3. JSON Reporter Deep Dive

### 3.1 JSON Reporter Output Structure

**Based on:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-output-parsing-guide.md`

```typescript
interface JsonTestResults {
  /** Total number of test suites (files) */
  numTotalTestSuites: number;

  /** Number of passing test suites */
  numPassedTestSuites: number;

  /** Number of failing test suites */
  numFailedTestSuites: number;

  /** Number of pending/skipped test suites */
  numPendingTestSuites: number;

  /** Total number of tests across all suites */
  numTotalTests: number;

  /** Number of passing tests */
  numPassedTests: number;

  /** Number of failing tests */
  numFailedTests: number;

  /** Number of skipped/pending tests */
  numPendingTests: number;

  /** Number of todo tests */
  numTodoTests: number;

  /** Start timestamp (Unix epoch) */
  startTime: number;

  /** Overall success flag (true if no failures) */
  success: boolean;

  /** Array of test file results */
  testResults: JsonTestResult[];
}

interface JsonTestResult {
  /** Test assertion results */
  assertionResults: JsonAssertionResult[];

  /** Test start timestamp */
  startTime: number;

  /** Test end timestamp */
  endTime: number;

  /** Test file status */
  status: 'passed' | 'failed';

  /** Error message (if failed) */
  message: string;

  /** Test file path/name */
  name: string;
}

interface JsonAssertionResult {
  /** Test context (describe blocks) */
  ancestorTitles: string[];

  /** Full test name (with context) */
  fullName: string;

  /** Test status */
  status: 'passed' | 'failed' | 'skipped';

  /** Test title */
  title: string;

  /** Test duration in milliseconds */
  duration?: number;

  /** Failure messages (if failed) */
  failureMessages: string[];

  /** Source location */
  location?: {
    line: number;
    column: number;
  };
}
```

### 3.2 Status Mapping

**Vitest Task State to JSON Status:**

| Task State | JSON Status | Description                                   |
| ---------- | ----------- | --------------------------------------------- |
| `'pass'`   | `'passed'`  | Test passed successfully                      |
| `'fail'`   | `'failed'`  | Test failed                                   |
| `'run'`    | `'skipped'` | Test currently running (rare in final output) |
| `'skip'`   | `'skipped'` | Test skipped                                  |
| `'todo'`   | `'skipped'` | Test marked as todo                           |
| `'only'`   | `'skipped'` | Test marked as only (incomplete run)          |

### 3.3 Example JSON Output

**File:** Example output structure from Vitest JSON reporter:

```json
{
  "numTotalTestSuites": 69,
  "numPassedTestSuites": 57,
  "numFailedTestSuites": 11,
  "numPendingTestSuites": 1,
  "numTotalTests": 1688,
  "numPassedTests": 1593,
  "numFailedTests": 58,
  "numPendingTests": 37,
  "numTodoTests": 0,
  "startTime": 1737045678000,
  "success": false,
  "testResults": [
    {
      "assertionResults": [
        {
          "ancestorTitles": ["TypeDefinitionExporter"],
          "fullName": "TypeDefinitionExporter should export type definitions",
          "status": "passed",
          "title": "should export type definitions",
          "duration": 45,
          "failureMessages": [],
          "location": {
            "line": 42,
            "column": 3
          }
        }
      ],
      "startTime": 1737045678123,
      "endTime": 1737045678456,
      "status": "passed",
      "message": "",
      "name": "tests/unit/core/type-definition-exporter.test.ts"
    }
  ]
}
```

---

## 4. Parsing Test Statistics

### 4.1 CLI Output Parsing

**Implementation:** `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts` (lines 281-332)

```typescript
/**
 * Parses test pass/fail counts from Vitest output
 *
 * @remarks
 * Extracts test results from Vitest output format:
 * "Tests       58 failed | 1593 passed (1688)"
 *
 * Returns null if pattern not found (different test runner or format).
 *
 * @param output - Test output string
 * @returns Test counts or null if parsing failed
 */
export function parseVitestTestCounts(
  output: string
): { fail: number; pass: number; total: number } | null {
  // Vitest format: "Tests       58 failed | 1593 passed (1688)"
  const vitestPattern =
    /Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/;
  const match = output.match(vitestPattern);

  if (match) {
    return {
      fail: parseInt(match[1], 10),
      pass: parseInt(match[2], 10),
      total: parseInt(match[3], 10),
    };
  }

  // Alternative format: "58 | 1593" (fail | pass)
  const altPattern = /(\d+)\s*\|\s*(\d+)/;
  const altMatch = output.match(altPattern);

  if (altMatch) {
    const fail = parseInt(altMatch[1], 10);
    const pass = parseInt(altMatch[2], 10);
    return {
      fail,
      pass,
      total: fail + pass,
    };
  }

  return null;
}
```

**Regex Patterns:**

```typescript
// Primary pattern: "Tests       58 failed | 1593 passed (1688)"
const vitestPattern =
  /Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/;

// Alternative pattern: "58 | 1593"
const altPattern = /(\d+)\s*\|\s*(\d+)/;

// File header pattern: "❯ filename (85 tests | 21 failed)"
const filePattern = /[❯]\s+(.+?)\s+\(\d+\s+tests?\s*\|\s*\d+\s+failed\)/;

// Test failure pattern: "FAIL filename > describe > test name"
const testFailure = /\sFAIL\s+(.+?)\s*>\s+(.+?)(?=\n|$)/;
```

### 4.2 JSON Output Parsing

**Implementation:** `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts` (lines 245-284)

```typescript
/**
 * Extracts failing tests from JSON reporter output
 *
 * @remarks
 * Attempts to parse output as JSON and extract failing test names.
 * Returns empty array if parsing fails (will try CLI parsing next).
 */
function extractFailingTestsFromJson(output: string): string[] {
  try {
    const results = JSON.parse(output);

    // Handle Vitest JSON format
    if (results.testResults && Array.isArray(results.testResults)) {
      return results.testResults.flatMap((suite: unknown) => {
        if (
          suite &&
          typeof suite === 'object' &&
          'assertionResults' in suite &&
          Array.isArray(suite.assertionResults)
        ) {
          return suite.assertionResults
            .filter(
              (test: unknown) =>
                test &&
                typeof test === 'object' &&
                'status' in test &&
                test.status === 'failed' &&
                'fullName' in test &&
                typeof test.fullName === 'string'
            )
            .map((test: { fullName: string }) => test.fullName);
        }
        return [];
      });
    }
  } catch {
    // Not valid JSON, return empty array
  }

  return [];
}
```

### 4.3 Calculating Pass Percentage

**Implementation:** `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts` (lines 220-242)

```typescript
/**
 * Calculates pass rate with zero-division protection
 *
 * @remarks
 * PATTERN from src/utils/progress.ts:291-310
 * const percentage = total > 0 ? (completed / total) * 100 : 0;
 *
 * @param passed - Number of passed tests
 * @param total - Total number of tests
 * @returns Pass rate rounded to 2 decimal places
 */
function calculatePassRate(passed: number, total: number): number {
  // Zero-division protection
  if (total === 0) {
    return 0;
  }

  // Calculate percentage
  const rawRate = (passed / total) * 100;

  // Round to 2 decimal places
  return Math.round(rawRate * 100) / 100;
}
```

### 4.4 Extracting Failing Test Details

**Implementation:** `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts` (lines 287-330)

```typescript
/**
 * Extracts failing tests from CLI output
 *
 * @remarks
 * Parses Vitest CLI output format for failing test names.
 * Handles both summary lines and detailed failure blocks.
 *
 * Patterns:
 * - File header: ❯ filename (85 tests | 21 failed)
 * - Test failure: FAIL filename > describe > test name
 * - Detailed failure: ❯ filename > describe > test name
 */
function extractFailingTestsFromCLI(output: string): string[] {
  const patterns = {
    // Match file header with failures: ❯ filename (85 tests | 21 failed)
    fileHeader: /[❯]\s+(.+?)\s+\(\d+\s+tests?\s*\|\s*\d+\s+failed\)/,
    // Match individual test failures: FAIL path > test name
    testFailure: /\sFAIL\s+(.+?)\s*>\s+(.+?)(?=\n|$)/,
    // Match detailed failure blocks
    detailedFailure: /\s❯\s+(.+?)\s*>\s*(.+?)(?=\n\n|$)/,
  };

  const failingTests: string[] = [];
  const lines = output.split('\n');
  let currentFile = '';

  for (const line of lines) {
    // Match file with failures
    const fileMatch = line.match(patterns.fileHeader);
    if (fileMatch) {
      currentFile = fileMatch[1].trim();
      continue;
    }

    // Match individual test failures
    const failureMatch =
      line.match(patterns.testFailure) || line.match(patterns.detailedFailure);
    if (failureMatch && currentFile) {
      const testName = failureMatch[2].trim();
      failingTests.push(`${currentFile} > ${testName}`);
    }
  }

  return failingTests;
}
```

---

## 5. Exit Codes

### 5.1 Standard Vitest Exit Codes

| Exit Code | Signal  | Description                         | Is OOM        |
| --------- | ------- | ----------------------------------- | ------------- |
| 0         | SUCCESS | All tests passed                    | No            |
| 1         | FAILURE | Some tests failed or general error  | No (possibly) |
| 124       | TIMEOUT | Process timed out (timeout command) | No            |
| 130       | SIGINT  | Interrupted (Ctrl+C)                | No            |
| 134       | SIGABRT | V8 OOM abort                        | **Yes**       |
| 137       | SIGKILL | System OOM killer                   | **Yes**       |

### 5.2 Exit Code Detection

**Implementation:** `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts` (lines 273-279)

```typescript
/**
 * Exit codes that indicate OOM conditions
 *
 * @remarks
 * - 134: SIGABRT (abort(), often from V8 OOM)
 * - 137: SIGKILL (OOM killer)
 * - 1: General error (may include OOM in worker_threads)
 */
const OOM_EXIT_CODES = [134, 137, 1] as const;

/**
 * Checks if a worker exit code indicates OOM
 *
 * @remarks
 * Exit codes that may indicate OOM:
 * - 134: SIGABRT (abort(), often from V8 OOM)
 * - 137: SIGKILL (OOM killer)
 * - 1: General error (may indicate OOM in worker_threads)
 *
 * Note: Exit code 1 is not definitive for OOM but may indicate
 * worker_threads memory errors. Use with other detection methods.
 *
 * @param exitCode - Process exit code (null if unavailable)
 * @returns True if exit code may indicate OOM
 */
export function isWorkerExitCodeOOM(exitCode: number | null): boolean {
  if (exitCode === null) {
    return false;
  }
  return OOM_EXIT_CODES.includes(exitCode);
}
```

### 5.3 Exit Code Handler Template

```typescript
export function handleExitCode(exitCode: number): {
  signal: string;
  description: string;
  isOom: boolean;
} {
  const codes: Record<
    number,
    { signal: string; description: string; isOom: boolean }
  > = {
    0: { signal: 'SUCCESS', description: 'All tests passed', isOom: false },
    1: {
      signal: 'FAILURE',
      description: 'Some tests failed or general error',
      isOom: false,
    },
    124: { signal: 'TIMEOUT', description: 'Process timed out', isOom: false },
    130: {
      signal: 'SIGINT',
      description: 'Interrupted (Ctrl+C)',
      isOom: false,
    },
    134: { signal: 'SIGABRT', description: 'V8 OOM abort', isOom: true },
    137: { signal: 'SIGKILL', description: 'OOM killer', isOom: true },
  };

  return (
    codes[exitCode] || {
      signal: `EXIT_${exitCode}`,
      description: 'Unknown exit code',
      isOom: false,
    }
  );
}
```

---

## 6. Similar Implementations in Codebase

### 6.1 Full Test Suite Runner

**File:** `/home/dustin/projects/hacky-hack/src/utils/full-test-suite-runner.ts`

**Purpose:** Runs the complete test suite (1688 tests) with memory monitoring and result parsing.

**Key Features:**

- Spawn `npm run test:run` without specific test file argument
- Stdout/stderr capture with complete output accumulation
- Timeout handling (5 minutes) with SIGTERM/SIGKILL escalation
- Memory error detection using existing utility
- Test result parsing using `parseVitestTestCounts()`
- Input condition validation (only runs if single test passed)
- Structured result with completion flag and memory error details

**Function Signature:**

```typescript
export async function runFullTestSuite(
  singleTestResult: SingleTestResult,
  projectRoot?: string
): Promise<FullTestSuiteResult>;
```

**Result Type:**

```typescript
export interface FullTestSuiteResult {
  readonly completed: boolean;
  readonly memoryErrors: boolean;
  readonly testResults: { pass: number; fail: number; total: number } | null;
  readonly output: string;
  readonly exitCode: number | null;
  readonly memoryError: MemoryErrorDetectionResult | null;
  readonly error?: string;
}
```

**Usage Example:**

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
  console.log(
    `Results: ${result.testResults.pass} passed, ${result.testResults.fail} failed`
  );
} else if (result.memoryErrors) {
  console.error('Memory error:', result.memoryError?.errorType);
} else {
  console.error('Execution failed:', result.error);
}
```

### 6.2 Memory Error Detector

**File:** `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts`

**Purpose:** Comprehensive detection of Node.js memory errors in test output.

**Key Features:**

- Multi-pattern detection for various Node.js OOM error formats
- Structured error reporting with suggestions
- Exit code analysis for worker-based test runners
- Test count parsing from CLI output
- CI/CD validation support

**Public API:**

```typescript
// Detect memory errors in output
export function detectMemoryErrorInTestOutput(
  output: string,
  exitCode: number | null = null
): MemoryErrorDetectionResult;

// Parse test counts from Vitest output
export function parseVitestTestCounts(
  output: string
): { fail: number; pass: number; total: number } | null;

// Check if exit code indicates OOM
export function isWorkerExitCodeOOM(exitCode: number | null): boolean;

// Validate test results for CI/CD
export function validateTestResults(
  output: string,
  exitCode: number | null = null
): TestValidationResult;
```

**Memory Error Patterns:**

```typescript
const OOM_PATTERNS = {
  /** Fatal V8 heap errors */
  fatal: /FATAL ERROR.*heap out of memory/i,

  /** Standard JavaScript heap OOM */
  standard: /JavaScript heap out of memory/i,

  /** Worker thread memory limit errors */
  worker: /Worker terminated.*memory/i,

  /** CALL_AND_RETRY_LAST allocation failure pattern */
  call_retry: /CALL_AND_RETRY_LAST.*heap/i,

  /** System OOM killer signal (SIGKILL) */
  oom_killer: /SIGKILL.*Out of memory/i,

  /** Node.js worker_threads error code */
  error_code: /ERR_WORKER_OUT_OF_MEMORY/,

  /** Generic worker terminated patterns */
  worker_terminated: /worker terminated.*memory limit/i,
} as const;
```

### 6.3 Pass Rate Analyzer

**File:** `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts`

**Purpose:** Analyze test suite pass rates against baseline metrics (94.37% from 1593/1688).

**Key Features:**

- Pass rate calculation with zero-division protection
- Baseline comparison (94.37% from 1593/1688)
- Delta calculation (can be negative for degraded)
- Improved flag determination (>= baseline or 100%)
- Failing test extraction from output (JSON and CLI)
- Failure classification (acceptable/unacceptable)
- Structured result with all metrics

**Public API:**

```typescript
export function analyzePassRate(
  testResult: TestSuiteResult | null | undefined
): PassRateAnalysis;
```

**Result Type:**

```typescript
export interface PassRateAnalysis {
  readonly passRate: number;
  readonly baselinePassRate: number;
  readonly targetPassRate: number;
  readonly improved: boolean;
  readonly delta: number;
  readonly passedCount: number;
  readonly failedCount: number;
  readonly totalCount: number;
  readonly failingTests: readonly string[];
  readonly allFailuresAcceptable: boolean;
}
```

**Usage Example:**

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
  console.log(`  Delta: ${analysis.delta}%`);
}
```

### 6.4 Single Test Runner

**File:** `/home/dustin/projects/hacky-hack/src/utils/single-test-runner.ts`

**Purpose:** Run a single test file with memory monitoring to verify NODE_OPTIONS memory limits work correctly.

**Key Features:**

- Spawn `npm run test:run -- <test-file>` with specific test file
- Stdout/stderr capture with complete output accumulation
- Timeout handling (30 seconds) with SIGTERM/SIGKILL escalation
- Memory error detection using existing utility
- Structured result with completion flag and memory error details

**Function Signature:**

```typescript
export async function runSingleTestFile(
  testFile?: string,
  projectRoot?: string
): Promise<SingleTestResult>;
```

### 6.5 Test Files

**Unit Tests:**

- `/home/dustin/projects/hacky-hack/tests/unit/utils/full-test-suite-runner.test.ts` - Comprehensive tests for full suite runner
- `/home/dustin/projects/hacky-hack/tests/unit/utils/single-test-runner.test.ts` - Tests for single test runner

**Documentation:**

- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-output-parsing-guide.md` - Comprehensive parsing guide (815 lines)
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-parsing-quick-reference.md` - Quick reference templates (490 lines)

---

## 7. External Research References

### 7.1 Official Documentation

**Note:** Web search services reached monthly usage limit during research. Below are known references that should be verified.

**Vitest Documentation:**

- Main Site: https://vitest.dev
- Reporters Guide: https://vitest.dev/guide/reporters.html
- Configuration API: https://vitest.dev/config/
- GitHub Repository: https://github.com/vitest-dev/vitest
- JSON Reporter: https://vitest.dev/guide/reporters.html#json-reporter

**Key Topics to Verify:**

1. JSON reporter output structure (may have changed in newer versions)
2. Custom reporter API for programmatic test execution
3. Exit code behavior in different scenarios
4. Worker memory limit configuration
5. Test result streaming options

### 7.2 Source Code References (Local)

**Vitest Implementation:**

- **Vitest Config:** `/home/dustin/projects/hacky-hack/vitest.config.ts`
- **JSON Reporter Implementation:** `/home/dustin/projects/hacky-hack/node_modules/vitest/dist/vendor/index.-xs08BYx.js`
- **Task Type Definitions:** `/home/dustin/projects/hacky-hack/node_modules/@vitest/runner/dist/tasks-K5XERDtv.d.ts`
- **TypeScript Types:** `/home/dustin/projects/hacky-hack/node_modules/vitest/dist/reporters.d.ts`

**Project Utilities:**

- **Memory Error Detector:** `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts`
- **Test Suite Runner:** `/home/dustin/projects/hacky-hack/src/utils/full-test-suite-runner.ts`
- **Pass Rate Analyzer:** `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts`
- **Single Test Runner:** `/home/dustin/projects/hacky-hack/src/utils/single-test-runner.ts`

**Research Documents:**

- **Output Parsing Guide:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-output-parsing-guide.md`
- **Quick Reference:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-parsing-quick-reference.md`

---

## 8. Recommendations for PRP Implementation

### 8.1 Recommended Approach

Based on the research findings, here's the recommended approach for creating a PRP (Plan-Request-Proposal) for running a complete test suite and validating results:

#### Option 1: Use Existing Utilities (Recommended)

**Why:** The codebase already has comprehensive, well-tested utilities for running tests and parsing results.

**Implementation:**

```typescript
import { runFullTestSuite } from './utils/full-test-suite-runner.js';
import { runSingleTestFile } from './utils/single-test-runner.js';
import { analyzePassRate } from './utils/pass-rate-analyzer.js';

// Step 1: Run single test file as smoke test
const s1Result = await runSingleTestFile();

if (!s1Result.success || s1Result.hasMemoryError) {
  throw new Error('Smoke test failed - cannot proceed with full suite');
}

// Step 2: Run full test suite
const suiteResult = await runFullTestSuite(s1Result);

if (!suiteResult.completed) {
  throw new Error(`Test suite failed to complete: ${suiteResult.error}`);
}

if (suiteResult.memoryErrors) {
  throw new Error(
    `Memory error detected: ${suiteResult.memoryError.errorType}`
  );
}

// Step 3: Analyze pass rate
const testSuiteResult: TestSuiteResult = {
  completed: suiteResult.completed,
  results: suiteResult.testResults!,
  hasMemoryErrors: suiteResult.memoryErrors,
  hasPromiseRejections: false, // Add detection if needed
  executionTime: 0, // Add timing if needed
  output: suiteResult.output,
  exitCode: suiteResult.exitCode!,
};

const analysis = analyzePassRate(testSuiteResult);

// Step 4: Validate against baseline
if (!analysis.improved) {
  throw new Error(
    `Pass rate below baseline: ${analysis.passRate}% < ${analysis.baselinePassRate}%`
  );
}

console.log('✓ All tests passed validation');
console.log(`  Pass rate: ${analysis.passRate}%`);
console.log(`  Baseline: ${analysis.baselinePassRate}%`);
console.log(`  Delta: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}%`);
```

#### Option 2: Use JSON Reporter

**Why:** More reliable parsing, better error details, easier to extract failing test names.

**Implementation:**

```typescript
import { spawn } from 'node:child_process';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface JsonTestResults {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  success: boolean;
  testResults: Array<{
    name: string;
    status: 'passed' | 'failed';
    assertionResults: Array<{
      fullName: string;
      status: 'passed' | 'failed';
      failureMessages?: string[];
    }>;
  }>;
}

export async function runTestSuiteWithJson(
  projectRoot: string = process.cwd()
): Promise<{
  exitCode: number | null;
  results: JsonTestResults | null;
  output: string;
  hasMemoryError: boolean;
}> {
  const outputFile = join(projectRoot, 'test-results.json');

  return new Promise(resolve => {
    const child = spawn(
      'npm',
      [
        'run',
        'test:run',
        '--',
        '--reporter=json',
        `--outputFile=${outputFile}`,
      ],
      {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', async exitCode => {
      const combinedOutput = stdout + stderr;

      try {
        const jsonContent = await readFile(outputFile, 'utf-8');
        const results: JsonTestResults = JSON.parse(jsonContent);

        const hasMemoryError =
          /heap out of memory|worker terminated.*memory/i.test(combinedOutput);

        resolve({
          exitCode,
          results,
          output: combinedOutput,
          hasMemoryError,
        });
      } catch {
        // JSON parsing failed, return null results
        resolve({
          exitCode,
          results: null,
          output: combinedOutput,
          hasMemoryError: false,
        });
      }
    });

    child.on('error', error => {
      resolve({
        exitCode: null,
        results: null,
        output: error.message,
        hasMemoryError: false,
      });
    });
  });
}
```

#### Option 3: Custom Vitest Reporter

**Why:** Real-time result streaming, custom format, no file I/O overhead.

**Implementation:**

```typescript
// custom-vitest-reporter.ts
import type { Reporter } from 'vitest';

interface CustomReport {
  startTime: number;
  endTime?: number;
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  files: {
    total: number;
    passed: number;
    failed: number;
  };
  failures: Array<{
    file: string;
    test: string;
    error: string;
  }>;
  memoryErrors: string[];
}

export class PrpVitestReporter implements Reporter {
  private report: CustomReport = {
    startTime: Date.now(),
    tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
    files: { total: 0, passed: 0, failed: 0 },
    failures: [],
    memoryErrors: [],
  };

  onInit() {
    // Initialize
  }

  onFinished(files?: any[]) {
    this.report.endTime = Date.now();

    // Process results
    if (files) {
      this.report.files.total = files.length;

      for (const file of files) {
        const fileResult = file.result();

        if (fileResult.status === 'fail') {
          this.report.files.failed++;
        } else if (fileResult.status === 'pass') {
          this.report.files.passed++;
        }

        // Process tests
        const tasks = file.result?.tasks || [];
        for (const task of tasks) {
          this.report.tests.total++;

          if (task.result?.state === 'fail') {
            this.report.tests.failed++;
            this.report.failures.push({
              file: file.filepath,
              test: task.name,
              error: task.result?.error?.message || 'Unknown error',
            });
          } else if (task.result?.state === 'pass') {
            this.report.tests.passed++;
          } else if (task.result?.state === 'skip') {
            this.report.tests.skipped++;
          }
        }
      }
    }

    // Write report to stdout for parsing
    console.log('PRP_REPORT_START');
    console.log(JSON.stringify(this.report));
    console.log('PRP_REPORT_END');
  }

  onUserConsoleLog() {
    // Handle console logs
  }
}
```

### 8.2 Configuration Recommendations

**Update vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ... existing config ...

    // Add test reporter configuration
    reporters: [
      'default', // Keep for interactive use
      ['json', { outputFile: './test-results.json' }], // Add for PRP parsing
    ],

    // Add memory limits to prevent OOM
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
        memoryLimit: 4096, // MB per worker
      },
    },
  },
});
```

**Update package.json scripts:**

```json
{
  "scripts": {
    "test:run": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest run",
    "test:json": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest run --reporter=json --outputFile=test-results.json",
    "test:prp": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest run --reporter=default --reporter=json --outputFile=test-results.json"
  }
}
```

### 8.3 Best Practices

1. **Always use existing utilities** before implementing new ones
2. **Validate input conditions** before running expensive operations
3. **Use JSON reporter** for reliable parsing (avoid fragile regex)
4. **Check exit codes** first (0=success, 1=failure, 134/137=OOM)
5. **Accumulate all output** before parsing (handle multiple data chunks)
6. **Handle memory errors** as fatal (cannot parse results reliably)
7. **Use structured result types** with readonly fields
8. **Provide clear error messages** with actionable suggestions
9. **Log all parsing decisions** for debugging
10. **Test with real output** from your actual test suite

### 8.4 Validation Checklist

- [ ] Single test file runs without memory errors
- [ ] Full test suite completes within timeout
- [ ] Test counts parse correctly from CLI output
- [ ] Test counts parse correctly from JSON output
- [ ] Exit codes match expected values
- [ ] Memory errors detected correctly
- [ ] Pass rate calculates correctly
- [ ] Baseline comparison works
- [ ] Failing tests extract correctly
- [ ] Error messages are actionable

---

## 9. Summary

### 9.1 Key Takeaways

1. **Use Existing Infrastructure**: The codebase already has comprehensive utilities for running tests and parsing results. Use `full-test-suite-runner.ts`, `memory-error-detector.ts`, and `pass-rate-analyzer.ts`.

2. **JSON Reporter is Best**: For PRP implementation, use the JSON reporter (`--reporter=json --outputFile=test-results.json`) for reliable, structured output parsing.

3. **Exit Codes Matter**: Always check exit codes first: 0=success, 1=failure, 134/137=OOM.

4. **Memory Errors are Fatal**: If memory errors are detected, test results cannot be trusted. Handle as fatal errors.

5. **Pass Rate Analysis**: Use the existing `analyzePassRate()` function to compare against the baseline (94.37%).

### 9.2 File Paths Reference

**Implementation Files:**

- `/home/dustin/projects/hacky-hack/vitest.config.ts` - Vitest configuration
- `/home/dustin/projects/hacky-hack/package.json` - NPM scripts
- `/home/dustin/projects/hacky-hack/src/utils/full-test-suite-runner.ts` - Full suite runner
- `/home/dustin/projects/hacky-hack/src/utils/single-test-runner.ts` - Single test runner
- `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts` - Memory error detection
- `/home/dustin/projects/hacky-hack/src/utils/pass-rate-analyzer.ts` - Pass rate analysis

**Test Files:**

- `/home/dustin/projects/hacky-hack/tests/unit/utils/full-test-suite-runner.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/utils/single-test-runner.test.ts`

**Documentation:**

- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-output-parsing-guide.md`
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-parsing-quick-reference.md`

### 9.3 Next Steps

1. **Choose Implementation Approach**: Decide between existing utilities (Option 1) or JSON reporter (Option 2).

2. **Update Configuration**: Add JSON reporter to `vitest.config.ts` and update `package.json` scripts.

3. **Implement PRP**: Create the PRP workflow using the chosen approach.

4. **Test Thoroughly**: Run the PRP with various scenarios (all pass, some fail, OOM errors).

5. **Document**: Add PRP documentation to the project.

---

**End of Research Document**
