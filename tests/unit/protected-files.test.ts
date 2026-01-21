/**
 * Unit tests for Protected Files Enforcement
 *
 * @remarks
 * Tests validate that protected files are never modified by agents, covering:
 * - Git commit filtering (tasks.json, PRD.md, prd_snapshot.md, delta_prd.md, delta_from.txt, TEST_RESULTS.md)
 * - Filesystem-level protection (deletion, movement)
 * - Agent forbidden operations (PRD.md modification, .gitignore manipulation)
 * - Wildcard pattern matching (*tasks*.json)
 *
 * Tests expose implementation gaps where protected files are not currently enforced.
 * Some tests will fail until the protected files list and enforcement are updated.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/utils/git-commit.ts | Git Commit Implementation}
 * @see {@link ../../plan/003_b3d3efdaf0ed/docs/system_context.md | Protected Files Specification}
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { basename } from 'node:path';

// Mock the GitMCP functions
vi.mock('../../src/tools/git-mcp.js', () => ({
  gitStatus: vi.fn(),
  gitAdd: vi.fn(),
  gitCommit: vi.fn(),
}));

// Mock node:fs/promises for filesystem operations
const { mockFsPromises } = vi.hoisted(() => ({
  mockFsPromises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    rename: vi.fn(),
  },
}));

vi.mock('node:fs/promises', () => mockFsPromises);

// Mock logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

import { gitStatus, gitAdd, gitCommit } from '../../src/tools/git-mcp.js';
import {
  filterProtectedFiles,
  smartCommit,
} from '../../src/utils/git-commit.js';

const mockGitStatus = vi.mocked(gitStatus);
const mockGitAdd = vi.mocked(gitAdd);
const mockGitCommit = vi.mocked(gitCommit);
const _mockUnlink = vi.mocked(mockFsPromises.unlink);
const _mockRename = vi.mocked(mockFsPromises.rename);

// ===== COMPLETE PROTECTED FILES SPECIFICATION =====

/**
 * Current protected files in git-commit.ts implementation
 */
const CURRENT_PROTECTED_FILES = [
  'tasks.json',
  'PRD.md',
  'prd_snapshot.md',
] as const;

/**
 * Additional protected files from system_context.md (NOT in current implementation)
 */
const ADDITIONAL_PROTECTED_FILES = [
  'delta_prd.md',
  'delta_from.txt',
  'TEST_RESULTS.md',
] as const;

/**
 * Complete protected files specification (union of current + additional)
 */
const ALL_PROTECTED_FILES = [
  ...CURRENT_PROTECTED_FILES,
  ...ADDITIONAL_PROTECTED_FILES,
] as const;

/**
 * Forbidden .gitignore patterns (from PRD §5.2)
 */
const FORBIDDEN_GITIGNORE_PATTERNS = [
  'plan/',
  'PRD.md',
  'tasks.json',
  '*tasks*.json',
] as const;

// ===== HELPER FUNCTIONS =====

/**
 * Checks if a file matches the wildcard pattern *tasks*.json
 *
 * @param filePath - File path to check
 * @returns true if basename matches /\btasks.*\.json$/ pattern
 *
 * @remarks
 * Uses regex pattern /\btasks.*\.json$/ which matches:
 * - "tasks.json" - word boundary + "tasks" + end + ".json"
 * - "backup-tasks.json" - word boundary before "tasks"
 * - "tasks.backup.json" - "tasks" + anything + ".json"
 *
 * Does NOT match:
 * - "task.json" (singular - no word boundary match)
 * - "mytasks.json" (no word boundary before "tasks")
 */
function isProtectedByWildcard(filePath: string): boolean {
  const fileName = basename(filePath);
  return /\btasks.*\.json$/.test(fileName);
}

/**
 * Checks if a file is protected (complete specification)
 *
 * @param filePath - File path to check
 * @returns true if file is in protected list or matches wildcard pattern
 *
 * @remarks
 * This helper implements the COMPLETE protected files specification
 * from system_context.md, including files not yet in the implementation.
 */
function isProtectedFile(filePath: string): boolean {
  // Normalize Windows-style paths to forward slashes for consistent basename handling
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = basename(normalizedPath);
  return (
    ALL_PROTECTED_FILES.includes(fileName as any) ||
    isProtectedByWildcard(normalizedPath)
  );
}

/**
 * Safe delete function with protected file checking
 *
 * @param filePath - File path to delete
 * @throws Error if file is protected
 *
 * @remarks
 * This is a test helper that demonstrates how protected file
 * enforcement SHOULD work for delete operations.
 */
async function safeDelete(filePath: string): Promise<void> {
  const fileName = basename(filePath);
  if (ALL_PROTECTED_FILES.includes(fileName as any)) {
    throw new Error(`Cannot delete protected file: ${fileName}`);
  }
  // Would call fs.unlink here in real implementation
  return Promise.resolve();
}

/**
 * Safe move function with protected file checking
 *
 * @param oldPath - Source file path
 * @param newPath - Destination file path
 * @throws Error if source file is protected
 *
 * @remarks
 * This is a test helper that demonstrates how protected file
 * enforcement SHOULD work for move operations.
 */
async function safeMove(oldPath: string, _newPath: string): Promise<void> {
  const oldBasename = basename(oldPath);
  if (ALL_PROTECTED_FILES.includes(oldBasename as any)) {
    throw new Error(`Cannot move protected file: ${oldBasename}`);
  }
  // Would call fs.rename here in real implementation
  return Promise.resolve();
}

/**
 * Validates .gitignore content for forbidden patterns
 *
 * @param content - .gitignore file content
 * @returns Object with valid flag and optional error message
 *
 * @remarks
 * Checks for forbidden patterns from PRD §5.2:
 * - plan/
 * - PRD.md
 * - tasks.json
 * - *tasks*.json
 */
function validateGitignore(content: string): {
  valid: boolean;
  error?: string;
} {
  const lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  for (const line of lines) {
    if (FORBIDDEN_GITIGNORE_PATTERNS.some(pattern => line.includes(pattern))) {
      return {
        valid: false,
        error: `Forbidden pattern in .gitignore: ${line}`,
      };
    }
  }

  return { valid: true };
}

// ===== TEST SUITE =====

describe('unit/protected-files > protected file enforcement', () => {
  beforeEach(() => {
    // SETUP: Clear all mocks
    vi.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
  });

  // ===== GIT COMMIT PROTECTION TESTS =====

  describe('git commit protection', () => {
    describe('current PROTECTED_FILES (in git-commit.ts)', () => {
      it('should filter tasks.json from commits', () => {
        // SETUP
        const files = ['src/index.ts', 'tasks.json', 'src/utils.ts'];

        // EXECUTE
        const result = filterProtectedFiles(files);

        // VERIFY
        expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
        expect(result).not.toContain('tasks.json');
      });

      it('should filter PRD.md from commits', () => {
        // SETUP
        const files = ['README.md', 'PRD.md', 'src/app.ts'];

        // EXECUTE
        const result = filterProtectedFiles(files);

        // VERIFY
        expect(result).not.toContain('PRD.md');
        expect(result).toContain('README.md');
        expect(result).toContain('src/app.ts');
      });

      it('should filter prd_snapshot.md from commits', () => {
        // SETUP
        const files = ['prd_snapshot.md', 'src/index.ts'];

        // EXECUTE
        const result = filterProtectedFiles(files);

        // VERIFY
        expect(result).not.toContain('prd_snapshot.md');
      });
    });

    describe('MISSING protected files (expose implementation gaps)', () => {
      it('should filter delta_prd.md from commits', () => {
        // SETUP
        const files = ['delta_prd.md', 'src/index.ts'];

        // EXECUTE
        const result = filterProtectedFiles(files);

        // VERIFY: This will FAIL until PROTECTED_FILES is updated
        expect(result).not.toContain('delta_prd.md');
      });

      it('should filter delta_from.txt from commits', () => {
        // SETUP
        const files = ['delta_from.txt', 'src/index.ts'];

        // EXECUTE
        const result = filterProtectedFiles(files);

        // VERIFY: This will FAIL until PROTECTED_FILES is updated
        expect(result).not.toContain('delta_from.txt');
      });

      it('should filter TEST_RESULTS.md from commits', () => {
        // SETUP
        const files = ['TEST_RESULTS.md', 'src/index.ts'];

        // EXECUTE
        const result = filterProtectedFiles(files);

        // VERIFY: This will FAIL until PROTECTED_FILES is updated
        expect(result).not.toContain('TEST_RESULTS.md');
      });
    });

    describe('wildcard pattern matching', () => {
      it('should match tasks.json', () => {
        // VERIFY
        expect(isProtectedByWildcard('tasks.json')).toBe(true);
      });

      it('should match backup-tasks.json', () => {
        // VERIFY
        expect(isProtectedByWildcard('backup-tasks.json')).toBe(true);
      });

      it('should match tasks.backup.json', () => {
        // VERIFY
        expect(isProtectedByWildcard('tasks.backup.json')).toBe(true);
      });

      it('should match tasks-v2.json', () => {
        // VERIFY
        expect(isProtectedByWildcard('tasks-v2.json')).toBe(true);
      });

      it('should not match task.json (singular)', () => {
        // VERIFY
        expect(isProtectedByWildcard('task.json')).toBe(false);
      });

      it('should not match mytasks.json (no word boundary)', () => {
        // VERIFY
        expect(isProtectedByWildcard('mytasks.json')).toBe(false);
      });

      it('should not match tasks.json.bak (wrong extension)', () => {
        // VERIFY
        expect(isProtectedByWildcard('tasks.json.bak')).toBe(false);
      });
    });
  });

  // ===== FILESYSTEM DELETE PROTECTION TESTS =====

  describe('filesystem delete protection', () => {
    it('should throw error when deleting tasks.json', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('tasks.json')).rejects.toThrow(
        'Cannot delete protected file: tasks.json'
      );
    });

    it('should throw error when deleting PRD.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('PRD.md')).rejects.toThrow(
        'Cannot delete protected file: PRD.md'
      );
    });

    it('should throw error when deleting prd_snapshot.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('prd_snapshot.md')).rejects.toThrow(
        'Cannot delete protected file: prd_snapshot.md'
      );
    });

    it('should throw error when deleting delta_prd.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('delta_prd.md')).rejects.toThrow(
        'Cannot delete protected file: delta_prd.md'
      );
    });

    it('should throw error when deleting delta_from.txt', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('delta_from.txt')).rejects.toThrow(
        'Cannot delete protected file: delta_from.txt'
      );
    });

    it('should throw error when deleting TEST_RESULTS.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('TEST_RESULTS.md')).rejects.toThrow(
        'Cannot delete protected file: TEST_RESULTS.md'
      );
    });

    it('should allow deleting non-protected files', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('src/index.ts')).resolves.not.toThrow();
    });
  });

  // ===== FILESYSTEM MOVE PROTECTION TESTS =====

  describe('filesystem move protection', () => {
    it('should throw error when moving tasks.json', async () => {
      // EXECUTE & VERIFY
      await expect(safeMove('tasks.json', 'backup/tasks.json')).rejects.toThrow(
        'Cannot move protected file: tasks.json'
      );
    });

    it('should throw error when moving PRD.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeMove('PRD.md', 'docs/PRD.md')).rejects.toThrow(
        'Cannot move protected file: PRD.md'
      );
    });

    it('should throw error when moving prd_snapshot.md', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('prd_snapshot.md', 'backup/prd_snapshot.md')
      ).rejects.toThrow('Cannot move protected file: prd_snapshot.md');
    });

    it('should throw error when moving delta_prd.md', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('delta_prd.md', 'backup/delta_prd.md')
      ).rejects.toThrow('Cannot move protected file: delta_prd.md');
    });

    it('should throw error when moving delta_from.txt', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('delta_from.txt', 'backup/delta_from.txt')
      ).rejects.toThrow('Cannot move protected file: delta_from.txt');
    });

    it('should throw error when moving TEST_RESULTS.md', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('TEST_RESULTS.md', 'backup/TEST_RESULTS.md')
      ).rejects.toThrow('Cannot move protected file: TEST_RESULTS.md');
    });

    it('should allow moving non-protected files', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('src/index.ts', 'src/utils/index.ts')
      ).resolves.not.toThrow();
    });
  });

  // ===== AGENT WRITE PROTECTION TESTS =====

  describe('agent write protection', () => {
    /**
     * Safe write function with protected file checking
     *
     * @param filePath - File path to write
     * @param _content - Content to write (unused in test)
     * @throws Error if file is protected
     *
     * @remarks
     * This is a test helper that demonstrates how protected file
     * enforcement SHOULD work for write operations.
     */
    async function safeWrite(
      filePath: string,
      _content: string
    ): Promise<void> {
      const fileName = basename(filePath);
      if (ALL_PROTECTED_FILES.includes(fileName as any)) {
        throw new Error(`Cannot modify protected file: ${fileName}`);
      }
      // Would call fs.writeFile here in real implementation
      return Promise.resolve(undefined);
    }

    it('should prevent agents from writing to PRD.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeWrite('PRD.md', 'new content')).rejects.toThrow(
        'Cannot modify protected file: PRD.md'
      );
    });

    it('should prevent agents from writing to tasks.json', async () => {
      // EXECUTE & VERIFY
      await expect(safeWrite('tasks.json', '{"tasks": []}')).rejects.toThrow(
        'Cannot modify protected file: tasks.json'
      );
    });

    it('should prevent agents from writing to prd_snapshot.md', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeWrite('prd_snapshot.md', 'snapshot content')
      ).rejects.toThrow('Cannot modify protected file: prd_snapshot.md');
    });

    it('should prevent agents from writing to delta_prd.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeWrite('delta_prd.md', 'delta content')).rejects.toThrow(
        'Cannot modify protected file: delta_prd.md'
      );
    });

    it('should prevent agents from writing to delta_from.txt', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeWrite('delta_from.txt', 'parent session')
      ).rejects.toThrow('Cannot modify protected file: delta_from.txt');
    });

    it('should prevent agents from writing to TEST_RESULTS.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeWrite('TEST_RESULTS.md', 'bug report')).rejects.toThrow(
        'Cannot modify protected file: TEST_RESULTS.md'
      );
    });

    it('should allow agents to write to non-protected files', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeWrite('src/index.ts', 'code here')
      ).resolves.not.toThrow();
    });
  });

  // ===== .GITIGNORE VALIDATION TESTS =====

  describe('.gitignore validation', () => {
    it('should detect when plan/ is added to .gitignore', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\nplan/\ndist/';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(false);
      expect(result.error).toContain('plan/');
    });

    it('should detect when PRD.md is added to .gitignore', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\nPRD.md\n*.log';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(false);
      expect(result.error).toContain('PRD.md');
    });

    it('should detect when tasks.json is added to .gitignore', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\ntasks.json\n*.log';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tasks.json');
    });

    it('should detect when *tasks*.json pattern is added to .gitignore', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\n*tasks*.json\n*.log';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(false);
      expect(result.error).toContain('*tasks*.json');
    });

    it('should allow valid .gitignore entries', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\ndist/\n*.log\n.env';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should ignore comments and empty lines in .gitignore', () => {
      // SETUP
      const gitignoreContent = '# Comment\nnode_modules/\n\n*.log';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // ===== PROTECTED FILE HELPER FUNCTION TESTS =====

  describe('protected file helper functions', () => {
    it('should identify all protected files correctly', () => {
      // SETUP
      const protectedFiles = [
        'tasks.json',
        'PRD.md',
        'prd_snapshot.md',
        'delta_prd.md',
        'delta_from.txt',
        'TEST_RESULTS.md',
        'backup-tasks.json', // wildcard pattern
      ];
      const nonProtectedFiles = [
        'src/index.ts',
        'README.md',
        'task.json', // singular, not matched
        'mytasks.json', // no word boundary
      ];

      // EXECUTE & VERIFY
      protectedFiles.forEach(file => {
        expect(isProtectedFile(file)).toBe(true);
      });

      nonProtectedFiles.forEach(file => {
        expect(isProtectedFile(file)).toBe(false);
      });
    });

    it('should use basename for path comparison', () => {
      // VERIFY
      expect(isProtectedFile('path/to/tasks.json')).toBe(true);
      expect(isProtectedFile('./PRD.md')).toBe(true);
      expect(isProtectedFile('/absolute/path/prd_snapshot.md')).toBe(true);
    });

    it('should handle absolute and relative paths', () => {
      // VERIFY
      expect(isProtectedFile('/home/user/project/tasks.json')).toBe(true);
      expect(isProtectedFile('./tasks.json')).toBe(true);
      expect(isProtectedFile('../PRD.md')).toBe(true);
      expect(isProtectedFile('plan/001_hash/tasks.json')).toBe(true);
    });

    it('should handle wildcard pattern with paths', () => {
      // VERIFY
      expect(isProtectedFile('backup/backup-tasks.json')).toBe(true);
      expect(isProtectedFile('./archive/tasks-v2.json')).toBe(true);
      expect(isProtectedFile('/absolute/path/tasks.backup.json')).toBe(true);
    });
  });

  // ===== EDGE CASES =====

  describe('edge cases', () => {
    it('should handle paths with special characters', () => {
      // VERIFY
      expect(isProtectedFile('path with spaces/tasks.json')).toBe(true);
      expect(isProtectedFile('path-with-dashes/PRD.md')).toBe(true);
    });

    it('should handle case-sensitive matching', () => {
      // VERIFY
      expect(isProtectedFile('TASKS.JSON')).toBe(false);
      expect(isProtectedFile('prd.md')).toBe(false);
      expect(isProtectedFile('Tasks.json')).toBe(false);
    });

    it('should handle empty string in basename', () => {
      // VERIFY
      expect(isProtectedFile('')).toBe(false);
    });

    it('should handle paths with trailing slashes', () => {
      // SETUP - paths with trailing slashes are unusual but possible
      const pathWithSlash = 'tasks.json/';
      const fileName = basename(pathWithSlash);

      // VERIFY - basename typically handles this
      expect(fileName).toBe('tasks.json');
      expect(isProtectedFile(pathWithSlash)).toBe(true);
    });

    it('should handle Windows-style paths', () => {
      // VERIFY - isProtectedFile normalizes backslashes to forward slashes
      expect(isProtectedFile('C:\\project\\tasks.json')).toBe(true);
      expect(isProtectedFile('relative\\path\\PRD.md')).toBe(true);

      // Also verify that forward slashes work consistently
      expect(isProtectedFile('C:/project/tasks.json')).toBe(true);
      expect(isProtectedFile('relative/path/PRD.md')).toBe(true);
    });

    it('should handle multiple extensions correctly for wildcard', () => {
      // VERIFY
      expect(isProtectedByWildcard('tasks.json')).toBe(true);
      expect(isProtectedByWildcard('tasks.json.bak')).toBe(false);
      expect(isProtectedByWildcard('tasks.tar.gz')).toBe(false);
    });
  });

  // ===== INTEGRATION-STYLE TESTS =====

  describe('integration-style tests with smart commit', () => {
    it('should filter all protected files in smart commit workflow', async () => {
      // SETUP
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['src/index.ts'],
        untracked: [
          'tasks.json',
          'PRD.md',
          'prd_snapshot.md',
          'delta_prd.md',
          'delta_from.txt',
          'TEST_RESULTS.md',
          'src/utils.ts',
        ],
      });
      mockGitAdd.mockResolvedValue({
        success: true,
        stagedCount: 2,
      });
      mockGitCommit.mockResolvedValue({
        success: true,
        commitHash: 'abc123',
      });

      // EXECUTE
      const result = await smartCommit('/project', 'Test commit');

      // VERIFY - only non-protected files should be staged
      expect(mockGitAdd).toHaveBeenCalledWith({
        path: '/project',
        files: ['src/index.ts', 'src/utils.ts'],
      });
      expect(result).toBe('abc123');
    });

    it('should return null when only protected files are changed', async () => {
      // SETUP
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['tasks.json'],
        untracked: ['PRD.md', 'prd_snapshot.md'],
      });

      // EXECUTE
      const result = await smartCommit('/project', 'Test commit');

      // VERIFY
      expect(result).toBeNull();
      expect(mockGitAdd).not.toHaveBeenCalled();
      expect(mockGitCommit).not.toHaveBeenCalled();
    });
  });
});
