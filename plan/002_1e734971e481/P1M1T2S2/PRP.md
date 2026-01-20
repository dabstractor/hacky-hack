# Product Requirement Prompt (PRP): Test Agent and Prompt creation

**PRP ID**: P1.M1.T2.S2
**Generated**: 2026-01-15
**Story Points**: 2

---

## Goal

**Feature Goal**: Create a comprehensive test suite that validates Groundswell Agent and Prompt creation functionality including AgentConfig configuration, createAgent() factory, Agent.getMcpHandler() access, Prompt creation with Zod schemas, Prompt.validateResponse() and safeValidateResponse() validation methods, Prompt.withData() immutability, and proper mocking of the Anthropic API client to prevent actual LLM calls.

**Deliverable**: `tests/integration/groundswell/agent-prompt.test.ts` - A comprehensive test file covering Agent creation with AgentConfig, Prompt creation with Zod schemas, response validation methods, immutability testing, and mock implementation confirming prompt execution flow works without real API calls.

**Success Definition**:
- Test 1: Create basic Agent with createAgent(), verify agent.getMcpHandler() exists and returns MCPHandler instance
- Test 2: Create Prompt with Zod schema (z.object({ result: z.string() })), verify validateResponse() works with valid/invalid data
- Test 3: Test Prompt.withData() immutability (original prompt unchanged, new prompt has merged data)
- Test 4: Mock Anthropic API client to test agent.prompt() without real calls, verify mock was called correctly
- Test 5: Verify Agent configuration (name, model, maxTokens, temperature, enableCache, enableReflection)
- Test 6: Test Prompt.buildUserMessage() with data formatted as XML tags
- All tests use vi.mock('@anthropic-ai/sdk') to prevent actual API calls
- All tests follow existing patterns from tests/unit/groundswell/ and Groundswell source tests
- Test achieves 100% coverage of tested Agent and Prompt methods
- Any issues with Agent/Prompt creation are documented

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Fifth validation step in Phase 1 (P1.M1.T2) to verify that after npm link is validated (S1), imports work (S2), version is compatible (S3), and Workflow lifecycle works (S2), the Groundswell Agent and Prompt classes work correctly for AI-powered operations.

**User Journey**:
1. Pipeline completes P1.M1.T1 (npm link, imports, version compatibility) with success
2. Pipeline completes P1.M1.T2.S1 (Workflow lifecycle tests) with success
3. Pipeline starts P1.M1.T2.S2 (Agent and Prompt tests)
4. Test suite runs 6 test categories covering Agent and Prompt functionality
5. Each test validates specific Agent/Prompt functionality
6. Mock implementations are verified to prevent API calls
7. Zod validation is tested with both success and failure cases
8. Immutability is verified for Prompt.withData()
9. If all tests pass: Proceed to P1.M1.T2.S3 (MCP tool registration tests)
10. If tests fail: Document specific issues for debugging

**Pain Points Addressed**:
- Uncertainty whether Groundswell Agent and Prompt classes work correctly
- Lack of test coverage for Agent configuration options
- Risk of accidental LLM API calls during testing
- Missing validation of Zod schema integration with Prompt
- Unclear Prompt immutability behavior with withData()
- Missing verification of MCP handler access from Agent
- Unclear data injection formatting (XML tags) in Prompt

---

## Why

- **Foundation for P1.M1.T2.S3**: Agent and Prompt must work correctly before testing MCP tool registration (S3)
- **Critical Pattern Validation**: Agent/Prompt are core patterns used throughout the codebase for AI operations
- **Mock Pattern Validation**: vi.mock() pattern for @anthropic-ai/sdk is critical for preventing API calls in all tests
- **Zod Integration Validation**: Prompt.validateResponse() and safeValidateResponse() are essential for type-safe LLM responses
- **Immutability Validation**: Prompt.withData() immutability is important for predictable prompt variations
- **Problems Solved**:
  - Validates that Agent can be created with AgentConfig options
  - Confirms getMcpHandler() returns MCPHandler instance
  - Verifies Prompt creation with Zod responseFormat
  - Tests validateResponse() with valid and invalid data
  - Tests safeValidateResponse() with success and error cases
  - Confirms withData() creates new immutable prompt with merged data
  - Ensures no accidental LLM API calls via proper mocking
  - Verifies buildUserMessage() formats data as XML tags

---

## What

Create a comprehensive test suite covering 6 main test categories:

### Test 1: Basic Agent Creation with AgentConfig
- Create Agent using createAgent() factory with AgentConfig options
- Test configuration options: name, system, model, maxTokens, temperature, enableCache, enableReflection
- Verify:
  - Agent instance is created with unique ID
  - Agent.name matches config or defaults to 'Agent'
  - Agent.getMcpHandler() returns MCPHandler instance
  - Agent configuration is applied correctly

### Test 2: Prompt Creation with Zod Schema
- Create Prompt using createPrompt() factory with PromptConfig
- Use Zod schema for responseFormat: z.object({ result: z.string() })
- Test various Zod types: z.string(), z.number(), z.array(), z.enum(), z.optional()
- Verify:
  - Prompt instance is created with unique ID
  - Prompt.user is stored correctly
  - Prompt.data is stored correctly
  - Prompt.responseFormat is the Zod schema

### Test 3: Prompt.validateResponse() Method
- Create Prompt with Zod schema
- Test validateResponse() with valid data
- Test validateResponse() with invalid data (missing field, wrong type)
- Verify:
  - Valid data returns parsed result
  - Invalid data throws ZodError
  - Error messages are descriptive

### Test 4: Prompt.safeValidateResponse() Method
- Create Prompt with Zod schema
- Test safeValidateResponse() with valid data
- Test safeValidateResponse() with invalid data
- Verify:
  - Success case returns { success: true, data: T }
  - Failure case returns { success: false, error: ZodError }
  - Type narrowing works correctly

### Test 5: Prompt.withData() Immutability
- Create Prompt with initial data
- Call withData() to create new prompt with additional data
- Verify:
  - Original prompt data is unchanged
  - New prompt has merged data (original + new)
  - Prompts have different IDs (new instance)
  - Both prompts are frozen (immutable)

### Test 6: Mock Anthropic API Client
- Mock @anthropic-ai/sdk at module level
- Create Agent and Prompt
- Call agent.prompt() with mock setup
- Verify:
  - Mock is called instead of real API
  - Mock receives correct parameters (model, max_tokens, messages)
  - No actual API calls are made
  - Response is returned correctly from mock

### Test 7: Prompt.buildUserMessage() with Data
- Create Prompt with data field
- Call buildUserMessage()
- Verify:
  - User message is included
  - Data is formatted as XML tags
  - Multiple data fields are formatted correctly

### Success Criteria

- [ ] Test 1: Agent creation with AgentConfig works
- [ ] Test 2: Prompt creation with Zod schema works
- [ ] Test 3: validateResponse() validates valid data and rejects invalid data
- [ ] Test 4: safeValidateResponse() returns success/error correctly
- [ ] Test 5: withData() creates new immutable prompt with merged data
- [ ] Test 6: Mock Anthropic API prevents real calls
- [ ] Test 7: buildUserMessage() formats data as XML tags
- [ ] All tests use vi.mock('@anthropic-ai/sdk') for mocking
- [ ] Tests follow existing patterns from tests/unit/groundswell/
- [ ] 100% coverage of tested Agent and Prompt methods
- [ ] All tests pass consistently

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] Groundswell Agent API documented (createAgent(), getMcpHandler(), prompt())
- [x] Groundswell Prompt API documented (createPrompt(), validateResponse(), safeValidateResponse(), withData(), buildUserMessage())
- [x] AgentConfig interface documented (name, system, tools, mcps, skills, hooks, env, enableReflection, enableCache, model, maxTokens, temperature)
- [x] PromptConfig interface documented (user, data, responseFormat, system, tools, mcps, skills, hooks, enableReflection)
- [x] Zod schema patterns documented (z.object, z.string, z.number, z.array, z.enum, z.optional)
- [x] Mock patterns for @anthropic-ai/sdk identified
- [x] Test patterns from existing codebase analyzed
- [x] Groundswell source test files referenced
- [x] MCPHandler class documented
- [x] Prompt data XML formatting documented

---

### Documentation & References

```yaml
# MUST READ - Contract definition from PRD
- docfile: plan/002_1e734971e481/current_prd.md
  why: Contains the work item contract definition for this subtask
  section: P1.M1.T2.S2 contract definition
  critical: Specifies exact test requirements and expected outputs

# MUST READ - Previous PRP (P1.M1.T2.S1) outputs
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M1T2S1/PRP.md
  why: Defines the Workflow lifecycle validation that precedes Agent/Prompt tests
  pattern: Workflow lifecycle must work before testing Agent/Prompt in that context
  critical: Confirms Groundswell imports and version compatibility are verified

# MUST READ - Groundswell Analysis (internal research)
- docfile: plan/002_1e734971e481/architecture/groundswell_analysis.md
  why: Comprehensive documentation of Groundswell API including Agent and Prompt
  section: Section 2.1 (Agent class), Section 2.1 (Prompt class)
  critical: |
    - AgentConfig interface: name, system, tools[], mcps[], model, maxTokens, temperature, enableCache, enableReflection
    - Agent methods: prompt(), promptWithMetadata(), reflect(), getMcpHandler()
    - PromptConfig interface: user, data?, responseFormat (Zod), system?, tools?, mcps?
    - Prompt methods: validateResponse(), safeValidateResponse(), buildUserMessage(), withData()

# EXTERNAL SOURCE - Groundswell Agent test file
- file: /home/dustin/projects/groundswell/src/__tests__/unit/agent.test.ts
  why: Groundswell's own unit tests for Agent class
  pattern: Agent creation with unique ID, default name, custom name, MCP handler access
  critical: |
    - Agent unique ID generation
    - Default name is 'Agent'
    - getMcpHandler() returns MCPHandler instance
    - MCP server registration from config
    - Tool naming with server prefix (server__tool)

# EXTERNAL SOURCE - Groundswell Prompt test file
- file: /home/dustin/projects/groundswell/src/__tests__/unit/prompt.test.ts
  why: Groundswell's own unit tests for Prompt class
  pattern: Unique ID generation, data storage, validation, safeValidateResponse, withData immutability
  critical: |
    - Prompt unique ID generation
    - validateResponse() throws on invalid data
    - safeValidateResponse() returns success/error objects
    - buildUserMessage() formats data as XML tags
    - withData() creates new prompt with merged data
    - Prompts are frozen (immutable)

# EXTERNAL SOURCE - Groundswell Agent class source
- file: /home/dustin/projects/groundswell/src/core/agent.ts
  why: Reference for Agent constructor and methods
  section: Lines 1-160 (constructor, getMcpHandler, prompt methods)
  critical: |
    - Constructor takes AgentConfig, generates ID, initializes Anthropic client
    - getMcpHandler() returns this.mcpHandler (MCPHandler instance)
    - prompt() calls executePrompt() and returns result.data

# EXTERNAL SOURCE - Groundswell Prompt class source
- file: /home/dustin/projects/groundswell/src/core/prompt.ts
  why: Reference for Prompt constructor and methods
  section: Lines 1-140 (constructor, validateResponse, safeValidateResponse, buildUserMessage, withData)
  critical: |
    - Constructor takes PromptConfig, generates ID, freezes instance
    - validateResponse() calls this.responseFormat.parse(data)
    - safeValidateResponse() returns this.responseFormat.safeParse(data)
    - buildUserMessage() formats data as XML tags: <key>\nJSON.stringify(value)\n</key>
    - withData() creates new Prompt with merged data: { ...this.data, ...newData }

# EXISTING CODEBASE PATTERNS - Import test patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/groundswell/imports.test.ts
  why: Example of comprehensive Groundswell testing with S1 validation check
  pattern: beforeAll checks npm link validation, conditional test execution with itIf
  gotcha: Uses vi.mock('@anthropic-ai/sdk') to prevent API calls

# EXISTING CODEBASE PATTERNS - Mock patterns
- file: /home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts
  why: Example of comprehensive mocking for Groundswell and dependencies
  pattern: Module-level vi.mock() with hoisting, vi.mocked() for type-safe access
  gotcha: |
    vi.mock('groundswell', async () => {
      const actual = await vi.importActual('groundswell');
      return { ...actual, createAgent: vi.fn(), createPrompt: vi.fn() };
    });

# EXISTING CODEBASE PATTERNS - Zod schema validation
- file: /home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts
  why: Example of Zod schema validation patterns in codebase
  pattern: Use safeParse() for validation, check success field, access result.data
  gotcha: Use type narrowing with if (result.success) to access data

# EXTERNAL DOCUMENTATION - URLs
- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking documentation for vi.mock() patterns

- url: https://zod.dev/
  why: Zod documentation for schema validation patterns

- url: https://github.com/anthropics/anthropic-sdk-typescript
  why: Anthropic SDK TypeScript documentation for API client structure
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # Node.js >=20, TypeScript 5.2.0, vitest test runner
├── tsconfig.json                 # experimentalDecorators: true
├── vitest.config.ts              # Decorator support, groundswell path alias
├── src/
├── tests/
│   ├── setup.ts                  # Global test setup
│   ├── unit/
│   │   ├── groundswell/
│   │   │   └── imports.test.ts   # Import validation with S1 check
│   │   ├── core/
│   │   │   └── models.test.ts    # Zod schema validation patterns
│   │   └── workflows/
│   │       ├── bug-hunt-workflow.test.ts  # Workflow test pattern example
│   │       └── fix-cycle-workflow.test.ts # Multiple @Step test pattern
│   └── integration/              # NEW TEST FILE LOCATION
│       └── groundswell/
│           ├── workflow.test.ts  # Workflow lifecycle tests (from P1.M1.T2.S1)
│           └── agent-prompt.test.ts  # TO BE CREATED (this PRP)
```

---

### Desired Codebase Tree (files to be added)

```bash
hacky-hack/
└── tests/
    └── integration/
        └── groundswell/
            └── agent-prompt.test.ts  # NEW: Comprehensive Agent and Prompt tests
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Mock Anthropic SDK to prevent actual API calls
// Groundswell Agent initializes the Anthropic SDK in constructor
// This is required by the z.ai API endpoint enforcement
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: { create: vi.fn() }
  })),
}));

// CRITICAL: vi.mock() must be at top level before imports
// They are hoisted to the top of the file by Vitest
// Cannot be conditional or inside describe blocks

// CRITICAL: AgentConfig supports these options
// name?: string - Human-readable name (default: 'Agent')
// system?: string - System prompt for agent
// tools?: Tool[] - Available tools
// mcps?: MCPServer[] - MCP servers to connect
// skills?: Skill[] - Skills to load
// hooks?: AgentHooks - Lifecycle hooks
// env?: Record<string, string> - Environment variables
// enableReflection?: boolean - Enable reflection capability
// enableCache?: boolean - Enable caching
// model?: string - Model to use (default: 'claude-sonnet-4-20250514')
// maxTokens?: number - Maximum tokens (default: 4096)
// temperature?: number - Temperature for generation

// CRITICAL: PromptConfig supports these options
// user: string - User message (REQUIRED)
// data?: Record<string, unknown> - Structured data injection
// responseFormat: z.ZodType<T> - Zod schema for validation (REQUIRED)
// system?: string - System prompt override
// tools?: Tool[] - Tools override
// mcps?: MCPServer[] - MCPs override
// skills?: Skill[] - Skills override
// hooks?: AgentHooks - Hooks override
// enableReflection?: boolean - Enable reflection

// CRITICAL: Zod schema patterns for testing
// Use z.object() for object schemas
// Use z.string(), z.number() for primitives
// Use z.array() for arrays
// Use z.enum() for fixed values
// Use z.optional() for optional fields
// Use safeParse() instead of parse() in tests

// CRITICAL: validateResponse() throws on invalid data
// Use try/catch or expect().toThrow() for testing failures
// Error is ZodError with issues array

// CRITICAL: safeValidateResponse() returns discriminated union
// Check success field before accessing data
// Use type narrowing: if (result.success) { ... }

// CRITICAL: Prompt.withData() creates new instance
// Original prompt is unchanged (immutable)
// Data is merged: { ...original.data, ...newData }
// New prompt has different ID

// CRITICAL: Prompt.buildUserMessage() formats data as XML
// Pattern: <key>\nJSON.stringify(value)\n</key>
// Multiple data fields are joined with \n\n

// CRITICAL: Prompts are frozen (immutable)
// Object.freeze(this) and Object.freeze(this.data)
// Cannot modify properties after creation

// CRITICAL: Agent.getMcpHandler() returns MCPHandler instance
// Use instanceof to verify type
// MCPHandler has methods: registerServer, unregisterServer, getTools, hasTool, executeTool

// CRITICAL: MCP tool naming
// Tools get server name prefix: server__tool
// Use hasTool('server__tool') to check

// CRITICAL: Mock setup for agent.prompt()
// Mock messages.create() to return expected response
// Response must have content array with text blocks
// Format: { id, type, role, content: [{ type: 'text', text: '...' }], stop_reason, usage }

// CRITICAL: ESM import requirements
// Must use: import { Agent, Prompt, createAgent, createPrompt } from 'groundswell';
// Must use: .js extensions for relative imports (ESM requirement)

// CRITICAL: Mock cleanup
// Use vi.clearAllMocks() in beforeEach to prevent test pollution
// This ensures mocks don't leak between tests

// GOTCHA: S1 dependency check pattern
// May want to check npm link validation before running tests
// Follow pattern from tests/unit/groundswell/imports.test.ts
// Use conditional test execution: const itIf = shouldRun ? it : it.skip;

// GOTCHA: Version compatibility consideration
// Previous PRP (P1.M1.T1.S3) checks for v0.0.3 features
// Agent/Prompt APIs are stable across versions
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Agent creation test result structure
 */
interface AgentCreationResult {
  agentId: string;
  name: string;
  hasMcpHandler: boolean;
  config: AgentConfig;
}

/**
 * Prompt validation test result structure
 */
interface PromptValidationResult {
  promptId: string;
  user: string;
  data: Record<string, unknown>;
  validationSuccess: boolean;
  validationResult?: unknown;
  validationError?: string;
}

/**
 * Mock configuration for Anthropic API
 */
interface MockAnthropicConfig {
  responseText: string;
  id: string;
  usage: { input_tokens: number; output_tokens: number };
}
```

---

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/groundswell/agent-prompt.test.ts
  - IMPLEMENT: Main test file with all 6 test categories
  - HEADER: Include JSDoc comments describing test scope
  - IMPORTS: Import from 'groundswell', 'vitest', 'zod', test utilities
  - NAMING: agent-prompt.test.ts (per convention)
  - PLACEMENT: tests/integration/groundswell/ directory
  - DEPENDENCIES: None (first file)

Task 2: IMPLEMENT mock setup
  - MOCK: @anthropic-ai/sdk to prevent API calls
  - PATTERN: Follow tests/unit/groundswell/imports.test.ts
  - HOISTING: Place at top level before imports
  - CLEANUP: Add vi.clearAllMocks() in beforeEach

Task 3: IMPLEMENT Test Suite 1 - Basic Agent Creation
  - CREATE: Test Agent creation with createAgent()
  - VERIFY: Agent instance with unique ID
  - VERIFY: Agent name matches config (or default 'Agent')
  - VERIFY: getMcpHandler() returns MCPHandler instance
  - VERIFY: AgentConfig options (name, model, maxTokens, temperature, enableCache, enableReflection)
  - PATTERN: Follow /home/dustin/projects/groundswell/src/__tests__/unit/agent.test.ts

Task 4: IMPLEMENT Test Suite 2 - Prompt Creation with Zod Schema
  - CREATE: Test Prompt creation with createPrompt()
  - VERIFY: Prompt instance with unique ID
  - VERIFY: Prompt.user is stored correctly
  - VERIFY: Prompt.data is stored correctly
  - VERIFY: Prompt.responseFormat is Zod schema
  - TEST: Various Zod types (z.object, z.string, z.number, z.array, z.enum, z.optional)
  - PATTERN: Follow /home/dustin/projects/groundswell/src/__tests__/unit/prompt.test.ts

Task 5: IMPLEMENT Test Suite 3 - validateResponse() Method
  - CREATE: Test validateResponse() with valid data
  - CREATE: Test validateResponse() with invalid data
  - VERIFY: Valid data returns parsed result
  - VERIFY: Invalid data throws ZodError
  - VERIFY: Error messages are descriptive
  - PATTERN: Use expect().toThrow() for invalid data tests

Task 6: IMPLEMENT Test Suite 4 - safeValidateResponse() Method
  - CREATE: Test safeValidateResponse() with valid data
  - CREATE: Test safeValidateResponse() with invalid data
  - VERIFY: Success case returns { success: true, data: T }
  - VERIFY: Failure case returns { success: false, error: ZodError }
  - VERIFY: Type narrowing works correctly
  - PATTERN: Use if (result.success) for type narrowing

Task 7: IMPLEMENT Test Suite 5 - withData() Immutability
  - CREATE: Test Prompt.withData() creates new prompt
  - VERIFY: Original prompt data is unchanged
  - VERIFY: New prompt has merged data
  - VERIFY: Prompts have different IDs
  - VERIFY: Both prompts are frozen (immutable)
  - PATTERN: Follow /home/dustin/projects/groundswell/src/__tests__/unit/prompt.test.ts

Task 8: IMPLEMENT Test Suite 6 - Mock Anthropic API Client
  - MOCK: @anthropic-ai/sdk messages.create() method
  - CREATE: Test agent.prompt() with mock
  - VERIFY: Mock is called instead of real API
  - VERIFY: Mock receives correct parameters
  - VERIFY: No actual API calls are made
  - VERIFY: Response is returned correctly from mock
  - PATTERN: Follow vi.mock() patterns from codebase

Task 9: IMPLEMENT Test Suite 7 - buildUserMessage() with Data
  - CREATE: Test Prompt.buildUserMessage() with data
  - VERIFY: User message is included
  - VERIFY: Data is formatted as XML tags
  - VERIFY: Multiple data fields are formatted correctly
  - PATTERN: Check for <key>...</key> tags in output

Task 10: IMPLEMENT S1/S3 dependency check (optional)
  - CHECK: npm link validation from P1.M1.T1.S1
  - CHECK: version compatibility from P1.M1.T1.S3
  - PATTERN: Follow tests/unit/groundswell/imports.test.ts conditional execution
  - USE: const itIf = shouldRun ? it : it.skip;
  - OPTIONAL: Tests can run without this check

Task 11: VERIFY test file runs successfully
  - RUN: npm test -- tests/integration/groundswell/agent-prompt.test.ts
  - VERIFY: All 6 test suites pass
  - VERIFY: No accidental API calls (mocks work)
  - VERIFY: Zod validation works correctly
  - VERIFY: Immutability is preserved
  - VERIFY: Mock parameters are correct
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// FILE HEADER PATTERN
// =============================================================================

/**
 * Integration tests for Groundswell Agent and Prompt creation
 *
 * @remarks
 * Tests validate Groundswell Agent and Prompt functionality including:
 * 1. Agent creation with createAgent() and AgentConfig options
 * 2. Prompt creation with createPrompt() and Zod schemas
 * 3. Prompt.validateResponse() with valid/invalid data
 * 4. Prompt.safeValidateResponse() with success/error cases
 * 5. Prompt.withData() immutability (original unchanged, new has merged data)
 * 6. Mock Anthropic API client to test agent.prompt() without real calls
 * 7. Prompt.buildUserMessage() with data formatted as XML tags
 *
 * All tests mock @anthropic-ai/sdk to prevent actual LLM calls.
 *
 * Depends on successful npm link validation from P1.M1.T1.S1,
 * version compatibility check from P1.M1.T1.S3, and
 * Workflow lifecycle validation from P1.M1.T2.S1.
 *
 * @see {@link https://groundswell.dev | Groundswell Documentation}
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

// =============================================================================
// IMPORTS PATTERN
// =============================================================================

import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import { z } from 'zod';
import type {
  Agent,
  Prompt,
  AgentConfig,
  PromptConfig,
  MCPHandler,
} from 'groundswell';

// =============================================================================
// MOCK SETUP PATTERN - Must be at top level for hoisting
// =============================================================================

/**
 * Mock Anthropic SDK to prevent accidental API calls
 *
 * @remarks
 * Groundswell Agent initializes the Anthropic SDK in constructor.
 * Mocking ensures tests are isolated and don't make external API calls.
 * This is required by the z.ai API endpoint enforcement.
 */
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// =============================================================================
// DYNAMIC IMPORTS - Load after mocks are established
// =============================================================================

// Dynamic import ensures mocks are applied before Groundswell loads
async function loadGroundswell() {
  return await import('groundswell');
}

// =============================================================================
// TEST SUITE 1: Basic Agent Creation
// =============================================================================

describe('Agent and Prompt: Agent creation', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create Agent with unique ID', async () => {
    // SETUP: Create two agents
    const agent1 = gs.createAgent();
    const agent2 = gs.createAgent();

    // VERIFY: Each agent has unique ID
    expect(agent1.id).toBeDefined();
    expect(agent2.id).toBeDefined();
    expect(agent1.id).not.toBe(agent2.id);
  });

  it('should use default name when not provided', async () => {
    // SETUP: Create agent without name
    const agent = gs.createAgent();

    // VERIFY: Default name is 'Agent'
    expect(agent.name).toBe('Agent');
  });

  it('should use custom name when provided', async () => {
    // SETUP: Create agent with custom name
    const agent = gs.createAgent({ name: 'TestAgent' });

    // VERIFY: Custom name is used
    expect(agent.name).toBe('TestAgent');
  });

  it('should provide access to MCP handler', async () => {
    // SETUP: Create agent
    const agent = gs.createAgent();

    // EXECUTE: Get MCP handler
    const handler = agent.getMcpHandler();

    // VERIFY: Handler is MCPHandler instance
    expect(handler).toBeInstanceOf(gs.MCPHandler);
  });

  it('should support AgentConfig options', async () => {
    // SETUP: Create agent with full config
    const config = {
      name: 'ConfiguredAgent',
      system: 'You are a helpful assistant.',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 1000,
      temperature: 0.7,
      enableCache: true,
      enableReflection: true,
    };
    const agent = gs.createAgent(config);

    // VERIFY: Configuration is applied
    expect(agent.name).toBe(config.name);
    // Note: Other config options are private, test through behavior
  });

  it('should register MCP servers from config', async () => {
    // SETUP: Create agent with MCP config
    const agent = gs.createAgent({
      mcps: [
        {
          name: 'test-mcp',
          transport: 'inprocess',
          tools: [
            {
              name: 'test_tool',
              description: 'A test tool',
              input_schema: { type: 'object', properties: {} },
            },
          ],
        },
      ],
    });

    // EXECUTE: Get MCP handler
    const handler = agent.getMcpHandler();

    // VERIFY: Server is registered
    expect(handler.getServerNames()).toContain('test-mcp');
    expect(handler.hasTool('test-mcp__test_tool')).toBe(true);
  });
});

// =============================================================================
// TEST SUITE 2: Prompt Creation with Zod Schema
// =============================================================================

describe('Agent and Prompt: Prompt creation', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create Prompt with unique ID', async () => {
    // SETUP: Create two prompts
    const prompt1 = gs.createPrompt({
      user: 'Test',
      responseFormat: z.object({ message: z.string() }),
    });
    const prompt2 = gs.createPrompt({
      user: 'Test',
      responseFormat: z.object({ message: z.string() }),
    });

    // VERIFY: Each prompt has unique ID
    expect(prompt1.id).not.toBe(prompt2.id);
  });

  it('should store user message and data', async () => {
    // SETUP: Create prompt with user and data
    const prompt = gs.createPrompt({
      user: 'Hello world',
      data: { key: 'value' },
      responseFormat: z.object({ result: z.string() }),
    });

    // VERIFY: User and data are stored
    expect(prompt.user).toBe('Hello world');
    expect(prompt.data).toEqual({ key: 'value' });
  });

  it('should support various Zod types', async () => {
    // SETUP: Create prompt with complex Zod schema
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      tags: z.array(z.string()),
      status: z.enum(['active', 'inactive']),
      optional: z.string().optional(),
    });

    const prompt = gs.createPrompt({
      user: 'Test',
      responseFormat: schema,
    });

    // VERIFY: Schema is stored
    expect(prompt.getResponseFormat()).toBe(schema);
  });
});

// =============================================================================
// TEST SUITE 3: validateResponse() Method
// =============================================================================

describe('Agent and Prompt: validateResponse()', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate response successfully', async () => {
    // SETUP: Create prompt with Zod schema
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const prompt = gs.createPrompt({
      user: 'Get person',
      responseFormat: schema,
    });

    // EXECUTE: Validate valid data
    const result = prompt.validateResponse({ name: 'John', age: 30 });

    // VERIFY: Parsed result is returned
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('should throw on invalid response', async () => {
    // SETUP: Create prompt with required fields
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const prompt = gs.createPrompt({
      user: 'Get person',
      responseFormat: schema,
    });

    // EXECUTE & VERIFY: Throws on missing field
    expect(() => prompt.validateResponse({ name: 'John' })).toThrow();
  });

  it('should throw on wrong type', async () => {
    // SETUP: Create prompt with number field
    const schema = z.object({
      value: z.number(),
    });
    const prompt = gs.createPrompt({
      user: 'Test',
      responseFormat: schema,
    });

    // EXECUTE & VERIFY: Throws on wrong type
    expect(() => prompt.validateResponse({ value: 'not a number' })).toThrow();
  });

  it('should provide descriptive error messages', async () => {
    // SETUP: Create prompt with constraints
    const schema = z.object({
      email: z.string().email(),
    });
    const prompt = gs.createPrompt({
      user: 'Test',
      responseFormat: schema,
    });

    // EXECUTE & VERIFY: Error message is descriptive
    expect(() => prompt.validateResponse({ email: 'invalid' }))
      .toThrow(/email/);
  });
});

// =============================================================================
// TEST SUITE 4: safeValidateResponse() Method
// =============================================================================

describe('Agent and Prompt: safeValidateResponse()', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success for valid data', async () => {
    // SETUP: Create prompt with Zod schema
    const schema = z.object({ value: z.number() });
    const prompt = gs.createPrompt({
      user: 'Test',
      responseFormat: schema,
    });

    // EXECUTE: Safely validate valid data
    const result = prompt.safeValidateResponse({ value: 42 });

    // VERIFY: Success with data
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ value: 42 });
    }
  });

  it('should return error for invalid data', async () => {
    // SETUP: Create prompt with Zod schema
    const schema = z.object({ value: z.number() });
    const prompt = gs.createPrompt({
      user: 'Test',
      responseFormat: schema,
    });

    // EXECUTE: Safely validate invalid data
    const result = prompt.safeValidateResponse({ value: 'not a number' });

    // VERIFY: Error with ZodError
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(z.ZodError);
    }
  });

  it('should support type narrowing', async () => {
    // SETUP: Create prompt with Zod schema
    const schema = z.object({ result: z.string() });
    const prompt = gs.createPrompt({
      user: 'Test',
      responseFormat: schema,
    });

    // EXECUTE: Safely validate
    const result = prompt.safeValidateResponse({ result: 'success' });

    // VERIFY: Type narrowing works
    if (result.success) {
      // TypeScript knows result.data is { result: string }
      expect(result.data.result).toBe('success');
    } else {
      // TypeScript knows result.error is ZodError
      expect(result.error.issues).toBeDefined();
    }
  });
});

// =============================================================================
// TEST SUITE 5: withData() Immutability
// =============================================================================

describe('Agent and Prompt: withData() immutability', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new prompt with updated data', async () => {
    // SETUP: Create original prompt with data
    const original = gs.createPrompt({
      user: 'Test',
      data: { a: 1 },
      responseFormat: z.string(),
    });

    // EXECUTE: Create new prompt with additional data
    const updated = original.withData({ b: 2 });

    // VERIFY: Original unchanged
    expect(original.data).toEqual({ a: 1 });

    // VERIFY: New prompt has merged data
    expect(updated.data).toEqual({ a: 1, b: 2 });

    // VERIFY: Different IDs (new instance)
    expect(original.id).not.toBe(updated.id);
  });

  it('should overwrite existing fields in new prompt', async () => {
    // SETUP: Create prompt with data
    const original = gs.createPrompt({
      user: 'Test',
      data: { a: 1, b: 2 },
      responseFormat: z.string(),
    });

    // EXECUTE: Create new prompt with overwritten field
    const updated = original.withData({ b: 99 });

    // VERIFY: Original unchanged
    expect(original.data).toEqual({ a: 1, b: 2 });

    // VERIFY: New prompt has overwritten value
    expect(updated.data).toEqual({ a: 1, b: 99 });
  });

  it('should be immutable', async () => {
    // SETUP: Create prompt
    const prompt = gs.createPrompt({
      user: 'Test',
      data: { key: 'value' },
      responseFormat: z.string(),
    });

    // VERIFY: Prompt is frozen
    expect(Object.isFrozen(prompt)).toBe(true);
    expect(Object.isFrozen(prompt.data)).toBe(true);
  });

  it('should preserve other properties in withData()', async () => {
    // SETUP: Create prompt with all properties
    const original = gs.createPrompt({
      user: 'Original user',
      data: { a: 1 },
      responseFormat: z.string(),
      system: 'Original system',
    });

    // EXECUTE: Create new prompt with different data
    const updated = original.withData({ b: 2 });

    // VERIFY: Other properties preserved
    expect(updated.user).toBe('Original user');
    expect(updated.system).toBe('Original system');
  });
});

// =============================================================================
// TEST SUITE 6: Mock Anthropic API Client
// =============================================================================

describe('Agent and Prompt: Mock Anthropic API', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;
  let mockMessagesCreate: any;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementation
    mockMessagesCreate = vi.fn()
      .mockResolvedValue({
        id: 'msg_001',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: '{"result": "success"}' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 },
      });
  });

  it('should execute agent.prompt() without real API call', async () => {
    // SETUP: Import mocked Anthropic
    const { Anthropic } = await import('@anthropic-ai/sdk');
    vi.mocked(Anthropic).mockReturnValue({
      messages: {
        create: mockMessagesCreate,
      },
    });

    // SETUP: Create agent and prompt
    const agent = gs.createAgent({ name: 'TestAgent' });
    const prompt = gs.createPrompt({
      user: 'Test prompt',
      responseFormat: z.object({ result: z.string() }),
    });

    // EXECUTE: Call agent.prompt()
    const result = await agent.prompt(prompt);

    // VERIFY: Result is returned from mock
    expect(result).toEqual({ result: 'success' });

    // VERIFY: Mock was called
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
  });

  it('should call mock with correct parameters', async () => {
    // SETUP: Import mocked Anthropic
    const { Anthropic } = await import('@anthropic-ai/sdk');
    vi.mocked(Anthropic).mockReturnValue({
      messages: {
        create: mockMessagesCreate,
      },
    });

    // SETUP: Create agent with config
    const agent = gs.createAgent({
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 1000,
      temperature: 0.7,
    });
    const prompt = gs.createPrompt({
      user: 'Test prompt',
      responseFormat: z.object({ result: z.string() }),
    });

    // EXECUTE: Call agent.prompt()
    await agent.prompt(prompt);

    // VERIFY: Mock received correct parameters
    expect(mockMessagesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.7,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Test prompt'),
          }),
        ]),
      })
    );
  });

  it('should verify no actual API calls are made', async () => {
    // SETUP: Import mocked Anthropic
    const { Anthropic } = await import('@anthropic-ai/sdk');
    vi.mocked(Anthropic).mockReturnValue({
      messages: {
        create: mockMessagesCreate,
      },
    });

    // SETUP: Create agent and prompt
    const agent = gs.createAgent();
    const prompt = gs.createPrompt({
      user: 'Test',
      responseFormat: z.string(),
    });

    // EXECUTE: Call agent.prompt()
    await agent.prompt(prompt);

    // VERIFY: Only mock was called (no real API)
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
    // If real API was called, we'd see network errors or different behavior
  });
});

// =============================================================================
// TEST SUITE 7: buildUserMessage() with Data
// =============================================================================

describe('Agent and Prompt: buildUserMessage()', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build user message without data', async () => {
    // SETUP: Create prompt without data
    const prompt = gs.createPrompt({
      user: 'Simple message',
      responseFormat: z.string(),
    });

    // EXECUTE: Build user message
    const message = prompt.buildUserMessage();

    // VERIFY: Just the user message
    expect(message).toBe('Simple message');
  });

  it('should build user message with data', async () => {
    // SETUP: Create prompt with data
    const prompt = gs.createPrompt({
      user: 'Message with data',
      data: { items: ['a', 'b', 'c'] },
      responseFormat: z.string(),
    });

    // EXECUTE: Build user message
    const message = prompt.buildUserMessage();

    // VERIFY: User message included
    expect(message).toContain('Message with data');

    // VERIFY: Data formatted as XML tags
    expect(message).toContain('<items>');
    expect(message).toContain('</items>');
    expect(message).toContain(JSON.stringify(['a', 'b', 'c']));
  });

  it('should format multiple data fields', async () => {
    // SETUP: Create prompt with multiple data fields
    const prompt = gs.createPrompt({
      user: 'Test',
      data: {
        name: 'Test',
        count: 42,
        items: ['a', 'b'],
      },
      responseFormat: z.string(),
    });

    // EXECUTE: Build user message
    const message = prompt.buildUserMessage();

    // VERIFY: All fields formatted as XML
    expect(message).toContain('<name>');
    expect(message).toContain('</name>');
    expect(message).toContain('<count>');
    expect(message).toContain('</count>');
    expect(message).toContain('<items>');
    expect(message).toContain('</items>');
  });
});

// =============================================================================
// OPTIONAL: S1/S3 Dependency Check
// =============================================================================

describe('Agent and Prompt: Prerequisites check', () => {
  it('should have valid Groundswell installation', async () => {
    // This test validates that Groundswell is properly installed
    // before running the Agent and Prompt tests
    const gs = await loadGroundswell();

    expect(gs.Agent).toBeDefined();
    expect(gs.Prompt).toBeDefined();
    expect(gs.createAgent).toBeDefined();
    expect(gs.createPrompt).toBeDefined();
    expect(gs.MCPHandler).toBeDefined();
  });
});
```

---

### Integration Points

```yaml
INPUT FROM S1 (P1.M1.T1.S1):
  - File: src/utils/validate-groundswell-link.ts
  - Interface: NpmLinkValidationResult
  - Critical: If S1 returns success=false, Groundswell may not be installed
  - Usage: Check if Groundswell is installed before testing Agent/Prompt

INPUT FROM S2 (P1.M1.T1.S2):
  - File: tests/unit/groundswell/imports.test.ts
  - Critical: Groundswell imports must work for Agent/Prompt creation
  - Usage: Import createAgent, createPrompt from 'groundswell'

INPUT FROM S3 (P1.M1.T1.S3):
  - File: GroundswellCompatibilityReport
  - Interface: GroundswellCompatibilityReport
  - Critical: Agent/Prompt APIs are stable across versions
  - Usage: Verify version compatibility (though less critical for Agent/Prompt)

INPUT FROM P1.M1.T2.S1:
  - File: tests/integration/groundswell/workflow.test.ts
  - Critical: Workflow lifecycle must work before testing Agent/Prompt
  - Usage: Agent/Prompt may be used within Workflow context

OUTPUT FOR P1.M1.T2.S3 (MCP tool registration):
  - Confirmation: Agent.getMcpHandler() works correctly
  - Enables: Testing MCP tool registration and execution

DIRECTORY STRUCTURE:
  - Create: tests/integration/groundswell/agent-prompt.test.ts (new test file)
  - Location: Integration test directory (not unit test)
  - Reason: Tests real Groundswell Agent/Prompt behavior, not mocks
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating tests/integration/groundswell/agent-prompt.test.ts
# Check TypeScript compilation
npx tsc --noEmit tests/integration/groundswell/agent-prompt.test.ts

# Expected: No type errors

# Format check
npx prettier --check "tests/integration/groundswell/agent-prompt.test.ts"

# Expected: No formatting issues

# Linting
npx eslint tests/integration/groundswell/agent-prompt.test.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the Agent and Prompt test file
npm test -- tests/integration/groundswell/agent-prompt.test.ts

# Expected: All Agent and Prompt tests pass

# Run with coverage
npm run test:coverage -- tests/integration/groundswell/agent-prompt.test.ts

# Expected: High coverage of tested Agent/Prompt methods

# Run specific test categories
npm test -- -t "Agent creation"
npm test -- -t "Prompt creation"
npm test -- -t "validateResponse"
npm test -- -t "safeValidateResponse"
npm test -- -t "withData"
npm test -- -t "Mock Anthropic API"

# Expected: All category tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test S1 dependency (npm link validation)
npm test -- -t "npm link validation"

# Expected: S1 validation passes, Agent/Prompt tests can run

# Test S3 dependency (version compatibility)
npm test -- -t "version compatibility"

# Expected: S3 validation passes

# Test P1.M1.T2.S1 dependency (Workflow lifecycle)
npm test -- tests/integration/groundswell/workflow.test.ts

# Expected: Workflow lifecycle tests pass

# Test full Agent and Prompt functionality
npm test -- tests/integration/groundswell/agent-prompt.test.ts

# Expected: All integration tests pass

# Verify no accidental API calls
# Check that @anthropic-ai/sdk mock prevented calls
npm test -- tests/integration/groundswell/agent-prompt.test.ts 2>&1 | grep -i "anthropic\|api"

# Expected: No actual API calls made (mocks working)
```

### Level 4: Domain-Specific Validation

```bash
# Agent creation validation
# Test 1: Verify Agent creation works
npm test -- -t "Agent creation"

# Expected: createAgent() creates agent with unique ID, getMcpHandler() works

# Prompt creation validation
# Test 2: Verify Prompt creation works
npm test -- -t "Prompt creation"

# Expected: createPrompt() creates prompt with Zod schema

# Validation methods validation
# Test 3: Verify validateResponse() works
npm test -- -t "validateResponse"

# Expected: Valid data passes, invalid data throws

# Test 4: Verify safeValidateResponse() works
npm test -- -t "safeValidateResponse"

# Expected: Returns success/error objects correctly

# Immutability validation
# Test 5: Verify withData() immutability
npm test -- -t "withData"

# Expected: Original unchanged, new has merged data

# Mock validation
# Test 6: Verify mock Anthropic API works
npm test -- -t "Mock Anthropic API"

# Expected: Mock called, no real API calls

# Message building validation
# Test 7: Verify buildUserMessage() works
npm test -- -t "buildUserMessage"

# Expected: Data formatted as XML tags
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/integration/groundswell/agent-prompt.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npx eslint tests/integration/groundswell/agent-prompt.test.ts`
- [ ] No formatting issues: `npx prettier --check "tests/integration/groundswell/agent-prompt.test.ts"`
- [ ] @anthropic-ai/sdk mock prevents actual API calls
- [ ] Zod validation works correctly for all test cases
- [ ] Immutability is preserved for withData()

### Feature Validation

- [ ] Test 1: Agent creation with AgentConfig works
- [ ] Test 2: Prompt creation with Zod schema works
- [ ] Test 3: validateResponse() validates valid data and rejects invalid data
- [ ] Test 4: safeValidateResponse() returns success/error correctly
- [ ] Test 5: withData() creates new immutable prompt with merged data
- [ ] Test 6: Mock Anthropic API prevents real calls
- [ ] Test 7: buildUserMessage() formats data as XML tags
- [ ] Various Zod types work (string, number, array, enum, optional)
- [ ] Error messages are descriptive for validation failures

### Code Quality Validation

- [ ] Follows existing test patterns from tests/unit/groundswell/
- [ ] File placement matches desired codebase tree structure
- [ ] File naming follows convention (agent-prompt.test.ts)
- [ ] Includes JSDoc header with @remarks and @see tags
- [ ] Uses vi.mock() for @anthropic-ai/sdk
- [ ] Uses vi.clearAllMocks() in beforeEach
- [ ] Tests cover happy path and error cases
- [ ] Clear test names with descriptive what/under why

### Documentation & Deployment

- [ ] Code is self-documenting with clear test names
- [ ] Error messages are descriptive and actionable
- [ ] Test output provides clear pass/fail status
- [ ] Any issues found are documented in test output
- [ ] No environment variables required
- [ ] Tests are idempotent (can run multiple times)

---

## Anti-Patterns to Avoid

- ❌ **Don't skip mocking @anthropic-ai/sdk** - Always mock to prevent API calls
- ❌ **Don't put vi.mock() after imports** - Must be at top level for hoisting
- ❌ **Don't forget vi.clearAllMocks()** - Prevents test pollution
- ❌ **Don't use parse() in tests** - Use safeParse() for validation testing
- ❌ **Don't forget type narrowing** - Use if (result.success) for safeValidateResponse
- ❌ **Don't test withData() mutability** - It's designed to be immutable
- ❌ **Don't forget .js extensions** - ESM requires .js in relative imports
- ❌ **Don't use sync expectations for async operations** - Use await
- ❌ **Don't assume Zod validation passes** - Test both success and failure cases
- ❌ **Don't test private Agent config fields** - Test through behavior, not internals
- ❌ **Don't forget to check immutability** - Use Object.isFrozen() to verify
- ❌ **Don't ignore error messages** - Verify error messages are descriptive
- ❌ **Don't skip mock parameter verification** - Check mock was called correctly
- ❌ **Don't forget XML tag format** - Data is formatted as <key>...</key>
- ❌ **Don't test with single values** - Test various Zod types and edge cases

---

## Appendix: Decision Rationale

### Why test Agent and Prompt separately?

These are two core Groundswell classes that work together but serve different purposes:
- **Agent**: Manages LLM execution, configuration, and MCP tool integration
- **Prompt**: Defines type-safe prompts with Zod validation

Testing them separately ensures each class works correctly before testing their integration. This follows the unit testing principle of testing one thing at a time.

### Why use safeParse() instead of parse() in tests?

The safeParse() method returns a discriminated union that allows for graceful error handling without try/catch blocks. This makes tests cleaner and more readable. The parse() method throws on error, which requires try/catch or expect().toThrow() wrappers.

### Why mock @anthropic-ai/sdk at module level?

Groundswell Agent initializes the Anthropic SDK in its constructor. Mocking at module level with hoisting ensures the mock is applied before any import occurs. This prevents any accidental API calls during test execution, which is required by the z.ai API endpoint enforcement.

### Why test withData() immutability?

The withData() method is designed to create a new prompt with merged data while preserving the original. This is a critical pattern for creating prompt variations without modifying the original. Testing immutability ensures this behavior is preserved.

### Why verify XML formatting in buildUserMessage()?

The buildUserMessage() method formats data as XML tags (<key>...</key>) for injection into the user message. This is a specific implementation detail that affects how prompts are constructed. Verifying this ensures the format is correct and consistent.

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from previous PRPs (S1, S2, S3, P1.M1.T2.S1)
- [x] Comprehensive Groundswell Agent API documented
- [x] Comprehensive Groundswell Prompt API documented
- [x] Existing test patterns analyzed and documented
- [x] External research from Groundswell source completed
- [x] All file paths and patterns specified
- [x] Mock patterns for @anthropic-ai/sdk identified
- [x] Zod validation patterns documented
- [x] ESM requirements documented (.js extensions)
- [x] 100% coverage requirement understood

**Risk Mitigation**:
- S1/S3 dependency checks prevent wasted time on missing/incompatible Groundswell
- Mock pattern prevents accidental API calls
- Comprehensive test coverage catches edge cases
- Clear test names and structure for maintainability
- Follows existing codebase patterns for consistency

**Known Risks**:
- Groundswell version discrepancy (npm: 0.0.1, source: 0.0.3) - mitigated by version checks
- Agent/Prompt APIs are stable across versions
- Zod validation patterns are well-established in codebase

---

**END OF PRP**
