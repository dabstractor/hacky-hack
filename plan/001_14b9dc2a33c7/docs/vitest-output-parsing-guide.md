# Vitest Test Runner Output Format and Parsing Guide

**Research Date:** 2025-01-15
**Vitest Version:** 1.6.1
**Purpose:** Comprehensive guide for parsing Vitest test output in bash/TypeScript

---

## Table of Contents

1. [Vitest JSON Reporter Output Format](#1-vitest-json-reporter-output-format)
2. [Capturing Test Results Programmatically](#2-capturing-test-results-programmatically)
3. [Available Test Output Fields](#3-available-test-output-fields)
4. [Memory Error Detection in Node.js](#4-memory-error-detection-in-nodejs)
5. [Unhandled Promise Rejection Detection](#5-unhandled-promise-rejection-detection)
6. [Best Practices for Parsing Vitest Output](#6-best-practices-for-parsing-vitest-output)

---

## 1. Vitest JSON Reporter Output Format

### 1.1 Configuration

To enable JSON output in Vitest, use the `--reporter=json` flag:

```bash
# Command line
vitest run --reporter=json

# Or with file output
vitest run --reporter=json --outputFile=test-results.json
```

**Configuration file (`vitest.config.ts`):**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      ['json', { outputFile: './test-results.json' }]
    ]
  }
});
```

### 1.2 JSON Output Structure

Based on analysis of Vitest source code (`/home/dustin/projects/hacky-hack/node_modules/vitest/dist/vendor/index.-xs08BYx.js`), the JSON reporter outputs:

```typescript
interface JsonTestResults {
  numTotalTestSuites: number;
  numPassedTestSuites: number;
  numFailedTestSuites: number;
  numPendingTestSuites: number;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  startTime: number;
  success: boolean;
  testResults: JsonTestResult[];
}

interface JsonTestResult {
  assertionResults: JsonAssertionResult[];
  startTime: number;
  endTime: number;
  status: 'passed' | 'failed';
  message: string;
  name: string;  // filepath
}

interface JsonAssertionResult {
  ancestorTitles: string[];
  fullName: string;
  status: 'passed' | 'failed' | 'skipped';
  title: string;
  duration?: number;
  failureMessages: string[];
  location?: {
    line: number;
    column: number;
  };
}
```

### 1.3 Status Mapping

The StatusMap used by Vitest JSON reporter:

| Task State | Mode | JSON Status |
|------------|------|-------------|
| 'pass' | - | 'passed' |
| 'fail' | - | 'failed' |
| 'run' | - | 'skipped' |
| 'skip' | - | 'skipped' |
| 'todo' | - | 'skipped' |
| 'only' | - | 'skipped' |

---

## 2. Capturing Test Results Programmatically

### 2.1 TypeScript Implementation

Using Node.js `spawn` with full output capture:

```typescript
import { spawn, type ChildProcess } from 'node:child_process';
import { getLogger } from './logger.js';

const logger = getLogger('VitestRunner');

interface VitestResult {
  completed: boolean;
  exitCode: number | null;
  output: string;
  testResults: { pass: number; fail: number; total: number } | null;
  memoryErrors: boolean;
}

export async function runVitestTests(
  projectRoot: string = process.cwd()
): Promise<VitestResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const child = spawn('npm', ['run', 'test:run'], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    // Capture stdout
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    // Capture stderr
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    // Handle completion
    child.on('close', (exitCode) => {
      const combinedOutput = stdout + stderr;

      resolve({
        completed: true,
        exitCode,
        output: combinedOutput,
        testResults: parseVitestTestCounts(combinedOutput),
        memoryErrors: detectMemoryErrorInTestOutput(combinedOutput, exitCode)
          .hasMemoryError,
      });
    });

    // Handle errors
    child.on('error', (error) => {
      logger.error(`Failed to spawn test process: ${error.message}`);
      resolve({
        completed: false,
        exitCode: null,
        output: '',
        testResults: null,
        memoryErrors: false,
      });
    });
  });
}
```

### 2.2 Bash Implementation

```bash
#!/usr/bin/env bash

run_vitest_tests() {
  local output_file="test-results.json"
  local project_root="${1:-$(pwd)}"

  # Run vitest with JSON reporter
  cd "$project_root" || exit 1
  npx vitest run --reporter=json --outputFile="$output_file" 2>&1

  local exit_code=$?

  # Check if tests completed
  if [ ! -f "$output_file" ]; then
    echo "Error: Test results file not created"
    return 1
  fi

  # Parse JSON results using jq
  local num_failed
  num_failed=$(jq -r '.numFailedTests // 0' "$output_file")

  local num_passed
  num_passed=$(jq -r '.numPassedTests // 0' "$output_file")

  local total
  total=$(jq -r '.numTotalTests // 0' "$output_file")

  echo "Test Results: $num_passed/$total passed, $num_failed failed"

  # Check for memory errors in combined output
  if grep -qi "heap out of memory\|worker terminated.*memory" "$output_file"; then
    echo "Warning: Memory errors detected"
    return 134
  fi

  return $exit_code
}
```

---

## 3. Available Test Output Fields

### 3.1 TaskResult Type Definition

From `/home/dustin/projects/hacky-hack/node_modules/@vitest/runner/dist/tasks-K5XERDtv.d.ts`:

```typescript
interface TaskResult {
  state: TaskState;           // 'run' | 'skip' | 'only' | 'todo' | 'pass' | 'fail'
  duration?: number;          // Test execution time in milliseconds
  startTime?: number;         // Test start timestamp
  heap?: number;              // Heap memory usage in bytes
  errors?: ErrorWithDiff[];   // Array of errors (if failed)
  htmlError?: string;         // HTML-formatted error message
  hooks?: Partial<Record<keyof SuiteHooks, TaskState>>;
  retryCount?: number;        // Number of retries performed
  repeatCount?: number;       // Number of repetitions performed
}

type TaskState = 'run' | 'skip' | 'only' | 'todo' | 'pass' | 'fail';
```

### 3.2 Standard Vitest Output Format

Vitest default CLI output format:

```
RUN  v1.6.1 /path/to/project

✓ tests/unit/core/models.test.ts  (114 tests) 16ms
✓ tests/unit/utils/errors.test.ts  (94 tests) 39ms
❯ tests/unit/core/task-orchestrator.test.ts  (85 tests | 21 failed) 93ms

Test Files  10 passed (15)
     Tests  1593 passed | 58 failed (1688)
```

### 3.3 Parsing Test Counts (CLI Output)

**Regex pattern for standard Vitest output:**

```typescript
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
    return { fail, pass, total: fail + pass };
  }

  return null;
}
```

---

## 4. Memory Error Detection in Node.js

### 4.1 Common Memory Error Patterns

Based on analysis from `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts`:

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

### 4.2 OOM Exit Codes

| Exit Code | Signal | Description |
|-----------|--------|-------------|
| 134 | SIGABRT | V8 OOM abort |
| 137 | SIGKILL | System OOM killer |
| 1 | - | General error (may indicate worker OOM) |

### 4.3 Memory Error Detection Function

```typescript
export function detectMemoryErrorInTestOutput(
  output: string,
  exitCode: number | null = null
): MemoryErrorDetectionResult {
  // Priority 1: Check fatal errors first
  if (OOM_PATTERNS.fatal.test(output) || OOM_PATTERNS.call_retry.test(output)) {
    return {
      hasMemoryError: true,
      errorType: 'HEAP_OOM',
      matchedPattern: OOM_PATTERNS.fatal.test(output)
        ? OOM_PATTERNS.fatal.source
        : OOM_PATTERNS.call_retry.source,
      exitCode,
      suggestion: 'Set NODE_OPTIONS="--max-old-space-size=4096" before running tests',
      severity: 'fatal',
    };
  }

  // Priority 2: Check worker-specific errors
  if (
    OOM_PATTERNS.worker.test(output) ||
    OOM_PATTERNS.error_code.test(output) ||
    OOM_PATTERNS.worker_terminated.test(output)
  ) {
    return {
      hasMemoryError: true,
      errorType: 'WORKER_OOM',
      matchedPattern: OOM_PATTERNS.worker.source,
      exitCode,
      suggestion: 'Add memory limits to vitest.config.ts',
      severity: 'fatal',
    };
  }

  // Priority 3: Check system OOM and standard heap errors
  if (
    OOM_PATTERNS.standard.test(output) ||
    OOM_PATTERNS.oom_killer.test(output)
  ) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern: OOM_PATTERNS.standard.source,
      exitCode,
      suggestion: 'Reduce parallel workers or increase system memory',
      severity: 'fatal',
    };
  }

  // Priority 4: Check exit codes
  if (exitCode && [134, 137, 1].includes(exitCode)) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern: `exitCode:${exitCode}`,
      exitCode,
      suggestion: 'Process terminated with OOM signal',
      severity: 'fatal',
    };
  }

  // No memory error detected
  return {
    hasMemoryError: false,
    errorType: null,
    matchedPattern: null,
    exitCode,
    suggestion: '',
    severity: 'warning',
  };
}
```

### 4.4 Vitest Memory Configuration

**Setting memory limits in vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Limit worker memory usage
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
        // Memory limit per worker (MB)
        memoryLimit: 4096,
      },
    },
  },
});
```

**Setting Node.js memory limit via environment:**

```bash
# Set global V8 heap size
export NODE_OPTIONS="--max-old-space-size=4096"

# Run tests with increased memory
NODE_OPTIONS="--max-old-space-size=4096" npm run test:run
```

---

## 5. Unhandled Promise Rejection Detection

### 5.1 Node.js Warning Pattern

Vitest internally handles unhandled rejections and emits warnings:

```
(node:63633) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously (rejection id: 4)
(Use `node --trace-warnings ...` to show where the warning was created)
```

### 5.2 Vitest Internal Handling

From `/home/dustin/projects/hacky-hack/node_modules/vitest/dist/vendor/execute.fL3szUAI.js`:

```javascript
// Vitest sets up listeners for unhandled rejections
function listenForErrors(state) {
  function catchError(err, type) {
    const worker = state();
    const error = processError(err);

    // Add metadata to error object
    error.VITEST_TEST_NAME = worker.current?.name;
    error.VITEST_TEST_PATH = relative(state().config.root, worker.filepath);
    error.VITEST_AFTER_ENV_TEARDOWN = worker.environmentTeardownRun;

    // Report error via RPC
    state().rpc.onUnhandledError(error, type);
  }

  const uncaughtException = (e) => catchError(e, "Uncaught Exception");
  const unhandledRejection = (e) => catchError(e, "Unhandled Rejection");

  process.on("uncaughtException", uncaughtException);
  process.on("unhandledRejection", unhandledRejection);
}
```

### 5.3 Detecting Unhandled Rejections in Test Output

**Regex patterns:**

```typescript
const UNHANDLED_REJECTION_PATTERNS = {
  standard: /PromiseRejectionHandledWarning/i,
  unhandled: /UnhandledPromiseRejectionWarning/i,
  vitest_internal: /onUnhandledError/i,
};

export function detectUnhandledRejections(
  output: string
): { detected: boolean; count: number; details: string[] } {
  const details: string[] = [];

  // Count standard warnings
  const standardMatches = output.match(/PromiseRejectionHandledWarning/g);
  if (standardMatches) {
    details.push(`Found ${standardMatches.length} PromiseRejectionHandledWarning`);
  }

  // Count unhandled warnings
  const unhandledMatches = output.match(/UnhandledPromiseRejectionWarning/g);
  if (unhandledMatches) {
    details.push(`Found ${unhandledMatches.length} UnhandledPromiseRejectionWarning`);
  }

  return {
    detected: details.length > 0,
    count: details.length,
    details,
  };
}
```

### 5.4 Best Practices for Promise Rejection Handling

In test code (`/home/dustin/projects/hacky-hack/tests/unit/utils/promise-handling-validator.test.ts`):

```typescript
// Test for unhandled rejections
describe('PromiseRejectionHandledWarning Detection', () => {
  let unhandledRejections: unknown[] = [];

  beforeEach(() => {
    unhandledRejections = [];
    process.on('unhandledRejection', reason => {
      unhandledRejections.push(reason);
    });
  });

  afterEach(() => {
    process.removeAllListeners('unhandledRejection');
  });

  it('should not emit unhandled rejections during validation', async () => {
    // Run code
    await verifyPromiseHandling();

    // Verify no unhandled rejections
    expect(unhandledRejections).toHaveLength(0);
  });
});
```

---

## 6. Best Practices for Parsing Vitest Output

### 6.1 TypeScript Best Practices

1. **Use existing utilities from your codebase:**

```typescript
import {
  detectMemoryErrorInTestOutput,
  parseVitestTestCounts,
  validateTestResults,
} from './utils/memory-error-detector.js';
```

2. **Always handle null/undefined inputs:**

```typescript
function parseTestResults(output: string | null) {
  if (!output) {
    return { pass: 0, fail: 0, total: 0 };
  }
  return parseVitestTestCounts(output) ?? { pass: 0, fail: 0, total: 0 };
}
```

3. **Use readonly result types:**

```typescript
export interface FullTestSuiteResult {
  readonly completed: boolean;
  readonly memoryErrors: boolean;
  readonly testResults: { pass: number; fail: number; total: number } | null;
  readonly output: string;
  readonly exitCode: number | null;
  readonly memoryError: MemoryErrorDetectionResult | null;
}
```

4. **Accumulate all output before parsing:**

```typescript
let stdout = '';
child.stdout?.on('data', (data: Buffer) => {
  stdout += data.toString(); // Don't parse yet
});

child.on('close', (exitCode) => {
  const combinedOutput = stdout + stderr;
  const memoryCheck = detectMemoryErrorInTestOutput(combinedOutput, exitCode);
  const testCounts = parseVitestTestCounts(combinedOutput);
  // Now build result
});
```

### 6.2 Bash Best Practices

1. **Use JSON reporter for programmatic parsing:**

```bash
# Good: Structured output
vitest run --reporter=json --outputFile=results.json
passed=$(jq '.numPassedTests' results.json)
failed=$(jq '.numFailedTests' results.json)

# Avoid: Fragile text parsing
# vitest run | grep "passed" | awk '{print $3}'
```

2. **Capture both stdout and stderr:**

```bash
{
  output=$(npx vitest run 2>&1)
  exit_code=$?
} || true

# Check for memory errors in combined output
if echo "$output" | grep -qi "heap out of memory"; then
  echo "Memory error detected"
  exit 134
fi
```

3. **Use exit codes properly:**

```bash
run_tests() {
  local output
  local exit_code

  output=$(npx vitest run 2>&1)
  exit_code=$?

  # Check for specific failure modes
  if [[ $exit_code -eq 134 ]]; then
    echo "OOM detected (SIGABRT)"
    return 134
  elif [[ $exit_code -eq 137 ]]; then
    echo "OOM detected (SIGKILL)"
    return 137
  fi

  return $exit_code
}
```

4. **Set appropriate timeouts:**

```bash
# Add timeout to prevent hangs
timeout 300 npx vitest run --reporter=json || {
  exit_code=$?
  if [ $exit_code -eq 124 ]; then
    echo "Tests timed out after 300 seconds"
  fi
  exit $exit_code
}
```

### 6.3 Memory Management for Test Runs

**Global test setup (`/home/dustin/projects/hacky-hack/tests/setup.ts`):**

```typescript
import { afterEach } from 'vitest';

afterEach(() => {
  // Restore environment variables
  vi.unstubAllEnvs();

  // Force garbage collection if available
  // Requires Node.js --expose-gc flag
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

**Run with GC enabled:**

```bash
# Add to package.json test scripts
"test:run": "node --expose-gc vitest run"
```

### 6.4 CI/CD Integration Pattern

```typescript
export function validateTestResults(
  output: string,
  exitCode: number | null = null
): TestValidationResult {
  // Check for memory errors first (fatal)
  const memoryCheck = detectMemoryErrorInTestOutput(output, exitCode);
  if (memoryCheck.hasMemoryError) {
    return {
      valid: false,
      reason: `Memory error: ${memoryCheck.errorType}`,
      memoryError: memoryCheck,
      testCounts: null,
    };
  }

  // Parse test counts
  const testCounts = parseVitestTestCounts(output);

  // Check for test failures
  if (testCounts && testCounts.fail > 0) {
    return {
      valid: false,
      reason: `${testCounts.fail}/${testCounts.total} tests failed`,
      memoryError: null,
      testCounts,
    };
  }

  // All checks passed
  return {
    valid: true,
    reason: `All tests passed: ${testCounts?.pass}/${testCounts?.total}`,
    memoryError: null,
    testCounts,
  };
}
```

---

## 7. Key URLs and References

### Official Documentation

- **Vitest Documentation:** https://vitest.dev
- **Vitest Reporters Guide:** https://vitest.dev/guide/reporters.html
- **Vitest Configuration API:** https://vitest.dev/config/
- **GitHub Repository:** https://github.com/vitest-dev/vitest

### Source Code References (Local)

- **Vitest Config:** `/home/dustin/projects/hacky-hack/vitest.config.ts`
- **JSON Reporter Implementation:** `/home/dustin/projects/hacky-hack/node_modules/vitest/dist/vendor/index.-xs08BYx.js`
- **Task Type Definitions:** `/home/dustin/projects/hacky-hack/node_modules/@vitest/runner/dist/tasks-K5XERDtv.d.ts`
- **Memory Error Detector:** `/home/dustin/projects/hacky-hack/src/utils/memory-error-detector.ts`
- **Test Suite Runner:** `/home/dustin/projects/hacky-hack/src/utils/full-test-suite-runner.ts`

### Related Research

- **ESLint Warning Categorization Framework:** `/home/dustin/projects/hacky-hack/docs/research/eslint-categorization-framework.md`
- **Quick Reference Templates:** `/home/dustin/projects/hacky-hack/docs/research/quick-reference-templates.md`

---

## 8. Example: Complete Test Runner with Output Parsing

```typescript
import { spawn } from 'node:child_process';
import {
  detectMemoryErrorInTestOutput,
  parseVitestTestCounts,
  validateTestResults,
} from './utils/memory-error-detector.js';

export async function runVitestWithFullParsing(
  projectRoot: string = process.cwd()
) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'test:run'], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => { stdout += data; });
    child.stderr?.on('data', (data) => { stderr += data; });

    child.on('close', (exitCode) => {
      const combinedOutput = stdout + stderr;

      // Parse output
      const memoryCheck = detectMemoryErrorInTestOutput(combinedOutput, exitCode);
      const testCounts = parseVitestTestCounts(combinedOutput);
      const validation = validateTestResults(combinedOutput, exitCode);

      resolve({
        exitCode,
        output: combinedOutput,
        memoryError: memoryCheck.hasMemoryError ? memoryCheck : null,
        testCounts,
        validation,
      });
    });
  });
}
```

---

**End of Research Document**
