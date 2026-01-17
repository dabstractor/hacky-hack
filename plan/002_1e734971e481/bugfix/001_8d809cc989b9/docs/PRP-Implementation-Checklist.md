# PRP Implementation Checklist: isFatalError Type Guard

**Task**: Implement `FatalError` class and `isFatalError` type guard using TDD methodology
**Date**: 2025-01-16
**Status**: Ready to Begin

---

## 🎯 Objective

Implement a `FatalError` class extending `PipelineError` with a corresponding `isFatalError` type guard function, following Test-Driven Development (TDD) principles and achieving 100% test coverage.

---

## 📋 Pre-Implementation Checklist

### Understanding the Requirements

- [ ] I understand the TDD Red-Green-Refactor cycle
- [ ] I understand type guard functions and type narrowing
- [ ] I have reviewed the existing error hierarchy in `src/utils/errors.ts`
- [ ] I have reviewed the reference test file `tests/unit/utils/errors-environment.test.ts`
- [ ] I understand the project's 100% coverage requirement
- [ ] I understand the Setup-Execute-Verify (SEV) test pattern
- [ ] I know how to run tests: `npm run test:run`
- [ ] I know how to generate coverage: `npm run test:coverage`

### Environment Setup

- [ ] Node.js version >= 20.0.0 is installed
- [ ] Dependencies are installed: `npm install`
- [ ] Tests run successfully: `npm run test:run`
- [ ] No existing failures in test suite

---

## 🔴 PHASE 1: RED (Write Failing Tests)

### Step 1.1: Create Test File

- [ ] Create file: `tests/unit/utils/errors-fatal.test.ts`
- [ ] Add file header comment with TDD RED PHASE marker
- [ ] Import necessary dependencies:
  - [ ] `ErrorCodes`
  - [ ] `PipelineErrorContext`
  - [ ] `PipelineError`
  - [ ] `SessionError`
  - [ ] `TaskError`
  - [ ] `AgentError`
  - [ ] `ValidationError`
  - [ ] `EnvironmentError`
  - [ ] `FatalError` (will fail to import initially)
  - [ ] `isFatalError` (will fail to import initially)

### Step 1.2: Constructor Tests

- [ ] Test: Create FatalError with message only
  - [ ] Check `instanceof FatalError`
  - [ ] Check `instanceof PipelineError`
  - [ ] Check `instanceof Error`
  - [ ] Check message value

- [ ] Test: Create FatalError with context
  - [ ] Pass context object
  - [ ] Verify context is set correctly

- [ ] Test: Create FatalError with cause
  - [ ] Pass cause error
  - [ ] Verify cause is attached

- [ ] Test: Create FatalError with all parameters
  - [ ] Pass message, context, and cause
  - [ ] Verify all are set correctly

- [ ] Test: isFatal property is set to true
  - [ ] Create FatalError
  - [ ] Verify `isFatal` property is `true`

### Step 1.3: Error Property Tests

- [ ] Test: Error code is correct
  - [ ] Verify `code` equals `ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR`

- [ ] Test: Name is correct
  - [ ] Verify `name` equals `'FatalError'`

- [ ] Test: Timestamp is set
  - [ ] Verify `timestamp` is defined
  - [ ] Verify timestamp is within reasonable range

- [ ] Test: Stack trace exists
  - [ ] Verify `stack` is defined
  - [ ] Verify stack contains 'FatalError'

- [ ] Test: isFatal property exists
  - [ ] Verify `isFatal` is `true`

### Step 1.4: Prototype Chain Tests

- [ ] Test: Prototype chain is correct
  - [ ] Verify `Object.getPrototypeOf(error)` is `FatalError.prototype`
  - [ ] Verify next prototype is `PipelineError.prototype`
  - [ ] Verify final prototype is `Error.prototype`

- [ ] Test: instanceof works for all types
  - [ ] `error instanceof FatalError` is `true`
  - [ ] `error instanceof PipelineError` is `true`
  - [ ] `error instanceof Error` is `true`

### Step 1.5: Serialization Tests

- [ ] Test: toJSON returns plain object
  - [ ] Call `toJSON()`
  - [ ] Verify return type is object

- [ ] Test: toJSON includes name
  - [ ] Verify `json.name` is `'FatalError'`

- [ ] Test: toJSON includes code
  - [ ] Verify `json.code` is correct

- [ ] Test: toJSON includes message
  - [ ] Verify `json.message` is correct

- [ ] Test: toJSON includes timestamp
  - [ ] Verify `json.timestamp` is ISO 8601 format

- [ ] Test: toJSON includes context when provided
  - [ ] Verify `json.context` matches input

- [ ] Test: toJSON includes isFatal
  - [ ] Verify `json.isFatal` is `true`

- [ ] Test: JSON.stringify compatibility
  - [ ] Call `JSON.stringify(error.toJSON())`
  - [ ] Parse and verify fields

### Step 1.6: Context Sanitization Tests

- [ ] Test: Redacts apiKey field
- [ ] Test: Redacts token field
- [ ] Test: Redacts password field
- [ ] Test: Redacts case-insensitively
- [ ] Test: Handles nested Error objects
- [ ] Test: Handles circular references
- [ ] Test: Handles non-serializable objects

### Step 1.7: Type Guard Tests - Positive Cases

- [ ] Test: Returns true for FatalError instances
- [ ] Test: Returns true for subclass instances
- [ ] Test: Identifies FatalError by error code

### Step 1.8: Type Guard Tests - Negative Cases

- [ ] Test: Returns false for SessionError
- [ ] Test: Returns false for TaskError
- [ ] Test: Returns false for AgentError
- [ ] Test: Returns false for ValidationError
- [ ] Test: Returns false for EnvironmentError
- [ ] Test: Returns false for plain Error
- [ ] Test: Returns false for null
- [ ] Test: Returns false for undefined
- [ ] Test: Returns false for strings
- [ ] Test: Returns false for numbers
- [ ] Test: Returns false for objects
- [ ] Test: Returns false for arrays

### Step 1.9: Type Narrowing Tests

- [ ] Test: Narrows type in if statement
  - [ ] Use type guard in conditional
  - [ ] Access FatalError-specific properties inside block
  - [ ] Verify no TypeScript errors

- [ ] Test: Narrows type in catch block
  - [ ] Throw FatalError
  - [ ] Catch and use type guard
  - [ ] Access narrowed error properties

- [ ] Test: Works with array filter
  - [ ] Create array of mixed errors
  - [ ] Filter using type guard
  - [ ] Verify filtered array

- [ ] Test: Works in switch-style handling
  - [ ] Create mixed error array
  - [ ] Use type guard in loop
  - [ ] Verify correct counts

### Step 1.10: Edge Case Tests

- [ ] Test: Empty message
- [ ] Test: Undefined context
- [ ] Test: Null context
- [ ] Test: Undefined cause
- [ ] Test: Very long message (1000+ chars)
- [ ] Test: Special characters in message
- [ ] Test: Unicode characters in message
- [ ] Test: Complex nested context objects

### Step 1.11: Integration Scenario Tests

- [ ] Test: Typical throwing pattern
  - [ ] Use `expect(() => { throw new FatalError() }).toThrow()`

- [ ] Test: Try-catch with type guard
  - [ ] Throw and catch FatalError
  - [ ] Use type guard in catch block
  - [ ] Access narrowed error

- [ ] Test: Error chaining
  - [ ] Create original error
  - [ ] Wrap in FatalError
  - [ ] Verify cause is preserved

- [ ] Test: Structured logging scenario
  - [ ] Create FatalError with context
  - [ ] Call toJSON()
  - [ ] Verify all fields present

- [ ] Test: Retry logic differentiation
  - [ ] Create handler function
  - [ ] Verify FatalError returns false for retry
  - [ ] Verify other errors return true

### Step 1.12: Verify Tests Fail

```bash
# Run the new test file
npm run test tests/unit/utils/errors-fatal.test.ts
```

- [ ] Tests run (even though imports fail)
- [ ] Tests fail with import errors or runtime errors
- [ ] This is expected - we're in RED phase

**Expected failures:**

- Cannot import `FatalError` (not implemented yet)
- Cannot import `isFatalError` (not implemented yet)
- TypeScript compilation errors

---

## 🟢 PHASE 2: GREEN (Make Tests Pass)

### Step 2.1: Add Error Code

- [ ] Open `src/utils/errors.ts`
- [ ] Locate `ErrorCodes` object
- [ ] Add: `PIPELINE_EXECUTION_FATAL_ERROR: 'PIPELINE_EXECUTION_FATAL_ERROR'`

### Step 2.2: Implement FatalError Class

- [ ] Add FatalError class after EnvironmentError
- [ ] Extend PipelineError
- [ ] Set `readonly code = ErrorCodes.PIPELINE_EXECUTION_FATAL_ERROR`
- [ ] Set `readonly isFatal = true`
- [ ] Implement constructor with proper parameters
- [ ] Call `super()` with parameters
- [ ] Set prototype: `Object.setPrototypeOf(this, FatalError.prototype)`
- [ ] Add JSDoc comments

### Step 2.3: Implement Type Guard

- [ ] Add `isFatalError` function after FatalError class
- [ ] Use proper type signature: `error is FatalError`
- [ ] Implement: `return error instanceof FatalError`
- [ ] Add JSDoc comments with usage examples

### Step 2.4: Export New Items

- [ ] Verify FatalError is exported
- [ ] Verify isFatalError is exported
- [ ] Check if export to `src/core/index.ts` is needed

### Step 2.5: Run Tests

```bash
# Run the test file
npm run test tests/unit/utils/errors-fatal.test.ts

# Generate coverage
npm run test:coverage
```

- [ ] All tests pass
- [ ] Coverage is 100% for new code
- [ ] No TypeScript errors
- [ ] No linting errors

---

## 🔄 PHASE 3: REFACTOR (Clean Up)

### Step 3.1: Review Code

- [ ] Check for code duplication
- [ ] Check for magic numbers/strings
- [ ] Check for long functions
- [ ] Check for complex conditionals

### Step 3.2: Improve Readability

- [ ] Add clarifying comments if needed
- [ ] Extract complex logic if needed
- [ ] Improve variable names if needed
- [ ] Add JSDoc examples if helpful

### Step 3.3: Verify After Refactoring

```bash
# Run tests after each refactoring step
npm run test tests/unit/utils/errors-fatal.test.ts
```

- [ ] Tests still pass after refactoring
- [ ] Coverage remains at 100%
- [ ] Behavior unchanged

---

## ✅ PHASE 4: FINAL VERIFICATION

### Step 4.1: Run Full Test Suite

```bash
npm run test:run
```

- [ ] All existing tests still pass
- [ ] New tests pass
- [ ] No test failures

### Step 4.2: Check Coverage

```bash
npm run test:coverage
```

- [ ] Overall coverage remains at 100%
- [ ] New code has 100% coverage
- [ ] No coverage gaps

### Step 4.3: Type Check

```bash
npm run typecheck
```

- [ ] No TypeScript errors
- [ ] Type narrowing works correctly
- [ ] No `@ts-expect-error` needed (except for testing readonly)

### Step 4.4: Lint

```bash
npm run lint
```

- [ ] No linting errors
- [ ] Code follows project style

### Step 4.5: Full Validation

```bash
npm run validate
```

- [ ] All validation checks pass
- [ ] Ready for commit

---

## 📊 Success Metrics

### Code Quality

- [ ] 100% test coverage (statements, branches, functions, lines)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Follows existing code patterns
- [ ] JSDoc comments present

### Test Quality

- [ ] All tests pass
- [ ] Tests follow SEV pattern
- [ ] Tests cover happy path
- [ ] Tests cover error path
- [ ] Tests cover edge cases
- [ ] Tests verify type narrowing

### Functionality

- [ ] FatalError can be instantiated
- [ ] FatalError extends PipelineError correctly
- [ ] isFatalError type guard works
- [ ] Type narrowing functions correctly
- [ ] Error serialization works
- [ ] Context sanitization works

---

## 🚨 Potential Issues and Solutions

### Issue 1: Import Errors

**Symptom**: Cannot import FatalError
**Solution**: Complete GREEN phase implementation

### Issue 2: Prototype Chain Issues

**Symptom**: instanceof checks fail
**Solution**: Ensure `Object.setPrototypeOf(this, FatalError.prototype)` is called

### Issue 3: Type Narrowing Not Working

**Symptom**: TypeScript doesn't narrow type
**Solution**: Verify type guard signature uses `error is FatalError`

### Issue 4: Coverage < 100%

**Symptom**: Coverage report shows gaps
**Solution**: Add tests for missing branches/lines

### Issue 5: Tests Pass But Coverage Fails

**Symptom**: Tests pass but coverage not 100%
**Solution**: Check that all code paths are executed in tests

---

## 📚 Reference Documents

- [ ] TDD Best Practices: `docs/research/TDD-TypeScript-Testing-Best-Practices.md`
- [ ] Research Summary: `docs/research/TDD-Research-Summary.md`
- [ ] Quick Reference: `docs/research/TDD-Quick-Reference.md`
- [ ] Test Reference: `tests/unit/utils/errors-environment.test.ts`
- [ ] Implementation File: `src/utils/errors.ts`

---

## 🎯 Ready to Start!

**Status**: ✅ All preparation complete
**Next Step**: Begin 🔴 PHASE 1: RED (Write Failing Tests)

**Remember**: TDD discipline is critical - DO NOT implement FatalError until all tests are written and failing!

---

**Checklist Version**: 1.0
**Last Updated**: 2025-01-16
**Estimated Time**: 2-3 hours for full implementation
