# Product Requirement Prompt (PRP): Test MCP Tools

**Work Item**: P4.M4.T2.S2 - Test MCP tools
**Status**: Research Complete -> Ready for Implementation

---

## Goal

**Feature Goal**: Create comprehensive integration tests for the three MCP tool classes (BashMCP, FilesystemMCP, GitMCP) that validate the `executeTool()` method returns correctly formatted results while all system operations (child_process.spawn, fs.promises, simple-git) are mocked to prevent real execution.

**Deliverable**: Integration test file `tests/integration/tools.test.ts` with mocked system calls, testing:
- `BashMCP.executeTool('bash__execute_bash')` returns `{ success, stdout, stderr, exitCode, error? }`
- `BashMCP` handles timeout correctly with SIGTERM then SIGKILL
- `FilesystemMCP.executeTool('filesystem__file_read')` reads content with encoding
- `FilesystemMCP.executeTool('filesystem__file_write')` creates directories if `createDirs: true`
- `FilesystemMCP.executeTool('filesystem__glob_files')` matches file patterns via fast-glob
- `FilesystemMCP.executeTool('filesystem__grep_search')` searches content with regex
- `GitMCP.executeTool('git__git_status')` returns changed files with branch
- `GitMCP.executeTool('git__git_commit')` creates commits with messages

**Success Definition**:
- All three MCP classes are tested via `executeTool()` method (not direct function calls)
- All system calls are mocked (child_process, fs.promises, simple-git)
- Timeout handling is verified for BashMCP
- All tool executors return correctly formatted results
- Tests pass with 100% coverage for `src/tools/*.ts` files
- No real commands, file operations, or git operations are executed

## User Persona (if applicable)

**Target User**: PRPPipeline test validation system (automated QA)

**Use Case**: The test suite validates that:
1. MCP tool classes correctly integrate with Groundswell MCPHandler
2. Tool executors are properly registered and invocable via executeTool()
3. System operations are safely mocked to prevent side effects
4. Tool result formats match expected schemas
5. Timeout and error handling work correctly

**User Journey**:
1. Developer runs `npm test` to execute all tests
2. Vitest runs integration tests for MCP tools
3. Mocked system operations prevent real execution
4. All tool executors are validated via executeTool() interface
5. All tests pass -> validation complete

**Pain Points Addressed**:
- **No Integration Coverage**: Existing unit tests test functions directly, not the MCP class interface
- **executeTool() Not Tested**: Unit tests don't validate the MCP tool registration and execution path
- **Mock Verification**: Need to ensure all system operations are properly mocked
- **Result Format Validation**: Need to verify tool executors return correct result schemas

## Why

- **MCP Integration Critical**: MCP tools are core to PRPPipeline - all agent operations flow through them
- **executeTool() Interface**: Agents call tools via executeTool(), not direct function calls
- **System Safety**: Tests must mock all system operations to prevent side effects
- **Result Schema Validation**: Tool executors must return correctly formatted results for LLM consumption
- **Timeout Validation**: BashMCP timeout handling is critical for preventing hangs
- **Mock Strategy**: System modules must be mocked at module level for complete isolation
- **Integration vs Unit**: Unit tests exist but don't test the MCP class → executeTool() → executor flow

## What

### Input

- MCP tool implementations:
  - `src/tools/bash-mcp.ts` (BashMCP class, executeBashCommand, bashTool schema)
  - `src/tools/filesystem-mcp.ts` (FilesystemMCP class, readFile/writeFile/globFiles/grepSearch, tool schemas)
  - `src/tools/git-mcp.ts` (GitMCP class, gitStatus/Diff/Add/Commit, tool schemas)
- Existing unit test patterns:
  - `tests/unit/tools/bash-mcp.test.ts` (mock patterns, createMockChild factory)
  - `tests/unit/tools/filesystem-mcp.test.ts` (fs.promises mocking, error handling)
  - `tests/unit/tools/git-mcp.test.ts` (simple-git mocking, GitError handling)
- Vitest configuration: `vitest.config.ts`
- Groundswell API docs: `plan/001_14b9dc2a33c7/architecture/groundswell_api.md`
- Research documents in `plan/001_14b9dc2a33c7/P4M4T2S2/research/`

### State Changes

- **Create** `tests/integration/tools.test.ts` with MCP class integration tests
- **Mock** child_process, fs.promises, simple-git at module level
- **Test** executeTool() method for all three MCP classes
- **Validate** tool executor return formats match expected schemas
- **Verify** timeout handling for BashMCP via executeTool() interface

### Output

- Integration test file: `tests/integration/tools.test.ts`
- Test coverage: 100% for `src/tools/*.ts` files (combined with existing unit tests)
- Validated executeTool() interface for all MCP tools
- Verified system operation mocking prevents side effects
- Confirmed tool result schemas are correct

### Success Criteria

- [ ] Mock child_process.spawn successfully (vi.mock at module level)
- [ ] Mock fs.promises (readFile, writeFile, mkdir) successfully
- [ ] Mock simple-git successfully (with GitError class)
- [ ] Test BashMCP.executeTool('bash__execute_bash') returns { success, stdout, stderr, exitCode }
- [ ] Test BashMCP handles timeout correctly via executeTool()
- [ ] Test FilesystemMCP.executeTool('filesystem__file_read') returns { success, content }
- [ ] Test FilesystemMCP.executeTool('filesystem__file_write') creates directories when createDirs: true
- [ ] Test FilesystemMCP.executeTool('filesystem__glob_files') returns { success, matches[] }
- [ ] Test FilesystemMCP.executeTool('filesystem__grep_search') returns { success, matches[] }
- [ ] Test GitMCP.executeTool('git__git_status') returns { success, branch, staged[], modified[], untracked[] }
- [ ] Test GitMCP.executeTool('git__git_commit') returns { success, commitHash }
- [ ] All tests pass with mocked system calls
- [ ] Coverage 100% for tools/*.ts files (combined with unit tests)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement the MCP tools integration tests successfully?

**Answer**: **YES** - This PRP provides:
- Complete MCP tool implementation references
- Existing unit test patterns to follow (mock strategies, test organization)
- Groundswell API documentation for MCPHandler patterns
- All tool schema definitions
- Research documents on best practices for mocking each dependency
- Specific test cases for all contract requirements
- Known gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - MCP Tool Implementations
- file: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts
  why: BashMCP class structure, executeTool() inheritance, executeBashCommand implementation
  pattern: MCPHandler extension, registerServer(), registerToolExecutor(), execute_bash() direct method
  gotcha: executeTool() is inherited from MCPHandler, not defined in BashMCP
  critical: Lines 251-297 (BashMCP class), 131-241 (executeBashCommand)

- file: /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts
  why: FilesystemMCP class structure, four tool executors, fs.promises usage
  pattern: Multiple tool registration, path normalization, error code handling
  gotcha: No direct execute methods - tools only accessible via executeTool()
  critical: Lines 487-520 (FilesystemMCP class), 296-477 (tool executors)

- file: /home/dustin/projects/hacky-hack/src/tools/git-mcp.ts
  why: GitMCP class structure, four tool executors, simple-git usage
  pattern: Path validation, StatusResult parsing, GitError handling
  gotcha: validateRepositoryPath() checks for .git directory
  critical: Lines 479-496 (GitMCP class), 289-467 (tool executors)

# MUST READ - Existing Unit Test Patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts
  why: Mock patterns for child_process, test organization, createMockChild factory
  pattern: vi.mock('node:child_process'), vi.mocked() for type safety, beforeEach/afterEach
  gotcha: Mock must be at top level before imports due to hoisting
  critical: Lines 13-35 (mock setup), 696-731 (createMockChild factory), 105-567 (test patterns)

- file: /home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts
  why: Mock patterns for fs.promises, error handling with errno codes
  pattern: vi.mock('node:fs'), vi.mocked(fs.readFile), error.code assignment
  gotcha: Must cast error as NodeJS.ErrnoException to set .code property
  critical: Lines 13-25 (mock setup), 220-294 (error handling), 376-431 (writeFile error tests)

- file: /home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts
  why: Mock patterns for simple-git, GitError handling, mockGitInstance pattern
  pattern: vi.mock('simple-git') with GitError class, mockGitInstance factory
  gotcha: GitError must be mocked as a class for instanceof checks
  critical: Lines 23-34 (mock setup with GitError), 58-64 (mockGitInstance), 182-349 (test patterns)

# MUST READ - Integration Test Pattern
- file: /home/dustin/projects/hacky-hack/tests/integration/architect-agent.test.ts
  why: Pattern for testing via execute() method with mocked dependencies
  pattern: Mock returns { prompt: vi.fn() }, test validates internal calls
  gotcha: Integration tests validate the integration, not just unit behavior
  critical: Lines 27-494 (test patterns for agent integration)

# MUST READ - Groundswell API Documentation
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: MCPHandler, MCP server registration, executeTool() interface
  pattern: registerServer({ name, transport, tools }), registerToolExecutor(server, tool, executor)
  gotcha: executeTool() invokes registered executor with input object
  critical: Lines 145-178 (MCP Server System), ToolExecutor interface definition

# MUST READ - Vitest Configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test runner configuration with coverage settings
  pattern: environment: 'node', globals: true, coverage: v8
  gotcha: Coverage thresholds are 100% for all metrics
  critical: Lines 14-38 (test and coverage configuration)

# RESEARCH - Best Practices
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T2S2/research/child_process_mocking.md
  why: Best practices for mocking child_process.spawn, timeout testing, ChildProcess events
  section: Complete patterns for spawn mocking, timeout testing, event handling

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T2S2/research/fs_promises_mocking.md
  why: Best practices for mocking fs.promises, errno error handling, path resolution
  section: Mock patterns, errno code reference, error handling patterns

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T2S2/research/simple_git_mocking.md
  why: Best practices for mocking simple-git, GitError handling, git operation testing
  section: Mock setup, GitError patterns, git flow testing

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T2S2/research/mcp_integration_testing.md
  why: Best practices for testing MCP tools, executeTool() interface testing
  section: MCP tool registration testing, executeTool() patterns, integration vs unit

# REFERENCE - Type Definitions
- file: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts
  why: BashToolInput, BashToolResult type definitions for test typing
  pattern: Interface definitions match tool schemas
  critical: Lines 36-63 (BashToolInput, BashToolResult)

- file: /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts
  why: FileReadInput/Result, FileWriteInput/Result, GlobFilesInput/Result, GrepSearchInput/Result
  pattern: Input/Result pairs for each tool
  critical: Lines 32-152 (all Input/Result interfaces)

- file: /home/dustin/projects/hacky-hack/src/tools/git-mcp.ts
  why: GitStatusInput/Result, GitDiffInput/Result, GitAddInput/Result, GitCommitInput/Result
  pattern: Optional path parameters, structured result types
  critical: Lines 32-140 (all Input/Result interfaces)
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                             # Test scripts: test, test:run, test:coverage
├── vitest.config.ts                         # Vitest configuration with 100% coverage threshold
├── src/
│   └── tools/
│       ├── bash-mcp.ts                      # BashMCP class, executeBashCommand, bashTool (under test)
│       ├── filesystem-mcp.ts                # FilesystemMCP class, 4 tool executors (under test)
│       └── git-mcp.ts                       # GitMCP class, 4 tool executors (under test)
├── tests/
│   ├── unit/
│   │   └── tools/
│   │       ├── bash-mcp.test.ts             # Unit tests with spawn mocking (exists, 100% coverage)
│   │       ├── filesystem-mcp.test.ts       # Unit tests with fs.promises mocking (exists, 100% coverage)
│   │       └── git-mcp.test.ts              # Unit tests with simple-git mocking (exists, 100% coverage)
│   └── integration/
│       └── architect-agent.test.ts          # Integration test pattern (exists)
└── plan/
    └── 001_14b9dc2a33c7/
        ├── architecture/
        │   └── groundswell_api.md           # Groundswell API reference
        └── P4M4T2S2/
            ├── PRP.md                        # THIS FILE
            └── research/                     # Research documents
                ├── child_process_mocking.md
                ├── fs_promises_mocking.md
                ├── simple_git_mocking.md
                └── mcp_integration_testing.md
```

### Desired Codebase Tree (files to add)

```bash
tests/
└── integration/
    └── tools.test.ts                        # CREATE: MCP tools integration tests
        # Mock child_process, fs.promises, simple-git at module level
        # Test executeTool() method for BashMCP, FilesystemMCP, GitMCP
        # Validate tool executor return formats
        # Verify timeout handling for BashMCP

# Coverage output (generated):
coverage/
└── src/
    └── tools/
        ├── bash-mcp.ts.html                 # Maintain 100% coverage (with unit tests)
        ├── filesystem-mcp.ts.html           # Maintain 100% coverage (with unit tests)
        └── git-mcp.ts.html                  # Maintain 100% coverage (with unit tests)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Module Mock Hoisting
// All vi.mock() calls must be at top level, not inside tests or describe blocks
// Mock hoisting happens before imports, so order matters
// Pattern: Mock first, then import what you mocked
// WRONG: vi.mock() inside describe() block
// RIGHT: vi.mock() at top level, before imports

// CRITICAL: executeTool() is Inherited, Not Defined
// BashMCP, FilesystemMCP, GitMCP extend MCPHandler
// executeTool() method is inherited from MCPHandler base class
// Tests call executeTool(serverName, toolName, input), not class.executeTool()
// Gotcha: Tool executors are registered, not directly exposed

// CRITICAL: Tool Name Format
// executeTool() expects 'server__tool' format for tool name
// Examples: 'bash__execute_bash', 'filesystem__file_read', 'git__git_status'
// Pattern: server name + '__' + tool name from tool schema
// Gotcha: Double underscore separator, not single

// CRITICAL: ChildProcess Event Timing
// stdout/stderr 'data' events must fire before 'close' event
// Use setTimeout with delays: data (5ms), close (10ms)
// Pattern from tests/unit/tools/bash-mcp.test.ts lines 708-726
// Gotcha: Synchronous callbacks don't test real async behavior

// CRITICAL: Timeout Testing with Real Timers
// Use vi.useRealTimers() for timeout testing (fake timers hide race conditions)
// Test with short timeouts (50-100ms) for fast tests
// Pattern: Start command, wait for timeout, verify kill() was called
// Gotcha: Fake timers won't trigger setTimeout callbacks in normal flow

// CRITICAL: fs.promises Error Code Type
// Must cast error as NodeJS.ErrnoException to set .code property
// Pattern: const error = new Error('msg') as NodeJS.ErrnoException; error.code = 'ENOENT';
// Gotcha: TypeScript won't allow setting .code without cast

// CRITICAL: simple-git GitError Class
// GitError must be mocked as a class for instanceof checks in implementation
// Pattern: vi.mock('simple-git', () => ({ GitError: class MockGitError extends Error {...} }))
// Gotcha: Mocking as object won't work for instanceof checks

// CRITICAL: Git status().files Structure
// StatusResult.files has { path, index, working_dir } properties
// index='?' and working_dir='?' means untracked
// index !== ' ' means staged
// working_dir !== ' ' means modified
// Pattern from tests/unit/tools/git-mcp.test.ts lines 188-195

// CRITICAL: -- Separator for git add()
// git.add(['--', ...files]) prevents flag injection
// Security pattern from official MCP Git server
// Pattern from git-mcp.ts lines 392-398
// Gotcha: Don't forget the '--' separator when testing gitAdd

// CRITICAL: validateRepositoryPath() Check
// All git tools call validateRepositoryPath() before operations
// Checks both path exists AND .git directory exists
// Tests must mock existsSync to return true for both path and .git
// Gotcha: Mocking only path isn't enough, must also mock .git check

// CRITICAL: Mock Factory Functions
// Create reusable mock factories for consistent test objects
// Pattern: createMockChild(), createMockStatusResult()
// Prevents code duplication and ensures consistency
// Gotcha: Don't inline mock creation in every test

// CRITICAL: vi.mocked() for Type Safety
// Use vi.mocked() for proper TypeScript typing of mocked functions
// Pattern: const mockSpawn = vi.mocked(spawn);
// Gotcha: Using 'as any' works but loses type safety

// CRITICAL: afterEach Cleanup
// Always call vi.clearAllMocks() in afterEach to prevent test leakage
// Pattern: afterEach(() => { vi.clearAllMocks(); });
// Gotcha: Forgetting cleanup causes flaky tests due to mock state
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing types:

```typescript
// Import existing types from MCP tools
import type {
  BashToolInput,
  BashToolResult,
  FileReadInput,
  FileReadResult,
  FileWriteInput,
  FileWriteResult,
  GlobFilesInput,
  GlobFilesResult,
  GrepSearchInput,
  GrepSearchResult,
  GitStatusInput,
  GitStatusResult,
  GitDiffInput,
  GitDiffResult,
  GitAddInput,
  GitAddResult,
  GitCommitInput,
  GitCommitResult,
} from '../../src/tools/bash-mcp.js';
import type from '../../src/tools/filesystem-mcp.js';
import type from '../../src/tools/git-mcp.js';

// Mock ChildProcess factory (from bash-mcp.test.ts)
function createMockChild(options: {
  exitCode?: number;
  stdout?: string;
  stderr?: string;
}): ChildProcess {
  // Implementation from tests/unit/tools/bash-mcp.test.ts lines 696-731
}

// Mock Git instance factory (from git-mcp.test.ts)
const mockGitInstance = {
  status: vi.fn(),
  diff: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/tools.test.ts
  - IMPLEMENT: Integration tests for all three MCP classes
  - FOLLOW pattern: tests/integration/architect-agent.test.ts (integration test structure)
  - NAMING: tools.test.ts (matches tools directory under src/)
  - PLACEMENT: tests/integration/ directory

Task 2: MOCK child_process at module level
  - IMPLEMENT: vi.mock('node:child_process') for BashMCP
  - MOCK: spawn to return mock ChildProcess
  - FOLLOW pattern: tests/unit/tools/bash-mcp.test.ts lines 13-25
  - GOTCHA: Mock at top level before imports due to hoisting
  - NAMING: mockSpawn, mockExistsSync, mockRealpathSync (also mock node:fs for bash)

Task 3: MOCK fs.promises at module level
  - IMPLEMENT: vi.mock('node:fs') for FilesystemMCP and BashMCP
  - MOCK: readFile, writeFile, mkdir with vi.fn()
  - FOLLOW pattern: tests/unit/tools/filesystem-mcp.test.ts lines 13-25
  - GOTCHA: Mock promises, not sync fs functions
  - NAMING: mockReadFile, mockWriteFile, mockMkdir

Task 4: MOCK simple-git at module level
  - IMPLEMENT: vi.mock('simple-git') for GitMCP
  - MOCK: simpleGit to return mockGitInstance, GitError as class
  - FOLLOW pattern: tests/unit/tools/git-mcp.test.ts lines 23-34
  - GOTCHA: GitError must be mocked as a class
  - NAMING: mockSimpleGit, mockGitInstance

Task 5: TEST BashMCP.executeTool('bash__execute_bash')
  - IMPLEMENT: Test via executeTool() interface, not direct function call
  - SETUP: Create BashMCP instance, mock spawn to return mockChild
  - EXECUTE: await bashMCP.executeTool('bash', 'execute_bash', { command: 'echo test' })
  - VERIFY: Returns { success: true, stdout: 'test output', stderr: '', exitCode: 0 }
  - GOTCHA: executeTool() takes (server, tool, input), not 'server__tool'
  - NAMING: describe('BashMCP.executeTool', () => {...})
  - PLACEMENT: First test block after mocks

Task 6: TEST BashMCP handles timeout correctly
  - IMPLEMENT: Test timeout with real timers, verify kill() called
  - SETUP: Create mockChild that never closes, set timeout: 50
  - EXECUTE: await bashMCP.executeTool('bash', 'execute_bash', { command: 'sleep 100', timeout: 50 })
  - VERIFY: mockChild.kill called with 'SIGTERM', then 'SIGKILL' after 2s
  - FOLLOW pattern: tests/unit/tools/bash-mcp.test.ts lines 205-339
  - NAMING: it('should handle timeout correctly')
  - GOTCHA: Use vi.useRealTimers() for timeout tests

Task 7: TEST FilesystemMCP.executeTool('filesystem__file_read')
  - IMPLEMENT: Test via executeTool() interface with encoding
  - SETUP: Mock fs.readFile to return content
  - EXECUTE: await fsMCP.executeTool('filesystem', 'file_read', { path: './test.txt', encoding: 'utf-8' })
  - VERIFY: Returns { success: true, content: 'file content' }
  - GOTCHA: executeTool() returns raw result, not wrapped
  - NAMING: describe('FilesystemMCP.executeTool', () => {...})

Task 8: TEST FilesystemMCP.executeTool('filesystem__file_write') with createDirs
  - IMPLEMENT: Test directory creation when createDirs: true
  - SETUP: Mock fs.mkdir and fs.writeFile
  - EXECUTE: await fsMCP.executeTool('filesystem', 'file_write', { path: './deep/file.txt', content: 'x', createDirs: true })
  - VERIFY: fs.mkdir called with { recursive: true }, fs.writeFile called
  - GOTCHA: Directory path extracted from file path using path.sep split

Task 9: TEST FilesystemMCP.executeTool('filesystem__glob_files')
  - IMPLEMENT: Test glob pattern matching via fast-glob mock
  - SETUP: Mock fast-glob default to return file paths
  - EXECUTE: await fsMCP.executeTool('filesystem', 'glob_files', { pattern: '**/*.ts' })
  - VERIFY: Returns { success: true, matches: ['/path/to/file.ts'] }
  - GOTCHA: Must also mock fast-glob (vi.mock('fast-glob'))

Task 10: TEST FilesystemMCP.executeTool('filesystem__grep_search')
  - IMPLEMENT: Test regex search with line numbers
  - SETUP: Mock fs.readFile to return multi-line content
  - EXECUTE: await fsMCP.executeTool('filesystem', 'grep_search', { path: './test.txt', pattern: 'import' })
  - VERIFY: Returns { success: true, matches: [{ line: 1, content: 'import x' }] }
  - GOTCHA: Grep implementation reads entire file, then splits and searches

Task 11: TEST GitMCP.executeTool('git__git_status')
  - IMPLEMENT: Test git status with mixed file states
  - SETUP: Mock existsSync (path + .git), mock simpleGit().status()
  - EXECUTE: await gitMCP.executeTool('git', 'git_status', { path: './test-repo' })
  - VERIFY: Returns { success: true, branch: 'main', staged: [...], modified: [...], untracked: [...] }
  - GOTCHA: Must mock existsSync for both repo path and .git subdirectory
  - NAMING: describe('GitMCP.executeTool', () => {...})

Task 12: TEST GitMCP.executeTool('git__git_commit')
  - IMPLEMENT: Test commit creation with message
  - SETUP: Mock simpleGit().commit() to return commit hash
  - EXECUTE: await gitMCP.executeTool('git', 'git_commit', { path: './test-repo', message: 'Test commit' })
  - VERIFY: Returns { success: true, commitHash: 'abc123' }
  - GOTCHA: validateRepositoryPath() called before git operations

Task 13: RUN test suite and verify coverage
  - EXECUTE: npm run test:run -- tests/integration/tools.test.ts
  - VERIFY: All tests pass
  - EXECUTE: npm run test:coverage
  - VERIFY: Coverage for src/tools/*.ts remains at 100%
  - DOCUMENT: Any failing tests (should be none)

Task 14: VERIFY no real system operations
  - EXECUTE: Run tests with file system monitoring (strace -e trace=file,process npm test)
  - VERIFY: No real spawn(), readFile(), git commands executed
  - GOTCHA: All operations must go through mocks
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// MOCK PATTERN: Module-level mocking with hoisting
// =============================================================================

// Pattern: All mocks at top level before imports
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path: unknown) => path as string),
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

vi.mock('fast-glob', () => ({
  default: vi.fn(),
}));

vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));

// Import after mocking - get mocked versions
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs, existsSync, realpathSync } from 'node:fs';
import fg from 'fast-glob';
import { simpleGit, GitError } from 'simple-git';

// Create typed mock references
const mockSpawn = vi.mocked(spawn);
const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockMkdir = vi.mocked(fs.mkdir);
const mockFastGlob = vi.mocked(fg);
const mockSimpleGit = vi.mocked(simpleGit);

// Mock git instance factory
const mockGitInstance = {
  status: vi.fn(),
  diff: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
};

// =============================================================================
// MOCK FACTORY: createMockChild for ChildProcess
// =============================================================================

function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
): ChildProcess {
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

// =============================================================================
// TASK 5-6: Test BashMCP.executeTool()
// =============================================================================

describe('BashMCP.executeTool', () => {
  let bashMCP: BashMCP;

  beforeEach(() => {
    bashMCP = new BashMCP();
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation((path: unknown) => path as string);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute bash command and return result', async () => {
    // SETUP
    const mockChild = createMockChild({ stdout: 'hello world', exitCode: 0 });
    mockSpawn.mockReturnValue(mockChild);

    // EXECUTE
    const result = await bashMCP.executeTool('bash', 'execute_bash', {
      command: 'echo hello world',
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('hello world');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
    expect(result.error).toBeUndefined();

    // Verify spawn was called correctly
    expect(mockSpawn).toHaveBeenCalledWith(
      'echo',
      ['hello', 'world'],
      expect.objectContaining({
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    );
  });

  it('should handle timeout correctly with SIGTERM then SIGKILL', async () => {
    vi.useRealTimers(); // Use real timers for timeout testing

    // SETUP - Create a child that never closes
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
        childKilled = signal === 'SIGKILL';
      }),
      get killed() {
        return childKilled;
      },
    } as any;
    mockSpawn.mockReturnValue(stubbornChild);

    // EXECUTE - start command
    const resultPromise = bashMCP.executeTool('bash', 'execute_bash', {
      command: 'stubborn',
      timeout: 100,
    });

    // Wait for initial timeout + SIGKILL grace period
    await new Promise(resolve => setTimeout(resolve, 2250));

    // VERIFY - both SIGTERM and SIGKILL should be called
    expect(killCalls).toContain('SIGTERM');
    expect(killCalls).toContain('SIGKILL');

    // Clean up - trigger close to resolve promise
    if (closeCallback) {
      closeCallback(137); // SIGKILL exit code
    }
    await resultPromise;

    vi.useFakeTimers(); // Restore fake timers for other tests
  });
});

// =============================================================================
// TASK 7-10: Test FilesystemMCP.executeTool()
// =============================================================================

describe('FilesystemMCP.executeTool', () => {
  let fsMCP: FilesystemMCP;

  beforeEach(() => {
    fsMCP = new FilesystemMCP();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should read file with encoding', async () => {
    // SETUP
    const content = 'file content here';
    mockReadFile.mockResolvedValue(content as any);

    // EXECUTE
    const result = await fsMCP.executeTool('filesystem', 'file_read', {
      path: './test.txt',
      encoding: 'utf-8',
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.content).toBe(content);
    expect(result.error).toBeUndefined();
    expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
      encoding: 'utf-8',
    });
  });

  it('should create directories when createDirs is true', async () => {
    // SETUP
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    // EXECUTE
    const result = await fsMCP.executeTool('filesystem', 'file_write', {
      path: './deep/path/file.txt',
      content: 'content',
      createDirs: true,
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it('should match glob patterns', async () => {
    // SETUP
    const matches = ['/path/to/file1.ts', '/path/to/file2.ts'];
    mockFastGlob.mockResolvedValue(matches as any);

    // EXECUTE
    const result = await fsMCP.executeTool('filesystem', 'glob_files', {
      pattern: '**/*.ts',
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.matches).toEqual(matches);
    expect(mockFastGlob).toHaveBeenCalledWith('**/*.ts', {
      absolute: true,
      onlyFiles: true,
      cwd: expect.any(String),
    });
  });

  it('should search file content with regex', async () => {
    // SETUP
    const content = 'line 1\nimport x\nline 3';
    mockReadFile.mockResolvedValue(content as any);

    // EXECUTE
    const result = await fsMCP.executeTool('filesystem', 'grep_search', {
      path: './test.txt',
      pattern: 'import',
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.matches).toEqual([{ line: 2, content: 'import x' }]);
  });
});

// =============================================================================
// TASK 11-12: Test GitMCP.executeTool()
// =============================================================================

describe('GitMCP.executeTool', () => {
  let gitMCP: GitMCP;

  beforeEach(() => {
    gitMCP = new GitMCP();
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation((path: unknown) => path as string);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return git status with all file types', async () => {
    // SETUP
    mockGitInstance.status.mockResolvedValue({
      current: 'main',
      files: [
        { path: 'src/index.ts', index: 'M', working_dir: ' ' },
        { path: 'src/utils.ts', index: ' ', working_dir: 'M' },
        { path: 'newfile.txt', index: '?', working_dir: '?' },
      ],
      isClean: () => false,
    } as never);

    // EXECUTE
    const result = await gitMCP.executeTool('git', 'git_status', {
      path: './test-repo',
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.branch).toBe('main');
    expect(result.staged).toEqual(['src/index.ts']);
    expect(result.modified).toEqual(['src/utils.ts']);
    expect(result.untracked).toEqual(['newfile.txt']);
  });

  it('should create commit with message', async () => {
    // SETUP
    mockGitInstance.commit.mockResolvedValue({
      commit: 'abc123def456',
      branch: 'main',
    } as never);

    // EXECUTE
    const result = await gitMCP.executeTool('git', 'git_commit', {
      path: './test-repo',
      message: 'Test commit',
    });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.commitHash).toBe('abc123def456');
    expect(result.error).toBeUndefined();
    expect(mockGitInstance.commit).toHaveBeenCalledWith('Test commit', [], {});
  });
});
```

### Integration Points

```yaml
child_process:
  - mock: vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
  - pattern: spawn returns mock ChildProcess with data/close events

fs.promises:
  - mock: vi.mock('node:fs', () => ({ promises: { readFile, writeFile, mkdir } }))
  - pattern: mockResolvedValue for success, mockRejectedValue with errno for errors

simple-git:
  - mock: vi.mock('simple-git', () => ({ simpleGit, GitError: class ... }))
  - pattern: simpleGit returns mockGitInstance with status/diff/add/commit

fast-glob:
  - mock: vi.mock('fast-glob', () => ({ default: vi.fn() }))
  - pattern: mockResolvedValue with file path array

MCPHandler:
  - use: executeTool(serverName, toolName, input) interface
  - pattern: All MCP classes extend MCPHandler, inherit executeTool()

Test Execution:
  - command: npm run test:run -- tests/integration/tools.test.ts
  - command: npm run test:coverage -- tests/integration/tools.test.ts
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate test file has no syntax errors
npx tsc --noEmit tests/integration/tools.test.ts

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run MCP tools integration tests specifically
npm run test:run -- tests/integration/tools.test.ts

# Expected output:
# ✓ tests/integration/tools.test.ts (15+ tests)
# Test Files  1 passed (1)
# Tests  15+ passed (15+)
# Duration  <X seconds

# If any tests fail, debug root cause and fix
```

### Level 3: Coverage Validation (Quality Assurance)

```bash
# Generate coverage report for MCP tools
npm run test:coverage -- tests/integration/tools.test.ts tests/unit/tools/

# Expected output for src/tools/*.ts:
# --------------------|---------|---------|---------|---------|-------------------
# File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
# --------------------|---------|---------|---------|---------|-------------------
#  src/tools/bash-mcp.ts       |   100   |   100   |   100   |   100  |           ✅
#  src/tools/filesystem-mcp.ts |   100   |   100   |   100   |   100  |           ✅
#  src/tools/git-mcp.ts        |   100   |   100   |   100   |   100  |           ✅
# --------------------|---------|---------|---------|---------|-------------------

# If coverage < 100%, identify gaps and add tests
```

### Level 4: System Safety Validation (No Side Effects)

```bash
# Verify no real system operations are executed
# Run tests with strace to monitor system calls (Linux)
strace -e trace=execve,openat,write npm run test:run -- tests/integration/tools.test.ts 2>&1 | grep -E '(execve|npm|git)' | grep -v 'npm itself'

# Expected: No execve calls for bash commands (echo, sleep, etc.)
# Expected: No openat calls for actual file operations
# Expected: No execve calls for git commands

# Alternative: Run tests in a clean temp directory and check for file creation
cd /tmp
mkdir test-mcp-$$
cd test-mcp-$$
npm run test:run -- /home/dustin/projects/hacky-hack/tests/integration/tools.test.ts
ls -la  # Should show no unexpected files created

# Expected: No files created by the tests (all mocked)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All tests pass: `npm run test:run -- tests/integration/tools.test.ts`
- [ ] Coverage 100% for all tools/*.ts: `npm run test:coverage`
- [ ] No type errors: `npx tsc --noEmit tests/integration/tools.test.ts`
- [ ] No real system operations executed (verified via strace or temp dir test)

### Contract Requirements Validation

- [ ] Mock child_process.spawn successfully ✅
- [ ] Mock fs.promises (readFile, writeFile, mkdir) successfully ✅
- [ ] Mock simple-git successfully ✅
- [ ] Test BashMCP.executeTool() returns { success, stdout, stderr, exitCode } ✅
- [ ] Test BashMCP handles timeout correctly ✅
- [ ] Test FilesystemMCP.executeTool('file_read') returns { success, content } ✅
- [ ] Test FilesystemMCP.executeTool('file_write') creates directories when createDirs: true ✅
- [ ] Test FilesystemMCP.executeTool('glob_files') returns { success, matches[] } ✅
- [ ] Test FilesystemMCP.executeTool('grep_search') returns { success, matches[] } ✅
- [ ] Test GitMCP.executeTool('git_status') returns structured status ✅
- [ ] Test GitMCP.executeTool('git_commit') returns { success, commitHash } ✅

### Code Quality Validation

- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Test names are descriptive and specify behavior
- [ ] Mock isolation with vi.clearAllMocks() in afterEach
- [ ] Module-level mocks at top of file (before imports)
- [ ] Type safety with vi.mocked() for all mock references
- [ ] No real LLM calls, file operations, or git operations

### Documentation & Sign-Off

- [ ] Research documents stored and referenced
- [ ] Coverage report saved/verified
- [ ] executeTool() interface validated for all MCP tools
- [ ] Ready for sign-off

---

## Anti-Patterns to Avoid

- ❌ Don't test direct function calls (executeBashCommand, readFile, etc.) - test executeTool() interface
- ❌ Don't place vi.mock() inside describe blocks (must be top level)
- ❌ Don't import before mocking (hoisting order matters)
- ❌ Don't forget to mock fast-glob for FilesystemMCP.glob_files
- ❌ Don't forget to mock existsSync for BashMCP (cwd validation) and GitMCP (repo validation)
- ❌ Don't use fake timers for timeout testing (use real timers to catch race conditions)
- ❌ Don't forget to cast errors as NodeJS.ErrnoException when setting .code
- ❌ Don't mock GitError as object (must be class for instanceof checks)
- ❌ Don't forget -- separator for git.add() calls in tests
- ❌ Don't test implementation details - test the executeTool() interface behavior
- ❌ Don't skip cleanup in afterEach (causes test leakage)
- ❌ Don't use 'as any' excessively (prefer vi.mocked() for type safety)

---

## Confidence Score

**9/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ Existing unit tests provide complete mock patterns to follow
- ✅ MCP tool implementations are straightforward and well-documented
- ✅ executeTool() interface is consistent across all MCP classes
- ✅ Research documents provide best practices for each dependency
- ✅ Test patterns (AAA, beforeEach/afterEach, vi.clearAllMocks) are established
- ✅ All contract requirements are specific and measurable
- ✅ No ambiguity about what needs to be tested
- ⚠️ Minor complexity: Understanding executeTool() interface vs direct function calls
- ⚠️ Need to ensure all mocks are comprehensive (fast-glob, existsSync, etc.)

**Validation**: This PRP provides:
1. Exact mock patterns from existing unit tests
2. Specific test cases for all contract requirements
3. Clear expected outcomes for each test
4. Complete context on MCP tools and testing patterns
5. Gotchas and anti-patterns to avoid
6. Research documents on best practices for each dependency

The low risk comes from having comprehensive existing tests to reference and well-understood testing patterns in the codebase.
