# PRD Issue 7 Context

## Issue Description

**Title**: PromiseRejectionHandledWarning messages appear during test runs

**Severity**: Major

**Location**: PRD Section 5.2 (Agent Capabilities)

## Problem Statement

During integration test execution, `PromiseRejectionHandledWarning` messages appear in the output. These warnings indicate that promise rejections are being handled asynchronously, which can lead to:

1. **Noisy test output** - Warnings clutter test results
2. **Masked failures** - Real issues may be hidden among warnings
3. **Stack trace issues** - Some tests fail stack trace preservation checks
4. **Unreliable test execution** - Async handlers may not complete before test ends

## Affected Tests

### Primary Affected Test

**File**: `tests/integration/utils/error-handling.test.ts`
**Lines**: 344-367
**Test**: "should preserve stack trace through error wrapping"

```typescript
it('should preserve stack trace through error wrapping', async () => {
  // Create an async inner function that throws a TaskError
  const asyncInner = async (): Promise<void> => {
    throw new TaskError('Inner task failed');
  };

  // Outer function that catches and re-throws wrapped in PipelineError
  const asyncOuter = async (): Promise<void> => {
    try {
      await asyncInner();
    } catch (error) {
      throw new PipelineError('Pipeline failed', { cause: error });
    }
  };

  // Test that the original TaskError is preserved as the cause
  let caughtError: Error | null = null;
  try {
    await asyncOuter();
  } catch (error) {
    caughtError = error as Error;
  }

  expect(caughtError).toBeInstanceOf(PipelineError);
  expect(caughtError?.cause).toBeInstanceOf(TaskError);
  expect(caughtError?.cause?.message).toBe('Inner task failed');
});
```

**Expected Behavior**: PipelineError.cause should be an instance of TaskError
**Actual Behavior**: `expected undefined to be an instance of TaskError`

### Other Potentially Affected Tests

- `tests/integration/core/task-orchestrator-e2e.test.ts` - Async session loading
- `tests/integration/prp-pipeline-shutdown.test.ts` - Process signal handling
- `tests/e2e/pipeline.test.ts` - Mock child process with setTimeout

## Root Cause Analysis

### 1. Promise Rejection Handling Race Condition

`PromiseRejectionHandledWarning` occurs when:

1. A promise rejects without an attached handler
2. A handler is attached in a subsequent event loop tick

This is a **race condition** - Node.js detects the unhandled rejection and emits a warning, even though a handler is eventually attached.

### 2. Error Chain Preservation Issues

The error wrapping mechanism may not properly preserve:

- The prototype chain (`Object.setPrototypeOf`)
- The `cause` property in Error options
- Stack trace through async boundaries

### 3. Async Test Lifecycle Issues

Test hooks (beforeEach, afterEach) may have:

- Async operations without proper .catch() handlers
- Cleanup that runs before async operations complete
- Mock timers that interact unpredictably with real promises

## Contract Definition

From the tasks.json file for P4.M2.T1.S1:

```yaml
CONTRACT DEFINITION:
1. RESEARCH NOTE: From PRD Issue 7 - PromiseRejectionHandledWarning messages
  appear during test runs. Some tests fail stack trace preservation checks.
  Need to identify source of unhandled rejections.

2. INPUT: Integration test output showing warnings, test setup files,
  test teardown code.

3. LOGIC: Run integration tests and capture PromiseRejectionHandledWarning
  messages. Identify which tests or setup code causes unhandled rejections.
  Add proper .catch() handlers or try-catch blocks. Ensure all promises
  are properly handled in test fixtures. Review async/await usage.

4. OUTPUT: Analysis of promise rejection sources, identified unhandled
  rejections fixed with proper handlers.
```

## Success Criteria

- [ ] No `PromiseRejectionHandledWarning` messages during test execution
- [ ] Stack trace preservation test passes
- [ ] All integration tests pass with clean output
- [ ] Promise rejections are handled immediately (no async delay)
- [ ] Test fixtures have proper error boundaries

## Dependencies

### Related Issues

- **P1.M1**: EnvironmentError class implementation (COMPLETE)
- **P1.M2**: isFatalError function extraction (COMPLETE)
- **P3.M1**: Task Orchestrator logging tests (COMPLETE)
- **P3.M2**: Session utils validation test (COMPLETE)
- **P4.M1**: Fix test output verbosity - dotenv quiet mode (IN PROGRESS)

### Error Hierarchy Dependencies

The error wrapping mechanism depends on:

- Proper `Object.setPrototypeOf()` calls in error constructors
- Correct `cause` option handling in Error constructors
- Type guard functions for error instance checking

## Related Documentation

- Error handling implementation: `src/core/errors.ts`
- TaskError definition: `src/core/errors.ts` (lines 67-101)
- PipelineError definition: `src/core/errors.ts` (lines 150-174)
- Error integration tests: `tests/integration/utils/error-handling.test.ts`
