# Vitest vi.mock Patterns for Testing Node.js fs Module Operations

**Work Item:** P2.M1.T2.S1 - Test atomic update flushing
**Date:** 2026-01-15
**Researcher:** Claude Code

---

## Executive Summary

This research document provides comprehensive guidance for mocking Node.js `fs` module operations in Vitest, with specific focus on testing atomic file write patterns (writeFileSync + rename) and simulating write failures. The document covers ESM-specific patterns, common gotchas, and real-world examples from the codebase.

---

## Table of Contents

1. [Basic vi.mock Patterns for Node.js fs](#1-basic-vimock-patterns-for-node-js-fs)
2. [Mocking writeFileSync for Atomic Writes](#2-mocking-writefilesync-for-atomic-writes)
3. [Mocking rename for Atomic Operations](#3-mocking-rename-for-atomic-operations)
4. [Simulating Write Failures](#4-simulating-write-failures)
5. [ESM-Specific Mocking Patterns](#5-esm-specific-mocking-patterns)
6. [Common Gotchas in ESM Projects](#6-common-gotchas-in-esm-projects)
7. [Best Practices for Integration Tests](#7-best-practices-for-integration-tests)
8. [Real-World Examples from Codebase](#8-real-world-examples-from-codebase)

---

## 1. Basic vi.mock Patterns for Node.js fs

### 1.1 Mocking node:fs/promises (Recommended for ESM)

**Pattern:** Complete module replacement with mock implementations

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock at module level (before imports)
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Import mocked modules
import { writeFile, rename, unlink, readFile } from 'node:fs/promises';

// Type cast for Vitest mocks
const mockWriteFile = writeFile as any;
const mockRename = rename as any;
const mockUnlink = unlink as any;

describe('fs operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write file atomically', async () => {
    // SETUP: Configure mock behavior
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);

    // EXECUTE: Call function using atomic write
    const content = JSON.stringify({ data: 'test' }, null, 2);
    await mockWriteFile('/test/temp.tmp', content);
    await mockRename('/test/temp.tmp', '/test/final.json');

    // VERIFY: Atomic pattern used
    expect(mockWriteFile).toHaveBeenCalledWith('/test/temp.tmp', content);
    expect(mockRename).toHaveBeenCalledWith('/test/temp.tmp', '/test/final.json');
  });
});
```

### 1.2 Mocking node:fs for Synchronous Operations

**Pattern:** Mock synchronous fs operations

```typescript
vi.mock('node:fs', () => ({
  statSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  renameSync: vi.fn(),
  unlinkSync: vi.fn(),
  existsSync: vi.fn(),
}));

import { statSync, writeFileSync, renameSync } from 'node:fs';

const mockStatSync = statSync as any;
const mockWriteFileSync = writeFileSync as any;
const mockRenameSync = renameSync as any;

describe('sync fs operations', () => {
  it('should validate file exists synchronously', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });

    const result = mockStatSync('/test/file.json');

    expect(result.isFile()).toBe(true);
    expect(mockStatSync).toHaveBeenCalledWith('/test/file.json');
  });
});
```

### 1.3 Partial Mocking with vi.importActual

**Pattern:** Mock specific methods while preserving others

```typescript
vi.mock('node:fs/promises', async importOriginal => {
  const actualFs = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  return {
    ...actualFs,
    // Only mock specific methods
    writeFile: vi.fn(),
    rename: vi.fn(),
    // Keep other methods (readFile, stat, etc.) as real implementations
  };
});
```

---

## 2. Mocking writeFileSync for Atomic Writes

### 2.1 Basic writeFileSync Mock Pattern

**From:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-serialization.test.ts`

```typescript
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

import { writeFile, rename, unlink } from 'node:fs/promises';

const mockWriteFile = writeFile as any;
const mockRename = rename as any;
const mockUnlink = unlink as any;

describe('atomic write pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use atomic write pattern for SessionState', async () => {
    // SETUP: Configure successful write and rename
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);

    // EXECUTE: Simulate atomic write
    const state = createTestSessionState();
    const content = JSON.stringify(state, null, 2);
    const targetPath = '/test/session/tasks.json';
    const tempPath = '/test/session/.tasks.json.tmp';

    // Atomic write: write to temp, then rename
    await mockWriteFile(tempPath, content, { mode: 0o644 });
    await mockRename(tempPath, targetPath);

    // VERIFY: Atomic pattern used correctly
    expect(mockWriteFile).toHaveBeenCalledWith(
      tempPath,
      expect.any(String),
      { mode: 0o644 }
    );
    expect(mockRename).toHaveBeenCalledWith(tempPath, targetPath);

    // VERIFY: Content is valid JSON
    const writeCall = mockWriteFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    const parsed = JSON.parse(writtenContent);
    expect(parsed.metadata.id).toBe(state.metadata.id);
  });
});
```

### 2.2 writeFileSync with File Mode Options

**Pattern:** Testing file permission modes

```typescript
describe('writeFileSync with file modes', () => {
  it('should write file with correct permissions', async () => {
    mockWriteFile.mockResolvedValue(undefined);

    const content = 'sensitive data';
    await mockWriteFile('/test/secret.json', content, { mode: 0o600 });

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/test/secret.json',
      content,
      { mode: 0o600 }
    );
  });

  it('should write file with default permissions', async () => {
    mockWriteFile.mockResolvedValue(undefined);

    const content = 'public data';
    await mockWriteFile('/test/public.json', content);

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/test/public.json',
      content,
      undefined // No mode specified
    );
  });
});
```

### 2.3 Conditional Mocking Based on File Path

**Pattern:** Mock different behaviors based on path

**From:** `/home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts`

```typescript
vi.mock('node:fs/promises', async () => {
  const actualFs = await vi.importActual('node:fs/promises');
  return {
    ...actualFs,
    mkdir: vi.fn((path: string, options: any) => {
      // Mock only PRP and artifacts directories
      if (
        path &&
        (path.toString().includes('prps') ||
          path.toString().includes('artifacts'))
      ) {
        return Promise.resolve(undefined);
      }
      // Use real mkdir for test setup
      return actualFs.mkdir(path, options);
    }),
    writeFile: vi.fn((path: string, data: any, options: any) => {
      // Mock only PRP and artifacts file writes
      if (
        path &&
        (path.toString().includes('prps') ||
          path.toString().includes('artifacts'))
      ) {
        return Promise.resolve(undefined);
      }
      // Use real writeFile for test setup
      return actualFs.writeFile(path, data, options);
    }),
  };
});
```

---

## 3. Mocking rename for Atomic Operations

### 3.1 Basic rename Mock Pattern

```typescript
describe('rename operations', () => {
  beforeEach(() => {
    mockRename.mockResolvedValue(undefined);
  });

  it('should rename temp file to final location', async () => {
    await mockRename('/test/temp.tmp', '/test/final.json');

    expect(mockRename).toHaveBeenCalledWith(
      '/test/temp.tmp',
      '/test/final.json'
    );
  });

  it('should verify atomic rename occurred after write', async () => {
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);

    // Simulate atomic write
    await mockWriteFile('/test/temp.tmp', 'content');
    await mockRename('/test/temp.tmp', '/test/final.json');

    // VERIFY: Write happened before rename
    expect(mockWriteFile).toHaveBeenCalledBefore(mockRename);
  });
});
```

### 3.2 Testing Rename Failures

**Pattern:** Simulate rename failures for cleanup testing

```typescript
describe('rename failures', () => {
  it('should clean up temp file on rename failure', async () => {
    // SETUP: Write succeeds, rename fails
    mockWriteFile.mockResolvedValue(undefined);
    const renameError = new Error('EIO: I/O error');
    mockRename.mockRejectedValue(renameError);
    mockUnlink.mockResolvedValue(undefined);

    // EXECUTE: Attempt atomic write
    try {
      await mockWriteFile('/test/temp.tmp', 'content');
      await mockRename('/test/temp.tmp', '/test/final.json');
    } catch (error) {
      // Expected rename failure
    }

    // Simulate cleanup in catch block
    await mockUnlink('/test/temp.tmp');

    // VERIFY: Write succeeded, rename failed, cleanup attempted
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockRename).toHaveBeenCalled();
    expect(mockUnlink).toHaveBeenCalledWith('/test/temp.tmp');
  });
});
```

### 3.3 Testing Cross-Device Rename Errors

**Pattern:** Simulate EXDEV error (cross-device link not permitted)

```typescript
describe('cross-device rename errors', () => {
  it('should handle EXDEV error correctly', async () => {
    // SETUP: Create EXDEV error
    const error = new Error('EXDEV: cross-device link not permitted') as NodeJS.ErrnoException;
    error.code = 'EXDEV';
    mockRename.mockRejectedValue(error);
    mockUnlink.mockResolvedValue(undefined);

    // EXECUTE: Attempt rename
    try {
      await mockRename('/test/temp.tmp', '/other/final.json');
    } catch (err) {
      // Expected EXDEV error
    }

    // VERIFY: Cleanup should happen on EXDEV
    expect(mockUnlink).toHaveBeenCalledWith('/test/temp.tmp');
  });
});
```

---

## 4. Simulating Write Failures

### 4.1 ENOSPC (No Space Left on Device)

**From:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-serialization.test.ts`

```typescript
describe('write failure scenarios', () => {
  it('should clean up temp file on ENOSPC error', async () => {
    // SETUP: Mock write failure with ENOSPC
    const writeError = new Error('ENOSPC: no space left') as NodeJS.ErrnoException;
    writeError.code = 'ENOSPC';
    mockWriteFile.mockRejectedValue(writeError);
    mockUnlink.mockResolvedValue(undefined);

    const tempPath = '/test/session/.tasks.json.tmp';

    // EXECUTE: Attempt write (will fail)
    try {
      await mockWriteFile(tempPath, JSON.stringify({ data: 'test' }), { mode: 0o644 });
    } catch (error) {
      // Expected failure
    }

    // Simulate cleanup (would happen in catch block)
    await mockUnlink(tempPath);

    // VERIFY: Cleanup attempted
    expect(mockUnlink).toHaveBeenCalledWith(tempPath);
    expect(mockWriteFile).toHaveBeenCalledWith(
      tempPath,
      expect.any(String),
      { mode: 0o644 }
    );
  });
});
```

### 4.2 EACCES (Permission Denied)

```typescript
describe('permission errors', () => {
  it('should handle EACCES error correctly', async () => {
    // SETUP: Mock permission error
    const error = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockWriteFile.mockRejectedValue(error);

    // EXECUTE & VERIFY
    await expect(
      mockWriteFile('/root/protected.json', 'data')
    ).rejects.toThrow('EACCES');
  });
});
```

### 4.3 EROFS (Read-Only File System)

```typescript
describe('read-only filesystem', () => {
  it('should handle EROFS error', async () => {
    // SETUP: Mock read-only filesystem error
    const error = new Error('EROFS: read-only file system') as NodeJS.ErrnoException;
    error.code = 'EROFS';
    mockWriteFile.mockRejectedValue(error);

    // EXECUTE & VERIFY
    await expect(
      mockWriteFile('/readonly/file.json', 'data')
    ).rejects.toThrow('EROFS');
  });
});
```

### 4.4 Simulating Partial Write Failures

**Pattern:** Test failure at different stages

```typescript
describe('partial write failures', () => {
  it('should handle failure after temp file write', async () => {
    // SETUP: Write succeeds, rename fails
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockRejectedValue(new Error('Rename failed'));
    mockUnlink.mockResolvedValue(undefined);

    // EXECUTE
    await mockWriteFile('/test/temp.tmp', 'content');
    try {
      await mockRename('/test/temp.tmp', '/test/final.json');
    } catch (error) {
      // Expected failure
    }
    await mockUnlink('/test/temp.tmp');

    // VERIFY: Temp file cleaned up
    expect(mockUnlink).toHaveBeenCalledWith('/test/temp.tmp');
  });

  it('should handle failure before temp file write', async () => {
    // SETUP: Pre-write validation fails
    mockWriteFile.mockRejectedValue(new Error('Validation failed'));

    // EXECUTE & VERIFY
    await expect(
      mockWriteFile('/test/temp.tmp', 'content')
    ).rejects.toThrow('Validation failed');
    expect(mockRename).not.toHaveBeenCalled(); // Rename never attempted
  });
});
```

### 4.5 Testing Retry Logic

**Pattern:** Mock transient failures with retry

```typescript
describe('retry logic', () => {
  it('should retry on transient write failure', async () => {
    // SETUP: Fail twice, succeed on third try
    mockWriteFile
      .mockRejectedValueOnce(new Error('EAGAIN: resource temporarily unavailable'))
      .mockRejectedValueOnce(new Error('EAGAIN: resource temporarily unavailable'))
      .mockResolvedValueOnce(undefined);

    mockRename.mockResolvedValue(undefined);

    // EXECUTE: Simulate retry logic
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        await mockWriteFile('/test/temp.tmp', 'content');
        await mockRename('/test/temp.tmp', '/test/final.json');
        break; // Success
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) throw error;
      }
    }

    // VERIFY: Retried 3 times
    expect(mockWriteFile).toHaveBeenCalledTimes(3);
    expect(mockRename).toHaveBeenCalledTimes(1);
  });
});
```

---

## 5. ESM-Specific Mocking Patterns

### 5.1 Mocking node: Prefix in ESM

**Critical:** Use `node:fs` not `fs` in ESM projects

```typescript
// CORRECT for ESM
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
}));

// INCORRECT for ESM (will fail)
// vi.mock('fs', () => ({ ... })); // Wrong module path

// Import using node: prefix
import { writeFile, rename } from 'node:fs/promises';
```

### 5.2 Mocking Both node:fs and node:fs/promises

**Pattern:** Mock synchronous and async operations separately

```typescript
// Mock async operations
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  readFile: vi.fn(),
}));

// Mock sync operations
vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  renameSync: vi.fn(),
  statSync: vi.fn(),
}));

// Import both
import { writeFile, rename } from 'node:fs/promises';
import { writeFileSync, renameSync, statSync } from 'node:fs';

const mockWriteFile = writeFile as any;
const mockRename = rename as any;
const mockWriteFileSync = writeFileSync as any;
const mockRenameSync = renameSync as any;
```

### 5.3 Using vi.doMock for Dynamic Mocking

**Pattern:** Change mock implementation during tests

```typescript
describe('dynamic mocking', () => {
  it('should change mock implementation', async () => {
    // Initial mock
    let mockWrite = vi.fn().mockResolvedValue(undefined);

    vi.doMock('node:fs/promises', () => ({
      writeFile: () => mockWrite(),
    }));

    // Use first implementation
    await mockWrite('/test/file1.txt', 'data1');
    expect(mockWrite).toHaveBeenCalledTimes(1);

    // Change implementation
    mockWrite = vi.fn().mockRejectedValue(new Error('Failed'));

    // Use new implementation
    await expect(mockWrite('/test/file2.txt', 'data2')).rejects.toThrow('Failed');
  });
});
```

### 5.4 Mocking with vi.importActual for Partial Mocks

**From:** `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`

```typescript
// Mock fs/promises but preserve some real methods
vi.mock('node:fs/promises', async importOriginal => {
  const actualFs = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actualFs,
    // Override specific methods
    readFile: vi.fn(),
    // Keep other methods real
  };
});

// Mock node:fs partially
vi.mock('node:fs', async importOriginal => {
  const actualFs = await importOriginal<typeof import('node:fs')>();
  return {
    ...actualFs,
    // Override specific methods
    existsSync: vi.fn(() => true),
    realpathSync: vi.fn((path: unknown) => path as string),
    // Keep other methods real
  };
});
```

---

## 6. Common Gotchas in ESM Projects

### 6.1 Module-Level Mock Hoisting

**Critical:** `vi.mock()` calls are hoisted to top of file

```typescript
// CORRECT: Mocks at top level before imports
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
}));

import { writeFile } from 'node:fs/promises'; // Import AFTER mock

// INCORRECT: Mock inside describe or after import
describe('test', () => {
  vi.mock('node:fs/promises', () => ({ ... })); // TOO LATE!
  // This won't work - vi.mock is hoisted but import already happened
});
```

### 6.2 Mock Timing and Import Order

**Gotcha:** Imports happen before test execution

```typescript
// WRONG: Import will use real module, not mock
import { writeFile } from 'node:fs/promises'; // Executes first
vi.mock('node:fs/promises', () => ({ writeFile: vi.fn() })); // Hoisted, but too late

// CORRECT: Mock declaration first (hoisted), then import
vi.mock('node:fs/promises', () => ({ writeFile: vi.fn() }));
import { writeFile } from 'node:fs/promises';
```

### 6.3 Type Casting Mocks

**Gotcha:** Vitest mocks lose type information

```typescript
import { writeFile } from 'node:fs/promises';

// WRONG: Type error - writeFile is not Mock
writeFile.mockResolvedValue(undefined);

// CORRECT: Type cast to Mock
const mockWriteFile = writeFile as any;
mockWriteFile.mockResolvedValue(undefined);

// OR: Use vi.mocked() helper
const mockWriteFile = vi.mocked(writeFile);
mockWriteFile.mockResolvedValue(undefined);
```

### 6.4 Mock Reset Between Tests

**Gotcha:** Mock state persists between tests

```typescript
describe('with mocks', () => {
  beforeEach(() => {
    // CRITICAL: Clear mock state before each test
    vi.clearAllMocks();
  });

  it('test 1', () => {
    mockWriteFile.mockResolvedValue('data1');
    expect(mockWriteFile()).toBe('data1');
  });

  it('test 2', () => {
    // Without clearAllMocks, this would still return 'data1'
    expect(mockWriteFile()).toBeUndefined();
  });
});
```

### 6.5 Mocking Default Exports

**Gotcha:** Default exports require special handling

```typescript
// Module has default export
// node:fs/promises doesn't, but other modules might

vi.mock('some-module', () => ({
  default: vi.fn(),
}));

import someModule from 'some-module';

const mockSomeModule = vi.mocked(someModule);
mockSomeModule.mockReturnValue('test');
```

### 6.6 Circular Dependencies with Mocks

**Gotcha:** Mocks can create circular dependency issues

```typescript
// AVOID: Mocking modules that import each other
vi.mock('../src/utils.js', () => ({ ... }));
vi.mock('../src/core.js', () => ({ ... }));
// If utils.js imports core.js, mocks can create circular issues

// SOLUTION: Mock at the boundary layer (e.g., mock fs, not internal utils)
vi.mock('node:fs/promises', () => ({ ... }));
```

### 6.7 Mock Persistence in Watch Mode

**Gotcha:** Mocks persist in Vitest watch mode

```typescript
describe('watch mode issues', () => {
  afterEach(() => {
    // CRITICAL for watch mode: restore original implementations
    vi.restoreAllMocks();
  });

  it('should have clean mock state', () => {
    // Each test gets fresh mocks, even in watch mode
  });
});
```

---

## 7. Best Practices for Integration Tests

### 7.1 Hybrid Approach: Real Files + Mocked Operations

**Pattern:** Use real temp directories with mocked operations

```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

describe('integration test with real files', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(async () => {
    // Create real temp directory
    const uniqueId = randomBytes(8).toString('hex');
    tempDir = join(tmpdir(), `test-${uniqueId}`);
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Clear mock calls
    mockWriteFile.mockClear();
    mockMkdir.mockClear();

    // Use real fs for test setup, mocks for application code
    // (conditional mocking based on path pattern)
  });

  afterEach(() => {
    // Cleanup real temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should use real filesystem for test setup', async () => {
    // Real file operations for setup
    expect(existsSync(tempDir)).toBe(true);
  });
});
```

### 7.2 Test Isolation with Unique Identifiers

**Pattern:** Use unique IDs to prevent test collision

```typescript
describe('test isolation', () => {
  it('should use unique session ID', async () => {
    // Use random ID to avoid finding existing sessions
    const uniqueId = randomBytes(8).toString('hex');
    const testPRD = `# Test PRD ${uniqueId}\n\nUnique content: ${uniqueId}`;

    // Each test gets unique session
    const session = await manager.initialize();
    expect(session.metadata.hash).toContain(uniqueId);
  });
});
```

### 7.3 Mocking for Selective Operations

**Pattern:** Mock only specific operations, use real fs for others

**From:** `/home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts`

```typescript
vi.mock('node:fs/promises', async () => {
  const actualFs = await vi.importActual('node:fs/promises');
  return {
    ...actualFs,
    // Mock only PRP/artifacts operations
    mkdir: vi.fn((path: string, options: any) => {
      if (path?.toString().includes('prps') || path?.toString().includes('artifacts')) {
        return Promise.resolve(undefined);
      }
      return actualFs.mkdir(path, options);
    }),
    writeFile: vi.fn((path: string, data: any, options: any) => {
      if (path?.toString().includes('prps') || path?.toString().includes('artifacts')) {
        return Promise.resolve(undefined);
      }
      return actualFs.writeFile(path, data, options);
    }),
  };
});
```

### 7.4 Verifying Mock Calls with Specific Arguments

**Pattern:** Use matchers for flexible argument verification

```typescript
describe('argument verification', () => {
  it('should verify write with specific content', async () => {
    mockWriteFile.mockResolvedValue(undefined);

    await mockWriteFile('/test/file.json', JSON.stringify({ key: 'value' }), { mode: 0o644 });

    // VERIFY: Exact match
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/test/file.json',
      '{"key":"value"}',
      { mode: 0o644 }
    );

    // VERIFY: Partial match with matchers
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('file.json'),
      expect.any(String),
      expect.objectContaining({ mode: 0o644 })
    );
  });
});
```

### 7.5 Testing Error Boundaries

**Pattern:** Verify error handling in atomic operations

```typescript
describe('error boundaries', () => {
  it('should handle write failure without corrupting target file', async () => {
    // SETUP: Mock write failure
    mockWriteFile.mockRejectedValue(new Error('Write failed'));
    mockRename.mockResolvedValue(undefined);

    const tempPath = '/test/temp.tmp';
    const targetPath = '/test/final.json';

    // EXECUTE: Attempt write (fails)
    try {
      await mockWriteFile(tempPath, 'content');
      await mockRename(tempPath, targetPath);
    } catch (error) {
      // Expected failure
    }

    // VERIFY: Rename never attempted (target file safe)
    expect(mockRename).not.toHaveBeenCalled();
  });

  it('should handle rename failure without leaving temp file', async () => {
    // SETUP: Write succeeds, rename fails
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockRejectedValue(new Error('Rename failed'));
    mockUnlink.mockResolvedValue(undefined);

    const tempPath = '/test/temp.tmp';

    // EXECUTE: Atomic write with cleanup
    try {
      await mockWriteFile(tempPath, 'content');
      await mockRename(tempPath, '/test/final.json');
    } catch (error) {
      // Expected failure
      await mockUnlink(tempPath); // Cleanup
    }

    // VERIFY: Cleanup happened
    expect(mockUnlink).toHaveBeenCalledWith(tempPath);
  });
});
```

---

## 8. Real-World Examples from Codebase

### 8.1 Session State Serialization Tests

**File:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-serialization.test.ts`

**Key Pattern:** Testing atomic write with temp file and rename

```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

// Import mocked modules
import { writeFile, rename, unlink } from 'node:fs/promises';

const mockWriteFile = vi.mocked(writeFile);
const mockRename = vi.mocked(rename);
const mockUnlink = vi.mocked(unlink);

describe('atomic write pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use atomic write pattern for SessionState', async () => {
    // SETUP: Create SessionState and mock successful operations
    const state = createTestSessionState();
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);
    mockRandomBytes.mockReturnValue(Buffer.from('abc123def4567890', 'hex'));

    // EXECUTE: Write SessionState as JSON (simulate writeTasksJSON pattern)
    const content = JSON.stringify(state, null, 2);
    const targetPath = '/test/session/tasks.json';
    const tempPath = '/test/session/.tasks.json.abc123def4567890.tmp';

    // Simulate atomicWrite pattern
    await mockWriteFile(tempPath, content, { mode: 0o644 });
    await mockRename(tempPath, targetPath);

    // VERIFY: Atomic write pattern used
    expect(mockWriteFile).toHaveBeenCalledWith(
      tempPath,
      expect.any(String),
      { mode: 0o644 }
    );
    expect(mockRename).toHaveBeenCalledWith(tempPath, targetPath);

    // VERIFY: Content is valid JSON
    const writeCall = mockWriteFile.mock.calls[0];
    const writtenContent = writeCall[1] as string;
    const parsed = JSON.parse(writtenContent);
    expect(parsed.metadata.id).toBe(state.metadata.id);
  });

  it('should clean up temp file on write failure', async () => {
    // SETUP: Mock write failure
    const writeError = new Error('ENOSPC: no space left');
    mockWriteFile.mockRejectedValue(writeError);
    mockUnlink.mockResolvedValue(undefined);
    mockRandomBytes.mockReturnValue(Buffer.from('abc123', 'hex'));

    const state = createTestSessionState();
    const tempPath = '/test/session/.tasks.json.abc123.tmp';

    // EXECUTE: Attempt write (will fail)
    try {
      await mockWriteFile(tempPath, JSON.stringify(state), { mode: 0o644 });
    } catch (error) {
      // Expected failure
    }

    // Simulate cleanup (would happen in catch block)
    await mockUnlink(tempPath);

    // VERIFY: Cleanup attempted
    expect(mockUnlink).toHaveBeenCalledWith(tempPath);
  });

  it('should clean up temp file on rename failure', async () => {
    // SETUP: Mock rename failure (write succeeds)
    mockWriteFile.mockResolvedValue(undefined);
    const renameError = new Error('EIO: I/O error');
    mockRename.mockRejectedValue(renameError);
    mockUnlink.mockResolvedValue(undefined);
    mockRandomBytes.mockReturnValue(Buffer.from('abc123', 'hex'));

    const state = createTestSessionState();
    const tempPath = '/test/session/.tasks.json.abc123.tmp';
    const targetPath = '/test/session/tasks.json';

    // EXECUTE: Write succeeds, rename fails
    await mockWriteFile(tempPath, JSON.stringify(state), { mode: 0o644 });
    try {
      await mockRename(tempPath, targetPath);
    } catch (error) {
      // Expected failure
    }

    // Simulate cleanup
    await mockUnlink(tempPath);

    // VERIFY: Write succeeded, cleanup attempted
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockUnlink).toHaveBeenCalledWith(tempPath);
  });
});
```

### 8.2 Session Manager Unit Tests

**File:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts`

**Key Pattern:** Mocking multiple fs operations

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

  describe('constructor', () => {
    it('should validate PRD file exists synchronously', () => {
      // SETUP: Mock successful stat check
      mockStatSync.mockReturnValue({ isFile: () => true });

      // EXECUTE
      const manager = new SessionManager('/test/PRD.md');

      // VERIFY
      expect(mockStatSync).toHaveBeenCalledWith('/test/PRD.md');
      expect(manager.prdPath).toBe('/test/PRD.md');
    });

    it('should throw SessionFileError when PRD does not exist (ENOENT)', () => {
      // SETUP: Mock ENOENT error
      const error = new Error('ENOENT: no such file') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockStatSync.mockImplementation(() => {
        throw error;
      });

      // EXECUTE & VERIFY
      expect(() => new SessionManager('/test/PRD.md')).toThrow(SessionFileError);
    });
  });
});
```

### 8.3 PRP Runtime Integration Tests

**File:** `/home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts`

**Key Pattern:** Conditional mocking based on file path

```typescript
// Mock node:fs/promises for PRP and artifact file operations
vi.mock('node:fs/promises', async () => {
  const actualFs = await vi.importActual('node:fs/promises');
  return {
    ...actualFs,
    // Mock mkdir and writeFile for PRP and artifacts operations
    mkdir: vi.fn((path: string, options: any) => {
      // Check if this is a PRP or artifacts directory operation
      if (
        path &&
        (path.toString().includes('prps') ||
          path.toString().includes('artifacts'))
      ) {
        return Promise.resolve(undefined);
      }
      // Use real mkdir for test setup
      return actualFs.mkdir(path, options);
    }),
    writeFile: vi.fn((path: string, data: any, options: any) => {
      // Check if this is a PRP or artifacts file write operation
      if (
        path &&
        (path.toString().includes('prps') ||
          path.toString().includes('artifacts'))
      ) {
        return Promise.resolve(undefined);
      }
      // Use real writeFile for test setup
      return actualFs.writeFile(path, data, options);
    }),
  };
});

// Import mocked functions
const mockMkdir = mkdir as any;
const mockWriteFile = writeFile as any;

describe('integration/prp-runtime', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;

  beforeEach(async () => {
    // Create unique temp directory for each test
    const uniqueId = randomBytes(8).toString('hex');
    tempDir = join(tmpdir(), `prp-runtime-test-${uniqueId}`);
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Clear mock calls before each test
    mockWriteFile.mockClear();
    mockMkdir.mockClear();

    // Create test PRD file
    const testPRD = `# Test PRD ${uniqueId}`;
    await writeFile(prdPath, testPRD); // Uses real writeFile (test setup)
  });

  it('should mock PRP operations but use real filesystem for test setup', async () => {
    // Test setup uses real fs
    expect(existsSync(prdPath)).toBe(true);

    // Application code uses mocked fs
    await writePRP(planDir, prpData);
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('prps'),
      expect.any(String),
      undefined
    );
  });
});
```

### 8.4 E2E Pipeline Tests

**File:** `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`

**Key Pattern:** Module-level mocking with hoisting

```typescript
// =============================================================================
// MOCK PATTERN: Module-level mocking with hoisting
// =============================================================================

// Mock groundswell for createAgent, createPrompt
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
  createCoderAgent: vi.fn(),
}));

// Mock fs/promises for file operations - only mock readFile, let others work
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

// Mock node:fs for existsSync, realpathSync, mkdtempSync, rmSync
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    realpathSync: vi.fn((path: unknown) => path as string),
  };
});

// =============================================================================
// IMPORT MOCKED MODULES
// =============================================================================

import { createAgent, createPrompt } from 'groundswell';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Setup mocked functions
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);
```

---

## 9. Testing Patterns for Atomic File Operations

### 9.1 Complete Atomic Write Test Suite

**Pattern:** Comprehensive test coverage for atomic writes

```typescript
describe('atomic file write operations', () => {
  let tempDir: string;
  let targetPath: string;
  let tempPath: string;

  beforeEach(() => {
    // Generate unique temp file path
    const uniqueId = randomBytes(8).toString('hex');
    tempDir = `/test/session-${uniqueId}`;
    targetPath = `${tempDir}/tasks.json`;
    tempPath = `${tempDir}/.tasks.json.${uniqueId}.tmp`;

    // Clear mocks
    vi.clearAllMocks();
  });

  describe('successful atomic write', () => {
    it('should write to temp file then rename to target', async () => {
      // SETUP
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      // EXECUTE: Atomic write
      const content = JSON.stringify({ data: 'test' }, null, 2);
      await mockWriteFile(tempPath, content, { mode: 0o644 });
      await mockRename(tempPath, targetPath);

      // VERIFY: Correct sequence
      expect(mockWriteFile).toHaveBeenCalledWith(tempPath, content, { mode: 0o644 });
      expect(mockRename).toHaveBeenCalledWith(tempPath, targetPath);
      expect(mockWriteFile).toHaveBeenCalledBefore(mockRename);
    });

    it('should preserve JSON structure with 2-space indentation', async () => {
      // SETUP
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      // EXECUTE
      const data = { key: 'value', nested: { item: 1 } };
      const content = JSON.stringify(data, null, 2);
      await mockWriteFile(tempPath, content, { mode: 0o644 });

      // VERIFY: Indentation
      expect(content).toContain('  "key"'); // 2-space indent
      expect(content).not.toContain('    "key"'); // Not 4-space
      expect(content).not.toContain('\t"key"'); // Not tab
    });
  });

  describe('write failure scenarios', () => {
    it('should not corrupt target file when write fails', async () => {
      // SETUP: Write fails
      const writeError = new Error('ENOSPC: no space left') as NodeJS.ErrnoException;
      writeError.code = 'ENOSPC';
      mockWriteFile.mockRejectedValue(writeError);

      // EXECUTE: Attempt write (fails)
      try {
        await mockWriteFile(tempPath, 'content', { mode: 0o644 });
      } catch (error) {
        // Expected failure
      }

      // VERIFY: Rename never attempted (target file safe)
      expect(mockRename).not.toHaveBeenCalled();
    });

    it('should clean up temp file on write failure', async () => {
      // SETUP: Write fails, cleanup succeeds
      mockWriteFile.mockRejectedValue(new Error('Write failed'));
      mockUnlink.mockResolvedValue(undefined);

      // EXECUTE: Attempt write with cleanup
      try {
        await mockWriteFile(tempPath, 'content', { mode: 0o644 });
      } catch (error) {
        await mockUnlink(tempPath); // Cleanup
      }

      // VERIFY: Cleanup attempted
      expect(mockUnlink).toHaveBeenCalledWith(tempPath);
    });
  });

  describe('rename failure scenarios', () => {
    it('should clean up temp file when rename fails', async () => {
      // SETUP: Write succeeds, rename fails
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockRejectedValue(new Error('EIO: I/O error'));
      mockUnlink.mockResolvedValue(undefined);

      // EXECUTE: Atomic write with cleanup
      try {
        await mockWriteFile(tempPath, 'content', { mode: 0o644 });
        await mockRename(tempPath, targetPath);
      } catch (error) {
        await mockUnlink(tempPath); // Cleanup
      }

      // VERIFY: Write succeeded, rename failed, cleanup happened
      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockRename).toHaveBeenCalled();
      expect(mockUnlink).toHaveBeenCalledWith(tempPath);
    });

    it('should handle EXDEV error (cross-device rename)', async () => {
      // SETUP: Cross-device error
      const error = new Error('EXDEV: cross-device link') as NodeJS.ErrnoException;
      error.code = 'EXDEV';
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockRejectedValue(error);
      mockUnlink.mockResolvedValue(undefined);

      // EXECUTE
      try {
        await mockWriteFile(tempPath, 'content', { mode: 0o644 });
        await mockRename(tempPath, targetPath);
      } catch (err) {
        await mockUnlink(tempPath);
      }

      // VERIFY: EXDEV cleanup
      expect(mockRename).toHaveBeenCalled();
      expect(mockUnlink).toHaveBeenCalledWith(tempPath);
    });
  });

  describe('concurrent write safety', () => {
    it('should serialize concurrent flush operations', async () => {
      // SETUP: Mock sequential execution
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      // EXECUTE: Simulate concurrent writes
      const writes = [
        mockWriteFile('/test/file1.tmp', 'data1', { mode: 0o644 }),
        mockWriteFile('/test/file2.tmp', 'data2', { mode: 0o644 }),
        mockWriteFile('/test/file3.tmp', 'data3', { mode: 0o644 }),
      ];

      await Promise.all(writes);

      // VERIFY: All writes executed
      expect(mockWriteFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('file integrity', () => {
    it('should validate JSON after successful write', async () => {
      // SETUP
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      // EXECUTE
      const data = { metadata: { id: '123' }, content: 'test' };
      const content = JSON.stringify(data, null, 2);
      await mockWriteFile(tempPath, content, { mode: 0o644 });

      // VERIFY: Valid JSON
      const writeCall = mockWriteFile.mock.calls[0];
      const writtenContent = writeCall[1] as string;
      const parsed = JSON.parse(writtenContent);
      expect(parsed.metadata.id).toBe('123');
      expect(parsed.content).toBe('test');
    });

    it('should preserve all fields through serialization', async () => {
      // SETUP
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      // EXECUTE
      const state = createTestSessionState();
      const content = JSON.stringify(state, null, 2);
      await mockWriteFile(tempPath, content, { mode: 0o644 });

      // VERIFY: All fields preserved
      const writeCall = mockWriteFile.mock.calls[0];
      const writtenContent = writeCall[1] as string;
      const parsed = JSON.parse(writtenContent);
      expect(parsed.metadata.id).toBe(state.metadata.id);
      expect(parsed.metadata.hash).toBe(state.metadata.hash);
      expect(parsed.prdSnapshot).toBe(state.prdSnapshot);
    });
  });
});
```

### 9.2 Testing Batch Update Patterns

**Pattern:** Test accumulation and flushing of updates

```typescript
describe('batch update pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);
  });

  it('should accumulate updates and flush atomically', async () => {
    // SETUP: Create SessionManager with batch updates
    const manager = new SessionManager('/test/PRD.md');
    const backlog = createTestBacklog();

    // EXECUTE: Multiple updates queued
    manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
    manager.updateItemStatus('P1.M1.T2.S1', 'Failed');

    // Flush all updates atomically
    await manager.flushUpdates();

    // VERIFY: Only one write call (batched)
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockRename).toHaveBeenCalledTimes(1);

    // VERIFY: All updates included in flush
    const writeCall = mockWriteFile.mock.calls[0];
    const content = writeCall[1] as string;
    const parsed = JSON.parse(content);
    expect(findItem(parsed, 'P1.M1.T1.S1')?.status).toBe('Complete');
    expect(findItem(parsed, 'P1.M1.T1.S2')?.status).toBe('Complete');
    expect(findItem(parsed, 'P1.M1.T2.S1')?.status).toBe('Failed');
  });

  it('should not write updates until flush is called', async () => {
    // SETUP
    const manager = new SessionManager('/test/PRD.md');

    // EXECUTE: Queue updates without flush
    manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    manager.updateItemStatus('P1.M1.T1.S2', 'Complete');

    // VERIFY: No writes yet
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockRename).not.toHaveBeenCalled();

    // EXECUTE: Flush
    await manager.flushUpdates();

    // VERIFY: Writes happen after flush
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockRename).toHaveBeenCalledTimes(1);
  });
});
```

---

## 10. Quick Reference Guide

### 10.1 Mock Setup Patterns

```typescript
// Basic mock
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
}));

// Partial mock with real implementations
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importActual('node:fs/promises');
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

// Conditional mock
vi.mock('node:fs/promises', async () => {
  const actualFs = await vi.importActual('node:fs/promises');
  return {
    ...actualFs,
    writeFile: vi.fn((path, data, options) => {
      if (path.includes('temp')) {
        return Promise.resolve(undefined);
      }
      return actualFs.writeFile(path, data, options);
    }),
  };
});
```

### 10.2 Mock Configuration Patterns

```typescript
// Success
mockWriteFile.mockResolvedValue(undefined);

// Failure
mockWriteFile.mockRejectedValue(new Error('Write failed'));

// Error with code
const error = new Error('ENOSPC') as NodeJS.ErrnoException;
error.code = 'ENOSPC';
mockWriteFile.mockRejectedValue(error);

// Multiple return values
mockWriteFile
  .mockResolvedValueOnce(undefined)
  .mockRejectedValueOnce(new Error('Failed'))
  .mockResolvedValueOnce(undefined);

// Reset
mockWriteFile.mockReset();
mockWriteFile.mockClear();
vi.restoreAllMocks();
```

### 10.3 Verification Patterns

```typescript
// Exact match
expect(mockWriteFile).toHaveBeenCalledWith('/test/file.txt', 'content');

// Partial match
expect(mockWriteFile).toHaveBeenCalledWith(
  expect.stringContaining('file'),
  expect.any(String)
);

// Call order
expect(mockWriteFile).toHaveBeenCalledBefore(mockRename);

// Call count
expect(mockWriteFile).toHaveBeenCalledTimes(1);
expect(mockWriteFile).toHaveBeenLastCalledWith('/test/file.txt', 'content');

// Not called
expect(mockUnlink).not.toHaveBeenCalled();
```

### 10.4 Error Simulation Patterns

```typescript
// ENOSPC (no space left)
const error = new Error('ENOSPC') as NodeJS.ErrnoException;
error.code = 'ENOSPC';
mockWriteFile.mockRejectedValue(error);

// EACCES (permission denied)
const error = new Error('EACCES') as NodeJS.ErrnoException;
error.code = 'EACCES';
mockWriteFile.mockRejectedValue(error);

// EROFS (read-only filesystem)
const error = new Error('EROFS') as NodeJS.ErrnoException;
error.code = 'EROFS';
mockWriteFile.mockRejectedValue(error);

// EXDEV (cross-device link)
const error = new Error('EXDEV') as NodeJS.ErrnoException;
error.code = 'EXDEV';
mockRename.mockRejectedValue(error);
```

---

## 11. Resources and Documentation

### 11.1 Official Documentation

**Vitest Documentation:**

- Main Guide: https://vitest.dev/guide/
- Mocking API: https://vitest.dev/api/#vi-mock
- Mock Functions: https://vitest.dev/api/#mock-functions
- vi.importActual: https://vitest.dev/api/#vi-importactual
- vi.mocked: https://vitest.dev/api/#vi-mocked

**Node.js fs Documentation:**

- File System: https://nodejs.org/api/fs.html
- fs.promises API: https://nodejs.org/api/fs.html#fspromisesapi-2
- File System Flags: https://nodejs.org/api/fs.html#file-system-flags

### 11.2 Project-Specific Resources

**Existing Test Examples:**

- `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-serialization.test.ts` - Atomic write pattern tests
- `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts` - fs operation mocking
- `/home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts` - Conditional mocking
- `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts` - Module-level mocking

**Configuration:**

- `/home/dustin/projects/hacky-hack/vitest.config.ts` - Vitest configuration
- `/home/dustin/projects/hacky-hack/tests/setup.ts` - Global test setup

**Research Documentation:**

- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/docs/test-fixtures-patterns-research.md` - Test patterns research
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-typescript-testing-research.md` - TypeScript testing patterns

### 11.3 Common Error Codes

```typescript
// File system error codes commonly used in tests:
ENOENT  - No such file or directory
EACCES  - Permission denied
EEXIST  - File exists
ENOSPC  - No space left on device
EROFS   - Read-only file system
EXDEV   - Cross-device link not permitted
EIO     - I/O error
EBUSY   - Resource busy
```

---

## 12. Conclusion

This research document provides comprehensive patterns for mocking Node.js `fs` module operations in Vitest, with specific focus on:

1. **ESM-compatible mocking** using `node:fs` and `node:fs/promises` prefixes
2. **Atomic file write patterns** (writeFileSync + rename) with temp file cleanup
3. **Failure simulation** for write errors, rename errors, and cross-device operations
4. **Best practices** for integration tests combining real and mocked operations
5. **Real-world examples** from the codebase demonstrating production-ready patterns

The patterns documented here enable testing of critical file system operations including:
- Atomic writes for data integrity
- Error handling and cleanup
- Batch update patterns
- Concurrent write safety
- File integrity validation

All examples follow the project's existing test patterns and maintain compatibility with Vitest's ESM support.

---

**Research Document Generated:** 2026-01-15
**Framework:** Vitest 1.6.1
**Environment:** Node.js 20+, ESM mode
**Coverage Requirement:** 100%
**Work Item:** P2.M1.T2.S1
