# Product Requirement Prompt (PRP): Test MCP tool registration

**PRP ID**: P1.M1.T2.S3
**Generated**: 2026-01-15
**Story Points**: 2

---

## Goal

**Feature Goal**: Create a comprehensive test suite that validates Groundswell MCP tool registration functionality including MCPHandler.registerServer() for registering inprocess MCP servers, MCPHandler.registerToolExecutor() for registering custom tool executors, MCPHandler.getTools() returning tools in Anthropic format with server\_\_tool naming, MCPHandler.hasTool() correctly identifying registered tools, custom tool executor invocation via executeTool(), and integration with Agent.getMcpHandler() for accessing MCPHandler from Agent instances.

**Deliverable**: `tests/integration/groundswell/mcp.test.ts` - A comprehensive test file covering MCP server registration with inprocess transport, custom tool executor registration and invocation, getTools() Anthropic format validation with server\_\_tool naming pattern, hasTool() tool identification testing, and Agent.getMcpHandler() integration for custom tool registration.

**Success Definition**:

- Test 1: Create Agent with inprocess MCP server in AgentConfig, verify registerServer() called, server registered in MCPHandler
- Test 2: Register custom tool executor via agent.getMcpHandler().registerToolExecutor('test', 'tool', executor), verify executor called when tool invoked via executeTool()
- Test 3: Test getTools() returns tools in Anthropic format with server\_\_tool naming, verify tool schema structure (name, description, input_schema)
- Test 4: Verify hasTool() correctly identifies registered tools with full names (server\_\_tool pattern), returns false for non-existent tools
- Test 5: Test custom tool executor invocation with async/await, verify executor receives input parameters, returns result correctly
- All tests use async/await for executor calls
- All tests follow existing MCP test patterns from tests/tools/
- Test achieves 100% coverage of MCP registration functionality
- Any issues with MCP tool registration are documented

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Sixth validation step in Phase 1 (P1.M1.T2) to verify that after npm link is validated (S1), imports work (S2), version is compatible (S3), Workflow lifecycle works (S1), and Agent/Prompt creation works (S2), the Groundswell MCP tool registration works correctly for extensible tool integration.

**User Journey**:

1. Pipeline completes P1.M1.T1 (npm link, imports, version compatibility) with success
2. Pipeline completes P1.M1.T2.S1 (Workflow lifecycle tests) with success
3. Pipeline completes P1.M1.T2.S2 (Agent and Prompt tests) with success
4. Pipeline starts P1.M1.T2.S3 (MCP tool registration tests)
5. Test suite runs 5 test categories covering MCP registration functionality
6. Each test validates specific MCP registration behavior
7. Server registration is verified with inprocess transport
8. Custom tool executors are registered and invoked correctly
9. Tool format validation matches Anthropic API spec
10. Tool identification works with hasTool()
11. If all tests pass: Proceed to P1.M2 (Environment Configuration & API Safety)
12. If tests fail: Document specific issues for debugging

**Pain Points Addressed**:

- Uncertainty whether Groundswell MCP tool registration works correctly
- Lack of test coverage for custom tool executor registration
- Missing validation of Anthropic tool format compliance
- Unclear tool naming pattern (server\_\_tool) behavior
- Missing verification of MCPHandler integration with Agent
- Unclear how to register custom tools via getMcpHandler()
- Missing validation of getTools() format

---

## Why

- **Foundation for MCP Integration**: MCP tool registration is critical for extending Groundswell Agents with custom tools
- **Critical Pattern Validation**: MCPHandler.registerServer() and registerToolExecutor() are core patterns for tool extension
- **Format Compliance**: getTools() must return Anthropic-compatible format for API integration
- **Tool Naming Validation**: server\_\_tool naming pattern prevents conflicts and enables proper routing
- **Problems Solved**:
  - Validates that Agent.getMcpHandler() returns MCPHandler instance for custom registration
  - Confirms registerServer() works with inprocess transport
  - Verifies registerToolExecutor() registers custom executors correctly
  - Tests getTools() returns Anthropic-format tools with correct naming
  - Tests hasTool() identifies tools correctly
  - Confirms executeTool() invokes custom executors with async/await
  - Validates tool schema structure (name, description, input_schema)

---

## What

Create a comprehensive test suite covering 5 main test categories:

### Test 1: MCP Server Registration via AgentConfig

- Create Agent using createAgent() with AgentConfig containing mcps array
- Use inprocess transport with MCPServer interface: { name, transport: 'inprocess', tools[] }
- Define tool schema with name, description, input_schema (JSON Schema format)
- Verify:
  - Agent creates MCPHandler instance
  - getMcpHandler() returns MCPHandler instance
  - Server is registered via registerServer()
  - Tools are accessible via getTools()

### Test 2: Custom Tool Executor Registration

- Create Agent with AgentConfig
- Access MCPHandler via agent.getMcpHandler()
- Register custom tool executor using registerToolExecutor(serverName, toolName, executor)
- Define executor as async function: async (input: unknown) => { ... }
- Verify:
  - Executor is registered without errors
  - hasTool() identifies the registered tool
  - Tool appears in getTools() output

### Test 3: getTools() Anthropic Format Validation

- Register inprocess MCP server with tools
- Call getTools() on MCPHandler
- Verify:
  - Returns array of Tool objects
  - Each tool has name, description, input_schema properties
  - Tool names follow server\_\_tool pattern
  - input_schema has type: 'object', properties object, required array
  - Schema matches Anthropic API specification

### Test 4: hasTool() Tool Identification

- Register multiple tools from different servers
- Test hasTool() with various tool names:
  - Full tool name (server\_\_tool) - should return true
  - Partial tool name (tool only) - should return false
  - Non-existent tool - should return false
- Verify:
  - hasTool() correctly identifies registered tools
  - hasTool() returns false for unregistered tools
  - Tool naming pattern is enforced

### Test 5: Custom Tool Executor Invocation

- Register custom tool executor
- Call executeTool('server\_\_tool', input) to invoke executor
- Verify:
  - Executor receives input parameters
  - Executor return value is returned correctly
  - Async operations work with await
  - ToolResult format matches expectations
  - Errors are handled correctly

### Test 6: Integration with Agent.getMcpHandler()

- Create Agent with and without MCP servers in config
- Access MCPHandler via getMcpHandler()
- Verify:
  - getMcpHandler() always returns MCPHandler instance
  - Can register custom tools on the handler
  - Custom tools work alongside configured MCPs
  - Tool execution routes through MCPHandler correctly

### Success Criteria

- [ ] Test 1: MCP server registration with inprocess transport works
- [ ] Test 2: Custom tool executor registration works
- [ ] Test 3: getTools() returns Anthropic format with server\_\_tool naming
- [ ] Test 4: hasTool() correctly identifies registered tools
- [ ] Test 5: Custom tool executor invocation works with async/await
- [ ] Test 6: Agent.getMcpHandler() integration works
- [ ] All tests use async/await for executor calls
- [ ] All tests follow existing MCP test patterns from tests/tools/
- [ ] 100% coverage of MCP registration functionality
- [ ] All tests pass consistently

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] Groundswell MCPHandler API documented (registerServer, registerToolExecutor, getTools, hasTool, executeTool)
- [x] MCPServer interface documented (name, transport, tools, command, args)
- [x] Tool interface documented (name, description, input_schema)
- [x] ToolExecutor type documented
- [x] Agent.getMcpHandler() access pattern documented
- [x] Tool naming pattern (server\_\_tool) documented
- [x] Anthropic tool format specification documented
- [x] Test patterns from existing codebase analyzed
- [x] MCP test file examples from tests/tools/
- [x] Mock patterns for external dependencies identified

---

### Documentation & References

```yaml
# MUST READ - Contract definition from PRD
- docfile: plan/002_1e734971e481/current_prd.md
  why: Contains the work item contract definition for this subtask
  section: P1.M1.T2.S3 contract definition
  critical: Specifies exact test requirements and expected outputs

# MUST READ - Previous PRP (P1.M1.T2.S2) outputs
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M1T2S2/PRP.md
  why: Defines the Agent and Prompt validation that precedes MCP tests
  pattern: Agent.getMcpHandler() must work before testing MCP registration
  critical: Confirms Agent creation and getMcpHandler() access is verified

# EXTERNAL SOURCE - Groundswell MCPHandler class
- file: /home/dustin/projects/groundswell/src/core/mcp-handler.ts
  why: Groundswell's MCPHandler implementation
  section: Lines 45-147 (registerServer, registerToolExecutor, getTools, hasTool, executeTool)
  critical: |
    - registerServer(server: MCPServer): void - Registers MCP server, creates server__tool names
    - registerToolExecutor(serverName, toolName, executor): void - Registers custom executor
    - getTools(): Tool[] - Returns all tools in Anthropic format
    - hasTool(toolName): boolean - Checks if tool is registered
    - executeTool(toolName, input): Promise<ToolResult> - Executes tool

# EXTERNAL SOURCE - Groundswell MCPServer interface
- file: /home/dustin/projects/groundswell/src/types/sdk-primitives.ts
  why: Type definition for MCPServer configuration
  section: MCPServer interface definition
  critical: |
    interface MCPServer {
      name: string;
      version?: string;
      transport: 'stdio' | 'inprocess';
      command?: string;
      args?: string[];
      tools?: Tool[];
      env?: Record<string, string>;
    }

# EXTERNAL SOURCE - Groundswell Tool interface
- file: /home/dustin/projects/groundswell/src/types/sdk-primitives.ts
  why: Type definition for Tool schema
  section: Tool interface definition
  critical: |
    interface Tool {
      name: string;
      description: string;
      input_schema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
      };
    }

# EXTERNAL SOURCE - Groundswell Agent MCP integration
- file: /home/dustin/projects/groundswell/src/core/agent.ts
  why: Shows how Agent integrates MCPHandler
  section: Lines 48-88 (constructor), 465-488 (executeTool, mergeTools)
  critical: |
    - Constructor initializes MCPHandler and registers configured MCPs
    - getMcpHandler() returns this.mcpHandler (MCPHandler instance)
    - executeTool() routes MCP tools through mcpHandler.executeTool()
    - mergeTools() combines direct tools with MCP tools

# EXTERNAL SOURCE - Groundswell MCP test example
- file: /home/dustin/projects/groundswell/src/__tests__/unit/agent.test.ts
  why: Groundswell's own tests for MCP registration
  section: Server registration tests
  critical: |
    - Agent with mcps config registers servers automatically
    - getServerNames() returns registered server names
    - hasTool('server__tool') checks for tool existence

# EXISTING CODEBASE PATTERNS - MCP tool implementations
- file: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts
  why: Example MCP tool implementation
  pattern: Extends MCPHandler, registers server and executors in constructor
  gotcha: Uses registerServer() and registerToolExecutor() in constructor

- file: /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts
  why: Example of multi-tool MCP server
  pattern: Registers multiple tools with same server prefix
  gotcha: All tools use 'filesystem' server prefix

- file: /home/dustin/projects/hacky-hack/src/tools/git-mcp.ts
  why: Example MCP tool with validation
  pattern: Validates inputs before async operations
  gotcha: Uses existsSync for path validation

# EXISTING CODEBASE PATTERNS - MCP integration tests
- file: /home/dustin/projects/hacky-hack/tests/integration/tools.test.ts
  why: Example of MCP integration testing
  pattern: executeTool() invocation, parseToolResult helper, mock factories
  gotcha: Uses vi.useRealTimers() for async child process timing

- file: /home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts
  why: Example of comprehensive MCP unit testing
  pattern: Mock external dependencies, test executor directly
  gotcha: Uses createMockChild helper for ChildProcess mocking

# INTERNAL RESEARCH - MCP patterns
- docfile: plan/001_14b9dc2a33c7/P2M1T2S3/research/mcp-patterns-research.md
  why: Internal research on MCP implementation patterns
  section: Tool executor patterns, registration patterns
  critical: |
    - registerServer() in constructor
    - registerToolExecutor() after server registration
    - Tool naming: server__tool pattern

# INTERNAL RESEARCH - Groundswell analysis
- docfile: plan/002_1e734971e481/architecture/groundswell_analysis.md
  why: Comprehensive Groundswell API documentation
  section: Section 2.1 (MCPHandler)
  critical: MCPHandler methods, MCPServer interface, Tool format

# EXTERNAL DOCUMENTATION - URLs
- url: https://spec.modelcontextprotocol.io/specification/
  why: Official MCP specification for tool format

- url: https://spec.modelcontextprotocol.io/specification/tools/
  why: Tool definition and execution specification
  section: #tool-definition, #input-validation, #output-format

- url: https://docs.anthropic.com/claude/docs/tool-use
  why: Anthropic tool format specification
  section: Tool schema structure
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # Node.js >=20, TypeScript 5.2.0, vitest test runner
├── tsconfig.json                 # experimentalDecorators: true
├── vitest.config.ts              # Decorator support, groundswell path alias
├── src/
│   └── tools/                    # Existing MCP tool implementations
│       ├── bash-mcp.ts          # BashMCP extends MCPHandler
│       ├── filesystem-mcp.ts    # FilesystemMCP extends MCPHandler
│       └── git-mcp.ts           # GitMCP extends MCPHandler
├── tests/
│   ├── setup.ts                  # Global test setup
│   ├── unit/
│   │   └── tools/               # Unit tests for MCP tools
│   │       ├── bash-mcp.test.ts
│   │       ├── filesystem-mcp.test.ts
│   │       └── git-mcp.test.ts
│   └── integration/
│       ├── tools.test.ts        # MCP integration tests (executeTool)
│       └── groundswell/
│           ├── workflow.test.ts # Workflow lifecycle tests (from P1.M1.T2.S1)
│           ├── agent-prompt.test.ts # Agent/Prompt tests (from P1.M1.T2.S2)
│           └── mcp.test.ts      # TO BE CREATED (this PRP)
```

---

### Desired Codebase Tree (files to be added)

```bash
hacky-hack/
└── tests/
    └── integration/
        └── groundswell/
            └── mcp.test.ts  # NEW: MCP tool registration tests
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: MCPServer interface requires specific structure
// transport must be 'stdio' or 'inprocess'
// tools array must contain Tool objects with valid schemas

interface MCPServer {
  name: string;
  transport: 'stdio' | 'inprocess';
  tools?: Tool[];
  command?: string; // Only for stdio transport
  args?: string[]; // Only for stdio transport
}

// CRITICAL: Tool naming uses server__tool pattern
// When registering a server with tools, tool names get prefixed
// Example: server='bash', tool='execute' becomes 'bash__execute'
// Always use full name when calling hasTool() or executeTool()

// CRITICAL: Tool input_schema must be valid JSON Schema
// Must have type: 'object'
// Must have properties object
// May have required array

interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// CRITICAL: registerToolExecutor() uses server and tool names separately
// Does NOT use the full server__tool name
// Pattern: registerToolExecutor(serverName, toolName, executor)

agent.getMcpHandler().registerToolExecutor(
  'myserver', // Server name (no prefix)
  'mytool', // Tool name (no prefix)
  async input => {
    /* executor */
  }
);

// But executeTool() and hasTool() use full name:
agent.getMcpHandler().executeTool('myserver__mytool', input);
agent.getMcpHandler().hasTool('myserver__mytool');

// CRITICAL: getTools() returns tools in Anthropic format
// Tools have full names (server__tool)
// Schema structure matches Anthropic API spec

// CRITICAL: Executor functions must be async
// Must accept input parameter (unknown type)
// Should return structured result

async function executor(input: unknown): Promise<unknown> {
  // Process input
  return { success: true, data: result };
}

// CRITICAL: ToolResult format from executeTool()
// Returns { content: string | null, is_error?: boolean }
// Content is typically JSON stringified result

interface ToolResult {
  content: string | null;
  is_error?: boolean;
}

// GOTCHA: getMcpHandler() always returns MCPHandler instance
// Even if no MCPs are configured in AgentConfig
// Can always register custom tools on the handler

// GOTCHA: Server registration happens in Agent constructor
// Cannot register servers after Agent creation (design limitation)
// But can register custom tool executors anytime via getMcpHandler()

// GOTCHA: hasTool() requires full tool name
// hasTool('tool') returns false
// hasTool('server__tool') returns true

// CRITICAL: Mock @anthropic-ai/sdk to prevent API calls
// Same pattern as P1.M1.T2.S2

vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: { create: vi.fn() },
  })),
}));

// CRITICAL: Use vi.clearAllMocks() in beforeEach
// Prevents mock state pollution between tests

// CRITICAL: Dynamic import for Groundswell
// Ensures mocks are applied before Groundswell loads

async function loadGroundswell() {
  return await import('groundswell');
}

// GOTCHA: getTools() returns all tools as flat array
// Tools from different servers are all in one array
// Each tool has full name (server__tool)

// GOTCHA: Multiple tools from same server
// All get same server prefix
// Example: 'filesystem__read', 'filesystem__write', 'filesystem__glob'

// CRITICAL: Tool executor type casting
// TypeScript may require type assertion for ToolExecutor

import type { ToolExecutor } from 'groundswell';

const executor = async (input: unknown) => {
  return { result: 'value' };
};

agent
  .getMcpHandler()
  .registerToolExecutor('server', 'tool', executor as ToolExecutor);
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * MCP server registration test result
 */
interface MCPServerRegistrationResult {
  serverName: string;
  toolCount: number;
  toolNames: string[];
  hasServer: boolean;
}

/**
 * Custom tool executor registration result
 */
interface ToolExecutorRegistrationResult {
  toolName: string;
  isRegistered: boolean;
  invocationResult?: unknown;
}

/**
 * Tool format validation result
 */
interface ToolFormatValidationResult {
  isValid: boolean;
  toolName: string;
  hasName: boolean;
  hasDescription: boolean;
  hasInputSchema: boolean;
  hasCorrectNaming: boolean;
}

/**
 * Test tool executor input/output
 */
interface TestToolInput {
  value: string;
  count?: number;
}

interface TestToolOutput {
  success: boolean;
  result: string;
  processedCount?: number;
}
```

---

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/groundswell/mcp.test.ts
  - IMPLEMENT: Main test file with all 5 test categories
  - HEADER: Include JSDoc comments describing test scope
  - IMPORTS: Import from 'groundswell', 'vitest', test utilities
  - NAMING: mcp.test.ts (per convention)
  - PLACEMENT: tests/integration/groundswell/ directory
  - DEPENDENCIES: None (first file)

Task 2: IMPLEMENT mock setup
  - MOCK: @anthropic-ai/sdk to prevent API calls
  - PATTERN: Follow tests/unit/groundswell/imports.test.ts
  - HOISTING: Place at top level before imports
  - CLEANUP: Add vi.clearAllMocks() in beforeEach

Task 3: IMPLEMENT Test Suite 1 - MCP Server Registration
  - CREATE: Test Agent creation with MCPServer config
  - VERIFY: Agent.getMcpHandler() returns MCPHandler instance
  - VERIFY: Server is registered (can verify via getTools())
  - VERIFY: Tools appear in getTools() with server__tool names
  - PATTERN: Follow /home/dustin/projects/groundswell/src/__tests__/unit/agent.test.ts

Task 4: IMPLEMENT Test Suite 2 - Custom Tool Executor Registration
  - CREATE: Test registerToolExecutor() via getMcpHandler()
  - VERIFY: Executor registers without errors
  - VERIFY: hasTool() identifies the registered tool
  - VERIFY: Tool appears in getTools() output
  - PATTERN: Use ToolExecutor type assertion

Task 5: IMPLEMENT Test Suite 3 - getTools() Anthropic Format
  - CREATE: Test getTools() returns valid Tool objects
  - VERIFY: Each tool has name, description, input_schema
  - VERIFY: Tool names follow server__tool pattern
  - VERIFY: input_schema has correct structure
  - PATTERN: Check Anthropic API spec compliance

Task 6: IMPLEMENT Test Suite 4 - hasTool() Tool Identification
  - CREATE: Test hasTool() with various inputs
  - VERIFY: Full name (server__tool) returns true
  - VERIFY: Partial name (tool only) returns false
  - VERIFY: Non-existent tool returns false
  - VERIFY: Case sensitivity works correctly

Task 7: IMPLEMENT Test Suite 5 - Custom Tool Executor Invocation
  - CREATE: Test executeTool() invokes custom executor
  - VERIFY: Executor receives input parameters
  - VERIFY: Executor return value is returned correctly
  - VERIFY: Async operations work with await
  - VERIFY: ToolResult format is correct

Task 8: IMPLEMENT Test Suite 6 - Agent.getMcpHandler() Integration
  - CREATE: Test getMcpHandler() access from Agent
  - VERIFY: Always returns MCPHandler instance
  - VERIFY: Can register custom tools on handler
  - VERIFY: Custom tools work alongside configured MCPs
  - PATTERN: Test with and without MCPs in config

Task 9: IMPLEMENT helper functions
  - CREATE: parseToolResult helper (from tests/integration/tools.test.ts)
  - CREATE: createMockTool helper for test tool schemas
  - CREATE: createMockExecutor helper for test executors

Task 10: VERIFY test file runs successfully
  - RUN: npm test -- tests/integration/groundswell/mcp.test.ts
  - VERIFY: All 6 test suites pass
  - VERIFY: MCP registration works correctly
  - VERIFY: Tool naming pattern is enforced
  - VERIFY: Executor invocation works with async/await
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// FILE HEADER PATTERN
// =============================================================================

/**
 * Integration tests for Groundswell MCP tool registration
 *
 * @remarks
 * Tests validate Groundswell MCP tool registration functionality including:
 * 1. MCP server registration via AgentConfig with inprocess transport
 * 2. Custom tool executor registration via registerToolExecutor()
 * 3. getTools() returns tools in Anthropic format with server__tool naming
 * 4. hasTool() correctly identifies registered tools
 * 5. Custom tool executor invocation with async/await
 * 6. Agent.getMcpHandler() integration for custom tool registration
 *
 * All tests mock @anthropic-ai/sdk to prevent actual LLM calls.
 *
 * Depends on successful npm link validation from P1.M1.T1.S1,
 * version compatibility check from P1.M1.T1.S3,
 * Workflow lifecycle validation from P1.M1.T2.S1, and
 * Agent/Prompt validation from P1.M1.T2.S2.
 *
 * @see {@link https://spec.modelcontextprotocol.io/specification/ | MCP Specification}
 * @see {@link https://docs.anthropic.com/claude/docs/tool-use | Anthropic Tool Use}
 */

// =============================================================================
// IMPORTS PATTERN
// =============================================================================

import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import type {
  Agent,
  AgentConfig,
  MCPServer,
  Tool,
  ToolExecutor,
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

async function loadGroundswell() {
  return await import('groundswell');
}

// =============================================================================
// HELPER: Create mock tool schema
// =============================================================================

/**
 * Creates a mock tool schema for testing
 *
 * @param name - Tool name (without server prefix)
 * @param description - Tool description
 * @returns Tool schema object
 */
function createMockTool(name: string, description: string): Tool {
  return {
    name,
    description,
    input_schema: {
      type: 'object',
      properties: {
        value: {
          type: 'string',
          description: 'Input value for the tool',
        },
        count: {
          type: 'number',
          description: 'Optional count parameter',
        },
      },
      required: ['value'],
    },
  };
}

// =============================================================================
// HELPER: Create mock tool executor
// =============================================================================

/**
 * Creates a mock tool executor for testing
 *
 * @param result - Result to return from executor
 * @returns Tool executor function
 */
function createMockExecutor(result: unknown): ToolExecutor {
  return (async (input: unknown) => {
    return result;
  }) as ToolExecutor;
}

// =============================================================================
// HELPER: Parse tool result from executeTool()
// =============================================================================

/**
 * Parses tool result from executeTool() response
 *
 * @remarks
 * executeTool() returns ToolResult with content as JSON string
 * When there's an error, content might be a plain string
 *
 * @param toolResult - Result from executeTool()
 * @returns Parsed result object
 */
function parseToolResult(toolResult: any): Record<string, unknown> {
  const content = toolResult.content as string;
  try {
    return JSON.parse(content);
  } catch {
    return {
      success: false,
      error: content,
    };
  }
}

// =============================================================================
// TEST SUITE 1: MCP Server Registration via AgentConfig
// =============================================================================

describe('MCP Registration: Server registration via AgentConfig', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create Agent with inprocess MCP server', async () => {
    // SETUP: Define MCPServer with inprocess transport
    const testServer: MCPServer = {
      name: 'test-server',
      transport: 'inprocess',
      tools: [createMockTool('test_tool', 'A test tool')],
    };

    // EXECUTE: Create Agent with MCPServer config
    const agent = gs.createAgent({
      mcps: [testServer],
    }) as Agent;

    // VERIFY: Agent has MCPHandler instance
    const handler = agent.getMcpHandler();
    expect(handler).toBeInstanceOf(gs.MCPHandler);

    // VERIFY: Tools are registered with server__tool naming
    const tools = handler.getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('test-server__test_tool');
  });

  it('should register multiple tools from same server', async () => {
    // SETUP: Define MCPServer with multiple tools
    const multiToolServer: MCPServer = {
      name: 'multi',
      transport: 'inprocess',
      tools: [
        createMockTool('tool1', 'First tool'),
        createMockTool('tool2', 'Second tool'),
        createMockTool('tool3', 'Third tool'),
      ],
    };

    // EXECUTE: Create Agent with multi-tool server
    const agent = gs.createAgent({
      mcps: [multiToolServer],
    }) as Agent;

    // VERIFY: All tools registered with same server prefix
    const handler = agent.getMcpHandler();
    const tools = handler.getTools();
    expect(tools).toHaveLength(3);

    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('multi__tool1');
    expect(toolNames).toContain('multi__tool2');
    expect(toolNames).toContain('multi__tool3');
  });

  it('should register tools from multiple servers', async () => {
    // SETUP: Define multiple MCPServers
    const server1: MCPServer = {
      name: 'server1',
      transport: 'inprocess',
      tools: [createMockTool('tool_a', 'Tool A')],
    };

    const server2: MCPServer = {
      name: 'server2',
      transport: 'inprocess',
      tools: [createMockTool('tool_b', 'Tool B')],
    };

    // EXECUTE: Create Agent with multiple servers
    const agent = gs.createAgent({
      mcps: [server1, server2],
    }) as Agent;

    // VERIFY: Tools from all servers are registered
    const handler = agent.getMcpHandler();
    const tools = handler.getTools();
    expect(tools).toHaveLength(2);

    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('server1__tool_a');
    expect(toolNames).toContain('server2__tool_b');
  });
});

// =============================================================================
// TEST SUITE 2: Custom Tool Executor Registration
// =============================================================================

describe('MCP Registration: Custom tool executor registration', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register custom tool executor via getMcpHandler()', async () => {
    // SETUP: Create Agent
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    // First, register a server (required for tool executor)
    handler.registerServer({
      name: 'custom',
      transport: 'inprocess',
      tools: [createMockTool('my_tool', 'Custom tool')],
    });

    // EXECUTE: Register custom executor
    const executor = createMockExecutor({ success: true, result: 'executed' });
    handler.registerToolExecutor('custom', 'my_tool', executor);

    // VERIFY: Tool is registered
    expect(handler.hasTool('custom__my_tool')).toBe(true);
  });

  it('should allow executor registration after Agent creation', async () => {
    // SETUP: Create Agent without initial MCPs
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    // EXECUTE: Register server and executor after creation
    handler.registerServer({
      name: 'dynamic',
      transport: 'inprocess',
      tools: [createMockTool('late_tool', 'Registered late')],
    });

    const executor = createMockExecutor({ result: 'dynamic result' });
    handler.registerToolExecutor('dynamic', 'late_tool', executor);

    // VERIFY: Tool is accessible
    expect(handler.hasTool('dynamic__late_tool')).toBe(true);
    const tools = handler.getTools();
    expect(tools.some(t => t.name === 'dynamic__late_tool')).toBe(true);
  });
});

// =============================================================================
// TEST SUITE 3: getTools() Anthropic Format Validation
// =============================================================================

describe('MCP Registration: getTools() Anthropic format', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tools in Anthropic format', async () => {
    // SETUP: Create Agent with MCPServer
    const agent = gs.createAgent({
      mcps: [
        {
          name: 'test',
          transport: 'inprocess',
          tools: [createMockTool('test_tool', 'Test tool description')],
        },
      ],
    }) as Agent;

    // EXECUTE: Get tools from MCPHandler
    const tools = agent.getMcpHandler().getTools();

    // VERIFY: Tool has required Anthropic format properties
    expect(tools).toHaveLength(1);
    const tool = tools[0];

    expect(tool.name).toBeDefined();
    expect(typeof tool.name).toBe('string');

    expect(tool.description).toBeDefined();
    expect(typeof tool.description).toBe('string');

    expect(tool.input_schema).toBeDefined();
    expect(tool.input_schema.type).toBe('object');
    expect(tool.input_schema.properties).toBeDefined();
  });

  it('should use server__tool naming pattern', async () => {
    // SETUP: Create Agent with multiple servers
    const agent = gs.createAgent({
      mcps: [
        {
          name: 'alpha',
          transport: 'inprocess',
          tools: [createMockTool('tool1', 'Alpha tool')],
        },
        {
          name: 'beta',
          transport: 'inprocess',
          tools: [createMockTool('tool2', 'Beta tool')],
        },
      ],
    }) as Agent;

    // EXECUTE: Get tools
    const tools = agent.getMcpHandler().getTools();

    // VERIFY: All tools use server__tool naming
    for (const tool of tools) {
      expect(tool.name).toMatch(/^[a-z]+__[a-z_]+$/);
    }

    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('alpha__tool1');
    expect(toolNames).toContain('beta__tool2');
  });

  it('should include required array in input_schema', async () => {
    // SETUP: Create Agent with tool that has required fields
    const agent = gs.createAgent({
      mcps: [
        {
          name: 'test',
          transport: 'inprocess',
          tools: [createMockTool('req_tool', 'Tool with required fields')],
        },
      ],
    }) as Agent;

    // EXECUTE: Get tools
    const tools = agent.getMcpHandler().getTools();

    // VERIFY: input_schema includes required array
    const tool = tools[0];
    expect(tool.input_schema.required).toBeDefined();
    expect(Array.isArray(tool.input_schema.required)).toBe(true);
    expect(tool.input_schema.required).toContain('value');
  });
});

// =============================================================================
// TEST SUITE 4: hasTool() Tool Identification
// =============================================================================

describe('MCP Registration: hasTool() tool identification', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should identify registered tools with full name', async () => {
    // SETUP: Create Agent with MCPServer
    const agent = gs.createAgent({
      mcps: [
        {
          name: 'myserver',
          transport: 'inprocess',
          tools: [createMockTool('mytool', 'My tool')],
        },
      ],
    }) as Agent;

    // EXECUTE & VERIFY: Full name is recognized
    expect(agent.getMcpHandler().hasTool('myserver__mytool')).toBe(true);
  });

  it('should return false for partial tool name', async () => {
    // SETUP: Create Agent with MCPServer
    const agent = gs.createAgent({
      mcps: [
        {
          name: 'myserver',
          transport: 'inprocess',
          tools: [createMockTool('mytool', 'My tool')],
        },
      ],
    }) as Agent;

    // EXECUTE & VERIFY: Partial name is not recognized
    expect(agent.getMcpHandler().hasTool('mytool')).toBe(false);
    expect(agent.getMcpHandler().hasTool('myserver')).toBe(false);
  });

  it('should return false for non-existent tools', async () => {
    // SETUP: Create Agent
    const agent = gs.createAgent() as Agent;

    // EXECUTE & VERIFY: Non-existent tools return false
    expect(agent.getMcpHandler().hasTool('nonexistent__tool')).toBe(false);
    expect(agent.getMcpHandler().hasTool('fake')).toBe(false);
  });

  it('should be case-sensitive', async () => {
    // SETUP: Create Agent with MCPServer
    const agent = gs.createAgent({
      mcps: [
        {
          name: 'TestServer',
          transport: 'inprocess',
          tools: [createMockTool('MyTool', 'Case sensitive tool')],
        },
      ],
    }) as Agent;

    // EXECUTE & VERIFY: Case must match exactly
    expect(agent.getMcpHandler().hasTool('TestServer__MyTool')).toBe(true);
    expect(agent.getMcpHandler().hasTool('testserver__mytool')).toBe(false);
    expect(agent.getMcpHandler().hasTool('TESTSERVER__MYTOOL')).toBe(false);
  });
});

// =============================================================================
// TEST SUITE 5: Custom Tool Executor Invocation
// =============================================================================

describe('MCP Registration: Custom tool executor invocation', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke executor with input parameters', async () => {
    // SETUP: Create Agent and register tool with executor
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    handler.registerServer({
      name: 'echo',
      transport: 'inprocess',
      tools: [createMockTool('echo_tool', 'Echo input')],
    });

    // Create executor that returns the input
    let receivedInput: unknown;
    const executor = (async (input: unknown) => {
      receivedInput = input;
      return { success: true, echoed: input };
    }) as ToolExecutor;

    handler.registerToolExecutor('echo', 'echo_tool', executor);

    // EXECUTE: Invoke tool
    const testInput = { value: 'hello', count: 42 };
    const result = await handler.executeTool('echo__echo_tool', testInput);

    // VERIFY: Executor received input and returned result
    expect(receivedInput).toEqual(testInput);
    const parsed = parseToolResult(result);
    expect(parsed.success).toBe(true);
    expect(parsed.echoed).toEqual(testInput);
  });

  it('should handle async executor operations', async () => {
    // SETUP: Create executor with async operation
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    handler.registerServer({
      name: 'async',
      transport: 'inprocess',
      tools: [createMockTool('async_tool', 'Async tool')],
    });

    // Create executor that simulates async operation
    const executor = (async (input: unknown) => {
      // Simulate async delay
      await new Promise(resolve => setTimeout(resolve, 10));
      return { success: true, processed: true };
    }) as ToolExecutor;

    handler.registerToolExecutor('async', 'async_tool', executor);

    // EXECUTE: Invoke tool with await
    const result = await handler.executeTool('async__async_tool', {
      value: 'test',
    });

    // VERIFY: Async operation completed
    const parsed = parseToolResult(result);
    expect(parsed.success).toBe(true);
    expect(parsed.processed).toBe(true);
  });

  it('should handle executor errors gracefully', async () => {
    // SETUP: Create executor that throws
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    handler.registerServer({
      name: 'error',
      transport: 'inprocess',
      tools: [createMockTool('error_tool', 'Error tool')],
    });

    const executor = (async () => {
      throw new Error('Executor failed');
    }) as ToolExecutor;

    handler.registerToolExecutor('error', 'error_tool', executor);

    // EXECUTE: Invoke tool
    const result = await handler.executeTool('error__error_tool', {
      value: 'test',
    });

    // VERIFY: Error is captured in result
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('Executor failed');
  });
});

// =============================================================================
// TEST SUITE 6: Agent.getMcpHandler() Integration
// =============================================================================

describe('MCP Registration: Agent.getMcpHandler() integration', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should always return MCPHandler instance', async () => {
    // EXECUTE: Create Agent without MCP config
    const agent = gs.createAgent() as Agent;

    // VERIFY: getMcpHandler() still returns instance
    const handler = agent.getMcpHandler();
    expect(handler).toBeInstanceOf(gs.MCPHandler);
  });

  it('should allow custom tool registration on handler', async () => {
    // SETUP: Create Agent
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    // EXECUTE: Register custom server and tools
    handler.registerServer({
      name: 'custom',
      transport: 'inprocess',
      tools: [createMockTool('custom_tool', 'Custom tool')],
    });

    const executor = createMockExecutor({ result: 'custom' });
    handler.registerToolExecutor('custom', 'custom_tool', executor);

    // VERIFY: Custom tools are accessible
    expect(handler.hasTool('custom__custom_tool')).toBe(true);
    const tools = handler.getTools();
    expect(tools.some(t => t.name === 'custom__custom_tool')).toBe(true);
  });

  it('should merge custom tools with configured MCPs', async () => {
    // SETUP: Create Agent with configured MCP
    const configuredServer: MCPServer = {
      name: 'configured',
      transport: 'inprocess',
      tools: [createMockTool('config_tool', 'Configured tool')],
    };

    const agent = gs.createAgent({
      mcps: [configuredServer],
    }) as Agent;
    const handler = agent.getMcpHandler();

    // EXECUTE: Register additional custom tools
    handler.registerServer({
      name: 'custom',
      transport: 'inprocess',
      tools: [createMockTool('custom_tool', 'Custom tool')],
    });

    // VERIFY: Both configured and custom tools are present
    const tools = handler.getTools();
    const toolNames = tools.map(t => t.name);

    expect(toolNames).toContain('configured__config_tool');
    expect(toolNames).toContain('custom__custom_tool');
  });

  it('should execute custom tools via executeTool()', async () => {
    // SETUP: Create Agent and register custom tool
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    handler.registerServer({
      name: 'calc',
      transport: 'inprocess',
      tools: [
        {
          name: 'add',
          description: 'Add two numbers',
          input_schema: {
            type: 'object',
            properties: {
              a: { type: 'number' },
              b: { type: 'number' },
            },
            required: ['a', 'b'],
          },
        },
      ],
    });

    const executor = (async (input: unknown) => {
      const { a, b } = input as { a: number; b: number };
      return { result: a + b };
    }) as ToolExecutor;

    handler.registerToolExecutor('calc', 'add', executor);

    // EXECUTE: Invoke custom tool
    const result = await handler.executeTool('calc__add', { a: 5, b: 3 });

    // VERIFY: Result is correct
    const parsed = parseToolResult(result);
    expect(parsed.result).toBe(8);
  });
});
```

---

### Integration Points

```yaml
INPUT FROM P1.M1.T1.S1:
  - File: src/utils/validate-groundswell-link.ts
  - Interface: NpmLinkValidationResult
  - Critical: Groundswell must be installed via npm link
  - Usage: Import MCPHandler, Agent, Tool types from 'groundswell'

INPUT FROM P1.M1.T2.S1:
  - File: tests/integration/groundswell/workflow.test.ts
  - Critical: Workflow lifecycle validation precedes MCP tests
  - Usage: Confirms Groundswell basic functionality works

INPUT FROM P1.M1.T2.S2:
  - File: tests/integration/groundswell/agent-prompt.test.ts
  - Critical: Agent.getMcpHandler() access is verified
  - Interface: Agent, AgentConfig, MCPHandler
  - Usage: Pattern for creating Agent and accessing MCPHandler

OUTPUT FOR P1.M2 (Environment Configuration):
  - Confirmation: MCP tool registration works correctly
  - Enables: Custom tool extensions for Agent operations
  - Pattern: registerToolExecutor() for dynamic tool registration

DIRECTORY STRUCTURE:
  - Create: tests/integration/groundswell/mcp.test.ts (new test file)
  - Location: Integration test directory
  - Reason: Tests real Groundswell MCP registration behavior

MOCK INTEGRATION:
  - Mock: @anthropic-ai/sdk to prevent API calls
  - Pattern: Module-level vi.mock() before imports
  - Cleanup: vi.clearAllMocks() in beforeEach
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating tests/integration/groundswell/mcp.test.ts
# Check TypeScript compilation
npx tsc --noEmit tests/integration/groundswell/mcp.test.ts

# Expected: No type errors

# Format check
npx prettier --check "tests/integration/groundswell/mcp.test.ts"

# Expected: No formatting issues

# Linting
npx eslint tests/integration/groundswell/mcp.test.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the MCP registration test file
npm test -- tests/integration/groundswell/mcp.test.ts

# Expected: All MCP registration tests pass

# Run with coverage
npm run test:coverage -- tests/integration/groundswell/mcp.test.ts

# Expected: High coverage of MCP registration functionality

# Run specific test categories
npm test -- -t "Server registration"
npm test -- -t "Tool executor registration"
npm test -- -t "Anthropic format"
npm test -- -t "hasTool"
npm test -- -t "Executor invocation"
npm test -- -t "getMcpHandler"

# Expected: All category tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test S1/S2/S3 dependencies
npm test -- tests/unit/groundswell/imports.test.ts
npm test -- tests/integration/groundswell/workflow.test.ts
npm test -- tests/integration/groundswell/agent-prompt.test.ts

# Expected: All prerequisite tests pass

# Test MCP registration functionality
npm test -- tests/integration/groundswell/mcp.test.ts

# Expected: All MCP registration tests pass

# Verify tool naming pattern
npm test -- -t "server__tool naming"

# Expected: Tool naming pattern is enforced

# Verify executor invocation
npm test -- -t "executor invocation"

# Expected: Executors are invoked correctly with async/await
```

### Level 4: Domain-Specific Validation

```bash
# MCP Server Registration Validation
# Test 1: Verify registerServer() works
npm test -- -t "Server registration"

# Expected: Servers are registered with inprocess transport

# Tool Executor Registration Validation
# Test 2: Verify registerToolExecutor() works
npm test -- -t "Tool executor registration"

# Expected: Executors are registered and accessible

# Anthropic Format Validation
# Test 3: Verify getTools() returns Anthropic format
npm test -- -t "Anthropic format"

# Expected: Tools match Anthropic API specification

# Tool Identification Validation
# Test 4: Verify hasTool() works correctly
npm test -- -t "hasTool"

# Expected: Tool identification works with server__tool naming

# Executor Invocation Validation
# Test 5: Verify executeTool() invokes executors
npm test -- -t "Executor invocation"

# Expected: Executors receive input and return results correctly

# Agent Integration Validation
# Test 6: Verify getMcpHandler() integration
npm test -- -t "getMcpHandler"

# Expected: Agent.getMcpHandler() returns MCPHandler instance
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/integration/groundswell/mcp.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npx eslint tests/integration/groundswell/mcp.test.ts`
- [ ] No formatting issues: `npx prettier --check "tests/integration/groundswell/mcp.test.ts"`
- [ ] @anthropic-ai/sdk mock prevents actual API calls
- [ ] MCP registration works correctly
- [ ] Tool naming pattern (server\_\_tool) is enforced

### Feature Validation

- [ ] Test 1: MCP server registration with inprocess transport works
- [ ] Test 2: Custom tool executor registration works
- [ ] Test 3: getTools() returns Anthropic format with server\_\_tool naming
- [ ] Test 4: hasTool() correctly identifies registered tools
- [ ] Test 5: Custom tool executor invocation works with async/await
- [ ] Test 6: Agent.getMcpHandler() integration works
- [ ] Tool schema structure matches Anthropic API spec
- [ ] Executor receives input parameters correctly
- [ ] Executor return value is returned correctly

### Code Quality Validation

- [ ] Follows existing test patterns from tests/unit/tools/
- [ ] File placement matches desired codebase tree structure
- [ ] File naming follows convention (mcp.test.ts)
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
- ❌ **Don't use sync functions for executors** - Must be async functions
- ❌ **Don't forget type assertion for ToolExecutor** - Use as ToolExecutor
- ❌ **Don't test with partial tool names** - hasTool() requires full server\_\_tool name
- ❌ **Don't forget .js extensions** - ESM requires .js in relative imports
- ❌ **Don't use sync expectations for async operations** - Use await
- ❌ **Don't assume tool naming** - Always use server\_\_tool pattern
- ❌ **Don't test registerServer() after Agent creation** - Design limitation
- ❌ **Don't forget to parse ToolResult content** - Content is JSON string
- ❌ **Don't ignore input_schema structure** - Must match JSON Schema
- ❌ **Don't skip Anthropic format validation** - API compliance required
- ❌ **Don't test hasTool() case insensitivity** - Tool names are case-sensitive
- ❌ **Don't forget async/await for executor calls** - Executors are async

---

## Appendix: Decision Rationale

### Why test MCP tool registration separately?

MCP tool registration is a distinct feature from Agent/Prompt creation:

- **MCPHandler**: Manages server connections and tool execution
- **Registration Pattern**: registerServer() and registerToolExecutor() are unique to MCP
- **Tool Naming**: server\_\_tool pattern is specific to MCP integration
- **Anthropic Format**: Tools must match specific API format

Testing MCP registration separately ensures each component works correctly before testing their integration with Agent operations.

### Why use inprocess transport for testing?

The inprocess transport is ideal for testing because:

- No external process spawning required
- Simpler to mock and control
- Faster test execution
- More reliable test results
- Tests focus on registration logic, not transport layer

### Why test both getTools() and hasTool()?

These methods serve different purposes:

- **getTools()**: Returns all tools for Agent configuration
- **hasTool()**: Checks if specific tool exists for routing
- Testing both ensures complete MCPHandler functionality

### Why validate Anthropic format compliance?

Anthropic format compliance is critical because:

- Tools are passed to Anthropic API
- Format mismatch causes API errors
- Schema structure affects tool invocation
- Ensures seamless integration with Claude

### Why test executor invocation with async/await?

Executor functions are inherently async because:

- Tool operations may involve I/O
- External API calls are async
- File operations are async
- Testing async behavior ensures real-world compatibility

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from previous PRPs (S1, S2, S3, P1.M1.T2.S1, P1.M1.T2.S2)
- [x] Comprehensive Groundswell MCPHandler API documented
- [x] MCPServer and Tool interfaces documented
- [x] Existing MCP test patterns analyzed and documented
- [x] External research from Groundswell source completed
- [x] All file paths and patterns specified
- [x] Mock patterns for @anthropic-ai/sdk identified
- [x] Tool naming pattern (server\_\_tool) documented
- [x] Anthropic format specification documented
- [x] 100% coverage requirement understood

**Risk Mitigation**:

- S1/S2/S3 dependency checks prevent wasted time on missing/incompatible Groundswell
- Mock pattern prevents accidental API calls
- Comprehensive test coverage catches edge cases
- Clear test names and structure for maintainability
- Follows existing codebase patterns for consistency

**Known Risks**:

- Groundswell version discrepancy (npm: 0.0.1, source: 0.0.3) - mitigated by version checks
- MCPHandler APIs are stable across versions
- Tool naming pattern is well-established in codebase
- Anthropic format is stable specification

---

**END OF PRP**
