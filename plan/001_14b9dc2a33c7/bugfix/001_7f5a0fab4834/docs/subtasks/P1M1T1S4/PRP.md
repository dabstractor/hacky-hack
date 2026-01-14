# PRP: Verify Groundswell symlink in node_modules

**Subtask**: P1.M1.T1.S4
**Status**: Research Complete
**Points**: 0.5

---

## Goal

**Feature Goal**: Verify that the npm link symlink exists at `node_modules/groundswell` after the local linking operation, confirming the symlink integrity before proceeding to npm list verification.

**Deliverable**: `verifyGroundswellSymlink()` function added to `src/utils/groundswell-linker.ts` with comprehensive unit tests in `tests/unit/utils/groundswell-linker.test.ts`.

**Success Definition**:
- Consumes S3's `GroundswellLocalLinkResult` - only proceeds if `success: true`
- Executes `ls -la node_modules/groundswell` via spawn() with proper timeout handling
- Parses output to verify symlink indicator (->) is present
- Returns structured `{ exists: boolean, path: string }` result
- Returns `exists: true` only when symlink is verified
- Mock-friendly design for unit testing with Vitest

## User Persona

**Target User**: Bug hunt workflow automation that needs to programmatically verify symlink integrity after npm linking without manual intervention.

**Use Case**: After S3 successfully creates the local npm link (`npm link groundswell`), S4 verifies the symlink actually exists at `node_modules/groundswell` before proceeding to npm list verification in S5.

**User Journey**:
1. Bug hunt workflow detects missing Groundswell dependency
2. S1 verifies Groundswell exists at `~/projects/groundswell`
3. S2 executes `npm link` from Groundswell directory (creates global symlink)
4. S3 executes `npm link groundswell` from hacky-hack directory (creates local symlink)
5. **S4 (this task)** verifies symlink exists at `node_modules/groundswell` with symlink indicator
6. S5 runs `npm list` to verify dependency resolution
7. Application compiles successfully with Groundswell imports

**Pain Points Addressed**:
- Manual symlink verification with `ls -la` is error-prone in automated workflows
- No programmatic verification that symlink was created correctly after npm link
- Difficult to debug when npm link appears to succeed but symlink is missing
- Workflow automation requires deterministic symlink verification before proceeding

## Why

- **Business value**: Enables automated local development workflow with confidence that npm link actually created the required symlink
- **Integration with existing features**: Consumes S3's `GroundswellLocalLinkResult` output; produces output consumed by S5 for npm list verification
- **Problems this solves**: Resolves Bug Fix Issue #1 - "Cannot find module 'groundswell'" by ensuring symlink verification before proceeding

## What

Verifies symlink existence at `node_modules/groundswell` by executing `ls -la` and parsing output for symlink indicators:

1. **Input validation**: Accepts S3's `GroundswellLocalLinkResult` - skips verification if `success: false`
2. **Command execution**: Spawns `ls -la node_modules/groundswell` using `node:child_process.spawn()` with proper timeout handling
3. **Output parsing**: Parses stdout for symlink indicators (permission bit `l` and arrow pattern `->`)
4. **Result return**: Returns `{ exists: boolean, path: string }` with exists=true only when symlink verified

### Success Criteria

- [ ] Function executes `ls -la node_modules/groundswell` command from project directory
- [ ] Returns `exists: true` when symlink indicator (->) found in ls output
- [ ] Returns `exists: false` when symlink not found or S3 result.success is false
- [ ] Skips execution (returns exists: false) when S3 result.success is false
- [ ] Captures and returns stdout for debugging
- [ ] Verifies symlink exists at node_modules/groundswell after linking
- [ ] Uses dual detection (permission + arrow) for reliability
- [ ] All unit tests pass including spawn error, timeout, and conditional skip scenarios
- [ ] Code follows existing patterns from `src/utils/groundswell-linker.ts`

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: A developer unfamiliar with this codebase would need:
- The spawn execution pattern from `groundswell-linker.ts` (S2/S3 implementation)
- The input contract from S3 (`GroundswellLocalLinkResult` interface)
- The ls -la output parsing patterns from research
- Testing patterns for mocking ChildProcess and spawn in Vitest
- The project directory path (`/home/dustin/projects/hacky-hack`)
- The expected symlink location (`node_modules/groundswell`)
- Symlink detection patterns (permission bit `l` and arrow `->`)

### Documentation & References

```yaml
# MUST READ - Implementation patterns from S2/S3
- file: src/utils/groundswell-linker.ts
  why: Spawn execution pattern with timeout handling, stdout/stderr capture
  pattern: Lines 153-240 (linkGroundswell function)
  gotcha: shell: false is critical for security; use argument arrays not command strings

# MUST READ - Input contract from S3
- file: src/utils/groundswell-linker.ts
  why: GroundswellLocalLinkResult interface defines input structure
  pattern: Lines 218-243 (GroundswellLocalLinkResult interface definition from S3 PRP)
  gotcha: Check result.success before executing ls verification

# MUST READ - Testing patterns from S2/S3
- file: tests/unit/utils/groundswell-linker.test.ts
  why: Mock patterns for ChildProcess, fake timers, spawn function
  pattern: Lines 44-86 (createMockChild helper function)
  gotcha: Must use vi.runAllTimersAsync() for fake timer tests

# MUST READ - ls -la output parsing patterns
- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S4/research/ls-output-parsing-research.md
  why: Complete guide to ls -la format, symlink indicators, and parsing patterns
  section: Section 2 (Symlink Indicators), Section 5 (Parsing Patterns)
  critical: Use dual detection (permission bit l + arrow ->) for reliability

# MUST READ - Symlink verification patterns
- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S4/research/symlink-verification-research.md
  why: Complete guide to fs.lstat(), ls spawning, and symlink detection
  section: Sections 4-5 (ls spawning, Vitest mocking)
  critical: ls -la spawning for verification vs fs.lstat() for production

# MUST READ - External dependencies architecture
- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/architecture/external_deps.md
  why: Symlink requirements and verification commands
  section: "Installation Strategy" and "Option 1: npm link (RECOMMENDED)"
  critical: Symlink must be created at node_modules/groundswell

# External documentation
- url: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
  why: spawn() API documentation for ls execution
  critical: Use shell: false for security, argument arrays for command
  section: "child_process.spawn()"

# External documentation
- url: https://nodejs.org/api/child_process.html#event-close
  why: close event documentation for exit code handling
  critical: Exit code 0 indicates success, non-zero indicates failure
  section: "Event: 'close'"
```

### Current Codebase Tree

```bash
src/utils/
├── groundswell-verifier.ts    # S1: Verification (Complete)
├── groundswell-linker.ts       # S2: npm link global (Complete), S3: npm link local (In Progress), S4: ADD HERE
└── ...

tests/unit/utils/
├── groundswell-verifier.test.ts    # S1 tests (Complete)
├── groundswell-linker.test.ts       # S2/S3 tests (Complete), S4 tests (ADD HERE)
└── ...
```

### Desired Codebase Tree

```bash
# Implementation files (extend existing files)
src/utils/groundswell-linker.ts    # ADD: verifyGroundswellSymlink() function, interface definitions
tests/unit/utils/groundswell-linker.test.ts    # ADD: Tests for symlink verification

# No additional files needed - extend existing S2/S3 implementation
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Conditional execution based on S3 result
// If S3 result.success is false, skip verification and return exists: false

// CRITICAL: ls -la output parsing for symlink detection
// Primary indicator: First character is 'l' (permission bit)
// Secondary indicator: Contains ' -> ' pattern (arrow notation)
// Use BOTH for reliability

// CRITICAL: Spawn argument array format
// WRONG: spawn('ls -la node_modules/groundswell')  // Tries to execute as single executable
// RIGHT: spawn('ls', ['-la', 'node_modules/groundswell'], { shell: false })

// CRITICAL: shell: false prevents command injection vulnerabilities
// Never use shell: true with user-provided input

// CRITICAL: ls -la output format
// <permissions> <links> <owner> <group> <size> <date> <time> <name> [-> <target>]
// Example symlink line: "lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 groundswell -> /home/user/.nvm/versions/node/v20.x.x/lib/node_modules/groundswell"

// CRITICAL: Skip header line in ls output
// First line is "total <number>" - skip when parsing
// Symlink entries start after header

// CRITICAL: Node.js spawn() event handling
// Use 'close' event for exit code, not 'exit'
// Clear timeout in both close and error handlers

// CRITICAL: Vitest mocking for spawn and ls output
// Must mock 'node:child_process' for spawn function
// Must mock stdout/stderr capture with Buffer events
// Use fake timers for timeout testing

// CRITICAL: Project directory is hardcoded in contract
// Use /home/dustin/projects/hacky-hack as cwd for spawn execution

// CRITICAL: Symlink location relative to project directory
// Expected symlink path: /home/dustin/projects/hacky-hack/node_modules/groundswell

// CRITICAL: Dual symlink detection for reliability
// Method 1: First character of permissions is 'l'
// Method 2: Line contains ' -> ' pattern
// Both must be true for confirmed symlink
```

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Result of symlink verification in node_modules
 *
 * Returned by verifyGroundswellSymlink() to indicate whether
 * the symlink exists at the expected location.
 */
export interface GroundswellSymlinkVerifyResult {
  /** Whether symlink exists at node_modules/groundswell */
  exists: boolean;

  /** Absolute path where symlink should exist */
  path: string;

  /** Raw ls -la output for debugging */
  lsOutput: string;

  /** Exit code from ls command (0 = success) */
  exitCode: number | null;

  /** Error message if verification failed */
  error?: string;
}

/**
 * Optional configuration for verifyGroundswellSymlink()
 */
export interface GroundswellSymlinkVerifyOptions {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;

  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: DEFINE GroundswellSymlinkVerifyResult interface
  - ADD: export interface GroundswellSymlinkVerifyResult to groundswell-linker.ts
  - INCLUDE: exists, path, lsOutput, exitCode, error?
  - PLACEMENT: After GroundswellLocalLinkResult interface (around line 243)
  - PATTERN: Follow existing GroundswellLocalLinkResult naming and structure

Task 2: DEFINE GroundswellSymlinkVerifyOptions interface
  - ADD: export interface GroundswellSymlinkVerifyOptions to groundswell-linker.ts
  - INCLUDE: timeout?, projectPath?
  - PLACEMENT: After GroundswellSymlinkVerifyResult interface
  - DEFAULT: timeout = 5000, projectPath = '/home/dustin/projects/hacky-hack'

Task 3: IMPLEMENT verifyGroundswellSymlink() function signature
  - ADD: export async function verifyGroundswellSymlink() to groundswell-linker.ts
  - ACCEPT: previousResult: GroundswellLocalLinkResult, options?: GroundswellSymlinkVerifyOptions
  - RETURN: Promise<GroundswellSymlinkVerifyResult>
  - PLACEMENT: After linkGroundswellLocally() function
  - PATTERN: Follow linkGroundswell() and linkGroundswellLocally() function structure

Task 4: IMPLEMENT input validation (conditional skip)
  - CHECK: previousResult.success === false
  - IF true: RETURN { exists: false, path, lsOutput: '', exitCode: null }
  - GOTCHA: Early return prevents execution when S3 failed
  - INCLUDE: previousResult.message in error for context

Task 5: IMPLEMENT spawn execution for ls -la
  - EXECUTE: spawn('ls', ['-la', symlinkPath], { cwd: projectPath, stdio, shell: false })
  - FOLLOW: linkGroundswell() pattern (lines 153-170)
  - CATCH: Synchronous spawn errors (ENOENT, EACCES)
  - RETURN: { exists: false, error: message } for spawn failures
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
  - DEFAULT: 5000ms timeout (ls is fast, use shorter timeout than npm link)

Task 8: IMPLEMENT symlink verification on close event
  - AFTER: exitCode === 0, parse stdout for symlink indicators
  - SPLIT: Split stdout by '\n' to get individual lines
  - SKIP: First line (header: "total <number>")
  - CHECK: Each line for symlink indicators
  - METHOD 1: First character is 'l' (permission bit)
  - METHOD 2: Line contains ' -> ' pattern (arrow notation)
  - RETURN: exists: true only if BOTH indicators found
  - HANDLE: ENOENT (directory not found) gracefully

Task 9: IMPLEMENT error event handling
  - IMPLEMENT: child.on('error', error => resolve({ exists: false }))
  - FOLLOW: linkGroundswell() pattern (lines 228-239)
  - CLEAR: clearTimeout on error to prevent timeout from firing
  - RESOLVE: Return result with error message from Error object

Task 10: ADD JSDoc documentation
  - IMPLEMENT: Comprehensive JSDoc comments
  - FOLLOW: linkGroundswell() pattern (lines 98-130)
  - INCLUDE: Function signature, parameters, return type, examples
  - MARK: Use @remarks for detailed behavior notes

Task 11: CREATE unit tests for happy path
  - ADD: describe('verifyGroundswellSymlink', ...) to groundswell-linker.test.ts
  - MOCK: vi.mock('node:child_process') for spawn function
  - TEST: Returns exists: true when ls succeeds and symlink found
  - TEST: Includes symlink indicator (->) in output parsing

Task 12: CREATE unit tests for conditional skip
  - TEST: Skips execution when previousResult.success is false
  - TEST: Returns exists: false with appropriate error message
  - TEST: Does not call spawn when skipping

Task 13: CREATE unit tests for ls output parsing
  - TEST: Detects symlink by permission bit (first char is 'l')
  - TEST: Detects symlink by arrow pattern (' -> ')
  - TEST: Returns exists: false when no symlink indicator found
  - TEST: Skips header line when parsing output

Task 14: CREATE unit tests for spawn errors
  - TEST: Handles ENOENT (ls not found)
  - TEST: Handles directory not found (exit code non-zero)
  - TEST: Returns exists: false with error details

Task 15: CREATE unit tests for timeout scenarios
  - TEST: Terminates hung ls process with SIGTERM
  - TEST: Escalates to SIGKILL after grace period
  - TEST: Returns exists: false with timeout error message
```

### Implementation Patterns & Key Details

```typescript
// INPUT VALIDATION PATTERN (conditional skip based on S3 result)
export async function verifyGroundswellSymlink(
  previousResult: GroundswellLocalLinkResult,
  options?: GroundswellSymlinkVerifyOptions
): Promise<GroundswellSymlinkVerifyResult> {
  const { timeout = 5000, projectPath = '/home/dustin/projects/hacky-hack' } = options ?? {};

  const symlinkPath = 'node_modules/groundswell';

  // PATTERN: Conditional execution based on S3 result
  if (!previousResult.success) {
    return {
      exists: false,
      path: symlinkPath,
      lsOutput: '',
      exitCode: null,
      error: `Skipped: Local npm link failed - ${previousResult.message}`,
    };
  }

  // ... continue with spawn execution
}

// SPAWN EXECUTION PATTERN (similar to S2/S3 but different command)
try {
  child = spawn('ls', ['-la', symlinkPath], {
    cwd: projectPath,  // CRITICAL: Use project directory
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,  // CRITICAL: prevents shell injection
  });
} catch (error) {
  return {
    exists: false,
    path: symlinkPath,
    lsOutput: '',
    exitCode: null,
    error: error instanceof Error ? error.message : String(error),
  };
}

// SYMLINK DETECTION PATTERN (NEW - ls output parsing)
// In close event handler, after exitCode === 0 check
child.on('close', (exitCode) => {
  clearTimeout(timeoutId);

  if (exitCode !== 0) {
    return resolve({
      exists: false,
      path: symlinkPath,
      lsOutput: stdout,
      exitCode,
      error: `ls failed with exit code ${exitCode}`,
    });
  }

  // PATTERN: Parse ls output for symlink indicators
  const lines = stdout.trim().split('\n');

  // Skip header line (total ...)
  const entries = lines.slice(1);

  let symlinkFound = false;
  for (const line of entries) {
    const trimmed = line.trim();

    // METHOD 1: Check permission bit (first char is 'l')
    const parts = trimmed.split(/\s+/);
    if (parts.length === 0) continue;
    const hasLinkPermission = parts[0].charAt(0) === 'l';

    // METHOD 2: Check for arrow pattern
    const hasArrow = / -> /.test(trimmed);

    // DUAL DETECTION: Both must be true
    if (hasLinkPermission && hasArrow) {
      symlinkFound = true;
      break;
    }
  }

  resolve({
    exists: symlinkFound,
    path: symlinkPath,
    lsOutput: stdout,
    exitCode,
  });
});

// PROMISE-BASED OUTPUT CAPTURE PATTERN (same as S2/S3)
return new Promise(async resolve => {  // NOTE: async not needed here, no fs operations
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  let killed = false;

  // ... timeout handler (same as S2/S3 but shorter timeout)

  // ... stdout/stderr capture (same as S2/S3)

  // CLOSE EVENT HANDLER with symlink parsing
  child.on('close', (exitCode) => {  // NOTE: Not async, just parsing strings
    clearTimeout(timeoutId);

    if (exitCode !== 0) {
      return resolve({
        exists: false,
        path: symlinkPath,
        lsOutput: stdout,
        exitCode,
        error: `ls failed with exit code ${exitCode}`,
      });
    }

    // PATTERN: Verify symlink by parsing ls output
    const lines = stdout.trim().split('\n');
    const entries = lines.slice(1);  // Skip header

    let symlinkFound = false;
    for (const line of entries) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length === 0) continue;

      const hasLinkPermission = parts[0].charAt(0) === 'l';
      const hasArrow = / -> /.test(trimmed);

      if (hasLinkPermission && hasArrow) {
        symlinkFound = true;
        break;
      }
    }

    resolve({
      exists: symlinkFound,
      path: symlinkPath,
      lsOutput: stdout,
      exitCode,
    });
  });

  // ... error event handler (same as S2/S3)
});
```

### Integration Points

```yaml
INPUT_CONTRACT:
  - from: P1.M1.T1.S3 (linkGroundswellLocally)
  - type: GroundswellLocalLinkResult
  - consume: Check result.success before executing ls verification
  - validate: Skip execution if success is false
  - use: result.message for skip error context

OUTPUT_CONTRACT:
  - to: P1.M1.T1.S5 (run npm list to verify dependency resolution)
  - type: GroundswellSymlinkVerifyResult
  - provide: exists boolean for conditional logic
  - provide: path string for verification path
  - provide: lsOutput for debugging

DEPENDENCIES:
  - import: spawn, ChildProcess from 'node:child_process'
  - import: No fs imports needed (using ls instead of fs.lstat)
  - use: No external dependencies beyond Node.js built-ins

WORKFLOW_INTEGRATION:
  - context: Bug hunt workflow (src/workflows/bug-hunt-workflow.ts)
  - usage: verifyGroundswellSymlink() called after linkGroundswellLocally() succeeds
  - logging: Result.lsOutput logged for debugging
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
# - Happy path: ls succeeds, symlink found with both indicators
# - Conditional skip: skips when S3 result.success is false
# - Spawn errors: handles ENOENT (ls not found), directory not found
# - ls failures: returns exists: false for non-zero exit codes
# - Symlink detection: detects when both permission and arrow present
# - Symlink detection: returns exists: false when indicators missing
# - Timeout: terminates hung ls processes with SIGTERM then SIGKILL
# - Output parsing: correctly skips header line
# - Output parsing: handles empty output gracefully
# - Result structure: returns all expected fields with correct types
```

### Level 3: Integration Testing (System Validation)

```bash
# MANUAL TEST: Verify actual symlink verification functionality
# WARNING: This requires actual npm link from S3

# Step 1: Ensure symlink exists (from S3)
ls -la node_modules/groundswell
# Expected: lrwxrwxrwx ... groundswell -> <global_path>

# Step 2: Execute verification (via programmatic function)
node -e "import('./dist/utils/groundswell-linker.js').then(m => m.verifyGroundswellSymlink({success:true,message:'test'}).then(r => console.log(r)))"

# OR use the actual workflow:
npm run dev -- --prd PRD.md --bug-hunt

# Expected output on success:
# {
#   exists: true,
#   path: "node_modules/groundswell",
#   lsOutput: "total 0\nlrwxrwxrwx 1 user group 18 Jan 14 12:00 groundswell -> /home/user/.nvm/versions/node/v20.x.x/lib/node_modules/groundswell",
#   exitCode: 0
# }

# Step 3: Verify symlink was detected
# The exists field should be true

# Step 4: Test conditional skip (when S3 failed)
# Manually call with success: false and verify exists: false

# Step 5: Test broken symlink scenario
# Manually delete symlink and verify ls exits with non-zero code
```

### Level 4: Creative & Domain-Specific Validation

```bash
# TypeScript type checking for Groundswell imports
npm run typecheck    # Should pass with symlink in place

# Integration with bug hunt workflow
# Run workflow that uses verifyGroundswellSymlink and verify logs
npm run dev -- --prd PRD.md --bug-hunt

# Verify the ls operation shows up in logs with success/failure status

# Test symlink verification edge cases:
# 1. Create a regular file at node_modules/groundswell - should return exists: false
# 2. Create a directory at node_modules/groundswell - should return exists: false
# 3. Test with various ls output formats (different locales)

# Test conditional skip:
# 1. Call with previousResult.success = false - should skip execution
# 2. Verify spawn is never called when skipping
# 3. Verify return exists: false with error message

# Test error scenarios manually:
# 1. Set very short timeout (10ms) and verify SIGTERM/SIGKILL
# 2. Make project directory read-only and verify EACCES handling
```

## Final Validation Checklist

### Technical Validation

- [ ] Implementation added to src/utils/groundswell-linker.ts
- [ ] All Level 1 validation passes (type check, lint)
- [ ] All Level 2 unit tests pass (15+ test scenarios)
- [ ] Implementation follows spawn pattern from linkGroundswell()
- [ ] Input validation skips execution when S3 failed
- [ ] Spawn errors return exists: false result
- [ ] Timeout handling uses SIGTERM then SIGKILL
- [ ] Symlink detection uses dual indicators (permission + arrow)
- [ ] Result structure includes all required fields

### Feature Validation

- [ ] Executes `ls -la node_modules/groundswell` from project directory
- [ ] Returns exists: true when symlink indicators found
- [ ] Returns exists: false when symlink not found or S3 failed
- [ ] Captures stdout for debugging
- [ ] Skips execution when S3 result.success is false
- [ ] Timeout terminates hung processes
- [ ] Parses ls output correctly (skips header, detects indicators)
- [ ] All success criteria from "What" section met

### Code Quality Validation

- [ ] Follows existing linkGroundswell() spawn execution pattern
- [ ] Function naming matches convention (verifyGroundswellSymlink)
- [ ] Interface naming matches convention (GroundswellSymlinkVerifyResult)
- [ ] JSDoc comments are comprehensive
- [ ] Anti-patterns avoided (shell: true, command strings, no timeout)
- [ ] No security vulnerabilities (argument arrays, shell: false)
- [ ] Uses dual symlink detection for reliability

### Documentation & Deployment

- [ ] JSDoc comments explain function behavior
- [ ] Examples in JSDoc are valid TypeScript
- [ ] Error messages are actionable
- [ ] Integration points documented (S3 input, S5 output)
- [ ] Files ready to be committed to git

## Anti-Patterns to Avoid

- **Don't** use `spawn('ls -la node_modules/groundswell')` - must use argument array: `spawn('ls', ['-la', 'node_modules/groundswell'])`
- **Don't** use `shell: true` - prevents shell injection vulnerabilities
- **Don't** skip timeout handling - ls can hang indefinitely in rare cases
- **Don't** ignore spawn errors - handle both sync and async error paths
- **Don't** forget to clear timeout on close/error - prevents memory leaks
- **Don't** skip header line in ls output - will cause parsing errors
- **Don't** use single indicator detection - use both permission and arrow for reliability
- **Don't** execute when S3 failed - always check previousResult.success first
- **Don't** forget to convert Buffer to string in data events
- **Don't** continue capturing data after kill signal
- **Don't** throw errors for ls failures - return exists: false result
- **Don't** use `child.exec()` - deprecated and uses shell

## Implementation Status

**Status**: Research Complete, Ready for Implementation

**Next Steps**:
1. Create implementation tasks from this PRP
2. Implement `verifyGroundswellSymlink()` function in `src/utils/groundswell-linker.ts`
3. Create comprehensive unit tests in `tests/unit/utils/groundswell-linker.test.ts`
4. Run all validation levels
5. Commit files to git with appropriate message
6. Update task status from "Researching" to "Complete"
7. Proceed to S5: Run npm list to verify dependency resolution

---

## Research Notes

### Key Research Findings

From `research/ls-output-parsing-research.md`:
- **ls -la format**: `<permissions> <links> <owner> <group> <size> <date> <time> <name> [-> <target>]`
- **Symlink indicators**: Two reliable detection methods
  1. Permission bit: First character is `l` (e.g., `lrwxrwxrwx`)
  2. Arrow notation: Contains ` -> target` pattern
- **Header line**: First line is `total <number>` - must skip when parsing
- **Parsing strategy**: Split by whitespace, check first char and arrow pattern

From `research/symlink-verification-research.md`:
- **Spawn pattern**: Use argument arrays with `shell: false` for security
- **Timeout handling**: SIGTERM then SIGKILL after 2 second grace period
- **Output capture**: Promise-based with stdout/stderr accumulation
- **Mocking patterns**: Vitest mocks for spawn, fake timers for timeout tests

From S2/S3 PRP and implementation:
- **Conditional execution**: Check previousResult.success before executing
- **Spawn argument array**: `spawn('ls', ['-la', 'node_modules/groundswell'], { shell: false })`
- **Promise-based**: Return Promise that resolves on close/error events
- **Result structure**: Include all diagnostic fields (exitCode, lsOutput, error)

### ls -la Behavior

From research documentation:

1. **Output structure**: One line per entry with 8+ fields
2. **Symlink line format**: `lrwxrwxrwx 1 user group size date time name -> target`
3. **Exit codes**: 0 = success, non-zero = failure
4. **Error cases**: Directory not found (exit code 1 or 2)

### Testing Strategy

From research and existing patterns:
1. **Mock spawn function**: `vi.mock('node:child_process')` with `spawn: vi.fn()`
2. **Mock ChildProcess**: Create realistic mock with stdout/stderr/close events
3. **Conditional skip tests**: Verify spawn is never called when S3 failed
4. **Symlink detection tests**: Mock ls output with various formats
5. **Timeout tests**: Use fake timers, mock ls that never completes

---

**Confidence Score**: 10/10 for one-pass implementation success

**Validation**: This PRP provides complete context including:
- Exact file paths and line numbers to reference
- Specific code patterns to follow from S2/S3 implementation
- Complete ls output parsing patterns from research
- Comprehensive testing patterns from S2/S3 tests
- All spawn execution and timeout handling patterns documented
- Input/output contracts clearly specified
