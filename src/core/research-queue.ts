/**
 * Research Queue for parallel PRP generation
 *
 * @module core/research-queue
 *
 * @remarks
 * Manages parallel PRP generation in background while TaskOrchestrator executes
 * tasks sequentially. Enables "research ahead" behavior where PRPs for upcoming
 * tasks are generated before they're needed.
 *
 * @example
 * ```typescript
 * import { ResearchQueue } from './core/research-queue.js';
 *
 * const queue = new ResearchQueue(sessionManager, 3);
 * await queue.enqueue(subtask1, backlog);
 * await queue.enqueue(subtask2, backlog);
 * const prp = await queue.waitForPRP(subtask1.id);
 * ```
 */

import { PRPGenerator } from '../agents/prp-generator.js';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';
import type { PRPDocument, Task, Subtask, Backlog } from './models.js';
import type { SessionManager } from './session-manager.js';

/**
 * Task or Subtask that can be enqueued for PRP generation
 */
type TaskOrSubtask = Task | Subtask;

/**
 * Manages parallel PRP generation in background
 *
 * @remarks
 * Enables "research ahead" behavior where PRPs for upcoming tasks are
 * generated before they're needed by TaskOrchestrator. Maintains
 * concurrency limit to prevent overwhelming LLM API.
 *
 * Queue lifecycle:
 * 1. Task enqueued via enqueue()
 * 2. If under maxSize, processNext() starts PRP generation
 * 3. Promise stored in researching Map
 * 4. On completion, result cached in results Map
 * 5. Promise removed from researching Map
 * 6. processNext() called to start next task
 *
 * @example
 * ```typescript
 * const queue = new ResearchQueue(sessionManager, 3);
 * await queue.enqueue(subtask1, backlog);
 * await queue.enqueue(subtask2, backlog);
 * const prp = await queue.waitForPRP(subtask1.id);
 * ```
 */
export class ResearchQueue {
  /** Logger instance for structured logging */
  readonly #logger: Logger;

  /** Session manager passed to PRPGenerator */
  readonly sessionManager: SessionManager;

  /** Max concurrent PRP generations */
  readonly maxSize: number;

  /** Cache bypass flag from CLI --no-cache */
  readonly #noCache: boolean;

  /** PRP generator instance */
  readonly #prpGenerator: PRPGenerator;

  /** Pending tasks waiting to be researched */
  readonly queue: TaskOrSubtask[] = [];

  /** In-flight PRP generations: taskId -> Promise */
  readonly researching: Map<string, Promise<PRPDocument>> = new Map();

  /** Completed PRP results: taskId -> PRPDocument */
  readonly results: Map<string, PRPDocument> = new Map();

  /**
   * Creates a new ResearchQueue
   *
   * @param sessionManager - Session state manager
   * @param maxSize - Max concurrent PRP generations (default 3)
   * @param noCache - Whether to bypass cache (default: false)
   * @throws {Error} If no session is active in SessionManager
   */
  constructor(
    sessionManager: SessionManager,
    maxSize: number = 3,
    noCache: boolean = false
  ) {
    this.#logger = getLogger('ResearchQueue');
    this.sessionManager = sessionManager;
    this.maxSize = maxSize;
    this.#noCache = noCache;
    this.#prpGenerator = new PRPGenerator(sessionManager, noCache);
  }

  /**
   * Enqueues a task for PRP generation
   *
   * @remarks
   * Adds task to queue and starts processing if under capacity.
   * Deduplicates: if task already being researched or cached,
   * this is a no-op.
   *
   * @param task - Task or Subtask to generate PRP for
   * @param backlog - Full backlog for context (required by PRPGenerator)
   */
  async enqueue(task: TaskOrSubtask, backlog: Backlog): Promise<void> {
    // Deduplication: skip if already researching
    if (this.researching.has(task.id)) {
      return;
    }

    // Deduplication: skip if already cached
    if (this.results.has(task.id)) {
      return;
    }

    // Add to queue
    this.queue.push(task);

    // Try to start processing
    await this.processNext(backlog);
  }

  /**
   * Processes next task if under capacity
   *
   * @remarks
   * Idempotent: safe to call multiple times. Will only start new
   * research if under maxSize limit. Called automatically by
   * enqueue() and after each research completion.
   *
   * @param backlog - Full backlog for context
   */
  async processNext(backlog: Backlog): Promise<void> {
    // Check capacity
    if (this.queue.length === 0 || this.researching.size >= this.maxSize) {
      return;
    }

    // Dequeue next task
    const task = this.queue.shift();
    if (!task) {
      return; // Should not happen due to length check above
    }

    // Race guard: check if already started (might have been enqueued twice)
    if (this.researching.has(task.id)) {
      return;
    }

    // Start PRP generation
    const promise = this.#prpGenerator
      .generate(task, backlog)
      .then(prp => {
        // Cache successful result
        this.results.set(task.id, prp);
        return prp;
      })
      .catch((error: unknown) => {
        // Log error but don't cache failed results
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.#logger.warn(
          { taskId: task.id, error: errorMessage },
          'PRP generation failed (non-critical)'
        );
        // Re-throw to allow waitForPRP to handle the error
        throw error;
      })
      .finally(() => {
        // Clean up in-flight tracking
        this.researching.delete(task.id);
        // Start next task
        this.processNext(backlog).catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.#logger.error({ error: errorMessage }, 'Background task failed');
        });
      });

    // Track in-flight
    this.researching.set(task.id, promise);
  }

  /**
   * Checks if task is currently being researched
   *
   * @param taskId - Task ID to check
   * @returns true if PRP generation is in-flight
   */
  isResearching(taskId: string): boolean {
    return this.researching.has(taskId);
  }

  /**
   * Gets cached PRP if available
   *
   * @param taskId - Task ID to get PRP for
   * @returns Cached PRPDocument or null if not cached
   */
  getPRP(taskId: string): PRPDocument | null {
    return this.results.get(taskId) ?? null;
  }

  /**
   * Waits for PRP to be ready
   *
   * @remarks
   * Returns immediately if cached. Waits for in-flight promise
   * if currently generating. Throws if task not found in either.
   *
   * @param taskId - Task ID to wait for
   * @returns PRPDocument when ready
   * @throws {Error} If task not enqueued or generation failed
   */
  async waitForPRP(taskId: string): Promise<PRPDocument> {
    // Check cache first
    const cached = this.results.get(taskId);
    if (cached) {
      return cached;
    }

    // Check in-flight
    const inFlight = this.researching.get(taskId);
    if (inFlight) {
      return inFlight;
    }

    // Not found
    throw new Error(
      `No PRP available for task ${taskId}. ` +
        `Task may not have been enqueued or generation failed.`
    );
  }

  /**
   * Gets queue statistics
   *
   * @returns Object with queue, researching, and cached counts
   */
  getStats(): {
    queued: number;
    researching: number;
    cached: number;
  } {
    return {
      queued: this.queue.length,
      researching: this.researching.size,
      cached: this.results.size,
    };
  }

  /**
   * Clears cached results
   *
   * @remarks
   * Does not affect in-flight research or queue. Useful for
   * forcing re-research or cleaning up after session completion.
   */
  clearCache(): void {
    this.results.clear();
  }
}
