# Status Transition Research for P1.M3.T1.S2

## Summary

Research findings for creating comprehensive tests for task status transitions in the PRP Pipeline.

## Critical Discovery: Documentation vs Implementation Discrepancy

### Documentation (system_context.md Section 6.2)

```typescript
type TaskStatus =
  | 'Planned' // Initial state
  | 'Researching' // PRP generation in progress
  | 'Ready' // PRP ready, awaiting execution
  | 'Implementing' // PRP execution in progress
  | 'Complete' // Successfully completed
  | 'Failed' // Failed with error
  | 'Obsolete'; // Removed by delta analysis
```

**7 status values including 'Ready'**

### Actual Implementation (src/core/models.ts)

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

**6 status values WITHOUT 'Ready'**

### Resolution for PRP

- Tests must validate against the **actual implementation** (6 values)
- The 'Ready' status appears to be documentation-only or a deprecated concept
- PRP should note this discrepancy but implement tests against reality

## Status Type Definition Location

**File**: `/home/dustin/projects/hacky-hack/src/core/models.ts`
**Lines**: 55-85

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
```

## Status Transition Flow (from TaskOrchestrator)

**File**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`

### Documented Workflow

Line 575-576: Status progression: `Planned → Researching → Implementing → Complete/Failed`

### Actual Implementation in executeSubtask()

1. **Planned → Researching** (Line 590-595)

   ```typescript
   await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');
   ```

2. **Researching → Implementing** (Line 642-643)

   ```typescript
   await this.setStatus(subtask.id, 'Implementing', 'Starting implementation');
   ```

3. **Implementing → Complete** (Line 685-688)

   ```typescript
   if (result.success) {
     await this.setStatus(
       subtask.id,
       'Complete',
       'Implementation completed successfully'
     );
   }
   ```

4. **Implementing → Failed** (Line 689-694)
   ```typescript
   } else {
     await this.setStatus(subtask.id, 'Failed', result.error ?? 'Execution failed');
   }
   ```

### Special Status: Obsolete

- Set by delta analysis when tasks are deprecated
- Can be set from any status
- Not part of normal workflow

## setStatus Method Implementation

**File**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
**Lines**: 206-230

```typescript
public async setStatus(
  itemId: string,
  status: Status,
  reason?: string
): Promise<void> {
  const { findItem } = await import('../utils/task-utils.js');
  const currentItem = findItem(this.#backlog, itemId);
  const oldStatus = currentItem?.status ?? 'Unknown';
  const timestamp = new Date().toISOString();

  this.#logger.info(
    { itemId, oldStatus, newStatus: status, timestamp, reason },
    'Status transition'
  );

  await this.sessionManager.updateItemStatus(itemId, status);
  await this.#refreshBacklog();
}
```

**Key Observations**:

- No validation of transition validity (any status can be set)
- Logs the transition with oldStatus, newStatus, timestamp, and reason
- Persists through SessionManager
- Refreshes backlog after update

## Existing Test Patterns

**File**: `/home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts`

### StatusEnum Test Pattern (Lines 46-90)

```typescript
describe('StatusEnum', () => {
  it('should accept valid status values', () => {
    const validStatuses = [
      'Planned',
      'Researching',
      'Implementing',
      'Complete',
      'Failed',
      'Obsolete',
    ] as const;

    validStatuses.forEach(status => {
      const result = StatusEnum.safeParse(status);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(status);
      }
    });
  });

  it('should reject invalid status values', () => {
    const invalidStatus = 'InvalidStatus';
    const result = StatusEnum.safeParse(invalidStatus);
    expect(result.success).toBe(false);
  });

  it('should expose all enum values via options property', () => {
    expect(StatusEnum.options).toEqual([
      'Planned',
      'Researching',
      'Implementing',
      'Complete',
      'Failed',
      'Obsolete',
    ]);
  });
});
```

### Key Patterns to Follow

1. Use `safeParse()` for Zod validation
2. Check `result.success` before accessing `result.data`
3. Use `.options` property to verify enum values
4. Test both valid and invalid cases

## No Existing Transition Validation

**Critical Finding**: The codebase has **no state machine validation** for status transitions. Any status can be set from any other status without validation.

This means the tests in this PRP will be **validating the documented workflow**, not enforcing business rules that exist in the code.

## Test Requirements from Task Context

The task specifies 5 tests:

1. **Test 1**: Verify all 7 status values are valid
   - ADJUSTMENT: Test 6 actual values (no 'Ready' in implementation)

2. **Test 2**: Test invalid status ('Invalid') fails Zod validation
   - Already exists in models.test.ts (lines 68-77)

3. **Test 3**: Create transition test through workflow
   - NEW: Test Planned → Researching → Implementing → Complete

4. **Test 4**: Test 'Obsolete' status is valid
   - Already covered in Test 1

5. **Test 5**: Verify status is required field
   - Test missing status fails validation

## Required Status Field Validation

From existing test patterns, the required field test should look like:

```typescript
it('should reject subtask with missing status', () => {
  const { status, ...subtaskWithoutStatus } = validSubtask;
  const result = SubtaskSchema.safeParse(subtaskWithoutStatus);
  expect(result.success).toBe(false);
});
```

## References

- **Status Type**: `/home/dustin/projects/hacky-hack/src/core/models.ts` lines 55-85
- **TaskOrchestrator**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` lines 206-230, 575-698
- **Existing Tests**: `/home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts` lines 46-200
- **System Context**: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md` lines 312-323
