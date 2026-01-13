# Product Requirement Prompt (PRP): Session Listing and Discovery

---

## Goal

**Feature Goal**: Extend SessionManager class with static session discovery methods and instance-level change detection for PRD hash-based session management.

**Deliverable**: Four new methods in SessionManager:

1. `static listSessions(planDir?: string): Promise<SessionMetadata[]>` - Scan and return all session metadata
2. `static findLatestSession(planDir?: string): Promise<SessionMetadata | null>` - Return session with highest sequence number
3. `static findSessionByPRD(prdPath: string, planDir?: string): Promise<SessionMetadata | null>` - Hash PRD and find matching session
4. `hasSessionChanged(): boolean` - Compare current PRD hash with loaded session's hash

**Success Definition**:

- All four methods implemented and exported from SessionManager
- 100% test coverage with unit tests following existing patterns
- Zero linting errors and zero type errors
- Methods integrate seamlessly with existing `initialize()`, `loadSession()`, `createDeltaSession()` workflow

---

## User Persona (if applicable)

**Target User**: PRP Pipeline internal system (Task Orchestrator, CLI tools)

**Use Case**: Pipeline needs to:

1. Discover existing sessions before creating new ones
2. Find the latest session for resuming work
3. Detect PRD changes to trigger delta session creation
4. List all available sessions for debugging/inspection

**User Journey**:

1. Pipeline startup → `listSessions()` to inspect existing sessions
2. Resume workflow → `findLatestSession()` to get most recent work
3. PRD modification detection → `hasSessionChanged()` to check if delta needed
4. Session reuse → `findSessionByPRD()` to find matching session for current PRD

**Pain Points Addressed**:

- No way to discover what sessions exist without scanning plan/ manually
- No programmatic way to find the latest session
- PRD hash comparison requires manual hashing logic duplication
- Session discovery logic is scattered across private methods

---

## Why

- **Pipeline State Discovery**: Task Orchestrator needs to discover existing sessions before deciding whether to create new or resume existing
- **Delta Detection**: `hasSessionChanged()` enables automatic PRD change detection without manual hash comparison
- **Debugging and Inspection**: `listSessions()` provides visibility into session state for debugging and CLI tools
- **Code Consolidation**: Extracts duplicate scanning logic from `#findSessionByHash()` and `#getNextSequence()` into shared static methods
- **Future-Proofing**: Static methods enable session discovery without instantiating SessionManager (useful for CLI tools)

---

## What

### Contract Definition

**1. `static listSessions(planDir?: string): Promise<SessionMetadata[]>`**

- Scans `plan/` directory for session directories matching pattern `{sequence}_{hash}`
- Parses each directory name to extract sequence number and hash
- Reads `parent_session.txt` if present to determine session lineage
- Returns array of `SessionMetadata` objects sorted by sequence ascending
- Returns empty array if plan/ doesn't exist or no sessions found

**2. `static findLatestSession(planDir?: string): Promise<SessionMetadata | null>`**

- Calls `listSessions()` internally
- Returns session with highest sequence number
- Returns null if no sessions exist

**3. `static findSessionByPRD(prdPath: string, planDir?: string): Promise<SessionMetadata | null>`**

- Validates PRD file exists synchronously (throws SessionFileError if not)
- Computes SHA-256 hash of PRD content using `hashPRD()` utility
- Extracts first 12 characters as session hash
- Searches for session directory ending with `_{hash}`
- Returns `SessionMetadata` if found, null otherwise

**4. `hasSessionChanged(): boolean`**

- Instance method (requires session loaded)
- Computes hash of `this.prdPath`
- Compares with `this.#currentSession.metadata.hash`
- Returns true if hashes differ, false otherwise
- Throws Error if no session loaded

### Success Criteria

- [ ] `listSessions()` returns SessionMetadata[] sorted by sequence ascending
- [ ] `findLatestSession()` returns session with highest sequence or null
- [ ] `findSessionByPRD()` finds matching session by PRD content hash
- [ ] `hasSessionChanged()` returns true when PRD modified, false otherwise
- [ ] All methods handle ENOENT gracefully (plan/ doesn't exist)
- [ ] Pattern matching uses compiled regex `/^(\d{3})_([a-f0-9]{12})$/`
- [ ] Shared scanning logic extracted to avoid duplication
- [ ] 100% test coverage for all methods

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Validation**:

- [x] Exact file paths for all referenced code
- [x] Complete interface definitions with TypeScript types
- [x] Specific code patterns to follow (error handling, mocking, etc.)
- [x] Project-specific test commands that work
- [x] External documentation URLs with anchors

### Documentation & References

```yaml
# MUST READ - Core Implementation Files
- file: src/core/session-manager.ts
  why: Contains existing SessionManager class to extend with new static methods
  pattern: Private methods #findSessionByHash() and #getNextSequence() show current scanning approach
  gotcha: Current implementation uses endsWith() which can match false positives - must use compiled regex

- file: src/core/session-utils.ts
  why: Contains hashPRD() utility needed for findSessionByPRD() and hasSessionChanged()
  pattern: Uses crypto.createHash('sha256') for PRD hashing, returns 64-char hex string
  gotcha: Session hash uses first 12 characters only

- file: src/core/models.ts
  why: Contains SessionMetadata interface that listSessions() returns
  pattern: Interface defined at lines 663-716 with readonly properties
  gotcha: createdAt is Date object, parentSession can be null

- file: tests/unit/core/session-manager.test.ts
  why: Shows test patterns for SessionManager methods with comprehensive mocking
  pattern: Factory functions createTestSubtask(), createTestTask() for test data
  gotcha: Must mock fs/promises.readdir, fs.promises.readFile, fs.promises.stat

# EXTERNAL RESEARCH - File Discovery Best Practices
- docfile: research/file-discovery-directory-scanning-best-practices.md
  why: Complete research on directory scanning patterns, regex optimization, and caching strategies
  section: 2.2 Improved Pattern Matching Approaches
  critical: Use compiled regex /^(\d{3})_([a-f0-9]{12})$/ for exact matching, not endsWith()

- url: https://nodejs.org/api/fs.html#fspromisesreaddirpath-options
  why: Node.js fs.readdir documentation with withFileTypes option
  section: #fspromisesreaddirpath-options
  critical: Always use { withFileTypes: true } to avoid extra stat() calls

- url: https://nodejs.org/api/fs.html#class-fsdirent
  why: fs.Dirent class documentation for type-safe directory entry checking
  section: #class-fsdirent
  critical: Methods isDirectory(), isFile() avoid extra syscalls

# TESTING PATTERNS
- file: tests/unit/core/session-manager.test.ts
  why: Comprehensive test patterns for SessionManager including persistence methods
  pattern: beforeEach clears mocks, factory functions for test data, setup/execute/verify structure
  gotcha: Must mock 'node:fs/promises' and cast with vi.mocked() for type safety

- file: vitest.config.ts
  why: Test configuration showing coverage requirements and test environment
  pattern: 100% coverage requirement enforced, test environment: 'node'
  gotcha: Use vi.mocked() for typed mock access in TypeScript
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts    # EXTEND: Add static methods here
│   │   ├── session-utils.ts      # USE: hashPRD() utility
│   │   ├── models.ts             # REFERENCE: SessionMetadata interface
│   │   └── index.ts              # UPDATE: Export new methods (if needed)
│   └── utils/
│       └── task-utils.ts         # USE: For SessionMetadata type import
├── tests/
│   └── unit/
│       └── core/
│           ├── session-manager.test.ts    # EXTEND: Add new tests
│           └── session-utils.test.ts      # REFERENCE: hashPRD test patterns
├── plan/
│   └── 001_14b9dc2a33c7/         # Example session directory
│       ├── tasks.json
│       ├── prd_snapshot.md
│       └── parent_session.txt    # Optional: for delta sessions
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

### Desired Codebase Tree with Files to be Modified

```bash
# MODIFIED FILE: src/core/session-manager.ts
# ADD: Four new methods (3 static, 1 instance)

# MODIFIED FILE: tests/unit/core/session-manager.test.ts
# ADD: Test suites for all four new methods
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Session hash is first 12 characters of SHA-256, not full hash
const fullHash = await hashPRD(prdPath); // Returns 64-char hex string
const sessionHash = fullHash.slice(0, 12); // Only use first 12!

// CRITICAL: Session directory format is {sequence:03d}_{hash:12c}
// Example: "001_14b9dc2a33c7" (zero-padded 3-digit sequence, 12-char hash)
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

// GOTCHA: Current implementation uses endsWith() which has false positives
// BAD: if (entry.name.endsWith(`_${hash}`))
// GOOD: const match = entry.name.match(SESSION_DIR_PATTERN);

// GOTCHA: plan/ directory may not exist - handle ENOENT gracefully
if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
  return []; // or null depending on method
}

// GOTCHA: parent_session.txt is optional - catch error when reading
try {
  parentContent = await readFile(parentPath, 'utf-8');
} catch {
  // No parent session file
}

// GOTCHA: SessionManager constructor validates PRD exists synchronously
// Static methods must do the same for consistency
const stats = statSync(absPath);
if (!stats.isFile()) {
  throw new SessionFileError(absPath, 'validate PRD path');
}

// CRITICAL: Always use { withFileTypes: true } for directory scanning
const entries = await readdir(dirPath, { withFileTypes: true });
// This returns Dirent[] with isDirectory() method - avoids extra stat() calls

// PATTERN: Error handling uses custom SessionFileError class
throw new SessionFileError(path, 'operation description', error as Error);

// PATTERN: Use readonly properties for SessionMetadata immutability
readonly id: string;
readonly hash: string;
readonly path: string;
readonly createdAt: Date;
readonly parentSession: string | null;

// GOTCHA: createdAt uses mtime from stat() as proxy for creation time
const stats = await stat(sessionPath);
const createdAt = stats.mtime;

// TESTING: Must use vi.mocked() for type-safe mock access in TypeScript
const mockReaddir = vi.mocked(readdir);
mockReaddir.mockResolvedValue([...]);
```

---

## Implementation Blueprint

### Data Models and Structure

**No new models needed** - using existing `SessionMetadata` interface from `src/core/models.ts`:

```typescript
// Existing interface - no changes needed
export interface SessionMetadata {
  readonly id: string; // Format: {sequence}_{hash}
  readonly hash: string; // First 12 chars of SHA-256
  readonly path: string; // Absolute path to session directory
  readonly createdAt: Date; // Directory mtime
  readonly parentSession: string | null; // Parent session ID for deltas
}
```

**New internal type for parsed session directories**:

```typescript
// Add to session-manager.ts (private interface)
interface SessionDirInfo {
  name: string; // Directory name (e.g., '001_14b9dc2a33c7')
  path: string; // Absolute path to directory
  sequence: number; // Parsed sequence number (e.g., 1)
  hash: string; // Parsed hash (e.g., '14b9dc2a33c7')
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD compiled regex pattern constant to session-manager.ts
  IMPLEMENT: Add SESSION_DIR_PATTERN constant at top of file after imports
  PATTERN: const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;
  RATIONALE: Compile regex once, reuse many times - faster than endsWith() approach
  GOTCHA: Must use anchors ^...$ for exact matching (no false positives)
  PLACEMENT: After imports, before class definition (line ~45)

Task 2: ADD private static helper method parseSessionDirectory()
  IMPLEMENT: static #parseSessionDirectory(name: string, planDir: string): SessionDirInfo | null
  LOGIC:
    - Match name against SESSION_DIR_PATTERN
    - Return null if no match
    - Parse sequence number with parseInt(match[1], 10)
    - Extract hash from match[2]
    - Resolve full path with resolve(planDir, name)
  FOLLOW pattern: Type-safe parsing with null return for invalid format
  NAMING: Private static method using # prefix
  DEPENDENCIES: Task 1 (regex pattern)

Task 3: ADD private static helper method scanSessionDirectories()
  IMPLEMENT: static #scanSessionDirectories(planDir: string): Promise<SessionDirInfo[]>
  LOGIC:
    - Use readdir(planDir, { withFileTypes: true })
    - Handle ENOENT by returning empty array
    - Filter for isDirectory()
    - Parse each with parseSessionDirectory()
    - Filter out null results (non-session directories)
  FOLLOW pattern: Similar to existing #findSessionByHash() but returns all sessions
  ERROR HANDLING: Throw DirectoryScanError for non-ENOENT errors
  DEPENDENCIES: Task 2 (parseSessionDirectory)
  GOTCHA: Only return directories that match session pattern

Task 4: ADD private static helper method readParentSession()
  IMPLEMENT: static #readParentSession(sessionPath: string): Promise<string | null>
  LOGIC:
    - Try readFile(join(sessionPath, 'parent_session.txt'), 'utf-8')
    - Return trimmed content if file exists
    - Return null if ENOENT (no parent session file)
  FOLLOW pattern: Same as loadSession() parent session reading (lines 264-271)
  ERROR HANDLING: Return null on ENOENT, rethrow other errors
  PLACEMENT: Helper for building SessionMetadata objects

Task 5: IMPLEMENT static listSessions() method
  IMPLEMENT:
    static async listSessions(planDir: string = resolve('plan')): Promise<SessionMetadata[]>
  LOGIC:
    - Call #scanSessionDirectories(planDir)
    - For each session, read metadata using stat() and #readParentSession()
    - Build SessionMetadata objects
    - Sort by sequence ascending (sessions[0].sequence to sessions[n].sequence)
    - Return sorted array
  FOLLOW pattern: Return empty array if no sessions (consistent with existing patterns)
  NAMING: camelCase, static method
  DEPENDENCIES: Task 3 (scanSessionDirectories), Task 4 (readParentSession)
  GOTCHA: Sort by sequence number, not string comparison

Task 6: IMPLEMENT static findLatestSession() method
  IMPLEMENT:
    static async findLatestSession(planDir: string = resolve('plan')): Promise<SessionMetadata | null>
  LOGIC:
    - Call listSessions(planDir)
    - Return null if array empty
    - Return last element (highest sequence after sorting)
  FOLLOW pattern: Return null for not found (consistent with other finders)
  NAMING: camelCase, static method
  DEPENDENCIES: Task 5 (listSessions)

Task 7: IMPLEMENT static findSessionByPRD() method
  IMPLEMENT:
    static async findSessionByPRD(prdPath: string, planDir: string = resolve('plan')): Promise<SessionMetadata | null>
  LOGIC:
    - Validate PRD exists synchronously (statSync, isFile check)
    - Throw SessionFileError if not found
    - Compute hash with hashPRD(prdPath)
    - Extract session hash: fullHash.slice(0, 12)
    - Call #scanSessionDirectories(planDir)
    - Find session with matching hash
    - If found, build full SessionMetadata with stat() and parent session
    - Return SessionMetadata or null
  FOLLOW pattern: Similar to initialize() session discovery (lines 196-207)
  DEPENDENCIES: hashPRD from session-utils.ts, Task 3 (scanSessionDirectories)
  GOTCHA: Must use statSync for synchronous validation (constructor pattern)

Task 8: IMPLEMENT instance method hasSessionChanged()
  IMPLEMENT:
    hasSessionChanged(): boolean
  LOGIC:
    - Throw Error if #currentSession is null
    - Compute hash of this.prdPath using hashPRD()
    - Extract session hash: fullHash.slice(0, 12)
    - Compare with this.#currentSession.metadata.hash
    - Return true if different, false if same
  FOLLOW pattern: Similar to initialize() hash comparison logic
  DEPENDENCIES: hashPRD from session-utils.ts
  GOTCHA: This is instance method (not static), requires session loaded

Task 9: REFACTOR existing private methods to use shared scanning logic
  MODIFY: #findSessionByHash() and #getNextSequence()
  LOGIC:
    - Replace directory scanning with call to #scanSessionDirectories()
    - Extract hash/sequence from SessionDirInfo results
  RATIONALE: Eliminate code duplication, single source of truth
  PRESERVE: All existing behavior and error handling
  DEPENDENCIES: Task 3 (scanSessionDirectories)

Task 10: CREATE unit tests in tests/unit/core/session-manager.test.ts
  IMPLEMENT: Comprehensive test suites for all four new methods
  FOLLOW pattern: Existing test structure with describe(), it(), beforeEach()
  MOCK: fs/promises.readdir, fs/promises.readFile, fs.promises.stat, node:fs.statSync
  COVERAGE: Happy path, empty directory, ENOENT handling, invalid patterns
  PLACEMENT: Add new describe() blocks after existing tests
  DEPENDENCIES: All implementation tasks complete

Task 11: VERIFY type checking and linting
  RUN: npm run check (or tsc --noEmit for type checking)
  RUN: npm run lint (or eslint .)
  FIX: Any type errors or linting issues
  EXPECTED: Zero errors

Task 12: RUN full test suite with coverage
  RUN: npm run test:coverage
  VERIFY: 100% coverage for new methods
  VERIFY: All existing tests still pass
  EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Compiled Regex for Session Directory Matching
// ============================================================================
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

// Usage in parsing
function parseSessionDirectory(
  name: string,
  planDir: string
): SessionDirInfo | null {
  const match = name.match(SESSION_DIR_PATTERN);
  if (!match) return null;

  return {
    name,
    path: resolve(planDir, name),
    sequence: parseInt(match[1], 10),
    hash: match[2],
  };
}

// ============================================================================
// PATTERN 2: Static Helper Methods (Private)
// ============================================================================
export class SessionManager {
  // ... existing code ...

  /**
   * Parses session directory name into components
   *
   * @param name - Directory name (e.g., '001_14b9dc2a33c7')
   * @param planDir - Path to plan directory
   * @returns Parsed info or null if invalid format
   */
  static #parseSessionDirectory(
    name: string,
    planDir: string
  ): SessionDirInfo | null {
    const match = name.match(SESSION_DIR_PATTERN);
    if (!match) return null;

    return {
      name,
      path: resolve(planDir, name),
      sequence: parseInt(match[1], 10),
      hash: match[2],
    };
  }

  /**
   * Scans plan directory for session subdirectories
   *
   * @param planDir - Path to plan directory
   * @returns Array of session directory info
   */
  static async #scanSessionDirectories(
    planDir: string
  ): Promise<SessionDirInfo[]> {
    try {
      const entries = await readdir(planDir, { withFileTypes: true });
      const sessions: SessionDirInfo[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const parsed = SessionManager['#parseSessionDirectory'](
            entry.name,
            planDir
          );
          if (parsed) {
            sessions.push(parsed);
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
}

// ============================================================================
// PATTERN 3: Static listSessions() Implementation
// ============================================================================
export class SessionManager {
  /**
   * Lists all sessions in the plan directory
   *
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @returns Array of SessionMetadata sorted by sequence ascending
   */
  static async listSessions(
    planDir: string = resolve('plan')
  ): Promise<SessionMetadata[]> {
    // Scan for session directories
    const sessions = await SessionManager['#scanSessionDirectories'](planDir);

    // Build SessionMetadata for each session
    const metadata: SessionMetadata[] = [];

    for (const session of sessions) {
      // Get directory stats for createdAt
      const stats = await stat(session.path);

      // Check for parent session
      const parentSession = await SessionManager['#readParentSession'](
        session.path
      );

      metadata.push({
        id: session.name,
        hash: session.hash,
        path: session.path,
        createdAt: stats.mtime,
        parentSession,
      });
    }

    // Sort by sequence ascending
    metadata.sort((a, b) => {
      const seqA = parseInt(a.id.split('_')[0], 10);
      const seqB = parseInt(b.id.split('_')[0], 10);
      return seqA - seqB;
    });

    return metadata;
  }
}

// ============================================================================
// PATTERN 4: Static findLatestSession() Implementation
// ============================================================================
export class SessionManager {
  /**
   * Finds the latest session (highest sequence number)
   *
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @returns Latest SessionMetadata or null if no sessions exist
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
}

// ============================================================================
// PATTERN 5: Static findSessionByPRD() Implementation
// ============================================================================
export class SessionManager {
  /**
   * Finds session matching the given PRD file
   *
   * @param prdPath - Path to PRD markdown file
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @returns Matching SessionMetadata or null if not found
   * @throws {SessionFileError} If PRD file does not exist
   */
  static async findSessionByPRD(
    prdPath: string,
    planDir: string = resolve('plan')
  ): Promise<SessionMetadata | null> {
    // Validate PRD exists synchronously
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
    const sessions = await SessionManager['#scanSessionDirectories'](planDir);

    // Find matching session
    const match = sessions.find(s => s.hash === sessionHash);
    if (!match) {
      return null;
    }

    // Build full SessionMetadata
    const stats = await stat(match.path);
    const parentSession = await SessionManager['#readParentSession'](
      match.path
    );

    return {
      id: match.name,
      hash: match.hash,
      path: match.path,
      createdAt: stats.mtime,
      parentSession,
    };
  }
}

// ============================================================================
// PATTERN 6: Instance Method hasSessionChanged() Implementation
// ============================================================================
export class SessionManager {
  /**
   * Checks if the current PRD has changed since session load
   *
   * @returns true if PRD hash differs from session hash, false otherwise
   * @throws {Error} If no session is currently loaded
   */
  hasSessionChanged(): boolean {
    if (!this.#currentSession) {
      throw new Error('Cannot check session change: no session loaded');
    }

    // This method would need to be async to call hashPRD()
    // BUT the contract specifies boolean return (not Promise<boolean>)
    // SOLUTION: Either (a) make async, or (b) cache hash at initialize time
    // CONTRACT DEFINITION says "boolean" - this is a SYNCHRONOUS check
    // Implementation requires hash to be computed during initialize()
  }
}

// CRITICAL GOTCHA: hasSessionChanged() contract issue
// The contract definition says "boolean" but hashPRD() is async
// Two solutions:
// SOLUTION A: Cache PRD hash in SessionManager during initialize()
// SOLUTION B: Change signature to async (Promise<boolean>)
// SOLUTION A is consistent with existing patterns - hash already computed in initialize()

// REVISED IMPLEMENTATION (Solution A - Cache Hash):
export class SessionManager {
  #currentSession: SessionState | null = null;
  #prdHash: string | null = null; // ADD: Cache PRD hash

  async initialize(): Promise<SessionState> {
    const fullHash = await hashPRD(this.prdPath);
    const sessionHash = fullHash.slice(0, 12);
    this.#prdHash = sessionHash; // CACHE: Store for later comparison
    // ... rest of initialize logic
  }

  hasSessionChanged(): boolean {
    if (!this.#currentSession) {
      throw new Error('Cannot check session change: no session loaded');
    }
    if (!this.#prdHash) {
      throw new Error('Cannot check session change: PRD hash not computed');
    }
    return this.#prdHash !== this.#currentSession.metadata.hash;
  }
}

// ============================================================================
// PATTERN 7: Refactoring Existing Methods to Use Shared Logic
// ============================================================================
export class SessionManager {
  async #findSessionByHash(hash: string): Promise<string | null> {
    const sessions = await SessionManager['#scanSessionDirectories'](
      this.planDir
    );
    const match = sessions.find(s => s.hash === hash);
    return match?.path ?? null;
  }

  async #getNextSequence(): Promise<number> {
    const sessions = await SessionManager['#scanSessionDirectories'](
      this.planDir
    );
    const maxSeq = sessions.reduce((max, s) => Math.max(max, s.sequence), 0);
    return maxSeq + 1;
  }
}
```

### Integration Points

```yaml
SessionManager CLASS:
  - add to: src/core/session-manager.ts
  - place: After existing instance methods, before closing brace
  - export: Static methods are automatically exported with class

SessionMetadata TYPE:
  - import from: src/core/models.ts
  - already imported: No new imports needed

hashPRD UTILITY:
  - import from: src/core/session-utils.ts
  - already imported: No new imports needed

TESTS:
  - add to: tests/unit/core/session-manager.test.ts
  - pattern: New describe() blocks for each method
  - mock: 'node:fs/promises', 'node:fs'
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npx tsc --noEmit                # Type checking (check for type errors)
npx eslint src/core/session-manager.ts  # Linting (check for style issues)

# Project-wide validation
npm run check                   # If defined in package.json
npm run lint                    # If defined in package.json
npm run format                  # If using prettier

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific test file
npm test -- tests/unit/core/session-manager.test.ts

# Test with coverage
npm run test:coverage

# Watch mode during development
npm test -- --watch

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

**Test Commands for New Methods**:

```bash
# Test listSessions
npm test -- --testNamePattern="listSessions"

# Test findLatestSession
npm test -- --testNamePattern="findLatestSession"

# Test findSessionByPRD
npm test -- --testNamePattern="findSessionByPRD"

# Test hasSessionChanged
npm test -- --testNamePattern="hasSessionChanged"
```

### Level 3: Integration Testing (System Validation)

```bash
# Create test sessions in plan/ directory
mkdir -p plan/001_test001000001 plan/002_test002000002

# Run TypeScript REPL to test methods
npx tsx -e "
import { SessionManager } from './src/core/session-manager.js';
import { resolve } from 'node:path';

async function test() {
  const sessions = await SessionManager.listSessions(resolve('plan'));
  console.log('Found sessions:', sessions.length);

  const latest = await SessionManager.findLatestSession(resolve('plan'));
  console.log('Latest session:', latest?.id);

  const changed = manager.hasSessionChanged();
  console.log('Session changed:', changed);
}

test().catch(console.error);
"

# Expected: Methods return expected values, no crashes
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Performance testing: Test with 1000+ session directories
for i in {1..1000}; do
  seq=$(printf '%03d' $i)
  hash=$(echo $i | sha256sum | cut -c1-12)
  mkdir -p "plan/${seq}_${hash}"
done

# Benchmark listSessions performance
npx tsx -e "
import { SessionManager } from './src/core/session-manager.js';
import { resolve } from 'node:path';

const start = Date.now();
const sessions = await SessionManager.listSessions(resolve('plan'));
const elapsed = Date.now() - start;
console.log(\`Listed \${sessions.length} sessions in \${elapsed}ms\`);
"

# Edge case testing: Empty plan/ directory
rm -rf plan/*
npx tsx -e "
import { SessionManager } from './src/core/session-manager.js';
import { resolve } from 'node:path';

const sessions = await SessionManager.listSessions(resolve('plan'));
console.log('Empty plan sessions:', sessions); // Should be []
"

# Edge case testing: Invalid directory names
mkdir -p plan/invalid plan/999 plan/001_tooshort plan/001_hashoverflowoverflowoverflow
npx tsx -e "
import { SessionManager } from './src/core/session-manager.js';
import { resolve } from 'node:path';

const sessions = await SessionManager.listSessions(resolve('plan'));
console.log('Filtered invalid dirs:', sessions.length); // Should be 0
"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint` or `npx eslint src/core/session-manager.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Coverage report shows 100% for new methods: `npm run test:coverage`

### Feature Validation

- [ ] `listSessions()` returns SessionMetadata[] sorted by sequence ascending
- [ ] `findLatestSession()` returns session with highest sequence or null
- [ ] `findSessionByPRD()` finds matching session by PRD content hash
- [ ] `hasSessionChanged()` returns true when PRD modified, false otherwise
- [ ] All methods handle ENOENT gracefully (plan/ doesn't exist)
- [ ] Pattern matching uses compiled regex `/^(\d{3})_([a-f0-9]{12})$/`
- [ ] Shared scanning logic extracted to `#scanSessionDirectories()`
- [ ] Existing `#findSessionByHash()` and `#getNextSequence()` refactored

### Code Quality Validation

- [ ] Follows existing codebase patterns (error handling, naming conventions)
- [ ] Private static methods use `#` prefix
- [ ] Public static methods have JSDoc comments
- [ ] Error messages are descriptive and consistent
- [ ] Type-safe mock access using `vi.mocked()` in tests

### Documentation & Deployment

- [ ] JSDoc comments on all public methods
- [ ] Example usage in comments
- [ ] Error conditions documented
- [ ] No breaking changes to existing API

---

## Anti-Patterns to Avoid

- [x] Don't use `endsWith()` for pattern matching (use compiled regex)
- [x] Don't skip ENOENT handling (plan/ may not exist)
- [x] Don't forget to sort by sequence number in `listSessions()`
- [x] Don't use synchronous file operations except for validation (statSync)
- [x] Don't throw generic errors (use SessionFileError for file operations)
- [x] Don't duplicate scanning logic (extract to `#scanSessionDirectories()`)
- [x] Don't forget to validate PRD exists in `findSessionByPRD()`
- [x] Don't use `this` in static methods (use parameters)
- [x] Don't forget to handle parent_session.txt optionally (may not exist)
- [x] Don't use string comparison for sequence sorting (parse to int first)

---

## Confidence Score

**8/10** for one-pass implementation success

**Rationale**:

- **Strengths**: Comprehensive context, exact file paths, specific patterns, external research
- **Gap**: `hasSessionChanged()` has async/sync design conflict - need to decide on caching approach
- **Risk**: Refactoring existing private methods could inadvertently break existing behavior
- **Mitigation**: Extensive test coverage covers refactoring risks

**Confidence Boosters**:

1. 100% research coverage of all implementation aspects
2. Specific code patterns extracted from existing codebase
3. External research provides proven best practices
4. Test patterns well-documented from existing tests
5. Gotchas and anti-patterns clearly documented

**Remaining Uncertainties**:

1. Should `hasSessionChanged()` be async or use cached hash?
   - **Resolution**: Use cached hash approach (consistent with existing patterns)
2. Should `#scanSessionDirectories()` be cached for performance?
   - **Resolution**: No caching needed for current scale (<100 sessions expected)
3. Should new methods throw or return null on errors?
   - **Resolution**: Follow existing patterns (null for not found, throw for invalid input)

---

**Generated**: 2026-01-13
**For**: Subtask P3.M1.T1.S3 - Implement session listing and discovery
**Phase**: P3 - Pipeline Implementation, Milestone M1 - Session Manager
