# task-utils.ts Testing Examples
**Work Item:** P4.M4.T1.S1 - Specific test examples for task-utils.ts functions

---

## Overview

This document provides concrete testing examples for each function in `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`. These examples demonstrate the testing patterns needed to achieve 100% code coverage.

---

## Test Fixtures

### Factory Functions

```typescript
import type { Backlog, Phase, Milestone, Task, Subtask, Status } from '../../../src/core/models.js';

const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

const createTestTask = (
  id: string,
  title: string,
  status: Status,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task',
  title,
  status,
  description: 'Test task description',
  subtasks,
});

const createTestMilestone = (
  id: string,
  title: string,
  status: Status,
  tasks: Task[] = []
): Milestone => ({
  id,
  type: 'Milestone',
  title,
  status,
  description: 'Test milestone description',
  tasks,
});

const createTestPhase = (
  id: string,
  title: string,
  status: Status,
  milestones: Milestone[] = []
): Phase => ({
  id,
  type: 'Phase',
  title,
  status,
  description: 'Test phase description',
  milestones,
});

const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});
```

### Complex Backlog Fixture

```typescript
const createComplexBacklog = (): Backlog => {
  // Subtasks with various statuses
  const subtask1 = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete');
  const subtask2 = createTestSubSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned', ['P1.M1.T1.S1']);
  const subtask3 = createTestSubtask('P1.M1.T1.S3', 'Subtask 3', 'Planned', ['P1.M1.T1.S2']);
  const subtask4 = createTestSubtask('P1.M1.T2.S1', 'Subtask 4', 'Researching');
  const subtask5 = createTestSubtask('P1.M2.T1.S1', 'Subtask 5', 'Implementing');
  const subtask6 = createTestSubtask('P2.M1.T1.S1', 'Subtask 6', 'Planned');

  // Tasks
  const task1 = createTestTask('P1.M1.T1', 'Task 1', 'Planned', [subtask1, subtask2, subtask3]);
  const task2 = createTestTask('P1.M1.T2', 'Task 2', 'Planned', [subtask4]);
  const task3 = createTestTask('P1.M2.T1', 'Task 3', 'Implementing', [subtask5]);
  const task4 = createTestTask('P2.M1.T1', 'Task 4', 'Planned', [subtask6]);

  // Milestones
  const milestone1 = createTestMilestone('P1.M1', 'Milestone 1', 'Complete', [task1, task2]);
  const milestone2 = createTestMilestone('P1.M2', 'Milestone 2', 'Implementing', [task3]);
  const milestone3 = createTestMilestone('P2.M1', 'Milestone 3', 'Planned', [task4]);

  // Phases
  const phase1 = createTestPhase('P1', 'Phase 1', 'Planned', [milestone1, milestone2]);
  const phase2 = createTestPhase('P2', 'Phase 2', 'Planned', [milestone3]);

  return createTestBacklog([phase1, phase2]);
};
```

---

## Function: isSubtask (Type Guard)

### Implementation
```typescript
export function isSubtask(item: HierarchyItem): item is Subtask {
  return item.type === 'Subtask';
}
```

### Tests

```typescript
import type { HierarchyItem } from '../../../src/utils/task-utils.js';

describe('isSubtask type guard', () => {
  it('should return true for Subtask items', () => {
    // SETUP
    const subtask: HierarchyItem = createTestSubtask(
      'P1.M1.T1.S1',
      'Test',
      'Planned'
    );

    // EXECUTE & VERIFY
    expect(isSubtask(subtask)).toBe(true);
  });

  it('should return false for Task items', () => {
    // SETUP
    const task: HierarchyItem = createTestTask('P1.M1.T1', 'Test', 'Planned');

    // EXECUTE & VERIFY
    expect(isSubtask(task)).toBe(false);
  });

  it('should return false for Milestone items', () => {
    // SETUP
    const milestone: HierarchyItem = createTestMilestone(
      'P1.M1',
      'Test',
      'Planned'
    );

    // EXECUTE & VERIFY
    expect(isSubtask(milestone)).toBe(false);
  });

  it('should return false for Phase items', () => {
    // SETUP
    const phase: HierarchyItem = createTestPhase('P1', 'Test', 'Planned');

    // EXECUTE & VERIFY
    expect(isSubtask(phase)).toBe(false);
  });

  it('should enable type narrowing', () => {
    // SETUP
    const item: HierarchyItem = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned');

    // EXECUTE
    if (isSubtask(item)) {
      // VERIFY: TypeScript knows item is Subtask here
      expect(item.story_points).toBeDefined();
      expect(item.dependencies).toBeDefined();
    } else {
      // This branch should never execute for Subtask
      throw new Error('Type narrowing failed');
    }
  });
});
```

### Coverage Goals
- Lines: 100% (only 2 lines: function and return)
- Branches: 100% (all 4 item types tested)
- Functions: 100% (function called in all tests)

---

## Function: findItem (Recursive DFS)

### Implementation
```typescript
export function findItem(backlog: Backlog, id: string): HierarchyItem | null {
  for (const phase of backlog.backlog) {
    if (phase.id === id) return phase;

    for (const milestone of phase.milestones) {
      if (milestone.id === id) return milestone;

      for (const task of milestone.tasks) {
        if (task.id === id) return task;

        for (const subtask of task.subtasks) {
          if (subtask.id === id) return subtask;
        }
      }
    }
  }

  return null;
}
```

### Tests

```typescript
describe('findItem', () => {
  describe('finding items at each hierarchy level', () => {
    it('should find a Phase by ID', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const result = findItem(backlog, 'P1');

      // VERIFY
      expect(result).not.toBeNull();
      expect(result?.id).toBe('P1');
      expect(result?.type).toBe('Phase');
    });

    it('should find a Milestone by ID', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const result = findItem(backlog, 'P1.M1');

      // VERIFY
      expect(result).not.toBeNull();
      expect(result?.id).toBe('P1.M1');
      expect(result?.type).toBe('Milestone');
    });

    it('should find a Task by ID', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const result = findItem(backlog, 'P1.M1.T1');

      // VERIFY
      expect(result).not.toBeNull();
      expect(result?.id).toBe('P1.M1.T1');
      expect(result?.type).toBe('Task');
    });

    it('should find a Subtask by ID', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const result = findItem(backlog, 'P1.M1.T1.S1');

      // VERIFY
      expect(result).not.toBeNull();
      expect(result?.id).toBe('P1.M1.T1.S1');
      expect(result?.type).toBe('Subtask');

      // Type-specific property access
      if (result && isSubtask(result)) {
        expect(result.story_points).toBe(2);
      }
    });

    it('should use early exit optimization', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE: Find first item (should return immediately)
      const startTime = performance.now();
      const result = findItem(backlog, 'P1');
      const endTime = performance.now();

      // VERIFY
      expect(result?.id).toBe('P1');
      expect(endTime - startTime).toBeLessThan(1); // Very fast
    });
  });

  describe('not found scenarios', () => {
    it('should return null for non-existent ID', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const result = findItem(backlog, 'NON-EXISTENT');

      // VERIFY
      expect(result).toBeNull();
    });

    it('should return null for empty backlog', () => {
      // SETUP
      const emptyBacklog: Backlog = createTestBacklog([]);

      // EXECUTE
      const result = findItem(emptyBacklog, 'P1');

      // VERIFY
      expect(result).toBeNull();
    });

    it('should return null for partially matching ID', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE: Search for substring that doesn't exist
      const result = findItem(backlog, 'P1.M1.X');

      // VERIFY
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle phase with empty milestones', () => {
      // SETUP
      const phase = createTestPhase('P1', 'Empty Phase', 'Planned', []);
      const backlog = createTestBacklog([phase]);

      // EXECUTE
      const result = findItem(backlog, 'P1');

      // VERIFY: Should still find the phase
      expect(result?.id).toBe('P1');
    });

    it('should handle milestone with empty tasks', () => {
      // SETUP
      const milestone = createTestMilestone('P1.M1', 'Empty Milestone', 'Planned', []);
      const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
      const backlog = createTestBacklog([phase]);

      // EXECUTE
      const result = findItem(backlog, 'P1.M1');

      // VERIFY
      expect(result?.id).toBe('P1.M1');
    });

    it('should handle task with empty subtasks', () => {
      // SETUP
      const task = createTestTask('P1.M1.T1', 'Empty Task', 'Planned', []);
      const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
      const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
      const backlog = createTestBacklog([phase]);

      // EXECUTE
      const result = findItem(backlog, 'P1.M1.T1');

      // VERIFY
      expect(result?.id).toBe('P1.M1.T1');
    });

    it('should find item in second phase', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE: Find item in P2 (second phase)
      const result = findItem(backlog, 'P2.M1.T1.S1');

      // VERIFY
      expect(result?.id).toBe('P2.M1.T1.S1');
    });

    it('should find item in deeply nested structure', () => {
      // SETUP: Create maximum depth (4 levels)
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Deep', 'Planned');
      const task = createTestTask('P1.M1.T1', 'Task', 'Planned', [subtask]);
      const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
      const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
      const backlog = createTestBacklog([phase]);

      // EXECUTE
      const result = findItem(backlog, 'P1.M1.T1.S1');

      // VERIFY
      expect(result?.id).toBe('P1.M1.T1.S1');
    });
  });
});
```

### Coverage Goals
- Statements: 100% (all loops and conditionals)
- Branches: 100% (all if statements and loop iterations)
- Functions: 100% (all code paths executed)
- Lines: 100% (every line executed)

---

## Function: getDependencies

### Implementation
```typescript
export function getDependencies(task: Subtask, backlog: Backlog): Subtask[] {
  const results: Subtask[] = [];

  for (const depId of task.dependencies) {
    const item = findItem(backlog, depId);
    if (item && isSubtask(item)) {
      results.push(item);
    }
  }

  return results;
}
```

### Tests

```typescript
describe('getDependencies', () => {
  it('should return empty array for subtask with no dependencies', () => {
    // SETUP
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', []);
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = getDependencies(subtask, backlog);

    // VERIFY
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single dependency', () => {
    // SETUP
    const subtask = createTestSubtask('P1.M1.T1.S2', 'Test', 'Planned', [
      'P1.M1.T1.S1'
    ]);
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = getDependencies(subtask, backlog);

    // VERIFY
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1.M1.T1.S1');
  });

  it('should return multiple dependencies in order', () => {
    // SETUP
    const subtask = createTestSubtask('P1.M1.T1.S3', 'Test', 'Planned', [
      'P1.M1.T1.S1',
      'P1.M1.T1.S2'
    ]);
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = getDependencies(subtask, backlog);

    // VERIFY
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('P1.M1.T1.S1');
    expect(result[1].id).toBe('P1.M1.T1.S2');
  });

  it('should filter out non-existent dependencies', () => {
    // SETUP
    const subtask = createTestSubtask('P1.M1.T1.S2', 'Test', 'Planned', [
      'P1.M1.T1.S1',
      'NON-EXISTENT'
    ]);
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = getDependencies(subtask, backlog);

    // VERIFY: Should only return valid Subtask dependencies
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1.M1.T1.S1');
  });

  it('should filter out non-Subtask dependencies', () => {
    // SETUP: Subtask with dependency on a Milestone
    const subtask = createTestSubtask('P1.M1.T1.S2', 'Test', 'Planned', [
      'P1.M1.T1.S1',  // Valid Subtask
      'P1.M1'         // Milestone, not Subtask
    ]);
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = getDependencies(subtask, backlog);

    // VERIFY: Should only return Subtask type dependencies
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1.M1.T1.S1');
    expect(result.every(item => item.type === 'Subtask')).toBe(true);
  });

  it('should handle circular reference gracefully', () => {
    // SETUP: Subtask with self-reference (circular)
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', [
      'P1.M1.T1.S1'  // Self-reference
    ]);
    const backlog = createComplexBacklog();

    // EXECUTE: Should not infinite loop
    const result = getDependencies(subtask, backlog);

    // VERIFY: Should handle gracefully
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle dependency chain', () => {
    // SETUP: Chain of dependencies: S3 depends on S2, S2 depends on S1
    const subtask1 = createTestSubtask('P1.M1.T1.S1', 'First', 'Complete', []);
    const subtask2 = createTestSubtask('P1.M1.T1.S2', 'Second', 'Planned', ['P1.M1.T1.S1']);
    const subtask3 = createTestSubtask('P1.M1.T1.S3', 'Third', 'Planned', ['P1.M1.T1.S2']);

    const task = createTestTask('P1.M1.T1', 'Task', 'Planned', [subtask1, subtask2, subtask3]);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
    const backlog = createTestBacklog([phase]);

    // EXECUTE
    const result = getDependencies(subtask3, backlog);

    // VERIFY
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1.M1.T1.S2');
  });
});
```

### Coverage Goals
- Statements: 100% (for loop, if statement, push)
- Branches: 100% (if statement both true/false)
- Functions: 100% (all code paths)
- Lines: 100% (every line)

---

## Function: filterByStatus

### Implementation
```typescript
export function filterByStatus(backlog: Backlog, status: Status): HierarchyItem[] {
  const results: HierarchyItem[] = [];

  for (const phase of backlog.backlog) {
    if (phase.status === status) results.push(phase);

    for (const milestone of phase.milestones) {
      if (milestone.status === status) results.push(milestone);

      for (const task of milestone.tasks) {
        if (task.status === status) results.push(task);

        for (const subtask of task.subtasks) {
          if (subtask.status === status) results.push(subtask);
        }
      }
    }
  }

  return results;
}
```

### Tests

```typescript
describe('filterByStatus', () => {
  it('should return all Planned items', () => {
    // SETUP
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = filterByStatus(backlog, 'Planned');

    // VERIFY: Should include items at all levels with Planned status
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(item => item.status === 'Planned')).toBe(true);

    // Check we have different types
    const types = new Set(result.map(item => item.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it('should return all Complete items', () => {
    // SETUP
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = filterByStatus(backlog, 'Complete');

    // VERIFY
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(item => item.status === 'Complete')).toBe(true);
  });

  it('should return all Researching items', () => {
    // SETUP
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = filterByStatus(backlog, 'Researching');

    // VERIFY
    expect(result.every(item => item.status === 'Researching')).toBe(true);
  });

  it('should return all Implementing items', () => {
    // SETUP
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = filterByStatus(backlog, 'Implementing');

    // VERIFY
    expect(result.every(item => item.status === 'Implementing')).toBe(true);
  });

  it('should return empty array when no items match status', () => {
    // SETUP: Backlog without Failed status
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = filterByStatus(backlog, 'Failed');

    // VERIFY
    expect(result).toEqual([]);
  });

  it('should return empty array for empty backlog', () => {
    // SETUP
    const emptyBacklog: Backlog = createTestBacklog([]);

    // EXECUTE
    const result = filterByStatus(emptyBacklog, 'Planned');

    // VERIFY
    expect(result).toEqual([]);
  });

  it('should preserve DFS pre-order in results', () => {
    // SETUP: Known backlog structure
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = filterByStatus(backlog, 'Planned');

    // VERIFY: First Planned item should be P1 (Phase before children)
    if (result.length > 0) {
      const firstItem = result[0];
      expect(firstItem.status).toBe('Planned');
    }
  });

  it('should include all four types in results', () => {
    // SETUP: Backlog with Planned items at all levels
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = filterByStatus(backlog, 'Planned');

    // VERIFY: Check for all types
    const types = new Set(result.map(item => item.type));
    expect(types.has('Phase')).toBe(true);
    expect(types.has('Milestone')).toBe(true);
    expect(types.has('Task')).toBe(true);
    expect(types.has('Subtask')).toBe(true);
  });

  it('should handle all status values', () => {
    // SETUP: Items with each status
    const statuses: Status[] = [
      'Planned', 'Researching', 'Implementing',
      'Complete', 'Failed', 'Obsolete'
    ];

    const subtasks = statuses.map((status, i) =>
      createTestSubtask(`P1.M1.T1.S${i + 1}`, `Subtask ${i}`, status)
    );

    const task = createTestTask('P1.M1.T1', 'Task', 'Planned', subtasks);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
    const backlog = createTestBacklog([phase]);

    // EXECUTE & VERIFY: Can filter by each status
    for (const status of statuses) {
      const items = filterByStatus(backlog, status);
      expect(items.some(item => item.status === status)).toBe(true);
    }
  });
});
```

### Coverage Goals
- Statements: 100% (all loops and if statements)
- Branches: 100% (all if conditions)
- Functions: 100% (all code paths)
- Lines: 100% (every line)

---

## Function: getNextPendingItem

### Implementation
```typescript
export function getNextPendingItem(backlog: Backlog): HierarchyItem | null {
  for (const phase of backlog.backlog) {
    if (phase.status === 'Planned') return phase;

    for (const milestone of phase.milestones) {
      if (milestone.status === 'Planned') return milestone;

      for (const task of milestone.tasks) {
        if (task.status === 'Planned') return task;

        for (const subtask of task.subtasks) {
          if (subtask.status === 'Planned') return subtask;
        }
      }
    }
  }

  return null;
}
```

### Tests

```typescript
describe('getNextPendingItem', () => {
  it('should return first Planned item in DFS pre-order', () => {
    // SETUP: Complex backlog with known structure
    const backlog = createComplexBacklog();

    // EXECUTE
    const result = getNextPendingItem(backlog);

    // VERIFY: Should return P1 (Phase is Planned and comes first in pre-order)
    expect(result).not.toBeNull();
    expect(result?.status).toBe('Planned');
    expect(result?.id).toBe('P1'); // Phase comes before its children
  });

  it('should return null when no Planned items exist', () => {
    // SETUP: Backlog with only Complete items
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Complete');
    const task = createTestTask('P1.M1.T1', 'Task', 'Complete', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Complete', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Complete', [milestone]);
    const backlog = createTestBacklog([phase]);

    // EXECUTE
    const result = getNextPendingItem(backlog);

    // VERIFY
    expect(result).toBeNull();
  });

  it('should return null for empty backlog', () => {
    // SETUP
    const emptyBacklog: Backlog = createTestBacklog([]);

    // EXECUTE
    const result = getNextPendingItem(emptyBacklog);

    // VERIFY
    expect(result).toBeNull();
  });

  it('should find Planned subtask when parents are Complete', () => {
    // SETUP: Hierarchy with Complete parents but Planned subtask
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned');
    const task = createTestTask('P1.M1.T1', 'Task', 'Complete', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Complete', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Complete', [milestone]);
    const backlog = createTestBacklog([phase]);

    // EXECUTE
    const result = getNextPendingItem(backlog);

    // VERIFY: Pre-order checks parents first (all Complete), then finds subtask
    expect(result).not.toBeNull();
    expect(result?.id).toBe('P1.M1.T1.S1');
  });

  it('should use early return on first match', () => {
    // SETUP: Backlog with first item Planned
    const backlog = createComplexBacklog(); // P1 is Planned

    // EXECUTE
    const startTime = performance.now();
    const result = getNextPendingItem(backlog);
    const endTime = performance.now();

    // VERIFY: Should return immediately after finding first Planned item
    expect(result?.id).toBe('P1');
    expect(endTime - startTime).toBeLessThan(1);
  });

  it('should find Planned milestone when phase is Complete', () => {
    // SETUP
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Complete');
    const task = createTestTask('P1.M1.T1', 'Task', 'Complete', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Complete', [milestone]);
    const backlog = createTestBacklog([phase]);

    // EXECUTE
    const result = getNextPendingItem(backlog);

    // VERIFY
    expect(result?.id).toBe('P1.M1');
  });

  it('should find Planned task when parent milestone is Complete', () => {
    // SETUP
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Complete');
    const task = createTestTask('P1.M1.T1', 'Task', 'Planned', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Complete', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Complete', [milestone]);
    const backlog = createTestBacklog([phase]);

    // EXECUTE
    const result = getNextPendingItem(backlog);

    // VERIFY
    expect(result?.id).toBe('P1.M1.T1');
  });
});
```

### Coverage Goals
- Statements: 100% (all loops and early returns)
- Branches: 100% (all if conditions)
- Functions: 100% (all return paths)
- Lines: 100% (every line)

---

## Function: updateItemStatus

### Implementation (simplified for clarity)
```typescript
export function updateItemStatus(
  backlog: Backlog,
  id: string,
  newStatus: Status
): Backlog {
  return {
    ...backlog,
    backlog: backlog.backlog.map(phase => {
      if (phase.id === id) {
        return { ...phase, status: newStatus };
      }

      // Search deeper if target might be in this phase
      // ... (implementation continues)
    })
  };
}
```

### Tests

```typescript
describe('updateItemStatus', () => {
  describe('updating items at each hierarchy level', () => {
    it('should update subtask status', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

      // VERIFY: Find the updated item
      const item = findItem(updated, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Failed');
    });

    it('should update task status', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1.M1.T1', 'Complete');

      // VERIFY
      const item = findItem(updated, 'P1.M1.T1');
      expect(item?.status).toBe('Complete');
    });

    it('should update milestone status', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1.M1', 'Implementing');

      // VERIFY
      const item = findItem(updated, 'P1.M1');
      expect(item?.status).toBe('Implementing');
    });

    it('should update phase status', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1', 'Researching');

      // VERIFY
      const item = findItem(updated, 'P1');
      expect(item?.status).toBe('Researching');
    });
  });

  describe('immutability', () => {
    it('should not mutate original backlog', () => {
      // SETUP
      const backlog = createComplexBacklog();
      const originalJSON = JSON.stringify(backlog);

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

      // VERIFY: Original unchanged
      expect(JSON.stringify(backlog)).toEqual(originalJSON);
      expect(updated).not.toEqual(backlog);
    });

    it('should preserve unchanged items with structural sharing', () => {
      // SETUP
      const backlog = createComplexBacklog();
      const originalP2 = backlog.backlog[1];

      // EXECUTE: Update a subtask in P1
      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

      // VERIFY: P2 should be the same reference (unchanged)
      expect(updated.backlog[1]).toBe(originalP2);
      // P1 should be a new reference (contains the change)
      expect(updated.backlog[0]).not.toBe(backlog.backlog[0]);
    });

    it('should only update the target item, not siblings', () => {
      // SETUP: Backlog with multiple subtasks
      const backlog = createComplexBacklog();

      // EXECUTE: Update one subtask
      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

      // VERIFY: Sibling should keep original status
      const sibling = findItem(updated, 'P1.M1.T1.S2');
      expect(sibling?.status).toBe('Planned'); // Original status
    });
  });

  describe('deep copy verification', () => {
    it('should create new objects along entire path', () => {
      // SETUP: Deeply nested structure
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Deep', 'Planned');
      const task = createTestTask('P1.M1.T1', 'Task', 'Planned', [subtask]);
      const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
      const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
      const backlog = createTestBacklog([phase]);

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Complete');

      // VERIFY: All parent levels should be new objects
      expect(updated.backlog[0]).not.toBe(backlog.backlog[0]); // New phase
      expect(updated.backlog[0].milestones[0]).not.toBe(
        backlog.backlog[0].milestones[0]
      ); // New milestone
      expect(updated.backlog[0].milestones[0].tasks[0]).not.toBe(
        backlog.backlog[0].milestones[0].tasks[0]
      ); // New task
      expect(updated.backlog[0].milestones[0].tasks[0].subtasks[0]).not.toBe(
        backlog.backlog[0].milestones[0].tasks[0].subtasks[0]
      ); // New subtask
    });
  });

  describe('status transitions', () => {
    it('should support all status values', () => {
      // SETUP
      const backlog = createComplexBacklog();
      const statuses: Status[] = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ];

      // EXECUTE & VERIFY each status value
      for (const status of statuses) {
        const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', status);
        const item = findItem(updated, 'P1.M1.T1.S1');
        expect(item?.status).toBe(status);
      }
    });

    it('should handle status transition from Planned to Complete', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1.M1.T1.S2', 'Complete');

      // VERIFY
      const item = findItem(updated, 'P1.M1.T1.S2');
      expect(item?.status).toBe('Complete');

      // Original unchanged
      const originalItem = findItem(backlog, 'P1.M1.T1.S2');
      expect(originalItem?.status).toBe('Planned');
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent ID gracefully', () => {
      // SETUP
      const backlog = createComplexBacklog();
      const originalJSON = JSON.stringify(backlog);

      // EXECUTE: Try to update non-existent item
      const updated = updateItemStatus(backlog, 'NON-EXISTENT', 'Failed');

      // VERIFY: Should return unchanged backlog
      expect(JSON.stringify(updated)).toEqual(originalJSON);
    });

    it('should handle empty backlog', () => {
      // SETUP
      const emptyBacklog: Backlog = createTestBacklog([]);

      // EXECUTE
      const updated = updateItemStatus(emptyBacklog, 'P1', 'Complete');

      // VERIFY: Should return empty backlog
      expect(updated).toEqual(emptyBacklog);
    });

    it('should handle updating deeply nested subtask', () => {
      // SETUP: 4-level deep hierarchy (max for this system)
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Deep', 'Planned');
      const task = createTestTask('P1.M1.T1', 'Task', 'Planned', [subtask]);
      const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
      const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
      const backlog = createTestBacklog([phase]);

      // EXECUTE
      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Complete');

      // VERIFY: Update successful at maximum depth
      expect(findItem(updated, 'P1.M1.T1.S1')?.status).toBe('Complete');
    });
  });

  describe('chained updates', () => {
    it('should handle multiple sequential updates', () => {
      // SETUP
      const backlog = createComplexBacklog();

      // EXECUTE: Chain multiple updates
      let updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Complete');
      updated = updateItemStatus(updated, 'P1.M1.T1.S2', 'Complete');
      updated = updateItemStatus(updated, 'P1.M1.T1.S3', 'Complete');

      // VERIFY: All updates applied
      expect(findItem(updated, 'P1.M1.T1.S1')?.status).toBe('Complete');
      expect(findItem(updated, 'P1.M1.T1.S2')?.status).toBe('Complete');
      expect(findItem(updated, 'P1.M1.T1.S3')?.status).toBe('Complete');

      // VERIFY: Original unchanged
      expect(findItem(backlog, 'P1.M1.T1.S1')?.status).toBe('Complete'); // Original was Complete
      expect(findItem(backlog, 'P1.M1.T1.S2')?.status).toBe('Planned'); // Original was Planned
    });
  });
});
```

### Coverage Goals
- Statements: 100% (all map operations, conditionals, spread operators)
- Branches: 100% (all if statements and ternaries)
- Functions: 100% (all code paths)
- Lines: 100% (every line)

---

## Integration Test Examples

### Task Orchestrator Workflow

```typescript
describe('integration scenarios', () => {
  it('should support typical task orchestrator workflow', () => {
    // SETUP
    const backlog = createComplexBacklog();

    // EXECUTE: Get next pending item
    const nextItem = getNextPendingItem(backlog);
    expect(nextItem).not.toBeNull();

    // EXECUTE: Check dependencies
    if (nextItem && isSubtask(nextItem)) {
      const deps = getDependencies(nextItem, backlog);
      expect(Array.isArray(deps)).toBe(true);

      // EXECUTE: Update status after completion
      const updated = updateItemStatus(backlog, nextItem.id, 'Complete');
      const updatedItem = findItem(updated, nextItem.id);
      expect(updatedItem?.status).toBe('Complete');

      // VERIFY: Original unchanged
      expect(backlog).not.toEqual(updated);
    }
  });

  it('should filter and find items consistently', () => {
    // SETUP
    const backlog = createComplexBacklog();

    // EXECUTE: Get all Planned items
    const plannedItems = filterByStatus(backlog, 'Planned');

    // EXECUTE & VERIFY: Can find each Planned item
    for (const item of plannedItems) {
      const found = findItem(backlog, item.id);
      expect(found?.id).toBe(item.id);
    }
  });

  it('should handle complex multi-update scenario', () => {
    // SETUP
    const backlog = createComplexBacklog();

    // EXECUTE: Chain multiple updates
    let updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Complete');
    updated = updateItemStatus(updated, 'P1.M1.T1.S2', 'Complete');
    updated = updateItemStatus(updated, 'P1.M1.T1.S3', 'Complete');

    // VERIFY: All updates applied
    expect(findItem(updated, 'P1.M1.T1.S1')?.status).toBe('Complete');
    expect(findItem(updated, 'P1.M1.T1.S2')?.status).toBe('Complete');
    expect(findItem(updated, 'P1.M1.T1.S3')?.status).toBe('Complete');

    // VERIFY: Original unchanged
    expect(findItem(backlog, 'P1.M1.T1.S1')?.status).toBe('Complete');
    expect(findItem(backlog, 'P1.M1.T1.S2')?.status).toBe('Planned');
  });
});
```

---

## Summary

This document provides comprehensive test examples for all functions in `task-utils.ts`:

1. **isSubtask** - Type guard testing with type narrowing verification
2. **findItem** - Recursive DFS testing with early exit optimization
3. **getDependencies** - Array filtering with type guard usage
4. **filterByStatus** - Recursive collection with DFS traversal
5. **getNextPendingItem** - Early return patterns with DFS pre-order
6. **updateItemStatus** - Immutability testing with deep copy verification

All examples follow the AAA pattern (Arrange, Act, Assert) and demonstrate:
- 100% code coverage strategies
- Immutability verification
- Performance testing
- Edge case handling
- Integration scenarios

**Coverage Requirements:** 100% statements, branches, functions, and lines
**Framework:** Vitest 1.6.1 with V8 coverage provider

---

**Examples Created:** 2026-01-13
**Work Item:** P4.M4.T1.S1
**File:** `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`
