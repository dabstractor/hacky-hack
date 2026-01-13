# Hierarchy Data Structures Research

## Summary

This document details the existing Backlog and task hierarchy data structures in the codebase that are relevant to scope parser implementation.

## Core Type Definitions (from src/core/models.ts)

### Backlog Interface (Lines 587-599)

```typescript
export interface Backlog {
  readonly backlog: Phase[];
}
```

### Phase Interface (Lines 478-513)

```typescript
export interface Phase {
  readonly id: string; // Format: P{phase} e.g., 'P1'
  readonly type: 'Phase';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly milestones: Milestone[];
}
```

### Milestone Interface (Lines 381-416)

```typescript
export interface Milestone {
  readonly id: string; // Format: P{phase}.M{milestone} e.g., 'P1.M1'
  readonly type: 'Milestone';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly tasks: Task[];
}
```

### Task Interface (Lines 286-322)

```typescript
export interface Task {
  readonly id: string; // Format: P{phase}.M{milestone}.T{task} e.g., 'P1.M1.T1'
  readonly type: 'Task';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly subtasks: Subtask[];
}
```

### Subtask Interface (Lines 149-211)

```typescript
export interface Subtask {
  readonly id: string; // Format: P{phase}.M{milestone}.T{task}.S{subtask} e.g., 'P1.M1.T1.S1'
  readonly type: 'Subtask';
  readonly title: string;
  readonly status: Status;
  readonly story_points: number;
  readonly dependencies: string[];
  readonly context_scope: string;
}
```

### Status Type (Lines 55-61)

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

### ItemType Union (Lines 102)

```typescript
export type ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask';
```

## ID Pattern Convention

The codebase uses a strict dot-notation hierarchy:

| Level     | Pattern                                    | Example          | Regex                        |
| --------- | ------------------------------------------ | ---------------- | ---------------------------- |
| Phase     | `P{number}`                                | `P1`, `P2`       | `/^P\d+$/`                   |
| Milestone | `P{phase}.M{milestone}`                    | `P1.M1`, `P1.M2` | `/^P\d+\.M\d+$/`             |
| Task      | `P{phase}.M{milestone}.T{task}`            | `P1.M1.T1`       | `/^P\d+\.M\d+\.T\d+$/`       |
| Subtask   | `P{phase}.M{milestone}.T{task}.S{subtask}` | `P1.M1.T1.S1`    | `/^P\d+\.M\d+\.T\d+\.S\d+$/` |

## Existing Utility Functions (from src/utils/task-utils.ts)

### findItem Function (Lines 90-108)

```typescript
export function findItem(backlog: Backlog, id: string): HierarchyItem | null;
```

- Uses DFS pre-order traversal
- Returns first matching item by exact ID
- Early exit for efficiency

### filterByStatus Function (Lines 165-188)

```typescript
export function filterByStatus(
  backlog: Backlog,
  status: Status
): HierarchyItem[];
```

- Returns all items with specified status across all hierarchy levels
- Uses DFS traversal, maintains pre-order

### getNextPendingItem Function (Lines 212-230)

```typescript
export function getNextPendingItem(backlog: Backlog): HierarchyItem | null;
```

- Finds first item with 'Planned' status in DFS pre-order
- Checks parent before children

## Type Guards and Union Types

```typescript
export type HierarchyItem = Phase | Milestone | Task | Subtask;

export function isSubtask(item: HierarchyItem): item is Subtask;
export function isTask(item: HierarchyItem): item is Task;
export function isMilestone(item: HierarchyItem): item is Milestone;
export function isPhase(item: HierarchyItem): item is Phase;
```

## Missing Functionality for Scope Resolution

Based on the analysis, the following utilities need to be implemented:

1. **ID Decomposition**: Parse hierarchical IDs into components (phase, milestone, task, subtask numbers)
2. **Scope Pattern Matching**: Match items against scope patterns like "P1.M1.\*"
3. **Descendant Collection**: Get all descendants of a node
4. **Leaf Node Finding**: Find all leaf subtasks in a scope
5. **Parent Finding**: Find the parent of a given item

## References

- **src/core/models.ts**: Complete type definitions
- **src/utils/task-utils.ts**: Existing hierarchy utilities
