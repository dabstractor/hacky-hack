/**
 * Unit tests for CLI Help Executor
 *
 * @remarks
 * Tests validate CLI help execution functionality including:
 * 1. npm run dev -- --help execution with spawn()
 * 2. stdout/stderr capture with complete output accumulation
 * 3. Help text section parsing (Usage, Options, description)
 * 4. Exit code validation (0 for success)
 * 5. Timeout handling with SIGTERM/SIGKILL escalation
 * 6. Spawn error handling (ENOENT, EACCES)
 * 7. hasHelp detection based on help sections
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
  executeCliHelp,
  type CliHelpResult,
} from '../../../src/utils/cli-help-executor.js';

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

// =============================================================================
// TEST SETUP
// ============================================================================

describe('cli-help-executor', () => {
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

  describe('Successful CLI help execution', () => {
    const validHelpOutput = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -V, --version         output the version number
  --prd <path>          Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>       Scope identifier (e.g., "P3.M4", "P3.M4.T2")
  --mode <mode>         Execution mode (choices: "normal", "bug-hunt", "validate")
  -h, --help            display help for command
`;

    it('should return success: true when CLI help executes with exit code 0', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: validHelpOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('should return hasHelp: true when Usage and Options sections are present', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: validHelpOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });

    it('should use npm run dev with -- separator and --help flag', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: validHelpOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'dev', '--', '--help'],
        expect.objectContaining({
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      );
    });

    it('should use default project root (process.cwd()) when not specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: validHelpOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
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
        stdout: validHelpOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const customPath = '/custom/project/path';
      const resultPromise = executeCliHelp(customPath);
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

    it('should capture combined stdout and stderr in output field', async () => {
      const stdoutOutput = 'Usage: prp-pipeline [options]';
      const stderrOutput = 'Some warning message';

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: stdoutOutput,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toBe(stdoutOutput + stderrOutput);
    });
  });

  // ========================================================================
  // Help section parsing tests
  // ========================================================================

  describe('Help section parsing', () => {
    it('should detect Usage section when present', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Usage: prp-pipeline [options]

Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });

    it('should detect Options section when present', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Usage: prp-pipeline [options]

Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });

    it('should return hasHelp: false when Usage section is missing', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(false);
    });

    it('should return hasHelp: false when Options section is missing', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Usage: prp-pipeline [options]

Some other text
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(false);
    });

    it('should detect program description "PRD to PRP Pipeline"', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });

    it('should handle Commands section (optional, may not exist)', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Usage: prp-pipeline [options]

Commands:
  init    Initialize a new project

Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });

    it('should still return hasHelp: true when Commands section is missing', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });
  });

  // ========================================================================
  // Exit code tests
  // ========================================================================

  describe('Exit code handling', () => {
    it('should return success: true when exit code is 0', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `Usage: prp-pipeline [options]

Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should return success: false when exit code is non-zero', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: 'Some error output',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should return hasHelp: false when exit code is non-zero even if help text present', async () => {
      const mockChild = createMockChild({
        exitCode: 1,
        stdout: `Usage: prp-pipeline [options]

Options:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.hasHelp).toBe(true); // hasHelp is independent of success
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
      // Child that emits close after a delay longer than our timeout
      let closeCallback: ((code: number | null) => void) | undefined;
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            closeCallback = callback;
            // Emit close after a delay longer than timeout (11 seconds)
            setTimeout(() => callback(0), 11000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executeCliHelp();

      // Wait for timeout to occur and promise to resolve
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out after 10000ms');
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    }, 20000);

    it('should return exitCode: null on timeout', async () => {
      let closeCallback: ((code: number | null) => void) | undefined;
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            closeCallback = callback;
            setTimeout(() => callback(0), 11000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executeCliHelp();
      const result = await resultPromise;

      expect(result.exitCode).toBe(null);
    }, 20000);

    it('should send SIGKILL if SIGTERM does not kill process', async () => {
      // Track signals received
      const signals: string[] = [];
      let closeCallback: ((code: number | null) => void) | undefined;

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            closeCallback = callback;
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

      const resultPromise = executeCliHelp();
      const result = await resultPromise;

      expect(signals).toContain('SIGTERM');
      expect(signals).toContain('SIGKILL');
      expect(result.success).toBe(false);
    }, 25000);

    it('should stop capturing output after timeout', async () => {
      let closeCallback: ((code: number | null) => void) | undefined;
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
            closeCallback = callback;
            setTimeout(() => callback(0), 12000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executeCliHelp();
      const result = await resultPromise;

      // Should have timed out
      expect(result.error).toContain('timed out after 10000ms');
    }, 20000);

    it('should return hasHelp: false on timeout', async () => {
      let closeCallback: ((code: number | null) => void) | undefined;
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            closeCallback = callback;
            setTimeout(() => callback(0), 11000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executeCliHelp();
      const result = await resultPromise;

      expect(result.hasHelp).toBe(false);
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

      const result = await executeCliHelp();

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

      const result = await executeCliHelp();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain('Permission denied executing npm.');
    });

    it('should handle generic spawn error', async () => {
      const spawnError = new Error('Custom spawn error');

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await executeCliHelp();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain(
        'Failed to execute CLI help: Custom spawn error'
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

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain(
        'Failed to execute CLI help: Spawn failed'
      );
    });

    it('should return hasHelp: false on spawn errors', async () => {
      const spawnError = new Error('spawn npm ENOENT');
      (spawnError as any).code = 'ENOENT';

      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await executeCliHelp();

      expect(result.hasHelp).toBe(false);
    });
  });

  // ========================================================================
  // Output capture tests
  // ========================================================================

  describe('Output capture', () => {
    it('should capture stdout completely', async () => {
      const stdoutOutput = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -h, --help            display help for command
`;

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: stdoutOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
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

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toContain(stderrOutput);
    });

    it('should handle empty output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.output).toBe('');
      expect(result.hasHelp).toBe(false);
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
        'Usage: prp-pipeline',
        '\n\nOptions:',
        '\n  -h, --help',
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

      const resultPromise = executeCliHelp();
      const result = await resultPromise;

      // Restore fake timers
      vi.useFakeTimers();

      expect(result.output).toBe(chunks.join(''));
      expect(result.hasHelp).toBe(true);
    });

    it('should ignore data chunks after kill signal', async () => {
      // Use real timers for this test
      vi.useRealTimers();

      let closeCallback: ((code: number | null) => void) | undefined;

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
            closeCallback = callback;
            setTimeout(() => callback(0), 12000);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = executeCliHelp();
      const result = await resultPromise;

      // Restore fake timers
      vi.useFakeTimers();

      // Should have timed out and ignored late data
      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    }, 20000);

    it('should handle case-insensitive section matching', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `usage: prp-pipeline [options]

OPTIONS:
  -h, --help
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });

    it('should handle whitespace in output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: `   Usage: prp-pipeline [options]

   Options:
`,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = executeCliHelp();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.hasHelp).toBe(true);
    });
  });
});
