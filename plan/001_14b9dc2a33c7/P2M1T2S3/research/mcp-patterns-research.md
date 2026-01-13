# MCP Tool Patterns and Best Practices Research

**Research Date:** 2026-01-12
**Purpose:** Comprehensive guide for implementing Git MCP tool following Model Context Protocol standards

---

## Table of Contents

1. [Official MCP Documentation](#1-official-mcp-documentation)
2. [FastMCP Library](#2-fastmcp-library)
3. [Tool Definition Patterns](#3-tool-definition-patterns)
4. [Error Handling Patterns](#4-error-handling-patterns)
5. [Tool Naming Conventions](#5-tool-naming-conventions)
6. [Input Validation Best Practices](#6-input-validation-best-practices)
7. [Reference Implementations](#7-reference-implementations)

---

## 1. Official MCP Documentation

### 1.1 Model Context Protocol Specification

**Official Repository:** https://github.com/modelcontextprotocol/specification

**Key Documentation Sections:**

#### Core Specification

- **URL:** https://spec.modelcontextprotocol.io/specification/
- **Anchors:**
  - `#tools` - Tool definition and execution
  - `#tools/schema` - JSON Schema for tool inputs
  - `#tools/execution` - Tool execution protocol
  - `#errors` - Standard error codes and handling

#### Tools Specification

- **URL:** https://spec.modelcontextprotocol.io/specification/tools/
- **Anchors:**
  - `#tool-definition` - Tool schema structure
  - `#input-validation` - Validation requirements
  - `#output-format` - Response structure
  - `#error-handling` - Error response format

#### Server Implementation Guide

- **URL:** https://spec.modelcontextprotocol.io/specification/server/
- **Anchors:**
  - `#registration` - Tool registration
  - `#lifecycle` - Server lifecycle
  - `#capabilities` - Capability negotiation

### 1.2 MCP TypeScript SDK

**Official Repository:** https://github.com/modelcontextprotocol/typescript-sdk

**Documentation:**

- **Getting Started:** https://modelcontextprotocol.io/docs/tools/creating-tools
- **Tool Development:** https://modelcontextprotocol.io/docs/tools/tool-basics
- **Server Implementation:** https://modelcontextprotocol.io/docs/servers

### 1.3 Groundswell MCP Integration (Used in This Project)

**Repository:** https://github.com/groundswell-ai/groundswell
**Local Path:** `~/projects/groundswell`
**Documentation:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T3S2/research/groundswell_docs.md`

**Key Exports:**

```typescript
import { MCPHandler, Tool, ToolExecutor } from 'groundswell';
```

---

## 2. FastMCP Library

### 2.1 Overview

**Note:** This codebase does NOT use FastMCP. It uses the Groundswell framework which has its own MCPHandler implementation.

**FastMCP Repository:** https://github.com/jlowin/fastmcp

**FastMCP is a Python library** for quickly building MCP servers with:

- Decorator-based tool registration
- Automatic schema generation
- Type hints for validation
- Built-in error handling

### 2.2 FastMCP Pattern (For Reference)

```python
from fastmcp import FastMCP

mcp = FastMCP("git-server")

@mcp.tool()
def git_status(repo_path: str) -> str:
    """Get git status of a repository."""
    # Implementation
    pass

@mcp.tool()
def git_commit(repo_path: str, message: str) -> str:
    """Create a git commit."""
    # Implementation
    pass
```

### 2.3 Groundswell Alternative (Used in This Project)

This codebase uses Groundswell's `MCPHandler` class pattern:

```typescript
import { MCPHandler, Tool, ToolExecutor } from 'groundswell';

export class GitMCP extends MCPHandler {
  constructor() {
    super();

    this.registerServer({
      name: 'git',
      transport: 'inprocess',
      tools: [gitStatusTool, gitCommitTool],
    });

    this.registerToolExecutor('git', 'git_status', executeGitStatus);
  }
}
```

---

## 3. Tool Definition Patterns

### 3.1 Tool Schema Structure

Based on the Bash and Filesystem MCP implementations in this codebase:

#### Complete Tool Schema Example

```typescript
import { Tool } from 'groundswell';

interface GitStatusInput {
  repoPath: string;
  showUntracked?: boolean;
}

interface GitStatusResult {
  success: boolean;
  branch?: string;
  modified?: string[];
  untracked?: string[];
  error?: string;
}

const gitStatusTool: Tool = {
  name: 'git_status',
  description:
    'Get the current git status of a repository. ' +
    'Returns branch name, modified files, and untracked files.',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: {
        type: 'string',
        description: 'Path to the git repository',
      },
      showUntracked: {
        type: 'boolean',
        description: 'Include untracked files in output',
        default: false,
      },
    },
    required: ['repoPath'],
  },
};
```

### 3.2 Tool Executor Pattern

```typescript
async function executeGitStatus(
  input: GitStatusInput
): Promise<GitStatusResult> {
  const { repoPath, showUntracked = false } = input;

  try {
    // Validate input
    const safePath = resolve(repoPath);
    if (!existsSync(safePath)) {
      return {
        success: false,
        error: `Repository not found: ${repoPath}`,
      };
    }

    // Execute git command
    const result = await spawnGit('status', ['--porcelain'], safePath);

    // Parse output
    const { branch, modified, untracked } = parseGitStatus(result);

    return {
      success: true,
      branch,
      modified: showUntracked ? modified : undefined,
      untracked: showUntracked ? untracked : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 3.3 MCP Server Registration Pattern

```typescript
export class GitMCP extends MCPHandler {
  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: 'git',
      transport: 'inprocess',
      tools: [gitStatusTool, gitCommitTool, gitDiffTool, gitLogTool],
    });

    // PATTERN: Register tool executors
    this.registerToolExecutor(
      'git',
      'git_status',
      executeGitStatus as ToolExecutor
    );
    this.registerToolExecutor(
      'git',
      'git_commit',
      executeGitCommit as ToolExecutor
    );
    this.registerToolExecutor(
      'git',
      'git_diff',
      executeGitDiff as ToolExecutor
    );
    this.registerToolExecutor('git', 'git_log', executeGitLog as ToolExecutor);
  }
}
```

### 3.4 Multiple Related Tools Pattern

For Git MCP, you'll have multiple related operations:

```typescript
// Define all tool schemas
const gitTools: Tool[] = [
  {
    name: 'git_status',
    description: 'Get git repository status',
    input_schema: {
      /* ... */
    },
  },
  {
    name: 'git_add',
    description: 'Stage files for commit',
    input_schema: {
      /* ... */
    },
  },
  {
    name: 'git_commit',
    description: 'Create a new commit',
    input_schema: {
      /* ... */
    },
  },
  {
    name: 'git_diff',
    description: 'Show changes between commits',
    input_schema: {
      /* ... */
    },
  },
  {
    name: 'git_log',
    description: 'Show commit history',
    input_schema: {
      /* ... */
    },
  },
  {
    name: 'git_checkout',
    description: 'Switch branches or restore files',
    input_schema: {
      /* ... */
    },
  },
  {
    name: 'git_branch',
    description: 'List or create branches',
    input_schema: {
      /* ... */
    },
  },
  {
    name: 'git_push',
    description: 'Push commits to remote',
    input_schema: {
      /* ... */
    },
  },
];
```

---

## 4. Error Handling Patterns

### 4.1 Standard Error Response Structure

Based on existing implementations, MCP tools should return:

```typescript
interface ToolResult {
  success: boolean;
  // ... success fields
  error?: string;
}
```

### 4.2 Error Handling Patterns from Bash MCP

**File:** `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`

```typescript
async function executeBashCommand(
  input: BashToolInput
): Promise<BashToolResult> {
  const { command, cwd, timeout = DEFAULT_TIMEOUT } = input;

  // PATTERN: Validate working directory exists
  const workingDir =
    typeof cwd === 'string'
      ? (() => {
          const absoluteCwd = resolve(cwd);
          if (!existsSync(absoluteCwd)) {
            throw new Error(`Working directory does not exist: ${absoluteCwd}`);
          }
          return realpathSync(absoluteCwd);
        })()
      : undefined;

  // CRITICAL: Handle spawn errors that throw synchronously
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
```

### 4.3 Error Handling Patterns from Filesystem MCP

**File:** `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts`

```typescript
async function readFile(input: FileReadInput): Promise<FileReadResult> {
  const { path, encoding = DEFAULT_ENCODING } = input;

  try {
    // PATTERN: Validate and normalize path
    const safePath = resolve(path);

    // PATTERN: Read file with encoding
    const content = await fs.readFile(safePath, { encoding });

    return { success: true, content };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    // PATTERN: Handle specific error codes
    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${path}` };
    }
    if (errno === 'EACCES') {
      return { success: false, error: `Permission denied: ${path}` };
    }
    if (errno === 'EISDIR') {
      return { success: false, error: `Path is a directory: ${path}` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 4.4 Common Error Codes for Git MCP

```typescript
// Git-specific error handling
const GIT_ERRORS = {
  NOT_REPOSITORY: 'not a git repository',
  NO_COMMIT: 'does not have any commits yet',
  NOTHING_TO_COMMIT: 'nothing to commit',
  MERGE_CONFLICT: 'merge conflict',
  DETACHED_HEAD: 'detached HEAD',
  PERMISSION_DENIED: 'permission denied',
  BRANCH_NOT_FOUND: 'branch not found',
  REMOTE_NOT_FOUND: 'remote not found',
} as const;

async function executeGitStatus(
  input: GitStatusInput
): Promise<GitStatusResult> {
  try {
    const result = await spawnGit('status', ['--porcelain'], input.repoPath);
    return { success: true /* ... */ };
  } catch (error) {
    const stderr = error.stderr || '';

    // PATTERN: Provide actionable error messages
    if (stderr.includes('not a git repository')) {
      return {
        success: false,
        error: `Not a git repository: ${input.repoPath}`,
      };
    }

    if (stderr.includes('permission denied')) {
      return {
        success: false,
        error: `Permission denied accessing git repository`,
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown git error',
    };
  }
}
```

### 4.5 Error Handling Best Practices Summary

1. **Always return structured errors with `success: boolean`**
2. **Include specific error codes or messages**
3. **Handle both synchronous and asynchronous errors**
4. **Validate inputs before processing**
5. **Provide actionable error messages**
6. **Distinguish between different failure types**
7. **Never expose sensitive information in errors**

---

## 5. Tool Naming Conventions

### 5.1 MCP Tool Naming Standard

**Pattern:** `<server_name>_<tool_action>`

**Examples from existing codebase:**

- `bash__execute_bash` (note: double underscore)
- `filesystem__file_read`
- `filesystem__file_write`
- `filesystem__glob_files`
- `filesystem__grep_search`

### 5.2 Git MCP Tool Naming

Recommended tool names for Git MCP:

```typescript
const gitToolNames = {
  STATUS: 'git_status',
  ADD: 'git_add',
  COMMIT: 'git_commit',
  DIFF: 'git_diff',
  LOG: 'git_log',
  CHECKOUT: 'git_checkout',
  BRANCH: 'git_branch',
  PUSH: 'git_push',
  PULL: 'git_pull',
  MERGE: 'git_merge',
  REBASE: 'git_rebase',
  RESET: 'git_reset',
  RESTORE: 'git_restore',
  STASH: 'git_stash',
  CLONE: 'git_clone',
  FETCH: 'git_fetch',
  REMOTE: 'git_remote',
  SHOW: 'git_show',
  BLAME: 'git_blame',
} as const;
```

### 5.3 Naming Convention Rules

1. **Use lowercase with underscores**
2. **Prefix with category (e.g., `git_`)**
3. **Use verb for actions (e.g., `git_commit`, not `git_commitment`)**
4. **Be specific but concise**
5. **Match git CLI terminology where possible**
6. **Group related operations with common prefix**

### 5.4 Bad vs. Good Names

```typescript
// BAD: Too vague
const bad1 = { name: 'do_git' };
const bad2 = { name: 'status' };
const bad3 = { name: 'git_operation' };

// GOOD: Clear and specific
const good1 = { name: 'git_status' };
const good2 = { name: 'git_commit' };
const good3 = { name: 'git_push' };

// BAD: CamelCase
const bad4 = { name: 'gitStatus' };

// GOOD: snake_case
const good4 = { name: 'git_status' };

// BAD: Too long
const bad5 = { name: 'git_get_repository_status_information' };

// GOOD: Concise but clear
const good5 = { name: 'git_status' };
```

---

## 6. Input Validation Best Practices

### 6.1 JSON Schema Validation Patterns

From existing implementations:

```typescript
const gitCommitTool: Tool = {
  name: 'git_commit',
  description: 'Create a git commit with staged changes',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: {
        type: 'string',
        description: 'Path to the git repository',
      },
      message: {
        type: 'string',
        description: 'Commit message',
        minLength: 1,
        maxLength: 2000,
      },
      allowEmpty: {
        type: 'boolean',
        description: 'Allow empty commit',
        default: false,
      },
      amend: {
        type: 'boolean',
        description: 'Amend previous commit',
        default: false,
      },
    },
    required: ['repoPath', 'message'],
  },
};
```

### 6.2 Input Validation Patterns

#### Pattern 1: Type Validation with Zod

```typescript
import { z } from 'zod';

const GitCommitInputSchema = z.object({
  repoPath: z.string().min(1, 'Repository path is required'),
  message: z.string().min(1, 'Commit message is required').max(2000),
  allowEmpty: z.boolean().optional().default(false),
  amend: z.boolean().optional().default(false),
});

type GitCommitInput = z.infer<typeof GitCommitInputSchema>;

async function executeGitCommit(rawInput: unknown): Promise<GitCommitResult> {
  // PATTERN: Validate input schema
  const input = GitCommitInputSchema.parse(rawInput);

  // Proceed with validated input
  // ...
}
```

#### Pattern 2: Manual Validation

```typescript
async function executeGitCommit(
  input: GitCommitInput
): Promise<GitCommitResult> {
  const { repoPath, message } = input;

  // PATTERN: Validate required fields
  if (!repoPath || repoPath.trim() === '') {
    return {
      success: false,
      error: 'Repository path is required',
    };
  }

  // PATTERN: Validate string length
  if (message.length > 2000) {
    return {
      success: false,
      error: 'Commit message too long (max 2000 characters)',
    };
  }

  // PATTERN: Validate file system path
  const safePath = resolve(repoPath);
  if (!existsSync(safePath)) {
    return {
      success: false,
      error: `Repository not found: ${repoPath}`,
    };
  }

  // PATTERN: Validate git repository
  const gitDir = join(safePath, '.git');
  if (!existsSync(gitDir)) {
    return {
      success: false,
      error: `Not a git repository: ${repoPath}`,
    };
  }

  // Proceed with execution
  // ...
}
```

### 6.3 Security Validation Patterns

#### Path Traversal Prevention

```typescript
import { resolve, normalize } from 'node:path';

function validatePath(userPath: string, basePath?: string): string {
  // PATTERN: Resolve to absolute path
  const absolutePath = resolve(userPath);

  // PATTERN: Check against base directory if specified
  if (basePath) {
    const resolvedBase = resolve(basePath);
    const relativePath = relative(resolvedBase, absolutePath);

    // PATTERN: Prevent path traversal
    if (relativePath.startsWith('..')) {
      throw new Error('Path traversal detected');
    }
  }

  return absolutePath;
}
```

#### Command Injection Prevention

```typescript
import { spawn } from 'node:child_process';

// BAD: Direct string interpolation (vulnerable)
function badExecute(command: string) {
  // DON'T DO THIS
  const cmd = `git ${command}`; // Injection risk
  return exec(cmd); // Shell interpretation
}

// GOOD: Use argument arrays
function goodExecute(args: string[]) {
  // PATTERN: Use spawn with argument array
  return spawn('git', args, {
    shell: false, // Critical: no shell interpretation
  });
}

// Example usage
await goodExecute(['status', '--porcelain']);
await goodExecute(['commit', '-m', message]); // Safe even if message has quotes
```

#### Git Argument Sanitization

```typescript
function sanitizeGitMessage(message: string): string {
  // PATTERN: Remove shell metacharacters
  return message
    .replace(/[;&|`$()]/g, '') // Remove shell operators
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}

// Better: Pass as argument array
function commitWithMessage(repoPath: string, message: string) {
  return spawn('git', ['commit', '-m', message], {
    cwd: repoPath,
    shell: false, // Safe when using argument array
  });
}
```

### 6.4 Business Logic Validation

```typescript
async function executeGitCommit(
  input: GitCommitInput
): Promise<GitCommitResult> {
  // ... previous validations

  // PATTERN: Check preconditions
  const statusResult = await executeGitStatus({ repoPath: input.repoPath });

  if (!statusResult.success) {
    return statusResult; // Forward the error
  }

  // PATTERN: Validate business rules
  if (statusResult.staged?.length === 0 && !input.allowEmpty) {
    return {
      success: false,
      error: 'No changes staged for commit. Use git_add to stage files first.',
    };
  }

  if (input.amend && statusResult.hasUnpushedCommits) {
    return {
      success: false,
      error: 'Cannot amend commits that have already been pushed',
    };
  }

  // Proceed with commit
  // ...
}
```

### 6.5 Input Validation Checklist

- [ ] Required fields are present
- [ ] Types are correct (string, number, boolean, etc.)
- [ ] String lengths are within bounds
- [ ] Enum values are valid
- [ ] Numeric ranges are respected
- [ ] Paths are normalized and safe
- [ ] File system paths exist
- [ ] Git repository is valid
- [ ] Preconditions are met (staged files exist, etc.)
- [ ] Business rules are satisfied
- [ ] No command injection vulnerabilities
- [ ] No path traversal vulnerabilities

---

## 7. Reference Implementations

### 7.1 Official MCP Servers Repository

**GitHub:** https://github.com/modelcontextprotocol/servers

**Contains reference implementations:**

- `@modelcontextprotocol/server-filesystem` - File operations
- `@modelcontextprotocol/server-github` - GitHub API integration
- `@modelcontextprotocol/server-git` - Git operations
- `@modelcontextprotocol/server-sqlite` - SQLite database
- `@modelcontextprotocol/server-postgres` - PostgreSQL database
- `@modelcontextprotocol/server-brave-search` - Web search
- `@modelcontextprotocol/server-fetch` - HTTP requests

### 7.2 Official Git MCP Server

**Repository:** https://github.com/modelcontextprotocol/servers/tree/main/src/git

**Key Files to Study:**

- `src/git/index.ts` - Main MCP server implementation
- `src/git/git.ts` - Git operations wrapper
- `package.json` - Dependencies and scripts

### 7.3 This Codebase's MCP Implementations

#### Bash MCP Implementation

**File:** `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`

**Key Patterns:**

- Safe command execution with `spawn()`
- Timeout handling with SIGTERM/SIGKILL
- Working directory validation
- Output capture (stdout/stderr)
- Exit code handling

#### Filesystem MCP Implementation

**File:** `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts`

**Key Patterns:**

- Path normalization and validation
- Error code-specific handling (ENOENT, EACCES, EISDIR)
- Optional directory creation
- Glob pattern matching with fast-glob
- Regex-based grep search

### 7.4 Git MCP Implementation Example

Based on the patterns from existing tools, here's a complete example:

```typescript
/**
 * Git MCP Tool Module
 *
 * @module tools/git-mcp
 *
 * @remarks
 * Provides MCP tools for Git version control operations.
 * Implements status, add, commit, diff, log, checkout, and branch operations.
 */

import { spawn } from 'node:child_process';
import { existsSync, realpathSync, resolve } from 'node:path';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// ===== INPUT INTERFACES =====

interface GitStatusInput {
  repoPath: string;
  showUntracked?: boolean;
}

interface GitCommitInput {
  repoPath: string;
  message: string;
  allowEmpty?: boolean;
  amend?: boolean;
}

interface GitAddInput {
  repoPath: string;
  files?: string[];
  all?: boolean;
}

// ===== RESULT INTERFACES =====

interface GitStatusResult {
  success: boolean;
  branch?: string;
  staged?: string[];
  modified?: string[];
  untracked?: string[];
  error?: string;
}

interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  error?: string;
}

// ===== TOOL SCHEMAS =====

const gitStatusTool: Tool = {
  name: 'git_status',
  description:
    'Get git repository status including branch, staged, and modified files',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: {
        type: 'string',
        description: 'Path to the git repository',
      },
      showUntracked: {
        type: 'boolean',
        description: 'Include untracked files in output',
        default: false,
      },
    },
    required: ['repoPath'],
  },
};

const gitCommitTool: Tool = {
  name: 'git_commit',
  description: 'Create a new commit with staged changes',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: {
        type: 'string',
        description: 'Path to the git repository',
      },
      message: {
        type: 'string',
        description: 'Commit message',
        minLength: 1,
        maxLength: 2000,
      },
      allowEmpty: {
        type: 'boolean',
        description: 'Allow empty commit',
        default: false,
      },
      amend: {
        type: 'boolean',
        description: 'Amend previous commit',
        default: false,
      },
    },
    required: ['repoPath', 'message'],
  },
};

// ===== HELPER FUNCTIONS =====

async function spawnGit(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', exitCode => {
      if (exitCode === 0) {
        resolve({ stdout, stderr, exitCode });
      } else {
        reject(new Error(stderr || 'Git command failed'));
      }
    });

    child.on('error', (error: Error) => {
      reject(error);
    });
  });
}

function validateRepositoryPath(repoPath: string): string {
  const absolutePath = resolve(repoPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Repository not found: ${repoPath}`);
  }

  const gitDir = `${absolutePath}/.git`;
  if (!existsSync(gitDir)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  return realpathSync(absolutePath);
}

// ===== TOOL EXECUTORS =====

async function executeGitStatus(
  input: GitStatusInput
): Promise<GitStatusResult> {
  const { repoPath, showUntracked = false } = input;

  try {
    const safePath = validateRepositoryPath(repoPath);

    // Get current branch
    const branchResult = await spawnGit(
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      safePath
    );
    const branch = branchResult.stdout.trim();

    // Get porcelain status
    const statusResult = await spawnGit(
      ['status', '--porcelain', showUntracked ? '-u' : ''],
      safePath
    );

    const lines = statusResult.stdout.trim().split('\n').filter(Boolean);
    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];

    for (const line of lines) {
      const status = line.slice(0, 2);
      const file = line.slice(3);

      if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(file);
      }
      if (status[1] !== ' ' && status[1] !== '?') {
        modified.push(file);
      }
      if (status === '??') {
        untracked.push(file);
      }
    }

    return {
      success: true,
      branch,
      staged: staged.length > 0 ? staged : undefined,
      modified: modified.length > 0 ? modified : undefined,
      untracked: showUntracked && untracked.length > 0 ? untracked : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function executeGitCommit(
  input: GitCommitInput
): Promise<GitCommitResult> {
  const { repoPath, message, allowEmpty = false, amend = false } = input;

  try {
    const safePath = validateRepositoryPath(repoPath);

    // Check if there are staged changes
    const statusResult = await executeGitStatus({ repoPath: safePath });
    if (!statusResult.success) {
      return { success: false, error: statusResult.error };
    }

    if (!statusResult.staged?.length && !allowEmpty) {
      return {
        success: false,
        error:
          'No changes staged for commit. Use git_add to stage files first.',
      };
    }

    // Build git commit arguments
    const args = ['commit', '-m', message];
    if (allowEmpty) args.push('--allow-empty');
    if (amend) args.push('--amend');

    // Execute commit
    const commitResult = await spawnGit(args, safePath);

    // Get commit hash
    const hashResult = await spawnGit(['rev-parse', 'HEAD'], safePath);
    const commitHash = hashResult.stdout.trim();

    return {
      success: true,
      commitHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ===== MCP SERVER =====

export class GitMCP extends MCPHandler {
  constructor() {
    super();

    this.registerServer({
      name: 'git',
      transport: 'inprocess',
      tools: [gitStatusTool, gitCommitTool],
    });

    this.registerToolExecutor(
      'git',
      'git_status',
      executeGitStatus as ToolExecutor
    );
    this.registerToolExecutor(
      'git',
      'git_commit',
      executeGitCommit as ToolExecutor
    );
  }
}

// Export types and tools
export type {
  GitStatusInput,
  GitCommitInput,
  GitStatusResult,
  GitCommitResult,
};
export { gitStatusTool, gitCommitTool, executeGitStatus, executeGitCommit };
```

### 7.5 Testing MCP Tools

Based on existing test files:

#### Bash MCP Test

**File:** `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts`

#### Filesystem MCP Test

**File:** `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts`

**Test Pattern:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BashMCP } from '../../src/tools/bash-mcp';

describe('BashMCP', () => {
  let bashMCP: BashMCP;

  beforeEach(() => {
    bashMCP = new BashMCP();
  });

  it('should execute simple command successfully', async () => {
    const result = await bashMCP.executeTool('bash__execute_bash', {
      command: 'echo "Hello, World!"',
    });

    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Hello, World!');
    expect(result.exitCode).toBe(0);
  });

  it('should handle timeout correctly', async () => {
    const result = await bashMCP.executeTool('bash__execute_bash', {
      command: 'sleep 10',
      timeout: 1000,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });
});
```

---

## 8. Quick Reference

### 8.1 Tool Schema Template

```typescript
const toolTemplate: Tool = {
  name: 'tool_name',
  description: 'Clear description of what the tool does',
  input_schema: {
    type: 'object',
    properties: {
      requiredParam: {
        type: 'string',
        description: 'Description of parameter',
      },
      optionalParam: {
        type: 'boolean',
        description: 'Description of optional parameter',
        default: false,
      },
    },
    required: ['requiredParam'],
  },
};
```

### 8.2 Tool Executor Template

```typescript
async function executeTool(input: ToolInput): Promise<ToolResult> {
  try {
    // 1. Validate inputs
    validateInputs(input);

    // 2. Execute core logic
    const result = await coreOperation(input);

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

### 8.3 Common JSON Schema Validations

```typescript
const commonValidations = {
  // String validations
  nonEmptyString: {
    type: 'string',
    minLength: 1,
  },

  // Path validations
  filePath: {
    type: 'string',
    pattern: '^[\\w\\-\\./]+$',
  },

  // Enum validations
  logLevel: {
    type: 'string',
    enum: ['debug', 'info', 'warn', 'error'],
  },

  // Numeric validations
  timeout: {
    type: 'number',
    minimum: 1000,
    maximum: 300000,
  },

  // Array validations
  fileList: {
    type: 'array',
    items: { type: 'string' },
    minItems: 1,
  },
};
```

---

## 9. Summary and Recommendations

### 9.1 Key Takeaways

1. **Use Groundswell's MCPHandler** - This codebase has established patterns
2. **Follow existing implementation patterns** from `bash-mcp.ts` and `filesystem-mcp.ts`
3. **Always return structured results** with `success: boolean`
4. **Validate inputs thoroughly** before processing
5. **Use argument arrays with spawn()** to prevent command injection
6. **Handle specific error codes** for actionable error messages
7. **Use snake_case for tool names** with descriptive verbs

### 9.2 Next Steps for Git MCP Implementation

1. Create `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts`
2. Define input/result interfaces for all git operations
3. Create tool schemas following the pattern above
4. Implement tool executors with proper error handling
5. Add tests in `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts`
6. Register GitMCP with agents in `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

### 9.3 Additional Resources

- **MCP Specification:** https://spec.modelcontextprotocol.io
- **MCP TypeScript SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Official MCP Servers:** https://github.com/modelcontextprotocol/servers
- **Groundswell Documentation:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T3S2/research/groundswell_docs.md`
- **Existing Implementations:**
  - `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`
  - `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts`

---

**End of Research Document**

**Last Updated:** 2026-01-12
**Researcher:** Claude Code Agent
**For:** P2M1T2S3 - Git MCP Tool Implementation
