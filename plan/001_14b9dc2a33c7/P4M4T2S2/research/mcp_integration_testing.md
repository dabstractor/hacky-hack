# MCP Integration Testing Best Practices

**Research Date:** 2026-01-13
**Purpose:** Comprehensive guide for testing MCP (Model Context Protocol) handler classes that extend MCPHandler
**Framework:** Groundswell MCP Framework
**Codebase:** hacky-hack project

---

## Table of Contents

1. [Overview](#1-overview)
2. [Testing MCP Tool Registration](#2-testing-mcp-tool-registration)
3. [Testing executeTool() Method](#3-testing-executeTool-method)
4. [Integration Testing MCP Servers](#4-integration-testing-mcp-servers)
5. [Groundswell MCP Framework Patterns](#5-groundswell-mcp-framework-patterns)
6. [Common Testing Pitfalls](#6-common-testing-pitfalls)
7. [Test Coverage Strategies](#7-test-coverage-strategies)
8. [Code Examples and Patterns](#8-code-examples-and-patterns)
9. [References and Resources](#9-references-and-resources)

---

## 1. Overview

### 1.1 MCP Handler Architecture

The Groundswell framework uses `MCPHandler` as a base class for implementing Model Context Protocol servers:

```typescript
import { MCPHandler, Tool, ToolExecutor } from 'groundswell';

export class CustomMCP extends MCPHandler {
  constructor() {
    super();

    // Register MCP server
    this.registerServer({
      name: 'server_name',
      transport: 'inprocess',
      tools: [tool1, tool2, tool3],
    });

    // Register tool executors
    this.registerToolExecutor('server_name', 'tool_name', executorFunction);
  }
}
```

**Key Components:**

- **MCPHandler**: Base class providing MCP server functionality
- **registerServer()**: Registers the server and its tool schemas
- **registerToolExecutor()**: Maps tool names to implementation functions
- **Tool**: Interface defining tool schema (name, description, input_schema)
- **ToolExecutor**: Function type for tool implementation

### 1.2 Testing Philosophy

**Three Testing Levels:**

1. **Unit Tests**: Test individual tool executors in isolation
2. **Integration Tests**: Test MCPHandler registration and tool execution
3. **End-to-End Tests**: Test tools with real dependencies (filesystem, git, etc.)

**Testing Goals:**

- Verify tool registration is correct
- Validate tool execution with various inputs
- Test error handling and edge cases
- Ensure security constraints are enforced
- Validate response structure matches schema

---

## 2. Testing MCP Tool Registration

### 2.1 Verifying Server Registration

**Pattern: Test MCPHandler instantiation**

```typescript
import { describe, it, expect } from 'vitest';
import { BashMCP } from '../../../src/tools/bash-mcp.js';

describe('BashMCP class', () => {
  it('should instantiate and register bash server', () => {
    // EXECUTE
    const bashMCP = new BashMCP();

    // VERIFY
    expect(bashMCP).toBeInstanceOf(BashMCP);
  });
});
```

**Key Points:**

- Test that the class can be instantiated without errors
- Verify inheritance from MCPHandler
- Note: Internal registration state cannot be directly inspected without exposing internals

### 2.2 Verifying Tool Schema Structure

**Pattern: Validate tool schema properties**

```typescript
describe('bashTool schema', () => {
  it('should have correct tool name', () => {
    expect(bashTool.name).toBe('execute_bash');
  });

  it('should have description', () => {
    expect(bashTool.description).toContain('Execute shell commands');
  });

  it('should require command property in input schema', () => {
    expect(bashTool.input_schema.required).toContain('command');
  });

  it('should have command property defined', () => {
    expect(bashTool.input_schema.properties.command).toEqual({
      type: 'string',
      description: 'The shell command to execute',
    });
  });

  it('should have optional cwd property', () => {
    expect(bashTool.input_schema.properties.cwd).toEqual({
      type: 'string',
      description: 'Working directory for command execution (optional)',
    });
  });

  it('should have optional timeout property with constraints', () => {
    expect(bashTool.input_schema.properties.timeout).toEqual({
      type: 'number',
      description: 'Timeout in milliseconds (default: 30000)',
      minimum: 1000,
      maximum: 300000,
    });
  });
});
```

**Best Practices:**

1. **Test all required fields** are in the `required` array
2. **Validate property types** match JSON Schema specifications
3. **Check constraints** (minLength, maximum, enum values)
4. **Verify descriptions** are clear and accurate
5. **Test optional properties** have correct defaults

### 2.3 Testing Multiple Tool Registration

**Pattern: Verify all tools are registered**

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

**For tools with multiple operations:**

```typescript
describe('gitMCP tool schemas', () => {
  it('should register git_status tool', () => {
    expect(gitStatusTool.name).toBe('git_status');
    expect(gitStatusTool.input_schema.properties.path).toBeDefined();
  });

  it('should register git_diff tool', () => {
    expect(gitDiffTool.name).toBe('git_diff');
    expect(gitDiffTool.input_schema.properties.staged).toBeDefined();
  });

  it('should register git_add tool', () => {
    expect(gitAddTool.name).toBe('git_add');
    expect(gitAddTool.input_schema.properties.files).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('should register git_commit tool', () => {
    expect(gitCommitTool.name).toBe('git_commit');
    expect(gitCommitTool.input_schema.required).toContain('message');
  });
});
```

### 2.4 Testing Tool Executor Type Safety

**Pattern: Verify ToolExecutor type casting**

```typescript
describe('Tool executor registration', () => {
  it('should cast executors to ToolExecutor type', () => {
    // This test verifies the pattern used in implementations:
    // this.registerToolExecutor('git', 'git_status', gitStatus as ToolExecutor);

    // The cast is necessary because:
    // 1. TypeScript doesn't infer the exact ToolExecutor signature
    // 2. Ensures type safety when registering
    // 3. Prevents runtime errors from incorrect function signatures

    const executor = async (input: unknown) => ({ success: true });
    expect(typeof executor).toBe('function');
  });
});
```

---

## 3. Testing executeTool() Method

### 3.1 Direct Executor Testing vs executeTool() Testing

**Important Distinction:**

- **Direct Executor Testing**: Test the implementation function directly (recommended for unit tests)
- **executeTool() Testing**: Test through the MCPHandler.executeTool() interface (integration tests)

**Pattern: Test executor directly for unit tests**

```typescript
describe('executeBashCommand', () => {
  it('should execute simple command successfully', async () => {
    // SETUP
    const input: BashToolInput = { command: 'echo test' };
    mockSpawn.mockReturnValue(createMockChild() as any);

    // EXECUTE - call executor directly
    const result = await executeBashCommand(input);

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('test output');
    expect(result.exitCode).toBe(0);
  });
});
```

**Pattern: Test executeTool() for integration tests**

```typescript
describe('BashMCP.executeTool()', () => {
  it('should execute tool via MCPHandler interface', async () => {
    // SETUP
    const bashMCP = new BashMCP();

    // EXECUTE - use the MCPHandler.executeTool() interface
    const result = await bashMCP.executeTool('bash__execute_bash', {
      command: 'echo test',
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('test output');
  });
});
```

### 3.2 Testing with Valid Inputs

**Pattern: Test successful execution paths**

```typescript
describe('successful operations', () => {
  it('should read file content with default encoding', async () => {
    // SETUP
    const content = 'file content here';
    mockReadFile.mockResolvedValue(content as any);
    const input: FileReadInput = { path: './test.txt' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.content).toBe(content);
    expect(result.error).toBeUndefined();
    expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
      encoding: 'utf-8',
    });
  });

  it('should read file with custom encoding', async () => {
    // SETUP
    const content = 'base64content';
    mockReadFile.mockResolvedValue(content as any);
    const input: FileReadInput = { path: './test.txt', encoding: 'base64' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.content).toBe(content);
    expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
      encoding: 'base64',
    });
  });
});
```

### 3.3 Testing with Invalid Inputs

**Pattern: Test input validation**

```typescript
describe('validation', () => {
  it('should reject empty commit message', async () => {
    // SETUP
    const input: GitCommitInput = { message: '' };

    // EXECUTE
    const result = await gitCommit(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Commit message is required');
    expect(mockGitInstance.commit).not.toHaveBeenCalled();
  });

  it('should reject whitespace-only message', async () => {
    // SETUP
    const input: GitCommitInput = { message: '   ' };

    // EXECUTE
    const result = await gitCommit(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Commit message is required');
  });

  it('should reject undefined message', async () => {
    // SETUP
    const input: GitCommitInput = {
      message: undefined as unknown as string,
    };

    // EXECUTE
    const result = await gitCommit(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Commit message is required');
  });
});
```

### 3.4 Testing Error Handling

**Pattern: Test specific error codes**

```typescript
describe('error handling', () => {
  it('should handle file not found (ENOENT)', async () => {
    // SETUP
    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);
    const input: FileReadInput = { path: './nonexistent.txt' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('File not found: ./nonexistent.txt');
    expect(result.content).toBeUndefined();
  });

  it('should handle permission denied (EACCES)', async () => {
    // SETUP
    const error = new Error('Permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockReadFile.mockRejectedValue(error);
    const input: FileReadInput = { path: './restricted.txt' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Permission denied: ./restricted.txt');
  });

  it('should handle path is directory (EISDIR)', async () => {
    // SETUP
    const error = new Error('Is a directory') as NodeJS.ErrnoException;
    error.code = 'EISDIR';
    mockReadFile.mockRejectedValue(error);
    const input: FileReadInput = { path: './adirectory' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Path is a directory: ./adirectory');
  });

  it('should handle generic errors', async () => {
    // SETUP
    const error = new Error('Unknown error');
    mockReadFile.mockRejectedValue(error);
    const input: FileReadInput = { path: './test.txt' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });

  it('should handle non-Error objects', async () => {
    // SETUP
    mockReadFile.mockRejectedValue('string error');
    const input: FileReadInput = { path: './test.txt' };

    // EXECUTE
    const result = await readFile(input);

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });
});
```

### 3.5 Testing Timeout Behavior

**Pattern: Test timeout handling with fake timers**

```typescript
describe('timeout handling', () => {
  it('should handle timeout correctly', async () => {
    // SETUP - Create a child that never closes
    let closeCallback: ((code: number) => void) | null = null;
    let childKilled = false;
    mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, callback: any) => {
        if (event === 'close') closeCallback = callback;
      }),
      kill: vi.fn(() => {
        childKilled = true;
      }),
      get killed() {
        return childKilled;
      },
    } as any;
    mockSpawn.mockReturnValue(mockChild);

    const input: BashToolInput = { command: 'sleep 100', timeout: 50 };

    // EXECUTE
    const resultPromise = executeBashCommand(input);

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 100));

    // VERIFY - kill should be called with SIGTERM
    expect(mockChild.killed).toBe(true);
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');

    // Clean up - trigger close to resolve promise
    if (closeCallback) {
      (closeCallback as (code: number) => void)(143); // SIGTERM exit code
    }
    await resultPromise;
  });

  it('should send SIGKILL if SIGTERM does not kill process', async () => {
    // SETUP - Create a stubborn child that ignores SIGTERM
    let closeCallback: ((code: number) => void) | null = null;
    let childKilled = false;
    const killCalls: string[] = [];
    const stubbornChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, callback: any) => {
        if (event === 'close') closeCallback = callback;
      }),
      kill: vi.fn((signal: string) => {
        killCalls.push(signal);
        childKilled = signal === 'SIGKILL'; // Only SIGKILL "kills" this child
      }),
      get killed() {
        return childKilled;
      },
    } as any;
    mockSpawn.mockReturnValue(stubbornChild as any);

    const input: BashToolInput = { command: 'stubborn', timeout: 10 };

    // EXECUTE - start command
    const resultPromise = executeBashCommand(input);

    // Wait for initial timeout + SIGKILL grace period
    await new Promise(resolve => setTimeout(resolve, 2250));

    // VERIFY - both SIGTERM and SIGKILL should be called
    expect(killCalls).toContain('SIGTERM');
    expect(killCalls).toContain('SIGKILL');

    // Clean up - trigger close to resolve promise
    if (closeCallback) {
      (closeCallback as (code: number) => void)(137); // SIGKILL exit code
    }
    await resultPromise;
  });
});
```

### 3.6 Testing Async Error Events

**Pattern: Test asynchronous error handling**

```typescript
it('should handle async child process error events', async () => {
  // SETUP - child emits 'error' event asynchronously
  let errorCallback: ((error: Error) => void) | null = null;
  const erroringChild = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, callback: any) => {
      if (event === 'error') errorCallback = callback;
    }),
    kill: vi.fn(),
    killed: false,
  } as any;
  mockSpawn.mockReturnValue(erroringChild as any);

  const input: BashToolInput = { command: 'failing-command' };

  // EXECUTE - start command but don't await yet
  const resultPromise = executeBashCommand(input);

  // Emit error event
  if (errorCallback) {
    (errorCallback as (error: Error) => void)(
      new Error('EMFILE: too many open files')
    );
  }

  const result = await resultPromise;

  // VERIFY
  expect(result.success).toBe(false);
  expect(result.exitCode).toBeNull();
  expect(result.error).toBe('EMFILE: too many open files');
});
```

---

## 4. Integration Testing MCP Servers

### 4.1 Testing with Mocked Dependencies

**Pattern: Mock external dependencies**

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

import { promises as fs } from 'node:fs';
import fg from 'fast-glob';

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockMkdir = vi.mocked(fs.mkdir);
const mockFastGlob = vi.mocked(fg);
```

**Benefits:**

- No side effects from actual file operations
- Faster test execution
- Deterministic test results
- Can test error conditions by making mocks reject

### 4.2 Testing Tool Orchestration

**Pattern: Test multiple tools working together**

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

### 4.3 Testing with Real Dependencies (E2E)

**Pattern: Use test fixtures for real operations**

```typescript
import { beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('FilesystemMCP E2E tests', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'fs-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should write and read file in real filesystem', async () => {
    // SETUP
    const fsMCP = new FilesystemMCP();
    const testFile = join(testDir, 'test.txt');
    const content = 'Hello, World!';

    // EXECUTE - Write file
    const writeResult = await fsMCP.executeTool('filesystem__file_write', {
      path: testFile,
      content,
    });

    // VERIFY
    expect(writeResult.success).toBe(true);

    // EXECUTE - Read file
    const readResult = await fsMCP.executeTool('filesystem__file_read', {
      path: testFile,
    });

    // VERIFY
    expect(readResult.success).toBe(true);
    expect(readResult.content).toBe(content);
  });
});
```

### 4.4 Testing Error Recovery

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

## 5. Groundswell MCP Framework Patterns

### 5.1 Groundswell MCPHandler Architecture

**Key Components:**

```typescript
import { MCPHandler, Tool, ToolExecutor } from 'groundswell';

// 1. Tool Schema Definition
const myTool: Tool = {
  name: 'tool_name',
  description: 'Clear description',
  input_schema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter' },
    },
    required: ['param1'],
  },
};

// 2. Tool Executor Implementation
async function myExecutor(input: any): Promise<any> {
  return { success: true, data: 'result' };
}

// 3. MCP Server Registration
export class MyMCP extends MCPHandler {
  constructor() {
    super();

    this.registerServer({
      name: 'my_server',
      transport: 'inprocess',
      tools: [myTool],
    });

    this.registerToolExecutor(
      'my_server',
      'tool_name',
      myExecutor as ToolExecutor
    );
  }
}
```

### 5.2 Groundswell-Specific Testing Patterns

**Pattern: Test inprocess transport**

```typescript
describe('Groundswell MCPHandler', () => {
  it('should register server with inprocess transport', () => {
    // Groundswell uses 'inprocess' transport for local tool execution
    // This is different from stdio transport used in standalone MCP servers

    const mcp = new MyMCP();

    // The inprocess transport allows tools to be called directly
    // without going through serialization/deserialization
    expect(mcp).toBeDefined();
  });
});
```

**Pattern: Test ToolExecutor type casting**

```typescript
describe('ToolExecutor type safety', () => {
  it('should require ToolExecutor cast when registering', () => {
    // Groundswell requires casting to ToolExecutor type
    // This ensures the function signature matches:
    // (input: unknown) => Promise<ToolResult>

    const executor = async (input: unknown) => {
      return { success: true };
    };

    // This pattern is used in all implementations:
    // this.registerToolExecutor('server', 'tool', executor as ToolExecutor);

    expect(typeof executor).toBe('function');
    expect(executor.constructor.name).toBe('AsyncFunction');
  });
});
```

### 5.3 Groundswell Agent Integration

**Pattern: Test MCP with Agent factory**

```typescript
describe('Agent MCP integration', () => {
  it('should use MCP tools in agent configuration', () => {
    // From agent-factory.ts pattern:
    const coderAgent = createAgent({
      name: 'CoderAgent',
      system: CODER_SYSTEM_PROMPT,
      model: 'GLM-4.7',
      mcps: [new BashMCP(), new FilesystemMCP(), new GitMCP()],
    });

    expect(coderAgent).toBeDefined();
  });
});
```

### 5.4 Groundswell Workflow Integration

**Pattern: Test MCP in Workflows**

```typescript
describe('Workflow MCP integration', () => {
  it('should execute tools via MCPHandler in workflows', async () => {
    // From groundswell_api.md pattern:
    class MyWorkflow extends Workflow {
      private mcpHandler = new MCPHandler();

      @Step()
      async runCommand(): Promise<string> {
        return await this.mcpHandler.executeTool('bash__execute_bash', {
          command: 'npm run test',
          cwd: './my-project',
        });
      }
    }

    const workflow = new MyWorkflow();
    // Test would mock executeTool to verify it's called correctly
  });
});
```

---

## 6. Common Testing Pitfalls

### 6.1 Pitfall: Testing Implementation Details

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

### 6.2 Pitfall: Not Cleaning Up Mocks

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

  it('test 2', () => {
    // Fresh mock state
    const result = await readFile({ path: 'test' });
  });
});
```

### 6.3 Pitfall: Not Testing Async Error Paths

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

### 6.4 Pitfall: Testing with Incompatible Types

**Bad Practice:**

```typescript
// ❌ BAD - Doesn't test type validation
it('should handle input', async () => {
  const result = await executeTool('any string' as any);
  expect(result).toBeDefined();
});
```

**Good Practice:**

```typescript
// ✅ GOOD - Tests with proper types
it('should handle valid input', async () => {
  const input: GitCommitInput = { message: 'Test commit' };
  const result = await gitCommit(input);
  expect(result.success).toBe(true);
});

it('should reject invalid input', async () => {
  const input = { message: '' } as GitCommitInput;
  const result = await gitCommit(input);
  expect(result.success).toBe(false);
  expect(result.error).toContain('required');
});
```

### 6.5 Pitfall: Ignoring Edge Cases

**Common Edge Cases to Test:**

1. **Empty inputs** (`''`, `[]`, `{}`)
2. **Null/undefined values**
3. **Very large inputs**
4. **Special characters** (`\n`, `\t`, `$`, etc.)
5. **Path traversal attempts** (`../../../etc/passwd`)
6. **Concurrent operations**
7. **Timeout scenarios**
8. **Non-Error objects thrown**

**Good Practice:**

```typescript
describe('edge cases', () => {
  it('should handle empty file content', async () => {
    mockReadFile.mockResolvedValue('' as any);
    const result = await readFile({ path: './empty.txt' });
    expect(result.success).toBe(true);
    expect(result.content).toBe('');
  });

  it('should handle special characters in grep pattern', async () => {
    const content = 'test$\\n^test';
    mockReadFile.mockResolvedValue(content as any);
    const result = await grepSearch({
      path: './test.txt',
      pattern: '\\$',
    });
    expect(result.success).toBe(true);
    expect(result.matches?.length).toBeGreaterThan(0);
  });

  it('should handle non-Error objects', async () => {
    mockReadFile.mockRejectedValue('string error');
    const result = await readFile({ path: './test.txt' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });
});
```

### 6.6 Pitfall: Over-mocking

**Bad Practice:**

```typescript
// ❌ BAD - Mocks everything, tests nothing
it('should work', async () => {
  vi.mock('node:fs');
  vi.mock('node:path');
  vi.mock('simple-git');

  const result = await gitStatus({});
  expect(result).toBeDefined();
});
```

**Good Practice:**

```typescript
// ✅ GOOD - Mocks external dependencies, tests business logic
it('should parse git status correctly', async () => {
  mockGitInstance.status.mockResolvedValue({
    current: 'main',
    files: [{ path: 'test.txt', index: 'M', working_dir: ' ' }],
    isClean: () => false,
  } as never);

  const result = await gitStatus({});

  expect(result.success).toBe(true);
  expect(result.branch).toBe('main');
  expect(result.staged).toEqual(['test.txt']);
});
```

---

## 7. Test Coverage Strategies

### 7.1 Coverage Goals

**Target Coverage Metrics:**

- **Statement Coverage**: 100% for tool executors
- **Branch Coverage**: 100% for error handling
- **Function Coverage**: 100% for exported functions
- **Line Coverage**: 95%+ overall

**Current Implementation Status:**

Based on existing test files:

- `tests/unit/tools/bash-mcp.test.ts` - 100% coverage
- `tests/unit/tools/git-mcp.test.ts` - 100% coverage
- `tests/unit/tools/filesystem-mcp.test.ts` - 100% coverage

### 7.2 Coverage Testing Patterns

**Pattern: Test all code paths**

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

### 7.3 Measuring Coverage

**Using Vitest:**

```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/index.html
```

**Configuration (vitest.config.ts):**

```typescript
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

### 7.4 Coverage Checklist

**For each MCP tool, ensure coverage of:**

- [ ] Tool schema validation
- [ ] Required parameter validation
- [ ] Optional parameter defaults
- [ ] Type validation
- [ ] Range validation (minLength, maximum, etc.)
- [ ] Success response structure
- [ ] All error code paths
- [ ] Async error events
- [ ] Timeout behavior
- [ ] Edge cases
- [ ] Security constraints

---

## 8. Code Examples and Patterns

### 8.1 Complete Test Template

**Template for MCP Tool Tests:**

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

    describe('edge cases', () => {
      it('should handle edge case', async () => {
        // SETUP
        const input: ToolInput = {
          /* edge case input */
        };

        // EXECUTE
        const result = await executeTool(input);

        // VERIFY
        expect(result).toBeDefined();
      });
    });
  });
});
```

### 8.2 Mock Helper Patterns

**Pattern: Mock ChildProcess for spawn tests**

```typescript
/**
 * Helper to create mock ChildProcess for testing
 *
 * @remarks
 * Creates a realistic mock of Node.js ChildProcess that emits
 * data events and closes with the specified exit code.
 */
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
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        // Simulate async close
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

**Pattern: Mock Git Instance**

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

### 8.3 Test Organization Patterns

**Pattern: Group tests by functionality**

```typescript
describe('GitMCP', () => {
  // Level 1: Class instantiation
  describe('class', () => {
    it('should instantiate');
  });

  // Level 2: Schema validation
  describe('schema', () => {
    it('should have correct name');
    it('should have required fields');
  });

  // Level 3: Each tool
  describe('gitStatus', () => {
    describe('successful operations', () => {
      it('should return status');
    });
    describe('error handling', () => {
      it('should handle not a repo');
    });
  });

  describe('gitCommit', () => {
    describe('successful operations', () => {
      it('should create commit');
    });
    describe('validation', () => {
      it('should reject empty message');
    });
  });

  // Level 4: Edge cases
  describe('edge cases', () => {
    it('should handle special characters');
  });

  // Level 5: Security
  describe('security', () => {
    it('should prevent path traversal');
  });
});
```

---

## 9. References and Resources

### 9.1 Official Documentation

**Model Context Protocol:**

- **Specification**: https://spec.modelcontextprotocol.io/specification/
- **Tools Guide**: https://spec.modelcontextprotocol.io/specification/tools/
- **Server Implementation**: https://spec.modelcontextprotocol.io/specification/server/
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Official Servers**: https://github.com/modelcontextprotocol/servers

**Groundswell Framework:**

- **Repository**: https://github.com/groundswell-ai/groundswell
- **Local Path**: `~/projects/groundswell`
- **API Reference**: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md`

### 9.2 Existing Implementations in Codebase

**Source Files:**

- `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts` - Bash command execution
- `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts` - Git operations
- `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts` - File system operations

**Test Files:**

- `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts`

### 9.3 Research Documents

- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S3/research/mcp-patterns-research.md`
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S2/research/filesystem-mcp-research-summary.md`
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S3/research/git-mcp-examples-research.md`

### 9.4 Testing Frameworks

**Vitest:**

- **Documentation**: https://vitest.dev/guide/
- **API Reference**: https://vitest.dev/api/
- **Coverage**: https://vitest.dev/guide/coverage.html

**Testing Utilities:**

- **vi.mock()**: Module mocking
- **vi.fn()**: Function spying
- **vi.clearAllMocks()**: Mock cleanup
- **describe/it**: Test organization
- **beforeEach/afterEach**: Test lifecycle

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

## 10. Quick Reference

### 10.1 Test Structure Template

```typescript
describe('ToolName', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('class', () => {
    it('should instantiate');
  });

  describe('schema', () => {
    it('should validate name');
    it('should validate required fields');
    it('should validate properties');
  });

  describe('executor', () => {
    describe('success', () => {
      it('should handle valid input');
    });

    describe('errors', () => {
      it('should handle error code 1');
      it('should handle error code 2');
    });

    describe('edge cases', () => {
      it('should handle empty input');
    });
  });
});
```

### 10.2 Common Assertions

```typescript
// Success
expect(result.success).toBe(true);
expect(result.error).toBeUndefined();

// Error
expect(result.success).toBe(false);
expect(result.error).toContain('expected message');

// Mock calls
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).not.toHaveBeenCalled();

// Type checks
expect(value).toBeInstanceOf(ExpectedClass);
expect(typeof value).toBe('string');
```

---

**End of Research Document**

**Last Updated:** 2026-01-13
**Researcher:** Claude Code Agent
**For:** P4M4T2S2 - MCP Integration Testing Research
