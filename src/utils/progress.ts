/**
 * Progress tracking utility for pipeline execution
 *
 * @module utils/progress
 *
 * @remarks
 * Provides real-time progress tracking with ETA calculation using
 * exponential smoothing. Integrates with Pino logger for structured
 * progress events.
 *
 * Features:
 * - Task start/completion time tracking
 * - Progress metrics (completion %, remaining count, average duration)
 * - ETA estimation using exponential smoothing (alpha=0.3)
 * - Human-readable progress bar formatting
 * - Structured progress logging with Pino integration
 * - Configurable log intervals and display options
 *
 * @example
 * ```typescript
 * import { progressTracker } from './utils/progress.js';
 * import type { Backlog } from './core/models.js';
 *
 * const tracker = progressTracker({ backlog: myBacklog, logInterval: 10 });
 * tracker.recordStart('P1.M1.T1.S1');
 * // ... task executes ...
 * tracker.recordComplete('P1.M1.T1.S1');
 * console.log(tracker.formatProgress());
 * // Output: [==========          ] 10% (10/100) ETA: 5m 30s
 * ```
 */

// ===== IMPORTS =====

import { getLogger } from './logger.js';
import type { Backlog } from '../core/models.js';

// ===== TYPE DEFINITIONS =====

/**
 * Progress report with completion metrics
 *
 * @remarks
 * Provides snapshot of current progress including completion percentage,
 * remaining tasks, average duration, and ETA.
 */
export interface ProgressReport {
  /** Number of completed subtasks */
  readonly completed: number;
  /** Total number of subtasks in backlog */
  readonly total: number;
  /** Completion percentage (0-100) */
  readonly percentage: number;
  /** Number of remaining subtasks */
  readonly remaining: number;
  /** Average task duration in milliseconds */
  readonly averageDuration: number;
  /** Estimated time remaining in milliseconds (Infinity if unknown) */
  readonly eta: number;
  /** Elapsed time since first task started (milliseconds) */
  readonly elapsed: number;
}

/**
 * Progress tracker configuration options
 *
 * @remarks
 * Configures logging frequency, display options, and ETA calculation
 * parameters. All fields are readonly for immutability.
 */
export interface ProgressTrackerOptions {
  /** Backlog to track progress for */
  readonly backlog: Backlog;
  /** Log progress every N tasks (default: 10) */
  readonly logInterval?: number;
  /** Progress bar width in characters (default: 40) */
  readonly barWidth?: number;
  /** ETA smoothing factor 0-1 (default: 0.3) */
  readonly etaAlpha?: number;
  /** Minimum samples before showing ETA (default: 3) */
  readonly minSamples?: number;
}

// ===== PRIVATE TYPES =====

/**
 * Required options with defaults filled in
 *
 * @remarks
 * Internal type for options after applying defaults.
 */
type RequiredOptions = Required<Omit<ProgressTrackerOptions, 'backlog'>>;

// ===== MAIN CLASS =====

/**
 * Progress tracker for pipeline execution
 *
 * @remarks
 * Tracks task start/completion times, calculates progress metrics,
 * and provides ETA estimation using exponential smoothing.
 *
 * Progress is logged at INFO level every N tasks (configurable).
 * All times are stored as millisecond timestamps.
 *
 * ETA calculation uses exponential smoothing with alpha=0.3 (default)
 * for a balance of responsiveness and stability.
 *
 * @example
 * ```typescript
 * const tracker = progressTracker({
 *   backlog: myBacklog,
 *   logInterval: 10,
 *   barWidth: 40
 * });
 *
 * tracker.recordStart('P1.M1.T1.S1');
 * await executeTask();
 * tracker.recordComplete('P1.M1.T1.S1');
 *
 * console.log(tracker.formatProgress());
 * ```
 */
export class ProgressTracker {
  /** Backlog being tracked */
  readonly backlog: Backlog;

  /** Task start timestamps (item ID -> start time) */
  readonly #startTimes: Map<string, number>;

  /** Completed task IDs */
  readonly #completedItems: Set<string>;

  /** Task durations in milliseconds (for ETA calculation) */
  #durations: number[];

  /** Configuration options with defaults applied */
  readonly #options: RequiredOptions;

  /** Logger instance for structured progress logging */
  readonly #logger: ReturnType<typeof getLogger>;

  /** Smoothed speed for ETA calculation (tasks per second) */
  #smoothedSpeed: number | null;

  /** First task start time for elapsed calculation */
  #firstStartTime: number | null;

  /**
   * Creates a new progress tracker
   *
   * @param options - Configuration options
   * @throws {Error} If backlog is empty
   *
   * @remarks
   * Initializes tracker with backlog. Counts total subtasks on creation
   * for efficient progress calculation. Throws if backlog contains no subtasks.
   */
  constructor(options: ProgressTrackerOptions) {
    this.backlog = options.backlog;
    this.#startTimes = new Map();
    this.#completedItems = new Set();
    this.#durations = [];
    this.#smoothedSpeed = null;
    this.#firstStartTime = null;

    // Apply defaults
    this.#options = {
      logInterval: options.logInterval ?? 10,
      barWidth: options.barWidth ?? 40,
      etaAlpha: options.etaAlpha ?? 0.3,
      minSamples: options.minSamples ?? 3,
    };

    // Get logger with context
    this.#logger = getLogger('ProgressTracker');

    // Validate backlog has tasks
    const totalSubtasks = this.#countTotalSubtasks();
    if (totalSubtasks === 0) {
      throw new Error('Cannot track progress: backlog contains no subtasks');
    }

    this.#logger.debug(
      { totalSubtasks, options: this.#options },
      'Progress tracker initialized'
    );
  }

  /**
   * Records task start time
   *
   * @param itemId - Task/subtask ID (e.g., "P1.M1.T1.S1")
   *
   * @remarks
   * Stores current timestamp. Ignored if task already started.
   * First task start time is tracked for elapsed time calculation.
   *
   * @example
   * ```typescript
   * tracker.recordStart('P1.M1.T1.S1');
   * ```
   */
  recordStart(itemId: string): void {
    if (this.#startTimes.has(itemId)) {
      return; // Already started
    }

    const startTime = Date.now();
    this.#startTimes.set(itemId, startTime);

    // Track first start time for elapsed calculation
    if (this.#firstStartTime === null) {
      this.#firstStartTime = startTime;
    }

    this.#logger.debug({ itemId }, 'Task started');
  }

  /**
   * Records task completion
   *
   * @param itemId - Task/subtask ID
   *
   * @remarks
   * Calculates duration, stores for ETA calculation, and logs
   * progress if log interval threshold reached.
   *
   * Progress is logged every N tasks (configurable) and always at 100%.
   *
   * If task was not started, auto-starts it before recording completion.
   * This allows flexible integration with pipelines that may not have
   * fine-grained control over when tasks start.
   *
   * @example
   * ```typescript
   * tracker.recordComplete('P1.M1.T1.S1');
   * ```
   */
  recordComplete(itemId: string): void {
    let startTime = this.#startTimes.get(itemId);

    // Auto-start task if not already started (allows flexible integration)
    if (startTime === undefined) {
      this.recordStart(itemId);
      startTime = this.#startTimes.get(itemId)!;
    }

    const duration = Date.now() - startTime;
    this.#durations.push(duration);
    this.#completedItems.add(itemId);

    // Log progress if interval reached or at completion
    const completed = this.#completedItems.size;
    const total = this.#countTotalSubtasks();

    if (completed % this.#options.logInterval === 0 || completed === total) {
      const progress = this.getProgress();
      this.#logger.info(
        {
          type: 'progress',
          completed: progress.completed,
          total: progress.total,
          percentage: progress.percentage,
          eta: progress.eta === Infinity ? null : progress.eta,
          elapsed: progress.elapsed,
        },
        'Progress update'
      );
    }

    this.#logger.debug({ itemId, duration }, 'Task completed');
  }

  /**
   * Gets current progress report
   *
   * @returns Progress report with all metrics
   *
   * @remarks
   * Counts total subtasks from backlog (expensive operation).
   * Consider caching result if called frequently.
   *
   * @example
   * ```typescript
   * const report = tracker.getProgress();
   * console.log(`Completed: ${report.completed}/${report.total}`);
   * console.log(`Percentage: ${report.percentage.toFixed(1)}%`);
   * ```
   */
  getProgress(): ProgressReport {
    const total = this.#countTotalSubtasks();
    const completed = this.#completedItems.size;
    const remaining = total - completed;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const averageDuration = this.#getAverageDuration();
    const elapsed =
      this.#firstStartTime !== null ? Date.now() - this.#firstStartTime : 0;
    const eta = this.getETA();

    return {
      completed,
      total,
      percentage,
      remaining,
      averageDuration,
      eta,
      elapsed,
    };
  }

  /**
   * Estimates time remaining
   *
   * @returns ETA in milliseconds (Infinity if unknown)
   *
   * @remarks
   * Uses exponential smoothing on task speed (tasks/second).
   * Returns Infinity until minSamples tasks completed.
   *
   * Smoothing formula: S_t = alpha * X_t + (1 - alpha) * S_{t-1}
   *
   * Where:
   * - S_t is the smoothed speed
   * - X_t is the current speed (tasks/second)
   * - alpha is the smoothing factor (default: 0.3)
   *
   * @example
   * ```typescript
   * const eta = tracker.getETA();
   * if (eta === Infinity) {
   *   console.log('Calculating ETA...');
   * } else {
   *   console.log(`ETA: ${Math.floor(eta / 1000)}s`);
   * }
   * ```
   */
  getETA(): number {
    const minSamples = this.#options.minSamples;

    // Need minimum samples before showing ETA
    if (this.#durations.length < minSamples) {
      return Infinity;
    }

    // Calculate remaining tasks
    const total = this.#countTotalSubtasks();
    const completed = this.#completedItems.size;
    const remaining = total - completed;

    // If all tasks complete, ETA is 0
    if (remaining === 0) {
      return 0;
    }

    const avgDuration = this.#getAverageDuration();
    if (avgDuration === 0) {
      return Infinity;
    }

    // Calculate current speed (tasks per second)
    const currentSpeed = 1000 / avgDuration;

    // Apply exponential smoothing
    const alpha = this.#options.etaAlpha;
    if (this.#smoothedSpeed === null) {
      this.#smoothedSpeed = currentSpeed;
    } else {
      this.#smoothedSpeed =
        alpha * currentSpeed + (1 - alpha) * this.#smoothedSpeed;
    }

    if (this.#smoothedSpeed === 0) {
      return Infinity;
    }

    return (remaining / this.#smoothedSpeed) * 1000;
  }

  /**
   * Formats progress as human-readable string
   *
   * @returns Formatted progress line
   *
   * @remarks
   * Includes progress bar, percentage, task count, and ETA.
   * Example: "[==========          ] 50% (50/100) ETA: 1m 30s"
   *
   * Progress bar uses '=' for completed and '-' for remaining.
   *
   * @example
   * ```typescript
   * console.log(tracker.formatProgress());
   * // Output: [==========          ] 50% (50/100) ETA: 1m 30s
   * ```
   */
  formatProgress(): string {
    const progress = this.getProgress();
    const bar = this.#createProgressBar(progress.percentage);
    const eta = this.#formatDuration(progress.eta);

    return (
      `${bar} ${progress.percentage.toFixed(0).padStart(3)}% ` +
      `(${progress.completed}/${progress.total}) ETA: ${eta}`
    );
  }

  /**
   * Counts total subtasks in backlog
   *
   * @returns Total subtask count
   *
   * @remarks
   * Follows pattern from prp-pipeline.ts #countTasks().
   * Only counts leaf subtasks, not parent items.
   *
   * Uses nested loops through phase.milestones.tasks.subtasks.
   *
   * @private
   */
  #countTotalSubtasks(): number {
    let count = 0;
    for (const phase of this.backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          count += task.subtasks.length;
        }
      }
    }
    return count;
  }

  /**
   * Calculates average task duration
   *
   * @returns Average duration in milliseconds (0 if no data)
   *
   * @private
   */
  #getAverageDuration(): number {
    if (this.#durations.length === 0) {
      return 0;
    }
    const sum = this.#durations.reduce((a, b) => a + b, 0);
    return sum / this.#durations.length;
  }

  /**
   * Creates ASCII progress bar
   *
   * @param percentage - Completion percentage (0-100)
   * @returns Progress bar string
   *
   * @remarks
   * Uses '=' for filled portion and '-' for empty portion.
   * Width is configurable via barWidth option.
   *
   * @private
   */
  #createProgressBar(percentage: number): string {
    const width = this.#options.barWidth;
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;

    return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
  }

  /**
   * Formats duration as human-readable string
   *
   * @param milliseconds - Duration in milliseconds
   * @returns Formatted duration
   *
   * @remarks
   * Formats:
   * - < 60s: "30s"
   * - < 3600s: "1m 30s" (pad seconds to 2 digits)
   * - >= 3600s: "1h 01m" (pad minutes to 2 digits)
   * - Infinity: "calculating..."
   *
   * @private
   */
  #formatDuration(milliseconds: number): string {
    if (milliseconds === Infinity || !isFinite(milliseconds)) {
      return 'calculating...';
    }

    const seconds = Math.floor(milliseconds / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
  }
}

/**
 * Factory function for creating progress tracker
 *
 * @param options - Configuration options
 * @returns Progress tracker instance
 *
 * @remarks
 * Convenience function for creating tracker. Equivalent to
 * `new ProgressTracker(options)`.
 *
 * @example
 * ```typescript
 * const tracker = progressTracker({
 *   backlog: myBacklog,
 *   logInterval: 10
 * });
 * ```
 */
export function progressTracker(
  options: ProgressTrackerOptions
): ProgressTracker {
  return new ProgressTracker(options);
}
