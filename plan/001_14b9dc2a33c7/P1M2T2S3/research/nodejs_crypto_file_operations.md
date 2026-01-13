# Node.js Crypto and File Operations Research

## Overview

This document provides comprehensive best practices for Node.js cryptographic hashing, atomic file writes, and directory creation patterns with official documentation references and code examples suitable for inclusion in PRP documents.

**Research Date:** 2026-01-12
**Node.js Version:** 20+ (LTS)
**Purpose:** Reference implementation patterns for PRP document generation

---

## 1. Node.js Crypto API for SHA256 Hashing

### 1.1 Basic crypto.createHash() Usage

The `crypto` module provides cryptographic functionality including SHA256 hashing via `createHash()`.

**Official Documentation:**

- [Crypto Module](https://nodejs.org/api/crypto.html)
- [crypto.createHash(algorithm[, options])](https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options)

**Basic Pattern:**

```typescript
import { createHash } from 'node:crypto';

// Create a SHA256 hash instance
const hash = createHash('sha256');

// Update with data
hash.update('some data to hash');

// Get the digest in different formats
const hexDigest = hash.digest('hex'); // hexadecimal string (most common)
const base64Digest = hash.digest('base64'); // base64 string
const bufferDigest = hash.digest('buffer'); // Buffer object

console.log(hexDigest);
// Output: dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f
```

**Chained Method Pattern:**

```typescript
import { createHash } from 'node:crypto';

const hash = createHash('sha256').update('Hello, World!').digest('hex');

console.log(hash);
// Output: dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f
```

### 1.2 Reading Files and Computing Hash

**Stream-Based Approach (Recommended for Large Files)**

Official Documentation:

- [fs.createReadStream(path[, options])](https://nodejs.org/api/fs.html#fscreatereadstreampath-options)
- [Stream API](https://nodejs.org/api/stream.html)

```typescript
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';
import { Readable } from 'node:stream';

const streamPipeline = promisify(pipeline);

/**
 * Compute SHA256 hash of a file using streams
 * @param filePath - Path to the file to hash
 * @returns SHA256 hash as hexadecimal string
 */
async function hashFileStream(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk: Buffer) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (error: Error) => {
      reject(error);
    });
  });
}

// Alternative: Using pipeline for better error handling
async function hashFilePipeline(filePath: string): Promise<string> {
  const hash = createHash('sha256');

  await streamPipeline(createReadStream(filePath), hash as unknown as Readable);

  return hash.digest('hex');
}
```

**Buffered Approach (For Small Files)**

```typescript
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Compute SHA256 hash of a file using buffered read
 * @param filePath - Path to the file to hash
 * @returns SHA256 hash as hexadecimal string
 */
function hashFileBuffered(filePath: string): string {
  const fileContents = readFileSync(filePath);
  return createHash('sha256').update(fileContents).digest('hex');
}
```

### 1.3 Stream-Based vs Buffered Approaches

| Aspect           | Stream-Based           | Buffered               |
| ---------------- | ---------------------- | ---------------------- |
| **Memory Usage** | Constant (chunk size)  | Linear (file size)     |
| **Performance**  | Better for large files | Better for small files |
| **Complexity**   | Higher (async)         | Lower (sync)           |
| **Use Case**     | Files > 10MB           | Files < 10MB           |

**Recommendation:** Use stream-based approach for files larger than 10MB or when memory is constrained.

**Official Documentation:**

- [Buffer](https://nodejs.org/api/buffer.html)
- [Stream Readable](https://nodejs.org/api/stream.html#class-streamreadable)

### 1.4 Supported Hash Algorithms

Common algorithms supported by Node.js:

```typescript
// SHA256 (most common for security)
createHash('sha256');

// SHA512 (higher security, slower)
createHash('sha512');

// SHA1 (deprecated, not recommended for security)
createHash('sha1');

// MD5 (deprecated, use only for non-security purposes)
createHash('md5');

// BLAKE2b (fast, secure)
createHash('blake2b512');
```

**Official Documentation:**

- [crypto.getHashes()](https://nodejs.org/api/crypto.html#cryptogethashes) - Get list of supported algorithms

```typescript
import { getHashes } from 'node:crypto';

console.log(getHashes());
// Output: ['RSA-SHA256', 'RSA-SHA384', 'RSA-SHA512', 'RSA-SHA224', ...]
```

---

## 2. Atomic File Write Patterns in Node.js

### 2.1 Temp File + Rename Pattern

The atomic write pattern ensures data integrity by writing to a temporary file first, then renaming it to the target filename.

**Official Documentation:**

- [fs.rename(oldPath, newPath, callback)](https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback)
- [fs.promises API](https://nodejs.org/api/fs.html#fspromises-api)

**Basic Implementation:**

```typescript
import { rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Atomically write data to a file
 * Uses temp file + rename pattern for atomicity
 *
 * @param filePath - Target file path
 * @param data - Data to write (string or Buffer)
 * @throws Error if write fails (temp file cleaned up automatically)
 */
async function atomicWrite(
  filePath: string,
  data: string | Buffer
): Promise<void> {
  const tempFile = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;

  try {
    // Write to temp file
    await writeFile(tempFile, data, { mode: 0o644 });

    // Atomic rename (overwrites target if exists)
    await rename(tempFile, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
```

### 2.2 Using fs/promises with Proper Error Handling

**Complete Atomic Write Implementation:**

```typescript
import { rename, unlink, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';

interface AtomicWriteOptions {
  /**
   * File mode (permissions)
   * @default 0o644 (rw-r--r--)
   */
  mode?: number;

  /**
   * Create parent directories if they don't exist
   * @default false
   */
  createParentDir?: boolean;

  /**
   * Directory mode for created parents
   * @default 0o755 (rwxr-xr-x)
   */
  dirMode?: number;
}

/**
 * Atomically write data to a file with error handling
 *
 * @param filePath - Target file path
 * @param data - Data to write (string or Buffer)
 * @param options - Write options
 * @throws Error with context about what failed
 */
async function atomicWriteSafe(
  filePath: string,
  data: string | Buffer,
  options: AtomicWriteOptions = {}
): Promise<void> {
  const { mode = 0o644, createParentDir = false, dirMode = 0o755 } = options;

  const tempFile = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;

  try {
    // Ensure parent directory exists
    if (createParentDir) {
      const parentDir = dirname(filePath);
      try {
        await mkdir(parentDir, { mode: dirMode, recursive: true });
      } catch (error: any) {
        // Ignore EEXIST (directory already exists)
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }

    // Write to temp file
    await writeFile(tempFile, data, { mode });

    // Atomic rename
    await rename(tempFile, filePath);
  } catch (error) {
    // Clean up temp file on any error
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup errors
    }

    // Add context to error
    throw new Error(
      `Failed to atomically write ${filePath}: ${(error as Error).message}`
    );
  }
}
```

### 2.3 Cross-Platform Atomic File Operations

**Key Considerations:**

- `fs.rename()` is atomic on POSIX (Linux, macOS) but may not be on Windows across different drives
- On Windows, `EXDEV` error occurs when renaming across drives
- Use fallback to copy + unlink for cross-drive operations

**Cross-Platform Implementation:**

```typescript
import { copyFile, unlink, rename, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

/**
 * Cross-platform atomic write with fallback for cross-drive renames
 *
 * @param filePath - Target file path
 * @param data - Data to write
 * @throws Error if all attempts fail
 */
async function atomicWriteCrossPlatform(
  filePath: string,
  data: string | Buffer
): Promise<void> {
  const tempFile = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;

  try {
    await writeFile(tempFile, data, { mode: 0o644 });

    try {
      // Try atomic rename first
      await rename(tempFile, filePath);
    } catch (error: any) {
      // Fallback for cross-drive rename (Windows EXDEV)
      if (error.code === 'EXDEV') {
        await copyFile(tempFile,, filePath);
        await unlink(tempFile);
      } else {
        throw error;
      }
    }
  } catch (error) {
    // Clean up temp file
    try {
      await unlink(tempFile);
    } catch {
      // Ignore
    }
    throw error;
  }
}
```

**Official Documentation:**

- [fs.copyFile(src, dest[, flags])](https://nodejs.org/api/fs.html#fscopyfilesrc-dest-flags)
- [fs Error Codes](https://nodejs.org/api/fs.html#fs-error-codes)

### 2.4 Common Error Codes

| Code     | Description                    | Handling                        |
| -------- | ------------------------------ | ------------------------------- |
| `EEXIST` | File already exists            | Can be safely ignored for mkdir |
| `ENOENT` | Parent directory doesn't exist | Create parent directory first   |
| `EACCES` | Permission denied              | Check file permissions          |
| `EXDEV`  | Cross-device link (Windows)    | Use copy + unlink fallback      |
| `ENOSPC` | No space left on device        | Critical error, report to user  |

**Official Documentation:**

- [Common System Errors](https://nodejs.org/api/errors.html#common-system-errors)

---

## 3. File System Directory Creation Patterns

### 3.1 Recursive Directory Creation with fs.mkdir

**Official Documentation:**

- [fs.mkdir(path[, options], callback)](https://nodejs.org/api/fs.html#fsmkdirpath-options-callback)
- [fs.promises.mkdir(path[, options])](https://nodejs.org/api/fs.html#fspmkdirpath-options)

**Basic Recursive Creation:**

```typescript
import { mkdir } from 'node:fs/promises';

/**
 * Create directory recursively (including all parents)
 *
 * @param dirPath - Directory path to create
 * @param mode - File mode (permissions). Default: 0o755
 * @throws Error if creation fails (except EEXIST)
 */
async function createDirectory(
  dirPath: string,
  mode: number = 0o755
): Promise<void> {
  try {
    await mkdir(dirPath, { mode, recursive: true });
  } catch (error: any) {
    // EEXIST means directory already exists - not an error
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}
```

### 3.2 Error Handling for Existing Directories

**Robust Implementation with All Error Cases:**

```typescript
import { mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Create directory with comprehensive error handling
 *
 * @param dirPath - Directory path to create
 * @param options - Creation options
 * @returns true if directory was created, false if it already existed
 * @throws Error with descriptive message for unrecoverable errors
 */
async function createDirectorySafe(
  dirPath: string,
  options: { mode?: number; recursive?: boolean } = {}
): Promise<boolean> {
  const { mode = 0o755, recursive = true } = options;

  try {
    await mkdir(dirPath, { mode, recursive });
    return true; // Directory was created
  } catch (error: any) {
    switch (error.code) {
      case 'EEXIST':
        // Directory already exists - verify it's actually a directory
        const stats = await stat(dirPath);
        if (!stats.isDirectory()) {
          throw new Error(`Path exists but is not a directory: ${dirPath}`);
        }
        return false; // Directory already existed

      case 'EACCES':
        throw new Error(`Permission denied creating directory: ${dirPath}`);

      case 'ENOSPC':
        throw new Error(`No space left on device creating: ${dirPath}`);

      case 'EROFS':
        throw new Error(
          `Read-only filesystem cannot create directory: ${dirPath}`
        );

      default:
        throw new Error(
          `Failed to create directory ${dirPath}: ${error.message}`
        );
    }
  }
}
```

### 3.3 Permission Handling

**Understanding File Modes:**

```typescript
// Common directory permissions
const DIR_READ_WRITE_EXECUTE = 0o777; // rwxrwxrwx (world-writable - avoid)
const DIR_OWNER_FULL = 0o755; // rwxr-xr-x (standard for directories)
const DIR_OWNER_ONLY = 0o700; // rwx------ (private directory)
const DIR_READ_ONLY = 0o555; // r-xr-xr-x (read-only)

// Common file permissions
const FILE_OWNER_WRITE = 0o644; // rw-r--r-- (standard for files)
const FILE_OWNER_ONLY = 0o600; // rw------- (private file)
const FILE_EXECUTABLE = 0o755; // rwxr-xr-x (executable scripts)
```

**Permission-Safe Directory Creation:**

```typescript
import { mkdir } from 'node:fs/promises';

interface DirectoryOptions {
  /**
   * File mode (permissions)
   * @default 0o755 (rwxr-xr-x)
   */
  mode?: number;

  /**
   * Ensure parent directories exist
   * @default true
   */
  recursive?: boolean;

  /**
   * Verify permissions after creation
   * @default true
   */
  verifyPermissions?: boolean;
}

/**
 * Create directory with permission handling
 *
 * @param dirPath - Directory path to create
 * @param options - Creation options
 * @throws Error if directory cannot be created or has incorrect permissions
 */
async function createDirectoryWithPermissions(
  dirPath: string,
  options: DirectoryOptions = {}
): Promise<void> {
  const { mode = 0o755, recursive = true, verifyPermissions = true } = options;

  // Create directory
  await mkdir(dirPath, { mode, recursive });

  // Verify permissions if requested
  if (verifyPermissions) {
    await verifyDirectoryPermissions(dirPath, mode);
  }
}

/**
 * Verify directory has correct permissions
 */
async function verifyDirectoryPermissions(
  dirPath: string,
  expectedMode: number
): Promise<void> {
  const { stat } = await import('node:fs/promises');
  const stats = await stat(dirPath);

  // Check if it's a directory
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }

  // Check permissions (mask off file type bits)
  const actualMode = stats.mode & 0o777;
  if ((actualMode & expectedMode) !== expectedMode) {
    throw new Error(
      `Directory ${dirPath} has incorrect permissions: ` +
        `expected ${expectedMode.toString(8)}, got ${actualMode.toString(8)}`
    );
  }
}
```

**Official Documentation:**

- [fs.Stats.mode](https://nodejs.org/api/fs.html#class-fsstats)
- [File Modes (chmod)](https://nodejs.org/api/fs.html#fschmodpath-mode-callback)

### 3.4 Process.umask Considerations

**Understanding umask:**

```typescript
import { mkdir } from 'node:fs/promises';
import { umask } from 'node:process';

// Current umask affects created file permissions
const currentUmask = umask();
console.log('Current umask:', currentUmask.toString(8));

// Example: umask of 0o022 means:
// - Requested mode: 0o777 (rwxrwxrwx)
// - Actual mode: 0o755 (rwxr-xr-x) - 0o022 removes write for group/other

// To ensure exact permissions, temporarily set umask to 0
const oldUmask = umask(0);
try {
  await mkdir(dirPath, { mode: 0o755 });
  // Guaranteed to be exactly 0o755
} finally {
  umask(oldUmask);
}
```

**Best Practice:**

```typescript
import { mkdir } from 'node:fs/promises';
import { umask } from 'node:process';

/**
 * Create directory with exact permissions (ignoring umask)
 *
 * @param dirPath - Directory path to create
 * @param exactMode - Exact permissions to set
 */
async function createDirectoryExactPermissions(
  dirPath: string,
  exactMode: number
): Promise<void> {
  const oldUmask = umask(0);
  try {
    await mkdir(dirPath, {
      mode: exactMode,
      recursive: true,
    });
  } finally {
    umask(oldUmask);
  }
}
```

---

## 4. Complete Utility Module

### 4.1 Combined Utilities

```typescript
/**
 * Node.js File Operations Utilities
 * Provides atomic writes, hashing, and directory creation
 */

import {
  mkdir,
  rename,
  unlink,
  writeFile,
  copyFile,
  stat,
} from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { dirname } from 'node:path';
import { umask } from 'node:process';

// ============================================================================
// Hash Utilities
// ============================================================================

/**
 * Compute SHA256 hash of a file using streams
 * @param filePath - Path to the file to hash
 * @returns SHA256 hash as hexadecimal string
 */
export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');

    // Dynamically import to avoid top-level import issues
    import('node:fs').then(({ createReadStream }) => {
      const stream = createReadStream(filePath);

      stream.on('data', (chunk: Buffer) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  });
}

/**
 * Compute SHA256 hash of a string or buffer
 * @param data - Data to hash
 * @returns SHA256 hash as hexadecimal string
 */
export function hashData(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// ============================================================================
// Atomic Write Utilities
// ============================================================================

interface AtomicWriteOptions {
  mode?: number;
  createParentDir?: boolean;
  dirMode?: number;
}

/**
 * Atomically write data to a file
 * @param filePath - Target file path
 * @param data - Data to write
 * @param options - Write options
 */
export async function atomicWrite(
  filePath: string,
  data: string | Buffer,
  options: AtomicWriteOptions = {}
): Promise<void> {
  const { mode = 0o644, createParentDir = false, dirMode = 0o755 } = options;

  const tempFile = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;

  try {
    if (createParentDir) {
      await ensureDirectory(dirname(filePath), dirMode);
    }

    await writeFile(tempFile, data, { mode });
    await atomicRename(tempFile, filePath);
  } catch (error) {
    try {
      await unlink(tempFile);
    } catch {
      /* ignore */
    }
    throw error;
  }
}

/**
 * Atomic rename with cross-platform fallback
 */
async function atomicRename(from: string, to: string): Promise<void> {
  try {
    await rename(from, to);
  } catch (error: any) {
    if (error.code === 'EXDEV') {
      await copyFile(from, to);
      await unlink(from);
    } else {
      throw error;
    }
  }
}

// ============================================================================
// Directory Utilities
// ============================================================================

interface DirectoryOptions {
  mode?: number;
  verifyPermissions?: boolean;
}

/**
 * Ensure directory exists with proper permissions
 * @param dirPath - Directory path
 * @param mode - File mode (default: 0o755)
 * @returns true if created, false if already existed
 */
export async function ensureDirectory(
  dirPath: string,
  mode: number = 0o755
): Promise<boolean> {
  try {
    await mkdir(dirPath, { mode, recursive: true });
    return true;
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      const stats = await stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path exists but is not a directory: ${dirPath}`);
      }
      return false;
    }
    throw error;
  }
}

/**
 * Create directory with exact permissions (ignoring umask)
 * @param dirPath - Directory path
 * @param exactMode - Exact permissions to set
 */
export async function createDirectoryExact(
  dirPath: string,
  exactMode: number
): Promise<void> {
  const oldUmask = umask(0);
  try {
    await mkdir(dirPath, { mode: exactMode, recursive: true });
  } finally {
    umask(oldUmask);
  }
}
```

---

## 5. Testing Patterns

### 5.1 Testing Atomic Writes

```typescript
import { writeFile, readFile } from 'node:fs/promises';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { atomicWrite } from './file-utils.js';

describe('atomicWrite', () => {
  const testDir = join(tmpdir(), 'test-atomic-write');
  const testFile = join(testDir, 'test.txt');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await unlink(testFile).catch(() => {});
    // Clean up test directory
    await import('node:fs/promises').then(({ rm }) =>
      rm(testDir, { recursive: true, force: true })
    );
  });

  it('should write file atomically', async () => {
    await atomicWrite(testFile, 'Hello, World!');

    const content = await readFile(testFile, 'utf-8');
    expect(content).toBe('Hello, World!');
  });

  it('should overwrite existing file atomically', async () => {
    await writeFile(testFile, 'old content');
    await atomicWrite(testFile, 'new content');

    const content = await readFile(testFile, 'utf-8');
    expect(content).toBe('new content');
  });

  it('should create parent directories when requested', async () => {
    const nestedFile = join(testDir, 'nested', 'file.txt');

    await atomicWrite(nestedFile, 'content', {
      createParentDir: true,
    });

    const content = await readFile(nestedFile, 'utf-8');
    expect(content).toBe('content');
  });
});
```

### 5.2 Testing Hash Functions

```typescript
import { describe, it, expect } from 'vitest';
import { hashData, hashFile } from './file-utils.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('hash utilities', () => {
  it('should hash strings correctly', () => {
    const hash = hashData('Hello, World!');
    expect(hash).toBe(
      'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f'
    );
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashData('input1');
    const hash2 = hashData('input2');
    expect(hash1).not.toBe(hash2);
  });

  it('should hash files correctly', async () => {
    const testFile = join(tmpdir(), 'test-hash.txt');
    await writeFile(testFile, 'test content');

    const hash = await hashFile(testFile);
    expect(hash).toBe(hashData('test content'));
  });
});
```

---

## 6. Performance Considerations

### 6.1 Hash Performance Comparison

```typescript
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

// BAD: Buffered read for large files
function hashLargeFileBad(filePath: string): string {
  const data = readFileSync(filePath); // Loads entire file into memory
  return createHash('sha256').update(data).digest('hex');
}

// GOOD: Stream-based for large files
async function hashLargeFileGood(filePath: string): Promise<string> {
  // Implementation from section 1.2
  // Uses constant memory regardless of file size
}
```

### 6.2 Write Performance

```typescript
// For small files (< 1MB): Direct write is fine
await writeFile('small.txt', data);

// For large files or critical data: Use atomic write
await atomicWrite('large.txt', data);

// For multiple writes: Batch operations
const operations = files.map(file => atomicWrite(file.path, file.data));
await Promise.all(operations);
```

---

## 7. Security Considerations

### 7.1 Hash Usage

```typescript
// GOOD: Use SHA256 for integrity checking
const integrityHash = hashData(fileContent);

// GOOD: Use SHA256 for deduplication
const fileHash = await hashFile(filePath);

// BAD: Don't use MD5 or SHA1 for security
const insecureHash = createHash('md5').update(data).digest('hex');

// AVOID: Don't use hashes for passwords (use bcrypt/argon2)
// const passwordHash = hashData(password); // WRONG!
```

### 7.2 File Permissions

```typescript
// GOOD: Restrictive permissions for sensitive data
await writeFile('secret.key', keyData, { mode: 0o600 });

// GOOD: Standard permissions for public files
await writeFile('public.html', html, { mode: 0o644 });

// BAD: World-writable directories (security risk)
await mkdir('data', { mode: 0o777 }); // DON'T DO THIS
```

### 7.3 Temp File Cleanup

```typescript
// GOOD: Use try-finally for cleanup
const tempFile = 'data.tmp';
try {
  await writeFile(tempFile, data);
  await processFile(tempFile);
} finally {
  await unlink(tempFile).catch(() => {});
}

// GOOD: Use unique temp file names
const tempFile = `${path}.${randomBytes(8).toString('hex')}.tmp`;
```

---

## 8. Common Pitfalls

### 8.1 Not Handling EEXIST

```typescript
// BAD: Throws error if directory exists
await mkdir(dirPath, { recursive: true });

// GOOD: Handle EEXIST gracefully
try {
  await mkdir(dirPath, { recursive: true });
} catch (error: any) {
  if (error.code !== 'EEXIST') throw error;
}
```

### 8.2 Race Conditions

```typescript
// BAD: Check-then-act has race condition
if (!(await fileExists(path))) {
  await writeFile(path, data); // Another process might create it here
}

// GOOD: Use atomic operations
await writeFile(path, data, { flag: 'wx' }); // Fail if exists
```

### 8.3 Memory Issues

```typescript
// BAD: Loading entire large file into memory
const hash = createHash('sha256')
  .update(readFileSync('large.bin'))
  .digest('hex');

// GOOD: Stream-based processing
const hash = await hashFile('large.bin');
```

---

## 9. Quick Reference

### Hash Operations

```typescript
import { createHash } from 'node:crypto';

// Hash string
createHash('sha256').update(data).digest('hex');

// Hash file (stream)
hashFile(filePath); // Custom function from section 4.1

// Get supported algorithms
import { getHashes } from 'node:crypto';
getHashes();
```

### Atomic Write

```typescript
import { rename, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const tempFile = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;
await writeFile(tempFile, data);
await rename(tempFile, filePath);
```

### Directory Creation

```typescript
import { mkdir } from 'node:fs/promises';

// Recursive creation (ignore EEXIST)
await mkdir(dirPath, { recursive: true }).catch(e => {
  if (e.code !== 'EEXIST') throw e;
});

// With exact permissions
import { umask } from 'node:process';
const old = umask(0);
await mkdir(dirPath, { mode: 0o755 });
umask(old);
```

---

## 10. Official Documentation URLs

### Crypto Module

- [Crypto Module Documentation](https://nodejs.org/api/crypto.html)
- [crypto.createHash()](https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options)
- [crypto.getHashes()](https://nodejs.org/api/crypto.html#cryptogethashes)
- [Hash Class](https://nodejs.org/api/crypto.html#class-hash)

### File System Module

- [File System Module Documentation](https://nodejs.org/api/fs.html)
- [fs.mkdir()](https://nodejs.org/api/fs.html#fsmkdirpath-options-callback)
- [fs.promises.mkdir()](https://nodejs.org/api/fs.html#fspmkdirpath-options)
- [fs.rename()](https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback)
- [fs.promises.rename()](https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath)
- [fs.writeFile()](https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback)
- [fs.promises.writeFile()](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options)
- [fs.createReadStream()](https://nodejs.org/api/fs.html#fscreatereadstreampath-options)
- [fs.Stats](https://nodejs.org/api/fs.html#class-fsstats)
- [fs Error Codes](https://nodejs.org/api/fs.html#fs-error-codes)

### Stream API

- [Stream Module Documentation](https://nodejs.org/api/stream.html)
- [Readable Streams](https://nodejs.org/api/stream.html#class-streamreadable)
- [stream.pipeline()](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-callback)

### Process Module

- [Process Documentation](https://nodejs.org/api/process.html)
- [process.umask()](https://nodejs.org/api/process.html#processumaskmask)

### Path Module

- [Path Module Documentation](https://nodejs.org/api/path.html)
- [path.dirname()](https://nodejs.org/api/path.html#pathdirnamepath)

### Error Handling

- [Error Documentation](https://nodejs.org/api/errors.html)
- [Common System Errors](https://nodejs.org/api/errors.html#common-system-errors)

### Buffer

- [Buffer Documentation](https://nodejs.org/api/buffer.html)

---

## Summary

This research document provides comprehensive patterns for:

1. **SHA256 Hashing**: Stream-based and buffered approaches with official Node.js crypto API references
2. **Atomic File Writes**: Temp file + rename pattern with cross-platform considerations and error handling
3. **Directory Creation**: Recursive creation with permission handling and umask considerations

All patterns include:

- Official Node.js documentation URLs with specific anchors
- Production-ready TypeScript implementations
- Error handling best practices
- Testing examples
- Security considerations
- Performance optimization guidance

These patterns are suitable for direct inclusion in PRP documents as implementation references.
