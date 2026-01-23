# PRP for P1.M3.T2.S1 - Verify PRP Creation Prompt research process

## Goal

**Feature Goal**: Create an integration test file that validates the PRP_CREATE_PROMPT (PRP_BLUEPRINT_PROMPT) contains all required instructions for the research process workflow.

**Deliverable**: Integration test file `tests/integration/prp-create-prompt.test.ts` with comprehensive test coverage of the PRP_CREATE_PROMPT research process verification.

**Success Definition**: The integration test verifies that the PRP_BLUEPRINT_PROMPT instructs the Researcher Agent to: (a) spawn subagents for codebase analysis, (b) check `$SESSION_DIR/architecture/` for prior research, (c) instruct external research for documentation, and (d) ask user for clarification on ambiguous requirements.

## User Persona

**Target User**: Developer/QA Engineer running the test suite to verify system prompt correctness.

**Use Case**: Validating that the PRP creation prompt contains all required research workflow instructions before deployment.

**User Journey**:

1. Developer runs `npm test` or `vitest`
2. Test suite executes `tests/integration/prp-create-prompt.test.ts`
3. Tests verify prompt content contains required research instructions
4. If prompt is modified incorrectly, tests fail immediately

**Pain Points Addressed**:

- Detects accidental removal of critical research instructions
- Validates prompt structure completeness
- Ensures aspirational features are documented in tests

## Why

- **System Validation**: Ensures PRP_CREATE_PROMPT maintains required research workflow instructions
- **Documentation**: Tests serve as executable documentation of prompt requirements
- **Regression Prevention**: Catches prompt modifications that break research workflow
- **Integration with Existing Tests**: Extends existing integration test coverage (researcher-agent.test.ts, architect-agent-integration.test.ts)

## What

Create an integration test file that validates the PRP_BLUEPRINT_PROMPT contains all required research process instructions without calling actual LLMs.

### Success Criteria

- [ ] Test file created at `tests/integration/prp-create-prompt.test.ts`
- [ ] Tests verify prompt instructs to spawn subagents for codebase analysis
- [ ] Tests verify prompt checks `plan/architecture` directory for prior research
- [ ] Tests verify prompt instructs external research for documentation
- [ ] Tests verify prompt asks user for clarification on ambiguous requirements
- [ ] Test follows existing patterns from `tests/integration/researcher-agent.test.ts`
- [ ] All tests pass when run with `vitest`

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, would they have everything needed to implement this successfully? **YES** - This PRP provides specific file paths, code patterns, and test examples.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitest.dev/guide/
  why: Vitest testing framework documentation for describe/it blocks, mocking patterns
  critical: Use vi.mock() before imports, vi.importActual() to preserve real implementations

- file: PROMPTS.md
  why: Source of PRP_CREATE_PROMPT (lines 189-639) with all research workflow instructions
  pattern: Look for "Research Process" section (lines 217-244) and subsections
  gotcha: The prompt uses "plan/architecture" not "$SESSION_DIR/architecture/"

- file: src/agents/prompts.ts
  why: Exports PRP_BLUEPRINT_PROMPT (lines 157-603) - the actual prompt string to test
  pattern: Template literal with placeholder tags like <item_title>, <item_description>
  gotcha: Import as dynamic import after vi.mock() is applied

- file: tests/integration/researcher-agent.test.ts
  why: Reference implementation for prompt structure validation tests
  pattern: Groups: "PRP_CREATE_PROMPT structure validation", "PRP template structure validation"
  gotcha: Tests verify prompt CONTAINS instructions, not that subagent spawning actually works

- file: tests/integration/architect-agent-integration.test.ts
  why: Reference for mock Groundswell agent configuration testing
  pattern: Mock groundswell module, use beforeAll/dynamic import, expect.objectContaining()
  gotcha: Mock createAgent, NOT agent-factory

- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: System architecture documentation explaining PRP generation workflow
  pattern: "Research Process" section lines 217-244 in PROMPTS.md
  section: Multi-Agent Architecture (lines 64-74)

- docfile: plan/003_b3d3efdaf0ed/P1M3T2S1/research/prp-create-prompt-analysis.md
  why: Detailed analysis of PRP_CREATE_PROMPT structure and test requirements
  section: Key Test Patterns from Existing Tests

- docfile: plan/003_b3d3efdaf0ed/P1M3T2S1/research/vitest-testing-patterns.md
  why: Standard Vitest integration test patterns used in this codebase
  section: Mock Agent Configuration Pattern

- docfile: plan/003_b3d3efdaf0ed/P1M3T2S1/research/codebase-structure.md
  why: File locations and naming conventions for test placement
  section: Test File Location
```

### Current Codebase tree

```bash
/home/dustin/projects/hacky-hack/
├── PROMPTS.md                           # PRP_CREATE_PROMPT source (lines 189-639)
├── src/
│   ├── agents/
│   │   ├── agent-factory.ts             # createResearcherAgent()
│   │   └── prompts.ts                   # PRP_BLUEPRINT_PROMPT export (lines 157-603)
│   └── core/
│       └── models.ts                    # PRPDocumentSchema, Backlog types
└── tests/
    └── integration/
        ├── researcher-agent.test.ts     # Test pattern reference (lines 402-480)
        ├── prp-generator-integration.test.ts  # PRPGenerator flow tests
        └── architect-agent-integration.test.ts # Mock agent patterns
```

### Desired Codebase tree with files to be added

```bash
tests/
└── integration/
    └── prp-create-prompt.test.ts        # NEW: Integration test for PRP_CREATE_PROMPT verification
        # - Verify Research Process section content
        # - Verify subagent spawning instructions
        # - Verify architecture directory checking instructions
        # - Verify external research instructions
        # - Verify user clarification instructions
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Mock Groundswell, NOT agent-factory
// This allows testing the real createResearcherAgent() function
// We mock createAgent() which the factory calls internally
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// CRITICAL: Subagent spawning is ASPIRATIONAL, not implemented
// Tests verify prompt CONTAINS these instructions, not that they work
// Gotcha from researcher-agent.test.ts lines 442-446:
// "GOTCHA: These are ASPIRATIONAL features, not implemented in current codebase"

// CRITICAL: Architecture directory reference uses "plan/architecture"
// NOT "$SESSION_DIR/architecture/" in the PRP_BLUEPRINT_PROMPT
// Gotcha from researcher-agent.test.ts lines 466-468

// CRITICAL: Use dynamic imports after vi.mock() is applied
// Pattern from researcher-agent.test.ts lines 58-60:
async function loadGroundswell() {
  return await import('groundswell');
}

// CRITICAL: Always cleanup in afterEach
vi.unstubAllEnvs();
vi.clearAllMocks();
```

## Implementation Blueprint

### Data models and structure

No new data models required. Tests verify existing prompt string content.

```typescript
// Test uses existing imports:
import { PRP_BLUEPRINT_PROMPT } from '../../src/agents/prompts.js';

// No new schemas - validating string content with expect().toContain()
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/prp-create-prompt.test.ts skeleton
  - IMPLEMENT: Basic test file structure with imports and mock setup
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 29-52)
  - NAMING: describe('integration/prp-create-prompt', () => {...})
  - PLACEMENT: tests/integration/prp-create-prompt.test.ts

Task 2: ADD mock setup and dynamic imports
  - IMPLEMENT: vi.mock('groundswell') with createAgent/createPrompt spies
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 37-60)
  - NAMING: loadGroundswell() function, gs variable, beforeAll/beforeEach/afterEach hooks
  - DEPENDENCIES: Import vi, describe, expect, it, beforeAll, afterEach from 'vitest'
  - PLACEMENT: Top of test file after imports

Task 3: ADD Research Process section verification tests
  - IMPLEMENT: Tests verifying prompt contains "Research Process" and subsections
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 402-414)
  - NAMING: describe('PRP_CREATE_PROMPT research process verification', () => {...})
  - VERIFY: Contains "Codebase Analysis in depth", "Internal Research at scale", "External Research at scale", "User Clarification"
  - PLACEMENT: First test group in describe block

Task 4: ADD subagent spawning instruction tests
  - IMPLEMENT: Tests verifying prompt instructs to spawn subagents with batch tools
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 436-446)
  - NAMING: it('should instruct to spawn subagents for codebase analysis', async () => {...})
  - VERIFY: Contains "spawn subagents", "batch tools"
  - PLACEMENT: Inside research process verification describe block

Task 5: ADD architecture directory checking tests
  - IMPLEMENT: Tests verifying prompt mentions plan/architecture directory
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 460-468)
  - NAMING: it('should instruct to check plan/architecture directory', async () => {...})
  - VERIFY: Contains "plan/architecture" (NOT "$SESSION_DIR/architecture/")
  - PLACEMENT: Inside research process verification describe block

Task 6: ADD external research instruction tests
  - IMPLEMENT: Tests verifying prompt instructs external research with documentation URLs
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 404-413)
  - NAMING: it('should instruct to perform external research', async () => {...})
  - VERIFY: Contains "External Research at scale", "Library documentation", "Implementation examples"
  - PLACEMENT: Inside research process verification describe block

Task 7: ADD user clarification instruction tests
  - IMPLEMENT: Tests verifying prompt asks user for clarification when needed
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 404-413)
  - NAMING: it('should instruct to ask user for clarification', async () => {...})
  - VERIFY: Contains "User Clarification", "Ask for clarification if you need it"
  - PLACEMENT: Inside research process verification describe block

Task 8: ADD PRP Generation Process section tests
  - IMPLEMENT: Tests verifying all 5 steps of PRP Generation Process are present
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 416-434)
  - NAMING: it('should contain all PRP Generation Process steps', async () => {...})
  - VERIFY: Contains "Step 1: Review Template" through "Step 5: ULTRATHINK Before Writing"
  - PLACEMENT: New describe block for PRP Generation Process

Task 9: ADD TodoWrite tool instruction tests
  - IMPLEMENT: Tests verifying prompt instructs to use TodoWrite tool for planning
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (lines 448-458)
  - NAMING: it('should instruct to use TodoWrite tool', async () => {...})
  - VERIFY: Contains "TodoWrite", "create comprehensive PRP writing plan"
  - PLACEMENT: Inside PRP Generation Process describe block
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Test file structure (from researcher-agent.test.ts lines 29-52)
// ============================================================================
import { afterEach, describe, expect, it, vi, beforeAll } from 'vitest';

// MOCK: Groundswell module (NOT agent-factory)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// DYNAMIC IMPORT: Load after mock is applied
async function loadGroundswell() {
  return await import('groundswell');
}

// ============================================================================
// PATTERN 2: Describe block structure (from researcher-agent.test.ts)
// ============================================================================
describe('integration/prp-create-prompt', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // Test groups here
});

// ============================================================================
// PATTERN 3: Prompt content verification (from researcher-agent.test.ts lines 402-414)
// ============================================================================
describe('PRP_CREATE_PROMPT research process verification', () => {
  it('should contain Research Process section', async () => {
    // SETUP: Import PRP_CREATE_PROMPT
    const { PRP_BLUEPRINT_PROMPT } =
      await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

    // VERIFY: Contains key phrases from Research Process section
    expect(PRP_BLUEPRINT_PROMPT).toContain('Research Process');
    expect(PRP_BLUEPRINT_PROMPT).toContain('Codebase Analysis in depth');
    expect(PRP_BLUEPRINT_PROMPT).toContain('Internal Research at scale');
    expect(PRP_BLUEPRINT_PROMPT).toContain('External Research at scale');
    expect(PRP_BLUEPRINT_PROMPT).toContain('User Clarification');
  });
});

// ============================================================================
// PATTERN 4: Subagent spawning instruction verification (lines 436-446)
// ============================================================================
it('should instruct to spawn subagents', async () => {
  const { PRP_BLUEPRINT_PROMPT } =
    await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

  // GOTCHA: These are ASPIRATIONAL features, not implemented in current codebase
  // Tests verify prompt CONTAINS these instructions, not that they work
  expect(PRP_BLUEPRINT_PROMPT).toContain('spawn subagents');
  expect(PRP_BLUEPRINT_PROMPT).toContain('batch tools');
});

// ============================================================================
// PATTERN 5: Architecture directory verification (lines 460-468)
// ============================================================================
it('should mention architecture/ directory', async () => {
  const { PRP_BLUEPRINT_PROMPT } =
    await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

  // GOTCHA: The PRP_BLUEPRINT_PROMPT uses "plan/architecture" not "$SESSION_DIR/architecture/"
  expect(PRP_BLUEPRINT_PROMPT).toContain('plan/architecture');
});
```

### Integration Points

```yaml
TEST_RUNNER:
  - command: "vitest run tests/integration/prp-create-prompt.test.ts"
  - pattern: "npx vitest" for watch mode, "vitest run" for single run

EXISTING_TESTS:
  - reference: tests/integration/researcher-agent.test.ts
  - pattern: Group tests by feature with nested describe blocks
  - naming: 'integration/[component]' for top-level describe

PROMPT_EXPORT:
  - import: "src/agents/prompts.js"
  - export: "PRP_BLUEPRINT_PROMPT" (constant, lines 157-603)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/integration/prp-create-prompt.test.ts --fix
npx tsc --noEmit tests/integration/prp-create-prompt.test.ts
npx prettier --write tests/integration/prp-create-prompt.test.ts

# Project-wide validation
npx eslint tests/integration/ --fix
npx tsc --noEmit
npx prettier --write tests/integration/

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new test file
npx vitest run tests/integration/prp-create-prompt.test.ts

# Test all integration tests
npx vitest run tests/integration/

# Coverage validation (if coverage tools available)
npx vitest run tests/integration/ --coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify test is discovered by Vitest
npx vitest run tests/integration/ --reporter=verbose | grep prp-create-prompt

# Verify PRP_BLUEPRINT_PROMPT can be imported
node -e "import('./src/agents/prompts.js').then(m => console.log('PRP_BLUEPRINT_PROMPT length:', m.PRP_BLUEPRINT_PROMPT.length))"

# Verify test runs with other integration tests
npx vitest run tests/integration/researcher-agent.test.ts tests/integration/prp-create-prompt.test.ts

# Expected: All tests pass, test is discovered and runs successfully
```

### Level 4: Domain-Specific Validation

```bash
# Test Pattern Validation:
# Verify test follows existing codebase patterns
npx vitest run tests/integration/prp-create-prompt.test.ts --reporter=verbose

# Prompt Content Validation:
# Manually verify prompt contains expected sections by searching PROMPTS.md
grep -n "Research Process" PROMPTS.md
grep -n "spawn subagents" PROMPTS.md
grep -n "plan/architecture" PROMPTS.md

# Expected: All content searches find matches in PROMPTS.md lines 189-639
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Test file created at correct path: tests/integration/prp-create-prompt.test.ts
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npx eslint tests/integration/prp-create-prompt.test.ts`
- [ ] No formatting issues: `npx prettier --check tests/integration/prp-create-prompt.test.ts`

### Feature Validation

- [ ] Test verifies prompt contains "Research Process" section
- [ ] Test verifies prompt instructs to spawn subagents for codebase analysis
- [ ] Test verifies prompt mentions plan/architecture directory
- [ ] Test verifies prompt instructs external research for documentation
- [ ] Test verifies prompt asks user for clarification on ambiguous requirements
- [ ] All tests pass: `npx vitest run tests/integration/prp-create-prompt.test.ts`

### Code Quality Validation

- [ ] Follows existing test patterns from researcher-agent.test.ts
- [ ] Mocks Groundswell, NOT agent-factory (verified in mock setup)
- [ ] Uses dynamic imports after vi.mock() (verified in test structure)
- [ ] Cleanup in afterEach with vi.unstubAllEnvs() and vi.clearAllMocks()
- [ ] Test names follow 'should [expected behavior]' pattern

### Documentation & Deployment

- [ ] Test file includes JSDoc comments explaining purpose
- [ ] Test groups organized with describe blocks
- [ ] GOTCHAs documented in comments (aspirational features, architecture path)
- [ ] Tests serve as executable documentation of prompt requirements

---

## Anti-Patterns to Avoid

- ❌ Don't mock agent-factory module - mock groundswell instead
- ❌ Don't test subagent spawning functionality - verify prompt contains instructions
- ❌ Don't use static imports before vi.mock() - use dynamic imports in tests
- ❌ Don't forget cleanup in afterEach - always vi.unstubAllEnvs() and vi.clearAllMocks()
- ❌ Don't verify "$SESSION_DIR/architecture/" - actual prompt uses "plan/architecture"
- ❌ Don't add test for working subagent feature - it's aspirational, not implemented
