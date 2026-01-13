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

import type { SessionManager } from './session-manager.js';
import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
} from './models.js';
import type { HierarchyItem } from '../utils/task-utils.js';
import { getDependencies } from '../utils/task-utils.js';
import type { Scope } from './scope-resolver.js';
import { resolveScope } from './scope-resolver.js';
import { smartCommit } from '../utils/git-commit.js';
import { ResearchQueue } from './research-queue.js';
import { PRPRuntime } from '../agents/prp-runtime.js';

/**
 * Task Orchestrator for PRP Pipeline backlog processing
 *
 * @remarks
 * Provides recursive depth-first traversal (DFS) of the task backlog hierarchy
 * with type-specific execution delegation for each hierarchy level.
 *
 * The orchestrator processes items in DFS pre-order traversal:
 * Phase → Milestone → Task → Subtask (parent before children).
 *
 * Parent items (Phase, Milestone, Task) set their status to 'Implementing'
 * and delegate child processing to the main loop via processNextItem().
 *
 * Subtasks are the main execution unit - this PRP implements a placeholder
 * that logs the action and marks as complete. Actual PRP generation and
 * Coder agent execution will be added in P3.M3.T1.
 */
export class TaskOrchestrator {
  /** Session state manager for persistence */
  readonly sessionManager: SessionManager;

  /** Current task registry (read from SessionManager) */
  #backlog: Backlog;

  /** Scope for limiting execution (undefined = all items) */
  #scope: Scope | undefined;

  /** Queue of items to execute (populated from scope) */
  #executionQueue: HierarchyItem[];

  /** Research queue for parallel PRP generation */
  readonly researchQueue: ResearchQueue;

  /** PRP runtime for execution */
  readonly #prpRuntime: PRPRuntime;

  /** Cache metrics tracking */
  #cacheHits: number = 0;
  #cacheMisses: number = 0;

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

    // Store scope and build execution queue
    this.#scope = scope;
    this.#executionQueue = this.#buildQueue(scope);

    // Initialize ResearchQueue with concurrency limit of 3
    this.researchQueue = new ResearchQueue(this.sessionManager, 3);
    // eslint-disable-next-line no-console -- Expected logging for initialization
    console.log('[TaskOrchestrator] ResearchQueue initialized with maxSize=3');

    // Initialize PRPRuntime for execution
    this.#prpRuntime = new PRPRuntime(this);
    // eslint-disable-next-line no-console -- Expected logging for initialization
    console.log(
      '[TaskOrchestrator] PRPRuntime initialized for subtask execution'
    );
  }

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

  /**
   * Gets the current backlog (read-only access)
   *
   * @returns Current backlog state
   */
  get backlog(): Backlog {
    return this.#backlog;
  }

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

  /**
   * Sets item status with logging and state persistence
   *
   * @param itemId - Item ID to update (e.g., "P1.M1.T1.S1")
   * @param status - New status value
   * @param reason - Optional reason for status change (for debugging)
   * @throws {Error} If SessionManager.updateItemStatus() fails
   *
   * @remarks
   * Public wrapper for SessionManager.updateItemStatus() that:
   * 1. Logs the status transition with structured information
   * 2. Persists the status change via SessionManager
   * 3. Refreshes backlog to get latest state
   *
   * Logs include: timestamp, itemId, oldStatus, newStatus, reason
   */
  public async setStatus(
    itemId: string,
    status: Status,
    reason?: string
  ): Promise<void> {
    // Import findItem utility to get current item for oldStatus
    const { findItem } = await import('../utils/task-utils.js');

    // PATTERN: Get current item to capture oldStatus for logging
    const currentItem = findItem(this.#backlog, itemId);
    const oldStatus = currentItem?.status ?? 'Unknown';
    const timestamp = new Date().toISOString();

    // PATTERN: Log status transition with structured information
    // Format includes: timestamp, itemId, oldStatus, newStatus, reason
    const reasonStr = reason ? ` (${reason})` : '';
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Status: ${itemId} ${oldStatus} → ${status}${reasonStr}`
    );
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(`[TaskOrchestrator] Timestamp: ${timestamp}`);

    // PATTERN: Persist status change through SessionManager
    // NOTE: reason is only for logging, not passed to SessionManager (API doesn't support it)
    await this.sessionManager.updateItemStatus(itemId, status);

    // PATTERN: Reload backlog to get latest state
    await this.#refreshBacklog();
  }

  /**
   * Checks if a subtask can execute based on its dependencies
   *
   * @param subtask - The subtask to check
   * @returns true if all dependencies are Complete or no dependencies exist
   *
   * @remarks
   * Uses getDependencies utility to resolve dependency IDs to actual Subtask objects.
   * Returns true if the subtask has no dependencies (empty array).
   * Returns true only when ALL dependencies have status === 'Complete'.
   * Returns false if ANY dependency is not Complete.
   *
   * @example
   * ```typescript
   * const subtask = createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned', ['P1.M1.T1.S1']);
   * const canExecute = orchestrator.canExecute(subtask);
   * // Returns false if P1.M1.T1.S1 is not Complete
   * ```
   */
  public canExecute(subtask: Subtask): boolean {
    // PATTERN: Use getDependencies utility from task-utils
    const dependencies = getDependencies(subtask, this.#backlog);

    // GOTCHA: Empty array means no dependencies = can execute
    if (dependencies.length === 0) {
      return true;
    }

    // PATTERN: Array.every() checks ALL items match condition
    // CRITICAL: Use strict string equality for status comparison
    const allComplete = dependencies.every(dep => dep.status === 'Complete');

    return allComplete;
  }

  /**
   * Gets the dependencies that are blocking a subtask from executing
   *
   * @param subtask - The subtask to check
   * @returns Array of incomplete dependency Subtask objects
   *
   * @remarks
   * Uses getDependencies utility to resolve dependency IDs to actual Subtask objects.
   * Filters dependencies where status !== 'Complete'.
   * Returns empty array if no blocking dependencies exist.
   *
   * @example
   * ```typescript
   * const blockers = orchestrator.getBlockingDependencies(subtask);
   * console.log(`Blocked on: ${blockers.map(b => b.id).join(', ')}`);
   * ```
   */
  public getBlockingDependencies(subtask: Subtask): Subtask[] {
    // PATTERN: Use getDependencies utility from task-utils
    const dependencies = getDependencies(subtask, this.#backlog);

    // PATTERN: Array.filter() returns NEW array (immutable)
    // CRITICAL: Check for NOT Complete to find blockers
    const blocking = dependencies.filter(dep => dep.status !== 'Complete');

    return blocking;
  }

  /**
   * Waits for a subtask's dependencies to become Complete
   *
   * @param subtask - The subtask whose dependencies to wait for
   * @param options - Optional configuration for timeout and interval
   * @returns Promise that resolves when dependencies are Complete
   * @throws {Error} If timeout is exceeded before dependencies are Complete
   *
   * @remarks
   * Polls canExecute() at intervals until all dependencies are Complete or timeout.
   * This is a placeholder for future async workflow enhancement.
   * Current implementation uses simple polling; event-driven in future.
   *
   * @example
   * ```typescript
   * try {
   *   await orchestrator.waitForDependencies(subtask, { timeout: 5000 });
   *   // Dependencies are now Complete
   * } catch (error) {
   *   // Timeout - dependencies not ready within 5 seconds
   * }
   * ```
   */
  public async waitForDependencies(
    subtask: Subtask,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    // PATTERN: Default values with destructuring
    const { timeout = 30000, interval = 1000 } = options;

    const startTime = Date.now();

    // PATTERN: Polling loop with timeout
    while (Date.now() - startTime < timeout) {
      // Refresh backlog to get latest status
      await this.#refreshBacklog();

      // Check if dependencies are complete
      if (this.canExecute(subtask)) {
        console.log(
          `[TaskOrchestrator] Dependencies complete for ${subtask.id}`
        );
        return;
      }

      // Log waiting status
      const blockers = this.getBlockingDependencies(subtask);
      const blockerIds = blockers.map(b => b.id).join(', ');
      console.log(`[TaskOrchestrator] Waiting for dependencies: ${blockerIds}`);

      // Sleep for interval
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // PATTERN: Throw descriptive error on timeout
    throw new Error(
      `Timeout waiting for dependencies of ${subtask.id} after ${timeout}ms`
    );
  }

  /**
   * Reloads backlog from SessionManager after status updates
   *
   * @throws {Error} If currentSession is null
   *
   * @remarks
   * This method should be called after any status update to ensure
   * the orchestrator has the latest backlog state from disk.
   */
  async #refreshBacklog(): Promise<void> {
    const currentSession = this.sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot refresh backlog: no active session');
    }

    // Reload from session state (not cached value)
    this.#backlog = currentSession.taskRegistry;
  }

  /**
   * Updates item status and refreshes backlog
   *
   * @param id - Item ID to update
   * @param status - New status value
   * @returns Updated Backlog after save
   * @throws {Error} If no session is loaded
   *
   * @remarks
   * Wraps SessionManager.updateItemStatus() with automatic backlog refresh.
   * The SessionManager persists the change to disk and updates its internal state.
   */
  async #updateStatus(id: string, status: Status): Promise<Backlog> {
    // Persist status change through SessionManager
    const updated = await this.sessionManager.updateItemStatus(id, status);

    // Reload backlog to get latest state
    await this.#refreshBacklog();

    return updated;
  }

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
    const oldScope = this.#scope
      ? JSON.stringify(this.#scope)
      : 'undefined (all)';
    const newScope = JSON.stringify(scope);

    console.log(`[TaskOrchestrator] Scope change: ${oldScope} → ${newScope}`);

    // Store new scope and rebuild queue
    this.#scope = scope;
    this.#executionQueue = this.#buildQueue(scope);

    console.log(
      `[TaskOrchestrator] Execution queue rebuilt: ${this.#executionQueue.length} items`
    );
  }

  /**
   * Type-switch dispatch to appropriate execute* method
   *
   * @param item - Hierarchy item to execute
   * @returns Promise that resolves when execution completes
   *
   * @remarks
   * Uses discriminated union (item.type) for type narrowing.
   * TypeScript automatically narrows type in each case branch.
   */
  async #delegateByType(item: HierarchyItem): Promise<void> {
    // PATTERN: Switch on 'type' field for discriminated union narrowing
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

      default: {
        // PATTERN: Exhaustive check - TypeScript errors if missing case
        const _exhaustive: never = item;
        throw new Error(`Unknown hierarchy item type: ${_exhaustive}`);
      }
    }
  }

  /**
   * Executes a Phase item
   *
   * @param phase - Phase to execute
   * @returns Promise that resolves when execution completes
   *
   * @remarks
   * Sets phase status to 'Implementing'. Child iteration happens through
   * the processNextItem() loop - the Pipeline Controller will repeatedly
   * call processNextItem() to process milestones within this phase.
   */
  async executePhase(phase: Phase): Promise<void> {
    // PATTERN: Log before status update (NEW - adds visibility)
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Phase: ${phase.id} - Setting status to Implementing`
    );

    await this.#updateStatus(phase.id, 'Implementing');
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Executing Phase: ${phase.id} - ${phase.title}`
    );
  }

  /**
   * Executes a Milestone item
   *
   * @param milestone - Milestone to execute
   * @returns Promise that resolves when execution completes
   *
   * @remarks
   * Sets milestone status to 'Implementing'. Child iteration happens through
   * the processNextItem() loop - the Pipeline Controller will repeatedly
   * call processNextItem() to process tasks within this milestone.
   */
  async executeMilestone(milestone: Milestone): Promise<void> {
    // PATTERN: Log before status update (NEW - adds visibility)
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Milestone: ${milestone.id} - Setting status to Implementing`
    );

    await this.#updateStatus(milestone.id, 'Implementing');
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Executing Milestone: ${milestone.id} - ${milestone.title}`
    );
  }

  /**
   * Executes a Task item
   *
   * @param task - Task to execute
   * @returns Promise that resolves when execution completes
   *
   * @remarks
   * Sets task status to 'Implementing'. Enqueues all subtasks for parallel PRP
   * generation. Child iteration happens through the processNextItem() loop -
   * the Pipeline Controller will repeatedly call processNextItem() to process
   * subtasks within this task.
   */
  async executeTask(task: Task): Promise<void> {
    // PATTERN: Log before status update (NEW - adds visibility)
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Task: ${task.id} - Setting status to Implementing`
    );

    await this.#updateStatus(task.id, 'Implementing');
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Executing Task: ${task.id} - ${task.title}`
    );

    // Enqueue all subtasks for parallel PRP generation
    // eslint-disable-next-line no-console -- Expected logging for research queue
    console.log(
      `[TaskOrchestrator] Enqueuing ${task.subtasks.length} subtasks for parallel PRP generation`
    );

    for (const subtask of task.subtasks) {
      await this.researchQueue.enqueue(subtask, this.#backlog);
      // eslint-disable-next-line no-console -- Expected logging for research queue
      console.log(
        `[TaskOrchestrator] Enqueued ${subtask.id} for parallel research`
      );
    }

    // Log queue statistics after enqueueing
    const stats = this.researchQueue.getStats();
    // eslint-disable-next-line no-console -- Expected logging for research queue
    console.log(
      `[TaskOrchestrator] Research queue stats: ${stats.queued} queued, ${stats.researching} researching, ${stats.cached} cached`
    );
  }

  /**
   * Executes a Subtask item (main execution unit)
   *
   * @param subtask - Subtask to execute
   * @returns Promise that resolves when execution completes
   *
   * @remarks
   * This is the main execution unit. Before execution, it checks if all
   * dependencies are Complete using canExecute(). If blocked, it logs
   * the blocking dependencies and returns early without executing.
   *
   * Status progression: Planned → Researching → Implementing → Complete/Failed
   * - Researching: PRP generation phase (checks cache first)
   * - Implementing: Coder agent execution phase via PRPRuntime
   * - Complete: All validation gates passed
   * - Failed: Exception during execution
   *
   * Checks ResearchQueue cache for existing PRP before generation.
   * Triggers background research for next tasks after starting execution.
   */
  async executeSubtask(subtask: Subtask): Promise<void> {
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Executing Subtask: ${subtask.id} - ${subtask.title}`
    );

    // PATTERN: Set 'Researching' status at start
    await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[TaskOrchestrator] Researching: ${subtask.id} - preparing PRP`
    );

    // NEW: Check if PRP is cached in ResearchQueue
    const cachedPRP = this.researchQueue.getPRP(subtask.id);
    if (cachedPRP) {
      this.#cacheHits++;
      // eslint-disable-next-line no-console -- Expected logging for cache hits
      console.log(
        `[TaskOrchestrator] Cache HIT: ${subtask.id} - using cached PRP`
      );
    } else {
      this.#cacheMisses++;
      // eslint-disable-next-line no-console -- Expected logging for cache misses
      console.log(
        `[TaskOrchestrator] Cache MISS: ${subtask.id} - PRP will be generated by PRPRuntime`
      );
    }

    // Log cache metrics
    this.#logCacheMetrics();

    // NEW: Check if dependencies are satisfied
    if (!this.canExecute(subtask)) {
      const blockers = this.getBlockingDependencies(subtask);

      // PATTERN: Log each blocking dependency for clarity
      for (const blocker of blockers) {
        // eslint-disable-next-line no-console -- Expected logging for dependency tracking
        console.log(
          `[TaskOrchestrator] Blocked on: ${blocker.id} - ${blocker.title} (status: ${blocker.status})`
        );
      }

      // eslint-disable-next-line no-console -- Expected logging for dependency tracking
      console.log(
        `[TaskOrchestrator] Subtask ${subtask.id} blocked on dependencies, skipping`
      );

      // PATTERN: Return early without executing
      return;
    }

    // PATTERN: Set 'Implementing' status before work
    await this.setStatus(subtask.id, 'Implementing', 'Starting implementation');

    // PATTERN: Wrap execution in try/catch for error handling
    try {
      // NEW: Use PRPRuntime for execution (handles PRP generation if cache miss)
      // eslint-disable-next-line no-console -- Expected logging for execution
      console.log(
        `[TaskOrchestrator] Starting PRPRuntime execution for ${subtask.id}`
      );

      const result = await this.#prpRuntime.executeSubtask(
        subtask,
        this.#backlog
      );

      // eslint-disable-next-line no-console -- Expected logging for execution result
      console.log(
        `[TaskOrchestrator] PRPRuntime execution ${result.success ? 'succeeded' : 'failed'} for ${subtask.id}`
      );

      // NEW: Trigger background research for next pending tasks
      // Fire-and-forget: don't await, log errors
      this.researchQueue.processNext(this.#backlog).catch(error => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console -- Expected error logging for background research
        console.error(
          `[TaskOrchestrator] Background research error: ${errorMessage}`
        );
      });

      // Log updated queue statistics
      const stats = this.researchQueue.getStats();
      // eslint-disable-next-line no-console -- Expected logging for research queue
      console.log(
        `[TaskOrchestrator] Research queue stats: ${stats.queued} queued, ${stats.researching} researching, ${stats.cached} cached`
      );

      // PATTERN: Set 'Complete' status on success
      if (result.success) {
        await this.setStatus(
          subtask.id,
          'Complete',
          'Implementation completed successfully'
        );
      } else {
        await this.setStatus(
          subtask.id,
          'Failed',
          result.error ?? 'Execution failed'
        );
      }

      // Smart commit after successful subtask completion
      try {
        const sessionPath = this.sessionManager.currentSession?.metadata.path;
        if (!sessionPath) {
          // eslint-disable-next-line no-console -- Expected logging for commit operations
          console.warn(
            '[TaskOrchestrator] Session path not available for smart commit'
          );
        } else {
          const commitMessage = `${subtask.id}: ${subtask.title}`;
          const commitHash = await smartCommit(sessionPath, commitMessage);

          if (commitHash) {
            // eslint-disable-next-line no-console -- Expected logging for commit operations
            console.log(`[TaskOrchestrator] Commit created: ${commitHash}`);
          } else {
            // eslint-disable-next-line no-console -- Expected logging for commit operations
            console.log('[TaskOrchestrator] No files to commit');
          }
        }
      } catch (error) {
        // Don't fail the subtask if commit fails
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console -- Expected error logging for debugging
        console.error(
          `[TaskOrchestrator] Smart commit failed: ${errorMessage}`
        );
      }
    } catch (error) {
      // PATTERN: Set 'Failed' status on exception with error details
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.setStatus(
        subtask.id,
        'Failed',
        `Execution failed: ${errorMessage}`
      );

      // PATTERN: Log error with context for debugging
      // eslint-disable-next-line no-console -- Expected error logging for debugging
      console.error(
        `[TaskOrchestrator] ERROR: ${subtask.id} failed: ${errorMessage}`
      );
      if (error instanceof Error && error.stack) {
        // eslint-disable-next-line no-console -- Expected error logging for debugging
        console.error(`[TaskOrchestrator] Stack trace: ${error.stack}`);
      }

      // PATTERN: Re-throw error for upstream handling
      throw error;
    }
  }

  /**
   * Logs cache metrics for monitoring
   *
   * @remarks
   * Logs cache hits, misses, and hit ratio percentage. Called from
   * executeSubtask() to provide visibility into cache effectiveness.
   *
   * @private
   */
  #logCacheMetrics(): void {
    const total = this.#cacheHits + this.#cacheMisses;
    const hitRatio = total > 0 ? (this.#cacheHits / total) * 100 : 0;

    // eslint-disable-next-line no-console -- Expected logging for cache metrics
    console.log(
      `[TaskOrchestrator] Cache metrics: ${this.#cacheHits} hits, ${this.#cacheMisses} misses, ${hitRatio.toFixed(1)}% hit ratio`
    );
  }

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
      console.log(
        '[TaskOrchestrator] Execution queue empty - processing complete'
      );
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
}
