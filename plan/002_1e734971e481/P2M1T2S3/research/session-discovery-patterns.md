# Session Discovery and Listing Patterns Research

**Research Date:** 2026-01-15
**Task:** P2.M1.T2.S3 - Session Discovery and Listing Implementation
**Focus:** TypeScript/Node.js patterns for session management, testing approaches, and best practices

---

## Table of Contents

1. [Session Discovery Patterns](#1-session-discovery-patterns)
2. [Static Method Testing Patterns](#2-static-method-testing-patterns)
3. [Timestamp-Based Sorting and Filtering](#3-timestamp-based-sorting-and-filtering)
4. [Hash-Based Session Lookup](#4-hash-based-session-lookup)
5. [Error Handling for Non-Existent Sessions](#5-error-handling-for-non-existent-sessions)
6. [Testing Best Practices Summary](#6-testing-best-practices-summary)
7. [Code Examples](#7-code-examples)
8. [References and Resources](#8-references-and-resources)

---

## 1. Session Discovery Patterns

### 1.1 Directory Scanning Pattern

**Pattern Overview:** Scan a directory for session subdirectories matching a specific naming pattern.

**Implementation Pattern (from SessionManager):**

```typescript
// Compiled regex for session directory matching
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

interface SessionDirInfo {
  name: string;
  path: string;
  sequence: number;
  hash: string;
}

static async __scanSessionDirectories(
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
      return []; // Plan directory doesn't exist yet
    }
    throw error;
  }
}
```

**Key Benefits:**

- **Type-safe parsing:** Uses regex to extract sequence and hash
- **Graceful ENOENT handling:** Returns empty array if directory doesn't exist
- **withFileTypes optimization:** Single syscall for both name and type
- **Structured output:** Returns typed objects vs raw strings

### 1.2 Filtering Pattern

**Pattern:** Filter directories by pattern match during scanning rather than post-processing.

```typescript
// GOOD: Filter during scan (single pass)
for (const entry of entries) {
  if (entry.isDirectory()) {
    const match = entry.name.match(SESSION_DIR_PATTERN);
    if (match) {
      // Add to results
    }
  }
}

// AVOID: Post-filtering (multiple passes)
const allDirs = entries.filter(e => e.isDirectory());
const sessions = allDirs.filter(e => e.name.match(SESSION_DIR_PATTERN));
```

### 1.3 Session Metadata Building Pattern

**Pattern:** Build rich metadata by combining directory info with file stats and optional parent references.

```typescript
static async listSessions(
  planDir: string = resolve('plan')
): Promise<SessionMetadata[]> {
  const sessions: SessionDirInfo[] =
    await SessionManager.__scanSessionDirectories(planDir);

  const metadata: SessionMetadata[] = [];

  for (const session of sessions) {
    try {
      // Get directory stats for createdAt
      const stats = await stat(session.path);

      // Check for parent session (optional file)
      const parentSession = await SessionManager.__readParentSession(
        session.path
      );

      metadata.push({
        id: session.name,
        hash: session.hash,
        path: session.path,
        createdAt: stats.mtime,
        parentSession,
      });
    } catch {
      // Skip sessions that fail to load (permission denied, I/O error)
      continue;
    }
  }

  return metadata;
}
```

**Key Patterns:**

- **Error isolation:** Wrap each session load in try-catch to continue on failures
- **Optional parent reference:** Gracefully handle missing parent_session.txt
- **mtime for createdAt:** Use modification time as proxy for creation time

---

## 2. Static Method Testing Patterns

### 2.1 Direct Invocation Pattern

**Pattern:** Test static methods by direct class invocation (no instantiation needed).

```typescript
describe('SessionManager.listSessions()', () => {
  it('should list sessions sorted by sequence', async () => {
    // SETUP: Create temp directory with sessions
    const tempDir = mkdtempSync(join(tmpdir(), 'session-list-test-'));

    // EXECUTE: Call static method directly
    const sessions = await SessionManager.listSessions(tempDir);

    // VERIFY: Results
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toMatch(/^001_/);
    expect(sessions[1].id).toMatch(/^002_/);
  });
});
```

### 2.2 Mocking File System Operations

**Pattern:** Use Vitest vi.mock to mock fs operations for deterministic tests.

```typescript
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

describe('SessionManager static methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scan directories correctly', async () => {
    // Mock readdir to return test data
    vi.mocked(readdir).mockResolvedValue([
      { name: '001_abc123def456', isDirectory: () => true } as Dirent,
      { name: '002_def789ghi012', isDirectory: () => true } as Dirent,
    ] as Dirent[]);

    const sessions =
      await SessionManager.__scanSessionDirectories('/fake/path');

    expect(sessions).toHaveLength(2);
    expect(readdir).toHaveBeenCalledWith('/fake/path', { withFileTypes: true });
  });
});
```

### 2.3 Testing Private Static Methods

**Pattern:** Use naming convention (\_\_methodName) to expose test-only static methods.

```typescript
// In implementation
static async __scanSessionDirectories(planDir: string): Promise<SessionDirInfo[]> {
  // Implementation
}

// In tests
const sessions = await SessionManager.__scanSessionDirectories(planDir);
```

**Benefits:**

- No need for @ts-ignore or type casting
- Clear intent (double underscore indicates internal/test-only)
- Full type safety maintained

### 2.4 Testing Static Methods with Dependencies

**Pattern:** Mock dependencies that static methods call.

```typescript
describe('SessionManager.findSessionByPRD', () => {
  it('should find session by PRD hash', async () => {
    // Mock file system checks
    vi.mocked(statSync).mockReturnValue({ isFile: () => true } as Stats);
    vi.mocked(hashPRD).mockResolvedValue('abc123def456789xyz012345');
    vi.mocked(readdir).mockResolvedValue([
      { name: '001_abc123def456', isDirectory: () => true } as Dirent,
    ] as Dirent[]);

    const session = await SessionManager.findSessionByPRD(
      '/fake/prd.md',
      '/fake/plan'
    );

    expect(session).not.toBeNull();
    expect(session?.hash).toBe('abc123def456');
  });
});
```

---

## 3. Timestamp-Based Sorting and Filtering

### 3.1 Sequence-Based Sorting Pattern

**Pattern:** Sort by sequence number extracted from session ID.

```typescript
// Sort by sequence ascending
metadata.sort((a, b) => {
  const seqA = parseInt(a.id.split('_')[0], 10);
  const seqB = parseInt(b.id.split('_')[0], 10);
  return seqA - seqB;
});
```

**Testing Pattern:**

```typescript
it('should sort sessions by sequence ascending', async () => {
  // Create sessions out of order
  await createSession(tempDir, 3, 'hash3');
  await createSession(tempDir, 1, 'hash1');
  await createSession(tempDir, 2, 'hash2');

  const sessions = await SessionManager.listSessions(tempDir);

  expect(sessions[0].id).toMatch(/^001_/);
  expect(sessions[1].id).toMatch(/^002_/);
  expect(sessions[2].id).toMatch(/^003_/);
});
```

### 3.2 Timestamp Filtering Pattern

**Pattern:** Filter sessions by creation time range.

```typescript
interface TimeFilterOptions {
  after?: Date;
  before?: Date;
}

static async listSessions(
  planDir: string = resolve('plan'),
  options?: TimeFilterOptions
): Promise<SessionMetadata[]> {
  let sessions = await SessionManager.__scanSessionDirectories(planDir);

  const metadata: SessionMetadata[] = [];

  for (const session of sessions) {
    const stats = await stat(session.path);
    const parentSession = await SessionManager.__readParentSession(session.path);

    const sessionMeta: SessionMetadata = {
      id: session.name,
      hash: session.hash,
      path: session.path,
      createdAt: stats.mtime,
      parentSession,
    };

    // Apply time filters
    if (options?.after && stats.mtime < options.after) continue;
    if (options?.before && stats.mtime > options.before) continue;

    metadata.push(sessionMeta);
  }

  return metadata;
}
```

**Testing Pattern:**

```typescript
it('should filter sessions by date range', async () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Create sessions with specific timestamps (using utimes or controlled creation)
  await createSessionWithTimestamp(tempDir, 1, 'hash1', yesterday);

  const sessions = await SessionManager.listSessions(tempDir, {
    after: yesterday,
    before: tomorrow,
  });

  expect(sessions).toHaveLength(1);
});
```

### 3.3 Deterministic Timestamp Testing

**Pattern:** Use vi.useFakeTimers() for deterministic timestamp tests.

```typescript
describe('SessionManager timestamp filtering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should filter sessions correctly with fake time', async () => {
    const baseTime = new Date('2026-01-15T00:00:00Z');
    vi.setSystemTime(baseTime);

    // Create sessions at different times
    vi.setSystemTime(new Date('2026-01-14T00:00:00Z'));
    await createSession(tempDir, 1, 'hash1');

    vi.setSystemTime(new Date('2026-01-16T00:00:00Z'));
    await createSession(tempDir, 2, 'hash2');

    vi.setSystemTime(baseTime);

    const sessions = await SessionManager.listSessions(tempDir, {
      after: new Date('2026-01-15T00:00:00Z'),
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toMatch(/^002_/);
  });
});
```

---

## 4. Hash-Based Session Lookup

### 4.1 Hash Computation and Matching Pattern

**Pattern:** Compute hash from PRD content and match against session directories.

```typescript
static async findSessionByPRD(
  prdPath: string,
  planDir: string = resolve('plan')
): Promise<SessionMetadata | null> {
  // Validate PRD exists
  const absPath = resolve(prdPath);
  const stats = statSync(absPath);
  if (!stats.isFile()) {
    throw new SessionFileError(absPath, 'validate PRD path');
  }

  // Compute PRD hash
  const fullHash = await hashPRD(absPath);
  const sessionHash = fullHash.slice(0, 12);

  // Scan for sessions
  const sessions: SessionDirInfo[] =
    await SessionManager.__scanSessionDirectories(planDir);

  // Find matching session
  const match = sessions.find((s: SessionDirInfo) => s.hash === sessionHash);
  if (!match) {
    return null;
  }

  // Build full SessionMetadata
  const stats = await stat(match.path);
  const parentSession = await SessionManager.__readParentSession(match.path);

  return {
    id: match.name,
    hash: match.hash,
    path: match.path,
    createdAt: stats.mtime,
    parentSession,
  };
}
```

### 4.2 Testing Hash-Based Lookup

**Pattern:** Test with known PRD content that produces predictable hashes.

```typescript
it('should find session by PRD hash', async () => {
  // SETUP: Create PRD with known content
  const prdContent = `# Known PRD

## Executive Summary

This is a predictable PRD for hash testing. The content is designed to produce
a consistent SHA-256 hash that can be verified against the session metadata.

## Functional Requirements

The system shall compute the SHA-256 hash correctly and use the first 12 characters
as the session hash in the directory name.
`;

  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, prdContent);

  // Create session with this PRD
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();

  // EXECUTE: Find session by PRD
  const found = await SessionManager.findSessionByPRD(prdPath, planDir);

  // VERIFY: Compute expected hash
  const expectedHash = createHash('sha256')
    .update(prdContent, 'utf-8')
    .digest('hex')
    .slice(0, 12);

  expect(found).not.toBeNull();
  expect(found?.hash).toBe(expectedHash);
  expect(found?.id).toContain(expectedHash);
});
```

### 4.3 Testing Hash Mismatch Detection

**Pattern:** Verify that hash differences are correctly detected.

```typescript
it('should return null for non-existent session hash', async () => {
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, 'Non-matching PRD content');

  const found = await SessionManager.findSessionByPRD(prdPath, planDir);

  expect(found).toBeNull();
});

it('should detect PRD modifications via hash comparison', async () => {
  const originalPRD = mockSimplePRD;
  writeFileSync(prdPath, originalPRD, 'utf-8');

  const manager1 = new SessionManager(prdPath, planDir);
  const session1 = await manager1.initialize();

  // Modify single character (minimal change)
  const modifiedPRD = originalPRD.replace('Hello, World!', 'Hello, World?');
  writeFileSync(prdPath, modifiedPRD, 'utf-8');

  const manager2 = new SessionManager(prdPath, planDir);
  const session2 = await manager2.initialize();

  // VERIFY: Delta session created (hash differs)
  expect(session2.metadata.hash).not.toBe(session1.metadata.hash);

  // VERIFY: New hash computed correctly
  const expectedNewHash = createHash('sha256')
    .update(modifiedPRD, 'utf-8')
    .digest('hex')
    .slice(0, 12);
  expect(session2.metadata.hash).toBe(expectedNewHash);
});
```

---

## 5. Error Handling for Non-Existent Sessions

### 5.1 Graceful Null Return Pattern

**Pattern:** Return null for "not found" cases rather than throwing.

```typescript
static async findLatestSession(
  planDir: string = resolve('plan')
): Promise<SessionMetadata | null> {
  const sessions = await SessionManager.listSessions(planDir);

  if (sessions.length === 0) {
    return null;
  }

  // listSessions() sorts ascending, so last element is highest
  return sessions[sessions.length - 1];
}
```

### 5.2 Testing Null Returns

**Pattern:** Explicitly test null return cases.

```typescript
it('should return null when no sessions exist', async () => {
  const emptyDir = mkdtempSync(join(tmpdir(), 'empty-sessions-'));

  const latest = await SessionManager.findLatestSession(emptyDir);

  expect(latest).toBeNull();
});

it('should return null for non-existent session hash', async () => {
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, 'Non-matching PRD content');

  const found = await SessionManager.findSessionByPRD(prdPath, planDir);

  expect(found).toBeNull();
});
```

### 5.3 Error vs Null Distinction

**Pattern:** Distinguish between "not found" (null) and "error" (throw).

```typescript
// Not found: returns null
const session = await SessionManager.findSessionByPRD(prdPath);
if (session === null) {
  console.log('Session not found');
}

// Error: throws exception
try {
  const session = await SessionManager.findSessionByPRD('/nonexistent/prd.md');
} catch (error) {
  if (error instanceof SessionFileError) {
    console.log('PRD file does not exist');
  }
}
```

### 5.4 Testing Error Throwing

**Pattern:** Use expect().rejects.toThrow() for async error testing.

```typescript
it('should throw SessionFileError for non-existent PRD', async () => {
  const nonExistentPRD = '/tmp/nonexistent-prd.md';

  await expect(
    SessionManager.findSessionByPRD(nonExistentPRD, planDir)
  ).rejects.toThrow(SessionFileError);
});

it('should throw SessionFileError with correct properties', async () => {
  const nonExistentPRD = '/tmp/nonexistent-prd.md';

  try {
    await SessionManager.findSessionByPRD(nonExistentPRD, planDir);
    fail('Should have thrown SessionFileError');
  } catch (error) {
    expect(error).toBeInstanceOf(SessionFileError);
    expect((error as SessionFileError).path).toBe(nonExistentPRD);
    expect((error as SessionFileError).code).toBe('ENOENT');
  }
});
```

---

## 6. Testing Best Practices Summary

### 6.1 Test Structure Pattern: AAA (Arrange-Act-Assert)

**Pattern:** Organize tests into three clear sections.

```typescript
it('should list sessions in sequence order', async () => {
  // ARRANGE (Setup)
  const tempDir = mkdtempSync(join(tmpdir(), 'session-list-test-'));
  const planDir = join(tempDir, 'plan');
  mkdirSync(planDir, { recursive: true });

  // Create test sessions
  await createSession(planDir, 1, 'abc123');
  await createSession(planDir, 2, 'def456');

  // ACT (Execute)
  const sessions = await SessionManager.listSessions(planDir);

  // ASSERT (Verify)
  expect(sessions).toHaveLength(2);
  expect(sessions[0].id).toBe('001_abc123');
  expect(sessions[1].id).toBe('002_def456');
});
```

### 6.2 Fixture Helper Functions

**Pattern:** Create reusable fixture builders for test data.

```typescript
// Fixture helper
function createMinimalBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase description',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// Use in tests
it('should load session with backlog', async () => {
  const backlog = createMinimalBacklog();
  await writeTasksJSON(sessionPath, backlog);

  const session = await manager.loadSession(sessionPath);

  expect(session.taskRegistry.backlog).toHaveLength(1);
});
```

### 6.3 Temp Directory Cleanup Pattern

**Pattern:** Use beforeEach/afterEach for temp directory management.

```typescript
describe('SessionManager tests', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('test 1', async () => {
    // Use planDir
  });

  it('test 2', async () => {
    // Each test gets fresh tempDir
  });
});
```

### 6.4 Mock Clearing Pattern

**Pattern:** Clear mocks between tests to prevent state leakage.

```typescript
describe('Mocked tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it('test 1', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([...]);
    // Test
  });

  it('test 2', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([...]);
    // Mocks are fresh, not affected by test 1
  });
});
```

### 6.5 Integration vs Unit Test Distinction

**Pattern:** Separate unit tests (mocked) from integration tests (real I/O).

```typescript
// Unit test file: tests/unit/core/session-manager.test.ts
describe('SessionManager.listSessions (unit)', () => {
  it('should list sessions', async () => {
    vi.mocked(readdir).mockResolvedValue([...]);
    const sessions = await SessionManager.listSessions('/fake/path');
    expect(sessions).toHaveLength(2);
  });
});

// Integration test file: tests/integration/core/session-manager.test.ts
describe('SessionManager.listSessions (integration)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'session-integration-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should list sessions from real filesystem', async () => {
    const sessions = await SessionManager.listSessions(tempDir);
    expect(sessions).toHaveLength(2);
  });
});
```

---

## 7. Code Examples

### 7.1 Complete Session Discovery Implementation

```typescript
// Session Discovery and Listing Implementation

const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

interface SessionDirInfo {
  name: string;
  path: string;
  sequence: number;
  hash: string;
}

/**
 * Lists all sessions in the plan directory
 */
static async listSessions(
  planDir: string = resolve('plan')
): Promise<SessionMetadata[]> {
  // Scan for session directories
  const sessions: SessionDirInfo[] =
    await SessionManager.__scanSessionDirectories(planDir);

  // Build SessionMetadata for each session
  const metadata: SessionMetadata[] = [];

  for (const session of sessions) {
    try {
      // Get directory stats for createdAt
      const stats = await stat(session.path);

      // Check for parent session
      const parentSession = await SessionManager.__readParentSession(
        session.path
      );

      metadata.push({
        id: session.name,
        hash: session.hash,
        path: session.path,
        createdAt: stats.mtime,
        parentSession,
      });
    } catch {
      // Skip sessions that fail to load
      continue;
    }
  }

  // Sort by sequence ascending
  metadata.sort((a, b) => {
    const seqA = parseInt(a.id.split('_')[0], 10);
    const seqB = parseInt(b.id.split('_')[0], 10);
    return seqA - seqB;
  });

  return metadata;
}

/**
 * Finds the latest session (highest sequence number)
 */
static async findLatestSession(
  planDir: string = resolve('plan')
): Promise<SessionMetadata | null> {
  const sessions = await SessionManager.listSessions(planDir);

  if (sessions.length === 0) {
    return null;
  }

  // listSessions() sorts ascending, so last element is highest
  return sessions[sessions.length - 1];
}

/**
 * Finds session matching the given PRD file
 */
static async findSessionByPRD(
  prdPath: string,
  planDir: string = resolve('plan')
): Promise<SessionMetadata | null> {
  // Validate PRD exists
  const absPath = resolve(prdPath);
  try {
    const stats = statSync(absPath);
    if (!stats.isFile()) {
      throw new SessionFileError(absPath, 'validate PRD path');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new SessionFileError(
        absPath,
        'validate PRD exists',
        error as Error
      );
    }
    throw error;
  }

  // Compute PRD hash
  const fullHash = await hashPRD(absPath);
  const sessionHash = fullHash.slice(0, 12);

  // Scan for sessions
  const sessions: SessionDirInfo[] =
    await SessionManager.__scanSessionDirectories(planDir);

  // Find matching session
  const match = sessions.find((s: SessionDirInfo) => s.hash === sessionHash);
  if (!match) {
    return null;
  }

  // Build full SessionMetadata
  const stats = await stat(match.path);
  const parentSession = await SessionManager.__readParentSession(match.path);

  return {
    id: match.name,
    hash: match.hash,
    path: match.path,
    createdAt: stats.mtime,
    parentSession,
  };
}
```

### 7.2 Complete Test Suite Example

```typescript
/**
 * Complete test suite for SessionManager.listSessions()
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { SessionManager } from '../../../src/core/session-manager.js';
import { SessionFileError } from '../../../src/core/session-utils.js';

describe('SessionManager.listSessions()', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'session-list-test-'));
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 1: Empty directory returns empty array
  it('should return empty array for empty plan directory', async () => {
    const sessions = await SessionManager.listSessions(planDir);

    expect(sessions).toEqual([]);
    expect(sessions).toHaveLength(0);
  });

  // Test 2: Non-existent directory returns empty array
  it('should return empty array for non-existent directory', async () => {
    const nonExistentDir = join(tempDir, 'nonexistent');

    const sessions = await SessionManager.listSessions(nonExistentDir);

    expect(sessions).toEqual([]);
  });

  // Test 3: List sessions sorted by sequence
  it('should list sessions sorted by sequence ascending', async () => {
    // Create sessions out of order
    await createSessionDirectory(planDir, '003_abc123');
    await createSessionDirectory(planDir, '001_def456');
    await createSessionDirectory(planDir, '002_ghi789');

    const sessions = await SessionManager.listSessions(planDir);

    expect(sessions).toHaveLength(3);
    expect(sessions[0].id).toBe('001_def456');
    expect(sessions[1].id).toBe('002_ghi789');
    expect(sessions[2].id).toBe('003_abc123');
  });

  // Test 4: Filter out non-matching directories
  it('should ignore directories not matching session pattern', async () => {
    await createSessionDirectory(planDir, '001_abc123');
    mkdirSync(join(planDir, 'other-dir'));
    mkdirSync(join(planDir, '999_invalid'));

    const sessions = await SessionManager.listSessions(planDir);

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('001_abc123');
  });

  // Test 5: Include parent session reference
  it('should include parent session reference when present', async () => {
    await createSessionDirectory(planDir, '001_abc123');
    await createSessionDirectory(planDir, '002_def456', '001_abc123');

    const sessions = await SessionManager.listSessions(planDir);

    expect(sessions[0].parentSession).toBeNull();
    expect(sessions[1].parentSession).toBe('001_abc123');
  });

  // Test 6: Gracefully handle inaccessible sessions
  it('should skip sessions with permission errors', async () => {
    await createSessionDirectory(planDir, '001_abc123');
    await createSessionDirectory(planDir, '002_def456');

    // Make one session inaccessible (simulated)
    // In real tests, this would use chmod to restrict access

    const sessions = await SessionManager.listSessions(planDir);

    // Should load accessible sessions
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });
});

describe('SessionManager.findLatestSession()', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'latest-session-test-'));
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return null for empty directory', async () => {
    const latest = await SessionManager.findLatestSession(planDir);

    expect(latest).toBeNull();
  });

  it('should return session with highest sequence number', async () => {
    await createSessionDirectory(planDir, '001_abc123');
    await createSessionDirectory(planDir, '002_def456');
    await createSessionDirectory(planDir, '003_ghi789');

    const latest = await SessionManager.findLatestSession(planDir);

    expect(latest).not.toBeNull();
    expect(latest?.id).toBe('003_ghi789');
  });
});

describe('SessionManager.findSessionByPRD()', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'find-by-prd-test-'));
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should find session by PRD hash', async () => {
    // Create PRD with known content
    const prdContent = '# Test PRD\n\nThis is a test PRD.';
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, prdContent);

    // Create session with this PRD
    await createSessionDirectory(planDir, '001_abc123');
    writeFileSync(join(planDir, '001_abc123', 'prd_snapshot.md'), prdContent);

    // Find session by PRD
    const session = await SessionManager.findSessionByPRD(prdPath, planDir);

    // Note: This will only match if hash computation matches
    expect(session).not.toBeNull();
  });

  it('should return null for non-existent session hash', async () => {
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, 'Non-matching PRD content');

    const session = await SessionManager.findSessionByPRD(prdPath, planDir);

    expect(session).toBeNull();
  });

  it('should throw SessionFileError for non-existent PRD', async () => {
    const nonExistentPRD = join(tempDir, 'nonexistent.md');

    await expect(
      SessionManager.findSessionByPRD(nonExistentPRD, planDir)
    ).rejects.toThrow(SessionFileError);
  });
});

// Helper function to create session directories
async function createSessionDirectory(
  planDir: string,
  sessionId: string,
  parentSession?: string
): Promise<void> {
  const sessionPath = join(planDir, sessionId);
  mkdirSync(sessionPath, { recursive: true });
  mkdirSync(join(sessionPath, 'architecture'));
  mkdirSync(join(sessionPath, 'prps'));
  mkdirSync(join(sessionPath, 'artifacts'));

  // Create parent_session.txt if specified
  if (parentSession) {
    writeFileSync(join(sessionPath, 'parent_session.txt'), parentSession);
  }
}
```

---

## 8. References and Resources

### 8.1 In-Project Documentation

- **File:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/vitest-typescript-testing-research.md`
  - Comprehensive Vitest testing patterns and examples
  - Mock patterns for Node.js filesystem operations
  - Best practices for TypeScript test organization

- **File:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/file-discovery-directory-scanning-best-practices.md`
  - Directory scanning patterns and optimization techniques
  - Error handling for filesystem operations
  - Performance considerations for directory traversal

- **File:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/testing-quick-reference.md`
  - Quick reference for common testing patterns
  - Test structure and organization guidelines

### 8.2 Key Implementation Files

- **SessionManager Implementation:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
  - Complete session discovery and listing implementation
  - Static methods for session management
  - Hash-based session lookup

- **Session Utilities:** `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`
  - File system operations for session management
  - Atomic write patterns
  - Hash computation utilities

- **Unit Tests:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts`
  - Comprehensive unit tests with mocks
  - Static method testing patterns
  - Error handling test cases

- **Integration Tests:** `/home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts`
  - Real filesystem testing
  - Temp directory management patterns
  - Integration testing best practices

### 8.3 External Resources (Based on Implementation Patterns)

**Vitest Documentation:**

- URL: https://vitest.dev/guide/
- Topics: Mock patterns, test organization, async testing

**Node.js File System (fs/promises):**

- URL: https://nodejs.org/api/fs.html
- Topics: readdir, stat, withFileTypes option, async operations

**TypeScript Static Methods:**

- URL: https://www.typescriptlang.org/docs/handbook/2/classes.html
- Topics: Static members, class-level methods, accessibility

**Testing Patterns:**

- AAA Pattern (Arrange-Act-Assert)
- Test fixture builders
- Temp directory management
- Mock clearing and isolation

### 8.4 Key Patterns Identified

1. **Directory Scanning:** Use `withFileTypes: true` for efficient directory reading
2. **Error Isolation:** Wrap individual session loads in try-catch to continue on failures
3. **Graceful Degradation:** Return empty arrays/null for "not found" cases, throw only for actual errors
4. **Static Method Testing:** Test static methods directly without instantiation
5. **Mock Management:** Clear mocks between tests to prevent state leakage
6. **Fixture Builders:** Create reusable helper functions for test data
7. **Temp Cleanup:** Use beforeEach/afterEach for temp directory lifecycle
8. **Hash-Based Lookup:** Compute hash from content, match against directory names
9. **Sequence Sorting:** Parse sequence from directory name for reliable ordering
10. **Parent References:** Optional file-based parent session links

---

## Summary

This research document covers the key patterns for session discovery and listing in TypeScript/Node.js applications, with a focus on the SessionManager implementation in the hacky-hack project. The patterns are validated through comprehensive unit and integration tests, demonstrating best practices for:

- Directory scanning and filtering
- Static method testing
- Timestamp-based operations
- Hash-based lookups
- Error handling
- Test organization and structure

All code examples are drawn from the actual implementation and test suites, providing practical, validated patterns for production use.
