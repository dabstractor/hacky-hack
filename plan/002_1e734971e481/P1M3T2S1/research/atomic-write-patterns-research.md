# Atomic Write Patterns Research

## Core Pattern: Temp File + Rename

The standard atomic write pattern involves:

1. **Write to a temporary file** in the same directory as the target
2. **Use `fs.rename()`** to atomically replace the target file
3. **Handle cleanup** of temporary files on failure
4. **Ensure same filesystem** for temp and target files

```typescript
import { promises as fs } from 'node:fs';
import { randomBytes } from 'node:crypto';

async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.${randomBytes(16).toString('hex')}.tmp`;

  try {
    // Write to temporary file first
    await fs.writeFile(tempPath, data, { encoding: 'utf-8', mode: 0o644 });

    // Atomic rename (overwrites destination if exists)
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on failure
    try {
      await fs.unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

## Why This Pattern Works

- **`fs.writeFile()`** is NOT atomic - partial writes can corrupt files
- **`fs.rename()`** IS atomic on POSIX systems when source and destination are on the same filesystem
- Either the rename fully succeeds or the original file remains unchanged
- Protects against process crashes, power failures, and concurrent writes

## Node.js fs API Documentation

### Key fs.promises Methods for Atomic Operations

| Method | Atomic? | Description |
|--------|---------|-------------|
| `fs.writeFile()` | No | Writes to file directly, can cause corruption |
| `fs.rename()` | Yes* | Atomic when source/dest on same filesystem |
| `fs.copyFile()` | No | Not atomic by default |
| `fs.readFile()` | N/A | Read operation |

*On POSIX systems (Linux, macOS), `fs.rename()` is atomic when both paths are on the same filesystem.

### Documentation URLs

- **Node.js fs API**: https://nodejs.org/docs/latest-v22.x/api/fs.html
- **fs.rename()**: https://nodejs.org/docs/latest-v22.x/api/fs.html#fsrenameoldpath-newpath-callback

## Common Pitfalls to Avoid

### 1. Not Cleaning Up Temporary Files

```typescript
// BAD: Temp file remains on error
try {
  await fs.writeFile(tempPath, data);
  await fs.rename(tempPath, filePath);
} catch (error) {
  throw error; // Temp file not cleaned up
}

// GOOD: Always clean up
try {
  await fs.writeFile(tempPath, data);
  await fs.rename(tempPath, filePath);
} catch (error) {
  try {
    await fs.unlink(tempPath);
  } catch {}
  throw error;
}
```

### 2. Temp File on Different Filesystem

```typescript
// BAD: Temp file in /tmp, target in /home (EXDEV error)
const tempPath = '/tmp/file.tmp';
const filePath = '/home/user/data/file.json';
await fs.rename(tempPath, filePath); // Fails with EXDEV

// GOOD: Temp file in same directory as target
const tempPath = '/home/user/data/file.tmp';
const filePath = '/home/user/data/file.json';
await fs.rename(tempPath, filePath); // Works
```

### 3. Not Using Unique Temp File Names

```typescript
// BAD: Static temp file name causes conflicts
const tempPath = `${filePath}.tmp`;

// GOOD: Unique temp file name
const tempPath = `${filePath}.${randomBytes(16).toString('hex')}.tmp`;
```

### 4. Not Validating JSON Before Write

```typescript
// BAD: Write without validation
await fs.writeFile(filePath, JSON.stringify(data));

// GOOD: Validate first
const jsonString = JSON.stringify(data, null, 2);
JSON.parse(jsonString); // Validate it's valid JSON
await atomicWrite(filePath, jsonString);
```

## Testing Strategies for File Operations

### Using Vitest with Mocked fs

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
});
```

## Recommended npm Packages

| Package | Description | URL |
|---------|-------------|-----|
| **write-file-atomic** | Industry standard from npm team | https://github.com/npm/write-file-atomic |
| **atomically** | Simple atomic read/write | https://github.com/fabiospampinato/atomically |
| **write-json-file** | Atomic JSON writes with formatting | https://github.com/sindresorhus/write-json-file |
| **steno** | Fast async file writer | https://github.com/typicode/steno |

## Sources

- Node.js File System Documentation: https://nodejs.org/docs/latest-v22.x/api/fs.html
- write-file-atomic Package: https://github.com/npm/write-file-atomic
