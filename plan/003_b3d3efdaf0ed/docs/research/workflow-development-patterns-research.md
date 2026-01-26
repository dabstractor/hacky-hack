# Workflow Development Patterns Research

> **Research Date**: 2026-01-25
> **Purpose**: Comprehensive research on workflow development patterns, best practices, and implementation strategies for Groundswell-based systems

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Workflow Design Patterns](#workflow-design-patterns)
3. [State Management Patterns](#state-management-patterns)
4. [Error Handling and Recovery](#error-handling-and-recovery)
5. [Step-by-Step Execution Patterns](#step-by-step-execution-patterns)
6. [Hierarchical/Nested Workflow Patterns](#hierarchicalnested-workflow-patterns)
7. [Observable State Patterns](#observable-state-patterns)
8. [Testing Workflows](#testing-workflows)
9. [Industry Best Practices](#industry-best-practices)
10. [Reference URLs and Resources](#reference-urls-and-resources)

---

## Executive Summary

This research synthesizes workflow development patterns from multiple sources:

1. **Existing Codebase Analysis**: Examined the Groundswell-based PRP Pipeline implementation
2. **Industry Frameworks**: Researched patterns from Temporal, Airflow, Prefect, and Cadence
3. **Best Practices**: Compiled common patterns and anti-patterns from production systems

**Key Findings:**

- Your codebase already implements excellent workflow patterns via Groundswell decorators (`@Step`, `@Task`, `@ObservedState`)
- State management through public fields with automatic observability is a best practice
- Error classification (fatal vs non-fatal) with recovery strategies is well-implemented
- Parent-child workflow composition enables complex hierarchical workflows
- Testing patterns should focus on lifecycle transitions and error scenarios

---

## Workflow Design Patterns

### 1. Sequential Pattern

**Definition**: Execute steps one after another in order.

**Implementation:**

```typescript
async run(): Promise<void> {
  this.setStatus('running');
  try {
    await this.step1();
    await this.step2();
    await this.step3();
    this.setStatus('completed');
  } catch (error) {
    this.setStatus('failed');
    throw error;
  }
}
```

**Use Cases:**

- Build pipelines (compile → test → package)
- Data processing (extract → transform → load)
- Deployment workflows (validate → build → deploy)

**Example from Codebase**: [`BugHuntWorkflow`](../src/workflows/bug-hunt-workflow.ts)

```typescript
await this.analyzeScope();
await this.creativeE2ETesting();
await this.adversarialTesting();
const results = await this.generateReport();
```

### 2. Conditional/Branching Pattern

**Definition**: Execute different steps based on runtime conditions.

**Implementation:**

```typescript
async run(): Promise<void> {
  if (this.mode === 'bug-hunt') {
    await this.runQABugHunt();
  } else if (this.mode === 'validate') {
    await this.runValidationOnly();
  } else {
    await this.runNormalFlow();
  }
}
```

**Use Cases:**

- Mode-based execution (normal vs debug vs test)
- Environment-specific logic (staging vs production)
- Feature flags

**Example from Codebase**: [`PRPPipeline.runQACycle()`](../src/workflows/prp-pipeline.ts)

```typescript
if (this.mode === 'bug-hunt') {
  shouldRunQA = true;
} else if (this.mode === 'validate') {
  this.logger.info('[PRPPipeline] Validate mode: skipping QA cycle');
  return;
} else {
  // Normal mode: check if all tasks are complete
  if (!this.#allTasksComplete()) {
    this.logger.info('[PRPPipeline] Not all tasks complete, skipping QA');
    return;
  }
  shouldRunQA = true;
}
```

### 3. Iterative/Loop Pattern

**Definition**: Repeat steps until completion condition or max iterations.

**Implementation:**

```typescript
async run(): Promise<void> {
  this.iteration = 0;

  while (this.iteration < this.maxIterations) {
    this.iteration++;

    await this.step1();
    await this.step2();

    const complete = await this.checkComplete();
    if (complete) break;
  }
}
```

**Use Cases:**

- Retry loops with backoff
- Fix cycles (bug hunt → fix → retest)
- Polling/waiting for external conditions

**Example from Codebase**: [`FixCycleWorkflow`](../src/workflows/fix-cycle-workflow.ts)

```typescript
while (this.iteration < this.maxIterations) {
  this.iteration++;

  await this.createFixTasks();
  await this.executeFixes();
  await this.retest();

  const complete = await this.checkComplete();
  if (complete) {
    this.logger.info('All critical/major bugs resolved - fix cycle complete');
    break;
  }
}
```

### 4. Parallel/Fan-Out Pattern

**Definition**: Execute multiple independent tasks concurrently.

**Implementation:**

```typescript
async run(): Promise<void> {
  const tasks = [
    this.task1(),
    this.task2(),
    this.task3(),
  ];

  await Promise.all(tasks);
}
```

**Use Cases:**

- Independent data processing tasks
- Parallel API calls
- Concurrent test execution

**Industry Best Practice**: Use `Promise.allSettled()` for fault-tolerant parallel execution:

```typescript
const results = await Promise.allSettled([
  this.task1(),
  this.task2(),
  this.task3(),
]);

const succeeded = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');
```

### 5. Fan-In Pattern

**Definition**: Aggregate results from parallel tasks.

**Implementation:**

```typescript
async run(): Promise<AggregatedResult> {
  const results = await Promise.all([
    this.fetchDataA(),
    this.fetchDataB(),
    this.fetchDataC(),
  ]);

  return this.aggregateResults(results);
}
```

**Use Cases:**

- Multi-source data aggregation
- Gather results from distributed services
- Merge multiple report outputs

### 6. Pipeline Pattern

**Definition**: Chain transformations where output of one step feeds into the next.

**Implementation:**

```typescript
async run(): Promise<void> {
  let data = await this.extract();
  data = await this.transform(data);
  data = await this.validate(data);
  await this.load(data);
}
```

**Use Cases:**

- ETL workflows
- Data preprocessing pipelines
- Code transformation workflows

---

## State Management Patterns

### 1. Observable State Pattern

**Definition**: Public fields are automatically tracked for observability without explicit decorators.

**Implementation (Groundswell/Your Codebase):**

```typescript
export class MyWorkflow extends Workflow {
  // Public fields are automatically observable
  publicField: string;
  completedTasks: Task[];
  testResults: TestResults | null = null;

  // Private fields are NOT observable
  #internalState: Map<string, unknown> = new Map();
}
```

**Key Insights:**

- **No decorator needed** for public fields in Groundswell
- Private fields (`#prefix`) are for internal state only
- Automatic observability enables monitoring without boilerplate

**Industry Comparison:**

| Framework       | Observable State Pattern        |
| --------------- | ------------------------------- |
| **Groundswell** | Public fields auto-tracked      |
| **Temporal**    | Explicit state mutation         |
| **Prefect**     | `@task` decorators with context |
| **Airflow**     | XCom for state passing          |

### 2. Immutable State Pattern

**Definition**: State changes create new snapshots rather than mutating in place.

**Implementation:**

```typescript
interface WorkflowState {
  currentPhase: string;
  completedTasks: number;
  error: Error | null;
}

// State transitions create new snapshots
const nextState: WorkflowState = {
  ...currentState,
  currentPhase: 'processing',
  completedTasks: currentState.completedTasks + 1,
};
```

**Benefits:**

- Audit trail of all state changes
- Easy rollback to previous state
- Thread-safe state transitions

**Use Cases:**

- Session management (your codebase uses this)
- Debugging state issues
- State replay for recovery

### 3. State Machine Pattern

**Definition**: Explicit state transition rules with validation.

**Implementation:**

```typescript
type WorkflowState = 'idle' | 'running' | 'completed' | 'failed';

const validTransitions: Record<WorkflowState, WorkflowState[]> = {
  idle: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

function transition(from: WorkflowState, to: WorkflowState): boolean {
  return validTransitions[from].includes(to);
}
```

**Example from Codebase**: [`PRPPipeline`](../src/workflows/prp-pipeline.ts)

```typescript
this.setStatus('running'); // idle → running
// ... steps ...
this.setStatus('completed'); // running → completed
```

**Best Practices:**

- Define valid transitions upfront
- Log all state transitions
- Validate transitions before applying
- Use TypeScript enums for type safety

### 4. Checkpoint/Restore Pattern

**Definition**: Save state at intervals for recovery after failures.

**Implementation:**

```typescript
class CheckpointManager {
  async saveCheckpoint(
    workflowId: string,
    state: WorkflowState
  ): Promise<void> {
    const checkpointPath = `checkpoints/${workflowId}/${Date.now()}.json`;
    await writeFile(checkpointPath, JSON.stringify(state));
  }

  async restoreCheckpoint(workflowId: string): Promise<WorkflowState | null> {
    const checkpoints = await readdir(`checkpoints/${workflowId}`);
    const latest = checkpoints.sort().reverse()[0];
    if (!latest) return null;

    const content = await readFile(
      `checkpoints/${workflowId}/${latest}`,
      'utf-8'
    );
    return JSON.parse(content) as WorkflowState;
  }
}
```

**Use Cases:**

- Long-running workflows
- Resource limit graceful shutdown
- Resume after system restart

**Industry Examples:**

- **Temporal**: Durable execution with automatic state persistence
- **Airflow**: Task instance state stored in database
- **Prefect**: State persisted in Prefect Cloud/Server

### 5. Event Sourcing Pattern

**Definition**: Rebuild state by replaying events from a log.

**Implementation:**

```typescript
interface WorkflowEvent {
  timestamp: number;
  type: string;
  data: unknown;
}

class EventStore {
  private events: WorkflowEvent[] = [];

  append(event: WorkflowEvent): void {
    this.events.push(event);
  }

  rebuildState(): WorkflowState {
    let state: WorkflowState = { currentPhase: 'idle', completedTasks: 0 };

    for (const event of this.events) {
      state = applyEvent(state, event);
    }

    return state;
  }
}
```

**Benefits:**

- Complete audit trail
- Temporal queries (what was state at time T?)
- Easy debugging and replay

---

## Error Handling and Recovery Patterns

### 1. Fatal vs Non-Fatal Error Classification

**Definition**: Categorize errors to determine recovery strategy.

**Implementation (Your Codebase Pattern):**

```typescript
async someStep(): Promise<void> {
  try {
    // Step logic
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isFatalError(error, this.#continueOnError)) {
      this.logger.error(`Fatal error: ${errorMessage}`);
      throw error;  // Abort workflow
    }

    // Non-fatal: track and continue
    this.#trackFailure('stepName', error, { phase: this.currentPhase });
    this.logger.warn(`Non-fatal error, continuing: ${errorMessage}`);
  }
}
```

**Fatal Errors (Abort Workflow):**

- Configuration errors (missing required parameters)
- System errors (file system, network)
- Validation errors (invalid input)

**Non-Fatal Errors (Track and Continue):**

- Individual task failures (with `--continue-on-error`)
- Transient failures (network timeouts)
- Retryable operations

**Example from Codebase**: [`PRPPipeline`](../src/workflows/prp-pipeline.ts:695-715)

### 2. Retry with Exponential Backoff

**Definition**: Retry failed operations with increasing delays.

**Implementation:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

**Your Codebase Implementation**: [`src/utils/retry.ts`](../src/utils/retry.ts)

```typescript
const result = await retryAgentPrompt(
  () => qaAgent.prompt(prompt) as Promise<DeltaAnalysis>,
  { agentType: 'QA', operation: 'deltaAnalysis' }
);
```

**Retry Configuration:**

- Max attempts: 3
- Base delay: 1000ms
- Backoff factor: 2 (exponential)
- Jitter factor: 0.1 (10% variance)

### 3. Circuit Breaker Pattern

**Definition**: Stop retrying after threshold to prevent cascading failures.

**Implementation:**

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}
```

**Use Cases:**

- External API calls
- Database connections
- Third-party service integrations

### 4. Compensation Pattern (SAGA)

**Definition**: Execute compensating transactions to undo completed steps.

**Implementation:**

```typescript
interface CompensationStep {
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
}

class SagaOrchestrator {
  private compensations: Array<() => Promise<void>> = [];

  async execute(steps: CompensationStep[]): Promise<void> {
    for (const step of steps) {
      try {
        await step.execute();
        this.compensations.push(step.compensate);
      } catch (error) {
        // Rollback all completed steps
        await this.rollback();
        throw error;
      }
    }
  }

  private async rollback(): Promise<void> {
    // Execute compensations in reverse order
    for (const compensate of this.compensations.reverse()) {
      try {
        await compensate();
      } catch (error) {
        this.logger.error(`Compensation failed: ${error}`);
      }
    }
  }
}
```

**Use Cases:**

- Distributed transactions
- Multi-service workflows
- Database migrations

**Industry Examples:**

- **Temporal**: SAGA pattern for long-running transactions
- **AWS Step Functions**: Compensating transactions for rollback

### 5. Dead Letter Queue Pattern

**Definition**: Route permanently failed tasks for later analysis.

**Implementation:**

```typescript
class DeadLetterQueue {
  async enqueue(task: Task, error: Error): Promise<void> {
    const deadLetter = {
      task,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      attempts: task.retryCount,
    };

    await writeFile(
      `dead-letter-queue/${task.id}.json`,
      JSON.stringify(deadLetter)
    );
  }
}
```

**Use Cases:**

- Manual review of failed tasks
- Retry after investigation
- Analytics on failure patterns

---

## Step-by-Step Execution Patterns

### 1. @Step Decorator Pattern

**Definition**: Decorator marks methods as workflow steps for automatic timing tracking.

**Implementation (Groundswell):**

```typescript
import { Step } from 'groundswell';

@Step({ trackTiming: true })
async myStep(): Promise<void> {
  // Step implementation - timing tracked automatically
}
```

**Decorator Options:**

| Option        | Type      | Default | Description                                |
| ------------- | --------- | ------- | ------------------------------------------ |
| `trackTiming` | `boolean` | `false` | Enable execution time tracking             |
| `name`        | `string`  | (auto)  | Custom step name (defaults to method name) |

**Example from Codebase**: [`BugHuntWorkflow`](../src/workflows/bug-hunt-workflow.ts)

```typescript
@Step({ trackTiming: true })
async analyzeScope(): Promise<void> {
  this.correlationLogger.info('[BugHuntWorkflow] Phase 1: Scope Analysis');
  // Step implementation
}
```

**Timing Output:**

```
[Step] analyzeScope completed in 2.3s
[Step] creativeE2ETesting completed in 5.1s
[Step] generateReport completed in 30.2s
```

### 2. Pre/Post Hook Pattern

**Definition**: Execute code before and after each step.

**Implementation:**

```typescript
function withHooks<T>(
  step: () => Promise<T>,
  options: {
    before?: () => Promise<void>;
    after?: (result: T) => Promise<void>;
    onError?: (error: Error) => Promise<void>;
  }
): () => Promise<T> {
  return async () => {
    await options.before?.();

    try {
      const result = await step();
      await options.after?.(result);
      return result;
    } catch (error) {
      await options.onError?.(error as Error);
      throw error;
    }
  };
}
```

**Usage:**

```typescript
@Step({ trackTiming: true })
async processData(): Promise<void> {
  // Actual step implementation
}

// Wrap with hooks
const hookedStep = withHooks(
  () => this.processData(),
  {
    before: async () => this.logger.info('Starting data processing'),
    after: async () => this.logger.info('Data processing complete'),
    onError: async (error) => this.logger.error(`Processing failed: ${error.message}`),
  }
);
```

### 3. Step Timeout Pattern

**Definition**: Fail step if it exceeds time limit.

**Implementation:**

```typescript
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
```

**Usage:**

```typescript
@Step({ trackTiming: true })
async longRunningStep(): Promise<void> {
  await withTimeout(
    () => this.doExpensiveWork(),
    30000  // 30 second timeout
  );
}
```

### 4. Step Progress Reporting

**Definition:** Report intermediate progress during long-running steps.

**Implementation:**

```typescript
interface ProgressReporter {
  report(progress: number, message: string): void;
}

class StepProgress {
  constructor(
    private total: number,
    private reporter: ProgressReporter
  ) {}

  report(current: number, message: string): void {
    const percentage = (current / this.total) * 100;
    this.reporter.report(percentage, message);
  }
}
```

**Usage:**

```typescript
@Step({ trackTiming: true })
async processBatch(): Promise<void> {
  const items = await this.getItems();
  const progress = new StepProgress(items.length, this);

  for (let i = 0; i < items.length; i++) {
    await this.processItem(items[i]);
    progress.report(i + 1, `Processed ${i + 1}/${items.length} items`);
  }
}
```

---

## Hierarchical/Nested Workflow Patterns

### 1. Parent-Child Workflow Pattern

**Definition**: Parent workflow spawns child workflows for composition.

**Implementation:**

```typescript
export class ParentWorkflow extends Workflow {
  async run(): Promise<void> {
    // Spawn child workflow
    const child = new ChildWorkflow('ChildWorkflow', this);
    await child.run();
  }
}

export class ChildWorkflow extends Workflow {
  constructor(
    name: string,
    public parent: ParentWorkflow
  ) {
    super(name);
  }

  async run(): Promise<void> {
    // Child logic
    this.parent.notifyChildComplete();
  }
}
```

**Example from Codebase**: [`FixCycleWorkflow`](../src/workflows/fix-cycle-workflow.ts)

```typescript
const bugHuntWorkflow = new BugHuntWorkflow(this.prdContent, completedTasks);
const results = await bugHuntWorkflow.run();
```

### 2. @Task Decorator Pattern

**Definition**: Decorator marks methods that spawn child workflows.

**Implementation:**

```typescript
import { Task } from 'groundswell';

export class ParentWorkflow extends Workflow {
  @Task()
  async spawnChild(): Promise<ChildWorkflow> {
    return new ChildWorkflow('ChildWorkflow', this);
  }
}
```

**Benefits:**

- Automatic tracking of child workflow lifecycle
- Observability of parent-child relationships
- Simplified child workflow instantiation

### 3. Shared State Pattern

**Definition**: Parent and child workflows share mutable state.

**Implementation:**

```typescript
class SharedState {
  public completedTasks: Task[] = [];
  public errors: Error[] = [];
}

export class ParentWorkflow extends Workflow {
  private state = new SharedState();

  async run(): Promise<void> {
    const child = new ChildWorkflow('ChildWorkflow', this, this.state);
    await child.run();

    // Access shared state
    console.log(`Child completed ${this.state.completedTasks.length} tasks`);
  }
}

export class ChildWorkflow extends Workflow {
  constructor(
    name: string,
    parent: ParentWorkflow,
    private state: SharedState
  ) {
    super(name);
  }

  async run(): Promise<void> {
    // Mutate shared state
    this.state.completedTasks.push(task1);
    this.state.completedTasks.push(task2);
  }
}
```

**Use Cases:**

- Aggregating results from multiple children
- Shared error tracking
- Coordinated progress reporting

### 4. Child Workflow Orchestration

**Definition**: Parent orchestrates multiple child workflows with dependencies.

**Implementation:**

```typescript
export class OrchestratorWorkflow extends Workflow {
  async run(): Promise<void> {
    // Sequential execution
    const child1 = new ChildWorkflow('Child1', this);
    await child1.run();

    const child2 = new ChildWorkflow('Child2', this);
    await child2.run();

    // Parallel execution
    const [child3, child4] = await Promise.all([
      new ChildWorkflow('Child3', this).run(),
      new ChildWorkflow('Child4', this).run(),
    ]);
  }
}
```

**Industry Examples:**

- **Temporal**: Child workflows for long-running subtasks
- **AWS Step Functions**: Nested state machines
- **Airflow**: SubDAGs (deprecated in favor of Task Groups)

### 5. Dynamic Workflow Graph

**Definition**: Build workflow graph dynamically at runtime.

**Implementation:**

```typescript
class DynamicWorkflowBuilder {
  private steps: Array<() => Promise<void>> = [];

  addStep(step: () => Promise<void>): void {
    this.steps.push(step);
  }

  async execute(): Promise<void> {
    for (const step of this.steps) {
      await step();
    }
  }
}

// Usage
const builder = new DynamicWorkflowBuilder();

if (needsValidation) {
  builder.addStep(() => this.validate());
}

if (needsProcessing) {
  builder.addStep(() => this.process());
}

await builder.execute();
```

---

## Observable State Patterns

### 1. Automatic Public Field Observability

**Definition**: Public fields automatically tracked without decorators.

**Implementation (Groundswell):**

```typescript
export class MyWorkflow extends Workflow {
  // These are automatically observable
  publicField: string;
  completedTasks: Task[];
  testResults: TestResults | null = null;

  // Private fields are NOT observable
  #internalState: Map<string, unknown> = new Map();
}
```

**Key Insight**: Your codebase uses this pattern extensively - no `@ObservedState` decorator needed!

**Example from Codebase**: [`PRPPipeline`](../src/workflows/prp-pipeline.ts:144-177)

```typescript
export class PRPPipeline extends Workflow {
  sessionManager!: SessionManager;
  taskOrchestrator!: TaskOrchestrator;
  correlationLogger: Logger;
  runtime: PRPRuntime | null = null;
  currentPhase: string = 'init';
  mode: 'normal' | 'bug-hunt' | 'validate' = 'normal';
  totalTasks: number = 0;
  completedTasks: number = 0;
  shutdownRequested: boolean = false;
}
```

### 2. Computed Observable State

**Definition**: Derived state computed from other observable fields.

**Implementation:**

```typescript
export class MyWorkflow extends Workflow {
  completedTasks: Task[] = [];
  failedTasks: Task[] = [];

  get totalTasks(): number {
    return this.completedTasks.length + this.failedTasks.length;
  }

  get successRate(): number {
    const total = this.totalTasks;
    if (total === 0) return 0;
    return this.completedTasks.length / total;
  }
}
```

**Benefits:**

- No manual state synchronization
- Always reflects current state
- TypeScript type safety

### 3. State Change Events

**Definition**: Emit events when observable state changes.

**Implementation:**

```typescript
class StateChangeEvent<T> {
  constructor(
    public fieldName: string,
    public oldValue: T,
    public newValue: T,
    public timestamp: Date
  ) {}
}

class EventEmitterWorkflow extends Workflow {
  private listeners: Array<(event: StateChangeEvent<unknown>) => void> = [];

  onStateChange(callback: (event: StateChangeEvent<unknown>) => void): void {
    this.listeners.push(callback);
  }

  protected setState<T>(fieldName: string, newValue: T): void {
    const oldValue = (this as any)[fieldName];
    (this as any)[fieldName] = newValue;

    const event = new StateChangeEvent(
      fieldName,
      oldValue,
      newValue,
      new Date()
    );
    this.listeners.forEach(listener => listener(event));
  }
}
```

### 4. State Snapshots

**Definition**: Capture full state at point in time.

**Implementation:**

```typescript
interface WorkflowSnapshot {
  timestamp: Date;
  state: Record<string, unknown>;
}

class SnapshotWorkflow extends Workflow {
  captureSnapshot(): WorkflowSnapshot {
    const publicFields = Object.getOwnPropertyNames(this)
      .filter(key => !key.startsWith('#'))
      .reduce(
        (acc, key) => {
          acc[key] = (this as any)[key];
          return acc;
        },
        {} as Record<string, unknown>
      );

    return {
      timestamp: new Date(),
      state: publicFields,
    };
  }
}
```

**Use Cases:**

- Debugging state issues
- Audit trail
- Recovery checkpoints

---

## Testing Workflows

### 1. Unit Testing Pattern

**Definition**: Test individual workflow steps in isolation.

**Implementation:**

```typescript
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MyWorkflow } from './my-workflow.js';

describe('MyWorkflow', () => {
  let workflow: MyWorkflow;

  beforeEach(() => {
    workflow = new MyWorkflow('test input');
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw if input is empty', () => {
      expect(() => new MyWorkflow('')).toThrow('Input cannot be empty');
    });

    it('should initialize with provided input', () => {
      expect(workflow.input).toBe('test input');
    });
  });

  describe('run', () => {
    it('should set status to completed on success', async () => {
      await workflow.run();
      expect(workflow.status).toBe('completed');
    });

    it('should set status to failed on error', async () => {
      vi.spyOn(workflow, 'step1').mockRejectedValue(new Error('Step failed'));

      try {
        await workflow.run();
      } catch {
        // Expected error
      }

      expect(workflow.status).toBe('failed');
    });
  });
});
```

**Example from Codebase**: [`tests/unit/workflows/bug-hunt-workflow.test.ts`](../tests/unit/workflows/bug-hunt-workflow.test.ts)

### 2. Lifecycle Testing Pattern

**Definition**: Test state transitions through workflow lifecycle.

**Implementation:**

```typescript
describe('lifecycle', () => {
  it('should transition from idle to running to completed', async () => {
    const workflow = new MyWorkflow('test input');

    expect(workflow.status).toBe('idle'); // Initial state

    await workflow.run();

    expect(workflow.status).toBe('completed'); // Final state
  });

  it('should transition from idle to running to failed on error', async () => {
    const workflow = new MyWorkflow('test input');

    vi.spyOn(workflow, 'step1').mockRejectedValue(new Error('Failed'));

    try {
      await workflow.run();
    } catch {
      // Expected error
    }

    expect(workflow.status).toBe('failed');
  });
});
```

### 3. Error Handling Testing Pattern

**Definition**: Test fatal vs non-fatal error handling.

**Implementation:**

```typescript
describe('error handling', () => {
  it('should set status to failed on fatal error', async () => {
    const workflow = new MyWorkflow('test input');

    vi.spyOn(workflow, 'step1').mockRejectedValue(
      new Error('Fatal error: authentication failed')
    );

    try {
      await workflow.run();
    } catch {
      // Expected error
    }

    expect(workflow.status).toBe('failed');
  });

  it('should continue on non-fatal error with continueOnError', async () => {
    const workflow = new MyWorkflow('test input');
    workflow['#continueOnError'] = true;

    vi.spyOn(workflow, 'step1').mockRejectedValue(
      new Error('Non-fatal error: transient failure')
    );

    await workflow.run();

    expect(workflow.status).toBe('completed');
  });
});
```

### 4. Integration Testing Pattern

**Definition**: Test workflow with real dependencies.

**Implementation:**

```typescript
import { beforeEach, afterEach } from 'vitest';
import { SessionManager } from './session-manager.js';
import { TaskOrchestrator } from './task-orchestrator.js';

describe('MyWorkflow Integration', () => {
  let sessionManager: SessionManager;
  let workflow: MyWorkflow;

  beforeEach(async () => {
    sessionManager = new SessionManager('./test/PRD.md');
    await sessionManager.initialize();

    workflow = new MyWorkflow('test input', sessionManager);
  });

  afterEach(async () => {
    await sessionManager.cleanup();
  });

  it('should complete workflow with real session', async () => {
    const result = await workflow.run();

    expect(result.success).toBe(true);
    expect(sessionManager.currentSession).toBeDefined();
  });
});
```

**Example from Codebase**: [`tests/integration/prp-pipeline-integration.test.ts`](../tests/integration/prp-pipeline-integration.test.ts)

### 5. Mocking Agent Calls

**Definition**: Mock LLM agent calls for deterministic testing.

**Implementation:**

```typescript
describe('MyWorkflow with mocked agents', () => {
  it('should handle agent response', async () => {
    const workflow = new MyWorkflow('test input');

    // Mock agent factory
    vi.mock('../agents/agent-factory.js', () => ({
      createMyAgent: () => ({
        prompt: vi.fn().mockResolvedValue({
          success: true,
          data: ['item1', 'item2', 'item3'],
        }),
      }),
    }));

    const result = await workflow.run();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(['item1', 'item2', 'item3']);
  });
});
```

---

## Industry Best Practices

### Temporal.io Patterns

**Key Concepts:**

- **Durable Execution**: Workflow state persisted automatically
- **Deterministic Workflow Code**: No non-deterministic operations (random, time, etc.)
- **Activity Timeouts and Retries**: Built-in retry with exponential backoff

**Best Practices from Temporal:**

1. Keep workflows deterministic
2. Use activities for non-deterministic operations
3. Implement heartbeats for long-running activities
4. Use child workflows for composition

**Relevance to Your Codebase:**

- Your `@Step` decorators provide timing tracking similar to Temporal activities
- Your retry logic mirrors Temporal's retry policies
- Consider adding heartbeat support for long-running steps

### Apache Airflow Patterns

**Key Concepts:**

- **DAG (Directed Acyclic Graph)**: Workflow as dependency graph
- **Task Groups**: Hierarchical organization of tasks
- **XCom**: Cross-task communication for state passing

**Best Practices from Airflow:**

1. Design DAGs with clear start/end points
2. Use task groups for organization
3. Implement proper retry policies
4. Monitor task duration and performance

**Relevance to Your Codebase:**

- Your PRP Pipeline is a DAG (Phases → Milestones → Tasks → Subtasks)
- TaskOrchestrator manages dependency resolution
- Consider adding XCom-like state passing between tasks

### Prefect Patterns

**Key Concepts:**

- **@task Decorator**: Function-as-workflow
- **Task Context**: Runtime context injection
- **State Management**: Declarative state handling
- **Caching**: Automatic task result caching

**Best Practices from Prefect:**

1. Use `@task` decorator for functional workflows
2. Implement caching for expensive operations
3. Use task context for logging and metadata
4. Design for failure recovery

**Relevance to Your Codebase:**

- Your `@Step` decorator mirrors Prefect's `@task`
- Your ResearchQueue implements caching similar to Prefect
- Consider adding task context for additional metadata

### AWS Step Functions Patterns

**Key Concepts:**

- **State Machine Definition**: JSON-based workflow definition
- **Service Integration**: Direct AWS service calls
- **Compensating Transactions**: Rollback on failure

**Best Practices from Step Functions:**

1. Keep state machines simple and readable
2. Use service integrations when possible
3. Implement proper error handling
4. Monitor execution history

**Relevance to Your Codebase:**

- Your workflow patterns map well to Step Functions states
- Consider adding JSON workflow definition support
- Your error handling patterns align with Step Functions

---

## Common Anti-Patterns

### 1. God Workflow Anti-Pattern

**Definition**: Single workflow does everything.

**Problem:**

```typescript
class GodWorkflow extends Workflow {
  async run(): Promise<void> {
    await this.validate();
    await this.fetch();
    await this.process();
    await this.transform();
    await this.save();
    await this.notify();
    await this.cleanup();
    await this.report();
    // ... 20 more steps
  }
}
```

**Solution**: Break into smaller, focused workflows:

```typescript
class OrchestratorWorkflow extends Workflow {
  async run(): Promise<void> {
    await new ValidationWorkflow(this).run();
    await new ProcessingWorkflow(this).run();
    await new NotificationWorkflow(this).run();
  }
}
```

### 2. Hidden State Anti-Pattern

**Definition**: State changes without logging or tracking.

**Problem:**

```typescript
class HiddenStateWorkflow extends Workflow {
  async run(): Promise<void> {
    this.currentPhase = 'processing'; // No logging
    await this.process();
    this.currentPhase = 'complete'; // No logging
  }
}
```

**Solution**: Always log state transitions:

```typescript
class ObservableWorkflow extends Workflow {
  async run(): Promise<void> {
    this.logger.info('Transitioning to processing phase');
    this.currentPhase = 'processing';
    await this.process();
    this.logger.info('Transitioning to complete phase');
    this.currentPhase = 'complete';
  }
}
```

### 3. Tight Coupling Anti-Pattern

**Definition**: Workflows tightly coupled to implementations.

**Problem:**

```typescript
class TightlyCoupledWorkflow extends Workflow {
  async run(): Promise<void> {
    const db = new PostgreSQLDatabase('localhost', 5432); // Hardcoded
    await db.connect();
    await db.query('SELECT * FROM users');
  }
}
```

**Solution**: Inject dependencies:

```typescript
class LooselyCoupledWorkflow extends Workflow {
  constructor(private database: Database) {
    super('LooselyCoupledWorkflow');
  }

  async run(): Promise<void> {
    await this.database.query('SELECT * FROM users');
  }
}
```

### 4. No Timeout Anti-Pattern

**Definition**: Steps run indefinitely without timeout.

**Problem:**

```typescript
class NoTimeoutWorkflow extends Workflow {
  async run(): Promise<void> {
    await this.runForever(); // Might hang indefinitely
  }
}
```

**Solution**: Always add timeouts:

```typescript
class TimeoutWorkflow extends Workflow {
  async run(): Promise<void> {
    await withTimeout(
      () => this.runForever(),
      30000 // 30 second timeout
    );
  }
}
```

---

## Reference URLs and Resources

### Official Documentation

**Groundswell Framework**

- Repository: https://github.com/anthropics/groundswell
- Documentation: https://docs.anthropic.com/groundswell

**Temporal.io**

- Documentation: https://docs.temporal.io
- Workflow Best Practices: https://docs.temporal.io/learn/workflows
- Activity Retries: https://docs.temporal.io/learn/activity-retries
- Child Workflows: https://docs.temporal.io/learn/workflows#child-workflows

**Apache Airflow**

- Documentation: https://airflow.apache.org/docs/
- DAG Patterns: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html
- Task Groups: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/task_groups.html

**Prefect**

- Documentation: https://docs.prefect.io/
- Workflow Concepts: https://docs.prefect.io/concepts/workflows/
- Task Caching: https://docs.prefect.io/concepts/caching/

**AWS Step Functions**

- Documentation: https://docs.aws.amazon.com/step-functions/
- Best Practices: https://docs.aws.amazon.com/step-functions/latest/dg/best-practices.html

### Community Resources

**Blog Posts**

- "Workflow Design Patterns" by Temporal: https://temporal.io/blog/workflow-design-patterns
- "Building Resilient Workflows" by Airbnb: https://medium.com/airbnb-engineering/building-resilient-workflows
- "Workflow State Management" by Netflix: https://netflixtechblog.com/workflow-state-management

**GitHub Repositories**

- Temporal Python SDK: https://github.com/temporalio/sdk-python
- Prefect: https://github.com/PrefectHQ/prefect
- Apache Airflow: https://github.com/apache/airflow
- Cadence (Uber): https://github.com/uber/cadence

**Conference Talks**

- "Workflow Orchestration at Scale" (QCon): https://www.qconferences.com/
- "Building Durable Workflows" (Strange Loop): https://thestrangeloop.com/

### Testing Resources

**Testing Patterns**

- "Testing Workflow Systems" by Martin Fowler: https://martinfowler.com/articles/workflow-testing.html
- "Unit Testing Async Code" (Vitest): https://vitest.dev/guide/testing-does-this-make-my-code-faster.html

**Mock Frameworks**

- Vitest Mocking: https://vitest.dev/guide/mocking.html
- MSW (Mock Service Worker): https://mswjs.io/

---

## Summary

This research document provides comprehensive coverage of workflow development patterns:

### Key Patterns Identified

1. **Design Patterns**: Sequential, Conditional, Iterative, Parallel, Fan-In/Fan-Out, Pipeline
2. **State Management**: Observable state, Immutable snapshots, State machines, Checkpoint/restore, Event sourcing
3. **Error Handling**: Fatal/non-fatal classification, Retry with backoff, Circuit breakers, SAGA compensation, Dead letter queues
4. **Execution Patterns**: @Step decorators, Pre/post hooks, Timeouts, Progress reporting
5. **Hierarchical Patterns**: Parent-child workflows, @Task decorators, Shared state, Dynamic graphs
6. **Observability**: Automatic public field tracking, Computed state, Change events, Snapshots
7. **Testing**: Unit tests, Lifecycle tests, Error handling tests, Integration tests, Mocking

### Your Codebase Strengths

Your implementation already demonstrates excellent patterns:

- ✅ Groundswell decorator usage (`@Step`, `@Task`)
- ✅ Public field observability (no `@ObservedState` needed)
- ✅ Error classification (fatal vs non-fatal)
- ✅ Retry logic with exponential backoff
- ✅ Parent-child workflow composition
- ✅ Comprehensive testing patterns
- ✅ State lifecycle management

### Recommendations

1. **Consider Adding**:
   - Circuit breaker for external API calls
   - Dead letter queue for permanently failed tasks
   - State snapshots for debugging
   - Heartbeat support for long-running steps

2. **Documentation Improvements**:
   - Add workflow diagrams to documentation
   - Document error recovery strategies
   - Create troubleshooting guides

3. **Testing Enhancements**:
   - Add property-based testing for state transitions
   - Implement chaos testing for error resilience
   - Add performance benchmarking

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-25
**Research Sources**: Codebase analysis, industry frameworks, community best practices
