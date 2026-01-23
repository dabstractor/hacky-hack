# Story Points Schema Discrepancy Analysis

**Date**: 2025-01-21
**Task**: P1.M3.T1.S2 - Verify Task Breakdown JSON output schema
**Author**: PRP Execution Agent

## Issue Description

A specification discrepancy exists between the documented task hierarchy in `system_context.md` and the actual Zod schema implementation in `models.ts` regarding the `story_points` field.

## Discrepancy Details

### Documentation Specification

**File**: `plan/003_b3d3efdaf0ed/docs/system_context.md`
**Line**: 150

```typescript
interface Subtask {
  type: 'Subtask';
  id: string; // "P1.M1.T1.S1"
  title: string;
  status: Status;
  story_points: number; // 0.5, 1, or 2 (max 2)
  dependencies: string[]; // Subtask IDs
  context_scope: string; // CONTRACT DEFINITION format
}
```

The documentation specifies:

- Values: `0.5`, `1`, or `2`
- Maximum: `2`

### Schema Implementation

**File**: `src/core/models.ts`
**Lines**: 328-332

```typescript
story_points: z
  .number({ invalid_type_error: 'Story points must be a number' })
  .int('Story points must be an integer')
  .min(1, 'Story points must be at least 1')
  .max(21, 'Story points cannot exceed 21'),
```

The schema enforces:

- Type: Integer (`.int()`)
- Range: `1` to `21` (Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21)

## Impact Analysis

### Architect Agent Behavior

When the Architect Agent generates task breakdown JSON following the `system_context.md` specification:

1. **If agent outputs `0.5`**: Schema validation will **fail**
   - The `.int()` refinement rejects decimal values
   - Error message: "Story points must be an integer"

2. **If agent outputs `3`**: Schema validation will **pass**
   - Value is within valid range (1-21)
   - But exceeds documented maximum of 2

### Pipeline Implications

1. **PRP Generation**: Architect agent may generate invalid JSON if it follows `system_context.md`
2. **Task Orchestrator**: Will reject JSON with `0.5` story points
3. **Session State**: Invalid task breakdown will not be persisted to `tasks.json`

## Root Cause

The discrepancy appears to stem from:

1. **Evolution of requirements**: The Fibonacci scale (1-21) was implemented after documentation was written
2. **Documentation drift**: `system_context.md` was not updated to reflect the new implementation
3. **Agile practice evolution**: Teams often migrate from simple scales (0.5, 1, 2) to Fibonacci (1-21) for better estimation granularity

## Validation Test Coverage

The test suite in `tests/unit/core/task-breakdown-schema.test.ts` documents this discrepancy:

```typescript
it('should reject decimal story_points (DISCREPANCY: system_context.md says 0.5 is valid)', () => {
  // CRITICAL: system_context.md (line 150) says story_points can be 0.5, 1, or 2 (max 2)
  // But models.ts uses .int() which rejects decimals
  // This test documents the discrepancy
  const subtask = {
    id: 'P1.M1.T1.S1',
    type: 'Subtask' as const,
    title: 'Test subtask',
    status: 'Planned' as const,
    story_points: 0.5,
    dependencies: [],
    context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
  };

  const result = SubtaskSchema.safeParse(subtask);
  expect(result.success).toBe(false);
  if (!result.success) {
    // .int() refinement rejects decimals
    expect(result.error.issues.some(i => i.message.includes('integer'))).toBe(
      true
    );
  }
});
```

## Recommendation

### Option 1: Update Documentation (Recommended)

**Pros**:

- Aligns documentation with working implementation
- No code changes required
- Fibonacci scale provides better granularity

**Changes required**:

1. Update `system_context.md` line 150:
   ```typescript
   story_points: number; // Fibonacci: 1, 2, 3, 5, 8, 13, 21 (max 21)
   ```
2. Update TASK_BREAKDOWN_PROMPT to reflect Fibonacci scale
3. Update any related documentation

### Option 2: Update Schema Implementation

**Pros**:

- Aligns implementation with original documentation

**Cons**:

- Loses granularity of Fibonacci scale
- Requires schema change (breaking change for existing data)
- May require migration of existing `tasks.json` files

**Changes required**:

1. Remove `.int()` refinement
2. Update `.min()` and `.max()` to `0.5` and `2`
3. Migrate existing tasks with story_points > 2

## Current Status

**Schema enforcement takes precedence** over documentation. The Zod schema in `models.ts` is the source of truth for validation. Any task breakdown JSON must conform to the schema (1-21 integers) to be accepted by the pipeline.

## Related Files

- `src/core/models.ts:328-332` - Zod schema definition
- `plan/003_b3d3efdaf0ed/docs/system_context.md:150` - Documentation specification
- `tests/unit/core/task-breakdown-schema.test.ts` - Validation tests documenting discrepancy
- `tests/fixtures/task-breakdown-samples.ts` - Test fixtures with valid/invalid samples
