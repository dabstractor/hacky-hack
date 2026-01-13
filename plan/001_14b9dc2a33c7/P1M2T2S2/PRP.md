# Product Requirement Prompt (PRP): Create PRP Document Interfaces

**Work Item**: P1.M2.T2.S2 - Create PRP document interfaces
**Point Value**: 1 point
**Parent Task**: P1.M2.T2 - Define Session and PRP Models
**Parent Milestone**: P1.M2 - Milestone 1.2: Core Data Structures
**Parent Phase**: P1 - Phase 1: Foundation & Environment Setup

---

## Goal

**Feature Goal**: Add TypeScript interfaces and Zod schemas to `src/core/models.ts` that fully represent the PRP (Product Requirement Prompt) document structure defined in PROMPTS.md, enabling type-safe generation, validation, and execution of PRPs throughout the development pipeline.

**Deliverable**: Four new TypeScript interfaces (`ValidationGate`, `SuccessCriterion`, `PRPDocument`, `PRPArtifact`) with corresponding Zod schemas added to `src/core/models.ts` after the `DeltaSession` interface definition.

**Success Definition**: All PRP-related interfaces are properly typed with readonly properties, comprehensive JSDoc documentation, and corresponding Zod schemas that validate the complete PRP structure as defined in PROMPTS.md (lines 319-637). A manual test file verifies that all interfaces can be instantiated and type narrowing works correctly.

---

## Why

- **Foundation for PRP Generation**: These interfaces are required by P2.M2.T2 (Create PRP Generation Prompts) to type-safely generate PRP documents from Architect Agent output
- **Pipeline Execution Support**: P3.M3.T1 (PRP Execution Runtime) requires these interfaces to parse, validate, and execute PRPs during task implementation
- **Session Tracking**: The `PRPArtifact` interface enables tracking of PRP generation and execution status within session state
- **Type Safety**: Prevents runtime errors when processing PRP documents through the Groundswell agent system
- **Validation Consistency**: Zod schemas ensure PRP documents conform to the expected structure before execution

---

## What

Add four new TypeScript interfaces to `src/core/models.ts` that represent the complete PRP document structure:

### 1. ValidationGate Interface

Represents a single validation level from the 4-level progressive validation system.

**Fields**:

- `level`: `1 | 2 | 3 | 4` - The validation level (1=Syntax/Style, 2=Unit Tests, 3=Integration, 4=Manual/Creative)
- `description`: `string` - Human-readable description of what this level validates
- `command`: `string | null` - The bash command to run for this level (null for manual validation)
- `manual`: `boolean` - Whether this validation requires manual intervention

### 2. SuccessCriterion Interface

Represents a single success criterion checkbox from the "What" section.

**Fields**:

- `description`: `string` - The criterion description text (without the checkbox prefix)
- `satisfied`: `boolean` - Whether this criterion has been met

### 3. PRPDocument Interface

The complete PRP document structure with all required sections from PROMPTS.md.

**Fields**:

- `taskId`: `string` - The work item ID this PRP is for (e.g., "P1.M2.T2.S2")
- `objective`: `string` - The Feature Goal from the Goal section
- `context`: `string` - The complete "All Needed Context" section as markdown
- `implementationSteps`: `string[]` - Array of implementation task descriptions
- `validationGates`: `ValidationGate[]` - Array of 4 validation gates (one per level)
- `successCriteria`: `SuccessCriterion[]` - Array of success criteria checkboxes
- `references`: `string[]` - Array of reference URLs and file paths

### 4. PRPArtifact Interface

Metadata about a generated PRP document, used for tracking within session state.

**Fields**:

- `taskId`: `string` - The work item ID this PRP was generated for
- `prpPath`: `string` - Filesystem path to the generated PRP.md file
- `status`: `'Generated' | 'Executing' | 'Completed' | 'Failed'` - Current execution status
- `generatedAt`: `Date` - Timestamp when the PRP was generated

### Success Criteria

- [ ] All four interfaces added to `src/core/models.ts` with proper JSDoc documentation
- [ ] All properties use `readonly` modifier for immutability
- [ ] All four Zod schemas created with appropriate validation rules
- [ ] Manual test file created at `tests/manual/prp-types-test.ts` verifying interface instantiation
- [ ] All interfaces follow the naming and structural patterns from session interfaces (P1.M2.T2.S1)
- [ ] Zod schemas follow the naming pattern from task hierarchy (`XxxSchema`)

---

## All Needed Context

### Context Completeness Check

_Before implementing, validate: "If someone knew nothing about this codebase, would they have everything needed to implement these PRP interfaces successfully?"_

This PRP provides:

- Exact file location and insertion point for new interfaces
- Complete interface definitions with field types
- JSDoc pattern examples from existing code
- Zod schema patterns to follow
- Test file patterns to replicate
- All naming conventions and structural patterns

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: /home/dustin/projects/hacky-hack/PROMPTS.md
  why: Contains the complete PRP template structure (lines 319-637) that the interfaces must represent
  pattern: PRP template sections: Goal, Context, Implementation Blueprint, Validation Loop, Final Validation Checklist
  gotcha: The template uses YAML and markdown blocks - the interfaces capture the structured data portions only

- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains existing patterns for interfaces and Zod schemas; shows exact location where new interfaces should be added
  pattern: Lines 663-881 show SessionMetadata, SessionState, and DeltaSession interfaces - use this exact pattern
  gotcha: All properties must be `readonly`, use `string | null` not optional properties for nullable fields

- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Shows the Zod schema pattern used throughout the codebase (SubtaskSchema, TaskSchema, etc.)
  pattern: Schema naming is `XxxSchema`, uses `z.object()`, `z.array()`, `z.union()`, `z.literal()` for type discrimination
  gotcha: For recursive structures, use `z.lazy(() => OtherSchema)` pattern

- file: /home/dustin/projects/hacky-hack/tests/manual/session-types-test.ts
  why: Shows the exact test pattern to replicate for manual type verification
  pattern: Import with `.js` extension, create interface instances, test type narrowing
  gotcha: Use `@ts-expect-error` comments to verify TypeScript catches invalid types

- file: /home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts
  why: Shows comprehensive Zod schema testing patterns
  pattern: Test valid inputs, invalid inputs, edge cases; use `safeParse()` and check `success` boolean
  gotcha: The project requires 100% test coverage - all schemas must have tests

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M2T2S1/PRP.md
  why: Contains the complete implementation guide for session interfaces (P1.M2.T2.S1)
  pattern: Use the same JSDoc structure, export pattern, and file organization
  gotcha: Session interfaces don't have Zod schemas yet, but PRP interfaces should have them from the start

- docfile: /home/dustin/projects/hacky-hack/README.md
  why: Contains project overview and build commands for validation
  section: Development Setup
```

### Current Codebase Tree (relevant portions)

```bash
src/
├── core/
│   ├── models.ts          # ADD INTERFACES HERE (after line 881)
│   └── validation.ts      # Validation utilities (may be useful)
├── config/
│   ├── config.ts          # Environment configuration
│   └── types.ts           # Configuration types
├── utils/
│   └── task-utils.ts      # Task hierarchy utilities
tests/
├── unit/
│   └── core/
│       └── models.test.ts # ADD ZOD SCHEMA TESTS HERE
└── manual/
    ├── session-types-test.ts  # REFERENCE PATTERN
    └── models-type-test.ts    # TYPE TESTING EXAMPLES
```

### Desired Codebase Tree (files to be added)

```bash
src/
├── core/
│   └── models.ts          # MODIFY: Add ValidationGate, SuccessCriterion, PRPDocument, PRPArtifact interfaces + schemas
tests/
├── unit/
│   └── core/
│       └── models.test.ts # MODIFY: Add tests for new Zod schemas
└── manual/
    └── prp-types-test.ts  # CREATE: Manual type verification for PRP interfaces
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: All interface properties MUST be readonly
// The codebase enforces immutability - never use mutable properties

// CRITICAL: Use `string | null` for nullable fields, NOT optional properties
// BAD: command?: string
// GOOD: command: string | null

// CRITICAL: Zod schemas must use exact type validation
// For level field, use: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
// or simpler: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])

// CRITICAL: Status enum uses specific string literal types
// For status field, use: z.union(['Generated', 'Executing', 'Completed', 'Failed'])
// These align with task hierarchy Status type

// CRITICAL: Import paths MUST use `.js` extension for ESM
// import { SessionState } from '../core/models.js'  // CORRECT
// import { SessionState } from '../core/models'     // WRONG

// CRITICAL: JSDoc pattern from session interfaces (lines 663-881)
// Use @remarks for detailed explanations
// Use @see for cross-references
// Use @example for code samples

// CRITICAL: Test coverage must be 100%
// Run: npm run test:coverage
// All new code must have tests

// CRITICAL: 100% coverage is enforced by vitest.config.ts
// Missing test coverage will cause CI to fail
```

---

## Implementation Blueprint

### Data Models and Structure

Create four core TypeScript interfaces with corresponding Zod schemas:

```typescript
// 1. ValidationGate - Represents a single validation level
interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly command: string | null;
  readonly manual: boolean;
}

// 2. SuccessCriterion - Represents a success criterion checkbox
interface SuccessCriterion {
  readonly description: string;
  readonly satisfied: boolean;
}

// 3. PRPDocument - Complete PRP document structure
interface PRPDocument {
  readonly taskId: string;
  readonly objective: string;
  readonly context: string;
  readonly implementationSteps: string[];
  readonly validationGates: ValidationGate[];
  readonly successCriteria: SuccessCriterion[];
  readonly references: string[];
}

// 4. PRPArtifact - PRP generation metadata
interface PRPArtifact {
  readonly taskId: string;
  readonly prpPath: string;
  readonly status: 'Generated' | 'Executing' | 'Completed' | 'Failed';
  readonly generatedAt: Date;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: LOCATE INSERTION POINT in src/core/models.ts
  - FIND: Line 881 (end of DeltaSession interface)
  - VERIFY: DeltaSession closing brace is at line 881
  - PRESERVE: Module-level JSDoc at top of file
  - INSERT: New interfaces after DeltaSession, before any exports
  - PLACEMENT: Maintain the grouping: Task Hierarchy → Session → PRP

Task 2: CREATE ValidationGate interface and schema
  - IMPLEMENT: ValidationGate interface with 4 readonly properties
  - FOLLOW pattern: SessionMetadata interface (lines 663-716) for JSDoc style
  - NAMING: PascalCase interface, camelCase properties
  - FIELD TYPES:
    * level: union of literal numbers (1 | 2 | 3 | 4)
    * description: string
    * command: string | null (not optional)
    * manual: boolean
  - JSDOC: Add @remarks explaining the 4-level validation system
  - PLACEMENT: First new interface after DeltaSession

Task 3: CREATE ValidationGateSchema Zod schema
  - IMPLEMENT: Zod schema immediately after ValidationGate interface
  - FOLLOW pattern: SubtaskSchema, TaskSchema (use z.object, z.literal, z.union)
  - NAMING: ValidationGateSchema (matches interface name + "Schema")
  - VALIDATION:
    * level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    * description: z.string().min(1)
    * command: z.union([z.string(), z.null()]).nullable()
    * manual: z.boolean()
  - TYPE ANNOTATION: z.ZodType<ValidationGate>
  - PLACEMENT: Immediately after ValidationGate interface, before next interface

Task 4: CREATE SuccessCriterion interface and schema
  - IMPLEMENT: SuccessCriterion interface with 2 readonly properties
  - FOLLOW pattern: ValidationGate (JSDoc style, readonly properties)
  - NAMING: PascalCase interface, camelCase properties
  - FIELD TYPES:
    * description: string
    * satisfied: boolean
  - JSDOC: Add @remarks explaining checkbox representation
  - PLACEMENT: After ValidationGateSchema

Task 5: CREATE SuccessCriterionSchema Zod schema
  - IMPLEMENT: Zod schema immediately after SuccessCriterion interface
  - FOLLOW pattern: ValidationGateSchema
  - NAMING: SuccessCriterionSchema
  - VALIDATION:
    * description: z.string().min(1)
    * satisfied: z.boolean()
  - TYPE ANNOTATION: z.ZodType<SuccessCriterion>
  - PLACEMENT: Immediately after SuccessCriterion interface

Task 6: CREATE PRPDocument interface and schema
  - IMPLEMENT: PRPDocument interface with 7 readonly properties
  - FOLLOW pattern: SessionState interface (lines 762-807) - composition of other interfaces
  - NAMING: PascalCase interface, camelCase properties
  - FIELD TYPES:
    * taskId: string (matches task ID format from hierarchy)
    * objective: string
    * context: string (markdown content)
    * implementationSteps: string[] (array of task descriptions)
    * validationGates: ValidationGate[] (array of 4 gates)
    * successCriteria: SuccessCriterion[] (array of criteria)
    * references: string[] (array of URLs/paths)
  - JSDOC: Add @remarks referencing PROMPTS.md lines 319-637
  - PLACEMENT: After SuccessCriterionSchema

Task 7: CREATE PRPDocumentSchema Zod schema
  - IMPLEMENT: Zod schema immediately after PRPDocument interface
  - FOLLOW pattern: TaskSchema (composition of other schemas)
  - NAMING: PRPDocumentSchema
  - VALIDATION:
    * taskId: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/) or similar
    * objective: z.string().min(1)
    * context: z.string().min(1)
    * implementationSteps: z.array(z.string().min(1))
    * validationGates: z.array(ValidationGateSchema)
    * successCriteria: z.array(SuccessCriterionSchema)
    * references: z.array(z.string())
  - TYPE ANNOTATION: z.ZodType<PRPDocument>
  - PLACEMENT: Immediately after PRPDocument interface

Task 8: CREATE PRPArtifact interface and schema
  - IMPLEMENT: PRPArtifact interface with 4 readonly properties
  - FOLLOW pattern: SessionMetadata (simple metadata interface)
  - NAMING: PascalCase interface, camelCase properties
  - FIELD TYPES:
    * taskId: string
    * prpPath: string (filesystem path)
    * status: union of 'Generated' | 'Executing' | 'Completed' | 'Failed'
    * generatedAt: Date
  - JSDOC: Add @remarks explaining PRP lifecycle tracking
  - PLACEMENT: After PRPDocumentSchema (last interface)

Task 9: CREATE PRPArtifactSchema Zod schema
  - IMPLEMENT: Zod schema immediately after PRPArtifact interface
  - FOLLOW pattern: ValidationGateSchema (union type for status)
  - NAMING: PRPArtifactSchema
  - VALIDATION:
    * taskId: z.string()
    * prpPath: z.string()
    * status: z.union(['Generated', 'Executing', 'Completed', 'Failed'])
    * generatedAt: z.date()
  - TYPE ANNOTATION: z.ZodType<PRPArtifact>
  - PLACEMENT: Immediately after PRPArtifact interface

Task 10: CREATE tests/manual/prp-types-test.ts
  - IMPLEMENT: Manual type verification file following session-types-test.ts pattern
  - FOLLOW pattern: tests/manual/session-types-test.ts exactly
  - IMPORT: import { ValidationGate, SuccessCriterion, PRPDocument, PRPArtifact } from '../../src/core/models.js'
  - TEST CASES:
    * Create ValidationGate instance for each level (1, 2, 3, 4)
    * Create SuccessCriterion instances (satisfied and unsatisfied)
    * Create PRPDocument instance with all fields populated
    * Create PRPArtifact instance for each status type
    * Test type narrowing on status field
    * Use @ts-expect-error for invalid type tests
  - NAMING: prp-types-test.ts
  - PLACEMENT: tests/manual/prp-types-test.ts

Task 11: ADD Zod schema tests to tests/unit/core/models.test.ts
  - IMPLEMENT: Test suites for all four new schemas
  - FOLLOW pattern: Existing describe blocks for SubtaskSchema, TaskSchema, etc.
  - TEST CASES per schema:
    * Valid input parsing (happy path)
    * Invalid field types (error cases)
    * Required field validation (missing fields)
    * Edge cases (empty arrays, boundary values)
  - NAMING: describe('ValidationGateSchema', ...), describe('SuccessCriterionSchema', ...)
  - PLACEMENT: Add to end of tests/unit/core/models.test.ts
```

### Implementation Patterns & Key Details

````typescript
// PATTERN: Interface definition (from SessionMetadata, lines 663-716)
/**
 * Represents a single validation level in the PRP validation system
 *
 * @remarks
 * PRPs use a 4-level progressive validation system:
 * - Level 1: Syntax & Style (linting, type checking)
 * - Level 2: Unit Tests (component validation)
 * - Level 3: Integration Testing (system validation)
 * - Level 4: Manual/Creative Validation (end-to-end workflows)
 *
 * Each level must pass before proceeding to the next.
 *
 * @see {@link https://github.com/anthropics/claude-code/blob/main/PRP-TEMPLATE.md | PRP Template}
 * @see {@link ../../PROMPTS.md | PROMPTS.md Validation Loop section}
 *
 * @example
 * ```typescript
 * const level1Gate: ValidationGate = {
 *   level: 1,
 *   description: 'Syntax & Style validation',
 *   command: 'ruff check src/ --fix && mypy src/',
 *   manual: false,
 * };
 * ```
 */
export interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly command: string | null;
  readonly manual: boolean;
}

// PATTERN: Zod schema definition (from SubtaskSchema, ~line 454)
export const ValidationGateSchema: z.ZodType<ValidationGate> = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  description: z.string().min(1, 'Description is required'),
  command: z.string().nullable(),
  manual: z.boolean(),
});

// GOTCHA: For status field in PRPArtifact, use string literal union
// This aligns with the Status type pattern from task hierarchy
export const PRPStatusEnum = z.union([
  z.literal('Generated'),
  z.literal('Executing'),
  z.literal('Completed'),
  z.literal('Failed'),
]);

// PATTERN: Composed schema (from TaskSchema)
export const PRPDocumentSchema: z.ZodType<PRPDocument> = z.object({
  taskId: z.string().min(1),
  objective: z.string().min(1),
  context: z.string().min(1),
  implementationSteps: z.array(z.string().min(1)),
  validationGates: z.array(ValidationGateSchema),
  successCriteria: z.array(SuccessCriterionSchema),
  references: z.array(z.string()),
});

// CRITICAL: Date validation in Zod requires z.date()
// NOT z.string() - Date is a built-in JavaScript type
generatedAt: z.date();

// CRITICAL: Array types should not be optional
// Use empty arrays for "no items" case
// BAD: implementationSteps?: string[]
// GOOD: implementationSteps: string[]
````

### Integration Points

```yaml
MODELS_TS:
  - add to: src/core/models.ts (after line 881)
  - pattern: 'Insert after DeltaSession, maintain existing import statements'
  - preserve: 'All existing interfaces and schemas'
  - no_changes_to: 'Task hierarchy interfaces (Subtask through Backlog), Session interfaces'

TYPE_IMPORTS:
  - future: 'P2.M2.T2 will import PRPDocument for PRP generation'
  - future: 'P3.M3.T1 will import PRPDocument and PRPArtifact for execution'

TEST_FILES:
  - create: tests/manual/prp-types-test.ts
  - modify: tests/unit/core/models.test.ts (add new describe blocks)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after completing implementation - fix before proceeding
npm run lint              # ESLint check
npm run format           # Prettier format
npm run type-check       # TypeScript compiler check (tsc --noEmit)

# Or run all at once:
npm run validate         # Runs lint, format, and type-check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new Zod schemas
npm test -- tests/unit/core/models.test.ts

# Run with coverage to verify 100% coverage
npm run test:coverage

# Expected: All tests pass, 100% coverage maintained. If failing:
# 1. Read test output carefully
# 2. Check schema validation rules
# 3. Fix implementation or tests (whichever is wrong)
# 4. Re-run until all pass
```

### Level 3: Manual Type Verification (System Validation)

```bash
# Run the manual type verification script
npx tsx tests/manual/prp-types-test.ts

# Or compile and run:
npm run build
node tests/dist/prp-types-test.js

# Expected output shows:
# - ValidationGate instances created for levels 1-4
# - SuccessCriterion instances created
# - PRPDocument instance created with all fields
# - PRPArtifact instances created for each status
# - Type narrowing working correctly

# If TypeScript errors occur:
# 1. Check interface property types
# 2. Verify readonly modifiers are present
# 3. Ensure no optional properties where nullable is needed
```

### Level 4: Integration Verification (Creative & Domain-Specific)

```bash
# Verify the interfaces can be imported in ESM format
node --input-type=module << 'EOF'
import { ValidationGate, SuccessCriterion, PRPDocument, PRPArtifact } from './src/core/models.js';

// Create instances to verify runtime usability
const gate: ValidationGate = {
  level: 1,
  description: 'Test',
  command: 'echo test',
  manual: false,
};

console.log('ESM import successful:', gate.level);
EOF

# Verify Zod schemas can parse valid data
node --input-type=module << 'EOF'
import { ValidationGateSchema } from './src/core/models.js';

const result = ValidationGateSchema.safeParse({
  level: 1,
  description: 'Test',
  command: null,
  manual: false,
});

console.log('Zod validation:', result.success ? 'PASS' : 'FAIL');
EOF

# Verify the schema file is syntactically valid
node -c src/core/models.ts 2>&1 || echo "Note: TypeScript files will show parse errors, this is expected"

# Expected: ESM imports work, Zod schemas validate correctly, no runtime errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] `npm run validate` passes with zero errors
- [ ] `npm test -- tests/unit/core/models.test.ts` passes all schema tests
- [ ] `npx tsx tests/manual/prp-types-test.ts` runs without errors
- [ ] No TypeScript errors in `src/core/models.ts`

### Feature Validation

- [ ] All four interfaces defined: ValidationGate, SuccessCriterion, PRPDocument, PRPArtifact
- [ ] All four Zod schemas defined: ValidationGateSchema, SuccessCriterionSchema, PRPDocumentSchema, PRPArtifactSchema
- [ ] All properties are `readonly`
- [ ] Nullable fields use `string | null` not optional properties
- [ ] JSDoc comments present on all interfaces
- [ ] Interfaces placed after DeltaSession (after line 881)

### Code Quality Validation

- [ ] Follows session interface JSDoc pattern (@remarks, @see, @example)
- [ ] Schema naming follows convention (XxxSchema)
- [ ] Schema type annotations use `z.ZodType<InterfaceName>`
- [ ] Level field uses literal union (1 | 2 | 3 | 4)
- [ ] Status field uses string literal union matching task conventions
- [ ] Manual test file created at `tests/manual/prp-types-test.ts`

### Documentation & Deployment

- [ ] JSDoc cross-references PROMPTS.md with @see tags
- [ ] @example blocks show realistic usage
- [ ] @remarks explain the purpose and constraints
- [ ] File can be imported with `.js` extension for ESM

---

## Anti-Patterns to Avoid

- ❌ Don't use optional properties (`prop?: type`) - use `prop: type | null` for nullable fields
- ❌ Don't forget the `readonly` modifier on interface properties
- ❌ Don't place Zod schemas before their corresponding interfaces (interface first, then schema)
- ❌ Don't use `any` type - use proper union types or specific types
- ❌ Don't skip JSDoc comments - all interfaces need comprehensive documentation
- ❌ Don't forget to export interfaces and schemas with `export` keyword
- ❌ Don't use mutable arrays - all arrays are readonly properties, contents can be mutated but not the reference
- ❌ Don't use `z.string()` for dates - use `z.date()` for Date fields
- ❌ Don't skip the manual test file - it provides verification that interfaces work correctly
- ❌ Don't forget to add tests to `tests/unit/core/models.test.ts` - 100% coverage is required
