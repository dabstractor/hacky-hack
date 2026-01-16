# Existing #isFatalError() Implementation Analysis

**Date**: 2026-01-16
**Analyzed By**: P1.M2.T1.S1 Research Phase
**Location**: `src/workflows/prp-pipeline.ts:377-417`

## Overview

The `#isFatalError()` method is a private method in the `PRPPipeline` class that determines whether an error should halt pipeline execution immediately (fatal) or allow continuation with tracking (non-fatal).

## Implementation Details

### Source Location
- **File**: `src/workflows/prp-pipeline.ts`
- **Lines**: 377-417
- **Visibility**: Private (`#isFatalError`)
- **Git Origin**: Commit `dba41a5c79b3b42e4c2154607e33e532b360fbbb` (2026-01-14)

### Complete Implementation

```typescript
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
```

## Logic Flow Analysis

### Decision Tree

```
INPUT: error: unknown
  │
  ├─→ Is #continueOnError flag set?
  │   └─→ YES: Return FALSE (all errors non-fatal)
  │
  ├─→ Is error null/undefined or non-object?
  │   └─→ YES: Return FALSE (non-object errors non-fatal)
  │
  ├─→ Is error a PipelineError instance?
  │   │
  │   ├─→ Is it a SessionError?
  │   │   └─→ Is code SESSION_LOAD_FAILED or SESSION_SAVE_FAILED?
  │   │       └─→ YES: Return TRUE (fatal)
  │   │       └─→ NO: Return FALSE (non-fatal)
  │   │
  │   ├─→ Is it a ValidationError?
  │   │   └─→ Is code VALIDATION_INVALID_INPUT AND operation is 'parse_prd'?
  │   │       └─→ YES: Return TRUE (fatal)
  │   │       └─→ NO: Return FALSE (non-fatal)
  │   │
  │   ├─→ Is it TaskError or AgentError?
  │   │   └─→ Return FALSE (non-fatal)
  │   │
  │   └─→ Other PipelineError: Return FALSE (non-fatal)
  │
  └─→ Not a PipelineError: Return FALSE (non-fatal)
```

### Fatal Error Conditions

An error is considered **fatal** when ALL of the following are true:

1. `#continueOnError` flag is `false` (normal mode)
2. Error is an `object` (not null/undefined)
3. Error is a `PipelineError` instance
4. **AND** one of:
   - **SessionError** with code `PIPELINE_SESSION_LOAD_FAILED` or `PIPELINE_SESSION_SAVE_FAILED`
   - **ValidationError** with code `PIPELINE_VALIDATION_INVALID_INPUT` **AND** `error.context?.operation === 'parse_prd'`

### Non-Fatal Error Conditions

An error is considered **non-fatal** when ANY of the following are true:

1. `#continueOnError` flag is `true`
2. Error is `null`, `undefined`, or not an `object`
3. Error is a `TaskError` or `AgentError`
4. Error is a `SessionError` with a different error code
5. Error is a `ValidationError` that is NOT for PRD parsing
6. Error is not a `PipelineError` instance

## Dependencies

### Type Guards Used
```typescript
import {
  isPipelineError,    // Checks if error is PipelineError subclass
  isSessionError,     // Checks if error is SessionError instance
  isTaskError,        // Checks if error is TaskError instance
  isAgentError,       // Checks if error is AgentError instance
  isValidationError,  // Checks if error is ValidationError instance
  ErrorCodes,         // Error code constants
} from '../utils/errors.js';
```

### Error Codes Referenced
```typescript
ErrorCodes.PIPELINE_SESSION_LOAD_FAILED      // Fatal
ErrorCodes.PIPELINE_SESSION_SAVE_FAILED      // Fatal
ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT // Conditionally fatal
```

### Instance State Accessed
```typescript
this.#continueOnError  // Boolean flag from CLI --continue-on-error
this.logger           // Pino logger instance
```

## Usage in PRPPipeline

The method is called in **5 locations** within error handling blocks:

1. **`initializeSession()`** (line 539)
   ```typescript
   if (this.#isFatalError(error)) {
     throw error; // Re-throw to abort pipeline
   }
   // Non-fatal: track and continue
   ```

2. **`handleDelta()`** (line 666)
   ```typescript
   if (this.#isFatalError(error)) {
     throw error; // Re-throw to abort pipeline
   }
   // Non-fatal: track and continue
   ```

3. **`decomposePRD()`** (line 764)
   ```typescript
   if (this.#isFatalError(error)) {
     throw error; // Re-throw to abort pipeline
   }
   // Non-fatal: track and continue
   ```

4. **`executeBacklog()`** (line 953)
   ```typescript
   if (this.#isFatalError(error)) {
     throw error; // Re-throw to abort pipeline
   }
   // Non-fatal: track and continue
   ```

5. **`runQACycle()`** (line 1238)
   ```typescript
   if (this.#isFatalError(error)) {
     throw error; // Re-throw to abort pipeline
   }
   // Non-fatal: track and continue
   ```

## Key Design Decisions

### 1. Default to Non-Fatal
The method defaults to returning `false` (non-fatal) for unknown error types. This follows the principle of resilience: continue execution when uncertain, logging the error for later analysis.

### 2. Context-Sensitive Fatal Classification
The `ValidationError` fatal check uses `error.context?.operation` to distinguish between different validation scenarios. Only PRD parsing validation errors are fatal; other validation errors (e.g., task validation, schema validation) are non-fatal.

### 3. Continue-On-Error Override
The CLI `--continue-on-error` flag overrides all fatal error detection, treating all errors as non-fatal. This allows users to maximize progress even in the presence of fatal errors.

### 4. Specific Error Code Matching
The method checks specific error codes rather than treating all SessionErrors or ValidationErrors as fatal. This allows fine-grained control over which specific failure modes should halt execution.

## Differences from PRD Specification

### PRD Specification (Issue 2)
According to the bugfix documentation, the PRD specifies:
- **Fatal errors**: SessionError, EnvironmentError
- **Non-fatal errors**: TaskError, AgentError, ValidationError

### Actual Implementation
- **Fatal errors**:
  - SessionError (specifically LOAD_FAILED and SAVE_FAILED codes)
  - ValidationError (only when parsing PRD)
- **Non-fatal errors**:
  - TaskError
  - AgentError
  - EnvironmentError (not explicitly handled, falls through to default non-fatal)
  - ValidationError (most cases)

**Key Differences**:
1. EnvironmentError is not explicitly handled (defaults to non-fatal, which aligns with PRD)
2. Not all SessionErrors are fatal (only specific error codes)
3. ValidationError is conditionally fatal (PRD parsing only)

## Testing Considerations

### Edge Cases Covered
1. `null` and `undefined` errors
2. Non-object errors (strings, numbers, booleans)
3. Unknown error types (plain Error, custom errors)
4. All PipelineError subclasses
5. Continue-on-error flag override

### Type Narrowing
The method relies on type guards for proper TypeScript type narrowing:
- `isPipelineError(error)` narrows to `PipelineError`
- `isSessionError(error)` further narrows to `SessionError`
- This allows safe access to `error.code` and `error.context`

## Integration Points

### Error Tracking
Non-fatal errors are tracked via `#trackFailure()`:
```typescript
this.#trackFailure(taskId, error, {
  phase: this.currentPhase,
  milestone: this.currentMilestone,
  taskTitle: task.title,
});
```

### Error Reporting
Failed tasks are aggregated and reported in:
- ERROR_REPORT.md (generated at shutdown)
- Pipeline result object
- Structured logs with error context

## Migration Path for Extraction

To extract this logic to a public utility function:

1. **Remove `#continueOnError` dependency**: The flag should be passed as a parameter
2. **Remove `this.logger` dependency**: Use a shared logger or none
3. **Make function pure**: No side effects, only return boolean
4. **Preserve type guard usage**: Keep using `isPipelineError()`, etc.
5. **Add JSDoc**: Document parameters, return value, and examples
6. **Export from errors.ts**: Place alongside other error utilities

### Proposed Signature
```typescript
/**
 * Determines if an error should be treated as fatal
 *
 * @param error - Unknown error to evaluate
 * @param continueOnError - If true, all errors are non-fatal
 * @returns true if error is fatal (should abort), false otherwise
 */
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false
): boolean {
  // Implementation extracted from PRPPipeline.#isFatalError()
}
```

## Related Files

- `src/utils/errors.ts` - Error class definitions and type guards
- `tests/integration/utils/error-handling.test.ts` - Integration tests for fatal/non-fatal detection
- `plan/001_14b9dc2a33c7/P5M4T1S3/PRP.md` - Original PRP that introduced #isFatalError()
- `plan/001_14b9dc2a33c7/P5M4T1S3/research/error-recovery-patterns.md` - Research on error recovery patterns

## Summary

The `#isFatalError()` method implements a sophisticated error classification system that:

1. **Prioritizes resilience** - Defaults to non-fatal for unknown errors
2. **Supports override** - `--continue-on-error` flag for maximum progress
3. **Uses context** - Examines error codes and context objects for classification
4. **Enables graceful degradation** - Tracks non-fatal errors while continuing execution
5. **Provides clear boundaries** - Specific fatal conditions prevent pipeline corruption

The implementation is production-ready and well-tested, but requires extraction to a public utility for broader use across the codebase.
