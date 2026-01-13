# Research: Scope-Based Task Execution & Queue Management Patterns

## Executive Summary

This document compiles best practices for scope-based task execution and dynamic queue reconfiguration in task orchestration systems. Research includes patterns from build systems (Bazel, npm), workflow orchestrators (Airflow, Temporal), and distributed task queues (Bull, Agenda).

**Key Finding**: Most production systems use a **two-phase approach**:
1. **Planning Phase**: Static scope calculation with dependency resolution
2. **Execution Phase**: Immutable execution queue with minimal runtime changes

Dynamic reconfiguration is typically handled through **cancellation + replan** rather than mid-execution mutation.

---

## Table of Contents

1. [Design Patterns for Scoped Execution](#1-design-patterns-for-scoped-execution)
2. [Queue Management Patterns](#2-queue-management-patterns)
3. [setScope/scope-update Implementations](#3-setscope-scope-update-functionality)
4. [Mid-Execution Reconfiguration](#4-mid-execution-reconfiguration)
5. [Common Pitfalls](#5-common-pitfalls)
6. [Code Examples](#6-code-examples)
7. [Reference URLs](#7-reference-urls)

---

## 1. Design Patterns for Scoped Execution

### 1.1 Pattern: Static Scope Calculation (Preferred)

**Description**: Calculate execution scope once before execution begins. Scope is immutable during execution.

**Pros**:
- Predictable execution order
- Easier dependency resolution
- Simpler state management
- Better testability

**Cons**:
- Less flexible for interactive use cases
- Requires full restart to change scope

**Implementation**:

```typescript
interface ExecutionPlan {
  scope: ScopePattern;
  queue: TaskQueue[];
  dependencies: DependencyGraph;
}

class TaskOrchestrator {
  private plan: ExecutionPlan | null = null;

  // ONE-TIME scope calculation
  async setScope(scope: ScopePattern): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Cannot change scope during execution');
    }

    // Calculate all tasks matching scope
    const tasks = this.filterByScope(scope);

    // Resolve dependencies
    const dependencies = this.resolveDependencies(tasks);

    // Build execution queue
    const queue = this.buildQueue(tasks, dependencies);

    // Store plan (immutable)
    this.plan = { scope, queue, dependencies };
  }

  async execute(): Promise<void> {
    if (!this.plan) throw new Error('No scope set');
    this.isExecuting = true;

    for (const task of this.plan.queue) {
      await this.executeTask(task);
    }
  }
}
```

**Used By**: Bazel, Gradle, Nx, Turborepo

---

### 1.2 Pattern: Lazy Scope Evaluation (Dynamic)

**Description**: Calculate next task on-demand based on current scope and state.

**Pros**:
- Interactive scope changes
- Memory efficient for large backlogs
- Supports live filtering

**Cons**:
- Complex dependency tracking
- Potential for infinite loops
- Harder to reason about

**Implementation**:

```typescript
class DynamicTaskOrchestrator {
  private scope: ScopePattern = { phase: '*', milestone: '*', task: '*', subtask: '*' };

  // ALLOWED to change during execution
  updateScope(newScope: ScopePattern): void {
    this.scope = newScope;
    // Existing tasks continue, new tasks use new scope
  }

  async getNextTask(): Promise<Task | null> {
    // Calculate next task based on CURRENT scope
    const candidates = this.getCandidateTasks(this.scope);

    // Filter by dependencies
    const ready = candidates.filter(t => this.canExecute(t));

    return ready[0] || null;
  }
}
```

**Used By**: npm-workspaces, Lerna (with caveats), Airflow (manual triggers)

---

### 1.3 Pattern: Filtered Iterator Pattern

**Description**: Iterator that applies scope filter to underlying data structure.

**Pros**:
- Clean separation of concerns
- Memory efficient
- Composable filters

**Cons**:
- Hard to cache results
- Repeated filter calculations

**Implementation**:

```typescript
class ScopedTaskIterator {
  constructor(
    private backlog: Backlog,
    private scope: ScopePattern
  ) {}

  // Generator-based lazy evaluation
  *[Symbol.iterator](): Generator<Task> {
    for (const phase of this.backlog.backlog) {
      if (!this.matchesScope(phase.id)) continue;

      for (const milestone of phase.milestones) {
        if (!this.matchesScope(milestone.id)) continue;

        for (const task of milestone.tasks) {
          if (!this.matchesScope(task.id)) continue;

          for (const subtask of task.subtasks) {
            if (this.matchesScope(subtask.id)) {
              yield subtask;
            }
          }
        }
      }
    }
  }

  private matchesScope(itemId: string): boolean {
    // Scope matching logic
    return true; // Simplified
  }
}
```

**Used By**: Rust iterators, Python generators, lazy sequence libraries

---

### 1.4 Pattern: Incremental Scope Refinement

**Description**: Start with broad scope, progressively narrow during execution.

**Pros**:
- Natural for exploratory workflows
- Supports "focus mode" interactions
- Good for debugging

**Cons**:
- Requires careful dependency handling
- Can skip important tasks

**Implementation**:

```typescript
class IncrementalOrchestrator {
  private scope: ScopePattern = { phase: '*', milestone: '*', task: '*', subtask: '*' };
  private executed: Set<string> = new Set();

  async execute(): Promise<void> {
    while (true) {
      const next = this.getNextTask();
      if (!next) break;

      await this.executeTask(next);
      this.executed.add(next.id);

      // User can narrow scope between tasks
      if (this.shouldNarrowScope()) {
        this.scope = this.getNarrowerScope();
      }
    }
  }

  private shouldNarrowScope(): boolean {
    // Interactive prompt or automatic detection
    return false;
  }
}
```

**Used By**: Interactive debuggers, REPL systems, some CI/CD tools

---

## 2. Queue Management Patterns

### 2.1 Pattern: Immutable Queue with Rebuild

**Description**: Queue is immutable. Scope changes require rebuilding queue.

**Pros**:
- Thread-safe by default
- Easy to reason about
- Simple rollback

**Cons**:
- O(n) rebuild cost
- Not suitable for high-frequency changes

**Implementation**:

```typescript
class ImmutableQueueOrchestrator {
  private queue: readonly Task[] = [];
  private currentIndex = 0;

  setScope(scope: ScopePattern): void {
    // Rebuild entire queue
    this.queue = this.buildQueue(scope);
    this.currentIndex = 0;
  }

  private buildQueue(scope: ScopePattern): Task[] {
    // Topological sort with scope filter
    return this.topologicalSort(
      this.filterByScope(scope)
    );
  }

  async processNext(): Promise<boolean> {
    if (this.currentIndex >= this.queue.length) {
      return false;
    }

    const task = this.queue[this.currentIndex];
    await this.executeTask(task);
    this.currentIndex++;
    return true;
  }
}
```

**Used By**: Most build systems (Bazel, webpack), Git (commit ordering)

---

### 2.2 Pattern: Priority Queue with Dynamic Insertion

**Description**: Tasks prioritized by dependencies. New tasks inserted at correct position.

**Pros**:
- Supports dynamic task addition
- Efficient for incremental updates
- Natural for dependency-based ordering

**Cons**:
- Complex implementation
- Potential for priority inversion
- Harder to predict execution order

**Implementation**:

```typescript
import { PriorityQueue } from 'priorityqueue-typescript';

interface PriorityTask {
  task: Task;
  priority: number; // Lower = higher priority
}

class DynamicQueueOrchestrator {
  private queue = new PriorityQueue<PriorityTask>(
    (a, b) => a.priority - b.priority
  );

  addTask(task: Task): void {
    const priority = this.calculatePriority(task);
    this.queue.enqueue({ task, priority });
  }

  updateScope(newScope: ScopePattern): void {
    // Remove tasks not in new scope
    const filtered = Array.from(this.queue)
      .filter(({ task }) => this.matchesScope(task.id, newScope));

    // Rebuild queue
    this.queue = new PriorityQueue<PriorityTask>(
      (a, b) => a.priority - b.priority
    );
    filtered.forEach(item => this.queue.enqueue(item));

    // Add newly-visible tasks
    const newTasks = this.getTasksInScope(newScope);
    newTasks.forEach(task => this.addTask(task));
  }

  private calculatePriority(task: Task): number {
    // Lower priority for tasks with more unsatisfied dependencies
    const blockers = this.getBlockingDependencies(task);
    return blockers.length;
  }
}
```

**Used By**: Bull (Redis queue), Agenda (MongoDB queue), Celery

---

### 2.3 Pattern: Double-Buffered Queue

**Description**: Two queues - active (immutable) and staging (mutable). Swap on scope change.

**Pros**:
- Safe atomic transitions
- Preview changes before applying
- Easy rollback

**Cons**:
- Double memory usage
- Stale data during staging

**Implementation**:

```typescript
class DoubleBufferedOrchestrator {
  private activeQueue: Task[] = [];
  private stagingQueue: Task[] = [];

  // Modify staging queue
  updateScope(newScope: ScopePattern): void {
    this.stagingQueue = this.buildQueue(newScope);

    // Preview changes
    const diff = this.calculateDiff(this.activeQueue, this.stagingQueue);
    console.log('Planned changes:', diff);
  }

  // Atomic swap
  async applyScope(): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Cannot apply scope during execution');
    }

    this.activeQueue = this.stagingQueue;
    this.stagingQueue = [];
  }

  private calculateDiff(oldQueue: Task[], newQueue: Task[]): QueueDiff {
    const added = newQueue.filter(t => !oldQueue.find(o => o.id === t.id));
    const removed = oldQueue.filter(t => !newQueue.find(n => n.id === t.id));
    const reordered = this.findReordered(oldQueue, newQueue);

    return { added, removed, reordered };
  }
}
```

**Used By**: Graphics rendering (double buffering), Database transaction logs

---

### 2.4 Pattern: Stream-Based Queue

**Description**: Queue as transform stream. Scope changes injected as control signals.

**Pros**:
- Natural async/await flow
- Backpressure handling
- Composable with other streams

**Cons**:
- Harder to debug
- Stream complexity
- Error propagation challenges

**Implementation**:

```typescript
import { Readable, Transform } from 'stream';

class StreamOrchestrator {
  private controlStream = new Readable({
    objectMode: true,
    read() {}
  });

  private taskStream = this.createTaskStream();

  private createTaskStream(): Transform {
    return new Transform({
      objectMode: true,
      transform: (task: Task | ControlSignal, _, callback) => {
        if (this.isControlSignal(task)) {
          // Handle scope change
          this.applyNewScope(task.scope);
          callback();
        } else {
          // Execute task
          this.executeTask(task as Task)
            .then(() => callback())
            .catch(err => callback(err));
        }
      }
    });
  }

  updateScope(newScope: ScopePattern): void {
    // Inject control signal into stream
    this.controlStream.push({ type: 'scope-change', scope: newScope });
  }
}
```

**Used By**: Node.js streams, RxJS, Reactive programming systems

---

## 3. setScope/scope-update Functionality

### 3.1 Direct Scope Assignment (Simple)

**Description**: Direct setter with validation. No state preservation.

**Example**: Nx CLI

```typescript
class NxStyleOrchestrator {
  private scope: string[] = [];

  setScope(projects: string[]): void {
    // Validate project IDs
    const valid = projects.every(p => this.isValidProject(p));
    if (!valid) {
      throw new Error('Invalid project IDs');
    }

    this.scope = projects;
  }
}
```

**Reference**:
- https://nx.dev/reference/nx-json#default-projects-and-tasks
- https://nx.dev/features/run-tasks#nx-run-many

---

### 3.2 Incremental Scope Update (Preserve State)

**Description**: Add/remove from existing scope while preserving execution state.

**Example**: Bazel target pattern expansion

```typescript
class BazelStyleOrchestrator {
  private scope: Set<string> = new Set();
  private executed: Set<string> = new Set();

  // Add to scope
  addToScope(patterns: string[]): void {
    const expanded = this.expandPatterns(patterns);
    expanded.forEach(id => this.scope.add(id));
  }

  // Remove from scope
  removeFromScope(patterns: string[]): void {
    const expanded = this.expandPatterns(patterns);
    expanded.forEach(id => {
      this.scope.delete(id);
      // Keep executed status even if removed from scope
    });
  }

  // Check if task should execute
  shouldExecute(taskId: string): boolean {
    return this.scope.has(taskId) && !this.executed.has(taskId);
  }

  private expandPatterns(patterns: string[]): string[] {
    // Expand "P1.*" to ["P1.M1.T1.S1", "P1.M1.T2.S1", ...]
    // Bazel uses complex query language for this
    return []; // Simplified
  }
}
```

**Reference**:
- https://bazel.build/concepts/labels#target-patterns
- https://bazel.build/docs/user-manual#execution-options

---

### 3.3 Scope Diff & Reconciliation

**Description**: Calculate diff between old and new scope, apply minimal changes.

**Example**: Git branch switching

```typescript
class DiffBasedOrchestrator {
  private currentScope: ScopePattern;
  private executed: Map<string, TaskResult> = new Map();

  async setScope(newScope: ScopePattern): Promise<void> {
    const diff = this.calculateScopeDiff(this.currentScope, newScope);

    // Apply minimal changes
    await this.applyScopeDiff(diff);

    this.currentScope = newScope;
  }

  private calculateScopeDiff(
    oldScope: ScopePattern,
    newScope: ScopePattern
  ): ScopeDiff {
    const oldTasks = this.getTasksInScope(oldScope);
    const newTasks = this.getTasksInScope(newScope);

    const added = newTasks.filter(t => !oldTasks.find(o => o.id === t.id));
    const removed = oldTasks.filter(t => !newTasks.find(n => n.id === t.id));
    const common = oldTasks.filter(t => newTasks.find(n => n.id === t.id));

    return { added, removed, common };
  }

  private async applyScopeDiff(diff: ScopeDiff): Promise<void> {
    // Remove tasks no longer in scope (keep execution history)
    for (const task of diff.removed) {
      this.removeFromQueue(task.id);
    }

    // Add newly-visible tasks
    for (const task of diff.added) {
      const canExecute = this.canExecuteNow(task);
      if (canExecute) {
        this.addToQueue(task);
      }
    }

    // Re-prioritize common tasks
    this.reprioritize(diff.common);
  }
}
```

**Reference**:
- https://git-scm.com/docs/git-checkout
- Database migration tools (Flyway, Alembic)

---

## 4. Mid-Execution Reconfiguration

### 4.1 Pattern: Stop-The-World Reconfiguration

**Description**: Pause execution, reconfigure, resume from last checkpoint.

**Pros**:
- Consistent state
- Simple to implement
- Easy to rollback

**Cons**:
- Interrupts workflow
- Not suitable for long-running tasks

**Implementation**:

```typescript
class CheckpointedOrchestrator {
  private paused = false;
  private checkpoint?: ExecutionCheckpoint;

  async updateScopeMidExecution(newScope: ScopePattern): Promise<void> {
    // 1. Pause
    this.paused = true;
    await this.waitForCurrentTask();

    // 2. Save checkpoint
    this.checkpoint = this.createCheckpoint();

    // 3. Reconfigure
    this.setScope(newScope);

    // 4. Resume
    this.paused = false;
  }

  private async waitForCurrentTask(): Promise<void> {
    // Wait for atomic completion point
    while (this.isTaskRunning) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private createCheckpoint(): ExecutionCheckpoint {
    return {
      executed: Array.from(this.executed),
      currentIndex: this.currentIndex,
      timestamp: Date.now()
    };
  }
}
```

**Used By**: Live code reloading (Node.js --watch), Hot Module Replacement

---

### 4.2 Pattern: Graceful Drain & Refill

**Description**: Finish current tasks, then rebuild queue with new scope.

**Pros**:
- No task interruption
- Clean transition
- Good for queue-based systems

**Cons**:
- Delay before new scope active
- Wastes work on deprecated tasks

**Implementation**:

```typescript
class DrainRefillOrchestrator {
  private draining = false;
  private refillScope?: ScopePattern;

  async updateScope(newScope: ScopePattern): Promise<void> {
    this.draining = true;
    this.refillScope = newScope;

    // Stop accepting new tasks
    this.stopAcceptingTasks();

    // Wait for queue to drain
    await this.drainQueue();

    // Refill with new scope
    this.refillQueue(newScope);

    this.draining = false;
    this.refillScope = undefined;
  }

  private async drainQueue(): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.queue.isEmpty) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private refillQueue(scope: ScopePattern): void {
    const tasks = this.getTasksInScope(scope);
    tasks.forEach(task => this.enqueueTask(task));
  }
}
```

**Used By**: Kubernetes rolling updates, Load balancer reconfiguration

---

### 4.3 Pattern: Dual-Phase Execution

**Description**: Old scope finishes, new scope starts in parallel, merge results.

**Pros**:
- No interruption
- Graceful overlap
- Supports A/B testing

**Cons**:
- Resource contention
- Complex result merging
- Potential for duplicate work

**Implementation**:

```typescript
class DualPhaseOrchestrator {
  private activePhase: ExecutionPhase = 'primary';
  private primaryQueue: Task[] = [];
  private secondaryQueue: Task[] = [];

  async updateScope(newScope: ScopePattern): Promise<void> {
    // Start secondary phase with new scope
    this.activePhase = 'secondary';
    this.secondaryQueue = this.buildQueue(newScope);

    // Continue primary to completion
    await this.drainQueue(this.primaryQueue);

    // Promote secondary to primary
    this.primaryQueue = this.secondaryQueue;
    this.secondaryQueue = [];
    this.activePhase = 'primary';
  }

  private async drainQueue(queue: Task[]): Promise<void> {
    while (queue.length > 0) {
      const task = queue.shift()!;
      await this.executeTask(task);
    }
  }
}
```

**Used By**: Blue-green deployment, Database migration (dual-write phase)

---

### 4.4 Pattern: Cancel & Replan (Recommended)

**Description**: Cancel pending work, replan with new scope, restart execution.

**Pros**:
- Simple mental model
- Consistent state
- Easy to implement

**Cons**:
- Loses in-flight work
- Not suitable for critical tasks

**Implementation**:

```typescript
class CancelReplanOrchestrator {
  async updateScope(newScope: ScopePattern): Promise<void> {
    // 1. Cancel pending tasks
    const cancelled = this.cancelPendingTasks();

    // 2. Save completed work
    this.saveCompletedState();

    // 3. Rebuild queue with new scope
    this.setScope(newScope);

    // 4. Resume execution
    await this.execute();
  }

  private cancelPendingTasks(): Task[] {
    const pending = this.queue.filter(t => t.status !== 'Complete');
    pending.forEach(task => {
      task.status = 'Cancelled';
    });
    return pending;
  }

  private saveCompletedState(): void {
    // Persist completed tasks to session
    this.sessionManager.saveExecutionState({
      completed: this.getCompletedTasks()
    });
  }
}
```

**Used By**: Most CI/CD systems (Jenkins, GitHub Actions), Airflow (clear + rerun)

**Reference**:
- https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html#clearing-task-instances
- https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepscontinue-on-error

---

## 5. Common Pitfalls

### 5.1 Race Conditions in Scope Updates

**Problem**: Scope changes while task is executing, causing inconsistent state.

**Bad Code**:
```typescript
// RACE CONDITION
async executeTask(task: Task): Promise<void> {
  // Task starts with scope P1
  await this.doWork(task);
  // Scope changes to P2 mid-execution
  await this.saveResult(task); // Saves to wrong scope!
}
```

**Fix**: Use immutable scope snapshots:
```typescript
async executeTask(task: Task): Promise<void> {
  // Capture scope at start
  const scopeSnapshot = this.currentScope;

  await this.doWork(task);
  await this.saveResult(task, scopeSnapshot); // Use snapshot
}
```

---

### 5.2 Dependency Invalidation

**Problem**: Changing scope removes dependencies that already executed.

**Scenario**:
1. Task A (dependency) executes in scope P1
2. Scope changes to P2 (excludes A)
3. Task B (depends on A) can't find A
4. System breaks

**Fix**: Keep executed tasks regardless of scope:
```typescript
class DependencyAwareOrchestrator {
  private executedTasks: Map<string, Task> = new Map();
  private currentScope: Set<string> = new Set();

  canExecute(task: Task): boolean {
    // Check dependencies in EXECUTED tasks, not current scope
    const dependencies = task.dependencies.map(depId =>
      this.executedTasks.get(depId)
    );

    return dependencies.every(dep => dep?.status === 'Complete');
  }

  setScope(newScope: Set<string>): void {
    this.currentScope = newScope;
    // Keep executedTasks intact!
  }
}
```

---

### 5.3 Lost Updates

**Problem**: Scope changes discard in-progress task results.

**Bad Code**:
```typescript
// Loses task3 result
setScope(newScope) {
  this.queue = this.buildQueue(newScope); // Discards old queue
}
```

**Fix**: Preserve execution history:
```typescript
setScope(newScope: ScopePattern): void {
  const completed = this.getCompletedTasks();

  this.queue = this.buildQueue(newScope);

  // Restore completed tasks
  completed.forEach(task => {
    this.queue.insert(task);
  });
}
```

---

### 5.4 Infinite Loops

**Problem**: Dynamic scope evaluation creates cycles.

**Scenario**:
1. Task A completes, triggers scope update
2. Scope update adds Task B (dependency of A)
3. Task B fails, triggers scope update
4. Scope update adds Task A again
5. Loop forever

**Fix**: Idempotency checks:
```typescript
class IdempotentOrchestrator {
  private scopeHistory: ScopePattern[] = [];

  setScope(newScope: ScopePattern): void {
    // Check for cycles
    if (this.seenScope(newScope)) {
      throw new Error('Scope cycle detected');
    }

    this.scopeHistory.push(newScope);
    this.currentScope = newScope;
  }

  private seenScope(scope: ScopePattern): boolean {
    return this.scopeHistory.some(s => this.equals(s, scope));
  }
}
```

---

### 5.5 Memory Leaks

**Problem**: Incremental scope updates accumulate garbage.

**Bad Code**:
```typescript
// Memory leak - never removes old tasks
updateScope(newScope: ScopePattern): void {
  const newTasks = this.getTasks(newScope);
  this.tasks.push(...newTasks); // Just adds, never removes
}
```

**Fix**: Explicit cleanup:
```typescript
updateScope(newScope: ScopePattern): void {
  const newTaskIds = new Set(this.getTasks(newScope).map(t => t.id));

  // Remove old tasks
  this.tasks = this.tasks.filter(t => newTaskIds.has(t.id));

  // Add new tasks
  const newTasks = this.getTasks(newScope);
  this.tasks.push(...newTasks);
}
```

---

## 6. Code Examples

### 6.1 Complete Immutable Queue Implementation

```typescript
/**
 * Immutable queue orchestrator with rebuild-on-scope-change
 *
 * Pattern: Static scope calculation + immutable execution
 * Use case: Build systems, CI/CD pipelines
 */

interface ScopePattern {
  phase?: number | '*';
  milestone?: number | '*';
  task?: number | '*';
  subtask?: number | '*';
}

interface TaskQueueItem {
  task: Task;
  dependencies: string[];
  depth: number; // For topological sort tiebreaker
}

class ImmutableQueueOrchestrator {
  private queue: readonly TaskQueueItem[] = [];
  private currentIndex = 0;
  private executed = new Set<string>();
  private isExecuting = false;

  constructor(private backlog: Backlog) {}

  /**
   * Set execution scope (ONLY when not executing)
   * Rebuilds entire queue with topological sort
   */
  setScope(scope: ScopePattern): void {
    if (this.isExecuting) {
      throw new Error(
        'Cannot change scope during execution. ' +
        'Use cancel() first.'
      );
    }

    // 1. Filter tasks by scope
    const tasks = this.filterByScope(scope);

    // 2. Build dependency graph
    const graph = this.buildDependencyGraph(tasks);

    // 3. Topological sort
    const sorted = this.topologicalSort(graph);

    // 4. Store as immutable array
    this.queue = Object.freeze(sorted);
    this.currentIndex = 0;

    console.log(`[Orchestrator] Scope set: ${JSON.stringify(scope)}`);
    console.log(`[Orchestrator] Queue size: ${this.queue.length}`);
  }

  /**
   * Execute all tasks in queue
   */
  async execute(): Promise<void> {
    this.isExecuting = true;

    try {
      while (this.currentIndex < this.queue.length) {
        const item = this.queue[this.currentIndex];

        if (this.executed.has(item.task.id)) {
          this.currentIndex++;
          continue;
        }

        // Check dependencies
        if (!this.areDependenciesComplete(item)) {
          console.log(
            `[Orchestrator] Skipping ${item.task.id} (dependencies not met)`
          );
          this.currentIndex++;
          continue;
        }

        // Execute task
        await this.executeTask(item.task);
        this.executed.add(item.task.id);
        this.currentIndex++;
      }
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Cancel execution and reset
   */
  cancel(): void {
    this.isExecuting = false;
    this.currentIndex = 0;
    console.log('[Orchestrator] Execution cancelled');
  }

  /**
   * Get execution progress
   */
  getProgress(): { completed: number; total: number } {
    return {
      completed: this.executed.size,
      total: this.queue.length
    };
  }

  // Private helpers

  private filterByScope(scope: ScopePattern): Task[] {
    const tasks: Task[] = [];

    for (const phase of this.backlog.backlog) {
      if (!this.matchesId(phase.id, scope.phase, 'P')) continue;

      for (const milestone of phase.milestones) {
        if (!this.matchesId(milestone.id, scope.milestone, 'M')) continue;

        for (const task of milestone.tasks) {
          if (!this.matchesId(task.id, scope.task, 'T')) continue;

          for (const subtask of task.subtasks) {
            if (!this.matchesId(subtask.id, scope.subtask, 'S')) continue;

            tasks.push(subtask);
          }
        }
      }
    }

    return tasks;
  }

  private matchesId(
    id: string,
    scopeValue: number | '*' | undefined,
    prefix: string
  ): boolean {
    if (scopeValue === undefined || scopeValue === '*') return true;

    const num = parseInt(id.slice(prefix.length).split('.')[0], 10);
    return num === scopeValue;
  }

  private buildDependencyGraph(tasks: Task[]): Map<string, TaskQueueItem> {
    const taskMap = new Map<string, Task>();
    tasks.forEach(t => taskMap.set(t.id, t));

    const items = new Map<string, TaskQueueItem>();

    for (const task of tasks) {
      const dependencies = task.dependencies || [];
      const depth = this.calculateDepth(task, taskMap, new Set());

      items.set(task.id, {
        task,
        dependencies,
        depth
      });
    }

    return items;
  }

  private calculateDepth(
    task: Task,
    taskMap: Map<string, Task>,
    visiting: Set<string>
  ): number {
    if (visiting.has(task.id)) {
      throw new Error(`Circular dependency detected: ${task.id}`);
    }

    const dependencies = task.dependencies || [];
    if (dependencies.length === 0) return 0;

    visiting.add(task.id);

    const maxDep = Math.max(
      ...dependencies.map(depId => {
        const dep = taskMap.get(depId);
        if (!dep) return 0;
        return this.calculateDepth(dep, taskMap, visiting);
      })
    );

    visiting.delete(task.id);

    return maxDep + 1;
  }

  private topologicalSort(graph: Map<string, TaskQueueItem>): TaskQueueItem[] {
    const items = Array.from(graph.values());

    // Sort by depth (dependencies first), then by ID for determinism
    return items.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.task.id.localeCompare(b.task.id);
    });
  }

  private areDependenciesComplete(item: TaskQueueItem): boolean {
    return item.dependencies.every(depId => this.executed.has(depId));
  }

  private async executeTask(task: Task): Promise<void> {
    console.log(`[Orchestrator] Executing: ${task.id} - ${task.title}`);
    // Actual execution implementation here
    task.status = 'Complete';
  }
}
```

---

### 6.2 Complete Dynamic Scope Implementation

```typescript
/**
 * Dynamic scope orchestrator with runtime scope updates
 *
 * Pattern: Lazy evaluation + dynamic scope changes
 * Use case: Interactive workflows, debugging sessions
 */

class DynamicScopeOrchestrator {
  private scope: ScopePattern = {
    phase: '*',
    milestone: '*',
    task: '*',
    subtask: '*'
  };
  private executed = new Set<string>();
  private blocked = new Set<string>();

  /**
   * Update scope during execution
   * Affects future getNextTask() calls only
   */
  updateScope(newScope: ScopePattern): void {
    const oldScope = { ...this.scope };
    this.scope = newScope;

    console.log(`[Orchestrator] Scope updated:`);
    console.log(`  Old: ${JSON.stringify(oldScope)}`);
    console.log(`  New: ${JSON.stringify(newScope)}`);

    // Clear blocked set - re-evaluate with new scope
    this.blocked.clear();
  }

  /**
   * Get next executable task based on current scope
   * Returns null if no tasks available
   */
  async getNextTask(): Promise<Task | null> {
    const candidates = this.getCandidateTasks();

    // Filter by dependencies
    const ready = candidates.filter(t => this.canExecute(t));

    if (ready.length === 0) {
      // All remaining tasks are blocked
      this.blocked = new Set(candidates.map(t => t.id));
      return null;
    }

    // Return first ready task
    return ready[0];
  }

  /**
   * Mark task as complete
   */
  markComplete(taskId: string): void {
    this.executed.add(taskId);
    this.blocked.delete(taskId);
  }

  /**
   * Get status of all tasks in current scope
   */
  getScopeStatus(): {
    total: number;
    completed: number;
    blocked: number;
    pending: number;
  } {
    const candidates = this.getCandidateTasks();

    return {
      total: candidates.length,
      completed: candidates.filter(t => this.executed.has(t.id)).length,
      blocked: candidates.filter(t => this.blocked.has(t.id)).length,
      pending: candidates.filter(t =>
        !this.executed.has(t.id) && !this.blocked.has(t.id)
      ).length
    };
  }

  // Private helpers

  private getCandidateTasks(): Task[] {
    // Re-calculate on each call (dynamic!)
    const tasks: Task[] = [];

    for (const phase of this.backlog.backlog) {
      if (!this.matchesScope(phase.id, 'phase')) continue;

      for (const milestone of phase.milestones) {
        if (!this.matchesScope(milestone.id, 'milestone')) continue;

        for (const task of milestone.tasks) {
          if (!this.matchesScope(task.id, 'task')) continue;

          for (const subtask of task.subtasks) {
            if (!this.matchesScope(subtask.id, 'subtask')) continue;

            // Skip already executed
            if (this.executed.has(subtask.id)) continue;

            tasks.push(subtask);
          }
        }
      }
    }

    return tasks;
  }

  private matchesScope(id: string, level: keyof ScopePattern): boolean {
    const scopeValue = this.scope[level];
    if (scopeValue === undefined || scopeValue === '*') return true;

    const prefix = level.charAt(0).toUpperCase(); // 'phase' -> 'P'
    const num = parseInt(id.slice(1).split('.')[0], 10);

    return num === scopeValue;
  }

  private canExecute(task: Task): boolean {
    const dependencies = task.dependencies || [];
    return dependencies.every(depId => this.executed.has(depId));
  }
}
```

---

### 6.3 Hybrid Implementation (Recommended)

```typescript
/**
 * Hybrid orchestrator: immutable planning + graceful reconfiguration
 *
 * Pattern: Immutable plan with drain-and-refill on scope change
 * Use case: Long-running workflows with occasional scope adjustments
 */

class HybridOrchestrator {
  private plan: ExecutionPlan | null = null;
  private isExecuting = false;
  private draining = false;
  private pendingScopeChange: ScopePattern | null = null;

  /**
   * Set initial scope before execution
   */
  async setScope(scope: ScopePattern): Promise<void> {
    if (this.isExecuting) {
      // Request scope change (will apply after drain)
      this.pendingScopeChange = scope;
      return;
    }

    // Build initial plan
    this.plan = await this.buildPlan(scope);
    console.log(`[Orchestrator] Initial scope set: ${JSON.stringify(scope)}`);
  }

  /**
   * Execute tasks with graceful scope change support
   */
  async execute(): Promise<void> {
    if (!this.plan) throw new Error('No scope set');

    this.isExecuting = true;

    try {
      while (this.plan.currentIndex < this.plan.queue.length) {
        // Check for pending scope change
        if (this.pendingScopeChange) {
          await this.applyScopeChange();
          if (!this.plan) break; // Plan rebuilt
          continue;
        }

        const item = this.plan.queue[this.plan.currentIndex];

        // Skip already executed
        if (item.executed) {
          this.plan.currentIndex++;
          continue;
        }

        // Check dependencies
        if (!this.areDependenciesComplete(item)) {
          this.plan.currentIndex++;
          continue;
        }

        // Execute
        await this.executeTask(item.task);
        item.executed = true;
        this.plan.currentIndex++;
      }
    } finally {
      this.isExecuting = false;
      this.draining = false;
    }
  }

  /**
   * Get current execution status
   */
  getStatus(): {
    executing: boolean;
    draining: boolean;
    pendingScopeChange: boolean;
    progress: { completed: number; total: number };
  } {
    return {
      executing: this.isExecuting,
      draining: this.draining,
      pendingScopeChange: this.pendingScopeChange !== null,
      progress: this.plan ? {
        completed: this.plan.queue.filter(i => i.executed).length,
        total: this.plan.queue.length
      } : { completed: 0, total: 0 }
    };
  }

  // Private helpers

  private async applyScopeChange(): Promise<void> {
    if (!this.pendingScopeChange) return;

    const newScope = this.pendingScopeChange;
    console.log(`[Orchestrator] Applying scope change: ${JSON.stringify(newScope)}`);

    // Mark draining
    this.draining = true;

    // Save current state
    const executedItems = this.plan!.queue.filter(i => i.executed);

    // Build new plan with new scope
    const newPlan = await this.buildPlan(newScope);

    // Restore executed tasks
    for (const executed of executedItems) {
      const existing = newPlan.queue.find(i => i.task.id === executed.task.id);
      if (existing) {
        existing.executed = true;
      }
    }

    // Find new index (first unexecuted task)
    newPlan.currentIndex = newPlan.queue.findIndex(i => !i.executed);
    if (newPlan.currentIndex === -1) {
      newPlan.currentIndex = newPlan.queue.length;
    }

    // Apply new plan
    this.plan = newPlan;
    this.pendingScopeChange = null;
    this.draining = false;

    console.log(`[Orchestrator] Scope change applied. Queue: ${newPlan.queue.length} tasks`);
  }

  private async buildPlan(scope: ScopePattern): Promise<ExecutionPlan> {
    // Implementation from ImmutableQueueOrchestrator
    // ...
    return {
      scope,
      queue: [],
      currentIndex: 0
    };
  }

  private areDependenciesComplete(item: QueueItem): boolean {
    // Check dependencies
    return true;
  }

  private async executeTask(task: Task): Promise<void> {
    console.log(`[Orchestrator] Executing: ${task.id}`);
    // Actual execution
  }
}

interface ExecutionPlan {
  scope: ScopePattern;
  queue: QueueItem[];
  currentIndex: number;
}

interface QueueItem {
  task: Task;
  dependencies: string[];
  depth: number;
  executed: boolean;
}
```

---

## 7. Reference URLs

### Build Systems (Scope/Target Patterns)

**Bazel**
- Target Patterns: https://bazel.build/concepts/labels#target-patterns
- Query Language: https://bazel.build/docs/query
- Execution Phases: https://bazel.build/docs/user-manual#execution-options
- Target Wildcards: https://bazel.build/reference/be/common-definitions#common-target-attributes

**Gradle**
- Task Selection: https://docs.gradle.org/current/userguide/command_line_interface.html#sec:executing_tasks
- Include/Exclude Patterns: https://docs.gradle.org/current/userguide/task_configuration_avoidance.html
- Continuous Build: https://docs.gradle.org/current/userguide/continuous_build.html

**Nx (Monorepo)**
- Run Many Tasks: https://nx.dev/features/run-tasks
- Project Filtering: https://nx.dev/features/nx-json#default-projects-and-tasks
- Affected Graph: https://nx.dev/features/affected

**Turborepo**
- Task Filtering: https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks
- Scope Options: https://turbo.build/repo/docs/reference/command-line-reference#--filter

### Package Managers

**npm/yarn workspaces**
- Workspace Filtering: https://classic.yarnpkg.com/en/docs/workspaces/
- npm-run-all patterns: https://www.npmjs.com/package/npm-run-all

**Lerna**
- Scope Flag: https://lerna.js.org/docs/features/running-tasks-in-pipeline#--scope-string
- Filter Dependencies: https://lerna.js.org/docs/features/running-tasks-in-pipeline#--include-filtered-dependencies

### Workflow Orchestrators

**Airflow**
- Task Instances: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html#task-instances
- Clearing Tasks: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html#clearing-task-instances
- Manual Triggers: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html#task-depending-on-past

**Temporal**
- Workflow Updates: https://docs.temporal.io/dev-guide/typescript/update
- Signals: https://docs.temporal.io/dev-guide/typescript/workflows#signals

**Prefect**
- Task Concurrency: https://docs.prefect.io/latest/concepts/tasks/
- Dynamic Tasks: https://docs.prefect.io/latest/guides/dynamic-tasks/

### Task Queues

**Bull (Redis)**
- Queue Management: https://docs.bullmq.io/patterns/priority-queues
- Job Scheduling: https://docs.bullmq.io/patterns/job-scheduling

**Agenda (MongoDB)**
- Task Scheduling: https://github.com/agenda/agenda#defining-job-processed

### Best Practices

**Google Cloud (Task Queues)**
- Task Routing: https://cloud.google.com/tasks/docs/reference/rpc/google.cloud.tasks.v2#task
- Queue Management: https://cloud.google.com/tasks/docs/reference/rpc/google.cloud.tasks.v2#queue

**AWS Step Functions**
- State Machines: https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-state-machine-structure.html

**GitHub Actions**
- Workflow Re-use: https://docs.github.com/en/actions/using-workflows/reusing-workflows

---

## 8. Key Takeaways

### Recommended Pattern for Your System

Based on your `TaskOrchestrator` implementation and the PRD requirements:

**Use Pattern: Immutable Queue with Drain-and-Refill**

```typescript
class TaskOrchestrator {
  // NEW: Scope support
  private scope: ScopePattern = DEFAULT_SCOPE;
  private plannedQueue: Subtask[] = [];
  private executing = false;
  private draining = false;

  /**
   * Set execution scope
   * - If not executing: rebuild queue immediately
   * - If executing: set pending flag, drain current queue, then rebuild
   */
  async setScope(newScope: ScopePattern): Promise<void> {
    if (this.executing) {
      // Request graceful drain-and-refill
      this.draining = true;
      this.pendingScope = newScope;
      console.log('[Orchestrator] Scope change requested, draining...');
      return;
    }

    // Immediate rebuild
    this.scope = newScope;
    await this.rebuildQueue();
  }

  /**
   * Process next item with scope-aware logic
   */
  async processNextItem(): Promise<boolean> {
    // Check for drain completion
    if (this.draining && this.currentQueueIsEmpty) {
      await this.applyPendingScopeChange();
    }

    // Get next item from planned queue (already scoped)
    const nextItem = this.getNextFromQueue();

    if (!nextItem) {
      this.executing = false;
      return false;
    }

    this.executing = true;
    await this.delegateByType(nextItem);
    return true;
  }

  private async rebuildQueue(): Promise<void> {
    // Filter backlog by scope
    const tasks = this.filterByScope(this.backlog, this.scope);

    // Topological sort by dependencies
    this.plannedQueue = this.topologicalSort(tasks);

    console.log(`[Orchestrator] Queue rebuilt: ${this.plannedQueue.length} tasks`);
  }
}
```

### Why This Pattern?

1. **Fits your DFS traversal**: Your existing `getNextPendingItem()` logic works with planned queue
2. **Supports dependency checking**: Queue is pre-sorted by dependencies
3. **Graceful reconfiguration**: Drain current work before switching scope
4. **Immutable state**: Queue is rebuilt, not mutated (easier to debug)
5. **Progress tracking**: Easy to see what's completed vs pending

### Implementation Checklist

- [ ] Add `ScopePattern` interface
- [ ] Add `setScope()` method to `TaskOrchestrator`
- [ ] Add `filterByScope()` utility function
- [ ] Add `topologicalSort()` utility function
- [ ] Add `drain-and-refill` logic to `processNextItem()`
- [ ] Add scope state to `SessionManager`
- [ ] Add CLI flag parsing for scope patterns
- [ ] Add tests for scope changes during execution
- [ ] Add tests for dependency preservation across scope changes
- [ ] Add logging for scope transitions

### Testing Strategy

```typescript
describe('TaskOrchestrator scope changes', () => {
  it('should rebuild queue when scope changes before execution', async () => {
    const orchestrator = new TaskOrchestrator(sessionManager);
    await orchestrator.setScope({ phase: 1 });
    expect(orchestrator.getQueueSize()).toBeGreaterThan(0);
  });

  it('should drain current queue before applying scope change', async () => {
    const orchestrator = new TaskOrchestrator(sessionManager);
    orchestrator.start();

    // Change scope mid-execution
    await orchestrator.setScope({ phase: 2 });

    // Current tasks should complete
    expect(orchestrator.isDraining()).toBe(true);
  });

  it('should preserve completed tasks across scope changes', async () => {
    const orchestrator = new TaskOrchestrator(sessionManager);

    // Execute P1.M1.T1.S1
    await orchestrator.setScope({ phase: 1, milestone: 1 });
    await orchestrator.execute();

    // Change scope
    await orchestrator.setScope({ phase: 1, milestone: 2 });

    // P1.M1.T1.S1 should still be marked complete
    const task = await orchestrator.findTask('P1.M1.T1.S1');
    expect(task.status).toBe('Complete');
  });

  it('should respect dependencies when rebuilding queue', async () => {
    const orchestrator = new TaskOrchestrator(sessionManager);

    // P1.M1.T1.S2 depends on P1.M1.T1.S1
    await orchestrator.setScope({ phase: 1, milestone: 1, task: 1 });

    const queue = orchestrator.getQueue();
    const s1Index = queue.findIndex(t => t.id === 'P1.M1.T1.S1');
    const s2Index = queue.findIndex(t => t.id === 'P1.M1.T1.S2');

    expect(s1Index).toBeLessThan(s2Index);
  });
});
```

---

## Conclusion

Scope-based task execution is a well-solved problem in build systems and workflow orchestrators. The key lessons:

1. **Immutable plans > mutable queues** - Rebuild on change, don't mutate
2. **Graceful transitions > abrupt changes** - Drain before refill
3. **Preserve execution history** - Don't lose completed work
4. **Validate dependencies** - Check for cycles and broken deps
5. **Log everything** - Scope changes are critical operations

The recommended hybrid approach (immutable planning + drain-and-refill) balances simplicity with flexibility, and aligns well with your existing `TaskOrchestrator` architecture.
