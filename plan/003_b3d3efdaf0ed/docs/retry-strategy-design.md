# Task Retry Strategy Design Document

**Document ID**: P3.M2.T1.S1-ARCH-001
**Status**: Design Draft
**Date**: 2026-01-24
**Author**: AI Research Agent
**Version**: 1.0

---

## 1. Executive Summary

### 1.1 Problem Statement

The PRP Pipeline currently lacks a **task-level automatic retry mechanism**. When a subtask fails during execution:

- **Current behavior**: Task is marked as "Failed" and pipeline continues to the next task
- **Issue**: Transient failures (network issues, API rate limits, temporary resource constraints) cause unnecessary task failures
- **Impact**: Manual intervention is required to retry failed tasks, reducing pipeline efficiency

**Key insight from system analysis**: The fix cycle has iteration-based retry (max 3 iterations), but individual task execution does not automatically retry on transient failures.

### 1.2 Proposed Solution

Implement a **task retry strategy** that:

1. **Detects retryable errors** vs permanent failures
2. **Implements exponential backoff** with jitter to prevent thundering herd
3. **Preserves state** between retries for resumability
4. **Notifies users** of retry attempts with progressive disclosure
5. **Integrates with existing failure tracking** in the PRP Pipeline
6. **Respects configurable limits** for max retry attempts

### 1.3 Success Criteria

- [ ] Retryable errors are automatically retried before task failure
- [ ] Non-retryable errors fail immediately without retry
- [ ] Exponential backoff with jitter prevents retry storms
- [ ] State is preserved across retries (task status, partial progress)
- [ ] Users are notified of retry attempts via structured logging
- [ ] Retry attempts are tracked in existing failure tracking system
- [ ] Configuration is customizable (max attempts, delays, error classification)

---

## 2. Current State Analysis

### 2.1 Existing Retry Mechanisms

#### Fix Cycle Retry (Iteration-Based)

**File**: `src/workflows/fix-cycle-workflow.ts` (Lines 305-335)

```typescript
while (this.iteration < this.maxIterations) {
  this.iteration++;
  await this.createFixTasks();
  await this.executeFixes();
  await this.retest();
  const complete = await this.checkComplete();
  if (complete) break;
}
```

- **Type**: High-level iteration-based retry
- **Max iterations**: 3 (hardcoded)
- **Scope**: Complete fix→retest cycles
- **State preservation**: Via SessionManager

**Key distinction**: This is NOT a retry of individual failed tasks. It's a re-execution of the entire QA cycle to verify bug fixes.

#### PRPExecutor Fix-and-Retry

**File**: `src/agents/prp-executor.ts` (Lines 438-457)

- **Type**: Validation failure retry
- **Max attempts**: 2 fix attempts
- **Trigger**: Validation gate failures
- **Scope**: Re-executes validation with agent-based fixes

**Key distinction**: Only retries validation failures, not general task execution errors.

#### Retry Utility (Transient Errors)

**File**: `src/utils/retry.ts`

- **Type**: Exponential backoff with jitter
- **Function**: `retry<T>()` for generic retry logic
- **Features**:
  - `isTransientError()` for error classification
  - `isPermanentError()` for permanent error detection
  - `calculateDelay()` for exponential backoff with jitter
  - `createDefaultOnRetry()` for structured logging

**Strengths**:
- ✅ Comprehensive error classification (Lines 323-410)
- ✅ Exponential backoff with positive jitter (Lines 246-268)
- ✅ Configurable max attempts, delays, backoff factor
- ✅ Integration with error hierarchy (PipelineError)
- ✅ Structured logging via createDefaultOnRetry

**Limitations**:
- ⚠️ Not used at task execution level
- ⚠️ No circuit breaker integration
- ⚠️ No checkpoint/state persistence for long-running operations

### 2.2 Current Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ERROR FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRPPipeline.executeBacklog()                                  │
│       │                                                         │
│       ▼                                                         │
│  TaskOrchestrator.executeSubtask()                              │
│       │                                                         │
│       ▼                                                         │
│  PRPRuntime.executeSubtask()                                    │
│       │                                                         │
│       ├─► Phase 1: Research (PRPGenerator.generate)             │
│       │       └─► NO RETRY on failure                          │
│       │                                                         │
│       └─► Phase 2: Implementation (PRPExecutor.execute)         │
│               ├─► Validation gates execute                     │
│               ├─► Fix-and-retry: max 2 attempts                │
│               └─► NO GENERAL RETRY on other errors             │
│                                                                 │
│  On ANY error:                                                  │
│       ├─► Set status to "Failed"                                │
│       ├─► Log error with context                               │
│       ├─► Track failure in PRPPipeline.#failedTasks            │
│       └─► Continue to next task (no retry)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 TaskOrchestrator Error Handling

**File**: `src/core/task-orchestrator.ts` (Lines 672-776)

```typescript
try {
  const result = await this.#prpRuntime.executeSubtask(subtask, this.#backlog);

  if (result.success) {
    await this.setStatus(subtask.id, 'Complete', 'Implementation completed successfully');
  } else {
    await this.setStatus(subtask.id, 'Failed', result.error ?? 'Execution failed');
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  await this.setStatus(subtask.id, 'Failed', `Execution failed: ${errorMessage}`);

  this.#logger.error({
    subtaskId: subtask.id,
    error: errorMessage,
    ...(error instanceof Error && { stack: error.stack }),
  }, 'Subtask execution failed');

  // Re-throw for upstream handling
  throw error;
}
```

**Key observations**:
1. Try-catch wraps entire subtask execution
2. Failed status is set immediately on error
3. Error is logged with context
4. Error is re-thrown (propagated to PRPPipeline)
5. **NO RETRY ATTEMPTED**

### 2.4 PRPPipeline Failure Handling

**File**: `src/workflows/prp-pipeline.ts` (Lines 888-911)

```typescript
try {
  await this.taskOrchestrator.executeSubtask(subtask);
  completedTasks++;
} catch (taskError) {
  // Track the failure
  this.#trackFailure(taskId, taskError, { phase: this.currentPhase });

  // Log but continue
  this.logger.warn('Task failed, continuing to next task');

  // Continue to next iteration - don't re-throw
}
```

**Key observations**:
1. Failures are tracked in `#failedTasks` Map
2. Pipeline continues to next task (graceful degradation)
3. No automatic retry of failed tasks
4. Error report generated at end with failed task details

---

## 3. Retry Strategy Design

### 3.1 Error Classification Matrix

#### Retryable Errors (Transient)

| Error Category | Detection Criteria | Examples | Max Retries |
|----------------|-------------------|----------|-------------|
| **Network Issues** | `isTransientError()` returns true | `ECONNRESET`, `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND` | 3 |
| **HTTP 5xx Server Errors** | Status code 500-504 | 500, 502, 503, 504 | 3 |
| **HTTP 429 Rate Limit** | Status code 429 | Rate limit exceeded | 5 (more for rate limits) |
| **HTTP 408 Timeout** | Status code 408 | Request timeout | 3 |
| **LLM API Failures** | PipelineError with `PIPELINE_AGENT_LLM_FAILED` | Model unavailable, API error | 5 |
| **Agent Timeout** | PipelineError with `PIPELINE_AGENT_TIMEOUT` | Agent execution timeout | 3 |
| **Temporary Resource Issues** | Error message patterns match | "temporarily unavailable", "service unavailable" | 3 |

**Detection Function** (Already exists in `src/utils/retry.ts`):
```typescript
export function isTransientError(error: unknown): boolean
```

#### Non-Retryable Errors (Permanent)

| Error Category | Detection Criteria | Examples | Retry Action |
|----------------|-------------------|----------|--------------|
| **Validation Errors** | `isValidationError()` returns true | Invalid PRD schema, malformed input | **FAIL immediately** (0 retries) |
| **HTTP 4xx Client Errors** | Status code 400-407, 409-428, 430-499 | 400 Bad Request, 401 Unauthorized, 404 Not Found | **FAIL immediately** |
| **Parsing Errors** | Error message contains "parse error" | Malformed response, schema violation | **FAIL immediately** |
| **Authentication Failures** | Error contains "unauthorized", "forbidden" | Invalid API key, permissions error | **FAIL immediately** |
| **Resource Conflicts** | Status code 409 | Duplicate resource, version conflict | **FAIL immediately** |

**Detection Function** (Already exists in `src/utils/retry.ts`):
```typescript
export function isPermanentError(error: unknown): boolean
```

### 3.2 Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASK RETRY DECISION TREE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Task Execution Error                                           │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────┐                                   │
│  │ Is ValidationError?     │                                   │
│  └─────────────────────────┘                                   │
│         │         │                                            │
│        YES        NO                                           │
│         │         │                                            │
│         ▼         ▼                                            │
│    [FAIL NOW]  ┌─────────────────────────┐                    │
│                │ Check isPermanentError()│                    │
│                └─────────────────────────┘                    │
│                      │         │                               │
│                     YES        NO                              │
│                      │         │                               │
│                      ▼         ▼                               │
│                 [FAIL NOW]  ┌────────────────────┐            │
│                            │ Check retry count   │            │
│                            └────────────────────┘            │
│                                  │         │                  │
│                            >= max   < max                    │
│                                  │         │                  │
│                                  ▼         ▼                  │
│                            [FAIL NOW]  [CALCULATE DELAY]    │
│                                             │                  │
│                                             ▼                  │
│                                      ┌──────────────────┐    │
│                                      │ Exponential       │    │
│                                      │ backoff + jitter  │    │
│                                      └──────────────────┘    │
│                                             │                  │
│                                             ▼                  │
│                                      [LOG RETRY ATTEMPT]     │
│                                             │                  │
│                                             ▼                  │
│                                      [PRESERVE STATE]         │
│                                             │                  │
│                                             ▼                  │
│                                      [INCREMENT RETRY COUNT] │
│                                             │                  │
│                                             ▼                  │
│                                      [RE-EXECUTE TASK]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Retry Configuration

#### Default Configuration

```typescript
interface TaskRetryConfig {
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

const DEFAULT_TASK_RETRY_CONFIG: TaskRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 30000,    // 30 seconds
  backoffFactor: 2,   // Exponential
  jitterFactor: 0.1,  // 10% variance
  enabled: true,
};
```

#### Adaptive Retry Limits by Error Type

```typescript
function getMaxAttemptsForError(error: Error): number {
  if (error.code === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
    return 5; // More retries for rate limits
  }
  if (error.code === 'PIPELINE_AGENT_LLM_FAILED') {
    return 5; // More retries for LLM failures
  }
  if (error.code === 'PIPELINE_AGENT_TIMEOUT') {
    return 3; // Moderate retries for timeouts
  }
  return 3; // Default
}
```

### 3.4 Exponential Backoff with Jitter

**Formula** (from existing `src/utils/retry.ts`):
```typescript
exponentialDelay = min(baseDelay * (backoffFactor ^ attempt), maxDelay)
jitter = exponentialDelay * jitterFactor * random()
delay = max(1, floor(exponentialDelay + jitter))
```

**Example with baseDelay=1000ms, maxDelay=30000ms, backoffFactor=2, jitterFactor=0.1**:

| Attempt | Exponential Delay | Jitter Range | Total Delay Range |
|---------|-------------------|--------------|-------------------|
| 1 | 1000ms | 0-100ms | **1000-1100ms** |
| 2 | 2000ms | 0-200ms | **2000-2200ms** |
| 3 | 4000ms | 0-400ms | **4000-4400ms** |
| 4 | 8000ms | 0-800ms | **8000-8800ms** |
| 5+ | 30000ms (capped) | 0-3000ms | **30000-33000ms** |

### 3.5 State Preservation Between Retries

#### State to Preserve

| State | Location | Preservation Method |
|-------|----------|---------------------|
| **Task Status** | `Subtask.status` | Persist via SessionManager.updateItemStatus() |
| **Retry Count** | New: `Subtask.retryAttempts` | Persist via SessionManager |
| **Last Error** | New: `Subtask.lastError` | Persist via SessionManager |
| **Partial Progress** | PRP cache, artifacts | Already persisted in session directory |
| **Backlog State** | `TaskRegistry.backlog` | Already persisted via SessionManager |

#### Proposed Schema Extensions

```typescript
interface SubtaskRetryState {
  /** Number of retry attempts made */
  retryAttempts?: number;

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

// Extend existing Subtask interface
interface Subtask {
  // ... existing properties ...
  retryState?: SubtaskRetryState;
}
```

### 3.6 User Notification Strategy

#### Progressive Disclosure Pattern

| Retry State | Log Level | User Message | Action Required |
|-------------|-----------|--------------|-----------------|
| **Retry 1** | Info | `Task {taskId} experiencing transient issue. Retrying... (1/3)` | No |
| **Retry 2** | Warning | `Task {taskId} still failing. Retrying... (2/3)` | No |
| **Retry 3+** | Warning | `Task {taskId} multiple retries attempted. (3/3)` | Monitor |
| **Max Reached** | Error | `Task {taskId} failed after {maxAttempts} attempts: {error}` | Yes - manual review |
| **Permanent Error** | Error | `Task {taskId} failed with non-retryable error: {error}` | Yes - fix required |

#### Log Message Format

```typescript
// Using existing logger from src/utils/logger.ts
logger.info({
  taskId: subtask.id,
  attempt: retryState.retryAttempts,
  maxAttempts: config.maxAttempts,
  delayMs: calculatedDelay,
  errorName: error.constructor.name,
  errorCode: error.code,
}, `Task ${subtask.id} retrying (${retryState.retryAttempts}/${config.maxAttempts})`);
```

### 3.7 Integration with Existing Failure Tracking

#### Failure Tracking System

**File**: `src/workflows/prp-pipeline.ts` (Lines 381-427)

```typescript
interface TaskFailure {
  taskId: string;
  taskTitle: string;
  error: Error;
  errorCode?: string;
  timestamp: Date;
  phase?: string;
  milestone?: string;
}
```

**Proposed Extension**:

```typescript
interface TaskFailureWithRetry extends TaskFailure {
  /** Number of retry attempts made */
  retryAttempts?: number;

  /** Total time spent retrying */
  totalRetryTime?: number;

  /** Whether error was retryable */
  wasRetryable?: boolean;

  /** Retry delay history */
  retryDelays?: number[];
}
```

#### Retry Metrics

Track these metrics for observability:

```typescript
interface RetryMetrics {
  /** Total tasks executed */
  totalTasks: number;

  /** Tasks that succeeded without retry */
  successNoRetry: number;

  /** Tasks that succeeded after retry */
  successWithRetry: number;

  /** Tasks that failed after all retries */
  failedAfterRetry: number;

  /** Tasks that failed immediately (non-retryable) */
  failedImmediate: number;

  /** Total retry attempts made */
  totalRetryAttempts: number;

  /** Average retries per task */
  avgRetriesPerTask: number;

  /** Retry success rate */
  retrySuccessRate: number;
}
```

---

## 4. Implementation Strategy

### 4.1 Integration Points

#### TaskOrchestrator Modification

**File**: `src/core/task-orchestrator.ts` (Lines 672-776)

**Current**:
```typescript
async executeSubtask(subtask: Subtask): Promise<void> {
  // ... setup ...

  try {
    const result = await this.#prpRuntime.executeSubtask(subtask, this.#backlog);
    // ... handle result ...
  } catch (error) {
    await this.setStatus(subtask.id, 'Failed', `Execution failed: ${errorMessage}`);
    throw error;
  }
}
```

**Proposed**:
```typescript
async executeSubtask(subtask: Subtask): Promise<void> {
  // ... setup ...

  try {
    // Wrap execution in retry logic
    const result = await this.#executeWithRetry(subtask);
    // ... handle result ...
  } catch (error) {
    // Already handled by retry logic, just propagate
    throw error;
  }
}

async #executeWithRetry(subtask: Subtask): Promise<PRPExecutionResult> {
  const config = this.#retryConfig; // From constructor
  let lastError: Error;
  let retryState = subtask.retryState || { retryAttempts: 0 };

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const result = await this.#prpRuntime.executeSubtask(subtask, this.#backlog);

      // Success - clear retry state
      if (retryState.retryAttempts! > 0) {
        await this.#clearRetryState(subtask.id);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        // Non-retryable - fail immediately
        await this.setStatus(subtask.id, 'Failed', `Non-retryable error: ${lastError.message}`);
        throw error;
      }

      // Check if max attempts reached
      if (attempt >= config.maxAttempts - 1) {
        // Max retries exhausted
        await this.setStatus(subtask.id, 'Failed', `Failed after ${config.maxAttempts} attempts: ${lastError.message}`);
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay, config.backoffFactor, config.jitterFactor);

      // Update retry state
      retryState.retryAttempts = attempt + 1;
      retryState.lastError = {
        message: lastError.message,
        code: (lastError as PipelineError).code,
        timestamp: new Date(),
      };
      await this.#updateRetryState(subtask.id, retryState);

      // Log retry attempt
      this.#logger.info({
        subtaskId: subtask.id,
        attempt: retryState.retryAttempts,
        maxAttempts: config.maxAttempts,
        delayMs: delay,
        errorName: lastError.constructor.name,
      }, `Retrying task ${subtask.id} (${retryState.retryAttempts}/${config.maxAttempts})`);

      // Wait before retry
      await sleep(delay);
    }
  }

  // Should not reach here
  throw lastError!;
}
```

#### SessionManager Extensions

**New methods**:
```typescript
// src/core/session-manager.ts

async updateRetryState(
  sessionId: string,
  subtaskId: string,
  retryState: SubtaskRetryState
): Promise<void>;

async getRetryState(
  sessionId: string,
  subtaskId: string
): Promise<SubtaskRetryState | null>;

async clearRetryState(
  sessionId: string,
  subtaskId: string
): Promise<void>;
```

### 4.2 Configuration Sources

#### Priority Order

1. **CLI option**: `--task-retry-max-attempts <n>` (highest priority)
2. **Environment variable**: `TASK_RETRY_MAX_ATTEMPTS=3`
3. **Config file**: `.env` or `config.json`
4. **Default value**: `3` (lowest priority)

#### Proposed CLI Options

```typescript
// src/cli/index.ts

program
  .option('--task-retry-max-attempts <n>', 'Maximum task retry attempts (1-10, default: 3)', '3')
  .option('--task-retry-base-delay <ms>', 'Base retry delay in milliseconds (default: 1000)', '1000')
  .option('--task-retry-max-delay <ms>', 'Maximum retry delay in milliseconds (default: 30000)', '30000')
  .option('--task-retry-enabled <bool>', 'Enable/disable task retry (default: true)', 'true')
```

### 4.3 Backward Compatibility

- **Default behavior**: Retry ENABLED (improves reliability)
- **Opt-out**: Users can disable with `--task-retry-enabled=false`
- **Existing tests**: Should pass without modification (backward compatible)

---

## 5. Pseudocode

### 5.1 Main Retry Logic

```
FUNCTION executeSubtaskWithRetry(subtask, config):
    retryState = loadRetryState(subtask.id) OR { attempts: 0 }

    FOR attempt FROM 0 TO config.maxAttempts - 1:
        TRY:
            result = executeSubtask(subtask)

            IF retryState.attempts > 0:
                clearRetryState(subtask.id)
                logSuccessAfterRetry(subtask.id, retryState.attempts)

            RETURN result

        CATCH error:
            // Check if non-retryable
            IF isPermanentError(error):
                markTaskFailed(subtask.id, error)
                THROW error

            // Check if max attempts reached
            IF attempt == config.maxAttempts - 1:
                updateRetryState(subtask.id, retryState)
                markTaskFailed(subtask.id, error)
                THROW error

            // Calculate delay
            delay = calculateDelay(
                attempt,
                config.baseDelay,
                config.maxDelay,
                config.backoffFactor,
                config.jitterFactor
            )

            // Update retry state
            retryState.attempts = attempt + 1
            retryState.lastError = {
                message: error.message,
                code: error.code,
                timestamp: NOW()
            }
            updateRetryState(subtask.id, retryState)

            // Log retry
            logRetryAttempt(
                subtask.id,
                retryState.attempts,
                config.maxAttempts,
                delay,
                error
            )

            // Wait before retry
            sleep(delay)

    // Should not reach here
    THROW LastError
```

### 5.2 Error Classification

```
FUNCTION isRetryableError(error):
    // Check ValidationError first (never retryable)
    IF isValidationError(error):
        RETURN False

    // Check PipelineError codes
    IF isPipelineError(error):
        RETURN error.code IN [
            'PIPELINE_AGENT_TIMEOUT',
            'PIPELINE_AGENT_LLM_FAILED'
        ]

    // Check Node.js system error codes
    IF error.code IN TRANSIENT_ERROR_CODES:
        RETURN True

    // Check HTTP status
    IF error.response.status IN [408, 429, 500, 502, 503, 504]:
        RETURN True

    // Check message patterns
    message = error.message.toLowerCase()
    FOR pattern IN TRANSIENT_PATTERNS:
        IF message.contains(pattern):
            RETURN True

    // Default to not retryable (fail safe)
    RETURN False
```

### 5.3 State Persistence

```
FUNCTION updateRetryState(subtaskId, retryState):
    session = sessionManager.currentSession

    // Find subtask in backlog
    subtask = findSubtask(session.taskRegistry, subtaskId)

    // Update retry state
    subtask.retryState = retryState

    // Persist
    sessionManager.updateItem(session.id, subtaskId, {
        retryState: retryState
    })

    // Batch flush for performance
    sessionManager.flushUpdates()
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

#### Test Cases

1. **Retry on transient error**
   - Input: Task fails with `ECONNRESET` error
   - Expected: Retry triggered, task succeeds on retry
   - Assert: Retry count = 1, final status = "Complete"

2. **No retry on permanent error**
   - Input: Task fails with `ValidationError`
   - Expected: No retry, immediate failure
   - Assert: Retry count = 0, final status = "Failed"

3. **Respect max attempts**
   - Input: Task fails with transient error, maxAttempts = 2
   - Expected: 1 initial + 1 retry = 2 attempts total
   - Assert: Task fails after 2 attempts

4. **Exponential backoff calculation**
   - Input: baseDelay=1000, backoffFactor=2, jitterFactor=0.1
   - Expected: Delay increases exponentially with jitter
   - Assert: Attempt 1 delay ≈ 1000-1100ms, Attempt 2 ≈ 2000-2200ms

5. **State preservation**
   - Input: Task fails, retry state is saved
   - Expected: Retry state persists across retries
   - Assert: `retryAttempts`, `lastError` saved to SessionManager

### 6.2 Integration Tests

1. **End-to-end retry flow**
   - Execute task that fails transiently
   - Verify retry attempts are logged
   - Verify task eventually succeeds

2. **Failure after max retries**
   - Execute task that consistently fails
   - Verify max attempts respected
   - Verify failure tracking updated

3. **Parallel execution with retries**
   - Execute multiple tasks concurrently
   - Verify retries don't block other tasks
   - Verify concurrent retry state isolation

### 6.3 Chaos Testing

1. **Random transient failures**
   - Inject random transient failures
   - Verify retry mechanism handles them
   - Measure success rate improvement

2. **Permanent failure rejection**
   - Inject permanent errors
   - Verify no wasted retries
   - Verify fast fail behavior

---

## 7. Configuration Examples

### 7.1 Default (Recommended)

```bash
# Use defaults - balanced for most workloads
npm run dev -- --prd ./PRD.md
```

**Configuration**:
- maxAttempts: 3
- baseDelay: 1000ms
- maxDelay: 30000ms
- enabled: true

### 7.2 Aggressive Retry (For Unstable Networks)

```bash
# More retries, longer delays
npm run dev -- --prd ./PRD.md \
  --task-retry-max-attempts 5 \
  --task-retry-base-delay 2000 \
  --task-retry-max-delay 60000
```

**Configuration**:
- maxAttempts: 5
- baseDelay: 2000ms
- maxDelay: 60000ms
- enabled: true

### 7.3 Conservative Retry (For Fast Fail)

```bash
# Fewer retries, shorter delays
npm run dev -- --prd ./PRD.md \
  --task-retry-max-attempts 2 \
  --task-retry-base-delay 500 \
  --task-retry-max-delay 5000
```

**Configuration**:
- maxAttempts: 2
- baseDelay: 500ms
- maxDelay: 5000ms
- enabled: true

### 7.4 Disable Retry (For Debugging)

```bash
# No retry - fail immediately on any error
npm run dev -- --prd ./PRD.md --task-retry-enabled false
```

**Configuration**:
- enabled: false

---

## 8. Monitoring and Observability

### 8.1 Metrics to Track

| Metric | Type | Description |
|--------|------|-------------|
| `task_retry_attempts_total` | Counter | Total retry attempts across all tasks |
| `task_retry_success_total` | Counter | Tasks that succeeded after retry |
| `task_retry_failure_total` | Counter | Tasks that failed after all retries |
| `task_retry_immediate_failure_total` | Counter | Tasks that failed immediately (non-retryable) |
| `task_retry_delay_seconds` | Histogram | Delay distribution for retry attempts |
| `task_retry_duration_seconds` | Histogram | Total time spent in retry loop |

### 8.2 Dashboard Queries

**Retry Success Rate**:
```
sum(rate(task_retry_success_total[5m])) /
sum(rate(task_retry_attempts_total[5m])) * 100
```

**Immediate Failure Rate**:
```
sum(rate(task_retry_immediate_failure_total[5m])) /
sum(rate(task_completion_total[5m])) * 100
```

---

## 9. References

### 9.1 Internal Documents

- **Fix Cycle Analysis**: `plan/003_b3d3efdaf0ed/P3M2T1S1/research/fix_cycle_retry_analysis.md`
- **Task Orchestrator Analysis**: `plan/003_b3d3efdaf0ed/P3M2T1S1/research/task_orchestrator_error_analysis.md`
- **PRPPipeline Execution Analysis**: `plan/003_b3d3efdaf0ed/P3M2T1S1/research/prp_pipeline_task_execution_analysis.md`
- **Retry Strategy Research**: `plan/003_b3d3efdaf0ed/P3M2T1S1/research/retry_strategy_research.md`

### 9.2 Source Files

- **Retry Utility**: `src/utils/retry.ts` (Lines 1-705)
- **Task Orchestrator**: `src/core/task-orchestrator.ts` (Lines 1-900)
- **PRP Runtime**: `src/agents/prp-runtime.ts` (Lines 1-400)
- **PRP Pipeline**: `src/workflows/prp-pipeline.ts` (Lines 1-1800)
- **Session Manager**: `src/core/session-manager.ts`

### 9.3 External References

- **AWS Exponential Backoff and Jitter**: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- **Google Cloud Retry Guidelines**: https://cloud.google.com/iam/docs/request-trial
- **Azure Retry Pattern**: https://learn.microsoft.com/en-us/azure/architecture/patterns/retry
- **Tenacity (Python)**: https://github.com/jd/tenacity
- **Polly (.NET)**: https://github.com/App-vNext/Polly

---

## 10. Open Questions

1. **Checkpoint granularity**: Should we implement fine-grained checkpoints within PRP execution, or is task-level retry sufficient?

2. **Circuit breaker**: Should we add a circuit breaker to stop retrying after N consecutive failures?

3. **Retry budget**: Should we implement a global retry budget to limit total retry attempts across all tasks?

4. **Backward compatibility**: Should retry be enabled by default, or opt-in for existing users?

5. **State schema**: Should `retryState` be a first-class property in the Subtask schema, or stored separately?

---

**Document End**

---

## Appendix A: Configuration Matrix

| Scenario | Max Attempts | Base Delay | Max Delay | Use Case |
|----------|--------------|------------|-----------|----------|
| **Default** | 3 | 1000ms | 30000ms | Most workloads |
| **Unstable Network** | 5 | 2000ms | 60000ms | High latency environments |
| **Fast Fail** | 2 | 500ms | 5000ms | Development/debugging |
| **Production** | 3 | 1000ms | 30000ms | Balanced reliability |
| **Rate Limited API** | 5 | 5000ms | 120000ms | Strict rate limits |

## Appendix B: Error Codes Reference

| Error Code | Retryable | Max Retries | Rationale |
|------------|-----------|-------------|-----------|
| `PIPELINE_AGENT_TIMEOUT` | Yes | 3 | Temporary network/LLM delay |
| `PIPELINE_AGENT_LLM_FAILED` | Yes | 5 | LLM API issues |
| `VALIDATION_ERROR` | No | 0 | Same input = same error |
| `ECONNRESET` | Yes | 3 | Temporary connection issue |
| `ECONNREFUSED` | Yes | 3 | Service temporarily unavailable |
| `ETIMEDOUT` | Yes | 3 | Network timeout |
| `ENOTFOUND` | Yes | 2 | DNS issue (may persist) |
| HTTP 429 | Yes | 5 | Rate limit (needs time) |
| HTTP 408 | Yes | 3 | Request timeout |
| HTTP 500+ | Yes | 3 | Server error |
| HTTP 4xx | No | 0 | Client error |
