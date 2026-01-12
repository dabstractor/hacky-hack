# Groundswell Library Documentation Research

## Overview

**Project:** Groundswell
**Description:** Hierarchical workflow orchestration engine with full observability
**Version:** 0.0.1
**Repository:** https://github.com/groundswell-ai/groundswell
**Local Path:** ~/projects/groundswell
**Requirements:** Node.js 18+, TypeScript 5.2+

---

## Table of Contents

1. [Official GitHub Repository](#1-official-github-repository)
2. [Workflow Class Usage](#2-workflow-class-usage)
3. [@Step Decorator Documentation](#3-step-decorator-documentation)
4. [TypeScript Examples](#4-typescript-examples)
5. [Error Handling Best Practices](#5-error-handling-best-practices)
6. [Running Workflows Programmatically](#6-running-workflows-programmatically)
7. [Additional Resources](#7-additional-resources)

---

## 1. Official GitHub Repository

**Repository URL:** https://github.com/groundswell-ai/groundswell

**Installation:**

```bash
npm install groundswell
```

**Local Development Link:**

```bash
# In Groundswell directory
cd ~/projects/groundswell && npm link

# In project directory
cd /home/dustin/projects/hacky-hack && npm link groundswell
```

**Repository Structure:**

```
groundswell/
├── src/
│   ├── core/
│   │   ├── workflow.ts        # Main Workflow class
│   │   ├── agent.ts           # Agent class
│   │   ├── prompt.ts          # Prompt class
│   │   ├── factory.ts         # Factory functions
│   │   └── workflow-context.ts # Workflow context
│   ├── decorators/
│   │   ├── step.ts            # @Step decorator
│   │   ├── task.ts            # @Task decorator
│   │   └── observed-state.ts  # @ObservedState decorator
│   ├── cache/
│   ├── reflection/
│   ├── tools/
│   └── index.ts               # Main exports
├── examples/
│   ├── 01-basic-workflow.ts
│   ├── 02-decorator-options.ts
│   ├── 03-parent-child.ts
│   ├── 04-observers-debugger.ts
│   ├── 05-error-handling.ts
│   ├── 06-concurrent-tasks.ts
│   └── ...
├── docs/
│   ├── workflow.md
│   ├── agent.md
│   └── prompt.md
└── package.json
```

---

## 2. Workflow Class Usage

### Core Concepts

Workflows are hierarchical task containers with built-in logging, state observation, and event emission. Two patterns are supported:

#### Class-Based Pattern

```typescript
import { Workflow } from 'groundswell';

class DataProcessor extends Workflow {
  async run(): Promise<string[]> {
    this.setStatus('running');
    this.logger.info('Processing started');

    const result = await this.processData();

    this.setStatus('completed');
    return result;
  }

  private async processData(): Promise<string[]> {
    return ['item1', 'item2'];
  }
}

const workflow = new DataProcessor('MyProcessor');
const result = await workflow.run();
```

#### Functional Pattern

```typescript
import { createWorkflow } from 'groundswell';

const workflow = createWorkflow(
  { name: 'DataPipeline', enableReflection: true },
  async ctx => {
    const loaded = await ctx.step('load', async () => {
      return fetchData();
    });

    const processed = await ctx.step('process', async () => {
      return transform(loaded);
    });

    await ctx.step('save', async () => {
      return persist(processed);
    });

    return processed;
  }
);

const result = await workflow.run();
console.log(result.data); // The actual result
console.log(result.duration); // Execution time in ms
```

### Workflow Status Lifecycle

```
idle -> running -> completed
                -> failed
                -> cancelled
```

| Status      | Description             |
| ----------- | ----------------------- |
| `idle`      | Created but not started |
| `running`   | Currently executing     |
| `completed` | Finished successfully   |
| `failed`    | Terminated with error   |
| `cancelled` | Manually cancelled      |

### Built-in Logger

Every workflow has a structured logger:

```typescript
this.logger.debug('Debug message', { data });
this.logger.info('Info message');
this.logger.warn('Warning message');
this.logger.error('Error message', { error });
```

### Workflow Class API

```typescript
class Workflow<T = unknown> {
  readonly id: string;
  parent: Workflow | null;
  children: Workflow[];
  status: WorkflowStatus;

  constructor(name?: string, parent?: Workflow);
  constructor(config: WorkflowConfig, executor: WorkflowExecutor<T>);

  run(...args: unknown[]): Promise<T | WorkflowResult<T>>;

  protected setStatus(status: WorkflowStatus): void;
  protected readonly logger: WorkflowLogger;

  addObserver(observer: WorkflowObserver): void;
  removeObserver(observer: WorkflowObserver): void;
  attachChild(child: Workflow): void;
  detachChild(child: Workflow): void;
  snapshotState(): void;
  getNode(): WorkflowNode;
  emitEvent(event: WorkflowEvent): void;
}
```

**Source:** `/home/dustin/projects/groundswell/src/core/workflow.ts`

---

## 3. @Step Decorator Documentation

### Overview

The `@Step` decorator wraps methods with event emission, error handling, timing tracking, and optional state snapshots.

### Default Behavior

Without any options, `@Step()` automatically tracks timing information:

```typescript
@Step()  // Timing tracked by default
async processData(): Promise<void> {
  // Step logic here
}
```

### Configuration Options

| Option          | Type      | Default     | Description                                                                       |
| --------------- | --------- | ----------- | --------------------------------------------------------------------------------- |
| `name`          | `string`  | method name | Custom step name                                                                  |
| `trackTiming`   | `boolean` | `true`      | Include duration in `stepEnd` event. Set to `false` to eliminate timing overhead. |
| `snapshotState` | `boolean` | `false`     | Capture state snapshot after step completion                                      |
| `logStart`      | `boolean` | `false`     | Log message at step start                                                         |
| `logFinish`     | `boolean` | `false`     | Log message at step end (includes duration)                                       |

### Usage Examples

```typescript
import { Step } from 'groundswell';

class MyWorkflow extends Workflow {
  // Default - emits stepStart/stepEnd events
  @Step()
  async basicStep(): Promise<void> {}

  // Custom name
  @Step({ name: 'CustomStepName' })
  async namedStep(): Promise<void> {}

  // Capture state after completion
  @Step({ snapshotState: true })
  async snapshotStep(): Promise<void> {}

  // Track execution duration
  @Step({ trackTiming: true })
  async timedStep(): Promise<void> {}

  // Log start/end messages
  @Step({ logStart: true, logFinish: true })
  async loggedStep(): Promise<void> {}

  // All options
  @Step({
    name: 'FullStep',
    snapshotState: true,
    trackTiming: true,
    logStart: true,
    logFinish: true,
  })
  async fullStep(): Promise<void> {}
}
```

### Performance Note

Timing tracking has minimal overhead. Disable `trackTiming` only in performance-critical code paths with high-frequency execution.

### Events Emitted

The `@Step` decorator emits the following events:

1. **stepStart** - When step execution begins

   ```typescript
   {
     type: 'stepStart',
     node: WorkflowNode,
     step: string
   }
   ```

2. **stepEnd** - When step completes (if `trackTiming` is true)

   ```typescript
   {
     type: 'stepEnd',
     node: WorkflowNode,
     step: string,
     duration: number  // milliseconds
   }
   ```

3. **error** - If step throws an error

   ```typescript
   {
     type: 'error',
     node: WorkflowNode,
     error: WorkflowError
   }
   ```

4. **stateSnapshot** - If `snapshotState` is true
   ```typescript
   {
     type: 'stateSnapshot',
     node: WorkflowNode
   }
   ```

**Source:** `/home/dustin/projects/groundswell/src/decorators/step.ts`

---

## 4. TypeScript Examples

### Example 1: Basic Workflow

**File:** `/home/dustin/projects/groundswell/examples/examples/01-basic-workflow.ts`

```typescript
import { Workflow, WorkflowTreeDebugger } from 'groundswell';

class DataProcessingWorkflow extends Workflow {
  private data: string[] = [];

  async run(): Promise<string[]> {
    this.setStatus('running');
    this.logger.info('Starting data processing workflow');

    try {
      await this.loadData();
      await this.processData();
      await this.saveResults();

      this.setStatus('completed');
      this.logger.info('Workflow completed successfully');
      return this.data;
    } catch (error) {
      this.setStatus('failed');
      this.logger.error('Workflow failed', { error });
      throw error;
    }
  }

  private async loadData(): Promise<void> {
    this.data = ['item1', 'item2', 'item3'];
    this.logger.debug('Loaded items', { count: this.data.length });
  }

  private async processData(): Promise<void> {
    this.data = this.data.map(item => item.toUpperCase());
    this.logger.debug('Processed items', { data: this.data });
  }

  private async saveResults(): Promise<void> {
    this.logger.debug('Results saved');
  }
}

// Usage
const workflow = new DataProcessingWorkflow('DataProcessor');
const debugger_ = new WorkflowTreeDebugger(workflow);
const result = await workflow.run();
console.log(debugger_.toTreeString());
```

### Example 2: Decorator Options

**File:** `/home/dustin/projects/groundswell/examples/examples/02-decorator-options.ts`

```typescript
import {
  Workflow,
  Step,
  ObservedState,
  getObservedState,
  WorkflowTreeDebugger,
} from 'groundswell';

class StepOptionsWorkflow extends Workflow {
  @ObservedState()
  currentPhase: string = 'init';

  @ObservedState()
  itemsProcessed: number = 0;

  // Default step - minimal configuration
  @Step()
  async defaultStep(): Promise<void> {
    this.currentPhase = 'default';
  }

  // Step with custom name
  @Step({ name: 'CustomNamedStep' })
  async stepWithCustomName(): Promise<void> {
    this.currentPhase = 'custom-named';
  }

  // Step with state snapshot
  @Step({ snapshotState: true })
  async stepWithSnapshot(): Promise<void> {
    this.currentPhase = 'snapshot';
    this.itemsProcessed = 10;
    // State will be captured after this step
  }

  // Step with timing tracking
  @Step({ trackTiming: true })
  async stepWithTiming(): Promise<void> {
    this.currentPhase = 'timed';
  }

  // Step with start/finish logging
  @Step({ logStart: true, logFinish: true })
  async stepWithLogging(): Promise<void> {
    this.currentPhase = 'logged';
    this.logger.info('Inside the step - custom logging');
  }

  // Step with ALL options enabled
  @Step({
    name: 'FullyConfiguredStep',
    snapshotState: true,
    trackTiming: true,
    logStart: true,
    logFinish: true,
  })
  async fullyConfiguredStep(): Promise<void> {
    this.currentPhase = 'fully-configured';
    this.itemsProcessed = 100;
  }

  async run(): Promise<void> {
    this.setStatus('running');
    await this.defaultStep();
    await this.stepWithCustomName();
    await this.stepWithSnapshot();
    await this.stepWithTiming();
    await this.stepWithLogging();
    await this.fullyConfiguredStep();
    this.setStatus('completed');
  }
}
```

### Example 3: Parent-Child Workflows

```typescript
import { Workflow, Task } from 'groundswell';

class ChildWorkflow extends Workflow {
  async run(): Promise<void> {
    this.setStatus('running');
    this.logger.info('Child executing');
    this.setStatus('completed');
  }
}

class ParentWorkflow extends Workflow {
  @Task()
  async spawnChild(): Promise<ChildWorkflow> {
    return new ChildWorkflow('Child', this);
  }

  async run(): Promise<void> {
    this.setStatus('running');

    const child = await this.spawnChild();
    await child.run();

    // Access children
    console.log(this.children.length); // 1

    this.setStatus('completed');
  }
}
```

### Example 4: Functional Workflow with Context

```typescript
import { createWorkflow } from 'groundswell';

const workflow = createWorkflow({ name: 'DataPipeline' }, async ctx => {
  // Step 1: Load data
  const loaded = await ctx.step('load', async () => {
    return ['item1', 'item2', 'item3'];
  });

  // Step 2: Process data
  const processed = await ctx.step('process', async () => {
    return loaded.map(item => item.toUpperCase());
  });

  // Step 3: Save results
  await ctx.step('save', async () => {
    console.log('Saving:', processed);
  });

  return processed;
});

const result = await workflow.run();
console.log(result.data); // ['ITEM1', 'ITEM2', 'ITEM3']
console.log(result.duration); // Execution time in ms
```

### Example 5: Agent with Prompt

```typescript
import { createAgent, createPrompt } from 'groundswell';
import { z } from 'zod';

const agent = createAgent({
  name: 'AnalysisAgent',
  enableCache: true,
});

const prompt = createPrompt({
  user: 'Analyze this code for bugs',
  data: { code: 'function foo() { return 42; }' },
  responseFormat: z.object({
    bugs: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high']),
  }),
});

const result = await agent.prompt(prompt);
// result is typed: { bugs: string[], severity: 'low' | 'medium' | 'high' }
```

---

## 5. Error Handling Best Practices

### WorkflowError Structure

Errors in `@Step` methods are automatically wrapped in `WorkflowError` with full context:

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

### Best Practice 1: Always Use @Step for Error Wrapping

```typescript
class MyWorkflow extends Workflow {
  @ObservedState()
  currentItem = '';

  @Step({ snapshotState: true })
  async process(): Promise<void> {
    this.currentItem = 'item-1';
    throw new Error('Processing failed');
    // Error automatically wrapped with state snapshot
  }

  async run(): Promise<void> {
    try {
      await this.process();
    } catch (error) {
      const wfError = error as WorkflowError;
      console.log(wfError.message); // 'Processing failed'
      console.log(wfError.workflowId); // workflow ID
      console.log(wfError.state); // { currentItem: 'item-1' }
      console.log(wfError.logs); // logs up to error
      console.log(wfError.stack); // stack trace
    }
  }
}
```

### Best Practice 2: Implement Retry Logic with Exponential Backoff

```typescript
class RetryWorkflow extends Workflow {
  @ObservedState()
  attempt = 0;

  @Step()
  async unreliableOperation(): Promise<void> {
    this.attempt++;
    if (this.attempt < 3) {
      throw new Error('Temporary failure');
    }
  }

  async run(): Promise<void> {
    const maxAttempts = 3;

    while (this.attempt < maxAttempts) {
      try {
        await this.unreliableOperation();
        break;
      } catch (error) {
        if (this.attempt >= maxAttempts) throw error;
        await this.delay(1000 * this.attempt); // Exponential backoff
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
```

### Best Practice 3: Error Isolation in Parent-Child Workflows

Parent workflows can catch and handle child errors without failing entirely:

```typescript
class ResilientParent extends Workflow {
  @ObservedState()
  successfulChildren = 0;

  @ObservedState()
  failedChildren = 0;

  async run(): Promise<void> {
    for (const config of this.childConfigs) {
      const child = new ChildWorkflow(config, this);

      try {
        await child.run();
        this.successfulChildren++;
        this.logger.info(`Child ${config.name} succeeded`);
      } catch (error) {
        this.failedChildren++;
        this.logger.warn(`Child failed: ${error.message}`);
        // Continue with other children
      }
    }

    this.logger.info(
      `Completed: ${this.successfulChildren} succeeded, ${this.failedChildren} failed`
    );
  }
}
```

### Best Practice 4: Use ObservedState for Error Context

Mark important state fields with `@ObservedState` to capture context at error time:

```typescript
class ErrorDemoWorkflow extends Workflow {
  @ObservedState()
  currentStep: string = 'init';

  @ObservedState()
  itemsProcessed: number = 0;

  @ObservedState({ redact: true })
  sensitiveContext: string = 'secret-data';

  @Step({ snapshotState: true })
  async failingStep(): Promise<void> {
    this.currentStep = 'failing';
    this.itemsProcessed = 10;
    throw new Error('Something went wrong!');
    // Error will include: { currentStep: 'failing', itemsProcessed: 10, sensitiveContext: '***' }
  }
}
```

### Best Practice 5: Comprehensive Error Handling Example

**File:** `/home/dustin/projects/groundswell/examples/examples/05-error-handling.ts`

```typescript
import {
  Workflow,
  Step,
  Task,
  ObservedState,
  WorkflowError,
  WorkflowTreeDebugger,
  WorkflowObserver,
  WorkflowEvent,
} from 'groundswell';

// Workflow with retry logic
class RetryableWorkflow extends Workflow {
  @ObservedState()
  attempt: number = 0;

  @ObservedState()
  maxAttempts: number = 3;

  @ObservedState()
  success: boolean = false;

  private failUntilAttempt: number;

  constructor(name: string, failUntilAttempt: number = 2) {
    super(name);
    this.failUntilAttempt = failUntilAttempt;
  }

  @Step({ trackTiming: true, snapshotState: true })
  async unreliableOperation(): Promise<void> {
    this.attempt++;
    this.logger.info(`Attempt ${this.attempt}/${this.maxAttempts}`);

    if (this.attempt < this.failUntilAttempt) {
      throw new Error(`Simulated failure on attempt ${this.attempt}`);
    }

    this.success = true;
    this.logger.info('Operation succeeded!');
  }

  async run(): Promise<boolean> {
    this.setStatus('running');

    while (this.attempt < this.maxAttempts) {
      try {
        await this.unreliableOperation();
        this.setStatus('completed');
        return true;
      } catch (error) {
        const wfError = error as WorkflowError;
        this.logger.warn(`Attempt failed: ${wfError.message}`);

        if (this.attempt >= this.maxAttempts) {
          this.setStatus('failed');
          throw error;
        }

        this.logger.info('Retrying...');
        await sleep(100); // Backoff delay
      }
    }

    this.setStatus('failed');
    return false;
  }
}
```

### Error Event Handling

Subscribe to error events via observers:

```typescript
const observer: WorkflowObserver = {
  onLog: () => {},
  onEvent: event => {
    if (event.type === 'error') {
      console.log(`Error in ${event.node.name}:`);
      console.log(`  Message: ${event.error.message}`);
      console.log(`  State:`, event.error.state);
      console.log(`  Logs:`, event.error.logs);
    }
  },
  onStateUpdated: () => {},
  onTreeChanged: () => {},
};

workflow.addObserver(observer);
```

---

## 6. Running Workflows Programmatically

### Method 1: Direct Instantiation and Execution

```typescript
import { Workflow } from 'groundswell';

class MyWorkflow extends Workflow {
  async run(): Promise<string> {
    this.setStatus('running');
    this.logger.info('Starting workflow');
    // ... workflow logic
    this.setStatus('completed');
    return 'result';
  }
}

// Create and run
const workflow = new MyWorkflow('MyWorkflow');
const result = await workflow.run();
console.log(result); // 'result'
```

### Method 2: Functional Workflow with Factory

```typescript
import { createWorkflow } from 'groundswell';

const workflow = createWorkflow({ name: 'MyWorkflow' }, async ctx => {
  await ctx.step('step1', async () => {
    console.log('Step 1');
  });

  await ctx.step('step2', async () => {
    console.log('Step 2');
  });

  return 'done';
});

const result = await workflow.run();
console.log(result.data); // 'done'
console.log(result.duration); // Execution time
```

### Method 3: With Tree Debugger

```typescript
import { Workflow, WorkflowTreeDebugger } from 'groundswell';

const workflow = new MyWorkflow('MyWorkflow');
const debugger_ = new WorkflowTreeDebugger(workflow);

// Run workflow
const result = await workflow.run();

// Visualize results
console.log(debugger_.toTreeString());
console.log(debugger_.toLogString());
console.log(debugger_.getStats());
```

### Method 4: With Observers

```typescript
import {
  Workflow,
  WorkflowObserver,
  LogEntry,
  WorkflowEvent,
  WorkflowNode,
} from 'groundswell';

const observer: WorkflowObserver = {
  onLog(entry: LogEntry): void {
    console.log(`[${entry.level}] ${entry.message}`);
  },

  onEvent(event: WorkflowEvent): void {
    console.log(`Event: ${event.type}`);
  },

  onStateUpdated(node: WorkflowNode): void {
    console.log(`State updated: ${node.name}`);
  },

  onTreeChanged(root: WorkflowNode): void {
    console.log('Tree structure changed');
  },
};

const workflow = new MyWorkflow('MyWorkflow');
workflow.addObserver(observer);
await workflow.run();
```

### Method 5: Concurrent Workflows

```typescript
import { Workflow, Task } from 'groundswell';

class ParentWorkflow extends Workflow {
  @Task({ concurrent: true })
  async createWorkers(): Promise<WorkerWorkflow[]> {
    return [
      new WorkerWorkflow('Worker1', this),
      new WorkerWorkflow('Worker2', this),
      new WorkerWorkflow('Worker3', this),
    ];
  }

  async run(): Promise<void> {
    this.setStatus('running');

    // All workers created and attached
    const workers = await this.createWorkers();

    // Run all in parallel
    await Promise.all(workers.map(w => w.run()));

    this.setStatus('completed');
  }
}

const workflow = new ParentWorkflow('Parent');
await workflow.run();
```

### Method 6: Quick Workflow Factory

```typescript
import { quickWorkflow } from 'groundswell';

// One-liner workflow
const result = await quickWorkflow('MyWorkflow', async ctx => {
  await ctx.step('step1', async () => {
    return 'data';
  });

  return 'done';
});

console.log(result.data); // 'done'
```

### Programmatic Execution Examples

#### Sequential Execution

```typescript
for (const item of items) {
  const worker = await this.createWorker(item);
  await worker.run(); // waits for each
}
```

#### Parallel Execution with @Task

```typescript
@Task({ concurrent: true })
async createWorkers(): Promise<Worker[]> {
  return items.map(item => new Worker(item, this));
}

// All workers run in parallel when method completes
```

#### Manual Parallel Execution

```typescript
const workers = await Promise.all(items.map(item => this.createWorker(item)));

const results = await Promise.all(workers.map(w => w.run()));
```

#### Fan-Out / Fan-In Pattern

```typescript
class Pipeline extends Workflow {
  @Step()
  async fanOut(): Promise<string[]> {
    const workers = this.items.map(item => new Worker(item, this));

    // Run all in parallel
    return Promise.all(workers.map(w => w.run()));
  }

  @Step()
  async fanIn(results: string[]): Promise<void> {
    this.aggregatedResult = results.join(',');
  }

  async run(): Promise<void> {
    const results = await this.fanOut();
    await this.fanIn(results);
  }
}
```

---

## 7. Additional Resources

### Documentation Files

- **[Workflows Documentation](https://github.com/groundswell-ai/groundswell/blob/main/docs/workflow.md)** - Comprehensive workflow guide
  - Anchor: `#basic-usage`
  - Anchor: `#functional-pattern`
  - Anchor: `#decorators`
  - Anchor: `#parent-child-workflows`
  - Anchor: `#observers`
  - Anchor: `#tree-debugger`
  - Anchor: `#error-handling`
  - Anchor: `#concurrent-execution`
  - Anchor: `#api-reference`

- **[Agents Documentation](https://github.com/groundswell-ai/groundswell/blob/main/docs/agent.md)** - Agent usage guide
  - Anchor: `#basic-usage`
  - Anchor: `#configuration`
  - Anchor: `#executing-prompts`
  - Anchor: `#reflection`
  - Anchor: `#tools-and-mcp`
  - Anchor: `#hooks`
  - Anchor: `#caching`
  - Anchor: `#api-reference`

- **[Prompts Documentation](https://github.com/groundswell-ai/groundswell/blob/main/docs/prompt.md)** - Prompt usage guide

### Example Files

All examples located at: `/home/dustin/projects/groundswell/examples/examples/`

1. **[01-basic-workflow.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/01-basic-workflow.ts)** - Basic workflow usage
2. **[02-decorator-options.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/02-decorator-options.ts)** - Decorator configuration
3. **[03-parent-child.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/03-parent-child.ts)** - Hierarchical workflows
4. **[04-observers-debugger.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/04-observers-debugger.ts)** - Observers and debugging
5. **[05-error-handling.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/05-error-handling.ts)** - Error handling patterns
6. **[06-concurrent-tasks.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/06-concurrent-tasks.ts)** - Concurrent execution
7. **[07-agent-loops.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/07-agent-loops.ts)** - Agent integration
8. **[08-sdk-features.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/08-sdk-features.ts)** - Tools, MCPs, hooks
9. **[09-reflection.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/09-reflection.ts)** - Reflection system
10. **[10-introspection.ts](https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/10-introspection.ts)** - Introspection tools

### Running Examples

```bash
# Run all examples interactively
npm run start:all

# Run individual examples
npm run start:basic              # Basic workflow
npm run start:decorators         # Decorator options
npm run start:parent-child       # Hierarchical workflows
npm run start:observers          # Observers and debugger
npm run start:errors             # Error handling
npm run start:concurrent         # Concurrent tasks
npm run start:agent-loops        # Agent loops
npm run start:sdk-features       # Tools, MCPs, hooks
npm run start:reflection         # Multi-level reflection
npm run start:introspection      # Introspection tools
```

### Core Source Files

- **[Workflow Class](https://github.com/groundswell-ai/groundswell/blob/main/src/core/workflow.ts)** - Main workflow implementation
- **[@Step Decorator](https://github.com/groundswell-ai/groundswell/blob/main/src/decorators/step.ts)** - Step decorator implementation
- **[@Task Decorator](https://github.com/groundswell-ai/groundswell/blob/main/src/decorators/task.ts)** - Task decorator implementation
- **[@ObservedState Decorator](https://github.com/groundswell-ai/groundswell/blob/main/src/decorators/observed-state.ts)** - State observation decorator
- **[Agent Class](https://github.com/groundswell-ai/groundswell/blob/main/src/core/agent.ts)** - Agent implementation
- **[Prompt Class](https://github.com/groundswell-ai/groundswell/blob/main/src/core/prompt.ts)** - Prompt implementation
- **[Factory Functions](https://github.com/groundswell-ai/groundswell/blob/main/src/core/factory.ts)** - Factory functions
- **[Main Exports](https://github.com/groundswell-ai/groundswell/blob/main/src/index.ts)** - All public exports

### NPM Package

- **NPM:** https://www.npmjs.com/package/groundswell
- **Installation:** `npm install groundswell`
- **Requirements:** Node.js 18+, TypeScript 5.2+

### Key Exports

```typescript
// Core
import { Workflow, Agent, Prompt, MCPHandler } from 'groundswell';

// Factories
import {
  createWorkflow,
  createAgent,
  createPrompt,
  quickWorkflow,
  quickAgent,
} from 'groundswell';

// Decorators
import { Step, Task, ObservedState, getObservedState } from 'groundswell';

// Caching
import { LLMCache, defaultCache, generateCacheKey } from 'groundswell';

// Reflection
import { ReflectionManager, executeWithReflection } from 'groundswell';

// Introspection
import {
  INTROSPECTION_TOOLS,
  handleInspectCurrentNode,
  handleReadAncestorChain,
  // ... more introspection handlers
} from 'groundswell';

// Debugging
import { WorkflowTreeDebugger, Observable } from 'groundswell';
```

---

## Quick Reference

### Common Patterns

1. **Simple Workflow:**

   ```typescript
   class MyWorkflow extends Workflow {
     async run() {
       /* ... */
     }
   }
   const workflow = new MyWorkflow('Name');
   await workflow.run();
   ```

2. **With Steps:**

   ```typescript
   class MyWorkflow extends Workflow {
     @Step()
     async step1() {
       /* ... */
     }
     async run() {
       await this.step1();
     }
   }
   ```

3. **Functional:**

   ```typescript
   const workflow = createWorkflow({ name: 'Name' }, async ctx => {
     await ctx.step('step1', async () => {
       /* ... */
     });
   });
   await workflow.run();
   ```

4. **With Debugging:**

   ```typescript
   const debugger_ = new WorkflowTreeDebugger(workflow);
   await workflow.run();
   console.log(debugger_.toTreeString());
   ```

5. **With Agent:**
   ```typescript
   const agent = createAgent({ name: 'Agent' });
   const prompt = createPrompt({
     user: 'Hello',
     responseFormat: z.object({ response: z.string() }),
   });
   const result = await agent.prompt(prompt);
   ```

---

## Research Summary

This documentation was compiled from the following sources:

1. **Local Groundswell Repository:** `/home/dustin/projects/groundswell`
2. **Official Repository:** https://github.com/groundswell-ai/groundswell
3. **Documentation Files:** `/home/dustin/projects/groundswell/docs/*.md`
4. **Example Files:** `/home/dustin/projects/groundswell/examples/examples/*.ts`
5. **Source Code:** `/home/dustin/projects/groundswell/src/**/*.ts`

**Last Updated:** 2026-01-12
**Groundswell Version:** 0.0.1
