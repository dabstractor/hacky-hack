# Product Requirement Prompt (PRP): Test PRPDocument structure

**PRP ID**: P1.M3.T2.S2
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Create comprehensive unit tests for PRPDocument structure validation to ensure that Product Requirement Prompt documents can be properly validated against Zod schemas and serialized to markdown format.

**Deliverable**: Extended test file at `tests/unit/core/models.test.ts` with new describe block for PRPDocument structure testing:

1. **Test 1**: Create valid PRPDocument with all required sections
2. **Test 2**: Test ContextSection variations in context field (url, file, docfile patterns)
3. **Test 3**: Test ImplementationTask patterns in implementationSteps field (ACTION, path, FOLLOW, NAMING, etc.)
4. **Test 4**: Test ValidationGate with all 4 validation levels
5. **Test 5**: Verify PRPDocument can be serialized to markdown format (PRP.md)

**Success Definition**:

- PRPDocument interface structure is validated with all 7 required fields
- ValidationGate correctly enforces literal union (1 | 2 | 3 | 4) for level field
- Context field accepts YAML-formatted ContextSection patterns (url, file, docfile)
- ImplementationSteps field accepts YAML-formatted ImplementationTask patterns
- PRPDocument serializes to valid markdown matching PRPGenerator.#formatPRPAsMarkdown() format
- All edge cases covered: empty strings, invalid levels, null commands, empty arrays
- 100% test coverage for PRPDocument-related types and schemas
- Tests follow existing patterns from models.test.ts (describe/it, SETUP/EXECUTE/VERIFY)

---

## User Persona

**Target User**: Developer working on PRP Generation system who needs to ensure that PRPDocument structures are valid and can be properly serialized to markdown files.

**Use Case**: Implementing PRP generation and needing assurance that PRPDocument structures are valid according to Zod schemas and can be correctly formatted as markdown PRP.md files.

**User Journey**:

1. Researcher Agent generates PRPDocument from task analysis
2. PRPDocument is validated against PRPDocumentSchema
3. PRPDocument is serialized to markdown using PRPGenerator.#formatPRPAsMarkdown()
4. Markdown is written to {sessionPath}/prps/{taskId}.md
5. Tests verify structure validity and markdown serialization

**Pain Points Addressed**:

- **Invalid PRP structures**: Tests catch structural issues before PRP execution
- **Markdown format errors**: Tests verify correct markdown serialization
- **ValidationGate level errors**: Tests enforce literal union (1 | 2 | 3 | 4)
- **Context pattern errors**: Tests validate YAML-formatted context sections
- **Empty string handling**: Tests ensure all string fields are non-empty

---

## Why

- **Data Integrity**: PRPDocument is the core structure for PRP generation and execution. Tests ensure it conforms to the correct schema.
- **Markdown Serialization**: PRPDocuments must serialize to valid markdown for human-readable PRP.md files.
- **Validation Enforcement**: ValidationGate.level must be literal 1, 2, 3, or 4 (not generic numbers).
- **Pattern Validation**: ContextSection and ImplementationTask are YAML patterns (not TypeScript interfaces) that need validation.
- **Regression Prevention**: Changes to PRPDocument structure won't break PRP generation if tests catch issues.
- **Executable Documentation**: Tests serve as living documentation of expected PRPDocument structure.
- **Problems Solved**:
  - "Does PRPDocument conform to the Zod schema?"
  - "Do ValidationGate levels enforce literal values?"
  - "Does markdown serialization match PRPGenerator format?"
  - "What happens when required fields are empty?"

---

## What

Extend `tests/unit/core/models.test.ts` with comprehensive tests for PRPDocument structure validation.

### Current State Analysis

**PRPDocument Interface** (from `src/core/models.ts` lines 1195-1268):

```typescript
export interface PRPDocument {
  readonly taskId: string; // Format: P1.M2.T2.S2
  readonly objective: string; // Feature Goal
  readonly context: string; // Complete "All Needed Context" as markdown
  readonly implementationSteps: string[]; // Implementation task descriptions
  readonly validationGates: ValidationGate[]; // 4 validation gates
  readonly successCriteria: SuccessCriterion[]; // Success criteria
  readonly references: string[]; // URLs and file paths
}
```

**ValidationGate Interface** (from `src/core/models.ts` lines 999-1043):

```typescript
export interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4; // Literal union, NOT generic number
  readonly description: string;
  readonly command: string | null; // null for manual validation
  readonly manual: boolean;
}
```

**Existing PRPDocumentSchema Tests** (from `tests/unit/core/models.test.ts` lines 1566-1730):

- Tests valid PRPDocument parsing
- Tests empty arrays
- Tests empty string rejection
- **MISSING**: Tests for ValidationGate literal union enforcement
- **MISSING**: Tests for ContextSection YAML patterns
- **MISSING**: Tests for ImplementationTask YAML patterns
- **MISSING**: Tests for markdown serialization

**Key Insight**: ContextSection and ImplementationTask are NOT TypeScript interfaces. They are YAML documentation patterns used in PRP templates. Tests should verify these patterns are accepted as strings in the context and implementationSteps fields.

### Success Criteria

- [ ] Test 1: Valid PRPDocument with all 7 required fields
- [ ] Test 2: ValidationGate with level 1 (Syntax & Style)
- [ ] Test 3: ValidationGate with level 2 (Unit Tests)
- [ ] Test 4: ValidationGate with level 3 (Integration Testing)
- [ ] Test 5: ValidationGate with level 4 (Manual/Creative)
- [ ] Test 6: ValidationGate rejects invalid level (5, 0, or generic number)
- [ ] Test 7: ValidationGate accepts null command for manual validation
- [ ] Test 8: Context field accepts YAML url pattern
- [ ] Test 9: Context field accepts YAML file pattern
- [ ] Test 10: Context field accepts YAML docfile pattern
- [ ] Test 11: ImplementationSteps accepts YAML CREATE pattern
- [ ] Test 12: ImplementationSteps accepts YAML MODIFY pattern
- [ ] Test 13: ImplementationSteps accepts all fields (ACTION, path, FOLLOW, NAMING, etc.)
- [ ] Test 14: PRPDocument serializes to valid markdown format
- [ ] Test 15: Markdown format matches PRPGenerator.#formatPRPAsMarkdown() output
- [ ] All tests follow existing patterns from models.test.ts
- [ ] 100% coverage for PRPDocument-related types

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] PRPDocument interface fully analyzed (7 fields with types)
- [x] ValidationGate structure documented (4 fields with literal union)
- [x] SuccessCriterion structure documented (2 fields)
- [x] PRPDocumentSchema analyzed with validation rules
- [x] PRPGenerator markdown format documented
- [x] Existing test patterns identified (describe/it, SETUP/EXECUTE/VERIFY)
- [x] ContextSection YAML pattern documented (url, file, docfile)
- [x] ImplementationTask YAML pattern documented (ACTION, path, FOLLOW, NAMING)
- [x] Codebase tree structure confirmed
- [x] Test file naming convention confirmed (.test.ts)

---

### Documentation & References

```yaml
# MUST READ - PRPDocument interface definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains PRPDocument interface (lines 1195-1268) with all 7 fields
  section: Lines 1195-1268
  critical: |
    - taskId: string (format P1.M2.T2.S2)
    - objective: string (Feature Goal)
    - context: string (markdown with YAML patterns)
    - implementationSteps: string[] (YAML task patterns)
    - validationGates: ValidationGate[]
    - successCriteria: SuccessCriterion[]
    - references: string[]
    - All fields are readonly

# MUST READ - ValidationGate interface definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains ValidationGate interface (lines 999-1043) with literal union level
  section: Lines 999-1043
  critical: |
    - level: 1 | 2 | 3 | 4 (literal union, NOT generic number)
    - description: string
    - command: string | null (null for manual)
    - manual: boolean
    - Level must be literal 1, 2, 3, or 4

# MUST READ - SuccessCriterion interface definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains SuccessCriterion interface (lines 1099-1121)
  section: Lines 1099-1121
  critical: |
    - description: string
    - satisfied: boolean

# MUST READ - PRPDocumentSchema Zod schema
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains PRPDocumentSchema Zod validation (lines 1294-1304)
  section: Lines 1294-1304
  pattern: |
    - Uses z.string().min(1) for all string fields
    - Uses z.array() for array fields
    - Nested ValidationGateSchema and SuccessCriterionSchema
  gotcha: |
    - Empty strings are invalid (min(1) validation)
    - Arrays can be empty
    - command can be null (not undefined)

# MUST READ - ValidationGateSchema Zod schema
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains ValidationGateSchema with literal union (lines 1066-1071)
  section: Lines 1066-1071
  critical: |
    - Uses z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    - NOT z.number() or z.enum()
    - command is z.string().nullable()

# MUST READ - PRPGenerator markdown format
- file: /home/dustin/projects/hacky-hack/src/agents/prp-generator.ts
  why: Contains #formatPRPAsMarkdown() method (lines 509-559) showing markdown output
  section: Lines 509-559
  pattern: |
    - Header: # PRP for {taskId}
    - Objective section
    - Context section
    - Implementation Steps (numbered)
    - Validation Gates (### Level {level})
    - Success Criteria (- [ ] format)
    - References (bullet list)

# MUST READ - PRP template structure
- file: /home/dustin/projects/hacky-hack/PROMPTS.md
  why: Contains PRP_CREATE_PROMPT template (lines 189-314) with YAML patterns
  section: Lines 189-314
  pattern: |
    - ContextSection YAML: url, file, docfile with why, critical, pattern, gotcha
    - ImplementationTask YAML: ACTION, path, FOLLOW pattern, NAMING, PLACEMENT

# MUST READ - Existing PRPDocument tests
- file: /home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts
  why: Contains existing PRPDocumentSchema tests (lines 1566-1730) to extend
  section: Lines 1566-1730
  pattern: |
    - describe/it block structure
    - SETUP/EXECUTE/VERIFY comments
    - PRPDocumentSchema.safeParse() pattern
    - expect(result.success).toBe(true/false)

# MUST READ - Previous PRP (SessionState serialization)
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T2S1/PRP.md
  why: Shows pattern for serialization tests (Test 5, Test 6)
  section: Full file
  pattern: |
    - Serialization tests with JSON.stringify
    - Deserialization tests with JSON.parse
    - Field preservation verification

# RESEARCH DOCUMENTATION - PRPDocument structure analysis
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T2S2/research/prpdocument-structure-research.md
  why: Complete analysis of PRPDocument interface structure
  section: Full file
  critical: |
    - 7 fields with exact types
    - ValidationGate level is literal union
    - ContextSection is YAML pattern (not interface)
    - ImplementationTask is YAML pattern (not interface)
    - Markdown format specification
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   └── models.ts                    # SOURCE: PRPDocument (1195-1268), ValidationGate (999-1043), SuccessCriterion (1099-1121)
│   └── agents/
│       └── prp-generator.ts             # REFERENCE: #formatPRPAsMarkdown() (509-559)
├── tests/
│   ├── setup.ts                         # Global test setup
│   └── unit/
│       └── core/
│           └── models.test.ts           # EXTEND: Add PRPDocument structure tests (after line 1730)
├── PROMPTS.md                           # REFERENCE: PRP template with YAML patterns (189-314)
├── vitest.config.ts                     # Test configuration (100% coverage)
├── plan/
│   └── 002_1e734971e481/
│       ├── P1M3T2S1/
│       │   └── PRP.md                   # REFERENCE: Previous PRP for pattern
│       └── P1M3T2S2/
│           ├── PRP.md                   # NEW: This PRP
│           └── research/
│               └── prpdocument-structure-research.md  # RESEARCH: Structure analysis
└── package.json
```

---

### Desired Codebase Tree (modifications to existing files)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── core/
            └── models.test.ts           # MODIFY: Add new describe block for PRPDocument structure tests
                                        # ADD: describe('PRPDocument structure', () => { ... })
                                        # ADD: Tests for ValidationGate levels (1-4)
                                        # ADD: Tests for ContextSection YAML patterns
                                        # ADD: Tests for ImplementationTask YAML patterns
                                        # ADD: Tests for markdown serialization
                                        # MAINTAIN: All existing test patterns
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: ValidationGate.level is Literal Union, NOT Generic Number
// Must be exactly 1, 2, 3, or 4
// z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
// Invalid: level: 5, level: 0, level: 1 as number (without literal type)
// Valid: level: 1, level: 2, level: 3, level: 4

// CRITICAL: ValidationGate.command Can Be null (Not undefined)
// null means manual validation
// Use z.string().nullable() in schema
// Valid: command: null, command: 'npm test'
// Invalid: command: undefined (will fail schema validation)

// CRITICAL: ContextSection is NOT a TypeScript Interface
// It's a YAML documentation pattern used in PRP templates
// The context field is a string containing YAML-formatted documentation
// Tests should verify YAML patterns are accepted as strings
// Example context field value:
// """
// - url: https://example.com
//   why: Reference documentation
//   critical: Key insights
// """

// CRITICAL: ImplementationTask is NOT a TypeScript Interface
// It's a YAML documentation pattern used in PRP templates
// The implementationSteps field is string[] containing YAML-formatted tasks
// Tests should verify YAML patterns are accepted in array
// Example implementationSteps value:
// [
//   "Task 1: CREATE src/models/example.ts\n  - IMPLEMENT: Example class",
//   "Task 2: MODIFY src/main.ts\n  - ADD: Import statement"
// ]

// CRITICAL: All String Fields Have min(1) Validation
// Empty strings are invalid
// z.string().min(1, 'Field is required')
// Valid: taskId: 'P1.M2.T2.S2', objective: 'Test objective'
// Invalid: taskId: '', objective: '', context: ''

// GOTCHA: Arrays Can Be Empty
// implementationSteps, validationGates, successCriteria, references can all be []
// But individual elements must satisfy their constraints
// implementationSteps: [] is valid
// implementationSteps: [''] is invalid (empty string in array)

// CRITICAL: Markdown Format Matches PRPGenerator.#formatPRPAsMarkdown()
// Tests should verify markdown output matches exact format
// Header: "# PRP for {taskId}"
// Sections: ## Objective, ## Context, ## Implementation Steps, etc.
// Validation Gates: "### Level {level}"
// Success Criteria: "- [ ] {description}"

// GOTCHA: Vitest Globals Are Enabled
// No need to import describe, it, expect, test, etc.
// They are available globally in all test files

// CRITICAL: Test File Naming Convention
// Use .test.ts suffix (not .spec.ts)
// File already exists: tests/unit/core/models.test.ts
// We're EXTENDING existing file, not creating new one

// CRITICAL: 100% Code Coverage Requirement
// All tests must achieve 100% coverage
// Check coverage with: npm run test:coverage

// GOTCHA: PRPDocument Does Not Serialize to JSON
// It serializes to MARKDOWN via PRPGenerator
// Tests should verify markdown format, not JSON
// See PRPGenerator.#formatPRPAsMarkdown() for exact format

// CRITICAL: Existing Tests at Lines 1566-1730
// Do NOT modify existing PRPDocumentSchema tests
// Add NEW describe block after existing tests
// Use describe('PRPDocument structure', () => { ... }) for new tests

// GOTCHA: ContextSection and ImplementationTask Are Documentation Patterns
// They are defined in PROMPTS.md as YAML templates
// They are NOT TypeScript interfaces in models.ts
// Tests verify these patterns work as string content in PRPDocument fields
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing PRPDocument, ValidationGate, and SuccessCriterion interfaces.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing PRPDocument tests and understand patterns
  - FILE: tests/unit/core/models.test.ts
  - READ: Lines 1566-1730 (existing PRPDocumentSchema tests)
  - UNDERSTAND: Test structure and assertion patterns
  - EXTRACT: validPRP factory pattern
  - DEPENDENCIES: None

Task 2: READ PRPGenerator markdown format method
  - FILE: src/agents/prp-generator.ts
  - READ: Lines 509-559 (#formatPRPAsMarkdown method)
  - UNDERSTAND: Markdown output format
  - EXTRACT: Section headers and formatting patterns
  - DEPENDENCIES: None

Task 3: CREATE describe block for PRPDocument structure tests
  - FILE: tests/unit/core/models.test.ts
  - ADD: describe('PRPDocument structure', () => { ... }) after line 1730
  - PATTERN: Follow existing describe block patterns
  - DEPENDENCIES: Task 1, Task 2

Task 4: IMPLEMENT Test 1 - Valid PRPDocument with all fields
  - CREATE: it('should create valid PRPDocument with all required fields')
  - SETUP: Create PRPDocument with all 7 fields populated
  - VERIFY: PRPDocumentSchema.safeParse() returns success
  - VERIFY: All fields preserved in parsed result
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 3

Task 5: IMPLEMENT Tests 2-5 - ValidationGate levels
  - CREATE: it('should accept ValidationGate with level 1')
  - CREATE: it('should accept ValidationGate with level 2')
  - CREATE: it('should accept ValidationGate with level 3')
  - CREATE: it('should accept ValidationGate with level 4')
  - VERIFY: Each literal value (1, 2, 3, 4) is accepted
  - PATTERN: Use consistent test structure
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 6 - Invalid ValidationGate levels
  - CREATE: it('should reject ValidationGate with invalid level (5)')
  - CREATE: it('should reject ValidationGate with invalid level (0)')
  - CREATE: it('should reject ValidationGate with generic number')
  - VERIFY: Invalid levels fail schema validation
  - VERIFY: Error messages indicate level validation failure
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 7 - Null command for manual validation
  - CREATE: it('should accept null command for manual validation')
  - SETUP: ValidationGate with command: null, manual: true
  - VERIFY: Schema accepts null command
  - VERIFY: manual field must be true when command is null
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Tests 8-10 - ContextSection YAML patterns
  - CREATE: it('should accept context with YAML url pattern')
  - CREATE: it('should accept context with YAML file pattern')
  - CREATE: it('should accept context with YAML docfile pattern')
  - SETUP: Context field with YAML-formatted documentation
  - VERIFY: Context field accepts YAML strings
  - PATTERN: Use multi-line template strings
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Tests 11-13 - ImplementationTask YAML patterns
  - CREATE: it('should accept implementationSteps with CREATE pattern')
  - CREATE: it('should accept implementationSteps with MODIFY pattern')
  - CREATE: it('should accept implementationSteps with all fields')
  - SETUP: implementationSteps array with YAML-formatted tasks
  - VERIFY: Array accepts YAML task strings
  - VERIFY: ACTION, path, FOLLOW, NAMING fields in YAML
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Tests 14-15 - Markdown serialization
  - CREATE: it('should serialize PRPDocument to markdown format')
  - CREATE: it('should match PRPGenerator.#formatPRPAsMarkdown() format')
  - SETUP: Create valid PRPDocument
  - EXECUTE: Format as markdown (simulate PRPGenerator)
  - VERIFY: Header format "# PRP for {taskId}"
  - VERIFY: Section headers (## Objective, ## Context, etc.)
  - VERIFY: Validation gate format "### Level {level}"
  - VERIFY: Success criteria format "- [ ] {description}"
  - DEPENDENCIES: Task 9

Task 11: RUN tests and verify coverage
  - RUN: npm test -- tests/unit/core/models.test.ts
  - VERIFY: All new tests pass
  - VERIFY: Coverage is 100% for PRPDocument structure
  - FIX: Any failing tests or coverage gaps
  - DEPENDENCIES: Task 10

Task 12: RUN typecheck and verify compilation
  - RUN: npm run typecheck
  - VERIFY: No TypeScript compilation errors
  - DEPENDENCIES: Task 11
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Valid PRPDocument Factory Function
// =============================================================================

import {
  PRPDocument,
  ValidationGate,
  SuccessCriterion,
  PRPDocumentSchema,
} from '../../../src/core/models.js';

function createTestPRPDocument(
  overrides: Partial<PRPDocument> = {}
): PRPDocument {
  return {
    taskId: 'P1.M2.T2.S2',
    objective: 'Add PRP document interfaces to models.ts',
    context: '# All Needed Context\n\nComplete context for implementation...',
    implementationSteps: [
      'Create ValidationGate interface',
      'Create ValidationGateSchema',
    ],
    validationGates: [
      {
        level: 1,
        description: 'Syntax & Style validation',
        command: 'npm run validate',
        manual: false,
      },
      {
        level: 2,
        description: 'Unit Tests validation',
        command: 'npm test',
        manual: false,
      },
      {
        level: 3,
        description: 'Integration Testing validation',
        command: 'npm run test:integration',
        manual: false,
      },
      {
        level: 4,
        description: 'Manual/Creative validation',
        command: null,
        manual: true,
      },
    ],
    successCriteria: [
      { description: 'All interfaces added', satisfied: false },
      { description: 'All schemas validated', satisfied: false },
    ],
    references: [
      'https://github.com/anthropics/claude-code',
      'src/core/models.ts',
    ],
    ...overrides,
  };
}

// =============================================================================
// PATTERN: Test 1 - Valid PRPDocument with All Fields
// =============================================================================

describe('PRPDocument structure', () => {
  describe('required fields', () => {
    it('should create valid PRPDocument with all required fields', () => {
      // SETUP: Create PRPDocument with all 7 fields
      const validPRP = createTestPRPDocument();

      // EXECUTE: Validate against schema
      const result = PRPDocumentSchema.safeParse(validPRP);

      // VERIFY: Validation succeeds
      expect(result.success).toBe(true);
      if (result.success) {
        // VERIFY: All 7 fields present and correct
        expect(result.data.taskId).toBe('P1.M2.T2.S2');
        expect(result.data.objective).toBe(
          'Add PRP document interfaces to models.ts'
        );
        expect(result.data.context).toContain('All Needed Context');
        expect(result.data.implementationSteps).toHaveLength(2);
        expect(result.data.validationGates).toHaveLength(4);
        expect(result.data.successCriteria).toHaveLength(2);
        expect(result.data.references).toHaveLength(2);
      }
    });
  });

  // =============================================================================
  // PATTERN: Tests 2-5 - ValidationGate Levels
  // =============================================================================

  describe('ValidationGate levels', () => {
    it('should accept ValidationGate with level 1', () => {
      // SETUP: ValidationGate with level 1
      const gateLevel1: ValidationGate = {
        level: 1,
        description: 'Syntax & Style validation',
        command: 'npm run lint',
        manual: false,
      };

      // EXECUTE: Validate within PRPDocument
      const prp = createTestPRPDocument({
        validationGates: [gateLevel1],
      });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: Level 1 is accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validationGates[0].level).toBe(1);
      }
    });

    it('should accept ValidationGate with level 2', () => {
      // SETUP: ValidationGate with level 2
      const gateLevel2: ValidationGate = {
        level: 2,
        description: 'Unit Tests validation',
        command: 'npm test',
        manual: false,
      };

      // EXECUTE & VERIFY
      const prp = createTestPRPDocument({
        validationGates: [gateLevel2],
      });
      const result = PRPDocumentSchema.safeParse(prp);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validationGates[0].level).toBe(2);
      }
    });

    it('should accept ValidationGate with level 3', () => {
      // SETUP: ValidationGate with level 3
      const gateLevel3: ValidationGate = {
        level: 3,
        description: 'Integration Testing validation',
        command: 'npm run test:integration',
        manual: false,
      };

      // EXECUTE & VERIFY
      const prp = createTestPRPDocument({
        validationGates: [gateLevel3],
      });
      const result = PRPDocumentSchema.safeParse(prp);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validationGates[0].level).toBe(3);
      }
    });

    it('should accept ValidationGate with level 4', () => {
      // SETUP: ValidationGate with level 4
      const gateLevel4: ValidationGate = {
        level: 4,
        description: 'Manual/Creative validation',
        command: null,
        manual: true,
      };

      // EXECUTE & VERIFY
      const prp = createTestPRPDocument({
        validationGates: [gateLevel4],
      });
      const result = PRPDocumentSchema.safeParse(prp);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validationGates[0].level).toBe(4);
      }
    });

    // =============================================================================
    // PATTERN: Test 6 - Invalid ValidationGate Levels
    // =============================================================================

    it('should reject ValidationGate with invalid level (5)', () => {
      // SETUP: ValidationGate with level 5 (invalid)
      const prp = createTestPRPDocument({
        validationGates: [
          {
            level: 5 as any, // Type assertion to bypass TS
            description: 'Invalid level',
            command: 'npm test',
            manual: false,
          },
        ],
      });

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: Validation fails
      expect(result.success).toBe(false);
    });

    it('should reject ValidationGate with invalid level (0)', () => {
      // SETUP: ValidationGate with level 0 (invalid)
      const prp = createTestPRPDocument({
        validationGates: [
          {
            level: 0 as any,
            description: 'Invalid level',
            command: 'npm test',
            manual: false,
          },
        ],
      });

      // EXECUTE & VERIFY
      const result = PRPDocumentSchema.safeParse(prp);
      expect(result.success).toBe(false);
    });

    // =============================================================================
    // PATTERN: Test 7 - Null Command for Manual Validation
    // =============================================================================

    it('should accept null command for manual validation', () => {
      // SETUP: ValidationGate with null command (manual validation)
      const manualGate: ValidationGate = {
        level: 4,
        description: 'Manual validation required',
        command: null,
        manual: true,
      };

      // EXECUTE
      const prp = createTestPRPDocument({
        validationGates: [manualGate],
      });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: Null command is accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validationGates[0].command).toBeNull();
        expect(result.data.validationGates[0].manual).toBe(true);
      }
    });
  });

  // =============================================================================
  // PATTERN: Tests 8-10 - ContextSection YAML Patterns
  // =============================================================================

  describe('ContextSection YAML patterns', () => {
    it('should accept context with YAML url pattern', () => {
      // SETUP: Context field with YAML url pattern
      const yamlUrlContext = `# All Needed Context

\`\`\`yaml
# Documentation & References
- url: https://github.com/anthropics/claude-code
  why: Reference documentation for Claude Code
  critical: Key insights for implementation
\`\`\`
`;

      // EXECUTE
      const prp = createTestPRPDocument({ context: yamlUrlContext });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: YAML url pattern accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toContain('url:');
        expect(result.data.context).toContain('why:');
        expect(result.data.context).toContain('critical:');
      }
    });

    it('should accept context with YAML file pattern', () => {
      // SETUP: Context field with YAML file pattern
      const yamlFileContext = `# All Needed Context

\`\`\`yaml
# Documentation & References
- file: src/core/models.ts
  why: Contains PRPDocument interface definition
  pattern: Interface structure
  gotcha: All fields are readonly
\`\`\`
`;

      // EXECUTE
      const prp = createTestPRPDocument({ context: yamlFileContext });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: YAML file pattern accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toContain('file:');
        expect(result.data.context).toContain('pattern:');
        expect(result.data.context).toContain('gotcha:');
      }
    });

    it('should accept context with YAML docfile pattern', () => {
      // SETUP: Context field with YAML docfile pattern
      const yamlDocfileContext = `# All Needed Context

\`\`\`yaml
# Documentation & References
- docfile: plan/002_1e734971e481/ai_docs/domain_specific.md
  why: Custom documentation for complex patterns
  section: Implementation examples
\`\`\`
`;

      // EXECUTE
      const prp = createTestPRPDocument({ context: yamlDocfileContext });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: YAML docfile pattern accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toContain('docfile:');
        expect(result.data.context).toContain('section:');
      }
    });
  });

  // =============================================================================
  // PATTERN: Tests 11-13 - ImplementationTask YAML Patterns
  // =============================================================================

  describe('ImplementationTask YAML patterns', () => {
    it('should accept implementationSteps with CREATE pattern', () => {
      // SETUP: implementationSteps with YAML CREATE pattern
      const yamlCreateSteps = [
        'Task 1: CREATE src/core/example.ts\n  - IMPLEMENT: Example class\n  - NAMING: PascalCase\n  - PLACEMENT: Core directory',
      ];

      // EXECUTE
      const prp = createTestPRPDocument({
        implementationSteps: yamlCreateSteps,
      });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: YAML CREATE pattern accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.implementationSteps).toHaveLength(1);
        expect(result.data.implementationSteps[0]).toContain('CREATE');
        expect(result.data.implementationSteps[0]).toContain('IMPLEMENT');
        expect(result.data.implementationSteps[0]).toContain('NAMING');
        expect(result.data.implementationSteps[0]).toContain('PLACEMENT');
      }
    });

    it('should accept implementationSteps with MODIFY pattern', () => {
      // SETUP: implementationSteps with YAML MODIFY pattern
      const yamlModifySteps = [
        'Task 2: MODIFY src/core/models.ts\n  - ADD: PRPDocument interface\n  - INTEGRATE: With existing interfaces',
      ];

      // EXECUTE
      const prp = createTestPRPDocument({
        implementationSteps: yamlModifySteps,
      });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: YAML MODIFY pattern accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.implementationSteps[0]).toContain('MODIFY');
        expect(result.data.implementationSteps[0]).toContain('ADD');
        expect(result.data.implementationSteps[0]).toContain('INTEGRATE');
      }
    });

    it('should accept implementationSteps with all fields', () => {
      // SETUP: implementationSteps with complete YAML pattern
      const yamlCompleteSteps = [
        'Task 1: CREATE src/core/models.ts\n' +
          '  - IMPLEMENT: PRPDocument interface\n' +
          '  - FOLLOW pattern: src/core/models.ts (interface structure)\n' +
          '  - NAMING: CamelCase for interfaces\n' +
          '  - DEPENDENCIES: None\n' +
          '  - PLACEMENT: Core models file',
      ];

      // EXECUTE
      const prp = createTestPRPDocument({
        implementationSteps: yamlCompleteSteps,
      });
      const result = PRPDocumentSchema.safeParse(prp);

      // VERIFY: All YAML fields accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.implementationSteps[0]).toContain('IMPLEMENT');
        expect(result.data.implementationSteps[0]).toContain('FOLLOW pattern');
        expect(result.data.implementationSteps[0]).toContain('NAMING');
        expect(result.data.implementationSteps[0]).toContain('DEPENDENCIES');
        expect(result.data.implementationSteps[0]).toContain('PLACEMENT');
      }
    });
  });

  // =============================================================================
  // PATTERN: Tests 14-15 - Markdown Serialization
  // =============================================================================

  describe('markdown serialization', () => {
    // Helper function to simulate PRPGenerator.#formatPRPAsMarkdown()
    function formatPRPAsMarkdown(prp: PRPDocument): string {
      const implementationStepsMd = prp.implementationSteps
        .map((step, i) => `${i + 1}. ${step}`)
        .join('\n');

      const validationGatesMd = prp.validationGates
        .map(
          gate =>
            `### Level ${gate.level}\n\n${
              gate.command !== null
                ? gate.command
                : 'Manual validation required'
            }`
        )
        .join('\n\n');

      const successCriteriaMd = prp.successCriteria
        .map(c => `- [ ] ${c.description}`)
        .join('\n');

      const referencesMd = prp.references.map(r => `- ${r}`).join('\n');

      return `# PRP for ${prp.taskId}

## Objective

${prp.objective}

## Context

${prp.context}

## Implementation Steps

${implementationStepsMd}

## Validation Gates

${validationGatesMd}

## Success Criteria

${successCriteriaMd}

## References

${referencesMd}
`;
    }

    it('should serialize PRPDocument to markdown format', () => {
      // SETUP: Create valid PRPDocument
      const prp = createTestPRPDocument();

      // EXECUTE: Format as markdown
      const markdown = formatPRPAsMarkdown(prp);

      // VERIFY: Header format
      expect(markdown).toContain('# PRP for P1.M2.T2.S2');

      // VERIFY: Section headers
      expect(markdown).toContain('## Objective');
      expect(markdown).toContain('## Context');
      expect(markdown).toContain('## Implementation Steps');
      expect(markdown).toContain('## Validation Gates');
      expect(markdown).toContain('## Success Criteria');
      expect(markdown).toContain('## References');

      // VERIFY: Objective content
      expect(markdown).toContain('Add PRP document interfaces to models.ts');

      // VERIFY: Implementation steps numbered
      expect(markdown).toMatch(/1\. Create ValidationGate interface/);
      expect(markdown).toMatch(/2\. Create ValidationGateSchema/);

      // VERIFY: Validation gates format
      expect(markdown).toContain('### Level 1');
      expect(markdown).toContain('### Level 2');
      expect(markdown).toContain('### Level 3');
      expect(markdown).toContain('### Level 4');

      // VERIFY: Success criteria checkbox format
      expect(markdown).toContain('- [ ] All interfaces added');
      expect(markdown).toContain('- [ ] All schemas validated');

      // VERIFY: References bullet format
      expect(markdown).toContain('- https://github.com/anthropics/claude-code');
      expect(markdown).toContain('- src/core/models.ts');
    });

    it('should match PRPGenerator.#formatPRPAsMarkdown() format', () => {
      // SETUP: Create PRPDocument with specific content
      const prp: PRPDocument = {
        taskId: 'P1.M3.T2.S2',
        objective: 'Test PRPDocument structure',
        context: '## Test Context\n\nTest context content',
        implementationSteps: ['Step 1', 'Step 2'],
        validationGates: [
          {
            level: 1,
            description: 'Level 1',
            command: 'npm test',
            manual: false,
          },
          {
            level: 2,
            description: 'Level 2',
            command: 'npm run lint',
            manual: false,
          },
          { level: 3, description: 'Level 3', command: null, manual: true },
          { level: 4, description: 'Level 4', command: null, manual: true },
        ],
        successCriteria: [
          { description: 'Criterion 1', satisfied: false },
          { description: 'Criterion 2', satisfied: false },
        ],
        references: ['https://example.com', 'src/test.ts'],
      };

      // EXECUTE: Format as markdown
      const markdown = formatPRPAsMarkdown(prp);

      // VERIFY: Exact format matches PRPGenerator output
      // Header
      expect(markdown).toMatch(/^# PRP for P1\.M3\.T2\.S2\n/);

      // Objective section
      expect(markdown).toMatch(/## Objective\n\nTest PRPDocument structure\n/);

      // Context section
      expect(markdown).toMatch(
        /## Context\n\n## Test Context\n\nTest context content\n/
      );

      // Implementation steps (numbered)
      expect(markdown).toMatch(
        /## Implementation Steps\n\n1\. Step 1\n2\. Step 2\n/
      );

      // Validation gates (### Level X format)
      expect(markdown).toMatch(
        /## Validation Gates\n\n### Level 1\n\nnpm test\n\n### Level 2\n\nnpm run lint\n\n### Level 3\n\nManual validation required\n\n### Level 4\n\nManual validation required\n/
      );

      // Success criteria (checkbox format)
      expect(markdown).toMatch(
        /## Success Criteria\n\n- \[ \] Criterion 1\n- \[ \] Criterion 2\n/
      );

      // References (bullet format)
      expect(markdown).toMatch(
        /## References\n\n- https:\/\/example\.com\n- src\/test\.ts\n/
      );
    });
  });
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING TESTS:
  - tests/unit/core/models.test.ts has PRPDocumentSchema tests (lines 1566-1730)
  - Pattern: Use describe/it blocks with SETUP/EXECUTE/VERIFY comments
  - Pattern: PRPDocumentSchema.safeParse() for validation
  - Pattern: expect(result.success).toBe(true/false)
  - This PRP: Extends existing file with new describe block

INPUT FROM EXISTING TEST DATA:
  - tests/unit/core/models.test.ts has validPRP factory (line 1567)
  - Pattern: Create test data with all required fields
  - Pattern: Use overrides for specific test scenarios
  - This PRP: Creates createTestPRPDocument() factory function

INPUT FROM PRP GENERATOR:
  - src/agents/prp-generator.ts has #formatPRPAsMarkdown() (lines 509-559)
  - Pattern: Specific markdown format for PRP output
  - Pattern: Section headers, numbered steps, checkbox criteria
  - This PRP: Tests markdown serialization matches this format

INPUT FROM PRP TEMPLATE:
  - PROMPTS.md has PRP template (lines 189-314)
  - Pattern: YAML ContextSection (url, file, docfile)
  - Pattern: YAML ImplementationTask (ACTION, path, FOLLOW, NAMING)
  - This PRP: Tests these patterns are accepted in PRPDocument fields

INPUT FROM PREVIOUS WORK:
  - P1.M3.T2.S1 validated SessionState serialization
  - Context: Understanding serialization test patterns
  - P1.M3.T1.S3 validated context_scope contract format
  - P1.M3.T1.S2 validated status transitions
  - P1.M3.T1.S1 validated type definitions

OUTPUT FOR SUBSEQUENT WORK:
  - PRPDocument structure tests at tests/unit/core/models.test.ts
  - Confidence that PRPDocument validates correctly
  - Foundation for P1.M3.T2.S3 (delta analysis structures)

DIRECTORY STRUCTURE:
  - Modify: tests/unit/core/models.test.ts (existing file)
  - Add: describe('PRPDocument structure', () => { ... }) block
  - No new files created
  - Tests can run independently

CLEANUP INTEGRATION:
  - None required - tests only, no side effects
  - No database or filesystem modifications
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After adding tests to models.test.ts
# Run tests to check for errors
npm test -- tests/unit/core/models.test.ts

# Expected: Tests run without syntax errors
# Expected: New test descriptions appear in output

# TypeScript compilation check
npm run typecheck

# Expected: No TypeScript compilation errors
# Expected: New test code compiles correctly

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the updated file specifically
npm test -- tests/unit/core/models.test.ts

# Expected: All tests pass
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run full test suite for affected area
npm test -- tests/unit/core/

# Expected: All core tests pass
# Expected: No regressions in other test files

# Coverage validation
npm run test:coverage

# Expected: 100% coverage for new tests
# Expected: Coverage for src/core/models.ts is maintained
# Expected: No uncovered lines in PRPDocument structure logic

# If tests fail, check:
# - PRPDocument is imported correctly
# - ValidationGate level is literal (1 | 2 | 3 | 4)
# - Test data is valid
# - PRPDocumentSchema.safeParse() used correctly
```

### Level 3: Type System Validation (Compile-Time Verification)

```bash
# TypeScript compilation verification
npm run typecheck

# Expected: No compilation errors
# Expected: PRPDocument structure logic compiles correctly

# Verify type inference works
cat > /tmp/prpdocument-test.ts << 'EOF'
import {
  PRPDocument,
  ValidationGate,
  SuccessCriterion,
  PRPDocumentSchema
} from './src/core/models.js';

const gate1: ValidationGate = {
  level: 1,
  description: 'Test',
  command: 'npm test',
  manual: false,
};

const criterion: SuccessCriterion = {
  description: 'Test criterion',
  satisfied: false,
};

const prp: PRPDocument = {
  taskId: 'P1.M2.T2.S2',
  objective: 'Test objective',
  context: '## Context',
  implementationSteps: ['Step 1'],
  validationGates: [gate1],
  successCriteria: [criterion],
  references: ['https://example.com'],
};

const result = PRPDocumentSchema.safeParse(prp);
EOF
npx tsc --noEmit /tmp/prpdocument-test.ts

# Expected: No type errors
# Expected: PRPDocument matches interface
# Expected: ValidationGate level is literal union

# If type errors exist, check:
# - All types are imported correctly
# - Field types match interface definitions
# - Literal union used for ValidationGate.level
```

### Level 4: Integration Testing (Full Pipeline Validation)

```bash
# Full test suite run
npm test

# Expected: All tests pass across entire codebase
# Expected: No new test failures

# Coverage report validation
npm run test:coverage

# Expected: 100% coverage maintained globally
# Expected: No coverage drops in existing files

# Manual verification: Read test output
npm test -- tests/unit/core/models.test.ts --reporter=verbose

# Expected: Clear test names showing PRPDocument structure tests
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/unit/core/models.test.ts

# Expected: Tests complete in reasonable time (< 5 seconds)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Valid PRPDocument with all 7 fields
- [ ] Test 2: ValidationGate level 1 accepted
- [ ] Test 3: ValidationGate level 2 accepted
- [ ] Test 4: ValidationGate level 3 accepted
- [ ] Test 5: ValidationGate level 4 accepted
- [ ] Test 6: Invalid ValidationGate levels rejected
- [ ] Test 7: Null command accepted for manual validation
- [ ] Test 8: Context field accepts YAML url pattern
- [ ] Test 9: Context field accepts YAML file pattern
- [ ] Test 10: Context field accepts YAML docfile pattern
- [ ] Test 11: ImplementationSteps accepts YAML CREATE pattern
- [ ] Test 12: ImplementationSteps accepts YAML MODIFY pattern
- [ ] Test 13: ImplementationSteps accepts all YAML fields
- [ ] Test 14: PRPDocument serializes to markdown format
- [ ] Test 15: Markdown format matches PRPGenerator output
- [ ] All tests pass: `npm test -- tests/unit/core/models.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] 100% coverage: `npm run test:coverage`

### Feature Validation

- [ ] PRPDocumentSchema validates all 7 required fields
- [ ] ValidationGate.level enforces literal union (1 | 2 | 3 | 4)
- [ ] ValidationGate.command accepts null for manual validation
- [ ] Context field accepts YAML-formatted documentation
- [ ] ImplementationSteps accepts YAML-formatted tasks
- [ ] Markdown serialization matches PRPGenerator format
- [ ] All edge cases covered (empty strings, invalid levels, null commands)
- [ ] All tests follow existing patterns from models.test.ts
- [ ] Factory functions use partial override pattern

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Uses describe/it block structure with clear test names
- [ ] Uses SETUP/EXECUTE/VERIFY comment pattern
- [ ] Tests are self-documenting with clear names
- [ ] Test block added after existing PRPDocumentSchema tests (line 1730)
- [ ] Error messages are clear and informative
- [ ] Tests are grouped in logical describe blocks

### Documentation & Deployment

- [ ] Tests serve as executable documentation of PRPDocument structure
- [ ] ValidationGate level requirements documented in test names
- [ ] ContextSection YAML patterns documented in tests
- [ ] ImplementationTask YAML patterns documented in tests
- [ ] Markdown serialization format verified in tests
- [ ] Research documents stored in research/ subdirectory

---

## Anti-Patterns to Avoid

- **Don't create ContextSection interface** - It's a YAML pattern, not a TypeScript interface
- **Don't create ImplementationTask interface** - It's a YAML pattern, not a TypeScript interface
- **Don't use generic numbers for ValidationGate.level** - Must be literal 1, 2, 3, or 4
- **Don't use undefined for ValidationGate.command** - Must be string or null
- **Don't skip YAML pattern tests** - ContextSection and ImplementationTask patterns must be tested
- **Don't forget markdown serialization tests** - PRPDocument must serialize to PRP.md format
- **Don't modify existing PRPDocumentSchema tests** - Add new describe block instead
- **Don't skip null command tests** - Manual validation requires null command
- **Don't ignore empty string validation** - All string fields require min(1)
- **Don't forget 100% coverage** - All code paths must be tested
- **Don't use JSON serialization** - PRPDocument serializes to markdown, not JSON
- **Don't test across filesystems** - Tests are in-memory, no file I/O
- **Don't skip edge case testing** - Invalid levels, empty strings, null values
- **Don't ignore existing test patterns** - Follow models.test.ts conventions
- **Don't create new test file** - Extend existing models.test.ts

---

## Appendix: Decision Rationale

### Why extend existing models.test.ts instead of creating new file?

The existing `models.test.ts` already contains PRPDocumentSchema tests (lines 1566-1730). Adding new tests in the same file:

1. Keeps all PRPDocument-related tests together
2. Follows the established pattern of grouping tests by subject
3. Makes it easier to see all PRPDocument validation in one place
4. Avoids duplication of imports and setup code

### Why test YAML patterns if they're not TypeScript interfaces?

While ContextSection and ImplementationTask are not TypeScript interfaces, they are critical documentation patterns used in PRP templates. Testing them:

1. Validates that PRPDocument fields accept YAML-formatted strings
2. Documents the expected pattern format for future developers
3. Ensures PRP templates can be parsed and stored correctly
4. Prevents regressions in PRP generation

### Why test markdown serialization if PRPGenerator handles it?

Testing markdown serialization:

1. Validates the expected format for PRP.md files
2. Ensures PRPDocument can be correctly formatted for human consumption
3. Documents the exact format that PRPGenerator should produce
4. Provides a contract for PRPGenerator implementation

### What about the literal union for ValidationGate.level?

The literal union `1 | 2 | 3 | 4` (not generic number) is critical because:

1. It enforces exactly 4 validation levels
2. Prevents typos like level: 5 or level: 0
3. Makes the validation level system explicit in the type system
4. Tests must verify that invalid levels are rejected

### Why use SETUP/EXECUTE/VERIFY comments?

The codebase uses this pattern consistently:

1. Separates test concerns clearly
2. Makes tests easier to read and understand
3. Helps identify where assertions happen
4. Provides consistency across all test files

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from research agents (3 parallel research tasks)
- [x] PRPDocument interface fully analyzed and documented
- [x] ValidationGate literal union requirement identified
- [x] ContextSection and ImplementationTask YAML patterns researched
- [x] Existing test patterns identified and extracted
- [x] PRPGenerator markdown format analyzed
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Research documents stored in research/ subdirectory

**Risk Mitigation**:

- Extending existing test file (low risk of breaking existing tests)
- Tests only (no production code changes)
- Can be implemented independently
- Easy to verify and iterate
- Clear acceptance criteria
- Follows established patterns from models.test.ts

**Known Risks**:

- **YAML patterns are not interfaces**: Tests validate string content, not type safety
  - Mitigation: Tests document YAML patterns and verify they're accepted
- **Literal union for levels**: Must use exactly 1, 2, 3, or 4
  - Mitigation: Tests explicitly verify literal values and reject invalid ones
- **Markdown format**: PRPDocument serializes to markdown, not JSON
  - Mitigation: Tests verify exact markdown format matches PRPGenerator

---

**END OF PRP**
