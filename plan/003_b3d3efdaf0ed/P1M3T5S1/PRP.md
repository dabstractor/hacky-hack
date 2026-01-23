# Product Requirement Prompt (PRP)

**Work Item**: P1.M3.T5.S1 - Verify Bug Finding Prompt testing phases

---

## Goal

**Feature Goal**: Create an integration test that verifies the Bug Finding Prompt (BUG_HUNT_PROMPT) contains all required testing phases and specifies comprehensive testing categories including happy path, edge case, workflow, and adversarial testing.

**Deliverable**: Integration test file `tests/integration/bug-finding-prompt.test.ts` with comprehensive verification of:

- All three testing phases (Scope Analysis, Creative E2E Testing, Adversarial Testing)
- Happy path testing specifications
- Edge case testing specifications
- Workflow testing specifications
- Adversarial testing mindset

**Success Definition**:

- Test file passes with 100% coverage of the verification logic
- All assertions correctly validate BUG_HUNT_PROMPT content structure
- Test follows existing codebase patterns and conventions
- Test provides clear failure messages if prompt structure changes

---

## User Persona

**Target User**: QA Engineer and Test Infrastructure Developer

**Use Case**: Verify that the Bug Finding Prompt used by QA agents contains all required testing phases and categories as specified in the PRD requirements (lines 1059-1175 of PROMPTS.md).

**User Journey**:

1. Developer runs `npm test` to execute test suite
2. Integration test loads BUG_HUNT_PROMPT from source
3. Test verifies prompt contains all three testing phases
4. Test verifies prompt specifies happy path, edge case, workflow, and adversarial testing
5. Test passes if prompt structure is correct, fails otherwise

**Pain Points Addressed**:

- Ensures prompt completeness before QA agents use it
- Prevents regression if prompt content is accidentally modified
- Provides automated verification of prompt compliance with PRD requirements

---

## Why

- **PRD Requirement Compliance**: The PRD (PROMPTS.md lines 1059-1175) defines a comprehensive Bug Finding Prompt with three specific testing phases. This test ensures those phases are present.
- **Quality Assurance**: The BUG_HUNT_PROMPT is critical for finding bugs in implemented features. Verifying its structure ensures thorough testing.
- **Regression Prevention**: Automated tests catch if prompt content is accidentally removed or modified during refactoring.
- **Documentation**: Test serves as living documentation of expected prompt structure.

---

## What

Create an integration test file that verifies the BUG_HUNT_PROMPT constant contains all required testing phases and categories.

### Success Criteria

- [ ] Test file created at `tests/integration/bug-finding-prompt.test.ts`
- [ ] Test verifies Phase 1: PRD Scope Analysis is present
- [ ] Test verifies Phase 2: Creative End-to-End Testing is present with all 8 categories
- [ ] Test verifies Phase 3: Adversarial Testing is present with all 5 categories
- [ ] Test verifies happy path testing specifications
- [ ] Test verifies edge case testing specifications (boundaries, empty inputs, unicode)
- [ ] Test verifies workflow testing specifications
- [ ] Test verifies adversarial testing mindset
- [ ] All tests pass with 100% code coverage
- [ ] Test follows existing codebase patterns

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

✅ This PRP provides:

- Complete BUG_HUNT_PROMPT content with line numbers
- Existing test patterns and file locations
- Vitest configuration details
- Mock patterns for agent testing
- Factory function patterns for test data
- Assertion patterns used in codebase
- File naming conventions

### Documentation & References

```yaml
# PRIMARY SOURCE - Bug Finding Prompt Definition
- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: Contains BUG_HUNT_PROMPT constant definition (lines 868-979)
  critical: This is the actual prompt content being tested
  section: Lines 868-979

# PRIMARY SOURCE - PRD Prompt Specification
- url: file:///home/dustin/projects/hacky-hack/PROMPTS.md
  why: Contains the specification for BUG_FINDING_PROMPT
  critical: Defines requirements for what the prompt must contain
  section: Lines 1059-1175

# IMPLEMENTATION REFERENCE - BugHuntWorkflow
- url: file:///home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts
  why: Shows how the prompt is used in the workflow, includes phase methods
  pattern: Phase methods (analyzeScope, creativeE2ETesting, adversarialTesting)
  gotcha: Workflow uses logging categories that should match prompt phases

# TEST PATTERN REFERENCE - Bug Hunt Prompt Unit Tests
- url: file:///home/dustin/projects/hacky-hack/tests/unit/agents/prompts/bug-hunt-prompt.test.ts
  why: Shows existing patterns for testing prompt content
  pattern: Uses .toContain() for phrase verification, .toMatch() for regex
  gotcha: Tests createBugHuntPrompt() function, not BUG_HUNT_PROMPT directly

# TEST PATTERN REFERENCE - Bug Hunt Workflow Integration Tests
- url: file:///home/dustin/projects/hacky-hack/tests/integration/bug-hunt-workflow-integration.test.ts
  why: Shows integration test patterns with mocked agents
  pattern: Factory functions for test data, mock setup patterns
  gotcha: Uses vi.mock() for agent factory to avoid LLM calls

# TEST PATTERN REFERENCE - QA Agent Tests
- url: file:///home/dustin/projects/hacky-hack/tests/integration/qa-agent.test.ts
  why: Shows how to test prompt structure and phase verification
  pattern: Phase execution order verification, content verification
  gotcha: Dynamic import pattern for Groundswell dependencies

# VITEST CONFIGURATION
- url: file:///home/dustin/projects/hacky-hack/vitest.config.ts
  why: Shows test configuration, coverage requirements (100% threshold)
  pattern: environment: 'node', globals: true, setupFiles: ['./tests/setup.ts']
  critical: All tests must pass with 100% coverage

# TEST SETUP
- url: file:///home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test hooks, mock cleanup, z.ai API validation
  pattern: beforeEach/afterEach hooks for cleanup
  gotcha: Tests will fail if ANTHROPIC_BASE_URL points to Anthropic API

# TESTING BEST PRACTICES - Vitest Documentation
- url: https://vitest.dev/guide/
  why: Official Vitest documentation for test patterns
  critical: Understanding of describe/it/expect patterns

# ASSERTION API - Vitest Expect
- url: https://vitest.dev/api/expect.html
  why: Complete reference for toContain(), toMatch(), toHaveLength(), etc.
  pattern: expect(value).toContain(substring)

# MOCKING API - Vitest Mock
- url: https://vitest.dev/api/mock.html
  why: Documentation for vi.mock(), vi.fn(), vi.clearAllMocks()
  pattern: Module-level mocking for external dependencies

# RESEARCH DOCUMENTATION
- docfile: plan/003_b3d3efdaf0ed/P1M3T5S1/research/bug-finding-prompt-research.md
  why: Comprehensive research on BUG_HUNT_PROMPT structure and test patterns
  section: Complete analysis of prompt phases and existing test patterns
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── coverage/                    # Test coverage reports
├── docs/                        # Documentation
├── plan/                        # Plan directories (PRDs, PRPs)
│   └── 003_b3d3efdaf0ed/
│       └── P1M3T5S1/
│           └── research/        # Research documentation
├── scripts/                     # Utility scripts
├── src/
│   ├── agents/
│   │   ├── agent-factory.ts     # Agent creation (mock this)
│   │   └── prompts.ts           # BUG_HUNT_PROMPT definition (lines 868-979)
│   ├── workflows/
│   │   └── bug-hunt-workflow.ts # BugHuntWorkflow implementation
│   └── ...
├── tests/
│   ├── fixtures/                # Test data fixtures
│   ├── integration/             # Integration tests (TARGET DIRECTORY)
│   │   ├── qa-agent.test.ts     # QA agent integration tests
│   │   ├── bug-hunt-workflow-integration.test.ts
│   │   └── **NEW** bug-finding-prompt.test.ts (TO BE CREATED)
│   ├── manual/                  # Manual tests
│   ├── unit/                    # Unit tests
│   │   ├── agents/
│   │   │   └── prompts/
│   │   │       └── bug-hunt-prompt.test.ts  # Prompt function tests
│   │   └── workflows/
│   │       └── bug-hunt-workflow.test.ts    # Workflow unit tests
│   └── setup.ts                 # Global test setup
├── PROMPTS.md                   # PRD with prompt specifications
├── PRD.md                       # Product requirements document
├── vitest.config.ts             # Vitest configuration
└── package.json                 # Dependencies and scripts
```

### Desired Codebase Tree (New Files)

```bash
tests/integration/
└── bug-finding-prompt.test.ts   # NEW: Integration test for BUG_HUNT_PROMPT verification
    ├── Import BUG_HUNT_PROMPT constant
    ├── Test suite structure
    │   ├── Phase 1: PRD Scope Analysis verification
    │   ├── Phase 2: Creative E2E Testing verification
    │   │   ├── Happy Path Testing
    │   │   ├── Edge Case Testing
    │   │   ├── Workflow Testing
    │   │   └── (other categories)
    │   └── Phase 3: Adversarial Testing verification
    └── Assertions for all required content
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Dynamic import pattern required for prompts
// BUG_HUNT_PROMPT is in src/agents/prompts.ts which imports Groundswell
// Groundswell initialization may have side effects, so use dynamic import
const { BUG_HUNT_PROMPT } = await import('../../src/agents/prompts.js');

// CRITICAL: z.ai API endpoint validation in tests/setup.ts
// Tests will fail if ANTHROPIC_BASE_URL is set to Anthropic's official API
// This safeguard prevents accidental production API usage during testing

// GOTCHA: Vitest requires .js extensions for ES module imports
// Even though source files are .ts, imports in test files must use .js
import { something } from '../../src/agents/prompts.js';

// PATTERN: Factory functions for test data
// Use factory functions to create test data consistently
const createTestTask = (id: string, title: string): Task => ({ id, title, ... });

// PATTERN: Mock agent factory to avoid LLM calls
vi.mock('../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));

// PATTERN: Use .toContain() for exact phrase matching
expect(prompt).toContain('Happy Path Testing');

// PATTERN: Use .toMatch() for regex pattern matching
expect(prompt).toMatch(/Happy Path Testing.*primary use case/s);

// CRITICAL: 100% code coverage requirement
// vitest.config.ts sets all thresholds to 100%
// All test code must be executed by tests
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// No new data models required
// Test uses existing types from src/core/models.ts
// BUG_HUNT_PROMPT is a string constant

// Type from existing codebase:
type Task = {
  id: string;
  type: 'Task';
  title: string;
  status: Status;
  description: string;
  subtasks: Subtask[];
};
```

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: CREATE tests/integration/bug-finding-prompt.test.ts
  - IMPLEMENT: Integration test suite for BUG_HUNT_PROMPT verification
  - FOLLOW pattern: tests/integration/qa-agent.test.ts (structure, organization)
  - NAMING: bug-finding-prompt.test.ts (integration test naming convention)
  - PLACEMENT: tests/integration/ directory (integration tests location)

Task 2: IMPLEMENT test file structure and imports
  - IMPLEMENT: Import Vitest functions (describe, expect, it, beforeAll)
  - IMPLEMENT: Dynamic import for BUG_HUNT_PROMPT constant
  - FOLLOW pattern: tests/integration/qa-agent.test.ts (import patterns)
  - GOTCHA: Use dynamic import to avoid Groundswell initialization side effects
  - CODE:
    ```typescript
    import { describe, expect, it, beforeAll } from 'vitest';

    // Dynamic import to avoid Groundswell initialization
    let realPromptExports: any;
    beforeAll(async () => {
      realPromptExports = await import('../../src/agents/prompts.js');
    });
    ```

Task 3: IMPLEMENT Phase 1: PRD Scope Analysis verification
  - IMPLEMENT: Test suite for Phase 1 content verification
  - VERIFY: "Phase 1: PRD Scope Analysis" is present
  - VERIFY: "Read and deeply understand the original PRD requirements" is present
  - VERIFY: "Map each requirement to what should have been implemented" is present
  - VERIFY: "Identify the expected user journeys and workflows" is present
  - VERIFY: "Note any edge cases or corner cases implied by the requirements" is present
  - FOLLOW pattern: tests/unit/agents/prompts/bug-hunt-prompt.test.ts (content verification)
  - ASSERTIONS: Use expect().toContain() for exact phrase matching

Task 4: IMPLEMENT Phase 2: Creative E2E Testing verification
  - IMPLEMENT: Test suite for Phase 2 content verification
  - VERIFY: "Phase 2: Creative End-to-End Testing" is present
  - VERIFY: "Happy Path Testing" is present with "Does the primary use case work as specified?"
  - VERIFY: "Edge Case Testing" is present with "boundaries", "empty inputs", "max values", "unicode"
  - VERIFY: "Workflow Testing" is present with "full journey"
  - VERIFY: "Integration Testing" is present
  - VERIFY: "Error Handling" is present with "graceful"
  - VERIFY: "State Testing" is present with "state transitions"
  - VERIFY: "Concurrency Testing" is present
  - VERIFY: "Regression Testing" is present
  - FOLLOW pattern: tests/unit/agents/prompts/bug-hunt-prompt.test.ts (category verification)
  - ASSERTIONS: Use expect().toContain() for each category

Task 5: IMPLEMENT Phase 3: Adversarial Testing verification
  - IMPLEMENT: Test suite for Phase 3 content verification
  - VERIFY: "Phase 3: Adversarial Testing" is present
  - VERIFY: "Think like a user, then think like an adversary" is present
  - VERIFY: "Unexpected Inputs" is present
  - VERIFY: "Missing Features" is present with "PRD ask for that might not be implemented"
  - VERIFY: "Incomplete Features" is present
  - VERIFY: "Implicit Requirements" is present
  - VERIFY: "User Experience Issues" is present
  - FOLLOW pattern: tests/integration/qa-agent.test.ts (adversarial category verification)
  - ASSERTIONS: Use expect().toContain() for each category

Task 6: IMPLEMENT comprehensive prompt structure test
  - IMPLEMENT: Test that verifies all 4 phases are present
  - VERIFY: "Phase 1: PRD Scope Analysis"
  - VERIFY: "Phase 2: Creative End-to-End Testing"
  - VERIFY: "Phase 3: Adversarial Testing"
  - VERIFY: "Phase 4: Documentation as Bug Report"
  - FOLLOW pattern: tests/unit/agents/prompts/bug-hunt-prompt.test.ts (phase verification)
  - ASSERTIONS: Use expect().toContain() for each phase header

Task 7: IMPLEMENT adversarial testing mindset verification
  - IMPLEMENT: Test that verifies the adversarial mindset is defined
  - VERIFY: "creative QA engineer and bug hunter" role is defined
  - VERIFY: "Think like a user, then think like an adversary" instruction
  - VERIFY: "Think creatively about what could go wrong" instruction
  - FOLLOW pattern: tests/integration/qa-agent.test.ts (mindset verification)
  - ASSERTIONS: Use expect().toContain() for mindset phrases
````

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Dynamic Import for Prompts
// GOTCHA: Groundswell may have side effects on import
// SOLUTION: Use beforeAll hook with dynamic import
describe('BUG_HUNT_PROMPT verification', () => {
  let realPromptExports: any;

  beforeAll(async () => {
    realPromptExports = await import('../../src/agents/prompts.js');
  });

  // Tests now use realPromptExports.BUG_HUNT_PROMPT
});

// Pattern 2: Test Organization Mirrors Prompt Structure
// ORGANIZE: Tests follow the same hierarchy as the prompt
describe('BUG_HUNT_PROMPT verification', () => {
  describe('Phase 1: PRD Scope Analysis', () => {
    it('should contain phase header', () => {
      /* ... */
    });
    it('should contain scope analysis instructions', () => {
      /* ... */
    });
  });

  describe('Phase 2: Creative End-to-End Testing', () => {
    describe('Happy Path Testing', () => {
      it('should contain category name', () => {
        /* ... */
      });
      it('should contain testing guidance', () => {
        /* ... */
      });
    });
    // ... other categories
  });

  describe('Phase 3: Adversarial Testing', () => {
    // ... adversarial category tests
  });
});

// Pattern 3: Assertion Styles for Different Content
// EXACT PHRASE: Use .toContain() for exact string matching
expect(prompt).toContain('Happy Path Testing');

// REGEX: Use .toMatch() for pattern matching with context
expect(prompt).toMatch(/Happy Path Testing.*primary use case/s);

// MULTIPLE: Loop through arrays of expected phrases
const expectedPhases = [
  'Phase 1: PRD Scope Analysis',
  'Phase 2: Creative End-to-End Testing',
  'Phase 3: Adversarial Testing',
];
expectedPhases.forEach(phase => {
  expect(prompt).toContain(phase);
});

// Pattern 4: Descriptive Test Names
// USE: Full sentences that describe what is being tested
it(
  'should contain "Happy Path Testing" category with "primary use case" guidance'
);
it(
  'should contain "Edge Case Testing" with "empty inputs, max values, unicode" examples'
);
it('should verify adversarial testing mindset is defined');

// Pattern 5: Test Data Constants
// DEFINE: Test constants at top of describe block for maintainability
describe('BUG_HUNT_PROMPT verification', () => {
  const SCOPE_ANALYSIS_PHASE = 'Phase 1: PRD Scope Analysis';
  const E2E_TESTING_PHASE = 'Phase 2: Creative End-to-End Testing';
  const ADVERSARIAL_TESTING_PHASE = 'Phase 3: Adversarial Testing';

  const HAPPY_PATH_CATEGORY = 'Happy Path Testing';
  const EDGE_CASE_CATEGORY = 'Edge Case Testing';
  // ... etc
});
```

### Integration Points

```yaml
# No integration points with other components
# This test verifies static prompt content only
# No API calls, file I/O, or external dependencies

# IMPORTS:
- import { describe, expect, it, beforeAll } from 'vitest'
- dynamic import of ../../src/agents/prompts.js

# MOCKS:
- None required (testing static string constant)

# CONFIG:
- Uses vitest.config.ts configuration
- Uses tests/setup.ts for global hooks
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/bug-finding-prompt.test.ts
# Or:
npx eslint tests/integration/bug-finding-prompt.test.ts --fix

# Expected: Zero linting errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the specific test file
npm test -- tests/integration/bug-finding-prompt.test.ts

# Or with Vitest directly:
npx vitest run tests/integration/bug-finding-prompt.test.ts

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full integration test suite
npm test -- tests/integration/

# Verify test is included in suite
npx vitest run tests/integration/ --reporter=verbose

# Expected: All integration tests pass, including new test file
```

### Level 4: Coverage Validation

```bash
# Generate coverage report
npm run test:coverage

# Or with Vitest:
npx vitest run --coverage

# Expected: 100% coverage for new test file
# vitest.config.ts requires 100% coverage thresholds
```

---

## Final Validation Checklist

### Technical Validation

- [ ] File created at `tests/integration/bug-finding-prompt.test.ts`
- [ ] All tests pass: `npm test -- tests/integration/bug-finding-prompt.test.ts`
- [ ] No linting errors: `npm run lint -- tests/integration/bug-finding-prompt.test.ts`
- [ ] 100% coverage achieved for test file
- [ ] Test follows existing codebase patterns

### Feature Validation

- [ ] Phase 1: PRD Scope Analysis verified (all 4 elements present)
- [ ] Phase 2: Creative E2E Testing verified (all 8 categories present)
- [ ] Phase 3: Adversarial Testing verified (all 5 categories present)
- [ ] Happy path testing specifications verified
- [ ] Edge case testing specifications verified (boundaries, empty inputs, unicode)
- [ ] Workflow testing specifications verified
- [ ] Adversarial testing mindset verified
- [ ] All success criteria from "What" section met

### Code Quality Validation

- [ ] Test organization mirrors prompt structure hierarchy
- [ ] Descriptive test names that clearly indicate what is being tested
- [ ] Proper use of beforeAll for dynamic imports
- [ ] Assertions use appropriate matchers (toContain vs toMatch)
- [ ] Test constants defined for maintainability
- [ ] No anti-patterns from existing codebase

### Documentation & Deployment

- [ ] Test serves as living documentation of BUG_HUNT_PROMPT structure
- [ ] Test failure messages clearly indicate what content is missing
- [ ] Test is discoverable and understandable by other developers

---

## Anti-Patterns to Avoid

- ❌ Don't use static imports for prompts (use dynamic import in beforeAll)
- ❌ Don't test createBugHuntPrompt() function (test BUG_HUNT_PROMPT constant directly)
- ❌ Don't create mocks for agent factory (not testing agents, testing prompt content)
- ❌ Don't use vague test names like "should have phase 1" (use descriptive names)
- ❌ Don't skip testing individual testing categories (be comprehensive)
- ❌ Don't hardcode prompt content in tests (use the actual constant)
- ❌ Don't ignore linting or coverage errors (fix before committing)
