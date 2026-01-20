# Node.js fs/promises.readdir with withFileTypes Research

**Generated:** 2026-01-15
**Task:** P2.M1.T2.S3 - Research Node.js fs/promises.readdir patterns and session directory naming for testing
**Focus:** Directory scanning, filtering, temp directory testing, and session naming patterns

---

## Executive Summary

This research document investigates Node.js `fs/promises.readdir` with the `withFileTypes: true` option, directory vs file filtering patterns, temporary directory testing best practices with `mkdtempSync`, session directory naming validation using regex, and sorting patterns for directory listings.

**Key Findings:**
- `fs/promises.readdir` with `withFileTypes: true` returns `Dirent[]` objects with built-in type checking
- Current implementation in `/home/dustin/projects/hacky-hack/src/core/session-manager.ts` uses best practices
- Session directories follow `{sequence}_{hash}` format (e.g., `001_14b9dc2a33c7`)
- `mkdtempSync` is ideal for temp directory testing with automatic cleanup
- Sorting by sequence number requires parsing the directory name pattern

---

## 1. fs/promises.readdir with withFileTypes

### 1.1 Basic Usage and Return Values

**API Signature:**
```typescript
import { readdir } from 'node:fs/promises';

async function readdir(
  path: string,
  options?: {
    encoding?: BufferEncoding;
    withFileTypes?: boolean;
    recursive?: boolean;
  }
): Promise<string[] | Dirent[]>
```

**When `withFileTypes: true` is set:**
- Returns `Promise<Dirent[]>` instead of `Promise<string[]>`
- Each `Dirent` object contains metadata about the file system entry
- Avoids additional `fs.stat()` calls for type checking

**Example:**
```typescript
import { readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';

// Returns array of Dirent objects
const entries: Dirent[] = await readdir('./plan', { withFileTypes: true });

for (const entry of entries) {
  console.log(entry.name);              // Directory/file name
  console.log(entry.isDirectory());     // true if directory
  console.log(entry.isFile());          // true if regular file
  console.log(entry.isSymbolicLink()); // true if symlink
}
```

### 1.2 Dirent Object Structure

**Source:** Node.js v20.x+ Documentation
**URL:** https://nodejs.org/api/fs.html#class-fsdirent

**Available Methods:**
```typescript
class Dirent {
  readonly name: string;
  isDirectory(): boolean;
  isFile(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
}
```

**Performance Benefits:**
- **Single syscall** for both name and type information
- **No additional `fs.stat()` calls** needed (2-10x faster)
- **Type-safe** with TypeScript

---

## 2. Filtering Directories vs Files

### 2.1 Filtering with Dirent (Recommended)

**Pattern from current implementation:**
```typescript
// Source: /home/dustin/projects/hacky-hack/src/core/session-manager.ts:776-791
import { readdir } from 'node:fs/promises';

async function scanSessionDirectories(planDir: string): Promise<string[]> {
  try {
    const entries = await readdir(planDir, { withFileTypes: true });
    const sessions: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Process directory
        sessions.push(entry.name);
      }
      // Files are automatically skipped
    }

    return sessions;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return []; // Plan directory doesn't exist yet
    }
    throw error;
  }
}
```

### 2.2 Filtering with Array Methods

**Filter directories only:**
```typescript
const entries = await readdir(planDir, { withFileTypes: true });

const directories = entries
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

// Returns: ['001_14b9dc2a33c7', '002_25e8db4b4d8']
```

**Filter files only:**
```typescript
const files = entries
  .filter(entry => entry.isFile())
  .map(entry => entry.name);

// Returns: ['tasks.json', 'prd_snapshot.md']
```

**Separate directories and files:**
```typescript
const directories: string[] = [];
const files: string[] = [];

for (const entry of entries) {
  if (entry.isDirectory()) {
    directories.push(entry.name);
  } else if (entry.isFile()) {
    files.push(entry.name);
  }
}
```

### 2.3 Type Guard Functions

**Best practice for type-safe filtering:**
```typescript
import type { Dirent } from 'node:fs';

function isDirectory(entry: Dirent): entry is Dirent & { isDirectory(): true } {
  return entry.isDirectory();
}

function isFile(entry: Dirent): entry is Dirent & { isFile(): true } {
  return entry.isFile();
}

// Usage
const entries = await readdir(planDir, { withFileTypes: true });
const directories = entries.filter(isDirectory);
const files = entries.filter(isFile);
```

---

## 3. Temporary Directory Testing with mkdtempSync

### 3.1 Basic mkdtempSync Usage

**API Signature:**
```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Create temp directory with unique suffix
const tempDir = mkdtempSync(join(tmpdir(), 'test-'));
// Returns: '/tmp/test-abc123'

// Cleanup when done
rmSync(tempDir, { recursive: true, force: true });
```

### 3.2 Testing Pattern with Setup/Teardown

**Vitest Example:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

describe('Session Directory Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-test-'));
  });

  afterEach(() => {
    // Cleanup temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should scan session directories', async () => {
    // Setup: Create test session directories
    const session1 = join(tempDir, '001_abc123def456');
    const session2 = join(tempDir, '002_def789ghi012');

    // Create directories
    await fs.mkdir(session1, { recursive: true });
    await fs.mkdir(session2, { recursive: true });

    // Test: Scan directories
    const entries = await readdir(tempDir, { withFileTypes: true });
    const sessions = entries.filter(e => e.isDirectory());

    expect(sessions).toHaveLength(2);
    expect(sessions.map(e => e.name)).toContain('001_abc123def456');
    expect(sessions.map(e => e.name)).toContain('002_def789ghi012');
  });
});
```

### 3.3 Temp Directory Naming Patterns

**Common patterns:**
```typescript
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Pattern 1: Prefix with random suffix
const temp1 = mkdtempSync(join(tmpdir(), 'test-'));
// Example: /tmp/test-abc123

// Pattern 2: Project-specific prefix
const temp2 = mkdtempSync(join(tmpdir(), 'prp-pipeline-'));
// Example: /tmp/prp-pipeline-xyz789

// Pattern 3: Test-specific prefix
const temp3 = mkdtempSync(join(tmpdir(), 'session-manager-test-'));
// Example: /tmp/session-manager-test-def456
```

**Best practices:**
1. **Use descriptive prefixes** for easier debugging
2. **Always cleanup** in `afterEach()` or `afterAll()`
3. **Use `recursive: true, force: true`** for `rmSync()` to handle non-empty directories
4. **Check existence** before cleanup to avoid errors

---

## 4. Session Directory Naming Pattern Validation

### 4.1 Current Implementation Pattern

**Source:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts:53-63`

**Pattern Definition:**
```typescript
/**
 * Compiled regex for session directory matching
 *
 * Matches directory names in the format {sequence}_{hash} where:
 * - sequence: 3-digit zero-padded number (e.g., 001, 002)
 * - hash: 12-character lowercase hexadecimal string (first 12 chars of SHA-256)
 *
 * Example matches: "001_14b9dc2a33c7", "999_abcdef123456"
 * Example non-matches: "1_abc", "001_abcdef", "001_14b9dc2a33c7_extra"
 */
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;
```

### 4.2 Regex Pattern Breakdown

**Components:**
```typescript
/^(\d{3})_([a-f0-9]{12})$/
 │ │    │  │         │
 │ │    │  │         └─ End anchor (exact match)
 │ │    │  └─────────── 12 hex characters (hash)
 │ │    └────────────── Separator
 │ └────────────────── 3 digits (sequence)
 └───────────────────── Start anchor (exact match)
```

**Pattern Explanation:**
- `^` - Start of string anchor (prevents partial matches)
- `(\d{3})` - Capture group 1: Exactly 3 digits (0-9)
- `_` - Literal underscore separator
- `([a-f0-9]{12})` - Capture group 2: Exactly 12 lowercase hex characters
- `$` - End of string anchor (prevents trailing characters)

### 4.3 Validation Functions

**Type guard for session directory:**
```typescript
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

/**
 * Type guard to check if directory name matches session format
 */
function isSessionDirectory(name: string): boolean {
  return SESSION_DIR_PATTERN.test(name);
}

// Usage
isSessionDirectory('001_14b9dc2a33c7'); // true
isSessionDirectory('002_25e8db4b4d8');  // true
isSessionDirectory('1_abc');            // false
isSessionDirectory('001_abcdef');       // false (hash too short)
isSessionDirectory('001_14b9dc2a33c7_extra'); // false (extra characters)
```

**Parser for session directory components:**
```typescript
interface SessionDirInfo {
  name: string;
  sequence: number;
  hash: string;
}

function parseSessionDirectoryName(name: string): SessionDirInfo | null {
  const match = name.match(SESSION_DIR_PATTERN);
  if (!match) return null;

  return {
    name,
    sequence: parseInt(match[1], 10),
    hash: match[2],
  };
}

// Usage
parseSessionDirectoryName('001_14b9dc2a33c7');
// Returns: { name: '001_14b9dc2a33c7', sequence: 1, hash: '14b9dc2a33c7' }

parseSessionDirectoryName('invalid');
// Returns: null
```

### 4.4 Integration with Directory Scanning

**Complete scanning and validation:**
```typescript
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

async function scanSessionDirectories(planDir: string) {
  try {
    const entries = await readdir(planDir, { withFileTypes: true });
    const sessions: Array<{
      name: string;
      path: string;
      sequence: number;
      hash: string;
    }> = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(SESSION_DIR_PATTERN);
        if (match) {
          sessions.push({
            name: entry.name,
            path: resolve(planDir, entry.name),
            sequence: parseInt(match[1], 10),
            hash: match[2],
          });
        }
      }
    }

    return sessions;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return []; // Plan directory doesn't exist yet
    }
    throw error;
  }
}
```

---

## 5. Directory Listing Sorting by Sequence Number

### 5.1 Sorting Parsed Session Directories

**After parsing, sort by sequence:**
```typescript
const sessions = await scanSessionDirectories(planDir);

// Sort by sequence number ascending
sessions.sort((a, b) => a.sequence - b.sequence);

// Result:
// [
//   { name: '001_14b9dc2a33c7', sequence: 1, hash: '14b9dc2a33c7' },
//   { name: '002_25e8db4b4d8', sequence: 2, hash: '25e8db4b4d8' },
//   { name: '003_36f9ec5c5e9', sequence: 3, hash: '36f9ec5c5e9' }
// ]
```

### 5.2 Sorting Directory Names Directly

**When you only have directory names:**
```typescript
const entries = await readdir(planDir, { withFileTypes: true });
const sessionNames = entries
  .filter(e => e.isDirectory())
  .filter(e => SESSION_DIR_PATTERN.test(e.name))
  .map(e => e.name);

// Sort by sequence number (first 3 digits)
sessionNames.sort((a, b) => {
  const seqA = parseInt(a.split('_')[0], 10);
  const seqB = parseInt(b.split('_')[0], 10);
  return seqA - seqB;
});

// Result: ['001_...', '002_...', '003_...']
```

### 5.3 Sorting with LocaleCompare

**Alternative for string-based sorting:**
```typescript
sessionNames.sort((a, b) => a.localeCompare(b));

// Works because sequence is zero-padded (001, 002, etc.)
// Result: ['001_...', '002_...', '003_...', '010_...', '100_...']
```

**Why this works:**
- Zero-padded sequences sort correctly as strings
- `'001' < '002' < '010' < '100'` (correct order)
- Without padding: `'1' < '10' < '2'` (incorrect order)

### 5.4 Descending Order Sorting

**Sort from highest to lowest:**
```typescript
// Method 1: Reverse comparison
sessions.sort((a, b) => b.sequence - a.sequence);

// Method 2: Sort ascending then reverse
sessions.sort((a, b) => a.sequence - b.sequence);
sessions.reverse();
```

### 5.5 Finding Latest Session

**Current implementation from session-manager.ts:**
```typescript
// Source: /home/dustin/projects/hacky-hack/src/core/session-manager.ts:883-888

async #getNextSequence(): Promise<number> {
  const sessions = await SessionManager.__scanSessionDirectories(this.planDir);
  const maxSeq = sessions.reduce(
    (max: number, s: SessionDirInfo) => Math.max(max, s.sequence),
    0
  );
  return maxSeq + 1;
}
```

**Alternative using sort:**
```typescript
async function getLatestSession(sessions: SessionDirInfo[]): SessionDirInfo | null {
  if (sessions.length === 0) return null;

  // Sort by sequence descending
  sessions.sort((a, b) => b.sequence - a.sequence);
  return sessions[0];
}
```

---

## 6. Testing Patterns and Examples

### 6.1 Testing Directory Scanning

**Complete test example:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

describe('Session Directory Scanning', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'session-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should scan and filter session directories', async () => {
    // Setup: Create test directories
    mkdirSync(join(tempDir, '001_abc123def456'));
    mkdirSync(join(tempDir, '002_def789ghi012'));
    mkdirSync(join(tempDir, 'other_dir')); // Invalid format
    mkdirSync(join(tempDir, '003_ghi012jkl345'));

    // Test: Scan directories
    const entries = await readdir(tempDir, { withFileTypes: true });
    const sessions: Array<{name: string; sequence: number; hash: string}> = [];

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

    // Assert
    expect(sessions).toHaveLength(3);
    expect(sessions.map(s => s.name)).toEqual([
      '001_abc123def456',
      '002_def789ghi012',
      '003_ghi012jkl345'
    ]);
    expect(sessions.map(s => s.sequence)).toEqual([1, 2, 3]);
  });

  it('should sort sessions by sequence number', async () => {
    // Setup: Create directories in random order
    mkdirSync(join(tempDir, '003_ghi012jkl345'));
    mkdirSync(join(tempDir, '001_abc123def456'));
    mkdirSync(join(tempDir, '002_def789ghi012'));

    // Test: Scan and sort
    const entries = await readdir(tempDir, { withFileTypes: true });
    const sessions: Array<{name: string; sequence: number}> = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(SESSION_DIR_PATTERN);
        if (match) {
          sessions.push({
            name: entry.name,
            sequence: parseInt(match[1], 10),
          });
        }
      }
    }

    sessions.sort((a, b) => a.sequence - b.sequence);

    // Assert: Should be in sequence order
    expect(sessions[0].sequence).toBe(1);
    expect(sessions[1].sequence).toBe(2);
    expect(sessions[2].sequence).toBe(3);
  });

  it('should handle empty directory gracefully', async () => {
    const entries = await readdir(tempDir, { withFileTypes: true });
    expect(entries).toHaveLength(0);
  });

  it('should ignore files when filtering directories', async () => {
    // Setup: Create both directories and files
    mkdirSync(join(tempDir, '001_abc123def456'));
    mkdirSync(join(tempDir, '002_def789ghi012'));

    // Create files using Write tool or fs.writeFileSync
    const { writeFileSync } = require('node:fs');
    writeFileSync(join(tempDir, 'file1.txt'), 'content');
    writeFileSync(join(tempDir, 'file2.md'), '# Content');

    // Test: Scan and filter
    const entries = await readdir(tempDir, { withFileTypes: true });
    const directories = entries.filter(e => e.isDirectory());

    // Assert: Only directories returned
    expect(directories).toHaveLength(2);
    expect(directories.every(d => d.name.startsWith('00'))).toBe(true);
  });
});
```

### 6.2 Testing Pattern Validation

```typescript
describe('Session Directory Pattern Validation', () => {
  const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

  describe('isSessionDirectory', () => {
    it('should accept valid session directory names', () => {
      expect(SESSION_DIR_PATTERN.test('001_abc123def456')).toBe(true);
      expect(SESSION_DIR_PATTERN.test('999_ffffffffffff')).toBe(true);
      expect(SESSION_DIR_PATTERN.test('000_000000000000')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(SESSION_DIR_PATTERN.test('1_abc')).toBe(false);
      expect(SESSION_DIR_PATTERN.test('001_abcdef')).toBe(false); // Too short
      expect(SESSION_DIR_PATTERN.test('001_ABC123DEF456')).toBe(false); // Uppercase
      expect(SESSION_DIR_PATTERN.test('001_14b9dc2a33c7_extra')).toBe(false); // Extra
      expect(SESSION_DIR_PATTERN.test('other_dir')).toBe(false);
    });
  });

  describe('parseSessionDirectoryName', () => {
    function parse(name: string) {
      const match = name.match(SESSION_DIR_PATTERN);
      if (!match) return null;
      return {
        name,
        sequence: parseInt(match[1], 10),
        hash: match[2],
      };
    }

    it('should parse valid session directory names', () => {
      const result = parse('001_abc123def456');
      expect(result).toEqual({
        name: '001_abc123def456',
        sequence: 1,
        hash: 'abc123def456',
      });
    });

    it('should return null for invalid names', () => {
      expect(parse('invalid')).toBeNull();
      expect(parse('001_tooshort')).toBeNull();
    });

    it('should correctly parse sequence number', () => {
      expect(parse('001_abc123def456')?.sequence).toBe(1);
      expect(parse('010_abc123def456')?.sequence).toBe(10);
      expect(parse('100_abc123def456')?.sequence).toBe(100);
    });
  });
});
```

### 6.3 Testing with Mixed Content

```typescript
describe('Session Directory Scanning with Mixed Content', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'mixed-test-'));

    // Create mixed content
    const { mkdirSync, writeFileSync } = require('node:fs');
    const { join } = require('node:path');

    // Valid session directories
    mkdirSync(join(tempDir, '001_abc123def456'));
    mkdirSync(join(tempDir, '002_def789ghi012'));

    // Invalid directories
    mkdirSync(join(tempDir, 'other_dir'));
    mkdirSync(join(tempDir, 'temp_folder'));

    // Files
    writeFileSync(join(tempDir, 'README.md'), '# Test');
    writeFileSync(join(tempDir, 'data.json'), '{}');

    // Symlinks (if supported)
    try {
      mkdirSync(join(tempDir, '003_ghi012jkl345'));
      // Could add symlink test here
    } catch {
      // Skip symlink test if not supported
    }
  });

  afterEach(() => {
    const { rmSync } = require('node:fs');
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should only identify valid session directories', async () => {
    const entries = await readdir(tempDir, { withFileTypes: true });
    const validSessions: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && SESSION_DIR_PATTERN.test(entry.name)) {
        validSessions.push(entry.name);
      }
    }

    expect(validSessions).toHaveLength(2);
    expect(validSessions).toContain('001_abc123def456');
    expect(validSessions).toContain('002_def789ghi012');
    expect(validSessions).not.toContain('other_dir');
    expect(validSessions).not.toContain('README.md');
  });
});
```

---

## 7. Best Practices Summary

### 7.1 fs/promises.readdir Best Practices

1. **Always use `withFileTypes: true`** for directory scanning
   - Avoids additional `fs.stat()` calls
   - Provides type information directly
   - 2-10x performance improvement

2. **Use async/await** for directory operations
   - Non-blocking I/O
   - Better for server applications
   - Use `readdirSync` only in CLI scripts

3. **Handle ENOENT gracefully**
   - Directory might not exist yet
   - Return empty array instead of throwing
   - Log for debugging if needed

### 7.2 Directory Filtering Best Practices

1. **Filter with `Dirent` methods**
   - `entry.isDirectory()` for directories
   - `entry.isFile()` for files
   - `entry.isSymbolicLink()` for symlinks

2. **Use compiled regex for pattern matching**
   - Compile once, use many times
   - Use anchors (`^...$`) for exact matching
   - Extract data with capture groups

3. **Type-safe filtering with TypeScript**
   - Use type guards for predicates
   - Leverage `Dirent` type information
   - Avoid `as` casts when possible

### 7.3 Temp Directory Testing Best Practices

1. **Use `mkdtempSync` for unique temp directories**
   - Automatic unique naming
   - Isolated test environments
   - No cleanup conflicts

2. **Always cleanup in `afterEach`**
   - Use `rmSync` with `recursive: true, force: true`
   - Check existence before cleanup
   - Handle cleanup errors gracefully

3. **Use descriptive prefixes**
   - `test-` for general tests
   - `session-test-` for session tests
   - `integration-test-` for integration tests

### 7.4 Session Directory Naming Best Practices

1. **Use consistent pattern: `{sequence}_{hash}`**
   - Sequence: Zero-padded 3 digits
   - Hash: 12 lowercase hex characters
   - Separator: Underscore

2. **Validate with compiled regex**
   - Exact pattern matching
   - Prevent false positives
   - Extract components efficiently

3. **Sort by parsed sequence number**
   - Parse sequence to integer
   - Sort numerically, not lexicographically
   - Use `reduce` for max/min operations

---

## 8. Code Examples Repository

### 8.1 Complete Session Scanner Utility

```typescript
/**
 * Session Directory Scanner Utility
 *
 * Provides methods for scanning, filtering, and validating
 * session directories in the {sequence}_{hash} format.
 */

import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Dirent } from 'node:fs';

/** Session directory pattern: {sequence}_{hash} */
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

/** Parsed session directory information */
export interface SessionDirInfo {
  name: string;
  path: string;
  sequence: number;
  hash: string;
}

/**
 * Scans plan directory for session subdirectories
 *
 * @param planDir - Path to plan directory
 * @returns Array of session directory info
 */
export async function scanSessionDirectories(
  planDir: string
): Promise<SessionDirInfo[]> {
  try {
    const entries = await readdir(planDir, { withFileTypes: true });
    const sessions: SessionDirInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(SESSION_DIR_PATTERN);
        if (match) {
          sessions.push({
            name: entry.name,
            path: resolve(planDir, entry.name),
            sequence: parseInt(match[1], 10),
            hash: match[2],
          });
        }
      }
    }

    return sessions;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return []; // Directory doesn't exist yet
    }
    throw error;
  }
}

/**
 * Sorts sessions by sequence number ascending
 */
export function sortSessionsBySequence(sessions: SessionDirInfo[]): SessionDirInfo[] {
  return sessions.sort((a, b) => a.sequence - b.sequence);
}

/**
 * Finds session with highest sequence number
 */
export function findLatestSession(sessions: SessionDirInfo[]): SessionDirInfo | null {
  if (sessions.length === 0) return null;
  return sessions.reduce((latest, current) =>
    current.sequence > latest.sequence ? current : latest
  );
}

/**
 * Gets next sequence number
 */
export function getNextSequence(sessions: SessionDirInfo[]): number {
  const maxSeq = sessions.reduce((max, s) => Math.max(max, s.sequence), 0);
  return maxSeq + 1;
}
```

### 8.2 Test Helper Functions

```typescript
/**
 * Test Helper Functions for Session Directory Testing
 */

import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Creates a temporary directory for testing
 *
 * @returns Path to temporary directory
 */
export function createTempDir(prefix = 'test-'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * Cleans up temporary directory
 *
 * @param path - Path to directory to remove
 */
export function cleanupTempDir(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

/**
 * Creates a test session directory
 *
 * @param baseDir - Base directory path
 * @param sequence - Session sequence number
 * @param hash - Session hash (12 hex chars)
 * @returns Full path to created directory
 */
export function createTestSessionDir(
  baseDir: string,
  sequence: number,
  hash: string
): string {
  const name = `${String(sequence).padStart(3, '0')}_${hash}`;
  const path = join(baseDir, name);
  mkdirSync(path, { recursive: true });
  return path;
}

/**
 * Creates multiple test session directories
 *
 * @param baseDir - Base directory path
 * @param sessions - Array of {sequence, hash} pairs
 * @returns Array of created directory paths
 */
export function createTestSessions(
  baseDir: string,
  sessions: Array<{sequence: number; hash: string}>
): string[] {
  return sessions.map(({ sequence, hash }) =>
    createTestSessionDir(baseDir, sequence, hash)
  );
}

/**
 * Vitest setup/teardown helper
 */
export class TempDirectoryHelper {
  private tempDir?: string;

  setup(prefix = 'test-'): void {
    this.tempDir = createTempDir(prefix);
  }

  teardown(): void {
    if (this.tempDir) {
      cleanupTempDir(this.tempDir);
      this.tempDir = undefined;
    }
  }

  getPath(): string {
    if (!this.tempDir) {
      throw new Error('TempDirectoryHelper not initialized');
    }
    return this.tempDir;
  }
}
```

---

## 9. References and Resources

### 9.1 Node.js Documentation

- **fs.promises.readdir**: https://nodejs.org/api/fs.html#fspromisesreaddirpath-options
  - Documents `withFileTypes` option
  - Return type: `Promise<string[]>` or `Promise<Dirent[]>`

- **fs.Dirent class**: https://nodejs.org/api/fs.html#class-fsdirent
  - Methods: `isDirectory()`, `isFile()`, `isSymbolicLink()`
  - Performance benefits over `fs.stat()`

- **fs.mkdtempSync**: https://nodejs.org/api/fs.html#fsmkdtempsyncprefix-options
  - Creates unique temporary directory
  - Prefix-based naming

- **os.tmpdir**: https://nodejs.org/api/os.html#ostmpdir
  - Returns system temp directory path
  - Cross-platform

### 9.2 Existing Codebase References

- **SessionManager Implementation**: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
  - Lines 53-63: Session directory pattern definition
  - Lines 772-801: `__scanSessionDirectories()` method
  - Lines 883-888: Sorting and max sequence logic

- **Previous Research**: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/file-discovery-directory-scanning-best-practices.md`
  - Comprehensive directory scanning patterns
  - Performance benchmarks
  - Alternative approaches (fast-glob, readdirp)

### 9.3 External Resources

- **TypeScript Type Guards**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  - Pattern: `entry is Directory`
  - Type-safe filtering

- **Regular Expressions**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  - Pattern matching and capture groups
  - Anchors and quantifiers

---

## 10. Summary and Recommendations

### 10.1 Key Findings

1. **fs/promises.readdir with `withFileTypes: true`**
   - Returns `Dirent[]` with built-in type information
   - 2-10x faster than separate `fs.stat()` calls
   - Current implementation uses best practices

2. **Directory vs File Filtering**
   - Use `entry.isDirectory()` and `entry.isFile()` methods
   - Filter with `Array.filter()` and `map()`
   - Type guards improve type safety

3. **Temp Directory Testing**
   - `mkdtempSync()` creates unique temp directories
   - Always cleanup with `rmSync(recursive: true, force: true)`
   - Use descriptive prefixes for debugging

4. **Session Directory Pattern**
   - Format: `{sequence}_{hash}` (e.g., `001_14b9dc2a33c7`)
   - Regex: `/^(\d{3})_([a-f0-9]{12})$/`
   - Compile once, reuse for validation

5. **Sorting by Sequence Number**
   - Parse sequence to integer for numeric sorting
   - Use `reduce()` for max/min operations
   - Zero-padding ensures correct string sorting

### 10.2 Recommendations

1. **Current Implementation**: The existing `SessionManager` code follows best practices
   - Uses `withFileTypes: true` ✓
   - Handles `ENOENT` gracefully ✓
   - Uses compiled regex pattern ✓

2. **Testing Enhancements**:
   - Add temp directory test helpers
   - Create reusable session scanner utilities
   - Add tests for edge cases (empty dirs, mixed content)

3. **Performance Considerations**:
   - Current approach is optimal for < 1000 sessions
   - Consider `fast-glob` for larger directories
   - Add caching if scanning frequently

4. **Code Reusability**:
   - Extract session scanning to utility module
   - Create test helper library
   - Document patterns for team reference

---

**Document End**

**Version:** 1.0
**Last Updated:** 2026-01-15
**Status:** Complete
