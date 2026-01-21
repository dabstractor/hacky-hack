# Agent Tool Testing Patterns: Integration Testing for Agent Tool Access and Execution

## Executive Summary

This research document explores comprehensive patterns for testing agent tool access and execution, focusing on integration testing methodologies that verify agent-tool communication, mock implementations, and verification strategies. The patterns are drawn from both existing codebase implementations and general testing best practices.

## Table of Contents

1. [Agent Testing Framework Overview](#agent-testing-framework-overview)
2. [Testing Agent.tool() Method Calls](#testing-agenttool-method-calls)
3. [Mocking Agent Tool Invocations](#mocking-agent-tool-invocations)
4. [MCP Tool Execution Testing Patterns](#mcp-tool-execution-testing-patterns)
5. [Agent-Tool Communication Integration Tests](#agent-tool-communication-integration-tests)
6. [Best Practices and Patterns](#best-practices-and-patterns)
7. [Implementation Examples](#implementation-examples)
8. [Testing Framework Recommendations](#testing-framework-recommendations)

---

## Agent Testing Framework Overview

### Key Testing Principles

1. **Isolation**: Mock external dependencies to prevent real API calls
2. **Determinism**: Use predictable mock responses for reproducible tests
3. **Comprehensive Coverage**: Test both success and error scenarios
4. **Integration Testing**: Verify end-to-end agent-tool workflows
5. **Mock Verification**: Ensure mocks are called with correct parameters

### Testing Patterns from Codebase

#### Pattern 1: Top-Level Module Mocking

```typescript
// Must be at top level for hoisting (vi.mock requires hoisting)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});
```

#### Pattern 2: Agent Factory Testing

```typescript
// Import after mocking
import { createAgent, createPrompt } from 'groundswell';

// Setup mock return values
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);
```

#### Pattern 3: Environment Variable Stubs

```typescript
// Stub environment variables for each test
vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
```

---

## Testing Agent.tool() Method Calls

### Direct Method Testing Patterns

#### 1. Basic Agent.tool() Mocking

```typescript
test('agent.tool() executes correctly', () => {
  // Mock the tool method directly
  const mockTool = vi
    .fn()
    .mockResolvedValue({ success: true, data: 'mocked result' });

  // Replace the method on the agent instance
  agent.tool = mockTool;

  // Execute and verify
  return agent.tool({ input: 'test' }).then(result => {
    expect(mockTool).toHaveBeenCalledWith({ input: 'test' });
    expect(result).toEqual({ success: true, data: 'mocked result' });
  });
});
```

#### 2. Spy-based Testing

```typescript
test('tool method with spy verification', () => {
  const spy = vi.spyOn(agent, 'tool');
  spy.mockResolvedValue({ success: true });

  expect(agent.tool({ input: 'test' })).resolves.toEqual({ success: true });

  // Verify spy was called
  expect(spy).toHaveBeenCalledWith({ input: 'test' });
});
```

#### 3. Async/Await Pattern

```typescript
test('async tool method testing', async () => {
  const mockTool = vi.fn();
  agent.tool = mockTool;
  mockTool.mockResolvedValue('async result');

  const result = await agent.tool({ input: 'test' });
  expect(result).toBe('async result');
  expect(mockTool).toHaveBeenCalledWith({ input: 'test' });
});
```

#### 4. Parameter Validation Testing

```typescript
test('tool method validates parameters', () => {
  const mockTool = vi.fn();
  agent.tool = mockTool;

  mockTool.mockImplementation(params => {
    if (!params.input) {
      throw new Error('Missing input parameter');
    }
    return Promise.resolve({ success: true });
  });

  // Test valid input
  expect(agent.tool({ input: 'test' })).resolves.toEqual({ success: true });

  // Test invalid input
  expect(agent.tool({})).rejects.toThrow('Missing input parameter');
});
```

---

## Mocking Agent Tool Invocations

### Mock Module Patterns

#### 1. Mock Module with Implementation

```typescript
// test/agent.test.js
vi.mock('./agent', async () => {
  const actual = await vi.importActual('./agent');
  return {
    ...actual,
    agent: {
      ...actual.agent,
      tool: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});
```

#### 2. Factory Function for Mock Agents

```typescript
// Factory function for creating mock agents
const createMockAgent = () => ({
  prompt: vi.fn(),
  tool: vi.fn().mockResolvedValue({ success: true }),
});

// Usage in tests
const mockAgent = createMockAgent();
mockAgent.tool.mockResolvedValue({ data: 'test result' });
```

#### 3. Conditional Mocking

```typescript
test('conditional tool mocking based on input', () => {
  const mockTool = vi.fn();
  agent.tool = mockTool;

  // Different responses based on input
  mockTool.mockImplementation(params => {
    if (params.action === 'create') {
      return Promise.resolve({ id: 'new-123', created: true });
    } else if (params.action === 'update') {
      return Promise.resolve({ updated: true });
    }
    return Promise.reject(new Error('Unknown action'));
  });

  // Test different scenarios
  expect(agent.tool({ action: 'create' })).resolves.toContain('new-123');
  expect(agent.tool({ action: 'update' })).resolves.toEqual({ updated: true });
  expect(agent.tool({ action: 'delete' })).rejects.toThrow('Unknown action');
});
```

### Mock Data Patterns

#### 1. Test Fixtures

```typescript
// Reusable test fixtures
const mockToolResults = {
  success: { success: true, data: 'operation completed' },
  error: { success: false, error: 'Operation failed' },
  validation: { valid: true, score: 95 },
};

// Usage
agent.tool.mockResolvedValue(mockToolResults.success);
```

#### 2. Dynamic Mock Responses

```typescript
test('dynamic mock responses', () => {
  const mockTool = vi.fn();
  agent.tool = mockTool;

  // Return different values based on call count
  mockTool.mockImplementation(() => {
    const callCount = mockTool.mock.calls.length;
    return Promise.resolve({
      callNumber: callCount,
      timestamp: Date.now(),
      data: `Response ${callCount}`,
    });
  });

  // Each call returns different data
  const result1 = await agent.tool({});
  const result2 = await agent.tool({});

  expect(result1.callNumber).toBe(1);
  expect(result2.callNumber).toBe(2);
});
```

---

## MCP Tool Execution Testing Patterns

### MCP Server Registration Testing

#### 1. Server Registration Verification

```typescript
test('should create Agent with inprocess MCP server', async () => {
  // Setup MCP server
  const testServer: MCPServer = {
    name: 'test-server',
    transport: 'inprocess',
    tools: [createMockTool('test_tool', 'A test tool')],
  };

  // Create agent with MCP config
  const agent = gs.createAgent({
    mcps: [testServer],
  }) as Agent;

  // Verify MCP handler exists
  const handler = agent.getMcpHandler();
  expect(handler).toBeInstanceOf(gs.MCPHandler);

  // Verify tools are registered with server__tool naming
  const tools = handler.getTools();
  expect(tools).toHaveLength(1);
  expect(tools[0].name).toBe('test-server__test_tool');
});
```

#### 2. Tool Executor Registration

```typescript
test('should register custom tool executor via getMcpHandler()', async () => {
  const agent = gs.createAgent() as Agent;
  const handler = agent.getMcpHandler();

  // Register server first
  handler.registerServer({
    name: 'custom',
    transport: 'inprocess',
    tools: [createMockTool('my_tool', 'Custom tool')],
  });

  // Register custom executor
  const executor = createMockExecutor({ success: true, result: 'executed' });
  handler.registerToolExecutor('custom', 'my_tool', executor);

  // Verify tool is registered
  expect(handler.hasTool('custom__my_tool')).toBe(true);
});
```

### Tool Execution Patterns

#### 1. Tool Invocation Testing

```typescript
test('should invoke executor with input parameters', async () => {
  const agent = gs.createAgent() as Agent;
  const handler = agent.getMcpHandler();

  // Setup tool and executor
  handler.registerServer({
    name: 'echo',
    transport: 'inprocess',
    tools: [createMockTool('echo_tool', 'Echo input')],
  });

  let receivedInput: unknown;
  const executor = (async (input: unknown) => {
    receivedInput = input;
    return { success: true, echoed: input };
  }) as ToolExecutor;

  handler.registerToolExecutor('echo', 'echo_tool', executor);

  // Execute tool
  const testInput = { value: 'hello', count: 42 };
  const result = await handler.executeTool('echo__echo_tool', testInput);

  // Verify execution
  expect(receivedInput).toEqual(testInput);
  const parsed = parseToolResult(result);
  expect(parsed.success).toBe(true);
  expect(parsed.echoed).toEqual(testInput);
});
```

#### 2. Async Tool Execution

```typescript
test('should handle async executor operations', async () => {
  const agent = gs.createAgent() as Agent;
  const handler = agent.getMcpHandler();

  // Create async executor
  const executor = (async (_input: unknown) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return { success: true, processed: true };
  }) as ToolExecutor;

  handler.registerToolExecutor('async', 'async_tool', executor);

  // Execute with await
  const result = await handler.executeTool('async__async_tool', {
    value: 'test',
  });

  // Verify async completion
  const parsed = parseToolResult(result);
  expect(parsed.success).toBe(true);
  expect(parsed.processed).toBe(true);
});
```

#### 3. Error Handling in Tools

```typescript
test('should handle executor errors gracefully', async () => {
  const agent = gs.createAgent() as Agent;
  const handler = agent.getMcpHandler();

  // Create executor that throws
  const executor = (async () => {
    throw new Error('Executor failed');
  }) as ToolExecutor;

  handler.registerToolExecutor('error', 'error_tool', executor);

  // Execute tool
  const result = await handler.executeTool('error__error_tool', {
    value: 'test',
  });

  // Verify error is captured
  expect(result.is_error).toBe(true);
  expect(result.content).toContain('Executor failed');
});
```

---

## Agent-Tool Communication Integration Tests

### End-to-End Workflow Testing

#### 1. Complete Agent Tool Workflow

```typescript
test('complete agent tool workflow', async () => {
  // Setup
  const agent = createArchitectAgent();
  const prompt = createArchitectPrompt(prdContent);

  // Mock tool responses
  agent.tool = vi
    .fn()
    .mockResolvedValueOnce({ success: true, phase: 'created' })
    .mockResolvedValueOnce({ success: true, milestone: 'created' })
    .mockResolvedValueOnce({ success: true, task: 'created' });

  // Execute workflow
  const result = await agent.prompt(prompt);

  // Verify all tools were called
  expect(agent.tool).toHaveBeenCalledTimes(3);
  expect(result).toHaveProperty('backlog');
  expect(result.backlog).toHaveLength(1);
});
```

#### 2. Multi-Tool Communication Pattern

```typescript
test('multi-tool communication pattern', async () => {
  const mockTools = {
    create: vi.fn().mockResolvedValue({ id: '123', created: true }),
    validate: vi.fn().mockResolvedValue({ valid: true, score: 95 }),
    deploy: vi
      .fn()
      .mockResolvedValue({ deployed: true, url: 'https://app.com' }),
  };

  // Setup agent with multiple tools
  agent.tool = vi.fn().mockImplementation(params => {
    if (params.action === 'create') return mockTools.create(params);
    if (params.action === 'validate') return mockTools.validate(params);
    if (params.action === 'deploy') return mockTools.deploy(params);
    throw new Error('Unknown action');
  });

  // Execute multi-step process
  const createResult = await agent.tool({ action: 'create', data: testData });
  const validateResult = await agent.tool({
    action: 'validate',
    id: createResult.id,
  });
  const deployResult = await agent.tool({
    action: 'deploy',
    id: createResult.id,
  });

  // Verify workflow
  expect(createResult.created).toBe(true);
  expect(validateResult.valid).toBe(true);
  expect(deployResult.deployed).toBe(true);
});
```

### State Management Testing

#### 1. Tool State Persistence

```typescript
test('tool state persistence across calls', () => {
  const toolState = new Map();

  agent.tool = vi.fn().mockImplementation(params => {
    if (params.action === 'set') {
      toolState.set(params.key, params.value);
      return Promise.resolve({ success: true });
    }

    if (params.action === 'get') {
      const value = toolState.get(params.key);
      return Promise.resolve({ success: true, value });
    }

    return Promise.reject(new Error('Unknown action'));
  });

  // Set state
  return agent
    .tool({ action: 'set', key: 'user', value: 'test' })
    .then(() => agent.tool({ action: 'get', key: 'user' }))
    .then(result => {
      expect(result.value).toBe('test');
    });
});
```

---

## Best Practices and Patterns

### Testing Guidelines

1. **Always Mock External Dependencies**
   - Prevent real API calls during tests
   - Use vi.mock for module-level mocking
   - Mock at the module boundary, not implementation details

2. **Test Both Success and Error Cases**
   - Happy path testing
   - Error propagation testing
   - Edge case handling

3. **Verify Mock Interactions**
   - Use expect().toHaveBeenCalledWith() to verify correct calls
   - Check call counts with expect().toHaveBeenCalledTimes()
   - Validate call order when necessary

4. **Use Deterministic Mocks**
   - Return predictable, consistent responses
   - Avoid randomization in test code
   - Use controlled state management

### Anti-Patterns to Avoid

1. **Don't Mock Implementation Details**

   ```typescript
   // ❌ Bad - Testing internal implementation
   vi.mock(agent.internalMethod);

   // ✅ Good - Testing public interface
   vi.mock(agent.tool);
   ```

2. **Don't Over-Mock**

   ```typescript
   // ❌ Bad - Too many mocks
   agent.tool = vi.fn().mockResolvedValue('result');
   agent.prompt = vi.fn().mockResolvedValue('response');
   agent.config = vi.fn().mockReturnValue({});

   // ✅ Good - Minimal mocking
   agent.tool = vi.fn().mockResolvedValue({ success: true });
   ```

3. **Don't Skip Cleanup**

   ```typescript
   // ❌ Bad - No cleanup
   test('test', () => {
     vi.mock(something);
   });

   // ✅ Good - Proper cleanup
   afterEach(() => {
     vi.clearAllMocks();
     vi.unstubAllEnvs();
   });
   ```

---

## Implementation Examples

### Comprehensive Agent Testing Example

```typescript
describe('Agent Tool Integration Tests', () => {
  let agent: Agent;
  const mockTools = {
    read: vi.fn(),
    write: vi.fn(),
    validate: vi.fn(),
  };

  beforeEach(() => {
    // Setup mock environment
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // Create agent
    agent = createArchitectAgent();

    // Setup tool mocks
    agent.tool = vi.fn().mockImplementation(params => {
      switch (params.action) {
        case 'read':
          return mockTools.read(params);
        case 'write':
          return mockTools.write(params);
        case 'validate':
          return mockTools.validate(params);
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('File Operations', () => {
    it('should read file using tool', async () => {
      // Setup
      mockTools.read.mockResolvedValue({
        success: true,
        content: 'File content',
        path: '/test/file.txt',
      });

      // Execute
      const result = await agent.tool({
        action: 'read',
        path: '/test/file.txt',
      });

      // Verify
      expect(result.success).toBe(true);
      expect(result.content).toBe('File content');
      expect(mockTools.read).toHaveBeenCalledWith({
        action: 'read',
        path: '/test/file.txt',
      });
    });

    it('should write file using tool', async () => {
      // Setup
      mockTools.write.mockResolvedValue({
        success: true,
        path: '/test/output.txt',
        written: 100,
      });

      // Execute
      const result = await agent.tool({
        action: 'write',
        path: '/test/output.txt',
        content: 'Test content',
      });

      // Verify
      expect(result.success).toBe(true);
      expect(result.written).toBe(100);
    });
  });

  describe('Validation Workflow', () => {
    it('should validate file after reading', async () => {
      // Setup read
      mockTools.read.mockResolvedValue({
        success: true,
        content: 'const x = 1;',
        path: '/test.js',
      });

      // Setup validation
      mockTools.validate.mockResolvedValue({
        success: true,
        valid: true,
        issues: [],
      });

      // Execute workflow
      const readResult = await agent.tool({
        action: 'read',
        path: '/test.js',
      });

      const validateResult = await agent.tool({
        action: 'validate',
        content: readResult.content,
      });

      // Verify workflow
      expect(readResult.success).toBe(true);
      expect(validateResult.success).toBe(true);
      expect(validateResult.valid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle read errors gracefully', async () => {
      // Setup error
      mockTools.read.mockResolvedValue({
        success: false,
        error: 'File not found',
      });

      // Execute
      const result = await agent.tool({
        action: 'read',
        path: '/nonexistent.txt',
      });

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should handle validation failures', async () => {
      // Setup validation failure
      mockTools.validate.mockResolvedValue({
        success: true,
        valid: false,
        issues: ['Syntax error on line 1'],
      });

      // Execute
      const result = await agent.tool({
        action: 'validate',
        content: 'invalid syntax here',
      });

      // Verify failure
      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
    });
  });
});
```

### MCP Integration Test Example

```typescript
describe('MCP Tool Integration Tests', () => {
  let gs: typeof import('groundswell');
  let agent: Agent;
  let mcpHandler: any;

  beforeAll(async () => {
    gs = await import('groundswell');
  });

  beforeEach(() => {
    // Mock Anthropic SDK
    vi.mock('@anthropic-ai/sdk', () => ({
      Anthropic: vi.fn(() => ({
        messages: {
          create: vi.fn(),
        },
      })),
    }));

    // Create agent
    agent = gs.createAgent({
      name: 'TestAgent',
      system: 'Test system prompt',
    }) as Agent;

    mcpHandler = agent.getMcpHandler();
    vi.clearAllMocks();
  });

  describe('Tool Registration', () => {
    it('should register multiple tools with same server', async () => {
      // Register server with multiple tools
      mcpHandler.registerServer({
        name: 'file-server',
        transport: 'inprocess',
        tools: [
          {
            name: 'read',
            description: 'Read file',
            input_schema: {
              type: 'object',
              properties: { path: { type: 'string' } },
              required: ['path'],
            },
          },
          {
            name: 'write',
            description: 'Write file',
            input_schema: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                content: { type: 'string' },
              },
              required: ['path', 'content'],
            },
          },
        ],
      });

      // Register executors
      mcpHandler.registerToolExecutor('file-server', 'read', async input => ({
        content: 'file content',
      }));
      mcpHandler.registerToolExecutor('file-server', 'write', async input => ({
        written: true,
      }));

      // Verify tools are registered
      expect(mcpHandler.hasTool('file-server__read')).toBe(true);
      expect(mcpHandler.hasTool('file-server__write')).toBe(true);
      expect(mcpHandler.hasTool('nonexistent__tool')).toBe(false);
    });
  });

  describe('Tool Execution', () => {
    it('should execute registered tools', async () => {
      // Setup tool
      mcpHandler.registerServer({
        name: 'test',
        transport: 'inprocess',
        tools: [
          {
            name: 'calculate',
            description: 'Calculate sum',
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

      mcpHandler.registerToolExecutor('test', 'calculate', async input => ({
        result: (input as any).a + (input as any).b,
      }));

      // Execute tool
      const result = await mcpHandler.executeTool('test__calculate', {
        a: 5,
        b: 3,
      });

      // Verify result
      expect(result.content).toBe('{"result":8}');
    });

    it('should handle tool execution errors', async () => {
      // Setup error tool
      mcpHandler.registerServer({
        name: 'error-server',
        transport: 'inprocess',
        tools: [
          {
            name: 'fail',
            description: 'Always fails',
            input_schema: { type: 'object', properties: {} },
          },
        ],
      });

      mcpHandler.registerToolExecutor('error-server', 'fail', async () => {
        throw new Error('Tool failed');
      });

      // Execute error tool
      const result = await mcpHandler.executeTool('error-server__fail', {});

      // Verify error handling
      expect(result.is_error).toBe(true);
      expect(result.content).toContain('Tool failed');
    });
  });

  describe('Tool Discovery', () => {
    it('should list all available tools', async () => {
      // Register multiple servers
      mcpHandler.registerServer({
        name: 'server1',
        transport: 'inprocess',
        tools: [
          {
            name: 'tool1',
            description: 'First tool',
            input_schema: { type: 'object', properties: {} },
          },
        ],
      });

      mcpHandler.registerServer({
        name: 'server2',
        transport: 'inprocess',
        tools: [
          {
            name: 'tool2',
            description: 'Second tool',
            input_schema: { type: 'object', properties: {} },
          },
        ],
      });

      // Get all tools
      const tools = mcpHandler.getTools();

      // Verify all tools are listed
      expect(tools).toHaveLength(2);
      expect(tools.map((t: any) => t.name)).toEqual([
        'server1__tool1',
        'server2__tool2',
      ]);
    });
  });
});
```

---

## Testing Framework Recommendations

### Tool Selection

1. **Vitest** - Recommended for this codebase
   - Native TypeScript support
   - Modern testing API
   - Excellent mocking capabilities
   - Fast execution

2. **Additional Tools to Consider**
   - `@vitest/coverage-v8` for code coverage
   - `vitest-mock-extended` for advanced mocking
   - `testcontainers` for integration testing with services

### Test Organization

```
tests/
├── unit/                 # Unit tests
│   ├── agents/
│   ├── tools/
│   └── ...
├── integration/          # Integration tests
│   ├── agents/
│   ├── tools/
│   └── workflows/
└── e2e/                 # End-to-end tests
```

### Mock Management Best Practices

1. **Use Mock Factories**

   ```typescript
   // Create reusable mock factories
   const createMockAgent = (overrides = {}) => ({
     prompt: vi.fn(),
     tool: vi.fn(),
     ...overrides,
   });
   ```

2. **Centralize Mock Setup**

   ```typescript
   // test-setup.ts
   export const setupAgentMocks = () => {
     vi.mock('groundswell', () => ({
       createAgent: vi.fn().mockReturnValue(mockAgent),
       createPrompt: vi.fn().mockReturnValue(mockPrompt),
     }));
   };
   ```

3. **Use Test Isolation**
   ```typescript
   // Always clean up after tests
   afterEach(() => {
     vi.clearAllMocks();
     vi.unstubAllEnvs();
   });
   ```

### Performance Considerations

1. **Lazy Load Mocks**

   ```typescript
   // Only import when needed
   let gs: typeof import('groundswell');

   beforeAll(async () => {
     gs = await import('groundswell');
   });
   ```

2. **Use Deterministic Timers**

   ```typescript
   // Control async operations
   vi.useFakeTimers();
   afterEach(() => {
     vi.useRealTimers();
   });
   ```

3. **Minimize Mock Complexity**
   - Keep mock implementations simple
   - Avoid complex state machines in tests
   - Use predictable return values

---

## Conclusion

Integration testing for agent tool access and execution requires a comprehensive approach that combines:

1. **Proper mocking strategies** to isolate agent behavior
2. **Verification of tool calls** to ensure correct usage
3. **Testing of MCP integration** for protocol compliance
4. **End-to-end workflow validation** for real-world scenarios
5. **Error handling verification** for robustness

The patterns and examples provided in this document can be adapted to various agent testing scenarios, ensuring comprehensive coverage of agent-tool interactions while maintaining test performance and reliability.

### Key Resources

- [Vitest Documentation](https://vitest.dev/guide/)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/specification/)
- [Anthropic Tool Use Documentation](https://docs.anthropic.com/claude/docs/tool-use)
- [Jest Mocking API](https://jestjs.io/docs/mock-function-api) (for migration reference)

---

_This research document was created based on codebase analysis and testing best practices. Patterns should be adapted to specific project requirements and testing frameworks._
