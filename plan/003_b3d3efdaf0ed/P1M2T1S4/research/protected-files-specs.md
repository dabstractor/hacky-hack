# Protected Files Specification Research

## Executive Summary

This document consolidates the protected files specifications from both `system_context.md` and `PRD.md §5.1`, along with analysis of existing enforcement mechanisms in the codebase. These specifications define critical files that must never be deleted, moved, or committed by the pipeline to ensure proper state management and system integrity.

---

## Sources

1. **system_context.md** (Lines 463-473)
   - Path: `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/system_context.md`
   - Section: "Protected Files" and "Forbidden Operations"

2. **PRD.md** (Lines 104-122, 133-151)
   - Path: `/home/dustin/projects/hacky-hack/PRD.md`
   - Section: "§5.1 State & File Management"

3. **Implementation Code**
   - `/home/dustin/projects/hacky-hack/src/utils/git-commit.ts` (Lines 38-42)
   - `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts`
   - `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts`

---

## Complete Protected Files List

### Session-Specific Protected Files

These files are protected within `$SESSION_DIR/` (the session directory):

| File Pattern                         | Purpose                            | Rationale                                            |
| ------------------------------------ | ---------------------------------- | ---------------------------------------------------- |
| `$SESSION_DIR/tasks.json`            | Pipeline task registry state       | Single source of truth for task hierarchy and status |
| `$SESSION_DIR/prd_snapshot.md`       | PRD snapshot for session           | Enables delta detection for PRD changes              |
| `$SESSION_DIR/delta_prd.md`          | Delta PRD for incremental sessions | Contains focused changes for delta sessions          |
| `$SESSION_DIR/delta_from.txt`        | Delta session linkage              | Links delta session to parent session                |
| `$SESSION_DIR/TEST_RESULTS.md`       | Bug report file                    | QA output for bug hunting workflow                   |
| `Any file directly in $SESSION_DIR/` | Session root files                 | Never move to subdirectories                         |

### Project-Level Protected Files

| File Pattern | Purpose                       | Rationale                                            |
| ------------ | ----------------------------- | ---------------------------------------------------- |
| `PRD.md`     | Product requirements document | Human-owned document, must not be modified by agents |

### Wildcard Pattern Protected Files

| Pattern        | Matches                                   | Rationale                                                   |
| -------------- | ----------------------------------------- | ----------------------------------------------------------- |
| `*tasks*.json` | Any file with "tasks" and ".json" in name | Prevents accidental modification of any task registry files |

---

## Forbidden Operations (All Agents)

### Universal Forbidden Operations

From `PRD.md §5.2` and `system_context.md` (Lines 475-481):

1. **Never modify `PRD.md`** (human-owned document)
2. **Never add `plan/`, `PRD.md`, or task files to `.gitignore`**
3. **Never run `prd`, `run-prd.sh`, or `tsk` commands** (prevents recursive execution)
4. **Never create session-pattern directories (`[0-9]*_*`) outside designated locations**

### Agent-Specific Forbidden Operations

From `PRD.md §5.2` (Lines 137-145):

| Agent Type         | Allowed Output Scope                  | Forbidden Operations                           |
| ------------------ | ------------------------------------- | ---------------------------------------------- |
| **Task Breakdown** | `tasks.json`, `architecture/`         | PRD.md, source code, .gitignore                |
| **Research (PRP)** | `PRP.md`, `research/`                 | tasks.json, source code, prd_snapshot.md       |
| **Implementation** | `src/`, `tests/`, `lib/`              | plan/, PRD.md, tasks.json, pipeline scripts    |
| **Cleanup**        | `docs/` organization                  | plan/, PRD.md, tasks.json, session directories |
| **Task Update**    | `tasks.json` modifications            | PRD.md, source code, prd_snapshot.md           |
| **Validation**     | `validate.sh`, `validation_report.md` | plan/, source code, tasks.json                 |
| **Bug Hunter**     | `TEST_RESULTS.md` (if bugs found)     | plan/, source code, tasks.json                 |

---

## Existing Enforcement Mechanisms

### 1. Git Commit Protection

**File**: `/home/dustin/projects/hacky-hack/src/utils/git-commit.ts` (Lines 38-42)

```typescript
const PROTECTED_FILES = [
  'tasks.json', // Pipeline task registry
  'PRD.md', // Original PRD document
  'prd_snapshot.md', // PRD snapshot for delta detection
] as const;
```

**Implementation**:

- `filterProtectedFiles()` function (Lines 62-67)
- Filters protected files from git staging operations
- Uses basename comparison for path-agnostic matching
- Called by `smartCommit()` to prevent protected files from being committed

**Rationale**:

- These files contain pipeline state and must remain uncommitted
- Enables clean pipeline resumption and state management
- Prevents git history pollution with frequently-changing state files

**Test Coverage**:

- Unit tests: `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts`
- Integration tests: `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts`

### 2. Agent Prompt Constraints

**File**: `/home/dustin/projects/hacky-hack/src/agents/prompts.ts` (Line 98)

The Architect Agent prompt includes explicit constraints:

```
**CONSTRAINT:** You MUST write the JSON to the file `./$TASKS_FILE` (in the CURRENT WORKING DIRECTORY - do NOT search for or use any other tasks.json files from other projects/directories).
```

This prevents agents from accidentally modifying task files outside their designated scope.

### 3. Nested Execution Guard

**File**: `/home/dustin/projects/hacky-hack/src/config/environment.ts`

From `PRD.md §9.2.5` and `system_context.md` (Lines 383-396):

**Guard Logic**:

1. On pipeline start, check if `PRP_PIPELINE_RUNNING` is already set
2. If set, only allow execution if BOTH:
   - `SKIP_BUG_FINDING=true` (legitimate bug fix recursion)
   - `PLAN_DIR` contains "bugfix" (validates bugfix context)
3. If validation fails, exit with clear error message
4. On valid entry, set `PRP_PIPELINE_RUNNING` to current PID

**Session Creation Guards**:

- In bug fix mode, prevent creating sessions in main `plan/` directory
- Bug fix session paths must contain "bugfix" in the path
- Provides debug logging showing `PLAN_DIR`, `SESSION_DIR`, and `SKIP_BUG_FINDING` values

---

## Gaps in Current Implementation

### 1. Missing Protected Files in Git Commit Filter

**Current Implementation** (Lines 38-42):

```typescript
const PROTECTED_FILES = [
  'tasks.json', // Pipeline task registry
  'PRD.md', // Original PRD document
  'prd_snapshot.md', // PRD snapshot for delta detection
] as const;
```

**Missing from Filter**:

- `delta_prd.md` - Delta PRD for incremental sessions
- `delta_from.txt` - Delta session linkage
- `TEST_RESULTS.md` - Bug report file
- `*tasks*.json` pattern - Wildcard pattern for any task files

### 2. No Enforcement of "Never Delete or Move"

The specifications state these files should "NEVER delete or move", but there is no code-level enforcement:

- No filesystem-level guards against deletion
- No validation before file operations
- Agents could potentially delete these files through MCP tools

### 3. No Agent-Level Operation Validation

While agent prompts specify forbidden operations, there is no runtime validation:

- Agents could potentially use BashMCP to run forbidden commands
- No tool-level restrictions on file operations
- Relies entirely on prompt adherence

---

## Test Coverage Analysis

### Existing Tests

1. **Unit Tests** (`tests/unit/utils/git-commit.test.ts`):
   - `filterProtectedFiles()` function thoroughly tested (Lines 56-145)
   - Tests cover: removing protected files, empty arrays, paths with directories, absolute paths
   - 100% coverage of the filter function

2. **Integration Tests** (`tests/integration/smart-commit.test.ts`):
   - Smart commit workflow tested with protected files (Lines 391-471)
   - Verifies tasks.json, PRD.md, and prd_snapshot.md are not committed
   - Tests edge cases (only protected files changed, no files changed)

### Missing Test Coverage

1. **Wildcard Pattern Testing**:
   - No tests for `*tasks*.json` pattern matching
   - No validation that the pattern correctly matches various filenames

2. **Delta Session Files**:
   - No tests for `delta_prd.md` and `delta_from.txt` protection
   - These files are not in the `PROTECTED_FILES` array

3. **TEST_RESULTS.md Protection**:
   - No tests verifying bug reports are not committed
   - File is not in the `PROTECTED_FILES` array

4. **Deletion/Movement Prevention**:
   - No tests for preventing file deletion
   - No tests for preventing file movement to subdirectories

5. **Agent Operation Validation**:
   - No tests verifying agents cannot run forbidden commands
   - No tests for agent-level restrictions on file modifications

---

## Context for Test Requirements

Based on the PRD and system_context documentation, tests should verify:

### 1. Git Commit Protection Tests

```typescript
describe('protected files in git commits', () => {
  it('should not commit tasks.json from any path');
  it('should not commit PRD.md');
  it('should not commit prd_snapshot.md');
  it('should not commit delta_prd.md');
  it('should not commit delta_from.txt');
  it('should not commit TEST_RESULTS.md');
  it('should not commit any *tasks*.json pattern');
  it('should commit non-protected source files');
});
```

### 2. Agent Constraint Tests

```typescript
describe('agent forbidden operations', () => {
  it('should prevent modifying PRD.md');
  it('should prevent running prd command');
  it('should prevent adding plan/ to .gitignore');
  it(
    'should prevent creating session directories outside designated locations'
  );
});
```

### 3. File Operation Tests

```typescript
describe('protected file operations', () => {
  it('should prevent deletion of tasks.json');
  it('should prevent deletion of prd_snapshot.md');
  it('should prevent deletion of delta_prd.md');
  it('should prevent deletion of TEST_RESULTS.md');
  it('should prevent moving files from session root to subdirectories');
});
```

### 4. Pattern Matching Tests

```typescript
describe('wildcard pattern protection', () => {
  it('should match tasks.json');
  it('should match backup-tasks.json');
  it('should match tasks.backup.json');
  it('should match tasks-v2.json');
  it('should not match task.json (singular)');
});
```

---

## Recommendations

### 1. Update PROTECTED_FILES Constant

**File**: `src/utils/git-commit.ts`

```typescript
const PROTECTED_FILES = [
  'tasks.json', // Pipeline task registry
  'PRD.md', // Original PRD document
  'prd_snapshot.md', // PRD snapshot for delta detection
  'delta_prd.md', // Delta PRD for incremental sessions
  'delta_from.txt', // Delta session linkage
  'TEST_RESULTS.md', // Bug report file
] as const;

// Add wildcard pattern matching for *tasks*.json
function isProtectedFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  return (
    PROTECTED_FILES.includes(basename as any) ||
    /\btasks.*\.json$/.test(basename)
  );
}
```

### 2. Implement Filesystem-Level Guards

Create a new utility module `src/utils/file-guards.ts`:

```typescript
import { unlink, rename } from 'node:fs/promises';

const PROTECTED_PATHS = [
  'tasks.json',
  'PRD.md',
  'prd_snapshot.md',
  'delta_prd.md',
  'delta_from.txt',
  'TEST_RESULTS.md',
];

export async function safeDelete(filePath: string): Promise<void> {
  const basename = path.basename(filePath);
  if (PROTECTED_PATHS.includes(basename)) {
    throw new Error(`Cannot delete protected file: ${basename}`);
  }
  return unlink(filePath);
}

export async function safeMove(
  oldPath: string,
  newPath: string
): Promise<void> {
  const oldBasename = path.basename(oldPath);
  if (PROTECTED_PATHS.includes(oldBasename)) {
    throw new Error(`Cannot move protected file: ${oldBasename}`);
  }
  return rename(oldPath, newPath);
}
```

### 3. Wrap MCP Tools with Protection

Modify `src/tools/filesystem-mcp.ts` to call protection functions before delete/move operations.

### 4. Add Comprehensive Tests

Create new test file `tests/integration/protected-files.test.ts` to verify all protected file specifications.

---

## Conclusion

The protected files specification is well-documented in both `system_context.md` and `PRD.md §5.1`. The current implementation provides partial enforcement through git commit filtering, but significant gaps remain:

1. **Incomplete PROTECTED_FILES array** - Missing delta session files and TEST_RESULTS.md
2. **No wildcard pattern support** - `*tasks*.json` pattern not implemented
3. **No deletion/movement guards** - Agents can delete protected files
4. **No agent-level validation** - Forbidden operations rely only on prompt adherence
5. **Incomplete test coverage** - Missing tests for several protected files and operations

For complete compliance with the specifications, the implementation should be enhanced with filesystem-level guards, expanded PROTECTED_FILES constant, wildcard pattern matching, and comprehensive test coverage.
