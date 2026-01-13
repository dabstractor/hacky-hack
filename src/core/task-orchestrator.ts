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

  /**
   * Creates a new TaskOrchestrator instance
   *
   * @param sessionManager - Session state manager for persistence
   * @throws {Error} If sessionManager.currentSession is null
   */
  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;

    // Load initial backlog from session state
    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error(
        'Cannot create TaskOrchestrator: no active session'
      );
    }

    this.#backlog = currentSession.taskRegistry;
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

      default:
        // PATTERN: Exhaustive check - TypeScript errors if missing case
        const _exhaustive: never = item;
        throw new Error(`Unknown hierarchy item type: ${_exhaustive}`);
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
    await this.#updateStatus(phase.id, 'Implementing');
    console.log(`[TaskOrchestrator] Executing Phase: ${phase.id} - ${phase.title}`);
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
    await this.#updateStatus(milestone.id, 'Implementing');
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
   * Sets task status to 'Implementing'. Child iteration happens through
   * the processNextItem() loop - the Pipeline Controller will repeatedly
   * call processNextItem() to process subtasks within this task.
   */
  async executeTask(task: Task): Promise<void> {
    await this.#updateStatus(task.id, 'Implementing');
    console.log(`[TaskOrchestrator] Executing Task: ${task.id} - ${task.title}`);
  }

  /**
   * Executes a Subtask item (main execution unit - placeholder)
   *
   * @param subtask - Subtask to execute
   * @returns Promise that resolves when execution completes
   *
   * @remarks
   * This is the main execution unit. In P3.M3.T1, this will generate
   * a PRP and run the Coder agent. For now, it's a placeholder that:
   * 1. Sets status to 'Implementing'
   * 2. Logs the action
   * 3. Sets status to 'Complete'
   *
   * The Pipeline Controller will call processNextItem() which delegates
   * to this method when the next pending item is a Subtask.
   */
  async executeSubtask(subtask: Subtask): Promise<void> {
    console.log(
      `[TaskOrchestrator] Executing Subtask: ${subtask.id} - ${subtask.title}`
    );

    // PLACEHOLDER: Set status to Implementing
    await this.#updateStatus(subtask.id, 'Implementing');

    // PLACEHOLDER: Log execution (PRP generation + Coder agent execution in P3.M3.T1)
    console.log(
      `[TaskOrchestrator] PLACEHOLDER: Would generate PRP and run Coder agent`
    );
    console.log(`[TaskOrchestrator] Context scope: ${subtask.context_scope}`);

    // PLACEHOLDER: Set status to Complete
    // In P3.M3.T1, this will depend on Coder agent success/failure
    await this.#updateStatus(subtask.id, 'Complete');
  }

  /**
   * Processes the next pending item using DFS pre-order traversal
   *
   * @returns true if item was processed, false if backlog is complete
   *
   * @remarks
   * This is the main entry point for backlog processing:
   * 1. Gets next pending item using DFS pre-order traversal
   * 2. Returns false if no items pending (backlog complete)
   * 3. Delegates to type-specific handler
   * 4. Refreshes backlog after status update
   * 5. Returns true (item processed, more may remain)
   *
   * The Pipeline Controller calls this method repeatedly until it returns false.
   *
   * @example
   * ```typescript
   * const orchestrator = new TaskOrchestrator(sessionManager);
   * let hasMore = true;
   * while (hasMore) {
   *   hasMore = await orchestrator.processNextItem();
   * }
   * console.log('Pipeline complete!');
   * ```
   */
  async processNextItem(): Promise<boolean> {
    // Import getNextPendingItem from task-utils
    const { getNextPendingItem } = await import('../utils/task-utils.js');

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
    await this.#delegateByType(nextItem);

    // 5. Refresh backlog after status update
    await this.#refreshBacklog();

    // 6. Indicate item was processed (more items may remain)
    return true;
  }
}
