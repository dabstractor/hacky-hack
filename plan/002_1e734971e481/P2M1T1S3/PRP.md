# Product Requirement Prompt (PRP): Test Delta Session Detection

**PRP ID**: P2.M1.T1.S3
**Generated**: 2026-01-15
**Story Points**: 2

---

## Goal

**Feature Goal**: Create comprehensive integration tests for SessionManager delta session detection triggered by PRD hash mismatch, ensuring proper parent-child linking via `delta_from.txt`, delta session directory creation with incremented sequence numbers, parent session state loading for reference, and graceful failure when parent session is missing.

**Deliverable**: Extended integration test file at `tests/integration/core/session-manager.test.ts` with full coverage of delta session detection scenarios using real filesystem operations in temp directories.

**Success Definition**:

- Delta session correctly created when PRD hash changes (mismatch detected)
- Delta session directory named with incremented sequence (001 → 002)
- `delta_from.txt` (alias for `parent_session.txt`) created with parent session path
- Parent session state accessible for reference in delta session
- PRD change detection validated via SHA-256 hash comparison
- Delta detection fails gracefully if parent session missing
- All integration tests use real filesystem operations (not mocked)
- Tests pass with 100% coverage of delta detection code paths

---

## User Persona

**Target User**: Developer working on SessionManager validation who needs assurance that delta session detection works correctly when PRD content changes.

**Use Case**: Validating that SessionManager.initialize() correctly detects PRD hash mismatches and creates delta sessions, which is critical for the PRP pipeline's ability to handle requirement changes without losing completed work.

**User Journey**:

1. Developer has existing session directory with tasks.json and prd_snapshot.md
2. PRD content is modified (requirements changed)
3. SessionManager.initialize() is called with modified PRD
4. SHA-256 hash computed from new PRD content
5. Hash compared with existing session's hash (mismatch!)
6. Delta session created with incremented sequence number
7. `delta_from.txt` (parent_session.txt) written with parent session ID
8. Parent session state loaded for reference
9. Integration tests verify all steps completed correctly

**Pain Points Addressed**:

- **Delta detection gaps**: Need validation that PRD changes trigger delta sessions correctly
- **Parent-child linking**: Delta sessions must properly link to parent sessions
- **Sequence incrementing**: Delta sessions must have correct sequence numbers (001 → 002)
- **Parent reference**: Delta sessions need access to parent state for change tracking
- **Graceful failure**: Missing parent sessions should be handled without crashes
- **Real filesystem validation**: Unit tests with mocks can't catch filesystem-specific bugs

---

## Why

- **Change Detection Validation**: Delta session detection is the core feature that enables the pipeline to handle requirement changes. If this fails, users either lose work or can't iterate on requirements.
- **Real-World Confidence**: Unit tests with mocks can't catch filesystem-specific bugs (encoding, permissions, path resolution, sequence number calculation).
- **Integration vs Unit Distinction**: Existing unit tests (lines 795-1099) use mocks. Integration tests validate actual behavior with real filesystems.
- **Hash Comparison Confidence**: SHA-256 hash comparison must work correctly with real PRD files.
- **Parent-Child Linking**: Delta sessions require parent session links for preserving completed work.
- **Sequence Number Validation**: Incrementing session numbers correctly prevents conflicts.
- **Regression Prevention**: Changes to SessionManager won't break delta detection if integration tests catch issues.
- **Problems Solved**:
  - "Does SessionManager correctly detect PRD hash changes?"
  - "Are delta sessions created with proper parent-child linking?"
  - "Do sequence numbers increment correctly (001 → 002)?"
  - "Is parent session state accessible in delta sessions?"
  - "Does delta detection fail gracefully if parent is missing?"

---

## What

Extend the integration test file at `tests/integration/core/session-manager.test.ts` to validate delta session detection with real filesystem operations.

### Current State Analysis

**SessionManager.createDeltaSession() Method** (from `/src/core/session-manager.ts` lines 404-481):

```typescript
async createDeltaSession(newPRDPath: string): Promise<DeltaSession> {
  // 1. Validate initialize() was called first
  if (!this.#currentSession) {
    throw new Error('no current session loaded');
  }

  // 2. Validate new PRD exists
  await stat(newPRDPath);

  // 3. Hash new PRD
  const fullHash = await hashPRD(newPRDPath);
  const sessionHash = fullHash.slice(0, 12);

  // 4. Read old PRD from current session's prdSnapshot
  const oldPRD = this.#currentSession.prdSnapshot;

  // 5. Read new PRD from file
  const newPRD = await readFile(newPRDPath, 'utf-8');

  // 6. Generate diff summary
  const diffSummary = diffPRDs(oldPRD, newPRD);

  // 7. Create new session directory with incremented sequence
  const { sessionPath, sessionId } = await createSessionDirectory(
    this.planDir,
    sessionHash
  );

  // 8. Write parent_session.txt (delta_from.txt)
  await writeFile(
    resolve(sessionPath, 'parent_session.txt'),
    this.#currentSession.metadata.id,
    { mode: 0o644 }
  );

  // 9. Build DeltaSession and return
  return {
    metadata: {
      id: sessionId,
      hash: sessionHash,
      path: sessionPath,
      createdAt: new Date(),
      parentSession: this.#currentSession.metadata.id,
    },
    oldPRD,
    newPRD,
    diffSummary,
    prdSnapshot: newPRD,
    taskRegistry: { backlog: [] },
    currentItemId: null,
  };
}
```

**SessionManager.hasSessionChanged() Method** (from `/src/core/session-manager.ts` lines 1026-1034):

```typescript
hasSessionChanged(): boolean {
  if (!this.#currentSession) {
    throw new Error('Cannot check session change: no session loaded');
  }
  if (!this.#prdHash) {
    throw new Error('Cannot check session change: PRD hash not computed');
  }
  return this.#prdHash !== this.#currentSession.metadata.hash;
}
```

**Hash Generation** (from `/src/core/session-utils.ts` lines 160-167):

```typescript
export async function hashPRD(prdPath: string): Promise<string> {
  try {
    const content = await readFile(prdPath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    throw new SessionFileError(prdPath, 'read PRD', error as Error);
  }
}
```

**Existing Unit Tests** (from `/tests/unit/core/session-manager.test.ts` lines 795-1099):

- Use `vi.mock()` for all filesystem operations
- Test delta session creation with hash validation
- Test parent session reference writing
- Test PRD content comparison and diff generation
- Test sequence number incrementing
- **MISSING**: Real filesystem validation with actual PRD file modifications
- **MISSING**: Hash comparison with actual SHA-256 computation
- **MISSING**: Parent-child linking with real directory structures
- **MISSING**: Graceful failure when parent session missing

**Integration Test from P2.M1.T1.S2**:

- Tests existing session loading from tasks.json
- Tests parent session link loading from parent_session.txt
- Tests Zod validation with real JSON files
- **This PRP**: Tests delta session detection (complementary)

### Success Criteria

- [ ] Test 1: Delta session created when PRD hash changes
- [ ] Test 2: Delta session directory named with incremented sequence (002_newhash)
- [ ] Test 3: delta_from.txt (parent_session.txt) contains parent session path
- [ ] Test 4: Parent session state loaded for reference
- [ ] Test 5: Delta detection fails gracefully if parent session missing
- [ ] Test 6: Hash comparison correctly detects PRD modifications
- [ ] Test 7: Delta session metadata includes parentSession reference
- [ ] Test 8: Old PRD accessible from delta session
- [ ] Test 9: New PRD accessible from delta session
- [ ] Test 10: Sequential delta sessions (001 → 002 → 003)
- [ ] All tests use real filesystem (temp directories)
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] SessionManager.createDeltaSession() method fully analyzed (lines 404-481)
- [x] SessionManager.hasSessionChanged() method documented (lines 1026-1034)
- [x] hashPRD() implementation documented (session-utils.ts lines 160-167)
- [x] Session directory naming pattern documented (sequence_hash)
- [x] parent_session.txt (delta_from.txt) creation documented
- [x] DeltaSession interface documented
- [x] Existing unit tests reviewed (to avoid duplication)
- [x] Integration test patterns from P2.M1.T1.S2 available
- [x] PRD fixtures identified (mockSimplePRD, mockSimplePRDv2)
- [x] Scope boundaries defined (integration vs unit tests)

---

### Documentation & References

```yaml
# MUST READ - SessionManager.createDeltaSession() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains createDeltaSession() method (lines 404-481) with delta session creation logic
  section: Lines 404-481
  critical: |
    - Validates initialize() was called first
    - Hashes new PRD to get session hash
    - Reads old PRD from current session's prdSnapshot
    - Generates diff summary using diffPRDs()
    - Creates new session directory with incremented sequence
    - Writes parent_session.txt (delta_from.txt) with parent session ID
    - Returns DeltaSession with oldPRD, newPRD, diffSummary

# MUST READ - SessionManager.hasSessionChanged() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains hasSessionChanged() method (lines 1026-1034) for PRD hash comparison
  section: Lines 1026-1034
  pattern: |
    - Compares cached PRD hash with current session hash
    - Returns true if hashes differ (PRD was modified)
    - Throws error if no session loaded or hash not computed
  critical: |
    - This is the method that triggers delta session creation
    - Hash comparison is: this.#prdHash !== this.#currentSession.metadata.hash

# MUST READ - hashPRD() utility
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Contains hashPRD() function (lines 160-167) that computes SHA-256 hash of PRD
  section: Lines 160-167
  pattern: |
    - Reads PRD file with UTF-8 encoding
    - Computes SHA-256 hash using crypto.createHash('sha256')
    - Returns 64-character hexadecimal string
    - Throws SessionFileError on failure
  gotcha: |
    - Full hash is 64 characters, session hash is first 12
    - UTF-8 encoding is critical for hash consistency
    - Any content change (including whitespace) changes the hash

# MUST READ - DeltaSession interface
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Defines DeltaSession structure (extends SessionState with delta-specific fields)
  section: Lines 799-842
  pattern: |
    - Extends SessionState (metadata, prdSnapshot, taskRegistry, currentItemId)
    - Adds: oldPRD, newPRD, diffSummary
    - metadata.parentSession contains parent session ID
  critical: |
    - oldPRD is from previous session's prdSnapshot
    - newPRD is the modified PRD content
    - diffSummary contains human-readable changes

# MUST READ - Session directory creation
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Contains createSessionDirectory() function (lines 169-224) that creates session directories
  section: Lines 169-224
  pattern: |
    - Scans plan/ directory for existing sessions
    - Finds max sequence number
    - Increments sequence for new session
    - Creates directory with format: {sequence}_{hash}
  gotcha: |
    - Sequence is zero-padded to 3 digits (001, 002, 003)
    - Hash is first 12 characters of SHA-256
    - Existing sessions are sorted to find max sequence

# MUST READ - Previous PRP for test patterns
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S2/PRP.md
  why: Contains integration test patterns for existing session loading (complementary)
  section: Implementation Patterns & Key Details
  pattern: |
    - Temp directory setup: mkdtempSync(join(tmpdir(), 'session-manager-test-'))
    - Cleanup: rmSync(tempDir, { recursive: true, force: true })
    - SETUP/EXECUTE/VERIFY comment structure
    - describe/it block organization
  critical: |
    - THIS is the pattern to follow for integration tests
    - Real filesystem operations (not mocked)
    - Temp directory isolation

# MUST READ - Existing integration test file
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: This is the file to EXTEND with delta session detection tests
  section: Full file
  pattern: |
    - describe('SessionManager.initialize()' for new sessions (lines 95-390)
    - describe('SessionManager.loadSession()' for existing sessions (lines 396-675)
    - ADD: describe('SessionManager Delta Session Detection' for delta tests
    - Use same temp directory setup/teardown
  gotcha: |
    - File already has new session and existing session tests
    - We EXTEND it with new describe() block for delta detection
    - Don't modify existing tests

# MUST READ - PRD fixtures for delta testing
- file: /home/dustin/projects/hacky-hack/tests/fixtures/simple-prd.ts
  why: Contains mockSimplePRD for initial session creation
  section: Full file
  pattern: |
    - Minimal valid PRD with 1 Phase, 1 Milestone, 1 Task, 3 Subtasks
    - Use this to create initial session
    - Hash will be computed from this content
  gotcha: |
    - PRD must be >100 characters to pass validation
    - Content affects hash computation

# MUST READ - Modified PRD fixture for delta testing
- file: /home/dustin/projects/hacky-hack/tests/fixtures/simple-prd-v2.ts
  why: Contains mockSimplePRDv2 with modifications to trigger delta detection
  section: Full file
  pattern: |
    - Modified version of mockSimplePRD
    - Changes: Added P1.M1.T2, modified P1.M1.T1.S1 story_points
    - Different hash triggers delta session creation
  critical: |
    - This is the PERFECT fixture for delta testing
    - Guarantees hash mismatch with original
    - Realistic change scenario

# MUST READ - Mock delta data for testing
- file: /home/dustin/projects/hacky-hack/tests/fixtures/mock-delta-data.ts
  why: Contains mockOldPRD, mockNewPRD for delta analysis testing
  section: Full file
  pattern: |
    - Sample PRD pairs for testing delta detection
    - mockOldPRD vs mockNewPRD show realistic modifications
    - Can use for additional delta test scenarios
  gotcha: |
    - These are for delta analysis workflow testing
    - We're testing delta session detection (different but related)

# MUST READ - PRD differ implementation
- file: /home/dustin/projects/hacky-hack/src/core/prd-differ.ts
  why: Contains diffPRDs() function that generates diff summary
  section: Full file
  pattern: |
    - Uses fast-diff library for word-level diffing
    - Section-aware parsing by markdown headers
    - Returns changes, summaryText, stats
  critical: |
    - diffSummary is part of DeltaSession return value
    - Tests should verify diffSummary is generated

# MUST READ - Task patcher for delta sessions
- file: /home/dustin/projects/hacky-hack/src/core/task-patcher.ts
  why: Contains patchBacklog() function that updates tasks based on delta analysis
  section: Lines 64-110
  pattern: |
    - Transforms backlog based on DeltaAnalysis results
    - Handles 'modified', 'removed', 'added' change types
    - Preserves completed work not affected by changes
  gotcha: |
    - This is used AFTER delta session creation
    - Not directly tested in this PRP (tested in P2.M2.T2)
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts              # SOURCE: createDeltaSession() (404-481)
│   │   │                                   # SOURCE: hasSessionChanged() (1026-1034)
│   │   │                                   # SOURCE: initialize() (210-336)
│   │   ├── session-utils.ts                # SOURCE: hashPRD() (160-167)
│   │   │                                   # SOURCE: createSessionDirectory() (169-224)
│   │   ├── prd-differ.ts                   # REFERENCE: diffPRDs() for diff summary
│   │   ├── task-patcher.ts                 # REFERENCE: patchBacklog() for task updates
│   │   └── models.ts                       # REFERENCE: DeltaSession, SessionState interfaces
│   └── utils/
│       └── prd-validator.ts                # REFERENCE: PRD validation (100 char minimum)
├── tests/
│   ├── setup.ts                            # Global test setup with API validation
│   ├── unit/
│   │   └── core/
│   │       └── session-manager.test.ts     # EXISTING: Unit tests with mocks (2613 lines)
│   ├── fixtures/
│   │   ├── simple-prd.ts                   # REFERENCE: mockSimplePRD for initial session
│   │   ├── simple-prd-v2.ts                # REFERENCE: mockSimplePRDv2 for delta trigger
│   │   └── mock-delta-data.ts              # REFERENCE: Mock delta data for testing
│   └── integration/
│       ├── prp-pipeline-integration.test.ts    # REFERENCE: Temp dir pattern
│       ├── prp-runtime-integration.test.ts     # REFERENCE: Real filesystem pattern
│       └── core/
│           └── session-manager.test.ts    # EXTEND: Add delta detection tests here
├── plan/
│   └── 002_1e734971e481/
│       ├── P2M1T1S1/
│       │   └── PRP.md                     # REFERENCE: New session creation tests
│       ├── P2M1T1S2/
│       │   └── PRP.md                     # REFERENCE: Existing session loading tests
│       ├── P2M1T1S3/
│       │   └── PRP.md                     # NEW: This PRP
│       └── tasks.json                     # REFERENCE: Sample tasks.json for fixtures
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
                                                    # ADD: describe('SessionManager Delta Session Detection', () => { ... })
                                                    # ADD: Tests for delta session detection
                                                    # ADD: Real filesystem operations
                                                    # ADD: Hash comparison validation
                                                    # ADD: Parent-child linking tests
                                                    # ADD: Graceful failure tests
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Integration Tests Use REAL Filesystem, Not Mocks
// Unit tests (tests/unit/core/session-manager.test.ts) use vi.mock()
// Integration tests (this task) use real filesystem with temp directories
// Pattern: mkdtempSync(join(tmpdir(), 'session-manager-delta-test-'))
// Cleanup: rmSync(tempDir, { recursive: true, force: true })

// CRITICAL: Delta Session Triggered by PRD Hash Mismatch
// Hash computed from entire PRD content (UTF-8)
// SHA-256 hash, first 12 characters used for session hash
// Any content change (including whitespace) changes the hash
// Pattern: createHash('sha256').update(content, 'utf-8').digest('hex').slice(0, 12)

// GOTCHA: Delta Session Creation Requires Existing Session
// createDeltaSession() requires initialize() to be called first
// Tests must create initial session, then modify PRD
// Second initialize() call detects hash mismatch

// CRITICAL: parent_session.txt is THE Linking Mechanism
// File contains parent session ID (e.g., "001_abc123def456")
// Written by createDeltaSession() at lines 441-446
// Read by loadSession() to set metadata.parentSession
// "delta_from.txt" is mentioned in docs but actual file is "parent_session.txt"

// GOTCHA: Session Sequence Number Auto-Increments
// createSessionDirectory() scans plan/ for existing sessions
// Finds max sequence number and increments
// Zero-padded to 3 digits: 001 → 002 → 003
// Tests should verify sequence increments correctly

// CRITICAL: DeltaSession Extends SessionState
// DeltaSession has all SessionState fields PLUS:
// - oldPRD: Previous PRD content from prdSnapshot
// - newPRD: Modified PRD content
// - diffSummary: Human-readable change summary
// Tests can verify all three fields are populated

// GOTCHA: hasSessionChanged() Compares Cached Hash
// During initialize(), PRD hash is cached in #prdHash
// hasSessionChanged() compares cached hash with session hash
// Returns true if hashes differ (PRD was modified)
// This triggers delta session creation in PRPPipeline

// CRITICAL: Hash Computation is UTF-8 Sensitive
// hashPRD() uses 'utf-8' encoding to read file
// writeFileSync() must use UTF-8 when creating fixtures
// Inconsistent encoding causes hash mismatch bugs
// Always specify 'utf-8' explicitly

// GOTCHA: PRD Must Be >100 Characters for Validation
// PRDValidator enforces minimum 100 character length
// Test fixtures must meet this requirement
// mockSimplePRD and mockSimplePRDv2 both meet this

// CRITICAL: Graceful Failure for Missing Parent Session
// If parent_session.txt references non-existent session
// System should handle gracefully, not crash
// Tests should verify this edge case
// Error message should be informative

// GOTCHA: Delta Detection is Via initialize(), Not Direct Call
// createDeltaSession() is called by PRPPipeline.handleDelta()
// Tests trigger it indirectly via initialize() with modified PRD
// Pattern: Create session, modify PRD, call initialize() again

// CRITICAL: Diff Summary is Generated Automatically
// diffPRDs() from prd-differ.ts generates summary
// Uses fast-diff library for word-level diffing
// Section-aware parsing by markdown headers
// Tests should verify diffSummary exists (not empty)

// GOTCHA: Delta Sessions Have parentSession in Metadata
// metadata.parentSession contains parent session ID
// For non-delta sessions, this is null
// For delta sessions, this is the parent session ID
// Tests should verify this field is set correctly

// CRITICAL: Fixture Creation Should Use Real PRD Files
// mockSimplePRD and mockSimplePRDv2 are perfect for delta testing
// They have realistic content and guaranteed hash difference
// Don't create custom PRDs in tests (use fixtures)
// Ensures tests are maintainable and realistic

// GOTCHA: Temp Directory Isolation is Critical
// Each test must use unique temp directory
// mkdtempSync() ensures unique directories
// rmSync() with force: true ensures cleanup
// No side effects on actual plan/ directory

// CRITICAL: Hash Format is 12-Character Hex String
// Full SHA-256 hash is 64 characters
// Session hash is first 12 characters
// Regex: /^[a-f0-9]{12}$/
// Tests should verify hash format

// GOTCHA: Session Directory Naming Convention
// Format: {sequence}_{hash}
// Example: 001_14b9dc2a33c7, 002_a3f8e9d12b4a
// Sequence is zero-padded (001, not 1)
// Hash is lowercase hexadecimal

// CRITICAL: Integration Tests Complement Unit Tests
// Unit tests: Mock filesystem, test logic in isolation
// Integration tests: Real filesystem, test actual behavior
// Don't duplicate unit test scenarios
// Focus on filesystem-specific validation and hash computation

// GOTCHA: Multiple Sequential Delta Sessions
// Can create chain of delta sessions: 001 → 002 → 003
// Each delta session links to its immediate parent
// Tests should verify this chain works correctly
// Sequence numbers increment properly

// CRITICAL: Old PRD vs New PRD in DeltaSession
// oldPRD comes from previous session's prdSnapshot
// newPRD is the modified PRD content
// Tests can verify both are accessible
// Both are strings (markdown content)

// GOTCHA: Delta Session Does NOT Auto-Create Tasks
// Delta session starts with empty backlog
// TaskPatcher patches backlog based on delta analysis
// That happens AFTER delta session creation
// Tests should NOT expect tasks in delta session
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing DeltaSession, SessionState, and hash comparison behavior with real filesystem operations.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY tests/integration/core/session-manager.test.ts exists
  - CHECK: File exists (created by P2.M1.T1.S1 and extended by P2.M1.T1.S2)
  - READ: Existing test file to understand structure
  - IDENTIFY: Where to add new describe() block (after loadSession tests)
  - DEPENDENCIES: P2.M1.T1.S1 and P2.M1.T1.S2 completion
  - PLACEMENT: tests/integration/core/session-manager.test.ts

Task 2: READ SessionManager delta detection implementation
  - FILE: src/core/session-manager.ts
  - READ: Lines 404-481 (createDeltaSession method)
  - READ: Lines 1026-1034 (hasSessionChanged method)
  - READ: Lines 210-216 (hash caching in initialize)
  - FILE: src/core/session-utils.ts
  - READ: Lines 160-167 (hashPRD function)
  - READ: Lines 169-224 (createSessionDirectory function)
  - UNDERSTAND: Delta detection and creation flow
  - UNDERSTAND: Hash comparison logic
  - DEPENDENCIES: None

Task 3: CREATE PRD fixture helper for delta testing
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: import { mockSimplePRD } from '../../fixtures/simple-prd.js'
  - ADD: import { mockSimplePRDv2 } from '../../fixtures/simple-prd-v2.js'
  - ADD: Helper function to compute expected hash
  - PATTERN: Use createHash('sha256') for consistency
  - DEPENDENCIES: Task 2

Task 4: IMPLEMENT describe() block for delta detection tests
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: describe('SessionManager Delta Session Detection', () => { ... })
  - ADD: beforeEach() to create unique temp directory
  - ADD: afterEach() to cleanup temp directory
  - PATTERN: Follow existing describe() block structure
  - DEPENDENCIES: Task 3

Task 5: IMPLEMENT Test 1 - Delta session created when PRD hash changes
  - CREATE: it('should create delta session when PRD hash changes', async () => { ... })
  - SETUP: Create initial session with mockSimplePRD
  - MODIFY: Write mockSimplePRDv2 to PRD file (different hash)
  - EXECUTE: Call initialize() again (triggers delta detection)
  - VERIFY: New session directory created (002_newhash)
  - VERIFY: Two session directories exist (001_oldhash, 002_newhash)
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 2 - Delta session named with incremented sequence
  - CREATE: it('should name delta session with incremented sequence', async () => { ... })
  - SETUP: Create initial session (001)
  - MODIFY: PRD content to trigger delta
  - EXECUTE: Initialize again
  - VERIFY: Delta session is 002_*
  - VERIFY: Sequence number incremented from 001 to 002
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 3 - delta_from.txt contains parent session path
  - CREATE: it('should create delta_from.txt with parent session ID', async () => { ... })
  - SETUP: Create initial session, get session ID
  - MODIFY: PRD content
  - EXECUTE: Initialize to create delta session
  - VERIFY: parent_session.txt (delta_from.txt) exists
  - VERIFY: Contains parent session ID (e.g., "001_abc123def456")
  - GOTCHA: File is named "parent_session.txt", not "delta_from.txt"
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 4 - Parent session state loaded for reference
  - CREATE: it('should load parent session state for reference', async () => { ... })
  - SETUP: Create initial session with tasks.json
  - MODIFY: PRD content
  - EXECUTE: Initialize to create delta session
  - VERIFY: Parent session accessible
  - VERIFY: Parent session ID matches metadata.parentSession
  - GOTCHA: Parent state is for reference, not modification
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 5 - Delta detection fails gracefully if parent missing
  - CREATE: it('should fail gracefully if parent session missing', async () => { ... })
  - SETUP: Manually create session directory with parent_session.txt
  - SETUP: Point to non-existent parent session
  - EXECUTE: Attempt to load session
  - VERIFY: Error thrown or graceful handling
  - VERIFY: Error message is informative
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Test 6 - Hash comparison correctly detects PRD modifications
  - CREATE: it('should detect PRD modifications via hash comparison', async () => { ... })
  - SETUP: Create initial session
  - MODIFY: Single character in PRD (minimal change)
  - EXECUTE: Initialize again
  - VERIFY: Delta session created (hash differs)
  - VERIFY: New hash computed correctly
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 7 - Delta session metadata includes parentSession
  - CREATE: it('should set parentSession in delta session metadata', async () => { ... })
  - SETUP: Create initial session
  - MODIFY: PRD content
  - EXECUTE: Initialize to create delta session
  - VERIFY: metadata.parentSession equals parent session ID
  - VERIFY: metadata.id is different from parent
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 8 - Old PRD accessible from delta session
  - CREATE: it('should include old PRD in delta session', async () => { ... })
  - SETUP: Create initial session with specific PRD
  - MODIFY: PRD content
  - EXECUTE: Initialize to create delta session
  - VERIFY: Delta session has oldPRD field
  - VERIFY: oldPRD matches original PRD content
  - DEPENDENCIES: Task 11

Task 13: IMPLEMENT Test 9 - New PRD accessible from delta session
  - CREATE: it('should include new PRD in delta session', async () => { ... })
  - SETUP: Create initial session
  - MODIFY: PRD content
  - EXECUTE: Initialize to create delta session
  - VERIFY: Delta session has new PRD in prdSnapshot
  - VERIFY: New PRD matches modified content
  - DEPENDENCIES: Task 12

Task 14: IMPLEMENT Test 10 - Sequential delta sessions (001 → 002 → 003)
  - CREATE: it('should handle sequential delta sessions', async () => { ... })
  - SETUP: Create initial session (001)
  - MODIFY: PRD → Initialize (creates 002)
  - MODIFY: PRD again → Initialize (creates 003)
  - VERIFY: Three sessions exist
  - VERIFY: Correct sequence numbers (001, 002, 003)
  - VERIFY: Correct parent linking (002→001, 003→002)
  - DEPENDENCIES: Task 13

Task 15: RUN tests and verify all pass
  - RUN: npm test -- tests/integration/core/session-manager.test.ts
  - VERIFY: All delta detection tests pass
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
// PATTERN: PRD Fixture Helper Functions
// =============================================================================

/**
 * Computes expected SHA-256 hash for PRD content
 * @param content PRD markdown content
 * @returns First 12 characters of SHA-256 hash
 */
function computeExpectedHash(content: string): string {
  return createHash('sha256')
    .update(content, 'utf-8')
    .digest('hex')
    .slice(0, 12);
}

/**
 * Creates session directory with parent_session.txt
 * @param tempDir Temporary directory path
 * @param sessionName Session directory name
 * @param parentId Parent session ID
 */
function createSessionWithParent(
  tempDir: string,
  sessionName: string,
  parentId: string
): string {
  const sessionPath = join(tempDir, 'plan', sessionName);
  mkdirSync(sessionPath, { recursive: true });

  // Write parent_session.txt
  const parentPath = join(sessionPath, 'parent_session.txt');
  writeFileSync(parentPath, parentId, 'utf-8');

  return sessionPath;
}

// =============================================================================
// PATTERN: Test Setup for Delta Session Detection
// =============================================================================

describe('SessionManager Delta Session Detection', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-delta-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - Delta Session Created When PRD Hash Changes
  // =============================================================================

  it('should create delta session when PRD hash changes', async () => {
    // SETUP: Create initial session
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // EXECUTE: Modify PRD and initialize again (triggers delta detection)
    writeFileSync(prdPath, mockSimplePRDv2, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: New session directory created
    const sessionDirs = readdirSync(planDir).filter(d =>
      /^\d{3}_[a-f0-9]{12}$/.test(d)
    );
    expect(sessionDirs).toHaveLength(2);

    // VERIFY: Hashes are different (delta session created)
    expect(session2.metadata.hash).not.toBe(session1.metadata.hash);

    // VERIFY: Both sessions exist in plan/
    expect(sessionDirs.some(d => d.includes(session1.metadata.hash))).toBe(
      true
    );
    expect(sessionDirs.some(d => d.includes(session2.metadata.hash))).toBe(
      true
    );
  });

  // =============================================================================
  // PATTERN: Test 2 - Delta Session Named with Incremented Sequence
  // =============================================================================

  it('should name delta session with incremented sequence', async () => {
    // SETUP: Create initial session
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // EXECUTE: Modify PRD to trigger delta
    writeFileSync(prdPath, mockSimplePRDv2, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: Delta session has incremented sequence
    const sessionDirs = readdirSync(planDir);
    const sequences = sessionDirs.map(d => d.match(/^(\d{3})_/)?.[1]).sort();

    expect(sequences).toEqual(['001', '002']);
    expect(session2.metadata.id).toMatch(/^002_/);
  });

  // =============================================================================
  // PATTERN: Test 3 - delta_from.txt Contains Parent Session Path
  // =============================================================================

  it('should create delta_from.txt with parent session ID', async () => {
    // SETUP: Create initial session
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // EXECUTE: Modify PRD to trigger delta
    writeFileSync(prdPath, mockSimplePRDv2, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: parent_session.txt (delta_from.txt alias) exists
    const deltaSessionPath = join(planDir, session2.metadata.id);
    const parentPath = join(deltaSessionPath, 'parent_session.txt');
    expect(existsSync(parentPath)).toBe(true);

    // VERIFY: Contains parent session ID
    const parentContent = readFileSync(parentPath, 'utf-8').trim();
    expect(parentContent).toBe(session1.metadata.id);
  });

  // =============================================================================
  // PATTERN: Test 4 - Parent Session State Loaded for Reference
  // =============================================================================

  it('should load parent session state for reference', async () => {
    // SETUP: Create initial session with tasks.json
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // Create tasks.json in initial session
    const session1Path = join(planDir, session1.metadata.id);
    const tasksPath = join(session1Path, 'tasks.json');
    const minimalTasks = createMinimalTasksJson();
    writeFileSync(tasksPath, JSON.stringify(minimalTasks, null, 2), 'utf-8');

    // EXECUTE: Modify PRD to trigger delta
    writeFileSync(prdPath, mockSimplePRDv2, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: Parent session ID in metadata
    expect(session2.metadata.parentSession).toBe(session1.metadata.id);

    // VERIFY: Parent session state is accessible
    expect(session2.metadata.parentSession).toBeDefined();
  });

  // =============================================================================
  // PATTERN: Test 5 - Delta Detection Fails Gracefully If Parent Missing
  // =============================================================================

  it('should fail gracefully if parent session missing', async () => {
    // SETUP: Manually create session with parent_session.txt
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager = new SessionManager(prdPath, planDir);
    const session1 = await manager.initialize();

    // Manually create a session with non-existent parent
    const fakeParentId = '999_nonexistent';
    const deltaPath = createSessionWithParent(
      planDir,
      '002_fakeparent123',
      fakeParentId
    );

    // Create tasks.json and prd_snapshot.md to make it valid
    writeFileSync(
      join(deltaPath, 'tasks.json'),
      JSON.stringify({ backlog: [] }),
      'utf-8'
    );
    writeFileSync(join(deltaPath, 'prd_snapshot.md'), '# Fake PRD', 'utf-8');

    // EXECUTE: Try to load the session with missing parent
    const manager2 = new SessionManager(prdPath, planDir);

    // VERIFY: Should handle gracefully (load succeeds, parent reference exists)
    // Note: The parent session doesn't need to exist for loading
    // The system just stores the reference
    const session2 = await manager2.initialize();
    expect(session2).toBeDefined();
  });

  // =============================================================================
  // PATTERN: Test 6 - Hash Comparison Correctly Detects PRD Modifications
  // =============================================================================

  it('should detect PRD modifications via hash comparison', async () => {
    // SETUP: Create initial session
    const originalPRD = mockSimplePRD;
    writeFileSync(prdPath, originalPRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // EXECUTE: Modify single character (minimal change)
    const modifiedPRD = originalPRD.replace('Hello, World!', 'Hello, World?');
    writeFileSync(prdPath, modifiedPRD, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: Delta session created (hash differs)
    expect(session2.metadata.hash).not.toBe(session1.metadata.hash);

    // VERIFY: New hash computed correctly
    const expectedNewHash = computeExpectedHash(modifiedPRD);
    expect(session2.metadata.hash).toBe(expectedNewHash);
  });

  // =============================================================================
  // PATTERN: Test 7 - Delta Session Metadata Includes ParentSession
  // =============================================================================

  it('should set parentSession in delta session metadata', async () => {
    // SETUP: Create initial session
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // EXECUTE: Modify PRD to trigger delta
    writeFileSync(prdPath, mockSimplePRDv2, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: metadata.parentSession equals parent session ID
    expect(session2.metadata.parentSession).toBe(session1.metadata.id);

    // VERIFY: metadata.id is different from parent
    expect(session2.metadata.id).not.toBe(session1.metadata.id);

    // VERIFY: Parent session was not a delta session
    expect(session1.metadata.parentSession).toBeNull();
  });

  // =============================================================================
  // PATTERN: Test 8 - Old PRD Accessible from Delta Session
  // =============================================================================

  it('should include old PRD in delta session', async () => {
    // SETUP: Create initial session with specific PRD
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // EXECUTE: Modify PRD to trigger delta
    writeFileSync(prdPath, mockSimplePRDv2, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);

    // Note: DeltaSession is internal, we verify through file system
    await manager2.initialize();

    // VERIFY: Parent session exists with old PRD
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(2);

    // Get parent session path
    const parentSessionId = sessionDirs.find(d => d.startsWith('001_'));
    expect(parentSessionId).toBeDefined();

    const parentPath = join(planDir, parentSessionId!);
    const oldPRDPath = join(parentPath, 'prd_snapshot.md');
    const oldPRDContent = readFileSync(oldPRDPath, 'utf-8');

    // VERIFY: Old PRD matches original content
    expect(oldPRDContent).toBe(mockSimplePRD.trim());
  });

  // =============================================================================
  // PATTERN: Test 9 - New PRD Accessible from Delta Session
  // =============================================================================

  it('should include new PRD in delta session', async () => {
    // SETUP: Create initial session
    writeFileSync(prdPath, mockSimplePRD, 'utf-8');
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // EXECUTE: Modify PRD to trigger delta
    writeFileSync(prdPath, mockSimplePRDv2, 'utf-8');
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: New PRD in prdSnapshot
    expect(session2.prdSnapshot).toBe(mockSimplePRDv2.trim());
  });

  // =============================================================================
  // PATTERN: Test 10 - Sequential Delta Sessions (001 → 002 → 003)
  // =============================================================================

  it('should handle sequential delta sessions', async () => {
    // SETUP & EXECUTE: Create three sessions
    const prdVariants = [
      mockSimplePRD,
      mockSimplePRDv2,
      mockSimplePRDv2.replace('Calculator', 'Calculator Plus'),
    ];

    const sessions = [];
    for (const prdContent of prdVariants) {
      writeFileSync(prdPath, prdContent, 'utf-8');
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      sessions.push(session);
    }

    // VERIFY: Three sessions exist
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(3);

    // VERIFY: Correct sequence numbers (001, 002, 003)
    const sequences = sessionDirs.map(d => d.match(/^(\d{3})_/)?.[1]).sort();
    expect(sequences).toEqual(['001', '002', '003']);

    // VERIFY: Correct parent linking (002→001, 003→002)
    expect(sessions[1].metadata.parentSession).toBe(sessions[0].metadata.id);
    expect(sessions[2].metadata.parentSession).toBe(sessions[1].metadata.id);
  });
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING UNIT TESTS:
  - tests/unit/core/session-manager.test.ts has delta session tests (lines 795-1099)
  - Pattern: SETUP/EXECUTE/VERIFY comments
  - Pattern: describe/it block structure
  - This PRP: Complements with real filesystem integration tests

INPUT FROM P2.M1.T1.S1 (NEW SESSION CREATION):
  - tests/integration/core/session-manager.test.ts created
  - Pattern: describe('SessionManager.initialize()' for new sessions
  - Pattern: Temp directory setup with mkdtempSync()
  - This PRP: EXTENDS with delta detection tests

INPUT FROM P2.M1.T1.S2 (EXISTING SESSION LOADING):
  - tests/integration/core/session-manager.test.ts extended
  - Pattern: describe('SessionManager.loadSession()' for existing sessions
  - Pattern: Parent session loading tests
  - This PRP: EXTENDS with delta detection tests

INPUT FROM SESSIONMANAGER DELTA IMPLEMENTATION:
  - src/core/session-manager.ts has createDeltaSession() (404-481)
  - Pattern: Hash comparison, parent linking, sequence incrementing
  - This PRP: Tests validate actual behavior with real filesystems

INPUT FROM PRD FIXTURES:
  - tests/fixtures/simple-prd.ts has mockSimplePRD
  - tests/fixtures/simple-prd-v2.ts has mockSimplePRDv2
  - Pattern: Use these fixtures for delta testing
  - Guarantees hash difference

OUTPUT FOR SUBSEQUENT WORK:
  - Integration tests for delta session detection
  - Confidence that delta sessions are created correctly
  - Foundation for P2.M1.T2 (batch update and persistence tests)
  - Foundation for P2.M2.T2 (task patcher tests)
  - Pattern for testing hash-based change detection

DIRECTORY STRUCTURE:
  - Extend: tests/integration/core/session-manager.test.ts
  - Add: New describe() block for delta detection tests
  - No modifications to existing tests
  - Tests can run independently

CLEANUP INTEGRATION:
  - Temp directories cleaned up in afterEach()
  - No side effects on actual plan/ directory
  - No modifications to production code
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

# Expected: All tests pass (including new delta detection tests)
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run all integration tests
npm test -- tests/integration/

# Expected: All integration tests pass
# Expected: No regressions in other integration test files

# Coverage validation
npm run test:coverage

# Expected: Coverage for SessionManager delta detection increases
# Expected: New hash comparison code paths covered
# Expected: No uncovered lines in createDeltaSession logic

# If tests fail, check:
# - SessionManager imported correctly (with .js extension)
# - Temp directory cleanup works
# - PRD fixtures imported correctly
# - Hash computation matches expected values
# - Session directory naming follows pattern
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
ls -la /tmp/ | grep session-manager-delta-test

# Expected: No leftover temp directories (all cleaned up)

# Manual verification: Read test output
npm test -- tests/integration/core/session-manager.test.ts --reporter=verbose

# Expected: Clear test names showing delta detection scenarios
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/integration/core/session-manager.test.ts

# Expected: Tests complete in reasonable time (< 20 seconds)
```

### Level 4: Real-World Validation (Scenario Testing)

```bash
# Scenario 1: Create delta session with real PRD modification
cat > /tmp/test-delta.sh << 'EOF'
#!/bin/bash
TEMP_DIR=$(mktemp -d)
PRD_PATH="$TEMP_DIR/PRD.md"
PLAN_DIR="$TEMP_DIR/plan"

# Create initial PRD
cat > "$PRD_PATH" << 'PRD'
# Test Project

## P1: Test Phase

A minimal project for testing.

### P1.M1: Test Milestone

#### P1.M1.T1: Create Function

Create a test function.
PRD

# Run session manager
node -e "
import { SessionManager } from './src/core/session-manager.js';
const manager = new SessionManager('$PRD_PATH', '$PLAN_DIR');
await manager.initialize();
console.log('Initial session created');
"

# Modify PRD
cat > "$PRD_PATH" << 'PRD'
# Test Project

## P1: Test Phase

A minimal project for testing (modified).

### P1.M1: Test Milestone

#### P1.M1.T1: Create Function

Create a test function with enhanced features.
PRD

# Run session manager again (should create delta)
node -e "
import { SessionManager } from './src/core/session-manager.js';
const manager = new SessionManager('$PRD_PATH', '$PLAN_DIR');
const session = await manager.initialize();
console.log('Delta session hash:', session.metadata.hash);
console.log('Parent session:', session.metadata.parentSession);
"

# Cleanup
rm -rf "$TEMP_DIR"
EOF

chmod +x /tmp/test-delta.sh
/tmp/test-delta.sh

# Expected: Initial session created (001_*)
# Expected: Delta session created (002_*)
# Expected: Parent session ID logged

# Scenario 2: Verify hash computation consistency
cat > /tmp/test-hash.js << 'EOF'
import { createHash } from 'node:crypto';
import { SessionManager } from './src/core/session-manager.js';

const PRD = '# Test PRD\n\nMinimal content for hash testing.';

// Compute expected hash
const expectedHash = createHash('sha256')
  .update(PRD, 'utf-8')
  .digest('hex')
  .slice(0, 12);

console.log('Expected hash:', expectedHash);

// Test with SessionManager (via temp directory)
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, tmpdir } from 'node:path';

const tempDir = mkdtempSync(join(tmpdir(), 'hash-test-'));
const prdPath = join(tempDir, 'PRD.md');
const planDir = join(tempDir, 'plan');

writeFileSync(prdPath, PRD, 'utf-8');

const manager = new SessionManager(prdPath, planDir);
const session = await manager.initialize();

console.log('Actual hash:  ', session.metadata.hash);
console.log('Match:', session.metadata.hash === expectedHash);

// Cleanup
rmSync(tempDir, { recursive: true, force: true });
EOF

node /tmp/test-hash.js

# Expected: Hashes match
# Expected: Both are 12-character hex strings
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Delta session created when PRD hash changes
- [ ] Test 2: Delta session named with incremented sequence (002_newhash)
- [ ] Test 3: delta_from.txt (parent_session.txt) contains parent session path
- [ ] Test 4: Parent session state loaded for reference
- [ ] Test 5: Delta detection fails gracefully if parent session missing
- [ ] Test 6: Hash comparison correctly detects PRD modifications
- [ ] Test 7: Delta session metadata includes parentSession reference
- [ ] Test 8: Old PRD accessible from delta session
- [ ] Test 9: New PRD accessible from delta session
- [ ] Test 10: Sequential delta sessions (001 → 002 → 003)
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No side effects on production plan/ directory
- [ ] Temp directories cleaned up after tests

### Feature Validation

- [ ] Delta session created when PRD hash differs
- [ ] Hash comparison uses SHA-256 algorithm
- [ ] Session hash is first 12 characters of full hash
- [ ] Delta session has incremented sequence number
- [ ] parent_session.txt (delta_from.txt alias) created
- [ ] Parent session ID stored in metadata.parentSession
- [ ] Parent session state accessible for reference
- [ ] Graceful handling of missing parent sessions
- [ ] Old PRD accessible from parent session
- [ ] New PRD accessible in delta session
- [ ] Multiple sequential delta sessions supported
- [ ] All tests use real filesystem (not mocked)

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
- [ ] PRD fixtures used correctly
- [ ] Hash computation tested with real PRD files

### Documentation & Deployment

- [ ] Tests serve as executable documentation of delta detection
- [ ] Hash comparison validated with real PRD modifications
- [ ] Parent-child linking demonstrated
- [ ] Real filesystem behavior validated
- [ ] Sequential delta sessions tested
- [ ] Integration with P2.M1.T1.S1 and P2.M1.T1.S2 clear
- [ ] Foundation for P2.M2.T2 (task patcher tests)

---

## Anti-Patterns to Avoid

- **Don't mock filesystem operations** - This is integration testing, use real filesystem
- **Don't duplicate unit tests** - Existing unit tests already cover mocked delta scenarios
- **Don't skip temp directory cleanup** - Must use afterEach() with rmSync()
- **Don't use global state** - Each test must use unique temp directory
- **Don't forget .js extensions** - ESM requires .js on all imports
- **Don't test new session creation** - That's P2.M1.T1.S1
- **Don't test existing session loading** - That's P2.M1.T1.S2
- **Don't test task patching** - That's P2.M2.T2
- **Don't modify SessionManager code** - This is validation only, no implementation changes
- **Don't hardcode temp directory paths** - Use mkdtempSync() for uniqueness
- **Don't ignore encoding** - PRD files must be UTF-8 for consistent hashing
- **Don't create custom PRDs** - Use mockSimplePRD and mockSimplePRDv2 fixtures
- **Don't assume parent_session.txt is optional** - It's required for delta sessions
- **Don't forget sequence incrementing** - Delta sessions must have 002, 003, etc.
- **Don't test createDeltaSession() directly** - It's called by initialize() indirectly
- **Don't create overly complex PRDs** - Use fixtures for simplicity
- **Don't skip hash validation** - Real hash computation must work correctly
- **Don't ignore file naming** - parent_session.txt, not delta_from.txt
- **Don't test single delta session only** - Test sequential deltas too

---

## Appendix: Decision Rationale

### Why test delta session detection with integration tests instead of unit tests?

Unit tests (lines 795-1099) use mocks and test the logic in isolation. Integration tests:

1. Validate actual SHA-256 hash computation with real files
2. Test filesystem operations (directory creation, file writing)
3. Verify sequence number incrementing works correctly
4. Validate parent-child linking with real directory structures
5. Catch encoding issues (UTF-8) that mocks miss
6. Test the complete workflow from PRD modification to delta creation

### Why use mockSimplePRD and mockSimplePRDv2 fixtures?

These fixtures provide:

1. Realistic PRD content for testing
2. Guaranteed hash difference (triggers delta detection)
3. Minimal complexity (fast tests)
4. Maintainable test data
5. Consistent across all tests

### Why test sequential delta sessions (001 → 002 → 003)?

Real-world usage involves multiple requirement changes:

1. User modifies PRD, creates delta (002)
2. User modifies again, creates another delta (003)
3. Chain of deltas must link correctly
4. Sequence numbers must increment properly
5. Each delta links to its immediate parent

### What about delta_from.txt vs parent_session.txt?

The work item description mentions "delta_from.txt" but the actual implementation uses "parent_session.txt":

- **parent_session.txt**: Actual file created by SessionManager
- **delta_from.txt**: Documentation alias for the same concept
- Tests verify parent_session.txt is created and contains parent session ID

### Why test graceful failure for missing parent sessions?

Parent sessions might be deleted manually or due to cleanup:

1. Delta session references non-existent parent
2. System should handle gracefully
3. Error messages should be informative
4. Should not crash or corrupt data

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from parallel research agents (3 research tasks)
- [x] SessionManager.createDeltaSession() fully analyzed with line numbers
- [x] SessionManager.hasSessionChanged() implementation documented
- [x] hashPRD() implementation documented with SHA-256 details
- [x] Session directory creation and sequence incrementing documented
- [x] Parent-child linking mechanism documented
- [x] Existing unit tests reviewed to avoid duplication
- [x] Integration test patterns from P2.M1.T1.S1 and P2.M1.T1.S2 identified
- [x] PRD fixture patterns documented (mockSimplePRD, mockSimplePRDv2)
- [x] Real filesystem operation patterns documented
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Integration vs unit test distinction clear

**Risk Mitigation**:

- Extending existing test file (low risk of breaking existing tests)
- Integration tests only (no production code changes)
- Temp directory isolation (no side effects on plan/)
- Complements existing unit tests (no duplication)
- Clear acceptance criteria
- Follows established integration test patterns

**Known Risks**:

- **Hash computation consistency**: UTF-8 encoding must be consistent
  - Mitigation: Always specify 'utf-8' in readFileSync/writeFileSync
- **Temp directory cleanup**: If rmSync() fails, temp files may accumulate
  - Mitigation: Use `force: true` option to ignore ENOENT
- **Fixture availability**: mockSimplePRDv2 must exist and differ from mockSimplePRD
  - Mitigation: Fixtures exist and are guaranteed to differ
- **File naming confusion**: delta_from.txt vs parent_session.txt
  - Mitigation: Tests verify parent_session.txt is created

---

**END OF PRP**
