# Node.js Atomic Write Patterns Research

**Research Date:** 2026-01-16
**Focus:** Node.js fs/promises atomic write patterns, best practices, and cross-platform considerations
**Goal:** Comprehensive guide to atomic file operations in Node.js

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What Are Atomic Writes?](#what-are-atomic-writes)
3. [Node.js fs/promises Documentation](#nodejs-fspromises-documentation)
4. [The Temp File + Rename Pattern](#the-temp-file--rename-pattern)
5. [Best Practices](#best-practices)
6. [Common Pitfalls and Edge Cases](#common-pitfalls-and-edge-cases)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Cross-Platform Considerations](#cross-platform-considerations)
9. [Code Examples](#code-examples)
10. [Testing Atomic Writes](#testing-atomic-writes)
11. [References and Documentation URLs](#references-and-documentation-urls)

---

## Executive Summary

Atomic file write operations are critical for preventing data corruption when writing to files in Node.js. The industry-standard pattern involves writing to a temporary file first, then atomically renaming it to the target filename using `fs.promises.rename()`.

**Key Findings:**

- `fs.promises.writeFile()` is **NOT atomic** - partial writes can corrupt files
- `fs.promises.rename()` **IS atomic** on POSIX systems when source/dest are on the same filesystem
- The temp file + rename pattern ensures data integrity even during process crashes
- Cross-platform considerations are significant (Windows vs Unix behavior differences)
- Proper error handling and cleanup are essential for reliability

**Reference Implementation:** `/home/dustin/projects/hacky-hack/src/core/session-utils.ts` (lines 99-178)

---

## What Are Atomic Writes?

### Definition

An **atomic write operation** is a file write that either:

1. **Completes successfully** - The entire file is written and visible to readers
2. **Fails completely** - The original file remains unchanged (if it existed)

There is **no intermediate state** where readers see partial or corrupted data.

### Why Atomic Writes Matter

**Problem Scenario (Non-Atomic Write):**

```javascript
// DANGEROUS: Non-atomic write
import { writeFile } from 'node:fs/promises';
await writeFile('config.json', JSON.stringify(largeObject, null, 2));
```

**What happens if process crashes mid-write:**
- File contains incomplete JSON (missing closing brace `}`)
- Subsequent reads fail with `SyntaxError: Unexpected end of JSON input`
- Application cannot recover - data is permanently lost

**Atomic Write Solution:**

```javascript
// SAFE: Atomic write using temp file + rename
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { dirname, basename, resolve } from 'node:path';

const tempPath = resolve(
  dirname(targetPath),
  `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
);

try {
  await writeFile(tempPath, data, { mode: 0o644 });
  await rename(tempPath, targetPath); // Atomic!
} catch (error) {
  await unlink(tempPath).catch(() => {}); // Cleanup
  throw error;
}
```

**Benefits:**
- Crash-safe persistence
- No partial data visible to readers
- Easy rollback (old file unchanged until new is complete)
- Concurrent reader consistency
- Multi-process safety

---

## Node.js fs/promises Documentation

### Key fs.promises Methods for Atomic Operations

| Method | Atomic? | Description |
|--------|---------|-------------|
| `fs.promises.writeFile()` | **No** | Writes to file directly, can cause corruption |
| `fs.promises.rename()` | **Yes\*** | Atomic when source/dest on same filesystem |
| `fs.promises.copyFile()` | **No** | Not atomic by default |
| `fs.promises.readFile()` | N/A | Read operation |

\*On POSIX systems (Linux, macOS), `fs.promises.rename()` is atomic when both paths are on the same filesystem.

### fs.promises.rename() Documentation

**Official Documentation URL:**
- https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath

**Key Behavior:**
- Asynchronously renames file from `oldPath` to `newPath`
- **Atomic on POSIX systems** (Linux, macOS, Unix) when on same filesystem
- Overwrites destination if it exists
- Returns `Promise<void>` - resolves on success, rejects on error

**Signature:**
```typescript
import { rename } from 'node:fs/promises';

rename(oldPath: string | Buffer | URL, newPath: string | Buffer | URL): Promise<void>
```

**Atomicity Guarantee:**
From POSIX specification:
> "The rename() function shall cause the file named by the old argument to be renamed to the path given by the new argument. [...] If the new argument names an existing file, that file shall be removed and the old argument shall be renamed to the new argument."

This operation is atomic from the perspective of all processes - no check-then-race condition possible.

### fs.promises.writeFile() Documentation

**Official Documentation URL:**
- https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options

**Key Behavior:**
- Asynchronously writes data to file
- **NOT atomic** - file can be partially written if process crashes
- Creates file if it doesn't exist, overwrites if it does
- Returns `Promise<void>` - resolves on success, rejects on error

**Signature:**
```typescript
import { writeFile } from 'node:fs/promises';

writeFile(
  file: string | Buffer | URL | FileHandle,
  data: string | Buffer | TypedArray | DataView | AsyncIterable,
  options?: WriteFileOptions
): Promise<void>
```

**Options:**
```typescript
interface WriteFileOptions {
  encoding?: BufferEncoding | null;
  mode?: number;        // File permissions (default: 0o666)
  flag?: string;        // File system flag (default: 'w')
  signal?: AbortSignal; // AbortSignal for cancellation
}
```

**Common flags for atomic writes:**
- `'w'` - Write mode (default) - creates file or truncates existing
- `'wx'` - Write mode with exclusive creation - fails if file exists

### Common Error Codes

**Official Error Codes Documentation:**
- https://nodejs.org/api/errors.html#common-system-errors
- https://nodejs.org/api/fs.html#fs-error-codes

| Code | Description | Typical Cause | Handling |
|------|-------------|---------------|----------|
| `EACCES` | Permission denied | Insufficient permissions | Check file/dir permissions |
| `EEXIST` | File exists | Using `O_CREAT | O_EXCL` | Use unique temp names |
| `EXDEV` | Cross-device link | Rename across filesystems | Use same filesystem |
| `ENOENT` | No such file/directory | Parent dir doesn't exist | Create parent directory |
| `EISDIR` | Is a directory | Target path is directory | Validate path is file |
| `ENOSPC` | No space left | Disk full | Critical error, alert user |
| `EROFS` | Read-only filesystem | Cannot write to location | Critical error, alert user |
| `EBUSY` | Resource busy | File locked or in use | Retry with backoff |

---

## The Temp File + Rename Pattern

### Core Algorithm

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

/**
 * Atomically writes data to a file using temp file + rename pattern
 *
 * @param targetPath - Final destination path for the file
 * @param data - String content to write
 * @throws {Error} If write or rename fails
 */
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  // Step 1: Generate unique temporary filename
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    // Step 2: Write complete data to temp file (non-atomic, but isolated)
    await writeFile(tempPath, data, { mode: 0o644 });

    // Step 3: Atomic rename from temp to target
    await rename(tempPath, targetPath);
  } catch (error) {
    // Step 4: Clean up temp file on failure
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors - temp file will be cleaned up later
    }
    throw error;
  }
}
```

### Why This Works

**Atomicity Guarantees:**

- **POSIX (Linux, macOS)**: `rename()` is guaranteed atomic by the filesystem
- **Windows**: `rename()` (MoveFileEx) is atomic on the same filesystem
- **Cross-device**: Fails with `EXDEV` error (see Cross-Platform Considerations)

**Reader Behavior:**

- Before `rename()`: Readers see old file (or no file)
- After `rename()`: Readers see new file (complete)
- During crash: Readers see either old or new (never corrupted)

### Failure Scenario Matrix

| Failure Point | State After Failure | Recovery | Data Integrity |
|---------------|---------------------|----------|----------------|
| **Before writeFile()** | No temp file, old target intact | N/A | ✅ Safe |
| **During writeFile()** | Partial temp file, old target intact | Delete orphaned .tmp | ✅ Safe |
| **After writeFile(), before rename()** | Complete temp file, old target intact | Delete orphaned .tmp | ✅ Safe |
| **During rename()** | Either old target OR new target, never both | Check which exists | ✅ Safe |
| **After rename()** | New target in place, no temp file | N/A | ✅ Safe |
| **During cleanup (unlink)** | New target in place, orphaned .tmp | Manual cleanup | ✅ Safe |

---

## Best Practices

### DO ✅

1. **Always use atomic writes for critical data**
   ```typescript
   await atomicWrite(jsonPath, JSON.stringify(data, null, 2));
   ```

2. **Use unique temp filenames**
   ```typescript
   import { randomBytes } from 'node:crypto';
   const tempPath = `${targetPath}.${randomBytes(8).toString('hex')}.tmp`;
   ```

3. **Validate data before writing**
   ```typescript
   const jsonString = JSON.stringify(data, null, 2);
   JSON.parse(jsonString); // Validate it's valid JSON
   await atomicWrite(path, jsonString);
   ```

4. **Clean up temp files on error**
   ```typescript
   try {
     await writeFile(tempPath, data);
     await rename(tempPath, targetPath);
   } catch (error) {
     await unlink(tempPath).catch(() => {}); // Always cleanup
     throw error;
   }
   ```

5. **Set appropriate file permissions**
   ```typescript
   await writeFile(tempPath, data, { mode: 0o644 }); // rw-r--r--
   ```

6. **Ensure same filesystem for temp and target**
   ```typescript
   const tempDir = dirname(targetPath);
   const tempPath = join(tempDir, `.tmp.${basename(targetPath)}`);
   ```

7. **Add startup cleanup for orphaned temp files**
   ```typescript
   async function cleanupTempFiles(directory: string): Promise<void> {
     const files = await readdir(directory);
     const tempFiles = files.filter(f => f.endsWith('.tmp'));

     for (const tempFile of tempFiles) {
       await unlink(join(directory, tempFile)).catch(() => {});
     }
   }
   ```

### DON'T ❌

1. **Don't write directly to target file**
   ```typescript
   // WRONG: Not atomic
   await writeFile(targetPath, JSON.stringify(data));
   ```

2. **Don't use predictable temp names**
   ```typescript
   // WRONG: Race condition with multiple processes
   const tempPath = `${targetPath}.tmp`;
   ```

3. **Don't forget cleanup on error**
   ```typescript
   // WRONG: Orphaned temp files
   await writeFile(tempPath, data);
   await rename(tempPath, targetPath); // If this throws, .tmp remains
   ```

4. **Don't assume atomic rename across filesystems**
   ```typescript
   // WRONG: May fail with EXDEV
   const tempPath = `/tmp/${basename(targetPath)}.tmp`;
   await rename(tempPath, targetPath); // Different mount!
   ```

5. **Don't ignore errors during cleanup**
   ```typescript
   // WRONG: Swallows legitimate errors
   try {
     await writeFile(tempPath, data);
     await rename(tempPath, targetPath);
   } catch (error) {
     await unlink(tempPath); // May throw, hiding original error
   }
   ```

6. **Don't use synchronous operations**
   ```typescript
   // WRONG: Blocks event loop
   fs.writeFileSync(tempPath, data);
   fs.renameSync(tempPath, targetPath);
   ```

---

## Common Pitfalls and Edge Cases

### Pitfall 1: Not Cleaning Up Temporary Files

**Problem:**
```typescript
// BAD: Temp file remains on error
try {
  await writeFile(tempPath, data);
  await rename(tempPath, targetPath);
} catch (error) {
  throw error; // Temp file not cleaned up
}
```

**Solution:**
```typescript
// GOOD: Always clean up
try {
  await writeFile(tempPath, data);
  await rename(tempPath, targetPath);
} catch (error) {
  try {
    await unlink(tempPath);
  } catch {}
  throw error;
}
```

### Pitfall 2: Temp File on Different Filesystem

**Problem:**
```typescript
// BAD: Temp file in /tmp, target in /home (EXDEV error)
const tempPath = '/tmp/file.tmp';
const filePath = '/home/user/data/file.json';
await rename(tempPath, filePath); // Fails with EXDEV
```

**Solution:**
```typescript
// GOOD: Temp file in same directory as target
const tempPath = '/home/user/data/file.tmp';
const filePath = '/home/user/data/file.json';
await rename(tempPath, filePath); // Works
```

### Pitfall 3: Not Using Unique Temp File Names

**Problem:**
```typescript
// BAD: Static temp file name causes conflicts
const tempPath = `${filePath}.tmp`;

// Two concurrent processes:
// Process 1: writeFile('file.json.tmp', data1)
// Process 2: writeFile('file.json.tmp', data2)  // Overwrites!
// Process 1: rename('file.json.tmp', 'file.json')  // Contains data2!
```

**Solution:**
```typescript
// GOOD: Unique temp file name
import { randomBytes } from 'node:crypto';
const tempPath = `${filePath}.${randomBytes(8).toString('hex')}.tmp`;
```

### Pitfall 4: Not Validating JSON Before Write

**Problem:**
```typescript
// BAD: Write without validation
await writeFile(filePath, JSON.stringify(data));
// If data has circular references, file is corrupted
```

**Solution:**
```typescript
// GOOD: Validate first
const jsonString = JSON.stringify(data, null, 2);
JSON.parse(jsonString); // Validate it's valid JSON
await atomicWrite(filePath, jsonString);
```

### Pitfall 5: Race Conditions with File Existence Checks

**Problem:**
```typescript
// BAD: Check-then-race condition
if (await fileExists(targetPath)) {
  await unlink(targetPath);  // ← Process could crash here
}
await rename(tempPath, targetPath);  // ← Or here
```

**Solution:**
```typescript
// GOOD: Single atomic operation
await rename(tempPath, targetPath);  // Overwrites atomically
```

### Pitfall 6: Disk Space Errors

**Problem:**
```typescript
// Disk full during write - temp file partial, target intact
await writeFile(tempPath, largeData);  // Fails with ENOSPC
// Now have partial temp file
```

**Solution:**
```typescript
try {
  await writeFile(tempPath, data);
  await rename(tempPath, targetPath);
} catch (error) {
  await unlink(tempPath).catch(() => {}); // Cleanup partial file
  throw error;
}
```

### Pitfall 7: Permission Errors

**Problem:**
```typescript
// Write succeeds, rename fails with EACCES
await writeFile(tempPath, data);  // Success
await rename(tempPath, targetPath);  // EACCES - owned by different user
```

**Solution:**
```typescript
try {
  await writeFile(tempPath, data);
  await rename(tempPath, targetPath);
} catch (error: any) {
  if (error.code === 'EACCES') {
    throw new Error(`Permission denied writing to ${targetPath}`);
  }
  await unlink(tempPath).catch(() => {});
  throw error;
}
```

---

## Error Handling Patterns

### Comprehensive Error Handler

```typescript
import { rename, unlink, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

interface AtomicWriteOptions {
  mode?: number;
  createParentDir?: boolean;
  dirMode?: number;
}

async function atomicWriteSafe(
  targetPath: string,
  data: string | Buffer,
  options: AtomicWriteOptions = {}
): Promise<void> {
  const { mode = 0o644, createParentDir = false, dirMode = 0o755 } = options;
  const tempPath = generateTempPath(targetPath);

  try {
    // Create parent directory if needed
    if (createParentDir) {
      await mkdir(dirname(targetPath), { mode: dirMode, recursive: true });
    }

    // Write to temp file
    await writeFile(tempPath, data, { mode });

    // Atomic rename
    await atomicRename(tempPath, targetPath);
  } catch (error) {
    // Clean up temp file on any error
    await unlink(tempPath).catch(() => {});

    // Add context to error
    throw new Error(
      `Failed to atomically write ${targetPath}: ${(error as Error).message}`
    );
  }
}
```

### Error Code-Specific Handling

```typescript
import { mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

async function atomicWriteWithErrors(
  targetPath: string,
  data: string | Buffer
): Promise<void> {
  const tempPath = generateTempPath(targetPath);

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath);
  } catch (error: any) {
    // Clean up temp file
    await unlink(tempPath).catch(() => {});

    // Handle specific errors
    switch (error.code) {
      case 'ENOENT':
        throw new Error(
          `Parent directory does not exist: ${dirname(targetPath)}`
        );
      case 'EACCES':
        throw new Error(`Permission denied writing to: ${targetPath}`);
      case 'ENOSPC':
        throw new Error(`No space left on device for: ${targetPath}`);
      case 'EROFS':
        throw new Error(`Read-only filesystem, cannot write: ${targetPath}`);
      case 'EXDEV':
        // Retry with fallback
        return atomicWriteFallback(targetPath, data);
      default:
        throw error;
    }
  }
}
```

### Retry Pattern for Transient Errors

```typescript
async function atomicWriteWithRetry(
  targetPath: string,
  data: string | Buffer,
  maxRetries: number = 3
): Promise<void> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await atomicWrite(targetPath, data);
      return; // Success
    } catch (error: any) {
      attempt++;

      // Don't retry on permanent errors
      if (['EACCES', 'ENOENT', 'EROFS'].includes(error.code)) {
        throw error;
      }

      // Retry on transient errors
      if (attempt >= maxRetries) {
        throw new Error(
          `Max retries (${maxRetries}) exceeded for ${targetPath}`
        );
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 100)
      );
    }
  }
}
```

---

## Cross-Platform Considerations

### POSIX Systems (Linux, macOS, Unix)

**Atomicity Guarantee:**
```typescript
// rename() is atomic on same filesystem
await rename(tempPath, targetPath);
```

**POSIX rename() Specification:**
- URL: https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html
- Guarantees atomic operation on same filesystem
- Either complete success or complete failure
- No intermediate state visible to other processes

**Filesystem Implementations:**
- **ext4**: Uses journaling to ensure atomic metadata updates
- **APFS (macOS)**: Uses copy-on-write for atomic operations
- **ZFS**: Always atomic due to copy-on-write architecture

### Windows

**Atomicity Behavior:**
```typescript
// rename() is atomic on same drive/volume
// Fails with EXDEV if cross-drive
try {
  await rename(tempPath, targetPath);
} catch (error: any) {
  if (error.code === 'EXDEV') {
    // Cross-drive rename not atomic, use fallback
    await copyFile(tempPath, targetPath);
    await unlink(tempPath);
  } else {
    throw error;
  }
}
```

**Windows-Specific Considerations:**
- `fs.rename()` uses `MoveFileEx` API
- Atomic on same volume (drive letter)
- **NOT** atomic when overwriting existing files on some Windows versions
- Workaround: Delete target first (not atomic, but close)

```typescript
// Windows-specific workaround
if (process.platform === 'win32') {
  try {
    await unlink(targetPath); // May fail if file doesn't exist
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}
await rename(tempPath, targetPath);
```

### Cross-Platform Implementation

```typescript
import { rename, copyFile, unlink } from 'node:fs/promises';

async function atomicRename(
  tempPath: string,
  targetPath: string
): Promise<void> {
  try {
    // Try atomic rename first (fastest)
    await rename(tempPath, targetPath);
  } catch (error: any) {
    // Fallback for cross-device rename (Windows EXDEV)
    if (error.code === 'EXDEV') {
      await copyFile(tempPath, targetPath);
      await unlink(tempPath);
    } else {
      throw error;
    }
  }
}
```

### Network Filesystems (NFS, SMB)

**Behavior:**
- Atomicity **not guaranteed** on network filesystems
- Network partitions can cause inconsistent states
- Recommendation: Avoid atomic writes on network mounts
- Alternative: Use application-level locking or transactional databases

### Container/Mount Boundaries

**Critical Rule:**
- Atomic rename **only works** on same filesystem/mount point
- Cannot rename across filesystems (throws `EXDEV` error)
- Ensure temp file and target file are on same mount

```typescript
// Safe: Same directory
atomicWrite('/data/config/settings.json', data);

// Unsafe: Different filesystems (if /tmp and /data are different mounts)
// tempPath = '/tmp/settings.json.tmp' (wrong!)
// targetPath = '/data/settings.json' (different mount!)
```

### Platform Detection

```typescript
import { platform } from 'node:process';

function getAtomicRenameStrategy(): 'rename' | 'copy-delete' {
  switch (platform) {
    case 'win32':
      return 'copy-delete'; // Windows needs special handling
    case 'linux':
    case 'darwin':
    case 'freebsd':
    case 'openbsd':
      return 'rename'; // POSIX systems have atomic rename
    default:
      return 'rename'; // Default to rename
  }
}
```

---

## Code Examples

### Basic Atomic Write

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

### Atomic Write with Fsync (Critical Data)

```typescript
import { writeFile, rename, unlink, open, close, fsync } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

async function atomicWriteCritical(
  targetPath: string,
  data: string | Buffer
): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  let fd: number | null = null;

  try {
    // Write to temp file
    await writeFile(tempPath, data, { mode: 0o644 });

    // Force flush to disk (critical for databases, WAL files)
    fd = await open(tempPath, 'r');
    await fsync(fd);

    // Atomic rename
    await rename(tempPath, targetPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  } finally {
    if (fd !== null) {
      await close(fd);
    }
  }
}
```

### Atomic JSON Write with Validation

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';
import { z } from 'zod';

async function atomicWriteJSON<T>(
  targetPath: string,
  data: T,
  schema: z.ZodSchema<T>
): Promise<void> {
  // Validate data with schema
  const validated = schema.parse(data);

  // Serialize to JSON
  const jsonString = JSON.stringify(validated, null, 2);

  // Validate JSON is parseable
  JSON.parse(jsonString);

  // Write atomically
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    await writeFile(tempPath, jsonString, { mode: 0o644 });
    await rename(tempPath, targetPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

### Batch Atomic Writes

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

interface WriteOperation {
  targetPath: string;
  data: string;
  tempPath?: string;
}

async function batchAtomicWrites(
  operations: WriteOperation[]
): Promise<void> {
  const tempPaths: string[] = [];

  try {
    // Phase 1: Write all temp files
    for (const op of operations) {
      const tempPath = resolve(
        dirname(op.targetPath),
        `.${basename(op.targetPath)}.${randomBytes(8).toString('hex')}.tmp`
      );

      op.tempPath = tempPath;
      tempPaths.push(tempPath);

      await writeFile(tempPath, op.data, { mode: 0o644 });
    }

    // Phase 2: Atomic rename all files
    for (const op of operations) {
      await rename(op.tempPath!, op.targetPath);
    }
  } catch (error) {
    // Cleanup all temp files on failure
    await Promise.all(
      tempPaths.map(path => unlink(path).catch(() => {}))
    );
    throw error;
  }
}
```

### Atomic Write with Directory Creation

```typescript
import { writeFile, rename, unlink, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

async function atomicWriteWithDirs(
  targetPath: string,
  data: string | Buffer
): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    // Create parent directory if needed
    await mkdir(dirname(targetPath), { mode: 0o755, recursive: true });

    // Write to temp file
    await writeFile(tempPath, data, { mode: 0o644 });

    // Atomic rename
    await rename(tempPath, targetPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

---

## Testing Atomic Writes

### Unit Test with Mocked fs

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

import { promises as fs } from 'node:fs';

const mockWriteFile = vi.mocked(fs.writeFile);
const mockRename = vi.mocked(fs.rename);
const mockUnlink = vi.mocked(fs.unlink);

describe('atomicWrite', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should write to temp file and rename', async () => {
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);

    await atomicWrite('/path/to/file.json', '{"test": true}');

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.tmp$/),
      expect.any(String),
      expect.any(Object)
    );
    expect(mockRename).toHaveBeenCalled();
  });

  it('should clean up temp file on write failure', async () => {
    mockWriteFile.mockRejectedValue(new Error('Write failed'));
    mockUnlink.mockResolvedValue(undefined);

    await expect(
      atomicWrite('/path/to/file.json', '{"test": true}')
    ).rejects.toThrow('Write failed');

    expect(mockUnlink).toHaveBeenCalled();
  });

  it('should clean up temp file on rename failure', async () => {
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockRejectedValue(new Error('Rename failed'));
    mockUnlink.mockResolvedValue(undefined);

    await expect(
      atomicWrite('/path/to/file.json', '{"test": true}')
    ).rejects.toThrow('Rename failed');

    expect(mockUnlink).toHaveBeenCalled();
  });
});
```

### Integration Test with Real Filesystem

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, unlink, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { atomicWrite } from './atomic-write.js';

describe('atomicWrite integration tests', () => {
  const testDir = join(tmpdir(), 'test-atomic-write');
  const testFile = join(testDir, 'test.json');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should write file atomically', async () => {
    await atomicWrite(testFile, '{"test": "data"}');

    const content = await readFile(testFile, 'utf-8');
    expect(content).toBe('{"test": "data"}');
  });

  it('should overwrite existing file atomically', async () => {
    await writeFile(testFile, 'old data');
    await atomicWrite(testFile, 'new data');

    const content = await readFile(testFile, 'utf-8');
    expect(content).toBe('new data');
  });

  it('should not corrupt file if write fails', async () => {
    // Create initial file
    await writeFile(testFile, 'original data');

    // Attempt write to invalid path
    await expect(
      atomicWrite(join(testDir, 'subdir', 'test.json'), 'data')
    ).rejects.toThrow();

    // Original file should be unchanged
    const content = await readFile(testFile, 'utf-8');
    expect(content).toBe('original data');
  });

  it('should clean up temp file on error', async () => {
    const invalidPath = join(testDir, 'subdir', 'test.json');

    await expect(atomicWrite(invalidPath, 'data')).rejects.toThrow();

    // Check no temp files left behind
    const files = await readdir(testDir);
    expect(files.filter(f => f.endsWith('.tmp'))).toHaveLength(0);
  });

  it('should use unique temp file names', async () => {
    // Execute multiple writes in parallel
    await Promise.all([
      atomicWrite(testFile, '{"version": 1}'),
      atomicWrite(testFile, '{"version": 2}'),
      atomicWrite(testFile, '{"version": 3}'),
    ]);

    // Verify final file is valid JSON
    const content = await readFile(testFile, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.version).toBeGreaterThanOrEqual(1);
    expect(parsed.version).toBeLessThanOrEqual(3);
  });
});
```

### Concurrency Test

```typescript
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { atomicWrite } from './atomic-write.js';

describe('atomicWrite concurrency', () => {
  it('should handle concurrent writes safely', async () => {
    const targetPath = join(tmpdir(), 'concurrent-test.json');
    const writeCount = 100;
    const writes = Array.from({ length: writeCount }, (_, i) =>
      atomicWrite(targetPath, `{"counter": ${i}}`)
    );

    // Execute all writes concurrently
    await Promise.all(writes);

    // Verify: File should be valid JSON
    const content = await readFile(targetPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Should have exactly one counter value
    expect(typeof parsed.counter).toBe('number');
    expect(parsed.counter).toBeGreaterThanOrEqual(0);
    expect(parsed.counter).toBeLessThan(writeCount);
  });
});
```

---

## References and Documentation URLs

### Node.js Official Documentation

**File System Module:**
- Main Documentation: https://nodejs.org/api/fs.html
- fs.promises API: https://nodejs.org/api/fs.html#fs_fspromises_api
- fs.promises.writeFile(): https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
- fs.promises.rename(): https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
- fs.promises.copyFile(): https://nodejs.org/api/fs.html#fspromisescopyfilesrc-dest-mode
- fs Error Codes: https://nodejs.org/api/fs.html#fs-error-codes

**Error Handling:**
- Error Documentation: https://nodejs.org/api/errors.html
- Common System Errors: https://nodejs.org/api/errors.html#common-system-errors

**Crypto Module:**
- Crypto Module: https://nodejs.org/api/crypto.html
- crypto.randomBytes(): https://nodejs.org/api/crypto.html#cryptorandombytessize-callback

**Path Module:**
- Path Module: https://nodejs.org/api/path.html
- path.dirname(): https://nodejs.org/api/path.html#pathdirnamepath
- path.basename(): https://nodejs.org/api/path.html#pathbasenamepath

### POSIX Standards

**POSIX Specifications:**
- POSIX rename() specification: https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html
- Atomicity guarantees: https://pubs.opengroup.org/onlinepubs/9699919799/functions/V2_chap02.html#tag_15_14_02

### Filesystem Documentation

**Linux Filesystems:**
- ext4 journaling: https://ext4.wiki.kernel.org/index.php/Ext4_Design#Journaling
- ext4 atomic operations: https://www.kernel.org/doc/html/latest/filesystems/ext4/

**macOS Filesystems:**
- APFS Technical Overview: https://developer.apple.com/support/downloads/APFS_Technical_Overview.pdf
- APFS atomic operations: https://developer.apple.com/documentation/file-systems

**ZFS:**
- OpenZFS Documentation: https://openzfs.github.io/openzfs-docs/
- ZFS atomic writes: https://openzfs.github.io/openzfs-docs/Basic%20Concepts/Transaction%20Groups.html

**Windows:**
- MoveFileEx API: https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexw
- NTFS Transactions: https://docs.microsoft.com/en-us/windows/win32/fileio/file-management

### Community Resources

**Best Practices:**
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Atomic file writes blog: https://manuel.bleichschmidt.de/blog/120706/atomic-file-writes-with-nodejs/
- File system patterns: https://www.ibm.com/developerworks/aix/library/au-endianc/

**NPM Packages:**
- write-file-atomic: https://github.com/npm/write-file-atomic
- atomically: https://github.com/fabiospampinato/atomically
- write-json-file: https://github.com/sindresorhus/write-json-file
- steno: https://github.com/typicode/steno

### Code Examples in This Project

**Implementation:**
- `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`
  - `atomicWrite()` function (lines 99-178)
  - `writeTasksJSON()` usage example
  - `writePRP()` usage example

**Tests:**
- `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`
  - Atomic write pattern tests
  - Error handling tests

**Research Documents:**
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P3M1T2S1/research/atomic_write_research.md`
- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T2S1/research/atomic-write-patterns-research.md`
- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T2S1/research/atomic-write-patterns.md`
- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M2T1S1/research/07-atomic-state-persistence-patterns.md`

---

## Summary

Atomic file write operations using the temp file + rename pattern provide:

1. **Data Integrity:** Never leaves target file in corrupted state
2. **Crash Recovery:** Either old file or new file, never partial
3. **Error Handling:** Graceful cleanup on disk full, permissions, etc.
4. **Multi-process Safety:** Concurrent writes don't corrupt data
5. **Cross-platform:** Works on POSIX, with Windows workarounds

**Implementation Requirements:**
- Unique temp filenames (random bytes or UUID)
- Write to temp file first
- Atomic rename for final commit
- Cleanup temp files on error
- Validate data before writing
- Handle platform-specific errors

**Testing Requirements:**
- Mock-based unit tests for failure scenarios
- Integration tests for real filesystem behavior
- Concurrency tests for multi-process safety
- Cross-platform tests for Windows/POSIX differences

---

**Research Complete:** 2026-01-16
**Status:** Comprehensive
**Coverage:** Complete coverage of Node.js fs/promises atomic write patterns, best practices, pitfalls, error handling, and cross-platform considerations.
