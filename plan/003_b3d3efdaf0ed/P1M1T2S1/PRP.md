# PRP: P1.M1.T2.S1 - Verify depth-first hierarchical traversal

## Goal

**Feature Goal**: Create comprehensive unit tests that validate the depth-first search (DFS) pre-order traversal behavior of TaskOrchestrator, ensuring that parent items are processed before children, status changes follow the correct hierarchy, traversal stops at the Subtask level, and scope filtering properly limits execution.

**Deliverable**: Unit test file `tests/unit/core/task-traversal.test.ts` with complete test coverage for DFS traversal order, parent status transitions, hierarchy level limits, and scope filtering.

**Success Definition**:
- All 4 CONTRACT requirements from work item description are tested and passing
- Test file runs successfully with `npx vitest run tests/unit/core/task-traversal.test.ts`
- Tests validate: (a) traversal order follows depth-first pre-order (parent before children), (b) parent status changes to 'Implementing' when child starts, (c) traversal stops at Subtask level (subtasks are execution units), (d) traversal respects scope limits (phase/milestone/task filters)
- Tests use mock backlog with known task hierarchy to verify traversal semantics
- Tests follow existing patterns from task-orchestrator.test.ts for consistency

## Why

**Business Value**: The DFS traversal is the core algorithm that determines task execution order in the PRP Pipeline. Without proper DFS traversal verification, we cannot guarantee that tasks execute in the correct order, that parent status transitions happen appropriately, or that scope filtering works correctly. This could lead to tasks executing out of order, incomplete status tracking, or incorrect scope application.

**Integration Points**:
- Validates `processNextItem()` from `src/core/task-orchestrator.ts` (lines 805-834) for DFS traversal
- Validates `executePhase()`, `executeMilestone()`, `executeTask()`, `executeSubtask()` methods for status changes (lines 483-750)
- Validates `#buildQueue()` from `src/core/task-orchestrator.ts` (lines 152-165) for scope filtering
- Validates `resolveScope()` from `src/core/scope-resolver.ts` (lines 283-310) for scope-to-items mapping
- Uses existing test patterns from `tests/unit/core/task-orchestrator.test.ts` for mock setup
- Uses factory functions from `tests/unit/core/task-utils.test.ts` for test data creation

**Problems Solved**:
- Ensures DFS traversal follows parent-before-children semantics (critical for correct execution order)
- Confirms parent items transition to 'Implementing' status when children start processing
- Verifies traversal stops at Subtask level (subtasks are the actual execution units)
- Validates scope filtering properly limits which items are included in execution queue
- Prevents regression bugs in the core traversal algorithm
- Provides test documentation of expected traversal behavior

## What

**User-Visible Behavior**: No direct user-visible behavior - this is infrastructure validation for the TaskOrchestrator's DFS traversal that ensures correct task execution order and status management.

**Success Criteria**:
- [ ] Test verifies traversal order follows DFS pre-order (parent before children) (CONTRACT a)
- [ ] Test verifies parent status changes to 'Implementing' when child processing starts (CONTRACT b)
- [ ] Test verifies traversal stops at Subtask level (subtasks are execution units) (CONTRACT c)
- [ ] Test verifies scope filtering respects phase/milestone/task limits (CONTRACT d)
- [ ] Test verifies processNextItem() returns items in correct order
- [ ] Test verifies execution queue is built correctly from scope
- [ ] Test verifies currentItemId is updated during traversal
- [ ] Test verifies all hierarchy types are processed correctly
- [ ] All tests pass with `npx vitest run tests/unit/core/task-traversal.test.ts`
- [ ] Tests follow existing patterns from task-orchestrator.test.ts

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: YES. This PRP provides:
- Complete DFS traversal algorithm specification with verification patterns
- Exact mock setup patterns from existing test files
- All factory functions needed for test data creation
- Existing test file references for pattern following
- Complete code snippets showing implementation patterns
- All CONTRACT requirements mapped to test cases
- Research findings on DFS traversal testing best practices

### Documentation & References

```yaml
# MUST READ - Core implementation files

- file: src/core/task-orchestrator.ts
  why: Contains DFS traversal via processNextItem() (lines 805-834), execute* methods (lines 483-750)
  pattern: Look for processNextItem(), #delegateByType(), executePhase, executeMilestone, executeTask, executeSubtask
  gotcha: processNextItem() shifts from executionQueue, returns false when empty
  lines: 805-834 (processNextItem), 483-750 (execute methods), 152-165 (#buildQueue)

- file: src/core/scope-resolver.ts
  why: Contains resolveScope() function for filtering backlog by scope
  pattern: Look for resolveScope() function which maps Scope to HierarchyItem[]
  gotcha: Returns empty array for non-existent IDs, includes item + descendants for scoped types
  lines: 283-310 (resolveScope), 215-238 (getAllDescendants)

- file: src/utils/task-utils.ts
  why: Contains findItem() for DFS lookup and filterByStatus() for traversal collection
  pattern: Look for early exit DFS pattern in findItem(), collection DFS in filterByStatus()
  gotcha: findItem() uses early return, filterByStatus() collects all matches
  lines: 90-108 (findItem), 205-228 (filterByStatus)

- file: tests/unit/core/task-orchestrator.test.ts
  why: Reference for TaskOrchestrator mock setup and test patterns
  pattern: Look for vi.mock() setup, createMockSessionManager(), factory functions
  gotcha: Must use vi.hoisted() for logger mocks, cast mocks as `any` for control
  lines: 21-94 (mock setup), 96-167 (factory functions), 170-172 (beforeEach)

- file: tests/unit/core/task-utils.test.ts
  why: Reference for factory functions and DFS traversal testing patterns
  pattern: Look for createTest* functions, DFS pre-order verification
  gotcha: Uses Setup/Execute/Verify pattern with clear comments
  lines: 31-90 (factory functions), 570-684 (getNextPendingItem DFS tests)

- file: tests/unit/core/scope-resolver.test.ts
  why: Reference for scope filtering test patterns
  pattern: Look for resolveScope() tests with different scope types
  gotcha: Tests verify DFS pre-order within scope results
  lines: 374-639 (resolveScope tests)

- docfile: plan/003_b3d3efdaf0ed/P1M1T2S1/research/dfs-traversal-testing.md
  section: Complete DFS testing best practices
  why: Shows all verification patterns for DFS traversal: array index comparison, parent-before-child, depth limits
  pattern: Test DFS pre-order, verify early exit, test depth limits

- docfile: plan/003_b3d3efdaf0ed/P1M1T1S4/PRP.md
  section: Previous PRP for batching tests
  why: Shows mock setup patterns, SessionManager mocking, test file structure
  pattern: Mock configuration, factory functions, test organization
```

### Current Codebase Tree

```bash
tests/
├── unit/
│   └── core/
│       ├── task-orchestrator.test.ts      # Reference for mock patterns and test structure
│       ├── task-utils.test.ts              # Reference for factory functions and DFS tests
│       └── scope-resolver.test.ts         # Reference for scope filtering tests
├── fixtures/
│   └── ...existing fixtures...
└── setup.ts                                # Global test setup

src/
└── core/
    ├── task-orchestrator.ts               # DFS traversal implementation (processNextItem: 805-834)
    ├── scope-resolver.ts                  # Scope filtering (resolveScope: 283-310)
    ├── models.ts                          # Type definitions (Phase, Milestone, Task, Subtask, Backlog)
    └── session-manager.ts                 # Session state management (for mocking)
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
├── unit/
│   └── core/
│       ├── task-orchestrator.test.ts      # (existing - reference)
│       ├── task-utils.test.ts              # (existing - reference)
│       ├── scope-resolver.test.ts         # (existing - reference)
│       └── task-traversal.test.ts         # NEW - DFS traversal unit tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Vitest vi.mock() must be at TOP LEVEL before imports
// Mock declarations must be before any import statements
vi.hoisted(() => {
  vi.mock('node:util', () => ({
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
  }));
});

// CRITICAL: Use vi.mocked() or cast as `any` for mock control
const mockResolveScope = resolveScope as any;
mockResolveScope.mockReturnValue([phase, milestone, task, subtask]);

// CRITICAL: TaskOrchestrator requires active session in constructor
// Must mock currentSession or constructor throws error
const mockSessionManager = {
  currentSession: {
    metadata: { id: '001_14b9dc2a33c7', hash: '14b9dc2a33c7', path: '/plan/001_14b9dc2a33c7', createdAt: new Date(), parentSession: null },
    prdSnapshot: '# Test PRD',
    taskRegistry: testBacklog,
    currentItemId: null,
  },
  updateItemStatus: vi.fn().mockResolvedValue(testBacklog),
};

// CRITICAL: processNextItem() shifts from executionQueue
// First call returns first item, second call returns second item, etc.
// Returns false when queue is empty

// CRITICAL: processNextItem() sets currentItemId before delegation
// Can verify currentItemId to track what's being processed

// CRITICAL: Execution queue is built from scope in constructor
// Pass scope to TaskOrchestrator constructor to limit execution
// Undefined scope = all items (all leaf subtasks)

// CRITICAL: Parent items (Phase, Milestone, Task) set status to 'Implementing'
// They delegate child processing to processNextItem() loop
// Subtasks are the actual execution units

// CRITICAL: DFS pre-order means: Phase → Milestone → Task → Subtask
// Parent is visited/returned before children
// Siblings maintain left-to-right order

// CRITICAL: Scope filtering uses resolveScope() from scope-resolver.ts
// 'all' scope returns all leaf subtasks
// Phase/Milestone/Task scope returns item + all descendants
// Subtask scope returns single subtask

// CRITICAL: resolveScope() returns empty array for non-existent IDs
// This is valid behavior - no items to execute

// CRITICAL: Mock ResearchQueue and PRPRuntime to avoid side effects
vi.mock('../../src/core/research-queue.js');
vi.mock('../../src/agents/prp-runtime.js');

// GOTCHA: Use beforeEach to clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// GOTCHA: Create factory functions for consistent test data
// Follow pattern from task-utils.test.ts
const createTestSubtask = (id, title, status, dependencies = []) => ({...});

// GOTCHA: Test both success and error paths
// Verify status changes with mock calls
// Use toHaveBeenNthCalledWith() for order-sensitive assertions

// GOTCHA: Verify DFS pre-order with array index comparison
const parentIndex = processedIds.indexOf('P1');
const childIndex = processedIds.indexOf('P1.M1');
expect(parentIndex).toBeLessThan(childIndex);

// GOTCHA: For scope testing, verify executionQueue contents
const queue = orchestrator.executionQueue;
expect(queue.map(item => item.id)).toEqual(expectedIds);
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Import core dependencies
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Backlog, Phase, Milestone, Task, Subtask, Status, HierarchyItem } from '../../../src/core/models.js';
import { TaskOrchestrator } from '../../../src/core/task-orchestrator.js';
import type { Scope } from '../../../src/core/scope-resolver.js';
import { resolveScope } from '../../../src/core/scope-resolver.js';

// Mock all external dependencies
vi.hoisted(() => {
  vi.mock('../../src/utils/logger.js', () => ({
    getLogger: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
  }));
});

vi.mock('../../src/utils/task-utils.js', () => ({
  findItem: vi.fn(),
  getDependencies: vi.fn(),
}));

vi.mock('../../src/core/scope-resolver.js', () => ({
  resolveScope: vi.fn(),
}));

vi.mock('../../src/utils/git-commit.js', () => ({
  smartCommit: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../src/core/research-queue.js', () => ({
  ResearchQueue: vi.fn().mockImplementation(() => ({
    enqueue: vi.fn(),
    getPRP: vi.fn().mockReturnValue(null),
    processNext: vi.fn(),
    getStats: vi.fn().mockReturnValue({ queued: 0, researching: 0, cached: 0 }),
  })),
}));

vi.mock('../../src/agents/prp-runtime.js', () => ({
  PRPRuntime: vi.fn().mockImplementation(() => ({
    executeSubtask: vi.fn().mockResolvedValue({ success: true }),
  })),
}));
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/core/task-traversal.test.ts
  - IMPLEMENT: Test file with describe block for DFS traversal tests
  - FOLLOW pattern: tests/unit/core/task-orchestrator.test.ts (file structure)
  - NAMING: task-traversal.test.ts
  - PLACEMENT: tests/unit/core/ directory (alongside other core unit tests)

Task 2: IMPLEMENT test file setup and mock configuration
  - IMPLEMENT: vi.hoisted() for logger mocks at top level
  - IMPLEMENT: Mock declarations for task-utils, scope-resolver, git-commit, research-queue, prp-runtime
  - IMPLEMENT: beforeEach() clearing all mocks with vi.clearAllMocks()
  - IMPLEMENT: Helper functions (createTestSubtask, createTestTask, createTestMilestone, createTestPhase, createTestBacklog, createMockSessionManager)
  - FOLLOW pattern: tests/unit/core/task-orchestrator.test.ts (lines 21-94, 96-167)
  - REFERENCE: tests/unit/core/task-utils.test.ts (lines 31-90) for factory functions

Task 3: IMPLEMENT test for DFS pre-order traversal (CONTRACT a)
  - IMPLEMENT: it('should traverse items in DFS pre-order: parent before children')
  - SETUP: Create backlog with full hierarchy (Phase → Milestone → Task → Subtask)
  - SETUP: Mock resolveScope to return all items in DFS order
  - EXECUTE: Call processNextItem() repeatedly until returns false
  - VERIFY: Collect processed IDs in order
  - VERIFY: Parent index < child index (P1 before P1.M1 before P1.M1.T1 before P1.M1.T1.S1)
  - VERIFY: Siblings maintain left-to-right order (P1.M1 before P1.M2)

Task 4: IMPLEMENT test for parent status transitions to 'Implementing' (CONTRACT b)
  - IMPLEMENT: it('should set parent status to Implementing when processing children')
  - SETUP: Create backlog with parent and child items
  - SETUP: Mock SessionManager.updateItemStatus to track calls
  - EXECUTE: Call processNextItem() to process parent (Phase)
  - VERIFY: updateItemStatus called with parent ID and 'Implementing' status
  - EXECUTE: Call processNextItem() to process child (Milestone)
  - VERIFY: Parent already set to Implementing, child now set to Implementing
  - VERIFY: Use toHaveBeenNthCalledWith() for order verification

Task 5: IMPLEMENT test for traversal stopping at Subtask level (CONTRACT c)
  - IMPLEMENT: it('should stop traversal at Subtask level (subtasks are execution units)')
  - SETUP: Create backlog with hierarchy
  - SETUP: Mock resolveScope to return items including Subtasks
  - EXECUTE: Process all items via processNextItem()
  - VERIFY: Subtasks are processed (executeSubtask called)
  - VERIFY: No items below Subtask level exist (Subtask is leaf node)
  - VERIFY: executionQueue contains only Subtasks when using 'all' scope

Task 6: IMPLEMENT test for scope filtering (CONTRACT d)
  - IMPLEMENT: it('should filter execution queue by phase scope')
  - SETUP: Create backlog with multiple phases (P1, P2)
  - EXECUTE: Create TaskOrchestrator with { type: 'phase', id: 'P1' } scope
  - VERIFY: executionQueue contains only P1 and its descendants
  - VERIFY: P2 items not in queue
  - IMPLEMENT: it('should filter execution queue by milestone scope')
  - IMPLEMENT: it('should filter execution queue by task scope')
  - IMPLEMENT: it('should filter execution queue by subtask scope')

Task 7: IMPLEMENT test for processNextItem() return values
  - IMPLEMENT: it('should return true when items remain in queue')
  - SETUP: Create orchestrator with items in queue
  - EXECUTE: Call processNextItem()
  - VERIFY: Returns true
  - IMPLEMENT: it('should return false when queue is empty')
  - SETUP: Create orchestrator with empty queue
  - EXECUTE: Call processNextItem()
  - VERIFY: Returns false
  - IMPLEMENT: it('should update currentItemId during processing')
  - SETUP: Create orchestrator with known items
  - EXECUTE: Call processNextItem()
  - VERIFY: currentItemId matches processed item ID

Task 8: IMPLEMENT test for execution queue building
  - IMPLEMENT: it('should build execution queue from scope in constructor')
  - SETUP: Create backlog with multiple items
  - EXECUTE: Create TaskOrchestrator with scope
  - VERIFY: executionQueue contains correct items from resolveScope()
  - IMPLEMENT: it('should use resolveScope to populate execution queue')
  - SETUP: Mock resolveScope to return specific items
  - EXECUTE: Create TaskOrchestrator
  - VERIFY: Mock resolveScope called with backlog and scope
  - VERIFY: executionQueue matches resolveScope return value

Task 9: IMPLEMENT test for complete processing cycle
  - IMPLEMENT: it('should process all items until queue is empty')
  - SETUP: Create backlog with full hierarchy
  - EXECUTE: While loop calling processNextItem() until returns false
  - VERIFY: All items processed exactly once
  - VERIFY: Final processNextItem() call returns false
  - IMPLEMENT: it('should handle empty queue gracefully')
  - SETUP: Create orchestrator with no items
  - EXECUTE: Call processNextItem()
  - VERIFY: Returns false without error

Task 10: IMPLEMENT test for DFS behavior vs BFS behavior
  - IMPLEMENT: it('should use depth-first not breadth-first traversal')
  - SETUP: Create wide hierarchy (Phase with 2 milestones, each with tasks)
  - EXECUTE: Process items and collect order
  - VERIFY: Grandchild from first milestone comes before second milestone (deep before wide)
  - VERIFY: P1.M1.T1 comes before P1.M2 (DFS property)

Task 11: IMPLEMENT edge case tests
  - IMPLEMENT: it('should handle backlog with single phase')
  - VERIFY: Processes correctly
  - IMPLEMENT: it('should handle backlog with single milestone')
  - VERIFY: Processes correctly
  - IMPLEMENT: it('should handle backlog with single task')
  - VERIFY: Processes correctly
  - IMPLEMENT: it('should handle backlog with single subtask')
  - VERIFY: Processes correctly
  - IMPLEMENT: it('should handle phase with no milestones')
  - VERIFY: Processes phase, returns true, then returns false
  - IMPLEMENT: it('should handle scope with non-existent ID')
  - VERIFY: executionQueue is empty, processNextItem() returns false
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Factory function for test data (from task-utils.test.ts)
function createTestSubtask(
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = []
): Subtask {
  return {
    id,
    type: 'Subtask',
    title,
    status,
    story_points: 1,
    dependencies,
    context_scope: 'Test scope',
  };
}

function createTestTask(
  id: string,
  title: string,
  status: Status = 'Planned',
  subtasks: Subtask[] = []
): Task {
  return {
    id,
    type: 'Task',
    title,
    status,
    description: 'Test task',
    subtasks,
  };
}

function createTestMilestone(
  id: string,
  title: string,
  status: Status = 'Planned',
  tasks: Task[] = []
): Milestone {
  return {
    id,
    type: 'Milestone',
    title,
    status,
    description: 'Test milestone',
    tasks,
  };
}

function createTestPhase(
  id: string,
  title: string,
  status: Status = 'Planned',
  milestones: Milestone[] = []
): Phase {
  return {
    id,
    type: 'Phase',
    title,
    status,
    description: 'Test phase',
    milestones,
  };
}

function createTestBacklog(phases: Phase[]): Backlog {
  return { backlog: phases };
}

// PATTERN: Mock SessionManager (from task-orchestrator.test.ts)
function createMockSessionManager(taskRegistry: Backlog) {
  const currentSession = {
    metadata: {
      id: '001_14b9dc2a33c7',
      hash: '14b9dc2a33c7',
      path: '/plan/001_14b9dc2a33c7',
      createdAt: new Date(),
      parentSession: null,
    },
    prdSnapshot: '# Test PRD',
    taskRegistry,
    currentItemId: null,
  };

  return {
    currentSession,
    updateItemStatus: vi.fn().mockResolvedValue(taskRegistry),
    flushUpdates: vi.fn().mockResolvedValue(undefined),
  };
}

// PATTERN: Test DFS pre-order traversal (CONTRACT a)
it('should traverse items in DFS pre-order: parent before children', async () => {
  // SETUP: Create full hierarchy
  const subtask1 = createTestSubtask('P1.M1.T1.S1', 'Subtask 1');
  const subtask2 = createTestSubtask('P1.M1.T1.S2', 'Subtask 2');
  const task1 = createTestTask('P1.M1.T1', 'Task 1', 'Planned', [subtask1, subtask2]);
  const task2 = createTestTask('P1.M1.T2', 'Task 2', 'Planned', []);
  const milestone1 = createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [task1, task2]);
  const phase1 = createTestPhase('P1', 'Phase 1', 'Planned', [milestone1]);
  const backlog = createTestBacklog([phase1]);

  const mockManager = createMockSessionManager(backlog);

  // Mock resolveScope to return items in DFS order
  (resolveScope as any).mockReturnValue([phase1, milestone1, task1, subtask1, subtask2]);

  // EXECUTE: Create orchestrator and process all items
  const orchestrator = new TaskOrchestrator(mockManager);
  const processedIds: string[] = [];

  let hasMore = true;
  while (hasMore) {
    hasMore = await orchestrator.processNextItem();
    if (orchestrator.currentItemId) {
      processedIds.push(orchestrator.currentItemId);
    }
  }

  // VERIFY: Parent indices are less than child indices
  const p1Index = processedIds.indexOf('P1');
  const m1Index = processedIds.indexOf('P1.M1');
  const t1Index = processedIds.indexOf('P1.M1.T1');
  const s1Index = processedIds.indexOf('P1.M1.T1.S1');

  expect(p1Index).toBeGreaterThanOrEqual(0);
  expect(p1Index).toBeLessThan(m1Index); // Parent before child
  expect(m1Index).toBeLessThan(t1Index); // Child before grandchild
  expect(t1Index).toBeLessThan(s1Index); // Grandchild before great-grandchild
});

// PATTERN: Test parent status transitions (CONTRACT b)
it('should set parent status to Implementing when processing children', async () => {
  // SETUP: Create hierarchy
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1');
  const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned', [subtask]);
  const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [task]);
  const phase = createTestPhase('P1', 'Phase 1', 'Planned', [milestone]);
  const backlog = createTestBacklog([phase]);

  const mockManager = createMockSessionManager(backlog);
  (resolveScope as any).mockReturnValue([phase, milestone, task, subtask]);

  // EXECUTE: Process Phase
  const orchestrator = new TaskOrchestrator(mockManager);
  await orchestrator.processNextItem();

  // VERIFY: Phase status set to Implementing
  expect(mockManager.updateItemStatus).toHaveBeenCalledWith('P1', 'Implementing');

  // EXECUTE: Process Milestone
  await orchestrator.processNextItem();

  // VERIFY: Milestone status set to Implementing
  expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(2, 'P1.M1', 'Implementing');

  // EXECUTE: Process Task
  await orchestrator.processNextItem();

  // VERIFY: Task status set to Implementing
  expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(3, 'P1.M1.T1', 'Implementing');
});

// PATTERN: Test traversal stops at Subtask level (CONTRACT c)
it('should stop traversal at Subtask level (subtasks are execution units)', async () => {
  // SETUP: Create hierarchy
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1');
  const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned', [subtask]);
  const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [task]);
  const phase = createTestPhase('P1', 'Phase 1', 'Planned', [milestone]);
  const backlog = createTestBacklog([phase]);

  const mockManager = createMockSessionManager(backlog);
  (resolveScope as any).mockReturnValue([phase, milestone, task, subtask]);

  // EXECUTE: Process all items
  const orchestrator = new TaskOrchestrator(mockManager);
  const processedIds: string[] = [];

  let hasMore = true;
  while (hasMore) {
    hasMore = await orchestrator.processNextItem();
    if (orchestrator.currentItemId) {
      processedIds.push(orchestrator.currentItemId);
    }
  }

  // VERIFY: All items processed, Subtask is last level
  expect(processedIds).toEqual(['P1', 'P1.M1', 'P1.M1.T1', 'P1.M1.T1.S1']);
  expect(processedIds[processedIds.length - 1]).toBe('P1.M1.T1.S1'); // Last item is Subtask
});

// PATTERN: Test scope filtering (CONTRACT d)
it('should filter execution queue by phase scope', async () => {
  // SETUP: Create backlog with multiple phases
  const phase1 = createTestPhase('P1', 'Phase 1');
  const phase2 = createTestPhase('P2', 'Phase 2');
  const backlog = createTestBacklog([phase1, phase2]);

  const mockManager = createMockSessionManager(backlog);

  // Mock resolveScope to return only P1 items
  (resolveScope as any).mockReturnValue([phase1]);

  // EXECUTE: Create orchestrator with P1 scope
  const scope: Scope = { type: 'phase', id: 'P1' };
  const orchestrator = new TaskOrchestrator(mockManager, scope);

  // VERIFY: Execution queue contains only P1
  const queue = orchestrator.executionQueue;
  expect(queue.map(item => item.id)).toContain('P1');
  expect(queue.some(item => item.id === 'P2')).toBe(false);
});

// PATTERN: Test processNextItem() return values
it('should return true when items remain in queue', async () => {
  // SETUP: Create orchestrator with items
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1');
  const backlog = createTestBacklog([createTestPhase('P1', 'P1', 'Planned', [createTestMilestone('P1.M1', 'M1', 'Planned', [createTestTask('P1.M1.T1', 'T1', 'Planned', [subtask])])]);
  const mockManager = createMockSessionManager(backlog);
  (resolveScope as any).mockReturnValue([subtask]);

  const orchestrator = new TaskOrchestrator(mockManager);

  // EXECUTE: Process item
  const result = await orchestrator.processNextItem();

  // VERIFY: Returns true
  expect(result).toBe(true);
});

it('should return false when queue is empty', async () => {
  // SETUP: Create orchestrator with empty queue
  const backlog = createTestBacklog([]);
  const mockManager = createMockSessionManager(backlog);
  (resolveScope as any).mockReturnValue([]);

  const orchestrator = new TaskOrchestrator(mockManager);

  // EXECUTE: Try to process
  const result = await orchestrator.processNextItem();

  // VERIFY: Returns false
  expect(result).toBe(false);
});

it('should update currentItemId during processing', async () => {
  // SETUP: Create orchestrator with known item
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1');
  const backlog = createTestBacklog([createTestPhase('P1', 'P1', 'Planned', [createTestMilestone('P1.M1', 'M1', 'Planned', [createTestTask('P1.M1.T1', 'T1', 'Planned', [subtask])])]);
  const mockManager = createMockSessionManager(backlog);
  (resolveScope as any).mockReturnValue([subtask]);

  const orchestrator = new TaskOrchestrator(mockManager);

  // EXECUTE: Process item
  await orchestrator.processNextItem();

  // VERIFY: currentItemId matches processed item
  expect(orchestrator.currentItemId).toBe('P1.M1.T1.S1');
});
```

### Integration Points

```yaml
TASK_ORCHESTRATOR:
  - class: TaskOrchestrator from src/core/task-orchestrator.ts
  - method: async processNextItem(): Promise<boolean>
  - method: executePhase(phase: Phase): Promise<void>
  - method: executeMilestone(milestone: Milestone): Promise<void>
  - method: executeTask(task: Task): Promise<void>
  - method: executeSubtask(subtask: Subtask): Promise<void>
  - property: executionQueue: HierarchyItem[] (read-only copy)
  - property: currentItemId: string | null

SCOPE_RESOLVER:
  - function: resolveScope(backlog: Backlog, scope: Scope): HierarchyItem[]
  - scope types: 'all', 'phase', 'milestone', 'task', 'subtask'

SESSION_MANAGER:
  - method: async updateItemStatus(itemId: string, status: Status): Promise<Backlog>
  - property: currentSession: SessionState | null

MODELS:
  - types: Phase, Milestone, Task, Subtask, Backlog, HierarchyItem, Status
  - Status values: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'

TEST_FRAMEWORK:
  - runner: Vitest (configured in vitest.config.ts)
  - environment: node
  - mock: vi.mock(), vi.mocked(), vi.clearAllMocks(), vi.hoisted()
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit tests/unit/core/task-traversal.test.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run ESLint to check code style
npx eslint tests/unit/core/task-traversal.test.ts --fix

# Expected: Zero linting errors. Auto-fix should handle formatting issues.

# Run Prettier for consistent formatting
npx prettier --write tests/unit/core/task-traversal.test.ts

# Expected: File formatted successfully.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the new unit test file
npx vitest run tests/unit/core/task-traversal.test.ts

# Expected: All tests pass. Check output for any failures.

# Run all core unit tests to ensure no regressions
npx vitest run tests/unit/core/

# Expected: All core unit tests pass.

# Run with coverage report
npx vitest run tests/unit/core/task-traversal.test.ts --coverage

# Expected: Coverage shows tested code paths (processNextItem, execute methods, scope resolution)
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all unit tests
npm test

# Expected: All tests pass (unit + integration).

# Verify no regressions in existing tests
npx vitest run tests/unit/core/task-orchestrator.test.ts
npx vitest run tests/unit/core/task-utils.test.ts
npx vitest run tests/unit/core/scope-resolver.test.ts

# Expected: Existing core tests still pass.

# Test project-wide validation
npm run validate

# Expected: All validation checks pass (linting, typecheck, formatting).
```

### Level 4: Domain-Specific Validation

```bash
# Manual verification: Run test and inspect traversal order
# Add temporary logging to see actual DFS behavior

# Domain-specific: Verify DFS pre-order traversal semantics
# Test that parent indices are less than child indices in processed array
# Test that status transitions follow parent-before-children order

# Test edge cases:
# - Single item hierarchies (phase only, milestone only, task only, subtask only)
# - Empty hierarchies (no items)
# - Wide hierarchies (multiple siblings at same level)
# - Deep hierarchies (maximum depth = 4 levels)
# - Scope filtering (phase, milestone, task, subtask, all, non-existent ID)

# Test mock behavior verification:
# - Verify resolveScope is called with correct backlog and scope
# - Verify updateItemStatus is called with correct status values
# - Verify executionQueue is built correctly from resolveScope result
# - Verify processNextItem() returns correct boolean values
# - Verify currentItemId is updated correctly during processing
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npx vitest run tests/unit/core/task-traversal.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/unit/core/task-traversal.test.ts`
- [ ] No linting errors: `npx eslint tests/unit/core/task-traversal.test.ts`
- [ ] No formatting issues: `npx prettier --check tests/unit/core/task-traversal.test.ts`

### Feature Validation

- [ ] Traversal order follows DFS pre-order (parent before children) (CONTRACT a)
- [ ] Parent status changes to 'Implementing' when child starts (CONTRACT b)
- [ ] Traversal stops at Subtask level (subtasks are execution units) (CONTRACT c)
- [ ] Traversal respects scope limits (phase/milestone/task filters) (CONTRACT d)
- [ ] processNextItem() returns true when items remain, false when empty
- [ ] currentItemId is updated correctly during processing
- [ ] Execution queue is built correctly from scope
- [ ] All hierarchy types (Phase, Milestone, Task, Subtask) are processed correctly

### Code Quality Validation

- [ ] Follows existing test patterns from task-orchestrator.test.ts
- [ ] Test isolation: beforeEach properly clears mocks
- [ ] Descriptive test names following "should..." convention
- [ ] Proper assertions with clear failure messages
- [ ] Factory functions for common operations (createTestSubtask, etc.)
- [ ] Mock setup in factory functions prevents test pollution
- [ ] Uses Setup/Execute/Verify pattern consistently

### Documentation & Deployment

- [ ] Test file has JSDoc comment explaining purpose
- [ ] Complex test logic has inline comments with Setup/Execute/Verify sections
- [ ] All CONTRACT requirements from work item description are tested
- [ ] Test file structure matches existing test files

## Anti-Patterns to Avoid

- ❌ Don't create real TaskOrchestrator without mocking dependencies - use mocks
- ❌ Don't forget to mock resolveScope - it controls execution queue contents
- ❌ Don't forget to mock ResearchQueue and PRPRuntime - they cause side effects
- ❌ Don't use SessionManager directly - create mock with currentSession
- ❌ Don't skip testing status transitions - they're part of CONTRACT b
- ❌ Don't assume DFS order - verify with array index comparisons
- ❌ Don't test only happy paths - include edge cases (empty, single item, non-existent scope)
- ❌ Don't forget to test scope filtering - it's CONTRACT d
- ❌ Don't use real file system operations in unit tests - mock all fs calls
- ❌ Don't forget vi.clearAllMocks() in beforeEach (causes test pollution)
- ❌ Don't create mocks inline - use factory functions for consistency
- ❌ Don't verify log output directly - verify behavior through mock calls
- ❌ Don't skip testing processNextItem() return values (true/false)
- ❌ Don't forget currentItemId verification - it tracks processing state
