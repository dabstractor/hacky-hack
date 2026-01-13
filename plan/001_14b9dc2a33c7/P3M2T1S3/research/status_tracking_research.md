# Status Tracking and State Management Research

**Research Document:** P3.M2.T1.S3 - Status Tracking Best Practices
**Date:** 2026-01-13
**Researcher:** Claude Code Agent
**Context:** TaskOrchestrator enhancement with robust state machine patterns

---

## Executive Summary

This research document compiles best practices for status tracking and state management in workflow orchestration systems. It examines patterns from industry-standard systems (Airflow, Temporal, GitHub Actions, Argo Workflows) and provides actionable recommendations for enhancing the TaskOrchestrator with robust state machine patterns, error handling, and observability.

### Key Findings
- **State Machine Pattern**: Finite state machines with explicit transitions prevent invalid states
- **Observability**: Structured logging with correlation IDs enables distributed tracing
- **Error Handling**: Try-catch wrappers with automatic Failed state transitions
- **Status Transition Validation**: Pre-transition hooks validate state changes
- **Async Safety**: Idempotent status updates handle race conditions

---

## Table of Contents

1. [State Machine Patterns](#1-state-machine-patterns)
2. [Status Transition Logging](#2-status-transition-logging)
3. [Error Handling Patterns](#3-error-handling-patterns)
4. [Industry System Analysis](#4-industry-system-analysis)
5. [Implementation Recommendations](#5-implementation-recommendations)
6. [Common Pitfalls](#6-common-pitfalls)
7. [References](#7-references)

---

## 1. State Machine Patterns

### 1.1 Finite State Machine (FSM) Principles

**Definition**: A finite state machine is a mathematical model of computation that defines a set of states, transitions between those states, and actions associated with those transitions.

**Key Characteristics**:
- **Finite number of states**: Only valid statuses exist
- **Deterministic transitions**: From state A, only specific transitions to B, C, or D are allowed
- **Single current state**: An item can only be in one state at a time
- **Transition validation**: Each state change is validated before execution

### 1.2 Task Status State Machine

#### Current Implementation (TaskOrchestrator)

**File**: `/home/dustin/projects/hacky-hack/src/core/models.ts`

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed';
```

#### Recommended State Transition Diagram

```
                    ┌─────────────────┐
                    │    Planned      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Researching    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Implementing   │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │   Complete  │          │    Failed   │
         └─────────────┘          └─────────────┘
```

#### Valid State Transitions

| From State | To State | Condition |
|------------|----------|-----------|
| Planned | Researching | User initiates research |
| Planned | Implementing | Skip research phase |
| Researching | Implementing | Research complete |
| Researching | Failed | Research encountered unrecoverable error |
| Implementing | Complete | Execution successful |
| Implementing | Failed | Execution failed after retries |
| Failed | Implementing | Retry attempt |
| Complete | Implementing | Re-execution (rare) |

### 1.3 State Machine Implementation Pattern

#### Pattern: State Transition Validator

```typescript
/**
 * Validates state transitions before execution
 *
 * @param currentStatus - Current item status
 * @param newStatus - Desired new status
 * @returns true if transition is valid
 * @throws {Error} If transition is invalid
 *
 * @example
 * ```typescript
 * if (!isValidTransition(item.status, 'Complete')) {
 *   throw new Error('Invalid transition from Implementing to Complete');
 * }
 * ```
 */
function isValidTransition(
  currentStatus: Status,
  newStatus: Status
): boolean {
  // Define valid transitions
  const validTransitions: Record<Status, Status[]> = {
    Planned: ['Researching', 'Implementing', 'Failed'],
    Researching: ['Implementing', 'Failed'],
    Implementing: ['Complete', 'Failed'],
    Complete: ['Implementing'], // Allow re-execution
    Failed: ['Implementing'], // Allow retry
  };

  // Check if transition is allowed
  const allowed = validTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
}
```

#### Pattern: State Transition Executor with Validation

```typescript
/**
 * Executes state transition with validation and logging
 *
 * @param item - Hierarchy item to update
 * @param newStatus - Desired new status
 * @param reason - Optional reason for transition
 * @returns Updated item
 * @throws {Error} If transition is invalid
 *
 * @example
 * ```typescript
 * const updated = await transitionStatus(task, 'Implementing', 'Starting execution');
 * ```
 */
async function transitionStatus<T extends HierarchyItem>(
  item: T,
  newStatus: Status,
  reason?: string
): Promise<T> {
  const oldStatus = item.status;

  // Validate transition
  if (!isValidTransition(oldStatus, newStatus)) {
    throw new Error(
      `Invalid status transition: ${oldStatus} → ${newStatus} ` +
      `for item ${item.id}. Reason: ${reason || 'N/A'}`
    );
  }

  // Log transition
  logStatusTransition({
    itemId: item.id,
    itemType: item.type,
    oldStatus,
    newStatus,
    reason,
    timestamp: new Date().toISOString(),
  });

  // Update status (through SessionManager for persistence)
  const updated = await sessionManager.updateItemStatus(item.id, newStatus);

  return updated as T;
}
```

### 1.4 State Machine Benefits

1. **Prevents Invalid States**: No "Zombie" tasks in undefined states
2. **Explicit Transitions**: Clear control flow and audit trail
3. **Testability**: State transitions are pure functions
4. **Observable**: Every transition is logged with context
5. **Debuggable**: Easy to trace how an item reached its current state

---

## 2. Status Transition Logging

### 2.1 Structured Logging Principles

**Why Structured Logging?**
- Machine-parseable for monitoring and alerting
- Consistent schema across all transitions
- Enables querying and filtering (e.g., "Show all failed transitions")
- Supports distributed tracing with correlation IDs

**Key Fields for Status Transition Logs**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | ISO 8601 string | Yes | Exact time of transition |
| itemId | string | Yes | Unique identifier |
| itemType | string | Yes | Phase, Milestone, Task, Subtask |
| oldStatus | Status | Yes | Previous state |
| newStatus | Status | Yes | New state |
| reason | string | No | Human-readable explanation |
| correlationId | string | Yes* | Links to parent workflow |
| duration_ms | number | No | Time spent in previous state |
| error | object | No | Error details if Failed |

\* Required for distributed systems, optional for monolithic

### 2.2 Logging Implementation Pattern

#### Pattern: Structured Status Transition Logger

```typescript
/**
 * Logs status transitions with structured data
 *
 * @param event - Status transition event
 *
 * @remarks
 * Outputs JSON-formatted logs for machine parsing.
 * Includes correlation ID for distributed tracing.
 * Captures timing metrics for observability.
 */
interface StatusTransitionEvent {
  itemId: string;
  itemType: 'Phase' | 'Milestone' | 'Task' | 'Subtask';
  oldStatus: Status;
  newStatus: Status;
  reason?: string;
  correlationId?: string;
  duration_ms?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function logStatusTransition(event: StatusTransitionEvent): void {
  const logEntry = {
    level: event.newStatus === 'Failed' ? 'ERROR' : 'INFO',
    event_type: 'status_transition',
    timestamp: new Date().toISOString(),
    ...event,
  };

  // Log to stdout (can be captured by logging system)
  console.log(JSON.stringify(logEntry));
}
```

#### Example Log Output

```json
{
  "level": "INFO",
  "event_type": "status_transition",
  "timestamp": "2026-01-13T10:30:45.123Z",
  "itemId": "P1.M1.T1.S3",
  "itemType": "Subtask",
  "oldStatus": "Planned",
  "newStatus": "Implementing",
  "reason": "Dependencies satisfied: P1.M1.T1.S1, P1.M1.T1.S2",
  "correlationId": "workflow-abc123",
  "duration_ms": 5000
}
```

### 2.3 Observability Metrics

**Metrics to Track**

1. **Counters**: Number of transitions per status type
   ```typescript
   status_transitions_total{
     item_type="Subtask",
     from_status="Planned",
     to_status="Implementing"
   } → 42
   ```

2. **Histograms**: Time spent in each status
   ```typescript
   status_duration_seconds{
     item_type="Task",
     status="Implementing"
   } → avg=45.2, p95=120.5, p99=300.0
   ```

3. **Gauges**: Current distribution of items across statuses
   ```typescript
   items_by_status{
     status="Planned"
   } → 128
   ```

4. **Errors**: Failure rate by status transition
   ```typescript
   status_transition_errors_total{
     item_type="Subtask",
     from_status="Implementing",
     to_status="Failed"
   } → 3
   ```

#### Pattern: Metrics Collector

```typescript
/**
 * Collects metrics for status transitions
 *
 * @remarks
 * Integrates with Prometheus/Grafana or CloudWatch.
 * Automatically tracks transition counts and durations.
 */
class StatusMetricsCollector {
  private transitionCounts = new Map<string, number>();
  private statusDurations = new Map<string, number[]>();

  recordTransition(event: StatusTransitionEvent): void {
    // Increment transition counter
    const key = `${event.itemType}:${event.oldStatus}→${event.newStatus}`;
    this.transitionCounts.set(
      key,
      (this.transitionCounts.get(key) || 0) + 1
    );

    // Record duration if provided
    if (event.duration_ms !== undefined) {
      const durations = this.statusDurations.get(event.oldStatus) || [];
      durations.push(event.duration_ms);
      this.statusDurations.set(event.oldStatus, durations);
    }
  }

  getMetrics(): Record<string, unknown> {
    return {
      transition_counts: Object.fromEntries(this.transitionCounts),
      status_durations: Object.fromEntries(this.statusDurations),
    };
  }
}
```

### 2.4 Distributed Tracing

**Correlation IDs for Multi-Level Workflows**

When a Phase contains Milestones → Tasks → Subtasks, all status transitions should share a correlation ID linking to the parent workflow.

```typescript
/**
 * Generates correlation ID for workflow tracing
 *
 * @param itemId - Root-level item ID (e.g., Phase ID)
 * @returns Correlation ID string
 *
 * @example
 * ```typescript
 * const correlationId = generateCorrelationId('P1');
 * // Returns: "workflow-P1-20260113-abc123"
 * ```
 */
function generateCorrelationId(itemId: string): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `workflow-${itemId}-${timestamp}-${random}`;
}
```

### 2.5 Logging Best Practices Summary

1. **Always log transitions**: Every status change must be logged
2. **Include context**: Who, what, when, why
3. **Use structured format**: JSON for machine parsing
4. **Log at appropriate level**: INFO for normal, ERROR for failures
5. **Correlate events**: Use correlation IDs for distributed tracing
6. **Capture metrics**: Counters, histograms, gauges for observability
7. **Don't log sensitive data**: Avoid secrets, PII in logs
8. **Use unique IDs**: Every log entry should have a unique ID

---

## 3. Error Handling Patterns

### 3.1 Async Error Handling Principles

**Challenges with Async Error Handling**:
- Unhandled promise rejections crash Node.js processes
- Stack traces are lost in async boundaries
- Error context (what task was running) is unclear
- Race conditions can cause inconsistent state

**Best Practices**:
1. **Wrap all async operations in try-catch**
2. **Always update status to Failed on error**
3. **Log error with full context**
4. **Implement retry logic for transient failures**
5. **Use error boundaries for catastrophic failures**

### 3.2 Error Handling Implementation Pattern

#### Pattern: Safe Execution Wrapper with Status Management

```typescript
/**
 * Wraps async execution with automatic error handling and status updates
 *
 * @param item - Hierarchy item to execute
 * @param executeFn - Async function to execute
 * @param sessionManager - Session state manager
 * @returns Promise resolving to success/failure
 *
 * @remarks
 * This is a higher-order function that wraps execution with:
 * 1. Status transition to 'Implementing'
 * 2. Error handling with automatic 'Failed' status
 * 3. Structured error logging
 * 4. Retry support for transient failures
 *
 * @example
 * ```typescript
 * await safeExecute(subtask, async () => {
 *   // Do work that might fail
 *   await generatePRP(subtask);
 *   await runCoderAgent(subtask);
 * }, sessionManager);
 * ```
 */
async function safeExecute<T extends HierarchyItem>(
  item: T,
  executeFn: () => Promise<void>,
  sessionManager: SessionManager,
  options: { maxRetries?: number } = {}
): Promise<{ success: boolean; error?: Error }> {
  const { maxRetries = 3 } = options;
  let lastError: Error | undefined;

  // Transition to Implementing status
  try {
    await sessionManager.updateItemStatus(item.id, 'Implementing');
    logStatusTransition({
      itemId: item.id,
      itemType: item.type,
      oldStatus: item.status,
      newStatus: 'Implementing',
      reason: 'Starting execution',
    });
  } catch (error) {
    // Catastrophic failure: cannot even update status
    console.error(`[TaskOrchestrator] Failed to set Implementing status:`, error);
    return { success: false, error: error as Error };
  }

  // Retry loop
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Execute the work
      await executeFn();

      // Success: transition to Complete
      await sessionManager.updateItemStatus(item.id, 'Complete');
      logStatusTransition({
        itemId: item.id,
        itemType: item.type,
        oldStatus: 'Implementing',
        newStatus: 'Complete',
        reason: `Execution successful on attempt ${attempt}`,
      });

      return { success: true };

    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const isRetryable = isRetryableError(error);

      if (isRetryable && attempt < maxRetries) {
        // Log retry attempt
        console.warn(
          `[TaskOrchestrator] Attempt ${attempt} failed for ${item.id}, retrying...`,
          error
        );

        // Exponential backoff
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        continue;
      }

      // Non-retryable or final attempt failed: transition to Failed
      await sessionManager.updateItemStatus(item.id, 'Failed');
      logStatusTransition({
        itemId: item.id,
        itemType: item.type,
        oldStatus: 'Implementing',
        newStatus: 'Failed',
        reason: lastError.message,
        error: {
          name: lastError.name,
          message: lastError.message,
          stack: lastError.stack,
        },
      });

      return { success: false, error: lastError };
    }
  }

  // Should never reach here, but TypeScript needs it
  return { success: false, error: lastError };
}
```

#### Pattern: Retryable Error Detection

```typescript
/**
 * Determines if an error is retryable
 *
 * @param error - Error to evaluate
 * @returns true if error is transient/retryable
 *
 * @remarks
 * Retryable errors: network timeouts, rate limits, temporary service unavailability
 * Non-retryable errors: validation errors, authentication failures, permission denied
 */
function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /ETIMEDOUT/,
    /ECONNRESET/,
    /ECONNREFUSED/,
    /rate limit/i,
    /too many requests/i,
    /temporary unavailable/i,
    /503/, // Service Unavailable
    /504/, // Gateway Timeout
    /429/, // Too Many Requests
  ];

  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}
```

### 3.3 Error Context Enrichment

**Why Enrich Error Context?**
Stack traces alone don't show what was being processed. Add context for debugging.

```typescript
/**
 * Enriches error with context about what was being processed
 *
 * @param error - Original error
 * @param context - Execution context
 * @returns New error with enriched context
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   throw enrichError(error, {
 *     itemId: subtask.id,
 *     itemType: 'Subtask',
 *     operation: 'generatePRP',
 *     dependencies: subtask.dependencies,
 *   });
 * }
 * ```
 */
function enrichError(
  error: Error,
  context: Record<string, unknown>
): Error {
  const enrichedError = new Error(
    `[${context.itemId}] ${error.message}`
  );

  enrichedError.stack = error.stack;
  (enrichedError as Record<string, unknown>).context = context;

  return enrichedError;
}
```

### 3.4 Error Handling Best Practices Summary

1. **Never swallow errors**: Always catch, log, and propagate
2. **Set Failed status on error**: Ensure state reflects failure
3. **Log with full context**: What item, what operation, what dependencies
4. **Implement retry logic**: For transient failures (network, rate limits)
5. **Use exponential backoff**: Avoid overwhelming services on retry
6. **Distinguish retryable vs. fatal errors**: Don't retry auth failures
7. **Monitor error rates**: Alert on abnormal failure patterns
8. **Preserve stack traces**: Use `Error.captureStackTrace()` or `cause` property

---

## 4. Industry System Analysis

### 4.1 Apache Airflow

**Documentation**: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html

**Task States** (simplified):
- `no_status` → `queued` → `running` → `success` / `failed`
- Also: `upstream_failed`, `skipped`, `up_for_retry`, `up_for_reschedule`

**Status Transition Pattern**:
```python
# Airflow's TaskInstance state transitions
class TaskInstance:
    def _execute(self):
        try:
            self.state = State.RUNNING
            # Execute task
            result = self.task.execute(context)
            self.state = State.SUCCESS
        except Exception as e:
            self.state = State.FAILED
            log.error(f"Task failed: {e}")
            raise
```

**Key Learnings**:
1. **Explicit state management**: Set `state = RUNNING` before execution
2. **Try-catch around execution**: Always catch and set `FAILED` on error
3. **Rich state model**: Distinguishes between `failed` and `upstream_failed`
4. **Retry state**: `up_for_retry` enables automatic retry mechanism

### 4.2 Temporal

**Documentation**: https://docs.temporal.io/concepts/what-is-a-workflow

**Workflow States**:
- `running` → `completed` / `failed` / `canceled` / `continued_as_new`

**Activity States**:
- `scheduled` → `started` → `completed` / `failed`

**Key Pattern - Deterministic Workflow Execution**:
```typescript
// Temporal workflow code must be deterministic
async function sampleWorkflow(task: Task): Promise<void> {
  // Activity execution with automatic retry
  try {
    await activities.executeTask(task);
    task.status = 'Completed';
  } catch (error) {
    task.status = 'Failed';
    // Temporal automatically retries based on policy
    throw error;
  }
}
```

**Key Learnings**:
1. **State persistence**: Workflow state is durably stored
2. **Automatic retry**: Built-in retry policies with backoff
3. **Activity isolation**: Activities (work units) are separate from workflows (orchestration)
4. **Event sourcing**: State transitions are stored as events

### 4.3 GitHub Actions

**Documentation**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

**Job States**:
- `queued` → `in_progress` → `completed` (with `conclusion: success/failure`)

**Step States**:
- `pending` → `in_progress` → `completed`

**Key Pattern - Status Annotations**:
```yaml
# GitHub Actions uses explicit status updates
steps:
  - name: Run tests
    id: tests
    run: npm test
    if: success()  # Only run if previous steps succeeded

  - name: Report failure
    if: failure()  # Only run if any previous step failed
    run: echo "Tests failed!"
```

**Key Learnings**:
1. **Conditional execution**: `if: success()` / `if: failure()`
2. **Explicit status checks**: Clear success/failure indicators
3. **Hierarchical status**: Workflow → Job → Step status propagation

### 4.4 Argo Workflows

**Documentation**: https://argoproj.github.io/argo-workflows/

**Node Phase States**:
- `Pending` → `Running` → `Succeeded` / `Failed` / `Error` / `Skipped`

**Key Pattern - Pod Status Mapping**:
```yaml
# Argo maps Kubernetes pod status to workflow phase
phase:
  Pending: Pod not yet scheduled
  Running: Pod is running
  Succeeded: Pod exited with code 0
  Failed: Pod exited with non-zero code
  Error: Pod error (e.g., OOM killed)
  Skipped: Workflow logic skipped this step
```

**Key Learnings**:
1. **State granularity**: Distinguishes between `Failed` (exit code) and `Error` (system error)
2. **Resource-aware**: OOM killed = `Error`, not `Failed`
3. **Retry strategy**: Built-in retry policy per step

### 4.5 Industry Patterns Summary

| System | States | Error Handling | Retry Strategy |
|--------|--------|----------------|----------------|
| Airflow | 11 states | Try-catch with FAILED state | `up_for_retry` state |
| Temporal | 4 workflow states | Activity-level error handling | Built-in retry policy |
| GitHub Actions | 3 job states | Conditional execution `if: failure()` | Manual retry |
| Argo Workflows | 6 phase states | Pod status mapping | Per-step retry policy |

**Common Patterns Across All Systems**:
1. **Explicit RUNNING state**: Set before work begins
2. **Try-catch wrapper**: Always catch and set FAILED
3. **Retry state**: Separate state or automatic retry
4. **Hierarchical status**: Parent status depends on children
5. **Skipped state**: For conditional execution
6. **Error vs Failure**: Distinguish system errors vs. task failures

---

## 5. Implementation Recommendations

### 5.1 Enhanced Status Type for TaskOrchestrator

**Current** (`/home/dustin/projects/hacky-hack/src/core/models.ts:55`):
```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed';
```

**Recommended Enhancements**:
```typescript
/**
 * Enhanced status type with additional states for better observability
 *
 * @remarks
 * - Planned: Initial state, not yet started
 * - Researching: Research phase in progress
 * - Implementing: Active execution
 * - Blocked: Waiting for dependencies (NEW)
 * - UpForRetry: Scheduled for retry after failure (NEW)
 * - Skipped: Conditionally skipped (NEW)
 * - Complete: Successfully finished
 * - Failed: Failed after retries
 */
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Blocked'
  | 'UpForRetry'
  | 'Skipped'
  | 'Complete'
  | 'Failed';
```

**Rationale**:
- **Blocked**: Explicitly show waiting state (vs. silently waiting)
- **UpForRetry**: Distinguish from Failed (will retry vs. permanently failed)
- **Skipped**: For conditional execution (e.g., "skip if feature flag disabled")

### 5.2 State Transition Matrix

```typescript
/**
 * Valid state transitions for TaskOrchestrator
 *
 * @remarks
 * Defines all valid state transitions. Invalid transitions throw errors.
 */
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  Planned: ['Researching', 'Implementing', 'Blocked', 'Skipped', 'Failed'],
  Researching: ['Implementing', 'Blocked', 'Failed'],
  Implementing: ['Complete', 'Failed', 'UpForRetry', 'Blocked'],
  Blocked: ['Implementing', 'Failed', 'Skipped'], // Unblocked or timeout
  UpForRetry: ['Implementing', 'Failed'], // Retry or give up
  Skipped: ['Complete'], // Skipped tasks are marked Complete
  Complete: ['Implementing'], // Allow re-execution
  Failed: ['Implementing', 'UpForRetry'], // Manual retry or auto-retry
};
```

### 5.3 Recommended Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   TaskOrchestrator                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  executeSubtask(subtask)                           │     │
│  │    │                                                │     │
│  │    ├─→ safeExecute()                               │     │
│  │    │    ├─→ isValidTransition() ───┐               │     │
│  │    │    ├─→ updateStatus()         │               │     │
│  │    │    ├─→ logTransition() <──────┘               │     │
│  │    │    ├─→ execute()                              │     │
│  │    │    └─→ handle success/failure                 │     │
│  │    │                                                │     │
│  │    └─→ checkDependencies()                         │     │
│  │         ├─→ canExecute()                           │     │
│  │         └─→ getBlockingDependencies()              │     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Dependencies:                                               │
│  ├── StateTransitionValidator                                │
│  ├── StatusTransitionLogger                                  │
│  ├── MetricsCollector                                        │
│  └── SessionManager (state persistence)                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Code Example: Enhanced executeSubtask

**Current Implementation** (`/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts:365-401`):

```typescript
async executeSubtask(subtask: Subtask): Promise<void> {
  console.log(`[TaskOrchestrator] Executing Subtask: ${subtask.id}`);

  // Check dependencies
  if (!this.canExecute(subtask)) {
    const blockers = this.getBlockingDependencies(subtask);
    for (const blocker of blockers) {
      console.log(`[TaskOrchestrator] Blocked on: ${blocker.id}`);
    }
    return;
  }

  // Set status and execute
  await this.#updateStatus(subtask.id, 'Implementing');
  console.log(`[TaskOrchestrator] PLACEHOLDER: Would generate PRP`);
  await this.#updateStatus(subtask.id, 'Complete');
}
```

**Recommended Enhancement**:

```typescript
/**
 * Enhanced executeSubtask with state machine and error handling
 *
 * @param subtask - Subtask to execute
 * @returns Promise resolving to execution result
 */
async executeSubtask(subtask: Subtask): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Check dependencies
  if (!this.canExecute(subtask)) {
    const blockers = this.getBlockingDependencies(subtask);

    // Transition to Blocked status
    await this.#updateStatus(subtask.id, 'Blocked');

    // Log with context
    logStatusTransition({
      itemId: subtask.id,
      itemType: 'Subtask',
      oldStatus: subtask.status,
      newStatus: 'Blocked',
      reason: `Waiting for dependencies: ${blockers.map(b => b.id).join(', ')}`,
      correlationId: subtask.phaseId, // Trace to parent Phase
    });

    return { success: false, blocked: true, blockers };
  }

  // Safe execution wrapper
  const result = await safeExecute(
    subtask,
    async () => {
      // Check if we should skip this subtask
      if (shouldSkipSubtask(subtask)) {
        await this.#updateStatus(subtask.id, 'Skipped');
        return; // Early exit
      }

      // Actual execution (PRP generation + Coder agent)
      await this.#executeSubtaskWork(subtask);
    },
    this.sessionManager,
    { maxRetries: 3 }
  );

  const duration = Date.now() - startTime;

  // Record metrics
  this.metricsCollector.recordExecution({
    itemId: subtask.id,
    itemType: 'Subtask',
    success: result.success,
    duration_ms: duration,
    error: result.error,
  });

  return result;
}
```

### 5.5 Integration with Existing Codebase

**Files to Modify**:
1. `/home/dustin/projects/hacky-hack/src/core/models.ts` - Add new Status values
2. `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` - Enhance executeSubtask
3. `/home/dustin/projects/hacky-hack/src/core/session-manager.ts` - Ensure status persistence

**New Files to Create**:
1. `/home/dustin/projects/hacky-hack/src/core/state-machine.ts` - State transition validator
2. `/home/dustin/projects/hacky-hack/src/core/status-logger.ts` - Structured logging
3. `/home/dustin/projects/hacky-hack/src/core/metrics-collector.ts` - Observability metrics

---

## 6. Common Pitfalls

### 6.1 Race Conditions in Status Updates

**Problem**: Multiple concurrent processes update the same item's status.

**Example**:
```typescript
// ❌ BAD: Race condition
async function badStatusUpdate(id: string, status: Status) {
  const item = await getItem(id);
  if (item.status === 'Planned') {
    // Another process might have updated this already!
    await updateItemStatus(id, 'Implementing');
  }
}
```

**Solution**:
```typescript
// ✅ GOOD: Use CAS (Compare-And-Swap) pattern
async function goodStatusUpdate(id: string, expectedStatus: Status, newStatus: Status) {
  const result = await sessionManager.updateItemStatusIf(
    id,
    (current) => current === expectedStatus,
    newStatus
  );

  if (!result) {
    throw new Error(`Status transition conflict: expected ${expectedStatus}`);
  }
}
```

### 6.2 Silent Failures

**Problem**: Errors are swallowed and status remains unchanged.

**Example**:
```typescript
// ❌ BAD: Error swallowed, status not updated
async function badExecute(subtask: Subtask) {
  try {
    await riskyOperation();
    await updateStatus(subtask.id, 'Complete');
  } catch (error) {
    console.error(error);
    // Oops! Status not updated, task stuck in "Implementing"
  }
}
```

**Solution**:
```typescript
// ✅ GOOD: Always update status on error
async function goodExecute(subtask: Subtask) {
  try {
    await riskyOperation();
    await updateStatus(subtask.id, 'Complete');
  } catch (error) {
    await updateStatus(subtask.id, 'Failed');
    throw error; // Re-throw for caller to handle
  }
}
```

### 6.3 Zombie Tasks

**Problem**: Tasks in undefined states (e.g., "Running" forever).

**Cause**: Process crash before status update, or exception without status update.

**Solution**:
```typescript
// ✅ GOOD: Heartbeat mechanism for long-running tasks
async function executeWithHeartbeat(subtask: Subtask) {
  const heartbeat = setInterval(async () => {
    await updateHeartbeat(subtask.id);
  }, 5000); // Every 5 seconds

  try {
    await executeWork(subtask);
  } finally {
    clearInterval(heartbeat);
  }
}

// Recovery: Detect stale heartbeats on startup
async function recoverZombieTasks() {
  const staleTasks = await getItemsWithStaleHeartbeat(30000); // 30s timeout
  for (const task of staleTasks) {
    await updateItemStatus(task.id, 'Failed');
    logStatusTransition({
      itemId: task.id,
      itemType: task.type,
      oldStatus: task.status,
      newStatus: 'Failed',
      reason: 'Task heartbeat timeout (zombie task recovered)',
    });
  }
}
```

### 6.4 Missing Context in Logs

**Problem**: Logs show "Error: ECONNREFUSED" but not which task failed.

**Solution**:
```typescript
// ✅ GOOD: Enrich error with context
try {
  await executeTask(subtask);
} catch (error) {
  const enrichedError = enrichError(error, {
    itemId: subtask.id,
    itemType: 'Subtask',
    operation: 'executeTask',
    dependencies: subtask.dependencies,
    context_scope: subtask.context_scope,
  });

  logStatusTransition({
    itemId: subtask.id,
    itemType: 'Subtask',
    oldStatus: 'Implementing',
    newStatus: 'Failed',
    reason: enrichedError.message,
    error: {
      name: enrichedError.name,
      message: enrichedError.message,
      stack: enrichedError.stack,
      context: (enrichedError as Record<string, unknown>).context,
    },
  });

  throw enrichedError;
}
```

### 6.5 Over-Retrying Transient Errors

**Problem**: Infinite retries on non-retryable errors (e.g., validation failure).

**Solution**:
```typescript
// ✅ GOOD: Detect retryable vs. fatal errors
function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /ETIMEDOUT/,
    /ECONNRESET/,
    /rate limit/i,
  ];

  const fatalPatterns = [
    /validation failed/i,
    /authentication failed/i,
    /permission denied/i,
  ];

  const errorMessage = error.message.toLowerCase();

  // Explicit fatal errors are never retryable
  if (fatalPatterns.some(p => p.test(errorMessage))) {
    return false;
  }

  // Retryable patterns indicate transient issues
  return retryablePatterns.some(p => p.test(errorMessage));
}
```

---

## 7. References

### 7.1 Documentation URLs

| System | Documentation URL |
|--------|-------------------|
| Apache Airflow | https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html |
| Temporal | https://docs.temporal.io/concepts/what-is-a-workflow |
| GitHub Actions | https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions |
| Argo Workflows | https://argoproj.github.io/argo-workflows/ |
| Step Functions (AWS) | https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-state-machine-structure.html |

### 7.2 Additional Reading

**State Machine Patterns**:
- "Finite State Machines in Production" - Martin Fowler
- "State Machine Design Patterns" - Refactoring.guru

**Observability Best Practices**:
- "The Three Pillars of Observability" - Logs, Metrics, Traces
- "Structured Logging Best Practices" - Stripe Engineering Blog

**Error Handling Patterns**:
- "Error Handling in Node.js" - Joyent
- "Resilience Patterns for Distributed Systems" - Microsoft Azure

### 7.3 Related Files in This Project

| File | Description |
|------|-------------|
| `/home/dustin/projects/hacky-hack/src/core/models.ts` | Type definitions including Status type |
| `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` | Task execution orchestration |
| `/home/dustin/projects/hacky-hack/src/core/session-manager.ts` | Persistent state management |
| `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts` | Unit tests for orchestrator |

### 7.4 Key Code Locations

**Current Status Type**:
- File: `/home/dustin/projects/hacky-hack/src/core/models.ts`
- Line: 55
- Current values: `Planned | Researching | Implementing | Complete | Failed`

**Current executeSubtask Implementation**:
- File: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- Lines: 365-401
- Current behavior: Basic execution without error handling

**Dependency Resolution**:
- File: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- Methods: `canExecute()`, `getBlockingDependencies()`, `waitForDependencies()`
- Lines: 108-210

---

## Appendix A: Quick Reference

### State Transition Cheat Sheet

```
Planned → Researching → Implementing → Complete
   ↓            ↓              ↓
Failed ←───────┴──────────────┘
   ↑
   └── UpForRetry (on retry)
```

### Logging Cheat Sheet

```typescript
// Always include these fields in status logs
logStatusTransition({
  itemId: 'P1.M1.T1.S3',
  itemType: 'Subtask',
  oldStatus: 'Planned',
  newStatus: 'Implementing',
  reason: 'Dependencies satisfied',
  timestamp: '2026-01-13T10:30:45.123Z',
  correlationId: 'workflow-P1-20260113-abc123',
});
```

### Error Handling Cheat Sheet

```typescript
// Pattern: Safe execution with automatic status updates
const result = await safeExecute(
  item,
  async () => {
    // Work that might fail
    await riskyOperation();
  },
  sessionManager,
  { maxRetries: 3 }
);

if (!result.success) {
  console.error('Execution failed:', result.error);
}
```

---

## Appendix B: Implementation Checklist

- [ ] Update Status type with new states (Blocked, UpForRetry, Skipped)
- [ ] Create StateTransitionValidator class
- [ ] Create StatusTransitionLogger with structured logging
- [ ] Enhance executeSubtask with safeExecute wrapper
- [ ] Add metrics collection for observability
- [ ] Implement correlation ID tracking
- [ ] Add heartbeat mechanism for long-running tasks
- [ ] Implement zombie task recovery on startup
- [ ] Add unit tests for state transitions
- [ ] Add integration tests for error scenarios
- [ ] Document state machine in project README
- [ ] Train team on new status management patterns

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Next Review**: Before P3.M3.T1 implementation
