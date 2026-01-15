/**
 * Unit tests for build-logger utility
 *
 * @remarks
 * Tests validate build log documentation functionality including:
 * - Early return when verification failed (resolved: false)
 * - Git commit hash retrieval using simple-git
 * - BUILD_LOG.md creation with proper markdown table format
 * - Append functionality for incremental logging
 * - Error handling for git and file I/O failures
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock file system operations with hoisted variables and shared state
const fileSystemState = new Map<string, string>();

const { mockReadFile, mockWriteFile, mockAccess } = vi.hoisted(() => ({
  mockReadFile: vi.fn((path: string) =>
    Promise.resolve(fileSystemState.get(path) ?? '')
  ),
  mockWriteFile: vi.fn((path: string, content: string, _options?: unknown) => {
    fileSystemState.set(path, content);
    return Promise.resolve(undefined);
  }),
  mockAccess: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
  access: mockAccess,
}));

// Mock simple-git with hoisted variables
const { mockRevparse, mockSimpleGit } = vi.hoisted(() => ({
  mockRevparse: vi.fn(),
  mockSimpleGit: vi.fn(() => ({
    revparse: mockRevparse,
  })),
}));

vi.mock('simple-git', () => ({
  simpleGit: mockSimpleGit,
  GitError: class GitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'GitError';
    }
  },
}));

// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

import { documentBuildSuccess } from '../../../src/utils/build-logger.js';

describe('utils/build-logger', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    fileSystemState.clear();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    // Reset mock implementations to default behavior
    mockReadFile.mockImplementation((path: string) =>
      Promise.resolve(fileSystemState.get(path) ?? '')
    );
    mockWriteFile.mockImplementation(
      (path: string, content: string, _options?: unknown) => {
        fileSystemState.set(path, content);
        return Promise.resolve(undefined);
      }
    );
    mockAccess.mockImplementation(() => Promise.resolve(undefined));
  });

  // ==========================================================================
  // Early return tests
  // ==========================================================================

  describe('Early return when resolved is false', () => {
    it('should return early with logged: false when verification.resolved is false', async () => {
      // SETUP
      const failedVerification = {
        resolved: false,
        remainingCount: 5,
        verifiedFiles: [],
        importCount: 0,
        message: 'Found 5 module-not-found error(s) - milestone incomplete.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(failedVerification);

      // VERIFY
      expect(result.logged).toBe(false);
      expect(result.path).toBe('');
      expect(result.message).toContain(
        'Skipping build log - module resolution not verified'
      );
      expect(result.message).toContain(failedVerification.message);

      // No file operations should have been attempted
      expect(mockAccess).not.toHaveBeenCalled();
      expect(mockReadFile).not.toHaveBeenCalled();
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockRevparse).not.toHaveBeenCalled();
    });

    it('should log info message when early return occurs', async () => {
      // SETUP
      const failedVerification = {
        resolved: false,
        remainingCount: 3,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'Module resolution not verified.',
      };

      // EXECUTE
      await documentBuildSuccess(failedVerification);

      // VERIFY
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Skipping build log')
      );
    });
  });

  // ==========================================================================
  // Git hash retrieval tests
  // ==========================================================================

  describe('Git commit hash retrieval', () => {
    it('should retrieve git commit hash using simple-git', async () => {
      // SETUP
      const mockHash = 'abc123def4567890123456789012345678901234';
      mockRevparse.mockResolvedValue(mockHash);
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      }); // File doesn't exist

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/workflows/prp-pipeline.ts'],
        importCount: 1,
        message: 'No module-not-found errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(mockSimpleGit).toHaveBeenCalled();
      expect(mockRevparse).toHaveBeenCalledWith(['HEAD']);
    });

    it('should handle git repository errors gracefully', async () => {
      // SETUP
      const { GitError } = await import('simple-git');
      const gitError = new GitError('Not a git repository');
      mockRevparse.mockRejectedValue(gitError);
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Git error retrieving commit hash')
      );
      // Should still create the log entry with N/A for commit hash
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should handle non-git repositories by using null hash', async () => {
      // SETUP
      mockRevparse.mockRejectedValue(new Error('Not in git repo'));
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result.logged).toBe(true);
      expect(mockWriteFile).toHaveBeenCalled();
      // The written content should have 'N/A' for commit hash
      const writeCalls = mockWriteFile.mock.calls;
      const appendCall = writeCalls.find(
        call => call[2] === 'utf-8' && call[0].includes('BUILD_LOG')
      );
      expect(appendCall).toBeDefined();
    });
  });

  // ==========================================================================
  // BUILD_LOG.md creation tests
  // ==========================================================================

  describe('BUILD_LOG.md creation', () => {
    it('should create BUILD_LOG.md with header when file does not exist', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      }); // File doesn't exist

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No module-not-found errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result.logged).toBe(true);
      expect(result.path).toContain('BUILD_LOG.md');
      expect(mockWriteFile).toHaveBeenCalled();

      // First write should be the header
      const headerCall = mockWriteFile.mock.calls[0];
      expect(headerCall[1]).toContain('# TypeScript Compilation Build Log');
      expect(headerCall[1]).toContain(
        '| Timestamp | Commit Hash | Result | Remaining Errors | Notes |'
      );
    });

    it('should include proper markdown table header in new file', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      await documentBuildSuccess(successfulVerification);

      // VERIFY
      const headerContent = mockWriteFile.mock.calls[0][1];
      expect(headerContent).toContain(
        '| Timestamp | Commit Hash | Result | Remaining Errors | Notes |'
      );
      expect(headerContent).toContain(
        '|-----------|-------------|--------|------------------|-------|'
      );
    });
  });

  // ==========================================================================
  // Append to existing BUILD_LOG.md tests
  // ==========================================================================

  describe('Append to existing BUILD_LOG.md', () => {
    it('should append new entry to existing BUILD_LOG.md', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('def456');
      mockAccess.mockImplementation(() => Promise.resolve(undefined)); // File exists

      const existingContent = `# TypeScript Compilation Build Log

| Timestamp | Commit Hash | Result | Remaining Errors | Notes |
|-----------|-------------|--------|------------------|-------|
| 2026-01-13T10:00:00.000Z | abc123... | SUCCESS | 0 | First entry |
`;
      mockReadFile.mockResolvedValue(existingContent);

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result.logged).toBe(true);
      expect(mockReadFile).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();

      // Check that new entry was appended
      const writeCall =
        mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain(
        '| 2026-01-13T10:00:00.000Z | abc123... | SUCCESS | 0 | First entry |'
      );
      expect(writtenContent).toContain('| 2026-'); // New entry with timestamp
    });

    it('should preserve existing entries when appending', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('newhash');
      mockAccess.mockResolvedValue(undefined);

      const existingContent = `# TypeScript Compilation Build Log

| Timestamp | Commit Hash | Result | Remaining Errors | Notes |
|-----------|-------------|--------|------------------|-------|
| 2026-01-13T10:00:00.000Z | oldhash | SUCCESS | 0 | Old entry |
`;
      mockReadFile.mockResolvedValue(existingContent);

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'New entry',
      };

      // EXECUTE
      await documentBuildSuccess(successfulVerification);

      // VERIFY
      const writeCall =
        mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain('Old entry');
      expect(writtenContent).toContain('New entry');
    });
  });

  // ==========================================================================
  // Result structure tests
  // ==========================================================================

  describe('BuildLogResult structure', () => {
    it('should return BuildLogResult with correct fields when successful', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });
      mockReadFile.mockResolvedValue('');

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result).toHaveProperty('logged');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('message');
      expect(result.logged).toBe(true);
      expect(typeof result.path).toBe('string');
      expect(typeof result.message).toBe('string');
    });

    it('should return descriptive message on success', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });
      mockReadFile.mockResolvedValue('');

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result.message).toContain('Build log entry created at');
      expect(result.message).toContain('BUILD_LOG.md');
    });
  });

  // ==========================================================================
  // Error handling tests
  // ==========================================================================

  describe('Error handling', () => {
    it('should handle writeFile errors gracefully', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result.logged).toBe(false);
      expect(result.path).toBe('');
      expect(result.message).toContain('Failed to create build log entry');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle readFile errors gracefully', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(() => Promise.resolve(undefined)); // File exists
      mockReadFile.mockRejectedValue(new Error('Read error'));

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result.logged).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should use correct BUILD_LOG.md path in plan directory', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(successfulVerification);

      // VERIFY
      expect(result.logged).toBe(true);
      expect(result.message).toContain('Build log entry created');
      expect(result.path).toContain(
        'plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/BUILD_LOG.md'
      );
    });
  });

  // ==========================================================================
  // formatLogEntry tests (via integration)
  // ==========================================================================

  describe('Markdown table format', () => {
    it('should format entry as proper markdown table row with N/A for null hash', async () => {
      // SETUP
      mockRevparse.mockRejectedValue(new Error('Git error'));
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      await documentBuildSuccess(successfulVerification);

      // VERIFY
      const writeCall =
        mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1];
      const writtenContent = writeCall[1];
      // Should have N/A for commit hash when git fails
      expect(writtenContent).toContain('| N/A |');
    });

    it('should include verification message in notes column', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'Verified 2/3 critical files have Groundswell imports.',
      };

      // EXECUTE
      await documentBuildSuccess(successfulVerification);

      // VERIFY
      const writeCall =
        mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain(
        'Verified 2/3 critical files have Groundswell imports.'
      );
    });
  });

  // ==========================================================================
  // Timestamp format tests
  // ==========================================================================

  describe('Timestamp format', () => {
    it('should use ISO 8601 timestamp format', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const successfulVerification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      await documentBuildSuccess(successfulVerification);

      // VERIFY
      const writeCall =
        mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1];
      const writtenContent = writeCall[1];
      // ISO 8601 format: 2026-01-14T12:34:56.789Z
      const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
      expect(writtenContent).toMatch(isoPattern);
    });
  });

  // ==========================================================================
  // Integration with ModuleErrorVerifyResult tests
  // ==========================================================================

  describe('Integration with ModuleErrorVerifyResult', () => {
    it('should consume ModuleErrorVerifyResult correctly', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const verification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: [
          'src/workflows/prp-pipeline.ts',
          'src/agents/agent-factory.ts',
        ],
        importCount: 2,
        message:
          'No module-not-found errors found. Verified 2/3 critical files have Groundswell imports.',
      };

      // EXECUTE
      const result = await documentBuildSuccess(verification);

      // VERIFY
      expect(result.logged).toBe(true);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should include remainingCount in the log entry', async () => {
      // SETUP
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const verification = {
        resolved: true,
        remainingCount: 0,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'No errors found.',
      };

      // EXECUTE
      await documentBuildSuccess(verification);

      // VERIFY
      const writeCall =
        mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain('| 0 |'); // remainingCount is 0
    });

    it('should handle non-zero remainingCount', async () => {
      // SETUP - In some cases, remainingCount might be > 0 even when resolved is true
      mockRevparse.mockResolvedValue('abc123');
      mockAccess.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const verification = {
        resolved: true,
        remainingCount: 2,
        verifiedFiles: ['src/test.ts'],
        importCount: 1,
        message: 'Some errors remain but module resolution verified.',
      };

      // EXECUTE
      await documentBuildSuccess(verification);

      // VERIFY
      const writeCall =
        mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain('| 2 |'); // remainingCount is 2
    });
  });
});
