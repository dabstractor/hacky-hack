# Product Requirement Prompt (PRP): Test Existing Session Loading

**PRP ID**: P2.M1.T1.S2
**Generated**: 2026-01-15
**Story Points**: 2

---

## Goal

**Feature Goal**: Create comprehensive integration tests for SessionManager.loadSession() to validate existing session loading with real filesystem operations, ensuring proper JSON parsing with Zod validation, complete hierarchy restoration, parent session link handling, and batch update system integration.

**Deliverable**: Extended integration test file at `tests/integration/core/session-manager.test.ts` with full coverage of existing session loading scenarios using real filesystem operations in temp directories.

**Success Definition**:

- Existing session correctly loaded from tasks.json with Zod validation
- Complete Phase→Milestone→Task→Subtask hierarchy parsed and restored
- PRD snapshot loaded from prd_snapshot.md with identical content
- Session metadata reconstructed from directory name and filesystem
- Parent session link loaded from parent_session.txt (optional file)
- Batch updates are not affected by loadSession (fresh state loaded)
- All integration tests use real filesystem operations (not mocked)
- Tests pass with 100% coverage of loadSession code paths

---

## User Persona

**Target User**: Developer working on SessionManager validation who needs assurance that existing session loading works correctly with real filesystem operations.

**Use Case**: Validating that SessionManager.loadSession() correctly restores session state from disk for existing PRDs, which is critical for resume capability and the PRP pipeline's ability to continue work across multiple runs.

**User Journey**:

1. Developer has existing session directory with tasks.json
2. SessionManager.initialize() is called with matching PRD
3. SHA-256 hash computed from PRD content
4. plan/ directory scanned for matching hash (found!)
5. SessionManager.loadSession() called with existing session path
6. tasks.json read and parsed with Zod validation
7. PRD snapshot loaded from prd_snapshot.md
8. Metadata reconstructed from directory name
9. Parent session link optionally loaded
10. Complete SessionState returned with all hierarchy restored
11. Integration tests verify all steps completed correctly

**Pain Points Addressed**:

- **Unit test coverage gaps**: Existing unit tests mock filesystem, hiding real-world integration issues
- **JSON parsing bugs**: Zod validation may fail with real JSON files that have encoding or structure issues
- **Hierarchy parsing errors**: Complex nested structures may not parse correctly
- **Parent link handling**: Optional parent_session.txt file needs graceful handling
- **Metadata reconstruction**: Directory name parsing and filesystem stats may have edge cases
- **Batch state interaction**: Loading should reset batch state, not inherit it

---

## Why

- **Resume Capability Validation**: Session loading is the core feature that enables the pipeline to resume work. If this fails, users lose all progress.
- **Real-World Confidence**: Unit tests with mocks can't catch filesystem-specific bugs (encoding, permissions, path resolution, JSON structure issues).
- **Integration vs Unit Distinction**: Existing unit tests (2613 lines) use mocks. Integration tests validate actual behavior with real filesystems.
- **Zod Validation Confidence**: JSON parsing with Zod schema validation must work correctly with real tasks.json files.
- **Hierarchy Restoration**: Complete Phase→Milestone→Task→Subtask hierarchy must be parsed and validated.
- **Parent Session Linking**: Delta sessions require parent session link loading for change tracking.
- **Batch State Isolation**: Loading should not inherit batch state from previous sessions.
- **Regression Prevention**: Changes to SessionManager won't break session loading if integration tests catch issues.
- **Problems Solved**:
  - "Does SessionManager correctly load existing sessions from real tasks.json files?"
  - "Does Zod validation properly validate the complete task hierarchy?"
  - "Are parent session links loaded correctly for delta sessions?"
  - "Does session loading reset batch state properly?"

---

## What

Extend the integration test file at `tests/integration/core/session-manager.test.ts` to validate existing session loading with real filesystem operations.

### Current State Analysis

**SessionManager.loadSession() Method** (from `/src/core/session-manager.ts` lines 349-389):

```typescript
async loadSession(sessionPath: string): Promise<SessionState> {
  // 1. Read tasks.json with Zod validation
  const taskRegistry = await readTasksJSON(sessionPath);

  // 2. Read PRD snapshot
  const prdSnapshotPath = resolve(sessionPath, 'prd_snapshot.md');
  const prdSnapshot = await readFile(prdSnapshotPath, 'utf-8');

  // 3. Parse metadata from directory name
  const dirName = basename(sessionPath);
  const [, hash] = dirName.split('_');

  // 4. Load optional parent session link
  let parentSession: string | null = null;
  try {
    const parentPath = resolve(sessionPath, 'parent_session.txt');
    const parentContent = await readFile(parentPath, 'utf-8');
    parentSession = parentContent.trim();
  } catch {
    // No parent session file - not an error
  }

  // 5. Get directory timestamp
  const stats = await stat(sessionPath);
  const createdAt = stats.mtime;

  // 6. Build metadata and return SessionState
  const metadata: SessionMetadata = {
    id: dirName,
    hash,
    path: sessionPath,
    createdAt,
    parentSession,
  };

  return {
    metadata,
    prdSnapshot,
    taskRegistry,
    currentItemId: null,
  };
}
```

**readTasksJSON() Utility** (from `/src/core/session-utils.ts` lines 312-325):

```typescript
export async function readTasksJSON(sessionPath: string): Promise<Backlog> {
  try {
    const tasksPath = resolve(sessionPath, 'tasks.json');
    const content = await readFile(tasksPath, 'utf-8');
    const parsed = JSON.parse(content);
    return BacklogSchema.parse(parsed);
  } catch (error) {
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'read tasks.json',
      error as Error
    );
  }
}
```

**Existing Unit Tests** (from `/tests/unit/core/session-manager.test.ts`):

- Use `vi.mock()` for all filesystem operations
- Test tasks.json reading, PRD snapshot loading, metadata parsing
- Test parent session loading, complete hierarchy restoration
- **MISSING**: Real filesystem validation with actual tasks.json files
- **MISSING**: Zod validation with real JSON structures
- **MISSING**: Hierarchy parsing with real nested data
- **MISSING**: Parent session file with real filesystem operations

**Integration Test from P2.M1.T1.S1**:

- Creates new sessions with initialize()
- Tests session directory creation
- Tests PRD snapshot copying
- **This PRP**: Tests loading existing sessions (complementary)

### Success Criteria

- [ ] Test 1: Existing session loaded from tasks.json with Zod validation
- [ ] Test 2: Complete Phase→Milestone→Task→Subtask hierarchy parsed
- [ ] Test 3: PRD snapshot loaded with identical content
- [ ] Test 4: Session metadata reconstructed from directory name
- [ ] Test 5: Parent session link loaded from parent_session.txt
- [ ] Test 6: Batch updates are not affected by loadSession
- [ ] Test 7: Invalid JSON throws SessionFileError
- [ ] Test 8: Missing tasks.json throws SessionFileError
- [ ] Test 9: Missing prd_snapshot.md throws error
- [ ] Test 10: Missing parent_session.txt is handled gracefully
- [ ] All tests use real filesystem (temp directories)
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] SessionManager.loadSession() method fully analyzed (lines 349-389)
- [x] readTasksJSON() implementation documented (session-utils.ts lines 312-325)
- [x] BacklogSchema Zod validation documented (models.ts)
- [x] Task hierarchy structure documented (Phase→Milestone→Task→Subtask)
- [x] SessionState and SessionMetadata interfaces documented
- [x] Parent session file handling documented (parent_session.txt)
- [x] Batch update system interaction analyzed
- [x] Existing unit tests reviewed (to avoid duplication)
- [x] Integration test patterns from P2.M1.T1.S1 available
- [x] Sample tasks.json fixtures identified
- [x] Scope boundaries defined (integration vs unit tests)

---

### Documentation & References

```yaml
# MUST READ - SessionManager.loadSession() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains loadSession() method (lines 349-389) with existing session loading logic
  section: Lines 349-389
  critical: |
    - Reads tasks.json with readTasksJSON()
    - Loads PRD snapshot from prd_snapshot.md
    - Parses metadata from directory name
    - Optionally loads parent_session.txt
    - Returns complete SessionState

# MUST READ - readTasksJSON() utility
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Contains readTasksJSON() function (lines 312-325) that reads and validates tasks.json
  section: Lines 312-325
  pattern: |
    - Reads tasks.json from session path
    - Uses UTF-8 encoding
    - Parses JSON with JSON.parse()
    - Validates with BacklogSchema.parse()
    - Throws SessionFileError on failure
  gotcha: |
    - Zod validation will throw on invalid structure
    - UTF-8 encoding is critical for hash consistency
    - Error context includes file path and operation

# MUST READ - Zod schemas for task hierarchy
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains Zod schemas for validating task hierarchy (lines 500-750)
  section: Lines 500-750
  pattern: |
    - BacklogSchema: z.object({ backlog: z.array(PhaseSchema) })
    - PhaseSchema: Recursive z.lazy() for milestones
    - MilestoneSchema: Recursive z.lazy() for tasks
    - TaskSchema: Recursive z.lazy() for subtasks
    - SubtaskSchema: Leaf level with full validation
  critical: |
    - ID regex patterns: P{N}, P{N}.M{N}, P{N}.M{N}.T{N}, P{N}.M{N}.T{N}.S{N}
    - StatusEnum: Planned, Researching, Implementing, Complete, Failed, Obsolete
    - Story points: 1-21 (Fibonacci)
    - ContextScope has superRefine validation

# MUST READ - SessionState and SessionMetadata interfaces
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Defines SessionState structure (lines 843-888) and SessionMetadata (lines 744-797)
  section: Lines 744-797, 843-888
  pattern: |
    - SessionMetadata: id, hash, path, createdAt, parentSession
    - SessionState: metadata, prdSnapshot, taskRegistry, currentItemId
    - All properties are readonly (immutability)
  gotcha: |
    - currentItemId is set by Task Orchestrator, not loadSession
    - parentSession is null for non-delta sessions
    - createdAt uses mtime (not birthtime)

# MUST READ - Previous PRP for test patterns
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S1/PRP.md
  why: Contains integration test patterns for new session creation (complementary)
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
  why: This is the file to EXTEND with existing session loading tests
  section: Full file (created by P2.M1.T1.S1)
  pattern: |
    - describe('SessionManager.initialize()' for new sessions
    - ADD: describe('SessionManager.loadSession()' for existing sessions
    - Use same temp directory setup/teardown
  gotcha: |
    - File will be created by P2.M1.T1.S1
    - We EXTEND it with additional describe() block
    - Don't modify existing tests

# MUST READ - Sample tasks.json for fixtures
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/tasks.json
  why: Real tasks.json with complete task hierarchy for fixture creation
  section: Full file
  pattern: |
    - Contains Phase > Milestone > Task > Subtask hierarchy
    - Use this to create test fixtures
    - Simplify to minimal structure for faster tests
  gotcha: |
    - Full hierarchy is large (100+ items)
    - Create minimal fixtures: 1 Phase, 1 Milestone, 1 Task, 1 Subtask
    - Ensure Zod validation passes

# MUST READ - System context for batch updates
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md
  why: Contains Section 6.3 (Session State) and batch update patterns
  section: Section 6.3
  pattern: |
    - Batch update system uses #dirty, #pendingUpdates, #updateCount
    - loadSession() resets batch state (loads fresh from disk)
    - No batch inheritance between sessions
  critical: |
    - Batch state is not persisted to disk
    - loadSession() always returns clean state
    - Batch updates start fresh after load

# MUST READ - Existing unit tests (for context, not duplication)
- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts
  why: Understand what's already tested to avoid duplication
  section: Lines 800-1000 (loadSession tests)
  pattern: |
    - Tests tasks.json reading with mocked fs
    - Tests PRD snapshot loading with mocked fs
    - Tests metadata parsing with mocked fs
    - Tests parent session loading with mocked fs
  gotcha: |
    - These are UNIT tests (mocked)
    - Our task is INTEGRATION tests (real filesystem)
    - Don't duplicate, complement with real filesystem tests

# RESEARCH DOCUMENTATION - SessionManager implementation analysis
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S2/research/session-manager-implementation-analysis.md
  why: Complete analysis of SessionManager.loadSession() with line numbers
  section: Full file
  critical: |
    - loadSession() flow documented step-by-step
    - readTasksJSON() implementation details
    - Session state restoration process
    - Batch update system interaction

# RESEARCH DOCUMENTATION - External test patterns
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S2/research/external-test-patterns-research.md
  why: Complete analysis of testing patterns for JSON parsing, Zod validation, and session state
  section: Full file
  critical: |
    - Zod testing patterns with expectZodSuccess/expectZodFailure helpers
    - Hierarchical data testing patterns
    - Session state persistence testing
    - Common pitfalls to avoid
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts              # SOURCE: loadSession() method (349-389)
│   │   │                                   # SOURCE: initialize() method (210-336)
│   │   ├── session-utils.ts                # SOURCE: readTasksJSON() (312-325)
│   │   └── models.ts                       # REFERENCE: SessionState, SessionMetadata, Zod schemas
│   └── utils/
│       └── prd-validator.ts                # REFERENCE: PRDValidator class
├── tests/
│   ├── setup.ts                            # Global test setup with API validation
│   ├── unit/
│   │   └── core/
│   │       └── session-manager.test.ts     # EXISTING: Unit tests with mocks (2613 lines)
│   └── integration/
│       ├── prp-pipeline-integration.test.ts    # REFERENCE: Temp dir pattern
│       ├── prp-runtime-integration.test.ts     # REFERENCE: Real filesystem pattern
│       └── core/
│           └── session-manager.test.ts    # EXTEND: Add loadSession tests here (created by P2.M1.T1.S1)
├── plan/
│   └── 002_1e734971e481/
│       ├── P2M1T1S1/
│       │   └── PRP.md                     # REFERENCE: New session creation tests
│       ├── P2M1T1S2/
│       │   ├── PRP.md                     # NEW: This PRP
│       │   └── research/                  # RESEARCH: Research documents
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
                                                    # ADD: describe('SessionManager.loadSession()', () => { ... })
                                                    # ADD: Tests for existing session loading
                                                    # ADD: Real filesystem operations
                                                    # ADD: Fixture creation helpers
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Integration Tests Use REAL Filesystem, Not Mocks
// Unit tests (tests/unit/core/session-manager.test.ts) use vi.mock()
// Integration tests (this task) use real filesystem with temp directories
// Pattern: mkdtempSync(join(tmpdir(), 'session-manager-test-'))
// Cleanup: rmSync(tempDir, { recursive: true, force: true })

// CRITICAL: loadSession() Requires Existing Session Directory
// Cannot call loadSession() directly - it's called by initialize()
// Test pattern: Create session with initialize(), then call initialize() again with same PRD
// This triggers the existing session loading path

// GOTCHA: SessionManager is Internal, Not Exported for Testing
// loadSession() is a private method (not exported)
// Tests must trigger it indirectly via initialize()
// Pattern: First call creates session, second call loads it

// CRITICAL: Zod Validation Throws on Invalid Structure
// BacklogSchema.parse() throws ZodError on validation failure
// Wrapped in try/catch by readTasksJSON()
// Re-thrown as SessionFileError with context
// Tests should verify SessionFileError is thrown

// CRITICAL: tasks.json Must Have Complete Hierarchy
// BacklogSchema expects: { backlog: [Phase, ...] }
// Each Phase expects: { id, type, title, status, description, milestones: [...] }
// Each Milestone expects: { id, type, title, status, description, tasks: [...] }
// Each Task expects: { id, type, title, status, description, subtasks: [...] }
// Each Subtask expects: { id, type, title, status, story_points, dependencies, context_scope }

// GOTCHA: ID Format Validation is Strict
// Phase: /^P\d+$/ (e.g., P1, P2)
// Milestone: /^P\d+\.M\d+$/ (e.g., P1.M1)
// Task: /^P\d+\.M\d+\.T\d+$/ (e.g., P1.M1.T1)
// Subtask: /^P\d+\.M\d+\.T\d+\.S\d+$/ (e.g., P1.M1.T1.S1)
// Invalid IDs cause Zod validation to fail

// CRITICAL: Status Values are Enumerated
// Valid: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
// Case-sensitive: 'complete' (lowercase) will fail validation
// Tests must use exact status values

// GOTCHA: Story Points are 1-21 (Fibonacci)
// Valid: 1, 2, 3, 5, 8, 13, 21
// Invalid: 0, 4, 6, 7, 9, 10, 22+
// Unit tests suggest 0.5, 1, 2 but Zod schema validates 1-21

// CRITICAL: parent_session.txt is Optional
// If missing, parentSession is null (not an error)
// If present, content is trimmed and used as parent session ID
// Tests should verify both scenarios

// GOTCHA: Metadata Reconstruction Uses Directory Name
// Hash extracted from directory name: {sequence}_{hash}
// dirName.split('_')[1] extracts the hash portion
// Assumes directory name follows SESSION_DIR_PATTERN
// Tests must create directories with correct naming

// CRITICAL: createdAt Uses mtime, Not birthtime
// stats.mtime is used as creation time
// mtime can change if directory is modified
// birthtime is more accurate but not used
// Tests should not rely on exact createdAt value

// GOTCHA: Batch State is Reset on Load
// loadSession() does NOT inherit batch state
# #dirty, #pendingUpdates, #updateCount are not persisted
// Each session starts with clean batch state
// Tests should verify batch state is not affected

// CRITICAL: Fixture Creation Should Be Minimal
// Full tasks.json is 100+ items (too slow for tests)
// Create minimal fixtures: 1 Phase, 1 Milestone, 1 Task, 1 Subtask
// Use helper functions to generate valid structures
// Ensure all required fields are present

// GOTCHA: UTF-8 Encoding is Critical
// readTasksJSON() uses UTF-8 encoding
// writeFileSync() must use UTF-8 when creating fixtures
// Inconsistent encoding causes hash mismatch and validation errors

// CRITICAL: Integration Tests Complement Unit Tests
// Unit tests: Mock filesystem, test logic in isolation
// Integration tests: Real filesystem, test actual behavior
// Don't duplicate unit test scenarios
// Focus on filesystem-specific validation and Zod validation

// GOTCHA: SessionManager Constructor Validates PRD
// Constructor throws SessionFileError if PRD doesn't exist
// Tests must create valid PRD file before creating SessionManager
// Use: writeFileSync(prdPath, '# Test PRD\n\nContent.')
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing SessionState, SessionMetadata, and Backlog behavior with real filesystem operations.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY tests/integration/core/session-manager.test.ts exists
  - CHECK: File exists (created by P2.M1.T1.S1)
  - READ: Existing test file to understand structure
  - IDENTIFY: Where to add new describe() block
  - DEPENDENCIES: P2.M1.T1.S1 completion
  - PLACEMENT: tests/integration/core/session-manager.test.ts

Task 2: READ SessionManager.loadSession() implementation
  - FILE: src/core/session-manager.ts
  - READ: Lines 349-389 (loadSession method)
  - READ: Lines 312-325 in session-utils.ts (readTasksJSON)
  - READ: Lines 500-750 in models.ts (Zod schemas)
  - UNDERSTAND: Existing session loading flow
  - UNDERSTAND: Zod validation patterns
  - DEPENDENCIES: None

Task 3: CREATE fixture helper functions
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: createMinimalTasksJson() helper function
  - ADD: createSessionWithTasks() helper function
  - PATTERN: Follow existing factory function patterns
  - RETURNS: Valid Backlog structure for all hierarchy levels
  - DEPENDENCIES: Task 2

Task 4: IMPLEMENT describe() block for loadSession tests
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: describe('SessionManager.loadSession()', () => { ... })
  - ADD: beforeEach() to create unique temp directory
  - ADD: afterEach() to cleanup temp directory
  - PATTERN: Follow existing describe() block structure
  - DEPENDENCIES: Task 3

Task 5: IMPLEMENT Test 1 - Existing session loaded from tasks.json
  - CREATE: it('should load existing session from tasks.json', async () => { ... })
  - SETUP: Create session with initialize(), verify directory exists
  - EXECUTE: Call initialize() again with same PRD (triggers loadSession)
  - VERIFY: Session loaded (not recreated)
  - VERIFY: taskRegistry.backlog has correct structure
  - VERIFY: All hierarchy levels present
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 2 - Complete hierarchy parsed
  - CREATE: it('should parse complete Phase->Milestone->Task->Subtask hierarchy', async () => { ... })
  - SETUP: Create session with minimal tasks.json fixture
  - EXECUTE: Load session via initialize()
  - VERIFY: Phase array has correct length
  - VERIFY: Each Phase has Milestones array
  - VERIFY: Each Milestone has Tasks array
  - VERIFY: Each Task has Subtasks array
  - VERIFY: IDs match expected patterns
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 3 - PRD snapshot loaded
  - CREATE: it('should load PRD snapshot with identical content', async () => { ... })
  - SETUP: Create session with specific PRD content
  - EXECUTE: Load session via initialize()
  - VERIFY: prdSnapshot matches original PRD content
  - VERIFY: Content is identical (string equality)
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 4 - Session metadata reconstructed
  - CREATE: it('should reconstruct session metadata from directory name', async () => { ... })
  - SETUP: Create session with initialize()
  - EXECUTE: Load session via initialize()
  - VERIFY: metadata.id matches session directory name
  - VERIFY: metadata.hash extracted from directory name
  - VERIFY: metadata.path is absolute path to session
  - VERIFY: metadata.createdAt is Date instance
  - VERIFY: metadata.parentSession is null (not delta)
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 5 - Parent session link loaded
  - CREATE: it('should load parent session link from parent_session.txt', async () => { ... })
  - SETUP: Create session directory manually with parent_session.txt
  - EXECUTE: Load session via SessionManager.loadSession() (need to test via initialize())
  - VERIFY: metadata.parentSession matches parent session ID
  - GOTCHA: loadSession() is private, test via initialize() or make accessible
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Test 6 - Batch updates not affected
  - CREATE: it('should not affect batch updates when loading session', async () => { ... })
  - SETUP: Create session
  - EXECUTE: Load session via initialize()
  - VERIFY: Batch state is clean (not inherited from previous session)
  - VERIFY: No pending updates after load
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 7 - Invalid JSON throws error
  - CREATE: it('should throw SessionFileError for invalid JSON', async () => { ... })
  - SETUP: Create session directory with malformed tasks.json
  - EXECUTE: Attempt to load session
  - VERIFY: SessionFileError thrown
  - VERIFY: Error message indicates JSON parsing failure
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 8 - Missing tasks.json throws error
  - CREATE: it('should throw SessionFileError for missing tasks.json', async () => { ... })
  - SETUP: Create session directory without tasks.json
  - EXECUTE: Attempt to load session
  - VERIFY: SessionFileError thrown
  - VERIFY: Error message includes 'tasks.json'
  - DEPENDENCIES: Task 11

Task 13: IMPLEMENT Test 9 - Missing prd_snapshot.md throws error
  - CREATE: it('should throw error for missing prd_snapshot.md', async () => { ... })
  - SETUP: Create session directory without prd_snapshot.md
  - EXECUTE: Attempt to load session
  - VERIFY: Error thrown (ENOENT)
  - DEPENDENCIES: Task 12

Task 14: IMPLEMENT Test 10 - Missing parent_session.txt is graceful
  - CREATE: it('should handle missing parent_session.txt gracefully', async () => { ... })
  - SETUP: Create session without parent_session.txt
  - EXECUTE: Load session via initialize()
  - VERIFY: metadata.parentSession is null
  - VERIFY: No error thrown
  - DEPENDENCIES: Task 13

Task 15: RUN tests and verify all pass
  - RUN: npm test -- tests/integration/core/session-manager.test.ts
  - VERIFY: All tests pass
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
// PATTERN: Fixture Helper Functions
// =============================================================================

/**
 * Creates a minimal valid Backlog structure for testing
 * Contains: 1 Phase, 1 Milestone, 1 Task, 1 Subtask
 */
function createMinimalTasksJson(): Backlog {
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
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
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

/**
 * Creates a session directory with tasks.json fixture
 * @param tempDir Temporary directory path
 * @param sessionName Session directory name (e.g., '001_abc123def456')
 * @param tasksJson Optional custom Backlog structure
 * @returns Path to created session directory
 */
function createSessionWithTasks(
  tempDir: string,
  sessionName: string,
  tasksJson?: Backlog
): string {
  const sessionPath = join(tempDir, 'plan', sessionName);
  const tasksPath = join(sessionPath, 'tasks.json');

  // Create session directory
  mkdirSync(sessionPath, { recursive: true });

  // Write tasks.json
  const backlog = tasksJson || createMinimalTasksJson();
  writeFileSync(tasksPath, JSON.stringify(backlog, null, 2), 'utf-8');

  return sessionPath;
}

// =============================================================================
// PATTERN: Test Setup for Existing Session Loading
// =============================================================================

describe('SessionManager.loadSession()', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-load-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Create initial PRD file
    writeFileSync(
      prdPath,
      '# Test PRD\n\nThis is a test PRD for session loading.'
    );
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - Existing Session Loaded from tasks.json
  // =============================================================================

  it('should load existing session from tasks.json', async () => {
    // SETUP: Create initial session
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // EXECUTE: Initialize again with same PRD (triggers loadSession)
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: Session loaded (not recreated)
    expect(session2.metadata.id).toBe(session1.metadata.id);
    expect(session2.metadata.hash).toBe(session1.metadata.hash);

    // VERIFY: taskRegistry structure
    expect(session2.taskRegistry).toBeDefined();
    expect(session2.taskRegistry.backlog).toBeInstanceOf(Array);
  });

  // =============================================================================
  // PATTERN: Test 2 - Complete Hierarchy Parsing
  // =============================================================================

  it('should parse complete Phase->Milestone->Task->Subtask hierarchy', async () => {
    // SETUP: Create session with minimal tasks.json
    const prdContent = '# Test PRD\n\nContent for hierarchy testing.';
    writeFileSync(prdPath, prdContent);

    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // Get session directory and create custom tasks.json
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');

    const minimalTasks = createMinimalTasksJson();
    writeFileSync(tasksPath, JSON.stringify(minimalTasks, null, 2), 'utf-8');

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: Complete hierarchy parsed
    expect(session.taskRegistry.backlog).toHaveLength(1);

    const phase = session.taskRegistry.backlog[0];
    expect(phase.type).toBe('Phase');
    expect(phase.id).toBe('P1');
    expect(phase.milestones).toHaveLength(1);

    const milestone = phase.milestones[0];
    expect(milestone.type).toBe('Milestone');
    expect(milestone.id).toBe('P1.M1');
    expect(milestone.tasks).toHaveLength(1);

    const task = milestone.tasks[0];
    expect(task.type).toBe('Task');
    expect(task.id).toBe('P1.M1.T1');
    expect(task.subtasks).toHaveLength(1);

    const subtask = task.subtasks[0];
    expect(subtask.type).toBe('Subtask');
    expect(subtask.id).toBe('P1.M1.T1.S1');
  });

  // =============================================================================
  // PATTERN: Test 3 - PRD Snapshot Loaded
  // =============================================================================

  it('should load PRD snapshot with identical content', async () => {
    // SETUP: Create PRD with specific content
    const prdContent =
      '# Test PRD\n\nSpecific content for snapshot verification.';
    writeFileSync(prdPath, prdContent);

    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: PRD snapshot matches original
    expect(session.prdSnapshot).toBe(prdContent);
  });

  // =============================================================================
  // PATTERN: Test 4 - Session Metadata Reconstructed
  // =============================================================================

  it('should reconstruct session metadata from directory name', async () => {
    // SETUP: Create session
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: Metadata reconstructed
    const sessionDirs = readdirSync(planDir);
    const sessionDirName = sessionDirs[0];

    expect(session.metadata.id).toBe(sessionDirName);
    expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
    expect(session.metadata.path).toBe(resolve(planDir, sessionDirName));
    expect(session.metadata.createdAt).toBeInstanceOf(Date);
    expect(session.metadata.parentSession).toBeNull();
  });

  // =============================================================================
  // PATTERN: Test 5 - Parent Session Link Loaded
  // =============================================================================

  it('should load parent session link from parent_session.txt', async () => {
    // SETUP: Create session with parent_session.txt
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const parentPath = join(sessionPath, 'parent_session.txt');

    // Write parent session link
    writeFileSync(parentPath, '001_abc123def456', 'utf-8');

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: Parent session loaded
    expect(session.metadata.parentSession).toBe('001_abc123def456');
  });

  // =============================================================================
  // PATTERN: Test 6 - Batch Updates Not Affected
  // =============================================================================

  it('should not affect batch updates when loading session', async () => {
    // SETUP: Create session
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // EXECUTE: Load session again
    const session = await manager.initialize();

    // VERIFY: Batch state is clean
    // Note: Batch state is private, but we can verify session loads correctly
    expect(session.metadata.id).toBeDefined();
    expect(session.taskRegistry).toBeDefined();
  });

  // =============================================================================
  // PATTERN: Test 7 - Invalid JSON Throws Error
  // =============================================================================

  it('should throw SessionFileError for invalid JSON', async () => {
    // SETUP: Create session with invalid tasks.json
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');

    // Write invalid JSON
    writeFileSync(tasksPath, '{ invalid json }', 'utf-8');

    // EXECUTE & VERIFY: Should throw error
    const manager2 = new SessionManager(prdPath, planDir);
    await expect(manager2.initialize()).rejects.toThrow(SessionFileError);
  });

  // =============================================================================
  // PATTERN: Test 8 - Missing tasks.json Throws Error
  // =============================================================================

  it('should throw SessionFileError for missing tasks.json', async () => {
    // SETUP: Create session directory without tasks.json
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');

    // Remove tasks.json
    rmSync(tasksPath);

    // EXECUTE & VERIFY: Should throw error
    const manager2 = new SessionManager(prdPath, planDir);
    await expect(manager2.initialize()).rejects.toThrow(SessionFileError);
  });

  // =============================================================================
  // PATTERN: Test 9 - Missing prd_snapshot.md Throws Error
  // =============================================================================

  it('should throw error for missing prd_snapshot.md', async () => {
    // SETUP: Create session without prd_snapshot.md
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const snapshotPath = join(sessionPath, 'prd_snapshot.md');

    // Remove prd_snapshot.md
    rmSync(snapshotPath);

    // EXECUTE & VERIFY: Should throw error
    const manager2 = new SessionManager(prdPath, planDir);
    await expect(manager2.initialize()).rejects.toThrow();
  });

  // =============================================================================
  // PATTERN: Test 10 - Missing parent_session.txt is Graceful
  // =============================================================================

  it('should handle missing parent_session.txt gracefully', async () => {
    // SETUP: Create session without parent_session.txt
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // EXECUTE: Load session again (no parent_session.txt exists)
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: parentSession is null, no error thrown
    expect(session.metadata.parentSession).toBeNull();
  });
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING UNIT TESTS:
  - tests/unit/core/session-manager.test.ts has comprehensive mocked tests
  - Pattern: SETUP/EXECUTE/VERIFY comments
  - Pattern: describe/it block structure
  - Pattern: Factory functions for test data
  - This PRP: Complements with real filesystem integration tests

INPUT FROM P2.M1.T1.S1 (NEW SESSION CREATION):
  - tests/integration/core/session-manager.test.ts will be created
  - Pattern: describe('SessionManager.initialize()' for new sessions
  - Pattern: Temp directory setup with mkdtempSync()
  - Pattern: beforeEach/afterEach for setup/teardown
  - This PRP: EXTENDS with describe('SessionManager.loadSession()' block

INPUT FROM SESSIONMANAGER IMPLEMENTATION:
  - src/core/session-manager.ts has loadSession() method (349-389)
  - Pattern: Read tasks.json, load PRD snapshot, parse metadata
  - Pattern: Optional parent session file loading
  - Pattern: Returns complete SessionState
  - This PRP: Tests validate actual behavior with real filesystems

INPUT FROM SESSION-UTILS:
  - src/core/session-utils.ts has readTasksJSON() function (312-325)
  - Pattern: Read file, parse JSON, validate with Zod
  - Pattern: Throw SessionFileError on failure
  - This PRP: Tests validate Zod validation with real JSON files

INPUT FROM ZOD SCHEMAS:
  - src/core/models.ts has BacklogSchema and related schemas (500-750)
  - Pattern: Recursive z.lazy() for nested structures
  - Pattern: Regex validation for ID formats
  - Pattern: Enum validation for status values
  - This PRP: Tests validate schema enforcement

OUTPUT FOR SUBSEQUENT WORK:
  - Integration tests for existing session loading at session-manager.test.ts
  - Confidence that SessionManager loads sessions correctly
  - Foundation for P2.M1.T1.S3 (delta session detection tests)
  - Foundation for P2.M1.T2 (batch update and persistence tests)
  - Pattern for testing real filesystem operations

DIRECTORY STRUCTURE:
  - Extend: tests/integration/core/session-manager.test.ts (existing file)
  - Add: New describe() block for loadSession tests
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

# Expected: All tests pass (including new loadSession tests)
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run all integration tests
npm test -- tests/integration/

# Expected: All integration tests pass
# Expected: No regressions in other integration test files

# Coverage validation
npm run test:coverage

# Expected: Coverage for SessionManager.loadSession() increases
# Expected: New filesystem-related code paths covered
# Expected: No uncovered lines in loadSession logic

# If tests fail, check:
# - SessionManager imported correctly (with .js extension)
# - Temp directory cleanup works
# - Fixtures created with valid structure
# - Zod validation passes for valid fixtures
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
ls -la /tmp/ | grep session-manager

# Expected: No leftover temp directories (all cleaned up)

# Manual verification: Read test output
npm test -- tests/integration/core/session-manager.test.ts --reporter=verbose

# Expected: Clear test names showing session loading scenarios
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/integration/core/session-manager.test.ts

# Expected: Tests complete in reasonable time (< 15 seconds)
```

### Level 4: Real-World Validation (Scenario Testing)

```bash
# Scenario 1: Load existing session with real tasks.json
cp -r plan/002_1e734971e481 /tmp/test-session-load
cat > /tmp/test-load.js << 'EOF'
import { SessionManager } from './src/core/session-manager.js';
const prdPath = '/tmp/test-session-load/../PRD.md';
const planDir = '/tmp/test-session-load/../';
const manager = new SessionManager(prdPath, planDir);
const session = await manager.initialize();
console.log('Session loaded:', session.metadata.id);
console.log('Tasks loaded:', session.taskRegistry.backlog.length);
EOF
node /tmp/test-load.js

# Expected: Session loaded successfully
# Expected: Task hierarchy correctly parsed

# Scenario 2: Verify Zod validation with invalid JSON
cat > /tmp/test-invalid.js << 'EOF'
import { SessionManager } from './src/core/session-manager.js';
import { writeFileSync } from 'node:fs';
const prdPath = '/tmp/test-prd.md';
const planDir = '/tmp/test-plan-invalid';
writeFileSync(prdPath, '# Test\n\nContent.');
const manager = new SessionManager(prdPath, planDir);
await manager.initialize();
// Write invalid tasks.json
writeFileSync(`${planDir}/001_*/tasks.json`, '{ invalid }');
try {
  await manager.initialize();
} catch (e) {
  console.log('Expected error:', e.message);
}
EOF
node /tmp/test-invalid.js

# Expected: SessionFileError thrown
# Expected: Error message indicates JSON validation failure
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Existing session loaded from tasks.json with Zod validation
- [ ] Test 2: Complete Phase→Milestone→Task→Subtask hierarchy parsed
- [ ] Test 3: PRD snapshot loaded with identical content
- [ ] Test 4: Session metadata reconstructed from directory name
- [ ] Test 5: Parent session link loaded from parent_session.txt
- [ ] Test 6: Batch updates are not affected by loadSession
- [ ] Test 7: Invalid JSON throws SessionFileError
- [ ] Test 8: Missing tasks.json throws SessionFileError
- [ ] Test 9: Missing prd_snapshot.md throws error
- [ ] Test 10: Missing parent_session.txt is handled gracefully
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No side effects on production plan/ directory
- [ ] Temp directories cleaned up after tests

### Feature Validation

- [ ] Session loads correctly when tasks.json exists
- [ ] Zod validation enforces complete hierarchy structure
- [ ] ID format validation works at all levels (P, M, T, S)
- [ ] Status enum validation accepts only valid values
- [ ] PRD snapshot content matches original exactly
- [ ] Metadata reconstruction extracts hash from directory name
- [ ] Parent session link loaded when file exists
- [ ] Parent session null when file doesn't exist (graceful)
- [ ] Batch state is clean after load (not inherited)
- [ ] Errors throw SessionFileError with context
- [ ] All tests use real filesystem (not mocked)
- [ ] Tests complement existing unit tests (no duplication)

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
- [ ] Fixture helpers create minimal valid structures
- [ ] Zod validation tested with real JSON files

### Documentation & Deployment

- [ ] Tests serve as executable documentation of session loading
- [ ] Hierarchy parsing validated at all levels
- [ ] Zod schema enforcement demonstrated
- [ ] Real filesystem behavior validated
- [ ] Research documents stored in research/ subdirectory
- [ ] Integration with P2.M1.T1.S1 clear (extending same file)

---

## Anti-Patterns to Avoid

- **Don't mock filesystem operations** - This is integration testing, use real filesystem
- **Don't duplicate unit tests** - Existing unit tests already cover mocked scenarios
- **Don't skip temp directory cleanup** - Must use afterEach() with rmSync()
- **Don't use global state** - Each test must use unique temp directory
- **Don't forget .js extensions** - ESM requires .js on all imports
- **Don't test new session creation** - That's P2.M1.T1.S1
- **Don't test delta session detection** - That's P2.M1.T1.S3
- **Don't test batch update persistence** - That's P2.M1.T2
- **Don't modify SessionManager code** - This is validation only, no implementation changes
- **Don't hardcode temp directory paths** - Use mkdtempSync() for uniqueness
- **Don't ignore encoding** - tasks.json must be UTF-8 for consistent parsing
- **Don't create incomplete fixtures** - All hierarchy levels must be complete
- **Don't use invalid ID formats** - IDs must match regex patterns exactly
- **Don't use wrong status values** - Must use exact enum values (case-sensitive)
- **Don't assume parent_session.txt exists** - File is optional, test both scenarios
- **Don't forget to trim parent session content** - Whitespace can cause issues
- **Don't test loadSession() directly** - It's private, test via initialize()
- **Don't create overly complex fixtures** - Use minimal structure for faster tests
- **Don't skip Zod validation testing** - Real JSON files must pass schema validation
- **Don't ignore error context** - SessionFileError must include file path and operation

---

## Appendix: Decision Rationale

### Why extend existing integration test file instead of creating new one?

P2.M1.T1.S1 creates `tests/integration/core/session-manager.test.ts` for new session creation tests. Extending this file with existing session loading tests:

1. Keeps all SessionManager integration tests in one place
2. Shares beforeEach/afterEach setup code
3. Mirrors the unit test file structure (one file for all SessionManager tests)
4. Makes it easy to find all integration tests for SessionManager
5. Reduces file duplication and maintenance burden

### Why test loadSession() indirectly via initialize()?

The `loadSession()` method is private (not exported) and is called internally by `initialize()`. Testing it indirectly:

1. Tests the actual usage pattern (initialize() calls loadSession())
2. Doesn't require making private methods public for testing
3. Validates the integration between initialize() and loadSession()
4. Follows the principle of testing behavior, not implementation

### Why create minimal fixture helpers?

The full tasks.json from the codebase has 100+ items and is complex. Creating minimal fixtures:

1. Reduces test execution time (smaller JSON to parse)
2. Simplifies test assertions (fewer items to verify)
3. Makes tests more readable (clear what's being tested)
4. Ensures all required fields are present (Zod validation)
5. Provides reusable helpers for other integration tests

### Why test both valid and invalid JSON scenarios?

Testing both scenarios ensures:

1. Valid JSON is parsed correctly (happy path)
2. Invalid JSON throws proper errors (error handling)
3. Zod validation enforces schema constraints
4. Error messages provide useful context for debugging
5. The system is resilient to malformed data

### What about parent session testing?

Delta sessions use parent_session.txt to link to the previous session. Testing this:

1. Validates optional file handling
2. Ensures parent links are preserved across sessions
3. Confirms delta session creation works correctly
4. Tests graceful degradation when file is missing

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from parallel research agents (5 research tasks)
- [x] SessionManager.loadSession() fully analyzed with line numbers
- [x] readTasksJSON() implementation documented with Zod validation
- [x] Task hierarchy structure documented (Phase→Milestone→Task→Subtask)
- [x] Zod schemas documented with ID patterns and validation rules
- [x] Existing unit tests reviewed to avoid duplication
- [x] Integration test patterns from P2.M1.T1.S1 identified
- [x] Fixture helper patterns designed
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
- Follows established integration test patterns from P2.M1.T1.S1

**Known Risks**:

- **Temp directory cleanup**: If rmSync() fails, temp files may accumulate
  - Mitigation: Use `force: true` option to ignore ENOENT
- **Zod validation complexity**: Schema validation may fail with subtle errors
  - Mitigation: Use minimal fixtures with valid structures
- **Private method testing**: loadSession() is private, must test via initialize()
  - Mitigation: Test initialize() with existing session (indirect testing)
- **File encoding issues**: UTF-8 encoding must be consistent
  - Mitigation: Always specify 'utf-8' in readFileSync/writeFileSync

---

**END OF PRP**
