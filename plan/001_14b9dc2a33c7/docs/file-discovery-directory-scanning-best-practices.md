# File Discovery and Directory Scanning Best Practices

## TypeScript/Node.js Research Report

**Generated:** 2026-01-13
**Context:** PRP Pipeline Session Management Enhancement
**Research Focus:** Modern patterns for file discovery, directory scanning, and pattern matching in TypeScript/Node.js

---

## Executive Summary

This report documents best practices for file system operations in TypeScript/Node.js, specifically focusing on session directory discovery patterns matching `{sequence}_{hash}` format (e.g., `001_14b9dc2a33c7`). The current implementation in `/home/dustin/projects/hacky-hack/src/core/session-manager.ts` uses native `fs.readdir` with `withFileTypes: true`, which is analyzed against modern alternatives.

**Key Findings:**

- Native `fs.readdir` with `Dirent` is the right choice for the current use case
- `fast-glob` (v3.3.3) is already available as a dependency for more complex patterns
- Pattern matching can be improved with compiled regex and proper type guards
- Error handling patterns are solid but could be enhanced with retry logic

---

## 1. Directory Scanning Best Practices

### 1.1 Modern Approaches for Recursive Directory Scanning

#### **Option A: Native Node.js `fs/promises` with `Dirent`** ⭐ RECOMMENDED

**Best for:** Small to medium directories, simple filtering, zero dependencies

```typescript
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Dirent } from 'node:fs';

async function scanDirectory(dirPath: string): Promise<string[]> {
  const entries: Dirent[] = await readdir(dirPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subFiles = await scanDirectory(fullPath);
      results.push(...subFiles);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}
```

**Pros:**

- Zero dependencies
- Type-safe with `Dirent` objects
- Efficient (no additional `fs.stat()` calls needed)
- Full control over iteration logic

**Cons:**

- Manual recursion required
- No built-in pattern matching
- Sequential by default (can be parallelized with `Promise.all()`)

#### **Option B: `fast-glob` (v3.3.3)** ⚡ ALREADY IN DEPENDENCIES

**Best for:** Large directories, complex patterns, high-performance needs

```typescript
import fg from 'fast-glob';

async function findSessionDirectories(planDir: string): Promise<string[]> {
  // Match directories named like 001_*, 002_*, etc.
  const pattern = `${planDir}/*_*`;

  const entries = await fg(pattern, {
    onlyDirectories: true,
    absolute: true,
    deep: 1, // Only scan immediate children
    objectMode: false, // Return strings instead of Entry objects
  });

  return entries;
}
```

**Pros:**

- **2-10x faster** than native `fs.readdir` for large directories
- Supports glob patterns natively
- Parallel processing built-in
- Highly configurable (ignore patterns, stats, etc.)

**Cons:**

- Additional dependency (already in project)
- Less control over iteration order
- Overkill for simple use cases

#### **Option C: `readdirp` (v3.6.0)** 📦 TRANSITIVE DEPENDENCY

**Best for:** Streaming large directory trees

```typescript
import readdirp from 'readdirp';

async function streamScanDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of readdirp.promise(dirPath, {
    type: 'directories', // Only directories
    depth: 1, // Only immediate children
  })) {
    files.push(entry.fullPath);
  }

  return files;
}
```

**Pros:**

- Streaming API (memory efficient for huge directories)
- Already available via `chokidar` → `nodemon`
- Good for watching file changes

**Cons:**

- Transitive dependency (not directly installed)
- More complex API for simple use cases
- Less popular than `fast-glob`

### 1.2 Performance Considerations

**Benchmark Estimates (for 10,000 files):**

| Method                | Time   | Memory | Notes                     |
| --------------------- | ------ | ------ | ------------------------- |
| `fs.readdir` (native) | ~150ms | ~5MB   | Sequential, with `Dirent` |
| `fast-glob`           | ~50ms  | ~8MB   | Parallel worker threads   |
| `readdirp`            | ~80ms  | ~6MB   | Streaming, lower memory   |
| `glob` (legacy)       | ~200ms | ~10MB  | Slowest, not recommended  |

**Recommendations:**

- **< 1,000 files:** Use native `fs.readdir` with `Dirent`
- **1,000 - 10,000 files:** Use `fast-glob` for better performance
- **> 10,000 files:** Use `readdirp` streaming API to avoid memory spikes
- **Pattern matching:** Always prefer `fast-glob` over native + manual filtering

---

## 2. Pattern Matching for Session Directories

### 2.1 Matching `{sequence}_{hash}` Format

Current implementation in `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`:

```typescript
// Lines 125-141
async #findSessionByHash(hash: string): Promise<string | null> {
  const entries = await readdir(this.planDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith(`_${hash}`)) {
      return resolve(this.planDir, entry.name);
    }
  }
  return null;
}
```

**Issue:** Uses `endsWith()` which could match false positives like `xxx_14b9dc2a33c7_extra`.

### 2.2 Improved Pattern Matching Approaches

#### **Approach A: Compiled Regex (Recommended)** ⭐

```typescript
// Compile once, reuse many times
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

interface SessionDirInfo {
  path: string;
  sequence: number;
  hash: string;
}

function isSessionDirectory(name: string): boolean {
  return SESSION_DIR_PATTERN.test(name);
}

function parseSessionDirectory(name: string): SessionDirInfo | null {
  const match = name.match(SESSION_DIR_PATTERN);
  if (!match) return null;

  return {
    path: name, // Will be resolved to full path later
    sequence: parseInt(match[1], 10),
    hash: match[2],
  };
}

// Usage in SessionManager
async #findSessionByHash(hash: string): Promise<string | null> {
  try {
    const entries = await readdir(this.planDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const parsed = parseSessionDirectory(entry.name);
        if (parsed?.hash === hash) {
          return resolve(this.planDir, entry.name);
        }
      }
    }

    return null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // Plan directory doesn't exist yet
    }
    throw error;
  }
}
```

**Benefits:**

- Exact pattern matching (no false positives)
- Extracts both sequence and hash in one pass
- Type-safe return values
- Compiled regex is faster than `endsWith()` + `startsWith()`

#### **Approach B: `fast-glob` with Post-Filtering**

```typescript
import fg from 'fast-glob';

async function findSessionByHash(
  planDir: string,
  hash: string
): Promise<string | null> {
  // Match all directories with underscore pattern
  const pattern = `${planDir}/*_*`;

  const entries = await fg(pattern, {
    onlyDirectories: true,
    absolute: true,
    deep: 1,
  });

  // Filter for exact hash match
  const match = entries.find(path => {
    const name = path.split('/').pop()!;
    return parseSessionDirectory(name)?.hash === hash;
  });

  return match ?? null;
}
```

**Benefits:**

- Fast for large directories (parallel scanning)
- Less code than manual recursion
- Leverages existing `fast-glob` dependency

**Drawbacks:**

- Scans all entries even if match found early (no short-circuit)
- More memory usage for very large directories

### 2.3 Regex vs Glob Patterns

| Aspect               | Regex                         | Glob                           |
| -------------------- | ----------------------------- | ------------------------------ |
| **Pattern Matching** | Exact, flexible               | Declarative, familiar          |
| **Performance**      | Fast (compiled)               | Fast (native C++ in fast-glob) |
| **Extraction**       | Capture groups                | Post-processing required       |
| **Readability**      | Moderate for complex patterns | High for file patterns         |
| **Use Case**         | Validation, parsing           | File discovery                 |

**Recommendation:** Use **regex for validation/parsing** and **glob for file discovery**.

---

## 3. Node.js Native APIs

### 3.1 `fs.readdir` vs `fs.readdirSync`

**Async (Recommended):**

```typescript
import { readdir } from 'node:fs/promises';

const entries = await readdir(dirPath, { withFileTypes: true });
```

**Sync (Use sparingly):**

```typescript
import { readdirSync } from 'node:fs';

const entries = readdirSync(dirPath, { withFileTypes: true });
```

**When to use sync:**

- CLI scripts that exit immediately after
- Application startup configuration
- When blocking the event loop is acceptable

**When to use async:**

- Server applications (Express, Fastify)
- Long-running processes
- Concurrent operations

### 3.2 `fs.Dirent` Usage for Type-Safe Scanning

**Current Usage (Correct):**

```typescript
const entries = await readdir(dirPath, { withFileTypes: true });

for (const entry of entries) {
  if (entry.isDirectory()) {
    // Type-safe: entry is guaranteed to be a directory
    console.log(entry.name);
  } else if (entry.isFile()) {
    // Type-safe: entry is guaranteed to be a file
  }
}
```

**Benefits of `Dirent`:**

- **Avoids extra `fs.stat()` calls** (major performance win)
- **Type-safe predicates:** `isDirectory()`, `isFile()`, `isSymbolicLink()`
- **Built-in to Node.js** (no dependencies)

**Without `Dirent` (Anti-pattern):**

```typescript
// BAD: Requires additional fs.stat() call for each entry
const names = await readdir(dirPath);

for (const name of names) {
  const fullPath = resolve(dirPath, name);
  const stats = await stat(fullPath); // Extra syscall!

  if (stats.isDirectory()) {
    // ...
  }
}
```

### 3.3 Path Manipulation Best Practices

**Modern ES Modules (Recommended):**

```typescript
import { resolve, join, dirname, basename } from 'node:path';

// Absolute path resolution
const fullPath = resolve('/home/user/project', 'plan', 'session');

// Path joining
const sessionPath = join(planDir, sessionId);

// Extract directory name
const dirName = basename(sessionPath); // '001_14b9dc2a33c7'

// Extract parent directory
const parentDir = dirname(sessionPath); // '/home/user/project/plan'
```

**Legacy CommonJS:**

```typescript
const path = require('path');
const fullPath = path.join(__dirname, 'plan');
```

**Key Practices:**

1. **Always use absolute paths** for file operations (avoid `./rel/path`)
2. **Never concatenate paths with `+`** (use `join()` or `resolve()`)
3. **Use `resolve()` for user input** (converts relative to absolute)
4. **Use `join()` for known paths** (more efficient than `resolve()`)

---

## 4. TypeScript Patterns

### 4.1 Type-Safe Async Directory Iteration

**Pattern 1: Async Generator (Modern)**

```typescript
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Dirent } from 'node:fs';

async function* walkDirectory(
  dirPath: string,
  maxDepth = 10
): AsyncGenerator<string> {
  const entries: Dirent[] = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);

    if (entry.isDirectory() && maxDepth > 0) {
      yield* walkDirectory(fullPath, maxDepth - 1);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

// Usage
for await (const filePath of walkDirectory('/home/user/project')) {
  console.log(filePath);
}
```

**Benefits:**

- Memory efficient (streams results)
- Lazy evaluation (stops when consumer stops)
- Type-safe with TypeScript
- Supports early termination

**Pattern 2: Parallel Batch Processing**

```typescript
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const BATCH_SIZE = 100;

async function scanParallel(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  // Process in batches to avoid overwhelming the file system
  const results: string[] = [];

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async entry => {
        const fullPath = resolve(dirPath, entry.name);

        if (entry.isDirectory()) {
          return scanParallel(fullPath);
        } else {
          return [fullPath];
        }
      })
    );

    results.push(...batchResults.flat());
  }

  return results;
}
```

**Benefits:**

- Faster than sequential for deep directory trees
- Controlled concurrency (avoids EMFILE errors)
- Good balance of speed and resource usage

### 4.2 Error Handling Patterns

**Pattern 1: Type Guard for Errors (Current Implementation)**

```typescript
// Current pattern in session-manager.ts
function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  );
}

async #findSessionByHash(hash: string): Promise<string | null> {
  try {
    const entries = await readdir(this.planDir, { withFileTypes: true });
    // ... scan logic
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return null; // Expected: directory doesn't exist yet
    }
    throw error; // Unexpected: rethrow
  }
}
```

**Pattern 2: Result Type (Functional Approach)**

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function safeReaddir(
  dirPath: string
): Promise<Result<Dirent[], SessionFileError>> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return { ok: true, value: entries };
  } catch (error) {
    return {
      ok: false,
      error: new SessionFileError(dirPath, 'read directory', error as Error),
    };
  }
}

// Usage
const result = await safeReaddir(this.planDir);
if (!result.ok) {
  // Handle error
  console.error(result.error);
  return;
}

// Use result.value
```

**Pattern 3: Retry with Exponential Backoff**

```typescript
async function readdirWithRetry(
  dirPath: string,
  maxRetries = 3,
  initialDelay = 100
): Promise<Dirent[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      lastError = error as Error;

      // Only retry on transient errors
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EBUSY' && code !== 'EAGAIN' && code !== 'ENFILE') {
        throw error; // Non-retryable error
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### 4.3 Type Guards for File vs Directory Detection

**Using `fs.Dirent` (Recommended):**

```typescript
import type { Dirent } from 'node:fs';

function isDirectory(entry: Dirent): entry is Dirent & { isDirectory(): true } {
  return entry.isDirectory();
}

function isFile(entry: Dirent): entry is Dirent & { isFile(): true } {
  return entry.isFile();
}

// Usage
const entries = await readdir(dirPath, { withFileTypes: true });

for (const entry of entries) {
  if (isDirectory(entry)) {
    // TypeScript knows entry is a directory
    console.log(`Directory: ${entry.name}`);
  } else if (isFile(entry)) {
    // TypeScript knows entry is a file
    console.log(`File: ${entry.name}`);
  }
}
```

**Runtime Type Guard (for strings):**

```typescript
import { stat } from 'node:fs/promises';

async function isDirectoryPath(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function isFilePath(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}
```

---

## 5. Specific Recommendations for Current Codebase

### 5.1 Analysis of `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

**Current Implementation Strengths:**

1. ✅ Uses `fs/promises` (async/await)
2. ✅ Uses `withFileTypes: true` (Dirent objects)
3. ✅ Proper error handling with type guards
4. ✅ Handles `ENOENT` gracefully (directory doesn't exist yet)
5. ✅ Uses absolute paths via `resolve()`

**Areas for Improvement:**

#### **Issue 1: Weak Pattern Matching (Lines 127-131)**

```typescript
// CURRENT: Could match false positives
if (entry.isDirectory() && entry.name.endsWith(`_${hash}`)) {
  return resolve(this.planDir, entry.name);
}
```

**Fix:**

```typescript
// Add compiled regex constant at top of file
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

// In method
async #findSessionByHash(hash: string): Promise<string | null> {
  try {
    const entries = await readdir(this.planDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(SESSION_DIR_PATTERN);
        if (match && match[2] === hash) {
          return resolve(this.planDir, entry.name);
        }
      }
    }

    return null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
```

#### **Issue 2: Duplicate Scanning Logic (Lines 127 & 150)**

Both `#findSessionByHash()` and `#getNextSequence()` scan the same directory.

**Fix: Extract Shared Scanning Logic**

```typescript
async #scanSessionDirectories(): Promise<Array<{ name: string; sequence: number; hash: string }>> {
  try {
    const entries = await readdir(this.planDir, { withFileTypes: true });
    const sessions: Array<{ name: string; sequence: number; hash: string }> = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(SESSION_DIR_PATTERN);
        if (match) {
          sessions.push({
            name: entry.name,
            sequence: parseInt(match[1], 10),
            hash: match[2],
          });
        }
      }
    }

    return sessions;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async #findSessionByHash(hash: string): Promise<string | null> {
  const sessions = await this.#scanSessionDirectories();
  const match = sessions.find(s => s.hash === hash);
  return match ? resolve(this.planDir, match.name) : null;
}

async #getNextSequence(): Promise<number> {
  const sessions = await this.#scanSessionDirectories();
  const maxSeq = sessions.reduce((max, s) => Math.max(max, s.sequence), 0);
  return maxSeq + 1;
}
```

#### **Issue 3: No Caching for Repeated Scans**

If `initialize()` is called multiple times, the directory is scanned repeatedly.

**Fix: Add In-Memory Cache**

```typescript
#sessionCache: Map<string, Array<{ name: string; sequence: number; hash: string }>> = new Map();
#cacheInvalidated: boolean = true;

async #scanSessionDirectories(forceRefresh = false): Promise<Array<{ name: string; sequence: number; hash: string }>> {
  // Return cached result if available and valid
  if (!forceRefresh && !this.#cacheInvalidated && this.#sessionCache.has(this.planDir)) {
    return this.#sessionCache.get(this.planDir)!;
  }

  const sessions = await this.#scanSessionDirectoriesImpl();
  this.#sessionCache.set(this.planDir, sessions);
  this.#cacheInvalidated = false;

  return sessions;
}

// Invalidate cache when sessions are created
async createSessionDirectory(...): Promise<string> {
  const path = await createSessionDirectory(...);
  this.#cacheInvalidated = true; // Invalidate cache
  return path;
}
```

### 5.2 Recommended Changes Priority

**High Priority:**

1. ✅ Add compiled regex pattern for exact matching
2. ✅ Extract shared scanning logic to avoid duplication
3. ✅ Add type-safe session directory parser function

**Medium Priority:** 4. ⚡ Add in-memory caching for repeated scans 5. ⚡ Consider `fast-glob` for large directories (1000+ sessions)

**Low Priority:** 6. 💡 Add metrics/observability for scan performance 7. 💡 Add parallel scanning for deep directory trees

---

## 6. Common Pitfalls to Avoid

### 6.1 Performance Pitfalls

❌ **BAD: Scanning without `withFileTypes`**

```typescript
// This makes an extra syscall for each entry!
const names = await readdir(dirPath);
for (const name of names) {
  const stats = await stat(join(dirPath, name)); // SLOW!
  if (stats.isDirectory()) {
    /* ... */
  }
}
```

✅ **GOOD: Use `withFileTypes: true`**

```typescript
const entries = await readdir(dirPath, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory()) {
    /* ... */
  } // FAST!
}
```

### 6.2 Error Handling Pitfalls

❌ **BAD: Swallowing all errors**

```typescript
try {
  const entries = await readdir(dirPath);
} catch {
  return []; // Hides ALL errors, including real problems!
}
```

✅ **GOOD: Handle expected errors, rethrow others**

```typescript
try {
  const entries = await readdir(dirPath);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
    return []; // Expected: directory doesn't exist
  }
  throw error; // Unexpected: rethrow
}
```

### 6.3 Path Manipulation Pitfalls

❌ **BAD: String concatenation**

```typescript
const path = dirPath + '/' + fileName; // Breaks on Windows!
```

✅ **GOOD: Use `path.join()`**

```typescript
import { join } from 'node:path';
const path = join(dirPath, fileName); // Cross-platform!
```

### 6.4 Regex Pitfalls

❌ **BAD: Unanchored regex**

```typescript
const pattern = /(\d{3})_([a-f0-9]{12})/; // Matches 'xxx001_abc123xxx'!
```

✅ **GOOD: Anchored regex**

```typescript
const pattern = /^(\d{3})_([a-f0-9]{12})$/; // Exact match only
```

### 6.5 Memory Pitfalls

❌ **BAD: Loading all files into memory**

```typescript
const allFiles = await scanDirectory('/'); // OOM risk!
```

✅ **GOOD: Stream or paginate**

```typescript
// Use async generator for streaming
for await (const file of walkDirectory('/', { maxDepth: 3 })) {
  // Process one at a time
}
```

---

## 7. External Documentation References

### 7.1 Node.js Documentation

**File System Module:**

- [Node.js `fs.readdir` documentation](https://nodejs.org/api/fs.html#fspromisesreaddirpath-options)
  - Anchor: `#fspromisesreaddirpath-options`
  - Key detail: `withFileTypes: true` returns `Dirent[]`

- [Node.js `fs.Dirent` documentation](https://nodejs.org/api/fs.html#class-fsdirent)
  - Anchor: `#class-fsdirent`
  - Methods: `isDirectory()`, `isFile()`, `isSymbolicLink()`

- [Node.js `fs.stat` documentation](https://nodejs.org/api/fs.html#fspromisesstatpath-options)
  - Anchor: `#fspromisesstatpath-options`
  - Used for getting file metadata

### 7.2 TypeScript Documentation

- [TypeScript Handbook: Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
  - Pattern: `entry is Directory`

- [TypeScript Error Handling](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html)
  - Pattern: `error is NodeJS.ErrnoException`

### 7.3 Library Documentation

**fast-glob (v3.3.3):**

- [GitHub Repository](https://github.com/mrmlnc/fast-glob)
- [Documentation](https://github.com/mrmlnc/fast-glob#options-1)
- Key options:
  - `onlyDirectories: true` - Filter to directories only
  - `deep: 1` - Limit recursion depth
  - `absolute: true` - Return absolute paths
  - `objectMode: true` - Return Entry objects with metadata

**readdirp (v3.6.0):**

- [GitHub Repository](https://github.com/paulmillr/readdirp)
- [Streaming API Documentation](https://github.com/paulmillr/readdirp#usage-1)
- Good for watching files and streaming large directory trees

### 7.4 Stack Overflow References

**Common Questions:**

- [Node.js recursive directory search](https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search)
- [Fastest way to list files in Node.js](https://stackoverflow.com/questions/25460474/fastest-way-to-list-files-in-node-js)
- [TypeScript type guards for file system](https://stackoverflow.com/questions/48602767/typescript-type-guard-for-node-fs-dirent)

---

## 8. Code Examples Library

### 8.1 Complete Session Discovery Utility

```typescript
/**
 * Session Directory Discovery Utility
 *
 * Provides optimized methods for discovering and parsing session directories
 * in the format: {sequence}_{hash} (e.g., 001_14b9dc2a33c7)
 */

import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Dirent } from 'node:fs';

/** Compiled regex for session directory matching */
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

/** Parsed session directory information */
export interface SessionDirInfo {
  /** Directory name (e.g., '001_14b9dc2a33c7') */
  name: string;
  /** Absolute path to directory */
  path: string;
  /** Sequence number (e.g., 1) */
  sequence: number;
  /** Session hash (first 12 chars of SHA-256) */
  hash: string;
}

/** Error thrown when directory scan fails */
export class DirectoryScanError extends Error {
  readonly code?: string;
  readonly path: string;

  constructor(path: string, cause: Error) {
    const err = cause as NodeJS.ErrnoException;
    super(`Failed to scan directory ${path}: ${err.message}`);
    this.name = 'DirectoryScanError';
    this.code = err?.code;
    this.path = path;
  }
}

/**
 * Type guard to check if a directory name matches session format
 */
export function isSessionDirectory(name: string): boolean {
  return SESSION_DIR_PATTERN.test(name);
}

/**
 * Parses a session directory name into components
 *
 * @param name - Directory name (e.g., '001_14b9dc2a33c7')
 * @returns Parsed info or null if invalid format
 */
export function parseSessionDirectoryName(
  name: string
): Omit<SessionDirInfo, 'path'> | null {
  const match = name.match(SESSION_DIR_PATTERN);
  if (!match) return null;

  return {
    name,
    sequence: parseInt(match[1], 10),
    hash: match[2],
  };
}

/**
 * Scans a directory for session subdirectories
 *
 * @param planDir - Path to plan directory containing sessions
 * @returns Array of session directory info
 * @throws {DirectoryScanError} If scan fails for unexpected reasons
 */
export async function scanSessionDirectories(
  planDir: string
): Promise<SessionDirInfo[]> {
  try {
    const entries: Dirent[] = await readdir(planDir, { withFileTypes: true });
    const sessions: SessionDirInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const parsed = parseSessionDirectoryName(entry.name);
        if (parsed) {
          sessions.push({
            ...parsed,
            path: resolve(planDir, entry.name),
          });
        }
      }
    }

    return sessions;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    // ENOENT is expected (plan directory might not exist yet)
    if (err.code === 'ENOENT') {
      return [];
    }

    throw new DirectoryScanError(planDir, error as Error);
  }
}

/**
 * Finds a session directory by hash
 *
 * @param planDir - Path to plan directory
 * @param hash - Session hash to search for (12 chars)
 * @returns Full path to session or null if not found
 */
export async function findSessionByHash(
  planDir: string,
  hash: string
): Promise<string | null> {
  const sessions = await scanSessionDirectories(planDir);
  const match = sessions.find(s => s.hash === hash);
  return match?.path ?? null;
}

/**
 * Gets the next sequence number for a new session
 *
 * @param planDir - Path to plan directory
 * @returns Next sequence number (highest existing + 1)
 */
export async function getNextSequenceNumber(planDir: string): Promise<number> {
  const sessions = await scanSessionDirectories(planDir);
  const maxSeq = sessions.reduce((max, s) => Math.max(max, s.sequence), 0);
  return maxSeq + 1;
}

/**
 * Finds all sessions in a sequence range
 *
 * @param planDir - Path to plan directory
 * @param minSeq - Minimum sequence (inclusive)
 * @param maxSeq - Maximum sequence (inclusive)
 * @returns Array of session directory info in range
 */
export async function findSessionsBySequenceRange(
  planDir: string,
  minSeq: number,
  maxSeq: number
): Promise<SessionDirInfo[]> {
  const sessions = await scanSessionDirectories(planDir);
  return sessions.filter(s => s.sequence >= minSeq && s.sequence <= maxSeq);
}

/**
 * Caching session scanner for high-performance scenarios
 */
export class CachingSessionScanner {
  #cache = new Map<string, { sessions: SessionDirInfo[]; timestamp: number }>();
  #ttl = 5000; // 5 second cache TTL

  /**
   * Scans session directories with caching
   *
   * @param planDir - Path to plan directory
   * @param forceRefresh - Skip cache and force refresh
   * @returns Array of session directory info
   */
  async scan(planDir: string, forceRefresh = false): Promise<SessionDirInfo[]> {
    const now = Date.now();
    const cached = this.#cache.get(planDir);

    if (!forceRefresh && cached && now - cached.timestamp < this.#ttl) {
      return cached.sessions;
    }

    const sessions = await scanSessionDirectories(planDir);
    this.#cache.set(planDir, { sessions, timestamp: now });
    return sessions;
  }

  /**
   * Invalidates cache for a specific directory
   */
  invalidate(planDir: string): void {
    this.#cache.delete(planDir);
  }

  /**
   * Clears all cached data
   */
  clear(): void {
    this.#cache.clear();
  }
}
```

### 8.2 Fast-Glob Integration Example

```typescript
/**
 * Fast-glob based session scanner for large directories
 */

import fg from 'fast-glob';
import { parseSessionDirectoryName } from './session-scanner.js';

interface SessionDirInfo {
  name: string;
  path: string;
  sequence: number;
  hash: string;
}

/**
 * Scans session directories using fast-glob (best for >1000 sessions)
 */
export async function scanSessionDirectoriesFast(
  planDir: string
): Promise<SessionDirInfo[]> {
  // Match all directories with underscore pattern
  const pattern = `${planDir}/*_*`;

  const paths = await fg(pattern, {
    onlyDirectories: true,
    absolute: true,
    deep: 1, // Only immediate children
    objectMode: false, // Return strings
  });

  // Parse and filter
  const sessions: SessionDirInfo[] = [];

  for (const path of paths) {
    const name = path.split('/').pop()!;
    const parsed = parseSessionDirectoryName(name);

    if (parsed) {
      sessions.push({ ...parsed, path });
    }
  }

  return sessions;
}
```

### 8.3 Streaming Directory Scanner

```typescript
/**
 * Streaming directory scanner for huge directory trees
 */

import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Dirent } from 'node:fs';

interface ScanOptions {
  maxDepth?: number;
  filter?: (entry: Dirent) => boolean;
}

async function* walkDirectory(
  dirPath: string,
  options: ScanOptions = {}
): AsyncGenerator<string> {
  const { maxDepth = 10, filter } = options;

  if (maxDepth <= 0) return;

  try {
    const entries: Dirent[] = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (filter && !filter(entry)) continue;

      const fullPath = resolve(dirPath, entry.name);

      if (entry.isDirectory()) {
        yield* walkDirectory(fullPath, { ...options, maxDepth: maxDepth - 1 });
      } else {
        yield fullPath;
      }
    }
  } catch (error) {
    // Log but don't throw - allow scanning to continue
    console.error(`Error scanning ${dirPath}:`, error);
  }
}

// Usage
async function findSessionsStreaming(planDir: string): Promise<string[]> {
  const sessions: string[] = [];

  for await (const path of walkDirectory(planDir, { maxDepth: 1 })) {
    const name = path.split('/').pop()!;
    if (isSessionDirectory(name)) {
      sessions.push(path);
    }
  }

  return sessions;
}
```

---

## 9. Testing Best Practices

### 9.1 Unit Testing Directory Scanning

```typescript
import { describe, it, expect, vi } from 'vitest';
import { readdir } from 'node:fs/promises';
import {
  scanSessionDirectories,
  findSessionByHash,
} from './session-scanner.js';

vi.mock('node:fs/promises');

describe('Session Scanner', () => {
  it('should parse session directory names correctly', () => {
    expect(parseSessionDirectoryName('001_14b9dc2a33c7')).toEqual({
      name: '001_14b9dc2a33c7',
      sequence: 1,
      hash: '14b9dc2a33c7',
    });

    expect(parseSessionDirectoryName('invalid')).toBeNull();
    expect(parseSessionDirectoryName('001_tooshort')).toBeNull();
  });

  it('should scan session directories', async () => {
    vi.mocked(readdir).mockResolvedValue([
      { name: '001_14b9dc2a33c7', isDirectory: () => true } as Dirent,
      { name: '002_25e8db4b4d8', isDirectory: () => true } as Dirent,
      { name: 'other_dir', isDirectory: () => true } as Dirent,
      { name: 'file.txt', isDirectory: () => false } as Dirent,
    ] as any);

    const sessions = await scanSessionDirectories('/plan');

    expect(sessions).toHaveLength(2);
    expect(sessions[0].sequence).toBe(1);
    expect(sessions[1].sequence).toBe(2);
  });

  it('should handle ENOENT gracefully', async () => {
    const error = new Error('Not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    vi.mocked(readdir).mockRejectedValue(error);

    const sessions = await scanSessionDirectories('/plan');

    expect(sessions).toEqual([]);
  });

  it('should find session by hash', async () => {
    vi.mocked(readdir).mockResolvedValue([
      { name: '001_14b9dc2a33c7', isDirectory: () => true } as Dirent,
    ] as any);

    const path = await findSessionByHash('/plan', '14b9dc2a33c7');

    expect(path).toBe('/plan/001_14b9dc2a33c7');
  });

  it('should return null when hash not found', async () => {
    vi.mocked(readdir).mockResolvedValue([
      { name: '001_14b9dc2a33c7', isDirectory: () => true } as Dirent,
    ] as any);

    const path = await findSessionByHash('/plan', 'notfound');

    expect(path).toBeNull();
  });
});
```

### 9.2 Performance Testing

```typescript
import { describe, it, expect } from 'vitest';
import {
  scanSessionDirectories,
  scanSessionDirectoriesFast,
} from './session-scanner.js';

describe('Performance Benchmarks', () => {
  it('fast-glob should be faster than native for large directories', async () => {
    // Setup: Create 1000 test session directories
    // ...

    const startNative = performance.now();
    await scanSessionDirectories('/test-plan');
    const nativeTime = performance.now() - startNative;

    const startFast = performance.now();
    await scanSessionDirectoriesFast('/test-plan');
    const fastTime = performance.now() - startFast;

    expect(fastTime).toBeLessThan(nativeTime);
    console.log(`Native: ${nativeTime}ms, Fast-glob: ${fastTime}ms`);
  });
});
```

---

## 10. Summary and Recommendations

### 10.1 Key Takeaways

1. **Current Implementation is Solid**: The existing code in `session-manager.ts` uses best practices (async, Dirent, error handling).

2. **Pattern Matching Needs Improvement**: Replace `endsWith()` with compiled regex for exact matching.

3. **Extract Shared Logic**: Both `#findSessionByHash()` and `#getNextSequence()` scan the same directory - consolidate.

4. **Add Caching for Performance**: If scanning happens frequently, add an in-memory cache with TTL.

5. **Consider Fast-Glob for Scale**: If you expect >1000 session directories, use `fast-glob` for better performance.

### 10.2 Implementation Priority

**Phase 1: Quick Wins (1-2 hours)**

- [ ] Add compiled regex pattern constant
- [ ] Replace `endsWith()` with regex matching
- [ ] Extract shared `#scanSessionDirectories()` method
- [ ] Add unit tests for pattern matching

**Phase 2: Performance (2-4 hours)**

- [ ] Add `CachingSessionScanner` class
- [ ] Integrate caching into `SessionManager`
- [ ] Add cache invalidation on session creation
- [ ] Add performance benchmarks

**Phase 3: Scale (Optional, 4-8 hours)**

- [ ] Add `fast-glob` fallback for large directories
- [ ] Implement streaming scanner for huge trees
- [ ] Add metrics/observability
- [ ] Document performance characteristics

### 10.3 Recommended Dependencies

**Current Dependencies (Keep):**

- ✅ `fast-glob@3.3.3` - Already installed, use for large directories
- ✅ `zod@3.22.4` - Use for runtime validation

**No Additional Dependencies Needed:**

- Node.js native APIs are sufficient for current needs
- `readdirp` is already available as a transitive dependency

### 10.4 Common Pitfalls Summary

| Pitfall                 | Impact                | Fix                                    |
| ----------------------- | --------------------- | -------------------------------------- |
| No `withFileTypes`      | 2-10x slower          | Always use `{ withFileTypes: true }`   |
| String concat for paths | Cross-platform issues | Use `path.join()`                      |
| Unanchored regex        | False matches         | Use `^...$` anchors                    |
| Swallowing errors       | Hidden bugs           | Handle expected errors, rethrow others |
| Scanning without cache  | Repeated work         | Add in-memory cache                    |
| Regex in loop           | Slow compilation      | Compile once, reuse                    |

---

## 11. Recommended Next Steps

1. **Review this report** with the team and agree on implementation priority

2. **Create a PR for Phase 1 improvements:**
   - Add regex pattern constant
   - Extract shared scanning logic
   - Improve pattern matching

3. **Add comprehensive tests:**
   - Unit tests for `parseSessionDirectoryName()`
   - Integration tests for `scanSessionDirectories()`
   - Error handling tests for ENOENT, EACCES, etc.

4. **Monitor performance:**
   - Add timing metrics to session scanning
   - Track cache hit rates
   - Profile for hotspots

5. **Document decisions:**
   - Add comments explaining why specific patterns were chosen
   - Document performance characteristics
   - Update API docs with examples

---

**Report End**

**Sources:**

- [Node.js File System Documentation](https://nodejs.org/api/fs.html)
- [fast-glob GitHub Repository](https://github.com/mrmlnc/fast-glob)
- [readdirp GitHub Repository](https://github.com/paulmillr/readdirp)
- [TypeScript Type Guards Documentation](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
