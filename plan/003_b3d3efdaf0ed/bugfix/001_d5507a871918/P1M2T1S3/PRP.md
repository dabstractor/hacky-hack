# PRP: Add Unit Tests for writeBugReport Method

---

## Goal

**Feature Goal**: Add comprehensive unit test coverage for the `writeBugReport` method in `BugHuntWorkflow` class to ensure proper file writing behavior, atomicity, and error handling.

**Deliverable**: New test suite in `tests/unit/workflows/bug-hunt-workflow.test.ts` (or new dedicated test file if separation preferred) covering all `writeBugReport` behaviors.

**Success Definition**:

- All tests pass with 100% coverage of `writeBugReport` method
- Tests verify file is written atomically using temp file + rename pattern
- Tests verify correct behavior for all bug severity combinations
- Tests verify proper error handling and propagation
- Code follows existing test patterns in the codebase

## User Persona (if applicable)

**Target User**: Development team / QA engineers validating bug report persistence functionality

**Use Case**: Ensuring that bug reports are correctly persisted to disk when critical or major bugs are found during bug hunting workflow

**User Journey**:

1. BugHuntWorkflow completes bug analysis
2. If critical/major bugs found, `writeBugReport` is called
3. Method validates input, checks severity, writes TEST_RESULTS.md atomically
4. Tests verify this process works correctly in all scenarios

**Pain Points Addressed**:

- Uncertainty about when TEST_RESULTS.md file is written
- Risk of corrupted/incomplete bug reports due to non-atomic writes
- Lack of visibility into error conditions during file operations

## Why

- **Integration with Bug Fix Pipeline**: The `writeBugReport` method is critical for the bug fix sub-pipeline - it creates the TEST_RESULTS.md file that signals whether bugs need fixing
- **Reliability**: Tests ensure bug reports are written correctly and atomically, preventing data loss or corruption
- **Regression Prevention**: Future changes to file handling logic won't break the critical bug reporting workflow
- **Code Quality**: Comprehensive test coverage ensures the method handles edge cases and error conditions properly

## What

Add unit tests for the `writeBugReport` method covering:

- Input validation (sessionPath requirements)
- Conditional writing based on bug severity
- Atomic file write pattern (temp file + rename)
- Zod schema validation
- Error handling and propagation
- Logging behavior

### Success Criteria

- [ ] All existing `writeBugReport` tests pass (currently exist in test file at lines 999-1296)
- [ ] New tests cover atomic write pattern explicitly
- [ ] Tests verify temp file creation and rename behavior
- [ ] Tests verify cleanup behavior on errors
- [ ] Mock cleanup properly implemented (afterEach)
- [ ] Test coverage for `writeBugReport` reaches 100%

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

✅ **YES** - All necessary context provided below including:

- Existing test file with current `writeBugReport` tests
- Implementation details of `writeBugReport` method
- Test patterns used throughout codebase
- Mock patterns for fs operations
- Factory functions for test data
- Validation requirements from architecture docs

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: tests/unit/workflows/bug-hunt-workflow.test.ts
  why: Contains existing writeBugReport tests (lines 999-1296) that need to be reviewed and potentially enhanced
  pattern: Factory functions (createTestBug, createTestResults), mock setup, vi.mock() usage, test structure
  gotcha: Tests already exist for writeBugReport - this task may be about ENHANCING existing tests or ensuring they're comprehensive

- file: src/workflows/bug-hunt-workflow.ts
  why: Contains writeBugReport implementation (lines 323-385) - the method under test
  pattern: Public async method with input validation, severity checking, Zod validation, atomicWrite call
  gotcha: Method uses atomicWrite utility from session-utils.ts, not direct fs operations

- file: src/core/session-utils.ts
  why: Contains atomicWrite implementation (lines 98-182) that writeBugReport calls
  pattern: Atomic write with temp file + rename, error handling, logging
  gotcha: atomicWrite creates temp file with random suffix, writes content, then renames atomically

- file: src/core/models.ts
  why: Contains TestResults interface (lines 1838-1879) and BugSeverity type (lines 1647-1685)
  pattern: TestResults has hasBugs, bugs array, summary, recommendations; BugSeverity enum
  gotcha: Severity levels: critical, major, minor, cosmetic

- file: tests/setup.ts
  why: Global test setup with beforeEach/afterEach hooks for mock cleanup
  pattern: vi.clearAllMocks(), unhandled rejection tracking, gc cleanup
  gotcha: All tests inherit this setup - don't duplicate global cleanup

- file: vitest.config.ts
  why: Test runner configuration
  pattern: 100% coverage thresholds, v8 provider, Node environment
  gotcha: Coverage is enforced - tests must achieve 100% for writeBugReport

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/002_external_dependencies.md
  why: Section §5 "Testing Patterns for Constructor Changes" provides testing best practices
  section: Lines 939-1163
  critical: Mock factory patterns, validation testing, backwards compatibility testing

- docfile: plan/003_b3d3efdaf0ed/docs/atomic-operations-testing.md
  why: Specific guidance for testing atomic file operations
  critical: How to test temp file creation, rename operations, cleanup on errors

- url: https://vitest.dev/api/mock.html
  why: vi.mock() documentation for mocking fs modules
  critical: Understanding hoisted mocks, vi.hoisted(), mock timing

- url: https://vitest.dev/guide/#testing
  why: General Vitest testing patterns and best practices
  critical: Test structure, assertion patterns, async testing
```

### Current Codebase Tree

```bash
tests/
├── unit/
│   ├── workflows/
│   │   └── bug-hunt-workflow.test.ts  # EXISTING - Contains writeBugReport tests (lines 999-1296)
│   └── core/
│       └── session-state-batching.test.ts  # REFERENCE - File system operation testing patterns
├── integration/
│   └── bug-hunt-workflow-integration.test.ts  # REFERENCE - Integration testing patterns
├── fixtures/  # Test data fixtures
└── setup.ts   # Global test setup with beforeEach/afterEach

src/
├── workflows/
│   └── bug-hunt-workflow.ts  # IMPLEMENTATION - writeBugReport method (lines 323-385)
├── core/
│   ├── models.ts  # TestResults interface, BugSeverity enum
│   └── session-utils.ts  # atomicWrite utility function
```

### Desired Codebase Tree with Files to be Added

```bash
# No new files needed - enhance existing test file
tests/
├── unit/
│   └── workflows/
│       └── bug-hunt-workflow.test.ts  # MODIFY - Add/enhance writeBugReport tests
└── fixtures/
    └── test-results-fixtures.ts  # OPTIONAL - Create if test fixtures become complex
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Vitest mock hoisting
// Mocks MUST be hoisted at top of file before imports
vi.mock('../../../src/core/session-utils.js', () => ({
  atomicWrite: vi.fn(),
}));

// CRITICAL: Use vi.hoisted() for mock variables that need to be configured before mocking
const mockAtomicWrite = vi.hoisted(() => ({
  atomicWrite: vi.fn(),
}));

// CRITICAL: Mock setup in beforeEach clears previous mock behavior
beforeEach(() => {
  vi.clearAllMocks();
  mockAtomicWrite.mockResolvedValue(undefined);
});

// CRITICAL: atomicWrite is already mocked in existing test file (line 28-30)
// DO NOT create duplicate mock - use existing mockAtomicWrite

// CRITICAL: Test file already has factory functions (lines 42-80)
// createTestBug(), createTestResults() - USE THESE, don't create new ones

// CRITICAL: writeBugReport tests ALREADY EXIST (lines 999-1296)
// Review existing tests first before adding new ones
// Possible gaps: atomic write pattern verification, temp file behavior, cleanup verification

// CRITICAL: Global setup.ts already handles mock cleanup
// Don't duplicate cleanup logic in individual tests

// CRITICAL: 100% code coverage is enforced in vitest.config.ts
// Tests must cover all branches of writeBugReport method

// CRITICAL: TestResultsSchema Zod validation is called in writeBugReport
// Tests should verify schema validation works correctly

// CRITICAL: Method uses resolve() from 'node:path' for path construction
// Verify path construction uses resolve(sessionPath, 'TEST_RESULTS.md')

// CRITICAL: atomicWrite creates temp file then renames - not direct write
// Test should verify this pattern if atomicWrite implementation is being tested
```

## Implementation Blueprint

### Data models and structure

No new models needed - using existing TestResults and Bug interfaces:

```typescript
// From src/core/models.ts
interface TestResults {
  readonly hasBugs: boolean;
  readonly bugs: Bug[];
  readonly summary: string;
  readonly recommendations: string[];
}

type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: REVIEW EXISTING TESTS
  - LOCATE: tests/unit/workflows/bug-hunt-workflow.test.ts lines 999-1296
  - ANALYZE: Current writeBugReport test coverage
  - IDENTIFY: Gaps in testing (atomic write pattern, temp file behavior, cleanup)
  - DOCUMENT: What tests exist vs what's needed

Task 2: IDENTIFY TEST GAPS (After review)
  - CHECK: Are atomic write patterns explicitly tested?
  - CHECK: Is temp file creation/rename behavior verified?
  - CHECK: Is cleanup on errors tested?
  - CHECK: Are all bug severity combinations tested?
  - CHECK: Is Zod schema validation thoroughly tested?

Task 3: CREATE/ENHANCE TEST FIXTURES (if needed)
  - FILE: tests/fixtures/test-results-fixtures.ts (OPTIONAL - only if complex)
  - OR: Use existing factory functions in bug-hunt-workflow.test.ts
  - IMPLEMENT: Fixtures for various TestResults scenarios
  - FOLLOW: Existing createTestResults, createTestBug patterns (lines 42-80)
  - NAMING: Descriptive fixture names (e.g., resultsWithCriticalBugs, resultsWithOnlyMinorBugs)

Task 4: WRITE ATOMIC WRITE PATTERN TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport atomic write pattern'
  - IMPLEMENT: Test verifying temp file write then rename sequence
  - VERIFY: atomicWrite is called with correct path and content
  - VERIFY: Method uses resolve() for path construction
  - FOLLOW: Pattern from session-state-batching.test.ts for atomic operations
  - REFERENCE: atomic-operations-testing.md guidance

Task 5: WRITE SEVERITY-BASED CONDITIONAL WRITE TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport conditional writing based on severity'
  - IMPLEMENT: 'should write when critical bugs present'
  - IMPLEMENT: 'should write when major bugs present'
  - IMPLEMENT: 'should not write when only minor bugs'
  - IMPLEMENT: 'should not write when only cosmetic bugs'
  - IMPLEMENT: 'should not write when bugs array empty'
  - VERIFY: mockAtomicWrite called/not called appropriately
  - FOLLOW: Existing test patterns in file (lines 1032-1067)

Task 6: WRITE INPUT VALIDATION TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport input validation'
  - IMPLEMENT: 'should throw when sessionPath is empty'
  - IMPLEMENT: 'should throw when sessionPath is whitespace only'
  - IMPLEMENT: 'should throw when sessionPath is not a string'
  - VERIFY: Error messages match implementation
  - FOLLOW: Existing validation test patterns (lines 1000-1030)

Task 7: WRITE ZOD SCHEMA VALIDATION TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport TestResultsSchema validation'
  - IMPLEMENT: 'should throw when TestResults missing required fields'
  - IMPLEMENT: 'should throw when TestResults has invalid bug structure'
  - IMPLEMENT: 'should accept valid TestResults'
  - VERIFY: Schema validation error messages
  - FOLLOW: Existing validation test patterns (lines 1226-1242)

Task 8: WRITE ERROR HANDLING TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport error handling'
  - IMPLEMENT: 'should throw descriptive error when atomicWrite fails'
  - IMPLEMENT: 'should log error details when write fails'
  - IMPLEMENT: 'should propagate atomicWrite errors with context'
  - VERIFY: Error includes path and original error message
  - VERIFY: Error logging occurs
  - FOLLOW: Existing error handling patterns (lines 1196-1224)

Task 9: WRITE LOGGING BEHAVIOR TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport logging behavior'
  - IMPLEMENT: 'should log skip when no critical/major bugs'
  - IMPLEMENT: 'should log writing with correct metadata'
  - IMPLEMENT: 'should log success after write'
  - IMPLEMENT: 'should log bug counts by severity'
  - VERIFY: Log messages match implementation expectations
  - SPY: (workflow as any).correlationLogger.info/error
  - FOLLOW: Existing logging patterns (lines 1161-1194)

Task 10: WRITE PATH CONSTRUCTION TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport path construction'
  - IMPLEMENT: 'should resolve sessionPath correctly'
  - IMPLEMENT: 'should append TEST_RESULTS.md to sessionPath'
  - IMPLEMENT: 'should handle absolute paths'
  - IMPLEMENT: 'should handle relative paths'
  - VERIFY: Correct path passed to atomicWrite
  - FOLLOW: Existing path test patterns (lines 1115-1134)

Task 11: WRITE EDGE CASE TESTS
  - TARGET: tests/unit/workflows/bug-hunt-workflow.test.ts
  - DESCRIBE: 'writeBugReport edge cases'
  - IMPLEMENT: 'should handle mixed severity bugs correctly'
  - IMPLEMENT: 'should handle empty recommendations array'
  - IMPLEMENT: 'should handle long summary text'
  - IMPLEMENT: 'should handle special characters in summary'
  - VERIFY: All edge cases handled gracefully

Task 12: VERIFY TEST COVERAGE
  - RUN: uv run vitest --coverage tests/unit/workflows/bug-hunt-workflow.test.ts
  - VERIFY: 100% coverage for writeBugReport method
  - CHECK: All branches covered
  - CHECK: All lines covered
  - REPORT: Coverage report meets project standards
```

### Implementation Patterns & Key Details

```typescript
// EXISTING MOCK PATTERN - Use this, don't recreate
// File: tests/unit/workflows/bug-hunt-workflow.test.ts (lines 28-30)
vi.mock('../../../src/core/session-utils.js', () => ({
  atomicWrite: vi.fn(),
}));

import { atomicWrite } from '../../../src/core/session-utils.js';
const mockAtomicWrite = atomicWrite as any;

// TEST STRUCTURE PATTERN - Follow this
describe('writeBugReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAtomicWrite.mockResolvedValue(undefined);
  });

  describe('atomic write pattern', () => {
    it('should write file atomically using atomicWrite', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const testResults = createTestResults(
        true,
        [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Rep')],
        'Found bugs',
        ['Fix']
      );
      const sessionPath = '/path/to/session';

      // EXECUTE
      await workflow.writeBugReport(sessionPath, testResults);

      // VERIFY - atomicWrite called with correct parameters
      const expectedPath = '/path/to/session/TEST_RESULTS.md';
      const expectedContent = JSON.stringify(testResults, null, 2);
      expect(mockAtomicWrite).toHaveBeenCalledWith(
        expectedPath,
        expectedContent
      );
    });

    // GOTCHA: atomicWrite implementation handles temp file + rename internally
    // If testing the atomicWrite utility itself, need to mock fs/promises
    // For writeBugReport tests, we verify atomicWrite is called correctly
    // The internal temp file behavior is tested in session-utils tests
  });

  describe('conditional writing based on severity', () => {
    it('should write TEST_RESULTS.md when critical bugs found', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const testResults = createTestResults(
        true,
        [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Rep')],
        'Found bugs',
        ['Fix']
      );

      // EXECUTE
      await workflow.writeBugReport('/path/to/session', testResults);

      // VERIFY
      expect(mockAtomicWrite).toHaveBeenCalled();
    });

    it('should not write TEST_RESULTS.md when only minor bugs', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const testResults = createTestResults(
        false,
        [createTestBug('BUG-001', 'minor', 'Bug', 'Desc', 'Rep')],
        'Found minor bugs',
        ['Fix']
      );

      // EXECUTE
      await workflow.writeBugReport('/path/to/session', testResults);

      // VERIFY
      expect(mockAtomicWrite).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error if write fails', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const testResults = createTestResults(
        true,
        [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Rep')],
        'Found bugs',
        ['Fix']
      );
      mockAtomicWrite.mockRejectedValue(new Error('EACCES: permission denied'));

      // EXECUTE & VERIFY
      await expect(
        workflow.writeBugReport('/path/to/session', testResults)
      ).rejects.toThrow('Failed to write bug report');
    });
  });

  // CRITICAL: Clean up mocks in afterEach is handled by global setup.ts
  // Don't duplicate - global setup already calls vi.clearAllMocks()
});
```

### Integration Points

```yaml
MOCKS:
  - use: mockAtomicWrite from existing test file (lines 28-30, 40)
  - pattern: vi.mock('../../../src/core/session-utils.js')
  - gotcha: Don't create duplicate mock - use existing

TEST DATA:
  - use: createTestBug factory (lines 56-68)
  - use: createTestResults factory (lines 70-80)
  - pattern: Factory functions in test file
  - gotcha: Use existing factories, don't create new ones

LOGGING:
  - spy: (workflow as any).correlationLogger.info/error
  - pattern: vi.spyOn for logger verification
  - gotcha: Logger is private property, use (workflow as any)

PATHS:
  - verify: resolve(sessionPath, 'TEST_RESULTS.md') construction
  - pattern: Path matching with expect.any(String) for content
  - gotcha: Content is JSON.stringify(testResults, null, 2)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after test file modifications - fix before proceeding
npm run test:lint -- tests/unit/workflows/bug-hunt-workflow.test.ts
# OR
uv run vitest run tests/unit/workflows/bug-hunt-workflow.test.ts --reporter=verbose

# Format check
npm run format
# OR
uv run prettier --check tests/unit/workflows/bug-hunt-workflow.test.ts

# Type check
npm run typecheck
# OR
uv run tsc --noEmit

# Expected: Zero errors. Fix linting/formatting/type errors before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test only writeBugReport tests
uv run vitest run tests/unit/workflows/bug-hunt-workflow.test.ts -t "writeBugReport"

# Test entire BugHuntWorkflow test suite
uv run vitest run tests/unit/workflows/bug-hunt-workflow.test.ts

# Run with coverage
uv run vitest run tests/unit/workflows/bug-hunt-workflow.test.ts --coverage

# Coverage validation (should be 100% for writeBugReport)
uv run vitest run --coverage --reporter=verbose

# Expected: All tests pass. Coverage shows 100% for writeBugReport method.
# If failing or coverage < 100%, debug and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all workflow tests to ensure no regression
uv run vitest run tests/unit/workflows/

# Run integration tests
uv run vitest run tests/integration/bug-hunt-workflow-integration.test.ts

# Full test suite for affected areas
uv run vitest run tests/unit/

# Expected: All tests pass, no regressions introduced.
```

### Level 4: Domain-Specific Validation

```bash
# Vitest-specific validation

# Run tests with watch mode during development
uv run vitest watch tests/unit/workflows/bug-hunt-workflow.test.ts

# Run tests with UI for detailed inspection
uv run vitest --ui tests/unit/workflows/bug-hunt-workflow.test.ts

# Profile test performance
uv run vitest run tests/unit/workflows/bug-hunt-workflow.test.ts --reporter=verbose

# Verify test isolation (run multiple times)
for i in {1..5}; do
  uv run vitest run tests/unit/workflows/bug-hunt-workflow.test.ts -t "writeBugReport"
done

# Expected: Tests pass consistently across multiple runs, no flakiness detected.
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All writeBugReport tests pass: `uv run vitest run tests/unit/workflows/bug-hunt-workflow.test.ts -t "writeBugReport"`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format`
- [ ] Test coverage for writeBugReport is 100%

### Feature Validation

- [ ] Atomic write pattern verified in tests
- [ ] Conditional writing based on severity tested
- [ ] Input validation (sessionPath) tested
- [ ] Zod schema validation tested
- [ ] Error handling and propagation tested
- [ ] Logging behavior verified
- [ ] Path construction tested
- [ ] Edge cases covered

### Code Quality Validation

- [ ] Follows existing test patterns from bug-hunt-workflow.test.ts
- [ ] Uses existing factory functions (createTestBug, createTestResults)
- [ ] Uses existing mock setup (mockAtomicWrite)
- [ ] Tests follow SETUP/EXECUTE/VERIFY pattern
- [ ] Test descriptions are clear and descriptive
- [ ] No duplicate mock setup
- [ ] Proper test organization (describe blocks)

### Documentation & Deployment

- [ ] Test file has clear JSDoc comments
- [ ] Complex test scenarios have explanatory comments
- [ ] Test fixtures are well-documented (if created)
- [ ] Test coverage report meets project standards

---

## Anti-Patterns to Avoid

- ❌ Don't create duplicate mocks for atomicWrite (use existing at lines 28-30)
- ❌ Don't create new factory functions when createTestResults/createTestBug exist
- ❌ Don't duplicate beforeEach cleanup logic (handled by global setup.ts)
- ❌ Don't test atomicWrite implementation details (that's in session-utils tests)
- ❌ Don't use sync assertions for async operations
- ❌ Don't catch all exceptions - be specific in error test expectations
- ❌ Don't skip edge case testing (mixed severities, empty arrays, etc.)
- ❌ Don't ignore coverage requirements - must achieve 100%
- ❌ Don't write tests that depend on execution order
- ❌ Don't use hardcoded file paths - use test fixtures

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:

- ✅ Comprehensive context provided with specific file references and line numbers
- ✅ Existing tests identified and analyzed (lines 999-1296)
- ✅ Mock patterns and factory functions documented
- ✅ Test patterns from codebase clearly specified
- ✅ Validation gates with executable commands
- ✅ Architecture documentation referenced
- ⚠️ Minor uncertainty: Whether task is enhancement of existing tests or ensuring completeness (rated 9 instead of 10)

**Validation**: The PRP provides everything needed for an AI agent to implement comprehensive test coverage for the writeBugReport method, with specific references to existing code, patterns to follow, and validation commands to verify success.
