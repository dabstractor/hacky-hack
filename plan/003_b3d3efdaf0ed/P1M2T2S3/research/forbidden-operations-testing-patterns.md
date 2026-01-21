# Forbidden Operations Testing Patterns for AI Agents

**Research Date:** 2026-01-21
**Task:** P1M2T2S3 - Forbidden Operations Testing Patterns
**Focus:** Testing patterns for verifying AI agents cannot perform unauthorized operations

---

## Executive Summary

This document compiles testing patterns for verifying that AI agents enforce constraints on forbidden operations. Based on analysis of the codebase at `/home/dustin/projects/hacky-hack`, we've identified comprehensive patterns for testing:

1. **File operation restrictions** - Protected file enforcement
2. **Command execution constraints** - Dangerous command blocking
3. **Git operation guards** - Protected file commit filtering
4. **Session directory constraints** - Directory creation restrictions

**Key Finding:** The codebase demonstrates excellent examples of testing forbidden operations in:

- `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts` - Comprehensive protected file testing
- `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts` - Bash command security testing
- `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` - Git operation constraint testing
- `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts` - Environment variable constraint testing

---

## Table of Contents

1. [Core Testing Principles](#core-testing-principles)
2. [File Operation Restrictions](#file-operation-restrictions)
3. [Command Execution Constraints](#command-execution-constraints)
4. [Git Operation Guards](#git-operation-guards)
5. [Session Directory Constraints](#session-directory-constraints)
6. [Common Testing Gotchas](#common-testing-gotchas)
7. [Implementation Checklist](#implementation-checklist)
8. [URL Sources](#url-sources)

---

## Core Testing Principles

### Principle 1: Test Both Positive and Negative Cases

```typescript
// ✅ GOOD: Test both allowed and forbidden operations
describe('file write protection', () => {
  it('should allow writing to non-protected files', async () => {
    await expect(safeWrite('src/index.ts', 'code')).resolves.not.toThrow();
  });

  it('should block writing to protected files', async () => {
    await expect(safeWrite('PRD.md', 'content')).rejects.toThrow(
      'Cannot modify protected file: PRD.md'
    );
  });
});

// ❌ BAD: Only tests the positive case
describe('file write protection', () => {
  it('should allow writing to files', async () => {
    await expect(safeWrite('src/index.ts', 'code')).resolves.not.toThrow();
  });
  // Missing test for protected files!
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:519-524`

### Principle 2: Use Expectations to Verify Blocked Operations

```typescript
// ✅ GOOD: Explicit expectation of rejection/throwing
it('should throw error when deleting tasks.json', async () => {
  await expect(safeDelete('tasks.json')).rejects.toThrow(
    'Cannot delete protected file: tasks.json'
  );
});

// ❌ BAD: Try-catch without verification
it('should throw error when deleting tasks.json', async () => {
  try {
    await safeDelete('tasks.json');
  } catch (e) {
    // No assertion - test passes even if no error thrown!
  }
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:350-355`

### Principle 3: Test Edge Cases and Boundary Conditions

```typescript
// ✅ GOOD: Comprehensive edge case testing
describe('protected file wildcard patterns', () => {
  it('should match tasks.json', () => {
    expect(isProtectedByWildcard('tasks.json')).toBe(true);
  });

  it('should match backup-tasks.json', () => {
    expect(isProtectedByWildcard('backup-tasks.json')).toBe(true);
  });

  it('should NOT match task.json (singular)', () => {
    expect(isProtectedByWildcard('task.json')).toBe(false);
  });

  it('should NOT match mytasks.json (no word boundary)', () => {
    expect(isProtectedByWildcard('mytasks.json')).toBe(false);
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:309-343`

---

## File Operation Restrictions

### Pattern 1: Protected File Filtering

**Use Case:** Agents should not be able to read, write, delete, or move protected files.

**Protected Files Specification:**

```typescript
const PROTECTED_FILES = [
  'tasks.json',
  'PRD.md',
  'prd_snapshot.md',
  'delta_prd.md',
  'delta_from.txt',
  'TEST_RESULTS.md',
] as const;
```

**Implementation Example:**

```typescript
// Helper function that enforces protection
async function safeWrite(filePath: string, content: string): Promise<void> {
  const fileName = basename(filePath);
  if (PROTECTED_FILES.includes(fileName as any)) {
    throw new Error(`Cannot modify protected file: ${fileName}`);
  }
  return fs.writeFile(filePath, content);
}
```

**Test Pattern:**

```typescript
describe('agent write protection', () => {
  const protectedFiles = [
    'tasks.json',
    'PRD.md',
    'prd_snapshot.md',
    'delta_prd.md',
    'delta_from.txt',
    'TEST_RESULTS.md',
  ];

  protectedFiles.forEach(fileName => {
    it(`should prevent writing to ${fileName}`, async () => {
      await expect(safeWrite(fileName, 'content')).rejects.toThrow(
        `Cannot modify protected file: ${fileName}`
      );
    });
  });

  it('should allow writing to non-protected files', async () => {
    await expect(safeWrite('src/index.ts', 'code')).resolves.not.toThrow();
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:451-525`

### Pattern 2: Wildcard Pattern Matching

**Use Case:** Protected files may match wildcard patterns like `*tasks*.json`.

**Implementation:**

```typescript
function isProtectedByWildcard(filePath: string): boolean {
  const fileName = basename(filePath);
  return /\btasks.*\.json$/.test(fileName);
}
```

**Test Pattern:**

```typescript
describe('wildcard pattern matching', () => {
  const shouldMatch = [
    'tasks.json',
    'backup-tasks.json',
    'tasks.backup.json',
    'tasks-v2.json',
  ];

  const shouldNotMatch = [
    'task.json', // singular
    'mytasks.json', // no word boundary
    'tasks.json.bak', // wrong extension
  ];

  shouldMatch.forEach(file => {
    it(`should match ${file}`, () => {
      expect(isProtectedByWildcard(file)).toBe(true);
    });
  });

  shouldNotMatch.forEach(file => {
    it(`should NOT match ${file}`, () => {
      expect(isProtectedByWildcard(file)).toBe(false);
    });
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:309-343`

### Pattern 3: Filesystem Operation Protection

**Use Case:** Prevent deletion or movement of protected files.

**Implementation:**

```typescript
async function safeDelete(filePath: string): Promise<void> {
  const fileName = basename(filePath);
  if (PROTECTED_FILES.includes(fileName as any)) {
    throw new Error(`Cannot delete protected file: ${fileName}`);
  }
  return fs.unlink(filePath);
}

async function safeMove(oldPath: string, newPath: string): Promise<void> {
  const oldBasename = basename(oldPath);
  if (PROTECTED_FILES.includes(oldBasename as any)) {
    throw new Error(`Cannot move protected file: ${oldBasename}`);
  }
  return fs.rename(oldPath, newPath);
}
```

**Test Pattern:**

```typescript
describe('filesystem delete protection', () => {
  it('should throw error when deleting protected files', async () => {
    await expect(safeDelete('tasks.json')).rejects.toThrow(
      'Cannot delete protected file: tasks.json'
    );
  });

  it('should allow deleting non-protected files', async () => {
    await expect(safeDelete('src/temp.txt')).resolves.not.toThrow();
  });
});

describe('filesystem move protection', () => {
  it('should throw error when moving protected files', async () => {
    await expect(safeMove('PRD.md', 'backup/PRD.md')).rejects.toThrow(
      'Cannot move protected file: PRD.md'
    );
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:347-449`

### Pattern 4: Path Normalization

**Use Case:** Protected file checking should work consistently across different path formats.

**Test Pattern:**

```typescript
describe('path normalization for protected files', () => {
  it('should handle absolute paths', () => {
    expect(isProtectedFile('/absolute/path/to/tasks.json')).toBe(true);
  });

  it('should handle relative paths', () => {
    expect(isProtectedFile('./tasks.json')).toBe(true);
  });

  it('should handle parent directory references', () => {
    expect(isProtectedFile('../PRD.md')).toBe(true);
  });

  it('should handle Windows-style paths', () => {
    expect(isProtectedFile('C:\\project\\tasks.json')).toBe(true);
    expect(isProtectedFile('relative\\path\\PRD.md')).toBe(true);
  });

  it('should handle paths with special characters', () => {
    expect(isProtectedFile('path with spaces/tasks.json')).toBe(true);
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:634-696`

---

## Command Execution Constraints

### Pattern 1: Shell Injection Prevention

**Use Case:** Commands should be executed without shell interpretation to prevent injection.

**Implementation:**

```typescript
// ✅ GOOD: Use shell: false to prevent injection
import { spawn } from 'node:child_process';

const result = spawn(command, args, {
  shell: false, // CRITICAL: No shell interpretation
  stdio: ['ignore', 'pipe', 'pipe'],
});
```

**Test Pattern:**

```typescript
describe('shell security', () => {
  it('should always use shell: false', async () => {
    const input = { command: 'echo test' };
    await executeBashCommand(input);

    // Verify spawn was called with shell: false
    expect(mockSpawn).toHaveBeenCalledWith(
      'echo',
      ['test'],
      expect.objectContaining({
        shell: false,
      })
    );
  });

  it('should use stdio pipe for stdout and stderr', async () => {
    const input = { command: 'cat file' };
    await executeBashCommand(input);

    expect(mockSpawn).toHaveBeenCalledWith(
      'cat',
      ['file'],
      expect.objectContaining({
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    );
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts:489-523`

### Pattern 2: Working Directory Validation

**Use Case:** Commands should not execute outside designated directories.

**Implementation:**

```typescript
async function executeBashCommand(input: BashToolInput) {
  const { command, cwd } = input;

  // Validate working directory exists
  if (cwd && !existsSync(cwd)) {
    throw new Error(`Working directory does not exist: ${cwd}`);
  }

  // Resolve to absolute path
  const resolvedCwd = cwd ? realpathSync(cwd) : undefined;

  return spawn(executable, args, { cwd: resolvedCwd, shell: false });
}
```

**Test Pattern:**

```typescript
describe('working directory constraints', () => {
  it('should validate working directory exists', async () => {
    mockExistsSync.mockReturnValue(false);
    const input = { command: 'ls', cwd: '/nonexistent' };

    await expect(executeBashCommand(input)).rejects.toThrow(
      'Working directory does not exist: /nonexistent'
    );
  });

  it('should resolve relative paths to absolute', async () => {
    mockRealpathSync.mockReturnValue('/absolute/relative');
    const input = { command: 'ls', cwd: './relative' };

    await executeBashCommand(input);

    expect(mockSpawn).toHaveBeenCalledWith(
      'ls',
      [],
      expect.objectContaining({
        cwd: '/absolute/relative',
      })
    );
  });

  it('should not pass cwd when not provided', async () => {
    const input = { command: 'ls' };
    await executeBashCommand(input);

    expect(mockSpawn).toHaveBeenCalledWith(
      'ls',
      [],
      expect.objectContaining({
        cwd: undefined,
      })
    );
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts:414-487`

### Pattern 3: Timeout Enforcement

**Use Case:** Long-running commands should be terminated to prevent resource exhaustion.

**Test Pattern:**

```typescript
describe('timeout handling', () => {
  it('should kill process after timeout', async () => {
    let childKilled = false;
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(() => {
        childKilled = true;
      }),
      get killed() {
        return childKilled;
      },
    } as any;
    mockSpawn.mockReturnValue(mockChild);

    const input = { command: 'sleep 100', timeout: 50 };
    const resultPromise = executeBashCommand(input);

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify kill was called
    expect(mockChild.killed).toBe(true);
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('should send SIGKILL if SIGTERM does not work', async () => {
    const killCalls: string[] = [];
    const stubbornChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn((signal: string) => {
        killCalls.push(signal);
      }),
      killed: false,
    } as any;
    mockSpawn.mockReturnValue(stubbornChild);

    const input = { command: 'stubborn', timeout: 10 };
    const resultPromise = executeBashCommand(input);

    await new Promise(resolve => setTimeout(resolve, 2250));

    // Verify both SIGTERM and SIGKILL were called
    expect(killCalls).toContain('SIGTERM');
    expect(killCalls).toContain('SIGKILL');
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts:205-339`

### Pattern 4: Command Parsing and Argument Handling

**Use Case:** Commands should be split into executable and arguments safely.

**Test Pattern:**

```typescript
describe('command parsing', () => {
  it('should split command into executable and arguments', async () => {
    const input = { command: 'git status -sb' };
    await executeBashCommand(input);

    expect(mockSpawn).toHaveBeenCalledWith(
      'git',
      ['status', '-sb'],
      expect.any(Object)
    );
  });

  it('should handle command with single argument', async () => {
    const input = { command: 'ls -la' };
    await executeBashCommand(input);

    expect(mockSpawn).toHaveBeenCalledWith('ls', ['-la'], expect.any(Object));
  });

  it('should handle command with no arguments', async () => {
    const input = { command: 'pwd' };
    await executeBashCommand(input);

    expect(mockSpawn).toHaveBeenCalledWith('pwd', [], expect.any(Object));
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts:525-566`

---

## Git Operation Guards

### Pattern 1: Protected File Commit Filtering

**Use Case:** Git commits should not include protected files.

**Implementation:**

```typescript
function filterProtectedFiles(files: string[]): string[] {
  const PROTECTED_FILES = [
    'tasks.json',
    'PRD.md',
    'prd_snapshot.md',
    'delta_prd.md',
    'delta_from.txt',
    'TEST_RESULTS.md',
  ];

  return files.filter(file => {
    const basename = path.basename(file);
    return !PROTECTED_FILES.includes(basename);
  });
}

async function smartCommit(repoPath: string, message: string) {
  const status = await gitStatus(repoPath);
  const allFiles = [...(status.modified || []), ...(status.untracked || [])];
  const filesToCommit = filterProtectedFiles(allFiles);

  if (filesToCommit.length === 0) {
    return null; // No files to commit
  }

  await gitAdd({ path: repoPath, files: filesToCommit });
  return await gitCommit({ path: repoPath, message });
}
```

**Test Pattern:**

```typescript
describe('protected files filtering', () => {
  it('should filter out tasks.json from commits', () => {
    const files = ['src/index.ts', 'tasks.json', 'src/utils.ts'];
    const filtered = filterProtectedFiles(files);

    expect(filtered).toEqual(['src/index.ts', 'src/utils.ts']);
    expect(filtered).not.toContain('tasks.json');
  });

  it('should filter out PRD.md from commits', () => {
    const files = ['README.md', 'PRD.md', 'src/app.ts'];
    const filtered = filterProtectedFiles(files);

    expect(filtered).not.toContain('PRD.md');
  });

  it('should filter protected files with paths using basename', () => {
    const files = [
      'src/index.ts',
      'plan/session/tasks.json',
      'src/utils.ts',
      'session/PRD.md',
    ];
    const filtered = filterProtectedFiles(files);

    expect(filtered).not.toContain('plan/session/tasks.json');
    expect(filtered).not.toContain('session/PRD.md');
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:233-345`

### Pattern 2: Git Flag Injection Prevention

**Use Case:** Git operations should use `--` separator to prevent flag injection.

**Implementation:**

```typescript
async function gitAdd(input: GitAddInput) {
  const { path, files } = input;

  if (files && files.length > 0) {
    // Use -- separator to prevent flag injection
    return await git.add(['--', ...files]);
  }

  return await git.add('.');
}
```

**Test Pattern:**

```typescript
describe('git add security', () => {
  it('should use -- separator for file staging', async () => {
    mockGitInstance.add.mockResolvedValue(undefined);
    const input = { files: ['legitimate-file.txt'] };

    await gitAdd(input);

    // Verify -- separator prevents flag injection
    expect(mockGitInstance.add).toHaveBeenCalledWith([
      '--',
      'legitimate-file.txt',
    ]);
  });

  it('should handle malicious file names', async () => {
    // Even if someone passes '--force' as a filename,
    // the -- separator prevents it from being interpreted as a flag
    const input = { files: ['--force', 'legitimate.txt'] };

    await gitAdd(input);

    expect(mockGitInstance.add).toHaveBeenCalledWith([
      '--',
      '--force',
      'legitimate.txt',
    ]);
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts:494-508, 834-845`

### Pattern 3: Repository Path Validation

**Use Case:** Git operations should only work within valid repository paths.

**Test Pattern:**

```typescript
describe('git operation path validation', () => {
  it('should reject non-existent repository path', async () => {
    mockExistsSync.mockReturnValue(false);
    const input = { path: '/nonexistent' };

    const result = await gitStatus(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Repository path not found');
  });

  it('should reject non-git repository', async () => {
    mockExistsSync.mockImplementation(
      path => typeof path === 'string' && !path.endsWith('.git')
    );
    const input = { path: './not-a-repo' };

    const result = await gitStatus(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not a git repository');
  });

  it('should prevent path traversal attacks', async () => {
    mockExistsSync.mockReturnValue(false);
    const input = { path: '/malicious/../etc/passwd' };

    const result = await gitStatus(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Repository path not found');
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts:277-306, 847-858`

### Pattern 4: Commit Message Validation

**Use Case:** Commit messages should meet minimum requirements.

**Test Pattern:**

```typescript
describe('commit message validation', () => {
  it('should reject empty commit message', async () => {
    const input = { message: '' };
    const result = await gitCommit(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Commit message is required');
    expect(mockGitInstance.commit).not.toHaveBeenCalled();
  });

  it('should reject whitespace-only message', async () => {
    const input = { message: '   ' };
    const result = await gitCommit(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Commit message is required');
  });

  it('should reject undefined message', async () => {
    const input = { message: undefined as unknown as string };
    const result = await gitCommit(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Commit message is required');
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts:633-672`

---

## Session Directory Constraints

### Pattern 1: Environment Variable Guards

**Use Case:** Prevent nested execution or operations in wrong contexts.

**Test Pattern:**

```typescript
describe('environment variable guards', () => {
  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL: Always restore environment
  });

  it('should block execution when PRP_PIPELINE_RUNNING is set', () => {
    vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');

    // Verify blocked
    expect(process.env.PRP_PIPELINE_RUNNING).toBe('99999');
    // Guard should throw when implemented
  });

  it('should allow recursion when conditions met', () => {
    vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
    vi.stubEnv('SKIP_BUG_FINDING', 'true');
    vi.stubEnv('PLAN_DIR', '/path/to/bugfix');

    // Verify conditions for allowed recursion
    expect(process.env.SKIP_BUG_FINDING).toBe('true');
    expect(process.env.PLAN_DIR).toContain('bugfix');
  });

  it('should treat SKIP_BUG_FINDING case-sensitively', () => {
    vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
    vi.stubEnv('SKIP_BUG_FINDING', 'TRUE'); // Not 'true'
    vi.stubEnv('PLAN_DIR', '/path/to/bugfix');

    // Should block because 'TRUE' !== 'true'
    expect(process.env.SKIP_BUG_FINDING).toBe('TRUE');
    expect(process.env.SKIP_BUG_FINDING).not.toBe('true');
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts:63-151, 468-495`

### Pattern 2: Path Validation for Session Creation

**Use Case:** Session directories should only be created in designated locations.

**Test Pattern:**

```typescript
describe('session directory constraints', () => {
  it('should reject session creation outside plan directory', async () => {
    const invalidPath = '/tmp/session-abc123';

    await expect(createSessionDirectory(invalidPath)).rejects.toThrow(
      'Session directories must be under plan/'
    );
  });

  it('should accept valid session directory path', async () => {
    const validPath = '/project/plan/003_hash/session-abc123';

    await expect(createSessionDirectory(validPath)).resolves.not.toThrow();
  });

  it('should prevent path traversal in session paths', async () => {
    const maliciousPath = '/project/plan/003_hash/../../etc/session';

    await expect(createSessionDirectory(maliciousPath)).rejects.toThrow(
      /path traversal|invalid session path/i
    );
  });
});
```

### Pattern 3: Directory Creation Permission Checks

**Test Pattern:**

```typescript
describe('directory creation permissions', () => {
  it('should verify parent directory exists', async () => {
    mockExistsSync.mockReturnValue(false);
    const sessionPath = '/plan/001_hash/new-session';

    await expect(createSessionDirectory(sessionPath)).rejects.toThrow(
      'Parent directory does not exist'
    );
  });

  it('should verify parent directory is writable', async () => {
    mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'));
    const sessionPath = '/readonly/plan/001_hash/session';

    await expect(createSessionDirectory(sessionPath)).rejects.toThrow(
      /permission denied/i
    );
  });
});
```

---

## Common Testing Gotchas

### Gotcha 1: Missing Environment Cleanup

**Problem:** Environment variables leak between tests.

**Solution:**

```typescript
describe('environment-dependent tests', () => {
  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL: Always restore!
  });

  it('test 1', () => {
    vi.stubEnv('MY_VAR', 'value');
    // ...
  });

  it('test 2', () => {
    // Without cleanup, MY_VAR might still be set!
    expect(process.env.MY_VAR).toBeUndefined();
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts:55-57, 471-478`

### Gotcha 2: Testing That Operations Should Fail

**Problem:** Tests accidentally succeed when they should fail.

**Wrong:**

```typescript
it('should block deleting protected file', async () => {
  try {
    await safeDelete('PRD.md');
    // Test passes even if no error thrown!
  } catch (e) {
    // Expected error
  }
});
```

**Correct:**

```typescript
it('should block deleting protected file', async () => {
  // Will FAIL if no error is thrown
  await expect(safeDelete('PRD.md')).rejects.toThrow(
    'Cannot delete protected file: PRD.md'
  );
});
```

### Gotcha 3: Not Testing Path Traversal

**Problem:** Only testing simple paths, not attack vectors.

**Solution:**

```typescript
describe('path security', () => {
  const attackPaths = [
    '../../../etc/passwd',
    '/absolute/escape/../../etc',
    'normal/../../escape',
    '..\\..\\windows\\system32', // Windows
  ];

  attackPaths.forEach(maliciousPath => {
    it(`should block path traversal: ${maliciousPath}`, async () => {
      await expect(validatePath(maliciousPath)).rejects.toThrow(
        /path traversal|invalid path/i
      );
    });
  });
});
```

### Gotcha 4: Mock State Leaking Between Tests

**Problem:** Mocks retain state from previous tests.

**Solution:**

```typescript
describe('test suite with mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear all mock calls
    mockExistsSync.mockReset(); // Reset to default implementation
  });

  it('test 1', () => {
    mockExistsSync.mockReturnValue(true);
    // ...
  });

  it('test 2', () => {
    // Without cleanup, mockReturnValue(true) still applies!
    mockExistsSync.mockReturnValue(false);
    // ...
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts:66-77`

### Gotcha 5: Not Testing Case Sensitivity

**Problem:** Protection might not work for different casings.

**Solution:**

```typescript
describe('case sensitivity', () => {
  it('should use case-sensitive matching', () => {
    expect(isProtectedFile('TASKS.JSON')).toBe(false);
    expect(isProtectedFile('prd.md')).toBe(false);
    expect(isProtectedFile('Tasks.json')).toBe(false);
  });

  it('should only match exact case', () => {
    expect(isProtectedFile('PRD.md')).toBe(true); // Protected
    expect(isProtectedFile('prd.md')).toBe(false); // Not protected
    expect(isProtectedFile('Prd.md')).toBe(false); // Not protected
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:666-671`

### Gotcha 6: Not Testing Empty or Invalid Input

**Problem:** Only testing valid inputs.

**Solution:**

```typescript
describe('invalid input handling', () => {
  it('should handle empty string', async () => {
    const result = await validatePath('');
    expect(result.valid).toBe(false);
  });

  it('should handle null input', async () => {
    const result = await validatePath(null as any);
    expect(result.valid).toBe(false);
  });

  it('should handle special characters', async () => {
    const result = await validatePath('path with spaces/file');
    expect(result.valid).toBe(true); // Should handle gracefully
  });
});
```

**Source:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts:673-686`

---

## Implementation Checklist

### For File Operation Restrictions

- [ ] Define complete list of protected files
- [ ] Implement wildcard pattern matching (e.g., `*tasks*.json`)
- [ ] Test read protection (if applicable)
- [ ] Test write protection
- [ ] Test delete protection
- [ ] Test move/rename protection
- [ ] Test path normalization (absolute, relative, Windows)
- [ ] Test case sensitivity
- [ ] Test edge cases (empty paths, special characters)

### For Command Execution Constraints

- [ ] Verify `shell: false` is used
- [ ] Test working directory validation
- [ ] Test timeout enforcement
- [ ] Test command parsing (executable + args)
- [ ] Test stdio configuration
- [ ] Test error handling for malicious input
- [ ] Test path traversal prevention
- [ ] Test resource cleanup after timeout

### For Git Operation Guards

- [ ] Implement protected file filtering
- [ ] Test `--` separator usage for flag injection prevention
- [ ] Test repository path validation
- [ ] Test commit message validation
- [ ] Test merge conflict handling
- [ ] Test "nothing to commit" error
- [ ] Test path traversal in git paths
- [ ] Test special characters in file names

### For Session Directory Constraints

- [ ] Implement path validation (must be under `plan/`)
- [ ] Test environment variable guards
- [ ] Test nested execution prevention
- [ ] Test exception conditions (bug fix mode)
- [ ] Test cleanup between test runs
- [ ] Test case-sensitive environment variables
- [ ] Test path traversal in session paths
- [ ] Test parent directory existence checks

---

## URL Sources

### External Documentation

Due to monthly search limit being reached (2026-01-21), the following sources are recommended for further research when limits reset:

**Vitest Testing Framework:**

- [Vitest Documentation](https://vitest.dev/guide/) - Official Vitest testing guide
- [Vitest Mocking](https://vitest.dev/guide/mocking.html) - Mock functions and modules

**Node.js Security:**

- [Node.js child_process security](https://nodejs.org/api/child_process.html#spawning-js-and-ipython-on-windows) - Official documentation on spawn security
- [Node.js file system security](https://nodejs.org/api/fs.html) - File system best practices

**Git Security:**

- [Git security best practices](https://git-scm.com/docs/gittechnical) - Git technical documentation
- [Simple-git library](https://github.com/steveukx/git-js) - Git wrapper documentation

**AI/LLM Agent Testing:**

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/agent-system-prompts) - Agent system prompts
- [OWASP AI Security](https://owasp.org/www-project-top-ten-for-large-language-model-applications/) - AI/LLM security guidelines

### Internal Codebase Sources

The following files from `/home/dustin/projects/hacky-hack` were analyzed:

**Test Files:**

- `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts` - Protected file enforcement tests
- `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts` - Bash command security tests
- `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` - Git operation constraint tests
- `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts` - Environment variable guard tests
- `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts` - Smart commit workflow tests

**Implementation Files (referenced in tests):**

- `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts` - Bash tool implementation
- `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts` - Git tool implementation
- `/home/dustin/projects/hacky-hack/src/utils/git-commit.ts` - Smart commit implementation
- `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/system_context.md` - Protected files specification

**Research Documents:**

- `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P1M2T1S4/research/protected-files-specs.md` - Protected files research
- `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P1M2T2S2/research/testing-patterns-summary.md` - Testing patterns research

---

## Summary

This research document provides comprehensive testing patterns for verifying forbidden operations are enforced in AI agents. The patterns are derived from actual implementation in the codebase and follow these key principles:

1. **Test both positive and negative cases** - Verify allowed operations work AND forbidden operations are blocked
2. **Use explicit expectations** - Use `expect().rejects.toThrow()` instead of try-catch
3. **Test edge cases** - Path traversal, case sensitivity, empty input, special characters
4. **Mock properly** - Clean up mocks between tests, use realistic mock objects
5. **Validate security constraints** - Shell injection, flag injection, path traversal, timeout enforcement

The codebase at `/home/dustin/projects/hacky-hack` serves as an excellent reference implementation with comprehensive test coverage for:

- Protected file filtering and enforcement
- Bash command execution security
- Git operation constraints
- Environment variable guards
- Session directory creation constraints

By following the patterns and checklists in this document, you can ensure your AI agent properly enforces all necessary constraints on forbidden operations.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-21
**Author:** Claude Code (Anthropic)
**License:** Internal Research Document
