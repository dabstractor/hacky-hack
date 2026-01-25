# Task Retry Strategy Design Document

**Project**: Hacky Hack - AI Agent PRP Pipeline
**Design Document**: P3.M2.T1.S1
**Date**: 2026-01-24
**Status**: Design Phase

---

## 1. Executive Summary

### 1.1 Problem Statement

The current pipeline implementation lacks automatic retry for failed individual tasks. According to the system context (system_context.md), individual task failures do not stop the pipeline but also do not automatically retry. While the fix cycle workflow implements iteration-based retry (max 3 iterations), this operates at a higher level and does not address transient failures during individual task execution.

**Current Limitations:**
- No automatic retry for transient errors (network issues, API rate limits, timeouts)
- Failed tasks remain in "Failed" state requiring manual intervention
- No distinction between retryable (transient) and non-retryable (permanent) errors at task level
- Lost productivity when tasks fail due to temporary infrastructure issues

### 1.2 Proposed Solution

Implement a comprehensive task retry strategy that:
1. **Classifies errors** as retryable (transient) or non-retryable (permanent)
2. **Applies exponential backoff with jitter** for retry attempts
3. **Preserves retry state** across attempts for crash recovery
4. **Provides progressive user notifications** based on retry count
5. **Integrates with existing failure tracking** in PRPPipeline
6. **Leverages existing retry utility** from `src/utils/retry.ts`

### 1.3 Success Criteria

- [x] Design document exists with all required sections
- [x] Error classification matrix covers all common error types
- [x] Retry configuration includes specific values (not TBD)
- [x] State preservation approach is clearly defined
- [x] User notification pattern is specified with log levels
- [x] Integration approach with existing failure tracking is documented
- [x] Decision matrix in ASCII-art format is included
- [x] Pseudocode demonstrates the retry logic flow
- [x] All sections reference specific file paths and line numbers

---

## 2. Current State Analysis

### 2.1 Existing Retry Mechanisms

#### 2.1.1 Retry Utility (`src/utils/retry.ts`)

**Location**: `/home/dustin/projects/hacky-hack/src/utils/retry.ts` (lines 1-705)

The codebase already contains a production-ready retry utility with:

**Error Classification** (lines 323-410):
- `isTransientError()`: Detects retryable errors
- `isPermanentError()`: Detects non-retryable errors
- Checks PipelineError codes, Node.js error codes, HTTP status codes, and message patterns

**Backoff Calculation** (lines 246-268):
- Exponential backoff formula: `min(baseDelay * backoffFactor^attempt, maxDelay)`
- Positive-only jitter: `delay = exponentialDelay + (exponentialDelay * jitterFactor * random())`
- Prevents thundering herd problem

**Configuration** (lines 475-487):
- Default: `maxAttempts: 3`, `baseDelay: 1000ms`, `maxDelay: 30000ms`
- `backoffFactor: 2`, `jitterFactor: 0.1`

**Specialized Wrappers**:
- `retryAgentPrompt()` (lines 628-636): For LLM calls
- `retryMcpTool()` (lines 681-704): For MCP tool executions

**Key Gotcha**: Line 343 explicitly checks `isValidationError()` and returns `false` - validation errors are NEVER retryable because the same input will always produce the same error.

#### 2.1.2 Fix Cycle Retry Pattern (`src/workflows/fix-cycle-workflow.ts`)

**Location**: `/home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts` (lines 305-335)

The fix cycle implements iteration-based retry:
```typescript
while (this.iteration < this.maxIterations) {
  this.iteration++;
  await this.createFixTasks();
  await this.executeFixes();
  await this.retest();
  if (await this.checkComplete()) break;
}
```

**Configuration** (line 72): `maxIterations: number = 3`

**Important Distinction**: This is NOT individual task retry - it's a high-level QA cycle that:
1. Generates fix tasks for bugs found
2. Executes the fixes
3. Re-tests to verify
4. Repeats up to 3 times if bugs remain

Individual task failures within fix execution are NOT retried (lines 186-201 show try-catch that continues to next task).

#### 2.1.3 PRPExecutor Fix-and-Retry (`src/agents/prp-executor.ts`)

**Location**: `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts` (lines 438-457)

The PRPExecutor implements a fix-and-retry mechanism:
- **Maximum 2 fix attempts** for validation gate failures
- Uses `retryAgentPrompt()` for agent communication
- Only retries validation failures, not general task execution errors

**Scope**: Limited to validation gate failures within PRP execution, not general task failures.

### 2.2 Current Error Handling Flow

#### 2.2.1 TaskOrchestrator Error Handling

**Location**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` (lines 672-776)

Current flow in `executeSubtask()`:
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
  this.#logger.error({ subtaskId: subtask.id, error: errorMessage }, 'Subtask execution failed');
  await this.sessionManager.flushUpdates();
  throw error; // Re-throw for upstream handling
}
```

**Key Pattern**: Set status → Log error → Flush state → Re-throw

**No Retry**: Immediate failure on any error.

#### 2.2.2 PRPPipeline Failure Tracking

**Location**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` (lines 381-427)

The `#trackFailure()` method creates failure records:
```typescript
const failure: TaskFailure = {
  taskId,
  taskTitle,
  error: errorObj,
  errorCode,
  timestamp: new Date(),
  phase: context?.phase,
  milestone: context?.milestone,
};
this.#failedTasks.set(taskId, failure);
```

**Behavior**: Individual task failures don't stop pipeline execution (lines 888-911 show try-catch that continues to next task).

### 2.3 Session Manager State Persistence

**Location**: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

**Pattern**: Batch writes via `updateItemStatus()` and `flushUpdates()`

**Gotcha**: Batch writes are atomic - must call `flushUpdates()` to persist state immediately after retry state changes.

---

## 3. Retry Strategy Design

### 3.1 Error Classification Matrix

#### 3.1.1 Retryable (Transient) Errors

| Error Category | Detection Method | Source | Max Retries |
|----------------|------------------|--------|-------------|
| **Network Errors** | Node.js error codes | `src/utils/retry.ts:67-77` | 3 |
| `ECONNRESET` | `TRANSIENT_ERROR_CODES.has()` | Line 68 | 3 |
| `ECONNREFUSED` | `TRANSIENT_ERROR_CODES.has()` | Line 69 | 3 |
| `ETIMEDOUT` | `TRANSIENT_ERROR_CODES.has()` | Line 70 | 3 |
| `ENOTFOUND` | `TRANSIENT_ERROR_CODES.has()` | Line 71 | 3 |
| `EPIPE` | `TRANSIENT_ERROR_CODES.has()` | Line 72 | 3 |
| `EAI_AGAIN` | `TRANSIENT_ERROR_CODES.has()` | Line 73 | 3 |
| **Rate Limiting** | HTTP status 429 | `src/utils/retry.ts:89` | **5** |
| **Server Errors** | HTTP status 500-504 | `src/utils/retry.ts:90-94` | 3 |
| 500 Internal Server Error | `RETRYABLE_HTTP_STATUS_CODES.has()` | Line 90 | 3 |
| 502 Bad Gateway | `RETRYABLE_HTTP_STATUS_CODES.has()` | Line 91 | 3 |
| 503 Service Unavailable | `RETRYABLE_HTTP_STATUS_CODES.has()` | Line 92 | 3 |
| 504 Gateway Timeout | `RETRYABLE_HTTP_STATUS_CODES.has()` | Line 94 | 3 |
| **Timeout Errors** | HTTP status 408 | `src/utils/retry.ts:88` | 3 |
| **LLM Failures** | PipelineError codes | `src/utils/retry.ts:333-340` | **5** |
| `PIPELINE_AGENT_TIMEOUT` | Error code check | Line 337 | 5 |
| `PIPELINE_AGENT_LLM_FAILED` | Error code check | Line 338 | 5 |
| **Message Patterns** | String matching | `src/utils/retry.ts:102-113` | 3 |

**Rationale for Different Retry Limits:**
- **Rate limits (429)**: 5 retries - rate limits are temporary and explicitly signal "try again later"
- **LLM failures**: 5 retries - LLM APIs are variable and expensive, worth more attempts
- **Other transient**: 3 retries - standard balance between resilience and time

#### 3.1.2 Non-Retryable (Permanent) Errors

| Error Category | Detection Method | Source | Retry Action |
|----------------|------------------|--------|--------------|
| **Validation Errors** | `isValidationError()` | `src/utils/retry.ts:343` | **Fail immediately** |
| ValidationError | Type check + permanent pattern | Line 343 | 0 retries |
| **HTTP Client Errors** | HTTP status 400-404, 405-407 | `src/utils/retry.ts:402-405` | **Fail immediately** |
| 400 Bad Request | Status check | Line 403 | 0 retries |
| 401 Unauthorized | Status check | Line 403 | 0 retries |
| 403 Forbidden | Status check | Line 403 | 0 retries |
| 404 Not Found | Status check | Line 403 | 0 retries |
| **Parse Errors** | Message pattern | `src/utils/retry.ts:122-130` | **Fail immediately** |
| **Authentication Failures** | Message pattern | `src/utils/retry.ts:128` | **Fail immediately** |

**Critical Design Decision**: ValidationError is NEVER retryable (line 343) because retrying with the same input will always produce the same validation error. The fix cycle workflow handles validation failures at a higher level.

### 3.2 Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TASK RETRY DECISION TREE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Task Execution Error Occurred                                              │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Is error object?        │──────NO──────► [LOG & FAIL immediately]       │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│      YES                                                                    │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Check: ValidationError? │──────YES─────► [FAIL - never retryable]       │
│  └─────────────────────────┘   (src/utils/retry.ts:343)                    │
│       │                                                                     │
│      NO                                                                     │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Check: PipelineError?   │                                               │
│  │ with agent codes?       │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ├─ PIPELINE_AGENT_TIMEOUT ──────────► [RETRY - max 5 attempts]        │
│       │                                     (src/utils/retry.ts:337)        │
│       ├─ PIPELINE_AGENT_LLM_FAILED ───────► [RETRY - max 5 attempts]        │
│       │                                     (src/utils/retry.ts:338)        │
│       └─ Other PipelineError ─────────────► [CHECK HTTP status]            │
│                                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Check: HTTP Status?     │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ├─ 429 (Rate Limit) ───────────────► [RETRY - max 5 attempts]        │
│       │                                     More retries for rate limits     │
│       ├─ 408, 500, 502, 503, 504 ────────► [RETRY - max 3 attempts]        │
│       │                                     (src/utils/retry.ts:90-94)      │
│       ├─ 400, 401, 403, 404 ─────────────► [FAIL - client error]           │
│       │                                     (src/utils/retry.ts:402-405)    │
│       └─ No HTTP status ─────────────────► [CHECK error code]              │
│                                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Check: Node.js Error    │                                               │
│  │ Code?                  │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ├─ ECONNRESET, ECONNREFUSED,          │                               │
│  │    ETIMEDOUT, ENOTFOUND,               │                               │
│  │    EPIPE, EAI_AGAIN ──────────────────► [RETRY - max 3 attempts]        │
│  │                                     (src/utils/retry.ts:67-77)         │
│       └─ Other error code ───────────────► [CHECK message patterns]        │
│                                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Check: Error Message    │                                               │
│  │ Patterns?               │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ├─ "timeout", "network error",          │                              │
│  │    "temporarily unavailable",             │                              │
│  │    "rate limit" ──────────────────────► [RETRY - max 3 attempts]        │
│  │                                     (src/utils/retry.ts:102-113)        │
│       ├─ "validation failed", "invalid",      │                              │
│  │    "unauthorized", "parse error" ──────► [FAIL - permanent error]       │
│  │                                     (src/utils/retry.ts:122-130)        │
│       └─ Unknown error ──────────────────► [FAIL safe - non-retryable]      │
│                                                                             │
│       │                                                                     │
│       ▼ (if retryable)                                                      │
│  ┌─────────────────────────┐                                               │
│  │ Check: Retry Count      │                                               │
│  │ vs Max Attempts         │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ├─ Attempts < Max ─────────────────► [CALCULATE DELAY & RETRY]       │
│       │                                                                     │
│       └─ Attempts >= Max ────────────────► [FAIL - max retries exhausted]   │
│                                                                             │
│       │                                                                     │
│       ▼ (before retry)                                                      │
│  ┌─────────────────────────┐                                               │
│  │ Update Retry State:     │                                               │
│  │ - Increment retry count │                                               │
│  │ - Store last error      │                                               │
│  │ - Update timestamp      │                                               │
│  │ - Persist to session    │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Calculate Delay:        │                                               │
│  │ exponentialDelay =      │                                               │
│  │   min(baseDelay * 2^attempt, maxDelay)                                  │
│  │ jitter = exponentialDelay * 0.1 * random()                              │
│  │ delay = exponentialDelay + jitter                                       │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Notify User:            │                                               │
│  │ - Log retry with level  │                                               │
│  │   based on attempt #    │                                               │
│  │ - Show delay time       │                                               │
│  │ - Show progress %       │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Sleep for delay         │                                               │
│  └─────────────────────────┘                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────┐                                               │
│  │ Retry Task Execution    │                                               │
│  └─────────────────────────┘                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Retry Configuration

#### 3.3.1 Default Configuration

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

// Default values
const DEFAULT_RETRY_CONFIG: TaskRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 30000,    // 30 seconds
  backoffFactor: 2,
  jitterFactor: 0.1,  // 10% variance
  enabled: true,
};
```

#### 3.3.2 Adaptive Configuration by Error Type

```typescript
// Adaptive retry limits based on error classification
function getMaxAttemptsForError(error: Error): number {
  // Rate limits get more retries (they explicitly signal "try again")
  if (isRateLimitError(error)) return 5;

  // LLM failures get more retries (expensive operations, high variability)
  if (isLLMFailure(error)) return 5;

  // Timeouts get standard retries
  if (isTimeoutError(error)) return 3;

  // Network errors get standard retries
  if (isNetworkError(error)) return 3;

  // Default
  return 3;
}
```

**Error Type to Max Attempts Mapping:**

| Error Type | Max Attempts | Rationale |
|------------|--------------|-----------|
| Rate Limit (429) | 5 | Explicitly signals to retry |
| LLM Failure | 5 | Expensive operations, high variability |
| Network Error | 3 | Standard transient handling |
| Timeout (408, 504) | 3 | Standard transient handling |
| Server Error (500-503) | 3 | Standard transient handling |
| Validation Error | 0 | Never retryable |
| Client Error (400-404) | 0 | Permanent failure |

#### 3.3.3 Configuration Sources (Priority Order)

1. **CLI Options** (highest priority)
   - `--task-retry-max-attempts <N>`
   - `--task-retry-base-delay <ms>`
   - `--task-retry-max-delay <ms>`
   - `--task-retry-enabled <true|false>`

2. **Environment Variables**
   - `HACKY_TASK_RETRY_MAX_ATTEMPTS`
   - `HACKY_TASK_RETRY_BASE_DELAY`
   - `HACKY_TASK_RETRY_MAX_DELAY`
   - `HACKY_TASK_RETRY_ENABLED`

3. **Config File** (if exists)
   - `~/.hacky-hack/config.json`
   - `.hacky-hack.json` (project-local)

4. **Defaults** (lowest priority)
   - Values from `DEFAULT_RETRY_CONFIG`

### 3.4 Exponential Backoff with Jitter

#### 3.4.1 Formula

**Reference**: `src/utils/retry.ts` lines 246-268

```
exponentialDelay = min(baseDelay * (backoffFactor ^ attempt), maxDelay)
jitter = exponentialDelay * jitterFactor * random()
delay = max(1, floor(exponentialDelay + jitter))
```

**Where:**
- `attempt`: Current attempt number (0-indexed)
- `baseDelay`: Base delay in milliseconds (default: 1000)
- `backoffFactor`: Exponential multiplier (default: 2)
- `maxDelay`: Maximum delay cap (default: 30000)
- `jitterFactor`: Jitter variance (default: 0.1)
- `random()`: Returns value in range [0, 1)

#### 3.4.2 Delay Calculation Examples

**Configuration**: `baseDelay=1000`, `maxDelay=30000`, `backoffFactor=2`, `jitterFactor=0.1`

| Attempt | Exponential Delay | Jitter Range | Final Delay Range |
|---------|-------------------|--------------|-------------------|
| 0 (initial) | 0 ms | N/A | 0 ms (no delay) |
| 1 (retry 1) | 1000 ms | 0-100 ms | 1000-1100 ms |
| 2 (retry 2) | 2000 ms | 0-200 ms | 2000-2200 ms |
| 3 (retry 3) | 4000 ms | 0-400 ms | 4000-4400 ms |
| 4 (retry 4) | 8000 ms | 0-800 ms | 8000-8800 ms |
| 5 (retry 5) | 16000 ms | 0-1600 ms | 16000-17600 ms |
| 6+ | 30000 ms | 0-3000 ms | 30000-33000 ms (capped) |

**Total Time for Failed Operation** (with 3 max attempts):
- Attempt 1: 0-100 ms (operation time)
- Delay before retry 2: 1000-1100 ms
- Attempt 2: 0-100 ms (operation time)
- Delay before retry 3: 2000-2200 ms
- Attempt 3: 0-100 ms (operation time)
- **Total**: ~3100-3500 ms for 3 failed attempts

#### 3.4.3 Why Positive-Only Jitter?

**Implementation**: `src/utils/retry.ts` line 262

```typescript
// Positive jitter: always adds variance, never subtracts
// Math.random() gives range [0, 1), ensuring jitter is always >= 0
const jitter = exponentialDelay * jitterFactor * Math.random();
```

**Rationale**: AWS research shows full jitter (random between 0 and exponential) is optimal, but our implementation uses positive-only jitter for simplicity while still preventing thundering herd.

### 3.5 State Preservation Strategy

#### 3.5.1 Retry State Schema

**Extend existing Subtask interface** (defined in core models):

```typescript
/**
 * Retry state for task execution
 *
 * @remarks
 * Tracks retry attempts and last error for crash recovery
 * and observability. Persisted via SessionManager.
 */
interface SubtaskRetryState {
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

// Extend existing Subtask interface
interface Subtask {
  // ... existing properties: id, title, status, dependencies ...

  /** Retry state (populated on first error) */
  retryState?: SubtaskRetryState;
}
```

#### 3.5.2 State Persistence Flow

**Reference**: `src/core/session-manager.ts` batch write pattern

```typescript
// 1. Initialize retry state on first error
function initializeRetryState(subtask: Subtask, error: Error): void {
  subtask.retryState = {
    retryAttempts: 0,
    lastError: {
      message: error.message,
      code: (error as PipelineError).code,
      timestamp: new Date(),
    },
    firstAttemptAt: new Date(),
    lastAttemptAt: new Date(),
  };
}

// 2. Update retry state before each retry
function updateRetryState(subtask: Subtask, error: Error): void {
  if (!subtask.retryState) {
    initializeRetryState(subtask, error);
  }
  subtask.retryState.retryAttempts++;
  subtask.retryState.lastError = {
    message: error.message,
    code: (error as PipelineError).code,
    timestamp: new Date(),
  };
  subtask.retryState.lastAttemptAt = new Date();
}

// 3. Clear retry state on success
function clearRetryState(subtask: Subtask): void {
  subtask.retryState = undefined;
}

// 4. Persist via SessionManager
await sessionManager.updateItemStatus(subtask.id, 'Implementing', `Retry ${attemptNumber}`);
await sessionManager.flushUpdates(); // CRITICAL: Atomic batch write
```

**Gotcha**: Must call `flushUpdates()` immediately after updating retry state to ensure crash recovery works.

#### 3.5.3 Crash Recovery

On pipeline restart after crash:
1. Load session from `SessionManager.initialize()`
2. Scan backlog for tasks with `retryState`
3. For tasks with `retryState.retryAttempts < maxAttempts`:
   - Calculate remaining attempts
   - Resume retry from current attempt count
4. For tasks with `retryState.retryAttempts >= maxAttempts`:
   - Keep status as "Failed"
   - Report in failure summary

### 3.6 User Notification Pattern

#### 3.6.1 Progressive Disclosure Strategy

Notifications escalate in detail and urgency as retry attempts accumulate:

| Retry State | Log Level | User Action | Message Pattern |
|-------------|-----------|-------------|-----------------|
| **First Attempt** | None | No | (silent - no notification) |
| **Retry 1** | `info` | No | "Transient error, retrying (1/3) in 1.0s..." |
| **Retry 2** | `warn` | No | "Still experiencing issues, retrying (2/3) in 2.1s..." |
| **Retry 3+** | `warn` | Monitor | "Multiple retries attempted (3/3) in 4.3s... Please wait." |
| **Max Reached** | `error` | Yes | "Task failed after 3 attempts: [error]. Action required." |
| **Permanent Error** | `error` | Yes | "Task failed (permanent error): [error]. Fix required." |

#### 3.6.2 Notification Format

**Reference**: `src/utils/logger.ts` for structured logging

```typescript
// Retry notification format
this.logger.info({
  subtaskId: subtask.id,
  attempt: 1,
  maxAttempts: 3,
  delayMs: 1050,
  errorName: 'NetworkError',
  errorCode: 'ECONNRESET',
  retryState: {
    attempts: 1,
    firstAttemptAt: new Date('2026-01-24T12:00:00Z'),
  },
}, 'Transient error, retrying');

// Max retries reached format
this.logger.error({
  subtaskId: subtask.id,
  attempts: 3,
  maxAttempts: 3,
  totalDurationMs: 3520,
  finalError: {
    name: 'NetworkError',
    message: 'ECONNRESET',
    code: 'ECONNRESET',
  },
  retryState: {
    attempts: 3,
    firstAttemptAt: new Date('2026-01-24T12:00:00Z'),
    lastAttemptAt: new Date('2026-01-24T12:00:03Z'),
  },
}, 'Task failed after max retry attempts');
```

#### 3.6.3 Console Output Examples

```
[INFO] Starting task: P3.M2.T1.S1 - Design Task Retry Strategy
[INFO] Task executing...

[WARN] ⚠️  Transient error detected: ECONNRESET
[WARN] 🔄 Retry 1/3 in 1.1s...

[WARN] ⚠️  Still experiencing issues: ETIMEDOUT
[WARN] 🔄 Retry 2/3 in 2.2s...

[ERROR] ❌ Task failed after 3 attempts: Connection timeout
[ERROR] 💡 Action required: Check network connectivity or retry manually
```

### 3.7 Integration with Failure Tracking

#### 3.7.1 Extend TaskFailure Interface

**Reference**: `src/workflows/prp-pipeline.ts` lines 410-418

```typescript
// Current TaskFailure interface
interface TaskFailure {
  taskId: string;
  taskTitle: string;
  error: Error;
  errorCode?: string;
  timestamp: Date;
  phase?: string;
  milestone?: string;
}

// Extended TaskFailure interface with retry info
interface TaskFailureWithRetry extends TaskFailure {
  /** Number of retry attempts made */
  retryAttempts?: number;

  /** First attempt timestamp */
  firstAttemptAt?: Date;

  /** Total duration including retries */
  totalDurationMs?: number;

  /** Whether error was retryable */
  wasRetryable?: boolean;
}
```

#### 3.7.2 Enhanced #trackFailure() Method

**Reference**: `src/workflows/prp-pipeline.ts` lines 387-433

```typescript
#trackFailure(
  taskId: string,
  error: unknown,
  context?: {
    phase?: string;
    milestone?: string;
    taskTitle?: string;
    retryAttempts?: number;      // NEW
    firstAttemptAt?: Date;        // NEW
    totalDurationMs?: number;     // NEW
    wasRetryable?: boolean;       // NEW
  }
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  let errorCode: string | undefined;

  if (isPipelineError(error)) {
    errorCode = error.code;
  }

  const taskTitle = context?.taskTitle ?? taskId;

  // Create failure record with retry information
  const failure: TaskFailureWithRetry = {
    taskId,
    taskTitle,
    error: errorObj,
    errorCode,
    timestamp: new Date(),
    phase: context?.phase,
    milestone: context?.milestone,
    retryAttempts: context.retryAttempts,      // NEW
    firstAttemptAt: context.firstAttemptAt,    // NEW
    totalDurationMs: context.totalDurationMs,  // NEW
    wasRetryable: context.wasRetryable,        // NEW
  };

  this.#failedTasks.set(taskId, failure);

  // Enhanced logging with retry context
  this.logger.error('[PRPPipeline] Task failure tracked', {
    taskId,
    taskTitle: failure.taskTitle,
    errorCode,
    errorMessage: errorObj.message,
    retryAttempts: failure.retryAttempts ?? 0,      // NEW
    wasRetryable: failure.wasRetryable ?? false,    // NEW
    totalDurationMs: failure.totalDurationMs,       // NEW
    timestamp: failure.timestamp.toISOString(),
    ...context,
  });
}
```

#### 3.7.3 Retry Metrics

**Track these metrics for observability:**

```typescript
interface RetryMetrics {
  /** Total retry attempts across all tasks */
  totalRetryAttempts: number;

  /** Tasks that succeeded after retry */
  successAfterRetry: number;

  /** Tasks that failed after all retries */
  failureAfterRetry: number;

  /** Tasks that failed immediately (non-retryable) */
  failureImmediate: number;

  /** Retry success rate */
  retrySuccessRate: number;

  /** Average retry attempts per task */
  averageRetryAttempts: number;

  /** Total time spent in retries */
  totalRetryDurationMs: number;
}
```

**Metrics Calculation:**
```
retrySuccessRate = successAfterRetry / (successAfterRetry + failureAfterRetry)
averageRetryAttempts = totalRetryAttempts / (successAfterRetry + failureAfterRetry)
```

---

## 4. Implementation Strategy

### 4.1 Integration Points

#### 4.1.1 TaskOrchestrator Modification

**File**: `src/core/task-orchestrator.ts`

**Location**: `executeSubtask()` method (lines 611-777)

**Current Pattern**:
```typescript
// Lines 672-776
try {
  const result = await this.#prpRuntime.executeSubtask(subtask, this.#backlog);
  // Handle result...
} catch (error) {
  await this.setStatus(subtask.id, 'Failed', `Execution failed: ${errorMessage}`);
  this.#logger.error({ subtaskId: subtask.id, error: errorMessage }, 'Subtask execution failed');
  await this.sessionManager.flushUpdates();
  throw error;
}
```

**Proposed Modification**: Wrap the execution with retry logic
```typescript
// NEW: Add retry wrapper
try {
  const result = await this.#executeWithRetry(subtask);
  // Handle result...
} catch (error) {
  // Already handled by retry logic, just propagate
  throw error;
}

// NEW: Retry wrapper method
async #executeWithRetry(subtask: Subtask): Promise<SubtaskResult> {
  const maxAttempts = this.#getMaxAttemptsForTask(subtask);
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt < maxAttempts) {
    try {
      return await this.#prpRuntime.executeSubtask(subtask, this.#backlog);
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        // Non-retryable: fail immediately
        await this.setStatus(subtask.id, 'Failed', `Non-retryable error: ${lastError.message}`);
        throw error;
      }

      attempt++;
      if (attempt >= maxAttempts) {
        // Max attempts reached
        await this.setStatus(subtask.id, 'Failed', `Failed after ${maxAttempts} attempts: ${lastError.message}`);
        throw error;
      }

      // Update retry state
      this.#updateRetryState(subtask, error as Error, attempt);

      // Calculate delay
      const delay = calculateDelay(attempt - 1, /* config */);

      // Log retry
      this.#logger.warn({
        subtaskId: subtask.id,
        attempt,
        maxAttempts,
        delayMs: delay,
      }, `Retrying after ${delay}ms (attempt ${attempt}/${maxAttempts})`);

      // Sleep before retry
      await sleep(delay);
    }
  }

  throw lastError;
}
```

#### 4.1.2 SessionManager Extension

**File**: `src/core/session-manager.ts`

**Add methods**:
```typescript
/**
 * Update retry state for a subtask
 */
updateRetryState(
  subtaskId: string,
  retryState: SubtaskRetryState
): void {
  const item = this.findItem(subtaskId);
  if (item) {
    (item as any).retryState = retryState;
  }
}

/**
 * Get retry state for a subtask
 */
getRetryState(subtaskId: string): SubtaskRetryState | undefined {
  const item = this.findItem(subtaskId);
  return (item as any)?.retryState;
}

/**
 * Clear retry state for a subtask
 */
clearRetryState(subtaskId: string): void {
  const item = this.findItem(subtaskId);
  if (item) {
    delete (item as any).retryState;
  }
}
```

#### 4.1.3 CLI Option Pattern

**Reference**: `src/cli/index.ts` lines 192-196, 354-386

**Add CLI options**:
```typescript
// Follow existing pattern for parallel execution options
.option('--task-retry-max-attempts <number>', 'Maximum retry attempts for tasks (default: 3)')
.option('--task-retry-base-delay <ms>', 'Base delay before first retry in ms (default: 1000)')
.option('--task-retry-max-delay <ms>', 'Maximum delay cap in ms (default: 30000)')
.option('--task-retry-enabled <true|false>', 'Enable task retry (default: true)')
```

### 4.2 Configuration Sources

**Priority Order** (highest to lowest):
1. CLI flags (e.g., `--task-retry-max-attempts 5`)
2. Environment variables (e.g., `HACKY_TASK_RETRY_MAX_ATTEMPTS=5`)
3. Config file (`~/.hacky-hack/config.json` or `.hacky-hack.json`)
4. Hardcoded defaults

### 4.3 Backward Compatibility

**Opt-out Design**: Retry is enabled by default but can be disabled:
- `--task-retry-enabled false` to disable
- Preserves existing behavior when disabled
- No breaking changes to existing interfaces

**Migration Path**:
1. Existing tasks without `retryState` field work as before
2. New tasks automatically get retry state on first error
3. Manual intervention still possible (set status to "Planned" to retry)

---

## 5. Pseudocode

### 5.1 Main Retry Logic

```
FUNCTION executeSubtaskWithRetry(subtask, config):
    maxAttempts = getMaxAttempts(subtask, config)
    attempt = 0
    firstAttemptTime = NOW()
    lastError = NULL

    WHILE attempt < maxAttempts:
        TRY:
            // Execute the subtask
            result = prpRuntime.executeSubtask(subtask, backlog)

            // Success: clear retry state and return
            IF subtask.retryState EXISTS:
                clearRetryState(subtask)
                sessionManager.flushUpdates()

            RETURN result

        CATCH error:
            lastError = error
            attempt++

            // Check if error is retryable
            IF NOT isRetryableError(error):
                // Permanent error: fail immediately
                LOG error level: ERROR,
                    message: "Task failed with non-retryable error",
                    error: error.message
                setStatus(subtask.id, "Failed", error.message)
                THROW error

            // Check if max attempts reached
            IF attempt >= maxAttempts:
                // Max retries exhausted
                duration = NOW() - firstAttemptTime
                LOG error level: ERROR,
                    message: "Task failed after max retry attempts",
                    attempts: attempt,
                    duration: duration,
                    error: error.message
                setStatus(subtask.id, "Failed", "Failed after " + attempt + " attempts")

                // Track failure with retry info
                trackFailure(
                    subtask.id,
                    error,
                    context: {
                        retryAttempts: attempt,
                        firstAttemptAt: firstAttemptTime,
                        totalDurationMs: duration,
                        wasRetryable: TRUE
                    }
                )
                THROW error

            // Update retry state
            updateRetryState(subtask, error, attempt, firstAttemptTime)
            sessionManager.flushUpdates()

            // Calculate delay with exponential backoff and jitter
            exponentialDelay = MIN(config.baseDelay * (config.backoffFactor ^ (attempt - 1)), config.maxDelay)
            jitter = exponentialDelay * config.jitterFactor * RANDOM()
            delay = MAX(1, FLOOR(exponentialDelay + jitter))

            // Progressive notification based on attempt number
            IF attempt == 1:
                LOG level: INFO, message: "Transient error, retrying..."
            ELSE IF attempt == 2:
                LOG level: WARN, message: "Still experiencing issues, retrying..."
            ELSE:
                LOG level: WARN, message: "Multiple retries attempted, please wait..."

            LOG level: WARN,
                message: "Retry " + attempt + "/" + maxAttempts + " in " + delay + "ms",
                subtaskId: subtask.id,
                attempt: attempt,
                maxAttempts: maxAttempts,
                delayMs: delay,
                errorName: error.constructor.name

            // Wait before retrying
            SLEEP(delay)

    // Should not reach here
    THROW lastError
```

### 5.2 Error Classification

```
FUNCTION isRetryableError(error):
    // NULL/undefined check
    IF error == NULL OR typeof error != "object":
        RETURN FALSE

    // Check ValidationError first (never retryable)
    // Reference: src/utils/retry.ts line 343
    IF isValidationError(error):
        RETURN FALSE

    // Check PipelineError codes
    // Reference: src/utils/retry.ts lines 333-340
    IF isPipelineError(error):
        IF error.code == "PIPELINE_AGENT_TIMEOUT":
            RETURN TRUE
        IF error.code == "PIPELINE_AGENT_LLM_FAILED":
            RETURN TRUE
        RETURN FALSE

    // Check Node.js system error codes
    // Reference: src/utils/retry.ts lines 67-77
    TRANSIENT_CODES = ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT",
                       "ENOTFOUND", "EPIPE", "EAI_AGAIN"]
    IF error.code IN TRANSIENT_CODES:
        RETURN TRUE

    // Check HTTP status codes
    // Reference: src/utils/retry.ts lines 87-94
    STATUS = error.response?.status
    IF STATUS == 429:    // Rate limit
        RETURN TRUE
    IF STATUS IN [408, 500, 502, 503, 504]:    // Timeout/server errors
        RETURN TRUE
    IF STATUS >= 400 AND STATUS < 500:    // Client errors
        RETURN FALSE

    // Check error message patterns
    // Reference: src/utils/retry.ts lines 102-113
    message = String(error.message).toLowerCase()
    TRANSIENT_PATTERNS = ["timeout", "network error", "temporarily unavailable",
                          "rate limit", "service unavailable"]
    FOR pattern IN TRANSIENT_PATTERNS:
        IF message.includes(pattern):
            RETURN TRUE

    // Default: fail safe
    RETURN FALSE
```

### 5.3 Adaptive Max Attempts

```
FUNCTION getMaxAttemptsForError(error, defaultMax):
    // Rate limits get more retries
    IF error.response?.status == 429:
        RETURN 5

    // LLM failures get more retries
    IF isPipelineError(error):
        IF error.code IN ["PIPELINE_AGENT_TIMEOUT", "PIPELINE_AGENT_LLM_FAILED"]:
            RETURN 5

    // Timeouts get standard retries
    IF error.response?.status IN [408, 504]:
        RETURN 3

    // Network errors get standard retries
    NETWORK_CODES = ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT",
                     "ENOTFOUND", "EPIPE", "EAI_AGAIN"]
    IF error.code IN NETWORK_CODES:
        RETURN 3

    // Default
    RETURN defaultMax
```

### 5.4 State Persistence

```
FUNCTION updateRetryState(subtask, error, attempt, firstAttemptTime):
    // Initialize retry state if not exists
    IF NOT subtask.retryState EXISTS:
        subtask.retryState = {
            retryAttempts: 0,
            firstAttemptAt: firstAttemptTime
        }

    // Update retry state
    subtask.retryState.retryAttempts = attempt
    subtask.retryState.lastError = {
        message: error.message,
        code: error.code,
        timestamp: NOW()
    }
    subtask.retryState.lastAttemptAt = NOW()

    // Persist to session
    sessionManager.updateItemStatus(
        subtask.id,
        "Implementing",
        "Retry attempt " + attempt + "/" + maxAttempts
    )
    sessionManager.flushUpdates()  // CRITICAL: Atomic batch write
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**File**: `tests/unit/task-retry.test.ts`

```typescript
describe('Task Retry Strategy', () => {
  describe('Error Classification', () => {
    it('should classify ValidationError as non-retryable', () => {
      const error = new ValidationError('Invalid input');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should classify ECONNRESET as retryable', () => {
      const error = new Error('Connection reset');
      (error as any).code = 'ECONNRESET';
      expect(isRetryableError(error)).toBe(true);
    });

    it('should classify HTTP 429 as retryable with max 5 attempts', () => {
      const error = new Error('Rate limited');
      (error as any).response = { status: 429 };
      expect(isRetryableError(error)).toBe(true);
      expect(getMaxAttemptsForError(error, 3)).toBe(5);
    });

    it('should classify HTTP 404 as non-retryable', () => {
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should classify PIPELINE_AGENT_TIMEOUT as retryable with max 5 attempts', () => {
      const error = new PipelineError('Agent timeout', 'PIPELINE_AGENT_TIMEOUT');
      expect(isRetryableError(error)).toBe(true);
      expect(getMaxAttemptsForError(error, 3)).toBe(5);
    });
  });

  describe('Backoff Calculation', () => {
    it('should calculate exponential backoff correctly', () => {
      const config = { baseDelay: 1000, maxDelay: 30000, backoffFactor: 2, jitterFactor: 0.1 };

      const delay1 = calculateDelay(0, config);
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(1100);

      const delay2 = calculateDelay(1, config);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(2200);

      const delay3 = calculateDelay(2, config);
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(4400);
    });

    it('should cap delay at maxDelay', () => {
      const config = { baseDelay: 1000, maxDelay: 30000, backoffFactor: 2, jitterFactor: 0.1 };

      const delay10 = calculateDelay(10, config);
      expect(delay10).toBeGreaterThanOrEqual(30000);
      expect(delay10).toBeLessThan(33000);
    });
  });

  describe('Retry State Management', () => {
    it('should initialize retry state on first error', () => {
      const subtask = createMockSubtask();
      const error = new Error('ECONNRESET');
      (error as any).code = 'ECONNRESET';

      initializeRetryState(subtask, error);

      expect(subtask.retryState).toBeDefined();
      expect(subtask.retryState.retryAttempts).toBe(0);
      expect(subtask.retryState.lastError.message).toBe('ECONNRESET');
      expect(subtask.retryState.firstAttemptAt).toBeDefined();
    });

    it('should update retry state on subsequent errors', () => {
      const subtask = createMockSubtask();
      const error1 = new Error('ECONNRESET');
      (error1 as any).code = 'ECONNRESET';
      initializeRetryState(subtask, error1);

      const error2 = new Error('ETIMEDOUT');
      (error2 as any).code = 'ETIMEDOUT';
      updateRetryState(subtask, error2);

      expect(subtask.retryState.retryAttempts).toBe(1);
      expect(subtask.retryState.lastError.message).toBe('ETIMEDOUT');
    });

    it('should clear retry state on success', () => {
      const subtask = createMockSubtask();
      subtask.retryState = { retryAttempts: 2, lastError: { message: 'Error' } };

      clearRetryState(subtask);

      expect(subtask.retryState).toBeUndefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient errors', async () => {
      const subtask = createMockSubtask();
      let attempts = 0;

      const mockExecute = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce({ success: true });

      (mockExecute as any).mock.calls[0]?.[0]?.code = 'ECONNRESET';
      (mockExecute as any).mock.calls[1]?.[0]?.code = 'ECONNRESET';

      const result = await executeSubtaskWithRetry(subtask, mockExecute, { maxAttempts: 3 });

      expect(result.success).toBe(true);
      expect(mockExecute).toHaveBeenCalledTimes(3);
    });

    it('should not retry on permanent errors', async () => {
      const subtask = createMockSubtask();
      const mockExecute = jest.fn()
        .mockRejectedValue(new ValidationError('Invalid input'));

      await expect(
        executeSubtaskWithRetry(subtask, mockExecute, { maxAttempts: 3 })
      ).rejects.toThrow('Invalid input');

      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const subtask = createMockSubtask();
      const mockExecute = jest.fn()
        .mockRejectedValue(new Error('ECONNRESET'));

      await expect(
        executeSubtaskWithRetry(subtask, mockExecute, { maxAttempts: 2 })
      ).rejects.toThrow();

      expect(mockExecute).toHaveBeenCalledTimes(2);
    });
  });
});
```

### 6.2 Integration Tests

**File**: `tests/integration/task-retry-pipeline.test.ts`

```typescript
describe('Task Retry Pipeline Integration', () => {
  it('should retry failed task and continue pipeline', async () => {
    const pipeline = new PRPPipeline(mockConfig);

    // Mock first attempt to fail, second to succeed
    let attempts = 0;
    jest.spyOn(pipeline.taskOrchestrator, 'executeSubtask')
      .mockImplementation(async (subtask) => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('ECONNRESET');
          (error as any).code = 'ECONNRESET';
          throw error;
        }
        return { success: true };
      });

    await pipeline.executeBacklog();

    expect(attempts).toBe(2);
    expect(pipeline.getFailedTasks().size).toBe(0);
  });

  it('should track failure after max retries', async () => {
    const pipeline = new PRPPipeline(mockConfig);

    jest.spyOn(pipeline.taskOrchestrator, 'executeSubtask')
      .mockRejectedValue(new Error('ECONNRESET'));

    await pipeline.executeBacklog();

    const failures = pipeline.getFailedTasks();
    expect(failures.size).toBeGreaterThan(0);
    const failure = Array.from(failures.values())[0];
    expect(failure.retryAttempts).toBe(3);
    expect(failure.wasRetryable).toBe(true);
  });

  it('should fail immediately on validation error', async () => {
    const pipeline = new PRPPipeline(mockConfig);

    jest.spyOn(pipeline.taskOrchestrator, 'executeSubtask')
      .mockRejectedValue(new ValidationError('Invalid input'));

    await pipeline.executeBacklog();

    const failures = pipeline.getFailedTasks();
    const failure = Array.from(failures.values())[0];
    expect(failure.retryAttempts).toBe(0);
    expect(failure.wasRetryable).toBe(false);
  });
});
```

### 6.3 Chaos Tests

**File**: `tests/chaos/retry-chaos.test.ts`

```typescript
describe('Retry Chaos Tests', () => {
  it('should handle random transient failures', async () => {
    const failureRate = 0.3; // 30% failure rate
    const operation = jest.fn(async () => {
      if (Math.random() < failureRate) {
        const error = new Error('ECONNRESET');
        (error as any).code = 'ECONNRESET';
        throw error;
      }
      return { success: true };
    });

    const results = await Promise.all(
      Array.from({ length: 100 }, () =>
        executeSubtaskWithRetry(createMockSubtask(), operation, { maxAttempts: 5 })
      )
    );

    const successCount = results.filter(r => r.success).length;
    const successRate = successCount / 100;

    expect(successRate).toBeGreaterThan(0.95); // Should handle most failures
  });

  it('should not retry permanent failures', async () => {
    const operation = jest.fn(async () => {
      if (Math.random() < 0.1) { // 10% permanent failure rate
        throw new ValidationError('Invalid');
      }
      return { success: true };
    });

    const results = await Promise.all(
      Array.from({ length: 100 }, async () => {
        try {
          return await executeSubtaskWithRetry(createMockSubtask(), operation, { maxAttempts: 5 });
        } catch {
          return { success: false, attempts: operation.mock.calls.length };
        }
      })
    );

    const permanentFailures = results.filter(r =>
      !r.success && r.attempts === 1
    ).length;

    expect(permanentFailures).toBeGreaterThan(0); // Some should fail immediately
  });
});
```

---

## 7. Configuration Examples

### 7.1 Default Configuration

```bash
# Use all default values
hacky-hack run --prd PRD.md

# Equivalent to:
# maxAttempts: 3
# baseDelay: 1000ms
# maxDelay: 30000ms
# backoffFactor: 2
# jitterFactor: 0.1
# enabled: true
```

### 7.2 Aggressive Retry (Unstable Networks)

```bash
# More retries for unreliable networks
hacky-hack run --prd PRD.md \
  --task-retry-max-attempts 10 \
  --task-retry-base-delay 500 \
  --task-retry-max-delay 60000

# Result: Up to 10 retries with 60s max delay
```

### 7.3 Conservative Retry (Fast Fail)

```bash
# Fewer retries for faster feedback
hacky-hack run --prd PRD.md \
  --task-retry-max-attempts 1 \
  --task-retry-base-delay 500

# Result: Only 1 retry with 500ms delay
```

### 7.4 Disabled Retry (Debugging)

```bash
# Disable retry for debugging
hacky-hack run --prd PRD.md \
  --task-retry-enabled false

# Result: No retries, immediate failure on error
```

### 7.5 Environment Variable Configuration

```bash
# Set via environment variables
export HACKY_TASK_RETRY_MAX_ATTEMPTS=5
export HACKY_TASK_RETRY_BASE_DELAY=2000
export HACKY_TASK_RETRY_ENABLED=true

hacky-hack run --prd PRD.md
```

### 7.6 Config File Configuration

**File**: `~/.hacky-hack/config.json` or `.hacky-hack.json`

```json
{
  "taskRetry": {
    "maxAttempts": 5,
    "baseDelay": 2000,
    "maxDelay": 60000,
    "backoffFactor": 2,
    "jitterFactor": 0.1,
    "enabled": true
  }
}
```

---

## 8. Monitoring and Observability

### 8.1 Metrics to Track

```typescript
interface RetryMetrics {
  // Counters
  totalTasksAttempted: number;
  tasksSucceededOnFirstAttempt: number;
  tasksSucceededAfterRetry: number;
  tasksFailedAfterRetry: number;
  tasksFailedImmediately: number; // Non-retryable errors

  // Retry-specific
  totalRetryAttempts: number;
  uniqueTasksRetried: number;

  // Durations
  totalRetryTimeMs: number;
  averageRetryDelayMs: number;
  averageTaskDurationWithRetryMs: number;

  // Rates
  retrySuccessRate: number; // tasksSucceededAfterRetry / uniqueTasksRetried
  transientErrorRate: number; // uniqueTasksRetried / totalTasksAttempted

  // By error type
  errorTypeBreakdown: {
    [errorType: string]: {
      count: number;
      retryable: boolean;
      avgRetries: number;
    }
  };
}
```

### 8.2 Dashboard Queries

**Prometheus/PromQL Examples:**

```promql
# Retry success rate over time
rate(hacky_task_retry_success_total[5m]) / rate(hacky_task_retry_total[5m])

# Average retry attempts per task
rate(hacky_task_retry_attempts_total[5m]) / rate(hacky_task_retry_total[5m])

# Tasks by final status
sum by (status) (hacky_task_status_total)

# Retry latency percentiles
histogram_quantile(0.50, rate(hacky_task_retry_delay_seconds_bucket[5m]))
histogram_quantile(0.95, rate(hacky_task_retry_delay_seconds_bucket[5m]))
histogram_quantile(0.99, rate(hacky_task_retry_delay_seconds_bucket[5m]))
```

### 8.3 Alerting Rules

```yaml
# Alert on high retry failure rate
groups:
  - name: task_retry_alerts
    rules:
      - alert: HighTaskRetryFailureRate
        expr: |
          rate(hacky_task_retry_failed_total[5m]) /
          rate(hacky_task_retry_total[5m]) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High task retry failure rate"
          description: "More than 50% of task retries are failing"

      - alert: ExcessiveRetryAttempts
        expr: |
          rate(hacky_task_retry_attempts_total[5m]) /
          rate(hacky_task_retry_total[5m]) > 4
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Excessive retry attempts"
          description: "Average retry attempts per task exceeds 4"
```

---

## 9. References

### 9.1 Internal Documents

**Research Findings:**
- `plan/003_b3d3efdaf0ed/P3M2T1S1/research/fix_cycle_retry_analysis.md` - Fix cycle retry pattern analysis
- `plan/003_b3d3efdaf0ed/P3M2T1S1/research/task_orchestrator_error_analysis.md` - TaskOrchestrator error handling
- `plan/003_b3d3efdaf0ed/P3M2T1S1/research/prp_pipeline_task_execution_analysis.md` - PRPPipeline task execution
- `plan/003_b3d3efdaf0ed/P3M2T1S1/research/retry_strategy_research.md` - Industry best practices research

**Previous PRP:**
- `plan/003_b3d3efdaf0ed/P3M1T2S2/PRP.md` - Parallel execution PRP (for CLI option pattern reference)

### 9.2 Source Files (with Line Numbers)

**Core Retry Implementation:**
- `src/utils/retry.ts` - Main retry utility
  - Lines 67-77: `TRANSIENT_ERROR_CODES` constant
  - Lines 87-94: `RETRYABLE_HTTP_STATUS_CODES` constant
  - Lines 102-113: `TRANSIENT_PATTERNS` constant
  - Lines 122-130: `PERMANENT_PATTERNS` constant
  - Lines 246-268: `calculateDelay()` function
  - Lines 323-361: `isTransientError()` function
  - Lines 388-410: `isPermanentError()` function
  - Lines 475-529: Main `retry()` function
  - Lines 596-604: `AGENT_RETRY_CONFIG`
  - Lines 649-657: `MCP_RETRY_CONFIG`

**Task Execution:**
- `src/core/task-orchestrator.ts` - Task orchestration
  - Lines 611-777: `executeSubtask()` method
  - Lines 672-776: Error handling try-catch block
  - Lines 232-256: `setStatus()` method

**Pipeline:**
- `src/workflows/prp-pipeline.ts` - Main pipeline
  - Lines 381-427: `#trackFailure()` method
  - Lines 410-418: `TaskFailure` interface
  - Lines 793-912: `executeBacklog()` method
  - Lines 888-911: Error handling in execution loop

**Fix Cycle:**
- `src/workflows/fix-cycle-workflow.ts` - Fix cycle workflow
  - Lines 72: `maxIterations` constant
  - Lines 305-335: Iteration loop
  - Lines 186-201: Task-level error handling

**PRP Executor:**
- `src/agents/prp-executor.ts` - PRP execution
  - Lines 438-457: Fix-and-retry logic

**Session Manager:**
- `src/core/session-manager.ts` - State persistence
  - `updateItemStatus()` method
  - `flushUpdates()` method

**CLI:**
- `src/cli/index.ts` - CLI interface
  - Lines 192-196, 354-386: CLI option pattern

### 9.3 External URLs

**Cloud Provider Documentation:**
- [AWS Architecture Blog - Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
  - Section: Full jitter recommendation
  - Formula: `sleep(random(0, min(cap, base * 2^attempt)))`

- [Google Cloud - IAM Request Retry](https://cloud.google.com/iam/docs/request-trial)
  - Section: Automatic retry strategies

- [Microsoft Azure - Retry Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry)
  - Section: Retry pattern implementation

**Production Libraries:**
- [Tenacity - Python Retry Library](https://github.com/jd/tenacity)
  - Section: Decorator-based retry configuration

**API Documentation:**
- [Node.js Error Codes](https://nodejs.org/api/errors.html#errors_common_system_errors)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

## Appendix A: Configuration Matrix

### Retry Configuration by Scenario

| Scenario | Max Attempts | Base Delay | Max Delay | Backoff Factor | Jitter | Rationale |
|----------|--------------|------------|-----------|----------------|--------|-----------|
| **Default** | 3 | 1000ms | 30000ms | 2 | 0.1 | Balanced for most use cases |
| **LLM API Calls** | 5 | 1000ms | 60000ms | 2 | 0.1 | High value, rate limits |
| **Network Issues** | 3 | 1000ms | 30000ms | 2 | 0.1 | Standard transient handling |
| **Rate Limits** | 5 | 2000ms | 60000ms | 2 | 0.1 | Explicit retry signal |
| **User-Facing** | 2 | 500ms | 5000ms | 2 | 0.15 | Fast fail, UX priority |
| **Background Jobs** | 5 | 2000ms | 120000ms | 2 | 0.1 | Can tolerate longer delays |
| **Debugging** | 0 | - | - | - | - | Immediate failure |

---

## Appendix B: Error Codes Reference

### Retryable Error Codes

| Code | Type | Source | Max Retries |
|------|------|--------|-------------|
| `ECONNRESET` | Network | Node.js | 3 |
| `ECONNREFUSED` | Network | Node.js | 3 |
| `ETIMEDOUT` | Network | Node.js | 3 |
| `ENOTFOUND` | Network | Node.js | 3 |
| `EPIPE` | Network | Node.js | 3 |
| `EAI_AGAIN` | Network | Node.js | 3 |
| `EHOSTUNREACH` | Network | Node.js | 3 |
| `ENETUNREACH` | Network | Node.js | 3 |
| `ECONNABORTED` | Network | Node.js | 3 |
| `PIPELINE_AGENT_TIMEOUT` | LLM | Custom | 5 |
| `PIPELINE_AGENT_LLM_FAILED` | LLM | Custom | 5 |

### Non-Retryable Error Codes

| Code | Type | Source | Action |
|------|------|--------|--------|
| ValidationError | Validation | Custom | Fail immediately |
| 400 | HTTP | HTTP/1.1 | Fail immediately |
| 401 | HTTP | HTTP/1.1 | Fail immediately |
| 403 | HTTP | HTTP/1.1 | Fail immediately |
| 404 | HTTP | HTTP/1.1 | Fail immediately |
| 405 | HTTP | HTTP/1.1 | Fail immediately |
| 406 | HTTP | HTTP/1.1 | Fail immediately |
| 407 | HTTP | HTTP/1.1 | Fail immediately |

### Retryable HTTP Status Codes

| Status | Meaning | Max Retries |
|--------|---------|-------------|
| 408 | Request Timeout | 3 |
| 429 | Too Many Requests | **5** |
| 500 | Internal Server Error | 3 |
| 502 | Bad Gateway | 3 |
| 503 | Service Unavailable | 3 |
| 504 | Gateway Timeout | 3 |

---

## Appendix C: Decision Quick Reference

### Should I Retry This Error?

```
┌─────────────────────────────────────────┐
│         ERROR CLASSIFICATION QUICK       │
│              REFERENCE                   │
├─────────────────────────────────────────┤
│                                         │
│  ✅ RETRY (3 attempts):                 │
│     - ECONNRESET, ECONNREFUSED,         │
│       ETIMEDOUT, ENOTFOUND, EPIPE       │
│     - HTTP 408, 500, 502, 503, 504     │
│     - "timeout", "network error"        │
│                                         │
│  ✅ RETRY (5 attempts):                 │
│     - HTTP 429 (Rate Limit)             │
│     - PIPELINE_AGENT_TIMEOUT            │
│     - PIPELINE_AGENT_LLM_FAILED         │
│                                         │
│  ❌ DO NOT RETRY:                       │
│     - ValidationError (any)             │
│     - HTTP 400, 401, 403, 404           │
│     - "validation failed"               │
│     - "unauthorized", "forbidden"       │
│     - "parse error"                     │
│                                         │
└─────────────────────────────────────────┘
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Status**: Ready for Implementation (P3.M2.T1.S2)

---

*This design document provides complete specification for implementing automatic task retry in the PRP pipeline. All configuration values are specified, all integration points are identified with specific file paths and line numbers, and all design decisions are justified with references to existing code and industry best practices.*
