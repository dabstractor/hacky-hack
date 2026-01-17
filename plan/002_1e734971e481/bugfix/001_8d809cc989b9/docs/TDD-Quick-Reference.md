# TDD Quick Reference Card for isFatalError Implementation

**Purpose**: Implement `FatalError` class and `isFatalError` type guard using TDD

---

## 📋 TDD Cycle Checklist

### 🔴 RED Phase (Write Failing Tests)

- [ ] Create test file: `tests/unit/utils/errors-fatal.test.ts`
- [ ] Import dependencies (FatalError, isFatalError, etc.)
- [ ] Write constructor tests (message, context, cause)
- [ ] Write property tests (code, name, timestamp, isFatal)
- [ ] Write prototype chain tests
- [ ] Write serialization tests (toJSON)
- [ ] Write context sanitization tests
- [ ] Write type guard tests (positive/negative cases)
- [ ] Write type narrowing tests
- [ ] Write edge case tests
- [ ] Write integration scenario tests
- [ ] **VERIFY**: Run `npm run test:run tests/unit/utils/errors-fatal.test.ts` - tests MUST fail

### 🟢 GREEN Phase (Make Tests Pass)

- [ ] Add error code to `ErrorCodes` enum
- [ ] Create `FatalError` class extending `PipelineError`
- [ ] Set `code` property to `PIPELINE_EXECUTION_FATAL_ERROR`
- [ ] Add `isFatal` property set to `true`
- [ ] Implement constructor with proper prototype setup
- [ ] Implement `isFatalError` type guard function
- [ ] Export new class and function from `src/utils/errors.ts`
- [ ] **VERIFY**: Run `npm run test:run tests/unit/utils/errors-fatal.test.ts` - tests MUST pass

### 🔄 REFACTOR Phase (Clean Up)

- [ ] Review code for duplication
- [ ] Improve readability
- [ ] Add JSDoc comments if needed
- [ ] **VERIFY**: Run `npm run test:run tests/unit/utils/errors-fatal.test.ts` - tests MUST still pass

### ✅ Final Verification

- [ ] Run `npm run test:coverage` - ensure 100% coverage
- [ ] Run `npm run typecheck` - ensure no TypeScript errors
- [ ] Run `npm run lint` - ensure code style compliance
- [ ] Run all tests: `npm run test:run`

---

## 📝 Test Template

```typescript
/**
 * Unit tests for FatalError class and isFatalError type guard
 *
 * TDD RED PHASE: All tests must fail before implementation
 */

import {
  ErrorCodes,
  PipelineErrorContext,
  FatalError,
  isFatalError,
  SessionError,
} from '../../../src/utils/errors.js';

describe('FatalError class', () => {
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

  describe('toJSON() serialization', () => {
    it('should serialize error correctly', () => {
      const error = new FatalError('Test error');
      const json = error.toJSON();
      expect(json.name).toBe('FatalError');
      expect(json.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
      expect(json.isFatal).toBe(true);
    });
    // ... more serialization tests
  });
});

describe('isFatalError type guard', () => {
  describe('positive cases', () => {
    it('should return true for FatalError instances', () => {
      const error = new FatalError('Test error');
      expect(isFatalError(error)).toBe(true);
    });
  });

  describe('negative cases', () => {
    it('should return false for other error types', () => {
      const error = new SessionError('Session error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isFatalError(null)).toBe(false);
      expect(isFatalError(undefined)).toBe(false);
      expect(isFatalError('string')).toBe(false);
    });
  });

  describe('type narrowing', () => {
    it('should narrow type in conditional block', () => {
      const error: unknown = new FatalError('Test error');
      if (isFatalError(error)) {
        expect(error.isFatal).toBe(true);
        expect(error.code).toBeDefined();
      }
    });

    it('should narrow type in catch block', () => {
      try {
        throw new FatalError('Fatal error occurred');
      } catch (error) {
        if (isFatalError(error)) {
          expect(error.code).toBe(ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR);
        }
      }
    });
  });
});
```

---

## 💻 Implementation Template

````typescript
// In src/utils/errors.ts

// 1. Add to ErrorCodes enum
export const ErrorCodes = {
  // ... existing codes
  PIPELINE_EXECUTION_FATAL_ERROR: 'PIPELINE_EXECUTION_FATAL_ERROR',
} as const;

// 2. Add FatalError class
/**
 * Fatal pipeline errors that should halt execution
 *
 * @remarks
 * Used for critical failures that require immediate attention.
 * Marked with isFatal property for easy identification.
 *
 * @example
 * ```typescript
 * throw new FatalError(
 *   'Database connection failed',
 *   { operation: 'migration', stage: 'execution' }
 * );
 * ```
 */
export class FatalError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR;
  readonly isFatal = true;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, FatalError.prototype);
  }
}

// 3. Add type guard
/**
 * Type guard for FatalError
 *
 * @remarks
 * Returns true if the error is an instance of FatalError.
 * Enables type narrowing in catch blocks.
 *
 * @example
 * ```typescript
 * try {
 *   await criticalOperation();
 * } catch (error) {
 *   if (isFatalError(error)) {
 *     // error is narrowed to FatalError
 *     console.log(`Fatal error: ${error.message}`);
 *     // Should not retry
 *     return;
 *   }
 *   // Handle other errors
 * }
 * ```
 */
export function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}
````

---

## 🎯 Test Categories to Cover

### 1. Constructor Tests (7 tests)

- [ ] Message only
- [ ] Message + context
- [ ] Message + cause
- [ ] Message + context + cause
- [ ] isFatal property set to true
- [ ] instanceof checks (FatalError, PipelineError, Error)
- [ ] Empty message edge case

### 2. Property Tests (5 tests)

- [ ] Error code is `PIPELINE_EXECUTION_FATAL_ERROR`
- [ ] Name is `FatalError`
- [ ] Timestamp is set correctly
- [ ] Stack trace exists
- [ ] isFatal is `true`

### 3. Prototype Chain Tests (2 tests)

- [ ] Correct prototype chain
- [ ] instanceof works for all types

### 4. Serialization Tests (8 tests)

- [ ] toJSON returns plain object
- [ ] Includes name
- [ ] Includes code
- [ ] Includes message
- [ ] Includes timestamp (ISO format)
- [ ] Includes context when provided
- [ ] Includes isFatal
- [ ] JSON.stringify compatible

### 5. Context Sanitization Tests (7 tests)

- [ ] Redacts apiKey
- [ ] Redacts token
- [ ] Redacts password
- [ ] Redacts case-insensitively
- [ ] Handles nested Error objects
- [ ] Handles circular references
- [ ] Handles non-serializable objects

### 6. Type Guard Tests (15 tests)

- [ ] Returns true for FatalError
- [ ] Returns true for subclasses
- [ ] Returns false for SessionError
- [ ] Returns false for TaskError
- [ ] Returns false for AgentError
- [ ] Returns false for ValidationError
- [ ] Returns false for EnvironmentError
- [ ] Returns false for plain Error
- [ ] Returns false for null
- [ ] Returns false for undefined
- [ ] Returns false for string
- [ ] Returns false for number
- [ ] Returns false for object
- [ ] Returns false for array
- [ ] Narrows type in conditional

### 7. Type Narrowing Tests (4 tests)

- [ ] Narrows type in if statement
- [ ] Narrows type in catch block
- [ ] Works with array filter
- [ ] Works in switch-style handling

### 8. Edge Case Tests (8 tests)

- [ ] Empty message
- [ ] Undefined context
- [ ] Null context
- [ ] Undefined cause
- [ ] Very long message
- [ ] Special characters
- [ ] Unicode characters
- [ ] Complex context objects

### 9. Integration Scenario Tests (5 tests)

- [ ] Throwing pattern
- [ ] Try-catch with type guard
- [ ] Error chaining
- [ ] Structured logging
- [ ] Retry logic differentiation

**Total: ~61 tests for comprehensive coverage**

---

## 🚀 Commands

```bash
# Run specific test file
npm run test tests/unit/utils/errors-fatal.test.ts

# Run tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint

# All validation
npm run validate
```

---

## ✅ Success Criteria

- [ ] All tests pass
- [ ] 100% code coverage (statements, branches, functions, lines)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Follows existing code patterns
- [ ] JSDoc comments added
- [ ] Exported from `src/core/index.ts` (if needed)

---

## 📚 Reference Files

- **Test Reference**: `tests/unit/utils/errors-environment.test.ts`
- **Implementation**: `src/utils/errors.ts`
- **Full Guide**: `docs/research/TDD-TypeScript-Testing-Best-Practices.md`
- **Summary**: `docs/research/TDD-Research-Summary.md`

---

**Remember**: RED → GREEN → REFACTOR
**Always**: Write failing tests first!

**Status**: Ready to begin RED phase
