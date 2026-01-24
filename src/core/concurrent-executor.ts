/**
 * Concurrent Task Executor for parallel subtask execution
 *
 * @module core/concurrent-executor
 *
 * @remarks
 * Executes subtasks concurrently while respecting dependency constraints.
 * Extends the ResearchQueue pattern to implementation execution with:
 * - Semaphore-based concurrency limiting (configurable pool size)
 * - Dependency-aware executable subtask identification
 * - Batch execution with Promise.allSettled() for error isolation
 * - Resource-aware backpressure (memory, file handles)
 * - Atomic state updates via SessionManager
 *
 * @example
 * ```typescript
 * import { ConcurrentTaskExecutor } from './core/concurrent-executor.js';
 *
 * const executor = new ConcurrentTaskExecutor(orchestrator, {
 *   enabled: true,
 *   maxConcurrency: 3,
 *   prpGenerationLimit: 3,
 *   resourceThreshold: 0.8
 * });
 * await executor.executeParallel(subtasks);
 * ```
 */

import type { TaskOrchestrator } from './task-orchestrator.js';
import type { Subtask } from './models.js';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';

/**
 * Configuration for parallel execution
 *
 * @remarks
 * Controls concurrency limits, resource thresholds, and PRP generation limits.
 * All limits are non-negative integers or ratios (0.0 to 1.0).
 */
export interface ParallelismConfig {
  /** Whether parallel execution is enabled */
  enabled: boolean;

  /** Maximum number of concurrent subtask executions (default: 3) */
  maxConcurrency: number;

  /** Separate limit for PRP generation parallelism (default: 3) */
  prpGenerationLimit: number;

  /** Memory usage threshold for backpressure (0.0 to 1.0, default: 0.8) */
  resourceThreshold: number;
}

/**
 * Semaphore for concurrency control
 *
 * @remarks
 * Limits concurrent operations using acquire/release pattern.
 * When acquire() is called and no capacity is available, the call
 * waits until a slot is released. Thread-safe for concurrent operations.
 *
 * Based on the pattern from parallel-execution-design.md lines 934-964.
 */
class Semaphore {
  /** Number of available slots */
  #available: number;

  /** Queue of waiting operations */
  #waitQueue: Array<() => void> = [];

  /**
   * Creates a new Semaphore
   *
   * @param max - Maximum concurrent operations (must be > 0)
   * @throws {Error} If max is not positive
   */
  constructor(private max: number) {
    if (max <= 0) {
      throw new Error(`Semaphore max must be positive, got: ${max}`);
    }
    this.#available = max;
  }

  /**
   * Acquires a slot, waiting if necessary
   *
   * @remarks
   * If a slot is available, decrements available count and returns immediately.
   * Otherwise, queues the request and waits until release() is called.
   *
   * @returns Promise that resolves when slot is acquired
   */
  async acquire(): Promise<void> {
    if (this.#available > 0) {
      this.#available--;
      return;
    }

    // Queue this request and wait
    return new Promise<void>(resolve => {
      this.#waitQueue.push(resolve);
    });
  }

  /**
   * Releases a slot and wakes next waiter
   *
   * @remarks
   * Increments available count. If waiters are queued, dequeues one
   * and resolves its promise (decrementing available again).
   * This ensures FIFO ordering for waiting operations.
   */
  release(): void {
    this.#available++;
    const next = this.#waitQueue.shift();
    if (next) {
      // Transfer the slot to the next waiter
      this.#available--;
      next();
    }
  }

  /**
   * Gets current available slot count
   *
   * @returns Number of available slots (for testing/debugging)
   */
  get available(): number {
    return this.#available;
  }

  /**
   * Gets current waiter queue length
   *
   * @returns Number of operations waiting (for testing/debugging)
   */
  get queued(): number {
    return this.#waitQueue.length;
  }
}

/**
 * Concurrent Task Executor for parallel subtask execution
 *
 * @remarks
 * Executes subtasks concurrently while respecting dependency constraints.
 * The main entry point is executeParallel() which processes subtasks in waves:
 * 1. Identify executable subtasks (dependencies satisfied)
 * 2. Execute batch with concurrency limit
 * 3. Refresh backlog and repeat until all complete
 *
 * Uses Semaphore pattern for concurrency limiting and Promise.allSettled()
 * for error isolation (individual failures don't stop other tasks).
 *
 * State updates are atomic via SessionManager batching to prevent corruption
 * from concurrent writes.
 *
 * @example
 * ```typescript
 * const executor = new ConcurrentTaskExecutor(orchestrator, {
 *   enabled: true,
 *   maxConcurrency: 3,
 *   prpGenerationLimit: 3,
 *   resourceThreshold: 0.8
 * });
 * await executor.executeParallel(subtasks);
 * ```
 */
export class ConcurrentTaskExecutor {
  /** Logger instance for structured logging */
  readonly #logger: Logger;

  /** Task Orchestrator for dependency checking and status updates */
  readonly #orchestrator: TaskOrchestrator;

  /** Parallel execution configuration */
  readonly #config: ParallelismConfig;

  /**
   * Creates a new ConcurrentTaskExecutor
   *
   * @param orchestrator - Task Orchestrator for dependency checking
   * @param config - Parallel execution configuration
   * @throws {Error} If config.maxConcurrency is not positive
   */
  constructor(orchestrator: TaskOrchestrator, config: ParallelismConfig) {
    this.#logger = getLogger('ConcurrentTaskExecutor');
    this.#orchestrator = orchestrator;
    this.#config = config;

    this.#logger.info(
      {
        maxConcurrency: config.maxConcurrency,
        resourceThreshold: config.resourceThreshold,
      },
      'ConcurrentTaskExecutor initialized'
    );
  }

  /**
   * Executes subtasks in parallel with dependency awareness
   *
   * @remarks
   * Main entry point for parallel execution. Processes subtasks in waves:
   * 1. Identify executable subtasks (status='Planned' && all deps 'Complete')
   * 2. Execute batch with semaphore concurrency limit
   * 3. Refresh backlog after each batch
   * 4. Detect deadlock if no executable tasks but planned tasks remain
   * 5. Repeat until all tasks are Complete/Failed
   *
   * @param subtasks - All subtasks to execute (from single task)
   * @throws {Error} If deadlock detected (circular dependencies)
   *
   * @example
   * ```typescript
   * const executor = new ConcurrentTaskExecutor(orchestrator, config);
   * const subtasks = getAllSubtasks(backlog);
   * await executor.executeParallel(subtasks);
   * ```
   */
  async executeParallel(subtasks: Subtask[]): Promise<void> {
    this.#logger.info(
      { subtaskCount: subtasks.length },
      'Starting parallel execution'
    );

    const startTime = Date.now();

    // Main execution loop: process waves until all complete
    while (this.#hasIncompleteTasks(subtasks)) {
      // Get executable subtasks for this wave
      const executable = this.#getExecutableSubtasks(subtasks);

      // Deadlock detection: no executable tasks but planned tasks remain
      if (executable.length === 0) {
        await this.#handleDeadlock(subtasks);
        break;
      }

      this.#logger.debug(
        { executableCount: executable.length },
        'Starting execution wave'
      );

      // Execute this wave with concurrency limit
      await this.#executeBatch(executable);

      // Refresh backlog to get latest status
      await this.#orchestrator.refreshBacklog();

      this.#logger.debug('Wave complete, refreshing backlog');
    }

    const duration = Date.now() - startTime;
    this.#logger.info({ duration }, 'Parallel execution complete');
  }

  /**
   * Gets subtasks that can execute (dependencies satisfied)
   *
   * @remarks
   * Filters subtasks by:
   * 1. Status must be 'Planned' (not already running/complete)
   * 2. All dependencies must be 'Complete'
   *
   * Uses orchestrator.canExecute() for dependency checking.
   *
   * @param subtasks - All subtasks to filter
   * @returns Array of executable subtasks
   *
   * @example
   * ```typescript
   * const executable = executor.#getExecutableSubtasks(allSubtasks);
   * // Returns subtasks with satisfied dependencies
   * ```
   */
  #getExecutableSubtasks(subtasks: Subtask[]): Subtask[] {
    return subtasks.filter(subtask => {
      // Must be in Planned state
      if (subtask.status !== 'Planned') {
        return false;
      }

      // All dependencies must be Complete
      return this.#orchestrator.canExecute(subtask);
    });
  }

  /**
   * Executes a batch of subtasks with concurrency limit
   *
   * @remarks
   * Creates a semaphore for concurrency control. Each worker:
   * 1. Acquires semaphore slot (waits if at limit)
   * 2. Waits for resource availability (backpressure)
   * 3. Executes subtask via PRPRuntime
   * 4. Updates status to Complete or Failed
   * 5. Releases semaphore slot
   * 6. Flushes state updates atomically
   *
   * Uses Promise.allSettled() for error isolation - individual failures
   * don't stop other tasks in the batch.
   *
   * @param subtasks - Subtasks to execute (all executable, dependencies satisfied)
   *
   * @example
   * ```typescript
   * await executor.#executeBatch(executableSubtasks);
   * // All subtasks executed with maxConcurrency limit
   * ```
   */
  async #executeBatch(subtasks: Subtask[]): Promise<void> {
    const semaphore = new Semaphore(this.#config.maxConcurrency);

    // Create worker function for each subtask
    const workers = subtasks.map(subtask => async () => {
      // Acquire semaphore slot (waits if at limit)
      await semaphore.acquire();

      this.#logger.debug({ subtaskId: subtask.id }, 'Acquired semaphore slot');

      try {
        // Wait for resources (backpressure)
        await this.#waitForResourceAvailability();

        // Get current backlog for execution
        const backlog = this.#orchestrator.backlog;

        // Execute subtask via PRPRuntime
        await this.#orchestrator.prpRuntime.executeSubtask(subtask, backlog);

        // Update status to Complete
        await this.#orchestrator.setStatus(subtask.id, 'Complete', 'Success');

        this.#logger.info({ subtaskId: subtask.id }, 'Subtask completed');
      } catch (error) {
        // Update status to Failed with error message
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        await this.#orchestrator.setStatus(subtask.id, 'Failed', errorMessage);

        this.#logger.error(
          { subtaskId: subtask.id, error: errorMessage },
          'Subtask failed'
        );

        // Re-throw for aggregation in Promise.allSettled
        throw error;
      } finally {
        // Always release semaphore slot
        semaphore.release();

        this.#logger.debug(
          { subtaskId: subtask.id, available: semaphore.available },
          'Released semaphore slot'
        );

        // Flush state updates atomically
        await this.#orchestrator.sessionManager.flushUpdates();
      }
    });

    // Execute all workers and wait for completion
    const results = await Promise.allSettled(workers.map(w => w()));

    // Log aggregated failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      this.#logger.warn(
        { failureCount: failures.length, total: results.length },
        'Some subtasks failed in batch'
      );
    }

    this.#logger.debug(
      { completed: results.length - failures.length, failed: failures.length },
      'Batch execution complete'
    );
  }

  /**
   * Waits for resource availability (backpressure)
   *
   * @remarks
   * Checks memory usage ratio and waits if above threshold.
   * Uses process.memoryUsage() for heap monitoring.
   * Sleeps 1 second between checks to avoid busy-waiting.
   *
   * File handle monitoring is skipped by default (slow on macOS).
   *
   * @throws {Error} Only if threshold check fails (should not happen)
   *
   * @example
   * ```typescript
   * await executor.#waitForResourceAvailability();
   * // Waits until memory < 80% of heap
   * ```
   */
  async #waitForResourceAvailability(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const usage = process.memoryUsage();
      const memoryRatio = usage.heapUsed / usage.heapTotal;

      if (memoryRatio < this.#config.resourceThreshold) {
        break;
      }

      this.#logger.debug(
        { memoryRatio, threshold: this.#config.resourceThreshold },
        'Waiting for resource availability'
      );

      // Sleep 1 second before rechecking
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Checks if any subtasks are incomplete (not Complete/Failed)
   *
   * @remarks
   * Returns true if any subtask is in Planned, Researching, or Implementing state.
   *
   * @param subtasks - Subtasks to check
   * @returns true if incomplete tasks exist
   *
   * @example
   * ```typescript
   * if (executor.#hasIncompleteTasks(subtasks)) {
   *   // Continue processing
   * }
   * ```
   */
  #hasIncompleteTasks(subtasks: Subtask[]): boolean {
    return subtasks.some(s => s.status !== 'Complete' && s.status !== 'Failed');
  }

  /**
   * Handles deadlock detection and logging
   *
   * @remarks
   * Called when no executable tasks exist but planned tasks remain.
   * Logs blocking dependencies for each planned subtask and throws error.
   *
   * @param subtasks - All subtasks (for deadlock analysis)
   * @throws {Error} Always throws deadlock error
   *
   * @example
   * ```typescript
   * if (executable.length === 0) {
   *   await executor.#handleDeadlock(subtasks);
   * }
   * ```
   */
  async #handleDeadlock(subtasks: Subtask[]): Promise<void> {
    const planned = subtasks.filter(s => s.status === 'Planned');

    this.#logger.error(
      { plannedCount: planned.length },
      'Deadlock detected: no executable tasks but planned tasks remain'
    );

    // Log blocking dependencies for each planned subtask
    for (const subtask of planned) {
      const blockers = this.#orchestrator.getBlockingDependencies(subtask);
      this.#logger.error(
        {
          subtaskId: subtask.id,
          blockers: blockers.map((b: Subtask) => ({
            id: b.id,
            status: b.status,
          })),
        },
        'Subtask blocked on unresolved dependencies'
      );
    }

    throw new Error(
      `Deadlock: ${planned.length} planned subtasks cannot execute (circular dependencies or missing dependencies)`
    );
  }
}
