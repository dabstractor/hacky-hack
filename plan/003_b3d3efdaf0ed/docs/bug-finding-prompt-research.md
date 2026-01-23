# Research: Bug Finding Prompt Testing Phases Verification

## Overview

This research document supports the creation of an integration test for verifying the Bug Finding Prompt (BUG_HUNT_PROMPT) testing phases as specified in subtask P1.M3.T5.S1.

## Contract Definition Requirements

From the subtask description:
1. **RESEARCH NOTE**: Bug Finding Prompt defines three testing phases: Scope Analysis, Creative E2E Testing (happy paths, edge cases, workflows, integrations, errors, state, concurrency), Adversarial Testing (unexpected inputs, missing features, incomplete features, UX).
2. **INPUT**: BUG_FINDING_PROMPT from `PROMPTS.md`, BugHuntWorkflow implementation.
3. **LOGIC**: Write integration test that verifies: (a) prompt defines all three testing phases, (b) prompt specifies happy path testing, (c) prompt specifies edge case testing, (d) prompt specifies workflow testing, (e) prompt specifies adversarial testing mindset.
4. **OUTPUT**: Integration test file `tests/integration/bug-finding-prompt.test.ts` with testing phases and scope verification.

## BUG_HUNT_PROMPT Structure

### Location
- **File**: `/home/dustin/projects/hacky-hack/src/agents/prompts.ts`
- **Lines**: 868-979
- **Export Name**: `BUG_HUNT_PROMPT`

### Complete Prompt Structure

```typescript
export const BUG_HUNT_PROMPT = `
# Creative Bug Finding - End-to-End PRD Validation

You are a creative QA engineer and bug hunter. Your mission is to rigorously test the implementation against the original PRD scope and find any issues that the standard validation might have missed.

## Inputs

**Original PRD:**
$(cat "$PRD_FILE")

**Completed Tasks:**
$(cat "$TASKS_FILE")

## Your Mission

### Phase 1: PRD Scope Analysis

1. Read and deeply understand the original PRD requirements
2. Map each requirement to what should have been implemented
3. Identify the expected user journeys and workflows
4. Note any edge cases or corner cases implied by the requirements

### Phase 2: Creative End-to-End Testing

Think like a user, then think like an adversary. Test the implementation:

1. **Happy Path Testing**: Does the primary use case work as specified?
2. **Edge Case Testing**: What happens at boundaries? (empty inputs, max values, unicode, special chars)
3. **Workflow Testing**: Can a user complete the full journey described in the PRD?
4. **Integration Testing**: Do all the pieces work together correctly?
5. **Error Handling**: What happens when things go wrong? Are errors graceful?
6. **State Testing**: Does the system handle state transitions correctly?
7. **Concurrency Testing** (if applicable): What if multiple operations happen at once?
8. **Regression Testing**: Did fixing one thing break another?

### Phase 3: Adversarial Testing

Think creatively about what could go wrong:

1. **Unexpected Inputs**: What inputs did the PRD not explicitly define?
2. **Missing Features**: What did the PRD ask for that might not be implemented?
3. **Incomplete Features**: What is partially implemented but not fully working?
4. **Implicit Requirements**: What should obviously work but wasn't explicitly stated?
5. **User Experience Issues**: Is the implementation usable and intuitive?

### Phase 4: Documentation as Bug Report

[... bug report template ...]
```

## Three Testing Phases Analysis

### Phase 1: PRD Scope Analysis

**Purpose**: Understand PRD requirements before testing

**Key Elements**:
- "Read and deeply understand the original PRD requirements"
- "Map each requirement to what should have been implemented"
- "Identify the expected user journeys and workflows"
- "Note any edge cases or corner cases implied by the requirements"

**Verification Requirements**:
- ✓ Prompt contains "Phase 1: PRD Scope Analysis"
- ✓ Prompt mentions understanding PRD requirements
- ✓ Prompt mentions mapping requirements to implementation
- ✓ Prompt mentions identifying user journeys

### Phase 2: Creative End-to-End Testing

**Purpose**: Comprehensive testing across multiple dimensions

**Key Testing Categories**:

1. **Happy Path Testing**:
   - "Does the primary use case work as specified?"
   - Verification: Contains "Happy Path Testing" and "primary use case"

2. **Edge Case Testing**:
   - "What happens at boundaries? (empty inputs, max values, unicode, special chars)"
   - Verification: Contains "Edge Case Testing", "boundaries", "empty inputs"

3. **Workflow Testing**:
   - "Can a user complete the full journey described in the PRD?"
   - Verification: Contains "Workflow Testing", "full journey"

4. **Integration Testing**:
   - "Do all the pieces work together correctly?"
   - Verification: Contains "Integration Testing"

5. **Error Handling**:
   - "What happens when things go wrong? Are errors graceful?"
   - Verification: Contains "Error Handling", "graceful"

6. **State Testing**:
   - "Does the system handle state transitions correctly?"
   - Verification: Contains "State Testing", "state transitions"

7. **Concurrency Testing**:
   - "What if multiple operations happen at once?"
   - Verification: Contains "Concurrency Testing"

8. **Regression Testing**:
   - "Did fixing one thing break another?"
   - Verification: Contains "Regression Testing"

### Phase 3: Adversarial Testing

**Purpose**: Think creatively about what could go wrong

**Key Adversarial Categories**:

1. **Unexpected Inputs**:
   - "What inputs did the PRD not explicitly define?"
   - Verification: Contains "Unexpected Inputs"

2. **Missing Features**:
   - "What did the PRD ask for that might not be implemented?"
   - Verification: Contains "Missing Features", "PRD ask for"

3. **Incomplete Features**:
   - "What is partially implemented but not fully working?"
   - Verification: Contains "Incomplete Features"

4. **Implicit Requirements**:
   - "What should obviously work but wasn't explicitly stated?"
   - Verification: Contains "Implicit Requirements"

5. **User Experience Issues**:
   - "Is the implementation usable and intuitive?"
   - Verification: Contains "User Experience Issues"

## BugHuntWorkflow Implementation

### Location
- **File**: `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`
- **Class**: `BugHuntWorkflow`
- **Extends**: `Workflow` (from Groundswell)

### Phase Methods

```typescript
export class BugHuntWorkflow extends Workflow {
  /**
   * Phase 1: Scope Analysis
   */
  @Step({ trackTiming: true })
  async analyzeScope(): Promise<void>

  /**
   * Phase 2: Creative End-to-End Testing
   */
  @Step({ trackTiming: true })
  async creativeE2ETesting(): Promise<void>

  /**
   * Phase 3: Adversarial Testing
   */
  @Step({ trackTiming: true })
  async adversarialTesting(): Promise<void>

  /**
   * Phase 4: Generate Bug Report
   */
  @Step({ trackTiming: true })
  async generateReport(): Promise<TestResults>
}
```

### Logging Categories

The BugHuntWorkflow logs specific test categories:

**Phase 2 E2E Test Categories** (from line 171-180):
```typescript
const testCategories = [
  'Happy Path Testing',
  'Edge Case Testing',
  'Workflow Testing',
  'Integration Testing',
  'Error Handling',
  'State Testing',
  'Concurrency Testing',
  'Regression Testing',
];
```

**Phase 3 Adversarial Categories** (from line 214-222):
```typescript
const adversarialCategories = [
  'Unexpected Inputs',
  'Missing Features',
  'Incomplete Features',
  'Implicit Requirements',
  'User Experience Issues',
  'Security Concerns',
  'Performance Issues',
];
```

## Existing Test Patterns

### Test File Locations

1. **Unit Tests**:
   - `/home/dustin/projects/hacky-hack/tests/unit/workflows/bug-hunt-workflow.test.ts`
   - Tests workflow methods, state transitions, error handling

2. **Integration Tests**:
   - `/home/dustin/projects/hacky-hack/tests/integration/bug-hunt-workflow-integration.test.ts`
   - Tests end-to-end workflow execution with mocked agents

3. **Prompt Tests**:
   - `/home/dustin/projects/hacky-hack/tests/unit/agents/prompts/bug-hunt-prompt.test.ts`
   - Tests `createBugHuntPrompt()` function

### Existing Prompt Verification Patterns

From `/home/dustin/projects/hacky-hack/tests/unit/agents/prompts/bug-hunt-prompt.test.ts`:

```typescript
describe('prompt structure validation', () => {
  it('should include all 4 testing phases from BUG_HUNT_PROMPT', () => {
    const prompt = createBugHuntPrompt(prd, completedTasks);

    // VERIFY: All 4 phases are present
    expect(prompt.user).toContain('Phase 1: PRD Scope Analysis');
    expect(prompt.user).toContain('Phase 2: Creative End-to-End Testing');
    expect(prompt.user).toContain('Phase 3: Adversarial Testing');
    expect(prompt.user).toContain('Phase 4: Documentation as Bug Report');
  });
});
```

## Testing Framework Configuration

### Vitest Configuration
- **File**: `/home/dustin/projects/hacky-hack/vitest.config.ts`
- **Environment**: `node`
- **Coverage Provider**: `v8`
- **Coverage Threshold**: 100% (statements, branches, functions, lines)

### Global Test Setup
- **File**: `/home/dustin/projects/hacky-hack/tests/setup.ts`
- **Key Features**:
  - Environment variable loading via dotenv
  - z.ai API endpoint validation (blocks Anthropic API usage)
  - Promise rejection tracking
  - Mock cleanup and garbage collection

## Test File Naming Conventions

Based on existing patterns:
- Integration tests: `tests/integration/*.test.ts`
- Unit tests: `tests/unit/**/*.test.ts`
- Manual tests: `tests/manual/*.test.ts`

For this task: `tests/integration/bug-finding-prompt.test.ts`

## Mock Patterns

### Agent Factory Mocking
```typescript
vi.mock('../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));
```

### Prompt Import Pattern
```typescript
// Use dynamic import for prompts to avoid Groundswell initialization
const { BUG_HUNT_PROMPT } = await import('../../src/agents/prompts.js');
```

## Test Data Fixtures

### Task Factory Pattern
```typescript
const createTestTask = (
  id: string,
  title: string,
  description?: string
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Complete',
  description: description ?? `Description for ${title}`,
  subtasks: [],
});
```

### PRD Content Sample
```typescript
const mockPRD = `# Test PRD

## Requirements

Build a user authentication system.

## Success Criteria

- Users can login with credentials
- Session management works correctly
`;
```

## Assertion Patterns

### Content Verification
```typescript
expect(prompt).toContain('Phase 1: PRD Scope Analysis');
expect(prompt).toContain('Happy Path Testing');
expect(prompt).toContain('Edge Case Testing');
```

### Regex Pattern Matching
```typescript
expect(prompt).toMatch(/Happy Path Testing.*primary use case/s);
```

### Structure Verification
```typescript
expect(prompt.systemOverride).toBeDefined();
expect(prompt.user).toBeDefined();
expect(prompt.enableReflection).toBe(true);
```

## Required Test Coverage

Based on the contract definition, the integration test must verify:

### (a) Prompt defines all three testing phases
- Phase 1: PRD Scope Analysis
- Phase 2: Creative End-to-End Testing
- Phase 3: Adversarial Testing

### (b) Prompt specifies happy path testing
- Contains "Happy Path Testing"
- Mentions "primary use case"

### (c) Prompt specifies edge case testing
- Contains "Edge Case Testing"
- Mentions "boundaries", "empty inputs", "max values", "unicode"

### (d) Prompt specifies workflow testing
- Contains "Workflow Testing"
- Mentions "full journey"

### (e) Prompt specifies adversarial testing mindset
- Contains "Phase 3: Adversarial Testing"
- Mentions "Think like a user, then think like an adversary"
- Contains adversarial categories

## Implementation Considerations

### 1. Dynamic Import for Prompts
The BUG_HUNT_PROMPT is defined in `src/agents/prompts.ts` which may have side effects. Use dynamic import within tests.

### 2. Mock Groundswell Dependencies
The prompt creation uses Groundswell's `createPrompt()` which may initialize agents. Mock these to avoid side effects.

### 3. Test Organization
Structure tests to mirror the prompt's phase structure:
- describe('Phase 1: Scope Analysis')
- describe('Phase 2: Creative E2E Testing')
  - describe('Happy Path Testing')
  - describe('Edge Case Testing')
  - etc.
- describe('Phase 3: Adversarial Testing')

### 4. Reusable Test Utilities
Consider creating helper functions for common assertions:
```typescript
function verifyPhasePresent(prompt: string, phaseName: string): void
function verifyTestingCategory(prompt: string, category: string): void
```

## External Research References

### Vitest Documentation
- https://vitest.dev/guide/ - Main guide
- https://vitest.dev/api/expect.html - Assertion API
- https://vitest.dev/api/mock.html - Mocking functions

### Testing Best Practices
- Three-phase testing (Setup/Execute/Verify)
- Factory functions for test data
- Mock external dependencies
- Test both success and failure cases
- Use descriptive test names

## Summary

This research provides comprehensive context for creating an integration test that verifies the Bug Finding Prompt testing phases. The test should:

1. Import BUG_HUNT_PROMPT from `src/agents/prompts.ts`
2. Verify all three phases are present
3. Verify each testing category is specified
4. Verify adversarial testing mindset is defined
5. Follow existing test patterns in the codebase
6. Use Vitest with proper mocking and assertions

Key files to reference:
- `/home/dustin/projects/hacky-hack/PROMPTS.md` (lines 1059-1175)
- `/home/dustin/projects/hacky-hack/src/agents/prompts.ts` (lines 868-979)
- `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/agents/prompts/bug-hunt-prompt.test.ts`
