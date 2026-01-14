# Product Requirement Prompt (PRP) - P1.M1.T2.S1: Run TypeScript typecheck command

---

## Goal

**Feature Goal**: Implement `runTypecheck()` function that executes `npm run typecheck` (which runs `tsc --noEmit`), captures stdout/stderr, parses TypeScript compiler output, and returns a structured result with error count and parsed error details.

**Deliverable**:
- A new function `runTypecheck()` in a TypeScript utility module
- Returns `TypecheckResult` interface with `{ success: boolean, errorCount: number, errors: ParsedTscError[] }`
- Unit tests with comprehensive mocking (Vitest framework)
- Integration with existing Groundswell linker utilities pattern

**Success Definition**:
- Function executes `tsc --noEmit` command successfully via spawn
- All TypeScript errors are captured and parsed correctly
- Error count is accurate (0 for success, >0 for failures)
- Errors array contains structured error objects with file, line, column, code, and message
- Special handling for TS2307 "Cannot find module" errors
- All tests pass (unit + integration)

## User Persona (if applicable)

**Target User**: Developer / Build system

**Use Case**: After completing Groundswell npm link (P1.M1.T1), verify that TypeScript compilation succeeds without module-not-found errors

**User Journey**:
1. Developer completes P1.M1.T1 (Groundswell link setup)
2. Automated pipeline calls `runTypecheck()` to verify TypeScript compilation
3. Function returns structured result indicating success/failure
4. If successful, proceed to P1.M1.T2.S2 (analyze any remaining errors)
5. If failed, error count and details guide debugging

**Pain Points Addressed**:
- Manual verification of TypeScript compilation after npm link
- Unparsed error output that's difficult to analyze programmatically
- No automated detection of "Cannot find module" errors after linking

## Why

- **Integration with P1.M1.T1**: Validates that Groundswell link resolves TypeScript module resolution errors
- **Foundation for S2-S4**: Output is consumed by P1.M1.T2.S2 (error analysis) and P1.M1.T2.S3 (module-not-found verification)
- **Build verification**: Ensures codebase compiles without type errors before proceeding
- **Automated debugging**: Structured error output enables automated error categorization and reporting

## What

Implement `runTypecheck()` function that:

1. Executes `npm run typecheck` command (which runs `tsc --noEmit`)
2. Captures stdout and stderr from the command
3. Parses TypeScript compiler output using regex pattern matching
4. Returns structured result with success status, error count, and parsed errors
5. Handles timeout scenarios (SIGTERM/SIGKILL escalation)
6. Handles spawn errors (ENOENT, EACCES)
7. Optionally filters for specific error patterns (e.g., TS2307 "Cannot find module")

### Success Criteria

- [ ] Function executes `npm run typecheck` successfully via spawn
- [ ] Returns `TypecheckResult` with proper structure
- [ ] `success: true` when errorCount is 0, `success: false` when errorCount > 0
- [ ] `errorCount` accurately counts all TypeScript errors
- [ ] `errors` array contains parsed error objects with file, line, column, code, message
- [ ] TS2307 errors are properly parsed and identifiable
- [ ] Timeout handling terminates hung processes
- [ ] Spawn errors return appropriate error codes
- [ ] All unit tests pass with mocked spawn
- [ ] Follows existing patterns from groundswell-linker.ts

---

## All Needed Context

### Context Completeness Check

**Before implementing, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

✓ **Yes** - This PRP provides:
- Exact file patterns to follow from groundswell-linker.ts
- Complete spawn execution pattern with timeout handling
- TypeScript compiler output format and parsing regex
- Test patterns from existing test files
- All necessary imports and exports

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/utils/groundswell-linker.ts
  why: Primary reference for spawn execution pattern, stdout/stderr capture, timeout handling, result structure
  pattern: Lines 550-698 (linkGroundswellLocally function) - complete spawn pattern
  gotcha: Must use shell: false, stdio: ['ignore', 'pipe', 'pipe'], kill flag before data capture

- file: tests/unit/utils/groundswell-linker.test.ts
  why: Test patterns for spawn mocking, ChildProcess mock helper, test structure
  pattern: Lines 71-106 (createMockChild helper), lines 23-25 (vi.mock pattern)
  gotcha: Mock must use vi.fn(), simulate async data emission with setTimeout

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/subtasks/P1M1T1S6/typescript-compiler-output-research.md
  why: Complete TypeScript compiler output format, error patterns, parsing strategies
  section: 1.2 Standard Error Format, 2.1 TS2307 Pattern, 1.3 Compiler Flags
  gotcha: All errors go to stderr, use --pretty false for machine-parsable output

- file: package.json
  why: Verify typecheck script exists and understand command structure
  pattern: Line 22: "typecheck": "tsc --noEmit"
  gotcha: npm run typecheck runs tsc --noEmit (no pretty flag, will have ANSI codes)

- url: https://github.com/aivenio/tsc-output-parser
  why: Reference npm package for tsc output parsing (evaluated but NOT recommended)
  critical: Build custom parser instead - zero dependencies, full control, stable format
```

### Current Codebase tree

```bash
src/
├── utils/
│   ├── groundswell-linker.ts       # REFERENCE: Spawn pattern, result structure
│   └── groundswell-verifier.ts     # REFERENCE: Similar utility pattern
tests/
├── unit/
│   └── utils/
│       └── groundswell-linker.test.ts  # REFERENCE: Test patterns, mock structure
package.json                           # VERIFY: Contains typecheck script
vitest.config.ts                       # CONFIG: Test framework configuration
```

### Desired Codebase tree with files to be added

```bash
src/
├── utils/
│   ├── groundswell-linker.ts       # EXISTING
│   ├── groundswell-verifier.ts     # EXISTING
│   └── typecheck-runner.ts         # NEW: runTypecheck() function
tests/
├── unit/
│   └── utils/
│       ├── groundswell-linker.test.ts  # EXISTING
│       └── typecheck-runner.test.ts    # NEW: Unit tests for typecheck-runner
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: TypeScript compiler output goes to stderr, NOT stdout
// All errors from tsc --noEmit are written to stderr stream

// CRITICAL: npm run typecheck does NOT use --pretty false
// This means output will contain ANSI escape codes by default
// Solution: Either parse through ANSI codes OR use tsc --noEmit --pretty false directly

// CRITICAL: Exit codes: 0 = success, 2 = errors present, 1 = other failure

// CRITICAL: Regex pattern must handle file paths with spaces
// Use non-greedy matching: /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/

// CRITICAL: Timeout handling MUST use SIGTERM then SIGKILL pattern
// Follow groundswell-linker.ts lines 599-610 exactly

// CRITICAL: Check killed flag before capturing data (lines 614-625)
// Prevents data corruption after process termination

// CRITICAL: Mock ChildProcess must simulate async data emission
// Use setTimeout in mock to match real behavior (test file lines 84-86)

// GOTCHA: tsc output format is stable but may include:
// - File paths with spaces (use non-greedy regex)
// - Relative and absolute paths (handle both)
// - Project references (may include project name)

// GOTCHA: TS2307 "Cannot find module" has variations:
// - Cannot find module 'express'
// - Cannot find module './utils/helper'
// - Cannot find module 'lodash' or its corresponding type declarations.
```

---

## Implementation Blueprint

### Data models and structure

```typescript
// Core result interface
interface TypecheckResult {
  success: boolean;          // true if errorCount === 0
  errorCount: number;        // Total number of TypeScript errors
  errors: ParsedTscError[];  // Array of parsed error objects
  stdout: string;            // Captured stdout (usually empty for tsc)
  stderr: string;            // Raw stderr output
  exitCode: number | null;   // Process exit code
  error?: string;            // Error message if spawn failed
}

// Parsed TypeScript error
interface ParsedTscError {
  file: string;              // File path (relative or absolute)
  line: number;              // Line number (1-indexed)
  column: number;            // Column number (1-indexed)
  code: string;              // Error code (e.g., "TS2307")
  message: string;           // Error message
  module?: string;           // Extracted module name (for TS2307 only)
}

// Options interface
interface TypecheckOptions {
  timeout?: number;          // Command timeout in ms (default: 30000)
  projectPath?: string;      // Project directory (default: DEFAULT_PROJECT_PATH)
  filterErrorCode?: string;  // Optional: Only include specific error code (e.g., "TS2307")
}

// Constants
const DEFAULT_TYPECHECK_TIMEOUT = 30000;  // 30 seconds
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/typecheck-runner.ts
  - IMPLEMENT: TypecheckResult, ParsedTscError, TypecheckOptions interfaces
  - IMPLEMENT: runTypecheck() function with spawn execution
  - IMPLEMENT: parseTscOutput() helper function with regex parsing
  - IMPLEMENT: extractModuleName() helper for TS2307 errors
  - FOLLOW pattern: src/utils/groundswell-linker.ts lines 550-698
  - NAMING: runTypecheck (function), TypecheckResult (interface), ParsedTscError (interface)
  - PLACEMENT: src/utils/typecheck-runner.ts (new file)
  - EXPORT: runTypecheck function and all interfaces

Task 2: MODIFY src/utils/groundswell-linker.ts (optional integration)
  - INTEGRATE: Import and re-export runTypecheck if needed for pipeline
  - FIND pattern: Existing re-exports in groundswell-linker.ts
  - ADD: export { runTypecheck, type TypecheckResult } from './typecheck-runner.js'
  - PRESERVE: All existing exports and functionality

Task 3: CREATE tests/unit/utils/typecheck-runner.test.ts
  - IMPLEMENT: Unit tests for runTypecheck() function
  - IMPLEMENT: Tests for parseTscOutput() helper
  - IMPLEMENT: Tests for extractModuleName() helper
  - FOLLOW pattern: tests/unit/utils/groundswell-linker.test.ts
  - MOCK: node:child_process with vi.mock()
  - COVERAGE: Happy path, timeout, spawn errors, parsing edge cases
  - PLACEMENT: tests/unit/utils/typecheck-runner.test.ts
  - NAMING: describe('typecheck-runner', () => { ... })

Task 4: UPDATE plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/tasks.json
  - UPDATE: Set P1.M1.T2.S1 status to "Complete"
  - FIND pattern: tasks.json structure for status updates
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// SPAWN EXECUTION PATTERN (from groundswell-linker.ts lines 574-627)
// =============================================================================

export async function runTypecheck(
  options?: TypecheckOptions
): Promise<TypecheckResult> {
  const {
    timeout = DEFAULT_TYPECHECK_TIMEOUT,
    projectPath = DEFAULT_PROJECT_PATH
  } = options ?? {};

  // PATTERN: Safe spawn execution
  let child: ChildProcess;

  try {
    // CRITICAL: Use argument array, shell: false
    child = spawn('npm', ['run', 'typecheck'], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,  // Prevents shell injection
    });
  } catch (error) {
    return {
      success: false,
      errorCount: 0,
      errors: [],
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // PATTERN: Promise-based output capture with timeout
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // PATTERN: Timeout handler with SIGTERM/SIGKILL escalation
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      // Force kill after 2-second grace period
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    // PATTERN: Capture stdout with kill check
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return;  // CRITICAL: Ignore data after kill
        stdout += data.toString();
      });
    }

    // PATTERN: Capture stderr with kill check
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return;  // CRITICAL: Ignore data after kill
        stderr += data.toString();
      });
    }

    // PATTERN: Handle close event with result parsing
    child.on('close', (exitCode) => {
      clearTimeout(timeoutId);

      // Parse TypeScript errors from stderr
      const errors = parseTscOutput(stderr);

      resolve({
        success: errors.length === 0,
        errorCount: errors.length,
        errors,
        stdout,
        stderr,
        exitCode,
        error: timedOut ? `Command timed out after ${timeout}ms` : undefined,
      });
    });

    // PATTERN: Handle spawn errors
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        errorCount: 0,
        errors: [],
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}

// =============================================================================
// TSC OUTPUT PARSING PATTERN
// =============================================================================

/**
 * Parses TypeScript compiler output into structured error objects
 *
 * @remarks
 * Handles the standard tsc error format:
 * file_path(line,column): error TSXXXX: error_message
 *
 * @param output - Raw stderr output from tsc
 * @returns Array of parsed error objects
 */
function parseTscOutput(output: string): ParsedTscError[] {
  const errors: ParsedTscError[] = [];
  const lines = output.trim().split('\n');

  // CRITICAL: Non-greedy matching for file paths with spaces
  const TSC_ERROR_PATTERN = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

  for (const line of lines) {
    const match = line.match(TSC_ERROR_PATTERN);
    if (match) {
      const [, file, line, column, code, message] = match;

      const error: ParsedTscError = {
        file,
        line: parseInt(line, 10),
        column: parseInt(column, 10),
        code,
        message,
      };

      // Extract module name for TS2307 errors
      if (code === 'TS2307') {
        error.module = extractModuleName(message);
      }

      errors.push(error);
    }
  }

  return errors;
}

/**
 * Extracts module name from TS2307 error message
 *
 * @remarks
 * TS2307 format variations:
 * - Cannot find module 'express'
 * - Cannot find module './utils/helper'
 * - Cannot find module 'lodash' or its corresponding type declarations.
 *
 * @param message - Error message from TS2307
 * @returns Module name or undefined
 */
function extractModuleName(message: string): string | undefined {
  const match = message.match(/Cannot find module ['"]([^'"]+)['"]/);
  return match ? match[1] : undefined;
}

// =============================================================================
// GOTCHA: ANSI ESCAPE CODES
// =============================================================================

// If npm run typecheck output contains ANSI codes (likely), either:
// 1. Use strip-ansi package to clean before parsing
// 2. Use tsc --noEmit --pretty false directly instead of npm run typecheck

// ALTERNATIVE: Direct tsc execution for cleaner output
child = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
  cwd: projectPath,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false,
});
```

### Integration Points

```yaml
UTILITIES:
  - add to: src/utils/typecheck-runner.ts (new file)
  - pattern: "runTypecheck(options?: TypecheckOptions): Promise<TypecheckResult>"

EXPORTS:
  - from: src/utils/typecheck-runner.ts
  - export: "export { runTypecheck, type TypecheckResult, type ParsedTscError, type TypecheckOptions }"

TESTS:
  - add to: tests/unit/utils/typecheck-runner.test.ts (new file)
  - pattern: "describe('typecheck-runner', () => { ... })"
  - mock: "vi.mock('node:child_process', () => ({ spawn: vi.fn() }))"

CONSTANTS:
  - add to: src/utils/typecheck-runner.ts
  - pattern: "const DEFAULT_TYPECHECK_TIMEOUT = 30000"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit src/utils/typecheck-runner.ts    # Type check new file
npm run lint src/utils/typecheck-runner.ts        # ESLint check
npm run format src/utils/typecheck-runner.ts      # Prettier format

# Project-wide validation
npm run typecheck          # Full project typecheck
npm run lint               # Full project lint
npm run format             # Full project format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test new module as it's created
npm run test tests/unit/utils/typecheck-runner.test.ts

# Test all utils to ensure no regression
npm run test tests/unit/utils/

# Full test suite
npm run test

# Coverage validation
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test - run actual typecheck
cd /home/dustin/projects/hacky-hack
npm run typecheck

# Expected: Either success (0 errors) or structured error output

# Test the function directly (create temporary test script)
cat > /tmp/test-typecheck.mjs << 'EOF'
import { runTypecheck } from './src/utils/typecheck-runner.ts';

const result = await runTypecheck();
console.log('Success:', result.success);
console.log('Error Count:', result.errorCount);
console.log('Errors:', result.errors);
EOF

npm run test tests/unit/utils/typecheck-runner.test.ts
```

### Level 4: Creative & Domain-Specific Validation

```bash
# TypeScript Error Category Validation

# Test with intentional TS2307 error (temporarily break import)
echo "import './non-existent-module';" >> src/test-temp.ts
npm run typecheck
# Should capture: error TS2307: Cannot find module './non-existent-module'
rm src/test-temp.ts

# Test with multiple error types
# TS2322: Type assignment error
# TS2741: Missing property
# TS2307: Cannot find module

# Timeout Validation
# Create a test that simulates hung tsc process
# Verify SIGTERM/SIGKILL escalation works

# Output Format Validation
# Verify all error fields are populated correctly
# Check file paths are preserved
# Verify line/column numbers are accurate
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] Returns `TypecheckResult` with correct structure
- [ ] `success` is `true` when errorCount is 0
- [ ] `errorCount` accurately counts all errors
- [ ] `errors` array contains all parsed errors
- [ ] TS2307 errors include `module` field
- [ ] Timeout handling terminates hung processes
- [ ] Spawn errors return appropriate error messages

### Code Quality Validation

- [ ] Follows groundswell-linker.ts spawn pattern exactly
- [ ] File placement matches desired codebase tree
- [ ] Test file follows existing test patterns
- [ ] All interfaces exported for module consumption
- [ ] JSDoc comments match groundswell-linker.ts style

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Error messages are informative
- [ ] Constants use DEFAULT_ naming convention

---

## Anti-Patterns to Avoid

- ❌ Don't use `exec()` or `execSync()` - blocks event loop
- ❌ Don't use `shell: true` - security vulnerability
- ❌ Don't skip timeout handling - can hang indefinitely
- ❌ Don't ignore data after kill - corrupts output
- ❌ Don't use greedy regex `^(.+)` - breaks on file paths with spaces
- ❌ Don't read from stdout for errors - tsc writes to stderr
- ❌ Don't assume npm run typecheck has --pretty false - has ANSI codes
- ❌ Don't catch all exceptions - be specific with error types
- ❌ Don't create new patterns when groundswell-linker.ts patterns work
- ❌ Don't forget to mock child_process in tests - slow and fragile
- ❌ Don't use synchronous mock data emission - use setTimeout
- ❌ Don't hardcode paths - use projectPath parameter

---

## Confidence Score

**8/10** - One-pass implementation success likelihood

**Reasoning**:
- ✅ Clear pattern reference from groundswell-linker.ts
- ✅ Comprehensive TypeScript output parsing research available
- ✅ Test patterns well-established in codebase
- ✅ No complex external dependencies
- ⚠️ Potential ANSI escape code handling needs validation
- ⚠️ Edge cases in tsc output format (project references) may need adjustment

---

## Additional Research Notes (stored in research/ subdirectory)

- TypeScript compiler output format: See `docs/subtasks/P1M1T1S6/typescript-compiler-output-research.md`
- TSC parser example: See `docs/subtasks/P1M1T1S6/tsc-parser-example.cjs`
- Test examples: See `docs/subtasks/P1M1T1S6/test-examples.md`
