/**
 * Memory error detection utilities for test output parsing
 *
 * @packageDocumentation
 *
 * @module utils/memory-error-detector
 *
 * @remarks
 * Provides comprehensive detection of Node.js memory errors in test output.
 * Supports multiple error patterns including heap OOM, worker termination,
 * and system-level OOM killer signals.
 *
 * Features:
 * - Multi-pattern detection for various Node.js OOM error formats
 * - Structured error reporting with suggestions
 * - Exit code analysis for worker-based test runners
 * - CI/CD integration support
 *
 * @example
 * ```typescript
 * import { detectMemoryErrorInTestOutput } from './utils/memory-error-detector.js';
 *
 * const testOutput = 'Worker terminated due to reaching memory limit: JS heap out of memory';
 * const result = detectMemoryErrorInTestOutput(testOutput, 134);
 *
 * if (result.hasMemoryError) {
 *   console.error(`Memory error detected: ${result.errorType}`);
 *   console.error(`Suggestion: ${result.suggestion}`);
 * }
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Memory error types for Node.js applications
 */
export type MemoryErrorType = 'HEAP_OOM' | 'WORKER_OOM' | 'SYSTEM_OOM';

/**
 * Severity levels for detected errors
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning';

/**
 * Result of memory error detection in test output
 *
 * @remarks
 * Provides structured information about detected memory errors including
 * error type, matched pattern, and actionable suggestions for resolution.
 */
export interface MemoryErrorDetectionResult {
  /** Whether a memory error was detected */
  readonly hasMemoryError: boolean;
  /** Type of memory error detected (null if no error) */
  readonly errorType: MemoryErrorType | null;
  /** The regex pattern that matched (null if no error) */
  readonly matchedPattern: string | null;
  /** Process exit code (null if process still running or code unavailable) */
  readonly exitCode: number | null;
  /** Actionable suggestion for fixing the memory error */
  readonly suggestion: string;
  /** Severity level of the detected error */
  readonly severity: ErrorSeverity;
}

/**
 * CI/CD test validation result
 *
 * @remarks
 * Used in CI/CD pipelines to validate test results and provide
 * clear failure reasons.
 */
export interface TestValidationResult {
  /** Whether tests passed validation */
  readonly valid: boolean;
  /** Human-readable reason for validation result */
  readonly reason: string;
  /** Memory error detection result (if applicable) */
  readonly memoryError: MemoryErrorDetectionResult | null;
  /** Test counts (if parsing succeeded) */
  readonly testCounts: { pass: number; fail: number; total: number } | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Regex patterns for detecting Node.js memory errors
 *
 * @remarks
 * Covers all common Node.js OOM error patterns including:
 * - Standard heap OOM errors
 * - Worker thread specific errors
 * - System OOM killer signals
 * - Node.js error codes
 */
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

/**
 * Exit codes that indicate OOM conditions
 *
 * @remarks
 * - 134: SIGABRT (abort(), often from V8 OOM)
 * - 137: SIGKILL (OOM killer)
 * - 1: General error (may include OOM in worker_threads)
 */
const OOM_EXIT_CODES = [134, 137, 1] as const;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Detects memory errors in test output
 *
 * @remarks
 * Analyzes test output for multiple Node.js OOM error patterns.
 * Returns structured results with error type, matched pattern, and suggestions.
 *
 * Detection priority:
 * 1. Fatal errors (FATAL ERROR, CALL_AND_RETRY_LAST)
 * 2. Worker errors (Worker terminated, ERR_WORKER_OUT_OF_MEMORY)
 * 3. System OOM (Standard heap OOM, SIGKILL)
 * 4. Exit codes (134, 137)
 *
 * @param output - Test output string (stdout + stderr)
 * @param exitCode - Process exit code (null if running or unavailable)
 * @returns Structured detection result
 *
 * @example
 * ```typescript
 * const result = detectMemoryErrorInTestOutput(
 *   'FATAL ERROR: JavaScript heap out of memory',
 *   134
 * );
 * // result.hasMemoryError === true
 * // result.errorType === 'HEAP_OOM'
 * // result.severity === 'fatal'
 * ```
 */
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
      suggestion:
        'Set NODE_OPTIONS="--max-old-space-size=4096" before running tests',
      severity: 'fatal',
    };
  }

  // Priority 2: Check worker-specific errors
  if (
    OOM_PATTERNS.worker.test(output) ||
    OOM_PATTERNS.error_code.test(output) ||
    OOM_PATTERNS.worker_terminated.test(output)
  ) {
    const matchedPattern = OOM_PATTERNS.worker.test(output)
      ? OOM_PATTERNS.worker.source
      : OOM_PATTERNS.error_code.test(output)
        ? OOM_PATTERNS.error_code.source
        : OOM_PATTERNS.worker_terminated.source;

    return {
      hasMemoryError: true,
      errorType: 'WORKER_OOM',
      matchedPattern,
      exitCode,
      suggestion:
        'Add memory limits to vitest.config.ts: test.workspaceConfig = { maxOldSpaceSize: 4096 }',
      severity: 'fatal',
    };
  }

  // Priority 3: Check system OOM and standard heap errors
  if (
    OOM_PATTERNS.standard.test(output) ||
    OOM_PATTERNS.oom_killer.test(output)
  ) {
    const matchedPattern = OOM_PATTERNS.standard.test(output)
      ? OOM_PATTERNS.standard.source
      : OOM_PATTERNS.oom_killer.source;

    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern,
      exitCode,
      suggestion:
        'Reduce parallel workers or increase system memory. Set NODE_OPTIONS="--max-old-space-size=4096"',
      severity: 'fatal',
    };
  }

  // Priority 4: Check exit codes
  if (exitCode && OOM_EXIT_CODES.includes(exitCode)) {
    return {
      hasMemoryError: true,
      errorType: 'SYSTEM_OOM',
      matchedPattern: `exitCode:${exitCode}`,
      exitCode,
      suggestion:
        'Process terminated with OOM signal. Increase memory limits with NODE_OPTIONS="--max-old-space-size=4096"',
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

/**
 * Checks if a worker exit code indicates OOM
 *
 * @remarks
 * Exit codes that may indicate OOM:
 * - 134: SIGABRT (abort(), often from V8 OOM)
 * - 137: SIGKILL (OOM killer)
 * - 1: General error (may include OOM in worker_threads)
 *
 * Note: Exit code 1 is not definitive for OOM but may indicate
 * worker_threads memory errors. Use with other detection methods.
 *
 * @param exitCode - Process exit code (null if unavailable)
 * @returns True if exit code may indicate OOM
 *
 * @example
 * ```typescript
 * if (isWorkerExitCodeOOM(134)) {
 *   console.log('Process may have terminated due to OOM');
 * }
 * ```
 */
export function isWorkerExitCodeOOM(exitCode: number | null): boolean {
  if (exitCode === null) {
    return false;
  }
  return OOM_EXIT_CODES.includes(exitCode);
}

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
 *
 * @example
 * ```typescript
 * const counts = parseVitestTestCounts(
 *   'Tests       58 failed | 1593 passed (1688)'
 * );
 * // counts === { fail: 58, pass: 1593, total: 1688 }
 * ```
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

/**
 * Validates test results for CI/CD pipelines
 *
 * @remarks
 * Comprehensive validation that checks for:
 * 1. Memory errors (fatal)
 * 2. Test failures (error)
 * 3. Success (valid)
 *
 * Returns structured result with human-readable reason.
 *
 * @param output - Test output string (stdout + stderr)
 * @param exitCode - Process exit code (null if unavailable)
 * @returns Validation result with reason and details
 *
 * @example
 * ```typescript
 * const validation = validateTestResults(
 *   'Tests       0 failed | 1688 passed (1688)',
 *   0
 * );
 * if (validation.valid) {
 *   console.log('All tests passed!');
 * }
 * ```
 */
export function validateTestResults(
  output: string,
  exitCode: number | null = null
): TestValidationResult {
  // Check for memory errors first (fatal)
  const memoryCheck = detectMemoryErrorInTestOutput(output, exitCode);
  if (memoryCheck.hasMemoryError) {
    return {
      valid: false,
      reason: `Memory error detected: ${memoryCheck.errorType}. ${memoryCheck.suggestion}`,
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
      reason: `Test failures detected: ${testCounts.fail} of ${testCounts.total} tests failed`,
      memoryError: null,
      testCounts,
    };
  }

  // Check exit code (non-zero indicates failure)
  if (exitCode && exitCode !== 0) {
    return {
      valid: false,
      reason: `Process exited with code ${exitCode} (non-zero)`,
      memoryError: null,
      testCounts,
    };
  }

  // All checks passed
  if (testCounts) {
    return {
      valid: true,
      reason: `All tests passed: ${testCounts.pass}/${testCounts.total}`,
      memoryError: null,
      testCounts,
    };
  }

  // Couldn't parse results but no obvious errors
  return {
    valid: true,
    reason: 'No memory errors or test failures detected',
    memoryError: null,
    testCounts: null,
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  detectMemoryErrorInTestOutput,
  isWorkerExitCodeOOM,
  parseVitestTestCounts,
  validateTestResults,
};
