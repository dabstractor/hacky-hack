# Mocking Patterns Research for Git and File Operations

**Research Date:** 2026-01-20
**Project:** hacky-hack
**Objective:** Document existing mocking patterns for git operations and file operations to inform protected file enforcement testing

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Mocking Libraries Used](#mocking-libraries-used)
3. [Git Operation Mocking Patterns](#git-operation-mocking-patterns)
4. [File Operation Mocking Patterns](#file-operation-mocking-patterns)
5. [Mocking at Module Level vs Function Level](#mocking-at-module-level-vs-function-level)
6. [Patterns for Testing Files are NOT Modified](#patterns-for-testing-files-are-not-modified)
7. [Patterns for Verifying Operations Were NOT Called](#patterns-for-verifying-operations-were-not-called)
8. [Mock Setup and Teardown Patterns](#mock-setup-and-teardown-patterns)
9. [Advanced Mocking Patterns](#advanced-mocking-patterns)
10. [Gotchas and Limitations](#gotchas-and-limitations)
11. [Key Test Files Reference](#key-test-files-reference)

---

## Executive Summary

This research document analyzes the mocking patterns used in the hacky-hack project's test suite for git operations and file system operations. The project uses **Vitest** as the testing framework with **vi.mock** for module-level mocking and **vi.hoisted** for shared mock state across tests.

### Key Findings

- **Primary Mocking Library:** Vitest's built-in `vi.mock()`, `vi.fn()`, `vi.mocked()`, and `vi.hoisted()`
- **Git Operations:** Mocked at module level via `simple-git` package
- **File Operations:** Mocked at module level via `node:fs` and `node:fs/promises`
- **Protected Files Pattern:** Already exists in `git-commit.test.ts` for filtering tasks.json, PRD.md, prd_snapshot.md
- **NOT Called Verification:** Extensive use of `.not.toHaveBeenCalled()` and `.not.toHaveBeenCalledWith()`

---

## Mocking Libraries Used

### Vitest Mocking Functions

```typescript
import { vi, beforeEach, afterEach, describe, expect, it } from 'vitest';
```

| Function | Purpose | Usage |
|----------|---------|-------|
| `vi.mock()` | Module-level mocking (hoisted) | Mock entire modules before imports |
| `vi.fn()` | Create mock/spy function | Individual function mocking |
| `vi.mocked()` | Type-safe mock access | Cast mocks to proper types |
| `vi.hoisted()` | Share state across mocks | Create variables before vi.mock() |
| `vi.clearAllMocks()` | Clear mock call history | Reset between tests |
| `vi.restoreAllMocks()` | Restore original implementations | Full mock cleanup |

---

## Git Operation Mocking Patterns

### Pattern 1: Mock `simple-git` with Custom GitError Class

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` (lines 23-34)

```typescript
// Mock simple-git to avoid actual git operations
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

**Key Points:**
- Mock the entire `simple-git` module at top level (before imports)
- Include the `GitError` class in the mock for type compatibility
- Return a mock instance with all git methods

### Pattern 2: Mock Git Instance Methods

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` (lines 58-64)

```typescript
// Mock simple-git instance
const mockGitInstance = {
  status: vi.fn(),
  diff: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
};
```

**Usage in Tests:**

```typescript
// Setup mock response
mockGitInstance.status.mockResolvedValue({
  current: 'main',
  files: [
    { path: 'src/index.ts', index: 'M', working_dir: ' ' },
  ],
  isClean: () => false,
} as never);

// Verify call
expect(mockGitInstance.status).toHaveBeenCalled();
```

### Pattern 3: Mock Git Operations for Integration Tests

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts` (lines 34-56)

```typescript
// Mock the git-commit module
vi.mock('../../src/utils/git-commit.js', () => ({
  smartCommit: vi.fn(),
  filterProtectedFiles: vi.fn((files: string[]) =>
    files.filter(
      f =>
        !['tasks.json', 'PRD.md', 'prd_snapshot.md'].includes(
          require('node:path').basename(f)
        )
    )
  ),
  formatCommitMessage: vi.fn(
    (msg: string) =>
      `[PRP Auto] ${msg}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`
  ),
}));

// Mock the git-mcp module
vi.mock('../../src/tools/git-mcp.js', () => ({
  gitStatus: vi.fn(),
  gitAdd: vi.fn(),
  gitCommit: vi.fn(),
}));
```

**Key Points:**
- Mock multiple related modules together
- Include default implementations for utility functions
- Use `require()` within mocks for dynamic imports

### Pattern 4: Verify Git Security Patterns

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` (lines 834-846)

```typescript
describe('security patterns', () => {
  it('should use -- separator when staging files (flag injection prevention)', async () => {
    // SETUP
    mockGitInstance.add.mockResolvedValue(undefined);
    const input: GitAddInput = { files: ['file.txt'] };

    // EXECUTE
    await gitAdd(input);

    // VERIFY - -- separator should always be used for specific files
    expect(mockGitInstance.add).toHaveBeenCalledWith(['--', 'file.txt']);
  });

  it('should validate repository path exists before operations', async () => {
    // SETUP
    mockExistsSync.mockReturnValue(false);
    const input: GitStatusInput = { path: '/malicious/../etc/passwd' };

    // EXECUTE
    const result = await gitStatus(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Repository path not found');
  });
});
```

---

## File Operation Mocking Patterns

### Pattern 1: Mock `node:fs/promises` Functions

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts` (lines 13-20)

```typescript
// Mock node:fs/promises to avoid actual file operations
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));
```

**Usage in Tests:**

```typescript
import { promises as fs } from 'node:fs';
const mockReadFile = vi.mocked(fs.readFile);

// Setup mock response
mockReadFile.mockResolvedValue('file content here' as any);

// Verify call
expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
  encoding: 'utf-8',
});
```

### Pattern 2: Mock with Shared State (In-Memory File System)

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/build-logger.test.ts` (lines 17-35)

```typescript
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
```

**Key Points:**
- Use `Map` to simulate file system state
- Implement realistic read/write behavior
- Clear state in `beforeEach` hook

### Pattern 3: Mock with Error Simulation

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts` (lines 220-235)

```typescript
describe('error handling', () => {
  it('should handle file not found (ENOENT)', async () => {
    // SETUP
    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);
    const input: FileReadInput = { path: './nonexistent.txt' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('File not found: ./nonexistent.txt');
    expect(result.content).toBeUndefined();
  });

  it('should handle permission denied (EACCES)', async () => {
    // SETUP
    const error = new Error('Permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockReadFile.mockRejectedValue(error);
    const input: FileReadInput = { path: './restricted.txt' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Permission denied: ./restricted.txt');
  });
});
```

### Pattern 4: Mock File System for Integration Tests

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/core/session-structure.test.ts` (lines 23-34)

```typescript
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Session Directory Structure', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-structure-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create session directory with {sequence}_{hash} format', async () => {
    // SETUP: Create test PRD
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, prdContent, { mode: 0o644 });

    // EXECUTE: Initialize session
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Session directory exists on filesystem
    expect(existsSync(session.metadata.path)).toBe(true);
  });
});
```

**Key Points:**
- Use real file system in temporary directories
- Clean up after each test with `rmSync`
- Test actual file/directory structures

---

## Mocking at Module Level vs Function Level

### Module-Level Mocking (Before Imports)

**Use When:**
- Mocking external dependencies (node modules)
- Mocking entire utility modules
- Need mock available before module loads

**Pattern:**

```typescript
// Must be at top level, before imports
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Imports come after mocks
import { simpleGit } from 'simple-git';
import { existsSync } from 'node:fs';
```

### Function-Level Mocking (With vi.hoisted)

**Use When:**
- Need shared state across multiple mocks
- Need to access mock functions in tests
- Creating complex mock implementations

**Pattern:**

```typescript
// Create hoisted variables first
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Then mock the module using hoisted variables
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Import and use
import { getLogger } from '../../../src/utils/logger.js';
const mockGetLogger = vi.mocked(getLogger);

// In tests:
expect(mockLogger.info).toHaveBeenCalledWith('message');
```

### Selective Function Mocking (importOriginal)

**Use When:**
- Want to mock some functions but keep others real
- Need real implementation of utility functions

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts` (lines 36-44)

```typescript
// Mock the task-utils module - use importOriginal to get real getDependencies implementation
vi.mock('../../../src/utils/task-utils.js', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../../src/utils/task-utils.js')>();
  return {
    ...actual,  // Keep all real functions
    getNextPendingItem: vi.fn(),  // Only mock specific function
  };
});
```

---

## Patterns for Testing Files are NOT Modified

### Pattern 1: Verify File Write Not Called

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-batching.test.ts` (lines 620-625)

```typescript
it('should not write tasks.json immediately after updateItemStatus', async () => {
  // SETUP
  const { mockManager } = setupTest();
  const subtask = createTestSubtask('P1.M1.T1.S1');

  // EXECUTE
  await mockManager.updateItemStatus(subtask.id, 'InProgress');

  // VERIFY - No immediate write due to batching
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();
});
```

### Pattern 2: Filter Protected Files from Git Operations

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` (lines 56-98)

```typescript
describe('filterProtectedFiles', () => {
  it('should remove protected files from array', () => {
    // SETUP
    const files = [
      'src/index.ts',
      'tasks.json',
      'src/utils.ts',
      'PRD.md',
      'README.md',
      'prd_snapshot.md',
    ];

    // EXECUTE
    const result = filterProtectedFiles(files);

    // VERIFY
    expect(result).toEqual(['src/index.ts', 'src/utils.ts', 'README.md']);
    expect(result).not.toContain('tasks.json');
    expect(result).not.toContain('PRD.md');
    expect(result).not.toContain('prd_snapshot.md');
  });

  it('should handle files with paths (use basename)', () => {
    // SETUP
    const files = [
      'src/index.ts',
      'plan/session/tasks.json',
      'plan/session/PRD.md',
      'src/utils.ts',
      'session/prd_snapshot.md',
    ];

    // EXECUTE
    const result = filterProtectedFiles(files);

    // VERIFY
    expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
  });
});
```

### Pattern 3: Verify Protected Files Not Committed

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts` (lines 392-450)

```typescript
describe('protected files filtering', () => {
  it('should not commit tasks.json', async () => {
    // SETUP: Mock git status to return protected files
    mockGitStatus.mockResolvedValue({
      success: true,
      modified: ['src/index.ts', 'tasks.json'],
      untracked: [],
    });
    mockGitAdd.mockResolvedValue({ success: true, stagedCount: 1 });
    mockGitCommit.mockResolvedValue({ success: true, commitHash: 'abc123' });

    // EXECUTE: Call smartCommit directly
    await smartCommit(sessionPath, 'Test commit');

    // VERIFY: gitAdd was called without tasks.json
    expect(mockGitAdd).toHaveBeenCalledWith({
      path: sessionPath,
      files: ['src/index.ts'], // No tasks.json
    });
  });

  it('should not commit PRD.md', async () => {
    // SETUP
    mockGitStatus.mockResolvedValue({
      success: true,
      modified: [],
      untracked: ['src/utils.ts', 'PRD.md'],
    });
    mockGitAdd.mockResolvedValue({ success: true, stagedCount: 1 });
    mockGitCommit.mockResolvedValue({ success: true, commitHash: 'abc123' });

    // EXECUTE
    await smartCommit(sessionPath, 'Test commit');

    // VERIFY
    expect(mockGitAdd).toHaveBeenCalledWith({
      path: sessionPath,
      files: ['src/utils.ts'], // No PRD.md
    });
  });
});
```

### Pattern 4: Test File Write Prevention

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/build-logger.test.ts` (lines 98-124)

```typescript
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

  // No file operations should have been attempted
  expect(mockAccess).not.toHaveBeenCalled();
  expect(mockReadFile).not.toHaveBeenCalled();
  expect(mockWriteFile).not.toHaveBeenCalled();
  expect(mockRevparse).not.toHaveBeenCalled();
});
```

---

## Patterns for Verifying Operations Were NOT Called

### Pattern 1: Basic Not Called Verification

**Location:** Multiple files

```typescript
// Verify function was never called
expect(mockGitAdd).not.toHaveBeenCalled();
expect(mockGitCommit).not.toHaveBeenCalled();

// Verify function was not called with specific arguments
expect(mockLogger.info).not.toHaveBeenCalledWith('completed');
```

### Pattern 2: Conditional Not Called Verification

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` (lines 276-291)

```typescript
it('should return null when no files to commit after filtering', async () => {
  // SETUP
  mockGitStatus.mockResolvedValue({
    success: true,
    modified: ['tasks.json'],
    untracked: ['PRD.md'],
  });

  // EXECUTE
  const result = await smartCommit('/project', 'Test commit');

  // VERIFY
  expect(result).toBeNull();
  expect(mockGitAdd).not.toHaveBeenCalled();
  expect(mockGitCommit).not.toHaveBeenCalled();
});
```

### Pattern 3: Early Exit Not Called Verification

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` (lines 309-317)

```typescript
it('should return null for empty sessionPath', async () => {
  // EXECUTE
  const result = await smartCommit('', 'Test commit');

  // VERIFY
  expect(result).toBeNull();
  expect(mockGitStatus).not.toHaveBeenCalled();
});
```

### Pattern 4: Error Path Not Called Verification

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` (lines 360-374)

```typescript
it('should return null when git status fails', async () => {
  // SETUP
  mockGitStatus.mockResolvedValue({
    success: false,
    error: 'Git status failed',
  });

  // EXECUTE
  const result = await smartCommit('/project', 'Test commit');

  // VERIFY
  expect(result).toBeNull();
  expect(mockGitAdd).not.toHaveBeenCalled();
  expect(mockGitCommit).not.toHaveBeenCalled();
});
```

### Pattern 5: Multiple Not Called Verification

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/build-logger.test.ts` (lines 120-123)

```typescript
// No file operations should have been attempted
expect(mockAccess).not.toHaveBeenCalled();
expect(mockReadFile).not.toHaveBeenCalled();
expect(mockWriteFile).not.toHaveBeenCalled();
expect(mockRevparse).not.toHaveBeenCalled();
```

---

## Mock Setup and Teardown Patterns

### Pattern 1: Global beforeEach/afterEach

**Location:** `/home/dustin/projects/hacky-hack/tests/setup.ts` (lines 162-229)

```typescript
beforeEach(() => {
  // CLEANUP: Clear all mock call histories before each test
  vi.clearAllMocks();

  // SAFEGUARD: Validate API endpoint before each test
  validateApiEndpoint();

  // REJECTION TRACKING: Reset unhandled rejections array
  unhandledRejections = [];
  unhandledRejectionHandler = (reason: unknown) => {
    unhandledRejections.push(reason);
  };
  process.on('unhandledRejection', unhandledRejectionHandler);
});

afterEach(() => {
  // REJECTION TRACKING: Clean up handler and check for unhandled rejections
  if (unhandledRejectionHandler) {
    process.removeListener('unhandledRejection', unhandledRejectionHandler);
    unhandledRejectionHandler = null;
  }

  // CLEANUP: Restore all environment variable stubs
  vi.unstubAllEnvs();

  // CLEANUP: Force garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

### Pattern 2: Test Suite beforeEach/afterEach

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` (lines 66-77)

```typescript
describe('tools/git-mcp', () => {
  beforeEach(() => {
    // Restore default mock implementations
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation(
      (path: unknown) => (path as string) ?? ''
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
```

### Pattern 3: Reset Mock Implementations

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` (lines 46-54)

```typescript
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  // Clear mock logger calls
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.debug.mockClear();
});
```

### Pattern 4: Clear Shared State

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/build-logger.test.ts` (lines 72-91)

```typescript
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
```

---

## Advanced Mocking Patterns

### Pattern 1: Mock ChildProcess for Bash Commands

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts` (lines 88-133)

```typescript
/**
 * Creates a realistic mock of Node.js ChildProcess that emits
 * data events and closes with the specified exit code.
 */
function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        // Simulate async close
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

### Pattern 2: Mock Class Constructor

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts` (lines 59-75)

```typescript
// Mock the PRPRuntime class
vi.mock('../../src/agents/prp-runtime.js', () => ({
  PRPRuntime: vi.fn().mockImplementation(() => ({
    executeSubtask: vi.fn().mockResolvedValue({
      success: true,
      validationResults: [
        {
          level: 'Gate 1: Compilation',
          passed: true,
          details: 'Code compiles successfully',
        },
      ],
      artifacts: [],
      error: undefined,
      fixAttempts: 0,
    }),
  })),
}));
```

### Pattern 3: Dynamic Mock Implementation

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/bug-hunt-workflow-integration.test.ts` (lines 185-196)

```typescript
it('should call agent factories in correct order', async () => {
  // SETUP: Track call order
  const callOrder: string[] = [];
  const mockAgent = {
    prompt: vi.fn().mockResolvedValue(expectedResults),
  };
  mockCreateQAAgent.mockImplementation(() => {
    callOrder.push('createQAAgent');
    return mockAgent;
  });
  mockCreateBugHuntPrompt.mockImplementation(() => {
    callOrder.push('createBugHuntPrompt');
    return { user: 'prompt', system: 'system' };
  });

  // EXECUTE
  await workflow.run();

  // VERIFY: Check order
  expect(callOrder).toEqual(['createQAAgent', 'createBugHuntPrompt']);
});
```

### Pattern 4: Async Mock with Timing Control

```typescript
// Simulate async operation with timing
mockWriteFile.mockImplementation(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return undefined;
});

// Use fake timers for testing
vi.useFakeTimers();
await testFunction();
await vi.runAllTimersAsync();
vi.useRealTimers();
```

---

## Gotchas and Limitations

### 1. Mock Hoisting Order

**Gotcha:** `vi.mock()` calls are hoisted to the top of the file and must come before imports.

**Solution:** Always place `vi.mock()` at the top of the file, before any imports.

```typescript
// CORRECT
vi.mock('simple-git', () => ({ ... }));
import { simpleGit } from 'simple-git';

// INCORRECT - will cause errors
import { simpleGit } from 'simple-git';
vi.mock('simple-git', () => ({ ... }));
```

### 2. vi.hoisted() Required for Shared State

**Gotcha:** Cannot share variables across multiple `vi.mock()` calls without `vi.hoisted()`.

**Solution:** Use `vi.hoisted()` to create variables before mocks.

```typescript
// CORRECT
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn() },
}));
vi.mock('./logger', () => ({ getLogger: () => mockLogger }));

// INCORRECT - mockLogger will be undefined
const mockLogger = { info: vi.fn() };
vi.mock('./logger', () => ({ getLogger: () => mockLogger }));
```

### 3. Type-Safe Mock Access

**Gotcha:** Direct mock access loses type safety.

**Solution:** Use `vi.mocked()` to cast mocks to proper types.

```typescript
import { readFile } from 'node:fs/promises';

// Type-safe mock access
const mockReadFile = vi.mocked(readFile);
mockReadFile.mockResolvedValue('content');
```

### 4. Module-Level vs Function Mock Conflicts

**Gotcha:** Cannot mix module-level mocks with function-level spies on same module.

**Solution:** Choose one approach per module and be consistent.

### 5. Mock Implementation Persistence

**Gotcha:** Mock implementations persist across tests if not cleared.

**Solution:** Always clear mocks in `beforeEach` or `afterEach`.

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 6. ESM Import Order Issues

**Gotcha:** Dynamic imports in mocks can cause import order issues.

**Solution:** Use `require()` for dynamic imports within mocks, or use `importOriginal`.

```typescript
vi.mock('./module.js', () => ({
  func: vi.fn((path: string) =>
    !['tasks.json', 'PRD.md'].includes(
      require('node:path').basename(path)  // Use require() in mocks
    )
  ),
}));
```

### 7. Real File System Leaks in Integration Tests

**Gotcha:** Integration tests using real file system can leave artifacts.

**Solution:** Always use temp directories and clean up in `afterEach`.

```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(tmpdir() + '/test-');
});

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
```

### 8. Git Repository State Leaks

**Gotcha:** Git operations in tests can affect actual repository if not mocked properly.

**Solution:** Always verify git operations are mocked before running tests.

```typescript
// Verify git is mocked
expect(mockGitInstance.status).toBeDefined();
```

### 9. Async Timing Issues

**Gotcha:** Mocked async operations may resolve faster/slower than real operations.

**Solution:** Use proper async/await and consider fake timers for timing-dependent tests.

```typescript
// Always await async operations
await testFunction();

// For timing-dependent tests
vi.useFakeTimers();
// ... test code ...
await vi.runAllTimersAsync();
vi.useRealTimers();
```

### 10. Protected File Basename Matching

**Gotcha:** Path matching for protected files must use basename, not full path.

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` (lines 100-115)

```typescript
it('should handle files with paths (use basename)', () => {
  // SETUP
  const files = [
    'src/index.ts',
    'plan/session/tasks.json',  // Should be filtered
    'plan/session/PRD.md',      // Should be filtered
    'src/utils.ts',
    'session/prd_snapshot.md',  // Should be filtered
  ];

  // EXECUTE
  const result = filterProtectedFiles(files);

  // VERIFY - only non-protected files remain
  expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
});
```

---

## Key Test Files Reference

### Git Operation Tests

| File Path | Lines | Description |
|-----------|-------|-------------|
| `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` | 1-860 | Unit tests for Git MCP tool operations |
| `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` | 1-603 | Unit tests for smart commit with protected file filtering |
| `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts` | 1-629 | Integration tests for smart commit workflow |

### File Operation Tests

| File Path | Lines | Description |
|-----------|-------|-------------|
| `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts` | 1-736 | Unit tests for Filesystem MCP tool |
| `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts` | 1-200+ | Unit tests for Bash MCP with child process mocking |
| `/home/dustin/projects/hacky-hack/tests/unit/utils/build-logger.test.ts` | 1-150+ | Unit tests with shared file system state |
| `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts` | 1-200+ | Integration tests for all MCP tools |
| `/home/dustin/projects/hacky-hack/tests/integration/core/session-structure.test.ts` | 1-200+ | Integration tests with real temp file system |

### Mock Setup and Patterns

| File Path | Lines | Description |
|-----------|-------|-------------|
| `/home/dustin/projects/hacky-hack/tests/setup.ts` | 1-230 | Global test setup with mock cleanup |
| `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts` | 1-200+ | Complex mocking patterns for orchestration |

### NOT Called Verification Examples

| File Path | Lines | Pattern |
|-----------|-------|---------|
| `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` | 289-290, 304-305 | Verify git operations not called on early exit |
| `/home/dustin/projects/hacky-hack/tests/unit/utils/build-logger.test.ts` | 120-123 | Multiple file operations not called |
| `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-batching.test.ts` | 622, 635 | Verify delayed writes not called immediately |

---

## Summary of Best Practices

1. **Always mock at module level before imports** for external dependencies
2. **Use vi.hoisted()** for shared state across mocks
3. **Use vi.mocked()** for type-safe mock access
4. **Clear mocks in beforeEach** to prevent test pollution
5. **Use temp directories** for integration tests with real file system
6. **Verify both positive and negative cases** (called vs not called)
7. **Test protected file filtering** with basename matching
8. **Mock error conditions** with proper error codes (ENOENT, EACCES, etc.)
9. **Use fake timers** for timing-dependent async tests
10. **Clean up resources** in afterEach hooks

---

## Appendix: Protected File Reference

### Current Protected Files

From `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts`:

```typescript
const PROTECTED_FILES = [
  'tasks.json',
  'PRD.md',
  'prd_snapshot.md',
];
```

### Filter Function Pattern

```typescript
function filterProtectedFiles(files: string[]): string[] {
  const PROTECTED_BASENAMES = ['tasks.json', 'PRD.md', 'prd_snapshot.md'];
  return files.filter(file => {
    const basename = require('node:path').basename(file);
    return !PROTECTED_BASENAMES.includes(basename);
  });
}
```

### Usage in Smart Commit

```typescript
// Get all changed files
const allFiles = [...modified, ...untracked];

// Filter out protected files
const filesToCommit = filterProtectedFiles(allFiles);

// Only stage non-protected files
if (filesToCommit.length > 0) {
  await gitAdd({ path, files: filesToCommit });
}
```

---

**End of Research Document**

This document provides comprehensive patterns for mocking git and file operations in the hacky-hack project. Use these patterns to write effective tests for protected file enforcement in the Write MCP tool.
