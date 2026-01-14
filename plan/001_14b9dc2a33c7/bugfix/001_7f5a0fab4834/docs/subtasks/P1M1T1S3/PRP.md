# PRP: Link Groundswell in hacky-hack project

**Subtask**: P1.M1.T1.S3
**Status**: Research Complete
**Points**: 1

---

## Goal

**Feature Goal**: Programmatically execute `npm link groundswell` in the hacky-hack project directory, creating a local symlink from `node_modules/groundswell` to the globally linked Groundswell package, enabling TypeScript imports and compilation.

**Deliverable**: `linkGroundswellLocally()` function added to `src/utils/groundswell-linker.ts` with comprehensive unit tests in `tests/unit/utils/groundswell-linker.test.ts`.

**Success Definition**:

- Function executes `npm link groundswell` from hacky-hack project directory
- Conditionally skips execution if S2 result.success is false
- Returns structured `{ success: boolean, message: string, symlinkPath: string, symlinkTarget?: string, exitCode: number | null }` result
- Verifies symlink exists at `node_modules/groundswell` after linking
- Mock-friendly design for unit testing with Vitest

## User Persona

**Target User**: Bug hunt workflow automation that needs to programmatically establish the Groundswell link without manual intervention.

**Use Case**: After S2 successfully creates the global npm link (`npm link` in Groundswell directory), S3 links it into the hacky-hack project (`npm link groundswell` in hacky-hack directory).

**User Journey**:

1. Bug hunt workflow detects missing Groundswell dependency
2. S1 verifies Groundswell exists at `~/projects/groundswell`
3. S2 executes `npm link` from Groundswell directory (creates global symlink)
4. **S3 (this task)** executes `npm link groundswell` from hacky-hack directory (creates local symlink)
5. S4 verifies symlink integrity at `node_modules/groundswell`
6. Application compiles successfully with Groundswell imports

**Pain Points Addressed**:

- Manual `npm link groundswell` command is error-prone and often forgotten
- No programmatic verification that symlink was created correctly
- Difficult to debug when npm link fails silently
- Workflow automation requires programmatic control over linking process

## Why

- **Business value**: Enables automated local development workflow for Groundswell dependency without manual intervention
- **Integration with existing features**: Consumes S2's `GroundswellLinkResult` output; produces output consumed by S4 for symlink verification
- **Problems this solves**: Resolves Bug Fix Issue #1 - "Cannot find module 'groundswell'" affecting 65+ files

## What

Executes `npm link groundswell` from the hacky-hack project directory (`/home/dustin/projects/hacky-hack`) with comprehensive error handling and symlink verification:

1. **Input validation**: Accepts S2's `GroundswellLinkResult` - skips execution if `success: false`
2. **Command execution**: Spawns `npm link groundswell` using `node:child_process.spawn()` with argument array (not shell string)
3. **Symlink verification**: Uses `fs.promises.lstat()` and `fs.promises.readlink()` to verify symlink exists and read target
4. **Output capture**: Captures stdout, stderr, and exit code for debugging
5. **Return structure**: `{ success: boolean, message: string, symlinkPath: string, symlinkTarget?: string, exitCode: number | null }`

### Success Criteria

- [ ] Function executes `npm link groundswell` command from hacky-hack project directory
- [ ] Returns `success: true` when npm link exits with code 0 and symlink exists
- [ ] Returns `success: false` with error details when npm link fails or symlink not found
- [ ] Skips execution (returns `success: false` with message) when S2 result.success is false
- [ ] Captures and returns stdout/stderr for debugging
- [ ] Verifies symlink exists at `node_modules/groundswell` after linking
- [ ] Returns symlink target path for additional verification
- [ ] All unit tests pass including spawn error, symlink verification, and conditional skip scenarios
- [ ] Code follows existing patterns from `src/utils/groundswell-linker.ts`

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: A developer unfamiliar with this codebase would need:

- The spawn execution pattern from `groundswell-linker.ts` (S2 implementation)
- The input contract from S2 (`GroundswellLinkResult` interface)
- Symlink verification patterns using `fs.lstat()` and `fs.readlink()`
- Testing patterns for mocking ChildProcess and fs modules
- The project directory path (`/home/dustin/projects/hacky-hack`)
- The expected symlink location (`node_modules/groundswell`)

### Documentation & References

```yaml
# MUST READ - Implementation patterns from S2
- file: src/utils/groundswell-linker.ts
  why: Spawn execution pattern with timeout handling, stdout/stderr capture
  pattern: Lines 131-240 (linkGroundswell function)
  gotcha: shell: false is critical for security; use argument arrays not command strings

# MUST READ - Input contract from S2
- file: src/utils/groundswell-linker.ts
  why: GroundswellLinkResult interface defines input structure
  pattern: Lines 49-67 (GroundswellLinkResult interface)
  gotcha: Check result.success before executing npm link groundswell

# MUST READ - Testing patterns from S2
- file: tests/unit/utils/groundswell-linker.test.ts
  why: Mock patterns for ChildProcess, fake timers, spawn function
  pattern: Lines 44-86 (createMockChild helper function)
  gotcha: Must use vi.runAllTimersAsync() for fake timer tests

# MUST READ - Symlink verification patterns
- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S3/research/symlink-verification-research.md
  why: Complete guide to fs.lstat(), fs.readlink(), and symlink detection
  section: Sections 1-3 (fs.lstat vs fs.stat, Stats.isSymbolicLink, fs.readlink)
  critical: Use fs.lstat() NOT fs.stat() for symlink detection

# MUST READ - npm link local patterns
- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S3/research/npm-link-local-research.md
  why: Complete npm link workflow and verification patterns
  section: Section 2.1 (Symlink Verification in Node.js TypeScript)
  critical: npm link groundswell requires S2's global link to exist first

# MUST READ - External dependencies architecture
- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/architecture/external_deps.md
  why: Symlink requirements and verification commands
  section: "Installation Strategy" and "Option 1: npm link (RECOMMENDED)"
  critical: Symlink must be created at node_modules/groundswell

# External documentation
- url: https://docs.npmjs.com/cli/v10/commands/npm-link
  why: npm link command behavior and expected output
  critical: Local linking requires global link to exist first
  section: "Description" and "Configuration"

# External documentation
- url: https://nodejs.org/api/fs.html#fspromiseslstatpath-options
  why: fs.promises.lstat() API documentation for symlink detection
  critical: lstat() does NOT follow symlinks, stat() does
  section: "fs.promises.lstat()"

# External documentation
- url: https://nodejs.org/api/fs.html#fspromisesreadlinkpath-options
  why: fs.promises.readlink() API documentation for reading symlink targets
  critical: readlink() returns the symlink target path
  section: "fs.promises.readlink()"
```

### Current Codebase Tree

```bash
src/utils/
├── groundswell-verifier.ts    # S1: Verification (Complete)
├── groundswell-linker.ts       # S2: npm link global (Complete), S3: npm link local (ADD HERE)
└── ...

tests/unit/utils/
├── groundswell-verifier.test.ts    # S1 tests (Complete)
├── groundswell-linker.test.ts       # S2 tests (Complete), S3 tests (ADD HERE)
└── ...
```

### Desired Codebase Tree

```bash
# Implementation files (extend existing files)
src/utils/groundswell-linker.ts    # ADD: linkGroundswellLocally() function
tests/unit/utils/groundswell-linker.test.ts    # ADD: Tests for local linking

# No additional files needed - extend existing S2 implementation
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: fs.stat() follows symlinks, fs.lstat() does NOT
// WRONG: const stats = await fs.stat('node_modules/groundswell')  // Follows symlink
// RIGHT: const stats = await fs.lstat('node_modules/groundswell') // Does NOT follow

// CRITICAL: isSymbolicLink() only works with lstat() results
// Using stat().isSymbolicLink() ALWAYS returns false (because it followed the symlink)

// CRITICAL: npm link groundswell requires S2's global link to exist first
// If global link doesn't exist, npm link groundswell will fail with "ERR! code E404"

// CRITICAL: Spawn argument array format
// WRONG: spawn('npm link groundswell')  // Tries to execute "npm link groundswell" as single executable
// RIGHT: spawn('npm', ['link', 'groundswell'], { shell: false })

// CRITICAL: shell: false prevents command injection vulnerabilities
// Never use shell: true with user-provided input

// CRITICAL: Symlink verification order
// 1. Execute npm link groundswell
// 2. Wait for close event (exit code 0)
// 3. Verify symlink exists using fs.lstat()
// 4. Read symlink target using fs.readlink()

// CRITICAL: Conditional execution based on S2 result
// If S2 result.success is false, skip npm link groundswell and return early

// CRITICAL: Node.js fs.promises API for async operations
// Use fs.promises.lstat() and fs.promises.readlink() for async/await pattern

// CRITICAL: Project directory is hardcoded in contract
// Use /home/dustin/projects/hacky-hack as cwd for spawn execution

// CRITICAL: Symlink location relative to project directory
// Expected symlink path: /home/dustin/projects/hacky-hack/node_modules/groundswell

// CRITICAL: Vitest mocking for fs module
// Must mock both 'node:fs/promises' and spawn for complete test isolation
```

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Result of npm link groundswell operation (local linking)
 *
 * Returned by linkGroundswellLocally() to indicate whether
 * npm link groundswell completed successfully and provide
 * symlink verification details.
 */
export interface GroundswellLocalLinkResult {
  /** Whether npm link groundswell completed and symlink exists */
  success: boolean;

  /** Human-readable status message */
  message: string;

  /** Path where symlink should exist (node_modules/groundswell) */
  symlinkPath: string;

  /** Actual symlink target (if verification succeeded) */
  symlinkTarget?: string;

  /** Standard output from npm link command */
  stdout: string;

  /** Standard error from npm link command */
  stderr: string;

  /** Exit code from npm command (0 = success) */
  exitCode: number | null;

  /** Error message if link or verification failed */
  error?: string;
}

/**
 * Optional configuration for linkGroundswellLocally()
 */
export interface GroundswellLocalLinkOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: DEFINE GroundswellLocalLinkResult interface
  - ADD: export interface GroundswellLocalLinkResult to groundswell-linker.ts
  - INCLUDE: success, message, symlinkPath, symlinkTarget?, stdout, stderr, exitCode, error?
  - PLACEMENT: After GroundswellLinkResult interface (around line 67)
  - PATTERN: Follow existing GroundswellLinkResult naming and structure

Task 2: DEFINE GroundswellLocalLinkOptions interface
  - ADD: export interface GroundswellLocalLinkOptions to groundswell-linker.ts
  - INCLUDE: timeout?, projectPath?
  - PLACEMENT: After GroundswellLocalLinkResult interface
  - DEFAULT: timeout = 30000, projectPath = '/home/dustin/projects/hacky-hack'

Task 3: IMPLEMENT linkGroundswellLocally() function signature
  - ADD: export async function linkGroundswellLocally() to groundswell-linker.ts
  - ACCEPT: previousResult: GroundswellLinkResult, options?: GroundswellLocalLinkOptions
  - RETURN: Promise<GroundswellLocalLinkResult>
  - PLACEMENT: After linkGroundswell() function
  - PATTERN: Follow linkGroundswell() function structure

Task 4: IMPLEMENT input validation (conditional skip)
  - CHECK: previousResult.success === false
  - IF true: RETURN { success: false, message: "Skipped: Global npm link failed", symlinkPath, exitCode: null }
  - GOTCHA: Early return prevents execution when S2 failed
  - INCLUDE: previousResult.message in return for context

Task 5: IMPLEMENT spawn execution for npm link groundswell
  - EXECUTE: spawn('npm', ['link', 'groundswell'], { cwd: projectPath, stdio, shell: false })
  - FOLLOW: linkGroundswell() pattern (lines 153-170)
  - CATCH: Synchronous spawn errors (ENOENT, EACCES)
  - RETURN: { success: false, error: message } for spawn failures
  - CRITICAL: shell: false prevents injection

Task 6: IMPLEMENT output capture with Promise wrapper
  - IMPLEMENT: Promise-based stdout/stderr capture
  - FOLLOW: linkGroundswell() pattern (lines 173-240)
  - LISTEN: child.stdout.on('data', callback) for stdout
  - LISTEN: child.stderr.on('data', callback) for stderr
  - ACCUMULATE: String concatenation for each data event
  - GOTCHA: Data events receive Buffer, call toString() to convert

Task 7: IMPLEMENT timeout handling
  - IMPLEMENT: setTimeout with SIGTERM then SIGKILL
  - FOLLOW: linkGroundswell() pattern (lines 180-190)
  - ESCALATION: 2 second grace period between SIGTERM and SIGKILL
  - FLAG: Set timedOut flag to prevent data capture after kill

Task 8: IMPLEMENT symlink verification on close event
  - AFTER: exitCode === 0, verify symlink exists
  - IMPORT: lstat, readlink from 'node:fs/promises'
  - VERIFY: await lstat(symlinkPath).isSymbolicLink() === true
  - READ: await readlink(symlinkPath) to get target
  - HANDLE: ENOENT (symlink not created) gracefully
  - RETURN: symlinkTarget in result if verification succeeded

Task 9: IMPLEMENT error event handling
  - IMPLEMENT: child.on('error', error => resolve({ success: false }))
  - FOLLOW: linkGroundswell() pattern (lines 228-239)
  - CLEAR: clearTimeout on error to prevent timeout from firing
  - RESOLVE: Return result with error message from Error object

Task 10: ADD JSDoc documentation
  - IMPLEMENT: Comprehensive JSDoc comments
  - FOLLOW: linkGroundswell() pattern (lines 98-130)
  - INCLUDE: Function signature, parameters, return type, examples
  - MARK: Use @remarks for detailed behavior notes

Task 11: CREATE unit tests for happy path
  - ADD: describe('linkGroundswellLocally', ...) to groundswell-linker.test.ts
  - MOCK: vi.mock('node:child_process') for spawn function
  - MOCK: vi.mock('node:fs/promises') for lstat/readlink
  - TEST: Returns success: true when npm link succeeds and symlink exists
  - TEST: Includes symlinkTarget in result

Task 12: CREATE unit tests for conditional skip
  - TEST: Skips execution when previousResult.success is false
  - TEST: Returns appropriate message with "Skipped:" prefix
  - TEST: Does not call spawn when skipping

Task 13: CREATE unit tests for spawn errors
  - TEST: Handles ENOENT (npm not found)
  - TEST: Handles EACCES (permission denied)
  - TEST: Returns success: false with error details

Task 14: CREATE unit tests for symlink verification
  - TEST: Returns success: false when symlink not created (ENOENT)
  - TEST: Returns success: false when path exists but is not symlink
  - TEST: Returns symlinkTarget when verification succeeds
  - TEST: Handles fs.lstat() errors gracefully

Task 15: CREATE unit tests for timeout scenarios
  - TEST: Terminates hung npm link process with SIGTERM
  - TEST: Escalates to SIGKILL after grace period
  - TEST: Returns success: false with timeout error message
```

### Implementation Patterns & Key Details

```typescript
// INPUT VALIDATION PATTERN (conditional skip based on S2 result)
export async function linkGroundswellLocally(
  previousResult: GroundswellLinkResult,
  options?: GroundswellLocalLinkOptions
): Promise<GroundswellLocalLinkResult> {
  const { timeout = DEFAULT_LINK_TIMEOUT, projectPath = DEFAULT_PROJECT_PATH } =
    options ?? {};

  const symlinkPath = join(projectPath, 'node_modules', 'groundswell');

  // PATTERN: Conditional execution based on S2 result
  if (!previousResult.success) {
    return {
      success: false,
      message: `Skipped: Global npm link failed - ${previousResult.message}`,
      symlinkPath,
      stdout: '',
      stderr: '',
      exitCode: null,
    };
  }

  // ... continue with spawn execution
}

// SPAWN EXECUTION PATTERN (similar to S2 but different command)
try {
  child = spawn('npm', ['link', 'groundswell'], {
    cwd: projectPath, // CRITICAL: Use project directory, not Groundswell directory
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false, // CRITICAL: prevents shell injection
  });
} catch (error) {
  return {
    success: false,
    message: 'Failed to spawn npm link groundswell command',
    symlinkPath,
    stdout: '',
    stderr: '',
    exitCode: null,
    error: error instanceof Error ? error.message : String(error),
  };
}

// SYMLINK VERIFICATION PATTERN (NEW - not in S2)
import { lstat, readlink } from 'node:fs/promises';
import { join } from 'node:path';

// In close event handler, after exitCode === 0 check
try {
  const stats = await lstat(symlinkPath);
  if (!stats.isSymbolicLink()) {
    return {
      success: false,
      message: 'npm link succeeded but path is not a symlink',
      symlinkPath,
      stdout,
      stderr,
      exitCode,
      error: 'Path exists but is not a symbolic link',
    };
  }

  const symlinkTarget = await readlink(symlinkPath);
  return {
    success: true,
    message: `Successfully linked groundswell in project at ${symlinkPath}`,
    symlinkPath,
    symlinkTarget,
    stdout,
    stderr,
    exitCode,
  };
} catch (error) {
  const errno = error as NodeJS.ErrnoException;
  if (errno.code === 'ENOENT') {
    return {
      success: false,
      message: 'npm link succeeded but symlink not found',
      symlinkPath,
      stdout,
      stderr,
      exitCode,
      error: 'Symlink does not exist at expected path',
    };
  }
  throw error;
}

// PROMISE-BASED OUTPUT CAPTURE PATTERN (same as S2)
return new Promise(async resolve => {
  // NOTE: async for symlink verification
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  let killed = false;

  // ... timeout handler (same as S2)

  // ... stdout/stderr capture (same as S2)

  // CLOSE EVENT HANDLER with symlink verification
  child.on('close', async exitCode => {
    // NOTE: async for await lstat/readlink
    clearTimeout(timeoutId);

    // PATTERN: Verify symlink only if npm link succeeded
    if (exitCode === 0 && !timedOut && !killed) {
      try {
        const stats = await lstat(symlinkPath);
        if (!stats.isSymbolicLink()) {
          return resolve({
            success: false,
            message: 'npm link succeeded but path is not a symlink',
            symlinkPath,
            stdout,
            stderr,
            exitCode,
            error: 'Path exists but is not a symbolic link',
          });
        }

        const symlinkTarget = await readlink(symlinkPath);
        resolve({
          success: true,
          message: `Successfully linked groundswell in project at ${symlinkPath}`,
          symlinkPath,
          symlinkTarget,
          stdout,
          stderr,
          exitCode,
        });
      } catch (error) {
        const errno = error as NodeJS.ErrnoException;
        resolve({
          success: false,
          message: `npm link succeeded but symlink verification failed: ${errno.message}`,
          symlinkPath,
          stdout,
          stderr,
          exitCode,
          error: errno.code,
        });
      }
    } else {
      // npm link failed
      resolve({
        success: false,
        message: `npm link failed${exitCode !== null ? ` with exit code ${exitCode}` : ''}`,
        symlinkPath,
        stdout,
        stderr,
        exitCode,
        error: timedOut ? `Command timed out after ${timeout}ms` : undefined,
      });
    }
  });

  // ... error event handler (same as S2)
});
```

### Integration Points

```yaml
INPUT_CONTRACT:
  - from: P1.M1.T1.S2 (linkGroundswell)
  - type: GroundswellLinkResult
  - consume: Check result.success before executing npm link groundswell
  - validate: Skip execution if success is false
  - use: result.message for skip message context

OUTPUT_CONTRACT:
  - to: P1.M1.T1.S4 (verify symlink in node_modules)
  - type: GroundswellLocalLinkResult
  - provide: success boolean for conditional logic
  - provide: message string for logging
  - provide: symlinkPath for verification path
  - provide: symlinkTarget for additional verification

DEPENDENCIES:
  - import: spawn, ChildProcess from 'node:child_process'
  - import: lstat, readlink from 'node:fs/promises'
  - import: join from 'node:path'
  - use: No external dependencies beyond Node.js built-ins

WORKFLOW_INTEGRATION:
  - context: Bug hunt workflow (src/workflows/bug-hunt-workflow.ts)
  - usage: linkGroundswellLocally() called after linkGroundswell() succeeds
  - logging: Result.message logged to console
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after reviewing implementation files
npx tsc --noEmit src/utils/groundswell-linker.ts    # Type checking
npx eslint src/utils/groundswell-linker.ts         # Linting

# Expected: Zero errors. If errors exist, READ output and verify implementation is correct.

# Project-wide validation
npm run typecheck    # Full project type check
npm run lint         # Full project lint
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the groundswell-linker module specifically
npm run test:run -- tests/unit/utils/groundswell-linker.test.ts

# Full utils test suite
npm run test:run -- tests/unit/utils/

# Coverage validation (ensure high coverage)
npm run test:coverage -- tests/unit/utils/groundswell-linker.test.ts

# Expected: All tests pass. Coverage should be >90% for this module.

# Test scenarios covered:
# - Happy path: npm link groundswell succeeds, symlink exists
# - Conditional skip: skips when S2 result.success is false
# - Spawn errors: handles ENOENT (npm not found), EACCES (permission denied)
# - npm link failures: returns success: false for non-zero exit codes
# - Symlink verification: detects when symlink not created
# - Symlink verification: detects when path exists but is not symlink
# - Symlink verification: returns symlinkTarget when successful
# - Timeout: terminates hung processes with SIGTERM then SIGKILL
# - Output capture: correctly captures stdout and stderr
# - Result structure: returns all expected fields with correct types
```

### Level 3: Integration Testing (System Validation)

```bash
# MANUAL TEST: Verify actual npm link groundswell functionality
# WARNING: This requires actual global npm link from S2

# Step 1: Ensure global link exists (from S2)
npm list -g --depth=0 | grep groundswell
# Expected: groundswell@0.0.1

# Step 2: Execute npm link groundswell (via programmatic function)
node -e "import('./dist/utils/groundswell-linker.js').then(m => m.linkGroundswellLocally({success:true,message:'test'}).then(r => console.log(r)))"

# OR use the actual workflow:
npm run dev -- --prd PRD.md --bug-hunt

# Expected output on success:
# {
#   success: true,
#   message: "Successfully linked groundswell in project at /home/dustin/projects/hacky-hack/node_modules/groundswell",
#   symlinkPath: "/home/dustin/projects/hacky-hack/node_modules/groundswell",
#   symlinkTarget: "/home/user/.nvm/versions/node/v20.x.x/lib/node_modules/groundswell",
#   stdout: "...",
#   stderr: "",
#   exitCode: 0
# }

# Step 3: Verify symlink was created
ls -la node_modules/groundswell
# Expected: lrwxrwxrwx ... groundswell -> /home/user/.nvm/versions/node/v20.x.x/lib/node_modules/groundswell

# Step 4: Verify symlink target chain
readlink -f node_modules/groundswell
# Expected: /home/dustin/projects/groundswell

# Step 5: Verify npm list shows linked package
npm list groundswell
# Expected: groundswell@0.0.1 -> ~/projects/groundswell

# CLEANUP (after testing):
# npm unlink groundswell  # Remove local link
```

### Level 4: Creative & Domain-Specific Validation

```bash
# TypeScript type checking for Groundswell imports
npm run typecheck    # Should pass without "Cannot find module 'groundswell'" errors

# Integration with bug hunt workflow
# Run workflow that uses linkGroundswellLocally and verify logs
npm run dev -- --prd PRD.md --bug-hunt

# Verify the link operation shows up in logs with success/failure status

# Test symlink verification edge cases:
# 1. Manually delete symlink after npm link succeeds - should return success: false
# 2. Create a file at node_modules/groundswell - should detect not a symlink
# 3. Create a broken symlink - should handle gracefully

# Test conditional skip:
# 1. Call with previousResult.success = false - should skip execution
# 2. Verify spawn is never called when skipping
# 3. Verify return message contains "Skipped:" prefix

# Test error scenarios manually:
# 1. Remove global link before local link - should fail with E404
# 2. Set very short timeout (10ms) and verify SIGTERM/SIGKILL
# 3. Make project directory read-only and verify EACCES handling
```

## Final Validation Checklist

### Technical Validation

- [ ] Implementation added to src/utils/groundswell-linker.ts
- [ ] All Level 1 validation passes (type check, lint)
- [ ] All Level 2 unit tests pass (15+ test scenarios)
- [ ] Implementation follows spawn pattern from linkGroundswell()
- [ ] Input validation skips execution when S2 failed
- [ ] Spawn errors return success: false result
- [ ] Timeout handling uses SIGTERM then SIGKILL
- [ ] Symlink verification uses fs.lstat() not fs.stat()
- [ ] Result structure includes all required fields

### Feature Validation

- [ ] Executes `npm link groundswell` from hacky-hack project directory
- [ ] Returns success: true when npm link exits with code 0 and symlink exists
- [ ] Returns success: false when npm link fails or symlink not found
- [ ] Captures stdout and stderr for debugging
- [ ] Skips execution when S2 result.success is false
- [ ] Timeout terminates hung processes
- [ ] Verifies symlink exists at node_modules/groundswell
- [ ] Returns symlinkTarget for additional verification
- [ ] All success criteria from "What" section met

### Code Quality Validation

- [ ] Follows existing linkGroundswell() spawn execution pattern
- [ ] Function naming matches convention (linkGroundswellLocally)
- [ ] Interface naming matches convention (GroundswellLocalLinkResult)
- [ ] JSDoc comments are comprehensive
- [ ] Anti-patterns avoided (shell: true, command strings, no timeout)
- [ ] No security vulnerabilities (argument arrays, shell: false)
- [ ] Uses fs.lstat() not fs.stat() for symlink detection

### Documentation & Deployment

- [ ] JSDoc comments explain function behavior
- [ ] Examples in JSDoc are valid TypeScript
- [ ] Error messages are actionable
- [ ] Integration points documented (S2 input, S4 output)
- [ ] Files ready to be committed to git

## Anti-Patterns to Avoid

- **Don't** use `spawn('npm link groundswell')` - must use argument array: `spawn('npm', ['link', 'groundswell'])`
- **Don't** use `shell: true` - prevents shell injection vulnerabilities
- **Don't** skip timeout handling - npm link can hang indefinitely
- **Don't** ignore spawn errors - handle both sync and async error paths
- **Don't** forget to clear timeout on close/error - prevents memory leaks
- **Don't** use `fs.stat()` for symlink detection - use `fs.lstat()` instead
- **Don't** skip symlink verification - npm link may succeed without creating symlink
- **Don't** execute when S2 failed - always check previousResult.success first
- **Don't** forget to convert Buffer to string in data events
- **Don't** continue capturing data after kill signal
- **Don't** throw errors for npm link failures - return success: false result
- **Don't** use `child.exec()` - deprecated and uses shell

## Implementation Status

**Status**: Research Complete, Ready for Implementation

**Next Steps**:

1. Create implementation tasks from this PRP
2. Implement `linkGroundswellLocally()` function in `src/utils/groundswell-linker.ts`
3. Create comprehensive unit tests in `tests/unit/utils/groundswell-linker.test.ts`
4. Run all validation levels
5. Commit files to git with appropriate message
6. Update task status from "Researching" to "Complete"
7. Proceed to S4: Verify Groundswell symlink in node_modules

---

## Research Notes

### Key Research Findings

From `research/npm-link-local-research.md`:

- **Two-step process**: S2 creates global link, S3 creates local link
- **Symlink chain**: `node_modules/groundswell` → global → `~/projects/groundswell`
- **Verification pattern**: Use `fs.lstat()` to detect symlinks, `fs.readlink()` to read targets

From `research/symlink-verification-research.md`:

- **Critical distinction**: `fs.stat()` follows symlinks, `fs.lstat()` does not
- **isSymbolicLink()**: Only works with `lstat()` results, always returns `false` with `stat()`
- **Error handling**: Handle ENOENT (not found), EACCES (permission), EINVAL (not symlink)

From S2 PRP and implementation:

- **Spawn pattern**: Use argument arrays with `shell: false` for security
- **Timeout handling**: SIGTERM then SIGKILL after 2 second grace period
- **Output capture**: Promise-based with stdout/stderr accumulation

### npm Link Local Behavior

From npm documentation (https://docs.npmjs.com/cli/v10/commands/npm-link):

1. **Local linking requires global link**: `npm link package-name` fails if global link doesn't exist
2. **Creates symlink chain**: Links project's `node_modules/package` to global symlink
3. **Error codes**: E404 if package not found globally, EEXIST if local version conflicts
4. **Package.json**: npm link may add dependency to package.json automatically

### Testing Strategy

From research and existing patterns:

1. **Mock both spawn and fs**: Need `vi.mock('node:child_process')` and `vi.mock('node:fs/promises')`
2. **Conditional skip tests**: Verify spawn is never called when S2 failed
3. **Symlink verification tests**: Mock `lstat` to return `{ isSymbolicLink: () => true/false }`
4. **Readlink tests**: Mock `readlink` to return target path string

---

**Confidence Score**: 10/10 for one-pass implementation success

**Validation**: This PRP provides complete context including:

- Exact file paths and line numbers to reference
- Specific code patterns to follow from S2 implementation
- Complete symlink verification patterns from research
- Comprehensive testing patterns from S2 tests
- All npm link behavior and gotchas documented
- Input/output contracts clearly specified
