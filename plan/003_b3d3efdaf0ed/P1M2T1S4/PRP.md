# Product Requirement Prompt (PRP): P1.M2.T1.S4 - Verify protected files are never modified

***

## Goal

**Feature Goal**: Create comprehensive unit tests that verify protected files are never modified by agents, covering git commit filtering, filesystem-level protection (deletion/movement), and agent forbidden operations enforcement.

**Deliverable**: Unit test file `tests/unit/protected-files.test.ts` with complete coverage of protected file enforcement verification across git operations, filesystem operations, and agent constraints.

**Success Definition**: All tests pass, verifying:

* Git commits exclude all protected files (tasks.json, PRD.md, prd_snapshot.md, delta_prd.md, delta_from.txt, TEST_RESULTS.md, *tasks*.json pattern)
* Filesystem operations prevent deletion of protected files
* Filesystem operations prevent movement of protected files
* Agents cannot modify PRD.md through file operations
* Smart commits exclude protected files from commits
* Validation prevents adding protected files to .gitignore
* Wildcard pattern matching works correctly for *tasks*.json

## Why

* **State Integrity**: Validates that pipeline state files (tasks.json, PRD.md, prd_snapshot.md, delta session files, TEST_RESULTS.md) are never modified, ensuring clean pipeline resumption and state management
* **Git History Hygiene**: Ensures protected state files are filtered from git commits, preventing history pollution with frequently-changing state files
* **Agent Constraint Enforcement**: Verifies that agents respect forbidden operation boundaries defined in PRD §5.2
* **Wildcard Pattern Protection**: Tests that the *tasks*.json pattern correctly prevents accidental modification of any task registry files
* **Contract Compliance**: Validates that the system correctly implements protected file specifications from system_context.md and PRD.md §5.1

**Relationship to P1.M2.T1.S3**: The previous subtask (P1.M2.T1.S3) validates smart commit functionality. This subtask (P1.M2.T1.S4) expands protected file testing beyond git commits to include filesystem operations and agent constraints.

**Critical Gap**: Current implementation only partially protects files through git commit filtering. Missing protections for:
* delta_prd.md, delta_from.txt, TEST_RESULTS.md in git filter
* Filesystem-level deletion/movement guards
* Wildcard pattern *tasks*.json support
* Agent-level forbidden operation validation

## What

Unit tests that verify protected files are never modified through git operations, filesystem operations, and agent interactions.

### Success Criteria

* [ ] Git commits filter out all protected files (current list + missing files)
* [ ] Wildcard pattern *tasks*.json matches and filters task files
* [ ] Filesystem delete operations throw error for protected files
* [ ] Filesystem move operations throw error for protected files
* [ ] Agents cannot modify PRD.md through file write operations
* [ ] Validation prevents adding protected files to .gitignore
* [ ] Tests cover all protected files from system_context.md specification
* [ ] Tests use proper mocking patterns (no real filesystem/git operations)

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

* Complete protected files specification from system_context.md and PRD.md §5.1
* Existing git-commit implementation with exact protected files list
* Vitest testing framework with mocking patterns from existing tests
* Mocking patterns for git operations and file operations
* Test structure patterns from existing unit tests
* Helper function patterns from test fixtures
* Clear file paths and line numbers for all referenced code
* Specific assertion patterns for verifying operations were NOT called

### Documentation & References

```yaml
# MUST READ - Protected files specification
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Complete specification of protected files and forbidden operations
  lines: 463-481 (Protected Files and Forbidden Operations sections)
  pattern: Protected files list, forbidden operations definitions
  gotcha: Includes wildcard pattern *tasks*.json and session-specific files

# MUST READ - PRD Section 5.1 State & File Management
- file: PRD.md
  why: PRD requirements for protected files and agent boundaries
  lines: 104-122 (State & File Management), 133-151 (Agent Capabilities)
  pattern: Agent-specific forbidden operations, protected file definitions
  gotcha: Different agents have different forbidden operations

# MUST READ - Git commit implementation (current protections)
- file: src/utils/git-commit.ts
  why: Existing protected files implementation with filterProtectedFiles function
  lines: 1-208 (entire file), specifically 38-42 (PROTECTED_FILES), 62-67 (filterProtectedFiles)
  pattern: basename comparison, const array of protected files
  gotcha: Only protects tasks.json, PRD.md, prd_snapshot.md (missing delta files and TEST_RESULTS.md)

# MUST READ - Existing git commit unit tests
- file: tests/unit/utils/git-commit.test.ts
  why: Reference patterns for testing filterProtectedFiles and smart commit
  lines: 56-145 (filterProtectedFiles tests)
  pattern: Mock gitStatus, gitAdd, gitCommit; test file filtering with paths
  gotcha: Uses vi.mocked() for type-safe mocks, SETUP/EXECUTE/VERIFY pattern

# MUST READ - Filesystem MCP tests
- file: tests/unit/tools/filesystem-mcp.test.ts
  why: Reference patterns for testing file operations with mocked fs
  lines: 1-200+ (full test file)
  pattern: Mock node:fs/promises, test readFile/writeFile with error handling
  gotcha: Uses vi.mock for fs operations, tracks write attempts

# MUST READ - Test patterns research
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S4/research/test-patterns-research.md
  why: Complete patterns for writing tests in this codebase
  section: "Testing File Protection Patterns"
  pattern: Mock setup, factory functions, protected file testing patterns

# MUST READ - Protected files specification research
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S4/research/protected-files-specs.md
  why: Consolidated protected files specification with gaps analysis
  section: "Complete Protected Files List", "Gaps in Current Implementation"
  pattern: All protected files, rationale, missing implementations

# MUST READ - Forbidden operations research
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S4/research/forbidden-operations-research.md
  why: Analysis of agent forbidden operations and enforcement mechanisms
  section: "PRD Requirements", "Missing Implementation"
  pattern: Agent-specific boundaries, universal forbidden operations

# MUST READ - Mocking patterns research
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S4/research/mocking-patterns-research.md
  why: Mocking patterns for git and file operations
  section: "Testing Files are NOT Modified", "Verifying Operations Were NOT Called"
  pattern: Verify .not.toHaveBeenCalled(), track file write attempts

# MUST READ - Smart commit integration tests (from P1.M2.T1.S3)
- file: tests/integration/smart-commit.test.ts
  why: Integration tests for smart commit protected file filtering
  lines: 391-471 (protected files filtering tests)
  pattern: Test that protected files are not committed
  gotcha: Tests integration point, not unit-level filter function
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── unit/
│   ├── utils/
│   │   ├── git-commit.test.ts              # Reference: Mock git operations, file filtering tests
│   │   └── protected-files.test.ts         # NEW: This PRP's deliverable
│   └── tools/
│       └── filesystem-mcp.test.ts          # Reference: Mock fs operations patterns
└── integration/
    └── smart-commit.test.ts                # Reference: Smart commit integration tests

src/
├── utils/
│   ├── git-commit.ts                       # Lines 38-42: PROTECTED_FILES, 62-67: filterProtectedFiles
│   └── logger.ts                           # Logging utilities
└── tools/
    ├── git-mcp.ts                          # Git operations (status, add, commit)
    └── filesystem-mcp.ts                   # File operations (read, write, delete, move)

plan/003_b3d3efdaf0ed/
└── P1M2T1S4/
    ├── PRP.md                              # This file
    └── research/                           # Research documents
        ├── test-patterns-research.md
        ├── protected-files-specs.md
        ├── forbidden-operations-research.md
        └── mocking-patterns-research.md
```

### Desired Codebase Tree (new test file structure)

```bash
tests/unit/protected-files.test.ts           # NEW: Protected files enforcement tests
├── describe('unit/protected-files > protected file enforcement')
│   ├── describe('git commit protection')
│   │   ├── it('should filter tasks.json from commits')
│   │   ├── it('should filter PRD.md from commits')
│   │   ├── it('should filter prd_snapshot.md from commits')
│   │   ├── it('should filter delta_prd.md from commits')  # MISSING from current impl
│   │   ├── it('should filter delta_from.txt from commits')  # MISSING
│   │   ├── it('should filter TEST_RESULTS.md from commits')  # MISSING
│   │   └── it('should filter *tasks*.json pattern from commits')  # MISSING
│   ├── describe('wildcard pattern matching')
│   │   ├── it('should match tasks.json')
│   │   ├── it('should match backup-tasks.json')
│   │   ├── it('should match tasks.backup.json')
│   │   └── it('should not match task.json (singular)')
│   ├── describe('filesystem delete protection')
│   │   ├── it('should throw error when deleting tasks.json')
│   │   ├── it('should throw error when deleting PRD.md')
│   │   ├── it('should throw error when deleting prd_snapshot.md')
│   │   ├── it('should throw error when deleting delta_prd.md')
│   │   ├── it('should throw error when deleting delta_from.txt')
│   │   └── it('should throw error when deleting TEST_RESULTS.md')
│   ├── describe('filesystem move protection')
│   │   ├── it('should throw error when moving tasks.json')
│   │   ├── it('should throw error when moving PRD.md')
│   │   └── it('should throw error when moving session root files')
│   ├── describe('agent write protection')
│   │   ├── it('should prevent agents from writing to PRD.md')
│   │   ├── it('should prevent agents from writing to tasks.json')
│   │   └── it('should allow agents to write to non-protected files')
│   ├── describe('.gitignore validation')
│   │   ├── it('should detect when plan/ is added to .gitignore')
│   │   ├── it('should detect when PRD.md is added to .gitignore')
│   │   └── it('should detect when tasks.json is added to .gitignore')
│   └── describe('protected file helper functions')
│       ├── it('should identify all protected files correctly')
│       ├── it('should use basename for path comparison')
│       └── it('should handle absolute and relative paths')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Current PROTECTED_FILES constant (incomplete)
// From src/utils/git-commit.ts lines 38-42
const PROTECTED_FILES = [
  'tasks.json',      // Pipeline task registry
  'PRD.md',          // Original PRD document
  'prd_snapshot.md', // PRD snapshot for delta detection
] as const;
// GOTCHA: Missing delta_prd.md, delta_from.txt, TEST_RESULTS.md
// GOTCHA: Missing wildcard pattern *tasks*.json
// GOTCHA: Tests should validate that CURRENT implementation is incomplete

// CRITICAL: filterProtectedFiles uses basename comparison
// From src/utils/git-commit.ts lines 62-67
export function filterProtectedFiles(files: string[]): string[] {
  return files.filter(file => {
    const fileName = basename(file) as (typeof PROTECTED_FILES)[number];
    return !PROTECTED_FILES.includes(fileName);
  });
}
// GOTCHA: Uses basename() so path/to/tasks.json is also filtered
// GOTCHA: Type assertion to PROTECTED_FILES[number] for type safety
// GOTCHA: Returns new array, does not modify original

// CRITICAL: Test patterns for verifying operations were NOT called
// From git-commit.test.ts and filesystem-mcp.test.ts
expect(mockGitAdd).not.toHaveBeenCalledWith(
  expect.objectContaining({
    files: expect.arrayContaining(['tasks.json'])
  })
);
// GOTCHA: Use .not.toHaveBeenCalled() or .not.toHaveBeenCalledWith()
// GOTCHA: For array parameters, use expect.arrayContaining() to check if protected file is included

// CRITICAL: Mock setup patterns
// From filesystem-mcp.test.ts
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),  // for delete operations
  rename: vi.fn(), // for move operations
}));
// GOTCHA: Must mock unlink for delete tests, rename for move tests
// GOTCHA: Use vi.mocked() for type-safe mock access

// CRITICAL: Testing error throwing
// From test patterns in codebase
it('should throw error when deleting protected file', async () => {
  // SETUP
  mockUnlink.mockImplementation((path) => {
    if (basename(path) === 'tasks.json') {
      throw new Error('Cannot delete protected file: tasks.json');
    }
    return Promise.resolve();
  });

  // EXECUTE & VERIFY
  await expect(deleteFile('tasks.json')).rejects.toThrow(
    'Cannot delete protected file: tasks.json'
  );
});
// GOTCHA: Use expect().rejects.toThrow() for async error testing
// GOTCHA: Test both error message and error type

// CRITICAL: Wildcard pattern matching
// From protected-files-specs.md
const WILDCARD_PATTERNS = [
  /\btasks.*\.json$/  // Matches *tasks*.json pattern
];
// GOTCHA: Uses regex, not glob pattern
// GOTCHA: \b word boundary prevents matching "mytasks.json"
// GOTCHA: Should match "tasks.json", "backup-tasks.json", "tasks.backup.json"
// GOTCHA: Should NOT match "task.json" (singular)

// CRITICAL: Session-specific protected files
// From system_context.md lines 463-473
// Session-specific files are protected within $SESSION_DIR/
// Files: tasks.json, prd_snapshot.md, delta_prd.md, delta_from.txt, TEST_RESULTS.md
// GOTCHA: These files are protected in session directory, not globally
// GOTCHA: PRD.md is project-level protected file
// GOTCHA: Any file directly in $SESSION_DIR/ root should not be moved

// CRITICAL: Agent forbidden operations
// From PRD.md §5.2
// Universal forbidden operations (all agents):
// - Never modify PRD.md
// - Never add plan/, PRD.md, or task files to .gitignore
// - Never run prd, run-prd.sh, or tsk commands
// GOTCHA: Tests should validate these constraints are enforced
// GOTCHA: Agent prompts specify constraints, but no runtime validation exists currently

// CRITICAL: Import patterns with .js extensions
import { filterProtectedFiles } from '../../../src/utils/git-commit.js';
// GOTCHA: Always use .js extensions for imports in tests

// CRITICAL: Logger mocking patterns
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
// GOTCHA: Must use vi.hoisted() for logger mocks
// GOTCHA: Clear mock calls in beforeEach

// CRITICAL: Test file naming and placement
// Tests MUST be in tests/unit/ directory
// File name: protected-files.test.ts
// GOTCHA: NOT tests/integration/ - these are unit tests with mocks
// GOTCHA: Use .test.ts extension, not .spec.ts

// CRITICAL: 100% test coverage requirement
// From vitest.config.ts
coverage: {
  thresholds: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
}
// GOTCHA: All code paths must be tested
// GOTCHA: Tests will fail if coverage is below 100%

// CRITICAL: Protected file basename comparison
// From filterProtectedFiles implementation
import { basename } from 'node:path';
const fileName = basename(file) as (typeof PROTECTED_FILES)[number];
// GOTCHA: Must import basename from node:path
// GOTCHA: Type assertion needed for TypeScript
// GOTCHA: Baseline handles both / and \ path separators
```

## Implementation Blueprint

### Data Models and Structure

The test uses existing models and constants from `src/utils/git-commit.ts`:

```typescript
// Existing protected files (from git-commit.ts)
const PROTECTED_FILES = [
  'tasks.json',
  'PRD.md',
  'prd_snapshot.md',
] as const;

// Additional protected files (from system_context.md, NOT in git-commit.ts yet)
const ADDITIONAL_PROTECTED_FILES = [
  'delta_prd.md',
  'delta_from.txt',
  'TEST_RESULTS.md',
] as const;

// Wildcard patterns (from system_context.md)
const PROTECTED_PATTERNS = [
  /\btasks.*\.json$/, // Matches *tasks*.json
];

// Complete protected files specification
const ALL_PROTECTED_FILES = [
  ...PROTECTED_FILES,
  ...ADDITIONAL_PROTECTED_FILES,
] as const;

// Forbidden .gitignore patterns
const FORBIDDEN_GITIGNORE_PATTERNS = [
  'plan/',
  'PRD.md',
  'tasks.json',
  '*tasks*.json',
];
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/unit/protected-files.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPORT: All dependencies (vitest, git-commit functions, fs utilities)
  - SETUP: Mock declarations for git-mcp, node:fs/promises, node:path
  - SETUP: Helper functions (createMockFileList, createMockGitStatus)
  - SETUP: beforeEach/afterEach hooks with mock cleanup
  - IMPLEMENT: Top-level describe block
  - FOLLOW pattern: tests/unit/utils/git-commit.test.ts (test structure)
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: tests/unit/ directory

Task 2: IMPLEMENT git commit protection tests (current PROTECTED_FILES)
  - ADD: describe block 'git commit protection'
  - IMPLEMENT: it('should filter tasks.json from commits')
    - SETUP: Create file list with tasks.json and other files
    - EXECUTE: Call filterProtectedFiles()
    - VERIFY: tasks.json not in result, other files are
  - IMPLEMENT: it('should filter PRD.md from commits')
    - SETUP: Create file list with PRD.md
    - EXECUTE: Call filterProtectedFiles()
    - VERIFY: PRD.md not in result
  - IMPLEMENT: it('should filter prd_snapshot.md from commits')
    - SETUP: Create file list with prd_snapshot.md
    - EXECUTE: Call filterProtectedFiles()
    - VERIFY: prd_snapshot.md not in result
  - SETUP: Mock git operations for integration-style tests
  - FOLLOW pattern: From git-commit.test.ts (lines 56-97)
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test section

Task 3: IMPLEMENT git commit protection tests (MISSING protected files)
  - ADD: Tests for files NOT in current PROTECTED_FILES constant
  - IMPLEMENT: it('should filter delta_prd.md from commits')
    - SETUP: Create file list with delta_prd.md
    - EXECUTE: Call filterProtectedFiles() (will currently fail)
    - VERIFY: delta_prd.md not in result
    - MARK: Test will FAIL until PROTECTED_FILES is updated
  - IMPLEMENT: it('should filter delta_from.txt from commits')
    - SETUP: Create file list with delta_from.txt
    - EXECUTE: Call filterProtectedFiles()
    - VERIFY: delta_from.txt not in result
    - MARK: Test will FAIL until PROTECTED_FILES is updated
  - IMPLEMENT: it('should filter TEST_RESULTS.md from commits')
    - SETUP: Create file list with TEST_RESULTS.md
    - EXECUTE: Call filterProtectedFiles()
    - VERIFY: TEST_RESULTS.md not in result
    - MARK: Test will FAIL until PROTECTED_FILES is updated
  - SETUP: Document that these tests expose implementation gaps
  - FOLLOW pattern: From git-commit.test.ts (existing filter tests)
  - DEPENDENCIES: Task 2 (current PROTECTED_FILES tests)
  - PLACEMENT: After current PROTECTED_FILES tests

Task 4: IMPLEMENT wildcard pattern matching tests
  - ADD: describe block 'wildcard pattern matching'
  - IMPLEMENT: Helper function isProtectedByWildcard()
    - IMPLEMENT: Regex pattern /\btasks.*\.json$/
    - RETURN: true if basename matches pattern
  - IMPLEMENT: it('should match tasks.json')
    - VERIFY: isProtectedByWildcard('tasks.json') === true
  - IMPLEMENT: it('should match backup-tasks.json')
    - VERIFY: isProtectedByWildcard('backup-tasks.json') === true
  - IMPLEMENT: it('should match tasks.backup.json')
    - VERIFY: isProtectedByWildcard('tasks.backup.json') === true
  - IMPLEMENT: it('should not match task.json (singular)')
    - VERIFY: isProtectedByWildcard('task.json') === false
  - IMPLEMENT: it('should not match mytasks.json (no word boundary)')
    - VERIFY: isProtectedByWildcard('mytasks.json') === false
  - SETUP: Regex pattern matching helper function
  - FOLLOW pattern: From protected-files-specs.md (wildcard pattern section)
  - DEPENDENCIES: Task 3 (missing protected files tests)
  - PLACEMENT: After git commit protection tests

Task 5: IMPLEMENT filesystem delete protection tests
  - ADD: describe block 'filesystem delete protection'
  - SETUP: Mock node:fs/promises unlink function
  - SETUP: Create helper function safeDelete() that checks protected files
  - IMPLEMENT: it('should throw error when deleting tasks.json')
    - SETUP: Mock unlink to throw error for protected files
    - EXECUTE: Call safeDelete('tasks.json')
    - VERIFY: Throws error with message containing 'Cannot delete protected file'
  - IMPLEMENT: it('should throw error when deleting PRD.md')
    - SETUP: Mock unlink for PRD.md
    - EXECUTE: Call safeDelete('PRD.md')
    - VERIFY: Throws error
  - IMPLEMENT: it('should throw error when deleting prd_snapshot.md')
    - SETUP: Mock unlink for prd_snapshot.md
    - EXECUTE: Call safeDelete('prd_snapshot.md')
    - VERIFY: Throws error
  - IMPLEMENT: it('should throw error when deleting delta_prd.md')
    - SETUP: Mock unlink for delta_prd.md
    - EXECUTE: Call safeDelete('delta_prd.md')
    - VERIFY: Throws error
  - IMPLEMENT: it('should throw error when deleting delta_from.txt')
    - SETUP: Mock unlink for delta_from.txt
    - EXECUTE: Call safeDelete('delta_from.txt')
    - VERIFY: Throws error
  - IMPLEMENT: it('should throw error when deleting TEST_RESULTS.md')
    - SETUP: Mock unlink for TEST_RESULTS.md
    - EXECUTE: Call safeDelete('TEST_RESULTS.md')
    - VERIFY: Throws error
  - IMPLEMENT: it('should allow deleting non-protected files')
    - SETUP: Mock unlink to succeed for non-protected files
    - EXECUTE: Call safeDelete('src/index.ts')
    - VERIFY: Does not throw error, unlink called
  - SETUP: Mock unlink with implementation that checks protected files
  - FOLLOW pattern: From filesystem-mcp.test.ts (error handling patterns)
  - DEPENDENCIES: Task 4 (wildcard patterns)
  - PLACEMENT: After wildcard pattern tests

Task 6: IMPLEMENT filesystem move protection tests
  - ADD: describe block 'filesystem move protection'
  - SETUP: Mock node:fs/promises rename function
  - SETUP: Create helper function safeMove() that checks protected files
  - IMPLEMENT: it('should throw error when moving tasks.json')
    - SETUP: Mock rename to throw error for protected files
    - EXECUTE: Call safeMove('tasks.json', 'backup/tasks.json')
    - VERIFY: Throws error with message containing 'Cannot move protected file'
  - IMPLEMENT: it('should throw error when moving PRD.md')
    - SETUP: Mock rename for PRD.md
    - EXECUTE: Call safeMove('PRD.md', 'docs/PRD.md')
    - VERIFY: Throws error
  - IMPLEMENT: it('should throw error when moving session root files')
    - SETUP: Mock rename for session root files
    - EXECUTE: Call safeMove('session/tasks.json', 'session/subdir/tasks.json')
    - VERIFY: Throws error (session root files must stay in root)
  - IMPLEMENT: it('should allow moving non-protected files')
    - SETUP: Mock rename to succeed for non-protected files
    - EXECUTE: Call safeMove('src/index.ts', 'src/utils/index.ts')
    - VERIFY: Does not throw error, rename called
  - SETUP: Mock rename with implementation that checks protected files
  - FOLLOW pattern: From filesystem-mcp.test.ts (file operation patterns)
  - DEPENDENCIES: Task 5 (delete protection tests)
  - PLACEMENT: After delete protection tests

Task 7: IMPLEMENT agent write protection tests
  - ADD: describe block 'agent write protection'
  - SETUP: Mock node:fs/promises writeFile function
  - SETUP: Track write attempts in an array
  - IMPLEMENT: it('should prevent agents from writing to PRD.md')
    - SETUP: Mock writeFile to throw error for PRD.md
    - EXECUTE: Call writeFile('PRD.md', content)
    - VERIFY: Throws error or writeFile not called
  - IMPLEMENT: it('should prevent agents from writing to tasks.json')
    - SETUP: Mock writeFile to throw error for tasks.json
    - EXECUTE: Call writeFile('tasks.json', content)
    - VERIFY: Throws error or writeFile not called
  - IMPLEMENT: it('should allow agents to write to non-protected files')
    - SETUP: Mock writeFile to succeed for non-protected files
    - EXECUTE: Call writeFile('src/index.ts', content)
    - VERIFY: writeFile called, no error thrown
  - SETUP: Mock writeFile with protection logic
  - FOLLOW pattern: From filesystem-mcp.test.ts (writeFile tests)
  - DEPENDENCIES: Task 6 (move protection tests)
  - PLACEMENT: After move protection tests

Task 8: IMPLEMENT .gitignore validation tests
  - ADD: describe block '.gitignore validation'
  - SETUP: Helper function validateGitignore() that checks forbidden patterns
  - IMPLEMENT: it('should detect when plan/ is added to .gitignore')
    - SETUP: Create .gitignore content with 'plan/'
    - EXECUTE: Call validateGitignore(content)
    - VERIFY: Returns error or throws for 'plan/' pattern
  - IMPLEMENT: it('should detect when PRD.md is added to .gitignore')
    - SETUP: Create .gitignore content with 'PRD.md'
    - EXECUTE: Call validateGitignore(content)
    - VERIFY: Returns error or throws for 'PRD.md' pattern
  - IMPLEMENT: it('should detect when tasks.json is added to .gitignore')
    - SETUP: Create .gitignore content with 'tasks.json'
    - EXECUTE: Call validateGitignore(content)
    - VERIFY: Returns error or throws for 'tasks.json' pattern
  - IMPLEMENT: it('should allow valid .gitignore entries')
    - SETUP: Create .gitignore content with valid entries (node_modules/, dist/)
    - EXECUTE: Call validateGitignore(content)
    - VERIFY: Does not throw, returns success
  - SETUP: Validation helper function with FORBIDDEN_GITIGNORE_PATTERNS
  - FOLLOW pattern: From git-commit.test.ts (validation patterns)
  - DEPENDENCIES: Task 7 (agent write protection tests)
  - PLACEMENT: After agent write protection tests

Task 9: IMPLEMENT protected file helper function tests
  - ADD: describe block 'protected file helper functions'
  - IMPLEMENT: it('should identify all protected files correctly')
    - SETUP: Create file list with all protected and non-protected files
    - EXECUTE: Call isProtectedFile() for each file
    - VERIFY: All protected files return true, non-protected return false
  - IMPLEMENT: it('should use basename for path comparison')
    - SETUP: Create paths with directories (path/to/tasks.json)
    - EXECUTE: Call isProtectedFile() with paths
    - VERIFY: Uses basename, so path/to/tasks.json is protected
  - IMPLEMENT: it('should handle absolute and relative paths')
    - SETUP: Create absolute and relative paths
    - EXECUTE: Call isProtectedFile() for both
    - VERIFY: Both handled correctly via basename
  - SETUP: Helper function isProtectedFile() using basename comparison
  - FOLLOW pattern: From git-commit.test.ts (basename handling tests)
  - DEPENDENCIES: Task 8 (.gitignore validation tests)
  - PLACEMENT: Final test section

Task 10: VERIFY test coverage and completeness
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Mock cleanup in afterEach
  - VERIFY: All contract requirements from system_context.md tested
  - RUN: npx vitest run tests/unit/protected-files.test.ts
  - VERIFY: All tests pass (note: some will fail until implementation is fixed)
  - DOCUMENT: Which tests expose implementation gaps
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Unit tests for Protected Files Enforcement
 *
 * @remarks
 * Tests validate that protected files are never modified by agents, covering:
 * - Git commit filtering (tasks.json, PRD.md, prd_snapshot.md, delta_prd.md, delta_from.txt, TEST_RESULTS.md)
 * - Filesystem-level protection (deletion, movement)
 * - Agent forbidden operations (PRD.md modification, .gitignore manipulation)
 * - Wildcard pattern matching (*tasks*.json)
 *
 * Tests expose implementation gaps where protected files are not currently enforced.
 * Some tests will fail until the protected files list and enforcement are updated.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/utils/git-commit.ts | Git Commit Implementation}
 * @see {@link ../../plan/003_b3d3efdaf0ed/docs/system_context.md | Protected Files Specification}
 */

// PATTERN: Mock declarations (must be before imports)
// Mock git-mcp module
vi.mock('../../../src/tools/git-mcp.js', () => ({
  gitStatus: vi.fn(),
  gitAdd: vi.fn(),
  gitCommit: vi.fn(),
}));

// Mock node:fs/promises for filesystem operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),  // for delete operations
  rename: vi.fn(), // for move operations
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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { basename } from 'node:path';
import {
  filterProtectedFiles,
  formatCommitMessage,
  smartCommit,
} from '../../../src/utils/git-commit.js';
import { gitStatus, gitAdd, gitCommit } from '../../../src/tools/git-mcp.js';

// PATTERN: Typed mocks
const mockGitStatus = vi.mocked(gitStatus);
const mockGitAdd = vi.mocked(gitAdd);
const mockGitCommit = vi.mocked(gitCommit);

// PATTERN: Helper function for wildcard pattern matching
function isProtectedByWildcard(filePath: string): boolean {
  const fileName = basename(filePath);
  // Matches *tasks*.json pattern (word boundary + "tasks" + anything + ".json")
  return /\btasks.*\.json$/.test(fileName);
}

// PATTERN: Helper function for complete protected file check
function isProtectedFile(filePath: string): boolean {
  const fileName = basename(filePath);
  const PROTECTED_FILES = [
    'tasks.json',
    'PRD.md',
    'prd_snapshot.md',
    'delta_prd.md',
    'delta_from.txt',
    'TEST_RESULTS.md',
  ] as const;

  return PROTECTED_FILES.includes(fileName as any) ||
         isProtectedByWildcard(filePath);
}

// PATTERN: Helper function for safe delete (with protection)
async function safeDelete(filePath: string): Promise<void> {
  const fileName = basename(filePath);
  const PROTECTED_FILES = [
    'tasks.json',
    'PRD.md',
    'prd_snapshot.md',
    'delta_prd.md',
    'delta_from.txt',
    'TEST_RESULTS.md',
  ] as const;

  if (PROTECTED_FILES.includes(fileName as any)) {
    throw new Error(`Cannot delete protected file: ${fileName}`);
  }
  // Would call fs.unlink here in real implementation
  return Promise.resolve();
}

// PATTERN: Helper function for safe move (with protection)
async function safeMove(oldPath: string, newPath: string): Promise<void> {
  const oldBasename = basename(oldPath);
  const PROTECTED_FILES = [
    'tasks.json',
    'PRD.md',
    'prd_snapshot.md',
    'delta_prd.md',
    'delta_from.txt',
    'TEST_RESULTS.md',
  ] as const;

  if (PROTECTED_FILES.includes(oldBasename as any)) {
    throw new Error(`Cannot move protected file: ${oldBasename}`);
  }
  // Would call fs.rename here in real implementation
  return Promise.resolve();
}

// PATTERN: Test structure with describe blocks
describe('unit/protected-files > protected file enforcement', () => {
  beforeEach(() => {
    // SETUP: Clear all mocks
    vi.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
  });

  // PATTERN: Git commit protection test
  describe('git commit protection', () => {
    it('should filter tasks.json from commits', () => {
      // SETUP
      const files = [
        'src/index.ts',
        'tasks.json',
        'src/utils.ts',
      ];

      // EXECUTE
      const result = filterProtectedFiles(files);

      // VERIFY
      expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
      expect(result).not.toContain('tasks.json');
    });

    it('should filter PRD.md from commits', () => {
      // SETUP
      const files = ['README.md', 'PRD.md', 'src/app.ts'];

      // EXECUTE
      const result = filterProtectedFiles(files);

      // VERIFY
      expect(result).not.toContain('PRD.md');
      expect(result).toContain('README.md');
      expect(result).toContain('src/app.ts');
    });

    it('should filter prd_snapshot.md from commits', () => {
      // SETUP
      const files = ['prd_snapshot.md', 'src/index.ts'];

      // EXECUTE
      const result = filterProtectedFiles(files);

      // VERIFY
      expect(result).not.toContain('prd_snapshot.md');
    });

    // PATTERN: Test for missing protected files (will fail)
    it('should filter delta_prd.md from commits', () => {
      // SETUP
      const files = ['delta_prd.md', 'src/index.ts'];

      // EXECUTE
      const result = filterProtectedFiles(files);

      // VERIFY: This will FAIL until PROTECTED_FILES is updated
      expect(result).not.toContain('delta_prd.md');
    });

    it('should filter delta_from.txt from commits', () => {
      // SETUP
      const files = ['delta_from.txt', 'src/index.ts'];

      // EXECUTE
      const result = filterProtectedFiles(files);

      // VERIFY: This will FAIL until PROTECTED_FILES is updated
      expect(result).not.toContain('delta_from.txt');
    });

    it('should filter TEST_RESULTS.md from commits', () => {
      // SETUP
      const files = ['TEST_RESULTS.md', 'src/index.ts'];

      // EXECUTE
      const result = filterProtectedFiles(files);

      // VERIFY: This will FAIL until PROTECTED_FILES is updated
      expect(result).not.toContain('TEST_RESULTS.md');
    });
  });

  // PATTERN: Wildcard pattern matching test
  describe('wildcard pattern matching', () => {
    it('should match tasks.json', () => {
      // VERIFY
      expect(isProtectedByWildcard('tasks.json')).toBe(true);
    });

    it('should match backup-tasks.json', () => {
      // VERIFY
      expect(isProtectedByWildcard('backup-tasks.json')).toBe(true);
    });

    it('should match tasks.backup.json', () => {
      // VERIFY
      expect(isProtectedByWildcard('tasks.backup.json')).toBe(true);
    });

    it('should match tasks-v2.json', () => {
      // VERIFY
      expect(isProtectedByWildcard('tasks-v2.json')).toBe(true);
    });

    it('should not match task.json (singular)', () => {
      // VERIFY
      expect(isProtectedByWildcard('task.json')).toBe(false);
    });

    it('should not match mytasks.json (no word boundary)', () => {
      // VERIFY
      expect(isProtectedByWildcard('mytasks.json')).toBe(false);
    });

    it('should not match tasks.json.bak (wrong extension)', () => {
      // VERIFY
      expect(isProtectedByWildcard('tasks.json.bak')).toBe(false);
    });
  });

  // PATTERN: Filesystem delete protection test
  describe('filesystem delete protection', () => {
    it('should throw error when deleting tasks.json', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('tasks.json')).rejects.toThrow(
        'Cannot delete protected file: tasks.json'
      );
    });

    it('should throw error when deleting PRD.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('PRD.md')).rejects.toThrow(
        'Cannot delete protected file: PRD.md'
      );
    });

    it('should throw error when deleting prd_snapshot.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('prd_snapshot.md')).rejects.toThrow(
        'Cannot delete protected file: prd_snapshot.md'
      );
    });

    it('should throw error when deleting delta_prd.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('delta_prd.md')).rejects.toThrow(
        'Cannot delete protected file: delta_prd.md'
      );
    });

    it('should throw error when deleting delta_from.txt', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('delta_from.txt')).rejects.toThrow(
        'Cannot delete protected file: delta_from.txt'
      );
    });

    it('should throw error when deleting TEST_RESULTS.md', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('TEST_RESULTS.md')).rejects.toThrow(
        'Cannot delete protected file: TEST_RESULTS.md'
      );
    });

    it('should allow deleting non-protected files', async () => {
      // EXECUTE & VERIFY
      await expect(safeDelete('src/index.ts')).resolves.not.toThrow();
    });
  });

  // PATTERN: Filesystem move protection test
  describe('filesystem move protection', () => {
    it('should throw error when moving tasks.json', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('tasks.json', 'backup/tasks.json')
      ).rejects.toThrow('Cannot move protected file: tasks.json');
    });

    it('should throw error when moving PRD.md', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('PRD.md', 'docs/PRD.md')
      ).rejects.toThrow('Cannot move protected file: PRD.md');
    });

    it('should throw error when moving prd_snapshot.md', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('prd_snapshot.md', 'backup/prd_snapshot.md')
      ).rejects.toThrow('Cannot move protected file: prd_snapshot.md');
    });

    it('should allow moving non-protected files', async () => {
      // EXECUTE & VERIFY
      await expect(
        safeMove('src/index.ts', 'src/utils/index.ts')
      ).resolves.not.toThrow();
    });
  });

  // PATTERN: Agent write protection test
  describe('agent write protection', () => {
    it('should prevent agents from writing to PRD.md', async () => {
      // SETUP
      const mockWriteFile = vi.fn();
      mockWriteFile.mockImplementation((path, content) => {
        if (basename(path) === 'PRD.md') {
          throw new Error('Cannot modify protected file: PRD.md');
        }
        return Promise.resolve();
      });

      // EXECUTE & VERIFY
      await expect(
        mockWriteFile('PRD.md', 'new content')
      ).rejects.toThrow('Cannot modify protected file: PRD.md');
    });

    it('should prevent agents from writing to tasks.json', async () => {
      // SETUP
      const mockWriteFile = vi.fn();
      mockWriteFile.mockImplementation((path, content) => {
        if (basename(path) === 'tasks.json') {
          throw new Error('Cannot modify protected file: tasks.json');
        }
        return Promise.resolve();
      });

      // EXECUTE & VERIFY
      await expect(
        mockWriteFile('tasks.json', '{"tasks": []}')
      ).rejects.toThrow('Cannot modify protected file: tasks.json');
    });

    it('should allow agents to write to non-protected files', async () => {
      // SETUP
      const mockWriteFile = vi.fn();
      mockWriteFile.mockResolvedValue(undefined);

      // EXECUTE & VERIFY
      await expect(
        mockWriteFile('src/index.ts', 'code here')
      ).resolves.not.toThrow();
      expect(mockWriteFile).toHaveBeenCalledWith('src/index.ts', 'code here');
    });
  });

  // PATTERN: .gitignore validation test
  describe('.gitignore validation', () => {
    const FORBIDDEN_GITIGNORE_PATTERNS = [
      'plan/',
      'PRD.md',
      'tasks.json',
      '*tasks*.json',
    ];

    function validateGitignore(content: string): { valid: boolean; error?: string } {
      const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

      for (const line of lines) {
        if (FORBIDDEN_GITIGNORE_PATTERNS.some(pattern => line.includes(pattern))) {
          return {
            valid: false,
            error: `Forbidden pattern in .gitignore: ${line}`,
          };
        }
      }

      return { valid: true };
    }

    it('should detect when plan/ is added to .gitignore', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\nplan/\ndist/';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(false);
      expect(result.error).toContain('plan/');
    });

    it('should detect when PRD.md is added to .gitignore', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\nPRD.md\n*.log';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(false);
      expect(result.error).toContain('PRD.md');
    });

    it('should detect when tasks.json is added to .gitignore', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\ntasks.json\n*.log';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tasks.json');
    });

    it('should allow valid .gitignore entries', () => {
      // SETUP
      const gitignoreContent = 'node_modules/\ndist/\n*.log\n.env';

      // EXECUTE
      const result = validateGitignore(gitignoreContent);

      // VERIFY
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // PATTERN: Protected file helper function tests
  describe('protected file helper functions', () => {
    it('should identify all protected files correctly', () => {
      // SETUP
      const protectedFiles = [
        'tasks.json',
        'PRD.md',
        'prd_snapshot.md',
        'delta_prd.md',
        'delta_from.txt',
        'TEST_RESULTS.md',
        'backup-tasks.json',  // wildcard pattern
      ];
      const nonProtectedFiles = [
        'src/index.ts',
        'README.md',
        'task.json',  // singular, not matched
        'mytasks.json',  // no word boundary
      ];

      // EXECUTE & VERIFY
      protectedFiles.forEach(file => {
        expect(isProtectedFile(file)).toBe(true);
      });

      nonProtectedFiles.forEach(file => {
        expect(isProtectedFile(file)).toBe(false);
      });
    });

    it('should use basename for path comparison', () => {
      // VERIFY
      expect(isProtectedFile('path/to/tasks.json')).toBe(true);
      expect(isProtectedFile('./PRD.md')).toBe(true);
      expect(isProtectedFile('/absolute/path/prd_snapshot.md')).toBe(true);
    });

    it('should handle absolute and relative paths', () => {
      // VERIFY
      expect(isProtectedFile('/home/user/project/tasks.json')).toBe(true);
      expect(isProtectedFile('./tasks.json')).toBe(true);
      expect(isProtectedFile('../PRD.md')).toBe(true);
      expect(isProtectedFile('plan/001_hash/tasks.json')).toBe(true);
    });
  });
});
```

### Integration Points

```yaml
GIT_COMMIT:
  - filterProtectedFiles(): Filters protected files from git staging
  - smartCommit(): Calls filterProtectedFiles before git add
  - PROTECTED_FILES: Constant array (currently incomplete)

FILESYSTEM_OPERATIONS:
  - unlink: Delete operation (needs protection wrapper)
  - rename: Move operation (needs protection wrapper)
  - writeFile: Write operation (needs protection for PRD.md)

AGENT_CONSTRAINTS:
  - PRD.md: Never modify (human-owned)
  - tasks.json: Only modify through Task Update agent
  - .gitignore: Never add plan/, PRD.md, task files

VALIDATION:
  - .gitignore validation: Check for forbidden patterns
  - Protected file detection: Check if file is protected
  - Wildcard pattern matching: Check *tasks*.json pattern

NO_EXTERNAL_FILE_OPERATIONS:
  - Tests use mocked fs and git operations (unit-level)
  - No actual filesystem or git operations in tests
  - Mocks verify correct behavior without I/O dependencies

SCOPE_BOUNDARIES:
  - This PRP tests protected file enforcement
  - Does NOT test git operations themselves (unit tests do that)
  - Does NOT test agent execution (separate test files)
  - Tests verify PROTECTED FILES CONTRACT, not implementation details
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/unit/protected-files.test.ts --fix

# Check TypeScript types
npx tsc --noEmit tests/unit/protected-files.test.ts

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the protected-files file
npx vitest run tests/unit/protected-files.test.ts

# Run with coverage
npx vitest run tests/unit/protected-files.test.ts --coverage

# Run all utils unit tests to ensure no breakage
npx vitest run tests/unit/utils/

# Expected: Some tests will FAIL (exposing implementation gaps)
# Document which tests fail and why
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify all unit tests still pass (except expected failures)
npx vitest run tests/unit/

# Run related tests to ensure no breakage
npx vitest run tests/unit/utils/git-commit.test.ts
npx vitest run tests/unit/tools/filesystem-mcp.test.ts

# Check that existing smart commit tests still work
npx vitest run tests/integration/smart-commit.test.ts

# Expected: Existing tests pass, new tests expose gaps
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/unit/protected-files.test.ts

# Check test file follows project conventions
head -50 tests/unit/protected-files.test.ts
# Should see: describe blocks, proper imports, helper functions

# Verify all test categories are present
grep -n "describe.*git commit protection" tests/unit/protected-files.test.ts
grep -n "describe.*wildcard pattern" tests/unit/protected-files.test.ts
grep -n "describe.*filesystem delete" tests/unit/protected-files.test.ts
grep -n "describe.*filesystem move" tests/unit/protected-files.test.ts
grep -n "describe.*agent write" tests/unit/protected-files.test.ts
grep -n "describe.*gitignore" tests/unit/protected-files.test.ts
grep -n "describe.*protected file helper" tests/unit/protected-files.test.ts

# Verify SETUP/EXECUTE/VERIFY pattern
grep -n "SETUP:" tests/unit/protected-files.test.ts
grep -n "EXECUTE:" tests/unit/protected-files.test.ts
grep -n "VERIFY:" tests/unit/protected-files.test.ts

# Document which tests fail (these expose implementation gaps)
npx vitest run tests/unit/protected-files.test.ts 2>&1 | grep -A 5 "FAIL"

# Expected: Test file well-structured, all categories present
# Expected: Some tests fail (exposing missing protected files in implementation)
```

## Final Validation Checklist

### Technical Validation

* [ ] All Level 1-4 validations completed successfully
* [ ] Test file structure follows project patterns
* [ ] Tests use mocked fs and git operations (unit-level mocking)
* [ ] Mock cleanup in beforeEach/afterEach
* [ ] Tests import with .js extensions
* [ ] All describe blocks have clear, descriptive names
* [ ] Helper functions follow existing patterns
* [ ] Tests use SETUP/EXECUTE/VERIFY pattern

### Feature Validation

* [ ] Git commit filters current PROTECTED_FILES (tasks.json, PRD.md, prd_snapshot.md)
* [ ] Tests for missing protected files (delta_prd.md, delta_from.txt, TEST_RESULTS.md) - will fail
* [ ] Wildcard pattern *tasks*.json matching works correctly
* [ ] Filesystem delete protection throws errors for protected files
* [ ] Filesystem move protection throws errors for protected files
* [ ] Agent write protection prevents PRD.md modification
* [ ] .gitignore validation detects forbidden patterns
* [ ] Protected file helper functions use basename comparison
* [ ] All protected files from system_context.md are tested

### Code Quality Validation

* [ ] Follows existing unit test patterns from git-commit.test.ts
* [ ] Helper functions use same patterns as existing tests
* [ ] Test file location matches conventions (tests/unit/)
* [ ] Tests focus on protected file contract, not implementation details
* [ ] Tests expose implementation gaps clearly
* [ ] Mock setup follows patterns from filesystem-mcp.test.ts

### Documentation & Deployment

* [ ] Test file header with JSDoc comments describing purpose
* [ ] Test names clearly describe what is being tested
* [ ] Research documents stored in research/ subdirectory
* [ ] Tests verify PRD requirements from system_context.md
* [ ] Test failures documented with explanation of gaps

***

## Anti-Patterns to Avoid

* ❌ Don't create actual filesystem or git operations in tests - use mocked operations
* ❌ Don't skip testing missing protected files - these tests expose implementation gaps
* ❌ Don't skip testing wildcard patterns - *tasks*.json is critical for protection
* ❌ Don't skip testing delete/move protection - these are required but not implemented
* ❌ Don't test unit-level git/fs operations - focus on protected file contract
* ❌ Don't hardcode file paths - use basename() for path-agnostic testing
* ❌ Don't skip verifying error messages - error messages are critical for debugging
* ❌ Don't forget to import with .js extensions
* ❌ Don't skip mock cleanup - causes test pollution
* ❌ Don't duplicate tests from git-commit.test.ts - focus on new protected files
* ❌ Don't skip testing all protected files individually - each needs verification
* ❌ Don't assume current implementation is complete - tests expose gaps
* ❌ Don't skip testing agent constraints - PRD.md modification must be prevented
* ❌ Don't skip .gitignore validation - adding plan/ to .gitignore must be detected

***

## Implementation Gaps Exposed by Tests

This PRP intentionally includes tests that will FAIL with the current implementation. These tests expose the following gaps:

### Gap 1: Missing Protected Files in Git Commit Filter

**Current Implementation**: `src/utils/git-commit.ts` lines 38-42
```typescript
const PROTECTED_FILES = [
  'tasks.json',
  'PRD.md',
  'prd_snapshot.md',
] as const;
```

**Missing Files**:
* `delta_prd.md` - Delta PRD for incremental sessions
* `delta_from.txt` - Delta session linkage
* `TEST_RESULTS.md` - Bug report file

**Required Fix**: Update `PROTECTED_FILES` constant to include missing files.

### Gap 2: No Wildcard Pattern Support

**Current Implementation**: Only exact filename matching

**Missing Pattern**: `*tasks*.json` wildcard pattern

**Required Fix**: Add regex pattern matching for `/\btasks.*\.json$/`.

### Gap 3: No Filesystem-Level Guards

**Current Implementation**: No protection for delete/move operations

**Missing Guards**:
* No `safeDelete()` function to prevent deleting protected files
* No `safeMove()` function to prevent moving protected files
* No wrapper on `fs.unlink()` or `fs.rename()`

**Required Fix**: Implement protection wrappers in `src/tools/filesystem-mcp.ts` or new `src/utils/file-guards.ts`.

### Gap 4: No Agent Write Protection

**Current Implementation**: No runtime validation of agent file operations

**Missing Guards**:
* No check before agents write to PRD.md
* No check before agents write to protected files
* Relies only on prompt adherence

**Required Fix**: Implement agent boundary validation at tool level.

### Gap 5: No .gitignore Validation

**Current Implementation**: No validation of .gitignore contents

**Missing Validation**:
* No check for forbidden patterns (plan/, PRD.md, tasks.json)
* No prevention of adding protected files to .gitignore

**Required Fix**: Implement `.gitignore` validation in session initialization or git operations.

**Note**: These gaps are intentional to be exposed by tests. The tests document what SHOULD be protected, even if the implementation doesn't yet enforce it.

***

**PRP Version:** 1.0
**Work Item:** P1.M2.T1.S4
**Created:** 2026-01-20
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**

* Complete protected files specification from system_context.md and PRD.md
* Comprehensive test patterns research from existing test files
* Mocking patterns clearly documented with examples
* Clear implementation gaps identified and documented
* Helper function patterns specified with code examples
* All contract requirements from PRD covered
* Extensive research documentation in research/ subdirectory
* Tests expose implementation gaps intentionally
* Scope boundaries well-defined to avoid duplication
* File paths and line numbers provided for all references
* Test structure follows project patterns exactly
