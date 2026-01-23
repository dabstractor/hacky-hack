# Product Requirement Prompt (PRP): Verify PRP Template Structure Compliance

**PRP ID**: P1.M3.T2.S2
**Work Item Title**: Verify PRP template structure compliance
**Generated**: 2026-01-21
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create a unit test file that validates PRP (Product Requirement Prompt) markdown files comply with the template structure defined in PROMPTS.md (lines 319-637), ensuring all required sections, subsections, and content formats are present.

**Deliverable**: Unit test file `tests/unit/prp-template-validation.test.ts` with:

- PRP markdown parser that extracts sections, subsections, and code blocks
- Template structure validator that verifies required sections and subsections
- Test cases for valid PRP samples and invalid PRP scenarios
- 100% code coverage

**Success Definition**:

- Parser correctly extracts all 9 required sections from PRP markdown files
- Validator correctly identifies missing sections, subsections, and content blocks
- All test cases pass including valid PRP samples and invalid scenarios
- Test file follows existing Vitest patterns from the codebase
- Tests can be run with `vitest run tests/unit/prp-template-validation.test.ts`

## User Persona

**Target User**: Developer/QA Engineer running the test suite to verify PRP template compliance.

**Use Case**: Validating that generated PRP files follow the required template structure before they are used for implementation.

**User Journey**:

1. Developer creates or modifies a PRP file
2. Test suite runs during CI/CD or local development
3. Parser reads PRP markdown file and extracts structure
4. Validator checks structure against required template sections
5. Tests fail immediately if required sections/subsections are missing
6. Developer fixes PRP file structure and re-runs tests

**Pain Points Addressed**:

- Detects incomplete PRP files before implementation starts
- Validates template structure programmatically (no manual review needed)
- Catches missing sections that would cause implementation failures
- Ensures consistency across all generated PRP files

## Why

- **System Validation**: Ensures PRP files maintain complete template structure for one-pass implementation success
- **Documentation**: Tests serve as executable documentation of PRP template requirements
- **Regression Prevention**: Catches PRP generation bugs that produce malformed output
- **Integration with Existing Tests**: Extends existing unit test coverage in `tests/unit/` directory
- **Template Compliance**: Validates against PROMPTS.md template definition (lines 319-637)

## What

Create a unit test file that parses PRP markdown files and validates their structure against the required template sections defined in PROMPTS.md.

### Success Criteria

- [ ] Parser function created that extracts sections, subsections, and code blocks from PRP markdown
- [ ] Validator function created that checks required sections and subsections are present
- [ ] Test file created at `tests/unit/prp-template-validation.test.ts`
- [ ] Tests verify all 9 required sections: Goal, User Persona (optional), Why, What, All Needed Context, Implementation Blueprint, Validation Loop, Final Validation Checklist, Anti-Patterns to Avoid
- [ ] Tests verify required subsections for each section (e.g., Goal has Feature Goal, Deliverable, Success Definition)
- [ ] Tests verify Validation Loop has exactly 4 levels with bash commands
- [ ] Tests verify Anti-Patterns section lists common mistakes
- [ ] Tests use valid PRP sample from `plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md`
- [ ] Tests cover invalid scenarios (missing sections, missing subsections, missing code blocks)
- [ ] All tests pass when run with `vitest run tests/unit/prp-template-validation.test.ts`
- [ ] 100% code coverage achieved

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, would they have everything needed to implement this successfully? **YES** - This PRP provides specific file paths, PRP template structure, parsing strategy, test patterns, and reference PRP samples.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: PROMPTS.md
  why: Source of PRP template definition with all required sections (lines 319-637)
  pattern: Look for <PRP-TEMPLATE> block with sections: Goal, User Persona, Why, What, All Needed Context, Implementation Blueprint, Validation Loop, Final Validation Checklist, Anti-Patterns to Avoid
  gotcha: User Persona is optional but has required subsections if present

- file: vitest.config.ts
  why: Vitest configuration with test file patterns and coverage requirements
  pattern: Tests pattern is `tests/**/*.{test,spec}.ts}`, coverage threshold is 100%
  gotcha: Use ESM imports with .js extension for TypeScript files

- file: tests/unit/agents/prompts.test.ts
  why: Reference implementation for unit testing prompt content and structure
  pattern: describe blocks grouping related tests, expect().toContain() for string validation
  gotcha: Tests validate string content, not actual LLM behavior

- file: tests/integration/prp-create-prompt.test.ts
  why: Reference for prompt structure validation test patterns (from P1.M3.T2.S1)
  pattern: Nested describe blocks, JSDoc comments, cleanup in afterEach
  gotcha: This tests prompt content, your test tests PRP template structure (different focus)

- file: plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md
  why: Valid PRP sample to use as test fixture for positive test cases
  pattern: Contains all 9 required sections with proper subsections and code blocks
  gotcha: This is a real PRP file, use as reference for expected structure

- docfile: plan/003_b3d3efdaf0ed/P1M3T2S2/research/prp-template-structure.md
  why: Complete documentation of PRP template structure extracted from PROMPTS.md
  section: Required PRP Template Sections (9 total) - lists all sections and subsections

- docfile: plan/003_b3d3efdaf0ed/P1M3T2S2/research/vitest-patterns.md
  why: Standard Vitest unit test patterns used in this codebase
  section: Test File Organization, Common Test Patterns

- docfile: plan/003_b3d3efdaf0ed/P1M3T2S2/research/prp-parsing-strategy.md
  why: Detailed parsing strategy for extracting PRP structure from markdown
  section: Parsing Strategy, Validation Approach

- docfile: plan/003_b3d3efdaf0ed/P1M3T2S2/research/previous-prp-dependencies.md
  why: Dependencies from P1.M3.T2.S1 to leverage and things to avoid duplicating
  section: Things NOT to Duplicate, Key Gotchas
```

### Current Codebase tree

```bash
/home/dustin/projects/hacky-hack/
├── PROMPTS.md                           # PRP template definition (lines 319-637)
├── vitest.config.ts                     # Vitest configuration
├── plan/
│   ├── 001_14b9dc2a33c7/                # Session with valid PRP samples
│   │   └── P1M1T1S1/
│   │       └── PRP.md                   # Valid PRP sample for test fixture
│   └── 003_b3d3efdaf0ed/                # Current session
│       └── P1M3T2S2/
│           ├── PRP.md                   # This file
│           └── research/                # Research documents
└── tests/
    ├── unit/                            # Unit tests (67 files)
    │   ├── agents/
    │   │   └── prompts.test.ts          # Reference for prompt validation tests
    │   └── core/
    │       └── models.test.ts           # Reference for schema validation tests
    └── integration/                     # Integration tests
        └── prp-create-prompt.test.ts    # P1.M3.T2.S1 output (different focus)
```

### Desired Codebase tree with files to be added

```bash
tests/
└── unit/
    └── prp-template-validation.test.ts   # NEW: Unit test for PRP template structure validation
        # - parsePRPStructure(): Parse markdown into sections/subsections/codeblocks
        # - validatePRPTemplate(): Validate structure against required template
        # - Tests for valid PRP samples
        # - Tests for invalid PRP scenarios (missing sections/subsections)
        # - Tests for Validation Loop 4-level requirement
        # - Tests for Anti-Patterns section requirement
```

### Known Gotchas of our codebase & Library Quirks

````typescript
// CRITICAL: Vitest requires ESM imports with .js extension
// Even though source files are .ts, imports use .js extension
import { PRP_BLUEPRINT_PROMPT } from '../../src/agents/prompts.js';

// CRITICAL: Test file naming uses .test.ts suffix
// NOT .spec.ts (though .spec.ts is also supported by vitest.config.ts)
// Pattern: tests/{unit|integration}/{feature-name}.test.ts

// CRITICAL: Coverage threshold is 100%
// All new code must have 100% test coverage
// Run: npx vitest run --coverage

// CRITICAL: Section detection uses ## for main sections, ### for subsections
// PRP template has 9 required sections with specific subsections
// Don't confuse level 2 headers (##) with level 3 headers (###)

// CRITICAL: User Persona section is OPTIONAL
// But if present, it MUST have all 4 subsections:
// Target User, Use Case, User Journey, Pain Points Addressed

// CRITICAL: Validation Loop MUST have exactly 4 levels
// Level 1: Syntax & Style, Level 2: Unit Tests, Level 3: Integration Testing, Level 4: Creative & Domain-Specific
// Each level must have bash code blocks with commands

// CRITICAL: Anti-Patterns section MUST have at least one anti-pattern
// Format: "- ❌ Don't do something"
// The ❌ emoji is required for each anti-pattern

// CRITICAL: Code block detection must handle nested blocks
// Use state machine approach: track when entering/exiting code blocks
// Code blocks start with ``` and end with ```

// CRITICAL: YAML blocks are a type of code block
// Format: ```yaml ... ```
// Must detect language type for proper validation
````

## Implementation Blueprint

### Data models and structure

Create TypeScript interfaces for PRP structure validation.

```typescript
// Types for PRP parsing and validation
interface PRPSection {
  name: string;
  content: string[];
  subsections: Map<string, PRPSubsection>;
}

interface PRPSubsection {
  name: string;
  content: string[];
  codeBlocks: CodeBlock[];
}

interface CodeBlock {
  language: string;
  content: string[];
}

interface PRPStructure {
  sections: Map<string, PRPSection>;
  metadata?: {
    prpId?: string;
    title?: string;
    generated?: string;
    status?: string;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Zod schemas for runtime validation (optional, for type safety)
import { z } from 'zod';

const CodeBlockSchema = z.object({
  language: z.string(),
  content: z.array(z.string()),
});

const PRPSubsectionSchema = z.object({
  name: z.string(),
  content: z.array(z.string()),
  codeBlocks: z.array(CodeBlockSchema),
});

const PRPSectionSchema = z.object({
  name: z.string(),
  content: z.array(z.string()),
  subsections: z.map(z.string(), PRPSubsectionSchema),
});

const PRPStructureSchema = z.object({
  sections: z.map(z.string(), PRPSectionSchema),
  metadata: z
    .object({
      prpId: z.string().optional(),
      title: z.string().optional(),
      generated: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
});
```

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: CREATE tests/unit/prp-template-validation.test.ts skeleton
  - IMPLEMENT: Basic test file structure with imports and describe block
  - FOLLOW pattern: tests/unit/agents/prompts.test.ts (import style, describe structure)
  - NAMING: describe('unit/prp-template-validation', () => {...})
  - PLACEMENT: tests/unit/prp-template-validation.test.ts

Task 2: IMPLEMENT parsePRPStructure() function
  - IMPLEMENT: Parser that extracts sections, subsections, and code blocks from markdown
  - FOLLOW pattern: Line-by-line parsing with state machine approach
  - NAMING: function parsePRPStructure(content: string): PRPStructure
  - LOGIC: Detect ## sections, ### subsections, ``` code blocks
  - EDGE CASES: Handle empty files, missing sections, malformed markdown
  - PLACEMENT: Top of test file (utility function for tests)

Task 3: IMPLEMENT validatePRPTemplate() function
  - IMPLEMENT: Validator that checks PRP structure against required template
  - FOLLOW pattern: Check required sections, then required subsections, then content requirements
  - NAMING: function validatePRPTemplate(structure: PRPStructure): ValidationResult
  - VALIDATE: 9 required sections (Goal, Why, What, All Needed Context, Implementation Blueprint, Validation Loop, Final Validation Checklist, Anti-Patterns to Avoid)
  - VALIDATE: Required subsections for each section (see research/prp-template-structure.md)
  - VALIDATE: Validation Loop has 4 levels
  - VALIDATE: Anti-Patterns has at least one anti-pattern
  - PLACEMENT: After parsePRPStructure() function

Task 4: ADD test for valid PRP sample
  - IMPLEMENT: Test that valid PRP passes all validation checks
  - FOLLOW pattern: tests/unit/core/models.test.ts (positive test case pattern)
  - NAMING: it('should validate a valid PRP structure', () => {...})
  - FIXTURE: Read plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md as sample
  - VERIFY: All 9 sections present, all subsections present, Validation Loop has 4 levels
  - PLACEMENT: First test in describe block

Task 5: ADD tests for missing required sections
  - IMPLEMENT: Tests that detect missing required sections
  - FOLLOW pattern: tests/unit/core/models.test.ts (negative test case pattern)
  - NAMING: it('should detect missing Goal section', () => {...})
  - SCENARIOS: Missing Goal, Missing Why, Missing What, Missing All Needed Context, Missing Implementation Blueprint, Missing Validation Loop, Missing Final Validation Checklist, Missing Anti-Patterns to Avoid
  - VERIFY: ValidationResult contains error for missing section
  - PLACEMENT: describe('missing required sections', () => {...}) block

Task 6: ADD tests for missing required subsections
  - IMPLEMENT: Tests that detect missing required subsections
  - FOLLOW pattern: tests/unit/core/models.test.ts (subsection validation pattern)
  - NAMING: it('should detect missing Feature Goal subsection', () => {...})
  - SCENARIOS: Missing Feature Goal, Missing Deliverable, Missing Success Definition, Missing Context Completeness Check, Missing Documentation & References, Missing Current Codebase tree, Missing Desired Codebase tree, Missing Known Gotchas
  - VERIFY: ValidationResult contains error for missing subsection
  - PLACEMENT: describe('missing required subsections', () => {...}) block

Task 7: ADD tests for Validation Loop 4-level requirement
  - IMPLEMENT: Tests that verify Validation Loop has exactly 4 levels
  - FOLLOW pattern: tests/unit/core/models.test.ts (specific requirement validation)
  - NAMING: it('should detect missing validation levels', () => {...})
  - VERIFY: Level 1, Level 2, Level 3, Level 4 all present
  - VERIFY: Each level has bash code blocks
  - VERIFY: Error if less than 4 levels
  - PLACEMENT: describe('validation loop requirements', () => {...}) block

Task 8: ADD tests for Anti-Patterns section requirement
  - IMPLEMENT: Tests that verify Anti-Patterns section has at least one anti-pattern
  - FOLLOW pattern: tests/unit/core/models.test.ts (content requirement validation)
  - NAMING: it('should detect missing anti-patterns', () => {...})
  - VERIFY: At least one "- ❌" pattern found
  - VERIFY: Error if no anti-patterns present
  - PLACEMENT: describe('anti-patterns requirements', () => {...}) block

Task 9: ADD tests for optional User Persona section
  - IMPLEMENT: Tests that verify User Persona validation when present
  - FOLLOW pattern: tests/unit/core/models.test.ts (optional field validation)
  - NAMING: it('should validate User Persona when present', () => {...})
  - VERIFY: If User Persona present, must have all 4 subsections
  - VERIFY: If User Persona absent, no error
  - PLACEMENT: describe('optional User Persona section', () => {...}) block

Task 10: ADD tests for edge cases
  - IMPLEMENT: Tests for malformed markdown and edge cases
  - FOLLOW pattern: tests/unit/core/models.test.ts (edge case testing)
  - NAMING: it('should handle empty PRP content', () => {...})
  - SCENARIOS: Empty content, only metadata, no subsections, no code blocks, nested code blocks
  - VERIFY: Appropriate errors or warnings
  - PLACEMENT: describe('edge cases', () => {...}) block
````

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// PATTERN 1: Test file structure (from tests/unit/agents/prompts.test.ts)
// ============================================================================
import { describe, expect, it, beforeEach } from 'vitest';

// ============================================================================
// PATTERN 2: Parser function with state machine
// ============================================================================
function parsePRPStructure(content: string): PRPStructure {
  const lines = content.split('\n');
  const sections: Map<string, PRPSection> = new Map();
  const metadata: NonNullable<PRPStructure['metadata']> = {};

  let currentSection: PRPSection | null = null;
  let currentSubsection: PRPSubsection | null = null;
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent: string[] = [];

  // GOTCHA: Must track state for nested structures
  // State: section -> subsection -> code block
  for (const line of lines) {
    // Detect metadata (frontmatter before first ##)
    if (!currentSection && line.match(/^\*\*PRP ID\*\*/)) {
      const match = line.match(/^\*\*PRP ID\*\*:\s*(.+)$/);
      if (match) metadata.prpId = match[1].trim();
      continue;
    }

    // CRITICAL: Detect section headers (## Section Name)
    if (line.match(/^##\s+(.+)$/)) {
      const sectionName = line.match(/^##\s+(.+)$/)?.[1]?.trim();
      if (sectionName) {
        currentSection = {
          name: sectionName,
          content: [],
          subsections: new Map(),
        };
        sections.set(sectionName, currentSection);
        currentSubsection = null;
      }
      continue;
    }

    // CRITICAL: Detect subsection headers (### Subsection Name)
    if (line.match(/^###\s+(.+)$/) && currentSection) {
      const subsectionName = line.match(/^###\s+(.+)$/)?.[1]?.trim();
      if (subsectionName) {
        currentSubsection = {
          name: subsectionName,
          content: [],
          codeBlocks: [],
        };
        currentSection.subsections.set(subsectionName, currentSubsection);
      }
      continue;
    }

    // CRITICAL: Detect code block start/end (```language)
    if (line.match(/^```(\w*)$/)) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLanguage = line.match(/^```(\w*)$/)?.[1] || '';
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        if (currentSubsection) {
          currentSubsection.codeBlocks.push({
            language: codeBlockLanguage,
            content: [...codeBlockContent],
          });
        }
        codeBlockContent = [];
        codeBlockLanguage = '';
      }
      continue;
    }

    // Add content to current context
    if (inCodeBlock) {
      codeBlockContent.push(line);
    } else if (currentSubsection) {
      currentSubsection.content.push(line);
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  return { sections, metadata };
}

// ============================================================================
// PATTERN 3: Validator function with detailed error reporting
// ============================================================================
function validatePRPTemplate(structure: PRPStructure): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // CRITICAL: Check all 9 required sections
  const requiredSections = [
    'Goal',
    'Why',
    'What',
    'All Needed Context',
    'Implementation Blueprint',
    'Validation Loop',
    'Final Validation Checklist',
    'Anti-Patterns to Avoid',
  ];

  for (const sectionName of requiredSections) {
    if (!structure.sections.has(sectionName)) {
      errors.push(`Missing required section: ${sectionName}`);
    }
  }

  // CRITICAL: Check Goal subsections (all required)
  const goalSection = structure.sections.get('Goal');
  if (goalSection) {
    const requiredGoalSubsections = [
      'Feature Goal',
      'Deliverable',
      'Success Definition',
    ];
    for (const subsectionName of requiredGoalSubsections) {
      if (!goalSection.subsections.has(subsectionName)) {
        errors.push(
          `Goal section missing required subsection: ${subsectionName}`
        );
      }
    }
  }

  // CRITICAL: Check User Persona subsections (if section exists)
  const userPersonaSection = structure.sections.get('User Persona');
  if (userPersonaSection) {
    const requiredPersonaSubsections = [
      'Target User',
      'Use Case',
      'User Journey',
      'Pain Points Addressed',
    ];
    for (const subsectionName of requiredPersonaSubsections) {
      if (!userPersonaSection.subsections.has(subsectionName)) {
        errors.push(
          `User Persona section missing required subsection: ${subsectionName}`
        );
      }
    }
  }

  // CRITICAL: Check Validation Loop has 4 levels
  const validationLoopSection = structure.sections.get('Validation Loop');
  if (validationLoopSection) {
    const levels = Array.from(validationLoopSection.subsections.keys()).filter(
      name => name.match(/^Level \d+/)
    );

    if (levels.length < 4) {
      errors.push(`Validation Loop must have 4 levels, found ${levels.length}`);
    }

    // CRITICAL: Each level must have bash code blocks
    for (const level of levels) {
      const subsection = validationLoopSection.subsections.get(level);
      if (subsection) {
        const hasBashBlock = subsection.codeBlocks.some(
          block => block.language === 'bash'
        );
        if (!hasBashBlock) {
          warnings.push(`${level} missing bash code block with commands`);
        }
      }
    }
  }

  // CRITICAL: Check Anti-Patterns has at least one anti-pattern
  const antiPatternsSection = structure.sections.get('Anti-Patterns to Avoid');
  if (antiPatternsSection) {
    const hasAntiPattern = antiPatternsSection.content.some(line =>
      line.includes('❌')
    );
    if (!hasAntiPattern) {
      errors.push(
        'Anti-Patterns section must contain at least one anti-pattern (❌ format)'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// PATTERN 4: Test using valid PRP sample fixture
// ============================================================================
describe('unit/prp-template-validation', () => {
  it('should validate a valid PRP structure', () => {
    // ARRANGE: Read valid PRP sample
    const validPRPContent = readFileSync(
      '/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md',
      'utf-8'
    );

    // ACT: Parse and validate
    const structure = parsePRPStructure(validPRPContent);
    const result = validatePRPTemplate(structure);

    // ASSERT: Should be valid
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing Goal section', () => {
    // ARRANGE: Create PRP without Goal section
    const invalidPRP = `
## Why
- Business value
`;

    // ACT: Parse and validate
    const structure = parsePRPStructure(invalidPRP);
    const result = validatePRPTemplate(structure);

    // ASSERT: Should have error
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required section: Goal');
  });
});
````

### Integration Points

```yaml
TEST_RUNNER:
  - command: "vitest run tests/unit/prp-template-validation.test.ts"
  - pattern: "npx vitest" for watch mode, "vitest run" for single run
  - coverage: "npx vitest run tests/unit/prp-template-validation.test.ts --coverage"

FIXTURE_FILES:
  - valid_prp: "plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md"
  - pattern: Read with fs.readFileSync() in test setup

EXISTING_TESTS:
  - reference: tests/unit/agents/prompts.test.ts
  - pattern: describe('unit/{feature}', () => {...})
  - structure: Nested describe blocks for logical grouping

TYPE_IMPORTS:
  - imports: "vitest" for describe/it/expect
  - gotcha: Use .js extension for TypeScript file imports
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit tests/unit/prp-template-validation.test.ts

# Project-wide validation
npx tsc --noEmit

# Expected: Zero TypeScript errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new test file
npx vitest run tests/unit/prp-template-validation.test.ts

# Test all unit tests
npx vitest run tests/unit/

# Coverage validation
npx vitest run tests/unit/prp-template-validation.test.ts --coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify test is discovered by Vitest
npx vitest run tests/unit/ --reporter=verbose | grep prp-template-validation

# Verify parser can read actual PRP files
node -e "const fs = require('fs'); const content = fs.readFileSync('plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md', 'utf-8'); console.log('PRP length:', content.length);"

# Verify test runs with other unit tests
npx vitest run tests/unit/agents/prompts.test.ts tests/unit/prp-template-validation.test.ts

# Expected: All tests pass, test is discovered and runs successfully
```

### Level 4: Domain-Specific Validation

```bash
# Template Structure Validation:
# Verify parser correctly identifies all 9 required sections
npx vitest run tests/unit/prp-template-validation.test.ts -t "should validate a valid PRP structure"

# Missing Section Detection:
# Verify validator catches missing sections
npx vitest run tests/unit/prp-template-validation.test.ts -t "should detect missing"

# Validation Loop Requirements:
# Verify 4-level validation is enforced
npx vitest run tests/unit/prp-template-validation.test.ts -t "validation loop"

# Expected: All domain-specific validations pass
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Test file created at correct path: tests/unit/prp-template-validation.test.ts
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All tests pass: `npx vitest run tests/unit/prp-template-validation.test.ts`
- [ ] 100% code coverage achieved

### Feature Validation

- [ ] parsePRPStructure() correctly extracts all 9 required sections
- [ ] parsePRPStructure() correctly extracts subsections
- [ ] parsePRPStructure() correctly extracts code blocks with language detection
- [ ] validatePRPTemplate() detects missing required sections
- [ ] validatePRPTemplate() detects missing required subsections
- [ ] validatePRPTemplate() validates Validation Loop has 4 levels
- [ ] validatePRPTemplate() validates Anti-Patterns has at least one anti-pattern
- [ ] Tests cover valid PRP samples from plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md
- [ ] Tests cover invalid scenarios (missing sections, missing subsections)

### Code Quality Validation

- [ ] Follows existing test patterns from tests/unit/agents/prompts.test.ts
- [ ] Uses Vitest best practices (describe/it/expect)
- [ ] Parser handles edge cases (empty content, malformed markdown)
- [ ] Validator provides detailed error messages
- [ ] Test names follow 'should [expected behavior]' pattern

### Documentation & Deployment

- [ ] JSDoc comments explain parser and validator functions
- [ ] Test groups organized with describe blocks
- [ ] Error messages are clear and actionable
- [ ] Tests serve as executable documentation of PRP template requirements

---

## Anti-Patterns to Avoid

- ❌ Don't duplicate P1.M3.T2.S1 test coverage (that tests prompt content, this tests template structure)
- ❌ Don't use regex for complex parsing - use state machine approach for nested structures
- ❌ Don't forget to handle optional User Persona section (must validate subsections if present)
- ❌ Don't skip Validation Loop 4-level check (this is a critical requirement)
- ❌ Don't skip Anti-Patterns section check (must have at least one ❌ pattern)
- ❌ Don't hardcode PRP file paths - make tests maintainable with constants
- ❌ Don't ignore edge cases (empty files, malformed markdown, nested code blocks)
- ❌ Don't forget to detect code block language for bash command validation
