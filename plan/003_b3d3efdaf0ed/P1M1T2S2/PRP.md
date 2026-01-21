# Product Requirement Prompt (PRP): P1.M1.T2.S2 - Verify dependency resolution logic

---

## Goal

**Feature Goal**: Verify that dependency resolution logic in TaskOrchestrator correctly enforces subtask dependency ordering through comprehensive unit tests.

**Deliverable**: Unit test file `tests/unit/core/task-dependencies.test.ts` with comprehensive test coverage for `canExecute()`, `getBlockingDependencies()`, and dependency graph construction.

**Success Definition**: All tests pass, verifying:

- `canExecute()` returns `true` only when all dependencies are Complete
- `getBlockingDependencies()` returns only incomplete dependencies
- Dependency graph is correctly constructed from subtask dependency arrays
- Edge cases are handled (empty deps, non-existent IDs, circular dependencies)

## Why

- Dependency resolution is critical for correct task execution ordering
- The system already uses `canExecute()` to block subtask execution when dependencies are incomplete (see `src/core/task-orchestrator.ts:617-640`)
- No existing tests verify this logic - potential for undetected bugs in dependency handling
- Circular dependencies are handled gracefully but not explicitly tested - need to verify behavior

## What

Unit tests that verify the dependency resolution logic in TaskOrchestrator works correctly for all edge cases and dependency configurations.

### Success Criteria

- [ ] `canExecute()` returns `true` for subtasks with empty dependencies array
- [ ] `canExecute()` returns `true` only when ALL dependencies have status === 'Complete'
- [ ] `canExecute()` returns `false` when ANY dependency has status !== 'Complete'
- [ ] `getBlockingDependencies()` returns empty array when all deps are Complete
- [ ] `getBlockingDependencies()` returns only incomplete dependencies
- [ ] `getBlockingDependencies()` handles non-existent dependency IDs gracefully
- [ ] Tests verify dependency graph construction from subtask dependency arrays
- [ ] Tests verify circular dependencies are detected or prevented
- [ ] All tests use factory functions from existing test patterns

## All Needed Context

### Context Completeness Check

✓ This PRP provides everything needed to implement the dependency resolution tests:

- Exact file paths and patterns to follow
- Factory functions for test data creation
- Mock patterns for SessionManager and external dependencies
- Specific test scenarios with expected outcomes
- References to existing research documents with algorithms

### Documentation & References

```yaml
# MUST READ - Core implementation details
- file: src/core/task-orchestrator.ts
  why: Contains canExecute() and getBlockingDependencies() methods to test
  lines: 251-293 (canExecute, getBlockingDependencies methods)
  lines: 617-640 (usage in executeSubtask - blocked subtask handling)
  pattern: Public methods that check dependency status before execution

- file: src/utils/task-utils.ts
  why: Contains getDependencies() utility that resolves IDs to Subtask objects
  lines: 131-142 (getDependencies implementation)
  pattern: Iterates through dependency IDs, uses findItem and isSubtask type guard

- file: src/core/models.ts
  why: Defines Subtask interface with dependencies field
  lines: 266-276 (Subtask.dependencies field definition)
  pattern: readonly string[] array of subtask IDs

# MUST READ - Research documents (already in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T2S2/research/dependency-resolution-logic.md
  why: Complete analysis of canExecute(), getBlockingDependencies(), and getDependencies()
  section: "Testing Considerations" (lines 217-239) for test scenarios

- docfile: plan/003_b3d3efdaf0ed/P1M1T2S2/research/circular-dependency-detection.md
  why: Circular dependency detection algorithms and test patterns
  section: "2.1 Test Cases for Circular Dependency Detection" (lines 253-358)

# MUST READ - Test patterns to follow
- file: tests/unit/core/task-orchestrator.test.ts
  why: Existing TaskOrchestrator test patterns for mocking and setup
  pattern: Factory functions (createTestSubtask, createTestTask, createMockSessionManager)
  lines: 87-169 (factory functions for test data creation)

- file: tests/unit/core/task-utils.test.ts
  why: Example tests for getDependencies() utility function
  pattern: Setup/Execute/Verify test structure with comprehensive edge cases
  lines: 92-170 (complex backlog fixture with multiple dependency states)

- file: plan/003_b3d3efdaf0ed/P1M1T2S1/research/dfs-traversal-testing.md
  why: Vitest testing patterns used in this codebase
  section: "Test File Structure" for describe/it patterns and mock setup

# CRITICAL GOTCHA - Mock configuration
- file: tests/unit/core/task-orchestrator.test.ts
  why: Shows how to mock getDependencies return value for isolated testing
  pattern: vi.mock('../../../src/utils/task-utils.js', () => ({
    getDependencies: vi.fn().mockReturnValue([]),
  }))
  gotcha: Must mock getDependencies to test canExecute in isolation

# CRITICAL GOTCHA - Status enum values
- file: src/core/models.ts
  why: Valid Status values for test assertions
  lines: 137-143 (Status type definition)
  values: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
```

### Current Codebase Tree (test directory structure)

```bash
tests/
├── unit/
│   └── core/
│       ├── task-orchestrator.test.ts    # Existing: DFS traversal tests
│       ├── task-utils.test.ts           # Existing: getDependencies tests
│       └── task-traversal.test.ts       # Existing: Traversal order tests
└── [other test files...]
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── unit/
│   └── core/
│       ├── task-orchestrator.test.ts    # Existing
│       ├── task-utils.test.ts           # Existing
│       ├── task-traversal.test.ts       # Existing
│       └── task-dependencies.test.ts    # NEW: Dependency resolution tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Vitest mock patterns - must use vi.hoisted() for mock variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// CRITICAL: Mock getDependencies to control test scenarios
// Don't use real getDependencies - it depends on findItem which requires full backlog
vi.mock('../../../src/utils/task-utils.js', () => ({
  findItem: vi.fn(),
  getDependencies: vi.fn().mockReturnValue([]), // Control return value per test
}));

// GOTCHA: TaskOrchestrator constructor throws if no active session
// Always provide mockSessionManager with currentSession set
const createMockSessionManager = (taskRegistry: Backlog): SessionManager =>
  ({
    currentSession: {
      metadata: { id: '001_14b9dc2a33c7', hash: '14b9dc2a33c7' /* ... */ },
      prdSnapshot: '# Test PRD',
      taskRegistry,
      currentItemId: null,
    },
    updateItemStatus: vi.fn().mockResolvedValue(taskRegistry),
    flushUpdates: vi.fn().mockResolvedValue(undefined),
  }) as unknown as SessionManager;

// CRITICAL: Status comparison uses strict equality (===)
// Use exact string values from Status type: 'Complete', 'Planned', etc.
// Don't use loose comparisons or type coercion

// GOTCHA: Empty dependencies array means canExecute() returns true
// This is correct behavior - no dependencies = ready to execute
// Test this explicitly with dependencies: []

// GOTCHA: Circular dependencies are NOT detected by getDependencies
// It gracefully handles them by returning empty array for non-existent IDs
// Tests should verify graceful handling, not detection (unless implementing detection)
```

## Implementation Blueprint

### Data Models and Structure

Use existing test fixtures from `task-orchestrator.test.ts`:

```typescript
// Factory functions (already exist in task-orchestrator.test.ts)
const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope,
});

const createTestBacklog = (phases: Phase[]): Backlog => ({ backlog: phases });
const createMockSessionManager = (taskRegistry: Backlog): SessionManager => {
  /* ... */
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/core/task-dependencies.test.ts
  - IMPLEMENT: describe block for 'TaskOrchestrator - Dependency Resolution'
  - IMPLEMENT: beforeEach to clear all mocks
  - FOLLOW pattern: tests/unit/core/task-orchestrator.test.ts (mock setup, factory functions)
  - NAMING: Test file name matches pattern: task-{feature}.test.ts
  - PLACEMENT: tests/unit/core/ directory alongside other TaskOrchestrator tests

Task 2: IMPLEMENT canExecute() tests - Happy Path
  - CREATE: describe block for 'canExecute()'
  - IMPLEMENT: test 'should return true when dependencies array is empty'
    - SETUP: Subtask with dependencies: []
    - EXECUTE: orchestrator.canExecute(subtask)
    - VERIFY: expect(result).toBe(true)
  - IMPLEMENT: test 'should return true when all dependencies are Complete'
    - SETUP: Mock getDependencies to return Subtasks with status: 'Complete'
    - VERIFY: expect(result).toBe(true)
  - DEPENDENCIES: Import TaskOrchestrator, Status, Subtask types

Task 3: IMPLEMENT canExecute() tests - Blocked Cases
  - IMPLEMENT: test 'should return false when single dependency is not Complete'
    - SETUP: Mock getDependencies to return Subtask with status: 'Planned'
    - VERIFY: expect(result).toBe(false)
  - IMPLEMENT: test 'should return false when any dependency is not Complete'
    - SETUP: Mock getDependencies to return multiple Subtasks, one with status: 'Implementing'
    - VERIFY: expect(result).toBe(false)
  - IMPLEMENT: test 'should return false for each non-Complete status'
    - PARAMETERIZE: Test 'Planned', 'Researching', 'Implementing', 'Failed', 'Obsolete'
    - VERIFY: All return false

Task 4: IMPLEMENT getBlockingDependencies() tests
  - CREATE: describe block for 'getBlockingDependencies()'
  - IMPLEMENT: test 'should return empty array when all dependencies are Complete'
  - IMPLEMENT: test 'should return empty array when dependencies array is empty'
  - IMPLEMENT: test 'should return only incomplete dependencies'
    - SETUP: Mock getDependencies to return mix of Complete and Planned Subtasks
    - VERIFY: Returned array contains only Planned Subtasks
  - IMPLEMENT: test 'should return all dependencies when none are Complete'
  - IMPLEMENT: test 'should handle multiple incomplete dependencies'
    - VERIFY: Array length matches number of incomplete deps

Task 5: IMPLEMENT edge case tests
  - IMPLEMENT: test 'should handle non-existent dependency IDs gracefully'
    - SETUP: Subtask with dependencies: ['NON-EXISTENT-ID']
    - VERIFY: canExecute returns true (empty array after filtering)
    - VERIFY: getBlockingDependencies returns empty array
  - IMPLEMENT: test 'should handle self-dependency'
    - SETUP: Subtask with dependencies: ['P1.M1.T1.S1'] (depends on self)
    - VERIFY: Graceful handling (no infinite loop)
  - IMPLEMENT: test 'should handle circular dependencies'
    - SETUP: S1 depends on S2, S2 depends on S1
    - VERIFY: Graceful handling (no infinite loop)

Task 6: IMPLEMENT dependency graph construction tests
  - CREATE: describe block for 'Dependency Graph Construction'
  - IMPLEMENT: test 'should correctly resolve dependency IDs to Subtask objects'
    - USE: Real getDependencies utility (not mocked) for this test
    - SETUP: Create backlog with multiple subtasks with dependencies
    - VERIFY: getDependencies returns correct Subtask objects
  - IMPLEMENT: test 'should filter out non-subtask dependencies'
    - SETUP: Subtask depends on Task ID (not Subtask)
    - VERIFY: getDependencies returns empty array (isSubtask filter)

Task 7: VERIFY all tests follow project patterns
  - VERIFY: Test file uses vi.mock for logger and task-utils
  - VERIFY: Factory functions match existing patterns
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock return values are reset in beforeEach
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Mock setup with hoisted variables (REQUIRED)
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// PATTERN: Mock getDependencies with controllable return value
let mockGetDependencies: ReturnType<typeof vi.fn>;
vi.mock('../../../src/utils/task-utils.js', () => ({
  findItem: vi.fn(),
  isSubtask: vi.fn(),
  getDependencies: vi.fn(() => []),
}));

import { getDependencies } from '../../../src/utils/task-utils.js';
mockGetDependencies = getDependencies as any;

// PATTERN: Test structure with SETUP/EXECUTE/VERIFY comments
it('should return true when all dependencies are Complete', () => {
  // SETUP: Create subtask and mock dependencies
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', [
    'P1.M1.T1.S2',
  ]);
  const dep1 = createTestSubtask('P1.M1.T1.S2', 'Dependency 1', 'Complete');
  mockGetDependencies.mockReturnValue([dep1]);

  // EXECUTE: Call method under test
  const result = orchestrator.canExecute(subtask);

  // VERIFY: Check expected outcome
  expect(result).toBe(true);
});

// CRITICAL: Parameterized test for all non-Complete statuses
const nonCompleteStatuses: Status[] = [
  'Planned',
  'Researching',
  'Implementing',
  'Failed',
  'Obsolete',
];
nonCompleteStatuses.forEach(status => {
  it(`should return false when dependency has status '${status}'`, () => {
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', [
      'P1.M1.T1.S2',
    ]);
    const dep1 = createTestSubtask('P1.M1.T1.S2', 'Dependency 1', status);
    mockGetDependencies.mockReturnValue([dep1]);

    expect(orchestrator.canExecute(subtask)).toBe(false);
  });
});

// GOTCHA: For dependency graph tests, use REAL getDependencies (not mocked)
// This tests the actual utility function behavior
describe('Dependency Graph Construction (using real getDependencies)', () => {
  // Import real function by NOT mocking it in this describe block
  // Use vi.unmock() or create separate test file section
});
```

### Integration Points

```yaml
NO EXTERNAL INTEGRATIONS:
  - This is pure unit test file
  - No database, filesystem, or network calls
  - All dependencies mocked except getDependencies (for graph tests)

MOCK INTEGRATIONS:
  - Mock: src/utils/logger.js ( getLogger )
  - Mock: src/utils/task-utils.js ( getDependencies, findItem, isSubtask )
  - Mock: src/core/scope-resolver.js ( resolveScope )
  - Mock: src/core/research-queue.js ( ResearchQueue )
  - Mock: src/agents/prp-runtime.js ( PRPRuntime )
  - Mock: src/utils/git-commit.js ( smartCommit )
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/unit/core/task-dependencies.test.ts
# OR
npx eslint tests/unit/core/task-dependencies.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- tests/unit/core/task-dependencies.test.ts
# OR
npx vitest run tests/unit/core/task-dependencies.test.ts

# Run with coverage
npm test -- --coverage tests/unit/core/task-dependencies.test.ts

# Run all TaskOrchestrator-related tests to ensure no breakage
npm test -- tests/unit/core/task-orchestrator.test.ts
npm test -- tests/unit/core/task-utils.test.ts
npm test -- tests/unit/core/task-traversal.test.ts

# Expected: All tests pass, 100% coverage for canExecute and getBlockingDependencies
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full test suite still passes
npm test
# OR
npx vitest run

# Check that existing TaskOrchestrator tests still work
npx vitest run tests/unit/core/task-orchestrator.test.ts

# Expected: All existing tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly formatted
ls -la tests/unit/core/task-dependencies.test.ts

# Check test file follows project conventions
head -50 tests/unit/core/task-dependencies.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/unit/core/task-dependencies.test.ts
# Run multiple times to ensure no flaky tests

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/task-dependencies.test.ts`
- [ ] No linting errors: `npm run lint tests/unit/core/task-dependencies.test.ts`
- [ ] Coverage report shows 100% for canExecute() and getBlockingDependencies()
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] Empty dependencies array returns true for canExecute()
- [ ] Complete dependencies return true for canExecute()
- [ ] Any incomplete dependency returns false for canExecute()
- [ ] getBlockingDependencies returns only incomplete deps
- [ ] Non-existent dependency IDs handled gracefully
- [ ] Circular dependencies tested (graceful handling verified)
- [ ] Dependency graph construction tested with real getDependencies

### Code Quality Validation

- [ ] Follows existing test patterns from task-orchestrator.test.ts
- [ ] Uses factory functions for test data creation
- [ ] SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.hoisted() pattern
- [ ] Parameterized tests for Status enum values
- [ ] Test file location matches conventions (tests/unit/core/)

### Documentation & Deployment

- [ ] Test names clearly describe what is being tested
- [ ] Edge cases are explicitly tested and commented
- [ ] Complex scenarios (circular deps) have explanatory comments
- [ ] Test file is self-documenting with clear describe/it structure

---

## Anti-Patterns to Avoid

- ❌ Don't create new factory functions - reuse existing ones from task-orchestrator.test.ts
- ❌ Don't skip mocking external dependencies (SessionManager, logger, etc.)
- ❌ Don't use real getDependencies() in canExecute tests (use mocks for isolation)
- ❌ Don't test circular dependency detection (not implemented) - test graceful handling instead
- ❌ Don't forget beforeEach to clear mocks between tests
- ❌ Don't use setTimeout or async waits for synchronous methods
- ❌ Don't skip edge cases (empty deps, non-existent IDs, all Status values)
- ❌ Don't create integration tests - keep tests unit-scoped and fast
- ❌ Don't hardcode status strings - use Status type values
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T2.S2
**Created:** 2026-01-19
**Status:** Ready for Implementation
