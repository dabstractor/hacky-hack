# Product Requirement Prompt (PRP)

## Goal

**Feature Goal**: Update all SessionManager constructor calls in unit tests to use the correct 3-parameter constructor signature.

**Deliverable**: Updated `tests/unit/core/session-manager.test.ts` where all SessionManager instantiations use the correct 3-parameter constructor: `(prdPath, planDir, flushRetries)`.

**Success Definition**:

- All SessionManager constructor calls in `tests/unit/core/session-manager.test.ts` include `planDir` as the second parameter
- Tests use `resolve('plan')` or test temp directory for planDir
- Default value `3` is used for flushRetries when not explicitly tested
- Tests pass without constructor signature errors
- Test coverage remains at 100%

## Why

**Business Value**: This bug fix ensures unit tests correctly match the SessionManager constructor signature, enabling:

- Accurate testing of SessionManager functionality with plan directory parameter
- Proper validation of the planDir parameter behavior
- Test suite stability and maintainability

**Integration**: The SessionManager is a core component of the Four Core Processing Engines (PRD §5.1). Incorrect constructor calls in tests cause test failures and prevent validation of other bug fixes.

**Problems Solved**:

- Bug 001_d5507a871918 §Issue 2 identified that tests pass only 2 parameters `(prdPath, flushRetries)` but constructor requires 3 parameters `(prdPath, planDir, flushRetries)`
- Current tests incorrectly pass flushRetries as the second parameter instead of planDir
- Missing planDir parameter prevents proper testing of plan directory functionality

## What

**User-Visible Behavior**: No direct user-visible behavior change. This is an internal test fix ensuring correct constructor parameter usage.

**Technical Requirements**:

1. Update all `new SessionManager(prdPath, planDir)` calls to include planDir as the second parameter
2. For tests that don't care about planDir, use `resolve('plan')` as default value
3. Ensure test setup/teardown properly creates and cleans up plan directories
4. Follow the pattern established in ResearchQueue constructor fix (P1.M1.T1)

### Success Criteria

- [ ] All SessionManager instantiations in `tests/unit/core/session-manager.test.ts` use 3-parameter constructor
- [ ] Pattern: `new SessionManager(prdPath, resolve('plan'), flushRetries)` or equivalent
- [ ] Tests pass: `npm test -- tests/unit/core/session-manager.test.ts`
- [ ] No constructor signature errors in test output
- [ ] 100% code coverage maintained

## All Needed Context

### Context Completeness Check

**Test**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: Yes - this PRP provides:

- Exact SessionManager constructor signature with parameter order
- Primary test file location and current incorrect patterns
- Test fixtures and patterns to follow
- Code examples showing correct and incorrect patterns
- ResearchQueue fix patterns to replicate
- Validation commands specific to this codebase

### Documentation & References

```yaml
# MUST READ - Core source files for this implementation

- file: src/core/session-manager.ts
  lines: 190-219
  why: SessionManager constructor signature showing all 3 required parameters
  pattern: Constructor with default parameters: (prdPath, planDir='resolve('plan')', flushRetries=3)
  critical: Parameter order is (prdPath, planDir, flushRetries) - tests currently pass (prdPath, flushRetries)

- file: tests/unit/core/session-manager.test.ts
  lines: 1-100
  why: Primary test file that needs updating - contains ~200 SessionManager constructor calls
  pattern: Current incorrect pattern: `new SessionManager(prdPath, flushRetries)`
  gotcha: Need to change to `new SessionManager(prdPath, resolve('plan'), flushRetries)`

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/prd_snapshot.md
  lines: 1-50
  why: Bug report describing the SessionManager constructor signature mismatch issue
  critical: Original bug report - Issue 2: SessionManager Constructor Signature Mismatch
  section: Research Objective 1 - 23 test files need updating

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S1/PRP.md
  why: Example PRP for ResearchQueue constructor fix (same pattern)
  pattern: Test constants, multi-line formatting, parameter variation tests
  critical: Use the same patterns that successfully fixed ResearchQueue

- file: tests/unit/core/research-queue.test.ts
  lines: 1-100
  why: Example of test constants pattern for constructor parameters
  pattern: `const DEFAULT_MAX_SIZE = 3; const DEFAULT_NO_CACHE = false;`
  critical: Use test constants to prevent typos across many instantiations

- file: tests/fixtures/simple-prd.ts
  why: Mock PRD content for testing
  pattern: `export const mockSimplePRD = \`...``
  gotcha: Use this for prdPath parameter in tests

- file: vitest.config.ts
  why: Vitest configuration for test execution
  pattern: Test framework configuration, coverage thresholds
  critical: Coverage must remain at 100%

# EXTERNAL RESEARCH - TypeScript and Testing Best Practices

- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking patterns for file system operations
  critical: Tests use vi.mock() for node:fs/promises and session-utils

- url: https://nodejs.org/api/path.html
  why: Node.js path module documentation for resolve() function
  section: path.resolve([...paths])
  critical: `resolve('plan')` resolves to absolute path from current working directory

- url: https://www.typescriptlang.org/docs/handbook/2/classes.html#constructors
  why: TypeScript constructor parameter patterns
  section: Constructor Parameters
  critical: Default parameters enable backwards compatibility
```

### Current Codebase Tree (relevant sections)

```bash
src/
├── core/
│   ├── session-manager.ts       # Lines 190-219: Constructor signature
│   ├── session-utils.ts         # Helper functions (mocked in tests)
│   └── models.ts                # Type definitions

tests/
├── unit/
│   └── core/
│       └── session-manager.test.ts   # PRIMARY TARGET: ~200 constructor calls to fix
├── integration/
│   ├── session-structure.test.ts     # 5 constructor calls (future subtask)
│   ├── tasks-json-authority.test.ts  # 5 constructor calls (future subtask)
│   └── delta-resume-regeneration.test.ts  # 5 constructor calls (future subtask)
└── fixtures/
    └── simple-prd.ts                # Mock PRD content for tests
```

### Desired Codebase Tree with Files to be Added

```bash
# No new files needed - this PRP updates existing test file

tests/
├── unit/
│   └── core/
│       └── session-manager.test.ts   # UPDATED: All constructor calls fixed
└── research/
    └── session-manager-constructor-patterns.md  # OPTIONAL: Document patterns found
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: SessionManager constructor parameter order is strict
// Order: (prdPath, planDir, flushRetries)
// Tests currently pass: (prdPath, flushRetries) - MISSING planDir parameter
// This causes flushRetries to be assigned to planDir, which is WRONG

// CRITICAL: Default parameters in constructor
// planDir defaults to: resolve('plan')
// flushRetries defaults to: 3
// Tests should explicitly pass planDir even when using default value

// GOTCHA: Tests mock node:fs/promises and node:fs modules
// vi.mock('node:fs/promises', () => ({ readFile: vi.fn(), ... }))
// vi.mock('node:fs', () => ({ statSync: vi.fn(), ... }))
// Constructor calls statSync synchronously for PRD validation

// GOTCHA: Tests mock session-utils module
// vi.mock('../../../src/core/session-utils.js', () => ({
//   hashPRD: vi.fn(),
//   createSessionDirectory: vi.fn(),
//   ...
// }))
// All SessionManager methods that use session-utils are mocked

// PATTERN: Test constants at top of file prevent typos
// From research-queue.test.ts (P1.M1.T1.S2 fix):
// const DEFAULT_MAX_SIZE = 3;
// const DEFAULT_NO_CACHE = false;
// const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
//
// Apply to SessionManager:
// const DEFAULT_PRD_PATH = '/test/PRD.md';
// const DEFAULT_PLAN_DIR = 'plan'; // Will be resolved by constructor
// const DEFAULT_FLUSH_RETRIES = 3;

// CRITICAL: Multi-line formatting improves reviewability
// Instead of: new SessionManager(prdPath, flushRetries)
// Use:
// new SessionManager(
//   prdPath,
//   resolve('plan'),
//   flushRetries
// )
// This makes it easy to spot missing parameters

// GOTCHA: Some tests may use different variable names
// Common patterns: prdPath, testPrdPath, mockPrdPath
// Common patterns: planDir, testPlanDir, mockPlanDir
// Common patterns: flushRetries, retries, maxRetries
// Update ALL variations to include planDir parameter

// CRITICAL: resolve('plan') must be imported from node:path
// Already imported in test file (line 13-14 imports from vitest)
// Add import: import { resolve } from 'node:path';

// TESTING: Vitest is the test framework
// Use vi.mock() for mocking, vi.fn() for mock functions
// Test pattern: SETUP (mocks), EXECUTE (call constructor), VERIFY (assertions)

// GOTCHA: Coverage threshold is 100%
// All modified code must maintain 100% coverage
// Run npm test -- --coverage to verify
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This PRP updates existing test constructor calls.

**SessionManager Constructor Signature** (already defined in source):

```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```

**Test Constants Pattern** (add to top of test file):

```typescript
// Test constants for SessionManager constructor
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = 'plan'; // Will be resolved to absolute path
const DEFAULT_FLUSH_RETRIES = 3;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD IMPORT FOR resolve FUNCTION
  - LOCATION: tests/unit/core/session-manager.test.ts line ~13 (imports section)
  - ADD: import { resolve } from 'node:path';
  - WHY: resolve() function needed for planDir parameter
  - PLACEMENT: After existing imports, before mock declarations

Task 2: ADD TEST CONSTANTS
  - LOCATION: tests/unit/core/session-manager.test.ts line ~170 (after MOCK_SESSION_HASH, before describe block)
  - ADD:
    // Test constants for SessionManager constructor
    const DEFAULT_PRD_PATH = '/test/PRD.md';
    const DEFAULT_PLAN_DIR = 'plan';
    const DEFAULT_FLUSH_RETRIES = 3;
  - PATTERN: Follow research-queue.test.ts test constants pattern
  - WHY: Prevents typos across ~200 constructor instantiations

Task 3: UPDATE CONSTRUCTOR describe BLOCK TESTS
  - LOCATION: tests/unit/core/session-manager.test.ts lines ~180-250
  - FIND: All `new SessionManager(prdPath, ...)` calls in constructor tests
  - REPLACE: Add planDir parameter as second argument
  - PATTERN:
    FROM: new SessionManager('/test/PRD.md')
    TO:   new SessionManager('/test/PRD.md', resolve('plan'))

    FROM: new SessionManager(prdPath, flushRetries)
    TO:   new SessionManager(prdPath, resolve('plan'), flushRetries)
  - GOTCHA: Ensure all tests in describe('constructor', ...) block are updated

Task 4: UPDATE ALL describe BLOCK TESTS
  - LOCATION: tests/unit/core/session-manager.test.ts (all describe blocks)
  - FIND: All `new SessionManager(...)` calls throughout the file
  - REPLACE: Add planDir as second parameter to each call
  - PATTERN: Use multi-line formatting for clarity
    new SessionManager(
      prdPath,
      resolve('plan'),
      flushRetries
    )
  - SCOPE: Update every describe block (initializeSession, loadTasksJSON, etc.)

Task 5: ADD planDir PARAMETER VARIATION TESTS
  - LOCATION: tests/unit/core/session-manager.test.ts (new describe block after constructor tests)
  - ADD: New test suite for planDir parameter variation
  - PATTERN: Follow research-queue.test.ts parameter variation tests
  - IMPLEMENT:
    describe('planDir parameter', () => {
      it('should use resolve("plan") as default when not provided', () => {
        mockStatSync.mockReturnValue({ isFile: () => true });
        const manager = new SessionManager('/test/PRD.md');
        expect(manager.planDir).toContain('plan');
      });

      it('should use custom planDir when provided', () => {
        mockStatSync.mockReturnValue({ isFile: () => true });
        const customPlanDir = '/custom/plan';
        const manager = new SessionManager('/test/PRD.md', customPlanDir);
        expect(manager.planDir).toBe(customPlanDir);
      });
    });
  - WHY: Ensures planDir parameter works correctly with defaults and custom values

Task 6: RUN TYPESCRIPT COMPILATION CHECK
  - COMMAND: npm run typecheck
  - VERIFY: No TypeScript errors related to SessionManager constructor
  - EXPECTED: Zero errors
  - ACTION: Fix any type errors before proceeding

Task 7: RUN UNIT TESTS FOR SESSIONMANAGER
  - COMMAND: npm test -- tests/unit/core/session-manager.test.ts
  - VERIFY: All tests pass
  - EXPECTED: Zero failures, all constructor calls work correctly
  - ACTION: Fix any failing tests (check for missing planDir parameters)

Task 8: VERIFY CODE COVERAGE
  - COMMAND: npm test -- tests/unit/core/session-manager.test.ts --coverage
  - VERIFY: Coverage remains at 100%
  - EXPECTED: statements: 100%, branches: 100%, functions: 100%, lines: 100%
  - ACTION: Add tests if coverage drops below 100%

Task 9: RUN ALL CORE UNIT TESTS
  - COMMAND: npm test -- tests/unit/core/
  - VERIFY: All core unit tests pass (no regressions)
  - EXPECTED: Zero failures
  - ACTION: Fix any regressions in other test files
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Test Constants (add after line ~170)
// Location: After MOCK_SESSION_HASH, before first describe block
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = 'plan';
const DEFAULT_FLUSH_RETRIES = 3;

// Pattern 2: Import resolve function (add to imports section)
import { resolve } from 'node:path';

// Pattern 3: Update constructor calls with planDir parameter
// CURRENT INCORRECT PATTERN:
const manager = new SessionManager(prdPath, flushRetries);

// CORRECTED PATTERN:
const manager = new SessionManager(prdPath, resolve('plan'), flushRetries);

// Pattern 4: Multi-line formatting for readability
// This makes it easy to verify all 3 parameters are present
const manager = new SessionManager(
  prdPath, // Parameter 1: PRD file path
  resolve('plan'), // Parameter 2: Plan directory
  flushRetries // Parameter 3: Max retry attempts
);

// Pattern 5: Default parameter usage
// When testing with default flushRetries, use:
const manager = new SessionManager(prdPath, resolve('plan'));

// Pattern 6: Parameter variation test structure
describe('planDir parameter', () => {
  it('should use resolve("plan") as default when not provided', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager(DEFAULT_PRD_PATH);
    expect(manager.planDir).toContain('plan');
  });

  it('should accept custom planDir', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const customPlanDir = '/custom/plan/path';
    const manager = new SessionManager(DEFAULT_PRD_PATH, customPlanDir);
    expect(manager.planDir).toBe(customPlanDir);
  });

  it('should work with all three parameters', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager(DEFAULT_PRD_PATH, resolve('plan'), 5);
    expect(manager.prdPath).toBe(DEFAULT_PRD_PATH);
    expect(manager.planDir).toContain('plan');
    expect(manager.flushRetries).toBe(5);
  });
});

// CRITICAL: Common variable names in tests
// prdPath, testPrdPath, mockPrdPath, prd
// planDir, testPlanDir, mockPlanDir
// flushRetries, retries, maxRetries
// UPDATE ALL variations to include planDir parameter

// GOTCHA: Mock setup remains the same
// Constructor calls statSync, which is mocked
mockStatSync.mockReturnValue({ isFile: () => true });
// This mock setup doesn't change, only constructor calls change

// PATTERN: Test structure (SETUP, EXECUTE, VERIFY)
it('should validate PRD file exists synchronously', () => {
  // SETUP: Mock successful stat check
  mockStatSync.mockReturnValue({ isFile: () => true });

  // EXECUTE
  const manager = new SessionManager('/test/PRD.md', resolve('plan'));

  // VERIFY
  expect(mockStatSync).toHaveBeenCalledWith('/test/PRD.md');
  expect(manager.prdPath).toBe('/test/PRD.md');
  expect(manager.planDir).toContain('plan');
});
```

### Integration Points

```yaml
SESSIONMANAGER_CONSTRUCTOR:
  - file: src/core/session-manager.ts
  - lines: 190-219
  - signature: (prdPath, planDir, flushRetries)
  - defaults: planDir=resolve('plan'), flushRetries=3
  - validation: Synchronous statSync check for PRD file existence

TEST_FILE:
  - file: tests/unit/core/session-manager.test.ts
  - current_issue: Missing planDir parameter in constructor calls
  - constructor_count: ~200 instantiations
  - fix_pattern: Add resolve('plan') as second parameter

MOCKED_MODULES:
  - node:fs/promises: readFile, writeFile, stat, readdir
  - node:fs: statSync, readdir
  - session-utils: hashPRD, createSessionDirectory, readTasksJSON, writeTasksJSON
  - task-utils: updateItemStatus, findItem
  - prd-validator: PRDValidator

TEST_CONSTANTS:
  - DEFAULT_PRD_PATH: '/test/PRD.md'
  - DEFAULT_PLAN_DIR: 'plan'
  - DEFAULT_FLUSH_RETRIES: 3

VALIDATION_COMMANDS:
  - typecheck: npm run typecheck
  - unit_test: npm test -- tests/unit/core/session-manager.test.ts
  - coverage: npm test -- tests/unit/core/session-manager.test.ts --coverage
  - all_core: npm test -- tests/unit/core/
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking
npm run typecheck

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding
# Common errors: Missing resolve import, incorrect parameter types

# Run ESLint to check code style
npm run lint

# Expected: Zero linting errors
# If errors exist, run npm run lint:fix to auto-fix
# Check for: unused imports, inconsistent formatting

# Run Prettier to check formatting
npm run format:check

# Expected: Zero formatting issues
# If issues exist, run npm run format to fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test SessionManager unit tests (PRIMARY VALIDATION)
npm test -- tests/unit/core/session-manager.test.ts

# Expected: All tests pass
# Key tests to verify:
# - "should validate PRD file exists synchronously" (constructor test)
# - "should throw SessionFileError when PRD does not exist" (error handling)
# - "should use resolve('plan') as default when not provided" (new test)
# - "should accept custom planDir" (new test)

# Test for constructor signature errors
npm test -- tests/unit/core/session-manager.test.ts 2>&1 | grep -i "constructor"

# Expected: Zero constructor-related errors
# If errors: Check for missing planDir parameters

# Run all core unit tests (no regressions)
npm test -- tests/unit/core/

# Expected: All tests pass
# Verifies: No breaking changes to other components

# Coverage validation (100% threshold)
npm test -- tests/unit/core/session-manager.test.ts --coverage

# Expected: 100% coverage (statements, branches, functions, lines)
# If coverage drops: Add tests for uncovered code paths
```

### Level 3: Integration Testing (System Validation)

```bash
# Test SessionManager integration (future subtasks, but verify no breakage)
npm test -- tests/integration/session-structure.test.ts

# Expected: All tests pass (these tests will be updated in P1.M1.T2.S2)
# If failures: Integration tests may have incorrect constructor calls

# Test related integration tests
npm test -- tests/integration/tasks-json-authority.test.ts
npm test -- tests/integration/delta-resume-regeneration.test.ts

# Expected: May have failures (will be fixed in P1.M1.T2.S2)
# Note: Integration test updates are in separate subtask
```

### Level 4: Manual Verification

```bash
# Verify constructor call pattern in source
grep -n "new SessionManager(" tests/unit/core/session-manager.test.ts | head -20

# Expected output should show planDir parameter:
# new SessionManager('/test/PRD.md', resolve('plan'))
# new SessionManager(prdPath, resolve('plan'), flushRetries)
# etc.

# Verify NO instances of old pattern remain
grep -n "new SessionManager(prdPath, flushRetries)" tests/unit/core/session-manager.test.ts

# Expected: Zero matches
# If matches found: These are constructor calls missing planDir parameter

# Verify resolve import is present
grep "import.*resolve.*from" tests/unit/core/session-manager.test.ts

# Expected: import { resolve } from 'node:path';
# If not found: Add the import statement

# Verify test constants are defined
grep "DEFAULT_PRD_PATH\|DEFAULT_PLAN_DIR\|DEFAULT_FLUSH_RETRIES" tests/unit/core/session-manager.test.ts

# Expected: All three constants defined at top of file
# If not found: Add test constants section
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/session-manager.test.ts`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`
- [ ] Coverage at 100%: `npm test -- tests/unit/core/session-manager.test.ts --coverage`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] All SessionManager instantiations use 3-parameter constructor
- [ ] Pattern: `new SessionManager(prdPath, resolve('plan'), flushRetries)` used throughout
- [ ] Test constants defined and used consistently
- [ ] planDir parameter variation tests added and passing
- [ ] No regressions in other core unit tests

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Multi-line formatting used for constructor calls (improves readability)
- [ ] Test constants prevent typos (consistent with ResearchQueue fix pattern)
- [ ] Anti-patterns avoided (single-line constructor calls with many parameters)
- [ ] Mock setup and teardown remain unchanged

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Test constants are documented with comments
- [ ] No new environment variables or configuration needed
- [ ] Changes are isolated to test file only (no production code changes)

---

## Anti-Patterns to Avoid

- ❌ Don't create new test patterns when existing ones work (follow ResearchQueue fix pattern)
- ❌ Don't skip adding test constants (they prevent typos across ~200 instantiations)
- ❌ Don't use single-line constructor calls with 3 parameters (hard to read)
- ❌ Don't forget to import resolve from 'node:path'
- ❌ Don't hardcode planDir values (use resolve('plan') or test constants)
- ❌ Don't skip adding planDir parameter variation tests (validates default behavior)
- ❌ Don't modify production code (this is test-only change)
- ❌ Don't update integration tests yet (those are in P1.M1.T2.S2)
- ❌ Don't use sync functions in async context (not applicable here, but general rule)
- ❌ Don't catch all exceptions - be specific (maintain existing error handling patterns)

## Confidence Score

**Rating: 9/10** for one-pass implementation success likelihood

**Reasoning**:

- Comprehensive research provides exact file locations and patterns
- ResearchQueue fix (P1.M1.T1) provides proven pattern to replicate
- Test constants, multi-line formatting, and parameter variation tests are specified
- Validation commands are project-specific and verified working
- All constructor call patterns documented with before/after examples
- Mock setup and teardown remain unchanged (reduces risk)
- Only test file modifications (isolated scope)

**Risk Factors**:

- Large number of constructor calls (~200) increases chance of missing one
- Integration tests may fail (expected, will be fixed in P1.M1.T2.S2)
- Coverage threshold is strict (100% - must maintain)

**Mitigation**:

- Use grep patterns to verify all instances updated
- Run comprehensive test suite to catch any misses
- Add parameter variation tests to validate behavior
- Follow proven ResearchQueue fix pattern exactly
