# Status Transition Validation Research

## Status Values Defined in Codebase

From `src/core/models.ts` (lines 137-143):

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

## Valid Status Transitions

From `system_context.md` and `task-orchestrator.ts`:

### Normal Flow (Planned → Complete/Failed)

```
Planned → Researching → Implementing → Complete
                                        → Failed
```

### Delta Session Flow (Obsolete)

```
Any Status → Obsolete (when task removed in delta session)
```

### Current Implementation Notes

1. **No Explicit Validation**: The codebase does NOT validate status transitions.
   - `TaskOrchestrator.setStatus()` (lines 206-230) accepts any Status → Status transition
   - No `isValidStatusTransition()` function exists
   - Transitions rely on execution flow semantics, not validation

2. **Status Progression by Hierarchy Level**:

   **Phases/Milestones/Tasks:**
   - `Planned` → `Implementing` (when execution starts)
   - No transition to Complete (only subtasks go to Complete)

   **Subtasks:**
   - `Planned` → `Researching` (line 591 in task-orchestrator.ts)
   - `Researching` → `Implementing` (line 643)
   - `Implementing` → `Complete` (line 687-691, on success)
   - `Implementing` → `Failed` (line 693-697, on failure; line 728-732, on exception)

3. **Obsolete Status**:
   - Set by `TaskPatcher` when 'removed' change detected
   - Line 91-94 in task-patcher.ts: `updateItemStatus(patchedBacklog, taskId, 'Obsolete')`
   - No transitions FROM Obsolete (terminal state)

## Invalid Transitions (Should Be Prevented)

Based on the semantic meaning of statuses, these transitions should be invalid:

1. **Backward transitions**:
   - `Researching` → `Planned`
   - `Implementing` → `Researching` or `Planned`
   - `Complete` → Any status (terminal)
   - `Failed` → `Planned` (should require explicit retry)
   - `Obsolete` → Any status (terminal)

2. **Skipping stages**:
   - `Planned` → `Complete` (bypasses Researching/Implementing)
   - `Planned` → `Implementing` (bypasses Researching)
   - `Researching` → `Complete` (bypasses Implementing)

3. **Impossible transitions**:
   - `Obsolete` → Any status (removed tasks stay removed)
   - `Complete` → `Failed` (already done)

## Testing Strategy

The unit test should verify:

1. **All six status values exist and are valid**
   - Use StatusEnum Zod schema
   - Test each value: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'

2. **Valid transitions are accepted**
   - `Planned` → `Researching` ✓
   - `Researching` → `Implementing` ✓
   - `Implementing` → `Complete` ✓
   - `Implementing` → `Failed` ✓
   - Any status → `Obsolete` (delta session) ✓

3. **Invalid transitions are prevented or logged**
   - The current system does NOT prevent invalid transitions
   - Test should document current behavior (accepts any transition)
   - Future implementation may add validation

4. **Obsolete status is set for removed tasks in delta sessions**
   - Verify TaskPatcher sets Obsolete for 'removed' changes
   - Mock delta analysis with removed requirements
   - Verify status is 'Obsolete' in patched backlog

## Key Implementation Points

1. **Status Type Definition**: `src/core/models.ts` line 137-143
2. **Status Zod Schema**: `src/core/models.ts` line 160-167
3. **Status Update Method**: `TaskOrchestrator.setStatus()` line 206-230
4. **Status Update Implementation**: `SessionManager.updateItemStatus()` line 768-800
5. **Immutable Update Utility**: `task-utils.ts` `updateItemStatus()` lines 301-401
6. **Obsolete Status Setting**: `TaskPatcher` line 91-94

## Related Tests to Reference

- `tests/unit/core/models.test.ts` - StatusEnum validation
- `tests/unit/core/task-patcher.test.ts` - Obsolete status tests (lines 286-453)
- `tests/integration/core/delta-session.test.ts` - Delta session Obsolete handling
- `tests/unit/core/task-orchestrator.test.ts` - Status transition patterns
