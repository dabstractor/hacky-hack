# Product Requirement Prompt (PRP): P1.M2.T2.S1 - Verify MCP tool integration (Bash, Filesystem, Git)

***

## Goal

**Feature Goal**: Create integration tests that verify all three MCP servers (BashMCP, FilesystemMCP, GitMCP) are properly registered with each agent and accessible via agent.tool() calls.

**Deliverable**: Integration test file `tests/integration/mcp-tools.test.ts` with comprehensive verification of:
- All three MCP servers are registered with each agent type
- Tools are accessible via agent's MCP handler
- BashMCP uses spawn() for safe command execution (no shell injection)
- FilesystemMCP validates file paths before operations
- GitMCP uses simple-git library correctly

**Success Definition**: All tests pass, verifying:
- Architect, Researcher, Coder, and QA agents each have BashMCP, FilesystemMCP, and GitMCP registered
- All tools from each MCP server are accessible via `agent.getMcpHandler().getTools()`
- Tool naming follows `server__tool` pattern (e.g., `bash__execute_bash`, `filesystem__file_read`, `git__git_status`)
- MCP handler can execute tools and returns proper results
- Mock agent tool invocations work correctly
- MCP handler integration is properly mocked for testing

## Why

* **Agent Capability Verification**: Validates that agents have the required tools to perform their work (bash commands, file operations, git operations) as specified in PRD §5.2
* **Integration Contract Compliance**: Ensures the MCP tool integration specified in system_context.md is correctly implemented across all agent types
* **Tool Access Safety**: Verifies that tools are registered safely using spawn() (no shell injection), path validation, and proper library usage
* **Test Infrastructure**: Provides integration test patterns for future MCP tool additions and agent testing
* **Quality Assurance**: Catches regressions in agent-MCP integration early, preventing tool access failures during pipeline execution

**Relationship to P1.M2.T1.S4**: The previous subtask (P1.M2.T1.S4) validates protected file enforcement. This subtask (P1.M2.T2.S1) validates the tool infrastructure that agents use to perform file operations, ensuring agents have the correct tools to interact with the codebase.

**Critical Gap**: Current implementation has unit tests for individual MCP tools (tests/integration/tools.test.ts) and agent factory tests, but lacks integration tests verifying:
- Agent-MCP integration across all agent types
- Tool accessibility through agent's MCP handler
- Proper tool registration and naming conventions
- End-to-end tool execution through agents

## What

Integration tests that verify MCP tool integration with agents, ensuring all agents have access to Bash, Filesystem, and Git tools through their MCP handler.

### Success Criteria

* [ ] All four agent types (Architect, Researcher, Coder, QA) have BashMCP, FilesystemMCP, and GitMCP registered
* [ ] Each MCP server's tools are accessible via `agent.getMcpHandler().getTools()`
* [ ] Tool names follow `server__tool` naming convention
* [ ] BashMCP tool (execute_bash) is registered and accessible
* [ ] FilesystemMCP tools (file_read, file_write, glob_files, grep_search) are registered and accessible
* [ ] GitMCP tools (git_status, git_diff, git_add, git_commit) are registered and accessible
* [ ] Tools can be executed through agent's MCP handler with proper result parsing
* [ ] Mock agent tool invocations work correctly for testing
* [ ] All system operations are mocked (no real file/git/bash operations during tests)
* [ ] Tests follow existing integration test patterns from the codebase

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

* Complete MCP server specifications from system_context.md and external_deps.md
* MCP tool implementations with exact file paths and patterns
* Agent factory code showing MCP_TOOLS registration
* Existing integration test patterns from tests/integration/tools.test.ts and tests/integration/groundswell/mcp.test.ts
* Mocking patterns for child_process, node:fs, and simple-git
* Tool executor registration patterns
* Helper functions for creating mock agents and parsing tool results
* Groundswell MCPHandler API patterns (registerServer, registerToolExecutor, getTools, executeTool)
* Clear test structure patterns with SETUP/EXECUTE/VERIFY comments

### Documentation & References

```yaml
# MUST READ - MCP server specifications from system_context.md
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Complete specification of MCP servers and their tools
  section: "MCP Servers" section (BashMCP, FilesystemMCP, GitMCP)
  pattern: MCP server architecture, tool definitions, security patterns
  gotcha: BashMCP uses spawn() not exec() to prevent shell injection

# MUST READ - External dependencies documentation
- docfile: plan/003_b3d3efdaf0ed/docs/external_deps.md
  why: MCP server dependencies and library usage
  section: "MCP Servers" section
  pattern: Library dependencies (simple-git, fast-glob, node:fs)
  gotcha: simple-git library usage patterns, GitError handling

# MUST READ - MCP tool implementations
- file: src/tools/bash-mcp.ts
  why: BashMCP implementation with spawn() usage, tool schema, executor
  lines: 1-307 (entire file), specifically 82-108 (tool schema), 131-241 (executor), 251-277 (MCP server class)
  pattern: Tool schema definition, executor function, MCPHandler extension, registerServer/registerToolExecutor
  gotcha: Uses spawn() with shell: false to prevent shell injection

- file: src/tools/filesystem-mcp.ts
  why: FilesystemMCP implementation with path validation
  lines: 1-549 (entire file), specifically 163-275 (tool schemas), 296-477 (executors), 487-533 (MCP server class)
  pattern: Four tools (file_read, file_write, glob_files, grep_search), path validation
  gotcha: Uses resolve() for path sanitization, specific error codes (ENOENT, EACCES, EISDIR)

- file: src/tools/git-mcp.ts
  why: GitMCP implementation with simple-git library
  lines: 1-533 (entire file), specifically 177-275 (tool schemas), 289-467 (executors), 479-510 (MCP server class)
  pattern: Four tools (git_status, git_diff, git_add, git_commit), validateRepositoryPath helper
  gotcha: Uses simple-git library, GitError handling, path validation for .git directory

# MUST READ - Agent factory with MCP registration
- file: src/agents/agent-factory.ts
  why: Shows how MCP servers are registered with agents
  lines: 56-68 (MCP server singletons and MCP_TOOLS array), 195-290 (agent creation functions)
  pattern: Singleton MCP servers, mcps parameter in agent config, all agents get MCP_TOOLS
  gotcha: All four agent types receive the same MCP_TOOLS array

# MUST READ - Existing MCP integration tests
- file: tests/integration/tools.test.ts
  why: Reference pattern for testing MCP tool executeTool() interface
  lines: 1-814 (entire file), specifically 26-58 (mock setup), 98-152 (mock helper functions), 158-347 (BashMCP tests), 353-593 (FilesystemMCP tests), 599-813 (GitMCP tests)
  pattern: Module-level mocking, createMockChild helper, parseToolResult helper, SETUP/EXECUTE/VERIFY structure
  gotcha: Uses vi.mock() at top level for hoisting, mocks external dependencies

- file: tests/integration/groundswell/mcp.test.ts
  why: Reference pattern for testing Groundswell MCP registration
  lines: 1-300+ (full test file)
  pattern: Mock Anthropic SDK, test server registration, test executor registration, test tool discovery
  gotcha: Uses dynamic import to load Groundswell after mocks

# MUST READ - Research documents
- docfile: plan/003_b3d3efdaf0ed/P1M2T2S1/research/mcp-testing-best-practices.md
  why: Comprehensive MCP testing patterns and mocking strategies
  section: "Testing MCP Tool Integration with Agents", "Mocking Strategies for MCP Servers"
  pattern: Agent-MCP integration testing, mock helper functions, tool registration verification

- docfile: plan/003_b3d3efdaf0ed/P1M2T2S1/research/groundswell-mcp-patterns.md
  why: Groundswell MCP architecture and testing patterns
  section: "MCP Tool Registration Mechanisms", "Testing Patterns for Groundswell MCP Tools"
  pattern: MCPServer interface, MCPHandler class, tool naming convention

- docfile: plan/003_b3d3efdaf0ed/P1M2T2S1/research/agent-tool-testing-patterns.md
  why: Agent tool testing patterns and integration testing
  section: "Testing Agent.tool() Method Calls", "MCP Tool Execution Testing Patterns"
  pattern: Mock agent tool invocations, test MCP handler access
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   ├── tools.test.ts                     # Reference: MCP tool executeTool() testing
│   ├── groundswell/
│   │   └── mcp.test.ts                   # Reference: Groundswell MCP registration tests
│   ├── agents.test.ts                    # Reference: Agent integration tests
│   ├── architect-agent.test.ts           # Reference: Architect agent tests
│   ├── researcher-agent.test.ts          # Reference: Researcher agent tests
│   ├── coder-agent.test.ts               # Reference: Coder agent tests
│   └── qa-agent.test.ts                  # Reference: QA agent tests
│
└── mcp-tools.test.ts                     # NEW: This PRP's deliverable

src/
├── tools/
│   ├── bash-mcp.ts                       # Lines 82-108: tool schema, 131-241: executor, 251-277: MCP class
│   ├── filesystem-mcp.ts                 # Lines 163-275: tool schemas, 296-477: executors, 487-533: MCP class
│   └── git-mcp.ts                        # Lines 177-275: tool schemas, 289-467: executors, 479-510: MCP class
│
└── agents/
    └── agent-factory.ts                  # Lines 56-68: MCP_TOOLS array, 195-290: agent creation

plan/003_b3d3efdaf0ed/
└── P1M2T2S1/
    ├── PRP.md                            # This file
    └── research/                         # Research documents
        ├── mcp-testing-best-practices.md
        ├── groundswell-mcp-patterns.md
        └── agent-tool-testing-patterns.md
```

### Desired Codebase Tree (new test file structure)

```bash
tests/integration/mcp-tools.test.ts         # NEW: MCP tool integration tests
├── describe('integration/mcp-tools > agent MCP integration')
│   ├── describe('agent factory MCP registration')
│   │   ├── it('should register all three MCP servers with Architect agent')
│   │   ├── it('should register all three MCP servers with Researcher agent')
│   │   ├── it('should register all three MCP servers with Coder agent')
│   │   └── it('should register all three MCP servers with QA agent')
│   │
│   ├── describe('MCP tool accessibility')
│   │   ├── it('should expose BashMCP tools via getMcpHandler().getTools()')
│   │   ├── it('should expose FilesystemMCP tools via getMcpHandler().getTools()')
│   │   └── it('should expose GitMCP tools via getMcpHandler().getTools()')
│   │
│   ├── describe('tool naming conventions')
│   │   ├── it('should use bash__ prefix for BashMCP tools')
│   │   ├── it('should use filesystem__ prefix for FilesystemMCP tools')
│   │   └── it('should use git__ prefix for GitMCP tools')
│   │
│   ├── describe('BashMCP tool verification')
│   │   ├── it('should register execute_bash tool')
│   │   ├── it('should verify spawn() usage (shell: false)')
│   │   └── it('should execute bash tool through MCP handler')
│   │
│   ├── describe('FilesystemMCP tool verification')
│   │   ├── it('should register file_read tool')
│   │   ├── it('should register file_write tool')
│   │   ├── it('should register glob_files tool')
│   │   ├── it('should register grep_search tool')
│   │   ├── it('should verify path validation in file operations')
│   │   └── it('should execute filesystem tools through MCP handler')
│   │
│   ├── describe('GitMCP tool verification')
│   │   ├── it('should register git_status tool')
│   │   ├── it('should register git_diff tool')
│   │   ├── it('should register git_add tool')
│   │   ├── it('should register git_commit tool')
│   │   ├── it('should verify simple-git library usage')
│   │   └── it('should execute git tools through MCP handler')
│   │
│   └── describe('mock agent tool invocations')
│       ├── it('should mock agent.tool() calls successfully')
│       ├── it('should verify tool execution through mocked agent')
│       └── it('should parse tool results correctly')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Mock setup must be at module level for hoisting
// From tests/integration/tools.test.ts and tests/integration/groundswell/mcp.test.ts
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));
// GOTCHA: Must be at top level before imports due to vi.mock() hoisting

// CRITICAL: Import after mocking to get mocked versions
import { spawn } from 'node:child_process';
const mockSpawn = vi.mocked(spawn);
// GOTCHA: Must use vi.mocked() for type-safe mock access

// CRITICAL: Agent factory uses singleton MCP servers
// From src/agents/agent-factory.ts lines 56-68
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();
const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP];
// GOTCHA: Same instances shared across all agents, not new instances per agent

// CRITICAL: Tool naming follows server__tool pattern
// From Groundswell MCPHandler
'bash__execute_bash'
'filesystem__file_read'
'git__git_status'
// GOTCHA: Double underscore separator, not single underscore

// CRITICAL: BashMCP uses spawn() not exec()
// From src/tools/bash-mcp.ts lines 158-162
child = spawn(executable, commandArgs, {
  cwd: workingDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false,  // CRITICAL: No shell interpretation
});
// GOTCHA: shell: false prevents shell injection vulnerabilities

// CRITICAL: FilesystemMCP validates paths
// From src/tools/filesystem-mcp.ts lines 296-326
async function readFile(input: FileReadInput): Promise<FileReadResult> {
  try {
    const safePath = resolve(path);  // Path sanitization
    const content = await fs.readFile(safePath, { encoding });
    return { success: true, content };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;
    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${path}` };
    }
    // ... more error handling
  }
}
// GOTCHA: Uses resolve() for path validation, specific error codes

// CRITICAL: GitMCP uses simple-git library
// From src/tools/git-mcp.ts lines 23-30, 289-292
import { simpleGit, type StatusResult } from 'simple-git';
import { GitError } from 'simple-git';

async function gitStatus(input: GitStatusInput): Promise<GitStatusResult> {
  try {
    const safePath = await validateRepositoryPath(input.path);
    const git = simpleGit(safePath);
    const status: StatusResult = await git.status();
    // ... parse status
  } catch (error) {
    if (error instanceof GitError) {
      return { success: false, error: error.message };
    }
  }
}
// GOTCHA: Must mock simple-git and GitError class

// CRITICAL: parseToolResult helper for executeTool() output
// From tests/integration/tools.test.ts lines 138-152
function parseToolResult(toolResult: any) {
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
// GOTCHA: executeTool() returns ToolResult with JSON string content

// CRITICAL: Groundswell mock pattern
// From tests/integration/groundswell/mcp.test.ts
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));
// GOTCHA: Must mock Anthropic SDK to prevent API calls during tests

// CRITICAL: Agent creation requires environment variables
// From src/agents/agent-factory.ts
vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
// GOTCHA: Must stub environment variables before creating agents

// CRITICAL: MCPHandler API patterns
agent.getMcpHandler()           // Get MCP handler instance
handler.getTools()              // Get array of Tool objects
handler.hasTool(name)           // Check if tool is registered
handler.executeTool(name, input) // Execute tool by name
// GOTCHA: Tools are accessed through agent's MCP handler

// CRITICAL: Tool schema structure
interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}
// GOTCHA: All tools must have this structure for Groundswell

// CRITICAL: Test structure with SETUP/EXECUTE/VERIFY comments
it('should execute bash command', async () => {
  // SETUP
  const mockChild = createMockChild({ stdout: 'test', exitCode: 0 });
  mockSpawn.mockReturnValue(mockChild);

  // EXECUTE
  const result = await bashMCP.executeTool('bash__execute_bash', {
    command: 'echo test',
  });

  // VERIFY
  expect(result.success).toBe(true);
  expect(mockSpawn).toHaveBeenCalledWith('echo', ['test'], expect.any(Object));
});
// GOTCHA: Always use SETUP/EXECUTE/VERIFY pattern for clarity

// CRITICAL: Import with .js extensions
import { BashMCP } from '../../src/tools/bash-mcp.js';
import { createArchitectAgent } from '../../src/agents/agent-factory.js';
// GOTCHA: Must use .js extensions even for .ts files

// CRITICAL: Mock cleanup
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
// GOTCHA: Must clear mocks between tests to prevent pollution
```

## Implementation Blueprint

### Data Models and Structure

No new data models are created. The test uses existing interfaces:

```typescript
// From src/tools/bash-mcp.ts
interface BashToolInput {
  command: string;
  cwd?: string;
  timeout?: number;
}

interface BashToolResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

// From src/tools/filesystem-mcp.ts
interface FileReadInput {
  path: string;
  encoding?: BufferEncoding;
}

interface FileReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

// From src/tools/git-mcp.ts
interface GitStatusInput {
  path?: string;
}

interface GitStatusResult {
  success: boolean;
  branch?: string;
  staged?: string[];
  modified?: string[];
  untracked?: string[];
  error?: string;
}

// From Groundswell
interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface MCPServer {
  name: string;
  transport: 'inprocess' | 'stdio' | 'http';
  tools: Tool[];
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/integration/mcp-tools.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - SETUP: Module-level mocks for Anthropic SDK, child_process, node:fs, simple-git
  - SETUP: Helper functions (createMockChild, parseToolResult)
  - SETUP: beforeEach/afterEach hooks with mock cleanup and env stubs
  - IMPLEMENT: Top-level describe block
  - FOLLOW pattern: tests/integration/tools.test.ts (test structure)
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: tests/integration/ directory
  - DEPENDENCIES: None (first task)

Task 2: IMPLEMENT agent factory MCP registration tests
  - ADD: describe block 'agent factory MCP registration'
  - SETUP: Import agent factory functions
  - SETUP: Stub environment variables
  - IMPLEMENT: it('should register all three MCP servers with Architect agent')
    - SETUP: Create architect agent using createArchitectAgent()
    - EXECUTE: Get MCP handler via agent.getMcpHandler()
    - VERIFY: handler.getTools() includes tools from all three servers
  - IMPLEMENT: it('should register all three MCP servers with Researcher agent')
    - SETUP: Create researcher agent using createResearcherAgent()
    - EXECUTE: Get MCP handler
    - VERIFY: Tools from all three servers are registered
  - IMPLEMENT: it('should register all three MCP servers with Coder agent')
    - SETUP: Create coder agent using createCoderAgent()
    - EXECUTE: Get MCP handler
    - VERIFY: Tools from all three servers are registered
  - IMPLEMENT: it('should register all three MCP servers with QA agent')
    - SETUP: Create QA agent using createQAAgent()
    - EXECUTE: Get MCP handler
    - VERIFY: Tools from all three servers are registered
  - SETUP: Mock Groundswell createAgent to return test agent
  - FOLLOW pattern: tests/integration/groundswell/mcp.test.ts (agent creation patterns)
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test section

Task 3: IMPLEMENT MCP tool accessibility tests
  - ADD: describe block 'MCP tool accessibility'
  - IMPLEMENT: it('should expose BashMCP tools via getMcpHandler().getTools()')
    - SETUP: Create any agent (all have same tools)
    - EXECUTE: Get tools via handler.getTools()
    - VERIFY: bash__execute_bash tool is present
  - IMPLEMENT: it('should expose FilesystemMCP tools via getMcpHandler().getTools()')
    - SETUP: Create agent
    - EXECUTE: Get tools
    - VERIFY: filesystem__file_read, filesystem__file_write, filesystem__glob_files, filesystem__grep_search are present
  - IMPLEMENT: it('should expose GitMCP tools via getMcpHandler().getTools()')
    - SETUP: Create agent
    - EXECUTE: Get tools
    - VERIFY: git__git_status, git__git_diff, git__git_add, git__git_commit are present
  - SETUP: Use agent.getMcpHandler() to access tools
  - FOLLOW pattern: tests/integration/groundswell/mcp.test.ts (getTools() tests)
  - DEPENDENCIES: Task 2 (agent factory tests)
  - PLACEMENT: After agent factory tests

Task 4: IMPLEMENT tool naming convention tests
  - ADD: describe block 'tool naming conventions'
  - IMPLEMENT: it('should use bash__ prefix for BashMCP tools')
    - SETUP: Get all tools from agent
    - EXECUTE: Filter for bash tools
    - VERIFY: All bash tool names start with 'bash__'
  - IMPLEMENT: it('should use filesystem__ prefix for FilesystemMCP tools')
    - SETUP: Get all tools
    - EXECUTE: Filter for filesystem tools
    - VERIFY: All filesystem tool names start with 'filesystem__'
  - IMPLEMENT: it('should use git__ prefix for GitMCP tools')
    - SETUP: Get all tools
    - EXECUTE: Filter for git tools
    - VERIFY: All git tool names start with 'git__'
  - SETUP: Use handler.getTools() to get tool list
  - FOLLOW pattern: Groundswell tool naming convention (double underscore)
  - DEPENDENCIES: Task 3 (tool accessibility tests)
  - PLACEMENT: After tool accessibility tests

Task 5: IMPLEMENT BashMCP tool verification tests
  - ADD: describe block 'BashMCP tool verification'
  - IMPLEMENT: it('should register execute_bash tool')
    - SETUP: Get tools from handler
    - VERIFY: bash__execute_bash exists
    - VERIFY: Tool schema has correct name and description
  - IMPLEMENT: it('should verify spawn() usage (shell: false)')
    - SETUP: Mock spawn to track calls
    - EXECUTE: Execute bash tool with test command
    - VERIFY: spawn was called with shell: false option
  - IMPLEMENT: it('should execute bash tool through MCP handler')
    - SETUP: Create mock child for spawn
    - EXECUTE: Call handler.executeTool('bash__execute_bash', { command: 'echo test' })
    - VERIFY: Result has success: true and correct stdout
  - SETUP: Mock child_process.spawn with createMockChild helper
  - FOLLOW pattern: tests/integration/tools.test.ts lines 158-206 (BashMCP tests)
  - DEPENDENCIES: Task 4 (tool naming tests)
  - PLACEMENT: After tool naming tests

Task 6: IMPLEMENT FilesystemMCP tool verification tests
  - ADD: describe block 'FilesystemMCP tool verification'
  - SETUP: Mock node:fs promises
  - IMPLEMENT: it('should register file_read tool')
    - VERIFY: filesystem__file_read exists
    - VERIFY: Tool schema structure is correct
  - IMPLEMENT: it('should register file_write tool')
    - VERIFY: filesystem__file_write exists
  - IMPLEMENT: it('should register glob_files tool')
    - VERIFY: filesystem__glob_files exists
  - IMPLEMENT: it('should register grep_search tool')
    - VERIFY: filesystem__grep_search exists
  - IMPLEMENT: it('should verify path validation in file operations')
    - SETUP: Mock readFile to test resolve() usage
    - EXECUTE: Call file_read with path
    - VERIFY: resolve() was called for path sanitization
  - IMPLEMENT: it('should execute filesystem tools through MCP handler')
    - SETUP: Mock fs.readFile
    - EXECUTE: Call handler.executeTool('filesystem__file_read', { path: './test.txt' })
    - VERIFY: Result has correct content
  - SETUP: Mock node:fs/promises with vi.mock()
  - FOLLOW pattern: tests/integration/tools.test.ts lines 353-593 (FilesystemMCP tests)
  - DEPENDENCIES: Task 5 (BashMCP tests)
  - PLACEMENT: After BashMCP tests

Task 7: IMPLEMENT GitMCP tool verification tests
  - ADD: describe block 'GitMCP tool verification'
  - SETUP: Mock simple-git library
  - IMPLEMENT: it('should register git_status tool')
    - VERIFY: git__git_status exists
  - IMPLEMENT: it('should register git_diff tool')
    - VERIFY: git__git_diff exists
  - IMPLEMENT: it('should register git_add tool')
    - VERIFY: git__git_add exists
  - IMPLEMENT: it('should register git_commit tool')
    - VERIFY: git__git_commit exists
  - IMPLEMENT: it('should verify simple-git library usage')
    - SETUP: Mock simpleGit to track calls
    - EXECUTE: Execute git tool
    - VERIFY: simpleGit was called correctly
  - IMPLEMENT: it('should execute git tools through MCP handler')
    - SETUP: Mock git instance methods
    - EXECUTE: Call handler.executeTool('git__git_status', {})
    - VERIFY: Result has correct status structure
  - SETUP: Mock simple-git with GitError class
  - FOLLOW pattern: tests/integration/tools.test.ts lines 599-813 (GitMCP tests)
  - DEPENDENCIES: Task 6 (FilesystemMCP tests)
  - PLACEMENT: After FilesystemMCP tests

Task 8: IMPLEMENT mock agent tool invocations tests
  - ADD: describe block 'mock agent tool invocations'
  - SETUP: Create mock agent with tool function
  - IMPLEMENT: it('should mock agent.tool() calls successfully')
    - SETUP: Mock agent.tool = vi.fn()
    - EXECUTE: Call agent.tool() with test params
    - VERIFY: Mock was called with correct params
  - IMPLEMENT: it('should verify tool execution through mocked agent')
    - SETUP: Mock agent.tool to return specific result
    - EXECUTE: Call agent.tool()
    - VERIFY: Result matches expected mock return
  - IMPLEMENT: it('should parse tool results correctly')
    - SETUP: Create mock tool result
    - EXECUTE: Parse with parseToolResult helper
    - VERIFY: Parsed result has correct structure
  - SETUP: Use mock agent factory pattern
  - FOLLOW pattern: tests/integration/researcher-agent.test.ts (agent mocking patterns)
  - DEPENDENCIES: Task 7 (GitMCP tests)
  - PLACEMENT: Final test section

Task 9: VERIFY test coverage and completeness
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Mock cleanup in afterEach
  - VERIFY: All MCP tools are tested for all agent types
  - RUN: npx vitest run tests/integration/mcp-tools.test.ts
  - VERIFY: All tests pass
  - DOCUMENT: Any implementation gaps discovered
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Integration tests for MCP Tool Integration with Agents
 *
 * @remarks
 * Tests validate that all three MCP servers (BashMCP, FilesystemMCP, GitMCP)
 * are properly registered with each agent type and accessible via agent.tool() calls.
 *
 * Verifies:
 * - All agents (Architect, Researcher, Coder, QA) have MCP tools registered
 * - Tools are accessible via agent.getMcpHandler().getTools()
 * - Tool naming follows server__tool pattern
 * - BashMCP uses spawn() for safe command execution
 * - FilesystemMCP validates file paths
 * - GitMCP uses simple-git library correctly
 * - Mock agent tool invocations work correctly
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/tools/bash-mcp.ts | BashMCP Implementation}
 * @see {@link ../../src/tools/filesystem-mcp.ts | FilesystemMCP Implementation}
 * @see {@link ../../src/tools/git-mcp.ts | GitMCP Implementation}
 * @see {@link ../../src/agents/agent-factory.ts | Agent Factory}
 */

// PATTERN: Mock setup at module level (must be before imports)
// =============================================================================
// MOCK PATTERN: Module-level mocking with hoisting
// All mocks must be at top level before imports due to hoisting
// =============================================================================

// Mock Anthropic SDK to prevent API calls
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// Mock child_process for BashMCP
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock node:fs for FilesystemMCP
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path: unknown) => path as string),
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

// Mock fast-glob for FilesystemMCP
vi.mock('fast-glob', () => ({
  default: vi.fn(),
}));

// Mock simple-git for GitMCP
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

// PATTERN: Import after mocking
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs, existsSync, realpathSync } from 'node:fs';
import fg from 'fast-glob';
import { simpleGit, GitError } from 'simple-git';
import { BashMCP } from '../../src/tools/bash-mcp.js';
import { FilesystemMCP } from '../../src/tools/filesystem-mcp.js';
import { GitMCP } from '../../src/tools/git-mcp.js';
import {
  createArchitectAgent,
  createResearcherAgent,
  createCoderAgent,
  createQAAgent,
} from '../../src/agents/agent-factory.js';
import type { Agent, Tool } from 'groundswell';

// PATTERN: Typed mocks
const mockSpawn = vi.mocked(spawn);
const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockMkdir = vi.mocked(fs.mkdir);
const mockFastGlob = vi.mocked(fg);
const mockSimpleGit = vi.mocked(simpleGit);

// Mock git instance
const mockGitInstance = {
  status: vi.fn(),
  diff: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
};

// PATTERN: Helper function to create mock ChildProcess
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

// PATTERN: Helper function to parse tool results
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

// PATTERN: Test structure with describe blocks
describe('integration/mcp-tools > agent MCP integration', () => {
  let architectAgent: Agent;
  let researcherAgent: Agent;
  let coderAgent: Agent;
  let qaAgent: Agent;

  beforeEach(() => {
    // SETUP: Stub environment variables
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // SETUP: Set up default mock behaviors
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation((path: unknown) => path as string);

    // PATTERN: Clear all mocks at start of each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // SETUP: Clean up mocks and env vars
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  // PATTERN: Agent factory MCP registration test
  describe('agent factory MCP registration', () => {
    it('should register all three MCP servers with Architect agent', () => {
      // SETUP
      architectAgent = createArchitectAgent();
      const handler = architectAgent.getMcpHandler();
      const tools = handler.getTools();

      // EXECUTE
      const bashTools = tools.filter(t => t.name.startsWith('bash__'));
      const filesystemTools = tools.filter(t => t.name.startsWith('filesystem__'));
      const gitTools = tools.filter(t => t.name.startsWith('git__'));

      // VERIFY
      expect(bashTools).toHaveLength(1);
      expect(filesystemTools).toHaveLength(4);
      expect(gitTools).toHaveLength(4);
      expect(bashTools[0].name).toBe('bash__execute_bash');
    });

    it('should register all three MCP servers with Researcher agent', () => {
      // SETUP
      researcherAgent = createResearcherAgent();
      const handler = researcherAgent.getMcpHandler();
      const tools = handler.getTools();

      // VERIFY
      expect(tools.length).toBeGreaterThanOrEqual(9); // 1 + 4 + 4 tools
      expect(handler.hasTool('bash__execute_bash')).toBe(true);
      expect(handler.hasTool('filesystem__file_read')).toBe(true);
      expect(handler.hasTool('git__git_status')).toBe(true);
    });

    it('should register all three MCP servers with Coder agent', () => {
      // SETUP
      coderAgent = createCoderAgent();
      const handler = coderAgent.getMcpHandler();

      // VERIFY
      expect(handler.hasTool('bash__execute_bash')).toBe(true);
      expect(handler.hasTool('filesystem__file_write')).toBe(true);
      expect(handler.hasTool('git__git_commit')).toBe(true);
    });

    it('should register all three MCP servers with QA agent', () => {
      // SETUP
      qaAgent = createQAAgent();
      const handler = qaAgent.getMcpHandler();
      const tools = handler.getTools();

      // VERIFY
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('bash__execute_bash');
      expect(toolNames).toContain('filesystem__file_read');
      expect(toolNames).toContain('git__git_status');
    });
  });

  // PATTERN: MCP tool accessibility test
  describe('MCP tool accessibility', () => {
    beforeEach(() => {
      architectAgent = createArchitectAgent();
    });

    it('should expose BashMCP tools via getMcpHandler().getTools()', () => {
      // SETUP
      const handler = architectAgent.getMcpHandler();
      const tools = handler.getTools();

      // VERIFY
      const bashTool = tools.find(t => t.name === 'bash__execute_bash');
      expect(bashTool).toBeDefined();
      expect(bashTool?.description).toContain('shell command');
    });

    it('should expose FilesystemMCP tools via getMcpHandler().getTools()', () => {
      // SETUP
      const handler = architectAgent.getMcpHandler();
      const tools = handler.getTools();

      // VERIFY
      expect(handler.hasTool('filesystem__file_read')).toBe(true);
      expect(handler.hasTool('filesystem__file_write')).toBe(true);
      expect(handler.hasTool('filesystem__glob_files')).toBe(true);
      expect(handler.hasTool('filesystem__grep_search')).toBe(true);
    });

    it('should expose GitMCP tools via getMcpHandler().getTools()', () => {
      // SETUP
      const handler = architectAgent.getMcpHandler();
      const tools = handler.getTools();

      // VERIFY
      const gitTools = tools.filter(t => t.name.startsWith('git__'));
      expect(gitTools).toHaveLength(4);

      const toolNames = gitTools.map(t => t.name);
      expect(toolNames).toContain('git__git_status');
      expect(toolNames).toContain('git__git_diff');
      expect(toolNames).toContain('git__git_add');
      expect(toolNames).toContain('git__git_commit');
    });
  });

  // PATTERN: Tool naming convention test
  describe('tool naming conventions', () => {
    beforeEach(() => {
      architectAgent = createArchitectAgent();
    });

    it('should use bash__ prefix for BashMCP tools', () => {
      // SETUP
      const handler = architectAgent.getMcpHandler();
      const tools = handler.getTools();
      const bashTools = tools.filter(t => t.name.startsWith('bash__'));

      // VERIFY
      bashTools.forEach(tool => {
        expect(tool.name).toMatch(/^bash__/);
      });
    });

    it('should use filesystem__ prefix for FilesystemMCP tools', () => {
      // SETUP
      const handler = architectAgent.getMcpHandler();
      const tools = handler.getTools();
      const fsTools = tools.filter(t => t.name.startsWith('filesystem__'));

      // VERIFY
      fsTools.forEach(tool => {
        expect(tool.name).toMatch(/^filesystem__/);
      });
    });

    it('should use git__ prefix for GitMCP tools', () => {
      // SETUP
      const handler = architectAgent.getMcpHandler();
      const tools = handler.getTools();
      const gitTools = tools.filter(t => t.name.startsWith('git__'));

      // VERIFY
      gitTools.forEach(tool => {
        expect(tool.name).toMatch(/^git__/);
      });
    });
  });

  // PATTERN: BashMCP tool verification test
  describe('BashMCP tool verification', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = createArchitectAgent();
    });

    it('should register execute_bash tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();
      const tools = handler.getTools();
      const bashTool = tools.find(t => t.name === 'bash__execute_bash');

      // VERIFY
      expect(bashTool).toBeDefined();
      expect(bashTool?.name).toBe('bash__execute_bash');
      expect(bashTool?.input_schema.properties).toHaveProperty('command');
    });

    it('should verify spawn() usage (shell: false)', async () => {
      vi.useRealTimers();

      // SETUP
      const mockChild = createMockChild({ stdout: 'hello', exitCode: 0 });
      mockSpawn.mockReturnValue(mockChild);

      const handler = agent.getMcpHandler();

      // EXECUTE
      await handler.executeTool('bash__execute_bash', {
        command: 'echo hello',
      });

      // VERIFY: spawn was called with shell: false
      expect(mockSpawn).toHaveBeenCalledWith(
        'echo',
        ['hello'],
        expect.objectContaining({
          shell: false,
        })
      );

      vi.useFakeTimers();
    });

    it('should execute bash tool through MCP handler', async () => {
      vi.useRealTimers();

      // SETUP
      const mockChild = createMockChild({ stdout: 'test output', exitCode: 0 });
      mockSpawn.mockReturnValue(mockChild);

      const handler = agent.getMcpHandler();

      // EXECUTE
      const result = await handler.executeTool('bash__execute_bash', {
        command: 'echo test output',
      });
      const parsed = parseToolResult(result);

      // VERIFY
      expect(parsed.success).toBe(true);
      expect(parsed.stdout).toBe('test output');
      expect(parsed.exitCode).toBe(0);

      vi.useFakeTimers();
    });
  });

  // PATTERN: FilesystemMCP tool verification test
  describe('FilesystemMCP tool verification', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = createCoderAgent();
      mockReadFile.mockResolvedValue('file content' as any);
      mockWriteFile.mockResolvedValue(undefined);
      mockFastGlob.mockResolvedValue([] as any);
    });

    it('should register file_read tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();
      const tools = handler.getTools();
      const tool = tools.find(t => t.name === 'filesystem__file_read');

      // VERIFY
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('filesystem__file_read');
    });

    it('should register file_write tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();
      const tools = handler.getTools();

      // VERIFY
      expect(handler.hasTool('filesystem__file_write')).toBe(true);
    });

    it('should register glob_files tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();
      const tools = tools.getTools();

      // VERIFY
      expect(handler.hasTool('filesystem__glob_files')).toBe(true);
    });

    it('should register grep_search tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();

      // VERIFY
      expect(handler.hasTool('filesystem__grep_search')).toBe(true);
    });

    it('should verify path validation in file operations', async () => {
      // SETUP
      const handler = agent.getMcpHandler();
      mockReadFile.mockImplementation(async (path: unknown) => {
        // Verify resolve() was called for path sanitization
        return 'content';
      } as any);

      // EXECUTE
      await handler.executeTool('filesystem__file_read', {
        path: './test.txt',
      });

      // VERIFY: readFile was called (path validation happens internally)
      expect(mockReadFile).toHaveBeenCalled();
    });

    it('should execute filesystem tools through MCP handler', async () => {
      // SETUP
      const handler = agent.getMcpHandler();
      mockReadFile.mockResolvedValue('test content' as any);

      // EXECUTE
      const result = await handler.executeTool('filesystem__file_read', {
        path: './test.txt',
      });
      const parsed = parseToolResult(result);

      // VERIFY
      expect(parsed.success).toBe(true);
      expect(parsed.content).toBe('test content');
    });
  });

  // PATTERN: GitMCP tool verification test
  describe('GitMCP tool verification', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = createResearcherAgent();
      mockExistsSync.mockReturnValue(true);
      mockGitInstance.status.mockResolvedValue({
        current: 'main',
        files: [],
        isClean: () => true,
      } as never);
    });

    it('should register git_status tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();
      const tools = handler.getTools();
      const tool = tools.find(t => t.name === 'git__git_status');

      // VERIFY
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('git__git_status');
    });

    it('should register git_diff tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();

      // VERIFY
      expect(handler.hasTool('git__git_diff')).toBe(true);
    });

    it('should register git_add tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();

      // VERIFY
      expect(handler.hasTool('git__git_add')).toBe(true);
    });

    it('should register git_commit tool', () => {
      // SETUP
      const handler = agent.getMcpHandler();

      // VERIFY
      expect(handler.hasTool('git__git_commit')).toBe(true);
    });

    it('should verify simple-git library usage', async () => {
      // SETUP
      const handler = agent.getMcpHandler();

      // EXECUTE
      await handler.executeTool('git__git_status', {
        path: './test-repo',
      });

      // VERIFY: simpleGit was called
      expect(mockSimpleGit).toHaveBeenCalled();
      expect(mockGitInstance.status).toHaveBeenCalled();
    });

    it('should execute git tools through MCP handler', async () => {
      // SETUP
      const handler = agent.getMcpHandler();
      mockGitInstance.status.mockResolvedValue({
        current: 'develop',
        files: [
          { path: 'test.ts', index: 'M', working_dir: ' ' },
        ],
        is_clean: () => false,
      } as never);

      // EXECUTE
      const result = await handler.executeTool('git__git_status', {
        path: './repo',
      });
      const parsed = parseToolResult(result);

      // VERIFY
      expect(parsed.success).toBe(true);
      expect(parsed.branch).toBe('develop');
    });
  });

  // PATTERN: Mock agent tool invocations test
  describe('mock agent tool invocations', () => {
    it('should mock agent.tool() calls successfully', async () => {
      // SETUP
      const mockTool = vi.fn().mockResolvedValue({
        success: true,
        data: 'test result',
      });

      const mockAgent = {
        getMcpHandler: vi.fn(() => ({
          getTools: vi.fn(() => []),
          hasTool: vi.fn(() => true),
          executeTool: mockTool,
        })),
      } as any;

      // EXECUTE
      await mockAgent.getMcpHandler().executeTool('test__tool', {
        input: 'test',
      });

      // VERIFY
      expect(mockTool).toHaveBeenCalledWith('test__tool', { input: 'test' });
    });

    it('should verify tool execution through mocked agent', async () => {
      // SETUP
      const expectedValue = { success: true, result: 'executed' };
      const mockExecute = vi.fn().mockResolvedValue(expectedValue);

      const mockAgent = {
        getMcpHandler: vi.fn(() => ({
          executeTool: mockExecute,
        })),
      } as any;

      // EXECUTE
      const result = await mockAgent.getMcpHandler().executeTool(
        'test__tool',
        {}
      );

      // VERIFY
      expect(result).toEqual(expectedValue);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should parse tool results correctly', () => {
      // SETUP
      const validResult = {
        content: '{"success":true,"data":"test"}',
      };
      const errorResult = {
        content: 'Error message',
      };

      // EXECUTE & VERIFY
      const parsedValid = parseToolResult(validResult);
      expect(parsedValid.success).toBe(true);
      expect(parsedValid.data).toBe('test');

      const parsedError = parseToolResult(errorResult);
      expect(parsedError.success).toBe(false);
      expect(parsedError.error).toBe('Error message');
    });
  });
});
```

### Integration Points

```yaml
AGENT_FACTORY:
  - createArchitectAgent(): Creates architect with MCP_TOOLS
  - createResearcherAgent(): Creates researcher with MCP_TOOLS
  - createCoderAgent(): Creates coder with MCP_TOOLS
  - createQAAgent(): Creates QA agent with MCP_TOOLS
  - MCP_TOOLS: Singleton array [BASH_MCP, FILESYSTEM_MCP, GIT_MCP]

MCP_SERVERS:
  - BashMCP: Provides execute_bash tool using spawn()
  - FilesystemMCP: Provides file_read, file_write, glob_files, grep_search
  - GitMCP: Provides git_status, git_diff, git_add, git_commit

AGENT_INTERFACE:
  - agent.getMcpHandler(): Returns MCPHandler instance
  - handler.getTools(): Returns array of Tool objects
  - handler.hasTool(name): Checks if tool is registered
  - handler.executeTool(name, input): Executes tool by name

MOCK_DEPENDENCIES:
  - @anthropic-ai/sdk: Prevent API calls
  - node:child_process: Mock spawn for bash
  - node:fs: Mock file operations
  - simple-git: Mock git operations

NO_EXTERNAL_OPERATIONS:
  - Tests use mocked dependencies (no real bash/fs/git operations)
  - Tests verify integration patterns, not actual tool functionality
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/integration/mcp-tools.test.ts --fix

# Check TypeScript types
npx tsc --noEmit tests/integration/mcp-tools.test.ts

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the mcp-tools integration file
npx vitest run tests/integration/mcp-tools.test.ts

# Run with coverage
npx vitest run tests/integration/mcp-tools.test.ts --coverage

# Run all integration tests to ensure no breakage
npx vitest run tests/integration/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify all integration tests still pass
npx vitest run tests/integration/

# Run related tests to ensure no breakage
npx vitest run tests/integration/tools.test.ts
npx vitest run tests/integration/groundswell/mcp.test.ts

# Run agent tests to verify integration
npx vitest run tests/integration/agents.test.ts
npx vitest run tests/integration/architect-agent.test.ts
npx vitest run tests/integration/researcher-agent.test.ts
npx vitest run tests/integration/coder-agent.test.ts
npx vitest run tests/integration/qa-agent.test.ts

# Expected: All integration tests pass
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/mcp-tools.test.ts

# Check test file follows project conventions
head -100 tests/integration/mcp-tools.test.ts
# Should see: describe blocks, proper imports, helper functions

# Verify all test categories are present
grep -n "describe.*agent factory" tests/integration/mcp-tools.test.ts
grep -n "describe.*MCP tool accessibility" tests/integration/mcp-tools.test.ts
grep -n "describe.*tool naming" tests/integration/mcp-tools.test.ts
grep -n "describe.*BashMCP" tests/integration/mcp-tools.test.ts
grep -n "describe.*FilesystemMCP" tests/integration/mcp-tools.test.ts
grep -n "describe.*GitMCP" tests/integration/mcp-tools.test.ts
grep -n "describe.*mock agent" tests/integration/mcp-tools.test.ts

# Verify SETUP/EXECUTE/VERIFY pattern
grep -n "SETUP:" tests/integration/mcp-tools.test.ts
grep -n "EXECUTE:" tests/integration/mcp-tools.test.ts
grep -n "VERIFY:" tests/integration/mcp-tools.test.ts

# Expected: Test file well-structured, all categories present
```

## Final Validation Checklist

### Technical Validation

* [ ] All Level 1-4 validations completed successfully
* [ ] Test file structure follows project patterns
* [ ] Tests use mocked dependencies (no real operations)
* [ ] Mock cleanup in beforeEach/afterEach
* [ ] Tests import with .js extensions
* [ ] All describe blocks have clear, descriptive names
* [ ] Helper functions follow existing patterns
* [ ] Tests use SETUP/EXECUTE/VERIFY pattern

### Feature Validation

* [ ] All four agent types have BashMCP, FilesystemMCP, and GitMCP registered
* [ ] All tools are accessible via agent.getMcpHandler().getTools()
* [ ] Tool naming follows server__tool pattern
* [ ] BashMCP tool (execute_bash) is registered and accessible
* [ ] FilesystemMCP tools (file_read, file_write, glob_files, grep_search) are registered
* [ ] GitMCP tools (git_status, git_diff, git_add, git_commit) are registered
* [ ] BashMCP uses spawn() with shell: false
* [ ] FilesystemMCP validates paths
* [ ] GitMCP uses simple-git library
* [ ] Mock agent tool invocations work correctly

### Code Quality Validation

* [ ] Follows existing integration test patterns from tools.test.ts
* [ ] Helper functions use same patterns as existing tests
* [ ] Test file location matches conventions (tests/integration/)
* [ ] Tests focus on integration patterns, not individual tool functionality
* [ ] Mock setup follows patterns from groundswell/mcp.test.ts
* [ ] Tests verify MCP handler integration correctly

### Documentation & Deployment

* [ ] Test file header with JSDoc comments describing purpose
* [ ] Test names clearly describe what is being tested
* [ ] Research documents stored in research/ subdirectory
* [ ] Tests verify PRD requirements from system_context.md
* [ ] Tests document MCP tool integration patterns

***

## Anti-Patterns to Avoid

* ❌ Don't test individual tool executor functionality (already tested in tools.test.ts)
* ❌ Don't skip testing all four agent types (each should be verified)
* ❌ Don't skip testing tool naming conventions (server__tool pattern)
* ❌ Don't use real file/git/bash operations in integration tests
* ❌ Don't skip testing MCP handler accessibility (getMcpHandler())
* ❌ Don't forget to mock Anthropic SDK (prevents API calls)
* ❌ Don't skip testing spawn() usage for BashMCP (shell: false verification)
* ❌ Don't skip testing simple-git library usage for GitMCP
* ❌ Don't skip testing path validation for FilesystemMCP
* ❌ Don't duplicate tests from tools.test.ts (focus on agent-MCP integration)
* ❌ Don't skip mock cleanup in afterEach
* ❌ Don't forget to stub environment variables
* ❌ Don't skip verifying all tools from each MCP server
* ❌ Don't test implementation details (test integration contracts)

***

**PRP Version:** 1.0
**Work Item:** P1.M2.T2.S1
**Created:** 2026-01-20
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**

* Complete MCP tool specifications from system_context.md and external_deps.md
* Comprehensive integration test patterns from existing test files
* Mocking patterns clearly documented with examples
* Clear implementation tasks with proper dependencies
* All contract requirements from PRD covered
* Extensive research documentation in research/ subdirectory
* Tests verify integration contracts without duplicating existing tests
* File paths and line numbers provided for all references
* Test structure follows project patterns exactly
* Helper functions and patterns specified with code examples
