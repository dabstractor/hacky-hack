# PRP: P1.M1.T1.S3 - Verify delta session creation and linkage

## Goal

**Feature Goal**: Create a comprehensive integration test that validates delta session creation, parent-child linkage via `parent_session.txt`, delta PRD generation, and TaskPatcher's task marking functionality (new/modified/obsolete).

**Deliverable**: Integration test file `tests/integration/core/delta-session.test.ts` with complete validation of the delta session workflow from PRD modification through task patching.

**Success Definition**:
- All 4 CONTRACT requirements are tested and passing
- Test file runs successfully with `npx vitest run tests/integration/core/delta-session.test.ts`
- Tests validate: (a) delta session directory is created with new hash, (b) `parent_session.txt` contains parent session path, (c) delta PRD is generated focusing only on changes, (d) TaskPatcher correctly marks tasks as new/modified/obsolete
- Tests use real filesystem operations (not mocks) with predictable state through mocked parent sessions

## Why

**Business Value**: Delta sessions are the core mechanism for incremental development in the PRP Pipeline. They enable selective re-execution of tasks when PRDs change while preserving completed work. Incorrect delta session creation would break the entire incremental development workflow.

**Integration Points**:
- Validates `createDeltaSession()` from `src/core/session-manager.ts` (lines 540-617) for delta session creation
- Validates `patchBacklog()` from `src/core/task-patcher.ts` (lines 64-110) for task state marking
- Validates `diffPRDs()` from `src/core/prd-differ.ts` for PRD difference computation
- Validates parent-child linkage via `parent_session.txt` file
- Uses test fixtures from `tests/fixtures/simple-prd.ts` and `tests/fixtures/simple-prd-v2.ts`

**Problems Solved**:
- Ensures delta sessions are created with correct directory structure and naming
- Confirms parent-child linkage is properly established and persisted
- Verifies PRD differences are correctly computed and summarized
- Validates TaskPatcher correctly transitions task states based on PRD changes
- Prevents data corruption through atomic file operations

## What

**User-Visible Behavior**: No direct user-visible behavior - this is infrastructure validation for the delta session system that enables incremental PRD development.

**Success Criteria**:
- [ ] Test verifies delta session directory is created with new hash (different from parent)
- [ ] Test verifies `parent_session.txt` file exists and contains parent session ID
- [ ] Test verifies delta PRD (diffSummary) is generated and contains change information
- [ ] Test verifies TaskPatcher marks modified tasks as 'Planned' for re-execution
- [ ] Test verifies TaskPatcher marks removed tasks as 'Obsolete'
- [ ] Test verifies session metadata includes correct parent session reference
- [ ] Test verifies delta session contains both oldPRD and newPRD content
- [ ] All tests pass with `npx vitest run tests/integration/core/delta-session.test.ts`

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Core implementation files

- file: src/core/session-manager.ts
  why: Contains createDeltaSession() method that orchestrates delta session creation
  pattern: Look for `async createDeltaSession(newPRDPath: string): Promise<DeltaSession>`
  gotcha: Returns DeltaSession interface with oldPRD, newPRD, and diffSummary fields
  lines: 540-617

- file: src/core/task-patcher.ts
  why: Contains patchBacklog() function that marks tasks as new/modified/obsolete
  pattern: Look for `function patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog`
  gotcha: Uses updateItemStatus() for immutable updates, returns new backlog object
  lines: 64-110

- file: src/core/prd-differ.ts
  why: Contains diffPRDs() function that computes PRD differences
  pattern: Look for `function diffPRDs(oldPRD: string, newPRD: string): DiffResult`
  gotcha: Returns DiffResult with changes array and summaryText fields
  lines: 468-538 (change detection), 355-399 (content comparison)

- file: src/core/models.ts
  why: Type definitions for DeltaSession, DeltaAnalysis, RequirementChange, SessionMetadata
  pattern: Look for `interface DeltaSession extends SessionState`
  gotcha: DeltaSession includes readonly oldPRD, newPRD, diffSummary fields
  lines: 1443-1578 (DeltaAnalysis, RequirementChange)

- file: src/utils/task-utils.ts
  why: Contains updateItemStatus() and findItem() helper functions
  pattern: Look for `function updateItemStatus(backlog: Backlog, itemId: string, newStatus: Status)`
  gotcha: Recursively traverses backlog hierarchy to update item status immutably
  lines: 301-404 (updateItemStatus), 90-108 (findItem)

# CRITICAL PATTERNS - Delta session creation workflow

- docfile: src/core/session-manager.ts
  section: Lines 540-617 - createDeltaSession method
  why: Shows complete delta session creation flow including validation, diffing, directory creation
  pattern: Validates current session exists → hashes new PRD → reads old/new PRD → computes diff → creates directory → writes parent_session.txt → returns DeltaSession

- docfile: src/core/task-patcher.ts
  section: Lines 64-110 - patchBacklog function
  why: Shows task marking logic for modified/removed/added changes
  pattern: Uses Map for O(1) change lookup, switch statement for change type handling, updateItemStatus for immutable updates

- docfile: tests/integration/core/session-structure.test.ts
  section: Lines 1-200 - Integration test structure patterns
  why: Reference for temp directory management, PRD generation, assertion patterns
  pattern: beforeEach/afterEach for setup/teardown, generateValidPRD for test content, multi-step verification

# EXISTING TEST FIXTURES

- file: tests/fixtures/simple-prd.ts
  why: Mock PRD content for initial session creation
  pattern: Minimal valid PRD with known structure
  gotcha: Must be at least 100 characters to pass PRD validation
  hash: b8c07e8b7d2 (first 12 chars of SHA-256)

- file: tests/fixtures/simple-prd-v2.ts
  why: Modified PRD content for testing delta session creation
  pattern: Same structure as simple-prd.ts with content modifications
  gotcha: Different hash from v1, use for change detection
  hash: 7a3f91e4c8f (first 12 chars of SHA-256)

- file: tests/fixtures/mock-delta-data.ts
  why: Contains mock delta analysis data for task patching tests
  pattern: Exports mockOldPRD, mockNewPRD, mockCompletedTaskIds
  gotcha: Use these for predictable task patching results
```

### Current Codebase Tree

```bash
tests/
├── integration/
│   └── core/
│       ├── session-manager.test.ts      # Reference for SessionManager integration tests
│       ├── session-structure.test.ts    # Reference for directory structure validation
│       └── [existing test files...]
├── fixtures/
│   ├── simple-prd.ts                    # Mock PRD with known hash (b8c07e8b7d2)
│   ├── simple-prd-v2.ts                 # Mock PRD v2 with different hash (7a3f91e4c8f)
│   └── mock-delta-data.ts               # Mock delta analysis data
└── setup.ts                             # Global test setup

src/
└── core/
    ├── session-manager.ts               # createDeltaSession() at lines 540-617
    ├── task-patcher.ts                  # patchBacklog() at lines 64-110
    ├── prd-differ.ts                    # diffPRDs() function
    ├── session-utils.ts                 # hashPRD(), createSessionDirectory()
    └── models.ts                        # DeltaSession, DeltaAnalysis, RequirementChange types
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
├── integration/
│   └── core/
│       ├── session-manager.test.ts      # (existing - reference)
│       ├── session-structure.test.ts    # (existing - reference)
│       └── delta-session.test.ts        # NEW - Integration test for delta session creation
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: createDeltaSession() requires a CURRENT SESSION to be loaded
// Cannot call createDeltaSession() without first calling initialize()
const manager = new SessionManager(prdPath, planDir);
await manager.initialize(); // Must do this first
const deltaSession = await manager.createDeltaSession(newPRDPath);

// CRITICAL: createDeltaSession() updates #currentSession to point to delta session
// After calling createDeltaSession(), manager.currentSession IS the delta session
const parentSessionId = manager.currentSession.metadata.parentSession; // Access parent via metadata

// CRITICAL: DeltaSession extends SessionState with additional fields
// Access oldPRD, newPRD, diffSummary directly from DeltaSession object
const deltaSession: DeltaSession = await manager.createDeltaSession(newPRDPath);
console.log(deltaSession.oldPRD);    // Original PRD content
console.log(deltaSession.newPRD);    // Modified PRD content
console.log(deltaSession.diffSummary); // Structured diff summary

// CRITICAL: parent_session.txt contains PARENT SESSION ID, not path
// File content is just the session ID string (e.g., "001_14b9dc2a33c7")
const parentContent = readFileSync(join(sessionPath, 'parent_session.txt'), 'utf-8');
expect(parentContent.trim()).toBe(parentSessionId); // Just the ID, not full path

// CRITICAL: DeltaAnalysis expects different structure than DeltaSession
// DeltaAnalysis is from DeltaAnalysisWorkflow (QA agent)
// DeltaSession is from createDeltaSession() (SessionManager)
// TaskPatcher consumes DeltaAnalysis, not DeltaSession

// CRITICAL: TaskPatcher.patchBacklog() is IMMUTABLE
// Always returns a NEW backlog object, never modifies the input
const patchedBacklog = patchBacklog(originalBacklog, deltaAnalysis);
// originalBacklog is UNCHANGED, patchedBacklog is NEW object

// CRITICAL: TaskPatcher uses DeltaAnalysis.changes, not DiffResult.changes
// DeltaAnalysis.changes has: { type, itemId, ... }
// DiffResult.changes has: { type, section, oldContent, newContent, impact, affectedTaskIds }
// These are DIFFERENT interfaces!

// CRITICAL: diffPRDs() returns DiffResult, not DeltaAnalysis
// DiffResult is structured PRD diffing (markdown sections)
// DeltaAnalysis is semantic analysis (QA agent interpretation)
// createDeltaSession() uses diffPRDs() for diffSummary
// TaskPatcher uses DeltaAnalysis from DeltaAnalysisWorkflow

// CRITICAL: Session ID format is {sequence}_{hash}
// Sequence is zero-padded to 3 digits: "001", "002", etc.
// Hash is first 12 characters of SHA-256
const sessionPattern = /^(\d{3})_([a-f0-9]{12})$/;

// CRITICAL: Delta session increments sequence number from parent
// If parent is "001_abc123", delta will be "002_def456"
const currentSeq = parseInt(parentSessionId.split('_')[0], 10);
const newSeq = currentSeq + 1;

// CRITICAL: For integration tests, use REAL filesystem operations
// Don't mock fs operations - use mkdtempSync() for temp directories
// Use writeFileSync() and readFileSync() for file operations
// Use rmSync() for cleanup

// CRITICAL: PRD validation requires minimum length and structure
// PRD must be at least 100 characters
// PRD must have valid markdown structure with headers
// Use generateValidPRD() helper from session-structure.test.ts as reference

// CRITICAL: TaskPatcher.updateItemStatus() is RECURSIVE
// Traverses phases → milestones → tasks → subtasks
// Updates FIRST matching item ID found
// Returns completely NEW backlog object (deep copy)

// CRITICAL: Status transitions for task patching
// Modified tasks: Any status → 'Planned' (for re-execution)
// Removed tasks: Any status → 'Obsolete' (preserve history)
// Added tasks: No change (placeholder - not implemented)

// GOTCHA: DeltaSession.taskRegistry starts as EMPTY backlog
// Line 598: taskRegistry: { backlog: [] }
// Task generation happens AFTER delta session creation (via Architect Agent)
// For testing, you may need to manually populate taskRegistry

// GOTCHA: createDeltaSession() does NOT call TaskPatcher
// TaskPatcher is called later in the pipeline (PRPPipeline)
// Delta session creation only sets up the structure
// Task patching is a separate step

// GOTCHA: hasSessionChanged() compares CACHED hash with session hash
// Must call initialize() to recompute hash after PRD modification
// Otherwise hasSessionChanged() will use old cached value

// GOTCHA: For testing TaskPatcher, create mock DeltaAnalysis
// Don't use real DiffResult - create mock DeltaAnalysis with expected structure
const mockDeltaAnalysis: DeltaAnalysis = {
  hasDelta: true,
  changes: [
    { type: 'modified', itemId: 'P1.M1.T1', ... },
    { type: 'removed', itemId: 'P1.M2.T1', ... },
  ],
  patchInstructions: 'Test instructions',
  taskIds: new Set(['P1.M1.T1', 'P1.M2.T1']),
};

// GOTCHA: Vitest requires vi.mock() calls at TOP LEVEL before imports
// For this test file, mock agent calls to avoid LLM dependencies
// Use real filesystem and crypto operations (no mocking needed)
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Import core dependencies
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  writeFileSync,
  readFileSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';

// Import SessionManager and types
import { SessionManager } from '../../../src/core/session-manager.js';
import { patchBacklog } from '../../../src/core/task-patcher.js';
import type { DeltaSession, Backlog, DeltaAnalysis } from '../../../src/core/models.js';

// Import test fixtures
import { mockSimplePRD } from '../../fixtures/simple-prd.js';
import { mockSimplePRDv2 } from '../../fixtures/simple-prd-v2.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/core/delta-session.test.ts
  - IMPLEMENT: Integration test file with describe block for delta session validation
  - FOLLOW pattern: tests/integration/core/session-structure.test.ts (test structure, setup/teardown)
  - NAMING: delta-session.test.ts (integration test naming convention)
  - PLACEMENT: tests/integration/core/ directory (alongside other core integration tests)

Task 2: IMPLEMENT test file setup and teardown utilities
  - IMPLEMENT: beforeEach() creating temp dir with mkdtempSync(join(tmpdir(), 'delta-session-test-'))
  - IMPLEMENT: afterEach() cleaning up with rmSync(tempDir, { recursive: true, force: true })
  - IMPLEMENT: Helper function `createTestPRD(path, content)` for writing PRD files
  - IMPLEMENT: Helper function `createTestBacklog()` for creating mock task backlogs
  - IMPLEMENT: Helper function `createMockDeltaAnalysis()` for creating DeltaAnalysis objects
  - FOLLOW pattern: tests/integration/core/session-structure.test.ts (temp directory management)
  - VARIABLE: let tempDir: string, prdPath: string, planDir: string at describe block scope

Task 3: IMPLEMENT delta session directory creation test (CONTRACT a)
  - IMPLEMENT: it('should create delta session directory with new hash')
  - SETUP: Create initial PRD and initialize SessionManager
  - EXECUTE: await manager.initialize(); const parentSessionId = manager.currentSession.metadata.id;
  - MODIFY: Write new PRD content to trigger delta creation
  - EXECUTE: const deltaSession = await manager.createDeltaSession(prdPath);
  - VERIFY: deltaSession.metadata.id !== parentSessionId (different hash)
  - VERIFY: deltaSession.metadata.id.matches(/^(\d{3})_([a-f0-9]{12})$/)
  - VERIFY: existsSync(deltaSession.metadata.path) is true
  - VERIFY: parseInt(deltaSession.metadata.id.split('_')[0], 10) === parseInt(parentSessionId.split('_')[0], 10) + 1

Task 4: IMPLEMENT parent_session.txt linkage test (CONTRACT b)
  - IMPLEMENT: it('should create parent_session.txt with parent session ID')
  - SETUP: Create initial session and delta session (from Task 3)
  - VERIFY: existsSync(join(deltaSession.metadata.path, 'parent_session.txt')) is true
  - VERIFY: readFileSync(parentSessionPath, 'utf-8').trim() === parentSessionId
  - VERIFY: deltaSession.metadata.parentSession === parentSessionId
  - VERIFY: Parent session ID is NOT a path, just the ID string

Task 5: IMPLEMENT delta PRD generation test (CONTRACT c)
  - IMPLEMENT: it('should generate delta PRD with diff summary')
  - SETUP: Create initial session and delta session with known PRD modifications
  - VERIFY: deltaSession.diffSummary is defined and non-empty
  - VERIFY: deltaSession.oldPRD === original PRD content
  - VERIFY: deltaSession.newPRD === modified PRD content
  - VERIFY: diffSummary contains change information (check for expected sections)
  - VERIFY: diffSummary is generated from diffPRDs() (check structure)

Task 6: IMPLEMENT TaskPatcher modified tasks test (CONTRACT d - modified)
  - IMPLEMENT: it('should mark modified tasks as Planned for re-execution')
  - SETUP: Create backlog with completed tasks
  - CREATE: mock DeltaAnalysis with modified changes
  - EXECUTE: const patchedBacklog = patchBacklog(backlog, deltaAnalysis);
  - VERIFY: Modified task status === 'Planned' (reset from 'Complete')
  - VERIFY: Task ID matches modified change.itemId
  - VERIFY: Other tasks unchanged

Task 7: IMPLEMENT TaskPatcher obsolete tasks test (CONTRACT d - removed)
  - IMPLEMENT: it('should mark removed tasks as Obsolete')
  - SETUP: Create backlog with completed tasks
  - CREATE: mock DeltaAnalysis with removed changes
  - EXECUTE: const patchedBacklog = patchBacklog(backlog, deltaAnalysis);
  - VERIFY: Removed task status === 'Obsolete'
  - VERIFY: Task ID matches removed change.itemId
  - VERIFY: Task preserved in backlog (not deleted)

Task 8: IMPLEMENT TaskPatcher comprehensive test (CONTRACT d - combined)
  - IMPLEMENT: it('should handle multiple change types correctly')
  - SETUP: Create backlog with multiple tasks
  - CREATE: mock DeltaAnalysis with modified, removed, and added changes
  - EXECUTE: const patchedBacklog = patchBacklog(backlog, deltaAnalysis);
  - VERIFY: Modified tasks → 'Planned'
  - VERIFY: Removed tasks → 'Obsolete'
  - VERIFY: Added tasks logged (warning in logger)
  - VERIFY: Unaffected tasks unchanged

Task 9: IMPLEMENT delta session with task patching integration test
  - IMPLEMENT: it('should create delta session and patch tasks correctly')
  - SETUP: Create session with completed tasks, modify PRD
  - EXECUTE: Create delta session and patch backlog
  - VERIFY: Delta session created correctly
  - VERIFY: Task patching applied correctly
  - VERIFY: Session linkage preserved
  - VERIFY: Diff summary accurate

Task 10: IMPLEMENT edge cases test suite
  - IMPLEMENT: it('should handle PRD with no changes')
  - VERIFY: Delta session still created, no tasks marked as modified
  - IMPLEMENT: it('should handle multiple delta sessions in sequence')
  - VERIFY: Each delta session correctly links to parent
  - IMPLEMENT: it('should handle PRD revert to previous version')
  - VERIFY: Delta session created, hash matches previous
  - IMPLEMENT: it('should handle session with no parent (initial session)')
  - VERIFY: parentSession is null for initial sessions
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Test file setup with temp directory
describe('Delta Session Creation and Linkage', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'delta-session-test-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  // Helper function to create test PRD
  function createTestPRD(path: string, content: string): void {
    writeFileSync(path, content, { mode: 0o644 });
  }

  // Helper function to create minimal backlog
  function createTestBacklog(): Backlog {
    return {
      backlog: [
        {
          type: 'Phase',
          id: 'P1',
          title: 'Test Phase',
          status: 'Planned',
          description: 'Test phase',
          milestones: [
            {
              type: 'Milestone',
              id: 'P1.M1',
              title: 'Test Milestone',
              status: 'Complete',
              description: 'Test milestone',
              tasks: [
                {
                  type: 'Task',
                  id: 'P1.M1.T1',
                  title: 'Test Task',
                  status: 'Complete',
                  description: 'Test task',
                  subtasks: [],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  // Helper function to create mock DeltaAnalysis
  function createMockDeltaAnalysis(overrides?: Partial<DeltaAnalysis>): DeltaAnalysis {
    return {
      hasDelta: true,
      changes: [
        {
          type: 'modified',
          itemId: 'P1.M1.T1',
          oldContent: 'Old content',
          newContent: 'New content',
          impact: 'high',
        },
      ],
      patchInstructions: 'Test patch instructions',
      taskIds: new Set(['P1.M1.T1']),
      ...overrides,
    };
  }
});

// PATTERN: Delta session directory creation test (CONTRACT a)
it('should create delta session directory with new hash', async () => {
  // SETUP: Create initial PRD and session
  createTestPRD(prdPath, mockSimplePRD);
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();
  const parentSessionId = manager.currentSession.metadata.id;
  const parentHash = manager.currentSession.metadata.hash;

  // MODIFY: Update PRD with new content
  createTestPRD(prdPath, mockSimplePRDv2);

  // EXECUTE: Create delta session
  const deltaSession = await manager.createDeltaSession(prdPath);

  // VERIFY: Delta session has different ID (different hash)
  expect(deltaSession.metadata.id).not.toBe(parentSessionId);

  // VERIFY: Delta session follows naming pattern
  expect(deltaSession.metadata.id).toMatch(/^(\d{3})_([a-f0-9]{12})$/);

  // VERIFY: Delta session has incremented sequence number
  const parentSeq = parseInt(parentSessionId.split('_')[0], 10);
  const deltaSeq = parseInt(deltaSession.metadata.id.split('_')[0], 10);
  expect(deltaSeq).toBe(parentSeq + 1);

  // VERIFY: Delta session has different hash
  expect(deltaSession.metadata.hash).not.toBe(parentHash);

  // VERIFY: Delta session directory exists
  expect(existsSync(deltaSession.metadata.path)).toBe(true);

  // VERIFY: Delta session path contains session ID
  expect(deltaSession.metadata.path).toContain(deltaSession.metadata.id);
});

// PATTERN: parent_session.txt linkage test (CONTRACT b)
it('should create parent_session.txt with parent session ID', async () => {
  // SETUP: Create initial session and delta session
  createTestPRD(prdPath, mockSimplePRD);
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();
  const parentSessionId = manager.currentSession.metadata.id;

  createTestPRD(prdPath, mockSimplePRDv2);
  const deltaSession = await manager.createDeltaSession(prdPath);

  // VERIFY: parent_session.txt file exists
  const parentSessionPath = join(deltaSession.metadata.path, 'parent_session.txt');
  expect(existsSync(parentSessionPath)).toBe(true);

  // VERIFY: parent_session.txt contains parent session ID
  const parentContent = readFileSync(parentSessionPath, 'utf-8');
  expect(parentContent.trim()).toBe(parentSessionId);

  // VERIFY: Delta session metadata includes parent reference
  expect(deltaSession.metadata.parentSession).toBe(parentSessionId);

  // VERIFY: Parent session ID is not a path, just the ID
  expect(parentSessionId).not.toContain('/');
  expect(parentSessionId).toMatch(/^(\d{3})_([a-f0-9]{12})$/);
});

// PATTERN: Delta PRD generation test (CONTRACT c)
it('should generate delta PRD with diff summary', async () => {
  // SETUP: Create initial session and delta session
  createTestPRD(prdPath, mockSimplePRD);
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();

  createTestPRD(prdPath, mockSimplePRDv2);
  const deltaSession = await manager.createDeltaSession(prdPath);

  // VERIFY: Delta session contains old PRD
  expect(deltaSession.oldPRD).toBeDefined();
  expect(deltaSession.oldPRD).toBe(mockSimplePRD);

  // VERIFY: Delta session contains new PRD
  expect(deltaSession.newPRD).toBeDefined();
  expect(deltaSession.newPRD).toBe(mockSimplePRDv2);

  // VERIFY: Delta session contains diff summary
  expect(deltaSession.diffSummary).toBeDefined();
  expect(deltaSession.diffSummary.length).toBeGreaterThan(0);

  // VERIFY: Diff summary contains change information
  expect(deltaSession.diffSummary).toContain('Phase 1'); // Example check
});

// PATTERN: TaskPatcher modified tasks test (CONTRACT d - modified)
it('should mark modified tasks as Planned for re-execution', () => {
  // SETUP: Create backlog with completed task
  const backlog = createTestBacklog();
  const deltaAnalysis = createMockDeltaAnalysis({
    changes: [
      {
        type: 'modified',
        itemId: 'P1.M1.T1',
        oldContent: 'Old content',
        newContent: 'New content',
        impact: 'high',
      },
    ],
    taskIds: new Set(['P1.M1.T1']),
  });

  // EXECUTE: Patch backlog
  const patchedBacklog = patchBacklog(backlog, deltaAnalysis);

  // VERIFY: Task status changed to Planned
  const task = findItem(patchedBacklog, 'P1.M1.T1');
  expect(task.status).toBe('Planned');

  // VERIFY: Original backlog unchanged (immutability)
  const originalTask = findItem(backlog, 'P1.M1.T1');
  expect(originalTask.status).toBe('Complete');
});

// PATTERN: TaskPatcher obsolete tasks test (CONTRACT d - removed)
it('should mark removed tasks as Obsolete', () => {
  // SETUP: Create backlog with completed task
  const backlog = createTestBacklog();
  const deltaAnalysis = createMockDeltaAnalysis({
    changes: [
      {
        type: 'removed',
        itemId: 'P1.M1.T1',
        oldContent: 'Old content',
        impact: 'medium',
      },
    ],
    taskIds: new Set(['P1.M1.T1']),
  });

  // EXECUTE: Patch backlog
  const patchedBacklog = patchBacklog(backlog, deltaAnalysis);

  // VERIFY: Task status changed to Obsolete
  const task = findItem(patchedBacklog, 'P1.M1.T1');
  expect(task.status).toBe('Obsolete');

  // VERIFY: Task still exists in backlog (not deleted)
  expect(task).toBeDefined();
  expect(task.id).toBe('P1.M1.T1');
});

// PATTERN: Comprehensive delta session integration test
it('should create delta session and patch tasks end-to-end', async () => {
  // SETUP: Create session with completed tasks
  createTestPRD(prdPath, mockSimplePRD);
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();

  // Manually set up completed tasks (simulate previous work)
  manager.currentSession.taskRegistry = createTestBacklog();

  const parentSessionId = manager.currentSession.metadata.id;

  // MODIFY: Update PRD
  createTestPRD(prdPath, mockSimplePRDv2);

  // EXECUTE: Create delta session
  const deltaSession = await manager.createDeltaSession(prdPath);

  // VERIFY: Delta session structure
  expect(deltaSession.metadata.id).not.toBe(parentSessionId);
  expect(deltaSession.metadata.parentSession).toBe(parentSessionId);
  expect(deltaSession.oldPRD).toBe(mockSimplePRD);
  expect(deltaSession.newPRD).toBe(mockSimplePRDv2);
  expect(deltaSession.diffSummary).toBeDefined();

  // VERIFY: Parent linkage file
  const parentSessionPath = join(deltaSession.metadata.path, 'parent_session.txt');
  expect(existsSync(parentSessionPath)).toBe(true);
  expect(readFileSync(parentSessionPath, 'utf-8').trim()).toBe(parentSessionId);
});

// PATTERN: Edge cases - multiple delta sessions
it('should handle multiple delta sessions in sequence', async () => {
  // SETUP: Create initial session
  createTestPRD(prdPath, mockSimplePRD);
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();

  const session1Id = manager.currentSession.metadata.id;

  // MODIFY: Create first delta
  createTestPRD(prdPath, mockSimplePRDv2);
  const delta1 = await manager.createDeltaSession(prdPath);

  // VERIFY: First delta links to initial session
  expect(delta1.metadata.parentSession).toBe(session1Id);
  expect(parseInt(delta1.metadata.id.split('_')[0], 10)).toBe(2);

  // MODIFY: Create second delta (using v1 again - revert)
  createTestPRD(prdPath, mockSimplePRD);
  const delta2 = await manager.createDeltaSession(prdPath);

  // VERIFY: Second delta links to first delta
  expect(delta2.metadata.parentSession).toBe(delta1.metadata.id);
  expect(parseInt(delta2.metadata.id.split('_')[0], 10)).toBe(3);
});
```

### Integration Points

```yaml
SESSION_MANAGER:
  - class: SessionManager from src/core/session-manager.ts
  - method: async initialize(): Promise<SessionState>
  - method: async createDeltaSession(newPRDPath: string): Promise<DeltaSession>
  - field: #currentSession (holds current or delta session)

TASK_PATCHER:
  - function: patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog
  - behavior: Immutable backlog update with task status changes
  - change types: 'modified' → 'Planned', 'removed' → 'Obsolete', 'added' → log warning

PRD_DIFFER:
  - function: diffPRDs(oldPRD: string, newPRD: string): DiffResult
  - returns: DiffResult with changes array and summaryText
  - usage: Called by createDeltaSession() for diffSummary

MODELS:
  - interface: DeltaSession extends SessionState { oldPRD, newPRD, diffSummary }
  - interface: DeltaAnalysis { hasDelta, changes, patchInstructions, taskIds }
  - interface: RequirementChange { type, itemId, oldContent, newContent, impact }

FILESYSTEM:
  - parent_session.txt: Contains parent session ID (not path)
  - Session directory: {sequence}_{hash}/
  - Subdirectories: architecture/, prps/, artifacts/

TEST_FRAMEWORK:
  - runner: Vitest (configured in vitest.config.ts)
  - environment: node (from vitest.config.ts)
  - real filesystem: mkdtempSync(), writeFileSync(), readFileSync(), rmSync()
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit tests/integration/core/delta-session.test.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run ESLint to check code style
npx eslint tests/integration/core/delta-session.test.ts --fix

# Expected: Zero linting errors. Auto-fix should handle formatting issues.

# Run Prettier for consistent formatting
npx prettier --write tests/integration/core/delta-session.test.ts

# Expected: File formatted successfully.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the new integration test file
npx vitest run tests/integration/core/delta-session.test.ts

# Expected: All tests pass. Check output for any failures.

# Run all core integration tests to ensure no regressions
npx vitest run tests/integration/core/

# Expected: All core integration tests pass.

# Run with coverage report
npx vitest run tests/integration/core/delta-session.test.ts --coverage

# Expected: Coverage shows tested code paths (createDeltaSession, patchBacklog, etc.)
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite execution
npm test

# Expected: All tests pass (unit + integration).

# Verify no regressions in existing tests
npx vitest run tests/integration/core/session-structure.test.ts
npx vitest run tests/integration/core/session-manager.test.ts

# Expected: Existing session-related tests still pass.

# Test project-wide validation
npm run validate

# Expected: All validation checks pass (linting, typecheck, formatting).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual verification: Run test and inspect delta session structure
# Add temporary logging to see actual delta session creation

# Domain-specific: Verify hash computation and session linkage
# Test parent-child session relationships
# Test sequence number incrementing
# Test diff summary accuracy

# Test edge cases:
# - PRD with no changes (still creates delta session)
# - Multiple delta sessions in sequence
# - PRD revert to previous version
# - Session with no parent (initial session)

# File system validation:
# - Verify parent_session.txt permissions (0o644)
# - Verify session directory permissions (0o755)
# - Verify atomic write operations (no corruption)
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npx vitest run tests/integration/core/delta-session.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/integration/core/delta-session.test.ts`
- [ ] No linting errors: `npx eslint tests/integration/core/delta-session.test.ts`
- [ ] No formatting issues: `npx prettier --check tests/integration/core/delta-session.test.ts`

### Feature Validation

- [ ] Delta session directory created with new hash (CONTRACT a)
- [ ] parent_session.txt exists and contains parent session ID (CONTRACT b)
- [ ] Delta PRD generated with diff summary containing changes (CONTRACT c)
- [ ] TaskPatcher marks modified tasks as 'Planned' (CONTRACT d - modified)
- [ ] TaskPatcher marks removed tasks as 'Obsolete' (CONTRACT d - removed)
- [ ] Session metadata includes correct parent session reference
- [ ] Delta session contains both oldPRD and newPRD content
- [ ] Sequence numbers increment correctly across delta sessions

### Code Quality Validation

- [ ] Follows existing test patterns from session-structure.test.ts
- [ ] Test isolation: beforeEach/afterEach properly implemented
- [ ] Descriptive test names following "should..." convention
- [ ] Proper assertions with clear failure messages
- [ ] Real filesystem operations used (not mocked)
- [ ] Helper functions for common operations (createTestPRD, createTestBacklog, createMockDeltaAnalysis)
- [ ] Temp directory cleanup works: rmSync with recursive: true, force: true

### Documentation & Deployment

- [ ] Test file has JSDoc comments explaining purpose
- [ ] Complex test logic has inline comments
- [ ] Test follows Setup/Execute/Verify pattern consistently
- [ ] All CONTRACT requirements from work item description are tested

## Anti-Patterns to Avoid

- ❌ Don't mock filesystem operations in integration tests (use real mkdtempSync, writeFileSync, readFileSync, rmSync)
- ❌ Don't forget to call initialize() before createDeltaSession() (throws error)
- ❌ Don't assume DeltaSession.taskRegistry is populated (starts empty, populated by Architect Agent)
- ❌ Don't confuse DeltaAnalysis with DiffResult (different interfaces, different purposes)
- ❌ Don't forget TaskPatcher.patchBacklog() is IMMUTABLE (returns new backlog, doesn't modify input)
- ❌ Don't use DiffResult.changes for TaskPatcher (use DeltaAnalysis.changes)
- ❌ Don't forget parent_session.txt contains session ID, not path
- ❌ Don't skip temp directory cleanup (always use afterEach with rmSync)
- ❌ Don't hardcode session IDs or hashes (compute from test data)
- ❌ Don't forget to verify sequence number incrementing (delta seq = parent seq + 1)
- ❌ Don't test TaskPatcher without proper DeltaAnalysis structure
- ❌ Don't assume createDeltaSession() calls TaskPatcher (separate steps in pipeline)
- ❌ Don't use relative paths without resolve (always use absolute paths in tests)
- ❌ Don't create test PRDs with invalid structure (must be valid markdown, >100 chars)
- ❌ Don't forget deltaSession updates #currentSession (manager.currentSession IS the delta session after creation)
- ❌ Don't skip testing edge cases (no changes, multiple deltas, PRD revert)
