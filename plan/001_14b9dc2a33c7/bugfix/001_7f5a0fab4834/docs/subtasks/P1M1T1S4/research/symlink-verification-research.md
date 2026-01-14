# Symlink Verification Patterns in Node.js/TypeScript

**Research Date:** 2026-01-14
**Focus:** Symlink detection, verification, and testing patterns for npm link validation

---

## Table of Contents

1. [Using `fs.lstat()` and `fs.promises.lstat()`](#1-using-fslstat-and-fspromiseslstat)
2. [Using `Stats.isSymbolicLink()` Method](#2-using-statis-symboliclink-method)
3. [Difference Between `fs.stat()` and `fs.lstat()`](#3-difference-between-fsstat-and-fslstat)
4. [Executing `ls -la` via spawn() and Parsing Output](#4-executing-ls--la-via-spawn-and-parsing-output)
5. [Mocking Filesystem Operations in Vitest](#5-mocking-filesystem-operations-in-vitest)
6. [Common Gotchas and Edge Cases](#6-common-gotchas-and-edge-cases)
7. [Complete Implementation Examples](#7-complete-implementation-examples)

---

## 1. Using `fs.lstat()` and `fs.promises.lstat()`

### Overview

`fs.lstat()` is the primary method for detecting symbolic links in Node.js. Unlike `fs.stat()`, it does NOT follow symbolic links, instead returning information about the link itself.

### Callback-Based API

```typescript
import { lstat } from 'fs';

/**
 * Check if a path is a symbolic link using callback API
 */
function isSymlinkCallback(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    lstat(path, (err, stats) => {
      if (err) {
        // Handle common errors
        if (err.code === 'ENOENT') {
          resolve(false); // File doesn't exist
        } else if (err.code === 'EACCES') {
          reject(new Error(`Permission denied: ${path}`));
        } else {
          reject(err);
        }
        return;
      }
      resolve(stats.isSymbolicLink());
    });
  });
}
```

### Promise-Based API (Recommended)

```typescript
import { lstat } from 'fs/promises';

/**
 * Check if a path is a symbolic link using async/await
 */
async function isSymlink(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);
    return stats.isSymbolicLink();
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        return false; // Path doesn't exist
      }
      throw error;
    }
    return false;
  }
}

/**
 * Get symlink target with full error handling
 */
async function getSymlinkTarget(path: string): Promise<string | null> {
  try {
    const stats = await lstat(path);
    if (!stats.isSymbolicLink()) {
      return null;
    }
    // Use readlink to get the target
    const { readlink } = await import('fs/promises');
    return await readlink(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        return null; // Path doesn't exist
      }
      if (error.code === 'EINVAL') {
        return null; // Not a symbolic link
      }
    }
    throw error;
  }
}
```

### Synchronous API

```typescript
import { lstatSync, readlinkSync } from 'fs';

/**
 * Synchronous symlink detection (use sparingly)
 */
function isSymlinkSync(path: string): boolean {
  try {
    const stats = lstatSync(path);
    return stats.isSymbolicLink();
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        return false;
      }
    }
    throw error;
  }
}

/**
 * Synchronous symlink target resolution
 */
function getSymlinkTargetSync(path: string): string | null {
  try {
    const stats = lstatSync(path);
    if (!stats.isSymbolicLink()) {
      return null;
    }
    return readlinkSync(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT' || error.code === 'EINVAL') {
        return null;
      }
    }
    throw error;
  }
}
```

### Batch Processing Multiple Paths

```typescript
import { lstat } from 'fs/promises';

/**
 * Check multiple paths for symlinks in parallel
 */
async function batchCheckSymlinks(paths: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  await Promise.all(
    paths.map(async (path) => {
      try {
        const stats = await lstat(path);
        results.set(path, stats.isSymbolicLink());
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          results.set(path, false);
        } else {
          results.set(path, false);
        }
      }
    })
  );

  return results;
}

/**
 * Find all symlinks in a directory
 */
async function findSymlinksInDirectory(dirPath: string): Promise<string[]> {
  const { readdir } = await import('fs/promises');
  const entries = await readdir(dirPath, { withFileTypes: true });

  return entries
    .filter(entry => entry.isSymbolicLink())
    .map(entry => entry.name);
}
```

---

## 2. Using `Stats.isSymbolicLink()` Method

### Basic Usage

```typescript
import { lstat } from 'fs/promises';

/**
 * Demonstrates isSymbolicLink() method usage
 */
async function demonstrateIsSymbolicLink(): Promise<void> {
  const stats = await lstat('/some/path');

  // Check if it's a symbolic link
  if (stats.isSymbolicLink()) {
    console.log('This is a symbolic link');
  }
}
```

### Combining with Other Stats Methods

```typescript
import { lstat } from 'fs/promises';

/**
 * Comprehensive file type checking
 */
async function getFileType(path: string): Promise<string> {
  try {
    const stats = await lstat(path);

    if (stats.isSymbolicLink()) {
      return 'symbolic-link';
    }
    if (stats.isFile()) {
      return 'file';
    }
    if (stats.isDirectory()) {
      return 'directory';
    }
    if (stats.isBlockDevice()) {
      return 'block-device';
    }
    if (stats.isCharacterDevice()) {
      return 'character-device';
    }
    if (stats.isFIFO()) {
      return 'fifo';
    }
    if (stats.isSocket()) {
      return 'socket';
    }

    return 'unknown';
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return 'not-found';
    }
    throw error;
  }
}
```

### Important: `isSymbolicLink()` Only Works with `lstat()`

```typescript
import { stat, lstat } from 'fs/promises';

/**
 * WRONG: Using stat() follows symlinks
 */
async function wrongWayToCheckSymlink(path: string): Promise<boolean> {
  const stats = await stat(path);
  return stats.isSymbolicLink(); // ALWAYS returns false!
}

/**
 * CORRECT: Using lstat() doesn't follow symlinks
 */
async function correctWayToCheckSymlink(path: string): Promise<boolean> {
  const stats = await lstat(path);
  return stats.isSymbolicLink(); // Returns true for symlinks
}
```

### TypeScript Type Guards

```typescript
import { lstat } from 'fs/promises';
import { Stats } from 'fs';

/**
 * Type guard for symlink Stats objects
 */
function isSymbolicLinkStats(stats: Stats): stats is Stats & { isSymbolicLink: () => true } {
  return stats.isSymbolicLink();
}

/**
 * Usage with type narrowing
 */
async function typeGuardExample(path: string): Promise<void> {
  const stats = await lstat(path);

  if (isSymbolicLinkStats(stats)) {
    // TypeScript knows this is a symlink
    console.log('Confirmed symbolic link');
  }
}
```

---

## 3. Difference Between `fs.stat()` and `fs.lstat()`

### Key Differences

| Aspect | `fs.stat()` | `fs.lstat()` |
|--------|-------------|--------------|
| **Behavior with symlinks** | Follows symlinks | Does NOT follow symlinks |
| **Returns stats for** | Target file/directory | The symlink itself |
| **Broken symlinks** | Throws error | Returns stats successfully |
| **isSymbolicLink()** | Always returns `false` | Returns `true` for symlinks |
| **Use case** | Working with actual files | Detecting/working with symlinks |

### Practical Example

```typescript
import { stat, lstat } from 'fs/promises';

/**
 * Demonstrates the difference between stat() and lstat()
 */
async function demonstrateStatVsLstat(symlinkPath: string): Promise<void> {
  console.log(`\nAnalyzing: ${symlinkPath}\n`);

  // Using stat() - follows the symlink
  try {
    const statResult = await stat(symlinkPath);
    console.log('stat() results:');
    console.log(`  - isSymbolicLink(): ${statResult.isSymbolicLink()}`);
    console.log(`  - isFile(): ${statResult.isFile()}`);
    console.log(`  - isDirectory(): ${statResult.isDirectory()}`);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      console.log(`  stat() error: ${error.code} - ${error.message}`);
    }
  }

  // Using lstat() - doesn't follow the symlink
  try {
    const lstatResult = await lstat(symlinkPath);
    console.log('\nlstat() results:');
    console.log(`  - isSymbolicLink(): ${lstatResult.isSymbolicLink()}`);
    console.log(`  - isFile(): ${lstatResult.isFile()}`);
    console.log(`  - isDirectory(): ${lstatResult.isDirectory()}`);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      console.log(`  lstat() error: ${error.code} - ${error.message}`);
    }
  }
}
```

### Example Output

For a symlink: `/usr/local/bin/node -> /usr/local/bin/nodejs`

```
Analyzing: /usr/local/bin/node

stat() results:
  - isSymbolicLink(): false
  - isFile(): true
  - isDirectory(): false

lstat() results:
  - isSymbolicLink(): true
  - isFile(): false
  - isDirectory(): false
```

### Handling Broken Symlinks

```typescript
import { stat, lstat, readlink } from 'fs/promises';

/**
 * Check if symlink is broken (points to non-existent target)
 */
async function isBrokenSymlink(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);

    if (!stats.isSymbolicLink()) {
      return false; // Not a symlink at all
    }

    // Try to stat the target
    const target = await readlink(path);
    await stat(target); // This will fail if target doesn't exist

    return false; // Target exists
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        return true; // Target doesn't exist
      }
    }
    throw error;
  }
}

/**
 * Get symlink information including target validity
 */
async function getSymlinkInfo(path: string): Promise<{
  isSymlink: boolean;
  isBroken: boolean;
  target: string | null;
}> {
  try {
    const stats = await lstat(path);

    if (!stats.isSymbolicLink()) {
      return {
        isSymlink: false,
        isBroken: false,
        target: null,
      };
    }

    const target = await readlink(path);
    const isBroken = await isBrokenSymlink(path);

    return {
      isSymlink: true,
      isBroken,
      target,
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {
        isSymlink: false,
        isBroken: false,
        target: null,
      };
    }
    throw error;
  }
}
```

### When to Use Each

```typescript
import { stat, lstat } from 'fs/promises';

/**
 * Use stat() when you want to work with the actual file
 */
async function getFileSize(path: string): Promise<number> {
  const stats = await stat(path); // Follows symlinks
  return stats.size;
}

/**
 * Use lstat() when you need to detect symlinks
 */
async function checkIfSymlink(path: string): Promise<boolean> {
  const stats = await lstat(path); // Doesn't follow symlinks
  return stats.isSymbolicLink();
}

/**
 * Combined approach: Check for symlink then get target info
 */
async function getFileInfo(path: string): Promise<{
  isSymlink: boolean;
  size: number | null;
  targetSize: number | null;
}> {
  const lstats = await lstat(path);
  const isSymlink = lstats.isSymbolicLink();

  if (!isSymlink) {
    return {
      isSymlink: false,
      size: lstats.size,
      targetSize: null,
    };
  }

  // It's a symlink, get target info
  try {
    const stats = await stat(path);
    return {
      isSymlink: true,
      size: lstats.size, // Size of the symlink itself
      targetSize: stats.size, // Size of the target file
    };
  } catch (error) {
    // Broken symlink
    return {
      isSymlink: true,
      size: lstats.size,
      targetSize: null,
    };
  }
}
```

---

## 4. Executing `ls -la` via spawn() and Parsing Output

### Basic spawn() Execution

```typescript
import { spawn } from 'child_process';
import { dirname } from 'path';

/**
 * Execute ls -la command and capture output
 */
function executeLsLa(directory: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output: Buffer[] = [];
    const errorOutput: Buffer[] = [];

    const ls = spawn('ls', ['-la', directory], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    ls.stdout.on('data', (data: Buffer) => {
      output.push(data);
    });

    ls.stderr.on('data', (data: Buffer) => {
      errorOutput.push(data);
    });

    ls.on('close', (code: number | null) => {
      if (code === 0) {
        resolve(Buffer.concat(output).toString('utf-8'));
      } else {
        const errorMessage = Buffer.concat(errorOutput).toString('utf-8');
        reject(new Error(`ls -la failed with code ${code}: ${errorMessage}`));
      }
    });

    ls.on('error', (error: Error) => {
      reject(new Error(`Failed to spawn ls: ${error.message}`));
    });
  });
}
```

### Parsing Symlink Information

```typescript
/**
 * Parse ls -la output to extract symlink information
 */
interface SymlinkInfo {
  name: string;
  target: string;
  permissions: string;
  owner: string;
  group: string;
  size: string;
  date: string;
}

function parseLsLaOutput(output: string): SymlinkInfo[] {
  const lines = output.split('\n').filter(line => line.trim());
  const symlinks: SymlinkInfo[] = [];

  // Skip header line (total ...)
  const contentLines = lines.slice(1);

  for (const line of contentLines) {
    // First character indicates file type
    // l = symbolic link, - = regular file, d = directory
    if (!line.startsWith('l')) {
      continue; // Not a symlink
    }

    // Parse ls -la line format:
    // lrwxrwxrwx 1 user group size date name -> target
    const parts = line.split(/\s+/);

    if (parts.length < 10) {
      continue;
    }

    const permissions = parts[0];
    const owner = parts[2];
    const group = parts[3];
    const size = parts[4];
    const date = `${parts[5]} ${parts[6]} ${parts[7]}`;

    // Everything after date is the name -> target part
    const nameTargetPart = parts.slice(8).join(' ');
    const arrowIndex = nameTargetPart.indexOf(' -> ');

    if (arrowIndex === -1) {
      continue; // Not a symlink line
    }

    const name = nameTargetPart.substring(0, arrowIndex);
    const target = nameTargetPart.substring(arrowIndex + 4);

    symlinks.push({
      name,
      target,
      permissions,
      owner,
      group,
      size,
      date,
    });
  }

  return symlinks;
}
```

### Complete Symlink Detection via ls

```typescript
/**
 * Find all symlinks in a directory using ls -la
 */
async function findSymlinksViaLs(directory: string): Promise<SymlinkInfo[]> {
  try {
    const output = await executeLsLa(directory);
    return parseLsLaOutput(output);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to find symlinks in ${directory}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if a specific file is a symlink using ls -la
 */
async function isSymlinkViaLs(filePath: string): Promise<boolean> {
  const directory = dirname(filePath);
  const fileName = filePath.split('/').pop() || filePath;

  try {
    const symlinks = await findSymlinksViaLs(directory);
    return symlinks.some(info => info.name === fileName);
  } catch (error) {
    return false;
  }
}
```

### Cross-Platform Considerations

```typescript
import { platform } from 'os';
import { spawn } from 'child_process';

/**
 * Execute directory listing command based on platform
 */
async function listDirectory(directory: string): Promise<string> {
  const isWindows = platform() === 'win32';

  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];

    if (isWindows) {
      // Use PowerShell on Windows
      command = 'powershell';
      args = ['-Command', `Get-ChildItem -Force "${directory}" | Format-Table -AutoSize`];
    } else {
      // Use ls on Unix-like systems
      command = 'ls';
      args = ['-la', directory];
    }

    const process = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const output: Buffer[] = [];
    const errors: Buffer[] = [];

    process.stdout.on('data', (data: Buffer) => {
      output.push(data);
    });

    process.stderr.on('data', (data: Buffer) => {
      errors.push(data);
    });

    process.on('close', (code: number | null) => {
      if (code === 0) {
        resolve(Buffer.concat(output).toString('utf-8'));
      } else {
        const errorMessage = Buffer.concat(errors).toString('utf-8');
        reject(new Error(`Command failed with code ${code}: ${errorMessage}`));
      }
    });

    process.on('error', (error: Error) => {
      reject(new Error(`Failed to spawn ${command}: ${error.message}`));
    });
  });
}
```

### Recommended: Don't Use spawn() for Symlink Detection

```typescript
/**
 * WHY YOU SHOULD USE fs.lstat() INSTEAD:
 *
 * 1. Performance: lstat() is much faster than spawning a process
 * 2. Reliability: No dependence on external commands
 * 3. Cross-platform: Works consistently across all platforms
 * 4. Parsing: No need to parse text output
 * 5. Error handling: Better error reporting
 * 6. Security: No shell injection risks
 *
 * Only use spawn() when you need additional information
 * that fs doesn't provide, such as:
 * - Owner/group information
 * - Precise modification timestamps
 * - Permission bits in specific formats
 */

import { lstat } from 'fs/promises';

/**
 * PREFERRED METHOD: Use fs.lstat() for symlink detection
 */
async function isSymlinkPreferred(filePath: string): Promise<boolean> {
  try {
    const stats = await lstat(filePath);
    return stats.isSymbolicLink();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}
```

---

## 5. Mocking Filesystem Operations in Vitest

### Pattern 1: Mocking fs.promises.lstat

```typescript
// In your test file
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lstat } from 'fs/promises';

// Mock the fs/promises module
vi.mock('fs/promises', () => ({
  lstat: vi.fn(),
}));

describe('Symlink verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect symbolic link', async () => {
    // Create mock Stats object
    const mockStats = {
      isSymbolicLink: vi.fn(() => true),
      isFile: vi.fn(() => false),
      isDirectory: vi.fn(() => false),
      size: 4096,
      mode: 0o120755,
    } as any;

    vi.mocked(lstat).mockResolvedValue(mockStats);

    const result = await checkIfSymlink('/some/path');

    expect(result).toBe(true);
    expect(lstat).toHaveBeenCalledWith('/some/path');
    expect(mockStats.isSymbolicLink).toHaveBeenCalled();
  });
});
```

### Pattern 2: Mocking fs.lstatSync

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lstatSync } from 'fs';

vi.mock('fs', () => ({
  lstatSync: vi.fn(),
}));

describe('Synchronous symlink detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect symbolic link synchronously', () => {
    const mockStats = {
      isSymbolicLink: vi.fn(() => true),
      isFile: vi.fn(() => false),
      isDirectory: vi.fn(() => false),
    } as any;

    vi.mocked(lstatSync).mockReturnValue(mockStats);

    const result = isSymlinkSync('/some/path');

    expect(result).toBe(true);
    expect(lstatSync).toHaveBeenCalledWith('/some/path');
  });
});
```

### Pattern 3: Mocking with Conditional Returns

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lstat } from 'fs/promises';

vi.mock('fs/promises', () => ({
  lstat: vi.fn(),
}));

describe('Conditional symlink detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return different results based on path', async () => {
    vi.mocked(lstat).mockImplementation((path: string) => {
      if (path === '/path/to/symlink') {
        return Promise.resolve({
          isSymbolicLink: () => true,
          isFile: () => false,
          isDirectory: () => false,
        } as any);
      } else if (path === '/path/to/file') {
        return Promise.resolve({
          isSymbolicLink: () => false,
          isFile: () => true,
          isDirectory: () => false,
        } as any);
      } else {
        return Promise.reject({
          code: 'ENOENT',
          message: `File not found: ${path}`,
        });
      }
    });

    const symlinkResult = await checkIfSymlink('/path/to/symlink');
    const fileResult = await checkIfSymlink('/path/to/file');
    const notFoundResult = await checkIfSymlink('/path/to/nonexistent');

    expect(symlinkResult).toBe(true);
    expect(fileResult).toBe(false);
    expect(notFoundResult).toBe(false);
  });
});
```

### Pattern 4: Mocking readlink

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lstat, readlink } from 'fs/promises';

vi.mock('fs/promises', () => ({
  lstat: vi.fn(),
  readlink: vi.fn(),
}));

describe('Symlink target resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve symlink target', async () => {
    const mockStats = {
      isSymbolicLink: vi.fn(() => true),
      isFile: vi.fn(() => false),
      isDirectory: vi.fn(() => false),
    } as any;

    vi.mocked(lstat).mockResolvedValue(mockStats);
    vi.mocked(readlink).mockResolvedValue('/path/to/target');

    const target = await getSymlinkTarget('/path/to/symlink');

    expect(target).toBe('/path/to/target');
    expect(readlink).toHaveBeenCalledWith('/path/to/symlink');
  });
});
```

### Pattern 5: Using Factory Functions for Mocks

```typescript
import { Stats } from 'fs';

/**
 * Factory function to create mock Stats objects
 */
function createMockStats(options: {
  isSymbolicLink?: boolean;
  isFile?: boolean;
  isDirectory?: boolean;
  size?: number;
  mode?: number;
}): Stats {
  return {
    isSymbolicLink: vi.fn(() => options.isSymbolicLink ?? false),
    isFile: vi.fn(() => options.isFile ?? false),
    isDirectory: vi.fn(() => options.isDirectory ?? false),
    isBlockDevice: vi.fn(() => false),
    isCharacterDevice: vi.fn(() => false),
    isFIFO: vi.fn(() => false),
    isSocket: vi.fn(() => false),
    dev: 0,
    ino: 0,
    mode: options.mode ?? 0o755,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: 0,
    size: options.size ?? 0,
    blksize: 4096,
    blocks: 0,
    atimeMs: 0,
    mtimeMs: 0,
    ctimeMs: 0,
    birthtimeMs: 0,
    atime: new Date(),
    mtime: new Date(),
    ctime: new Date(),
    birthtime: new Date(),
  } as Stats;
}

// Usage in tests
describe('Using mock factory', () => {
  it('should create consistent mock Stats', async () => {
    const mockSymlinkStats = createMockStats({
      isSymbolicLink: true,
      isFile: false,
      isDirectory: false,
      size: 4096,
    });

    const mockFileStats = createMockStats({
      isSymbolicLink: false,
      isFile: true,
      isDirectory: false,
      size: 1024,
    });

    vi.mocked(lstat).mockImplementation(async (path: string) => {
      if (path.includes('symlink')) {
        return mockSymlinkStats;
      }
      return mockFileStats;
    });

    expect(mockSymlinkStats.isSymbolicLink()).toBe(true);
    expect(mockFileStats.isSymbolicLink()).toBe(false);
  });
});
```

### Pattern 6: Mocking Complete Workflows

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lstat, readlink, readdir } from 'fs/promises';

vi.mock('fs/promises', () => ({
  lstat: vi.fn(),
  readlink: vi.fn(),
  readdir: vi.fn(),
}));

describe('Complete symlink verification workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify npm link symlink structure', async () => {
    const symlinkStats = createMockStats({
      isSymbolicLink: true,
      isFile: false,
      isDirectory: false,
    });

    const regularStats = createMockStats({
      isSymbolicLink: false,
      isFile: true,
      isDirectory: false,
    });

    // Mock directory listing
    vi.mocked(readdir).mockResolvedValue([
      { name: 'groundswell', isFile: () => false, isDirectory: () => true },
    ] as any);

    // Mock symlink check
    vi.mocked(lstat).mockImplementation(async (path: string) => {
      if (path.includes('node_modules/groundswell')) {
        return symlinkStats;
      }
      return regularStats;
    });

    // Mock readlink to return target
    vi.mocked(readlink).mockResolvedValue('/home/user/projects/groundswell');

    const result = await verifyNpmLinkStructure('/project');

    expect(result.isValid).toBe(true);
    expect(result.symlinkTarget).toBe('/home/user/projects/groundswell');
  });
});
```

### Pattern 7: Spying on Real Filesystem (with caution)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fsPromises from 'fs/promises';

describe('Spying on real filesystem', () => {
  // Only use this pattern when you need to test against real filesystem
  // in a controlled environment (e.g., temporary directories)

  it('should spy on lstat without replacing it', async () => {
    const lstatSpy = vi.spyOn(fsPromises, 'lstat');

    // Call real function
    await checkIfSymlink('/tmp');

    // Verify it was called
    expect(lstatSpy).toHaveBeenCalledWith('/tmp');

    // Cleanup
    lstatSpy.mockRestore();
  });
});
```

---

## 6. Common Gotchas and Edge Cases

### Gotcha 1: Forgetting that stat() Follows Symlinks

```typescript
/**
 * WRONG: This will never detect symlinks
 */
async function wrongWay(filePath: string): Promise<boolean> {
  const stats = await stat(filePath); // stat() follows symlinks!
  return stats.isSymbolicLink(); // Always returns false
}

/**
 * CORRECT: Use lstat() to detect symlinks
 */
async function rightWay(filePath: string): Promise<boolean> {
  const stats = await lstat(filePath); // lstat() doesn't follow symlinks
  return stats.isSymbolicLink(); // Returns true for symlinks
}
```

### Gotcha 2: Not Handling Broken Symlinks

```typescript
/**
 * WRONG: This fails on broken symlinks
 */
async function wrongBrokenSymlinkCheck(filePath: string): Promise<boolean> {
  try {
    await stat(filePath); // Throws ENOENT for broken symlinks
    return false; // Not a broken symlink
  } catch (error) {
    return true; // Assumes broken symlink, but could be other errors
  }
}

/**
 * CORRECT: Properly check for broken symlinks
 */
async function correctBrokenSymlinkCheck(filePath: string): Promise<boolean> {
  try {
    const stats = await lstat(filePath); // Works even if symlink is broken

    if (!stats.isSymbolicLink()) {
      return false; // Not a symlink
    }

    // Try to stat the target
    const target = await readlink(filePath);
    await stat(target); // This throws if target doesn't exist

    return false; // Target exists, not broken
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        return true; // Target doesn't exist, broken symlink
      }
    }
    throw error; // Re-throw other errors
  }
}
```

### Gotcha 3: Path Resolution Issues

```typescript
import { resolve, dirname } from 'path';

/**
 * WRONG: Not resolving relative symlink targets
 */
async function wrongRelativeSymlink(symlinkPath: string): Promise<string> {
  const target = await readlink(symlinkPath);
  return target; // Returns relative path like ../target
}

/**
 * CORRECT: Resolve relative symlink targets
 */
async function correctRelativeSymlink(symlinkPath: string): Promise<string> {
  const target = await readlink(symlinkPath);

  // Resolve relative target against symlink's directory
  if (!target.startsWith('/')) {
    const symlinkDir = dirname(symlinkPath);
    return resolve(symlinkDir, target);
  }

  return target;
}
```

### Gotcha 4: Race Conditions

```typescript
/**
 * WRONG: Check-then-act has race condition
 */
async function wrongRaceCondition(filePath: string): Promise<void> {
  const stats = await lstat(filePath); // Check

  if (stats.isSymbolicLink()) {
    // File might be deleted between check and act!
    const target = await readlink(filePath);
    console.log(`Target: ${target}`);
  }
}

/**
 * CORRECT: Handle errors from operations
 */
async function correctRaceCondition(filePath: string): Promise<void> {
  try {
    const stats = await lstat(filePath);

    if (stats.isSymbolicLink()) {
      try {
        const target = await readlink(filePath);
        console.log(`Target: ${target}`);
      } catch (error) {
        // Handle case where file is deleted
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          console.log('Symlink was deleted');
          return;
        }
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.log('File does not exist');
      return;
    }
    throw error;
  }
}
```

### Gotcha 5: Circular Symlinks

```typescript
/**
 * WRONG: Can get stuck in circular symlinks
 */
async function wrongCircularSymlink(filePath: string): Promise<string> {
  const stats = await lstat(filePath);

  if (stats.isSymbolicLink()) {
    const target = await readlink(filePath);
    // What if target points back to filePath?
    return await wrongCircularSymlink(target); // Infinite loop!
  }

  return filePath;
}

/**
 * CORRECT: Detect and handle circular symlinks
 */
async function correctCircularSymlink(
  filePath: string,
  visited = new Set<string>()
): Promise<string> {
  // Detect circular references
  if (visited.has(filePath)) {
    throw new Error(`Circular symlink detected: ${filePath}`);
  }

  visited.add(filePath);

  const stats = await lstat(filePath);

  if (stats.isSymbolicLink()) {
    const target = await readlink(filePath);
    return await correctCircularSymlink(target, visited);
  }

  return filePath;
}
```

### Gotcha 6: Not Checking File Existence First

```typescript
/**
 * WRONG: Assumes file exists
 */
async function wrongAssumeExists(filePath: string): Promise<boolean> {
  const stats = await lstat(filePath); // Throws if file doesn't exist
  return stats.isSymbolicLink();
}

/**
 * CORRECT: Handle ENOENT gracefully
 */
async function correctHandleENOENT(filePath: string): Promise<boolean> {
  try {
    const stats = await lstat(filePath);
    return stats.isSymbolicLink();
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        return false; // File doesn't exist
      }
    }
    throw error;
  }
}
```

### Gotcha 7: Permission Errors

```typescript
/**
 * WRONG: Doesn't handle permission errors
 */
async function wrongPermissionHandling(filePath: string): Promise<boolean> {
  try {
    const stats = await lstat(filePath);
    return stats.isSymbolicLink();
  } catch (error) {
    return false; // Assumes all errors mean "not a symlink"
  }
}

/**
 * CORRECT: Handle permission errors separately
 */
async function correctPermissionHandling(
  filePath: string
): Promise<{ isSymlink: boolean; error?: string }> {
  try {
    const stats = await lstat(filePath);
    return { isSymlink: stats.isSymbolicLink() };
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ENOENT') {
        return { isSymlink: false };
      }
      if (error.code === 'EACCES') {
        return { isSymlink: false, error: 'Permission denied' };
      }
    }
    throw error;
  }
}
```

### Gotcha 8: Windows vs Unix Symlinks

```typescript
import { platform } from 'os';

/**
 * Cross-platform symlink detection
 */
async function crossPlatformSymlinkCheck(filePath: string): Promise<boolean> {
  const isWindows = platform() === 'win32';

  try {
    const stats = await lstat(filePath);
    return stats.isSymbolicLink();
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      // Windows-specific error codes
      if (isWindows) {
        if (error.code === 'ENOENT') {
          return false;
        }
        if (error.code === 'EPERM') {
          // Windows requires admin privileges for symlinks
          console.warn('Administrator privileges may be required for symlink operations');
          return false;
        }
      }

      // Unix-specific error codes
      if (error.code === 'ENOENT') {
        return false;
      }
      if (error.code === 'EACCES') {
        console.warn(`Permission denied: ${filePath}`);
        return false;
      }
    }
    throw error;
  }
}
```

---

## 7. Complete Implementation Examples

### Example 1: Complete Symlink Verification Utility

```typescript
import { lstat, readlink, readdir } from 'fs/promises';
import { resolve, dirname, relative } from 'path';
import { Stats } from 'fs';

/**
 * Comprehensive symlink information
 */
export interface SymlinkInfo {
  path: string;
  isSymlink: boolean;
  isBroken: boolean;
  target: string | null;
  relativeTarget: string | null;
  stats: Stats | null;
}

/**
 * Get complete symlink information
 */
export async function getSymlinkInfo(filePath: string): Promise<SymlinkInfo> {
  try {
    const stats = await lstat(filePath);
    const isSymlink = stats.isSymbolicLink();

    if (!isSymlink) {
      return {
        path: filePath,
        isSymlink: false,
        isBroken: false,
        target: null,
        relativeTarget: null,
        stats,
      };
    }

    // It's a symlink, get target info
    let target: string | null = null;
    let isBroken = false;
    let relativeTarget: string | null = null;

    try {
      target = await readlink(filePath);

      // Calculate relative target
      if (target && !target.startsWith('/')) {
        relativeTarget = resolve(dirname(filePath), target);
      } else {
        relativeTarget = target;
      }

      // Check if target exists
      try {
        await stat(relativeTarget || target);
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          isBroken = true;
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if (error.code !== 'ENOENT' && error.code !== 'EINVAL') {
          throw error;
        }
      }
    }

    return {
      path: filePath,
      isSymlink: true,
      isBroken,
      target,
      relativeTarget,
      stats,
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {
        path: filePath,
        isSymlink: false,
        isBroken: false,
        target: null,
        relativeTarget: null,
        stats: null,
      };
    }
    throw error;
  }
}
```

### Example 2: Find All Symlinks in Directory Tree

```typescript
import { lstat, readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Find all symlinks in a directory tree
 */
export async function findAllSymlinks(
  rootDir: string,
  options: {
    maxDepth?: number;
    followSymlinks?: boolean;
  } = {}
): Promise<string[]> {
  const { maxDepth = 10, followSymlinks = false } = options;
  const symlinks: string[] = [];

  async function traverse(currentPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);

        if (entry.isSymbolicLink()) {
          symlinks.push(fullPath);

          // Optionally follow symlinks
          if (followSymlinks) {
            try {
              const target = await readlink(fullPath);
              const resolvedPath = resolve(currentPath, target);
              await traverse(resolvedPath, depth + 1);
            } catch (error) {
              // Broken symlink or other error, skip
              continue;
            }
          }
        } else if (entry.isDirectory()) {
          await traverse(fullPath, depth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
        return;
      }
      throw error;
    }
  }

  await traverse(rootDir, 0);
  return symlinks;
}
```

### Example 3: Verify npm Link Structure

```typescript
import { lstat, readlink, readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Verification result for npm link structure
 */
export interface NpmLinkVerifyResult {
  valid: boolean;
  globalLink: {
    exists: boolean;
    path: string;
    target: string | null;
  };
  localLink: {
    exists: boolean;
    path: string;
    target: string | null;
  };
  errors: string[];
}

/**
 * Verify npm link structure for a package
 */
export async function verifyNpmLink(
  packageName: string,
  projectPath: string
): Promise<NpmLinkVerifyResult> {
  const result: NpmLinkVerifyResult = {
    valid: false,
    globalLink: {
      exists: false,
      path: '',
      target: null,
    },
    localLink: {
      exists: false,
      path: '',
      target: null,
    },
    errors: [],
  };

  try {
    // Check global link
    const globalNodeModules = await getGlobalNodeModulesPath();
    const globalLinkPath = join(globalNodeModules, packageName);

    try {
      const globalStats = await lstat(globalLinkPath);
      if (globalStats.isSymbolicLink()) {
        result.globalLink.exists = true;
        result.globalLink.path = globalLinkPath;
        result.globalLink.target = await readlink(globalLinkPath);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        result.errors.push(`Global link not found: ${error.message}`);
      }
    }

    // Check local link
    const localLinkPath = join(projectPath, 'node_modules', packageName);

    try {
      const localStats = await lstat(localLinkPath);
      if (localStats.isSymbolicLink()) {
        result.localLink.exists = true;
        result.localLink.path = localLinkPath;
        result.localLink.target = await readlink(localLinkPath);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        result.errors.push(`Local link not found: ${error.message}`);
      }
    }

    // Validate structure
    result.valid =
      result.globalLink.exists &&
      result.localLink.exists &&
      result.globalLink.target !== null &&
      result.localLink.target !== null;

  } catch (error) {
    if (error instanceof Error) {
      result.errors.push(`Verification failed: ${error.message}`);
    }
  }

  return result;
}

/**
 * Get global node_modules path
 */
async function getGlobalNodeModulesPath(): Promise<string> {
  const { exec } = await import('child_process');
  const util = await import('util');
  const execAsync = util.promisify(exec);

  try {
    const { stdout } = await execAsync('npm root -g');
    return stdout.trim();
  } catch (error) {
    throw new Error('Failed to get global node_modules path');
  }
}
```

### Example 4: Complete Test Suite

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSymlinkInfo, findAllSymlinks, verifyNpmLink } from '../symlink-utils';
import { lstat, readlink, readdir } from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  lstat: vi.fn(),
  readlink: vi.fn(),
  readdir: vi.fn(),
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('Symlink utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSymlinkInfo', () => {
    it('should identify regular files', async () => {
      const mockStats = createMockStats({
        isSymbolicLink: false,
        isFile: true,
      });

      vi.mocked(lstat).mockResolvedValue(mockStats);

      const result = await getSymlinkInfo('/path/to/file.txt');

      expect(result.isSymlink).toBe(false);
      expect(result.isBroken).toBe(false);
      expect(result.target).toBeNull();
    });

    it('should identify valid symlinks', async () => {
      const mockStats = createMockStats({
        isSymbolicLink: true,
        isFile: false,
      });

      vi.mocked(lstat).mockResolvedValue(mockStats);
      vi.mocked(readlink).mockResolvedValue('/path/to/target');

      const result = await getSymlinkInfo('/path/to/symlink');

      expect(result.isSymlink).toBe(true);
      expect(result.isBroken).toBe(false);
      expect(result.target).toBe('/path/to/target');
    });

    it('should identify broken symlinks', async () => {
      const mockSymlinkStats = createMockStats({
        isSymbolicLink: true,
        isFile: false,
      });

      const mockTargetStats = createMockStats({
        isSymbolicLink: false,
        isFile: true,
      });

      vi.mocked(lstat)
        .mockResolvedValueOnce(mockSymlinkStats)
        .mockRejectedValueOnce({ code: 'ENOENT' });

      vi.mocked(readlink).mockResolvedValue('/nonexistent/target');

      const result = await getSymlinkInfo('/path/to/broken-symlink');

      expect(result.isSymlink).toBe(true);
      expect(result.isBroken).toBe(true);
    });

    it('should handle non-existent paths', async () => {
      vi.mocked(lstat).mockRejectedValue({ code: 'ENOENT' });

      const result = await getSymlinkInfo('/nonexistent/path');

      expect(result.isSymlink).toBe(false);
      expect(result.stats).toBeNull();
    });
  });

  describe('findAllSymlinks', () => {
    it('should find all symlinks in directory', async () => {
      const mockEntries = [
        { name: 'file1.txt', isSymbolicLink: () => false, isDirectory: () => false },
        { name: 'symlink1', isSymbolicLink: () => true, isDirectory: () => false },
        { name: 'symlink2', isSymbolicLink: () => true, isDirectory: () => false },
      ] as any[];

      vi.mocked(readdir).mockResolvedValue(mockEntries);

      const symlinks = await findAllSymlinks('/test/dir', { maxDepth: 1 });

      expect(symlinks).toHaveLength(2);
      expect(symlinks).toContain('/test/dir/symlink1');
      expect(symlinks).toContain('/test/dir/symlink2');
    });
  });

  describe('verifyNpmLink', () => {
    it('should verify valid npm link structure', async () => {
      const mockStats = createMockStats({
        isSymbolicLink: true,
        isFile: false,
      });

      vi.mocked(lstat).mockResolvedValue(mockStats);
      vi.mocked(readlink)
        .mockResolvedValueOnce('/home/user/projects/package')
        .mockResolvedValueOnce('../../../../home/user/projects/package');

      // Mock npm root -g
      const { exec } = await import('child_process');
      vi.mocked(exec).mockImplementation((_cmd, callback) => {
        callback(null, { stdout: '/usr/lib/node_modules' });
        return {} as any;
      });

      const result = await verifyNpmLink('test-package', '/project');

      expect(result.valid).toBe(true);
      expect(result.globalLink.exists).toBe(true);
      expect(result.localLink.exists).toBe(true);
    });
  });
});
```

---

## Quick Reference

### Common Patterns

```typescript
// 1. Check if path is a symlink
async function isSymlink(path: string): Promise<boolean> {
  const stats = await lstat(path);
  return stats.isSymbolicLink();
}

// 2. Get symlink target
async function getTarget(path: string): Promise<string | null> {
  const stats = await lstat(path);
  if (!stats.isSymbolicLink()) return null;
  return await readlink(path);
}

// 3. Check if symlink is broken
async function isBroken(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);
    if (!stats.isSymbolicLink()) return false;
    const target = await readlink(path);
    await stat(target);
    return false;
  } catch (error) {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }
}

// 4. Resolve relative symlink target
async function resolveTarget(symlinkPath: string): Promise<string> {
  const target = await readlink(symlinkPath);
  if (!target.startsWith('/')) {
    return resolve(dirname(symlinkPath), target);
  }
  return target;
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| `ENOENT` | Path doesn't exist |
| `EACCES` | Permission denied |
| `EINVAL` | Invalid argument (not a symlink) |
| `EPERM` | Operation not permitted |
| `ELOOP` | Too many symbolic links encountered |

### Best Practices

1. Always use `lstat()` to detect symlinks, not `stat()`
2. Handle `ENOENT` errors gracefully
3. Resolve relative symlink targets
4. Check for circular references
5. Use `fs.promises` for async operations
6. Don't use `spawn('ls')` unless necessary
7. Mock filesystem operations in tests
8. Handle cross-platform differences
9. Check for broken symlinks
10. Handle permission errors appropriately

---

**End of Research Document**
