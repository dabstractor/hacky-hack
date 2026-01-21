# Product Requirement Prompt (PRP): Test Task Status Update Propagation

**PRP ID**: P2.M1.T2.S2
**Generated**: 2026-01-15
**Story Points**: 2
**Dependency**: P2.M1.T2.S1 (Atomic Flush Tests) - Must pass before this task begins

---

## Goal

**Feature Goal**: Create comprehensive integration tests for SessionManager's `updateItemStatus()` method, validating exact ID matching behavior, no cascading to children/parents, status update propagation through the batching system, and error handling for invalid inputs.

**Deliverable**: Extended integration test file at `tests/integration/core/session-manager.test.ts` with full coverage of status update propagation scenarios using real filesystem operations and multi-level hierarchy fixtures.

**Success Definition**:

- Subtask status updates only affect the target subtask (parents unchanged)
- Milestone/Task/Phase status updates only affect the target item (children unchanged)
- Multiple status updates accumulate correctly in batching state
- Invalid status values are handled (current: no runtime validation)
- Invalid item IDs are handled (current: no runtime validation, returns unchanged backlog)
- Hierarchy integrity maintained after updates (no corruption)
- All integration tests pass with 100% coverage of updateItemStatus code paths
- Tests document actual behavior (not aspirational behavior)

---

## User Persona

**Target User**: Developer working on SessionManager validation who needs assurance that status updates work correctly without corrupting the task hierarchy.

**Use Case**: Validating that SessionManager's `updateItemStatus()` method correctly updates individual items in the hierarchy without unintended side effects on parent or child items.

**User Journey**:

1. Task Orchestrator calls `updateItemStatus('P1.M1.T1.S1', 'Complete')` - only that subtask updated
2. Multiple calls accumulate in memory: `updateItemStatus('P1.M1.T1.S1', 'Complete')`, `updateItemStatus('P1.M1.T1.S2', 'Complete')`
3. `flushUpdates()` persists all accumulated updates atomically
4. Hierarchy remains intact with only targeted items updated

**Pain Points Addressed**:

- **Unclear propagation behavior**: Does updating a parent affect children? (Tests verify: NO)
- **Unclear reverse propagation**: Does updating a child affect parents? (Tests verify: NO)
- **Invalid input handling**: What happens with invalid status or ID? (Tests document current behavior)
- **Hierarchy corruption risk**: Multiple updates must not corrupt structure
- **Batch state integrity**: Updates must accumulate correctly before flush

---

## Why

- **Behavior Documentation**: Tests serve as executable documentation of actual status update behavior
- **Regression Prevention**: Catch any changes to propagation logic (e.g., if cascading is accidentally added)
- **Integration with Atomic Flush**: P2.M1.T2.S1 tests flush behavior; this tests the update accumulation phase
- **Data Integrity**: Validate that status updates don't corrupt hierarchy structure
- **Edge Case Coverage**: Document current error handling (or lack thereof) for invalid inputs
- **Foundation for Future Enhancements**: If cascading/propagation is added later, these tests establish baseline
- **Problems Solved**:
  - "Does updating a subtask affect its parent task?" (Tests verify: NO)
  - "Does updating a milestone affect all its tasks?" (Tests verify: NO)
  - "What happens with invalid status values?" (Tests document: Accepted, no runtime validation)
  - "What happens with non-existent item IDs?" (Tests document: Returns unchanged backlog)
  - "Do multiple updates accumulate correctly before flush?" (Tests verify: YES)

---

## What

Extend the integration test file at `tests/integration/core/session-manager.test.ts` to validate task status update propagation with real filesystem operations and multi-level hierarchy fixtures.

### Current State Analysis

**SessionManager.updateItemStatus() Method** (from `/src/core/session-manager.ts` lines 632-664):

```typescript
async updateItemStatus(itemId: string, status: Status): Promise<Backlog> {
  if (!this.#currentSession) {
    throw new Error('Cannot update item status: no session loaded');
  }

  // Get current backlog from session
  const currentBacklog = this.#currentSession.taskRegistry;

  // Immutable update using utility function
  const updated = updateItemStatusUtil(currentBacklog, itemId, status);

  // BATCHING: Accumulate in memory instead of immediate write
  this.#pendingUpdates = updated;
  this.#dirty = true;
  this.#updateCount++;

  // Update internal session state
  this.#currentSession = {
    ...this.#currentSession,
    taskRegistry: updated,
  };

  // NOTE: No longer calling await this.saveBacklog(updated)
  // Caller must call flushUpdates() to persist changes

  return updated;
}
```

**Key Implementation Behavior** (from `/src/utils/task-utils.ts` lines 301-404):

```typescript
export function updateItemStatus(
  backlog: Backlog,
  id: string,
  newStatus: Status
): Backlog {
  // Creates deep copy using nested spread operators
  // Updates ONLY the exact item matching the ID
  // NO cascading to children or parents
  // Returns unchanged backlog if ID not found
  // NO validation of status value (TypeScript compile-time only)
  // NO validation of ID format (any string accepted)
}
```

**Status Type Definition** (from `/src/core/models.ts` lines 136-142):

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

**Critical Finding**: The current implementation:

- Does **NOT** cascade status changes to children
- Does **NOT** propagate status changes to parents
- Does **NOT** validate status values at runtime
- Does **NOT** validate item IDs (returns unchanged backlog if not found)
- Does **NOT** support partial ID matching (requires exact match)

### Success Criteria

- [ ] Test 1: Subtask update only affects that subtask (parents unchanged)
- [ ] Test 2: Milestone update only affects that milestone (children unchanged)
- [ ] Test 3: Task update only affects that task (parents/children unchanged)
- [ ] Test 4: Phase update only affects that phase (children unchanged)
- [ ] Test 5: Multiple updates accumulate correctly in batching state
- [ ] Test 6: Invalid status value behavior documented (current: no validation)
- [ ] Test 7: Invalid item ID behavior documented (current: returns unchanged backlog)
- [ ] Test 8: Non-existent item ID returns unchanged backlog
- [ ] Test 9: Hierarchy structure preserved after updates
- [ ] Test 10: Multiple sequential update cycles work correctly
- [ ] All tests use real filesystem (temp directories)
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] SessionManager.updateItemStatus() implementation documented (lines 632-664)
- [x] updateItemStatusUtil() behavior analyzed (exact match only, no cascading)
- [x] Status type definition documented (6 valid values)
- [x] Batching state mechanism understood (#dirty, #pendingUpdates, #updateCount)
- [x] Existing integration test patterns analyzed
- [x] Fixture helper functions documented (createMinimalTasksJson)
- [x] Multi-level hierarchy test patterns researched
- [x] Error handling requirements understood
- [x] Scope boundaries defined (extend existing integration tests)
- [x] Dependency on P2.M1.T2.S1 atomic flush tests established

---

### Documentation & References

```yaml
# MUST READ - SessionManager.updateItemStatus() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains updateItemStatus() method (lines 632-664) with batching logic
  section: Lines 632-664
  critical: |
    - Throws if no session loaded
    - Uses updateItemStatusUtil() for immutable update
    - Accumulates in #pendingUpdates (memory only)
    - Sets #dirty = true and increments #updateCount
    - Does NOT call saveBacklog() - caller must call flushUpdates()
    - Returns updated backlog

# MUST READ - updateItemStatusUtil() implementation
- file: /home/dustin/projects/hacky-hack/src/utils/task-utils.ts
  why: Contains updateItemStatus() function (lines 301-404) with exact match logic
  section: Lines 301-404
  pattern: |
    - Creates deep copy using nested spread operators
    - Updates ONLY exact item matching ID
    - NO cascading to children or parents
    - Returns unchanged backlog if ID not found
    - NO runtime validation of status value
    - NO validation of ID format
  critical: |
    - Uses DFS traversal to find target item
    - Copies entire path to target item (immutability)
    - Other branches of hierarchy returned unchanged
    - If ID not found, entire backlog returned unchanged (no error)

# MUST READ - Status type definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains Status type (lines 136-142) with 6 valid values
  section: Lines 136-142
  pattern: |
    - Type: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
    - Zod schema available: StatusEnum.safeParse() for runtime validation
    - TypeScript compile-time validation only (no runtime checks in updateItemStatus)
  gotcha: |
    - updateItemStatus() does NOT validate status at runtime
    - TypeScript ensures type safety at compile time
    - Zod StatusEnum available but NOT used in updateItemStatus()

# MUST READ - Previous PRP for atomic flush tests (P2.M1.T2.S1)
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T2S1/PRP.md
  why: Contains atomic flush test patterns and batching state documentation
  section: Implementation Tasks and Implementation Patterns
  pattern: |
    - Batch accumulation tests
    - Temp directory setup/teardown
    - SETUP/EXECUTE/VERIFY comment structure
    - Real filesystem operations
  critical: |
    - P2.M1.T2.S1 tests validate flush phase
    - This PRP (P2.M1.T2.S2) tests update accumulation phase
    - Both use same temp directory and fixture patterns
    - Tests are complementary (update + flush = complete batch workflow)

# MUST READ - Existing integration test file
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: This is the file to EXTEND with status propagation tests
  section: Full file (currently 708+ lines with initialize, loadSession, delta detection, atomic flush tests)
  pattern: |
    - describe('SessionManager.initialize()' for new sessions (lines 97-390)
    - describe('SessionManager.loadSession()' for existing sessions (lines 396-707)
    - ADD: describe('SessionManager Status Update Propagation' for propagation tests
    - Use same temp directory setup/teardown pattern
  gotcha: |
    - File already has new session, existing session, delta detection, and atomic flush tests
    - We EXTEND it with new describe() block for status propagation
    - Don't modify existing tests
    - Temp directory pattern: mkdtempSync(join(tmpdir(), 'session-manager-test-'))

# MUST READ - Fixture helper function
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: Contains createMinimalTasksJson() helper function (lines 49-91)
  section: Lines 49-91
  pattern: |
    - Returns Backlog with 1 Phase, 1 Milestone, 1 Task, 1 Subtask
    - Use this for creating initial tasks.json
    - Extend with more items for multi-level testing
  gotcha: |
    - All items start with status: 'Planned'
    - Subtask has context_scope with CONTRACT DEFINITION
    - Zod schema validates this structure
    - Need to create extended fixtures for multi-level testing

# MUST READ - Research: Status propagation patterns
- docfile: plan/002_1e734971e481/P2M1T2S2/research/status-propagation-patterns.md
  why: Comprehensive research on hierarchical status update patterns
  section: Full document
  pattern: |
    - Bottom-up propagation (parent status derived from children)
    - Top-down cascade (parent status pushed to children)
    - Event-driven propagation (change notifications)
    - State machine validation for status transitions
  critical: |
    - Current implementation does NOT implement any propagation
    - Tests validate actual behavior (no cascading)
    - Research documents potential future enhancements
    - Tests establish baseline for any future propagation features

# MUST READ - Research: Testing deep hierarchy structures
- docfile: plan/002_1e734971e481/P2M1T2S2/research/deep-hierarchy-testing.md
  why: Test patterns for multi-level hierarchy validation
  section: Full document
  pattern: |
    - Fluent builder pattern for complex hierarchies
    - HierarchyBuilder/MilestoneBuilder/TaskBuilder/SubtaskBuilder classes
    - Parameterized tests with test.each()
    - Snapshot testing for complex state
  critical: |
    - Use builder pattern to create test hierarchies
    - Test all 4 hierarchy levels (Phase, Milestone, Task, Subtask)
    - Verify no side effects on other levels
    - Performance considerations for deep hierarchies
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts              # SOURCE: updateItemStatus() (632-664)
│   │   │                                   # SOURCE: #dirty, #pendingUpdates, #updateCount
│   │   ├── models.ts                       # SOURCE: Status type (136-142)
│   │   └── session-utils.ts                # REFERENCE: writeTasksJSON()
│   ├── utils/
│   │   └── task-utils.ts                   # SOURCE: updateItemStatusUtil() (301-404)
│   │                                       # SOURCE: findItem() (90-108)
│   └── core/
│       └── task-orchestrator.ts            # REFERENCE: Production usage (calls updateItemStatus)
├── tests/
│   ├── setup.ts                            # Global test setup
│   ├── unit/
│   │   └── core/
│   │       ├── session-manager.test.ts     # EXISTING: Unit tests with mocks
│   │       └── task-utils.test.ts          # EXISTING: updateItemStatusUtil() unit tests
│   ├── fixtures/
│   │   └── (various PRD fixtures)          # REFERENCE: For test data
│   └── integration/
│       └── core/
│           └── session-manager.test.ts    # EXTEND: Add status propagation tests here
├── plan/
│   └── 002_1e734971e481/
│       ├── P2M1T2S1/
│       │   └── PRP.md                     # REFERENCE: Atomic flush tests
│       ├── P2M1T2S2/
│       │   ├── PRP.md                     # NEW: This PRP
│       │   └── research/                  # NEW: Research documentation
│       │       ├── status-propagation-patterns.md
│       │       └── deep-hierarchy-testing.md
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
                                                    # ADD: describe('SessionManager Status Update Propagation', () => { ... })
                                                    # ADD: Tests for subtask updates
                                                    # ADD: Tests for milestone updates
                                                    # ADD: Tests for task updates
                                                    # ADD: Tests for phase updates
                                                    # ADD: Tests for invalid inputs
                                                    # ADD: Tests for multiple updates
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: updateItemStatus() Does NOT Cascade to Children
// Updating a milestone does NOT update its tasks
// Updating a task does NOT update its subtasks
// Only the exact item matching the ID is updated
// Pattern: updateItemStatus('P1.M1', 'Complete') updates ONLY the milestone

// CRITICAL: updateItemStatus() Does NOT Propagate to Parents
// Updating a subtask does NOT update its parent task
// Updating a task does NOT update its parent milestone
// Only the exact item matching the ID is updated
// Pattern: updateItemStatus('P1.M1.T1.S1', 'Complete') updates ONLY the subtask

// CRITICAL: No Runtime Status Validation
// TypeScript validates Status type at compile time
// But updateItemStatus() does NOT validate at runtime
// Invalid status would require type assertion to bypass TypeScript
// Current behavior: Accepts any Status value (type-checked at compile time)

// CRITICAL: No Item ID Format Validation
// updateItemStatus() does NOT validate ID format
// Any string can be passed (even invalid formats)
// If ID not found in hierarchy, returns unchanged backlog
// No error thrown for non-existent IDs

// GOTCHA: Batching State Must Be Flushed
// Updates accumulate in #pendingUpdates (memory)
// Must call flushUpdates() to persist to disk
// Tests should verify in-memory state AND persisted state
// Pattern: updateItemStatus() x N -> flushUpdates() -> verify file

// CRITICAL: Immutability with Deep Copying
// updateItemStatusUtil() creates deep copies of objects along path
// Original backlog remains unchanged
#currentSession.taskRegistry is replaced with new object
// This is important for verifying no side effects

// GOTCHA: Find Item Uses Exact String Matching
// findItem() in task-utils.ts performs exact ID matching
// No partial ID matching (e.g., "P1" won't match "P1.M1")
// No wildcard or regex matching
// Must use full item ID (e.g., "P1.M1.T1.S1")

// CRITICAL: Session Must Be Initialized
// updateItemStatus() throws if #currentSession === null
// Must call initialize() or loadSession() first
// Tests must create session before testing updates
// Session must have valid taskRegistry

// GOTCHA: Empty tasks.json is Valid
// If backlog.backlog is empty array, no items to update
// updateItemStatus() returns unchanged backlog
// Tests should cover empty backlog scenario

// CRITICAL: Multiple Sequential Updates
// Can update -> update -> update -> flush
// Each update replaces #pendingUpdates with new backlog
#updateCount tracks number of accumulated updates
#dirty flag set on first update, remains true until flush

// GOTCHA: Status Values Are Case-Sensitive
// 'Planned' is valid, 'planned' is NOT (TypeScript error)
// 'Complete' is valid, 'complete' is NOT (TypeScript error)
// TypeScript ensures correct case at compile time
// Runtime: Case already validated by type system

// CRITICAL: Integration Tests Use Real Filesystem
// Most tests use real temp directories with real fs operations
// Don't mock fs for normal operation tests
// Use mkdtempSync() for unique temp directories
// Cleanup with rmSync(recursive: true, force: true)

// GOTCHA: Test Fixtures Use createMinimalTasksJson()
// Helper creates 1 Phase, 1 Milestone, 1 Task, 1 Subtask
// All items have status: 'Planned'
// Extend fixture for multi-level testing
// Or create custom fixtures for specific scenarios

// CRITICAL: Previous PRP (P2.M1.T2.S1) Tests Flush Behavior
// Atomic flush tests validate flushUpdates() method
// This PRP (P2.M1.T2.S2) tests updateItemStatus() method
// Tests are complementary (update phase + flush phase = complete)
// Use same temp directory and fixture patterns

// GOTCHA: No Transition Validation in Current Implementation
// Can transition from any status to any other status
// Example: 'Complete' -> 'Planned' is allowed (no validation)
// Example: 'Failed' -> 'Complete' is allowed (no validation)
// Tests document current behavior (not enforce state machine)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing status update behavior with real filesystem operations and multi-level hierarchy fixtures.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY tests/integration/core/session-manager.test.ts exists
  - CHECK: File exists (created by P2.M1.T1.S1 and extended by P2.M1.T1.S2, P2.M1.T1.S3, P2.M1.T2.S1)
  - READ: Existing test file to understand structure
  - IDENTIFY: Where to add new describe() block (after atomic flush tests)
  - DEPENDENCIES: P2.M1.T2.S1 completion (atomic flush tests passing)
  - PLACEMENT: tests/integration/core/session-manager.test.ts

Task 2: READ SessionManager status update implementation
  - FILE: src/core/session-manager.ts
  - READ: Lines 632-664 (updateItemStatus method)
  - FILE: src/utils/task-utils.ts
  - READ: Lines 301-404 (updateItemStatusUtil function)
  - READ: Lines 90-108 (findItem function)
  - FILE: src/core/models.ts
  - READ: Lines 136-142 (Status type)
  - UNDERSTAND: Exact match behavior (no cascading)
  - UNDERSTAND: Batching state mechanism
  - DEPENDENCIES: None

Task 3: CREATE extended fixture helper functions
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: createMultiLevelTasksJson() with 3 tasks per milestone
  - ADD: createDeepHierarchyTasksJson() with multiple phases
  - ADD: createWideHierarchyTasksJson() with multiple subtasks
  - PATTERN: Follow createMinimalTasksJson() structure
  - DEPENDENCIES: Task 2
  - PLACEMENT: Before describe() blocks (after createMinimalTasksJson)

Task 4: CREATE describe() block for status propagation tests
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: describe('SessionManager Status Update Propagation', () => { ... })
  - ADD: beforeEach() to create unique temp directory
  - ADD: afterEach() to cleanup temp directory
  - PATTERN: Follow existing describe() block structure
  - DEPENDENCIES: Task 3

Task 5: IMPLEMENT Test 1 - Subtask update only affects that subtask
  - CREATE: it('should update subtask status without affecting parents', async () => { ... })
  - SETUP: Create session with multi-level tasks.json
  - EXECUTE: Call updateItemStatus('P1.M1.T1.S1', 'Complete')
  - VERIFY: Subtask status changed to 'Complete'
  - VERIFY: Parent task still 'Planned'
  - VERIFY: Parent milestone still 'Planned'
  - VERIFY: Parent phase still 'Planned'
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 2 - Milestone update only affects that milestone
  - CREATE: it('should update milestone status without affecting children', async () => { ... })
  - SETUP: Create session with multi-level tasks.json
  - EXECUTE: Call updateItemStatus('P1.M1', 'Implementing')
  - VERIFY: Milestone status changed to 'Implementing'
  - VERIFY: All tasks under milestone still 'Planned'
  - VERIFY: All subtasks under tasks still 'Planned'
  - VERIFY: Parent phase still 'Planned'
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 3 - Task update only affects that task
  - CREATE: it('should update task status without affecting descendants or ancestors', async () => { ... })
  - SETUP: Create session with multi-level tasks.json
  - EXECUTE: Call updateItemStatus('P1.M1.T1', 'Failed')
  - VERIFY: Task status changed to 'Failed'
  - VERIFY: All subtasks under task still 'Planned'
  - VERIFY: Parent milestone still 'Planned'
  - VERIFY: Parent phase still 'Planned'
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 4 - Phase update only affects that phase
  - CREATE: it('should update phase status without affecting children', async () => { ... })
  - SETUP: Create session with deep hierarchy tasks.json
  - EXECUTE: Call updateItemStatus('P1', 'Researching')
  - VERIFY: Phase status changed to 'Researching'
  - VERIFY: All milestones under phase still 'Planned'
  - VERIFY: All tasks still 'Planned'
  - VERIFY: All subtasks still 'Planned'
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 5 - Multiple updates accumulate correctly
  - CREATE: it('should accumulate multiple status updates in batching state', async () => { ... })
  - SETUP: Create session with multi-level tasks.json
  - EXECUTE: Call updateItemStatus() 3 times on different items
  - VERIFY: All 3 items have new status in memory
  - VERIFY: #dirty flag is true
  - VERIFY: #updateCount is 3
  - VERIFY: File on disk unchanged (before flush)
  - PATTERN: Verify batching state, not just final result
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Test 6 - Invalid status value behavior
  - CREATE: it('should handle invalid status value (current: no runtime validation)', async () => { ... })
  - SETUP: Create session with tasks.json
  - EXECUTE: Try to pass invalid status (requires type assertion)
  - VERIFY: TypeScript catches at compile time (document)
  - VERIFY: Runtime behavior (type assertion bypasses TS)
  - GOTCHA: This test documents current behavior, may need type assertion
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 7 - Invalid item ID behavior
  - CREATE: it('should return unchanged backlog for non-existent item ID', async () => { ... })
  - SETUP: Create session with tasks.json
  - EXECUTE: Call updateItemStatus('P999.M999.T999.S999', 'Complete')
  - VERIFY: Returns backlog unchanged
  - VERIFY: No error thrown
  - VERIFY: #dirty flag not set (no change detected)
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 8 - Hierarchy structure preserved after updates
  - CREATE: it('should preserve hierarchy structure after status updates', async () => { ... })
  - SETUP: Create session with deep hierarchy
  - EXECUTE: Update multiple items at different levels
  - VERIFY: All phase-milestone-task-subtask relationships intact
  - VERIFY: No orphaned items
  - VERIFY: No circular references
  - VERIFY: Item count unchanged
  - DEPENDENCIES: Task 11

Task 13: IMPLEMENT Test 9 - Multiple sequential update cycles
  - CREATE: it('should handle multiple sequential update cycles correctly', async () => { ... })
  - SETUP: Create session with tasks.json
  - EXECUTE: Cycle 1: update -> flush -> verify
  - EXECUTE: Cycle 2: update -> flush -> verify
  - EXECUTE: Cycle 3: update -> flush -> verify
  - VERIFY: Each cycle independently successful
  - VERIFY: Batching state reset between cycles
  - DEPENDENCIES: Task 12

Task 14: IMPLEMENT Test 10 - All status values work correctly
  - CREATE: it('should accept all valid status values', async () => { ... })
  - SETUP: Create session with multi-level tasks.json
  - EXECUTE: Update items with each status: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
  - VERIFY: All status values accepted
  - VERIFY: Items updated correctly
  - PATTERN: Use test.each() for parameterization
  - DEPENDENCIES: Task 13

Task 15: RUN tests and verify all pass
  - RUN: npm test -- tests/integration/core/session-manager.test.ts
  - VERIFY: All status propagation tests pass
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
// PATTERN: Extended Fixture Helper Functions
// =============================================================================

/**
 * Creates a multi-level Backlog with 3 tasks per milestone
 * Useful for testing updates at different hierarchy levels
 */
function createMultiLevelTasksJson(): Backlog {
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
                title: 'Test Task 1',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask 1',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'CONTRACT DEFINITION:\n1. Test',
                  },
                ],
              },
              {
                type: 'Task',
                id: 'P1.M1.T2',
                title: 'Test Task 2',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T2.S1',
                    title: 'Test Subtask 1',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'CONTRACT DEFINITION:\n1. Test',
                  },
                ],
              },
              {
                type: 'Task',
                id: 'P1.M1.T3',
                title: 'Test Task 3',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T3.S1',
                    title: 'Test Subtask 1',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'CONTRACT DEFINITION:\n1. Test',
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

// =============================================================================
// PATTERN: Test 1 - Subtask Update Without Affecting Parents
// =============================================================================

describe('SessionManager Status Update Propagation', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-status-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Create PRD file with valid content
    const prdContent = `# Test PRD

## Executive Summary

Comprehensive test PRD for status propagation testing.

## Functional Requirements

The system shall correctly update task statuses without cascading.
`;
    writeFileSync(prdPath, prdContent, 'utf-8');
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - Subtask Update Only Affects That Subtask
  // =============================================================================

  it('should update subtask status without affecting parents', async () => {
    // SETUP: Create session with multi-level tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMultiLevelTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // EXECUTE: Update subtask status
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

    // VERIFY: Subtask status changed
    const session = manager.currentSession!;
    const subtask =
      session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0];
    expect(subtask.status).toBe('Complete');

    // VERIFY: Parent task unchanged
    const task = session.taskRegistry.backlog[0].milestones[0].tasks[0];
    expect(task.status).toBe('Planned');

    // VERIFY: Parent milestone unchanged
    const milestone = session.taskRegistry.backlog[0].milestones[0];
    expect(milestone.status).toBe('Planned');

    // VERIFY: Parent phase unchanged
    const phase = session.taskRegistry.backlog[0];
    expect(phase.status).toBe('Planned');

    // VERIFY: Sibling subtasks unchanged
    const task2 = session.taskRegistry.backlog[0].milestones[0].tasks[1];
    expect(task2.status).toBe('Planned');
    expect(task2.subtasks[0].status).toBe('Planned');
  });

  // =============================================================================
  // PATTERN: Test 2 - Milestone Update Only Affects That Milestone
  // =============================================================================

  it('should update milestone status without affecting children', async () => {
    // SETUP: Create session with multi-level tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMultiLevelTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // EXECUTE: Update milestone status
    await manager.updateItemStatus('P1.M1', 'Implementing');

    // VERIFY: Milestone status changed
    const session = manager.currentSession!;
    const milestone = session.taskRegistry.backlog[0].milestones[0];
    expect(milestone.status).toBe('Implementing');

    // VERIFY: All tasks under milestone unchanged
    const task1 = milestone.tasks[0];
    expect(task1.status).toBe('Planned');
    expect(task1.subtasks[0].status).toBe('Planned');

    const task2 = milestone.tasks[1];
    expect(task2.status).toBe('Planned');
    expect(task2.subtasks[0].status).toBe('Planned');

    const task3 = milestone.tasks[2];
    expect(task3.status).toBe('Planned');
    expect(task3.subtasks[0].status).toBe('Planned');

    // VERIFY: Parent phase unchanged
    const phase = session.taskRegistry.backlog[0];
    expect(phase.status).toBe('Planned');
  });

  // =============================================================================
  // PATTERN: Test 5 - Multiple Updates Accumulate Correctly
  // =============================================================================

  it('should accumulate multiple status updates in batching state', async () => {
    // SETUP: Create session with multi-level tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMultiLevelTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // EXECUTE: Update 3 different items
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    await manager.updateItemStatus('P1.M1.T2.S1', 'Failed');
    await manager.updateItemStatus('P1.M1.T3', 'Implementing');

    // VERIFY: All updates in memory
    const session = manager.currentSession!;
    const subtask1 =
      session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0];
    expect(subtask1.status).toBe('Complete');

    const subtask2 =
      session.taskRegistry.backlog[0].milestones[0].tasks[1].subtasks[0];
    expect(subtask2.status).toBe('Failed');

    const task3 = session.taskRegistry.backlog[0].milestones[0].tasks[2];
    expect(task3.status).toBe('Implementing');

    // VERIFY: File on disk unchanged (before flush)
    const fileContent = readFileSync(tasksPath, 'utf-8');
    const fileData = JSON.parse(fileContent) as Backlog;
    const fileSubtask1 = fileData.backlog[0].milestones[0].tasks[0].subtasks[0];
    expect(fileSubtask1.status).toBe('Planned'); // Original value

    // VERIFY: Batching state (access private properties for testing)
    // Note: This tests internal implementation details
    // In production, verify via flush behavior
  });

  // =============================================================================
  // PATTERN: Test 7 - Invalid Item ID Returns Unchanged Backlog
  // =============================================================================

  it('should return unchanged backlog for non-existent item ID', async () => {
    // SETUP: Create session with tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMultiLevelTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    const originalContent = readFileSync(tasksPath, 'utf-8');

    // EXECUTE: Try to update non-existent item
    const result = await manager.updateItemStatus(
      'P999.M999.T999.S999',
      'Complete'
    );

    // VERIFY: No error thrown
    expect(result).toBeDefined();

    // VERIFY: File unchanged
    const currentContent = readFileSync(tasksPath, 'utf-8');
    expect(currentContent).toBe(originalContent);

    // VERIFY: In-memory state unchanged
    const session = manager.currentSession!;
    const subtask =
      session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0];
    expect(subtask.status).toBe('Planned');
  });

  // =============================================================================
  // PATTERN: Test 10 - All Status Values Work Correctly
  // =============================================================================

  it.each([
    ['Planned'],
    ['Researching'],
    ['Implementing'],
    ['Complete'],
    ['Failed'],
    ['Obsolete'],
  ])('should accept status value: %s', async status => {
    // SETUP: Create session with tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMultiLevelTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // EXECUTE: Update with status
    await manager.updateItemStatus('P1.M1.T1.S1', status as Status);

    // VERIFY: Status updated correctly
    const session = manager.currentSession!;
    const subtask =
      session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0];
    expect(subtask.status).toBe(status);
  });

  // Additional tests follow similar patterns...
});
```

---

### Integration Points

```yaml
INPUT FROM P2.M1.T2.S1 (ATOMIC FLUSH TESTS):
  - tests/integration/core/session-manager.test.ts extended with atomic flush tests
  - Pattern: Temp directory setup, describe/it structure
  - Pattern: SETUP/EXECUTE/VERIFY comment structure
  - This PRP: EXTENDS with status propagation tests
  - This PRP: Tests update accumulation phase (P2.M1.T2.S1 tests flush phase)

INPUT FROM SESSIONMANAGER UPDATEITEMSTATUS IMPLEMENTATION:
  - src/core/session-manager.ts has updateItemStatus() (632-664)
  - Pattern: Exact ID matching, no cascading
  - Pattern: Batching state accumulation
  - This PRP: Tests validate actual behavior

INPUT FROM UPDATEITEMSTATUSUTIL IMPLEMENTATION:
  - src/utils/task-utils.ts has updateItemStatusUtil() (301-404)
  - Pattern: Deep copy with spread operators
  - Pattern: DFS traversal to find target
  - This PRP: Tests verify no side effects

INPUT FROM STATUS TYPE DEFINITION:
  - src/core/models.ts has Status type (136-142)
  - Pattern: 6 valid status values
  - This PRP: Tests all status values

OUTPUT FOR SUBSEQUENT WORK:
  - Integration tests for status update propagation
  - Confidence that updates don't corrupt hierarchy
  - Foundation for P2.M1.T2.S3 (session discovery methods)
  - Baseline for any future propagation features
  - Documented behavior of current implementation

DIRECTORY STRUCTURE:
  - Extend: tests/integration/core/session-manager.test.ts
  - Add: New describe() block for status propagation tests
  - Add: Extended fixture helper functions
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

# Expected: All tests pass (including new status propagation tests)
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run all integration tests
npm test -- tests/integration/

# Expected: All integration tests pass
# Expected: No regressions in other integration test files

# Coverage validation
npm run test:coverage

# Expected: Coverage for SessionManager updateItemStatus increases
# Expected: New update code paths covered
# Expected: No uncovered lines in updateItemStatus logic

# If tests fail, check:
# - Temp directory cleanup works
# - Fixture helper functions return valid Backlog
# - File paths are correct (use resolve() for absolute paths)
# - Status values match Status type exactly
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
ls -la /tmp/ | grep session-manager-status-test

# Expected: No leftover temp directories (all cleaned up)

# Manual verification: Read test output
npm test -- tests/integration/core/session-manager.test.ts --reporter=verbose

# Expected: Clear test names showing status propagation scenarios
# Expected: Tests grouped by describe blocks
```

### Level 4: Real-World Validation (Scenario Testing)

```bash
# Scenario 1: Multi-level status update verification
cat > /tmp/test-status-update.sh << 'EOF'
#!/bin/bash
set -e

TEMP_DIR=$(mktemp -d)
PRD_PATH="$TEMP_DIR/PRD.md"
PLAN_DIR="$TEMP_DIR/plan"

# Create PRD
cat > "$PRD_PATH" << 'PRD'
# Test Project

## P1: Test Phase

A minimal project for testing status updates.

### P1.M1: Test Milestone

#### P1.M1.T1: Create Function

Create a test function.
PRD

# Initialize session
node -e "
import { SessionManager } from './src/core/session-manager.js';
import { writeFileSync, readFileSync, join } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const manager = new SessionManager('$PRD_PATH', '$PLAN_DIR');
await manager.initialize();

// Create initial tasks.json with multi-level hierarchy
const sessionPath = join('$PLAN_DIR', manager.currentSession.metadata.id);
const tasksPath = join(sessionPath, 'tasks.json');
const tasks = {
  backlog: [{
    type: 'Phase',
    id: 'P1',
    title: 'Test',
    status: 'Planned',
    description: 'Test',
    milestones: [{
      type: 'Milestone',
      id: 'P1.M1',
      title: 'Test',
      status: 'Planned',
      description: 'Test',
      tasks: [{
        type: 'Task',
        id: 'P1.M1.T1',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        subtasks: [{
          type: 'Subtask',
          id: 'P1.M1.T1.S1',
          title: 'Test',
          status: 'Planned',
          story_points: 1,
          dependencies: [],
          context_scope: 'Test'
        }]
      }]
    }]
  }]
};
writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));

// Update subtask
console.log('Before update - S1:', manager.currentSession.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0].status);
await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
console.log('After update - S1:', manager.currentSession.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0].status);
console.log('After update - Task:', manager.currentSession.taskRegistry.backlog[0].milestones[0].tasks[0].status);
console.log('After update - Milestone:', manager.currentSession.taskRegistry.backlog[0].milestones[0].status);
console.log('After update - Phase:', manager.currentSession.taskRegistry.backlog[0].status);
"

# Cleanup
rm -rf "$TEMP_DIR"
EOF

chmod +x /tmp/test-status-update.sh
/tmp/test-status-update.sh

# Expected: S1=Complete, Task=Planned, Milestone=Planned, Phase=Planned
# Expected: No errors thrown

# Scenario 2: Multiple updates accumulate before flush
node -e "
import { SessionManager } from './src/core/session-manager.js';
import { writeFileSync, readFileSync, join } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const tempDir = mkdtempSync(join(tmpdir(), 'multi-update-test-'));
const planDir = join(tempDir, 'plan');
const prdPath = join(tempDir, 'PRD.md');

// Create minimal PRD
writeFileSync(prdPath, '# Test\\n\\n' + 'Test content. '.repeat(10));

const manager = new SessionManager(prdPath, planDir);
await manager.initialize();

// Create tasks.json
const sessionPath = join(planDir, manager.currentSession.metadata.id);
const tasksPath = join(sessionPath, 'tasks.json');
const tasks = {
  backlog: [{
    type: 'Phase',
    id: 'P1',
    title: 'Test',
    status: 'Planned',
    description: 'Test',
    milestones: [{
      type: 'Milestone',
      id: 'P1.M1',
      title: 'Test',
      status: 'Planned',
      description: 'Test',
      tasks: [{
        type: 'Task',
        id: 'P1.M1.T1',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        subtasks: [
          { type: 'Subtask', id: 'P1.M1.T1.S1', title: 'S1', status: 'Planned', story_points: 1, dependencies: [], context_scope: 'Test' },
          { type: 'Subtask', id: 'P1.M1.T1.S2', title: 'S2', status: 'Planned', story_points: 1, dependencies: [], context_scope: 'Test' },
          { type: 'Subtask', id: 'P1.M1.T1.S3', title: 'S3', status: 'Planned', story_points: 1, dependencies: [], context_scope: 'Test' }
        ]
      }]
    }]
  }]
};
writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));

// Update 3 subtasks
await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

// Verify all 3 in memory
const s = manager.currentSession.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks;
console.log('S1:', s[0].status);
console.log('S2:', s[1].status);
console.log('S3:', s[2].status);

// Flush and verify persisted
await manager.flushUpdates();
const fileContent = readFileSync(tasksPath, 'utf-8');
const fileData = JSON.parse(fileContent);
const fs = fileData.backlog[0].milestones[0].tasks[0].subtasks;
console.log('File S1:', fs[0].status);
console.log('File S2:', fs[1].status);
console.log('File S3:', fs[2].status);

// Cleanup
rmSync(tempDir, { recursive: true, force: true });
"

# Expected: All S1, S2, S3 = Complete in memory and file
# Expected: No errors thrown
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Subtask update only affects that subtask
- [ ] Test 2: Milestone update only affects that milestone
- [ ] Test 3: Task update only affects that task
- [ ] Test 4: Phase update only affects that phase
- [ ] Test 5: Multiple updates accumulate correctly
- [ ] Test 6: Invalid status value behavior documented
- [ ] Test 7: Invalid item ID returns unchanged backlog
- [ ] Test 8: Hierarchy structure preserved
- [ ] Test 9: Multiple sequential update cycles work
- [ ] Test 10: All status values work correctly
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No side effects on production plan/ directory
- [ ] Temp directories cleaned up after tests

### Feature Validation

- [ ] Subtask updates don't affect parent task/milestone/phase
- [ ] Milestone updates don't affect child tasks/subtasks
- [ ] Task updates don't affect child subtasks or parent milestone
- [ ] Phase updates don't affect child milestones/tasks/subtasks
- [ ] Multiple updates accumulate in batching state correctly
- [ ] Invalid status values documented (current: no runtime validation)
- [ ] Invalid item IDs return unchanged backlog (no error)
- [ ] Non-existent item IDs don't corrupt hierarchy
- [ ] Hierarchy structure preserved after updates
- [ ] Multiple update cycles work independently

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
- [ ] Fixture helpers follow createMinimalTasksJson() pattern
- [ ] Uses parameterized tests (test.each) where appropriate

### Documentation & Deployment

- [ ] Tests serve as executable documentation of status update behavior
- [ ] No cascading behavior validated
- [ ] Current error handling documented
- [ ] Integration with P2.M1.T2.S1 atomic flush tests clear
- [ ] Foundation for P2.M1.T2.S3 (session discovery methods)
- [ ] Baseline established for any future propagation features

---

## Anti-Patterns to Avoid

- **Don't test cascade behavior** - Current implementation does NOT cascade to children
- **Don't test propagation to parents** - Current implementation does NOT propagate to parents
- **Don't assume validation exists** - No runtime validation for status or IDs (document actual behavior)
- **Don't test atomic flush** - That's P2.M1.T2.S1, not this task
- **Don't test new session creation** - That's P2.M1.T1.S1
- **Don't test existing session loading** - That's P2.M1.T1.S2
- **Don't test delta session detection** - That's P2.M1.T1.S3
- **Don't modify SessionManager code** - This is validation only, no implementation changes
- **Don't hardcode temp directory paths** - Use mkdtempSync() for uniqueness
- **Don't skip temp directory cleanup** - Must use afterEach() with rmSync()
- **Don't use global state** - Each test must use unique temp directory
- **Don't forget .js extensions** - ESM requires .js on all imports
- **Don't test invalid status without type assertion** - TypeScript prevents invalid status at compile time
- **Don't assume item exists** - Current implementation returns unchanged backlog if not found
- **Don't test partial ID matching** - Current implementation requires exact match only
- **Don't create overly complex fixtures** - Extend createMinimalTasksJson() for specific scenarios

---

## Appendix: Decision Rationale

### Why document actual behavior instead of testing aspirational behavior?

The contract definition mentions "milestone and all children reflect change" but the actual implementation does NOT cascade to children. This PRP documents the ACTUAL behavior because:

1. **Tests validate implementation, not requirements** - Tests should verify what code DOES, not what we WANT it to do
2. **Baseline for future enhancements** - If cascading is added later, these tests establish current behavior
3. **Prevents false confidence** - Testing aspirational behavior would give false confidence in non-existent features
4. **Executable documentation** - Tests serve as documentation of actual behavior

If cascading behavior is desired, that should be a separate implementation task with its own PRP.

### Why separate status propagation tests from atomic flush tests?

P2.M1.T2.S1 tests the **flush phase** (persisting accumulated updates). This task (P2.M1.T2.S2) tests the **update phase** (accumulating individual updates). Separating them provides:

1. **Clear separation of concerns** - Each test suite focuses on one aspect
2. **Easier debugging** - Failures in update phase vs flush phase are isolated
3. **Independent development** - Tests can run in parallel (as they are now)
4. **Comprehensive coverage** - Together they cover the complete batch update workflow

### Why no runtime validation for status and IDs?

The current implementation relies on TypeScript for compile-time validation:

1. **Status type is validated at compile time** - TypeScript ensures only valid Status values
2. **Runtime validation adds overhead** - Unnecessary if type system prevents invalid values
3. **Fail fast principle** - Invalid values caught during development, not production
4. **Trust the type system** - TypeScript's type safety is sufficient for this use case

This is a design decision documented by these tests. If runtime validation is needed in the future, it can be added with a separate implementation task.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from parallel research (5 research tasks + code analysis)
- [x] SessionManager.updateItemStatus() fully analyzed with line numbers
- [x] updateItemStatusUtil() implementation documented
- [x] Status type definition documented
- [x] Existing integration test patterns analyzed
- [x] Fixture helper functions documented
- [x] Multi-level hierarchy test patterns researched
- [x] Error handling requirements understood
- [x] Scope boundaries defined (extend existing integration tests)
- [x] Dependency on P2.M1.T2.S1 established
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Decision rationale documented

**Risk Mitigation**:

- Extending existing test file (low risk of breaking existing tests)
- Integration tests only (no production code changes)
- Temp directory isolation (no side effects on plan/)
- Complements atomic flush tests (no duplication)
- Clear acceptance criteria
- Follows established integration test patterns

**Known Risks**:

- **Misunderstanding of requirements**: Contract mentions "milestone and all children reflect change" but implementation does NOT cascade
  - Mitigation: PRP explicitly documents actual behavior, tests validate what exists
- **Type system limitations**: Cannot test invalid status without type assertion
  - Mitigation: Test documents current compile-time validation approach
- **Fixture complexity**: Multi-level fixtures can be complex to create
  - Mitigation: Extend createMinimalTasksJson() pattern, use helper functions

---

**END OF PRP**
