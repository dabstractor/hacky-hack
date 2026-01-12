# Product Requirement Prompt (PRP): Zod Schemas for Task Hierarchy Validation

## Goal

**Feature Goal**: Create Zod validation schemas for the task hierarchy interfaces defined in `src/core/models.ts`, enabling runtime type validation and Groundswell's structured output system.

**Deliverable**: Zod schemas exported from `src/core/models.ts` that validate all task hierarchy types (Subtask, Task, Milestone, Phase, Backlog) with proper recursion and validation rules.

**Success Definition**:

- All TypeScript interfaces have corresponding Zod schemas
- Schemas properly validate recursive/nested structures
- Unit tests confirm `schema.parse()` works correctly for valid data
- Unit tests confirm `schema.safeParse()` returns proper errors for invalid data
- 100% code coverage maintained for the new schemas
- Existing TypeScript types remain unchanged and compatible

## Why

- **Groundswell Integration**: Groundswell's `createPrompt()` uses Zod schemas for `responseFormat` to enforce structured JSON output from LLMs. The Architect Agent needs these schemas to generate valid task hierarchies.
- **Runtime Validation**: TypeScript provides compile-time type safety, but Zod adds runtime validation for data from external sources (LLM responses, JSON files, user input).
- **Type Safety**: Zod schemas ensure that data flowing through the pipeline matches the expected structure, preventing hard-to-debug errors downstream.
- **Validation Consistency**: Using Zod across the project provides a single, consistent validation approach that integrates with Groundswell's architecture.

## What

Create Zod schemas in `src/core/models.ts` that mirror the TypeScript interfaces:

1. **StatusEnum**: Zod enum for `Status` type (`'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'`)
2. **ItemTypeEnum**: Zod enum for `ItemType` type (`'Phase' | 'Milestone' | 'Task' | 'Subtask'`)
3. **SubtaskSchema**: Zod object with all Subtask fields including validation rules
   - `id`: string with dot-notation format pattern
   - `type`: literal `'Subtask'`
   - `title`: string with min/max length
   - `status`: StatusEnum
   - `story_points`: number with min 1, max 21 (Fibonacci scale)
   - `dependencies`: array of strings (empty array when no dependencies)
   - `context_scope`: non-empty string
4. **TaskSchema**: Zod object with recursive `subtasks` array
5. **MilestoneSchema**: Zod object with recursive `tasks` array
6. **PhaseSchema**: Zod object with recursive `milestones` array
7. **BacklogSchema**: Zod object with `backlog` array of PhaseSchema

### Success Criteria

- [ ] All Zod schemas created in `src/core/models.ts`
- [ ] Schemas use `z.lazy()` for recursive structures (Task, Milestone, Phase)
- [ ] Enum schemas use `z.enum()` with const assertion pattern
- [ ] Validation rules match interface documentation (min/max story points, non-empty arrays where appropriate)
- [ ] All schemas exported alongside existing TypeScript interfaces
- [ ] Unit tests created in `tests/unit/core/models.test.ts`
- [ ] 100% code coverage maintained
- [ ] No changes to existing TypeScript interfaces

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes - This PRP provides:

- Exact file paths to read and modify
- Complete code examples with proper imports
- Test patterns to follow from existing tests
- Zod patterns from project research documents
- Validation commands that work in this project

### Documentation & References

```yaml
# MUST READ - Core TypeScript interfaces to mirror with Zod
- file: src/core/models.ts
  why: Contains all TypeScript interfaces that need Zod schemas
  pattern: Read-only interfaces with Status, ItemType, Subtask, Task, Milestone, Phase, Backlog
  gotcha: Recursive structures require z.lazy() with z.ZodType<> annotation

# MUST READ - Zod patterns research document
- file: plan/001_14b9dc2a33c7/P1M2T1S1/research/zod_patterns.md
  why: Comprehensive Zod patterns including recursive schemas, enums, and validation
  section: Section 3 for recursive schemas, Section 2 for enum patterns
  critical: Use z.lazy() for recursion, z.ZodType<T> annotation, z.enum() with const assertion

# MUST READ - Groundswell API Zod integration
- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Shows how Groundswell uses Zod schemas in createPrompt() responseFormat
  section: Prompt System section lines 231-275
  critical: responseFormat: z.object({ ... }) pattern for Architect Agent integration

# TEST PATTERN - Existing unit test structure
- file: tests/unit/config/environment.test.ts
  why: Reference for test patterns, naming conventions, and structure
  pattern: SETUP → EXECUTE → VERIFY comments, beforeEach/afterEach for cleanup
  gotcha: Use vi.stubEnv() for environment variable mocking (not needed for Zod tests)

# PROJECT CONFIG - Test runner configuration
- file: vitest.config.ts
  why: Shows test file patterns and 100% coverage requirements
  pattern: tests/**/*.{test,spec}.ts for test location
  critical: 100% coverage thresholds enforced

# EXTERNAL - Zod official documentation
- url: https://zod.dev/api
  why: Official API reference for z.object(), z.enum(), z.lazy(), z.array()
  section: z.lazy() for recursive types

# EXTERNAL - Zod recursive patterns
- url: https://github.com/colinhacks/zod/blob/master/src/v3/tests/recursive.test.ts
  why: Shows actual recursive schema implementations
  pattern: z.lazy(() => z.object({ ... })) with z.ZodType<T> annotation
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── config/
│   │   ├── constants.ts
│   │   ├── environment.ts
│   │   └── types.ts
│   ├── core/
│   │   └── models.ts                    # MODIFY: Add Zod schemas here
│   ├── agents/                          # Empty
│   ├── utils/                           # Empty
│   ├── workflows/
│   │   └── hello-world.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   └── config/
│   │       └── environment.test.ts     # REFERENCE: Test pattern
│   └── unit/
│       └── core/
│           └── models.test.ts          # CREATE: Zod schema tests
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/
│       │   └── groundswell_api.md
│       ├── P1M2T1S1/
│       │   └── research/
│       │       └── zod_patterns.md     # REFERENCE: Zod patterns
│       └── P1M2T1S2/
│           ├── PRP.md                   # THIS FILE
│           └── research/                # Create additional research here
├── package.json                          # Has zod: ^3.22.4
├── vitest.config.ts
├── tsconfig.json
└── eslint.config.js
```

### Desired Codebase Tree with Changes

```bash
# MODIFIED FILE - src/core/models.ts
# ADD: Zod schemas after TypeScript interfaces

# NEW FILE - tests/unit/core/models.test.ts
# CREATE: Unit tests for all Zod schemas
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Zod recursive schemas require special handling
// MUST use z.lazy() with z.ZodType<T> annotation for TypeScript to understand recursion
// WRONG: const TaskSchema = z.object({ subtasks: z.array(TaskSchema) })  // Error: referencing before declaration
// RIGHT: const TaskSchema: z.ZodType<Task> = z.lazy(() => z.object({ subtasks: z.array(TaskSchema) }))

// CRITICAL: Groundswell's responseFormat requires Zod schema, not TypeScript type
// When using createPrompt(), pass Zod schema to responseFormat:
// createPrompt({ user: '...', responseFormat: BacklogSchema })  // Correct: Zod schema
// createPrompt({ user: '...', responseFormat: Backlog })  // WRONG: TypeScript type

// CRITICAL: Zod version 3.22.4 - import pattern
// This project uses ESM modules with "type": "module" in package.json
// Import: import { z } from 'zod';  // Correct for ESM

// GOTCHA: Discriminated unions for ItemType
// The 'type' field in interfaces is a literal string ('Subtask', 'Task', etc.)
// In Zod, use z.literal('Subtask') for exact value matching
// This enables type narrowing in TypeScript

// GOTCHA: Story points validation
// According to interface documentation, story_points uses Fibonacci: 1, 2, 3, 5, 8, 13, 21
// Use z.number().min(1).max(21) for validation
// Could add .refine(n => [1,2,3,5,8,13,21].includes(n)) for strict Fibonacci validation

// GOTCHA: Empty arrays for dependencies
// The dependencies array can be empty (no dependencies)
// Use z.array(z.string()).min(0) or just z.array(z.string()) which allows empty arrays
// For non-empty requirement, use z.array(z.string()).min(1) or .nonempty()

// GOTCHA: Test file location
// Tests go in tests/unit/core/models.test.ts (not tests/unit/core/models/)
// Match pattern: tests/unit/{module}/{feature}.test.ts

// GOTCHA: 100% coverage requirement
// All branches must be tested, including error cases
// Use safeParse() to test validation failures
```

## Implementation Blueprint

### Data Models and Structure

The TypeScript interfaces are already defined. This task adds Zod schemas alongside them:

**Existing Structure** (src/core/models.ts):

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
export type ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask';
export interface Subtask {
  /* ... */
}
export interface Task {
  /* ... */
}
export interface Milestone {
  /* ... */
}
export interface Phase {
  /* ... */
}
export interface Backlog {
  /* ... */
}
```

**New Zod Schemas to Add** (src/core/models.ts, after interfaces):

```typescript
import { z } from 'zod';

// Enum schemas
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
export const ItemTypeEnum = z.enum(['Phase', 'Milestone', 'Task', 'Subtask']);

// Recursive schemas with z.lazy()
export const SubtaskSchema: z.ZodType<Subtask> = z.object({
  /* ... */
});
export const TaskSchema: z.ZodType<Task> = z.lazy(() =>
  z.object({
    /* ... */
  })
);
export const MilestoneSchema: z.ZodType<Milestone> = z.lazy(() =>
  z.object({
    /* ... */
  })
);
export const PhaseSchema: z.ZodType<Phase> = z.lazy(() =>
  z.object({
    /* ... */
  })
);
export const BacklogSchema: z.ZodType<Backlog> = z.object({
  /* ... */
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD Zod import to src/core/models.ts
  - ADD: import { z } from 'zod'; at top of file after module JSDoc
  - PLACEMENT: Line ~29, after module JSDoc comments, before Status type definition
  - PRESERVE: All existing TypeScript interfaces and JSDoc comments

Task 2: CREATE enum schemas (StatusEnum, ItemTypeEnum)
  - IMPLEMENT: z.enum() for Status and ItemType types
  - FOLLOW pattern: plan/001_14b9dc2a33c7/P1M2T1S1/research/zod_patterns.md Section 2
  - PLACEMENT: After Status type definition (line ~59), before ItemType type (line ~76)
  - NAMING: StatusEnum, ItemTypeEnum (PascalCase, matching type names)
  - EXPORT: Use 'export const' for schemas

Task 3: CREATE SubtaskSchema with all field validations
  - IMPLEMENT: z.object() with id, type, title, status, story_points, dependencies, context_scope
  - FOLLOW pattern: src/core/models.ts Subtask interface (lines 106-168)
  - VALIDATION:
    - id: z.string() with regex pattern for P{N}.M{N}.T{N}.S{N} format
    - type: z.literal('Subtask')
    - title: z.string().min(1).max(200)
    - status: StatusEnum
    - story_points: z.number().int().min(1).max(21)
    - dependencies: z.array(z.string())
    - context_scope: z.string().min(1)
  - ANNOTATION: z.ZodType<Subtask>
  - PLACEMENT: After Subtask interface definition (after line 168)

Task 4: CREATE TaskSchema with recursive subtasks
  - IMPLEMENT: z.object() with id, type, title, status, description, subtasks
  - FOLLOW pattern: src/core/models.ts Task interface (lines 201-237)
  - VALIDATION:
    - id: z.string() with regex pattern for P{N}.M{N}.T{N} format
    - type: z.literal('Task')
    - title: z.string().min(1).max(200)
    - status: StatusEnum
    - description: z.string().min(1)
    - subtasks: z.array(SubtaskSchema)
  - RECURSION: Use z.lazy(() => z.object({ subtasks: z.array(SubtaskSchema) })) - wait, subtasks are Subtask, not Task
  - ANNOTATION: z.ZodType<Task>
  - GOTCHA: Task.subtasks is array of Subtask, not recursive Task
  - PLACEMENT: After Task interface definition (after line 237)

Task 5: CREATE MilestoneSchema with recursive tasks
  - IMPLEMENT: z.object() with id, type, title, status, description, tasks
  - FOLLOW pattern: src/core/models.ts Milestone interface (lines 260-295)
  - VALIDATION:
    - id: z.string() with regex pattern for P{N}.M{N} format
    - type: z.literal('Milestone')
    - title: z.string().min(1).max(200)
    - status: StatusEnum
    - description: z.string().min(1)
    - tasks: z.array(TaskSchema)
  - RECURSION: Use z.lazy(() => z.object({ tasks: z.array(z.lazy(() => TaskSchema)) }))
  - ANNOTATION: z.ZodType<Milestone>
  - PLACEMENT: After Milestone interface definition (after line 295)

Task 6: CREATE PhaseSchema with recursive milestones
  - IMPLEMENT: z.object() with id, type, title, status, description, milestones
  - FOLLOW pattern: src/core/models.ts Phase interface (lines 319-354)
  - VALIDATION:
    - id: z.string() with regex pattern for P{N} format
    - type: z.literal('Phase')
    - title: z.string().min(1).max(200)
    - status: StatusEnum
    - description: z.string().min(1)
    - milestones: z.array(MilestoneSchema)
  - RECURSION: Use z.lazy(() => z.object({ milestones: z.array(z.lazy(() => MilestoneSchema)) }))
  - ANNOTATION: z.ZodType<Phase>
  - PLACEMENT: After Phase interface definition (after line 354)

Task 7: CREATE BacklogSchema with phases array
  - IMPLEMENT: z.object() with backlog field containing PhaseSchema array
  - FOLLOW pattern: src/core/models.ts Backlog interface (lines 395-407)
  - VALIDATION:
    - backlog: z.array(PhaseSchema)
  - ANNOTATION: z.ZodType<Backlog>
  - PLACEMENT: After Backlog interface definition (after line 407, end of file)

Task 8: CREATE test file tests/unit/core/models.test.ts
  - IMPLEMENT: Comprehensive unit tests for all Zod schemas
  - FOLLOW pattern: tests/unit/config/environment.test.ts
  - NAMING: tests/unit/core/models.test.ts (matches pattern)
  - STRUCTURE: Nested describe blocks matching schema hierarchy
  - IMPORT: import { all schemas and types } from '../../../src/core/models.js';
  - COVERAGE: Test happy path, edge cases, validation errors for each schema

Task 9: ADD tests for enum schemas (StatusEnum, ItemTypeEnum)
  - IMPLEMENT: describe block for enum validation
  - TEST CASES:
    - Valid enum values should parse successfully
    - Invalid enum values should fail with ZodError
    - All enum values accessible via .options property
  - FOLLOW pattern: zod_patterns.md Section 2

Task 10: ADD tests for SubtaskSchema
  - IMPLEMENT: describe block for Subtask validation
  - TEST CASES:
    - Valid subtask should parse successfully
    - Missing required fields should fail
    - Invalid story_points (negative, >21, non-integer) should fail
    - Empty dependencies array should pass
    - Invalid context_scope (empty string) should fail
    - Invalid id format should fail
  - USE: safeParse() for error case testing

Task 11: ADD tests for TaskSchema
  - IMPLEMENT: describe block for Task validation
  - TEST CASES:
    - Valid task with empty subtasks should parse
    - Valid task with nested subtasks should parse
    - Missing description should fail
    - Invalid subtask in array should fail (cascade error)
  - TEST RECURSION: Multi-level nesting (task → subtasks)

Task 12: ADD tests for MilestoneSchema
  - IMPLEMENT: describe block for Milestone validation
  - TEST CASES:
    - Valid milestone with empty tasks should parse
    - Valid milestone with nested tasks should parse
    - Multi-level nesting (milestone → task → subtasks)

Task 13: ADD tests for PhaseSchema
  - IMPLEMENT: describe block for Phase validation
  - TEST CASES:
    - Valid phase with empty milestones should parse
    - Valid phase with nested milestones should parse
    - Deep nesting validation (4 levels)

Task 14: ADD tests for BacklogSchema
  - IMPLEMENT: describe block for Backlog validation
  - TEST CASES:
    - Valid backlog with multiple phases
    - Empty backlog (empty phases array)
    - Invalid phase in array should fail

Task 15: RUN validation and fix any issues
  - EXECUTE: npm run test:run
  - VERIFY: All tests pass
  - EXECUTE: npm run test:coverage
  - VERIFY: 100% coverage maintained
  - EXECUTE: npm run lint
  - VERIFY: No linting errors
  - EXECUTE: npm run format:check
  - VERIFY: No formatting issues
```

### Implementation Patterns & Key Details

```typescript
// ===== IMPORT PATTERN =====
// Add at top of src/core/models.ts after JSDoc module comment (line ~29)
import { z } from 'zod';

// ===== ENUM SCHEMA PATTERN =====
// Place after type definitions, export alongside types
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);

export const ItemTypeEnum = z.enum(['Phase', 'Milestone', 'Task', 'Subtask']);

// ===== SUBTASK SCHEMA PATTERN =====
// Non-recursive schema - straightforward validation
export const SubtaskSchema: z.ZodType<Subtask> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/, 'Invalid subtask ID format'),
  type: z.literal('Subtask'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  status: StatusEnum,
  story_points: z
    .number()
    .int('Story points must be an integer')
    .min(1, 'Story points must be at least 1')
    .max(21, 'Story points cannot exceed 21'),
  dependencies: z.array(z.string()).min(0), // Empty array allowed
  context_scope: z.string().min(1, 'Context scope is required'),
});

// ===== RECURSIVE SCHEMA PATTERN (Task, Milestone, Phase) =====
// CRITICAL: Use z.lazy() for self-referencing structures
// CRITICAL: z.ZodType<T> annotation helps TypeScript understand recursion

// Task schema - contains Subtask array (not recursive with itself)
export const TaskSchema: z.ZodType<Task> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+$/, 'Invalid task ID format'),
  type: z.literal('Task'),
  title: z.string().min(1).max(200),
  status: StatusEnum,
  description: z.string().min(1, 'Description is required'),
  subtasks: z.array(SubtaskSchema),
});

// Milestone schema - contains Task array (recursive with TaskSchema)
export const MilestoneSchema: z.ZodType<Milestone> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+$/, 'Invalid milestone ID format'),
    type: z.literal('Milestone'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1, 'Description is required'),
    tasks: z.array(z.lazy(() => TaskSchema)), // Recursive reference
  })
);

// Phase schema - contains Milestone array (recursive with MilestoneSchema)
export const PhaseSchema: z.ZodType<Phase> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+$/, 'Invalid phase ID format'),
    type: z.literal('Phase'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1, 'Description is required'),
    milestones: z.array(z.lazy(() => MilestoneSchema)), // Recursive reference
  })
);

// Backlog schema - contains Phase array
export const BacklogSchema: z.ZodType<Backlog> = z.object({
  backlog: z.array(PhaseSchema),
});

// ===== TEST PATTERN =====
// File: tests/unit/core/models.test.ts

import { describe, expect, it } from 'vitest';
import {
  StatusEnum,
  ItemTypeEnum,
  SubtaskSchema,
  TaskSchema,
  MilestoneSchema,
  PhaseSchema,
  BacklogSchema,
  type Subtask,
  type Task,
  type Milestone,
  type Phase,
  type Backlog,
} from '../../../src/core/models.js';

describe('core/models Zod Schemas', () => {
  describe('StatusEnum', () => {
    it('should accept valid status values', () => {
      const validStatuses = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ];

      validStatuses.forEach(status => {
        const result = StatusEnum.safeParse(status);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(status);
        }
      });
    });

    it('should reject invalid status values', () => {
      const result = StatusEnum.safeParse('InvalidStatus');
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

  describe('SubtaskSchema', () => {
    const validSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Create Zod schemas',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: 'src/core/models.ts only',
    };

    it('should parse valid subtask', () => {
      const result = SubtaskSchema.safeParse(validSubtask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSubtask);
      }
    });

    it('should reject subtask with invalid story_points (negative)', () => {
      const invalid = { ...validSubtask, story_points: -1 };
      const result = SubtaskSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject subtask with invalid story_points (non-integer)', () => {
      const invalid = { ...validSubtask, story_points: 2.5 };
      const result = SubtaskSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject subtask with empty title', () => {
      const invalid = { ...validSubtask, title: '' };
      const result = SubtaskSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept subtask with empty dependencies array', () => {
      const withEmptyDeps = { ...validSubtask, dependencies: [] };
      const result = SubtaskSchema.safeParse(withEmptyDeps);
      expect(result.success).toBe(true);
    });
  });

  describe('TaskSchema', () => {
    const validTask: Task = {
      id: 'P1.M1.T1',
      type: 'Task',
      title: 'Define Task Models',
      status: 'Planned',
      description: 'Create TypeScript interfaces for task hierarchy',
      subtasks: [
        {
          id: 'P1.M1.T1.S1',
          type: 'Subtask',
          title: 'Create interfaces',
          status: 'Complete',
          story_points: 2,
          dependencies: [],
          context_scope: 'src/core/',
        },
      ],
    };

    it('should parse valid task with subtasks', () => {
      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should parse valid task with empty subtasks', () => {
      const emptyTask = { ...validTask, subtasks: [] };
      const result = TaskSchema.safeParse(emptyTask);
      expect(result.success).toBe(true);
    });

    it('should reject task with missing description', () => {
      const invalid = { ...validTask, description: '' };
      const result = TaskSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('MilestoneSchema', () => {
    const validMilestone: Milestone = {
      id: 'P1.M1',
      type: 'Milestone',
      title: 'Project Initialization',
      status: 'Complete',
      description: 'Foundation setup and environment configuration',
      tasks: [],
    };

    it('should parse valid milestone with empty tasks', () => {
      const result = MilestoneSchema.safeParse(validMilestone);
      expect(result.success).toBe(true);
    });

    it('should parse valid milestone with nested tasks', () => {
      const withTasks: Milestone = {
        ...validMilestone,
        tasks: [
          {
            id: 'P1.M1.T1',
            type: 'Task',
            title: 'Task 1',
            status: 'Planned',
            description: 'First task',
            subtasks: [],
          },
        ],
      };
      const result = MilestoneSchema.safeParse(withTasks);
      expect(result.success).toBe(true);
    });
  });

  describe('PhaseSchema', () => {
    const validPhase: Phase = {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1: Foundation',
      status: 'Planned',
      description: 'Project initialization',
      milestones: [],
    };

    it('should parse valid phase with empty milestones', () => {
      const result = PhaseSchema.safeParse(validPhase);
      expect(result.success).toBe(true);
    });

    it('should parse valid phase with nested milestones', () => {
      const withMilestones: Phase = {
        ...validPhase,
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Milestone 1',
            status: 'Planned',
            description: 'First milestone',
            tasks: [],
          },
        ],
      };
      const result = PhaseSchema.safeParse(withMilestones);
      expect(result.success).toBe(true);
    });
  });

  describe('BacklogSchema', () => {
    const validBacklog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Planned',
          description: 'First phase',
          milestones: [],
        },
      ],
    };

    it('should parse valid backlog with phases', () => {
      const result = BacklogSchema.safeParse(validBacklog);
      expect(result.success).toBe(true);
    });

    it('should parse empty backlog', () => {
      const empty: Backlog = { backlog: [] };
      const result = BacklogSchema.safeParse(empty);
      expect(result.success).toBe(true);
    });
  });

  describe('Deep Nesting Validation', () => {
    it('should validate 4-level deep hierarchy', () => {
      const deepBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'First phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'First milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'First task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = BacklogSchema.safeParse(deepBacklog);
      expect(result.success).toBe(true);
    });
  });
});
```

### Integration Points

```yaml
GROUNDSWELL ARCHITECT AGENT:
  - usage: "createPrompt({ user: prdContent, responseFormat: BacklogSchema })"
  - reference: "plan/001_14b9dc2a33c7/architecture/groundswell_api.md lines 231-275"
  - file: "src/agents/architect.ts" (future work - P2.M2.T1.S2)
  - pattern: "import { BacklogSchema } from '../core/models.js'"

FUTURE VALIDATION USAGE:
  - file: "src/utils/validation.ts" (future work - P1.M2.T1.S3)
  - pattern: "BacklogSchema.parse(tasksData) for runtime validation"

TYPE EXPORT COMPATIBILITY:
  - existing: "export interface Backlog" remains unchanged
  - new: "export const BacklogSchema" alongside interface
  - importers can use either: "import { Backlog, BacklogSchema } from './models.js'"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint              # ESLint check with auto-fix on src/
npm run format:check      # Prettier format check

# Auto-fix formatting issues
npm run format            # Prettier --write for all files

# Project-wide validation
npm run lint:fix          # ESLint with --fix
npm run format            # Prettier format all

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific schema module
npm run test:run -- tests/unit/core/models.test.ts

# Full test suite for affected areas
npm run test:run

# Coverage validation (100% required)
npm run test:coverage

# Expected: All tests pass, 100% coverage maintained
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (Schema Validation)

```bash
# Verify TypeScript types still work
npm run build             # tsc compilation

# Test schema.parse() with sample data
node -e "
import { BacklogSchema } from './dist/core/models.js';
const sample = { backlog: [] };
const result = BacklogSchema.parse(sample);
console.log('Schema validation passed:', result);
"

# Test schema.safeParse() error handling
node -e "
import { SubtaskSchema } from './dist/core/models.js';
const invalid = { id: 'invalid' };
const result = SubtaskSchema.safeParse(invalid);
console.log('Expected failure:', result.success ? 'UNEXPECTED' : 'CORRECT');
if (!result.success) console.log('Errors:', result.error.issues);
"

# Expected: All schemas validate correctly, proper error messages for invalid data
```

### Level 4: Groundswell Integration Validation

```bash
# Verify schemas work with Groundswell's responseFormat
# (This will be tested in future work P2.M2.T1.S2, but schemas must be compatible)

# Test that schemas can be passed to createPrompt
node -e "
import { createPrompt } from 'groundswell';
import { BacklogSchema } from './dist/core/models.js';

const prompt = createPrompt({
  user: 'Generate a task backlog',
  responseFormat: BacklogSchema,
  system: 'You are an architect agent',
});

console.log('Groundswell prompt created successfully');
console.log('Response format:', typeof prompt);
"

# Expected: No errors when passing Zod schemas to Groundswell's createPrompt()
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:run`
- [ ] 100% coverage maintained: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`
- [ ] TypeScript compiles: `npm run build`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] All Zod schemas created and exported
- [ ] Recursive schemas use `z.lazy()` correctly
- [ ] Enum schemas use `z.enum()` with const assertion
- [ ] Validation rules match interface documentation
- [ ] No changes to existing TypeScript interfaces

### Schema Validation

- [ ] StatusEnum validates all 6 status values
- [ ] ItemTypeEnum validates all 4 item types
- [ ] SubtaskSchema validates all fields including story_points range
- [ ] TaskSchema validates recursive subtasks
- [ ] MilestoneSchema validates recursive tasks
- [ ] PhaseSchema validates recursive milestones
- [ ] BacklogSchema validates phases array
- [ ] Deep nesting (4 levels) validates correctly

### Code Quality Validation

- [ ] Follows existing codebase patterns (zod_patterns.md)
- [ ] Test patterns match tests/unit/config/environment.test.ts
- [ ] JSDoc comments preserved on existing interfaces
- [ ] Import statement added correctly
- [ ] No circular dependencies
- [ ] Schemas exportable for Groundswell integration

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Schema names match interface names (StatusEnum, TaskSchema, etc.)
- [ ] Error messages in schemas are descriptive
- [ ] Test file has comprehensive JSDoc comment
- [ ] All tests have SETUP → EXECUTE → VERIFY comments

## Anti-Patterns to Avoid

- ❌ Don't use `z.any()` to bypass recursion - use `z.lazy()` properly
- ❌ Don't create Zod schemas without `z.ZodType<T>` annotation for recursive types
- ❌ Don't use `z.union()` for enums - use `z.enum()` instead
- ❌ Don't skip testing error cases - use `safeParse()` to validate failures
- ❌ Don't modify existing TypeScript interfaces - add schemas alongside
- ❌ Don't use `import * as z` - use `import { z } from 'zod'` for ESM
- ❌ Don't forget to export schemas - use `export const`
- ❌ Don't ignore test coverage - every branch must be tested
- ❌ Don't hardcode validation messages that duplicate built-in Zod errors
- ❌ Don't use synchronous `.parse()` in tests for error cases - use `.safeParse()`

---

## Confidence Score

**9/10** - One-pass implementation success likelihood is very high because:

- Complete context with exact file paths and code examples
- Zod patterns thoroughly researched in project documentation
- Test patterns clearly established in existing tests
- Clear task ordering with dependencies mapped
- Comprehensive validation commands provided

**Risk mitigation**: The only uncertainty is edge cases in recursive schema validation, but the research documents provide proven patterns for handling this.

---

## Sources

- [Zod Official Documentation](https://zod.dev/api)
- [Zod Recursive Tests - GitHub](https://github.com/colinhacks/zod/blob/master/src/v3/tests/recursive.test.ts)
- [Groundswell API Reference](/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md)
- [Zod Patterns Research](/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M2T1S1/research/zod_patterns.md)
- [Existing Test Pattern](/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts)
