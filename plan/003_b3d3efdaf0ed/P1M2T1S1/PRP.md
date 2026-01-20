# Product Requirement Prompt (PRP): P1.M2.T1.S1 - Verify tasks.json as single source of truth

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify `tasks.json` is the single source of truth for all task state management, ensuring all status updates flow through `tasks.json`, schema validation prevents malformed data, and atomic write patterns prevent corruption with proper temp file cleanup.

**Deliverable**: Integration test file `tests/integration/tasks-json-authority.test.ts` with complete coverage of state management authority, schema validation, atomic writes, and temp file cleanup verification.

**Success Definition**: All tests pass, verifying:
- All task status updates flow through `tasks.json` via SessionManager
- `tasks.json` is the authoritative source for task execution
- No other files duplicate task state
- Zod schema validation prevents malformed `tasks.json`
- Atomic write pattern prevents corruption (temp file + rename)
- Backup/temp files are cleaned up after successful writes
- State is reloaded correctly from `tasks.json` after updates
- Batching pattern accumulates updates before flush

## Why

- **State Integrity**: Verifies that task state is consistently managed through a single source of truth, preventing divergence and corruption
- **Contract Enforcement**: Validates that the PRD requirement for `tasks.json` as the authoritative source is properly implemented
- **Data Safety**: Ensures atomic write patterns prevent data corruption during crashes or concurrent access
- **Schema Safety**: Confirms Zod validation catches malformed data before it's written to disk
- **Clean Operations**: Verifies temp file cleanup prevents disk space leaks
- **Foundation for Future Work**: This validation ensures state management is solid before building additional features

**Existing Tests**: `tests/integration/core/session-structure.test.ts` provides patterns for integration testing with real filesystem operations and temp directory management

**Contract from PRD**: PRD.md and system_context.md specify that `tasks.json` is the single source of truth with atomic writes

**Integration Context**: This is part of Milestone 1.2 (PRD Requirement Coverage) - validating that the system correctly implements all PRD requirements

## What

Integration tests that verify `tasks.json` serves as the single source of truth for all task state management, with proper validation, atomic writes, and cleanup.

### Success Criteria

- [ ] All task status updates flow through SessionManager → tasks.json
- [ ] `tasks.json` is the authoritative source for task execution state
- [ ] No other files duplicate task state
- [ ] Zod schema validation prevents malformed `tasks.json` on write
- [ ] Zod schema validation prevents loading malformed `tasks.json` on read
- [ ] Atomic write pattern uses temp file + rename to prevent corruption
- [ ] Temp files are cleaned up after successful writes
- [ ] Temp files are cleaned up on write errors
- [ ] State reload correctly reflects `tasks.json` content
- [ ] Batching pattern accumulates updates before flush
- [ ] Multiple state transitions are handled correctly
- [ ] File permissions are correct (0o644 for files)

## All Needed Context

### Context Completeness Check

*This PRP passes the "No Prior Knowledge" test:*
- Complete SessionManager implementation details from codebase research
- Zod schema definitions and validation patterns from models.ts research
- Atomic write pattern implementation from session-utils.ts research
- Integration test patterns from existing test files
- External best practices for atomic writes, Zod testing, and state management
- Clear file paths and line numbers for all referenced code

### Documentation & References

```yaml
# MUST READ - SessionManager implementation
- file: src/core/session-manager.ts
  why: Core state management with batching, flush, and load operations
  lines: 636 (saveBacklog), 740 (loadBacklog), 768 (updateItemStatus), 670 (flushUpdates)
  pattern: State updates accumulate in #pendingUpdates, flush writes atomically
  gotcha: Batching means updates aren't persisted until flushUpdates() is called

# MUST READ - Atomic write implementation
- file: src/core/session-utils.ts
  why: Temp file + rename pattern that prevents corruption
  lines: 99-180 (atomicWrite function)
  pattern: Write to .tmp file, then atomic rename to target
  gotcha: Temp file must be in same directory for atomic rename

# MUST READ - Task models and Zod schemas
- file: src/core/models.ts
  why: Complete type definitions and Zod validation schemas
  lines: 669-681 (hierarchy interfaces), StatusEnum, BacklogSchema, PhaseSchema, etc.
  pattern: Recursive z.lazy() schemas for hierarchical validation
  gotcha: All fields are readonly (immutable data structures)

# MUST READ - Task utilities for immutable updates
- file: src/core/task-utils.ts
  why: Immutable update pattern used by SessionManager
  lines: 301-399 (updateItemStatus function)
  pattern: Returns new Backlog object with updated status
  gotcha: Never mutates original - always returns new objects

# MUST READ - Existing integration test patterns
- file: tests/integration/core/session-structure.test.ts
  why: Reference patterns for temp directory setup, file verification, cleanup
  pattern: beforeEach/afterEach with mkdtempSync/rmSync, SETUP/EXECUTE/VERIFY sections
  gotcha: Always clean up temp directories even if test fails

# MUST READ - SessionManager integration tests
- file: tests/integration/core/session-manager.test.ts
  why: Examples of SessionManager usage in integration tests
  pattern: Real filesystem operations with SessionManager
  gotcha: Must flushUpdates() to persist batched changes

# MUST READ - System context documentation
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Architecture overview and state management patterns
  section: "Session State Management" (lines 79-100)
  pattern: Session structure, atomic updates, batching
  gotcha: tasks.json is the ONLY persistent state file for task hierarchy

# MUST READ - Delta PRD for P1.M2.T1.S1 context
- file: plan/003_b3d3efdaf0ed/delta_prd.md
  why: Delta requirements for state management verification
  section: "Enhanced Task Management CLI" (h3.5)
  pattern: Task file discovery, state management expectations

# MUST READ - Research: SessionManager state analysis
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S1/research/session-manager-state-analysis.md
  why: Complete analysis of state flow, batching, atomic writes, and cleanup
  section: "State Update Flow", "Atomic Write Pattern", "Key Findings for Testing"

# MUST READ - Research: Zod validation patterns
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S1/research/zod-validation-research.md
  why: Zod schema definitions, validation usage, testing patterns
  section: "Zod Schemas", "Testing Zod Validation", "Best Practices"

# MUST READ - Research: Integration test patterns
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S1/research/integration-test-patterns-research.md
  why: Test fixtures, file system patterns, authority verification patterns
  section: "Test Fixtures and Helper Patterns", "Authority Testing Patterns"

# MUST READ - Research: External best practices
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S1/research/external-best-practices-research.md
  why: Atomic write patterns, Zod testing, SSOT verification patterns
  section: "Atomic Write Patterns", "Zod Testing Best Practices", "Single Source of Truth Verification"

# MUST READ - Vitest documentation
- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking and testing patterns

- url: https://vitest.dev/api/vi.html#vi-spyon
  why: Spying on methods to verify they're called

# MUST READ - Zod documentation
- url: https://zod.dev/api
  why: Complete Zod API reference for validation testing
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   ├── core/
│   │   ├── session-structure.test.ts       # Reference: Integration test patterns
│   │   ├── session-manager.test.ts         # Reference: SessionManager usage
│   │   └── delta-session.test.ts           # Reference: Delta session patterns
│   └── tasks-json-authority.test.ts        # NEW: This PRP's deliverable

src/
├── core/
│   ├── session-manager.ts                 # Reference: State management, batching
│   ├── session-utils.ts                   # Reference: Atomic write, read/write tasks.json
│   ├── task-utils.ts                      # Reference: Immutable updates
│   └── models.ts                          # Reference: Zod schemas, types

plan/003_b3d3efdaf0ed/P1M2T1S1/
├── PRP.md                                 # This file
└── research/
    ├── session-manager-state-analysis.md   # State management research
    ├── zod-validation-research.md         # Zod validation research
    ├── integration-test-patterns-research.md  # Test patterns research
    └── external-best-practices-research.md # External best practices
```

### Desired Codebase Tree (new test file)

```bash
tests/
├── integration/
│   └── tasks-json-authority.test.ts        # NEW: Integration tests for tasks.json authority
│   ├── describe('integration/tasks-json-authority > tasks.json authority enforcement')
│   │   ├── describe('tasks.json file authority')
│   │   │   ├── it('should create tasks.json when backlog is saved')
│   │   │   ├── it('should set correct file permissions (0o644)')
│   │   │   └── it('should be the only persistent state file')
│   │   ├── describe('state update flow through tasks.json')
│   │   │   ├── it('should flow all updates through SessionManager → tasks.json')
│   │   │   ├── it('should persist state atomically on flushUpdates()')
│   │   │   └── it('should reload state correctly from tasks.json')
│   │   ├── describe('no state duplication')
│   │   │   ├── it('should verify no other files duplicate task state')
│   │   │   └── it('should verify in-memory changes do not persist without flush')
│   │   ├── describe('schema validation prevents malformed tasks.json')
│   │   │   ├── it('should validate on write and reject invalid status')
│   │   │   ├── it('should validate on read and reject malformed JSON')
│   │   │   └── it('should validate ID formats with regex patterns')
│   │   ├── describe('atomic write pattern prevents corruption')
│   │   │   ├── it('should use temp file + rename pattern')
│   │   │   └── it('should prevent corruption if process crashes during write')
│   │   ├── describe('temp file cleanup')
│   │   │   ├── it('should clean up temp files after successful write')
│   │   │   └── it('should clean up temp files on write error')
│   │   └── describe('batching and multiple state transitions')
│   │       ├── it('should accumulate updates in memory before flush')
│   │       └── it('should handle multiple state transitions correctly')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Batching pattern means updates aren't persisted until flushUpdates()
// From session-manager.ts lines 777-782
await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
// State is in #pendingUpdates but NOT written to disk yet!
await manager.flushUpdates();  // THIS is when write happens
// Without flush, changes are lost on reload

// CRITICAL: Atomic write requires temp file in SAME directory
// From session-utils.ts lines 99-180
// If temp file is on different filesystem, rename() fails with EXDEV error
const tempPath = resolve(dirname(targetPath), `.${basename(targetPath)}...tmp`);
await writeFile(tempPath, data);
await rename(tempPath, targetPath);  // Atomic ONLY if same filesystem

// GOTCHA: All task objects are readonly (immutable)
// From models.ts - all interfaces have readonly fields
// Cannot mutate: item.status = 'Complete'  // TypeScript error!
// Must use: updateItemStatus(backlog, id, 'Complete')  // Returns new object

// CRITICAL: Zod uses parse() which throws, not safeParse()
// From session-utils.ts writeTasksJSON/readTasksJSON
const validated = BacklogSchema.parse(backlog);  // Throws ZodError if invalid
// Don't need to check result.success - error propagates

// GOTCHA: Temp files start with dot (hidden files)
// Pattern: .tasks.json.{randomHex}.tmp
// Use glob pattern .**/*.tmp to find temp files for cleanup verification

// CRITICAL: File permissions on Unix use octal
// Files should have 0o644 (rw-r--r--)
// Directories should have 0o755 (rwxr-xr-x)
const mode = stats.mode & 0o777;  // Mask to get permission bits

// GOTCHA: Integration tests use REAL filesystem, not mocks
// From session-structure.test.ts pattern
// mkdtempSync() creates real temp directories
// rmSync() cleans up real directories
// No vi.mock() for fs operations in integration tests

// CRITICAL: Must import with .js extensions (ES modules)
import { SessionManager } from '../../src/core/session-manager.js';
import type { Backlog } from '../../src/core/models.js';

// GOTCHA: afterEach cleanup runs even if test fails
// Pattern: rmSync(tempDir, { recursive: true, force: true })
// The force: true ensures cleanup even if files are locked

// CRITICAL: SessionManager.initialize() creates session directory
// Must be called before any state operations
// Returns SessionState with metadata.path
const session = await manager.initialize();
const tasksPath = join(session.metadata.path, 'tasks.json');

// GOTCHA: Status enum values are case-sensitive
// 'Complete' is valid, 'complete' is NOT
// Status must be one of: Planned, Researching, Implementing, Complete, Failed, Obsolete

// CRITICAL: Zod schemas use z.lazy() for recursive structures
// MilestoneSchema contains TaskSchema contains SubtaskSchema
// Cannot use forward declarations - must use z.lazy()

// GOTCHA: Test fixtures must generate unique PRD content
// Use generateValidPRD(uniqueSuffix) to avoid hash collisions
// Same PRD content = same hash = same session directory

// CRITICAL: Integration tests verify ACTUAL file operations
// Unlike unit tests which mock fs operations
// Tests verify atomic writes actually work, temp files are created and cleaned up
```

## Implementation Blueprint

### Data Models and Structure

The test uses existing models from `src/core/models.ts`:

```typescript
// Test fixtures create Backlog structures matching these types
type Backlog {
  readonly backlog: Phase[];
}

type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/integration/tasks-json-authority.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPORT: All dependencies (vitest, SessionManager, models, fs utilities)
  - SETUP: Helper functions (generateValidPRD, createMinimalBacklog, findItemById)
  - SETUP: beforeEach/afterEach hooks with temp directory management
  - IMPLEMENT: Top-level describe block
  - FOLLOW pattern: tests/integration/core/session-structure.test.ts (lines 1-152)
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT tasks.json file authority tests
  - ADD: describe block 'tasks.json file authority'
  - IMPLEMENT: it('should create tasks.json when backlog is saved')
    - SETUP: Create session, save backlog
    - EXECUTE: Check tasks.json exists
    - VERIFY: File exists, contains valid JSON, correct structure
  - IMPLEMENT: it('should set correct file permissions (0o644)')
    - SETUP: Create session, save backlog
    - EXECUTE: Check file permissions
    - VERIFY: Mode is 0o644 (rw-r--r--)
  - IMPLEMENT: it('should be the only persistent state file')
    - SETUP: Create session, save backlog
    - EXECUTE: List all files in session directory
    - VERIFY: Only tasks.json contains task state
  - FOLLOW pattern: tests/integration/core/session-structure.test.ts (lines 270-318)
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test section

Task 3: IMPLEMENT state update flow tests
  - ADD: describe block 'state update flow through tasks.json'
  - IMPLEMENT: it('should flow all updates through SessionManager → tasks.json')
    - SETUP: Create session, spy on saveBacklog
    - EXECUTE: Update status, flush
    - VERIFY: saveBacklog was called, state persisted
  - IMPLEMENT: it('should persist state atomically on flushUpdates()')
    - SETUP: Create session, update status without flush
    - EXECUTE: Load from file before flush
    - VERIFY: Changes not persisted yet
    - EXECUTE: Call flushUpdates(), load again
    - VERIFY: Changes now persisted
  - IMPLEMENT: it('should reload state correctly from tasks.json')
    - SETUP: Create session, save backlog
    - EXECUTE: Load fresh SessionManager with same PRD
    - VERIFY: Loaded state matches saved state
  - SETUP: Spy on SessionManager methods
  - FOLLOW pattern: session-manager.test.ts
  - DEPENDENCIES: Task 2 (file authority)
  - PLACEMENT: After file authority tests

Task 4: IMPLEMENT no state duplication tests
  - ADD: describe block 'no state duplication'
  - IMPLEMENT: it('should verify no other files duplicate task state')
    - SETUP: Create session, save backlog
    - EXECUTE: Search for task IDs in all session files
    - VERIFY: Only tasks.json contains task state
  - IMPLEMENT: it('should verify in-memory changes do not persist without flush')
    - SETUP: Create session, update status
    - EXECUTE: Don't call flush, create new manager instance
    - VERIFY: New manager doesn't see the changes
  - SETUP: Helper function to search files for content
  - FOLLOW pattern: From external best practices research
  - DEPENDENCIES: Task 3 (state flow)
  - PLACEMENT: After state flow tests

Task 5: IMPLEMENT schema validation tests
  - ADD: describe block 'schema validation prevents malformed tasks.json'
  - IMPLEMENT: it('should validate on write and reject invalid status')
    - SETUP: Create backlog with invalid status
    - EXECUTE: Try to save via SessionManager
    - VERIFY: Throws validation error, tasks.json not created
  - IMPLEMENT: it('should validate on read and reject malformed JSON')
    - SETUP: Create invalid tasks.json manually
    - EXECUTE: Try to load via SessionManager
    - VERIFY: Throws validation error
  - IMPLEMENT: it('should validate ID formats with regex patterns')
    - SETUP: Create backlog with invalid ID format
    - EXECUTE: Try to save via SessionManager
    - VERIFY: Throws validation error with specific message
  - SETUP: Use BacklogSchema.safeParse() for validation testing
  - FOLLOW pattern: From zod-validation-research.md
  - DEPENDENCIES: Task 4 (no duplication)
  - PLACEMENT: After no duplication tests

Task 6: IMPLEMENT atomic write pattern tests
  - ADD: describe block 'atomic write pattern prevents corruption'
  - IMPLEMENT: it('should use temp file + rename pattern')
    - SETUP: Spy on writeFile and rename
    - EXECUTE: Save backlog
    - VERIFY: writeFile called with .tmp extension
    - VERIFY: rename called from temp to target
  - IMPLEMENT: it('should prevent corruption if process crashes during write')
    - SETUP: Mock writeFile to succeed, rename to fail
    - EXECUTE: Save backlog
    - VERIFY: Original tasks.json unchanged, temp file cleaned up
  - SETUP: Mock fs operations to simulate failure scenarios
  - FOLLOW pattern: From external-best-practices-research.md
  - DEPENDENCIES: Task 5 (schema validation)
  - PLACEMENT: After schema validation tests

Task 7: IMPLEMENT temp file cleanup tests
  - ADD: describe block 'temp file cleanup'
  - IMPLEMENT: it('should clean up temp files after successful write')
    - SETUP: Create session
    - EXECUTE: Save backlog
    - VERIFY: No .tmp files remain in session directory
  - IMPLEMENT: it('should clean up temp files on write error')
    - SETUP: Mock writeFile to fail
    - EXECUTE: Try to save backlog
    - VERIFY: No .tmp files remain despite error
  - SETUP: Helper to count .tmp files
  - FOLLOW pattern: From external-best-practices-research.md
  - DEPENDENCIES: Task 6 (atomic writes)
  - PLACEMENT: After atomic write tests

Task 8: IMPLEMENT batching and multiple state transitions tests
  - ADD: describe block 'batching and multiple state transitions'
  - IMPLEMENT: it('should accumulate updates in memory before flush')
    - SETUP: Create session
    - EXECUTE: Multiple updateItemStatus calls
    - VERIFY: saveBacklog not called yet
    - EXECUTE: Call flushUpdates()
    - VERIFY: saveBacklog called once with all updates
  - IMPLEMENT: it('should handle multiple state transitions correctly')
    - SETUP: Create session with multiple items
    - EXECUTE: Update various items, flush
    - VERIFY: All updates persisted correctly
    - EXECUTE: Reload and verify state
  - SETUP: Create backlog with multiple items for testing
  - FOLLOW pattern: From session-manager-state-analysis.md
  - DEPENDENCIES: Task 7 (cleanup)
  - PLACEMENT: Final test section

Task 9: VERIFY test coverage and completeness
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Temp directory cleanup in afterEach
  - VERIFY: All contract requirements from PRD tested
  - RUN: npx vitest run tests/integration/tasks-json-authority.test.ts
  - VERIFY: All tests pass
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Integration tests for tasks.json as Single Source of Truth
 *
 * @remarks
 * Tests validate that tasks.json is the authoritative source for all task state,
 * ensuring all updates flow through SessionManager, schema validation prevents
 * malformed data, atomic writes prevent corruption, and temp files are cleaned up.
 *
 * Tests verify:
 * - All task status updates flow through tasks.json via SessionManager
 * - tasks.json is the authoritative source for task execution
 * - No other files duplicate task state
 * - Zod schema validation prevents malformed tasks.json
 * - Atomic write pattern prevents corruption
 * - Temp files are cleaned up after writes
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/session-manager.ts | SessionManager Implementation}
 * @see {@link ../../PRD.md | PRD: State Management Requirements}
 */

// PATTERN: Import statements with .js extensions
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { SessionManager } from '../../../src/core/session-manager.js';
import { BacklogSchema, type Backlog, type Status } from '../../../src/core/models.js';

// PATTERN: Helper function to generate valid PRD
function generateValidPRD(uniqueSuffix: string): string {
  return `# Test Project ${uniqueSuffix}

A minimal project for tasks.json authority testing.

## P1: Test Phase

Validate tasks.json as single source of truth.

### P1.M1: Test Milestone

Create tasks.json authority tests.

#### P1.M1.T1: Create Authority Tests

Implement integration tests for tasks.json authority.

##### P1.M1.T1.S1: Write Authority Tests

Create tests for tasks.json authority verification.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: tasks.json authority verification ${uniqueSuffix}
2. INPUT: SessionManager implementation
3. LOGIC: Verify tasks.json is single source of truth
4. OUTPUT: Passing integration tests for tasks.json authority
`;
}

// PATTERN: Helper function to create minimal backlog
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
                    context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
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

// PATTERN: Helper to find item by ID in backlog
function findItemById(backlog: Backlog, id: string): { status: Status } | null {
  for (const phase of backlog.backlog) {
    if (phase.id === id) return phase;
    for (const milestone of phase.milestones) {
      if (milestone.id === id) return milestone;
      for (const task of milestone.tasks) {
        if (task.id === id) return task;
        for (const subtask of task.subtasks) {
          if (subtask.id === id) return subtask;
        }
      }
    }
  }
  return null;
}

// PATTERN: Test structure with describe blocks
describe('integration/tasks-json-authority > tasks.json authority enforcement', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // SETUP: Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'tasks-json-authority-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // CLEANUP: Remove temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  // PATTERN: File authority test
  describe('tasks.json file authority', () => {
    it('should create tasks.json when backlog is saved', async () => {
      // SETUP: Create test PRD
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-1'));

      // EXECUTE: Initialize session and save backlog
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // VERIFY: tasks.json exists and contains valid JSON
      const tasksPath = join(session.metadata.path, 'tasks.json');
      expect(existsSync(tasksPath)).toBe(true);

      const tasksContent = readFileSync(tasksPath, 'utf-8');
      const tasksData = JSON.parse(tasksContent) as Backlog;
      expect(tasksData).toHaveProperty('backlog');
      expect(Array.isArray(tasksData.backlog)).toBe(true);
      expect(tasksData.backlog[0].id).toBe('P1');
    });
  });

  // PATTERN: State flow verification test
  describe('state update flow through tasks.json', () => {
    it('should persist state atomically on flushUpdates()', async () => {
      // SETUP: Create session and save initial backlog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-flush'));
      const manager = new SessionManager(prdPath, planDir);
      await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // EXECUTE: Update status without flush
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

      // VERIFY: Changes not persisted yet (batching)
      let currentBacklog = await manager.loadBacklog();
      let item = findItemById(currentBacklog, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Complete'); // In-memory is updated

      // EXECUTE: Load fresh instance (reads from disk, not memory)
      const manager2 = new SessionManager(prdPath, planDir);
      await manager2.initialize();
      const backlogFromDisk = await manager2.loadBacklog();
      item = findItemById(backlogFromDisk, 'P1.M1.T1.S1');

      // VERIFY: Disk still has old status (flush not called)
      expect(item?.status).toBe('Planned');

      // EXECUTE: Now flush to persist
      await manager.flushUpdates();

      // VERIFY: After flush, disk has new status
      const manager3 = new SessionManager(prdPath, planDir);
      await manager3.initialize();
      const backlogAfterFlush = await manager3.loadBacklog();
      item = findItemById(backlogAfterFlush, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Complete');
    });
  });

  // PATTERN: Schema validation test
  describe('schema validation prevents malformed tasks.json', () => {
    it('should validate on write and reject invalid status', async () => {
      // SETUP: Create backlog with invalid status
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-invalid'));
      const manager = new SessionManager(prdPath, planDir);
      await manager.initialize();

      const invalidBacklog: Backlog = {
        backlog: [
          {
            type: 'Phase',
            id: 'P1',
            title: 'Test Phase',
            status: 'InvalidStatus' as Status, // Invalid!
            description: 'Test',
            milestones: [],
          },
        ],
      };

      // EXECUTE & VERIFY: Should throw validation error
      await expect(manager.saveBacklog(invalidBacklog))
        .rejects.toThrow();

      // VERIFY: tasks.json was not created (or unchanged)
      const tasksPath = join(manager.currentSession!.metadata.path, 'tasks.json');
      expect(existsSync(tasksPath)).toBe(false);
    });
  });

  // PATTERN: Temp file cleanup test
  describe('temp file cleanup', () => {
    it('should clean up temp files after successful write', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-cleanup'));
      const manager = new SessionManager(prdPath, planDir);
      await manager.initialize();
      const sessionPath = manager.currentSession!.metadata.path;

      // EXECUTE: Save backlog (uses atomic write internally)
      await manager.saveBacklog(createMinimalBacklog());

      // VERIFY: No .tmp files remain
      const files = readdirSync(sessionPath);
      const tempFiles = files.filter(f => f.endsWith('.tmp'));
      expect(tempFiles).toHaveLength(0);
    });
  });
});
```

### Integration Points

```yaml
SESSION_MANAGER:
  - initialize(): Creates session directory and loads/creates tasks.json
  - saveBacklog(): Persists backlog to tasks.json (validates via Zod, atomic write)
  - loadBacklog(): Loads backlog from tasks.json (validates via Zod)
  - updateItemStatus(): Updates status in memory (batched)
  - flushUpdates(): Persists batched updates to tasks.json

SESSION_UTILS:
  - writeTasksJSON(): Validates with Zod, calls atomicWrite()
  - readTasksJSON(): Reads file, validates with Zod
  - atomicWrite(): Temp file + rename pattern

TASK_UTILS:
  - updateItemStatus(): Immutable update returning new Backlog

MODELS:
  - BacklogSchema: Zod schema for entire hierarchy
  - PhaseSchema, MilestoneSchema, TaskSchema, SubtaskSchema: Recursive schemas
  - StatusEnum: Valid status values

NO_EXTERNAL_FILE_OPERATIONS:
  - Tests use real filesystem (integration tests)
  - No mocks for fs operations
  - Real temp directories via mkdtempSync()
  - Real file operations via SessionManager

SCOPE_BOUNDARIES:
  - This PRP tests tasks.json authority
  - Does NOT test individual SessionManager methods (unit tests do that)
  - Does NOT test TaskOrchestrator traversal (separate test file)
  - Does NOT test delta sessions (separate test file)
  - Tests verify STATE MANAGEMENT CONTRACT, not individual implementation details
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/integration/tasks-json-authority.test.ts --fix

# Check TypeScript types
npx tsc --noEmit tests/integration/tasks-json-authority.test.ts

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the tasks-json-authority file
npx vitest run tests/integration/tasks-json-authority.test.ts

# Run with coverage
npx vitest run tests/integration/tasks-json-authority.test.ts --coverage

# Run all integration tests to ensure no breakage
npx vitest run tests/integration/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify all integration tests still pass
npx vitest run tests/integration/

# Run related integration tests to ensure no breakage
npx vitest run tests/integration/core/

# Check that existing session tests still work
npx vitest run tests/integration/core/session-manager.test.ts
npx vitest run tests/integration/core/session-structure.test.ts

# Expected: All existing tests pass, new tests pass
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/tasks-json-authority.test.ts

# Check test file follows project conventions
head -50 tests/integration/tasks-json-authority.test.ts
# Should see: describe blocks, proper imports, helper functions

# Verify all test categories are present
grep -n "describe.*tasks.json file authority" tests/integration/tasks-json-authority.test.ts
grep -n "describe.*state update flow" tests/integration/tasks-json-authority.test.ts
grep -n "describe.*no state duplication" tests/integration/tasks-json-authority.test.ts
grep -n "describe.*schema validation" tests/integration/tasks-json-authority.test.ts
grep -n "describe.*atomic write pattern" tests/integration/tasks-json-authority.test.ts
grep -n "describe.*temp file cleanup" tests/integration/tasks-json-authority.test.ts
grep -n "describe.*batching" tests/integration/tasks-json-authority.test.ts

# Verify SETUP/EXECUTE/VERIFY pattern
grep -n "SETUP:" tests/integration/tasks-json-authority.test.ts
grep -n "EXECUTE:" tests/integration/tasks-json-authority.test.ts
grep -n "VERIFY:" tests/integration/tasks-json-authority.test.ts

# Expected: Test file well-structured, all categories present
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] Test file structure follows project patterns
- [ ] Tests use real filesystem (integration test pattern)
- [ ] Temp directory cleanup in afterEach
- [ ] Tests import with .js extensions
- [ ] All describe blocks have clear, descriptive names
- [ ] Helper functions follow existing patterns

### Feature Validation

- [ ] All task status updates flow through SessionManager → tasks.json
- [ ] tasks.json is the authoritative source for task execution
- [ ] No other files duplicate task state
- [ ] Zod schema validation prevents malformed tasks.json on write
- [ ] Zod schema validation prevents loading malformed tasks.json on read
- [ ] Atomic write pattern uses temp file + rename
- [ ] Temp files cleaned up after successful writes
- [ ] Temp files cleaned up on write errors
- [ ] State reload correctly reflects tasks.json content
- [ ] Batching pattern accumulates updates before flush
- [ ] Multiple state transitions handled correctly

### Code Quality Validation

- [ ] Follows existing integration test patterns from session-structure.test.ts
- [ ] Helper functions use same patterns as existing tests
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes rmSync with force: true
- [ ] Tests use SETUP/EXECUTE/VERIFY sections
- [ ] Tests focus on state management contract, not implementation details

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Test names clearly describe what is being tested
- [ ] Research documents stored in research/ subdirectory
- [ ] Tests verify PRD requirements for tasks.json authority

---

## Anti-Patterns to Avoid

- ❌ Don't mock fs operations in integration tests - use real filesystem
- ❌ Don't skip flushUpdates() - batching means updates won't persist without it
- ❌ Don't mutate task objects directly - they're readonly, use updateItemStatus()
- ❌ Don't forget to call initialize() before state operations
- ❌ Don't assume state persists without flush - verify with reload
- ❌ Don't skip temp directory cleanup - causes test pollution
- ❌ Don't use vi.mock() for SessionManager in integration tests
- ❌ Don't skip testing batching behavior - critical for state management
- ❌ Don't forget to import with .js extensions
- ❌ Don't skip schema validation tests - Zod is critical for safety
- ❌ Don't skip temp file cleanup verification - prevents disk leaks
- ❌ Don't test unit-level functionality - integration tests verify contracts
- ❌ Don't hardcode file paths - use join() for cross-platform compatibility
- ❌ Don't skip verifying atomic write pattern - prevents corruption
- ❌ Don't skip testing that no other files duplicate state - SSOT requirement

---

**PRP Version:** 1.0
**Work Item:** P1.M2.T1.S1
**Created:** 2026-01-19
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**
- Complete SessionManager implementation details with line numbers
- Comprehensive Zod schema research with testing patterns
- Atomic write pattern fully documented with external references
- Integration test patterns from existing test files
- Clear task breakdown with dependency ordering
- All contract requirements from PRD covered
- Extensive research documentation in research/ subdirectory
- No gaps in context - implementation can proceed with PRP alone
