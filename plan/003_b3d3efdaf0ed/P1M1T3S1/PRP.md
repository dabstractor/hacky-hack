# Product Requirement Prompt (PRP): P1.M1.T3.S1 - Verify Architect Agent integration and prompts

---

## Goal

**Feature Goal**: Verify Architect Agent is correctly integrated with proper configuration, TASK_BREAKDOWN_PROMPT validation, and JSON output schema compliance through comprehensive integration tests.

**Deliverable**: Integration test file `tests/integration/agents/architect-agent-integration.test.ts` with test cases covering:

- Architect Agent configuration verification (model, tokens, cache, reflection)
- TASK_BREAKDOWN_PROMPT structure validation (required sections)
- Agent output schema validation against Backlog Zod schema
- JSON file output verification to tasks.json path

**Success Definition**: All tests pass, verifying:

- Architect Agent created with correct config (GLM-4.7, 8192 tokens, cache enabled, reflection enabled)
- TASK_BREAKDOWN_PROMPT contains all required sections (research-driven architecture, implicit TDD, context scope)
- Agent output matches Zod schema for Backlog type
- Agent can write JSON to specified tasks.json path
- Mock Groundswell agent returns test data for deterministic testing

## Why

- Architect Agent is the entry point for PRD analysis and task breakdown
- The TASK_BREAKDOWN_PROMPT is critical for research-driven architecture and proper task decomposition
- JSON output must validate against BacklogSchema to prevent downstream errors
- The existing `tests/integration/architect-agent.test.ts` only validates output, not the integration setup
- Configuration errors (model, tokens, cache) would cause pipeline failures
- Prompt structure errors would cause incomplete or incorrect task breakdowns
- No existing tests verify the agent-factory integration or prompt content

## What

Integration tests that verify Architect Agent is correctly configured and produces valid output.

### Success Criteria

- [ ] Architect Agent configuration validated (model: GLM-4.7, maxTokens: 8192, enableCache: true, enableReflection: true)
- [ ] TASK_BREAKDOWN_PROMPT contains required sections (Research-Driven Architecture, Implicit TDD, Context Scope Blinder, Output Format)
- [ ] Agent prompt has responseFormat set to BacklogSchema
- [ ] Agent output validates against BacklogSchema (safeParse succeeds)
- [ ] Mock Groundswell agent can return test Backlog data
- [ ] Test verifies prompt structure contains "CONTRACT DEFINITION" instructions
- [ ] Test verifies prompt mentions $SESSION_DIR/architecture/ for research storage

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Exact file paths and patterns to follow from existing tests
- Architect Agent configuration values from source code
- TASK_BREAKDOWN_PROMPT structure from PROMPTS.md
- Backlog Zod schema with validation rules
- Mock setup patterns for Groundswell agents
- Research documents with detailed implementation guidance

### Documentation & References

```yaml
# MUST READ - Architect Agent configuration
- file: src/agents/agent-factory.ts
  why: Contains createArchitectAgent() with exact configuration values
  lines: 195-204 (createArchitectAgent function)
  lines: 118-123 (PERSONA_TOKEN_LIMITS)
  lines: 150-176 (createBaseConfig function)
  pattern: Factory function that calls createAgent with config
  gotcha: Architect uses maxTokens: 8192 (vs. 4096 for others)

# MUST READ - TASK_BREAKDOWN_PROMPT structure
- file: PROMPTS.md
  why: Contains the full TASK_BREAKDOWN_SYSTEM_PROMPT that Architect Agent uses
  lines: 54-169 (complete TASK_BREAKDOWN_SYSTEM_PROMPT)
  lines: 76-81 (Research-Driven Architecture section)
  lines: 89-93 (Implicit TDD section)
  lines: 95-102 (Context Scope Blinder section)
  lines: 119-168 (Output Format with JSON structure)
  pattern: Markdown prompt with numbered sections
  gotcha: Story points mentioned as 0.5 in prompt, but schema requires integers 1-21

# MUST READ - Backlog Zod schema
- file: src/core/models.ts
  why: Contains BacklogSchema and all sub-schemas for validation
  lines: 609-611 (BacklogSchema)
  lines: 231-335 (Subtask interface and SubtaskSchema)
  lines: 68-112 (ContextScopeSchema validation)
  lines: 137-167 (Status type and StatusEnum)
  pattern: Zod schema definitions with regex validation
  gotcha: context_scope must have "CONTRACT DEFINITION:" prefix with 4 numbered sections

# MUST READ - Architect prompt generator
- file: src/agents/prompts/architect-prompt.ts
  why: Shows how createArchitectPrompt() integrates TASK_BREAKDOWN_PROMPT and BacklogSchema
  lines: 51-67 (createArchitectPrompt function)
  pattern: Uses createPrompt() with responseFormat for structured output
  gotcha: enableReflection: true for complex JSON generation reliability

# MUST READ - Existing Architect Agent test (reference only, not to duplicate)
- file: tests/integration/architect-agent.test.ts
  why: Shows existing test patterns and what NOT to duplicate
  lines: 27-34 (mock pattern for createArchitectAgent)
  lines: 74-101 (SETUP/EXECUTE/VERIFY pattern)
  lines: 281-297 (traversal validation for story_points)
  pattern: Uses USE_REAL_LLM flag for conditional testing
  gotcha: This test validates output, NOT the integration setup we need to test

# MUST READ - Groundswell Agent/Prompt test patterns
- file: tests/integration/groundswell/agent-prompt.test.ts
  why: Shows patterns for mocking @anthropic-ai/sdk and testing Groundswell integration
  lines: 39-45 (mock pattern for Anthropic SDK)
  lines: 232-263 (validateResponse() test patterns)
  lines: 311-345 (safeValidateResponse() test patterns)
  pattern: vi.mock at top level, dynamic import, SETUP/EXECUTE/VERIFY

# MUST READ - Test setup and global hooks
- file: tests/setup.ts
  why: Contains z.ai API safeguard and global cleanup patterns
  lines: 56-120 (z.ai API endpoint validation)
  lines: 162-180 (beforeEach hooks)
  lines: 189-229 (afterEach hooks with rejection tracking)
  pattern: Global test file with automatic API validation
  gotcha: Tests fail if ANTHROPIC_BASE_URL is api.anthropic.com

# MUST READ - Research documents (in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S1/research/architect-agent-integration-research.md
  why: Complete Architect Agent configuration, prompt structure, schema validation
  section: "Architect Agent Configuration" (exact config values)

- docfile: plan/003_b3d3efdaf0ed/P1M1T3S1/research/test-patterns-research.md
  why: Integration test patterns, mock setup, validation approaches
  section: "Mock Setup Patterns" (vi.mock, vi.hoisted patterns)

- docfile: plan/003_b3d3efdaf0ed/P1M1T3S1/research/backlog-schema-validation-research.md
  why: Complete Backlog schema structure with ID formats and validation rules
  section: "Schema Definitions" (Phase, Milestone, Task, Subtask schemas)
```

### Current Codebase Tree (test directories)

```bash
tests/
├── integration/
│   ├── agents.test.ts                      # Groundswell Agent/Prompt tests
│   ├── architect-agent.test.ts             # Existing: Architect output validation
│   ├── prp-blueprint-agent.test.ts         # PRP Blueprint Prompt tests
│   ├── prp-generator-integration.test.ts   # PRPGenerator integration
│   ├── prp-executor-integration.test.ts    # PRPExecutor integration
│   ├── groundswell/
│   │   ├── agent-prompt.test.ts            # Groundswell Agent/Prompt tests
│   │   ├── workflow.test.ts                # Groundswell Workflow tests
│   │   └── mcp.test.ts                     # Groundswell MCP tests
│   └── core/
│       ├── session-manager.test.ts         # Session Manager tests
│       ├── task-orchestrator.test.ts       # Task Orchestrator tests
│       └── research-queue.test.ts          # ResearchQueue tests (P1.M1.T2.S3)
├── setup.ts                                # Global test setup with API validation
└── unit/
    └── agents/
        └── agent-factory.test.ts           # Agent factory unit tests
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── integration/
│   ├── agents/
│   │   └── architect-agent-integration.test.ts   # NEW: Architect Agent integration tests
│   ├── agents.test.ts                             # Existing
│   ├── architect-agent.test.ts                    # Existing (output validation only)
│   └── [other existing test files...]
```

**New File**: `tests/integration/agents/architect-agent-integration.test.ts`

- Tests Architect Agent configuration from agent-factory
- Tests TASK_BREAKDOWN_PROMPT structure validation
- Tests prompt generation with BacklogSchema
- Tests mock Groundswell agent integration
- Uses vi.mock for Groundswell, not agent-factory (to test real factory)

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Architect Agent uses maxTokens: 8192 (vs. 4096 for other personas)
const PERSONA_TOKEN_LIMITS = {
  architect: 8192, // Larger for complex task decomposition
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;

// CRITICAL: TASK_BREAKDOWN_PROMPT story points say "0.5, 1, or 2"
// BUT the SubtaskSchema requires integers 1-21 (Fibonacci)
// Tests should validate schema compliance, not prompt text

// GOTCHA: MCP servers are singletons registered at module load time
// This prevents re-registration across tests
// Use vi.mock('groundswell') to avoid MCP registration issues

// CRITICAL: Tests MUST use .js extensions for imports (ES modules)
import { createArchitectAgent } from '../../src/agents/agent-factory.js';

// GOTCHA: Global test setup (tests/setup.ts) blocks Anthropic API
// Tests will fail if ANTHROPIC_BASE_URL is https://api.anthropic.com
// Must use https://api.z.ai/api/anthropic

// CRITICAL: Use vi.mock() at top level BEFORE imports (hoisting required)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});

// GOTCHA: When testing agent-factory, mock Groundswell NOT agent-factory
// We want to test the REAL createArchitectAgent() function
// So we mock createAgent() which it calls internally

// CRITICAL: TASK_BREAKDOWN_PROMPT has 4 required sections to validate
// 1. Research-Driven Architecture (lines 76-81)
// 2. Coherence & Continuity (lines 83-87)
// 3. Implicit TDD & Quality (lines 89-93)
// 4. Context Scope Blinder (lines 95-102)

// GOTCHA: Context scope must have exact section headers
// "1. RESEARCH NOTE:" (not "Research Note" or "1. Research Note")
// Regex: /1\.\s*RESEARCH\sNOTE:/m requires number, period, space, exact words

// CRITICAL: BacklogSchema uses z.lazy() for recursive definitions
// Phase → Milestone → Task → Subtask
// Each schema references the next via z.lazy()

// GOTCHA: Existing test (architect-agent.test.ts) mocks createArchitectAgent
// Our new test should NOT mock createArchitectAgent
// Instead, mock Groundswell's createAgent() to test the real factory
```

## Implementation Blueprint

### Data Models and Structure

Use existing Backlog type and schema from `src/core/models.ts`:

```typescript
// Backlog type (already exists, import for use)
import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
} from '../../src/core/models.js';

// BacklogSchema for validation (already exists, import for use)
import {
  BacklogSchema,
  StatusEnum,
  ContextScopeSchema,
} from '../../src/core/models.js';
```

**Test Fixture for Mock Backlog**:

```typescript
const createMockBacklog = (): Backlog => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1: Test',
      status: 'Planned',
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1.1',
          status: 'Planned',
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1.1.1',
              status: 'Planned',
              description: 'Test task',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Subtask 1.1.1.1',
                  status: 'Planned',
                  story_points: 2,
                  dependencies: [],
                  context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test research findings.
2. INPUT: None.
3. LOGIC: Test logic implementation.
4. OUTPUT: Test output for next subtask.`,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/agents/architect-agent-integration.test.ts
  - IMPLEMENT: File header with JSDoc comments describing test purpose
  - IMPLEMENT: Import statements for Vitest, types, mocks
  - IMPLEMENT: Top-level vi.mock() for Groundswell (NOT agent-factory)
  - FOLLOW pattern: tests/integration/groundswell/agent-prompt.test.ts (mock setup)
  - NAMING: architect-agent-integration.test.ts (distinguished from existing test)
  - PLACEMENT: tests/integration/agents/ directory (create agents subdir if needed)

Task 2: IMPLEMENT mock setup with dynamic imports
  - IMPLEMENT: vi.mock('groundswell') with createAgent mock
  - IMPLEMENT: Dynamic import function for Groundswell
  - IMPLEMENT: Mock createAgent to return object with prompt() method
  - DEPENDENCIES: Task 1 (file created)

Task 3: IMPLEMENT main describe block and hooks
  - IMPLEMENT: Main describe block 'integration/agents/architect-agent-integration'
  - IMPLEMENT: beforeAll to load Groundswell dynamically
  - IMPLEMENT: beforeEach to clear mocks
  - IMPLEMENT: afterEach to unstub environments
  - FOLLOW pattern: tests/integration/groundswell/agent-prompt.test.ts (test structure)

Task 4: IMPLEMENT architect agent configuration tests
  - CREATE: describe block 'createArchitectAgent configuration'
  - IMPLEMENT: test 'should create architect agent with GLM-4.7 model'
    - SETUP: Import TASK_BREAKDOWN_PROMPT from prompts.js
    - EXECUTE: Call createArchitectAgent()
    - VERIFY: createAgent called with model: 'GLM-4.7'
  - IMPLEMENT: test 'should create architect agent with 8192 max tokens'
    - VERIFY: createAgent called with maxTokens: 8192
  - IMPLEMENT: test 'should create architect agent with cache enabled'
    - VERIFY: createAgent called with enableCache: true
  - IMPLEMENT: test 'should create architect agent with reflection enabled'
    - VERIFY: createAgent called with enableReflection: true
  - DEPENDENCIES: Task 2 (mock setup complete)

Task 5: IMPLEMENT TASK_BREAKDOWN_PROMPT validation tests
  - CREATE: describe block 'TASK_BREAKDOWN_PROMPT validation'
  - IMPLEMENT: test 'should contain Research-Driven Architecture section'
    - VERIFY: Prompt contains 'RESEARCH-DRIVEN ARCHITECTURE'
    - VERIFY: Prompt mentions spawning subagents for research
    - VERIFY: Prompt mentions storing findings in $SESSION_DIR/architecture/
  - IMPLEMENT: test 'should contain Implicit TDD section'
    - VERIFY: Prompt contains 'IMPLICIT TDD'
    - VERIFY: Prompt states 'DO NOT create subtasks for "Write Tests"'
  - IMPLEMENT: test 'should contain Context Scope Blinder section'
    - VERIFY: Prompt contains 'CONTEXT SCOPE'
    - VERIFY: Prompt defines INPUT, OUTPUT, MOCKING requirements
  - IMPLEMENT: test 'should instruct to write to $TASKS_FILE'
    - VERIFY: Prompt contains './$TASKS_FILE'
    - VERIFY: Prompt instructs not to output JSON to conversation
  - DEPENDENCIES: Task 4 (configuration tests validate agent setup)

Task 6: IMPLEMENT prompt generation with BacklogSchema tests
  - CREATE: describe block 'createArchitectPrompt'
  - IMPLEMENT: test 'should create prompt with BacklogSchema responseFormat'
    - SETUP: Import createArchitectPrompt from architect-prompt.js
    - EXECUTE: Call createArchitectPrompt(prdContent)
    - VERIFY: createPrompt called with responseFormat: BacklogSchema
  - IMPLEMENT: test 'should create prompt with enableReflection'
    - VERIFY: createPrompt called with enableReflection: true
  - IMPLEMENT: test 'should create prompt with TASK_BREAKDOWN_SYSTEM_PROMPT'
    - VERIFY: createPrompt called with system: TASK_BREAKDOWN_PROMPT
  - DEPENDENCIES: Task 5 (prompt validation tests)

Task 7: IMPLEMENT agent output schema validation tests
  - CREATE: describe block 'agent output validation'
  - IMPLEMENT: test 'should validate output against BacklogSchema'
    - SETUP: Mock agent.prompt() to return mockBacklog
    - EXECUTE: Call architect.prompt(prompt)
    - VERIFY: BacklogSchema.safeParse(result).success === true
  - IMPLEMENT: test 'should validate all ID formats'
    - VERIFY: Phase IDs match /^P\d+$/
    - VERIFY: Milestone IDs match /^P\d+\.M\d+$/
    - VERIFY: Task IDs match /^P\d+\.M\d+\.T\d+$/
    - VERIFY: Subtask IDs match /^P\d+\.M\d+\.T\d+\.S\d+$/
  - IMPLEMENT: test 'should validate story_points are integers 1-21'
    - VERIFY: All subtask.story_points are integers in range
    - USE: Traversal pattern from existing test (architect-agent.test.ts:281-297)
  - IMPLEMENT: test 'should validate context_scope format'
    - VERIFY: All context_scope contain 'CONTRACT DEFINITION:'
    - VERIFY: All context_scope have 4 numbered sections
  - DEPENDENCIES: Task 6 (prompt generation tests)

Task 8: IMPLEMENT mock Groundswell agent integration tests
  - CREATE: describe block 'mock Groundswell agent integration'
  - IMPLEMENT: test 'should return mock Backlog data'
    - SETUP: Mock createAgent to return controlled response
    - EXECUTE: Call createArchitectAgent() then agent.prompt()
    - VERIFY: Returns expected Backlog structure
  - IMPLEMENT: test 'should allow deterministic testing with mocks'
    - SETUP: Set up specific mock return values
    - EXECUTE: Run test multiple times
    - VERIFY: Consistent output (no random LLM variation)
  - DEPENDENCIES: Task 7 (output validation tests)

Task 9: VERIFY all tests follow project patterns
  - VERIFY: Test file uses vi.mock for Groundswell (NOT agent-factory)
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock variables use proper hoisting patterns
  - VERIFY: Test file location matches conventions (tests/integration/agents/)
  - VERIFY: afterEach cleanup includes vi.unstubAllEnvs()
  - VERIFY: Tests validate actual createArchitectAgent() (not mocked)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Top-level Groundswell mock (tests real agent-factory)
import { afterEach, describe, expect, it, vi, beforeAll } from 'vitest';

// CRITICAL: Mock Groundswell, NOT agent-factory
// This allows testing the real createArchitectAgent() function
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});

// Dynamic import ensures mocks are applied
async function loadGroundswell() {
  return await import('groundswell');
}

// PATTERN: Test structure with beforeAll for dynamic imports
describe('integration/agents/architect-agent-integration', () => {
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

  // ... tests
});

// PATTERN: Configuration verification test
it('should create architect agent with GLM-4.7 model', () => {
  // SETUP: Import real agent-factory after mocks
  const { createArchitectAgent } = require('../../src/agents/agent-factory.js');
  const { TASK_BREAKDOWN_PROMPT } = require('../../src/agents/prompts.js');

  // EXECUTE: Create architect agent
  createArchitectAgent();

  // VERIFY: createAgent called with correct config
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'ArchitectAgent',
      model: 'GLM-4.7',
      system: TASK_BREAKDOWN_PROMPT,
      maxTokens: 8192,
      enableCache: true,
      enableReflection: true,
    })
  );
});

// PATTERN: Prompt validation test (TASK_BREAKDOWN_PROMPT content)
it('should contain Research-Driven Architecture section', () => {
  // SETUP: Import TASK_BREAKDOWN_PROMPT
  const { TASK_BREAKDOWN_PROMPT } = require('../../src/agents/prompts.js');

  // VERIFY: Contains key phrases from Research-Driven Architecture section
  expect(TASK_BREAKDOWN_PROMPT).toContain('RESEARCH-DRIVEN ARCHITECTURE');
  expect(TASK_BREAKDOWN_PROMPT).toContain('SPAWN SUBAGENTS');
  expect(TASK_BREAKDOWN_PROMPT).toContain('$SESSION_DIR/architecture/');
  expect(TASK_BREAKDOWN_PROMPT).toContain('VALIDATE BEFORE BREAKING DOWN');
});

// PATTERN: Implicit TDD validation
it('should contain Implicit TDD section', () => {
  const { TASK_BREAKDOWN_PROMPT } = require('../../src/agents/prompts.js');

  expect(TASK_BREAKDOWN_PROMPT).toContain('IMPLICIT TDD');
  expect(TASK_BREAKDOWN_PROMPT).toContain(
    'DO NOT create subtasks for "Write Tests"'
  );
  expect(TASK_BREAKDOWN_PROMPT).toContain('DEFINITION OF DONE');
});

// PATTERN: Context Scope Blinder validation
it('should contain Context Scope Blinder section', () => {
  const { TASK_BREAKDOWN_PROMPT } = require('../../src/agents/prompts.js');

  expect(TASK_BREAKDOWN_PROMPT).toContain('CONTEXT SCOPE');
  expect(TASK_BREAKDOWN_PROMPT).toContain('INPUT:');
  expect(TASK_BREAKDOWN_PROMPT).toContain('OUTPUT:');
  expect(TASK_BREAKDOWN_PROMPT).toContain('MOCKING:');
});

// PATTERN: Prompt generation test
it('should create prompt with BacklogSchema responseFormat', () => {
  // SETUP: Import createArchitectPrompt
  const {
    createArchitectPrompt,
  } = require('../../src/agents/prompts/architect-prompt.js');
  const { BacklogSchema } = require('../../src/core/models.js');

  // EXECUTE: Create prompt
  const prdContent = '# Test PRD\n\nTest content.';
  const prompt = createArchitectPrompt(prdContent);

  // VERIFY: createPrompt called with BacklogSchema
  expect(gs.createPrompt).toHaveBeenCalledWith(
    expect.objectContaining({
      user: prdContent,
      responseFormat: BacklogSchema,
      enableReflection: true,
    })
  );
});

// PATTERN: Output validation with traversal
it('should validate story_points are integers 1-21', async () => {
  // SETUP: Create mock agent with controlled response
  const mockBacklog = createMockBacklog();
  gs.createAgent.mockReturnValue({
    prompt: vi.fn().mockResolvedValue(mockBacklog),
  });

  // EXECUTE: Call architect agent
  const { createArchitectAgent } = require('../../src/agents/agent-factory.js');
  const architect = createArchitectAgent();
  const {
    createArchitectPrompt,
  } = require('../../src/agents/prompts/architect-prompt.js');
  const prompt = createArchitectPrompt('# Test');
  const result = await architect.prompt(prompt);

  // VERIFY: Traverse all subtasks and validate story_points
  for (const phase of result.backlog) {
    for (const milestone of phase.milestones) {
      for (const task of milestone.tasks) {
        for (const subtask of task.subtasks) {
          expect(Number.isInteger(subtask.story_points)).toBe(true);
          expect(subtask.story_points).toBeGreaterThanOrEqual(1);
          expect(subtask.story_points).toBeLessThanOrEqual(21);
        }
      }
    }
  }
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS:
  - This is integration test with mocked Groundswell agent
  - No actual file system operations required
  - Focus on agent-factory configuration and prompt validation

MOCK INTEGRATIONS:
  - Mock: groundswell (createAgent) - control agent creation
  - Real: src/agents/agent-factory.js (test real factory)
  - Real: src/agents/prompts.js (import real TASK_BREAKDOWN_PROMPT)
  - Real: src/agents/prompts/architect-prompt.js (import real createArchitectPrompt)

DEPENDENCY ON PREVIOUS WORK ITEM:
  - P1.M1.T2.S3 provides ResearchQueue integration test patterns
  - Reference for mock setup and validation patterns

PARALLEL CONTEXT:
  - P1.M1.T2.S3 (Verify parallel PRP generation via ResearchQueue)
  - That PRP tests ResearchQueue behavior
  - This PRP tests Architect Agent configuration
  - No overlap or conflict in test coverage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/agents/architect-agent-integration.test.ts
# OR
npx eslint tests/integration/agents/architect-agent-integration.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- tests/integration/agents/architect-agent-integration.test.ts
# OR
npx vitest run tests/integration/agents/architect-agent-integration.test.ts

# Run with coverage
npm test -- --coverage tests/integration/agents/architect-agent-integration.test.ts

# Run all agent-related tests to ensure no breakage
npm test -- tests/unit/agents/agent-factory.test.ts
npm test -- tests/integration/agents.test.ts
npm test -- tests/integration/architect-agent.test.ts

# Expected: All tests pass, good coverage for configuration validation
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full integration test suite still passes
npm test -- tests/integration/
# OR
npx vitest run tests/integration/

# Check that existing tests still work
npx vitest run tests/integration/groundswell/
npx vitest run tests/integration/agents.test.ts

# Expected: All existing integration tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/agents/architect-agent-integration.test.ts

# Check test file follows project conventions
head -100 tests/integration/agents/architect-agent-integration.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/integration/agents/architect-agent-integration.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage for Architect Agent configuration
npm test -- --coverage tests/integration/agents/architect-agent-integration.test.ts
# Should see coverage for createArchitectAgent, createArchitectPrompt

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npm test -- tests/integration/agents/architect-agent-integration.test.ts`
- [ ] No linting errors: `npm run lint tests/integration/agents/architect-agent-integration.test.ts`
- [ ] Coverage shows Architect Agent configuration tested
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] Architect Agent configuration verified (GLM-4.7, 8192, cache, reflection)
- [ ] TASK_BREAKDOWN_PROMPT contains Research-Driven Architecture section
- [ ] TASK_BREAKDOWN_PROMPT contains Implicit TDD section
- [ ] TASK_BREAKDOWN_PROMPT contains Context Scope Blinder section
- [ ] createArchitectPrompt uses BacklogSchema as responseFormat
- [ ] createArchitectPrompt has enableReflection: true
- [ ] Agent output validates against BacklogSchema
- [ ] Mock Groundswell agent returns test data deterministically

### Code Quality Validation

- [ ] Follows existing integration test patterns from agent-prompt.test.ts
- [ ] Uses SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.mock for Groundswell (not agent-factory)
- [ ] Test file location matches conventions (tests/integration/agents/)
- [ ] afterEach cleanup includes vi.unstubAllEnvs()
- [ ] Tests use dynamic import pattern for Groundswell

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Complex validations (prompt content, schema) have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Edge cases are explicitly tested (ID formats, story points range)

---

## Anti-Patterns to Avoid

- ❌ Don't mock createArchitectAgent - test the real factory function
- ❌ Don't duplicate existing tests from architect-agent.test.ts
- ❌ Don't test LLM output quality - focus on configuration and schema
- ❌ Don't use real LLM calls - always use mocks for deterministic testing
- ❌ Don't skip vi.unstubAllEnvs() in afterEach
- ❌ Don't use setTimeout without proper waiting/awaiting
- ❌ Don't skip testing the required prompt sections
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't hardcode configuration values - use imports from source
- ❌ Don't test unit-level behavior - focus on integration scenarios
- ❌ Don't forget to validate both configuration AND prompt content
- ❌ Don't ignore the story points schema vs prompt text discrepancy
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific
- ❌ Don't create temp directories - this test doesn't need file I/O
- ❌ Don't mock the entire agent-factory - mock Groundswell instead

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T3.S1
**Created:** 2026-01-19
**Status:** Ready for Implementation
