# MCP Testing Best Practices and Mocking Strategies

**Research Date:** 2026-01-20
**Purpose:** Comprehensive guide for testing MCP (Model Context Protocol) tool integration with agents
**Focus Areas:** Testing patterns, mocking strategies, and integration testing for MCP handlers

---

## Table of Contents

1. [Overview](#1-overview)
2. [Testing MCP Tool Integration with Agents](#2-testing-mcp-tool-integration-with-agents)
3. [Mocking Strategies for MCP Servers](#3-mocking-strategies-for-mcp-servers)
4. [Testing Patterns for Tool Registration](#4-testing-patterns-for-tool-registration)
5. [Best Practices for Integration Testing](#5-best-practices-for-integration-testing)
6. [Test Coverage Strategies](#6-test-coverage-strategies)
7. [Code Examples and Patterns](#7-code-examples-and-patterns)
8. [Common Testing Pitfalls](#8-common-testing-pitfalls)
9. [Resources and References](#9-resources-and-references)

---

## 1. Overview

### 1.1 MCP Testing Landscape

Testing MCP (Model Context Protocol) tools presents unique challenges due to their integration with AI agents and external systems. This research document outlines comprehensive testing strategies based on real-world implementations from the hacky-hack project and industry best practices.

### 1.2 Key Testing Challenges

1. **Integration Complexity**: MCP tools must work seamlessly with various AI agents
2. **External Dependencies**: Filesystem, git, shell commands, APIs
3. **Async Operations**: Non-blocking tool execution with proper error handling
4. **Type Safety**: Runtime type validation and schema compliance
5. **Security Constraints**: Path sanitization, permission checks, resource limits

---

## 2. Testing MCP Tool Integration with Agents

### 2.1 Agent-MCP Integration Testing

**Pattern: Test MCP handler registration with agents**

```typescript
// tests/integration/groundswell/mcp.test.ts
describe('MCP Registration: Server registration via AgentConfig', () => {
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
});
```

### 2.2 Tool Execution Through Agent

**Pattern: Test tools execute via agent's MCP handler**

```typescript
describe('MCP Registration: Custom tool executor invocation', () => {
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

    // EXECUTE: Invoke tool through handler
    const testInput = { value: 'hello', count: 42 };
    const result = await handler.executeTool('echo__echo_tool', testInput);

    // VERIFY: Executor received input and returned result
    expect(receivedInput).toEqual(testInput);
    const parsed = parseToolResult(result);
    expect(parsed.success).toBe(true);
    expect(parsed.echoed).toEqual(testInput);
  });
});
```

### 2.3 Multiple MCP Servers Integration

**Pattern: Test agent with multiple MCP servers**

```typescript
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
```

---

## 3. Mocking Strategies for MCP Servers

### 3.1 External Dependency Mocking

**Pattern: Mock node:fs for filesystem operations**

```typescript
// tests/unit/tools/filesystem-mcp.test.ts
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

import { promises as fs } from 'node:fs';
import fg from 'fast-glob';

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockMkdir = vi.mocked(fs.mkdir);
const mockFastGlob = vi.mocked(fg);
```

### 3.2 Child Process Mocking for Shell Commands

**Pattern: Mock spawn for bash command execution**

```typescript
// Helper to create realistic ChildProcess mock
function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

// Usage in tests
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

const { spawn } = await import('node:child_process');
const mockSpawn = vi.mocked(spawn);
```

### 3.3 Git Operations Mocking

**Pattern: Mock simple-git library**

```typescript
// Mock simple-git to avoid actual git operations
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));

// Mock instance with all methods
const mockGitInstance = {
  status: vi.fn(),
  diff: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
};
```

### 3.4 Anthropic SDK Mocking

**Pattern: Mock AI SDK to prevent API calls**

```typescript
// Mock Anthropic SDK to prevent accidental API calls
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));
```

---

## 4. Testing Patterns for Tool Registration

### 4.1 Tool Schema Validation

**Pattern: Test tool schema structure and validation**

```typescript
describe('gitTool schema', () => {
  it('should have correct tool name', () => {
    expect(gitStatusTool.name).toBe('git_status');
  });

  it('should have description', () => {
    expect(gitStatusTool.description).toContain('Get git repository status');
  });

  it('should require path property in input schema', () => {
    expect(gitStatusTool.input_schema.required).toContain('path');
  });

  it('should have path property defined', () => {
    expect(gitStatusTool.input_schema.properties.path).toEqual({
      type: 'string',
      description: 'Path to git repository (optional, defaults to current directory)',
    });
  });
});
```

### 4.2 Tool Executor Registration

**Pattern: Verify tool executor registration**

```typescript
describe('FilesystemMCP class', () => {
  it('should register four tool executors', () => {
    // EXECUTE
    const fsMCP = new FilesystemMCP();

    // VERIFY - tool is registered via MCPHandler
    // (Cannot directly inspect registration without exposing internals)
    expect(fsMCP).toBeDefined();
  });
});
```

### 4.3 Multiple Tools Registration

**Pattern: Test all tools in a server**

```typescript
describe('FilesystemMCP tool schemas', () => {
  it('should register file_read tool', () => {
    expect(fileReadTool.name).toBe('file_read');
    expect(fileReadTool.input_schema.properties.path).toBeDefined();
  });

  it('should register file_write tool', () => {
    expect(fileWriteTool.name).toBe('file_write');
    expect(fileWriteTool.input_schema.properties.content).toBeDefined();
  });

  it('should register glob_files tool', () => {
    expect(globFilesTool.name).toBe('glob_files');
    expect(globFilesTool.input_schema.properties.pattern).toBeDefined();
  });

  it('should register grep_search tool', () => {
    expect(grepSearchTool.name).toBe('grep_search');
    expect(grepSearchTool.input_schema.properties.pattern).toBeDefined();
  });
});
```

---

## 5. Best Practices for Integration Testing

### 5.1 Three Testing Levels

**Level 1: Unit Tests**
- Test individual tool executors in isolation
- Mock all external dependencies
- Focus on business logic

**Level 2: Integration Tests**
- Test MCPHandler registration and tool execution
- Verify tool schemas and execution flow
- Test agent-MCP integration

**Level 3: End-to-End Tests**
- Test tools with real dependencies
- Use temporary directories and fixtures
- Verify actual behavior

### 5.2 Integration Test Pattern

```typescript
describe('Git workflow integration', () => {
  it('should execute status, add, and commit in sequence', async () => {
    // SETUP
    mockGitInstance.status.mockResolvedValue({
      current: 'main',
      files: [{ path: 'test.txt', index: ' ', working_dir: 'M' }],
      isClean: () => false,
    } as never);

    mockGitInstance.add.mockResolvedValue(undefined);
    mockGitInstance.commit.mockResolvedValue({
      commit: 'abc123',
      branch: 'main',
    } as never);

    // EXECUTE - Execute workflow
    const statusResult = await gitStatus({});
    expect(statusResult.success).toBe(true);

    const addResult = await gitAdd({ files: ['test.txt'] });
    expect(addResult.success).toBe(true);

    const commitResult = await gitCommit({ message: 'Test commit' });
    expect(commitResult.success).toBe(true);
    expect(commitResult.commitHash).toBe('abc123');

    // VERIFY - tools were called in correct order
    expect(mockGitInstance.status).toHaveBeenCalled();
    expect(mockGitInstance.add).toHaveBeenCalledWith(['--', 'test.txt']);
    expect(mockGitInstance.commit).toHaveBeenCalledWith('Test commit', [], {});
  });
});
```

### 5.3 Error Recovery Testing

**Pattern: Test graceful degradation**

```typescript
describe('error recovery', () => {
  it('should handle partial failures in multi-step operations', async () => {
    // SETUP - First call succeeds, second fails
    mockReadFile.mockResolvedValueOnce('content1' as any);
    mockReadFile.mockRejectedValueOnce(
      new Error('File not found') as NodeJS.ErrnoException
    );

    const fsMCP = new FilesystemMCP();

    // EXECUTE
    const result1 = await fsMCP.executeTool('filesystem__file_read', {
      path: './file1.txt',
    });

    const result2 = await fsMCP.executeTool('filesystem__file_read', {
      path: './file2.txt',
    });

    // VERIFY - First succeeds, second fails gracefully
    expect(result1.success).toBe(true);
    expect(result1.content).toBe('content1');

    expect(result2.success).toBe(false);
    expect(result2.error).toContain('File not found');
  });
});
```

---

## 6. Test Coverage Strategies

### 6.1 Coverage Goals

- **Statement Coverage**: 100% for tool executors
- **Branch Coverage**: 100% for error handling
- **Function Coverage**: 100% for exported functions
- **Line Coverage**: 95%+ overall

### 6.2 Coverage Testing Patterns

```typescript
describe('complete coverage', () => {
  describe('success paths', () => {
    it('should handle basic success case');
    it('should handle success with optional parameters');
    it('should handle success with default values');
  });

  describe('error paths', () => {
    it('should handle ENOENT errors');
    it('should handle EACCES errors');
    it('should handle EISDIR errors');
    it('should handle generic errors');
    it('should handle non-Error objects');
  });

  describe('edge cases', () => {
    it('should handle empty inputs');
    it('should handle special characters');
    it('should handle boundary values');
  });
});
```

### 6.3 Vitest Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'tests/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
```

---

## 7. Code Examples and Patterns

### 7.1 Complete Test Template

```typescript
/**
 * Unit tests for [Tool Name] MCP tool
 *
 * @remarks
 * Tests validate [tool functionality]
 * and achieve 100% code coverage of src/tools/[tool-name].ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock external dependencies
vi.mock('dependency', () => ({
  function: vi.fn(),
}));

import {
  ToolMCP,
  executeTool,
  toolSchema,
  type ToolInput,
} from '../../../src/tools/tool-name.js';

describe('tools/tool-name', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ToolMCP class', () => {
    it('should instantiate and register server', () => {
      const toolMCP = new ToolMCP();
      expect(toolMCP).toBeInstanceOf(ToolMCP);
    });
  });

  describe('toolSchema schema', () => {
    it('should have correct tool name', () => {
      expect(toolSchema.name).toBe('tool_name');
    });

    it('should have description', () => {
      expect(toolSchema.description).toBeDefined();
    });

    it('should require required_property in input schema', () => {
      expect(toolSchema.input_schema.required).toContain('required_property');
    });
  });

  describe('executeTool', () => {
    describe('successful operations', () => {
      it('should execute with valid input', async () => {
        // SETUP
        const input: ToolInput = {
          /* valid input */
        };
        mockFunction.mockResolvedValue('result');

        // EXECUTE
        const result = await executeTool(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('error handling', () => {
      it('should handle specific error', async () => {
        // SETUP
        const error = new Error('Specific error');
        mockFunction.mockRejectedValue(error);

        // EXECUTE
        const result = await executeTool({
          /* input */
        });

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('Specific error');
      });
    });
  });
});
```

### 7.2 Helper Functions for Testing

```typescript
/**
 * Helper to parse tool result from executeTool()
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
```

---

## 8. Common Testing Pitfalls

### 8.1 Testing Implementation Details

**Bad Practice:**
```typescript
// ❌ BAD - Tests internal implementation
it('should call spawn with specific arguments', () => {
  const bashMCP = new BashMCP();
  expect(mockSpawn).toHaveBeenCalledWith('echo', ['test']);
});
```

**Good Practice:**
```typescript
// ✅ GOOD - Tests behavior and outcomes
it('should execute command and return output', async () => {
  const result = await executeBashCommand({ command: 'echo test' });
  expect(result.success).toBe(true);
  expect(result.stdout).toBe('test');
});
```

### 8.2 Not Cleaning Up Mocks

**Bad Practice:**
```typescript
// ❌ BAD - Mocks persist between tests
describe('tests', () => {
  it('test 1', () => {
    mockReadFile.mockResolvedValue('data');
  });

  it('test 2', () => {
    // This test still has the mock from test 1!
    const result = await readFile({ path: 'test' });
  });
});
```

**Good Practice:**
```typescript
// ✅ GOOD - Clean up after each test
describe('tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    mockReadFile.mockResolvedValue('data');
  });
});
```

### 8.3 Ignoring Async Error Paths

**Bad Practice:**
```typescript
// ❌ BAD - Only tests happy path
it('should read file', async () => {
  mockReadFile.mockResolvedValue('content');
  const result = await readFile({ path: 'test.txt' });
  expect(result.success).toBe(true);
});
```

**Good Practice:**
```typescript
// ✅ GOOD - Tests both success and error paths
describe('readFile', () => {
  it('should read file successfully', async () => {
    mockReadFile.mockResolvedValue('content');
    const result = await readFile({ path: 'test.txt' });
    expect(result.success).toBe(true);
  });

  it('should handle file not found', async () => {
    const error = new Error('Not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);
    const result = await readFile({ path: 'missing.txt' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('File not found');
  });
});
```

---

## 9. Resources and References

### 9.1 Official MCP Documentation

- **Model Context Protocol Specification**: https://spec.modelcontextprotocol.io/specification/
- **Tools Guide**: https://spec.modelcontextprotocol.io/specification/tools/
- **Server Implementation**: https://spec.modelcontextprotocol.io/specification/server/
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Official Servers**: https://github.com/modelcontextprotocol/servers

### 9.2 Groundswell Framework

- **Repository**: https://github.com/groundswell-ai/groundswell
- **Local Path**: `~/projects/groundswell`
- **API Reference**: Available in project documentation

### 9.3 Testing Frameworks

- **Vitest**: https://vitest.dev/guide/
- **API Reference**: https://vitest.dev/api/
- **Coverage**: https://vitest.dev/guide/coverage.html

### 9.4 Existing Implementations in Codebase

**Source Files:**
- `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts` - Bash command execution
- `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts` - Git operations
- `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts` - File system operations

**Test Files:**
- `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts`
- `/home/dustin/projects/hacky-hack/tests/integration/groundswell/mcp.test.ts`

### 9.5 Best Practices Summary

**DO:**
1. Test tool schemas thoroughly
2. Mock external dependencies
3. Test all error code paths
4. Test edge cases explicitly
5. Clean up mocks between tests
6. Use descriptive test names
7. Group related tests with describe
8. Test behavior, not implementation
9. Achieve 100% coverage for tool executors
10. Test security constraints

**DON'T:**
1. Don't test implementation details
2. Don't leave mocks uncleared
3. Don't ignore error paths
4. Don't skip edge cases
5. Don't use type assertions to bypass validation
6. Don't over-mock
7. Don't test with incompatible types
8. Don't ignore async error handling
9. Don't skip security testing
10. Don't forget to clean up resources

---

**End of Research Document**

**Last Updated:** 2026-01-20
**Researcher:** Claude Code Agent
**For:** P1M2T2S1 - MCP Testing Best Practices Research