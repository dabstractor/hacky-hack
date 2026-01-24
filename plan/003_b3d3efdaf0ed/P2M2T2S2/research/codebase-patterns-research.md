# Codebase MCP Tool Patterns Research

**Research Date:** 2026-01-23
**Purpose:** Document existing MCP tool patterns in the codebase

## Existing MCP Tools

### 1. BashMCP (`src/tools/bash-mcp.ts`)

**Purpose:** Execute shell commands safely

**Tools:**
- `bash__execute_bash` - Execute shell commands with timeout

**Key Patterns:**
```typescript
// Timeout protection
const DEFAULT_TIMEOUT = 30000;
const MIN_TIMEOUT = 1000;
const MAX_TIMEOUT = 300000;

// Command injection prevention
spawn(executable, commandArgs, {
  shell: false,  // Critical: no shell interpretation
});

// Process management
child.on('close', exitCode => { /* handle completion */ });
child.on('error', (error: Error) => { /* handle spawn errors */ });

// SIGTERM then SIGKILL timeout handling
const timeoutId = setTimeout(() => {
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 2000);
}, timeout);
```

**File Location:** `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`

### 2. FilesystemMCP (`src/tools/filesystem-mcp.ts`)

**Purpose:** File system operations

**Tools:**
- `filesystem__file_read` - Read files with encoding options
- `filesystem__file_write` - Write files with directory creation
- `filesystem__glob_files` - Find files matching patterns
- `filesystem__grep_search` - Search file content with regex

**Key Patterns:**
```typescript
// Path validation
const safePath = resolve(input.path);

// Error code handling
const errno = (error as NodeJS.ErrnoException).code;
if (errno === 'ENOENT') {
  return { success: false, error: `File not found: ${path}` };
}
if (errno === 'EACCES') {
  return { success: false, error: `Permission denied: ${path}` };
}
if (errno === 'EISDIR') {
  return { success: false, error: `Path is a directory: ${path}` };
}

// Directory creation pattern
if (input.createDirs) {
  const dir = normalize(input.path).split(sep).slice(0, -1).join(sep);
  if (dir) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// fast-glob integration
const matches = await fg(pattern, {
  cwd: cwd ? resolve(cwd) : process.cwd(),
  absolute: true,
  onlyFiles: true,
});
```

**File Location:** `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts`

### 3. GitMCP (`src/tools/git-mcp.ts`)

**Purpose:** Git version control operations

**Tools:**
- `git__git_status` - Get repository status
- `git__git_diff` - Show changes (staged/unstaged)
- `git__git_add` - Stage files with flag injection prevention
- `git__git_commit` - Create commits with message validation

**Key Patterns:**
```typescript
// Repository validation
async function validateRepositoryPath(path?: string): Promise<string> {
  const repoPath = resolve(path ?? process.cwd());

  if (!existsSync(repoPath)) {
    throw new Error(`Repository path not found: ${repoPath}`);
  }

  const gitDir = join(repoPath, '.git');
  if (!existsSync(gitDir)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  return realpathSync(repoPath);
}

// Flag injection prevention (CRITICAL)
await git.add(['--', ...files]);  // Use '--' separator

// Message validation (before path validation for better UX)
if (!input.message || input.message.trim() === '') {
  return {
    success: false,
    error: 'Commit message is required and cannot be empty',
  };
}

// Specific git error handling
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

// StatusResult parsing
for (const file of status.files) {
  // Untracked files (both columns are '?')
  if (file.index === '?' && file.working_dir === '?') {
    untracked.push(file.path);
  }
  // Staged files (index has changes)
  if (file.index !== ' ') {
    staged.push(file.path);
  }
  // Modified files (working dir has changes)
  if (file.working_dir !== ' ') {
    modified.push(file.path);
  }
}
```

**File Location:** `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts`

## Common Patterns Across All Tools

### 1. File Structure Pattern
```typescript
/**
 * Tool Module
 *
 * @module tools/tool-name
 */

import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// ===== INPUT INTERFACES =====
interface ToolInput { }

// ===== RESULT INTERFACES =====
interface ToolResult { }

// ===== TOOL SCHEMAS =====
const toolSchema: Tool = { };

// ===== TOOL EXECUTORS =====
async function executeTool(input: ToolInput): Promise<ToolResult> { }

// ===== MCP SERVER =====
export class ToolMCP extends MCPHandler { }

// Export types and tools
export type { ToolInput, ToolResult };
export { toolSchema, executeTool };
```

### 2. MCP Server Class Pattern
```typescript
export class CustomMCP extends MCPHandler {
  public readonly name = 'custom';           // Server name
  public readonly transport = 'inprocess' as const;
  public readonly tools = [tool1, tool2];    // Array of tool schemas

  constructor() {
    super();

    // Register server
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // Register executors
    this.registerToolExecutor('custom', 'tool1', executeTool1 as ToolExecutor);
    this.registerToolExecutor('custom', 'tool2', executeTool2 as ToolExecutor);
  }
}
```

### 3. Result Structure Pattern
```typescript
interface ToolResult {
  success: boolean;        // Always present
  error?: string;          // Present on failure
  // ... result-specific properties
}
```

### 4. Error Handling Pattern
```typescript
async function executeTool(input: ToolInput): Promise<ToolResult> {
  try {
    // 1. Validate inputs
    if (!validateInput(input)) {
      return { success: false, error: 'Specific error message' };
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

### 5. JSDoc Documentation Pattern
```typescript
/**
 * Tool description
 *
 * @module tools/tool-name
 *
 * @remarks
 * Detailed explanation of the tool's purpose and behavior.
 *
 * @example
 * ```ts
 * import { ToolMCP } from './tools/tool-name.js';
 *
 * const tool = new ToolMCP();
 * const result = await tool.executeTool('tool__name', {
 *   param: 'value'
 * });
 * ```
 */
```

## Agent Factory Integration Pattern

```typescript
// File: src/agents/agent-factory.ts

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
    mcps: MCP_TOOLS,  // Inject MCP servers
  };
  return createAgent(config);
}
```

## Security Patterns

### Path Traversal Prevention
```typescript
import { resolve, realpathSync } from 'node:path';
import { existsSync } from 'node:fs';

const safePath = resolve(input.path);
const realPath = realpathSync(safePath);

// Always resolve and validate paths
if (!existsSync(safePath)) {
  throw new Error(`Path does not exist: ${safePath}`);
}
```

### Command Injection Prevention
```typescript
import { spawn } from 'node:child_process';

// Use argument arrays with shell: false
spawn('git', ['commit', '-m', message], {
  shell: false,  // Critical: no shell interpretation
});

// Use '--' separator to prevent flag injection
git.add(['--', ...files]);
```

### Resource Limits
```typescript
// Timeout enforcement
const DEFAULT_TIMEOUT = 30000;
const MIN_TIMEOUT = 1000;
const MAX_TIMEOUT = 300000;

const timeout = Math.min(
  Math.max(input.timeout || DEFAULT_TIMEOUT, MIN_TIMEOUT),
  MAX_TIMEOUT
);
```

## Testing Patterns (from tests/unit/tools/)

```typescript
import { describe, expect, it, vi } from 'vitest';

// Mock external dependencies
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

describe('tool executor', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle success case', async () => {
    mockReadFile.mockResolvedValue('content');
    const result = await executeTool({ path: 'test.txt' });
    expect(result.success).toBe(true);
  });

  it('should handle file not found', async () => {
    const error = new Error('Not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    const result = await executeTool({ path: 'missing.txt' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('File not found');
  });
});
```
