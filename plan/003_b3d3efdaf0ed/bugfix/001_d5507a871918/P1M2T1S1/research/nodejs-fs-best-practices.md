# Node.js fs.promises API Best Practices

## Research Date: 2026-01-26

## 1. fs.promises API Core Methods

### writeFile(path, data, options)

**Documentation:** https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options

The `fs.promises.writeFile()` method asynchronously writes data to a file, replacing the file if it already exists.

```javascript
const fs = require('fs').promises;

// Basic usage
await fs.writeFile('file.txt', 'Hello World', 'utf8');

// With options
await fs.writeFile('config.json', JSON.stringify(data), {
  encoding: 'utf8',
  mode: 0o644,
  flag: 'wx', // 'wx' creates new file only, fails if exists
});
```

**Key Options:**

- `encoding`: Default 'utf8', specifies character encoding
- `mode`: File permission mode (octal), e.g., `0o644`
- `flag`: File system flag (e.g., 'w' for write, 'wx' for exclusive create)
- `flush`: Boolean to ensure data is flushed to storage before callback

**Best Practices:**

1. Always use `await` with proper error handling
2. Specify `encoding` explicitly for clarity
3. Set appropriate `mode` for security
4. Consider `flag: 'wx'` to prevent accidental overwrites

### rename(oldPath, newPath)

**Documentation:** https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath

The `fs.promises.rename()` method asynchronously renames a file from oldPath to newPath.

```javascript
// Basic rename
await fs.rename('old.txt', 'new.txt');

// Atomic file replacement pattern
const tempPath = targetPath + '.tmp';
await fs.writeFile(tempPath, content);
await fs.rename(tempPath, targetPath);
```

**Key Characteristics:**

- Atomic operation on the same filesystem
- Overwrites destination if it exists
- Cannot rename across different filesystems/devices
- Preserves file metadata (ownership, permissions on most systems)

**Best Practices:**

1. Ensure temp and target files are on the same filesystem
2. Use unique temp filenames to avoid collisions
3. Handle `ENOENT` errors gracefully
4. Clean up temp files if rename fails

### unlink(path)

**Documentation:** https://nodejs.org/api/fs.html#fspromisesunlinkpath

The `fs.promises.unlink()` method asynchronously removes a file or symbolic link.

```javascript
// Basic usage
await fs.unlink('file-to-delete.txt');

// Graceful deletion (ignore if file doesn't exist)
try {
  await fs.unlink('optional-file.txt');
} catch (err) {
  if (err.code !== 'ENOENT') {
    throw err;
  }
}
```

**Error Codes:**

- `ENOENT`: No such file or directory
- `EISDIR`: Path is a directory (use `fs.rm` instead)
- `EPERM`: Permission denied

**Best Practices:**

1. Always handle `ENOENT` if file existence is optional
2. Never use `unlink` on directories (use `fs.rm` or `fs.rmdir`)
3. Verify file paths to prevent accidental deletion
4. Use `fs.rm` for recursive directory deletion (Node.js v14.14+)

## 2. File Mode Permissions

**Documentation:** https://nodejs.org/api/fs.html#file-modes

### Understanding Octal Modes

File modes are represented as octal numbers prefixed with `0o`:

```javascript
// 0o644 - Owner read/write, Group read, Others read
fs.writeFile('file.txt', data, { mode: 0o644 });

// 0o600 - Owner read/write only (sensitive files)
fs.writeFile('secrets.txt', data, { mode: 0o600 });

// 0o755 - Owner read/write/execute, Group/others read/execute
fs.writeFile('script.sh', data, { mode: 0o755 });
```

### Permission Breakdown

| Symbolic | Octal | Meaning                |
| -------- | ----- | ---------------------- |
| r--      | 4     | Read only              |
| -w-      | 2     | Write only             |
| --x      | 1     | Execute                |
| rw-      | 6     | Read + Write           |
| rwx      | 7     | Read + Write + Execute |

### Mode 0o644 Detailed

```
0o644 = rw-r--r--
        ||  ||  ||
 Owner  ||  ||  +-- Others: read (4)
        ||  |+----- Group: read (4)
        ||  +------ Group: ---
        |+--------- Owner: read (4)
        +---------- Owner: write (2)
```

**Use Cases:**

- Configuration files
- Public documentation
- Shared data files
- Non-sensitive application files

### Common File Modes

| Mode  | Permissions | Use Case                              |
| ----- | ----------- | ------------------------------------- |
| 0o600 | rw-------   | Private keys, secrets, sensitive data |
| 0o640 | rw-r-----   | Group-readable configuration          |
| 0o644 | rw-r--r--   | Public files, shared data             |
| 0o666 | rw-rw-rw-   | World-writable (rarely recommended)   |
| 0o755 | rwxr-xr-x   | Executable scripts, binaries          |

### Umask Interaction

The system `umask` affects final permissions:

```javascript
// With umask 0o022 (common default):
// Requested: 0o644 (rw-r--r--)
// Final:     0o644 (no change - umask removes write for group/others)

// With umask 0o077:
// Requested: 0o644 (rw-r--r--)
// Final:     0o600 (rw-------)
```

**Best Practices:**

1. Always use octal literals (`0o644`), not decimal (`420`)
2. Set restrictive permissions for sensitive data (`0o600`)
3. Consider the system's umask when determining final permissions
4. Be aware Windows handles permissions differently
5. Document permission requirements in your code

## 3. Error Handling Patterns

### Common Error Codes

| Code   | Meaning                   | Typical Cause                      |
| ------ | ------------------------- | ---------------------------------- |
| ENOENT | No such file or directory | File/directory doesn't exist       |
| EACCES | Permission denied         | Insufficient permissions           |
| EEXIST | File exists               | Creating file that already exists  |
| ENOSPC | No space left on device   | Disk full                          |
| EROFS  | Read-only filesystem      | Cannot write to mounted filesystem |
| EXDEV  | Cross-device link         | Rename across filesystems          |
| EISDIR | Is a directory            | Using unlink on directory          |

### Error Handling Pattern 1: Try-Catch with Specific Codes

```javascript
async function safeWriteFile(path, data) {
  try {
    await fs.writeFile(path, data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Parent directory doesn't exist
      await fs.mkdir(path.dirname(path), { recursive: true });
      await fs.writeFile(path, data);
    } else if (err.code === 'EACCES') {
      throw new Error(`Permission denied: ${path}`);
    } else {
      throw err;
    }
  }
}
```

### Error Handling Pattern 2: Graceful Degradation

```javascript
async function deleteIfExists(path) {
  try {
    await fs.unlink(path);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false; // File didn't exist, that's OK
    }
    throw err; // Re-throw other errors
  }
}
```

### Error Handling Pattern 3: Cleanup on Failure

```javascript
async function atomicWriteWithCleanup(targetPath, data) {
  const tempPath = targetPath + '.tmp.' + Date.now();
  let tempFileCreated = false;

  try {
    await fs.writeFile(tempPath, data, { mode: 0o644 });
    tempFileCreated = true;
    await fs.rename(tempPath, targetPath);
  } catch (err) {
    // Clean up temp file if it was created
    if (tempFileCreated) {
      try {
        await fs.unlink(tempPath);
      } catch (cleanupErr) {
        // Log but don't fail if cleanup fails
        console.error(`Failed to clean up temp file: ${tempPath}`, cleanupErr);
      }
    }
    throw err;
  }
}
```

### Error Handling Pattern 4: Retry for Transient Failures

```javascript
async function writeFileWithRetry(path, data, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await fs.writeFile(path, data);
      return;
    } catch (err) {
      lastError = err;
      if (err.code === 'ENOSPC' || err.code === 'EAGAIN') {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        continue;
      }
      break; // Don't retry non-transient errors
    }
  }
  throw lastError;
}
```

## 4. Additional Best Practices

### Always Use Absolute Paths

```javascript
const path = require('path');

// Good - absolute path
const configPath = path.resolve(__dirname, 'config.json');

// Avoid - relative paths (can have unexpected behavior)
await fs.readFile('config.json'); // Where is this really?
```

### Use Path Utilities

```javascript
const path = require('path');

// Proper path joining
const fullPath = path.join('/var', 'app', 'config', 'settings.json');

// Resolve to absolute
const absolutePath = path.resolve('./config/settings.json');

// Get directory name
const dirName = path.dirname('/path/to/file.txt'); // '/path/to'
```

### Consider Filesystem Characteristics

1. **Cross-filesystem operations fail**: `rename()` cannot work across different filesystems
2. **Case sensitivity**: Windows is case-insensitive, Linux is not
3. **Path separators**: Windows uses `\`, Unix uses `/` (use `path.join()`)
4. **Symlinks**: Handle symlink behavior explicitly
5. **Network filesystems**: May have different atomicity guarantees

### Resource Management

```javascript
// For file handles, always close properly
async function readFileWithHandle(path) {
  let handle;
  try {
    handle = await fs.open(path, 'r');
    const buffer = await handle.readFile();
    return buffer;
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}
```

## 5. Performance Considerations

### Batch Operations

```javascript
// Good - parallel independent operations
await Promise.all([
  fs.writeFile('file1.txt', data1),
  fs.writeFile('file2.txt', data2),
  fs.writeFile('file3.txt', data3),
]);

// Avoid - sequential when parallel is possible
await fs.writeFile('file1.txt', data1);
await fs.writeFile('file2.txt', data2);
await fs.writeFile('file3.txt', data3);
```

### Directory Watching

```javascript
// Use fs.watch for monitoring file changes
const watcher = fs.watch('/path/to/dir', (eventType, filename) => {
  console.log(`${eventType}: ${filename}`);
});

// Remember to clean up
watcher.close();
```

## References

- **Node.js fs.promises API**: https://nodejs.org/api/fs.html#fspromisesapi
- **fs.promises.writeFile**: https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
- **fs.promises.rename**: https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
- **fs.promises.unlink**: https://nodejs.org/api/fs.html#fspromisesunlinkpath
- **File Modes**: https://nodejs.org/api/fs.html#file-modes
- **File System Flags**: https://nodejs.org/api/fs.html#file-system-flags
- **fs.path**: https://nodejs.org/api/path.html
