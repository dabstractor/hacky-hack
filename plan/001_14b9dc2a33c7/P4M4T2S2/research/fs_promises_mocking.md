# Best Practices for Mocking Node.js fs/promises in TypeScript/Vitest

**Research Document:** P4M4T2S2
**Date:** 2026-01-13
**Focus:** Mocking `fs/promises` functions (readFile, writeFile, mkdir) in TypeScript with Vitest

---

## Table of Contents

1. [Best Practices for Mocking fs/promises Functions](#1-best-practices-for-mocking-fspromises-functions)
2. [Testing Error Handling with Specific errno Codes](#2-testing-error-handling-with-specific-errno-codes)
3. [Verifying File Path Resolution and Normalization](#3-verifying-file-path-resolution-and-normalization)
4. [Common Pitfalls When Testing File System Operations](#4-common-pitfalls-when-testing-file-system-operations)
5. [Vitest-Specific Patterns for fs Mocking](#5-vitest-specific-patterns-for-fs-mocking)
6. [Recommended Libraries and Tools](#6-recommended-libraries-and-tools)

---

## 1. Best Practices for Mocking fs/promises Functions

### 1.1 Use `vi.mock()` for Module-Level Mocking

The most common and recommended approach is to mock the entire `fs/promises` module at the top of your test file:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Import mocked functions
import { readFile, writeFile, mkdir } from 'node:fs/promises';

describe('File operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read a file', async () => {
    // Setup mock return value
    vi.mocked(readFile).mockResolvedValueOnce('file content');

    // Test code here
    const result = await readFile('test.txt', 'utf-8');

    // Verify
    expect(result).toBe('file content');
    expect(readFile).toHaveBeenCalledWith('test.txt', 'utf-8');
  });
});
```

**Benefits:**
- Complete isolation from real filesystem
- Consistent mocking across all tests
- Easy to reset with `vi.clearAllMocks()`

### 1.2 Use `vi.mocked()` for TypeScript Type Safety

Vitest provides `vi.mocked()` to properly type mocked functions in TypeScript:

```typescript
import { readFile } from 'node:fs/promises';

vi.mock('node:fs/promises');

test('type-safe mocking', async () => {
  // Without vi.mocked(), TypeScript doesn't know about mock methods
  vi.mocked(readFile).mockResolvedValueOnce('content');

  // Now you get autocomplete and type checking
  expect(vi.mocked(readFile).mock.calls).toHaveLength(1);
});
```

### 1.3 Mock at Different Levels Based on Need

#### Module-Level Mocking (Recommended for Most Cases)

```typescript
// Mock entire module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));
```

#### Function-Level Mocking with `vi.spyOn()`

Useful when you only want to mock specific functions while keeping others real:

```typescript
import * as fs from 'node:fs/promises';

test('spy on specific function', async () => {
  const spy = vi.spyOn(fs, 'readFile').mockResolvedValue('content');

  // Test code

  spy.mockRestore(); // Important: restore after test
});
```

#### Partial Mocking with Original Implementation

```typescript
import * as fs from 'node:fs/promises';

test('partial mock with original', async () => {
  // Mock writeFile but keep readFile real
  vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

  // readFile still uses real implementation
  const content = await fs.readFile('real-file.txt', 'utf-8');
});
```

### 1.4 Use Factory Functions for Test Data

From the codebase analysis, this pattern ensures consistent test data:

```typescript
// Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
) => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

test('uses factory for test data', async () => {
  const subtask = createTestSubtask('S1', 'Test', 'Planned');
  // Use subtask in test
});
```

---

## 2. Testing Error Handling with Specific errno Codes

### 2.1 Creating errno Errors

Node.js filesystem errors include specific error codes. Create them properly:

```typescript
import type { NodeJS.ErrnoException } from 'node:errno';

describe('Error handling', () => {
  it('should handle ENOENT (file not found)', async () => {
    // Create ENOENT error
    const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    error.errno = -2;
    error.path = '/nonexistent/file.txt';

    vi.mocked(readFile).mockRejectedValueOnce(error);

    // Test your error handling
    await expect(readFile('/nonexistent/file.txt')).rejects.toThrow();
  });

  it('should handle EACCES (permission denied)', async () => {
    const error = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    error.errno = -13;

    vi.mocked(readFile).mockRejectedValueOnce(error);

    await expect(readFile('/protected/file.txt')).rejects.toThrow();
  });

  it('should handle EISDIR (is a directory)', async () => {
    const error = new Error('EISDIR: illegal operation on a directory') as NodeJS.ErrnoException;
    error.code = 'EISDIR';
    error.errno = -21;

    vi.mocked(readFile).mockRejectedValueOnce(error);

    await expect(readFile('/directory/path')).rejects.toThrow();
  });
});
```

### 2.2 Common errno Codes for Filesystem Testing

| Code | errno | Description |
|------|-------|-------------|
| `ENOENT` | -2 | No such file or directory |
| `EACCES` | -13 | Permission denied |
| `EISDIR` | -21 | Is a directory |
| `ENOTDIR` | -20 | Not a directory |
| `EEXIST` | -17 | File exists |
| `ENOSPC` | -28 | No space left on device |
| `EROFS` | -30 | Read-only file system |

### 2.3 Testing Error Propagation

From the codebase example (`session-manager.test.ts`), test that errors are properly wrapped and propagated:

```typescript
it('should propagate SessionFileError from readTasksJSON', async () => {
  const error = new SessionFileError(
    '/plan/001_14b9dc2a33c7/tasks.json',
    'read tasks.json'
  );
  mockReadTasksJSON.mockRejectedValue(error);

  const manager = new SessionManager('/test/PRD.md');
  await manager.initialize();

  await expect(manager.loadBacklog()).rejects.toThrow(SessionFileError);
});
```

### 2.4 Testing Graceful Error Handling

Test that your code handles expected errors gracefully:

```typescript
it('should handle ENOENT when directory does not exist', async () => {
  const error = new Error('ENOENT') as NodeJS.ErrnoException;
  error.code = 'ENOENT';
  mockReaddir.mockRejectedValue(error);

  // Should handle gracefully (e.g., create directory)
  const sessions = await SessionManager.listSessions('/test/plan');

  expect(sessions).toEqual([]);
});
```

---

## 3. Verifying File Path Resolution and Normalization

### 3.1 Testing Path Resolution

Verify that relative paths are resolved to absolute paths:

```typescript
import { resolve } from 'node:path';

test('should resolve relative paths to absolute paths', () => {
  mockStatSync.mockReturnValue({ isFile: () => true });

  const manager = new SessionManager('./PRD.md');

  expect(manager.prdPath).toMatch(/^\/.*PRD\.md$/);
});

test('should use resolve() for path joining', async () => {
  const sessionPath = resolve(sessionDir, 'tasks.json');

  mockReadFile.mockResolvedValue('{"backlog":[]}');

  await loadTasksJSON(sessionDir);

  expect(mockReadFile).toHaveBeenCalledWith(
    expect.stringMatching(/\/tasks\.json$/),
    'utf-8'
  );
});
```

### 3.2 Testing Path Normalization

Ensure paths are normalized (no duplicate slashes, resolved `..`, etc.):

```typescript
test('should normalize file paths', () => {
  const inputPath = '/test/../test/./dir/file.txt';
  const normalizedPath = resolve(inputPath);

  expect(normalizedPath).toBe('/test/dir/file.txt');
});
```

### 3.3 Verifying Path Construction

Test that complex paths are built correctly:

```typescript
test('should construct session directory path correctly', async () => {
  const prdPath = '/test/PRD.md';
  const sequence = 1;
  const hash = '14b9dc2a33c7';

  const sessionId = `${String(sequence).padStart(3, '0')}_${hash}`;
  const sessionPath = resolve('plan', sessionId);

  expect(sessionPath).toMatch(/plan\/001_14b9dc2a33c7$/);
});
```

### 3.4 Using Path Matchers in Assertions

Use Vitest's matchers to verify path patterns:

```typescript
test('should write to correct path pattern', async () => {
  await writeFile('/session/path/prd_snapshot.md', 'content');

  expect(mockWriteFile).toHaveBeenCalledWith(
    expect.stringMatching(/\/prd_snapshot\.md$/),
    'content',
    { mode: 0o644 }
  );
});
```

---

## 4. Common Pitfalls When Testing File System Operations

### 4.1 Forgetting to Clear Mocks Between Tests

**Problem:** Mocks persist between tests, causing false positives/negatives.

**Solution:** Always clear mocks in `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 4.2 Mock Implementation Mismatch

**Problem:** Mock returns different type than real implementation.

**Solution:** Ensure mocks match real function signatures:

```typescript
// BAD: Returns string when real function returns Buffer
vi.mocked(readFile).mockResolvedValue('content');

// GOOD: Match the signature
vi.mocked(readFile).mockResolvedValue(Buffer.from('content'));

// OR specify encoding
vi.mocked(readFile).mockResolvedValue('content'); // when called with 'utf-8'
```

### 4.3 Not Restoring Spies

**Problem:** `vi.spyOn()` modifications persist after tests.

**Solution:** Always restore spies:

```typescript
test('spy on function', () => {
  const spy = vi.spyOn(fs, 'readFile').mockResolvedValue('content');

  // Test code

  spy.mockRestore(); // Essential!
});
```

### 4.4 Testing with Real Filesystem

**Problem:** Tests use real I/O, making them slow and unreliable.

**Solution:** Always mock fs operations:

```typescript
// BAD: Real I/O
test('reads real file', async () => {
  const content = await fs.readFile('/tmp/test.txt');
});

// GOOD: Mocked I/O
vi.mock('node:fs/promises');
test('reads mocked file', async () => {
  vi.mocked(fs.readFile).mockResolvedValue('mocked content');
  const content = await fs.readFile('/tmp/test.txt');
  expect(content).toBe('mocked content');
});
```

### 4.5 Ignoring Encoding Parameter

**Problem:** Not testing with different encodings.

**Solution:** Test encoding parameter:

```typescript
test('should read file with utf-8 encoding', async () => {
  vi.mocked(readFile).mockResolvedValue('content');

  await readFile('test.txt', 'utf-8');

  expect(readFile).toHaveBeenCalledWith('test.txt', 'utf-8');
});

test('should read file as buffer', async () => {
  vi.mocked(readFile).mockResolvedValue(Buffer.from('content'));

  await readFile('test.txt');

  expect(readFile).toHaveBeenCalledWith('test.txt');
});
```

### 4.6 Not Testing Atomic Operations

**Problem:** Not testing write safety (atomic writes).

**Solution:** From the codebase example, test atomic write pattern:

```typescript
test('should write file atomically (temp file + rename)', async () => {
  const tempPath = resolve(dirname(targetPath), `.${basename(targetPath)}.tmp`);

  // Write to temp file first
  mockWriteFile.mockResolvedValueOnce(undefined);
  mockRename.mockResolvedValueOnce(undefined);

  await atomicWrite(targetPath, 'content');

  expect(mockWriteFile).toHaveBeenCalledWith(tempPath, 'content', { mode: 0o644 });
  expect(mockRename).toHaveBeenCalledWith(tempPath, targetPath);
});
```

### 4.7 Missing Error Cleanup

**Problem:** Not cleaning up temp files on error.

**Solution:** Test cleanup on error:

```typescript
test('should clean up temp file on write error', async () => {
  mockWriteFile.mockRejectedValue(new Error('Write failed'));
  mockUnlink.mockResolvedValue(undefined);

  await expect(atomicWrite(targetPath, 'content')).rejects.toThrow();

  expect(mockUnlink).toHaveBeenCalledWith(tempPath);
});
```

---

## 5. Vitest-Specific Patterns for fs Mocking

### 5.1 Using `vi.mocked()` for Type Safety

```typescript
import { readFile } from 'node:fs/promises';
vi.mock('node:fs/promises');

test('type-safe mock', () => {
  vi.mocked(readFile).mockResolvedValue('content');

  // TypeScript knows about mock methods
  expect(vi.mocked(readFile).mock.calls.length).toBeGreaterThan(0);
});
```

### 5.2 Mock Implementation Patterns

#### Simple Return Value

```typescript
vi.mocked(readFile).mockResolvedValue('content');
```

#### Conditional Return Values

```typescript
vi.mocked(readFile).mockImplementation((path, encoding) => {
  if (path.includes('error')) {
    return Promise.reject(new Error('Test error'));
  }
  return Promise.resolve('default content');
});
```

#### Sequential Return Values

```typescript
vi.mocked(readFile)
  .mockResolvedValueOnce('first call')
  .mockResolvedValueOnce('second call')
  .mockResolvedValue('default');
```

### 5.3 Verifying Call Patterns

```typescript
test('should verify call count and arguments', () => {
  vi.mocked(readFile).mockResolvedValue('content');

  await readFile('file1.txt', 'utf-8');
  await readFile('file2.txt', 'utf-8');

  expect(readFile).toHaveBeenCalledTimes(2);
  expect(readFile).toHaveBeenNthCalledWith(1, 'file1.txt', 'utf-8');
  expect(readFile).toHaveBeenNthCalledWith(2, 'file2.txt', 'utf-8');
});
```

### 5.4 Testing Multiple Calls with Different Args

```typescript
test('should handle multiple file reads', async () => {
  mockReadFile
    .mockResolvedValueOnce('# PRD')
    .mockResolvedValueOnce('001_parent_hash')
    .mockResolvedValueOnce('{"backlog":[]}');

  await loadSession('/plan/001_hash');

  expect(mockReadFile).toHaveBeenCalledTimes(3);
  expect(mockReadFile).toHaveBeenNthCalledWith(1, expect.stringMatching(/prd_snapshot\.md$/), 'utf-8');
  expect(mockReadFile).toHaveBeenNthCalledWith(2, expect.stringMatching(/parent_session\.txt$/), 'utf-8');
  expect(mockReadFile).toHaveBeenNthCalledWith(3, expect.stringMatching(/tasks\.json$/), 'utf-8');
});
```

### 5.5 Using `beforeEach` for Mock Setup

```typescript
describe('File operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock behavior
    mockStatSync.mockReturnValue({ isFile: () => true });
    mockReadFile.mockResolvedValue('default content');
    mockWriteFile.mockResolvedValue(undefined);
  });

  it('should use default mocks', async () => {
    const result = await readFile('test.txt');
    expect(result).toBe('default content');
  });

  it('can override defaults', async () => {
    mockReadFile.mockResolvedValueOnce('special content');
    const result = await readFile('test.txt');
    expect(result).toBe('special content');
  });
});
```

### 5.6 Testing Async Error Scenarios

```typescript
test('should handle async errors', async () => {
  const error = new Error('Async error') as NodeJS.ErrnoException;
  error.code = 'ENOENT';
  vi.mocked(readFile).mockRejectedValue(error);

  await expect(readFile('test.txt')).rejects.toThrow('Async error');
});
```

---

## 6. Recommended Libraries and Tools

### 6.1 memfs - In-Memory Filesystem

**URL:** https://github.com/streamich/memfs

**Description:** Creates a fully in-memory filesystem that implements the Node.js `fs` API. Useful for more realistic testing than simple mocks.

```typescript
import { vol } from 'memfs';

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    '/test/file.txt': 'content',
    '/test/dir/nested.json': '{"key":"value"}',
  });
});

test('reads from memfs', async () => {
  const content = await fs.readFile('/test/file.txt', 'utf-8');
  expect(content).toBe('content');
});
```

**Pros:**
- Real filesystem behavior without real I/O
- Supports most fs operations
- Fast and isolated

**Cons:**
- More setup than simple mocks
- May not match exact Node.js behavior

### 6.2 mock-fs - Mock Filesystem

**URL:** https://github.com/tschaub/mock-fs

**Description:** Mocks the filesystem in memory, intercepting calls to `fs` module.

```typescript
import mock from 'mock-fs';

beforeEach(() => {
  mock({
    'test-dir': {
      'file.txt': 'test content',
      'subdir': {
        'nested.json': '{"data": true}',
      },
    },
  });
});

afterEach(() => {
  mock.restore();
});
```

**Pros:**
- Simple API
- Works with both `fs` and `fs/promises`
- Good for complex directory structures

**Cons:**
- May have compatibility issues with some Node.js versions
- Less actively maintained than memfs

### 6.3 Vitest Built-in Mocking

**URL:** https://vitest.dev/guide/mocking.html

**Description:** Vitest's built-in mocking utilities (`vi.mock()`, `vi.spyOn()`, etc.) are sufficient for most cases.

**Pros:**
- No additional dependencies
- Type-safe with TypeScript
- Fast and lightweight
- Integrated with Vitest

**Cons:**
- More manual setup for complex scenarios
- Need to mock each function individually

### 6.4 When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| Simple file read/write | `vi.mock()` |
| Testing error handling | `vi.mock()` with custom errors |
| Complex directory operations | memfs or mock-fs |
| Testing path resolution | `vi.mock()` with `expect.stringMatching()` |
| Integration tests | memfs for realistic behavior |
| Unit tests | `vi.mock()` for speed and isolation |

---

## 7. Code Examples from the Codebase

### 7.1 Comprehensive Test Setup Pattern

From `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts`:

```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Mock the node:fs module for synchronous operations
vi.mock('node:fs', () => ({
  statSync: vi.fn(),
  readdir: vi.fn(),
}));

// Import mocked modules
import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { statSync } from 'node:fs';

// Cast mocked functions
const mockReadFile = readFile as any;
const mockWriteFile = writeFile as any;
const mockStat = stat as any;
const mockReaddir = readdir as any;
const mockStatSync = statSync as any;

describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate PRD file exists synchronously', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager('/test/PRD.md');
    expect(mockStatSync).toHaveBeenCalledWith('/test/PRD.md');
    expect(manager.prdPath).toBe('/test/PRD.md');
  });

  it('should throw SessionFileError when PRD does not exist (ENOENT)', () => {
    const error = new Error('ENOENT: no such file') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockStatSync.mockImplementation(() => {
      throw error;
    });

    expect(() => new SessionManager('/test/PRD.md')).toThrow(SessionFileError);
    expect(() => new SessionManager('/test/PRD.md')).toThrow('validate PRD exists');
  });
});
```

### 7.2 Testing Multiple Sequential Calls

```typescript
it('should handle multiple sequential sessions', async () => {
  mockStatSync.mockReturnValue({ isFile: () => true });
  mockHashPRD.mockResolvedValue(MOCK_FULL_HASH);
  mockReadFile.mockResolvedValue('# PRD');
  mockWriteFile.mockResolvedValue(undefined);

  const manager = new SessionManager('/test/PRD.md');

  // Create first session
  mockReaddir.mockResolvedValue([]);
  mockCreateSessionDirectory.mockResolvedValue('/plan/001_14b9dc2a33c7');
  await manager.initialize();

  // Create second session
  const hash2 = 'a3f8e9d12b4aa5678901234567890abcdef1234567890abcdef1234567890abcdef';
  mockHashPRD.mockResolvedValueOnce(hash2);
  mockCreateSessionDirectory.mockResolvedValue('/plan/002_a3f8e9d12b4a');
  mockReadFile
    .mockResolvedValueOnce('# PRD')
    .mockResolvedValueOnce('# PRD v2');
  mockStat.mockResolvedValue({});

  await manager.createDeltaSession('/test/PRD.md');

  // Verify sequence numbers incremented
  expect(mockCreateSessionDirectory).toHaveBeenNthCalledWith(1, '/test/PRD.md', 1);
  expect(mockCreateSessionDirectory).toHaveBeenNthCalledWith(2, '/test/PRD.md', 2);
});
```

### 7.3 Testing Error Propagation Through Custom Error Classes

From `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`:

```typescript
export class SessionFileError extends Error {
  readonly path: string;
  readonly operation: string;
  readonly code?: string;

  constructor(path: string, operation: string, cause?: Error) {
    const err = cause as NodeJS.ErrnoException;
    super(`Failed to ${operation} at ${path}: ${err?.message ?? 'unknown error'}`);
    this.name = 'SessionFileError';
    this.path = path;
    this.operation = operation;
    this.code = err?.code;
  }
}
```

Test:

```typescript
it('should propagate SessionFileError from readTasksJSON', async () => {
  const error = new SessionFileError(
    '/plan/001_14b9dc2a33c7/tasks.json',
    'read tasks.json'
  );
  mockReadTasksJSON.mockRejectedValue(error);

  const manager = new SessionManager('/test/PRD.md');
  await manager.initialize();

  await expect(manager.loadBacklog()).rejects.toThrow(SessionFileError);
});
```

---

## 8. Summary and Recommendations

### 8.1 Key Takeaways

1. **Always mock fs operations** - Never use real I/O in tests
2. **Use `vi.mock()` for module-level mocking** - Most common and effective approach
3. **Use `vi.mocked()` for TypeScript** - Ensures type safety
4. **Clear mocks in `beforeEach`** - Prevents test interference
5. **Test error handling thoroughly** - Include ENOENT, EACCES, EISDIR
6. **Verify path resolution** - Use matchers like `expect.stringMatching()`
7. **Test atomic operations** - Verify temp file + rename patterns
8. **Use factory functions** - Create consistent test data

### 8.2 Recommended Testing Pattern

```typescript
// 1. Mock at module level
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// 2. Import and cast
import { readFile, writeFile } from 'node:fs/promises';
const mockReadFile = readFile as any;
const mockWriteFile = writeFile as any;

// 3. Clear mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  // Set up default behavior
  mockReadFile.mockResolvedValue('default content');
  mockWriteFile.mockResolvedValue(undefined);
});

// 4. Write tests
describe('File operations', () => {
  it('should handle success', async () => {
    mockReadFile.mockResolvedValueOnce('specific content');
    const result = await readFile('test.txt');
    expect(result).toBe('specific content');
  });

  it('should handle ENOENT', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValueOnce(error);
    await expect(readFile('test.txt')).rejects.toThrow();
  });
});
```

### 8.3 Resources

- **Vitest Mocking Documentation:** https://vitest.dev/guide/mocking.html
- **Vitest API Reference:** https://vitest.dev/api/vi.html
- **Node.js fs Documentation:** https://nodejs.org/api/fs.html
- **Node.js Error Codes:** https://nodejs.org/api/errors.html#errors_common_system_errors
- **memfs:** https://github.com/streamich/memfs
- **mock-fs:** https://github.com/tschaub/mock-fs

---

**End of Research Document**
