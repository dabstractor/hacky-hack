# Product Requirement Prompt (PRP): Call validateNestedExecution in PRP Pipeline Entry Point

**PRP ID**: P1.M3.T2.S3
**Work Item Title**: Call validateNestedExecution in PRP Pipeline entry point
**Status**: READY FOR IMPLEMENTATION
**Created**: 2025-01-27
**Confidence Score**: 9/10

**CRITICAL BUG FIX REQUIRED**: Current implementation has validation in wrong location. Guard is set at line 1707, validation happens at line 1724. **Validation must happen BEFORE guard is set.**

---

## Goal

**Feature Goal**: Integrate the `validateNestedExecution` function into the PRP Pipeline entry point with proper error handling and debug logging to prevent accidental recursive pipeline execution while allowing legitimate bugfix session recursion.

**Deliverable**: Updated `PRPPipeline.run()` method in `src/workflows/prp-pipeline.ts` with:

- Import of `isNestedExecutionError` type guard
- Validation call **MOVED** from line 1724 to BEFORE guard setting (line 1707)
- try-catch wrapper around `validateNestedExecution` call
- Debug logging before validation (checking intent)
- Debug logging after successful validation
- Specific error logging and re-throw for `NestedExecutionError`
- Old validation location at lines 1722-1725 **REMOVED**

**Success Definition**:

- [ ] `isNestedExecutionError` imported from validation module
- [ ] `validateNestedExecution` call **MOVED** to BEFORE `PRP_PIPELINE_RUNNING` is set (line 1707)
- [ ] Validation call wrapped in try-catch with type guard
- [ ] Debug logging before validation: `Checking for nested execution at {sessionPath}`
- [ ] Debug logging after success: `No nested execution detected, proceeding`
- [ ] Error logging for `NestedExecutionError` with full context (PIDs, session path)
- [ ] Error is re-thrown to prevent execution
- [ ] Old validation call at lines 1722-1725 **REMOVED**
- [ ] Unit tests verify validation happens before guard is set
- [ ] All tests pass

---

## User Persona

**Target User**: PRP Pipeline developers and error handling systems

**Use Case**: When PRP Pipeline starts execution, it must validate that it's not being run recursively (nested execution) which could corrupt session state. The validation happens as early as possible (after session initialization) and provides clear error messages if nested execution is detected.

**User Journey**:

1. Developer or system initiates PRP Pipeline
2. Pipeline starts and initializes session (to get session path)
3. Pipeline validates no nested execution is occurring
4. If validation passes: Pipeline proceeds with normal workflow
5. If validation fails: Error is logged with full context and execution is aborted

**Pain Points Addressed**:

- Prevents accidental recursive pipeline execution that could corrupt state
- Provides clear debug logging for troubleshooting nested execution issues
- Enables legitimate bugfix session recursion with proper env vars
- Gives specific error context (PIDs, session path) for debugging

---

## Why

**Business value and user impact**:

- Prevents state corruption from nested pipeline executions
- Protects against infinite recursion loops
- Enables legitimate bugfix session workflows (recursive execution for fixing bugs)
- Provides clear, actionable error messages with full context

**Integration with existing features**:

- Part of P1.M3 (Session Validation Guards) milestone
- Uses `validateNestedExecution()` function from P1.M3.T2.S1
- Uses `NestedExecutionError` class from P1.M3.T2.S2
- Integrates with `PRP_PIPELINE_RUNNING` environment variable guard (set in P1.M3.T2.S4)
- Supports `SKIP_BUG_FINDING=true` for legitimate recursion

**Problems this solves**:

1. **Nested execution prevention**: Stops recursive pipeline execution that could corrupt session state
2. **Debug visibility**: Provides clear logging about validation attempts and results
3. **Error context**: When validation fails, logs full context (existing PID, current PID, session path)
4. **Legitimate recursion support**: Allows bugfix sessions to recurse when `SKIP_BUG_FINDING=true`

---

## What

**User-visible behavior**: When PRP Pipeline starts execution, it validates against nested execution before proceeding with any pipeline work. The validation happens immediately after session initialization (when session path becomes available) and includes comprehensive debug logging.

**Technical requirements**:

- Import `isNestedExecutionError` type guard from validation module
- Wrap `validateNestedExecution` call in try-catch
- Add debug logging before validation call
- Add debug logging after successful validation
- Add specific error logging for `NestedExecutionError` with full context
- Re-throw error to prevent execution

### Success Criteria

- [ ] Import statement includes `isNestedExecutionError` type guard
- [ ] Validation call **MOVED** to before `PRP_PIPELINE_RUNNING` guard is set (critical bug fix)
- [ ] Validation call is wrapped in try-catch block
- [ ] Debug logging before validation shows session path being checked
- [ ] Debug logging after success confirms no nested execution
- [ ] Error logging for `NestedExecutionError` includes existing PID, current PID, and session path
- [ ] Error is re-thrown to prevent pipeline execution
- [ ] Old validation location (lines 1722-1725) is removed
- [ ] Unit tests verify validation happens before guard is set
- [ ] All tests pass (unit + integration)

---

## All Needed Context

### Context Completeness Check

✅ **PASSES "No Prior Knowledge" test**: This PRP provides complete context including:

- Exact file locations and line numbers
- Current implementation state and gaps
- Complete code patterns for error handling and logging
- Import statements and dependencies
- Test patterns and validation commands
- Gotchas and critical implementation details

### Documentation & References

```yaml
# MUST READ - Critical context for implementation

- file: src/workflows/prp-pipeline.ts:1666-1831
  why: The PRPPipeline.run() method - main entry point for pipeline execution
  pattern: async run() method with try-catch error handling and session initialization
  gotcha: **CRITICAL BUG**: Guard set at line 1707, validation at line 1724 (WRONG ORDER)

- file: src/workflows/prp-pipeline.ts:1698-1726
  why: **CRITICAL**: This section has the timing bug - must reorder operations
  pattern: SessionManager creation → **VALIDATION** → Guard setting → Initialize session
  gotcha: Current code: Create SessionManager → Set guard (1707) → Initialize session → Validate (1724)
  required: Create SessionManager → **VALIDATE** → Set guard → Initialize session

- file: src/workflows/prp-pipeline.ts:1722-1725
  why: Current WRONG location of validateNestedExecution call - must be removed
  pattern: Check for session path existence, then call validation
  gotcha: This location is AFTER guard is set - validation must happen BEFORE guard set

- file: src/workflows/prp-pipeline.ts:35
  why: Import statement location for validation functions
  pattern: ESM imports from validation module
  gotcha: Need to add isNestedExecutionError to import

- file: src/utils/validation/execution-guard.ts:56-85
  why: The validateNestedExecution function to call
  pattern: Function that checks environment variables and throws NestedExecutionError
  gotcha: SKIP_BUG_FINDING must be exact 'true', path check case-insensitive

- file: src/utils/validation/execution-guard.ts:88
  why: Re-export location for isNestedExecutionError type guard
  pattern: export { NestedExecutionError, isNestedExecutionError }
  gotcha: Can import both validation function and type guard from same file

- file: src/utils/errors.ts:708-730
  why: Type guard function definition for type narrowing
  pattern: export function isNestedExecutionError(error: unknown): error is NestedExecutionError
  gotcha: Enables type narrowing in catch blocks

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S2/PRP.md
  why: Previous PRP defining NestedExecutionError class and its properties
  section: Complete implementation documentation
  gotcha: Error context includes existingPid, currentPid, sessionPath

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S3/research/
  why: Complete research findings for this PRP
  section: All 6 research documents with implementation details
```

### Current Codebase Tree (relevant sections)

```bash
src/
├── workflows/
│   └── prp-pipeline.ts                     # MAIN FILE TO MODIFY
│       ├── run() method (lines 1666-1831)  # Entry point
│       ├── Import section (line 35)        # Add isNestedExecutionError
│       └── Validation call (lines 1721-1725) # Wrap in try-catch, add logging
│
├── utils/
│   ├── errors.ts                           # Error class definitions
│   │   └── isNestedExecutionError()        # Line 708-730 - Type guard
│   └── validation/
│       └── execution-guard.ts              # Validation function
│           ├── validateNestedExecution()   # Line 56-85
│           └── exports (line 88)           # Re-exports type guard
│
└── utils/
    └── logger.ts                           # Pino logger usage

tests/
├── unit/
│   └── workflows/
│       └── prp-pipeline.test.ts            # ADD TESTS HERE
│
└── unit/
    └── utils/
        └── validation/
            └── execution-guard.test.ts     # Existing tests for validation
```

### Desired Codebase Tree (changes only)

```bash
# No new files needed - only modifications

src/
└── workflows/
    └── prp-pipeline.ts                     # MODIFY
        ├── Import: Add isNestedExecutionError
        └── Validation: Add try-catch + logging

tests/
└── unit/
    └── workflows/
        └── prp-pipeline.test.ts            # MODIFY - Add validation tests
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL BUG FIX: Validation timing is wrong in current implementation
// Current: Guard set at line 1707, validation at line 1724 (AFTER guard set)
// Required: Validation must happen BEFORE guard is set

// WRONG: Current implementation timing
async run(): Promise<PipelineResult> {
  // ... setup code ...
  this.sessionManager = new SessionManagerClass(...);  // Line 1700

  process.env.PRP_PIPELINE_RUNNING = currentPid;       // Line 1707 - GUARD SET
  this.logger.debug(`Set PRP_PIPELINE_RUNNING=${currentPid}`);

  await this.initializeSession();                      // Line 1711

  // Validate no nested execution (WRONG - after guard set!)
  if (this.sessionManager.currentSession?.metadata.path) {
    const sessionPath = this.sessionManager.currentSession.metadata.path;
    validateNestedExecution(sessionPath);              // Line 1724 - TOO LATE!
  }
}

// CORRECT: Validation must happen BEFORE guard is set
async run(): Promise<PipelineResult> {
  // ... setup code ...
  this.sessionManager = new SessionManagerClass(...);  // Line 1700

  // Validate BEFORE setting guard (CORRECT - check before taking lock)
  if (this.sessionManager.currentSession?.metadata.path) {
    const sessionPath = this.sessionManager.currentSession.metadata.path;
    try {
      this.logger.debug(`[PRPPipeline] Checking for nested execution at ${sessionPath}`);
      validateNestedExecution(sessionPath);
      this.logger.debug('[PRPPipeline] No nested execution detected, proceeding');
    } catch (error) {
      if (isNestedExecutionError(error)) {
        this.logger.error(`[PRPPipeline] Nested execution detected: ${error.message}`);
        throw error; // Re-throw to prevent execution
      }
      throw error;
    }
  }

  // NOW safe to set guard (after validation passes)
  process.env.PRP_PIPELINE_RUNNING = currentPid;
  this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);

  await this.initializeSession();
  // ... rest of workflow ...
}

// CRITICAL: Session path availability timing
// Session path is available from SessionManager IMMEDIATELY after instantiation
// No need to wait for initializeSession() - sessionManager.currentSession.metadata.path works
// Gotcha: May be undefined if session initialization fails - check for null/undefined

// CRITICAL: Use isNestedExecutionError for type narrowing
// Without type guard, TypeScript doesn't know error is NestedExecutionError

try {
  validateNestedExecution(sessionPath);
} catch (error) {
  // WRONG: error.context might not exist
  console.log(error.context?.existingPid);

  // CORRECT: Use type guard
  if (isNestedExecutionError(error)) {
    // Type narrowing: error is now NestedExecutionError
    console.log(error.context?.existingPid); // Safe to access
  }
}

// CRITICAL: Optional chaining for session path access
// SessionManager.currentSession might be undefined
const sessionPath = this.sessionManager.currentSession?.metadata.path;
if (sessionPath) {
  // Safe to use sessionPath
}

// CRITICAL: Re-throw error after logging
// Don't catch and swallow - the error MUST prevent execution
try {
  validateNestedExecution(sessionPath);
} catch (error) {
  this.logger.error('Validation failed');
  throw error; // CRITICAL: Re-throw to prevent execution
}

// PATTERN: Debug logging with context object
// Pino logger accepts context as first or second parameter
this.logger.debug({ sessionPath }, 'Message');  // Object first
this.logger.debug('Message', { sessionPath });  // Or second

// GOTCHA: SessionManager is a class, needs to be instantiated
// Import is SessionManagerClass, instance is this.sessionManager
import { SessionManager as SessionManagerClass } from '../core/session-manager.js';
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This PRP uses existing:

```typescript
// From src/utils/validation/execution-guard.ts
export function validateNestedExecution(sessionPath: string): void;

// From src/utils/errors.ts (re-exported from execution-guard.ts)
export function isNestedExecutionError(
  error: unknown
): error is NestedExecutionError;

// NestedExecutionError context structure
interface NestedExecutionErrorContext extends PipelineErrorContext {
  existingPid?: string; // PID of already-running pipeline
  currentPid?: string; // PID of current execution attempt
  sessionPath?: string; // Session path being validated
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: UPDATE IMPORT STATEMENT
  - FILE: src/workflows/prp-pipeline.ts
  - LINE: 35
  - CURRENT: import { validateNestedExecution } from '../utils/validation/execution-guard.js';
  - NEW: import { validateNestedExecution, isNestedExecutionError } from '../utils/validation/execution-guard.js';
  - REASON: Need type guard for error handling in catch block
  - DEPENDENCIES: None

Task 2: MOVE VALIDATION TO BEFORE GUARD SETTING (CRITICAL BUG FIX)
  - FILE: src/workflows/prp-pipeline.ts
  - CURRENT LOCATION: Lines 1722-1725 (AFTER guard set at line 1707)
  - NEW LOCATION: Between lines 1704-1710 (AFTER SessionManager created, BEFORE guard set)
  - CRITICAL: This fixes the timing bug where validation happens after guard is set

  CURRENT CODE (WRONG ORDER):
    // Line 1698-1726
    try {
      this.sessionManager = new SessionManagerClass(...);  // Line 1700

      process.env.PRP_PIPELINE_RUNNING = currentPid;       // Line 1707 - GUARD SET FIRST
      this.logger.debug(`Set PRP_PIPELINE_RUNNING=${currentPid}`);

      await this.initializeSession();                      // Line 1711

      // Validate no nested execution (WRONG - after guard set!)
      if (this.sessionManager.currentSession?.metadata.path) {
        const sessionPath = this.sessionManager.currentSession.metadata.path;
        validateNestedExecution(sessionPath);              // Line 1724 - TOO LATE!
      }
    }

  NEW CODE (CORRECT ORDER):
    try {
      this.sessionManager = new SessionManagerClass(...);  // Line 1700

      // Validate BEFORE setting guard (CORRECT - check before taking lock)
      if (this.sessionManager.currentSession?.metadata.path) {
        const sessionPath = this.sessionManager.currentSession.metadata.path;
        try {
          this.logger.debug(`[PRPPipeline] Checking for nested execution at ${sessionPath}`);
          validateNestedExecution(sessionPath);
          this.logger.debug('[PRPPipeline] No nested execution detected, proceeding');
        } catch (error) {
          if (isNestedExecutionError(error)) {
            this.logger.error(
              { sessionPath, existingPid: error.context?.existingPid, currentPid: error.context?.currentPid },
              '[PRPPipeline] Nested execution detected - cannot proceed'
            );
            throw error; // Re-throw to prevent execution
          }
          throw error; // Re-throw other errors
        }
      }

      // NOW safe to set guard (after validation passes)
      process.env.PRP_PIPELINE_RUNNING = currentPid;
      this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);

      await this.initializeSession();
    }

  - PATTERN: Follow FixCycleWorkflow validation pattern (lines 130-156)
  - LOGGING: Use Pino logger debug level for validation checks
  - ERROR HANDLING: Use isNestedExecutionError type guard for specific error handling
  - TIMING: Validation MUST happen before guard is set (critical fix)
  - DEPENDENCIES: Task 1 (import statement)

Task 3: REMOVE OLD VALIDATION LOCATION
  - FILE: src/workflows/prp-pipeline.ts
  - LINES: 1722-1725 (will shift after Task 2)
  - ACTION: Delete the old validation call that happens after initializeSession()
  - REASON: Validation moved to before guard setting - this is now duplicate code
  - DEPENDENCIES: Task 2 (validation moved to new location)

Task 4: ADD UNIT TESTS FOR VALIDATION INTEGRATION
  - FILE: tests/unit/workflows/prp-pipeline.test.ts
  - ADD: describe('nested execution validation') block
  - TEST SCENARIOS:
    - Should log debug message before validation
    - Should log success message after validation passes
    - Should throw and log NestedExecutionError when nested execution detected
    - Should log error context (PIDs, session path) when validation fails
    - Should re-throw error to prevent execution
    - Should allow legitimate bugfix recursion
    - **CRITICAL**: Validation should happen BEFORE guard is set
  - PATTERN: Follow test structure from tests/unit/workflows/prp-pipeline.test.ts
  - MOCK: validateNestedExecution to throw in failure scenarios
  - SPY: on logger.debug and logger.error to verify logging
  - VERIFY: Order of operations (validate → set guard → initialize)
  - DEPENDENCIES: Task 3 (implementation complete)

Task 5: VERIFY EXISTING TESTS STILL PASS
  - RUN: npx vitest tests/unit/workflows/prp-pipeline.test.ts --run
  - VERIFY: All existing tests still pass
  - VERIFY: No regressions in pipeline execution
  - DEPENDENCIES: Task 4 (new tests)

Task 6: RUN LINTING AND TYPE CHECKING
  - LINT: npx eslint src/workflows/prp-pipeline.ts --max-warnings 0
  - TYPE: npx tsc --noEmit
  - VERIFY: Zero linting errors
  - VERIFY: Zero type errors
  - DEPENDENCIES: Task 2 (implementation)
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL TIMING PATTERN
// ============================================================================
// WRONG ORDER (current implementation bug):
// 1. Create SessionManager
// 2. Set PRP_PIPELINE_RUNNING guard (line 1707)
// 3. Initialize session
// 4. Validate nested execution (line 1724) - TOO LATE!

// CORRECT ORDER (required fix):
// 1. Create SessionManager
// 2. Validate nested execution (BEFORE guard)
// 3. Set PRP_PIPELINE_RUNNING guard (after validation passes)
// 4. Initialize session

// ============================================================================
// VALIDATION PATTERN (follow this)
// ============================================================================

// Pattern: Import validation function and type guard
import {
  validateNestedExecution, // Validation function from P1.M3.T2.S1
  isNestedExecutionError, // Type guard from P1.M3.T2.S2
} from '../utils/validation/execution-guard.js';

// Pattern: Session path access with optional chaining
if (this.sessionManager.currentSession?.metadata.path) {
  const sessionPath = this.sessionManager.currentSession.metadata.path;
  // Safe to use sessionPath - it's guaranteed to be a string here
}

// Pattern: Try-catch with type guard for specific error handling
try {
  // Log validation attempt
  this.logger.debug(
    `[PRPPipeline] Checking for nested execution at ${sessionPath}`
  );

  // Call validation function
  validateNestedExecution(sessionPath);

  // Log success
  this.logger.debug('[PRPPipeline] No nested execution detected, proceeding');
} catch (error) {
  // Use type guard for specific error handling
  if (isNestedExecutionError(error)) {
    // Type narrowing: error is now NestedExecutionError
    this.logger.error(
      `[PRPPipeline] Nested execution detected: ${error.message}`
    );
    this.logger.error(
      `[PRPPipeline] Existing PID: ${error.context?.existingPid}`
    );
    this.logger.error(
      `[PRPPipeline] Current PID: ${error.context?.currentPid}`
    );
    this.logger.error(
      `[PRPPipeline] Session path: ${error.context?.sessionPath}`
    );

    // CRITICAL: Re-throw to prevent execution
    throw error;
  }

  // Re-throw other errors
  throw error;
}

// GOTCHA: The outer try-catch at line 1698 will also catch this error
// But we want specific logging here for nested execution errors
// The error will propagate up and be handled by the outer error handler

// GOTCHA: Don't use else-if for error handling
// Each error type should be checked independently
if (isNestedExecutionError(error)) {
  // Handle nested execution error
  throw error;
}
// Other error types can be handled by outer try-catch
```

### Integration Points

```yaml
VALIDATION FUNCTION:
  - location: src/utils/validation/execution-guard.ts:56-85
  - imported: from '../utils/validation/execution-guard.js'
  - signature: validateNestedExecution(sessionPath: string): void
  - throws: NestedExecutionError when illegitimate nested execution detected

TYPE GUARD:
  - location: src/utils/errors.ts:708-730
  - re-exported: from src/utils/validation/execution-guard.ts:88
  - signature: isNestedExecutionError(error: unknown): error is NestedExecutionError
  - purpose: Type narrowing in catch blocks

LOGGER:
  - location: src/utils/logger.ts
  - imported: from '../utils/logger.js'
  - usage: this.logger.debug(), this.logger.error()
  - pattern: Pino structured logging with context objects

SESSION PATH:
  - location: this.sessionManager.currentSession?.metadata.path
  - available: after initializeSession() completes
  - format: plan/{sequence}_{hash} (e.g., plan/001_14b9dc2a33c7)

ENVIRONMENT VARIABLES:
  - PRP_PIPELINE_RUNNING: Set at line 1707, checked by validateNestedExecution
  - SKIP_BUG_FINDING: Checked by validateNestedExecution for legitimate recursion
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Check the modified file
npx eslint src/workflows/prp-pipeline.ts --max-warnings 0

# Type checking
npx tsc --noEmit

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run PRP Pipeline tests (including new validation tests)
npx vitest tests/unit/workflows/prp-pipeline.test.ts --run

# Run execution guard tests (ensure validation still works)
npx vitest tests/unit/utils/validation/execution-guard.test.ts --run

# Run all workflow tests
npx vitest tests/unit/workflows/ --run

# Expected: All tests pass. New tests verify:
# - Debug logging before validation
# - Debug logging after successful validation
# - Error logging for NestedExecutionError with full context
# - Error is re-thrown to prevent execution
```

### Level 3: Integration Testing (System Validation)

```bash
# Test PRP Pipeline with nested execution guard
# This would be an integration test that:
# 1. Starts pipeline (sets PRP_PIPELINE_RUNNING)
# 2. Attempts to start nested pipeline
# 3. Verifies NestedExecutionError is thrown with proper logging
# 4. Verifies error message contains PID and session path

# Test bugfix session recursion
# Integration test that:
# 1. Sets SKIP_BUG_FINDING=true
# 2. Starts pipeline with bugfix session path
# 3. Verifies nested execution is allowed
# 4. Verifies no NestedExecutionError thrown

# Expected: Integration scenarios work correctly with proper logging
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual testing of debug logging output
# 1. Run pipeline in verbose mode
# 2. Check logs for "Checking for nested execution at {sessionPath}"
# 3. Check logs for "No nested execution detected, proceeding"
# 4. If nested execution, check logs for error messages with PIDs

# Log message validation
# Verify log messages follow existing patterns:
# - Use [PRPPipeline] prefix
# - Include context objects where appropriate
# - Use debug level for validation checks
# - Use error level for validation failures

# Error context validation
# When NestedExecutionError is thrown, verify:
# - Existing PID is logged
# - Current PID is logged
# - Session path is logged
# - Error message is clear and actionable

# Expected: All validation scenarios produce clear, actionable log output
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npx vitest tests/unit/workflows/prp-pipeline.test.ts --run`
- [ ] No linting errors: `npx eslint src/workflows/prp-pipeline.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Import statement includes `isNestedExecutionError`
- [ ] **CRITICAL**: Validation happens BEFORE `PRP_PIPELINE_RUNNING` is set (timing fix verified)

### Feature Validation

- [ ] Debug logging before validation shows session path being checked
- [ ] Debug logging after success confirms no nested execution
- [ ] Error logging for `NestedExecutionError` includes existing PID
- [ ] Error logging for `NestedExecutionError` includes current PID
- [ ] Error logging for `NestedExecutionError` includes session path
- [ ] Error is re-thrown to prevent execution
- [ ] Legitimate bugfix recursion still works (when SKIP_BUG_FINDING=true)
- [ ] **CRITICAL**: Old validation location (lines 1722-1725) removed
- [ ] **CRITICAL**: Guard is only set AFTER validation passes
- [ ] Tests verify order of operations (validate → set guard → initialize)

### Code Quality Validation

- [ ] Follows existing codebase patterns for error handling
- [ ] Uses type guard for specific error handling
- [ ] Optional chaining used for session path access
- [ ] Error is re-thrown (not swallowed)
- [ ] Debug logging follows Pino patterns
- [ ] Log messages include [PRPPipeline] prefix

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Log messages are clear and actionable
- [ ] Error context provides debugging information
- [ ] No changes to environment variable handling (already set in S4)

---

## Anti-Patterns to Avoid

```typescript
// ❌ CRITICAL DON'T: Set guard BEFORE validation (CURRENT BUG!)
async run(): Promise<PipelineResult> {
  this.sessionManager = new SessionManagerClass(...);

  process.env.PRP_PIPELINE_RUNNING = currentPid;       // WRONG - Guard set before validation!
  this.logger.debug(`Set PRP_PIPELINE_RUNNING=${currentPid}`);

  await this.initializeSession();

  // Validate AFTER guard set (WRONG - too late!)
  if (this.sessionManager.currentSession?.metadata.path) {
    const sessionPath = this.sessionManager.currentSession.metadata.path;
    validateNestedExecution(sessionPath);              // WRONG - should be before guard!
  }
}

// ❌ DON'T: Call validation before session initialization
async run(): Promise<PipelineResult> {
  validateNestedExecution(sessionPath); // WRONG - sessionPath is undefined
  await this.initializeSession();
}

// ❌ DON'T: Access session path without optional chaining
const sessionPath = this.sessionManager.currentSession.metadata.path; // WRONG - might throw
validateNestedExecution(sessionPath);

// ❌ DON'T: Catch and swallow the error
try {
  validateNestedExecution(sessionPath);
} catch (error) {
  this.logger.error('Validation failed');
  // WRONG - don't re-throw, execution continues!
}

// ❌ DON'T: Use error without type guard
try {
  validateNestedExecution(sessionPath);
} catch (error) {
  console.log(error.context?.existingPid); // WRONG - TypeScript error
}

// ❌ DON'T: Use console.log instead of logger
console.log('Checking for nested execution'); // WRONG - use this.logger.debug

// ❌ DON'T: Forget to import type guard
import { validateNestedExecution } from '../utils/validation/execution-guard.js';
// WRONG - need isNestedExecutionError too

// ❌ DON'T: Leave old validation code after moving it
// After moving validation to before guard set, MUST remove old location (lines 1722-1725)

// ✓ DO: Follow the correct pattern
import {
  validateNestedExecution,
  isNestedExecutionError
} from '../utils/validation/execution-guard.js';

// After SessionManager creation, BEFORE guard setting, BEFORE session initialization
async run(): Promise<PipelineResult> {
  this.sessionManager = new SessionManagerClass(...);

  // Validate BEFORE setting guard (CORRECT!)
  if (this.sessionManager.currentSession?.metadata.path) {
    const sessionPath = this.sessionManager.currentSession.metadata.path;
    try {
      this.logger.debug(`[PRPPipeline] Checking for nested execution at ${sessionPath}`);
      validateNestedExecution(sessionPath);
      this.logger.debug('[PRPPipeline] No nested execution detected, proceeding');
    } catch (error) {
      if (isNestedExecutionError(error)) {
        this.logger.error(
          { sessionPath, existingPid: error.context?.existingPid, currentPid: error.context?.currentPid },
          '[PRPPipeline] Nested execution detected - cannot proceed'
        );
        throw error;
      }
      throw error;
    }
  }

  // NOW safe to set guard (after validation passes)
  process.env.PRP_PIPELINE_RUNNING = currentPid;
  this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);

  await this.initializeSession();
  // ... rest of workflow ...
}
```

---

## Appendix: Complete Code Reference

### Current Implementation (src/workflows/prp-pipeline.ts:1721-1725)

```typescript
// Validate no nested execution (after session path is available)
if (this.sessionManager.currentSession?.metadata.path) {
  const sessionPath = this.sessionManager.currentSession.metadata.path;
  validateNestedExecution(sessionPath);
}
```

### Target Implementation

```typescript
// Validate no nested execution (after session path is available)
if (this.sessionManager.currentSession?.metadata.path) {
  const sessionPath = this.sessionManager.currentSession.metadata.path;
  try {
    this.logger.debug(
      `[PRPPipeline] Checking for nested execution at ${sessionPath}`
    );
    validateNestedExecution(sessionPath);
    this.logger.debug('[PRPPipeline] No nested execution detected, proceeding');
  } catch (error) {
    if (isNestedExecutionError(error)) {
      this.logger.error(
        `[PRPPipeline] Nested execution detected: ${error.message}`
      );
      this.logger.error(
        `[PRPPipeline] Existing PID: ${error.context?.existingPid}`
      );
      this.logger.error(
        `[PRPPipeline] Current PID: ${error.context?.currentPid}`
      );
      this.logger.error(
        `[PRPPipeline] Session path: ${error.context?.sessionPath}`
      );
      throw error; // Re-throw to prevent execution
    }
    throw error; // Re-throw other errors
  }
}
```

### Import Statement Update (src/workflows/prp-pipeline.ts:35)

```typescript
// BEFORE:
import { validateNestedExecution } from '../utils/validation/execution-guard.js';

// AFTER:
import {
  validateNestedExecution,
  isNestedExecutionError,
} from '../utils/validation/execution-guard.js';
```

### Test Example Structure (tests/unit/workflows/prp-pipeline.test.ts)

```typescript
describe('nested execution validation', () => {
  it('should log debug message before validation', async () => {
    // SETUP
    const debugSpy = vi.spyOn(logger, 'debug');
    mockSession.metadata.path = 'plan/001_14b9dc2a33c7';

    // EXECUTE
    await pipeline.run();

    // VERIFY
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('Checking for nested execution')
    );
  });

  it('should log success message after validation passes', async () => {
    // SETUP
    const debugSpy = vi.spyOn(logger, 'debug');

    // EXECUTE
    await pipeline.run();

    // VERIFY
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('No nested execution detected')
    );
  });

  it('should throw and log NestedExecutionError', async () => {
    // SETUP
    const errorSpy = vi.spyOn(logger, 'error');
    mockValidateNestedExecution.mockImplementation(() => {
      throw new NestedExecutionError('Nested execution detected', {
        existingPid: '12345',
        currentPid: '67890',
        sessionPath: 'plan/001_14b9dc2a33c7',
      });
    });

    // EXECUTE & VERIFY
    await expect(pipeline.run()).rejects.toThrow(NestedExecutionError);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Nested execution detected')
    );
  });
});
```

---

**PRP Status**: READY FOR IMPLEMENTATION
**Confidence Score**: 9/10
**Critical Bug Fix**: Validation timing must be corrected - validation happens BEFORE guard is set
**Next Steps**: Proceed with implementation following Task 1-6 order, paying special attention to Task 2 (timing fix)
