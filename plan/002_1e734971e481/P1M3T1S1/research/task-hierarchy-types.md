# Task Hierarchy Type Definitions Research for P1.M3.T1.S1

## Source: /home/dustin/projects/hacky-hack/src/core/models.ts

## Type Definitions

### Status Type (Lines 55-61)

```typescript
type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

### Subtask Interface (Lines 149-211)

```typescript
interface Subtask {
  readonly id: string; // Format: P{phase}.M{milestone}.T{task}.S{subtask}
  readonly type: 'Subtask';
  readonly title: string; // min 1, max 200 chars
  readonly status: Status;
  readonly story_points: number; // Integer, min 1, max 21 (Fibonacci)
  readonly dependencies: string[];
  readonly context_scope: string;
}
```

### Task Interface (Lines 286-322)

```typescript
interface Task {
  readonly id: string; // Format: P{phase}.M{milestone}.T{task}
  readonly type: 'Task';
  readonly title: string; // min 1, max 200 chars
  readonly status: Status;
  readonly description: string;
  readonly subtasks: Subtask[];
}
```

### Milestone Interface (Lines 381-416)

```typescript
interface Milestone {
  readonly id: string; // Format: P{phase}.M{milestone}
  readonly type: 'Milestone';
  readonly title: string; // min 1, max 200 chars
  readonly status: Status;
  readonly description: string;
  readonly tasks: Task[];
}
```

### Phase Interface (Lines 478-513)

```typescript
interface Phase {
  readonly id: string; // Format: P{phase}
  readonly type: 'Phase';
  readonly title: string; // min 1, max 200 chars
  readonly status: Status;
  readonly description: string;
  readonly milestones: Milestone[];
}
```

## Zod Validation Schemas

### StatusEnum (Lines 78-85)

```typescript
StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
```

### SubtaskSchema (Lines 236-253)

```typescript
SubtaskSchema: z.ZodType<Subtask> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/, 'Invalid subtask ID format'),
  type: z.literal('Subtask'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  status: StatusEnum,
  story_points: z
    .number()
    .int('Story points must be an integer')
    .min(1, 'Story points must be at least 1')
    .max(21, 'Story points cannot exceed 21'),
  dependencies: z.array(z.string()).min(0),
  context_scope: z.string().min(1, 'Context scope is required'),
});
```

### TaskSchema (Lines 346-358)

```typescript
TaskSchema: z.ZodType<Task> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+$/, 'Invalid task ID format'),
  type: z.literal('Task'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  status: StatusEnum,
  description: z.string().min(1, 'Description is required'),
  subtasks: z.array(SubtaskSchema),
});
```

### MilestoneSchema (Lines 440-454)

```typescript
MilestoneSchema: z.ZodType<Milestone> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+$/, 'Invalid milestone ID format'),
    type: z.literal('Milestone'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    status: StatusEnum,
    description: z.string().min(1, 'Description is required'),
    tasks: z.array(z.lazy(() => TaskSchema)),
  })
);
```

### PhaseSchema (Lines 537-546)

```typescript
PhaseSchema: z.ZodType<Phase> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+$/, 'Invalid phase ID format'),
    type: z.literal('Phase'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    status: StatusEnum,
    description: z.string().min(1, 'Description is required'),
    milestones: z.array(z.lazy(() => MilestoneSchema)),
  })
);
```

## ID Format Patterns

| Level     | Pattern                    | Example                      |
| --------- | -------------------------- | ---------------------------- |
| Phase     | `^P\d+$`                   | `P1`, `P2`                   |
| Milestone | `^P\d+\.M\d+$`             | `P1.M1`, `P1.M2`             |
| Task      | `^P\d+\.M\d+\.T\d+$`       | `P1.M1.T1`, `P1.M2.T3`       |
| Subtask   | `^P\d+\.M\d+\.T\d+\.S\d+$` | `P1.M1.T1.S1`, `P1.M2.T3.S5` |

## Story Points Validation

**Important**: The actual implementation uses the full Fibonacci sequence (1-21), NOT just 0.5, 1, 2 as mentioned in system_context.md.

Valid values: 1, 2, 3, 5, 8, 13, 21 (Fibonacci sequence)
Invalid values: 0, 4, 6, 7, 9, 10, 22+, decimals, non-numbers

## Critical Discrepancy Found

**system_context.md** states: `story_points: 0.5 | 1 | 2`
**Actual models.ts implementation**: `story_points: number` with validation `min(1), max(21)`

Resolution: Tests should validate against the actual implementation (1-21 range).
