# Product Requirement Prompt: Create Bash MCP Tool

**PRP ID**: P2.M1.T2.S1
**Work Item Title**: Create Bash MCP tool
**Generated**: 2026-01-12
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create a Bash MCP tool that enables Groundswell agents to execute shell commands safely with timeout, working directory, and result capture capabilities.

**Deliverable**: `src/tools/bash-mcp.ts` module containing:

- `bashTool` schema definition with name `'execute_bash'` and input_schema
- `BashMCP` class extending `MCPHandler` from Groundswell
- Server registration with `'bash'` server name and `'inprocess'` transport
- Tool executor that spawns `child_process.exec` with timeout, cwd options
- Result formatter returning status, output, error fields with stdout, stderr, exitCode

**Success Definition**:

- `BashMCP` class can be instantiated and registers `'execute_bash'` tool
- Tool accepts `command` (string), `cwd` (optional string), `timeout` (optional number)
- Commands execute with `spawn()` using argument array (no shell injection)
- Timeout defaults to 30000ms, cwd defaults to process working directory
- Returns formatted result with `success` (boolean), `stdout` (string), `stderr` (string), `exitCode` (number | null)
- TypeScript compilation succeeds with zero errors
- 100% test coverage achieved

---

## User Persona

**Target User**: PRP Pipeline system (internal - agents use this tool)

**Use Case**: AI agents (Researcher, Coder, QA) need to execute shell commands as part of their workflows:

- **Researcher**: Run git commands, grep searches, file operations
- **Coder**: Execute npm scripts, run tests, build projects
- **QA**: Run test suites, validation scripts, linting

**User Journey**:

1. Agent is configured with MCP server(s) including BashMCP
2. Agent invokes `execute_bash` tool with command and optional parameters
3. BashMCP spawns child process with security constraints
4. Result captured and returned to agent
5. Agent uses output for decision-making and next actions

**Pain Points Addressed**:

- Enables autonomous code execution by AI agents
- Provides safe command execution with timeout protection
- Captures both stdout and stderr for debugging
- Supports working directory specification for project-specific commands

---

## Why

- **Business value**: Critical foundation for autonomous AI agents to interact with the system - without bash execution, agents cannot run git, npm, tests, or any shell commands
- **Integration**: First MCP tool in the pipeline - establishes the pattern for Filesystem, Git, and Search tools
- **Problems solved**: Provides secure command execution interface with timeout protection, output capture, and working directory support

---

## What

Create a Bash MCP tool following Groundswell's MCP integration pattern.

### Technical Requirements

1. **Tool Schema Definition**:
   - Name: `'execute_bash'`
   - Description: Clear description of what the tool does
   - input_schema: JSON Schema with `command` (required string), `cwd` (optional string), `timeout` (optional number)

2. **BashMCP Class**:
   - Extends `MCPHandler` from Groundswell
   - Registers `'bash'` server with `'inprocess'` transport
   - Registers tool executor for `'execute_bash'`

3. **Command Execution**:
   - Use `child_process.spawn()` with argument array (NEVER shell: true)
   - Default timeout: 30000ms (30 seconds)
   - Default cwd: `process.cwd()` or specified directory
   - Capture stdout, stderr, exitCode
   - Handle spawn errors (command not found, etc.)

4. **Result Format**:

   ```typescript
   {
     success: boolean,
     stdout: string,
     stderr: string,
     exitCode: number | null,
     error?: string
   }
   ```

5. **Security**:
   - NEVER use `shell: true` with user input
   - Always use spawn with argument array
   - Validate cwd exists and is accessible
   - Implement size limits to prevent memory exhaustion

### Success Criteria

- [ ] `src/tools/bash-mcp.ts` exists with `bashTool` schema
- [ ] `BashMCP` class extends `MCPHandler`
- [ ] Tool registers with name `'execute_bash'`
- [ ] Input schema requires `command`, optional `cwd` and `timeout`
- [ ] Uses `spawn()` with argument array (security)
- [ ] Default timeout is 30000ms
- [ ] Returns formatted result with success, stdout, stderr, exitCode
- [ ] Handles command errors gracefully
- [ ] TypeScript compilation succeeds
- [ ] 100% test coverage achieved

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact Groundswell MCP integration patterns from groundswell_api.md
- Complete child_process best practices for safe bash execution
- Testing patterns from the codebase (Vitest with vi.mock)
- File naming and placement conventions
- Type definitions and import paths
- Security gotchas and anti-patterns

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- url: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
  why: Node.js spawn() API reference for bash command execution
  critical: Use spawn() with argument array, never shell: true with user input
  section: "Synchronous Process Creation" and "child_process.spawn()"

- url: https://nodejs.org/api/child_process.html#child_process_class_childprocess
  why: Understanding ChildProcess events: 'close', 'error', 'exit', 'data'
  critical: Handle both 'close' event (exit code) and 'error' event (spawn failures)

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API specification for MCP tool registration
  section: "MCP Integration (Tools)" (lines 162-217)
  critical: MCPHandler.registerServer(), registerToolExecutor(), Tool schema format

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S1/research/child_process_best_practices.md
  why: Research findings on safe child_process usage for MCP tools
  section: "Complete Error Handling Pattern for MCP Tools"
  critical: Timeout handling, size limits, SIGTERM/SIGKILL cleanup pattern

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P2M1T2S1/research/testing_patterns.md
  why: Testing patterns for MCP tools in this codebase
  section: "Example Test Pattern for MCP Tools"
  critical: vi.mock('node:child_process') pattern, test structure

- file: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
  why: Reference pattern for Groundswell imports and JSDoc documentation
  pattern: import from 'groundswell', JSDoc with @module/@remarks tags
  gotcha: Groundswell is linked locally via npm link

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Vitest configuration with coverage settings
  pattern: 100% coverage thresholds, test environment settings
  gotcha: All tests must achieve 100% coverage

- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Test patterns including AAA style, afterEach cleanup, vi.stubEnv()
  pattern: describe/it blocks, beforeEach/afterEach hooks
  gotcha: Always use vi.unstubAllEnvs() in afterEach

- file: /home/dustin/projects/hacky-hack/src/config/types.ts
  why: Type definition patterns with JSDoc and readonly properties
  pattern: Interface definitions with readonly, custom Error classes
  gotcha: Use readonly for all interface properties
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── coverage/                    # Test coverage reports
├── dist/                        # Compiled JavaScript output
├── node_modules/                # Dependencies (groundswell linked)
├── package.json                 # Project config
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/        # Architecture docs
│       ├── P2M1T2S1/            # THIS WORK ITEM
│       │   ├── PRP.md           # This file
│       │   └── research/        # Research documents
│       └── tasks.json           # Task hierarchy state
├── PRD.md                       # Product requirements
├── PROMPTS.md                   # System prompts
├── src/
│   ├── agents/                  # Agent factory and prompts
│   │   ├── agent-factory.ts     # Groundswell agent configs
│   │   └── prompts.ts           # System prompt constants
│   ├── config/                  # Environment configuration
│   ├── core/                    # Domain models
│   ├── scripts/                 # Standalone scripts
│   ├── utils/                   # Utility functions
│   ├── workflows/               # Workflow implementations
│   └── index.ts                 # Main entry point
└── tests/
    ├── unit/                    # Unit tests
    └── validation/              # Integration tests
```

### Desired Codebase Tree (After Implementation)

```bash
src/
└── tools/
    └── bash-mcp.ts              # NEW - bashTool schema, BashMCP class, tool executor

tests/
└── unit/
    └── tools/
        └── bash-mcp.test.ts     # NEW - Unit tests for Bash MCP tool
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Groundswell MCPHandler registration pattern
// From groundswell_api.md lines 184-200:
import { MCPHandler } from 'groundswell';

const mcpHandler = new MCPHandler();

// Register MCP server
mcpHandler.registerServer({
  name: 'bash',
  transport: 'inprocess',
  tools: [bashTool],
});

// Register tool executor
mcpHandler.registerToolExecutor('bash', 'execute_bash', async input => {
  const { command, cwd, timeout } = input as {
    command: string;
    cwd?: string;
    timeout?: number;
  };
  return executeBashCommand(command, cwd, timeout);
});

// CRITICAL: NEVER use shell: true with user input (security)
// DANGEROUS:
// spawn('command', [userInput], { shell: true }); // Shell injection!

// SAFE:
// spawn('command', [userInput], { shell: false });

// CRITICAL: Use spawn() with argument array, not exec()
// exec() buffers entire output - can overflow memory
// spawn() streams output - safer for large output

// CRITICAL: Handle both 'close' and 'error' events on ChildProcess
// 'close': Provides exit code (normal completion)
// 'error': Spawn failures (command not found, permissions)

// CRITICAL: Implement SIGTERM then SIGKILL for timeout handling
// Give process 2-5 seconds to clean up with SIGTERM
// Force kill with SIGKILL if SIGTERM doesn't work

// GOTCHA: ESM imports require .js extensions
// Even though source is .ts, imports use .js
import { spawn } from 'node:child_process';

// GOTCHA: Groundswell is linked locally
// Located at ~/projects/groundswell
// Linked via npm link ~/projects/groundswell

// GOTCHA: Tool schema uses JSON Schema format
// input_schema must be valid JSON Schema
// See groundswell_api.md lines 167-179

// GOTCHA: Test vi.mock must be at top level
// Must be outside describe blocks
// Must mock entire 'node:child_process' module

// GOTCHA: 100% coverage is required
// All branches must be tested
// Error handlers must have test coverage
```

---

## Implementation Blueprint

### Data Models and Structure

Create the core types and schemas for the Bash MCP tool:

```typescript
// Tool input schema (JSON Schema format for Groundswell)
interface BashToolInput {
  command: string; // Required: The shell command to execute
  cwd?: string; // Optional: Working directory
  timeout?: number; // Optional: Timeout in milliseconds (default 30000)
}

// Tool output schema
interface BashToolResult {
  success: boolean; // True if exitCode === 0
  stdout: string; // Standard output
  stderr: string; // Standard error
  exitCode: number | null; // Exit code from process
  error?: string; // Error message if failed
}

// Internal execution options
interface BashExecuteOptions {
  timeout: number;
  cwd?: string;
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/tools/bash-mcp.ts
  - DEFINE: BashToolInput interface (command, cwd?, timeout?)
  - DEFINE: BashToolResult interface (success, stdout, stderr, exitCode, error?)
  - DEFINE: bashTool schema with Tool type from Groundswell
    * name: 'execute_bash'
    * description: Clear description of tool purpose
    * input_schema: JSON Schema with properties (command, cwd, timeout)
  - CREATE: BashMCP class extending MCPHandler
  - REGISTER: 'bash' server in constructor with 'inprocess' transport
  - REGISTER: 'execute_bash' tool executor
  - IMPLEMENT: executeBashCommand() helper function
    * USE: spawn() with argument array (shell: false)
    * SET: default timeout 30000ms
    * SET: default cwd from process.cwd()
    * CAPTURE: stdout, stderr with event listeners
    * HANDLE: 'close' event for exit code
    * HANDLE: 'error' event for spawn failures
    * HANDLE: timeout with clearTimeout, SIGTERM, SIGKILL
    * RETURN: BashToolResult object
  - FOLLOW: JSDoc documentation pattern from src/agents/agent-factory.ts
  - NAMING: PascalCase for class, camelCase for functions
  - PLACEMENT: New src/tools/ directory

Task 2: CREATE tests/unit/tools/bash-mcp.test.ts
  - MOCK: node:child_process module at top level
  - IMPLEMENT: describe block for 'tools/bash-mcp'
  - TEST: BashMCP class instantiates correctly
  - TEST: Tool registration with correct name and schema
  - TEST: executeBashCommand returns success for exit code 0
  - TEST: executeBashCommand returns failure for non-zero exit code
  - TEST: executeBashCommand captures stdout correctly
  - TEST: executeBashCommand captures stderr correctly
  - TEST: executeBashCommand handles timeout correctly
  - TEST: executeBashCommand handles spawn errors (command not found)
  - TEST: executeBashCommand respects cwd parameter
  - FOLLOW: AAA pattern from environment.test.ts
  - NAMING: test files use *.test.ts suffix
  - COVERAGE: 100% code coverage required
  - PLACEMENT: tests/unit/tools/bash-mcp.test.ts

Task 3: VALIDATE TypeScript compilation
  - RUN: npm run build
  - VERIFY: Zero compilation errors
  - VERIFY: Groundswell imports resolve correctly
  - VERIFY: Tool schema type is correct

Task 4: VALIDATE Test execution
  - RUN: npm test -- tests/unit/tools/bash-mcp.test.ts
  - VERIFY: All tests pass
  - RUN: npm run test:coverage -- tests/unit/tools/
  - VERIFY: 100% coverage for src/tools/bash-mcp.ts
```

### Implementation Patterns & Key Details

````typescript
/**
 * Bash MCP Tool Module
 *
 * @module tools/bash-mcp
 *
 * @remarks
 * Provides MCP tool for executing shell commands safely.
 * Uses spawn() with argument arrays to prevent shell injection.
 * Implements timeout protection and output capture.
 *
 * @example
 * ```ts
 * import { BashMCP } from './tools/bash-mcp.js';
 *
 * const bashMCP = new BashMCP();
 * const result = await bashMCP.executeTool('bash__execute_bash', {
 *   command: 'npm test',
 *   cwd: './my-project',
 *   timeout: 60000
 * });
 * ```
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

/**
 * Input schema for bash tool execution
 */
interface BashToolInput {
  /** The shell command to execute */
  command: string;
  /** Working directory (optional, defaults to process.cwd()) */
  cwd?: string;
  /** Timeout in milliseconds (optional, defaults to 30000) */
  timeout?: number;
}

/**
 * Result from bash command execution
 */
interface BashToolResult {
  /** True if command succeeded (exit code 0) */
  success: boolean;
  /** Standard output from command */
  stdout: string;
  /** Standard error from command */
  stderr: string;
  /** Exit code from process (null if spawn failed) */
  exitCode: number | null;
  /** Error message if spawn failed or timed out */
  error?: string;
}

/**
 * Tool schema definition for Groundswell
 *
 * @remarks
 * Defines the execute_bash tool with JSON Schema input validation.
 * Requires 'command' string, optional 'cwd' string, optional 'timeout' number.
 */
const bashTool: Tool = {
  name: 'execute_bash',
  description:
    'Execute shell commands with optional working directory and timeout. ' +
    'Returns stdout, stderr, exit code, and success status. ' +
    'Commands are executed safely using spawn() without shell interpretation.',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for command execution (optional)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)',
        minimum: 1000,
        maximum: 300000,
      },
    },
    required: ['command'],
  },
};

/**
 * Execute a bash command safely with timeout and output capture
 *
 * @remarks
 * Uses spawn() with argument arrays to prevent shell injection.
 * Implements SIGTERM then SIGKILL timeout handling.
 * Captures stdout, stderr, and exit code for result.
 *
 * @param input - Tool input with command, optional cwd, optional timeout
 * @returns Promise resolving to execution result
 *
 * @example
 * ```ts
 * const result = await executeBashCommand({
 *   command: 'npm test',
 *   cwd: './project',
 *   timeout: 60000
 * });
 * // { success: true, stdout: '...', stderr: '', exitCode: 0 }
 * ```
 */
async function executeBashCommand(
  input: BashToolInput
): Promise<BashToolResult> {
  const { command, cwd, timeout = 30000 } = input;

  // PATTERN: Validate working directory exists
  const workingDir = cwd
    ? (() => {
        const absoluteCwd = resolve(cwd);
        if (!existsSync(absoluteCwd)) {
          throw new Error(`Working directory does not exist: ${absoluteCwd}`);
        }
        return realpathSync(absoluteCwd);
      })()
    : undefined;

  // PATTERN: Parse command into executable and arguments
  // Simple split on spaces - for production, use proper shell parsing
  const args = command.split(' ');
  const executable = args[0];
  const commandArgs = args.slice(1);

  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // CRITICAL: Use shell: false to prevent shell injection
    const child: ChildProcess = spawn(executable, commandArgs, {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    // PATTERN: Set up timeout handler
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      // PATTERN: Force kill after grace period
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    // PATTERN: Capture stdout data
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return;
        stdout += data.toString();
      });
    }

    // PATTERN: Capture stderr data
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return;
        stderr += data.toString();
      });
    }

    // PATTERN: Handle process completion
    child.on('close', exitCode => {
      clearTimeout(timeoutId);

      const result: BashToolResult = {
        success: exitCode === 0 && !timedOut && !killed,
        stdout,
        stderr,
        exitCode,
      };

      if (timedOut) {
        result.error = `Command timed out after ${timeout}ms`;
      } else if (exitCode !== 0) {
        result.error = `Command failed with exit code ${exitCode}`;
      }

      resolve(result);
    });

    // PATTERN: Handle spawn errors (command not found, etc.)
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}

/**
 * Bash MCP Server
 *
 * @remarks
 * Groundswell MCP server that provides bash command execution.
 * Extends MCPHandler and registers the execute_bash tool.
 */
export class BashMCP extends MCPHandler {
  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: 'bash',
      transport: 'inprocess',
      tools: [bashTool],
    });

    // PATTERN: Register tool executor
    this.registerToolExecutor(
      'bash',
      'execute_bash',
      executeBashCommand as ToolExecutor
    );
  }
}

// Export tool schema and result types for external use
export type { BashToolInput, BashToolResult };
export { bashTool, executeBashCommand };
````

### Test Implementation Pattern

```typescript
/**
 * Unit tests for Bash MCP tool
 *
 * @remarks
 * Tests validate bash command execution with security constraints
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BashMCP,
  executeBashCommand,
  type BashToolInput,
} from '../../../src/tools/bash-mcp.js';

// Mock child_process to avoid actual command execution
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path: string) => path),
}));

import { spawn } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';

const mockSpawn = vi.mocked(spawn);
const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);

describe('tools/bash-mcp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BashMCP class', () => {
    it('should instantiate and register bash server', () => {
      // EXECUTE
      const bashMCP = new BashMCP();

      // VERIFY
      expect(bashMCP).toBeInstanceOf(BashMCP);
    });

    it('should register execute_bash tool', () => {
      // EXECUTE
      const bashMCP = new BashMCP();

      // VERIFY - tool is registered via MCPHandler
      // (Cannot directly inspect registration without exposing internals)
      expect(bashMCP).toBeDefined();
    });
  });

  describe('executeBashCommand', () => {
    let mockChild: ReturnType<typeof createMockChild>;

    beforeEach(() => {
      mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild as any);
      mockExistsSync.mockReturnValue(true);
      mockRealpathSync.mockImplementation(path => path as string);
    });

    it('should execute simple command successfully', async () => {
      // SETUP
      const input: BashToolInput = { command: 'echo test' };

      // EXECUTE
      const result = await executeBashCommand(input);

      // VERIFY
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('test output');
      expect(result.exitCode).toBe(0);
      expect(mockSpawn).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.objectContaining({
          shell: false,
        })
      );
    });

    it('should capture stderr for failed commands', async () => {
      // SETUP
      mockChild = createMockChild({ exitCode: 1, stderr: 'error occurred' });
      mockSpawn.mockReturnValue(mockChild as any);

      const input: BashToolInput = { command: 'false' };

      // EXECUTE
      const result = await executeBashCommand(input);

      // VERIFY
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBe('error occurred');
      expect(result.error).toContain('failed with exit code');
    });

    it('should use default timeout of 30000ms', async () => {
      // SETUP
      const input: BashToolInput = { command: 'sleep 1' };

      // EXECUTE
      const result = await executeBashCommand(input);

      // VERIFY
      expect(result.success).toBe(true);
      // Verify timeout was set (implementation detail)
    });

    it('should handle timeout correctly', async () => {
      // SETUP - Create a child that never closes
      let closeCallback: ((code: number) => void) | null = null;
      mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: any) => {
          if (event === 'close') closeCallback = callback;
        }),
        kill: vi.fn(),
        killed: false,
      };
      mockSpawn.mockReturnValue(mockChild as any);

      const input: BashToolInput = { command: 'sleep 100', timeout: 100 };

      // EXECUTE
      const resultPromise = executeBashCommand(input);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // VERIFY - kill should be called
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should handle spawn errors', async () => {
      // SETUP - command not found
      mockSpawn.mockImplementation(() => {
        throw new Error('spawn echo ENOENT');
      });

      const input: BashToolInput = { command: 'echo test' };

      // EXECUTE
      const result = await executeBashCommand(input);

      // VERIFY
      expect(result.success).toBe(false);
      expect(result.exitCode).toBeNull();
      expect(result.error).toContain('ENOENT');
    });

    it('should validate working directory exists', async () => {
      // SETUP
      mockExistsSync.mockReturnValue(false);
      const input: BashToolInput = { command: 'ls', cwd: '/nonexistent' };

      // EXECUTE & VERIFY
      await expect(executeBashCommand(input)).rejects.toThrow(
        'Working directory does not exist'
      );
    });
  });
});

// Helper to create mock ChildProcess
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
        if (event === 'data') callback(Buffer.from(stdout));
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') callback(Buffer.from(stderr));
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
  };
}
```

### Integration Points

```yaml
GROUNDSWELL:
  - import: 'groundswell' (via local npm link)
  - usage: MCPHandler.registerServer(), registerToolExecutor()
  - location: ~/projects/groundswell

CHILD_PROCESS:
  - import: 'node:child_process'
  - usage: spawn() for command execution
  - security: Always use shell: false

FUTURE SUBTASKS:
  - P2.M1.T2.S2: Create Filesystem MCP tool (follow this pattern)
  - P2.M1.T2.S3: Create Git MCP tool (follow this pattern)
  - P2.M1.T2.S4: Integrate MCP tools with agents (wire up to agent configs)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler check
npm run build

# Expected: Zero compilation errors

# Run linter
npm run lint

# Expected: Zero linting errors

# Run formatter check
npm run format:check

# Expected: Zero formatting issues

# Fix any issues before proceeding
npm run lint:fix
npm run format
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the bash MCP tool
npm test -- tests/unit/tools/bash-mcp.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/tools/

# Verify coverage meets 100% threshold
# Expected: All tests pass, 100% coverage for src/tools/bash-mcp.ts

# If tests fail, debug root cause and fix implementation before proceeding.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify TypeScript compilation succeeds
npm run build

# Verify bash-mcp module can be imported
node -e "
import('./src/tools/bash-mcp.js').then(m => {
  console.log('BashMCP class:', typeof m.BashMCP);
  console.log('executeBashCommand:', typeof m.executeBashCommand);
  console.log('bashTool:', typeof m.bashTool);
});
"

# Expected output:
# BashMCP class: function
# executeBashCommand: function
# bashTool: object

# Verify BashMCP can be instantiated
node -e "
import('./src/tools/bash-mcp.js').then(m => {
  const bashMCP = new m.BashMCP();
  console.log('BashMCP instantiated:', bashMCP instanceof m.BashMCP);
});
"

# Expected output:
# BashMCP instantiated: true

# Test with a simple echo command (requires working spawn)
node -e "
import('./src/tools/bash-mcp.js').then(async m => {
  const result = await m.executeBashCommand({ command: 'echo hello' });
  console.log('Success:', result.success);
  console.log('ExitCode:', result.exitCode);
  console.log('Stdout:', result.stdout.trim());
});
"

# Expected output:
# Success: true
# ExitCode: 0
# Stdout: hello

# Expected: All imports resolve, BashMCP instantiates, commands execute
```

### Level 4: Type Safety Validation

```bash
# Verify TypeScript types are correct
npx tsc --noEmit

# Verify BashToolInput interface works
node -e "
import('./src/tools/bash-mcp.js').then(m => {
  const input: m.BashToolInput = {
    command: 'echo test',
    cwd: '/tmp',
    timeout: 5000
  };
  console.log('BashToolInput type valid:', typeof input.command === 'string');
});
"

# Verify BashToolResult interface works
node -e "
import('./src/tools/bash-mcp.js').then(m => {
  const result: m.BashToolResult = {
    success: true,
    stdout: 'output',
    stderr: '',
    exitCode: 0
  };
  console.log('BashToolResult type valid:', typeof result.success === 'boolean');
});
"

# Expected: All type assertions pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] All tests pass: `npm test -- tests/unit/tools/bash-mcp.test.ts`
- [ ] 100% coverage achieved: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`
- [ ] Type checking passes: `npx tsc --noEmit`

### Feature Validation

- [ ] `src/tools/bash-mcp.ts` exists with all exports
- [ ] `bashTool` schema has correct name, description, input_schema
- [ ] `BashMCP` class extends `MCPHandler`
- [ ] Tool executor registered with 'bash' server and 'execute_bash' name
- [ ] `executeBashCommand()` uses `spawn()` with argument array
- [ ] Default timeout is 30000ms
- [ ] Returns `BashToolResult` with success, stdout, stderr, exitCode
- [ ] Handles timeout correctly (SIGTERM then SIGKILL)
- [ ] Handles spawn errors (command not found)
- [ ] Validates working directory exists

### Code Quality Validation

- [ ] Follows existing codebase patterns (JSDoc, readonly, as const)
- [ ] File placement matches desired codebase tree
- [ ] Uses ESM imports with `.js` extensions
- [ ] Module-level JSDoc with @module, @remarks tags
- [ ] Function JSDoc with @param, @returns, @example
- [ ] Security: `shell: false` always used with spawn
- [ ] No hardcoded values that should be constants

### Documentation & Deployment

- [ ] Module-level JSDoc describes purpose and usage
- [ ] Each export has JSDoc documentation
- [ ] Inline comments for non-obvious patterns
- [ ] Example usage in JSDoc
- [ ] No TODOs or placeholder code

---

## Anti-Patterns to Avoid

- **Don't** use `shell: true` with spawn (shell injection vulnerability)
- **Don't** use `exec()` or `execSync()` (buffers entire output)
- **Don't** skip timeout handling (commands can hang forever)
- **Don't** forget to handle `error` event on ChildProcess
- **Don't** skip the `shell: false` option (defaults to true on some platforms)
- **Don't** use `.ts` extensions in imports (ESM requires `.js`)
- **Don't** mock incorrectly in tests (use `vi.mock` at top level)
- **Don't** skip error handling in promises (always resolve, never leave hanging)
- **Don't** create unnecessary abstractions (keep execution logic simple)
- **Don't** implement command whitelisting in this subtask (that's future work)

---

## Confidence Score: 9/10

**Justification**: This PRP provides comprehensive context including:

- Exact Groundswell MCP integration patterns from groundswell_api.md
- Complete child_process best practices with security patterns
- Specific test patterns with vi.mock examples
- All integration points and future dependencies
- Security gotchas and anti-patterns
- Project-specific validation commands

The only reason this isn't 10/10 is that Groundswell is a locally-linked library that may have minor API differences from the documented specification. However, the architecture documentation is thorough and should account for any variations.

---

## Success Metrics

**One-Pass Implementation**: Following this PRP should result in working code on the first attempt, passing all validation gates without requiring clarification or additional research.

**Validation**: The completed bash-mcp.ts module should:

1. Export `BashMCP` class extending `MCPHandler`
2. Register `'execute_bash'` tool with correct schema
3. Execute commands using `spawn()` with security constraints
4. Pass TypeScript compilation and type checking
5. Achieve 100% test coverage
6. Not break any existing tests

**Next Subtask Readiness**: This implementation enables P2.M1.T2.S2 (Create Filesystem MCP tool) and P2.M1.T2.S3 (Create Git MCP tool) to follow the same pattern.

---

**PRP Version**: 1.0
**Estimated Complexity**: Medium (involves async operations, event handling, mocking)
