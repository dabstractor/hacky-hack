# isFatalError Behavior Specification

**Specification Date**: 2026-01-16
**Version**: 1.0
**Source**: Architecture documentation and existing implementation analysis

---

## Overview

This document provides a complete specification of the `isFatalError()` function behavior. It defines exactly how the function should classify errors as fatal or non-fatal, including all decision logic, edge cases, and special conditions.

---

## Function Signature

```typescript
/**
 * Determines if an error should halt pipeline execution immediately (fatal) or allow continuation (non-fatal).
 *
 * @param error - The error to evaluate (can be any type)
 * @param continueOnError - If true, all errors are treated as non-fatal (overrides all other logic)
 * @returns true if error is fatal (should halt execution), false if non-fatal (should continue)
 */
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false
): boolean
```

---

## Decision Tree

```
INPUT: error: unknown, continueOnError: boolean = false
  │
  ├─→ Is continueOnError === true?
  │   └─→ YES: Return FALSE (all errors non-fatal when flag is set)
  │
  ├─→ Is error null, undefined, or not an object?
  │   └─→ YES: Return FALSE (non-object errors are non-fatal)
  │
  ├─→ Is error a PipelineError instance (via isPipelineError)?
  │   │
  │   ├─→ Is it a SessionError?
  │   │   └─→ Is error.code one of:
  │   │       - PIPELINE_SESSION_LOAD_FAILED?
  │   │       - PIPELINE_SESSION_SAVE_FAILED?
  │   │       └─→ YES: Return TRUE (fatal)
  │   │       └─→ NO: Return FALSE (non-fatal)
  │   │
  │   ├─→ Is it an EnvironmentError?
  │   │   └─→ Return TRUE (fatal for any EnvironmentError)
  │   │
  │   ├─→ Is it a ValidationError?
  │   │   └─→ Is error.code === PIPELINE_VALIDATION_INVALID_INPUT
  │   │       AND error.context?.operation === 'parse_prd'?
  │   │       └─→ YES: Return TRUE (fatal)
  │   │       └─→ NO: Return FALSE (non-fatal)
  │   │
  │   ├─→ Is it a TaskError or AgentError?
  │   │   └─→ Return FALSE (non-fatal)
  │   │
  │   └─→ Other PipelineError: Return FALSE (non-fatal)
  │
  └─→ Not a PipelineError: Return FALSE (non-fatal)
```

---

## Fatal Error Conditions (Return TRUE)

An error is considered **fatal ONLY** when **ALL** of the following conditions are met:

1. `continueOnError` is `false` (normal mode, not CLI override)
2. Error is an `object` (not null/undefined)
3. Error is a `PipelineError` instance (verified by `isPipelineError()`)
4. **AND** one of the following specific conditions:

### 1. SessionError with Specific Error Codes

**Conditions:**
- Error is `instanceof SessionError`
- Error code is `PIPELINE_SESSION_LOAD_FAILED` OR `PIPELINE_SESSION_SAVE_FAILED`

**Examples:**
```typescript
// Fatal: Session load failure
new SessionError('Failed to load session', {
  sessionPath: '/path/to/session'
})

// Fatal: Session save failure
new SessionError('Failed to save session', {
  sessionPath: '/path/to/session'
})
```

**Error Codes:**
- `ErrorCodes.PIPELINE_SESSION_LOAD_FAILED` = `'PIPELINE_SESSION_LOAD_FAILED'`
- `ErrorCodes.PIPELINE_SESSION_SAVE_FAILED` = `'PIPELINE_SESSION_SAVE_FAILED'`

### 2. EnvironmentError (Any Instance)

**Conditions:**
- Error is `instanceof EnvironmentError`
- Any error code (EnvironmentError instances are always fatal)

**Examples:**
```typescript
// Fatal: Missing environment variable
new EnvironmentError('Missing API_KEY', {
  variable: 'API_KEY'
})

// Fatal: Invalid configuration
new EnvironmentError('Invalid config file', {
  variable: 'CONFIG_FILE',
  value: '/invalid/path'
})

// Fatal: Environment not set up
new EnvironmentError('Environment not initialized')
```

**Rationale:** Environment errors prevent the pipeline from executing properly and cannot be recovered from.

### 3. ValidationError with parse_prd Operation

**Conditions:**
- Error is `instanceof ValidationError`
- Error code is `PIPELINE_VALIDATION_INVALID_INPUT`
- Error context has `operation` property equal to `'parse_prd'`

**Examples:**
```typescript
// Fatal: PRD parsing validation error
new ValidationError('Invalid PRD format', {
  operation: 'parse_prd',
  invalidInput: 'malformed-prd'
})

// Fatal: PRD validation failed
new ValidationError('PRD schema validation failed', {
  code: ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT,
  operation: 'parse_prd',
  errors: ['Missing required field']
})
```

**Rationale:** PRD parsing errors are fundamental - if the PRD cannot be parsed, the entire pipeline cannot proceed.

---

## Non-Fatal Error Conditions (Return FALSE)

An error is considered **non-fatal** when **ANY** of the following conditions is true:

### 1. continueOnError Flag is True

**Condition:** `continueOnError === true`

**Examples:**
```typescript
// Non-fatal due to flag override
const error = new SessionError('Session load failed');
isFatalError(error, true)  // Returns: false (overrides fatal behavior)
```

**Rationale:** CLI flag `--continue-on-error` allows users to override fatal error detection and attempt to continue despite any errors.

### 2. Null/Undefined/Non-Object Errors

**Conditions:**
- Error is `null`
- Error is `undefined`
- Error is a primitive type (string, number, boolean, etc.)

**Examples:**
```typescript
isFatalError(null)              // Returns: false
isFatalError(undefined)         // Returns: false
isFatalError('string error')    // Returns: false
isFatalError(123)               // Returns: false
isFatalError(true)              // Returns: false
```

**Rationale:** Unknown or invalid error types default to non-fatal for resilience.

### 3. TaskError (Any Instance)

**Condition:** Error is `instanceof TaskError`

**Examples:**
```typescript
// Non-fatal: Task execution failed
new TaskError('Task execution failed', {
  taskId: 'P1.M1.T1'
})

// Non-fatal: Task validation failed
new TaskError('Task validation failed', {
  taskId: 'P1.M1.T1.S1',
  errors: ['Invalid scope']
})
```

**Rationale:** Individual task failures should not halt the entire pipeline. Other tasks may still succeed.

### 4. AgentError (Any Instance)

**Condition:** Error is `instanceof AgentError`

**Examples:**
```typescript
// Non-fatal: LLM call failed
new AgentError('LLM call failed', {
  taskId: 'P1.M1.T1'
})

// Non-fatal: Agent timeout
new AgentError('Agent timeout', {
  taskId: 'P1.M1.T1',
  timeout: 30000
})
```

**Rationale:** Agent errors (LLM failures, timeouts, etc.) are transient and can be retried.

### 5. ValidationError (Non-parse_prd Operations)

**Conditions:**
- Error is `instanceof ValidationError`
- Error context `operation` is NOT `'parse_prd'`
- OR error context has no `operation` property

**Examples:**
```typescript
// Non-fatal: Scope validation error
new ValidationError('Invalid scope format', {
  operation: 'resolve_scope'
})

// Non-fatal: Validation error without operation
new ValidationError('Validation failed')

// Non-fatal: PRD validation (not parsing)
new ValidationError('PRD validation failed', {
  operation: 'validate_prd'
})
```

**Rationale:** Validation errors for specific operations are recoverable - the error can be fixed and retried.

### 6. SessionError (Non-Fatal Codes)

**Condition:** Error is `instanceof SessionError` BUT has a different error code

**Note:** In the current implementation, all `SessionError` instances default to `PIPELINE_SESSION_LOAD_FAILED` code, so this case may not occur in practice. However, the logic allows for non-fatal SessionError codes if they were to be added.

**Examples:**
```typescript
// Hypothetical: Session not found (if code existed)
new SessionError('Session not found', {
  code: 'PIPELINE_SESSION_NOT_FOUND'  // Would be non-fatal
})
```

### 7. Standard Error (Not PipelineError)

**Condition:** Error is a standard JavaScript `Error` or built-in error type, but not a `PipelineError` instance.

**Examples:**
```typescript
// Non-fatal: Standard Error
new Error('Something went wrong')

// Non-fatal: TypeError
new TypeError('Property is not a function')

// Non-fatal: ReferenceError
new ReferenceError('Variable is not defined')

// Non-fatal: SyntaxError
new SyntaxError('Unexpected token')

// Non-fatal: RangeError
new RangeError('Invalid array length')

// Non-fatal: URIError
new URIError('Malformed URI')
```

**Rationale:** Standard errors are not part of the pipeline error hierarchy and default to non-fatal for resilience.

---

## Dependencies

### Type Guards Used

The function uses these type guards from `src/utils/errors.ts`:

```typescript
// Primary type guard - checks if error is any PipelineError subclass
isPipelineError(error: unknown): error is PipelineError

// Narrow type guards - check for specific error types
isSessionError(error: unknown): error is SessionError
isTaskError(error: unknown): error is TaskError
isAgentError(error: unknown): error is AgentError
isValidationError(error: unknown): error is ValidationError
isEnvironmentError(error: unknown): error is EnvironmentError
```

### Error Codes Referenced

```typescript
// Session error codes
ErrorCodes.PIPELINE_SESSION_LOAD_FAILED  // Fatal
ErrorCodes.PIPELINE_SESSION_SAVE_FAILED  // Fatal
ErrorCodes.PIPELINE_SESSION_NOT_FOUND    // Non-fatal (if used)

// Validation error codes
ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT  // Fatal when operation='parse_prd'
ErrorCodes.PIPELINE_VALIDATION_MISSING_FIELD  // Non-fatal
ErrorCodes.PIPELINE_VALIDATION_SCHEMA_FAILED  // Non-fatal
```

---

## Special Cases and Edge Conditions

### 1. Optional Context Property

**Pattern:** Always use optional chaining for `error.context?.operation`

```typescript
// CORRECT: Handle undefined context
if (error.context?.operation === 'parse_prd') {
  // Safe access
}

// WRONG: May throw if context is undefined
if (error.context.operation === 'parse_prd') {
  // Unsafe - may throw TypeError
}
```

### 2. Default Parameter for continueOnError

**Pattern:** Default to `false` to preserve existing behavior

```typescript
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false  // Default: false (normal mode)
): boolean {
  // Implementation...
}
```

### 3. Type Guard Type Narrowing

**Pattern:** Type guards narrow the type within conditional blocks

```typescript
if (isSessionError(error)) {
  // error is narrowed to SessionError type
  // Can access SessionError-specific properties safely
  expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
  expect(error.isLoadError()).toBe(true);
}
```

### 4. Circular References in Context

**Pattern:** Handle circular references gracefully (no errors thrown)

```typescript
const context: Record<string, unknown> = { name: 'test' };
context.self = context;  // Circular reference
const error = new SessionError('Circular context', context);
// Should not throw when evaluating isFatalError(error)
```

### 5. Missing Properties

**Pattern:** Handle missing optional properties gracefully

```typescript
// Missing context property
const error = new SessionError('No context');
// error.context is undefined - handle gracefully

// Missing operation in context
const error = new ValidationError('No operation', {});
// error.context?.operation is undefined - not equal to 'parse_prd'
```

---

## Integration with Pipeline Behavior

### CLI Flag: --continue-on-error

**Source:** `src/cli/index.ts` and `src/workflows/prp-pipeline.ts`

**Behavior:**
- When `--continue-on-error` flag is set, `continueOnError` parameter is `true`
- All errors become non-fatal (return `false`)
- Pipeline attempts to continue despite any errors
- Errors are still tracked and reported in ERROR_REPORT.md

**Usage Example:**
```bash
# Normal mode (default): Fatal errors halt execution
npm run pipeline -- --prd-path ./PRD.md

# Continue mode: All errors are non-fatal
npm run pipeline -- --prd-path ./PRD.md --continue-on-error
```

### Error Tracking

**Source:** `src/workflows/prp-pipeline.ts` (lines 377-417, `#trackFailure` method)

**Behavior:**
- All fatal and non-fatal errors are tracked
- Fatal errors halt pipeline immediately
- Non-fatal errors are logged and tracked but don't halt execution
- ERROR_REPORT.md is generated at pipeline shutdown if any failures occurred

---

## Test Scenarios by Category

### Fatal Error Scenarios (50+ tests)

| Category | Test Count | Key Variations |
|----------|------------|----------------|
| SessionError (LOAD_FAILED) | 15 | Different messages, contexts, with/without cause |
| SessionError (SAVE_FAILED) | 15 | Different messages, contexts, with/without cause |
| EnvironmentError | 20 | Different context properties, messages, codes |
| ValidationError (parse_prd) | 20 | Different contexts, with/without cause |

### Non-Fatal Error Scenarios (80+ tests)

| Category | Test Count | Key Variations |
|----------|------------|----------------|
| TaskError | 15 | Different taskIds, error codes, contexts |
| AgentError | 15 | Different taskIds, error codes, timeouts |
| ValidationError (non-parse_prd) | 20 | Different operations, no operation, different codes |
| SessionError (non-fatal codes) | 10 | If any non-fatal codes exist |
| Other PipelineError | 10 | Base PipelineError instances |
| Standard Error types | 10 | Error, TypeError, ReferenceError, etc. |

### Null/Undefined/Invalid Scenarios (20+ tests)

| Category | Test Count | Key Variations |
|----------|------------|----------------|
| Null/Undefined | 4 | null, undefined, explicit values |
| Primitive types | 8 | String, number, boolean, bigint, symbol |
| Object/Array | 8 | Empty object, object with props, arrays, functions |

### Type Guard Integration (15+ tests)

| Category | Test Count | Key Variations |
|----------|------------|----------------|
| isPipelineError | 3 | Before isFatalError, combined checks |
| isSessionError | 3 | Type narrowing with isFatalError |
| isTaskError | 3 | Type narrowing with isFatalError |
| isAgentError | 3 | Type narrowing with isFatalError |
| isValidationError | 3 | Type narrowing with isFatalError |

### continueOnError Flag (15+ tests)

| Category | Test Count | Key Variations |
|----------|------------|----------------|
| Flag=true (all error types) | 8 | SessionError, EnvironmentError, etc. with flag=true |
| Flag=false (explicit) | 7 | Normal behavior when flag=false explicitly |

### Edge Cases (20+ tests)

| Category | Test Count | Key Variations |
|----------|------------|----------------|
| Message edge cases | 5 | Empty, very long, special chars, unicode |
| Context edge cases | 5 | Missing, empty, null values, circular refs |
| Error properties | 5 | No message, no stack, modified prototype |
| Nested errors | 5 | Cause chains, wrapped errors |

---

## Validation Checklist

When implementing tests for `isFatalError`, ensure:

- [ ] All fatal error types are tested (SessionError, EnvironmentError, parse_prd ValidationError)
- [ ] All non-fatal error types are tested (TaskError, AgentError, other ValidationError, standard errors)
- [ ] Null/undefined/invalid inputs are tested
- [ ] continueOnError flag behavior is tested (both true and false)
- [ ] Type guard integration is tested
- [ ] Edge cases and boundary conditions are tested
- [ ] Optional chaining is used for context property access
- [ ] Error code constants are used (not string literals)
- [ ] SEV (Setup-Execute-Verify) pattern is followed
- [ ] Test descriptions use "should" prefix
- [ ] All tests fail initially (red phase)

---

## References

- **Architecture Documentation:** `/plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md`
- **Source Implementation:** `/src/workflows/prp-pipeline.ts` (lines 377-417)
- **Error Classes:** `/src/utils/errors.ts`
- **Integration Tests:** `/tests/integration/utils/error-handling.test.ts`

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Related PRP**: P1.M2.T1.S2
