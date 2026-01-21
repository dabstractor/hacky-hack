# Type Guard Usage Patterns Research

**Date:** 2026-01-15
**Research Task:** P1.M1.T1.S3 - Analyze type guard usage patterns in the codebase

## Overview

This document catalogs the actual usage of type guard functions (`isSessionError`, `isTaskError`, `isAgentError`, `isValidationError`, `isPipelineError`) throughout the codebase to understand practical implementation patterns and integration with error handling code.

## Type Guard Functions

### Available Type Guards

All type guards are defined in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
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
```

## Files Using Type Guards

### 1. `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

**Import Statement:**

```typescript
import {
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  ErrorCodes,
} from '../utils/errors.js';
```

**Usage Pattern 1 - Error Classification in Catch Blocks (Lines 392-413):**

```typescript
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
```

**Usage Pattern 2 - Error Categorization (Lines 1424-1435):**

```typescript
for (const failure of failures) {
  if (isTaskError(failure.error)) {
    errorCategories.taskError++;
  } else if (isAgentError(failure.error)) {
    errorCategories.agentError++;
  } else if (isValidationError(failure.error)) {
    errorCategories.validationError++;
  } else if (isSessionError(failure.error)) {
    errorCategories.sessionError++;
  } else {
    errorCategories.other++;
  }
}
```

### 2. `/home/dustin/projects/hacky-hack/src/utils/retry.ts`

**Import Statement:**

```typescript
import {
  isAgentError,
  isValidationError,
  isPipelineError,
  ErrorCodes,
  type PipelineError,
} from './errors.js';
```

**Usage Pattern 1 - Transient Error Detection (Lines 334-346):**

```typescript
if (isPipelineError(err)) {
  const errorCode = err.code;
  // Agent errors are transient if they're timeouts or LLM failures
  return (
    errorCode === ErrorCodes.PIPELINE_AGENT_TIMEOUT ||
    errorCode === ErrorCodes.PIPELINE_AGENT_LLM_FAILED
  );
}

// ValidationError is never retryable (permanent failure)
if (isValidationError(err)) {
  return false;
}
```

**Usage Pattern 2 - Permanent Error Detection (Lines 398-399):**

```typescript
// Check ValidationError from P5.M4.T1.S1
if (isValidationError(err)) {
  return true;
}
```

### 3. `/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts`

**Import Statement:**

```typescript
import {
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  // ... other imports
} from '../../src/utils/errors.js';
```

**Usage Pattern 1 - Type Narrowing Tests (Lines 898-944):**

```typescript
it('should narrow type with isSessionError', () => {
  const error = new SessionError('Test error');

  if (isSessionError(error)) {
    // Type is narrowed to SessionError
    expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
    expect(error.isLoadError()).toBe(true);
  }
});

it('should narrow type with isTaskError', () => {
  const error = new TaskError('Test error');

  if (isTaskError(error)) {
    // Type is narrowed to TaskError
    expect(error.code).toBe(ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED);
  }
});

it('should narrow type with isAgentError', () => {
  const error = new AgentError('Test error');

  if (isAgentError(error)) {
    // Type is narrowed to AgentError
    expect(error.code).toBe(ErrorCodes.PIPELINE_AGENT_LLM_FAILED);
  }
});

it('should narrow type with isValidationError', () => {
  const error = new ValidationError('Test error');

  if (isValidationError(error)) {
    // Type is narrowed to ValidationError
    expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
  }
});

it('should narrow type with isPipelineError', () => {
  const error = new SessionError('Test error');

  if (isPipelineError(error)) {
    // Type is narrowed to PipelineError
    expect(error.code).toBeDefined();
    expect(error.timestamp).toBeDefined();
    expect(error.toJSON).toBeDefined();
  }
});
```

**Usage Pattern 2 - Switch-Style Error Handling (Lines 946-969):**

```typescript
it('should support switch-style error handling', () => {
  const errors: unknown[] = [
    new SessionError('Session error'),
    new TaskError('Task error'),
    new AgentError('Agent error'),
    new ValidationError('Validation error'),
    new Error('Plain error'),
  ];

  let sessionCount = 0;
  let taskCount = 0;
  let agentCount = 0;
  let validationCount = 0;

  for (const error of errors) {
    if (isSessionError(error)) {
      sessionCount++;
    } else if (isTaskError(error)) {
      taskCount++;
    } else if (isAgentError(error)) {
      agentCount++;
    } else if (isValidationError(error)) {
      validationCount++;
    }
  }
});
```

### 4. `/home/dustin/projects/hacky-hack/tests/unit/utils/retry.test.ts`

**Import Statement:**

```typescript
import {
  isValidationError,
  // ... other imports
} from '../../src/utils/errors.js';
```

**Usage Pattern - Type Guard Verification (Lines 307-313):**

```typescript
it('should return true for ValidationError via type guard', () => {
  const error = new ValidationError('Schema validation failed', {
    schema: 'TaskSchema',
  });
  expect(isValidationError(error)).toBe(true);
  expect(isPermanentError(error)).toBe(true);
});
```

## Common Usage Patterns

### Pattern 1: Nested Type Guard Checks

Used when you need to check for a base type first, then narrow to specific subtypes:

```typescript
if (isPipelineError(error)) {
  if (isSessionError(error)) {
    // Handle session-specific logic
    return error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  }
  if (isValidationError(error)) {
    // Handle validation-specific logic
    return error.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
  }
  if (isTaskError(error) || isAgentError(error)) {
    // Handle task/agent-specific logic
    return false;
  }
}
```

### Pattern 2: Sequential if-else Chains

Used when categorizing errors into mutually exclusive buckets:

```typescript
if (isTaskError(failure.error)) {
  errorCategories.taskError++;
} else if (isAgentError(failure.error)) {
  errorCategories.agentError++;
} else if (isValidationError(failure.error)) {
  errorCategories.validationError++;
} else if (isSessionError(failure.error)) {
  errorCategories.sessionError++;
} else {
  errorCategories.other++;
}
```

### Pattern 3: Retry Logic Integration

Used to determine if an error is retryable based on its type:

```typescript
// Check if error is a PipelineError first
if (isPipelineError(err)) {
  const errorCode = err.code;
  // Now we can safely access error.code because type is narrowed
  return (
    errorCode === ErrorCodes.PIPELINE_AGENT_TIMEOUT ||
    errorCode === ErrorCodes.PIPELINE_AGENT_LLM_FAILED
  );
}

// ValidationError is never retryable
if (isValidationError(err)) {
  return false;
}
```

### Pattern 4: Type Narrowing in Conditional Blocks

Used to access type-specific properties after narrowing:

```typescript
if (isSessionError(error)) {
  // error is now narrowed to SessionError
  // Can access SessionError-specific methods
  if (error.isLoadError()) {
    // Handle load error
  }
}

if (isAgentError(error)) {
  // error is now narrowed to AgentError
  // Can access AgentError-specific properties
  if (error.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT) {
    // Retry the operation
  }
}
```

## Key Findings

1. **Type guards are consistently used for type narrowing** - All usages follow TypeScript's type predicate pattern (`error is SpecificError`)

2. **Nested checking is common** - The codebase frequently checks for `isPipelineError` first, then narrows to specific subtypes

3. **Integration with ErrorCodes** - Type guards are often followed by checks on `error.code` to determine specific error conditions

4. **Retry logic depends on type guards** - The retry utility uses type guards to determine if errors are transient or permanent

5. **Error categorization** - Type guards are used to categorize errors for reporting and statistics

6. **No type guard composition** - The codebase doesn't use helper functions like `isRetryableError()` - instead, it directly uses type guards in conditional logic

7. **Import consistency** - All files import type guards from `../utils/errors.js` or `./errors.js`

## Integration Points

### With Error Handling

Type guards are primarily used in:

- Catch blocks for error classification
- Retry logic for determining retryability
- Error reporting and statistics
- Fatal vs non-fatal error determination

### With Type System

Type guards enable:

- Safe access to error type-specific properties (e.g., `error.code`, `error.context`)
- Type-specific method calls (e.g., `error.isLoadError()`)
- Compile-time type checking in conditional blocks

## Summary Table

| File                              | Type Guards Used                                       | Purpose                                                     |
| --------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `src/workflows/prp-pipeline.ts`   | All 5 guards                                           | Error classification, categorization, fatal error detection |
| `src/utils/retry.ts`              | `isPipelineError`, `isAgentError`, `isValidationError` | Transient/permanent error detection                         |
| `tests/unit/utils/errors.test.ts` | All 5 guards                                           | Type narrowing tests, switch-style handling                 |
| `tests/unit/utils/retry.test.ts`  | `isValidationError`                                    | Type guard verification                                     |

## Recommendations

1. **Consider creating composite type guards** - For common patterns like `isRetryableError()` or `isFatalError()`

2. **Document type guard usage patterns** - Add examples to documentation showing common usage patterns

3. **Consistent ordering** - Consider standardizing on checking `isPipelineError` first, then specific subtypes

4. **Type guard utilities** - Consider adding helper functions that combine type guards with common property checks
