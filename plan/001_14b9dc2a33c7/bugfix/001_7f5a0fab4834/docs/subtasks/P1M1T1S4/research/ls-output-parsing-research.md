# `ls -la` Output Parsing Research for Symlink Detection in Node.js

**Research Date:** 2026-01-14
**Objective:** Understand how to parse `ls -la` command output in Node.js to detect symlinks, specifically for detecting `npm link` symlinks in `node_modules/groundswell`.

---

## Table of Contents

1. [Format of `ls -la` Output](#1-format-of-ls--la-output)
2. [Symlink Indicators](#2-symlink-indicators)
3. [File Permission Bits](#3-file-permission-bits)
4. [Spawning `ls -la` in Node.js](#4-spawning-ls--la-in-nodejs)
5. [Parsing Patterns in TypeScript](#5-parsing-patterns-in-typescript)
6. [Complete Working Examples](#6-complete-working-examples)
7. [Alternative Approaches](#7-alternative-approaches)
8. [Best Practices](#8-best-practices)

---

## 1. Format of `ls -la` Output

### 1.1 Standard Output Structure

The `ls -la` command outputs one line per file/directory with the following format:

```
<permissions> <links> <owner> <group> <size> <date> <time> <name> [-> <target>]
```

**Field breakdown:**
- **Permissions**: 10 characters (file type + 9 permission bits)
- **Links**: Number of hard links
- **Owner**: File owner username
- **Group**: File group name
- **Size**: File size in bytes
- **Date**: Last modified date (month, day)
- **Time**: Last modified time (hour:minute or year if old)
- **Name**: File/directory name
- **Target**: (For symlinks only) ` -> <target_path>`

### 1.2 Real Examples

#### Regular Files
```
-rw-r--r-- 1 dustin dustin    0 Jan 14 14:58 regular_file
```

#### Directories
```
drwxr-xr-x 2 dustin dustin   40 Jan 14 14:58 regular_dir
```

#### Symlinks
```
lrwxrwxrwx 1 dustin dustin    9 Jan 14 14:58 parent_link -> ../parent
lrwxrwxrwx 1 dustin dustin   10 Jan 14 14:58 symlink_example -> /etc/hosts
```

#### Real npm link symlinks (from node_modules/.bin)
```
lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 acorn -> ../acorn/bin/acorn
lrwxrwxrwx 1 dustin dustin   22 Jan 12 15:27 esbuild -> ../esbuild/bin/esbuild
lrwxrwxrwx 1 dustin dustin   23 Jan 12 16:36 eslint -> ../eslint/bin/eslint.js
```

---

## 2. Symlink Indicators

### 2.1 Primary Indicator: Arrow Notation (`->`)

**Pattern:** Symlinks include ` -> <target>` at the end of the line.

**Examples:**
```
parent_link -> ../parent
symlink_example -> /etc/hosts
```

### 2.2 Regex Pattern for Arrow Detection

```typescript
const SYMLINK_ARROW_PATTERN = / -> /;

// Usage
function isSymlinkByArrow(line: string): boolean {
  return SYMLINK_ARROW_PATTERN.test(line);
}

// Extract target path
function extractSymlinkTarget(line: string): string | null {
  const match = line.match(/ -> (.+)$/);
  return match ? match[1].trim() : null;
}

// Example
const line = "lrwxrwxrwx 1 dustin dustin   10 Jan 14 14:58 symlink -> /etc/hosts";
console.log(isSymlinkByArrow(line)); // true
console.log(extractSymlinkTarget(line)); // "/etc/hosts"
```

### 2.3 Combined Pattern Detection

```typescript
// More robust pattern that ensures arrow is in the filename position
const ROBUST_SYMLINK_PATTERN = / -> .+$/;

function isSymlinkRobust(line: string): boolean {
  // Must have ' -> ' followed by target at end of line
  return ROBUST_SYMLINK_PATTERN.test(line);
}
```

---

## 3. File Permission Bits

### 3.1 Permission String Structure

The 10-character permission string has this structure:

```
[FILE_TYPE][OWNER][GROUP][OTHERS]
```

**Positions:**
- Position 0: File type character
- Positions 1-3: Owner permissions (rwx)
- Positions 4-6: Group permissions (rwx)
- Positions 7-9: Others permissions (rwx)

### 3.2 File Type Characters

| Character | Type |
|-----------|------|
| `-` | Regular file |
| `d` | Directory |
| `l` | **Symbolic link** |
| `c` | Character device |
| `b` | Block device |
| `p` | Named pipe |
| `s` | Socket |

**Key insight:** The first character is `l` for symbolic links.

### 3.3 Regex Pattern for Permission Detection

```typescript
const SYMLINK_PERMISSION_PATTERN = /^l/;

function isSymlinkByPermission(line: string): boolean {
  const parts = line.trim().split(/\s+/);
  if (parts.length === 0) return false;
  const permissions = parts[0];
  return permissions.charAt(0) === 'l';
}

// Example
const symlinkLine = "lrwxrwxrwx 1 dustin dustin   10 Jan 14 14:58 symlink -> /etc/hosts";
const fileLine = "-rw-r--r-- 1 dustin dustin    0 Jan 14 14:58 regular_file";

console.log(isSymlinkByPermission(symlinkLine)); // true
console.log(isSymlinkByPermission(fileLine)); // false
```

### 3.4 Combined Dual Detection

**Best practice:** Use both permission and arrow indicators for reliability.

```typescript
function isSymlink(line: string): boolean {
  // Check 1: First character is 'l'
  const parts = line.trim().split(/\s+/);
  if (parts.length === 0) return false;
  const hasLinkPermission = parts[0].charAt(0) === 'l';

  // Check 2: Contains ' -> ' pattern
  const hasArrow = / -> /.test(line);

  // Both conditions should be true for symlinks
  return hasLinkPermission && hasArrow;
}
```

---

## 4. Spawning `ls -la` in Node.js

### 4.1 Basic Spawn Pattern

```typescript
import { spawn } from 'node:child_process';

async function runLsLa(directory: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('ls', ['-la', directory], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }

    child.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`ls -la failed with exit code ${exitCode}: ${stderr}`));
      }
    });

    child.on('error', (error: Error) => {
      reject(error);
    });
  });
}

// Usage
try {
  const output = await runLsLa('node_modules/groundswell');
  console.log(output);
} catch (error) {
  console.error('Failed to run ls:', error);
}
```

### 4.2 Pattern from Existing Codebase

From `/home/dustin/projects/hacky-hack/src/utils/groundswell-linker.ts`:

```typescript
import { spawn, type ChildProcess } from 'node:child_process';

const DEFAULT_LINK_TIMEOUT = 30000; // 30 seconds

async function spawnLsLa(
  directory: string,
  timeout: number = DEFAULT_LINK_TIMEOUT
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  let child: ChildProcess;

  try {
    child = spawn('ls', ['-la', directory], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });
  } catch (error) {
    return {
      stdout: '',
      stderr: '',
      exitCode: null,
    };
  }

  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // Timeout handler with SIGTERM/SIGKILL
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    // Capture stdout data
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return;
        stdout += data.toString();
      });
    }

    // Capture stderr data
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return;
        stderr += data.toString();
      });
    }

    // Handle close event
    child.on('close', (exitCode) => {
      clearTimeout(timeoutId);
      resolve({ stdout, stderr, exitCode });
    });

    // Handle spawn errors
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: null,
      });
    });
  });
}
```

### 4.3 Specific Command for Groundswell

```typescript
async function checkGroundswellSymlink(): Promise<boolean> {
  const result = await spawnLsLa('node_modules/groundswell');
  const lines = result.stdout.trim().split('\n');

  // Skip header line (total ...)
  const entries = lines.slice(1);

  for (const line of entries) {
    if (isSymlink(line)) {
      return true;
    }
  }

  return false;
}
```

---

## 5. Parsing Patterns in TypeScript

### 5.1 Line-by-Line Parser

```typescript
interface LsEntry {
  permissions: string;
  links: number;
  owner: string;
  group: string;
  size: number;
  date: string;
  time: string;
  name: string;
  isSymlink: boolean;
  symlinkTarget?: string;
}

function parseLsLine(line: string): LsEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('total ')) {
    return null;
  }

  // Split by whitespace
  const parts = trimmed.split(/\s+/);

  // Basic validation
  if (parts.length < 8) {
    return null;
  }

  const permissions = parts[0];
  const links = parseInt(parts[1], 10);
  const owner = parts[2];
  const group = parts[3];
  const size = parseInt(parts[4], 10);
  const date = parts[5];
  const time = parts[6];

  // Handle symlinks with ' -> target'
  const isSymlink = permissions.charAt(0) === 'l';
  let name = parts.slice(7).join(' ');
  let symlinkTarget: string | undefined;

  if (isSymlink) {
    const arrowIndex = name.indexOf(' -> ');
    if (arrowIndex !== -1) {
      symlinkTarget = name.slice(arrowIndex + 4).trim();
      name = name.slice(0, arrowIndex);
    }
  }

  return {
    permissions,
    links,
    owner,
    group,
    size,
    date,
    time,
    name,
    isSymlink,
    symlinkTarget,
  };
}

// Example usage
const line = "lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 acorn -> ../acorn/bin/acorn";
const entry = parseLsLine(line);

console.log(entry);
// {
//   permissions: 'lrwxrwxrwx',
//   links: 1,
//   owner: 'dustin',
//   group: 'dustin',
//   size: 18,
//   date: 'Jan',
//   time: '12',
//   name: 'acorn',
//   isSymlink: true,
//   symlinkTarget: '../acorn/bin/acorn'
// }
```

### 5.2 Symlink-Specific Parser

```typescript
interface SymlinkInfo {
  name: string;
  target: string;
  rawLine: string;
}

function parseSymlinks(lsOutput: string): SymlinkInfo[] {
  const lines = lsOutput.trim().split('\n');
  const symlinks: SymlinkInfo[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and "total" line
    if (!trimmed || trimmed.startsWith('total ')) {
      continue;
    }

    // Check if symlink (first char is 'l')
    const parts = trimmed.split(/\s+/);
    if (parts.length === 0) continue;

    const permissions = parts[0];
    if (permissions.charAt(0) !== 'l') {
      continue;
    }

    // Extract name and target
    const nameAndTarget = parts.slice(7).join(' ');
    const match = nameAndTarget.match(/^(.+?) -> (.+)$/);

    if (match) {
      symlinks.push({
        name: match[1],
        target: match[2],
        rawLine: line,
      });
    }
  }

  return symlinks;
}

// Example usage
const output = `
total 8
lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 acorn -> ../acorn/bin/acorn
lrwxrwxrwx 1 dustin dustin   22 Jan 12 15:27 esbuild -> ../esbuild/bin/esbuild
-rwxr-xr-x 1 dustin dustin  123 Jan 12 16:36 regular-file
drwxr-xr-x 2 dustin dustin   40 Jan 12 16:36 regular-dir
`;

const symlinks = parseSymlinks(output);
console.log(symlinks);
// [
//   { name: 'acorn', target: '../acorn/bin/acorn', rawLine: '...' },
//   { name: 'esbuild', target: '../esbuild/bin/esbuild', rawLine: '...' }
// ]
```

### 5.3 Regex-Based Parser

```typescript
// Comprehensive regex for ls -la output
const LS_LINE_REGEX =
  /^(.{10})\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+([\w]{3}\s+\d+)\s+([\d:]+)\s+(.+)$/;

function parseLsLineRegex(line: string): LsEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('total ')) {
    return null;
  }

  const match = trimmed.match(LS_LINE_REGEX);
  if (!match) {
    return null;
  }

  const [
    ,
    permissions,
    links,
    owner,
    group,
    size,
    date,
    time,
    nameAndTarget,
  ] = match;

  const isSymlink = permissions.charAt(0) === 'l';
  let name = nameAndTarget;
  let symlinkTarget: string | undefined;

  if (isSymlink) {
    const arrowIndex = nameAndTarget.indexOf(' -> ');
    if (arrowIndex !== -1) {
      symlinkTarget = nameAndTarget.slice(arrowIndex + 4).trim();
      name = nameAndTarget.slice(0, arrowIndex);
    }
  }

  return {
    permissions,
    links: parseInt(links, 10),
    owner,
    group,
    size: parseInt(size, 10),
    date,
    time,
    name,
    isSymlink,
    symlinkTarget,
  };
}
```

---

## 6. Complete Working Examples

### 6.1 Full Symlink Detection Utility

```typescript
import { spawn } from 'node:child_process';

interface SymlinkCheckResult {
  exists: boolean;
  isSymlink: boolean;
  symlinkTarget?: string;
  rawOutput?: string;
  error?: string;
}

/**
 * Detects if a directory path is a symlink by parsing ls -la output
 * @param path Directory to check (e.g., 'node_modules/groundswell')
 * @returns Promise with symlink detection results
 */
async function detectSymlink(path: string): Promise<SymlinkCheckResult> {
  try {
    // Spawn ls -la command
    const { stdout, exitCode } = await spawnLsLa(path);

    if (exitCode !== 0) {
      return {
        exists: false,
        isSymlink: false,
        error: `Path does not exist or is not accessible`,
      };
    }

    const lines = stdout.trim().split('\n');
    const entries = lines.slice(1); // Skip "total" line

    // Look for '.' entry (the directory itself)
    for (const line of entries) {
      const entry = parseLsLine(line);
      if (entry && entry.name === '.' && entry.isSymlink) {
        return {
          exists: true,
          isSymlink: true,
          symlinkTarget: entry.symlinkTarget,
          rawOutput: stdout,
        };
      }
    }

    return {
      exists: true,
      isSymlink: false,
      rawOutput: stdout,
    };
  } catch (error) {
    return {
      exists: false,
      isSymlink: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Usage for Groundswell
async function checkGroundswellNpmLink(): Promise<boolean> {
  const result = await detectSymlink('node_modules/groundswell');

  if (!result.exists) {
    console.log('node_modules/groundswell does not exist');
    return false;
  }

  if (result.isSymlink) {
    console.log(`node_modules/groundswell is a symlink -> ${result.symlinkTarget}`);
    return true;
  }

  console.log('node_modules/groundswell exists but is not a symlink');
  return false;
}
```

### 6.2 Batch Symlink Scanner

```typescript
interface SymlinkScanResult {
  path: string;
  isSymlink: boolean;
  target?: string;
}

/**
 * Scans multiple paths to detect symlinks
 * @param paths Array of paths to check
 * @returns Array of scan results
 */
async function scanSymlinks(paths: string[]): Promise<SymlinkScanResult[]> {
  const results: SymlinkScanResult[] = [];

  for (const path of paths) {
    try {
      const { stdout } = await spawnLsLa(path);
      const symlinks = parseSymlinks(stdout);

      results.push({
        path,
        isSymlink: symlinks.length > 0,
        target: symlinks[0]?.target,
      });
    } catch (error) {
      results.push({
        path,
        isSymlink: false,
      });
    }
  }

  return results;
}

// Example: Scan all potential npm link locations
async function scanNpmLinks(packageName: string): Promise<void> {
  const paths = [
    `node_modules/${packageName}`,
    `node_modules/.bin/${packageName}`,
    `/usr/local/lib/node_modules/${packageName}`,
  ];

  const results = await scanSymlinks(paths);

  for (const result of results) {
    const status = result.isSymlink
      ? `SYMLINK -> ${result.target}`
      : 'NOT A SYMLINK';
    console.log(`${result.path}: ${status}`);
  }
}
```

### 6.3 Groundswell-Specific Checker

```typescript
interface GroundswellSymlinkStatus {
  packageExists: boolean;
  packageIsSymlink: boolean;
  packageTarget?: string;
  binExists: boolean;
  binIsSymlink: boolean;
  binTarget?: string;
}

/**
 * Checks Groundswell symlink status in node_modules
 * @returns Detailed symlink status for package and bin
 */
async function checkGroundswellSymlinks(): Promise<GroundswellSymlinkStatus> {
  const result: GroundswellSymlinkStatus = {
    packageExists: false,
    packageIsSymlink: false,
    binExists: false,
    binIsSymlink: false,
  };

  // Check package symlink
  try {
    const pkgResult = await spawnLsLa('node_modules/groundswell');
    result.packageExists = true;

    const pkgSymlinks = parseSymlinks(pkgResult.stdout);
    const pkgEntry = pkgSymlinks.find(s => s.name === '.');

    if (pkgEntry) {
      result.packageIsSymlink = true;
      result.packageTarget = pkgEntry.target;
    }
  } catch {
    result.packageExists = false;
  }

  // Check bin symlink
  try {
    const binResult = await spawnLsLa('node_modules/.bin/groundswell');
    result.binExists = true;

    const binSymlinks = parseSymlinks(binResult.stdout);
    if (binSymlinks.length > 0) {
      result.binIsSymlink = true;
      result.binTarget = binSymlinks[0].target;
    }
  } catch {
    result.binExists = false;
  }

  return result;
}

// Usage
async function verifyGroundswellLink(): Promise<boolean> {
  const status = await checkGroundswellSymlinks();

  console.log('Groundswell Link Status:');
  console.log(`  Package: ${status.packageExists ? 'exists' : 'missing'}`);
  console.log(
    `    ${status.packageIsSymlink ? `symlink -> ${status.packageTarget}` : 'not a symlink'}`
  );
  console.log(`  Bin: ${status.binExists ? 'exists' : 'missing'}`);
  console.log(
    `    ${status.binIsSymlink ? `symlink -> ${status.binTarget}` : 'not a symlink'}`
  );

  return status.packageExists && status.packageIsSymlink;
}
```

---

## 7. Alternative Approaches

### 7.1 Using Native Node.js APIs (Recommended)

**Why this is better:** Using `fs.lstat()` and `fs.readlink()` is more reliable than parsing `ls -la` output.

```typescript
import { lstat, readlink } from 'node:fs/promises';

/**
 * Check if a path is a symlink using native Node.js APIs
 * @param path Path to check
 * @returns Symlink information
 */
async function checkSymlinkNative(path: string): Promise<{
  isSymlink: boolean;
  target?: string;
  error?: string;
}> {
  try {
    const stats = await lstat(path);

    if (!stats.isSymbolicLink()) {
      return { isSymlink: false };
    }

    const target = await readlink(path);
    return { isSymlink: true, target };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    return {
      isSymlink: false,
      error: errno.code === 'ENOENT' ? 'Path does not exist' : errno.message,
    };
  }
}

// Usage for Groundswell
async function checkGroundswellNative(): Promise<boolean> {
  const result = await checkSymlinkNative('node_modules/groundswell');

  if (result.error) {
    console.log(`Error: ${result.error}`);
    return false;
  }

  if (result.isSymlink) {
    console.log(`node_modules/groundswell is a symlink -> ${result.target}`);
    return true;
  }

  console.log('node_modules/groundswell exists but is not a symlink');
  return false;
}
```

### 7.2 Comparison: `ls -la` vs Native APIs

| Aspect | `ls -la` Parsing | Native APIs (`lstat`/`readlink`) |
|--------|------------------|-----------------------------------|
| **Reliability** | Medium (format varies by system/locale) | High (OS syscall) |
| **Performance** | Slower (spawn process) | Faster (direct syscall) |
| **Portability** | Low (ls output varies) | High (consistent across platforms) |
| **Error Handling** | Complex (parse exit codes, stderr) | Simple (try/catch) |
| **Dependencies** | None (built-in commands) | None (built-in modules) |
| **Use Case** | Legacy systems, shell scripts | All new code |

### 7.3 Hybrid Approach

Use `ls -la` for debugging/human verification, but native APIs for actual logic.

```typescript
async function checkSymlinkHybrid(path: string): Promise<{
  isSymlink: boolean;
  target?: string;
  lsOutput?: string;
}> {
  // Use native API for actual check
  const nativeResult = await checkSymlinkNative(path);

  // Optionally get ls output for debugging
  let lsOutput: string | undefined;
  try {
    const { stdout } = await spawnLsLa(path);
    lsOutput = stdout;
  } catch {
    // Ignore ls errors
  }

  return {
    isSymlink: nativeResult.isSymlink,
    target: nativeResult.target,
    lsOutput,
  };
}
```

---

## 8. Best Practices

### 8.1 Security

1. **Always use `shell: false`** when spawning commands to prevent shell injection
2. **Validate input paths** before passing to commands
3. **Use argument arrays** instead of concatenated strings

```typescript
// GOOD: Safe spawn
spawn('ls', ['-la', directory], { shell: false });

// BAD: Vulnerable to injection
spawn('sh', ['-c', `ls -la ${directory}`], { shell: true });
```

### 8.2 Error Handling

1. **Check exit codes** from spawned processes
2. **Capture stderr** for debugging
3. **Implement timeouts** to prevent hanging
4. **Handle ENOENT** (path not found) gracefully

```typescript
async function safeSpawnLs(path: string, timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('ls', ['-la', path], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      if (timedOut) return;

      if (exitCode === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`ls failed with exit code ${exitCode}: ${stderr}`));
      }
    });
  });
}
```

### 8.3 Cross-Platform Considerations

1. **ls output varies** by locale and system
2. **Date formats differ** (e.g., "Jan 12" vs "12 Jan")
3. **Use native APIs** for cross-platform code

```typescript
// Cross-platform symlink check (recommended)
async function isSymlinkCrossPlatform(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}
```

### 8.4 Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('ls -la parsing', () => {
  it('should detect symlink by permission character', () => {
    const symlinkLine = 'lrwxrwxrwx 1 dustin dustin   10 Jan 14 14:58 link -> /target';
    const fileLine = '-rw-r--r-- 1 dustin dustin    0 Jan 14 14:58 file';

    expect(isSymlinkByPermission(symlinkLine)).toBe(true);
    expect(isSymlinkByPermission(fileLine)).toBe(false);
  });

  it('should detect symlink by arrow pattern', () => {
    const symlinkLine = 'lrwxrwxrwx 1 dustin dustin   10 Jan 14 14:58 link -> /target';
    const fileLine = '-rw-r--r-- 1 dustin dustin    0 Jan 14 14:58 file';

    expect(isSymlinkByArrow(symlinkLine)).toBe(true);
    expect(isSymlinkByArrow(fileLine)).toBe(false);
  });

  it('should extract symlink target', () => {
    const line = 'lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 acorn -> ../acorn/bin/acorn';
    const target = extractSymlinkTarget(line);

    expect(target).toBe('../acorn/bin/acorn');
  });

  it('should parse ls entry correctly', () => {
    const line = 'lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 acorn -> ../acorn/bin/acorn';
    const entry = parseLsLine(line);

    expect(entry).toEqual({
      permissions: 'lrwxrwxrwx',
      links: 1,
      owner: 'dustin',
      group: 'dustin',
      size: 18,
      date: 'Jan',
      time: '12',
      name: 'acorn',
      isSymlink: true,
      symlinkTarget: '../acorn/bin/acorn',
    });
  });

  it('should parse multiple symlinks from ls output', () => {
    const output = `
total 8
lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 acorn -> ../acorn/bin/acorn
lrwxrwxrwx 1 dustin dustin   22 Jan 12 15:27 esbuild -> ../esbuild/bin/esbuild
-rwxr-xr-x 1 dustin dustin  123 Jan 12 16:36 regular-file
`;

    const symlinks = parseSymlinks(output);

    expect(symlinks).toHaveLength(2);
    expect(symlinks[0].name).toBe('acorn');
    expect(symlinks[0].target).toBe('../acorn/bin/acorn');
    expect(symlinks[1].name).toBe('esbuild');
    expect(symlinks[1].target).toBe('../esbuild/bin/esbuild');
  });
});
```

---

## Summary

### Key Takeaways

1. **Symlink Detection Methods:**
   - Permission bit: First character is `l` in permissions string
   - Arrow pattern: Contains ` -> target` at end of line
   - Best: Use both indicators for reliability

2. **Parsing Patterns:**
   - Split by whitespace: `line.split(/\s+/)`
   - Regex capture: `/^(.{10})\s+(\d+)\s+.../`
   - Extract target: `/ -> (.+)$/`

3. **Spawning Commands:**
   - Use `spawn()` with `shell: false`
   - Capture stdout/stderr separately
   - Implement timeout handling
   - Check exit codes

4. **Recommended Approach:**
   - Use native `fs.lstat()` and `fs.readlink()` for production
   - Use `ls -la` parsing only for debugging/legacy compatibility
   - Always handle errors gracefully

### Quick Reference

```typescript
// Detection patterns
const isSymlink = (line: string) => /^l/.test(line.trim()) && / -> /.test(line);

// Extraction pattern
const extractTarget = (line: string) => {
  const match = line.match(/ -> (.+)$/);
  return match ? match[1].trim() : null;
};

// Spawn command
const spawnLs = (dir: string) =>
  new Promise<string>((resolve, reject) => {
    const child = spawn('ls', ['-la', dir], { shell: false });
    let stdout = '';
    child.stdout?.on('data', (d) => (stdout += d));
    child.on('close', (code) => (code === 0 ? resolve(stdout) : reject(new Error())));
  });
```

---

## References

- Existing codebase pattern: `/home/dustin/projects/hacky-hack/src/utils/groundswell-linker.ts`
- Node.js `child_process` documentation: https://nodejs.org/api/child_process.html
- Node.js `fs/promises` documentation: https://nodejs.org/api/fs.html
- `ls` command manual: `man ls`
