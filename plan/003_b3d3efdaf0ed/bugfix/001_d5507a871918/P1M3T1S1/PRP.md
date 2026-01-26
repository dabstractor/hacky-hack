# PRP: P1.M3.T1.S1 - Add validateBugfixSession function to core utilities

## Goal

**Feature Goal**: Implement `validateBugfixSession` function in src/utils/validation/ to enforce PRD §5.1 requirement that bug fix tasks only execute within bugfix session directories.

**Deliverable**: New validation function `validateBugfixSession(sessionPath: string): void` that throws `BugfixSessionValidationError` when session path does not contain 'bugfix' substring, enabling early detection of invalid session contexts for bug fix operations.

**Success Definition**:
- Function correctly identifies valid bugfix session paths (containing 'bugfix' substring)
- Function throws descriptive `BugfixSessionValidationError` for invalid paths with specific error message
- Function integrated into FixCycleWorkflow constructor for immediate validation
- Unit tests cover all scenarios: valid paths, invalid paths, edge cases, error message format

## User Persona

**Target User**: AI agent implementing bug fix tasks in the PRP Pipeline execution context.

**Use Case**: When FixCycleWorkflow is instantiated with a session path, the validation function prevents execution in non-bugfix sessions, protecting against state corruption from creating fix tasks in wrong session directories.

**User Journey**:
1. PRP Pipeline instantiates FixCycleWorkflow with session path
2. FixCycleWorkflow constructor calls `validateBugfixSession(sessionPath)`
3. If path is valid (contains 'bugfix'), workflow proceeds normally
4. If path is invalid, `BugfixSessionValidationError` is thrown with descriptive message
5. PRP Pipeline catches error and halts before creating fix tasks

**Pain Points Addressed**:
- Prevents bug fix tasks from being created in non-bugfix sessions (e.g., feature implementation sessions)
- Eliminates risk of state corruption from fix operations in wrong directory context
- Provides clear, actionable error messages for debugging invalid session paths

## Why

**Business value**: Enforces PRD §5.1 architectural boundary that bug fix operations must only occur in bugfix sessions, preventing data corruption and ensuring proper isolation between feature work and bug fix work.

**Integration with existing features**: This validation function will be called in FixCycleWorkflow constructor (P1.M3.T1.S3) and is part of Milestone 1.3 "Session Validation Guards" which also includes nested execution guard (P1.M3.T2).

**Problems this solves**:
- Currently, no validation exists to ensure FixCycleWorkflow only runs in bugfix sessions
- Bug fix tasks could be created in feature sessions, causing state corruption
- No clear error message when attempting bug operations in wrong session type

## What

**User-visible behavior**: When FixCycleWorkflow is instantiated with an invalid session path (not containing 'bugfix'), a clear error is thrown immediately: `BugfixSessionValidationError: Bug fix tasks can only be executed within bugfix sessions. Invalid path: {sessionPath}`

**Technical requirements**:
1. Create new error class `BugfixSessionValidationError` extending `PipelineError` (P1.M3.T1.S2 - out of scope for this subtask)
2. Create `validateBugfixSession` function in new file `src/utils/validation/session-validation.ts`
3. Function checks if path contains 'bugfix' using `sessionPath.includes('bugfix')` or `path.basename(sessionPath).includes('bugfix')`
4. Function throws `BugfixSessionValidationError` if path invalid, returns `undefined` if valid
5. Function includes comprehensive JSDoc with PRD reference

### Success Criteria

- [ ] `validateBugfixSession` function created at `src/utils/validation/session-validation.ts`
- [ ] Function signature: `export function validateBugfixSession(sessionPath: string): void`
- [ ] Function validates path contains 'bugfix' substring (case-sensitive)
- [ ] Function throws `BugfixSessionValidationError` with message format: `Bug fix tasks can only be executed within bugfix sessions. Invalid path: {sessionPath}`
- [ ] Function returns `undefined` (no error) when path is valid
- [ ] Comprehensive JSDoc documents purpose, PRD reference (§5.1), parameters, return value, throws
- [ ] Unit tests cover valid paths, invalid paths, edge cases (empty string, whitespace), error message format

## All Needed Context

### Context Completeness Check

✓ **"No Prior Knowledge" test passed**: This PRP provides all necessary context including existing error patterns, validation utility structures, test patterns, file organization conventions, and specific implementation guidance.

### Documentation & References

```yaml
# MUST READ - Existing error hierarchy and patterns
- file: src/utils/errors.ts
  why: Complete error class hierarchy showing PipelineError base class, specialized error patterns, error codes, context objects, JSDoc patterns
  pattern: Extend PipelineError, set error code, use Object.setPrototypeOf for prototype chain, include context object, implement toJSON()
  gotcha: Must call Object.setPrototypeOf(this, ClassName.prototype) for instanceof checks to work correctly
  critical: Error code format PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME}, use ErrorCodes const for type safety

- file: src/core/session-utils.ts
  why: Example of path manipulation and validation in session context, shows SessionFileError pattern for file operation errors
  pattern: Import { resolve, join, dirname, basename } from 'node:path', use resolve() for absolute paths
  gotcha: Session directory pattern is {sequence}_{hash} but bugfix sessions add /bugfix/{sequence}_{hash}/ subdirectory

- file: src/workflows/fix-cycle-workflow.ts
  why: Target file where validation will be integrated (in P1.M3.T1.S3), shows current constructor signature and basic validation
  pattern: Constructor validation at lines 116-118 (basic string validation), sessionPath property assignment at line 120
  gotcha: Current validation only checks non-empty string - no 'bugfix' path validation exists yet

- file: tests/unit/utils/errors.test.ts
  why: Test patterns for error classes including prototype chain, instanceof checks, context sanitization, toJSON() serialization
  pattern: describe blocks for each error class, test error code values, test instanceof behavior, test context object handling
  gotcha: Tests verify Error.captureStackTrace behavior and Object.setPrototypeOf setup

# External Research Documentation
- docfile: research/typescript-custom-error-class-patterns.md
  why: Best practices for extending Error in TypeScript with proper prototype chain setup
  section: "Proper Error Extension" and "Error Code Patterns"

- docfile: research/jsdoc-patterns-validation-functions.md
  why: JSDoc patterns for validation functions that throw errors
  section: "Documenting Validation Functions" and "Error Throwing Documentation"

- docfile: research/testing-validation-functions.md
  why: Testing patterns for validation functions including error throwing tests
  section: "Testing Error Throwing" and "Edge Case Testing"
```

### Current Codebase tree

```bash
src/
├── utils/
│   ├── errors.ts                    # PipelineError base class, specialized errors, error codes
│   ├── validation/                  # NEW DIRECTORY for validation utilities (to be created)
│   │   └── session-validation.ts    # NEW FILE - validateBugfixSession function
│   ├── prd-validator.ts             # Example of validation utilities
│   └── logger.ts                    # Logging utilities (getLogger pattern)
├── core/
│   ├── session-utils.ts             # Session file operations, path handling
│   └── models.ts                    # TypeScript models, Zod schemas
├── workflows/
│   ├── fix-cycle-workflow.ts        # Target file for integration (P1.M3.T1.S3)
│   └── prp-pipeline.ts              # Calls FixCycleWorkflow
└── config/
    └── constants.ts                 # Application constants (if needed for session patterns)
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/
├── utils/
│   ├── validation/                  # NEW DIRECTORY - Validation utility functions
│   │   └── session-validation.ts    # NEW FILE - Bugfix session path validation
│   │       # validateBugfixSession(sessionPath: string): void
│   │       # Throws BugfixSessionValidationError if path invalid
│   │       # Returns undefined if path valid
│   └── errors.ts                    # MODIFY in P1.M3.T1.S2 - Add BugfixSessionValidationError class
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Error class prototype chain setup in TypeScript
// All custom error classes MUST call Object.setPrototypeOf() for instanceof checks
// See src/utils/errors.ts lines 187-189 for pattern
export class CustomError extends PipelineError {
  readonly code = ErrorCodes.SOME_CODE;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    // CRITICAL: Must set prototype for this class explicitly
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// CRITICAL: Session path structure
// Regular session: plan/003_b3d3efdaf0ed/
// Bugfix session: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/
// Validation must check for 'bugfix' substring anywhere in path
// Use sessionPath.includes('bugfix') for simple matching

// CRITICAL: Error code format
// Follow existing pattern: PIPELINE_SESSION_INVALID_BUGFIX_PATH
// Add to ErrorCodes const in src/utils/errors.ts (in P1.M3.T1.S2)

// CRITICAL: JSDoc pattern for validation functions
// Must include @throws with specific error type and code
// Must include @returns documenting undefined return for void functions
// See src/utils/errors.ts lines 1-41 for module-level JSDoc example

// CRITICAL: Import pattern for path module
// Use: import { basename } from 'node:path';
// Use basename() if checking only directory name, otherwise use includes() on full path

// GOTCHA: This subtask (P1.M3.T1.S1) creates the validation function
// Subtask P1.M3.T1.S2 creates BugfixSessionValidationError class
// Subtask P1.M3.T1.S3 integrates validation into FixCycleWorkflow constructor
// For this subtask, create a placeholder error that will be replaced in S2
```

## Implementation Blueprint

### Data models and structure

No new data models required. This implementation uses existing `PipelineErrorContext` interface and creates a simple validation function.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/validation/ directory
  - IMPLEMENT: Create new validation utilities directory
  - FOLLOW pattern: Existing src/utils/ organization (errors.ts, prd-validator.ts, etc.)
  - NAMING: Lowercase 'validation' directory name
  - PLACEMENT: src/utils/validation/ at same level as errors.ts

Task 2: CREATE src/utils/validation/session-validation.ts
  - IMPLEMENT: validateBugfixSession function with comprehensive JSDoc
  - FOLLOW pattern: src/utils/errors.ts JSDoc style (lines 1-41, module documentation, parameter docs)
  - NAMING: Function name validateBugfixSession (camelCase), file name session-validation.ts (kebab-case)
  - IMPORTS: Import BugfixSessionValidationError from '../errors.js' (will be created in P1.M3.T1.S2)
  - PLACEMENT: src/utils/validation/session-validation.ts

Task 3: CREATE placeholder BugfixSessionValidationError class (TEMPORARY)
  - IMPLEMENT: Temporary error class extending Error (will be replaced in P1.M3.T1.S2)
  - FOLLOW pattern: src/utils/errors.ts PipelineError structure
  - NAMING: BugfixSessionValidationError class
  - ERROR CODE: Use string 'PIPELINE_SESSION_INVALID_BUGFIX_PATH' temporarily
  - REMOVAL: This will be replaced by proper PipelineError subclass in P1.M3.T1.S2
  - PLACEMENT: src/utils/validation/session-validation.ts (export, will move to errors.ts in S2)

Task 4: IMPLEMENT validateBugfixSession function
  - SIGNATURE: export function validateBugfixSession(sessionPath: string): void
  - VALIDATION: Check sessionPath.includes('bugfix') (case-sensitive substring match)
  - SUCCESS: Return undefined (implicit - no return statement)
  - FAILURE: Throw BugfixSessionValidationError with message 'Bug fix tasks can only be executed within bugfix sessions. Invalid path: {sessionPath}'
  - JSDOC: Include @param, @returns, @throws, @remarks with PRD §5.1 reference
  - CODE: Simple if-statement validation

Task 5: CREATE tests/unit/utils/validation/session-validation.test.ts
  - IMPLEMENT: Unit tests for validateBugfixSession function
  - FOLLOW pattern: tests/unit/utils/errors.test.ts structure (describe blocks, specific test cases)
  - NAMING: test file matches source file with .test.ts suffix
  - COVERAGE: Valid paths, invalid paths, edge cases (empty string, whitespace), error message format
  - PLACEMENT: tests/unit/utils/validation/session-validation.test.ts
```

### Implementation Patterns & Key Details

```typescript
// File: src/utils/validation/session-validation.ts

/**
 * Session path validation utilities
 *
 * @module utils/validation/session-validation
 *
 * @remarks
 * Provides validation functions for session paths to ensure operations
 * execute in the correct session context. Enforces architectural boundaries
 * from PRD §5.1 that bug fix operations must only occur in bugfix sessions.
 *
 * @example
 * ```typescript
 * import { validateBugfixSession } from './utils/validation/session-validation.js';
 *
 * // Valid bugfix session path
 * validateBugfixSession('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918'); // OK
 *
 * // Invalid session path (no 'bugfix')
 * validateBugfixSession('plan/003_b3d3efdaf0ed/feature/001_xyz'); // Throws
 * ```
 */

// NOTE: BugfixSessionValidationError will be properly implemented in P1.M3.T1.S2
// This is a temporary placeholder for this subtask
export class BugfixSessionValidationError extends Error {
  readonly code = 'PIPELINE_SESSION_INVALID_BUGFIX_PATH';

  constructor(message: string) {
    super(message);
    this.name = 'BugfixSessionValidationError';
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
  }
}

/**
 * Validates that a session path is for a bugfix session
 *
 * @remarks
 * Enforces PRD §5.1 requirement that bug fix tasks only execute within
 * bugfix session directories. A bugfix session is identified by the presence
 * of the 'bugfix' substring in the session path.
 *
 * Session path structure:
 * - Regular session: `plan/{sequence}_{hash}/`
 * - Bugfix session: `plan/{sequence}_{hash}/bugfix/{sequence}_{hash}/`
 *
 * This function performs a simple substring check for 'bugfix' anywhere
 * in the path. This ensures that bug fix tasks cannot be accidentally
 * created in feature implementation sessions or other non-bugfix contexts.
 *
 * Validation is performed early in FixCycleWorkflow constructor to prevent
 * state corruption from creating fix tasks in the wrong session directory.
 *
 * @param sessionPath - The session path to validate
 * @returns undefined if the session path is valid (contains 'bugfix')
 * @throws {BugfixSessionValidationError} If the session path does not contain 'bugfix'
 *
 * @example
 * ```typescript
 * import { validateBugfixSession } from './utils/validation/session-validation.js';
 *
 * // Valid bugfix session - no error thrown
 * validateBugfixSession('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 *
 * // Invalid session - throws BugfixSessionValidationError
 * try {
 *   validateBugfixSession('plan/003_b3d3efdaf0ed/feature/001_xyz');
 * } catch (error) {
 *   if (error instanceof BugfixSessionValidationError) {
 *   console.error(error.message);
 *   // "Bug fix tasks can only be executed within bugfix sessions.
 *   //  Invalid path: plan/003_b3d3efdaf0ed/feature/001_xyz"
 *   }
 * }
 * ```
 */
export function validateBugfixSession(sessionPath: string): void {
  // PATTERN: Simple substring check for 'bugfix' (case-sensitive)
  // Using includes() is sufficient - matches anywhere in path
  // This matches both: plan/.../bugfix/... and bugfix/... patterns
  if (!sessionPath.includes('bugfix')) {
    throw new BugfixSessionValidationError(
      `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${sessionPath}`
    );
  }

  // PATTERN: Return undefined for success (implicit - no return statement)
  // Function exits normally when validation passes
}
```

### Integration Points

```yaml
ERRORS:
  - modify: src/utils/errors.ts (in P1.M3.T1.S2)
  - add: BugfixSessionValidationError class extending PipelineError
  - add: Error code PIPELINE_SESSION_INVALID_BUGFIX_PATH to ErrorCodes const
  - add: Type guard isBugfixSessionValidationError

FIX_CYCLE_WORKFLOW:
  - modify: src/workflows/fix-cycle-workflow.ts (in P1.M3.T1.S3)
  - location: Constructor at lines 107-140
  - add: Import validateBugfixSession from '../utils/validation/session-validation.js'
  - add: Call validateBugfixSession(this.sessionPath) after basic string validation

TESTS:
  - add: tests/unit/utils/validation/session-validation.test.ts
  - pattern: Follow tests/unit/utils/errors.test.ts structure
  - coverage: Valid paths, invalid paths, edge cases, error message verification
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit src/utils/validation/session-validation.ts  # Type checking
npx eslint src/utils/validation/session-validation.ts        # Linting

# Project-wide validation
npm run lint                    # Run ESLint on all files
npm run typecheck               # Run TypeScript compiler check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common issues to watch for:
# - Missing imports (BugfixSessionValidationError)
# - Incorrect return type (void vs undefined)
# - JSDoc syntax errors (@throws tags)
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the validation function
npm test -- tests/unit/utils/validation/session-validation.test.ts

# Run all utils tests to ensure no breakage
npm test -- tests/unit/utils/

# Full test suite
npm test

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Test coverage requirements:
# - Valid path with 'bugfix' substring (no error)
# - Invalid path without 'bugfix' (throws error)
# - Error message format includes session path
# - Error is instanceof BugfixSessionValidationError
# - Edge cases: empty string, whitespace-only, 'bugfix' in different positions
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test (will be automated in P1.M3.T1.S4 after FixCycleWorkflow integration)

# Test 1: Valid session path (should not throw)
node -e "
  import { validateBugfixSession } from './src/utils/validation/session-validation.js';
  validateBugfixSession('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
  console.log('✓ Valid path accepted');
"

# Test 2: Invalid session path (should throw)
node -e "
  import { validateBugfixSession } from './src/utils/validation/session-validation.js';
  try {
    validateBugfixSession('plan/003_b3d3efdaf0ed/feature/001_xyz');
    console.error('✗ Invalid path should have thrown error');
    process.exit(1);
  } catch (error) {
    if (error.message.includes('Bug fix tasks can only be executed within bugfix sessions')) {
      console.log('✓ Invalid path rejected with correct message');
    } else {
      console.error('✗ Wrong error message:', error.message);
      process.exit(1);
    }
  }
"

# Expected: Both tests pass, validation function works correctly.
# After P1.M3.T1.S3 integration, FixCycleWorkflow constructor will call this validation.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Domain-specific validation for session paths

# Test with actual session directory structure from the codebase
# Valid bugfix session example from PRD
npm test -- --testNamePattern="validateBugfixSession with actual bugfix path"

# Verify error message is actionable for debugging
npm test -- --testNamePattern="error message includes session path"

# Cross-platform path validation (Windows vs Unix separators)
npm test -- --testNamePattern="cross-platform path validation"

# Case sensitivity verification ('bugfix' vs 'Bugfix' vs 'BUGFIX')
npm test -- --testNamePattern="case sensitive substring matching"

# Expected: All domain-specific validations pass.
# Key validation points:
# - Error message clearly states what's wrong and shows the invalid path
# - Works with both Unix (/) and Windows (\) path separators
# - Case-sensitive matching (only 'bugfix' lowercase is valid)
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/validation/session-validation.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Code follows existing patterns from src/utils/errors.ts

### Feature Validation

- [ ] Function created at `src/utils/validation/session-validation.ts`
- [ ] Function signature matches: `validateBugfixSession(sessionPath: string): void`
- [ ] Validation checks for 'bugfix' substring using `sessionPath.includes('bugfix')`
- [ ] Throws `BugfixSessionValidationError` for invalid paths
- [ ] Error message format: `Bug fix tasks can only be executed within bugfix sessions. Invalid path: {sessionPath}`
- [ ] Returns `undefined` (no error) for valid paths
- [ ] Comprehensive JSDoc with PRD §5.1 reference, @param, @returns, @throws

### Code Quality Validation

- [ ] Follows existing codebase patterns (errors.ts structure, session-utils.ts path handling)
- [ ] File placement matches desired codebase tree (src/utils/validation/)
- [ ] JSDoc follows errors.ts module documentation style
- [ ] Function uses simple, clear validation logic (single if-statement)
- [ ] Error class placeholder has correct prototype chain setup
- [ ] Imports use relative paths with .js extension (ESM module pattern)

### Documentation & Deployment

- [ ] JSDoc includes module-level documentation with @remarks and @example
- [ ] Function JSDoc includes PRD §5.1 reference in @remarks
- [ ] @throws tag specifies BugfixSessionValidationError error type
- [ ] @returns tag documents undefined return value for void function
- [ ] Code example in JSDoc shows both success and error cases
- [ ] Error message is clear and actionable for debugging

## Anti-Patterns to Avoid

- ❌ **Don't create complex path parsing** - Simple `includes('bugfix')` is sufficient
- ❌ **Don't add unnecessary dependencies** - No external libraries needed for substring check
- ❌ **Don't over-validate** - Only check for 'bugfix' substring, not full path structure
- ❌ **Don't return true/false** - Function should throw error or return undefined (void return type)
- ❌ **Don't add async/await** - This is synchronous validation, no I/O operations
- ❌ **Don't log in validation function** - Let caller handle logging, function should be pure
- ❌ **Don't use regular expressions** - Simple `includes()` is clearer and sufficient
- ❌ **Don't validate path structure** - Only check for 'bugfix' substring, not directory format
- ❌ **Don't normalize path** - Accept path as-is, let caller handle normalization if needed
- ❌ **Don't check file system** - This is string validation only, no fs operations
- ❌ **Don't skip JSDoc** - Comprehensive documentation required for maintainability
- ❌ **Don't hardcode error message** - Use template literal with sessionPath for clarity
- ❌ **Don't implement full error class now** - Temporary placeholder in this subtask, proper implementation in P1.M3.T1.S2
