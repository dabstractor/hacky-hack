# Async/Await Error Handling Patterns in TypeScript for Workflow Systems

**Research Date:** 2026-01-13
**Task:** P3M2T1S3 - Research async/await error handling patterns
**Location:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P3M2T1S3/research/`

---

## Executive Summary

This research document compiles best practices for async/await error handling in TypeScript workflow systems, with specific focus on the PRP Pipeline's Task Orchestrator and Session Manager architecture. The patterns ensure Failed status is set on any exception, provide comprehensive error logging and observability, and handle Promise rejections robustly in async workflows.

---

## Table of Contents

1. [Try/Catch Patterns for Async Methods](#1-trycatch-patterns-for-async-methods)
2. [Ensuring Failed Status on Exceptions](#2-ensuring-failed-status-on-exceptions)
3. [Error Logging and Observability](#3-error-logging-and-observability)
4. [Promise Rejection Handling](#4-promise-rejection-handling)
5. [TypeScript-Specific Patterns](#5-typescript-specific-patterns)
6. [Workflow State Management on Errors](#6-workflow-state-management-on-errors)
7. [References and Resources](#7-references-and-resources)

---

## 1. Try/Catch Patterns for Async Methods

### 1.1 Basic Try/Catch Wrapper Pattern

**Current Implementation in TaskOrchestrator:**

```typescript
// File: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
// Lines: 365-401

async executeSubtask(subtask: Subtask): Promise<void> {
  console.log(
    `[TaskOrchestrator] Executing Subtask: ${subtask.id} - ${subtask.title}`
  );

  // Check if dependencies are satisfied
  if (!this.canExecute(subtask)) {
    const blockers = this.getBlockingDependencies(subtask);

    for (const blocker of blockers) {
      console.log(
        `[TaskOrchestrator] Blocked on: ${blocker.id} - ${blocker.title} (status: ${blocker.status})`
      );
    }

    console.log(
      `[TaskOrchestrator] Subtask ${subtask.id} blocked on dependencies, skipping`
    );

    return;
  }

  await this.#updateStatus(subtask.id, 'Implementing');
  console.log(`[TaskOrchestrator] PLACEHOLDER: Would generate PRP and run Coder agent`);
  console.log(`[TaskOrchestrator] Context scope: ${subtask.context_scope}`);
  await this.#updateStatus(subtask.id, 'Complete');
}
```

**Issue:** No try/catch block - any exception will leave the status as 'Implementing' permanently.

### 1.2 Recommended Pattern with Automatic Status Cleanup

```typescript
/**
 * Executes a Subtask with comprehensive error handling
 *
 * Pattern: Try-catch-finally with status rollback on error
 */
async executeSubtask(subtask: Subtask): Promise<void> {
  const initialStatus = subtask.status;

  try {
    // 1. Pre-execution validation
    if (!this.canExecute(subtask)) {
      const blockers = this.getBlockingDependencies(subtask);
      for (const blocker of blockers) {
        this.logger.warn(`[TaskOrchestrator] Blocked on: ${blocker.id}`, {
          subtaskId: subtask.id,
          blockerId: blocker.id,
          blockerStatus: blocker.status,
        });
      }
      return; // Early return without changing status
    }

    // 2. Set status to Implementing
    await this.#updateStatus(subtask.id, 'Implementing');
    this.sessionManager.setCurrentItem(subtask.id);

    // 3. Execute the work (may throw)
    await this.#executeSubtaskWork(subtask);

    // 4. Mark as Complete on success
    await this.#updateStatus(subtask.id, 'Complete');
    this.logger.info(`[TaskOrchestrator] Subtask ${subtask.id} completed successfully`);

  } catch (error) {
    // 5. Ensure Failed status is set on ANY exception
    await this.#updateStatus(subtask.id, 'Failed');

    // 6. Log structured error details
    this.logger.error(`[TaskOrchestrator] Subtask ${subtask.id} failed`, {
      subtaskId: subtask.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      initialStatus,
      failedStatus: 'Failed',
    });

    // 7. Re-throw for upstream handlers if needed
    throw error;
  } finally {
    // 8. Always clear current item
    this.sessionManager.setCurrentItem(null);
  }
}
```

### 1.3 Higher-Order Error Handler Pattern

```typescript
/**
 * Higher-order function that wraps async operations with error handling
 *
 * @param operation - The async operation to execute
 * @param context - Context information for error logging
 * @returns Wrapped operation with automatic error handling
 */
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    itemId: string;
    itemType: string;
    sessionManager: SessionManager;
    logger: Logger;
  }
): Promise<T> {
  const { itemId, itemType, sessionManager, logger } = context;

  try {
    return await operation();
  } catch (error) {
    // CRITICAL: Set Failed status before any other error handling
    await sessionManager.updateItemStatus(itemId, 'Failed');

    // Structured error logging
    logger.error(`${itemType} ${itemId} execution failed`, {
      itemId,
      itemType,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      status: 'Failed',
    });

    throw error; // Re-throw for caller to handle if needed
  }
}

// Usage:
async executeSubtask(subtask: Subtask): Promise<void> {
  await withErrorHandling(
    async () => {
      await this.#updateStatus(subtask.id, 'Implementing');
      await this.#executeSubtaskWork(subtask);
      await this.#updateStatus(subtask.id, 'Complete');
    },
    {
      itemId: subtask.id,
      itemType: 'Subtask',
      sessionManager: this.sessionManager,
      logger: this.logger,
    }
  );
}
```

---

## 2. Ensuring Failed Status on Exceptions

### 2.1 Status Type Definition

**Current Implementation in Models:**

```typescript
// File: /home/dustin/projects/hacky-hack/src/core/models.ts
// Lines: 55-61

export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

The `'Failed'` status is already defined in the type system, enabling proper error state tracking.

### 2.2 Idempotent Status Update Pattern

```typescript
/**
 * Ensures Failed status is set, handling concurrent updates gracefully
 *
 * @param itemId - The item to mark as failed
 * @param error - The error that caused the failure
 */
async function ensureFailedStatus(
  itemId: string,
  error: unknown,
  sessionManager: SessionManager
): Promise<void> {
  try {
    // Get current state
    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('No active session');
    }

    const currentItem = findItem(currentSession.taskRegistry, itemId);
    if (!currentItem) {
      throw new Error(`Item ${itemId} not found in registry`);
    }

    // Only update if not already Failed (avoid redundant writes)
    if (currentItem.status !== 'Failed') {
      await sessionManager.updateItemStatus(itemId, 'Failed');
    }

  } catch (updateError) {
    // Log but don't throw - we're already in an error state
    console.error(`[Critical] Failed to set Failed status for ${itemId}:`, updateError);
    console.error(`[Critical] Original error:`, error);
  }
}
```

### 2.3 Transaction-Like Status Management

```typescript
/**
 * Executes an operation with transaction-like status guarantees
 *
 * Guarantees:
 * 1. Status is set to 'Implementing' before operation starts
 * 2. Status is set to 'Failed' if operation throws
 * 3. Status is set to 'Complete' if operation succeeds
 * 4. Original status is restored if setup fails
 */
async function executeWithStatusTransaction<T>(
  itemId: string,
  sessionManager: SessionManager,
  operation: () => Promise<T>
): Promise<T> {
  const originalStatus = findItem(
    sessionManager.currentSession!.taskRegistry,
    itemId
  )!.status;

  try {
    // Phase 1: Transition to Implementing
    await sessionManager.updateItemStatus(itemId, 'Implementing');

    // Phase 2: Execute the operation
    const result = await operation();

    // Phase 3: Success - mark Complete
    await sessionManager.updateItemStatus(itemId, 'Complete');

    return result;

  } catch (error) {
    // CRITICAL: Ensure Failed status on error
    await ensureFailedStatus(itemId, error, sessionManager);

    throw error; // Re-throw for upstream handling

  } catch (updateError) {
    // If we can't even update to Implementing, restore original status
    await sessionManager.updateItemStatus(itemId, originalStatus);
    throw updateError;
  }
}
```

---

## 3. Error Logging and Observability

### 3.1 Structured Error Logging Interface

```typescript
/**
 * Structured logger interface for workflow observability
 */
interface WorkflowLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Error metadata for structured logging
 */
interface ErrorMetadata {
  /** Item that failed */
  itemId: string;
  /** Type of item (Phase, Milestone, Task, Subtask) */
  itemType: string;
  /** Error message */
  error: string;
  /** Stack trace if available */
  stack?: string;
  /** Error code or category */
  code?: string;
  /** Timestamp of error */
  timestamp: Date;
  /** Session ID */
  sessionId: string;
  /** Status before error */
  previousStatus: Status;
  /** Status after error (should be 'Failed') */
  currentStatus: Status;
  /** Whether error is retryable */
  retryable: boolean;
  /** Dependency information if blocked */
  dependencies?: string[];
}
```

### 3.2 Error Context Enrichment Pattern

```typescript
/**
 * Enriches errors with workflow context for better observability
 */
class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly context: {
      itemId: string;
      itemType: string;
      sessionId: string;
      timestamp: Date;
      originalError?: unknown;
    }
  ) {
    super(message);
    this.name = 'WorkflowError';
  }

  /**
   * Converts error to structured logging format
   */
  toLogEntry(): ErrorMetadata {
    return {
      itemId: this.context.itemId,
      itemType: this.context.itemType,
      error: this.message,
      stack: this.stack,
      timestamp: this.context.timestamp,
      sessionId: this.context.sessionId,
      previousStatus: 'Implementing',
      currentStatus: 'Failed',
      retryable: this.isRetryable(),
    };
  }

  /**
   * Determines if error is retryable
   */
  private isRetryable(): boolean {
    // Network errors, timeouts, and transient failures are retryable
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
    ];

    return retryablePatterns.some(pattern =>
      pattern.test(this.message)
    );
  }
}
```

### 3.3 Error Aggregation for Batch Operations

```typescript
/**
 * Aggregates errors from parallel operations
 */
interface AggregateError {
  total: number;
  failed: number;
  succeeded: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}

/**
 * Executes operations in parallel and aggregates results
 */
async function executeParallelWithErrorAggregation(
  operations: Array<{
    itemId: string;
    work: () => Promise<void>;
  }>
): Promise<AggregateError> {
  const results = await Promise.allSettled(
    operations.map(op => op.work())
  );

  const aggregate: AggregateError = {
    total: operations.length,
    failed: 0,
    succeeded: 0,
    errors: [],
  };

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      aggregate.succeeded++;
    } else {
      aggregate.failed++;
      aggregate.errors.push({
        itemId: operations[index].itemId,
        error: result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
      });
    }
  });

  return aggregate;
}
```

---

## 4. Promise Rejection Handling

### 4.1 Global Unhandled Rejection Handler

```typescript
/**
 * Global handler for unhandled promise rejections
 *
 * CRITICAL: Prevents process crashes from unhandled rejections
 * and ensures Failed status is set even for uncaught errors.
 */
export function setupGlobalErrorHandlers(sessionManager: SessionManager): void {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
    console.error('[FATAL] Unhandled Promise Rejection:', reason);
    console.error('[FATAL] Promise:', promise);

    // Try to extract item ID from error if available
    const itemId = extractItemIdFromError(reason);

    if (itemId) {
      try {
        await sessionManager.updateItemStatus(itemId, 'Failed');
        console.error(`[Recovery] Set Failed status for ${itemId}`);
      } catch (recoveryError) {
        console.error('[Recovery Failed]', recoveryError);
      }
    }

    // Log to error tracking service (Sentry, etc.)
    await logToErrorTracking({
      type: 'unhandledRejection',
      reason,
      promise,
      timestamp: new Date(),
    });

    // Decide whether to exit process
    // In production, you might want to exit to prevent undefined state
    if (process.env.NODE_ENV === 'production') {
      console.error('[FATAL] Exiting process due to unhandled rejection');
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error: Error) => {
    console.error('[FATAL] Uncaught Exception:', error);
    console.error('[FATAL] Stack:', error.stack);

    await logToErrorTracking({
      type: 'uncaughtException',
      error,
      timestamp: new Date(),
    });

    console.error('[FATAL] Exiting process due to uncaught exception');
    process.exit(1);
  });
}

/**
 * Attempts to extract item ID from error object
 */
function extractItemIdFromError(error: unknown): string | null {
  if (error instanceof WorkflowError) {
    return error.context.itemId;
  }

  if (error instanceof Error && 'itemId' in error) {
    return String((error as Record<string, unknown>).itemId);
  }

  // Try parsing error message for item ID pattern
  if (typeof error === 'string') {
    const match = error.match(/[PM]\d+\.[PM]\d+\.T\d+\.S\d+/);
    return match ? match[0] : null;
  }

  return null;
}
```

### 4.2 Promise Rejection Handling in Workflows

```typescript
/**
 * Wraps Promise execution with rejection handling
 *
 * Ensures that rejected promises result in Failed status
 */
async function executeWithRejectionHandling<T>(
  itemId: string,
  promise: Promise<T>,
  sessionManager: SessionManager
): Promise<T> {
  return promise.catch(async (error: unknown) => {
    // Set Failed status
    await sessionManager.updateItemStatus(itemId, 'Failed');

    // Log structured error
    console.error(`[Promise Rejection] ${itemId} failed:`, error);

    // Re-throw with additional context
    throw new WorkflowError(
      `Promise rejected for ${itemId}: ${error instanceof Error ? error.message : String(error)}`,
      {
        itemId,
        itemType: 'Subtask',
        sessionId: sessionManager.currentSession?.metadata.id || 'unknown',
        timestamp: new Date(),
        originalError: error,
      }
    );
  });
}
```

### 4.3 Parallel Execution with Error Isolation

```typescript
/**
 * Executes subtasks in parallel with isolated error handling
 *
 * Pattern: Each subtask's failure doesn't prevent others from running
 */
async function executeSubtasksParallel(
  subtasks: Subtask[],
  sessionManager: SessionManager
): Promise<void> {
  // Map each subtask to a promise with isolated error handling
  const promises = subtasks.map(async (subtask) => {
    try {
      await executeSubtask(subtask);
    } catch (error) {
      // Error already handled in executeSubtask (status set to Failed)
      // Just log and continue with other subtasks
      console.error(`[Parallel Execution] ${subtask.id} failed, continuing...`);
    }
  });

  // Wait for all to complete (some may have failed)
  await Promise.all(promises);
}

/**
 * Executes subtasks sequentially with error propagation
 *
 * Pattern: Stop on first failure (strict mode)
 */
async function executeSubtasksSequential(
  subtasks: Subtask[],
  sessionManager: SessionManager
): Promise<void> {
  for (const subtask of subtasks) {
    try {
      await executeSubtask(subtask);
    } catch (error) {
      // Propagate error to stop execution
      throw new WorkflowError(
        `Sequential execution stopped at ${subtask.id}`,
        {
          itemId: subtask.id,
          itemType: 'Subtask',
          sessionId: sessionManager.currentSession?.metadata.id || 'unknown',
          timestamp: new Date(),
          originalError: error,
        }
      );
    }
  }
}
```

---

## 5. TypeScript-Specific Patterns

### 5.1 Error Type Guards

```typescript
/**
 * Type guard for Error instances
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard for WorkflowError
 */
function isWorkflowError(error: unknown): error is WorkflowError {
  return error instanceof WorkflowError;
}

/**
 * Type-safe error logging
 */
function logError(error: unknown): void {
  if (isWorkflowError(error)) {
    console.error('[WorkflowError]', {
      message: error.message,
      itemId: error.context.itemId,
      itemType: error.context.itemType,
      timestamp: error.context.timestamp,
    });
  } else if (isError(error)) {
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error('[Unknown Error]', error);
  }
}
```

### 5.2 Result Type Pattern (Functional Error Handling)

```typescript
/**
 * Result type for operations that can fail
 *
 * Pattern: Encode errors in the type system instead of throwing
 */
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Wraps async operation in Result type
 */
async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Executes subtask with Result type
 */
async function executeSubtaskWithResult(
  subtask: Subtask,
  sessionManager: SessionManager
): Promise<Result<void>> {
  const result = await safeAsync(async () => {
    await sessionManager.updateItemStatus(subtask.id, 'Implementing');
    // Execute work...
    await sessionManager.updateItemStatus(subtask.id, 'Complete');
  });

  if (!result.success) {
    await sessionManager.updateItemStatus(subtask.id, 'Failed');
  }

  return result;
}
```

### 5.3 Discriminated Union Error Handling

```typescript
/**
 * Discriminated union for execution results
 */
type ExecutionResult =
  | { status: 'success'; itemId: string }
  | { status: 'failed'; itemId: string; error: Error }
  | { status: 'blocked'; itemId: string; blockers: string[] };

/**
 * Function with typed execution result
 */
async function executeSubtaskTyped(
  subtask: Subtask,
  orchestrator: TaskOrchestrator
): Promise<ExecutionResult> {
  // Check dependencies
  if (!orchestrator.canExecute(subtask)) {
    const blockers = orchestrator.getBlockingDependencies(subtask);
    return {
      status: 'blocked',
      itemId: subtask.id,
      blockers: blockers.map(b => b.id),
    };
  }

  // Try execution
  try {
    await orchestrator.executeSubtask(subtask);
    return {
      status: 'success',
      itemId: subtask.id,
    };
  } catch (error) {
    return {
      status: 'failed',
      itemId: subtask.id,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Type-safe result handling
 */
async function processExecutionResult(result: ExecutionResult): Promise<void> {
  switch (result.status) {
    case 'success':
      console.log(`✓ ${result.itemId} completed`);
      break;

    case 'failed':
      console.error(`✗ ${result.itemId} failed: ${result.error.message}`);
      break;

    case 'blocked':
      console.log(`⊘ ${result.itemId} blocked on: ${result.blockers.join(', ')}`);
      break;
  }
}
```

---

## 6. Workflow State Management on Errors

### 6.1 State Machine for Error Recovery

```typescript
/**
 * State transitions for error handling
 */
type ErrorStateTransition =
  | { from: 'Planned'; to: 'Implementing'; action: 'start' }
  | { from: 'Implementing'; to: 'Complete'; action: 'succeed' }
  | { from: 'Implementing'; to: 'Failed'; action: 'fail' }
  | { from: 'Failed'; to: 'Implementing'; action: 'retry' }
  | { from: 'Failed'; to: 'Obsolete'; action: 'deprecate' };

/**
 * Validates state transitions
 */
function isValidTransition(from: Status, to: Status): boolean {
  const validTransitions: Record<Status, Status[]> = {
    'Planned': ['Implementing', 'Obsolete'],
    'Researching': ['Implementing', 'Failed'],
    'Implementing': ['Complete', 'Failed'],
    'Complete': ['Obsolete'],
    'Failed': ['Implementing', 'Obsolete'],
    'Obsolete': [],
  };

  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Updates status with transition validation
 */
async function updateStatusWithValidation(
  itemId: string,
  newStatus: Status,
  sessionManager: SessionManager
): Promise<void> {
  const currentSession = sessionManager.currentSession;
  if (!currentSession) {
    throw new Error('No active session');
  }

  const currentItem = findItem(currentSession.taskRegistry, itemId);
  if (!currentItem) {
    throw new Error(`Item ${itemId} not found`);
  }

  if (!isValidTransition(currentItem.status, newStatus)) {
    throw new Error(
      `Invalid transition: ${currentItem.status} -> ${newStatus} for ${itemId}`
    );
  }

  await sessionManager.updateItemStatus(itemId, newStatus);
}
```

### 6.2 Retry Logic with Exponential Backoff

```typescript
/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Executes operation with retry logic
 */
async function executeWithRetry<T>(
  itemId: string,
  operation: () => Promise<T>,
  sessionManager: SessionManager,
  config: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-retryable errors
      if (!isRetryable(error)) {
        await sessionManager.updateItemStatus(itemId, 'Failed');
        throw lastError;
      }

      // Log retry attempt
      console.warn(
        `[Retry] Attempt ${attempt}/${config.maxAttempts} failed for ${itemId}`,
        { error: lastError.message }
      );

      // Wait before retry (exponential backoff)
      if (attempt < config.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  // All retries exhausted
  await sessionManager.updateItemStatus(itemId, 'Failed');
  throw lastError;
}

/**
 * Determines if error is retryable
 */
function isRetryable(error: unknown): boolean {
  if (error instanceof WorkflowError) {
    return error.isRetryable();
  }

  if (error instanceof Error) {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /5\d\d/, // HTTP 5xx errors
    ];

    return retryablePatterns.some(pattern =>
      pattern.test(error.message)
    );
  }

  return false;
}
```

### 6.3 Circuit Breaker Pattern for Cascading Failures

```typescript
/**
 * Circuit breaker state
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker for preventing cascading failures
 */
class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private successCount = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly halfOpenAttempts: number = 3
  ) {}

  /**
   * Executes operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - rejecting requests');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;

    const elapsed = Date.now() - this.lastFailureTime.getTime();
    return elapsed >= this.timeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;

      if (this.successCount >= this.halfOpenAttempts) {
        this.state = 'closed';
        console.log('[CircuitBreaker] Circuit closed after successful recovery');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.error('[CircuitBreaker] Circuit opened due to repeated failures');
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

---

## 7. References and Resources

### 7.1 Documentation URLs

**TypeScript Official Documentation:**
- [TypeScript Handbook - Error Handling](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript Deep Dive - Type Guards](https://basarat.gitbook.io/typescript/type-system/typeguard#type-guards)

**Node.js Error Handling:**
- [Node.js Error Handling Best Practices](https://nodejs.org/api/errors.html)
- [Node.js Event Loop - Unhandled Rejections](https://nodejs.org/api/process.html#event-unhandledrejection)
- [Node.js Process Events](https://nodejs.org/api/process.html#process_events)

**Async/Await Patterns:**
- [MDN: Async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Promise.allSettled() Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

**Observability & Monitoring:**
- [OpenTelemetry TypeScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)
- [Winston Logger Documentation](https://github.com/winstonjs/winston)
- [Pino Logger Documentation](https://getpino.io/)

### 7.2 Best Practice Articles

- [Error Handling in Node.js (2025)](https://nodejs.dev/en/learn/errors/)
- [Async/Await Error Handling Patterns](https://javascript.info/async-errors)
- [TypeScript Error Handling Patterns](https://micheleraina.github.io/posts/typescript-error-handling-patterns/)
- [Functional Error Handling in TypeScript](https://dev.to/gurgunday/functional-error-handling-in-typescript-1jn4)

### 7.3 Relevant Code Locations

**Current Implementation:**
- Task Orchestrator: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- Session Manager: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
- Type Models: `/home/dustin/projects/hacky-hack/src/core/models.ts`
- Task Utilities: `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`

**Key Observations:**
1. Status type includes `'Failed'` - ✓ Available
2. Task Orchestrator has no try/catch blocks - ✗ Needs implementation
3. Session Manager has atomic status updates - ✓ Good foundation
4. No global error handlers - ✗ Needs implementation
5. No structured logging - ✗ Needs implementation

### 7.4 Recommended Next Steps

1. **Implement try/catch in executeSubtask()**
   - Wrap existing logic in try/catch
   - Set Failed status in catch block
   - Add structured error logging

2. **Add global error handlers**
   - Setup unhandledRejection handler
   - Setup uncaughtException handler
   - Integrate with error tracking service

3. **Create WorkflowLogger interface**
   - Define structured logging format
   - Add context enrichment
   - Implement error aggregation

4. **Add retry logic for transient failures**
   - Implement exponential backoff
   - Add retryable error detection
   - Track retry attempts in logs

5. **Create comprehensive error tests**
   - Test Failed status on all error paths
   - Test concurrent error scenarios
   - Test retry and recovery logic

---

## Conclusion

This research document provides a comprehensive foundation for implementing robust async/await error handling in the PRP Pipeline. The key insights are:

1. **Failed status MUST be set in catch blocks** - never let exceptions propagate without updating state
2. **Structured logging is critical** - errors must include context (itemId, sessionId, timestamp)
3. **Global error handlers prevent silent failures** - unhandled rejections should set Failed status
4. **TypeScript type guards improve safety** - use type predicates for error discrimination
5. **Retry logic handles transient failures** - not all errors should result in permanent Failed status

The patterns presented here balance safety, observability, and recoverability while maintaining the immutable state management principles already established in the codebase.

---

**Document Status:** Complete
**Next Action:** Implement recommended patterns in TaskOrchestrator
**Priority:** High - blocks reliable workflow execution
