# Research: Testing Deep Hierarchy Structures

**Document ID**: P2.M1.T2.S2-RES-002
**Generated**: 2026-01-15
**Purpose**: Research on patterns for testing status update operations with deep hierarchy structures in TypeScript/Vitest

---

## Executive Summary

This document provides comprehensive research on testing patterns for deep hierarchy structures, including fluent builder patterns for test data creation, parameterized testing strategies, and validation approaches for ensuring hierarchy integrity after status updates.

---

## 1. Test Data Factory Patterns

### 1.1 Simple Factory Functions (Current Pattern)

**Description**: Create individual item objects with factory functions.

**Example** (from current codebase):

```typescript
function createMinimalTasksJson(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase description',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'CONTRACT DEFINITION:\n1. Test',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
```

**Use Cases**:

- Simple test fixtures
- Minimal hierarchy depth
- Few items per level

**Pros**:

- Simple and straightforward
- Easy to understand
- Minimal code

**Cons**:

- Verbose for complex hierarchies
- Hard to maintain
- Repetitive code

---

### 1.2 Fluent Builder Pattern

**Description**: Create complex hierarchies with a fluent API that mirrors the structure.

**Implementation**:

```typescript
class HierarchyBuilder {
  private phases: Phase[] = [];

  static create(): HierarchyBuilder {
    return new HierarchyBuilder();
  }

  addPhase(
    id: string,
    title: string,
    status: Status = 'Planned'
  ): MilestoneBuilder {
    const phase: Phase = {
      type: 'Phase',
      id,
      title,
      status,
      description: `${title} description`,
      milestones: [],
    };
    this.phases.push(phase);
    return new MilestoneBuilder(phase, this);
  }

  build(): Backlog {
    return { backlog: this.phases };
  }
}

class MilestoneBuilder {
  constructor(
    private phase: Phase,
    private root: HierarchyBuilder
  ) {}

  addMilestone(
    id: string,
    title: string,
    status: Status = 'Planned'
  ): TaskBuilder {
    const milestone: Milestone = {
      type: 'Milestone',
      id,
      title,
      status,
      description: `${title} description`,
      tasks: [],
    };
    this.phase.milestones.push(milestone);
    return new TaskBuilder(milestone, this);
  }

  backToRoot(): HierarchyBuilder {
    return this.root;
  }

  build(): Backlog {
    return this.root.build();
  }
}

class TaskBuilder {
  constructor(
    private milestone: Milestone,
    private parent: MilestoneBuilder
  ) {}

  addTask(
    id: string,
    title: string,
    status: Status = 'Planned'
  ): SubtaskBuilder {
    const task: Task = {
      type: 'Task',
      id,
      title,
      status,
      description: `${title} description`,
      subtasks: [],
    };
    this.milestone.tasks.push(task);
    return new SubtaskBuilder(task, this);
  }

  backToRoot(): HierarchyBuilder {
    return this.parent.backToRoot();
  }

  build(): Backlog {
    return this.parent.backToRoot().build();
  }
}

class SubtaskBuilder {
  constructor(
    private task: Task,
    private parent: TaskBuilder
  ) {}

  addSubtask(
    id: string,
    title: string,
    status: Status = 'Planned',
    storyPoints: number = 1,
    dependencies: string[] = []
  ): this {
    const subtask: Subtask = {
      type: 'Subtask',
      id,
      title,
      status,
      story_points: storyPoints,
      dependencies,
      context_scope: 'CONTRACT DEFINITION:\n1. Test',
    };
    this.task.subtasks.push(subtask);
    return this;
  }

  backToRoot(): HierarchyBuilder {
    return this.parent.backToRoot();
  }

  build(): Backlog {
    return this.parent.backToRoot().build();
  }
}
```

**Usage in Tests**:

```typescript
it('should handle deep hierarchy updates', async () => {
  // SETUP: Create complex hierarchy with builder
  const backlog = HierarchyBuilder.create()
    .addPhase('P1', 'Phase 1', 'Planned')
    .addMilestone('P1.M1', 'Milestone 1', 'Planned')
    .addTask('P1.M1.T1', 'Task 1', 'Planned')
    .addSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete')
    .addSubtask('P1.M1.T1.S2', 'Subtask 2', 'Implementing', 2, ['P1.M1.T1.S1'])
    .backToRoot()
    .addTask('P1.M1.T2', 'Task 2', 'Planned')
    .addSubtask('P1.M1.T2.S1', 'Subtask 1', 'Planned')
    .backToRoot()
    .addMilestone('P1.M2', 'Milestone 2', 'Planned')
    .addTask('P1.M2.T1', 'Task 1', 'Planned')
    .addSubtask('P1.M2.T1.S1', 'Subtask 1', 'Failed')
    .build();

  // EXECUTE: Update deep item
  const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

  // VERIFY: Only target changed
  expect(findItem(updated, 'P1.M1.T1.S1')?.status).toBe('Failed');
  expect(findItem(updated, 'P1.M1.T1.S2')?.status).toBe('Implementing'); // Unchanged
  expect(findItem(updated, 'P1.M1.T1')?.status).toBe('Planned'); // Unchanged
});
```

**Pros**:

- Readable and intuitive
- Mirrors hierarchy structure
- Reduces repetition
- Easy to extend
- Type-safe

**Cons**:

- More code to maintain
- Learning curve for new developers
- Overkill for simple fixtures

**Recommendation**: Use for complex test hierarchies (3+ levels, 5+ items per level)

---

### 1.3 Configuration-Based Pattern

**Description**: Define hierarchy as configuration object and generate.

**Implementation**:

```typescript
interface HierarchyConfig {
  phases: Array<{
    id: string;
    title: string;
    status?: Status;
    milestones: Array<{
      id: string;
      title: string;
      status?: Status;
      tasks: Array<{
        id: string;
        title: string;
        status?: Status;
        subtasks: Array<{
          id: string;
          title: string;
          status?: Status;
          story_points?: number;
          dependencies?: string[];
        }>;
      }>;
    }>;
  }>;
}

function createBacklogFromConfig(config: HierarchyConfig): Backlog {
  return {
    backlog: config.phases.map(phase => ({
      type: 'Phase',
      id: phase.id,
      title: phase.title,
      status: phase.status ?? 'Planned',
      description: `${phase.title} description`,
      milestones: phase.milestones.map(milestone => ({
        type: 'Milestone',
        id: milestone.id,
        title: milestone.title,
        status: milestone.status ?? 'Planned',
        description: `${milestone.title} description`,
        tasks: milestone.tasks.map(task => ({
          type: 'Task',
          id: task.id,
          title: task.title,
          status: task.status ?? 'Planned',
          description: `${task.title} description`,
          subtasks: task.subtasks.map(subtask => ({
            type: 'Subtask',
            id: subtask.id,
            title: subtask.title,
            status: subtask.status ?? 'Planned',
            story_points: subtask.story_points ?? 1,
            dependencies: subtask.dependencies ?? [],
            context_scope: 'CONTRACT DEFINITION:\n1. Test',
          })),
        })),
      })),
    })),
  };
}

// Usage
const config: HierarchyConfig = {
  phases: [
    {
      id: 'P1',
      title: 'Phase 1',
      milestones: [
        {
          id: 'P1.M1',
          title: 'Milestone 1',
          tasks: [
            {
              id: 'P1.M1.T1',
              title: 'Task 1',
              subtasks: [
                { id: 'P1.M1.T1.S1', title: 'Subtask 1', status: 'Complete' },
                { id: 'P1.M1.T1.S2', title: 'Subtask 2', status: 'Planned' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const backlog = createBacklogFromConfig(config);
```

**Pros**:

- Compact configuration
- Easy to read
- Simple to maintain
- JSON-serializable

**Cons**:

- Loss of type safety in config
- Less flexibility than builder
- Still verbose for large hierarchies

---

## 2. Parameterized Testing Patterns

### 2.1 Test Each for Status Values

**Pattern**: Use `test.each()` to test all status values.

```typescript
describe.each([
  ['Planned'],
  ['Researching'],
  ['Implementing'],
  ['Complete'],
  ['Failed'],
  ['Obsolete'],
])('Status value: %s', status => {
  it('should accept status when updating subtask', async () => {
    const manager = await createTestSession();
    await manager.updateItemStatus('P1.M1.T1.S1', status as Status);

    const session = manager.currentSession!;
    const subtask =
      session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0];
    expect(subtask.status).toBe(status);
  });
});
```

### 2.2 Test Each for Status Transitions

**Pattern**: Test valid and invalid transitions.

```typescript
describe.each([
  { from: 'Planned', to: 'Researching', valid: true },
  { from: 'Planned', to: 'Implementing', valid: true },
  { from: 'Planned', to: 'Complete', valid: false },
  { from: 'Researching', to: 'Implementing', valid: true },
  { from: 'Implementing', to: 'Complete', valid: true },
  { from: 'Complete', to: 'Planned', valid: false },
])('Status transition: $from → $to', ({ from, to, valid }) => {
  it(`${valid ? 'should allow' : 'should reject'} transition`, async () => {
    const manager = await createTestSession(from);

    if (valid) {
      await expect(
        manager.updateItemStatus('P1.M1.T1.S1', to)
      ).resolves.toBeDefined();
    } else {
      await expect(
        manager.updateItemStatus('P1.M1.T1.S1', to)
      ).rejects.toThrow();
    }
  });
});
```

### 2.3 Test Each for Hierarchy Levels

**Pattern**: Test all 4 hierarchy levels.

```typescript
describe.each([
  ['Phase', 'P1', 'P1.M1', 'P1.M1.T1'],
  ['Milestone', 'P1.M1', 'P1.M1.T1', 'P1.M1.T1.S1'],
  ['Task', 'P1.M1.T1', 'P1.M1', 'P1'],
  ['Subtask', 'P1.M1.T1.S1', 'P1.M1.T1', 'P1.M1'],
])('Hierarchy level: %s', (level, targetId, parentId, grandparentId) => {
  it(`should update ${level} without affecting other levels`, async () => {
    const manager = await createTestSession();
    await manager.updateItemStatus(targetId, 'Complete');

    // Verify target changed
    const target = findItem(manager.currentSession!.taskRegistry, targetId);
    expect(target?.status).toBe('Complete');

    // Verify parent unchanged
    const parent = findItem(manager.currentSession!.taskRegistry, parentId);
    expect(parent?.status).toBe('Planned');

    // Verify grandparent unchanged
    const grandparent = findItem(
      manager.currentSession!.taskRegistry,
      grandparentId
    );
    expect(grandparent?.status).toBe('Planned');
  });
});
```

---

## 3. Hierarchy Integrity Validation

### 3.1 Structure Preservation Test

**Pattern**: Verify hierarchy structure after updates.

```typescript
it('should preserve hierarchy structure after updates', async () => {
  const manager = await createTestSession();

  // Capture original structure
  const originalCounts = countHierarchy(manager.currentSession!.taskRegistry);
  const originalIds = collectAllIds(manager.currentSession!.taskRegistry);

  // Perform updates
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1', 'Implementing');
  await manager.updateItemStatus('P2.M2.T2', 'Failed');

  // Verify counts unchanged
  const newCounts = countHierarchy(manager.currentSession!.taskRegistry);
  expect(newCounts.phases).toBe(originalCounts.phases);
  expect(newCounts.milestones).toBe(originalCounts.milestones);
  expect(newCounts.tasks).toBe(originalCounts.tasks);
  expect(newCounts.subtasks).toBe(originalCounts.subtasks);

  // Verify all IDs still present
  const newIds = collectAllIds(manager.currentSession!.taskRegistry);
  expect(new Set(newIds)).toEqual(new Set(originalIds));
});

function countHierarchy(backlog: Backlog) {
  let phases = 0,
    milestones = 0,
    tasks = 0,
    subtasks = 0;
  for (const phase of backlog.backlog) {
    phases++;
    for (const milestone of phase.milestones) {
      milestones++;
      for (const task of milestone.tasks) {
        tasks++;
        subtasks += task.subtasks.length;
      }
    }
  }
  return { phases, milestones, tasks, subtasks };
}

function collectAllIds(backlog: Backlog): string[] {
  const ids: string[] = [];
  for (const phase of backlog.backlog) {
    ids.push(phase.id);
    for (const milestone of phase.milestones) {
      ids.push(milestone.id);
      for (const task of milestone.tasks) {
        ids.push(task.id);
        for (const subtask of task.subtasks) {
          ids.push(subtask.id);
        }
      }
    }
  }
  return ids;
}
```

### 3.2 No Orphaned Items Test

**Pattern**: Verify no items lost their parent references.

```typescript
it('should not create orphaned items', async () => {
  const manager = await createTestSession();

  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.flushUpdates();

  // Verify all items have valid parents (except root phases)
  const backlog = manager.currentSession!.taskRegistry;
  const allIds = new Set(collectAllIds(backlog));

  for (const phase of backlog.backlog) {
    for (const milestone of phase.milestones) {
      // Verify milestone's parent exists
      const parentId = getParentId(milestone.id);
      expect(allIds.has(parentId!)).toBe(true);

      for (const task of milestone.tasks) {
        // Verify task's parent exists
        const taskIdParent = getParentId(task.id);
        expect(allIds.has(taskIdParent!)).toBe(true);

        for (const subtask of task.subtasks) {
          // Verify subtask's parent exists
          const subtaskIdParent = getParentId(subtask.id);
          expect(allIds.has(subtaskIdParent!)).toBe(true);
        }
      }
    }
  }
});

function getParentId(itemId: string): string | null {
  const parts = itemId.split('.');
  parts.pop();
  return parts.length > 0 ? parts.join('.') : null;
}
```

### 3.3 No Circular References Test

**Pattern**: Verify no circular references created.

```typescript
it('should not create circular references', async () => {
  const manager = await createTestSession();

  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // Detect cycles using DFS
  const visited = new Set<string>();
  const backlog = manager.currentSession!.taskRegistry;

  function hasCycle(item: HierarchyItem, path: string[] = []): boolean {
    if (visited.has(item.id)) {
      return path.includes(item.id);
    }

    visited.add(item.id);
    const newPath = [...path, item.id];

    if (item.type === 'Phase') {
      for (const milestone of item.milestones) {
        if (hasCycle(milestone, newPath)) return true;
      }
    } else if (item.type === 'Milestone') {
      for (const task of item.tasks) {
        if (hasCycle(task, newPath)) return true;
      }
    } else if (item.type === 'Task') {
      for (const subtask of item.subtasks) {
        if (hasCycle(subtask, newPath)) return true;
      }
    }

    return false;
  }

  for (const phase of backlog.backlog) {
    expect(hasCycle(phase)).toBe(false);
  }
});
```

---

## 4. Performance Testing Patterns

### 4.1 Single Update Performance

```typescript
it('should complete single update in acceptable time', async () => {
  const manager = await createTestSession();

  const startTime = performance.now();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(10); // < 10ms for single update
});
```

### 4.2 Multiple Updates Performance

```typescript
it('should complete 100 updates in acceptable time', async () => {
  const manager = await createTestSession();

  const startTime = performance.now();
  for (let i = 1; i <= 100; i++) {
    await manager.updateItemStatus(`P1.M1.T${i}.S1`, 'Complete');
  }
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(500); // < 500ms for 100 updates
});
```

### 4.3 Deep Hierarchy Performance

```typescript
it('should handle deep hierarchy efficiently', async () => {
  const deepHierarchy = createDeepHierarchy(20); // 20 levels deep
  const manager = await createTestSessionWithBacklog(deepHierarchy);

  const startTime = performance.now();
  await manager.updateItemStatus(getDeepestItemId(deepHierarchy), 'Complete');
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(50); // Should still be fast
});

function createDeepHierarchy(depth: number): Backlog {
  // Create artificially deep hierarchy
  let current: any = {
    type: 'Subtask',
    id: 'root',
    title: 'Deep',
    status: 'Planned',
    story_points: 1,
    dependencies: [],
    context_scope: 'Test',
  };

  for (let i = depth - 1; i >= 0; i--) {
    current = {
      type: 'Task',
      id: `P${i}`,
      title: `Level ${i}`,
      status: 'Planned',
      description: 'Test',
      subtasks: [current],
    };
  }

  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P0',
        title: 'Root',
        status: 'Planned',
        description: 'Test',
        milestones: [
          {
            type: 'Milestone',
            id: 'P0.M0',
            title: 'Root Milestone',
            status: 'Planned',
            description: 'Test',
            tasks: [current],
          },
        ],
      },
    ],
  };
}
```

---

## 5. Error Handling Test Patterns

### 5.1 Invalid Item ID Test

```typescript
it.each(['', 'INVALID', 'P999', 'P1.M999', 'P1.M1.T999.S999'])(
  'should handle invalid item ID: %s',
  async invalidId => {
    const manager = await createTestSession();

    // Should not throw, should return unchanged backlog
    const result = await manager.updateItemStatus(invalidId, 'Complete');

    expect(result).toBeDefined();
    // Verify no changes made
    const subtask =
      manager.currentSession!.taskRegistry.backlog[0].milestones[0].tasks[0]
        .subtasks[0];
    expect(subtask.status).toBe('Planned'); // Unchanged
  }
);
```

### 5.2 Non-Existent Item Test

```typescript
it('should return unchanged backlog for non-existent item', async () => {
  const manager = await createTestSession();

  const originalJson = JSON.stringify(manager.currentSession!.taskRegistry);

  await manager.updateItemStatus('P999.M999.T999.S999', 'Complete');

  const newJson = JSON.stringify(manager.currentSession!.taskRegistry);
  expect(newJson).toBe(originalJson); // Unchanged
});
```

---

## 6. Snapshot Testing Pattern

```typescript
it('should match snapshot after multiple updates', async () => {
  const manager = await createTestSession();

  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Implementing');
  await manager.updateItemStatus('P1.M1', 'Researching');

  // Snapshot for regression testing
  expect(manager.currentSession!.taskRegistry).toMatchSnapshot();
});
```

---

## 7. URLs and References

**Testing Frameworks**:

- [Vitest Documentation](https://vitest.dev/guide/)
- [Vitest test.each API](https://vitest.dev/api/#test-each)
- [Vitest expect API](https://vitest.dev/api/expect.html)

**Performance Testing**:

- [Performance API](https://nodejs.org/api/performance.html)
- [performance.now() MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)

**Your Project Files**:

- `/home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts`
- `/home/dustin/projects/hacky-hack/vitest.config.ts`

---

## 8. Summary

**Recommended Patterns**:

1. Use builder pattern for complex hierarchies
2. Use `test.each()` for parameterized tests
3. Validate hierarchy integrity after updates
4. Include performance tests for large hierarchies
5. Test all error cases and edge cases

**Test Coverage Goals**:

- All 4 hierarchy levels (Phase, Milestone, Task, Subtask)
- All 6 status values
- Invalid inputs (IDs, status values)
- Hierarchy integrity (structure, orphans, cycles)
- Performance (single and multiple updates)
- Error handling (non-existent items, invalid formats)

---

**END OF RESEARCH DOCUMENT**
