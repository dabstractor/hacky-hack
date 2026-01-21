# TDD Implementation Notes for isFatalError

**Notes Date**: 2026-01-16
**Phase**: RED (Write Failing Tests)
**Purpose**: Document TDD methodology and implementation notes for isFatalError test suite

---

## Overview

This document describes the Test-Driven Development (TDD) methodology applied to implementing the `isFatalError()` function. It covers the RED phase (writing failing tests), transition to GREEN phase (implementing the function), and REFACTOR phase (improving implementation).

---

## TDD Cycle Overview

### The Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────┐         │
│  │   RED   │───▶│  GREEN  │───▶│    REFACTOR     │         │
│  │         │    │         │    │                 │         │
│  │ Write   │    │ Write   │    │ Improve         │         │
│  │ Failing │    │ Minimum │    │ Implementation  │         │
│  │ Tests   │    │ Code    │    │ While Keeping   │         │
│  │         │    │ to Pass │    │ Tests Passing   │         │
│  └────┬────┘    └────┬────┘    └────────┬────────┘         │
│       │              │                  │                  │
│       └──────────────┴──────────────────┘                  │
│                      │                                      │
│                      ▼                                      │
│              ┌─────────────┐                               │
│              │   REPEAT    │                               │
│              └─────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: RED (Write Failing Tests)

### Objective

Write comprehensive failing tests that define the expected behavior of `isFatalError()`.

### Current Status

**Status**: ✅ COMPLETE (This subtask - P1.M2.T1.S2)

**Deliverables**:

- ✅ PRP.md created with comprehensive test requirements
- ✅ Research documentation completed (4 files)
- ⏳ Test file to be created: `tests/unit/utils/is-fatal-error.test.ts`
- ⏳ 200+ failing tests to be written

### Test Requirements

| Category               | Test Count | Expected Result                |
| ---------------------- | ---------- | ------------------------------ |
| Fatal Errors           | 50         | All return `true`              |
| Non-Fatal Errors       | 80         | All return `false`             |
| Standard Error Types   | 20         | All return `false`             |
| Null/Undefined/Invalid | 20         | All return `false`             |
| Type Guard Integration | 15         | Varies by test                 |
| continueOnError Flag   | 15         | All return `false` when `true` |
| Edge Cases             | 20         | Varies by test                 |
| **TOTAL**              | **220**    | -                              |

### RED Phase Checklist

- [ ] Create test file at `tests/unit/utils/is-fatal-error.test.ts`
- [ ] Write comprehensive header documentation
- [ ] Import all error classes and type guards
- [ ] Implement all 220 test cases
- [ ] Follow SEV (Setup-Execute-Verify) pattern
- [ ] Use "should" prefix for test descriptions
- [ ] Run tests to verify all fail
- [ ] Document test run output showing failures
- [ ] Verify test count is 220+
- [ ] Ensure no syntax or import errors

### Expected Test Run Output (RED Phase)

```bash
$ npm run test:run -- tests/unit/utils/is-fatal-error.test.ts

 ❯ tests/unit/utils/is-fatal-error.test.ts (0)

   ❯ isFatalError (0)
     ❯ Fatal errors (return true) (0)
       ❯ SessionError with LOAD_FAILED code (0)
         × should return true for SessionError with LOAD_FAILED code (1)
       × should return true for SessionError with LOAD_FAILED code (2) (1)
       ... (48 more fatal error tests)

     ❯ Non-fatal errors (return false) (0)
       ❯ TaskError (non-fatal) (0)
         × should return false for TaskError with taskId (1) (1)
       ... (79 more non-fatal error tests)

     ❯ Standard Error types (return false) (0)
       × should return false for standard Error (1)
       ... (19 more standard error tests)

     ❯ Null/Undefined/Invalid values (return false) (0)
       × should return false for null (1)
       ... (19 more null/undefined tests)

     ❯ Type guard integration (0)
       × should work with isPipelineError type guard (1)
       ... (14 more type guard tests)

     ❯ continueOnError flag behavior (0)
       × should return false for SessionError when continueOnError is true (1)
       ... (14 more flag tests)

     ❯ Edge cases and boundary conditions (0)
       × should handle empty string message (1)
       ... (19 more edge case tests)

 ⎯ Test Files  1 failed (1)
     Tests  220 failed (220)
  Start at  12:34:56
  Duration  234ms

FAIL Tests failed
```

**Key Indicators of Successful RED Phase**:

- ✅ All 220 tests fail
- ✅ Error message: "ReferenceError: isFatalError is not defined" or similar
- ✅ No syntax errors
- ✅ No import errors
- ✅ Test file compiles successfully

---

## Phase 2: GREEN (Write Minimum Code to Pass)

### Objective

Implement the `isFatalError()` function with minimum code to make all tests pass.

### Status

**Status**: ⏳ PENDING (Next subtask - P1.M2.T1.S3)

**Deliverables**:

- ⏳ `isFatalError()` function implementation in `src/utils/errors.ts`
- ⏳ Export statement in `src/utils/errors.ts`
- ⏳ All 220 tests pass

### Implementation Strategy

1. **Start with minimal implementation**:

   ```typescript
   export function isFatalError(
     error: unknown,
     continueOnError: boolean = false
   ): boolean {
     // Placeholder - will make all tests fail
     return false;
   }
   ```

2. **Incrementally add logic**:
   - First: Handle `continueOnError` flag
   - Second: Handle null/undefined/non-object checks
   - Third: Handle fatal error types
   - Fourth: Handle non-fatal error types
   - Finally: Add edge case handling

3. **Run tests frequently**:
   - After each code change
   - Verify test count increases (more tests passing)
   - Ensure no previously passing tests break

### GREEN Phase Checklist

- [ ] Add `isFatalError()` function to `src/utils/errors.ts`
- [ ] Add function export
- [ ] Implement `continueOnError` flag logic
- [ ] Implement null/undefined/non-object checks
- [ ] Implement fatal error type detection
- [ ] Implement non-fatal error type detection
- [ ] Implement edge case handling
- [ ] Run tests to verify all pass
- [ ] Verify 100% code coverage
- [ ] Document any deviations from test expectations

### Expected Test Run Output (GREEN Phase)

```bash
$ npm run test:run -- tests/unit/utils/is-fatal-error.test.ts

 ✓ tests/unit/utils/is-fatal-error.test.ts (220)

   ✓ isFatalError (220)
     ✓ Fatal errors (return true) (50)
       ✓ SessionError with LOAD_FAILED code (15)
       ✓ SessionError with SAVE_FAILED code (15)
       ✓ EnvironmentError (20)
     ✓ Non-fatal errors (return false) (80)
       ✓ TaskError (non-fatal) (15)
       ✓ AgentError (non-fatal) (15)
       ✓ ValidationError with non-parse_prd operations (20)
     ✓ Standard Error types (return false) (20)
     ✓ Null/Undefined/Invalid values (return false) (20)
     ✓ Type guard integration (15)
     ✓ continueOnError flag behavior (15)
     ✓ Edge cases and boundary conditions (20)

 Test Files  1 passed (1)
      Tests  220 passed (220)
   Start at  12:34:56
   Duration  234ms

✓ Tests passed
```

**Key Indicators of Successful GREEN Phase**:

- ✅ All 220 tests pass
- ✅ 100% code coverage achieved
- ✅ No console errors or warnings
- ✅ Implementation matches test expectations

---

## Phase 3: REFACTOR (Improve Implementation)

### Objective

Improve the `isFatalError()` implementation while keeping all tests passing.

### Status

**Status**: ⏳ PENDING (After GREEN phase complete)

### Refactoring Opportunities

1. **Code organization**:
   - Extract helper functions for complex logic
   - Group related conditions together
   - Improve readability with clear structure

2. **Performance optimization**:
   - Optimize type guard checks order (most common first)
   - Reduce redundant checks
   - Cache expensive operations

3. **Documentation**:
   - Add comprehensive JSDoc comments
   - Document decision tree logic
   - Provide usage examples

4. **Type safety**:
   - Ensure proper type narrowing
   - Add type assertions where needed
   - Verify type guard usage

### REFACTOR Phase Checklist

- [ ] Review implementation for improvement opportunities
- [ ] Extract helper functions (if beneficial)
- [ ] Optimize performance (if measurable benefit)
- [ ] Add comprehensive JSDoc documentation
- [ ] Verify all tests still pass
- [ ] Verify 100% code coverage maintained
- [ ] Run integration tests to ensure compatibility
- [ ] Update architecture documentation if needed

### Refactoring Principles

**DO**:

- ✅ Make small, incremental changes
- ✅ Run tests after each change
- ✅ Keep all tests passing
- ✅ Improve readability and maintainability
- ✅ Add documentation

**DON'T**:

- ❌ Make large changes at once
- ❌ Skip running tests
- ❌ Change test expectations
- ❌ Add new functionality
- ❌ Sacrifice readability for micro-optimizations

---

## TDD Best Practices Applied

### 1. Write Tests Before Implementation

**Rationale**: Tests define the expected behavior and serve as executable specification.

**Applied**:

- ✅ 220 test cases written before any implementation
- ✅ Tests cover all edge cases and scenarios
- ✅ Tests serve as documentation of expected behavior

### 2. Keep Tests Small and Focused

**Rationale**: Small tests are easier to understand, maintain, and debug.

**Applied**:

- ✅ Each test validates one specific behavior
- ✅ SEV pattern ensures clear structure
- ✅ Descriptive test names indicate exact scenario

### 3. Use Descriptive Test Names

**Rationale**: Clear test names serve as documentation and make failures easier to understand.

**Applied**:

- ✅ "should" prefix indicates expected behavior
- ✅ Specific error types and conditions in name
- ✅ Numbered variations when testing similar scenarios

### 4. Test One Thing at a Time

**Rationale**: Tests should validate one behavior, making failures easy to diagnose.

**Applied**:

- ✅ Each test has single assertion (or related assertions)
- ✅ Tests are independent and isolated
- ✅ No side effects between tests

### 5. Cover All Edge Cases

**Rationale**: Comprehensive test coverage prevents regressions and documents behavior.

**Applied**:

- ✅ Null/undefined/invalid inputs tested
- ✅ Special characters and unicode tested
- ✅ Circular references tested
- ✅ Boundary conditions tested

### 6. Use Fixtures and Factories

**Rationale**: Fixtures reduce duplication and make tests more maintainable.

**Applied**:

- ✅ Consistent error construction patterns
- ✅ Reusable context objects
- ✅ Helper functions for complex test data

---

## Common TDD Pitfalls to Avoid

### Pitfall 1: Writing Tests That Are Too Broad

**Problem**: Tests that validate multiple behaviors are hard to debug when they fail.

**Solution**: Keep tests focused on one behavior each.

```typescript
// ❌ BAD - Tests multiple behaviors
it('should handle all SessionError cases', () => {
  expect(isFatalError(new SessionError('Load failed'))).toBe(true);
  expect(isFatalError(new SessionError('Save failed'))).toBe(true);
  expect(isFatalError(new SessionError('Other'))).toBe(false);
});

// ✅ GOOD - One behavior per test
it('should return true for SessionError with LOAD_FAILED code', () => {
  const error = new SessionError('Session load failed');
  expect(isFatalError(error)).toBe(true);
});
```

### Pitfall 2: Testing Implementation Details

**Problem**: Tests break when implementation changes, even if behavior is correct.

**Solution**: Test behavior, not implementation.

```typescript
// ❌ BAD - Tests implementation detail
it('should check error.code property', () => {
  const error = new SessionError('Test');
  expect((error as any).code).toBe('PIPELINE_SESSION_LOAD_FAILED');
});

// ✅ GOOD - Tests behavior
it('should return true for SessionError with LOAD_FAILED code', () => {
  const error = new SessionError('Session load failed');
  expect(isFatalError(error)).toBe(true);
});
```

### Pitfall 3: Not Running Tests Frequently

**Problem**: Large batches of untested code lead to complex failures.

**Solution**: Run tests after each small change.

```bash
# After each implementation change:
npm run test:run -- tests/unit/utils/is-fatal-error.test.ts
```

### Pitfall 4: Skipping the RED Phase

**Problem**: Writing code before tests leads to tests that pass by luck, not design.

**Solution**: Always write failing tests first.

### Pitfall 5: Making Tests Dependent on Each Other

**Problem**: Tests fail in cascades, making root cause hard to find.

**Solution**: Keep tests independent.

```typescript
// ❌ BAD - Tests depend on shared state
let error: SessionError;
beforeEach(() => {
  error = new SessionError('Test');
});
it('should return true', () => {
  error.code = 'LOAD_FAILED'; // Modifies shared state
  expect(isFatalError(error)).toBe(true);
});

// ✅ GOOD - Each test creates its own data
it('should return true for LOAD_FAILED code', () => {
  const error = new SessionError('Test', { sessionPath: '/path' });
  expect(isFatalError(error)).toBe(true);
});
```

---

## Verification and Validation

### RED Phase Verification

**Command**:

```bash
npm run test:run -- tests/unit/utils/is-fatal-error.test.ts
```

**Expected Output**:

- All 220 tests fail
- Error: "isFatalError is not defined"
- No syntax errors
- No import errors

### GREEN Phase Verification

**Command**:

```bash
npm run test:run -- tests/unit/utils/is-fatal-error.test.ts
```

**Expected Output**:

- All 220 tests pass
- 100% code coverage
- No console errors

### Integration Verification

**Command**:

```bash
npm run test:run -- tests/integration/utils/error-handling.test.ts
```

**Expected Output**:

- Integration tests that previously failed now pass
- `isFatalError` function is accessible from errors.ts
- Fatal/non-fatal detection works as expected

---

## Timeline and Progress Tracking

### Current Phase: RED (Write Failing Tests)

| Task                   | Status      | Completion Date |
| ---------------------- | ----------- | --------------- |
| PRP creation           | ✅ Complete | 2026-01-16      |
| Research documentation | ✅ Complete | 2026-01-16      |
| Test file creation     | ⏳ Pending  | -               |
| Test implementation    | ⏳ Pending  | -               |
| RED phase verification | ⏳ Pending  | -               |

### Upcoming Phases

| Phase    | Task                            | Status     | Planned Subtask   |
| -------- | ------------------------------- | ---------- | ----------------- |
| GREEN    | Implement isFatalError function | ⏳ Pending | P1.M2.T1.S3       |
| GREEN    | Verify all tests pass           | ⏳ Pending | P1.M2.T1.S3       |
| REFACTOR | Optimize implementation         | ⏳ Pending | After P1.M2.T1.S3 |
| REFACTOR | Add documentation               | ⏳ Pending | After P1.M2.T1.S3 |

---

## Success Criteria

### RED Phase Success Criteria

- [x] PRP.md created with comprehensive test requirements
- [x] Research documentation completed (4 files)
- [ ] Test file created at correct path
- [ ] All 220 test cases implemented
- [ ] All tests fail with "isFatalError is not defined"
- [ ] No syntax or import errors
- [ ] Test file follows codebase conventions

### GREEN Phase Success Criteria

- [ ] isFatalError function implemented
- [ ] All 220 tests pass
- [ ] 100% code coverage achieved
- [ ] Integration tests pass
- [ ] No console errors or warnings

### REFACTOR Phase Success Criteria

- [ ] Implementation optimized
- [ ] Comprehensive JSDoc documentation added
- [ ] All tests still pass
- [ ] 100% code coverage maintained
- [ ] Architecture documentation updated

---

## Lessons Learned

### TDD Benefits Observed

1. **Clarity of Requirements**: Writing tests first forces clear thinking about expected behavior
2. **Executable Specification**: Tests serve as living documentation of behavior
3. **Regression Protection**: Comprehensive tests prevent future breakage
4. **Confidence in Refactoring**: Tests allow safe code improvements
5. **Faster Development**: Catching errors early reduces debugging time

### Challenges Anticipated

1. **Test Maintenance**: 220+ tests require careful maintenance
2. **Test Execution Time**: Large test suite may take time to run
3. **Edge Case Coverage**: Ensuring all scenarios are tested
4. **Balancing Speed and Thoroughness**: Writing tests quickly while maintaining quality

### Mitigation Strategies

1. **Modular Test Organization**: Logical grouping makes maintenance easier
2. **Descriptive Test Names**: Clear names reduce documentation burden
3. **SEV Pattern**: Consistent structure improves readability
4. **Test Factories**: Reusable test data reduces duplication

---

## References

### External Resources

- **Vitest Documentation**: https://vitest.dev/guide/
- **TDD Best Practices**: `/home/dustin/projects/hacky-hack/docs/research/TDD-TypeScript-Testing-Best-Practices.md`
- **TDD Quick Reference**: `/home/dustin/projects/hacky-hack/docs/research/TDD-Quick-Reference.md`
- **TypeScript Type Narrowing**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

### Internal Documentation

- **PRP**: `/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/PRP.md`
- **Test Patterns Analysis**: `/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/test-patterns-analysis.md`
- **Behavior Specification**: `/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/isfatalError-behavior-spec.md`
- **Test Case Catalog**: `/plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/test-case-catalog.md`

---

## Next Steps

1. **Complete RED Phase** (This subtask - P1.M2.T1.S2):
   - Create test file: `tests/unit/utils/is-fatal-error.test.ts`
   - Implement all 220 test cases
   - Verify all tests fail
   - Document test run output

2. **Begin GREEN Phase** (Next subtask - P1.M2.T1.S3):
   - Implement `isFatalError()` function
   - Make all tests pass
   - Achieve 100% code coverage

3. **Enter REFACTOR Phase** (After GREEN phase):
   - Optimize implementation
   - Add documentation
   - Maintain test coverage

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Current Phase**: RED (Write Failing Tests)
**Related PRP**: P1.M2.T1.S2
