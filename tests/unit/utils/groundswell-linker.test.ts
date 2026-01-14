/**
 * Unit tests for Groundswell Linker
 *
 * @remarks
 * Tests validate npm link functionality including:
 * 1. Input validation using verifyGroundswellExists()
 * 2. npm link execution with spawn()
 * 3. stdout/stderr capture and return
 * 4. Exit code handling and timeout scenarios
 * 5. Error handling for spawn failures
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

// Mock node:fs/promises for symlink verification
vi.mock('node:fs/promises', () => ({
  lstat: vi.fn(),
  readlink: vi.fn(),
}));

// Mock groundswell-verifier module
vi.mock('../../../src/utils/groundswell-verifier.js', () => ({
  verifyGroundswellExists: vi.fn(),
}));

// Import mocked modules
import { spawn } from 'node:child_process';
import { lstat, readlink } from 'node:fs/promises';
import { verifyGroundswellExists } from '../../../src/utils/groundswell-verifier.js';
import {
  linkGroundswell,
  linkGroundswellLocally,
  type GroundswellLinkResult,
  type GroundswellLocalLinkResult,
} from '../../../src/utils/groundswell-linker.js';

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
  const { exitCode = 0, stdout = 'linked groundswell', stderr = '' } = options;

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
        // Simulate async close
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('linkGroundswell', () => {
  const mockHomeDir = '/home/testuser';
  const mockGroundswellPath = `${mockHomeDir}/projects/groundswell`;

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

  describe('Successful npm link', () => {
    it('should return success: true when npm link completes with exit code 0', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'linked groundswell in /usr/local/lib/node_modules',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain('Successfully linked');
      expect(result.stdout).toContain('linked groundswell');
    });

    it('should use default timeout of 30000ms when no options provided', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith('npm', ['link'], {
        cwd: mockGroundswellPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
    });

    it('should accept custom timeout option', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell({ timeout: 60000 });
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith('npm', ['link'], expect.anything());
    });

    it('should capture stdout from npm link command', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({
        stdout: 'audited 1 package\nlinked groundswell',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stdout).toContain('audited 1 package');
      expect(result.stdout).toContain('linked groundswell');
    });

    it('should capture stderr from npm link command', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'linked',
        stderr: 'npm notice',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stderr).toContain('npm notice');
    });
  });

  // ========================================================================
  // Input validation tests
  // ========================================================================

  describe('Input validation', () => {
    it('should throw error if Groundswell directory does not exist', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: false,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell directory not found at ${mockGroundswellPath}`,
      });

      await expect(linkGroundswell()).rejects.toThrow('Cannot create npm link');
      await expect(linkGroundswell()).rejects.toThrow('not found');
    });

    it('should include verification message in thrown error when directory does not exist', async () => {
      const customMessage = 'Custom verification message';
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: false,
        path: mockGroundswellPath,
        missingFiles: [],
        message: customMessage,
      });

      await expect(linkGroundswell()).rejects.toThrow(customMessage);
    });

    it('should throw error if required files are missing', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: ['package.json'],
        message: 'Missing package.json',
      });

      await expect(linkGroundswell()).rejects.toThrow('missing required files');
      await expect(linkGroundswell()).rejects.toThrow('package.json');
    });

    it('should include all missing files in thrown error', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: ['package.json', 'entry point'],
        message: 'Missing multiple files',
      });

      await expect(linkGroundswell()).rejects.toThrow('package.json');
      await expect(linkGroundswell()).rejects.toThrow('entry point');
    });

    it('should call verifyGroundswellExists() for input validation', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(verifyGroundswellExists).toHaveBeenCalledTimes(1);
    });

    it('should use Groundswell path from verification result', async () => {
      const customPath = '/custom/path/to/groundswell';
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: customPath,
        missingFiles: [],
        message: `Groundswell verified at ${customPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith('npm', ['link'], {
        cwd: customPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
    });
  });

  // ========================================================================
  // npm link command failure tests
  // ========================================================================

  describe('npm link command failures', () => {
    it('should return success: false when npm link exits with non-zero code', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({
        exitCode: 1,
        stdout: '',
        stderr: 'npm ERR! code EACCES',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('EACCES');
      expect(result.message).toContain('failed with exit code 1');
    });

    it('should capture stderr on npm link failure', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({
        exitCode: 1,
        stdout: '',
        stderr: 'npm ERR! code EEXIST\nnpm ERR! link already exists',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stderr).toContain('EEXIST');
      expect(result.stderr).toContain('link already exists');
    });

    it('should include exit code in error message when non-zero', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({ exitCode: 127 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(127);
      expect(result.message).toContain('exit code 127');
    });

    it('should return success: false when exit code is null', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({ exitCode: null });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.message).toContain('npm link failed');
    });
  });

  // ========================================================================
  // Spawn error handling tests
  // ========================================================================

  describe('Spawn error handling', () => {
    it('should return success: false when spawn throws synchronous error', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('ENOENT: npm command not found');
      });

      const result = await linkGroundswell();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain('npm command not found');
      expect(result.message).toContain('Failed to spawn');
    });

    it('should handle spawn error with error message', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const errorMessage = 'EACCES: permission denied';
      vi.mocked(spawn).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const result = await linkGroundswell();

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle non-Error spawn errors', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      vi.mocked(spawn).mockImplementation(() => {
        throw 'string error';
      });

      const result = await linkGroundswell();

      expect(result.success).toBe(false);
      expect(result.error).toBe('string error');
    });

    it('should return empty stdout/stderr on spawn error', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      const result = await linkGroundswell();

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    });
  });

  // ========================================================================
  // Timeout handling tests
  // ========================================================================

  // These tests use real timers instead of fake timers
  describe('Timeout handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.useRealTimers(); // Override fake timers from outer beforeEach
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return success: false when command times out', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

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

      // Use a short timeout
      const result = await linkGroundswell({ timeout: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out after 100ms');
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should send SIGKILL if SIGTERM does not kill process', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

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

      const resultPromise = linkGroundswell({ timeout: 50 });

      // Wait for timeout + grace period (50ms timeout + 2000ms grace)
      await new Promise(resolve => setTimeout(resolve, 2100));

      const result = await resultPromise;

      expect(signals).toContain('SIGTERM');
      expect(signals).toContain('SIGKILL');
      expect(result.success).toBe(false);
    });

    it('should stop capturing output after timeout', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

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
          // Emit close after kill to resolve the promise
          if (closeCallback) {
            closeCallback(null);
          }
        }),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = linkGroundswell({ timeout: 50 });

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.stdout).toBe('');
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('GroundswellLinkResult structure', () => {
    it('should return complete GroundswellLinkResult object', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result: GroundswellLinkResult = await resultPromise;

      // Check result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('exitCode');

      // Check types
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');

      // exitCode can be number or null
      expect(
        result.exitCode === null || typeof result.exitCode === 'number'
      ).toBe(true);
    });

    it('should include success: true in result on successful link', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
    });

    it('should include success: false in result on failed link', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild({ exitCode: 1 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
    });

    it('should include descriptive message in result', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.message).toBeTruthy();
      expect(typeof result.message).toBe('string');
    });

    it('should include optional error property when spawn fails', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('Spawn error');
      });

      const result = await linkGroundswell();

      expect(result.error).toBe('Spawn error');
    });

    it('should include optional error property on timeout', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            // Emit close after a delay longer than timeout
            setTimeout(() => callback(0), 200);
          }
        }),
        kill: vi.fn(),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = linkGroundswell({ timeout: 50 });
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.error).toContain('timed out after 50ms');
    });

    it('should not include error property on successful link', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.error).toBeUndefined();
    });
  });

  // ========================================================================
  // Spawn arguments tests
  // ========================================================================

  describe('Spawn arguments', () => {
    it('should spawn npm with link command', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith('npm', ['link'], expect.anything());
    });

    it('should use shell: false to prevent injection', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();
      await resultPromise;

      const spawnOptions = vi.mocked(spawn).mock.calls[0]?.[2];
      expect(spawnOptions?.shell).toBe(false);
    });

    it('should use stdio ignore, pipe, pipe', async () => {
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();
      await resultPromise;

      const spawnOptions = vi.mocked(spawn).mock.calls[0]?.[2];
      expect(spawnOptions?.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    });

    it('should use cwd from verification result', async () => {
      const customPath = '/custom/groundswell/path';
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: customPath,
        missingFiles: [],
        message: `Groundswell verified at ${customPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith('npm', ['link'], {
        cwd: customPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
    });
  });

  // ========================================================================
  // Integration tests
  // ========================================================================

  describe('Integration', () => {
    it('should support full workflow: verify then link', async () => {
      // Full workflow: first verify, then link based on result
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: true,
        path: mockGroundswellPath,
        missingFiles: [],
        message: `Groundswell verified at ${mockGroundswellPath}`,
      });

      const mockChild = createMockChild();
      vi.mocked(spawn).mockReturnValue(mockChild);

      // First verify
      const verification = verifyGroundswellExists();
      expect(verification.exists).toBe(true);
      expect(verification.missingFiles).toHaveLength(0);

      // Then link (should succeed)
      const resultPromise = linkGroundswell();
      await vi.runAllTimersAsync();

      const linkResult = await resultPromise;
      expect(linkResult.success).toBe(true);
    });

    it('should fail fast if verification fails', async () => {
      // Verification fails - should not attempt spawn
      vi.mocked(verifyGroundswellExists).mockReturnValue({
        exists: false,
        path: mockGroundswellPath,
        missingFiles: [],
        message: 'Groundswell not found',
      });

      await expect(linkGroundswell()).rejects.toThrow();

      // Spawn should never be called
      expect(spawn).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// TEST SUITE: linkGroundswellLocally
// ============================================================================

describe('linkGroundswellLocally', () => {
  const mockProjectPath = '/home/dustin/projects/hacky-hack';
  const mockSymlinkPath = `${mockProjectPath}/node_modules/groundswell`;
  const mockGlobalLinkPath = '/usr/local/lib/node_modules/groundswell';

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

  describe('Successful npm link groundswell', () => {
    it('should return success: true when npm link groundswell completes with symlink verification', async () => {
      // S2 result - successful global link
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Successfully linked Groundswell at /path/to/groundswell',
        stdout: 'linked',
        stderr: '',
        exitCode: 0,
      };

      // Mock symlink verification
      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      // Mock successful npm link groundswell
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'linked groundswell in project',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result: GroundswellLocalLinkResult = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain(
        'Successfully linked groundswell in project'
      );
      expect(result.symlinkPath).toBe(mockSymlinkPath);
      expect(result.symlinkTarget).toBe(mockGlobalLinkPath);
    });

    it('should include symlinkTarget in result when verification succeeds', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const customTarget = '/custom/global/link/path';
      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(customTarget);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.symlinkTarget).toBe(customTarget);
    });

    it('should use default project path when no options provided', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith('npm', ['link', 'groundswell'], {
        cwd: '/home/dustin/projects/hacky-hack',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
    });

    it('should use custom project path from options', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const customProjectPath = '/custom/project/path';
      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult, {
        projectPath: customProjectPath,
      });
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith('npm', ['link', 'groundswell'], {
        cwd: customProjectPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
    });

    it('should capture stdout from npm link groundswell command', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({
        stdout: 'audited 1 package\nlinked groundswell locally',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stdout).toContain('audited 1 package');
      expect(result.stdout).toContain('linked groundswell locally');
    });

    it('should capture stderr from npm link groundswell command', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'linked',
        stderr: 'npm notice',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.stderr).toContain('npm notice');
    });
  });

  // ========================================================================
  // Conditional skip tests (input validation based on S2 result)
  // ========================================================================

  describe('Conditional skip based on S2 result', () => {
    it('should skip execution when previousResult.success is false', async () => {
      const previousResult: GroundswellLinkResult = {
        success: false,
        message: 'npm link failed with exit code 1',
        stdout: '',
        stderr: 'npm ERR!',
        exitCode: 1,
      };

      const result = await linkGroundswellLocally(previousResult);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Skipped: Global npm link failed');
      expect(result.message).toContain('npm link failed with exit code 1');
      expect(result.exitCode).toBe(null);
    });

    it('should not call spawn when skipping due to S2 failure', async () => {
      const previousResult: GroundswellLinkResult = {
        success: false,
        message: 'Global link failed',
        stdout: '',
        stderr: '',
        exitCode: 1,
      };

      await linkGroundswellLocally(previousResult);

      expect(spawn).not.toHaveBeenCalled();
    });

    it('should include previousResult.message in skip message', async () => {
      const customMessage = 'Custom failure message from S2';
      const previousResult: GroundswellLinkResult = {
        success: false,
        message: customMessage,
        stdout: '',
        stderr: '',
        exitCode: 127,
      };

      const result = await linkGroundswellLocally(previousResult);

      expect(result.message).toContain(customMessage);
    });

    it('should return correct symlinkPath even when skipping', async () => {
      const previousResult: GroundswellLinkResult = {
        success: false,
        message: 'Failed',
        stdout: '',
        stderr: '',
        exitCode: 1,
      };

      const result = await linkGroundswellLocally(previousResult);

      expect(result.symlinkPath).toContain('node_modules/groundswell');
    });
  });

  // ========================================================================
  // Spawn error handling tests
  // ========================================================================

  describe('Spawn error handling', () => {
    it('should return success: false when spawn throws synchronous error', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('ENOENT: npm command not found');
      });

      const result = await linkGroundswellLocally(previousResult);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain('npm command not found');
      expect(result.message).toContain('Failed to spawn');
    });

    it('should handle ENOENT (npm not found)', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('ENOENT: npm command not found');
      });

      const result = await linkGroundswellLocally(previousResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENOENT');
    });

    it('should handle EACCES (permission denied)', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const errorMessage = 'EACCES: permission denied';
      vi.mocked(spawn).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const result = await linkGroundswellLocally(previousResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should return empty stdout/stderr on spawn error', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      const result = await linkGroundswellLocally(previousResult);

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    });
  });

  // ========================================================================
  // Symlink verification tests
  // ========================================================================

  describe('Symlink verification', () => {
    it('should return success: false when symlink not created (ENOENT)', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      // npm link succeeds but symlink not found
      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      vi.mocked(lstat).mockRejectedValue({
        code: 'ENOENT',
        message: 'no such file or directory',
      } as NodeJS.ErrnoException);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('ENOENT');
      expect(result.message).toContain('symlink verification failed');
    });

    it('should return success: false when path exists but is not a symlink', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      // Path exists but is not a symlink
      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => false,
      } as ReturnType<typeof lstat>);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.message).toContain('path is not a symlink');
      expect(result.error).toBe('Path exists but is not a symbolic link');
    });

    it('should return symlinkTarget when verification succeeds', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const expectedTarget = '/expected/global/link/path';
      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(expectedTarget);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.symlinkTarget).toBe(expectedTarget);
    });

    it('should call lstat with correct symlink path', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(lstat).toHaveBeenCalledWith(
        '/home/dustin/projects/hacky-hack/node_modules/groundswell'
      );
    });

    it('should call readlink after lstat confirms symlink', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(readlink).toHaveBeenCalledWith(
        '/home/dustin/projects/hacky-hack/node_modules/groundswell'
      );
    });
  });

  // ========================================================================
  // Timeout handling tests
  // ========================================================================

  describe('Timeout handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.useRealTimers(); // Override fake timers from outer beforeEach
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it(
      'should return success: false when command times out',
      async () => {
        const previousResult: GroundswellLinkResult = {
          success: true,
          message: 'Global link succeeded',
          stdout: '',
          stderr: '',
          exitCode: 0,
        };

        let closeCallback: ((code: number | null) => void) | undefined;

        // Child that emits close when killed
        const mockChild = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: vi.fn((event: string, callback: (code: number | null) => void) => {
            if (event === 'close') {
              closeCallback = callback;
            }
          }),
          kill: vi.fn((_signal: string) => {
            // Emit close after kill to resolve the promise
            if (closeCallback !== undefined) {
              closeCallback(null);
            }
          }),
          killed: false,
        };

        vi.mocked(spawn).mockReturnValue(mockChild as never);

        // Use a short timeout
        const result = await linkGroundswellLocally(previousResult, {
          timeout: 100,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('timed out after 100ms');
        expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
      },
      { timeout: 10000 }
    );

    it('should send SIGKILL if SIGTERM does not kill process', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      // Track signals received
      const signals: string[] = [];

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn((_signal: string) => {
          signals.push(_signal);
          // After SIGKILL, emit close to resolve the promise
          if (_signal === 'SIGKILL') {
            const closeCallback = mockChild.on.mock.calls.find(
              c => c[0] === 'close'
            )?.[1];
            if (closeCallback !== undefined) closeCallback(null);
          }
        }),
        killed: false, // Property that stays false to trigger SIGKILL
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = linkGroundswellLocally(previousResult, {
        timeout: 50,
      });

      // Wait for timeout + grace period (50ms timeout + 2000ms grace)
      await new Promise(resolve => {
        setTimeout(resolve, 2100);
      });

      const result = await resultPromise;

      expect(signals).toContain('SIGTERM');
      expect(signals).toContain('SIGKILL');
      expect(result.success).toBe(false);
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('GroundswellLocalLinkResult structure', () => {
    it('should return complete GroundswellLocalLinkResult object', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result: GroundswellLocalLinkResult = await resultPromise;

      // Check result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('symlinkPath');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('exitCode');

      // Check types
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(typeof result.symlinkPath).toBe('string');
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');

      // exitCode can be number or null
      expect(
        result.exitCode === null || typeof result.exitCode === 'number'
      ).toBe(true);
    });

    it('should include symlinkTarget when verification succeeds', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.symlinkTarget).toBeDefined();
      expect(result.symlinkTarget).toBe(mockGlobalLinkPath);
    });

    it('should not include symlinkTarget when verification fails', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      vi.mocked(lstat).mockRejectedValue({
        code: 'ENOENT',
        message: 'not found',
      } as NodeJS.ErrnoException);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.symlinkTarget).toBeUndefined();
    });

    it('should include optional error property when verification fails', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      vi.mocked(lstat).mockRejectedValue({
        code: 'ENOENT',
        message: 'not found',
      } as NodeJS.ErrnoException);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.error).toBe('ENOENT');
    });

    it('should not include error property on successful link', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.error).toBeUndefined();
    });
  });

  // ========================================================================
  // Spawn arguments tests
  // ========================================================================

  describe('Spawn arguments', () => {
    it('should spawn npm with link groundswell command', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['link', 'groundswell'],
        expect.anything()
      );
    });

    it('should use shell: false to prevent injection', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();
      await resultPromise;

      const spawnOptions = vi.mocked(spawn).mock.calls[0]?.[2];
      expect(spawnOptions?.shell).toBe(false);
    });

    it('should use stdio ignore, pipe, pipe', async () => {
      const previousResult: GroundswellLinkResult = {
        success: true,
        message: 'Global link succeeded',
        stdout: '',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(previousResult);
      await vi.runAllTimersAsync();
      await resultPromise;

      const spawnOptions = vi.mocked(spawn).mock.calls[0]?.[2];
      expect(spawnOptions?.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    });
  });

  // ========================================================================
  // Integration tests
  // ========================================================================

  describe('Integration with linkGroundswell', () => {
    it('should support full workflow: global link then local link', async () => {
      // First, S2 succeeds
      const globalResult: GroundswellLinkResult = {
        success: true,
        message: 'Successfully linked Groundswell at /path/to/groundswell',
        stdout: 'linked globally',
        stderr: '',
        exitCode: 0,
      };

      // Then S3 (local link) should proceed
      vi.mocked(lstat).mockResolvedValue({
        isSymbolicLink: () => true,
      } as ReturnType<typeof lstat>);

      vi.mocked(readlink).mockResolvedValue(mockGlobalLinkPath);

      const mockChild = createMockChild({ exitCode: 0 });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = linkGroundswellLocally(globalResult);
      await vi.runAllTimersAsync();

      const localResult = await resultPromise;

      expect(localResult.success).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['link', 'groundswell'],
        expect.anything()
      );
    });

    it('should fail fast if global link failed', async () => {
      // Global link failed
      const globalResult: GroundswellLinkResult = {
        success: false,
        message: 'npm link failed with exit code 1',
        stdout: '',
        stderr: 'npm ERR!',
        exitCode: 1,
      };

      // Local link should skip without calling spawn
      const result = await linkGroundswellLocally(globalResult);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Skipped');
      expect(spawn).not.toHaveBeenCalled();
    });
  });
});
