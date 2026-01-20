# Product Requirement Prompt (PRP): Add isEnvironmentError Type Guard Function

---

## Goal

**Feature Goal**: Add `isEnvironmentError()` type guard function to the error handling system in `src/utils/errors.ts` to enable type-safe narrowing of `EnvironmentError` instances in catch blocks and conditional statements.

**Deliverable**: A new `isEnvironmentError()` type guard function that follows the established pattern for type guards, using the `value is Type` type predicate syntax, and integrates seamlessly with the existing error handling infrastructure.

**Success Definition**: All 6 type guard tests in `tests/unit/utils/errors-environment.test.ts` (lines 362-423) pass, validating:
- Returns `true` for `EnvironmentError` instances
- Returns `false` for other error types and non-error values
- Enables proper type narrowing in catch blocks
- Supports type narrowing in conditional statements
- Works in switch-style error handling patterns

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test passed**: An implementer unfamiliar with this codebase has everything needed to implement `isEnvironmentError()` successfully using this PRP.

### Documentation & References

```yaml
# MUST READ - Critical pattern files
- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Contains existing type guard patterns to follow (isSessionError, isTaskError, isAgentError, isValidationError), isPipelineError base type guard
  pattern: Exact implementation pattern for isEnvironmentError
  critical:
    - All type guards use "value is Type" type predicate syntax
    - All type guards use instanceof checks for their specific error class
    - isPipelineError is the base guard (lines 515-517) - checks instanceof PipelineError
    - Specific type guards (isSessionError, isTaskError, etc.) check instanceof specific class
    - isEnvironmentError should follow isSessionError pattern (lines 536-538)
    - Type guards are placed in TYPE GUARDS section at end of file
    - Export statement required for function to be importable

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts (lines 482-489)
  why: Contains EnvironmentError class implementation from P1.M1.T1.S2
  pattern: EnvironmentError class structure
  critical:
    - EnvironmentError extends PipelineError
    - readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT
    - constructor accepts (message: string, context?: PipelineErrorContext, cause?: Error)
    - Object.setPrototypeOf(this, EnvironmentError.prototype) in constructor

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts (lines 362-423)
  why: Defines all acceptance criteria for isEnvironmentError function
  pattern: Test expectations reveal required behavior
  critical:
    - Test 1: isEnvironmentError(new EnvironmentError('Test')) === true
    - Test 2: isEnvironmentError(new Error('Test')) === false
    - Test 3: Returns false for null, undefined, primitives, objects, arrays
    - Test 4: Type narrowing works in catch blocks (error.code, error.context accessible)
    - Test 5: Type narrowing works in conditionals (error.code, error.name accessible)
    - Test 6: Works in switch-style error handling (for-of loop with if condition)

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S3/research/typescript-type-guards.md
  why: TypeScript type guard fundamentals and best practices
  section: "What is a Type Guard?", "Type Guards for Error Handling in Catch Blocks"
  critical:
    - Type predicate syntax: "parameterName is Type" in return type
    - Enables automatic type narrowing in conditional blocks
    - instanceof is the standard pattern for class-based type guards
    - Type guards must be pure functions (no side effects)

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S3/research/type-guard-test-patterns.md
  why: Established test patterns for type guards in this codebase
  section: "Basic Type Guard Test Pattern", "Type Narrowing Test Pattern"
  critical:
    - Three-phase test structure: positive case, negative cases, edge cases
    - Type narrowing verification with property access after guard
    - Switch-style error handling pattern

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S3/research/type-guard-usage-patterns.md
  why: How type guards are actually used in the codebase
  section: "Common Usage Patterns"
  critical:
    - Pattern 1: Nested type guard checks (check isPipelineError first, then specific subtypes)
    - Pattern 2: Sequential if-else chains for categorization
    - Pattern 3: Integration with retry logic
    - Pattern 4: Type narrowing in conditional blocks

# EXTERNAL RESEARCH - TypeScript Type Guard Documentation
- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  why: Official TypeScript documentation on type predicates
  critical: "value is Type" syntax is required for type narrowing

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  why: TypeScript type narrowing fundamentals
  critical: Type guards enable compiler to narrow types in conditional blocks

- url: https://basarat.gitbook.io/typescript/type-system/typeguard
  why: TypeScript Deep Dive - Type Guards comprehensive guide
  critical: instanceof pattern for class-based type guards
```

### Current Codebase Tree

```bash
src/utils/
├── errors.ts                    # TARGET FILE - Add isEnvironmentError function here
│   ├── ErrorCodes enum
│   ├── ErrorCode type
│   ├── PipelineErrorContext interface
│   ├── PipelineError abstract class
│   ├── SessionError class
│   ├── TaskError class
│   ├── AgentError class
│   ├── ValidationError class
│   ├── EnvironmentError class          # From P1.M1.T1.S2 (lines 482-489)
│   └── TYPE GUARDS section
│       ├── isPipelineError()
│       ├── isSessionError()
│       ├── isTaskError()
│       ├── isAgentError()
│       └── isValidationError()        # ADD isEnvironmentError() after this
└── ... (other utility files)

tests/unit/utils/
├── errors-environment.test.ts   # TEST FILE - Contains 6 failing tests for isEnvironmentError
└── errors.test.ts               # REFERENCE - Tests for existing type guards
```

### Desired Codebase Tree with Files to be Added

```bash
# NO NEW FILES - Only modification to existing file

src/utils/errors.ts              # MODIFY - Add isEnvironmentError function
  ├── [existing] ErrorCodes enum
  ├── [existing] ErrorCode type
  ├── [existing] PipelineErrorContext interface
  ├── [existing] PipelineError abstract class
  ├── [existing] SessionError class
  ├── [existing] TaskError class
  ├── [existing] AgentError class
  ├── [existing] ValidationError class
  ├── [existing] EnvironmentError class
  └── [existing] TYPE GUARDS section
      ├── [existing] isPipelineError()
      ├── [existing] isSessionError()
      ├── [existing] isTaskError()
      ├── [existing] isAgentError()
      ├── [existing] isValidationError()
      └── [NEW] isEnvironmentError()         # ADD THIS after isValidationError
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: TypeScript Type Guard Requirements
// 1. Type predicate syntax is REQUIRED for type narrowing
//    Return type MUST be "error is EnvironmentError", not "boolean"
//    Without this, TypeScript will NOT narrow types in conditional blocks

// 2. instanceof check is sufficient for type guard
//    EnvironmentError properly extends PipelineError and sets prototype
//    Just use: return error instanceof EnvironmentError;

// 3. Type guards MUST be pure functions
//    No logging, no side effects, no mutations
//    Just return the boolean result of instanceof check

// 4. Export is required for function to be importable
//    Use: export function isEnvironmentError(...)

// CRITICAL: Codebase-Specific Gotchas
// 1. Type guards are placed in TYPE GUARDS section at end of errors.ts
//    Add isEnvironmentError after isValidationError (around line 581+)

// 2. All type guards follow same pattern:
//    function isXxxError(error: unknown): error is XxxError {
//      return error instanceof XxxError;
//    }

// 3. No additional validation needed beyond instanceof
//    EnvironmentError prototype chain is properly set up
//    instanceof check handles all type narrowing

// 4. Type guards are used in nested patterns:
//    if (isPipelineError(error)) {
//      if (isEnvironmentError(error)) { ... }
//    }
//    This is why we check both isPipelineError AND instanceof EnvironmentError

// 5. Tests expect exact function signature:
//    isEnvironmentError(error: unknown): error is EnvironmentError
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// No new data models required
// Uses existing types from errors.ts:
// - EnvironmentError class (from P1.M1.T1.S2)
// - PipelineError base class

// Type guard function structure:
function isEnvironmentError(error: unknown): error is EnvironmentError {
  return error instanceof EnvironmentError;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/utils/errors.ts
  - ADD: isEnvironmentError() type guard function after isValidationError()
  - IMPLEMENT: Type predicate return type "error is EnvironmentError"
  - IMPLEMENT: Parameter type "error: unknown"
  - IMPLEMENT: Body returns "error instanceof EnvironmentError"
  - IMPLEMENT: export function keyword
  - FOLLOW pattern: isSessionError() function (lines 536-538)
  - NAMING: isEnvironmentError function name (camelCase with "is" prefix)
  - PLACEMENT: After isValidationError() function, before any subsequent code
  - DEPENDENCIES: EnvironmentError class (already implemented in P1.M1.T1.S2)
  - INTEGRATION: Add JSDoc comment following pattern of other type guards

Task 2: VERIFY Test File Exists
  - CONFIRM: tests/unit/utils/errors-environment.test.ts exists (created in P1.M1.T1.S1)
  - REVIEW: isEnvironmentError test expectations (lines 362-423)
  - NO MODIFICATIONS: Tests are already written (TDD pattern)

Task 3: RUN TESTS TO VALIDATE
  - EXECUTE: npm test -- tests/unit/utils/errors-environment.test.ts
  - VERIFY: All 6 isEnvironmentError tests pass
  - VALIDATE: Test 1 - Returns true for EnvironmentError instances
  - VALIDATE: Test 2 - Returns false for other error types
  - VALIDATE: Test 3 - Returns false for non-errors (null, undefined, primitives)
  - VALIDATE: Test 4 - Type narrowing works in catch blocks
  - VALIDATE: Test 5 - Type narrowing works in conditionals
  - VALIDATE: Test 6 - Works in switch-style error handling
  - EXPECTED: All tests pass, implementation complete
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL PATTERN - Type Guard Reference Implementation
// ============================================================================
// This is the EXACT pattern to follow for isEnvironmentError
// Location: src/utils/errors.ts (after isValidationError function)

// ============================================================================
// EXISTING PATTERN - isSessionError (lines 536-538)
// ============================================================================
/**
 * Type guard for SessionError
 *
 * @remarks
 * Returns true if the error is an instance of SessionError.
 * Use for session-specific error handling.
 *
 * @example
 * ```typescript
 * if (isSessionError(error)) {
 *   // error is narrowed to SessionError
 *   if (error.isLoadError()) {
 *     // Handle session load failure
 *   }
 * }
 * ```
 */
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

// ============================================================================
// ENVIRONMENT ERROR TYPE GUARD IMPLEMENTATION
// ============================================================================
// Add this function after isValidationError() in src/utils/errors.ts
// Location: Approximately line 582+ (after isValidationError function)

/**
 * Type guard for EnvironmentError
 *
 * @remarks
 * Returns true if the error is an instance of EnvironmentError.
 * Use for environment configuration-specific error handling.
 *
 * @example
 * ```typescript
 * try {
 *   validateEnvironment();
 * } catch (error) {
 *   if (isEnvironmentError(error)) {
 *     // error is narrowed to EnvironmentError
 *     console.log(`Environment error: ${error.message}`);
 *     console.log(`Error code: ${error.code}`);
 *     if (error.context) {
 *       console.log(`Context:`, error.context);
 *     }
 *   }
 * }
 * ```
 */
export function isEnvironmentError(error: unknown): error is EnvironmentError {
  return error instanceof EnvironmentError;
}

// ============================================================================
// WHERE TO PLACE THE FUNCTION IN errors.ts
// ============================================================================
// File structure (simplified):

// 1. ErrorCodes enum
// 2. ErrorCode type
// 3. PipelineErrorContext interface
// 4. PipelineError abstract base class
// 5. Concrete error classes (SessionError, TaskError, AgentError, ValidationError, EnvironmentError)
// 6. Type guard functions section

export function isPipelineError(error: unknown): error is PipelineError {
  return error instanceof PipelineError;
}

export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError;
}

export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// ADD isEnvironmentError HERE (after isValidationError)
export function isEnvironmentError(error: unknown): error is EnvironmentError {
  return error instanceof EnvironmentError;
}
```

### Integration Points

```yaml
ERRORS_FILE:
  - modify: src/utils/errors.ts
  - location: TYPE GUARDS section, after isValidationError() function (approximately line 582+)
  - pattern: Follow isSessionError implementation pattern exactly
  - export: Ensure function is exported (use 'export function')
  - jsdoc: Add JSDoc comment with @remarks and @example sections

TEST_FILE:
  - exists: tests/unit/utils/errors-environment.test.ts
  - status: Created in P1.M1.T1.S1 (6 type guard tests)
  - action: No modifications needed, just run tests

NO OTHER INTEGRATIONS:
  - isEnvironmentError is not yet used elsewhere (future work items)
  - This is a foundational type guard for future use
  - Export from core index will be added in P1.M1.T1.S4
  - Future usage patterns: catch blocks, retry logic, error categorization
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after function addition - fix before proceeding
npm run lint              # ESLint validation
# OR directly:
npx eslint src/utils/errors.ts --fix

# Type checking with TypeScript
npm run typecheck
# OR directly:
npx tsc --noEmit

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common issues to watch for:
# - Missing 'export' keyword
# - Wrong return type (must be "error is EnvironmentError", not "boolean")
# - Wrong parameter type (must be "unknown", not "Error" or "any")
# - Missing JSDoc comment (optional but follows codebase pattern)
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test isEnvironmentError implementation specifically
npm test -- tests/unit/utils/errors-environment.test.ts

# Full utils test suite to ensure no regressions
npm test -- tests/unit/utils/

# Coverage validation (if coverage tools available)
npm run test:coverage

# Expected:
# - All 6 isEnvironmentError tests pass
# - No existing type guard tests break
# - Coverage shows isEnvironmentError is tested

# Test categories to verify:
# ✓ Positive case test (isEnvironmentError(new EnvironmentError()) === true)
# ✓ Negative case test (isEnvironmentError(new Error()) === false)
# ✓ Edge cases tests (null, undefined, primitives, objects, arrays)
# ✓ Type narrowing in catch block test
# ✓ Type narrowing in conditional test
# ✓ Switch-style error handling test
```

### Level 3: Integration Testing (System Validation)

```bash
# No integration tests yet for isEnvironmentError (future work items)
# However, run existing error integration tests to ensure no regressions

npm test -- tests/integration/utils/error-handling.test.ts

# Run all integration tests
npm test -- tests/integration/

# Expected: No regressions in existing error handling
```

### Level 4: Build & Runtime Validation

```bash
# Verify build succeeds
npm run build

# Verify TypeScript compilation
npx tsc --noEmit

# Expected:
# - Build completes successfully
# - No type errors
# - isEnvironmentError is properly exported
```

---

## Final Validation Checklist

### Technical Validation

- [ ] isEnvironmentError() function added to src/utils/errors.ts
- [ ] Function signature: `isEnvironmentError(error: unknown): error is EnvironmentError`
- [ ] Function body: `return error instanceof EnvironmentError;`
- [ ] Function is exported
- [ ] JSDoc comment added (following codebase pattern)
- [ ] No linting errors: `npm run lint` passes
- [ ] No type errors: `npm run typecheck` passes
- [ ] Build succeeds: `npm run build` completes

### Feature Validation

- [ ] All 6 tests in tests/unit/utils/errors-environment.test.ts (lines 362-423) pass
- [ ] Positive case test passes (returns true for EnvironmentError)
- [ ] Negative case test passes (returns false for plain Error)
- [ ] Edge cases tests pass (null, undefined, primitives)
- [ ] Type narrowing in catch block test passes
- [ ] Type narrowing in conditional test passes
- [ ] Switch-style error handling test passes

### Code Quality Validation

- [ ] Follows isSessionError pattern exactly
- [ ] File placement matches desired codebase tree structure
- [ ] Naming convention matches (camelCase with "is" prefix)
- [ ] Type predicate syntax used correctly ("error is EnvironmentError")
- [ ] Pure function (no side effects)
- [ ] No modifications to existing type guards
- [ ] No breaking changes to existing error handling

### Documentation & Deployment

- [ ] JSDoc comment with @remarks section
- [ ] JSDoc comment with @example section
- [ ] Function is self-documenting with clear name
- [ ] Ready for next subtask (P1.M1.T1.S4: Export from core index)
- [ ] Ready for future usage in error handling code

---

## Anti-Patterns to Avoid

- ❌ Don't use `boolean` return type (must be `error is EnvironmentError` for type narrowing)
- ❌ Don't use `Error` or `any` parameter type (must be `unknown`)
- ❌ Don't add additional validation beyond instanceof (prototype chain handles it)
- ❌ Don't add logging or side effects (type guards must be pure)
- ❌ Don't place before other type guards (add after isValidationError)
- ❌ Don't forget to export the function
- ❌ Don't modify existing type guards (focus only on isEnvironmentError)
- ❌ Don't add complex logic (keep it simple: just instanceof check)
- ❌ Don't use type assertions (the type predicate handles narrowing)

---

## Test Coverage Requirements

Based on the tests from P1.M1.T1.S1 (lines 362-423), the implementation must achieve:

### Basic Functionality Coverage (3 tests)

1. **Positive Case** (line 363-366):
   ```typescript
   const error = new EnvironmentError('Test error');
   expect(isEnvironmentError(error)).toBe(true);
   ```

2. **Negative Case** (line 368-373):
   ```typescript
   const plainError = new Error('Test');
   expect(isEnvironmentError(plainError)).toBe(false);
   ```

3. **Edge Cases** (line 375-382):
   ```typescript
   expect(isEnvironmentError(null)).toBe(false);
   expect(isEnvironmentError(undefined)).toBe(false);
   expect(isEnvironmentError('string')).toBe(false);
   expect(isEnvironmentError(123)).toBe(false);
   expect(isEnvironmentError({})).toBe(false);
   expect(isEnvironmentError([])).toBe(false);
   ```

### Type Narrowing Coverage (3 tests)

4. **Catch Block Type Narrowing** (line 384-393):
   ```typescript
   try {
     throw new EnvironmentError('Environment error');
   } catch (error) {
     if (isEnvironmentError(error)) {
       expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
       expect(error.context).toBeDefined();
     }
   }
   ```

5. **Conditional Type Narrowing** (line 395-403):
   ```typescript
   const error = new EnvironmentError('Test error');
   if (isEnvironmentError(error)) {
     expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
     expect(error.name).toBe('EnvironmentError');
   }
   ```

6. **Switch-Style Error Handling** (line 405-422):
   ```typescript
   const errors: unknown[] = [
     new EnvironmentError('Environment error'),
     new Error('Plain error'),
     null,
     undefined,
     'string error',
   ];
   let environmentCount = 0;
   for (const error of errors) {
     if (isEnvironmentError(error)) {
       environmentCount++;
     }
   }
   expect(environmentCount).toBe(1);
   ```

**Total: 6 tests must pass**

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Reasoning**:
1. ✅ Exact reference pattern available (isSessionError function)
2. ✅ Comprehensive test suite defines all acceptance criteria (6 tests)
3. ✅ All dependencies already exist (EnvironmentError class from P1.M1.T1.S2)
4. ✅ Single function addition (low complexity - ~3 lines of code)
5. ✅ Well-established pattern in codebase (5 other type guards follow same pattern)
6. ✅ Clear validation path (run tests to verify)

**Validation**: The completed PRP enables an AI agent unfamiliar with the codebase to implement `isEnvironmentError()` successfully using only the PRP content and codebase access. The implementation is a straightforward application of an existing pattern with clear acceptance tests.

---

## Context Directory for Additional Research

```bash
# Research notes storage
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S3/research/
├── typescript-type-guards.md          # TypeScript type guard fundamentals
├── type-guard-test-patterns.md        # Test patterns from codebase
├── type-guard-usage-patterns.md       # Usage patterns in codebase
└── external-type-guard-examples.md    # External best practices
```

---

**PRP Version**: 1.0
**Created**: 2026-01-15
**For**: Subtask P1.M1.T1.S3 - Add isEnvironmentError type guard function
**PRD Reference**: plan/002_1e734971e481/PRD.md
**Work Item**: P1.M1.T1 - Implement EnvironmentError Class
**Subtask**: P1.M1.T1.S3 - Add isEnvironmentError type guard function
