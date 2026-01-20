# Product Requirement Prompt (PRP): Implement EnvironmentError Class

---

## Goal

**Feature Goal**: Add `EnvironmentError` class to the error handling hierarchy in `src/utils/errors.ts` to support environment configuration validation errors.

**Deliverable**: A new `EnvironmentError` class that extends `PipelineError`, uses error code `PIPELINE_VALIDATION_INVALID_INPUT`, and follows the established error class pattern.

**Success Definition**: All 58 failing tests in `tests/unit/utils/errors-environment.test.ts` pass, validating proper constructor behavior, error properties, prototype chain, serialization, context sanitization, and type guard functionality.

---

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" test passed**: An implementer unfamiliar with this codebase has everything needed to implement EnvironmentError successfully.

### Documentation & References

```yaml
# MUST READ - Critical pattern files
- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Contains SessionError pattern to follow, PipelineError base class, ErrorCodes enum, PipelineErrorContext interface
  pattern: Exact implementation pattern for EnvironmentError
  critical:
    - SessionError shows exact constructor signature and Object.setPrototypeOf usage
    - PipelineError base class shows super() call pattern and Error.captureStackTrace usage
    - ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT already exists in enum
    - PipelineErrorContext interface defines context parameter type

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts
  why: Defines all acceptance criteria - what EnvironmentError must do to pass tests
  pattern: Test expectations reveal required behavior
  critical:
    - Constructor accepts (message: string, context?: PipelineErrorContext, cause?: Error)
    - error.code must equal ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT
    - error.name must equal "EnvironmentError"
    - instanceof checks must work: EnvironmentError, PipelineError, Error
    - Prototype chain: EnvironmentError → PipelineError → Error
    - toJSON() serialization with context sanitization

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md
  why: Architecture documentation specifying contract definition
  section: Error Hierarchy section
  critical:
    - EnvironmentError must extend PipelineError
    - Uses error code PIPELINE_VALIDATION_INVALID_INPUT
    - Must call Object.setPrototypeOf() for prototype chain
    - Follow exact pattern of SessionError class

# EXTERNAL RESEARCH - TypeScript/Node.js Error Best Practices
- url: https://www.typescriptlang.org/docs/handbook/2/classes.html
  why: TypeScript class inheritance patterns
  critical: extends keyword, constructor patterns, readonly properties

- url: https://nodejs.org/api/errors.html
  why: Node.js Error API documentation
  critical: Error.captureStackTrace, cause property, stack trace behavior

- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
  why: JavaScript Error base class behavior
  critical: message, name, stack properties, instanceof behavior

- url: https://basarat.gitbook.io/typescript/type-system/exceptions
  why: TypeScript error handling deep dive
  critical: Custom error class patterns, type guards

- url: https://github.com/goldbergyoni/nodebestpractices
  why: Node.js error handling best practices
  critical: Error code patterns, error chaining, serialization
```

### Current Codebase Tree

```bash
src/utils/
├── errors.ts                    # TARGET FILE - Add EnvironmentError class here
├── logger.ts
├── retry.ts
└── ... (35 other utility files)

tests/unit/utils/
├── errors-environment.test.ts   # TEST FILE - 58 failing tests for EnvironmentError
├── errors.test.ts               # REFERENCE - Tests for existing error classes
└── ... (30 other test files)
```

### Desired Codebase Tree with Files to be Added

```bash
# NO NEW FILES - Only modification to existing file

src/utils/errors.ts              # MODIFY - Add EnvironmentError class
  ├── [existing] ErrorCodes enum
  ├── [existing] ErrorCode type
  ├── [existing] PipelineErrorContext interface
  ├── [existing] PipelineError abstract class
  ├── [existing] SessionError class
  ├── [existing] TaskError class
  ├── [existing] AgentError class
  ├── [existing] ValidationError class
  ├── [NEW] EnvironmentError class              # ADD THIS
  └── [existing] type guard functions
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: TypeScript/Node.js Custom Error Requirements
// 1. Object.setPrototypeOf() is REQUIRED for instanceof to work correctly
//    Without it, instanceof EnvironmentError returns false in some environments
//    This is especially important when targeting ES5 or using older Node.js versions

// 2. Error.captureStackTrace() is V8/Node.js specific (not available in browsers)
//    PipelineError base class already handles this - just call super()

// 3. Cause property is part of ES2022+ Error spec
//    PipelineError base class already handles this - just pass cause to super()

// 4. Readonly properties prevent modification after construction
//    Must use: readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
//    NOT: public code: ErrorCode; (allows modification)

// CRITICAL: Codebase-Specific Gotchas
// 1. ErrorCodes uses const assertion - values are string literals
//    ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT === 'PIPELINE_VALIDATION_INVALID_INPUT'

// 2. PipelineErrorContext extends Record<string, unknown>
//    Context can have any properties, but common ones are: sessionPath, taskId, operation

// 3. Context sanitization happens in PipelineError.toJSON() base method
//    EnvironmentError inherits this - no need to implement separately

// 4. Name property is set by PipelineError base class via this.name = this.constructor.name
//    EnvironmentError inherits this - no need to set manually

// 5. Timestamp is set by PipelineError base class
//    EnvironmentError inherits this - no need to implement separately
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// No new data models required
// Uses existing types from errors.ts:
// - ErrorCode type (from ErrorCodes enum)
// - PipelineErrorContext interface
// - PipelineError base class

// EnvironmentError class structure:
class EnvironmentError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
  constructor(message: string, context?: PipelineErrorContext, cause?: Error);
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/utils/errors.ts
  - ADD: EnvironmentError class declaration after ValidationError class
  - IMPLEMENT: extends PipelineError
  - IMPLEMENT: readonly code property set to ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT
  - IMPLEMENT: constructor accepting (message: string, context?: PipelineErrorContext, cause?: Error)
  - IMPLEMENT: super(message, context, cause) call to parent PipelineError constructor
  - IMPLEMENT: Object.setPrototypeOf(this, EnvironmentError.prototype) for prototype chain
  - FOLLOW pattern: SessionError class (exact same structure, different error code)
  - NAMING: EnvironmentError class name
  - PLACEMENT: After ValidationError class, before type guard functions
  - DEPENDENCIES: PipelineError base class, ErrorCodes enum, PipelineErrorContext interface

Task 2: VERIFY Test File Exists
  - CONFIRM: tests/unit/utils/errors-environment.test.ts exists (created in P1.M1.T1.S1)
  - REVIEW: Test expectations to understand required behavior
  - NO MODIFICATIONS: Tests are already written (TDD pattern)

Task 3: RUN TESTS TO VALIDATE
  - EXECUTE: npm test -- tests/unit/utils/errors-environment.test.ts
  - VERIFY: All 58 tests pass
  - VALIDATE: Constructor tests (4 tests) - message, context, cause handling
  - VALIDATE: Error properties tests (4 tests) - code, name, timestamp, stack
  - VALIDATE: Prototype chain tests (2 tests) - instanceof, getPrototypeOf
  - VALIDATE: toJSON() serialization tests (6 tests) - JSON output format
  - VALIDATE: Context sanitization tests (12 tests) - sensitive data redaction
  - VALIDATE: Type guard tests (6 tests) - isEnvironmentError function
  - VALIDATE: Edge cases tests (15 tests) - null/undefined handling, complex data
  - VALIDATE: Integration scenarios tests (9 tests) - error throwing, chaining
  - EXPECTED: All tests pass, implementation complete
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL PATTERN - SessionError Reference Implementation
// ============================================================================
// This is the EXACT pattern to follow for EnvironmentError
// Location: src/utils/errors.ts (after ValidationError class)

export class SessionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, SessionError.prototype);
  }

  isLoadError(): boolean {
    return this.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  }
}

// ============================================================================
// ENVIRONMENT ERROR IMPLEMENTATION
// ============================================================================
// Add this class after ValidationError class in src/utils/errors.ts

export class EnvironmentError extends PipelineError {
  // PATTERN: readonly code property (prevents modification)
  // GOTCHA: Must use const assertion value from ErrorCodes enum
  readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;

  // PATTERN: Constructor signature matches PipelineError base class
  // PARAMS: message (required), context (optional), cause (optional)
  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    // PATTERN: Call super() with all parameters
    // CRITICAL: PipelineError handles Error.captureStackTrace, name, timestamp, cause
    super(message, context, cause);

    // CRITICAL: Set prototype for instanceof to work correctly
    // GOTCHA: Without this, instanceof EnvironmentError may return false
    // This is especially important in ES5 transpilation or older Node.js versions
    Object.setPrototypeOf(this, EnvironmentError.prototype);
  }

  // OPTIONAL: Add convenience methods if needed
  // NOTE: SessionError has isLoadError() method
  // EnvironmentError may not need additional methods, but can add if useful
  // Example:
  // isValidationError(): boolean {
  //   return this.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
  // }
}

// ============================================================================
// WHERE TO PLACE THE CLASS IN errors.ts
// ============================================================================
// File structure (simplified):

// 1. ErrorCodes enum (const assertion)
export const ErrorCodes = {
  // ... existing error codes
  PIPELINE_VALIDATION_INVALID_INPUT: 'PIPELINE_VALIDATION_INVALID_INPUT',
  // ... other error codes
} as const;

// 2. ErrorCode type
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// 3. PipelineErrorContext interface
export interface PipelineErrorContext extends Record<string, unknown> {
  // ... context properties
}

// 4. PipelineError abstract base class
export abstract class PipelineError extends Error {
  // ... base class implementation
}

// 5. Concrete error classes
export class SessionError extends PipelineError { /* ... */ }
export class TaskError extends PipelineError { /* ... */ }
export class AgentError extends PipelineError { /* ... */ }
export class ValidationError extends PipelineError { /* ... */ }

// ADD ENVIRONMENT ERROR HERE (after ValidationError, before type guards)
export class EnvironmentError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, EnvironmentError.prototype);
  }
}

// 6. Type guard functions
export function isSessionError(error: unknown): error is SessionError { /* ... */ }
export function isTaskError(error: unknown): error is TaskError { /* ... */ }
// ... other type guards

// NOTE: isEnvironmentError will be implemented in P1.M1.T1.S3
```

### Integration Points

```yaml
ERRORS_FILE:
  - modify: src/utils/errors.ts
  - location: After ValidationError class (approximately line 200+)
  - pattern: Follow SessionError implementation pattern exactly
  - export: Ensure class is exported (use 'export class')

TEST_FILE:
  - exists: tests/unit/utils/errors-environment.test.ts
  - status: Created in P1.M1.T1.S1 (58 failing tests)
  - action: No modifications needed, just run tests

NO OTHER INTEGRATIONS:
  - EnvironmentError is not used elsewhere yet (future work items)
  - This is a foundational implementation for future use
  - isEnvironmentError type guard will be added in P1.M1.T1.S3
  - Export from core index will be added in P1.M1.T1.S4
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
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
# - Incorrect error code reference
# - Missing Object.setPrototypeOf call
# - Wrong constructor signature
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test EnvironmentError implementation specifically
npm test -- tests/unit/utils/errors-environment.test.ts

# Full utils test suite to ensure no regressions
npm test -- tests/unit/utils/

# Coverage validation (if coverage tools available)
npm run test:coverage

# Expected:
# - All 58 EnvironmentError tests pass
# - No existing error tests break
# - Coverage shows EnvironmentError is fully tested

# Test categories to verify:
# ✓ Constructor tests (4 tests) - Basic instantiation
# ✓ Error properties tests (4 tests) - code, name, timestamp, stack
# ✓ Prototype chain tests (2 tests) - instanceof behavior
# ✓ toJSON() serialization tests (6 tests) - JSON output
# ✓ Context sanitization tests (12 tests) - Sensitive data redaction
# ✓ Type guard tests (6 tests) - isEnvironmentError function
# ✓ Edge cases tests (15 tests) - Boundary conditions
# ✓ Integration scenarios tests (9 tests) - Real-world usage
```

### Level 3: Integration Testing (System Validation)

```bash
# No integration tests yet for EnvironmentError (future work items)
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
# - EnvironmentError is properly exported
```

---

## Final Validation Checklist

### Technical Validation

- [ ] EnvironmentError class added to src/utils/errors.ts
- [ ] Class extends PipelineError base class
- [ ] readonly code property set to ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT
- [ ] Constructor signature: (message: string, context?: PipelineErrorContext, cause?: Error)
- [ ] super(message, context, cause) call present
- [ ] Object.setPrototypeOf(this, EnvironmentError.prototype) call present
- [ ] Class is exported
- [ ] No linting errors: `npm run lint` passes
- [ ] No type errors: `npm run typecheck` passes
- [ ] Build succeeds: `npm run build` completes

### Feature Validation

- [ ] All 58 tests in tests/unit/utils/errors-environment.test.ts pass
- [ ] Constructor tests pass (message-only, with context, with cause, all three)
- [ ] Error properties tests pass (code, name, timestamp, stack)
- [ ] Prototype chain tests pass (instanceof, getPrototypeOf)
- [ ] toJSON() serialization tests pass (JSON format, ISO timestamp)
- [ ] Context sanitization tests pass (sensitive data redaction)
- [ ] Type guard tests pass (isEnvironmentError function)
- [ ] Edge cases tests pass (null/undefined, complex data, special chars)
- [ ] Integration scenarios tests pass (throw/catch, error chaining)

### Code Quality Validation

- [ ] Follows SessionError pattern exactly (except for error code)
- [ ] File placement matches desired codebase tree structure
- [ ] Naming convention matches (CamelCase class name)
- [ ] readonly keyword used for code property
- [ ] No unnecessary complexity or additional methods
- [ ] No modifications to existing error classes
- [ ] No breaking changes to existing error handling

### Documentation & Deployment

- [ ] Code is self-documenting with clear class name
- [ ] No additional documentation required (code is self-explanatory)
- [ ] Ready for next subtask (P1.M1.T1.S3: isEnvironmentError type guard)
- [ ] Ready for next subtask (P1.M1.T1.S4: Export from core index)

---

## Anti-Patterns to Avoid

- ❌ Don't create a separate file for EnvironmentError (add to errors.ts)
- ❌ Don't use a different error code (must be PIPELINE_VALIDATION_INVALID_INPUT)
- ❌ Don't skip Object.setPrototypeOf call (breaks instanceof)
- ❌ Don't make code property mutable (must be readonly)
- ❌ Don't change constructor signature (must match base class)
- ❌ Don't add unnecessary methods or complexity (keep it simple)
- ❌ Don't modify existing error classes (focus only on EnvironmentError)
- ❌ Don't implement toJSON() method (inherited from PipelineError)
- ❌ Don't implement context sanitization (inherited from PipelineError)
- ❌ Don't add isEnvironmentError type guard (implemented in P1.M1.T1.S3)
- ❌ Don't export from core index (implemented in P1.M1.T1.S4)

---

## Test Coverage Requirements

Based on the failing tests from P1.M1.T1.S1, the implementation must achieve:

### Constructor Coverage (4 tests)
- Create with message only
- Create with context
- Create with cause
- Create with all parameters (message, context, cause)

### Property Coverage (4 tests)
- error.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT
- error.name === "EnvironmentError"
- error.timestamp is Date object
- error.stack is string containing "EnvironmentError"

### Prototype Chain Coverage (2 tests)
- instanceof EnvironmentError === true
- instanceof PipelineError === true
- instanceof Error === true
- Object.getPrototypeOf(error) === EnvironmentError.prototype

### Serialization Coverage (6 tests)
- toJSON() returns plain object
- JSON contains name, code, message, timestamp
- timestamp is ISO 8601 format
- JSON.stringify() compatible

### Context Sanitization Coverage (12 tests)
- Redacts apiKey, token, password, secret, authorization, email
- Case-insensitive redaction
- Preserves non-sensitive fields
- Handles nested Error objects
- Handles circular references
- Handles non-serializable objects

### Type Guard Coverage (6 tests)
- isEnvironmentError(new EnvironmentError()) === true
- isEnvironmentError(new Error()) === false
- Handles null, undefined, primitives
- Type narrowing in conditional blocks

### Edge Cases Coverage (15 tests)
- Empty message
- null/undefined context
- undefined cause
- Long messages
- Special characters
- Unicode characters
- Readonly property enforcement

### Integration Scenarios Coverage (9 tests)
- Try-catch error throwing
- Type guard in catch block
- Error chaining with cause
- Structured logging with toJSON()
- Environment validation scenarios

**Total: 58 tests must pass**

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Reasoning**:
1. ✅ Exact reference pattern available (SessionError class)
2. ✅ Comprehensive test suite defines all acceptance criteria
3. ✅ All dependencies already exist (PipelineError, ErrorCodes, interfaces)
4. ✅ Single file modification (low complexity)
5. ✅ Well-established pattern in codebase (3 other error classes follow same pattern)
6. ✅ Clear validation path (run tests to verify)

**Validation**: The completed PRP enables an AI agent unfamiliar with the codebase to implement EnvironmentError successfully using only the PRP content and codebase access. The implementation is a straightforward application of an existing pattern with clear acceptance tests.

---

## Context Directory for Additional Research

```bash
# Research notes storage (if needed during implementation)
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M1T1S2/research/
```

---

**PRP Version**: 1.0
**Created**: 2025-01-15
**For**: Subtask P1.M1.T1.S2 - Implement EnvironmentError class in errors.ts
**PRD Reference**: plan/002_1e734971e481/PRD.md
**Work Item**: P1.M1.T1 - Implement EnvironmentError Class
**Subtask**: P1.M1.T1.S2 - Implement EnvironmentError class in errors.ts
