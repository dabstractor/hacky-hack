# Groundswell Workflow Testing Examples & Patterns Research

**Research Date:** 2025-01-15
**Groundswell Source:** `/home/dustin/projects/groundswell`
**Researcher:** Claude Code Agent

---

## Executive Summary

This document provides comprehensive research findings on Groundswell workflow testing patterns, including examples from the source code, test files, and documentation. The research covers testing strategies for workflow lifecycle methods, decorator patterns, event verification, state management, and error handling.

---

## 1. Groundswell Test Files Inventory

### 1.1 Unit Test Files

Located in `/home/dustin/projects/groundswell/src/__tests__/unit/`:

| Test File                                  | Focus Area                           | Key Testing Patterns                                                  |
| ------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------- |
| `workflow.test.ts`                         | Core workflow functionality          | Name validation, status management, observer patterns, error handling |
| `decorators.test.ts`                       | `@Step`, `@ObservedState` decorators | Decorator execution, event emission, state snapshots                  |
| `agent.test.ts`                            | Agent and MCP handler                | Agent creation, tool registration, MCP server management              |
| `context.test.ts`                          | AgentExecutionContext                | Context propagation, async boundaries, event capture                  |
| `observable.test.ts`                       | Observable class                     | Subscriber error handling, logger injection, backward compatibility   |
| `logger.test.ts`                           | WorkflowLogger                       | Child logger creation, parent-child log hierarchy                     |
| `workflow-detachChild.test.ts`             | Child detachment                     | Parent-child relationship management, event emission                  |
| `workflow-emitEvent-childDetached.test.ts` | Event propagation                    | onTreeChanged callback ordering, tree update events                   |
| `cache.test.ts`                            | LLM caching                          | Cache hits/misses, metrics                                            |
| `cache-key.test.ts`                        | Cache key generation                 | Deterministic key generation                                          |
| `prompt.test.ts`                           | Prompt validation                    | Zod schema validation                                                 |
| `reflection.test.ts`                       | Reflection system                    | Error recovery, retry logic                                           |
| `tree-debugger.test.ts`                    | Tree visualization                   | ASCII tree generation, statistics                                     |
| `tree-debugger-incremental.test.ts`        | Incremental tree updates             | Performance optimization                                              |
| `introspection-tools.test.ts`              | Introspection tools                  | Hierarchy navigation                                                  |
| `workflow-error-utils.test.ts`             | Error utilities                      | Error formatting, context extraction                                  |
| `workflow-isDescendantOf.test.ts`          | Hierarchy queries                    | Descendant detection                                                  |

### 1.2 Integration Test Files

Located in `/home/dustin/projects/groundswell/src/__tests__/integration/`:

| Test File                           | Focus Area                                                     |
| ----------------------------------- | -------------------------------------------------------------- |
| `agent-workflow.test.ts`            | Agent-workflow integration, context establishment, step events |
| `tree-mirroring.test.ts`            | Tree structure consistency                                     |
| `workflow-reparenting.test.ts`      | Detach-then-attach patterns                                    |
| `bidirectional-consistency.test.ts` | Parent-child bidirectional references                          |
| `observer-logging.test.ts`          | Observer error handling, logging integration                   |

### 1.3 Adversarial Test Files

Located in `/home/dustin/projects/groundswell/src/__tests__/adversarial/`:

| Test File                          | Focus Area                          |
| ---------------------------------- | ----------------------------------- |
| `circular-reference.test.ts`       | Circular parent-child relationships |
| `deep-hierarchy-stress.test.ts`    | Deep nesting performance            |
| `concurrent-task-failures.test.ts` | Parallel execution error handling   |
| `error-merge-strategy.test.ts`     | Multiple error aggregation          |
| `prd-compliance.test.ts`           | PRD requirements validation         |
| `edge-case.test.ts`                | Boundary conditions                 |
| `deep-analysis.test.ts`            | Complex scenario analysis           |

---

## 2. Core Testing Patterns

### 2.1 Testing the `run()` Method

**Pattern 1: Basic workflow execution**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/workflow.test.ts

class SimpleWorkflow extends Workflow {
  async run(): Promise<string> {
    this.setStatus('running');
    this.logger.info('Running simple workflow');
    this.setStatus('completed');
    return 'done';
  }
}

it('should start with idle status', () => {
  const wf = new SimpleWorkflow();
  expect(wf.status).toBe('idle');
  expect(wf.getNode().status).toBe('idle');
});
```

**Pattern 2: Status transitions during run()**

```typescript
it('should emit treeUpdated event when status changes', () => {
  const wf = new SimpleWorkflow();
  const events: WorkflowEvent[] = [];
  const treeChangedCalls: WorkflowNode[] = [];

  const observer: WorkflowObserver = {
    onLog: () => {},
    onEvent: event => events.push(event),
    onStateUpdated: () => {},
    onTreeChanged: root => treeChangedCalls.push(root),
  };

  wf.addObserver(observer);
  wf.setStatus('running');

  const treeUpdatedEvent = events.find(e => e.type === 'treeUpdated');
  expect(treeUpdatedEvent).toBeDefined();
  expect(treeChangedCalls).toHaveLength(1);
});
```

### 2.2 Testing `@Step` Decorator Options

**Pattern 1: Step execution with timing tracking**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/decorators.test.ts

class StepTestWorkflow extends Workflow {
  stepCalled = false;

  @Step({ trackTiming: true })
  async myStep(): Promise<string> {
    this.stepCalled = true;
    return 'step result';
  }

  async run(): Promise<void> {
    await this.myStep();
  }
}

it('should execute the original method', async () => {
  const wf = new StepTestWorkflow();
  await wf.run();
  expect(wf.stepCalled).toBe(true);
});
```

**Pattern 2: Step event emission verification**

```typescript
it('should emit stepStart and stepEnd events', async () => {
  const wf = new StepTestWorkflow();
  const events: WorkflowEvent[] = [];

  wf.addObserver({
    onLog: () => {},
    onEvent: e => events.push(e),
    onStateUpdated: () => {},
    onTreeChanged: () => {},
  });

  await wf.run();

  const startEvent = events.find(e => e.type === 'stepStart');
  const endEvent = events.find(e => e.type === 'stepEnd');

  expect(startEvent).toBeDefined();
  expect(endEvent).toBeDefined();
  if (endEvent?.type === 'stepEnd') {
    expect(endEvent.duration).toBeGreaterThanOrEqual(0);
  }
});
```

**Pattern 3: Step error wrapping**

```typescript
it('should wrap errors in WorkflowError', async () => {
  class FailingWorkflow extends Workflow {
    @Step()
    async failingStep(): Promise<void> {
      throw new Error('Step failed');
    }

    async run(): Promise<void> {
      await this.failingStep();
    }
  }

  const wf = new FailingWorkflow();

  await expect(wf.run()).rejects.toMatchObject({
    message: 'Step failed',
    workflowId: wf.id,
  });
});
```

**From Examples - All @Step Options:**

```typescript
// From: /home/dustin/projects/groundswell/examples/examples/02-decorator-options.ts

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
  await sleep(100);
}
```

### 2.3 Testing `@Task` Decorator Child Attachment

**Pattern 1: Single child attachment**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/workflow.test.ts

it('should attach child to parent', () => {
  const parent = new SimpleWorkflow('Parent');
  const child = new SimpleWorkflow('Child', parent);

  expect(child.parent).toBe(parent);
  expect(parent.children).toContain(child);
  expect(parent.getNode().children).toContain(child.getNode());
});
```

**Pattern 2: childAttached event emission**

```typescript
it('should emit childAttached event', () => {
  const parent = new SimpleWorkflow('Parent');
  const events: WorkflowEvent[] = [];

  const observer: WorkflowObserver = {
    onLog: () => {},
    onEvent: event => events.push(event),
    onStateUpdated: () => {},
    onTreeChanged: () => {},
  };

  parent.addObserver(observer);
  const child = new SimpleWorkflow('Child', parent);

  const attachEvent = events.find(e => e.type === 'childAttached');
  expect(attachEvent).toBeDefined();
  expect(attachEvent?.type === 'childAttached' && attachEvent.parentId).toBe(
    parent.id
  );
});
```

**From Examples - @Task with concurrent option:**

```typescript
// From: /home/dustin/projects/groundswell/examples/examples/06-concurrent-tasks.ts

@Task({ concurrent: true })
async createAllWorkers(): Promise<WorkerWorkflow[]> {
  return this.workers.map(
    (config) => new WorkerWorkflow(config.id, config.time, this)
  );
}

// Note: The concurrent option auto-runs the returned workflows
await this.createAllWorkers(); // All workers run in parallel
```

### 2.4 Testing `@ObservedState` and `snapshotState()`

**Pattern 1: ObservedState decorator options**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/decorators.test.ts

class StateTestWorkflow extends Workflow {
  @ObservedState()
  publicField: string = 'public';

  @ObservedState({ redact: true })
  secretField: string = 'secret';

  @ObservedState({ hidden: true })
  hiddenField: string = 'hidden';

  async run(): Promise<void> {}
}

it('should include public fields in snapshot', () => {
  const wf = new StateTestWorkflow();
  const state = getObservedState(wf);
  expect(state.publicField).toBe('public');
});

it('should redact secret fields', () => {
  const wf = new StateTestWorkflow();
  const state = getObservedState(wf);
  expect(state.secretField).toBe('***');
});

it('should exclude hidden fields', () => {
  const wf = new StateTestWorkflow();
  const state = getObservedState(wf);
  expect('hiddenField' in state).toBe(false);
});
```

**Pattern 2: State capture in error events**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/workflow.test.ts

it('should capture @ObservedState fields in workflow error state', async () => {
  class StatefulWorkflowClass extends Workflow {
    @ObservedState()
    stepCount: number = 0;

    @ObservedState({ redact: true })
    apiKey: string = 'secret-key-123';

    @ObservedState({ hidden: true })
    internalCounter: number = 42;
  }

  const events: WorkflowEvent[] = [];
  const observer: WorkflowObserver = {
    onLog: () => {},
    onEvent: event => events.push(event),
    onStateUpdated: () => {},
    onTreeChanged: () => {},
  };

  const workflow = new StatefulWorkflowClass(
    { name: 'StatefulErrorTest' },
    async ctx => {
      (workflow as any).stepCount = 5;
      (workflow as any).apiKey = 'updated-key';
      (workflow as any).internalCounter = 99;

      await ctx.step('failing-step', async () => {
        throw new Error('Error after state update');
      });
    }
  );

  workflow.addObserver(observer);
  await expect(workflow.run()).rejects.toThrow('Error after state update');

  const errorEvents = events.filter(e => e.type === 'error');
  const errorEvent = errorEvents[0];

  // Verify public field value is captured
  expect(errorEvent.error.state.stepCount).toBe(5);

  // Verify redacted field shows '***'
  expect(errorEvent.error.state.apiKey).toBe('***');

  // Verify hidden field is NOT in state
  expect('internalCounter' in errorEvent.error.state).toBe(false);
});
```

### 2.5 Testing Event Verification Patterns

**Pattern 1: Capturing and filtering events**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/integration/agent-workflow.test.ts

it('should establish context in @Step decorated methods', async () => {
  const workflow = new MockAgentWorkflow('TestWorkflow');
  const events: WorkflowEvent[] = [];

  const observer: WorkflowObserver = {
    onLog: () => {},
    onEvent: event => events.push(event),
    onStateUpdated: () => {},
    onTreeChanged: () => {},
  };

  workflow.addObserver(observer);
  await workflow.run();

  // Should have step start/end events
  const stepStarts = events.filter(e => e.type === 'stepStart');
  const stepEnds = events.filter(e => e.type === 'stepEnd');

  expect(stepStarts).toHaveLength(2);
  expect(stepEnds).toHaveLength(2);
});
```

**Pattern 2: Event type guards for discriminated unions**

```typescript
// Type-safe event payload access
const detachEvent = events.find(e => e.type === 'childDetached');
expect(detachEvent).toBeDefined();
expect(detachEvent?.type === 'childDetached' && detachEvent.parentId).toBe(
  parent.id
);
expect(detachEvent?.type === 'childDetached' && detachEvent.childId).toBe(
  child.id
);
```

**Pattern 3: Event ordering verification**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/workflow-emitEvent-childDetached.test.ts

it('should call onEvent() before onTreeChanged() for childDetached', () => {
  const parent = new SimpleWorkflow('Parent');
  const callOrder: string[] = [];

  const observer: WorkflowObserver = {
    onLog: () => {},
    onEvent: () => callOrder.push('onEvent'),
    onStateUpdated: () => {},
    onTreeChanged: () => callOrder.push('onTreeChanged'),
  };

  parent.addObserver(observer);
  const child = new SimpleWorkflow('Child', parent);
  callOrder.length = 0;
  parent.detachChild(child);

  expect(callOrder).toEqual(['onEvent', 'onTreeChanged']);
});
```

---

## 3. Mocking Workflow Dependencies

### 3.1 Mocking Observers

**Pattern 1: No-op observer**

```typescript
const observer: WorkflowObserver = {
  onLog: () => {},
  onEvent: () => {},
  onStateUpdated: () => {},
  onTreeChanged: () => {},
};
```

**Pattern 2: Event-capturing observer**

```typescript
const events: WorkflowEvent[] = [];
const logs: LogEntry[] = [];

const observer: WorkflowObserver = {
  onLog: entry => logs.push(entry),
  onEvent: event => events.push(event),
  onStateUpdated: () => {},
  onTreeChanged: () => {},
};
```

**Pattern 3: Throwing observer for error testing**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/integration/observer-logging.test.ts

const throwingObserver: WorkflowObserver = {
  onLog: () => {
    throw new Error('Observer onLog error');
  },
  onEvent: () => {},
  onStateUpdated: () => {},
  onTreeChanged: () => {},
};
```

### 3.2 Mocking Context

**Pattern 1: Mock context for testing**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/context.test.ts

const createMockNode = (name: string): WorkflowNode => ({
  id: `node-${name}`,
  name,
  parent: null,
  children: [],
  status: 'running',
  logs: [],
  events: [],
  stateSnapshot: null,
});

const createMockContext = (name: string): AgentExecutionContext => ({
  workflowNode: createMockNode(name),
  emitEvent: () => {},
  workflowId: `workflow-${name}`,
});
```

### 3.3 Mocking Logger

**Pattern 1: Mock logger for Observable**

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/observable.test.ts

import { vi } from 'vitest';

const mockLogger: ObservableLogger = {
  error: vi.fn(),
};

const observable = new Observable<number>(mockLogger);
```

---

## 4. Error Handling Testing Patterns

### 4.1 Testing WorkflowError Structure

**From Examples:**

```typescript
// From: /home/dustin/projects/groundswell/examples/examples/05-error-handling.ts

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
    this.logger.info('About to fail...');
    await sleep(30);
    throw new Error('Something went wrong in failingStep!');
  }
}

// Usage:
let capturedError: WorkflowError | null = null;

try {
  await workflow.run();
} catch (error) {
  capturedError = error as WorkflowError;
}

console.log('Error caught and wrapped in WorkflowError:');
console.log(`  message: ${capturedError?.message}`);
console.log(`  workflowId: ${capturedError?.workflowId}`);
console.log(`  stack: ${capturedError?.stack?.split('\n')[0]}...`);
console.log('\nState snapshot at time of error:');
console.log(JSON.stringify(capturedError?.state, null, 2));
console.log('\nLogs at time of error:');
capturedError?.logs.forEach(log => {
  console.log(`  [${log.level}] ${log.message}`);
});
```

### 4.2 Testing Retry Logic

```typescript
// From: /home/dustin/projects/groundswell/examples/examples/05-error-handling.ts

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
    await sleep(50);

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
        await sleep(100);
      }
    }

    this.setStatus('failed');
    return false;
  }
}
```

### 4.3 Testing Error Isolation in Hierarchies

```typescript
// Parent workflow with error recovery
class ResilientParentWorkflow extends Workflow {
  @ObservedState()
  successfulChildren: number = 0;

  @ObservedState()
  failedChildren: number = 0;

  @Task()
  async spawnChild(config: {
    name: string;
    shouldFail: boolean;
  }): Promise<FailableChildWorkflow> {
    return new FailableChildWorkflow(config.name, config.shouldFail, this);
  }

  async run(): Promise<{ success: number; failed: number }> {
    this.setStatus('running');

    for (const config of this.childConfigs) {
      const child = await this.spawnChild(config);

      try {
        await child.run();
        this.successfulChildren++;
      } catch (error) {
        this.failedChildren++;
        // Continue with other children instead of failing entirely
      }
    }

    this.setStatus('completed');
    return { success: this.successfulChildren, failed: this.failedChildren };
  }
}
```

---

## 5. Testing Lifecycle Methods

### 5.1 Testing Workflow Constructor

```typescript
it('should use class name when name is undefined', () => {
  const wf = new SimpleWorkflow();
  expect(wf.getNode().name).toBe('SimpleWorkflow');
});

it('should reject empty string name', () => {
  expect(() => new SimpleWorkflow('')).toThrow('Workflow name cannot be empty');
});
```

### 5.2 Testing Child Attachment/Detachment

```typescript
it('should remove child from parent.children array', () => {
  const parent = new SimpleWorkflow('Parent');
  const child = new SimpleWorkflow('Child', parent);

  expect(parent.children).toContain(child);

  parent.detachChild(child);

  expect(parent.children).not.toContain(child);
  expect(child.parent).toBeNull();
});
```

### 5.3 Testing Status Changes

```typescript
it('should start with idle status', () => {
  const wf = new SimpleWorkflow();
  expect(wf.status).toBe('idle');
  expect(wf.getNode().status).toBe('idle');
});
```

---

## 6. Testing Async Context Propagation

### 6.1 Testing Context Through Async Boundaries

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/context.test.ts

it('should propagate context through nested async calls', async () => {
  const ctx = createMockContext('root');

  const nested = async () => {
    const innerCtx = getExecutionContext();
    return innerCtx?.workflowNode.name;
  };

  await runInContext(ctx, async () => {
    const name = await nested();
    expect(name).toBe('root');
  });
});
```

### 6.2 Testing Nested Contexts

```typescript
it('should allow nested contexts', async () => {
  const outerCtx = createMockContext('outer');
  const innerCtx = createMockContext('inner');

  await runInContext(outerCtx, async () => {
    expect(getExecutionContext()?.workflowNode.name).toBe('outer');

    await runInContext(innerCtx, async () => {
      expect(getExecutionContext()?.workflowNode.name).toBe('inner');
    });

    // Should restore outer context
    expect(getExecutionContext()?.workflowNode.name).toBe('outer');
  });
});
```

---

## 7. Testing Observable Pattern

### 7.1 Testing Subscriber Error Isolation

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/unit/observable.test.ts

it('should continue notifying other subscribers after one throws', () => {
  const observable = new Observable<number>(mockLogger);
  const testError = new Error('First subscriber error');

  const results: number[] = [];

  const throwingSubscriber = {
    next: () => {
      throw testError;
    },
  };

  const workingSubscriber = {
    next: (value: number) => {
      results.push(value);
    },
  };

  observable.subscribe(throwingSubscriber);
  observable.subscribe(workingSubscriber);
  observable.next(42);

  expect(results).toEqual([42]);
  expect(mockLogger.error).toHaveBeenCalled();
});
```

### 7.2 Testing Subscription Lifecycle

```typescript
it('should support subscribe/unsubscribe cycle', () => {
  const observable = new Observable<number>();
  const results: number[] = [];

  const subscriber = {
    next: (value: number) => {
      results.push(value);
    },
  };

  const subscription = observable.subscribe(subscriber);
  observable.next(1);
  subscription.unsubscribe();
  observable.next(2);

  expect(results).toEqual([1]);
});
```

---

## 8. Testing with Functional Workflows

### 8.1 Testing Functional Pattern with step()

```typescript
// From: /home/dustin/projects/groundswell/src/__tests__/integration/agent-workflow.test.ts

it('should support functional workflow pattern with step()', async () => {
  const events: WorkflowEvent[] = [];

  const workflow = new Workflow<string>(
    { name: 'FunctionalWorkflow' },
    async ctx => {
      await ctx.step('step-a', async () => {
        return 'a';
      });

      await ctx.step('step-b', async () => {
        return 'b';
      });

      return 'completed';
    }
  );

  const observer: WorkflowObserver = {
    onLog: () => {},
    onEvent: event => events.push(event),
    onStateUpdated: () => {},
    onTreeChanged: () => {},
  };

  workflow.addObserver(observer);
  const result = await workflow.run();

  expect(result).toEqual({
    data: 'completed',
    node: expect.any(Object),
    duration: expect.any(Number),
  });

  const stepStarts = events.filter(e => e.type === 'stepStart');
  const stepEnds = events.filter(e => e.type === 'stepEnd');

  expect(stepStarts).toHaveLength(2);
  expect(stepEnds).toHaveLength(2);
});
```

---

## 9. Test Configuration

### 9.1 Vitest Configuration

```typescript
// From: /home/dustin/projects/groundswell/vitest.config.ts

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      // Handle .js extensions in imports for TypeScript files
    },
  },
  esbuild: {
    target: 'node18',
  },
});
```

---

## 10. Key Testing Utilities and Helpers

### 10.1 WorkflowNode Helper

```typescript
const createMockNode = (name: string): WorkflowNode => ({
  id: `node-${name}`,
  name,
  parent: null,
  children: [],
  status: 'running',
  logs: [],
  events: [],
  stateSnapshot: null,
});
```

### 10.2 AgentExecutionContext Helper

```typescript
const createMockContext = (name: string): AgentExecutionContext => ({
  workflowNode: createMockNode(name),
  emitEvent: () => {},
  workflowId: `workflow-${name}`,
});
```

### 10.3 Sleep Helper (for testing timing)

```typescript
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 11. Testing Best Practices Observed

### 11.1 Arrange-Act-Assert Pattern

All tests follow clear AAA structure:

```typescript
it('should emit childDetached event with correct payload', () => {
  // Arrange
  const parent = new SimpleWorkflow('Parent');
  const events: WorkflowEvent[] = [];
  const observer = {
    /* ... */
  };

  parent.addObserver(observer);
  const child = new SimpleWorkflow('Child', parent);
  events.length = 0; // Clear attachChild events

  // Act
  parent.detachChild(child);

  // Assert
  const detachEvent = events.find(e => e.type === 'childDetached');
  expect(detachEvent).toBeDefined();
  expect(detachEvent?.type === 'childDetached' && detachEvent.parentId).toBe(
    parent.id
  );
});
```

### 11.2 Type-Safe Event Discrimination

Using TypeScript type guards for discriminated unions:

```typescript
// Type narrowing before accessing payload
expect(detachEvent?.type === 'childDetached' && detachEvent.parentId).toBe(
  parent.id
);
```

### 11.3 Event Isolation

Clearing event arrays between test phases:

```typescript
events.length = 0; // Clear setup events
treeChanges.length = 0; // Clear attachChild tree changes
```

### 11.4 Spy Usage

```typescript
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
// Test logic...
expect(consoleErrorSpy).toHaveBeenCalledWith('expected message');
consoleErrorSpy.mockRestore();
```

---

## 12. Direct Links to Groundswell Test Files

All test files located at: `/home/dustin/projects/groundswell/src/__tests__/`

**Unit Tests:**

- `/home/dustin/projects/groundswell/src/__tests__/unit/workflow.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/decorators.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/agent.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/context.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/observable.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/logger.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/workflow-detachChild.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/workflow-emitEvent-childDetached.test.ts`

**Integration Tests:**

- `/home/dustin/projects/groundswell/src/__tests__/integration/agent-workflow.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/integration/observer-logging.test.ts`

**Example Files:**

- `/home/dustin/projects/groundswell/examples/examples/01-basic-workflow.ts`
- `/home/dustin/projects/groundswell/examples/examples/02-decorator-options.ts`
- `/home/dustin/projects/groundswell/examples/examples/05-error-handling.ts`
- `/home/dustin/projects/groundswell/examples/examples/06-concurrent-tasks.ts`

---

## 13. Summary of Testing Patterns

### 13.1 Core Testing Concepts

1. **Observer Pattern**: Use `WorkflowObserver` to capture events, logs, and state changes
2. **Event Filtering**: Filter captured events by type for specific assertions
3. **Type Guards**: Use discriminated union type guards for type-safe event access
4. **Status Verification**: Check workflow status at different lifecycle points
5. **State Snapshots**: Verify `@ObservedState` fields are captured correctly
6. **Error Context**: Verify errors contain state, logs, and workflowId
7. **Parent-Child**: Test attachment/detachment with event verification
8. **Async Context**: Verify context propagates through async boundaries
9. **Timing**: Use `@Step({ trackTiming: true })` and verify duration in stepEnd events
10. **Isolation**: Ensure observer errors don't crash workflows

### 13.2 Testing Checklist

When testing Groundswell workflows, verify:

- [ ] Workflow creates with unique ID
- [ ] Workflow uses class name or custom name correctly
- [ ] Status transitions: idle → running → completed/failed
- [ ] childAttached event fires when attaching children
- [ ] childDetached event fires when detaching children
- [ ] stepStart/stepEnd events fire for @Step methods
- [ ] Duration is captured in stepEnd when trackTiming: true
- [ ] State snapshots are captured when snapshotState: true
- [ ] @ObservedState fields are included/excluded/redacted correctly
- [ ] Errors are wrapped in WorkflowError with full context
- [ ] Observer callbacks are called in correct order
- [ ] Multiple observers all receive notifications
- [ ] Context propagates through async boundaries
- [ ] Console is NOT used for observer errors (logged to workflow.node.logs)

---

## 14. Online Resources

**Note:** Web search was unavailable during research due to API limits. All findings are from the Groundswell source code at `/home/dustin/projects/groundswell`.

**Recommended next steps for online research:**

1. Search GitHub for "Groundswell workflow testing examples"
2. Look for npm package documentation
3. Check for GitHub issues or discussions about testing patterns
4. Search for TypeScript decorator testing best practices
5. Research workflow orchestration testing patterns in general

---

## 15. Conclusion

The Groundswell codebase provides excellent examples of testing patterns for:

- **Workflow lifecycle**: Status changes, parent-child relationships
- **Decorators**: `@Step`, `@Task`, `@ObservedState` options and behavior
- **Event system**: Event emission, capture, filtering, and verification
- **State management**: State snapshots, redaction, hiding fields
- **Error handling**: WorkflowError structure, retry logic, error isolation
- **Async context**: Context propagation through async boundaries
- **Observers**: Multiple observers, error handling, callback ordering

The test suite is comprehensive, well-organized, and follows testing best practices. The examples directory provides runnable demonstrations of all features.

**Key Takeaway:** Groundswell's testing approach emphasizes event-driven verification using the `WorkflowObserver` pattern, type-safe event discrimination, and comprehensive error context capture.
