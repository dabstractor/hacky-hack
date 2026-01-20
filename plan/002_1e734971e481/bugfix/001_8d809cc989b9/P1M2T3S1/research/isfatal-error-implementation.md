# isFatalError Implementation Research

## Implementation Location

**File**: `/home/dustin/projects/hacky-hack/src/utils/errors.ts`
**Lines**: 658-703

## Function Signature

```typescript
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false
): boolean
```

## Implementation Logic

```typescript
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

## Fatal Error Classification

### Always Fatal

1. **EnvironmentError** - All instances are fatal
   - Missing environment variables
   - Invalid configuration values
   - Cannot run without these

2. **SessionError** (Conditional) - Only with specific error codes
   - `PIPELINE_SESSION_LOAD_FAILED` - Cannot load existing session
   - `PIPELINE_SESSION_SAVE_FAILED` - Cannot persist session state

3. **ValidationError** (Conditional) - Only for parse_prd operation
   - `PIPELINE_VALIDATION_INVALID_INPUT` + `context.operation === 'parse_prd'`

### Always Non-Fatal

1. **TaskError** - Individual task failures
   - Task execution failures are tracked but don't halt pipeline

2. **AgentError** - LLM/API failures
   - Timeouts, API failures, response parsing issues

3. **ValidationError** (Other operations) - Non-critical validation failures

4. **Unknown Error Types** - Default to non-fatal for safety

## Type Guard Dependencies

The function uses these type guards from the same module:

- `isPipelineError(error: unknown): error is PipelineError`
- `isEnvironmentError(error: unknown): error is EnvironmentError`
- `isSessionError(error: unknown): error is SessionError`
- `isTaskError(error: unknown): error is TaskError`
- `isAgentError(error: unknown): error is AgentError`
- `isValidationError(error: unknown): error is ValidationError`

## PRPPipeline Integration

### Import Statement

```typescript
import {
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  isFatalError,
  ErrorCodes,
} from '../utils/errors.js';
```

### Usage Pattern

```typescript
try {
  // ... operation that may fail ...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check if error is fatal
  if (isFatalError(error, this.#continueOnError)) {
    this.logger.error(
      `[PRPPipeline] Fatal {operation} error: ${errorMessage}`
    );
    throw error; // Re-throw to abort pipeline
  }

  // Non-fatal: track failure and continue
  this.#trackFailure('{operationName}', error, {
    phase: this.currentPhase,
  });
  this.logger.warn(
    `[PRPPipeline] Non-fatal {operation} error, continuing: ${errorMessage}`
  );
}
```

### Usage Locations in PRPPipeline

1. **Session Initialization** (Lines 476-482)
2. **Delta Handling** (Lines 603-609)
3. **PRD Decomposition** (Lines 701-707)
4. **Backlog Execution** (Lines 890-896)
5. **QA Cycle** (Lines 1175-1181)

## Previous Implementation (Private Method)

Before P1.M2.T2.S1, `isFatalError` was a private method in PRPPipeline:

```typescript
#isFatalError(error: unknown): boolean {
  // If --continue-on-error flag is set, treat all errors as non-fatal
  if (this.#continueOnError) {
    this.logger.warn(
      '[PRPPipeline] --continue-on-error enabled: treating error as non-fatal'
    );
    return false;
  }

  // ... rest of the logic was identical ...
}
```

## Refactoring Benefits

1. **Centralized Logic** - Single source of truth for error classification
2. **Testability** - Can test the function independently
3. **Reusability** - Other components can use the same function
4. **Consistency** - Ensures consistent behavior across pipeline

## Unit Tests

**Location**: `/home/dustin/projects/hacky-hack/tests/unit/utils/is-fatal-error.test.ts`

Comprehensive coverage including:
- Fatal error types (SessionError, EnvironmentError, ValidationError)
- Non-fatal error types (TaskError, AgentError)
- continueOnError flag behavior
- Edge cases (null, undefined, strings, objects)
- Type guard integration
- Boundary conditions
