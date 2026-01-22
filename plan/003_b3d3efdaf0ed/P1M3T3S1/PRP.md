# PRP: P1.M3.T3.S1 - Verify PRP Execution Prompt process flow

## Goal

**Feature Goal**: Create an integration test that verifies the PRP_EXECUTE_PROMPT contains all critical process flow instructions to ensure the Coder Agent executes PRPs correctly.

**Deliverable**: Integration test file `tests/integration/prp-execute-prompt.test.ts` with comprehensive verification of prompt process flow and critical steps.

**Success Definition**:
- All test suites pass verifying prompt structure and content
- Prompt contains all 5 execution process steps with proper instructions
- Progressive validation system (4 levels) is clearly defined
- Failure protocol instructions are present
- Test follows existing patterns from task-breakdown-prompt.test.ts and prp-create-prompt.test.ts

## Why

- **Testing Infrastructure Integrity**: Ensures the critical PRP_EXECUTE_PROMPT (PRP_BUILDER_PROMPT) that drives all code execution in the pipeline is properly defined
- **Contract Compliance**: Validates the prompt matches the contract definition from system_context.md and PROMPTS.md
- **Regression Prevention**: Catches accidental modifications to the critical builder prompt that could break PRP execution
- **Documentation Alignment**: Verifies prompt content aligns with documented architecture and process flow

## What

Create an integration test suite that validates the PRP_BUILDER_PROMPT (PRP_EXECUTE_PROMPT) constant contains all required process flow instructions without calling actual LLMs. The test verifies:

1. **Prompt export and loading**: PRP_BUILDER_PROMPT is properly exported as a string
2. **Load PRP (CRITICAL FIRST STEP)**: Prompt emphasizes reading PRP first using Read tool
3. **ULTRATHINK & Plan**: Prompt instructs to use TodoWrite for planning
4. **Execute Implementation**: Prompt specifies following PRP's Implementation Tasks
5. **Progressive Validation**: Prompt defines 4-level validation system
6. **Completion Verification**: Prompt specifies final validation checklist
7. **Failure Protocol**: Prompt specifies fix and retry on validation failure
8. **JSON output format**: Prompt requires specific JSON output structure

### Success Criteria

- [ ] Test file exists at `tests/integration/prp-execute-prompt.test.ts`
- [ ] All tests pass with proper assertions
- [ ] Test follows patterns from existing prompt verification tests
- [ ] Groundswell mock pattern is properly applied
- [ ] Dynamic imports used for loading prompt after mocks
- [ ] Test coverage includes all 5 execution process steps
- [ ] Test verifies 4-level progressive validation
- [ ] Test verifies failure protocol instructions

## All Needed Context

### Context Completeness Check

✅ **Passes "No Prior Knowledge" test**: This PRP provides complete file paths, exact patterns to follow, specific assertion patterns, and all necessary context for implementing the integration test.

### Documentation & References

```yaml
# MUST READ - Core prompt definitions
- file: /home/dustin/projects/hacky-hack/PROMPTS.md
  why: Contains the PRP_EXECUTE_PROMPT definition (lines 641-714) that we are testing
  section: "## 5. PRP_EXECUTE_PROMPT (The Builder)"
  lines: 641-714
  critical: The prompt defines the 5-step Execution Process and 4-level Progressive Validation

# MUST READ - System context
- file: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Defines the Coder Agent role and the progressive validation system architecture
  section: "Progressive Validation System" (lines 234-260)
  critical: Explains the 4-level gates: Syntax & Style, Unit Tests, Integration Testing, Creative & Domain-Specific

# MUST READ - Similar test patterns (task-breakdown-prompt)
- file: /home/dustin/projects/hacky-hack/tests/integration/task-breakdown-prompt.test.ts
  why: Primary pattern reference for prompt content verification tests
  pattern: Content verification with `toContain()` assertions, console.log for sample output
  gotcha: Uses direct import, NOT dynamic import (different from prp-create-prompt pattern)

# MUST READ - Similar test patterns (prp-create-prompt)
- file: /home/dustin/projects/hacky-hack/tests/integration/prp-create-prompt.test.ts
  why: Secondary pattern reference showing Groundswell mocking and dynamic imports
  pattern: Dynamic imports with `await import()`, Groundswell mock at top level
  gotcha: Uses `vi.mock('groundswell', ...)` pattern with dynamic imports

# MUST READ - PRP executor implementation
- file: /home/dustin/projects/hacky-hack/src/agents/prp-executor.ts
  why: Shows how PRP_BUILDER_PROMPT is used in actual execution
  section: Lines 242-246 (prompt injection), Lines 238-322 (execute method)
  critical: Understanding how the prompt is used helps verify its content

# MUST READ - Prompts export
- file: /home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: Contains the PRP_BUILDER_PROMPT export that we are testing
  lines: 605-685 (complete PRP_BUILDER_PROMPT definition)
  section: "PRP Execution Prompt (The Builder)"
  gotcha: The prompt uses template literal with `$PRP_README` placeholder

# MUST READ - Test patterns exploration results
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P1M3T3S1/research/test-patterns-research.md
  why: Comprehensive summary of integration testing patterns in the codebase
  section: "Patterns Specific to Prompt/Agent Verification"
```

### Current Codebase Tree

```bash
tests/
├── integration/
│   ├── task-breakdown-prompt.test.ts    # Pattern: Direct import, content verification
│   ├── prp-create-prompt.test.ts        # Pattern: Dynamic import, Groundswell mock
│   ├── prp-executor-integration.test.ts # Related: PRP executor testing
│   ├── coder-agent.test.ts              # Related: Coder agent testing
│   └── agents.test.ts                   # Related: Agent testing
src/
├── agents/
│   ├── prompts.ts                       # Export: PRP_BUILDER_PROMPT
│   ├── prp-executor.ts                  # Usage: PRP_BUILDER_PROMPT consumer
│   └── agent-factory.ts                 # Creation: createCoderAgent()
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
├── integration/
│   ├── prp-execute-prompt.test.ts       # NEW: This PRP's deliverable
│   ├── task-breakdown-prompt.test.ts    # PATTERN: Content verification
│   ├── prp-create-prompt.test.ts        # PATTERN: Dynamic import, Groundswell mock
│   └── ...
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Import patterns differ between test files
// task-breakdown-prompt.test.ts uses direct import:
import { TASK_BREAKDOWN_PROMPT } from '../../src/agents/prompts.js';

// CRITICAL: prp-create-prompt.test.ts uses dynamic import:
const { PRP_BLUEPRINT_PROMPT } = await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

// DECISION: Use direct import pattern from task-breakdown-prompt.test.ts
// It's simpler and works for prompt content verification tests

// CRITICAL: Groundswell mocking pattern (from prp-create-prompt.test.ts)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// GOTCHA: The PRP_BUILDER_PROMPT has a $PRP_README placeholder that gets replaced
// The test should verify the placeholder exists
// Line 683: `$PRP_README`

// GOTCHA: The prompt mentions "Read tool" (capital R)
// Tests should verify exact phrasing from the prompt

// GOTCHA: JSON format uses markdown code block format
// Line 676-680: ```json { "result": "success" | "error" | "issue", ... }
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is a test file that verifies existing prompt content.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/prp-execute-prompt.test.ts file structure
  - IMPLEMENT: Basic test file with imports, describe block, afterEach cleanup
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 1-31)
  - NAMING: describe('integration/prp-execute-prompt', () => { ... })
  - INCLUDE: Imports from 'vitest', PRP_BUILDER_PROMPT import from src/agents/prompts.js
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT Groundswell mock setup (optional, based on pattern decision)
  - DECISION: Use direct import pattern (simpler) from task-breakdown-prompt.test.ts
  - ALTERNATIVE: If using dynamic import pattern, add vi.mock('groundswell', ...)
  - FOLLOW pattern: tests/integration/prp-create-prompt.test.ts (lines 46-53) if using dynamic import
  - PLACEMENT: Top of file, before imports

Task 3: IMPLEMENT Test Suite 1 - Prompt export and loading verification
  - VERIFY: PRP_BUILDER_PROMPT is exported as string
  - VERIFY: Prompt is non-empty with markdown content
  - VERIFY: Prompt contains key phrases "# Execute BASE PRP", "Mission: One-Pass Implementation"
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 34-45)
  - ASSERTIONS: toBe('string'), toBeGreaterThan(100), toContain(), toBeTruthy()

Task 4: IMPLEMENT Test Suite 2 - Load PRP (CRITICAL FIRST STEP) verification
  - VERIFY: Prompt contains "Load PRP (CRITICAL FIRST STEP)" section
  - VERIFY: Prompt instructs to use Read tool to read PRP file
  - VERIFY: Prompt says "You MUST read this file before doing anything else"
  - VERIFY: Prompt mentions "Absorb all context, patterns, requirements"
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 48-77)
  - ASSERTIONS: Multiple toContain() checks for each instruction

Task 5: IMPLEMENT Test Suite 3 - ULTRATHINK & Plan verification
  - VERIFY: Prompt contains "ULTRATHINK & Plan" step
  - VERIFY: Prompt instructs to create comprehensive implementation plan
  - VERIFY: Prompt instructs to use TodoWrite tool
  - VERIFY: Prompt mentions "Break down into clear todos using TodoWrite tool"
  - VERIFY: Prompt instructs to "Never guess - always verify the codebase patterns"
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 80-109)
  - ASSERTIONS: toContain('TodoWrite'), toContain('ULTRATHINK')

Task 6: IMPLEMENT Test Suite 4 - Execute Implementation verification
  - VERIFY: Prompt contains "Execute Implementation" step (Step 3)
  - VERIFY: Prompt instructs to follow PRP's Implementation Tasks sequence
  - VERIFY: Prompt mentions "Use the patterns and examples referenced in the PRP"
  - VERIFY: Prompt instructs to "Create files in locations specified by the desired codebase tree"
  - FOLLOW pattern: tests/integration/prp-create-prompt.test.ts (lines 227-271)
  - ASSERTIONS: toContain('Execute Implementation'), toContain('Implementation Tasks')

Task 7: IMPLEMENT Test Suite 5 - Progressive Verification (4 levels) verification
  - VERIFY: Prompt contains "Progressive Validation" section (Step 4)
  - VERIFY: Prompt defines "Level 1": syntax & style validation
  - VERIFY: Prompt defines "Level 2": unit test validation
  - VERIFY: Prompt defines "Level 3": integration testing
  - VERIFY: Prompt defines "Level 4": specified validation
  - VERIFY: Prompt says "Each level must pass before proceeding to the next"
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 112-158)
  - ASSERTIONS: toContain('Level 1'), toContain('Level 2'), toContain('Level 3'), toContain('Level 4')

Task 8: IMPLEMENT Test Suite 6 - Completion Verification step
  - VERIFY: Prompt contains "Completion Verification" step (Step 5)
  - VERIFY: Prompt mentions "Final Validation Checklist"
  - VERIFY: Prompt instructs to verify all Success Criteria
  - VERIFY: Prompt instructs to confirm all Anti-Patterns were avoided
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 258-298)
  - ASSERTIONS: toContain('Completion Verification'), toContain('Final Validation Checklist')

Task 9: IMPLEMENT Test Suite 7 - Failure Protocol verification
  - VERIFY: Prompt contains "Failure Protocol" section
  - VERIFY: Prompt instructs to "use the patterns and gotchas from the PRP to fix issues"
  - VERIFY: Prompt instructs to "re-run validation until passing"
  - VERIFY: Prompt includes "halt and produce a thorough explanation" for fundamental issues
  - VERIFY: Prompt mentions "at a 10th grade level"
  - FOLLOW pattern: tests/integration/prp-create-prompt.test.ts (lines 340-381)
  - ASSERTIONS: toContain('Failure Protocol'), toContain('fix issues'), toContain('10th grade')

Task 10: IMPLEMENT Test Suite 8 - JSON output format verification
  - VERIFY: Prompt specifies JSON output format
  - VERIFY: Prompt contains '"result": "success" | "error" | "issue"'
  - VERIFY: Prompt contains '"message": "Detailed explanation"'
  - VERIFY: Prompt uses markdown code block format (```json)
  - VERIFY: Prompt includes $PRP_README placeholder
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 326-342)
  - ASSERTIONS: toContain('"result"'), toContain('"message"'), toContain('$PRP_README')

Task 11: IMPLEMENT Test Suite 12 - Sample output logging (optional debugging)
  - ADD: console.log statements for manual inspection
  - LOG: Prompt length, key sections verification
  - FOLLOW pattern: tests/integration/task-breakdown-prompt.test.ts (lines 345-381)
  - PURPOSE: Debugging aid for manual test inspection
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Test file structure (from task-breakdown-prompt.test.ts)
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRP_BUILDER_PROMPT } from '../../src/agents/prompts.js';

describe('integration/prp-execute-prompt', () => {
  // CLEANUP: Always restore mocks after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // Test suites...
});

// PATTERN 2: Content verification assertions
it('should contain Load PRP step with Read tool instruction', () => {
  expect(PRP_BUILDER_PROMPT).toContain('Load PRP (CRITICAL FIRST STEP)');
  expect(PRP_BUILDER_PROMPT).toContain('Use the `Read` tool to read the PRP file');
  expect(PRP_BUILDER_PROMPT).toContain('You MUST read this file before doing anything else');
});

// PATTERN 3: Multiple related checks in single test (grouped by theme)
it('should define all 4 progressive validation levels', () => {
  expect(PRP_BUILDER_PROMPT).toContain('Level 1');
  expect(PRP_BUILDER_PROMPT).toContain('Level 2');
  expect(PRP_BUILDER_PROMPT).toContain('Level 3');
  expect(PRP_BUILDER_PROMPT).toContain('Level 4');
  expect(PRP_BUILDER_PROMPT).toContain('Each level must pass before proceeding to the next');
});

// PATTERN 4: Comment headers for test suites (PATTERN: from existing tests)
// PATTERN: Test suite N - Requirement (X) - Description
describe('requirement (a): Load PRP step verification', () => {
  // tests...
});

// GOTCHA: The prompt uses backticks for code/formatting
// When testing, use exact string matching including backticks
expect(PRP_BUILDER_PROMPT).toContain('Use the `Read` tool');
```

### Integration Points

```yaml
IMPORTS:
  - add to: tests/integration/prp-execute-prompt.test.ts
  - pattern: "import { PRP_BUILDER_PROMPT } from '../../src/agents/prompts.js';"

TEST_PATTERN:
  - reference: tests/integration/task-breakdown-prompt.test.ts
  - pattern: Describe block with afterEach cleanup, content verification assertions

MOCK_PATTERN:
  - optional: tests/integration/prp-create-prompt.test.ts
  - pattern: vi.mock('groundswell', ...) for dynamic imports
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit tests/integration/prp-execute-prompt.test.ts    # Type check new file

# Project-wide validation
npx tsc --noEmit                                                  # Type check entire project

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new test file specifically
uv run vitest tests/integration/prp-execute-prompt.test.ts --run

# Test all integration tests for related components
uv run vitest tests/integration/task-breakdown-prompt.test.ts --run
uv run vitest tests/integration/prp-create-prompt.test.ts --run

# Full integration test suite
uv run vitest tests/integration/ --run

# Expected: All tests pass. If failing, debug root cause and fix test assertions.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full test suite to ensure no regressions
uv run vitest --run

# Check test coverage
uv run vitest --coverage

# Expected: All tests pass, coverage remains at expected levels.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual inspection of test output
uv run vitest tests/integration/prp-execute-prompt.test.ts --run 2>&1 | grep -A 10 "PRP_BUILDER_PROMPT"

# Verify the test correctly validates prompt structure
# Check console.log output for sample prompt content inspection

# Expected: Test logs show prompt structure verification, all key sections present.
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `uv run vitest tests/integration/prp-execute-prompt.test.ts --run`
- [ ] No type errors: `npx tsc --noEmit tests/integration/prp-execute-prompt.test.ts`
- [ ] Test follows existing patterns from task-breakdown-prompt.test.ts
- [ ] File placement matches desired codebase tree structure

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Test verifies all 5 execution process steps (Load PRP, ULTRATHINK, Execute, Validate, Complete)
- [ ] Test verifies 4-level progressive validation system
- [ ] Test verifies failure protocol instructions
- [ ] Test verifies JSON output format specification

### Code Quality Validation

- [ ] Follows existing test patterns and naming conventions
- [ ] Test descriptions are clear and descriptive
- [ ] Assertions use `toContain()` for content verification
- [ ] Test suites are logically grouped by feature/requirement
- [ ] Comments explain what each test suite verifies

### Documentation & Deployment

- [ ] Test file has JSDoc comment header describing purpose
- [ ] Test references PROMPTS.md line numbers for documentation
- [ ] Test includes @remarks explaining contract definition verification
- [ ] Console.log statements include helpful labels for manual inspection

---

## Anti-Patterns to Avoid

- ❌ Don't call actual LLMs - these are content verification tests only
- ❌ Don't use dynamic imports unnecessarily - direct import is simpler for this use case
- ❌ Don't skip verifying the $PRP_README placeholder in the prompt
- ❌ Don't create separate tests for every line - group related checks logically
- ❌ Don't hardcode exact line numbers in test descriptions (they may change)
- ❌ Don't mock the PRP_BUILDER_PROMPT itself - we're testing the real content
- ❌ Don't use complex spy/stub setups - simple `toContain()` assertions work best
