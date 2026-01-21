# Product Requirement Prompt (PRP)

**Work Item**: P1.M2.T1.S3 - Implement isFatalError function in errors.ts
**PRD Reference**: Issue 2 - Critical Bug Fixes: Error Handling Infrastructure
**TDD Phase**: GREEN - Implement passing code for failing tests from P1.M2.T1.S2

---

## Goal

**Feature Goal**: Implement `isFatalError()` as a public utility function in `/home/dustin/projects/hacky-hack/src/utils/errors.ts` that determines whether an error should halt pipeline execution immediately (fatal) or allow continuation with error tracking (non-fatal).

**Deliverable**: Exported `isFatalError(error: unknown, continueOnError?: boolean): boolean` function in `src/utils/errors.ts` that passes all 23 integration tests and 172 unit tests from P1.M2.T1.S2.

**Success Definition**:

- All 172 unit tests in `tests/unit/utils/is-fatal-error.test.ts` pass
- Function follows existing type guard patterns in errors.ts
- Proper JSDoc documentation with examples
- Export is accessible from errors.ts public API

## User Persona

**Target User**: Internal developers working on PRP Pipeline error handling logic.

**Use Case**: Determining whether a caught error should immediately abort pipeline execution (fatal) or be tracked and allow continuation (non-fatal).

**User Journey**:

1. Developer catches an error in a try/catch block
2. Calls `isFatalError(error)` to classify the error
3. If true: re-throws error to halt pipeline
4. If false: tracks error and continues execution

**Pain Points Addressed**:

- Eliminates duplication of fatal error detection logic across 5 PRPPipeline methods
- Provides centralized, testable error classification
- Enables consistent error handling patterns throughout codebase

## Why

- **Business value**: Centralizes error classification logic, reducing maintenance burden and bug surface area
- **Integration**: Enables PRPPipeline refactoring (P1.M2.T2) to use shared utility instead of private method
- **Problems solved**: Eliminates code duplication, improves testability, provides reusable error handling utility

## What

Implement a public `isFatalError()` function in `src/utils/errors.ts` that:

1. Accepts `error: unknown` and optional `continueOnError?: boolean` parameter
2. Returns `true` for fatal errors (should abort pipeline)
3. Returns `false` for non-fatal errors (should continue with tracking)
4. Uses existing type guards: `isPipelineError()`, `isSessionError()`, `isEnvironmentError()`, `isValidationError()`, `isTaskError()`, `isAgentError()`
5. Follows JSDoc patterns from existing type guards

### Success Criteria

- [ ] Function added to `src/utils/errors.ts` after line 614 (after `isEnvironmentError`)
- [ ] All 172 unit tests pass: `npm test -- tests/unit/utils/is-fatal-error.test.ts`
- [ ] Function exported from errors.ts: `import { isFatalError } from './utils/errors.js'`
- [ ] JSDoc includes @remarks with fatal/non-fatal explanation and @example usage
- [ ] No existing tests broken by implementation

## All Needed Context

### Context Completeness Check

✓ **Passes "No Prior Knowledge" test**: This PRP contains exact file locations, line numbers, test specifications, code patterns, and validation commands needed for implementation without prior codebase knowledge.

### Documentation & References

```yaml
# MUST READ - Architecture and existing implementation
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md
  why: Complete analysis of existing #isFatalError() logic in PRPPipeline including decision tree, fatal conditions, and edge cases
  critical: Contains exact implementation logic to extract, including the CRITICAL difference: tests expect EnvironmentError to be fatal (not in existing impl)

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/is-fatal-error.test.ts
  why: 172 comprehensive test cases defining exact expected behavior for all error types
  critical: Tests define the CONTRACT - all must pass for success. Key insight: ALL EnvironmentError instances are fatal (differs from existing impl)

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Target file for implementation - shows JSDoc patterns, type guard structure, export format
  pattern: Type guards at lines 497-614 follow consistent pattern with JSDoc @remarks and @example sections
  gotcha: Add isFatalError AFTER line 614 (after isEnvironmentError), maintain section header

# Type guards to use (already imported in errors.ts)
- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:521-523
  why: isPipelineError() - first check in logic flow

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:542-544
  why: isSessionError() - check for LOAD_FAILED/SAVE_FAILED fatal codes

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:612-614
  why: isEnvironmentError() - CRITICAL: ALL instances are fatal per tests (differs from existing impl!)

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:585-587
  why: isValidationError() - check for parse_prd operation fatal condition

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:553-555
  why: isTaskError() - all instances are non-fatal

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:574-576
  why: isAgentError() - all instances are non-fatal

# Error codes referenced
- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:58-88
  why: ErrorCodes constant - need PIPELINE_SESSION_LOAD_FAILED, PIPELINE_SESSION_SAVE_FAILED, PIPELINE_VALIDATION_INVALID_INPUT

# JSDoc pattern examples
- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:525-544
  why: isSessionError JSDoc shows standard pattern: @remarks description + @example with usage

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts:589-614
  why: isEnvironmentError JSDoc shows complete example with multi-line @example showing context access
```

### Current Codebase tree (errors.ts structure)

```bash
src/utils/errors.ts
├── Lines 1-41: Module JSDoc with @module, @remarks, @example
├── Lines 43-89: ERROR CODES (ErrorCodes const, ErrorCode type)
├── Lines 91-112: ErrorContext interface
├── Lines 114-342: PipelineError base class
├── Lines 344-495: Specialized error classes (SessionError, TaskError, AgentError, ValidationError, EnvironmentError)
└── Lines 497-614: TYPE GUARDS
    ├── isPipelineError (521-523)
    ├── isSessionError (542-544)
    ├── isTaskError (553-555)
    ├── isAgentError (574-576)
    ├── isValidationError (585-587)
    └── isEnvironmentError (612-614)
    ↓ ADD isFatalError HERE (after line 614) ↓
```

### Desired Codebase tree with isFatalError added

```bash
src/utils/errors.ts
├── [... existing sections ...]
├── Lines 497-614: TYPE GUARDS
│   ├── isPipelineError
│   ├── isSessionError
│   ├── isTaskError
│   ├── isAgentError
│   ├── isValidationError
│   ├── isEnvironmentError
│   └── isFatalError ← NEW FUNCTION (add after line 614)
│       ├── Determines if error is fatal (abort) or non-fatal (continue)
│       ├── Uses type guards: isPipelineError, isSessionError, isEnvironmentError, isValidationError
│       ├── Returns boolean (not a type predicate - determines property, not type)
│       └── Includes comprehensive JSDoc with @remarks and @example
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: EnvironmentError handling differs from existing #isFatalError implementation
// Existing PRPPipeline.#isFatalError() does NOT check EnvironmentError (defaults to non-fatal)
// TESTS REQUIRE: ALL EnvironmentError instances return true (fatal)
// This is the KEY difference between existing implementation and required behavior

// CRITICAL: SessionError is ONLY fatal for specific error codes
// Not all SessionErrors are fatal - only LOAD_FAILED and SAVE_FAILED codes
// SessionError constructor always uses LOAD_FAILED code (see src/utils/errors.ts:362-380)
// Tests expect SessionError with LOAD_FAILED/SAVE_FAILED to be fatal

// CRITICAL: ValidationError is conditionally fatal
// Only fatal when: code === INVALID_INPUT AND context?.operation === 'parse_prd'
// All other ValidationError instances are non-fatal
// See tests lines 814-1016 for non-fatal ValidationError cases

// CRITICAL: Return type is boolean, NOT a type predicate
// Unlike other type guards (isSessionError(error): error is SessionError)
// isFatalError returns plain boolean: isFatalError(error): boolean
// This is because it determines a PROPERTY (fatality) not a TYPE

// CRITICAL: Default parameter for continueOnError
// Second parameter should be: continueOnError: boolean = false
// When true, ALL errors return false (non-fatal)
// When false or undefined, normal fatal/non-fatal logic applies

// CRITICAL: null/undefined/object check
// Must check: error == null || typeof error !== 'object' → return false
// Non-object errors (strings, numbers, etc.) are always non-fatal

// CRITICAL: Use instanceof checks via type guards
// Don't use duck typing - use isPipelineError(), isSessionError(), etc.
// These type guards already use instanceof internally

// CRITICAL: JSDoc pattern requires specific format
// Must include: @remarks section explaining fatal vs non-fatal
// Must include: @example section showing usage in try/catch
// Follow pattern from isSessionError and isEnvironmentError

// GOTCHA: TypeScript type narrowing with type guards
// When isPipelineError(error) returns true, error is narrowed to PipelineError
// This allows safe access to error.code and error.context properties
// Chain type guards: isPipelineError() → isSessionError() for double-narrowing

// GOTCHA: Tests use Vitest framework
// Test file imports: import { describe, expect, it } from 'vitest'
// Tests import from errors.js (ESM): from '../../../src/utils/errors.js'
```

## Implementation Blueprint

### Data models and structure

No new data models - uses existing error classes from `src/utils/errors.ts`:

- `PipelineError` (base class)
- `SessionError` (fatal: LOAD_FAILED, SAVE_FAILED codes)
- `EnvironmentError` (fatal: ALL instances)
- `ValidationError` (fatal: parse_prd operation only)
- `TaskError` (non-fatal: all instances)
- `AgentError` (non-fatal: all instances)

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: READ src/utils/errors.ts (lines 497-614)
  - UNDERSTAND: Existing type guard patterns and JSDoc format
  - NOTE: JSDoc structure: /**, description, @remarks, @example, */
  - NOTE: Function placement: after isEnvironmentError (line 614)
  - DEPENDENCIES: None

Task 2: READ isFatalError-existing-implementation.md (complete file)
  - UNDERSTAND: Existing #isFatalError() logic from PRPPipeline
  - NOTE: Decision tree and fatal conditions
  - CRITICAL: Tests expect EnvironmentError to be fatal (NOT in existing impl!)
  - DEPENDENCIES: None

Task 3: IMPLEMENT isFatalError function in src/utils/errors.ts
  - LOCATION: Add after line 614 (after isEnvironmentError function)
  - SIGNATURE: export function isFatalError(error: unknown, continueOnError: boolean = false): boolean
  - IMPLEMENTATION:
    ```typescript
    /**
     * Determines if an error should be treated as fatal
     *
     * @remarks
     * Returns true if the error is fatal and should halt pipeline execution.
     * Returns false if the error is non-fatal and should allow continuation with tracking.
     *
     * Fatal error types:
     * - SessionError with LOAD_FAILED or SAVE_FAILED error codes
     * - EnvironmentError (all instances are fatal)
     * - ValidationError with INVALID_INPUT code for parse_prd operation
     *
     * Non-fatal error types:
     * - TaskError (all instances)
     * - AgentError (all instances)
     * - ValidationError with non-parse_prd operations
     * - All standard Error types (Error, TypeError, etc.)
     * - Non-object values (null, undefined, strings, numbers, etc.)
     * - All errors when continueOnError flag is true
     *
     * The continueOnError parameter overrides all fatal error detection,
     * treating all errors as non-fatal when set to true. This enables
     * maximum progress mode where individual task failures don't halt execution.
     *
     * @param error - Unknown error to evaluate for fatality
     * @param continueOnError - If true, all errors are treated as non-fatal (default: false)
     * @returns true if error is fatal (should abort), false otherwise
     *
     * @example
     * ```typescript
     * try {
     *   await pipelineOperation();
     * } catch (error) {
     *   if (isFatalError(error)) {
     *     // Fatal: halt execution
     *     throw error;
     *   }
     *   // Non-fatal: track and continue
     *   trackError(error);
     * }
     * ```
     */
    export function isFatalError(
      error: unknown,
      continueOnError: boolean = false
    ): boolean {
      // Override all logic when continueOnError is true
      if (continueOnError) {
        return false;
      }

      // Non-object errors are non-fatal
      if (error == null || typeof error !== 'object') {
        return false;
      }

      // Check for PipelineError instances using type guard
      if (isPipelineError(error)) {
        // FATAL: All EnvironmentError instances
        if (isEnvironmentError(error)) {
          return true;
        }

        // FATAL: SessionError with LOAD_FAILED or SAVE_FAILED codes
        if (isSessionError(error)) {
          return (
            error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
            error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
          );
        }

        // FATAL: ValidationError for parse_prd operation with INVALID_INPUT code
        if (isValidationError(error)) {
          return (
            error.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT &&
            error.context?.operation === 'parse_prd'
          );
        }

        // NON-FATAL: TaskError and AgentError are individual failures
        if (isTaskError(error) || isAgentError(error)) {
          return false;
        }
      }

      // Default: non-fatal for unknown error types
      return false;
    }
    ```
  - FOLLOW pattern: JSDoc from isSessionError (lines 525-544) and isEnvironmentError (lines 589-614)
  - NAMING: isFatalError (camelCase function name)
  - PLACEMENT: After isEnvironmentError function (after line 614)
  - DEPENDENCIES: Task 1, Task 2

Task 4: VERIFY function is exported from errors.ts
  - CHECK: Function has 'export' keyword
  - CHECK: No additional exports needed (errors.ts uses named exports)
  - VERIFY: Can be imported as: import { isFatalError } from './utils/errors.js'
  - DEPENDENCIES: Task 3

Task 5: RUN unit tests to validate implementation
  - COMMAND: npm test -- tests/unit/utils/is-fatal-error.test.ts
  - EXPECTED: All 172 tests pass
  - IF FAILING: Read test output, identify failing test, fix implementation
  - DEPENDENCIES: Task 3, Task 4
````

### Implementation Patterns & Key Details

````typescript
// CRITICAL PATTERN: Type guard chaining for type narrowing
// TypeScript type guards enable safe property access after instanceof checks

if (isPipelineError(error)) {
  // error is now narrowed to PipelineError type
  // Safe to access error.code and error.context

  if (isSessionError(error)) {
    // error is now narrowed to SessionError type
    // Safe to call error.isLoadError() if needed
    return (
      error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
      error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
    );
  }
}

// CRITICAL GOTCHA: EnvironmentError check must come BEFORE SessionError
// Because SessionError is ALSO a PipelineError, order matters
// Correct order:
if (isPipelineError(error)) {
  if (isEnvironmentError(error)) return true; // Check first
  if (isSessionError(error)) {
    /* ... */
  } // Check second
  if (isValidationError(error)) {
    /* ... */
  } // Check third
}

// CRITICAL: continueOnError parameter is an OVERRIDE
// When true, it MUST return false BEFORE any other logic
if (continueOnError) {
  return false; // Short-circuit all other checks
}

// CRITICAL: Null/undefined/object check BEFORE instanceof
// instanceof throws TypeError on null/undefined
// typeof check is safe for all values
if (error == null || typeof error !== 'object') {
  return false;
}

// PATTERN: Default to non-fatal for unknown errors
// This is the "fail-open" approach - continue when uncertain
// Last line of function should be: return false;

// GOTCHA: Return type is boolean, NOT a type predicate
// Type guards use: error is SessionError  (type predicate)
// isFatalError uses: boolean              (plain boolean)
// This is correct because we're determining a PROPERTY, not narrowing TYPE

// JSDOC PATTERN: Multi-line comments with specific sections
/**
 * Brief description
 *
 * @remarks
 * Detailed explanation with bullet points for fatal/non-fatal types.
 * Include information about continueOnError override behavior.
 *
 * @param error - Description with type
 * @param continueOnError - Description with default value
 * @returns Description of return values
 *
 * @example
 * ```typescript
 * // Practical usage example showing try/catch pattern
 * // Include both fatal and non-fatal paths
 * ```
 */
````

### Integration Points

```yaml
ERRORS_TS:
  - add to: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  - location: After line 614 (after isEnvironmentError function)
  - pattern: 'Add complete function with JSDoc after isEnvironmentError export'

NO_CHANGES_TO:
  - src/workflows/prp-pipeline.ts (will be updated in P1.M2.T2)
  - tests/unit/utils/is-fatal-error.test.ts (already written in P1.M2.T1.S2)
  - Any other files (this is a pure utility function addition)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after adding isFatalError function - fix before proceeding
npx tsc --noEmit                      # TypeScript type checking
npm run lint                          # ESLint validation (if configured)

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.

# Manual syntax check
grep -n "export function isFatalError" src/utils/errors.ts  # Verify function exists
grep -n "isFatalError" src/utils/errors.ts | wc -l          # Should count: 2 (export + usage in tests)
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test isFatalError function specifically
npm test -- tests/unit/utils/is-fatal-error.test.ts

# Full test suite for errors.ts
npm test -- tests/unit/utils/

# Coverage validation (if coverage tools configured)
npm run test:coverage

# Expected: All 172 tests pass. If failing, debug root cause:
# 1. Read test output for specific failing test names
# 2. Examine test file to understand expected behavior
# 3. Compare with implementation logic
# 4. Fix implementation accordingly
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify function can be imported from errors.ts
node -e "import('./src/utils/errors.js').then(m => console.log(typeof m.isFatalError))"  # Should print: function

# Verify type exports (if type checking configured)
npx tsc --noEmit --pretty  # Should have no type errors related to isFatalError

# Test integration with existing type guards
npm test -- tests/integration/utils/error-handling.test.ts  # If integration tests exist

# Expected: All imports work, type checking passes, integration tests pass.
```

### Level 4: Cross-File Validation

```bash
# Verify no other files accidentally define isFatalError
grep -r "function isFatalError" src/ --exclude-dir=node_modules  # Should only find errors.ts

# Verify tests can import the function
grep -n "isFatalError" tests/unit/utils/is-fatal-error.test.ts | head -5  # Should show imports

# Check for any existing private implementations that might conflict
grep -r "#isFatalError\|private.*isFatalError" src/ --exclude-dir=node_modules  # Note: PRPPipeline has #isFatalError (expected)

# Expected: Only errors.ts exports isFatalError, tests import it correctly.
```

## Final Validation Checklist

### Technical Validation

- [ ] isFatalError function added to src/utils/errors.ts after line 614
- [ ] Function signature: `export function isFatalError(error: unknown, continueOnError: boolean = false): boolean`
- [ ] All 172 unit tests pass: `npm test -- tests/unit/utils/is-fatal-error.test.ts`
- [ ] TypeScript compilation succeeds: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint` (if configured)
- [ ] Function is importable: `import { isFatalError } from './utils/errors.js'`

### Feature Validation

- [ ] Returns true for SessionError with LOAD_FAILED code
- [ ] Returns true for SessionError with SAVE_FAILED code
- [ ] Returns true for ALL EnvironmentError instances (critical difference from existing impl)
- [ ] Returns true for ValidationError with parse_prd operation AND INVALID_INPUT code
- [ ] Returns false for TaskError (all instances)
- [ ] Returns false for AgentError (all instances)
- [ ] Returns false for ValidationError with non-parse_prd operations
- [ ] Returns false for standard Error types (Error, TypeError, etc.)
- [ ] Returns false for null, undefined, and non-object values
- [ ] Returns false for ALL errors when continueOnError is true

### Code Quality Validation

- [ ] JSDoc includes @remarks with fatal/non-fatal explanation
- [ ] JSDoc includes @example showing try/catch usage pattern
- [ ] JSDoc documents both parameters (error, continueOnError)
- [ ] JSDoc documents return value (true for fatal, false for non-fatal)
- [ ] Uses type guards: isPipelineError, isSessionError, isEnvironmentError, isValidationError
- [ ] Uses ErrorCodes constants for fatal error code checks
- [ ] Follows existing codebase patterns (camelCase, placement after isEnvironmentError)
- [ ] No side effects (pure function - only returns boolean)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] JSDoc @remarks explains continueOnError override behavior
- [ ] JSDoc @example shows practical usage in error handling
- [ ] Function is properly exported for use in PRPPipeline (P1.M2.T2)

---

## Anti-Patterns to Avoid

- ❌ Don't add continueOnError logging (pure function - no side effects)
- ❌ Don't use duck typing - use type guards (isPipelineError, isSessionError, etc.)
- ❌ Don't check for instanceof directly - use the type guard functions
- ❌ Don't make isFatalError a type predicate - return plain boolean
- ❌ Don't forget to check EnvironmentError (missing in existing implementation!)
- ❌ Don't check ValidationError before SessionError (order matters for type narrowing)
- ❌ Don't skip null/undefined check before instanceof (throws TypeError)
- ❌ Don't hardcode error code strings - use ErrorCodes constants
- ❌ Don't make continueOnError required parameter - default to false
- ❌ Don't add console.log or any side effects - this is a pure utility function

---

## Confidence Score

**9/10** - One-pass implementation success likelihood

**Justification**:

- Complete test suite (172 tests) defines exact contract
- Existing implementation analyzed with documented differences
- Clear file location, line numbers, and patterns provided
- JSDoc format specified with examples
- All dependencies (type guards, error codes) already exist
- Single function addition with minimal integration complexity

**Risk factors**:

- EnvironmentError handling differs from existing implementation (documented in PRP)
- Must ensure exact JSDoc format matches codebase patterns
- Test output interpretation may require debugging

**Mitigation**: This PRP provides exact implementation code, test file references, and validation commands to minimize ambiguity.
