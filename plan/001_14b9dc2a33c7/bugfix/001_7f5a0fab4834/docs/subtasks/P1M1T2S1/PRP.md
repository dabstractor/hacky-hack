# PRP: P1.M1.T2.S1 - Run TypeScript Typecheck Command

---

## Goal

**Feature Goal**: Add a `runTypecheck()` function that executes `npm run typecheck` (which runs `tsc --noEmit`), captures stdout/stderr, parses TypeScript errors from stderr, counts errors, detects common patterns like TS2307 "Cannot find module", and returns a structured result.

**Deliverable**: A new file `src/utils/typescript-checker.ts` containing:
1. `TypeScriptCheckResult` interface with `success`, `errorCount`, `errors[]`, `message`, `stdout`, `stderr`, `exitCode`, `error?`
2. `TypeScriptError` interface with `file`, `line`, `column`, `code`, `message`
3. `runTypecheck()` function that spawns `npm run typecheck`, captures output, parses errors
4. `parseTypeScriptErrors()` helper function with regex pattern matching
5. `hasModuleNotFoundError()` helper to detect TS2307 errors
6. Comprehensive unit tests in `tests/unit/utils/typescript-checker.test.ts`

**Success Definition**:
- `runTypecheck()` function executes `npm run typecheck` successfully
- Stdout and stderr are captured as strings
- TypeScript errors are parsed from stderr using regex pattern
- Error count is accurate
- TS2307 "Cannot find module" errors are detected
- Timeout handling uses SIGTERM then SIGKILL pattern
- Unit tests cover: happy path (no errors), with errors, module not found, timeout, spawn failure
- All tests pass with 100% coverage

## User Persona

**Target User**: Developers and CI/CD pipelines that need to programmatically verify TypeScript compilation status after making dependency changes (e.g., after Groundswell npm link).

**Use Case**: After completing P1.M1.T1 (Groundswell npm link), run TypeScript typecheck to verify that:
1. The Groundswell module is now resolvable
2. No new TypeScript errors were introduced
3. Existing TypeScript errors are cataloged for analysis in S2

**User Journey**:
1. System completes Groundswell npm link (P1.M1.T1)
2. System calls `runTypecheck()` to verify TypeScript compilation
3. Function executes `npm run typecheck` and captures output
4. Errors are parsed and counted
5. S2 (Analyze remaining TypeScript errors) consumes the result

**Pain Points Addressed**:
- Without automated typecheck, developers must manually run `npm run typecheck` after linking
- Manual verification doesn't provide structured error data for downstream analysis
- No programmatic way to detect if "Cannot find module" errors persist after linking

## Why

- **Business Value**: Automates the verification step after Groundswell linking; provides structured error data for analysis; enables CI/CD integration
- **Integration**: Completes P1.M1.T2 (Verify TypeScript compilation after Groundswell link) by providing the raw typecheck execution
- **Problems This Solves**:
  - Manual typecheck verification is error-prone and not automatable
  - No structured error data for downstream analysis (S2 needs error count and patterns)
  - No programmatic detection of module-not-found errors (TS2307)

## What

Add a `runTypecheck()` function to a new file `src/utils/typescript-checker.ts` that:

1. **Spawns `npm run typecheck`**: Uses child_process.spawn with argument arrays, shell: false
2. **Captures stdout/stderr**: As strings, with timeout handling
3. **Parses TypeScript errors**: From stderr using regex pattern `/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/`
4. **Counts errors**: Returns accurate error count
5. **Detects patterns**: Specifically TS2307 "Cannot find module" errors
6. **Returns structured result**: TypeScriptCheckResult with all fields populated

### Success Criteria

- [ ] `runTypecheck()` function exists in `src/utils/typescript-checker.ts`
- [ ] Function returns `TypeScriptCheckResult` interface
- [ ] Executes `npm run typecheck` via spawn with shell: false
- [ ] Captures stdout and stderr as strings
- [ ] Parses TypeScript errors from stderr using regex
- [ ] Returns accurate error count
- [ ] Detects TS2307 "Cannot find module" errors
- [ ] Implements timeout escalation (SIGTERM then SIGKILL)
- [ ] Handles spawn failures (ENOENT, EACCES)
- [ ] Unit tests cover all paths (happy, errors, timeout, spawn failure)
- [ ] All tests pass with 100% coverage
- [ ] JSDoc documentation with examples

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:
- Exact file paths and line numbers for spawn patterns to follow
- Complete interface definitions with TypeScript syntax
- TypeScript compiler error output format with regex pattern
- Testing patterns with mock ChildProcess examples
- Timeout escalation pattern with exact code snippet
- External documentation URLs for TypeScript compiler

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: /home/dustin/projects/hacky-hack/src/utils/groundswell-linker.ts
  why: Primary reference for spawn execution, timeout handling, result interfaces
  pattern: Lines 766-770 (spawn call), 789-798 (timeout escalation), 801-814 (stdout/stderr capture), 200-221 (result interface)
  gotcha: Always use shell: false with argument arrays; use SIGTERM then SIGKILL with 2-second grace

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/groundswell-linker.test.ts
  why: Testing patterns for spawn-based utilities
  pattern: createMockChild helper, vi.mocked(spawn) usage, ENOENT/EACCES error tests
  gotcha: Use vi.useRealTimers() for timeout tests; mock ChildProcess with stdout.on, stderr.on, on, kill, killed

- url: https://www.typescriptlang.org/docs/handbook/compiler-options.html
  why: Official TypeScript compiler options documentation
  critical: --noEmit flag for type checking without emitting files

- url: https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
  why: Complete list of TypeScript error codes (TSXXXX)
  critical: TS2307 = "Cannot find module", TS2322 = Type not assignable, TS2345 = Type mismatch

- url: https://nodejs.org/api/child_process.html#child_processspawnscommandargs-options
  why: Official Node.js spawn documentation
  critical: stdio: ['ignore', 'pipe', 'pipe'] for capturing stdout/stderr; shell: false for security

- file: /home/dustin/projects/hacky-hack/package.json
  why: Contains npm script definition for typecheck
  section: Line 22: "typecheck": "tsc --noEmit"
  gotcha: Must run via npm, not tsc directly (ensures correct tsconfig.json is used)

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T2S1/research/compile-research-summary.md
  why: Consolidated research summary with all patterns and code snippets
  section: Complete reference for spawn patterns, result interfaces, error parsing regex, testing mocks
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── package.json                      # Contains "typecheck": "tsc --noEmit" script
├── src/
│   ├── utils/
│   │   ├── groundswell-linker.ts     # REFERENCE: Spawn patterns, result interfaces
│   │   └── typescript-checker.ts     # CREATE: New file for typecheck utilities
│   └── ...
├── tests/
│   └── unit/
│       └── utils/
│           ├── groundswell-linker.test.ts  # REFERENCE: Testing patterns
│           └── typescript-checker.test.ts  # CREATE: Tests for runTypecheck()
├── tsconfig.json                     # TypeScript compiler configuration
└── vitest.config.ts                  # Test configuration
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   └── utils/
│       ├── groundswell-linker.ts     # EXISTING - Reference for patterns
│       └── typescript-checker.ts     # CREATE - runTypecheck(), TypeScriptCheckResult, TypeScriptError
└── tests/
    └── unit/
        └── utils/
            ├── groundswell-linker.test.ts  # EXISTING - Reference for test patterns
            └── typescript-checker.test.ts  # CREATE - Test suite for runTypecheck()
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: npm run typecheck runs tsc --noEmit via npm, NOT tsc directly
// This ensures the correct tsconfig.json and project context are used
const TYPECHECK_COMMAND = 'npm';
const TYPECHECK_ARGS = ['run', 'typecheck'];  // NOT ['tsc', '--noEmit']

// CRITICAL: TypeScript errors go to stderr, NOT stdout
// tsc writes all error messages to stderr
// PATTERN: Check stderr for error parsing, not stdout

// CRITICAL: TypeScript exit codes are specific
// Exit code 0 = success (no errors)
// Exit code 2 = errors found
// Exit code 1 = compiler error (rare, usually tsc misconfiguration)

// CRITICAL: Use shell: false with argument arrays for security
// Prevents shell injection vulnerabilities
spawn('npm', ['run', 'typecheck'], {
  cwd: projectPath,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false,  // ALWAYS false
});

// CRITICAL: Timeout escalation pattern - SIGTERM then SIGKILL
// Give process 2 seconds to clean up after SIGTERM
setTimeout(() => {
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 2000);  // 2-second grace period
}, timeout);

// CRITICAL: Guard against data capture after kill
// Stop capturing stdout/stderr after timeout kill signal
if (killed) return;  // In data event handlers

// GOTCHA: npm run typecheck may include ANSI color codes in output
// The npm script doesn't use --pretty false, so output may have formatting codes
// Consider stripping ANSI codes or using regex that tolerates them

// GOTCHA: TypeScript error format is very consistent but file paths may vary
// Relative paths: src/test.ts(10,5): error TS2307: ...
// Absolute paths: /home/user/project/src/test.ts(10,5): error TS2307: ...
// Regex must handle both: /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/

// CRITICAL: TS2307 is the "Cannot find module" error code
// This is the key error to detect for Groundswell link verification
// Pattern: TS2307.*Cannot find module
```

## Implementation Blueprint

### Data Models and Structure

Create the core data models to ensure type safety and consistency.

```typescript
/**
 * Represents a single TypeScript compiler error parsed from tsc output.
 *
 * @remarks
 * Parsed from stderr output using the pattern:
 * file_path(line,column): error TSXXXX: error_message
 *
 * @example
 * // Parsed from: src/test.ts(10,5): error TS2307: Cannot find module 'lodash'
 * {
 *   file: 'src/test.ts',
 *   line: 10,
 *   column: 5,
 *   code: 'TS2307',
 *   message: "Cannot find module 'lodash' or its corresponding type declarations."
 * }
 */
export interface TypeScriptError {
  /** Absolute or relative path to the file with the error */
  file: string;

  /** Line number where the error occurs (1-indexed) */
  line: number;

  /** Column number where the error occurs (1-indexed) */
  column: number;

  /** TypeScript error code (e.g., "TS2307", "TS2322", "TS2345") */
  code: string;

  /** Full error message from the compiler */
  message: string;
}

/**
 * Result type for runTypecheck() function.
 *
 * @remarks
 * Contains the complete output from npm run typecheck plus parsed error data.
 * Success is determined by exitCode === 0 (no errors).
 *
 * @example
 * // Success case - no TypeScript errors
 * {
 *   success: true,
 *   errorCount: 0,
 *   errors: [],
 *   message: 'TypeScript compilation successful',
 *   stdout: '',
 *   stderr: '',
 *   exitCode: 0
 * }
 *
 * @example
 * // Error case - TypeScript errors found
 * {
 *   success: false,
 *   errorCount: 2,
 *   errors: [
 *     { file: 'src/test.ts', line: 10, column: 5, code: 'TS2307', message: '...' },
 *     { file: 'src/utils.ts', line: 14, column: 35, code: 'TS2322', message: '...' }
 *   ],
 *   message: 'TypeScript compilation failed with 2 errors',
 *   stdout: '',
 *   stderr: 'src/test.ts(10,5): error TS2307: ...\nsrc/utils.ts(14,35): error TS2322: ...',
 *   exitCode: 2
 * }
 */
export interface TypeScriptCheckResult {
  /** Whether typecheck passed (exitCode === 0 and errorCount === 0) */
  success: boolean;

  /** Total number of TypeScript errors found */
  errorCount: number;

  /** Parsed TypeScript errors (empty array if no errors) */
  errors: TypeScriptError[];

  /** Human-readable status message */
  message: string;

  /** Raw stdout from npm run typecheck command (for debugging) */
  stdout: string;

  /** Raw stderr from npm run typecheck command (contains error output) */
  stderr: string;

  /** Exit code from npm command (0 = success, 2 = TypeScript errors, 1 = compiler error) */
  exitCode: number | null;

  /** Error message if command execution failed (spawn failure, timeout, etc.) */
  error?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/typescript-checker.ts
  - ADD: TypeScriptError interface
  - ADD: TypeScriptCheckResult interface
  - ADD: TypeScriptCheckOptions interface (optional timeout parameter)
  - IMPORT: { spawn } from 'node:child_process'
  - CONSTANT: DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack'
  - CONSTANT: DEFAULT_TYPECHECK_TIMEOUT = 30000 (30 seconds - tsc can be slow)
  - JSDOC: Include complete documentation with @example and @remarks

Task 2: IMPLEMENT parseTypeScriptErrors() helper function
  - SIGNATURE: function parseTypeScriptErrors(stderr: string): TypeScriptError[]
  - PATTERN: Line-by-line parsing with regex matching
  - REGEX: /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/
  - HANDLE: Empty stderr returns empty array
  - HANDLE: Lines that don't match pattern are ignored (not errors)
  - RETURN: Array of TypeScriptError objects
  - LOCATION: src/utils/typescript-checker.ts

Task 3: IMPLEMENT hasModuleNotFoundError() helper function
  - SIGNATURE: function hasModuleNotFoundError(errors: TypeScriptError[]): boolean
  - PATTERN: Array.some() to check for TS2307 errors
  - CHECK: error.code === 'TS2307' AND error.message.includes('Cannot find module')
  - RETURN: true if any module-not-found errors detected
  - LOCATION: src/utils/typescript-checker.ts

Task 4: IMPLEMENT runTypecheck() core function structure
  - SIGNATURE: async function runTypecheck(options?: TypeScriptCheckOptions): Promise<TypeScriptCheckResult>
  - PARAMETER: options with optional timeout field
  - DESTRUCTURE: timeout = options?.timeout ?? DEFAULT_TYPECHECK_TIMEOUT
  - LOCATION: src/utils/typescript-checker.ts

Task 5: IMPLEMENT spawn execution in runTypecheck()
  - PATTERN: Follow groundswell-linker.ts lines 766-770
  - COMMAND: spawn('npm', ['run', 'typecheck'], { cwd: DEFAULT_PROJECT_PATH, stdio: ['ignore', 'pipe', 'pipe'], shell: false })
  - TRY-CATCH: Wrap spawn call for synchronous errors (ENOENT, EACCES)
  - ON CATCH: Return { success: false, errorCount: 0, errors: [], message: 'Failed to spawn npm run typecheck', stdout: '', stderr: '', exitCode: null, error: ... }

Task 6: IMPLEMENT stdout/stderr capture in runTypecheck()
  - PATTERN: Follow groundswell-linker.ts lines 801-814
  - DECLARE: let stdout = '', stderr = '', killed = false
  - STDOUT: child.stdout?.on('data', (data: Buffer) => { if (killed) return; stdout += data.toString(); })
  - STDERR: child.stderr?.on('data', (data: Buffer) => { if (killed) return; stderr += data.toString(); })
  - CLEANUP: Clear timeout on child.on('close', ...)

Task 7: IMPLEMENT timeout escalation in runTypecheck()
  - PATTERN: Follow groundswell-linker.ts lines 789-798
  - TIMEOUT: setTimeout(() => { killed = true; child.kill('SIGTERM'); setTimeout(() => { if (!child.killed) child.kill('SIGKILL'); }, 2000); }, timeout)
  - CLEANUP: clearTimeout(timeoutId) in child.on('close') handler

Task 8: IMPLEMENT async spawn error handling in runTypecheck()
  - PATTERN: Follow groundswell-linker.ts lines 904-915
  - HANDLER: child.on('error', (_error: Error) => { clearTimeout(timeoutId); resolve({ ... error: _error.message }); })
  - PREVENT: Multiple resolve() calls (use resolved flag)

Task 9: IMPLEMENT result assembly in runTypecheck()
  - PATTERN: Follow groundswell-linker.ts close handler (lines 817-830)
  - PARSE: const errors = parseTypeScriptErrors(stderr)
  - COUNT: const errorCount = errors.length
  - SUCCESS: const success = exitCode === 0 && errorCount === 0
  - MESSAGE: success ? 'TypeScript compilation successful' : `TypeScript compilation failed with ${errorCount} errors`
  - RETURN: TypeScriptCheckResult with all fields populated

Task 10: ADD comprehensive JSDoc documentation to runTypecheck()
  - INCLUDE: @param for options parameter
  - INCLUDE: @returns Promise<TypeScriptCheckResult> description
  - INCLUDE: @example showing happy path and error path
  - INCLUDE: @remarks explaining timeout escalation and error parsing
  - INCLUDE: @see references to parseTypeScriptErrors and hasModuleNotFoundError

Task 11: EXPORT all interfaces and functions
  - EXPORT: TypeScriptError interface
  - EXPORT: TypeScriptCheckResult interface
  - EXPORT: TypeScriptCheckOptions interface
  - EXPORT: runTypecheck function (default export or named export)
  - EXPORT: parseTypeScriptErrors function (named export for testing)
  - EXPORT: hasModuleNotFoundError function (named export for testing)

Task 12: CREATE tests/unit/utils/typescript-checker.test.ts
  - CREATE: New test file for typescript-checker utilities
  - IMPORT: runTypecheck, parseTypeScriptErrors, hasModuleNotFoundError, TypeScriptError, TypeScriptCheckResult
  - IMPORT: { spawn } from 'node:child_process', ChildProcess type
  - IMPORT: vi, expect, describe, it, beforeEach from 'vitest'
  - MOCK: vi.mock('node:child_process', () => ({ spawn: vi.fn() }))

Task 13: IMPLEMENT createMockChild helper in test file
  - PATTERN: Follow groundswell-linker.test.ts mock pattern
  - PARAMETERS: { exitCode?: number | null, stdout?: string, stderr?: string }
  - RETURN: Mock ChildProcess with stdout.on, stderr.on, on, kill, killed
  - ASYNC: Use setTimeout to emit data asynchronously (5-10ms delay)

Task 14: IMPLEMENT happy path test (no TypeScript errors)
  - ARRANGE: Mock spawn to return child with exitCode: 0, stderr: ''
  - ACT: await runTypecheck()
  - ASSERT: result.success === true
  - ASSERT: result.errorCount === 0
  - ASSERT: result.errors.length === 0
  - ASSERT: result.exitCode === 0

Task 15: IMPLEMENT error path test (TypeScript errors present)
  - ARRANGE: Mock spawn to return child with exitCode: 2, stderr with 2 errors
  - STUB: stderr = 'src/test.ts(10,5): error TS2307: Cannot find module\nsrc/utils.ts(14,35): error TS2322: Type not assignable'
  - ACT: await runTypecheck()
  - ASSERT: result.success === false
  - ASSERT: result.errorCount === 2
  - ASSERT: result.errors.length === 2
  - ASSERT: result.errors[0].code === 'TS2307'
  - ASSERT: result.exitCode === 2

Task 16: IMPLEMENT module not found test (TS2307 detection)
  - ARRANGE: Mock spawn with stderr containing TS2307 error
  - STUB: stderr = 'src/test.ts(10,5): error TS2307: Cannot find module '"'"'groundswell'"'"' or its corresponding type declarations.'
  - ACT: const result = await runTypecheck()
  - ASSERT: result.errorCount > 0
  - ASSERT: hasModuleNotFoundError(result.errors) === true
  - ASSERT: result.errors.some(e => e.code === 'TS2307' && e.message.includes('Cannot find module'))

Task 17: IMPLEMENT timeout test
  - ARRANGE: Mock spawn to return child that never emits 'close'
  - ACT: await runTypecheck({ timeout: 100 })
  - WAIT: await new Promise(resolve => setTimeout(resolve, 150))
  - ASSERT: result.success === false
  - ASSERT: mockChild.kill called with 'SIGTERM'
  - ASSERT: result.error includes 'timeout' or 'killed'

Task 18: IMPLEMENT spawn failure tests
  - TEST: ENOENT (npm not found) - mockImplementation throws 'ENOENT'
  - TEST: EACCES (permission denied) - mockImplementation throws 'EACCES'
  - ASSERT: result.success === false
  - ASSERT: result.exitCode === null
  - ASSERT: result.error contains error code

Task 19: IMPLEMENT parseTypeScriptErrors unit tests
  - TEST: Empty stderr returns empty array
  - TEST: Single error parsed correctly
  - TEST: Multiple errors parsed correctly
  - TEST: Non-error lines ignored
  - TEST: Relative paths handled
  - TEST: Absolute paths handled

Task 20: IMPLEMENT hasModuleNotFoundError unit tests
  - TEST: Returns false for empty array
  - TEST: Returns false for non-TS2307 errors
  - TEST: Returns true for TS2307 with "Cannot find module"
  - TEST: Returns true when mixed errors include TS2307

Task 21: VERIFY all tests pass with 100% coverage
  - RUN: npm test -- tests/unit/utils/typescript-checker.test.ts
  - VERIFY: All tests pass
  - CHECK: Coverage is 100% for typescript-checker.ts
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Error parsing regex - handles both relative and absolute paths
const TS_ERROR_PATTERN = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

function parseTypeScriptErrors(stderr: string): TypeScriptError[] {
  const lines = stderr.trim().split('\n');
  const errors: TypeScriptError[] = [];

  for (const line of lines) {
    const match = line.match(TS_ERROR_PATTERN);
    if (match) {
      errors.push({
        file: match[1],      // e.g., "src/test.ts" or "/home/user/project/src/test.ts"
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],      // e.g., "TS2307"
        message: match[5],   // Full error message
      });
    }
  }

  return errors;
}

// PATTERN: Module not found detection
function hasModuleNotFoundError(errors: TypeScriptError[]): boolean {
  return errors.some(
    e => e.code === 'TS2307' && e.message.includes('Cannot find module')
  );
}

// PATTERN: Complete runTypecheck implementation
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack';
const DEFAULT_TYPECHECK_TIMEOUT = 30000; // 30 seconds

export interface TypeScriptCheckOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export async function runTypecheck(
  options: TypeScriptCheckOptions = {}
): Promise<TypeScriptCheckResult> {
  const timeout = options.timeout ?? DEFAULT_TYPECHECK_TIMEOUT;
  const projectPath = DEFAULT_PROJECT_PATH;

  let child: ChildProcess;
  let stdout = '';
  let stderr = '';
  let killed = false;
  let resolved = false;

  // PATTERN: Try-catch for synchronous spawn errors (ENOENT, EACCES)
  try {
    child = spawn('npm', ['run', 'typecheck'], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });
  } catch (error) {
    return {
      success: false,
      errorCount: 0,
      errors: [],
      message: 'Failed to spawn npm run typecheck',
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return new Promise(resolve => {
    // PATTERN: Timeout escalation with SIGTERM then SIGKILL
    const timeoutId = setTimeout(() => {
      if (resolved) return;
      killed = true;
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000); // 2-second grace period
    }, timeout);

    // PATTERN: Stdout capture with kill guard
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return; // CRITICAL: Stop capturing after kill
        stdout += data.toString();
      });
    }

    // PATTERN: Stderr capture with kill guard
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return; // CRITICAL: Stop capturing after kill
        stderr += data.toString();
      });
    }

    // PATTERN: Async spawn error handler
    child.on('error', (_error: Error) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);

      resolve({
        success: false,
        errorCount: 0,
        errors: [],
        message: 'npm run typecheck command failed',
        stdout,
        stderr,
        exitCode: null,
        error: _error.message,
      });
    });

    // PATTERN: Close handler - assemble result
    child.on('close', (exitCode: number | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);

      // Parse TypeScript errors from stderr
      const errors = parseTypeScriptErrors(stderr);
      const errorCount = errors.length;
      const success = exitCode === 0 && errorCount === 0;

      resolve({
        success,
        errorCount,
        errors,
        message: success
          ? 'TypeScript compilation successful'
          : `TypeScript compilation failed with ${errorCount} error${errorCount === 1 ? '' : 's'}`,
        stdout,
        stderr,
        exitCode,
      });
    });
  });
}
```

### Integration Points

```yaml
NPM_SCRIPT:
  - command: "npm run typecheck"
  - definition: package.json line 22: "typecheck": "tsc --noEmit"
  - note: "Must run via npm to use correct tsconfig.json context"

CHILD_PROCESS:
  - module: "node:child_process"
  - function: "spawn(command, args, options)"
  - options: "{ cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false }"

P1_M1_T2_S2_CONSUMPTION:
  - input: "TypeScriptCheckResult from runTypecheck()"
  - fields: "errorCount, errors[], success"
  - usage: "S2 will analyze remaining errors and categorize them"

TEST_FRAMEWORK:
  - tool: "vitest"
  - mocking: "vi.mock('node:child_process')"
  - patterns: "createMockChild helper, vi.mocked(spawn)"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- src/utils/typescript-checker.ts   # Lint the new file
npm run typecheck                                 # Type check entire project
npm run format -- src/utils/typescript-checker.ts # Format with Prettier

# Project-wide validation
npm run lint                                      # Lint all source files
npm run typecheck                                 # Type check entire project
npm run format                                    # Format all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common TypeScript errors to watch for:
# - TS2307: Cannot find module 'node:child_process' -> import from 'node:child_process'
# - TS2582: Cannot find name 'describe' -> import from 'vitest'
# - TS2345: Type 'Buffer' is not assignable -> Use data.toString() for string conversion
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new function specifically
npm test -- tests/unit/utils/typescript-checker.test.ts

# Test all utils
npm test -- tests/unit/utils/

# Full test suite
npm test -- tests/unit/

# Coverage validation (100% required)
npm run test:coverage -- tests/unit/utils/typescript-checker.test.ts

# Expected: All tests pass. Look for:
# - PASS tests/unit/utils/typescript-checker.test.ts (new tests)
# - Coverage: 100% for typescript-checker.ts

# If failing, debug root cause:
# - Check mock setup (vi.mock, vi.fn, mockReturnValue)
# - Verify async/await handling (use async test functions)
# - Check setTimeout usage in createMockChild
# - Verify regex pattern matches actual tsc output
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test: Run actual typecheck
npm run typecheck

# Expected output if no errors: (no output, exit code 0)

# Expected output if errors exist:
# src/file.ts(line,column): error TSXXXX: error message
# (Exit code: 2)

# Test with actual TypeScript errors (intentional error for testing)
echo "export const x: string = 123;" > /tmp/test-error.ts
npm run typecheck 2>&1 | grep -q "error TS2322" && echo "Error detection works"

# Test the runTypecheck function directly
node -e "
const { runTypecheck } = require('./dist/utils/typescript-checker.js');
runTypecheck().then(result => {
  console.log('Success:', result.success);
  console.log('Error count:', result.errorCount);
  console.log('Exit code:', result.exitCode);
  console.log('Errors:', JSON.stringify(result.errors, null, 2));
});
"

# Expected: Function executes and returns structured result

# Test timeout behavior (simulate hanging tsc)
# Create a test that spawns a long-running process and verify timeout works

# Expected: Timeout triggers SIGTERM then SIGKILL, function returns with error
```

### Level 4: Creative & Domain-Specific Validation

```bash
# TypeScript Error Pattern Validation:

# 1. Test with real TypeScript error output
# Intentionally introduce a type error
cat > /tmp/ts-test.ts << 'EOF'
import express from 'express';  // TS2307: Cannot find module
const x: string = 123;          // TS2322: Type mismatch
EOF

# Run tsc and verify error format
tsc --noEmit /tmp/ts-test.ts 2>&1

# Expected output:
# /tmp/ts-test.ts(1,22): error TS2307: Cannot find module 'express' or its corresponding type declarations.
# /tmp/ts-test.ts(2,7): error TS2322: Type 'number' is not assignable to type 'string'.

# 2. Verify regex pattern matches
node -e "
const output = \`/tmp/ts-test.ts(1,22): error TS2307: Cannot find module 'express' or its corresponding type declarations.\`;
const pattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
const match = output.match(pattern);
console.log('Match:', match);
console.log('Code:', match[4]);
console.log('Message:', match[5]);
"

# Expected: Regex captures all 5 groups

# 3. Test module-not-found detection specifically
# Verify TS2307 errors are correctly identified
node -e "
const errors = [
  { code: 'TS2307', message: \"Cannot find module 'groundswell'\" },
  { code: 'TS2322', message: \"Type 'number' is not assignable to type 'string'\" },
];
const hasModuleNotFound = errors.some(
  e => e.code === 'TS2307' && e.message.includes('Cannot find module')
);
console.log('Has module not found:', hasModuleNotFound);
"

# Expected: true

# 4. Test error counting accuracy
# Create a file with exactly 5 TypeScript errors
# Run typecheck and verify errorCount === 5

# 5. Test stderr vs stdout behavior
# Verify that TypeScript errors go to stderr, not stdout
npm run typecheck 1> /tmp/tsc-stdout.txt 2> /tmp/tsc-stderr.txt
echo "=== STDOUT ===" && cat /tmp/tsc-stdout.txt
echo "=== STDERR ===" && cat /tmp/tsc-stderr.txt

# Expected: stderr contains errors, stdout is empty

# 6. Test with actual Groundswell link scenario
# After running P1.M1.T1, verify typecheck succeeds
npm run typecheck && echo "Groundswell link verified - no TS2307 errors"

# Expected: No TS2307 errors for groundswell module

# 7. Performance validation
# Measure typecheck execution time
time npm run typecheck

# Expected: Completes within 30 seconds (default timeout)

# 8. Edge case validation
# - Empty project (no TS files)
# - Project with only .d.ts files
# - Project with circular dependencies

# Expected: All edge cases handled without hanging
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/typescript-checker.test.ts`
- [ ] No linting errors: `npm run lint -- src/utils/typescript-checker.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format -- src/utils/typescript-checker.ts --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] `runTypecheck()` function exists in `src/utils/typescript-checker.ts`
- [ ] Returns `TypeScriptCheckResult` with all required fields
- [ ] Executes `npm run typecheck` via spawn with shell: false
- [ ] Captures stdout and stderr as strings
- [ ] Parses TypeScript errors using regex pattern
- [ ] Returns accurate error count
- [ ] Detects TS2307 "Cannot find module" errors via `hasModuleNotFoundError()`
- [ ] Implements timeout escalation (SIGTERM then SIGKILL)
- [ ] Handles spawn failures (ENOENT, EACCES)

### Code Quality Validation

- [ ] Follows spawn patterns from groundswell-linker.ts
- [ ] Uses DEFAULT_PROJECT_PATH constant
- [ ] Returns TypeScriptCheckResult with all required fields
- [ ] JSDoc documentation with @param, @returns, @example, @remarks
- [ ] Unit tests cover: happy path, errors, module not found, timeout, spawn failure, parse errors, hasModuleNotFound
- [ ] 100% test coverage achieved
- [ ] New file `src/utils/typescript-checker.ts` created
- [ ] New test file `tests/unit/utils/typescript-checker.test.ts` created

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] JSDoc includes examples for happy path and error cases
- [ ] Export structure allows consumption by P1.M1.T2.S2
- [ ] Function is callable without parameters (uses sensible defaults)

---

## Anti-Patterns to Avoid

- **Don't** call `tsc` directly - always use `npm run typecheck` to ensure correct tsconfig.json context
- **Don't** parse stdout for errors - TypeScript errors go to stderr only
- **Don't** use `shell: true` - always use `shell: false` with argument arrays for security
- **Don't** skip the SIGTERM grace period - always give processes 2 seconds to clean up
- **Don't** capture data after kill - use `if (killed) return` guard in data handlers
- **Don't** throw errors - return structured result objects
- **Don't** hardcode paths - use `DEFAULT_PROJECT_PATH` constant
- **Don't** use sync spawn (`spawnSync`) - use async `spawn()` for proper timeout handling
- **Don't** assume exit code 1 means errors - TypeScript specifically uses exit code 2 for errors
- **Don't** forget to clear timeout - otherwise you'll have orphaned SIGKILL signals
- **Don't** ignore ANSI codes in output - consider stripping them or using tolerant regex
- **Don't** skip the `resolved` flag - multiple resolve() calls will cause test failures
