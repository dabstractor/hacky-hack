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

// Mock groundswell-verifier module
vi.mock('../../../src/utils/groundswell-verifier.js', () => ({
  verifyGroundswellExists: vi.fn(),
}));

// Import mocked modules
import { spawn } from 'node:child_process';
import { verifyGroundswellExists } from '../../../src/utils/groundswell-verifier.js';
import {
  linkGroundswell,
  type GroundswellLinkResult,
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
