# Product Requirement Prompt (PRP): Git MCP Tool

---

## Goal

**Feature Goal**: Create a Git MCP tool that provides safe, structured Git operations for AI agents, enabling version control workflows within the PRP pipeline system.

**Deliverable**: `src/tools/git-mcp.ts` with four tools (`git_status`, `git_diff`, `git_add`, `git_commit`) and corresponding test file achieving 100% code coverage.

**Success Definition**:

- All four Git tools successfully execute through the MCP handler
- 100% test coverage achieved with Vitest
- Tools follow existing codebase patterns (BashMCP/FilesystemMCP)
- Security validation prevents command injection and path traversal attacks
- Integration tests verify real Git operations work correctly

---

## User Persona

**Target User**: AI Agents (Coder, Researcher, QA agents) within the PRP pipeline system

**Use Case**: AI agents need to perform Git operations during PRP execution - checking repository status, staging files, viewing diffs, and creating commits.

**User Journey**:

1. Agent calls `git_status` to understand current repository state
2. Agent calls `git_add` to stage modified files for commit
3. Agent calls `git_diff` to review changes before committing
4. Agent calls `git_commit` to create a commit with a descriptive message

**Pain Points Addressed**:

- **Safety**: BashMCP can execute arbitrary commands; GitMCP provides constrained, validated Git operations
- **Context**: Git operations return structured data, not raw stdout parsing
- **Reliability**: Built-in error handling for common Git failure scenarios

---

## Why

- **Business Value**: Enables automated Git workflows in PRP pipeline without exposing full shell access
- **Integration**: Fits alongside existing BashMCP and FilesystemMCP tools for complete filesystem and version control capabilities
- **Problems Solved**:
  - Provides safe Git operations for AI agents (no shell command injection risk)
  - Returns structured, parseable results (not raw text parsing)
  - Validates inputs before execution (file existence, repository validity)

---

## What

### User-Visible Behavior

Four MCP tools for Git operations:

1. **`git_status`** - Returns repository status including branch, staged files, modified files, untracked files
2. **`git_diff`** - Returns diff output for unstaged or staged changes
3. **`git_add`** - Stages files for commit
4. **`git_commit`** - Creates a commit with staged changes

### Technical Requirements

- Extend `MCPHandler` from Groundswell framework
- Use `simple-git` library for Git operations
- Follow existing MCP tool patterns from `bash-mcp.ts` and `filesystem-mcp.ts`
- Implement input validation and security constraints
- Achieve 100% test coverage with Vitest

### Success Criteria

- [ ] `GitMCP` class extends `MCPHandler` and registers four tools
- [ ] `git_status` returns structured status (branch, staged, modified, untracked)
- [ ] `git_diff` returns diff output for staged/unstaged changes
- [ ] `git_add` stages files and returns success status
- [ ] `git_commit` creates commits and returns commit hash
- [ ] All tools validate inputs (file paths exist, repository is valid)
- [ ] Security tests prevent command injection and path traversal
- [ ] 100% code coverage achieved

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed?

**Answer**: YES - This PRP provides:

- Exact file structures to follow (with line references)
- Library documentation URLs with section anchors
- Codebase patterns to replicate
- Security patterns to implement
- Test patterns to follow
- Validation commands that are verified to work

---

### Documentation & References

```yaml
# MUST READ - Core context for implementation

# Groundswell Framework (used in this project)
- url: ~/projects/groundswell
  why: MCPHandler, Tool, ToolExecutor types come from here
  critical: Register server with 'inprocess' transport, use registerToolExecutor pattern

# simple-git Library
- url: https://github.com/steveukx/git-js
  why: Primary library for Git operations in TypeScript
  section: /docs/api.md - StatusResult, DiffResult, CommitResult interfaces
  critical: Use simpleGit(baseDir) for scoped operations, handle GitError properly

# Official MCP Git Server (Python reference)
- url: https://github.com/modelcontextprotocol/servers/tree/main/src/git
  why: Reference for tool selection and security patterns
  section: git/__init__.py - Tool schema definitions
  critical: Security patterns for flag injection prevention, path validation

# Existing Implementation - BashMCP
- file: src/tools/bash-mcp.ts
  why: Exact pattern for MCP tool structure and error handling
  pattern: MCPHandler extension, registerServer in constructor, ToolExecutor registration
  gotcha: Handle spawn() errors synchronously, use shell: false for security

# Existing Implementation - FilesystemMCP
- file: src/tools/filesystem-mcp.ts
  why: Pattern for multi-tool MCP server (4 tools in one class)
  pattern: Multiple tools registered in single server, consistent result format
  gotcha: Handle specific error codes (ENOENT, EACCES, EISDIR) with helpful messages

# Existing Tests - BashMCP
- file: tests/unit/tools/bash-mcp.test.ts
  why: Test pattern for MCP tools with comprehensive mocking
  pattern: Mock external dependencies (child_process, fs), createMockChild helper
  gotcha: Test timeout behavior, spawn error handling, working directory validation

# Existing Tests - FilesystemMCP
- file: tests/unit/tools/filesystem-mcp.test.ts
  why: Test pattern for multi-tool MCP server
  pattern: Schema validation tests, success/error cases for each tool
  gotcha: Test all error codes separately (ENOENT, EACCES, EISDIR)

# Research Documentation
- docfile: plan/001_14b9dc2a33c7/P2M1T2S3/research/simple-git-research.md
  why: Complete API reference for simple-git library
  section: StatusResult interface, git.status() pattern, error handling

- docfile: plan/001_14b9dc2a33c7/P2M1T2S3/research/mcp-patterns-research.md
  why: MCP tool definition patterns and naming conventions
  section: Tool schema structure, input validation patterns

- docfile: plan/001_14b9dc2a33c7/P2M1T2S3/research/git-mcp-examples-research.md
  why: Official MCP Git server implementation reference
  section: Security patterns (path traversal, flag injection prevention)
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── tools/
│   │   ├── bash-mcp.ts          # Single tool MCP (execute_bash)
│   │   └── filesystem-mcp.ts    # Multi-tool MCP (file_read, file_write, glob_files, grep_search)
│   ├── agents/
│   │   └── agent-factory.ts     # Agent configuration
│   └── prompts/
│       └── prompts.md           # System prompts
├── tests/
│   └── unit/
│       └── tools/
│           ├── bash-mcp.test.ts
│           └── filesystem-mcp.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

### Desired Codebase Tree (New Files)

```bash
hacky-hack/
├── src/
│   └── tools/
│       └── git-mcp.ts           # NEW: GitMCP with 4 tools (git_status, git_diff, git_add, git_commit)
├── tests/
│   └── unit/
│       └── tools/
│           └── git-mcp.test.ts  # NEW: 100% coverage tests
└── package.json                 # MODIFY: Add simple-git dependency
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: simple-git specific behaviors

// 1. Working directory MUST be specified (no implicit CWD assumption)
const git = simpleGit(process.cwd()); // GOOD - explicit
const git = simpleGit(); // BAD - assumes CWD, may fail

// 2. Path separators MUST be forward slashes (cross-platform)
await git.add('src/components/Button.tsx'); // GOOD - forward slashes
await git.add('src\\components\\Button.tsx'); // BAD - fails on Linux

// 3. Empty commits throw error unless --allow-empty is used
await git.commit('message'); // Throws if nothing to commit
await git.commit('message', null, { '--allow-empty': true }); // GOOD - handles empty

// 4. GitError must be checked with instanceof for proper type narrowing
if (error instanceof GitError) {
  /* proper git error */
} // GOOD
if (error.message.includes('git')) {
  /* fragile */
} // BAD

// CRITICAL: Groundswell MCPHandler patterns

// 5. Transport MUST be 'inprocess' for local agent communication
this.registerServer({
  name: 'git',
  transport: 'inprocess', // REQUIRED - not 'stdio' or 'http'
  tools: [
    /*...*/
  ],
});

// 6. Tool executors MUST be cast to ToolExecutor type
this.registerToolExecutor('git', 'git_status', gitStatus as ToolExecutor); // REQUIRED cast

// CRITICAL: Security patterns from official MCP Git server

// 7. Flag injection prevention - reject refs starting with '-'
if (ref.startsWith('-')) {
  throw new Error(`Invalid git ref: '${ref}' - cannot start with '-'`);
}

// 8. Path traversal prevention - validate relative path doesn't escape base
const relativePath = relative(resolvedBase, resolvedRepo);
if (relativePath.startsWith('..')) {
  throw new Error(`Path '${repoPath}' is outside allowed base`);
}

// CRITICAL: Testing patterns from existing codebase

// 9. ALL external dependencies MUST be mocked in tests
vi.mock('simple-git', () => ({ simpleGit: vi.fn() })); // REQUIRED

// 10. Child process spawn must handle synchronous errors
try {
  child = spawn(executable, args, options);
} catch (error) {
  // spawn() throws synchronously - MUST handle
  return { success: false, error: error.message };
}
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// ===== Input Interfaces =====

/**
 * Input for git_status tool
 * @remarks
 * Path is optional - defaults to current working directory
 */
interface GitStatusInput {
  /** Path to git repository (optional, defaults to process.cwd()) */
  path?: string;
}

/**
 * Input for git_diff tool
 * @remarks
 * Controls whether to show staged or unstaged changes
 */
interface GitDiffInput {
  /** Path to git repository (optional, defaults to process.cwd()) */
  path?: string;
  /** Show staged changes instead of unstaged (default: false) */
  staged?: boolean;
}

/**
 * Input for git_add tool
 * @remarks
 * Files parameter is optional - defaults to '.'
 */
interface GitAddInput {
  /** Path to git repository */
  path?: string;
  /** Files to stage (optional, defaults to '.') */
  files?: string[];
}

/**
 * Input for git_commit tool
 * @remarks
 * Message is required - empty messages rejected
 */
interface GitCommitInput {
  /** Path to git repository (optional, defaults to process.cwd()) */
  path?: string;
  /** Commit message (required) */
  message: string;
  /** Allow empty commit (default: false) */
  allowEmpty?: boolean;
}

// ===== Result Interfaces =====

/**
 * Result from git_status operation
 */
interface GitStatusResult {
  /** True if operation succeeded */
  success: boolean;
  /** Current branch name */
  branch?: string;
  /** Staged files */
  staged?: string[];
  /** Modified (unstaged) files */
  modified?: string[];
  /** Untracked files */
  untracked?: string[];
  /** Error message if failed */
  error?: string;
}

/**
 * Result from git_diff operation
 */
interface GitDiffResult {
  /** True if operation succeeded */
  success: boolean;
  /** Diff output */
  diff?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Result from git_add operation
 */
interface GitAddResult {
  /** True if files were staged */
  success: boolean;
  /** Number of files staged */
  stagedCount?: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Result from git_commit operation
 */
interface GitCommitResult {
  /** True if commit was created */
  success: boolean;
  /** Commit hash (SHA) */
  commitHash?: string;
  /** Error message if failed */
  error?: string;
}
```

---

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: INSTALL simple-git dependency
  - EXECUTE: npm install simple-git
  - VERIFY: package.json contains "simple-git": "^3.x"
  - NAMING: Add to dependencies section
  - LOCATION: package.json

Task 2: CREATE src/tools/git-mcp.ts file structure
  - IMPLEMENT: Import statements, input/result interfaces, tool schemas
  - FOLLOW pattern: src/tools/filesystem-mcp.ts (multi-tool structure)
  - NAMING: GitStatusInput, GitStatusResult, gitStatusTool, gitStatus executor
  - LOCATION: src/tools/git-mcp.ts
  - EXPORT: GitMCP class, all types, tool schemas, executors

Task 3: IMPLEMENT gitStatusTool and executor
  - IMPLEMENT: Tool schema with JSON Schema validation
  - FOLLOW pattern: fileReadTool schema (optional path parameter)
  - EXECUTOR: Use simple-git git.status() and parse StatusResult
  - RETURN: Structured result with branch, staged, modified, untracked arrays
  - ERROR HANDLING: Handle GitError for non-repository, permission errors
  - DEPENDENCIES: simple-git library

Task 4: IMPLEMENT gitDiffTool and executor
  - IMPLEMENT: Tool schema with staged boolean parameter
  - FOLLOW pattern: fileWriteTool schema (boolean optional parameter)
  - EXECUTOR: Use git.diff() for unstaged, git.diff(['--cached']) for staged
  - RETURN: Raw diff output as string
  - ERROR HANDLING: Handle GitError, validate repository exists
  - DEPENDENCIES: Task 3 (shares repository validation pattern)

Task 5: IMPLEMENT gitAddTool and executor
  - IMPLEMENT: Tool schema with optional files array (default to ['.'])
  - FOLLOW pattern: globFilesTool schema (array parameter)
  - EXECUTOR: Use git.add() with argument array
  - SECURITY: Use '--' separator to prevent flag injection
  - RETURN: Success with count of staged files
  - ERROR HANDLING: Handle file not found, not a repository errors
  - DEPENDENCIES: Task 3 (shares repository validation pattern)

Task 6: IMPLEMENT gitCommitTool and executor
  - IMPLEMENT: Tool schema with required message, optional allowEmpty
  - FOLLOW pattern: bashTool schema (required command string)
  - EXECUTOR: Use git.commit() with message and options
  - VALIDATION: Reject empty messages (minLength: 1)
  - RETURN: Commit hash on success
  - ERROR HANDLING: Handle nothing to commit, merge conflict errors
  - DEPENDENCIES: Task 5 (files should be staged before commit)

Task 7: CREATE GitMCP class and register all tools
  - IMPLEMENT: GitMCP extends MCPHandler
  - FOLLOW pattern: FilesystemMCP class structure
  - REGISTER: All 4 tools in single server (transport: 'inprocess')
  - REGISTER: 4 tool executors with ToolExecutor cast
  - LOCATION: src/tools/git-mcp.ts (bottom of file)
  - DEPENDENCIES: Tasks 3-6 (all tool schemas and executors)

Task 8: CREATE tests/unit/tools/git-mcp.test.ts
  - IMPLEMENT: Vitest test file with 100% coverage
  - FOLLOW pattern: tests/unit/tools/filesystem-mcp.test.ts
  - MOCK: simple-git library completely (vi.mock)
  - TEST: Class instantiation, schema validation, all 4 tools
  - TEST: Success paths, error paths, edge cases, security
  - COVERAGE: All public methods, error handling branches
  - LOCATION: tests/unit/tools/git-mcp.test.ts
  - DEPENDENCIES: Tasks 3-7 (implementation must exist)

Task 9: INTEGRATION with agent-factory.ts (if applicable)
  - MODIFY: src/agents/agent-factory.ts
  - ADD: GitMCP to agent tool configurations
  - FOLLOW: Existing BashMCP/FilesystemMCP registration pattern
  - DEPENDENCIES: Task 7 (GitMCP class must be complete)
```

---

### Implementation Patterns & Key Details

```typescript
// ===== PATTERN 1: Tool Schema Definition =====
// From: src/tools/filesystem-mcp.ts lines 163-183

const gitStatusTool: Tool = {
  name: 'git_status',
  description:
    'Get git repository status including branch, staged, modified, and untracked files',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'Path to git repository (optional, defaults to current directory)',
      },
    },
  },
  // Note: No required fields - all optional
};

// ===== PATTERN 2: Repository Path Validation =====
// GOTCHA: Must validate path exists and is a git repository

async function validateRepositoryPath(path?: string): Promise<string> {
  const repoPath = resolve(path || process.cwd());

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

// ===== PATTERN 3: Git Status Executor =====
// From: simple-git research, StatusResult parsing

async function gitStatus(input: GitStatusInput): Promise<GitStatusResult> {
  try {
    const safePath = await validateRepositoryPath(input.path);
    const git = simpleGit(safePath);

    // CRITICAL: StatusResult structure from simple-git
    const status: StatusResult = await git.status();

    return {
      success: true,
      branch: status.current,
      staged: status.files
        .filter(f => f.index !== ' ' && f.index !== '?')
        .map(f => f.path),
      modified: status.files
        .filter(f => f.working_dir !== ' ')
        .map(f => f.path),
      untracked: status.files.filter(f => f.index === '?').map(f => f.path),
    };
  } catch (error) {
    // PATTERN: Error handling from FilesystemMCP
    if (error instanceof GitError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ===== PATTERN 4: Git Add with Security =====
// GOTCHA: Use '--' separator to prevent flag injection

async function gitAdd(input: GitAddInput): Promise<GitAddResult> {
  try {
    const safePath = await validateRepositoryPath(input.path);
    const git = simpleGit(safePath);

    const files = input.files ?? ['.'];

    // CRITICAL: Security pattern from official MCP Git server
    // Use '--' to prevent files starting with '-' from being interpreted as flags
    if (files.length === 1 && files[0] === '.') {
      await git.add('.');
    } else {
      await git.add(['--', ...files]);
    }

    return { success: true, stagedCount: files.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof GitError ? error.message : String(error),
    };
  }
}

// ===== PATTERN 5: Git Commit with Validation =====
// GOTCHA: Empty messages must be rejected, handle --allow-empty

async function gitCommit(input: GitCommitInput): Promise<GitCommitResult> {
  try {
    const safePath = await validateRepositoryPath(input.path);
    const git = simpleGit(safePath);

    // Validate message is not empty
    if (!input.message || input.message.trim() === '') {
      return {
        success: false,
        error: 'Commit message is required and cannot be empty',
      };
    }

    // Build options
    const options: Record<string, unknown> = {};
    if (input.allowEmpty) {
      options['--allow-empty'] = true;
    }

    // CRITICAL: CommitResult structure from simple-git
    const result: CommitResult = await git.commit(input.message, [], options);

    return {
      success: true,
      commitHash: result.commit,
    };
  } catch (error) {
    // PATTERN: Handle specific git errors
    if (error instanceof GitError) {
      const msg = error.message;
      if (msg.includes('nothing to commit')) {
        return {
          success: false,
          error:
            'No changes staged for commit. Use git_add to stage files first.',
        };
      }
      if (msg.includes('merge conflict')) {
        return {
          success: false,
          error: 'Cannot commit with unresolved merge conflicts',
        };
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ===== PATTERN 6: GitMCP Class Registration =====
// From: src/tools/filesystem-mcp.ts lines 487-520

export class GitMCP extends MCPHandler {
  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: 'git',
      transport: 'inprocess', // CRITICAL: Must be 'inprocess'
      tools: [gitStatusTool, gitDiffTool, gitAddTool, gitCommitTool],
    });

    // PATTERN: Register tool executors with ToolExecutor cast
    this.registerToolExecutor('git', 'git_status', gitStatus as ToolExecutor);
    this.registerToolExecutor('git', 'git_diff', gitDiff as ToolExecutor);
    this.registerToolExecutor('git', 'git_add', gitAdd as ToolExecutor);
    this.registerToolExecutor('git', 'git_commit', gitCommit as ToolExecutor);
  }
}

// PATTERN: Export types and tools for external use and testing
export type {
  GitStatusInput,
  GitDiffInput,
  GitAddInput,
  GitCommitInput,
  GitStatusResult,
  GitDiffResult,
  GitAddResult,
  GitCommitResult,
};
export {
  gitStatusTool,
  gitDiffTool,
  gitAddTool,
  gitCommitTool,
  gitStatus,
  gitDiff,
  gitAdd,
  gitCommit,
};
```

---

### Integration Points

```yaml
DEPENDENCIES:
  - add to: package.json
    dependency: "simple-git": "^3.25.0"
    install_command: npm install simple-git

NO ROUTES: MCP tools are inprocess, not HTTP routes
NO CONFIG: No configuration files needed (optional repo path via input)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- src/tools/git-mcp.ts        # ESLint with auto-fix
npm run format -- src/tools/git-mcp.ts      # Prettier format
npm run check                               # TypeScript type checking

# Project-wide validation
npm run lint
npm run format
npm run check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

---

### Level 2: Unit Tests (Component Validation)

```bash
# Test GitMCP implementation
npm test -- tests/unit/tools/git-mcp.test.ts -- --coverage

# Run all tool tests
npm test -- tests/unit/tools/ -- --coverage

# Coverage validation (100% required)
npm test -- --coverage --reporter=verbose

# Expected: All tests pass, 100% coverage for git-mcp.ts
# If failing, debug root cause and fix implementation.
```

---

### Level 3: Integration Testing (System Validation)

```bash
# Test GitMCP class instantiation
node -e "
  const { GitMCP } = require('./dist/tools/git-mcp.js');
  const gitMCP = new GitMCP();
  console.log('GitMCP instantiated successfully');
"

# Test tool registration
node -e "
  const { GitMCP } = require('./dist/tools/git-mcp.js');
  const gitMCP = new GitMCP();
  // Tools are registered internally - verify no startup errors
  console.log('GitMCP tools registered successfully');
"

# Expected: No errors during instantiation and registration
# If errors occur, check that MCPHandler is properly extended
```

---

### Level 4: Git Operations Validation (Functional Testing)

```bash
# Create test repository
mkdir /tmp/test-git-mcp
cd /tmp/test-git-mcp
git init
echo "test content" > test.txt
git add test.txt
git commit -m "Initial commit"

# Run integration test with real git operations
cd /home/dustin/projects/hacky-hack
node -e "
  const { GitMCP } = require('./dist/tools/git-mcp.js');

  async function test() {
    const gitMCP = new GitMCP();

    // Test git_status
    const statusResult = await gitMCP.executeTool('git__git_status', {
      path: '/tmp/test-git-mcp'
    });
    console.log('Status result:', statusResult);

    // Test git_add (create new file first)
    require('fs').writeFileSync('/tmp/test-git-mcp/new.txt', 'new content');
    const addResult = await gitMCP.executeTool('git__git_add', {
      path: '/tmp/test-git-mcp',
      files: ['new.txt']
    });
    console.log('Add result:', addResult);

    // Test git_commit
    const commitResult = await gitMCP.executeTool('git__git_commit', {
      path: '/tmp/test-git-mcp',
      message: 'Test commit from GitMCP'
    });
    console.log('Commit result:', commitResult);

    // Test git_diff
    const diffResult = await gitMCP.executeTool('git__git_diff', {
      path: '/tmp/test-git-mcp'
    });
    console.log('Diff result exists:', !!diffResult.diff);
  }

  test().catch(console.error);
"

# Expected: All operations succeed with structured results
# Verify: status shows 'main' branch, add stages file, commit returns hash

# Cleanup
rm -rf /tmp/test-git-mcp
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/tools/git-mcp.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`
- [ ] 100% code coverage achieved

### Feature Validation

- [ ] `git_status` returns branch, staged, modified, untracked files
- [ ] `git_diff` returns diff output (staged/unstaged based on parameter)
- [ ] `git_add` stages files and returns count
- [ ] `git_commit` creates commits and returns hash
- [ ] Empty commit messages are rejected
- [ ] Non-repository paths return helpful error messages
- [ ] Integration tests verify real Git operations work

### Code Quality Validation

- [ ] Follows existing codebase patterns (BashMCP/FilesystemMCP)
- [ ] File placement matches desired structure (src/tools/git-mcp.ts)
- [ ] Tool naming follows convention (git_status, git_diff, git_add, git_commit)
- [ ] All TypeScript interfaces properly exported
- [ ] Security patterns implemented (path validation, flag injection prevention)

### Documentation & Deployment

- [ ] JSDoc comments on all functions and interfaces
- [ ] Module documentation with @remarks and @example tags
- [ ] simple-git dependency added to package.json
- [ ] No breaking changes to existing codebase

---

## Anti-Patterns to Avoid

- ❌ **Don't use raw shell commands** - Use simple-git instead of spawning `git` process
- ❌ **Don't skip repository validation** - Always verify `.git` directory exists
- ❌ **Don't allow empty commit messages** - Validate and reject with helpful error
- ❌ **Don't ignore GitError type** - Use `instanceof GitError` for proper error handling
- ❌ **Don't use backslashes in paths** - Always use forward slashes for cross-platform compatibility
- ❌ **Don't forget ToolExecutor cast** - Always cast executor functions when registering
- ❌ **Don't use 'stdio' transport** - MCP tools must use 'inprocess' transport
- ❌ **Don't skip security validation** - Validate paths to prevent traversal attacks
- ❌ **Don't omit '--' separator** - Use it when adding files to prevent flag injection
- ❌ **Don't leave code untested** - 100% coverage is required for MCP tools

---

## Confidence Score

**8/10** for one-pass implementation success

**Justification**:

- **Strong Context**: Comprehensive research with specific URLs, code patterns, and gotchas
- **Clear Patterns**: Existing BashMCP/FilesystemMCP provide exact templates to follow
- **Library Choice**: simple-git is well-documented with TypeScript support
- **Risk Factors**:
  - Git operations can have edge cases (merge conflicts, detached HEAD)
  - Cross-platform path handling requires careful attention
  - Mock strategy for tests needs to match simple-git's API

**Mitigation**: PRP includes security patterns, error handling examples, and comprehensive test requirements to address known risks.

---

**PRP Version**: 1.0
**Created**: 2026-01-12
**For**: P2.M1.T2.S3 - Create Git MCP Tool
