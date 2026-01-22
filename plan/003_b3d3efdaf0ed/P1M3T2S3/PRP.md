# PRP for P1.M3.T2.S3

**PRP ID**: P1.M3.T2.S3
**Work Item Title**: Verify PRP quality gates enforcement
**Generated**: 2026-01-21
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create comprehensive unit tests that verify PRP quality gates are properly enforced during PRP generation, ensuring context completeness, template structure compliance, information density standards, and self-contained PRPs.

**Deliverable**: Unit test file `tests/unit/prp-quality-gates.test.ts` with test suites for all four quality gate checks and edge case verification using PRP samples of varying quality levels.

**Success Definition**:
- All four quality gate checks (Context Completeness, Template Structure Compliance, Information Density, "No Prior Knowledge" test) are validated
- Test file follows existing test patterns from `tests/unit/prp-template-validation.test.ts`
- Edge cases for vague/incomplete PRPs are covered
- Tests pass successfully: `uv run pytest tests/unit/prp-quality-gates.test.ts -v`

## Why

- **Quality Assurance**: PRPs are the primary contract between researcher and executor agents; quality gates prevent incomplete or vague PRPs from causing implementation failures
- **System Reliability**: Enforcing quality standards reduces retry cycles and improves one-pass implementation success rate
- **Maintainability**: Comprehensive test coverage ensures quality gate logic remains robust as the system evolves
- **Integration with Existing Verification**: This task completes P1.M3.T2 (PRP Creation Prompt Verification) alongside P1.M3.T2.S1 (research process) and P1.M3.T2.S2 (template structure)

## What

**User-visible behavior**: PRP quality gates are enforced at generation time; low-quality PRPs are rejected with specific error messages indicating which quality checks failed.

**Technical Requirements**:
- Implement quality gate validation functions matching the contract definition
- Create PRP sample fixtures at various quality levels (complete, missing context, vague, incomplete structure)
- Write unit tests for each quality gate with positive and negative cases
- Follow existing test patterns from the codebase (Vitest, describe/it structure, SETUP/EXECUTE/ASSERT pattern)

### Success Criteria

- [ ] Context completeness check verifies all required inputs/outputs are present
- [ ] Template structure compliance validates all sections present
- [ ] Information density check rejects vague PRPs (low information-to-token ratio)
- [ ] "No Prior Knowledge" test ensures PRP is self-contained
- [ ] All tests pass: `uv run vitest tests/unit/prp-quality-gates.test.ts -v`
- [ ] Code follows existing patterns from `tests/unit/prp-template-validation.test.ts`

## All Needed Context

### Context Completeness Check

Before writing, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

### Documentation & References

```yaml
# MUST READ - Quality gate definitions from PROMPTS.md
- url: plan/003_b3d3efdaf0ed/PROMPTS.md
  why: Contains PRP creation prompt with quality gate definitions (lines 319-637)
  critical: "No Prior Knowledge" test, Context Completeness Check, Template Structure Compliance, Information Density Standards

# Reference implementation - Template structure validation
- file: tests/unit/prp-template-validation.test.ts
  why: Existing validation pattern to follow for test structure, parser function, validation result interface
  pattern: parsePRPStructure(), validatePRPTemplate(), ValidationResult interface, describe/it test organization
  gotcha: Uses custom parser for markdown structure; similar approach needed for quality gate validation

# PRP generator with schema validation
- file: src/agents/prp-generator.ts
  why: Shows how PRPDocumentSchema.parse() is used for validation (line 444)
  pattern: Zod schema validation with safeParse() for error handling
  gotcha: PRPGenerator only does schema validation, not quality gate validation

# Core models with PRPDocument schema
- file: src/core/models.ts
  why: PRPDocumentSchema and PRPDocument interface definition
  pattern: Zod schema for PRP validation (lines 1295-1305)
  section: PRPDocument interface (lines 1196-1269)

# PRP blueprint prompt
- file: src/agents/prompts/prp-blueprint-prompt.ts
  why: Shows how PRP prompts are constructed with task context
  pattern: createPRPBlueprintPrompt() function with structured output
  gotcha: Uses Groundswell responseFormat for type-safe validation

# Testing best practices - JavaScript Testing Best Practices
- url: https://github.com/goldbergyoni/javascript-testing-best-practices
  why: Reference for validation testing patterns, error message assertions
  section: "Testing validation logic"

# Zod validation patterns
- url: https://zod.dev/
  why: Schema validation library used throughout codebase
  section: "Error handling" for safeParse() patterns
```

### Current Codebase Tree

```bash
tests/
├── unit/
│   ├── prp-template-validation.test.ts    # Reference for test patterns
│   ├── core/                               # Core model tests
│   ├── agents/                             # Agent tests
│   └── utils/                              # Utility tests
└── setup.ts                                # Test configuration with Vitest

src/
├── agents/
│   ├── prp-generator.ts                    # PRP generation with schema validation
│   └── prompts/
│       ├── prp-blueprint-prompt.ts         # PRP prompt construction
│       └── prompts.ts                      # PRP_BLUEPRINT_PROMPT content
└── core/
    └── models.ts                           # PRPDocumentSchema definition
```

### Desired Codebase Tree with files to be added and responsibility of file

```bash
tests/
├── unit/
│   ├── prp-template-validation.test.ts    # Existing: Template structure validation
│   ├── prp-quality-gates.test.ts          # NEW: Quality gate validation tests (this task)
│   └── fixtures/
│       └── prp-samples.ts                 # NEW: PRP sample fixtures at various quality levels
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Vitest configuration in tests/setup.ts enforces z.ai API endpoint
// All tests must use z.ai, not Anthropic API (blocks Anthropic API calls)

// CRITICAL: Test file naming convention is *.test.ts (not *.spec.ts)
// Project uses .test.ts consistently

// GOTCHA: PRP parsing requires custom markdown parser
// Existing prp-template-validation.test.ts has parsePRPStructure() function
// Quality gate validation may need similar parsing or extend existing parser

// GOTCHA: Quality gates are defined in PROMPTS.md as text instructions
// Must be translated into programmatic validation logic

// CRITICAL: ESLint and TypeScript must pass
// Use: ruff check src/ --fix, mypy src/ (if Python), tsc for TypeScript

// PATTERN: Use describe/it with SETUP/EXECUTE/ASSERT comments
// Follow existing test patterns for consistency

// PATTERN: Test file location mirrors source structure
// Place unit tests in tests/unit/ alongside other unit tests
```

## Implementation Blueprint

### Data models and structure

Create the core data models and fixtures for quality gate testing.

```typescript
// tests/unit/fixtures/prp-samples.ts
// PRP sample fixtures at various quality levels for testing

import type { PRPDocument } from '../../src/core/models.js';

// Complete PRP sample - passes all quality gates
export const COMPLETE_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S1',
  objective: 'Create TypeScript interfaces for task hierarchy',
  context: `
## All Needed Context

### Context Completeness Check
Complete - all required context included.

### Documentation & References
- file: src/core/models.ts
  why: Reference for existing patterns

### Current Codebase Tree
src/
├── agents/
└── core/

### Desired Codebase Tree
src/
├── agents/
├── core/
│   └── models.ts (with Phase, Milestone, Task, Subtask interfaces)
└── utils/

### Known Gotchas
Use readonly properties for immutability.
`,
  implementationSteps: [
    'Create Phase interface',
    'Create Milestone interface',
    'Create Task interface',
    'Create Subtask interface',
  ],
  validationGates: [
    { level: 1, description: 'Syntax check', command: 'tsc --noEmit', manual: false },
    { level: 2, description: 'Unit tests', command: 'npm test', manual: false },
    { level: 3, description: 'Integration tests', command: 'npm run test:integration', manual: false },
    { level: 4, description: 'Manual review', command: null, manual: true },
  ],
  successCriteria: [
    { description: 'All interfaces defined', satisfied: false },
    { description: 'TypeScript compiles without errors', satisfied: false },
  ],
  references: ['https://www.typescriptlang.org/docs/handbook/interfaces.html'],
};

// Incomplete PRP sample - fails context completeness
export const INCOMPLETE_CONTEXT_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S2',
  objective: 'Add validation logic',
  context: '## Context\n\nSome context here...',
  implementationSteps: ['Step 1'],
  validationGates: [
    { level: 1, description: 'Test', command: 'npm test', manual: false },
    { level: 2, description: 'Test', command: 'npm test', manual: false },
    { level: 3, description: 'Test', command: 'npm test', manual: false },
    { level: 4, description: 'Manual', command: null, manual: true },
  ],
  successCriteria: [{ description: 'Done', satisfied: false }],
  references: [],
};

// Vague PRP sample - fails information density check
export const VAGUE_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S3',
  objective: 'Implement the feature',
  context: `
## Context

Please implement the feature properly. Follow best practices.
Use good coding standards and make sure it works well.

### Documentation
Check the docs for more info.
`,
  implementationSteps: [
    'Do the implementation',
    'Make it work',
    'Test it',
  ],
  validationGates: [
    { level: 1, description: 'Test', command: 'npm test', manual: false },
    { level: 2, description: 'Test', command: 'npm test', manual: false },
    { level: 3, description: 'Test', command: 'npm test', manual: false },
    { level: 4, description: 'Manual', command: null, manual: true },
  ],
  successCriteria: [{ description: 'Feature works', satisfied: false }],
  references: [],
};

// Missing sections PRP - fails template structure compliance
export const MISSING_SECTIONS_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S4',
  objective: 'Create something',
  context: '',
  implementationSteps: [],
  validationGates: [
    { level: 1, description: 'Test', command: 'npm test', manual: false },
    { level: 2, description: 'Test', command: 'npm test', manual: false },
    { level: 3, description: 'Test', command: 'npm test', manual: false },
    { level: 4, description: 'Manual', command: null, manual: true },
  ],
  successCriteria: [],
  references: [],
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/fixtures/prp-samples.ts
  - IMPLEMENT: PRP sample fixtures (COMPLETE_PRP, INCOMPLETE_CONTEXT_PRP, VAGUE_PRP, MISSING_SECTIONS_PRP)
  - FOLLOW pattern: Create test fixtures following PRPDocument interface
  - NAMING: UPPER_CASE for fixture constants
  - PLACEMENT: tests/unit/fixtures/ directory (create if needed)
  - DEPENDENCIES: Import PRPDocument type from src/core/models.js

Task 2: CREATE tests/unit/prp-quality-gates.test.ts
  - IMPLEMENT: Quality gate validation test suite with describe/it blocks
  - FOLLOW pattern: tests/unit/prp-template-validation.test.ts structure
  - NAMING: prp-quality-gates.test.ts (use .test.ts extension)
  - PLACEMENT: tests/unit/ directory alongside other unit tests
  - DEPENDENCIES: Import fixtures from Task 1, PRPDocumentSchema from src/core/models.js

Task 3: IMPLEMENT Context Completeness Check tests
  - VERIFY: All required context sections present (Documentation & References, Codebase Tree, Gotchas)
  - TEST: Complete PRP passes, incomplete context fails
  - PATTERN: describe('context completeness check', () => { it('should pass for complete PRP', ...); })
  - COVERAGE: Positive case (complete), negative case (missing sections)

Task 4: IMPLEMENT Template Structure Compliance tests
  - VERIFY: All required sections present (Goal, Why, What, Context, Implementation Blueprint, Validation Loop, Final Validation Checklist, Anti-Patterns)
  - TEST: PRPs with missing sections fail validation
  - PATTERN: Similar to existing prp-template-validation.test.ts approach
  - COVERAGE: Each required section checked individually

Task 5: IMPLEMENT Information Density Check tests
  - VERIFY: PRP contains specific, actionable content (not vague placeholders)
  - TEST: Vague PRPs fail, detailed PRPs pass
  - METRIC: Information-to-token ratio or keyword density analysis
  - COVERAGE: Detects "implement properly", "follow best practices" without specifics

Task 6: IMPLEMENT "No Prior Knowledge" Test
  - VERIFY: PRP is self-contained without external dependencies not explicitly referenced
  - TEST: PRPs with undefined references fail, self-contained PRPs pass
  - CHECK: All file references are specific (no "some file in src/")
  - COVERAGE: References are accessible, context is complete

Task 7: IMPLEMENT Edge Case Tests
  - VERIFY: Quality gates handle malformed PRPs gracefully
  - TEST: Empty strings, null values, extremely short PRPs
  - COVERAGE: Error messages are specific and actionable
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Test structure following existing codebase conventions
// From tests/unit/prp-template-validation.test.ts

describe('unit/prp-quality-gates', () => {
  describe('context completeness check', () => {
    it('should pass for PRP with complete context', () => {
      // ARRANGE: Use COMPLETE_PRP fixture
      // ACT: Run context completeness validation
      // ASSERT: Expect validation to pass
    });

    it('should fail for PRP with missing context sections', () => {
      // ARRANGE: Use INCOMPLETE_CONTEXT_PRP fixture
      // ACT: Run context completeness validation
      // ASSERT: Expect validation to fail with specific error
    });
  });

  describe('template structure compliance', () => {
    // Similar pattern for each required section
  });

  describe('information density check', () => {
    it('should detect vague PRPs with low information content', () => {
      // Test VAGUE_PRP fixture fails density check
    });

    it('should pass PRPs with specific, actionable details', () => {
      // Test COMPLETE_PRP fixture passes density check
    });
  });

  describe('"No Prior Knowledge" test', () => {
    it('should detect PRPs requiring external knowledge', () => {
      // Test PRPs with undefined references fail
    });

    it('should pass self-contained PRPs', () => {
      // Test COMPLETE_PRP passes self-contained check
    });
  });
});

// PATTERN: Validation result interface (from existing tests)
interface QualityGateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// PATTERN: Quality gate validation function
function validateContextCompleteness(prp: PRPDocument): QualityGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required context sections
  const requiredSections = [
    'Documentation & References',
    'Current Codebase Tree',
    'Desired Codebase Tree',
    'Known Gotchas',
  ];

  for (const section of requiredSections) {
    if (!prp.context.includes(section)) {
      errors.push(`Missing required context section: ${section}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// GOTCHA: Information density measurement requires heuristics
// Count specific indicators: file paths, URLs, code examples, specific commands
function calculateInformationDensity(prp: PRPDocument): number {
  const content = prp.context + prp.implementationSteps.join('\n');

  // Count specific information markers
  const filePatterns = (content.match(/[\w-]+\.[\w]+/g) || []).length; // File extensions
  const urlPatterns = (content.match(/https?:\/\//g) || []).length; // URLs
  const codeBlocks = (content.match(/```/g) || []).length / 2; // Code blocks
  const specificCommands = (content.match(/\$\s+\w+/g) || []).length; // Commands

  // Calculate density score
  const totalLength = content.length;
  if (totalLength === 0) return 0;

  const densityScore = (filePatterns + urlPatterns + codeBlocks + specificCommands) / (totalLength / 1000);
  return densityScore;
}

// CRITICAL: Use Vitest assertions, not Jest
import { describe, expect, it } from 'vitest';
```

### Integration Points

```yaml
TEST_FRAMEWORK:
  - add to: tests/unit/prp-quality-gates.test.ts
  - pattern: "import { describe, expect, it } from 'vitest';"

FIXTURES:
  - add to: tests/unit/fixtures/prp-samples.ts
  - pattern: "export const FIXTURE_NAME: PRPDocument = { ... };"

SCHEMA_VALIDATION:
  - import from: src/core/models.js
  - pattern: "import { PRPDocument, PRPDocumentSchema } from '../../src/core/models.js';"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit tests/unit/fixtures/prp-samples.ts    # Type check fixtures
npx tsc --noEmit tests/unit/prp-quality-gates.test.ts # Type check test file

# Lint with ESLint/Ruff (project uses Ruff for Python, ESLint for TypeScript)
npx eslint tests/unit/fixtures/prp-samples.ts --fix
npx eslint tests/unit/prp-quality-gates.test.ts --fix

# Expected: Zero type errors, zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new quality gates test file
uv run vitest tests/unit/prp-quality-gates.test.ts -v

# Run all unit tests to ensure no regressions
uv run vitest tests/unit/ -v

# Coverage validation
uv run vitest tests/unit/ --coverage

# Expected: All tests pass, coverage reports generated
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify tests work with existing test suite
uv run vitest run --reporter=verbose

# Test that fixtures can be imported and used
node -e "import('./tests/unit/fixtures/prp-samples.ts').then(m => console.log('Fixtures loaded'))"

# Expected: All integration points work, fixtures are importable
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual verification of quality gate effectiveness

# Test 1: Generate a low-quality PRP manually and verify it's rejected
echo "Testing quality gate rejection of vague PRP"

# Test 2: Review error messages for clarity and actionability
echo "Error messages should specify which quality gate failed and why"

# Test 3: Verify complete PRP passes all quality gates
echo "Confirm COMPLETE_PRP fixture passes all checks"

# Expected: Quality gates effectively filter low-quality PRPs, error messages are helpful
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `uv run vitest tests/unit/prp-quality-gates.test.ts -v`
- [ ] No type errors: `npx tsc --noEmit tests/unit/`
- [ ] No linting errors: `npx eslint tests/unit/`
- [ ] Fixtures are properly typed: PRPDocument interface

### Feature Validation

- [ ] Context completeness check validates all required sections
- [ ] Template structure compliance detects missing sections
- [ ] Information density check rejects vague PRPs
- [ ] "No Prior Knowledge" test ensures self-contained PRPs
- [ ] Edge cases are covered (empty PRPs, malformed content)

### Code Quality Validation

- [ ] Follows existing test patterns from `tests/unit/prp-template-validation.test.ts`
- [ ] File placement matches desired codebase tree structure
- [ ] Fixture naming uses UPPER_CASE constants
- [ ] Test organization uses describe/it with SETUP/EXECUTE/ASSERT comments

### Documentation & Deployment

- [ ] Code is self-documenting with clear function names
- [ ] Test descriptions are specific and descriptive
- [ ] Error messages in validation results are actionable

---

## Anti-Patterns to Avoid

- ❌ Don't create quality gate validation in PRPGenerator (it only does schema validation)
- ❌ Don't skip fixture creation - hardcoding PRP samples in tests makes tests harder to maintain
- ❌ Don't use Jest-specific APIs - project uses Vitest
- ❌ Don't forget to validate context content, not just structure (information density check)
- ❌ Don't create vague quality gate checks - be specific about what constitutes a failure
- ❌ Don't ignore existing test patterns - follow the established conventions
- ❌ Don't use .spec.ts file extension - project uses .test.ts
