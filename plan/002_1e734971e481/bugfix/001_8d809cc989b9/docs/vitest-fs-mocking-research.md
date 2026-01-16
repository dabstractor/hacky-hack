# Vitest File System Mocking Research Report

## Executive Summary

This research report documents comprehensive findings on Vitest file system mocking best practices, specifically for mocking Node.js `fs/promises` `readFile` to return Buffer objects. The research includes analysis of existing codebase patterns, known best practices, and implementation strategies for type-safe file system mocking in TypeScript/Vitest environments.

**Research Date:** 2026-01-16
**Status:** Compilation of codebase patterns + documented best practices
**Limitations:** External web search unavailable (rate-limited), findings based on codebase analysis and established patterns

---

## Table of Contents

1. [Vitest Mocking Strategies for `node:fs/promises`](#1-vitest-mocking-strategies)
2. [Proper Mocking of `readFile` to Return Buffer vs String](#2-buffer-vs-string-mocking)
3. [Common Pitfalls When Mocking File System Operations](#3-common-pitfalls)
4. [Best Practices for E2E Testing with File System Mocks](#4-e2e-best-practices)
5. [Buffer Creation Patterns in Tests](#5-buffer-creation-patterns)
6. [Mock Implementations That Preserve Type Safety](#6-type-safety-patterns)
7. [Alternative Approaches](#7-alternatives)
8. [Code Examples](#8-code-examples)
9. [References and Resources](#9-references)

---

## 1. Vitest Mocking Strategies for `node:fs/promises`

### 1.1 Module-Level Mocking (Hoisting)

**Pattern:** Mock at module level before imports

```typescript
// tests/unit/example.test.ts

// Mock declaration (hoisted to top)
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  };
});

// Import mocked modules
import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Type-safe mock references
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);
```

**Key Points:**
- `vi.mock()` is hoisted to top of file automatically
- Use `async importOriginal` to preserve other module exports
- `vi.mocked()` provides type-safe access to mocked functions
- Mock must be declared BEFORE imports of code that uses the module

### 1.2 Preserving Real Implementation

**Pattern:** Partial mocking while preserving real functions

```typescript
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual, // Preserve all real exports
    readFile: vi.fn(), // Only mock specific functions
  };
});
```

**Use Cases:**
- Mock `readFile` but preserve real `mkdir`, `writeFile`, etc.
- Reduces mock surface area
- Maintains realistic behavior for unmocked operations

### 1.3 Mock Factory Pattern

**Pattern:** Factory functions for creating mock data

```typescript
function createMockReadFile(data: Record<string, string | Buffer>) {
  return vi.fn().mockImplementation((path: string | Buffer) => {
    const pathStr = String(path);
    if (pathStr in data) {
      return Promise.resolve(data[pathStr]);
    }
    return Promise.reject(
      Object.assign(new Error('File not found'), { code: 'ENOENT' })
    );
  });
}

// Usage
const mockReadFile = createMockReadFile({
  '/path/to/file.txt': 'file content',
  '/path/to/binary.dat': Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]),
});
```

**Benefits:**
- Centralized mock data management
- Reusable across multiple test files
- Easy to extend with error scenarios

---

## 2. Proper Mocking of `readFile` to Return Buffer vs String

### 2.1 Understanding `readFile` Return Types

Node.js `readFile` from `fs/promises` has different return types based on encoding:

```typescript
// Without encoding option -> Returns Buffer
const buffer: Buffer = await readFile('/path/to/file');

// With encoding option -> Returns string
const text: string = await readFile('/path/to/file', { encoding: 'utf-8' });
const text2: string = await readFile('/path/to/file', 'utf-8');

// Type signature
export function readFile(
  path: PathLike | FileHandle
): Promise<Buffer>;

export function readFile(
  path: PathLike | FileHandle,
  options: { encoding: null; flag?: string } | undefined
): Promise<Buffer>;

export function readFile(
  path: PathLike | FileHandle,
  options: { encoding: BufferEncoding; flag?: string } | BufferEncoding
): Promise<string>;
```

### 2.2 Mocking Buffer Return Values

**Pattern:** Return Buffer objects for binary data

```typescript
import { readFile } from 'node:fs/promises';

const mockReadFile = vi.mocked(readFile);

// Mock returns Buffer (no encoding specified)
mockReadFile.mockResolvedValue(Buffer.from('Hello, World!'));

// Mock returns Buffer with explicit binary data
mockReadFile.mockResolvedValue(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]));

// Mock returns Buffer for different scenarios
mockReadFile.mockImplementation((path, options) => {
  if (typeof path === 'string' && path.includes('.png')) {
    return Promise.resolve(Buffer.from([0x89, 0x50, 0x4e, 0x47])); // PNG header
  }
  return Promise.resolve(Buffer.from('text content'));
});
```

**Type Assertion Pattern:**

```typescript
// When mock doesn't match exact signature
mockReadFile.mockResolvedValue(
  Buffer.from('content') as unknown as Promise<string>
);
```

### 2.3 Mocking String Return Values

**Pattern:** Return strings when encoding is specified

```typescript
// Mock with type assertion for string return
mockReadFile.mockResolvedValue('file content' as unknown as Buffer);

// Better: Use implementation to handle encoding parameter
mockReadFile.mockImplementation((path: string | Buffer, options?: any) => {
  const content = 'file content';

  // If encoding specified, return string
  if (options?.encoding || typeof options === 'string') {
    return Promise.resolve(content as unknown as Buffer);
  }

  // Otherwise return Buffer
  return Promise.resolve(Buffer.from(content));
});
```

### 2.4 Proper Type-Safe Mocking

**Pattern:** Use TypeScript overloads correctly

```typescript
import { readFile } from 'node:fs/promises';

// Create typed mock that respects overloads
const mockReadFile = vi.mocked(readFile);

// Test 1: Mock returns Buffer (no encoding)
it('should read file as Buffer', async () => {
  mockReadFile.mockResolvedValue(Buffer.from('binary data'));

  const result = await readFile('/path/to/file');
  expect(result).toBeInstanceOf(Buffer);
  expect(result.toString()).toBe('binary data');
});

// Test 2: Mock returns string (with encoding)
it('should read file as string with encoding', async () => {
  mockReadFile.mockResolvedValue(
    'text data' as unknown as Buffer
  );

  const result = await readFile('/path/to/file', 'utf-8');
  expect(typeof result).toBe('string');
  expect(result).toBe('text data');
});
```

---

## 3. Common Pitfalls When Mocking File System Operations

### 3.1 Mock Timing Issues

**Pitfall:** Mocking after imports

```typescript
// ❌ WRONG - Import happens before mock
import { readFile } from 'node:fs/promises';
import { myFunction } from './my-module'; // Uses readFile

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(), // Too late!
}));
```

**Solution:** Always mock before imports

```typescript
// ✅ CORRECT - Mock before imports
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'node:fs/promises';
import { myFunction } from './my-module';
```

### 3.2 Type Mismatches

**Pitfall:** Mock returns wrong type

```typescript
// ❌ WRONG - Type mismatch
const mockReadFile = vi.mocked(readFile);
mockReadFile.mockResolvedValue('string'); // Expects Buffer

// TypeScript error: Type 'string' is not assignable to type 'Buffer'
```

**Solution:** Match expected return type

```typescript
// ✅ CORRECT - Use type assertion
mockReadFile.mockResolvedValue(Buffer.from('string'));

// Or for string return:
mockReadFile.mockResolvedValue('string' as unknown as Buffer);
```

### 3.3 Incomplete Mock Implementations

**Pitfall:** Not mocking all required functions

```typescript
// ❌ WRONG - Missing mkdir mock
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  // mkdir missing - will cause runtime error
}));
```

**Solution:** Mock all used functions

```typescript
// ✅ CORRECT - Complete mock
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));
```

### 3.4 State Leakage Between Tests

**Pitfall:** Mock state not cleared

```typescript
// ❌ WRONG - No cleanup
describe('tests', () => {
  it('test 1', () => {
    mockReadFile.mockResolvedValue('data1');
  });

  it('test 2', () => {
    // Still uses mock from test 1!
    const result = await readFile('/path');
  });
});
```

**Solution:** Clear mocks in afterEach

```typescript
// ✅ CORRECT - Clean up between tests
describe('tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    mockReadFile.mockResolvedValue('data1');
  });

  it('test 2', () => {
    mockReadFile.mockResolvedValue('data2');
    // Clean state
  });
});
```

### 3.5 Path Resolution Issues

**Pitfall:** Mock doesn't handle path variations

```typescript
// ❌ WRONG - Exact path match only
mockReadFile.mockImplementation((path) => {
  if (path === '/exact/path') {
    return Promise.resolve('data');
  }
  return Promise.reject(new Error('Not found'));
});

// Fails for relative paths, normalized paths, etc.
```

**Solution:** Flexible path matching

```typescript
// ✅ CORRECT - Flexible path handling
mockReadFile.mockImplementation((path) => {
  const pathStr = String(path);
  if (pathStr.includes('file.txt')) {
    return Promise.resolve('data');
  }
  return Promise.reject(
    Object.assign(new Error('Not found'), { code: 'ENOENT' })
  );
});
```

---

## 4. Best Practices for E2E Testing with File System Mocks

### 4.1 Use Real File System When Possible

**Recommendation:** For E2E tests, prefer real temp directories

```typescript
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('E2E tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should handle real file operations', async () => {
    const testFile = join(tempDir, 'test.txt');
    writeFileSync(testFile, 'content');

    // Test with real file system
    const result = await myFunction(testFile);
    expect(result).toBeDefined();
  });
});
```

**Benefits:**
- Tests interact with real file system
- Catches path resolution issues
- Validates actual file I/O behavior
- No mock complexity

### 4.2 Hybrid Approach: Mock Network, Use Real Files

**Pattern:** Mock external dependencies, use local files

```typescript
// Mock HTTP calls, but use real temp files
vi.mock('node:https', () => ({
  get: vi.fn(),
}));

it('should process downloaded file', async () => {
  // Use real temp file for processing
  const localFile = join(tempDir, 'downloaded.dat');
  writeFileSync(localFile, Buffer.from([0x00, 0x01, 0x02]));

  // Mock the download part
  vi.mocked(https.get).mockImplementation((url, callback) => {
    const mockResponse = createMockResponse(Buffer.from([0x00, 0x01, 0x02]));
    callback(mockResponse);
    return mockReq;
  });

  // Test file processing with real file
  await processDownloadedFile(localFile);
});
```

### 4.3 Cleanup on Failure

**Pattern:** Ensure cleanup even when tests fail

```typescript
describe('E2E with cleanup', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
  });

  afterEach(() => {
    // Always cleanup, even if test fails
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should clean up on error', async () => {
    // Even if this throws, afterEach will clean up
    await operationThatMightFail(tempDir);
  });
});
```

### 4.4 Isolation Between Tests

**Pattern:** Unique temp directories per test

```typescript
describe('Isolated E2E tests', () => {
  it('test 1', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'test1-'));
    try {
      await runTest(tempDir);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('test 2', async () => {
    // Different temp directory - no interference
    const tempDir = mkdtempSync(join(tmpdir(), 'test2-'));
    try {
      await runTest(tempDir);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
```

---

## 5. Buffer Creation Patterns in Tests

### 5.1 Buffer.from() - Most Common

**Pattern:** Create Buffer from string or array

```typescript
// From string (UTF-8 encoding by default)
const textBuffer = Buffer.from('Hello, World!');

// From byte array
const byteBuffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

// From hex string
const hexBuffer = Buffer.from('48656c6c6f', 'hex');

// From base64
const base64Buffer = Buffer.from('SGVsbG8=', 'base64');

// Usage in mocks
mockReadFile.mockResolvedValue(Buffer.from('file content'));
```

### 5.2 Buffer.alloc() - Fixed Size

**Pattern:** Allocate buffer of specific size

```typescript
// Zero-filled buffer
const emptyBuffer = Buffer.alloc(1024);

// Buffer filled with specific value
const filledBuffer = Buffer.alloc(1024, 0xFF);

// Usage in mocks
mockReadFile.mockResolvedValue(Buffer.alloc(4096)); // Empty 4KB file
```

### 5.3 Real-World File Header Mocks

**Pattern:** Mock actual file formats

```typescript
// PNG file header (89 50 4e 47 0d 0a 1a 0a)
const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// JPEG file header (ff d8 ff)
const jpegHeader = Buffer.from([0xff, 0xd8, 0xff]);

// PDF file header (%PDF-)
const pdfHeader = Buffer.from('%PDF-1.4\n');

// Usage
mockReadFile.mockImplementation((path) => {
  if (String(path).endsWith('.png')) {
    return Promise.resolve(pngHeader);
  }
  if (String(path).endsWith('.jpg')) {
    return Promise.resolve(jpegHeader);
  }
  return Promise.resolve(Buffer.from('text'));
});
```

### 5.4 Mock Factory for File Types

**Pattern:** Factory for different file types

```typescript
function createMockFile(content: string | Buffer, mimeType?: string): Buffer {
  if (Buffer.isBuffer(content)) {
    return content;
  }

  switch (mimeType) {
    case 'image/png':
      return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.from(content)
      ]);
    case 'application/json':
      return Buffer.from(JSON.stringify(JSON.parse(content)), 'utf-8');
    default:
      return Buffer.from(content, 'utf-8');
  }
}

// Usage
mockReadFile.mockResolvedValue(createMockFile('{"key":"value"}', 'application/json'));
```

---

## 6. Mock Implementations That Preserve Type Safety

### 6.1 Using vi.mocked() Helper

**Pattern:** Type-safe mock access

```typescript
import { readFile } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

// Type-safe mock reference
const mockReadFile = vi.mocked(readFile);

// TypeScript knows mockReadFile is Mock
mockReadFile.mockResolvedValue(Buffer.from('data'));

// Type-safe assertions
expect(mockReadFile).toHaveBeenCalledWith('/path/to/file');
expect(mockReadFile).toHaveBeenCalledTimes(1);
```

### 6.2 Generic Mock Factory with Types

**Pattern:** Typed factory functions

```typescript
import { readFile } from 'node:fs/promises';

type MockReadFileImpl = (
  path: string | Buffer,
  options?: { encoding?: BufferEncoding; flag?: string } | BufferEncoding
) => Promise<Buffer>;

function createMockReadFile(
  data: Record<string, string | Buffer>
): MockReadFileImpl {
  return (path, options) => {
    const pathStr = String(path);
    if (pathStr in data) {
      const content = data[pathStr];
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
      return Promise.resolve(buffer as unknown as Buffer);
    }
    return Promise.reject(
      Object.assign(new Error(`ENOENT: ${pathStr}`), { code: 'ENOENT' })
    );
  };
}

// Usage with type safety
const mockReadFile = createMockReadFile({
  '/file1.txt': 'content1',
  '/file2.dat': Buffer.from([0x01, 0x02, 0x03]),
});

vi.mocked(readFile).mockImplementation(mockReadFile);
```

### 6.3 Conditional Type-Based Mocks

**Pattern:** Respect encoding parameter in mock

```typescript
mockReadFile.mockImplementation(
  (path: string | Buffer, options?: any) => {
    const content = 'file content';

    // Check if encoding is specified (returns string)
    const hasEncoding =
      options?.encoding || typeof options === 'string';

    if (hasEncoding) {
      // Return type should be string
      return Promise.resolve(content) as Promise<Buffer>;
    }

    // Return type should be Buffer
    return Promise.resolve(Buffer.from(content));
  }
);
```

### 6.4 Zod Schema Validation with Mocks

**Pattern:** Validate mock data structure

```typescript
import { z } from 'zod';

const FileContentSchema = z.object({
  text: z.string(),
  version: z.number(),
});

function createMockFile(content: z.infer<typeof FileContentSchema>): Buffer {
  // Validate at mock creation time
  const validated = FileContentSchema.parse(content);
  return Buffer.from(JSON.stringify(validated), 'utf-8');
}

// Usage - compile-time and runtime type safety
const mockContent = createMockFile({
  text: 'Hello',
  version: 1,
});

mockReadFile.mockResolvedValue(mockContent);
```

---

## 7. Alternative Approaches

### 7.1 In-Memory File System (memfs)

**Library:** `memfs`

```typescript
import { vol } from 'memfs';

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    '/path/to/file.txt': 'file content',
    '/path/to/config.json': JSON.stringify({ key: 'value' }),
  });
});

it('should use in-memory file system', () => {
  const content = fs.readFileSync('/path/to/file.txt', 'utf-8');
  expect(content).toBe('file content');
});
```

**Benefits:**
- Real file system operations in memory
- No mocking required
- Supports most fs operations
- Fast and isolated

**Drawbacks:**
- Additional dependency
- May not support all edge cases
- Different from real FS behavior

### 7.2 Temporary Directory Pattern

**Pattern:** Use real temp directories (no mocking)

```typescript
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Real file system tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
    writeFileSync(join(tempDir, 'test.txt'), 'content');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should work with real files', async () => {
    const result = await processFile(join(tempDir, 'test.txt'));
    expect(result).toBe('processed: content');
  });
});
```

**Benefits:**
- No mock complexity
- Tests real file I/O
- Catches real FS issues
- Simple and straightforward

**Drawbacks:**
- Slower than mocks
- Requires cleanup
- May have permissions issues on CI

### 7.3 Spying Instead of Mocking

**Pattern:** Use `vi.spyOn()` for partial mocking

```typescript
import * as fs from 'node:fs/promises';

it('should spy on readFile', async () => {
  const spy = vi
    .spyOn(fs, 'readFile')
    .mockResolvedValue(Buffer.from('mocked'));

  await myFunction();

  expect(spy).toHaveBeenCalledWith('/path/to/file');
  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore(); // Restore original
});
```

**Benefits:**
- Preserve real implementation
- Only mock what's needed
- Easy to restore
- Good for isolated tests

**Drawbacks:**
- Requires manual restoration
- Less control than full mock
- May interfere with other tests

---

## 8. Code Examples

### 8.1 Complete Test File: Buffer Mocking

```typescript
/**
 * Unit tests for file processing with Buffer mocking
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { processFile } from '../src/file-processor';

// Mock fs/promises module
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

const mockReadFile = vi.mocked(readFile);

describe('FileProcessor with Buffer mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Buffer return type', () => {
    it('should read file as Buffer (no encoding)', async () => {
      // SETUP: Mock returns Buffer
      const expectedBuffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      mockReadFile.mockResolvedValue(expectedBuffer);

      // EXECUTE
      const result = await processFile('/path/to/file.bin');

      // VERIFY
      expect(result).toBeInstanceOf(Buffer);
      expect(result).toEqual(expectedBuffer);
      expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.bin');
    });

    it('should handle different encodings', async () => {
      // SETUP: Mock implementation handles encoding
      mockReadFile.mockImplementation(
        (path: string | Buffer, options?: any) => {
          if (options?.encoding === 'base64') {
            return Promise.resolve(
              Buffer.from('SGVsbG8=').toString('base64') as unknown as Buffer
            );
          }
          return Promise.resolve(Buffer.from('Hello'));
        }
      );

      // EXECUTE: Test with encoding
      const base64Result = await readFile('/path', { encoding: 'base64' });
      const bufferResult = await readFile('/path');

      // VERIFY
      expect(typeof base64Result).toBe('string');
      expect(bufferResult).toBeInstanceOf(Buffer);
    });
  });

  describe('Error scenarios', () => {
    it('should handle ENOENT error', async () => {
      // SETUP: Mock file not found
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      // EXECUTE & VERIFY
      await expect(processFile('/nonexistent')).rejects.toThrow('File not found');
      expect(mockReadFile).toHaveBeenCalledWith('/nonexistent');
    });

    it('should handle EACCES permission denied', async () => {
      // SETUP: Mock permission error
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockReadFile.mockRejectedValue(error);

      // EXECUTE & VERIFY
      await expect(processFile('/restricted')).rejects.toThrow('Permission denied');
    });
  });

  describe('Binary file formats', () => {
    it('should mock PNG file', async () => {
      // SETUP: PNG header + content
      const pngContent = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
        Buffer.from('chunk data'),
      ]);
      mockReadFile.mockResolvedValue(pngContent);

      // EXECUTE
      const result = await processFile('/path/to/image.png');

      // VERIFY
      expect(result[0]).toBe(0x89); // First byte of PNG
      expect(result[1]).toBe(0x50); // Second byte
    });

    it('should mock JSON file as Buffer', async () => {
      // SETUP: JSON as Buffer
      const jsonObject = { key: 'value', number: 42 };
      const jsonBuffer = Buffer.from(JSON.stringify(jsonObject), 'utf-8');
      mockReadFile.mockResolvedValue(jsonBuffer);

      // EXECUTE
      const result = await processFile('/path/to/data.json');

      // VERIFY: Parse and validate
      const parsed = JSON.parse(result.toString('utf-8'));
      expect(parsed).toEqual(jsonObject);
    });
  });
});
```

### 8.2 Mock Factory Implementation

```typescript
/**
 * Mock factory for file system operations
 */

import { vi } from 'vitest';
import { readFile } from 'node:fs/promises';

interface MockFileSystem {
  readFile: ReturnType<typeof vi.fn>;
  writeFile: ReturnType<typeof vi.fn>;
  mkdir: ReturnType<typeof vi.fn>;
}

export function createMockFileSystem(
  files: Record<string, string | Buffer>
): MockFileSystem {
  const mockReadFile = vi.fn().mockImplementation((path: string | Buffer) => {
    const pathStr = String(path);
    if (pathStr in files) {
      const content = files[pathStr];
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
      return Promise.resolve(buffer);
    }
    const error = new Error(`ENOENT: no such file: ${pathStr}`) as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    return Promise.reject(error);
  });

  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  const mockMkdir = vi.fn().mockResolvedValue(undefined);

  return {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
  };
}

// Usage in tests
export function setupFileSystemMocks(files: Record<string, string | Buffer>) {
  const mocks = createMockFileSystem(files);

  vi.mock('node:fs/promises', () => ({
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
    mkdir: mocks.mkdir,
  }));

  return mocks;
}
```

### 8.3 E2E Test with Real File System

```typescript
/**
 * E2E test using real temp directory
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { processFiles } from '../src/batch-processor';

describe('E2E: Batch file processing', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'batch-test-'));

    // Setup test files
    writeFileSync(join(tempDir, 'file1.txt'), 'content1');
    writeFileSync(join(tempDir, 'file2.txt'), 'content2');
    writeFileSync(join(tempDir, 'file3.txt'), 'content3');
  });

  afterEach(() => {
    // Cleanup temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should process multiple files', async () => {
    // EXECUTE: Process all files in temp directory
    const results = await processFiles(tempDir);

    // VERIFY: All files processed
    expect(results).toHaveLength(3);
    expect(results).toContain('processed: content1');
    expect(results).toContain('processed: content2');
    expect(results).toContain('processed: content3');

    // VERIFY: Output files created
    expect(existsSync(join(tempDir, 'file1.processed.txt'))).toBe(true);
    expect(existsSync(join(tempDir, 'file2.processed.txt'))).toBe(true);
    expect(existsSync(join(tempDir, 'file3.processed.txt'))).toBe(true);
  });

  it('should handle binary files', async () => {
    // SETUP: Create binary test file
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    writeFileSync(join(tempDir, 'binary.dat'), binaryData);

    // EXECUTE
    const result = await processFiles(tempDir);

    // VERIFY: Binary file processed correctly
    const outputPath = join(tempDir, 'binary.processed.dat');
    const outputContent = readFileSync(outputPath);

    expect(outputContent).toEqual(Buffer.from([0x00, 0x01, 0x02, 0x03]));
  });

  it('should clean up on error', async () => {
    // SETUP: File that will cause error
    writeFileSync(join(tempDir, 'error.txt'), '');

    // EXECUTE: Should handle error gracefully
    const results = await processFiles(tempDir);

    // VERIFY: Other files still processed
    expect(results.length).toBeGreaterThan(0);

    // VERIFY: Temp directory still cleaned up
    expect(existsSync(tempDir)).toBe(true); // Still exists before cleanup
  });
});
```

---

## 9. References and Resources

### 9.1 Vitest Documentation

**Note:** External web search was unavailable due to rate limiting. The following are standard Vitest documentation URLs (verify current content):

- **Mocking:** https://vitest.dev/guide/mocking.html
- **vi.mock API:** https://vitest.dev/api/vi.html#vi-mock
- **vi.mocked() Helper:** https://vitest.dev/api/vi.html#vi-mocked
- **Test Context:** https://vitest.dev/api/context.html

**Key Documentation Sections to Review:**
1. Module mocking with `vi.mock()`
2. Partial mocking with `vi.importActual()`
3. Type-safe mocking with `vi.mocked()`
4. Mock cleanup and restoration

### 9.2 Node.js File System Documentation

- **fs/promises API:** https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
- **Buffer API:** https://nodejs.org/api/buffer.html
- **File System Errors:** https://nodejs.org/api/errors.html#errors_common_system_errors

### 9.3 Codebase Examples (Project-Specific)

**Found in `/home/dustin/projects/hacky-hack`:**

1. **E2E Delta Test** (`tests/e2e/delta.test.ts`)
   - Lines 48-56: Module-level `fs/promises` mocking
   - Lines 409-421: `readFile` mock implementation
   - Lines 496-511: Path-based mock routing
   - Pattern: Mock at module level, implement path-based routing

2. **Session State Serialization** (`tests/unit/core/session-state-serialization.test.ts`)
   - Lines 34-39: `fs/promises` mocking with `writeFile`, `rename`, `unlink`
   - Lines 332-342: Atomic write pattern mock
   - Pattern: Mock multiple fs functions, test atomic operations

3. **Filesystem MCP Tests** (`tests/unit/tools/filesystem-mcp.test.ts`)
   - Lines 14-20: `node:fs` mocking (not `fs/promises`)
   - Lines 45-48: Type-safe mock references with `vi.mocked()`
   - Lines 170-186: Successful file read mock
   - Lines 220-235: Error handling (ENOENT) mock
   - Pattern: Comprehensive error scenario testing

### 9.4 Community Resources

**Note:** Due to rate limiting, could not fetch current community discussions. Recommended searches:

- StackOverflow: "vitest mock fs/promises Buffer"
- GitHub Issues: "vitest fs mocking type safety"
- GitHub: Search for `vi.mocked(readFile)` in repositories

**Search Queries for Future Research:**
1. "vitest mock fs/promises readFile return type"
2. "vitest buffer vs string file mocking"
3. "typescript vitest fs promises type safety"
4. "vitest e2e file system testing best practices"

### 9.5 Related Testing Libraries

- **memfs:** In-memory file system for Node.js
- **fake-fs:** File system mocking library
- **tmp:** Temporary file and directory creation

---

## 10. Key Findings Summary

### 10.1 Mocking Strategies

1. **Always mock at module level** before imports
2. **Use `vi.importActual()`** to preserve real implementations
3. **Use `vi.mocked()`** for type-safe mock access
4. **Clear mocks** in `afterEach()` to prevent state leakage

### 10.2 Buffer vs String

1. **Return Buffer by default** when no encoding specified
2. **Use type assertions** (`as unknown as Buffer`) for string returns
3. **Mock encoding parameter** to handle both cases
4. **Validate Buffer content** with `Buffer.from()` and byte comparison

### 10.3 Common Pitfalls

1. **Timing:** Mock before imports
2. **Types:** Match return types (Buffer vs string)
3. **Completeness:** Mock all used functions
4. **Cleanup:** Clear mocks between tests
5. **Paths:** Handle path variations (relative, absolute, normalized)

### 10.4 E2E Testing

1. **Prefer real temp directories** over mocks
2. **Clean up reliably** even on test failure
3. **Isolate tests** with unique temp directories
4. **Use hybrid approach:** mock network, use real files

### 10.5 Type Safety

1. **Use `vi.mocked()`** helper for typed mocks
2. **Create typed factories** for reusable mock patterns
3. **Validate mock data** with Zod schemas
4. **Respect encoding parameter** in mock implementations

---

## 11. Recommendations

### 11.1 For Current Codebase

Based on analysis of `/home/dustin/projects/hacky-hack`:

1. **Standardize mock patterns:** Create a `test-utils/mock-fs.ts` factory
2. **Add Buffer validation:** Ensure mocks return correct Buffer types
3. **Improve error mocking:** Standardize error code patterns (ENOENT, EACCES)
4. **Enhance E2E cleanup:** Ensure temp directories always cleaned up

### 11.2 For New Tests

1. **Start with real FS:** Use temp directories, only mock if necessary
2. **Type-safe mocks:** Always use `vi.mocked()` for TypeScript
3. **Document mock behavior:** Comment on what paths return what data
4. **Test error paths:** Mock error scenarios, not just success

### 11.3 For Documentation

1. **Create mocking guidelines:** Document project-specific patterns
2. **Example repository:** Maintain example test files
3. **Type examples:** Show Buffer vs string mocking patterns
4. **Troubleshooting guide:** Common mock issues and solutions

---

## Appendix A: Quick Reference

### Mock Declaration Template

```typescript
// Mock at top of file, before imports
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
});

// Import and type
import { readFile, writeFile } from 'node:fs/promises';
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
```

### Buffer Mock Template

```typescript
// Return Buffer
mockReadFile.mockResolvedValue(Buffer.from('content'));

// Return string (with encoding)
mockReadFile.mockResolvedValue('content' as unknown as Buffer);

// Handle encoding
mockReadFile.mockImplementation((path, options) => {
  if (options?.encoding) {
    return Promise.resolve('content' as unknown as Buffer);
  }
  return Promise.resolve(Buffer.from('content'));
});
```

### Error Mock Template

```typescript
// ENOENT (not found)
const error = new Error('ENOENT') as NodeJS.ErrnoException;
error.code = 'ENOENT';
mockReadFile.mockRejectedValue(error);

// EACCES (permission denied)
const error = new Error('EACCES') as NodeJS.ErrnoException;
error.code = 'EACCES';
mockReadFile.mockRejectedValue(error);
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-16
**Next Review:** After external web search available or codebase patterns updated
