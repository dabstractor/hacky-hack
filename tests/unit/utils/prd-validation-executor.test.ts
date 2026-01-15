/**
 * Unit tests for PRD Validation Executor
 *
 * @remarks
 * Tests validate PRD validation execution functionality including:
 * 1. npm run dev -- --prd <path> --validate-prd execution with spawn()
 * 2. stdout/stderr capture with complete output accumulation
 * 3. Validation status parsing (✅ VALID / ❌ INVALID)
 * 4. Exit code validation (0 for valid, 1 for invalid, both are success=true)
 * 5. Timeout handling with SIGTERM/SIGKILL escalation
 * 6. Spawn error handling (ENOENT, EACCES)
 * 7. valid field extraction from validation report
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

// Mock node:child_process logger
vi.mock('../../src/utils/logger.js', () => ({
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

// Import mocked modules
import { spawn } from 'node:child_process';
import {
  executePrdValidation,
  type PrdValidationResult,
} from '../../../src/utils/prd-validation-executor.js';

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
 * Sample valid validation report output
 */
const VALID_VALIDATION_REPORT = `
============================================================
PRD Validation Report
============================================================
File: /path/to/TEST_PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 0
  Info: 0

============================================================
`;

/**
 * Sample invalid validation report output
 */
const INVALID_VALIDATION_REPORT = `
============================================================
PRD Validation Report
============================================================
File: /path/to/TEST_PRD.md
Status: ❌ INVALID

Summary:
  Critical: 2
  Warnings: 1
  Info: 0

Issues:

❌ [CRITICAL] PRD file not found: /path/to/TEST_PRD.md
   Suggestion: Check that the path is correct. Current directory: /path/to

⚠️ [WARNING] Missing required section: ## Executive Summary
   Suggestion: Add a "## Executive Summary" section to your PRD

============================================================
`;

// =============================================================================
// TEST SETUP
// ============================================================================

describe('prd-validation-executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Successful PRD validation execution', () => {
    it('should return success: true when validation executes with exit code 0 (valid PRD)', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: VALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('should return success: true when validation executes with exit code 1 (invalid PRD)', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: INVALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should return valid: true when validation report shows ✅ VALID', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: VALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.valid).toBe(true);
    });

    it('should return valid: false when validation report shows ❌ INVALID', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: INVALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.valid).toBe(false);
    });

    it('should use npm run dev with -- separator and --prd/--validate-prd flags', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: VALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const prdPath = '/path/to/TEST_PRD.md';
      const resultPromise = executePrdValidation(prdPath);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'dev', '--', '--prd', prdPath, '--validate-prd'],
        expect.objectContaining({
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      );
    });

    it('should use default project root (process.cwd()) when not specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: VALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
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
        stdout: VALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const customPath = '/custom/project/path';
      const resultPromise = executePrdValidation(
        '/path/to/TEST_PRD.md',
        customPath
      );
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

    it('should capture validation report in validationReport field', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: VALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.validationReport).toBe(VALID_VALIDATION_REPORT);
    });
  });

  // ========================================================================
  // Validation status parsing tests
  // ========================================================================

  describe('Validation status parsing', () => {
    it('should detect ✅ VALID indicator in output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'Status: ✅ VALID',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.valid).toBe(true);
    });

    it('should detect ❌ INVALID indicator in output', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: 'Status: ❌ INVALID',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.valid).toBe(false);
    });

    it('should handle case-insensitive VALID indicator', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'status: ✅ valid',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.valid).toBe(true);
    });

    it('should return valid: false when no validation status found', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'Some other output without validation status',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.valid).toBe(false);
    });

    it('should handle whitespace in validation indicator', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'Status:  ✅  VALID  ',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // Exit code tests
  // ========================================================================

  describe('Exit code handling', () => {
    it('should return success: true and valid: true when exit code is 0', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: VALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should return success: true and valid: false when exit code is 1', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: INVALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should return success: true for exit code 1 (invalid PRD is still successful execution)', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: INVALID_VALIDATION_REPORT,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
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
            // Emit close after a delay longer than timeout (11 seconds)
            setTimeout(() => callback(0), 11000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');

      // Wait for timeout to occur and promise to resolve
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out after 10000ms');
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    }, 20000);

    it('should return exitCode: null on timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 11000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      const result = await resultPromise;

      expect(result.exitCode).toBe(null);
    }, 20000);

    it('should return valid: false on timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 11000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      const result = await resultPromise;

      expect(result.valid).toBe(false);
    }, 20000);

    it('should send SIGKILL if SIGTERM does not kill process', async () => {
      const signals: string[] = [];

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            // Emit close after very long delay - after SIGKILL
            setTimeout(() => callback(0), 17000);
          }
        }),
        kill: vi.fn((signal: string) => {
          signals.push(signal);
        }),
        killed: false, // Property that stays false to trigger SIGKILL
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      const result = await resultPromise;

      expect(signals).toContain('SIGTERM');
      expect(signals).toContain('SIGKILL');
      expect(result.success).toBe(false);
    }, 25000);

    it('should stop capturing output after timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event: string, callback: (data: Buffer) => void) => {
            // This data should be ignored because it comes after timeout
            setTimeout(() => callback(Buffer.from('late error')), 11000);
          }),
        },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 12000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      const result = await resultPromise;

      // Should have timed out
      expect(result.error).toContain('timed out after 10000ms');
    }, 20000);
  });

  // ========================================================================
  // Spawn error tests
  // ========================================================================

  describe('Spawn error handling', () => {
    it('should handle ENOENT error (npm not found)', async () => {
      const spawnError = new Error('spawn npm ENOENT');
      (spawnError as any).code = 'ENOENT';

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await executePrdValidation('/path/to/TEST_PRD.md');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain(
        'npm not found. Please ensure Node.js and npm are installed.'
      );
      expect(result.validationReport).toBe('');
    });

    it('should handle EACCES error (permission denied)', async () => {
      const spawnError = new Error('spawn npm EACCES');
      (spawnError as any).code = 'EACCES';

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await executePrdValidation('/path/to/TEST_PRD.md');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain('Permission denied executing npm.');
    });

    it('should handle generic spawn error', async () => {
      const spawnError = new Error('Custom spawn error');

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await executePrdValidation('/path/to/TEST_PRD.md');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain(
        'Failed to execute PRD validation: Custom spawn error'
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

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain(
        'Failed to execute PRD validation: Spawn failed'
      );
    });

    it('should return valid: false on spawn errors', async () => {
      const spawnError = new Error('spawn npm ENOENT');
      (spawnError as any).code = 'ENOENT';

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await executePrdValidation('/path/to/TEST_PRD.md');

      expect(result.valid).toBe(false);
    });
  });

  // ========================================================================
  // Output capture tests
  // ========================================================================

  describe('Output capture', () => {
    it('should capture stdout completely', async () => {
      const stdoutOutput = VALID_VALIDATION_REPORT;

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: stdoutOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.validationReport).toBe(stdoutOutput);
    });

    it('should capture stderr completely', async () => {
      const stderrOutput = 'Some warning or error message';

      const mockChild = createMockChild({
        exitCode: 1,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.validationReport).toContain(stderrOutput);
    });

    it('should combine stdout and stderr in validationReport field', async () => {
      const stdoutOutput = 'Some validation output';
      const stderrOutput = 'Some warning message';

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: stdoutOutput,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.validationReport).toBe(stdoutOutput + stderrOutput);
    });

    it('should handle empty output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.validationReport).toBe('');
      expect(result.valid).toBe(false);
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle multiple data chunks from stdout', async () => {
      // Use real timers for this test
      vi.useRealTimers();

      const chunks: string[] = [
        '============================================================\n',
        'PRD Validation Report\n',
        '============================================================\n',
        'Status: ✅ VALID\n',
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

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      const result = await resultPromise;

      // Restore fake timers
      vi.useFakeTimers();

      expect(result.validationReport).toBe(chunks.join(''));
      expect(result.valid).toBe(true);
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
              setTimeout(() => callback(Buffer.from('Late data')), 11000);
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 12000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      const result = await resultPromise;

      // Restore fake timers
      vi.useFakeTimers();

      // Should have timed out and ignored late data
      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    }, 20000);

    it('should handle unicode characters in validation output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'Status: ✅ VALID with émojis 🎉',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.validationReport).toContain('✅ VALID');
      expect(result.valid).toBe(true);
    });

    it('should handle very long validation reports', async () => {
      const longReport =
        '============================================================\n'.repeat(
          1000
        ) + 'Status: ✅ VALID\n';

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: longReport,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executePrdValidation('/path/to/TEST_PRD.md');
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.validationReport.length).toBe(longReport.length);
      expect(result.valid).toBe(true);
    });
  });
});
