# Type Guard Test Patterns Research

## Overview

This document analyzes the existing type guard test patterns used in the hacky-hack codebase for error handling. The patterns demonstrate comprehensive testing of type guard functions including type narrowing, edge cases, and integration scenarios.

## Test File Locations

1. **Primary Test File**: `/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts`
   - Tests for base error classes and type guards
   - Lines 763-891: Type guard function tests
   - Lines 894-995: Type narrowing tests

2. **EnvironmentError Test File**: `/home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts`
   - Tests for EnvironmentError and isEnvironmentError type guard
   - Lines 362-423: Type guard tests
   - Latest implementation following established patterns

## Type Guard Functions Tested

The codebase tests the following type guard functions:

1. **isPipelineError(error: unknown): error is PipelineError**
   - Location: `/home/dustin/projects/hacky-hack/src/utils/errors.ts:515-517`
   - Tests: lines 764-790 in errors.test.ts

2. **isSessionError(error: unknown): error is SessionError**
   - Location: `/home/dustin/projects/hacky-hack/src/utils/errors.ts:536-538`
   - Tests: lines 792-815 in errors.test.ts

3. **isTaskError(error: unknown): error is TaskError**
   - Location: `/home/dustin/projects/hacky-hack/src/utils/errors.ts:547-549`
   - Tests: lines 817-840 in errors.test.ts

4. **isAgentError(error: unknown): error is AgentError**
   - Location: `/home/dustin/projects/hacky-hack/src/utils/errors.ts:568-570`
   - Tests: lines 842-865 in errors.test.ts

5. **isValidationError(error: unknown): error is ValidationError**
   - Location: `/home/dustin/projects/hacky-hack/src/utils/errors.ts:579-581`
   - Tests: lines 867-890 in errors.test.ts

6. **isEnvironmentError(error: unknown): error is EnvironmentError**
   - Location: `/home/dustin/projects/hacky-hack/src/utils/errors.ts` (not shown in snippet)
   - Tests: lines 362-423 in errors-environment.test.ts

## Test Pattern Structure

### 1. Basic Type Guard Test Pattern

Each type guard follows a consistent three-phase test structure:

#### Phase 1: Positive Case Test
```typescript
describe('isSessionError', () => {
  it('should return true for SessionError instances', () => {
    const error = new SessionError('Test');
    expect(isSessionError(error)).toBe(true);
  });
});
```

**Pattern**: Create instance of the specific error type, assert type guard returns `true`.

#### Phase 2: Negative Case Tests
```typescript
it('should return false for other error types', () => {
  const taskError = new TaskError('Test');
  const agentError = new AgentError('Test');
  const validationError = new ValidationError('Test');
  const plainError = new Error('Test');

  expect(isSessionError(taskError)).toBe(false);
  expect(isSessionError(agentError)).toBe(false);
  expect(isSessionError(validationError)).toBe(false);
  expect(isSessionError(plainError)).toBe(false);
});
```

**Pattern**: Test against all other error types in the hierarchy to ensure specificity.

#### Phase 3: Non-Error Type Tests
```typescript
it('should return false for non-errors', () => {
  expect(isSessionError(null)).toBe(false);
  expect(isSessionError(undefined)).toBe(false);
  expect(isSessionError('string')).toBe(false);
});
```

**Pattern**: Test against primitive types and edge cases (null, undefined, strings, numbers, objects, arrays).

### 2. Type Narrowing Test Pattern

Tests verify that TypeScript correctly narrows types when type guards are used:

```typescript
describe('Type narrowing with type guards', () => {
  it('should narrow type with isSessionError', () => {
    const error = new SessionError('Test error');

    if (isSessionError(error)) {
      // Type is narrowed to SessionError
      expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
      expect(error.isLoadError()).toBe(true);
    }
  });
});
```

**Key Assertions**:
- Access to subclass-specific properties (e.g., `error.isLoadError()`)
- Access to error codes specific to the narrowed type
- Verification that TypeScript allows these accesses without type errors

### 3. Switch-Style Error Handling Pattern

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

  expect(sessionCount).toBe(1);
  expect(taskCount).toBe(1);
  expect(agentCount).toBe(1);
  expect(validationCount).toBe(1);
});
```

**Pattern**: Test that type guards work correctly in control flow scenarios with mixed error types.

### 4. Try-Catch Integration Pattern

```typescript
it('should support try-catch with type guard', () => {
  try {
    throw new TaskError('Task execution failed', {
      taskId: 'P1.M1.T1',
      attempt: 3,
    });
  } catch (error) {
    if (isTaskError(error)) {
      expect(error.message).toBe('Task execution failed');
      expect(error.context?.taskId).toBe('P1.M1.T1');
      expect(error.context?.attempt).toBe(3);
    } else {
      throw new Error('Expected TaskError');
    }
  }
});
```

**Pattern**: Verify type guards work in real-world error handling scenarios.

## Assertions Made to Verify Type Guard Functionality

### 1. Boolean Return Value
```typescript
expect(isSessionError(error)).toBe(true);
expect(isSessionError(taskError)).toBe(false);
```

### 2. Type-Specific Property Access
```typescript
if (isSessionError(error)) {
  expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
  expect(error.isLoadError()).toBe(true);
}
```

### 3. Instanceof Compatibility
```typescript
expect(error instanceof SessionError).toBe(true);
expect(error instanceof PipelineError).toBe(true);
expect(error instanceof Error).toBe(true);
```

### 4. Error Code Verification
```typescript
expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
```

### 5. Context Object Access
```typescript
expect(error.context?.taskId).toBe('P1.M1.T1');
expect(error.context?.attempt).toBe(3);
```

## Type Narrowing Testing/Verification

### 1. Property Access After Narrowing
```typescript
if (isAgentError(error)) {
  // Type is narrowed to AgentError
  expect(error.code).toBe(ErrorCodes.PIPELINE_AGENT_LLM_FAILED);
}
```

### 2. Method Access After Narrowing
```typescript
if (isSessionError(error)) {
  // Type is narrowed to SessionError
  expect(error.isLoadError()).toBe(true);
}
```

### 3. Base Class Property Access
```typescript
if (isPipelineError(error)) {
  // Type is narrowed to PipelineError
  expect(error.code).toBeDefined();
  expect(error.timestamp).toBeDefined();
  expect(error.toJSON).toBeDefined();
}
```

### 4. Conditional Branching
```typescript
if (isTaskError(error)) {
  if (error.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT) {
    // Would retry on timeout
    expect(true).toBe(false); // This should not execute
  } else {
    // Not a timeout error - this is the expected path
    expect(error.code).toBe(ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED);
  }
}
```

## Edge Cases Covered

### 1. Null and Undefined
```typescript
expect(isSessionError(null)).toBe(false);
expect(isSessionError(undefined)).toBe(false);
```

### 2. Primitive Types
```typescript
expect(isSessionError('string')).toBe(false);
expect(isSessionError(123)).toBe(false);
expect(isSessionError(true)).toBe(false);
```

### 3. Object and Array Types
```typescript
expect(isSessionError({})).toBe(false);
expect(isSessionError([])).toBe(false);
```

### 4. Plain Error Objects
```typescript
const plainError = new Error('Test');
expect(isSessionError(plainError)).toBe(false);
```

### 5. Cross-Type Discrimination
```typescript
const taskError = new TaskError('Test');
const agentError = new AgentError('Test');
const validationError = new ValidationError('Test');

expect(isSessionError(taskError)).toBe(false);
expect(isSessionError(agentError)).toBe(false);
expect(isSessionError(validationError)).toBe(false);
```

### 6. Empty and Special Cases (EnvironmentError)
```typescript
it('should handle empty message', () => {
  const error = new EnvironmentError('');
  expect(error.message).toBe('');
});

it('should handle undefined context', () => {
  const error = new EnvironmentError('Test error');
  expect(error.context).toBeUndefined();
});

it('should handle null context', () => {
  const error = new EnvironmentError('Test error', null as any);
  expect(error.context).toBeNull();
});
```

### 7. Special Characters and Unicode
```typescript
it('should handle special characters in message', () => {
  const specialMessage = 'Error: API_KEY is missing! @#$%^&*()';
  const error = new EnvironmentError(specialMessage);
  expect(error.message).toBe(specialMessage);
});

it('should handle unicode characters in message', () => {
  const unicodeMessage = 'Environment variable 環境 is missing';
  const error = new EnvironmentError(unicodeMessage);
  expect(error.message).toBe(unicodeMessage);
});
```

### 8. Complex Context Objects
```typescript
it('should handle context with nested objects', () => {
  const context: PipelineErrorContext = {
    config: {
      env: 'production',
      region: 'us-east-1',
      services: {
        api: { enabled: true, port: 3000 },
        worker: { enabled: true, concurrency: 4 },
      },
    },
  };
  const error = new EnvironmentError('Invalid configuration', context);
  expect(error.context).toEqual(context);
});
```

### 9. Circular References
```typescript
it('should handle circular references gracefully', () => {
  const circular: Record<string, unknown> = { name: 'test' };
  circular.self = circular;

  const error = new SessionError('Test error', { data: circular });
  const json = error.toJSON();
  const context = json.context as Record<string, unknown> | undefined;

  expect(context?.data).toBeDefined();
});
```

### 10. Non-Serializable Objects
```typescript
it('should handle non-serializable objects', () => {
  const fn = () => 'function';
  const error = new SessionError('Test error', { callback: fn });
  const json = error.toJSON();
  const context = json.context as Record<string, unknown> | undefined;

  expect(context?.callback).toBe('[non-serializable]');
});
```

## EnvironmentError-Specific Edge Cases

The EnvironmentError test file adds additional edge cases specific to environment validation:

### 1. Array Values in Context
```typescript
it('should handle context with array values', () => {
  const context: PipelineErrorContext = {
    requiredVars: ['API_KEY', 'DATABASE_URL', 'REDIS_URL'],
    optionalVars: ['DEBUG', 'LOG_LEVEL'],
  };
  const error = new EnvironmentError('Missing variables', context);
  expect(error.context).toEqual(context);
});
```

### 2. Boolean and Numeric Context Values
```typescript
it('should handle context with boolean values', () => {
  const context: PipelineErrorContext = {
    isProduction: true,
    isDevelopment: false,
    hasRequiredVars: true,
  };
  const error = new EnvironmentError('Test error', context);
  expect(error.context?.isProduction).toBe(true);
});

it('should handle context with numeric values', () => {
  const context: PipelineErrorContext = {
    port: 3000,
    timeout: 5000,
    retryCount: 3,
    maxRetries: 5,
  };
  const error = new EnvironmentError('Test error', context);
  expect(error.context?.port).toBe(3000);
});
```

### 3. Very Long Messages
```typescript
it('should handle very long messages', () => {
  const longMessage = 'Environment error '.repeat(100);
  const error = new EnvironmentError(longMessage);
  expect(error.message).toBe(longMessage);
});
```

## Integration Scenarios Tested

### 1. Typical Error Throwing
```typescript
it('should support typical error throwing pattern', () => {
  expect(() => {
    throw new SessionError('Failed to load session', {
      sessionPath: '/path/to/session',
      taskId: 'P1.M1.T1',
    });
  }).toThrow(SessionError);
});
```

### 2. Error Chaining with Cause
```typescript
it('should support error chaining with cause', () => {
  const originalError = new Error('Network timeout');
  const wrappedError = new AgentError(
    'Agent operation failed',
    { operation: 'generatePRP' },
    originalError
  );

  const wrappedWithCause = wrappedError as unknown as { cause?: Error };
  expect(wrappedWithCause.cause).toBe(originalError);
  expect(wrappedWithCause.cause?.message).toBe('Network timeout');
});
```

### 3. Structured Logging
```typescript
it('should support structured logging scenario', () => {
  const error = new ValidationError('Invalid input', {
    field: 'taskId',
    value: 'invalid',
  });

  const logData = error.toJSON();

  expect(logData.name).toBe('ValidationError');
  expect(logData.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
  expect(logData.message).toBe('Invalid input');
  expect(logData.timestamp).toBeDefined();
  expect(logData.context).toEqual({ field: 'taskId', value: 'invalid' });
  expect(logData.stack).toBeDefined();
});
```

## Test Organization Patterns

### 1. Descriptive Suite Names
```typescript
describe('Type guard functions', () => {
  describe('isSessionError', () => {
    // tests
  });
  describe('isTaskError', () => {
    // tests
  });
});
```

### 2. Clear Test Names
- "should return true for X instances"
- "should return false for other error types"
- "should return false for non-errors"
- "should narrow type with X"
- "should support try-catch with type guard"

### 3. Consistent Test Structure
Each type guard test suite follows the same structure:
1. Positive case (returns true for correct type)
2. Negative cases (returns false for other types)
3. Edge cases (null, undefined, primitives)
4. Type narrowing verification
5. Integration scenarios

## Key Takeaways for Implementing New Type Guards

### 1. Follow the Three-Phase Pattern
Always test:
- Positive case (should return true)
- Negative cases (should return false for other error types)
- Edge cases (null, undefined, primitives)

### 2. Verify Type Narrowing
Always include tests that demonstrate type narrowing works:
```typescript
if (isNewError(error)) {
  expect(error.specificProperty).toBeDefined();
}
```

### 3. Test Integration Scenarios
Include real-world usage patterns:
- Try-catch blocks
- Switch-style error handling
- Error chaining
- Structured logging

### 4. Cover Edge Cases
Test:
- Null/undefined
- Primitive types
- Empty strings/special characters
- Circular references
- Non-serializable objects
- Complex nested objects

### 5. Use Descriptive Test Names
Follow the pattern: "should [expected behavior] [condition]"

## Example Template for New Type Guard Tests

```typescript
describe('isNewError type guard', () => {
  it('should return true for NewError instances', () => {
    const error = new NewError('Test');
    expect(isNewError(error)).toBe(true);
  });

  it('should return false for other error types', () => {
    const sessionError = new SessionError('Test');
    const plainError = new Error('Test');

    expect(isNewError(sessionError)).toBe(false);
    expect(isNewError(plainError)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isNewError(null)).toBe(false);
    expect(isNewError(undefined)).toBe(false);
    expect(isNewError('string')).toBe(false);
    expect(isNewError(123)).toBe(false);
    expect(isNewError({})).toBe(false);
    expect(isNewError([])).toBe(false);
  });

  it('should narrow type in catch block', () => {
    try {
      throw new NewError('Test error');
    } catch (error) {
      if (isNewError(error)) {
        expect(error.code).toBe(ErrorCodes.SPECIFIC_CODE);
        expect(error.context).toBeDefined();
      }
    }
  });

  it('should support type narrowing in conditional', () => {
    const error = new NewError('Test error');

    if (isNewError(error)) {
      expect(error.code).toBe(ErrorCodes.SPECIFIC_CODE);
      expect(error.name).toBe('NewError');
    }
  });

  it('should work in switch-style error handling', () => {
    const errors: unknown[] = [
      new NewError('New error'),
      new Error('Plain error'),
      null,
    ];

    let newCount = 0;
    for (const error of errors) {
      if (isNewError(error)) {
        newCount++;
      }
    }

    expect(newCount).toBe(1);
  });
});
```

## References

- Vitest Documentation: https://vitest.dev/guide/
- TypeScript Type Guards: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- Error Utilities Source: `/home/dustin/projects/hacky-hack/src/utils/errors.ts`
- Primary Test File: `/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts`
- EnvironmentError Test File: `/home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts`
