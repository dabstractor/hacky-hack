# Research: Iteration and Loop Patterns in TypeScript/JavaScript Workflows

**Date:** 2026-01-13
**Purpose:** Research async iteration patterns for fix cycle implementation (P4.M3.T1.S2)
**Focus:** Fix cycle iteration with state tracking, max iteration guards, and completion conditions

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Existing Loop Patterns in Codebase](#existing-loop-patterns-in-codebase)
3. [Async While Loop Patterns](#async-while-loop-patterns)
4. [State Tracking Patterns](#state-tracking-patterns)
5. [Max Iteration Guards](#max-iteration-guards)
6. [Completion Conditions](#completion-conditions)
7. [Progress Logging](#progress-logging)
8. [Retry Patterns](#retry-patterns)
9. [TypeScript Patterns for Iteration](#typescript-patterns-for-iteration)
10. [Recommended Patterns for Fix Cycle](#recommended-patterns-for-fix-cycle)

---

## Executive Summary

This research documents iteration and loop patterns found in the codebase that can be applied to fix cycle implementation. The codebase demonstrates several成熟 patterns for async iteration with state tracking, including:

1. **While loops with max iteration guards** - Used in PRPPipeline and PRPExecutor
2. **@ObservedState decorator** - Groundswell framework for observable state tracking
3. **Incremental counter tracking** - Iteration counters with safety limits
4. **Break conditions** - Multiple completion condition patterns
5. **Progress logging** - Structured logging at intervals
6. **Retry loops with exponential backoff** - Fix-and-retry patterns in PRPExecutor

These patterns provide a solid foundation for implementing the fix cycle workflow.

---

## Existing Loop Patterns in Codebase

### 1. PRPPipeline.executeBacklog() - Main Backlog Processing Loop

**Location:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` (lines 497-554)

**Pattern:** Async while loop with max iteration guard and shutdown support

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

- ✅ Max iteration guard (10000 iterations)
- ✅ Iteration counter tracking
- ✅ Periodic progress logging (every 10 iterations)
- ✅ Graceful shutdown support
- ✅ State field updates (`this.completedTasks`)
- ✅ Phase tracking (`this.currentPhase`)
- ✅ Comprehensive error handling

**Applicability to Fix Cycle:** HIGH - This is the primary pattern to follow for fix cycle iteration.

---

### 2. PRPExecutor.execute() - Fix-and-Retry Loop

**Location:** `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts` (lines 231-313)

**Pattern:** While loop with fix attempts and exponential backoff

```typescript
async execute(prp: PRPDocument, prpPath: string): Promise<ExecutionResult> {
  let fixAttempts = 0;
  const maxFixAttempts = 2;

  // STEP 1: Inject PRP path into prompt
  const injectedPrompt = PRP_BUILDER_PROMPT.replace(
    /\$PRP_FILE_PATH/g,
    prpPath
  );

  try {
    // STEP 2: Execute Coder Agent
    console.log(`Executing PRP for ${prp.taskId}...`);
    const coderResponse = await this.#coderAgent.prompt(injectedPrompt);

    // STEP 3: Parse JSON result
    const coderResult = this.#parseCoderResult(coderResponse as string);

    // If Coder Agent reported error, return failed result
    if (coderResult.result !== 'success') {
      return {
        success: false,
        validationResults: [],
        artifacts: [],
        error: coderResult.message,
        fixAttempts: 0,
      };
    }

    // STEP 4: Run validation gates with fix-and-retry
    let validationResults: ValidationGateResult[] = [];

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
        const delay = Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000);
        console.warn(
          `Validation failed for ${prp.taskId}. ` +
            `Fix attempt ${fixAttempts}/${maxFixAttempts} in ${delay}ms...`
        );
        await this.#sleep(delay);

        // Trigger fix attempt
        await this.#fixAndRetry(prp, validationResults, fixAttempts);
      } else {
        break; // Exhausted fix attempts
      }
    }

    // STEP 5: Build final result
    const allPassed = validationResults.every(r => r.success || r.skipped);

    return {
      success: allPassed,
      validationResults,
      artifacts: [],
      error: allPassed
        ? undefined
        : 'Validation failed after all fix attempts',
      fixAttempts,
    };
  } catch (error) {
    return {
      success: false,
      validationResults: [],
      artifacts: [],
      error: error instanceof Error ? error.message : String(error),
      fixAttempts,
    };
  }
}
```

**Key Features:**

- ✅ Fix attempt counter with max limit
- ✅ Exponential backoff delay (2^n with max 30s)
- ✅ Break on success condition
- ✅ Detailed logging per attempt
- ✅ State tracking in return value (`fixAttempts`)
- ✅ Conditional retry logic
- ✅ Error context passed to retry

**Applicability to Fix Cycle:** HIGH - Excellent pattern for validation retry loops.

---

### 3. TaskOrchestrator.waitForDependencies() - Polling Loop with Timeout

**Location:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` (lines 305-340)

**Pattern:** While loop with timeout-based polling

```typescript
public async waitForDependencies(
  subtask: Subtask,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  // PATTERN: Default values with destructuring
  const { timeout = 30000, interval = 1000 } = options;

  const startTime = Date.now();

  // PATTERN: Polling loop with timeout
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

    // Log waiting status
    const blockers = this.getBlockingDependencies(subtask);
    const blockerIds = blockers.map(b => b.id).join(', ');
    console.log(`[TaskOrchestrator] Waiting for dependencies: ${blockerIds}`);

    // Sleep for interval
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // PATTERN: Throw descriptive error on timeout
  throw new Error(
    `Timeout waiting for dependencies of ${subtask.id} after ${timeout}ms`
  );
}
```

**Key Features:**

- ✅ Time-based timeout (Date.now() comparison)
- ✅ Configurable timeout and interval
- ✅ Condition checking with early return
- ✅ Status logging during wait
- ✅ Descriptive error on timeout

**Applicability to Fix Cycle:** MEDIUM - Good pattern for time-based iteration limits.

---

### 4. ReAct Agent - Research Code Example

**Location:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/research_code_examples.ts` (lines 102-158)

**Pattern:** While loop with max iterations and completion detection

```typescript
async execute<T>(input: string): Promise<AgentResult<T>> {
  const startTime = Date.now();
  let attempts = 0;
  const steps: ReActStep[] = [];

  try {
    let currentInput = input;
    let iteration = 0;

    while (iteration < this.config.maxIterations) {
      attempts++;

      // Reasoning step
      const thought = await this.generateThought(currentInput, steps);
      steps.push({ thought });

      // Check if we should stop
      if (this.shouldStop(thought)) {
        break;
      }

      // Action step
      const action = await this.planAction(thought);
      steps.push({ action });

      // Execute action
      const observation = await this.executeAction(action);
      steps.push({ observation });

      currentInput = this.updateContext(currentInput, observation);
      iteration++;
    }

    const result = this.synthesizeResult(steps);

    return {
      success: true,
      data: result as T,
      metadata: {
        attempts,
        duration: Date.now() - startTime,
        tokenUsage: this.calculateTokenUsage(steps)
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error as Error,
      metadata: {
        attempts,
        duration: Date.now() - startTime,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      }
    };
  }
}

private shouldStop(thought: string): boolean {
  return thought.toLowerCase().includes('done') ||
         thought.toLowerCase().includes('complete') ||
         thought.toLowerCase().includes('final answer');
}
```

**Key Features:**

- ✅ Max iterations from config
- ✅ Completion condition detection (`shouldStop()`)
- ✅ State accumulation (steps array)
- ✅ Metadata tracking (attempts, duration)
- ✅ Context update across iterations
- ✅ Early break on completion

**Applicability to Fix Cycle:** HIGH - Excellent pattern for completion detection and state tracking.

---

### 5. Plan-and-Execute Agent - Dependency-Based Execution

**Location:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/research_code_examples.ts` (lines 397-430)

**Pattern:** While loop with dependency satisfaction

```typescript
private async executePlan(plan: ExecutionPlan): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  const completed = new Set<string>();

  // Execute steps in dependency order
  while (completed.size < plan.steps.length) {
    const readySteps = plan.steps.filter(step =>
      step.status === 'pending' &&
      step.dependencies.every(dep => completed.has(dep))
    );

    if (readySteps.length === 0 && completed.size < plan.steps.length) {
      throw new Error('No executable steps found - possible deadlock');
    }

    // Execute ready steps in parallel
    await Promise.all(
      readySteps.map(async (step) => {
        step.status = 'in_progress';
        try {
          step.result = await this.executeStep(step, results);
          step.status = 'completed';
          completed.add(step.id);
          results.set(step.id, step.result);
        } catch (error) {
          step.status = 'failed';
          throw error;
        }
      })
    );
  }

  return results;
}
```

**Key Features:**

- ✅ Completion based on count (completed.size < plan.steps.length)
- ✅ Dependency filtering per iteration
- ✅ Deadlock detection
- ✅ Parallel execution of ready steps
- ✅ Status tracking per step
- ✅ Result accumulation

**Applicability to Fix Cycle:** MEDIUM - Good pattern for dependency-based iteration, though fix cycle is simpler.

---

## Async While Loop Patterns

### Pattern 1: Basic Async While with Condition

```typescript
// Simple condition-based loop
while (await conditionCheck()) {
  // Do work
  await doWork();
}

// Example from codebase
while (await this.taskOrchestrator.processNextItem()) {
  iterations++;
  // ... process item
}
```

### Pattern 2: Async While with Counter Guard

```typescript
let iterations = 0;
const maxIterations = 100;

while (iterations < maxIterations && (await conditionCheck())) {
  await doWork();
  iterations++;
}

// Or with post-increment check
while (await conditionCheck()) {
  iterations++;
  if (iterations > maxIterations) {
    throw new Error(`Exceeded ${maxIterations} iterations`);
  }
}
```

### Pattern 3: Async While with Timeout

```typescript
const startTime = Date.now();
const timeout = 30000; // 30 seconds

while (Date.now() - startTime < timeout) {
  const ready = await checkCondition();
  if (ready) break;
  await sleep(1000);
}

if (Date.now() - startTime >= timeout) {
  throw new Error('Timeout exceeded');
}
```

---

## State Tracking Patterns

### Pattern 1: @ObservedState Decorator (Groundswell)

**Best Practice:** Use Groundswell's `@ObservedState()` decorator for workflow state fields.

```typescript
import { Workflow, ObservedState } from 'groundswell';

export class FixCycleWorkflow extends Workflow {
  /** Number of fix attempts made */
  @ObservedState()
  fixAttempts: number = 0;

  /** Current bug being fixed */
  @ObservedState()
  currentBug: Bug | null = null;

  /** Fix cycle results */
  @ObservedState()
  fixResults: FixResult[] = [];
}
```

**Benefits:**

- Automatic state snapshots by Groundswell
- Observable in UI/monitoring tools
- Tracked across workflow execution
- Type-safe with TypeScript

### Pattern 2: Public State Fields

```typescript
export class PRPPipeline extends Workflow {
  // Public fields are observable by Groundswell
  sessionManager: SessionManager;
  taskOrchestrator: TaskOrchestrator;
  currentPhase: string = 'init';
  totalTasks: number = 0;
  completedTasks: number = 0;
  shutdownRequested: boolean = false;
  currentTaskId: string | null = null;
}
```

**Key Points:**

- Public fields in Workflow subclasses are automatically observed
- No decorator needed (Groundswell convention)
- Use descriptive names for observability

### Pattern 3: Counter Accumulation

```typescript
// Increment counter
this.completedTasks = this.#countCompletedTasks();

// Or increment directly
iterations++;

// Track in result object
return {
  success: true,
  fixAttempts: iterations,
  // ...
};
```

### Pattern 4: Array State Accumulation

```typescript
const steps: ReActStep[] = [];

while (iteration < maxIterations) {
  const thought = await this.generateThought(input, steps);
  steps.push({ thought }); // Accumulate state

  if (this.shouldStop(thought)) {
    break;
  }

  iteration++;
}

return { steps, finalAnswer: steps[steps.length - 1].thought };
```

---

## Max Iteration Guards

### Pattern 1: Counter-Based Guard

```typescript
let iterations = 0;
const maxIterations = 10000;

while (await condition()) {
  iterations++;

  if (iterations > maxIterations) {
    throw new Error(`Execution exceeded ${maxIterations} iterations`);
  }

  // Do work
}
```

**From:** PRPPipeline.executeBacklog()

### Pattern 2: Pre-Check Guard

```typescript
let iterations = 0;
const maxIterations = 100;

while (iterations < maxIterations && (await condition())) {
  await doWork();
  iterations++;
}

// After loop
if (iterations >= maxIterations) {
  throw new Error('Max iterations reached');
}
```

### Pattern 3: Configurable Max Iterations

```typescript
interface FixCycleConfig {
  maxFixAttempts: number;
  maxBugsToFix: number;
}

class FixCycleWorkflow {
  #config: FixCycleConfig;

  constructor(config: FixCycleConfig) {
    this.#config = config;
  }

  async run(): Promise<void> {
    let fixAttempts = 0;

    while (fixAttempts <= this.#config.maxFixAttempts) {
      // ... fix logic
      fixAttempts++;
    }
  }
}
```

### Pattern 4: Dynamic Guard with State Check

```typescript
let iterations = 0;

while (iterations < maxIterations && !this.shutdownRequested) {
  if (await this.isComplete()) {
    break;
  }

  await doWork();
  iterations++;
}
```

---

## Completion Conditions

### Pattern 1: Boolean Flag

```typescript
while (await processNextItem()) {
  // processNextItem returns false when done
}
```

**From:** TaskOrchestrator.processNextItem()

### Pattern 2: Content-Based Detection

```typescript
private shouldStop(thought: string): boolean {
  return thought.toLowerCase().includes('done') ||
         thought.toLowerCase().includes('complete') ||
         thought.toLowerCase().includes('final answer');
}

while (iteration < maxIterations) {
  const thought = await generateThought();
  if (this.shouldStop(thought)) {
    break;
  }
  iteration++;
}
```

**From:** ReActAgent

### Pattern 3: Array Completion

```typescript
while (completed.size < plan.steps.length) {
  // Process steps
  if (allStepsComplete) {
    completed.add(stepId);
  }
}
```

**From:** PlanAndExecuteAgent

### Pattern 4: Multiple Conditions

```typescript
while (fixAttempts <= maxFixAttempts && !this.shutdownRequested) {
  const result = await fixAttempt();

  if (result.success) {
    break; // Success condition
  }

  if (result.cannotFix) {
    break; // Cannot proceed condition
  }

  fixAttempts++;
}
```

### Pattern 5: Empty Queue Detection

```typescript
async processNextItem(): Promise<boolean> {
  if (this.#executionQueue.length === 0) {
    console.log('[TaskOrchestrator] Execution queue empty - processing complete');
    return false;
  }

  // Process item
  return true;
}

// Usage
while (await this.taskOrchestrator.processNextItem()) {
  // Continue until queue empty
}
```

---

## Progress Logging

### Pattern 1: Periodic Logging

```typescript
// Log every N iterations
if (iterations % 10 === 0) {
  this.logger.info(
    `[Workflow] Processed ${iterations} items, ${this.completedTasks}/${this.totalTasks} tasks complete`
  );
}
```

**From:** PRPPipeline.executeBacklog()

### Pattern 2: Per-Iteration Logging

```typescript
while (fixAttempts <= maxFixAttempts) {
  console.warn(
    `Validation failed for ${taskId}. ` +
      `Fix attempt ${fixAttempts}/${maxFixAttempts} in ${delay}ms...`
  );

  await fixAndRetry();
  fixAttempts++;
}
```

**From:** PRPExecutor.execute()

### Pattern 3: Phase-Based Logging

```typescript
async executeSubtask(subtask: Subtask): Promise<void> {
  console.log(`[PRPRuntime] Starting execution for ${subtask.id}: ${subtask.title}`);

  // PHASE 1: Research
  console.log(`[PRPRuntime] Research Phase: ${subtask.id}`);
  const prp = await this.#generator.generate(subtask, backlog);
  console.log(`[PRPRuntime] PRP generated for ${subtask.id}`);

  // PHASE 2: Implementation
  console.log(`[PRPRuntime] Implementation Phase: ${subtask.id}`);
  const result = await this.#executor.execute(prp, prpPath);

  // PHASE 3: Complete
  console.log(`[PRPRuntime] Complete: ${subtask.id}`);
}
```

**From:** PRPRuntime.executeSubtask()

### Pattern 4: Structured Logging

```typescript
this.logger.info('[BugHuntWorkflow] Bug report generated', {
  hasBugs: results.hasBugs,
  bugCount: results.bugs.length,
  criticalCount: results.bugs.filter(b => b.severity === 'critical').length,
  majorCount: results.bugs.filter(b => b.severity === 'major').length,
  minorCount: results.bugs.filter(b => b.severity === 'minor').length,
  cosmeticCount: results.bugs.filter(b => b.severity === 'cosmetic').length,
});
```

**From:** BugHuntWorkflow.generateReport()

### Pattern 5: Summary Logging

```typescript
// After loop completes
if (!this.shutdownRequested) {
  this.logger.info(`[PRPPipeline] Processed ${iterations} items total`);
  this.completedTasks = this.#countCompletedTasks();
  const failedTasks = this.#countFailedTasks();

  this.logger.info(`[PRPPipeline] Complete: ${this.completedTasks}`);
  this.logger.info(`[PRPPipeline] Failed: ${failedTasks}`);
  this.currentPhase = 'backlog_complete';
}
```

---

## Retry Patterns

### Pattern 1: Simple Retry Loop

```typescript
let fixAttempts = 0;
const maxFixAttempts = 2;

while (fixAttempts <= maxFixAttempts) {
  const result = await attemptFix();

  if (result.success) {
    break; // Success!
  }

  if (fixAttempts < maxFixAttempts) {
    fixAttempts++;
    await retryFix();
  } else {
    break; // Exhausted attempts
  }
}
```

**From:** PRPExecutor.execute()

### Pattern 2: Retry with Exponential Backoff

```typescript
while (fixAttempts <= maxFixAttempts) {
  const result = await attemptOperation();

  if (result.success) {
    break;
  }

  if (fixAttempts < maxFixAttempts) {
    fixAttempts++;
    const delay = Math.min(baseDelay * Math.pow(2, fixAttempts - 1), maxDelay);
    console.warn(
      `Attempt ${fixAttempts}/${maxFixAttempts} failed. Retrying in ${delay}ms...`
    );
    await sleep(delay);

    await retryWithContext(errorContext);
  } else {
    break;
  }
}
```

**From:** PRPExecutor.execute()

**Formula:** `delay = min(baseDelay * 2^(attempt-1), maxDelay)`

Example with baseDelay=2000ms:

- Attempt 1: 2000ms
- Attempt 2: 4000ms
- Attempt 3: 8000ms
- ...

### Pattern 3: Retry with Error Context

```typescript
async #fixAndRetry(
  prp: PRPDocument,
  failedGates: ValidationGateResult[],
  attemptNumber: number
): Promise<void> {
  // Build error context
  const errorContext = failedGates
    .filter(g => !g.success && !g.skipped)
    .map(g => `
Level ${g.level}: ${g.description}
Command: ${g.command}
Exit Code: ${g.exitCode}
Output: ${g.stdout}
Error: ${g.stderr}
    `)
    .join('\n');

  // Create fix prompt with context
  const fixPrompt = `
The previous implementation failed validation. Please fix the issues.

PRP Task ID: ${prp.taskId}
Failed Validation Gates:
${errorContext}

Fix Attempt: ${attemptNumber}/2

Please analyze the validation failures and fix the implementation.
Focus on the specific errors reported above.
  `.trim();

  await this.#coderAgent.prompt(fixPrompt);
}
```

**From:** PRPExecutor.fixAndRetry()

### Pattern 4: RetryManager Class (Reusable)

```typescript
// From research_code_examples.ts
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
  retryableErrors: string[];
}

export class RetryManager {
  constructor(private config: RetryConfig) {}

  async executeWithRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error)) {
          throw error;
        }

        if (attempt < this.config.maxRetries - 1) {
          const delay = this.calculateDelay(attempt);
          console.warn(
            `[Retry] Attempt ${attempt + 1}/${this.config.maxRetries} failed for ${context}. ` +
              `Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `All ${this.config.maxRetries} attempts failed for ${context}: ${lastError.message}`
    );
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.baseDelay * Math.pow(2, attempt),
      this.config.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter =
      exponentialDelay * this.config.jitterFactor * (Math.random() * 2 - 1);

    return Math.max(0, Math.floor(exponentialDelay + jitter));
  }
}
```

---

## TypeScript Patterns for Iteration

### Pattern 1: Type-Safe State Interface

```typescript
interface FixCycleState {
  fixAttempts: number;
  bugsFixed: number;
  bugsRemaining: Bug[];
  currentBug: Bug | null;
  startTime: number;
}

class FixCycleWorkflow extends Workflow {
  @ObservedState()
  state: FixCycleState = {
    fixAttempts: 0,
    bugsFixed: 0,
    bugsRemaining: [],
    currentBug: null,
    startTime: 0,
  };
}
```

### Pattern 2: Enum State Tracking

```typescript
enum FixCyclePhase {
  Idle = 'idle',
  Analyzing = 'analyzing',
  Fixing = 'fixing',
  Validating = 'validating',
  Complete = 'complete',
  Failed = 'failed',
}

class FixCycleWorkflow extends Workflow {
  @ObservedState()
  currentPhase: FixCyclePhase = FixCyclePhase.Idle;
}
```

### Pattern 3: Discriminated Union for Results

```typescript
type FixResult =
  | { success: true; bug: Bug; artifacts: string[] }
  | { success: false; bug: Bug; error: string; retryable: boolean };

async fixBug(bug: Bug): Promise<FixResult> {
  try {
    await implementFix(bug);
    const validated = await validateFix(bug);
    return { success: true, bug, artifacts: validated.artifacts };
  } catch (error) {
    return {
      success: false,
      bug,
      error: error.message,
      retryable: isRetryable(error),
    };
  }
}
```

### Pattern 4: Generic Iterator Interface

```typescript
interface AsyncIterator<T> {
  hasNext(): Promise<boolean>;
  next(): Promise<T>;
}

class BugIterator implements AsyncIterator<Bug> {
  #bugs: Bug[];
  #index = 0;

  constructor(bugs: Bug[]) {
    this.#bugs = bugs;
  }

  async hasNext(): Promise<boolean> {
    return this.#index < this.#bugs.length;
  }

  async next(): Promise<Bug> {
    if (this.#index >= this.#bugs.length) {
      throw new Error('No more bugs');
    }
    return this.#bugs[this.#index++];
  }
}

// Usage
const iterator = new BugIterator(bugs);
while (await iterator.hasNext()) {
  const bug = await iterator.next();
  await fixBug(bug);
}
```

### Pattern 5: Read-Only State Access

```typescript
class FixCycleWorkflow extends Workflow {
  @ObservedState()
  #fixAttempts: number = 0;

  get fixAttempts(): number {
    return this.#fixAttempts;
  }

  incrementAttempts(): void {
    this.#fixAttempts++;
  }
}
```

---

## Recommended Patterns for Fix Cycle

Based on the research, here are the recommended patterns for implementing the fix cycle workflow:

### Core Pattern Structure

```typescript
export class FixCycleWorkflow extends Workflow {
  // ========================================================================
  // Public Observed State Fields
  // ========================================================================

  /** Test results from bug hunt */
  @ObservedState()
  testResults: TestResults;

  /** Number of fix attempts made */
  @ObservedState()
  fixAttempts: number = 0;

  /** Number of bugs successfully fixed */
  @ObservedState()
  bugsFixed: number = 0;

  /** Current bug being fixed */
  @ObservedState()
  currentBug: Bug | null = null;

  /** All fix results */
  @ObservedState()
  fixResults: FixResult[] = [];

  /** Whether graceful shutdown requested */
  shutdownRequested: boolean = false;

  // ========================================================================
  // Configuration
  // ========================================================================

  readonly #maxFixAttempts: number = 3;
  readonly #maxTotalFixes: number = 100;

  // ========================================================================
  // Main Fix Cycle Loop
  // ========================================================================

  @Step({ trackTiming: true })
  async runFixCycle(): Promise<FixCycleResult> {
    this.logger.info('[FixCycleWorkflow] Starting fix cycle');
    this.setStatus('running');

    let totalIterations = 0;
    const startTime = Date.now();

    try {
      // Filter fixable bugs
      const fixableBugs = this.testResults.bugs.filter(b => b.fixable);
      this.logger.info(
        `[FixCycleWorkflow] Found ${fixableBugs.length} fixable bugs`
      );

      // Main fix loop
      for (const bug of fixableBugs) {
        // Check shutdown
        if (this.shutdownRequested) {
          this.logger.info(
            '[FixCycleWorkflow] Shutdown requested, stopping fix cycle'
          );
          break;
        }

        // Check max iterations
        totalIterations++;
        if (totalIterations > this.#maxTotalFixes) {
          this.logger.warn(
            `[FixCycleWorkflow] Exceeded max iterations (${this.#maxTotalFixes})`
          );
          break;
        }

        // Progress logging
        if (totalIterations % 5 === 0) {
          this.logger.info(
            `[FixCycleWorkflow] Progress: ${this.bugsFixed}/${fixableBugs.length} bugs fixed, ` +
              `${totalIterations} iterations`
          );
        }

        // Fix bug with retry
        const result = await this.#fixBugWithRetry(bug);
        this.fixResults.push(result);

        if (result.success) {
          this.bugsFixed++;
        }

        // Update observed state
        this.currentBug = bug;
        this.fixAttempts = totalIterations;
      }

      // Log summary
      const duration = Date.now() - startTime;
      this.logger.info('[FixCycleWorkflow] Fix cycle complete', {
        duration: `${duration}ms`,
        totalIterations,
        bugsFixed: this.bugsFixed,
        bugsRemaining: fixableBugs.length - this.bugsFixed,
      });

      this.setStatus('completed');

      return {
        success: true,
        bugsFixed: this.bugsFixed,
        totalAttempts: totalIterations,
        fixResults: this.fixResults,
        duration,
      };
    } catch (error) {
      this.setStatus('failed');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[FixCycleWorkflow] Fix cycle failed: ${errorMessage}`);
      throw error;
    }
  }

  // ========================================================================
  // Fix with Retry
  // ========================================================================

  async #fixBugWithRetry(bug: Bug): Promise<FixResult> {
    let attempts = 0;
    const maxAttempts = this.#maxFixAttempts;

    while (attempts <= maxAttempts) {
      attempts++;

      // Log attempt
      this.logger.info(
        `[FixCycleWorkflow] Fixing bug ${bug.id} (attempt ${attempts}/${maxAttempts})`
      );

      // Attempt fix
      const result = await this.#attemptFix(bug);

      if (result.success) {
        this.logger.info(`[FixCycleWorkflow] Successfully fixed bug ${bug.id}`);
        return result;
      }

      // Check if retryable
      if (!result.retryable || attempts >= maxAttempts) {
        this.logger.warn(
          `[FixCycleWorkflow] Cannot fix bug ${bug.id} after ${attempts} attempts`
        );
        return result;
      }

      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
      this.logger.info(
        `[FixCycleWorkflow] Retrying bug ${bug.id} in ${delay}ms...`
      );
      await this.#sleep(delay);
    }

    // Should not reach here, but TypeScript needs it
    return {
      success: false,
      bug,
      error: 'Max attempts exceeded',
      retryable: false,
      attempts,
    };
  }

  // ========================================================================
  // Fix Attempt
  // ========================================================================

  async #attemptFix(bug: Bug): Promise<FixResult> {
    try {
      // TODO: Implement actual fix logic
      // 1. Create PRP for fix
      // 2. Execute PRP
      // 3. Validate fix
      // 4. Return result

      return {
        success: true,
        bug,
        artifacts: [],
        attempts: 1,
      };
    } catch (error) {
      return {
        success: false,
        bug,
        error: error instanceof Error ? error.message : String(error),
        retryable: this.#isRetryable(error),
        attempts: 1,
      };
    }
  }

  // ========================================================================
  // Utilities
  // ========================================================================

  #isRetryable(error: unknown): boolean {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error);
    return (
      !message.includes('not fixable') &&
      !message.includes('invalid requirement') &&
      !message.includes('cannot fix')
    );
  }

  #sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Key Features of Recommended Pattern

1. **@ObservedState Decorator** - For workflow state fields
2. **Max Iteration Guard** - Two levels (per-bug and total)
3. **Progress Logging** - Every 5 iterations
4. **Exponential Backoff** - For retry delays
5. **Graceful Shutdown** - Check shutdown flag
6. **Type-Safe Results** - Discriminated union for fix results
7. **Comprehensive Logging** - Structured logging throughout
8. **Error Handling** - Try-catch with detailed error messages
9. **Phase Tracking** - Workflow status updates
10. **Duration Tracking** - Start time and elapsed time

### Summary Checklist

For fix cycle implementation, ensure:

- ✅ Use `@ObservedState()` for observable workflow fields
- ✅ Implement max iteration guards (both per-bug and total)
- ✅ Add progress logging at regular intervals (every N iterations)
- ✅ Support graceful shutdown (check flag after each iteration)
- ✅ Use exponential backoff for retry delays
- ✅ Track iteration counts as public fields
- ✅ Log detailed progress per bug fix attempt
- ✅ Provide completion conditions (success, max attempts, shutdown)
- ✅ Accumulate results in array for final summary
- ✅ Use type-safe interfaces for state and results
- ✅ Include duration tracking for performance analysis

---

## Conclusion

The codebase contains excellent examples of async iteration patterns that can be directly applied to fix cycle implementation:

1. **PRPPipeline.executeBacklog()** - Primary reference for main loop structure
2. **PRPExecutor.execute()** - Reference for retry logic with exponential backoff
3. **ReActAgent** - Reference for completion detection and state accumulation
4. **BugHuntWorkflow** - Reference for @ObservedState usage and structured logging

The recommended pattern combines the best features from all these examples into a cohesive fix cycle implementation that is:

- **Observable** - Via @ObservedState decorators
- **Safe** - Via max iteration guards
- **Informative** - Via progress logging
- **Resilient** - Via retry logic with backoff
- **Graceful** - Via shutdown support
- **Type-safe** - Via TypeScript interfaces

This research provides a solid foundation for implementing P4.M3.T1.S2 (Fix Cycle Iteration).
