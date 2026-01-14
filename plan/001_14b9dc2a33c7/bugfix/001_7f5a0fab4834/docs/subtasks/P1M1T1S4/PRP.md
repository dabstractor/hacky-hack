# Product Requirement Prompt (PRP): P1.M1.T1.S4 - Verify Groundswell Symlink

---

## Goal

**Feature Goal**: Verify that the Groundswell symlink exists at `node_modules/groundswell` after the `npm link groundswell` command has been executed, confirming the local linking step was successful.

**Deliverable**: A `verifyGroundswellSymlink()` function in `src/utils/groundswell-linker.ts` that consumes S3's `GroundswellLocalLinkResult` and produces a `GroundswellSymlinkVerifyResult` for S5 to consume.

**Success Definition**:
- Function returns `{ exists: true, path: string }` when symlink is valid
- All unit tests pass (30+ tests covering happy path, errors, edge cases)
- Integration with S3 works correctly (conditional execution based on S3 result)
- Mock-friendly design works with Vitest

---

## User Persona

**Target User**: Developer/Build System (this is an infrastructure task)

**Use Case**: As part of the Groundswell dependency setup workflow, after executing `npm link groundswell`, the system needs to verify that the symlink was created correctly before proceeding to S5 (npm list verification).

**User Journey**:
1. S3 executes `npm link groundswell` and returns `GroundswellLocalLinkResult`
2. S4 receives S3's result and checks if `success: true`
3. If S3 succeeded, S4 verifies the symlink exists at `node_modules/groundswell`
4. S4 returns `GroundswellSymlinkVerifyResult` with symlink existence status
5. S5 consumes S4's result to run `npm list` command

**Pain Points Addressed**:
- Detects broken or missing symlinks before they cause runtime errors
- Provides clear diagnostic information when symlink verification fails
- Enables early failure in the dependency resolution workflow

---

## Why

- **Infrastructure Reliability**: Symlink verification is critical for npm link workflows. A broken symlink can cause "module not found" errors that are difficult to debug.
- **S3 Integration**: S3 already does symlink verification, but S4 provides a separate, explicit verification step with a different contract that S5 can consume.
- **Diagnostic Value**: Returns raw ls output (or symlink target) for debugging failed links.
- **Workflow Progression**: Part of the sequential S1-S6 workflow for Groundswell dependency resolution. Each step consumes the previous step's output.

---

## What

### Success Criteria

- [ ] `verifyGroundswellSymlink()` function exists in `src/utils/groundswell-linker.ts`
- [ ] Function consumes S3's `GroundswellLocalLinkResult` as first parameter
- [ ] Function accepts optional `GroundswellSymlinkVerifyOptions` parameter
- [ ] Conditional execution: skips verification if S3's `success` is `false`
- [ ] Uses native `fs.lstat()` and `fs.readlink()` for symlink detection (recommended in research)
- [ ] Returns `GroundswellSymlinkVerifyResult` with all required fields
- [ ] Handles all error cases (ENOENT, EACCES, EINVAL, etc.)
- [ ] Comprehensive test suite with 30+ tests

### User-Visible Behavior

```typescript
// Input: S3's result
const s3Result: GroundswellLocalLinkResult = {
  success: true,
  message: 'Successfully linked groundswell...',
  symlinkPath: '/home/dustin/projects/hacky-hack/node_modules/groundswell',
  symlinkTarget: '../../../projects/groundswell',
  stdout: '...',
  stderr: '',
  exitCode: 0,
};

// Call S4
const s4Result = await verifyGroundswellSymlink(s3Result);

// Output: S4's result
console.log(s4Result);
// {
//   exists: true,
//   path: '/home/dustin/projects/hacky-hack/node_modules/groundswell',
//   symlinkTarget: '../../../projects/groundswell',
//   message: 'Symlink verified at /home/.../node_modules/groundswell',
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

### Documentation & References

```yaml
# MUST READ - Implementation patterns and examples
- file: src/utils/groundswell-linker.ts
  why: S3 implementation with symlink verification pattern (lines 425-465)
  pattern: Use fs.lstat() and fs.readlink() for symlink detection
  gotcha: "S3 already does symlink verification - S4 is a separate explicit step"
  critical: "Follow S3's spawn() timeout pattern and error handling"

- file: src/utils/groundswell-verifier.ts
  why: S1 implementation showing input validation and result patterns
  pattern: Synchronous verification with structured result return
  gotcha: "S1 uses existsSync(), S4 should use async fs.lstat()"

- file: tests/unit/utils/groundswell-linker.test.ts
  why: Comprehensive test patterns for spawn() and fs mocking
  pattern: createMockChild() helper, fake timers, mock factory functions
  critical: "Use vi.mocked() for type-safe mocking in Vitest"

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/subtasks/P1M1T1S4/research/symlink-verification-research.md
  why: Complete symlink verification patterns with fs.lstat() and fs.readlink()
  section: "Using fs.lstat() and fs.promises.lstat" (lines 20-186)
  critical: "Use lstat() NOT stat() - stat() follows symlinks and always returns false for isSymbolicLink()"

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/subtasks/P1M1T1S4/research/ls-output-parsing-research.md
  why: Alternative ls -la parsing approach (NOT recommended for production)
  section: "Alternative Approaches" (lines 768-823)
  gotcha: "Native APIs are preferred - ls -la parsing is for debugging only"

# EXTERNAL REFERENCES
- url: https://nodejs.org/api/fs.html#fspromiseslstatpath-options
  why: Official documentation for fs.promises.lstat()
  critical: "lstat() does NOT follow symlinks - use for symlink detection"

- url: https://nodejs.org/api/fs.html#fspromisesreadlinkpath-options
  why: Official documentation for fs.promises.readlink()
  critical: "readlink() returns the symlink target path"

- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking documentation for fs operations
  section: "vi.mock with factory functions"
```

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── utils/
│   │   ├── groundswell-verifier.ts      # S1: Verify Groundswell exists
│   │   └── groundswell-linker.ts        # S2+S3: npm link operations
│   └── ...
├── tests/
│   └── unit/
│       └── utils/
│           ├── groundswell-verifier.test.ts
│           └── groundswell-linker.test.ts
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
│   │   └── groundswell-linker.ts         # MODIFY - Add S4 function
│   └── ...
├── tests/
│   └── unit/
│       └── utils/
│           ├── groundswell-verifier.test.ts     # EXISTING
│           └── groundswell-linker.test.ts       # MODIFY - Add S4 tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use lstat() NOT stat() for symlink detection
// stat() follows symlinks and always returns isSymbolicLink() === false
// BAD: const stats = await stat(path); return stats.isSymbolicLink(); // ALWAYS FALSE
// GOOD: const stats = await lstat(path); return stats.isSymbolicLink(); // CORRECT

// CRITICAL: The codebase uses fs/promises (Promise-based), NOT fs callback API
import { lstat, readlink } from 'node:fs/promises'; // CORRECT
// import { lstat } from 'node:fs'; // DON'T USE - requires promisify

// CRITICAL: Handle NodeJS.ErrnoException type for error.code checking
const errno = error as NodeJS.ErrnoException;
if (errno?.code === 'ENOENT') { /* path doesn't exist */ }
if (errno?.code === 'EACCES') { /* permission denied */ }
if (errno?.code === 'EINVAL') { /* not a symlink */ }

// CRITICAL: S3 already does symlink verification (groundswell-linker.ts:431-444)
// S4 is a SEPARATE explicit verification step for workflow clarity
// S4 should re-verify independently, not just return S3's verification result

// PATTERN: Conditional execution based on previous step's success
if (!previousResult.success) {
  return {
    exists: false,
    path: symlinkPath,
    message: `Skipped: Previous step failed - ${previousResult.message}`,
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

// PATTERN: Use vi.useFakeTimers() for timeout tests in Vitest
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
});

// PATTERN: Mock factory functions for consistent test data
function createMockStats(options: {
  isSymbolicLink?: boolean;
  isFile?: boolean;
  isDirectory?: boolean;
}): Stats {
  return {
    isSymbolicLink: vi.fn(() => options.isSymbolicLink ?? false),
    isFile: vi.fn(() => options.isFile ?? false),
    // ... other required Stats fields
  } as Stats;
}

// GOTCHA: ls -la parsing is NOT recommended for production (per research)
// Use native fs.lstat() and fs.readlink() instead
// ls -la parsing is only for debugging/legacy scenarios

// GOTCHA: Relative symlink targets need resolution
// readlink() may return '../../../projects/groundswell'
// Use path.resolve() to get absolute path if needed

// GOTCHA: Broken symlinks are detected by lstat() successfully
// lstat() works on broken symlinks, stat() throws ENOENT
// Use stat() on the target to check if symlink is broken
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Result of Groundswell symlink verification
 *
 * @remarks
 * Returned by verifyGroundswellSymlink() to indicate whether
 * the symlink exists at node_modules/groundswell and provides
 * diagnostic information for debugging.
 */
export interface GroundswellSymlinkVerifyResult {
  /** Whether symlink exists at node_modules/groundswell */
  exists: boolean;

  /** Absolute path where symlink should exist */
  path: string;

  /** Actual symlink target (if verification succeeded) */
  symlinkTarget?: string;

  /** Human-readable status message */
  message: string;

  /** Error message if verification failed */
  error?: string;
}

/**
 * Optional configuration for verifyGroundswellSymlink()
 *
 * @remarks
 * Optional configuration for the verifyGroundswellSymlink function.
 */
export interface GroundswellSymlinkVerifyOptions {
  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD GroundswellSymlinkVerifyResult and GroundswellSymlinkVerifyOptions interfaces
  - LOCATION: src/utils/groundswell-linker.ts (after GroundswellLocalLinkResult, line 124)
  - IMPLEMENT: GroundswellSymlinkVerifyResult interface
  - IMPLEMENT: GroundswellSymlinkVerifyOptions interface
  - FOLLOW pattern: GroundswellLocalLinkResult (lines 100-124)
  - FIELDS: exists, path, symlinkTarget?, message, error?
  - NAMING: CamelCase interfaces, descriptive field names

Task 2: ADD DEFAULT_PROJECT_PATH constant
  - LOCATION: src/utils/groundswell-linker.ts (after DEFAULT_PROJECT_PATH, line 160)
  - IMPLEMENT: const DEFAULT_SYMLINK_VERIFY_PATH = '/home/dustin/projects/hacky-hack';
  - FOLLOW pattern: DEFAULT_PROJECT_PATH constant (line 160)
  - NAMING: UPPER_SNAKE_CASE for constants

Task 3: CREATE verifyGroundswellSymlink() function
  - LOCATION: src/utils/groundswell-linker.ts (after linkGroundswellLocally, line 494)
  - IMPLEMENT: async function verifyGroundswellSymlink()
  - SIGNATURE: (previousResult: GroundswellLocalLinkResult, options?: GroundswellSymlinkVerifyOptions) => Promise<GroundswellSymlinkVerifyResult>
  - DEPENDENCIES: Import lstat, readlink from 'node:fs/promises' (already imported on line 27)
  - DEPENDENCIES: Import join from 'node:path' (already imported on line 28)

Task 4: IMPLEMENT conditional execution logic
  - LOCATION: verifyGroundswellSymlink() function body
  - CHECK: if (!previousResult.success) return early with exists: false
  - FOLLOW pattern: linkGroundswellLocally() conditional execution (lines 356-365)
  - MESSAGE: Include previousResult.message in skip message for debugging

Task 5: IMPLEMENT symlink verification using native APIs
  - LOCATION: verifyGroundswellSymlink() function body (after conditional check)
  - USE: const stats = await lstat(symlinkPath);
  - CHECK: if (!stats.isSymbolicLink()) return exists: false
  - GET: const target = await readlink(symlinkPath);
  - FOLLOW pattern: linkGroundswellLocally() verification (lines 431-444)
  - CRITICAL: Use lstat() NOT stat() for symlink detection

Task 6: IMPLEMENT error handling
  - LOCATION: verifyGroundswellSymlink() function body (wrap in try/catch)
  - HANDLE: ENOENT - path doesn't exist (return exists: false)
  - HANDLE: EACCES - permission denied (return error with code)
  - HANDLE: EINVAL - not a symlink (return error with code)
  - FOLLOW pattern: linkGroundswellLocally() error handling (lines 454-465)
  - TYPE: const errno = error as NodeJS.ErrnoException;

Task 7: EXPORT verifyGroundswellSymlink function
  - LOCATION: src/utils/groundswell-linker.ts (add to existing exports)
  - EXPORT: export async function verifyGroundswellSymlink(...)
  - FOLLOW pattern: Existing exports (linkGroundswell, linkGroundswellLocally)

Task 8: CREATE comprehensive test suite
  - LOCATION: tests/unit/utils/groundswell-linker.test.ts
  - IMPLEMENT: describe('verifyGroundswellSymlink', () => { ... })
  - MOCK: vi.mock('node:fs/promises') for lstat and readlink
  - TESTS: 30+ tests covering all scenarios (see Test Patterns below)

Task 9: RUN test suite validation
  - COMMAND: npm test -- tests/unit/utils/groundswell-linker.test.ts
  - VERIFY: All tests pass
  - VERIFY: No TypeScript errors
  - VERIFY: 100% code coverage for new function
```

### Implementation Patterns & Key Details

```typescript
/**
 * PATTERN: Conditional execution based on previous result
 * Location: Start of verifyGroundswellSymlink()
 */
export async function verifyGroundswellSymlink(
  previousResult: GroundswellLocalLinkResult,
  options?: GroundswellSymlinkVerifyOptions
): Promise<GroundswellSymlinkVerifyResult> {
  const { projectPath = DEFAULT_PROJECT_PATH } = options ?? {};
  const symlinkPath = join(projectPath, 'node_modules', 'groundswell');

  // PATTERN: Skip if previous step failed (from linkGroundswellLocally)
  if (!previousResult.success) {
    return {
      exists: false,
      path: symlinkPath,
      message: `Skipped: Local link failed - ${previousResult.message}`,
      error: undefined,
    };
  }

  // PATTERN: Use native fs.lstat() and fs.readlink() (recommended in research)
  try {
    // CRITICAL: Use lstat() NOT stat() for symlink detection
    const stats = await lstat(symlinkPath);

    if (!stats.isSymbolicLink()) {
      return {
        exists: false,
        path: symlinkPath,
        message: `Path exists but is not a symbolic link: ${symlinkPath}`,
        error: 'Not a symlink',
      };
    }

    // Get symlink target
    const symlinkTarget = await readlink(symlinkPath);

    return {
      exists: true,
      path: symlinkPath,
      symlinkTarget,
      message: `Symlink verified at ${symlinkPath} -> ${symlinkTarget}`,
    };
  } catch (error) {
    // PATTERN: Handle Node.js errno codes (from linkGroundswellLocally)
    const errno = error as NodeJS.ErrnoException;

    if (errno?.code === 'ENOENT') {
      return {
        exists: false,
        path: symlinkPath,
        message: `Symlink not found: ${symlinkPath}`,
        error: 'ENOENT',
      };
    }

    if (errno?.code === 'EACCES') {
      return {
        exists: false,
        path: symlinkPath,
        message: `Permission denied: ${symlinkPath}`,
        error: 'EACCES',
      };
    }

    // Generic error
    return {
      exists: false,
      path: symlinkPath,
      message: `Verification failed: ${errno?.message || 'Unknown error'}`,
      error: errno?.code || 'UNKNOWN',
    };
  }
}
```

### Integration Points

```yaml
FUNCTION_SIGNATURE:
  - name: verifyGroundswellSymlink
  - parameters: previousResult: GroundswellLocalLinkResult, options?: GroundswellSymlinkVerifyOptions
  - returns: Promise<GroundswellSymlinkVerifyResult>
  - location: src/utils/groundswell-linker.ts

IMPORTS:
  - file: src/utils/groundswell-linker.ts
  - add: No new imports needed (lstat, readlink, join already imported)

EXPORTS:
  - file: src/utils/groundswell-linker.ts
  - add: export { verifyGroundswellSymlink, type GroundswellSymlinkVerifyResult, type GroundswellSymlinkVerifyOptions }

WORKFLOW_CONSUMERS:
  - S5: Will consume GroundswellSymlinkVerifyResult
  - Pattern: const s4Result = await verifyGroundswellSymlink(s3Result);
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
# Run tests for groundswell-linker module
npm test -- tests/unit/utils/groundswell-linker.test.ts

# Expected: All tests pass (including existing S2/S3 tests + new S4 tests)

# Run with coverage
npm run test:coverage -- tests/unit/utils/groundswell-linker.test.ts

# Expected: 100% coverage for verifyGroundswellSymlink function

# Run all utils tests
npm test -- tests/unit/utils/

# Expected: All tests pass, no regressions in existing code
```

### Level 3: Integration Testing (System Validation)

```bash
# Test the full S1-S4 workflow
# (This would require integration test setup - beyond unit test scope)

# Manual verification: Run TypeScript compilation
npx tsc --noEmit

# Expected: Zero compilation errors across entire project

# Verify function is exported correctly
node -e "import('./src/utils/groundswell-linker.ts').then(m => console.log(Object.keys(m)))"

# Expected: verifyGroundswellSymlink appears in exported members
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test symlink verification with actual filesystem (integration test)
# Create temporary symlink and verify detection
mkdir -p /tmp/test-symlink-check
cd /tmp/test-symlink-check
mkdir -p target
ln -s target link
node -e "
import { lstat, readlink } from 'node:fs/promises';
const stats = await lstat('link');
console.log('isSymbolicLink:', stats.isSymbolicLink());
const target = await readlink('link');
console.log('target:', target);
"

# Expected Output:
# isSymbolicLink: true
# target: target

# Verify S4 function behavior with real symlink
# (requires importing the function and testing with real paths)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/groundswell-linker.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint` (if configured)
- [ ] Function is properly exported: `verifyGroundswellSymlink` appears in module exports

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Conditional execution works (skips when S3 success is false)
- [ ] Symlink detection works using fs.lstat()
- [ ] Symlink target is correctly extracted using fs.readlink()
- [ ] All error cases handled (ENOENT, EACCES, EINVAL)
- [ ] Result interface matches expected contract for S5

### Code Quality Validation

- [ ] Follows existing codebase patterns (naming, structure, error handling)
- [ ] JSDoc comments present and complete
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (stat() vs lstat(), callback vs Promise API)
- [ ] Dependencies properly imported (no new imports needed)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] JSDoc includes @remarks with usage examples
- [ ] Error messages are informative and actionable
- [ ] Test documentation describes what each test validates

---

## Anti-Patterns to Avoid

- ❌ **Don't use `stat()` instead of `lstat()`** - `stat()` follows symlinks and always returns `isSymbolicLink() === false`
- ❌ **Don't skip conditional execution check** - Must verify `previousResult.success` before proceeding
- ❌ **Don't use callback-based fs API** - Use `fs/promises` for async/await patterns
- ❌ **Don't ignore error codes** - Always check `errno.code` for ENOENT, EACCES, EINVAL
- ❌ **Don't throw exceptions for normal errors** - Return structured result objects
- ❌ **Don't use `ls -la` parsing** - Native APIs are more reliable (per research)
- ❌ **Don't forget to type-check errors** - Use `as NodeJS.ErrnoException` for error.code access
- ❌ **Don't hardcode project path** - Use DEFAULT_PROJECT_PATH constant with options override
- ❌ **Don't skip mocking in tests** - Always mock fs operations for unit tests
- ❌ **Don't use real timers in timeout tests** - Use `vi.useFakeTimers()` for deterministic tests

---

## Test Patterns Reference

### Test Organization Structure

```typescript
describe('verifyGroundswellSymlink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conditional execution', () => {
    it('should skip verification when previousResult.success is false', async () => {
      // SETUP: Create S3 result with success: false
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: exists: false, no lstat() calls
    });

    it('should include previous error message when skipping', async () => {
      // SETUP: S3 result with error message
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: message includes S3's error message
    });
  });

  describe('Happy path - symlink exists', () => {
    it('should return exists: true when symlink is valid', async () => {
      // SETUP: Mock lstat() to return symlink Stats
      // SETUP: Mock readlink() to return target
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: exists: true, symlinkTarget populated
    });

    it('should use default project path when no options provided', async () => {
      // SETUP: Mock with default path
      // EXECUTE: Call without options
      // VERIFY: Uses /home/dustin/projects/hacky-hack
    });

    it('should use custom project path when provided', async () => {
      // SETUP: Mock with custom path
      // EXECUTE: Call with { projectPath: '/custom/path' }
      // VERIFY: Uses custom path
    });
  });

  describe('Symlink detection errors', () => {
    it('should return exists: false when path is not a symlink', async () => {
      // SETUP: Mock lstat() with isSymbolicLink: false
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: exists: false, error: 'Not a symlink'
    });

    it('should return exists: false when path does not exist (ENOENT)', async () => {
      // SETUP: Mock lstat() to throw { code: 'ENOENT' }
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: exists: false, error: 'ENOENT'
    });

    it('should return exists: false with EACCES error (permission denied)', async () => {
      // SETUP: Mock lstat() to throw { code: 'EACCES' }
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: exists: false, error: 'EACCES'
    });

    it('should return exists: false with EINVAL error (invalid argument)', async () => {
      // SETUP: Mock lstat() to throw { code: 'EINVAL' }
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: exists: false, error: 'EINVAL'
    });

    it('should handle readlink() errors gracefully', async () => {
      // SETUP: Mock lstat() success, readlink() failure
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: Error returned appropriately
    });
  });

  describe('Result structure', () => {
    it('should return all required fields in result', async () => {
      // SETUP: Mock successful verification
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: exists, path, symlinkTarget, message all present
    });

    it('should populate symlinkTarget when verification succeeds', async () => {
      // SETUP: Mock readlink() to return target path
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: symlinkTarget matches mock value
    });

    it('should include error field when verification fails', async () => {
      // SETUP: Mock lstat() to throw error
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: error field is populated
    });
  });

  describe('Integration with S3', () => {
    it('should consume S3 result correctly', async () => {
      // SETUP: Create realistic S3 result
      // EXECUTE: Call verifyGroundswellSymlink(s3Result)
      // VERIFY: S3 fields are used correctly
    });

    it('should pass through S3 error messages on skip', async () => {
      // SETUP: S3 result with specific error message
      // EXECUTE: Call verifyGroundswellSymlink()
      // VERIFY: Result includes S3's message
    });
  });
});
```

---

## Confidence Score

**Overall Confidence: 9/10**

**Reasoning:**
- Comprehensive research documented in S4 research files (symlink-verification-research.md, ls-output-parsing-research.md)
- Clear patterns established in S1-S3 implementations
- Native API approach (fs.lstat/fs.readlink) is well-documented and tested
- Test patterns are consistent across the codebase
- Only uncertainty is integration with S5 (which is out of scope for this PRP)

**Risk Mitigation:**
- All code patterns verified against existing implementations
- Test patterns match existing groundswell-linker.test.ts structure
- Error handling follows established conventions
- Type safety ensured through TypeScript

---

## Appendix: Quick Reference

### Key File Locations

| File | Purpose | Key Content |
|------|---------|-------------|
| `src/utils/groundswell-linker.ts` | Implementation | Add verifyGroundswellSymlink() function |
| `tests/unit/utils/groundswell-linker.test.ts` | Tests | Add S4 test suite |

### Import Statement

```typescript
import { lstat, readlink } from 'node:fs/promises';
import { join } from 'node:path';
// Both already imported in groundswell-linker.ts (lines 27-28)
```

### Function Signature

```typescript
export async function verifyGroundswellSymlink(
  previousResult: GroundswellLocalLinkResult,
  options?: GroundswellSymlinkVerifyOptions
): Promise<GroundswellSymlinkVerifyResult>
```

### Critical Constants

```typescript
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack'; // Already exists
const symlinkPath = join(projectPath, 'node_modules', 'groundswell');
```

---

**End of PRP for P1.M1.T1.S4**
