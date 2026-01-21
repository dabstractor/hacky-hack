# Groundswell Framework MCP Integration and Testing Patterns

**Research Date:** 2026-01-20
**Purpose:** Comprehensive analysis of Groundswell framework MCP integration, tool registration patterns, and testing methodologies

---

## Table of Contents

1. [Groundswell MCP Architecture Overview](#1-groundswell-mcp-architecture-overview)
2. [MCP Tool Registration Mechanisms](#2-mcp-tool-registration-mechanisms)
3. [MCPServer Interface and MCPHandler Class](#3-mcpserver-interface-and-mcpclass-handler)
4. [Testing Patterns for Groundswell MCP Tools](#4-testing-patterns-for-groundswell-mcp-tools)
5. [Integration Testing Patterns](#5-integration-testing-patterns)
6. [Best Practices for Mocking MCPHandler](#6-best-practices-for-mocking-mcp-class-handler)
7. [Code Examples and Patterns](#7-code-examples-and-patterns)
8. [Research Findings](#8-research-findings)

---

## 1. Groundswell MCP Architecture Overview

### 1.1 Core Concepts

Groundswell uses a sophisticated MCP (Model Context Protocol) integration pattern that differs from the standard FastMCP approach:

**Key Differences:**
- **Not using FastMCP**: This codebase uses Groundswell's custom MCPHandler implementation
- **In-process transport**: Uses 'inprocess' transport type for local tool execution
- **Server-based registration**: Tools are registered through MCPServer interface
- **Type-safe executor pattern**: Strong typing with ToolExecutor functions

### 1.2 MCP Tool Architecture

```typescript
// MCP Tool Architecture Flow
Agent Creation → MCPServer Registration → Tool Schema Definition → Executor Registration → Tool Execution
```

---

## 2. MCP Tool Registration Mechanisms

### 2.1 Singleton MCP Server Instances

**Pattern:** One instance of each MCP server shared across all agents

```typescript
// /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();

const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP];
```

**Benefits:**
- Avoids redundant server registration
- Reduces memory overhead
- Ensures consistent tool availability across agents

### 2.2 Tool Registration in Constructor

**Pattern:** MCP servers register their tools in the constructor via MCPHandler

```typescript
// /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts
export class FilesystemMCP extends MCPHandler {
  public readonly name = 'filesystem';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [
    fileReadTool,
    fileWriteTool,
    globFilesTool,
    grepSearchTool,
  ];

  constructor() {
    super();

    // Register server in constructor
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // Register tool executors
    this.registerToolExecutor(
      'filesystem',
      'file_read',
      readFile as ToolExecutor
    );
    // ... more executors
  }
}
```

---

## 3. MCPServer Interface and MCPHandler Class

### 3.1 MCPServer Interface Requirements

```typescript
interface MCPServer {
  name: string;
  transport: 'inprocess' | 'stdio' | 'http';
  tools: Tool[];
}
```

### 3.2 MCPHandler Class Structure

**Key Methods and Properties:**

```typescript
// /home/dustin/projects/hacky-hack/tests/integration/groundswell/mcp.test.ts
class MCPHandler {
  // Core registration methods
  registerServer(server: MCPServer): void;
  registerToolExecutor(serverName: string, toolName: string, executor: ToolExecutor): void;

  // Tool discovery and execution
  getTools(): Tool[];  // Returns Anthropic format tools
  hasTool(toolName: string): boolean;
  executeTool(toolName: string, input: unknown): Promise<ToolResult>;

  // Handler access
  getMcpHandler(): MCPHandler;
}
```

### 3.3 Tool Naming Convention

**Pattern:** `server__tool` naming for all registered tools

```typescript
// Examples from tests:
'test-server__test_tool'
'multi__tool1'
'server1__tool_a'
'filesystem__file_read'
'git__git_status'
'bash__execute_bash'
```

**Enforcement:** Groundswell automatically prefixes tool names with the server name

---

## 4. Testing Patterns for Groundswell MCP Tools

### 4.1 Unit Testing Pattern with Mocking

**File:** `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts`

**Key Mocking Strategies:**

```typescript
// Mock node:fs/promises to avoid actual file operations
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

// Mock fast-glob to avoid actual filesystem globbing
vi.mock('fast-glob', () => ({
  default: vi.fn(),
}));

// Mock specific implementations
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockFastGlob = vi.mocked(fg);
```

**Test Structure:**

1. **Schema Validation Tests**
   - Verify tool name, description
   - Check required properties
   - Validate input schema structure

2. **Executor Function Tests**
   - Successful operations with various inputs
   - Error handling (ENOENT, EACCES, etc.)
   - Edge cases and boundary conditions

3. **Integration Tests**
   - Verify tool execution through MCPHandler
   - Test tool result parsing
   - Validate error propagation

### 4.2 Mock Helper Functions

**Pattern:** Create reusable mock factories

```typescript
// /home/dustin/projects/hacky-hack/tests/integration/groundswell/mcp.test.ts
function createMockTool(name: string, description: string): Tool {
  return {
    name,
    description,
    input_schema: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'Input value' },
        count: { type: 'number', description: 'Optional count' },
      },
      required: ['value'],
    },
  };
}

function createMockExecutor(result: unknown): ToolExecutor {
  return (async (_input: unknown) => {
    return result;
  }) as ToolExecutor;
}
```

---

## 5. Integration Testing Patterns

### 5.1 Agent Configuration with MCP Tools

**File:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

**Agent Creation Pattern:**

```typescript
export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,
    mcps: MCP_TOOLS,  // Inject MCP servers
  };
  return createAgent(config);
}
```

### 5.2 MCP Registration Test Suite

**File:** `/home/dustin/projects/hacky-hack/tests/integration/groundswell/mcp.test.ts`

**Test Categories:**

1. **MCP Server Registration via AgentConfig**
   - Single server registration
   - Multiple tools from same server
   - Multiple servers

2. **Custom Tool Executor Registration**
   - Post-creation registration
   - Dynamic tool addition

3. **getTools() Anthropic Format Validation**
   - Tool format compliance
   - Server__tool naming pattern
   - Required array validation

4. **hasTool() Tool Identification**
   - Full name recognition
   - Case sensitivity
   - Non-existent tool handling

5. **Custom Tool Executor Invocation**
   - Input parameter passing
   - Async operation handling
   - Error propagation

### 5.3 Test Mock Setup Pattern

**Critical Pattern:** Mock setup must be at module level for hoisting

```typescript
// /home/dustin/projects/hacky-hack/tests/integration/groundswell/mcp.test.ts
// =============================================================================
// MOCK SETUP PATTERN - Must be at top level for hoisting
// =============================================================================

vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// Dynamic imports after mocks are established
async function loadGroundswell() {
  return await import('groundswell');
}
```

---

## 6. Best Practices for Mocking MCPHandler

### 6.1 Mock Groundswell, Not Agent Factory

**Pattern:** Mock the dependency, not the consumer

```typescript
// WRONG: Don't mock the factory
vi.mock('../../src/agents/agent-factory', () => ({
  createArchitectAgent: vi.fn(),
}));

// RIGHT: Mock Groundswell which the factory calls
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});
```

### 6.2 Dynamic Import Pattern

**Pattern:** Load modules after mocks are established

```typescript
async function loadGroundswell() {
  return await import('groundswell');
}

beforeAll(async () => {
  gs = await loadGroundswell();
});
```

### 6.3 Test Result Parsing

**Pattern:** Parse tool results consistently

```typescript
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
```

---

## 7. Code Examples and Patterns

### 7.1 Complete MCP Tool Implementation

**File:** `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts`

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// Tool schema definition
const gitStatusTool: Tool = {
  name: 'git_status',
  description: 'Get git repository status',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to git repository',
      },
    },
  },
};

// Tool executor implementation
async function gitStatus(input: GitStatusInput): Promise<GitStatusResult> {
  try {
    const safePath = await validateRepositoryPath(input.path);
    const git = simpleGit(safePath);
    const status = await git.status();

    return {
      success: true,
      branch: status.current,
      staged: status.files
        .filter(f => f.index !== ' ')
        .map(f => f.path),
      modified: status.files
        .filter(f => f.working_dir !== ' ')
        .map(f => f.path),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// MCP Server class
export class GitMCP extends MCPHandler {
  public readonly name = 'git';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [gitStatusTool, gitDiffTool, gitAddTool, gitCommitTool];

  constructor() {
    super();

    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    this.registerToolExecutor('git', 'git_status', gitStatus as ToolExecutor);
    // ... register other executors
  }
}
```

### 7.2 Tool Verification Patterns

**Pattern:** Verify tool registration and execution

```typescript
// Verify tool registration
expect(handler.hasTool('git__git_status')).toBe(true);

// Verify tools format
const tools = handler.getTools();
expect(tools[0].name).toBe('git__git_status');
expect(tools[0].input_schema.type).toBe('object');

// Verify tool execution
const result = await handler.executeTool('git__git_status', { path: '.' });
const parsed = parseToolResult(result);
expect(parsed.success).toBe(true);
```

---

## 8. Research Findings

### 8.1 Key Insights

1. **Groundswell vs FastMCP**: This project uses Groundswell's custom MCPHandler implementation rather than the standard FastMCP library, providing more control over tool registration.

2. **Singleton Pattern**: MCP server instances are created as singletons and shared across all agents, ensuring efficiency and consistency.

3. **In-process Transport**: All MCP tools use 'inprocess' transport, meaning they execute locally within the same Node.js process.

4. **Strong Typing**: Groundswell enforces strong typing with TypeScript interfaces for tool schemas and executors.

5. **Comprehensive Testing**: The codebase has extensive testing patterns including unit tests with mocking, integration tests, and verification tests.

### 8.2 Testing Architecture

**Three-tier Testing Approach:**

1. **Unit Tests**: Mock external dependencies (fs, git, etc.), test individual functions
2. **Integration Tests**: Test MCP handler registration and execution with mock agents
3. **Agent Tests**: Test complete agent behavior with MCP tools integrated

### 8.3 Error Handling Patterns

**Consistent Error Structure:**
```typescript
interface Result {
  success: boolean;
  error?: string;
  // ... result-specific properties
}
```

**Error Handling Best Practices:**
- Always wrap in try-catch blocks
- Return structured error objects
- Handle specific error codes (ENOENT, EACCES)
- Validate inputs before execution

### 8.4 Security Patterns

**Path Validation:**
```typescript
const safePath = resolve(path);
if (!existsSync(safePath)) {
  throw new Error(`Path not found: ${path}`);
}
```

**Command Injection Prevention:**
```typescript
// Use argument arrays, not shell interpretation
spawn(executable, commandArgs, { shell: false });
```

### 8.5 Performance Considerations

- **Lazy Loading**: Tools are only registered when servers are instantiated
- **Singleton Pattern**: Prevents duplicate server instances
- **Efficient Mocking**: Mock external dependencies to avoid expensive operations
- **Caching**: Built-in response caching for agent configurations

---

## URLs and References

### Official Documentation

- **MCP Specification**: https://spec.modelcontextprotocol.io/specification/
- **MCP Tools Documentation**: https://spec.modelcontextprotocol.io/specification/tools/
- **MCP Server Guide**: https://spec.modelcontextprotocol.io/specification/server/
- **MCP TypeScript SDK**: https://modelcontextprotocol.io/docs/tools/creating-tools

### Groundswell Framework

- **Groundswell Repository**: https://github.com/groundswell-ai/groundswell
- **Local Groundswell Path**: `~/projects/groundswell`
- **Project Agent Factory**: `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`
- **Project MCP Tools**: `/home/dustin/projects/hacky-hack/src/tools/`

### Testing Examples

- **MCP Integration Tests**: `/home/dustin/projects/hacky-hack/tests/integration/groundswell/mcp.test.ts`
- **Filesystem MCP Tests**: `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts`
- **Agent Factory Tests**: `/home/dustin/projects/hacky-hack/tests/unit/agents/agent-factory.test.ts`
- **Researcher Agent Tests**: `/home/dustin/projects/hacky-hack/tests/integration/researcher-agent.test.ts`

### Research Documentation

- **MCP Patterns Research**: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S3/research/mcp-patterns-research.md`
- **Git MCP Research**: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S2/research/git-mcp-examples-research.md`
- **Filesystem MCP Research**: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S2/research/filesystem-mcp-research-summary.md`

---

This comprehensive research provides detailed insights into Groundswell's MCP integration patterns, testing methodologies, and best practices for building robust MCP tools with proper error handling, security considerations, and efficient testing strategies.