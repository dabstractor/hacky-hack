# Product Requirement Prompt (PRP): Test Agent Factory and Prompts

**Work Item**: P4.M4.T2.S1 - Test agent factory and prompts
**Status**: Research Complete -> Ready for Implementation

---

## Goal

**Feature Goal**: Create comprehensive integration tests for the agent factory and prompt system, validating that all agent creators use correct system prompts and that prompt generators return properly typed Groundswell Prompt objects with correct Zod schemas.

**Deliverable**: Integration test file `tests/integration/agents.test.ts` with mocked Groundswell Agent and createAgent, testing:
- `createBaseConfig()` environment variable mapping
- `createArchitectAgent()` uses `TASK_BREAKDOWN_PROMPT`
- `createResearcherAgent()` uses `PRP_BLUEPRINT_PROMPT`
- `createCoderAgent()` uses `PRP_BUILDER_PROMPT`
- `createQAAgent()` uses `BUG_HUNT_PROMPT`
- `createArchitectPrompt()` returns `Prompt<Backlog>` with BacklogSchema
- `createPRPBlueprintPrompt()` returns `Prompt<PRPDocument>` with PRPDocumentSchema

**Success Definition**:
- All agent creator functions are tested with mocked Groundswell dependencies
- All system prompt assignments are validated
- All prompt generators return correctly typed Prompt objects
- Zod schema associations are verified
- Tests pass with 100% coverage for agent-factory.ts
- No real LLM calls are made (all mocked)

## User Persona (if applicable)

**Target User**: PRPPipeline test validation system (automated QA)

**Use Case**: The test suite validates that:
1. Agent factory correctly configures Groundswell agents with proper personas
2. Environment variables are correctly mapped for SDK compatibility
3. System prompts are correctly assigned to each agent type
4. Prompt generators create type-safe Groundswell Prompt objects
5. Zod schemas are properly associated for structured output

**User Journey**:
1. Developer runs `npm test` to execute all tests
2. Vitest runs integration tests for agent factory and prompts
3. Mocked Groundswell agents prevent real LLM calls
4. All tests pass -> validation complete

**Pain Points Addressed**:
- **No Integration Coverage**: Existing tests are unit-only, don't validate agent factory integration
- **System Prompt Validation**: Need to verify correct prompts are assigned to each agent
- **Type Safety Verification**: Need to validate Prompt<T> typing and schema associations
- **Mock Strategy**: Groundswell's singleton MCP servers require careful mocking approach

## Why

- **Agent Factory Critical**: Agent factory is core to PRPPipeline - all agent creation flows through it
- **System Prompt Correctness**: Wrong prompt assigned = wrong agent behavior
- **Environment Mapping**: SDK expects ANTHROPIC_API_KEY, shell provides ANTHROPIC_AUTH_TOKEN
- **Type Safety**: Prompt<T> with Zod schemas ensures structured LLM output
- **Mock Strategy**: Groundswell agents register MCP tools at module load time - tests must mock this
- **Integration Validation**: Unit tests exist but don't test the full factory -> agent -> prompt flow

## What

### Input

- Agent factory implementation:
  - `src/agents/agent-factory.ts` (createBaseConfig, createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent)
  - `src/agents/prompts.ts` (TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, BUG_HUNT_PROMPT)
- Prompt generator implementations:
  - `src/agents/prompts/architect-prompt.ts` (createArchitectPrompt)
  - `src/agents/prompts/prp-blueprint-prompt.ts` (createPRPBlueprintPrompt)
  - `src/agents/prompts/bug-hunt-prompt.ts` (createBugHuntPrompt)
  - `src/agents/prompts/delta-analysis-prompt.ts` (createDeltaAnalysisPrompt)
- Existing test patterns:
  - `tests/unit/agents/agent-factory.test.ts` (unit tests for createBaseConfig)
  - `tests/integration/architect-agent.test.ts` (integration test with mocked createArchitectAgent)
- Vitest configuration: `vitest.config.ts`
- Groundswell API docs: `plan/001_14b9dc2a33c7/architecture/groundswell_api.md`

### State Changes

- **Create** `tests/integration/agents.test.ts` with comprehensive agent factory and prompt tests
- **Mock** Groundswell's `createAgent` to prevent real LLM calls
- **Validate** agent creators use correct system prompts
- **Validate** prompt generators return correct types with Zod schemas
- **Verify** environment variable mapping in agent configurations

### Output

- Integration test file: `tests/integration/agents.test.ts`
- Test coverage: 100% for `src/agents/agent-factory.ts`
- Validated system prompt assignments for all agent types
- Verified Prompt<T> typing for all prompt generators
- Mock strategy documentation for Groundswell testing

### Success Criteria

- [ ] Mock Groundswell Agent and createAgent successfully
- [ ] Test createBaseConfig() maps ANTHROPIC_AUTH_TOKEN -> ANTHROPIC_API_KEY
- [ ] Test createArchitectAgent() uses TASK_BREAKDOWN_PROMPT
- [ ] Test createResearcherAgent() uses PRP_BLUEPRINT_PROMPT
- [ ] Test createCoderAgent() uses PRP_BUILDER_PROMPT
- [ ] Test createQAAgent() uses BUG_HUNT_PROMPT
- [ ] Test createArchitectPrompt() returns Prompt<Backlog> with BacklogSchema
- [ ] Test createPRPBlueprintPrompt() returns Prompt<PRPDocument> with PRPDocumentSchema
- [ ] Test createBugHuntPrompt() returns Prompt<TestResults> with TestResultsSchema
- [ ] Test createDeltaAnalysisPrompt() returns Prompt<DeltaAnalysis> with DeltaAnalysisSchema
- [ ] All tests pass with mocked LLM calls
- [ ] Coverage 100% for agent-factory.ts

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement the agent factory and prompt integration tests successfully?

**Answer**: **YES** - This PRP provides:
- Complete agent factory implementation reference
- Existing test patterns to follow (agent-factory.test.ts, architect-agent.test.ts)
- Groundswell API documentation for mocking strategy
- All system prompt locations and content
- All prompt generator implementations
- Vitest configuration and test patterns
- Specific mock patterns for Groundswell dependencies

### Documentation & References

```yaml
# MUST READ - Agent Factory Implementation
- file: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
  why: Complete agent factory implementation - functions to test
  pattern: createBaseConfig, createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent
  gotcha: configureEnvironment() runs at module load time (side effect)
  critical: Lines 23-280 - all factory functions and MCP tool singletons

# MUST READ - System Prompts
- file: /home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: System prompt constants that agents must use
  pattern: TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, BUG_HUNT_PROMPT
  gotcha: Prompts are large string constants (lines 33-979)
  critical: Lines 33-146 (TASK_BREAKDOWN), 157-603 (PRP_BLUEPRINT), 614-685 (PRP_BUILDER), 868-979 (BUG_HUNT)

# MUST READ - Prompt Generators
- file: /home/dustin/projects/hacky-hack/src/agents/prompts/architect-prompt.ts
  why: createArchitectPrompt implementation - returns Prompt<Backlog>
  pattern: Uses createPrompt() with BacklogSchema as responseFormat
  gotcha: Must validate Prompt type has Backlog as generic parameter
  critical: Lines 51-68 (createArchitectPrompt function)

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/prp-blueprint-prompt.ts
  why: createPRPBlueprintPrompt implementation - returns Prompt<PRPDocument>
  pattern: Uses createPrompt() with PRPDocumentSchema as responseFormat
  gotcha: Extracts hierarchical context from Backlog
  critical: Lines 250-271 (createPRPBlueprintPrompt function)

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/bug-hunt-prompt.ts
  why: createBugHuntPrompt implementation - returns Prompt<TestResults>
  pattern: Uses createPrompt() with TestResultsSchema as responseFormat
  gotcha: Takes PRD content and completed tasks array
  critical: Lines 123-143 (createBugHuntPrompt function)

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/delta-analysis-prompt.ts
  why: createDeltaAnalysisPrompt implementation - returns Prompt<DeltaAnalysis>
  pattern: Uses createPrompt() with DeltaAnalysisSchema as responseFormat
  gotcha: Compares old vs new PRD versions
  critical: Lines 123-144 (createDeltaAnalysisPrompt function)

# MUST READ - Existing Test Patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/agents/agent-factory.test.ts
  why: Unit tests for createBaseConfig - pattern to follow
  pattern: AAA pattern, vi.stubEnv for environment variables
  gotcha: Only tests createBaseConfig, not agent creators
  critical: Lines 22-141 (createBaseConfig tests)

- file: /home/dustin/projects/hacky-hack/tests/integration/architect-agent.test.ts
  why: Integration test with mocked createArchitectAgent
  pattern: vi.mock() for agent factory, spyable prompt() method
  gotcha: Mock returns { prompt: vi.fn() } to simulate agent
  critical: Lines 27-34 (mock pattern), 36-494 (test patterns)

- file: /home/dustin/projects/hacky-hack/tests/unit/agents/prompts.test.ts
  why: Prompt content validation tests
  pattern: Validate prompt strings contain expected content
  gotcha: Only tests prompt strings, not createPrompt() usage
  critical: Lines 24-137 (prompt validation tests)

# MUST READ - Groundswell API Documentation
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Groundswell createAgent() signature and Prompt<T> type
  pattern: createAgent({ name, system, model, mcps, tools, env })
  gotcha: Agent.prompt(prompt) returns typed result based on Prompt<T>
  critical: Lines 119-144 (Agent Creation), 232-275 (Prompt System with Zod)

# MUST READ - Vitest Configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test runner configuration with coverage settings
  pattern: environment: 'node', globals: true, coverage: v8
  gotcha: Coverage thresholds are 100% for all metrics
  critical: Lines 14-38 (test and coverage configuration)

# MUST READ - Data Models (for type validation)
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Zod schemas for type validation (BacklogSchema, PRPDocumentSchema, etc.)
  pattern: Zod schemas define structured output formats
  gotcha: Prompt<T> generic must match schema type
  critical: BacklogSchema, PRPDocumentSchema, TestResultsSchema, DeltaAnalysisSchema

# REFERENCE - Environment Configuration
- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: configureEnvironment() maps ANTHROPIC_AUTH_TOKEN -> ANTHROPIC_API_KEY
  pattern: Side effect at module load time
  gotcha: Runs before agent creation in agent-factory.ts
  critical: configureEnvironment() function
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                             # Test scripts: test, test:run, test:coverage
├── vitest.config.ts                         # Vitest configuration with 100% coverage threshold
├── src/
│   ├── agents/
│   │   ├── agent-factory.ts                 # Agent factory (under test, needs 100% coverage)
│   │   ├── prompts.ts                       # System prompt constants (TASK_BREAKDOWN, PRP_BLUEPRINT, etc.)
│   │   └── prompts/
│   │       ├── index.ts                     # Prompt generator exports
│   │       ├── architect-prompt.ts          # createArchitectPrompt -> Prompt<Backlog>
│   │       ├── prp-blueprint-prompt.ts      # createPRPBlueprintPrompt -> Prompt<PRPDocument>
│   │       ├── bug-hunt-prompt.ts           # createBugHuntPrompt -> Prompt<TestResults>
│   │       └── delta-analysis-prompt.ts     # createDeltaAnalysisPrompt -> Prompt<DeltaAnalysis>
│   ├── config/
│   │   └── environment.ts                   # configureEnvironment(), getModel()
│   └── core/
│       └── models.ts                        # Zod schemas: BacklogSchema, PRPDocumentSchema, etc.
├── tests/
│   ├── unit/
│   │   └── agents/
│   │       ├── agent-factory.test.ts        # Unit tests for createBaseConfig (exists, partial coverage)
│   │       └── prompts.test.ts              # Prompt string validation tests (exists)
│   └── integration/
│       └── architect-agent.test.ts          # Integration test pattern (exists, mocks createArchitectAgent)
└── plan/
    └── 001_14b9dc2a33c7/
        ├── architecture/
        │   └── groundswell_api.md           # Groundswell API reference
        └── P4M4T2S1/
            └── PRP.md                        # THIS FILE
```

### Desired Codebase Tree (files to add)

```bash
tests/
└── integration/
    └── agents.test.ts                        # CREATE: Comprehensive agent factory and prompt tests
        # Mock createAgent to return { prompt: vi.fn() }
        # Test all agent creators use correct system prompts
        # Test all prompt generators return correct Prompt<T> types
        # Validate Zod schema associations

# Coverage output (generated):
coverage/
└── src/
    └── agents/
        └── agent-factory.ts.html             # 100% coverage (target)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Groundswell Agent Mock Pattern
// Agent factory calls createAgent() from groundswell library
// createAgent() returns Agent object with prompt() method
// In tests, we mock createAgent to return { prompt: vi.fn() }
// Pattern from tests/integration/architect-agent.test.ts:
// vi.mock('../../src/agents/agent-factory.js', () => ({
//   createArchitectAgent: vi.fn(() => ({ prompt: vi.fn() })),
// }));

// CRITICAL: MCP Tool Singleton Registration
// agent-factory.ts creates MCP tool instances at module load time:
// const BASH_MCP = new BashMCP();
// const FILESYSTEM_MCP = new FilesystemMCP();
// const GIT_MCP = new GitMCP();
// These are passed to createAgent() via mcps parameter
// In tests, we need to mock the tools or the entire createAgent call

// CRITICAL: Environment Variable Mapping
// configureEnvironment() runs at module load time (intentional side effect)
// Maps: ANTHROPIC_AUTH_TOKEN -> ANTHROPIC_API_KEY
// Tests must stub environment variables BEFORE importing agent-factory
// Pattern: vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
// Gotcha: vi.unstubAllEnvs() in afterEach to clean up

// CRITICAL: System Prompt Content
// TASK_BREAKDOWN_PROMPT is ~140 lines long (lines 33-146 in prompts.ts)
// PRP_BLUEPRINT_PROMPT is ~450 lines long (lines 157-603)
// PRP_BUILDER_PROMPT is ~70 lines long (lines 614-685)
// BUG_HUNT_PROMPT is ~110 lines long (lines 868-979)
// Tests should verify prompt assignment, not full content validation
// Pattern: Check for unique substring in each prompt

// CRITICAL: createPrompt() from Groundswell
// Returns Prompt<T> where T is the Zod schema type
// prompt() method returns z.infer<typeof Schema>
// Tests can't directly inspect Prompt<T> type (compile-time only)
// Runtime tests validate prompt configuration, not TypeScript types
// Pattern: Verify createPrompt was called with correct responseFormat

// CRITICAL: vi.mock() Hoisting
// All vi.mock() calls must be at top level, not inside tests or describe blocks
// Mock hoisting happens before imports, so order matters
// Pattern: Mock first, then import what you mocked
// Gotcha: Can't mock in a describe block - must be top level

// CRITICAL: Mock Factory Pattern
// Create reusable mock functions for consistent test data
// Pattern: const mockAgent = { prompt: vi.fn() };
// Pattern: vi.mocked(createAgent).mockReturnValue(mockAgent);

// CRITICAL: Type Safety with Mocks
// Use vi.mocked() for proper TypeScript typing of mocked functions
// Pattern: const mockCreateAgent = vi.mocked(createAgent);
// Gotcha: Casting with 'as any' works but loses type safety

// CRITICAL: Agent Config Validation
// createBaseConfig() returns AgentConfig interface
// Properties: name, system, model, enableCache, enableReflection, maxTokens, env
// Tests should validate all required properties exist
// Pattern: expect(config).toHaveProperty('name');

// CRITICAL: Prompt Generator Return Type
// createArchitectPrompt(prdContent) returns Prompt<Backlog>
// Backlog = z.infer<typeof BacklogSchema>
// Tests can't directly validate generic type at runtime
// Pattern: Verify createPrompt was called with BacklogSchema

// CRITICAL: Zod Schema Import
// All schemas are in src/core/models.ts
// Import: import { BacklogSchema, PRPDocumentSchema, TestResultsSchema, DeltaAnalysisSchema } from '../../src/core/models.js';
// Gotcha: Use .js extension for ES module imports

// CRITICAL: Test File Location
// Create in tests/integration/agents.test.ts (not tests/integration/agents/)
// Pattern: Match source directory structure under tests/
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing test patterns:

```typescript
// Mock Agent pattern (from architect-agent.test.ts)
const mockAgent = {
  prompt: vi.fn(),
};

// Mock createAgent return value
vi.mocked(createAgent).mockReturnValue(mockAgent);

// Test fixture for PRD content
const mockPRDContent = '# Test PRD\n\nThis is a test PRD.';

// Test fixture for Backlog
const mockBacklog: Backlog = {
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Test Phase',
      status: 'Planned',
      description: 'Test description',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Test Milestone',
          status: 'Planned',
          description: 'Test',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Test Task',
              status: 'Planned',
              description: 'Test',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Test Subtask',
                  status: 'Planned',
                  story_points: 2,
                  dependencies: [],
                  context_scope: 'Test context',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/agents.test.ts
  - IMPLEMENT: Integration tests for agent factory and prompts
  - FOLLOW pattern: tests/integration/architect-agent.test.ts (mock pattern)
  - NAMING: agents.test.ts (matches agent-factory.ts location under src/agents/)
  - PLACEMENT: tests/integration/ directory

Task 2: MOCK Groundswell createAgent and Agent
  - IMPLEMENT: vi.mock() for 'groundswell' module
  - MOCK createAgent to return { prompt: vi.fn() }
  - FOLLOW pattern: tests/integration/architect-agent.test.ts lines 27-34
  - GOTCHA: Mock at top level before imports due to hoisting
  - NAMING: mockAgent, mockCreateAgent

Task 3: TEST createBaseConfig() environment variable mapping
  - IMPLEMENT: Test validates ANTHROPIC_AUTH_TOKEN -> ANTHROPIC_API_KEY mapping
  - SETUP: vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-123')
  - VERIFY: config.env.ANTHROPIC_API_KEY === 'test-token-123'
  - FOLLOW pattern: tests/unit/agents/agent-factory.test.ts lines 85-97
  - NAMING: it('should map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY')
  - PLACEMENT: In describe('createBaseConfig') block

Task 4: TEST createArchitectAgent() uses TASK_BREAKDOWN_PROMPT
  - IMPLEMENT: Test validates architect agent uses correct system prompt
  - SETUP: Mock createAgent to capture config argument
  - VERIFY: config.system === TASK_BREAKDOWN_PROMPT
  - VERIFY: config.name === 'ArchitectAgent'
  - VERIFY: config.maxTokens === 8192
  - NAMING: it('should create architect agent with TASK_BREAKDOWN_PROMPT')
  - PLACEMENT: In describe('createArchitectAgent') block

Task 5: TEST createResearcherAgent() uses PRP_BLUEPRINT_PROMPT
  - IMPLEMENT: Test validates researcher agent uses correct system prompt
  - SETUP: Mock createAgent to capture config argument
  - VERIFY: config.system === PRP_BLUEPRINT_PROMPT
  - VERIFY: config.name === 'ResearcherAgent'
  - VERIFY: config.maxTokens === 4096
  - NAMING: it('should create researcher agent with PRP_BLUEPRINT_PROMPT')
  - PLACEMENT: In describe('createResearcherAgent') block

Task 6: TEST createCoderAgent() uses PRP_BUILDER_PROMPT
  - IMPLEMENT: Test validates coder agent uses correct system prompt
  - SETUP: Mock createAgent to capture config argument
  - VERIFY: config.system === PRP_BUILDER_PROMPT
  - VERIFY: config.name === 'CoderAgent'
  - VERIFY: config.maxTokens === 4096
  - NAMING: it('should create coder agent with PRP_BUILDER_PROMPT')
  - PLACEMENT: In describe('createCoderAgent') block

Task 7: TEST createQAAgent() uses BUG_HUNT_PROMPT
  - IMPLEMENT: Test validates QA agent uses correct system prompt
  - SETUP: Mock createAgent to capture config argument
  - VERIFY: config.system === BUG_HUNT_PROMPT
  - VERIFY: config.name === 'QaAgent'
  - VERIFY: config.maxTokens === 4096
  - NAMING: it('should create QA agent with BUG_HUNT_PROMPT')
  - PLACEMENT: In describe('createQAAgent') block

Task 8: TEST createArchitectPrompt() returns Prompt with BacklogSchema
  - IMPLEMENT: Test validates prompt generator uses BacklogSchema
  - SETUP: Mock createPrompt from groundswell
  - VERIFY: createPrompt called with responseFormat: BacklogSchema
  - VERIFY: User parameter contains PRD content
  - GOTCHA: Can't validate TypeScript generic at runtime
  - NAMING: it('should create architect prompt with BacklogSchema')
  - PLACEMENT: In describe('createArchitectPrompt') block

Task 9: TEST createPRPBlueprintPrompt() returns Prompt with PRPDocumentSchema
  - IMPLEMENT: Test validates prompt generator uses PRPDocumentSchema
  - SETUP: Mock createPrompt from groundswell
  - VERIFY: createPrompt called with responseFormat: PRPDocumentSchema
  - VERIFY: User parameter contains task context
  - NAMING: it('should create PRP blueprint prompt with PRPDocumentSchema')
  - PLACEMENT: In describe('createPRPBlueprintPrompt') block

Task 10: TEST createBugHuntPrompt() returns Prompt with TestResultsSchema
  - IMPLEMENT: Test validates prompt generator uses TestResultsSchema
  - SETUP: Mock createPrompt from groundswell
  - VERIFY: createPrompt called with responseFormat: TestResultsSchema
  - VERIFY: User parameter contains PRD and completed tasks
  - NAMING: it('should create bug hunt prompt with TestResultsSchema')
  - PLACEMENT: In describe('createBugHuntPrompt') block

Task 11: TEST createDeltaAnalysisPrompt() returns Prompt with DeltaAnalysisSchema
  - IMPLEMENT: Test validates prompt generator uses DeltaAnalysisSchema
  - SETUP: Mock createPrompt from groundswell
  - VERIFY: createPrompt called with responseFormat: DeltaAnalysisSchema
  - VERIFY: User parameter contains old and new PRD
  - NAMING: it('should create delta analysis prompt with DeltaAnalysisSchema')
  - PLACEMENT: In describe('createDeltaAnalysisPrompt') block

Task 12: RUN test suite and verify coverage
  - EXECUTE: npm run test:run -- tests/integration/agents.test.ts
  - VERIFY: All tests pass
  - EXECUTE: npm run test:coverage -- tests/integration/agents.test.ts
  - VERIFY: Coverage for src/agents/agent-factory.ts is 100%
  - DOCUMENT: Any failing tests (should be none)
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// MOCK PATTERN: Groundswell createAgent and Agent
// =============================================================================

// Pattern: Mock at top level before imports (hoisting)
vi.mock('groundswell', () => ({
  createAgent: vi.fn(),
  createPrompt: vi.fn(),
  type Prompt: vi.fn(),
}));

// Import after mocking - get mocked versions
import { createAgent, createPrompt } from 'groundswell';
import { vi } from 'vitest';

// Create mock agent with prompt method
const mockAgent = {
  prompt: vi.fn(),
};

// Setup createAgent to return mock agent
vi.mocked(createAgent).mockReturnValue(mockAgent);

// =============================================================================
// TASK 3: Test createBaseConfig() Environment Mapping
// =============================================================================

describe('createBaseConfig', () => {
  // CLEANUP: Restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY', () => {
    // SETUP: Set environment variable
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-123');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    const config = createBaseConfig('architect');

    // VERIFY: Environment mapping
    expect(config.env.ANTHROPIC_API_KEY).toBe('test-token-123');
    expect(config.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic');
  });
});

// =============================================================================
// TASK 4-7: Test Agent Creators Use Correct System Prompts
// =============================================================================

describe('createArchitectAgent', () => {
  it('should create architect agent with TASK_BREAKDOWN_PROMPT', () => {
    // EXECUTE
    const agent = createArchitectAgent();

    // VERIFY: createAgent was called with correct config
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ArchitectAgent',
        system: TASK_BREAKDOWN_PROMPT,
        maxTokens: 8192,
      })
    );

    // VERIFY: Agent has prompt method
    expect(agent.prompt).toBeDefined();
  });
});

describe('createResearcherAgent', () => {
  it('should create researcher agent with PRP_BLUEPRINT_PROMPT', () => {
    // EXECUTE
    const agent = createResearcherAgent();

    // VERIFY: createAgent was called with correct config
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ResearcherAgent',
        system: PRP_BLUEPRINT_PROMPT,
        maxTokens: 4096,
      })
    );
  });
});

describe('createCoderAgent', () => {
  it('should create coder agent with PRP_BUILDER_PROMPT', () => {
    // EXECUTE
    const agent = createCoderAgent();

    // VERIFY: createAgent was called with correct config
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CoderAgent',
        system: PRP_BUILDER_PROMPT,
        maxTokens: 4096,
      })
    );
  });
});

describe('createQAAgent', () => {
  it('should create QA agent with BUG_HUNT_PROMPT', () => {
    // EXECUTE
    const agent = createQAAgent();

    // VERIFY: createAgent was called with correct config
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'QaAgent',
        system: BUG_HUNT_PROMPT,
        maxTokens: 4096,
      })
    );
  });
});

// =============================================================================
// TASK 8-11: Test Prompt Generators Return Correct Prompt<T> Types
// =============================================================================

describe('createArchitectPrompt', () => {
  it('should create architect prompt with BacklogSchema', () => {
    // SETUP
    const prdContent = '# Test PRD\n\nThis is a test.';

    // EXECUTE
    const prompt = createArchitectPrompt(prdContent);

    // VERIFY: createPrompt was called with correct config
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: prdContent,
        system: TASK_BREAKDOWN_PROMPT,
        responseFormat: BacklogSchema,
        enableReflection: true,
      })
    );
  });
});

describe('createPRPBlueprintPrompt', () => {
  it('should create PRP blueprint prompt with PRPDocumentSchema', () => {
    // SETUP: Create test task and backlog
    const task: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: 'Test context scope',
    };

    const backlog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Test Phase',
          status: 'Planned',
          description: 'Test description',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone',
              title: 'Test Milestone',
              status: 'Planned',
              description: 'Test',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task',
                  title: 'Test Task',
                  status: 'Planned',
                  description: 'Test',
                  subtasks: [task],
                },
              ],
            },
          ],
        },
      ],
    };

    // EXECUTE
    const prompt = createPRPBlueprintPrompt(task, backlog, '/test/path');

    // VERIFY: createPrompt was called with correct config
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining(task.title),
        system: PRP_BLUEPRINT_PROMPT,
        responseFormat: PRPDocumentSchema,
        enableReflection: true,
      })
    );
  });
});

describe('createBugHuntPrompt', () => {
  it('should create bug hunt prompt with TestResultsSchema', () => {
    // SETUP
    const prd = '# Test PRD';
    const completedTasks: Task[] = [
      {
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Test Task',
        status: 'Complete',
        description: 'Test',
        subtasks: [],
      },
    ];

    // EXECUTE
    const prompt = createBugHuntPrompt(prd, completedTasks);

    // VERIFY: createPrompt was called with correct config
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining(prd),
        system: BUG_HUNT_PROMPT,
        responseFormat: TestResultsSchema,
        enableReflection: true,
      })
    );
  });
});

describe('createDeltaAnalysisPrompt', () => {
  it('should create delta analysis prompt with DeltaAnalysisSchema', () => {
    // SETUP
    const oldPRD = '# Old PRD';
    const newPRD = '# New PRD';
    const completedTaskIds = ['P1.M1.T1', 'P1.M1.T2'];

    // EXECUTE
    const prompt = createDeltaAnalysisPrompt(oldPRD, newPRD, completedTaskIds);

    // VERIFY: createPrompt was called with correct config
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining(oldPRD),
        system: DELTA_ANALYSIS_PROMPT,
        responseFormat: DeltaAnalysisSchema,
        enableReflection: true,
      })
    );
  });
});

// =============================================================================
// ADDITIONAL: Test MCP Tools Integration
// =============================================================================

describe('MCP tools integration', () => {
  it('should pass MCP tools to all agent creators', () => {
    // CLEANUP: Clear previous mock calls
    vi.clearAllMocks();

    // EXECUTE: Create all agent types
    createArchitectAgent();
    createResearcherAgent();
    createCoderAgent();
    createQAAgent();

    // VERIFY: All agents were created with mcps parameter
    expect(createAgent).toHaveBeenCalledTimes(4);
    createAgent.mock.calls.forEach(call => {
      const config = call[0];
      expect(config).toHaveProperty('mcps');
      expect(config.mcps).toEqual(expect.any(Array));
    });
  });
});
```

### Integration Points

```yaml
Groundswell Library:
  - mock: vi.mock('groundswell', () => ({ createAgent: vi.fn(), createPrompt: vi.fn() }))
  - pattern: createAgent returns { prompt: vi.fn() }

Environment Variables:
  - setup: vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token')
  - cleanup: vi.unstubAllEnvs() in afterEach

System Prompts:
  - import: from '../../src/agents/prompts.js'
  - validate: TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, BUG_HUNT_PROMPT

Zod Schemas:
  - import: from '../../src/core/models.js'
  - validate: BacklogSchema, PRPDocumentSchema, TestResultsSchema, DeltaAnalysisSchema

Test Execution:
  - command: npm run test:run -- tests/integration/agents.test.ts
  - command: npm run test:coverage -- tests/integration/agents.test.ts
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate test file has no syntax errors
npx tsc --noEmit tests/integration/agents.test.ts

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run agent factory integration tests specifically
npm run test:run -- tests/integration/agents.test.ts

# Expected output:
# ✓ tests/integration/agents.test.ts (15+ tests)
# Test Files  1 passed (1)
# Tests  15+ passed (15+)
# Duration  <X seconds

# If any tests fail, debug root cause and fix
```

### Level 3: Coverage Validation (Quality Assurance)

```bash
# Generate coverage report for agent factory
npm run test:coverage -- tests/integration/agents.test.ts

# Expected output for agent-factory.ts:
# --------------------|---------|---------|---------|---------|-------------------
# File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
# --------------------|---------|---------|---------|---------|-------------------
#  src/agents/agent-factory.ts |   100   |   100   |   100   |   100  |           ✅
# --------------------|---------|---------|---------|---------|-------------------

# If coverage < 100%, identify gaps and add tests
```

### Level 4: Integration Verification (System Validation)

```bash
# Verify all tests pass together
npm run test:run

# Expected: All existing tests still pass, new tests added
# Test Files  40+ passed (40+)
# Tests  300+ passed (300+)

# Verify no regressions in existing agent-factory unit tests
npm run test:run -- tests/unit/agents/agent-factory.test.ts

# Expected: Existing unit tests still pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All tests pass: `npm run test:run -- tests/integration/agents.test.ts`
- [ ] Coverage 100% for agent-factory.ts: `npm run test:coverage`
- [ ] No type errors: `npx tsc --noEmit tests/integration/agents.test.ts`
- [ ] No linting errors in test file

### Contract Requirements Validation

- [ ] Mock Groundswell Agent and createAgent ✅
- [ ] Test createBaseConfig() maps ANTHROPIC_AUTH_TOKEN -> ANTHROPIC_API_KEY ✅
- [ ] Test createArchitectAgent() uses TASK_BREAKDOWN_PROMPT ✅
- [ ] Test createResearcherAgent() uses PRP_BLUEPRINT_PROMPT ✅
- [ ] Test createCoderAgent() uses PRP_BUILDER_PROMPT ✅
- [ ] Test createQAAgent() uses BUG_HUNT_PROMPT ✅
- [ ] Test createArchitectPrompt() returns Prompt<Backlog> with BacklogSchema ✅
- [ ] Test createPRPBlueprintPrompt() returns Prompt<PRPDocument> with PRPDocumentSchema ✅
- [ ] Test createBugHuntPrompt() returns Prompt<TestResults> with TestResultsSchema ✅
- [ ] Test createDeltaAnalysisPrompt() returns Prompt<DeltaAnalysis> with DeltaAnalysisSchema ✅

### Code Quality Validation

- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Test names are descriptive and specify behavior
- [ ] Mock isolation with vi.clearAllMocks() or vi.restoreAllMocks()
- [ ] Environment cleanup with vi.unstubAllEnvs() in afterEach
- [ ] Type safety with vi.mocked() or proper casting
- [ ] No real LLM calls (all mocked)

### Documentation & Sign-Off

- [ ] Mock strategy documented for future reference
- [ ] Coverage report saved/verified
- [ ] Ready for sign-off

---

## Anti-Patterns to Avoid

- ❌ Don't create real Groundswell agents in tests (mock createAgent)
- ❌ Don't skip mocking createPrompt (needed for schema validation)
- ❌ Don't forget to clean up environment variables in afterEach
- ❌ Don't place vi.mock() inside describe blocks (must be top level)
- ❌ Don't import before mocking (hoisting order matters)
- ❌ Don't test full prompt content (test assignment, not content)
- ❌ Don't try to validate TypeScript generics at runtime (impossible)
- ❌ Don't forget to mock both createAgent AND createPrompt
- ❌ Don't modify source files as part of testing
- ❌ Don't run tests without checking coverage

---

## Confidence Score

**9/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ Clear mock pattern from existing architect-agent.test.ts
- ✅ Agent factory implementation is straightforward
- ✅ System prompts are string constants (easy to validate)
- ✅ Prompt generators follow consistent pattern
- ✅ Existing test patterns to follow (AAA, vi.mock, vi.stubEnv)
- ✅ Groundswell API documentation is comprehensive
- ✅ Contract requirements are specific and measurable
- ⚠️ Minor complexity: Mocking both createAgent and createPrompt
- ⚠️ Need to validate schema associations without TypeScript type checking

**Validation**: This PRP provides:
1. Exact mock patterns to use (from architect-agent.test.ts)
2. Specific test cases for all contract requirements
3. Clear expected outcomes for each test
4. Complete context on agent factory and prompt systems
5. Gotchas and anti-patterns to avoid

The low risk comes from having clear examples to follow and a well-understood testing pattern.
