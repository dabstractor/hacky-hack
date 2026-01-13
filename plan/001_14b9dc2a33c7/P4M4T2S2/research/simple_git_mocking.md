# Best Practices for Mocking simple-git in TypeScript/Vitest Tests

**Research Date:** 2025-01-13
**simple-git Version:** 3.30.0
**Vitest Version:** 1.6.1
**TypeScript Version:** 5.2.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Best Practices for Mocking simple-git API](#2-best-practices-for-mocking-simple-git-api)
3. [Properly Mocking GitError](#3-properly-mocking-giterror)
4. [Testing Without Actual Git Repository](#4-testing-without-actual-git-repository)
5. [Common Pitfalls](#5-common-pitfalls)
6. [Git Tool Testing Patterns](#6-git-tool-testing-patterns)
7. [Real-World Examples](#7-real-world-examples)
8. [References](#8-references)

---

## 1. Overview

**simple-git** is a TypeScript-first Node.js library providing promise-based Git operations. When testing with Vitest, proper mocking is essential to:

- Avoid creating actual git repositories during tests
- Ensure fast, reliable test execution
- Test error conditions that are difficult to reproduce with real git operations
- Maintain isolation between tests

### Key Challenges

1. **GitError class** - Requires proper instanceof checks
2. **Async operations** - All git operations return promises
3. **Complex return types** - StatusResult, CommitResult, etc.
4. **State-dependent operations** - Git commands depend on repository state

---

## 2. Best Practices for Mocking simple-git API

### 2.1 Module-Level Mocking with vi.mock()

**Pattern: Mock at module level before imports**

```typescript
// tests/unit/git-operations.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock simple-git BEFORE importing it
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));

// Import after mocking
import { simpleGit, GitError } from 'simple-git';
import { gitStatus, gitCommit } from '../src/git-operations.js';

const mockSimpleGit = vi.mocked(simpleGit);

// Mock instance methods
const mockGitInstance = {
  status: vi.fn(),
  diff: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
  push: vi.fn(),
  pull: vi.fn(),
};
```

**Why this works:**

- Mock is hoisted to top of module by Vitest
- Replaces simple-git with mock implementation
- Returns same mock instance for all calls
- GitError class can be used for instanceof checks

### 2.2 Mocking git.status()

**Best Practice: Return complete StatusResult objects**

```typescript
describe('git.status() mocking', () => {
  beforeEach(() => {
    mockGitInstance.status.mockResolvedValue({
      current: 'main',
      tracking: null,
      files: [
        {
          path: 'src/index.ts',
          index: 'M',        // Staged changes
          working_dir: 'M',  // Working tree changes
        },
        {
          path: 'src/utils.ts',
          index: ' ',        // No staged changes
          working_dir: 'M',  // Working tree changes
        },
        {
          path: 'newfile.txt',
          index: '?',        // Untracked
          working_dir: '?',
        },
      ],
      branches: [],
      isClean: () => false,
      created: 0,
      deleted: 0,
      modified: 2,
      renamed: 0,
      conflicted: 0,
    } as never);
  });

  it('should parse file status correctly', async () => {
    const result = await gitStatus({ path: './test-repo' });

    expect(result.success).toBe(true);
    expect(result.branch).toBe('main');
    expect(result.staged).toEqual(['src/index.ts']);
    expect(result.modified).toEqual(['src/index.ts', 'src/utils.ts']);
    expect(result.untracked).toEqual(['newfile.txt']);
  });
});
```

**Key Points:**

- Use `as never` to bypass type checking for mock
- Include all StatusResult properties for completeness
- Mock `isClean()` method for boolean checks
- Return array of FileStatusResult with proper status codes

**Status Codes Reference:**

```typescript
// Index column (staged changes)
' '  // No change
'M'  // Modified
'A'  // Added
'D'  // Deleted
'R'  // Renamed
'C'  // Copied
'U'  // Unmerged (conflict)

// Working_dir column (unstaged changes)
' '  // No change
'M'  // Modified
'D'  // Deleted
'U'  // Unmerged (conflict)
'?'  // Untracked
```

### 2.3 Mocking git.diff()

**Best Practice: Return realistic diff strings**

```typescript
describe('git.diff() mocking', () => {
  it('should handle unstaged diff output', async () => {
    // Mock unstaged changes
    mockGitInstance.diff.mockResolvedValue(
      'diff --git a/file.txt b/file.txt\n' +
      'index 1234567..abcdefg 100644\n' +
      '--- a/file.txt\n' +
      '+++ b/file.txt\n' +
      '@@ -1,3 +1,4 @@\n' +
      ' line 1\n' +
      '-old line\n' +
      '+new line\n' +
      ' line 3'
    );

    const result = await gitDiff({ path: './test-repo' });

    expect(result.success).toBe(true);
    expect(result.diff).toContain('diff --git');
    expect(mockGitInstance.diff).toHaveBeenCalledWith();
  });

  it('should handle staged diff with --cached', async () => {
    mockGitInstance.diff.mockResolvedValue(
      'diff --cached a/file.txt b/file.txt\n' +
      '-old\n+new'
    );

    const result = await gitDiff({
      path: './test-repo',
      staged: true,
    });

    expect(result.success).toBe(true);
    expect(mockGitInstance.diff).toHaveBeenCalledWith(['--cached']);
  });

  it('should handle empty diff (no changes)', async () => {
    mockGitInstance.diff.mockResolvedValue('');

    const result = await gitDiff({ path: './test-repo' });

    expect(result.success).toBe(true);
    expect(result.diff).toBe('');
  });
});
```

**Best Practices:**

- Return empty string for no changes
- Include proper diff headers for realistic output
- Test both unstaged (default) and staged (`--cached`) variants
- Verify correct arguments passed to mock

### 2.4 Mocking git.add()

**Best Practice: Test security patterns with -- separator**

```typescript
describe('git.add() mocking', () => {
  it('should stage all files with "."', async () => {
    mockGitInstance.add.mockResolvedValue(undefined);

    const result = await gitAdd({ path: './test-repo' });

    expect(result.success).toBe(true);
    expect(mockGitInstance.add).toHaveBeenCalledWith('.');
  });

  it('should use -- separator for specific files (security)', async () => {
    mockGitInstance.add.mockResolvedValue(undefined);

    const result = await gitAdd({
      path: './test-repo',
      files: ['file1.txt', 'file2.txt'],
    });

    expect(result.success).toBe(true);
    // Verify -- separator is used to prevent flag injection
    expect(mockGitInstance.add).toHaveBeenCalledWith([
      '--',
      'file1.txt',
      'file2.txt',
    ]);
  });

  it('should handle file names starting with -', async () => {
    mockGitInstance.add.mockResolvedValue(undefined);

    // This is safe because -- prevents flag injection
    const result = await gitAdd({
      files: ['--weird-filename.txt'],
    });

    expect(result.success).toBe(true);
    expect(mockGitInstance.add).toHaveBeenCalledWith([
      '--',
      '--weird-filename.txt',
    ]);
  });
});
```

**Security Pattern:**

Always use `--` separator when adding specific files:

```typescript
// ❌ BAD - vulnerable to flag injection
await git.add(['--force', 'file.txt']); // Actually sets --force flag

// ✅ GOOD - safe from flag injection
await git.add(['--', '--force', 'file.txt']); // Adds file named "--force"
```

### 2.5 Mocking git.commit()

**Best Practice: Return complete CommitResult objects**

```typescript
describe('git.commit() mocking', () => {
  it('should return commit hash on success', async () => {
    mockGitInstance.commit.mockResolvedValue({
      commit: 'abc123def456789',  // Full SHA
      branch: 'main',
      author: {
        email: 'test@example.com',
        name: 'Test User',
      },
      root: false,
      summary: {
        changes: 1,
        insertions: 5,
        deletions: 2,
      },
    } as never);

    const result = await gitCommit({
      path: './test-repo',
      message: 'Test commit',
    });

    expect(result.success).toBe(true);
    expect(result.commitHash).toBe('abc123def456789');
  });

  it('should handle --allow-empty option', async () => {
    mockGitInstance.commit.mockResolvedValue({
      commit: 'xyz789',
      branch: 'main',
    } as never);

    await gitCommit({
      message: 'Empty commit',
      allowEmpty: true,
    });

    expect(mockGitInstance.commit).toHaveBeenCalledWith(
      'Empty commit',
      [],
      { '--allow-empty': true }
    );
  });

  it('should validate message is not empty', async () => {
    const result = await gitCommit({ message: '' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Commit message is required');
    expect(mockGitInstance.commit).not.toHaveBeenCalled();
  });
});
```

---

## 3. Properly Mocking GitError

### 3.1 GitError Class Mocking

**Pattern: Create custom GitError class in mock**

```typescript
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));
```

**Why this approach:**

- Allows `instanceof GitError` checks to work
- Maintains proper error inheritance
- Compatible with simple-git's error handling

### 3.2 Testing GitError Scenarios

**Common GitError patterns:**

```typescript
describe('GitError handling', () => {
  it('should handle GitError from git.status()', async () => {
    // Create GitError instance
    const gitError = Object.assign(new Error('fatal: not a git repository'), {
      name: 'GitError',
    }) as GitError;

    mockGitInstance.status.mockRejectedValue(gitError);

    const result = await gitStatus({ path: './not-a-repo' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('fatal: not a git repository');
  });

  it('should detect GitError with instanceof', async () => {
    const gitError = Object.assign(new Error('Git operation failed'), {
      name: 'GitError',
    }) as GitError;

    mockGitInstance.status.mockRejectedValue(gitError);

    try {
      await gitStatus({ path: './test' });
      fail('Should have thrown');
    } catch (error) {
      expect(error instanceof GitError).toBe(true);
      expect(error.name).toBe('GitError');
    }
  });

  it('should handle "nothing to commit" error', async () => {
    const gitError = Object.assign(new Error('nothing to commit, working tree clean'), {
      name: 'GitError',
    }) as GitError;

    mockGitInstance.commit.mockRejectedValue(gitError);

    const result = await gitCommit({ message: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No changes staged for commit');
  });

  it('should handle merge conflict errors', async () => {
    const gitError = Object.assign(
      new Error('fatal: cannot commit because you have unmerged files'),
      { name: 'GitError' }
    ) as GitError;

    mockGitInstance.commit.mockRejectedValue(gitError);

    const result = await gitCommit({ message: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('unresolved merge conflicts');
  });
});
```

### 3.3 GitError Error Messages Reference

**Common error patterns to test:**

```typescript
const GIT_ERROR_MESSAGES = {
  NOT_A_REPOSITORY: 'fatal: not a git repository',
  NOTHING_TO_COMMIT: 'nothing to commit, working tree clean',
  MERGE_CONFLICT: 'fatal: cannot commit because you have unmerged files',
  AUTH_FAILED: 'fatal: authentication failed',
  REMOTE_EXISTS: 'fatal: remote origin already exists',
  PERMISSION_DENIED: 'fatal: unable to access',
  NETWORK_ERROR: 'fatal: Could not resolve host',
} as const;
```

---

## 4. Testing Without Actual Git Repository

### 4.1 Complete Isolation with Mocks

**Strategy: Mock everything, use no real git**

```typescript
// Complete isolation test suite
describe('git operations - isolated', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default successful responses
    mockGitInstance.status.mockResolvedValue({
      current: 'main',
      files: [],
      isClean: () => true,
    } as never);

    mockGitInstance.add.mockResolvedValue(undefined);
    mockGitInstance.commit.mockResolvedValue({
      commit: 'abc123',
      branch: 'main',
    } as never);
  });

  it('should work entirely without git repository', async () => {
    // No git repository exists, but test passes
    const result = await gitCommit({
      message: 'Test commit',
    });

    expect(result.success).toBe(true);
    expect(mockGitInstance.commit).toHaveBeenCalled();
  });
});
```

### 4.2 Mocking node:fs for Path Validation

**When code checks for .git directory:**

```typescript
vi.mock('node:fs', () => ({
  existsSync: vi.fn((_path: unknown) => {
    // Return true for all paths by default
    return true;
  }),
  realpathSync: vi.fn((path: unknown) => (path as string) ?? ''),
}));

import { existsSync, realpathSync } from 'node:fs';

const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);

describe('with path validation mocks', () => {
  beforeEach(() => {
    // Setup default path behavior
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation((path: unknown) => path as string);
  });

  it('should validate repository path', async () => {
    mockExistsSync.mockImplementation((path) => {
      // Path exists but .git doesn't
      return typeof path === 'string' && !path.endsWith('.git');
    });

    const result = await gitStatus({ path: './not-a-repo' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not a git repository');
  });
});
```

### 4.3 Testing Edge Cases Without Repository

```typescript
describe('edge cases without repository', () => {
  it('should handle non-existent repository', async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await gitStatus({ path: '/nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Repository path not found');
  });

  it('should handle special characters in paths', async () => {
    mockRealpathSync.mockImplementation((path) => {
      if (typeof path === 'string' && path.includes('..')) {
        throw new Error('Invalid path');
      }
      return path as string;
    });

    const result = await gitStatus({ path: '/malicious/../etc/passwd' });

    expect(result.success).toBe(false);
  });

  it('should handle empty files array in git.add()', async () => {
    mockGitInstance.add.mockResolvedValue(undefined);

    const result = await gitAdd({ files: [] });

    expect(result.success).toBe(true);
    expect(mockGitInstance.add).toHaveBeenCalledWith(['--']);
  });
});
```

---

## 5. Common Pitfalls

### 5.1 ❌ Pitfall: Not Resetting Mocks Between Tests

**Problem:**

```typescript
describe('without cleanup', () => {
  it('first test', async () => {
    mockGitInstance.status.mockResolvedValue({ current: 'main' } as never);
    // Test passes
  });

  it('second test', async () => {
    // Mock still returns 'main' from first test!
    // Test may fail unexpectedly
  });
});
```

**Solution:**

```typescript
describe('with cleanup', () => {
  afterEach(() => {
    vi.clearAllMocks(); // Clear mock call history
  });

  beforeEach(() => {
    // Reset to default behavior
    mockGitInstance.status.mockResolvedValue({
      current: 'main',
      files: [],
      isClean: () => true,
    } as never);
  });

  it('first test', async () => {
    // Safe, independent test
  });

  it('second test', async () => {
    // Fresh state, no interference
  });
});
```

### 5.2 ❌ Pitfall: Wrong Mock Return Type

**Problem:**

```typescript
// ❌ BAD - Returns object instead of promise
mockGitInstance.status.mockReturnValue({
  current: 'main',
  files: [],
});

// Code expects promise
const result = await git.status(); // Type error!
```

**Solution:**

```typescript
// ✅ GOOD - Returns resolved promise
mockGitInstance.status.mockResolvedValue({
  current: 'main',
  files: [],
  isClean: () => true,
} as never);
```

### 5.3 ❌ Pitfall: Forgetting to Mock GitError Class

**Problem:**

```typescript
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(),
  // Forgot to mock GitError!
}));

// Code that checks instanceof will fail
if (error instanceof GitError) {
  // Never enters this branch!
}
```

**Solution:**

```typescript
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));
```

### 5.4 ❌ Pitfall: Not Testing Error Paths

**Problem:**

```typescript
// Only testing success cases
it('should commit changes', async () => {
  mockGitInstance.commit.mockResolvedValue({ commit: 'abc123' } as never);
  const result = await gitCommit({ message: 'Test' });
  expect(result.success).toBe(true);
});

// Missing error tests!
```

**Solution:**

```typescript
// Test both success and failure
describe('gitCommit', () => {
  it('should commit changes successfully', async () => {
    mockGitInstance.commit.mockResolvedValue({ commit: 'abc123' } as never);
    const result = await gitCommit({ message: 'Test' });
    expect(result.success).toBe(true);
  });

  it('should handle "nothing to commit" error', async () => {
    const error = Object.assign(new Error('nothing to commit'), {
      name: 'GitError',
    }) as GitError;
    mockGitInstance.commit.mockRejectedValue(error);

    const result = await gitCommit({ message: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No changes staged');
  });

  it('should handle merge conflict errors', async () => {
    const error = Object.assign(new Error('merge conflict'), {
      name: 'GitError',
    }) as GitError;
    mockGitInstance.commit.mockRejectedValue(error);

    const result = await gitCommit({ message: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('unresolved merge conflicts');
  });
});
```

### 5.5 ❌ Pitfall: Missing -- Separator in git.add()

**Problem:**

```typescript
// Vulnerable to flag injection
await git.add(files);
```

**Solution:**

```typescript
// Safe from flag injection
if (files.length === 1 && files[0] === '.') {
  await git.add('.');
} else {
  await git.add(['--', ...files]);
}
```

**Test this security pattern:**

```typescript
it('should use -- separator to prevent flag injection', async () => {
  mockGitInstance.add.mockResolvedValue(undefined);

  await gitAdd({ files: ['file.txt'] });

  expect(mockGitInstance.add).toHaveBeenCalledWith(['--', 'file.txt']);
});
```

### 5.6 ❌ Pitfall: Not Using vi.mocked()

**Problem:**

```typescript
// Type assertion required everywhere
expect(mockGitInstance.status.mock.calls.length).toBe(1);
expect((mockGitInstance.commit as any).mock.calls[0][0]).toBe('message');
```

**Solution:**

```typescript
// Type-safe with vi.mocked()
const mockGitInstance = vi.mocked(simpleGit);

expect(mockGitInstance.status).toHaveBeenCalled();
expect(mockGitInstance.commit).toHaveBeenCalledWith('message', [], {});
```

---

## 6. Git Tool Testing Patterns

### 6.1 MCP Tool Testing Pattern

**From: `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts`**

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path) => path),
}));

vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));

import { existsSync, realpathSync } from 'node:fs';
import { simpleGit, GitError } from 'simple-git';
import { gitStatus, gitDiff, gitAdd, gitCommit } from './git-mcp.js';

const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);
const mockSimpleGit = vi.mocked(simpleGit);

const mockGitInstance = {
  status: vi.fn(),
  diff: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
};

describe('Git MCP Tools', () => {
  beforeEach(() => {
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation((path) => path as string);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('gitStatus', () => {
    it('should return repository status', async () => {
      mockGitInstance.status.mockResolvedValue({
        current: 'main',
        files: [
          { path: 'file.ts', index: 'M', working_dir: ' ' },
          { path: 'new.txt', index: '?', working_dir: '?' },
        ],
        isClean: () => false,
      } as never);

      const result = await gitStatus({ path: './test-repo' });

      expect(result.success).toBe(true);
      expect(result.branch).toBe('main');
      expect(result.staged).toEqual(['file.ts']);
      expect(result.untracked).toEqual(['new.txt']);
    });

    it('should handle GitError from simple-git', async () => {
      const gitError = Object.assign(new Error('Git operation failed'), {
        name: 'GitError',
      }) as GitError;
      mockGitInstance.status.mockRejectedValue(gitError);

      const result = await gitStatus({ path: './test-repo' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Git operation failed');
    });
  });
});
```

**Key Patterns:**

1. **Mock all external dependencies** (node:fs, simple-git)
2. **Use vi.mocked() for type safety**
3. **Test both success and error paths**
4. **Validate mock call arguments**
5. **Clean up mocks in afterEach**

### 6.2 Tool Schema Validation Pattern

```typescript
describe('gitStatusTool schema', () => {
  it('should have correct tool name', () => {
    expect(gitStatusTool.name).toBe('git_status');
  });

  it('should have description', () => {
    expect(gitStatusTool.description).toContain('git repository status');
  });

  it('should have path property defined', () => {
    expect(gitStatusTool.input_schema.properties.path).toEqual({
      type: 'string',
      description: 'Path to git repository (optional, defaults to current directory)',
    });
  });

  it('should have no required fields', () => {
    expect(gitStatusTool.input_schema.required).toBeUndefined();
  });
});
```

### 6.3 Security Testing Pattern

```typescript
describe('security patterns', () => {
  it('should use -- separator when staging files', async () => {
    mockGitInstance.add.mockResolvedValue(undefined);

    await gitAdd({ files: ['file.txt'] });

    // Verify -- separator prevents flag injection
    expect(mockGitInstance.add).toHaveBeenCalledWith(['--', 'file.txt']);
  });

  it('should validate repository path exists', async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await gitStatus({ path: '/nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Repository path not found');
  });
});
```

### 6.4 Edge Case Testing Pattern

```typescript
describe('edge cases', () => {
  it('should handle file with special status characters', async () => {
    mockGitInstance.status.mockResolvedValue({
      current: 'main',
      files: [
        { path: 'conflicted.txt', index: 'U', working_dir: 'U' },
        { path: 'both_modified.txt', index: 'M', working_dir: 'M' },
      ],
      isClean: () => false,
    } as never);

    const result = await gitStatus({});

    expect(result.staged).toContain('conflicted.txt');
    expect(result.modified).toContain('conflicted.txt');
  });

  it('should handle long commit message', async () => {
    const longMessage = 'a'.repeat(1000);
    mockGitInstance.commit.mockResolvedValue({
      commit: 'abc123',
      branch: 'main',
    } as never);

    const result = await gitCommit({ message: longMessage });

    expect(result.success).toBe(true);
    expect(mockGitInstance.commit).toHaveBeenCalledWith(longMessage, [], {});
  });
});
```

---

## 7. Real-World Examples

### 7.1 Complete Git Commit Flow Test

```typescript
describe('complete git commit flow', () => {
  it('should add, status, and commit files', async () => {
    // Setup: Working tree has changes
    mockGitInstance.status.mockResolvedValue({
      current: 'feature-branch',
      files: [
        { path: 'feature.ts', index: '?', working_dir: '?' },
      ],
      isClean: () => false,
    } as never);

    // Step 1: Check status
    const statusResult = await gitStatus({ path: './project' });
    expect(statusResult.success).toBe(true);
    expect(statusResult.untracked).toEqual(['feature.ts']);

    // Step 2: Add files
    mockGitInstance.add.mockResolvedValue(undefined);
    const addResult = await gitAdd({
      path: './project',
      files: ['feature.ts'],
    });
    expect(addResult.success).toBe(true);
    expect(mockGitInstance.add).toHaveBeenCalledWith(['--', 'feature.ts']);

    // Step 3: Verify staged
    mockGitInstance.status.mockResolvedValue({
      current: 'feature-branch',
      files: [
        { path: 'feature.ts', index: 'A', working_dir: ' ' },
      ],
      isClean: () => false,
    } as never);

    const stagedResult = await gitStatus({ path: './project' });
    expect(stagedResult.staged).toEqual(['feature.ts']);

    // Step 4: Commit
    mockGitInstance.commit.mockResolvedValue({
      commit: 'def456abc123',
      branch: 'feature-branch',
      author: {
        email: 'dev@example.com',
        name: 'Developer',
      },
      root: false,
      summary: {
        changes: 1,
        insertions: 10,
        deletions: 0,
      },
    } as never);

    const commitResult = await gitCommit({
      path: './project',
      message: 'feat: Add new feature',
    });

    expect(commitResult.success).toBe(true);
    expect(commitResult.commitHash).toBe('def456abc123');
    expect(mockGitInstance.commit).toHaveBeenCalledWith(
      'feat: Add new feature',
      [],
      {}
    );
  });
});
```

### 7.2 Error Recovery Pattern Test

```typescript
describe('error recovery', () => {
  it('should retry failed git operation', async () => {
    let attempts = 0;
    mockGitInstance.pull.mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network error');
      }
      return { files: [], insertions: 0, deletions: 0 };
    });

    async function pullWithRetry(maxRetries = 3) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await mockGitInstance.pull();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    const result = await pullWithRetry();

    expect(attempts).toBe(3);
    expect(mockGitInstance.pull).toHaveBeenCalledTimes(3);
  });
});
```

### 7.3 Concurrent Operations Test

```typescript
describe('concurrent operations', () => {
  it('should handle multiple repository status checks', async () => {
    const repos = [
      { name: 'repo1', path: '/path/to/repo1' },
      { name: 'repo2', path: '/path/to/repo2' },
      { name: 'repo3', path: '/path/to/repo3' },
    ];

    // Setup different states for each repo
    mockGitInstance.status.mockImplementation(async () => {
      // Return different status based on call count
      const calls = mockGitInstance.status.mock.calls.length;
      return {
        current: `branch-${calls}`,
        files: [],
        isClean: () => calls % 2 === 0,
      } as never;
    });

    const results = await Promise.all(
      repos.map(repo => gitStatus({ path: repo.path }))
    );

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);
    expect(mockGitInstance.status).toHaveBeenCalledTimes(3);
  });
});
```

---

## 8. References

### Official Documentation

- **simple-git GitHub:** https://github.com/steveukx/git-js
  - Source code and issues
  - API documentation
  - Contributing guidelines

- **simple-git NPM:** https://www.npmjs.com/package/simple-git
  - Package information
  - Version history
  - Dependencies

- **Vitest Documentation:** https://vitest.dev/guide/
  - Mocking utilities
  - Test patterns
  - Configuration

### Related Resources in This Project

- **Existing Test Implementation:**
  - `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts`
  - `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts`
  - `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts`

- **Implementation:**
  - `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts`

- **Research:**
  - `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S3/research/simple-git-research.md`

### Community Resources

- **Vitest Mocking Guide:** https://vitest.dev/guide/mocking.html
- **TypeScript Testing Best Practices:** https://github.com/microsoft/TypeScript/wiki/Testing
- **Git Error Handling:** https://git-scm.com/docs/git-status#_exit_status

### Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| simple-git | 3.30.0 | Promise-based API, TypeScript support |
| vitest | 1.6.1 | Fast unit test framework |
| typescript | 5.2.0 | Full type support |

---

## Summary

### Key Takeaways

1. **Mock at module level** - Use `vi.mock()` before imports
2. **Create GitError class** - Allow instanceof checks
3. **Return complete objects** - Include all StatusResult/CommitResult properties
4. **Test error paths** - Cover "nothing to commit", merge conflicts, etc.
5. **Use vi.mocked()** - Type-safe mock assertions
6. **Clean up in afterEach** - Prevent test interference
7. **Test security patterns** - Verify `--` separator in git.add()
8. **Mock node:fs** - When code validates paths

### Common Patterns

```typescript
// 1. Module-level mock
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));

// 2. Setup and cleanup
beforeEach(() => {
  mockGitInstance.status.mockResolvedValue(defaultStatus);
});
afterEach(() => {
  vi.clearAllMocks();
});

// 3. Test structure
it('should handle X', async () => {
  // SETUP
  mockGitInstance.method.mockResolvedValue(expectedValue);

  // EXECUTE
  const result = await functionUnderTest(input);

  // VERIFY
  expect(result).toEqual(expectedResult);
  expect(mockGitInstance.method).toHaveBeenCalledWith(args);
});
```

### Testing Checklist

- [ ] Mock simple-git at module level
- [ ] Create GitError class mock
- [ ] Test success scenarios
- [ ] Test error scenarios (GitError, generic errors)
- [ ] Test edge cases (empty arrays, special characters)
- [ ] Test security patterns (-- separator, path validation)
- [ ] Clean up mocks in afterEach
- [ ] Use vi.mocked() for type safety
- [ ] Verify mock call arguments
- [ ] Test concurrent operations if applicable

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Author:** Research based on simple-git@3.30.0, vitest@1.6.1, TypeScript@5.2.0
