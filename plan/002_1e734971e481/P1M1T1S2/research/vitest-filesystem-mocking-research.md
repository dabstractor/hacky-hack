# Vitest Filesystem Mocking Research

**Research Date:** 2026-01-15
**Status:** Compiled from codebase analysis and best practices
**Purpose:** PRP creation reference for filesystem mocking patterns

---

## Executive Summary

This research document provides comprehensive guidance for mocking filesystem operations in TypeScript/Vitest tests. The patterns are compiled from existing test files in the hacky-hack codebase, demonstrating production-ready approaches for mocking `fs`, `fs/promises`, `crypto`, and other Node.js built-in modules.

---

## 1. Documentation Links

### Official Vitest Documentation

- **Vitest Guide**: https://vitest.dev/guide/
- **Mocking API**: https://vitest.dev/guide/mocking.html
- **Vitest API Reference**: https://vitest.dev/api/vi.html
- **Test Context**: https://vitest.dev/guide/test-context.html
- **GitHub Repository**: https://github.com/vitest-dev/vitest

### Related Resources

- **Node.js fs Documentation**: https://nodejs.org/api/fs.html
- **Node.js crypto Documentation**: https://nodejs.org/api/crypto.html
- **Vitest Examples**: https://github.com/vitest-dev/vitest/tree/main/examples

---

## 2. Basic vi.mock() Patterns

### 2.1 Mocking node:fs/promises

**Pattern:** Complete mock replacement for async file operations

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn(),
}));

// Import mocked modules
import {
  readFile,
  writeFile,
  mkdir,
  rename,
  unlink,
  stat,
} from 'node:fs/promises';

// Type assertions for mocked functions
const mockReadFile = readFile as any;
const mockWriteFile = writeFile as any;
const mockMkdir = mkdir as any;
const mockRename = rename as any;
const mockUnlink = unlink as any;
const mockStat = stat as any;

describe('file operations with mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read file content', async () => {
    // SETUP: Configure mock return value
    mockReadFile.mockResolvedValue('# Test PRD\n\nContent');

    // EXECUTE
    const content = await readFile('/test/path/PRD.md', 'utf-8');

    // VERIFY
    expect(mockReadFile).toHaveBeenCalledWith('/test/path/PRD.md', 'utf-8');
    expect(content).toBe('# Test PRD\n\nContent');
  });
});
```

**Real Example from:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`

### 2.2 Mocking node:fs (Sync Operations)

**Pattern:** Mock synchronous filesystem operations

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock node:fs for sync operations
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  mkdtempSync: vi.fn(),
  rmSync: vi.fn(),
  realpathSync: vi.fn(),
}));

import { existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';

const mockExistsSync = existsSync as any;
const mockReaddirSync = readdirSync as any;
const mockMkdtempSync = mkdtempSync as any;
const mockRmSync = rmSync as any;

describe('sync file operations', () => {
  it('should check if file exists', () => {
    mockExistsSync.mockReturnValue(true);

    const exists = existsSync('/test/path/file.txt');

    expect(exists).toBe(true);
    expect(mockExistsSync).toHaveBeenCalledWith('/test/path/file.txt');
  });

  it('should list directory contents', () => {
    const files = ['file1.txt', 'file2.txt', 'file3.txt'];
    mockReaddirSync.mockReturnValue(files);

    const result = readdirSync('/test/path');

    expect(result).toEqual(files);
    expect(mockReaddirSync).toHaveBeenCalledWith('/test/path');
  });
});
```

### 2.3 Partial Mocking with importActual

**Pattern:** Mock specific functions while keeping others real

```typescript
import { vi } from 'vitest';

// Mock only specific functions, keep others real
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    // Override only readFile
    readFile: vi.fn(),
  };
});

// Now readFile is mocked, but writeFile, mkdir, etc. work normally
```

**Real Example from:** `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`

---

## 3. Mocking Common Filesystem Operations

### 3.1 Mocking fs.readFile

```typescript
describe('fs.readFile patterns', () => {
  it('should mock successful file read', async () => {
    // SETUP: Return string content
    mockReadFile.mockResolvedValue('# Test PRD\n\nThis is content');

    // EXECUTE
    const content = await readFile('/test/PRD.md', 'utf-8');

    // VERIFY
    expect(content).toBe('# Test PRD\n\nThis is content');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
  });

  it('should mock file not found error', async () => {
    // SETUP: Create error with code
    const error = new Error('ENOENT: no such file') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    // EXECUTE & VERIFY
    await expect(readFile('/test/missing.md')).rejects.toThrow('ENOENT');
  });

  it('should mock permission error', async () => {
    // SETUP: Permission denied
    const error = new Error(
      'EACCES: permission denied'
    ) as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockReadFile.mockRejectedValue(error);

    // EXECUTE & VERIFY
    await expect(readFile('/test/protected.md')).rejects.toThrow('EACCES');
  });

  it('should return Buffer when no encoding specified', async () => {
    // SETUP: Return Buffer
    const buffer = Buffer.from('# Test PRD', 'utf-8');
    mockReadFile.mockResolvedValue(buffer);

    // EXECUTE
    const content = await readFile('/test/PRD.md');

    // VERIFY
    expect(Buffer.isBuffer(content)).toBe(true);
    expect(content.toString('utf-8')).toBe('# Test PRD');
  });
});
```

### 3.2 Mocking fs.writeFile

```typescript
describe('fs.writeFile patterns', () => {
  it('should mock successful file write', async () => {
    // SETUP: Resolve successfully
    mockWriteFile.mockResolvedValue(undefined);

    // EXECUTE
    await writeFile('/test/output.txt', 'Hello, World!', { mode: 0o644 });

    // VERIFY
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/test/output.txt',
      'Hello, World!',
      { mode: 0o644 }
    );
  });

  it('should mock write failure', async () => {
    // SETUP: Write fails
    const error = new Error('ENOSPC: no space left') as NodeJS.ErrnoException;
    error.code = 'ENOSPC';
    mockWriteFile.mockRejectedValue(error);

    // EXECUTE & VERIFY
    await expect(writeFile('/test/output.txt', 'content')).rejects.toThrow(
      'ENOSPC'
    );
  });

  it('should verify JSON serialization in write', async () => {
    mockWriteFile.mockResolvedValue(undefined);

    const data = { key: 'value', nested: { item: 123 } };
    await writeFile('/test/data.json', JSON.stringify(data));

    const writeCall = mockWriteFile.mock.calls[0];
    expect(writeCall[1]).toBe('{"key":"value","nested":{"item":123}}');
  });
});
```

### 3.3 Mocking fs.existsSync

```typescript
describe('fs.existsSync patterns', () => {
  it('should return true when file exists', () => {
    mockExistsSync.mockReturnValue(true);

    const exists = existsSync('/test/file.txt');

    expect(exists).toBe(true);
    expect(mockExistsSync).toHaveBeenCalledWith('/test/file.txt');
  });

  it('should return false when file does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    const exists = existsSync('/test/missing.txt');

    expect(exists).toBe(false);
  });

  it('should handle multiple paths with different results', () => {
    // Different results for different paths
    mockExistsSync.mockImplementation((path: string) => {
      if (path === '/test/exists.txt') return true;
      if (path === '/test/missing.txt') return false;
      return false;
    });

    expect(existsSync('/test/exists.txt')).toBe(true);
    expect(existsSync('/test/missing.txt')).toBe(false);
  });
});
```

### 3.4 Mocking fs.readdir / fs.readdirSync

```typescript
describe('fs.readdir patterns', () => {
  it('should mock directory listing', async () => {
    const files = ['file1.txt', 'file2.txt', 'subdir'];
    mockReadFile.mockResolvedValue(files as any); // For async version

    const result = await readdir('/test/path');

    expect(result).toEqual(files);
  });

  it('should return empty array for empty directory', () => {
    mockReaddirSync.mockReturnValue([]);

    const result = readdirSync('/test/empty');

    expect(result).toEqual([]);
  });

  it('should include subdirectories in listing', () => {
    const items = ['file.txt', 'subdir1', 'subdir2', '.hidden'];
    mockReaddirSync.mockReturnValue(items);

    const result = readdirSync('/test/mixed');

    expect(result).toHaveLength(4);
    expect(result).toContain('.hidden');
  });
});
```

### 3.5 Mocking fs.mkdir

```typescript
describe('fs.mkdir patterns', () => {
  it('should mock successful directory creation', async () => {
    mockMkdir.mockResolvedValue(undefined);

    await mkdir('/test/new-dir', { recursive: true });

    expect(mockMkdir).toHaveBeenCalledWith('/test/new-dir', {
      recursive: true,
    });
  });

  it('should handle EEXIST error gracefully', async () => {
    // Directory already exists
    const error = new Error(
      'EEXIST: directory already exists'
    ) as NodeJS.ErrnoException;
    error.code = 'EEXIST';
    mockMkdir.mockRejectedValue(error);

    // Code should handle this gracefully
    try {
      await mkdir('/test/existing');
    } catch (e) {
      expect((e as NodeJS.ErrnoException).code).toBe('EEXIST');
    }
  });

  it('should handle permission error', async () => {
    const error = new Error(
      'EACCES: permission denied'
    ) as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockMkdir.mockRejectedValue(error);

    await expect(mkdir('/root/protected')).rejects.toThrow('EACCES');
  });
});
```

---

## 4. Mocking Hash Generation (crypto.createHash)

### 4.1 Basic Hash Mocking

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock crypto module
vi.mock('node:crypto', () => ({
  createHash: vi.fn(),
  randomBytes: vi.fn(),
}));

import { createHash, randomBytes } from 'node:crypto';

const mockCreateHash = createHash as any;
const mockRandomBytes = randomBytes as any;

// Mock hash class
class MockHash {
  private data = '';

  update(content: string): this {
    this.data = content;
    return this;
  }

  digest(encoding: 'hex'): string {
    if (encoding === 'hex') {
      // Return consistent 64-character hex string (SHA-256)
      return '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123';
    }
    return '';
  }
}

describe('crypto.createHash patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default hash mock
    mockCreateHash.mockReturnValue(new MockHash());
  });

  it('should mock SHA-256 hash computation', async () => {
    const hashInstance = new MockHash();
    mockCreateHash.mockReturnValue(hashInstance);

    // EXECUTE: Create hash and update
    const hash = createHash('sha256');
    hash.update('content to hash');
    const result = hash.digest('hex');

    // VERIFY
    expect(mockCreateHash).toHaveBeenCalledWith('sha256');
    expect(result).toBe(
      '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123'
    );
    expect(result.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('should chain update calls', () => {
    const hashInstance = new MockHash();
    mockCreateHash.mockReturnValue(hashInstance);

    const hash = createHash('sha256');
    hash.update('part1').update('part2');
    const result = hash.digest('hex');

    expect(result).toBeDefined();
    expect(mockCreateHash).toHaveBeenCalledWith('sha256');
  });
});
```

**Real Example from:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`

### 4.2 Mocking randomBytes for Temp Files

```typescript
describe('crypto.randomBytes patterns', () => {
  it('should mock random bytes for temp file names', () => {
    // Setup: Return buffer with toString method
    mockRandomBytes.mockReturnValue({
      toString: (encoding: string) => 'abc123def',
    });

    const random = randomBytes(8);

    expect(mockRandomBytes).toHaveBeenCalledWith(8);
    expect(random.toString('hex')).toBe('abc123def');
  });

  it('should generate different random values', () => {
    let callCount = 0;
    mockRandomBytes.mockImplementation(() => ({
      toString: () => `random${callCount++}`,
    }));

    const r1 = randomBytes(8);
    const r2 = randomBytes(8);

    expect(r1.toString('hex')).toBe('random0');
    expect(r2.toString('hex')).toBe('random1');
  });
});
```

### 4.3 Testing Hash Consistency

```typescript
describe('hash consistency', () => {
  it('should produce same hash for same input', () => {
    const hash1 = createHash('sha256');
    hash1.update('test input');
    const result1 = hash1.digest('hex');

    const hash2 = createHash('sha256');
    hash2.update('test input');
    const result2 = hash2.digest('hex');

    expect(result1).toBe(result2);
  });

  it('should produce different hash for different input', () => {
    const hash1 = createHash('sha256');
    hash1.update('input A');
    const result1 = hash1.digest('hex');

    const hash2 = createHash('sha256');
    hash2.update('input B');
    const result2 = hash2.digest('hex');

    expect(result1).not.toBe(result2);
  });
});
```

---

## 5. Testing with Temp Directories

### 5.1 Real Temp Directory Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { onTestFinished } from 'vitest';

describe('real temp directory tests', () => {
  let tempDir: string;

  beforeAll(async () => {
    // Create temp directory
    tempDir = await mkdtemp(join(tmpdir(), 'vitest-'));
  });

  afterAll(async () => {
    // Cleanup temp directory
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should use temp directory for file operations', async () => {
    const testFile = join(tempDir, 'test.txt');

    // Perform real file operations
    await writeFile(testFile, 'content');
    const content = await readFile(testFile, 'utf-8');

    expect(content).toBe('content');
  });
});
```

### 5.2 onTestFinished Cleanup Pattern (Recommended)

```typescript
import { test, onTestFinished } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

test('with reliable cleanup', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'test-'));

  // Register cleanup immediately - runs even if test fails
  onTestFinished(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // Test code that uses tempDir
  await performOperationsIn(tempDir);

  // Cleanup happens automatically
});
```

**Real Example from:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T3S2/research/vitest-e2e-testing-research.md`

### 5.3 beforeEach/afterEach Pattern

```typescript
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('isolated temp directory tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Fresh temp directory for each test
    tempDir = await mkdtemp(join(tmpdir(), 'vitest-'));
  });

  afterEach(async () => {
    // Cleanup after each test
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('test 1: isolated operations', async () => {
    const file = join(tempDir, 'test1.txt');
    await writeFile(file, 'content 1');

    expect(await readFile(file, 'utf-8')).toBe('content 1');
  });

  it('test 2: completely isolated', async () => {
    // Different tempDir from test 1
    const file = join(tempDir, 'test2.txt');
    await writeFile(file, 'content 2');

    expect(await readFile(file, 'utf-8')).toBe('content 2');
    // Test 1's files don't exist here
  });
});
```

---

## 6. Atomic Write Pattern Testing

### 6.1 Testing Atomic Writes (Temp File + Rename)

```typescript
describe('atomic write pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);
    mockRandomBytes.mockReturnValue({
      toString: () => 'tmp123',
    });
  });

  it('should use temp file then rename', async () => {
    // EXECUTE: Function using atomic write pattern
    await atomicWrite('/test/target.json', '{"data":"value"}');

    // VERIFY: Write to temp file first
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.tmp$/),
      expect.any(String),
      { mode: 0o644 }
    );

    // VERIFY: Rename temp to target
    const tempPath = mockWriteFile.mock.calls[0][0];
    expect(mockRename).toHaveBeenCalledWith(tempPath, '/test/target.json');
  });

  it('should clean up temp file on write failure', async () => {
    // SETUP: Write fails
    mockWriteFile.mockRejectedValue(new Error('ENOSPC'));

    // EXECUTE
    await expect(atomicWrite('/test/target.json', '{}')).rejects.toThrow();

    // VERIFY: Cleanup attempted
    expect(mockUnlink).toHaveBeenCalled();
  });

  it('should clean up temp file on rename failure', async () => {
    // SETUP: Write succeeds, rename fails
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockRejectedValue(new Error('EIO'));

    // EXECUTE
    await expect(atomicWrite('/test/target.json', '{}')).rejects.toThrow();

    // VERIFY: Cleanup attempted
    expect(mockUnlink).toHaveBeenCalled();
  });
});
```

**Real Example from:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`

---

## 7. Integration Test Mocking Patterns

### 7.1 Partial Mocking for E2E Tests

```typescript
// Mock only specific functions, keep others real
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    // Only mock readFile, let other operations work normally
    readFile: vi.fn(),
  };
});

// Mock node:fs selectively
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    realpathSync: vi.fn(),
  };
});
```

**Real Example from:** `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`

### 7.2 Multiple Module Mocking

```typescript
// Mock groundswell
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Mock agent factory
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createResearcherAgent: vi.fn(),
}));

// Mock fs/promises
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});
```

**Real Example from:** `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`

---

## 8. Common Pitfalls and Solutions

### 8.1 Mock State Leaking Between Tests

**Problem:** Mock return values persist across tests

```typescript
// Bad: No cleanup
describe('without cleanup', () => {
  it('test 1', () => {
    mockReadFile.mockReturnValue('A');
    expect(readFile()).toBe('A');
  });

  it('test 2', () => {
    // mockReadFile still returns 'A'!
    expect(readFile()).toBe('B'); // Fails
  });
});

// Good: Clear mocks in beforeEach
describe('with cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    mockReadFile.mockReturnValue('A');
    expect(readFile()).toBe('A');
  });

  it('test 2', () => {
    // mockReadFile is cleared
    expect(readFile()).toBeUndefined(); // Passes
  });
});
```

### 8.2 Forgetting await on Async Operations

```typescript
// Bad: Not awaiting
it('should read file', () => {
  const content = readFile('/test.txt'); // Returns Promise
  expect(content).toBe('content'); // Fails - comparing Promise to string
});

// Good: Await async
it('should read file', async () => {
  const content = await readFile('/test.txt');
  expect(content).toBe('content');
});
```

### 8.3 Incorrect Mock Implementations

```typescript
// Bad: Mock returns wrong type
mockWriteFile.mockReturnValue('success'); // Should be Promise<void>

// Good: Mock returns resolved promise
mockWriteFile.mockResolvedValue(undefined);

// Good: Mock returns rejected promise for errors
mockWriteFile.mockRejectedValue(new Error('EIO'));
```

### 8.4 Temp Directory Cleanup Failures

```typescript
// Bad: Cleanup in afterEach might not run if test times out
afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

// Good: Use onTestFinished for reliable cleanup
test('with cleanup', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'test-'));
  onTestFinished(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
  // Test code
});
```

### 8.5 Mock Implementation Chaining

```typescript
// Problem: Chaining mock methods

// Bad: Not returning this
const mockHash = {
  update: vi.fn(), // Doesn't return this
  digest: vi.fn(),
};

// Good: Fluent interface
class MockHash {
  update(content: string): this {
    return this; // Return this for chaining
  }
  digest(encoding: string): string {
    return 'hash';
  }
}
```

---

## 9. Testing Error Scenarios

### 9.1 Testing All Error Codes

```typescript
describe('filesystem error handling', () => {
  it('should handle ENOENT (file not found)', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    await expect(readFile('/missing')).rejects.toThrow('ENOENT');
  });

  it('should handle EACCES (permission denied)', async () => {
    const error = new Error('EACCES') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockReadFile.mockRejectedValue(error);

    await expect(readFile('/protected')).rejects.toThrow('EACCES');
  });

  it('should handle ENOSPC (no space)', async () => {
    const error = new Error('ENOSPC') as NodeJS.ErrnoException;
    error.code = 'ENOSPC';
    mockWriteFile.mockRejectedValue(error);

    await expect(writeFile('/full', 'data')).rejects.toThrow('ENOSPC');
  });

  it('should handle EEXIST (directory exists)', async () => {
    const error = new Error('EEXIST') as NodeJS.ErrnoException;
    error.code = 'EEXIST';
    mockMkdir.mockRejectedValue(error);

    await expect(mkdir('/existing')).rejects.toThrow('EEXIST');
  });
});
```

### 9.2 Testing Custom Error Wrapping

```typescript
it('should wrap filesystem errors in custom error', async () => {
  const fsError = new Error('ENOENT') as NodeJS.ErrnoException;
  fsError.code = 'ENOENT';
  mockReadFile.mockRejectedValue(fsError);

  try {
    await readFileWithErrorHandling('/test.txt');
  } catch (error) {
    expect(error).toBeInstanceOf(CustomFileError);
    const customError = error as CustomFileError;
    expect(customError.code).toBe('ENOENT');
    expect(customError.path).toBe('/test.txt');
  }
});
```

---

## 10. Complete Test File Template

```typescript
/**
 * Unit tests for filesystem operations
 *
 * @remarks
 * Tests validate filesystem operations with comprehensive mocking.
 * All file I/O is mocked - no real files are created.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  readFile,
  writeFile,
  mkdir,
  rename,
  unlink,
  stat,
} from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

// =============================================================================
// Module Mocks
// =============================================================================

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  createHash: vi.fn(),
  randomBytes: vi.fn(),
}));

// =============================================================================
// Mock Hash Class
// =============================================================================

class MockHash {
  private data = '';

  update(content: string): this {
    this.data = content;
    return this;
  }

  digest(encoding: 'hex'): string {
    if (encoding === 'hex') {
      return '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123';
    }
    return '';
  }
}

// =============================================================================
// Type Assertions
// =============================================================================

const mockReadFile = readFile as any;
const mockWriteFile = writeFile as any;
const mockMkdir = mkdir as any;
const mockRename = rename as any;
const mockUnlink = unlink as any;
const mockStat = stat as any;
const mockExistsSync = existsSync as any;
const mockReaddirSync = readdirSync as any;
const mockCreateHash = createHash as any;
const mockRandomBytes = randomBytes as any;

// =============================================================================
// Test Suite
// =============================================================================

describe('filesystem operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockCreateHash.mockReturnValue(new MockHash());
    mockRandomBytes.mockReturnValue({
      toString: () => 'abc123',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('file reading', () => {
    it('should read file content successfully', async () => {
      mockReadFile.mockResolvedValue('# Test Content');

      const content = await readFile('/test/file.md', 'utf-8');

      expect(content).toBe('# Test Content');
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.md', 'utf-8');
    });

    it('should throw ENOENT when file not found', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      await expect(readFile('/missing.md')).rejects.toThrow('ENOENT');
    });
  });

  describe('file writing with atomic pattern', () => {
    beforeEach(() => {
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);
    });

    it('should write to temp file then rename', async () => {
      await writeFile('/test/target.json', '{}', { mode: 0o644 });

      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockRename).toHaveBeenCalled();
    });

    it('should clean up temp file on failure', async () => {
      mockWriteFile.mockRejectedValue(new Error('ENOSPC'));

      await expect(writeFile('/test/target.json', '{}')).rejects.toThrow();

      expect(mockUnlink).toHaveBeenCalled();
    });
  });

  describe('hash generation', () => {
    it('should generate SHA-256 hash', () => {
      const hash = createHash('sha256');
      hash.update('test content');
      const result = hash.digest('hex');

      expect(result).toBe(
        '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123'
      );
      expect(result.length).toBe(64);
    });

    it('should support method chaining', () => {
      const hash = createHash('sha256');
      const result = hash.update('part1').update('part2').digest('hex');

      expect(result).toBeDefined();
    });
  });

  describe('directory operations', () => {
    it('should check if file exists', () => {
      mockExistsSync.mockReturnValue(true);

      expect(existsSync('/test/file.txt')).toBe(true);
    });

    it('should list directory contents', () => {
      mockReaddirSync.mockReturnValue(['file1.txt', 'file2.txt']);

      const files = readdirSync('/test/dir');

      expect(files).toEqual(['file1.txt', 'file2.txt']);
    });
  });
});
```

---

## 11. Quick Reference

### 11.1 Common Mock Declarations

```typescript
// fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn(),
  copyFile: vi.fn(),
}));

// fs (sync)
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  mkdtempSync: vi.fn(),
  rmSync: vi.fn(),
  realpathSync: vi.fn(),
}));

// crypto
vi.mock('node:crypto', () => ({
  createHash: vi.fn(),
  randomBytes: vi.fn(),
}));
```

### 11.2 Mock Configuration

```typescript
// Successful operation
mockReadFile.mockResolvedValue('content');

// Failed operation
mockReadFile.mockRejectedValue(new Error('ENOENT'));

// Conditional implementation
mockExistsSync.mockImplementation((path: string) => {
  return path === '/exists.txt';
});

// Return this for chaining
class MockHash {
  update(): this {
    return this;
  }
  digest(): string {
    return 'hash';
  }
}
```

### 11.3 Cleanup Patterns

```typescript
// beforeEach/afterEach
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

// onTestFinished
test('test', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'test-'));
  onTestFinished(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
});
```

---

## 12. References from Your Codebase

### 12.1 Test Files with Filesystem Mocking

- `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts` - Comprehensive fs/promises and crypto mocking
- `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-serialization.test.ts` - Atomic write pattern testing
- `/home/dustin/projects/hacky-hack/tests/unit/agents/prp-generator.test.ts` - File operations with caching
- `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts` - Partial mocking for E2E tests

### 12.2 Source Files with Filesystem Operations

- `/home/dustin/projects/hacky-hack/src/core/session-utils.ts` - Hash computation, file I/O, temp directory creation
- `/home/dustin/projects/hacky-hack/src/agents/prp-generator.ts` - PRP file writing and caching

---

## 13. Key Takeaways

1. **Always mock at module level** - Use `vi.mock()` before imports
2. **Type your mocks** - Use `as any` for proper type assertions
3. **Clear mocks between tests** - Use `vi.clearAllMocks()` in `beforeEach`
4. **Test error scenarios** - Mock all relevant error codes (ENOENT, EACCES, ENOSPC)
5. **Use atomic write pattern** - Write to temp file, then rename
6. **Clean up temp directories** - Use `onTestFinished()` for reliable cleanup
7. **Mock hash generation consistently** - Return predictable values for deterministic tests
8. **Test both sync and async** - Mock `fs` and `fs/promises` as needed
9. **Use partial mocking in E2E** - Keep real operations when possible with `vi.importActual()`
10. **Verify call arguments** - Assert on parameters passed to mocked functions

---

**Report Generated:** 2026-01-15
**Framework:** Vitest 1.6.1
**Based on:** Production codebase analysis
**Status:** Ready for PRP creation reference
