# PRP for P1.M3.T2.S2: Add NestedExecutionError class

---

## Goal

**Feature Goal**: Create `NestedExecutionError` class for nested execution guard failures in the PRP Pipeline, following established error handling patterns in the codebase.

**Deliverable**: `NestedExecutionError` class extending `PipelineError` with specific error code, context properties for debugging (existingPid, currentPid, sessionPath), and accompanying type guard function.

**Success Definition**:
- Error class follows established `PipelineError` hierarchy pattern
- Error has unique error code for programmatic handling
- Constructor accepts message, context (with typed properties), and optional cause
- Prototype chain is correctly set for instanceof checks
- Type guard function (`isNestedExecutionError`) exists and works correctly
- Error is used by `validateNestedExecution()` function from P1.M3.T2.S1
- All tests pass covering error creation, properties, type guard, and serialization

---

## Why

- **Critical Safety Mechanism**: PRD §9.2.5 requires PRP_PIPELINE_RUNNING guard to prevent recursive pipeline execution
- **Distinct Error Type**: Nested execution failures need specific error class separate from other validation errors for proper error handling and monitoring
- **Debugging Support**: Error context includes PIDs and session path for troubleshooting nested execution issues
- **Programmatic Handling**: Error code allows systems to detect and handle nested execution errors specifically
- **User Guidance**: Error message provides clear guidance on legitimate recursion (SKIP_BUG_FINDING=true)
- **Pattern Consistency**: Follows established error class patterns (BugfixSessionValidationError, SessionError, etc.)

**Problems this solves**:
- Generic `Error` or `ValidationError` don't provide enough context for nested execution failures
- Monitoring systems need specific error codes to track nested execution attempts
- Developers need clear error messages explaining why execution was blocked and how to legitimize recursion
- Type guards enable type-safe error handling in catch blocks

---

## What

### User-Visible Behavior

**No direct user-visible behavior** - this is a developer-facing error class. Users will experience:

**Error Scenario** (when nested execution is detected):
- Error message: `"Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {existingPid}"`
- Error includes context with running PID, current PID, and session path
- Pipeline execution stops before creating duplicate sessions

**Success Scenario** (legitimate recursion):
- Bug fix sessions with `SKIP_BUG_FINDING=true` execute without error
- No error is thrown when recursion is legitimate

### Technical Requirements

#### Error Class Signature

```typescript
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
    Object.setPrototypeOf(this, NestedExecutionError.prototype);
  }
}
```

#### Type Guard Signature

```typescript
export function isNestedExecutionError(
  error: unknown
): error is NestedExecutionError {
  return error instanceof NestedExecutionError;
}
```

#### Error Code

```typescript
PIPELINE_VALIDATION_NESTED_EXECUTION: 'PIPELINE_VALIDATION_NESTED_EXECUTION'
```

#### Error Message Format

```
Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {existingPid}
```

#### Error Context

```typescript
{
  existingPid: string;  // PID from process.env.PRP_PIPELINE_RUNNING
  currentPid: string;   // Current process PID from process.pid
  sessionPath: string;  // Session path being validated
}
```

### Success Criteria

- [ ] Error class extends `PipelineError` base class
- [ ] Error has `readonly code` property set to `PIPELINE_VALIDATION_NESTED_EXECUTION`
- [ ] Constructor accepts `(message, context, cause)` parameters
- [ ] Context interface extends `PipelineErrorContext` with typed properties
- [ ] Prototype chain is set with `Object.setPrototypeOf(this, NestedExecutionError.prototype)`
- [ ] Type guard function `isNestedExecutionError()` is exported
- [ ] Error code is added to `ErrorCodes` const
- [ ] Error is imported and used by `validateNestedExecution()` in `execution-guard.ts`
- [ ] All unit tests pass

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: ✅ This PRP provides everything needed to implement `NestedExecutionError` successfully:
- Exact error class pattern to follow from existing codebase
- Complete constructor signature and property definitions
- Error code placement in ErrorCodes const
- Type guard function pattern
- Test patterns from existing error class tests
- Integration point with validateNestedExecution function

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Previous PRP (Dependency)
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S1/PRP.md
  why: Defines validateNestedExecution function that will use this error class
  section: "Implementation Blueprint" for function signature and usage
  critical: validateNestedExecution expects NestedExecutionError with specific context properties

# Error Class Pattern (Follow This Exactly)
- file: src/utils/errors.ts
  why: Complete error class infrastructure - PipelineError base, ErrorCodes, type guards
  pattern: All error classes follow same structure (BugfixSessionValidationError, SessionError, etc.)
  section: Lines 496-504 for BugfixSessionValidationError (closest pattern)
  section: Lines 146-345 for PipelineError base class
  section: Lines 58-86 for ErrorCodes const
  section: Lines 589-819 for type guard patterns
  gotcha: Must use Object.setPrototypeOf(this, NestedExecutionError.prototype) in constructor

# Existing Implementation (Already in Codebase)
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S2/research/existing-implementation.md
  why: Documents that NestedExecutionError already exists at lines 523-539
  critical: This is a VERIFICATION task, not implementation - class already exists
  section: "Complete Implementation Code" for exact code that's already there
  gotcha: Implementation is complete and tested - this PRP validates requirements are met

# Error Class Patterns Research
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S2/research/error-class-patterns.md
  why: Detailed analysis of error class patterns across codebase
  section: "Pattern from BugfixSessionValidationError" for direct comparison
  section: "Test Pattern for Error Classes" for test structure
  critical: Extended context interface pattern for type safety

# Test Coverage Research
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S2/research/test-coverage.md
  why: Complete test patterns for error class validation
  section: "Test Patterns" for all test types (instanceof, properties, type guard, JSON)
  pattern: Vitest describe/it structure with vi.stubEnv for environment mocking
  gotcha: Always use vi.unstubAllEnvs() in afterEach to restore environment

# Integration Point
- file: src/utils/validation/execution-guard.ts
  why: validateNestedExecution function that throws NestedExecutionError
  pattern: Import error class and throw with context
  section: Lines 23, 93 for import and re-export
  gotcha: Re-exports error and type guard for convenience

# TypeScript Best Practices
- docfile: /home/dustin/projects/hacky-hack/research/typescript-custom-error-best-practices-summary.md
  why: TypeScript/JavaScript custom error class best practices
  section: "Proper Prototype Chain Setup" for why Object.setPrototypeOf is critical
  section: "Error Code Patterns" for const assertion usage
  section: "Common Pitfalls to Avoid" for gotchas
```

### Current Codebase Tree

```bash
src/
├── utils/
│   ├── errors.ts                                # ALL error classes, type guards, ErrorCodes
│   └── validation/
│       ├── session-validation.ts                # validateBugfixSession (reference pattern)
│       └── execution-guard.ts                   # validateNestedExecution (uses this error)
├── workflows/
│   └── prp-pipeline.ts                          # PRP Pipeline (guard integration point)

tests/
└── unit/
    └── utils/
        ├── errors.test.ts                       # Error class test patterns
        └── validation/
            ├── session-validation.test.ts       # Validation function test patterns
            └── execution-guard.test.ts          # NestedExecutionError tests (lines 136-406)
```

### Desired Codebase Tree (No Changes - Already Implemented)

```bash
# Status: ALREADY IMPLEMENTED - No changes needed

src/
├── utils/
│   ├── errors.ts                                # ✅ HAS NestedExecutionError (lines 523-539)
│   │                                            # ✅ HAS Error code (lines 81-82)
│   │                                            # ✅ HAS Type guard (lines 726-733)
│   └── validation/
│       └── execution-guard.ts                   # ✅ USES NestedExecutionError

tests/
└── unit/
    └── utils/
        └── validation/
            └── execution-guard.test.ts          # ✅ HAS comprehensive tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Must set prototype chain in error constructor
// Without this, instanceof checks fail in transpiled ES5 code
// In NestedExecutionError constructor:
Object.setPrototypeOf(this, NestedExecutionError.prototype);

// CRITICAL: Error code naming convention
// Pattern: PIPELINE_{DOMAIN}_{CATEGORY}_{SPECIFIC}
// Correct: PIPELINE_VALIDATION_NESTED_EXECUTION
// Wrong: NESTED_EXECUTION (too short, breaks pattern)

// CRITICAL: Context interface pattern
// Use intersection type for type-safe context properties:
context?: PipelineErrorContext & {
  existingPid?: string;
  currentPid?: string;
  sessionPath?: string;
}

// CRITICAL: Import paths use .js extension (ES modules)
// import { PipelineError, ErrorCodes } from '../errors.js';

// CRITICAL: Type guard function signature
// export function isNestedExecutionError(error: unknown): error is NestedExecutionError
// Note: Return type is a type predicate (error is NestedExecutionError)

// CRITICAL: Error codes use const assertion for type safety
// export const ErrorCodes = { ... } as const;

// GOTCHA: validateNestedExecution uses this error
// Don't modify the error signature after function is implemented
// Function expects: existingPid, currentPid, sessionPath in context

// GOTCHA: Error is re-exported in execution-guard.ts
// export { NestedExecutionError, isNestedExecutionError };
// This allows convenient importing from validation module

// CRITICAL: Test environment variable mocking
// Use vi.stubEnv() to set, vi.unstubAllEnvs() to restore
// Always restore in afterEach to prevent test pollution

// CRITICAL: Error context is attached directly to error instance
// In PipelineError constructor: if (context) { Object.assign(this, context); }
// This makes context properties accessible as error.existingPid, etc.

// GOTCHA: Previous PRP (P1.M3.T2.S1) specified this error
// That PRP includes this error in its deliverables
// This PRP (P1.M3.T2.S2) focuses specifically on the error class itself

// GOTCHA: Implementation already exists
// This PRP validates existing implementation meets requirements
// No code changes needed - verification and documentation only
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing PipelineError infrastructure:

```typescript
// Error context interface (extended for type safety)
interface NestedExecutionErrorContext extends PipelineErrorContext {
  existingPid?: string;  // PID from process.env.PRP_PIPELINE_RUNNING
  currentPid?: string;   // Current process PID
  sessionPath?: string;  // Session path being validated
}

// Error class extends PipelineError
class NestedExecutionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION;
  // Inherited: context, timestamp, cause, name, message, toJSON()
}

// Type guard
function isNestedExecutionError(error: unknown): error is NestedExecutionError;
```

### Implementation Status

**STATUS**: ✅ ALREADY IMPLEMENTED

This subtask (P1.M3.T2.S2) specifies creating the NestedExecutionError class, but research shows it already exists in the codebase:

- **Location**: `src/utils/errors.ts` lines 523-539
- **Error code**: Lines 81-82
- **Type guard**: Lines 726-733
- **Tests**: `tests/unit/utils/validation/execution-guard.test.ts` lines 136-406

### Implementation Verification Tasks

```yaml
Task 1: VERIFY error class exists in src/utils/errors.ts
  - CHECK: NestedExecutionError class at lines 523-539
  - CHECK: Extends PipelineError base class
  - CHECK: readonly code property set to ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION
  - CHECK: Constructor accepts (message, context, cause)
  - CHECK: Context interface extended with typed properties (existingPid, currentPid, sessionPath)
  - CHECK: Object.setPrototypeOf called in constructor
  - EXPECTED: All checks pass

Task 2: VERIFY error code in ErrorCodes const
  - CHECK: ErrorCodes at lines 58-86
  - CHECK: PIPELINE_VALIDATION_NESTED_EXECUTION exists
  - CHECK: Value is 'PIPELINE_VALIDATION_NESTED_EXECUTION'
  - CHECK: ErrorCodes uses const assertion (as const)
  - EXPECTED: Error code exists and is correct

Task 3: VERIFY type guard function exists
  - CHECK: isNestedExecutionError function at lines 726-733
  - CHECK: Function signature: (error: unknown) => error is NestedExecutionError
  - CHECK: Returns error instanceof NestedExecutionError
  - CHECK: Function is exported
  - EXPECTED: Type guard exists and is correct

Task 4: VERIFY error is used by validateNestedExecution
  - CHECK: src/utils/validation/execution-guard.ts imports error
  - CHECK: Function throws NestedExecutionError with correct context
  - CHECK: Error message format matches specification
  - CHECK: Error includes existingPid, currentPid, sessionPath in context
  - EXPECTED: Error is integrated correctly

Task 5: VERIFY comprehensive test coverage
  - CHECK: tests/unit/utils/validation/execution-guard.test.ts
  - CHECK: Tests cover error creation, properties, instanceof checks
  - CHECK: Tests cover type guard function
  - CHECK: Tests cover error message format
  - CHECK: Tests cover error context properties
  - EXPECTED: All tests pass

Task 6: RUN Level 1 validation (Syntax & Style)
  - COMMAND: npx tsc --noEmit src/utils/errors.ts
  - EXPECTED: Zero type errors
  - FIX: Any TypeScript errors if found

Task 7: RUN Level 2 validation (Unit Tests)
  - COMMAND: npm test -- tests/unit/utils/validation/execution-guard.test.ts
  - EXPECTED: All tests pass
  - FIX: Any test failures if found

Task 8: DOCUMENT verification results
  - CREATE: Verification report in research/ directory
  - DOCUMENT: All verification task results
  - IDENTIFY: Any gaps or discrepancies from requirements
  - RECOMMEND: Any improvements if gaps found
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Error Class Definition (Already Implemented)
// ============================================================================
// File: src/utils/errors.ts, Lines 523-539

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

// ============================================================================
// PATTERN 2: Error Code Definition (Already Implemented)
// ============================================================================
// File: src/utils/errors.ts, Lines 81-82

export const ErrorCodes = {
  // ... existing codes ...
  PIPELINE_VALIDATION_NESTED_EXECUTION:
    'PIPELINE_VALIDATION_NESTED_EXECUTION',
} as const;

// ============================================================================
// PATTERN 3: Type Guard Function (Already Implemented)
// ============================================================================
// File: src/utils/errors.ts, Lines 726-733

export function isNestedExecutionError(
  error: unknown
): error is NestedExecutionError {
  return error instanceof NestedExecutionError;
}

// ============================================================================
// PATTERN 4: Usage in Validation Function (Already Implemented)
// ============================================================================
// File: src/utils/validation/execution-guard.ts

import {
  PipelineError,
  ErrorCodes,
  isNestedExecutionError,
} from '../errors.js';

import {
  NestedExecutionError,
} from '../errors.js';

export function validateNestedExecution(sessionPath: string): void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;

  if (!existingPid) {
    return; // No pipeline running, allow execution
  }

  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' &&
    sessionPath.toLowerCase().includes('bugfix');

  if (isBugfixRecursion) {
    return; // Legitimate recursion, allow
  }

  // Throw error for illegitimate nested execution
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
// PATTERN 5: Test Structure (Already Implemented)
// ============================================================================
// File: tests/unit/utils/validation/execution-guard.test.ts

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  validateNestedExecution,
  NestedExecutionError,
  isNestedExecutionError,
} from '../../../../src/utils/validation/execution-guard.js';

describe('NestedExecutionError class', () => {
  it('should create error with correct properties', () => {
    const context = {
      existingPid: '12345',
      currentPid: process.pid.toString(),
      sessionPath: '/test/path'
    };
    const error = new NestedExecutionError('Nested execution detected', context);

    // instanceof checks (prototype chain)
    expect(error instanceof NestedExecutionError).toBe(true);
    expect(error instanceof PipelineError).toBe(true);
    expect(error instanceof Error).toBe(true);

    // error code
    expect(error.code).toBe('PIPELINE_VALIDATION_NESTED_EXECUTION');

    // error name
    expect(error.name).toBe('NestedExecutionError');

    // error message
    expect(error.message).toBe('Nested execution detected');

    // context properties
    expect(error.existingPid).toBe('12345');
    expect(error.currentPid).toBeDefined();
    expect(error.sessionPath).toBe('/test/path');

    // inherited properties
    expect(error.timestamp).toBeDefined();
  });

  it('should work with type guard', () => {
    const error = new NestedExecutionError('Test');

    if (isNestedExecutionError(error)) {
      // TypeScript knows error is NestedExecutionError here
      expect(error.code).toBe('PIPELINE_VALIDATION_NESTED_EXECUTION');
    } else {
      expect.fail('Should be NestedExecutionError');
    }
  });
});
```

### Integration Points

```yaml
ERROR_CLASS_HIERARCHY:
  - base: PipelineError (src/utils/errors.ts lines 146-345)
  - extends: NestedExecutionError extends PipelineError
  - prototype_chain: NestedExecutionError -> PipelineError -> Error
  - error_code: PIPELINE_VALIDATION_NESTED_EXECUTION (lines 81-82)
  - type_guard: isNestedExecutionError (lines 726-733)

VALIDATION_FUNCTION_INTEGRATION:
  - file: src/utils/validation/execution-guard.ts
  - function: validateNestedExecution(sessionPath: string): void
  - import: NestedExecutionError from '../errors.js'
  - throw_condition: When PRP_PIPELINE_RUNNING set AND not legitimate bugfix recursion
  - error_message: "Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {existingPid}"
  - error_context: { existingPid, currentPid, sessionPath }
  - re_export: NestedExecutionError and isNestedExecutionError (line 93)

TEST_COVERAGE:
  - primary: tests/unit/utils/validation/execution-guard.test.ts
  - lines: 136-406 for NestedExecutionError tests
  - coverage: Error creation, properties, instanceof, type guard, JSON serialization
  - patterns: Vitest describe/it, vi.stubEnv for environment mocking

ERROR_CODES_CONST:
  - location: src/utils/errors.ts lines 58-86
  - pattern: const assertion for type safety (as const)
  - naming: PIPELINE_{DOMAIN}_{CATEGORY}_{SPECIFIC}
  - new_code: PIPELINE_VALIDATION_NESTED_EXECUTION
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check error class file
npx tsc --noEmit src/utils/errors.ts

# Expected: Zero type errors
# If errors exist, READ output and verify they're not related to NestedExecutionError

# Check for linting errors (if linter configured)
npm run lint src/utils/errors.ts

# Check formatting (if formatter configured)
npm run format:check src/utils/errors.ts
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run specific test file for NestedExecutionError
npm test -- tests/unit/utils/validation/execution-guard.test.ts

# Expected output:
# ✓ tests/unit/utils/validation/execution-guard.test.ts (40+ tests)
#   ✓ NestedExecutionError class tests (10+ tests)
#   ✓ validateNestedExecution tests (30+ tests)
#   ✓ Type guard tests (5+ tests)
#
# Test Files  1 passed (1)
# Tests  40+ passed (40+)

# Run with coverage (if available)
npm test -- --coverage tests/unit/utils/validation/
# Expected: High coverage percentage for NestedExecutionError

# Run all error tests
npm test -- tests/unit/utils/errors.test.ts
# Expected: All NestedExecutionError tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual verification: Test error is thrown correctly
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
import { NestedExecutionError } from './src/utils/errors.js';
process.env.PRP_PIPELINE_RUNNING = '99999';
const sessionPath = 'plan/003/feature/001';
try {
  validateNestedExecution(sessionPath);
  console.error('FAIL: Should have thrown NestedExecutionError');
} catch (error) {
  if (error.code === 'PIPELINE_VALIDATION_NESTED_EXECUTION') {
    console.log('PASS: NestedExecutionError thrown correctly');
    console.log('Message:', error.message);
    console.log('Context:', { existingPid: error.existingPid, currentPid: error.currentPid, sessionPath: error.sessionPath });
  } else {
    console.error('FAIL: Wrong error type:', error);
  }
}
"
# Expected: PASS: NestedExecutionError thrown correctly
# Expected: Message includes PID 99999
# Expected: Context includes all properties

# Manual verification: Test legitimate recursion doesn't throw
node -e "
import { validateNestedExecution } from './src/utils/validation/execution-guard.js';
process.env.SKIP_BUG_FINDING = 'true';
process.env.PRP_PIPELINE_RUNNING = '99999';
const sessionPath = 'plan/003/bugfix/001';
validateNestedExecution(sessionPath);
console.log('PASS: Legitimate bugfix recursion allowed');
"
# Expected: PASS: Legitimate bugfix recursion allowed

# Manual verification: Test type guard works
node -e "
import { NestedExecutionError, isNestedExecutionError } from './src/utils/errors.js';
const error = new NestedExecutionError('Test', { existingPid: '12345' });
console.log('isNestedExecutionError(error):', isNestedExecutionError(error));
console.log('isNestedExecutionError(new Error()):', isNestedExecutionError(new Error()));
"
# Expected: isNestedExecutionError(error): true
# Expected: isNestedExecutionError(new Error()): false
```

### Level 4: Domain-Specific Validation

```bash
# Domain-specific: Verify error is used in actual workflow
# The validateNestedExecution function should be called in PRP Pipeline

# Verify integration point exists
grep -n "validateNestedExecution" src/workflows/prp-pipeline.ts
# Expected: Found at least one import and call

# Verify error import chain
grep -n "NestedExecutionError" src/utils/validation/execution-guard.ts
# Expected: Import from errors.js and re-export

# Verify type guard usage
grep -n "isNestedExecutionError" src/utils/errors.ts
# Expected: Function definition and usage examples in JSDoc

# Domain-specific: Test actual error message format
node -e "
import { NestedExecutionError } from './src/utils/errors.js';
const error = new NestedExecutionError(
  'Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: 99999',
  { existingPid: '99999', currentPid: '12345', sessionPath: '/test' }
);
console.log('Error message:', error.message);
console.log('Contains PID?', error.message.includes('99999'));
console.log('Contains guidance?', error.message.includes('Only bug fix sessions can recurse'));
console.log('Error code:', error.code);
"
# Expected: All checks pass

# Domain-specific: Verify error in try-catch with type guard
node -e "
import { validateNestedExecution, isNestedExecutionError } from './src/utils/validation/execution-guard.js';
process.env.PRP_PIPELINE_RUNNING = '99999';
try {
  validateNestedExecution('plan/003/feature/001');
} catch (error) {
  if (isNestedExecutionError(error)) {
    console.log('Type guard works - error is NestedExecutionError');
    console.log('Can access typed properties:');
    console.log('  existingPid:', error.existingPid);
    console.log('  currentPid:', error.currentPid);
    console.log('  sessionPath:', error.sessionPath);
  } else {
    console.log('FAIL: Type guard failed');
  }
}
"
# Expected: Type guard works and all properties accessible
```

---

## Final Validation Checklist

### Technical Validation

- [ ] NestedExecutionError class exists in `src/utils/errors.ts`
- [ ] Error code `PIPELINE_VALIDATION_NESTED_EXECUTION` added to `ErrorCodes`
- [ ] `isNestedExecutionError` type guard function exists
- [ ] Class extends `PipelineError` base class
- [ ] Prototype chain is correctly set
- [ ] Context interface is extended with typed properties
- [ ] All TypeScript type checking passes: `npx tsc --noEmit src/utils/errors.ts`
- [ ] No linting errors: `npm run lint src/utils/errors.ts`
- [ ] No formatting issues: `npm run format:check src/utils/errors.ts`
- [ ] Error is imported in `execution-guard.ts`
- [ ] All unit tests pass: `npm test -- tests/unit/utils/validation/execution-guard.test.ts`
- [ ] Related error tests pass: `npm test -- tests/unit/utils/errors.test.ts`

### Feature Validation

- [ ] Error code matches specification: `PIPELINE_VALIDATION_NESTED_EXECUTION`
- [ ] Error accepts (message, context, cause) parameters
- [ ] Context includes `existingPid`, `currentPid`, `sessionPath`
- [ ] Error message format matches specification
- [ ] Error is used by `validateNestedExecution()` function
- [ ] `isNestedExecutionError` type guard works correctly
- [ ] Prototype chain is correct (NestedExecutionError -> PipelineError -> Error)
- [ ] Error properties are accessible (code, name, message, context, timestamp)
- [ ] JSON serialization works via `toJSON()` method

### Code Quality Validation

- [ ] Follows existing error class pattern (BugfixSessionValidationError)
- [ ] Follows error code naming convention
- [ ] Context interface uses intersection type for type safety
- [ ] Type guard follows naming pattern (`is{ErrorName}`)
- [ ] Prototype chain setup follows best practices
- [ ] Import paths use `.js` extension (ES modules)
- [ ] Error is exported and can be imported
- [ ] Type guard is exported and can be imported
- [ ] Code is consistent with PipelineError base class

### Integration Validation

- [ ] Error is imported in `src/utils/validation/execution-guard.ts`
- [ ] Error is re-exported from `execution-guard.ts`
- [ ] Error is thrown by `validateNestedExecution()` with correct context
- [ ] Error message includes existing PID
- [ ] Error context includes all required properties
- [ ] Type guard works in catch blocks for type narrowing
- [ ] Tests cover all error scenarios
- [ ] Manual testing confirms error behavior

### Documentation & Deployment

- [ ] Error class follows established patterns (no inconsistencies)
- [ ] Implementation matches previous PRP specification (P1.M3.T2.S1)
- [ ] Test coverage is comprehensive
- [ ] No unnecessary refactoring or code changes
- [ ] All verification is documented in research/ directory

---

## Anti-Patterns to Avoid

- ❌ Don't modify the existing error class - it's already correctly implemented
- ❌ Don't change the error code format - use full `PIPELINE_VALIDATION_NESTED_EXECUTION`
- ❌ Don't forget the context interface extension - type safety is important
- ❌ Don't skip the type guard function - all error classes have one
- ❌ Don't use `.ts` extension in imports - must use `.js` (ES modules)
- ❌ Don't skip prototype chain setup - instanceof checks will fail
- ❌ Don't throw generic `Error` - must use `NestedExecutionError`
- ❌ Don't modify constructor signature - it's already used by validateNestedExecution
- ❌ Don't add return statements to error constructor - no return value
- ❌ Don't forget to re-export error and type guard from execution-guard.ts
- ❌ Don't skip testing the type guard function - it's part of the contract
- ❌ Don't hardcode PID values in tests - use process.pid or vi.stubEnv
- ❌ Don't forget environment variable cleanup in tests - use vi.unstubAllEnvs()
- ❌ Don't add unnecessary methods to error class - keep it simple
- ❌ Don't skip JSDoc if adding documentation - follow BugfixSessionValidationError pattern

---

## Verification Results Summary

### Implementation Status: ✅ COMPLETE

The `NestedExecutionError` class is **fully implemented** and meets all requirements:

1. ✅ **Error Class**: Implemented at `src/utils/errors.ts` lines 523-539
2. ✅ **Error Code**: Defined in `ErrorCodes` const at lines 81-82
3. ✅ **Type Guard**: Implemented at lines 726-733
4. ✅ **Integration**: Used by `validateNestedExecution()` in `execution-guard.ts`
5. ✅ **Tests**: Comprehensive test coverage in `execution-guard.test.ts`

### Requirements Validation

| Requirement | Status | Notes |
|-------------|--------|-------|
| Extends PipelineError | ✅ | Lines 523-539 |
| Error code property | ✅ | `PIPELINE_VALIDATION_NESTED_EXECUTION` |
| Constructor signature | ✅ | `(message, context, cause)` |
| Context properties | ✅ | `existingPid`, `currentPid`, `sessionPath` |
| Prototype setup | ✅ | `Object.setPrototypeOf` called |
| Type guard function | ✅ | `isNestedExecutionError` at lines 726-733 |
| Error in ErrorCodes | ✅ | Lines 81-82 |
| Used by validateNestedExecution | ✅ | `execution-guard.ts` |
| Comprehensive tests | ✅ | `execution-guard.test.ts` lines 136-406 |

### Minor Gap Identified

**Missing JSDoc Documentation**:
- `BugfixSessionValidationError` has JSDoc documentation
- `NestedExecutionError` is missing JSDoc
- Recommendation: Add JSDoc to match pattern (see `error-class-patterns.md`)

---

## Confidence Score

**Rating: 10/10** for implementation completeness and correctness

**Rationale**:
- ✅ Error class is fully implemented and follows all patterns
- ✅ Error code follows naming convention
- ✅ Type guard function exists and works correctly
- ✅ Integration with validateNestedExecution is complete
- ✅ Comprehensive test coverage exists
- ✅ All requirements from task definition are met
- ✅ Follows established codebase patterns exactly
- ✅ No implementation work needed - verification only

**Validation**: The existing implementation of `NestedExecutionError` is production-ready and requires no changes. This PRP serves as verification documentation and reference for the error class design and usage.

---

## Implementation Note

**This PRP documents an already-completed implementation.**

The `NestedExecutionError` class was implemented as part of the overall nested execution guard feature. This PRP serves as:
1. **Verification** that the implementation meets all requirements
2. **Documentation** of the error class design and patterns
3. **Reference** for future error class implementations
4. **Validation** that the codebase follows established patterns

No code changes are required - this is a documentation and verification PRP.
