# Product Requirement Prompt (PRP): P1.M1.T1.S5 - Run npm list to verify dependency resolution

---

## Goal

**Feature Goal**: Verify that the Groundswell package is correctly linked and recognized by npm's dependency resolution system using `npm list groundswell` command.

**Deliverable**: A `verifyGroundswellNpmList()` function in `src/utils/groundswell-linker.ts` that consumes S4's `GroundswellSymlinkVerifyResult`, executes `npm list groundswell --json --depth=0`, parses the JSON output to confirm the package appears in the dependency tree, and returns `NpmListVerifyResult` for S6 to consume.

**Success Definition**:
- Function returns `{ linked: true, version: string }` when npm list shows groundswell in dependencies
- All unit tests pass (30+ tests covering happy path, errors, edge cases)
- Integration with S4 works correctly (conditional execution based on S4's `exists` field)
- Mock-friendly design works with Vitest

---

## User Persona

**Target User**: Developer/Build System (this is an infrastructure task)

**Use Case**: As part of the Groundswell dependency setup workflow, after verifying the symlink exists (S4), the system needs to confirm that npm recognizes the linked package in its dependency tree before proceeding to S6 (documentation).

**User Journey**:
1. S4 verifies symlink exists at `node_modules/groundswell`
2. S5 receives S4's result and checks if `exists: true`
3. If S4 succeeded, S5 executes `npm list groundswell --json --depth=0`
4. S5 parses JSON output to check if `dependencies.groundswell` exists
5. S5 returns `NpmListVerifyResult` with linked status and version
6. S6 consumes S5's result for documentation

**Pain Points Addressed**:
- Detects broken npm link configurations that have valid symlinks but aren't recognized by npm
- Provides final validation that the link is functional from npm's perspective
- Enables early failure before documentation or further steps

---

## Why

- **Infrastructure Reliability**: npm list verification confirms that npm's dependency resolution correctly recognizes the linked package. A symlink may exist but npm may not resolve it properly.
- **S4 Integration**: S5 is the final validation step after S4's symlink verification. Together they provide comprehensive link validation.
- **S6 Preparation**: S6 (documentation) needs confirmation that the link is fully functional before writing setup instructions.
- **Workflow Progression**: Part of the sequential S1-S6 workflow for Groundswell dependency resolution. Each step consumes the previous step's output.

---

## What

### Success Criteria

- [ ] `verifyGroundswellNpmList()` function exists in `src/utils/groundswell-linker.ts`
- [ ] Function consumes S4's `GroundswellSymlinkVerifyResult` as first parameter
- [ ] Function accepts optional `NpmListVerifyOptions` parameter
- [ ] Conditional execution: skips verification if S4's `exists` is `false`
- [ ] Uses spawn() with arguments: `['list', 'groundswell', '--json', '--depth=0']`
- [ ] Parses JSON output to check for `dependencies.groundswell`
- [ ] Returns `NpmListVerifyResult` with all required fields
- [ ] Handles all error cases (ENOENT, timeout, JSON parse errors)
- [ ] Comprehensive test suite with 30+ tests

### User-Visible Behavior

```typescript
// Input: S4's result
const s4Result: GroundswellSymlinkVerifyResult = {
  exists: true,
  path: '/home/dustin/projects/hacky-hack/node_modules/groundswell',
  symlinkTarget: '../../../projects/groundswell',
  message: 'Symlink verified at /home/.../node_modules/groundswell',
  error: undefined,
};

// Call S5
const s5Result = await verifyGroundswellNpmList(s4Result);

// Output: S5's result
console.log(s5Result);
// {
//   linked: true,
//   version: '1.0.0',
//   message: 'npm list confirms groundswell is linked',
//   error: undefined
// }
```

---

## All Needed Context

### Context Completeness Check

This PRP provides:
- Exact file paths and line numbers for all referenced code
- Complete type definitions with all fields
- Exact function signatures and naming conventions
- Test file locations and comprehensive mock patterns
- Validation commands that work in this codebase
- All gotchas and warnings from research
- URLs to npm list documentation with section anchors
- Research documents in P1M1T1S5/research/ directory

### Documentation & References

```yaml
# MUST READ - Implementation patterns and examples
- file: src/utils/groundswell-linker.ts
  why: S3 implementation with spawn() pattern and timeout handling
  pattern: Use spawn() with argument arrays, Promise-based output capture, timeout with SIGTERM/SIGKILL
  critical: "Follow S3's spawn() pattern exactly for consistency"
  lines: 265-352 (linkGroundswell function)
  lines: 412-538 (linkGroundswellLocally function)

- file: src/utils/groundswell-linker.ts
  why: Existing interface patterns for result types
  pattern: Result interfaces with success/linked/message/error fields
  gotcha: "Follow naming convention: Groundswell{Action}Result"

- file: tests/unit/utils/groundswell-linker.test.ts
  why: Comprehensive test patterns for spawn() and mock factories
  pattern: createMockChild() helper, vi.mocked(), fake timers
  critical: "Use vi.mocked() for type-safe mocking in Vitest"
  lines: 60-95 (createMockChild helper)

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S5/research/npm-list-research.md
  why: Complete npm list command research with output formats, parsing strategies, edge cases
  section: "Implementation Recommendations" (lines 1047-1254)
  critical: "Use --json --depth=0 for programmatic parsing"

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S4/PRP.md
  why: S4's PRP defining GroundswellSymlinkVerifyResult contract
  section: "Data Models and Structure" (lines 263-300)
  critical: "S5 consumes S4's output - must match interface exactly"

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/architecture/external_deps.md
  why: Architecture documentation specifying npm list verification approach
  section: "Installation Strategy" (lines 61-93)
  critical: "npm list groundswell should show linked version"

# EXTERNAL REFERENCES
- url: https://docs.npmjs.com/cli/v10/commands/npm-ls
  why: Official npm list command documentation
  critical: "Exit code 0 = found, exit code 1 = not found (with empty JSON)"
  section: "Description" and "Configuration"

- url: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
  why: Official Node.js spawn() documentation
  critical: "shell: false prevents injection, stdio: ['ignore', 'pipe', 'pipe'] for output capture"
  section: "child_process.spawn()"

- url: https://docs.npmjs.com/cli/v10/using-npm/exit-codes
  why: npm exit code reference for error handling
  critical: "Exit code 1 can mean 'not found' or 'error' - must check stderr"
```

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── utils/
│   │   ├── groundswell-verifier.ts      # S1: Verify Groundswell exists
│   │   └── groundswell-linker.ts        # S2+S3+S4: npm link operations
│   └── ...
├── tests/
│   └── unit/
│       └── utils/
│           ├── groundswell-verifier.test.ts
│           └── groundswell-linker.test.ts  # MODIFY - Add S5 tests
├── vitest.config.ts                      # Test configuration
├── package.json
└── tsconfig.json
```

### Desired Codebase Tree with Files to be Added

```bash
hacky-hack/
├── src/
│   ├── utils/
│   │   ├── groundswell-verifier.ts       # EXISTING - S1
│   │   └── groundswell-linker.ts         # MODIFY - Add S5 function
│   └── ...
├── tests/
│   └── unit/
│       └── utils/
│           ├── groundswell-verifier.test.ts     # EXISTING
│           └── groundswell-linker.test.ts       # MODIFY - Add S5 tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Exit code 1 for npm list can mean "not found" (expected) OR "error" (unexpected)
// MUST check stderr content to distinguish
// Exit code 1 with empty/minimal stderr = package not found
// Exit code 1 with error messages = actual error

// CRITICAL: The codebase uses fs/promises (Promise-based), NOT fs callback API
import { spawn } from 'node:child_process'; // CORRECT
import { lstat, readlink } from 'node:fs/promises'; // CORRECT
// import { spawn } from 'child_process'; // DON'T USE - requires full path

// CRITICAL: Use --json format for programmatic parsing
// Default tree format uses Unicode characters (├─, └─) which is brittle
// Command: npm list groundswell --json --depth=0

// CRITICAL: Linked packages may not have 'version' field in JSON output
// Always check for dependencies.groundswell existence first
// 'version' field may be undefined for linked packages

// CRITICAL: Handle NodeJS.ErrnoException type for error.code checking
const errno = error as NodeJS.ErrnoException;
if (errno?.code === 'ENOENT') { /* npm command not found */ }
if (errno?.code === 'EACCES') { /* permission denied */ }

// CRITICAL: S5 is conditional on S4's exists field
if (!previousResult.exists) {
  return {
    linked: false,
    message: `Skipped: Symlink not found - ${previousResult.message}`,
    error: undefined,
  };
}

// PATTERN: Timeout handling with SIGTERM then SIGKILL (from S3)
const timeoutId = setTimeout(() => {
  killed = true;
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
  }, 2000);
}, timeout);

// PATTERN: Stop capturing output after timeout (from S3)
if (child.stdout) {
  child.stdout.on('data', (data: Buffer) => {
    if (killed) return; // CRITICAL: Don't capture after kill
    stdout += data.toString();
  });
}

// GOTCHA: npm list --json output for missing package
// Exit code 1, but stdout contains valid JSON without dependencies.groundswell
// {"version": "0.1.0", "name": "hacky-hack"}
// Must parse JSON and check dependencies object, not just exit code

// GOTCHA: JSON parsing can fail if output is malformed
// Always wrap JSON.parse in try/catch
// Handle both missing packages and parse errors

// GOTCHA: spawn() can throw synchronously (e.g., ENOENT for npm not found)
// Wrap spawn call in try/catch for synchronous errors

// GOTCHA: linked packages show 'resolved' field with file: or local path
// But for this task, we only need to check if package exists in dependencies
// Version detection is nice-to-have, not required for "linked" status
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Result of npm list verification for Groundswell
 *
 * @remarks
 * Returned by verifyGroundswellNpmList() to indicate whether
 * npm list confirms the package is in the dependency tree.
 *
 * @example
 * ```typescript
 * const result = await verifyGroundswellNpmList(s4Result);
 * if (!result.linked) {
 *   console.error(`npm list verification failed: ${result.error}`);
 * }
 * ```
 */
export interface NpmListVerifyResult {
  /** Whether npm list shows groundswell in dependencies */
  linked: boolean;

  /** Version string from npm list (if available, may be undefined for links) */
  version?: string;

  /** Human-readable status message */
  message: string;

  /** Raw stdout from npm list command (for debugging) */
  stdout: string;

  /** Raw stderr from npm list command (for debugging) */
  stderr: string;

  /** Exit code from npm command */
  exitCode: number | null;

  /** Error message if verification failed */
  error?: string;
}

/**
 * Optional configuration for verifyGroundswellNpmList()
 *
 * @remarks
 * Optional configuration for the verifyGroundswellNpmList function.
 */
export interface NpmListVerifyOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;

  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD NpmListVerifyResult and NpmListVerifyOptions interfaces
  - LOCATION: src/utils/groundswell-linker.ts (after GroundswellSymlinkVerifyResult, line 183)
  - IMPLEMENT: NpmListVerifyResult interface
  - IMPLEMENT: NpmListVerifyOptions interface
  - FOLLOW pattern: GroundswellSymlinkVerifyResult (lines 157-183)
  - FIELDS: linked, version?, message, stdout, stderr, exitCode, error?
  - NAMING: CamelCase interfaces, descriptive field names

Task 2: ADD DEFAULT_NPM_LIST_TIMEOUT constant
  - LOCATION: src/utils/groundswell-linker.ts (after constants section, line 205)
  - IMPLEMENT: const DEFAULT_NPM_LIST_TIMEOUT = 10000; // 10 seconds
  - FOLLOW pattern: DEFAULT_LINK_TIMEOUT constant (line 196)
  - NAMING: UPPER_SNAKE_CASE for constants

Task 3: CREATE verifyGroundswellNpmList() function
  - LOCATION: src/utils/groundswell-linker.ts (after verifyGroundswellSymlink, if it exists)
  - IMPLEMENT: async function verifyGroundswellNpmList()
  - SIGNATURE: (previousResult: GroundswellSymlinkVerifyResult, options?: NpmListVerifyOptions) => Promise<NpmListVerifyResult>
  - DEPENDENCIES: Import spawn from 'node:child_process' (already imported on line 26)
  - DEPENDENCIES: Import join from 'node:path' (already imported on line 28)

Task 4: IMPLEMENT conditional execution logic
  - LOCATION: verifyGroundswellNpmList() function body
  - CHECK: if (!previousResult.exists) return early with linked: false
  - FOLLOW pattern: linkGroundswellLocally() conditional execution (lines 400-410)
  - MESSAGE: Include previousResult.message in skip message for debugging

Task 5: IMPLEMENT spawn execution for npm list
  - LOCATION: verifyGroundswellNpmList() function body (after conditional check)
  - USE: child = spawn('npm', ['list', 'groundswell', '--json', '--depth=0'], options)
  - SPAWN_OPTIONS: { cwd: projectPath, stdio: ['ignore', 'pipe', 'pipe'], shell: false }
  - FOLLOW pattern: linkGroundswellLocally() spawn (lines 415-420)
  - CRITICAL: Use argument arrays, NOT string commands

Task 6: IMPLEMENT Promise-based output capture
  - LOCATION: verifyGroundswellNpmList() function body (wrap in new Promise)
  - CAPTURE: stdout and stderr as strings
  - TIMEOUT: Use DEFAULT_NPM_LIST_TIMEOUT (10 seconds)
  - FOLLOW pattern: linkGroundswellLocally() output capture (lines 433-467)
  - STOP_CAPTURE: Don't capture data after kill signal

Task 7: IMPLEMENT JSON parsing logic
  - LOCATION: Promise resolve handler (when exit code is 0 or 1)
  - PARSE: JSON.parse(stdout) to get npm list output
  - CHECK: output.dependencies?.groundswell exists
  - EXTRACT: version from output.dependencies.groundswell.version if available
  - FOLLOW pattern: "Exit Code Handling Strategy" from research (npm-list-research.md lines 633-705)

Task 8: IMPLEMENT error handling
  - LOCATION: Promise resolve/error handlers
  - HANDLE: JSON parse errors (invalid JSON output)
  - HANDLE: spawn synchronous errors (ENOENT for npm not found)
  - HANDLE: timeout errors (SIGTERM then SIGKILL)
  - FOLLOW pattern: linkGroundswellLocally() error handling (lines 421-430, 525-537)

Task 9: EXPORT verifyGroundswellNpmList function
  - LOCATION: src/utils/groundswell-linker.ts (add to existing exports)
  - EXPORT: export async function verifyGroundswellNpmList(...)
  - FOLLOW pattern: Existing exports (linkGroundswell, linkGroundswellLocally)

Task 10: CREATE comprehensive test suite
  - LOCATION: tests/unit/utils/groundswell-linker.test.ts
  - IMPLEMENT: describe('verifyGroundswellNpmList', () => { ... })
  - MOCK: vi.mock('node:child_process') for spawn
  - TESTS: 30+ tests covering all scenarios (see Test Patterns below)
```

### Implementation Patterns & Key Details

```typescript
/**
 * PATTERN: Conditional execution based on previous result
 * Location: Start of verifyGroundswellNpmList()
 */
export async function verifyGroundswellNpmList(
  previousResult: GroundswellSymlinkVerifyResult,
  options?: NpmListVerifyOptions
): Promise<NpmListVerifyResult> {
  const { timeout = DEFAULT_NPM_LIST_TIMEOUT, projectPath = DEFAULT_PROJECT_PATH } =
    options ?? {};

  // PATTERN: Skip if previous step failed (from linkGroundswellLocally)
  if (!previousResult.exists) {
    return {
      linked: false,
      message: `Skipped: Symlink verification failed - ${previousResult.message}`,
      stdout: '',
      stderr: '',
      exitCode: null,
    };
  }

  // PATTERN: Safe spawn execution (from linkGroundswellLocally)
  let child: ChildProcess;

  try {
    child = spawn('npm', ['list', 'groundswell', '--json', '--depth=0'], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });
  } catch (error) {
    return {
      linked: false,
      message: 'Failed to spawn npm list command',
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // PATTERN: Promise-based output capture (from linkGroundswellLocally)
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // PATTERN: Timeout handler with SIGTERM/SIGKILL
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL');
      }, 2000);
    }, timeout);

    // PATTERN: Capture stdout data
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return; // CRITICAL: Stop capturing after kill
        stdout += data.toString();
      });
    }

    // PATTERN: Capture stderr data
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return;
        stderr += data.toString();
      });
    }

    // PATTERN: Handle close event with JSON parsing
    child.on('close', (exitCode) => {
      clearTimeout(timeoutId);

      // PATTERN: Handle exit code 0 or 1 with JSON output
      // Exit code 1 with JSON = package not found (not an error)
      if ((exitCode === 0 || exitCode === 1) && stdout.trim().startsWith('{')) {
        try {
          const output = JSON.parse(stdout);
          const pkgInfo = output.dependencies?.groundswell;

          if (!pkgInfo) {
            resolve({
              linked: false,
              version: undefined,
              message: 'npm list: groundswell not found in dependency tree',
              stdout,
              stderr,
              exitCode,
            });
            return;
          }

          // Package found in dependencies
          resolve({
            linked: true,
            version: pkgInfo.version, // May be undefined for linked packages
            message: 'npm list confirms groundswell is linked',
            stdout,
            stderr,
            exitCode,
          });
          return;
        } catch (parseError) {
          resolve({
            linked: false,
            version: undefined,
            message: 'Failed to parse npm list JSON output',
            stdout,
            stderr,
            exitCode,
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
          return;
        }
      }

      // PATTERN: Exit code 1 without JSON = actual error
      if (exitCode === 1) {
        resolve({
          linked: false,
          version: undefined,
          message: 'npm list failed',
          stdout,
          stderr,
          exitCode,
          error: stderr || 'Unknown error',
        });
        return;
      }

      // PATTERN: Exit code 0 without JSON = unexpected output
      if (exitCode === 0) {
        resolve({
          linked: false,
          version: undefined,
          message: 'npm list succeeded but output is not valid JSON',
          stdout,
          stderr,
          exitCode,
          error: 'Invalid output format',
        });
        return;
      }

      // Other exit codes
      resolve({
        linked: false,
          version: undefined,
        message: `npm list failed with exit code ${exitCode}`,
        stdout,
        stderr,
        exitCode,
        error: stderr || 'Unknown error',
      });
    });

    // PATTERN: Handle spawn errors
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        linked: false,
        version: undefined,
        message: 'npm list command failed',
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}
```

### Integration Points

```yaml
FUNCTION_SIGNATURE:
  - name: verifyGroundswellNpmList
  - parameters: previousResult: GroundswellSymlinkVerifyResult, options?: NpmListVerifyOptions
  - returns: Promise<NpmListVerifyResult>
  - location: src/utils/groundswell-linker.ts

IMPORTS:
  - file: src/utils/groundswell-linker.ts
  - add: No new imports needed (spawn, join already imported)

EXPORTS:
  - file: src/utils/groundswell-linker.ts
  - add: export { verifyGroundswellNpmList, type NpmListVerifyResult, type NpmListVerifyOptions }

WORKFLOW_CONSUMERS:
  - S6: Will consume NpmListVerifyResult
  - Pattern: const s5Result = await verifyGroundswellNpmList(s4Result);

WORKFLOW_PRODUCERS:
  - S4: Provides GroundswellSymlinkVerifyResult
  - Consumes: exists, path, message, error fields
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit src/utils/groundswell-linker.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run ESLint (if configured)
npm run lint -- src/utils/groundswell-linker.ts

# Expected: Zero linting errors.

# Format check (if using Prettier)
npm run format:check -- src/utils/groundswell-linker.ts

# Expected: Code is properly formatted.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test npm list verification function
npm test -- tests/unit/utils/groundswell-linker.test.ts -t "verifyGroundswellNpmList"

# Expected: All S5 tests pass (including existing S2/S3/S4 tests)

# Run with coverage
npm run test:coverage -- tests/unit/utils/groundswell-linker.test.ts

# Expected: 100% coverage for verifyGroundswellNpmList function

# Run all utils tests
npm test -- tests/unit/utils/

# Expected: All tests pass, no regressions in existing code
```

### Level 3: Integration Testing (System Validation)

```bash
# Test the full S1-S5 workflow (requires actual Groundswell link)
# Note: This integration test requires Groundswell to be linked

# Manual verification: Run TypeScript compilation
npx tsc --noEmit

# Expected: Zero compilation errors across entire project

# Verify function is exported correctly
node -e "import('./src/utils/groundswell-linker.ts').then(m => console.log(Object.keys(m)))"

# Expected: verifyGroundswellNpmList appears in exported members

# Test with actual npm list (if Groundswell is linked)
npm list groundswell --json --depth=0

# Expected: JSON output with dependencies.groundswell object
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test npm list output parsing with real npm scenarios
# (requires running in project directory with various package states)

# Scenario 1: Package not found
npm list nonexistent-package-xyz --json --depth=0
# Expected: Exit code 1, JSON without dependencies for that package

# Scenario 2: Package found (use @types/node as example)
npm list @types/node --json --depth=0
# Expected: Exit code 0, JSON with dependencies.@types/node object

# Scenario 3: Check npm list timing
time npm list groundswell --json --depth=0
# Expected: Completes in < 5 seconds on typical projects

# Scenario 4: Verify linked package format (if Groundswell is linked)
npm list groundswell --json --depth=0 | jq '.dependencies.groundswell'
# Expected: Shows resolved field with local path or file: protocol
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/groundswell-linker.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Function is properly exported: `verifyGroundswellNpmList` appears in module exports

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Conditional execution works (skips when S4 exists is false)
- [ ] npm list command executes with correct arguments: `['list', 'groundswell', '--json', '--depth=0']`
- [ ] JSON parsing correctly extracts package information
- [ ] Version field is populated when available
- [ ] All error cases handled (ENOENT, timeout, JSON parse errors)
- [ ] Result interface matches expected contract for S6

### Code Quality Validation

- [ ] Follows existing codebase patterns (naming, structure, error handling)
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (check against Anti-Patterns section)
- [ ] Dependencies properly imported (no new imports needed)
- [ ] Configuration changes properly integrated

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] JSDoc comments present and complete
- [ ] Error messages are informative and actionable
- [ ] Test documentation describes what each test validates

---

## Anti-Patterns to Avoid

- ❌ **Don't use default tree format** - Use `--json` for programmatic parsing
- ❌ **Don't skip conditional execution check** - Must verify `previousResult.exists` before proceeding
- ❌ **Don't use exec() or execSync()** - Use `spawn()` with argument arrays
- ❌ **Don't ignore exit code 1** - Can mean "not found" OR "error" - must check stderr
- ❌ **Don't throw exceptions for normal errors** - Return structured result objects
- ❌ **Don't skip JSON validation** - Always check for `{` before parsing, wrap in try/catch
- ❌ **Don't capture output after kill** - Stop capturing when `killed` flag is set
- ❌ **Don't hardcode project path** - Use DEFAULT_PROJECT_PATH constant with options override
- ❌ **Don't forget to type-check errors** - Use `as NodeJS.ErrnoException` for error.code access
- ❌ **Don't skip mocking in tests** - Always mock spawn for unit tests
- ❌ **Don't use real timers in timeout tests** - Use `vi.useFakeTimers()` for deterministic tests
- ❌ **Don't assume version field exists** - Linked packages may not have version in JSON
- ❌ **Don't parse exit code alone** - Must parse JSON to check if package exists

---

## Test Patterns Reference

### Test Organization Structure

```typescript
describe('verifyGroundswellNpmList', () => {
  const mockProjectPath = '/home/dustin/projects/hacky-hack';
  const mockSymlinkPath = `${mockProjectPath}/node_modules/groundswell`;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ========================================================================
  // Conditional execution tests
  // ========================================================================

  describe('Conditional execution based on S4 result', () => {
    it('should skip verification when previousResult.exists is false', async () => {
      // SETUP: Create S4 result with exists: false
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: false,
        path: mockSymlinkPath,
        message: 'Symlink not found',
        error: 'ENOENT',
      };

      // EXECUTE: Call verifyGroundswellNpmList()
      const result = await verifyGroundswellNpmList(s4Result);

      // VERIFY: linked: false, no spawn() calls
      expect(result.linked).toBe(false);
      expect(spawn).not.toHaveBeenCalled();
      expect(result.message).toContain('Skipped');
    });

    it('should include previousResult.message when skipping', async () => {
      const customMessage = 'Custom S4 error message';
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: false,
        path: mockSymlinkPath,
        message: customMessage,
        error: 'Custom error',
      };

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.message).toContain(customMessage);
    });

    it('should execute npm list when previousResult.exists is true', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        symlinkTarget: '../../../projects/groundswell',
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: {
            groundswell: { version: '1.0.0' },
          },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      await verifyGroundswellNpmList(s4Result);

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['list', 'groundswell', '--json', '--depth=0'],
        expect.anything()
      );
    });
  });

  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Successful npm list verification', () => {
    it('should return linked: true when npm list shows groundswell in dependencies', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const npmOutput = {
        version: '0.1.0',
        name: 'hacky-hack',
        dependencies: {
          groundswell: {
            version: '1.0.0',
            resolved: 'file:../../groundswell',
          },
        },
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify(npmOutput),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(true);
      expect(result.version).toBe('1.0.0');
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain('npm list confirms');
    });

    it('should handle linked packages without version field', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const npmOutput = {
        version: '0.1.0',
        name: 'hacky-hack',
        dependencies: {
          groundswell: {
            resolved: 'file:../../groundswell',
            // version field may be missing for linked packages
          },
        },
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify(npmOutput),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(true);
      expect(result.version).toBeUndefined();
    });

    it('should use default timeout when no options provided', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const resultPromise = verifyGroundswellNpmList(s4Result);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['list', 'groundswell', '--json', '--depth=0'],
        expect.anything()
      );
    });

    it('should accept custom timeout option', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result, { timeout: 5000 });

      expect(result.linked).toBe(true);
    });
  });

  // ========================================================================
  // Package not found tests
  // ========================================================================

  describe('Package not found scenarios', () => {
    it('should return linked: false when package not in dependencies (exit code 1)', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const npmOutput = {
        version: '0.1.0',
        name: 'hacky-hack',
        // dependencies object does not contain groundswell
      };

      const mockChild = createMockChild({
        exitCode: 1,
        stdout: JSON.stringify(npmOutput),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('not found in dependency tree');
    });

    it('should handle empty dependencies object', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const npmOutput = {
        version: '0.1.0',
        name: 'hacky-hack',
        dependencies: {},
      };

      const mockChild = createMockChild({
        exitCode: 1,
        stdout: JSON.stringify(npmOutput),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
    });
  });

  // ========================================================================
  // Spawn error handling tests
  // ========================================================================

  describe('Spawn error handling', () => {
    it('should return linked: false when spawn throws synchronous error', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('ENOENT: npm command not found');
      });

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
      expect(result.exitCode).toBe(null);
      expect(result.error).toContain('npm command not found');
      expect(result.message).toContain('Failed to spawn');
    });

    it('should handle ENOENT (npm not found)', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('ENOENT: npm command not found');
      });

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
      expect(result.error).toContain('ENOENT');
    });

    it('should handle EACCES (permission denied)', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
      expect(result.error).toContain('EACCES');
    });

    it('should return empty stdout/stderr on spawn error', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    });
  });

  // ========================================================================
  // JSON parsing error tests
  // ========================================================================

  describe('JSON parsing errors', () => {
    it('should handle invalid JSON output', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: 'invalid json {{{',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
      expect(result.error).toContain('Failed to parse');
    });

    it('should handle malformed JSON structure', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: '{"incomplete":',
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========================================================================
  // Timeout handling tests
  // ========================================================================

  describe('Timeout handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.useRealTimers(); // Override fake timers from outer beforeEach
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return linked: false when command times out', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      let closeCallback: ((code: number | null) => void) | undefined;

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event: string, callback: (code: number | null) => void) => {
          if (event === 'close') {
            closeCallback = callback;
          }
        }),
        kill: vi.fn((_signal: string) => {
          // Emit close after kill to resolve the promise
          if (closeCallback !== undefined) {
            closeCallback(null);
          }
        }),
        killed: false,
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      // Use a short timeout
      const result = await verifyGroundswellNpmList(s4Result, {
        timeout: 100,
      });

      expect(result.linked).toBe(false);
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should send SIGKILL if SIGTERM does not kill process', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const signals: string[] = [];

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn((_signal: string) => {
          signals.push(_signal);
          // After SIGKILL, emit close to resolve the promise
          if (_signal === 'SIGKILL') {
            const closeCallback = mockChild.on.mock.calls.find(
              (c: unknown[]) => c[0] === 'close'
            )?.[1];
            if (closeCallback !== undefined) closeCallback(null);
          }
        }),
        killed: false, // Property that stays false to trigger SIGKILL
      };

      vi.mocked(spawn).mockReturnValue(mockChild as never);

      const resultPromise = verifyGroundswellNpmList(s4Result, {
        timeout: 50,
      });

      // Wait for timeout + grace period (50ms timeout + 2000ms grace)
      await new Promise(resolve => {
        setTimeout(resolve, 2100);
      });

      const result = await resultPromise;

      expect(signals).toContain('SIGTERM');
      expect(signals).toContain('SIGKILL');
      expect(result.linked).toBe(false);
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('NpmListVerifyResult structure', () => {
    it('should return complete NpmListVerifyResult object', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      // Check result structure
      expect(result).toHaveProperty('linked');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('exitCode');

      // Check types
      expect(typeof result.linked).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');

      // version can be string or undefined
      expect(
        result.version === undefined || typeof result.version === 'string'
      ).toBe(true);

      // exitCode can be number or null
      expect(
        result.exitCode === null || typeof result.exitCode === 'number'
      ).toBe(true);
    });

    it('should include linked: true in result on successful verification', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(true);
    });

    it('should include linked: false in result when package not found', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 1,
        stdout: JSON.stringify({ version: '0.1.0', name: 'hacky-hack' }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
    });

    it('should include optional error property when verification fails', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('Spawn error');
      });

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.error).toBe('Spawn error');
    });

    it('should not include error property on successful verification', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.error).toBeUndefined();
    });
  });

  // ========================================================================
  // Spawn arguments tests
  // ========================================================================

  describe('Spawn arguments', () => {
    it('should spawn npm with list command and correct arguments', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      await verifyGroundswellNpmList(s4Result);

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['list', 'groundswell', '--json', '--depth=0'],
        expect.anything()
      );
    });

    it('should use shell: false to prevent injection', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      await verifyGroundswellNpmList(s4Result);

      const spawnOptions = vi.mocked(spawn).mock.calls[0]?.[2];
      expect(spawnOptions?.shell).toBe(false);
    });

    it('should use stdio ignore, pipe, pipe', async () => {
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        message: 'Symlink verified',
      };

      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      await verifyGroundswellNpmList(s4Result);

      const spawnOptions = vi.mocked(spawn).mock.calls[0]?.[2];
      expect(spawnOptions?.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    });
  });

  // ========================================================================
  // Integration with S4 tests
  // ========================================================================

  describe('Integration with S4', () => {
    it('should support full workflow: S4 then S5', async () => {
      // S4 result - successful symlink verification
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: true,
        path: mockSymlinkPath,
        symlinkTarget: '../../../projects/groundswell',
        message: 'Symlink verified at /home/.../node_modules/groundswell',
      };

      // Mock npm list success
      const mockChild = createMockChild({
        exitCode: 0,
        stdout: JSON.stringify({
          version: '0.1.0',
          name: 'hacky-hack',
          dependencies: { groundswell: { version: '1.0.0' } },
        }),
      });
      vi.mocked(spawn).mockReturnValue(mockChild);

      // S5 (npm list verification) should proceed
      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['list', 'groundswell', '--json', '--depth=0'],
        expect.anything()
      );
    });

    it('should fail fast if S4 symlink verification failed', async () => {
      // S4 result - symlink not found
      const s4Result: GroundswellSymlinkVerifyResult = {
        exists: false,
        path: mockSymlinkPath,
        message: 'Symlink not found: ENOENT',
        error: 'ENOENT',
      };

      // S5 should skip without calling spawn
      const result = await verifyGroundswellNpmList(s4Result);

      expect(result.linked).toBe(false);
      expect(result.message).toContain('Skipped');
      expect(spawn).not.toHaveBeenCalled();
    });
  });
});
```

---

## Confidence Score

**Overall Confidence: 9/10**

**Reasoning:**
- Comprehensive research documented in P1M1T1S5/research/npm-list-research.md (36KB, 1500 lines)
- Clear patterns established in S1-S4 implementations
- npm list command is well-documented with stable output format
- Test patterns are consistent across the codebase (30+ tests pattern from groundswell-linker.test.ts)
- Spawn patterns are proven in existing groundswell-linker.ts implementation
- JSON parsing approach is reliable and well-tested

**Risk Mitigation:**
- All code patterns verified against existing implementations
- Test patterns match existing groundswell-linker.test.ts structure
- Error handling follows established conventions (S3's timeout pattern, S4's conditional pattern)
- Type safety ensured through TypeScript
- npm list --json output is stable across npm versions

**Uncertainties:**
- Integration with S6 is out of scope for this PRP
- Actual behavior when Groundswell is not linked (will be tested during implementation)

---

## Appendix: Quick Reference

### Key File Locations

| File | Purpose | Key Content |
|------|---------|-------------|
| `src/utils/groundswell-linker.ts` | Implementation | Add verifyGroundswellNpmList() function |
| `tests/unit/utils/groundswell-linker.test.ts` | Tests | Add S5 test suite |

### Import Statement

```typescript
import { spawn, type ChildProcess } from 'node:child_process';
// Already imported in groundswell-linker.ts (line 26)
```

### Function Signature

```typescript
export async function verifyGroundswellNpmList(
  previousResult: GroundswellSymlinkVerifyResult,
  options?: NpmListVerifyOptions
): Promise<NpmListVerifyResult>
```

### Critical Constants

```typescript
const DEFAULT_NPM_LIST_TIMEOUT = 10000; // 10 seconds (add to file)
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack'; // Already exists
```

### npm List Command

```bash
npm list groundswell --json --depth=0
```

### Expected JSON Output Structure

```json
{
  "version": "0.1.0",
  "name": "hacky-hack",
  "dependencies": {
    "groundswell": {
      "version": "1.0.0",
      "resolved": "file:../../groundswell"
    }
  }
}
```

---

**End of PRP for P1.M1.T1.S5**
