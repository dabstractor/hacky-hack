# Product Requirement Prompt (PRP): Test Session Discovery Methods

**PRP ID**: P2.M1.T2.S3
**Generated**: 2026-01-15
**Story Points**: 1
**Dependency**: P2.M1.T2.S2 (Status Propagation Tests) - Must pass before this task begins

---

## Goal

**Feature Goal**: Create comprehensive integration tests for SessionManager's static session discovery methods (`listSessions()`, `findLatestSession()`, `findSessionByPRD()`), validating directory scanning, hash-based lookup, sorting by sequence number, and null handling for non-existent sessions.

**Deliverable**: Extended integration test file at `tests/integration/core/session-manager.test.ts` with full coverage of session discovery scenarios using real filesystem operations and multiple session fixtures.

**Success Definition**:
- `listSessions()` returns all sessions sorted by sequence ascending
- `findLatestSession()` returns session with highest sequence number
- `findSessionByPRD()` returns matching session for exact PRD hash
- `findSessionByPRD()` returns null for non-existent hash
- Empty plan directory returns empty array from `listSessions()`
- Non-existent plan directory returns empty array from `listSessions()`
- Session metadata correctly populated (id, hash, path, createdAt, parentSession)
- Parent session reference loaded from `parent_session.txt` when present
- All integration tests pass with 100% coverage of discovery method code paths
- Tests document actual sorting and filtering behavior

---

## User Persona

**Target User**: Developer working on SessionManager validation who needs assurance that session discovery works correctly for CLI session selection functionality.

**Use Case**: Validating that SessionManager's static discovery methods correctly scan, filter, and return session metadata for use in CLI tools that need to list and select existing sessions.

**User Journey**:
1. CLI tool calls `SessionManager.listSessions()` to get all available sessions
2. User selects a session from the list
3. CLI tool calls `SessionManager.findSessionByPRD()` to verify PRD matches
4. CLI tool calls `SessionManager.findLatestSession()` to get most recent session
5. Session is loaded and work continues

**Pain Points Addressed**:
- **Unclear sorting behavior**: Does `listSessions()` return sessions in order? (Tests verify: YES, by sequence ascending)
- **Unclear latest session logic**: Which session is "latest"? (Tests verify: Highest sequence number)
- **Unclear hash matching**: How exact is PRD hash matching? (Tests verify: First 12 chars of SHA-256)
- **Empty directory handling**: What happens with no sessions? (Tests verify: Empty array/null returned)
- **Parent session loading**: Are parent references included? (Tests verify: YES, if parent_session.txt exists)

---

## Why

- **CLI Session Selection**: Discovery methods enable CLI tools to list and select sessions
- **Session Navigation**: Users need to see all sessions and navigate between them
- **PRD Verification**: `findSessionByPRD()` prevents duplicate sessions for same PRD
- **Latest Session Recovery**: `findLatestSession()` enables "resume work" functionality
- **Integration with Status Propagation**: P2.M1.T2.S2 tests status updates; this tests discovering those sessions
- **Problems Solved**:
  - "How do I list all available sessions?" (Tests verify: `listSessions()`)
  - "Which session was I working on last?" (Tests verify: `findLatestSession()`)
  - "Does a session for this PRD already exist?" (Tests verify: `findSessionByPRD()`)
  - "What happens if no sessions exist?" (Tests verify: Empty array/null returns)

---

## What

Extend the integration test file at `tests/integration/core/session-manager.test.ts` to validate session discovery methods with real filesystem operations and multiple session fixtures.

### Current State Analysis

**SessionManager.listSessions() Method** (from `/src/core/session-manager.ts` lines 827-891):
```typescript
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
```

**SessionManager.findLatestSession() Method** (from `/src/core/session-manager.ts` lines 893-924):
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

**SessionManager.findSessionByPRD() Method** (from `/src/core/session-manager.ts` lines 926-998):
```typescript
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

**Session Directory Pattern** (from `/src/core/session-manager.ts` line 63):
```typescript
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;
// Format: {sequence}_{hash}
// Example: 001_14b9dc2a33c7
// sequence: 3-digit zero-padded number (001, 002, 003)
// hash: 12-character lowercase hexadecimal (first 12 chars of SHA-256)
```

### Success Criteria

- [ ] Test 1: listSessions() returns all sessions in sequence order
- [ ] Test 2: listSessions() returns empty array for non-existent plan directory
- [ ] Test 3: listSessions() returns empty array for empty plan directory
- [ ] Test 4: listSessions() includes parentSession when parent_session.txt exists
- [ ] Test 5: findLatestSession() returns session with highest sequence number
- [ ] Test 6: findLatestSession() returns null for empty plan directory
- [ ] Test 7: findSessionByPRD() returns matching session for exact hash
- [ ] Test 8: findSessionByPRD() returns null for non-existent hash
- [ ] Test 9: findSessionByPRD() throws SessionFileError for non-existent PRD file
- [ ] Test 10: Session metadata correctly populated (id, hash, path, createdAt, parentSession)
- [ ] All tests use real filesystem (temp directories)
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] SessionManager.listSessions() implementation documented (lines 827-891)
- [x] SessionManager.findLatestSession() implementation documented (lines 893-924)
- [x] SessionManager.findSessionByPRD() implementation documented (lines 926-998)
- [x] Session directory pattern documented (regex, format, example)
- [x] __scanSessionDirectories() helper documented (internal scanning logic)
- [x] __readParentSession() helper documented (parent session loading)
- [x] Existing integration test patterns analyzed
- [x] Temp directory testing patterns researched
- [x] fs.readdir with withFileTypes patterns researched
- [x] Scope boundaries defined (extend existing integration tests)
- [x] Dependency on P2.M1.T2.S2 established

---

### Documentation & References

```yaml
# MUST READ - SessionManager.listSessions() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains listSessions() method (lines 827-891) with scanning and sorting logic
  section: Lines 827-891
  critical: |
    - Calls __scanSessionDirectories() to get session directories
    - Builds SessionMetadata for each session (id, hash, path, createdAt, parentSession)
    - Skips sessions that fail to load (try/catch with continue)
    - Sorts by sequence ascending (parseInt sequence from id)
    - Returns empty array if ENOENT (handled by __scanSessionDirectories)

# MUST READ - SessionManager.findLatestSession() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains findLatestSession() method (lines 893-924) with latest session logic
  section: Lines 893-924
  pattern: |
    - Calls listSessions() to get all sessions
    - Returns null if sessions.length === 0
    - Returns last element (highest sequence, already sorted)
  critical: |
    - Relies on listSessions() sorting (ascending order)
    - Last element is highest sequence number
    - Returns null for empty directories

# MUST READ - SessionManager.findSessionByPRD() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains findSessionByPRD() method (lines 926-998) with hash matching logic
  section: Lines 926-998
  pattern: |
    - Validates PRD file exists (throws SessionFileError if not)
    - Computes SHA-256 hash of PRD content
    - Uses first 12 characters as session hash
    - Scans for matching session directory
    - Returns null if no match found
  critical: |
    - Throws SessionFileError for non-existent PRD file
    - Hash is first 12 chars of SHA-256 (not full hash)
    - Returns null for non-existent session (not error)
    - Returns full SessionMetadata if found

# MUST READ - __scanSessionDirectories() helper
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains directory scanning logic (lines 772-801) with pattern matching
  section: Lines 772-801
  pattern: |
    - Uses fs.readdir with withFileTypes: true
    - Filters for directories only
    - Matches directory name against SESSION_DIR_PATTERN
    - Returns empty array for ENOENT (graceful handling)
  gotcha: |
    - Returns SessionDirInfo[] (internal type)
    - Skips files and non-matching directories
    - Parses sequence and hash from directory name

# MUST READ - __readParentSession() helper
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains parent session loading logic (lines 814-825)
  section: Lines 814-825
  pattern: |
    - Reads parent_session.txt file
    - Returns null if file doesn't exist (not an error)
    - Trims whitespace from content
  gotcha: |
    - Graceful null return for missing file
    - No validation that parent session actually exists

# MUST READ - Session directory pattern
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains SESSION_DIR_PATTERN regex (line 63) for validating directory names
  section: Line 63
  pattern: |
    - Regex: /^(\d{3})_([a-f0-9]{12})$/
    - Format: {sequence}_{hash}
    - Example: 001_14b9dc2a33c7
    - sequence: 3-digit zero-padded (001-999)
    - hash: 12 lowercase hex chars
  critical: |
    - Must match exact pattern or directory is skipped
    - Used by __scanSessionDirectories() for filtering
    - Tests should create directories matching this pattern

# MUST READ - Previous PRP for status propagation tests (P2.M1.T2.S2)
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T2S2/PRP.md
  why: Contains status propagation test patterns and temp directory setup
  section: Implementation Tasks and Implementation Patterns
  pattern: |
    - Temp directory setup with mkdtempSync()
    - describe/it block structure
    - SETUP/EXECUTE/VERIFY comment structure
    - Real filesystem operations
  critical: |
    - P2.M1.T2.S2 tests status update propagation
    - This PRP (P2.M1.T2.S3) tests session discovery
    - Both use same temp directory and fixture patterns
    - Tests are complementary (discovery + updates = complete session workflow)

# MUST READ - Existing integration test file
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: This is the file to EXTEND with discovery tests
  section: Full file (currently 1200+ lines with initialize, loadSession, delta detection, atomic flush, status propagation tests)
  pattern: |
    - describe('SessionManager.initialize()' for new sessions (lines 97-390)
    - describe('SessionManager.loadSession()' for existing sessions (lines 396-882)
    - describe('SessionManager Delta Session Detection' (lines 888-1200+)
    - ADD: describe('SessionManager Session Discovery Methods' for discovery tests
    - Use same temp directory setup/teardown pattern
  gotcha: |
    - File already has initialize, loadSession, delta detection, atomic flush, and status propagation tests
    - We EXTEND it with new describe() block for session discovery
    - Don't modify existing tests
    - Temp directory pattern: mkdtempSync(join(tmpdir(), 'session-manager-test-'))

# MUST READ - Research: fs.readdir patterns
- docfile: plan/002_1e734971e481/P2M1T2S3/research/fs-readdir-patterns.md
  why: Comprehensive research on fs/promises.readdir with withFileTypes
  section: Full document
  pattern: |
    - Dirent[] objects with isDirectory() method
    - Single syscall for both name and type information
    - Performance benefits vs separate fs.stat() calls
    - Directory filtering patterns
  critical: |
    - Current implementation uses withFileTypes: true (best practice)
    - Returns Dirent[] array with type information
    - Tests should verify directory filtering works correctly
    - ENOENT handling returns empty array

# MUST READ - Research: Session discovery patterns
- docfile: plan/002_1e734971e481/P2M1T2S3/research/session-discovery-patterns.md
  why: Comprehensive research on session discovery and testing patterns
  section: Full document
  pattern: |
    - Static method testing patterns (direct invocation)
    - Hash-based lookup testing
    - Timestamp-based sorting validation
    - Error handling for non-existent sessions
  critical: |
    - Static methods called directly on class (no instantiation)
    - Hash is first 12 chars of SHA-256
    - Sorting by sequence number (parsed from directory name)
    - Null returns vs error throwing behavior
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts              # SOURCE: listSessions() (827-891)
│   │   │                                   # SOURCE: findLatestSession() (893-924)
│   │   │                                   # SOURCE: findSessionByPRD() (926-998)
│   │   │                                   # SOURCE: __scanSessionDirectories() (772-801)
│   │   │                                   # SOURCE: __readParentSession() (814-825)
│   │   │                                   # SOURCE: SESSION_DIR_PATTERN (63)
│   │   ├── models.ts                       # REFERENCE: SessionMetadata type
│   │   └── session-utils.ts                # REFERENCE: hashPRD(), SessionFileError
│   └── utils/
│       └── task-utils.ts                   # REFERENCE: (not used by discovery methods)
├── tests/
│   ├── setup.ts                            # Global test setup
│   ├── unit/
│   │   └── core/
│   │       └── session-manager.test.ts     # EXISTING: Unit tests with mocks
│   ├── fixtures/
│   │   └── (various PRD fixtures)          # REFERENCE: For test data
│   └── integration/
│       └── core/
│           └── session-manager.test.ts    # EXTEND: Add discovery tests here
├── plan/
│   └── 002_1e734971e481/
│       ├── P2M1T2S1/
│       │   └── PRP.md                     # REFERENCE: Atomic flush tests
│       ├── P2M1T2S2/
│       │   └── PRP.md                     # REFERENCE: Status propagation tests
│       ├── P2M1T2S3/
│       │   ├── PRP.md                     # NEW: This PRP
│       │   └── research/                  # NEW: Research documentation
│       │       ├── fs-readdir-patterns.md
│       │       └── session-discovery-patterns.md
│       └── tasks.json                     # REFERENCE: Sample tasks.json
├── vitest.config.ts                       # Vitest configuration
└── package.json                            # Test scripts
```

---

### Desired Codebase Tree (modifications to existing files)

```bash
hacky-hack/
└── tests/
    └── integration/
        └── core/
            └── session-manager.test.ts    # EXTEND: Add new describe() block
                                                    # ADD: describe('SessionManager Session Discovery Methods', () => { ... })
                                                    # ADD: Tests for listSessions()
                                                    # ADD: Tests for findLatestSession()
                                                    # ADD: Tests for findSessionByPRD()
                                                    # ADD: Tests for empty/null scenarios
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: listSessions() Uses Sequence Number Sorting
// Sorting is by parsed sequence number, not directory name string
// Pattern: parseInt(a.id.split('_')[0], 10) - parseInt(b.id.split('_')[0], 10)
// Tests should verify numeric sorting, not lexicographic sorting
// Example: '002_' - '001_' = 1 (not string comparison)

// CRITICAL: findLatestSession() Relies on listSessions() Sorting
// Returns last element of sorted array (highest sequence)
// If listSessions() fails to sort, findLatestSession() returns wrong session
// Tests should verify listSessions() sorting first

// CRITICAL: findSessionByPRD() Uses First 12 Characters of Hash
// Hash is SHA-256 of PRD content
// Only first 12 characters used for matching (not full hash)
// Tests should use known PRD content for predictable hashes

// CRITICAL: Session Directory Naming Pattern is Strict
// Must match: /^(\d{3})_([a-f0-9]{12})$/
// Sequence must be 3-digit zero-padded (001, 002, 003)
// Hash must be 12 lowercase hex characters
// Tests should create directories matching this pattern exactly

// GOTCHA: __scanSessionDirectories() Returns Empty Array for ENOENT
// If plan directory doesn't exist, returns [] (not error)
// This is graceful handling, not an error condition
// Tests should verify empty array returned for non-existent directory

// CRITICAL: listSessions() Skips Failed Sessions
// If session fails to load (permission denied, I/O error), it's skipped
// try/catch with continue in loop
// Tests should not count skipped sessions in results

// GOTCHA: __readParentSession() Returns Null for Missing File
// If parent_session.txt doesn't exist, returns null (not error)
// This is graceful handling, not an error condition
// Tests should verify parentSession is null when file missing

// CRITICAL: findSessionByPRD() Throws for Non-Existent PRD File
// Throws SessionFileError if PRD file doesn't exist
// This is different from non-existent session (returns null)
// Tests should distinguish between these two error cases

// GOTCHA: Hash is Computed from PRD File Content
// Hash is SHA-256 of PRD file content (not filename or path)
// First 12 characters used for session directory name
// Tests should use createHash('sha256').update(content).digest('hex').slice(0, 12)

// CRITICAL: Static Methods Don't Require Instance
// listSessions(), findLatestSession(), findSessionByPRD() are static
// Call directly on class: SessionManager.listSessions()
// No need to instantiate: new SessionManager()
// Tests should use static method invocation pattern

// CRITICAL: Session Metadata Includes mtime as createdAt
// createdAt is stats.mtime (modification time)
// Not true creation time (filesystem limitation)
// Tests should verify createdAt is a Date object

// GOTCHA: Parent Session Reference Not Validated
// parent_session.txt content is not validated
// Can reference non-existent session
// Tests should verify content is read, not validated

// CRITICAL: Temp Directory Cleanup Required
// Tests create multiple session directories
// Must cleanup all directories in afterEach()
// Use rmSync(recursive: true, force: true)

// GOTCHA: Integration Tests Use Real Filesystem
// Most tests use real temp directories with real fs operations
// Don't mock fs for normal operation tests
// Use mkdtempSync() for unique temp directories

// CRITICAL: Previous PRP (P2.M1.T2.S2) Tests Status Updates
// Status propagation tests validate updateItemStatus()
// This PRP (P2.M1.T2.S3) tests session discovery
// Tests are complementary (discovery + updates = complete workflow)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing session discovery methods with real filesystem operations and multiple session fixtures.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY tests/integration/core/session-manager.test.ts exists
  - CHECK: File exists (created by P2.M1.T1.S1 and extended by P2.M1.T1.S2, P2.M1.T1.S3, P2.M1.T2.S1, P2.M1.T2.S2)
  - READ: Existing test file to understand structure
  - IDENTIFY: Where to add new describe() block (after status propagation tests)
  - DEPENDENCIES: P2.M1.T2.S2 completion (status propagation tests passing)
  - PLACEMENT: tests/integration/core/session-manager.test.ts

Task 2: READ SessionManager session discovery implementation
  - FILE: src/core/session-manager.ts
  - READ: Lines 827-891 (listSessions method)
  - READ: Lines 893-924 (findLatestSession method)
  - READ: Lines 926-998 (findSessionByPRD method)
  - READ: Lines 772-801 (__scanSessionDirectories helper)
  - READ: Lines 814-825 (__readParentSession helper)
  - READ: Line 63 (SESSION_DIR_PATTERN regex)
  - UNDERSTAND: Static method invocation pattern
  - UNDERSTAND: Hash computation and matching logic
  - DEPENDENCIES: None

Task 3: CREATE session fixture helper functions
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: createSessionDirectory() helper to create valid session directories
  - ADD: createMultipleSessions() helper to create multiple session fixtures
  - ADD: computePRDHash() helper to get predictable hashes
  - PATTERN: Follow existing fixture helper structure
  - DEPENDENCIES: Task 2
  - PLACEMENT: Before describe() blocks (after existing fixtures)

Task 4: CREATE describe() block for session discovery tests
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: describe('SessionManager Session Discovery Methods', () => { ... })
  - ADD: beforeEach() to create unique temp directory
  - ADD: afterEach() to cleanup temp directory
  - PATTERN: Follow existing describe() block structure
  - DEPENDENCIES: Task 3

Task 5: IMPLEMENT Test 1 - listSessions() returns all sessions in sequence order
  - CREATE: it('should return all sessions sorted by sequence ascending', async () => { ... })
  - SETUP: Create 3 sessions with different sequence numbers
  - EXECUTE: Call SessionManager.listSessions(planDir)
  - VERIFY: Returns 3 sessions
  - VERIFY: Sorted by sequence ascending (001, 002, 003)
  - VERIFY: Metadata populated (id, hash, path, createdAt)
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 2 - listSessions() returns empty array for non-existent plan directory
  - CREATE: it('should return empty array for non-existent plan directory', async () => { ... })
  - SETUP: Don't create plan directory (or use non-existent path)
  - EXECUTE: Call SessionManager.listSessions(nonExistentDir)
  - VERIFY: Returns empty array (not error)
  - VERIFY: No exception thrown
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 3 - listSessions() returns empty array for empty plan directory
  - CREATE: it('should return empty array for empty plan directory', async () => { ... })
  - SETUP: Create plan directory with no sessions
  - EXECUTE: Call SessionManager.listSessions(planDir)
  - VERIFY: Returns empty array (not error)
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 4 - listSessions() includes parentSession when parent_session.txt exists
  - CREATE: it('should include parentSession when parent_session.txt exists', async () => { ... })
  - SETUP: Create session with parent_session.txt
  - EXECUTE: Call SessionManager.listSessions(planDir)
  - VERIFY: parentSession field populated with content from file
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 5 - findLatestSession() returns session with highest sequence number
  - CREATE: it('should return session with highest sequence number', async () => { ... })
  - SETUP: Create 3 sessions (001, 002, 003)
  - EXECUTE: Call SessionManager.findLatestSession(planDir)
  - VERIFY: Returns session with sequence 003
  - VERIFY: Not null (sessions exist)
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Test 6 - findLatestSession() returns null for empty plan directory
  - CREATE: it('should return null for empty plan directory', async () => { ... })
  - SETUP: Create empty plan directory
  - EXECUTE: Call SessionManager.findLatestSession(planDir)
  - VERIFY: Returns null (not error)
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 7 - findSessionByPRD() returns matching session for exact hash
  - CREATE: it('should return matching session for exact PRD hash', async () => { ... })
  - SETUP: Create PRD file with known content
  - SETUP: Create session directory with matching hash
  - EXECUTE: Call SessionManager.findSessionByPRD(prdPath, planDir)
  - VERIFY: Returns session with matching hash
  - VERIFY: Hash is first 12 chars of SHA-256
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 8 - findSessionByPRD() returns null for non-existent hash
  - CREATE: it('should return null for non-existent PRD hash', async () => { ... })
  - SETUP: Create PRD file with known content
  - SETUP: Create session with DIFFERENT hash
  - EXECUTE: Call SessionManager.findSessionByPRD(prdPath, planDir)
  - VERIFY: Returns null (not error)
  - VERIFY: Hash doesn't match any session
  - DEPENDENCIES: Task 11

Task 13: IMPLEMENT Test 9 - findSessionByPRD() throws for non-existent PRD file
  - CREATE: it('should throw SessionFileError for non-existent PRD file', async () => { ... })
  - SETUP: Don't create PRD file (use non-existent path)
  - EXECUTE: Call SessionManager.findSessionByPRD(nonExistentPRD, planDir)
  - VERIFY: Throws SessionFileError
  - DEPENDENCIES: Task 12

Task 14: IMPLEMENT Test 10 - Session metadata correctly populated
  - CREATE: it('should populate all metadata fields correctly', async () => { ... })
  - SETUP: Create session with all files (tasks.json, prd_snapshot.md, parent_session.txt)
  - EXECUTE: Call SessionManager.listSessions(planDir)
  - VERIFY: id matches directory name
  - VERIFY: hash matches directory hash
  - VERIFY: path is absolute path to session
  - VERIFY: createdAt is Date object
  - VERIFY: parentSession matches file content (or null)
  - DEPENDENCIES: Task 13

Task 15: RUN tests and verify all pass
  - RUN: npm test -- tests/integration/core/session-manager.test.ts
  - VERIFY: All discovery tests pass
  - VERIFY: No side effects on actual plan/ directory
  - VERIFY: Temp directories cleaned up
  - FIX: Any failing tests
  - DEPENDENCIES: Task 14

Task 16: RUN typecheck and verify compilation
  - RUN: npm run typecheck
  - VERIFY: No TypeScript compilation errors
  - DEPENDENCIES: Task 15
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Session Fixture Helper Functions
// =============================================================================

/**
 * Creates a session directory with valid structure
 * @param planDir - Plan directory path
 * @param sequence - Session sequence number (e.g., 1, 2, 3)
 * @param hash - Session hash (12 lowercase hex chars)
 * @param hasParent - Whether to create parent_session.txt
 */
function createSessionDirectory(
  planDir: string,
  sequence: number,
  hash: string,
  hasParent: boolean = false
): string {
  const sessionName = `${String(sequence).padStart(3, '0')}_${hash}`;
  const sessionPath = join(planDir, sessionName);
  mkdirSync(sessionPath, { recursive: true });

  // Create required files
  writeFileSync(
    join(sessionPath, 'tasks.json'),
    JSON.stringify({ backlog: [] }, null, 2),
    'utf-8'
  );
  writeFileSync(
    join(sessionPath, 'prd_snapshot.md'),
    '# Test PRD',
    'utf-8'
  );

  // Optional parent session file
  if (hasParent) {
    const parentSeq = String(sequence - 1).padStart(3, '0');
    writeFileSync(
      join(sessionPath, 'parent_session.txt'),
      `${parentSeq}_abc123def456`,
      'utf-8'
    );
  }

  return sessionName;
}

/**
 * Creates multiple session directories for testing
 * @param planDir - Plan directory path
 * @param count - Number of sessions to create
 * @returns Array of session names
 */
function createMultipleSessions(planDir: string, count: number): string[] {
  const sessions: string[] = [];
  for (let i = 1; i <= count; i++) {
    const hash = `abcdef123456${String(i).padStart(6, '0')}`.slice(0, 12);
    const sessionName = createSessionDirectory(planDir, i, hash, i > 1);
    sessions.push(sessionName);
  }
  return sessions;
}

/**
 * Computes SHA-256 hash of content (first 12 chars)
 * @param content - PRD content to hash
 * @returns First 12 characters of SHA-256 hash
 */
function computePRDHash(content: string): string {
  return createHash('sha256')
    .update(content, 'utf-8')
    .digest('hex')
    .slice(0, 12);
}

// =============================================================================
// PATTERN: Test 1 - listSessions() Returns All Sessions Sorted
// =============================================================================

describe('SessionManager Session Discovery Methods', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-discovery-test-'));
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - listSessions() Returns All Sessions Sorted
  // =============================================================================

  it('should return all sessions sorted by sequence ascending', async () => {
    // SETUP: Create 3 sessions with different sequence numbers
    const sessionNames = createMultipleSessions(planDir, 3);

    // EXECUTE: List all sessions
    const sessions = await SessionManager.listSessions(planDir);

    // VERIFY: Returns 3 sessions
    expect(sessions).toHaveLength(3);

    // VERIFY: Sorted by sequence ascending
    expect(sessions[0].id).toBe(sessionNames[0]); // 001_*
    expect(sessions[1].id).toBe(sessionNames[1]); // 002_*
    expect(sessions[2].id).toBe(sessionNames[2]); // 003_*

    // VERIFY: Metadata populated
    expect(sessions[0].id).toMatch(/^\d{3}_[a-f0-9]{12}$/);
    expect(sessions[0].hash).toMatch(/^[a-f0-9]{12}$/);
    expect(sessions[0].path).toBeDefined();
    expect(sessions[0].createdAt).toBeInstanceOf(Date);
  });

  // =============================================================================
  // PATTERN: Test 5 - findLatestSession() Returns Highest Sequence
  // =============================================================================

  it('should return session with highest sequence number', async () => {
    // SETUP: Create 3 sessions
    const sessionNames = createMultipleSessions(planDir, 3);
    const expectedLatest = sessionNames[2]; // 003_*

    // EXECUTE: Find latest session
    const latest = await SessionManager.findLatestSession(planDir);

    // VERIFY: Returns session 003
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe(expectedLatest);
  });

  // =============================================================================
  // PATTERN: Test 7 - findSessionByPRD() Returns Matching Session
  // =============================================================================

  it('should return matching session for exact PRD hash', async () => {
    // SETUP: Create PRD file with known content
    const prdPath = join(tempDir, 'PRD.md');
    const prdContent = '# Test PRD\n\nThis is a test PRD.';
    writeFileSync(prdPath, prdContent, 'utf-8');

    // SETUP: Create session with matching hash
    const hash = computePRDHash(prdContent);
    createSessionDirectory(planDir, 1, hash);

    // EXECUTE: Find session by PRD
    const session = await SessionManager.findSessionByPRD(prdPath, planDir);

    // VERIFY: Returns matching session
    expect(session).not.toBeNull();
    expect(session!.hash).toBe(hash);
    expect(session!.id).toBe(`001_${hash}`);
  });

  // Additional tests follow similar patterns...
});
```

---

### Integration Points

```yaml
INPUT FROM P2.M1.T2.S2 (STATUS PROPAGATION TESTS):
  - tests/integration/core/session-manager.test.ts extended with status propagation tests
  - Pattern: Temp directory setup, describe/it structure
  - Pattern: SETUP/EXECUTE/VERIFY comment structure
  - This PRP: EXTENDS with session discovery tests
  - This PRP: Tests session listing and lookup (P2.M1.T2.S2 tests status updates)

INPUT FROM SESSIONMANAGER DISCOVERY METHODS:
  - src/core/session-manager.ts has listSessions() (827-891)
  - src/core/session-manager.ts has findLatestSession() (893-924)
  - src/core/session-manager.ts has findSessionByPRD() (926-998)
  - Pattern: Static methods (no instantiation required)
  - Pattern: Hash-based matching (first 12 chars of SHA-256)
  - This PRP: Tests validate actual behavior

INPUT FROM SESSION DIRECTORY PATTERN:
  - src/core/session-manager.ts has SESSION_DIR_PATTERN (63)
  - Pattern: {sequence}_{hash} format
  - Pattern: 3-digit sequence, 12-char hash
  - This PRP: Tests verify pattern matching works correctly

OUTPUT FOR SUBSEQUENT WORK:
  - Integration tests for session discovery methods
  - Confidence that session listing works for CLI tools
  - Foundation for CLI session selection functionality
  - Validation of sorting and filtering logic

DIRECTORY STRUCTURE:
  - Extend: tests/integration/core/session-manager.test.ts
  - Add: New describe() block for session discovery tests
  - Add: Session fixture helper functions
  - No modifications to existing tests
  - Tests can run independently

CLEANUP INTEGRATION:
  - Temp directories cleaned up in afterEach()
  - No side effects on actual plan/ directory
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After extending session-manager.test.ts
# Run tests to check for errors
npm test -- tests/integration/core/session-manager.test.ts

# Expected: Tests run without syntax errors
# Expected: New test descriptions appear in output

# TypeScript compilation check
npm run typecheck

# Expected: No TypeScript compilation errors
# Expected: New test code compiles correctly

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the extended integration test file
npm test -- tests/integration/core/session-manager.test.ts

# Expected: All tests pass (including new discovery tests)
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run all integration tests
npm test -- tests/integration/

# Expected: All integration tests pass
# Expected: No regressions in other integration test files

# Coverage validation
npm run test:coverage

# Expected: Coverage for SessionManager discovery methods increases
# Expected: New discovery code paths covered
# Expected: No uncovered lines in discovery logic

# If tests fail, check:
# - Temp directory cleanup works
# - Session directories match pattern /^\d{3}_[a-f0-9]{12}$/
# - File paths are correct (use resolve() for absolute paths)
# - Hash computation matches expected (first 12 chars of SHA-256)
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite run
npm test

# Expected: All tests pass across entire codebase
# Expected: No new test failures
# Expected: Unit tests still pass (no regressions)

# Verify no side effects on actual plan/ directory
ls -la plan/

# Expected: Only expected session directories exist
# Expected: No test artifacts in production plan/

# Verify temp directory cleanup
ls -la /tmp/ | grep session-discovery-test

# Expected: No leftover temp directories (all cleaned up)

# Manual verification: Read test output
npm test -- tests/integration/core/session-manager.test.ts --reporter=verbose

# Expected: Clear test names showing discovery scenarios
# Expected: Tests grouped by describe blocks
```

### Level 4: Real-World Validation (Scenario Testing)

```bash
# Scenario 1: CLI session listing simulation
node -e "
import { SessionManager } from './src/core/session-manager.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const tempDir = mkdtempSync(join(tmpdir(), 'cli-sim-'));
const planDir = join(tempDir, 'plan');
mkdirSync(planDir);

// Create 3 sessions
for (let i = 1; i <= 3; i++) {
  const sessionName = \`00\${i}_abcdef123456\`;
  const sessionPath = join(planDir, sessionName);
  mkdirSync(sessionPath);
  writeFileSync(join(sessionPath, 'tasks.json'), JSON.stringify({ backlog: [] }));
  writeFileSync(join(sessionPath, 'prd_snapshot.md'), '# PRD');
}

// List sessions
const sessions = await SessionManager.listSessions(planDir);
console.log('Sessions:', sessions.map(s => s.id));

// Find latest
const latest = await SessionManager.findLatestSession(planDir);
console.log('Latest:', latest?.id);

// Cleanup
rmSync(tempDir, { recursive: true, force: true });
"

# Expected output:
# Sessions: [ '001_abcdef123456', '002_abcdef123456', '003_abcdef123456' ]
# Latest: 003_abcdef123456

# Scenario 2: Hash-based session lookup
node -e "
import { SessionManager } from './src/core/session-manager.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const tempDir = mkdtempSync(join(tmpdir(), 'hash-lookup-'));
const planDir = join(tempDir, 'plan');
mkdirSync(planDir);

// Create PRD
const prdPath = join(tempDir, 'PRD.md');
const prdContent = '# Test PRD';
writeFileSync(prdPath, prdContent);

// Compute hash
const hash = createHash('sha256').update(prdContent).digest('hex').slice(0, 12);

// Create session with matching hash
const sessionPath = join(planDir, \`001_\${hash}\`);
mkdirSync(sessionPath);
writeFileSync(join(sessionPath, 'tasks.json'), JSON.stringify({ backlog: [] }));
writeFileSync(join(sessionPath, 'prd_snapshot.md'), prdContent);

// Find by PRD
const session = await SessionManager.findSessionByPRD(prdPath, planDir);
console.log('Found:', session?.id);
console.log('Hash matches:', session?.hash === hash);

// Cleanup
rmSync(tempDir, { recursive: true, force: true });
"

# Expected output:
# Found: 001_{actual hash}
# Hash matches: true
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: listSessions() returns all sessions sorted
- [ ] Test 2: listSessions() returns empty array for non-existent directory
- [ ] Test 3: listSessions() returns empty array for empty directory
- [ ] Test 4: listSessions() includes parentSession when file exists
- [ ] Test 5: findLatestSession() returns highest sequence session
- [ ] Test 6: findLatestSession() returns null for empty directory
- [ ] Test 7: findSessionByPRD() returns matching session
- [ ] Test 8: findSessionByPRD() returns null for non-existent hash
- [ ] Test 9: findSessionByPRD() throws for non-existent PRD file
- [ ] Test 10: Session metadata correctly populated
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No side effects on production plan/ directory
- [ ] Temp directories cleaned up after tests

### Feature Validation

- [ ] listSessions() sorts by sequence ascending (not lexicographic)
- [ ] findLatestSession() returns highest sequence (last element)
- [ ] findSessionByPRD() uses first 12 chars of SHA-256
- [ ] Empty plan directory returns empty array/null
- [ ] Non-existent plan directory returns empty array/null
- [ ] Parent session reference loaded when file exists
- [ ] Session metadata fields all populated correctly
- [ ] Static methods callable without instantiation

### Code Quality Validation

- [ ] Follows existing integration test patterns
- [ ] Uses SETUP/EXECUTE/VERIFY comment structure
- [ ] Uses describe/it block structure
- [ ] Tests are self-documenting with clear names
- [ ] Temp directories isolated per test
- [ ] Cleanup in afterEach() with force: true
- [ ] Error messages are clear and informative
- [ ] Tests are grouped in logical describe blocks
- [ ] Uses .js extensions for ESM imports
- [ ] No side effects on production code
- [ ] Fixture helpers follow existing patterns
- [ ] Tests use static method invocation (no instantiation)

### Documentation & Deployment

- [ ] Tests serve as executable documentation of discovery behavior
- [ ] Sorting behavior documented (sequence ascending)
- [ ] Hash matching behavior documented (first 12 chars)
- [ ] Empty/null handling documented
- [ ] Integration with P2.M1.T2.S2 status propagation tests clear
- [ ] Foundation for CLI session selection functionality

---

## Anti-Patterns to Avoid

- **Don't test with instance methods** - Discovery methods are static, call directly on class
- **Don't skip temp directory cleanup** - Must use afterEach() with rmSync()
- **Don't use global state** - Each test must use unique temp directory
- **Don't forget .js extensions** - ESM requires .js on all imports
- **Don't test full hash** - Only first 12 chars used for matching
- **Don't assume string sorting** - Sorting is numeric by sequence number
- **Don't test status updates** - That's P2.M1.T2.S2, not this task
- **Don't test session creation** - That's P2.M1.T1.S1
- **Don't modify SessionManager code** - This is validation only, no implementation changes
- **Don't hardcode temp directory paths** - Use mkdtempSync() for uniqueness
- **Don't create invalid session names** - Must match /^\d{3}_[a-f0-9]{12}$/
- **Don't test with non-session directories** - Focus on session discovery only
- **Don't skip empty directory tests** - Edge case is important
- **Don't forget parent session file tests** - Optional but important feature

---

## Appendix: Decision Rationale

### Why test static methods differently from instance methods?

Static methods don't require class instantiation. Tests should call methods directly on the class:
- **Instance method**: `const manager = new SessionManager(); await manager.initialize();`
- **Static method**: `const sessions = await SessionManager.listSessions();`

This PRP tests static methods, so no instantiation is needed in most tests.

### Why focus on sorting behavior?

`findLatestSession()` relies on `listSessions()` sorting. If sorting fails, `findLatestSession()` returns wrong session. Tests must verify:
1. `listSessions()` sorts correctly (sequence ascending)
2. `findLatestSession()` returns last element (highest sequence)

This dependency is critical for correct behavior.

### Why separate discovery tests from status propagation tests?

P2.M1.T2.S2 tests status updates on a loaded session. This task (P2.M1.T2.S3) tests discovering sessions before loading. Separating them provides:
1. **Clear separation of concerns** - Discovery vs. state management
2. **Easier debugging** - Discovery failures vs. update failures isolated
3. **Independent development** - Tests can run in parallel
4. **Comprehensive coverage** - Together they cover complete session workflow

### Why test empty directory scenarios?

Empty directories are edge cases that handle gracefully:
- `listSessions()` returns `[]` (not error)
- `findLatestSession()` returns `null` (not error)
- `findSessionByPRD()` returns `null` for non-existent hash (not error)

These are important behaviors for CLI tools that need to handle "no sessions" scenarios.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from parallel research (2 research tasks + code analysis)
- [x] SessionManager discovery methods fully analyzed with line numbers
- [x] Session directory pattern documented
- [x] Existing integration test patterns analyzed
- [x] Fixture helper functions documented
- [x] Temp directory testing patterns researched
- [x] fs.readdir with withFileTypes patterns researched
- [x] Static method testing patterns researched
- [x] Scope boundaries defined (extend existing integration tests)
- [x] Dependency on P2.M1.T2.S2 established
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Decision rationale documented

**Risk Mitigation**:
- Extending existing test file (low risk of breaking existing tests)
- Integration tests only (no production code changes)
- Temp directory isolation (no side effects on plan/)
- Static method testing (no instantiation complexity)
- Clear acceptance criteria
- Follows established integration test patterns

**Known Risks**:
- **Fixture complexity**: Multiple session directories can be complex to create
  - Mitigation: Use helper functions with consistent naming patterns
- **Hash computation**: Must match exact implementation (first 12 chars of SHA-256)
  - Mitigation: Use computePRDHash() helper with createHash('sha256')
- **Sorting verification**: Must verify numeric sorting, not lexicographic
  - Mitigation: Tests verify sequence numbers parsed as integers

---

**END OF PRP**
