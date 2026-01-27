# PRP for P1.M3.T2.S1: Add validateNestedExecution function

---

## Goal

**Feature Goal**: Implement `validateNestedExecution` function to prevent recursive PRP Pipeline execution while allowing legitimate bug fix session recursion.

**Deliverable**:
1. `NestedExecutionError` class in `src/utils/errors.ts`
2. `validateNestedExecution` function in `src/utils/validation/execution-guard.ts` (or added to `session-validation.ts`)
3. Unit tests in `tests/unit/utils/validation/execution-guard.test.ts`
4. Integration in `src/workflows/prp-pipeline.ts` at line ~1710

**Success Definition**:
- Function throws `NestedExecutionError` when `PRP_PIPELINE_RUNNING` is set and conditions for legitimate recursion are NOT met
- Function returns without error when `PRP_PIPELINE_RUNNING` is not set (first execution)
- Function returns without error when `SKIP_BUG_FINDING='true'` AND session path contains 'bugfix' (legitimate recursion)
- Error message includes existing PID for debugging
- All unit tests pass covering all scenarios
- Integration with PRP Pipeline prevents nested execution

---

## Why

- **Critical Safety Mechanism**: PRD §9.2.5 requires PRP_PIPELINE_RUNNING guard to prevent recursive pipeline execution that could corrupt pipeline state
- **Prevent Infinite Loops**: Implementation agents might accidentally trigger pipeline execution during code generation
- **Resource Protection**: Prevents API token exhaustion, file system conflicts, and duplicate session creation
- **Legitimate Recursion Support**: Bug fix sessions need to recurse when `SKIP_BUG_FINDING=true` and path contains 'bugfix'
- **Debug Logging**: Provides clear error messages with PID information for troubleshooting

**Problems this solves**:
- Agents accidentally invoking `run-prd.sh` during implementation
- Validation scripts triggering pipeline execution
- Bug fix sessions being blocked when they should be allowed
- Corrupted pipeline state from duplicate sessions

---

## What

### User-Visible Behavior

No direct user-visible behavior - this is a pipeline safety mechanism. Users will experience:

**Success Scenario**:
- Bug fix sessions execute successfully when `SKIP_BUG_FINDING=true` and path contains 'bugfix'

**Error Scenario**:
- Nested execution attempt throws error: `"Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {existing_pid}"`
- Pipeline execution stops before creating duplicate sessions or corrupting state

### Technical Requirements

#### Function Signature

```typescript
export function validateNestedExecution(sessionPath: string): void
```

#### Logic Specification

1. Check if `process.env.PRP_PIPELINE_RUNNING` is set
2. If NOT set: Return without error (first execution)
3. If set:
   - Check if `process.env.SKIP_BUG_FINDING === 'true'` (EXACT string match, case-sensitive)
   - Check if `sessionPath.toLowerCase().includes('bugfix')` (case-insensitive)
   - If BOTH conditions true: Return without error (legitimate recursion)
   - If EITHER condition false: Throw `NestedExecutionError` with message including existing PID

#### Error Message Format

```
Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {process.env.PRP_PIPELINE_RUNNING}
```

#### Error Context

```typescript
{
  existingPid: string;  // From process.env.PRP_PIPELINE_RUNNING
  currentPid: string;   // From process.pid.toString()
  sessionPath: string;  // The session path being validated
}
```

### Success Criteria

- [ ] `NestedExecutionError` class extends `PipelineError` with proper prototype chain
- [ ] Error code `PIPELINE_VALIDATION_NESTED_EXECUTION` added to `ErrorCodes`
- [ ] `validateNestedExecution` function returns `void` (throws on error)
- [ ] Function allows execution when `PRP_PIPELINE_RUNNING` is not set
- [ ] Function allows execution when `SKIP_BUG_FINDING='true'` AND path contains 'bugfix'
- [ ] Function throws `NestedExecutionError` for illegitimate nested execution
- [ ] Error message includes existing PID
- [ ] Error context includes existingPid, currentPid, and sessionPath
- [ ] Unit tests cover all scenarios (first execution, legitimate recursion, illegitimate recursion)
- [ ] Integration in PRP Pipeline at correct location (after `initializeSession()`)
- [ ] All tests pass

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: ✅ This PRP provides everything needed to implement `validateNestedExecution` successfully:
- Exact function signature and logic specification
- Complete error class pattern to follow
- Exact file locations and line numbers for integration
- All environment variable patterns with examples
- Complete test patterns from existing codebase
- PRD requirements with exact error message format
- Previous PRP outputs consumed (P1.M3.T1.S4 validation patterns)

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# PRD Requirements
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S1/research/prd-requirements.md
  why: Exact PRD §9.2.5 requirements for PRP_PIPELINE_RUNNING guard
  section: "Implementation Specification" for exact function logic
  critical: Error message format must match exactly: "Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {process.env.PRP_PIPELINE_RUNNING}"

# Validation Patterns (Follow These Exactly)
- file: src/utils/validation/session-validation.ts
  why: Reference pattern for validateBugfixSession - same pattern to follow
  pattern: Void function that throws on error, implicit success on return
  section: Lines 73-86 for validateBugfixSession implementation
  gotcha: Function returns void, no return statement needed for success

# Error Class Pattern
- file: src/utils/errors.ts
  why: PipelineError base class and error code patterns
  pattern: All errors extend PipelineError with abstract code property
  section: Lines 1-100 for PipelineError base class structure
  section: Lines 494-502 for BugfixSessionValidationError example (similar pattern)
  gotcha: Must set Object.setPrototypeOf(this, new.target.prototype) in constructor

# Environment Variable Patterns
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S1/research/environment-variables.md
  why: Exact patterns for checking PRP_PIPELINE_RUNNING and SKIP_BUG_FINDING
  section: "Implementation Pattern for validateNestedExecution"
  critical: SKIP_BUG_FINDING must use EXACT string match: === 'true'
  critical: Path check must be case-insensitive: sessionPath.toLowerCase().includes('bugfix')

# PRP Pipeline Integration Point
- file: src/workflows/prp-pipeline.ts
  why: Exact location to call validateNestedExecution
  pattern: After initializeSession(), before decomposePRD()
  section: Lines 1710-1711 for integration location
  section: Lines 1705-1707 for where PRP_PIPELINE_RUNNING is set
  section: Lines 1815-1819 for where PRP_PIPELINE_RUNNING is cleared
  gotcha: Session path available at this.sessionManager.currentSession.metadata.path

# Test Patterns
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S1/research/test-patterns.md
  why: Complete test structure and patterns for validation functions
  section: "Test Pattern for validateNestedExecution" for exact test structure
  pattern: Vitest describe/it structure, vi.stubEnv for environment mocking
  gotcha: Always use vi.unstubAllEnvs() in afterEach to restore environment

# TypeScript Best Practices
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S1/research/typescript-best-practices.md
  why: Recommended implementation pattern for P1M3T2S1
  section: "Recommended Pattern for P1M3T2S1" for complete implementation
  critical: Void return, exact string matching, case-insensitive path check

# Previous PRP (Dependencies)
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T1S4/PRP.md
  why: Previous subtask that established validation patterns
  section: "Implementation Blueprint" for validation function patterns
  gotcha: Follow same patterns as validateBugfixSession for consistency

# Error Testing Reference
- file: tests/unit/utils/errors.test.ts
  why: Reference for error class testing patterns
  pattern: Instanceof tests, prototype chain tests, error property tests
  section: Lines 676-744 for BugfixSessionValidationError test patterns
  gotcha: Tests name, code, message, context, instanceof chain

# Validation Testing Reference
- file: tests/unit/utils/validation/session-validation.test.ts
  why: Reference for validation function testing patterns
  pattern: 45+ tests covering all scenarios with describe/it structure
  gotcha: Uses .js extension in imports, expect.fail() for test logic errors
```

### Current Codebase tree

```bash
src/
├── utils/
│   ├── errors.ts                                # ALL error classes, type guards
│   └── validation/
│       └── session-validation.ts                # validateBugfixSession pattern to follow
├── workflows/
│   └── prp-pipeline.ts                          # Integration point (line ~1710)
└── config/
    └── environment.ts                           # Environment variable patterns

tests/
└── unit/
    └── utils/
        ├── errors.test.ts                       # Error class test patterns
        └── validation/
            └── session-validation.test.ts       # Validation function test patterns
```

### Desired Codebase tree with files to be added

```bash
src/
├── utils/
│   ├── errors.ts                                # MODIFY: Add NestedExecutionError class, error code, type guard
│   └── validation/
│       ├── session-validation.ts                # Existing (reference pattern)
│       └── execution-guard.ts                   # NEW: validateNestedExecution function
└── workflows/
    └── prp-pipeline.ts                          # MODIFY: Add validateNestedExecution call at ~line 1710

tests/
└── unit/
    └── utils/
        └── validation/
            └── execution-guard.test.ts          # NEW: Unit tests for validateNestedExecution
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: SKIP_BUG_FINDING must use EXACT string match (case-sensitive)
// Correct: process.env.SKIP_BUG_FINDING === 'true'
// Wrong: process.env.SKIP_BUG_FINDING (truthy check fails on 'false')
// Wrong: process.env.SKIP_BUG_FINDING?.toLowerCase() === 'true' (unnecessary)

// CRITICAL: Path check must be case-insensitive
// Correct: sessionPath.toLowerCase().includes('bugfix')
// Wrong: sessionPath.includes('bugfix') (misses 'BugFix', 'BUGFIX')

// CRITICAL: Must set prototype chain in error constructor
// In NestedExecutionError constructor:
// Object.setPrototypeOf(this, NestedExecutionError.prototype);

// CRITICAL: Import paths use .js extension (ES modules)
// import { PipelineError, ErrorCodes } from '../errors.js';

// CRITICAL: Validation functions return void, throw on error
// No return statement needed for success case

// CRITICAL: PRP_PIPELINE_RUNNING is set AFTER validation in prp-pipeline.ts
// Line 1705-1707: process.env.PRP_PIPELINE_RUNNING = currentPid;
// So validateNestedExecution checks if it's already set from previous execution

// CRITICAL: Session path available after initializeSession()
// this.sessionManager.currentSession.metadata.path

// CRITICAL: Use vi.stubEnv() and vi.unstubAllEnvs() for environment mocking in tests
// Always restore environment in afterEach

// CRITICAL: Use expect.fail() for test logic errors
// expect.fail('Should have thrown NestedExecutionError');

// CRITICAL: Error context is attached directly to error instance
// In PipelineError constructor: if (context) { Object.assign(this, context); }

// GOTCHA: validateBugfixSession pattern uses .includes() for substring check
// Use same pattern for 'bugfix' check but with toLowerCase()

// GOTCHA: Error code must be added to ErrorCodes const in errors.ts
// Add: PIPELINE_VALIDATION_NESTED_EXECUTION: 'PIPELINE_VALIDATION_NESTED_EXECUTION'

// GOTCHA: Type guard function follows naming pattern: is{ErrorName}(error: unknown): error is {ErrorType}
// export function isNestedExecutionError(error: unknown): error is NestedExecutionError
```

---

## Implementation Blueprint

### Data models and structure

No new data models - using existing PipelineError infrastructure:

```typescript
// Error context interface
interface NestedExecutionErrorContext extends PipelineErrorContext {
  existingPid?: string;
  currentPid?: string;
  sessionPath?: string;
}

// Error class extends PipelineError
class NestedExecutionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION;
  // ... inherited: context, timestamp, cause, name, message
}

// Validation function signature
function validateNestedExecution(sessionPath: string): void;

// Type guard
function isNestedExecutionError(error: unknown): error is NestedExecutionError;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/utils/errors.ts
  - ADD error code: PIPELINE_VALIDATION_NESTED_EXECUTION to ErrorCodes const
  - IMPLEMENT: NestedExecutionError class extending PipelineError
  - FOLLOW pattern: BugfixSessionValidationError (lines 494-502)
  - CONSTRUCTOR: Accept message, context with existingPid/currentPid/sessionPath, cause
  - MUST: Object.setPrototypeOf(this, NestedExecutionError.prototype) in constructor
  - CODE property: readonly code = ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION
  - IMPLEMENT: isNestedExecutionError type guard function
  - EXPORT: NestedExecutionError class and isNestedExecutionError function
  - PLACEMENT: After existing error classes, maintain alphabetical/organizational order

Task 2: CREATE src/utils/validation/execution-guard.ts
  - IMPORT: PipelineError, ErrorCodes, isNestedExecutionError from '../errors.js'
  - IMPLEMENT: validateNestedExecution(sessionPath: string): void function
  - LOGIC:
    1. const existingPid = process.env.PRP_PIPELINE_RUNNING
    2. if (!existingPid) return (no pipeline running)
    3. const isBugfixRecursion = process.env.SKIP_BUG_FINDING === 'true' && sessionPath.toLowerCase().includes('bugfix')
    4. if (isBugfixRecursion) return (legitimate recursion)
    5. throw new NestedExecutionError(message, context)
  - MESSAGE: "Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {existingPid}"
  - CONTEXT: { existingPid, currentPid: process.pid.toString(), sessionPath }
  - EXPORT: validateNestedExecution function, re-export NestedExecutionError and isNestedExecutionError
  - PLACEMENT: New file in src/utils/validation/

Task 3: CREATE tests/unit/utils/validation/execution-guard.test.ts
  - IMPORT: describe, expect, it, beforeEach, afterEach from 'vitest'
  - IMPORT: validateNestedExecution, NestedExecutionError, isNestedExecutionError
  - MOCK: vi.mock('../../src/utils/logger.js') if needed
  - IMPLEMENT: describe('execution-guard') nested structure
  - IMPLEMENT: describe('validateNestedExecution') with nested describe blocks
  - TEST SCENARIOS:
    1. When PRP_PIPELINE_RUNNING not set → should allow execution
    2. When PRP_PIPELINE_RUNNING set + SKIP_BUG_FINDING='true' + path has 'bugfix' → should allow
    3. When PRP_PIPELINE_RUNNING set + SKIP_BUG_FINDING not set → should throw
    4. When PRP_PIPELINE_RUNNING set + path no 'bugfix' → should throw
    5. Error message includes existing PID
    6. Error context has existingPid, currentPid, sessionPath
    7. isNestedExecutionError type guard works correctly
  - PATTERN: Follow session-validation.test.ts structure (45+ tests example)
  - CLEANUP: vi.unstubAllEnvs() in afterEach
  - PLACEMENT: tests/unit/utils/validation/

Task 4: MODIFY src/workflows/prp-pipeline.ts
  - IMPORT: validateNestedExecution from '../utils/validation/execution-guard.js'
  - LOCATE: Line ~1710 (after await this.initializeSession();)
  - INTEGRATE: Add validateNestedExecution call
  - CODE:
    if (this.sessionManager.currentSession?.metadata.path) {
      const sessionPath = this.sessionManager.currentSession.metadata.path;
      validateNestedExecution(sessionPath);
    }
  - PRESERVE: Existing guard setting at lines 1705-1707
  - PRESERVE: Existing guard cleanup at lines 1815-1819
  - PLACEMENT: After initializeSession(), before decomposePRD()

Task 5: RUN Level 1 validation (Syntax & Style)
  - COMMAND: npx tsc --noEmit src/utils/validation/execution-guard.ts
  - COMMAND: npx tsc --noEmit src/workflows/prp-pipeline.ts
  - COMMAND: npx tsc --noEmit src/utils/errors.ts
  - EXPECTED: Zero type errors
  - FIX: Any TypeScript errors before proceeding

Task 6: RUN Level 2 validation (Unit Tests)
  - COMMAND: npm test -- tests/unit/utils/validation/execution-guard.test.ts
  - EXPECTED: All tests pass
  - FIX: Any test failures before proceeding

Task 7: RUN Level 3 validation (Integration)
  - MANUAL: Test with actual bugfix session path
  - MANUAL: Test with non-bugfix path to verify error thrown
  - EXPECTED: Correct behavior in both scenarios
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Error Class Definition (Task 1)
// ============================================================================
// File: src/utils/errors.ts
// Add to ErrorCodes const:

export const ErrorCodes = {
  // ... existing codes ...
  PIPELINE_VALIDATION_NESTED_EXECUTION: 'PIPELINE_VALIDATION_NESTED_EXECUTION',
} as const;

// Add error class after existing error classes:

export class NestedExecutionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION;

  constructor(
    message: string,
    context?: PipelineErrorContext & {
      existingPid?: string;
      currentPid?: string;
      sessionPath?: string;
    },
    cause?: Error
  ) {
    super(message, context, cause);
    // CRITICAL: Set prototype for instanceof checks
    Object.setPrototypeOf(this, NestedExecutionError.prototype);
  }
}

// Add type guard:

export function isNestedExecutionError(error: unknown): error is NestedExecutionError {
  return error instanceof NestedExecutionError;
}

// ============================================================================
// PATTERN 2: Validation Function (Task 2)
// ============================================================================
// File: src/utils/validation/execution-guard.ts

import {
  PipelineError,
  ErrorCodes,
} from '../errors.js';

import {
  NestedExecutionError,
  isNestedExecutionError,
} from '../errors.js';

export function validateNestedExecution(sessionPath: string): void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;

  // If no pipeline is running, allow execution
  if (!existingPid) {
    return;
  }

  // Check if this is legitimate bug fix recursion
  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' &&  // EXACT string match
    sessionPath.toLowerCase().includes('bugfix');  // Case-insensitive check

  if (isBugfixRecursion) {
    // Legitimate recursion - allow it
    return;
  }

  // Illegitimate nested execution - throw error
  throw new NestedExecutionError(
    `Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: ${existingPid}`,
    {
      existingPid,
      currentPid: process.pid.toString(),
      sessionPath,
    }
  );
}

// Re-export for convenience
export { NestedExecutionError, isNestedExecutionError };

// ============================================================================
// PATTERN 3: PRP Pipeline Integration (Task 4)
// ============================================================================
// File: src/workflows/prp-pipeline.ts
// Add import at top:
import { validateNestedExecution } from '../utils/validation/execution-guard.js';

// Add validation call at line ~1710:
await this.initializeSession();

// NEW: Add validateNestedExecution guard
if (this.sessionManager.currentSession?.metadata.path) {
  const sessionPath = this.sessionManager.currentSession.metadata.path;
  validateNestedExecution(sessionPath);
}

await this.decomposePRD();

// ============================================================================
// PATTERN 4: Test Structure (Task 3)
// ============================================================================
// File: tests/unit/utils/validation/execution-guard.test.ts

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  validateNestedExecution,
  NestedExecutionError,
  isNestedExecutionError,
} from '../../../../src/utils/validation/execution-guard.js';

describe('execution-guard', () => {
  describe('validateNestedExecution', () => {
    afterEach(() => {
      vi.unstubAllEnvs();  // CRITICAL: Always restore environment
    });

    describe('when PRP_PIPELINE_RUNNING is not set', () => {
      it('should allow execution', () => {
        delete process.env.PRP_PIPELINE_RUNNING;
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).not.toThrow();
      });
    });

    describe('when PRP_PIPELINE_RUNNING is set with bug fix recursion', () => {
      beforeEach(() => {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
        vi.stubEnv('SKIP_BUG_FINDING', 'true');
      });

      it('should allow execution for bugfix path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).not.toThrow();
      });
    });

    describe('when PRP_PIPELINE_RUNNING is set without bug fix recursion', () => {
      beforeEach(() => {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      });

      it('should throw NestedExecutionError when SKIP_BUG_FINDING not set', () => {
        delete process.env.SKIP_BUG_FINDING;
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(NestedExecutionError);
      });

      it('should throw NestedExecutionError when path does not contain bugfix', () => {
        vi.stubEnv('SKIP_BUG_FINDING', 'true');
        const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(NestedExecutionError);
      });
    });

    describe('error properties', () => {
      beforeEach(() => {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      });

      it('should include existing PID in error message', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
        try {
          validateNestedExecution(sessionPath);
          expect.fail('Should have thrown NestedExecutionError');
        } catch (error) {
          expect((error as Error).message).toContain('12345');
        }
      });

      it('should include context with PIDs and session path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
        try {
          validateNestedExecution(sessionPath);
          expect.fail('Should have thrown NestedExecutionError');
        } catch (error) {
          expect((error as NestedExecutionError).existingPid).toBe('12345');
          expect((error as NestedExecutionError).currentPid).toBeDefined();
          expect((error as NestedExecutionError).sessionPath).toBe(sessionPath);
        }
      });
    });

    describe('type guard', () => {
      it('should identify NestedExecutionError correctly', () => {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
        const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
        try {
          validateNestedExecution(sessionPath);
          expect.fail('Should have thrown NestedExecutionError');
        } catch (error) {
          expect(isNestedExecutionError(error)).toBe(true);
          expect(isNestedExecutionError(new Error())).toBe(false);
        }
      });
    });
  });
});
```

### Integration Points

```yaml
ERROR_CLASS_HIERARCHY:
  - base: PipelineError (src/utils/errors.ts)
  - extends: NestedExecutionError extends PipelineError
  - prototype_chain: NestedExecutionError -> PipelineError -> Error
  - error_code: PIPELINE_VALIDATION_NESTED_EXECUTION (add to ErrorCodes)
  - type_guard: isNestedExecutionError function

PRP_PIPELINE_GUARD:
  - location: src/workflows/prp-pipeline.ts
  - integrate_line: ~1710 (after initializeSession, before decomposePRD)
  - session_path: this.sessionManager.currentSession.metadata.path
  - guard_set: Line 1705-1707 (process.env.PRP_PIPELINE_RUNNING = currentPid)
  - guard_clear: Line 1815-1819 (delete process.env.PRP_PIPELINE_RUNNING)
  - error_handling: Existing try-catch will catch NestedExecutionError

ENVIRONMENT_VARIABLES:
  - PRP_PIPELINE_RUNNING: Set by pipeline, checked by validateNestedExecution
  - SKIP_BUG_FINDING: Must be exactly 'true' (case-sensitive) for bug fix recursion
  - pattern: Exact string match (=== 'true'), not truthy check

VALIDATION_PATTERN:
  - reference: src/utils/validation/session-validation.ts (validateBugfixSession)
  - return_type: void (throws on error, implicit success)
  - import_extension: .js (ES modules)
  - error_class: Custom error extending PipelineError
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
# Type check new files
npx tsc --noEmit src/utils/validation/execution-guard.ts
npx tsc --noEmit src/utils/errors.ts
npx tsc --noEmit src/workflows/prp-pipeline.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Check for linting errors (if linter configured)
npm run lint src/utils/validation/
npm run lint src/workflows/prp-pipeline.ts

# Check formatting (if formatter configured)
npm run format:check src/utils/validation/
npm run format:check src/workflows/prp-pipeline.ts
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run specific test file (Task 6)
npm test -- tests/unit/utils/validation/execution-guard.test.ts

# Expected output:
# ✓ tests/unit/utils/validation/execution-guard.test.ts (10+ tests)
#   ✓ validateNestedExecution when PRP_PIPELINE_RUNNING is not set (1 test)
#   ✓ validateNestedExecution when PRP_PIPELINE_RUNNING is set with bug fix recursion (1+ tests)
#   ✓ validateNestedExecution when PRP_PIPELINE_RUNNING is set without bug fix recursion (2+ tests)
#   ✓ error properties (2+ tests)
#   ✓ type guard (1 test)
#
# Test Files  1 passed (1)
# Tests  10+ passed (10+)

# Run with coverage (if available)
npm test -- --coverage tests/unit/utils/validation/
# Expected: High coverage percentage for validateNestedExecution

# Run related error tests
npm test -- tests/unit/utils/errors.test.ts
# Expected: All NestedExecutionError tests pass

# Run all validation tests
npm test -- tests/unit/utils/validation/
# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual verification: Test with bugfix session path (should succeed)
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
process.env.SKIP_BUG_FINDING = 'true';
process.env.PRP_PIPELINE_RUNNING = '12345';
const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
validateNestedExecution(sessionPath);
console.log('PASS: Bugfix recursion allowed');
"
# Expected: PASS: Bugfix recursion allowed

# Manual verification: Test with feature session path (should throw)
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
process.env.SKIP_BUG_FINDING = 'true';
process.env.PRP_PIPELINE_RUNNING = '12345';
const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
try {
  validateNestedExecution(sessionPath);
  console.error('FAIL: Should have thrown NestedExecutionError');
} catch (error) {
  if (error.code === 'PIPELINE_VALIDATION_NESTED_EXECUTION') {
    console.log('PASS: NestedExecutionError thrown correctly');
  } else {
    console.error('FAIL: Wrong error type:', error);
  }
}
"
# Expected: PASS: NestedExecutionError thrown correctly

# Manual verification: Test without PRP_PIPELINE_RUNNING (should succeed)
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
delete process.env.PRP_PIPELINE_RUNNING;
const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
validateNestedExecution(sessionPath);
console.log('PASS: First execution allowed');
"
# Expected: PASS: First execution allowed

# Test PRP Pipeline integration
# Run a pipeline task and verify guard is called
cd plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918
# Run any workflow task
# Expected: Guard prevents nested execution if already running
```

### Level 4: Domain-Specific Validation

```bash
# Domain-specific: Test actual bugfix session from codebase
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
process.env.SKIP_BUG_FINDING = 'true';
process.env.PRP_PIPELINE_RUNNING = '12345';
const actualPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
validateNestedExecution(actualPath);
console.log('PASS: Actual bugfix session allowed');
"
# Expected: PASS: Actual bugfix session allowed

# Domain-specific: Test case variations in 'bugfix'
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
process.env.SKIP_BUG_FINDING = 'true';
process.env.PRP_PIPELINE_RUNNING = '12345';
const paths = [
  'plan/003/bugfix/001',
  'plan/003/BugFix/001',
  'plan/003/BUGFIX/001',
];
for (const path of paths) {
  validateNestedExecution(path);
  console.log(\`PASS: \${path} allowed\`);
}
}
"
# Expected: All PASS (case-insensitive check works)

# Domain-specific: Verify error message format
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
process.env.PRP_PIPELINE_RUNNING = '99999';
const sessionPath = 'plan/003/feature/001';
try {
  validateNestedExecution(sessionPath);
} catch (error) {
  console.log('Error message:', error.message);
  console.log('Contains PID?', error.message.includes('99999'));
  console.log('Expected format?', error.message.includes('Nested PRP Pipeline execution detected. Only bug fix sessions can recurse'));
}
"
# Expected: Error message matches PRD specification exactly
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `NestedExecutionError` class added to `src/utils/errors.ts`
- [ ] Error code `PIPELINE_VALIDATION_NESTED_EXECUTION` added to `ErrorCodes`
- [ ] `isNestedExecutionError` type guard function added
- [ ] `validateNestedExecution` function created in `src/utils/validation/execution-guard.ts`
- [ ] All TypeScript type checking passes: `npx tsc --noEmit src/utils/validation/`
- [ ] No linting errors: `npm run lint src/utils/validation/`
- [ ] No formatting issues: `npm run format:check src/utils/validation/`
- [ ] Function integrated in `src/workflows/prp-pipeline.ts` at line ~1710
- [ ] All unit tests pass: `npm test -- tests/unit/utils/validation/execution-guard.test.ts`
- [ ] Related error tests pass: `npm test -- tests/unit/utils/errors.test.ts`
- [ ] All validation tests pass: `npm test -- tests/unit/utils/validation/`

### Feature Validation

- [ ] Function allows execution when `PRP_PIPELINE_RUNNING` is not set
- [ ] Function allows execution when `SKIP_BUG_FINDING='true'` AND path contains 'bugfix'
- [ ] Function throws `NestedExecutionError` for illegitimate nested execution
- [ ] Error message includes existing PID
- [ ] Error message matches PRD specification exactly
- [ ] Error context includes existingPid, currentPid, and sessionPath
- [ ] `SKIP_BUG_FINDING` check uses exact string match (`=== 'true'`)
- [ ] Path check is case-insensitive (`toLowerCase().includes('bugfix')`)
- [ ] `isNestedExecutionError` type guard works correctly
- [ ] Prototype chain is correct (NestedExecutionError -> PipelineError -> Error)

### Code Quality Validation

- [ ] Follows existing validation function pattern (void return, throw on error)
- [ ] Follows existing error class pattern (extends PipelineError)
- [ ] Error class sets prototype chain correctly
- [ ] Import paths use `.js` extension (ES modules)
- [ ] Function is exported and can be imported
- [ ] Error class is exported and can be imported
- [ ] Type guard is exported and can be imported
- [ ] Code is self-documenting with clear variable names
- [ ] Tests follow Vitest patterns (describe/it structure)
- [ ] Tests use proper environment variable mocking (vi.stubEnv, vi.unstubAllEnvs)

### Integration Validation

- [ ] `validateNestedExecution` called in PRP Pipeline at correct location
- [ ] Called after `initializeSession()` when session path is available
- [ ] Called before `decomposePRD()` for early detection
- [ ] Error is caught by existing error handling in PRP Pipeline
- [ ] Manual testing with actual bugfix session path succeeds
- [ ] Manual testing with feature session path throws error
- [ ] Manual testing without `PRP_PIPELINE_RUNNING` succeeds

### Documentation & Deployment

- [ ] JSDoc comments added to function (if needed)
- [ ] Error class is documented (if needed)
- [ ] Changes are minimal and focused on guard implementation
- [ ] No unnecessary refactoring or code changes
- [ ] All research documents preserved in `research/` directory

---

## Anti-Patterns to Avoid

- ❌ Don't use truthy check for `SKIP_BUG_FINDING` - must be exact string match `=== 'true'`
- ❌ Don't use case-sensitive check for 'bugfix' - must be case-insensitive
- ❌ Don't forget to set prototype chain in error constructor
- ❌ Don't skip the type guard function - all error classes have one
- ❌ Don't use `.ts` extension in imports - must use `.js` (ES modules)
- ❌ Don't forget to restore environment in test afterEach - use `vi.unstubAllEnvs()`
- ❌ Don't add return statements for success case - void functions return implicitly
- ❌ Don't modify existing error classes - only add new `NestedExecutionError`
- ❌ Don't place guard before `initializeSession()` - session path not available yet
- ❌ Don't place guard after `decomposePRD()` - too late, damage already done
- ❌ Don't hardcode PID values in tests - use vi.stubEnv for flexibility
- ❌ Don't skip testing the type guard function - it's part of the contract
- ❌ Don't forget to add error code to `ErrorCodes` const
- ❌ Don't use generic `Error` class - must extend `PipelineError`
- ❌ Don't skip environment variable cleanup in tests - causes test pollution

---

## Confidence Score

**Rating: 9/10** for one-pass implementation success likelihood

**Rationale**:
- ✅ Complete PRD requirements with exact error message format
- ✅ Clear reference patterns from existing codebase (validateBugfixSession)
- ✅ Exact file locations and line numbers for integration
- ✅ Complete environment variable patterns with examples
- ✅ Comprehensive test patterns from existing tests
- ✅ TypeScript best practices documented
- ✅ All gotchas identified with do's and don'ts
- ✅ Previous PRP outputs consumed and integrated
- ⚠️ Only dependency is on P1.M3.T1.S4 completing (currently in parallel execution)
- ⚠️ Requires understanding of PipelineError inheritance pattern (well documented)

**Validation**: The completed PRP provides an AI agent unfamiliar with the codebase with everything needed to implement `validateNestedExecution` successfully using only the PRP content and codebase access.
