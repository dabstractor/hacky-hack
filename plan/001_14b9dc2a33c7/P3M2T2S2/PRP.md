# Product Requirement Prompt (PRP): P3.M2.T2.S2 - Integrate Scope with TaskOrchestrator

---

## Goal

**Feature Goal**: Integrate scope-based execution into TaskOrchestrator, enabling selective execution of task subsets at any hierarchy level (phase, milestone, task, subtask, or all) with mid-execution reconfiguration capability.

**Deliverable**: Modified `src/core/task-orchestrator.ts` with:

1. Optional `scope` parameter in constructor
2. New `executionQueue` property for scoped execution
3. Modified `processNextItem()` to pull from queue instead of DFS traversal
4. New `setScope()` method for mid-execution scope reconfiguration

**Success Definition**:

- Constructor accepts optional `Scope` parameter to limit execution scope
- `executionQueue` is populated from scope resolution (defaults to all items if no scope)
- `processNextItem()` pulls from `executionQueue` instead of calling `getNextPendingItem()`
- `setScope()` method reconfigures queue mid-execution with logging
- All existing tests continue to pass
- New tests validate scope-based execution scenarios
- Full type safety with TypeScript
- No regressions in existing functionality

## User Persona

**Target User**: PRP Pipeline developers implementing scope-based execution, specifically the Task Execution Engine that needs to execute targeted subsets of the backlog.

**Use Case**: The TaskOrchestrator needs to support executing tasks at different scopes so that:

1. Users can execute a single subtask: `--scope P1.M1.T1.S1`
2. Users can execute all tasks in a milestone: `--scope P1.M1`
3. Users can execute all pending work: `--scope all`
4. Pipeline can resume execution from a specific hierarchy level after interruption
5. Delta sessions can execute only changed items

**User Journey**:

```
User provides CLI argument: --scope P1.M1
    ↓
Scope resolver parses string and resolves to HierarchyItem[]
    ↓
TaskOrchestrator constructor receives optional scope parameter
    ↓
Constructor populates executionQueue from scope resolution
    ↓
processNextItem() pulls items from executionQueue
    ↓
Execution limited to items in scope
```

**Pain Points Addressed**:

- **No subset execution**: Currently, TaskOrchestrator always executes entire backlog
- **No resume capability**: Cannot resume from specific hierarchy level after interruption
- **Inefficient development**: Must run entire backlog to test single subtask
- **No delta support**: Cannot execute only changed items in delta sessions
- **Rigid execution model**: Cannot adjust scope mid-execution

## Why

- **PRD Compliance**: Section 5.3 explicitly requires "User can execute specific scopes (--scope=milestone, --task=3)"
- **Delta Session Support**: P4.M1 (Delta Session Implementation) requires executing only changed items
- **Development Workflow**: Developers need to execute subsets during development and testing
- **Integration Point**: Consumes scope resolver from P3.M2.T2.S1
- **CLI Foundation**: P3.M4.T2 (CLI Entry Point) will pass scope to TaskOrchestrator
- **Production Pattern**: Matches industry-standard build tools (Nx, Bazel, Gradle) that support scoped execution

## What

Modify TaskOrchestrator to support scope-based execution with mid-execution reconfiguration:

### Functionality Requirements

1. **Constructor Enhancement** - Add optional scope parameter:

   ```typescript
   constructor(sessionManager: SessionManager, scope?: Scope)
   ```

2. **New Property** - `executionQueue` for scoped execution:

   ```typescript
   #executionQueue: HierarchyItem[] = []
   ```

3. **Constructor Logic** - Populate queue from scope:
   - If `scope` provided: resolve to `HierarchyItem[]` and populate queue
   - If no `scope`: resolve `'all'` scope to populate queue with all items
   - Store scope for logging and reconfiguration

4. **Modified `processNextItem()`** - Pull from queue instead of DFS:
   - Check if `executionQueue` has items
   - Shift next item from queue
   - Delegate to type handler
   - Return `false` when queue empty

5. **New `setScope()` Method** - Reconfigure queue mid-execution:
   ```typescript
   async setScope(scope: Scope): Promise<void>
   ```

   - Log scope change with old and new scope
   - Resolve new scope
   - Replace `executionQueue` with new items
   - Log new queue size

### Scope Integration Contract (from P3.M2.T2.S1)

**Previous PRP Outputs** (assume these exist as specified):

- `Scope` interface: `{ type: ScopeType, id?: string }`
- `parseScope(scopeArg: string): Scope` function
- `resolveScope(backlog: Backlog, scope: Scope): HierarchyItem[]` function

**Integration Points**:

- Import `Scope` and `resolveScope` from `scope-resolver.ts`
- Use `resolveScope()` to populate `executionQueue` in constructor
- Use `resolveScope()` to repopulate queue in `setScope()`

### Success Criteria

- [ ] Constructor accepts optional `scope?: Scope` parameter
- [ ] `executionQueue` property exists as private field
- [ ] Constructor populates queue from scope (or all if no scope)
- [ ] `processNextItem()` pulls from `executionQueue` instead of `getNextPendingItem()`
- [ ] `setScope()` method reconfigures queue mid-execution
- [ ] Scope changes are logged with old and new scope
- [ ] All existing tests pass
- [ ] New tests validate scope-based execution
- [ ] TypeScript compilation passes with no errors
- [ ] ESLint passes with no errors

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: A developer unfamiliar with this codebase can implement scope integration using:

- Exact Scope interface from P3.M2.T2.S1 PRP
- Exact resolveScope() function signature and behavior
- Current TaskOrchestrator implementation from task-orchestrator.ts
- Existing test patterns from task-orchestrator.test.ts
- Complete code examples showing the patterns to follow
- External research on queue-based scope execution patterns

### Documentation & References

```yaml
# MUST READ - Scope Resolver Contract (P3.M2.T2.S1)

- file: plan/001_14b9dc2a33c7/P3M2T2S1/PRP.md
  why: Defines Scope interface, parseScope(), and resolveScope() contract
  section: Goal (Lines 5-25), What (Lines 65-133), Implementation Blueprint (Lines 360-516)
  critical: Scope interface definition, resolveScope() return type (HierarchyItem[])
  lines: 9-14 (ScopeType, Scope interface), 90-99 (resolveScope signature), 808-835 (resolveScope implementation)

# MUST READ - Current TaskOrchestrator Implementation

- file: src/core/task-orchestrator.ts
  why: Complete implementation to modify for scope integration
  pattern: Constructor with SessionManager, processNextItem() using getNextPendingItem(), private fields with #
  gotcha: Uses async import for getNextPendingItem() to avoid circular deps
  lines: 55-78 (class definition, constructor), 538-564 (processNextItem), 85-87 (backlog getter)

# MUST READ - Test Patterns

- file: tests/unit/core/task-orchestrator.test.ts
  why: Exact test patterns to follow for new scope tests
  pattern: Setup/Execute/Verify structure, factory functions, mock patterns
  gotcha: Mock getNextPendingItem with vi.mock(), use createMockSessionManager()
  lines: 13-106 (imports, mocks, factory functions), 108-202 (constructor tests), 204-302 (executePhase tests)

# EXTERNAL RESEARCH - Scope Execution Patterns

- docfile: plan/001_14b9dc2a33c7/P3M2T2S2/research/scope_patterns.md
  why: Comprehensive research on queue-based scope execution patterns from production systems
  section: Immutable Queue with Drain-and-Refill Pattern (Lines 150-250), setScope Implementations (Lines 300-380)
  critical: Recommended pattern: Immutable Queue with Drain-and-Refill for our use case
  gotcha: Rebuilding queue is safer than in-place mutation, matches our existing patterns

- docfile: plan/001_14b9dc2a33c7/P3M2T2S2/research/typescript_patterns.md
  why: TypeScript class design patterns for optional parameters and state management
  section: Optional Constructor Parameters (Lines 20-80), State Reconfiguration Methods (Lines 150-220)
  critical: Use `??` for default values, not `||`. Keep current setStatus() pattern for setScope()
  gotcha: Private fields with `#` prefix, readonly properties for public exposure

# TASK UTILITIES - Existing Functions to Use

- file: src/utils/task-utils.ts
  why: Contains getDependencies() and other utilities
  pattern: DFS pre-order traversal, type guards, functional approach
  gotcha: Not directly used for scope integration (use resolveScope instead)

# MODELS - Type Definitions

- file: src/core/models.ts
  why: HierarchyItem types (Phase, Milestone, Task, Subtask), Backlog, Status
  pattern: All properties readonly, discriminated unions with 'type' field
  gotcha: ItemType is string union, not the item object itself
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.ts                 # Test configuration with 100% coverage
├── PRD.md                           # Product Requirements Document
├── plan/001_14b9dc2a33c7/
│   ├── tasks.json                   # Task hierarchy
│   ├── architecture/                # Architecture documentation
│   ├── P3M2T2S1/                    # Scope resolver subtask (parallel)
│   │   ├── PRP.md                   # Scope resolver contract
│   │   └── research/                # Scope resolver research
│   └── P3M2T2S2/                    # This subtask directory
│       ├── research/                # Research documents (created)
│       │   ├── scope_patterns.md
│       │   └── typescript_patterns.md
│       └── PRP.md                   # THIS FILE
├── src/
│   ├── core/
│   │   ├── models.ts                # Backlog, Phase, Milestone, Task, Subtask types
│   │   ├── session-manager.ts       # Session management
│   │   ├── task-orchestrator.ts     # TO MODIFY: Add scope support
│   │   └── scope-resolver.ts        # NEW from P3.M2.T2.S1: parseScope, resolveScope
│   └── utils/
│       └── task-utils.ts            # Hierarchy utilities
└── tests/
    └── unit/
        └── core/
            ├── task-orchestrator.test.ts    # MODIFY: Add scope tests
            └── scope-resolver.test.ts       # NEW from P3.M2.T2.S1
```

### Desired Codebase Tree with Files to be Modified

```bash
# MODIFIED FILES:

src/core/
  └── task-orchestrator.ts             # MODIFY: Add scope integration
      - MODIFY: Constructor signature - add scope?: Scope parameter
      - ADD: #scope: Scope | undefined private field
      - ADD: #executionQueue: HierarchyItem[] private field
      - MODIFY: Constructor logic - populate executionQueue from scope
      - MODIFY: processNextItem() - pull from executionQueue
      - ADD: setScope(scope: Scope): Promise<void> method
      - ADD: get executionQueue(): HierarchyItem[] getter (for testing)

tests/unit/core/
  └── task-orchestrator.test.ts        # MODIFY: Add scope tests
      - ADD: describe('constructor with scope')
      - ADD: describe('processNextItem with scope')
      - ADD: describe('setScope() method')
      - ADD: describe('executionQueue')
      - PRESERVE: All existing tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Scope interface from P3.M2.T2.S1 uses 'type' (string), not TypeScript enum
// CORRECT: { type: 'phase' | 'milestone' | 'task' | 'subtask' | 'all', id?: string }
// WRONG: { type: ScopeType.PHASE, id?: string } (not a TS enum)
// REASON: String literal unions work better with Zod and serialization

// CRITICAL: resolveScope() returns HierarchyItem[], not ItemType[]
// HierarchyItem = Phase | Milestone | Task | Subtask (the actual objects)
// ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask' (string union)
// Gotcha: Previous PRP specifies HierarchyItem[] return type

// CRITICAL: Constructor should NOT call resolveScope() directly
// CORRECT: Import resolveScope from scope-resolver.ts and call it
// WRONG: Reimplement scope resolution logic in constructor
// REASON: DRY principle - scope resolver owns that logic

// GOTCHA: processNextItem() currently uses async import for getNextPendingItem()
// This is to avoid circular dependencies between modules
// NEW: processNextItem() will NOT use getNextPendingItem() when scope is set
// Instead, it will shift items from #executionQueue

// PATTERN: Private fields use # prefix (ES2022 private class fields)
// CORRECT: #backlog, #executionQueue, #scope
// WRONG: _backlog, _executionQueue (old convention)
// REASON: # provides true privacy at runtime

// PATTERN: Use readonly for public properties that shouldn't change
// CORRECT: readonly sessionManager: SessionManager
// WRONG: sessionManager: SessionManager (allows reassignment)

// PATTERN: Optional constructor parameter with default value
// CORRECT: constructor(sm: SessionManager, scope?: Scope) { this.#scope = scope; }
// WRONG: constructor(sm: SessionManager, scope: Scope | undefined) { ... }
// REASON: `?:` is clearer for optional parameters

// GOTCHA: When no scope provided, default to 'all' scope
// CORRECT: const scopeToResolve = scope ?? { type: 'all' };
// WRONG: if (!scope) { throw new Error('Scope required'); }
// REASON: Backward compatibility - existing code doesn't pass scope

// CRITICAL: setScope() must be async (returns Promise<void>)
// CORRECT: async setScope(scope: Scope): Promise<void>
// WRONG: setScope(scope: Scope): void
// REASON: May need to await scope resolution, consistent with other methods

// PATTERN: Log state changes with [TaskOrchestrator] prefix
// CORRECT: console.log(`[TaskOrchestrator] Scope changed from ${old} to ${new}`);
// WRONG: console.log('Scope changed');
// REASON: Structured logging with context

// PATTERN: Use existing setStatus() method for status updates
// Don't modify setStatus() - it already handles logging and persistence
// setScope() only changes the queue, not item statuses

// TESTING: Mock getNextPendingItem even though it won't be used
// The existing tests mock it, and we should preserve that pattern
// New tests will verify executionQueue is used instead

// TESTING: Use vi.mock() for module mocking, not vi.fn()
// CORRECT: vi.mock('../../../src/utils/task-utils.js', ...)
// WRONG: const mock = vi.fn(getNextPendingItem);
// REASON: Module mocks are hoisted, work better with imports

// GOTCHA: executionQueue contains HierarchyItem objects, not IDs
// Each item has: id, type, status, title, description, children
// Queue is populated by resolveScope() which returns HierarchyItem[]

// CRITICAL: Queue order must match DFS pre-order traversal
// resolveScope() already returns items in DFS pre-order
// processNextItem() shifts from front (FIFO)
// This maintains the same execution order as getNextPendingItem()

// GOTCHA: setScope() should NOT affect currently executing item
// If item is in progress, let it complete
// New scope affects subsequent items only
// This matches "drain-and-refill" pattern from research

// CRITICAL: Type safety with discriminated unions
// HierarchyItem has 'type' field for narrowing
// Use switch (item.type) for type-specific handling
// Already done in #delegateByType()

// VALIDATION: Don't throw if scope resolves to empty array
// Empty queue = no items to execute = processNextItem() returns false
// This is valid behavior (e.g., scope for non-existent ID)
```

---

## Implementation Blueprint

### Data Models and Structure

**No New Models Required** - Using existing types from P3.M2.T2.S1:

```typescript
// From scope-resolver.ts (assume exists as specified)
import type { Scope } from './scope-resolver.js';
import { resolveScope } from './scope-resolver.js';

// Scope interface (from P3.M2.T2.S1 PRP, lines 76-82)
// interface Scope {
//   readonly type: 'phase' | 'milestone' | 'task' | 'subtask' | 'all';
//   readonly id?: string;
// }
```

**New Class State**:

```typescript
export class TaskOrchestrator {
  readonly sessionManager: SessionManager;

  // EXISTING (preserve)
  #backlog: Backlog;

  // NEW: Scope integration
  #scope: Scope | undefined;
  #executionQueue: HierarchyItem[];
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: MODIFY src/core/task-orchestrator.ts - Add scope imports
  - ADD: Import type { Scope } from './scope-resolver.js'
  - ADD: Import { resolveScope } from './scope-resolver.js'
  - PLACEMENT: Top of file, after existing imports
  - PATTERN: Follow existing import structure (type imports first, then value imports)

Task 2: MODIFY src/core/task-orchestrator.ts - Add private fields
  - ADD: #scope: Scope | undefined field
  - ADD: #executionQueue: HierarchyItem[] field
  - NAMING: Use # prefix for private fields (ES2022)
  - PLACEMENT: After #backlog declaration, before constructor
  - PATTERN: Follow existing #backlog pattern

Task 3: MODIFY src/core/task-orchestrator.ts - Modify constructor signature
  - MODIFY: Add optional scope parameter: constructor(sessionManager: SessionManager, scope?: Scope)
  - ADD: Store scope: this.#scope = scope;
  - ADD: Populate executionQueue: this.#executionQueue = this.#buildQueue(scope);
  - NAMING: Keep existing parameter name (sessionManager), add scope after
  - PLACEMENT: Constructor signature and body
  - PATTERN: Follow existing constructor structure (sessionManager assignment, backlog loading)

Task 4: CREATE src/core/task-orchestrator.ts - Add #buildQueue() helper
  - IMPLEMENT: #buildQueue(scope?: Scope): HierarchyItem[]
  - LOGIC:
    1. If scope undefined, use { type: 'all' }
    2. Call resolveScope(this.#backlog, scope)
    3. Return HierarchyItem array
  - ERROR HANDLING: Empty array is valid (no items to execute)
  - NAMING: Private method with # prefix
  - PLACEMENT: After constructor, before getter

Task 5: MODIFY src/core/task-orchestrator.ts - Modify processNextItem()
  - MODIFY: Check executionQueue instead of calling getNextPendingItem()
  - IMPLEMENT:
    1. Check if #executionQueue has items
    2. Shift next item from queue
    3. If empty, return false
    4. Log item being processed
    5. Delegate to #delegateByType()
    6. Refresh backlog
    7. Return true
  - PRESERVE: Existing logging and error handling patterns
  - NAMING: Keep same method signature
  - PLACEMENT: Same location in file

Task 6: CREATE src/core/task-orchestrator.ts - Add setScope() method
  - IMPLEMENT: async setScope(scope: Scope): Promise<void>
  - LOGIC:
    1. Log old scope (if exists)
    2. Store new scope
    3. Resolve scope to items
    4. Replace executionQueue
    5. Log new scope and queue size
  - SIGNATURE: async returns Promise<void>
  - NAMING: setScope (camelCase, matches setStatus pattern)
  - PLACEMENT: After setStatus(), before executePhase()

Task 7: CREATE src/core/task-orchestrator.ts - Add executionQueue getter
  - IMPLEMENT: get executionQueue(): HierarchyItem[]
  - RETURNS: Readonly copy of #executionQueue
  - NAMING: executionQueue (property name without get in usage)
  - PLACEMENT: After backlog getter, before setStatus()
  - PATTERN: Follow backlog getter pattern (returns readonly)

Task 8: MODIFY tests/unit/core/task-orchestrator.test.ts - Add scope import mocks
  - ADD: Mock for scope-resolver module
  - IMPLEMENT: vi.mock for './scope-resolver.js'
  - PATTERN: Follow existing getNextPendingItem mock pattern
  - PLACEMENT: After existing mocks, before test suite

Task 9: MODIFY tests/unit/core/task-orchestrator.test.ts - Add constructor scope tests
  - IMPLEMENT: Tests for constructor with scope parameter
  - TEST CASES:
    - constructor with no scope defaults to all
    - constructor with phase scope populates queue
    - constructor with milestone scope populates queue
    - constructor with task scope populates queue
    - constructor with subtask scope populates queue
    - constructor preserves existing behavior without scope
  - PATTERN: Follow existing constructor tests (lines 113-202)

Task 10: MODIFY tests/unit/core/task-orchestrator.test.ts - Add processNextItem scope tests
  - IMPLEMENT: Tests for processNextItem() with scoped queue
  - TEST CASES:
    - processes items from executionQueue
    - returns false when queue empty
    - delegates to correct type handler
    - refreshes backlog after processing
    - maintains execution order
  - PATTERN: Follow existing processNextItem test patterns

Task 11: MODIFY tests/unit/core/task-orchestrator.test.ts - Add setScope() tests
  - IMPLEMENT: Tests for setScope() method
  - TEST CASES:
    - changes scope and rebuilds queue
    - logs scope change
    - can be called multiple times
    - handles empty scope resolution
    - preserves executionQueue getter
  - PATTERN: Follow setStatus() test patterns

Task 12: MODIFY tests/unit/core/task-orchestrator.test.ts - Add integration tests
  - IMPLEMENT: Integration tests for scope-based execution flow
  - TEST SCENARIO:
    1. Create orchestrator with scope
    2. Process items from queue
    3. Change scope mid-execution
    4. Verify new queue used
    5. Verify all items processed
  - PATTERN: Follow integration test patterns from session-manager tests
```

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// PATTERN 1: Scope Imports (Top of file)
// ============================================================================

// After existing imports (lines 26-36)
import type { Scope } from './scope-resolver.js';
import { resolveScope } from './scope-resolver.js';

// ============================================================================
// PATTERN 2: Private Fields for Scope (After #backlog, around line 61)
// ============================================================================

export class TaskOrchestrator {
  readonly sessionManager: SessionManager;

  /** Current task registry (read from SessionManager) */
  #backlog: Backlog;

  /** Scope for limiting execution (undefined = all items) */
  #scope: Scope | undefined;

  /** Queue of items to execute (populated from scope) */
  #executionQueue: HierarchyItem[];

  // ============================================================================
  // PATTERN 3: Constructor Modification (Lines 63-78)
  // ============================================================================

  /**
   * Creates a new TaskOrchestrator instance
   *
   * @param sessionManager - Session state manager for persistence
   * @param scope - Optional scope to limit execution (defaults to all items)
   * @throws {Error} If sessionManager.currentSession is null
   *
   * @remarks
   * When scope is provided, only items matching the scope will be executed.
   * When scope is undefined, all items in the backlog will be executed.
   * The execution queue is populated by resolving the scope against the backlog.
   */
  constructor(sessionManager: SessionManager, scope?: Scope) {
    this.sessionManager = sessionManager;

    // Load initial backlog from session state
    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot create TaskOrchestrator: no active session');
    }

    this.#backlog = currentSession.taskRegistry;

    // NEW: Store scope and build execution queue
    this.#scope = scope;
    this.#executionQueue = this.#buildQueue(scope);
  }

  // ============================================================================
  // PATTERN 4: Queue Building Helper (After constructor, around line 79)
  // ============================================================================

  /**
   * Builds the execution queue from scope
   *
   * @param scope - Optional scope to resolve (defaults to 'all')
   * @returns Array of items to execute
   *
   * @remarks
   * Uses resolveScope() from scope-resolver.ts to convert scope to item list.
   * Returns all leaf subtasks when scope is undefined or 'all'.
   * Returns empty array for non-existent scope IDs (valid - no items to execute).
   */
  #buildQueue(scope?: Scope): HierarchyItem[] {
    // Default to 'all' scope if not provided
    const scopeToResolve = scope ?? { type: 'all' };

    // Resolve scope to list of items
    const items = resolveScope(this.#backlog, scopeToResolve);

    // Log queue size for visibility
    console.log(
      `[TaskOrchestrator] Execution queue built: ${items.length} items for scope ${JSON.stringify(scopeToResolve)}`
    );

    return items;
  }

  // ============================================================================
  // PATTERN 5: executionQueue Getter (After backlog getter, around line 88)
  // ============================================================================

  /**
   * Gets the current execution queue (read-only access for testing)
   *
   * @returns Copy of execution queue (external code can't mutate internal state)
   *
   * @remarks
   * Returns a shallow copy to prevent external mutation of the internal queue.
   * Mainly intended for testing - production code uses processNextItem() instead.
   */
  get executionQueue(): HierarchyItem[] {
    // Return shallow copy to prevent external mutation
    return [...this.#executionQueue];
  }

  // ============================================================================
  // PATTERN 6: setScope() Method (After setStatus(), around line 135)
  // ============================================================================

  /**
   * Changes the execution scope and rebuilds the queue
   *
   * @param scope - New scope to execute
   *
   * @remarks
   * Reconfigures the orchestrator to execute a different set of items.
   * Logs the scope change for debugging and audit trail.
   * The current item (if any) will complete before the new scope takes effect.
   *
   * @example
   * ```typescript
   * // Start with all items
   * const orchestrator = new TaskOrchestrator(sessionManager);
   *
   * // Later, narrow scope to specific milestone
   * await orchestrator.setScope({ type: 'milestone', id: 'P1.M1' });
   * ```
   */
  public async setScope(scope: Scope): Promise<void> {
    // Log old scope for debugging
    const oldScope = this.#scope ? JSON.stringify(this.#scope) : 'undefined (all)';
    const newScope = JSON.stringify(scope);

    console.log(`[TaskOrchestrator] Scope change: ${oldScope} → ${newScope}`);

    // Store new scope and rebuild queue
    this.#scope = scope;
    this.#executionQueue = this.#buildQueue(scope);

    console.log(
      `[TaskOrchestrator] Execution queue rebuilt: ${this.#executionQueue.length} items`
    );
  }

  // ============================================================================
  // PATTERN 7: Modified processNextItem() (Lines 538-564)
  // ============================================================================

  /**
   * Processes the next item from the execution queue
   *
   * @returns true if item was processed, false if queue is empty
   *
   * @remarks
   * This is the main entry point for backlog processing with scope support:
   * 1. Check if executionQueue has items
   * 2. Shift next item from queue (FIFO order)
   * 3. Return false if queue empty
   * 4. Log item being processed
   * 5. Delegate to type-specific handler
   * 6. Refresh backlog after status update
   * 7. Return true (item processed, more may remain)
   *
   * The Pipeline Controller calls this method repeatedly until it returns false.
   *
   * When scope is provided, only items in the scope are processed.
   * When scope is undefined, all items are processed.
   *
   * @example
   * ```typescript
   * const orchestrator = new TaskOrchestrator(sessionManager, { type: 'milestone', id: 'P1.M1' });
   * let hasMore = true;
   * while (hasMore) {
   *   hasMore = await orchestrator.processNextItem();
   * }
   * console.log('Milestone P1.M1 complete!');
   * ```
   */
  async processNextItem(): Promise<boolean> {
    // 1. Check if execution queue has items
    if (this.#executionQueue.length === 0) {
      console.log('[TaskOrchestrator] Execution queue empty - processing complete');
      return false;
    }

    // 2. Shift next item from queue (FIFO order)
    const nextItem = this.#executionQueue.shift()!;
    // Non-null assertion safe: we checked length > 0 above

    // 3. Log item being processed
    console.log(
      `[TaskOrchestrator] Processing: ${nextItem.id} (${nextItem.type})`
    );

    // 4. Delegate to type-specific handler
    await this.#delegateByType(nextItem);

    // 5. Refresh backlog after status update
    await this.#refreshBacklog();

    // 6. Indicate item was processed (more items may remain)
    return true;
  }

  // ============================================================================
  // PATTERN 8: Test - Constructor with Scope
  // ============================================================================

  // In task-orchestrator.test.ts, add new describe block after existing constructor tests
  describe('constructor with scope parameter', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should default to all items when scope is undefined', () => {
      // SETUP: Create mock session manager
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
            createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
              createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
            ]),
          ]),
        ]),
      ]);
      const currentSession = {
        metadata: { /* ... */ },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);

      // EXECUTE: Create orchestrator without scope
      const orchestrator = new TaskOrchestrator(mockManager);

      // VERIFY: Queue contains all leaf subtasks
      expect(orchestrator.executionQueue).toHaveLength(1);
      expect(orchestrator.executionQueue[0].id).toBe('P1.M1.T1.S1');
    });

    it('should populate queue from phase scope', () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned'),
        ]),
      ]);
      const currentSession = { /* ... */ };
      const mockManager = createMockSessionManager(currentSession);

      // Mock resolveScope to return phase and descendants
      const mockResolveScope = vi.fn().mockReturnValue([
        createTestPhase('P1', 'Phase 1', 'Planned'),
        createTestMilestone('P1.M1', 'Milestone 1', 'Planned'),
      ]);

      // EXECUTE: Create orchestrator with phase scope
      const orchestrator = new TaskOrchestrator(
        mockManager,
        { type: 'phase', id: 'P1' }
      );

      // VERIFY: Queue populated from scope
      expect(orchestrator.executionQueue).toHaveLength(2);
      expect(orchestrator.executionQueue[0].id).toBe('P1');
      expect(orchestrator.executionQueue[1].id).toBe('P1.M1');
    });
  });

  // ============================================================================
  // PATTERN 9: Test - setScope() Method
  // ============================================================================

  describe('setScope()', () => {
    it('should change scope and rebuild queue', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
        createTestPhase('P2', 'Phase 2', 'Planned'),
      ]);
      const currentSession = { /* ... */ };
      const mockManager = createMockSessionManager(currentSession);

      const orchestrator = new TaskOrchestrator(
        mockManager,
        { type: 'phase', id: 'P1' }
      );

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE: Change scope to P2
      await orchestrator.setScope({ type: 'phase', id: 'P2' });

      // VERIFY: Scope logged, queue rebuilt
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scope change')
      );
      expect(orchestrator.executionQueue[0].id).toBe('P2');

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // PATTERN 10: Test - processNextItem with Queue
  // ============================================================================

  describe('processNextItem with executionQueue', () => {
    it('should process items from queue in order', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = { /* ... */ };
      const mockManager = createMockSessionManager(currentSession);

      const orchestrator = new TaskOrchestrator(
        mockManager,
        { type: 'phase', id: 'P1' }
      );

      // EXECUTE: Process items
      const hasMore1 = await orchestrator.processNextItem();
      const hasMore2 = await orchestrator.processNextItem();

      // VERIFY: Items processed, queue drained
      expect(hasMore1).toBe(true);
      expect(mockManager.updateItemStatus).toHaveBeenCalled();
      expect(hasMore2).toBe(false); // Queue empty
    });
  });
}
````

### Integration Points

```yaml
SCOPE_RESOLVER:
  - file: src/core/scope-resolver.ts (from P3.M2.T2.S1)
  - import_type: "import type { Scope }"
  - import_value: "import { resolveScope }"
  - use_function: "resolveScope(backlog, scope)" - Returns HierarchyItem[]

MODELS:
  - file: src/core/models.ts
  - use_types: "HierarchyItem, Backlog, Status"
  - pattern: "Import types, use readonly properties"

SESSION_MANAGER:
  - file: src/core/session-manager.ts
  - use_method: "updateItemStatus(itemId, status)"
  - pattern: "No modifications needed - existing integration preserved"

TASK_UTILS:
  - file: src/utils/task-utils.ts
  - note: "Not directly used - getNextPendingItem() replaced by queue"
  - pattern: "Existing mocks preserved for backward compatibility"

TESTS:
  - file: tests/unit/core/task-orchestrator.test.ts
  - add_tests: "Constructor with scope, setScope(), processNextItem with queue"
  - preserve_tests: "All existing tests must continue to pass"
  - pattern: "Setup/Execute/Verify, factory functions, mock patterns"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding

# Type checking with TypeScript
npx tsc --noEmit

# Linting with ESLint (auto-fix issues)
npm run lint -- --fix src/core/task-orchestrator.ts
npm run lint -- --fix tests/unit/core/task-orchestrator.test.ts

# Format code with Prettier
npm run format -- --write src/core/task-orchestrator.ts
npm run format -- --write tests/unit/core/task-orchestrator.test.ts

# Project-wide validation
npx tsc --noEmit
npm run lint -- --fix
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test TaskOrchestrator (existing tests must pass)
npm test -- tests/unit/core/task-orchestrator.test.ts --run

# Test with coverage
npm test -- tests/unit/core/task-orchestrator.test.ts --run --coverage

# Run all unit tests
npm test -- tests/unit/ --run

# Coverage validation (enforces 100% threshold)
npm test -- --coverage --reporter=term-missing

# Expected: All tests pass. 100% coverage enforced by vitest.config.ts.
# If failing or coverage < 100%, debug root cause and fix implementation.

# Watch mode during development
npm test -- tests/unit/core/task-orchestrator.test.ts --watch
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test - verify scope-based execution
cat > tests/manual/scope-integration.test.ts << 'EOF'
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';
import { SessionManager } from '../../src/core/session-manager.js';
import { parseScope, resolveScope } from '../../src/core/scope-resolver.js';

async function testScopeIntegration() {
  const sm = new SessionManager('./PRD.md');
  await sm.initialize();

  // Test 1: Create orchestrator with phase scope
  console.log('\n=== Test 1: Phase Scope ===');
  const phaseScope = parseScope('P1');
  const orchestrator1 = new TaskOrchestrator(sm, phaseScope);
  console.log(`Queue size: ${orchestrator1.executionQueue.length}`);
  console.log(`First item: ${orchestrator1.executionQueue[0]?.id}`);

  // Test 2: Create orchestrator with no scope (default to all)
  console.log('\n=== Test 2: No Scope (Default All) ===');
  const orchestrator2 = new TaskOrchestrator(sm);
  console.log(`Queue size: ${orchestrator2.executionQueue.length}`);
  console.log(`All items are subtasks: ${orchestrator2.executionQueue.every(i => i.type === 'Subtask')}`);

  // Test 3: Change scope mid-execution
  console.log('\n=== Test 3: Change Scope ===');
  await orchestrator2.setScope(parseScope('P1.M1'));
  console.log(`New queue size: ${orchestrator2.executionQueue.length}`);
  console.log(`First item: ${orchestrator2.executionQueue[0]?.id}`);

  // Test 4: Process items from scoped queue
  console.log('\n=== Test 4: Process Scoped Items ===');
  let count = 0;
  while (await orchestrator2.processNextItem() && count < 3) {
    count++;
    console.log(`Processed ${count} items`);
  }
  console.log(`Remaining in queue: ${orchestrator2.executionQueue.length}`);
}

testScopeIntegration().catch(console.error);
EOF

# Run integration test
npm test -- tests/manual/scope-integration.test.ts

# Expected: Scope parsing works, queue populates correctly, setScope() works
```

### Level 4: Domain-Specific Validation

```bash
# Scope Integration Specific Validations:

# Test 1: Verify default scope (undefined) resolves to all items
# Test: new TaskOrchestrator(sessionManager)
# Expected: executionQueue contains all leaf subtasks

# Test 2: Verify phase scope populates queue correctly
# Test: new TaskOrchestrator(sessionManager, { type: 'phase', id: 'P1' })
# Expected: executionQueue contains phase and all descendants

# Test 3: Verify milestone scope populates queue correctly
# Test: new TaskOrchestrator(sessionManager, { type: 'milestone', id: 'P1.M1' })
# Expected: executionQueue contains milestone and all descendants

# Test 4: Verify task scope populates queue correctly
# Test: new TaskOrchestrator(sessionManager, { type: 'task', id: 'P1.M1.T1' })
# Expected: executionQueue contains task and all subtasks

# Test 5: Verify subtask scope populates queue correctly
# Test: new TaskOrchestrator(sessionManager, { type: 'subtask', id: 'P1.M1.T1.S1' })
# Expected: executionQueue contains single subtask

# Test 6: Verify 'all' scope populates queue correctly
# Test: new TaskOrchestrator(sessionManager, { type: 'all' })
# Expected: executionQueue contains all leaf subtasks

# Test 7: Verify processNextItem() pulls from queue
# Test: orchestrator.processNextItem() in loop
# Expected: Items processed in queue order, returns false when empty

# Test 8: Verify setScope() rebuilds queue
# Test: await orchestrator.setScope({ type: 'phase', id: 'P2' })
# Expected: Queue rebuilt with new scope, old items removed

# Test 9: Verify setScope() can be called multiple times
# Test: Call setScope() with different scopes
# Expected: Each call rebuilds queue correctly

# Test 10: Verify empty queue returns false
# Test: processNextItem() with empty queue
# Expected: Returns false immediately, logs completion

# Manual validation checklist:
echo "Scope Integration Validation Checklist"
echo "======================================"
echo "[] Constructor accepts optional scope parameter"
echo "[] Constructor populates executionQueue from scope"
echo "[] Constructor defaults to 'all' when scope undefined"
echo "[] executionQueue getter returns copy of queue"
echo "[] processNextItem() pulls from executionQueue"
echo "[] processNextItem() returns false when queue empty"
echo "[] processNextItem() processes items in order"
echo "[] setScope() changes scope and rebuilds queue"
echo "[] setScope() logs scope change"
echo "[] setScope() can be called multiple times"
echo "[] All existing tests still pass"
echo "[] New tests cover all scope types"
echo "[] Coverage = 100%"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/task-orchestrator.test.ts --run`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Coverage = 100% for modified code (enforced by vitest.config.ts)

### Feature Validation

- [ ] Constructor accepts optional `scope?: Scope` parameter
- [ ] `#scope` private field exists and is initialized
- [ ] `#executionQueue` private field exists and is populated
- [ ] Constructor defaults to 'all' scope when parameter undefined
- [ ] `executionQueue` getter returns copy of internal queue
- [ ] `processNextItem()` pulls from `executionQueue` instead of `getNextPendingItem()`
- [ ] `processNextItem()` returns `false` when queue empty
- [ ] `setScope()` method exists and is async
- [ ] `setScope()` rebuilds queue with new scope
- [ ] `setScope()` logs scope change
- [ ] All existing tests pass (backward compatibility)

### Code Quality Validation

- [ ] Follows existing private field pattern (# prefix)
- [ ] Follows existing readonly property pattern (sessionManager)
- [ ] Follows existing logging pattern ([TaskOrchestrator] prefix)
- [ ] Follows existing async method pattern (setStatus, execute\*)
- [ ] Follows existing JSDoc pattern with @param, @returns tags
- [ ] Error handling matches existing patterns
- [ ] No duplicate code (DRY principle - use resolveScope)
- [ ] Type safety maintained throughout

### Documentation & Deployment

- [ ] All new methods have JSDoc comments
- [ ] JSDoc includes usage examples for setScope()
- [ ] Constructor JSDoc documents scope parameter
- [ ] processNextItem() JSDoc updated for queue behavior
- [ ] Research documents preserved in research/ subdirectory
- [ ] No TODO comments left in production code
- [ ] Code is self-documenting with clear variable names

---

## Anti-Patterns to Avoid

- ❌ Don't reimplement scope resolution logic - use `resolveScope()` from scope-resolver.ts
- ❌ Don't use `getNextPendingItem()` when scope is set - use executionQueue instead
- ❌ Don't throw error for empty queue - return false from processNextItem()
- ❌ Don't mutate executionQueue externally - return copy from getter
- ❌ Don't make setScope() synchronous - make it async (returns Promise<void>)
- ❌ Don't skip logging scope changes - log old and new scope
- ❌ Don't use `_prefix` for private fields - use `#prefix` (ES2022)
- ❌ Don't break backward compatibility - existing code must work without scope
- ❌ Don't hardcode scope resolution - delegate to scope-resolver module
- ❌ Don't modify existing tests without preservation - add new tests alongside
- ❌ Don't skip JSDoc for new methods - document setScope(), executionQueue getter
- ❌ Don't use public mutable fields - use private #fields with getters
- ❌ Don't assume scope is always provided - handle undefined case
- ❌ Don't change queue order - preserve DFS pre-order from resolveScope()
- ❌ Don't make executionQueue a public property - use getter for read access
- ❌ Don't forget to refresh backlog after status updates
- ❌ Don't use `||` for default values - use `??` (nullish coalescing)
- ❌ Don't modify the backlog directly - use SessionManager methods
- ❌ Don't skip type guards - HierarchyItem union requires type narrowing

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Reasoning**:

- Complete understanding of existing TaskOrchestrator implementation
- Scope resolver contract fully defined from P3.M2.T2.S1 PRP
- Clear modification points identified (constructor, processNextItem)
- Comprehensive test patterns documented from existing tests
- External research provides proven patterns to follow
- TypeScript class patterns researched and documented
- Integration points clearly specified
- Backward compatibility requirements understood

**Risk Factors**:

- P3.M2.T2.S1 must be completed first (scope resolver dependency)
- Queue rebuild timing during mid-execution scope changes
- Ensuring existing tests don't break when adding scope parameter

**Mitigation**:

- Detailed implementation specification with exact code patterns
- Comprehensive test coverage requirements (100%)
- Clear factory functions for test data
- Step-by-step task ordering with dependencies
- Integration tests validate end-to-end flow
- Backward compatibility tests explicitly required

---

## Success Metrics

**Confidence Score**: 9/10

**Validation**: The completed PRP should enable an AI agent unfamiliar with the codebase to:

1. Modify TaskOrchestrator constructor to accept optional scope parameter
2. Add executionQueue private field and populate it from scope
3. Modify processNextItem() to use queue instead of DFS traversal
4. Add setScope() method for mid-execution reconfiguration
5. Write comprehensive tests for all new functionality
6. Maintain backward compatibility with existing code

All context needed for implementation is provided including:

- Exact Scope interface from P3.M2.T2.S1
- Current TaskOrchestrator implementation with line numbers
- Test patterns to follow
- External research on scope execution patterns
- Complete code examples showing patterns to follow
