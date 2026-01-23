# Product Requirement Prompt (PRP): P1.M3.T4.S1 - Delta PRD Generation Prompt and Retry Logic Verification

---

## Goal

**Feature Goal**: Create an integration test that verifies the DELTA_PRD_GENERATION_PROMPT structure and the retry logic for delta PRD generation failures.

**Deliverable**: Integration test file `tests/integration/delta-prd-generation.test.ts` with comprehensive delta PRD creation and retry logic verification.

**Success Definition**: All test cases pass, confirming that:

1. The DELTA_PRD_GENERATION_PROMPT contains all required instructions for delta PRD generation
2. The prompt instructs the Change Manager agent to compare old and new PRDs
3. The prompt instructs the agent to focus only on new/modified requirements
4. The prompt instructs the agent to reference completed work to avoid duplication
5. The retry logic triggers a second attempt when delta PRD is missing
6. The session fails fast when delta PRD cannot be generated after retry

## User Persona

**Target User**: QA Engineers and System Integrators verifying the PRP Pipeline's delta PRD generation functionality.

**Use Case**: Validating that the system properly handles PRD version changes and generates delta PRDs with appropriate retry logic for resilience.

**User Journey**:

1. Run the integration test suite to verify delta PRD generation
2. Test confirms prompt structure completeness
3. Test confirms retry behavior on failures
4. Test confirms fail-fast behavior after retry exhaustion

**Pain Points Addressed**:

- Ensures delta PRD generation works correctly before production deployment
- Validates retry logic prevents data loss from transient failures
- Confirms fail-fast behavior prevents infinite retry loops

## Why

- **System Reliability**: Delta PRD generation is critical for handling PRD changes without losing completed work
- **Change Management**: The DELTA_PRD_GENERATION_PROMPT must provide complete instructions for the Change Manager agent
- **Resilience**: Retry logic ensures transient failures don't prevent delta session creation
- **Fail-Fast Protection**: The system must fail fast when delta PRD generation is fundamentally broken

## What

### Success Criteria

- [ ] Integration test file created at `tests/integration/delta-prd-generation.test.ts`
- [ ] Test verifies DELTA_PRD_GENERATION_PROMPT contains all required sections
- [ ] Test verifies prompt instructs agent to compare old and new PRDs
- [ ] Test verifies prompt instructs agent to focus on new/modified requirements only
- [ ] Test verifies prompt instructs agent to reference completed work
- [ ] Test verifies retry logic triggers on missing delta PRD
- [ ] Test verifies session fails after retry exhaustion
- [ ] All tests pass with mocked agent responses
- [ ] Test follows existing patterns from `tests/integration/task-breakdown-prompt.test.ts`

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes - this PRP includes:

- Exact prompt structure from PROMPTS.md
- Existing implementation patterns (DeltaAnalysisWorkflow, retry utility)
- Test file patterns from existing integration tests
- Mock patterns for Groundswell agents
- File paths and naming conventions

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: file:///home/dustin/projects/hacky-hack/PROMPTS.md#L793-L833
  why: DELTA_PRD_GENERATION_PROMPT definition (lines 793-833)
  critical: Contains exact prompt structure for delta PRD generation with Change Manager role

- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: Prompts export module showing DELTA_PRD_GENERATION_PROMPT as constant
  section: Lines 720-734 (DELTA_PRD_GENERATION_PROMPT export)
  gotcha: Uses template literal with backticks, contains $(cat) shell command references

- url: file:///home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts
  why: DeltaAnalysisWorkflow implementation using QA agent with retry logic
  pattern: Uses retryAgentPrompt() wrapper for agent.prompt() calls
  gotcha: Type assertion needed for agent.prompt() return value

- url: file:///home/dustin/projects/hacky-hack/src/utils/retry.ts
  why: Retry utility with exponential backoff for agent operations
  pattern: retryAgentPrompt<T>() function with AGENT_RETRY_CONFIG
  gotcha: maxAttempts: 3, baseDelay: 1000, uses createDefaultOnRetry for logging

- url: file:///home/dustin/projects/hacky-hack/tests/integration/task-breakdown-prompt.test.ts
  why: Reference pattern for prompt content verification tests
  pattern: Content validation using .toContain() for key phrases
  gotcha: Follows describe() nesting with requirement-specific test suites

- url: file:///home/dustin/projects/hacky-hack/tests/integration/prp-create-prompt.test.ts
  why: Another reference pattern for prompt verification
  pattern: Dynamic imports with vi.mock('groundswell')
  gotcha: Uses vi.importActual to preserve other Groundswell exports

- url: file:///home/dustin/projects/hacky-hack/tests/integration/progressive-validation.test.ts
  why: Reference for retry logic testing patterns
  pattern: Tests verify retry behavior and fail-fast conditions
  gotcha: Uses vi.fn() to mock agent responses and control attempt counts

- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts/delta-analysis-prompt.ts
  why: DeltaAnalysisPrompt implementation using Groundswell createPrompt
  pattern: createPrompt() with responseFormat: DeltaAnalysisSchema
  gotcha: Uses constructUserPrompt() to build comparison data

- docfile: plan/003_b3d3efdaf0ed/P1M3T4S1/research/delta-prd-generation-research.md
  why: External research on delta PRD generation best practices
  section: Executive summary and change categorization framework

- docfile: plan/003_b3d3efdaf0ed/P1M3T4S1/research/retry-logic-research.md
  why: External research on retry logic patterns for AI workflows
  section: Exponential backoff patterns and transient error detection

- url: file:///home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/system_context.md
  why: System architecture documentation for delta session workflow
  section: Delta Session Workflow (section 2.7)
  gotcha: Describes retry logic: "if delta PRD not created on first attempt, demand retry"
```

### Current Codebase Tree (relevant files)

```bash
src/
├── agents/
│   ├── prompts.ts                    # DELTA_PRD_GENERATION_PROMPT export (line 720-734)
│   ├── prompts/
│   │   └── delta-analysis-prompt.ts  # createDeltaAnalysisPrompt() using Groundswell
│   └── agent-factory.ts              # createQAAgent() for delta analysis
├── core/
│   ├── session-manager.ts            # createDeltaSession() method
│   └── models.ts                     # DeltaAnalysis schema
├── workflows/
│   └── delta-analysis-workflow.ts    # Uses retryAgentPrompt() wrapper
├── utils/
│   ├── retry.ts                      # retryAgentPrompt<T>() utility
│   └── logger.ts                     # Logging infrastructure
└── cli/
    └── index.ts                      # CLI argument parsing

tests/
├── integration/
│   ├── task-breakdown-prompt.test.ts # Pattern for prompt content verification
│   ├── prp-create-prompt.test.ts     # Pattern with Groundswell mocking
│   ├── progressive-validation.test.ts # Pattern for retry logic testing
│   └── core/
│       └── delta-session.test.ts     # Existing delta session tests
└── fixtures/
    └── simple-prd*.ts                # Test PRD fixtures

PROMPTS.md                             # DELTA_PRD_GENERATION_PROMPT definition (lines 793-833)
```

### Desired Codebase Tree (files to be added)

```bash
tests/
└── integration/
    └── delta-prd-generation.test.ts  # NEW: Integration test for DELTA_PRD_GENERATION_PROMPT and retry logic
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: DELTA_PRD_GENERATION_PROMPT uses shell command substitution syntax
// The prompt contains $(cat "$PREV_SESSION_DIR/prd_snapshot.md") which is NOT TypeScript
// This is a shell script template that gets populated before being passed to the agent
// Tests should verify the prompt CONTAINS these strings, not execute them

// CRITICAL: Mock Groundswell, NOT agent-factory
// Follow pattern from tests/integration/prp-create-prompt.test.ts:
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// GOTCHA: retryAgentPrompt uses AGENT_RETRY_CONFIG with maxAttempts: 3
// First attempt = 1, retries = maxAttempts - 1 = 2 more attempts
// Total possible attempts = 3

// GOTCHA: DeltaAnalysisWorkflow returns DeltaAnalysis type
// Type assertion required: as Promise<DeltaAnalysis>

// PATTERN: Test file naming uses kebab-case
// delta-prd-generation.test.ts (NOT delta_prd_generation.test.ts)

// PATTERN: Integration tests use describe() with nested test suites
// Outer describe: "integration/delta-prd-generation"
// Inner describes: Group by requirement (a), (b), (c), (d), (e)

// GOTCHA: Use dynamic imports when testing after mocks are established
// await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js')
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Test uses existing:

- `DELTA_PRD_GENERATION_PROMPT` constant from `src/agents/prompts.ts`
- `DeltaAnalysis` type from `src/core/models.ts`
- Mock agent responses using `vi.fn()`

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure with imports and mocks
  - IMPLEMENT: Import test utilities (describe, it, expect, vi, afterEach)
  - IMPLEMENT: Mock Groundswell (createAgent, createPrompt) following prp-create-prompt.test.ts pattern
  - NAMING: tests/integration/delta-prd-generation.test.ts
  - PLACEMENT: tests/integration/ directory alongside other prompt verification tests

Task 2: IMPLEMENT test suite for DELTA_PRD_GENERATION_PROMPT export verification
  - VERIFY: DELTA_PRD_GENERATION_PROMPT is exported as string
  - VERIFY: Prompt length is greater than 100 characters
  - VERIFY: Prompt contains "# Generate Delta PRD from Changes" header
  - FOLLOW: Pattern from tests/integration/task-breakdown-prompt.test.ts (prompt export tests)

Task 3: IMPLEMENT test suite for Requirement (a) - Compare old and new PRDs instruction
  - VERIFY: Prompt contains "Previous PRD (Completed Session)" section
  - VERIFY: Prompt contains "$(cat "$PREV_SESSION_DIR/prd_snapshot.md")"
  - VERIFY: Prompt contains "Current PRD" section
  - VERIFY: Prompt contains "$(cat "$PRD_FILE")"
  - VERIFY: Prompt contains "## Previous Session's Completed Tasks" section
  - FOLLOW: Content validation pattern using .toContain()

Task 4: IMPLEMENT test suite for Requirement (b) - Focus on new/modified requirements only
  - VERIFY: Prompt contains "SCOPE DELTA" instruction
  - VERIFY: Prompt instructs to focus ONLY on new features/requirements added
  - VERIFY: Prompt instructs to focus ONLY on modified requirements
  - VERIFY: Prompt instructs note removed requirements but don't create tasks
  - VERIFY: Prompt contains "New features/requirements added" phrase
  - VERIFY: Prompt contains "Modified requirements (note what changed from original)"

Task 5: IMPLEMENT test suite for Requirement (c) - Reference completed work to avoid duplication
  - VERIFY: Prompt contains "REFERENCE COMPLETED WORK" section
  - VERIFY: Prompt instructs to "Reference existing implementations rather than re-implement"
  - VERIFY: Prompt instructs to note which files/functions need updates for modifications
  - VERIFY: Prompt contains "LEVERAGE PRIOR RESEARCH" section
  - VERIFY: Prompt instructs to check $PREV_SESSION_DIR/architecture/ for existing research

Task 6: IMPLEMENT test suite for Requirement (d) - Retry logic triggers on missing delta PRD
  - CREATE: Mock agent that fails first attempt, succeeds second
  - VERIFY: retryAgentPrompt() is called with agent prompt function
  - VERIFY: onRetry callback is invoked after first failure
  - VERIFY: Second attempt is made after first failure
  - VERIFY: Success is returned after second attempt
  - FOLLOW: Pattern from tests/integration/progressive-validation.test.ts for retry testing
  - GOTCHA: Use vi.fn().mockRejectedValueOnce().mockResolvedValueOnce() for controlled failures

Task 7: IMPLEMENT test suite for Requirement (e) - Fail fast when delta PRD cannot be generated
  - CREATE: Mock agent that always fails (3 attempts all fail)
  - VERIFY: All 3 attempts are made (1 initial + 2 retries)
  - VERIFY: Error is thrown after maxAttempts exhausted
  - VERIFY: Error message indicates delta PRD generation failure
  - FOLLOW: Fail-fast pattern from progressive-validation.test.ts

Task 8: IMPLEMENT comprehensive integration test with mock agent responses
  - CREATE: Mock DeltaAnalysisWorkflow with controlled responses
  - VERIFY: Complete flow from prompt to delta PRD creation
  - VERIFY: DeltaAnalysis is returned with correct structure
  - VERIFY: Changes array contains expected change types
  - INTEGRATE: Test both success and failure scenarios

Task 9: ADD sample output logging test
  - IMPLEMENT: Console log of prompt content for manual inspection
  - VERIFY: All required sections are present
  - FOLLOW: Pattern from task-breakdown-prompt.test.ts (sample output logging test)
```

### Implementation Patterns & Key Details

```typescript
// CRITICAL: Groundswell mock pattern - MUST mock before imports
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// PATTERN: Dynamic import after mock establishment
async function loadPrompts() {
  return await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');
}

// PATTERN: Test suite structure
describe('integration/delta-prd-generation', () => {
  // CLEANUP: Restore mocks after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // PATTERN: Content verification tests
  describe('DELTA_PRD_GENERATION_PROMPT content verification', () => {
    it('should contain Change Manager role definition', async () => {
      const { DELTA_PRD_GENERATION_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_GENERATION_PROMPT).toContain(
        'Generate Delta PRD from Changes'
      );
    });
  });

  // PATTERN: Retry logic testing with controlled failures
  describe('retry logic verification', () => {
    it('should trigger second attempt on first failure', async () => {
      const mockAgent = {
        prompt: vi
          .fn()
          .mockRejectedValueOnce(new Error('First attempt failed'))
          .mockResolvedValueOnce({
            changes: [],
            patchInstructions: '',
            taskIds: [],
          }),
      };

      const result = await retryAgentPrompt(() => mockAgent.prompt(), {
        agentType: 'QA',
        operation: 'deltaAnalysis',
      });

      expect(mockAgent.prompt).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });
  });
});

// GOTCHA: DELTA_PRD_GENERATION_PROMPT contains shell syntax that is NOT executed
// Tests verify the prompt CONTAINS these strings, not that they work
// $(cat "$PREV_SESSION_DIR/prd_snapshot.md") is a shell template

// CRITICAL: The prompt instructs agent to write to $SESSION_DIR/delta_prd.md
// Tests should verify this instruction exists in the prompt
```

### Integration Points

```yaml
PROMPTS:
  - reference: 'PROMPTS.md lines 793-833'
  - section: DELTA_PRD_GENERATION_PROMPT

AGENTS:
  - integration: 'DeltaAnalysisWorkflow uses QA agent'
  - location: 'src/workflows/delta-analysis-workflow.ts'
  - pattern: 'retryAgentPrompt() wrapper for agent.prompt() calls'

RETRY_LOGIC:
  - integration: 'src/utils/retry.ts'
  - config: 'AGENT_RETRY_CONFIG (maxAttempts: 3, baseDelay: 1000)'
  - function: 'retryAgentPrompt<T>() with createDefaultOnRetry logging'

TEST_FRAMEWORK:
  - framework: 'Vitest'
  - mock_pattern: "vi.mock('groundswell')"
  - assertion_style: '.toContain() for string content verification'
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit tests/integration/delta-prd-generation.test.ts
# Expected: Zero type errors

# Run linter
npm run lint -- tests/integration/delta-prd-generation.test.ts
# Expected: Zero linting errors

# Format check
npm run format -- --check tests/integration/delta-prd-generation.test.ts
# Expected: Zero formatting issues
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the specific integration test
npm test -- tests/integration/delta-prd-generation.test.ts
# Expected: All tests pass

# Run all integration tests for comparison
npm test -- tests/integration/
# Expected: All integration tests pass, including new test
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full test suite
npm test
# Expected: All tests pass, no regressions

# Verify test is discovered by Vitest
npm test -- --list 2>&1 | grep delta-prd-generation
# Expected: Test file appears in list
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Run tests with coverage
npm test -- --coverage
# Expected: Coverage for prompt verification is maintained

# Manual inspection: Run test and check console output
npm test -- tests/integration/delta-prd-generation.test.ts
# Expected: Sample output logging shows prompt content for verification
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/integration/delta-prd-generation.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Test verifies DELTA_PRD_GENERATION_PROMPT contains all required sections
- [ ] Test verifies prompt instructs agent to compare old and new PRDs
- [ ] Test verifies prompt instructs agent to focus on new/modified requirements only
- [ ] Test verifies prompt instructs agent to reference completed work
- [ ] Test verifies retry logic triggers on missing delta PRD
- [ ] Test verifies session fails after retry exhaustion
- [ ] Mock agent responses work correctly for both success and failure scenarios

### Code Quality Validation

- [ ] Follows existing patterns from `tests/integration/task-breakdown-prompt.test.ts`
- [ ] Follows existing patterns from `tests/integration/prp-create-prompt.test.ts`
- [ ] Follows existing patterns from `tests/integration/progressive-validation.test.ts`
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (see below)
- [ ] Mock pattern uses vi.mock('groundswell') consistently
- [ ] Test naming follows kebab-case convention
- [ ] Describe nesting follows requirement groupings

### Documentation & Deployment

- [ ] Code is self-documenting with clear test descriptions
- [ ] Each test has clear purpose in its description
- [ ] Comments explain non-obvious test patterns
- [ ] Console output provides useful debugging information

---

## Anti-Patterns to Avoid

- ❌ Don't mock `agent-factory.ts` - mock `groundswell` instead
- ❌ Don't execute the shell commands in the prompt - verify they exist as strings
- ❌ Don't create real agents in tests - use mocks with `vi.fn()`
- ❌ Don't test actual LLM calls - mock agent responses
- ❌ Don't skip testing the retry logic - verify both retry and fail-fast scenarios
- ❌ Don't use sync operations in async context - all agent calls are async
- ❌ Don't hardcode assertion values - use constants and fixtures
- ❌ Don't create new patterns - follow existing test file patterns
- ❌ Don't use camelCase for test file names - use kebab-case
- ❌ Don't skip the sample output logging test - it's useful for manual verification
