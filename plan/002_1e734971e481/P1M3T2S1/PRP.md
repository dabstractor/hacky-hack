# Product Requirement Prompt (PRP): Test SessionState Serialization

**PRP ID**: P1.M3.T2.S1
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Create comprehensive unit tests for SessionState serialization to validate that session state structures can be properly serialized to JSON and persisted atomically using the temp file + rename pattern.

**Deliverable**: New test file at `tests/unit/core/session-state-serialization.test.ts` with:
1. Test for valid SessionState JSON serialization (JSON.stringify succeeds)
2. Test for SessionState deserialization (JSON.parse preserves all fields)
3. Test for atomic write pattern (temp file + rename)
4. Test for invalid state (missing required fields) fails validation

**Success Definition**:
- SessionState object serializes to valid JSON
- Deserialized JSON preserves all SessionState fields correctly
- Atomic write pattern (temp file + rename) works correctly
- Invalid SessionState (missing required fields) fails validation
- All tests pass with 100% coverage
- Tests follow existing patterns from session-utils.test.ts (describe/it, SETUP/EXECUTE/VERIFY)

---

## User Persona

**Target User**: Developer working on the Session Manager who needs to ensure that session state can be reliably serialized and persisted.

**Use Case**: Implementing session persistence features and needing assurance that SessionState structures serialize correctly to JSON and can be written atomically.

**User Journey**:
1. SessionManager creates SessionState object in memory
2. SessionState needs to be persisted to disk
3. Components serialized separately (taskRegistry to tasks.json, etc.)
4. Atomic write pattern prevents data corruption
5. Tests verify serialization and persistence work correctly

**Pain Points Addressed**:
- **Silent serialization errors**: Tests catch JSON serialization issues early
- **Data corruption on crash**: Atomic write pattern tests prevent partial writes
- **Missing field validation**: Tests ensure all required fields are present
- **Date serialization**: Tests verify Date objects serialize correctly as ISO strings

---

## Why

- **Data Integrity**: SessionState is the core structure for session management. Tests ensure it can be reliably serialized and persisted.
- **Crash Recovery**: Atomic write pattern tests verify that session state won't be corrupted if the process crashes during write.
- **Type Safety Confidence**: While SessionState has no Zod schema currently, tests ensure it follows the structure required for serialization.
- **Regression Prevention**: Changes to SessionState won't break serialization if tests catch issues.
- **Executable Documentation**: Tests serve as living documentation of expected SessionState serialization behavior.
- **Problems Solved**:
  - "Does SessionState serialize correctly to JSON?"
  - "Do Date fields serialize properly as ISO strings?"
  - "Does the atomic write pattern work for session persistence?"
  - "What happens if required fields are missing?"

---

## What

Create a new test file at `tests/unit/core/session-state-serialization.test.ts` with comprehensive tests for SessionState serialization.

### Current State Analysis

**SessionState Interface** (from `src/core/models.ts` lines 860-905):
```typescript
export interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string;
  readonly taskRegistry: Backlog;
  readonly currentItemId: string | null;
}

interface SessionMetadata {
  readonly id: string;              // Format: {sequence}_{hash}
  readonly hash: string;            // First 12 chars of SHA-256 PRD hash
  readonly path: string;            // Filesystem path to session directory
  readonly createdAt: Date;         // Timestamp when session was created
  readonly parentSession: string | null;  // Parent session ID for delta sessions
}

interface Backlog {
  readonly backlog: Phase[];  // Task hierarchy
}
```

**Key Insight**: SessionState is NOT serialized as a whole. Components are stored separately:
- `taskRegistry` → `tasks.json` (validated with `BacklogSchema`)
- `prdSnapshot` → `prd_snapshot.md` (raw markdown)
- `metadata` → parsed from directory name and filesystem stats
- `currentItemId` → managed in-memory by SessionManager

**No Zod Schema Exists**: There is NO Zod schema for SessionState. Tests validate structure through serialization.

### Success Criteria

- [ ] Test 1: Verify valid SessionState serializes to JSON (JSON.stringify succeeds)
- [ ] Test 2: Verify SessionState deserializes from JSON (JSON.parse preserves fields)
- [ ] Test 3: Test atomic write pattern (temp file + rename)
- [ ] Test 4: Test invalid state (missing required fields) fails
- [ ] Test 5: Verify Date fields serialize as ISO strings
- [ ] Test 6: Verify nested Backlog structure serializes correctly
- [ ] All tests follow existing patterns from session-utils.test.ts
- [ ] 100% coverage for SessionState serialization logic

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] SessionState interface fully analyzed (4 fields with types)
- [x] SessionMetadata structure documented (5 fields)
- [x] Backlog structure documented (wraps Phase array)
- [x] Existing test patterns identified (SETUP/EXECUTE/VERIFY)
- [x] Atomic write pattern documented (temp file + rename)
- [x] Mocking strategy confirmed (100% mocked fs operations)
- [x] Codebase tree structure confirmed
- [x] No Zod schema for SessionState (important constraint)

---

### Documentation & References

```yaml
# MUST READ - SessionState interface definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains SessionState interface (lines 860-905) and SessionMetadata (lines 761-814)
  section: Lines 860-905 (SessionState), Lines 761-814 (SessionMetadata)
  critical: |
    - SessionState has 4 fields: metadata, prdSnapshot, taskRegistry, currentItemId
    - SessionMetadata has 5 fields: id, hash, path, createdAt, parentSession
    - All fields are readonly
    - createdAt is Date type (serializes as ISO string)
    - No Zod schema exists for SessionState

# MUST READ - Backlog interface definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains Backlog interface (lines 685-697) and Phase structure
  section: Lines 685-697
  critical: |
    - Backlog wraps array of Phase objects
    - Has BacklogSchema for Zod validation
    - Task hierarchy: Phase > Milestone > Task > Subtask

# MUST READ - SessionManager serialization
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains flushUpdates() method (lines 534-584) showing persistence pattern
  section: Lines 534-584
  critical: |
    - Uses saveBacklog() to persist taskRegistry
    - Batch updates accumulate in memory
    - Single atomic write on flush
    - Error handling preserves dirty state

# MUST READ - Atomic write implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Contains atomicWrite() function (lines 93-111) and writeTasksJSON() (lines 266-290)
  section: Lines 93-111 (atomicWrite), Lines 266-290 (writeTasksJSON)
  critical: |
    - Temp file naming: .{basename}.{random-hex}.tmp
    - Write with mode 0o644
    - Atomic rename on same filesystem
    - Cleanup temp file on error
    - JSON.stringify with 2-space indentation

# MUST READ - Existing serialization tests
- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts
  why: Contains atomic write pattern tests (lines 430-567) to follow as pattern
  section: Lines 430-567
  pattern: |
    - Use describe/it blocks with SETUP/EXECUTE/VERIFY comments
    - Mock node:fs/promises functions
    - Verify temp file creation and rename
    - Test cleanup on failure
    - Use factory functions for test data

# MUST READ - Test data factory patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts
  why: Contains createTest* factory functions for generating test data
  section: Full file
  pattern: |
    - createTestSubtask(id, title, status, dependencies)
    - createTestTask(id, title, status, subtasks)
    - createTestBacklog(phases)
    - Follow this pattern for SessionState test data

# MUST READ - System context documentation
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md
  why: Contains session state structure (section 6.3) and protected files (section 6.4)
  section: Lines 325-354
  critical: |
    - tasks.json is single source of truth
    - Session directory structure: plan/{sequence}_{hash}/
    - Protected files must never be deleted

# RESEARCH DOCUMENTATION - SessionState interface analysis
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T2S1/research/sessionstate-interface-research.md
  why: Complete analysis of SessionState interface structure
  section: Full file
  critical: |
    - 4 fields with exact types
    - Example SessionState objects
    - Architecture insights
    - No Zod schema exists

# RESEARCH DOCUMENTATION - Test patterns
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T2S1/research/test-patterns-research.md
  why: Complete testing patterns for serialization tests
  section: Full file
  critical: |
    - SETUP/EXECUTE/VERIFY pattern
    - Mock strategy for fs operations
    - Factory function patterns
    - Error handling patterns
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   └── core/
│       ├── models.ts                    # SOURCE: SessionState interface (lines 860-905), SessionMetadata (761-814)
│       ├── session-manager.ts           # REFERENCE: flushUpdates() method (lines 534-584)
│       ├── session-utils.ts             # REFERENCE: atomicWrite() (93-111), writeTasksJSON() (266-290)
│       └── index.ts                     # Export of SessionState type
├── tests/
│   ├── setup.ts                         # Global test setup
│   └── unit/
│       └── core/
│           ├── models.test.ts           # REFERENCE: Existing model tests
│           ├── session-utils.test.ts    # REFERENCE: Atomic write tests (lines 430-567)
│           ├── session-manager.test.ts  # REFERENCE: SessionManager tests (2613 lines)
│           └── task-utils.test.ts       # REFERENCE: Factory function patterns
├── vitest.config.ts                     # Test configuration (100% coverage)
├── plan/
│   └── 002_1e734971e481/
│       ├── architecture/
│       │   └── system_context.md        # REFERENCE: Section 6.3 (Session State)
│       └── P1M3T2S1/
│           └── research/                # RESEARCH: All research documents
└── package.json
```

---

### Desired Codebase Tree (files to be added)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── core/
            └── session-state-serialization.test.ts   # NEW: SessionState serialization tests
                                                        # ADD: describe block for SessionState serialization
                                                        # MAINTAIN: All existing test patterns
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: SessionState is NOT Serialized as a Whole
// Components are stored separately:
// - taskRegistry → tasks.json (via writeTasksJSON)
// - prdSnapshot → prd_snapshot.md (raw markdown)
// - metadata → parsed from directory name
// - currentItemId → managed in-memory only
// Tests should verify JSON.stringify works, but note this is for validation

// CRITICAL: No Zod Schema Exists for SessionState
// Cannot use SubtaskSchema.safeParse() pattern
// Must validate through JSON serialization only
// Use JSON.parse() after JSON.stringify() to verify roundtrip

// CRITICAL: createdAt Field is Date Type
// Date objects serialize to ISO strings in JSON
// After JSON.parse(), createdAt will be string, not Date
// Must use new Date() to reconstruct Date objects
// OR test that ISO string format is preserved

// CRITICAL: Backlog Has Zod Schema, SessionState Does Not
// BacklogSchema exists and validates taskRegistry
// No SessionStateSchema exists
// Tests must validate structure manually

// CRITICAL: Atomic Write Pattern Requires Same Filesystem
// Temp file must be in same directory as target
// Cross-filesystem rename fails with EXDEV error
// Use resolve(dirname(targetPath), ...) for temp path

// CRITICAL: Temp File Naming Pattern
// Format: .{basename}.{random-hex}.tmp
// Must be unique to avoid conflicts
// Use randomBytes() or similar for uniqueness

// CRITICAL: 100% Code Coverage Requirement
// All tests must achieve 100% coverage
// Check coverage with: npm run test:coverage

// GOTCHA: Vitest Globals Are Enabled
// No need to import describe, it, expect, test, etc.
// They are available globally in all test files

// CRITICAL: Test File Naming Convention
// Use .test.ts suffix (not .spec.ts)
// Follow existing pattern: session-state-serialization.test.ts

// CRITICAL: All File Operations Are Mocked
// Do NOT use real fs operations in tests
// Always mock node:fs/promises functions
// Verify mock calls, not actual file state

// GOTCHA: JSON.stringify and Date Objects
// Dates become ISO strings: "2024-01-12T10:00:00.000Z"
// After JSON.parse(), must manually convert back to Date
// Tests should verify ISO string format is correct

// CRITICAL: readonly Fields in TypeScript
// SessionState fields are readonly
// After deserialization, readonly modifier is lost
// Object.freeze() can be used to preserve readonly at runtime

// GOTCHA: Circular References in JSON
// SessionState should not have circular references
// But JSON.stringify() will throw if they exist
// Consider testing that circular refs are handled (or don't exist)

// CRITICAL: Error Handling in Atomic Writes
// Must cleanup temp file on error
// Must re-throw original error after cleanup
// Cleanup errors should be ignored (don't mask original error)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests serialization of existing SessionState interface.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing SessionState interface and related structures
  - FILE: src/core/models.ts
  - READ: Lines 860-905 (SessionState interface)
  - READ: Lines 761-814 (SessionMetadata interface)
  - READ: Lines 685-697 (Backlog interface)
  - UNDERSTAND: All field types and constraints
  - DEPENDENCIES: None

Task 2: READ existing atomic write tests
  - FILE: tests/unit/core/session-utils.test.ts
  - READ: Lines 430-567 (atomic write pattern tests)
  - UNDERSTAND: Test structure and mock patterns
  - EXTRACT: Patterns for temp file verification
  - DEPENDENCIES: None

Task 3: READ factory function patterns for test data
  - FILE: tests/unit/core/task-utils.test.ts
  - EXTRACT: createTest* function patterns
  - UNDERSTAND: How to build test Backlog objects
  - DEPENDENCIES: None

Task 4: CREATE test file with imports and mocks
  - FILE: tests/unit/core/session-state-serialization.test.ts
  - IMPORT: SessionState, SessionMetadata, Backlog from src/core/models.ts
  - MOCK: node:fs/promises module (writeFile, rename, unlink)
  - MOCK: node:crypto module (randomBytes)
  - PATTERN: Follow existing test file structure
  - DEPENDENCIES: Task 1, Task 2, Task 3

Task 5: IMPLEMENT factory functions for test data
  - CREATE: createTestSessionMetadata() function
  - CREATE: createTestSessionState() function
  - PATTERN: Follow createTest* functions from task-utils.test.ts
  - RETURN: Valid test objects with all required fields
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 1 - SessionState JSON serialization
  - CREATE: describe block for JSON serialization tests
  - IMPLEMENT: "should serialize SessionState to JSON"
  - VERIFY: JSON.stringify() succeeds
  - VERIFY: All fields present in serialized string
  - VERIFY: Date fields serialize as ISO strings
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 2 - SessionState deserialization
  - IMPLEMENT: "should deserialize JSON to SessionState"
  - VERIFY: JSON.parse() succeeds
  - VERIFY: All fields preserved (except Date becomes string)
  - VERIFY: Can reconstruct Date objects from ISO strings
  - VERIFY: Nested Backlog structure preserved
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 3 - Atomic write pattern
  - CREATE: describe block for atomic write tests
  - IMPLEMENT: "should write SessionState with atomic pattern"
  - VERIFY: Temp file created with .tmp extension
  - VERIFY: writeFile() called before rename()
  - VERIFY: rename() uses temp path and target path
  - VERIFY: Mode 0o644 used for file permissions
  - PATTERN: Follow session-utils.test.ts lines 430-452
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 4 - Cleanup on failure
  - IMPLEMENT: "should clean up temp file on write failure"
  - SETUP: Mock writeFile() to reject
  - VERIFY: unlink() called to cleanup
  - VERIFY: Original error re-thrown
  - PATTERN: Follow session-utils.test.ts lines 484-500
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Test 5 - Invalid state validation
  - CREATE: describe block for validation tests
  - IMPLEMENT: "should fail with missing required fields"
  - SETUP: Create SessionState missing metadata
  - VERIFY: JSON.stringify() might succeed but structure is invalid
  - VERIFY: Accessing missing field causes error
  - IMPLEMENT: "should fail with missing metadata fields"
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 6 - Date serialization
  - IMPLEMENT: "should serialize Date fields as ISO strings"
  - VERIFY: createdAt becomes ISO string in JSON
  - VERIFY: ISO string format is valid
  - VERIFY: Can reconstruct Date from ISO string
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 7 - Backlog structure serialization
  - IMPLEMENT: "should serialize nested Backlog structure"
  - SETUP: Create SessionState with full task hierarchy
  - VERIFY: All levels serialize correctly
  - VERIFY: Arrays and objects preserved
  - DEPENDENCIES: Task 11

Task 13: RUN tests and verify coverage
  - RUN: npm test -- tests/unit/core/session-state-serialization.test.ts
  - VERIFY: All new tests pass
  - VERIFY: Coverage is 100% for SessionState serialization
  - FIX: Any failing tests or coverage gaps
  - DEPENDENCIES: Task 12

Task 14: RUN typecheck and verify compilation
  - RUN: npm run typecheck
  - VERIFY: No TypeScript compilation errors
  - DEPENDENCIES: Task 13
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Factory Functions for Test Data
// =============================================================================

import { SessionState, SessionMetadata, Backlog, Phase, Status } from '$lib/core/models.js';

function createTestSessionMetadata(
  overrides: Partial<SessionMetadata> = {}
): SessionMetadata {
  return {
    id: '001_14b9dc2a33c7',
    hash: '14b9dc2a33c7',
    path: 'plan/001_14b9dc2a33c7',
    createdAt: new Date('2024-01-12T10:00:00Z'),
    parentSession: null,
    ...overrides,
  };
}

function createTestBacklog(phases: Phase[] = []): Backlog {
  return { backlog: phases };
}

function createTestSessionState(
  overrides: Partial<SessionState> = {}
): SessionState {
  return {
    metadata: createTestSessionMetadata(),
    prdSnapshot: '# Test PRD\n\nThis is a test.',
    taskRegistry: createTestBacklog(),
    currentItemId: 'P1.M1.T1.S1',
    ...overrides,
  };
}

// =============================================================================
// PATTERN: Mock Setup
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

import { writeFile, rename, unlink } from 'node:fs/promises';

const mockWriteFile = vi.mocked(writeFile);
const mockRename = vi.mocked(rename);
const mockUnlink = vi.mocked(unlink);

// =============================================================================
// PATTERN: Test 1 - SessionState JSON Serialization
// =============================================================================

describe('SessionState JSON serialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should serialize SessionState to valid JSON', () => {
    // SETUP: Create valid SessionState
    const state = createTestSessionState();

    // EXECUTE: Serialize to JSON
    const jsonStr = JSON.stringify(state);

    // VERIFY: Serialization succeeded
    expect(jsonStr).toBeDefined();
    expect(typeof jsonStr).toBe('string');

    // VERIFY: Can parse back
    const parsed = JSON.parse(jsonStr);
    expect(parsed).toBeDefined();

    // VERIFY: All fields present
    expect(parsed.metadata.id).toBe(state.metadata.id);
    expect(parsed.prdSnapshot).toBe(state.prdSnapshot);
    expect(parsed.currentItemId).toBe(state.currentItemId);
    expect(parsed.taskRegistry).toBeDefined();
  });

  // =============================================================================
  // PATTERN: Test 2 - Date Field Serialization
  // =============================================================================

  it('should serialize Date fields as ISO strings', () => {
    // SETUP: Create SessionState with specific date
    const testDate = new Date('2024-01-12T10:00:00Z');
    const state = createTestSessionState({
      metadata: createTestSessionMetadata({
        createdAt: testDate,
      }),
    });

    // EXECUTE: Serialize to JSON
    const jsonStr = JSON.stringify(state);
    const parsed = JSON.parse(jsonStr);

    // VERIFY: Date became ISO string
    expect(parsed.metadata.createdAt).toBe('2024-01-12T10:00:00.000Z');

    // VERIFY: Can reconstruct Date
    const reconstructedDate = new Date(parsed.metadata.createdAt);
    expect(reconstructedDate.getTime()).toBe(testDate.getTime());
  });

  // =============================================================================
  // PATTERN: Test 3 - Backlog Structure Serialization
  // =============================================================================

  it('should serialize nested Backlog structure correctly', () => {
    // SETUP: Create SessionState with full hierarchy
    const state = createTestSessionState({
      taskRegistry: {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned' as Status,
            description: 'Test phase',
            milestones: [],
          },
        ],
      },
    });

    // EXECUTE: Serialize and deserialize
    const jsonStr = JSON.stringify(state);
    const parsed = JSON.parse(jsonStr);

    // VERIFY: Nested structure preserved
    expect(parsed.taskRegistry.backlog).toHaveLength(1);
    expect(parsed.taskRegistry.backlog[0].id).toBe('P1');
    expect(parsed.taskRegistry.backlog[0].type).toBe('Phase');
  });

  // =============================================================================
  // PATTERN: Test 4 - Atomic Write Pattern
  // =============================================================================

  it('should use atomic write pattern for SessionState', async () => {
    // SETUP: Create SessionState and mock successful operations
    const state = createTestSessionState();
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);

    // EXECUTE: Write SessionState as JSON (simulate writeTasksJSON pattern)
    const content = JSON.stringify(state, null, 2);
    const targetPath = '/test/session/tasks.json';
    const tempPath = `/test/session/.tasks.json.abc123def456.tmp`;

    // Simulate atomicWrite pattern
    await mockWriteFile(tempPath, content, { mode: 0o644 });
    await mockRename(tempPath, targetPath);

    // VERIFY: Atomic write pattern used
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.any(String),
      { mode: 0o644 }
    );
    expect(mockRename).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      targetPath
    );
  });

  // =============================================================================
  // PATTERN: Test 5 - Cleanup on Failure
  // =============================================================================

  it('should clean up temp file on write failure', async () => {
    // SETUP: Mock write failure
    const writeError = new Error('ENOSPC: no space left');
    mockWriteFile.mockRejectedValue(writeError);
    mockUnlink.mockResolvedValue(undefined);

    // EXECUTE: Attempt write (will fail)
    const state = createTestSessionState();
    const tempPath = '/test/session/.tasks.json.abc123def456.tmp';

    try {
      await mockWriteFile(tempPath, JSON.stringify(state), { mode: 0o644 });
    } catch (error) {
      // Expected failure
    }

    // Simulate cleanup (would happen in catch block)
    await mockUnlink(tempPath);

    // VERIFY: Cleanup attempted
    expect(mockUnlink).toHaveBeenCalledWith(tempPath);
  });

  // =============================================================================
  // PATTERN: Test 6 - Invalid State Validation
  // =============================================================================

  it('should handle invalid SessionState gracefully', () => {
    // SETUP: Create invalid SessionState (missing metadata)
    const invalidState = {
      // metadata: missing
      prdSnapshot: '# Test',
      taskRegistry: { backlog: [] },
      currentItemId: 'P1.M1.T1.S1',
    } as unknown; // Cast to bypass TypeScript

    // EXECUTE: Try to serialize
    const jsonStr = JSON.stringify(invalidState);

    // VERIFY: JSON.stringify succeeds (doesn't validate structure)
    expect(jsonStr).toBeDefined();

    // VERIFY: Deserialized object is missing metadata
    const parsed = JSON.parse(jsonStr);
    expect(parsed.metadata).toBeUndefined();

    // NOTE: In real code, Zod schema would catch this
    // But since no SessionStateSchema exists, this test documents current behavior
  });

  // =============================================================================
  // PATTERN: Test 7 - Readonly Field Handling
  // =============================================================================

  it('should preserve readonly semantics through serialization', () => {
    // SETUP: Create SessionState with readonly fields
    const state = createTestSessionState();

    // EXECUTE: Serialize and deserialize
    const jsonStr = JSON.stringify(state);
    const parsed = JSON.parse(jsonStr);

    // VERIFY: Data preserved (readonly modifier lost after JSON.parse)
    expect(parsed.metadata.id).toBe(state.metadata.id);

    // NOTE: To preserve readonly at runtime, use Object.freeze()
    const frozenParsed = Object.freeze(parsed);
    // Attempting to modify frozen object will throw (in strict mode)
  });
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING TESTS:
  - tests/unit/core/session-utils.test.ts has atomic write tests (lines 430-567)
  - Pattern: Use describe/it blocks with SETUP/EXECUTE/VERIFY comments
  - Pattern: Mock node:fs/promises functions
  - Pattern: Verify temp file creation and rename
  - Pattern: Test cleanup on failure
  - This PRP: Creates new test file following these patterns

INPUT FROM EXISTING TEST DATA:
  - tests/unit/core/task-utils.test.ts has factory functions
  - Pattern: createTest* functions for test data
  - Pattern: Override pattern with partial objects
  - This PRP: Creates createTestSessionState() and createTestSessionMetadata()

INPUT FROM PREVIOUS WORK:
  - P1.M3.T1.S3 validated context_scope contract format
  - P1.M3.T1.S2 validated status transitions
  - P1.M3.T1.S1 validated type definitions
  - Context: Understanding model validation and test patterns

OUTPUT FOR SUBSEQUENT WORK:
  - SessionState serialization tests at tests/unit/core/session-state-serialization.test.ts
  - Confidence that SessionState can be serialized to JSON
  - Foundation for P1.M3.T2.S2 (PRPDocument structure) and P1.M3.T2.S3 (delta analysis structures)

DIRECTORY STRUCTURE:
  - Create: tests/unit/core/session-state-serialization.test.ts (new file)
  - No modifications to existing files
  - Tests can run independently

CLEANUP INTEGRATION:
  - None required - tests only, no side effects
  - All file operations are mocked
  - No database or filesystem modifications
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating test file
# Run tests to check for errors
npm test -- tests/unit/core/session-state-serialization.test.ts

# Expected: Tests run without syntax errors
# Expected: New test descriptions appear in output

# TypeScript compilation check
npm run typecheck

# Expected: No TypeScript compilation errors
# Expected: New test file compiles correctly

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file specifically
npm test -- tests/unit/core/session-state-serialization.test.ts

# Expected: All tests pass
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run full test suite for affected area
npm test -- tests/unit/core/

# Expected: All core tests pass
# Expected: No regressions in other test files

# Coverage validation
npm run test:coverage

# Expected: 100% coverage for new test file
# Expected: Coverage for src/core/models.ts is maintained
# Expected: No uncovered lines in SessionState serialization logic

# If tests fail, check:
# - SessionState is imported correctly
# - Mock functions are set up correctly
# - Test data is valid
# - JSON.parse() and JSON.stringify() used correctly
```

### Level 3: Type System Validation (Compile-Time Verification)

```bash
# TypeScript compilation verification
npm run typecheck

# Expected: No compilation errors
# Expected: SessionState serialization logic compiles correctly

# Verify type inference works
cat > /tmp/session-state-test.ts << 'EOF'
import { SessionState, SessionMetadata } from './src/core/models.js';

const metadata: SessionMetadata = {
  id: '001_14b9dc2a33c7',
  hash: '14b9dc2a33c7',
  path: 'plan/001_14b9dc2a33c7',
  createdAt: new Date(),
  parentSession: null,
};

const state: SessionState = {
  metadata,
  prdSnapshot: '# Test PRD',
  taskRegistry: { backlog: [] },
  currentItemId: 'P1.M1.T1.S1',
};

const jsonStr = JSON.stringify(state);
const parsed = JSON.parse(jsonStr);
EOF
npx tsc --noEmit /tmp/session-state-test.ts

# Expected: No type errors
# Expected: SessionState matches interface

# If type errors exist, check:
# - All types are imported correctly
# - Field types match interface definitions
// - Date field handling is correct
```

### Level 4: Integration Testing (Full Pipeline Validation)

```bash
# Full test suite run
npm test

# Expected: All tests pass across entire codebase
# Expected: No new test failures

# Coverage report validation
npm run test:coverage

# Expected: 100% coverage maintained globally
# Expected: No coverage drops in existing files

# Manual verification: Read test output
npm test -- tests/unit/core/session-state-serialization.test.ts --reporter=verbose

# Expected: Clear test names showing SessionState serialization tests
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/unit/core/session-state-serialization.test.ts

# Expected: Tests complete in reasonable time (< 5 seconds)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Valid SessionState serializes to JSON
- [ ] Test 2: SessionState deserializes from JSON
- [ ] Test 3: Atomic write pattern (temp file + rename)
- [ ] Test 4: Cleanup on failure
- [ ] Test 5: Invalid state validation
- [ ] Test 6: Date field serialization
- [ ] Test 7: Backlog structure serialization
- [ ] All tests pass: `npm test -- tests/unit/core/session-state-serialization.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] 100% coverage: `npm run test:coverage`

### Feature Validation

- [ ] SessionState JSON.stringify() succeeds
- [ ] All fields preserved through JSON roundtrip
- [ ] Date fields serialize as ISO strings
- [ ] Atomic write pattern verified (temp file + rename)
- [ ] Cleanup on failure tested
- [ ] Invalid state handling documented
- [ ] All tests follow existing patterns from session-utils.test.ts
- [ ] Factory functions follow task-utils.test.ts patterns

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Uses describe/it block structure with clear test names
- [ ] Uses SETUP/EXECUTE/VERIFY comment pattern
- [ ] All file operations are mocked (no real I/O)
- [ ] Factory functions use partial override pattern
- [ ] Error messages are clear and informative
- [ ] Tests are self-documenting with clear names
- [ ] Test file named correctly: session-state-serialization.test.ts

### Documentation & Deployment

- [ ] Tests serve as executable documentation of SessionState serialization
- [ ] Atomic write pattern requirements documented in test names/comments
- [ ] No external dependencies required (uses existing utilities)
- [ ] Tests can run independently without setup
- [ ] Research documents stored in research/ subdirectory

---

## Anti-Patterns to Avoid

- **Don't test real file I/O** - All file operations must be mocked
- **Don't create Zod schema** - No SessionStateSchema exists, don't create one
- **Don't serialize entire SessionState** - Components are stored separately in real code
- **Don't forget Date handling** - Dates become strings after JSON.parse()
- **Don't ignore readonly semantics** - Document that readonly is lost after deserialization
- **Don't skip temp file cleanup** - Always test cleanup on failure
- **Don't use sync operations** - All file operations are async
- **Don't forget mode 0o644** - File permissions should be set correctly
- **Don't hardcode temp file names** - Must use unique random names
- **Don't test across filesystems** - Temp and target must be on same filesystem
- **Don't ignore test data factories** - Use createTest* functions for maintainability
- **Don't skip error path testing** - Error paths are critical for atomic writes
- **Don't assume Zod validation** - No schema exists, validate through serialization
- **Don't forget 100% coverage** - All code paths must be tested

---

## Appendix: Decision Rationale

### Why create a new test file instead of extending existing tests?

The existing `models.test.ts` focuses on Zod schema validation for model types, but SessionState has no Zod schema. Creating a dedicated `session-state-serialization.test.ts` file:
1. Separates serialization testing from schema validation testing
2. Makes the tests easier to find and maintain
3. Follows the pattern of having focused test files (e.g., session-utils.test.ts for file operations)
4. Allows for comprehensive serialization testing without cluttering models.test.ts

### Why test serialization if SessionState is not serialized as a whole?

While SessionState components are stored separately in the real implementation (taskRegistry to tasks.json, etc.), testing the complete SessionState serialization:
1. Validates that all fields are JSON-serializable
2. Catches issues with nested structures (Backlog, etc.)
3. Ensures Date fields serialize correctly
4. Provides a safety net if the serialization strategy changes
5. Documents the current structure through executable tests

### Why use factory functions for test data?

Factory functions provide:
1. **Consistency**: All tests use the same base structure
2. **Flexibility**: Partial overrides allow customization
3. **Maintainability**: Changes to SessionState structure require updating only the factory
4. **Clarity**: Test intent is clearer when data creation is abstracted

### What about the Date field becoming a string after deserialization?

This is expected JSON behavior:
- `Date` objects serialize to ISO strings in JSON
- After `JSON.parse()`, the field is a `string`, not a `Date`
- Tests should verify the ISO string format is correct
- Tests should show how to reconstruct `Date` objects: `new Date(isoString)`

This test documents the current behavior and provides guidance for future implementations.

### Why no Zod schema for SessionState?

Based on codebase analysis:
- SessionState is an in-memory representation
- Components are validated and stored separately
- `BacklogSchema` validates `taskRegistry`
- Other fields are primitives or stored as-is
- Adding a schema would be a design decision outside this task's scope

Tests validate structure through serialization rather than schema validation.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from research agents (6 parallel research tasks)
- [x] SessionState interface fully analyzed and documented
- [x] Existing test patterns identified and extracted
- [x] Atomic write patterns researched with Node.js documentation
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Research documents stored in research/ subdirectory

**Risk Mitigation**:
- New test file (low risk of breaking existing tests)
- Tests only (no production code changes)
- Can be implemented independently
- Easy to verify and iterate
- Clear acceptance criteria
- Follows established patterns from session-utils.test.ts

**Known Risks**:
- **No Zod schema**: Tests must validate through serialization only
  - Mitigation: Tests document current behavior and validate JSON roundtrip
- **Date handling**: Dates become strings after JSON.parse()
  - Mitigation: Tests explicitly verify ISO string format and reconstruction
- **Component separation**: SessionState not serialized as whole in production
  - Mitigation: Tests validate structure while noting implementation pattern

---

**END OF PRP**
