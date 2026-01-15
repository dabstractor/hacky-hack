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

import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import type { Agent, MCPServer, Tool, ToolExecutor } from 'groundswell';

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
  return (async (_input: unknown) => {
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
      expect(tool.name).toMatch(/^[a-z0-9]+__[a-z0-9_]+$/);
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
    const executor = (async (_input: unknown) => {
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

// =============================================================================
// OPTIONAL: Prerequisites Check
// =============================================================================

describe('MCP Registration: Prerequisites check', () => {
  it('should have valid Groundswell installation', async () => {
    // This test validates that Groundswell is properly installed
    // before running the MCP registration tests
    const gs = await loadGroundswell();

    expect(gs.Agent).toBeDefined();
    expect(gs.createAgent).toBeDefined();
    expect(gs.MCPHandler).toBeDefined();
  });
});
