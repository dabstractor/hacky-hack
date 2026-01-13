# TypeScript Class Design Patterns Research

## Executive Summary

This document compiles TypeScript best practices for class design patterns relevant to the TaskOrchestrator refactoring in P3.M2.T2S2. Focus areas include constructor parameter patterns, property visibility, mid-execution state reconfiguration, queue-based state management, and immutability patterns.

**Current Status:** Web research APIs are rate-limited. This document provides knowledge-based patterns with references to official TypeScript documentation.

## 1. Optional Constructor Parameters with Default Values

### 1.1 Pattern 1: Direct Default Parameters (Simple Cases)

**Best for:** 3 or fewer optional parameters with clear defaults.

```typescript
export class TaskOrchestrator {
  readonly sessionManager: SessionManager;
  readonly maxRetries: number;
  readonly timeout: number;

  constructor(
    sessionManager: SessionManager,
    maxRetries: number = 3,
    timeout: number = 5000
  ) {
    this.sessionManager = sessionManager;
    this.maxRetries = maxRetries;
    this.timeout = timeout;
  }
}
```

**Pros:**

- Simple, straightforward syntax
- IDE autocomplete shows defaults inline
- Clear parameter documentation in constructor signature

**Cons:**

- Parameter ordering matters (required first, then optional)
- Becomes unwieldy with 4+ parameters
- Can't skip optional parameters (must pass `undefined` to use default)

**GOTCHA:** Use `??` (nullish coalescing) instead of `||` for falsy defaults:

```typescript
// ❌ WRONG - treats 0 as falsy
constructor(timeout: number = 30) {
  this.timeout = timeout || 5000; // 0 becomes 5000!
}

// ✅ CORRECT - only null/undefined trigger default
constructor(timeout: number = 30) {
  this.timeout = timeout ?? 5000; // 0 stays 0
}
```

### 1.2 Pattern 2: Configuration Object Pattern

**Best for:** 4+ optional parameters or complex configuration.

```typescript
interface OrchestratorConfig {
  maxRetries?: number;
  timeout?: number;
  enableDeps?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class TaskOrchestrator {
  readonly sessionManager: SessionManager;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly enableDeps: boolean;
  readonly logLevel: OrchestratorConfig['logLevel'];

  constructor(sessionManager: SessionManager, config: OrchestratorConfig = {}) {
    this.sessionManager = sessionManager;
    this.maxRetries = config.maxRetries ?? 3;
    this.timeout = config.timeout ?? 5000;
    this.enableDeps = config.enableDeps ?? true;
    this.logLevel = config.logLevel ?? 'info';
  }
}
```

**Pros:**

- Parameter ordering doesn't matter
- Self-documenting (property names describe purpose)
- Easy to extend with new options
- Named parameters in callsite

**Cons:**

- More verbose
- Requires interface definition
- Slightly more complex validation

**Usage:**

```typescript
const orchestrator = new TaskOrchestrator(sessionManager, {
  timeout: 10000,
  logLevel: 'debug',
  // maxRetries and enableDeps use defaults
});
```

### 1.3 Pattern 3: Parameter Properties (TypeScript Shorthand)

**Best for:** Simple readonly properties that don't need validation.

```typescript
export class TaskOrchestrator {
  constructor(
    readonly sessionManager: SessionManager,
    private readonly maxRetries: number = 3,
    private readonly timeout: number = 5000
  ) {}
}
```

**Pros:**

- Most concise syntax
- Automatically creates properties from parameters
- Reduces boilerplate

**Cons:**

- No place for validation logic
- All-or-nothing (can't mix with regular properties easily)
- Can make constructors less readable

**RECOMMENDATION:** Use for simple dependency injection only, not for complex state.

## 2. Public Properties vs Private Properties with Getters

### 2.1 Pattern 1: Direct Public Properties

**Best for:** Simple data containers, DTOs, or when validation/encapsulation isn't needed.

```typescript
export class TaskOrchestrator {
  public backlog: Backlog;
  public status: 'idle' | 'running' | 'paused';

  constructor(sessionManager: SessionManager) {
    this.backlog = sessionManager.currentSession.taskRegistry;
    this.status = 'idle';
  }
}
```

**Pros:**

- Simplest access pattern
- Minimal overhead
- Easy to debug

**Cons:**

- No control over external mutations
- Can't add validation/logging later without breaking API
- Violates encapsulation

**GOTCHA:** Public properties on mutable objects allow external code to corrupt state:

```typescript
// ❌ DANGEROUS - external code can modify backlog
orchestrator.backlog.backlog[0].status = 'Complete'; // Bypasses validation!

// ❌ DANGEROUS - property replacement
orchestrator.backlog = someOtherBacklog;
```

### 2.2 Pattern 2: Private Properties with Getters (Read-Only Access)

**Best for:** State that should be externally observable but not modifiable.

```typescript
export class TaskOrchestrator {
  #backlog: Backlog;
  #status: 'idle' | 'running' | 'paused' = 'idle';

  constructor(sessionManager: SessionManager) {
    this.#backlog = sessionManager.currentSession.taskRegistry;
  }

  get backlog(): Backlog {
    return this.#backlog;
  }

  get status(): 'idle' | 'running' | 'paused' {
    return this.#status;
  }
}
```

**Pros:**

- External read access only
- Clear ownership semantics
- Can add validation/logging later without breaking API
- TypeScript enforces visibility

**Cons:**

- Getter returns reference (still mutable if object)
- More verbose than public properties

**GOTCHA:** Getters on objects return references, not copies:

```typescript
// ❌ STILL DANGEROUS - getter returns object reference
const backlog = orchestrator.backlog;
backlog.backlog[0].status = 'Complete'; // Modifies internal state!

// ✅ SAFE - return defensive copy (if needed)
get backlog(): Backlog {
  return structuredClone(this.#backlog);
}
```

**RECOMMENDATION for TaskOrchestrator:**

- Use `readonly` public property for `sessionManager` (dependency injection, immutable ref)
- Use private field with getter for `backlog` (internal state managed by orchestrator)
- Return defensive copy only if mutations are a concern (consider performance impact)

### 2.3 Pattern 3: Private Properties with Getters and Setters

**Best for:** State that needs validation or side effects on modification.

```typescript
export class TaskOrchestrator {
  #backlog: Backlog;
  #status: 'idle' | 'running' | 'paused' = 'idle';

  get backlog(): Backlog {
    return this.#backlog;
  }

  set backlog(newBacklog: Backlog) {
    // Validation
    if (!newBacklog.backlog?.length) {
      throw new Error('Backlog cannot be empty');
    }
    this.#backlog = newBacklog;
  }

  get status(): 'idle' | 'running' | 'paused' {
    return this.#status;
  }

  set status(newStatus: 'idle' | 'running' | 'paused') {
    const oldStatus = this.#status;
    this.#status = newStatus;

    // Side effect: log state transition
    console.log(`Status: ${oldStatus} → ${newStatus}`);
  }
}
```

**Pros:**

- Validation on write
- Side effects (logging, persistence, etc.)
- Maintains API stability if implementation changes

**Cons:**

- Can hide expensive operations behind simple assignment
- May surprise users if setter has side effects
- More complex than direct property access

**RECOMMENDATION:** Prefer explicit methods for state mutations (e.g., `setStatus()`, `updateBacklog()`) instead of setters. This makes side effects explicit.

### 2.4 Current TaskOrchestrator Pattern Analysis

**Current Implementation:**

```typescript
export class TaskOrchestrator {
  readonly sessionManager: SessionManager;
  #backlog: Backlog;

  get backlog(): Backlog {
    return this.#backlog;
  }

  public async setStatus(
    itemId: string,
    status: Status,
    reason?: string
  ): Promise<void> {
    // ... implementation with logging and persistence
  }
}
```

**Strengths:**

- ✅ `readonly sessionManager` prevents external reassignment
- ✅ `#backlog` private field prevents direct property replacement
- ✅ `get backlog()` provides read access
- ✅ Explicit `setStatus()` method for state mutations
- ✅ Clear separation: reading via getter, mutating via method

**Weaknesses:**

- ⚠️ Getter returns backlog reference (external code can mutate nested properties)
- ⚠️ No validation on backlog access

**Recommended Enhancement:**

```typescript
export class TaskOrchestrator {
  readonly sessionManager: SessionManager;
  #backlog: Backlog;
  #backlogVersion: number = 0; // Track mutations

  get backlog(): Backlog {
    return this.#backlog;
  }

  get backlogVersion(): number {
    return this.#backlogVersion;
  }

  // Explicit method for all backlog updates
  async #updateBacklog(updater: (backlog: Backlog) => Backlog): Promise<void> {
    this.#backlog = updater(this.#backlog);
    this.#backlogVersion++;
    await this.#persistBacklog();
  }
}
```

## 3. Methods that Reconfigure Internal State Mid-Execution

### 3.1 Pattern 1: Fluent/Builder Pattern (Method Chaining)

**Best for:** Configuration builders, query builders.

```typescript
export class TaskOrchestrator {
  #config: OrchestratorConfig;
  #state: OrchestratorState;

  setMaxRetries(maxRetries: number): this {
    this.#config.maxRetries = maxRetries;
    return this; // Enable chaining
  }

  setTimeout(timeout: number): this {
    this.#config.timeout = timeout;
    return this;
  }

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): this {
    this.#config.logLevel = level;
    return this;
  }

  // Usage
  configure() {
    return this.setMaxRetries(5).setTimeout(10000).setLogLevel('debug');
  }
}
```

**Pros:**

- Concise, readable API
- Easy to chain multiple configuration calls
- Common in TypeScript ecosystem

**Cons:**

- Can make debugging harder (intermediate state not observable)
- Encourages mutable state
- Not suitable for mid-execution reconfiguration (racing concerns)

### 3.2 Pattern 2: Explicit State Update Methods

**Best for:** Mid-execution reconfiguration with validation and side effects.

```typescript
export class TaskOrchestrator {
  #processingQueue: QueueItem[] = [];
  #currentConfig: RuntimeConfig;
  #configHistory: ConfigSnapshot[] = [];

  /**
   * Updates runtime configuration during execution
   *
   * @param updates - Partial config to merge into current config
   * @param options - Control validation and persistence behavior
   * @throws {Error} If validation fails or transition is invalid
   */
  updateRuntimeConfig(
    updates: Partial<RuntimeConfig>,
    options: { validate: boolean; persist: boolean } = {
      validate: true,
      persist: true,
    }
  ): void {
    const oldConfig = { ...this.#currentConfig };

    // Apply updates
    this.#currentConfig = { ...this.#currentConfig, ...updates };

    // Validation
    if (options.validate) {
      this.#validateConfig(this.#currentConfig);
    }

    // Snapshot for rollback
    this.#configHistory.push({
      timestamp: Date.now(),
      oldConfig,
      newConfig: { ...this.#currentConfig },
    });

    // Side effects
    if (options.persist) {
      this.#persistConfig();
    }

    // Log transition
    console.log(`Config updated:`, {
      changes: this.#diffConfig(oldConfig, this.#currentConfig),
    });
  }

  /**
   * Rollback to previous configuration
   */
  rollbackConfig(): void {
    const lastSnapshot = this.#configHistory.pop();
    if (!lastSnapshot) {
      throw new Error('No configuration history to rollback');
    }

    this.#currentConfig = lastSnapshot.oldConfig;
    console.log('Config rolled back to previous state');
  }
}
```

**Pros:**

- Clear intent (method name describes action)
- Validation logic encapsulated
- Side effects are explicit
- Can track history for rollback/audit
- No racing concerns (synchronous update)

**Cons:**

- More verbose than fluent pattern
- Requires careful state management

**RECOMMENDATION:** Use explicit state update methods for TaskOrchestrator. The current `setStatus()` method follows this pattern and is well-designed.

### 3.3 Pattern 3: Event-Driven Reconfiguration

**Best for:** Complex state machines with external triggers.

```typescript
type ConfigEvent =
  | { type: 'UPDATE_CONFIG'; payload: Partial<RuntimeConfig> }
  | { type: 'ROLLBACK_CONFIG' }
  | { type: 'RESET_CONFIG' };

export class TaskOrchestrator {
  #config: RuntimeConfig;
  #eventQueue: ConfigEvent[] = [];
  #processing = false;

  /**
   * Queue a configuration update event
   */
  queueConfigUpdate(event: ConfigEvent): void {
    this.#eventQueue.push(event);
    this.#processEventQueue();
  }

  async #processEventQueue(): Promise<void> {
    if (this.#processing) return;
    this.#processing = true;

    while (this.#eventQueue.length > 0) {
      const event = this.#eventQueue.shift()!;

      try {
        switch (event.type) {
          case 'UPDATE_CONFIG':
            await this.#handleConfigUpdate(event.payload);
            break;
          case 'ROLLBACK_CONFIG':
            await this.#handleRollback();
            break;
          case 'RESET_CONFIG':
            await this.#handleReset();
            break;
        }
      } catch (error) {
        console.error(`Failed to process event:`, error);
        // Continue processing next event
      }
    }

    this.#processing = false;
  }

  async #handleConfigUpdate(updates: Partial<RuntimeConfig>): Promise<void> {
    // Apply with validation
    this.#config = { ...this.#config, ...updates };
    await this.#validateAndPersist();
  }
}
```

**Pros:**

- Decouples configuration from execution
- Can handle bursts of updates efficiently
- Easy to add event persistence/replay
- No racing concerns (queue serializes updates)

**Cons:**

- More complex implementation
- Async state updates add complexity
- May introduce latency

**RECOMMENDATION:** Use event-driven pattern if TaskOrchestrator needs to handle external configuration updates during execution (e.g., CLI commands, API calls).

### 3.4 Current TaskOrchestrator Analysis

**Current State Update Methods:**

- `setStatus(itemId, status, reason)` - Updates item status with logging
- `#updateStatus(id, status)` - Internal method, persists and refreshes backlog
- `#refreshBacklog()` - Reloads backlog from session manager

**Strengths:**

- ✅ Public `setStatus()` has clear intent
- ✅ Logging with old→new transition and optional reason
- ✅ Persistence through SessionManager
- ✅ Backlog refresh after updates
- ✅ Follows explicit method pattern (not fluent)

**Recommended Enhancements:**

```typescript
export class TaskOrchestrator {
  #statusHistory: StatusChange[] = [];

  public async setStatus(
    itemId: string,
    status: Status,
    reason?: string
  ): Promise<void> {
    const { findItem } = await import('../utils/task-utils.js');

    const currentItem = findItem(this.#backlog, itemId);
    const oldStatus = currentItem?.status ?? 'Unknown';
    const timestamp = new Date().toISOString();

    // Validation: Check if transition is allowed
    if (!this.#isValidStatusTransition(oldStatus, status)) {
      throw new Error(
        `Invalid status transition: ${itemId} ${oldStatus} → ${status}`
      );
    }

    // Snapshot for history
    this.#statusHistory.push({
      itemId,
      oldStatus,
      newStatus: status,
      reason,
      timestamp,
    });

    // Log and persist
    console.log(
      `[TaskOrchestrator] Status: ${itemId} ${oldStatus} → ${status}${reason ? ` (${reason})` : ''}`
    );
    console.log(`[TaskOrchestrator] Timestamp: ${timestamp}`);

    await this.sessionManager.updateItemStatus(itemId, status);
    await this.#refreshBacklog();
  }

  #isValidStatusTransition(from: Status, to: Status): boolean {
    // Define allowed transitions
    const transitions: Record<Status, Status[]> = {
      Planned: ['Researching', 'Implementing', 'Obsolete', 'Failed'],
      Researching: ['Implementing', 'Failed', 'Obsolete'],
      Implementing: ['Complete', 'Failed', 'Obsolete'],
      Complete: ['Researching', 'Implementing', 'Obsolete'], // Can reopen
      Failed: ['Planned', 'Researching', 'Obsolete'],
      Obsolete: ['Planned', 'Researching', 'Implementing'], // Can reopen
    };

    return transitions[from]?.includes(to) ?? false;
  }

  /**
   * Get status change history for an item
   */
  getStatusHistory(itemId: string): StatusChange[] {
    return this.#statusHistory.filter(change => change.itemId === itemId);
  }
}
```

## 4. Queue-Based State Management Patterns

### 4.1 Pattern 1: Simple Array Queue (FIFO)

**Best for:** Basic task processing without prioritization.

```typescript
export class TaskQueue<T> {
  #queue: T[] = [];

  enqueue(item: T): void {
    this.#queue.push(item);
  }

  dequeue(): T | undefined {
    return this.#queue.shift();
  }

  peek(): T | undefined {
    return this.#queue[0];
  }

  get size(): number {
    return this.#queue.length;
  }

  get isEmpty(): boolean {
    return this.#queue.length === 0;
  }
}
```

**Pros:**

- Simple implementation
- O(1) enqueue, O(n) dequeue (acceptable for small queues)

**Cons:**

- O(n) dequeue is inefficient for large queues
- No prioritization
- No filtering/querying

### 4.2 Pattern 2: Priority Queue

**Best for:** When items have different priorities or dependencies.

```typescript
interface PrioritizedItem<T> {
  item: T;
  priority: number; // Higher = more important
  timestamp: number; // Tiebreaker
}

export class PriorityQueue<T> {
  #queue: PrioritizedItem<T>[] = [];

  enqueue(item: T, priority: number): void {
    this.#queue.push({
      item,
      priority,
      timestamp: Date.now(),
    });

    // Sort by priority (desc), then timestamp (asc)
    this.#queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Earlier timestamp first
    });
  }

  dequeue(): T | undefined {
    return this.#queue.shift()?.item;
  }

  peek(): T | undefined {
    return this.#queue[0]?.item;
  }

  get size(): number {
    return this.#queue.length;
  }
}
```

**Pros:**

- Handles prioritization
- FIFO within same priority

**Cons:**

- O(n log n) sort on each enqueue (inefficient)
- Better to use binary heap for production

**RECOMMENDATION for TaskOrchestrator:**
Use dependency-based prioritization instead of numeric priority:

```typescript
export class TaskOrchestrator {
  /**
   * Gets next pending item using DFS pre-order traversal
   * Prioritizes: items with satisfied dependencies > blocked items
   */
  async processNextItem(): Promise<boolean> {
    const { getNextPendingItem } = await import('../utils/task-utils.js');

    const nextItem = getNextPendingItem(this.#backlog);

    if (nextItem === null) {
      return false;
    }

    // Check dependencies for subtasks
    if (nextItem.type === 'Subtask') {
      if (!this.canExecute(nextItem)) {
        const blockers = this.getBlockingDependencies(nextItem);
        console.log(
          `Skipping ${nextItem.id}, blocked on:`,
          blockers.map(b => b.id)
        );
        // Try next item instead of blocking
        return this.processNextItem();
      }
    }

    await this.#delegateByType(nextItem);
    await this.#refreshBacklog();

    return true;
  }
}
```

### 4.3 Pattern 3: Event Queue with Side Effects

**Best for:** Complex state machines with event sourcing.

```typescript
interface StateEvent<T> {
  type: string;
  payload: T;
  timestamp: number;
  sequence: number;
}

export class EventQueue<T> {
  #events: StateEvent<T>[] = [];
  #sequence = 0;
  #handlers: Map<string, (payload: T) => void | Promise<void>> = new Map();

  on(type: string, handler: (payload: T) => void | Promise<void>): void {
    this.#handlers.set(type, handler);
  }

  async emit(type: string, payload: T): Promise<void> {
    const event: StateEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      sequence: this.#sequence++,
    };

    this.#events.push(event);

    const handler = this.#handlers.get(type);
    if (handler) {
      await handler(payload);
    }
  }

  getHistory(type?: string): StateEvent<T>[] {
    return type ? this.#events.filter(e => e.type === type) : [...this.#events];
  }

  /**
   * Replay events from history
   */
  async replay(fromSequence?: number): Promise<void> {
    const start = fromSequence ?? 0;
    for (const event of this.#events.slice(start)) {
      const handler = this.#handlers.get(event.type);
      if (handler) {
        await handler(event.payload);
      }
    }
  }
}
```

**Pros:**

- Event sourcing (full audit trail)
- Can replay events for debugging/testing
- Decouples state changes from side effects
- Easy to add event persistence

**Cons:**

- More complex implementation
- Async handling adds complexity
- Memory usage grows with event history

**RECOMMENDATION:** Consider event queue for TaskOrchestrator if you need:

- Audit trail of all status changes
- Ability to replay/recover from failures
- Multiple subscribers to state changes
- Event persistence for crash recovery

### 4.4 Current TaskOrchestrator Queue Analysis

**Current Implementation:**

- Uses `getNextPendingItem()` from task-utils for DFS traversal
- No explicit queue class (implicit queue in backlog structure)
- Single-threaded processing via `processNextItem()` loop
- Dependency checking with `canExecute()` and `getBlockingDependencies()`

**Strengths:**

- ✅ DFS traversal respects hierarchy (parent before children)
- ✅ Dependency checking prevents invalid execution order
- ✅ Simple, predictable processing model

**Weaknesses:**

- ⚠️ Blocking on dependencies (skips but doesn't queue blocked items)
- ⚠️ No retry mechanism for failed items
- ⚠️ No prioritization beyond DFS order

**Recommended Enhancement: Dependency-Aware Queue**

```typescript
export class DependencyAwareQueue {
  #pending: Set<string> = new Set();
  #blocked: Map<string, string[]> = new Map(); // itemId -> blocking dependencies

  add(itemId: string, dependencies: string[] = []): void {
    this.#pending.add(itemId);
    if (dependencies.length > 0) {
      this.#blocked.set(itemId, dependencies);
    }
  }

  /**
   * Get next item that can execute (dependencies satisfied)
   */
  getNext(availableItems: string[]): string | null {
    // Filter items that are pending and not blocked
    for (const itemId of availableItems) {
      if (!this.#pending.has(itemId)) continue;

      const blockers = this.#blocked.get(itemId);
      if (!blockers || blockers.length === 0) {
        this.#pending.delete(itemId);
        return itemId;
      }
    }

    return null;
  }

  /**
   * Unblock items that were waiting on completed dependency
   */
  unblock(completedItemId: string): string[] {
    const unblocked: string[] = [];

    for (const [itemId, blockers] of this.#blocked) {
      const index = blockers.indexOf(completedItemId);
      if (index !== -1) {
        blockers.splice(index, 1);
        if (blockers.length === 0) {
          unblocked.push(itemId);
          this.#blocked.delete(itemId);
        }
      }
    }

    return unblocked;
  }
}
```

## 5. Immutable State Updates vs Mutable State Updates

### 5.1 Pattern 1: Mutable Updates (Direct Modification)

**Best for:** Performance-critical code, isolated state, simple objects.

```typescript
export class TaskOrchestrator {
  #backlog: Backlog;

  updateStatus(itemId: string, status: Status): void {
    const item = findItem(this.#backlog, itemId);
    if (item) {
      item.status = status; // Direct mutation
    }
  }
}
```

**Pros:**

- Fast (no object allocation)
- Simple syntax
- Low memory overhead

**Cons:**

- Hard to track changes
- Can cause unexpected side effects
- Difficult to debug
- Breaks referential transparency
- Risk of shared state corruption

**GOTCHA:** Mutations can silently affect other references:

```typescript
// ❌ DANGEROUS - mutation affects shared reference
const backlog1 = orchestrator.backlog;
const backlog2 = orchestrator.backlog;

backlog1.backlog[0].status = 'Complete';

console.log(backlog2.backlog[0].status); // 'Complete' - surprise!
```

### 5.2 Pattern 2: Immutable Updates (Spread Operator)

**Best for:** React/Redux-style state management, predictable updates.

```typescript
export class TaskOrchestrator {
  #backlog: Backlog;

  updateStatus(itemId: string, status: Status): void {
    const updatedBacklog: Backlog = {
      ...this.#backlog,
      backlog: this.#backlog.backlog.map(phase => ({
        ...phase,
        milestones: phase.milestones.map(milestone => ({
          ...milestone,
          tasks: milestone.tasks.map(task => ({
            ...task,
            subtasks: task.subtasks.map(
              subtask =>
                subtask.id === itemId
                  ? { ...subtask, status } // New object
                  : subtask // Keep existing
            ),
          })),
        })),
      })),
    };

    this.#backlog = updatedBacklog;
  }
}
```

**Pros:**

- Predictable state changes
- Easy to track changes (reference equality)
- No shared state corruption
- Enables time-travel debugging
- Better for concurrent access

**Cons:**

- Verbose nested spread operators
- Performance overhead (object allocation)
- Can be inefficient for deeply nested structures
- More complex syntax

**RECOMMENDATION:** Use Immer library for immutable updates with mutable-like syntax:

### 5.3 Pattern 3: Immutable Updates with Immer

**Best for:** Complex nested state, cleaner syntax, production apps.

```typescript
import { produce } from 'immer';

export class TaskOrchestrator {
  #backlog: Backlog;

  updateStatus(itemId: string, status: Status): void {
    this.#backlog = produce(this.#backlog, draft => {
      const item = findItem(draft, itemId);
      if (item) {
        item.status = status; // Looks like mutation, but is immutable!
      }
    });
  }
}
```

**Pros:**

- Mutable-like syntax (cleaner than spread)
- Actually immutable (structural sharing)
- Efficient (only copies changed paths)
- Easy to understand
- Supports deep updates

**Cons:**

- External dependency
- Slight overhead over manual mutations
- Learning curve for advanced features

### 5.4 Pattern 4: Immutable Updates with Structured Clone

**Best for:** Simple deep copies without dependencies.

```typescript
export class TaskOrchestrator {
  #backlog: Backlog;

  updateStatus(itemId: string, status: Status): void {
    const copy = structuredClone(this.#backlog); // Deep clone
    const item = findItem(copy, itemId);
    if (item) {
      item.status = status;
    }
    this.#backlog = copy;
  }
}
```

**Pros:**

- No external dependencies
- Simple API
- True deep copy

**Cons:**

- Slow (copies entire object tree)
- Not efficient for large objects
- Loses reference equality everywhere

### 5.5 Current TaskOrchestrator Immutability Analysis

**Current Implementation:**

- Mutable state updates (directly modifies backlog via SessionManager)
- Reloads backlog after each update (`#refreshBacklog()`)
- SessionManager handles persistence and mutations
- Local `#backlog` property is reassigned on refresh

**Strengths:**

- Simple, efficient updates
- SessionManager is single source of truth
- Reload pattern ensures local state stays fresh

**Weaknesses:**

- Local `#backlog` can become stale if not refreshed
- Multiple references to same backlog can cause confusion
- No clear ownership model

**Recommended Approach:**

1. **Keep current mutable pattern for simplicity**
2. **Use Immer if immutability becomes important**
3. **Document state ownership clearly**

```typescript
export class TaskOrchestrator {
  /**
   * SessionManager is the single source of truth for backlog state.
   * This local property is a cached snapshot that is refreshed after updates.
   * Direct mutation of this property is not supported.
   */
  readonly sessionManager: SessionManager;

  /**
   * Cached backlog snapshot.
   * NOTE: This is a mutable reference to SessionManager's state.
   * Always call #refreshBacklog() after SessionManager updates.
   */
  #backlog: Backlog;

  /**
   * Gets a defensive copy of the current backlog.
   * Use this if you need to modify backlog without affecting SessionManager.
   */
  getBacklogCopy(): Backlog {
    return structuredClone(this.#backlog);
  }
}
```

## 6. Common Pitfalls to Avoid

### 6.1 Pitfall 1: Exposing Mutable Internal State

```typescript
// ❌ WRONG - Exposes internal array
export class TaskOrchestrator {
  #queue: string[] = [];

  get queue(): string[] {
    return this.#queue; // Caller can modify!
  }
}

// ✅ CORRECT - Return copy or readonly array
export class TaskOrchestrator {
  #queue: string[] = [];

  get queue(): readonly string[] {
    return this.#queue; // Readonly, but same reference
  }

  // Or return copy
  get queueCopy(): string[] {
    return [...this.#queue];
  }
}
```

### 6.2 Pitfall 2: Async State Transitions Without Guards

```typescript
// ❌ WRONG - Race condition
export class TaskOrchestrator {
  #processing = false;

  async processItem(): Promise<void> {
    if (this.#processing) return;
    this.#processing = true;

    await this.doWork();

    this.#processing = false;
  }
}

// ✅ CORRECT - Use finally guard
export class TaskOrchestrator {
  #processing = false;

  async processItem(): Promise<void> {
    if (this.#processing) return;
    this.#processing = true;

    try {
      await this.doWork();
    } finally {
      this.#processing = false; // Always executes
    }
  }
}
```

### 6.3 Pitfall 3: Constructor Side Effects

```typescript
// ❌ WRONG - Constructor has side effects
export class TaskOrchestrator {
  constructor(sessionManager: SessionManager) {
    this.validateSession(sessionManager); // May throw
    this.initializeBacklog(); // Async not allowed
    this.startProcessing(); // Unexpected side effect
  }
}

// ✅ CORRECT - Static factory method
export class TaskOrchestrator {
  private constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  static async create(
    sessionManager: SessionManager
  ): Promise<TaskOrchestrator> {
    const orchestrator = new TaskOrchestrator(sessionManager);
    await orchestrator.initialize();
    return orchestrator;
  }
}
```

### 6.4 Pitfall 4: Using `||` for Default Values

```typescript
// ❌ WRONG - Treats 0, '', false as falsy
constructor(timeout: number = 5000) {
  this.timeout = timeout || 5000; // 0 becomes 5000!
}

// ✅ CORRECT - Only null/undefined trigger default
constructor(timeout: number = 5000) {
  this.timeout = timeout ?? 5000; // 0 stays 0
}
```

### 6.5 Pitfall 5: Private Field Privacy Leaks

```typescript
// ❌ WRONG - Private field accessible via return value
export class TaskOrchestrator {
  #backlog: Backlog;

  get backlog(): Backlog {
    return this.#backlog; // Caller can modify nested properties!
  }
}

// ✅ CORRECT - Return readonly or copy
export class TaskOrchestrator {
  #backlog: Backlog;

  get backlog(): Readonly<Backlog> {
    return this.#backlog as Readonly<Backlog>; // Type-level only
  }

  get backlogCopy(): Backlog {
    return structuredClone(this.#backlog); // True copy
  }
}
```

## 7. Recommendations for TaskOrchestrator

### 7.1 Constructor Pattern

**Recommendation:** Keep current single required parameter (`sessionManager`).

```typescript
export class TaskOrchestrator {
  readonly sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
    // ... initialization
  }
}
```

**Rationale:**

- Single required dependency
- No configuration complexity yet
- Easy to extend with config object later if needed

### 7.2 Property Visibility

**Recommendation:** Keep current pattern with minor enhancements.

```typescript
export class TaskOrchestrator {
  // ✅ Public readonly for dependency injection
  readonly sessionManager: SessionManager;

  // ✅ Private field with getter for internal state
  #backlog: Backlog;

  // ✅ Getter provides read access
  get backlog(): Backlog {
    return this.#backlog;
  }

  // ✅ NEW: Defensive copy getter if needed
  get backlogCopy(): Backlog {
    return structuredClone(this.#backlog);
  }
}
```

**Rationale:**

- Maintains current API
- Clear ownership (SessionManager owns backlog state)
- Defensive copy available if mutations are a concern

### 7.3 Mid-Execution State Updates

**Recommendation:** Keep current `setStatus()` pattern with enhancements.

```typescript
export class TaskOrchestrator {
  #statusHistory: StatusChange[] = [];

  /**
   * Updates item status with validation, logging, and history
   */
  public async setStatus(
    itemId: string,
    status: Status,
    reason?: string
  ): Promise<void> {
    // Validation: Check transition is allowed
    // History: Snapshot for rollback/audit
    // Logging: Old → new with reason
    // Persistence: Through SessionManager
    // Refresh: Reload backlog after update
  }

  /**
   * Get status change history for an item
   */
  getStatusHistory(itemId: string): StatusChange[] {
    return this.#statusHistory.filter(change => change.itemId === itemId);
  }
}
```

**Rationale:**

- Current pattern is well-designed
- Add validation for state transitions
- Add history for debugging/audit
- Maintain explicit method naming (not fluent)

### 7.4 Queue Management

**Recommendation:** Keep current DFS traversal pattern with dependency-aware skipping.

```typescript
export class TaskOrchestrator {
  /**
   * Processes next pending item using DFS pre-order traversal
   * Skips items with unsatisfied dependencies
   */
  async processNextItem(): Promise<boolean> {
    const nextItem = getNextPendingItem(this.#backlog);

    if (nextItem === null) {
      return false;
    }

    // Skip blocked subtasks
    if (nextItem.type === 'Subtask') {
      if (!this.canExecute(nextItem)) {
        const blockers = this.getBlockingDependencies(nextItem);
        console.log(
          `Skipping ${nextItem.id}, blocked on:`,
          blockers.map(b => b.id)
        );
        return this.processNextItem(); // Try next item
      }
    }

    await this.#delegateByType(nextItem);
    await this.#refreshBacklog();

    return true;
  }
}
```

**Rationale:**

- DFS traversal respects hierarchy
- Dependency checking prevents invalid execution
- Recursive skipping handles blocked items
- Simple, predictable behavior

### 7.5 Immutability

**Recommendation:** Keep current mutable pattern with SessionManager as source of truth.

```typescript
export class TaskOrchestrator {
  /**
   * SessionManager is the single source of truth for backlog state.
   * This local property is a cached snapshot that is refreshed after updates.
   */
  readonly sessionManager: SessionManager;

  /**
   * Cached backlog snapshot (mutable reference to SessionManager state).
   * Always call #refreshBacklog() after SessionManager updates.
   */
  #backlog: Backlog;

  /**
   * Reloads backlog from SessionManager after status updates
   */
  async #refreshBacklog(): Promise<void> {
    const currentSession = this.sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot refresh backlog: no active session');
    }

    this.#backlog = currentSession.taskRegistry;
  }

  /**
   * Gets a defensive copy of the current backlog.
   * Use this if you need to modify backlog without affecting SessionManager.
   */
  getBacklogCopy(): Backlog {
    return structuredClone(this.#backlog);
  }
}
```

**Rationale:**

- SessionManager owns state (clear responsibility)
- Mutable updates are efficient and simple
- Reload pattern ensures consistency
- Defensive copy available if needed

**Future Enhancement:** If immutability becomes important (e.g., for undo/redo or state snapshots), consider adding Immer:

```typescript
import { produce, enableMapSet } from 'immer';

enableMapSet(); // Enable Map/Set support

export class TaskOrchestrator {
  async updateWithImmer(itemId: string, status: Status): Promise<void> {
    this.#backlog = produce(this.#backlog, draft => {
      const item = findItem(draft, itemId);
      if (item) {
        item.status = status;
      }
    });

    await this.sessionManager.saveBacklog(this.#backlog);
  }
}
```

## 8. URLs and References

### Official TypeScript Documentation

- **Classes Handbook:** https://www.typescriptlang.org/docs/handbook/2/classes.html
- **Parameter Properties:** https://www.typescriptlang.org/docs/handbook/2/parameter-properties.html
- **Accessors (Getters/Setters):** https://www.typescriptlang.org/docs/handbook/2/accessors.html
- **Declaration Merging:** https://www.typescriptlang.org/docs/handbook/declaration-merging.html
- **Decorators:** https://www.typescriptlang.org/docs/handbook/decorators.html

### State Management Libraries

- **Immer (Immutable updates with mutable syntax):** https://immerjs.github.io/immer/
- **Redux (State management patterns):** https://redux.js.org/
- **Zustand (Lightweight state management):** https://zustand-demo.pmnd.rs/
- **MobX (Reactive state management):** https://mobx.js.org/

### Best Practices

- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices
- **TypeScript Deep Dive:** https://basarat.gitbook.io/typescript/
- **Effective TypeScript:** https://effectivetypescript.com/

### Queue/Data Structure Libraries

- **typescript-collections:** https://github.com/lucasviola/Typescript-Collections
- **bucket.js (Priority queue):** https://github.com/nickpoorman/bucket
- **tinyqueue (Priority queue):** https://github.com/mourner/tinyqueue

### Testing Patterns

- **Testing Library:** https://testing-library.com/
- **Jest:** https://jestjs.io/
- **MSW (Mock Service Worker):** https://mswjs.io/

## 9. Summary of Key Recommendations

1. **Constructor:** Use single required parameter for SessionManager, extend with config object if needed
2. **Properties:** Keep current pattern (readonly for deps, private+getter for state)
3. **State Updates:** Keep explicit `setStatus()` method with validation and history
4. **Queue Management:** Keep current DFS traversal with dependency-aware skipping
5. **Immutability:** Keep mutable pattern with SessionManager as source of truth, consider Immer for future enhancements

**Current TaskOrchestrator design is solid.** Focus on documentation, validation, and history tracking rather than major refactoring.
