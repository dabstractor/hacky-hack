# Git MCP Tool Implementation Research

**Research Date:** 2026-01-12
**Researcher:** Claude Code Agent
**Purpose:** Gather reference patterns and examples for implementing Git MCP tools

---

## Executive Summary

This research documents existing Git MCP tool implementations, patterns, and best practices. The primary reference is the official Model Context Protocol (MCP) Git server implementation by Anthropic, along with analysis of existing MCP tools in the current codebase.

**Key Finding:** The official MCP Git server is implemented in Python using GitPython, while the current project uses TypeScript with the Groundswell framework. This research provides patterns to adapt for TypeScript implementation.

---

## 1. Official MCP Git Server Implementation

### Repository Details

**Repository:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
**Subdirectory:** `src/git/`
**Language:** Python
**Version:** 0.6.2
**License:** MIT
**Maintainer:** David Soria Parra (Anthropic)

### Core Dependencies

```python
# From pyproject.toml
dependencies = [
    "click>=8.1.7",           # CLI framework
    "gitpython>=3.1.45",      # Git operations library
    "mcp>=1.0.0",             # MCP protocol SDK
    "pydantic>=2.0.0",        # Data validation
]
```

**TypeScript Equivalent Dependencies:**

- `gitpython` → `simple-git` or `isomorphic-git`
- `pydantic` → `zod` (already in project)
- `mcp` → `groundswell` (already in project)

---

## 2. Tool Catalog (12 Tools)

### 2.1 Repository Status Tools

#### `git_status`

- **Purpose:** Shows working tree status
- **Input:** `repo_path` (string)
- **Output:** Text status output
- **Implementation:** Direct wrapper around `repo.git.status()`

```python
def git_status(repo: git.Repo) -> str:
    return repo.git.status()
```

#### `git_diff_unstaged`

- **Purpose:** Shows unstaged changes
- **Input:** `repo_path`, `context_lines` (optional, default: 3)
- **Output:** Unified diff format
- **Pattern:** Configurable context lines for readability

```python
def git_diff_unstaged(repo: git.Repo, context_lines: int = DEFAULT_CONTEXT_LINES) -> str:
    return repo.git.diff(f"--unified={context_lines}")
```

#### `git_diff_staged`

- **Purpose:** Shows staged changes
- **Input:** `repo_path`, `context_lines` (optional, default: 3)
- **Output:** Unified diff format with `--cached` flag
- **Implementation:**

```python
def git_diff_staged(repo: git.Repo, context_lines: int = DEFAULT_CONTEXT_LINES) -> str:
    return repo.git.diff(f"--unified={context_lines}", "--cached")
```

#### `git_diff`

- **Purpose:** Compare branches or commits
- **Input:** `repo_path`, `target`, `context_lines` (optional)
- **Security:** **CRITICAL PATTERN** - Validates target to prevent flag injection
- **Implementation:**

```python
def git_diff(repo: git.Repo, target: str, context_lines: int = DEFAULT_CONTEXT_LINES) -> str:
    # Defense in depth: reject targets starting with '-'
    if target.startswith("-"):
        raise BadName(f"Invalid target: '{target}' - cannot start with '-'")
    repo.rev_parse(target)  # Validates target is a real git ref
    return repo.git.diff(f"--unified={context_lines}", target)
```

**Security Pattern to Implement:**

```typescript
function validateGitRef(ref: string): void {
  if (ref.startsWith('-')) {
    throw new Error(`Invalid git ref: '${ref}' - cannot start with '-'`);
  }
  // Additional validation logic
}
```

---

### 2.2 Commit and Staging Tools

#### `git_add`

- **Purpose:** Stage files for commit
- **Input:** `repo_path`, `files` (string array)
- **Security Pattern:** Uses `--` separator to prevent flag injection
- **Implementation:**

```python
def git_add(repo: git.Repo, files: list[str]) -> str:
    if files == ["."]:
        repo.git.add(".")
    else:
        # Use '--' to prevent files starting with '-' from being interpreted as options
        repo.git.add("--", *files)
    return "Files staged successfully"
```

**TypeScript Adaptation:**

```typescript
async function gitAdd(repoPath: string, files: string[]): Promise<string> {
  if (files.length === 1 && files[0] === '.') {
    await git.cwd(repoPath).add('.');
  } else {
    await git.cwd(repoPath).add(['--', ...files]);
  }
  return 'Files staged successfully';
}
```

#### `git_commit`

- **Purpose:** Create commit
- **Input:** `repo_path`, `message`
- **Output:** Confirmation with commit hash
- **Implementation:**

```python
def git_commit(repo: git.Repo, message: str) -> str:
    commit = repo.index.commit(message)
    return f"Changes committed successfully with hash {commit.hexsha}"
```

#### `git_reset`

- **Purpose:** Unstage all changes
- **Input:** `repo_path`
- **Implementation:**

```python
def git_reset(repo: git.Repo) -> str:
    repo.index.reset()
    return "All staged changes reset"
```

---

### 2.3 History and Log Tools

#### `git_log`

- **Purpose:** Show commit history with optional date filtering
- **Input:** `repo_path`, `max_count` (default: 10), `start_timestamp`, `end_timestamp`
- **Advanced Feature:** Flexible timestamp parsing (ISO 8601, relative dates, absolute dates)
- **Implementation:**

```python
def git_log(repo: git.Repo, max_count: int = 10,
            start_timestamp: Optional[str] = None,
            end_timestamp: Optional[str] = None) -> list[str]:
    if start_timestamp or end_timestamp:
        args = []
        if start_timestamp:
            args.extend(['--since', start_timestamp])
        if end_timestamp:
            args.extend(['--until', end_timestamp])
        args.extend(['--format=%H%n%an%n%ad%n%s%n'])

        log_output = repo.git.log(*args).split('\n')
        # Process commits in groups of 4 (hash, author, date, message)
        log = []
        for i in range(0, len(log_output), 4):
            if i + 3 < len(log_output) and len(log) < max_count:
                log.append(
                    f"Commit: {log_output[i]}\n"
                    f"Author: {log_output[i+1]}\n"
                    f"Date: {log_output[i+2]}\n"
                    f"Message: {log_output[i+3]}\n"
                )
        return log
    else:
        commits = list(repo.iter_commits(max_count=max_count))
        log = []
        for commit in commits:
            log.append(
                f"Commit: {commit.hexsha!r}\n"
                f"Author: {commit.author!r}\n"
                f"Date: {commit.authored_datetime}\n"
                f"Message: {commit.message!r}\n"
            )
        return log
```

**Pattern:** Dual implementation paths - one for simple logs, one for date-filtered logs

#### `git_show`

- **Purpose:** Show commit details with diff
- **Input:** `repo_path`, `revision`
- **Output:** Full commit information with patch
- **Implementation:**

```python
def git_show(repo: git.Repo, revision: str) -> str:
    commit = repo.commit(revision)
    output = [
        f"Commit: {commit.hexsha!r}\n"
        f"Author: {commit.author!r}\n"
        f"Date: {commit.authored_datetime!r}\n"
        f"Message: {commit.message!r}\n"
    ]
    if commit.parents:
        parent = commit.parents[0]
        diff = parent.diff(commit, create_patch=True)
    else:
        diff = commit.diff(git.NULL_TREE, create_patch=True)
    for d in diff:
        output.append(f"\n--- {d.a_path}\n+++ {d.b_path}\n")
        if d.diff:
            output.append(d.diff.decode('utf-8') if isinstance(d.diff, bytes) else d.diff)
    return "".join(output)
```

---

### 2.4 Branch Management Tools

#### `git_create_branch`

- **Purpose:** Create new branch
- **Input:** `repo_path`, `branch_name`, `base_branch` (optional)
- **Implementation:**

```python
def git_create_branch(repo: git.Repo, branch_name: str, base_branch: str | None = None) -> str:
    if base_branch:
        base = repo.references[base_branch]
    else:
        base = repo.active_branch
    repo.create_head(branch_name, base)
    return f"Created branch '{branch_name}' from '{base.name}'"
```

#### `git_checkout`

- **Purpose:** Switch branches
- **Input:** `repo_path`, `branch_name`
- **Security:** Validates branch name doesn't start with `-`
- **Implementation:**

```python
def git_checkout(repo: git.Repo, branch_name: str) -> str:
    if branch_name.startswith("-"):
        raise BadName(f"Invalid branch name: '{branch_name}' - cannot start with '-'")
    repo.rev_parse(branch_name)  # Validates branch_name is a real git ref
    repo.git.checkout(branch_name)
    return f"Switched to branch '{branch_name}'"
```

#### `git_branch`

- **Purpose:** List branches with filtering
- **Input:** `repo_path`, `branch_type` ('local', 'remote', 'all'), `contains` (optional), `not_contains` (optional)
- **Implementation:**

```python
def git_branch(repo: git.Repo, branch_type: str,
               contains: str | None = None,
               not_contains: str | None = None) -> str:
    match branch_type:
        case 'local':
            b_type = None
        case 'remote':
            b_type = "-r"
        case 'all':
            b_type = "-a"
        case _:
            return f"Invalid branch type: {branch_type}"

    branch_info = repo.git.branch(b_type,
                                  *(["--contains", contains] if contains else []),
                                  *(["--no-contains", not_contains] if not_contains else []))
    return branch_info
```

---

## 3. Security Patterns

### 3.1 Repository Path Validation

**Critical Security Pattern** - Prevents path traversal attacks:

```python
def validate_repo_path(repo_path: Path, allowed_repository: Path | None) -> None:
    """Validate that repo_path is within the allowed repository path."""
    if allowed_repository is None:
        return  # No restriction configured

    # Resolve both paths to handle symlinks and relative paths
    try:
        resolved_repo = repo_path.resolve()
        resolved_allowed = allowed_repository.resolve()
    except (OSError, RuntimeError):
        raise ValueError(f"Invalid path: {repo_path}")

    # Check if repo_path is the same as or a subdirectory of allowed_repository
    try:
        resolved_repo.relative_to(resolved_allowed)
    except ValueError:
        raise ValueError(
            f"Repository path '{repo_path}' is outside the allowed repository '{allowed_repository}'"
        )
```

**TypeScript Implementation:**

```typescript
import { resolve, relative } from 'node:path';

function validateRepoPath(repoPath: string, allowedRepository?: string): void {
  if (!allowedRepository) return; // No restriction

  const resolvedRepo = resolve(repoPath);
  const resolvedAllowed = resolve(allowedRepository);

  const relativePath = relative(resolvedAllowed, resolvedRepo);

  // Check if relative path starts with '..' (outside allowed directory)
  if (relativePath.startsWith('..')) {
    throw new Error(
      `Repository path '${repoPath}' is outside the allowed repository '${allowedRepository}'`
    );
  }
}
```

### 3.2 Argument Injection Prevention

**Pattern 1: Flag Injection Prevention**

```python
# Reject refs/branches starting with '-'
if target.startswith("-"):
    raise BadName(f"Invalid target: '{target}' - cannot start with '-'")
```

**Pattern 2: Separator Usage**

```python
# Use '--' to separate options from file arguments
repo.git.add("--", *files)
```

**TypeScript Implementation:**

```typescript
// Flag injection prevention
function validateGitRef(ref: string): void {
  if (ref.startsWith('-')) {
    throw new Error(`Invalid git ref: '${ref}' - cannot start with '-'`);
  }
}

// Separator usage
await git.add(['--', ...files]);
```

---

## 4. MCP Server Structure Patterns

### 4.1 Server Initialization Pattern

```python
async def serve(repository: Path | None) -> None:
    server = Server("mcp-git")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name=GitTools.STATUS,
                description="Shows the working tree status",
                inputSchema=GitStatus.model_json_schema(),
            ),
            # ... more tools
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        repo_path = Path(arguments["repo_path"])
        validate_repo_path(repo_path, repository)
        repo = git.Repo(repo_path)

        match name:
            case GitTools.STATUS:
                status = git_status(repo)
                return [TextContent(type="text", text=f"Repository status:\n{status}")]
            # ... more cases

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, options, raise_exceptions=True)
```

### 4.2 TypeScript Groundswell Adaptation

Based on existing tools in the codebase (`bash-mcp.ts`, `filesystem-mcp.ts`):

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// Input schema interfaces
interface GitStatusInput {
  repo_path: string;
}

// Result interfaces
interface GitStatusResult {
  success: boolean;
  status?: string;
  error?: string;
}

// Tool schema definition
const gitStatusTool: Tool = {
  name: 'git_status',
  description: 'Shows the working tree status',
  input_schema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Path to Git repository',
      },
    },
    required: ['repo_path'],
  },
};

// Tool executor
async function gitStatus(input: GitStatusInput): Promise<GitStatusResult> {
  try {
    const status = await git.cwd(input.repo_path).status();
    return { success: true, status: JSON.stringify(status) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// MCP Server class
export class GitMCP extends MCPHandler {
  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: 'git',
      transport: 'inprocess',
      tools: [gitStatusTool /* ... more tools */],
    });

    // PATTERN: Register tool executors
    this.registerToolExecutor('git', 'git_status', gitStatus as ToolExecutor);
  }
}
```

---

## 5. Testing Patterns

### 5.1 Test Fixture Pattern

```python
@pytest.fixture
def test_repository(tmp_path: Path):
    repo_path = tmp_path / "temp_test_repo"
    test_repo = git.Repo.init(repo_path)

    Path(repo_path / "test.txt").write_text("test")
    test_repo.index.add(["test.txt"])
    test_repo.index.commit("initial commit")

    yield test_repo

    shutil.rmtree(repo_path)
```

**Vitest Adaptation:**

```typescript
import { afterAll, beforeAll } from 'vitest';
import { simpleGit } from 'simple-git';
import { mkdtemp, rmdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Git MCP Tools', () => {
  let repoPath: string;
  let git: SimpleGit;

  beforeAll(async () => {
    repoPath = join(tmpdir(), `git-test-${Date.now()}`);
    await mkdir(repoPath, { recursive: true });
    git = simpleGit(repoPath);
    await git.init();
    await writeFile(join(repoPath, 'test.txt'), 'test');
    await git.add('test.txt');
    await git.commit('initial commit');
  });

  afterAll(async () => {
    await rmdir(repoPath, { recursive: true });
  });

  // ... tests
});
```

### 5.2 Security Test Patterns

**Test 1: Flag Injection Prevention**

```python
def test_git_diff_rejects_flag_injection(test_repository):
    with pytest.raises(BadName):
        git_diff(test_repository, "--output=/tmp/evil")

def test_git_diff_rejects_malicious_refs(test_repository):
    # Manually create a malicious ref
    sha = test_repository.head.commit.hexsha
    refs_dir = Path(test_repository.git_dir) / "refs" / "heads"
    malicious_ref_path = refs_dir / "--output=evil.txt"
    malicious_ref_path.write_text(sha)

    # Even though the ref exists, it should be rejected
    with pytest.raises(BadName):
        git_diff(test_repository, "--output=evil.txt")
```

**Test 2: Path Traversal Prevention**

```python
def test_validate_repo_path_traversal_attempt(tmp_path: Path):
    allowed = tmp_path / "allowed_repo"
    allowed.mkdir()
    traversal_path = allowed / ".." / "other_repo"

    with pytest.raises(ValueError) as exc_info:
        validate_repo_path(traversal_path, allowed)
    assert "outside the allowed repository" in str(exc_info.value)
```

---

## 6. Patterns to Follow

### 6.1 API Design Patterns

1. **Consistent Input Schema**
   - Always include `repo_path` as required parameter
   - Use descriptive parameter names
   - Provide sensible defaults for optional parameters

2. **Result Format**
   - Return structured objects with `success` boolean
   - Include meaningful error messages
   - Provide full output (not truncated)

3. **Tool Organization**
   - Group related tools (status, diff, log, branch)
   - Use consistent naming convention: `git_<action>`
   - Provide clear descriptions for AI understanding

### 6.2 Error Handling Patterns

```typescript
async function executeGitOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    // Handle specific git errors
    if (errno === 'ENOTFOUND') {
      return { success: false, error: `Git repository not found: ${context}` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 6.3 Documentation Patterns

````typescript
/**
 * Git Status Tool
 *
 * @remarks
 * Shows the working tree status including staged, unstaged,
 * and untracked files. Provides branch information and ahead/behind status.
 *
 * @example
 * ```ts
 * const result = await gitStatus({ repo_path: './my-project' });
 * // { success: true, status: 'On branch main...' }
 * ```
 */
````

---

## 7. Patterns to Avoid

### 7.1 Security Anti-Patterns

1. **Direct Command Concatenation**

   ```typescript
   // AVOID: Command injection vulnerability
   const command = `git -C ${repoPath} status`;
   exec(command);

   // CORRECT: Use argument arrays
   const result = await git.cwd(repoPath).status();
   ```

2. **Unvalidated User Input**

   ```typescript
   // AVOID: No validation
   async function checkoutBranch(repoPath: string, branchName: string) {
     await git.checkout(branchName);
   }

   // CORRECT: Validate branch name
   async function checkoutBranch(repoPath: string, branchName: string) {
     if (branchName.startsWith('-')) {
       throw new Error('Invalid branch name');
     }
     await git.checkout(branchName);
   }
   ```

3. **Missing Path Validation**

   ```typescript
   // AVOID: No path validation
   async function gitStatus(repoPath: string) {
     return await git.cwd(repoPath).status();
   }

   // CORRECT: Validate and constrain path
   async function gitStatus(repoPath: string, allowedBase?: string) {
     const resolvedPath = resolve(repoPath);
     if (allowedBase) {
       validateRepoPath(resolvedPath, allowedBase);
     }
     return await git.cwd(resolvedPath).status();
   }
   ```

### 7.2 API Design Anti-Patterns

1. **Overly Granular Tools**
   - Don't split `git_add` into multiple tools (one per file)
   - Keep tools at a natural operation level

2. **Missing Context**
   - Always return full output, not truncated
   - Include exit codes and error messages

3. **Inconsistent Naming**
   - Use `git_` prefix for all tools
   - Match git command terminology (commit, not createCommit)

---

## 8. Recommended TypeScript Implementation

### 8.1 Library Choice

**Recommended:** `simple-git`

- Pure TypeScript implementation
- Promise-based API
- Comprehensive git command coverage
- Active maintenance
- Good TypeScript types

**Alternative:** `isomorphic-git`

- Works in browser and Node.js
- More complex API
- Pure JavaScript implementation

**Installation:**

```bash
npm install simple-git
npm install --save-dev @types/simple-git  # Types are included, but for safety
```

### 8.2 Minimal Tool Set (MVP)

**Phase 1: Core Read Operations**

1. `git_status` - Repository status
2. `git_diff_unstaged` - Unstaged changes
3. `git_diff_staged` - Staged changes
4. `git_log` - Commit history

**Phase 2: Write Operations** 5. `git_add` - Stage files 6. `git_commit` - Create commits 7. `git_reset` - Unstage changes

**Phase 3: Branch Operations** 8. `git_create_branch` - Create branches 9. `git_checkout` - Switch branches 10. `git_branch` - List branches

### 8.3 Implementation Template

```typescript
// git-mcp.ts
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';
import { simpleGit, SimpleGit } from 'simple-git';
import { resolve, relative } from 'node:path';

// ===== INPUT INTERFACES =====
interface GitStatusInput {
  repo_path: string;
}

// ===== RESULT INTERFACES =====
interface GitStatusResult {
  success: boolean;
  status?: string;
  error?: string;
}

// ===== TOOL SCHEMAS =====
const gitStatusTool: Tool = {
  name: 'git_status',
  description:
    'Shows the working tree status including staged, unstaged, and untracked files',
  input_schema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Path to Git repository',
      },
    },
    required: ['repo_path'],
  },
};

// ===== SECURITY VALIDATION =====
function validateRepoPath(repoPath: string, allowedBase?: string): void {
  const resolved = resolve(repoPath);
  if (allowedBase) {
    const resolvedBase = resolve(allowedBase);
    const relPath = relative(resolvedBase, resolved);
    if (relPath.startsWith('..')) {
      throw new Error(
        `Path '${repoPath}' is outside allowed base '${allowedBase}'`
      );
    }
  }
}

function validateGitRef(ref: string): void {
  if (ref.startsWith('-')) {
    throw new Error(`Invalid git ref '${ref}': cannot start with '-'`);
  }
}

// ===== TOOL EXECUTORS =====
async function gitStatus(input: GitStatusInput): Promise<GitStatusResult> {
  try {
    validateRepoPath(input.repo_path);
    const git = simpleGit(input.repo_path);
    const status = await git.status();
    return {
      success: true,
      status: JSON.stringify(status, null, 2),
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
      tools: [gitStatusTool],
    });
    this.registerToolExecutor('git', 'git_status', gitStatus as ToolExecutor);
  }
}

// Export for testing
export { gitStatus, validateRepoPath, validateGitRef };
```

---

## 9. Integration with Existing Codebase

### 9.1 Consistency with Existing Tools

**Pattern from `bash-mcp.ts`:**

- Extends `MCPHandler` from Groundswell
- Uses TypeScript interfaces for input/output
- Registers server and executors in constructor
- Exports types and functions for testing

**Pattern from `filesystem-mcp.ts`:**

- Multiple tools in single server class
- Consistent result format with `success` boolean
- Comprehensive error handling with specific error codes
- Detailed JSDoc comments

### 9.2 File Structure

```
src/tools/
  ├── bash-mcp.ts          # Existing
  ├── filesystem-mcp.ts    # Existing
  └── git-mcp.ts           # New

tests/unit/tools/
  ├── bash-mcp.test.ts     # Existing
  ├── filesystem-mcp.test.ts  # Existing
  └── git-mcp.test.ts      # New
```

---

## 10. Testing Recommendations

### 10.1 Test Coverage Goals

- **Unit Tests:** 100% coverage for all Git operations
- **Integration Tests:** Real repository operations
- **Security Tests:** All validation functions
- **Error Handling:** All error code paths

### 10.2 Test Categories

1. **Happy Path Tests**
   - Normal operations succeed
   - Expected output format

2. **Security Tests**
   - Path traversal attempts
   - Flag injection attempts
   - Malicious refs

3. **Error Handling Tests**
   - Non-existent repositories
   - Invalid git refs
   - Permission errors

4. **Edge Cases**
   - Empty repositories
   - Large diffs
   - Special characters in filenames

---

## 11. Dependencies and Installation

### 11.1 Required Dependencies

```json
{
  "dependencies": {
    "simple-git": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0"
  }
}
```

### 11.2 Installation Commands

```bash
# Install simple-git
npm install simple-git

# Or use yarn
yarn add simple-git

# Or use pnpm
pnpm add simple-git
```

---

## 12. References and Resources

### 12.1 Official Documentation

- **MCP Specification:** https://modelcontextprotocol.io/
- **MCP Python SDK:** https://github.com/modelcontextprotocol/python-sdk
- **Groundswell Framework:** (Check project documentation)

### 12.2 Git Libraries

- **GitPython (Python):** https://gitpython.readthedocs.io/
- **simple-git (TypeScript):** https://github.com/steveukx/git-js
- **isomorphic-git (JS):** https://isomorphic-git.org/

### 12.3 Example Implementations

- **Official MCP Git Server:** https://github.com/modelcontextprotocol/servers/tree/main/src/git
- **Current Project Tools:** `/home/dustin/projects/hacky-hack/src/tools/`

---

## 13. Implementation Checklist

### Phase 1: Foundation

- [ ] Install `simple-git` dependency
- [ ] Create `git-mcp.ts` file structure
- [ ] Implement security validation functions
- [ ] Set up basic test fixtures

### Phase 2: Read Operations

- [ ] Implement `git_status` tool
- [ ] Implement `git_diff_unstaged` tool
- [ ] Implement `git_diff_staged` tool
- [ ] Implement `git_log` tool
- [ ] Add comprehensive tests

### Phase 3: Write Operations

- [ ] Implement `git_add` tool
- [ ] Implement `git_commit` tool
- [ ] Implement `git_reset` tool
- [ ] Add comprehensive tests

### Phase 4: Branch Operations

- [ ] Implement `git_create_branch` tool
- [ ] Implement `git_checkout` tool
- [ ] Implement `git_branch` tool
- [ ] Add comprehensive tests

### Phase 5: Documentation

- [ ] Add JSDoc comments
- [ ] Create usage examples
- [ ] Document security considerations
- [ ] Update project README

---

## 14. Security Considerations Summary

### Critical Security Points

1. **Path Validation**
   - Always validate repository paths
   - Prevent directory traversal attacks
   - Resolve symlinks before validation

2. **Argument Injection**
   - Validate all git refs (branch names, commits)
   - Reject refs starting with `-`
   - Use `--` separators for file arguments

3. **Error Messages**
   - Don't leak sensitive system information
   - Provide helpful but safe error messages
   - Log detailed errors server-side only

4. **Resource Limits**
   - Consider timeout for long-running operations
   - Limit output size for large diffs/logs
   - Handle large repositories gracefully

---

## 15. Conclusion

This research provides a comprehensive foundation for implementing Git MCP tools in TypeScript. The official Python implementation serves as an excellent reference for:

- Tool selection and API design
- Security patterns and validation
- Testing strategies
- Documentation standards

Key recommendations:

1. Use `simple-git` for TypeScript implementation
2. Follow the security patterns rigorously
3. Implement all 12 tools from the official server
4. Maintain consistency with existing MCP tools in the project
5. Achieve 100% test coverage before considering complete

The patterns documented here can be directly adapted to TypeScript with the Groundswell framework, maintaining the same security-first approach and comprehensive functionality.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-12
**Next Review:** After implementation completion
