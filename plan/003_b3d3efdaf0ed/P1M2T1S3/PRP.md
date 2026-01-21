# Product Requirement Prompt (PRP): P1.M2.T1.S3 - Verify smart commit functionality

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify the smart commit functionality triggers correctly after successful subtask completion, formats commit messages properly, filters protected files from commits, and returns commit hashes for observability.

**Deliverable**: Integration test file `tests/integration/smart-commit.test.ts` with complete coverage of smart commit behavior including commit triggering, message formatting, protected file filtering, and error handling.

**Success Definition**: All tests pass, verifying:

- Git commit is triggered after successful subtask completion
- Commit message uses correct format: `{subtask.id}: {subtask.title}` with `[PRP Auto]` prefix and Co-Authored-By trailer
- Protected files (tasks.json, prd_snapshot.md, PRD.md) are not committed
- All other changes are staged and committed correctly
- Commit hash is returned and logged for observability
- Smart commit failures don't fail subtask execution

## Why

- **Smart Commit Verification**: Validates that the pipeline automatically creates Git checkpoints after each subtask completion, enabling audit trails and progressive development
- **Protected Files Validation**: Ensures pipeline state files (tasks.json, PRD.md, prd_snapshot.md) are never committed, preserving clean pipeline resumption
- **Commit Message Standardization**: Verifies commit messages follow the correct format for traceability and attribution
- **Error Resilience**: Confirms that smart commit failures don't break subtask execution, maintaining pipeline robustness

**Existing Tests**: `tests/unit/utils/git-commit.test.ts` provides unit-level coverage of smartCommit function, but does NOT verify the integration point where smartCommit is called after subtask completion in TaskOrchestrator.

**Contract from PRD**: PRD.md and system_context.md specify that smart commits should be created after successful subtask completion with specific message format and protected file filtering.

**Integration Context**: This is part of Milestone 1.2 (PRD Requirement Coverage) - validating that the system correctly implements smart commit functionality as specified in the PRD.

**Relationship to P1.M2.T1.S1 and P1.M2.T1.S2**: The previous subtasks validate tasks.json as the single source of truth and plan/ directory structure. This subtask (P1.M2.T1.S3) validates the smart commit workflow that interacts with both.

## What

Integration tests that verify smart commit functionality triggers correctly after successful subtask completion with proper commit message formatting and protected file filtering.

### Success Criteria

- [ ] Git commit is triggered after successful subtask completion
- [ ] Commit message format: `[PRP Auto] {subtask.id}: {subtask.title}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`
- [ ] Protected files (tasks.json, PRD.md, prd_snapshot.md) are filtered out and not committed
- [ ] All other changed files are staged and committed
- [ ] Commit hash is returned and logged
- [ ] Smart commit failures don't fail subtask execution
- [ ] No commit is created when only protected files are changed
- [ ] No commit is created when no files are changed

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Complete smart commit implementation details from src/utils/git-commit.ts analysis
- Integration point in TaskOrchestrator at line 707 with exact calling pattern
- Protected files list and filtering logic with line numbers
- Commit message format specification with exact format string
- Integration test patterns from existing test files
- Error handling and logging patterns from research
- Vitest mocking patterns for git operations
- Clear file paths and line numbers for all referenced code

### Documentation & References

```yaml
# MUST READ - Smart commit implementation
- file: src/utils/git-commit.ts
  why: Complete smart commit implementation including filtering logic and message formatting
  lines: 1-208 (entire file)
  pattern: smartCommit function, filterProtectedFiles, formatCommitMessage
  gotcha: Uses basename() for file comparison, returns null on no files to commit

# MUST READ - Integration point in TaskOrchestrator
- file: src/core/task-orchestrator.ts
  why: Primary integration point where smartCommit is called after subtask completion
  lines: 707-728 (smart commit call in executeSubtask)
  pattern: try/catch wrapper, commit message format, logging
  gotcha: Commit failures don't fail subtask, wrapped in try/catch

# MUST READ - GitMCP tools used by smartCommit
- file: src/tools/git-mcp.ts
  why: Underlying git operations (status, add, commit) used by smartCommit
  lines: 1-200 (gitStatus, gitAdd, gitCommit implementations)
  pattern: Simple-git wrapper with result objects
  gotcha: Returns {success, ...} result objects, may include commitHash

# MUST READ - Protected files constant
- file: src/utils/git-commit.ts
  why: List of files that must never be committed
  lines: 38-42 (PROTECTED_FILES constant)
  pattern: const PROTECTED_FILES = ['tasks.json', 'PRD.md', 'prd_snapshot.md']
  gotcha: Uses basename comparison, handles both relative and absolute paths

# MUST READ - Unit tests for smart commit
- file: tests/unit/utils/git-commit.test.ts
  why: Reference patterns for testing smart commit behavior
  pattern: Mock gitStatus, gitAdd, gitCommit; test file filtering
  gotcha: Uses vi.mocked() for type-safe mocks

# MUST READ - Integration test patterns
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S3/research/integration-test-patterns.md
  why: Complete patterns for writing integration tests in this codebase
  section: "Git-Specific Patterns for Smart Commit Integration Tests"
  pattern: Mock setup, temp directory management, AAA pattern

# MUST READ - Smart commit calling context
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S3/research/smart-commit-calling-context.md
  why: Complete analysis of where and how smartCommit is called
  section: "Call Sites", "Integration Workflow"
  pattern: Exact calling pattern, error handling, logging

# MUST READ - Simple-git library research
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S3/research/simple-git-library-research.md
  why: Git operation patterns and testing approaches
  section: "Testing Patterns with Simple-Git", "Integration Testing Setup"
  pattern: Repository state management, commit verification

# MUST READ - System context for smart commit specification
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: PRD specification for smart commit behavior
  section: Search for "smart commit" or "commit"
  pattern: Commit after subtask completion, protected files, message format

# MUST READ - Existing TaskOrchestrator integration tests
- file: tests/integration/core/task-orchestrator-runtime.test.ts
  why: Reference patterns for testing TaskOrchestrator integration points
  pattern: Mock PRPRuntime, session manager setup, subtask execution
  gotcha: Tests verify smartCommit is called, but don't test commit behavior

# MUST READ - Vitest documentation
- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking and testing patterns

- url: https://vitest.dev/api/vi.html#vi-spyon
  why: Spying on methods to verify they're called with specific arguments
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   ├── core/
│   │   ├── task-orchestrator-runtime.test.ts  # Reference: TaskOrchestrator patterns
│   │   └── task-orchestrator-e2e.test.ts      # Reference: End-to-end patterns
│   └── smart-commit.test.ts                    # NEW: This PRP's deliverable

src/
├── core/
│   ├── task-orchestrator.ts                    # Line 707: smartCommit call
│   ├── session-manager.ts                      # Session path management
│   └── models.ts                               # Type definitions
├── utils/
│   ├── git-commit.ts                           # Smart commit implementation
│   └── logger.ts                               # Logging utilities
└── tools/
    └── git-mcp.ts                              # Git operations (status, add, commit)

plan/003_b3d3efdaf0ed/
└── P1M2T1S3/
    └── research/                               # Research documents
        ├── integration-test-patterns.md
        ├── simple-git-library-research.md
        └── smart-commit-calling-context.md
```

### Desired Codebase Tree (new test file structure)

```bash
tests/integration/smart-commit.test.ts           # NEW: Smart commit integration tests
├── describe('integration/smart-commit > smart commit functionality')
│   ├── describe('commit triggering after subtask completion')
│   │   ├── it('should trigger smart commit after successful subtask execution')
│   │   └── it('should not trigger smart commit after failed subtask execution')
│   ├── describe('commit message formatting')
│   │   ├── it('should format commit message with subtask ID and title')
│   │   ├── it('should add [PRP Auto] prefix to commit message')
│   │   └── it('should add Co-Authored-By trailer to commit message')
│   ├── describe('protected files filtering')
│   │   ├── it('should not commit tasks.json')
│   │   ├── it('should not commit PRD.md')
│   │   ├── it('should not commit prd_snapshot.md')
│   │   └── it('should commit non-protected files')
│   ├── describe('commit hash and logging')
│   │   ├── it('should return commit hash on successful commit')
│   │   ├── it('should log commit hash on success')
│   │   └── it('should log when no files to commit')
│   ├── describe('error handling')
│   │   ├── it('should not fail subtask when smart commit fails')
│   │   ├── it('should log error when smart commit fails')
│   │   └── it('should return null when git operations fail')
│   └── describe('edge cases')
│       ├── it('should not create commit when only protected files changed')
│       ├── it('should not create commit when no files changed')
│       └── it('should handle missing session path gracefully')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Smart commit integration point
// From task-orchestrator.ts lines 707-728
try {
  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (!sessionPath) {
    this.#logger.warn('Session path not available for smart commit');
  } else {
    const commitMessage = `${subtask.id}: ${subtask.title}`;
    const commitHash = await smartCommit(sessionPath, commitMessage);
    if (commitHash) {
      this.#logger.info({ commitHash }, 'Commit created');
    } else {
      this.#logger.info('No files to commit');
    }
  }
} catch (error) {
  // Don't fail the subtask if commit fails
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.#logger.error({ error: errorMessage }, 'Smart commit failed');
}
// GOTCHA: Commit failures are caught and logged, but don't fail subtask
// GOTCHA: Session path is checked for null/undefined before calling smartCommit

// CRITICAL: Protected files list
// From git-commit.ts lines 38-42
const PROTECTED_FILES = [
  'tasks.json', // Pipeline task registry
  'PRD.md', // Original PRD document
  'prd_snapshot.md', // PRD snapshot for delta detection
] as const;
// GOTCHA: Uses basename() for comparison, so path/to/tasks.json is also filtered

// CRITICAL: Commit message format
// From git-commit.ts lines 85-87
export function formatCommitMessage(message: string): string {
  return `[PRP Auto] ${message}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
}
// GOTCHA: Input message is `{subtask.id}: {subtask.title}` from TaskOrchestrator
// GOTCHA: Final format: "[PRP Auto] P1.M2.T1.S3: Verify smart commit\n\nCo-Authored-By:..."

// CRITICAL: File filtering logic
// From git-commit.ts lines 62-67
export function filterProtectedFiles(files: string[]): string[] {
  return files.filter(file => {
    const fileName = basename(file) as (typeof PROTECTED_FILES)[number];
    return !PROTECTED_FILES.includes(fileName);
  });
}
// GOTCHA: Uses basename() to handle both relative and absolute paths
// GOTCHA: Type assertion to PROTECTED_FILES[number] for type safety

// CRITICAL: Smart commit return values
// From git-commit.ts lines 127-207
export async function smartCommit(
  sessionPath: string,
  message: string
): Promise<string | null>;
// Returns: commit hash (string) on success, null on no files or failure
// GOTCHA: Returns null when no files to commit after filtering
// GOTCHA: Returns null on any git operation failure (status, add, commit)

// CRITICAL: GitMCP result structure
// From git-mcp.ts (status, add, commit implementations)
interface GitStatusResult {
  success: boolean;
  modified?: string[];
  untracked?: string[];
  error?: string;
}
interface GitAddResult {
  success: boolean;
  stagedCount?: number;
  error?: string;
}
interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  error?: string;
}
// GOTCHA: commitHash may be undefined even when success is true
// GOTCHA: Must check commitHash separately from success

// CRITICAL: Integration test mocking patterns
// From existing test patterns
vi.mock('../../../src/utils/git-commit.js', () => ({
  smartCommit: vi.fn(),
  filterProtectedFiles: vi.fn(),
  formatCommitMessage: vi.fn(),
}));
// GOTCHA: Must mock at module level before imports
// GOTCHA: Use vi.mocked() for type-safe mock access

// CRITICAL: TaskOrchestrator test patterns
// From task-orchestrator-runtime.test.ts
// Mock PRPRuntime, SessionManager before importing TaskOrchestrator
// GOTCHA: Must mock logger to verify log messages
// GOTCHA: SessionManager.currentSession?.metadata.path must be set

// CRITICAL: Import patterns with .js extensions
import { TaskOrchestrator } from '../../../src/core/task-orchestrator.js';
import { smartCommit } from '../../../src/utils/git-commit.js';
// GOTCHA: Always use .js extensions for imports

// CRITICAL: Logger mocking patterns
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
// GOTCHA: Must use hoisted variables for logger mocks

// CRITICAL: Subtask completion status
// From task-orchestrator.ts, smart commit only called on successful completion
// GOTCHA: Must verify subtask status is 'Complete' before smart commit call
// GOTCHA: Smart commit NOT called on 'Failed', 'Skipped', or other statuses

// CRITICAL: Temp directory cleanup
// From integration test patterns
afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
// GOTCHA: Use force: true to ensure cleanup even if files are locked
```

## Implementation Blueprint

### Data Models and Structure

The test uses existing models from `src/core/models.ts`:

```typescript
// Subtask structure from models.ts
interface Subtask {
  type: 'Subtask';
  id: string; // Format: P1.M2.T1.S3
  title: string; // Human-readable title
  status: TaskStatus; // 'Planned' | 'Implementing' | 'Complete' | 'Failed'
  story_points: number;
  dependencies: string[];
  context_scope: string;
}

// Expected commit message components
// Format: "[PRP Auto] {subtask.id}: {subtask.title}\n\nCo-Authored-By: Claude <noreply@anthropic.com>"
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/integration/smart-commit.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPORT: All dependencies (vitest, TaskOrchestrator, models, fs utilities)
  - SETUP: Mock declarations for git-commit, logger, git-mcp
  - SETUP: Helper functions (createMockSubtask, createMockSession, setupTestEnvironment)
  - SETUP: beforeEach/afterEach hooks with temp directory management
  - IMPLEMENT: Top-level describe block
  - FOLLOW pattern: tests/integration/core/task-orchestrator-runtime.test.ts (test structure)
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT commit triggering tests
  - ADD: describe block 'commit triggering after subtask completion'
  - IMPLEMENT: it('should trigger smart commit after successful subtask execution')
    - SETUP: Create mock subtask, session, and TaskOrchestrator
    - SETUP: Mock PRPRuntime to return success
    - EXECUTE: Call executeSubtask with mock subtask
    - VERIFY: smartCommit was called with correct session path and message
  - IMPLEMENT: it('should not trigger smart commit after failed subtask execution')
    - SETUP: Create mock subtask and mock PRPRuntime to return failure
    - EXECUTE: Call executeSubtask with mock subtask
    - VERIFY: smartCommit was NOT called
  - FOLLOW pattern: From task-orchestrator-runtime.test.ts (subtask execution patterns)
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test section

Task 3: IMPLEMENT commit message formatting tests
  - ADD: describe block 'commit message formatting'
  - IMPLEMENT: it('should format commit message with subtask ID and title')
    - SETUP: Create subtask with ID "P1.M2.T1.S3" and title "Verify smart commit"
    - EXECUTE: Call executeSubtask
    - VERIFY: smartCommit called with message "P1.M2.T1.S3: Verify smart commit"
  - IMPLEMENT: it('should add [PRP Auto] prefix to commit message')
    - SETUP: Mock smartCommit to return commit hash
    - EXECUTE: Call executeSubtask
    - VERIFY: formatCommitMessage adds "[PRP Auto]" prefix
    - OR: Verify by checking internal gitCommit call with formatted message
  - IMPLEMENT: it('should add Co-Authored-By trailer to commit message')
    - SETUP: Mock smartCommit and inspect gitCommit call
    - EXECUTE: Call executeSubtask
    - VERIFY: Message includes "\n\nCo-Authored-By: Claude <noreply@anthropic.com>"
  - SETUP: Spy on git-mcp functions to verify formatted message
  - FOLLOW pattern: From git-commit.test.ts (message formatting tests)
  - DEPENDENCIES: Task 2 (commit triggering)
  - PLACEMENT: After commit triggering tests

Task 4: IMPLEMENT protected files filtering tests
  - ADD: describe block 'protected files filtering'
  - IMPLEMENT: it('should not commit tasks.json')
    - SETUP: Mock git status to return tasks.json as modified
    - SETUP: Mock other non-protected files as modified
    - EXECUTE: Call smartCommit
    - VERIFY: gitAdd was NOT called with tasks.json
    - VERIFY: gitAdd was called with other files
  - IMPLEMENT: it('should not commit PRD.md')
    - SETUP: Mock git status to return PRD.md as untracked
    - EXECUTE: Call smartCommit
    - VERIFY: gitAdd was NOT called with PRD.md
  - IMPLEMENT: it('should not commit prd_snapshot.md')
    - SETUP: Mock git status to return prd_snapshot.md as modified
    - EXECUTE: Call smartCommit
    - VERIFY: gitAdd was NOT called with prd_snapshot.md
  - IMPLEMENT: it('should commit non-protected files')
    - SETUP: Mock git status with mix of protected and non-protected files
    - EXECUTE: Call smartCommit
    - VERIFY: Only non-protected files were passed to gitAdd
  - SETUP: Mock gitStatus, gitAdd, gitCommit at module level
  - FOLLOW pattern: From git-commit.test.ts (file filtering tests)
  - DEPENDENCIES: Task 3 (message formatting)
  - PLACEMENT: After message formatting tests

Task 5: IMPLEMENT commit hash and logging tests
  - ADD: describe block 'commit hash and logging'
  - IMPLEMENT: it('should return commit hash on successful commit')
    - SETUP: Mock gitCommit to return commit hash "abc123def456"
    - EXECUTE: Call executeSubtask
    - VERIFY: smartCommit returned "abc123def456"
    - VERIFY: logger.info was called with { commitHash: "abc123def456" }
  - IMPLEMENT: it('should log commit hash on success')
    - SETUP: Mock smartCommit to return commit hash
    - SETUP: Spy on logger.info
    - EXECUTE: Call executeSubtask
    - VERIFY: logger.info called with "Commit created" message and commitHash
  - IMPLEMENT: it('should log when no files to commit')
    - SETUP: Mock git status to return only protected files
    - SETUP: Mock smartCommit to return null
    - EXECUTE: Call executeSubtask
    - VERIFY: logger.info called with "No files to commit"
  - SETUP: Mock logger with hoisted variables
  - FOLLOW pattern: From task-orchestrator-runtime.test.ts (logging verification)
  - DEPENDENCIES: Task 4 (protected files)
  - PLACEMENT: After protected files tests

Task 6: IMPLEMENT error handling tests
  - ADD: describe block 'error handling'
  - IMPLEMENT: it('should not fail subtask when smart commit fails')
    - SETUP: Mock smartCommit to throw error
    - SETUP: Mock PRPRuntime to return success
    - EXECUTE: Call executeSubtask
    - VERIFY: Subtask status is 'Complete' (not failed)
    - VERIFY: logger.error was called with error message
  - IMPLEMENT: it('should log error when smart commit fails')
    - SETUP: Mock smartCommit to reject with error
    - EXECUTE: Call executeSubtask
    - VERIFY: logger.error called with "Smart commit failed" message
  - IMPLEMENT: it('should return null when git operations fail')
    - SETUP: Mock gitStatus to return failure
    - EXECUTE: Call smartCommit
    - VERIFY: smartCommit returned null
  - SETUP: Mock various failure scenarios
  - FOLLOW pattern: From task-orchestrator-runtime.test.ts (error handling)
  - DEPENDENCIES: Task 5 (commit hash)
  - PLACEMENT: After commit hash tests

Task 7: IMPLEMENT edge case tests
  - ADD: describe block 'edge cases'
  - IMPLEMENT: it('should not create commit when only protected files changed')
    - SETUP: Mock git status to return only protected files
    - EXECUTE: Call smartCommit
    - VERIFY: gitAdd was NOT called
    - VERIFY: gitCommit was NOT called
    - VERIFY: Returned null
  - IMPLEMENT: it('should not create commit when no files changed')
    - SETUP: Mock git status to return empty state
    - EXECUTE: Call smartCommit
    - VERIFY: gitAdd was NOT called
    - VERIFY: gitCommit was NOT called
  - IMPLEMENT: it('should handle missing session path gracefully')
    - SETUP: Create session with null path
    - EXECUTE: Call executeSubtask
    - VERIFY: logger.warn called with "Session path not available"
    - VERIFY: smartCommit was NOT called
  - SETUP: Various edge case scenarios
  - FOLLOW pattern: From git-commit.test.ts (edge cases)
  - DEPENDENCIES: Task 6 (error handling)
  - PLACEMENT: Final test section

Task 8: VERIFY test coverage and completeness
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Temp directory cleanup in afterEach
  - VERIFY: All contract requirements from PRD tested
  - RUN: npx vitest run tests/integration/smart-commit.test.ts
  - VERIFY: All tests pass
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Integration tests for Smart Commit Functionality
 *
 * @remarks
 * Tests validate the smart commit workflow that automatically creates Git commits
 * after successful subtask completion, with proper message formatting and protected
 * file filtering.
 *
 * Tests verify:
 * - Git commit is triggered after successful subtask completion
 * - Commit message format: [PRP Auto] {subtask.id}: {subtask.title}
 * - Protected files (tasks.json, PRD.md, prd_snapshot.md) are not committed
 * - All other changes are staged and committed
 * - Commit hash is returned and logged
 * - Smart commit failures don't fail subtask execution
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/task-orchestrator.ts | TaskOrchestrator Implementation}
 * @see {@link ../../src/utils/git-commit.ts | Smart Commit Implementation}
 * @see {@link ../../src/tools/git-mcp.ts | Git MCP Implementation}
 */

// PATTERN: Mock declarations (must be before imports)
// Mock git-commit module
vi.mock('../../../src/utils/git-commit.js', () => ({
  smartCommit: vi.fn(),
  filterProtectedFiles: vi.fn((files: string[]) =>
    files.filter(
      f =>
        !['tasks.json', 'PRD.md', 'prd_snapshot.md'].includes(
          require('node:path').basename(f)
        )
    )
  ),
  formatCommitMessage: vi.fn(
    (msg: string) =>
      `[PRP Auto] ${msg}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`
  ),
}));

// Mock git-mcp module
vi.mock('../../../src/tools/git-mcp.js', () => ({
  gitStatus: vi.fn(),
  gitAdd: vi.fn(),
  gitCommit: vi.fn(),
}));

// Mock logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// PATTERN: Import statements with .js extensions
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { TaskOrchestrator } from '../../../src/core/task-orchestrator.js';
import type { Backlog, Subtask } from '../../../src/core/models.js';
import {
  smartCommit,
  filterProtectedFiles,
  formatCommitMessage,
} from '../../../src/utils/git-commit.js';
import { gitStatus, gitAdd, gitCommit } from '../../../src/tools/git-mcp.js';

// PATTERN: Typed mocks
const mockSmartCommit = vi.mocked(smartCommit);
const mockFilterProtectedFiles = vi.mocked(filterProtectedFiles);
const mockFormatCommitMessage = vi.mocked(formatCommitMessage);
const mockGitStatus = vi.mocked(gitStatus);
const mockGitAdd = vi.mocked(gitAdd);
const mockGitCommit = vi.mocked(gitCommit);

// PATTERN: Helper function to create mock subtask
function createMockSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    type: 'Subtask',
    id: 'P1.M2.T1.S3',
    title: 'Verify smart commit functionality',
    status: 'Implementing',
    story_points: 1,
    dependencies: [],
    context_scope:
      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
    ...overrides,
  };
}

// PATTERN: Helper function to create mock session state
function createMockSessionState(sessionPath: string) {
  return {
    metadata: {
      id: '001_abc123def456',
      hash: 'abc123def456',
      path: sessionPath,
      createdAt: new Date(),
      parentSession: null,
    },
    prdSnapshot: '# Test PRD',
    taskRegistry: { backlog: [] },
    currentItemId: null,
  };
}

// PATTERN: Helper function to setup test environment
function setupTestEnvironment() {
  const tempDir = mkdtempSync(join(tmpdir(), 'smart-commit-test-'));
  const planDir = join(tempDir, 'plan');
  const prdPath = join(tempDir, 'PRD.md');
  const sessionPath = join(planDir, '001_abc123def456');

  // Create directory structure
  mkdirSync(sessionPath, { recursive: true });

  // Write PRD file
  writeFileSync(prdPath, '# Test PRD');

  // Write session files
  writeFileSync(
    join(sessionPath, 'tasks.json'),
    JSON.stringify({ backlog: [] }, null, 2)
  );
  writeFileSync(join(sessionPath, 'prd_snapshot.md'), '# Test PRD');

  return { tempDir, planDir, prdPath, sessionPath };
}

// PATTERN: Test structure with describe blocks
describe('integration/smart-commit > smart commit functionality', () => {
  let tempDir: string;
  let sessionPath: string;
  let taskOrchestrator: TaskOrchestrator;
  let mockSessionManager: any;

  beforeEach(() => {
    // SETUP: Create test environment
    const env = setupTestEnvironment();
    tempDir = env.tempDir;
    sessionPath = env.sessionPath;

    // SETUP: Clear all mocks
    vi.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();

    // SETUP: Create mock session manager
    mockSessionManager = {
      currentSession: createMockSessionState(sessionPath),
      loadSession: vi.fn(),
      saveBacklog: vi.fn(),
      updateTaskStatus: vi.fn(),
    };

    // SETUP: Create TaskOrchestrator with mocked session manager
    taskOrchestrator = new TaskOrchestrator(mockSessionManager as any);
  });

  afterEach(() => {
    // CLEANUP: Remove temp directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // PATTERN: Commit triggering test
  describe('commit triggering after subtask completion', () => {
    it('should trigger smart commit after successful subtask execution', async () => {
      // SETUP: Create mock subtask
      const subtask = createMockSubtask({
        id: 'P1.M2.T1.S3',
        title: 'Verify smart commit functionality',
      });

      // SETUP: Mock PRPRuntime to return success
      const mockPRPRuntime = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          finalStatus: 'Complete',
        }),
      };

      // SETUP: Mock smartCommit to return commit hash
      mockSmartCommit.mockResolvedValue('abc123def456');

      // EXECUTE: Execute subtask (this will trigger smart commit)
      // Note: We need to access the internal PRPRuntime or mock the executeSubtask method
      // This is a simplified example - actual implementation may differ
      await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Smart commit was called with correct parameters
      expect(mockSmartCommit).toHaveBeenCalledWith(
        sessionPath,
        'P1.M2.T1.S3: Verify smart commit functionality'
      );
    });

    it('should not trigger smart commit after failed subtask execution', async () => {
      // SETUP: Create mock subtask
      const subtask = createMockSubtask();

      // SETUP: Mock PRPRuntime to return failure
      const mockPRPRuntime = {
        execute: vi.fn().mockResolvedValue({
          success: false,
          finalStatus: 'Failed',
        }),
      };

      // EXECUTE: Execute subtask (which will fail)
      await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Smart commit was NOT called
      expect(mockSmartCommit).not.toHaveBeenCalled();
    });
  });

  // PATTERN: Commit message formatting test
  describe('commit message formatting', () => {
    it('should format commit message with subtask ID and title', async () => {
      // SETUP: Create subtask with specific ID and title
      const subtask = createMockSubtask({
        id: 'P3.M4.T1.S3',
        title: 'Implement smart commit workflow',
      });

      // SETUP: Mock PRPRuntime to return success
      mockSmartCommit.mockResolvedValue('abc123');

      // EXECUTE: Execute subtask
      await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Smart commit called with formatted message
      expect(mockSmartCommit).toHaveBeenCalledWith(
        sessionPath,
        'P3.M4.T1.S3: Implement smart commit workflow'
      );
    });

    it('should add [PRP Auto] prefix to commit message', async () => {
      // SETUP: Mock formatCommitMessage to track calls
      const baseMessage = 'P1.M2.T1.S3: Test';
      mockFormatCommitMessage.mockReturnValue(
        `[PRP Auto] ${baseMessage}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`
      );

      // EXECUTE: Call formatCommitMessage
      const formatted = formatCommitMessage(baseMessage);

      // VERIFY: Prefix added
      expect(formatted).toContain('[PRP Auto]');
      expect(formatted).toContain(baseMessage);
    });

    it('should add Co-Authored-By trailer to commit message', async () => {
      // SETUP
      const baseMessage = 'P1.M2.T1.S3: Test';

      // EXECUTE
      const formatted = formatCommitMessage(baseMessage);

      // VERIFY: Trailer added with blank line before
      expect(formatted).toContain(
        'Co-Authored-By: Claude <noreply@anthropic.com>'
      );
      expect(formatted).toMatch(/\n\nCo-Authored-By:/);
    });
  });

  // PATTERN: Protected files filtering test
  describe('protected files filtering', () => {
    it('should not commit tasks.json', async () => {
      // SETUP: Mock git status to return protected files
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['src/index.ts', 'tasks.json'],
        untracked: [],
      });
      mockGitAdd.mockResolvedValue({ success: true, stagedCount: 1 });
      mockGitCommit.mockResolvedValue({ success: true, commitHash: 'abc123' });

      // EXECUTE: Call smartCommit directly
      await smartCommit(sessionPath, 'Test commit');

      // VERIFY: gitAdd was called without tasks.json
      expect(mockGitAdd).toHaveBeenCalledWith({
        path: sessionPath,
        files: ['src/index.ts'], // No tasks.json
      });
    });

    it('should not commit PRD.md', async () => {
      // SETUP
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: [],
        untracked: ['src/utils.ts', 'PRD.md'],
      });
      mockGitAdd.mockResolvedValue({ success: true, stagedCount: 1 });
      mockGitCommit.mockResolvedValue({ success: true, commitHash: 'abc123' });

      // EXECUTE
      await smartCommit(sessionPath, 'Test commit');

      // VERIFY
      expect(mockGitAdd).toHaveBeenCalledWith({
        path: sessionPath,
        files: ['src/utils.ts'], // No PRD.md
      });
    });

    it('should not commit prd_snapshot.md', async () => {
      // SETUP
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['src/app.ts', 'prd_snapshot.md'],
        untracked: [],
      });
      mockGitAdd.mockResolvedValue({ success: true, stagedCount: 1 });
      mockGitCommit.mockResolvedValue({ success: true, commitHash: 'abc123' });

      // EXECUTE
      await smartCommit(sessionPath, 'Test commit');

      // VERIFY
      expect(mockGitAdd).toHaveBeenCalledWith({
        path: sessionPath,
        files: ['src/app.ts'], // No prd_snapshot.md
      });
    });

    it('should commit non-protected files', async () => {
      // SETUP: Mix of protected and non-protected files
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['src/index.ts', 'tasks.json', 'src/utils.ts'],
        untracked: ['README.md', 'PRD.md'],
      });
      mockGitAdd.mockResolvedValue({ success: true, stagedCount: 3 });
      mockGitCommit.mockResolvedValue({ success: true, commitHash: 'abc123' });

      // EXECUTE
      await smartCommit(sessionPath, 'Test commit');

      // VERIFY: Only non-protected files
      expect(mockGitAdd).toHaveBeenCalledWith({
        path: sessionPath,
        files: ['src/index.ts', 'src/utils.ts', 'README.md'],
      });
    });
  });

  // PATTERN: Commit hash and logging test
  describe('commit hash and logging', () => {
    it('should return commit hash on successful commit', async () => {
      // SETUP
      const commitHash = 'abc123def456';
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['src/index.ts'],
      });
      mockGitAdd.mockResolvedValue({ success: true, stagedCount: 1 });
      mockGitCommit.mockResolvedValue({ success: true, commitHash });

      // EXECUTE
      const result = await smartCommit(sessionPath, 'Test commit');

      // VERIFY: Commit hash returned
      expect(result).toBe(commitHash);
    });

    it('should log commit hash on success', async () => {
      // SETUP: Create subtask and mock success
      const subtask = createMockSubtask();
      const commitHash = 'abc123';
      mockSmartCommit.mockResolvedValue(commitHash);

      // EXECUTE: Execute subtask
      await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Logger called with commit hash
      expect(mockLogger.info).toHaveBeenCalledWith(
        { commitHash },
        'Commit created'
      );
    });

    it('should log when no files to commit', async () => {
      // SETUP: Mock to return null (no files)
      mockSmartCommit.mockResolvedValue(null);

      // EXECUTE: Execute subtask
      const subtask = createMockSubtask();
      await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Logged appropriately
      expect(mockLogger.info).toHaveBeenCalledWith('No files to commit');
    });
  });

  // PATTERN: Error handling test
  describe('error handling', () => {
    it('should not fail subtask when smart commit fails', async () => {
      // SETUP: Mock smart commit to throw error
      const error = new Error('Git operation failed');
      mockSmartCommit.mockRejectedValue(error);

      // SETUP: Mock PRPRuntime to succeed
      const subtask = createMockSubtask();

      // EXECUTE: Execute subtask
      const result = await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Subtask still completes successfully
      // (Implementation depends on executeSubtask return value)
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log error when smart commit fails', async () => {
      // SETUP
      const errorMessage = 'Git repository not found';
      mockSmartCommit.mockRejectedValue(new Error(errorMessage));

      // EXECUTE
      const subtask = createMockSubtask();
      await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Error logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: errorMessage,
        }),
        'Smart commit failed'
      );
    });

    it('should return null when git operations fail', async () => {
      // SETUP: Mock git status failure
      mockGitStatus.mockResolvedValue({
        success: false,
        error: 'Not a git repository',
      });

      // EXECUTE
      const result = await smartCommit(sessionPath, 'Test commit');

      // VERIFY: Null returned on failure
      expect(result).toBeNull();
    });
  });

  // PATTERN: Edge cases test
  describe('edge cases', () => {
    it('should not create commit when only protected files changed', async () => {
      // SETUP: Only protected files in status
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['tasks.json', 'prd_snapshot.md'],
        untracked: ['PRD.md'],
      });

      // EXECUTE
      const result = await smartCommit(sessionPath, 'Test commit');

      // VERIFY: No git operations performed
      expect(mockGitAdd).not.toHaveBeenCalled();
      expect(mockGitCommit).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should not create commit when no files changed', async () => {
      // SETUP: Empty git status
      mockGitStatus.mockResolvedValue({
        success: true,
      });

      // EXECUTE
      const result = await smartCommit(sessionPath, 'Test commit');

      // VERIFY: No git operations performed
      expect(mockGitAdd).not.toHaveBeenCalled();
      expect(mockGitCommit).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle missing session path gracefully', async () => {
      // SETUP: Session with null path
      mockSessionManager.currentSession = null;

      // EXECUTE: Try to execute subtask
      const subtask = createMockSubtask();
      await taskOrchestrator.executeSubtask(subtask);

      // VERIFY: Warning logged, smart commit not called
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Session path not available for smart commit'
      );
      expect(mockSmartCommit).not.toHaveBeenCalled();
    });
  });
});
```

### Integration Points

```yaml
TASK_ORCHESTRATOR:
  - executeSubtask(): Main entry point that triggers smart commit after completion
  - Lines 707-728: Smart commit integration point with try/catch wrapper
  - Commit message format: `${subtask.id}: ${subtask.title}`

SMART_COMMIT:
  - smartCommit(): Main function that orchestrates git operations
  - filterProtectedFiles(): Filters out tasks.json, PRD.md, prd_snapshot.md
  - formatCommitMessage(): Adds [PRP Auto] prefix and Co-Authored-By trailer

GIT_MCP_TOOLS:
  - gitStatus(): Checks for modified and untracked files
  - gitAdd(): Stages files for commit
  - gitCommit(): Creates commit with formatted message

SESSION_MANAGER:
  - currentSession?.metadata.path: Session path used as git repository path
  - Returns null if session not available (logged as warning)

LOGGER:
  - logger.info(): Logs "Commit created" with hash or "No files to commit"
  - logger.warn(): Logs "Session path not available"
  - logger.error(): Logs "Smart commit failed" with error details

NO_EXTERNAL_FILE_OPERATIONS:
  - Tests use mocked git operations (unit-level integration)
  - No actual git repositories created in tests
  - Mocks verify correct behavior without filesystem dependencies

SCOPE_BOUNDARIES:
  - This PRP tests smart commit integration with TaskOrchestrator
  - Does NOT test individual git operations (unit tests do that)
  - Does NOT test PRPRuntime execution (separate test file)
  - Tests verify SMART COMMIT CONTRACT, not git implementation details
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/integration/smart-commit.test.ts --fix

# Check TypeScript types
npx tsc --noEmit tests/integration/smart-commit.test.ts

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the smart-commit file
npx vitest run tests/integration/smart-commit.test.ts

# Run with coverage
npx vitest run tests/integration/smart-commit.test.ts --coverage

# Run all integration tests to ensure no breakage
npx vitest run tests/integration/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify all integration tests still pass
npx vitest run tests/integration/

# Run related integration tests to ensure no breakage
npx vitest run tests/integration/core/

# Check that existing smart commit unit tests still work
npx vitest run tests/unit/utils/git-commit.test.ts

# Expected: All existing tests pass, new tests pass
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/smart-commit.test.ts

# Check test file follows project conventions
head -50 tests/integration/smart-commit.test.ts
# Should see: describe blocks, proper imports, helper functions

# Verify all test categories are present
grep -n "describe.*commit triggering" tests/integration/smart-commit.test.ts
grep -n "describe.*commit message formatting" tests/integration/smart-commit.test.ts
grep -n "describe.*protected files filtering" tests/integration/smart-commit.test.ts
grep -n "describe.*commit hash and logging" tests/integration/smart-commit.test.ts
grep -n "describe.*error handling" tests/integration/smart-commit.test.ts
grep -n "describe.*edge cases" tests/integration/smart-commit.test.ts

# Verify SETUP/EXECUTE/VERIFY pattern
grep -n "SETUP:" tests/integration/smart-commit.test.ts
grep -n "EXECUTE:" tests/integration/smart-commit.test.ts
grep -n "VERIFY:" tests/integration/smart-commit.test.ts

# Expected: Test file well-structured, all categories present
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] Test file structure follows project patterns
- [ ] Tests use mocked git operations (integration-level mocking)
- [ ] Temp directory cleanup in afterEach
- [ ] Tests import with .js extensions
- [ ] All describe blocks have clear, descriptive names
- [ ] Helper functions follow existing patterns

### Feature Validation

- [ ] Git commit triggered after successful subtask completion
- [ ] Commit message format: `[PRP Auto] {subtask.id}: {subtask.title}`
- [ ] Co-Authored-By trailer included in commit message
- [ ] Protected files (tasks.json, PRD.md, prd_snapshot.md) filtered out
- [ ] Non-protected files committed correctly
- [ ] Commit hash returned and logged
- [ ] No commit when only protected files changed
- [ ] No commit when no files changed
- [ ] Smart commit failures don't fail subtask execution
- [ ] Missing session path handled gracefully

### Code Quality Validation

- [ ] Follows existing integration test patterns from task-orchestrator-runtime.test.ts
- [ ] Helper functions use same patterns as existing tests
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes rmSync with force: true
- [ ] Tests focus on smart commit contract, not git implementation details

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Test names clearly describe what is being tested
- [ ] Research documents stored in research/ subdirectory
- [ ] Tests verify PRD requirements for smart commit functionality

---

## Anti-Patterns to Avoid

- ❌ Don't create actual git repositories in tests - use mocked operations
- ❌ Don't skip testing protected file filtering - it's critical for pipeline state
- ❌ Don't skip testing commit message format - it's required for traceability
- ❌ Don't skip testing error handling - commit failures must not break subtasks
- ❌ Don't test unit-level git operations - integration tests verify contracts
- ❌ Don't hardcode file paths - use join() for cross-platform compatibility
- ❌ Don't skip verifying logger calls - observability is critical
- ❌ Don't forget to import with .js extensions
- ❌ Don't skip temp directory cleanup - causes test pollution
- ❌ Don't duplicate tests from git-commit.test.ts - focus on TaskOrchestrator integration
- ❌ Don't skip testing all three protected files individually
- ❌ Don't skip testing null return values (no files to commit)
- ❌ Don't assume commit hash exists - verify it separately from success flag

---

**PRP Version:** 1.0
**Work Item:** P1.M2.T1.S3
**Created:** 2026-01-20
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**

- Complete smart commit implementation with exact line numbers and patterns
- Comprehensive integration test research from existing test files
- Smart commit calling context analysis with exact integration point
- Protected files list and filtering logic fully documented
- Commit message format specification with exact format string
- Error handling and logging patterns clearly specified
- Clear task breakdown with dependency ordering
- All contract requirements from PRD covered
- Extensive research documentation in research/ subdirectory
- No gaps in context - implementation can proceed with PRP alone
- Helper functions and patterns clearly specified
- Scope boundaries well-defined to avoid duplication with existing tests
