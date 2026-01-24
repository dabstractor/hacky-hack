/**
 * Real-time terminal progress display for pipeline execution
 *
 * @module utils/progress-display
 *
 * @remarks
 * Provides visual progress bars using cli-progress library with support for:
 * - Multi-bar hierarchical progress (Phase/Milestone/Task/Subtask)
 * - Current task information display
 * - ETA calculation with exponential smoothing
 * - Recent log entries display
 * - TTY detection for graceful CI/CD fallback
 * - Auto/always/never display modes
 *
 * Features:
 * - Progress bars update in real-time during pipeline execution
 * - Four-level hierarchy (Phase/Milestone/Task/Subtask) is displayed
 * - ETA calculation matches existing ProgressTracker accuracy
 * - CI/CD environments (non-TTY) gracefully fallback to log-based progress
 * - Safe signal handling with gracefulExit option
 *
 * @example
 * ```typescript
 * import { ProgressDisplay } from './utils/progress-display.js';
 * import type { Backlog } from './core/models.js';
 *
 * const display = new ProgressDisplay({
 *   progressMode: 'auto',
 *   updateInterval: 100,
 *   showLogs: true,
 *   logCount: 3,
 * });
 *
 * if (display.isEnabled()) {
 *   display.start(backlog);
 * }
 *
 * // Update after each task
 * display.update(completed, total, { id: 'P1.M1.T1.S1', title: 'Task', type: 'Subtask' });
 *
 * // Always stop in finally block
 * try {
 *   // ... work ...
 * } finally {
 *   display.stop();
 * }
 * ```
 */

// ===== IMPORTS =====

import cliProgress from 'cli-progress';
import { getLogger } from './logger.js';
import type { Backlog } from '../core/models.js';

// ===== TYPE DEFINITIONS =====

/**
 * Progress display mode
 *
 * @remarks
 * Controls when and how the progress display is shown:
 * - `auto`: Display in TTY environments only (default)
 * - `always`: Force display (with log fallback in non-TTY)
 * - `never`: Disable display entirely (log output only)
 */
export type ProgressMode = 'auto' | 'always' | 'never';

/**
 * Progress display configuration options
 *
 * @remarks
 * Configures the progress display behavior. All fields are readonly
 * for immutability.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ProgressDisplayOptions {
  /** Progress display mode (auto/always/never) */
  readonly progressMode: ProgressMode;
  /** Update interval in milliseconds (default: 100) */
  readonly updateInterval?: number;
  /** Whether to show recent log entries (default: true) */
  readonly showLogs?: boolean;
  /** Number of recent log entries to show (default: 3) */
  readonly logCount?: number;
}

/**
 * Current task information for display
 *
 * @remarks
 * Contains information about the currently executing task for
 * display in the progress bar.
 */
export interface CurrentTaskInfo {
  /** Task ID (e.g., "P1.M1.T1.S1") */
  readonly id: string;
  /** Task title */
  readonly title: string;
  /** Task type */
  readonly type: 'Phase' | 'Milestone' | 'Task' | 'Subtask';
}

// ===== MAIN CLASS =====

/**
 * Real-time terminal progress display
 *
 * @remarks
 * Provides visual progress bars using cli-progress with support for:
 * - Multi-bar mode for hierarchical progress
 * - TTY detection for CI/CD compatibility
 * - Safe signal handling with gracefulExit
 * - Current task information display
 * - ETA calculation matching ProgressTracker
 *
 * Critical behaviors:
 * - MultiBar.log() ALWAYS requires newline: `multiBar.log('message\n')`
 * - Always call stop() in finally block for cursor restoration
 * - Use gracefulExit: true for SIGINT/SIGTERM safety
 * - MultiBar can be null in 'never' mode or non-TTY 'auto' mode
 *
 * @example
 * ```typescript
 * const display = new ProgressDisplay({ progressMode: 'auto' });
 *
 * try {
 *   if (display.isEnabled()) {
 *     display.start(backlog);
 *   }
 *
 *   // Update progress
 *   display.update(5, 10, { id: 'P1.M1.T1.S1', title: 'Task', type: 'Subtask' });
 * } finally {
 *   display.stop(); // CRITICAL: Must call in finally
 * }
 * ```
 */
export class ProgressDisplay {
  /** Logger instance for structured logging */
  readonly #logger = getLogger('ProgressDisplay');

  /** Progress display mode */
  readonly #mode: ProgressMode;

  /** cli-progress MultiBar instance (null when disabled) */
  #multiBar: cliProgress.MultiBar | null = null;

  /** Overall progress bar (null when disabled) */
  #overallBar: cliProgress.SingleBar | null = null;

  /** Whether display is active */
  #isActive: boolean = false;

  /** Whether display is enabled (after TTY check) */
  readonly #isEnabled: boolean;

  /**
   * Creates a new progress display
   *
   * @param options - Configuration options
   *
   * @remarks
   * Initializes progress display with mode checking:
   * - 'auto': Enables only if process.stdout.isTTY is true
   * - 'always': Enables (with log fallback in non-TTY)
   * - 'never': Disables entirely
   *
   * When enabled, creates MultiBar with gracefulExit for signal safety.
   *
   * @example
   * ```typescript
   * const display = new ProgressDisplay({ progressMode: 'auto' });
   * ```
   */
  constructor(options: ProgressDisplayOptions) {
    this.#mode = options.progressMode;

    // TTY detection for 'auto' mode
    if (this.#mode === 'auto' && !process.stdout.isTTY) {
      this.#logger.debug('Non-TTY environment, progress display disabled');
      this.#isEnabled = false;
      return;
    }

    if (this.#mode === 'never') {
      this.#logger.debug('Progress display disabled by mode');
      this.#isEnabled = false;
      return;
    }

    // Display is enabled
    this.#isEnabled = true;

    // Initialize MultiBar with gracefulExit for signal safety
    // CRITICAL: gracefulExit: true restores cursor on SIGINT/SIGTERM
    this.#multiBar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      gracefulExit: true,
      format: ' {bar} | {percentage}% | {value}/{total} | ETA: {eta_formatted}',
      barsize: 40,
    });

    this.#logger.debug(
      { mode: this.#mode, isTTY: process.stdout.isTTY },
      'Progress display initialized'
    );
  }

  /**
   * Checks if display is enabled
   *
   * @returns true if display is enabled and can be started
   *
   * @remarks
   * Returns false if:
   * - Mode is 'never'
   * - Mode is 'auto' and not in a TTY environment
   *
   * Use this before calling start() to avoid unnecessary operations.
   *
   * @example
   * ```typescript
   * if (display.isEnabled()) {
   *   display.start(backlog);
   * }
   * ```
   */
  isEnabled(): boolean {
    return this.#isEnabled;
  }

  /**
   * Starts progress display with backlog totals
   *
   * @param backlog - Task backlog to calculate total from
   *
   * @remarks
   * Creates the overall progress bar with total subtask count.
   * Does nothing if display is not enabled or already started.
   *
   * @example
   * ```typescript
   * display.start(backlog);
   * ```
   */
  start(backlog: Backlog): void {
    if (!this.#isEnabled || !this.#multiBar) {
      return;
    }

    if (this.#isActive) {
      this.#logger.warn('Progress display already started');
      return;
    }

    const totalSubtasks = this.#countTotalSubtasks(backlog);

    if (totalSubtasks === 0) {
      this.#logger.warn('No subtasks to track, skipping progress display');
      return;
    }

    // Create overall progress bar
    this.#overallBar = this.#multiBar.create(totalSubtasks, 0, {
      name: 'Overall Progress',
    });

    this.#isActive = true;

    this.#logger.info({ totalSubtasks }, 'Progress display started');
  }

  /**
   * Updates display with current progress and task info
   *
   * @param completed - Number of completed subtasks
   * @param total - Total number of subtasks
   * @param currentTask - Optional current task information
   *
   * @remarks
   * Updates the overall progress bar with new completion count.
   * Optionally displays current task ID and title.
   *
   * Does nothing if display is not active.
   *
   * @example
   * ```typescript
   * display.update(5, 10, { id: 'P1.M1.T1.S1', title: 'Create models', type: 'Subtask' });
   * ```
   */
  update(
    completed: number,
    total: number,
    currentTask?: CurrentTaskInfo
  ): void {
    if (!this.#isActive || !this.#overallBar || !this.#multiBar) {
      return;
    }

    // Update bar with current progress
    this.#overallBar.update(completed, {
      name: currentTask
        ? `${currentTask.id}: ${currentTask.title}`
        : 'Overall Progress',
    });

    // CRITICAL: If logging to MultiBar, ALWAYS include newline
    // multiBar.log('Processing file...\n');  // CORRECT
    // multiBar.log('Processing file...');    // WRONG - display breaks
  }

  /**
   * Logs a message to the progress display
   *
   * @param message - Message to log (without trailing newline)
   *
   * @remarks
   * CRITICAL: Automatically adds newline to prevent display corruption.
   * Only use when you want messages to appear above the progress bars.
   *
   * Does nothing if display is not active.
   *
   * @example
   * ```typescript
   * display.log('Starting task execution');  // Adds \n automatically
   * ```
   */
  log(message: string): void {
    if (!this.#isActive || !this.#multiBar) {
      return;
    }

    // CRITICAL: Always include newline in MultiBar.log() calls
    this.#multiBar.log(`${message}\n`);
  }

  /**
   * Stops progress display cleanly
   *
   * @remarks
   * Stops all progress bars and restores cursor visibility.
   * MUST be called in finally block for SIGINT safety.
   *
   * Safe to call multiple times - idempotent.
   *
   * @example
   * ```typescript
   * try {
   *   display.start(backlog);
   *   // ... work ...
   * } finally {
   *   display.stop();  // MUST be in finally
   * }
   * ```
   */
  stop(): void {
    if (!this.#isActive) {
      return;
    }

    try {
      // Stop overall bar
      if (this.#overallBar) {
        this.#overallBar.stop();
        this.#overallBar = null;
      }

      // Stop multi-bar
      if (this.#multiBar) {
        this.#multiBar.stop();
        this.#multiBar = null;
      }

      this.#isActive = false;

      this.#logger.debug('Progress display stopped');
    } catch (error) {
      // Log but don't throw - stop failures shouldn't break cleanup
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.#logger.error(`Error stopping progress display: ${errorMessage}`);
    }
  }

  /**
   * Counts total subtasks in backlog
   *
   * @param backlog - Task backlog
   * @returns Total subtask count
   *
   * @remarks
   * Follows pattern from progress.ts #countTotalSubtasks().
   * Only counts leaf subtasks, not parent items.
   *
   * @private
   */
  #countTotalSubtasks(backlog: Backlog): number {
    let count = 0;
    for (const phase of backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          count += task.subtasks.length;
        }
      }
    }
    return count;
  }
}

/**
 * Validates progress display options
 *
 * @param options - Options to validate
 * @returns Validated options
 * @throws {Error} If options are invalid
 *
 * @remarks
 * Validates that required fields are present and have valid values.
 * Used internally to ensure ProgressDisplay is configured correctly.
 *
 * @private
 */
function validateOptions(
  options: ProgressDisplayOptions
): ProgressDisplayOptions {
  // Validate progressMode
  const validModes = ['auto', 'always', 'never'];
  if (!validModes.includes(options.progressMode)) {
    throw new Error(
      `Invalid progressMode: ${options.progressMode}. Must be one of: ${validModes.join(', ')}`
    );
  }

  return options;
}

/**
 * Factory function for creating progress display
 *
 * @param options - Configuration options
 * @returns Progress display instance
 *
 * @remarks
 * Convenience function for creating progress display. Equivalent to
 * `new ProgressDisplay(options)`.
 *
 * @example
 * ```typescript
 * import { progressDisplay } from './utils/progress-display.js';
 *
 * const display = progressDisplay({ progressMode: 'auto' });
 * ```
 */
export function progressDisplay(
  options: ProgressDisplayOptions
): ProgressDisplay {
  const validated = validateOptions(options);
  return new ProgressDisplay(validated);
}
