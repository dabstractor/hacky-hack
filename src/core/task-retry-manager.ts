/**
 * Task Retry Manager for automatic retry of failed subtasks
 *
 * @module core/task-retry-manager
 *
 * @remarks
 * Provides intelligent retry logic for subtask execution with error classification,
 * exponential backoff, and status updates. Uses existing retry utility functions
 * for consistency with the codebase.
 *
 * Features:
 * - Error classification (transient vs permanent vs unknown)
 * - Exponential backoff with jitter (1s -> 2s -> 4s -> 8s, capped at 30s)
 * - Configurable max attempts (default: 3)
 * - Status updates to 'Retrying' during retry attempts
 * - Structured logging with retry context
 * - Artifact preservation (PRP cache, session state)
 *
 * @example
 * ```typescript
 * import { TaskRetryManager } from './core/task-retry-manager.js';
 *
 * const retryManager = new TaskRetryManager({}, sessionManager);
 * const result = await retryManager.executeWithRetry(subtask, async () => {
 *   return await prpRuntime.executeSubtask(subtask, backlog);
 * });
 * ```
 */

import { isTransientError, isPermanentError, calculateDelay, sleep } from '../utils/retry.js';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';
import type { Subtask, Status } from './models.js';
import type { SessionManager } from './session-manager.js';

/**
 * Configuration for task retry behavior
 *
 * @remarks
 * All properties are optional with sensible defaults for subtask execution.
 */
export interface TaskRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;

  /** Base delay before first retry in milliseconds (default: 1000) */
  baseDelay: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay: number;

  /** Exponential backoff multiplier (default: 2) */
  backoffFactor: number;

  /** Jitter factor 0-1 for randomization (default: 0.1) */
  jitterFactor: number;

  /** Enable/disable retry globally (default: true) */
  enabled: boolean;
}

/**
 * State tracked for each subtask during retry
 *
 * @remarks
 * Retry state is NOT persisted to Subtask schema (to avoid schema changes).
 * It's tracked in-memory during task execution only.
 */
interface RetryState {
  /** Number of retry attempts made */
  retryAttempts: number;

  /** Last error encountered (for context) */
  lastError?: {
    message: string;
    code?: string;
    timestamp: Date;
  };

  /** Timestamp of first attempt */
  firstAttemptAt?: Date;

  /** Timestamp of last attempt */
  lastAttemptAt?: Date;
}

/**
 * Default retry configuration
 *
 * @remarks
 * - maxAttempts: 3 (1 initial + 2 retries)
 * - baseDelay: 1000ms (1 second)
 * - maxDelay: 30000ms (30 seconds)
 * - backoffFactor: 2 (exponential)
 * - jitterFactor: 0.1 (10% variance)
 * - enabled: true (retry enabled by default)
 */
const DEFAULT_TASK_RETRY_CONFIG: TaskRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
  enabled: true,
};

/**
 * Task Retry Manager for automatic retry of failed subtasks
 *
 * @remarks
 * Manages retry logic for subtask execution with intelligent error classification
 * and exponential backoff. Integrates with SessionManager for status updates.
 *
 * Error classification:
 * - Transient errors: Retry with exponential backoff (network issues, timeouts, rate limits)
 * - Permanent errors: Fail immediately (validation errors, parse failures, auth errors)
 * - Unknown errors: Fail immediately (fail-safe approach)
 *
 * Status progression during retry:
 * - Initial attempt: 'Implementing' (set by TaskOrchestrator)
 * - During retry: 'Retrying' (set by TaskRetryManager)
 * - Success: 'Complete' (set by TaskOrchestrator)
 * - Final failure: 'Failed' (set by TaskOrchestrator after max retries)
 *
 * @example
 * ```typescript
 * const retryManager = new TaskRetryManager(
 *   { maxAttempts: 5, baseDelay: 2000 },
 *   sessionManager
 * );
 *
 * const result = await retryManager.executeWithRetry(subtask, async () => {
 *   return await prpRuntime.executeSubtask(subtask, backlog);
 * });
 * ```
 */
export class TaskRetryManager {
  readonly #logger: Logger;
  readonly #config: TaskRetryConfig;
  readonly #sessionManager: SessionManager;

  /**
   * Creates a new TaskRetryManager instance
   *
   * @param config - Partial retry configuration (merged with defaults)
   * @param sessionManager - Session manager for status updates
   *
   * @remarks
   * Config is merged with DEFAULT_TASK_RETRY_CONFIG using spread operator.
   * Only provide properties to override; others use defaults.
   */
  constructor(config: Partial<TaskRetryConfig> = {}, sessionManager: SessionManager) {
    this.#logger = getLogger('TaskRetryManager');
    this.#sessionManager = sessionManager;
    this.#config = { ...DEFAULT_TASK_RETRY_CONFIG, ...config };
  }

  /**
   * Execute a function with retry logic
   *
   * @template T - Return type of the execute function
   * @param subtask - The subtask being executed
   * @param executeFn - The function to execute (typically PRPRuntime.executeSubtask)
   * @returns Result of executeFn on success
   * @throws Last error if max retries exhausted or error is permanent
   *
   * @remarks
   * Retry flow:
   * 1. If retry disabled, execute directly without retry logic
   * 2. Initialize retry state (attempt count, timestamps)
   * 3. For each attempt:
   *    a. Log execution attempt
   *    b. Execute the function
   *    c. On success: log if retries were made, return result
   *    d. On error: classify error type
   * 4. If permanent error: log and throw immediately
   * 5. If unknown error: log warning and throw (fail-safe)
   * 6. If max attempts reached: log error and throw
   * 7. Calculate delay with exponential backoff
   * 8. Update retry state and set status to 'Retrying'
   * 9. Log retry attempt with context
   * 10. Sleep for delay, then loop
   *
   * Artifacts are preserved between retries:
   * - PRP cache: Stored in ResearchQueue, not affected by retry
   * - Session state: Preserved via SessionManager flushUpdates()
   *
   * @example
   * ```typescript
   * const result = await retryManager.executeWithRetry(subtask, async () => {
   *   return await prpRuntime.executeSubtask(subtask, backlog);
   * });
   * ```
   */
  async executeWithRetry<T>(
    subtask: Subtask,
    executeFn: () => Promise<T>
  ): Promise<T> {
    // PATTERN: If retry disabled, execute directly
    if (!this.#config.enabled) {
      this.#logger.debug(
        { subtaskId: subtask.id },
        'Retry disabled, executing directly'
      );
      return await executeFn();
    }

    // PATTERN: Initialize retry state
    const retryState: RetryState = {
      retryAttempts: 0,
      firstAttemptAt: new Date(),
    };

    let lastError: Error;

    // PATTERN: Retry loop with attempt counter
    for (let attempt = 0; attempt < this.#config.maxAttempts; attempt++) {
      try {
        // Log execution attempt
        this.#logger.debug(
          {
            subtaskId: subtask.id,
            attempt: attempt + 1,
            maxAttempts: this.#config.maxAttempts,
          },
          `Executing subtask (attempt ${attempt + 1}/${this.#config.maxAttempts})`
        );

        // Execute the function
        const result = await executeFn();

        // PATTERN: Log success if we retried
        if (attempt > 0) {
          this.#logger.info(
            {
              subtaskId: subtask.id,
              totalAttempts: attempt + 1,
              durationMs: Date.now() - retryState.firstAttemptAt!.getTime(),
            },
            `Subtask succeeded after ${attempt} retries`
          );
        }

        return result;

      } catch (error) {
        lastError = error as Error;

        // Classify error
        const errorType = this.classifyError(error);

        // PATTERN: Permanent error - fail immediately
        if (errorType === 'permanent') {
          this.#logger.error(
            {
              subtaskId: subtask.id,
              error: lastError.message,
              errorType,
            },
            `Subtask failed with permanent error: ${lastError.message}`
          );
          throw lastError;
        }

        // PATTERN: Unknown error - treat as non-retryable (fail safe)
        if (errorType === 'unknown') {
          this.#logger.warn(
            {
              subtaskId: subtask.id,
              error: lastError.message,
              errorType,
            },
            `Subtask failed with unknown error type: ${lastError.message}`
          );
          throw lastError;
        }

        // PATTERN: Check if max attempts reached
        if (attempt >= this.#config.maxAttempts - 1) {
          this.#logger.error(
            {
              subtaskId: subtask.id,
              totalAttempts: attempt + 1,
              maxAttempts: this.#config.maxAttempts,
              finalError: lastError.message,
            },
            `Subtask failed after ${attempt + 1} attempts: ${lastError.message}`
          );
          throw lastError;
        }

        // Calculate delay using existing retry utility
        const delay = this.calculateDelay(attempt);

        // Update retry state
        retryState.retryAttempts = attempt + 1;
        retryState.lastError = {
          message: lastError.message,
          code: (lastError as { code?: string }).code,
          timestamp: new Date(),
        };
        retryState.lastAttemptAt = new Date();

        // Update status to 'Retrying'
        await this.#sessionManager.updateItemStatus(
          subtask.id,
          'Retrying' as Status
        );
        await this.#sessionManager.flushUpdates();

        // Log retry attempt
        this.#logger.info(
          {
            subtaskId: subtask.id,
            attempt: retryState.retryAttempts,
            maxAttempts: this.#config.maxAttempts,
            delayMs: delay,
            errorName: lastError.constructor.name,
            errorCode: (lastError as { code?: string }).code,
          },
          `Retrying subtask ${subtask.id} (${retryState.retryAttempts}/${this.#config.maxAttempts}) after ${delay}ms`
        );

        // Wait before retry
        await sleep(delay);
      }
    }

    // Should not reach here, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Classify error as retryable, permanent, or unknown
   *
   * @param error - Unknown error to classify
   * @returns 'retryable' | 'permanent' | 'unknown'
   *
   * @remarks
   * Uses existing error classification functions from src/utils/retry.ts:
   * - isPermanentError(): ValidationError, HTTP 4xx (except 408, 429), parse errors
   * - isTransientError(): Network errors, HTTP 5xx, 408, 429, agent timeouts/LLM failures
   * - Fallback: 'unknown' (fail-safe - no retry)
   *
   * Classification priority (order matters):
   * 1. Permanent: ValidationError, HTTP 4xx client errors
   * 2. Retryable: Network issues, timeouts, rate limits, server errors
   * 3. Unknown: Everything else (fail-safe)
   *
   * @example
   * ```typescript
   * const errorType = retryManager.classifyError(error);
   * if (errorType === 'retryable') {
   *   // Retry with backoff
   * } else if (errorType === 'permanent') {
   *   // Fail immediately
   * } else {
   *   // Unknown - fail safe
   * }
   * ```
   */
  classifyError(error: unknown): 'retryable' | 'permanent' | 'unknown' {
    // PATTERN: Check permanent first (fail-fast)
    if (isPermanentError(error)) {
      return 'permanent';
    }

    // PATTERN: Check retryable second
    if (isTransientError(error)) {
      return 'retryable';
    }

    // PATTERN: Unknown errors are non-retryable (fail-safe)
    return 'unknown';
  }

  /**
   * Calculate exponential backoff delay with jitter
   *
   * @param attempt - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   *
   * @remarks
   * Reuses existing calculateDelay function from src/utils/retry.ts.
   * Formula: exponentialDelay + jitter
   * Where:
   * - exponentialDelay = min(baseDelay * backoffFactor ^ attempt, maxDelay)
   * - jitter = exponentialDelay * jitterFactor * random()
   *
   * Example with default config (baseDelay=1000, backoffFactor=2, maxDelay=30000, jitterFactor=0.1):
   * - Attempt 0: 1000ms to 1100ms (positive-only jitter)
   * - Attempt 1: 2000ms to 2200ms
   * - Attempt 2: 4000ms to 4400ms
   * - Attempt 3: 8000ms to 8800ms
   * - Attempt 4+: 30000ms to 33000ms (capped)
   *
   * @example
   * ```typescript
   * const delay = retryManager.calculateDelay(2); // ~4000ms with jitter
   * ```
   */
  calculateDelay(attempt: number): number {
    return calculateDelay(
      attempt,
      this.#config.baseDelay,
      this.#config.maxDelay,
      this.#config.backoffFactor,
      this.#config.jitterFactor
    );
  }

  /**
   * Gets the current retry configuration
   *
   * @returns Copy of the current retry configuration
   *
   * @remarks
   * Returns a shallow copy to prevent external mutation of internal config.
   * Useful for logging and debugging.
   *
   * @example
   * ```typescript
   * const config = retryManager.getConfig();
   * console.log(`Max attempts: ${config.maxAttempts}`);
   * ```
   */
  getConfig(): TaskRetryConfig {
    return { ...this.#config };
  }
}
