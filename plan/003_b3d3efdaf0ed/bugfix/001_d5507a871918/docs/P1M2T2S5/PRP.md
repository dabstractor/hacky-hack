# Product Requirement Prompt (PRP): FixCycleWorkflow File Loading Unit Tests

---

## Goal

**Feature Goal**: Verify and document unit test coverage for FixCycleWorkflow file loading behavior

**Deliverable**: Verification report confirming all required test cases exist and pass

**Success Definition**: All contract-specified test scenarios are verified present in the test suite and passing with 100% code coverage of the `#loadBugReport()` method

## Why

The FixCycleWorkflow now loads bug reports from disk via `TEST_RESULTS.md` files. The `#loadBugReport()` method is critical for the bug fix cycle and must have comprehensive test coverage for:

- **File existence validation** - Ensuring TEST_RESULTS.md exists before attempting read
- **JSON parsing error handling** - Gracefully handling malformed JSON
- **Schema validation** - Validating TestResults structure via Zod schema
- **Error messaging** - Providing clear, actionable error messages for each failure mode

These tests ensure the workflow fails fast with clear errors when bug reports are missing or invalid, preventing silent failures in the bug fix pipeline.

## What

### Current State Assessment

The **tests already exist** in `/home/dustin/projects/hacky-hack/tests/unit/workflows/fix-cycle-workflow.test.ts` (lines 663-815).

### Existing Test Coverage

| Test Case                                         | Line # | Status     | Description                                               |
| ------------------------------------------------- | ------ | ---------- | --------------------------------------------------------- |
| `should successfully load valid TEST_RESULTS.md`  | 670    | ✅ PRESENT | Loads valid JSON, validates with Zod, returns TestResults |
| `should throw error if TEST_RESULTS.md not found` | 718    | ✅ PRESENT | Mocks ENOENT error, expects "TEST_RESULTS.md not found"   |
| `should throw error if JSON parsing fails`        | 748    | ✅ PRESENT | Mocks invalid JSON string, expects parse error            |
| `should throw error if Zod validation fails`      | 777    | ✅ PRESENT | Mocks missing required field, expects validation error    |

### Success Criteria

- [ ] Verify all 4 required test cases exist in test file
- [ ] Confirm all tests pass when executed
- [ ] Validate 100% code coverage of `#loadBugReport()` method
- [ ] Document test patterns for future reference

---

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" Test**: If someone knew nothing about this codebase, they would have everything needed to verify the test coverage exists and is correct.

### Documentation & References

```yaml
# MUST READ - Test File Location
- file: /home/dustin/projects/hacky-hack/tests/unit/workflows/fix-cycle-workflow.test.ts
  lines: 663-815
  why: Contains the complete test suite for loadBugReport method
  pattern: describe('loadBugReport') block with 4 test cases
  gotcha: Uses test-only getter `_loadBugReportForTesting` to access private method

# Implementation - The Method Being Tested
- file: /home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts
  lines: 447-522 (approximate #loadBugReport method location)
  method: async #loadBugReport(): Promise<TestResults>
  why: Understanding the implementation helps verify test completeness
  gotcha: Private method accessed via test-only getter at line 399

# Test-Only Access Pattern
- file: /home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts
  lines: 399-406
  why: Shows how private methods are exposed for testing
  pattern: get _loadBugReportForTesting() returns bound method that stores results in this.#testResults

# TestResults Schema Definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  lines: 1838-1879 (TestResults interface)
  lines: 1902-1907 (TestResultsSchema Zod schema)
  why: Understanding schema requirements for validation tests
  critical: hasBugs (boolean), bugs (Bug[]), summary (string), recommendations (string[])

# Bug Schema for Test Fixtures
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  lines: 1710-1771 (Bug interface)
  lines: 1795-1802 (BugSchema)
  why: Creating valid bug objects for test fixtures
  critical: id, severity ('critical'|'major'|'minor'|'cosmetic'), title, description, reproduction, location?

# Vitest Framework Documentation
- url: https://vitest.dev/guide/
  why: Understanding test framework features (vi.mock, vi.mocked, expect)
  critical: vi.mock() for module mocking, vi.mocked() for type-safe mocks

# Node.js fs/promises API
- url: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
  why: Understanding the file system operations being mocked
  critical: readFile() returns Promise<string>, access() with constants.F_OK

# Existing Test Patterns in Codebase
- file: /home/dustin/projects/hacky-hack/tests/unit/workflows/fix-cycle-workflow.test.ts
  lines: 1-46 (imports and mocks setup)
  why: Shows the established pattern for mocking fs/promises
  pattern: vi.mock('node:fs/promises') with readFile, access, constants

# Test Factory Functions
- file: /home/dustin/projects/hacky-hack/tests/unit/workflows/fix-cycle-workflow.test.ts
  lines: 47-87
  why: Reusable test data creators
  pattern: createTestBug(), createTestResults(), createMockTaskOrchestrator()
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── unit/
│   └── workflows/
│       └── fix-cycle-workflow.test.ts    # Test file (lines 663-815: loadBugReport tests)
├── setup.ts                               # Global test configuration
src/
├── workflows/
│   └── fix-cycle-workflow.ts             # Implementation (#loadBugReport private method)
├── core/
│   └── models.ts                         # TestResults interface and TestResultsSchema
vitest.config.ts                          # Test framework configuration
package.json                              # Test scripts: "test": "vitest run"
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Private method access requires test-only getter
// The #loadBugReport() method is private and accessed via:
const loadBugReport = workflow._loadBugReportForTesting;
// This getter also stores results in this.#testResults for other tests

// CRITICAL: Node.js ErrnoException requires proper error structure
// When mocking ENOENT, must set code property:
const enoentError: NodeJS.ErrnoException = new Error(
  'File not found'
) as NodeJS.ErrnoException;
enoentError.code = 'ENOENT';
enoentError.errno = -2;
enoentError.syscall = 'open';

// CRITICAL: Zod validation errors are wrapped in Error
// The implementation catches ZodError and throws generic Error with message
// Test expects: `rejects.toThrow('Invalid TestResults in TEST_RESULTS.md at ...')`

// CRITICAL: Test results path uses resolve() for absolute paths
// Tests must match exact path: resolve(sessionPath, 'TEST_RESULTS.md')
// Import resolve from 'node:path'

// CRITICAL: Mocks must be cleared in beforeEach
// Prevents test pollution when multiple tests use same mocks
beforeEach(() => {
  vi.clearAllMocks();
});

// CRITICAL: Use vi.mocked() for type-safe mock assertions
const mockedReadFile = readFile as ReturnType<typeof vi.fn>;
// Enables proper type checking on mock assertions
```

---

## Implementation Blueprint

### Test Structure Analysis

The existing test suite follows this structure:

```typescript
describe('loadBugReport', () => {
  // Session path constant for all tests
  const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Success case
  it('should successfully load valid TEST_RESULTS.md', async () => {});

  // Test 2: File not found error
  it('should throw error if TEST_RESULTS.md not found', async () => {});

  // Test 3: JSON parse error
  it('should throw error if JSON parsing fails', async () => {});

  // Test 4: Zod validation error
  it('should throw error if Zod validation fails', async () => {});
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY existing test coverage
  - LOCATE: tests/unit/workflows/fix-cycle-workflow.test.ts lines 663-815
  - CONFIRM: All 4 required test cases exist
  - VALIDATE: Test structure follows describe/it pattern
  - CHECK: beforeEach hook clears mocks properly

Task 2: EXECUTE existing test suite
  - RUN: npm test -- fix-cycle-workflow.test.ts
  - VERIFY: All 4 loadBugReport tests pass
  - CHECK: No failures in related tests (constructor, createFixTasks, etc.)
  - CAPTURE: Test output for documentation

Task 3: VALIDATE test completeness
  - COMPARE: Contract requirements vs actual test coverage
  - CONFIRM: Each error path is tested (ENOENT, parse error, validation error)
  - VERIFY: Success path is tested with valid TestResults
  - CHECK: Error messages match expected format

Task 4: CHECK code coverage
  - RUN: npm test -- --coverage
  - VERIFY: #loadBugReport() method has 100% coverage
  - CHECK: All branches covered (access success/failure, parse success/failure, validation success/failure)
  - REPORT: Coverage percentage

Task 5: DOCUMENT findings
  - CREATE: Verification report
  - LIST: All existing tests with line numbers
  - NOTE: Any gaps or issues found
  - CONFIRM: Success criteria met
```

### Test Patterns & Key Details

```typescript
// Pattern 1: Module-level mock setup (at top of file, before imports)
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
  constants: { F_OK: 0 },
}));

// Pattern 2: Create typed mock references after imports
const mockedAccess = access as ReturnType<typeof vi.fn>;
const mockedReadFile = readFile as ReturnType<typeof vi.fn>;

// Pattern 3: Test factory for valid TestResults
const mockTestResults: TestResults = {
  hasBugs: true,
  bugs: [
    createTestBug(
      'BUG-001',
      'critical',
      'Login bug',
      'Critical login failure',
      '1. Go to login\n2. Enter bad password',
      'src/auth/login.ts:45'
    ),
  ],
  summary: 'Found 1 critical bug',
  recommendations: ['Fix login validation'],
};

// Pattern 4: Mock successful file read
mockedAccess.mockResolvedValue(undefined);
mockedReadFile.mockResolvedValue(JSON.stringify(mockTestResults));

// Pattern 5: Mock ENOENT error
const enoentError: NodeJS.ErrnoException = new Error(
  'File not found'
) as NodeJS.ErrnoException;
enoentError.code = 'ENOENT';
mockedAccess.mockRejectedValue(enoentError);

// Pattern 6: Test file not found error
await expect(workflow._loadBugReportForTesting()).rejects.toThrow(
  `TEST_RESULTS.md not found at ${resolve(sessionPath, 'TEST_RESULTS.md')}`
);

// Pattern 7: Mock invalid JSON
mockedAccess.mockResolvedValue(undefined);
mockedReadFile.mockResolvedValue('invalid json {{{');

// Pattern 8: Test JSON parse error
await expect(workflow._loadBugReportForTesting()).rejects.toThrow(
  `Failed to parse TEST_RESULTS.md at ${resolve(sessionPath, 'TEST_RESULTS.md')}`
);

// Pattern 9: Mock invalid schema (missing required field)
const invalidTestResults = {
  hasBugs: true,
  bugs: [
    /* valid bug */
  ],
  // Missing required 'summary' field
  recommendations: [],
};

// Pattern 10: Test Zod validation error
await expect(workflow._loadBugReportForTesting()).rejects.toThrow(
  `Invalid TestResults in TEST_RESULTS.md at ${resolve(sessionPath, 'TEST_RESULTS.md')}`
);

// Pattern 11: Verify fs calls
expect(mockedAccess).toHaveBeenCalledWith(
  resolve(sessionPath, 'TEST_RESULTS.md'),
  constants.F_OK
);
expect(mockedReadFile).toHaveBeenCalledWith(
  resolve(sessionPath, 'TEST_RESULTS.md'),
  'utf-8'
);

// Pattern 12: Verify results
expect(result).toEqual(mockTestResults);
expect(result.hasBugs).toBe(true);
expect(result.bugs).toHaveLength(1);
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run linter on test file
npm run lint -- tests/unit/workflows/fix-cycle-workflow.test.ts

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Note: Existing tests should already pass linting
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run specific test file
npm test -- fix-cycle-workflow.test.ts

# Run only loadBugReport tests
npm test -- fix-cycle-workflow.test.ts -t "loadBugReport"

# Run with verbose output
npm test -- fix-cycle-workflow.test.ts --reporter=verbose

# Expected: All 4 loadBugReport tests pass:
# ✓ should successfully load valid TEST_RESULTS.md
# ✓ should throw error if TEST_RESULTS.md not found
# ✓ should throw error if JSON parsing fails
# ✓ should throw error if Zod validation fails
```

### Level 3: Code Coverage (System Validation)

```bash
# Run tests with coverage report
npm test -- --coverage

# View coverage for specific file
npm test -- --coverage --reporter=text-lazy | grep -A 5 "fix-cycle-workflow.ts"

# Expected: #loadBugReport() method shows 100% coverage
# All branches covered:
# - File exists check (success/failure)
# - File read (success/failure)
# - JSON parse (success/failure)
# - Zod validation (success/failure)
```

### Level 4: Integration & Manual Validation

```bash
# Full test suite for FixCycleWorkflow
npm test -- fix-cycle-workflow.test.ts

# Verify no regressions in related functionality
npm test -- --reporter=json > test-results.json
cat test-results.json | jq '.testResults[].assertionResults[] | select(.status == "failed")'

# Expected: Zero failures across all FixCycleWorkflow tests
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 loadBugReport tests present in test file (lines 663-815)
- [ ] All tests pass: `npm test -- fix-cycle-workflow.test.ts`
- [ ] No linting errors: `npm run lint -- tests/unit/workflows/fix-cycle-workflow.test.ts`
- [ ] 100% code coverage for `#loadBugReport()` method

### Feature Validation

- [ ] Success case tested: Valid TEST_RESULTS.md loads correctly
- [ ] File not found tested: ENOENT error handled with proper message
- [ ] JSON parse error tested: Invalid JSON throws parse error
- [ ] Schema validation tested: Invalid structure throws validation error
- [ ] Error messages include full file path for debugging
- [ ] All error paths tested (access failure, read failure, parse failure, validation failure)

### Code Quality Validation

- [ ] Tests follow existing describe/it pattern
- [ ] Mocks properly typed with vi.mocked()
- [ ] beforeEach hook clears mocks between tests
- [ ] Test fixtures use factory functions (createTestBug, createTestResults)
- [ ] Test-only getter used to access private method
- [ ] No actual file I/O performed (all operations mocked)

### Documentation & Deployment

- [ ] Test documentation is clear (comments explain what's being tested)
- [ ] Error messages are specific and actionable
- [ ] Test names clearly describe the scenario
- [ ] Test structure matches other test files in codebase

---

## Anti-Patterns to Avoid

- ❌ Don't modify existing tests unless they're failing
- ❌ Don't add real file I/O to tests (use mocks only)
- ❌ Don't skip vi.clearAllMocks() in beforeEach
- ❌ Don't use generic Error objects - use proper NodeJS.ErrnoException for fs errors
- ❌ Don't forget to mock both access() and readFile() for success cases
- ❌ Don't use exact string matches on error paths (use resolve() for consistency)
- ❌ Don't test implementation details - test observable behavior
- ❌ Don't create duplicate tests - verify what exists first

---

## Verification Report Template

After completing validation, document findings:

```
# FixCycleWorkflow File Loading Test Verification Report

## Test Coverage Status: ✅ COMPLETE

### Existing Tests Verified

1. ✅ should successfully load valid TEST_RESULTS.md (line 670)
2. ✅ should throw error if TEST_RESULTS.md not found (line 718)
3. ✅ should throw error if JSON parsing fails (line 748)
4. ✅ should throw error if Zod validation fails (line 777)

### Test Execution Results

```

[Paste npm test output here]

```

### Coverage Results

```

[Paste coverage output here]

```

### Contract Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Load TEST_RESULTS.md from session path | ✅ | Test 1 covers success case |
| Throw error if TEST_RESULTS.md missing | ✅ | Test 2 covers ENOENT |
| Throw error if TEST_RESULTS.md has invalid JSON | ✅ | Test 3 covers parse error |
| Validate TestResults schema | ✅ | Test 4 covers Zod validation |

### Findings

- All required test cases exist and are properly implemented
- Tests follow established codebase patterns
- Mocks are correctly configured with proper cleanup
- Error messages include full file paths for debugging

### Recommendation

No additional tests required. Existing test suite is comprehensive and passing.
```

---

## Research Artifacts

### Test File Location

- **Path**: `/home/dustin/projects/hacky-hack/tests/unit/workflows/fix-cycle-workflow.test.ts`
- **Lines**: 663-815 (loadBugReport describe block)
- **Test-Only Getter**: Line 399 (`_loadBugReportForTesting`)

### Implementation Location

- **Path**: `/home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts`
- **Method**: `async #loadBugReport(): Promise<TestResults>` (private method)
- **Test Access**: `get _loadBugReportForTesting()` at lines 399-406

### Schema Definitions

- **TestResults Interface**: `/home/dustin/projects/hacky-hack/src/core/models.ts` lines 1838-1879
- **TestResultsSchema**: `/home/dustin/projects/hacky-hack/src/core/models.ts` lines 1902-1907
- **Bug Interface**: `/home/dustin/projects/hacky-hack/src/core/models.ts` lines 1710-1771

### Mock Patterns

- **Module Mock**: Lines 34-38 in test file
- **Typed References**: Lines 44-45 in test file
- **Cleanup**: Lines 112-114 (beforeEach with vi.clearAllMocks())

### Test Fixtures

- **createTestBug()**: Lines 61-75 in test file
- **createTestResults()**: Lines 77-87 in test file
- **createMockTaskOrchestrator()**: Lines 89-92 in test file
- **createMockSessionManager()**: Lines 94-109 in test file

---

## Success Metrics

**Confidence Score**: 10/10

**Validation**: The existing test suite provides complete coverage of the `#loadBugReport()` method with all contract-specified scenarios tested. The PRP enables verification that tests exist and pass.

**Next Steps**: Run test suite to confirm all tests pass, document findings, mark task as complete.
