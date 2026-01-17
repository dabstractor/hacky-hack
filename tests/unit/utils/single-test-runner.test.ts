/**
 * Unit tests for Single Test Runner
 *
 * @remarks
 * Tests validate single test file execution functionality including:
 * 1. npm run test:run -- <test-file> execution with spawn()
 * 2. stdout/stderr capture with complete output accumulation
 * 3. Memory error detection using memory-error-detector.ts
 * 4. Exit code validation (0 for success, 1 for test failures, both are success=true)
 * 5. Timeout handling with SIGTERM/SIGKILL escalation (30s + 5s)
 * 6. Spawn error handling (ENOENT, EACCES)
 * 7. hasMemoryError field extraction from memory error detection
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProcess } from 'node:child_process';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock node:child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  })),
}));

// Mock memory-error-detector
vi.mock('../../../src/utils/memory-error-detector.js', () => ({
  detectMemoryErrorInTestOutput: vi.fn(
    (output: string, exitCode: number | null) => {
      // Default mock implementation - no memory errors
      return {
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode,
        suggestion: '',
        severity: 'warning',
      };
    }
  ),
}));

// Import mocked modules
import { spawn } from 'node:child_process';
import { detectMemoryErrorInTestOutput } from '../../../src/utils/memory-error-detector.js';
import { runSingleTestFile } from '../../../src/utils/single-test-runner.js';

// =============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a realistic mock of Node.js ChildProcess that emits
 * data events and closes with the specified exit code.
 *
 * @param options - Options for configuring the mock behavior
 * @returns Mock ChildProcess object
 */
function createMockChild(
  options: {
    exitCode?: number | null;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = '', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stdout) {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stderr) {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number | null) => void) => {
      if (event === 'close') {
        // Only fire close event if exitCode is not null
        // exitCode: null simulates a hung process that never closes
        if (exitCode !== null) {
          setTimeout(() => callback(exitCode), 10);
        }
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

/**
 * Sample successful test output (all tests passed)
 */
const SUCCESS_TEST_OUTPUT = `
✓ tests/unit/utils/resource-monitor.test.ts 564 passed (564)

Test Files  1 passed (1)
     Tests  564 passed (564)
  Start at  12:34:56
  Duration  10.23s (transform 234ms, setup 1s, collect 8s, tests 9s)
`;

/**
 * Sample test failure output (some tests failed, but no memory errors)
 */
const FAILURE_TEST_OUTPUT = `
✗ tests/unit/utils/resource-monitor.test.ts 1 failed (1)
  ● Resource Monitor › should monitor resources

    AssertionError: expected true to be false

Test Files  1 failed (1)
     Tests  1 failed | 563 passed (564)
  Start at  12:34:56
  Duration  9.87s
`;

/**
 * Sample memory error output (heap OOM)
 */
const MEMORY_ERROR_OUTPUT = `
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory

 1: 0x... [node]
 2: 0x... [v8::...]
...
`;

/**
 * Sample worker terminated output
 */
const WORKER_TERMINATED_OUTPUT = `
Worker terminated due to reaching memory limit: JS heap out of memory
`;

// =============================================================================
// TEST SETUP
// ============================================================================

describe('single-test-runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset default mock behavior for memory error detector
    vi.mocked(detectMemoryErrorInTestOutput).mockImplementation(
      (output: string, exitCode?: number | null | undefined) => ({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: exitCode ?? null,
        suggestion: '',
        severity: 'warning',
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Successful test file execution', () => {
    it('should return success: true when test executes with exit code 0 (all tests passed)', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('should return success: true when test executes with exit code 1 (some tests failed)', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: FAILURE_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should return hasMemoryError: false when no memory errors detected', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasMemoryError).toBe(false);
      expect(result.memoryError).toBeNull();
    });

    it('should use npm run test:run with -- separator and test file argument', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'test:run', '--', 'tests/unit/utils/resource-monitor.test.ts'],
        expect.objectContaining({
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      );
    });

    it('should use default project root (process.cwd()) when not specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        expect.anything(),
        expect.objectContaining({
          cwd: process.cwd(),
        })
      );
    });

    it('should use custom project root when specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const customPath = '/custom/project/path';
      const resultPromise = runSingleTestFile(undefined, customPath);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        expect.anything(),
        expect.objectContaining({
          cwd: customPath,
        })
      );
    });

    it('should capture test output in output field', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toBe(SUCCESS_TEST_OUTPUT);
    });

    it('should use default test file when not specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'test:run', '--', 'tests/unit/utils/resource-monitor.test.ts'],
        expect.anything()
      );
    });

    it('should use custom test file when specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const customFile = 'tests/unit/utils/logger.test.ts';
      const resultPromise = runSingleTestFile(customFile);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'test:run', '--', customFile],
        expect.anything()
      );
    });
  });

  // ========================================================================
  // Memory error detection tests
  // ========================================================================

  describe('Memory error detection', () => {
    it('should detect heap OOM error pattern', async () => {
      const mockChild = createMockChild({
        exitCode: 134,
        stdout: MEMORY_ERROR_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      // Mock memory error detector to return error
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'HEAP_OOM',
        matchedPattern: 'FATAL ERROR.*heap out of memory',
        exitCode: 134,
        suggestion:
          'Set NODE_OPTIONS="--max-old-space-size=4096" before running tests',
        severity: 'fatal',
      });

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasMemoryError).toBe(true);
      expect(result.memoryError).not.toBeNull();
      expect(result.memoryError?.errorType).toBe('HEAP_OOM');
    });

    it('should detect Worker terminated error pattern', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: WORKER_TERMINATED_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      // Mock memory error detector to return worker error
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'WORKER_OOM',
        matchedPattern: 'Worker terminated.*memory',
        exitCode: 1,
        suggestion: 'Add memory limits to vitest.config.ts',
        severity: 'fatal',
      });

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasMemoryError).toBe(true);
      expect(result.memoryError?.errorType).toBe('WORKER_OOM');
    });

    it('should detect CALL_AND_RETRY_LAST pattern', async () => {
      const mockChild = createMockChild({
        exitCode: 134,
        stdout:
          'CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      // Mock memory error detector to return error
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'HEAP_OOM',
        matchedPattern: 'CALL_AND_RETRY_LAST.*heap',
        exitCode: 134,
        suggestion:
          'Set NODE_OPTIONS="--max-old-space-size=4096" before running tests',
        severity: 'fatal',
      });

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasMemoryError).toBe(true);
      expect(result.memoryError?.errorType).toBe('HEAP_OOM');
    });

    it('should detect memory error via exit code 134', async () => {
      const mockChild = createMockChild({
        exitCode: 134,
        stdout: 'Process exited',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      // Mock memory error detector to return error based on exit code
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'SYSTEM_OOM',
        matchedPattern: 'exitCode:134',
        exitCode: 134,
        suggestion:
          'Process terminated with OOM signal. Increase memory limits',
        severity: 'fatal',
      });

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasMemoryError).toBe(true);
      expect(result.exitCode).toBe(134);
    });

    it('should detect memory error via exit code 137', async () => {
      const mockChild = createMockChild({
        exitCode: 137,
        stdout: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      // Mock memory error detector to return error based on exit code
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'SYSTEM_OOM',
        matchedPattern: 'exitCode:137',
        exitCode: 137,
        suggestion:
          'Process terminated with OOM signal. Increase memory limits',
        severity: 'fatal',
      });

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasMemoryError).toBe(true);
      expect(result.exitCode).toBe(137);
    });

    it('should include memoryError in result when memory error detected', async () => {
      const mockChild = createMockChild({
        exitCode: 134,
        stdout: MEMORY_ERROR_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const mockMemoryError = {
        hasMemoryError: true,
        errorType: 'HEAP_OOM' as const,
        matchedPattern: 'FATAL ERROR.*heap out of memory',
        exitCode: 134,
        suggestion:
          'Set NODE_OPTIONS="--max-old-space-size=4096" before running tests',
        severity: 'fatal' as const,
      };
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue(mockMemoryError);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.memoryError).toEqual(mockMemoryError);
      expect(result.memoryError?.suggestion).toContain('NODE_OPTIONS');
    });

    it('should call detectMemoryErrorInTestOutput with combined output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'stdout content',
        stderr: 'stderr content',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(detectMemoryErrorInTestOutput).toHaveBeenCalledWith(
        'stdout contentstderr content',
        0
      );
    });
  });

  // ========================================================================
  // Exit code tests
  // ========================================================================

  describe('Exit code handling', () => {
    it('should return success: true and hasMemoryError: false when exit code is 0', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: SUCCESS_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.hasMemoryError).toBe(false);
      expect(result.exitCode).toBe(0);
    });

    it('should return success: true and hasMemoryError: false when exit code is 1', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: FAILURE_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.hasMemoryError).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should return success: true for exit code 1 (test failures are still successful execution)', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: FAILURE_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return exit code in result for non-zero exit codes', async () => {
      const mockChild = createMockChild({
        exitCode: 2,
        stdout: 'Unexpected error',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.exitCode).toBe(2);
    });
  });

  // ========================================================================
  // Timeout tests
  // ============================================================================

  describe('Timeout handling', () => {
    // Use real timers for timeout tests to properly test setTimeout behavior
    beforeEach(() => {
      vi.useRealTimers();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.useFakeTimers();
      vi.clearAllMocks();
    });

    it('should timeout and kill process when timeout is exceeded', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            // Emit close after a delay longer than timeout (31 seconds)
            setTimeout(() => callback(0), 31000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runSingleTestFile();

      // Wait for timeout to occur and promise to resolve
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out after 30000ms');
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    }, 40000);

    it('should return exitCode: null on timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 31000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runSingleTestFile();
      const result = await resultPromise;

      expect(result.exitCode).toBe(null);
    }, 40000);

    it('should return hasMemoryError: false on timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 31000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runSingleTestFile();
      const result = await resultPromise;

      expect(result.hasMemoryError).toBe(false);
    }, 40000);

    it('should send SIGKILL if SIGTERM does not kill process', async () => {
      const signals: string[] = [];

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            // Emit close after very long delay - after SIGKILL
            setTimeout(() => callback(0), 37000);
          }
        }),
        kill: vi.fn((signal: string) => {
          signals.push(signal);
        }),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runSingleTestFile();
      const result = await resultPromise;

      expect(signals).toContain('SIGTERM');
      expect(signals).toContain('SIGKILL');
      expect(result.success).toBe(false);
    }, 45000);

    it('should stop capturing output after timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event: string, callback: (data: Buffer) => void) => {
            // This data should be ignored because it comes after timeout
            setTimeout(() => callback(Buffer.from('late error')), 31000);
          }),
        },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 32000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runSingleTestFile();
      const result = await resultPromise;

      // Should have timed out
      expect(result.error).toContain('timed out after 30000ms');
    }, 40000);
  });

  // ========================================================================
  // Spawn error tests
  // ============================================================================

  describe('Spawn error handling', () => {
    it('should handle ENOENT error (npm not found)', async () => {
      const spawnError = new Error('spawn npm ENOENT');
      (spawnError as any).code = 'ENOENT';

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await runSingleTestFile();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain(
        'npm not found. Please ensure Node.js and npm are installed.'
      );
      expect(result.output).toBe('');
    });

    it('should handle EACCES error (permission denied)', async () => {
      const spawnError = new Error('spawn npm EACCES');
      (spawnError as any).code = 'EACCES';

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await runSingleTestFile();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain('Permission denied executing npm.');
    });

    it('should handle generic spawn error', async () => {
      const spawnError = new Error('Custom spawn error');

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await runSingleTestFile();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain(
        'Failed to run test file: Custom spawn error'
      );
    });

    it('should handle spawn error event', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (error: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Spawn failed')), 5);
          }
        }),
        killed: false,
        kill: vi.fn(),
      } as unknown as ChildProcess;

      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain('Failed to run test file: Spawn failed');
    });

    it('should return hasMemoryError: false on spawn errors', async () => {
      const spawnError = new Error('spawn npm ENOENT');
      (spawnError as any).code = 'ENOENT';

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await runSingleTestFile();

      expect(result.hasMemoryError).toBe(false);
    });
  });

  // ========================================================================
  // Output capture tests
  // ============================================================================

  describe('Output capture', () => {
    it('should capture stdout completely', async () => {
      const stdoutOutput = SUCCESS_TEST_OUTPUT;

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: stdoutOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toBe(stdoutOutput);
    });

    it('should capture stderr completely', async () => {
      const stderrOutput = 'Some warning or error message';

      const mockChild = createMockChild({
        exitCode: 1,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toContain(stderrOutput);
    });

    it('should combine stdout and stderr in output field', async () => {
      const stdoutOutput = 'Some test output';
      const stderrOutput = 'Some warning message';

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: stdoutOutput,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toBe(stdoutOutput + stderrOutput);
    });

    it('should handle empty output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toBe('');
      expect(result.hasMemoryError).toBe(false);
    });
  });

  // ========================================================================
  // Edge cases
  // ============================================================================

  describe('Edge cases', () => {
    it('should handle multiple data chunks from stdout', async () => {
      // Use real timers for this test
      vi.useRealTimers();

      const chunks: string[] = [
        '✓ tests/unit/utils/resource-monitor.test.ts\n',
        '564 passed (564)\n',
        'Test Files  1 passed (1)\n',
      ];

      const mockChild = {
        stdout: {
          on: vi.fn((event: string, callback: (data: Buffer) => void) => {
            if (event === 'data') {
              // Emit each chunk with proper closure
              chunks.forEach((chunk, i) => {
                setTimeout(() => callback(Buffer.from(chunk)), (i + 1) * 10);
              });
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            // Close after all chunks have been emitted
            setTimeout(() => callback(0), 100);
          }
        }),
        killed: false,
        kill: vi.fn(),
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runSingleTestFile();
      const result = await resultPromise;

      // Restore fake timers
      vi.useFakeTimers();

      expect(result.output).toBe(chunks.join(''));
      expect(result.success).toBe(true);
    });

    it('should ignore data chunks after kill signal', async () => {
      // Use real timers for this test
      vi.useRealTimers();

      const mockChild = {
        stdout: {
          on: vi.fn((event: string, callback: (data: Buffer) => void) => {
            if (event === 'data') {
              // Emit data before timeout (will be captured)
              setTimeout(() => callback(Buffer.from('Early data')), 100);
              // Try to emit data after timeout (should be ignored)
              setTimeout(() => callback(Buffer.from('Late data')), 31000);
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 32000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runSingleTestFile();
      const result = await resultPromise;

      // Restore fake timers
      vi.useFakeTimers();

      // Should have timed out and ignored late data
      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    }, 40000);

    it('should handle unicode characters in test output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: '✓ tests passed 564 passed (564) 🎉',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toContain('✓');
      expect(result.output).toContain('🎉');
      expect(result.success).toBe(true);
    });

    it('should handle very long test output', async () => {
      const longOutput = '✓ Test output\n'.repeat(1000) + '564 passed (564)';

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: longOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output.length).toBe(longOutput.length);
      expect(result.success).toBe(true);
    });

    it('should handle non-zero exit code without memory errors', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: FAILURE_TEST_OUTPUT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runSingleTestFile();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.hasMemoryError).toBe(false);
      expect(result.exitCode).toBe(1);
    });
  });
});
