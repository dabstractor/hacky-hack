# PRP: P1.M3.T1.S2 - Verify Task Breakdown JSON output schema

---

## Goal

**Feature Goal**: Create comprehensive unit tests that validate the Zod schema enforcement for the entire task breakdown JSON hierarchy produced by the Architect Agent.

**Deliverable**: Unit test file `tests/unit/core/task-breakdown-schema.test.ts` with complete schema validation coverage including hierarchy structure, field constraints, edge cases, and architect agent output validation.

**Success Definition**:

- All Zod schemas (BacklogSchema, PhaseSchema, MilestoneSchema, TaskSchema, SubtaskSchema, ContextScopeSchema, StatusEnum, ItemTypeEnum) are validated
- Story points validation tests cover actual implementation (1-21 Fibonacci integers) and document the discrepancy with system_context.md (0.5, 1, 2)
- Dependencies array validation ensures only valid subtask ID references
- Context scope CONTRACT DEFINITION format validation is thoroughly tested
- Architect agent output samples (valid and invalid) are validated against schemas
- 100% code coverage for schema validation logic
- All tests pass with `npm test -- tests/unit/core/task-breakdown-schema.test.ts`

## Why

- **Schema Integrity**: Ensures the Zod schemas in `src/core/models.ts` correctly enforce the task hierarchy structure contract
- **Architect Agent Validation**: Guarantees that JSON output from the Architect Agent conforms to schema requirements before pipeline processing
- **Contract Compliance**: Documents and validates the exact format requirements for task breakdown JSON, preventing downstream failures
- **Regression Prevention**: Catches schema changes that could break task hierarchy processing in Task Orchestrator, Session Manager, and PRP generation
- **Documentation Discrepancy Resolution**: Identifies and documents the story_points specification mismatch (system_context.md says 0.5/1/2, models.ts enforces 1-21 integers)

## What

Unit tests that verify Zod schema validation for all task hierarchy types:

### Success Criteria

- [ ] BacklogSchema validates complete Phase array structure
- [ ] PhaseSchema validates id format (`^P\d+$`), type literal, title constraints (1-200 chars), status enum, description requirement, milestones array
- [ ] MilestoneSchema validates id format (`^P\d+\.M\d+$`), type literal, all required fields, tasks array with z.lazy() recursion
- [ ] TaskSchema validates id format (`^P\d+\.M\d+\.T\d+$`), type literal, all required fields, subtasks array
- [ ] SubtaskSchema validates id format (`^P\d+\.M\d+\.T\d+\.S\d+$`), type literal, title constraints, status enum, story_points (1-21 integers), dependencies array, context_scope format
- [ ] ContextScopeSchema validates CONTRACT DEFINITION prefix, all 4 numbered sections (RESEARCH NOTE, INPUT, LOGIC, OUTPUT) in correct order
- [ ] StatusEnum validates all 6 values: Planned, Researching, Implementing, Complete, Failed, Obsolete
- [ ] ItemTypeEnum validates all 4 values: Phase, Milestone, Task, Subtask
- [ ] Story points validation documents discrepancy: system_context.md specifies 0.5, 1, 2 (max 2) but models.ts enforces 1-21 Fibonacci integers
- [ ] Dependencies array validation accepts empty arrays and valid subtask ID formats
- [ ] Invalid JSON samples are properly rejected with meaningful error messages
- [ ] Valid architect agent output passes full BacklogSchema validation
- [ ] Edge cases tested: missing fields, wrong types, boundary values, malformed IDs, invalid context_scope formats

## All Needed Context

### Context Completeness Check

_Before writing these tests, validate: "If someone knew nothing about this codebase, would they have everything needed to implement these schema validation tests successfully?"_

### Documentation & References

```yaml
# MUST READ - Zod schemas to test
- file: src/core/models.ts
  why: Contains all Zod schemas that need validation tests (BacklogSchema, PhaseSchema, MilestoneSchema, TaskSchema, SubtaskSchema, ContextScopeSchema, StatusEnum, ItemTypeEnum)
  critical: Lines 68-711 contain the exact schema definitions to test
  gotcha: Story points validation uses `.int()` which rejects 0.5 (decimal), despite system_context.md saying 0.5 is valid

# MUST READ - Existing test patterns to follow
- file: tests/unit/core/models.test.ts
  why: Reference implementation for Zod schema testing patterns in this codebase
  pattern: Uses `describe` blocks for each schema, `it('should accept valid values')` and `it('should reject invalid values')` pattern
  gotcha: Imports use `.js` extension (ES module requirement)

# MUST READ - Test configuration and setup
- file: vitest.config.ts
  why: Test runner configuration, coverage settings, file patterns
  pattern: Tests must match `tests/**/*.test.ts` pattern, coverage provider is v8, 100% coverage required

# MUST READ - Test setup and global hooks
- file: tests/setup.ts
  why: Global test configuration, mock cleanup, environment setup
  pattern: Uses beforeEach/afterEach for cleanup, API endpoint validation

# MUST READ - Task hierarchy structure specification
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Documents the expected task hierarchy JSON schema format
  section: Lines 109-154 show the data model with story_points: 0.5, 1, or 2 (max 2)
  critical: Contains discrepancy with actual implementation (models.ts uses 1-21)
  gotcha: The system_context.md specification differs from actual schema implementation - tests should document this

# MUST READ - Architect agent prompt and output format
- file: src/agents/prompts.ts
  why: Contains TASK_BREAKDOWN_PROMPT that generates JSON output
  critical: Understanding expected output format for creating valid test samples

# MUST READ - Architect agent integration tests
- file: tests/integration/agents/architect-agent-integration.test.ts
  why: Shows how architect agent output is validated against BacklogSchema
  pattern: Uses safeParse and checks result.success, validates hierarchy structure

# EXTERNAL RESEARCH - Zod validation best practices
- url: https://zod.dev/?id=schemas
  why: Official Zod schema reference for validation patterns
  critical: Understanding safeParse vs parse, error handling, custom refinements

# EXTERNAL RESEARCH - Testing recursive schemas with z.lazy()
- url: https://github.com/colinhacks/zod/blob/main/src/types.ts
  why: Zod source code showing recursive schema patterns
  critical: MilestoneSchema and PhaseSchema use z.lazy() for recursion - tests must validate deeply nested structures

# EXTERNAL RESEARCH - Vitest assertion patterns
- url: https://vitest.dev/guide/#assertion-api
  why: Vitest-specific assertion methods (expect, toBe, toEqual, toHaveProperty)
  critical: Use expect().toMatchSnapshot() for complex object validation
```

### Current Codebase Tree (Relevant Sections)

```bash
tests/
├── setup.ts                           # Global test setup
├── unit/
│   └── core/
│       ├── models.test.ts             # EXISTING: Basic schema tests (reference pattern)
│       └── task-breakdown-schema.test.ts  # CREATE: New comprehensive schema validation tests
├── integration/
│   └── agents/
│       └── architect-agent-integration.test.ts  # Reference: Architect agent output validation
└── fixtures/
    └── (architect-output-samples.ts)  # CREATE: Test fixtures for valid/invalid JSON

src/
├── core/
│   └── models.ts                      # Zod schemas to test (lines 68-711)
└── agents/
    └── prompts.ts                     # TASK_BREAKDOWN_PROMPT (generates JSON to validate)
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
├── unit/
│   └── core/
│       └── task-breakdown-schema.test.ts  # NEW: Comprehensive schema validation tests
└── fixtures/
    └── task-breakdown-samples.ts          # NEW: Valid and invalid JSON test fixtures

plan/003_b3d3efdaf0ed/P1M3T1S2/
├── PRP.md                                 # THIS DOCUMENT
└── research/
    └── schema-discrepancy-notes.md         # NEW: Documentation of story_points spec mismatch
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports require .js extension
// WRONG: import { BacklogSchema } from '../../../src/core/models';
// RIGHT:  import { BacklogSchema } from '../../../src/core/models.js';

// CRITICAL: Story points specification discrepancy
// system_context.md (line 150) says: story_points: number; // 0.5, 1, or 2 (max 2)
// models.ts (lines 328-332) enforces: .int() .min(1) .max(21)
// .int() rejects decimals (0.5 would fail validation)
// Tests should document this discrepancy

// CRITICAL: Recursive schemas use z.lazy() for self-reference
// MilestoneSchema and PhaseSchema use z.lazy() to handle recursive references
// Tests must deeply validate nested structures (Phase → Milestone → Task → Subtask)

// CRITICAL: ContextScopeSchema uses superRefine with custom validation
// Must start with "CONTRACT DEFINITION:\n" (note newline)
// Must have all 4 sections in exact order with regex pattern matching
// Section headers are case-sensitive: "RESEARCH NOTE:", "INPUT:", "LOGIC:", "OUTPUT:"

// CRITICAL: ID format validation uses strict regex patterns
// Phase:     /^P\d+$/
// Milestone: /^P\d+\.M\d+$/
// Task:      /^P\d+\.M\d+\.T\d+$/
// Subtask:   /^P\d+\.M\d+\.T\d+\.S\d+$/
// Tests must validate both valid and invalid ID formats

// CRITICAL: Title constraints
// .min(1, 'Title is required').max(200, 'Title too long')
// Empty string and >200 char strings should be rejected

// CRITICAL: Dependencies array accepts any string array
// Schema does NOT validate that dependency IDs are valid subtask IDs
// Tests should document this (array is z.array(z.string()).min(0))

// CRITICAL: StatusEnum has 6 values (not 4 as in some systems)
// 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
// 'Researching' and 'Obsolete' are sometimes missed in test fixtures

// CRITICAL: Vitest coverage is set to 100% (lines: 100, functions: 100, branches: 100, statements: 100)
// All schema branches must be tested or coverage will fail
```

## Implementation Blueprint

### Data Models and Structure

The test file will validate the following Zod schema hierarchy:

```typescript
// Schema hierarchy to test (from src/core/models.ts)

// 1. Base enums
StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
ItemTypeEnum = z.enum(['Phase', 'Milestone', 'Task', 'Subtask']);

// 2. Context scope validation (custom superRefine)
ContextScopeSchema = z.string().superRefine((value, ctx) => {
  // Validates "CONTRACT DEFINITION:\n" prefix
  // Validates 4 numbered sections in order
});

// 3. Subtask (leaf node)
SubtaskSchema = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/),
  type: z.literal('Subtask'),
  title: z.string().min(1).max(200),
  status: StatusEnum,
  story_points: z.number().int().min(1).max(21), // DISCREPANCY: not 0.5/1/2
  dependencies: z.array(z.string()).min(0),
  context_scope: ContextScopeSchema,
});

// 4. Task (contains Subtasks)
TaskSchema = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+$/),
  type: z.literal('Task'),
  title: z.string().min(1).max(200),
  status: StatusEnum,
  description: z.string().min(1),
  subtasks: z.array(SubtaskSchema),
});

// 5. Milestone (contains Tasks, uses z.lazy())
MilestoneSchema = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+$/),
    type: z.literal('Milestone'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1),
    tasks: z.array(z.lazy(() => TaskSchema)),
  })
);

// 6. Phase (contains Milestones, uses z.lazy())
PhaseSchema = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+$/),
    type: z.literal('Phase'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1),
    milestones: z.array(z.lazy(() => MilestoneSchema)),
  })
);

// 7. Backlog (root schema)
BacklogSchema = z.object({
  backlog: z.array(PhaseSchema),
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/fixtures/task-breakdown-samples.ts
  - IMPLEMENT: Test fixtures for valid and invalid JSON samples
  - FOLLOW pattern: tests/fixtures/simple-prd.ts (fixture export pattern)
  - NAMING: Export constants (VALID_BACKLOG, INVALID_BACKLOG, VALID_SUBTASK, INVALID_SUBTASK, etc.)
  - CONTENTS:
    * validMinimalBacklog: Minimal valid backlog with one phase
    * validFullHierarchy: Complete 4-level hierarchy (Phase → Milestone → Task → Subtask)
    * invalidIdFormats: Objects with malformed IDs (P1, P1.M, P1.M1.T, P1.M1.T1.S)
    * invalidStoryPoints: Various story_points values (0, 0.5, 1, 2, 22, 21)
    * invalidContextScope: Malformed CONTRACT DEFINITION strings
    * invalidStatusValues: Wrong status values
    * invalidDependencies: Non-array values
  - PLACEMENT: tests/fixtures/task-breakdown-samples.ts

Task 2: CREATE tests/unit/core/task-breakdown-schema.test.ts (base structure)
  - IMPLEMENT: Test file structure with imports, describe blocks, and setup
  - FOLLOW pattern: tests/unit/core/models.test.ts (exact test structure pattern)
  - NAMING: File name matches pattern: {feature}-schema.test.ts
  - IMPORTS: All schemas from models.ts, test fixtures from task-breakdown-samples.ts
  - PLACEMENT: tests/unit/core/task-breakdown-schema.test.ts
  - DEPENDENCIES: Task 1 (fixtures must exist first)

Task 3: IMPLEMENT StatusEnum and ItemTypeEnum validation tests
  - IMPLEMENT: Test suite for StatusEnum (6 valid values, invalid values rejected)
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 47-79
  - TEST CASES:
    * Accept all 6 valid status values
    * Reject invalid status strings
    * Reject wrong types (number, object, etc.)
  - IMPLEMENT: Test suite for ItemTypeEnum (4 valid values, invalid values rejected)
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 81-103
  - TEST CASES:
    * Accept all 4 valid item types
    * Reject invalid item type strings
  - PLACEMENT: In task-breakdown-schema.test.ts, top-level describe block
  - DEPENDENCIES: Task 2 (test file must exist)

Task 4: IMPLEMENT ContextScopeSchema validation tests
  - IMPLEMENT: Test suite for ContextScopeSchema with CONTRACT DEFINITION format
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 218-332
  - TEST CASES:
    * Accept valid CONTRACT DEFINITION with all 4 sections
    * Reject missing "CONTRACT DEFINITION:\n" prefix
    * Reject sections out of order
    * Reject missing sections (only 1, 2, or 3 sections)
    * Reject wrong section names (case sensitivity)
    * Accept valid section content variations
  - VALIDATION: Regex patterns for each section (lines 87-91 in models.ts)
  - PLACEMENT: In task-breakdown-schema.test.ts, describe('ContextScopeSchema')
  - DEPENDENCIES: Task 2 (test file must exist)

Task 5: IMPLEMENT SubtaskSchema validation tests
  - IMPLEMENT: Test suite for SubtaskSchema with all field validations
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 335-520
  - TEST CASES:
    * Accept valid subtask with all fields
    * Validate ID format regex (/^P\d+\.M\d+\.T\d+\.S\d+$/)
    * Validate type literal 'Subtask'
    * Validate title constraints (min 1, max 200)
    * Validate status enum values
    * Validate story_points range (1-21, integers only)
    * DOCUMENT: Story points discrepancy (0.5 rejected by .int(), but system_context.md says 0.5 is valid)
    * Validate dependencies array (empty and non-empty)
    * Validate context_scope format
    * Reject missing required fields
    * Reject invalid field types
  - EDGE CASES:
    * story_points = 0 (below minimum)
    * story_points = 0.5 (decimal, rejected by .int())
    * story_points = 22 (above maximum)
    * story_points = 21 (valid maximum)
    * Empty title string
    * 201 char title (too long)
  - PLACEMENT: In task-breakdown-schema.test.ts, describe('SubtaskSchema')
  - DEPENDENCIES: Task 2 (test file must exist)

Task 6: IMPLEMENT TaskSchema validation tests
  - IMPLEMENT: Test suite for TaskSchema with hierarchy validation
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 522-610
  - TEST CASES:
    * Accept valid task with all fields
    * Validate ID format regex (/^P\d+\.M\d+\.T\d+$/)
    * Validate type literal 'Task'
    * Validate title, status, description constraints
    * Validate subtasks array with SubtaskSchema items
    * Reject tasks with invalid subtasks
    * Reject missing required fields (description is required)
  - HIERARCHY: Test valid/invalid subtask nesting
  - PLACEMENT: In task-breakdown-schema.test.ts, describe('TaskSchema')
  - DEPENDENCIES: Task 2 (test file must exist)

Task 7: IMPLEMENT MilestoneSchema validation tests
  - IMPLEMENT: Test suite for MilestoneSchema with z.lazy() recursion
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 612-700
  - TEST CASES:
    * Accept valid milestone with all fields
    * Validate ID format regex (/^P\d+\.M\d+$/)
    * Validate type literal 'Milestone'
    * Validate tasks array with recursive TaskSchema
    * Test deeply nested task structures
    * Reject milestones with invalid tasks
  - RECURSION: Test that z.lazy() allows self-referencing validation
  - PLACEMENT: In task-breakdown-schema.test.ts, describe('MilestoneSchema')
  - DEPENDENCIES: Task 2 (test file must exist)

Task 8: IMPLEMENT PhaseSchema validation tests
  - IMPLEMENT: Test suite for PhaseSchema with z.lazy() recursion
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 702-790
  - TEST CASES:
    * Accept valid phase with all fields
    * Validate ID format regex (/^P\d+$/)
    * Validate type literal 'Phase'
    * Validate milestones array with recursive MilestoneSchema
    * Test deeply nested milestone → task → subtask structures
    * Reject phases with invalid milestones
  - RECURSION: Test 4-level hierarchy validation
  - PLACEMENT: In task-breakdown-schema.test.ts, describe('PhaseSchema')
  - DEPENDENCIES: Task 2 (test file must exist)

Task 9: IMPLEMENT BacklogSchema validation tests
  - IMPLEMENT: Test suite for BacklogSchema (root schema)
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 792-850
  - TEST CASES:
    * Accept valid backlog with phase array
    * Validate backlog wrapper structure
    * Accept multiple phases
    * Accept empty phase array
    * Reject non-array backlog value
    * Reject backlog with invalid phases
  - ROOT LEVEL: Test complete architect agent output format
  - PLACEMENT: In task-breakdown-schema.test.ts, describe('BacklogSchema')
  - DEPENDENCIES: Task 2 (test file must exist)

Task 10: IMPLEMENT architect agent output validation tests
  - IMPLEMENT: Test suite validating real architect agent output samples
  - FOLLOW pattern: tests/integration/agents/architect-agent-integration.test.ts
  - TEST CASES:
    * Validate valid architect output passes BacklogSchema
    * Test various real-world JSON samples from architect agent
    * Validate error messages for invalid architect output
    * Test edge cases from actual architect agent behavior
  - INTEGRATION: Use actual or simulated architect agent output
  - PLACEMENT: In task-breakdown-schema.test.ts, describe('Architect Agent Output Validation')
  - DEPENDENCIES: Task 1 (fixtures), Task 9 (BacklogSchema tests)

Task 11: CREATE plan/003_b3d3efdaf0ed/P1M3T1S2/research/schema-discrepancy-notes.md
  - IMPLEMENT: Documentation of story_points specification mismatch
  - CONTENT:
    * Document system_context.md specification (0.5, 1, 2 max)
    * Document models.ts implementation (1-21 integers, .int() rejects decimals)
    * Document impact: Architect agent may generate 0.5 SP, but schema will reject
    * Recommendation: Resolve discrepancy by updating either docs or schema
  - REFERENCE: system_context.md line 150, models.ts lines 328-332
  - PLACEMENT: plan/003_b3d3efdaf0ed/P1M3T1S2/research/schema-discrepancy-notes.md

Task 12: RUN tests and verify 100% coverage
  - EXECUTE: npm test -- tests/unit/core/task-breakdown-schema.test.ts
  - VERIFY: All tests pass
  - VERIFY: Coverage meets 100% threshold for tested schemas
  - EXECUTE: npm run test:coverage (if available)
  - FIX: Any failing tests or coverage gaps
  - DEPENDENCIES: All previous tasks (tests must be written first)
```

### Implementation Patterns & Key Details

```typescript
// ============================================
// TEST FILE STRUCTURE (from tests/unit/core/models.test.ts)
// ============================================

/**
 * Unit tests for task breakdown JSON schema validation
 *
 * @remarks
 * Tests validate Zod schemas for all task hierarchy types with comprehensive
 * coverage of field constraints, edge cases, and architect agent output validation.
 *
 * Documents discrepancy between system_context.md (story_points: 0.5, 1, 2)
 * and actual implementation (models.ts: 1-21 integers only).
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../plan/003_b3d3efdaf0ed/docs/system_context.md | System Context}
 */

import { describe, expect, it } from 'vitest';
import {
  StatusEnum,
  ItemTypeEnum,
  ContextScopeSchema,
  SubtaskSchema,
  TaskSchema,
  MilestoneSchema,
  PhaseSchema,
  BacklogSchema,
} from '../../../src/core/models.js';
import {
  validMinimalBacklog,
  validFullHierarchy,
  invalidIdFormats,
  invalidStoryPoints,
  invalidContextScope,
} from '../../fixtures/task-breakdown-samples.js';

describe('Task Breakdown Schema Validation', () => {
  // Test suites for each schema
});

// ============================================
// PATTERN: Enum validation (lines 47-79 in models.test.ts)
// ============================================

describe('StatusEnum', () => {
  it('should accept all valid status values', () => {
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
    const invalidStatuses = [
      'Ready',
      'Pending',
      'InProgress',
      '',
      null,
      undefined,
    ];

    invalidStatuses.forEach(status => {
      const result = StatusEnum.safeParse(status);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// PATTERN: ContextScopeSchema with superRefine
// ============================================

describe('ContextScopeSchema', () => {
  it('should accept valid CONTRACT DEFINITION format', () => {
    const validScope = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic research findings.
2. INPUT: Data from S1.
3. LOGIC: Implement feature.
4. OUTPUT: Feature for consumption by S2.`;

    const result = ContextScopeSchema.safeParse(validScope);
    expect(result.success).toBe(true);
  });

  it('should reject missing CONTRACT DEFINITION prefix', () => {
    const invalidScope = `1. RESEARCH NOTE: Research
2. INPUT: Data
3. LOGIC: Logic
4. OUTPUT: Output`;

    const result = ContextScopeSchema.safeParse(invalidScope);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('CONTRACT DEFINITION');
    }
  });

  it('should reject sections out of order', () => {
    const invalidScope = `CONTRACT DEFINITION:
2. INPUT: Data
1. RESEARCH NOTE: Research
3. LOGIC: Logic
4. OUTPUT: Output`;

    const result = ContextScopeSchema.safeParse(invalidScope);
    expect(result.success).toBe(false);
  });

  it('should reject missing sections', () => {
    const invalidScope = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Research
2. INPUT: Data
3. LOGIC: Logic`;

    const result = ContextScopeSchema.safeParse(invalidScope);
    expect(result.success).toBe(false);
  });
});

// ============================================
// PATTERN: SubtaskSchema with story_points discrepancy
// ============================================

describe('SubtaskSchema', () => {
  describe('story_points validation', () => {
    it('should accept valid story points (1-21 integers)', () => {
      const validPoints = [1, 2, 3, 5, 8, 13, 21];

      validPoints.forEach(sp => {
        const subtask = {
          id: 'P1.M1.T1.S1',
          type: 'Subtask' as const,
          title: 'Test subtask',
          status: 'Planned' as const,
          story_points: sp,
          dependencies: [],
          context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
        };

        const result = SubtaskSchema.safeParse(subtask);
        expect(result.success).toBe(true);
      });
    });

    it('should reject story_points below minimum (0)', () => {
      const subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask' as const,
        title: 'Test subtask',
        status: 'Planned' as const,
        story_points: 0,
        dependencies: [],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(false);
    });

    it('should reject story_points above maximum (22)', () => {
      const subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask' as const,
        title: 'Test subtask',
        status: 'Planned' as const,
        story_points: 22,
        dependencies: [],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(false);
    });

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
        expect(
          result.error.issues.some(i => i.message.includes('integer'))
        ).toBe(true);
      }
    });

    it('should reject non-numeric story_points', () => {
      const subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask' as const,
        title: 'Test subtask',
        status: 'Planned' as const,
        story_points: 'one' as any,
        dependencies: [],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(false);
    });
  });

  describe('dependencies array validation', () => {
    it('should accept empty dependencies array', () => {
      const subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask' as const,
        title: 'Test subtask',
        status: 'Planned' as const,
        story_points: 1,
        dependencies: [],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(true);
    });

    it('should accept valid subtask ID dependencies', () => {
      const subtask = {
        id: 'P1.M1.T1.S2',
        type: 'Subtask' as const,
        title: 'Test subtask',
        status: 'Planned' as const,
        story_points: 1,
        dependencies: ['P1.M1.T1.S1'],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(true);
    });

    it('should accept any string in dependencies array (schema does not validate ID format)', () => {
      // CRITICAL: Schema is z.array(z.string()).min(0) - does not validate subtask ID format
      // This test documents that schema accepts any string
      const subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask' as const,
        title: 'Test subtask',
        status: 'Planned' as const,
        story_points: 1,
        dependencies: ['invalid-id-format', 'P2.M3.T4.S5', 'random-string'],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      // Schema accepts any string - this is expected behavior
      expect(result.success).toBe(true);
    });

    it('should reject non-array dependencies', () => {
      const subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask' as const,
        title: 'Test subtask',
        status: 'Planned' as const,
        story_points: 1,
        dependencies: 'P1.M1.T1.S1' as any,
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// PATTERN: ID format validation (regex)
// ============================================

describe('SubtaskSchema ID format validation', () => {
  it('should accept valid subtask ID format', () => {
    const validIds = ['P1.M1.T1.S1', 'P99.M99.T99.S99', 'P01.M01.T01.S01'];

    validIds.forEach(id => {
      const subtask = {
        id,
        type: 'Subtask' as const,
        title: 'Test',
        status: 'Planned' as const,
        story_points: 1,
        dependencies: [],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid subtask ID formats', () => {
    const invalidIds = [
      'P1', // Wrong level (Phase)
      'P1.M1', // Wrong level (Milestone)
      'P1.M1.T1', // Wrong level (Task)
      'P1.M1.T1.S1.X1', // Too many levels
      'p1.m1.t1.s1', // Lowercase
      'P1.M1.T1.Ss1', // Mixed case
      'P1_M1_T1_S1', // Wrong separator
      'Phase1.Milestone1.Task1.Subtask1', // Words instead of numbers
    ];

    invalidIds.forEach(id => {
      const subtask = {
        id,
        type: 'Subtask' as const,
        title: 'Test',
        status: 'Planned' as const,
        story_points: 1,
        dependencies: [],
        context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
      };

      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// PATTERN: Recursive schema validation with z.lazy()
// ============================================

describe('BacklogSchema with full hierarchy', () => {
  it('should validate complete 4-level hierarchy', () => {
    const fullBacklog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase' as const,
          title: 'Phase 1',
          status: 'Planned' as const,
          description: 'Test phase',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone' as const,
              title: 'Milestone 1',
              status: 'Planned' as const,
              description: 'Test milestone',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task' as const,
                  title: 'Task 1',
                  status: 'Planned' as const,
                  description: 'Test task',
                  subtasks: [
                    {
                      id: 'P1.M1.T1.S1',
                      type: 'Subtask' as const,
                      title: 'Subtask 1',
                      status: 'Planned' as const,
                      story_points: 1,
                      dependencies: [],
                      context_scope: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test`,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = BacklogSchema.safeParse(fullBacklog);
    expect(result.success).toBe(true);
  });
});

// ============================================
// PATTERN: Architect agent output validation
// ============================================

describe('Architect Agent Output Validation', () => {
  it('should validate real architect agent output', () => {
    // Use actual architect output structure
    const architectOutput = validFullHierarchy; // from fixtures

    const result = BacklogSchema.safeParse(architectOutput);
    expect(result.success).toBe(true);
  });

  it('should reject malformed architect output', () => {
    const malformedOutput = {
      backlog: [
        {
          // Missing required fields
          id: 'P1',
          type: 'Phase',
          // Missing: title, status, description, milestones
        },
      ],
    };

    const result = BacklogSchema.safeParse(malformedOutput);
    expect(result.success).toBe(false);
  });
});
```

### Integration Points

```yaml
FIXTURES:
  - add to: tests/fixtures/task-breakdown-samples.ts
  - pattern: |
    export const validMinimalBacklog = { backlog: [...] };
    export const validFullHierarchy = { backlog: [...] };
    export const invalidIdFormats = [...];
    export const invalidStoryPoints = [...];

MODELS_IMPORT:
  - from: src/core/models.ts
  - pattern: |
    import {
      StatusEnum,
      ItemTypeEnum,
      SubtaskSchema,
      ContextScopeSchema,
      BacklogSchema,
    } from '../../../src/core/models.js';

DOCUMENTATION:
  - add to: plan/003_b3d3efdaf0ed/P1M3T1S2/research/schema-discrepancy-notes.md
  - content: Story points specification discrepancy documentation
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Lint and auto-fix the new test file
npm run lint -- --fix tests/unit/core/task-breakdown-schema.test.ts

# Type check the test file
npm run type-check

# Format the test file
npm run format

# Check fixtures file
npm run lint -- --fix tests/fixtures/task-breakdown-samples.ts

# Project-wide validation
npm run lint:fix
npm run type-check
npm run format:check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the specific test file during development
npm test -- tests/unit/core/task-breakdown-schema.test.ts

# Run with watch mode for iterative development
npm test -- --watch tests/unit/core/task-breakdown-schema.test.ts

# Run all core unit tests to ensure no regressions
npm test -- tests/unit/core/

# Run all unit tests
npm test -- tests/unit/

# Coverage validation (ensure 100% coverage)
npm run test:coverage

# Expected: All tests pass. Check coverage report for tested schemas.
# If tests fail, debug root cause and fix implementation (not the schemas).
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify existing tests still pass (no regressions)
npm test -- tests/unit/core/models.test.ts

# Verify architect agent integration tests still work
npm test -- tests/integration/agents/architect-agent-integration.test.ts

# Full integration test suite
npm test -- tests/integration/

# Verify fixtures can be imported correctly
node -e "import('./tests/fixtures/task-breakdown-samples.js').then(m => console.log(Object.keys(m)))"

# Expected: All existing tests pass, fixtures load correctly.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Schema validation edge case testing

# Test with actual architect agent output (if available)
# Run architect agent and capture output
# Validate captured output against BacklogSchema

# Validate schema error messages are helpful
npm test -- tests/unit/core/task-breakdown-schema.test.ts --reporter=verbose

# Check that discrepancy documentation is clear
cat plan/003_b3d3efdaf0ed/P1M3T1S2/research/schema-discrepancy-notes.md

# Verify test fixtures cover all edge cases
grep -r "describe\|it(" tests/unit/core/task-breakdown-schema.test.ts | wc -l

# Expected: Comprehensive edge case coverage, clear error messages,
# discrepancy documented for future resolution.
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/task-breakdown-schema.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format:check`
- [ ] Coverage meets 100% threshold for tested schemas
- [ ] Existing tests (models.test.ts) still pass (no regressions)

### Feature Validation

- [ ] StatusEnum validates all 6 values: Planned, Researching, Implementing, Complete, Failed, Obsolete
- [ ] ItemTypeEnum validates all 4 values: Phase, Milestone, Task, Subtask
- [ ] ContextScopeSchema validates CONTRACT DEFINITION format with all 4 sections
- [ ] SubtaskSchema validates all fields including story_points (1-21) and dependencies array
- [ ] TaskSchema validates all fields and subtasks array
- [ ] MilestoneSchema validates all fields and tasks array with z.lazy() recursion
- [ ] PhaseSchema validates all fields and milestones array with z.lazy() recursion
- [ ] BacklogSchema validates complete hierarchy structure
- [ ] ID format regex validation tested for all levels (Phase, Milestone, Task, Subtask)
- [ ] Story points discrepancy documented (0.5 rejected by .int() despite system_context.md)
- [ ] Dependencies array accepts any string (schema does not validate ID format)
- [ ] Title constraints tested (min 1, max 200 characters)
- [ ] Valid and invalid JSON samples tested
- [ ] Architect agent output validation included

### Code Quality Validation

- [ ] Follows existing test patterns from tests/unit/core/models.test.ts
- [ ] File placement matches desired codebase tree structure
- [ ] ES Module imports use .js extension
- [ ] Test fixtures exported correctly from tests/fixtures/task-breakdown-samples.ts
- [ ] Test descriptions are clear and descriptive
- [ ] Edge cases and boundary values tested
- [ ] Error messages validated for helpfulness

### Documentation & Deployment

- [ ] Story points discrepancy documented in research/schema-discrepancy-notes.md
- [ ] Test file includes JSDoc comments explaining purpose and context
- [ ] Discrepancy reference included in test comments
- [ ] System context reference included in documentation
- [ ] Fixtures are well-documented with clear purpose for each sample

---

## Anti-Patterns to Avoid

- **Don't modify the Zod schemas** - This is a validation task, not a schema modification task
- **Don't skip testing the discrepancy** - The story_points mismatch must be documented and tested
- **Don't use wrong import syntax** - Must use `.js` extension for ES modules
- **Don't forget edge cases** - Test boundaries (0, 1, 21, 22, 0.5, empty strings, etc.)
- **Don't ignore recursive validation** - Test deeply nested structures (Phase → Milestone → Task → Subtask)
- **Don't assume schema validates dependency IDs** - Dependencies array is z.array(z.string()), not subtask IDs
- **Don't skip context_scope format tests** - CONTRACT DEFINITION validation is complex and needs thorough testing
- **Don't forget to run existing tests** - Ensure no regressions in models.test.ts
- **Don't use describe.skip or test.skip** - All tests must pass for 100% coverage
- **Don't hardcode test samples** - Use fixtures for reusability and clarity
- **Don't ignore error message validation** - Check that error messages are helpful and accurate
