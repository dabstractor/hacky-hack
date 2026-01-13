# PRP for Subtask P2.M2.T3.S1: Create delta analysis Zod schema

---

## Goal

**Feature Goal**: Add Zod schema definitions for delta analysis output to `src/core/models.ts` that validate structured PRD change analysis results produced by the Delta Analysis workflow.

**Deliverable**: Three new Zod schemas (`RequirementChangeSchema`, `DeltaAnalysisSchema`) with corresponding TypeScript interfaces added to `src/core/models.ts` after the `PRPArtifactSchema` definition.

**Success Definition**: The schemas compile without type errors, pass all validation tests, can be imported and used by the Delta Analysis workflow (P4.M1.T1), and follow the exact patterns established by existing schemas in the codebase.

## User Persona

**Target User**: Developer implementing the Delta Analysis workflow (P4.M1.T1) and delta session initialization (P3.M1.T2.S3).

**Use Case**: Before implementing delta PRD analysis, task patching logic, and delta session initialization, the developer needs type-safe schemas that validate the structured output from AI agents performing PRD diffing.

**User Journey**:

1. Developer reads existing delta analysis code and sees `DELTA_PRD_PROMPT` expects structured output
2. Developer realizes no validation schema exists for delta analysis results
3. Developer uses the new schemas to validate AI agent output in the Delta Analysis workflow
4. Delta session initialization uses the validated output for task patching

**Pain Points Addressed**:

- **No runtime validation**: Delta analysis output currently has no type safety
- **Unclear structure**: The contract definition mentions `RequirementChange` and `DeltaAnalysisSchema` but they don't exist
- **Inconsistent patterns**: Without these schemas, delta analysis would need ad-hoc validation

## Why

- **Foundation for Delta Workflows (P4.M1)**: Delta Analysis (P4.M1.T1) and task patching (P4.M1.T2) require these schemas to validate AI agent output
- **Type Safety for Critical Operations**: Delta sessions modify the task registry - invalid output could corrupt session state
- **Consistent with Existing Patterns**: All other agent-structured outputs have Zod schemas (BacklogSchema, PRPDocumentSchema)
- **Enables Groundswell Integration**: P2.M2.T3.S2 (Create delta analysis prompt generator) will use these schemas as `responseFormat`

## What

Create Zod schemas for delta analysis output with the following structure:

### Schema Specifications

**RequirementChange Interface**:

- `itemId: string` - Task/Milestone/Subtask ID (e.g., "P1.M2.T3.S1")
- `type: 'added' | 'modified' | 'removed'` - Change type enum
- `description: string` - Human-readable description of what changed
- `impact: string` - Explanation of how this change affects implementation

**RequirementChangeSchema**:

- `itemId`: z.string().min(1, 'Item ID is required')
- `type`: z.enum(['added', 'modified', 'removed'])
- `description`: z.string().min(1, 'Description is required')
- `impact`: z.string().min(1, 'Impact is required')

**DeltaAnalysis Interface**:

- `changes: RequirementChange[]` - Array of detected changes
- `patchInstructions: string` - Natural language instructions for task patching
- `taskIds: string[]` - Array of affected task IDs to re-execute

**DeltaAnalysisSchema**:

- `changes`: z.array(RequirementChangeSchema)
- `patchInstructions`: z.string().min(1, 'Patch instructions are required')
- `taskIds`: z.array(z.string())

### Success Criteria

- [ ] `RequirementChange` interface defined with all 4 fields: itemId, type, description, impact
- [ ] `RequirementChangeSchema` Zod schema validates RequirementChange interface
- [ ] `DeltaAnalysis` interface defined with all 3 fields: changes, patchInstructions, taskIds
- [ ] `DeltaAnalysisSchema` Zod schema validates DeltaAnalysis interface
- [ ] Schemas placed after `PRPArtifactSchema` in `src/core/models.ts`
- [ ] Follows existing Zod schema patterns (enums, validation messages, naming conventions)
- [ ] All TypeScript types compile without errors
- [ ] Vitest tests pass with 100% coverage for new schemas

## All Needed Context

### Context Completeness Check

A developer who knows nothing about this codebase would have everything needed to implement this successfully. The research includes:

- Exact file locations and patterns to follow
- Existing schema examples with validation patterns
- Test framework setup and commands
- Naming conventions and code style
- Integration points and usage examples

### Documentation & References

```yaml
# MUST READ - Core schema file where changes are made
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains all existing Zod schemas - use as pattern reference
  pattern: Interface definition first, then Zod schema with z.ZodType<T>
  gotcha: Must use z.ZodType<T> for type-safe schemas that match interfaces
  section: Lines 1-1337 (complete file - all schema patterns)

# Pattern examples for enum schemas
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Shows correct enum schema pattern with StatusEnum
  section: Lines 78-85 (StatusEnum definition)
  critical: Use z.enum(['value1', 'value2']) for string unions

# Pattern examples for object schemas
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Shows correct object schema pattern with PRPArtifactSchema
  section: Lines 1257-1336 (PRPArtifact interface and schema)
  critical: Define interface first, then schema with z.ZodType<Interface>

# Pattern examples for array validation
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Shows z.array() pattern used in multiple schemas
  section: Lines 251, 321, 357, 521, 544 (array validation examples)
  pattern: z.array(SchemaType) for typed arrays

# Delta Analysis context
- file: /home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: Shows DELTA_PRD_PROMPT that will use this schema's output
  section: Full file - DELTA_PRD_PROMPT is exported constant
  critical: Understanding the delta analysis workflow that consumes this schema

# Delta session interface (extends these schemas)
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Shows DeltaSession interface that will use delta analysis output
  section: Lines 847-881 (DeltaSession interface definition)
  critical: The diffSummary field will eventually be replaced by structured DeltaAnalysis

# Zod library documentation
- url: https://zod.dev/?id=objects
  why: Object schema creation patterns
  critical: z.object() for creating object schemas

- url: https://zod.dev/?id=enums
  why: Enum schema creation for 'type' field
  critical: z.enum() for string unions

- url: https://zod.dev/?id=arrays
  why: Array validation for changes and taskIds
  critical: z.array() for array schemas

- url: https://zod.dev/?id=type-inference
  why: Exporting inferred types from schemas
  critical: z.infer<typeof Schema> pattern

# Test patterns for schemas
- file: /home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts
  why: Shows exact test patterns for Zod schema validation
  section: Complete file - all schema tests
  pattern: Use safeParse() for validation tests, check success boolean
```

### Current Codebase Tree (relevant section)

```
src/
├── core/
│   ├── models.ts              # MODIFY - Add delta schemas after PRPArtifactSchema
│   └── session-utils.ts       # REFERENCE - Delta analysis usage context
├── agents/
│   └── prompts.ts             # REFERENCE - DELTA_PRD_PROMPT context
tests/
├── unit/
│   └── core/
│       └── models.test.ts     # MODIFY - Add delta schema tests
└── integration/
    └── architect-agent.test.ts  # REFERENCE - Schema validation integration test pattern
```

### Desired Codebase Tree with Files to be Added

```
src/
└── core/
    └── models.ts              # MODIFY - Add RequirementChange, RequirementChangeSchema,
                               #         DeltaAnalysis, DeltaAnalysisSchema
                               #         (after PRPArtifactSchema at line 1336)

tests/
└── unit/
    └── core/
        └── models.test.ts     # MODIFY - Add test suites for RequirementChangeSchema
                               #         and DeltaAnalysisSchema
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Zod schema definitions must use z.ZodType<Interface> pattern
// Example from PRPArtifactSchema (lines 1326-1336):
export const PRPArtifactSchema: z.ZodType<PRPArtifact> = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  prpPath: z.string().min(1, 'PRP path is required'),
  status: z.union([
    z.literal('Generated'),
    z.literal('Executing'),
    z.literal('Completed'),
    z.literal('Failed'),
  ]),
  generatedAt: z.date(),
});

// GOTCHA: Use z.enum() for string unions, NOT type keyword
// CORRECT:
const typeEnum = z.enum(['added', 'modified', 'removed']);
// WRONG:
const typeEnum = z.enum<...>(); // Don't use generic syntax

// GOTCHA: Array validation requires z.array() with schema type
// CORRECT:
z.array(RequirementChangeSchema)
// WRONG:
z.array() // No schema = untyped array

// PATTERN: Always provide helpful error messages
// CORRECT:
z.string().min(1, 'Item ID is required')
// LESS HELPFUL:
z.string().min(1)

// PATTERN: Define interface BEFORE schema (top to bottom reading)
// CORRECT ORDER:
// 1. export interface RequirementChange { ... }
// 2. export const RequirementChangeSchema: z.ZodType<RequirementChange> = z.object({ ... })

// CRITICAL: String fields with min(1) reject empty strings
z.string().min(1, 'Description is required')

// CRITICAL: Arrays can be empty (no min() unless required)
z.array(z.string()) // Allows empty array []
```

## Implementation Blueprint

### Data Models and Structure

Create TypeScript interfaces and Zod schemas for delta analysis output:

```typescript
// RequirementChange interface - single detected change
export interface RequirementChange {
  readonly itemId: string; // Task ID (e.g., "P1.M2.T3.S1")
  readonly type: 'added' | 'modified' | 'removed';
  readonly description: string; // Human-readable change description
  readonly impact: string; // Implementation impact explanation
}

// RequirementChangeSchema - validates RequirementChange
export const RequirementChangeSchema: z.ZodType<RequirementChange> = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  type: z.enum(['added', 'modified', 'removed']),
  description: z.string().min(1, 'Description is required'),
  impact: z.string().min(1, 'Impact is required'),
});

// DeltaAnalysis interface - complete delta analysis result
export interface DeltaAnalysis {
  readonly changes: RequirementChange[]; // All detected changes
  readonly patchInstructions: string; // Task patching instructions
  readonly taskIds: string[]; // Affected task IDs
}

// DeltaAnalysisSchema - validates DeltaAnalysis
export const DeltaAnalysisSchema: z.ZodType<DeltaAnalysis> = z.object({
  changes: z.array(RequirementChangeSchema),
  patchInstructions: z.string().min(1, 'Patch instructions are required'),
  taskIds: z.array(z.string()),
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD RequirementChange interface to src/core/models.ts
  - IMPLEMENT: RequirementChange interface with 4 readonly fields
  - FIELD 1: itemId: string (task/subtask/milestone ID)
  - FIELD 2: type: 'added' | 'modified' | 'removed' (enum literal union)
  - FIELD 3: description: string (change description)
  - FIELD 4: impact: string (implementation impact)
  - FOLLOW pattern: PRPArtifact interface (lines 1257-1303)
  - NAMING: PascalCase for interface, camelCase for fields
  - PLACEMENT: After PRPArtifact interface (after line 1303)
  - DOCUMENTATION: Add JSDoc comments matching existing style

Task 2: ADD RequirementChangeSchema to src/core/models.ts
  - IMPLEMENT: Zod schema for RequirementChange validation
  - FIELD 1: itemId using z.string().min(1, 'Item ID is required')
  - FIELD 2: type using z.enum(['added', 'modified', 'removed'])
  - FIELD 3: description using z.string().min(1, 'Description is required')
  - FIELD 4: impact using z.string().min(1, 'Impact is required')
  - FOLLOW pattern: PRPArtifactSchema (lines 1326-1336)
  - NAMING: PascalCase + "Schema" suffix
  - PLACEMENT: Immediately after RequirementChange interface
  - ANNOTATION: z.ZodType<RequirementChange> for type safety

Task 3: ADD DeltaAnalysis interface to src/core/models.ts
  - IMPLEMENT: DeltaAnalysis interface with 3 readonly fields
  - FIELD 1: changes: RequirementChange[] (array of detected changes)
  - FIELD 2: patchInstructions: string (natural language task patching guide)
  - FIELD 3: taskIds: string[] (affected task IDs for re-execution)
  - FOLLOW pattern: PRPArtifact interface (lines 1257-1303)
  - NAMING: PascalCase for interface, camelCase for fields
  - PLACEMENT: After RequirementChangeSchema
  - DOCUMENTATION: Add JSDoc comments explaining delta analysis purpose

Task 4: ADD DeltaAnalysisSchema to src/core/models.ts
  - IMPLEMENT: Zod schema for DeltaAnalysis validation
  - FIELD 1: changes using z.array(RequirementChangeSchema)
  - FIELD 2: patchInstructions using z.string().min(1, 'Patch instructions are required')
  - FIELD 3: taskIds using z.array(z.string()) (allows empty array)
  - FOLLOW pattern: PRPArtifactSchema (lines 1326-1336)
  - NAMING: PascalCase + "Schema" suffix
  - PLACEMENT: Immediately after DeltaAnalysis interface
  - ANNOTATION: z.ZodType<DeltaAnalysis> for type safety

Task 5: EXPORT new types from src/core/models.ts
  - VERIFY: All 4 new exports are present (RequirementChange, RequirementChangeSchema, DeltaAnalysis, DeltaAnalysisSchema)
  - PATTERN: Export at interface/schema definition (not separate export block)
  - CONSISTENCY: Match existing export style (interfaces and schemas exported inline)

Task 6: ADD tests for RequirementChangeSchema to tests/unit/core/models.test.ts
  - IMPLEMENT: describe block for RequirementChangeSchema
  - TEST 1: Valid RequirementChange with all fields passes
  - TEST 2: Valid enum values ('added', 'modified', 'removed') accepted
  - TEST 3: Invalid enum value rejected
  - TEST 4: Empty itemId rejected (min(1) validation)
  - TEST 5: Empty description rejected (min(1) validation)
  - TEST 6: Empty impact rejected (min(1) validation)
  - FOLLOW pattern: StatusEnum tests (lines 13-40 in models.test.ts)
  - NAMING: describe('RequirementChangeSchema', () => { ... })
  - ASSERTIONS: Use safeParse() and check result.success boolean

Task 7: ADD tests for DeltaAnalysisSchema to tests/unit/core/models.test.ts
  - IMPLEMENT: describe block for DeltaAnalysisSchema
  - TEST 1: Valid DeltaAnalysis with empty changes array passes
  - TEST 2: Valid DeltaAnalysis with multiple changes passes
  - TEST 3: Valid DeltaAnalysis with empty taskIds passes
  - TEST 4: Invalid change in changes array rejected
  - TEST 5: Empty patchInstructions rejected (min(1) validation)
  - FOLLOW pattern: SubtaskSchema tests (lines 93-180 in models.test.ts)
  - NAMING: describe('DeltaAnalysisSchema', () => { ... })
  - ASSERTIONS: Use safeParse() and check result.success boolean
```

### Implementation Patterns & Key Details

````typescript
// ============================================================
// INTERFACE PATTERN - Define first, with comprehensive JSDoc
// ============================================================

/**
 * Represents a single detected change in the PRD delta analysis
 *
 * @remarks
 * RequirementChange captures individual differences between old and new
 * PRD versions. Each change is categorized as added, modified, or removed,
 * with descriptions of what changed and how it impacts implementation.
 *
 * Used by the Delta Analysis workflow to communicate PRD differences to
 * the task patching logic.
 *
 * @see {@link ../../plan/001_14b9dc2a33c7/prd_snapshot.md#43-the-delta-workflow | PRD: Delta Workflow}
 *
 * @example
 * ```typescript
 * import { RequirementChange } from './core/models.js';
 *
 * const change: RequirementChange = {
 *   itemId: 'P1.M2.T3.S1',
 *   type: 'modified',
 *   description: 'Added validation for negative numbers',
 *   impact: 'Update implementation to reject negative story_points values'
 * };
 * ```
 */
export interface RequirementChange {
  /**
   * Task, milestone, or subtask ID that changed
   *
   * @format P{phase}.M{milestone}.T{task}.S{subtask} (or shorter)
   * @example 'P1.M2.T3.S1' for a subtask, 'P2.M1' for a milestone
   */
  readonly itemId: string;

  /**
   * Type of change detected
   *
   * @remarks
   * - 'added': New requirement that didn't exist in old PRD
   * - 'modified': Existing requirement with changed content
   * - 'removed': Requirement that exists in old PRD but not new PRD
   */
  readonly type: 'added' | 'modified' | 'removed';

  /**
   * Human-readable description of what changed
   *
   * @remarks
   * Explains the specific difference between old and new PRD versions.
   * Should be detailed enough for a developer to understand the change.
   *
   * @example "Added field: maxRetries with default value of 3"
   */
  readonly description: string;

  /**
   * Explanation of implementation impact
   *
   * @remarks
   * Describes how this change affects the codebase and what actions
   * are needed. Used by the task patching logic to determine re-execution.
   *
   * @example "Update createTask() to validate maxRetries parameter"
   */
  readonly impact: string;
}

// ============================================================
// SCHEMA PATTERN - z.ZodType<Interface> for type safety
// ============================================================

/**
 * Zod schema for RequirementChange validation
 *
 * @remarks
 * Validates RequirementChange objects with all field constraints.
 * Ensures type is one of the three valid enum values and that
 * string fields are non-empty.
 *
 * @example
 * ```typescript
 * import { RequirementChangeSchema } from './core/models.js';
 *
 * const result = RequirementChangeSchema.safeParse({
 *   itemId: 'P1.M2.T3.S1',
 *   type: 'modified',
 *   description: 'Added validation',
 *   impact: 'Update implementation'
 * });
 * // result.success === true
 * ```
 */
export const RequirementChangeSchema: z.ZodType<RequirementChange> = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  type: z.enum(['added', 'modified', 'removed']),
  description: z.string().min(1, 'Description is required'),
  impact: z.string().min(1, 'Impact is required'),
});

// ============================================================
// COMPOSITE INTERFACE PATTERN - Arrays of nested interfaces
// ============================================================

/**
 * Complete delta analysis result from PRD comparison
 *
 * @remarks
 * DeltaAnalysis represents the structured output of the Delta Analysis
 * workflow (P4.M1.T1). Contains all detected changes, natural language
 * instructions for task patching, and the list of task IDs that need
 * to be re-executed.
 *
 * This structure enables type-safe validation of AI agent output when
 * performing PRD diffing, ensuring that delta sessions have reliable
 * change data for task patching decisions.
 *
 * @see {@link ../../../PRD.md#43-the-delta-workflow-change-management | PRD: Delta Workflow}
 *
 * @example
 * ```typescript
 * import { DeltaAnalysis, RequirementChange } from './core/models.js';
 *
 * const analysis: DeltaAnalysis = {
 *   changes: [
 *     {
 *       itemId: 'P1.M2.T3.S1',
 *       type: 'modified',
 *       description: 'Added validation',
 *       impact: 'Update implementation'
 *     }
 *   ],
 *   patchInstructions: 'Re-execute P1.M2.T3.S1 to apply validation changes',
 *   taskIds: ['P1.M2.T3.S1']
 * };
 * ```
 */
export interface DeltaAnalysis {
  /**
   * Array of all detected changes between PRD versions
   *
   * @remarks
   * Contains RequirementChange objects for each added, modified, or
   * removed requirement. Empty array if no changes detected.
   */
  readonly changes: RequirementChange[];

  /**
   * Natural language instructions for task patching
   *
   * @remarks
   * Human-readable guide for the task patching logic (P4.M1.T2).
   * Explains which tasks need re-execution, which can be reused,
   * and any special handling required for the delta.
   *
   * @example "Re-execute P1.M2.T3.S1. P1.M2.T1 can be reused from parent session."
   */
  readonly patchInstructions: string;

  /**
   * Task IDs that need to be re-executed
   *
   * @remarks
   * List of task/subtask IDs affected by PRD changes. The Task
   * Orchestrator uses this list to determine which work items
   * need to run in the delta session.
   *
   * Empty array if no tasks are affected (rare - delta session
   * wouldn't be created if no changes).
   */
  readonly taskIds: string[];
}

// ============================================================
// COMPOSITE SCHEMA PATTERN - z.array() for nested validation
// ============================================================

/**
 * Zod schema for DeltaAnalysis validation
 *
 * @remarks
 * Validates DeltaAnalysis objects including nested RequirementChange
 * array validation. Ensures patchInstructions is non-empty and that
 * all changes in the array conform to RequirementChangeSchema.
 *
 * @example
 * ```typescript
 * import { DeltaAnalysisSchema } from './core/models.js';
 *
 * const result = DeltaAnalysisSchema.safeParse({
 *   changes: [],
 *   patchInstructions: 'No changes detected',
 *   taskIds: []
 * });
 * // result.success === true
 * ```
 */
export const DeltaAnalysisSchema: z.ZodType<DeltaAnalysis> = z.object({
  changes: z.array(RequirementChangeSchema),
  patchInstructions: z.string().min(1, 'Patch instructions are required'),
  taskIds: z.array(z.string()),
});

// ============================================================
// GOTCHA: Array validation patterns
// ============================================================

// CORRECT: Typed array with schema validation
z.array(RequirementChangeSchema); // Validates each element

// WRONG: Untyped array (no element validation)
z.array(z.any()); // Avoid - no type safety

// GOTCHA: Empty arrays are valid unless min() is specified
z.array(z.string()); // Allows [] (empty array)
z.array(z.string()).min(1); // Requires at least 1 element

// For taskIds: Empty array is valid (no tasks affected)
z.array(z.string());

// ============================================================
// GOTCHA: Enum patterns for literal unions
// ============================================================

// CORRECT: Use z.enum() for string unions
z.enum(['added', 'modified', 'removed']);

// WRONG: Don't use union of literals for simple string enums
z.union([z.literal('added'), z.literal('modified'), z.literal('removed')]); // Verbose - use z.enum() instead

// EXCEPTION: Use union of literals for mixed-type or specific values
z.union([z.literal(1), z.literal(2), z.literal(3)]); // Numbers
````

### Integration Points

```yaml
MODELS:
  - file: src/core/models.ts
  - add after: Line 1336 (end of PRPArtifactSchema)
  - pattern: 'Add JSDoc comments, interface definition, then schema definition'
  - order: RequirementChange (interface + schema), DeltaAnalysis (interface + schema)
  - preserve: All existing exports and imports

TESTS:
  - file: tests/unit/core/models.test.ts
  - add after: Existing schema tests (end of file)
  - pattern: 'Add describe() blocks for each new schema'
  - coverage: 100% for new schemas (enum values, validation, edge cases)

EXPORTS:
  - add to: src/core/models.ts (inline exports)
  - export: RequirementChange, RequirementChangeSchema, DeltaAnalysis, DeltaAnalysisSchema
  - pattern: 'Export at definition site (not separate export statement)'

DELTA_WORKFLOW:
  - consumer: P4.M1.T1 (Delta Analysis workflow)
  - usage: Validate AI agent output as DeltaAnalysis
  - pattern: 'const validation = DeltaAnalysisSchema.safeParse(agentResult)'
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npx tsc --noEmit                    # TypeScript type checking
npm run lint                        # ESLint with auto-fix
npm run format                      # Prettier formatting

# Target-specific checks (run after completing models.ts changes)
npx tsc --noEmit src/core/models.ts
npm run lint -- src/core/models.ts
npm run format -- --write src/core/models.ts

# Expected: Zero errors. If errors exist:
# 1. Read error output carefully
# 2. Check JSDoc comment syntax (unclosed brackets, invalid tags)
# 3. Verify z.ZodType<Interface> pattern is correct
# 4. Ensure all imports are present (z from 'zod')
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test new schemas as they're created
npm test -- tests/unit/core/models.test.ts -t "RequirementChangeSchema"
npm test -- tests/unit/core/models.test.ts -t "DeltaAnalysisSchema"

# Full test suite for models
npm test -- tests/unit/core/models.test.ts

# Coverage validation
npm run test:coverage -- tests/unit/core/models.test.ts

# Expected: All tests pass with 100% coverage for new schemas
# If failing:
# 1. Check test assertions match schema validation rules
# 2. Verify safeParse() usage (returns {success, data, error})
# 3. Ensure test data is valid (min(1) requires non-empty strings)
```

### Level 3: Integration Testing (System Validation)

```bash
# Test schema imports and exports
cat > /tmp/schema-import-test.ts << 'EOF'
import {
  RequirementChange,
  RequirementChangeSchema,
  DeltaAnalysis,
  DeltaAnalysisSchema
} from './src/core/models.js';

// Test 1: Valid RequirementChange
const validChange: RequirementChange = {
  itemId: 'P1.M2.T3.S1',
  type: 'modified',
  description: 'Added validation for negative numbers',
  impact: 'Update implementation to reject negative story_points'
};
console.log('Test 1 - Valid change:', RequirementChangeSchema.safeParse(validChange).success);

// Test 2: Valid DeltaAnalysis
const validAnalysis: DeltaAnalysis = {
  changes: [validChange],
  patchInstructions: 'Re-execute P1.M2.T3.S1',
  taskIds: ['P1.M2.T3.S1']
};
console.log('Test 2 - Valid analysis:', DeltaAnalysisSchema.safeParse(validAnalysis).success);

// Test 3: Type inference
type ChangeType = z.infer<typeof RequirementChangeSchema>;
console.log('Test 3 - Type inference works:', true);

console.log('All integration tests passed!');
EOF

npx tsx /tmp/schema-import-test.ts

# Test schema with invalid data (should fail validation)
cat > /tmp/schema-validation-test.ts << 'EOF'
import { RequirementChangeSchema, DeltaAnalysisSchema } from './src/core/models.js';

// Test 1: Invalid enum value
const invalidEnum = { itemId: 'P1.M2.T3.S1', type: 'invalid', description: 'Test', impact: 'Test' };
console.log('Test 1 - Invalid enum rejected:', !RequirementChangeSchema.safeParse(invalidEnum).success);

// Test 2: Empty description
const emptyDesc = { itemId: 'P1.M2.T3.S1', type: 'added', description: '', impact: 'Test' };
console.log('Test 2 - Empty description rejected:', !RequirementChangeSchema.safeParse(emptyDesc).success);

// Test 3: Invalid change in array
const invalidArray = {
  changes: [{ itemId: 'P1.M2.T3.S1', type: 'invalid', description: 'Test', impact: 'Test' }],
  patchInstructions: 'Test',
  taskIds: []
};
console.log('Test 3 - Invalid array element rejected:', !DeltaAnalysisSchema.safeParse(invalidArray).success);

console.log('All validation tests passed!');
EOF

npx tsx /tmp/schema-validation-test.ts

# Expected: All tests pass, invalid data is rejected
# If validation passes for invalid data:
# 1. Check schema definitions (z.enum() must have exact values)
# 2. Verify min(1) constraints are present
# 3. Ensure array elements are validated (z.array(Schema))
```

### Level 4: Domain-Specific Validation

```bash
# Test real-world delta analysis scenario
cat > /tmp/delta-scenario-test.ts << 'EOF'
import { RequirementChangeSchema, DeltaAnalysisSchema } from './src/core/models.js';

// Scenario: PRD was modified to add new feature and update existing task
const realWorldDelta = {
  changes: [
    {
      itemId: 'P5.M1.T1',
      type: 'added' as const,
      description: 'New feature: Production deployment pipeline',
      impact: 'Implement full deployment workflow with staging and production environments'
    },
    {
      itemId: 'P1.M2.T3.S1',
      type: 'modified' as const,
      description: 'Extended story_points range from 13 to 21',
      impact: 'Update validation in SubtaskSchema to allow values up to 21'
    },
    {
      itemId: 'P2.M3.T2',
      type: 'removed' as const,
      description: 'Removed deprecated parallel research feature',
      impact: 'Remove P2.M3.T2 and all subtasks from task registry'
    }
  ],
  patchInstructions: 'Execute P5.M1.T1 for new feature. Re-execute P1.M2.T3.S1 for schema update. P2.M3.T2 marked obsolete - no execution needed.',
  taskIds: ['P5.M1.T1', 'P1.M2.T3.S1', 'P2.M3.T2']
};

const result = DeltaAnalysisSchema.safeParse(realWorldDelta);
console.log('Real-world delta validation:', result.success);
if (result.success) {
  console.log('Changes detected:', result.data.changes.length);
  console.log('Tasks to re-execute:', result.data.taskIds.length);
  console.log('Scenario test passed!');
}
EOF

npx tsx /tmp/delta-scenario-test.ts

# Test edge cases
cat > /tmp/delta-edge-cases.ts << 'EOF'
import { DeltaAnalysisSchema, RequirementChangeSchema } from './src/core/models.js';

// Edge case 1: Empty changes (no PRD changes)
const noChanges = {
  changes: [],
  patchInstructions: 'No changes detected between PRD versions',
  taskIds: []
};
console.log('Edge case 1 - No changes:', DeltaAnalysisSchema.safeParse(noChanges).success);

// Edge case 2: All three change types present
const allTypes = {
  changes: [
    { itemId: 'P1', type: 'added' as const, description: 'A', impact: 'I' },
    { itemId: 'P2', type: 'modified' as const, description: 'M', impact: 'I' },
    { itemId: 'P3', type: 'removed' as const, description: 'R', impact: 'I' }
  ],
  patchInstructions: 'All change types present',
  taskIds: ['P1', 'P2', 'P3']
};
console.log('Edge case 2 - All types:', DeltaAnalysisSchema.safeParse(allTypes).success);

// Edge case 3: Single character strings (min(1) boundary)
const minStrings = { itemId: 'P', type: 'added' as const, description: 'A', impact: 'I' };
console.log('Edge case 3 - Min strings:', RequirementChangeSchema.safeParse(minStrings).success);

// Edge case 4: Empty string should fail
const emptyString = { itemId: '', type: 'added' as const, description: 'A', impact: 'I' };
console.log('Edge case 4 - Empty itemId rejected:', !RequirementChangeSchema.safeParse(emptyString).success);

console.log('All edge case tests completed!');
EOF

npx tsx /tmp/delta-edge-cases.ts

# Expected: All edge cases handled correctly
# Real-world delta validates
# Empty arrays are valid
# All three enum types work
# Boundary conditions (min(1)) work as expected
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/models.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npm run format -- --check`
- [ ] Coverage threshold met: `npm run test:coverage` (100% for new schemas)

### Feature Validation

- [ ] `RequirementChange` interface defined with 4 readonly fields
- [ ] `RequirementChangeSchema` validates RequirementChange interface
- [ ] `DeltaAnalysis` interface defined with 3 readonly fields
- [ ] `DeltaAnalysisSchema` validates DeltaAnalysis interface
- [ ] Enum validation works for 'added', 'modified', 'removed'
- [ ] Array validation works for changes and taskIds
- [ ] String validation with min(1) rejects empty strings
- [ ] Schemas placed after PRPArtifactSchema (line 1336+)
- [ ] All new types exported from src/core/models.ts

### Code Quality Validation

- [ ] Follows existing schema patterns (interface first, then z.ZodType<T>)
- [ ] JSDoc comments present for both interfaces and schemas
- [ ] Naming conventions match existing code (PascalCase for interfaces/schemas)
- [ ] Validation error messages are helpful and consistent
- [ ] No code duplication (reuses RequirementChangeSchema in DeltaAnalysisSchema)
- [ ] Type inference works correctly with z.infer<typeof Schema>

### Documentation & Deployment

- [ ] JSDoc @remarks sections explain purpose and usage
- [ ] JSDoc @example sections provide realistic usage examples
- [ ] JSDoc @see tags reference related documentation
- [ ] Field-level JSDoc comments explain format and constraints
- [ ] Integration points documented (Delta Analysis workflow usage)

---

## Anti-Patterns to Avoid

- **Don't** create separate export blocks - export at definition site like existing schemas
- **Don't** use `z.union([z.literal(...)])` for simple string enums - use `z.enum()`
- **Don't** skip JSDoc comments - all interfaces and schemas need comprehensive documentation
- **Don't** use `z.string()` without `.min(1)` for required string fields
- **Don't** validate arrays with `z.array()` - always include element schema: `z.array(SchemaType)`
- **Don't** forget the `readonly` modifier on interface fields
- **Don't** place schemas before interfaces - interfaces must come first
- **Don't** use `any` types - always use proper Zod validation
- **Don't** skip the `z.ZodType<Interface>` annotation - it's required for type safety
- **Don't** create schemas without corresponding TypeScript interfaces
