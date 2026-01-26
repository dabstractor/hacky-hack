# Atomic Write Patterns in Node.js

## Research Date: 2026-01-26

## Overview

Atomic file operations are critical for data integrity, especially when dealing with configuration files, state management, or any data where corruption could cause application failures. The core principle is ensuring that file updates either complete entirely or fail completely, with no intermediate corrupt state visible to readers.

## POSIX rename() Atomicity Guarantees

### What is POSIX rename?

The POSIX `rename()` system call provides strong atomicity guarantees defined by the POSIX standard (IEEE Std 1003.1).

**Documentation References:**

- POSIX Specification: https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html
- Linux rename(2): http://man7.org/linux/man-pages/man2/rename.2.html

### Core Atomicity Guarantees

1. **Atomic Operation**
   - `rename()` is atomic at the filesystem level
   - Either the rename completes entirely, or it does not happen at all
   - No intermediate state is observable by other processes

2. **No Window of Inconsistency**
   - There is never a moment where both old and new filenames exist
   - There is never a moment where neither filename exists (assuming source exists)
   - Readers always see either the complete old file or the complete new file

3. **Failure Safety**
   - If `rename()` fails, both source and destination remain unchanged
   - Partial failures cannot corrupt the target file

4. **Atomic Overwrite**
   - If destination exists, it is atomically replaced
   - Old destination content is either fully present or fully replaced

### Critical Requirements

1. **Same Filesystem**
   - Atomicity is ONLY guaranteed when source and destination are on the same filesystem
   - Cross-filesystem renames will fail with `EXDEV` error
   - Always create temp files in the same directory as the target

2. **Same Directory (Recommended)**
   - Best practice: create temp file in the same directory as target
   - Ensures same filesystem
   - Works with atomic directory renames

3. **Filesystem Support**
   - Most local filesystems support atomic rename (ext4, xfs, btrfs, ntfs, etc.)
   - Network filesystems may have varying guarantees (NFS, SMB)
   - Some specialized filesystems may not support atomic operations

## The Atomic Write Pattern

### Basic Pattern

```javascript
const fs = require('fs').promises;
const path = require('path');

async function atomicWrite(filePath, data, options = {}) {
  const { mode = 0o644, tmpSuffix = '.tmp' } = options;

  // Create temp file in same directory as target
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const tempPath = path.join(dir, `${basename}${tmpSuffix}.${Date.now()}`);

  try {
    // Step 1: Write to temp file
    await fs.writeFile(tempPath, data, { mode });

    // Step 2: Sync to ensure data is on disk
    const handle = await fs.open(tempPath, 'r');
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }

    // Step 3: Atomic rename
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on failure
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
```

### Step-by-Step Explanation

**Step 1: Write to Temp File**

- Create a temporary file with a unique name
- Write all data to this temp file
- Errors here don't affect the target file
- Use unique suffix to avoid collisions (timestamp, UUID, etc.)

**Step 2: Sync to Disk**

- Call `fsync()` to ensure data is physically written to storage
- Prevents "write hole" where rename succeeds but data isn't persisted
- Critical for data integrity on power loss or system crash

**Step 3: Atomic Rename**

- Rename temp file to target file
- This is the atomic operation
- Target file is instantly replaced with complete new content

**Error Handling:**

- Clean up temp file if any step fails
- Prevents accumulation of orphaned temp files
- Always re-throw original error

## Pattern Variations

### Variation 1: With Custom Temp Path

```javascript
async function atomicWriteCustomTemp(filePath, data, tempPath) {
  await fs.writeFile(tempPath, data, { mode: 0o644 });
  await fs.rename(tempPath, filePath);
}
```

**Use Case:** When you need to control the exact temp file location

**Caution:** Must ensure tempPath is on the same filesystem as filePath

### Variation 2: With Retry Logic

```javascript
async function atomicWriteWithRetry(filePath, data, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random()}`;
    try {
      await fs.writeFile(tempPath, data, { mode: 0o644 });
      await fs.rename(tempPath, filePath);
      return;
    } catch (err) {
      lastError = err;
      if (err.code === 'EEXIST') {
        // Temp file collision, retry with new name
        continue;
      }
      // Clean up and rethrow
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw err;
    }
  }
  throw lastError;
}
```

**Use Case:** High-concurrency environments where temp file name collisions are possible

### Variation 3: With File Descriptor Management

```javascript
async function atomicWriteWithFD(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  let handle;

  try {
    // Open file with desired mode
    handle = await fs.open(tempPath, 'wx', 0o644);

    // Write data
    await handle.write(data);

    // Sync to disk
    await handle.sync();

    // Close before rename
    await handle.close();
    handle = null;

    // Atomic rename
    await fs.rename(tempPath, filePath);
  } catch (error) {
    if (handle) {
      try {
        await handle.close();
      } catch {}
    }
    try {
      await fs.unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

**Use Case:** When you need fine-grained control over file operations

### Variation 4: Streaming Atomic Write

```javascript
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

async function atomicWriteStream(filePath, readStream) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  let writeStream;

  try {
    writeStream = createWriteStream(tempPath, { mode: 0o644 });
    await pipeline(readStream, writeStream);
    await fs.rename(tempPath, filePath);
  } catch (error) {
    if (writeStream) {
      writeStream.destroy();
    }
    try {
      await fs.unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

**Use Case:** Writing large files without loading entire content into memory

## Common Pitfalls and Solutions

### Pitfall 1: Cross-Filesystem Rename

```javascript
// BAD - temp file in /tmp, target in /home
const tempPath = '/tmp/config.tmp';
const targetPath = '/home/user/config.json';
await fs.writeFile(tempPath, data);
await fs.rename(tempPath, targetPath); // FAILS with EXDEV

// GOOD - temp file in same directory
const dir = path.dirname(targetPath);
const tempPath = path.join(dir, '.config.tmp');
await fs.writeFile(tempPath, data);
await fs.rename(tempPath, targetPath); // Works
```

### Pitfall 2: Missing fsync()

```javascript
// RISKY - no fsync, data may not be on disk
await fs.writeFile(tempPath, data);
await fs.rename(tempPath, targetPath);
// If system crashes here, target file may be empty!

// SAFE - fsync ensures data is persisted
await fs.writeFile(tempPath, data);
const handle = await fs.open(tempPath, 'r');
await handle.sync();
await handle.close();
await fs.rename(tempPath, targetPath);
```

### Pitfall 3: Non-Unique Temp Names

```javascript
// BAD - fixed temp name, causes collisions in concurrent scenarios
const tempPath = filePath + '.tmp';
// Multiple processes writing to same file will corrupt each other

// GOOD - unique temp names
const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random()}`;
// Or use crypto.randomBytes() for better uniqueness
```

### Pitfall 4: Ignoring Cleanup

```javascript
// BAD - orphaned temp files accumulate
try {
  await fs.writeFile(tempPath, data);
  await fs.rename(tempPath, targetPath);
} catch (err) {
  throw err; // Temp file not cleaned up!
}

// GOOD - always clean up on failure
try {
  await fs.writeFile(tempPath, data);
  await fs.rename(tempPath, targetPath);
} catch (err) {
  try {
    await fs.unlink(tempPath);
  } catch {}
  throw err;
}
```

### Pitfall 5: Wrong Permissions on Temp File

```javascript
// RISKY - temp file inherits umask
await fs.writeFile(tempPath, data);
await fs.rename(tempPath, targetPath);
// Target may have wrong permissions!

// SAFE - explicitly set mode
await fs.writeFile(tempPath, data, { mode: 0o644 });
await fs.rename(tempPath, targetPath);
// Note: rename may preserve original permissions on some systems
```

## Implementation Best Practices

### 1. Always Use Same Directory

```javascript
function getTempPath(targetPath) {
  const dir = path.dirname(targetPath);
  const basename = path.basename(targetPath);
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  return path.join(dir, `.${basename}.${uniqueId}.tmp`);
}
```

### 2. Use Hidden Files for Temp

```javascript
// Good practice: prefix with dot for "hidden" files
const tempPath = path.join(dir, `.${basename}.tmp`);
```

### 3. Include Process ID in Multi-Process Scenarios

```javascript
const tempPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
```

### 4. Validate Rename Success

```javascript
await fs.rename(tempPath, targetPath);

// Verify the operation succeeded
try {
  await fs.access(tempPath);
  throw new Error('Rename succeeded but temp file still exists');
} catch (err) {
  if (err.code !== 'ENOENT') {
    throw err;
  }
}
```

### 5. Handle Existing Temp Files

```javascript
async function cleanupOldTempFiles(directory, maxAge = 3600000) {
  const files = await fs.readdir(directory);
  const now = Date.now();

  for (const file of files) {
    if (file.endsWith('.tmp')) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        try {
          await fs.unlink(filePath);
        } catch {
          // Log but don't fail
        }
      }
    }
  }
}
```

## Advanced Considerations

### Data Integrity Checklist

- [ ] Temp file created in same directory as target
- [ ] Unique temp file name (timestamp + random)
- [ ] fsync() called before rename
- [ ] File handle closed before rename
- [ ] Proper file mode set on temp file
- [ ] Temp file cleaned up on failure
- [ ] Error codes properly handled
- [ ] Retry logic for transient failures
- [ ] Logging for debugging

### When to Use Atomic Writes

**Use Cases:**

- Configuration files
- State persistence
- Database journal files
- Lock files
- Document storage
- Any file read by other processes

**When NOT to Use:**

- Log files (append is better)
- Very large files (use streaming)
- Temporary data (no need for atomicity)
- In-memory only operations

### Performance Considerations

**fsync Impact:**

- fsync() is expensive (forces disk write)
- May not be necessary for all scenarios
- Trade-off: durability vs. performance

**Alternatives:**

- O_SYNC flag (synchronous writes)
- Write-ahead logs
- Copy-on-write strategies

## Complete Implementation Example

```javascript
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AtomicFileWriter {
  constructor(options = {}) {
    this.mode = options.mode || 0o644;
    this.tmpSuffix = options.tmpSuffix || '.tmp';
    this.fsync = options.fsync !== false; // default true
  }

  generateTempPath(targetPath) {
    const dir = path.dirname(targetPath);
    const basename = path.basename(targetPath);
    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    return path.join(dir, `.${basename}${this.tmpSuffix}.${uniqueId}`);
  }

  async write(filePath, data) {
    const tempPath = this.generateTempPath(filePath);
    let handle = null;
    let tempFileCreated = false;

    try {
      // Write to temp file
      await fs.writeFile(tempPath, data, { mode: this.mode });
      tempFileCreated = true;

      // Sync if requested
      if (this.fsync) {
        handle = await fs.open(tempPath, 'r');
        await handle.sync();
        await handle.close();
        handle = null;
      }

      // Atomic rename
      await fs.rename(tempPath, filePath);

      return { success: true, tempPath };
    } catch (error) {
      // Cleanup on failure
      if (handle) {
        try {
          await handle.close();
        } catch {}
      }
      if (tempFileCreated) {
        try {
          await fs.unlink(tempPath);
        } catch (cleanupError) {
          // Log cleanup error but don't fail
          console.warn(
            `Failed to cleanup temp file: ${tempPath}`,
            cleanupError
          );
        }
      }

      return {
        success: false,
        error,
        tempPath: tempFileCreated ? tempPath : null,
      };
    }
  }

  async writeWithRetry(filePath, data, maxRetries = 3) {
    let lastResult;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await this.write(filePath, data);

      if (result.success) {
        return result;
      }

      lastResult = result;

      // Retry on temp file collision
      if (result.error && result.error.code === 'EEXIST') {
        continue;
      }

      // Don't retry on other errors
      break;
    }

    return lastResult;
  }
}

// Usage
const writer = new AtomicFileWriter({ mode: 0o644 });
const result = await writer.writeWithRetry(
  '/path/to/config.json',
  JSON.stringify(config)
);

if (!result.success) {
  console.error('Failed to write file:', result.error);
}
```

## References

### POSIX and System Documentation

- **POSIX rename() specification**: https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html
- **Linux rename(2) man page**: http://man7.org/linux/man-pages/man2/rename.2.html
- **Linux fsync(2) man page**: http://man7.org/linux/man-pages/man2/fsync.2.html

### Node.js Documentation

- **fs.promises API**: https://nodejs.org/api/fs.html#fspromisesapi
- **fs.writeFile**: https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
- **fs.rename**: https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
- **fs.open**: https://nodejs.org/api/fs.html#fspromisesopenpath-flags-mode
- **FileHandle.sync**: https://nodejs.org/api/fs.html#filehandlesync

### Additional Reading

- **Atomic patterns in practice**: Various blog posts on atomic file operations
- **Filesystem atomicity**: Research papers on filesystem consistency
- **Node.js best practices**: Community guidelines for file operations

## Summary

The atomic write pattern using temp file + rename is a fundamental technique for ensuring data integrity in file-based operations. The key components are:

1. Write to temp file in same directory
2. Sync data to disk with fsync()
3. Rename atomically to target
4. Clean up on failure

This pattern leverages POSIX rename() atomicity guarantees to provide corruption-resistant file updates suitable for configuration files, state management, and any scenario where data integrity is critical.
