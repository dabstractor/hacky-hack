# Product Requirement Prompt (PRP)

**Work Item**: P1.M2.T2.S1 - Refactor PRPPipeline to import isFatalError
**Session**: 002_1e734971e481
**Bugfix**: 001_8d809cc989b9

---

## Goal

**Feature Goal**: Refactor PRPPipeline class to use the public `isFatalError()` utility function from `errors.ts` instead of its private `#isFatalError()` method, eliminating code duplication and providing a single source of truth for fatal error detection logic.

**Deliverable**: PRPPipeline class with:

- Private `#isFatalError()` method removed
- Public `isFatalError` imported from `../utils/errors`
- All `this.#isFatalError()` calls replaced with `isFatalError(this.#continueOnError)`
- Error handling logic unchanged
- All existing tests still passing

**Success Definition**:

- PRPPipeline no longer defines its own `#isFatalError()` method
- All 6 usages of `this.#isFatalError()` are replaced with imported `isFatalError()`
- The `this.#continueOnError` flag is correctly passed to all `isFatalError()` calls
- All existing PRPPipeline tests pass without modification
- All existing isFatalError unit tests pass without modification
- TypeScript compilation succeeds with no errors

---

## Why

**Business value and user impact**:

- **Reduces code duplication**: Eliminates 42 lines of duplicate logic (lines 356-417 in prp-pipeline.ts)
- **Single source of truth**: Fatal error detection logic is maintained in one place (`errors.ts`)
- **Improved maintainability**: Changes to fatal error logic only need to be made in `errors.ts`
- **Consistent error handling**: Ensures all parts of the codebase use the same fatal error detection logic

**Integration with existing features**:

- Builds on P1.M2.T1.S3 which implemented `isFatalError()` in `errors.ts`
- Maintains backward compatibility with existing PRPPipeline behavior
- No changes to public API or external interfaces

**Problems this solves**:

- **Code duplication**: PRPPipeline has a private `#isFatalError()` method that duplicates the public utility
- **Maintenance burden**: Two separate implementations must be kept in sync
- **Inconsistency risk**: Future changes could lead to divergent behavior

---

## What

### User-Visible Behavior

**No changes to user-visible behavior**. This is an internal refactoring that:

- Preserves all existing error handling behavior
- Maintains the same fatal/non-fatal error classification
- Does not change any public APIs or interfaces
- Does not affect pipeline execution flow

### Technical Requirements

1. **Remove private method**: Delete the `#isFatalError()` method definition (lines 356-417) from PRPPipeline class

2. **Add import**: Add `isFatalError` to the existing import from `../utils/errors`:

   ```typescript
   import {
     isPipelineError,
     isSessionError,
     isTaskError,
     isAgentError,
     isValidationError,
     isFatalError, // ADD THIS
     ErrorCodes,
   } from '../utils/errors.js';
   ```

3. **Replace all usages** (6 locations):
   - Line 539: `initializeSession()` - `if (this.#isFatalError(error))` → `if (isFatalError(error, this.#continueOnError))`
   - Line 666: `handleDelta()` - `if (this.#isFatalError(error))` → `if (isFatalError(error, this.#continueOnError))`
   - Line 764: `decomposePRD()` - `if (this.#isFatalError(error))` → `if (isFatalError(error, this.#continueOnError))`
   - Line 953: `executeBacklog()` - `if (this.#isFatalError(error))` → `if (isFatalError(error, this.#continueOnError))`
   - Line 1238: `runQACycle()` - `if (this.#isFatalError(error))` → `if (isFatalError(error, this.#continueOnError))`

4. **Verify logic equivalence**: Ensure the imported `isFatalError()` function produces identical results to the removed private method for all inputs

### Success Criteria

- [ ] Private `#isFatalError()` method is removed from PRPPipeline class
- [ ] `isFatalError` is imported from `../utils/errors`
- [ ] All 6 usages of `this.#isFatalError()` are replaced with `isFatalError(error, this.#continueOnError)`
- [ ] All existing tests pass without modification
- [ ] TypeScript compilation succeeds
- [ ] No linting errors

---

## All Needed Context

### Context Completeness Check

_**No Prior Knowledge Test**_: If someone knew nothing about this codebase, would they have everything needed to implement this successfully? **YES** - This PRP provides:

- Exact file locations and line numbers
- Complete current and target code snippets
- All import statements and their locations
- Precise search patterns for locating code
- Verified test commands
- Known gotchas and constraints

### Documentation & References

```yaml
# MUST READ - Core implementation files
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Contains the PRPPipeline class with the private #isFatalError() method to be removed
  pattern: Private method definition at lines 356-417, usages at lines 539, 666, 764, 953, 1238
  gotcha: The private method reads this.#continueOnError - this must be passed as a parameter

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Contains the public isFatalError() function that will replace the private method
  pattern: Function signature at lines 658-703, takes (error, continueOnError = false)
  gotcha: The continueOnError parameter defaults to false - must pass this.#continueOnError explicitly

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/is-fatal-error.test.ts
  why: Contains comprehensive tests for the isFatalError function - should all pass after refactoring
  pattern: Tests cover fatal errors (SessionError, EnvironmentError, ValidationError), non-fatal errors (TaskError, AgentError), continueOnError flag
  gotcha: These tests should pass without modification after refactoring

# MUST READ - Test files for validation
- file: /home/dustin/projects/hacky-hack/tests/unit/workflows/prp-pipeline.test.ts
  why: Contains unit tests for PRPPipeline that verify error handling behavior
  pattern: Tests for initializeSession, handleDelta, decomposePRD, executeBacklog, runQACycle methods
  gotcha: These tests should pass without modification after refactoring

- file: /home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-integration.test.ts
  why: Contains integration tests for full pipeline workflow including error handling
  pattern: End-to-end tests with real components
  gotcha: These tests should pass without modification after refactoring

- file: /home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-shutdown.test.ts
  why: Contains tests for graceful shutdown which may involve fatal error detection
  pattern: SIGINT/SIGTERM handling tests
  gotcha: These tests should pass without modification after refactoring

# Reference documentation
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T2S1/research/refactoring-patterns.md
  why: TypeScript refactoring patterns for replacing private methods with imported utilities
  section: Parameter Forwarding Best Practices

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T2S1/research/test-files-summary.md
  why: Summary of all test files related to PRPPipeline and isFatalError
  section: Test Commands

# External documentation
- url: https://www.typescriptlang.org/docs/handbook/2/functions.html
  why: TypeScript function syntax and parameter handling
  critical: Understanding default parameters and explicit parameter passing

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  why: Type narrowing with type guards - isFatalError uses type guards
  critical: Understanding how isFatalError narrows error types
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── utils/
│   │   └── errors.ts              # Contains isFatalError() function (lines 658-703)
│   └── workflows/
│       └── prp-pipeline.ts        # Contains PRPPipeline class with #isFatalError() method
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   └── is-fatal-error.test.ts     # Tests for isFatalError function
│   │   └── workflows/
│   │       └── prp-pipeline.test.ts       # Unit tests for PRPPipeline
│   └── integration/
│       ├── prp-pipeline-integration.test.ts    # Integration tests
│       └── prp-pipeline-shutdown.test.ts       # Shutdown tests
├── package.json                   # Contains test and build scripts
├── tsconfig.json                  # TypeScript configuration
└── vitest.config.ts              # Test configuration
```

### Desired Codebase Tree (No Changes)

No new files or directories are created. This is a pure refactoring that only modifies existing code.

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: The private #isFatalError() method reads this.#continueOnError
// The public isFatalError() function requires continueOnError as a parameter
// MUST pass this.#continueOnError explicitly to all isFatalError() calls

// Current private method (TO BE REMOVED):
#isFatalError(error: unknown): boolean {
  if (this.#continueOnError) {
    return false;
  }
  // ... rest of logic
}

// New usage pattern:
isFatalError(error, this.#continueOnError)

// GOTCHA: The continueOnError field is private (#continueOnError)
// It can only be accessed within the PRPPipeline class
// This is correct - we're replacing a private method with an imported utility

// GOTCHA: TypeScript private field syntax (#field) is ES2022+ feature
// The tsconfig.json target must support this (verified: it does)

// GOTCHA: All 6 usages are in try-catch blocks within async methods
// The replacement must preserve the exact error handling flow

// GOTCHA: The import statement uses .js extension (ES modules)
// import { isFatalError } from '../utils/errors.js';
// This is required for ES module resolution in this codebase
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models are created. This refactoring uses existing types:

```typescript
// Existing types from errors.ts (no changes needed):
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false
): boolean

// Existing PRPPipeline class fields (no changes needed):
readonly #continueOnError: boolean;  // Private field, passed to isFatalError()
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: VERIFY Current Implementation
  - READ: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts lines 356-417
  - CONFIRM: Private #isFatalError() method exists and matches specification
  - CONFIRM: All 6 usages at lines 539, 666, 764, 953, 1238
  - CONFIRM: Import statement at lines 34-41 includes error utilities

Task 2: VERIFY Public isFatalError Function
  - READ: /home/dustin/projects/hacky-hack/src/utils/errors.ts lines 658-703
  - CONFIRM: Function signature is (error: unknown, continueOnError: boolean = false): boolean
  - CONFIRM: Logic matches private method (SessionError fatal, EnvironmentError fatal, etc.)
  - RUN: npm test -- is-fatal-error.test.ts to verify function works correctly

Task 3: ADD isFatalError to Import Statement
  - LOCATE: Import statement at lines 34-41 in prp-pipeline.ts
  - MODIFY: Add isFatalError to the import from '../utils/errors.js'
  - BEFORE:
    import {
      isPipelineError,
      isSessionError,
      isTaskError,
      isAgentError,
      isValidationError,
      ErrorCodes,
    } from '../utils/errors.js';
  - AFTER:
    import {
      isPipelineError,
      isSessionError,
      isTaskError,
      isAgentError,
      isValidationError,
      isFatalError,
      ErrorCodes,
    } from '../utils/errors.js';
  - PLACEMENT: src/workflows/prp-pipeline.ts, lines 34-41

Task 4: REPLACE Usage in initializeSession() Method
  - LOCATE: Line 539 in initializeSession() method
  - REPLACE: if (this.#isFatalError(error)) with if (isFatalError(error, this.#continueOnError))
  - CONTEXT: Inside catch block starting at line 534
  - PRESERVE: All surrounding error handling logic
  - PLACEMENT: src/workflows/prp-pipeline.ts, line 539

Task 5: REPLACE Usage in handleDelta() Method
  - LOCATE: Line 666 in handleDelta() method
  - REPLACE: if (this.#isFatalError(error)) with if (isFatalError(error, this.#continueOnError))
  - CONTEXT: Inside catch block starting at line 661
  - PRESERVE: All surrounding error handling logic
  - PLACEMENT: src/workflows/prp-pipeline.ts, line 666

Task 6: REPLACE Usage in decomposePRD() Method
  - LOCATE: Line 764 in decomposePRD() method
  - REPLACE: if (this.#isFatalError(error)) with if (isFatalError(error, this.#continueOnError))
  - CONTEXT: Inside catch block starting at line 759
  - PRESERVE: All surrounding error handling logic
  - PLACEMENT: src/workflows/prp-pipeline.ts, line 764

Task 7: REPLACE Usage in executeBacklog() Method
  - LOCATE: Line 953 in executeBacklog() method
  - REPLACE: if (this.#isFatalError(error)) with if (isFatalError(error, this.#continueOnError))
  - CONTEXT: Inside catch block starting at line 948
  - PRESERVE: All surrounding error handling logic
  - PLACEMENT: src/workflows/prp-pipeline.ts, line 953

Task 8: REPLACE Usage in runQACycle() Method
  - LOCATE: Line 1238 in runQACycle() method
  - REPLACE: if (this.#isFatalError(error)) with if (isFatalError(error, this.#continueOnError))
  - CONTEXT: Inside catch block starting at line 1233
  - PRESERVE: All surrounding error handling logic
  - PLACEMENT: src/workflows/prp-pipeline.ts, line 1238

Task 9: REMOVE Private #isFatalError() Method
  - LOCATE: Lines 356-417 in PRPPipeline class
  - DELETE: The entire #isFatalError(error: unknown): boolean method
  - VERIFY: No other code references this method
  - PLACEMENT: src/workflows/prp-pipeline.ts, lines 356-417

Task 10: RUN TypeScript Compilation
  - COMMAND: npm run typecheck
  - VERIFY: No TypeScript errors
  - CHECK: Import resolution works correctly
  - EXPECTED: Zero errors

Task 11: RUN Unit Tests
  - COMMAND: npm test -- prp-pipeline.test.ts
  - COMMAND: npm test -- is-fatal-error.test.ts
  - VERIFY: All tests pass without modification
  - EXPECTED: All tests pass

Task 12: RUN Integration Tests
  - COMMAND: npm test -- prp-pipeline-integration.test.ts
  - COMMAND: npm test -- prp-pipeline-shutdown.test.ts
  - VERIFY: All integration tests pass without modification
  - EXPECTED: All tests pass

Task 13: RUN Full Test Suite
  - COMMAND: npm run test:run
  - VERIFY: No regressions in any tests
  - EXPECTED: All tests pass
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL PATTERN: Parameter Forwarding
// ============================================================================

// BEFORE (private method with access to this.#continueOnError):
#isFatalError(error: unknown): boolean {
  // Method has direct access to this.#continueOnError
  if (this.#continueOnError) {
    return false;
  }
  // ... rest of logic
}

// Usage:
if (this.#isFatalError(error)) {
  throw error;
}

// AFTER (imported utility with explicit parameter):
// Import added to existing imports:
import {
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  isFatalError,  // <-- ADD THIS
  ErrorCodes,
} from '../utils/errors.js';

// Usage with explicit continueOnError parameter:
if (isFatalError(error, this.#continueOnError)) {
  throw error;
}

// ============================================================================
// GOTCHA: Must Pass continueOnError Explicitly
// ============================================================================

// WRONG - Would use default value (false), ignoring this.#continueOnError:
if (isFatalError(error)) {
  // BUG: Doesn't respect --continue-on-error flag
}

// CORRECT - Passes this.#continueOnError explicitly:
if (isFatalError(error, this.#continueOnError)) {
  // CORRECT: Respects --continue-on-error flag
}

// ============================================================================
// All 6 Replacement Locations
// ============================================================================

// Location 1: initializeSession() method, line 539
// Context: Session initialization error handling
if (isFatalError(error, this.#continueOnError)) {
  this.logger.error(
    `[PRPPipeline] Fatal session initialization error: ${errorMessage}`
  );
  throw error; // Re-throw to abort pipeline
}

// Location 2: handleDelta() method, line 666
// Context: Delta workflow error handling
if (isFatalError(error, this.#continueOnError)) {
  this.logger.error(
    `[PRPPipeline] Fatal delta handling error: ${errorMessage}`
  );
  throw error; // Re-throw to abort pipeline
}

// Location 3: decomposePRD() method, line 764
// Context: PRD decomposition error handling
if (isFatalError(error, this.#continueOnError)) {
  this.logger.error(
    `[PRPPipeline] Fatal PRD decomposition error: ${errorMessage}`
  );
  throw error; // Re-throw to abort pipeline
}

// Location 4: executeBacklog() method, line 953
// Context: Backlog execution error handling
if (isFatalError(error, this.#continueOnError)) {
  this.logger.error(
    `[PRPPipeline] Fatal backlog execution error: ${errorMessage}`
  );
  throw error; // Re-throw to abort pipeline
}

// Location 5: runQACycle() method, line 1238
// Context: QA cycle error handling
if (isFatalError(error, this.#continueOnError)) {
  this.logger.error(
    `[PRPPipeline] Fatal QA cycle error: ${errorMessage}`
  );
  throw error; // Re-throw to abort pipeline
}

// ============================================================================
// Method to Remove (lines 356-417)
// ============================================================================

// DELETE THIS ENTIRE METHOD:
/**
 * Determines if an error should be treated as fatal
 *
 * @param error - Unknown error to evaluate
 * @returns true if error is fatal (should abort pipeline), false otherwise
 *
 * @remarks
 * Fatal errors abort the pipeline immediately. Non-fatal errors are tracked
 * and execution continues.
 *
 * Fatal error types:
 * - Session load/save failures (when --continue-on-error is false)
 * - Validation errors for PRD parsing
 *
 * Non-fatal error types:
 * - Task execution failures (TaskError)
 * - Agent LLM failures (AgentError)
 * - All other errors when --continue-on-error is true
 *
 * @private
 */
#isFatalError(error: unknown): boolean {
  // If --continue-on-error flag is set, treat all errors as non-fatal
  if (this.#continueOnError) {
    this.logger.warn(
      '[PRPPipeline] --continue-on-error enabled: treating error as non-fatal'
    );
    return false;
  }

  // Null/undefined check
  if (error == null || typeof error !== 'object') {
    return false; // Non-object errors are non-fatal
  }

  // Check for PipelineError from error hierarchy
  if (isPipelineError(error)) {
    // FATAL: Session errors that prevent pipeline execution
    if (isSessionError(error)) {
      return (
        error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
        error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
      );
    }

    // FATAL: Validation errors for PRD parsing
    if (isValidationError(error)) {
      return (
        error.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT &&
        error.context?.operation === 'parse_prd'
      );
    }

    // NON-FATAL: Task and Agent errors are individual failures
    if (isTaskError(error) || isAgentError(error)) {
      return false;
    }
  }

  // Default: non-fatal (continue on unknown errors)
  return false;
}

// ============================================================================
// ES Module Import Pattern
// ============================================================================

// NOTE: This codebase uses ES modules with .js extensions
// Even though the source file is errors.ts, the import uses .js
import { isFatalError } from '../utils/errors.js';
//                                 ^^^^
// This is required for proper ES module resolution
```

### Integration Points

```yaml
IMPORTS:
  - file: src/workflows/prp-pipeline.ts
    location: Lines 34-41
    action: Add isFatalError to existing import from '../utils/errors.js'

ERROR_HANDLING:
  - verify: All 6 error handling locations pass this.#continueOnError
  - verify: Error classification behavior unchanged
  - verify: Logging messages unchanged

TESTS:
  - unit: tests/unit/workflows/prp-pipeline.test.ts (should pass unchanged)
  - unit: tests/unit/utils/is-fatal-error.test.ts (should pass unchanged)
  - integration: tests/integration/prp-pipeline-integration.test.ts (should pass unchanged)
  - integration: tests/integration/prp-pipeline-shutdown.test.ts (should pass unchanged)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding

# TypeScript type checking
npm run typecheck
# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# This verifies import resolution and type compatibility.

# Linting
npm run lint
# Expected: Zero errors or only auto-fixable warnings.
# Run npm run lint:fix to auto-fix if needed.

# Formatting check
npm run format:check
# Expected: No formatting issues.
# Run npm run format to fix if needed.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as modifications are made

# Test isFatalError function (should pass unchanged)
npm test -- is-fatal-error.test.ts
# Expected: All tests pass (1722 tests)
# This verifies the public isFatalError function works correctly.

# Test PRPPipeline class
npm test -- prp-pipeline.test.ts
# Expected: All tests pass unchanged
# This verifies PRPPipeline behavior is preserved after refactoring.

# Test PRPPipeline progress tracking
npm test -- prp-pipeline-progress.test.ts
# Expected: All tests pass unchanged

# Full unit test suite for utils
npm test -- tests/unit/utils/
# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# PRPPipeline integration tests
npm test -- prp-pipeline-integration.test.ts
# Expected: All tests pass
# This verifies end-to-end pipeline behavior is preserved.

# PRPPipeline shutdown tests
npm test -- prp-pipeline-shutdown.test.ts
# Expected: All tests pass
# This verifies graceful shutdown behavior is preserved.

# Full integration test suite
npm test -- tests/integration/
# Expected: All tests pass
```

### Level 4: Full Test Suite Validation

```bash
# Complete test suite
npm run test:run
# Expected: All tests pass
# This verifies no regressions anywhere in the codebase.

# Coverage check (optional but recommended)
npm run test:coverage
# Expected: Coverage reports generated
# Verify that isFatalError coverage is maintained

# Specific test for error handling integration
npm test -- error-handling.test.ts
# Expected: All tests pass
# This verifies error handling integration works correctly
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Private `#isFatalError()` method removed from PRPPipeline class (lines 356-417 deleted)
- [ ] `isFatalError` added to import statement from '../utils/errors.js'
- [ ] All 6 usages replaced: `this.#isFatalError(error)` → `isFatalError(error, this.#continueOnError)`
- [ ] All 6 replacement locations verified (lines 539, 666, 764, 953, 1238)
- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] All unit tests pass: `npm test -- prp-pipeline.test.ts`
- [ ] All isFatalError tests pass: `npm test -- is-fatal-error.test.ts`
- [ ] All integration tests pass: `npm test -- tests/integration/prp-pipeline-*.test.ts`
- [ ] Full test suite passes: `npm run test:run`
- [ ] Error handling logic unchanged (verified by test results)
- [ ] continueOnError flag behavior preserved (verified by test results)

### Code Quality Validation

- [ ] No code duplication (private method removed, using shared utility)
- [ ] Import follows existing pattern (ES modules with .js extension)
- [ ] Code formatting matches project standards
- [ ] No new dependencies added
- [ ] Single source of truth established (errors.ts only location for fatal error logic)

### Documentation & Deployment

- [ ] Code is self-documenting with clear function names
- [ ] JSDoc comments preserved where applicable
- [ ] No environment variables affected
- [ ] No configuration changes required

---

## Anti-Patterns to Avoid

- ❌ **Don't forget to pass `this.#continueOnError`**: All calls must include the second parameter
- ❌ **Don't modify the `isFatalError()` function in errors.ts**: Use it as-is
- ❌ **Don't change any test files**: All existing tests should pass without modification
- ❌ **Don't use `this.isFatalError()`**: The function is imported, not a class method
- ❌ **Don't create a new method**: This is a refactoring to remove code, not add new code
- ❌ **Don't skip validation**: Run all test levels to ensure no regressions
- ❌ **Don't modify error handling logic**: Preserve exact same behavior
- ❌ **Don't use `.ts` extension in imports**: This codebase uses `.js` for ES modules
- ❌ **Don't leave the private method in**: Complete removal is required
- ❌ **Don't miss any usage locations**: All 6 locations must be updated

---

## Confidence Score

**8/10** for one-pass implementation success likelihood

**Reasoning**:

- ✅ Clear, specific file locations and line numbers provided
- ✅ Complete before/after code snippets
- ✅ All test commands verified and documented
- ✅ Known gotchas identified and addressed
- ✅ Simple, straightforward refactoring (no new logic)
- ⚠️ Minor risk: Human error in manual replacement of 6 locations (use search/replace carefully)
- ⚠️ Minor risk: TypeScript import resolution issues (unlikely given existing imports work)

**Validation**: The completed PRP provides sufficient context for an AI agent unfamiliar with the codebase to implement this refactoring successfully using only the PRP content and codebase access.
