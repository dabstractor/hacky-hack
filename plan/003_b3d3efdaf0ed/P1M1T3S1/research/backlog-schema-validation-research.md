# Backlog Schema Validation Research

## Overview

This document details the Backlog Zod schema and validation patterns for Architect Agent output testing.

## Complete Backlog Schema Structure

### Hierarchy: Phase > Milestone > Task > Subtask

```
Backlog
  └── backlog: Phase[]
      └── milestones: Milestone[]
          └── tasks: Task[]
              └── subtasks: Subtask[]
```

## Schema Definitions

### Backlog Schema (Root)

```typescript
interface Backlog {
  readonly backlog: Phase[];
}

export const BacklogSchema: z.ZodType<Backlog> = z.object({
  backlog: z.array(PhaseSchema),
});
```

**Source**: `src/core/models.ts:609-611`

### Phase Schema

```typescript
interface Phase {
  readonly id: string;              // Format: "P{number}"
  readonly type: 'Phase';
  readonly title: string;           // min: 1, max: 200
  readonly status: Status;
  readonly description: string;     // min: 1
  readonly milestones: Milestone[];
}

export const PhaseSchema: z.ZodType<Phase> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+$/, 'Invalid phase ID format'),
    type: z.literal('Phase'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1),
    milestones: z.array(z.lazy(() => MilestoneSchema)),
  })
);
```

**ID Format Regex**: `/^P\d+$/`
**Examples**: `P1`, `P2`, `P3`

### Milestone Schema

```typescript
interface Milestone {
  readonly id: string;           // Format: "P{N}.M{N}"
  readonly type: 'Milestone';
  readonly title: string;        // min: 1, max: 200
  readonly status: Status;
  readonly description: string;  // min: 1
  readonly tasks: Task[];
}

export const MilestoneSchema: z.ZodType<Milestone> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+$/, 'Invalid milestone ID format'),
    type: z.literal('Milestone'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1),
    tasks: z.array(z.lazy(() => TaskSchema)),
  })
);
```

**ID Format Regex**: `/^P\d+\.M\d+$/`
**Examples**: `P1.M1`, `P1.M2`, `P2.M1`

### Task Schema

```typescript
interface Task {
  readonly id: string;              // Format: "P{N}.M{N}.T{N}"
  readonly type: 'Task';
  readonly title: string;           // min: 1, max: 200
  readonly status: Status;
  readonly description: string;     // min: 1
  readonly subtasks: Subtask[];
}

export const TaskSchema: z.ZodType<Task> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+\.T\d+$/, 'Invalid task ID format'),
    type: z.literal('Task'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1),
    subtasks: z.array(z.lazy(() => SubtaskSchema)),
  })
);
```

**ID Format Regex**: `/^P\d+\.M\d+\.T\d+$/`
**Examples**: `P1.M1.T1`, `P1.M1.T2`, `P2.M3.T1`

### Subtask Schema

```typescript
interface Subtask {
  readonly id: string;                    // Format: "P{N}.M{N}.T{N}.S{N}"
  readonly type: 'Subtask';
  readonly title: string;                 // min: 1, max: 200
  readonly status: Status;
  readonly story_points: number;          // Integer: 1-21
  readonly dependencies: string[];        // Array of prerequisite subtask IDs
  readonly context_scope: string;         // CONTRACT DEFINITION format
}

export const SubtaskSchema: z.ZodType<Subtask> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/),
  type: z.literal('Subtask'),
  title: z.string().min(1).max(200),
  status: StatusEnum,
  story_points: z
    .number({ invalid_type_error: 'Story points must be a number' })
    .int('Story points must be an integer')
    .min(1, 'Story points must be at least 1')
    .max(21, 'Story points cannot exceed 21'),
  dependencies: z.array(z.string()).min(0),
  context_scope: ContextScopeSchema,
});
```

**ID Format Regex**: `/^P\d+\.M\d+\.T\d+\.S\d+$/`
**Examples**: `P1.M1.T1.S1`, `P1.M1.T1.S2`, `P2.M3.T4.S5`

**Story Points**: Integer, min 1, max 21 (Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21)

## Status Enum

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

**Source**: `src/core/models.ts:137-167`

## Context Scope Schema

### CONTRACT DEFINITION Format

The `context_scope` field must follow this exact structure:

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: [...]
2. INPUT: [...]
3. LOGIC: [...]
4. OUTPUT: [...]
```

### Validation Rules

```typescript
export const ContextScopeSchema: z.ZodType<string> = z
  .string()
  .min(1, 'Context scope is required')
  .superRefine((value, ctx) => {
    // Must start with "CONTRACT DEFINITION:\n"
    const prefix = 'CONTRACT DEFINITION:\n';
    if (!value.startsWith(prefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'context_scope must start with "CONTRACT DEFINITION:" followed by a newline',
      });
      return;
    }

    // Must have all 4 numbered sections in order
    const requiredSections = [
      { num: 1, name: 'RESEARCH NOTE', pattern: /1\.\s*RESEARCH\sNOTE:/m },
      { num: 2, name: 'INPUT', pattern: /2\.\s*INPUT:/m },
      { num: 3, name: 'LOGIC', pattern: /3\.\s*LOGIC:/m },
      { num: 4, name: 'OUTPUT', pattern: /4\.\s*OUTPUT:/m },
    ];

    let searchStartIndex = 0;
    for (const section of requiredSections) {
      const match = section.pattern.exec(content);
      if (!match || match.index < searchStartIndex) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing or incorrect section: "${section.num}. ${section.name}:"`,
        });
        return;
      }
      searchStartIndex = match.index + match[0].length;
    }
  });
```

**Source**: `src/core/models.ts:68-112`

### Valid Example

```typescript
const validScope = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic research findings from codebase analysis.
2. INPUT: Data structure from S1 output.
3. LOGIC: Implement feature X using pattern Y.
4. OUTPUT: Feature interface for consumption by S2.`;
```

## Validation Patterns

### Pattern 1: Basic safeParse

```typescript
const validation = BacklogSchema.safeParse(data);

if (validation.success) {
  // Access validated data
  const backlog = validation.data;
  console.log(backlog.backlog.length);
} else {
  // Handle validation errors
  console.error(validation.error.errors);
}
```

### Pattern 2: Traversal Validation

```typescript
function validateAllSubtasks(backlog: Backlog) {
  for (const phase of backlog.backlog) {
    for (const milestone of phase.milestones) {
      for (const task of milestone.tasks) {
        for (const subtask of task.subtasks) {
          // Validate story_points
          expect(Number.isInteger(subtask.story_points)).toBe(true);
          expect(subtask.story_points).toBeGreaterThanOrEqual(1);
          expect(subtask.story_points).toBeLessThanOrEqual(21);

          // Validate ID format
          expect(subtask.id).toMatch(/^P\d+\.M\d+\.T\d+\.S\d+$/);

          // Validate context_scope format
          expect(subtask.context_scope).toContain('CONTRACT DEFINITION:');
        }
      }
    }
  }
}
```

### Pattern 3: Field-Specific Validation

```typescript
it('should validate all ID formats', async () => {
  const validation = BacklogSchema.safeParse(data);
  expect(validation.success).toBe(true);

  if (validation.success) {
    for (const phase of validation.data.backlog) {
      expect(phase.id).toMatch(/^P\d+$/);
      expect(phase.type).toBe('Phase');

      for (const milestone of phase.milestones) {
        expect(milestone.id).toMatch(/^P\d+\.M\d+$/);
        expect(milestone.type).toBe('Milestone');

        for (const task of milestone.tasks) {
          expect(task.id).toMatch(/^P\d+\.M\d+\.T\d+$/);
          expect(task.type).toBe('Task');

          for (const subtask of task.subtasks) {
            expect(subtask.id).toMatch(/^P\d+\.M\d+\.T\d+\.S\d+$/);
            expect(subtask.type).toBe('Subtask');
          }
        }
      }
    }
  }
});
```

## Common Validation Errors

### Error 1: Invalid ID Format

```
Invalid phase ID format
Expected: /^P\d+$/
Got: "Phase1"
```

### Error 2: Story Points Out of Range

```
Story points cannot exceed 21
Expected: 1-21 (Fibonacci)
Got: 22
```

### Error 3: Missing Context Scope Section

```
Missing or incorrect section: "3. LOGIC:"
Required sections: 1. RESEARCH NOTE, 2. INPUT, 3. LOGIC, 4. OUTPUT
```

### Error 4: Context Scope Wrong Prefix

```
context_scope must start with "CONTRACT DEFINITION:" followed by a newline
Got: "Contract Definition:"
```

## Schema Validation with Groundswell

### responseFormat Integration

```typescript
import { createPrompt } from 'groundswell';
import { BacklogSchema } from './models.js';

const prompt = createPrompt({
  user: prdContent,
  system: TASK_BREAKDOWN_PROMPT,
  responseFormat: BacklogSchema,  // Groundswell validates output
  enableReflection: true,
});

const result = await agent.prompt(prompt);
// result is automatically typed as Backlog
```

**Source**: `src/agents/prompts/architect-prompt.ts:51-67`

## Test Data Examples

### Minimal Valid Backlog

```typescript
const minimalBacklog: Backlog = {
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1',
      status: 'Planned',
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1.1',
          status: 'Planned',
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1.1.1',
              status: 'Planned',
              description: 'Test task',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Subtask 1.1.1.1',
                  status: 'Planned',
                  story_points: 2,
                  dependencies: [],
                  context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test research.
2. INPUT: None.
3. LOGIC: Test logic.
4. OUTPUT: Test output.`,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
```

## Summary Table: ID Format Validation

| Level | ID Format | Regex | Examples |
|-------|-----------|-------|----------|
| Phase | P{N} | `^P\d+$` | P1, P2, P3 |
| Milestone | P{N}.M{N} | `^P\d+\.M\d+$` | P1.M1, P1.M2, P2.M1 |
| Task | P{N}.M{N}.T{N} | `^P\d+\.M\d+\.T\d+$` | P1.M1.T1, P1.M1.T2 |
| Subtask | P{N}.M{N}.T{N}.S{N} | `^P\d+\.M\d+\.T\d+\.S\d+$` | P1.M1.T1.S1, P1.M1.T1.S2 |

## Summary Table: Field Constraints

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Regex pattern per level |
| type | string | Literal ('Phase', 'Milestone', 'Task', 'Subtask') |
| title | string | minLength: 1, maxLength: 200 |
| description | string | minLength: 1 |
| status | Status | Enum: Planned, Researching, Implementing, Complete, Failed, Obsolete |
| story_points | number | Integer, min: 1, max: 21 |
| dependencies | string[] | Array of subtask IDs, can be empty |
| context_scope | string | CONTRACT DEFINITION format with 4 sections |
