# Product Requirement Prompt (PRP): P2.M2.T4.S1 - Create bug report Zod schema

---

## Goal

**Feature Goal**: Add three Zod schemas (`BugSeverityEnum`, `BugSchema`, `TestResultsSchema`) to `src/core/models.ts` to support type-safe QA agent bug reporting and test results validation.

**Deliverable**: Three new Zod schemas with corresponding TypeScript interfaces added to `src/core/models.ts`, with comprehensive test coverage in `tests/unit/core/models.test.ts`.

**Success Definition**:

- `BugSeverityEnum` exports a Zod enum with four severity levels: `'critical'`, `'major'`, `'minor'`, `'cosmetic'`
- `BugSchema` validates bug report objects with all required fields (id, severity, title, description, reproduction, location)
- `TestResultsSchema` validates test results objects with hasBugs boolean, bugs array, summary string, and recommendations string array
- All three schemas are exported and imported in test file
- All tests pass with 100% coverage for new schemas

## User Persona

**Target User**: QA Agent (adversarial persona) and bug fix sub-pipeline workflow

**Use Case**: The QA Agent performs creative end-to-end testing after implementation completion and generates structured bug reports that can be parsed and processed by the bug fix sub-pipeline.

**User Journey**:

1. QA Agent receives PRD and completed tasks as input
2. Performs comprehensive testing across happy paths, edge cases, adversarial scenarios
3. Generates structured bug report using `BugSchema` format
4. Bug fix sub-pipeline parses report using `TestResultsSchema` to determine if bugs exist
5. If `hasBugs === true`, enters fix cycle; if `hasBugs === false`, signals success

**Pain Points Addressed**:

- Unstructured bug reports are difficult to parse and process programmatically
- No type safety for bug report generation
- No validation that bug reports contain all required fields
- Missing structured output format for LLM-generated bug reports

## Why

- **Business Value**: Enables automated bug detection and fix cycle in the PRP Pipeline, reducing manual QA overhead
- **Integration**: Required for P4.M3.T1 (QA Bug Hunt Workflow) and P4.M3.T2 (Fix Cycle)
- **Problems Solved**: Provides structured, validated output format for QA Agent's bug reports; enables type-safe bug report processing; supports the "file absence = success" pattern from BUG_HUNT_PROMPT

## What

Add three Zod schemas to `src/core/models.ts`:

1. **BugSeverityEnum**: Zod enum with `'critical'`, `'major'`, `'minor'`, `'cosmetic'`
2. **BugSchema**: Zod object schema with:
   - `id`: string (unique bug identifier)
   - `severity`: BugSeverityEnum
   - `title`: string (bug title)
   - `description`: string (detailed description)
   - `reproduction`: string (steps to reproduce)
   - `location`: string | undefined (file/function location, optional)
3. **TestResultsSchema**: Zod object schema with:
   - `hasBugs`: boolean (true if critical/major bugs found)
   - `bugs`: array of BugSchema (all bugs found)
   - `summary`: string (overall testing summary)
   - `recommendations`: array of strings (fix recommendations)

### Success Criteria

- [ ] `BugSeverityEnum` validates the four severity levels
- [ ] `BugSchema` parses valid bug objects with all required fields
- [ ] `BugSchema` accepts bug objects with optional `location` field
- [ ] `BugSchema` rejects bug objects missing required fields
- [ ] `BugSchema` rejects bug objects with invalid severity
- [ ] `TestResultsSchema` parses valid test results objects
- [ ] `TestResultsSchema` accepts test results with empty bugs array
- [ ] `TestResultsSchema` rejects test results missing required fields
- [ ] All new schemas are exported from `src/core/models.ts`
- [ ] All new schemas are imported and tested in `tests/unit/core/models.test.ts`
- [ ] All tests pass: `npm test`

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with the codebase would have everything needed because:

- Exact file paths and line numbers are provided for reference patterns
- Complete code examples from existing schemas are included
- Test patterns from existing test file are documented
- External research URLs with specific sections are provided

### Documentation & References

```yaml
# MUST READ - Internal Codebase Patterns
- file: src/core/models.ts
  why: Follow exact patterns for interface + Zod schema structure, JSDoc format, exports
  pattern: 'Lines 54-85: Status type + StatusEnum pattern (type definition, JSDoc, Zod enum)'
  gotcha: 'TypeScript type uses union syntax, Zod enum uses z.enum() with array of values'

- file: src/core/models.ts
  why: Follow exact patterns for complex object validation with nested schemas
  pattern: 'Lines 1063-1223: PRPDocumentSchema shows nested ValidationGateSchema and SuccessCriterionSchema arrays'
  gotcha: 'Use z.array() for nested schema arrays, not z.array(z.object(...))'

- file: src/core/models.ts
  why: Follow exact export patterns for both TypeScript types and Zod schemas
  pattern: 'Lines 1-28: Module-level JSDoc, import statements, interface then schema ordering'
  gotcha: 'Export types separately from schemas: export type { ... }; export { ... };'

- file: tests/unit/core/models.test.ts
  why: Follow exact test patterns for schema validation testing
  pattern: 'Lines 39-84: StatusEnum tests show valid/invalid enum testing with describe blocks'
  gotcha: 'Use safeParse() for testing, check result.success boolean'

- file: tests/unit/core/models.test.ts
  why: Follow exact patterns for complex object schema testing with nested validation
  pattern: 'Lines 1327-1473: RequirementChangeSchema tests show edge cases, boundary conditions, array validation'
  gotcha: 'Test both happy path (valid data) and error cases (invalid data)'

- file: src/agents/prompts.ts
  why: Understand how BUG_HUNT_PROMPT uses severity levels and bug report format
  pattern: 'Lines 868-979: BUG_HUNT_PROMPT definition shows severity classification (Critical, Major, Minor)'
  section: 'Phase 4: Documentation as Bug Report'
  gotcha: "BUG_HUNT_PROMPT uses 'Critical', 'Major', 'Minor' but contract specifies 'critical', 'major', 'minor', 'cosmetic' - follow contract"

- file: PRD.md
  why: Understand the overall QA & Bug Hunt Loop context
  section: '4.4 The QA & Bug Hunt Loop'
  gotcha: 'QA Agent only writes TEST_RESULTS.md if critical/major bugs found; absence signals success'

# EXTERNAL RESEARCH - Industry Best Practices
- url: https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues
  why: GitHub's bug report format is industry standard for issue tracking
  critical: 'Severity labels: critical, high, medium, low - but contract specifies specific 4-level system'

- url: https://confluence.atlassian.com/jira/defining-a-severity-scale-for-issues-951960352.html
  why: Atlassian's severity classification framework is widely adopted
  critical: '4-level severity system maps well to: critical (system down), major (significant impact), minor (partial functionality), cosmetic (polish)'

- url: https://zod.dev/?id=enums
  why: Official Zod documentation for enum validation patterns
  critical: "Use z.enum(['value1', 'value2']) for enums, then access .options property"

- url: https://vitest.dev/guide/
  why: Official Vitest testing framework documentation
  critical: 'Use describe/it pattern, expect().toBe() assertions, safeParse() for Zod testing'
# GOTCHA - Severity Level Naming Conflict
# BUG_HUNT_PROMPT uses: "Critical Issues (Must Fix)", "Major Issues (Should Fix)", "Minor Issues (Nice to Fix)"
# Contract specifies: 'critical', 'major', 'minor', 'cosmetic'
# Resolution: Follow contract specification for Zod enum values (lowercase, add 'cosmetic')
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── core/
│   │   ├── models.ts           # ADD SCHEMAS HERE (after line 1522)
│   │   └── session-utils.ts
│   └── ...
├── tests/
│   ├── unit/
│   │   └── core/
│   │       └── models.test.ts  # ADD TESTS HERE (after line 1665)
│   └── ...
└── ...
```

### Desired Codebase Tree with Files to be Added

```bash
# No new files - modifications to existing files only

src/core/models.ts (MODIFY - add 3 new schemas):
  ├── BugSeverity type (union of 4 string literals)
  ├── BugSeverityEnum (z.enum with 4 values)
  ├── Bug interface (with all required + optional fields)
  ├── BugSchema (z.object with field validation)
  ├── TestResults interface (with all required fields)
  └── TestResultsSchema (z.object with nested BugSchema array)

tests/unit/core/models.test.ts (MODIFY - add 3 new describe blocks):
  ├── describe('BugSeverityEnum', ...) - 3-4 tests
  ├── describe('BugSchema', ...) - 8-10 tests
  └── describe('TestResultsSchema', ...) - 6-8 tests
```

### Known Gotchas of our Codebase & Library Quirks

```typescript
// CRITICAL: Zod enum vs TypeScript union type order
// TypeScript type MUST be defined BEFORE Zod schema that references it
// WRONG: export const BugSeverityEnum = z.enum([...]); export type BugSeverity = z.infer<typeof BugSeverityEnum>;
// RIGHT: export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';
//        export const BugSeverityEnum = z.enum(['critical', 'major', 'minor', 'cosmetic']);

// CRITICAL: Optional fields in Zod vs undefined
// For optional fields: .optional() makes the field undefined-able
// WRONG: location: z.string() | z.undefined()
// RIGHT: location: z.string().optional()

// CRITICAL: Array field validation
// Empty arrays are valid: z.array(...).min(0)
// WRONG: z.array(...).min(1)  // This would reject empty arrays
// RIGHT: z.array(BugSchema)  // Empty arrays are valid by default

// CRITICAL: Schema type annotation pattern
// All object schemas use: z.ZodType<InterfaceName>
// WRONG: export const BugSchema = z.object({...});
// RIGHT: export const BugSchema: z.ZodType<Bug> = z.object({...});

// CRITICAL: Export patterns
// Types use: export type { TypeName };
// Schemas use: export { SchemaName };
// MUST add new types/schemas to existing export statements at end of file

// CRITICAL: Test import patterns
// Import BOTH the type and schema: import { Bug, BugSchema } from '../../../src/core/models.js';
// Use .js extension in imports (ES module requirement)

// CRITICAL: JSDoc format for new schemas
// MUST include @module, @remarks, @example sections
// Field-level JSDoc with @format, @minLength, @example for complex fields
```

## Implementation Blueprint

### Data models and structure

Three new TypeScript interfaces and three corresponding Zod schemas:

```typescript
// Type definition (interface first, then schema)
export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';

export interface Bug {
  readonly id: string; // Unique bug identifier
  readonly severity: BugSeverity;
  readonly title: string; // Brief bug title
  readonly description: string; // Detailed description
  readonly reproduction: string; // Steps to reproduce
  readonly location?: string; // Optional file/function location
}

export interface TestResults {
  readonly hasBugs: boolean; // True if critical/major bugs found
  readonly bugs: Bug[]; // Array of all bugs (empty if none)
  readonly summary: string; // Overall testing summary
  readonly recommendations: string[]; // Fix recommendations
}

// Zod schemas (after interfaces)
export const BugSeverityEnum = z.enum([
  'critical',
  'major',
  'minor',
  'cosmetic',
]);

export const BugSchema: z.ZodType<Bug> = z.object({
  id: z.string().min(1, 'Bug ID is required'),
  severity: BugSeverityEnum,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  reproduction: z.string().min(1, 'Reproduction steps are required'),
  location: z.string().optional(),
});

export const TestResultsSchema: z.ZodType<TestResults> = z.object({
  hasBugs: z.boolean(),
  bugs: z.array(BugSchema),
  summary: z.string().min(1, 'Summary is required'),
  recommendations: z.array(z.string()).min(0),
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD BugSeverity type to src/core/models.ts
  POSITION: After DeltaAnalysisSchema export (after line 1522)
  IMPLEMENT: TypeScript type with union of 4 string literals
  FOLLOW pattern: Lines 54-61 (Status type definition)
  JSDOC: Add module-level JSDoc with @remarks and @example
  NAMING: PascalCase for type (BugSeverity), values in lowercase

Task 2: ADD BugSeverityEnum to src/core/models.ts
  POSITION: Immediately after BugSeverity type
  IMPLEMENT: z.enum() with array of 4 severity values
  FOLLOW pattern: Lines 78-85 (StatusEnum definition)
  VALUES: 'critical', 'major', 'minor', 'cosmetic' (lowercase)

Task 3: ADD Bug interface to src/core/models.ts
  POSITION: After BugSeverityEnum
  IMPLEMENT: Interface with 6 readonly properties
  FOLLOW pattern: Lines 149-211 (Subtask interface structure)
  FIELDS: id (string), severity (BugSeverity), title (string), description (string), reproduction (string), location (string? - optional)
  JSDOC: Add comprehensive JSDoc with @remarks, field-level docs, @example

Task 4: ADD BugSchema to src/core/models.ts
  POSITION: Immediately after Bug interface
  IMPLEMENT: z.object() with field-level validation
  FOLLOW pattern: Lines 236-253 (SubtaskSchema structure)
  VALIDATION: min(1) for required strings, max(200) for title, .optional() for location
  TYPE: z.ZodType<Bug>

Task 5: ADD TestResults interface to src/core/models.ts
  POSITION: After BugSchema
  IMPLEMENT: Interface with 4 readonly properties
  FOLLOW pattern: Lines 1066-1187 (PRPDocument interface structure)
  FIELDS: hasBugs (boolean), bugs (Bug[]), summary (string), recommendations (string[])
  JSDOC: Add comprehensive JSDoc with @remarks explaining file absence = success pattern

Task 6: ADD TestResultsSchema to src/core/models.ts
  POSITION: Immediately after TestResults interface
  IMPLEMENT: z.object() with nested BugSchema array
  FOLLOW pattern: Lines 1213-1223 (PRPDocumentSchema structure)
  VALIDATION: z.boolean(), z.array(BugSchema), min(1) for required strings
  TYPE: z.ZodType<TestResults>

Task 7: UPDATE exports in src/core/models.ts
  POSITION: At end of file (after line 1522, before/with existing exports)
  ADD: Export new types: BugSeverity, Bug, TestResults
  ADD: Export new schemas: BugSeverityEnum, BugSchema, TestResultsSchema
  FOLLOW pattern: Existing export patterns (if any) or add new export block

Task 8: ADD BugSeverityEnum tests to tests/unit/core/models.test.ts
  POSITION: After DeltaAnalysisSchema describe block (after line 1665)
  IMPLEMENT: describe('BugSeverityEnum', ...) with 4 tests
  FOLLOW pattern: Lines 40-84 (StatusEnum tests)
  TESTS: Valid values, invalid values, .options property, all 4 severities

Task 9: ADD BugSchema tests to tests/unit/core/models.test.ts
  POSITION: After BugSeverityEnum tests
  IMPLEMENT: describe('BugSchema', ...) with 8-10 tests
  FOLLOW pattern: Lines 123-271 (SubtaskSchema tests) or Lines 1327-1473 (RequirementChangeSchema tests)
  TESTS: Valid bug, optional location, missing required fields, invalid severity, empty strings, boundary conditions

Task 10: ADD TestResultsSchema tests to tests/unit/core/models.test.ts
  POSITION: After BugSchema tests
  IMPLEMENT: describe('TestResultsSchema', ...) with 6-8 tests
  FOLLOW pattern: Lines 1021-1185 (PRPDocumentSchema tests)
  TESTS: Valid results, empty bugs array, hasBugs true/false, missing required fields, invalid nested bug

Task 11: VERIFY all imports in tests/unit/core/models.test.ts
  ACTION: Add BugSeverity, Bug, TestResults, BugSeverityEnum, BugSchema, TestResultsSchema to imports
  POSITION: Lines 12-37 (existing import block)
  FOLLOW pattern: Existing import structure with alphabetical/order grouping

Task 12: RUN full test suite
  COMMAND: npm test
  VERIFY: All existing tests still pass, new tests pass
  COVERAGE: Ensure 100% coverage for new schemas
```

### Implementation Patterns & Key Details

````typescript
// PATTERN 1: JSDoc Documentation Format (from Status type)
/**
 * Bug severity classification for QA reporting
 *
 * @remarks
 * Severity levels indicate impact on system functionality:
 * - `critical`: System down, data loss, security vulnerability
 * - `major`: Significant functionality broken, workarounds unavailable
 * - `minor`: Partial functionality, workarounds available
 * - `cosmetic`: Polish items, typos, visual issues
 *
 * @example
 * ```typescript
 * import { BugSeverity } from './core/models.js';
 *
 * const severity: BugSeverity = 'critical';
 * ```
 */
export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';

// PATTERN 2: Zod Enum Definition (from StatusEnum)
/**
 * Zod schema for BugSeverity enum validation
 *
 * @remarks
 * Validates that a value is one of the four valid severity levels.
 * Used for runtime validation of bug severity fields.
 *
 * @example
 * ```typescript
 * import { BugSeverityEnum } from './core/models.js';
 *
 * const result = BugSeverityEnum.safeParse('critical');
 * // result.success === true
 * ```
 */
export const BugSeverityEnum = z.enum([
  'critical',
  'major',
  'minor',
  'cosmetic',
]);

// PATTERN 3: Interface with Optional Field (from PRPArtifact generatedAt)
export interface Bug {
  /**
   * Unique identifier for this bug report
   *
   * @remarks
   * Should be unique across all bugs in a test session.
   * Use format like BUG-001 or timestamp-based ID.
   *
   * @example 'BUG-001' or 'bug-1705123456'
   */
  readonly id: string;

  /** Severity classification */
  readonly severity: BugSeverity;

  /**
   * Brief, searchable title of the bug
   *
   * @minLength 1
   * @maxLength 200
   * @example 'Login fails with empty password'
   */
  readonly title: string;

  /**
   * Detailed explanation of the bug
   *
   * @remarks
   * Should include expected vs actual behavior, error messages,
   * and any relevant context about when the bug occurs.
   */
  readonly description: string;

  /**
   * Step-by-step instructions to reproduce the bug
   *
   * @remarks
   * Must be detailed enough that another developer can follow
   * the steps and reliably observe the bug.
   *
   * @example
   * ```
   * 1. Navigate to /login
   * 2. Leave password field empty
   * 3. Click Submit button
   * 4. Observe: Unhandled exception thrown
   * ```
   */
  readonly reproduction: string;

  /**
   * File or function location where bug occurs
   *
   * @remarks
   * Optional field for code-related bugs. Include file path
   * and function name for easy navigation.
   *
   * @nullable true
   * @example 'src/services/auth.ts:45' or 'LoginComponent.submit()'
   */
  readonly location?: string;
}

// PATTERN 4: Object Schema with Validation (from SubtaskSchema)
export const BugSchema: z.ZodType<Bug> = z.object({
  id: z.string().min(1, 'Bug ID is required'),
  severity: BugSeverityEnum,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  reproduction: z.string().min(1, 'Reproduction steps are required'),
  location: z.string().optional(),
});

// PATTERN 5: Nested Schema Array (from PRPDocumentSchema)
export interface TestResults {
  /**
   * Whether critical or major bugs were found
   *
   * @remarks
   * This boolean drives the bug fix cycle. If true, the bug
   * fix sub-pipeline treats the TEST_RESULTS.md as a mini-PRD.
   * If false, the absence of the file signals success.
   */
  readonly hasBugs: boolean;

  /**
   * Array of all bugs found during testing
   *
   * @remarks
   * Contains bugs of all severity levels. Empty array if no
   * bugs found. The QA Agent populates this based on testing
   * results across happy paths, edge cases, and adversarial scenarios.
   */
  readonly bugs: Bug[];

  /**
   * High-level summary of testing performed
   *
   * @remarks
   * Should include: total tests performed, areas covered,
   * overall quality assessment, and any notable findings.
   *
   * @example "Performed 15 tests across login, data persistence, and error handling. Found 2 critical issues."
   */
  readonly summary: string;

  /**
   * Recommended fixes or improvements
   *
   * @remarks
   * Array of actionable recommendations for fixing bugs or
   * improving the implementation. Can be empty if no specific
   * recommendations beyond fixing reported bugs.
   */
  readonly recommendations: string[];
}

export const TestResultsSchema: z.ZodType<TestResults> = z.object({
  hasBugs: z.boolean(),
  bugs: z.array(BugSchema),
  summary: z.string().min(1, 'Summary is required'),
  recommendations: z.array(z.string()).min(0),
});

// GOTCHA: Export pattern - must add to existing exports
// At the end of src/core/models.ts, update exports:
export type {
  // ... existing exports
  BugSeverity,
  Bug,
  TestResults,
};

export {
  // ... existing exports
  BugSeverityEnum,
  BugSchema,
  TestResultsSchema,
};
````

### Integration Points

```yaml
EXPORTS:
  - add to: src/core/models.ts
  - position: At end of file, update type exports and schema exports
  - pattern: 'export type { BugSeverity, Bug, TestResults };'
  - pattern: 'export { BugSeverityEnum, BugSchema, TestResultsSchema };'

IMPORTS:
  - add to: tests/unit/core/models.test.ts
  - position: Lines 12-37, existing import block
  - pattern: "import { BugSeverity, Bug, TestResults, BugSeverityEnum, BugSchema, TestResultsSchema, type Bug, type BugSeverity, type TestResults } from '../../../src/core/models.js';"

BUG_HUNT_PROMPT:
  - future integration: P2.M2.T4.S2 (bug hunt prompt generator)
  - will use: BugSchema and TestResultsSchema for structured output
  - responseFormat: TestResultsSchema for LLM output validation

QA_WORKFLOW:
  - future integration: P4.M3.T1 (QA Bug Hunt Workflow)
  - will use: TestResultsSchema to parse QA Agent output
  - file output: TEST_RESULTS.md only if hasBugs === true
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after completing file modifications - fix before proceeding
npm run lint              # ESLint validation
npm run format            # Prettier formatting
npm run type-check        # TypeScript type checking

# All-in-one validation (if script exists)
npm run validate          # Runs all linting and type checking

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common issues:
# - Missing JSDoc comments -> Add comprehensive JSDoc
# - Incorrect import paths -> Use .js extension for ES modules
# - Type errors -> Verify interface and schema match
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test new schemas specifically
npm test -- tests/unit/core/models.test.ts --grep "BugSeverity"
npm test -- tests/unit/core/models.test.ts --grep "BugSchema"
npm test -- tests/unit/core/models.test.ts --grep "TestResultsSchema"

# Test entire models.test.ts file
npm test -- tests/unit/core/models.test.ts

# Full test suite for regression testing
npm test

# Coverage validation (enforces 100% coverage)
npm run test:coverage

# Expected: All tests pass. If failing:
# 1. Check test descriptions for what's failing
# 2. Verify schema structure matches implementation
# 3. Check that all imports are correct (.js extension)
# 4. Validate Zod schema syntax (z.object, z.enum, etc.)
```

### Level 3: Integration Testing (Type Safety Validation)

```bash
# TypeScript compilation check (validates types are exported correctly)
npx tsc --noEmit

# Import validation (ensure new types can be imported)
node -e "import('./dist/src/core/models.js').then(m => console.log('BugSeverityEnum:', m.BugSeverityEnum))"

# Schema runtime validation test
node -e "
import('./dist/src/core/models.js').then(({ BugSchema, BugSeverityEnum }) => {
  const result = BugSchema.safeParse({
    id: 'BUG-001',
    severity: 'critical',
    title: 'Test bug',
    description: 'Test description',
    reproduction: 'Test steps'
  });
  console.log('Parse result:', result.success);
});
"

# Expected: All imports work, schemas validate correctly, no type errors
```

### Level 4: Manual & Domain-Specific Validation

```bash
# Manual verification: Review src/core/models.ts
# 1. Check that BugSeverity type is defined before BugSeverityEnum
# 2. Verify JSDoc comments are comprehensive
# 3. Ensure all three interfaces have @example blocks
# 4. Confirm exports include all new types and schemas

# Manual verification: Review tests/unit/core/models.test.ts
# 1. Check that all new describe blocks follow existing patterns
# 2. Verify test coverage includes happy path and error cases
# 3. Ensure imports include all new types and schemas
# 4. Confirm tests use safeParse() correctly

# Domain validation: Verify schema contract compliance
echo 'Contract requirements:
- BugSeverityEnum: critical, major, minor, cosmetic ✓
- BugSchema: id, severity, title, description, reproduction, location ✓
- TestResultsSchema: hasBugs, bugs, summary, recommendations ✓'

# Expected: All contract requirements met, schemas match specification
```

## Final Validation Checklist

### Technical Validation

- [ ] All 3 schemas added to `src/core/models.ts` after line 1522
- [ ] BugSeverity type defined with 4 string literal union values
- [ ] BugSeverityEnum uses z.enum() with lowercase values
- [ ] Bug interface has all 6 fields (id, severity, title, description, reproduction, location?)
- [ ] BugSchema validates all fields with appropriate constraints
- [ ] TestResults interface has all 4 fields (hasBugs, bugs, summary, recommendations)
- [ ] TestResultsSchema validates nested BugSchema array
- [ ] All new types and schemas exported from `src/core/models.ts`
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Test coverage 100%: `npm run test:coverage`

### Feature Validation

- [ ] BugSeverityEnum accepts all 4 valid values: 'critical', 'major', 'minor', 'cosmetic'
- [ ] BugSeverityEnum rejects invalid severity values
- [ ] BugSchema parses valid bug objects with all required fields
- [ ] BugSchema parses valid bug objects with optional location field
- [ ] BugSchema rejects bug objects missing required fields (id, severity, title, description, reproduction)
- [ ] BugSchema rejects bug objects with invalid severity values
- [ ] BugSchema rejects bug objects with empty strings for required fields
- [ ] TestResultsSchema parses valid test results objects
- [ ] TestResultsSchema parses test results with empty bugs array
- [ ] TestResultsSchema parses test results with hasBugs === true
- [ ] TestResultsSchema parses test results with hasBugs === false
- [ ] TestResultsSchema rejects test results missing required fields

### Code Quality Validation

- [ ] All new interfaces have comprehensive JSDoc with @module, @remarks, @example
- [ ] All new schemas have corresponding JSDoc with usage examples
- [ ] Field-level JSDoc included for complex fields (id, title, reproduction)
- [ ] Follows existing codebase patterns (Status/StatusEnum as template)
- [ ] File placement matches desired structure (src/core/models.ts)
- [ ] Test file placement matches structure (tests/unit/core/models.test.ts)
- [ ] Import statements use .js extension (ES module requirement)
- [ ] Export patterns match existing codebase (type exports separate from schema exports)

### Documentation & Deployment

- [ ] Code is self-documenting with clear type names (BugSeverity, Bug, TestResults)
- [ ] Schema names follow convention (BugSeverityEnum, BugSchema, TestResultsSchema)
- [ ] Interfaces use readonly modifiers for immutability
- [ ] Optional fields use .optional() in Zod schema
- [ ] Array fields use z.array() with appropriate schema reference
- [ ] Error messages in Zod schemas are descriptive and helpful

---

## Anti-Patterns to Avoid

- **Don't** define Zod enum before TypeScript type - type must come first
- **Don't** use uppercase severity values - contract specifies lowercase ('critical', not 'Critical')
- **Don't** make location field required - it's optional per contract
- **Don't** skip JSDoc comments - all interfaces and schemas need comprehensive documentation
- **Don't** forget to export new types and schemas - they must be in export statements
- **Don't** use .default() for optional fields - use .optional() instead
- **Don't** create separate files - add to existing src/core/models.ts
- **Don't** import from 'models.ts' - use 'models.js' (ES module requirement)
- **Don't** use z.string().nullable() - location uses .optional(), not nullable
- **Don't** write sparse tests - cover happy path, edge cases, and error conditions
- **Don't** use `z.infer<typeof BugSeverityEnum>` for type - define union explicitly
- **Don't** forget .js extension in test imports - required for ES modules
- **Don't** put tests in separate file - add to existing tests/unit/core/models.test.ts
- **Don't** run tests after each file - run after completing all modifications
- **Don't** skip the import update in test file - must import new types/schemas

---

## Confidence Score

**8/10** for one-pass implementation success

**Reasoning**:

- Clear contract specification with exact field names and types
- Comprehensive existing patterns to follow in codebase
- Detailed test patterns already established
- External research provides industry-standard context
- Single file modification (src/core/models.ts) reduces complexity

**Risk Factors**:

- Severity level naming conflict between BUG_HUNT_PROMPT and contract (resolved in gotchas)
- Optional field handling (.optional() vs .nullable()) - documented in patterns
- Export pattern must be updated correctly - documented in tasks
- Import statement in test file must be updated - documented in tasks

**Mitigation**: All risk factors are documented with specific patterns and examples to follow.
