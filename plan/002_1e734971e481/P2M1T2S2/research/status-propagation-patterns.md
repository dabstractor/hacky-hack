# Research: Hierarchical Status Update Propagation Patterns

**Document ID**: P2.M1.T2.S2-RES-001
**Generated**: 2026-01-15
**Purpose**: Research on best practices for hierarchical status update propagation in task management systems

---

## Executive Summary

This document provides comprehensive research on hierarchical status update propagation patterns, including bottom-up aggregation, top-down cascading, and event-driven approaches. The research documents industry best practices, implementation patterns, and testing strategies for validating status update behavior in deep hierarchy structures.

**Key Finding**: The current implementation in this codebase does **NOT** implement any propagation behavior - it only updates the exact item matching the provided ID with no cascading to children or parents.

---

## 1. Propagation Strategy Patterns

### 1.1 No Propagation (Current Implementation)

**Description**: Status updates affect only the target item with no side effects on children or parents.

**Characteristics**:

- Exact ID matching required
- No cascading to descendants
- No propagation to ancestors
- Simple, predictable behavior
- Manual status management required

**Example**:

```typescript
// Update subtask: only that subtask changes
updateItemStatus('P1.M1.T1.S1', 'Complete');
// Result: S1=Complete, T1=Planned, M1=Planned, P1=Planned

// Update milestone: only that milestone changes
updateItemStatus('P1.M1', 'Implementing');
// Result: M1=Implementing, all tasks/subtasks remain unchanged
```

**Use Cases**:

- Granular status control needed
- Different items progress independently
- Manual coordination acceptable
- Simple workflow requirements

**Pros**:

- Simple implementation
- Predictable behavior
- No surprising side effects
- Easy to reason about
- Fast (no recursive updates)

**Cons**:

- Manual status coordination required
- Possible inconsistency (parent Complete with children Planned)
- More manual work to maintain consistency
- No automatic aggregation

**Current Implementation**: This codebase uses this pattern.

---

### 1.2 Bottom-Up Propagation (Parent Aggregation)

**Description**: Parent status automatically derived from child statuses. When children change, parent recalculates.

**Characteristics**:

- Child updates trigger parent recalculation
- Parent status is computed, not stored (or synced with children)
- Recursive propagation up the hierarchy
- Ensures consistency between parent and children

**Aggregation Rules**:

```typescript
function calculateParentStatus(children: HierarchyItem[]): Status {
  const allComplete = children.every(c => c.status === 'Complete');
  const anyFailed = children.some(c => c.status === 'Failed');
  const anyInProgress = children.some(
    c => c.status === 'Researching' || c.status === 'Implementing'
  );

  if (anyFailed) return 'Failed';
  if (allComplete) return 'Complete';
  if (anyInProgress) return 'Implementing';
  return 'Planned';
}
```

**Example**:

```typescript
// Update all subtasks to Complete
updateItemStatus('P1.M1.T1.S1', 'Complete');
updateItemStatus('P1.M1.T1.S2', 'Complete');
updateItemStatus('P1.M1.T1.S3', 'Complete');
// Result: T1 automatically becomes Complete (all children Complete)

// Update one subtask to Failed
updateItemStatus('P1.M1.T1.S1', 'Failed');
// Result: T1 automatically becomes Failed (one child Failed)
```

**Implementation Pattern**:

```typescript
function updateItemStatusWithPropagation(
  backlog: Backlog,
  itemId: string,
  newStatus: Status
): Backlog {
  // Update target item
  let updated = updateItemStatus(backlog, itemId, newStatus);

  // Find and propagate to parent
  const item = findItem(updated, itemId);
  if (!item) return updated;

  const parentId = getParentId(itemId);
  if (!parentId) return updated;

  return propagateParentStatus(updated, parentId);
}

function propagateParentStatus(backlog: Backlog, parentId: string): Backlog {
  const parent = findItem(backlog, parentId);
  if (!parent) return backlog;

  const children = getChildren(backlog, parentId);
  const aggregatedStatus = calculateParentStatus(children);

  const updated = updateItemStatus(backlog, parentId, aggregatedStatus);

  // Recurse up to root
  const grandparentId = getParentId(parentId);
  return grandparentId
    ? propagateParentStatus(updated, grandparentId)
    : updated;
}
```

**Use Cases**:

- Parent status should reflect children status
- Automatic status consistency desired
- Reduced manual coordination
- Clear progress visibility

**Pros**:

- Automatic consistency
- Clear progress indicators
- Reduced manual work
- Parent always accurate

**Cons**:

- More complex implementation
- Recursive updates can be expensive
- Less granular control
- May not match all workflows

---

### 1.3 Top-Down Cascade (Parent Push)

**Description**: Parent status changes automatically propagate to all descendants. When parent changes, children sync.

**Characteristics**:

- Parent updates trigger child updates
- All descendants receive same status
- Recursive propagation down the hierarchy
- Ensures uniform status across subtree

**Example**:

```typescript
// Update milestone to Obsolete
updateItemStatusCascade('P1.M1', 'Obsolete');
// Result: M1=Obsolete, all tasks=Obsolete, all subtasks=Obsolete

// Update task to Failed
updateItemStatusCascade('P1.M1.T1', 'Failed');
// Result: T1=Failed, all subtasks=Failed
```

**Implementation Pattern**:

```typescript
function updateItemStatusCascade(
  backlog: Backlog,
  itemId: string,
  newStatus: Status
): Backlog {
  // Update target item
  let updated = updateItemStatus(backlog, itemId, newStatus);

  // Get all descendants
  const descendants = getAllDescendants(updated, itemId);

  // Update all descendants
  for (const descendant of descendants) {
    updated = updateItemStatus(updated, descendant.id, newStatus);
  }

  return updated;
}

function getAllDescendants(backlog: Backlog, itemId: string): HierarchyItem[] {
  const descendants: HierarchyItem[] = [];
  const item = findItem(backlog, itemId);

  if (!item) return descendants;

  // Collect based on item type
  if (item.type === 'Phase') {
    for (const milestone of item.milestones) {
      descendants.push(milestone);
      for (const task of milestone.tasks) {
        descendants.push(task);
        descendants.push(...task.subtasks);
      }
    }
  } else if (item.type === 'Milestone') {
    for (const task of item.tasks) {
      descendants.push(task);
      descendants.push(...task.subtasks);
    }
  } else if (item.type === 'Task') {
    descendants.push(...item.subtasks);
  }

  return descendants;
}
```

**Use Cases**:

- Bulk status changes needed
- Terminal states (Obsolete, Failed) should apply to subtree
- Simplified workflow management
- Uniform subtree status

**Pros**:

- Easy bulk updates
- Consistent subtree status
- Useful for terminal states
- Reduced manual work

**Cons**:

- Loss of granular status
- May not match all workflows
- Recursive updates expensive
- Can override important status

---

### 1.4 Hybrid Propagation (Bidirectional)

**Description**: Combines bottom-up and top-down strategies based on context and status type.

**Characteristics**:

- Some statuses cascade down (e.g., Obsolete)
- Some statuses aggregate up (e.g., Complete)
- Different behavior based on status type
- Most flexible approach

**Rules Example**:

```typescript
const CASCADE_DOWN = ['Obsolete', 'Failed'];
const AGGREGATE_UP = ['Complete', 'Implementing'];
const NO_PROPAGATE = ['Planned', 'Researching'];

function updateItemStatusHybrid(
  backlog: Backlog,
  itemId: string,
  newStatus: Status
): Backlog {
  let updated = updateItemStatus(backlog, itemId, newStatus);

  // Cascade down for terminal states
  if (CASCADE_DOWN.includes(newStatus)) {
    updated = cascadeDown(updated, itemId, newStatus);
  }

  // Aggregate up for completion states
  if (AGGREGATE_UP.includes(newStatus)) {
    updated = aggregateUp(updated, itemId);
  }

  return updated;
}
```

**Use Cases**:

- Complex workflow requirements
- Different behavior for different statuses
- Maximum flexibility
- Advanced use cases

**Pros**:

- Most flexible
- Matches complex workflows
- Can optimize for each status
- Best user experience

**Cons**:

- Most complex implementation
- Harder to reason about
- More edge cases
- Potential for conflicting rules

---

### 1.5 Event-Driven Propagation

**Description**: Status changes emit events that trigger propagation. Decoupled architecture with listeners.

**Characteristics**:

- Status changes emit events
- Listeners react to events
- Fully decoupled architecture
- Extensible and flexible

**Implementation Pattern**:

```typescript
interface StatusChangeEvent {
  itemId: string;
  oldStatus: Status;
  newStatus: Status;
  timestamp: Date;
}

type StatusChangeListener = (event: StatusChangeEvent) => void;

class StatusUpdateManager {
  private listeners: StatusChangeListener[] = [];

  onStatusChange(listener: StatusChangeListener) {
    this.listeners.push(listener);
  }

  updateStatus(
    backlog: Backlog,
    itemId: string,
    newStatus: Status
  ): { backlog: Backlog; event: StatusChangeEvent } {
    const item = findItem(backlog, itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    const oldStatus = item.status;
    const updated = updateItemStatus(backlog, itemId, newStatus);

    const event: StatusChangeEvent = {
      itemId,
      oldStatus,
      newStatus,
      timestamp: new Date(),
    };

    // Notify listeners
    this.listeners.forEach(listener => listener(event));

    return { backlog: updated, event };
  }
}

// Usage
const manager = new StatusUpdateManager();

// Listener for parent aggregation
manager.onStatusChange(event => {
  if (shouldAggregateToParent(event.newStatus)) {
    updateParentStatus(event.itemId);
  }
});

// Listener for child cascade
manager.onStatusChange(event => {
  if (shouldCascadeToChildren(event.newStatus)) {
    cascadeToChildren(event.itemId, event.newStatus);
  }
});

// Listener for logging
manager.onStatusChange(event => {
  logger.info(
    {
      item: event.itemId,
      from: event.oldStatus,
      to: event.newStatus,
      time: event.timestamp,
    },
    'Status changed'
  );
});
```

**Use Cases**:

- Complex business logic
- Multiple propagation strategies
- Audit logging requirements
- External system integration

**Pros**:

- Highly extensible
- Decoupled architecture
- Easy to add new listeners
- Clear event history

**Cons**:

- Most complex to implement
- More overhead
- Harder to debug
- Event ordering concerns

---

## 2. Status Transition Validation

### 2.1 State Machine Pattern

**Description**: Enforce valid status transitions using a state machine. Prevent invalid status changes.

**Valid Transitions**:

```typescript
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  Planned: ['Researching', 'Implementing', 'Obsolete', 'Failed'],
  Researching: ['Implementing', 'Planned', 'Obsolete', 'Failed'],
  Implementing: ['Complete', 'Failed', 'Obsolete'],
  Complete: ['Researching', 'Implementing', 'Obsolete'], // Allow rework
  Failed: ['Planned', 'Researching', 'Obsolete'], // Allow retry
  Obsolete: [], // Terminal state
};
```

**Validation Function**:

```typescript
function isValidStatusTransition(
  currentStatus: Status,
  newStatus: Status
): boolean {
  if (currentStatus === newStatus) return true; // No-op is valid
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
```

**Error Type**:

```typescript
export class InvalidStatusTransitionError extends Error {
  constructor(
    itemId: string,
    currentStatus: Status,
    newStatus: Status,
    public readonly validTransitions: Status[]
  ) {
    super(
      `Invalid status transition for item "${itemId}": ` +
        `${currentStatus} → ${newStatus}. ` +
        `Valid transitions are: ${validTransitions.join(', ')}`
    );
    this.name = 'InvalidStatusTransitionError';
  }
}
```

**Usage**:

```typescript
function updateItemStatusWithValidation(
  backlog: Backlog,
  itemId: string,
  newStatus: Status
): Backlog {
  const item = findItem(backlog, itemId);
  if (!item) {
    throw new Error(`Item ${itemId} not found`);
  }

  if (!isValidStatusTransition(item.status, newStatus)) {
    throw new InvalidStatusTransitionError(
      itemId,
      item.status,
      newStatus,
      VALID_TRANSITIONS[item.status] ?? []
    );
  }

  return updateItemStatus(backlog, itemId, newStatus);
}
```

---

## 3. Testing Patterns for Status Propagation

### 3.1 Test Structure

**Pattern**: SETUP / EXECUTE / VERIFY

```typescript
it('should update subtask without affecting parents', async () => {
  // SETUP: Create session with multi-level hierarchy
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();
  const tasksPath = createTasksJson(manager, multiLevelFixture);

  // EXECUTE: Update subtask status
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // VERIFY: Subtask changed, parents unchanged
  const session = manager.currentSession!;
  expect(
    session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0].status
  ).toBe('Complete');
  expect(session.taskRegistry.backlog[0].milestones[0].tasks[0].status).toBe(
    'Planned'
  ); // Unchanged
});
```

### 3.2 Parameterized Tests

**Pattern**: Use `test.each()` for data-driven testing

```typescript
it.each([
  ['Planned'],
  ['Researching'],
  ['Implementing'],
  ['Complete'],
  ['Failed'],
  ['Obsolete'],
])('should accept status value: %s', async status => {
  const manager = await createTestSession();
  await manager.updateItemStatus('P1.M1.T1.S1', status as Status);

  const session = manager.currentSession!;
  expect(
    session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0].status
  ).toBe(status);
});
```

### 3.3 Hierarchy Validation

**Pattern**: Verify structure preserved after updates

```typescript
it('should preserve hierarchy structure after updates', async () => {
  const manager = await createTestSession();

  // Count items before
  const before = countAllItems(manager.currentSession!.taskRegistry);

  // Perform updates
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1', 'Implementing');

  // Count items after
  const after = countAllItems(manager.currentSession!.taskRegistry);

  // Verify same counts
  expect(before.phases).toBe(after.phases);
  expect(before.milestones).toBe(after.milestones);
  expect(before.tasks).toBe(after.tasks);
  expect(before.subtasks).toBe(after.subtasks);
});

function countAllItems(backlog: Backlog) {
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
```

---

## 4. URLs and References

**Documentation**:

- [Vitest Documentation](https://vitest.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

**Your Project Files**:

- `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
- `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`
- `/home/dustin/projects/hacky-hack/src/core/models.ts`
- `/home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts`

---

## 5. Summary

**Current Implementation**: No propagation (exact match only)

**Recommended Enhancements** (if needed):

1. Add bottom-up aggregation for parent status consistency
2. Add state machine validation for status transitions
3. Keep no-propagation as default, add opt-in propagation modes
4. Consider event-driven architecture for complex workflows

**Testing Strategy**:

- Document actual behavior (no propagation)
- Test all hierarchy levels independently
- Verify no side effects on other levels
- Test invalid inputs and edge cases

---

**END OF RESEARCH DOCUMENT**
