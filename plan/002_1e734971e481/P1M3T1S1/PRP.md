# Product Requirement Prompt (PRP): Test Phase/Milestone/Task/Subtask Type Definitions

**PRP ID**: P1.M3.T1.S1
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Create comprehensive unit tests for the four-level task hierarchy type definitions (Phase, Milestone, Task, Subtask) to validate TypeScript type definitions and Zod schema constraints.

**Deliverable**: Test file at `tests/unit/core/models.test.ts` with:
1. Type system tests using `expectTypeOf()` for compile-time verification
2. Runtime validation tests using `safeParse()` for all Zod schemas
3. ID format regex validation tests for each hierarchy level
4. Status enum validation tests
5. Story points constraint tests (Fibonacci: 1,2,3,5,8,13,21)
6. Type discriminator tests for all four hierarchy types
7. Nested hierarchy validation (4-level deep structure)

**Success Definition**:
- All 4 task hierarchy types have passing type tests
- Zod schema validation covers all constraints (ID patterns, status, story_points)
- TypeScript compilation verified without errors
- 100% code coverage maintained for models.ts
- All tests follow existing patterns from tests/unit/core/

---

## User Persona

**Target User**: Developer working on the PRP Pipeline codebase who needs confidence that the core task hierarchy models are correctly typed and validated.

**Use Case**: Implementing features that depend on task hierarchy types and needing assurance that type definitions and validation constraints work correctly.

**User Journey**:
1. Developer modifies task hierarchy models or adds new features
2. Developer runs test suite to verify changes
3. Tests pass if types and schemas are correct
4. Tests fail with clear error messages if constraints violated

**Pain Points Addressed**:
- **Unclear type errors**: Tests provide clear examples of correct type usage
- **Silent validation failures**: Runtime tests catch Zod validation errors
- **Broken hierarchies**: Nested structure tests prevent regressions
- **Invalid IDs**: Regex tests ensure ID format consistency

---

## Why

- **Type Safety Foundation**: The task hierarchy is core to the PRP Pipeline. Ensuring type correctness prevents runtime errors.
- **Validation Confidence**: Zod schemas must enforce correct constraints. Tests verify this enforcement.
- **Regression Prevention**: Changes to models.ts won't break existing functionality if tests catch issues.
- **Documentation**: Tests serve as executable documentation of expected behavior.
- **Problems Solved**:
  - "How do I create a valid Subtask?"
  - "What's the correct ID format for a Task?"
  - "Which story_points values are valid?"
  - "What happens if I use the wrong type discriminator?"

---

## What

Create a comprehensive test file for the task hierarchy type definitions defined in `/src/core/models.ts`. The tests must verify both compile-time type safety and runtime Zod validation.

### Current State Analysis

**Existing Test File**: `tests/unit/core/models.test.ts` (2020 lines)
- Contains comprehensive Zod schema tests for all hierarchy types
- Already tests: StatusEnum, ItemTypeEnum, SubtaskSchema, TaskSchema, MilestoneSchema, PhaseSchema
- Tests cover: ID validation, type validation, nested structures

**Task Context** (from `plan/002_1e734971e481/tasks.json`):
The P1.M3.T1.S1 context specifies:
> "Test 1: Create valid Phase object with nested Milestone→Task→Subtask, verify TypeScript compilation.
> Test 2: Test invalid type field ('Invalid') causes Zod validation error.
> Test 3: Test invalid story_points (3) fails validation.
> Test 4: Test id pattern validation (regex for P[#], P[#].M[#], etc.)."

**Note**: The context mentions story_points: 0.5|1|2, but the actual implementation uses 1-21 (Fibonacci). Tests should validate against the actual implementation.

### Success Criteria

- [ ] Type system tests using `expectTypeOf()` for all four hierarchy types
- [ ] Runtime Zod validation tests for all schemas
- [ ] ID regex pattern tests (Phase, Milestone, Task, Subtask)
- [ ] Story points constraint tests (Fibonacci: 1,2,3,5,8,13,21)
- [ ] Type discriminator tests (rejecting invalid types)
- [ ] Nested hierarchy validation (4-level deep)
- [ ] TypeScript compilation verification
- [ ] All tests passing with 100% coverage maintained

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] Task hierarchy types analyzed (Phase, Milestone, Task, Subtask)
- [x] Zod schemas documented with all constraints
- [x] Existing test patterns identified
- [x] TypeScript testing best practices researched
- [x] Codebase tree structure confirmed
- [x] Critical gotchas documented

---

### Documentation & References

```yaml
# MUST READ - Source type definitions
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains all type definitions and Zod schemas to test
  section: Lines 55-61 (Status), 149-211 (Subtask), 236-253 (SubtaskSchema),
         286-322 (Task), 346-358 (TaskSchema), 381-416 (Milestone),
         440-454 (MilestoneSchema), 478-513 (Phase), 537-546 (PhaseSchema)
  critical: |
    - All interfaces use readonly properties
    - All have type discriminator field ('Phase', 'Milestone', 'Task', 'Subtask')
    - IDs must match regex patterns: ^P\d+$, ^P\d+\.M\d+$, ^P\d+\.M\d+\.T\d+$, ^P\d+\.M\d+\.T\d+\.S\d+$
    - Status is enum with 6 values: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
    - story_points is integer 1-21 (Fibonacci), NOT 0.5|1|2 as mentioned in system_context.md
    - Dependencies is string[] (array of subtask IDs)
    - context_scope is required string for Subtask

# MUST READ - System context documentation
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md
  why: Contains specification for task hierarchy (Section 6.1)
  section: Lines 260-324
  critical: |
    - NOTE: system_context says story_points: 0.5|1|2
    - ACTUAL implementation uses story_points: 1-21 (Fibonacci)
    - Tests should validate against actual implementation, not system_context
    - Use this for understanding hierarchy structure, not for validation values

# MUST READ - Existing test patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts
  why: Contains existing Zod schema tests to follow for consistency
  section: Full file (2020 lines)
  pattern: |
    - Use describe() blocks grouped by schema/type
    - Use it() for individual test cases
    - Use safeParse() for Zod validation
    - Comment structure: SETUP, EXECUTE, VERIFY
    - Test names: "should validate valid X" or "should reject invalid X"

# MUST READ - Test configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test framework configuration with 100% coverage threshold
  section: Full file
  critical: |
    - Framework: Vitest 1.6.1
    - Environment: node
    - 100% coverage requirement (statements, branches, functions, lines)
    - Global test APIs enabled (no imports needed for describe, it, expect)

# MUST READ - TypeScript config
- file: /home/dustin/projects/hacky-hack/tsconfig.json
  why: TypeScript compilation settings
  section: Full file
  critical: |
    - Target: ES2022
    - Module: ESM (Node16)
    - Strict mode enabled

# TYPE TESTING - Vitest type testing API
- url: https://vitest.dev/api/expect-typeof.html
  why: expectTypeOf() API for compile-time type verification
  critical: |
    - Use expectTypeOf<T>() for type assertions
    - Use toMatchTypeOf<T>() for structure comparison
    - Use toBeLiteral() for exact literal type checking
    - Use toHaveProperty() for property existence
    - Use extract<> for nested property type checking

# ZOD TESTING - Zod validation patterns
- url: https://github.com/colinhacks/zod
  why: Zod schema validation best practices
  section: Error handling documentation
  critical: |
    - Always use safeParse() in tests, never parse()
    - Check result.success before accessing result.data
    - Error paths are arrays: ['fieldName'] or ['nested', 0, 'field']
    - Use z.infer<typeof Schema> for type inference tests

# RESEARCH DOCUMENTATION - External research stored locally
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T1S1/research/zod-testing-patterns.md
  why: Detailed Zod testing patterns and gotchas
  section: Full file

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T1S1/research/typescript-testing-patterns.md
  why: TypeScript type testing patterns with Vitest
  section: Full file

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T1S1/research/task-hierarchy-types.md
  why: Complete reference of all type definitions and Zod schemas
  section: Full file

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T1S1/research/test-patterns-analysis.md
  why: Existing test patterns in the codebase
  section: Full file

# PARALLEL CONTEXT - Previous work item P1.M2.T2.S3
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T2S3/PRP.md
  why: Documentation updates from previous work item
  section: Lines 9-27 (Goal and Deliverable)
  critical: |
    - Previous PRP documents API configuration requirements
    - This PRP is for data structure validation, independent of API config
    - No code dependencies between these work items
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── models.ts                    # SOURCE: Type definitions and Zod schemas (1786 lines)
│   │   ├── index.ts                     # Export of all types
│   │   ├── dependency-validator.ts
│   │   ├── session-manager.ts
│   │   └── ...
│   ├── utils/
│   │   ├── typecheck-runner.ts          # Utility for TypeScript compilation verification
│   │   └── ...
│   └── ...
├── tests/
│   ├── setup.ts                         # Global test setup with API validation
│   ├── unit/
│   │   ├── core/
│   │   │   ├── models.test.ts           # EXISTING: Zod schema tests (2020 lines)
│   │   │   ├── task-utils.test.ts       # Utility function tests
│   │   │   ├── dependency-validator.test.ts
│   │   │   └── session-utils.test.ts
│   │   └── ...
│   ├── manual/
│   │   ├── models-type-test.ts          # Manual type verification
│   │   └── ...
│   └── ...
├── vitest.config.ts                     # Test configuration (100% coverage)
├── tsconfig.json                        # TypeScript configuration
└── package.json
```

---

### Desired Codebase Tree (files to be modified)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── core/
            └── models.test.ts           # EXTEND: Add type system tests
                                        # EXTEND: Add TypeScript compilation tests
                                        # MAINTAIN: All existing Zod validation tests
```

**Note**: The existing `models.test.ts` file (2020 lines) already contains comprehensive Zod schema tests. This PRP extends it with type system tests and TypeScript compilation verification.

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: story_points actual values vs system_context.md documentation
// system_context.md states: story_points: 0.5 | 1 | 2
// ACTUAL models.ts implementation: story_points: number (integer 1-21)
// Tests must validate against actual implementation (Fibonacci: 1,2,3,5,8,13,21)

// CRITICAL: Zod safeParse() returns discriminated union
// Always check result.success before accessing result.data
const result = SubtaskSchema.safeParse(data);
if (result.success) {
  // TypeScript knows result.data exists here
  expect(result.data).toEqual(expected);
} else {
  // TypeScript knows result.error exists here
  expect(result.error.issues).toHaveLength(1);
}

// GOTCHA: Error paths are arrays, not dot-notation strings
// WRONG: result.error.issues[0].path === 'tasks.0.id'
// CORRECT: result.error.issues[0].path equals ['tasks', 0, 'id']

// CRITICAL: All interfaces use readonly properties
// Attempting to reassign will cause TypeScript error
const subtask: Subtask = { ... };
// subtask.id = 'new-id'; // TypeScript error: Cannot assign to 'id' because it is read-only

// CRITICAL: Type discriminators are literal types
// 'Phase' | 'Milestone' | 'Task' | 'Subtask'
// Invalid types must cause Zod validation to fail

// GOTCHA: z.lazy() for recursive schemas
// MilestoneSchema and PhaseSchema use z.lazy() for nested structures
// This is required for forward references to themselves

// CRITICAL: ID format regex patterns
// Phase: ^P\d+$ (e.g., "P1", "P123")
// Milestone: ^P\d+\.M\d+$ (e.g., "P1.M1", "P123.M456")
// Task: ^P\d+\.M\d+\.T\d+$ (e.g., "P1.M1.T1", "P123.M456.T789")
// Subtask: ^P\d+\.M\d+\.T\d+\.S\d+$ (e.g., "P1.M1.T1.S1", "P123.M456.T789.S999")

// CRITICAL: Status enum has 6 values
// 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
// Case-sensitive, exact string match required

// CRITICAL: 100% code coverage requirement
// All tests must achieve 100% coverage for models.ts
// Check coverage with: npm run test:coverage

// GOTCHA: Vitest globals are enabled
// No need to import describe, it, expect, test, etc.
// They are available globally in all test files

// CRITICAL: Test file naming convention
// Use .test.ts suffix (not .spec.ts)
// Follow existing pattern: models.test.ts, task-utils.test.ts
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task creates tests for existing type definitions.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing models.test.ts file
  - FILE: tests/unit/core/models.test.ts
  - READ: Lines 1-2020 (existing test coverage)
  - UNDERSTAND: Current test structure and patterns
  - IDENTIFY: Gaps in type system testing
  - DEPENDENCIES: None

Task 2: READ src/core/models.ts type definitions
  - FILE: src/core/models.ts
  - READ: Lines 55-546 (all type definitions and Zod schemas)
  - DOCUMENT: All fields, constraints, validation rules
  - DEPENDENCIES: None

Task 3: ADD type system tests for Subtask
  - FILE: tests/unit/core/models.test.ts (extend existing file)
  - ADD: describe block for 'Subtask type structure'
  - IMPLEMENT: expectTypeOf() tests for all Subtask properties
  - IMPLEMENT: Type discriminator test (type: 'Subtask')
  - IMPLEMENT: Readonly property test
  - IMPLEMENT: Type inference test (z.infer<typeof SubtaskSchema>)
  - PATTERN: Follow research/typescript-testing-patterns.md
  - DEPENDENCIES: Task 1, Task 2

Task 4: ADD type system tests for Task
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'Task type structure'
  - IMPLEMENT: expectTypeOf() tests for all Task properties
  - IMPLEMENT: Type discriminator test (type: 'Task')
  - IMPLEMENT: Subtask array type test
  - DEPENDENCIES: Task 3

Task 5: ADD type system tests for Milestone
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'Milestone type structure'
  - IMPLEMENT: expectTypeOf() tests for all Milestone properties
  - IMPLEMENT: Type discriminator test (type: 'Milestone')
  - IMPLEMENT: Task array type test
  - DEPENDENCIES: Task 4

Task 6: ADD type system tests for Phase
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'Phase type structure'
  - IMPLEMENT: expectTypeOf() tests for all Phase properties
  - IMPLEMENT: Type discriminator test (type: 'Phase')
  - IMPLEMENT: Milestone array type test
  - DEPENDENCIES: Task 5

Task 7: ADD Status enum type tests
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'Status enum type'
  - IMPLEMENT: expectTypeOf() tests for all 6 status values
  - IMPLEMENT: Type inference test (z.infer<typeof StatusEnum>)
  - DEPENDENCIES: Task 2

Task 8: ADD ItemType enum type tests
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'ItemType enum type'
  - IMPLEMENT: expectTypeOf() tests for all 4 item type values
  - IMPLEMENT: Type inference test (z.infer<typeof ItemTypeEnum>)
  - DEPENDENCIES: Task 2

Task 9: ADD invalid type field test
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'Invalid type discriminator validation'
  - IMPLEMENT: Test invalid type field ('Invalid') causes Zod error
  - IMPLEMENT: Test wrong type for each level (e.g., 'Subtask' on Task)
  - IMPLEMENT: Verify error messages are informative
  - PATTERN: Use safeParse() and expect(result.success).toBe(false)
  - DEPENDENCIES: Task 3, Task 4, Task 5, Task 6

Task 10: ADD story_points validation tests
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'Story points validation'
  - IMPLEMENT: Test valid Fibonacci values (1, 2, 3, 5, 8, 13, 21)
  - IMPLEMENT: Test invalid values (0, 4, 6, 7, 9, 10, 22+, decimals)
  - IMPLEMENT: Use test.each() for table-driven testing
  - CRITICAL: Validate against actual implementation (1-21), NOT system_context.md (0.5|1|2)
  - DEPENDENCIES: Task 3

Task 11: ADD ID pattern validation tests
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'ID format validation'
  - IMPLEMENT: Test Phase IDs (^P\d+$)
  - IMPLEMENT: Test Milestone IDs (^P\d+\.M\d+$)
  - IMPLEMENT: Test Task IDs (^P\d+\.M\d+\.T\d+$)
  - IMPLEMENT: Test Subtask IDs (^P\d+\.M\d+\.T\d+\.S\d+$)
  - IMPLEMENT: Use test.each() for valid and invalid patterns
  - DEPENDENCIES: Task 2

Task 12: ADD nested hierarchy validation test
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'Nested hierarchy validation'
  - IMPLEMENT: Test 4-level deep structure (Phase > Milestone > Task > Subtask)
  - IMPLEMENT: Verify all levels validate correctly
  - IMPLEMENT: Test with multiple children at each level
  - DEPENDENCIES: Task 6

Task 13: ADD TypeScript compilation verification test
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe block for 'TypeScript compilation verification'
  - IMPLEMENT: Test that models.ts compiles without errors
  - IMPLEMENT: Use typecheck-runner utility OR npm run typecheck
  - IMPLEMENT: Verify no TypeScript errors
  - PATTERN: Follow research/typescript-testing-patterns.md
  - DEPENDENCIES: Task 2

Task 14: RUN tests and verify coverage
  - RUN: npm test (or vitest run)
  - VERIFY: All tests pass
  - VERIFY: Coverage is 100% for models.ts
  - FIX: Any failing tests or coverage gaps
  - DEPENDENCIES: All previous tasks

Task 15: RUN typecheck and verify compilation
  - RUN: npm run typecheck
  - VERIFY: No TypeScript compilation errors
  - VERIFY: Type tests compile correctly
  - DEPENDENCIES: Task 13, Task 14
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Type System Test Structure
// =============================================================================

describe('TypeScript type definitions', () => {
  describe('Subtask type structure', () => {
    it('should have correct property types', () => {
      expectTypeOf<Subtask>()
        .toHaveProperty('id')
        .toBeString();

      expectTypeOf<Subtask>()
        .toHaveProperty('type')
        .toBeLiteral('Subtask');

      expectTypeOf<Subtask>()
        .toHaveProperty('title')
        .toBeString();

      expectTypeOf<Subtask>()
        .toHaveProperty('status')
        .toEqualTypeOf<Status>();

      expectTypeOf<Subtask>()
        .toHaveProperty('story_points')
        .toBeNumber();

      expectTypeOf<Subtask>()
        .toHaveProperty('dependencies')
        .toBeArray();

      expectTypeOf<Subtask>()
        .toHaveProperty('context_scope')
        .toBeString();
    });

    it('should have readonly properties', () => {
      const sample: Subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask',
        title: 'Test',
        status: 'Planned',
        story_points: 2,
        dependencies: [],
        context_scope: 'Test',
      };

      // @ts-expect-error - Property is readonly
      sample.id = 'P1.M1.T1.S2';
    });

    it('should match Zod schema inference', () => {
      type InferredSubtask = z.infer<typeof SubtaskSchema>;
      expectTypeOf<InferredSubtask>().toEqualTypeOf<Subtask>();
    });
  });
});

// =============================================================================
// PATTERN: Zod Schema Validation Test
// =============================================================================

describe('SubtaskSchema runtime validation', () => {
  const validSubtask = {
    id: 'P1.M1.T1.S1',
    type: 'Subtask',
    title: 'Create TypeScript interfaces',
    status: 'Planned',
    story_points: 2,
    dependencies: [],
    context_scope: 'src/core/ directory only',
  };

  describe('Valid inputs', () => {
    it('should accept valid Subtask', () => {
      const result = SubtaskSchema.safeParse(validSubtask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSubtask);
      }
    });
  });

  describe('ID format validation', () => {
    const validIds = ['P1.M1.T1.S1', 'P123.M456.T789.S999'];
    const invalidIds = [
      'P1.M1.T1',          // Missing S segment
      'P1.M1.T1.S1.S2',    // Extra segment
      'p1.m1.t1.s1',       // Lowercase letters
      'P1-M1-T1-S1',       // Wrong separator
      'P1.M1.T1.S',        // Missing number after S
    ];

    validIds.forEach(id => {
      const result = SubtaskSchema.safeParse({ ...validSubtask, id });
      expect(result.success).toBe(true);
    });

    invalidIds.forEach(id => {
      const result = SubtaskSchema.safeParse({ ...validSubtask, id });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// PATTERN: Table-Driven Testing for Story Points
// =============================================================================

describe('Story points validation', () => {
  const validPoints = [1, 2, 3, 5, 8, 13, 21];
  const invalidPoints = [0, 4, 6, 7, 9, 10, 22, -1, 1.5];

  test.each(validPoints)('should accept valid story_points: %d', (points) => {
    const result = SubtaskSchema.safeParse({
      ...validSubtask,
      story_points: points,
    });
    expect(result.success).toBe(true);
  });

  test.each(invalidPoints)('should reject story_points: %d', (points) => {
    const result = SubtaskSchema.safeParse({
      ...validSubtask,
      story_points: points,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// PATTERN: Type Discriminator Validation
// =============================================================================

describe('Type discriminator validation', () => {
  it('should enforce literal type "Subtask"', () => {
    const result = SubtaskSchema.safeParse({
      ...validSubtask,
      type: 'Task' as any,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// PATTERN: Nested Hierarchy Validation
// =============================================================================

describe('Nested hierarchy validation', () => {
  it('should validate 4-level deep hierarchy', () => {
    const deepPhase: Phase = {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1',
      status: 'Planned',
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1',
          status: 'Planned',
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1',
              status: 'Planned',
              description: 'Test task',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Subtask 1',
                  status: 'Planned',
                  story_points: 2,
                  dependencies: [],
                  context_scope: 'Test',
                },
              ],
            },
          ],
        },
      ],
    };

    const result = PhaseSchema.safeParse(deepPhase);
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// PATTERN: TypeScript Compilation Verification
// =============================================================================

describe('TypeScript compilation verification', () => {
  it('should verify models.ts compiles without errors', async () => {
    const { runTypecheck } = await import('../../src/utils/typecheck-runner.js');

    const result = await runTypecheck({
      projectPath: '/home/dustin/projects/hacky-hack',
    });

    expect(result.success).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.errors).toEqual([]);
  });
});

// =============================================================================
// GOTCHA: Error Path Validation
// =============================================================================

describe('Error path validation', () => {
  it('should report correct nested error paths', () => {
    const result = TaskSchema.safeParse({
      id: 'P1.M1.T1',
      type: 'Task',
      title: 'Task',
      status: 'Planned',
      description: 'Test',
      subtasks: [
        {
          id: 'INVALID-ID',
          type: 'Subtask',
          title: 'Test',
          status: 'Planned',
          story_points: 1,
          dependencies: [],
          context_scope: 'Test',
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const subtaskError = result.error.issues.find(
        issue => issue.path.includes('subtasks')
      );
      expect(subtaskError?.path).toEqual(['subtasks', 0, 'id']);
    }
  });
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING TESTS:
  - tests/unit/core/models.test.ts has 2020 lines of Zod schema tests
  - Pattern: Use describe/it blocks with SETUP/EXECUTE/VERIFY comments
  - Pattern: Use safeParse() for Zod validation
  - Pattern: Use expect().toMatchObject() for data comparison
  - This PRP: Extends with type system tests

INPUT FROM EXISTING UTILITIES:
  - src/utils/typecheck-runner.ts for TypeScript compilation verification
  - Contract: runTypecheck({ projectPath }) returns { success, errorCount, errors }
  - This PRP: Uses this utility for compilation tests

INPUT FROM TASK CONTEXT:
  - tasks.json specifies Test 1-4 requirements
  - Test 1: Create valid Phase with nested hierarchy
  - Test 2: Test invalid type field
  - Test 3: Test invalid story_points (note: actual impl is 1-21)
  - Test 4: Test ID pattern validation
  - This PRP: Implements all four tests plus additional coverage

OUTPUT FOR SUBSEQUENT WORK:
  - Extended models.test.ts with comprehensive type testing
  - Confidence that task hierarchy types are correct
  - Foundation for P1.M3.T1.S2 (Test task status transitions)
  - Foundation for P1.M3.T1.S3 (Test context_scope contract format)

DIRECTORY STRUCTURE:
  - Modify: tests/unit/core/models.test.ts (extend existing file)
  - No new files needed

CLEANUP INTEGRATION:
  - None required - tests only, no side effects
  - Tests can run independently
  - No database or filesystem modifications
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After each significant code addition
# Run tests to check for errors
npm test -- tests/unit/core/models.test.ts

# Expected: Tests run without syntax errors
# Expected: New tests appear in test output

# TypeScript compilation check
npm run typecheck

# Expected: No TypeScript compilation errors
# Expected: Type tests compile correctly

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the models.test.ts file specifically
npm test -- tests/unit/core/models.test.ts

# Expected: All tests pass (including new type tests)
# Expected: No failing tests

# Run full test suite for affected area
npm test -- tests/unit/core/

# Expected: All core tests pass
# Expected: No regressions in other test files

# Coverage validation
npm run test:coverage

# Expected: 100% coverage for src/core/models.ts
# Expected: No uncovered lines

# If tests fail, check:
# - Type assertions are correct
# - Zod schemas are imported correctly
# - expectTypeOf() syntax is valid
# - safeParse() result is checked for success
```

### Level 3: Type System Validation (Compile-Time Verification)

```bash
# TypeScript compilation verification
npm run typecheck

# Expected: No compilation errors
# Expected: Type tests are type-checked

# Verify type inference works
# If this file compiles, types are correct
cat > /tmp/type-test.ts << 'EOF'
import { Subtask, SubtaskSchema } from './src/core/models.js';

type Inferred = z.infer<typeof SubtaskSchema>;
const test: Inferred = {} as Subtask;
EOF
npx tsc --noEmit /tmp/type-test.ts

# Expected: No type errors (Inferred matches Subtask)

# If type errors exist, check:
# - All types are imported correctly
# - z.infer<> is used correctly
# - expectTypeOf() assertions are valid
```

### Level 4: Integration Testing (Full Pipeline Validation)

```bash
# Full test suite run
npm test

# Expected: All tests pass across entire codebase
# Expected: No new test failures

# Coverage report validation
npm run test:coverage

# Expected: 100% coverage maintained
# Expected: Coverage for src/core/models.ts is 100%

# Manual verification: Read test output
npm test -- tests/unit/core/models.test.ts --reporter=verbose

# Expected: Clear test names showing what each test validates
# Expected: Tests grouped by describe blocks (type structure, validation, etc.)

# Performance check: Tests should run quickly
time npm test -- tests/unit/core/models.test.ts

# Expected: Tests complete in reasonable time (< 5 seconds for models.test.ts)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All type system tests implemented using expectTypeOf()
- [ ] All Zod schema validation tests implemented using safeParse()
- [ ] ID pattern validation tests for all 4 hierarchy levels
- [ ] Story points validation tests (Fibonacci: 1,2,3,5,8,13,21)
- [ ] Type discriminator tests for all 4 types
- [ ] Nested hierarchy validation test (4-level deep)
- [ ] TypeScript compilation verification test
- [ ] All tests pass: `npm test -- tests/unit/core/models.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] 100% coverage for models.ts: `npm run test:coverage`

### Feature Validation

- [ ] Test 1: Valid Phase with nested hierarchy (from task context)
- [ ] Test 2: Invalid type field causes Zod error (from task context)
- [ ] Test 3: Invalid story_points fails validation (from task context)
- [ ] Test 4: ID pattern validation (from task context)
- [ ] Additional type system tests for comprehensive coverage
- [ ] Follows existing test patterns from tests/unit/core/

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Uses describe/it block structure with clear test names
- [ ] Uses SETUP/EXECUTE/VERIFY comment pattern
- [ ] Uses safeParse() for all Zod validation
- [ ] Uses expectTypeOf() for all type system tests
- [ ] No duplicate tests (extend existing, don't repeat)
- [ ] Error messages are clear and informative

### Documentation & Deployment

- [ ] Tests are self-documenting with clear names
- [ ] Type tests serve as executable documentation
- [ ] No external dependencies required (uses existing utilities)
- [ ] Tests can run independently without setup

---

## Anti-Patterns to Avoid

- **Don't use parse() in tests** - Always use safeParse() for Zod validation
- **Don't skip type narrowing** - Always check result.success before accessing result.data
- **Don't use wrong story_points values** - Use 1-21 (Fibonacci), NOT 0.5|1|2 from system_context.md
- **Don't forget error path validation** - Error paths are arrays: ['field', 0, 'nested']
- **Don't ignore TypeScript compilation** - Include compilation verification tests
- **Don't duplicate existing tests** - Extend models.test.ts, don't rewrite existing tests
- **Don't use assertType** - Use expectTypeOf() for better error messages
- **Don't test private implementation details** - Test public APIs and schemas
- **Don't ignore readonly properties** - Verify properties are readonly
- **Don't skip type inference tests** - Verify z.infer<> matches interface
- **Don't use wrong test file name** - Use models.test.ts (already exists)
- **Don't forget nested structure tests** - Test 4-level deep hierarchy

---

## Appendix: Decision Rationale

### Why extend existing models.test.ts instead of creating new file?

The existing `models.test.ts` already contains comprehensive Zod schema tests (2020 lines). Extending it with type system tests keeps all model-related tests in one place, making them easier to find and maintain.

### Why use expectTypeOf() instead of assertType?

`expectTypeOf()` provides better error messages and more flexible assertions. It's the recommended approach in Vitest for type testing.

### Why validate story_points as 1-21 instead of 0.5|1|2?

The actual implementation in `models.ts` uses `z.number().int().min(1).max(21)`, which validates the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21). Tests should validate against the actual implementation, not the outdated `system_context.md` documentation.

### Why include TypeScript compilation verification?

TypeScript compilation errors can occur even if runtime tests pass. Including compilation verification ensures type definitions are correct at compile-time, not just runtime.

### Why test nested hierarchies?

The task hierarchy is designed to be 4 levels deep (Phase > Milestone > Task > Subtask). Testing the full depth ensures the recursive Zod schemas (using `z.lazy()`) work correctly and prevent regressions.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from research agents (5 parallel research tasks)
- [x] Existing test patterns analyzed and documented
- [x] Type definitions fully documented with line numbers
- [x] Zod schemas fully documented with validation rules
- [x] Critical gotchas identified (story_points discrepancy)
- [x] External research on Zod and TypeScript testing
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid

**Risk Mitigation**:
- Extending existing test file (low risk of breaking structure)
- Tests only (no production code changes)
- Can be implemented independently
- Easy to verify and iterate

**Known Risks**:
- **Type system complexity**: expectTypeOf() may have learning curve
  - Mitigation: Research documentation with examples provided
- **Coverage requirements**: Must maintain 100% coverage
  - Mitigation: Clear validation commands to check coverage
- **story_points discrepancy**: Documentation vs implementation mismatch
  - Mitigation: Clearly documented in PRP with correct values

---

**END OF PRP**
