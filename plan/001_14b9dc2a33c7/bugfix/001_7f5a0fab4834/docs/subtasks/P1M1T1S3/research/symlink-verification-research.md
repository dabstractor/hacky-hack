# Node.js Symlink Verification and Detection Research

**Research Date:** 2026-01-14
**Focus:** Node.js filesystem API for symlink verification, detection, and error handling
**Context:** Groundswell npm link verification (Bug 001_7f5a0fab4834)

---

## Table of Contents

1. [fs.lstat vs fs.stat: Understanding the Difference](#fs-lstat-vs-fs-stat-understanding-the-difference)
2. [Stats.isSymbolicLink(): Detecting Symlinks](#stats-issymboliclink-detecting-symlinks)
3. [fs.readlink(): Reading Symlink Targets](#fs-readlink-reading-symlink-targets)
4. [Path Resolution for Symlink Targets](#path-resolution-for-symlink-targets)
5. [Error Handling: Common Errors and Solutions](#error-handling-common-errors-and-solutions)
6. [Cross-Platform Symlink Handling](#cross-platform-symlink-handling)
7. [TypeScript Code Examples](#typescript-code-examples)
8. [Common Gotchas and Pitfalls](#common-gotchas-and-pitfalls)
9. [References](#references)

---

## 1. fs.lstat vs fs.stat: Understanding the Difference

### Key Distinction

The critical difference between `fs.stat()` and `fs.lstat()` is how they handle symbolic links:

| Method | Behavior |
|--------|----------|
| **fs.stat()** | **Follows symlinks** - returns information about the file/directory the symlink points to |
| **fs.lstat()** | **Does NOT follow symlinks** - returns information about the symlink itself |

### When to Use Each

#### Use `fs.stat()` when:
- You want information about the actual file/directory, regardless of whether a symlink was used to access it
- You're checking if a target exists and is accessible
- You need file size, modification time, or other metadata of the target

#### Use `fs.lstat()` when:
- You need to detect if a path is a symlink
- You want to check symlink permissions or metadata
- You need to read the symlink target without following it
- You're building file traversal tools that should handle symlinks specially

### Code Examples

```typescript
import { stat, lstat } from 'node:fs/promises';

async function demonstrateStatVsLstat(symlinkPath: string) {
  // Using stat() - follows symlinks
  const stats = await stat(symlinkPath);
  console.log('stat() results:');
  console.log('  isSymbolicLink():', stats.isSymbolicLink()); // Always false!
  console.log('  isDirectory():', stats.isDirectory());        // Type of target
  console.log('  size:', stats.size);                          // Size of target

  // Using lstat() - does NOT follow symlinks
  const lstats = await lstat(symlinkPath);
  console.log('lstat() results:');
  console.log('  isSymbolicLink():', lstats.isSymbolicLink()); // true for symlinks
  console.log('  isDirectory():', lstats.isDirectory());        // false for file symlinks
  console.log('  size:', lstats.size);                          // Size of link reference
}
```

### Callback API Versions

```typescript
import { stat, lstat } from 'node:fs';

// stat() callback version
stat('/path/to/file', (err, stats) => {
  if (err) throw err;
  console.log('File stats:', stats);
});

// lstat() callback version
lstat('/path/to/symlink', (err, stats) => {
  if (err) throw err;
  console.log('Symlink detected:', stats.isSymbolicLink());
});
```

### Sync API Versions

```typescript
import { statSync, lstatSync } from 'node:fs';

try {
  const stats = statSync('/path/to/file');     // Follows symlinks
  const lstats = lstatSync('/path/to/symlink'); // Does not follow symlinks
} catch (err) {
  console.error('Error:', err);
}
```

---

## 2. Stats.isSymbolicLink(): Detecting Symlinks

### Method Overview

`Stats.isSymbolicLink()` is a method on the `fs.Stats` class that returns `true` if the file is a symbolic link.

### Critical Requirement

**IMPORTANT:** `isSymbolicLink()` only returns `true` when used with `fs.lstat()` or `fs.lstatSync()`. When using `fs.stat()`, it **always returns `false`** because stat() follows the symlink.

### Examples

```typescript
import { lstat } from 'node:fs/promises';

async function isSymlink(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);
    return stats.isSymbolicLink();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false; // Path doesn't exist
    }
    throw error;
  }
}

// Usage
const isLink = await isSymlink('node_modules/groundswell');
console.log('Is symlink:', isLink);
```

### Complete Symlink Type Check

```typescript
import { lstat } from 'node:fs/promises';

interface PathTypeResult {
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  target?: string;
}

async function getPathType(path: string): Promise<PathTypeResult> {
  try {
    const stats = await lstat(path);

    const result: PathTypeResult = {
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
    };

    // If it's a symlink, read the target
    if (stats.isSymbolicLink()) {
      const { readlink } = await import('node:fs/promises');
      result.target = await readlink(path);
    }

    return result;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        exists: false,
        isFile: false,
        isDirectory: false,
        isSymbolicLink: false,
      };
    }
    throw error;
  }
}
```

### Other Useful Stats Methods

```typescript
import { lstat } from 'node:fs/promises';

const stats = await lstat('/some/path');

// Type checking methods
stats.isFile();         // true for regular files
stats.isDirectory();    // true for directories
stats.isSymbolicLink(); // true for symlinks (only with lstat!)
stats.isBlockDevice();  // true for block devices (Unix)
stats.isCharacterDevice(); // true for character devices (Unix)
stats.isFIFO();         // true for FIFO/pipe (Unix)
stats.isSocket();       // true for socket (Unix)

// Metadata properties
stats.dev;       // Device ID
stats.ino;       // Inode number
stats.mode;      // File type and mode
stats.nlink;     // Number of hard links
stats.uid;       // User ID (Unix)
stats.gid;       // Group ID (Unix)
stats.rdev;      // Device ID (if special file)
stats.size;      // File size in bytes
stats.blksize;   // Block size for I/O
stats.blocks;    // Number of blocks allocated
stats.atimeMs;   // Access time (milliseconds)
stats.mtimeMs;   // Modification time (milliseconds)
stats.ctimeMs;   // Change time (milliseconds)
stats.birthtimeMs; // Birth time (milliseconds)
```

---

## 3. fs.readlink(): Reading Symlink Targets

### Method Overview

`fs.readlink()` reads the contents of a symbolic link (i.e., the path it points to). Unlike `fs.stat()`, it does **not** follow the link.

### Promise API

```typescript
import { readlink } from 'node:fs/promises';

async function readSymlinkTarget(symlinkPath: string): Promise<string> {
  try {
    const target = await readlink(symlinkPath);
    console.log(`Symlink ${symlinkPath} points to: ${target}`);
    return target;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      throw new Error(`Symlink not found: ${symlinkPath}`);
    } else if (errno.code === 'EINVAL') {
      throw new Error(`Path is not a symlink: ${symlinkPath}`);
    }
    throw error;
  }
}
```

### Callback API

```typescript
import { readlink } from 'node:fs';

readlink('/path/to/symlink', (err, targetString) => {
  if (err) {
    console.error('Error reading symlink:', err);
    return;
  }
  console.log('Symlink target:', targetString);
});
```

### Sync API

```typescript
import { readlinkSync } from 'node:fs';

try {
  const target = readlinkSync('/path/to/symlink');
  console.log('Symlink target:', target);
} catch (err) {
  console.error('Error:', err);
}
```

### Reading Symlink with Buffer Encoding

```typescript
import { readlink } from 'node:fs/promises';

// Returns string (default)
const target1 = await readlink('/path/to/symlink');

// Returns Buffer
const targetBuffer = await readlink('/path/to/symlink', 'buffer');

// Decode manually if needed
const target2 = targetBuffer.toString('utf-8');
```

---

## 4. Path Resolution for Symlink Targets

### The Challenge

Symlink targets can be:
- **Relative paths** (e.g., `../../other-package`)
- **Absolute paths** (e.g., `/home/user/projects/package`)
- **Mixed** (depending on how the link was created)

### Resolving Relative Symlinks to Absolute Paths

```typescript
import { readlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

async function resolveSymlinkTarget(symlinkPath: string): Promise<string> {
  const target = await readlink(symlinkPath);

  // If target is already absolute, return as-is
  if (isAbsolute(target)) {
    return target;
  }

  // Resolve relative target against symlink's directory
  const symlinkDir = dirname(symlinkPath);
  return resolve(symlinkDir, target);
}

function isAbsolute(path: string): boolean {
  // Unix: starts with /
  // Windows: starts with drive letter (e.g., C:)
  return path.startsWith('/') || /^[A-Za-z]:/.test(path);
}
```

### Complete Symlink Resolution

```typescript
import { readlink, lstat } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';

interface ResolvedSymlink {
  symlinkPath: string;
  originalTarget: string;
  resolvedTarget: string;
  targetExists: boolean;
  targetIsSymlink: boolean;
}

async function resolveSymlink(
  symlinkPath: string,
  followNested: boolean = true
): Promise<ResolvedSymlink> {
  // Check if path is a symlink
  const stats = await lstat(symlinkPath);
  if (!stats.isSymbolicLink()) {
    throw new Error(`Path is not a symlink: ${symlinkPath}`);
  }

  // Read the target
  const originalTarget = await readlink(symlinkPath);

  // Resolve to absolute path
  const resolvedTarget = isAbsolute(originalTarget)
    ? originalTarget
    : resolve(dirname(symlinkPath), originalTarget);

  // Check if target exists
  let targetExists = false;
  let targetIsSymlink = false;

  try {
    const targetStats = await lstat(resolvedTarget);
    targetExists = true;
    targetIsSymlink = targetStats.isSymbolicLink();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return {
    symlinkPath,
    originalTarget,
    resolvedTarget,
    targetExists,
    targetIsSymlink,
  };
}
```

### Resolving Nested Symlinks

```typescript
import { readlink, lstat } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';

const MAX_SYMLINK_DEPTH = 40; // Prevent infinite loops

async function resolveSymlinksFully(
  startPath: string,
  maxDepth: number = MAX_SYMLINK_DEPTH
): Promise<string> {
  let currentPath = startPath;
  const visited = new Set<string>();

  for (let i = 0; i < maxDepth; i++) {
    try {
      const stats = await lstat(currentPath);

      // Not a symlink, we're done
      if (!stats.isSymbolicLink()) {
        return currentPath;
      }

      // Detect circular symlinks
      if (visited.has(currentPath)) {
        throw new Error(`Circular symlink detected at: ${currentPath}`);
      }
      visited.add(currentPath);

      // Read and resolve target
      const target = await readlink(currentPath);
      currentPath = isAbsolute(target)
        ? target
        : resolve(dirname(currentPath), target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return currentPath; // Return last valid path
      }
      throw error;
    }
  }

  throw new Error(`Max symlink depth (${maxDepth}) exceeded`);
}
```

### Cross-Platform Path Resolution

```typescript
import { readlink } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';

/**
 * Cross-platform symlink target resolution
 * Handles both Unix and Windows path separators
 */
async function resolveSymlinkTargetCrossPlatform(
  symlinkPath: string
): Promise<string> {
  const target = await readlink(symlinkPath);

  // Normalize path separators for current platform
  const normalizedTarget = target.split(/[\\/]/).join(sep);

  // Check if already absolute
  if (isAbsolute(normalizedTarget)) {
    return resolve(normalizedTarget);
  }

  // Resolve relative to symlink's directory
  return resolve(dirname(symlinkPath), normalizedTarget);
}
```

---

## 5. Error Handling: Common Errors and Solutions

### Common Error Codes

| Error Code | Meaning | Typical Cause |
|------------|---------|---------------|
| **ENOENT** | No such file or directory | Path doesn't exist |
| **EACCES** | Permission denied | Insufficient permissions |
| **ELOOP** | Too many symbolic links | Circular symlink references |
| **EINVAL** | Invalid argument | Path is not a symlink (for readlink) |
| **ENOTDIR** | Not a directory | Expected directory but found file |
| **EPERM** | Operation not permitted | Insufficient permissions on Windows |

### Comprehensive Error Handler

```typescript
import { lstat, readlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

interface SymlinkInfo {
  exists: boolean;
  isSymlink: boolean;
  target?: string;
  resolvedTarget?: string;
  broken: boolean;
  error?: string;
}

async function getSymlinkInfo(path: string): Promise<SymlinkInfo> {
  try {
    const stats = await lstat(path);

    if (!stats.isSymbolicLink()) {
      return {
        exists: true,
        isSymlink: false,
        broken: false,
      };
    }

    const target = await readlink(path);
    const resolvedTarget = resolve(dirname(path), target);

    // Check if target exists
    let broken = false;
    try {
      await lstat(resolvedTarget);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        broken = true;
      } else {
        throw error;
      }
    }

    return {
      exists: true,
      isSymlink: true,
      target,
      resolvedTarget,
      broken,
    };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;

    switch (errno.code) {
      case 'ENOENT':
        return {
          exists: false,
          isSymlink: false,
          broken: false,
          error: 'Path does not exist',
        };

      case 'EACCES':
        return {
          exists: true,
          isSymlink: false,
          broken: false,
          error: 'Permission denied',
        };

      case 'ELOOP':
        return {
          exists: true,
          isSymlink: false,
          broken: true,
          error: 'Circular symlink reference',
        };

      case 'EINVAL':
        return {
          exists: true,
          isSymlink: false,
          broken: false,
          error: 'Invalid argument (not a symlink)',
        };

      default:
        return {
          exists: false,
          isSymlink: false,
          broken: false,
          error: errno.message || 'Unknown error',
        };
    }
  }
}
```

### Error Handling Pattern for npm Link Verification

```typescript
import { lstat, readlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

interface NpmLinkVerification {
  isLinked: boolean;
  globalLinkExists: boolean;
  localLinkExists: boolean;
  packagePath: string;
  broken: boolean;
  error?: string;
}

async function verifyNpmLink(
  packageName: string,
  projectPath: string
): Promise<NpmLinkVerification> {
  const localLinkPath = resolve(projectPath, 'node_modules', packageName);

  try {
    // Check local symlink
    const localStats = await lstat(localLinkPath);

    if (!localStats.isSymbolicLink()) {
      return {
        isLinked: false,
        globalLinkExists: false,
        localLinkExists: true,
        packagePath: localLinkPath,
        broken: false,
        error: 'Package exists but is not a symlink (regular install)',
      };
    }

    const target = await readlink(localLinkPath);
    const resolvedTarget = resolve(dirname(localLinkPath), target);

    // Check if target exists
    let broken = false;
    try {
      await lstat(resolvedTarget);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        broken = true;
      } else {
        throw error;
      }
    }

    return {
      isLinked: true,
      globalLinkExists: true, // Assuming if local link exists, global does too
      localLinkExists: true,
      packagePath: resolvedTarget,
      broken,
    };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;

    if (errno.code === 'ENOENT') {
      return {
        isLinked: false,
        globalLinkExists: false,
        localLinkExists: false,
        packagePath: localLinkPath,
        broken: false,
        error: 'Package not linked (node_modules entry missing)',
      };
    }

    if (errno.code === 'EACCES') {
      return {
        isLinked: false,
        globalLinkExists: false,
        localLinkExists: false,
        packagePath: localLinkPath,
        broken: false,
        error: 'Permission denied accessing package',
      };
    }

    return {
      isLinked: false,
      globalLinkExists: false,
      localLinkExists: false,
      packagePath: localLinkPath,
      broken: false,
      error: errno.message,
    };
  }
}
```

### Graceful Error Handling Wrapper

```typescript
import { lstat } from 'node:fs/promises';

type SafeResult<T> = { success: true; data: T } | { success: false; error: string };

async function safeLstat(path: string): Promise<SafeResult<ReturnType<typeof lstat>>> {
  try {
    const stats = await lstat(path);
    return { success: true, data: stats };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    return { success: false, error: `Error accessing ${path}: [${errno.code}] ${errno.message}` };
  }
}

async function safeReadlink(path: string): Promise<SafeResult<string>> {
  try {
    const target = await readlink(path);
    return { success: true, data: target };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    return { success: false, error: `Error reading symlink ${path}: [${errno.code}] ${errno.message}` };
  }
}
```

---

## 6. Cross-Platform Symlink Handling

### Platform Differences

| Aspect | Linux/macOS | Windows |
|--------|-------------|---------|
| **Symlink Type** | Native symlinks | Symlinks (requires admin/dev mode) or Junctions |
| **Permission Requirements** | Standard file permissions | Administrator or Developer Mode |
| **Path Format** | Forward slashes (`/`) | Backslashes (`\`) or forward slashes |
| **Drive Letters** | None | `C:`, `D:`, etc. |
| **Case Sensitivity** | Yes (Linux), No (macOS) | No (case-insensitive, case-preserving) |

### Detecting Platform

```typescript
import { platform } from 'node:process';

function isWindows(): boolean {
  return platform() === 'win32';
}

function isMacOS(): boolean {
  return platform() === 'darwin';
}

function isLinux(): boolean {
  return platform() === 'linux';
}

function getPlatformName(): 'windows' | 'macos' | 'linux' | 'unknown' {
  switch (platform()) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}
```

### Cross-Platform Symlink Verification

```typescript
import { lstat, readlink } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { platform } from 'node:process';

interface CrossPlatformSymlinkInfo {
  exists: boolean;
  isSymlink: boolean;
  isJunction: boolean; // Windows junction point
  target?: string;
  resolvedTarget?: string;
  platform: string;
  error?: string;
}

async function verifySymlinkCrossPlatform(
  path: string
): Promise<CrossPlatformSymlinkInfo> {
  const currentPlatform = platform();

  try {
    const stats = await lstat(path);
    const isSymlink = stats.isSymbolicLink();

    // Windows junction points are reported as symlinks by Node.js
    // but have different characteristics
    const isJunction = currentPlatform === 'win32' && isSymlink;

    let target: string | undefined;
    let resolvedTarget: string | undefined;

    if (isSymlink) {
      target = await readlink(path);
      resolvedTarget = resolve(dirname(path), target);
    }

    return {
      exists: true,
      isSymlink,
      isJunction,
      target,
      resolvedTarget,
      platform: currentPlatform,
    };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;

    return {
      exists: false,
      isSymlink: false,
      isJunction: false,
      platform: currentPlatform,
      error: `[${errno.code}] ${errno.message}`,
    };
  }
}
```

### Windows-Specific Considerations

```typescript
import { platform } from 'node:process';

/**
 * Check if running on Windows with symlink support
 */
function hasWindowsSymlinkSupport(): boolean {
  if (platform() !== 'win32') {
    return false;
  }

  // Windows 10+ with Developer Mode enabled
  // OR running with Administrator privileges
  // This is a heuristic - actual detection would require native modules
  return true;
}

/**
 * Get appropriate error message for Windows symlink issues
 */
function getWindowsSymlinkError(): string {
  return `Cannot create symlink on Windows.

Possible solutions:
1. Run terminal as Administrator
2. Enable Developer Mode:
   - Settings → Update & Security → For developers
   - Enable "Developer Mode"
3. Use junction points instead of symlinks
`;
}
```

### Path Normalization for Cross-Platform

```typescript
import { resolve, normalize, sep, isAbsolute } from 'node:path';

/**
 * Normalize path separators for current platform
 */
function normalizePathSeparators(path: string): string {
  // Convert all separators to current platform's separator
  return path.split(/[\\/]/).join(sep);
}

/**
 * Resolve path with cross-platform support
 */
function resolvePathCrossPlatform(...pathSegments: string[]): string {
  return normalize(resolve(...pathSegments));
}

/**
 * Convert path to absolute with platform handling
 */
function toAbsolutePath(path: string, basePath: string): string {
  if (isAbsolute(path)) {
    return normalizePathSeparators(path);
  }

  return resolvePathCrossPlatform(basePath, path);
}
```

---

## 7. TypeScript Code Examples

### Example 1: Complete Symlink Verifier

```typescript
import { lstat, readlink } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';

export interface SymlinkVerificationResult {
  path: string;
  exists: boolean;
  isSymlink: boolean;
  target?: string;
  resolvedTarget?: string;
  targetExists: boolean;
  broken: boolean;
  circular: boolean;
  error?: string;
}

export class SymlinkVerifier {
  private readonly maxDepth = 40;
  private readonly visited = new Set<string>();

  /**
   * Verify a symlink with comprehensive checking
   */
  async verify(path: string): Promise<SymlinkVerificationResult> {
    this.visited.clear();

    return this.verifyRecursive(path, 0);
  }

  private async verifyRecursive(
    path: string,
    depth: number
  ): Promise<SymlinkVerificationResult> {
    // Check max depth to prevent infinite loops
    if (depth >= this.maxDepth) {
      return {
        path,
        exists: false,
        isSymlink: false,
        targetExists: false,
        broken: true,
        circular: true,
        error: `Maximum symlink depth (${this.maxDepth}) exceeded`,
      };
    }

    try {
      const stats = await lstat(path);

      if (!stats.isSymbolicLink()) {
        return {
          path,
          exists: true,
          isSymlink: false,
          targetExists: true,
          broken: false,
          circular: false,
        };
      }

      // Check for circular references
      if (this.visited.has(path)) {
        return {
          path,
          exists: true,
          isSymlink: true,
          targetExists: false,
          broken: true,
          circular: true,
          error: 'Circular symlink reference detected',
        };
      }

      this.visited.add(path);

      // Read symlink target
      const target = await readlink(path);
      const resolvedTarget = isAbsolute(target)
        ? target
        : resolve(dirname(path), target);

      // Check if target exists
      let targetExists = false;
      try {
        const targetStats = await lstat(resolvedTarget);

        // If target is also a symlink, recurse
        if (targetStats.isSymbolicLink()) {
          return this.verifyRecursive(resolvedTarget, depth + 1);
        }

        targetExists = true;
      } catch (error) {
        const errno = error as NodeJS.ErrnoException;
        if (errno.code !== 'ENOENT') {
          throw error;
        }
      }

      return {
        path,
        exists: true,
        isSymlink: true,
        target,
        resolvedTarget,
        targetExists,
        broken: !targetExists,
        circular: false,
      };
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;

      return {
        path,
        exists: false,
        isSymlink: false,
        targetExists: false,
        broken: false,
        circular: false,
        error: `[${errno.code}] ${errno.message}`,
      };
    }
  }
}

// Usage example
async function example() {
  const verifier = new SymlinkVerifier();

  const result = await verifier.verify('node_modules/groundswell');

  console.log('Verification result:', result);

  if (result.isSymlink) {
    console.log(`Symlink points to: ${result.resolvedTarget}`);
    if (result.broken) {
      console.error('WARNING: Symlink is broken!');
    }
  } else if (result.exists) {
    console.log('Path exists but is not a symlink');
  } else {
    console.error('Path does not exist:', result.error);
  }
}
```

### Example 2: NPM Link Verifier

```typescript
import { lstat, readlink } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';
import { constants } from 'node:fs';

export interface NpmLinkInfo {
  packageName: string;
  projectPath: string;
  isLinked: boolean;
  localLinkPath: string;
  localLinkExists: boolean;
  linkTarget?: string;
  resolvedTarget?: string;
  targetExists: boolean;
  broken: boolean;
  error?: string;
}

export class NpmLinkVerifier {
  /**
   * Verify if an npm package is linked via npm link
   */
  async verifyNpmLink(
    packageName: string,
    projectPath: string
  ): Promise<NpmLinkInfo> {
    const localLinkPath = resolve(projectPath, 'node_modules', packageName);

    try {
      // Check if local link exists
      const stats = await lstat(localLinkPath);

      if (!stats.isSymbolicLink()) {
        return {
          packageName,
          projectPath,
          isLinked: false,
          localLinkPath,
          localLinkExists: true,
          targetExists: false,
          broken: false,
          error: 'Package is installed normally (not linked)',
        };
      }

      // Read symlink target
      const target = await readlink(localLinkPath);
      const resolvedTarget = isAbsolute(target)
        ? target
        : resolve(dirname(localLinkPath), target);

      // Check if target exists
      let targetExists = false;
      try {
        await lstat(resolvedTarget);
        targetExists = true;
      } catch (error) {
        const errno = error as NodeJS.ErrnoException;
        if (errno.code !== 'ENOENT') {
          throw error;
        }
      }

      return {
        packageName,
        projectPath,
        isLinked: true,
        localLinkPath,
        localLinkExists: true,
        linkTarget: target,
        resolvedTarget,
        targetExists,
        broken: !targetExists,
      };
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;

      if (errno.code === 'ENOENT') {
        return {
          packageName,
          projectPath,
          isLinked: false,
          localLinkPath,
          localLinkExists: false,
          targetExists: false,
          broken: false,
          error: 'Package not found in node_modules',
        };
      }

      if (errno.code === 'EACCES') {
        return {
          packageName,
          projectPath,
          isLinked: false,
          localLinkPath,
          localLinkExists: false,
          targetExists: false,
          broken: false,
          error: 'Permission denied accessing package',
        };
      }

      return {
        packageName,
        projectPath,
        isLinked: false,
        localLinkPath,
        localLinkExists: false,
        targetExists: false,
        broken: false,
        error: `[${errno.code}] ${errno.message}`,
      };
    }
  }

  /**
   * Verify multiple packages
   */
  async verifyMultiple(
    packages: string[],
    projectPath: string
  ): Promise<Map<string, NpmLinkInfo>> {
    const results = new Map<string, NpmLinkInfo>();

    await Promise.all(
      packages.map(async packageName => {
        const info = await this.verifyNpmLink(packageName, projectPath);
        results.set(packageName, info);
      })
    );

    return results;
  }
}

// Usage example
async function example() {
  const verifier = new NpmLinkVerifier();

  const result = await verifier.verifyNpmLink('groundswell', process.cwd());

  if (result.isLinked) {
    console.log(`✓ ${result.packageName} is linked`);
    console.log(`  Target: ${result.resolvedTarget}`);

    if (result.broken) {
      console.error(`  ✗ Broken link: target does not exist`);
    }
  } else {
    console.log(`✗ ${result.packageName} is not linked`);
    console.log(`  Reason: ${result.error}`);
  }
}
```

### Example 3: Batch Symlink Scanner

```typescript
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface SymlinkScanResult {
  path: string;
  exists: boolean;
  isSymlink: boolean;
  error?: string;
}

export class SymlinkScanner {
  /**
   * Scan a directory for all symlinks
   */
  async scanDirectory(directory: string): Promise<SymlinkScanResult[]> {
    const results: SymlinkScanResult[] = [];

    try {
      const entries = await readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(directory, entry.name);

        if (entry.isSymbolicLink()) {
          results.push({
            path: fullPath,
            exists: true,
            isSymlink: true,
          });
        } else if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subResults = await this.scanDirectory(fullPath);
          results.push(...subResults);
        }
      }
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      results.push({
        path: directory,
        exists: false,
        isSymlink: false,
        error: `[${errno.code}] ${errno.message}`,
      });
    }

    return results;
  }

  /**
   * Scan node_modules for linked packages
   */
  async scanNodeModules(projectPath: string): Promise<Map<string, SymlinkScanResult>> {
    const nodeModulesPath = join(projectPath, 'node_modules');
    const results = new Map<string, SymlinkScanResult>();

    try {
      const entries = await readdir(nodeModulesPath, { withFileTypes: true });

      // Filter out .bin, .cache, etc.
      const packageEntries = entries.filter(
        e => !e.name.startsWith('.') && !e.name.startsWith('@')
      );

      for (const entry of packageEntries) {
        const fullPath = join(nodeModulesPath, entry.name);

        try {
          const stats = await lstat(fullPath);

          results.set(entry.name, {
            path: fullPath,
            exists: true,
            isSymlink: stats.isSymbolicLink(),
          });
        } catch (error) {
          const errno = error as NodeJS.ErrnoException;
          results.set(entry.name, {
            path: fullPath,
            exists: false,
            isSymlink: false,
            error: `[${errno.code}] ${errno.message}`,
          });
        }
      }
    } catch (error) {
      // node_modules doesn't exist
    }

    return results;
  }
}
```

### Example 4: Symlink Creation Helper

```typescript
import { symlink, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { constants } from 'node:fs';

export interface SymlinkCreateOptions {
  force?: boolean;
  type?: 'file' | 'dir' | 'junction';
}

export class SymlinkCreator {
  /**
   * Create a symlink with error handling
   */
  async create(
    target: string,
    linkPath: string,
    options: SymlinkCreateOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    const { force = false, type = 'file' } = options;

    try {
      await symlink(target, linkPath, type);
      return { success: true };
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;

      if (errno.code === 'EEXIST' && force) {
        // Remove existing link and retry
        try {
          const { unlink } = await import('node:fs/promises');
          await unlink(linkPath);
          await symlink(target, linkPath, type);
          return { success: true };
        } catch (retryError) {
          return {
            success: false,
            error: `Failed to replace symlink: ${(retryError as Error).message}`,
          };
        }
      }

      return {
        success: false,
        error: `[${errno.code}] ${errno.message}`,
      };
    }
  }

  /**
   * Verify symlink integrity
   */
  async verifyIntegrity(linkPath: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const { lstat, readlink } = await import('node:fs/promises');
      const stats = await lstat(linkPath);

      if (!stats.isSymbolicLink()) {
        return { valid: false, error: 'Path is not a symlink' };
      }

      const target = await readlink(linkPath);

      // Check if target exists
      try {
        await lstat(target);
      } catch (error) {
        const errno = error as NodeJS.ErrnoException;
        if (errno.code === 'ENOENT') {
          return { valid: false, error: 'Symlink target does not exist' };
        }
        throw error;
      }

      return { valid: true };
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      return {
        valid: false,
        error: `[${errno.code}] ${errno.message}`,
      };
    }
  }
}
```

---

## 8. Common Gotchas and Pitfalls

### Gotcha 1: Using stat() Instead of lstat()

**Problem:** Using `fs.stat()` to detect symlinks always returns `false` for `isSymbolicLink()`.

```typescript
// WRONG - This will never detect symlinks!
const stats = await stat('/some/path');
if (stats.isSymbolicLink()) {
  // This block never executes!
}

// CORRECT - Use lstat() for symlink detection
const stats = await lstat('/some/path');
if (stats.isSymbolicLink()) {
  // This works!
}
```

### Gotcha 2: Not Resolving Relative Symlink Targets

**Problem:** Assuming symlink targets are always absolute paths.

```typescript
// WRONG - Target might be relative
const target = await readlink('node_modules/pkg');
console.log('Target:', target); // Could be "../../other-package"

// CORRECT - Resolve to absolute path
const target = await readlink('node_modules/pkg');
const resolved = resolve(dirname('node_modules/pkg'), target);
console.log('Resolved:', resolved);
```

### Gotcha 3: Circular Symlink Detection

**Problem:** Infinite loops when following nested symlinks.

```typescript
// WRONG - Can cause infinite loop
async function getTarget(path: string): Promise<string> {
  const stats = await lstat(path);
  if (stats.isSymbolicLink()) {
    const target = await readlink(path);
    return getTarget(target); // Recursion without depth limit!
  }
  return path;
}

// CORRECT - Track visited paths
async function getTarget(
  path: string,
  visited = new Set<string>()
): Promise<string> {
  if (visited.has(path)) {
    throw new Error('Circular symlink detected');
  }

  visited.add(path);

  const stats = await lstat(path);
  if (stats.isSymbolicLink()) {
    const target = await readlink(path);
    const resolved = resolve(dirname(path), target);
    return getTarget(resolved, visited);
  }
  return path;
}
```

### Gotcha 4: Broken Symlink Detection

**Problem:** Not distinguishing between "symlink doesn't exist" and "symlink target doesn't exist".

```typescript
// WRONG - Can't detect broken symlinks
try {
  const stats = await stat(symlinkPath); // Follows symlinks
  console.log('File exists');
} catch (error) {
  console.log('File or symlink missing');
}

// CORRECT - Use lstat() to check symlink itself
try {
  const stats = await lstat(symlinkPath); // Doesn't follow symlinks
  if (stats.isSymbolicLink()) {
    // It's a symlink, check if target exists
    try {
      await stat(symlinkPath);
      console.log('Valid symlink');
    } catch (targetError) {
      console.log('Broken symlink (target missing)');
    }
  }
} catch (error) {
  console.log('Symlink missing');
}
```

### Gotcha 5: Forgetting About Windows Junction Points

**Problem:** Windows junction points behave differently from symlinks.

```typescript
// Cross-platform check
const stats = await lstat(path);
if (stats.isSymbolicLink()) {
  // On Windows, this could be a junction point
  // Junction points are reported as symlinks by Node.js
  // but have different permissions and behavior
}
```

### Gotcha 6: Path Case Sensitivity

**Problem:** Case sensitivity varies by platform.

```typescript
// On Linux: these are different paths
// On macOS/Windows: these might be the same path
const path1 = '/path/to/Package';
const path2 = '/path/to/package';

// For robustness, normalize case on macOS/Windows
import { normalize } from 'node:path';
const normalized1 = normalize(path1).toLowerCase();
const normalized2 = normalize(path2).toLowerCase();
```

### Gotcha 7: EACCES Error Handling

**Problem:** Permission errors can occur at various stages.

```typescript
// CORRECT - Handle permissions at each step
async function safeSymlinkRead(path: string) {
  try {
    const stats = await lstat(path);

    if (!stats.isSymbolicLink()) {
      return { error: 'Not a symlink' };
    }

    try {
      const target = await readlink(path);
      return { target };
    } catch (readError) {
      const errno = readError as NodeJS.ErrnoException;
      if (errno.code === 'EACCES') {
        return { error: 'Permission denied reading symlink' };
      }
      throw readError;
    }
  } catch (statError) {
    const errno = statError as NodeJS.ErrnoException;
    if (errno.code === 'EACCES') {
      return { error: 'Permission denied accessing path' };
    }
    if (errno.code === 'ENOENT') {
      return { error: 'Path does not exist' };
    }
    throw statError;
  }
}
```

### Gotcha 8: Forgetting to Check isSymbolicLink() Before readlink()

**Problem:** Calling `readlink()` on non-symlinks throws `EINVAL`.

```typescript
// WRONG - Will throw if path is not a symlink
const target = await readlink(path);

// CORRECT - Check first
const stats = await lstat(path);
if (stats.isSymbolicLink()) {
  const target = await readlink(path);
} else {
  console.log('Not a symlink');
}
```

### Gotcha 9: Not Handling ENOENT in readlink()

**Problem:** Race conditions between `lstat()` and `readlink()`.

```typescript
// BETTER - Handle errors gracefully
async function getSymlinkTarget(path: string): Promise<string | null> {
  try {
    const stats = await lstat(path);
    if (!stats.isSymbolicLink()) {
      return null;
    }

    try {
      return await readlink(path);
    } catch (readError) {
      const errno = readError as NodeJS.ErrnoException;
      if (errno.code === 'ENOENT') {
        // Symlink was deleted between lstat and readlink
        return null;
      }
      throw readError;
    }
  } catch (statError) {
    const errno = statError as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      return null;
    }
    throw statError;
  }
}
```

### Gotcha 10: Assuming Symlink Targets are Files

**Problem:** Symlinks can point to directories too.

```typescript
// CORRECT - Check both file and directory targets
const stats = await lstat(symlinkPath);
if (stats.isSymbolicLink()) {
  const target = await readlink(symlinkPath);

  // Use stat() to check target type
  const targetStats = await stat(symlinkPath); // Follows symlink

  console.log('Target is file:', targetStats.isFile());
  console.log('Target is directory:', targetStats.isDirectory());
}
```

---

## 9. References

### Official Node.js Documentation

1. **File System Module (fs)**
   - URL: https://nodejs.org/api/fs.html
   - Coverage: Complete fs module documentation including stat, lstat, readlink

2. **fs.stat(path, callback)**
   - URL: https://nodejs.org/api/fs.html#fs_stat_path_callback
   - Coverage: stat() method that follows symlinks

3. **fs.lstat(path, callback)**
   - URL: https://nodejs.org/api/fs.html#fs_lstat_path_callback
   - Coverage: lstat() method that doesn't follow symlinks

4. **fs.Stats Class**
   - URL: https://nodejs.org/api/fs.html#fs_class_fs_stats
   - Coverage: Stats object with isSymbolicLink(), isFile(), isDirectory() methods

5. **fs.readlink(path, callback)**
   - URL: https://nodejs.org/api/fs.html#fs_readlink_path_options_callback
   - Coverage: readlink() method for reading symlink targets

6. **fs.promises API**
   - URL: https://nodejs.org/api/fs.html#fs_fs_promises_api
   - Coverage: Promise-based versions of all fs methods

7. **Path Module**
   - URL: https://nodejs.org/api/path.html
   - Coverage: Path manipulation, resolve(), dirname(), isAbsolute()

8. **Common System Errors**
   - URL: https://nodejs.org/api/errors.html#common_system_errors
   - Coverage: ENOENT, EACCES, ELOOP, EINVAL, and other error codes

9. **File System Constants**
   - URL: https://nodejs.org/api/fs.html#fs_fs_constants
   - Coverage: File system constants like S_IFLNK for symlink checking

10. **Process Module**
    - URL: https://nodejs.org/api/process.html
    - Coverage: platform detection, process.platform, process.arch

### Node.js CLI Flags

11. **--preserve-symlinks Flag**
    - URL: https://nodejs.org/api/cli.html#--preserve-symlinks
    - Coverage: Node.js CLI flag for preserving symlink resolution

12. **--preserve-symlinks-main Flag**
    - URL: https://nodejs.org/api/cli.html#--preserve-symlinks-main
    - Coverage: Preserves symlinks for the main module

### Community Resources

13. **Node.js Best Practices**
    - URL: https://github.com/goldbergyoni/nodebestpractices
    - Coverage: File system handling, error management, and TypeScript patterns

14. **TypeScript Documentation**
    - URL: https://www.typescriptlang.org/docs/handbook/modules.html
    - Coverage: Node.js module resolution with TypeScript

### Additional Resources

15. **npm-link Troubleshooting**
    - URL: https://docs.npmjs.com/cli/v10/commands/npm-link
    - Coverage: npm link command documentation and troubleshooting

---

## Quick Reference

### Detecting Symlinks

```typescript
import { lstat } from 'node:fs/promises';

const stats = await lstat('/path/to/check');
if (stats.isSymbolicLink()) {
  console.log('It's a symlink!');
}
```

### Reading Symlink Targets

```typescript
import { readlink } from 'node:fs/promises';

const target = await readlink('/path/to/symlink');
console.log('Points to:', target);
```

### Resolving Relative Symlinks

```typescript
import { readlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const target = await readlink('/path/to/symlink');
const absolute = resolve(dirname('/path/to/symlink'), target);
```

### Checking for Broken Symlinks

```typescript
import { lstat, stat } from 'node:fs/promises';

const linkStats = await lstat('/path/to/symlink');
if (linkStats.isSymbolicLink()) {
  try {
    await stat('/path/to/symlink');
    console.log('Valid symlink');
  } catch (error) {
    console.log('Broken symlink');
  }
}
```

### Error Handling Pattern

```typescript
import { lstat } from 'node:fs/promises';

try {
  const stats = await lstat(path);
} catch (error) {
  const errno = error as NodeJS.ErrnoException;
  switch (errno.code) {
    case 'ENOENT':
      console.log('Path does not exist');
      break;
    case 'EACCES':
      console.log('Permission denied');
      break;
    case 'ELOOP':
      console.log('Circular symlink');
      break;
    default:
      console.log('Unknown error:', errno.message);
  }
}
```

---

**End of Research Document**
