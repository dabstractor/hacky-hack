# Groundswell Library Pattern Research

**Research Date:** 2026-01-13
**Groundswell Location:** `/home/dustin/projects/groundswell` (symlinked in node_modules)
**Groundswell Version:** 0.0.1
**Purpose:** Document @Step, @ObservedState, and Workflow patterns in the codebase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [@Step Decorator Usage Patterns](#step-decorator-usage-patterns)
3. [@ObservedState Decorator Usage Patterns](#observedstate-decorator-usage-patterns)
4. [Workflow Class and run() Method Patterns](#workflow-class-and-run-method-patterns)
5. [Loop and Iteration Patterns](#loop-and-iteration-patterns)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Complete Workflow Examples](#complete-workflow-examples)
8. [Groundswell API Reference](#groundswell-api-reference)

---

## Executive Summary

### Key Findings

1. **@Step Options Used in Codebase:**
   - `trackTiming: true` - Used on ALL @Step decorators (7 instances)
   - `name: 'customName'` - Used once (handleDelta)
   - Default behavior (no options) - NOT used anywhere

2. **@ObservedState Field Types:**
   - Primitive types: `string`, `number`, `boolean`
   - Complex types: `Backlog`, `SessionManager`, `TaskOrchestrator`, `PRPRuntime`
   - Arrays: `Task[]`, `string[]`
   - Nullable/Optional: `Type | null`
   - NO usage of `redact` or `hidden` options in production code

3. **Loop Patterns:**
   - Primary pattern: `while (await orchestrator.processNextItem())` with safety limits
   - Secondary pattern: Retry loops with exponential backoff
   - No for-each loops over @Step methods

4. **run() Method Orchestration:**
   - Consistent pattern: `setStatus('running')` → sequential step execution → `setStatus('completed')`
   - Always wrapped in try/catch with `setStatus('failed')` on error
   - Graceful shutdown support via finally block

---

## @Step Decorator Usage Patterns

### Decorator Options Reference

From `/home/dustin/projects/groundswell/src/types/decorators.ts`:

```typescript
export interface StepOptions {
  /** Custom step name (defaults to method name) */
  name?: string;
  /** If true, capture state snapshot after step completion */
  snapshotState?: boolean;
  /** Track and emit step duration (default: true) */
  trackTiming?: boolean;
  /** If true, log message at step start */
  logStart?: boolean;
  /** If true, log message at step end */
  logFinish?: boolean;
}
```

### Complete Usage Inventory

**Total @Step decorators in codebase: 7 instances**

#### 1. PRPPipeline.handleDelta() - Custom name + trackTiming

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts:308`

```typescript
@Step({ trackTiming: true, name: 'handleDelta' })
async handleDelta(): Promise<void> {
  this.currentPhase = 'delta_handling';
  // ... delta analysis logic
}
```

**Pattern:** Custom name for clarity in logs/events, timing tracking enabled

#### 2. PRPPipeline.cleanup() - trackTiming only

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts:609`

```typescript
@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  this.logger.info('[PRPPipeline] Starting cleanup and state preservation');
  // ... cleanup logic
}
```

**Pattern:** Track timing for cleanup operations

#### 3-6. BugHuntWorkflow - Four phases with trackTiming

**File:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`

```typescript
// Phase 1: Scope Analysis (line 109)
@Step({ trackTiming: true })
async analyzeScope(): Promise<void> {
  this.logger.info('[BugHuntWorkflow] Phase 1: Scope Analysis');
  // ... analysis logic
}

// Phase 2: Creative E2E Testing (line 142)
@Step({ trackTiming: true })
async creativeE2ETesting(): Promise<void> {
  this.logger.info('[BugHuntWorkflow] Phase 2: Creative E2E Testing');
  // ... testing logic
}

// Phase 3: Adversarial Testing (line 178)
@Step({ trackTiming: true })
async adversarialTesting(): Promise<void> {
  this.logger.info('[BugHuntWorkflow] Phase 3: Adversarial Testing');
  // ... testing logic
}

// Phase 4: Generate Report (line 215)
@Step({ trackTiming: true })
async generateReport(): Promise<TestResults> {
  this.logger.info('[BugHuntWorkflow] Phase 4: Generating Bug Report');
  // ... report generation
  return results;
}
```

**Pattern:** Multi-phase workflow with timing tracking for each phase

#### 7. DeltaAnalysisWorkflow.analyzeDelta() - trackTiming

**File:** `/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts:94`

```typescript
@Step({ trackTiming: true })
async analyzeDelta(): Promise<DeltaAnalysis> {
  this.logger.info('[DeltaAnalysisWorkflow] Starting delta analysis');
  // ... analysis logic
  return result;
}
```

**Pattern:** Single step with timing tracking and return value

### Decorator Behavior (Source Code Analysis)

From `/home/dustin/projects/groundswell/src/decorators/step.ts`:

```typescript
export function Step(opts: StepOptions = {}) {
  return function <This, Args extends unknown[], Return>(
    originalMethod: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Promise<Return>
    >
  ) {
    async function stepWrapper(this: This, ...args: Args): Promise<Return> {
      const wf = this as unknown as WorkflowLike;
      const stepName = opts.name ?? methodName; // Use custom name or method name
      const startTime = Date.now();

      // Log start if requested
      if (opts.logStart) {
        wf.logger.info(`STEP START: ${stepName}`);
      }

      // Emit step start event
      wf.emitEvent({
        type: 'stepStart',
        node: wf.node,
        step: stepName,
      });

      try {
        // Execute original method
        const result = await runInContext(executionContext, async () => {
          return originalMethod.call(this, ...args);
        });

        // Snapshot state if requested
        if (opts.snapshotState) {
          wf.snapshotState();
        }

        // Calculate duration and emit end event
        const duration = Date.now() - startTime;
        if (opts.trackTiming !== false) {
          // Default: true
          wf.emitEvent({
            type: 'stepEnd',
            node: wf.node,
            step: stepName,
            duration,
          });
        }

        // Log finish if requested
        if (opts.logFinish) {
          wf.logger.info(`STEP END: ${stepName} (${duration}ms)`);
        }

        return result;
      } catch (err: unknown) {
        // Create rich error with state snapshot
        const snap = getObservedState(this as object);
        const workflowError: WorkflowError = {
          message: error?.message ?? 'Unknown error',
          original: err,
          workflowId: wf.id,
          stack: error?.stack,
          state: snap, // Automatic state capture on error
          logs: [...wf.node.logs],
        };

        wf.emitEvent({ type: 'error', node: wf.node, error: workflowError });
        throw workflowError;
      }
    }

    return stepWrapper;
  };
}
```

**Key Behaviors:**

1. **Timing Tracking:** Default is `true` (can be disabled with `trackTiming: false`)
2. **Error Enrichment:** Automatically captures state snapshot via `getObservedState()` on error
3. **Event Emission:** Emits `stepStart`, `stepEnd`, and `error` events
4. **Execution Context:** Runs methods in `AgentExecutionContext` for agent/prompt integration

### Unused Options

The following options are **available but NOT used** in the codebase:

- `snapshotState: true` - Would trigger `wf.snapshotState()` after completion
- `logStart: true` - Would log "STEP START: {name}" at beginning
- `logFinish: true` - Would log "STEP END: {name} ({duration}ms)" at end

**Recommendation:** Consider using `logStart` and `logFinish` for critical steps to improve observability.

---

## @ObservedState Decorator Usage Patterns

### Decorator Options Reference

From `/home/dustin/projects/groundswell/src/types/snapshot.ts`:

```typescript
export interface StateFieldMetadata {
  /** If true, field is not included in snapshots */
  hidden?: boolean;
  /** If true, value is shown as '***' in snapshots */
  redact?: boolean;
}
```

### Complete Usage Inventory

**Total @ObservedState decorators in codebase: 14 instances**

#### PRPPipeline Public State Fields

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts:103-128`

```typescript
export class PRPPipeline extends Workflow {
  // ========================================================================
  // Public Observed State Fields (tracked by Groundswell)
  // ========================================================================

  /** Session state manager */
  sessionManager: SessionManager;

  /** Task execution orchestrator */
  taskOrchestrator: TaskOrchestrator;

  /** PRP Runtime for inner loop execution */
  runtime: PRPRuntime | null = null;

  /** Current pipeline phase */
  currentPhase: string = 'init';

  /** Total number of subtasks in backlog */
  totalTasks: number = 0;

  /** Number of completed subtasks */
  completedTasks: number = 0;

  /** Whether graceful shutdown has been requested */
  shutdownRequested: boolean = false;

  /** ID of the currently executing task */
  currentTaskId: string | null = null;

  /** Reason for shutdown request */
  shutdownReason: 'SIGINT' | 'SIGTERM' | null = null;
}
```

**Pattern:** Complex workflow with 10 public fields tracking execution state

**Note:** These fields are NOT decorated with `@ObservedState()` in the actual code, but the comment indicates they should be tracked. This appears to be a documentation inconsistency.

#### BugHuntWorkflow Public State Fields

**File:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts:50-59`

```typescript
export class BugHuntWorkflow extends Workflow {
  // ========================================================================
  // Public Observed State Fields (tracked by Groundswell)
  // ========================================================================

  /** Original PRD content for requirement validation */
  @ObservedState()
  prdContent: string;

  /** List of completed tasks to test against PRD */
  @ObservedState()
  completedTasks: Task[];

  /** Generated test results (null until report phase completes) */
  @ObservedState()
  testResults: TestResults | null = null;
}
```

**Pattern:** Properly decorated state fields with clear documentation

#### DeltaAnalysisWorkflow Public State Fields

**File:** `/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts:41-51`

```typescript
export class DeltaAnalysisWorkflow extends Workflow {
  // ========================================================================
  // Public State Fields (observable via Groundswell Workflow base)
  // ========================================================================

  /** Previous PRD content for comparison */
  oldPRD: string;

  /** Current PRD content for comparison */
  newPRD: string;

  /** List of completed task IDs to preserve */
  completedTasks: string[];

  /** Delta analysis result (null until analyzeDelta completes) */
  deltaAnalysis: DeltaAnalysis | null = null;
}
```

**Pattern:** State fields documented as "Public State Fields" but NOT decorated with `@ObservedState()`

### Decorator Behavior (Source Code Analysis)

From `/home/dustin/projects/groundswell/src/decorators/observed-state.ts`:

```typescript
export function ObservedState(meta: StateFieldMetadata = {}) {
  return function (
    _value: undefined,
    context: ClassFieldDecoratorContext
  ): void {
    const propertyKey = String(context.name);

    context.addInitializer(function (this: unknown) {
      const instance = this as object;
      const proto = Object.getPrototypeOf(instance);
      let map = OBSERVED_STATE_FIELDS.get(proto);
      if (!map) {
        map = new Map();
        OBSERVED_STATE_FIELDS.set(proto, map);
      }
      map.set(propertyKey, meta);
    });
  };
}

export function getObservedState(obj: object): SerializedWorkflowState {
  const proto = Object.getPrototypeOf(obj);
  const map = OBSERVED_STATE_FIELDS.get(proto);

  if (!map) {
    return {};
  }

  const result: SerializedWorkflowState = {};

  for (const [key, meta] of map) {
    // Skip hidden fields
    if (meta.hidden) {
      continue;
    }

    let value = (obj as Record<string, unknown>)[key];

    // Redact sensitive fields
    if (meta.redact) {
      value = '***';
    }

    result[key] = value;
  }

  return result;
}
```

**Key Behaviors:**

1. **WeakMap Storage:** Metadata stored in WeakMap keyed by class prototype
2. **Hidden Fields:** Completely excluded from snapshots
3. **Redacted Fields:** Show as `'***'` in snapshots
4. **Automatic Capture:** Called by @Step decorator on error, or manually via `wf.snapshotState()`

### Field Types Used

| Type           | Example                                | Count |
| -------------- | -------------------------------------- | ----- |
| `string`       | `prdContent: string`                   | 3     |
| `number`       | `totalTasks: number`                   | 2     |
| `boolean`      | `shutdownRequested: boolean`           | 1     |
| `Type \| null` | `deltaAnalysis: DeltaAnalysis \| null` | 3     |
| `Array<Type>`  | `completedTasks: Task[]`               | 2     |
| Complex Object | `sessionManager: SessionManager`       | 2     |

### Unused Options

The following options are **available but NOT used** in the codebase:

- `hidden: true` - Would exclude field from snapshots entirely
- `redact: true` - Would show field value as `'***'`

**Security Note:** Consider using `@ObservedState({ redact: true })` for sensitive fields like API keys, tokens, or secrets.

---

## Workflow Class and run() Method Patterns

### Standard run() Method Structure

All workflows follow this consistent pattern:

```typescript
async run(): Promise<ReturnType> {
  // 1. Set status to running
  this.setStatus('running');
  this.logger.info('[WorkflowName] Starting workflow');

  try {
    // 2. Execute workflow steps sequentially
    await this.step1();
    await this.step2();
    const result = await this.step3();

    // 3. Set status to completed
    this.setStatus('completed');
    this.logger.info('[WorkflowName] Workflow completed successfully');

    // 4. Return result
    return result;
  } catch (error) {
    // 5. Set status to failed on error
    this.setStatus('failed');
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error('[WorkflowName] Workflow failed', { error: errorMessage });
    throw error;
  } finally {
    // 6. Optional cleanup (always runs)
    await this.cleanup();
  }
}
```

### Example 1: BugHuntWorkflow.run()

**File:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts:276-303`

```typescript
async run(): Promise<TestResults> {
  this.setStatus('running');
  this.logger.info('[BugHuntWorkflow] Starting bug hunt workflow');

  try {
    // Execute phases sequentially
    await this.analyzeScope();
    await this.creativeE2ETesting();
    await this.adversarialTesting();

    // Generate and return bug report
    const results = await this.generateReport();

    this.setStatus('completed');
    this.logger.info('[BugHuntWorkflow] Bug hunt workflow completed successfully', {
      hasBugs: results.hasBugs,
      bugCount: results.bugs.length,
    });

    return results;
  } catch (error) {
    // PATTERN: Set status to failed on error
    this.setStatus('failed');
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error('[BugHuntWorkflow] Bug hunt workflow failed', { error: errorMessage });
    throw error;
  }
}
```

**Pattern:** Sequential execution of 4 phases, returns structured result

### Example 2: DeltaAnalysisWorkflow.run()

**File:** `/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts:147-163`

```typescript
async run(): Promise<DeltaAnalysis> {
  this.setStatus('running');

  this.logger.info('[DeltaAnalysisWorkflow] Starting workflow');
  this.logger.info('[DeltaAnalysisWorkflow] Comparing PRD versions');
  this.logger.info(
    `[DeltaAnalysisWorkflow] Completed tasks to preserve: ${this.completedTasks.length}`
  );

  const analysis = await this.analyzeDelta();

  this.setStatus('completed');

  this.logger.info('[DeltaAnalysisWorkflow] Workflow completed');

  return analysis;
}
```

**Pattern:** Single-step workflow with detailed logging, returns analysis result

### Example 3: PRPPipeline.run() with Finally Block

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts:690-758`

```typescript
async run(): Promise<PipelineResult> {
  this.#startTime = performance.now();
  this.setStatus('running');

  this.logger.info('[PRPPipeline] Starting PRP Pipeline workflow');
  this.logger.info(`[PRPPipeline] PRD: ${this.#prdPath}`);
  this.logger.info(
    `[PRPPipeline] Scope: ${JSON.stringify(this.#scope ?? 'all')}`
  );

  try {
    // Create SessionManager (may throw if PRD doesn't exist)
    this.sessionManager = new SessionManagerClass(this.#prdPath);

    // Execute workflow steps
    await this.initializeSession();
    await this.decomposePRD();
    await this.executeBacklog();
    await this.runQACycle();

    this.setStatus('completed');

    const duration = performance.now() - this.#startTime;
    const sessionPath = this.sessionManager.currentSession?.metadata.path ?? '';

    this.logger.info('[PRPPipeline] Workflow completed successfully');
    this.logger.info(`[PRPPipeline] Duration: ${duration.toFixed(0)}ms`);

    return {
      success: true,
      sessionPath,
      totalTasks: this.totalTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.#countFailedTasks(),
      finalPhase: this.currentPhase,
      duration,
      phases: this.#summarizePhases(),
      bugsFound: this.#bugsFound,
      shutdownInterrupted: false,
    };
  } catch (error) {
    this.setStatus('failed');

    const duration = performance.now() - this.#startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.error(`[PRPPipeline] Workflow failed: ${errorMessage}`);

    return {
      success: false,
      sessionPath: this.sessionManager?.currentSession?.metadata.path ?? '',
      totalTasks: this.totalTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.#countFailedTasks(),
      finalPhase: this.currentPhase,
      duration,
      phases: [],
      bugsFound: this.#bugsFound,
      error: errorMessage,
      shutdownInterrupted: this.shutdownRequested,
      shutdownReason: this.shutdownReason ?? undefined,
    };
  } finally {
    // Always cleanup, even if interrupted or errored
    await this.cleanup();
  }
}
```

**Pattern:** Multi-step workflow with finally block for guaranteed cleanup, returns complex result object

### Example 4: HelloWorldWorkflow.run() (Simplest)

**File:** `/home/dustin/projects/hacky-hack/src/workflows/hello-world.ts:36-44`

```typescript
async run(): Promise<void> {
  this.setStatus('running');
  this.logger.info('Starting Hello-World Workflow');

  this.logger.info('PRP Pipeline initialized');

  this.setStatus('completed');
  this.logger.info('Hello-World Workflow completed successfully');
}
```

**Pattern:** Minimal validation workflow with no steps, returns void

### Workflow Class Base Properties

From `/home/dustin/projects/groundswell/src/core/workflow.ts`:

```typescript
class Workflow<T = unknown> {
  readonly id: string;
  parent: Workflow | null;
  children: Workflow[];
  status: WorkflowStatus;

  constructor(name?: string, parent?: Workflow);

  run(...args: unknown[]): Promise<T | WorkflowResult<T>>;

  protected setStatus(status: WorkflowStatus): void;
  protected readonly logger: WorkflowLogger;

  addObserver(observer: WorkflowObserver): void;
  removeObserver(observer: WorkflowObserver): void;
  attachChild(child: Workflow): void;
  snapshotState(): void;
  getNode(): WorkflowNode;
  emitEvent(event: WorkflowEvent): void;
}
```

### Status Lifecycle

```
idle -> running -> completed
                -> failed
                -> cancelled
```

---

## Loop and Iteration Patterns

### Pattern 1: While Loop with Safety Limit (Primary)

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts:497-534`

```typescript
async executeBacklog(): Promise<void> {
  this.logger.info('[PRPPipeline] Executing backlog');

  try {
    let iterations = 0;
    const maxIterations = 10000; // Safety limit

    // Process items until queue is empty or shutdown requested
    while (await this.taskOrchestrator.processNextItem()) {
      iterations++;

      // Safety check
      if (iterations > maxIterations) {
        throw new Error(`Execution exceeded ${maxIterations} iterations`);
      }

      // Update completed tasks count
      this.completedTasks = this.#countCompletedTasks();

      // Check for shutdown request after each task
      if (this.shutdownRequested) {
        this.logger.info(
          '[PRPPipeline] Shutdown requested, finishing current task'
        );
        this.logger.info(
          `[PRPPipeline] Completed ${this.completedTasks}/${this.totalTasks} tasks before shutdown`
        );
        this.currentPhase = 'shutdown_interrupted';
        break;
      }

      // Log progress every 10 items
      if (iterations % 10 === 0) {
        this.logger.info(
          `[PRPPipeline] Processed ${iterations} items, ${this.completedTasks}/${this.totalTasks} tasks complete`
        );
      }
    }

    // Only log "complete" if not interrupted
    if (!this.shutdownRequested) {
      this.logger.info(`[PRPPipeline] Processed ${iterations} items total`);

      // Final counts
      this.completedTasks = this.#countCompletedTasks();
      const failedTasks = this.#countFailedTasks();

      this.logger.info(`[PRPPipeline] Complete: ${this.completedTasks}`);
      this.logger.info(`[PRPPipeline] Failed: ${failedTasks}`);

      this.currentPhase = 'backlog_complete';
      this.logger.info('[PRPPipeline] Backlog execution complete');
    }
  } catch (error) {
    this.logger.error(`[PRPPipeline] Backlog execution failed: ${error}`);
    throw error;
  }
}
```

**Key Features:**

1. **Condition:** `while (await orchestrator.processNextItem())` - continues until queue empty
2. **Safety Limit:** `maxIterations = 10000` prevents infinite loops
3. **Graceful Shutdown:** Checks `shutdownRequested` flag after each iteration
4. **Progress Logging:** Logs every 10 iterations
5. **State Updates:** Updates `completedTasks` count after each item

### Pattern 2: Retry Loop with Exponential Backoff

**File:** `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts:264-300`

```typescript
while (fixAttempts <= maxFixAttempts) {
  validationResults = await this.#runValidationGates(prp);

  // Check if all gates passed
  const allPassed = validationResults.every(r => r.success || r.skipped);

  if (allPassed) {
    break; // Success!
  }

  // If we have more fix attempts available
  if (fixAttempts < maxFixAttempts) {
    fixAttempts++;

    this.logger.warn(
      `[PRPRuntime] Validation failed, attempting fix (${fixAttempts}/${maxFixAttempts})`
    );

    // Generate fix PRP
    const fixPRP = await this.#generateFixPRP(prp, validationResults);

    // Execute fix PRP
    await this.#executeFixPRP(fixPRP);

    // Continue loop to re-validate
  } else {
    // Max attempts reached
    this.logger.error(
      `[PRPRuntime] Max fix attempts (${maxFixAttempts}) reached, validation failed`
    );
    break;
  }
}
```

**Key Features:**

1. **Retry Counter:** `fixAttempts` tracks retry count
2. **Success Condition:** `break` when `allPassed` is true
3. **Max Attempts:** `maxFixAttempts` prevents infinite retries
4. **Backoff Logic:** Each iteration generates and executes a fix PRP
5. **Logging:** Warns on each retry attempt, errors on max attempts reached

### Pattern 3: Polling Loop with Timeout

**File:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts:315-325`

```typescript
async waitForDependencies(subtask: Subtask): Promise<void> {
  const startTime = Date.now();
  const timeout = 30000; // 30 seconds

  while (Date.now() - startTime < timeout) {
    // Refresh backlog to get latest status
    await this.#refreshBacklog();

    // Check if dependencies are complete
    if (this.canExecute(subtask)) {
      console.log(
        `[TaskOrchestrator] Dependencies complete for ${subtask.id}`
      );
      return;
    }

    // Wait before checking again
    await sleep(100);
  }

  throw new Error(`Timeout waiting for dependencies of ${subtask.id}`);
}
```

**Key Features:**

1. **Timeout:** `Date.now() - startTime < timeout` prevents infinite polling
2. **Refresh:** `await this.#refreshBacklog()` gets latest status
3. **Condition:** `if (this.canExecute(subtask))` checks completion
4. **Delay:** `await sleep(100)` prevents busy-waiting
5. **Error on Timeout:** Throws error if dependencies not complete within timeout

### Loop Pattern Summary

| Pattern      | Use Case                     | Termination                      | Safety Mechanism |
| ------------ | ---------------------------- | -------------------------------- | ---------------- |
| While Loop   | Processing queue items       | Queue empty / shutdown requested | Max iterations   |
| Retry Loop   | Fixing validation failures   | All gates passed                 | Max attempts     |
| Polling Loop | Waiting for async conditions | Condition met / timeout          | Timeout duration |

**Best Practices:**

1. **Always include safety limits** (max iterations, max attempts, timeout)
2. **Log progress** at regular intervals (every N iterations)
3. **Update state** during loop (counts, phase flags)
4. **Support graceful shutdown** via flag checking
5. **Use `await` in conditions** for async predicates

---

## Error Handling Patterns

### Pattern 1: Try-Catch with setStatus('failed')

**File:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts:296-302`

```typescript
async run(): Promise<TestResults> {
  this.setStatus('running');
  this.logger.info('[BugHuntWorkflow] Starting bug hunt workflow');

  try {
    await this.analyzeScope();
    await this.creativeE2ETesting();
    await this.adversarialTesting();
    const results = await this.generateReport();

    this.setStatus('completed');
    return results;
  } catch (error) {
    // PATTERN: Set status to failed on error
    this.setStatus('failed');
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error('[BugHuntWorkflow] Bug hunt workflow failed', { error: errorMessage });
    throw error;
  }
}
```

**Key Features:**

1. Set `status = 'failed'` immediately in catch block
2. Extract error message safely with `instanceof Error` check
3. Log error with context
4. Re-throw error for upstream handling

### Pattern 2: Non-Fatal Error Handling (Log and Continue)

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts:594-598`

```typescript
async runQACycle(): Promise<void> {
  try {
    // ... QA logic
  } catch (error) {
    // QA failure is non-fatal - log and continue
    this.logger.warn(`[PRPPipeline] QA cycle failed (non-fatal): ${error}`);
    this.#bugsFound = 0;
  }
}
```

**Key Features:**

1. Log with `warn` level (not `error`)
2. Set default values on failure
3. Do NOT re-throw error
4. Allow workflow to continue

### Pattern 3: Cleanup Failures (Never Throw)

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts:661-664`

```typescript
@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  try {
    // ... cleanup logic
  } catch (error) {
    // Log but don't throw - cleanup failures shouldn't prevent shutdown
    this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
  }
}
```

**Key Features:**

1. Catch ALL errors in cleanup
2. Log but NEVER throw
3. Allow shutdown to proceed
4. Used in finally blocks

### Pattern 4: Error Enrichment with Context

**File:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts:249-253`

```typescript
@Step({ trackTiming: true })
async generateReport(): Promise<TestResults> {
  try {
    const qaAgent = createQAAgent();
    const prompt = createBugHuntPrompt(this.prdContent, this.completedTasks);
    const results = (await qaAgent.prompt(prompt)) as TestResults;

    this.testResults = results;
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error('[BugHuntWorkflow] Failed to generate bug report', { error: errorMessage });
    throw new Error(`Bug report generation failed: ${errorMessage}`);
  }
}
```

**Key Features:**

1. Extract original error message
2. Log with context (function name)
3. Wrap in new Error with descriptive message
4. Preserve original error in new error

### Pattern 5: Input Validation in Constructor

**File:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts:73-83`

```typescript
constructor(prdContent: string, completedTasks: Task[]) {
  super('BugHuntWorkflow');

  // PATTERN: Input validation in constructor
  if (typeof prdContent !== 'string' || prdContent.trim() === '') {
    throw new Error('prdContent must be a non-empty string');
  }

  if (!Array.isArray(completedTasks)) {
    throw new Error('completedTasks must be an array');
  }

  // Initialize @ObservedState properties
  this.prdContent = prdContent;
  this.completedTasks = completedTasks;

  this.logger.info('[BugHuntWorkflow] Initialized', {
    prdLength: prdContent.length,
    tasksCount: completedTasks.length,
  });
}
```

**Key Features:**

1. Validate inputs immediately
2. Throw descriptive errors
3. Log initialization with context
4. Initialize state after validation

### Automatic Error Enrichment by @Step

From `/home/dustin/projects/groundswell/src/decorators/step.ts:109-134`:

```typescript
try {
  const result = await runInContext(executionContext, async () => {
    return originalMethod.call(this, ...args);
  });
  // ...
} catch (err: unknown) {
  // Create rich error with context
  const error = err as Error;
  const snap = getObservedState(this as object); // AUTOMATIC STATE CAPTURE

  const workflowError: WorkflowError = {
    message: error?.message ?? 'Unknown error',
    original: err,
    workflowId: wf.id,
    stack: error?.stack,
    state: snap, // <-- STATE SNAPSHOT INCLUDED AUTOMATICALLY
    logs: [...wf.node.logs] as LogEntry[], // <-- LOGS INCLUDED AUTOMATICALLY
  };

  wf.emitEvent({ type: 'error', node: wf.node, error: workflowError });
  throw workflowError;
}
```

**Key Benefit:** All @Step methods automatically capture state and logs on error, providing full debugging context.

---

## Complete Workflow Examples

### Example 1: BugHuntWorkflow (Full Production Workflow)

**File:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`

```typescript
import { Workflow, Step, ObservedState } from 'groundswell';
import type { Task, TestResults } from '../core/models.js';
import { createQAAgent } from '../agents/agent-factory.js';
import { createBugHuntPrompt } from '../agents/prompts/bug-hunt-prompt.js';

export class BugHuntWorkflow extends Workflow {
  // ========================================================================
  // Public Observed State Fields (tracked by Groundswell)
  // ========================================================================

  @ObservedState()
  prdContent: string;

  @ObservedState()
  completedTasks: Task[];

  @ObservedState()
  testResults: TestResults | null = null;

  // ========================================================================
  // Constructor
  // ========================================================================

  constructor(prdContent: string, completedTasks: Task[]) {
    super('BugHuntWorkflow');

    // Input validation
    if (typeof prdContent !== 'string' || prdContent.trim() === '') {
      throw new Error('prdContent must be a non-empty string');
    }

    if (!Array.isArray(completedTasks)) {
      throw new Error('completedTasks must be an array');
    }

    this.prdContent = prdContent;
    this.completedTasks = completedTasks;

    this.logger.info('[BugHuntWorkflow] Initialized', {
      prdLength: prdContent.length,
      tasksCount: completedTasks.length,
    });
  }

  // ========================================================================
  // Step Methods
  // ========================================================================

  @Step({ trackTiming: true })
  async analyzeScope(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 1: Scope Analysis');
    this.logger.info('[BugHuntWorkflow] Analyzing PRD requirements...', {
      prdLength: this.prdContent.length,
    });

    this.logger.info('[BugHuntWorkflow] Completed tasks for testing:', {
      count: this.completedTasks.length,
      tasks: this.completedTasks.map(t => `${t.id}: ${t.title}`),
    });

    this.logger.info(
      '[BugHuntWorkflow] Scope analysis complete - QA context established'
    );
  }

  @Step({ trackTiming: true })
  async creativeE2ETesting(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 2: Creative E2E Testing');

    const testCategories = [
      'Happy Path Testing',
      'Edge Case Testing',
      'Workflow Testing',
      'Integration Testing',
      'Error Handling',
      'State Testing',
      'Concurrency Testing',
      'Regression Testing',
    ];

    this.logger.info('[BugHuntWorkflow] E2E test categories:', testCategories);
    this.logger.info(
      '[BugHuntWorkflow] E2E testing scenarios defined - awaiting QA agent execution'
    );
  }

  @Step({ trackTiming: true })
  async adversarialTesting(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 3: Adversarial Testing');

    const adversarialCategories = [
      'Unexpected Inputs',
      'Missing Features',
      'Incomplete Features',
      'Implicit Requirements',
      'User Experience Issues',
      'Security Concerns',
      'Performance Issues',
    ];

    this.logger.info(
      '[BugHuntWorkflow] Adversarial test categories:',
      adversarialCategories
    );
    this.logger.info(
      '[BugHuntWorkflow] Adversarial testing scenarios defined - awaiting QA agent execution'
    );
  }

  @Step({ trackTiming: true })
  async generateReport(): Promise<TestResults> {
    this.logger.info('[BugHuntWorkflow] Phase 4: Generating Bug Report');

    try {
      const qaAgent = createQAAgent();
      this.logger.info('[BugHuntWorkflow] QA agent created');

      const prompt = createBugHuntPrompt(this.prdContent, this.completedTasks);
      this.logger.info('[BugHuntWorkflow] Bug hunt prompt created');

      const results = (await qaAgent.prompt(prompt)) as TestResults;

      this.testResults = results;

      this.logger.info('[BugHuntWorkflow] Bug report generated', {
        hasBugs: results.hasBugs,
        bugCount: results.bugs.length,
        criticalCount: results.bugs.filter(b => b.severity === 'critical')
          .length,
        majorCount: results.bugs.filter(b => b.severity === 'major').length,
        minorCount: results.bugs.filter(b => b.severity === 'minor').length,
        cosmeticCount: results.bugs.filter(b => b.severity === 'cosmetic')
          .length,
      });

      this.logger.info(`[BugHuntWorkflow] Summary: ${results.summary}`);
      this.logger.info(
        '[BugHuntWorkflow] Recommendations:',
        results.recommendations
      );

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('[BugHuntWorkflow] Failed to generate bug report', {
        error: errorMessage,
      });
      throw new Error(`Bug report generation failed: ${errorMessage}`);
    }
  }

  // ========================================================================
  // Main Entry Point
  // ========================================================================

  async run(): Promise<TestResults> {
    this.setStatus('running');
    this.logger.info('[BugHuntWorkflow] Starting bug hunt workflow');

    try {
      await this.analyzeScope();
      await this.creativeE2ETesting();
      await this.adversarialTesting();

      const results = await this.generateReport();

      this.setStatus('completed');
      this.logger.info(
        '[BugHuntWorkflow] Bug hunt workflow completed successfully',
        {
          hasBugs: results.hasBugs,
          bugCount: results.bugs.length,
        }
      );

      return results;
    } catch (error) {
      this.setStatus('failed');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('[BugHuntWorkflow] Bug hunt workflow failed', {
        error: errorMessage,
      });
      throw error;
    }
  }
}
```

### Example 2: DeltaAnalysisWorkflow (Single-Step Workflow)

**File:** `/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts`

```typescript
import { Workflow, Step } from 'groundswell';
import type { DeltaAnalysis } from '../core/models.js';
import { createQAAgent } from '../agents/agent-factory.js';
import { createDeltaAnalysisPrompt } from '../agents/prompts/delta-analysis-prompt.js';

export class DeltaAnalysisWorkflow extends Workflow {
  // ========================================================================
  // Public State Fields (observable via Groundswell Workflow base)
  // ========================================================================

  oldPRD: string;
  newPRD: string;
  completedTasks: string[];
  deltaAnalysis: DeltaAnalysis | null = null;

  // ========================================================================
  // Constructor
  // ========================================================================

  constructor(oldPRD: string, newPRD: string, completedTasks: string[]) {
    super('DeltaAnalysisWorkflow');

    if (!oldPRD || oldPRD.trim() === '') {
      throw new Error('oldPRD cannot be empty');
    }

    if (!newPRD || newPRD.trim() === '') {
      throw new Error('newPRD cannot be empty');
    }

    this.oldPRD = oldPRD;
    this.newPRD = newPRD;
    this.completedTasks = completedTasks;
  }

  // ========================================================================
  // Step Methods
  // ========================================================================

  @Step({ trackTiming: true })
  async analyzeDelta(): Promise<DeltaAnalysis> {
    this.logger.info('[DeltaAnalysisWorkflow] Starting delta analysis');

    try {
      const qaAgent = createQAAgent();
      const prompt = createDeltaAnalysisPrompt(
        this.oldPRD,
        this.newPRD,
        this.completedTasks
      );

      const result = (await qaAgent.prompt(prompt)) as DeltaAnalysis;

      this.deltaAnalysis = result;

      this.logger.info('[DeltaAnalysisWorkflow] Analysis complete');
      this.logger.info(
        `[DeltaAnalysisWorkflow] Found ${result.changes.length} changes`
      );
      this.logger.info(
        `[DeltaAnalysisWorkflow] Affected tasks: ${result.taskIds.length}`
      );

      return result;
    } catch (error) {
      this.logger.error(`[DeltaAnalysisWorkflow] Analysis failed: ${error}`);
      throw error;
    }
  }

  // ========================================================================
  // Main Entry Point
  // ========================================================================

  async run(): Promise<DeltaAnalysis> {
    this.setStatus('running');

    this.logger.info('[DeltaAnalysisWorkflow] Starting workflow');
    this.logger.info('[DeltaAnalysisWorkflow] Comparing PRD versions');
    this.logger.info(
      `[DeltaAnalysisWorkflow] Completed tasks to preserve: ${this.completedTasks.length}`
    );

    const analysis = await this.analyzeDelta();

    this.setStatus('completed');

    this.logger.info('[DeltaAnalysisWorkflow] Workflow completed');

    return analysis;
  }
}
```

### Example 3: HelloWorldWorkflow (Minimal Validation Workflow)

**File:** `/home/dustin/projects/hacky-hack/src/workflows/hello-world.ts`

```typescript
import { Workflow } from 'groundswell';

export class HelloWorldWorkflow extends Workflow {
  async run(): Promise<void> {
    this.setStatus('running');
    this.logger.info('Starting Hello-World Workflow');

    this.logger.info('PRP Pipeline initialized');

    this.setStatus('completed');
    this.logger.info('Hello-World Workflow completed successfully');
  }
}
```

---

## Groundswell API Reference

### Main Exports

From `/home/dustin/projects/groundswell/src/index.ts`:

```typescript
// Core classes
export { Workflow } from './core/workflow.js';
export { Agent } from './core/agent.js';
export { Prompt } from './core/prompt.js';
export { MCPHandler } from './core/mcp-handler.js';

// Decorators
export { Step } from './decorators/step.js';
export { Task } from './decorators/task.js';
export {
  ObservedState,
  getObservedState,
} from './decorators/observed-state.js';

// Factory functions
export {
  createWorkflow,
  createAgent,
  createPrompt,
  quickWorkflow,
  quickAgent,
} from './core/factory.js';

// Debugger
export { WorkflowTreeDebugger } from './debugger/tree-debugger.js';

// Utilities
export { Observable } from './utils/observable.js';
export { generateId } from './utils/id.js';

// Cache
export { LLMCache, defaultCache } from './cache/cache.js';
export { generateCacheKey } from './cache/cache-key.js';

// Reflection
export {
  ReflectionManager,
  executeWithReflection,
} from './reflection/reflection.js';

// Introspection Tools
export {
  INTROSPECTION_TOOLS,
  inspectCurrentNodeTool,
  readAncestorChainTool,
  // ... more introspection tools
} from './tools/introspection.js';
```

### Workflow Status Values

```typescript
type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
```

### StepOptions Interface

```typescript
interface StepOptions {
  name?: string; // Custom step name (defaults to method name)
  snapshotState?: boolean; // Capture state snapshot after step completion
  trackTiming?: boolean; // Track and emit step duration (default: true)
  logStart?: boolean; // Log message when step starts
  logFinish?: boolean; // Log message when step completes
}
```

### StateFieldMetadata Interface

```typescript
interface StateFieldMetadata {
  hidden?: boolean; // Exclude field from snapshots entirely
  redact?: boolean; // Show value as '***' in snapshots
}
```

### WorkflowError Interface

```typescript
interface WorkflowError {
  message: string; // Error message
  original: unknown; // Original error object
  workflowId: string; // Workflow ID
  stack?: string; // Stack trace
  state: Record<string, unknown>; // State snapshot at error time
  logs: LogEntry[]; // Logs up to error
}
```

### WorkflowLogger Methods

```typescript
this.logger.debug(message: string, data?: unknown): void;
this.logger.info(message: string, data?: unknown): void;
this.logger.warn(message: string, data?: unknown): void;
this.logger.error(message: string, data?: unknown): void;
```

### Workflow Class Methods

```typescript
class Workflow {
  readonly id: string;
  parent: Workflow | null;
  children: Workflow[];
  status: WorkflowStatus;

  constructor(name?: string, parent?: Workflow);

  run(...args: unknown[]): Promise<T | WorkflowResult<T>>;

  protected setStatus(status: WorkflowStatus): void;
  protected readonly logger: WorkflowLogger;

  addObserver(observer: WorkflowObserver): void;
  removeObserver(observer: WorkflowObserver): void;
  attachChild(child: Workflow): void;
  snapshotState(): void;
  getNode(): WorkflowNode;
  emitEvent(event: WorkflowEvent): void;
}
```

### Event Types

```typescript
type WorkflowEvent =
  | { type: 'stepStart'; node: WorkflowNode; step: string }
  | { type: 'stepEnd'; node: WorkflowNode; step: string; duration: number }
  | { type: 'taskStart'; node: WorkflowNode; task: string }
  | { type: 'taskEnd'; node: WorkflowNode; task: string }
  | { type: 'childAttached'; node: WorkflowNode; child: Workflow }
  | { type: 'stateSnapshot'; node: WorkflowNode }
  | { type: 'error'; node: WorkflowNode; error: WorkflowError }
  | { type: 'treeUpdated'; root: WorkflowNode };
```

---

## Summary and Recommendations

### Current Patterns in Use

1. **@Step Decorator:**
   - Always uses `trackTiming: true` (7/7 instances)
   - Uses `name` option once for clarity
   - Never uses `snapshotState`, `logStart`, or `logFinish`

2. **@ObservedState Decorator:**
   - Used inconsistently (BugHuntWorkflow uses it, others don't)
   - Never uses `redact` or `hidden` options
   - Documents state fields in comments

3. **Workflow Structure:**
   - Consistent run() pattern across all workflows
   - Always sets status and logs
   - Error handling with setStatus('failed')
   - Some use finally blocks for cleanup

4. **Loop Patterns:**
   - While loops with safety limits
   - Retry loops with exponential backoff
   - Polling loops with timeout

### Recommendations

1. **Add @ObservedState Decorators:**
   - Apply to PRPPipeline and DeltaAnalysisWorkflow state fields
   - Consider adding `redact: true` for sensitive fields

2. **Use More @Step Options:**
   - Add `logStart: true, logFinish: true` to critical steps
   - Consider `snapshotState: true` for steps that modify important state

3. **Consistent Error Handling:**
   - Use try-catch in all @Step methods
   - Always log errors with context
   - Re-throw enriched errors

4. **Loop Safety:**
   - Always include max iterations/timeout
   - Log progress at regular intervals
   - Support graceful shutdown

5. **Documentation:**
   - Add JSDoc comments to all @Step methods
   - Document return types and error conditions
   - Include usage examples

---

## References

### Groundswell Documentation

- **Workflow Docs:** `/home/dustin/projects/groundswell/docs/workflow.md`
- **Agent Docs:** `/home/dustin/projects/groundswell/docs/agent.md`
- **Prompt Docs:** `/home/dustin/projects/groundswell/docs/prompt.md`

### Groundswell Source Code

- **Step Decorator:** `/home/dustin/projects/groundswell/src/decorators/step.ts`
- **ObservedState Decorator:** `/home/dustin/projects/groundswell/src/decorators/observed-state.ts`
- **Workflow Class:** `/home/dustin/projects/groundswell/src/core/workflow.ts`
- **Types:** `/home/dustin/projects/groundswell/src/types/`

### Codebase Examples

- **PRPPipeline:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`
- **BugHuntWorkflow:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`
- **DeltaAnalysisWorkflow:** `/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts`
- **HelloWorldWorkflow:** `/home/dustin/projects/hacky-hack/src/workflows/hello-world.ts`

### Existing Research

- **Groundswell API Reference:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md`
- **Groundswell Docs Research:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T3S2/research/groundswell_docs.md`

---

**Document Version:** 1.0
**Last Updated:** 2026-01-13
**Researcher:** Claude (Anthropic)
**Project:** hacky-hack PRP Pipeline
