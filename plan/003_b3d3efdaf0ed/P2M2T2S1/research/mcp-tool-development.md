# MCP Tool Development: Comprehensive Research Guide

**Research Date:** 2026-01-23
**Purpose:** Complete guide for developing MCP (Model Context Protocol) tools with Groundswell framework integration

---

## Table of Contents

1. [MCP Tool Architecture](#1-mcp-tool-architecture)
2. [Tool Schema Definition Standards](#2-tool-schema-definition-standards)
3. [Input Validation Patterns](#3-input-validation-patterns)
4. [Error Handling Best Practices](#4-error-handling-best-practices)
5. [Tool Executor Patterns](#5-tool-executor-patterns)
6. [Tool Registration with Groundswell Agents](#6-tool-registration-with-groundswell-agents)
7. [Security Considerations](#7-security-considerations)
8. [Custom Tool Examples](#8-custom-tool-examples)
9. [Testing MCP Tools](#9-testing-mcp-tools)
10. [Integration Examples with Agent Factories](#10-integration-examples-with-agent-factories)

---

## 1. MCP Tool Architecture

### 1.1 Overview

The Model Context Protocol (MCP) provides a standardized way to define and execute tools that AI agents can use. This codebase uses the **Groundswell framework** which provides a custom `MCPHandler` implementation rather than the standard FastMCP library.

### 1.2 Core Components

```typescript
// Three main components of MCP tool architecture:
// 1. Tool Schema - JSON Schema definition
// 2. Tool Executor - Implementation function
// 3. MCP Server - Registration and management

import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';
```

### 1.3 MCPHandler Base Class

All MCP servers extend `MCPHandler` which provides:

```typescript
class MCPHandler {
  // Registration methods
  registerServer(server: MCPServer): void;
  registerToolExecutor(
    serverName: string,
    toolName: string,
    executor: ToolExecutor
  ): void;

  // Tool discovery and execution
  getTools(): Tool[];
  hasTool(toolName: string): boolean;
  executeTool(toolName: string, input: unknown): Promise<ToolResult>;
}
```

### 1.4 Tool Lifecycle

```
1. Define Input/Result Interfaces
   ↓
2. Create Tool Schema (JSON Schema)
   ↓
3. Implement Tool Executor (async function)
   ↓
4. Extend MCPHandler and Register
   ↓
5. Export for Agent Integration
```

---

## 2. Tool Schema Definition Standards

### 2.1 Complete Tool Schema Structure

```typescript
const toolSchema: Tool = {
  name: 'tool_name',           // Required: snake_case identifier
  description: 'Clear description of what the tool does and when to use it',
  input_schema: {
    type: 'object',
    properties: {
      // Define all input parameters
      requiredParam: {
        type: 'string',
        description: 'Description of what this parameter does',
      },
      optionalParam: {
        type: 'boolean',
        description: 'Description of optional parameter',
        default: false,
      },
    },
    required: ['requiredParam'],  // Array of required property names
  },
};
```

### 2.2 JSON Schema Type Examples

#### String Properties

```typescript
{
  type: 'string',
  description: 'File path to read',
  minLength: 1,           // Optional: minimum length
  maxLength: 1000,        // Optional: maximum length
  pattern: '^[\\w\\-./]+$', // Optional: regex pattern
  format: 'uri',          // Optional: URI, email, date-time, etc.
  enum: ['utf-8', 'base64'], // Optional: enumerated values
}
```

#### Number Properties

```typescript
{
  type: 'number',
  description: 'Timeout in milliseconds',
  minimum: 1000,          // Inclusive minimum
  maximum: 300000,        // Inclusive maximum
  default: 30000,
}
```

#### Array Properties

```typescript
{
  type: 'array',
  description: 'List of files to process',
  items: {
    type: 'string',
  },
  minItems: 1,            // Minimum number of items
  maxItems: 100,          // Maximum number of items
  uniqueItems: true,      // All items must be unique
}
```

#### Object Properties

```typescript
{
  type: 'object',
  description: 'Configuration object',
  properties: {
    key1: { type: 'string' },
    key2: { type: 'number' },
  },
  required: ['key1'],
  additionalProperties: false, // No extra properties allowed
}
```

### 2.3 Tool Schema Examples from Codebase

#### File Read Tool

```typescript
// File: /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts
const fileReadTool: Tool = {
  name: 'file_read',
  description: 'Read file contents with optional encoding. Returns file content as string or error message.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to read',
      },
      encoding: {
        type: 'string',
        description: 'Encoding (default: utf-8)',
        enum: ['utf-8', 'utf16le', 'latin1', 'base64', 'hex'],
      },
    },
    required: ['path'],
  },
};
```

#### Git Commit Tool

```typescript
// File: /home/dustin/projects/hacky-hack/src/tools/git-mcp.ts
const gitCommitTool: Tool = {
  name: 'git_commit',
  description: 'Create a git commit with staged changes. Requires a commit message and returns the commit hash on success. Supports --allow-empty for creating commits without changes.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to git repository (optional, defaults to current directory)',
      },
      message: {
        type: 'string',
        description: 'Commit message (required)',
      },
      allowEmpty: {
        type: 'boolean',
        description: 'Allow empty commit (default: false)',
      },
    },
    required: ['message'],
  },
};
```

#### Bash Execute Tool

```typescript
// File: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts
const bashTool: Tool = {
  name: 'execute_bash',
  description: 'Execute shell commands with optional working directory and timeout. Returns stdout, stderr, exit code, and success status. Commands are executed safely using spawn() without shell interpretation.',
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
```

---

## 3. Input Validation Patterns

### 3.1 TypeScript Interface Pattern

Define strict input interfaces for type safety:

```typescript
interface FileReadInput {
  /** File path to read */
  path: string;
  /** Encoding (default: 'utf-8') */
  encoding?: BufferEncoding;
}

interface GitCommitInput {
  /** Path to git repository (optional, defaults to process.cwd()) */
  path?: string;
  /** Commit message (required) */
  message: string;
  /** Allow empty commit (default: false) */
  allowEmpty?: boolean;
}
```

### 3.2 Runtime Validation Pattern

#### Pattern 1: Synchronous Validation

```typescript
async function executeTool(input: ToolInput): Promise<ToolResult> {
  // Validate required fields
  if (!input.path || input.path.trim() === '') {
    return {
      success: false,
      error: 'Path is required and cannot be empty',
    };
  }

  // Validate string length
  if (input.message && input.message.length > 2000) {
    return {
      success: false,
      error: 'Message too long (max 2000 characters)',
    };
  }

  // Validate numeric ranges
  if (input.timeout && (input.timeout < 1000 || input.timeout > 300000)) {
    return {
      success: false,
      error: 'Timeout must be between 1000 and 300000 milliseconds',
    };
  }

  // Proceed with execution
  return await performOperation(input);
}
```

#### Pattern 2: Path Validation

```typescript
import { resolve, normalize, sep } from 'node:path';
import { existsSync, realpathSync } from 'node:fs';

async function validatePath(path: string): Promise<string> {
  // Resolve to absolute path
  const absolutePath = resolve(path);

  // Check path exists
  if (!existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${path}`);
  }

  // Resolve symlinks
  const realPath = realpathSync(absolutePath);

  return realPath;
}

// Usage in tool executor
async function readFile(input: FileReadInput): Promise<FileReadResult> {
  try {
    const safePath = await validatePath(input.path);
    const content = await fs.readFile(safePath, { encoding: 'utf-8' });
    return { success: true, content };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

#### Pattern 3: Repository Validation

```typescript
import { join } from 'node:path';

async function validateRepositoryPath(path?: string): Promise<string> {
  const repoPath = resolve(path ?? process.cwd());

  // Check path exists
  if (!existsSync(repoPath)) {
    throw new Error(`Repository path not found: ${repoPath}`);
  }

  // Check it's a git repository
  const gitDir = join(repoPath, '.git');
  if (!existsSync(gitDir)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  return realpathSync(repoPath);
}
```

### 3.3 Validation Checklist

```markdown
✓ Required fields are present and non-empty
✓ Types match expected values (string, number, boolean, array)
✓ String lengths are within bounds
✓ Numeric values are within allowed ranges
✓ Enum values are valid
✓ Paths exist and are accessible
✓ Files/directories have correct permissions
✓ Business logic preconditions are met
✓ No command injection vectors
✓ No path traversal attempts
```

---

## 4. Error Handling Best Practices

### 4.1 Standard Result Structure

All MCP tools should return structured results:

```typescript
interface ToolResult {
  /** True if operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  // ... result-specific properties
}
```

### 4.2 Error Handling Patterns

#### Pattern 1: Try-Catch with Error Code Handling

```typescript
async function readFile(input: FileReadInput): Promise<FileReadResult> {
  try {
    const safePath = resolve(input.path);
    const content = await fs.readFile(safePath, { encoding: input.encoding || 'utf-8' });
    return { success: true, content };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    // Handle specific error codes
    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${input.path}` };
    }
    if (errno === 'EACCES') {
      return { success: false, error: `Permission denied: ${input.path}` };
    }
    if (errno === 'EISDIR') {
      return { success: false, error: `Path is a directory: ${input.path}` };
    }

    // Generic error fallback
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

#### Pattern 2: Early Validation with Structured Errors

```typescript
async function gitCommit(input: GitCommitInput): Promise<GitCommitResult> {
  // Validate message before path validation (better UX)
  if (!input.message || input.message.trim() === '') {
    return {
      success: false,
      error: 'Commit message is required and cannot be empty',
    };
  }

  try {
    const safePath = await validateRepositoryPath(input.path);
    const git = simpleGit(safePath);

    // Check preconditions
    const status = await git.status();
    if (status.files.length === 0 && !input.allowEmpty) {
      return {
        success: false,
        error: 'No changes staged for commit. Use git_add to stage files first.',
      };
    }

    const result = await git.commit(input.message);
    return {
      success: true,
      commitHash: result.commit ?? undefined,
    };
  } catch (error) {
    // Handle specific git errors
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('nothing to commit')) {
      return {
        success: false,
        error: 'No changes staged for commit. Use git_add to stage files first.',
      };
    }
    if (msg.includes('merge conflict')) {
      return {
        success: false,
        error: 'Cannot commit with unresolved merge conflicts',
      };
    }
    return { success: false, error: msg };
  }
}
```

#### Pattern 3: Async Error Handling with Cleanup

```typescript
async function executeBashCommand(input: BashToolInput): Promise<BashToolResult> {
  const { command, cwd, timeout = DEFAULT_TIMEOUT } = input;

  // Validate working directory
  const workingDir = typeof cwd === 'string'
    ? (() => {
        const absoluteCwd = resolve(cwd);
        if (!existsSync(absoluteCwd)) {
          throw new Error(`Working directory does not exist: ${absoluteCwd}`);
        }
        return realpathSync(absoluteCwd);
      })()
    : undefined;

  let child: ChildProcess;

  // Handle spawn errors that throw synchronously
  try {
    child = spawn(executable, commandArgs, {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });
  } catch (error) {
    return Promise.resolve({
      success: false,
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // Set up timeout handler
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      // Force kill after grace period
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    // Handle process completion
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

    // Handle spawn errors
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
```

### 4.3 Common Error Codes

| Error Code | Description | Example Usage |
|------------|-------------|---------------|
| `ENOENT` | Entity not found | File or directory does not exist |
| `EACCES` | Permission denied | Insufficient permissions |
| `EISDIR` | Is a directory | Path is directory, not file |
| `ENOTDIR` | Not a directory | Path component not a directory |
| `EEXIST` | File exists | Directory/file already exists |
| `EINVAL` | Invalid argument | Invalid input parameter |

### 4.4 Error Message Best Practices

```typescript
// ❌ BAD: Vague error messages
return { success: false, error: 'Operation failed' };
return { success: false, error: 'Error occurred' };

// ✅ GOOD: Specific, actionable error messages
return { success: false, error: `File not found: ${path}` };
return { success: false, error: `Permission denied: ${path}. Check file permissions.` };
return { success: false, error: `Invalid timeout: ${timeout}. Must be between 1000-300000ms.` };
return { success: false, error: `Not a git repository: ${repoPath}. Initialize with 'git init'.` };
```

---

## 5. Tool Executor Patterns

### 5.1 Basic Executor Pattern

```typescript
async function executeTool(input: ToolInput): Promise<ToolResult> {
  try {
    // 1. Validate inputs
    if (!validateInput(input)) {
      return { success: false, error: 'Invalid input' };
    }

    // 2. Perform operation
    const result = await performOperation(input);

    // 3. Return success
    return { success: true, ...result };
  } catch (error) {
    // 4. Handle errors
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 5.2 Complete Executor Example

```typescript
async function grepSearch(input: GrepSearchInput): Promise<GrepSearchResult> {
  const { pattern, path, flags = '' } = input;

  try {
    // 1. Read file content
    const safePath = resolve(path);
    const content = await fs.readFile(safePath, { encoding: 'utf-8' });

    // 2. Validate regex pattern
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch (error) {
      return {
        success: false,
        error: `Invalid regex pattern: ${pattern}`,
      };
    }

    // 3. Search line by line
    const lines = content.split('\n');
    const matches: Array<{ line: number; content: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        matches.push({ line: i + 1, content: lines[i] });
      }
    }

    // 4. Return results
    return { success: true, matches };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${path}` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 5.3 Executor Type Definition

```typescript
type ToolExecutor = (
  input: unknown
) => Promise<ToolResult>;

// Cast your executor to ToolExecutor when registering
this.registerToolExecutor(
  'server_name',
  'tool_name',
  executeTool as ToolExecutor
);
```

---

## 6. Tool Registration with Groundswell Agents

### 6.1 MCP Server Class Pattern

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

export class CustomMCP extends MCPHandler {
  // Server metadata (required for MCPServer interface)
  public readonly name = 'custom';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [tool1, tool2, tool3];

  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // PATTERN: Register tool executors
    this.registerToolExecutor('custom', 'tool1', executeTool1 as ToolExecutor);
    this.registerToolExecutor('custom', 'tool2', executeTool2 as ToolExecutor);
    this.registerToolExecutor('custom', 'tool3', executeTool3 as ToolExecutor);
  }
}
```

### 6.2 Complete MCP Server Example

```typescript
/**
 * Filesystem MCP Tool Module
 *
 * @module tools/filesystem-mcp
 */
import { promises as fs } from 'node:fs';
import { resolve, normalize, sep } from 'node:path';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';
import fg from 'fast-glob';

// ===== INPUT INTERFACES =====
interface FileReadInput {
  path: string;
  encoding?: BufferEncoding;
}

interface FileWriteInput {
  path: string;
  content: string;
  createDirs?: boolean;
}

// ===== RESULT INTERFACES =====
interface FileReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

interface FileWriteResult {
  success: boolean;
  error?: string;
}

// ===== TOOL SCHEMAS =====
const fileReadTool: Tool = {
  name: 'file_read',
  description: 'Read file contents with optional encoding',
  input_schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to read' },
      encoding: {
        type: 'string',
        description: 'Encoding (default: utf-8)',
        enum: ['utf-8', 'utf16le', 'latin1', 'base64', 'hex'],
      },
    },
    required: ['path'],
  },
};

const fileWriteTool: Tool = {
  name: 'file_write',
  description: 'Write content to a file',
  input_schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to write' },
      content: { type: 'string', description: 'Content to write' },
      createDirs: {
        type: 'boolean',
        description: 'Create directories if needed (default: false)',
      },
    },
    required: ['path', 'content'],
  },
};

// ===== TOOL EXECUTORS =====
async function readFile(input: FileReadInput): Promise<FileReadResult> {
  try {
    const safePath = resolve(input.path);
    const content = await fs.readFile(safePath, {
      encoding: input.encoding || 'utf-8',
    });
    return { success: true, content };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;
    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${input.path}` };
    }
    if (errno === 'EACCES') {
      return { success: false, error: `Permission denied: ${input.path}` };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function writeFile(input: FileWriteInput): Promise<FileWriteResult> {
  try {
    const safePath = resolve(input.path);

    if (input.createDirs) {
      const dir = normalize(input.path).split(sep).slice(0, -1).join(sep);
      if (dir) {
        await fs.mkdir(dir, { recursive: true });
      }
    }

    await fs.writeFile(safePath, input.content, { encoding: 'utf-8' });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ===== MCP SERVER =====
export class FilesystemMCP extends MCPHandler {
  public readonly name = 'filesystem';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [fileReadTool, fileWriteTool];

  constructor() {
    super();
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });
    this.registerToolExecutor('filesystem', 'file_read', readFile as ToolExecutor);
    this.registerToolExecutor('filesystem', 'file_write', writeFile as ToolExecutor);
  }
}

// Export types and tools for external use
export type { FileReadInput, FileWriteInput, FileReadResult, FileWriteResult };
export { fileReadTool, fileWriteTool, readFile, writeFile };
```

### 6.3 Agent Factory Integration

```typescript
// File: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
import { BashMCP } from '../tools/bash-mcp.js';
import { FilesystemMCP } from '../tools/filesystem-mcp.js';
import { GitMCP } from '../tools/git-mcp.js';

// Singleton MCP server instances
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();

// Combined array of all MCP tools for agent integration
const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP];

export function createCoderAgent(): Agent {
  const baseConfig = createBaseConfig('coder');
  const config = {
    ...baseConfig,
    system: PRP_BUILDER_PROMPT,
    mcps: MCP_TOOLS, // Inject MCP servers
  };
  return createAgent(config);
}
```

### 6.4 Tool Naming Convention

Groundswell automatically prefixes tool names with the server name:

```typescript
// Tool schema name: 'file_read'
// Server name: 'filesystem'
// Final tool name: 'filesystem__file_read'

// Tool schema name: 'execute_bash'
// Server name: 'bash'
// Final tool name: 'bash__execute_bash'

// Tool schema name: 'git_status'
// Server name: 'git'
// Final tool name: 'git__git_status'
```

### 6.5 Transport Types

```typescript
type Transport = 'inprocess' | 'stdio' | 'http';

// 'inprocess' - Local execution in same process (used in this codebase)
// 'stdio' - Communication via standard input/output
// 'http' - Communication via HTTP endpoints

export class CustomMCP extends MCPHandler {
  public readonly transport = 'inprocess' as const; // Recommended for this codebase
}
```

---

## 7. Security Considerations

### 7.1 Path Traversal Prevention

```typescript
import { resolve, normalize } from 'node:path';

// ❌ BAD: Allows path traversal
async function badReadFile(path: string) {
  return await fs.readFile(path); // ../../../etc/passwd
}

// ✅ GOOD: Resolves and validates paths
async function goodReadFile(path: string) {
  const safePath = resolve(path);
  const normalizedBase = normalize(baseDirectory);

  // Check path is within allowed directory
  if (!safePath.startsWith(normalizedBase)) {
    throw new Error('Path traversal detected');
  }

  return await fs.readFile(safePath);
}
```

### 7.2 Command Injection Prevention

```typescript
import { spawn } from 'node:child_process';

// ❌ BAD: Shell interpretation allows injection
function badExecute(command: string) {
  return exec(`git ${command}`); // command could be "; rm -rf /"
}

// ✅ GOOD: Use argument arrays with shell: false
function goodExecute(args: string[]) {
  return spawn('git', args, {
    shell: false, // Critical: no shell interpretation
  });
}

// Example usage
await goodExecute(['commit', '-m', userMessage]); // Safe even with special chars
```

### 7.3 Git Argument Sanitization

```typescript
// ✅ GOOD: Use '--' separator to prevent flag injection
async function gitAdd(input: GitAddInput): Promise<GitAddResult> {
  const files = input.files ?? ['.'];

  if (files.length === 1 && files[0] === '.') {
    await git.add('.');
  } else {
    // CRITICAL: Use '--' to prevent files starting with '-' from being flags
    await git.add(['--', ...files]);
  }

  return { success: true, stagedCount: files.length };
}
```

### 7.4 Resource Limits and Timeouts

```typescript
// Enforce timeout limits
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MIN_TIMEOUT = 1000;       // 1 second
const MAX_TIMEOUT = 300000;     // 5 minutes

async function executeWithTimeout(input: ToolInput): Promise<ToolResult> {
  const timeout = Math.min(
    Math.max(input.timeout || DEFAULT_TIMEOUT, MIN_TIMEOUT),
    MAX_TIMEOUT
  );

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');

    // Force kill after grace period
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, 2000);
  }, timeout);

  // ... execute command

  child.on('close', () => {
    clearTimeout(timeoutId);
    if (timedOut) {
      result.error = `Command timed out after ${timeout}ms`;
    }
  });
}
```

### 7.5 Permission Management

```typescript
import { access, constants } from 'node:fs/promises';

async function checkPermissions(path: string): Promise<boolean> {
  try {
    // Check read permission
    await access(path, constants.R_OK);

    // Check write permission if needed
    await access(path, constants.W_OK);

    return true;
  } catch {
    return false;
  }
}

// Usage in tool executor
async function writeFile(input: FileWriteInput): Promise<FileWriteResult> {
  const safePath = resolve(input.path);

  // Check parent directory permissions
  const dir = dirname(safePath);
  if (!(await checkPermissions(dir))) {
    return {
      success: false,
      error: `Permission denied: Cannot write to ${dir}`,
    };
  }

  // Proceed with write operation
}
```

### 7.6 Security Checklist

```markdown
✓ Path traversal prevention with resolve() and validation
✓ Command injection prevention with argument arrays and shell: false
✓ Input sanitization for user-provided data
✓ Resource limits enforced (timeouts, file sizes, memory)
✓ Permission checks before operations
✓ No sensitive data in error messages
✓ Safe handling of special characters and regex patterns
✓ Validation of enum values and ranges
✓ Protection against denial-of-service (file size, iteration limits)
✓ Secure temporary file handling
```

---

## 8. Custom Tool Examples

### 8.1 File System Tools

#### Directory Listing Tool

```typescript
interface ListDirectoryInput {
  path: string;
  recursive?: boolean;
  includeHidden?: boolean;
}

interface ListDirectoryResult {
  success: boolean;
  entries?: Array<{
    name: string;
    type: 'file' | 'directory';
    size?: number;
  }>;
  error?: string;
}

const listDirectoryTool: Tool = {
  name: 'list_directory',
  description: 'List contents of a directory',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path to list',
      },
      recursive: {
        type: 'boolean',
        description: 'List recursively (default: false)',
        default: false,
      },
      includeHidden: {
        type: 'boolean',
        description: 'Include hidden files (default: false)',
        default: false,
      },
    },
    required: ['path'],
  },
};

async function listDirectory(input: ListDirectoryInput): Promise<ListDirectoryResult> {
  try {
    const safePath = resolve(input.path);

    if (!existsSync(safePath)) {
      return { success: false, error: `Directory not found: ${input.path}` };
    }

    const entries: Array<{
      name: string;
      type: 'file' | 'directory';
      size?: number;
    }> = [];

    const files = await fg('**/*', {
      cwd: safePath,
      absolute: false,
      onlyFiles: false,
      dot: input.includeHidden ?? false,
      deep: input.recursive ? Infinity : 1,
    });

    for (const file of files) {
      const fullPath = join(safePath, file);
      const stats = await fs.stat(fullPath);

      entries.push({
        name: file,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.isFile() ? stats.size : undefined,
      });
    }

    return { success: true, entries };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 8.2 Database Tools

#### SQLite Query Tool

```typescript
import Database from 'better-sqlite3';

interface DatabaseQueryInput {
  databasePath: string;
  query: string;
  params?: unknown[];
}

interface DatabaseQueryResult {
  success: boolean;
  rows?: unknown[];
  changes?: number;
  error?: string;
}

const databaseQueryTool: Tool = {
  name: 'database_query',
  description: 'Execute SQL query on SQLite database',
  input_schema: {
    type: 'object',
    properties: {
      databasePath: {
        type: 'string',
        description: 'Path to SQLite database file',
      },
      query: {
        type: 'string',
        description: 'SQL query to execute (SELECT only)',
      },
      params: {
        type: 'array',
        description: 'Query parameters for prepared statements',
        items: {},
      },
    },
    required: ['databasePath', 'query'],
  },
};

async function databaseQuery(input: DatabaseQueryInput): Promise<DatabaseQueryResult> {
  try {
    const safePath = resolve(input.databasePath);

    if (!existsSync(safePath)) {
      return { success: false, error: `Database not found: ${input.databasePath}` };
    }

    // Security: Only allow SELECT queries
    const trimmedQuery = input.query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      return {
        success: false,
        error: 'Only SELECT queries are allowed',
      };
    }

    const db = new Database(safePath, { readonly: true });
    const stmt = db.prepare(input.query);

    let rows: unknown[];
    if (input.params && input.params.length > 0) {
      rows = stmt.all(...input.params);
    } else {
      rows = stmt.all();
    }

    db.close();

    return { success: true, rows };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 8.3 API Integration Tools

#### HTTP Request Tool

```typescript
import https from 'node:https';
import http from 'node:http';

interface HttpRequestInput {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface HttpRequestResult {
  success: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
}

const httpRequestTool: Tool = {
  name: 'http_request',
  description: 'Make HTTP/HTTPS request',
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to request',
        format: 'uri',
      },
      method: {
        type: 'string',
        description: 'HTTP method',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET',
      },
      headers: {
        type: 'object',
        description: 'HTTP headers',
      },
      body: {
        type: 'string',
        description: 'Request body (for POST/PUT)',
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        minimum: 1000,
        maximum: 60000,
        default: 10000,
      },
    },
    required: ['url'],
  },
};

async function httpRequest(input: HttpRequestInput): Promise<HttpRequestResult> {
  return new Promise((resolve, reject) => {
    const url = new URL(input.url);
    const client = url.protocol === 'https:' ? https : http;
    const timeout = input.timeout || 10000;

    const options = {
      method: input.method || 'GET',
      headers: input.headers || {},
      timeout,
    };

    const req = client.request(input.url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          headers: res.headers as Record<string, string>,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: `Request timed out after ${timeout}ms`,
      });
    });

    if (input.body) {
      req.write(input.body);
    }

    req.end();
  });
}
```

### 8.4 Custom Domain-Specific Tools

#### Code Analysis Tool

```typescript
interface CodeAnalysisInput {
  path: string;
  language?: 'typescript' | 'javascript' | 'python';
  analysisType: 'complexity' | 'coverage' | 'dependencies';
}

interface CodeAnalysisResult {
  success: boolean;
  results?: {
    complexity?: number;
    coverage?: number;
    dependencies?: string[];
  };
  error?: string;
}

const codeAnalysisTool: Tool = {
  name: 'code_analysis',
  description: 'Analyze code complexity, coverage, or dependencies',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to code file or directory',
      },
      language: {
        type: 'string',
        description: 'Programming language',
        enum: ['typescript', 'javascript', 'python'],
      },
      analysisType: {
        type: 'string',
        description: 'Type of analysis to perform',
        enum: ['complexity', 'coverage', 'dependencies'],
      },
    },
    required: ['path', 'analysisType'],
  },
};

async function codeAnalysis(input: CodeAnalysisInput): Promise<CodeAnalysisResult> {
  try {
    const safePath = resolve(input.path);

    if (!existsSync(safePath)) {
      return { success: false, error: `Path not found: ${input.path}` };
    }

    // Perform analysis based on type
    switch (input.analysisType) {
      case 'complexity':
        // Calculate cyclomatic complexity
        return { success: true, results: { complexity: 5 } };

      case 'coverage':
        // Run coverage analysis
        return { success: true, results: { coverage: 85.5 } };

      case 'dependencies':
        // Extract dependencies
        return {
          success: true,
          results: { dependencies: ['lodash', 'axios'] },
        };

      default:
        return { success: false, error: 'Unknown analysis type' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

---

## 9. Testing MCP Tools

### 9.1 Unit Testing Pattern

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock external dependencies
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

import { promises as fs } from 'node:fs';
import { CustomMCP, executeTool } from '../../../src/tools/custom-mcp.js';

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);

describe('tools/custom-mcp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('toolSchema', () => {
    it('should have correct tool name', () => {
      expect(toolSchema.name).toBe('tool_name');
    });

    it('should require required_property', () => {
      expect(toolSchema.input_schema.required).toContain('required_property');
    });
  });

  describe('executeTool', () => {
    describe('successful operations', () => {
      it('should execute with valid input', async () => {
        // SETUP
        mockReadFile.mockResolvedValue('file content');
        const input: ToolInput = { path: './test.txt' };

        // EXECUTE
        const result = await executeTool(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('error handling', () => {
      it('should handle file not found', async () => {
        // SETUP
        const error = new Error('Not found') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        mockReadFile.mockRejectedValue(error);

        // EXECUTE
        const result = await executeTool({ path: './missing.txt' });

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('File not found');
      });
    });
  });
});
```

### 9.2 Integration Testing Pattern

```typescript
describe('MCP Integration', () => {
  it('should register and execute tool', async () => {
    // SETUP
    const mcp = new CustomMCP();
    mockReadFile.mockResolvedValue('content');

    // EXECUTE
    const result = await mcp.executeTool('custom__tool_name', {
      path: './test.txt',
    });

    // VERIFY
    expect(result.success).toBe(true);
  });
});
```

---

## 10. Integration Examples with Agent Factories

### 10.1 Complete Agent Factory Example

```typescript
import { createAgent, type Agent, type MCPServer } from 'groundswell';
import { CustomMCP } from '../tools/custom-mcp.js';

// Singleton MCP instances
const CUSTOM_MCP = new CustomMCP();
const MCP_TOOLS: MCPServer[] = [CUSTOM_MCP];

export function createCustomAgent(): Agent {
  const config = {
    name: 'CustomAgent',
    system: 'You are a custom agent with specialized tools.',
    model: 'GLM-4.7',
    enableCache: true,
    enableReflection: true,
    maxTokens: 4096,
    mcps: MCP_TOOLS, // Register MCP servers
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };

  return createAgent(config);
}
```

### 10.2 Multi-Agent Tool Sharing

```typescript
// Share same MCP tools across multiple agents
export function createAgentWithMCPs(persona: string): Agent {
  const config = {
    name: `${persona}Agent`,
    system: getSystemPrompt(persona),
    model: 'GLM-4.7',
    maxTokens: getTokenLimit(persona),
    mcps: MCP_TOOLS, // All agents share same tools
  };

  return createAgent(config);
}

export const architectAgent = createAgentWithMCPs('architect');
export const coderAgent = createAgentWithMCPs('coder');
export const qaAgent = createAgentWithMCPs('qa');
```

---

## Summary and Best Practices

### Key Takeaways

1. **Always use structured results** with `success: boolean`
2. **Validate inputs thoroughly** before processing
3. **Handle specific error codes** for actionable error messages
4. **Prevent security vulnerabilities** (path traversal, command injection)
5. **Use argument arrays with spawn()** and `shell: false`
6. **Register tools in constructor** following MCPHandler pattern
7. **Use snake_case for tool names** with descriptive verbs
8. **Enforce resource limits** (timeouts, file sizes)
9. **Test all error paths** with proper mocking
10. **Document tools comprehensively** with JSDoc comments

### Quick Reference Template

```typescript
// 1. Define interfaces
interface ToolInput {
  required: string;
  optional?: string;
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// 2. Create schema
const toolSchema: Tool = {
  name: 'tool_name',
  description: 'Clear description',
  input_schema: {
    type: 'object',
    properties: {
      required: { type: 'string' },
      optional: { type: 'string' },
    },
    required: ['required'],
  },
};

// 3. Implement executor
async function executeTool(input: ToolInput): Promise<ToolResult> {
  try {
    // Validate
    if (!input.required) {
      return { success: false, error: 'Required field missing' };
    }

    // Execute
    const result = await performOperation(input);

    // Return success
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// 4. Create MCP server
export class CustomMCP extends MCPHandler {
  public readonly name = 'custom';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [toolSchema];

  constructor() {
    super();
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });
    this.registerToolExecutor('custom', 'tool_name', executeTool as ToolExecutor);
  }
}

// 5. Export
export type { ToolInput, ToolResult };
export { toolSchema, executeTool };
```

---

**End of Research Document**

**Last Updated:** 2026-01-23
**Researcher:** Claude Code Agent
**For:** P2M2T2S1 - MCP Tool Development Research

## Resources and References

### Official MCP Documentation
- **MCP Specification:** https://spec.modelcontextprotocol.io/specification/
- **Tools Guide:** https://spec.modelcontextprotocol.io/specification/tools/
- **TypeScript SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Official Servers:** https://github.com/modelcontextprotocol/servers

### Groundswell Framework
- **Repository:** https://github.com/groundswell-ai/groundswell
- **Local Path:** `~/projects/groundswell`

### Codebase Examples
- **BashMCP:** `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`
- **FilesystemMCP:** `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts`
- **GitMCP:** `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts`
- **Agent Factory:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

### Test Examples
- **Bash Tests:** `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts`
- **Filesystem Tests:** `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts`
- **MCP Integration:** `/home/dustin/projects/hacky-hack/tests/integration/groundswell/mcp.test.ts`
