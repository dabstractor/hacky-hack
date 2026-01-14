# npm List Command Research: Output Format and Parsing Strategies

**Research Date:** 2026-01-14
**Focus:** npm list command output formats, linked package detection, exit codes, and parsing strategies for TypeScript implementation
**Related Subtask:** P1.M1.T1.S5 - Run npm list to verify dependency resolution

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [npm List Command Overview](#npm-list-command-overview)
3. [Output Formats](#output-formats)
4. [Linked Package Detection](#linked-package-detection)
5. [Exit Codes](#exit-codes)
6. [Parsing Edge Cases and Gotchas](#parsing-edge-cases-and-gotchas)
7. [Implementation Recommendations](#implementation-recommendations)
8. [TypeScript Implementation Guide](#typescript-implementation-guide)
9. [References](#references)

---

## Executive Summary

The `npm list` command (alias: `npm ls`) is critical for verifying linked package installations. This research documents:

- **Three output formats**: Default tree, JSON, and parseable formats
- **Linked package detection**: Use `--link` flag or parse symlink indicators in JSON output
- **Exit codes**: 0 for success (package found), 1 for missing package, other codes for errors
- **Recommended approach**: Use `npm list <package> --json` for programmatic verification
- **Edge cases**: Missing packages return exit code 1 with `(empty)` marker, extraneous packages require special handling

**Key Finding for P1.M1.T1.S5**: Use `npm list groundswell --json` and check if the package exists in the dependencies object. If it exists and is linked, it will appear in the JSON structure. Exit code 0 with package present = linked successfully. Exit code 1 = package not found.

---

## npm List Command Overview

### Command Syntax

```bash
npm list [<package-spec>] [<options>]
npm ls [<package-spec>] [<options>]  # alias
```

### Common Options

| Option        | Alias | Type    | Default                                  | Description                              |
| ------------- | ----- | ------- | ---------------------------------------- | ---------------------------------------- |
| `--json`      | `-j`  | Boolean | false                                    | Output in JSON format                    |
| `--parseable` | `-p`  | Boolean | false                                    | Output parseable, tab-separated format   |
| `--long`      | `-l`  | Boolean | false                                    | Show extended information                |
| `--link`      |       | Boolean | false                                    | Show only linked packages                |
| `--depth`     |       | Number  | 0 (without --all), Infinity (with --all) | Maximum display depth of dependency tree |
| `--global`    | `-g`  | Boolean | false                                    | List global packages                     |
| `--all`       | `-a`  | Boolean | false                                    | Show all dependencies, not just direct   |
| `--omit`      |       | String  | 'dev' if NODE_ENV=production             | Omit dev, optional, or peer dependencies |
| `--include`   |       | String  |                                          | Include specific dependency types        |

### Verified Options (npm 11.6.3)

From actual testing:

```bash
npm list --help              # Shows all available options
npm list --depth=0           # Top-level only (default without --all)
npm list --json              # JSON format
npm list --parseable         # Parseable format
npm list --long              # Extended information (may error on specific packages)
npm list --link              # Show only linked packages
npm list <package>           # Show specific package only
```

---

## Output Formats

### 1. Default Tree Format

#### Command

```bash
npm list
npm list --depth=0
npm list <package>
```

#### Output Structure

**All packages (default depth 0 without --all):**

```
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
├── @types/node@20.19.28
├── @typescript-eslint/eslint-plugin@7.18.0
├── commander@14.0.2
└── ... (more packages)
```

**Specific package (found):**

```
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
└── commander@14.0.2
```

**Specific package (missing):**

```
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
└── (empty)
```

**Exit Code:** 1

#### Parsing Strategy

**Detection Pattern:**

- Package found: Contains `└── packagename@version`
- Package missing: Contains `└── (empty)` or just shows root project

**Regex Patterns:**

```typescript
// Match package line
const PACKAGE_PATTERN = /└── ([\w@/-]+)@([\d.]+)/;
// Match empty marker
const EMPTY_PATTERN = /└── \(empty\)/;
// Match root project line
const ROOT_PATTERN = /^[\w-]+@[\d.]+/;

function parseDefaultOutput(output: string): ListResult {
  const lines = output.split('\n');
  const hasPackage = lines.some(line => PACKAGE_PATTERN.test(line));
  const isEmpty = lines.some(line => EMPTY_PATTERN.test(line));

  return {
    found: hasPackage,
    empty: isEmpty,
    exitCode: isEmpty ? 1 : 0,
  };
}
```

#### Advantages

- Human-readable
- Shows tree structure
- Default format, no flags needed

#### Disadvantages

- Brittle parsing (depends on Unicode tree characters)
- Format may change between npm versions
- Requires regex for extraction
- Exit code 1 for missing packages (not an error)

---

### 2. JSON Format (RECOMMENDED)

#### Command

```bash
npm list --json
npm list --json --depth=0
npm list --json <package>
```

#### Output Structure

**All packages (depth=0):**

```json
{
  "version": "0.1.0",
  "name": "hacky-hack",
  "dependencies": {
    "@types/node": {
      "version": "20.19.28",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.19.28.tgz",
      "overridden": false
    },
    "commander": {
      "version": "14.0.2",
      "resolved": "https://registry.npmjs.org/commander/-/commander-14.0.2.tgz",
      "overridden": false
    }
  }
}
```

**Specific package (found):**

```json
{
  "version": "0.1.0",
  "name": "hacky-hack",
  "dependencies": {
    "commander": {
      "version": "14.0.2",
      "resolved": "https://registry.npmjs.org/commander/-/commander-14.0.2.tgz",
      "overridden": false
    }
  }
}
```

**Specific package (missing):**

```json
{
  "version": "0.1.0",
  "name": "hacky-hack"
}
```

**Exit Code:** 1

**No linked packages (--link flag):**

```json
{
  "version": "0.1.0",
  "name": "hacky-hack"
}
```

#### JSON Schema

```typescript
interface NpmListOutput {
  version: string;
  name: string;
  dependencies?: Record<string, PackageInfo>;
  problems?: string[]; // Validation problems
  extraneous?: boolean; // Package not in package.json
  invalid?: boolean; // Package has validation issues
}

interface PackageInfo {
  version: string;
  resolved?: string; // Registry URL or local path for linked packages
  from?: string; // Version range requested
  overridden?: boolean; // Version was overridden
  dependencies?: Record<string, PackageInfo>;
  extraneous?: boolean;
  invalid?: boolean;
  // For linked packages, resolved may be a local file path
}
```

#### Parsing Strategy

```typescript
import { spawn } from 'child_process';
import { promisify } from 'util';

interface ListResult {
  success: boolean;
  found: boolean;
  version?: string;
  linked: boolean;
  path?: string;
  error?: string;
}

async function verifyNpmList(packageName: string): Promise<ListResult> {
  return new Promise(resolve => {
    const proc = spawn('npm', ['list', packageName, '--json', '--depth=0']);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => (stdout += data));
    proc.stderr.on('data', data => (stderr += data));

    proc.on('close', code => {
      try {
        const output = JSON.parse(stdout);

        // Check if package exists in dependencies
        const pkgInfo = output.dependencies?.[packageName];

        if (!pkgInfo) {
          resolve({
            success: false,
            found: false,
            linked: false,
            error: code === 1 ? 'Package not found' : stderr,
          });
          return;
        }

        // Check if linked (resolved contains local path or special marker)
        const isLinked =
          pkgInfo.resolved?.includes('file:') ||
          pkgInfo.resolved?.startsWith('/') ||
          pkgInfo.overridden === false; // Linked packages often have this

        resolve({
          success: true,
          found: true,
          version: pkgInfo.version,
          linked: isLinked,
          path: pkgInfo.resolved,
        });
      } catch (parseError) {
        resolve({
          success: false,
          found: false,
          linked: false,
          error: `Failed to parse JSON: ${parseError}`,
        });
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      proc.kill();
      resolve({
        success: false,
        found: false,
        linked: false,
        error: 'Command timed out',
      });
    }, 10000);
  });
}
```

#### Advantages

- Structured, parseable output
- No fragile regex needed
- Contains metadata (version, resolved path)
- Exit code 0 = found, exit code 1 = not found
- Easy to extract specific information
- Future-proof (schema changes are less likely)

#### Disadvantages

- Requires JSON parsing
- Larger output size
- Slightly slower than default format

---

### 3. Parseable Format

#### Command

```bash
npm list --parseable
npm list -p
npm list --parseable <package>
```

#### Output Structure

**All packages:**

```
/home/dustin/projects/hacky-hack
/home/dustin/projects/hacky-hack/node_modules/@types/node
/home/dustin/projects/hacky-hack/node_modules/@typescript-eslint/eslint-plugin
/home/dustin/projects/hacky-hack/node_modules/commander
```

**Specific package:**

```
/home/dustin/projects/hacky-hack/node_modules/commander
```

#### Parsing Strategy

```typescript
function parseParseableOutput(output: string, packageName: string): ListResult {
  const lines = output.trim().split('\n');

  // Look for the package path
  const packagePath = lines.find(line =>
    line.endsWith(`node_modules/${packageName}`)
  );

  if (!packagePath) {
    return {
      success: false,
      found: false,
      linked: false,
      error: 'Package not found in parseable output',
    };
  }

  return {
    success: true,
    found: true,
    linked: false, // Can't determine link status from this format
    path: packagePath,
  };
}
```

#### Advantages

- Simple, line-based output
- Full file paths
- Easy to parse by line splitting

#### Disadvantages

- **Cannot detect linked packages** (no symlink indicator)
- No version information
- No metadata
- Not useful for link verification

---

## Linked Package Detection

### Method 1: Using --link Flag

#### Command

```bash
npm list --link
npm list --link --json
```

#### Output

**No linked packages (default format):**

```
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
└── (empty)
```

**No linked packages (JSON format):**

```json
{
  "version": "0.1.0",
  "name": "hacky-hack"
}
```

**With linked package (expected):**

```
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
└── groundswell@1.0.0 -> ../../groundswell
```

#### Implementation

```typescript
async function checkLinkedPackages(): Promise<string[]> {
  const result = await execCommand('npm', ['list', '--link', '--json']);

  try {
    const output = JSON.parse(result.stdout);
    const deps = output.dependencies || {};
    return Object.keys(deps);
  } catch {
    return [];
  }
}
```

**Limitation:** Only shows linked packages, doesn't verify if a specific package is linked.

---

### Method 2: Check Specific Package (RECOMMENDED)

#### Command

```bash
npm list <package> --json
```

#### Output Analysis

**Linked packages have indicators:**

1. `resolved` field may contain local path or `file://` protocol
2. `overridden` field typically `false`
3. Path in `resolved` points outside node_modules

**Example linked package output (expected):**

```json
{
  "version": "0.1.0",
  "name": "hacky-hack",
  "dependencies": {
    "groundswell": {
      "version": "1.0.0",
      "resolved": "file:../../groundswell",
      "overridden": false
    }
  }
}
```

#### Implementation

```typescript
interface LinkedPackageResult {
  success: boolean;
  linked: boolean;
  version?: string;
  path?: string;
  error?: string;
}

async function verifyPackageLinked(
  packageName: string
): Promise<LinkedPackageResult> {
  const result = await execCommand('npm', [
    'list',
    packageName,
    '--json',
    '--depth=0',
  ]);

  try {
    const output = JSON.parse(result.stdout);
    const pkgInfo = output.dependencies?.[packageName];

    if (!pkgInfo) {
      return {
        success: true,
        linked: false,
        error: `Package ${packageName} not found`,
      };
    }

    // Check if linked: resolved contains file: or starts with /
    const isLinked =
      pkgInfo.resolved?.includes('file:') ||
      pkgInfo.resolved?.startsWith('/') ||
      pkgInfo.resolved?.startsWith('..');

    return {
      success: true,
      linked: isLinked,
      version: pkgInfo.version,
      path: pkgInfo.resolved,
    };
  } catch (error) {
    return {
      success: false,
      linked: false,
      error: `Failed to parse output: ${error}`,
    };
  }
}
```

---

### Method 3: Symlink Verification (Hybrid Approach)

Combine `npm list` with filesystem verification:

```typescript
import { lstat, readlink } from 'fs/promises';
import { join } from 'path';

async function verifyPackageSymlink(
  packageName: string,
  projectPath: string
): Promise<LinkedPackageResult> {
  const symlinkPath = join(projectPath, 'node_modules', packageName);

  try {
    const stats = await lstat(symlinkPath);

    if (!stats.isSymbolicLink()) {
      return {
        success: true,
        linked: false,
        error: 'Package exists but is not a symlink',
      };
    }

    const target = await readlink(symlinkPath);

    return {
      success: true,
      linked: true,
      path: symlinkPath,
      error: undefined,
    };
  } catch (error) {
    return {
      success: false,
      linked: false,
      error: `Symlink check failed: ${error}`,
    };
  }
}

// Combined verification
async function verifyLinkedPackage(
  packageName: string
): Promise<LinkedPackageResult> {
  // Step 1: Check npm list
  const npmResult = await verifyPackageLinked(packageName);

  if (!npmResult.linked) {
    return npmResult;
  }

  // Step 2: Verify symlink exists
  const projectPath = process.cwd();
  const fsResult = await verifyPackageSymlink(packageName, projectPath);

  return {
    ...npmResult,
    ...fsResult,
    linked: npmResult.linked && fsResult.linked,
  };
}
```

---

## Exit Codes

### Documented Exit Codes

| Exit Code | Meaning           | When It Occurs                                               |
| --------- | ----------------- | ------------------------------------------------------------ |
| 0         | Success           | Package found and listed successfully                        |
| 1         | Package Missing   | Package not found in dependency tree                         |
| 1         | General Error     | Various error conditions (npm returns 1 for all non-success) |
| 127       | Command Not Found | npm executable not found in PATH                             |

### Verified Exit Codes (npm 11.6.3)

From actual testing:

```bash
# Package found - exit code 0
$ npm list commander
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
└── commander@14.0.2
$ echo $?
0

# Package missing - exit code 1
$ npm list some-nonexistent-package
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
└── (empty)
$ echo $?
1

# JSON format with missing package - exit code 1
$ npm list --json some-nonexistent-package
{
  "version": "0.1.0",
  "name": "hacky-hack"
}
$ echo $?
1
```

### Exit Code Handling Strategy

```typescript
interface ExecResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

async function execCommand(
  command: string,
  args: string[]
): Promise<ExecResult> {
  return new Promise(resolve => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => (stdout += data));
    proc.stderr.on('data', data => (stderr += data));

    proc.on('close', code => {
      resolve({ exitCode: code, stdout, stderr });
    });
  });
}

// Usage
async function safeNpmList(packageName: string): Promise<ListResult> {
  const result = await execCommand('npm', ['list', packageName, '--json']);

  // Exit code 1 with JSON output = package not found (not an error)
  if (result.exitCode === 1 && result.stdout.trim().startsWith('{')) {
    const output = JSON.parse(result.stdout);
    if (!output.dependencies?.[packageName]) {
      return {
        success: false,
        found: false,
        linked: false,
        error: 'Package not found',
      };
    }
  }

  // Exit code 1 without JSON = actual error
  if (result.exitCode === 1) {
    return {
      success: false,
      found: false,
      linked: false,
      error: result.stderr || 'Unknown error',
    };
  }

  // Exit code 0 = success
  try {
    const output = JSON.parse(result.stdout);
    const pkgInfo = output.dependencies?.[packageName];

    return {
      success: true,
      found: !!pkgInfo,
      linked: pkgInfo?.resolved?.includes('file:') || false,
      version: pkgInfo?.version,
      path: pkgInfo?.resolved,
    };
  } catch {
    return {
      success: false,
      found: false,
      linked: false,
      error: 'Failed to parse output',
    };
  }
}
```

---

## Parsing Edge Cases and Gotchas

### Edge Case 1: Unicode Tree Characters

**Issue:** Default format uses Unicode tree-drawing characters (├─, └─) which may not render correctly in all terminals.

**Example:**

```
hacky-hack@0.1.0 /home/dustin/projects/hacky-hack
├── package1@1.0.0
└── package2@2.0.0
```

**Workarounds:**

1. Use `--json` format (recommended)
2. Set `NO_UNICODE=1` environment variable:
   ```bash
   NO_UNICODE=1 npm list
   ```
3. Force ASCII output:
   ```bash
   npm list --no-unicode
   ```

**Impact on Parsing:**

- Regex patterns must handle Unicode or use JSON format
- Different terminals may display differently
- Not reliable for programmatic parsing

---

### Edge Case 2: Missing Package Exit Code Ambiguity

**Issue:** Exit code 1 can mean:

- Package not found (expected)
- Actual error (unexpected)

**Example:**

```bash
# Both return exit code 1
npm list nonexistent-package    # Expected: not found
npm list --invalid-flag         # Unexpected: error
```

**Detection Strategy:**

```typescript
function isPackageNotFound(stderr: string): boolean {
  // If stderr is empty or minimal, likely just "not found"
  return !stderr || stderr.includes('empty');
}

function isActualError(stderr: string): boolean {
  // If stderr contains error messages, it's a real error
  return stderr.includes('ERR') || stderr.includes('npm ERR');
}

async function robustNpmList(packageName: string): Promise<ListResult> {
  const result = await execCommand('npm', ['list', packageName, '--json']);

  if (result.exitCode === 0) {
    // Success - parse output
    return parseSuccessResult(result.stdout);
  }

  if (result.exitCode === 1) {
    // Check if it's just "not found"
    if (isPackageNotFound(result.stderr)) {
      return {
        success: false,
        found: false,
        linked: false,
        error: 'Package not found',
      };
    }

    // Otherwise, it's an error
    return {
      success: false,
      found: false,
      linked: false,
      error: result.stderr || 'Unknown error',
    };
  }

  // Other exit codes
  return {
    success: false,
    found: false,
    linked: false,
    error: `Unexpected exit code: ${result.exitCode}`,
  };
}
```

---

### Edge Case 3: Extraneous Packages

**Issue:** Packages installed but not in package.json show as "extraneous".

**Example Output:**

```json
{
  "dependencies": {
    "some-package": {
      "version": "1.0.0",
      "extraneous": true
    }
  }
}
```

**Handling:**

```typescript
interface PackageInfo {
  version: string;
  extraneous?: boolean; // May be present
  invalid?: boolean;
}

function isPackageValid(pkgInfo: PackageInfo): boolean {
  return !pkgInfo.extraneous && !pkgInfo.invalid;
}
```

---

### Edge Case 4: Nested Dependencies

**Issue:** Without `--depth=0`, output includes entire dependency tree.

**Example (without depth limit):**

```json
{
  "dependencies": {
    "package-a": {
      "version": "1.0.0",
      "dependencies": {
        "package-b": {
          "version": "2.0.0",
          "dependencies": {
            /* ... deep nesting ... */
          }
        }
      }
    }
  }
}
```

**Solution:** Always use `--depth=0` for top-level checks:

```bash
npm list <package> --json --depth=0
```

---

### Edge Case 5: Circular Dependencies

**Issue:** Circular dependencies cause npm to display warnings.

**Example:**

```
npm WARN circular dependency-a@1.0.0 -> dependency-b@2.0.0 -> dependency-a@1.0.0
```

**Impact:** Still produces valid JSON, but includes `problems` array:

```json
{
  "dependencies": {
    /* ... */
  },
  "problems": [
    "circul dep: dependency-a@1.0.0 -> dependency-b@2.0.0 -> dependency-a@1.0.0"
  ]
}
```

**Handling:**

```typescript
interface NpmListOutput {
  dependencies?: Record<string, PackageInfo>;
  problems?: string[];
}

function hasProblems(output: NpmListOutput): boolean {
  return output.problems && output.problems.length > 0;
}
```

---

### Edge Case 6: Platform-Specific Path Formats

**Issue:** Symlink paths differ between Windows and Unix.

**Windows:**

```json
{
  "resolved": "file:\\..\\..\\groundswell"
}
```

**Unix:**

```json
{
  "resolved": "file:../../groundswell"
}
```

**Cross-Platform Detection:**

```typescript
function isLinkedPackage(pkgInfo: PackageInfo): boolean {
  if (!pkgInfo.resolved) return false;

  // Handle both formats
  return (
    pkgInfo.resolved.includes('file:') ||
    pkgInfo.resolved.includes('\\..\\') ||
    pkgInfo.resolved.includes('/../')
  );
}
```

---

### Edge Case 7: Git Dependencies

**Issue:** Packages from git URLs show in parentheses.

**Example Output:**

```
└── my-package@1.0.0 (git+https://github.com/user/repo.git#commit-hash)
```

**JSON Output:**

```json
{
  "resolved": "git+https://github.com/user/repo.git#abc123",
  "from": "git+https://github.com/user/repo.git"
}
```

**Distinguishing from Linked:**

```typescript
function isGitDependency(pkgInfo: PackageInfo): boolean {
  return pkgInfo.resolved?.startsWith('git+') || false;
}

function isLinkedDependency(pkgInfo: PackageInfo): boolean {
  return (
    pkgInfo.resolved?.startsWith('file:') ||
    pkgInfo.resolved?.startsWith('/') ||
    pkgInfo.resolved?.startsWith('..')
  );
}
```

---

### Edge Case 8: Timeout on Large Projects

**Issue:** `npm list` can be slow on projects with many dependencies.

**Solution:** Always use timeout:

```typescript
async function npmListWithTimeout(
  packageName: string,
  timeoutMs: number = 10000
): Promise<ListResult> {
  return new Promise(resolve => {
    const proc = spawn('npm', ['list', packageName, '--json', '--depth=0']);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => (stdout += data));
    proc.stderr.on('data', data => (stderr += data));

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      setTimeout(() => proc.kill('SIGKILL'), 5000);
      resolve({
        success: false,
        found: false,
        linked: false,
        error: 'Command timed out',
      });
    }, timeoutMs);

    proc.on('close', code => {
      clearTimeout(timer);
      // Process result...
    });
  });
}
```

---

### Edge Case 9: Symlink vs Junction (Windows)

**Issue:** Windows uses junctions, not symlinks, in some cases.

**Detection:**

```typescript
import { lstat } from 'fs/promises';

async function getLinkType(
  path: string
): Promise<'symlink' | 'junction' | 'file'> {
  try {
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) return 'symlink';
    // Junctions require additional platform-specific checks
    return 'file';
  } catch {
    return 'file';
  }
}
```

---

### Edge Case 10: Multiple Versions of Same Package

**Issue:** npm can install multiple versions via deduping.

**Example:**

```json
{
  "dependencies": {
    "package-a": {
      "version": "1.0.0"
    }
  },
  // Nested in other dependencies
  "package-a": {
    "version": "2.0.0"
  }
}
```

**Handling:** Use `--depth=0` to avoid this complexity.

---

## Implementation Recommendations

### Recommended Approach for P1.M1.T1.S5

Based on this research, the recommended implementation for verifying Groundswell link:

```typescript
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

/**
 * Result of npm list verification
 */
export interface NpmListResult {
  success: boolean;
  linked: boolean;
  version?: string;
  path?: string;
  exitCode: number;
  error?: string;
}

/**
 * Verify if a package is linked using npm list
 *
 * @param packageName - Name of the package to check
 * @param projectPath - Path to the project (default: process.cwd())
 * @param timeout - Command timeout in milliseconds (default: 10000)
 * @returns Promise<NpmListResult>
 */
export async function verifyNpmListLinked(
  packageName: string,
  projectPath: string = process.cwd(),
  timeout: number = 10000
): Promise<NpmListResult> {
  // Step 1: Run npm list --json
  const npmResult = await runNpmListJson(packageName, timeout);

  if (!npmResult.success || !npmResult.found) {
    return {
      success: false,
      linked: false,
      exitCode: npmResult.exitCode,
      error: npmResult.error || 'Package not found',
    };
  }

  // Step 2: Verify symlink exists on filesystem
  const fsResult = await verifySymlinkExists(packageName, projectPath);

  return {
    success: true,
    linked: fsResult.linked,
    version: npmResult.version,
    path: fsResult.path,
    exitCode: 0,
    error: fsResult.error,
  };
}

/**
 * Run npm list command with JSON output
 */
async function runNpmListJson(
  packageName: string,
  timeout: number
): Promise<{
  success: boolean;
  found: boolean;
  version?: string;
  exitCode: number;
  error?: string;
}> {
  return new Promise(resolve => {
    const proc = spawn('npm', ['list', packageName, '--json', '--depth=0'], {
      cwd: process.cwd(),
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => {
      stdout += data;
    });
    proc.stderr.on('data', data => {
      stderr += data;
    });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      setTimeout(() => proc.kill('SIGKILL'), 5000);
      resolve({
        success: false,
        found: false,
        exitCode: -1,
        error: 'Command timed out',
      });
    }, timeout);

    proc.on('close', code => {
      clearTimeout(timer);

      // Exit code 1 with JSON = package not found (not an error)
      if (code === 1 && stdout.trim().startsWith('{')) {
        try {
          const output = JSON.parse(stdout);
          const pkgInfo = output.dependencies?.[packageName];

          if (!pkgInfo) {
            resolve({
              success: false,
              found: false,
              exitCode: code,
              error: `Package ${packageName} not found in dependency tree`,
            });
            return;
          }

          resolve({
            success: true,
            found: true,
            version: pkgInfo.version,
            exitCode: code,
          });
          return;
        } catch (parseError) {
          resolve({
            success: false,
            found: false,
            exitCode: code,
            error: `Failed to parse JSON: ${parseError}`,
          });
          return;
        }
      }

      // Exit code 1 without JSON = actual error
      if (code === 1) {
        resolve({
          success: false,
          found: false,
          exitCode: code,
          error: stderr || 'Unknown error',
        });
        return;
      }

      // Exit code 0 = success
      if (code === 0) {
        try {
          const output = JSON.parse(stdout);
          const pkgInfo = output.dependencies?.[packageName];

          resolve({
            success: true,
            found: !!pkgInfo,
            version: pkgInfo?.version,
            exitCode: code,
          });
        } catch (parseError) {
          resolve({
            success: false,
            found: false,
            exitCode: code,
            error: `Failed to parse JSON: ${parseError}`,
          });
        }
        return;
      }

      // Other exit codes
      resolve({
        success: false,
        found: false,
        exitCode: code || -1,
        error: `Unexpected exit code: ${code}`,
      });
    });
  });
}

/**
 * Verify symlink exists on filesystem
 */
async function verifySymlinkExists(
  packageName: string,
  projectPath: string
): Promise<{ linked: boolean; path?: string; error?: string }> {
  const symlinkPath = require('path').join(
    projectPath,
    'node_modules',
    packageName
  );

  try {
    const stats = await fs.lstat(symlinkPath);

    if (!stats.isSymbolicLink()) {
      return {
        linked: false,
        error: `Package ${packageName} exists but is not a symbolic link`,
      };
    }

    const target = await fs.readlink(symlinkPath);

    return {
      linked: true,
      path: symlinkPath,
      error: undefined,
    };
  } catch (error) {
    return {
      linked: false,
      error: `Symlink verification failed: ${error}`,
    };
  }
}

// Export for use in S5
export default verifyNpmListLinked;
```

---

## TypeScript Implementation Guide

### Unit Testing Strategy

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyNpmListLinked } from './npm-list-verifier';

describe('verifyNpmListLinked', () => {
  const mockPackageName = 'groundswell';
  const mockProjectPath = '/home/dustin/projects/hacky-hack';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return linked=true when package is linked', async () => {
    // Mock successful npm list
    vi.mock('child_process', () => ({
      spawn: vi.fn(() => ({
        stdout: {
          on: vi.fn((_, cb) =>
            cb(
              Buffer.from(
                JSON.stringify({
                  version: '0.1.0',
                  name: 'hacky-hack',
                  dependencies: {
                    groundswell: {
                      version: '1.0.0',
                      resolved: 'file:../../groundswell',
                    },
                  },
                })
              )
            )
          ),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(0);
        }),
      })),
    }));

    // Mock symlink exists
    vi.mock('fs/promises', () => ({
      lstat: vi.fn(() => ({ isSymbolicLink: () => true })),
      readlink: vi.fn(() => '../../groundswell'),
    }));

    const result = await verifyNpmListLinked(mockPackageName, mockProjectPath);

    expect(result.success).toBe(true);
    expect(result.linked).toBe(true);
    expect(result.version).toBe('1.0.0');
  });

  it('should return linked=false when package not found', async () => {
    // Mock npm list with missing package
    vi.mock('child_process', () => ({
      spawn: vi.fn(() => ({
        stdout: {
          on: vi.fn((_, cb) =>
            cb(
              Buffer.from(
                JSON.stringify({
                  version: '0.1.0',
                  name: 'hacky-hack',
                })
              )
            )
          ),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(1);
        }),
      })),
    }));

    const result = await verifyNpmListLinked(mockPackageName, mockProjectPath);

    expect(result.success).toBe(false);
    expect(result.linked).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should return linked=false when symlink does not exist', async () => {
    // Mock npm list success
    vi.mock('child_process', () => ({
      spawn: vi.fn(() => ({
        stdout: {
          on: vi.fn((_, cb) =>
            cb(
              Buffer.from(
                JSON.stringify({
                  version: '0.1.0',
                  name: 'hacky-hack',
                  dependencies: {
                    groundswell: { version: '1.0.0' },
                  },
                })
              )
            )
          ),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === 'close') cb(0);
        }),
      })),
    }));

    // Mock symlink not found
    vi.mock('fs/promises', () => ({
      lstat: vi.fn(() => {
        throw new Error('ENOENT');
      }),
    }));

    const result = await verifyNpmListLinked(mockPackageName, mockProjectPath);

    expect(result.success).toBe(true);
    expect(result.linked).toBe(false);
  });

  it('should timeout after specified duration', async () => {
    vi.useFakeTimers();

    // Mock hanging process
    vi.mock('child_process', () => ({
      spawn: vi.fn(() => ({
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      })),
    }));

    const promise = verifyNpmListLinked(mockPackageName, mockProjectPath, 1000);
    vi.advanceTimersByTime(1000);

    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');

    vi.useRealTimers();
  });
});
```

---

## References

### Official Documentation

1. **npm list Official Documentation**
   - URL: https://docs.npmjs.com/cli/v10/commands/npm-ls
   - Description: Official npm list command documentation
   - Coverage: Command syntax, options, output formats, exit codes
   - Verified: npm 11.6.3

2. **npm Package Configuration**
   - URL: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
   - Description: package.json configuration reference
   - Coverage: dependencies, linked packages, package resolution

3. **npm link Documentation**
   - URL: https://docs.npmjs.com/cli/v10/commands/npm-link
   - Description: Creating and managing symbolic links
   - Coverage: Link creation, verification, unlinking

### Additional Resources

4. **npm Exit Codes**
   - URL: https://docs.npmjs.com/cli/v10/using-npm/exit-codes
   - Description: npm exit code reference
   - Coverage: Standard exit codes, error conditions

5. **Node.js child_process Documentation**
   - URL: https://nodejs.org/api/child_process.html
   - Description: spawning npm from Node.js
   - Coverage: spawn(), exec(), exit codes, stdout/stderr handling

6. **Node.js fs.promises Documentation**
   - URL: https://nodejs.org/api/fs.html
   - Description: Filesystem operations for symlink verification
   - Coverage: lstat(), readlink(), symbolic link detection

### Research Methods

**Testing Environment:**

- npm version: 11.6.3
- Node.js version: 20.11.0
- Platform: Linux 6.17.8-arch1-1
- Project: hacky-hack@0.1.0

**Commands Tested:**

- `npm list` (default format)
- `npm list --depth=0`
- `npm list --json`
- `npm list --json --depth=0`
- `npm list --parseable`
- `npm list --link`
- `npm list --link --json`
- `npm list <package>` (found)
- `npm list <package>` (missing)
- `npm list --json <package>` (found)
- `npm list --json <package>` (missing)

**Verification Methods:**

- Direct command execution with Bash tool
- Exit code inspection
- Output format analysis
- JSON structure validation
- Symlink verification with `ls -la`

---

## Summary and Key Takeaways

### For P1.M1.T1.S5 Implementation

**Recommended Command:**

```bash
npm list groundswell --json --depth=0
```

**Success Criteria:**

- Exit code: 0
- JSON contains `dependencies.groundswell`
- Symlink exists at `node_modules/groundswell`

**Failure Modes:**

- Exit code 1 with empty JSON: package not found
- Exit code 1 with error message: actual error
- No symlink: npm list succeeded but link failed

**Best Practices:**

1. Always use `--json` for programmatic parsing
2. Always use `--depth=0` for top-level checks
3. Always implement timeout (10 seconds recommended)
4. Combine npm list with filesystem symlink verification
5. Handle exit code 1 carefully (can mean "not found" or "error")
6. Mock child_process and fs modules for testing

### Testing Checklist

- [ ] Package found and linked (exit 0, symlink exists)
- [ ] Package not found (exit 1, empty JSON)
- [ ] Package exists but not linked (exit 0, no symlink)
- [ ] Command timeout handling
- [ ] JSON parsing error handling
- [ ] Invalid package name handling
- [ ] Cross-platform path handling
- [ ] npm not in PATH (exit 127)

---

**End of Research Document**

**Next Steps for P1.M1.T1.S5:**

1. Implement `verifyNpmListLinked()` function using recommended approach
2. Create unit tests with mocked child_process and fs
3. Integrate into S5 workflow to consume S4 output
4. Document function contract and return structure
5. Add to GroundswellVerifier utilities or create separate npm-list-verifier.ts
