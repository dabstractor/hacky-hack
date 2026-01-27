# Validation Patterns and Error Handling Research

**Research Date:** 2026-01-26
**Research Task:** P1M3T2S1 - Validation patterns for validateNestedExecution
**Goal:** Document existing validation patterns and error handling to follow

---

## 1. All Validation Functions Found

### Session Validation (`/src/utils/validation/session-validation.ts`)
- `validateBugfixSession(sessionPath: string): void` - Validates that session path contains 'bugfix'

### Environment Validation (`/src/config/environment.ts`)
- `configureEnvironment(): void` - Maps environment variables
- `validateEnvironment(): void` - Validates required environment variables
- `getModel(tier: ModelTier): string` - Gets model name based on tier

### State Validation (`/src/core/state-validator.ts`)
- `validateSchema(backlog: Backlog): ZodError[]` - Validates backlog using Zod schema
- `validateStatusConsistency(backlog: Backlog): StatusInconsistency[]` - Validates task status consistency
- `validateBacklogState(backlog: Backlog): StateValidationResult` - Complete state validation

---

## 2. Validation Function Signatures and Patterns

### Pattern 1: Void Functions (Most Common)

```typescript
// Simple validation - throws on error, implicit success on valid
export function validateBugfixSession(sessionPath: string): void {
  if (!sessionPath.includes('bugfix')) {
    throw new BugfixSessionValidationError(
      `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${sessionPath}`,
      { sessionPath }
    );
  }
  // No return statement - success is implicit
}

// Accumulate multiple errors before throwing
export function validateEnvironment(): void {
  const missing: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (!process.env.ANTHROPIC_BASE_URL) {
    missing.push('ANTHROPIC_BASE_URL');
  }

  if (missing.length > 0) {
    throw new EnvironmentValidationError(missing);
  }
}
```

### Pattern 2: Functions Returning Results

```typescript
// Returns empty array on success, array of errors on failure
export function validateSchema(backlog: Backlog): ZodError[] {
  try {
    BacklogSchema.parse(backlog);
    return []; // Empty array = valid
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return error as ZodError[];
    }
    return []; // Fallback for unexpected errors
  }

  // Returns array of validation issues
  return inconsistencies; // Empty array = valid
}
```

---

## 3. Error Class Patterns

### Base Error Hierarchy

All errors extend the abstract `PipelineError` class in `/src/utils/errors.ts`:

```typescript
export abstract class PipelineError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: PipelineErrorContext;
  readonly timestamp: Date;
  readonly cause?: Error;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message);
    // Critical: Set prototype for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();

    // Attach context properties directly to error instance
    if (context) {
      Object.assign(this, context);
    }
  }

  toJSON(): Record<string, unknown> {
    // Auto-sanitizes sensitive data for logging
  }
}
```

### Specialized Error Classes

1. **SessionError** - `PIPELINE_SESSION_LOAD_FAILED`
2. **TaskError** - `PIPELINE_TASK_EXECUTION_FAILED`
3. **AgentError** - `PIPELINE_AGENT_LLM_FAILED`
4. **ValidationError** - Dynamic error codes
5. **BugfixSessionValidationError** - `PIPELINE_SESSION_INVALID_BUGFIX_PATH`
6. **EnvironmentError** - `PIPELINE_VALIDATION_INVALID_INPUT`

---

## 4. Error Codes Structure

```typescript
export const ErrorCodes = {
  // Session errors
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  PIPELINE_SESSION_SAVE_FAILED: 'PIPELINE_SESSION_SAVE_FAILED',
  PIPELINE_SESSION_NOT_FOUND: 'PIPELINE_SESSION_NOT_FOUND',
  PIPELINE_SESSION_INVALID_BUGFIX_PATH: 'PIPELINE_SESSION_INVALID_BUGFIX_PATH',

  // Task errors
  PIPELINE_TASK_EXECUTION_FAILED: 'PIPELINE_TASK_EXECUTION_FAILED',
  PIPELINE_TASK_VALIDATION_FAILED: 'PIPELINE_TASK_VALIDATION_FAILED',
  PIPELINE_TASK_NOT_FOUND: 'PIPELINE_TASK_NOT_FOUND',

  // Agent errors
  PIPELINE_AGENT_LLM_FAILED: 'PIPELINE_AGENT_LLM_FAILED',
  PIPELINE_AGENT_TIMEOUT: 'PIPELINE_AGENT_TIMEOUT',
  PIPELINE_AGENT_PARSE_FAILED: 'PIPELINE_AGENT_PARSE_FAILED',

  // Validation errors
  PIPELINE_VALIDATION_INVALID_INPUT: 'PIPELINE_VALIDATION_INVALID_INPUT',
  PIPELINE_VALIDATION_MISSING_FIELD: 'PIPELINE_VALIDATION_MISSING_FIELD',
  PIPELINE_VALIDATION_SCHEMA_FAILED: 'PIPELINE_VALIDATION_SCHEMA_FAILED',
  PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY: 'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY',

  // Resource errors
  PIPELINE_RESOURCE_LIMIT_EXCEEDED: 'PIPELINE_RESOURCE_LIMIT_EXCEEDED',
} as const;
```

---

## 5. Type Guard Patterns

Each error class has a corresponding type guard:

```typescript
export function isPipelineError(error: unknown): error is PipelineError
export function isSessionError(error: unknown): error is SessionError
export function isTaskError(error: unknown): error is TaskError
export function isAgentError(error: unknown): error is AgentError
export function isValidationError(error: unknown): error is ValidationError
export function isEnvironmentError(error: unknown): error is EnvironmentError
export function isBugfixSessionValidationError(error: unknown): error is BugfixSessionValidationError
```

---

## 6. Import/Export Patterns

### Validation Module Pattern

```typescript
// /src/utils/validation/session-validation.ts
import {
  BugfixSessionValidationError,
  isBugfixSessionValidationError,
} from '../errors.js';

// Re-export for convenience
export { BugfixSessionValidationError, isBugfixSessionValidationError };

// Main validation function
export function validateBugfixSession(sessionPath: string): void
```

### Environment Module Pattern

```typescript
// /src/config/environment.ts
import { EnvironmentValidationError } from './types.js';

// Functions
export function configureEnvironment(): void
export function validateEnvironment(): void
export function getModel(tier: ModelTier): string

// Re-export types
export type { ModelTier, EnvironmentConfig } from './types.js';
export { EnvironmentValidationError } from './types.js';
```

---

## 7. File Organization Patterns

```
src/utils/validation/
└── session-validation.ts      # Session path validation

src/config/
├── environment.ts             # Environment validation
├── types.ts                   # Environment validation types
├── constants.ts               # Environment constants
└── index.ts                   # Exports

src/utils/errors.ts            # All error classes and type guards
```

---

## 8. Patterns for void Functions that Throw vs Return Silently

**Void functions that throw (validation):**
- Always return `void`
- Throw errors on validation failure
- Implicit success when function completes without throwing
- Examples: `validateBugfixSession`, `validateEnvironment`

**Functions that return results:**
- Return array of errors/issues on failure
- Return empty array on success
- Example: `validateSchema`, `validateStatusConsistency`

---

## 9. Recommended Pattern for validateNestedExecution

Based on the existing patterns, `validateNestedExecution` should:

1. **Return `void`** - Follow the validation function pattern
2. **Check PRP_PIPELINE_RUNNING environment variable** - See if it's already set
3. **Check SKIP_BUG_FINDING and session path** - Allow legitimate bug fix recursion
4. **Throw a `NestedExecutionError`** - Create a new error class extending `PipelineError`
5. **Include context information** - Existing PID and current PID
6. **Use appropriate error code** - Add `PIPELINE_VALIDATION_NESTED_EXECUTION` to ErrorCodes

### Example Implementation

```typescript
// In /src/utils/execution-guard.ts (NEW FILE)
import { PipelineError, ErrorCodes } from './errors.js';

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

export function isNestedExecutionError(error: unknown): error is NestedExecutionError {
  return error instanceof NestedExecutionError;
}

export function validateNestedExecution(sessionPath: string): void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;

  // If no pipeline is running, allow execution
  if (!existingPid) {
    return;
  }

  // Check if this is legitimate bug fix recursion
  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' &&
    sessionPath.includes('bugfix');

  if (isBugfixRecursion) {
    // Legitimate recursion - allow it
    return;
  }

  // Illegitimate nested execution - throw error
  const currentPid = process.pid.toString();
  throw new NestedExecutionError(
    `Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: ${existingPid}`,
    {
      existingPid,
      currentPid,
      sessionPath,
    }
  );
}

// Re-export error class and type guard
export { NestedExecutionError, isNestedExecutionError };
```

---

## 10. Integration with Existing Code

### In src/utils/errors.ts

Add the error code constant:

```typescript
export const ErrorCodes = {
  // ... existing codes ...
  PIPELINE_VALIDATION_NESTED_EXECUTION: 'PIPELINE_VALIDATION_NESTED_EXECUTION',
} as const;
```

### In src/utils/validation/session-validation.ts

Optionally add validateNestedExecution here OR create separate file:

```typescript
export {
  NestedExecutionError,
  isNestedExecutionError,
  validateNestedExecution,
} from '../execution-guard.js';
```

---

## Summary

The codebase follows consistent patterns:
- **Validation functions** return `void` and throw on error
- **Error classes** extend `PipelineError` with proper prototype chain
- **Type guards** are provided for all error types
- **Context objects** carry debugging information
- **Re-exports** are used for convenience

The `validateNestedExecution` function should follow these exact patterns.
