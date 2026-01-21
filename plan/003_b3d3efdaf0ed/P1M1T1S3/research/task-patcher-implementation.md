# TaskPatcher Implementation Research

## Overview

TaskPatcher is a core utility that manages task lifecycle changes during delta sessions. It transforms task backlogs based on PRD changes, marking tasks as new, modified, or obsolete while preserving completed work.

## Core Files and Locations

### 1. Main Implementation

**File**: `/home/dustin/projects/hacky-hack/src/core/task-patcher.ts`

#### patchBacklog() Function

- **Lines**: 64-110
- **Signature**: `function patchBacklog(backlog: Backlog, deltaAnalysis: DeltaAnalysis): Backlog`
- **Purpose**: Applies delta analysis to task backlog, marking tasks appropriately

**Change Type Handling Logic** (lines 85-106):

1. **Modified Changes** ('modified'):
   - **Action**: Resets task status to 'Planned'
   - **Purpose**: Forces re-implementation of changed requirements
   - **Code**: `updateItemStatus(patchedBacklog, taskId, 'Planned')`
   - **Effect**: Tasks with 'Complete' or 'Failed' status are reset to 'Planned' for re-execution

2. **Removed Changes** ('removed'):
   - **Action**: Sets task status to 'Obsolete'
   - **Purpose**: Marks deprecated work items for tracking
   - **Code**: `updateItemStatus(patchedBacklog, taskId, 'Obsolete')`
   - **Effect**: Tasks are preserved in backlog but marked as obsolete

3. **Added Changes** ('added'):
   - **Action**: Logs warning (placeholder implementation)
   - **Purpose**: Placeholder for future new task generation
   - **Code**: Logs warning but doesn't modify backlog
   - **Note**: Full implementation not yet complete

### 2. Data Models

**File**: `/home/dustin/projects/hacky-hack/src/core/models.ts`

#### RequirementChange Interface

- **Lines**: 1443-1511

```typescript
export interface RequirementChange {
  readonly type: 'added' | 'modified' | 'removed';
  readonly section: string; // Section title
  readonly oldContent?: string; // Original content (for modified/removed)
  readonly newContent?: string; // New content (for added/modified)
  readonly impact: 'high' | 'medium' | 'low';
  readonly affectedTaskIds: string[]; // Task IDs affected by this change
}
```

#### DeltaAnalysis Interface

- **Lines**: 1514-1578

```typescript
export interface DeltaAnalysis {
  readonly hasDelta: boolean;
  readonly changes: RequirementChange[];
  readonly patchInstructions: string; // Human-readable summary
  readonly affectedTaskIds: Set<string>;
}
```

#### Status Enum

- **Lines**: 137-143

```typescript
export enum Status {
  Planned = 'Planned',
  Implementing = 'Implementing',
  Complete = 'Complete',
  Failed = 'Failed',
  Obsolete = 'Obsolete',
  Skipped = 'Skipped',
}
```

### 3. Task Utilities

**File**: `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`

#### updateItemStatus() Function

- **Lines**: 301-404
- **Signature**: `function updateItemStatus(backlog: Backlog, itemId: string, newStatus: Status): Backlog`
- **Purpose**: Recursively updates task status in immutable manner

**Algorithm**:

1. Deep clones backlog using spread operators
2. Recursively traverses phases → milestones → tasks → subtasks
3. Updates matching item's status
4. Returns new immutable backlog

#### findItem() Function

- **Lines**: 90-108
- **Signature**: `function findItem(backlog: Backlog, itemId: string): Item | null`
- **Purpose**: Finds item by ID in backlog hierarchy

**Returns**: Item object or null if not found

## Task State Transitions

```
Current Status     | Change Type | New Status    | Reason
-------------------|-------------|---------------|----------------------------------
Complete/Failed    | modified    | Planned       | Re-execute changed requirement
Complete/Failed    | removed     | Obsolete      | Preserve history, mark obsolete
Any Status         | added       | No change     | Placeholder (future impl)
Complete           | (no change) | Complete      | Preserve completed work
Planned            | (no change) | Planned       | Keep pending work
Implementing       | (no change) | Implementing  | Keep in-progress work
```

## Task Marking Logic

### Modified Tasks

- **Detection**: PRD section content changed
- **Action**: Set status to `Planned`
- **Rationale**: Changed requirements need re-implementation
- **Preservation**: Task ID and structure maintained

### Obsolete Tasks

- **Detection**: PRD section removed
- **Action**: Set status to `Obsolete`
- **Rationale**: Track removed features for audit trail
- **Preservation**: Task remains in backlog with Obsolete status

### Added Tasks

- **Detection**: New PRD section added
- **Action**: Log warning (placeholder)
- **Rationale**: Future feature - will generate new tasks
- **Current**: No backlog modification

## Existing Test Patterns

**File**: `/home/dustin/projects/hacky-hack/tests/unit/core/task-patcher.test.ts`

- **Lines**: 1045 lines of comprehensive unit tests

### Test Fixtures

```typescript
const createTestSubtask = (id, title, status, dependencies) => ({
  /* ... */
});
const createTestTask = (id, title, status, subtasks) => ({
  /* ... */
});
const createTestMilestone = (id, title, status, tasks) => ({
  /* ... */
});
const createTestBacklog = phases => ({
  /* ... */
});
const createDeltaAnalysis = (changes, taskIds) => ({
  /* ... */
});
```

### Mocking Pattern

```typescript
// Hoisted mock variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { warn: vi.fn(), error: vi.fn(), ... }
}));

// Module mock
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

## Critical Implementation Details

### Immutability

- Creates new `Backlog` objects using spread operators
- Never mutates original backlog
- Preserves audit trail of all changes

### Efficient Processing

- Uses `Set` for deduplication of affected task IDs
- Uses change map for O(1) lookup during patching
- DFS traversal with minimal copying

### Hierarchy Support

- Works with all levels: Phase, Milestone, Task, Subtask
- Handles nested dependencies correctly
- Preserves parent-child relationships

### Error Handling

- Gracefully handles non-existent item IDs
- Continues processing despite individual failures
- Comprehensive logging for debugging

## Integration Points

### 1. PRP Pipeline

**File**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

- **Line**: 564
- **Usage**: `patchedBacklog = patchBacklog(currentBacklog, deltaAnalysis);`

### 2. Session Management

- Results saved via `SessionManager.saveBacklog()`
- Updates `tasks.json` in session directory
- Preserves immutability of session state

### 3. Delta Analysis

- Consumes `DeltaAnalysis` from `DeltaAnalysisWorkflow`
- Uses `affectedTaskIds` Set for efficient lookups
- Processes `changes` array in order

### 4. Task Utilities

- Uses `updateItemStatus` for immutable updates
- Uses `findItem` for task lookups
- Maintains type safety throughout

## Critical Design Decisions

### 1. Functional Approach

- Pure function for easier testing
- No side effects
- Predictable output for given input

### 2. Immutable Updates

- Preserves audit trail
- Enables time-travel debugging
- Prevents accidental mutations

### 3. Graceful Degradation

- Continues processing despite errors
- Logs warnings for non-critical issues
- Never throws for individual task failures

### 4. Comprehensive Logging

- Trace all changes for debugging
- Log warnings for added tasks (placeholder)
- Error logging for critical failures

### 5. Extensibility

- Ready for added task generation when implemented
- Supports new change types easily
- Plugin-friendly architecture

## Usage Example

```typescript
// 1. Create delta analysis
const deltaAnalysis: DeltaAnalysis = {
  hasDelta: true,
  changes: [
    {
      type: 'modified',
      section: 'P1.M1.T1: Implement Authentication',
      oldContent: 'Implement basic auth',
      newContent: 'Implement OAuth2 authentication',
      impact: 'high',
      affectedTaskIds: ['P1.M1.T1', 'P1.M1.T1.S1', 'P1.M1.T1.S2'],
    },
    {
      type: 'removed',
      section: 'P1.M2.T1: Create User Profile',
      oldContent: 'Create user profile page',
      impact: 'medium',
      affectedTaskIds: ['P1.M2.T1'],
    },
  ],
  patchInstructions: 'Update authentication to OAuth2, remove user profile',
  affectedTaskIds: new Set([
    'P1.M1.T1',
    'P1.M1.T1.S1',
    'P1.M1.T1.S2',
    'P1.M2.T1',
  ]),
};

// 2. Apply patch to backlog
const patchedBacklog = patchBacklog(currentBacklog, deltaAnalysis);

// 3. Verify results
// P1.M1.T1 and subtasks → status: 'Planned' (modified)
// P1.M2.T1 → status: 'Obsolete' (removed)
// Other tasks → unchanged
```

## Gotchas and Constraints

### 1. Added Tasks Not Implemented

- Currently logs warnings only
- Does not generate new tasks
- Requires manual task creation

### 2. No Automatic Task Generation

- Must manually add new tasks to backlog
- Placeholder for future implementation

### 3. Case-Sensitive Matching

- Section titles compared case-sensitively
- "Authentication" ≠ "authentication"

### 4. Performance

- O(n) traversal for each update
- Could optimize with indexing
- Acceptable for current scale

### 5. Dependency Handling

- Doesn't automatically update dependencies
- Manual dependency management required
- Future enhancement needed

## Testing Strategy

### Unit Test Coverage

- Test each change type (modified, removed, added)
- Test status transitions
- Test immutable updates
- Test error handling
- Test edge cases (empty backlog, missing tasks)

### Integration Test Coverage

- Test with real SessionManager
- Test with real DeltaAnalysis
- Test file persistence
- Test end-to-end workflow
