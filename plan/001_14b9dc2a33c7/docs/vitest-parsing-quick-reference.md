# Vitest Output Parsing Quick Reference

**Code Templates and Copy-Paste Examples for Vitest Test Output Parsing**

---

## 1. Run Tests with JSON Output

### Command Line

```bash
# JSON to stdout
npx vitest run --reporter=json

# JSON to file
npx vitest run --reporter=json --outputFile=test-results.json

# Combined: default + JSON
npx vitest run --reporter=default --reporter=json --outputFile=test-results.json
```

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    reporters: ['default', ['json', { outputFile: './test-results.json' }]],
  },
});
```

---

## 2. TypeScript: Spawn Tests and Parse Output

```typescript
import { spawn } from 'node:child_process';

interface TestRunResult {
  completed: boolean;
  exitCode: number | null;
  output: string;
  passed?: number;
  failed?: number;
  total?: number;
  hasMemoryError: boolean;
}

export async function runTests(
  projectRoot: string = process.cwd()
): Promise<TestRunResult> {
  return new Promise(resolve => {
    const child = spawn('npm', ['run', 'test:run'], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', exitCode => {
      const output = stdout + stderr;

      resolve({
        completed: true,
        exitCode,
        output,
        ...parseTestCounts(output),
        hasMemoryError: checkMemoryError(output),
      });
    });

    child.on('error', error => {
      resolve({
        completed: false,
        exitCode: null,
        output: error.message,
        hasMemoryError: false,
      });
    });
  });
}

function parseTestCounts(output: string): {
  passed?: number;
  failed?: number;
  total?: number;
} {
  // "Tests       58 failed | 1593 passed (1688)"
  const match = output.match(
    /Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/
  );

  if (match) {
    return {
      failed: parseInt(match[1], 10),
      passed: parseInt(match[2], 10),
      total: parseInt(match[3], 10),
    };
  }

  return {};
}

function checkMemoryError(output: string): boolean {
  const patterns = [
    /FATAL ERROR.*heap out of memory/i,
    /JavaScript heap out of memory/i,
    /Worker terminated.*memory/i,
    /CALL_AND_RETRY_LAST.*heap/i,
    /SIGKILL.*Out of memory/i,
  ];

  return patterns.some(p => p.test(output));
}
```

---

## 3. Bash: Run Tests and Parse Results

```bash
#!/usr/bin/env bash

run_vitest() {
  local output_file="test-results.json"
  local project_root="${1:-$(pwd)}"

  cd "$project_root" || exit 1

  # Run tests with JSON output
  npx vitest run --reporter=json --outputFile="$output_file" 2>&1
  local exit_code=$?

  # Parse results
  if [ -f "$output_file" ]; then
    local num_failed num_passed num_total
    num_failed=$(jq -r '.numFailedTests // 0' "$output_file")
    num_passed=$(jq -r '.numPassedTests // 0' "$output_file")
    num_total=$(jq -r '.numTotalTests // 0' "$output_file")

    echo "Tests: $num_passed/$num_total passed, $num_failed failed"

    # Check for memory errors
    if grep -qi "heap out of memory\|worker terminated.*memory" "$output_file"; then
      echo "Warning: Memory error detected"
      exit 134
    fi

    exit $exit_code
  else
    echo "Error: Results file not created"
    exit 1
  fi
}
```

---

## 4. Memory Error Detection Regex Patterns

```typescript
// Copy-paste ready patterns
const MEMORY_ERROR_PATTERNS = {
  // Fatal V8 heap errors
  fatal: /FATAL ERROR.*heap out of memory/i,

  // Standard JavaScript heap OOM
  heapOom: /JavaScript heap out of memory/i,

  // Worker thread memory errors
  workerOom: /Worker terminated.*memory/i,

  // V8 allocation failure
  allocationFailure: /CALL_AND_RETRY_LAST.*heap/i,

  // System OOM killer
  oomKiller: /SIGKILL.*Out of memory/i,

  // Node.js error code
  workerErrorCode: /ERR_WORKER_OUT_OF_MEMORY/,
};

function detectMemoryError(output: string): {
  hasMemoryError: boolean;
  type?: string;
  pattern?: string;
} {
  for (const [type, pattern] of Object.entries(MEMORY_ERROR_PATTERNS)) {
    if (pattern.test(output)) {
      return {
        hasMemoryError: true,
        type,
        pattern: pattern.source,
      };
    }
  }

  return { hasMemoryError: false };
}
```

---

## 5. OOM Exit Codes Reference

```typescript
// Exit codes that indicate OOM
const OOM_EXIT_CODES = {
  SIGABRT: 134, // V8 OOM abort
  SIGKILL: 137, // System OOM killer
  GENERAL: 1, // May indicate worker OOM
};

function isOomExitCode(exitCode: number | null): boolean {
  if (exitCode === null) return false;
  return Object.values(OOM_EXIT_CODES).includes(exitCode as any);
}
```

---

## 6. Unhandled Rejection Detection

```typescript
function detectUnhandledRejections(output: string): {
  detected: boolean;
  count: number;
} {
  const warnings = output.match(/PromiseRejectionHandledWarning/g);

  return {
    detected: warnings ? warnings.length > 0 : false,
    count: warnings?.length ?? 0,
  };
}
```

---

## 7. Parse JSON Test Results

```typescript
import { readFileSync } from 'node:fs';
import type { JsonTestResults } from 'vitest';

function parseJsonResults(path: string) {
  const content = readFileSync(path, 'utf-8');
  const results: JsonTestResults = JSON.parse(content);

  return {
    totalSuites: results.numTotalTestSuites,
    passedSuites: results.numPassedTestSuites,
    failedSuites: results.numFailedTestSuites,
    totalTests: results.numTotalTests,
    passedTests: results.numPassedTests,
    failedTests: results.numFailedTests,
    success: results.success,
    duration: results.testResults.reduce(
      (acc, r) => acc + (r.endTime - r.startTime),
      0
    ),
  };
}
```

---

## 8. Complete Test Validator

```typescript
interface ValidationResult {
  success: boolean;
  reason: string;
  testCounts?: { pass: number; fail: number; total: number };
  memoryError?: boolean;
}

export function validateTestRun(
  output: string,
  exitCode: number | null
): ValidationResult {
  // Check memory errors first
  if (checkMemoryError(output)) {
    return {
      success: false,
      reason: 'Memory error detected',
      memoryError: true,
    };
  }

  // Parse test counts
  const counts = parseTestCounts(output);

  if (counts.failed && counts.failed > 0) {
    return {
      success: false,
      reason: `${counts.failed}/${counts.total} tests failed`,
      testCounts: counts,
    };
  }

  if (exitCode && exitCode !== 0) {
    return {
      success: false,
      reason: `Exit code ${exitCode}`,
      testCounts: counts,
    };
  }

  return {
    success: true,
    reason: `All ${counts.total} tests passed`,
    testCounts: counts,
  };
}
```

---

## 9. vitest.config.ts Memory Limits

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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

---

## 10. NODE_OPTIONS Memory Limit

```bash
# Set in package.json scripts
"scripts": {
  "test": "NODE_OPTIONS='--max-old-space-size=4096' vitest"
}

# Or export in shell
export NODE_OPTIONS="--max-old-space-size=4096"
npm run test
```

---

## 11. Global Test Setup with GC

```typescript
// tests/setup.ts
import { afterEach } from 'vitest';

afterEach(() => {
  // Restore environment variables
  vi.unstubAllEnvs();

  // Force garbage collection (requires --expose-gc)
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

Run with:

```bash
node --expose-gc vitest run
```

---

## 12. Test File Pattern (Copy Template)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should do something expected', () => {
      // SETUP
      const input = { value: 'test' };

      // EXECUTE
      const result = functionUnderTest(input);

      // VERIFY
      expect(result).toBeDefined();
      expect(result.value).toBe('test');
    });
  });

  describe('Error Cases', () => {
    it('should handle null input', () => {
      // SETUP
      const input = null;

      // EXECUTE & VERIFY
      expect(() => functionUnderTest(input)).not.toThrow();
    });
  });
});
```

---

## 13. Quick Regex Test Pattern Matching

```typescript
// Match Vitest test summary line
const SUMMARY_PATTERN =
  /Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/;

// Match test file result
const FILE_PATTERN = /[✓�❯]\s+(.+?)\s+\((\d+)\s+tests?\)\s+(\d+)ms/;

// Match error details
const ERROR_PATTERN = /❯\s+(.+?)\s+>\s+(.+)/;

// Match memory error
const MEMORY_PATTERNS = [
  /FATAL ERROR.*heap out of memory/i,
  /JavaScript heap out of memory/i,
  /Worker terminated.*memory/i,
];

// Match unhandled rejection
const REJECTION_PATTERN = /PromiseRejectionHandledWarning/i;
```

---

## 14. Exit Code Handler Template

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

## 15. CLI Output Parser (One-Liner)

```bash
# Extract test counts from Vitest output
parse_vitest_output() {
  grep -oP 'Tests\s+\K\d+(?=\s+failed)' <<< "$1" || echo "0"
}
```

---

**End of Quick Reference**
