# Fix Cycle Retry Pattern Analysis

## Executive Summary

The fix cycle implements a sophisticated retry pattern at multiple levels: the workflow-level iteration loop, the task execution level with transient error detection, and the individual operation level with exponential backoff. This analysis reveals that the fix cycle doesn't use traditional "retries" in the typical sense but instead employs iteration-based retry combined with granular error handling.

## 1. Fix Cycle Iteration Logic

### File: /home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts

#### Iteration Implementation (Lines 305-335)
The fix cycle uses a while loop with a maximum of 3 iterations:
```typescript
while (this.iteration < this.maxIterations) {
  // Increment iteration counter
  this.iteration++;
  
  this.logger.info(
    `[FixCycleWorkflow] ========== Iteration ${this.iteration}/${this.maxIterations} ==========`
  );
  
  // Phase 1: Create fix tasks
  await this.createFixTasks();
  
  // Phase 2: Execute fixes
  await this.executeFixes();
  
  // Phase 3: Re-test
  await this.retest();
  
  // Phase 4: Check completion
  const complete = await this.checkComplete();
  
  if (complete) {
    this.logger.info(
      '[FixCycleWorkflow] All critical/major bugs resolved - fix cycle complete'
    );
    break;
  }
}
```

#### Maximum Iterations (Lines 71-72)
```typescript
/** Maximum fix iterations (hardcoded to 3 per specification) */
maxIterations: number = 3;
```

**Key Finding**: The fix cycle uses a **maximum of 3 iterations** (not 2 as mentioned in some comments). Each iteration represents a complete fix → retest cycle.

## 2. Error Handling in Fix Cycle

### Task-Level Error Handling (Lines 186-201 in executeFixes())
Individual task failures are **not retried**. The fix cycle continues with the next task:
```typescript
try {
  await this.taskOrchestrator.executeSubtask(fixTask);
  successCount++;
  this.logger.info(
    `[FixCycleWorkflow] Fix task ${fixTask.id} completed successfully`
  );
} catch (error) {
  failureCount++;
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  this.logger.error(
    `[FixCycleWorkflow] Fix task ${fixTask.id} failed: ${errorMessage}`
  );
  // Don't throw - continue with next fix
  // The retest phase will catch remaining bugs
}
```

## 3. Retry Utility Pattern

### File: /home/dustin/projects/hacky-hack/src/utils/retry.ts

#### Default Retry Configuration (Lines 475-487)
```typescript
const {
  maxAttempts = 3,
  baseDelay = 1000,
  maxDelay = 30000,
  backoffFactor = 2,
  jitterFactor = 0.1,
  isRetryable = isTransientError,
  onRetry,
} = options;
```

#### Exponential Backoff with Jitter (Lines 246-268)
```typescript
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitterFactor: number
): number {
  // Exponential backoff with cap
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );
  
  // Positive jitter: always adds variance, never subtracts
  const jitter = exponentialDelay * jitterFactor * Math.random();
  
  // Ensure delay is strictly greater than exponentialDelay
  const delay = Math.max(1, Math.floor(exponentialDelay + jitter));
  
  return delay;
}
```

## 4. Error Classification

### Transient vs Permanent Errors (Lines 323-361)

**Retryable (Transient) Errors:**
- PipelineError with codes: `PIPELINE_AGENT_TIMEOUT`, `PIPELINE_AGENT_LLM_FAILED`
- Node.js system error codes: `ECONNRESET`, `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, etc.
- HTTP status codes: 408 (timeout), 429 (rate limit), 500+ (server errors)
- Error message patterns containing: "timeout", "network error", "temporarily unavailable", "rate limit"

**Non-Retryable (Permanent) Errors:**
- ValidationError (never retryable - same input will produce same error)
- HTTP client errors (400-429, except 408 and 429)
- Error message patterns containing: "validation failed", "invalid input", "unauthorized", "forbidden"

### Detection Functions:
```typescript
export function isTransientError(error: unknown): boolean { /* ... */ }
export function isPermanentError(error: unknown): boolean { /* ... */ }
```

## 5. State Preservation Between Retries

### Session-Based State Management
The fix cycle preserves state through the SessionManager (Lines 387-407):
```typescript
#extractCompletedTasks(): Task[] {
  const backlog = this.sessionManager.currentSession?.taskRegistry;
  if (!backlog) {
    this.logger.warn('[FixCycleWorkflow] No session backlog found');
    return [];
  }
  
  const completedTasks: Task[] = [];
  
  for (const phase of backlog.backlog) {
    for (const milestone of phase.milestones) {
      for (const task of milestone.tasks) {
        if (task.status === 'Complete') {
          completedTasks.push(task);
        }
      }
    }
  }
  
  return completedTasks;
}
```

### Task Status Tracking
Tasks maintain their status across iterations:
- `Planned` → `Complete`/`Failed` → Re-evaluated in next iteration if bugs remain
- Failed tasks are not automatically retried; new fix tasks are created

## 6. Integration with Failure Tracking

### PRP Pipeline Failure Tracking (Lines 381-427 in prp-pipeline.ts)
```typescript
#trackFailure(
  taskId: string,
  error: unknown,
  context?: { phase?: string; milestone?: string; taskTitle?: string }
): void {
  // Extract error information
  const errorObj = error instanceof Error ? error : new Error(String(error));
  let errorCode: string | undefined;
  
  // Extract error code from PipelineError
  if (isPipelineError(error)) {
    errorCode = error.code;
  }
  
  // Create failure record
  const failure: TaskFailure = {
    taskId,
    taskTitle: context?.taskTitle ?? taskId,
    error: errorObj,
    errorCode,
    timestamp: new Date(),
    phase: context?.phase,
    milestone: context?.milestone,
  };
  
  // Store in failed tasks Map
  this.#failedTasks.set(taskId, failure);
}
```

### Failed Tasks Map
The PRP pipeline maintains a Map of failed tasks for error reporting:
```typescript
/** Map of failed tasks to error context for error reporting */
#failedTasks: Map<string, TaskFailure> = new Map();
```

## 7. Task Execution Retry Patterns

### Agent Prompt Retries (Lines 596-604)
```typescript
const AGENT_RETRY_CONFIG: Required<
  Omit<RetryOptions, 'isRetryable' | 'onRetry'>
> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

### MCP Tool Retries (Lines 649-657)
```typescript
const MCP_RETRY_CONFIG: Required<
  Omit<RetryOptions, 'isRetryable' | 'onRetry'>
> = {
  maxAttempts: 2,
  baseDelay: 500,
  maxDelay: 5000,
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

## 8. Retry vs Iteration Distinction

**Important Finding**: The fix cycle does not use traditional "retries" but rather:

1. **Iteration-based Retry**: Complete fix → retest cycles (max 3)
2. **Transient Error Retries**: Individual operations within tasks use retry utility
3. **Task-level Continuation**: Failed tasks don't retry; continue to next task

## 9. Key Files and Line Numbers

### Core Retry Implementation:
- /home/dustin/projects/hacky-hack/src/utils/retry.ts - Main retry utility (lines 475-529)
- /home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts - Fix cycle workflow (lines 305-335)
- /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts - Pipeline failure tracking (lines 381-427)

### Task Execution:
- /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts - Task orchestration
- /home/dustin/projects/hacky-hack/src/core/concurrent-executor.ts - Parallel execution (lines 313-380)
- /home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts - PRP execution

## 10. Recommendations

1. **Clarify Terminology**: The code uses "retry" and "iteration" differently - documentation should clarify this distinction
2. **Configuration**: Consider making the maxIterations configurable rather than hardcoded
3. **Task Retry**: Consider implementing individual task retry before marking as failed
4. **Error Context**: Enhance error tracking with more context about retry attempts
5. **Metrics**: Add metrics tracking for retry success/failure rates

## Conclusion

The fix cycle implements a robust multi-layered approach to handling failures:
- High-level iterations for complete fix cycles
- Fine-grained retry utilities for transient errors
- Comprehensive failure tracking and reporting
- State preservation through session management

The system is designed to be resilient to transient failures while avoiding infinite loops through well-defined iteration limits and error classification.
