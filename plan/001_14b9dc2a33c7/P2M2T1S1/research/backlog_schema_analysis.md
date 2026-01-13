# BacklogSchema Analysis

## Source

- **File**: `src/core/models.ts` (lines 549-629)
- **Related**: `PhaseSchema`, `MilestoneSchema`, `TaskSchema`, `SubtaskSchema`, `StatusEnum`, `ItemTypeEnum`

## Schema Structure

```typescript
export const BacklogSchema: z.ZodType<Backlog> = z.object({
  backlog: z.array(PhaseSchema),
});
```

## Key Dependencies

### PhaseSchema (Recursive)

```typescript
export const PhaseSchema: z.ZodType<Phase> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+$/, 'Invalid phase ID format (expected P{N})'),
    type: z.literal('Phase'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    status: StatusEnum,
    description: z.string().min(1, 'Description is required'),
    milestones: z.array(z.lazy(() => MilestoneSchema)),
  })
);
```

### StatusEnum

```typescript
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
```

### ItemTypeEnum

```typescript
export const ItemTypeEnum = z.enum(['Phase', 'Milestone', 'Task', 'Subtask']);
```

## Usage Locations

1. **src/core/session-utils.ts**: Read/write tasks.json with validation
2. **tests/unit/core/models.test.ts**: Comprehensive validation tests
3. **plan/001_14b9dc2a33c7/tasks.json**: Example data structure

## Validation Rules

- **ID Format**: Strict regex patterns at each level
  - Phase: `/^P\d+$/`
  - Milestone: `/^P\d+\.M\d+$/`
  - Task: `/^P\d+\.M\d+\.T\d+$/`
  - Subtask: `/^P\d+\.M\d+\.T\d+\.S\d+$/`
- **Story Points**: Subtasks require 1-21 (Fibonacci sequence)
- **Required Fields**: All levels require non-empty title and description
- **Status**: Must be one of predefined StatusEnum values
- **Context Scope**: Subtasks require non-empty context_scope

## Import Pattern

```typescript
import type { Backlog } from './core/models.js';
import { BacklogSchema } from './core/models.js';
```
