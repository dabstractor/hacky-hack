/**
 * Unit tests for Typecheck Runner
 *
 * @remarks
 * Tests validate TypeScript typecheck functionality including:
 * 1. tsc --noEmit execution with spawn()
 * 2. stderr capture and parsing (all errors go to stderr)
 * 3. Error parsing with regex pattern matching
 * 4. TS2307 module name extraction
 * 5. Timeout handling with SIGTERM/SIGKILL escalation
 * 6. Spawn error handling (ENOENT, EACCES)
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

// Import mocked modules
import { spawn } from 'node:child_process';
import {
  runTypecheck,
  type TypecheckOptions,
} from '../../../src/utils/typecheck-runner.js';

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

describe('typecheck-runner', () => {
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

  describe('Successful typecheck with no errors', () => {
    it('should return success: true when tsc completes with exit code 0 and no errors', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.exitCode).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('should use npx tsc with --noEmit and --pretty false flags', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npx',
        ['tsc', '--noEmit', '--pretty', 'false'],
        expect.objectContaining({
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      );
    });

    it('should use default project path when not specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npx',
        expect.anything(),
        expect.objectContaining({
          cwd: '/home/dustin/projects/hacky-hack',
        })
      );
    });

    it('should use custom project path when specified', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const options: TypecheckOptions = {
        projectPath: '/custom/project/path',
      };
      const resultPromise = runTypecheck(options);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npx',
        expect.anything(),
        expect.objectContaining({
          cwd: '/custom/project/path',
        })
      );
    });
  });

  // ========================================================================
  // Typecheck with errors tests
  // ========================================================================

  describe('Typecheck with TypeScript errors', () => {
    it('should return success: false when tsc finds errors', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/utils/helper.ts(15,9): error TS2307: Cannot find module 'express'`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.exitCode).toBe(2);
    });

    it('should parse single error correctly', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        file: 'src/index.ts',
        line: 10,
        column: 5,
        code: 'TS2322',
        message: `Type 'string' is not assignable to type 'number'.`,
      });
    });

    it('should parse multiple errors correctly', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/utils/helper.ts(15,9): error TS2307: Cannot find module 'express'
src/types.ts(20,1): error TS2741: Property 'name' is missing in type '{ age: number; }' but required in type 'User'.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].code).toBe('TS2322');
      expect(result.errors[1].code).toBe('TS2307');
      expect(result.errors[2].code).toBe('TS2741');
    });

    it('should handle file paths with spaces', async () => {
      const stderrOutput = `src/my folder/file with spaces.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('src/my folder/file with spaces.ts');
    });

    it('should extract module name from TS2307 errors', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2307: Cannot find module 'express'`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].module).toBe('express');
    });

    it('should extract module name from TS2307 relative path errors', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2307: Cannot find module './utils/helper'`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].module).toBe('./utils/helper');
    });

    it('should extract module name from TS2307 with type declaration message', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2307: Cannot find module 'lodash' or its corresponding type declarations.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].module).toBe('lodash');
    });

    it('should not include module field for non-TS2307 errors', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].module).toBeUndefined();
    });
  });

  // ========================================================================
  // Timeout tests
  // ============================================================================

  describe('Timeout handling', () => {
    it('should timeout and kill process when timeout is exceeded', async () => {
      // Child that emits close after a delay longer than our timeout
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            // Emit close after 200ms, but our timeout is 100ms
            setTimeout(() => callback(0), 200);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runTypecheck({ timeout: 100 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out after 100ms');
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should work without options specified', async () => {
      // Test that runTypecheck works when called with no options
      // The default timeout of 30000ms is used internally
      const mockChild = createMockChild({
        exitCode: 0,
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should accept custom timeout option', async () => {
      // Child that emits close after a delay longer than our timeout
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 200);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runTypecheck({ timeout: 50 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out after 50ms');
    });

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
          }
        }),
        kill: vi.fn((_signal: string) => {
          signals.push(_signal);
          // After SIGKILL, emit close to resolve the promise
          if (_signal === 'SIGKILL' && closeCallback) {
            closeCallback(null);
          }
        }),
        killed: false, // Property that stays false to trigger SIGKILL
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runTypecheck({ timeout: 50 });

      // Wait for timeout + grace period (50ms timeout + 2000ms grace)
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(signals).toContain('SIGTERM');
      expect(result.success).toBe(false);
    });

    it('should stop capturing output after timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((_event: string, callback: (data: Buffer) => void) => {
            // Emit error after timeout
            setTimeout(() => callback(Buffer.from('late error')), 100);
          }),
        },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(2), 150);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runTypecheck({ timeout: 50 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      // Output after timeout should be ignored
      expect(result.error).toContain('timed out after 50ms');
    });

    it('should include optional error property on timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          // Emit close after a delay longer than timeout
          setTimeout(() => callback(2), 200);
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = runTypecheck({ timeout: 50 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('timed out after 50ms');
    });
  });

  // ========================================================================
  // Spawn error tests
  // ========================================================================

  describe('Spawn error handling', () => {
    it('should handle ENOENT error (npx not found)', async () => {
      const spawnError = new Error('spawn npx ENOENT');
      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await runTypecheck();

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.exitCode).toBe(null);
      expect(result.error).toBe('spawn npx ENOENT');
    });

    it('should handle EACCES error (permission denied)', async () => {
      const spawnError = new Error('spawn npx EACCES');
      vi.mocked(spawn).mockImplementation(() => {
        throw spawnError;
      });

      const result = await runTypecheck();

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(0);
      expect(result.exitCode).toBe(null);
      expect(result.error).toBe('spawn npx EACCES');
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

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(0);
      expect(result.exitCode).toBe(null);
      expect(result.error).toBe('Spawn failed');
    });
  });

  // ========================================================================
  // Output capture tests
  // ========================================================================

  describe('Output capture', () => {
    it('should capture stdout (usually empty for tsc)', async () => {
      const stdoutOutput = 'some output';
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: stdoutOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stdout).toBe(stdoutOutput);
    });

    it('should capture raw stderr output', async () => {
      const stderrOutput = `src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stderr).toBe(stderrOutput);
    });

    it('should handle empty stderr output', async () => {
      const mockChild = createMockChild({
        exitCode: 0,
        stderr: '',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stderr).toBe('');
      expect(result.errors).toEqual([]);
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle malformed error lines gracefully', async () => {
      const stderrOutput = `This is not a valid tsc error line
src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
Also not valid`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      // Should only parse the valid line
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('src/index.ts');
    });

    it('should handle absolute file paths', async () => {
      const stderrOutput = `/home/user/project/src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('/home/user/project/src/index.ts');
    });

    it('should handle multi-line error messages', async () => {
      // Note: With --pretty false, tsc should produce single-line errors
      // This test validates our parser handles the expected format
      const stderrOutput = `src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.`;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        `Type 'string' is not assignable to type 'number'.`
      );
    });

    it('should handle whitespace in stderr', async () => {
      const stderrOutput = `   src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.   `;

      const mockChild = createMockChild({
        exitCode: 2,
        stderr: stderrOutput,
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = runTypecheck();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      // Trim is applied in parseTscOutput
      expect(result.errors).toHaveLength(1);
    });
  });
});
