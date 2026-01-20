# Product Requirement Prompt (PRP): Test Task Orchestrator Hierarchy Traversal

**PRP ID**: P2.M2.T1.S1
**Generated**: 2026-01-15
**Story Points**: 2
**Dependency**: P2.M1.T2.S3 (Session Discovery Tests) - Must pass before this task begins

---

## Goal

**Feature Goal**: Create comprehensive integration tests for TaskOrchestrator's hierarchy traversal logic, validating depth-first pre-order traversal (Phase → Milestone → Task → Subtask), correct execution queue population, scope-based filtering, and DFS processing order.

**Deliverable**: Extended integration test file at `tests/integration/core/task-orchestrator.test.ts` with full coverage of hierarchy traversal scenarios using real SessionManager and multi-level task fixtures.

**Success Definition**:
- `processNextItem()` returns items in correct DFS pre-order (parent before children)
- Execution queue correctly populated from backlog respecting scope filter
- Scope filtering works correctly (phase/milestone/task scopes)
- Type-specific delegation to `executePhase()`, `executeMilestone()`, `executeTask()`, `executeSubtask()`
- Empty backlog returns `false` from `processNextItem()`
- Multi-level hierarchy traversal completes all levels
- Status updates propagate through hierarchy correctly
- All integration tests pass with 100% coverage of traversal code paths
- Tests document actual traversal order and queue behavior

---

## User Persona

**Target User**: Developer working on TaskOrchestrator validation who needs assurance that the core traversal logic correctly processes complex task hierarchies.

**Use Case**: Validating that TaskOrchestrator's DFS traversal processes items in the correct order, respects scope boundaries, and correctly delegates execution to type-specific handlers.

**User Journey**:
1. Pipeline initializes TaskOrchestrator with SessionManager
2. Orchestrator builds execution queue from backlog
3. `processNextItem()` called repeatedly until `false` returned
4. Each item processed in correct order with status updates
5. All items in scope completed successfully

**Pain Points Addressed**:
- **Unclear traversal order**: Does it process parents before children? (Tests verify: YES, DFS pre-order)
- **Unclear scope behavior**: What does "milestone scope" include? (Tests verify: Milestone + tasks + subtasks)
- **Unclear queue population**: How are items added to queue? (Tests verify: DFS pre-order, scope-filtered)
- **Complex hierarchy handling**: How are nested tasks processed? (Tests verify: Recursive DFS traversal)
- **Empty backlog edge case**: What happens with no tasks? (Tests verify: Returns `false` immediately)

---

## Why

- **Core Pipeline Engine**: TaskOrchestrator is the central execution engine for the PRP Pipeline
- **Correct Execution Order**: DFS traversal ensures parents initialize before children (critical for dependency resolution)
- **Scope-Based Execution**: Users need to execute specific scopes (e.g., single milestone for debugging)
- **Integration with SessionManager**: P2.M1 validated SessionManager; this validates the consumer
- **Foundation for Later Tests**: Traversal is foundational; P2.M2.T2 will test dependency resolution
- **Problems Solved**:
  - "In what order are tasks processed?" (Tests verify: DFS pre-order)
  - "How do I limit execution to a specific milestone?" (Tests verify: Scope filtering)
  - "What happens when backlog is empty?" (Tests verify: Returns `false`)
  - "Are children processed before parents?" (Tests verify: NO, parents first)

---

## What

Extend the integration test file at `tests/integration/core/task-orchestrator.test.ts` to validate hierarchy traversal with real SessionManager integration and multi-level task fixtures.

### Current State Analysis

**TaskOrchestrator Class** (from `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`):

**Constructor** (lines 107-139):
```typescript
constructor(
  sessionManager: SessionManager,
  initialScope?: ExecutionScope,
  bypassCache: boolean = false
) {
  this.sessionManager = sessionManager;
  this.currentScope = initialScope ?? { type: 'phase', id: 'P1' };
  this.bypassCache = bypassCache;
  this.#refreshBacklog(); // Loads backlog from SessionManager
  this.#buildQueue(); // Populates execution queue
}
```

**processNextItem() Method** (lines 805-834):
```typescript
async processNextItem(): Promise<boolean> {
  // Check if queue is empty
  if (this.#executionQueue.length === 0) {
    return false;
  }

  // Get next item from front of queue
  const nextItem = this.#executionQueue.shift();

  // Log processing start
  console.log(`[TaskOrchestrator] Processing: ${nextItem.id}`);

  // Delegate to type-specific execute method
  const result = await this.#delegateByType(nextItem);

  // Log processing complete
  console.log(`[TaskOrchestrator] Completed: ${nextItem.id}`);

  return true;
}
```

**#delegateByType() Method** (lines 445-470):
```typescript
async #delegateByType(item: HierarchyItem): Promise<void> {
  switch (item.type) {
    case 'Phase':
      return this.executePhase(item);
    case 'Milestone':
      return this.executeMilestone(item);
    case 'Task':
      return this.executeTask(item);
    case 'Subtask':
      return this.executeSubtask(item);
    default:
      throw new Error(`Unknown item type: ${(item as HierarchyItem).type}`);
  }
}
```

**#buildQueue() Method** (lines 387-414):
```typescript
#buildQueue(): void {
  // Refresh backlog from SessionManager
  this.#refreshBacklog();

  // Resolve scope to get filtered items
  const itemsInScope = resolveScope(
    this.#backlog,
    this.currentScope
  );

  // Build execution queue from items in scope
  this.#executionQueue = itemsInScope;
  this.totalItems = itemsInScope.length;

  console.log(`[TaskOrchestrator] Queue built: ${this.#executionQueue.length} items`);
}
```

**ScopeResolver.resolveScope()** (from `/home/dustin/projects/hacky-hack/src/core/scope-resolver.ts`):
```typescript
export function resolveScope(
  backlog: Phase[],
  scope: ExecutionScope
): HierarchyItem[] {
  // Returns flattened hierarchy respecting scope boundaries
  // DFS pre-order traversal with scope filtering
  // Phase scope: Phase + Milestones + Tasks + Subtasks
  // Milestone scope: Milestone + Tasks + Subtasks
  // Task scope: Task + Subtasks
}
```

**Execution Queue Structure**:
- FIFO queue (shift() from front, push() to back)
- Items in DFS pre-order (parent before children)
- Filtered by current scope
- Flattened hierarchy (not nested)

### Success Criteria

- [ ] Test 1: processNextItem() processes items in DFS pre-order
- [ ] Test 2: Empty backlog returns false immediately
- [ ] Test 3: Scope filtering works correctly (milestone scope)
- [ ] Test 4: Scope filtering works correctly (task scope)
- [ ] Test 5: Type-specific delegation called for each type
- [ ] Test 6: Multi-level hierarchy traversal completes all levels
- [ ] Test 7: Queue correctly populated from backlog
- [ ] Test 8: Status updates propagate during traversal
- [ ] All tests use real SessionManager (not mocked)
- [ ] All tests pass: `npm test -- tests/integration/core/task-orchestrator.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] TaskOrchestrator.processNextItem() implementation documented (lines 805-834)
- [x] TaskOrchestrator.#delegateByType() implementation documented (lines 445-470)
- [x] TaskOrchestrator.#buildQueue() implementation documented (lines 387-414)
- [x] ScopeResolver.resolveScope() implementation documented
- [x] Execution queue structure documented (FIFO, DFS pre-order)
- [x] Integration test patterns analyzed from existing tests
- [x] Real SessionManager integration pattern understood
- [x] Scope boundaries defined (phase/milestone/task)
- [x] Dependency on P2.M1.T2.S3 established
- [x] Traversal order requirements documented

---

### Documentation & References

```yaml
# MUST READ - TaskOrchestrator.processNextItem() implementation
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Contains processNextItem() method (lines 805-834) with queue processing logic
  section: Lines 805-834
  critical: |
    - Checks if queue is empty (returns false if so)
    - Shifts next item from front of queue
    - Logs processing start
    - Delegates to #delegateByType()
    - Logs processing complete
    - Returns true if item processed
    - CRITICAL: Returns false when queue empty (termination condition)

# MUST READ - TaskOrchestrator.#delegateByType() implementation
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Contains #delegateByType() method (lines 445-470) with type-based dispatch
  section: Lines 445-470
  pattern: |
    - Switch statement on item.type
    - Calls executePhase() for Phase items
    - Calls executeMilestone() for Milestone items
    - Calls executeTask() for Task items
    - Calls executeSubtask() for Subtask items
    - Throws error for unknown types
  critical: |
    - Type-specific delegation is core pattern
    - Each execute* method sets status to 'Implementing'
    - executeTask() enqueues subtasks for PRP generation
    - executeSubtask() handles 3-step status progression

# MUST READ - TaskOrchestrator.#buildQueue() implementation
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Contains #buildQueue() method (lines 387-414) with queue population logic
  section: Lines 387-414
  pattern: |
    - Calls #refreshBacklog() to reload from SessionManager
    - Calls ScopeResolver.resolveScope() to filter by scope
    - Builds execution queue from filtered items
    - Sets totalItems counter
    - Logs queue size
  critical: |
    - Queue is rebuilt when scope changes
    - Queue respects scope boundaries
    - Queue is flattened (not nested hierarchy)
    - Items in DFS pre-order

# MUST READ - ScopeResolver.resolveScope() implementation
- file: /home/dustin/projects/hacky-hack/src/core/scope-resolver.ts
  why: Contains resolveScope() function with DFS traversal and scope filtering
  section: Full file
  pattern: |
    - Takes backlog (Phase[]) and scope (ExecutionScope)
    - Flattens hierarchy to HierarchyItem[]
    - Filters items to those within scope
    - Returns items in DFS pre-order
  critical: |
    - Scope types: 'phase', 'milestone', 'task'
    - Phase scope: Returns all items in phase
    - Milestone scope: Returns milestone + descendants
    - Task scope: Returns task + subtasks
    - Uses recursive traversal for flattening

# MUST READ - TaskOrchestrator constructor
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Contains constructor (lines 107-139) showing initialization
  section: Lines 107-139
  pattern: |
    - Stores SessionManager reference
    - Sets currentScope (defaults to phase scope)
    - Sets bypassCache flag
    - Calls #refreshBacklog()
    - Calls #buildQueue()
  critical: |
    - Queue built on construction
    - SessionManager must have active session
    - Throws error if no active session
    - Scope can be changed via setScope()

# MUST READ - Existing unit test patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts
  why: Contains 3,690 lines of comprehensive unit tests with mocking patterns
  section: Full file
  pattern: |
    - Factory functions for test data (createTestPhase, createTestMilestone, etc.)
    - Vi.js mocking for dependencies
    - Setup/Execute/Verify structure
    - Call order verification with toHaveBeenNthCalledWith()
    - Status progression testing
  critical: |
    - These are UNIT tests with mocks
    - Integration tests should use REAL SessionManager
    - Factory functions can be reused
    - Test patterns can be adapted

# MUST READ - SessionManager integration test patterns
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: Contains integration tests with real SessionManager and temp directories
  section: Full file (1200+ lines)
  pattern: |
    - Temp directory setup with mkdtempSync()
    - Real SessionManager instantiation
    - describe/it block structure
    - SETUP/EXECUTE/VERIFY comments
    - Cleanup in afterEach()
  gotcha: |
    - Integration tests use real fs operations
    - Temp directories must be cleaned up
    - SessionManager requires valid session directory
    - Use mkdtempSync() for unique temp directories

# MUST READ - Previous PRP for session discovery (P2.M1.T2.S3)
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T2S3/PRP.md
  why: Contains session discovery test patterns and SessionManager integration
  section: Implementation Tasks and Implementation Patterns
  pattern: |
    - Temp directory setup pattern
    - SessionManager initialization pattern
    - Real filesystem operations
    - Test isolation with unique directories
  critical: |
    - P2.M1.T2.S3 tests SessionManager discovery methods
    - This PRP (P2.M2.T1.S1) tests TaskOrchestrator traversal
    - Both use SessionManager integration
    - Tests are complementary (discovery + traversal = complete workflow)

# MUST READ - Research: Hierarchy traversal patterns
- docfile: plan/002_1e734971e481/P2M2T1S1/research/hierarchical-task-execution-patterns.md
  why: Comprehensive research on DFS pre-order traversal and scope filtering
  section: Full document
  pattern: |
    - DFS pre-order: Visit parent, then recursively visit children
    - BFS pre-order: Visit level by level (NOT used here)
    - Scope filtering: Limit traversal to subtree
    - Queue-based execution: Flatten tree to queue
  critical: |
    - TaskOrchestrator uses DFS pre-order (parent before children)
    - Ensures parents initialize before descendants
    - Critical for dependency resolution
    - Queue is flattened (not nested)

# MUST READ - Research: Testing patterns for orchestrators
- docfile: plan/002_1e734971e481/P2M2T1S1/research/testing-patterns-for-orchestrator-components.md
  why: Comprehensive research on testing orchestrator components
  section: Full document
  pattern: |
    - Unit tests: Mock dependencies, test logic in isolation
    - Integration tests: Real dependencies, test interactions
    - Contract tests: Verify interface adherence
    - Performance tests: Measure throughput, latency
  critical: |
    - Integration tests use real SessionManager
    - Test fixture builders for complex hierarchies
    - Temp directory isolation
    - Cleanup after each test
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── task-orchestrator.ts            # SOURCE: processNextItem() (805-834)
│   │   │                                   # SOURCE: #delegateByType() (445-470)
│   │   │                                   # SOURCE: #buildQueue() (387-414)
│   │   │                                   # SOURCE: constructor (107-139)
│   │   ├── scope-resolver.ts               # REFERENCE: resolveScope() function
│   │   ├── session-manager.ts              # REFERENCE: SessionManager class
│   │   ├── models.ts                       # REFERENCE: HierarchyItem types
│   │   └── task-utils.ts                   # REFERENCE: Utility functions
│   └── utils/
│       └── task-utils.ts                   # REFERENCE: getDependencies()
├── tests/
│   ├── setup.ts                            # Global test setup
│   ├── unit/
│   │   └── core/
│   │       └── task-orchestrator.test.ts   # EXISTING: Unit tests with mocks (3690 lines)
│   ├── fixtures/
│   │   └── (various PRD fixtures)          # REFERENCE: For test data
│   └── integration/
│       └── core/
│           ├── session-manager.test.ts    # REFERENCE: Integration test patterns
│           └── task-orchestrator.test.ts  # CREATE: Integration tests for traversal
├── plan/
│   └── 002_1e734971e481/
│       ├── P2M1T2S3/
│       │   └── PRP.md                     # REFERENCE: Session discovery tests
│       ├── P2M2T1S1/
│       │   ├── PRP.md                     # NEW: This PRP
│       │   └── research/                  # NEW: Research documentation
│       │       ├── hierarchical-task-execution-patterns.md
│       │       ├── task-dependency-resolution.md
│       │       ├── testing-patterns-for-orchestrator-components.md
│       │       └── queue-based-execution-patterns.md
│       └── tasks.json                     # REFERENCE: Sample tasks.json
├── vitest.config.ts                        # Vitest configuration
└── package.json                            # Test scripts
```

---

### Desired Codebase Tree (modifications to existing files)

```bash
hacky-hack/
└── tests/
    └── integration/
        └── core/
            └── task-orchestrator.test.ts  # CREATE: Integration tests for traversal
                                                       # ADD: describe('TaskOrchestrator Hierarchy Traversal', () => { ... })
                                                       # ADD: Tests for processNextItem() traversal order
                                                       # ADD: Tests for scope filtering
                                                       # ADD: Tests for type-specific delegation
                                                       # ADD: Tests for empty backlog handling
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: TaskOrchestrator Uses Real SessionManager in Integration Tests
// Unit tests mock SessionManager, but integration tests use real instance
// Pattern: const orchestrator = new TaskOrchestrator(sessionManager, scope);
// Tests must create valid session directory with tasks.json
// Tests must use temp directories to avoid side effects

// CRITICAL: processNextItem() Returns False When Queue Empty
// This is the termination condition for processing loops
// Pattern: while (await orchestrator.processNextItem()) { /* process */ }
// Tests should verify this returns false after all items processed
// Tests should verify this returns true while items remain

// CRITICAL: Traversal Order is DFS Pre-Order (Parent Before Children)
// Phase processed before Milestones
// Milestone processed before Tasks
// Task processed before Subtasks
// This ensures parents initialize before descendants
// Tests should verify order: P1 → P1.M1 → P1.M1.T1 → P1.M1.T1.S1

// CRITICAL: Queue is FIFO (First-In-First-Out)
// Items added to back with push()
// Items removed from front with shift()
// First item in queue is processed first
// Tests should verify order matches queue population order

// CRITICAL: Scope Filtering Affects Queue Population
// Phase scope: All items in phase
// Milestone scope: Only milestone + descendants
// Task scope: Only task + subtasks
// Queue is rebuilt when scope changes (setScope())
// Tests should verify queue content matches scope

// GOTCHA: Execution Queue is Flattened (Not Nested)
// Hierarchy is flattened to HierarchyItem[] array
// No nesting in queue (flat structure)
// DFS traversal encoded in array order, not structure
// Tests should verify array order, not nested structure

// CRITICAL: Type-Specific Delegation Via Switch Statement
// #delegateByType() uses switch on item.type
// Each type has dedicated execute* method
// Unknown types throw Error
// Tests should verify correct method called for each type

// GOTCHA: executeTask() Enqueues Subtasks
// executeTask() sets status to 'Implementing'
// Then enqueues subtasks for PRP generation
// Does NOT execute subtasks directly
// Tests should verify subtasks added to queue, not executed immediately

// CRITICAL: executeSubtask() Handles 3-Step Status Progression
// Researching → Implementing → Complete
// Each status update persisted to SessionManager
// Tests should verify all three status updates occur
// Tests should use toHaveBeenNthCalledWith() for order verification

// GOTCHA: SessionManager Must Have Active Session
// TaskOrchestrator throws error if sessionManager.currentSession is null
// Tests must initialize SessionManager with valid session
// Tests must create session directory with tasks.json
// Use createTestSessionDirectory() helper for setup

// CRITICAL: Temp Directory Cleanup Required
// Tests create session directories
// Must cleanup all directories in afterEach()
// Use rmSync(recursive: true, force: true)
// Tests should use unique temp directories per test

// GOTCHA: Integration Tests Use Real Filesystem
// Don't mock fs for integration tests
// Use mkdtempSync() for unique temp directories
// Real SessionManager reads/writes real files
// Tests must be isolated (no shared state between tests)

// CRITICAL: Scope Can Be Changed Mid-Execution
// setScope() rebuilds queue with new scope
// Existing progress preserved
// Tests can verify scope switching behavior
// Tests should verify queue rebuilt after scope change

// GOTCHA: Backlog Refreshed When Queue Built
// #buildQueue() calls #refreshBacklog() first
# Reloads from SessionManager (gets latest state)
// Useful for picking up status updates
// Tests can verify state changes reflected in queue
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing TaskOrchestrator traversal with real SessionManager integration and multi-level task fixtures.

**Key Types Used**:
- `HierarchyItem`: Union type for Phase | Milestone | Task | Subtask
- `ExecutionScope`: { type: 'phase' | 'milestone' | 'task', id: string }
- `Phase`, `Milestone`, `Task`, `Subtask`: From models.ts

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY tests/integration/core directory exists
  - CHECK: Directory exists
  - CREATE: If not exists, create directory structure
  - DEPENDENCIES: None
  - PLACEMENT: tests/integration/core/

Task 2: CREATE integration test file for TaskOrchestrator
  - FILE: tests/integration/core/task-orchestrator.test.ts
  - CREATE: New file (doesn't exist yet)
  - ADD: Imports for TaskOrchestrator, SessionManager, models
  - ADD: Imports for fs utilities (mkdtempSync, rmSync, mkdirSync, writeFileSync)
  - ADD: Describe block for hierarchy traversal tests
  - DEPENDENCIES: Task 1
  - PLACEMENT: tests/integration/core/task-orchestrator.test.ts

Task 3: CREATE session fixture helper functions
  - FILE: tests/integration/core/task-orchestrator.test.ts
  - ADD: createTestSessionDirectory() helper
  - ADD: createTestBacklog() helper
  - ADD: createTestPhase() helper
  - ADD: createTestMilestone() helper
  - ADD: createTestTask() helper
  - ADD: createTestSubtask() helper
  - PATTERN: Follow existing factory function patterns from unit tests
  - DEPENDENCIES: Task 2
  - PLACEMENT: Top of file, before describe() blocks

Task 4: CREATE beforeEach/afterEach hooks for test isolation
  - FILE: tests/integration/core/task-orchestrator.test.ts
  - ADD: beforeEach() to create unique temp directory
  - ADD: beforeEach() to create session directory structure
  - ADD: afterEach() to cleanup temp directory
  - PATTERN: Follow session-manager.test.ts pattern
  - DEPENDENCIES: Task 3
  - PLACEMENT: Inside main describe() block

Task 5: IMPLEMENT Test 1 - processNextItem() processes items in DFS pre-order
  - CREATE: it('should process items in DFS pre-order (parent before children)', async () => { ... })
  - SETUP: Create 3-level hierarchy (Phase → Milestone → Task → Subtask)
  - SETUP: Initialize TaskOrchestrator with phase scope
  - EXECUTE: Call processNextItem() 4 times, track order
  - VERIFY: Order is Phase → Milestone → Task → Subtask
  - VERIFY: Returns true for first 3 calls, false for 4th call
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 2 - Empty backlog returns false immediately
  - CREATE: it('should return false immediately when backlog is empty', async () => { ... })
  - SETUP: Create session with empty backlog (no tasks)
  - SETUP: Initialize TaskOrchestrator
  - EXECUTE: Call processNextItem()
  - VERIFY: Returns false immediately
  - VERIFY: No status updates occurred
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 3 - Scope filtering works correctly (milestone scope)
  - CREATE: it('should filter items correctly when using milestone scope', async () => { ... })
  - SETUP: Create hierarchy with 2 milestones (P1.M1, P1.M2)
  - SETUP: Initialize TaskOrchestrator with milestone scope (P1.M1)
  - EXECUTE: Process all items until returns false
  - VERIFY: Only P1.M1 and descendants processed
  - VERIFY: P1.M2 not processed
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 4 - Scope filtering works correctly (task scope)
  - CREATE: it('should filter items correctly when using task scope', async () => { ... })
  - SETUP: Create hierarchy with 2 tasks (P1.M1.T1, P1.M1.T2)
  - SETUP: Initialize TaskOrchestrator with task scope (P1.M1.T1)
  - EXECUTE: Process all items until returns false
  - VERIFY: Only P1.M1.T1 and subtasks processed
  - VERIFY: P1.M1.T2 not processed
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 5 - Type-specific delegation called for each type
  - CREATE: it('should delegate to correct execute method for each item type', async () => { ... })
  - SETUP: Create hierarchy with all 4 types
  - SETUP: Spy on executePhase, executeMilestone, executeTask, executeSubtask
  - EXECUTE: Process all items
  - VERIFY: executePhase called for Phase
  - VERIFY: executeMilestone called for Milestone
  - VERIFY: executeTask called for Task
  - VERIFY: executeSubtask called for Subtask
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Test 6 - Multi-level hierarchy traversal completes all levels
  - CREATE: it('should complete all levels of complex hierarchy', async () => { ... })
  - SETUP: Create 4-level hierarchy with multiple items per level
  - SETUP: Phase → 2 Milestones → 2 Tasks each → 2 Subtasks each
  - EXECUTE: Process all items until returns false
  - VERIFY: All 1 + 2 + 4 + 8 = 15 items processed
  - VERIFY: All status updates persisted to SessionManager
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 7 - Queue correctly populated from backlog
  - CREATE: it('should populate execution queue from backlog in correct order', async () => { ... })
  - SETUP: Create complex hierarchy
  - SETUP: Initialize TaskOrchestrator
  - SETUP: Access internal #executionQueue (if possible) or infer from processing
  - EXECUTE: Process all items, track order
  - VERIFY: Processing order matches DFS pre-order
  - VERIFY: Queue length matches expected item count
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 8 - Status updates propagate during traversal
  - CREATE: it('should update status for each item during traversal', async () => { ... })
  - SETUP: Create hierarchy with mixed initial statuses
  - SETUP: Initialize TaskOrchestrator
  - EXECUTE: Process all items
  - VERIFY: SessionManager.updateItemStatus called for each item
  - VERIFY: Status set to 'Implementing' during processing
  - VERIFY: Final status persisted to tasks.json
  - DEPENDENCIES: Task 11

Task 13: RUN tests and verify all pass
  - RUN: npm test -- tests/integration/core/task-orchestrator.test.ts
  - VERIFY: All traversal tests pass
  - VERIFY: No side effects on actual plan/ directory
  - VERIFY: Temp directories cleaned up
  - FIX: Any failing tests
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
// PATTERN: Session Fixture Helper Functions
// =============================================================================

import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SessionManager } from '../../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../../src/core/task-orchestrator.js';
import type {
  Phase,
  Milestone,
  Task,
  Subtask,
  ExecutionScope
} from '../../../src/core/models.js';

/**
 * Creates a temporary directory for testing
 * @returns Path to temporary directory
 */
function createTempDirectory(): string {
  return mkdtempSync(join(tmpdir(), 'task-orchestrator-test-'));
}

/**
 * Creates a test session directory with valid structure
 * @param tempDir - Temporary directory path
 * @param backlog - Task backlog to write to tasks.json
 * @returns Path to session directory
 */
function createTestSessionDirectory(
  tempDir: string,
  backlog: Phase[]
): string {
  const sessionPath = join(tempDir, 'plan', '001_testhash');
  mkdirSync(sessionPath, { recursive: true });

  // Write tasks.json
  writeFileSync(
    join(sessionPath, 'tasks.json'),
    JSON.stringify({ backlog }, null, 2),
    'utf-8'
  );

  // Write prd_snapshot.md
  writeFileSync(
    join(sessionPath, 'prd_snapshot.md'),
    '# Test PRD\n\nThis is a test PRD snapshot.',
    'utf-8'
  );

  return sessionPath;
}

/**
 * Creates a test subtask
 * @param id - Subtask ID
 * @param title - Subtask title
 * @param status - Initial status
 * @param dependencies - Array of dependency IDs
 * @returns Subtask object
 */
function createTestSubtask(
  id: string,
  title: string,
  status: string = 'Planned',
  dependencies: string[] = []
): Subtask {
  return {
    type: 'Subtask',
    id,
    title,
    status,
    story_points: 2,
    dependencies,
    context_scope: 'Test context scope'
  };
}

/**
 * Creates a test task
 * @param id - Task ID
 * @param title - Task title
 * @param status - Initial status
 * @param subtasks - Array of subtasks
 * @returns Task object
 */
function createTestTask(
  id: string,
  title: string,
  status: string = 'Planned',
  subtasks: Subtask[] = []
): Task {
  return {
    type: 'Task',
    id,
    title,
    status,
    description: 'Test task description',
    subtasks
  };
}

/**
 * Creates a test milestone
 * @param id - Milestone ID
 * @param title - Milestone title
 * @param status - Initial status
 * @param tasks - Array of tasks
 * @returns Milestone object
 */
function createTestMilestone(
  id: string,
  title: string,
  status: string = 'Planned',
  tasks: Task[] = []
): Milestone {
  return {
    type: 'Milestone',
    id,
    title,
    status,
    description: 'Test milestone description',
    tasks
  };
}

/**
 * Creates a test phase
 * @param id - Phase ID
 * @param title - Phase title
 * @param status - Initial status
 * @param milestones - Array of milestones
 * @returns Phase object
 */
function createTestPhase(
  id: string,
  title: string,
  status: string = 'Planned',
  milestones: Milestone[] = []
): Phase {
  return {
    type: 'Phase',
    id,
    title,
    status,
    description: 'Test phase description',
    milestones
  };
}

// =============================================================================
// PATTERN: Test 1 - DFS Pre-Order Traversal
// =============================================================================

describe('TaskOrchestrator Hierarchy Traversal', () => {
  let tempDir: string;
  let sessionPath: string;
  let sessionManager: SessionManager;

  beforeEach(() => {
    // SETUP: Create unique temp directory for each test
    tempDir = createTempDirectory();

    // SETUP: Create test backlog with 3-level hierarchy
    const backlog = [
      createTestPhase('P1', 'Phase 1', 'Planned', [
        createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
          createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
            createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned')
          ])
        ])
      ])
    ];

    // SETUP: Create session directory
    sessionPath = createTestSessionDirectory(tempDir, backlog);

    // SETUP: Initialize SessionManager
    sessionManager = new SessionManager();
    sessionManager.initialize(sessionPath);
  });

  afterEach(() => {
    // CLEANUP: Remove temp directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - DFS Pre-Order Traversal
  // =============================================================================

  it('should process items in DFS pre-order (parent before children)', async () => {
    // SETUP: Create orchestrator with phase scope
    const orchestrator = new TaskOrchestrator(
      sessionManager,
      { type: 'phase', id: 'P1' }
    );

    // SETUP: Track processing order
    const processedOrder: string[] = [];

    // EXECUTE: Process items and track order
    let hasMore = true;
    while (hasMore) {
      hasMore = await orchestrator.processNextItem();
      if (hasMore) {
        // Get last processed item from queue (tracked internally)
        // In actual test, use spy or check SessionManager status updates
        processedOrder.push('item'); // Placeholder
      }
    }

    // VERIFY: processNextItem returns true for items, false when empty
    // Should process 4 items: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1
    // Verify order matches DFS pre-order
    expect(processedOrder).toHaveLength(4);
  });

  // Additional tests follow similar patterns...
});
```

---

### Integration Points

```yaml
INPUT FROM P2.M1.T2.S3 (SESSION DISCOVERY TESTS):
  - tests/integration/core/session-manager.test.ts with integration test patterns
  - Pattern: Temp directory setup, SessionManager initialization
  - Pattern: Real filesystem operations
  - Pattern: beforeEach/afterEach hooks for isolation
  - This PRP: ADAPTS patterns for TaskOrchestrator testing
  - This PRP: Tests TaskOrchestrator (consumer of SessionManager)

INPUT FROM TASKORCHESTRATOR UNIT TESTS:
  - tests/unit/core/task-orchestrator.test.ts with factory functions
  - Pattern: createTestPhase(), createTestMilestone(), etc.
  - Pattern: Setup/Execute/Verify structure
  - Pattern: Call order verification
  - This PRP: REUSES factory functions for test data
  - This PRP: Uses REAL SessionManager (not mocked)

INPUT FROM TASKORCHESTRATOR IMPLEMENTATION:
  - src/core/task-orchestrator.ts with traversal logic
  - processNextItem() (lines 805-834)
  - #delegateByType() (lines 445-470)
  - #buildQueue() (lines 387-414)
  - Pattern: DFS pre-order traversal
  - Pattern: FIFO queue processing
  - Pattern: Type-specific delegation
  - This PRP: Tests validate actual implementation behavior

INPUT FROM SCOPERESOLVER:
  - src/core/scope-resolver.ts with scope filtering
  - resolveScope() function
  - Pattern: Flattens hierarchy, filters by scope
  - Pattern: Returns items in DFS pre-order
  - This PRP: Tests verify scope filtering works correctly

OUTPUT FOR SUBSEQUENT WORK:
  - Integration tests for TaskOrchestrator traversal
  - Confidence that DFS traversal works correctly
  - Foundation for dependency resolution tests (P2.M2.T2)
  - Validation of scope filtering behavior
  - Foundation for PRP runtime integration tests

DIRECTORY STRUCTURE:
  - Create: tests/integration/core/task-orchestrator.test.ts
  - Add: Hierarchy traversal integration tests
  - Add: Scope filtering tests
  - Add: Type-specific delegation tests
  - No modifications to existing unit tests
  - Tests can run independently

CLEANUP INTEGRATION:
  - Temp directories cleaned up in afterEach()
  - No side effects on actual plan/ directory
  - SessionManager instances isolated per test
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating task-orchestrator.test.ts
# Run tests to check for errors
npm test -- tests/integration/core/task-orchestrator.test.ts

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
# Test the new integration test file
npm test -- tests/integration/core/task-orchestrator.test.ts

# Expected: All tests pass (including new traversal tests)
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run all integration tests
npm test -- tests/integration/

# Expected: All integration tests pass
# Expected: No regressions in other integration test files

# Coverage validation
npm run test:coverage

# Expected: Coverage for TaskOrchestrator increases
# Expected: New traversal code paths covered
# Expected: No uncovered lines in processNextItem(), #delegateByType(), #buildQueue()

# If tests fail, check:
# - Temp directory cleanup works
# - Session directory structure is valid
# - File paths are correct (use join() for cross-platform)
# - Scope IDs match actual task IDs
# - Factory functions create valid objects
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
ls -la /tmp/ | grep task-orchestrator-test

# Expected: No leftover temp directories (all cleaned up)

# Manual verification: Read test output
npm test -- tests/integration/core/task-orchestrator.test.ts --reporter=verbose

# Expected: Clear test names showing traversal scenarios
# Expected: Tests grouped by describe blocks
```

### Level 4: Real-World Validation (Scenario Testing)

```bash
# Scenario 1: Complex hierarchy traversal
node -e "
import { TaskOrchestrator } from './dist/core/task-orchestrator.js';
import { SessionManager } from './dist/core/session-manager.js';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tempDir = mkdtempSync(join(tmpdir(), 'complex-traversal-'));
const sessionPath = join(tempDir, 'plan', '001_test');
mkdirSync(sessionPath, { recursive: true });

// Create complex backlog: 1 Phase → 2 Milestones → 2 Tasks each → 2 Subtasks each
const backlog = [{ /* complex hierarchy */ }];
writeFileSync(join(sessionPath, 'tasks.json'), JSON.stringify({ backlog }));
writeFileSync(join(sessionPath, 'prd_snapshot.md'), '# Test');

const manager = new SessionManager();
manager.initialize(sessionPath);
const orchestrator = new TaskOrchestrator(manager);

let count = 0;
while (await orchestrator.processNextItem()) {
  count++;
}
console.log('Processed:', count, 'items (expected: 15)');

rmSync(tempDir, { recursive: true, force: true });
"

# Expected output:
# Processed: 15 items (expected: 15)

# Scenario 2: Scope switching
node -e "
import { TaskOrchestrator } from './dist/core/task-orchestrator.js';
// ... similar setup ...

// Process in P1 scope
const orchestrator1 = new TaskOrchestrator(manager, { type: 'phase', id: 'P1' });
await orchestrator1.processNextItem(); // Process P1

// Switch to P1.M1 scope
orchestrator1.setScope({ type: 'milestone', id: 'P1.M1' });
await orchestrator1.processNextItem(); // Process P1.M1

console.log('Scope switching works');
"

# Expected output:
# Scope switching works
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: DFS pre-order traversal verified
- [ ] Test 2: Empty backlog returns false
- [ ] Test 3: Milestone scope filtering works
- [ ] Test 4: Task scope filtering works
- [ ] Test 5: Type-specific delegation verified
- [ ] Test 6: Multi-level hierarchy completed
- [ ] Test 7: Queue population verified
- [ ] Test 8: Status updates propagate
- [ ] All tests pass: `npm test -- tests/integration/core/task-orchestrator.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No side effects on production plan/ directory
- [ ] Temp directories cleaned up after tests

### Feature Validation

- [ ] DFS pre-order traversal (parent before children)
- [ ] FIFO queue processing (first item first)
- [ ] Empty backlog returns false (termination condition)
- [ ] Scope filtering works (phase/milestone/task)
- [ ] Type-specific delegation (executePhase/executeMilestone/executeTask/executeSubtask)
- [ ] Multi-level hierarchy support (4 levels)
- [ ] Status updates persist to SessionManager
- [ ] Queue rebuilt on scope change

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
- [ ] Factory functions follow existing patterns
- [ ] Tests use real SessionManager (not mocked)

### Documentation & Deployment

- [ ] Tests serve as executable documentation of traversal behavior
- [ ] DFS pre-order behavior documented
- [ ] Scope filtering behavior documented
- [ ] Empty backlog handling documented
- [ ] Integration with SessionManager clear
- [ ] Foundation for dependency resolution tests (P2.M2.T2)

---

## Anti-Patterns to Avoid

- **Don't use mocked SessionManager** - Integration tests use real SessionManager
- **Don't skip temp directory cleanup** - Must use afterEach() with rmSync()
- **Don't use global state** - Each test must use unique temp directory
- **Don't forget .js extensions** - ESM requires .js on all imports
- **Don't test dependency resolution** - That's P2.M2.T2, not this task
- **Don't test PRP execution** - That's P2.M3 or P2.M4, not this task
- **Don't modify TaskOrchestrator code** - This is validation only, no implementation changes
- **Don't hardcode temp directory paths** - Use mkdtempSync() for uniqueness
- **Don't create invalid task objects** - Must match models.ts schema
- **Don't skip scope filtering tests** - Critical feature for users
- **Don't skip empty backlog tests** - Edge case is important
- **Don't assume queue order** - Verify actual processing order
- **Don't test subtask execution** - Focus on traversal, not execution
- **Don't ignore status updates** - Verify SessionManager integration
- **Don't share state between tests** - Isolate with beforeEach/afterEach

---

## Appendix: Decision Rationale

### Why DFS pre-order traversal?

DFS pre-order ensures parents are initialized before children. This is critical for:
1. **Dependency resolution**: Children depend on parent setup
2. **Status propagation**: Parent status affects children
3. **Logical execution**: Can't execute task before milestone starts

Alternative traversal orders (BFS, post-order) would not work because:
- BFS: Processes all milestones before any tasks (no parent-child relationship)
- Post-order: Children before parents (breaks dependency model)

### Why test scope filtering separately?

Scope filtering is a critical user feature. Users need to:
1. Debug specific milestones (milestone scope)
2. Rerun failed tasks (task scope)
3. Limit execution for testing (any scope level)

Testing scope filtering ensures users can control execution boundaries.

### Why use real SessionManager in integration tests?

Unit tests mock SessionManager to test TaskOrchestrator logic in isolation. Integration tests use real SessionManager to verify:
1. File I/O operations work correctly
2. State persistence works end-to-end
3. Error handling matches real behavior
4. Performance characteristics are accurate

This catches issues that mocked tests miss (file permissions, JSON parsing, etc.).

### Why separate traversal tests from dependency resolution tests?

P2.M2.T1.S1 tests traversal (order, queue, scope). P2.M2.T2 will test dependency resolution (blocking, waiting, cycles). Separating them provides:
1. **Clear separation of concerns** - Traversal vs. dependency logic
2. **Easier debugging** - Traversal failures vs. dependency failures isolated
3. **Independent development** - Tests can run in parallel
4. **Comprehensive coverage** - Together they cover complete TaskOrchestrator behavior

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from parallel research (4 research tasks + code analysis)
- [x] TaskOrchestrator implementation fully analyzed with line numbers
- [x] ScopeResolver implementation documented
- [x] Existing unit test patterns analyzed
- [x] Integration test patterns documented
- [x] Hierarchy traversal patterns researched
- [x] Testing patterns for orchestrators researched
- [x] Scope boundaries defined
- [x] Dependency on P2.M1.T2.S3 established
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Decision rationale documented

**Risk Mitigation**:
- Creating new integration test file (low risk of breaking existing tests)
- Integration tests only (no production code changes)
- Temp directory isolation (no side effects on plan/)
- Real SessionManager integration (catches real-world issues)
- Clear acceptance criteria
- Follows established integration test patterns

**Known Risks**:
- **SessionManager initialization complexity**: Must create valid session directory
  - Mitigation: Use createTestSessionDirectory() helper with all required files
- **Scope ID matching**: Scope IDs must match actual task IDs in backlog
  - Mitigation: Use factory functions that generate consistent IDs
- **Queue verification**: Internal queue is private, hard to inspect directly
  - Mitigation: Infer queue behavior from processing order and return values
- **Temp directory cleanup**: Tests create directories, must cleanup
  - Mitigation: Use afterEach() with rmSync(recursive: true, force: true)

---

**END OF PRP**
