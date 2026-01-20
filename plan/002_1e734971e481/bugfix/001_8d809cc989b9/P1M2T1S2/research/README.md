# P1.M2.T1.S2 Research Directory

**Subtask**: Write failing tests for isFatalError function
**Phase**: RED (Write Failing Tests)
**Date**: 2026-01-16

---

## Overview

This directory contains comprehensive research and documentation for implementing failing tests for the `isFatalError()` function following TDD methodology.

---

## Research Documents

### 1. test-patterns-analysis.md

**Purpose**: Analyzes existing test patterns and conventions in the codebase.

**Contents**:
- Test file structure patterns
- Import patterns (ESM with .js extension)
- SEV (Setup-Execute-Verify) pattern
- Test naming conventions
- Assertion patterns
- Error testing patterns
- Setup and teardown patterns
- Mock and spy patterns
- Edge case testing patterns
- Type narrowing test patterns

**When to use**: Reference this when writing the test file to ensure consistency with existing codebase patterns.

**Key insights**:
- All imports must use `.js` extension (ESM module resolution)
- Follow SEV pattern for all tests
- Use "should" prefix for test descriptions
- Use nested describe blocks for logical grouping

---

### 2. isfatalError-behavior-spec.md

**Purpose**: Complete specification of isFatalError function behavior.

**Contents**:
- Function signature
- Decision tree (ASCII art)
- Fatal error conditions (return TRUE)
- Non-fatal error conditions (return FALSE)
- Dependencies (type guards, error codes)
- Special cases and edge conditions
- Integration with pipeline behavior

**When to use**: Reference this when writing test assertions to ensure correct expected behavior.

**Key insights**:
- Fatal: SessionError (LOAD_FAILED/SAVE_FAILED), EnvironmentError, parse_prd ValidationError
- Non-fatal: TaskError, AgentError, other ValidationError, standard errors
- continueOnError flag overrides all other logic when true
- Always use optional chaining for context property access

---

### 3. test-case-catalog.md

**Purpose**: Complete catalog of all 220 test cases to implement.

**Contents**:
- 50 fatal error test cases with code examples
- 80 non-fatal error test cases with code examples
- 20 standard error test cases with code examples
- 20 null/undefined/invalid test cases with code examples
- 15 type guard integration test cases with code examples
- 15 continueOnError flag test cases with code examples
- 20 edge case test cases with code examples

**When to use**: Use this as the implementation checklist when writing the test file.

**Key insights**:
- Each test case includes complete code example
- Tests are organized by category for systematic implementation
- Total of 220 test cases for comprehensive coverage

---

### 4. tdd-implementation-notes.md

**Purpose**: Documents TDD methodology and implementation notes.

**Contents**:
- TDD Red-Green-Refactor cycle overview
- RED phase checklist and verification
- GREEN phase strategy and checklist
- REFACTOR phase opportunities and checklist
- TDD best practices applied
- Common TDD pitfalls to avoid
- Timeline and progress tracking
- Success criteria for each phase

**When to use**: Reference this throughout the TDD cycle to stay on track.

**Key insights**:
- Current phase: RED (write failing tests)
- All tests must fail initially (isFatalError doesn't exist)
- Run tests frequently during implementation
- Keep tests small and focused

---

## Quick Start Guide

### Step 1: Read the PRP

Start with the main PRP document:
```bash
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/PRP.md
```

This provides the complete context, requirements, and implementation blueprint.

### Step 2: Review Test Patterns

Read the test patterns analysis:
```bash
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/test-patterns-analysis.md
```

This shows how to structure tests following existing codebase conventions.

### Step 3: Understand Expected Behavior

Read the behavior specification:
```bash
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/isfatalError-behavior-spec.md
```

This defines exactly what isFatalError should do.

### Step 4: Implement Test Cases

Use the test case catalog as your checklist:
```bash
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/test-case-catalog.md
```

This provides all 220 test cases with complete code examples.

### Step 5: Follow TDD Methodology

Reference the TDD implementation notes:
```bash
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/research/tdd-implementation-notes.md
```

This guides you through the Red-Green-Refactor cycle.

---

## File Structure

```
plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S2/
├── PRP.md                                    # Main PRP document
└── research/
    ├── README.md                             # This file
    ├── test-patterns-analysis.md             # Existing test patterns
    ├── isfatalError-behavior-spec.md         # Function behavior specification
    ├── test-case-catalog.md                  # Complete test case catalog (220 tests)
    └── tdd-implementation-notes.md           # TDD methodology notes
```

---

## Key References

### Source Files

- **Error Classes**: `/src/utils/errors.ts`
- **Existing Implementation**: `/src/workflows/prp-pipeline.ts` (lines 377-417)
- **Architecture Doc**: `/plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md`
- **Integration Tests**: `/tests/integration/utils/error-handling.test.ts`

### Test References

- **Test Pattern Example**: `/tests/unit/utils/errors.test.ts`
- **EnvironmentError Tests**: `/tests/unit/utils/errors-environment.test.ts`
- **Vitest Config**: `/vitest.config.ts`
- **Test Setup**: `/tests/setup.ts`

### External Research

- **TDD Best Practices**: `/docs/research/TDD-TypeScript-Testing-Best-Practices.md`
- **TDD Quick Reference**: `/docs/research/TDD-Quick-Reference.md`
- **Vitest Documentation**: https://vitest.dev/guide/

---

## Implementation Checklist

### RED Phase (This Subtask)

- [ ] Read PRP.md
- [ ] Read all research documents
- [ ] Create test file: `tests/unit/utils/is-fatal-error.test.ts`
- [ ] Write comprehensive header documentation
- [ ] Import all error classes and type guards
- [ ] Implement all 220 test cases
- [ ] Follow SEV pattern for all tests
- [ ] Use "should" prefix for test descriptions
- [ ] Run tests to verify all fail
- [ ] Document test run output

### GREEN Phase (Next Subtask - P1.M2.T1.S3)

- [ ] Implement `isFatalError()` function
- [ ] Add function export to errors.ts
- [ ] Run tests frequently during implementation
- [ ] Make all 220 tests pass
- [ ] Achieve 100% code coverage
- [ ] Run integration tests

### REFACTOR Phase (After GREEN)

- [ ] Review implementation for improvements
- [ ] Optimize performance (if beneficial)
- [ ] Add comprehensive JSDoc documentation
- [ ] Verify all tests still pass
- [ ] Update architecture documentation

---

## Success Criteria

### RED Phase Success

- ✅ All research documents completed
- ⏳ Test file created
- ⏳ All 220 tests implemented
- ⏳ All tests fail with "isFatalError is not defined"
- ⏳ No syntax or import errors

### GREEN Phase Success

- ⏳ isFatalError function implemented
- ⏳ All 220 tests pass
- ⏳ 100% code coverage
- ⏳ Integration tests pass

---

## Common Questions

**Q: Why so many tests (220+)?**

A: The project enforces 100% code coverage. Comprehensive test coverage ensures all branches, edge cases, and scenarios are validated. This prevents regressions and serves as executable documentation.

**Q: Do I need to write all tests before implementing the function?**

A: Yes, this is the TDD "red" phase. Writing all tests first ensures you have a complete specification before writing any implementation code.

**Q: What if a test passes in the red phase?**

A: If a test passes when it should fail, something is wrong. Check that:
1. The `isFatalError` function doesn't exist yet
2. The test is calling `isFatalError` correctly
3. The test expectations are correct

**Q: Can I skip some test variations?**

A: No, all 220 test cases are required to achieve 100% code coverage and validate all edge cases. Each test validates a unique scenario.

**Q: How long should the red phase take?**

A: The red phase is primarily writing test code, which is straightforward with the detailed test case catalog. Most of the time should be spent ensuring tests are well-structured and follow codebase conventions.

---

## Support and Troubleshooting

### Test Won't Fail

**Problem**: Test passes when it should fail.

**Solution**:
1. Verify `isFatalError` function doesn't exist
2. Check import path is correct (use `.js` extension)
3. Verify test is calling `isFatalError` function
4. Check test expectations are correct

### Import Errors

**Problem**: Import fails with module not found error.

**Solution**:
1. Use `.js` extension in import path (ESM requirement)
2. Verify path is correct relative to test file location
3. Check that errors.ts exports the needed classes/functions

### Syntax Errors

**Problem**: TypeScript syntax errors in test file.

**Solution**:
1. Run `npm run typecheck` to see all syntax errors
2. Verify correct import syntax
3. Check for missing type annotations
4. Ensure error classes are imported correctly

---

## Summary

This research directory provides everything needed to implement comprehensive failing tests for the `isFatalError()` function:

1. **PRP.md** - Complete requirements and context
2. **test-patterns-analysis.md** - How to write tests following codebase conventions
3. **isfatalError-behavior-spec.md** - What the function should do
4. **test-case-catalog.md** - All 220 test cases with code examples
5. **tdd-implementation-notes.md** - How to follow TDD methodology

Follow the Quick Start Guide to implement the test suite systematically.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Current Phase**: RED (Write Failing Tests)
**Related PRP**: P1.M2.T1.S2
