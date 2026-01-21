# Product Requirement Prompt (PRP)

**PRP ID**: P1.M3.T1.S1
**Work Item Title**: Verify Task Breakdown Prompt structure and content
**Generated**: 2026-01-21
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Verify the TASK_BREAKDOWN_PROMPT structure and content requirements to ensure the architect agent receives complete, validated prompt definitions.

**Deliverable**: Integration test file `tests/integration/task-breakdown-prompt.test.ts` with comprehensive validation of the TASK_BREAKDOWN_PROMPT constant.

**Success Definition**:
- Integration test file created at `tests/integration/task-breakdown-prompt.test.ts`
- Test verifies all 5 prompt structure requirements from contract definition
- Test validates prompt content against PROMPTS.md specification (lines 54-169)
- All tests pass with `npm run test:run tests/integration/task-breakdown-prompt.test.ts`
- 100% coverage for the new test file

---

## Why

- **System Integrity**: The TASK_BREAKDOWN_PROMPT is the foundational system prompt for the Architect Agent, which drives all task breakdown. Missing or incorrect prompt content leads to incorrect task hierarchies.
- **Prevent Regression**: As prompts evolve from separate markdown files to TypeScript constants, integration tests ensure no content is lost or malformed.
- **Contract Compliance**: The contract definition in P1.M3.T1.S1 specifies 5 specific requirements that must be validated.
- **Documentation Alignment**: Ensures the actual prompt in `src/agents/prompts.ts` matches the specification in `PROMPTS.md`.

---

## What

Create an integration test that validates the TASK_BREAKDOWN_PROMPT constant contains all required sections and content for the Lead Technical Architect & Project Synthesizer role.

### Success Criteria

- [ ] Test file created at `tests/integration/task-breakdown-prompt.test.ts`
- [ ] Test verifies architect role definition: "LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER"
- [ ] Test verifies research-driven architecture requirement (spawn subagents before planning)
- [ ] Test verifies strict JSON output format to `./$TASKS_FILE`
- [ ] Test verifies implicit TDD approach (tests part of subtask, not separate)
- [ ] Test verifies context_scope requirements (INPUT/OUTPUT/MOCKING)
- [ ] All tests pass with `npm run test:run tests/integration/task-breakdown-prompt.test.ts`

---

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with this codebase would need:
- Location of TASK_BREAKDOWN_PROMPT constant
- The 5 requirements from the contract definition
- The original PROMPTS.md specification
- Existing test patterns to follow
- Vitest configuration and test execution

All context is provided below.

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: /home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: Contains TASK_BREAKDOWN_PROMPT constant (lines 33-146) - the actual prompt to validate
  pattern: Exported const template string with markdown content
  gotcha: Prompt is a template literal with embedded newlines and markdown formatting

- file: /home/dustin/projects/hacky-hack/PROMPTS.md
  why: Original specification for TASK_BREAKDOWN_SYSTEM_PROMPT (lines 54-169)
  pattern: Markdown document with prompt definitions
  section: Lines 54-169 contain the complete TASK_BREAKDOWN_SYSTEM_PROMPT specification

- file: /home/dustin/projects/hacky-hack/tests/unit/agents/prompts.test.ts
  why: Existing unit test pattern for prompt validation - shows basic content validation approach
  pattern: Simple string inclusion tests with expect().toContain()
  gotcha: This is unit test level - integration test should be more comprehensive

- file: /home/dustin/projects/hacky-hack/tests/integration/prp-blueprint-agent.test.ts
  why: Integration test pattern to follow - shows describe/beforeEach/afterEach structure
  pattern: Loads real data from plan directory, validates with BacklogSchema
  gotcha: Uses real tasks.json file for validation

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test configuration - shows coverage requirements and test patterns
  pattern: Test files match `tests/**/*.{test,spec}.ts`, 100% coverage required
  gotcha: Global setup file enforces API endpoint safeguards

- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test setup - understand environment variable handling and mock cleanup
  pattern: afterEach cleanup, vi.clearAllMocks(), unhandled promise rejection tracking
  gotcha: Forces z.ai API endpoint usage
```

### Current Codebase Tree

```bash
tests/
├── integration/
│   ├── prp-blueprint-agent.test.ts    # Pattern for integration tests
│   ├── prp-create-prompt.test.ts       # More integration test examples
│   └── ...
├── unit/
│   └── agents/
│       └── prompts.test.ts             # Existing prompt unit tests
├── setup.ts                            # Global test configuration
└── e2e/
    └── ...

src/agents/
└── prompts.ts                          # Contains TASK_BREAKDOWN_PROMPT constant
```

### Desired Codebase Tree

```bash
tests/
├── integration/
│   ├── task-breakdown-prompt.test.ts   # NEW: Integration test for TASK_BREAKDOWN_PROMPT
│   ├── prp-blueprint-agent.test.ts
│   └── ...
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Vitest requires specific import patterns
// - Use 'vitest' for test utilities, not 'jest'
// - Global APIs are enabled (describe, it, expect available without import)

// CRITICAL: Test file naming convention
// - Must be *.test.ts or *.spec.ts to be discovered by vitest
// - Integration tests go in tests/integration/

// CRITICAL: Mock cleanup
// - Always use afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); })
// - Prevents test leakage between tests

// CRITICAL: String content validation
// - TASK_BREAKDOWN_PROMPT is a template literal with embedded newlines
// - Use .toContain() for content validation, not exact string matching
// - Markdown code blocks use ```json format

// CRITICAL: 100% coverage requirement
// - All new code must be tested
// - Coverage reporter: v8 provider
// - Threshold: all metrics at 100%
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models required. This test validates existing string constant content.

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE tests/integration/task-breakdown-prompt.test.ts
  - IMPLEMENT: Integration test file with comprehensive TASK_BREAKDOWN_PROMPT validation
  - FOLLOW pattern: tests/integration/prp-blueprint-agent.test.ts (describe/beforeEach/afterEach structure)
  - NAMING: Use `integration/task-breakdown-prompt` as the top-level describe block
  - PLACEMENT: tests/integration/ directory
  - IMPORTS: Import TASK_BREAKDOWN_PROMPT from src/agents/prompts.ts, vi and expect from 'vitest'

Task 2: IMPLEMENT test suite - Prompt Export and Loading
  - VERIFY: TASK_BREAKDOWN_PROMPT is exported as string
  - VERIFY: Prompt length is greater than 100 characters
  - PATTERN: Follow tests/unit/agents/prompts.test.ts line 25-28
  - ASSERTION: expect(typeof TASK_BREAKDOWN_PROMPT).toBe('string')

Task 3: IMPLEMENT test suite - Architect Role Definition (Requirement a)
  - VERIFY: Prompt contains "LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER"
  - VERIFY: Prompt contains "> **ROLE:**" heading
  - VERIFY: Prompt contains "> **CONTEXT:**" heading
  - VERIFY: Prompt contains "> **GOAL:**" heading
  - PATTERN: Use expect().toContain() for string inclusion
  - REFERENCE: PROMPTS.md lines 57-61

Task 4: IMPLEMENT test suite - Research-Driven Architecture (Requirement b)
  - VERIFY: Prompt contains "RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)" section
  - VERIFY: Prompt contains "VALIDATE BEFORE BREAKING DOWN"
  - VERIFY: Prompt contains "SPAWN SUBAGENTS"
  - VERIFY: Prompt specifies storing findings in `$SESSION_DIR/architecture/`
  - PATTERN: Verify section header and bullet points
  - REFERENCE: PROMPTS.md lines 76-82

Task 5: IMPLEMENT test suite - Strict JSON Output Format (Requirement c)
  - VERIFY: Prompt contains "OUTPUT FORMAT" section
  - VERIFY: Prompt contains JSON schema structure with "backlog" array
  - VERIFY: Prompt specifies writing to `./$TASKS_FILE`
  - VERIFY: Prompt contains "Do NOT output JSON to the conversation"
  - VERIFY: Prompt contains JSON structure for Phase/Milestone/Task/Subtask hierarchy
  - PATTERN: Validate JSON schema keywords and output path
  - REFERENCE: PROMPTS.md lines 96-145

Task 6: IMPLEMENT test suite - Implicit TDD Approach (Requirement d)
  - VERIFY: Prompt contains "IMPLICIT TDD & QUALITY" section
  - VERIFY: Prompt contains "DO NOT create subtasks for 'Write Tests.'"
  - VERIFY: Prompt contains "IMPLIED WORKFLOW: Assume every subtask implies"
  - VERIFY: Prompt contains test-first approach description
  - PATTERN: Verify TDD section and anti-pattern for separate test tasks
  - REFERENCE: PROMPTS.md lines 89-93

Task 7: IMPLEMENT test suite - Context Scope Requirements (Requirement e)
  - VERIFY: Prompt contains "THE 'CONTEXT SCOPE' BLINDER" section
  - VERIFY: Prompt specifies INPUT/OUTPUT/MOCKING requirements
  - VERIFY: Prompt context_scope template includes CONTRACT DEFINITION pattern
  - VERIFY: JSON schema shows context_scope as string field in Subtask
  - PATTERN: Validate section content and JSON schema
  - REFERENCE: PROMPTS.md lines 95-102 and line 135

Task 8: IMPLEMENT test suite - Hierarchy Definitions
  - VERIFY: Prompt contains "HIERARCHY DEFINITIONS" section
  - VERIFY: Prompt defines Phase, Milestone, Task, Subtask with time scales
  - VERIFY: Prompt specifies Subtask story points (0.5, 1, or 2 SP, max 2)
  - PATTERN: Verify hierarchy definitions and story point constraints
  - REFERENCE: PROMPTS.md lines 65-70

Task 9: IMPLEMENT test suite - Process Section
  - VERIFY: Prompt contains "PROCESS" section with "ULTRATHINK & PLAN"
  - VERIFY: Prompt specifies 4-step process: ANALYZE, RESEARCH, DETERMINE, DECOMPOSE
  - PATTERN: Verify process steps are documented
  - REFERENCE: PROMPTS.md lines 105-116

Task 10: IMPLEMENT cleanup and test organization
  - ADD: afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); })
  - ENSURE: No test leakage between test suites
  - PATTERN: Follow tests/integration/prp-blueprint-agent.test.ts lines 25-29
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Integration test file structure

import { afterEach, describe, expect, it, vi } from 'vitest';
import { TASK_BREAKDOWN_PROMPT } from '../../src/agents/prompts.js';

describe('integration/task-breakdown-prompt', () => {
  // CLEANUP: Always restore mocks after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // PATTERN: Group tests by requirement
  describe('prompt export and loading', () => {
    it('should export TASK_BREAKDOWN_PROMPT as a string', () => {
      expect(typeof TASK_BREAKDOWN_PROMPT).toBe('string');
      expect(TASK_BREAKDOWN_PROMPT.length).toBeGreaterThan(100);
    });
  });

  // PATTERN: Test suite for each requirement
  describe('requirement (a): architect role definition', () => {
    it('should define Lead Technical Architect & Project Synthesizer role', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('LEAD TECHNICAL ARCHITECT');
      expect(TASK_BREAKDOWN_PROMPT).toContain('PROJECT SYNTHESIZER');
    });

    it('should define role context and goal', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('> **ROLE:**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('> **CONTEXT:**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('> **GOAL:**');
    });
  });

  // GOTCHA: Section headers use markdown format
  // Reference: PROMPTS.md uses ## for sections
  describe('requirement (b): research-driven architecture', () => {
    it('should require validation before breaking down', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('RESEARCH-DRIVEN ARCHITECTURE');
      expect(TASK_BREAKDOWN_PROMPT).toContain('VALIDATE BEFORE BREAKING DOWN');
    });

    it('should specify spawning subagents for research', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('SPAWN SUBAGENTS');
    });

    it('should require storing findings in architecture directory', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('$SESSION_DIR/architecture/');
    });
  });

  // CRITICAL: JSON output format must be exact
  describe('requirement (c): strict JSON output format', () => {
    it('should specify output to ./tasks.json file', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('./$TASKS_FILE');
      expect(TASK_BREAKDOWN_PROMPT).toContain('Do NOT output JSON to the conversation');
    });

    it('should define JSON structure with backlog array', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('"backlog": [');
      expect(TASK_BREAKDOWN_PROMPT).toContain('"type": "Phase"');
      expect(TASK_BREAKDOWN_PROMPT).toContain('"type": "Milestone"');
      expect(TASK_BREAKDOWN_PROMPT).toContain('"type": "Task"');
      expect(TASK_BREAKDOWN_PROMPT).toContain('"type": "Subtask"');
    });
  });

  // PATTERN: Validate implicit TDD requirements
  describe('requirement (d): implicit TDD approach', () => {
    it('should forbid separate test subtasks', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('DO NOT create subtasks for "Write Tests."');
    });

    it('should define implied test-first workflow', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('IMPLIED WORKFLOW:');
      expect(TASK_BREAKDOWN_PROMPT).toContain('Write the failing test -> Implement the code -> Pass the test');
    });
  });

  // CRITICAL: Context scope requirements are detailed
  describe('requirement (e): context scope requirements', () => {
    it('should define context scope blinder section', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('THE "CONTEXT SCOPE" BLINDER');
    });

    it('should specify INPUT/OUTPUT/MOCKING requirements', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('INPUT:');
      expect(TASK_BREAKDOWN_PROMPT).toContain('OUTPUT:');
      expect(TASK_BREAKDOWN_PROMPT).toContain('MOCKING:');
    });

    it('should include context_scope in JSON schema', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('"context_scope":');
    });
  });

  // ADDITIONAL: Validate supporting sections
  describe('hierarchy definitions', () => {
    it('should define four hierarchy levels', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('**PHASE:**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('**MILESTONE:**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('**TASK:**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('**SUBTASK:**');
    });

    it('should specify subtask story point limits', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('0.5, 1, or 2 Story Points');
      expect(TASK_BREAKDOWN_PROMPT).toContain('Max 2 SP');
    });
  });

  describe('process section', () => {
    it('should define ULTRATHINK & PLAN process', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('ULTRATHINK & PLAN');
      expect(TASK_BREAKDOWN_PROMPT).toContain('**ANALYZE**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('**RESEARCH**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('**DETERMINE**');
      expect(TASK_BREAKDOWN_PROMPT).toContain('**DECOMPOSE**');
    });
  });
});
```

### Integration Points

```yaml
IMPORTS:
  - from: 'vitest'
    imports: afterEach, describe, expect, it, vi
    pattern: Global test APIs

  - from: '../../src/agents/prompts.js'
    imports: TASK_BREAKDOWN_PROMPT
    pattern: ES module import with .js extension

TEST_SUITE:
  - add to: tests/integration/
  - naming: task-breakdown-prompt.test.ts (kebab-case, .test.ts suffix)
  - describe block: 'integration/task-breakdown-prompt'
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run test:run tests/integration/task-breakdown-prompt.test.ts

# Expected: All tests pass. If failing, debug root cause.
# Check for import errors, typos in test descriptions, assertion failures.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the integration test specifically
npm run test:run tests/integration/task-breakdown-prompt.test.ts

# Run all integration tests to ensure no regression
npm run test:run tests/integration/

# Coverage validation for new test file
npm run test:coverage tests/integration/task-breakdown-prompt.test.ts

# Expected: All tests pass, 100% coverage for the new test file
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify test file is discovered by vitest
npm run test:run tests/integration/task-breakdown-prompt.test.ts --reporter=verbose

# Verify no impact on existing prompt tests
npm run test:run tests/unit/agents/prompts.test.ts

# Full integration test suite
npm run test:run tests/integration/

# Expected: New test passes, existing tests still pass
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Verify prompt content matches PROMPTS.md specification
# Manually compare prompt sections against PROMPTS.md lines 54-169

# Test with real prompt loading
node -e "import('./src/agents/prompts.js').then(m => console.log(m.TASK_BREAKDOWN_PROMPT.slice(0, 200)))"

# Expected: Prompt loads correctly, all sections present and properly formatted
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:run tests/integration/task-breakdown-prompt.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Test file at correct path: `tests/integration/task-breakdown-prompt.test.ts`

### Feature Validation

- [ ] All 5 requirements from contract definition are tested:
  - [ ] (a) Architect role and responsibilities
  - [ ] (b) Research-driven architecture (spawn subagents)
  - [ ] (c) Strict JSON output format
  - [ ] (d) Implicit TDD approach
  - [ ] (e) Context scope requirements
- [ ] Hierarchy definitions validated
- [ ] Process section validated
- [ ] Test follows existing patterns from `tests/integration/prp-blueprint-agent.test.ts`

### Code Quality Validation

- [ ] Follows existing test patterns and naming conventions
- [ ] File placement matches desired codebase tree structure
- [ ] afterEach cleanup properly implemented
- [ ] Test descriptions are clear and descriptive
- [ ] No hardcoded values that should be constants

### Documentation & Deployment

- [ ] Test file includes JSDoc comments describing purpose
- [ ] References to PROMPTS.md lines are accurate
- [ ] No external dependencies added
- [ ] Test is self-documenting with clear describe/it blocks

---

## Anti-Patterns to Avoid

- ❌ Don't create unit tests instead of integration tests - this must be in `tests/integration/`
- ❌ Don't skip validating the JSON schema structure - it's critical for the output format
- ❌ Don't forget afterEach cleanup - tests can leak state
- ❌ Don't use exact string matching - use `toContain()` for flexibility
- ❌ Don't assume prompt content - verify against PROMPTS.md specification
- ❌ Don't hardcode line numbers - prompt content may shift but sections should remain
- ❌ Don't skip testing the context_scope JSON field - it's a key requirement
- ❌ Don't ignore the template literal format - newlines and whitespace matter
