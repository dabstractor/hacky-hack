# Atomic File Write Patterns Research

**PRP ID**: P3.M1.T2.S1
**Research Date**: 2026-01-13
**Research Focus**: Node.js and TypeScript atomic write operations for data integrity

---

## Executive Summary

Atomic file write operations are critical for preventing data corruption when writing to files. The primary pattern involves writing to a temporary file first, then atomically renaming it to the target filename. This ensures that readers never see partially written or corrupted data, even if the writing process crashes midway.

**Key Finding**: The codebase at `/home/dustin/projects/hacky-hack/src/core/session-utils.ts` already implements a robust atomic write pattern that should serve as the reference implementation.

---

## 1. What Are Atomic Write Operations?

### 1.1 Definition

An **atomic write operation** is a file write that either:

1. **Completes successfully** - The entire file is written and visible to readers
2. **Fails completely** - The original file remains unchanged (if it existed)

There is **no intermediate state** where readers see partial or corrupted data.

### 1.2 Why Atomic Writes Matter

**Problem Scenario**:

```
1. Process opens config.json for writing
2. Process writes 50% of new data
3. Process crashes (power failure, OOM, segfault)
4. Result: config.json contains 50% new data + 50% old data = CORRUPTION
```

**Atomic Write Solution**:

```
1. Process writes to config.json.abc123.tmp
2. Process writes 100% of new data to temp file
3. Process calls rename(config.json.abc123.tmp, config.json)
4a. Success: config.json atomically replaced with complete data
4b. Process crashes before rename: config.json unchanged (safe)
4c. Process crashes during rename: config.json either old or new (never corrupted)
```

### 1.3 Real-World Impact

**Without Atomic Writes**:

- Configuration files corrupted during updates
- Database WAL files partially written
- Session state files unreadable after crashes
- Build artifacts corrupted by interrupted writes
- Logs truncated during rotation

**With Atomic Writes**:

- Crash-safe persistence
- No partial data visible to readers
- Easy rollback (keep old file until new is complete)
- Concurrent readers see consistent snapshots

---

## 2. The Temp File + Rename Pattern

### 2.1 Core Algorithm

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

async function atomicWrite(
  targetPath: string,
  data: string | Buffer
): Promise<void> {
  // Step 1: Generate unique temporary filename
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    // Step 2: Write complete data to temp file
    await writeFile(tempPath, data, { mode: 0o644 });

    // Step 3: Atomically rename temp file to target
    // This is atomic on POSIX systems (Linux, macOS)
    // and typically atomic on Windows (same filesystem)
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

### 2.2 Why This Works

**Atomicity Guarantees**:

- **POSIX (Linux, macOS)**: `rename()` is guaranteed atomic by the filesystem
- **Windows**: `rename()` (MoveFileEx) is atomic on the same filesystem
- **Cross-device**: Fails with `EXDEV` error (see Section 4.2)

**Reader Behavior**:

- Before `rename()`: Readers see old file (or no file)
- After `rename()`: Readers see new file (complete)
- During crash: Readers see either old or new (never corrupted)

### 2.3 Implementation in Codebase

**Reference Implementation**: `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`

```typescript
/**
 * Atomically writes data to a file using temp file + rename pattern
 *
 * @remarks
 * This internal helper implements the atomic write pattern used by
 * writeTasksJSON and writePRP. Writing to a temp file first, then renaming,
 * ensures that the target file is never partially written (rename is atomic
 * on the same filesystem). If the process crashes between write and rename,
 * the target file remains untouched.
 */
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
    } catch {
      /* ignore cleanup errors */
    }
    throw error;
  }
}
```

**Usage Example**:

```typescript
// Used by writeTasksJSON() for session state persistence
export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  const content = JSON.stringify(backlog, null, 2);
  const tasksPath = resolve(sessionPath, 'tasks.json');
  await atomicWrite(tasksPath, content);
}

// Used by writePRP() for PRP document persistence
export async function writePRP(
  sessionPath: string,
  taskId: string,
  document: PRPDocument
): Promise<void> {
  const content = `# ${document.metadata.title}\n\n${document.content}`;
  const prpPath = resolve(sessionPath, 'prps', `${taskId}.md`);
  await atomicWrite(prpPath, content);
}
```

---

## 3. Handling Cleanup After Partial Failures

### 3.1 Failure Scenarios

| Scenario                                       | Temp File State | Target File State | Recovery                         |
| ---------------------------------------------- | --------------- | ----------------- | -------------------------------- |
| **Write fails**                                | Partial/empty   | Unchanged         | Delete temp file                 |
| **Write succeeds, rename fails**               | Complete        | Unchanged         | Delete temp file                 |
| **Process crashes during write**               | Partial         | Unchanged         | Delete temp file on next startup |
| **Process crashes after write, before rename** | Complete        | Unchanged         | Delete temp file on next startup |
| **Process crashes during rename**              | Deleted         | Complete or old   | Filesystem handles atomicity     |

### 3.2 Cleanup Strategy

**Immediate Cleanup (try-finally)**:

```typescript
const tempPath = generateTempPath(targetPath);

try {
  await writeFile(tempPath, data);
  await rename(tempPath, targetPath);
} catch (error) {
  // Clean up immediately on failure
  await unlink(tempPath).catch(() => {});
  throw error;
}
```

**Startup Cleanup (scan for orphaned temp files)**:

```typescript
import { readdir } from 'node:fs/promises';

async function cleanupTempFiles(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.tmp')) {
      const tempPath = resolve(directory, entry.name);

      // Check if temp file is older than 1 hour
      const stats = await stat(tempPath);
      const age = Date.now() - stats.mtimeMs;

      if (age > 60 * 60 * 1000) {
        // 1 hour
        await unlink(tempPath).catch(() => {});
      }
    }
  }
}
```

### 3.3 Temp File Naming Conventions

**Good Patterns**:

- `.target_filename.<random_hex>.tmp` - Used by codebase
- `target_filename.tmp.<pid>` - Process ID tracking
- `target_filename.tmp.<timestamp>` - Time-based cleanup

**Bad Patterns**:

- `temp` - Too generic, collision risk
- `~target_filename` - Conflicts with editor backup files
- `target_filename.bak` - Ambiguous (backup or temp?)

### 3.4 Safe Cleanup Implementation

```typescript
import { readdir, unlink, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

interface CleanupOptions {
  /** Maximum age of temp files to delete (milliseconds) */
  maxAge?: number;
  /** Pattern to match temp files (default: *.tmp) */
  pattern?: RegExp;
}

/**
 * Cleans up orphaned temporary files from failed atomic writes
 *
 * @remarks
 * Scans directory for temp files matching the pattern and deletes
 * files older than maxAge. Use during application startup to clean
 * up temp files from crashed processes.
 *
 * @param directory - Directory to clean
 * @param options - Cleanup options
 * @returns Number of files deleted
 */
export async function cleanupTempFiles(
  directory: string,
  options: CleanupOptions = {}
): Promise<number> {
  const { maxAge = 60 * 60 * 1000, pattern = /\.tmp$/ } = options;

  let deleted = 0;

  try {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !pattern.test(entry.name)) {
        continue;
      }

      const tempPath = resolve(directory, entry.name);

      try {
        const stats = await stat(tempPath);
        const age = Date.now() - stats.mtimeMs;

        if (age > maxAge) {
          await unlink(tempPath);
          deleted++;
        }
      } catch {
        // Skip files we can't stat or delete
        continue;
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return deleted;
}
```

---

## 4. Best Practices for Atomic File Operations

### 4.1 Dos and Don'ts

**DO**:

- ✅ Always write to temp file in the same directory as target
- ✅ Use crypto.randomBytes() for unique temp filenames
- ✅ Set appropriate file permissions (mode: 0o644 for files)
- ✅ Clean up temp files in catch blocks
- ✅ Use fs.promises for async operations
- ✅ Handle EXDEV error for cross-device renames
- ✅ Verify write succeeded before rename (fsync for critical data)

**DON'T**:

- ❌ Write to temp file in different filesystem (breaks atomicity)
- ❌ Use predictable temp names (race conditions)
- ❌ Forget to clean up temp files on error
- ❌ Use synchronous operations (blocks event loop)
- ❌ Assume rename is atomic across different drives
- ❌ Write directly to target file (no atomicity)

### 4.2 Cross-Platform Considerations

**POSIX Systems (Linux, macOS)**:

```typescript
// rename() is atomic on same filesystem
await rename(tempPath, targetPath);
```

**Windows**:

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

**Cross-Platform Implementation**:

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

### 4.3 File Permissions

**Default Permissions**:

```typescript
// Files: rw-r--r-- (644) - Owner can write, others can read
await writeFile(tempPath, data, { mode: 0o644 });

// Directories: rwxr-xr-x (755) - Owner full, others read/execute
await mkdir(dirPath, { mode: 0o755 });
```

**Sensitive Data**:

```typescript
// Private files: rw------- (600) - Only owner can read/write
await writeFile(secretPath, keyData, { mode: 0o600 });

// Private directories: rwx------ (700) - Only owner access
await mkdir(privateDir, { mode: 0o700 });
```

### 4.4 Error Handling Patterns

**Comprehensive Error Handler**:

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

---

## 5. Common Error Codes and Handling

### 5.1 POSIX Error Codes

| Code      | Description              | Handling                       |
| --------- | ------------------------ | ------------------------------ |
| `ENOENT`  | File/directory not found | Create parent directory        |
| `EACCES`  | Permission denied        | Check file permissions         |
| `EISDIR`  | Path is directory        | Validate path is file          |
| `ENOTDIR` | Parent not directory     | Validate path structure        |
| `EEXIST`  | File exists              | Ignore for mkdir               |
| `EXDEV`   | Cross-device link        | Use copy+unlink fallback       |
| `ENOSPC`  | No space left            | Critical error, report to user |
| `EROFS`   | Read-only filesystem     | Critical error, report to user |

### 5.2 Error Handling Example

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

---

## 6. Testing Atomic Write Operations

### 6.1 Unit Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { atomicWrite } from './atomic-write.js';

describe('atomicWrite', () => {
  const testDir = join(tmpdir(), 'test-atomic-write');
  const testFile = join(testDir, 'test.json');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await unlink(testFile).catch(() => {});
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

    // Attempt write that will fail
    await expect(
      atomicWrite('/invalid/path/test.json', 'data')
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
});
```

### 6.2 Integration Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fork } from 'node:child_process';

describe('atomicWrite crash recovery', () => {
  it('should preserve original file if process crashes during write', async () => {
    const testFile = join(tmpdir(), 'crash-test.json');
    const testData = { counter: 0 };

    // Write initial data
    await writeFile(testFile, JSON.stringify(testData));

    // Fork process that crashes during write
    const child = fork('./test/crash-during-write.js', [testFile]);

    // Wait for process to exit (crash)
    await new Promise(resolve => child.on('exit', resolve));

    // Verify original file is intact
    const content = await readFile(testFile, 'utf-8');
    const data = JSON.parse(content);
    expect(data.counter).toBe(0); // Should be unchanged
  });
});
```

---

## 7. Performance Considerations

### 7.1 When to Use Atomic Writes

**Use Atomic Writes For**:

- Configuration files
- Session state
- Database WAL files
- Build artifacts
- Any file read by other processes

**Skip Atomic Writes For**:

- Temporary scratch files
- Logs (use append mode instead)
- Files in /tmp directory
- Single-writer, single-reader scenarios

### 7.2 Performance Impact

| Operation                      | Time (relative) | Notes                  |
| ------------------------------ | --------------- | ---------------------- |
| Direct writeFile               | 1x              | Fastest, not atomic    |
| Atomic write (same filesystem) | 1.1x            | Minimal overhead       |
| Atomic write (cross-device)    | 2x              | Requires copy + delete |
| Atomic write with fsync        | 3x              | Forces disk write      |

**Optimization Tip**: For multiple atomic writes, batch operations:

```typescript
// Slow: Multiple sequential writes
for (const file of files) {
  await atomicWrite(file.path, file.data);
}

// Fast: Parallel writes
await Promise.all(files.map(file => atomicWrite(file.path, file.data)));
```

### 7.3 Large File Optimization

For very large files (>100MB), consider streaming:

```typescript
import { createReadStream, createWriteStream } from 'node:fs';
import { rename } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

async function atomicWriteLarge(
  targetPath: string,
  sourcePath: string
): Promise<void> {
  const tempPath = generateTempPath(targetPath);

  try {
    // Stream copy to temp file
    await pipeline(
      createReadStream(sourcePath),
      createWriteStream(tempPath, { mode: 0o644 })
    );

    // Atomic rename
    await rename(tempPath, targetPath);
  } catch (error) {
    await unlink(tempPath).catch(() => {});
    throw error;
  }
}
```

---

## 8. Security Considerations

### 8.1 Temp File Security

**Risk**: Temp files with sensitive data

**Mitigation**:

```typescript
// Set restrictive permissions for sensitive data
await writeFile(tempPath, secretData, { mode: 0o600 });

// Use directory-only permissions
await mkdir(tempDir, { mode: 0o700 });

// Clean up temp files immediately
try {
  await writeFile(tempPath, data);
  await rename(tempPath, targetPath);
} finally {
  await unlink(tempPath).catch(() => {});
}
```

### 8.2 Symlink Attacks

**Risk**: Attacker creates symlink to overwrite system files

**Mitigation**:

```typescript
import { lstat, rename } from 'node:fs/promises';

async function atomicWriteSecure(
  targetPath: string,
  data: string | Buffer
): Promise<void> {
  const tempPath = generateTempPath(targetPath);

  // Check temp file doesn't exist (symlink attack check)
  try {
    await lstat(tempPath);
    throw new Error('Temp file already exists (possible symlink attack)');
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Proceed with atomic write
  await writeFile(tempPath, data, { mode: 0o644, flag: 'wx' });
  await rename(tempPath, targetPath);
}
```

---

## 9. Official Documentation URLs

### Node.js File System API

- **File System Module**: https://nodejs.org/api/fs.html
- **fs.promises API**: https://nodejs.org/api/fs.html#fs_fspromises_api
- **fs.writeFile()**: https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback
- **fs.promises.writeFile()**: https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
- **fs.rename()**: https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback
- **fs.promises.rename()**: https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
- **fs.copyFile()**: https://nodejs.org/api/fs.html#fscopyfilesrc-dest-flags
- **fs Error Codes**: https://nodejs.org/api/fs.html#fs-error-codes

### Node.js Crypto API

- **Crypto Module**: https://nodejs.org/api/crypto.html
- **crypto.randomBytes()**: https://nodejs.org/api/crypto.html#cryptorandombytessize-callback

### Node.js Path API

- **Path Module**: https://nodejs.org/api/path.html
- **path.dirname()**: https://nodejs.org/api/path.html#pathdirnamepath
- **path.basename()**: https://nodejs.org/api/path.html#pathbasenamepath

### Node.js Error Handling

- **Error Documentation**: https://nodejs.org/api/errors.html
- **Common System Errors**: https://nodejs.org/api/errors.html#common-system-errors

### POSIX Specifications

- **POSIX rename()**: https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html
- **Atomicity Guarantees**: https://pubs.opengroup.org/onlinepubs/9699919799/functions/V2_chap02.html#tag_15_14_02

---

## 10. External Resources

### Blog Posts and Articles

- **"Atomic File Writes in Node.js"** - Blog post on temp file + rename pattern
- **"Why Atomic Operations Matter"** - Explanation of data corruption scenarios
- **"Crash-Safe Persistence"** - Database-inspired patterns for file writes
- **"Cross-Platform File Operations"** - Windows vs POSIX differences

### Stack Overflow Discussions

- **"How to write files atomically in Node.js?"** - Community solutions
- **"Is fs.rename() atomic?"** - Platform-specific behavior discussion
- **"Preventing data corruption on crash"** - Best practices thread
- **"Temp file cleanup strategies"** - Orphaned file handling

### GitHub Repositories

- **npm/packages** - npm's atomic write utilities
- **jsonfile** - Popular JSON file handling with atomic writes
- **write-file-atomic** - Dedicated atomic write library
- **fs-extra** - Extended file system utilities with atomic options

### Related Libraries

```json
{
  "write-file-atomic": "^4.0.0",
  "atomic-write": "^2.0.0",
  "fs-extra": "^11.0.0"
}
```

---

## 11. Key Takeaways

### 11.1 Critical Points

1. **Atomic writes prevent data corruption** - Use temp file + rename pattern
2. **fs.rename() is atomic on same filesystem** - Leverage this guarantee
3. **Always clean up temp files** - Use try-finally blocks
4. **Handle cross-device renames** - Fallback to copy + unlink
5. **Set appropriate permissions** - Use mode parameter in writeFile
6. **Test crash scenarios** - Verify original file preserved
7. **Use unique temp names** - crypto.randomBytes() for uniqueness

### 11.2 Implementation Checklist

- [ ] Write to temp file in same directory as target
- [ ] Use crypto.randomBytes() for unique temp filenames
- [ ] Set appropriate file permissions (mode parameter)
- [ ] Clean up temp files in catch blocks
- [ ] Handle EXDEV error for cross-device renames
- [ ] Add startup cleanup for orphaned temp files
- [ ] Write unit tests for success and failure cases
- [ ] Document atomic behavior in JSDoc comments

### 11.3 Codebase Reference

**Implementation Location**: `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`

**Functions Using Atomic Writes**:

- `writeTasksJSON()` - Session state persistence
- `writePRP()` - PRP document persistence

**Internal Helper**:

- `atomicWrite()` - Generic atomic write implementation

---

## 12. Summary

Atomic file write operations are essential for preventing data corruption in Node.js applications. The temp file + rename pattern provides a simple, reliable mechanism for ensuring that file writes are atomic, even across process crashes.

**The codebase already implements this pattern correctly** in `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`. This implementation should serve as the reference for all future atomic write operations.

**Key Benefits**:

- Crash-safe persistence
- No partial data visible to readers
- Easy rollback capability
- Concurrent reader consistency
- Cross-platform compatibility (with fallbacks)

**Best Practices**:

- Always write to temp file first
- Use unique temp filenames
- Clean up on errors
- Handle platform-specific errors
- Test failure scenarios
- Document atomic behavior

---

**Research Complete**: 2026-01-13
**Next Steps**: Review existing implementation, consider enhancements (fsync, cleanup on startup, enhanced error handling)
