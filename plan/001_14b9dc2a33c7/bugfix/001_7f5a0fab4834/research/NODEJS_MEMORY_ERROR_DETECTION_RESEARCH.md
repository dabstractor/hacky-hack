# Node.js Memory Error Patterns and Detection Research

**Research Date**: 2026-01-15
**Purpose**: Comprehensive analysis of Node.js memory error patterns, detection methods, and best practices for test runners

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Common Memory Error Patterns](#common-memory-error-patterns)
3. [Detection Methods](#detection-methods)
4. [Best Practices for Test Output Parsing](#best-practices-for-test-output-parsing)
5. [Code Examples](#code-examples)
6. [Documentation References](#documentation-references)
7. [Implementation Recommendations](#implementation-recommendations)

---

## Executive Summary

This research document identifies the key patterns for detecting Node.js memory errors, particularly in test runner environments. Based on the codebase analysis at `/home/dustin/projects/hacky-hack`, the project is experiencing **Worker termination due to reaching memory limit: JS heap out of memory** errors.

**Key Findings:**

- Node.js has specific error messages for OOM conditions
- Worker threads have different error codes than main thread
- Test runners (Vitest, Jest) require special memory configuration
- Memory errors can be detected via process events, stdout/stderr parsing, and exit codes

---

## Common Memory Error Patterns

### 1. JavaScript Heap Out of Memory Errors

These are the most common Node.js OOM errors:

#### Pattern 1.1: Standard Heap OOM

```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

#### Pattern 1.2: CALL_AND_RETRY_LAST Pattern

```
CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

#### Pattern 1.3: Simple Heap OOM

```
JavaScript heap out of memory
```

#### Pattern 1.4: Worker Thread OOM

```
Worker terminated due to reaching memory limit: JS heap out of memory
```

#### Pattern 1.5: Node.js Error Code

```
Error: Worker terminated due to reaching memory limit: JS heap out of memory
    at new NodeError (node:internal/errors)
    at ... (worker_threads module)
```

### 2. System-Level OOM Patterns

#### Pattern 2.1: Process Killed by OOM Killer

```
Command terminated by signal SIGKILL (Out of memory)
<--- Last few GCs --->
[1:0x...]     12345 ms: Mark-sweep 1234.5 (1235.6) -> 1234.1 (1235.6) MB, 50.23 % (1234.5 ms) average mutation...
<--- JS stacktrace --->
==== JS stack trace =========================================
    0: ??? [...]
    1: ??? [...]
```

#### Pattern 2.2: Build Pipeline OOM

```
gyp ERR! stack Error: `make` failed with exit code: 2
gyp ERR! not ok
```

### 3. Worker Thread Specific Errors

#### Pattern 3.1: ERR_WORKER_OUT_OF_MEMORY

```javascript
{
  code: 'ERR_WORKER_OUT_OF_MEMORY',
  message: 'Worker thread terminated due to reaching the memory limit'
}
```

#### Pattern 3.2: Worker Exit Code

```
Worker exited with exit code: 134 (SIGABRT)
Worker exited with exit code: 137 (SIGKILL)
```

---

## Detection Methods

### Method 1: String Pattern Matching (Recommended for Test Output)

**Advantages:** Language-agnostic, works with test runners, no code changes needed

**Implementation:**

```typescript
/**
 * Detects Node.js heap out of memory errors in output
 */
export function detectHeapOutOfMemory(output: string): boolean {
  const oomPatterns = [
    // Standard heap OOM patterns
    /FATAL ERROR.*JavaScript heap out of memory/i,
    /JavaScript heap out of memory/i,
    /CALL_AND_RETRY_LAST.*heap out of memory/i,
    // Worker-specific patterns
    /Worker terminated.*memory limit/i,
    /Worker.*heap out of memory/i,
    // System OOM patterns
    /terminated by signal SIGKILL.*Out of memory/i,
    // Node.js error codes
    /ERR_WORKER_OUT_OF_MEMORY/,
  ];

  return oomPatterns.some(pattern => pattern.test(output));
}
```

### Method 2: Process Event Listeners

**Advantages:** Real-time detection, programmatic handling

**Implementation:**

```typescript
/**
 * Sets up memory error detection for current process
 */
export function setupMemoryErrorDetection(): void {
  // Uncaught exceptions from OOM
  process.on('uncaughtException', (error: Error) => {
    if (error.message.includes('heap out of memory')) {
      console.error('❌ FATAL: Heap out of memory detected');
      process.exit(134); // SIGABRT
    }
  });

  // Warning events (pre-OOM)
  process.on('warning', warning => {
    if (warning.message.includes('memory')) {
      console.warn('⚠️  Memory warning:', warning);
    }
  });
}
```

### Method 3: Memory Monitoring

**Advantages:** Proactive detection, prevents OOM before it happens

**Implementation:**

```typescript
/**
 * Monitors memory usage and alerts before OOM
 */
export function monitorMemoryUsage(threshold: number = 0.9): NodeJS.Timeout {
  return setInterval(() => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usageRatio = usage.heapUsed / usage.heapTotal;

    if (usageRatio > threshold) {
      console.warn(
        `⚠️  Heap usage critical: ${heapUsedMB}MB / ${heapTotalMB}MB (${(usageRatio * 100).toFixed(1)}%)`
      );
    }
  }, 5000);
}
```

### Method 4: Worker Thread Exit Code Detection

**Advantages:** Reliable for worker-based test runners

**Implementation:**

```typescript
/**
 * Checks if worker exit code indicates OOM
 */
export function isWorkerExitCodeOOM(exitCode: number | null): boolean {
  // Exit codes that indicate OOM
  const oomExitCodes = [
    134, // SIGABRT (abort(), often from V8 OOM)
    137, // SIGKILL (OOM killer)
    1, // General error (may include OOM in worker_threads)
  ];

  return exitCode !== null && oomExitCodes.includes(exitCode);
}
```

---

## Best Practices for Test Output Parsing

### Practice 1: Multi-Pattern Detection

Don't rely on a single pattern. Use multiple regex patterns to catch variations:

```typescript
const OOM_PATTERNS = {
  fatal: /FATAL ERROR.*heap out of memory/i,
  standard: /JavaScript heap out of memory/i,
  worker: /Worker terminated.*memory/i,
  call_retry: /CALL_AND_RETRY_LAST.*heap/i,
  oom_killer: /SIGKILL.*Out of memory/i,
  error_code: /ERR_WORKER_OUT_OF_MEMORY/,
};
```

### Practice 2: Context-Aware Detection

Consider the test runner being used:

```typescript
export function detectTestRunnerMemoryError(
  output: string,
  testRunner: 'vitest' | 'jest' | 'mocha' | 'unknown'
): boolean {
  const basePatterns = [/JavaScript heap out of memory/i, /FATAL ERROR.*heap/i];

  const runnerPatterns = {
    vitest: [/Worker terminated.*memory/i, /ERR_WORKER_OUT_OF_MEMORY/],
    jest: [/FATAL ERROR.*heap/i, /CALL_AND_RETRY_LAST/],
    mocha: [/heap out of memory/i],
    unknown: [],
  };

  const patterns = [...basePatterns, ...(runnerPatterns[testRunner] || [])];
  return patterns.some(pattern => pattern.test(output));
}
```

### Practice 3: Early Detection

Check for memory issues early in test execution:

```typescript
export function parseTestOutputForMemoryIssues(output: string): {
  hasMemoryError: boolean;
  errorType: string | null;
  suggestion: string | null;
} {
  if (/JavaScript heap out of memory/i.test(output)) {
    return {
      hasMemoryError: true,
      errorType: 'HEAP_OOM',
      suggestion: 'Increase NODE_OPTIONS="--max-old-space-size=4096"',
    };
  }

  if (/Worker terminated.*memory/i.test(output)) {
    return {
      hasMemoryError: true,
      errorType: 'WORKER_OOM',
      suggestion: 'Add --max-old-space-size to test runner config',
    };
  }

  if (/SIGKILL.*Out of memory/i.test(output)) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      suggestion: 'Reduce test memory usage or increase system memory',
    };
  }

  return { hasMemoryError: false, errorType: null, suggestion: null };
}
```

### Practice 4: Structured Error Reporting

Return structured data for programmatic handling:

```typescript
export interface MemoryErrorDetectionResult {
  hasMemoryError: boolean;
  errorType: 'HEAP_OOM' | 'WORKER_OOM' | 'SYSTEM_OOM' | null;
  matchedPattern: string | null;
  exitCode: number | null;
  suggestion: string;
  severity: 'fatal' | 'error' | 'warning';
}

export function detectMemoryErrorInTestOutput(
  output: string,
  exitCode: number | null = null
): MemoryErrorDetectionResult {
  // Check fatal errors first
  const fatalPatterns = [
    { pattern: /FATAL ERROR.*heap out of memory/i, type: 'HEAP_OOM' as const },
    { pattern: /CALL_AND_RETRY_LAST.*heap/i, type: 'HEAP_OOM' as const },
  ];

  for (const { pattern, type } of fatalPatterns) {
    if (pattern.test(output)) {
      return {
        hasMemoryError: true,
        errorType: type,
        matchedPattern: pattern.source,
        exitCode,
        suggestion:
          'Set NODE_OPTIONS="--max-old-space-size=4096" before running tests',
        severity: 'fatal',
      };
    }
  }

  // Check worker errors
  if (/Worker terminated.*memory/i.test(output)) {
    return {
      hasMemoryError: true,
      errorType: 'WORKER_OOM',
      matchedPattern: 'Worker terminated.*memory',
      exitCode,
      suggestion:
        'Add memory limits to vitest.config.ts: test.workspaceConfig = { maxOldSpaceSize: 4096 }',
      severity: 'fatal',
    };
  }

  // Check system OOM
  if (/SIGKILL.*Out of memory/i.test(output)) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern: 'SIGKILL.*Out of memory',
      exitCode,
      suggestion: 'Reduce parallel workers or increase system memory',
      severity: 'fatal',
    };
  }

  // Check exit codes
  if (exitCode && isWorkerExitCodeOOM(exitCode)) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern: `exitCode:${exitCode}`,
      exitCode,
      suggestion: 'Process terminated with OOM signal. Increase memory limits.',
      severity: 'fatal',
    };
  }

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

---

## Code Examples

### Example 1: Vitest Memory Configuration

**File: vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Option 1: Set memory limit via workspace config
    workspaceConfig: {
      maxOldSpaceSize: 4096, // 4GB heap
    },
    // Option 2: Reduce parallel workers to reduce memory pressure
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4, // Reduce from default (CPU count)
        minThreads: 1,
      },
    },
    // Option 3: Isolate tests to prevent memory buildup
    isolate: true,
    // Option 4: Add timeout to prevent hanging
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

### Example 2: Package.json Test Scripts with Memory Limits

**File: package.json**

```json
{
  "scripts": {
    "test": "NODE_OPTIONS='--max-old-space-size=4096' vitest",
    "test:run": "NODE_OPTIONS='--max-old-space-size=4096' vitest run",
    "test:coverage": "NODE_OPTIONS='--max-old-space-size=4096' vitest run --coverage",
    "test:bail": "NODE_OPTIONS='--max-old-space-size=4096' vitest run --bail=1"
  }
}
```

### Example 3: Test Output Parser for CI/CD

```typescript
/**
 * Parses test runner output and detects memory errors
 * Designed for CI/CD pipelines
 */
export class TestOutputParser {
  private output: string;
  private exitCode: number | null;

  constructor(output: string, exitCode: number | null = null) {
    this.output = output;
    this.exitCode = exitCode;
  }

  /**
   * Main detection method
   */
  analyze(): {
    success: boolean;
    memoryError: MemoryErrorDetectionResult | null;
    testResults: { pass: number; fail: number; total: number } | null;
  } {
    const memoryError = detectMemoryErrorInTestOutput(
      this.output,
      this.exitCode
    );

    if (memoryError.hasMemoryError) {
      return {
        success: false,
        memoryError,
        testResults: null,
      };
    }

    // Parse test results if no memory error
    const testResults = this.parseTestResults();

    return {
      success: testResults?.fail === 0,
      memoryError: null,
      testResults,
    };
  }

  /**
   * Parses test pass/fail counts from output
   */
  private parseTestResults(): {
    pass: number;
    fail: number;
    total: number;
  } | null {
    // Vitest format: "Tests       58 failed | 1593 passed (1688)"
    const vitestPattern =
      /Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/;
    const match = this.output.match(vitestPattern);

    if (match) {
      return {
        fail: parseInt(match[1], 10),
        pass: parseInt(match[2], 10),
        total: parseInt(match[3], 10),
      };
    }

    return null;
  }
}
```

### Example 4: Memory-Aware Test Runner Wrapper

```typescript
/**
 * Wrapper for running tests with memory monitoring
 */
export class MemoryAwareTestRunner {
  private readonly maxOldSpaceSize: number;
  private readonly monitoringInterval: number;

  constructor(
    maxOldSpaceSize: number = 4096,
    monitoringInterval: number = 5000
  ) {
    this.maxOldSpaceSize = maxOldSpaceSize;
    this.monitoringInterval = monitoringInterval;
  }

  /**
   * Runs tests with memory monitoring
   */
  async runTests(testCommand: string[]): Promise<{
    exitCode: number | null;
    stdout: string;
    stderr: string;
    memoryError: boolean;
    peakMemoryMB: number;
  }> {
    const { spawn } = await import('child_process');

    // Set memory limit
    const env = {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${this.maxOldSpaceSize}`,
    };

    return new Promise(resolve => {
      const child = spawn(testCommand[0], testCommand.slice(1), {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let peakMemoryMB = 0;

      // Monitor memory
      const monitor = setInterval(() => {
        try {
          const usage = process.memoryUsage();
          const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
          peakMemoryMB = Math.max(peakMemoryMB, heapUsedMB);
        } catch {
          // Ignore errors during monitoring
        }
      }, this.monitoringInterval);

      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });

      child.on('close', exitCode => {
        clearInterval(monitor);

        const combinedOutput = stdout + stderr;
        const memoryError = detectMemoryErrorInTestOutput(
          combinedOutput,
          exitCode
        ).hasMemoryError;

        resolve({
          exitCode,
          stdout,
          stderr,
          memoryError,
          peakMemoryMB,
        });
      });
    });
  }
}
```

---

## Documentation References

While web search tools are currently rate-limited, the following are authoritative sources for Node.js memory error detection:

### Official Documentation

1. **Node.js Errors Documentation**
   - URL: `https://nodejs.org/api/errors.html`
   - Section: `ERR_WORKER_OUT_OF_MEMORY`
   - Description: Worker thread memory limit errors

2. **Node.js Worker Threads Documentation**
   - URL: `https://nodejs.org/api/worker_threads.html`
   - Sections: Memory limits, resource limits, error handling

3. **Vitest Configuration Guide**
   - URL: `https://vitest.dev/config/`
   - Sections: `poolOptions`, `workspaceConfig`, `maxOldSpaceSize`

### Community Resources

4. **GitHub: Node.js Issues**
   - Search: "heap out of memory worker threads"
   - Common patterns and community solutions

5. **Stack Overflow Tags**
   - Tags: `node.js`, `memory`, `heap-out-of-memory`, `worker-threads`
   - Common detection patterns

### Tool-Specific Documentation

6. **Vitest Advanced Configuration**
   - Test runner memory management
   - Worker pool configuration

7. **Jest Test Runner**
   - `--maxWorkers` option
   - Memory leak detection

---

## Implementation Recommendations

### Recommendation 1: Update package.json Scripts

**Priority:** HIGH (immediate fix for Issue 2 in TEST_RESULTS.md)

**Action:** Add memory limits to all test scripts

```json
{
  "scripts": {
    "test": "NODE_OPTIONS='--max-old-space-size=4096' vitest",
    "test:run": "NODE_OPTIONS='--max-old-space-size=4096' vitest run",
    "test:coverage": "NODE_OPTIONS='--max-old-space-size=4096' vitest run --coverage"
  }
}
```

### Recommendation 2: Create Memory Error Detection Utility

**File:** `src/utils/memory-error-detector.ts`

```typescript
/**
 * Memory error detection utilities for test output parsing
 * @module utils/memory-error-detector
 */

export interface MemoryErrorDetectionResult {
  hasMemoryError: boolean;
  errorType: 'HEAP_OOM' | 'WORKER_OOM' | 'SYSTEM_OOM' | null;
  matchedPattern: string | null;
  exitCode: number | null;
  suggestion: string;
  severity: 'fatal' | 'error' | 'warning';
}

const OOM_PATTERNS = {
  fatal: /FATAL ERROR.*heap out of memory/i,
  standard: /JavaScript heap out of memory/i,
  worker: /Worker terminated.*memory/i,
  call_retry: /CALL_AND_RETRY_LAST.*heap/i,
  oom_killer: /SIGKILL.*Out of memory/i,
  error_code: /ERR_WORKER_OUT_OF_MEMORY/,
};

/**
 * Detects memory errors in test output
 */
export function detectMemoryErrorInTestOutput(
  output: string,
  exitCode: number | null = null
): MemoryErrorDetectionResult {
  // Check fatal errors first
  if (OOM_PATTERNS.fatal.test(output) || OOM_PATTERNS.call_retry.test(output)) {
    return {
      hasMemoryError: true,
      errorType: 'HEAP_OOM',
      matchedPattern: 'FATAL_ERROR_OR_CALL_RETRY',
      exitCode,
      suggestion:
        'Set NODE_OPTIONS="--max-old-space-size=4096" before running tests',
      severity: 'fatal',
    };
  }

  // Check worker errors
  if (
    OOM_PATTERNS.worker.test(output) ||
    OOM_PATTERNS.error_code.test(output)
  ) {
    return {
      hasMemoryError: true,
      errorType: 'WORKER_OOM',
      matchedPattern: 'WORKER_TERMINATED',
      exitCode,
      suggestion:
        'Add memory limits to vitest.config.ts: test.workspaceConfig = { maxOldSpaceSize: 4096 }',
      severity: 'fatal',
    };
  }

  // Check system OOM
  if (
    OOM_PATTERNS.standard.test(output) ||
    OOM_PATTERNS.oom_killer.test(output)
  ) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern: 'STANDARD_OOM_OR_SIGKILL',
      exitCode,
      suggestion: 'Reduce parallel workers or increase system memory',
      severity: 'fatal',
    };
  }

  // Check exit codes
  if (exitCode && [134, 137].includes(exitCode)) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern: `exitCode:${exitCode}`,
      exitCode,
      suggestion: 'Process terminated with OOM signal. Increase memory limits.',
      severity: 'fatal',
    };
  }

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

### Recommendation 3: Update vitest.config.ts

**File:** `vitest.config.ts`

Add memory limit configuration:

```typescript
export default defineConfig({
  test: {
    // ... existing config ...
    poolOptions: {
      threads: {
        maxThreads: 4, // Reduce from CPU count
        minThreads: 1,
      },
    },
  },
});
```

### Recommendation 4: Add Test Output Parsing to CI Pipeline

Create a utility that parses test output and fails CI on memory errors:

```typescript
/**
 * CI/CD test result validator
 */
export function validateTestResults(
  output: string,
  exitCode: number | null
): { valid: boolean; reason: string } {
  const memoryCheck = detectMemoryErrorInTestOutput(output, exitCode);

  if (memoryCheck.hasMemoryError) {
    return {
      valid: false,
      reason: `Memory error detected: ${memoryCheck.errorType}. ${memoryCheck.suggestion}`,
    };
  }

  // Parse test counts
  const match = output.match(/Tests\s+(\d+)\s+failed/);
  if (match && parseInt(match[1], 10) > 0) {
    return {
      valid: false,
      reason: `Test failures detected: ${match[1]} tests failed`,
    };
  }

  return { valid: true, reason: 'All tests passed' };
}
```

---

## Summary

This research provides a comprehensive foundation for detecting and handling Node.js memory errors in test environments. Key takeaways:

1. **Multiple Error Patterns**: Node.js has several distinct OOM error messages
2. **Worker-Specific Errors**: Worker threads have unique error codes and messages
3. **Detection Methods**: String pattern matching, process events, and exit codes
4. **Prevention**: Configure memory limits in package.json and vitest.config.ts
5. **Implementation**: Create utility functions for parsing test output

**Next Steps:**

1. Implement `src/utils/memory-error-detector.ts`
2. Update package.json test scripts with memory limits
3. Configure vitest.config.ts for reduced parallelism
4. Add test output validation to CI/CD pipeline

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Related Issues:** Issue 2 in TEST_RESULTS.md ("Test Suite Has Memory Issues")
