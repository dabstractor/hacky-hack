# PRP for P3.M4.T1.S3: Implement smart commit workflow

---

## Goal

**Feature Goal**: Create an automated Git commit utility that intelligently stages and commits changes after each subtask completion, while protecting pipeline state files (tasks.json, PRD.md, prd_snapshot.md) from being committed.

**Deliverable**:

- New utility module `src/utils/git-commit.ts` with `smartCommit()` function
- Integration of `smartCommit()` into `TaskOrchestrator.executeSubtask()` method
- Unit tests achieving 100% coverage of the new utility

**Success Definition**:

- After each subtask completion, changes are automatically committed
- Pipeline state files (tasks.json, PRD.md, prd_snapshot.md) are never committed
- Commit messages follow format: `[PRP Auto] {message}` with Co-Authored-By: Claude trailer
- Commit hash is logged for observability
- If no files are staged (excluding protected files), commit is skipped
- All tests pass with 100% coverage
- No regression in existing functionality

## User Persona (if applicable)

**Target User**: Developer running the PRP Pipeline for automated software development

**Use Case**: Developer executes a PRD that may contain dozens or hundreds of subtasks. Each subtask completion should create a Git commit checkpoint without manual intervention, enabling easy rollback to any previous state while preserving pipeline state files for resumption.

**User Journey**:

1. User starts pipeline: `npm run pipeline -- ./PRD.md`
2. Pipeline executes subtasks sequentially
3. After each subtask completes, `smartCommit()` is called automatically
4. Git status is checked for changed files
5. Changed files (excluding protected state files) are staged
6. Commit is created with `[PRP Auto] {subtask_id}: {subtask_title}` message
7. Commit hash is logged: `[TaskOrchestrator] Commit created: abc123...`
8. Pipeline continues to next subtask
9. If user needs to rollback, they can `git revert` or `git reset` to any commit
10. If pipeline is interrupted, it can resume using the protected state files

**Pain Points Addressed**:

- No manual commit management needed during long-running pipelines
- Automatic checkpoint creation for every subtask
- Easy rollback to any previous subtask state
- State files remain outside of version control for clean resumption
- Full audit trail of what was implemented and when

## Why

- **PRD Requirement**: Section 5.1 explicitly requires Smart Commit functionality
- **Workflow Automation**: Manual commits during automated development are disruptive and error-prone
- **Checkpoint Strategy**: Each subtask completion is a natural checkpoint for version control
- **Rollback Capability**: Developers need ability to revert any subtask's changes
- **State Protection**: Pipeline state files must remain uncommitted to enable clean resumption
- **Observability**: Commit hashes provide traceability and audit trail
- **Best Practice**: Atomic commits per feature/subtask is Git best practice

## What

### System Behavior

The smart commit workflow will:

1. **Create Utility Module** (`src/utils/git-commit.ts`):
   - Export `smartCommit(sessionPath: string, message: string): Promise<string | null>`
   - Use GitMCP tool (direct function imports, not MCP protocol)
   - Filter out protected files: `tasks.json`, `PRD.md`, `prd_snapshot.md`
   - Stage remaining changed files
   - Create commit with `[PRP Auto]` prefix
   - Add Co-Authored-By: Claude trailer
   - Return commit hash or null if skipped

2. **Integration Point** (`src/core/task-orchestrator.ts`):
   - Modify `executeSubtask()` method
   - After subtask is marked 'Complete' (line ~578-582)
   - Call `smartCommit()` with session path and subtask info
   - Log commit hash if successful

3. **Protected Files Pattern**:
   - Hardcoded exclusion list: `['tasks.json', 'PRD.md', 'prd_snapshot.md']`
   - Filter these files from staged files before committing
   - Files may be in project root or session directory

4. **Skip Commit Logic**:
   - Check if any files remain after filtering
   - If no files to stage, return null (no commit)
   - Log skip message for observability

### Success Criteria

- [ ] `src/utils/git-commit.ts` created with `smartCommit()` function
- [ ] `smartCommit()` uses GitMCP functions (direct imports)
- [ ] Protected files are filtered from commits
- [ ] Commit message format: `[PRP Auto] {message}`
- [ ] Co-Authored-By: Claude <noreply@anthropic.com> trailer added
- [ ] Commit hash returned and logged
- [ ] Returns null if no files to commit
- [ ] Integrated into `TaskOrchestrator.executeSubtask()`
- [ ] Called after subtask marked 'Complete'
- [ ] Unit tests for all code paths
- [ ] 100% code coverage achieved
- [ ] All existing tests pass

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact GitMCP function signatures from `src/tools/git-mcp.ts`
- Integration point in `TaskOrchestrator` with line numbers
- Complete utility patterns from existing `src/utils/task-utils.ts`
- Test patterns from existing test files
- File exclusion logic with specific protected file names
- Commit message format with Co-Authored-By trailer
- Direct function import pattern (not MCP protocol)
- Validation commands specific to this project

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: src/tools/git-mcp.ts
  why: GitMCP tool implementation - direct function imports for git operations
  critical: Lines 420-467 show gitCommit() function signature and usage
  critical: Lines 385-407 show gitAdd() function for staging files
  critical: Lines 289-339 show gitStatus() function for checking changes
  pattern: |
    import { gitStatus, gitAdd, gitCommit } from '../tools/git-mcp.js';
    const statusResult = await gitStatus({ path: sessionPath });
  gotcha: Use direct function imports, not MCP protocol (no executeTool needed)

- file: src/core/task-orchestrator.ts
  why: Integration point for smartCommit() - where to call it after subtask completion
  critical: Lines 530-605 show executeSubtask() method
  critical: Lines 578-582 show where subtask is marked 'Complete' - insert smartCommit after this
  critical: Lines 191-195 show sessionPath access via sessionManager
  pattern: |
    const sessionPath = this.sessionManager.currentSession?.metadata.path ?? '';
    await this.setStatus(subtask.id, 'Complete', 'Implementation completed successfully');
    // INSERT smartCommit() HERE
  gotcha: Get sessionPath before calling smartCommit, it may be null

- file: src/utils/task-utils.ts
  why: Pattern reference for utility file structure, JSDoc, exports
  critical: Lines 1-30 show comprehensive JSDoc header pattern
  critical: Lines 47-65 show type definitions and type guards
  critical: Lines 125-147 show named export pattern for functions
  pattern: |
    /**
     * Function description
     * @remarks
     * Detailed explanation
     * @example
     * Code example
     */
    export function functionName(params): ReturnType {
      // Implementation
    }
  gotcha: All functions use named exports, no default exports

- file: tests/unit/tools/git-mcp.test.ts
  why: Test patterns for Git operations - how to mock gitStatus, gitAdd, gitCommit
  critical: Lines 35-75 show mock setup for simple-git
  critical: Lines 150-200 show test patterns for git operations
  pattern: |
    const mockGitInstance = {
      status: vi.fn(),
      add: vi.fn(),
      commit: vi.fn(),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGitInstance);
  gotcha: Mock simple-git, not the GitMCP wrapper functions

- file: tests/unit/core/session-utils.test.ts
  why: Test patterns for async utility functions
  critical: Lines 80-120 show async test patterns with mocks
  critical: Lines 200-250 show error handling tests
  pattern: |
    describe('functionName', () => {
      it('should do something correctly', async () => {
        // SETUP - Configure mocks
        mockFunction.mockResolvedValue(testData);
        // EXECUTE - Call function
        const result = await functionName(testInput);
        // VERIFY - Check results
        expect(result).toBe(expected);
      });
    });
  gotcha: Use vi.mocked() for typed mocks

- file: plan/001_14b9dc2a33c7/P3M4T1S3/research/git-commit-best-practices.md
  why: Git commit best practices, Co-Authored-By format, automation patterns
  critical: Lines 150-250 show Co-Authored-By trailer format
  critical: Lines 500-650 show automated commit patterns for CI/CD
  section: "Co-Authored-By Trailer Format"
  pattern: |
    Co-Authored-By: Claude <noreply@anthropic.com>
  gotcha: Trailer goes at end of commit message, after blank line

- url: https://www.conventionalcommits.org/
  why: Commit message formatting standard
  critical: Lines 1-50 show commit message structure
  pattern: |
    feat: description
  note: Use `[PRP Auto]` prefix instead of conventional commits for this feature

- url: https://git-scm.com/docs/git-status
  why: Understanding git status output format
  critical: Shows how to parse staged/modified/untracked files
  pattern: git status returns files in different states

- url: https://www.npmjs.com/package/simple-git
  why: simple-git library documentation (used by GitMCP)
  critical: API reference for status(), add(), commit() methods
  note: GitMCP wraps simple-git, we use GitMCP functions directly
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts       # Agent creation utilities
│   ├── prompts.ts             # System prompt imports
│   ├── prp-generator.ts       # PRPGenerator (from P3.M3.T1.S1)
│   ├── prp-executor.ts        # PRPExecutor (from P3.M3.T1.S2)
│   └── prp-runtime.ts         # PRPRuntime (from P3.M3.T1.S3)
├── config/
│   ├── constants.ts           # Project constants
│   ├── environment.ts         # Environment configuration
│   └── types.ts               # Type definitions
├── core/
│   ├── index.ts               # Core exports
│   ├── models.ts              # Backlog, Phase, Status, Scope types
│   ├── prd-differ.ts          # PRD diffing utilities
│   ├── scope-resolver.ts      # Scope type and utilities
│   ├── session-manager.ts     # SessionManager class
│   ├── session-utils.ts       # File system utilities
│   └── task-orchestrator.ts   # TaskOrchestrator - MODIFY THIS
├── scripts/
│   └── validate-api.ts        # API validation script
├── tools/
│   ├── bash-mcp.ts            # Bash MCP tool
│   ├── filesystem-mcp.ts      # Filesystem MCP tool
│   └── git-mcp.ts             # Git MCP tool - USE THIS
├── utils/
│   └── task-utils.ts          # Task hierarchy utilities
└── workflows/
    ├── hello-world.ts         # Simple workflow example
    └── prp-pipeline.ts        # Main PRP Pipeline workflow

tests/
├── unit/
│   ├── agents/
│   │   └── agent-factory.test.ts
│   ├── core/
│   │   ├── session-manager.test.ts
│   │   ├── session-utils.test.ts
│   │   └── task-orchestrator.test.ts
│   ├── tools/
│   │   ├── bash-mcp.test.ts
│   │   ├── filesystem-mcp.test.ts
│   │   └── git-mcp.test.ts    # Git test patterns
│   └── utils/
│       └── task-utils.test.ts
└── integration/
    └── (integration tests)
```

### Desired Codebase Tree with Files to be Added

```bash
src/
├── utils/
│   ├── task-utils.ts          # EXISTING
│   └── git-commit.ts          # NEW - Smart commit utility

tests/
├── unit/
│   ├── core/
│   │   └── task-orchestrator.test.ts  # MODIFY - Add smartCommit tests
│   └── utils/
│       ├── task-utils.test.ts          # EXISTING
│       └── git-commit.test.ts          # NEW - Smart commit tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use direct function imports from GitMCP, NOT MCP protocol
// Do NOT use executeTool() - use the exported functions directly
import { gitStatus, gitAdd, gitCommit } from '../tools/git-mcp.js';
// NOT: const gitMCP = new GitMCP(); await gitMCP.executeTool(...)

// CRITICAL: sessionPath may be null or undefined
// Always check existence before passing to smartCommit
const sessionPath = this.sessionManager.currentSession?.metadata.path;
if (!sessionPath) {
  throw new Error('Session path not available');
}
await smartCommit(sessionPath, message);

// CRITICAL: Protected files may be in project root OR session directory
// Filter by basename, not full path
const PROTECTED_FILES = ['tasks.json', 'PRD.md', 'prd_snapshot.md'];
const isProtected = (file: string) =>
  PROTECTED_FILES.includes(basename(file));

// CRITICAL: GitMCP functions return result objects, not direct values
// Always check .success field
const statusResult = await gitStatus({ path: sessionPath });
if (!statusResult.success) {
  throw new Error(`Git status failed: ${statusResult.error}`);
}
const filesToStage = statusResult.modified?.filter(f => !isProtected(f)) ?? [];

// CRITICAL: Commit message format is specific
// Use [PRP Auto] prefix, not conventional commits
const fullMessage = `[PRP Auto] ${message}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;

// CRITICAL: Co-Authored-By trailer must be at end, after blank line
// Format: "Co-Authored-By: Name <email>"
const trailer = '\n\nCo-Authored-By: Claude <noreply@anthropic.com>';

// CRITICAL: Skip commit if no files to stage
// Don't create empty commits
if (filesToStage.length === 0) {
  return null; // No commit made
}

// CRITICAL: Log commit hash for observability
// Return commit hash from gitCommit result
const commitResult = await gitCommit({ path: sessionPath, message: fullMessage });
if (commitResult.success && commitResult.commitHash) {
  return commitResult.commitHash;
}

// GOTCHA: GitMCP uses simple-git under the hood
// StatusResult structure: { files: [{ path, index, working_dir }], current }
// Need to parse files from statusResult to get individual file paths

// GOTCHA: Files can be in multiple states
// A file can be both staged and modified
// Use modified array for staging, then check if anything was actually staged

// GOTCHA: TypeScript requires .js extension for ES module imports
// import { x } from './module.js'; // Note .js extension

// PATTERN: Use basename for file comparison
// Paths may be relative or absolute
import { basename } from 'node:path';

// PATTERN: Log with context in TaskOrchestrator
// Use this.logger.info() with clear prefixes
this.logger.info(`[TaskOrchestrator] Commit created: ${commitHash}`);

// PATTERN: Handle all error cases
// Git operations can fail for many reasons
try {
  // Git operations
} catch (error) {
  this.logger.error(`[TaskOrchestrator] Smart commit failed: ${error}`);
  // Don't fail the subtask if commit fails
}

// GOTCHA: TaskOrchestrator has access to sessionManager
// Session path is at: this.sessionManager.currentSession?.metadata.path
// This is set during initialization, available throughout execution

// GOTCHA: Subtask completion happens at specific location
// In executeSubtask(), after line 582 where status is set to 'Complete'
// This is the integration point for smartCommit()

// GOTCHA: Don't commit if subtask failed
// Only commit on 'Complete' status, not 'Failed'
if (newStatus === 'Complete') {
  await smartCommit(...);
}

// GOTCHA: Testing requires mocking simple-git, not GitMCP
// GitMCP exports functions that use simple-git internally
// Mock simpleGit constructor to return mock instance
```

## Implementation Blueprint

### Data Models and Structure

No new data models required. The utility uses:

1. **Input Parameters**:
   - `sessionPath: string` - Path to git repository (usually project root)
   - `message: string` - Commit message describing what was done

2. **Return Type**:
   - `Promise<string | null>` - Commit hash if commit created, null if skipped

3. **Protected Files**:

   ```typescript
   const PROTECTED_FILES = [
     'tasks.json', // Pipeline state
     'PRD.md', // Original PRD
     'prd_snapshot.md', // PRD snapshot
   ] as const;
   ```

4. **Error Handling**:
   - Git operation failures are logged but don't throw
   - Returns null on failure to allow pipeline to continue
   - Errors are logged via console.error (utility layer has no logger)

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/git-commit.ts - Utility module with smartCommit()
  - IMPLEMENT: smartCommit(sessionPath: string, message: string): Promise<string | null>
  - IMPLEMENT: filterProtectedFiles(files: string[]): string[] helper
  - IMPLEMENT: formatCommitMessage(message: string): string helper
  - IMPORT: gitStatus, gitAdd, gitCommit from ../tools/git-mcp.js
  - IMPORT: basename from node:path
  - NAMING: smartCommit (not createCommit - distinct from GitMCP's gitCommit)
  - PLACEMENT: src/utils/ directory
  - PATTERN: Follow task-utils.ts structure (JSDoc, named exports)
  - ERROR HANDLING: Catch errors, log to console.error, return null

Task 2: IMPLEMENT smartCommit() function logic
  - VALIDATE: sessionPath is non-empty string
  - CALL: await gitStatus({ path: sessionPath })
  - CHECK: statusResult.success, return null if failed
  - EXTRACT: modified and untracked files from status result
  - FILTER: Remove protected files using basename comparison
  - CHECK: If no files remain after filtering, return null
  - CALL: await gitAdd({ path: sessionPath, files: filteredFiles })
  - CHECK: addResult.success, log error if failed
  - FORMAT: Commit message with [PRP Auto] prefix and Co-Authored-By trailer
  - CALL: await gitCommit({ path: sessionPath, message: formattedMessage })
  - CHECK: commitResult.success, return null if failed
  - RETURN: commitHash from result or null

Task 3: IMPLEMENT helper functions
  - CREATE: filterProtectedFiles(files: string[]): string[]
    * Uses basename from node:path
    * Compares against PROTECTED_FILES constant
    * Returns filtered array
  - CREATE: formatCommitMessage(message: string): string
    * Adds [PRP Auto] prefix
    * Appends blank line and Co-Authored-By trailer
    * Returns formatted message

Task 4: MODIFY src/core/task-orchestrator.ts - Integrate smartCommit()
  - IMPORT: smartCommit from ../utils/git-commit.js
  - FIND: executeSubtask() method (lines 530-605)
  - LOCATE: Line ~582 where subtask status is set to 'Complete'
  - INSERT: After status update, call smartCommit()
  - GET: sessionPath from this.sessionManager.currentSession?.metadata.path
  - VALIDATE: sessionPath exists, throw if not
  - CALL: await smartCommit(sessionPath, `${subtask.id}: ${subtask.title}`)
  - LOG: If commit hash returned, log: "[TaskOrchestrator] Commit created: {hash}"
  - LOG: If null returned, log: "[TaskOrchestrator] No files to commit"
  - ERROR HANDLING: Wrap in try/catch, log error but don't fail subtask
  - PRESERVE: All existing executeSubtask() logic

Task 5: CREATE tests/unit/utils/git-commit.test.ts
  - IMPORT: smartCommit, filterProtectedFiles, formatCommitMessage
  - MOCK: simple-git library (not GitMCP functions)
  - SETUP: Mock git instance with status, add, commit methods
  - TEST: filterProtectedFiles() removes protected files
  - TEST: filterProtectedFiles() keeps non-protected files
  - TEST: formatCommitMessage() adds [PRP Auto] prefix
  - TEST: formatCommitMessage() adds Co-Authored-By trailer
  - TEST: smartCommit() returns commit hash on success
  - TEST: smartCommit() returns null when no files to commit
  - TEST: smartCommit() filters out protected files
  - TEST: smartCommit() handles git status failure
  - TEST: smartCommit() handles git add failure
  - TEST: smartCommit() handles git commit failure
  - TEST: smartCommit() logs errors to console.error
  - COVERAGE: Achieve 100% code coverage

Task 6: MODIFY tests/unit/core/task-orchestrator.test.ts
  - ADD: Mock for smartCommit function
  - ADD: Test that smartCommit is called after subtask completion
  - ADD: Test that commit hash is logged when commit succeeds
  - ADD: Test that null result is logged when no files to commit
  - ADD: Test that smartCommit failure doesn't fail subtask
  - PRESERVE: All existing tests
  - COVERAGE: Maintain 100% coverage

Task 7: VERIFY integration testing
  - RUN: Full test suite to ensure no regressions
  - CHECK: All existing tests pass
  - CHECK: New tests pass with 100% coverage
  - MANUAL: Run pipeline on test PRD to verify commits are created
  - VERIFY: Commits have [PRP Auto] prefix
  - VERIFY: Commits have Co-Authored-By trailer
  - VERIFY: Protected files are not committed
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// File: src/utils/git-commit.ts
// =============================================================================

/**
 * Git commit utilities for PRP Pipeline
 *
 * @module utils/git-commit
 *
 * @remarks
 * Provides automated Git commit functionality with smart file filtering.
 * Protects pipeline state files from being committed while automatically
 * creating checkpoints after each subtask completion.
 *
 * @example
 * ```typescript
 * import { smartCommit } from './utils/git-commit.js';
 *
 * const commitHash = await smartCommit(
 *   '/project/session/path',
 *   'P3.M4.T1.S3: Implement smart commit workflow'
 * );
 * // Returns: 'abc123def456...' or null if no files to commit
 * ```
 */

import { gitStatus, gitAdd, gitCommit } from '../tools/git-mcp.js';
import { basename } from 'node:path';

// ===== CONSTANTS =====

/**
 * Files that must never be committed by smart commit
 *
 * @remarks
 * These files contain pipeline state and must remain uncommitted
 * to enable clean pipeline resumption and state management.
 */
const PROTECTED_FILES = [
  'tasks.json', // Pipeline task registry
  'PRD.md', // Original PRD document
  'prd_snapshot.md', // PRD snapshot for delta detection
] as const;

// ===== HELPER FUNCTIONS =====

/**
 * Filters out protected files from a list of files
 *
 * @param files - Array of file paths to filter
 * @returns Array of file paths excluding protected files
 *
 * @remarks
 * Uses basename comparison to handle both relative and absolute paths.
 * Protected files are defined in PROTECTED_FILES constant.
 *
 * @example
 * ```typescript
 * filterProtectedFiles(['src/index.ts', 'tasks.json', 'README.md']);
 * // Returns: ['src/index.ts', 'README.md']
 * ```
 */
export function filterProtectedFiles(files: string[]): string[] {
  return files.filter(file => !PROTECTED_FILES.includes(basename(file)));
}

/**
 * Formats a commit message with PRP prefix and co-author trailer
 *
 * @param message - Base commit message
 * @returns Formatted commit message with prefix and trailer
 *
 * @remarks
 * Adds [PRP Auto] prefix to distinguish automated commits.
 * Appends Co-Authored-By: Claude trailer per AI contribution standards.
 *
 * @example
 * ```typescript
 * formatCommitMessage('P3.M4.T1.S3: Implement smart commit');
 * // Returns: '[PRP Auto] P3.M4.T1.S3: Implement smart commit\n\nCo-Authored-By: Claude <noreply@anthropic.com>'
 * ```
 */
export function formatCommitMessage(message: string): string {
  return `${message}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
}

// ===== MAIN FUNCTION =====

/**
 * Creates a smart Git commit excluding protected pipeline state files
 *
 * @param sessionPath - Path to git repository (usually project root)
 * @param message - Commit message describing what was implemented
 * @returns Promise resolving to commit hash, or null if no commit was made
 *
 * @remarks
 * **Workflow**:
 * 1. Check git status for modified and untracked files
 * 2. Filter out protected files (tasks.json, PRD.md, prd_snapshot.md)
 * 3. If no files remain, return null (skip commit)
 * 4. Stage remaining files with git add
 * 5. Create commit with [PRP Auto] prefix and Co-Authored-By trailer
 * 6. Return commit hash for observability
 *
 * **Error Handling**:
 * - Git operation failures are logged but don't throw
 * - Returns null on any failure to allow pipeline to continue
 * - Errors are logged to console.error for debugging
 *
 * **Protected Files**:
 * - `tasks.json`: Pipeline task registry state
 * - `PRD.md`: Original PRD document
 * - `prd_snapshot.md`: PRD snapshot for delta detection
 *
 * @example
 * ```typescript
 * const hash = await smartCommit('/project', 'P3.M4.T1.S3: Implement smart commit');
 * if (hash) {
 *   console.log(`Commit created: ${hash}`);
 * } else {
 *   console.log('No files to commit');
 * }
 * ```
 */
export async function smartCommit(
  sessionPath: string,
  message: string
): Promise<string | null> {
  try {
    // Validate inputs
    if (!sessionPath || sessionPath.trim() === '') {
      console.error('[smartCommit] Invalid session path');
      return null;
    }

    if (!message || message.trim() === '') {
      console.error('[smartCommit] Invalid commit message');
      return null;
    }

    // Get repository status
    const statusResult = await gitStatus({ path: sessionPath });
    if (!statusResult.success) {
      console.error(`[smartCommit] Git status failed: ${statusResult.error}`);
      return null;
    }

    // Collect files to potentially stage
    const filesToStage: string[] = [];

    // Add modified files (excluding protected)
    if (statusResult.modified) {
      filesToStage.push(...statusResult.modified);
    }

    // Add untracked files (excluding protected)
    if (statusResult.untracked) {
      filesToStage.push(...statusResult.untracked);
    }

    // Filter out protected files
    const filteredFiles = filterProtectedFiles(filesToStage);

    // Skip commit if no files to stage
    if (filteredFiles.length === 0) {
      console.log(
        '[smartCommit] No files to commit after filtering protected files'
      );
      return null;
    }

    // Stage the files
    const addResult = await gitAdd({
      path: sessionPath,
      files: filteredFiles,
    });

    if (!addResult.success) {
      console.error(`[smartCommit] Git add failed: ${addResult.error}`);
      return null;
    }

    // Format commit message
    const formattedMessage = formatCommitMessage(message);

    // Create commit
    const commitResult = await gitCommit({
      path: sessionPath,
      message: formattedMessage,
    });

    if (!commitResult.success) {
      console.error(`[smartCommit] Git commit failed: ${commitResult.error}`);
      return null;
    }

    // Return commit hash
    const commitHash = commitResult.commitHash ?? null;
    console.log(`[smartCommit] Commit created: ${commitHash}`);
    return commitHash;
  } catch (error) {
    // Catch any unexpected errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[smartCommit] Unexpected error: ${errorMessage}`);
    return null;
  }
}

// =============================================================================
// File: src/core/task-orchestrator.ts (MODIFICATION)
// =============================================================================

// ADD import at top of file:
import { smartCommit } from '../utils/git-commit.js';

// IN executeSubtask() method, AFTER line 582 (where status is set to 'Complete'):

// ... existing code ...
await this.setStatus(
  subtask.id,
  'Complete',
  'Implementation completed successfully'
);

// NEW: Smart commit after successful subtask completion
try {
  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (!sessionPath) {
    this.logger.warn(
      '[TaskOrchestrator] Session path not available for smart commit'
    );
  } else {
    const commitMessage = `${subtask.id}: ${subtask.title}`;
    const commitHash = await smartCommit(sessionPath, commitMessage);

    if (commitHash) {
      this.logger.info(`[TaskOrchestrator] Commit created: ${commitHash}`);
    } else {
      this.logger.debug('[TaskOrchestrator] No files to commit');
    }
  }
} catch (error) {
  // Don't fail the subtask if commit fails
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.logger.error(`[TaskOrchestrator] Smart commit failed: ${errorMessage}`);
}

// ... rest of executeSubtask() method ...
````

### Integration Points

```yaml
GIT_MCP_FUNCTIONS:
  - import: "import { gitStatus, gitAdd, gitCommit } from '../tools/git-mcp.js'"
  - usage: Direct function calls, not MCP protocol
  - note: Functions return result objects with success field

TASK_ORCHESTRATOR:
  - method: executeSubtask() in src/core/task-orchestrator.ts
  - location: After line 582 (subtask status set to 'Complete')
  - access: this.sessionManager.currentSession?.metadata.path
  - pattern: Wrap in try/catch, log but don't fail subtask

PROTECTED_FILES:
  - list: ['tasks.json', 'PRD.md', 'prd_snapshot.md']
  - filtering: Use basename() for path comparison
  - reason: Pipeline state must remain uncommitted

COMMIT_MESSAGE:
  - prefix: '[PRP Auto]'
  - trailer: 'Co-Authored-By: Claude <noreply@anthropic.com>'
  - format: Prefix + message + blank line + trailer

LOGGING:
  - utility: console.error for errors (no logger in utils)
  - orchestrator: this.logger.info() for commit hash
  - observability: Log commit hash, skip reasons, failures
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- src/utils/git-commit.ts              # ESLint with auto-fix
npm run format -- src/utils/git-commit.ts            # Prettier formatting
npm run check -- src/utils/git-commit.ts             # TypeScript type checking

# After modifying task-orchestrator.ts
npm run lint -- src/core/task-orchestrator.ts
npm run format -- src/core/task-orchestrator.ts
npm run check -- src/core/task-orchestrator.ts

# Project-wide validation
npm run lint                                         # Check all files
npm run format                                       # Format all files
npm run check                                        # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test new git-commit utility
npm test -- tests/unit/utils/git-commit.test.ts -v

# Test with coverage
npm test -- tests/unit/utils/git-commit.test.ts --coverage

# Test modified task-orchestrator
npm test -- tests/unit/core/task-orchestrator.test.ts -v

# Full utils test suite
npm test -- tests/unit/utils/ -v

# Full core test suite
npm test -- tests/unit/core/ -v

# Check coverage for git-commit.ts
npm test -- --coverage src/utils/git-commit.ts

# Expected: All tests pass, 100% coverage for git-commit.ts
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# 1. Create a test PRD with multiple subtasks
cat > /tmp/test-smart-commit-prd.md << 'EOF'
# Test PRD for Smart Commit

## P1: Phase 1
### P1.M1: Milestone 1
#### P1.M1.T1: Task 1
##### P1.M1.T1.S1: Subtask 1
Create test file 1
##### P1.M1.T1.S2: Subtask 2
Create test file 2
##### P1.M1.T1.S3: Subtask 3
Create test file 3
EOF

# 2. Initialize git repo if not already initialized
cd /home/dustin/projects/hacky-hack
git init || echo "Already initialized"

# 3. Run pipeline
npm run pipeline -- /tmp/test-smart-commit-prd.md

# 4. Check that commits were created
git log --oneline | head -10

# Expected output:
# abc123 [PRP Auto] P1.M1.T1.S3: Subtask 3
# def456 [PRP Auto] P1.M1.T1.S2: Subtask 2
# ghi789 [PRP Auto] P1.M1.T1.S1: Subtask 1

# 5. Verify commit message format
git log -1 --pretty=fuller

# Expected: [PRP Auto] prefix and Co-Authored-By trailer

# 6. Verify protected files are NOT committed
git log --all --full-history -- tasks.json
git log --all --full-history -- PRD.md
git log --all --full-history -- prd_snapshot.md

# Expected: No commits found (or only initial commits if manually made)

# 7. Verify that actual changes ARE committed
git show --stat HEAD~2  # First subtask commit
git show --stat HEAD~1  # Second subtask commit
git show --stat HEAD    # Third subtask commit

# Expected: Shows modified/added files, excludes protected files

# 8. Test rollback scenario
git reset --hard HEAD~1  # Rollback one subtask
git status
# Verify files reverted but pipeline state intact

# 9. Resume pipeline - should continue from saved state
npm run pipeline -- /tmp/test-smart-commit-prd.md

# Expected: Pipeline detects completed subtasks, continues execution
```

### Level 4: Domain-Specific Validation

```bash
# Git Operations Validation
# Test commit with various file states

echo "test change" >> src/index.ts
echo "state change" >> plan/001_*/tasks.json
echo "new file" >> new-file.ts

# Run smart commit manually (create test script)
cat > /tmp/test-smart-commit.js << 'EOF'
import { smartCommit } from './src/utils/git-commit.js';

const hash = await smartCommit(
  process.cwd(),
  'Test: Manual smart commit validation'
);
console.log('Commit hash:', hash);
EOF

node /tmp/test-smart-commit.js

# Verify:
# 1. Commit was created
# 2. src/index.ts is committed
# 3. new-file.ts is committed
# 4. tasks.json is NOT committed
git diff HEAD -- plan/001_*/tasks.json
# Expected: Shows tasks.json still has changes (not committed)

# Edge Case Testing
# Test with no files to commit
git add -A
git commit -m "Clean slate"
node /tmp/test-smart-commit.js
# Expected: Returns null, logs "No files to commit"

# Test with only protected files changed
echo "change" >> plan/001_*/tasks.json
node /tmp/test-smart-commit.js
# Expected: Returns null, logs "No files to commit"

# Performance Testing
# Time commit operations
time node /tmp/test-smart-commit.js
# Expected: Completes in < 2 seconds for typical changes
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] 100% coverage for git-commit.ts: `npm test -- --coverage src/utils/git-commit.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] `src/utils/git-commit.ts` created with all functions
- [ ] `smartCommit()` function implemented with correct signature
- [ ] `filterProtectedFiles()` helper implemented
- [ ] `formatCommitMessage()` helper implemented
- [ ] Direct imports from GitMCP (not MCP protocol)
- [ ] Protected files filtered correctly
- [ ] Commit message has [PRP Auto] prefix
- [ ] Commit message has Co-Authored-By trailer
- [ ] Returns commit hash on success
- [ ] Returns null when no files to commit
- [ ] Returns null on git operation failure
- [ ] Integrated into TaskOrchestrator.executeSubtask()
- [ ] Called after subtask marked 'Complete'
- [ ] Commit hash logged via this.logger.info()
- [ ] Errors logged but don't fail subtask
- [ ] Unit tests for all functions
- [ ] Unit tests for all error paths
- [ ] Unit tests for protected file filtering
- [ ] Integration test shows commits created
- [ ] Integration test shows protected files excluded
- [ ] Manual test on real PRD succeeds

### Code Quality Validation

- [ ] Follows existing utility patterns (task-utils.ts structure)
- [ ] Comprehensive JSDoc with @remarks and @example
- [ ] Named exports only (no default exports)
- [ ] Uses .js extension for imports
- [ ] Proper error handling with try/catch
- [ ] Console logging for errors (utility layer)
- [ ] Integration uses this.logger (orchestrator layer)
- [ ] File placement matches desired codebase tree
- [ ] No duplication of existing code
- [ ] Type-safe throughout

### Documentation & Deployment

- [ ] Module-level JSDoc complete
- [ ] Function JSDoc with @remarks for all functions
- [ ] @example blocks showing usage
- [ ] Protected files documented in constant
- [ ] Error handling documented
- [ ] Integration point documented in comments
- [ ] Commit message format documented
- [ ] Co-Authored-By format documented

---

## Anti-Patterns to Avoid

- ❌ Don't use MCP protocol (executeTool) - use direct function imports
- ❌ Don't throw errors from smartCommit - return null and log
- ❌ Don't fail subtask if commit fails - catch and log error
- ❌ Don't create empty commits - check if files exist first
- ❌ Don't commit protected files - filter by basename
- ❌ Don't hardcode paths - use sessionPath parameter
- ❌ Don't use console.log for errors in utility - use console.error
- ❌ Don't forget Co-Authored-By trailer - required for AI contributions
- ❌ Don't skip logging commit hash - needed for observability
- ❌ Don't assume sessionPath exists - check for null/undefined
- ❌ Don't use relative paths for filtering - use basename()
- ❌ Don't mock GitMCP functions in tests - mock simple-git
- ❌ Don't test with real git operations - mock everything
- ❌ Don't skip coverage of error paths - test all failures
- ❌ Don't create default export - use named exports only
- ❌ Don't forget .js extension in imports - ES modules require it
- ❌ Don't commit before filtering - always filter first
- ❌ Don't add [PRP Auto] in filter/format function - add in smartCommit
- ❌ Don't call smartCommit on failed subtasks - only on 'Complete' status
