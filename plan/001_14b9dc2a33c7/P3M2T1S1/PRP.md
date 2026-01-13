# Product Requirement Prompt: P3.M2.T1.S1 - Implement Task Iteration Logic

## Goal

**Feature Goal**: Implement a `TaskOrchestrator` class that provides recursive depth-first traversal (DFS) of the task backlog hierarchy (Phase → Milestone → Task → Subtask), delegating execution to type-specific handlers for each hierarchy level.

**Deliverable**: TypeScript class `TaskOrchestrator` at `src/core/task-orchestrator.ts` with `processNextItem()`, `executePhase()`, `executeMilestone()`, `executeTask()`, and `executeSubtask()` methods; integrates with existing `task-utils.ts` functions and `SessionManager`.

**Success Definition**:

- `TaskOrchestrator` class successfully processes backlog items in DFS pre-order traversal
- `processNextItem()` returns `true` when item processed, `false` when backlog complete
- `executePhase()`, `executeMilestone()`, `executeTask()` recursively iterate child items
- `executeSubtask()` is the main execution unit (PRP generation + Coder agent execution)
- All methods use existing `task-utils.ts` functions (`getNextPendingItem()`, `updateItemStatus()`, `findItem()`)
- Full test coverage using Vitest with mocked SessionManager and agents

## User Persona

**Target User**: PRP Pipeline developers implementing the Task Execution Engine (P3.M2.T1), which will be consumed by the Pipeline Controller (P3.M4.T1).

**Use Case**: The Pipeline Controller needs a Task Orchestrator to:

1. Process the task backlog recursively through the hierarchy
2. Determine the next pending item using DFS pre-order traversal
3. Delegate execution based on item type (Phase/Milestone/Task/Subtask)
4. Update item status through SessionManager for persistence

**User Journey**:

```
Pipeline Controller
    ↓
Create TaskOrchestrator with SessionManager
    ↓
Call processNextItem() → Get next pending item via getNextPendingItem()
    ↓
    ├─ Returns true → Item processed → Update status → Loop continues
    ├─ Returns false → No more items → Pipeline complete
    └─ Error → Update status to 'Failed' → Pipeline aborts
    ↓
Hierarchical execution (for parent items):
    ↓
    ├─ executePhase() → Set status to 'Implementing' → Iterate milestones
    ├─ executeMilestone() → Set status to 'Implementing' → Iterate tasks
    └─ executeTask() → Set status to 'Implementing' → Iterate subtasks
    ↓
executeSubtask() → Main execution unit → Generate PRP → Run Coder agent
```

**Pain Points Addressed**:

- **No task iteration logic**: Current codebase has task-utils for hierarchy navigation but no execution orchestrator
- **Manual backlog processing**: Developers would need to manually implement DFS traversal and delegation
- **No separation of concerns**: Execution logic mixed with traversal logic in monolithic functions
- **No extensible pattern**: Adding new hierarchy types requires changing core traversal logic

## Why

- **Second of Four Core Processing Engines**: Task Orchestrator is the "JSON backlog management, dependency resolution, status tracking" engine (system_context.md:46-50)
- **Enables PRP Pipeline Execution**: Without TaskOrchestrator, the pipeline cannot process the task backlog automatically
- **Provides Clear Extension Point**: Subtask execution (executeSubtask) will be enhanced in P3.M3.T1 with PRP Generation + Execution runtime
- **Follows Established Patterns**: Uses DFS pre-order traversal already implemented in `task-utils.ts:getNextPendingItem()`
- **Type Safety**: Discriminated union patterns enable type-specific execution without runtime type checking overhead

## What

Implement a `TaskOrchestrator` class that provides recursive DFS traversal of the task backlog with type-specific execution delegation:

### Class Properties (Constructor-Initialized)

| Property         | Type             | Description                                      |
| ---------------- | ---------------- | ------------------------------------------------ |
| `sessionManager` | `SessionManager` | Session state manager for persistence            |
| `backlog`        | `Backlog`        | Current task registry (read from SessionManager) |

### Public Methods

| Method             | Signature                               | Description                                                      |
| ------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| `constructor`      | `(sessionManager: SessionManager)`      | Stores SessionManager reference, initializes backlog from state  |
| `processNextItem`  | `(): Promise<boolean>`                  | Get next pending item, delegate to handler, return true/false    |
| `executePhase`     | `(phase: Phase): Promise<void>`         | Set status to Implementing, iterate milestones recursively       |
| `executeMilestone` | `(milestone: Milestone): Promise<void>` | Set status to Implementing, iterate tasks recursively            |
| `executeTask`      | `(task: Task): Promise<void>`           | Set status to Implementing, iterate subtasks recursively         |
| `executeSubtask`   | `(subtask: Subtask): Promise<void>`     | Main execution unit (placeholder for PRP generation in P3.M3.T1) |

### Private/Protected Methods

| Method           | Signature                                        | Description                                             |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `refreshBacklog` | `(): Promise<void>`                              | Reload backlog from SessionManager after status updates |
| `delegateByType` | `(item: HierarchyItem): Promise<void>`           | Type-switch dispatch to appropriate execute\* method    |
| `updateStatus`   | `(id: string, status: Status): Promise<Backlog>` | Wrapper for SessionManager.updateItemStatus() + refresh |

### Success Criteria

- [ ] `TaskOrchestrator` class defined at `src/core/task-orchestrator.ts` with JSDoc module documentation
- [ ] Constructor stores SessionManager reference and initial backlog from session state
- [ ] `processNextItem()` calls `getNextPendingItem()` from task-utils
- [ ] `processNextItem()` returns `true` if item found and processed, `false` if no items pending
- [ ] `processNextItem()` calls `delegateByType()` to execute the appropriate handler
- [ ] `executePhase()` sets phase status to 'Implementing', iterates milestones via `processNextItem()`
- [ ] `executeMilestone()` sets milestone status to 'Implementing', iterates tasks via `processNextItem()`
- [ ] `executeTask()` sets task status to 'Implementing', iterates subtasks via `processNextItem()`
- [ ] `executeSubtask()` sets subtask status to 'Implementing' (placeholder for actual execution)
- [ ] `delegateByType()` uses discriminated union (`item.type`) for type narrowing and dispatch
- [ ] `refreshBacklog()` reloads taskRegistry from SessionManager after status updates
- [ ] `updateStatus()` wraps SessionManager.updateItemStatus() and triggers backlog refresh
- [ ] All methods use `readonly` properties for immutability where appropriate
- [ ] Comprehensive test coverage with Vitest (100% line coverage)

## All Needed Context

### Context Completeness Check

✓ **"No Prior Knowledge" test**: A developer unfamiliar with this codebase can implement TaskOrchestrator using:

- Existing `task-utils.ts` functions (getNextPendingItem, updateItemStatus, findItem)
- Existing `SessionManager` class for state persistence
- Existing models from `src/core/models.ts` (Backlog, Phase, Milestone, Task, Subtask, HierarchyItem, Status)
- Agent patterns from `src/agents/agent-factory.ts` (for future executeSubtask enhancement)
- Test patterns from `tests/unit/core/session-manager.test.ts` (mocking, factory functions)

### Documentation & References

```yaml
# CRITICAL: Must read before implementing
- file: src/utils/task-utils.ts
  why: Contains all hierarchy navigation and manipulation functions
  pattern: getNextPendingItem() for DFS traversal, updateItemStatus() for immutable updates, findItem() for lookup
  gotcha: All functions are pure (immutable) - return new Backlog, don't mutate input
  section: Lines 1-365 (complete file)

- file: src/core/session-manager.ts
  why: Provides session state persistence and backlog access
  pattern: updateItemStatus() for persistent status changes, loadSession() for state access
  gotcha: Always call refreshBacklog() after updateItemStatus() to get latest state
  section: Lines 1-835 (complete file, focus on updateItemStatus method)

- file: src/core/models.ts
  why: HierarchyItem discriminated union, Phase/Milestone/Task/Subtask interfaces, Status type
  pattern: Use 'type' field for discriminated union narrowing in delegateByType()
  section: Lines 1-500 (hierarchy type definitions)

- file: src/agents/agent-factory.ts
  why: Agent creation patterns for future executeSubtask() enhancement (P3.M3.T1)
  pattern: createCoderAgent() for subtask execution, async agent.prompt() calls
  gotcha: Environment must be configured before agent creation
  section: Lines 1-280 (agent factory patterns)

- file: tests/unit/utils/task-utils.test.ts
  why: Test patterns for hierarchy traversal and status updates
  pattern: Factory functions for test data (createTestSubtask, createTestBacklog), JSON comparison for immutability
  section: Lines 1-400 (complete test file)

- file: tests/unit/core/session-manager.test.ts
  why: Test patterns for SessionManager mocking and async testing
  pattern: vi.mock() for session-utils, expect().rejects.toThrow() for error tests
  section: Lines 1-500 (complete test file)

- docfile: plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Task Orchestrator's role in the Four Core Processing Engines
  section: Lines 46-50 (Task Orchestrator responsibilities), Lines 115-125 (DFS Traversal Order)

- docfile: plan/001_14b9dc2a33c7/P3M2T1S1/research/task_orchestration_patterns.md
  why: External research on orchestration patterns (Command, Strategy, Template Method)
  section: Design Patterns section (Lines 70-250)

- docfile: plan/001_14b9dc2a33c7/P3M2T1S1/research/typescript_recursion_patterns.md
  why: TypeScript async/await and recursive function best practices
  section: Recursive Function Patterns (Lines 50-150), Discriminated Union Type Narrowing (Lines 200-280)

# EXISTING CODEBASE CONVENTIONS
- file: src/utils/task-utils.ts
  why: Pure function pattern for hierarchy operations
  pattern: All functions accept Backlog as first parameter, return updated Backlog for mutations
  gotcha: Never mutate input - always create new objects with spread operators

- file: src/core/models.ts
  why: Type safety patterns for discriminated unions
  pattern: Each hierarchy level has 'type' field for runtime type narrowing
  gotcha: Use 'item.type === "Subtask"' for type guards, not instanceof

# TYPESCRIPT BEST PRACTICES (from codebase analysis)
- pattern: Use discriminated unions (type field) for runtime type narrowing instead of type assertions
- pattern: Use readonly for all class properties that should not be reassigned
- pattern: Async methods should return Promise<T> with explicit type annotations
- pattern: Recursive functions should have base case check at start (return if no more items)
- pattern: Use switch statement on discriminated union for clean type-specific dispatch
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── package.json                     # Project dependencies (vitest, zod, typescript, groundswell)
├── tsconfig.json                    # TypeScript compiler configuration
├── vitest.config.ts                 # Vitest test configuration (100% coverage threshold)
├── PRD.md                           # Product Requirements Document
├── plan/001_14b9dc2a33c7/
│   ├── tasks.json                   # Task hierarchy (Backlog) managed by SessionManager
│   ├── prd_snapshot.md              # PRD content snapshot
│   ├── architecture/                # Architectural research
│   └── P3M2T1S1/                    # This subtask directory
│       └── PRP.md                   # This document
├── src/
│   ├── core/
│   │   ├── models.ts                # Backlog, Phase, Milestone, Task, Subtask, HierarchyItem, Status
│   │   ├── session-manager.ts       # SessionManager class (completed P3.M1.T1)
│   │   ├── session-utils.ts         # hashPRD, createSessionDirectory, readTasksJSON
│   │   └── prd-differ.ts            # PRD diffing utilities
│   ├── utils/
│   │   └── task-utils.ts            # findItem, getNextPendingItem, updateItemStatus
│   ├── agents/
│   │   ├── agent-factory.ts         # createArchitectAgent, createCoderAgent
│   │   └── prompts.ts               # System prompts for agents
│   └── index.ts                     # Main entry point
└── tests/
    ├── unit/
    │   ├── core/
    │   │   ├── session-manager.test.ts    # SessionManager tests
    │   │   ├── models.test.ts             # Model validation tests
    │   │   └── session-utils.test.ts      # Session utility tests
    │   └── utils/
    │       └── task-utils.test.ts         # Task utility tests (factory patterns, DFS tests)
    └── fixtures/
        └── mock-backlog-data.ts           # Mock backlog for testing
```

### Desired Codebase Tree (After Implementation)

```bash
/home/dustin/projects/hacky-hack
├── src/
│   └── core/
│       ├── models.ts                    # Existing: hierarchy types
│       ├── session-manager.ts           # Existing: session state management
│       ├── session-utils.ts             # Existing: file utilities
│       └── task-orchestrator.ts         # NEW: TaskOrchestrator class (this PRP)
└── tests/
    └── unit/
        └── core/
            ├── session-manager.test.ts    # Existing: session tests
            ├── models.test.ts             # Existing: model tests
            └── task-orchestrator.test.ts  # NEW: TaskOrchestrator tests (this PRP)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: TypeScript/Codebase Constraints

// 1. Discriminated Union Type Narrowing
// Each hierarchy item has a 'type' field for runtime type checking
// Use 'type' field, NOT instanceof or type assertions
type HierarchyItem = Phase | Milestone | Task | Subtask;

// CORRECT: Type narrowing using discriminated union
function delegateByType(item: HierarchyItem): Promise<void> {
  switch (item.type) {
    case 'Phase':
      return this.executePhase(item); // TypeScript knows item is Phase here
    case 'Milestone':
      return this.executeMilestone(item); // TypeScript knows item is Milestone here
    case 'Task':
      return this.executeTask(item); // TypeScript knows item is Task here
    case 'Subtask':
      return this.executeSubtask(item); // TypeScript knows item is Subtask here
  }
}

// WRONG: Don't use type assertions or instanceof
// if (item instanceof Phase) { ... } // ERROR: Phase is interface, not class
// if ((item as Phase).milestones) { ... } // AVOID: Type assertion unsafe

// 2. Immutability Pattern
// All hierarchy interfaces use 'readonly' properties
// task-utils functions return NEW Backlog, they don't mutate input
const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Complete');
// 'backlog' is unchanged, 'updated' is the new backlog

// 3. SessionManager.updateItemStatus() is async
// Must await the call, then refresh backlog from session
await this.sessionManager.updateItemStatus(itemId, 'Implementing');
await this.refreshBacklog(); // Reload to get latest state

// 4. getNextPendingItem() Returns Null When Complete
// Always check for null before processing
const nextItem = getNextPendingItem(this.backlog);
if (!nextItem) {
  return false; // No more items to process
}

// 5. DFS Pre-Order Traversal Order
// Phase → Milestone → Task → Subtask (parent before children)
// getNextPendingItem() follows this order automatically
// Do NOT implement custom traversal logic - use existing utility

// 6. Status State Machine
// Valid transitions: Planned → Researching → Implementing → Complete/Failed
// Don't skip statuses - follow the state machine
// TaskOrchestrator uses 'Implementing' status (execution phase)
// 'Researching' status will be used by PRP Generator (P3.M3.T1)

// 7. Placeholder Implementation for executeSubtask()
// This PRP only implements iteration logic, not actual execution
// executeSubtask() should log the action and set status to 'Complete' (placeholder)
// Actual PRP generation + Coder agent execution comes in P3.M3.T1

// 8. Recursive vs Iterative Approach
// While research showed both approaches work, use RECURSIVE for consistency
// The hierarchy depth is limited (4 levels: Phase → Milestone → Task → Subtask)
// Stack overflow is not a concern with this depth limit
```

## Implementation Blueprint

### Data Models and Structure

The TaskOrchestrator uses existing models from `src/core/models.ts`:

```typescript
// FROM src/core/models.ts - Use these types directly:

// Union type for any item in the hierarchy
type HierarchyItem = Phase | Milestone | Task | Subtask;

// Status enum (state machine)
type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// Hierarchy level interfaces (all use readonly properties)
interface Subtask {
  readonly id: string;
  readonly type: 'Subtask';
  readonly title: string;
  readonly status: Status;
  readonly story_points: number;
  readonly dependencies: string[];
  readonly context_scope: string;
}

interface Task {
  readonly id: string;
  readonly type: 'Task';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly subtasks: Subtask[];
}

interface Milestone {
  readonly id: string;
  readonly type: 'Milestone';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly tasks: Task[];
}

interface Phase {
  readonly id: string;
  readonly type: 'Phase';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly milestones: Milestone[];
}

interface Backlog {
  readonly backlog: Phase[];
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/core/task-orchestrator.ts
  - IMPLEMENT: TaskOrchestrator class with constructor and properties
  - FOLLOW pattern: src/core/session-manager.ts (class structure, constructor pattern)
  - NAMING: PascalCase class name, camelCase methods
  - PROPERTIES: readonly sessionManager (SessionManager), private backlog (Backlog)
  - CONSTRUCTOR: Accept SessionManager, load initial backlog from session state
  - PLACEMENT: src/core/ directory alongside models.ts and session-manager.ts

Task 2: IMPLEMENT refreshBacklog() helper method
  - IMPLEMENT: async refreshBacklog(): Promise<void>
  - LOGIC: Reload taskRegistry from SessionManager.currentSession
  - LOGIC: Update this.backlog with fresh data
  - ERROR HANDLING: Throw error if currentSession is null
  - DEPENDENCIES: Requires constructor to have sessionManager
  - PLACEMENT: Private async method in TaskOrchestrator class

Task 3: IMPLEMENT updateStatus() helper method
  - IMPLEMENT: async updateStatus(id: string, status: Status): Promise<void>
  - LOGIC: Call sessionManager.updateItemStatus(id, status)
  - LOGIC: Call refreshBacklog() to reload latest state
  - ERROR HANDLING: Propagate SessionFileError from SessionManager
  - DEPENDENCIES: Requires refreshBacklog() from Task 2
  - PLACEMENT: Private async method in TaskOrchestrator class

Task 4: IMPLEMENT delegateByType() dispatcher method
  - IMPLEMENT: async delegateByType(item: HierarchyItem): Promise<void>
  - LOGIC: Use switch statement on item.type for discriminated union narrowing
  - LOGIC: Call appropriate execute* method based on type
  - PATTERN: Follow TypeScript discriminated union best practices (see Implementation Patterns)
  - DEPENDENCIES: Requires execute* methods to be defined (Tasks 5-8)
  - PLACEMENT: Private async method in TaskOrchestrator class

Task 5: IMPLEMENT executePhase() method
  - IMPLEMENT: async executePhase(phase: Phase): Promise<void>
  - LOGIC: Call updateStatus(phase.id, 'Implementing')
  - LOGIC: Iterate through phase.milestones (NOT recursive - just setup)
  - NOTE: Actual iteration happens through processNextItem() loop
  - PATTERN: Parent item sets status, defers child processing to caller
  - DEPENDENCIES: Requires updateStatus() from Task 3
  - PLACEMENT: Public async method in TaskOrchestrator class

Task 6: IMPLEMENT executeMilestone() method
  - IMPLEMENT: async executeMilestone(milestone: Milestone): Promise<void>
  - LOGIC: Call updateStatus(milestone.id, 'Implementing')
  - LOGIC: Iterate through milestone.tasks (NOT recursive - just setup)
  - NOTE: Actual iteration happens through processNextItem() loop
  - PATTERN: Parent item sets status, defers child processing to caller
  - DEPENDENCIES: Requires updateStatus() from Task 3
  - PLACEMENT: Public async method in TaskOrchestrator class

Task 7: IMPLEMENT executeTask() method
  - IMPLEMENT: async executeTask(task: Task): Promise<void>
  - LOGIC: Call updateStatus(task.id, 'Implementing')
  - LOGIC: Iterate through task.subtasks (NOT recursive - just setup)
  - NOTE: Actual iteration happens through processNextItem() loop
  - PATTERN: Parent item sets status, defers child processing to caller
  - DEPENDENCIES: Requires updateStatus() from Task 3
  - PLACEMENT: Public async method in TaskOrchestrator class

Task 8: IMPLEMENT executeSubtask() method (PLACEHOLDER)
  - IMPLEMENT: async executeSubtask(subtask: Subtask): Promise<void>
  - LOGIC: Call updateStatus(subtask.id, 'Implementing')
  - LOGIC: Log execution (console.log or similar) - PLACEHOLDER
  - LOGIC: Call updateStatus(subtask.id, 'Complete') - PLACEHOLDER
  - NOTE: In P3.M3.T1, this will generate PRP and run Coder agent
  - DEPENDENCIES: Requires updateStatus() from Task 3
  - PLACEMENT: Public async method in TaskOrchestrator class

Task 9: IMPLEMENT processNextItem() main loop method
  - IMPLEMENT: async processNextItem(): Promise<boolean>
  - LOGIC: Call getNextPendingItem(this.backlog) from task-utils
  - LOGIC: If result is null, return false (backlog complete)
  - LOGIC: If result is HierarchyItem, call delegateByType(item)
  - LOGIC: After delegation, call refreshBacklog() to get latest state
  - LOGIC: Return true (item processed)
  - DEPENDENCIES: Requires delegateByType() from Task 4, refreshBacklog() from Task 2
  - PLACEMENT: Public async method in TaskOrchestrator class

Task 10: CREATE tests/unit/core/task-orchestrator.test.ts
  - IMPLEMENT: Comprehensive unit tests for all TaskOrchestrator methods
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (mocking, factory functions)
  - NAMING: test files end with .test.ts, test functions use describe/it pattern
  - MOCK: vi.mock('../src/core/session-manager.js') for SessionManager
  - MOCK: vi.mock('../src/utils/task-utils.js') for task-utils functions
  - COVERAGE: Constructor initialization and backlog loading
  - COVERAGE: refreshBacklog() method (reload from session state)
  - COVERAGE: updateStatus() method (SessionManager integration + refresh)
  - COVERAGE: delegateByType() method (all four item types)
  - COVERAGE: executePhase(), executeMilestone(), executeTask() methods (status updates)
  - COVERAGE: executeSubtask() method (placeholder execution)
  - COVERAGE: processNextItem() method (DFS traversal, return true/false)
  - COVERAGE: Error handling (null session, missing items, failed updates)
  - COVERAGE: Integration with task-utils (getNextPendingItem)
  - PLACEMENT: tests/unit/core/ directory

Task 11: UPDATE src/core/index.ts (if it exists)
  - EXPORT: TaskOrchestrator class from core module
  - PATTERN: export { TaskOrchestrator } from './task-orchestrator.js'
  - DEPENDENCIES: Requires Task 1 completion
  - PLACEMENT: Add export to src/core/index.ts or create index.ts if not exists
```

### Implementation Patterns & Key Details

````typescript
// ===== CLASS STRUCTURE PATTERN =====
// Follow src/core/session-manager.ts pattern for class structure

/**
 * Task Orchestrator for PRP Pipeline backlog processing
 *
 * @module core/task-orchestrator
 *
 * @remarks
 * Provides recursive depth-first traversal (DFS) of the task backlog hierarchy
 * with type-specific execution delegation for each hierarchy level.
 *
 * Uses existing task-utils.ts functions for hierarchy navigation and manipulation.
 * Integrates with SessionManager for persistent state management.
 *
 * Implements the "Task Orchestrator" of the Four Core Processing Engines.
 *
 * @example
 * ```typescript
 * import { TaskOrchestrator } from './core/task-orchestrator.js';
 *
 * const orchestrator = new TaskOrchestrator(sessionManager);
 * while (await orchestrator.processNextItem()) {
 *   // Continue processing until backlog complete
 * }
 * ```
 */
export class TaskOrchestrator {
  // PATTERN: readonly property prevents reassignment after construction
  readonly sessionManager: SessionManager;

  // PATTERN: Private property for internal state (use # for ES2022 private)
  #backlog: Backlog;

  /**
   * Creates a new TaskOrchestrator instance
   *
   * @param sessionManager - Session state manager for persistence
   * @throws {Error} If sessionManager.currentSession is null
   */
  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;

    // GOTCHA: Must load initial backlog from session state
    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot create TaskOrchestrator: no active session');
    }

    this.#backlog = currentSession.taskRegistry;
  }

  // PATTERN: Getter for read-only access to internal state (optional, for testing)
  get backlog(): Backlog {
    return this.#backlog;
  }
}

// ===== BACKLOG REFRESH PATTERN =====
// Reload backlog from SessionManager after status updates

async refreshBacklog(): Promise<void> {
  const currentSession = this.sessionManager.currentSession;
  if (!currentSession) {
    throw new Error('Cannot refresh backlog: no active session');
  }

  // GOTCHA: Reload from session state, not use cached value
  this.#backlog = currentSession.taskRegistry;
}

// ===== STATUS UPDATE PATTERN =====
// Wrap SessionManager.updateItemStatus() with automatic refresh

async updateStatus(id: string, status: Status): Promise<void> {
  // 1. Persist status change through SessionManager
  await this.sessionManager.updateItemStatus(id, status);

  // 2. Reload backlog to get latest state
  await this.refreshBacklog();
}

// ===== DISCRIMINATED UNION DISPATCH PATTERN =====
// Use TypeScript discriminated union for type-safe item handling

async delegateByType(item: HierarchyItem): Promise<void> {
  // PATTERN: Switch on 'type' field for discriminated union narrowing
  // TypeScript automatically narrows type in each case branch
  switch (item.type) {
    case 'Phase':
      // TypeScript knows 'item' is Phase here (has milestones property)
      return this.executePhase(item);

    case 'Milestone':
      // TypeScript knows 'item' is Milestone here (has tasks property)
      return this.executeMilestone(item);

    case 'Task':
      // TypeScript knows 'item' is Task here (has subtasks property)
      return this.executeTask(item);

    case 'Subtask':
      // TypeScript knows 'item' is Subtask here (has dependencies property)
      return this.executeSubtask(item);

    default:
      // PATTERN: Exhaustive check - TypeScript errors if missing case
      const _exhaustive: never = item;
      throw new Error(`Unknown hierarchy item type: ${_exhaustive}`);
  }
}

// ===== PARENT ITEM EXECUTION PATTERN =====
// Parent items set status, delegate child processing to caller

async executePhase(phase: Phase): Promise<void> {
  // 1. Set status to Implementing
  await this.updateStatus(phase.id, 'Implementing');

  // NOTE: Child iteration happens through processNextItem() loop
  // The Pipeline Controller will call processNextItem() repeatedly
  // which will find the next pending milestone within this phase

  // PATTERN: Log for visibility (especially for placeholder implementation)
  console.log(`[TaskOrchestrator] Executing Phase: ${phase.id} - ${phase.title}`);
}

async executeMilestone(milestone: Milestone): Promise<void> {
  await this.updateStatus(milestone.id, 'Implementing');
  console.log(`[TaskOrchestrator] Executing Milestone: ${milestone.id} - ${milestone.title}`);
}

async executeTask(task: Task): Promise<void> {
  await this.updateStatus(task.id, 'Implementing');
  console.log(`[TaskOrchestrator] Executing Task: ${task.id} - ${task.title}`);
}

// ===== SUBTASK EXECUTION PATTERN (PLACEHOLDER) =====
// Main execution unit - will be enhanced in P3.M3.T1

async executeSubtask(subtask: Subtask): Promise<void> {
  console.log(`[TaskOrchestrator] Executing Subtask: ${subtask.id} - ${subtask.title}`);

  // PLACEHOLDER: Set status to Implementing
  await this.updateStatus(subtask.id, 'Implementing');

  // PLACEHOLDER: Log execution (PRP generation + Coder agent execution in P3.M3.T1)
  console.log(`[TaskOrchestrator] PLACEHOLDER: Would generate PRP and run Coder agent`);
  console.log(`[TaskOrchestrator] Context scope: ${subtask.context_scope}`);

  // PLACEHOLDER: Set status to Complete
  // In P3.M3.T1, this will depend on Coder agent success/failure
  await this.updateStatus(subtask.id, 'Complete');
}

// ===== MAIN LOOP PATTERN =====
// Process next pending item using DFS pre-order traversal

async processNextItem(): Promise<boolean> {
  // 1. Get next pending item using DFS pre-order traversal
  const nextItem = getNextPendingItem(this.#backlog);

  // 2. Base case: no more items to process
  if (nextItem === null) {
    console.log('[TaskOrchestrator] Backlog processing complete');
    return false;
  }

  // 3. Log item being processed
  console.log(`[TaskOrchestrator] Processing: ${nextItem.id} (${nextItem.type})`);

  // 4. Delegate to type-specific handler
  await this.delegateByType(nextItem);

  // 5. Refresh backlog after status update
  await this.refreshBacklog();

  // 6. Indicate item was processed (more items may remain)
  return true;
}

// ===== USAGE EXAMPLE =====
// How Pipeline Controller will use TaskOrchestrator

/*
import { SessionManager } from './core/session-manager.js';
import { TaskOrchestrator } from './core/task-orchestrator.js';

// 1. Initialize session
const sessionManager = new SessionManager('./PRD.md');
await sessionManager.initialize();

// 2. Create orchestrator
const orchestrator = new TaskOrchestrator(sessionManager);

// 3. Process all items
let hasMore = true;
while (hasMore) {
  hasMore = await orchestrator.processNextItem();
  // Each call processes ONE item in DFS pre-order
}

// 4. Verify completion
console.log('Pipeline complete!');
*/
````

### Integration Points

```yaml
SESSION_MANAGER:
  - import: SessionManager from './session-manager.js'
  - usage: Access currentSession.taskRegistry for backlog
  - usage: Call updateItemStatus() for persistent status changes

TASK_UTILS:
  - import: getNextPendingItem, updateItemStatus, findItem from '../utils/task-utils.js'
  - usage: getNextPendingItem() for DFS traversal
  - usage: updateItemStatus() is wrapped by TaskOrchestrator.updateStatus()

MODELS:
  - import: Backlog, Phase, Milestone, Task, Subtask, HierarchyItem, Status from './models.js'
  - usage: Use these types for all method signatures and internal state
  - usage: Use discriminated union ('type' field) for runtime type narrowing

AGENT_FACTORY:
  - import: createCoderAgent from '../agents/agent-factory.js'
  - usage: Will be used in executeSubtask() during P3.M3.T1 implementation
  - note: Not used in this PRP (placeholder implementation)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint              # ESLint: Check code style and catch errors
npm run format            # Prettier: Format code consistently

# TypeScript compilation check
npx tsc --noEmit          # Type check without emitting files

# Project-wide validation
npm run lint
npx tsc --noEmit
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test TaskOrchestrator class
npm test -- tests/unit/core/task-orchestrator.test.ts

# Run with coverage
npm test -- --coverage tests/unit/core/task-orchestrator.test.ts

# Full core module test suite
npm test -- tests/unit/core/

# Coverage validation
npm test -- --coverage --reporter=term-missing

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Target: 100% line coverage for task-orchestrator.ts
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test - process a real backlog
# Create test integration script
cat > tests/manual/task-orchestrator-integration.test.ts << 'EOF'
import { SessionManager } from '../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';

const manager = new SessionManager('./PRD.md');
await manager.initialize();

const orchestrator = new TaskOrchestrator(manager);

// Process first 5 items
let count = 0;
while (count < 5 && await orchestrator.processNextItem()) {
  count++;
  console.log(`Processed ${count} items`);
}

console.log(`Final backlog status:`, manager.currentSession.taskRegistry);
EOF

# Run integration test
npm test -- tests/manual/task-orchestrator-integration.test.ts

# Verify status changes in tasks.json
cat plan/001_14b9dc2a33c7/tasks.json | jq '.backlog[0].status'

# Expected: Items processed in DFS pre-order, status updates persisted.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Domain-Specific: Task Orchestrator DFS Validation

# 1. Test DFS pre-order traversal order
# Verify items are processed: Phase → Milestone → Task → Subtask
# Use debug logging to confirm order

# 2. Test discriminated union dispatch
# Verify all four item types (Phase, Milestone, Task, Subtask) are handled

# 3. Test status persistence across refreshBacklog()
# Modify status, call refreshBacklog(), verify change persists

# 4. Test backlog completion detection
# Process all items, verify processNextItem() returns false

# 5. Test error scenarios
# - Initialize TaskOrchestrator with null session (should throw)
# - Process item after session closed (should error)
# - Update status for non-existent item (should error)

# Manual validation checklist:
echo "Task Orchestrator Validation Checklist"
echo "======================================"
echo "[] Constructor loads backlog from session state"
echo "[] processNextItem() returns true when items pending"
echo "[] processNextItem() returns false when backlog complete"
echo "[] executePhase() sets status to Implementing"
echo "[] executeMilestone() sets status to Implementing"
echo "[] executeTask() sets status to Implementing"
echo "[] executeSubtask() sets status to Implementing then Complete"
echo "[] delegateByType() correctly dispatches all four item types"
echo "[] refreshBacklog() reloads from session state"
echo "[] updateStatus() persists and refreshes"
echo "[] DFS pre-order traversal order is correct"
echo "[] Status changes persist to tasks.json"
echo "[] All discriminated union type narrowing works"
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/task-orchestrator.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npm run format`
- [ ] 100% line coverage achieved

### Feature Validation

- [ ] Constructor accepts SessionManager and loads backlog from session state
- [ ] Constructor throws error if sessionManager.currentSession is null
- [ ] `sessionManager` property is readonly (cannot be reassigned)
- [ ] `backlog` property is accessible but not externally mutable
- [ ] `processNextItem()` calls `getNextPendingItem()` from task-utils
- [ ] `processNextItem()` returns `true` when item found and processed
- [ ] `processNextItem()` returns `false` when backlog complete (no items pending)
- [ ] `executePhase()` sets phase status to 'Implementing' via `updateStatus()`
- [ ] `executeMilestone()` sets milestone status to 'Implementing' via `updateStatus()`
- [ ] `executeTask()` sets task status to 'Implementing' via `updateStatus()`
- [ ] `executeSubtask()` sets subtask status to 'Implementing' then 'Complete' (placeholder)
- [ ] `delegateByType()` uses discriminated union (`item.type`) for type narrowing
- [ ] `delegateByType()` correctly dispatches all four item types
- [ ] `refreshBacklog()` reloads taskRegistry from SessionManager
- [ ] `updateStatus()` calls SessionManager.updateItemStatus() then refreshBacklog()
- [ ] Items processed in DFS pre-order traversal order
- [ ] Status changes persist to tasks.json via SessionManager
- [ ] All methods use `readonly` properties for immutability where appropriate

### Code Quality Validation

- [ ] Follows existing codebase patterns (SessionManager class structure)
- [ ] File placement matches desired codebase tree (src/core/task-orchestrator.ts)
- [ ] JSDoc comments present for class, constructor, and all public methods
- [ ] Uses discriminated union for type narrowing (not type assertions)
- [ ] Uses existing task-utils functions (no duplicate traversal logic)
- [ ] Uses existing models from src/core/models.ts (no duplicate types)
- [ ] Async methods return `Promise<T>` with explicit type annotations
- [ ] Error messages are descriptive and include context

### Documentation & Deployment

- [ ] Module-level JSDoc explains TaskOrchestrator purpose and usage
- [ ] Method JSDoc includes @param, @returns, @throws tags
- [ ] Example code in JSDoc demonstrates typical usage
- [ ] Code is self-documenting with clear variable and method names
- [ ] Exported from src/core/index.ts (or appropriate index file)

---

## Anti-Patterns to Avoid

- ❌ **Don't implement custom DFS traversal**: Use existing `getNextPendingItem()` from task-utils - don't reinvent the wheel
- ❌ **Don't use type assertions**: Use discriminated union (`item.type`) for type narrowing, not `(item as Phase)`
- ❌ **Don't mutate hierarchy items directly**: Use `updateItemStatus()` from task-utils - it returns new Backlog
- ❌ **Don't skip refreshBacklog()**: Always reload backlog after status updates - cached data is stale
- ❌ **Don't implement actual subtask execution**: executeSubtask() is a placeholder - PRP generation comes in P3.M3.T1
- ❌ **Don't use instanceof for type checking**: Hierarchy items are interfaces, not classes - use discriminated union
- ❌ **Don't process children recursively in executePhase/Milestone/Task**: Parent items set status only - processNextItem() handles child iteration
- ❌ **Don't ignore discriminated union exhaustiveness**: Use `default: never` case to catch missing types at compile time
- ❌ **Don't forget to handle null session**: Constructor must check currentSession exists
- ❌ **Don't write tests without mocking**: Mock SessionManager and task-utils in unit tests
