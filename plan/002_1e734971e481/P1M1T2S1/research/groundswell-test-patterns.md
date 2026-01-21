# Groundswell Workflow Lifecycle Testing Patterns

**Research Date:** 2026-01-15
**Status:** ✅ Complete
**Focus:** Comprehensive test patterns for Groundswell Workflow lifecycle testing

---

## Executive Summary

This document consolidates test patterns for Groundswell Workflow lifecycle testing based on analysis of existing test suites, workflow implementations, and Groundswell library architecture. Key findings include established patterns for mocking Anthropic SDK, testing decorators, lifecycle methods, and hierarchical relationships.

---

## 1. Testing Class-Based Workflow Extensions

### Pattern: Extending Workflow Base Class

**Implementation Pattern:**

```typescript
import { Workflow, Step } from 'groundswell';

export class MyWorkflow extends Workflow {
  constructor(param1: string, param2: string[]) {
    super('MyWorkflow');
    // Validation logic
    if (!param1 || param1.trim() === '') {
      throw new Error('param1 cannot be empty');
    }
    this.param1 = param1;
    this.param2 = param2;
  }

  @Step({ trackTiming: true })
  async processStep(): Promise<void> {
    // Step implementation
  }

  async run(): Promise<ResultType> {
    this.setStatus('running');
    try {
      await this.processStep();
      this.setStatus('completed');
      return result;
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Test Pattern:**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MyWorkflow } from './my-workflow.js';

describe('MyWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw if param1 is empty', () => {
      expect(() => new MyWorkflow('', [])).toThrow('param1 cannot be empty');
    });

    it('should throw if param1 is only whitespace', () => {
      expect(() => new MyWorkflow('   ', [])).toThrow('param1 cannot be empty');
    });

    it('should initialize with provided values', () => {
      const workflow = new MyWorkflow('test', ['item1', 'item2']);
      expect(workflow.param1).toBe('test');
      expect(workflow.param2).toEqual(['item1', 'item2']);
    });
  });

  describe('run', () => {
    it('should set status to running before execution', async () => {
      const workflow = new MyWorkflow('test', []);
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      await workflow.run();

      expect(setStatusSpy).toHaveBeenNthCalledWith(1, 'running');
      expect(setStatusSpy).toHaveBeenNthCalledWith(2, 'completed');
    });

    it('should set status to failed on error', async () => {
      const workflow = new MyWorkflow('test', []);
      vi.spyOn(workflow, 'processStep').mockRejectedValue(
        new Error('Test error')
      );
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      try {
        await workflow.run();
      } catch {
        // Expected error
      }

      expect(setStatusSpy).toHaveBeenCalledWith('running');
      expect(setStatusSpy).toHaveBeenCalledWith('failed');
      expect(setStatusSpy).not.toHaveBeenCalledWith('completed');
    });
  });
});
```

**Key Test Considerations:**

1. Test constructor validation with edge cases (empty, whitespace, wrong types)
2. Test status transitions through lifecycle (idle → running → completed/failed)
3. Use spies to verify method call order and status changes
4. Test error handling and status rollback

---

## 2. Testing @Step Decorator with trackTiming and Event Emission

### Pattern: @Step Decorator Usage

**Implementation:**

```typescript
class MyWorkflow extends Workflow {
  @Step({ trackTiming: true })
  async processItem(): Promise<string[]> {
    // Step logic
    return ['item1', 'item2'];
  }
}
```

**Test Pattern for Event Emission:**

```typescript
describe('processItem', () => {
  it('should execute step and return results', async () => {
    const workflow = new MyWorkflow('test', []);
    const result = await workflow.processItem();
    expect(result).toEqual(['item1', 'item2']);
  });

  it('should track timing information', async () => {
    const workflow = new MyWorkflow('test', []);
    const startTime = Date.now();

    await workflow.processItem();

    const duration = Date.now() - startTime;
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should emit stepStart event', async () => {
    const workflow = new MyWorkflow('test', []);
    const emitEventSpy = vi.spyOn(workflow, 'emitEvent');

    await workflow.processItem();

    expect(emitEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'stepStart',
        step: 'processItem',
      })
    );
  });

  it('should emit stepEnd event with duration', async () => {
    const workflow = new MyWorkflow('test', []);
    const emitEventSpy = vi.spyOn(workflow, 'emitEvent');

    await workflow.processItem();

    expect(emitEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'stepEnd',
        step: 'processItem',
        duration: expect.any(Number),
      })
    );
  });

  it('should include duration when trackTiming is true', async () => {
    const workflow = new MyWorkflow('test', []);
    const emitEventSpy = vi.spyOn(workflow, 'emitEvent');

    await workflow.processItem();

    const stepEndCall = emitEventSpy.mock.calls.find(
      call => call[0].type === 'stepEnd'
    );
    expect(stepEndCall?.[0]).toHaveProperty('duration');
  });
});
```

**Testing Event Observer Pattern:**

```typescript
describe('Event propagation', () => {
  it('should notify observers of step events', async () => {
    const workflow = new MyWorkflow('test', []);
    const observer = {
      onEvent: vi.fn(),
      onLog: vi.fn(),
      onStateUpdated: vi.fn(),
      onTreeChanged: vi.fn(),
    };

    workflow.addObserver(observer);
    await workflow.processItem();

    expect(observer.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'stepStart',
      })
    );
    expect(observer.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'stepEnd',
      })
    );
  });
});
```

**Key Test Considerations:**

1. Verify step execution returns expected results
2. Test event emission (stepStart, stepEnd, error)
3. Verify timing information is included when trackTiming is true
4. Test observer notification for step events
5. Verify events include proper context (workflow node, step name, duration)

---

## 3. Testing @Task Decorator for Parent-Child Relationships

### Pattern: @Task Decorator for Child Workflows

**Implementation:**

```typescript
class ParentWorkflow extends Workflow {
  @Task()
  async spawnChild(): Promise<ChildWorkflow> {
    return new ChildWorkflow('child1', this);
  }

  @Task({ concurrent: true })
  async spawnMultipleChildren(): Promise<ChildWorkflow[]> {
    return [
      new ChildWorkflow('child1', this),
      new ChildWorkflow('child2', this),
    ];
  }
}
```

**Test Pattern:**

```typescript
describe('Parent-child relationships', () => {
  it('should attach child workflow automatically', async () => {
    const parent = new ParentWorkflow('parent');
    const child = await parent.spawnChild();

    expect(child.parent).toBe(parent);
    expect(parent.children).toContain(child);
  });

  it('should attach multiple concurrent children', async () => {
    const parent = new ParentWorkflow('parent');
    const children = await parent.spawnMultipleChildren();

    expect(children).toHaveLength(2);
    expect(parent.children).toHaveLength(2);

    children.forEach(child => {
      expect(child.parent).toBe(parent);
      expect(parent.children).toContain(child);
    });
  });

  it('should emit taskStart and taskEnd events', async () => {
    const parent = new ParentWorkflow('parent');
    const emitEventSpy = vi.spyOn(parent, 'emitEvent');

    await parent.spawnChild();

    expect(emitEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'taskStart' })
    );
    expect(emitEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'taskEnd' })
    );
  });

  it('should propagate child events to parent observer', async () => {
    const parent = new ParentWorkflow('parent');
    const observer = {
      onEvent: vi.fn(),
      onLog: vi.fn(),
      onStateUpdated: vi.fn(),
      onTreeChanged: vi.fn(),
    };

    parent.addObserver(observer);
    const child = await parent.spawnChild();
    child.setStatus('running');

    // Parent observer should receive child events
    expect(observer.onEvent).toHaveBeenCalled();
  });
});
```

**Key Test Considerations:**

1. Verify automatic child attachment (child.parent, parent.children)
2. Test concurrent child execution
3. Verify task lifecycle events (taskStart, taskEnd)
4. Test event propagation from children to parent observers
5. Validate hierarchy integrity

---

## 4. Testing @ObservedState and snapshotState()

### Pattern: @ObservedState Decorator

**Implementation:**

```typescript
class MyWorkflow extends Workflow {
  @ObservedState()
  progress: number = 0;

  @ObservedState()
  processedItems: string[] = [];

  @ObservedState({ redact: true })
  apiKey: string = 'secret';
}
```

**Test Pattern for Observed State:**

```typescript
describe('Observed state', () => {
  it('should initialize with default values', () => {
    const workflow = new MyWorkflow('test', []);
    expect(workflow.progress).toBe(0);
    expect(workflow.processedItems).toEqual([]);
  });

  it('should update state during execution', async () => {
    const workflow = new MyWorkflow('test', []);
    workflow.progress = 50;
    workflow.processedItems = ['item1'];

    expect(workflow.progress).toBe(50);
    expect(workflow.processedItems).toEqual(['item1']);
  });
});
```

**Test Pattern for snapshotState():**

```typescript
describe('State snapshots', () => {
  it('should capture state snapshot', () => {
    const workflow = new MyWorkflow('test', []);
    workflow.progress = 75;
    workflow.processedItems = ['item1', 'item2'];

    workflow.snapshotState();

    expect(workflow.node.stateSnapshot).toEqual({
      progress: 75,
      processedItems: ['item1', 'item2'],
    });
  });

  it('should notify observers on state update', () => {
    const workflow = new MyWorkflow('test', []);
    const observer = {
      onEvent: vi.fn(),
      onLog: vi.fn(),
      onStateUpdated: vi.fn(),
      onTreeChanged: vi.fn(),
    };

    workflow.addObserver(observer);
    workflow.snapshotState();

    expect(observer.onStateUpdated).toHaveBeenCalledWith(workflow.node);
  });

  it('should include snapshot in step events when enabled', async () => {
    class WorkflowWithSnapshot extends Workflow {
      @ObservedState()
      value: number = 0;

      @Step({ snapshotState: true })
      async updateValue(): Promise<void> {
        this.value = 42;
      }
    }

    const workflow = new WorkflowWithSnapshot('test');
    const emitEventSpy = vi.spyOn(workflow, 'emitEvent');

    await workflow.updateValue();

    const stepEndCall = emitEventSpy.mock.calls.find(
      call => call[0].type === 'stepEnd'
    );

    expect(stepEndCall?.[0]).toHaveProperty('stateSnapshot');
    expect(stepEndCall?.[0].stateSnapshot).toEqual({
      value: 42,
    });
  });

  it('should redact sensitive fields', () => {
    class WorkflowWithSecrets extends Workflow {
      @ObservedState()
      publicData: string = 'visible';

      @ObservedState({ redact: true })
      apiKey: string = 'secret-key';
    }

    const workflow = new WorkflowWithSecrets('test');
    workflow.snapshotState();

    expect(workflow.node.stateSnapshot).toEqual({
      publicData: 'visible',
      apiKey: '***', // Redacted
    });
  });

  it('should hide fields marked as hidden', () => {
    class WorkflowWithHidden extends Workflow {
      @ObservedState()
      visibleData: string = 'visible';

      @ObservedState({ hidden: true })
      internalState: string = 'internal';
    }

    const workflow = new WorkflowWithHidden('test');
    workflow.snapshotState();

    expect(workflow.node.stateSnapshot).toEqual({
      visibleData: 'visible',
      // internalState is not included
    });
    expect(workflow.node.stateSnapshot).not.toHaveProperty('internalState');
  });
});
```

**Key Test Considerations:**

1. Verify state initialization and updates
2. Test manual snapshot capture via snapshotState()
3. Test observer notification on state updates
4. Verify automatic snapshots when snapshotState: true in @Step
5. Test redaction of sensitive fields
6. Test exclusion of hidden fields

---

## 5. Mocking Anthropic SDK to Prevent Actual LLM Calls

### Pattern: Mock Anthropic SDK

**Implementation in Test File:**

```typescript
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Mock Anthropic SDK to prevent accidental API calls
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));
```

**Complete Example with Agent Factory Mock:**

```typescript
// Mock agent factory
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));

// Mock prompt factory
vi.mock('../../../src/agents/prompts/my-prompt.js', () => ({
  createMyPrompt: vi.fn(),
}));

// Import mocked modules
import { createQAAgent } from '../../../src/agents/agent-factory.js';
import { createMyPrompt } from '../../../src/agents/prompts/my-prompt.js';

const mockCreateQAAgent = createQAAgent as any;
const mockCreateMyPrompt = createMyPrompt as any;

describe('MyWorkflow with mocked agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    mockCreateQAAgent.mockReturnValue({
      prompt: vi.fn(),
    });
    mockCreateMyPrompt.mockReturnValue({});
  });

  it('should call agent with prompt', async () => {
    const workflow = new MyWorkflow('test', []);
    const mockAgent = {
      prompt: vi.fn().mockResolvedValue({
        result: 'success',
      }),
    };
    mockCreateQAAgent.mockReturnValue(mockAgent);
    mockCreateMyPrompt.mockReturnValue({ user: 'test' });

    await workflow.run();

    expect(mockCreateQAAgent).toHaveBeenCalled();
    expect(mockCreateMyPrompt).toHaveBeenCalled();
    expect(mockAgent.prompt).toHaveBeenCalledWith({ user: 'test' });
  });
});
```

**Key Test Considerations:**

1. Mock @anthropic-ai/sdk at the top of test file
2. Mock agent factories and prompt factories
3. Setup and clear mocks in beforeEach
4. Verify mock calls without making actual API calls
5. Test error scenarios with mockRejectedValue

---

## 6. Testing Workflow run() Method Execution

### Pattern: run() Method Structure

**Implementation:**

```typescript
class MyWorkflow extends Workflow {
  @Step({ trackTiming: true })
  async step1(): Promise<void> {
    // Step 1 logic
  }

  @Step({ trackTiming: true })
  async step2(): Promise<string> {
    return 'result';
  }

  async run(): Promise<string> {
    this.setStatus('running');
    try {
      await this.step1();
      const result = await this.step2();
      this.setStatus('completed');
      return result;
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Test Pattern:**

```typescript
describe('run method', () => {
  it('should execute all steps in order', async () => {
    const workflow = new MyWorkflow('test', []);
    const step1Spy = vi.spyOn(workflow, 'step1');
    const step2Spy = vi.spyOn(workflow, 'step2');

    await workflow.run();

    expect(step1Spy).toHaveBeenCalledBefore(step2Spy);
    expect(step1Spy).toHaveBeenCalledTimes(1);
    expect(step2Spy).toHaveBeenCalledTimes(1);
  });

  it('should return final result', async () => {
    const workflow = new MyWorkflow('test', []);
    const result = await workflow.run();
    expect(result).toBe('result');
  });

  it('should transition status: running -> completed', async () => {
    const workflow = new MyWorkflow('test', []);
    const setStatusSpy = vi.spyOn(workflow, 'setStatus');

    await workflow.run();

    expect(setStatusSpy).toHaveBeenNthCalledWith(1, 'running');
    expect(setStatusSpy).toHaveBeenNthCalledWith(2, 'completed');
  });

  it('should set status to failed on error', async () => {
    const workflow = new MyWorkflow('test', []);
    vi.spyOn(workflow, 'step1').mockRejectedValue(new Error('Step failed'));
    const setStatusSpy = vi.spyOn(workflow, 'setStatus');

    await expect(workflow.run()).rejects.toThrow('Step failed');

    expect(setStatusSpy).toHaveBeenCalledWith('running');
    expect(setStatusSpy).toHaveBeenCalledWith('failed');
    expect(setStatusSpy).not.toHaveBeenCalledWith('completed');
  });

  it('should propagate step errors', async () => {
    const workflow = new MyWorkflow('test', []);
    const error = new Error('Step execution failed');
    vi.spyOn(workflow, 'step2').mockRejectedValue(error);

    await expect(workflow.run()).rejects.toThrow('Step execution failed');
  });

  it('should handle async step execution', async () => {
    const workflow = new MyWorkflow('test', []);
    let step1Completed = false;
    vi.spyOn(workflow, 'step1').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      step1Completed = true;
    });

    await workflow.run();

    expect(step1Completed).toBe(true);
  });
});
```

**Key Test Considerations:**

1. Verify step execution order
2. Test status transitions (running -> completed/failed)
3. Verify result return value
4. Test error propagation
5. Test async step execution
6. Verify setStatus is called in correct order

---

## 7. Testing attachChild(), detachChild(), setStatus()

### Pattern: Parent-Child Management

**Test Pattern for attachChild():**

```typescript
describe('attachChild', () => {
  it('should attach child workflow', () => {
    const parent = new Workflow('Parent');
    const child = new Workflow('Child');

    parent.attachChild(child);

    expect(child.parent).toBe(parent);
    expect(parent.children).toContain(child);
  });

  it('should throw if child already has different parent', () => {
    const parent1 = new Workflow('Parent1');
    const parent2 = new Workflow('Parent2');
    const child = new Workflow('Child', parent1);

    expect(() => {
      parent2.attachChild(child);
    }).toThrow();
  });

  it('should throw if child is ancestor of parent (circular reference)', () => {
    const ancestor = new Workflow('Ancestor');
    const descendant = new Workflow('Descendant', ancestor);

    expect(() => {
      descendant.attachChild(ancestor);
    }).toThrow();
  });

  it('should use isDescendantOf for cycle detection', () => {
    const grandparent = new Workflow('Grandparent');
    const parent = new Workflow('Parent', grandparent);
    const child = new Workflow('Child', parent);

    // child is descendant of grandparent
    expect(child.isDescendantOf(grandparent)).toBe(true);

    // Attaching grandparent as child of child should fail
    expect(() => {
      child.attachChild(grandparent);
    }).toThrow();
  });
});
```

**Test Pattern for detachChild():**

```typescript
describe('detachChild', () => {
  it('should detach child workflow', () => {
    const parent = new Workflow('Parent');
    const child = new Workflow('Child', parent);

    parent.detachChild(child);

    expect(child.parent).toBeNull();
    expect(parent.children).not.toContain(child);
  });

  it('should allow reparenting after detach', () => {
    const parent1 = new Workflow('Parent1');
    const parent2 = new Workflow('Parent2');
    const child = new Workflow('Child', parent1);

    // Detach from parent1
    parent1.detachChild(child);
    expect(child.parent).toBeNull();

    // Attach to parent2
    parent2.attachChild(child);
    expect(child.parent).toBe(parent2);
    expect(parent2.children).toContain(child);
  });

  it('should maintain observer propagation after reparenting', () => {
    const parent1 = new Workflow('Parent1');
    const parent2 = new Workflow('Parent2');
    const child = new Workflow('Child', parent1);

    const observer = {
      onEvent: vi.fn(),
      onLog: vi.fn(),
      onStateUpdated: vi.fn(),
      onTreeChanged: vi.fn(),
    };

    parent1.addObserver(observer);

    // Detach and reparent
    parent1.detachChild(child);
    parent2.attachChild(child);
    parent2.addObserver(observer);

    // Child events should propagate to new parent's observer
    child.emitEvent({ type: 'test', node: child.node });

    expect(observer.onEvent).toHaveBeenCalled();
  });
});
```

**Test Pattern for setStatus():**

```typescript
describe('setStatus', () => {
  it('should update workflow status', () => {
    const workflow = new Workflow('Test');
    expect(workflow.status).toBe('idle');

    workflow.setStatus('running');
    expect(workflow.status).toBe('running');

    workflow.setStatus('completed');
    expect(workflow.status).toBe('completed');
  });

  it('should emit status change event', () => {
    const workflow = new Workflow('Test');
    const emitEventSpy = vi.spyOn(workflow, 'emitEvent');

    workflow.setStatus('running');

    expect(emitEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'statusChange',
        status: 'running',
      })
    );
  });

  it('should update node status', () => {
    const workflow = new Workflow('Test');
    workflow.setStatus('failed');

    expect(workflow.node.status).toBe('failed');
  });

  it('should accept valid status values', () => {
    const workflow = new Workflow('Test');
    const validStatuses = [
      'idle',
      'running',
      'completed',
      'failed',
      'cancelled',
    ];

    validStatuses.forEach(status => {
      workflow.setStatus(status as any);
      expect(workflow.status).toBe(status);
    });
  });
});
```

**Key Test Considerations:**

1. Verify child attachment (parent-child links)
2. Test validation (no circular references, no duplicate parents)
3. Test detachment and reparenting
4. Verify observer propagation after reparenting
5. Test status changes and events
6. Verify node status synchronization

---

## 8. Testing isDescendantOf() Method

### Pattern: Hierarchy Validation

**Test Pattern:**

```typescript
describe('isDescendantOf', () => {
  it('should return true for direct child', () => {
    const parent = new Workflow('Parent');
    const child = new Workflow('Child', parent);

    expect(child.isDescendantOf(parent)).toBe(true);
    expect(parent.isDescendantOf(child)).toBe(false);
  });

  it('should return true for nested descendants', () => {
    const grandparent = new Workflow('Grandparent');
    const parent = new Workflow('Parent', grandparent);
    const child = new Workflow('Child', parent);

    expect(child.isDescendantOf(grandparent)).toBe(true);
    expect(child.isDescendantOf(parent)).toBe(true);
    expect(parent.isDescendantOf(grandparent)).toBe(true);
  });

  it('should return false for unrelated workflows', () => {
    const workflow1 = new Workflow('Workflow1');
    const workflow2 = new Workflow('Workflow2');

    expect(workflow1.isDescendantOf(workflow2)).toBe(false);
    expect(workflow2.isDescendantOf(workflow1)).toBe(false);
  });

  it('should return false for workflow checking itself', () => {
    const workflow = new Workflow('Test');

    expect(workflow.isDescendantOf(workflow)).toBe(false);
  });

  it('should handle complex hierarchies', () => {
    const root = new Workflow('Root');
    const branch1 = new Workflow('Branch1', root);
    const branch2 = new Workflow('Branch2', root);
    const leaf1 = new Workflow('Leaf1', branch1);
    const leaf2 = new Workflow('Leaf2', branch2);

    // leaf1 should be descendant of root and branch1, not branch2 or leaf2
    expect(leaf1.isDescendantOf(root)).toBe(true);
    expect(leaf1.isDescendantOf(branch1)).toBe(true);
    expect(leaf1.isDescendantOf(branch2)).toBe(false);
    expect(leaf1.isDescendantOf(leaf2)).toBe(false);

    // Siblings are not descendants of each other
    expect(branch1.isDescendantOf(branch2)).toBe(false);
    expect(branch2.isDescendantOf(branch1)).toBe(false);
  });

  it('should work after reparenting', () => {
    const parent1 = new Workflow('Parent1');
    const parent2 = new Workflow('Parent2');
    const child = new Workflow('Child', parent1);

    expect(child.isDescendantOf(parent1)).toBe(true);
    expect(child.isDescendantOf(parent2)).toBe(false);

    // Reparent
    parent1.detachChild(child);
    parent2.attachChild(child);

    expect(child.isDescendantOf(parent1)).toBe(false);
    expect(child.isDescendantOf(parent2)).toBe(true);
  });
});
```

**Key Test Considerations:**

1. Test direct parent-child relationships
2. Test multi-level hierarchies (grandparent, great-grandparent)
3. Test unrelated workflows
4. Test self-reference (should return false)
5. Test sibling relationships (should return false)
6. Test behavior after reparenting

---

## 9. Complete Test Example Integration

### Full Workflow Test Suite Example

```typescript
/**
 * Comprehensive test suite for Groundswell Workflow
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MyWorkflow } from './my-workflow.js';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// Mock dependencies
vi.mock('./agent-factory.js', () => ({
  createAgent: vi.fn(),
}));

vi.mock('./prompts.js', () => ({
  createPrompt: vi.fn(),
}));

import { createAgent } from './agent-factory.js';
import { createPrompt } from './prompts.js';

const mockCreateAgent = createAgent as any;
const mockCreatePrompt = createPrompt as any;

describe('MyWorkflow - Complete Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAgent.mockReturnValue({
      prompt: vi.fn().mockResolvedValue({ result: 'success' }),
    });
    mockCreatePrompt.mockReturnValue({ user: 'test prompt' });
  });

  describe('Initialization', () => {
    it('should construct with valid parameters', () => {
      const workflow = new MyWorkflow('test-param', ['item1']);
      expect(workflow.param1).toBe('test-param');
      expect(workflow.param2).toEqual(['item1']);
      expect(workflow.status).toBe('idle');
    });

    it('should validate constructor parameters', () => {
      expect(() => new MyWorkflow('', [])).toThrow('param1 cannot be empty');
    });
  });

  describe('@Step decorator behavior', () => {
    it('should execute step with timing tracking', async () => {
      const workflow = new MyWorkflow('test', []);
      const emitEventSpy = vi.spyOn(workflow, 'emitEvent');

      await workflow.processStep();

      expect(emitEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stepStart',
          step: 'processStep',
        })
      );

      expect(emitEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stepEnd',
          step: 'processStep',
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('@ObservedState behavior', () => {
    it('should capture state in snapshots', () => {
      const workflow = new MyWorkflow('test', []);
      workflow.progress = 50;
      workflow.processedItems = ['item1'];

      workflow.snapshotState();

      expect(workflow.node.stateSnapshot).toEqual({
        progress: 50,
        processedItems: ['item1'],
      });
    });

    it('should notify observers on state update', () => {
      const workflow = new MyWorkflow('test', []);
      const observer = {
        onEvent: vi.fn(),
        onLog: vi.fn(),
        onStateUpdated: vi.fn(),
        onTreeChanged: vi.fn(),
      };

      workflow.addObserver(observer);
      workflow.snapshotState();

      expect(observer.onStateUpdated).toHaveBeenCalled();
    });
  });

  describe('run() lifecycle', () => {
    it('should execute workflow with proper status transitions', async () => {
      const workflow = new MyWorkflow('test', []);
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      await workflow.run();

      expect(setStatusSpy).toHaveBeenNthCalledWith(1, 'running');
      expect(setStatusSpy).toHaveBeenNthCalledWith(2, 'completed');
    });

    it('should handle errors and set failed status', async () => {
      const workflow = new MyWorkflow('test', []);
      vi.spyOn(workflow, 'processStep').mockRejectedValue(new Error('Failed'));
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      await expect(workflow.run()).rejects.toThrow('Failed');

      expect(setStatusSpy).toHaveBeenCalledWith('running');
      expect(setStatusSpy).toHaveBeenCalledWith('failed');
    });
  });

  describe('Parent-child relationships', () => {
    it('should attach and detach children', () => {
      const parent = new Workflow('Parent');
      const child = new Workflow('Child');

      parent.attachChild(child);
      expect(child.parent).toBe(parent);
      expect(parent.children).toContain(child);

      parent.detachChild(child);
      expect(child.parent).toBeNull();
      expect(parent.children).not.toContain(child);
    });

    it('should validate descendant relationships', () => {
      const grandparent = new Workflow('Grandparent');
      const parent = new Workflow('Parent', grandparent);
      const child = new Workflow('Child', parent);

      expect(child.isDescendantOf(grandparent)).toBe(true);
      expect(child.isDescendantOf(parent)).toBe(true);
      expect(grandparent.isDescendantOf(child)).toBe(false);
    });
  });
});
```

---

## 10. Key Test Patterns Summary

### 10.1 Mock Patterns

**Anthropic SDK Mock:**

```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: { create: vi.fn() },
  })),
}));
```

**Agent Factory Mock:**

```typescript
vi.mock('./agent-factory.js', () => ({
  createAgent: vi.fn(),
}));

const mockCreateAgent = createAgent as any;
mockCreateAgent.mockReturnValue({
  prompt: vi.fn().mockResolvedValue({ result: 'success' }),
});
```

### 10.2 Event Emission Testing

**Verify Event Structure:**

```typescript
const emitEventSpy = vi.spyOn(workflow, 'emitEvent');
await workflow.step();

expect(emitEventSpy).toHaveBeenCalledWith(
  expect.objectContaining({
    type: 'stepStart',
    step: 'stepName',
    duration: expect.any(Number),
  })
);
```

**Test Observer Notification:**

```typescript
const observer = {
  onEvent: vi.fn(),
  onLog: vi.fn(),
  onStateUpdated: vi.fn(),
  onTreeChanged: vi.fn(),
};
workflow.addObserver(observer);
await workflow.step();

expect(observer.onEvent).toHaveBeenCalled();
```

### 10.3 State Snapshot Testing

**Manual Snapshot:**

```typescript
workflow.snapshotState();
expect(workflow.node.stateSnapshot).toEqual({ key: 'value' });
```

**Automatic Snapshot with @Step:**

```typescript
@Step({ snapshotState: true })
async step() { this.value = 42; }

// Test
const emitEventSpy = vi.spyOn(workflow, 'emitEvent');
await workflow.step();

const stepEndCall = emitEventSpy.mock.calls.find(call => call[0].type === 'stepEnd');
expect(stepEndCall?.[0].stateSnapshot).toEqual({ value: 42 });
```

### 10.4 Parent-Child Relationship Testing

**Attachment:**

```typescript
parent.attachChild(child);
expect(child.parent).toBe(parent);
expect(parent.children).toContain(child);
```

**Descendant Check:**

```typescript
expect(child.isDescendantOf(parent)).toBe(true);
expect(child.isDescendantOf(grandparent)).toBe(true);
```

**Reparenting:**

```typescript
parent1.detachChild(child);
parent2.attachChild(child);
expect(child.parent).toBe(parent2);
```

---

## 11. Gotchas and Edge Cases

### 11.1 Common Pitfalls

1. **Decorator Testing:** Decorators are applied at class definition time, not instantiation. Test decorator behavior by testing the decorated method's effects.

2. **Event Timing:** Events are emitted asynchronously. Use proper await and spy verification.

3. **State Snapshots:** Snapshots only include @ObservedState fields. Regular fields are not captured.

4. **Circular References:** attachChild() throws for circular references. Use isDescendantOf() for validation.

5. **Observer Scope:** Only root workflows can have observers. Child events propagate to root observers.

6. **Mock Timing:** Clear mocks in beforeEach to prevent test pollution.

7. **Status Transitions:** Status must go through proper lifecycle (running -> completed/failed). Test failed paths don't set completed.

8. **Async Steps:** @Step decorator wraps async methods. Ensure proper async/await in tests.

9. **Private Fields:** Testing private fields (e.g., #fixTasks) requires test-only getters or type assertions.

10. **Agent Mock Return Values:** Ensure mocked agent.prompt() returns values matching Zod schema.

### 11.2 Edge Cases to Test

1. **Empty/Whitespace Inputs:** Constructor validation
2. **Null/Undefined Parameters:** Type checking
3. **Concurrent Step Execution:** Race conditions
4. **Deep Hierarchies:** Multi-level descendant checks
5. **Reparenting:** Observer propagation after detachment
6. **Redacted State:** Sensitive data masking
7. **Hidden State:** Field exclusion from snapshots
8. **Error in Step:** Event emission with error context
9. **Status Rollback:** Failed status after error
10. **Multiple Observers:** All observers notified

---

## 12. Best Practices

### 12.1 Test Structure

1. **Setup/Execute/Verify Pattern:** Clear test phases
2. **Descriptive Test Names:** Should document behavior
3. **Test Isolation:** Each test independent
4. **Comprehensive Coverage:** Happy path + edge cases
5. **Mock Consistency:** Same mock pattern across tests

### 12.2 Workflow Testing

1. **Test Lifecycle:** idle → running → completed/failed
2. **Test Decorators:** Via their effects (events, timing, snapshots)
3. **Test Hierarchy:** Parent-child relationships and validation
4. **Test State:** ObservedState and snapshotState()
5. **Test Observers:** Event propagation and notification

### 12.3 Mock Management

1. **Mock Early:** Define mocks before tests
2. **Clear Frequently:** Use beforeEach to reset
3. **Verify Calls:** Check mock invocation count and args
4. **Test Errors:** Use mockRejectedValue for error paths

---

## 13. Conclusion

This research document provides comprehensive test patterns for Groundswell Workflow lifecycle testing. The patterns are derived from existing test suites in the codebase and Groundswell library architecture documentation.

**Key Takeaways:**

1. Use consistent mock patterns for Anthropic SDK and agent factories
2. Test decorator behavior via their effects (events, timing, snapshots)
3. Verify lifecycle status transitions (idle → running → completed/failed)
4. Test parent-child relationships with attachment/detachment/descendant checks
5. Validate state snapshots with @ObservedState and snapshotState()
6. Test observer pattern for event propagation
7. Handle edge cases: circular references, reparenting, redacted state

**Sources:**

- Existing test files: `/home/dustin/projects/hacky-hack/tests/unit/workflows/*.test.ts`
- Workflow implementations: `/home/dustin/projects/hacky-hack/src/workflows/*.ts`
- Groundswell analysis: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/groundswell_analysis.md`
- System context: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md`

---

**End of Research Document**
