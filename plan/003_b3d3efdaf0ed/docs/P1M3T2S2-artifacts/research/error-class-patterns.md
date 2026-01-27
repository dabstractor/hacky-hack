# Error Class Patterns Research

## Pattern from BugfixSessionValidationError

### Location: src/utils/errors.ts lines 496-504

```typescript
export class BugfixSessionValidationError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    // CRITICAL: Must set prototype for this class explicitly
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
  }
}
```

### Key Pattern Elements

1. **Extends PipelineError** (abstract base class)
2. **Readonly code property** set to ErrorCodes constant
3. **Constructor signature**: `(message: string, context?, cause?)`
4. **Calls super()** with all parameters
5. **Sets prototype** for instanceof checks
6. **No additional methods** (inherits from PipelineError)

## Pattern from NestedExecutionError (Current Implementation)

### Location: src/utils/errors.ts lines 523-539

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
    // CRITICAL: Must set prototype for this class explicitly
    Object.setPrototypeOf(this, NestedExecutionError.prototype);
  }
}
```

### Key Differences

1. **Extended context interface** - Uses intersection type to add typed properties
2. **More specific context** - Defines exactly what context properties are relevant
3. **Same base pattern** - Follows BugfixSessionValidationError structure

## Pattern from SessionError

### Location: src/utils/errors.ts lines 365-383

```typescript
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
```

### Additional Feature: Custom Methods

Some error classes add custom methods (like `isLoadError()`).

## Error Code Pattern

### All Error Codes (lines 58-86)

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
  PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY:
    'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY',
  PIPELINE_VALIDATION_NESTED_EXECUTION:
    'PIPELINE_VALIDATION_NESTED_EXECUTION',

  // Resource errors
  PIPELINE_RESOURCE_LIMIT_EXCEEDED: 'PIPELINE_RESOURCE_LIMIT_EXCEEDED',
} as const;
```

### Naming Convention

**Pattern**: `PIPELINE_{DOMAIN}_{CATEGORY}_{SPECIFIC}`

Examples:
- `PIPELINE_SESSION_LOAD_FAILED` - Domain: SESSION, Category: LOAD, Specific: FAILED
- `PIPELINE_VALIDATION_NESTED_EXECUTION` - Domain: VALIDATION, Category: NESTED, Specific: EXECUTION

## Type Guard Pattern

### All Type Guards (lines 589-819)

```typescript
export function isNestedExecutionError(
  error: unknown
): error is NestedExecutionError {
  return error instanceof NestedExecutionError;
}
```

### Pattern Elements

1. **Function name**: `is{ErrorName}()` (camelCase)
2. **Parameter**: `error: unknown` (accepts anything)
3. **Return type**: `error is {ErrorType}` (type predicate)
4. **Body**: `return error instanceof {ErrorType}` (simple instanceof check)
5. **Export**: Always exported alongside error class

## Constructor Context Pattern

### Standard Context (PipelineErrorContext)

```typescript
export interface PipelineErrorContext extends Record<string, unknown> {
  sessionPath?: string;
  taskId?: string;
  operation?: string;
  cause?: string;
  [key: string]: unknown;
}
```

### Extended Context Pattern (NestedExecutionError)

```typescript
context?: PipelineErrorContext & {
  existingPid?: string;
  currentPid?: string;
  sessionPath?: string;
}
```

This adds **type safety** for context properties specific to this error.

## Test Pattern for Error Classes

### From tests/unit/utils/errors.test.ts

```typescript
describe('NestedExecutionError class', () => {
  it('should create error with correct properties', () => {
    const context = {
      existingPid: '12345',
      currentPid: '67890',
      sessionPath: '/test/path'
    };
    const error = new NestedExecutionError('Test message', context);

    // instanceof checks (prototype chain)
    expect(error instanceof NestedExecutionError).toBe(true);
    expect(error instanceof PipelineError).toBe(true);
    expect(error instanceof Error).toBe(true);

    // error code
    expect(error.code).toBe('PIPELINE_VALIDATION_NESTED_EXECUTION');

    // error name
    expect(error.name).toBe('NestedExecutionError');

    // error message
    expect(error.message).toBe('Test message');

    // context properties
    expect(error.existingPid).toBe('12345');
    expect(error.currentPid).toBe('67890');
    expect(error.sessionPath).toBe('/test/path');

    // inherited properties
    expect(error.timestamp).toBeDefined();
  });

  it('should serialize to JSON correctly', () => {
    const error = new NestedExecutionError('Test', { existingPid: '12345' });
    const json = error.toJSON();

    expect(json.name).toBe('NestedExecutionError');
    expect(json.code).toBe('PIPELINE_VALIDATION_NESTED_EXECUTION');
    expect(json.message).toBe('Test');
    expect(json.timestamp).toBeDefined();
  });

  it('should work with type guard', () => {
    const error = new NestedExecutionError('Test');

    if (isNestedExecutionError(error)) {
      // TypeScript knows error is NestedExecutionError here
      expect(error.code).toBe('PIPELINE_VALIDATION_NESTED_EXECUTION');
    }
  });
});
```

## Critical Implementation Details

### 1. Prototype Chain Setup

**CRITICAL**: Must set prototype in constructor:

```typescript
Object.setPrototypeOf(this, NestedExecutionError.prototype);
```

**Why**: Without this, `instanceof` checks fail in transpiled ES5 code.

**Test**: Always test prototype chain in unit tests.

### 2. Readonly Code Property

```typescript
readonly code = ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION;
```

**Why**: `readonly` prevents accidental modification, ensures consistency.

### 3. Context Assignment

**Pattern 1**: Standard context (BugfixSessionValidationError)
```typescript
context?: PipelineErrorContext
```

**Pattern 2**: Extended context with type safety (NestedExecutionError)
```typescript
context?: PipelineErrorContext & {
  existingPid?: string;
  currentPid?: string;
  sessionPath?: string;
}
```

**Use Pattern 2 when**:
- Error has specific context properties
- You want type safety for those properties
- Properties are always the same type

### 4. Error Chaining

```typescript
cause?: Error
```

**Usage**:
```typescript
try {
  riskyOperation();
} catch (originalError) {
  throw new NestedExecutionError(
    'Nested execution detected',
    { sessionPath: '/path' },
    originalError  // <-- cause
  );
}
```

## Summary

The codebase follows a **consistent, well-tested pattern** for custom error classes:

1. **Extend PipelineError** (abstract base)
2. **Set readonly code property**
3. **Constructor: (message, context?, cause?)**
4. **Call super()** with all parameters
5. **Set prototype** for instanceof checks
6. **Export type guard** function
7. **Add JSDoc** documentation (missing in NestedExecutionError)

**NestedExecutionError follows this pattern perfectly**, with the addition of:
- Extended context interface for type safety
- Specific context properties for debugging

**Only gap**: Missing JSDoc documentation (present in BugfixSessionValidationError).
