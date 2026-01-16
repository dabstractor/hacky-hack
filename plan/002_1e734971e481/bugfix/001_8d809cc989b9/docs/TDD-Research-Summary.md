# TDD and TypeScript Testing Research Summary

**Research Date:** 2025-01-16
**Project:** hacky-hack
**Purpose:** Guide for implementing isFatalError type guard using TDD

---

## Quick Reference

### TDD Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE                                 │
├─────────────────────────────────────────────────────────────┤
│  RED         GREEN            REFACTOR                       │
│ Write       Make             Clean up                       │
│ failing     tests            while keeping                  │
│ test        pass             tests passing                  │
└─────────────────────────────────────────────────────────────┘
```

### Type Guard Testing Checklist

- [x] Return `true` for target type instances
- [x] Return `false` for sibling error types
- [x] Return `false` for parent error types
- [x] Return `false` for plain `Error` instances
- [x] Return `false` for primitives (`null`, `undefined`, strings, numbers)
- [x] Return `false` for objects and arrays
- [x] Narrow type correctly in `if` statements
- [x] Narrow type correctly in `catch` blocks
- [x] Work with `switch`/`for` patterns
- [x] Maintain type safety (no `as` casts needed)

### Coverage Requirements

Your project enforces **100% coverage**:
- **Statements**: Every executable statement
- **Branches**: Every `if/else`, `switch`, ternary
- **Functions**: Every function declaration
- **Lines**: Every line of code

---

## Key Findings

### 1. TDD Methodology

**Red Phase (Write Failing Tests):**
- Tests MUST fail before writing production code
- Verify tests fail for the right reason (not compilation errors)
- Use descriptive test names with Setup/Execute/Verify pattern
- Test one behavior at a time

**Green Phase (Make Tests Pass):**
- Write minimum viable code
- Hard-coded values acceptable initially
- Run tests frequently
- No refactoring in this phase

**Refactor Phase (Clean Up):**
- Only refactor when tests pass
- Remove duplication
- Improve readability
- Ensure behavior remains unchanged

### 2. TypeScript Type Guard Testing

**Test Categories:**

1. **Positive Cases** (should return `true`)
   ```typescript
   it('should return true for FatalError instances', () => {
     const error = new FatalError('Test error');
     expect(isFatalError(error)).toBe(true);
   });
   ```

2. **Negative Cases** (should return `false`)
   ```typescript
   it('should return false for other error types', () => {
     const error = new SessionError('Session error');
     expect(isFatalError(error)).toBe(false);
   });
   ```

3. **Type Narrowing Validation**
   ```typescript
   it('should narrow type in conditional block', () => {
     const error: unknown = new FatalError('Test error');
     if (isFatalError(error)) {
       // error is narrowed to FatalError
       expect(error.code).toBeDefined();
       expect(error.isFatal).toBe(true);
     }
   });
   ```

### 3. Vitest Best Practices

**Test Structure:**
- Use `describe` blocks to group related tests
- Use `it` for individual test cases
- Follow Setup/Execute/Verify (SEV) pattern
- Add descriptive comments

**From Your Project:**
```typescript
describe('isEnvironmentError type guard', () => {
  it('should return true for EnvironmentError instances', () => {
    const error = new EnvironmentError('Test error');
    expect(isEnvironmentError(error)).toBe(true);
  });

  it('should return false for non-errors', () => {
    expect(isEnvironmentError(null)).toBe(false);
    expect(isEnvironmentError(undefined)).toBe(false);
    expect(isEnvironmentError('string')).toBe(false);
  });
});
```

### 4. Error Handling Test Patterns

**Essential Test Categories:**

1. **Constructor Tests**
   - Message only
   - Message + context
   - Message + cause
   - All parameters

2. **Property Tests**
   - Error code
   - Name
   - Timestamp
   - Stack trace
   - Custom properties (e.g., `isFatal`)

3. **Prototype Chain Tests**
   - instanceof checks
   - Prototype hierarchy

4. **Serialization Tests**
   - toJSON() output
   - JSON.stringify compatibility
   - All fields included

5. **Context Sanitization Tests**
   - Sensitive field redaction
   - Case-insensitive matching
   - Nested Error objects
   - Circular references

6. **Type Guard Tests**
   - Positive/negative cases
   - Type narrowing
   - Integration patterns

### 5. Project-Specific Patterns

**Error Hierarchy:**
```typescript
Error
  └── PipelineError (abstract base)
        ├── SessionError
        ├── TaskError
        ├── AgentError
        ├── ValidationError
        ├── EnvironmentError
        └── FatalError (to be implemented)
```

**Each Error Class Must Have:**
- Unique error code
- Optional context
- Timestamp
- toJSON() serialization
- Type guard function

**Test File Organization:**
```
tests/
├── unit/
│   └── utils/
│       └── errors-environment.test.ts (reference)
│       └── errors-fatal.test.ts (to create)
├── integration/
└── setup.ts
```

---

## Implementation Workflow for isFatalError

### Step 1: Write Failing Tests (RED)

Create `/home/dustin/projects/hacky-hack/tests/unit/utils/errors-fatal.test.ts`:

```typescript
describe('FatalError class (TDD RED PHASE)', () => {
  describe('constructor', () => {
    it('should create FatalError with message only', () => {
      const error = new FatalError('Fatal error occurred');
      expect(error instanceof FatalError).toBe(true);
      expect(error.message).toBe('Fatal error occurred');
    });

    it('should have isFatal property set to true', () => {
      const error = new FatalError('Test error');
      expect(error.isFatal).toBe(true);
    });
    // ... more constructor tests
  });

  describe('error properties', () => {
    it('should have correct error code', () => {
      const error = new FatalError('Test error');
      expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
    });
    // ... more property tests
  });

  describe('isFatalError type guard', () => {
    it('should return true for FatalError instances', () => {
      const error = new FatalError('Test error');
      expect(isFatalError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new SessionError('Session error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const error: unknown = new FatalError('Test error');
      if (isFatalError(error)) {
        expect(error.isFatal).toBe(true);
      }
    });
    // ... more type guard tests
  });
});
```

**Run tests - they should fail:**
```bash
npm run test:run tests/unit/utils/errors-fatal.test.ts
```

### Step 2: Implement FatalError (GREEN)

In `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
// Add to ErrorCodes
export const ErrorCodes = {
  // ... existing codes
  PIPELINE_EXECUTION_FATAL_ERROR: 'PIPELINE_EXECUTION_FATAL_ERROR',
} as const;

// Add FatalError class
export class FatalError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR;
  readonly isFatal = true;

  constructor(
    message: string,
    context?: PipelineErrorContext,
    cause?: Error
  ) {
    super(message, context, cause);
    Object.setPrototypeOf(this, FatalError.prototype);
  }
}

// Add type guard
export function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}
```

**Run tests - they should pass:**
```bash
npm run test:run tests/unit/utils/errors-fatal.test.ts
```

### Step 3: Refactor (REFACTOR)

- Clean up any duplication
- Improve readability
- Ensure tests still pass

### Step 4: Verify Coverage

```bash
npm run test:coverage
```

Ensure 100% coverage for the new code.

---

## Test Patterns from Your Project

### Pattern 1: Constructor Tests

From `errors-environment.test.ts`:
```typescript
describe('EnvironmentError class', () => {
  it('should create EnvironmentError with message only', () => {
    const error = new EnvironmentError('Environment configuration failed');
    expect(error instanceof EnvironmentError).toBe(true);
    expect(error instanceof PipelineError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Environment configuration failed');
  });
});
```

### Pattern 2: Type Guard Tests

From `errors-environment.test.ts`:
```typescript
describe('isEnvironmentError type guard', () => {
  it('should return true for EnvironmentError instances', () => {
    const error = new EnvironmentError('Test error');
    expect(isEnvironmentError(error)).toBe(true);
  });

  it('should return false for other PipelineError types', () => {
    const plainError = new Error('Test');
    expect(isEnvironmentError(plainError)).toBe(false);
  });

  it('should narrow type in catch block', () => {
    try {
      throw new EnvironmentError('Environment error');
    } catch (error) {
      if (isEnvironmentError(error)) {
        expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
      }
    }
  });
});
```

### Pattern 3: Edge Case Tests

From `errors-environment.test.ts`:
```typescript
describe('EnvironmentError edge cases', () => {
  it('should handle empty message', () => {
    const error = new EnvironmentError('');
    expect(error.message).toBe('');
  });

  it('should handle undefined context', () => {
    const error = new EnvironmentError('Test error');
    expect(error.context).toBeUndefined();
  });

  it('should handle complex context objects', () => {
    const context: PipelineErrorContext = {
      variable: 'DATABASE_URL',
      environment: 'production',
      metadata: {
        timestamp: Date.now(),
        attempt: 3,
      },
    };
    const error = new EnvironmentError('Complex error', context);
    expect(error.context).toEqual(context);
  });
});
```

---

## Common Pitfalls to Avoid

### 1. Skipping the Red Phase
❌ **Bad**: Write implementation first, then tests
✅ **Good**: Write failing tests first, then implementation

### 2. Testing Implementation Details
❌ **Bad**: Testing internal implementation
✅ **Good**: Testing public behavior and API

### 3. Weak Assertions
❌ **Bad**: `expect(result).toBeDefined()`
✅ **Good**: `expect(result).toBe(expectedValue)`

### 4. Missing Edge Cases
❌ **Bad**: Only testing happy path
✅ **Good**: Testing all branches, errors, and edge cases

### 5. Not Verifying Type Narrowing
❌ **Bad**: Only checking return value
✅ **Good**: Verifying type is narrowed correctly

---

## Commands Reference

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Stop on first failure
npm run test:bail

# Run specific test file
npm run test tests/unit/utils/errors-fatal.test.ts
```

---

## Reference Materials

**Full Documentation:**
- `/home/dustin/projects/hacky-hack/docs/research/TDD-TypeScript-Testing-Best-Practices.md`

**Reference Test Files:**
- `/home/dustin/projects/hacky-hack/tests/unit/utils/errors-environment.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts`

**Implementation File:**
- `/home/dustin/projects/hacky-hack/src/utils/errors.ts`

**Configuration:**
- `/home/dustin/projects/hacky-hack/vitest.config.ts`

---

## Next Steps

1. **Review** the full best practices document
2. **Create** test file following the RED phase
3. **Verify** tests fail
4. **Implement** FatalError class following GREEN phase
5. **Verify** tests pass
6. **Refactor** code while keeping tests passing
7. **Verify** 100% coverage

---

**Document Version:** 1.0
**Last Updated:** 2025-01-16
**Status:** Ready for Implementation
