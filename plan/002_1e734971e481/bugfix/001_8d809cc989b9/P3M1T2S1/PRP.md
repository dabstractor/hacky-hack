# PRP: Update Test Mocks to Expect Pino Logger Calls - P3.M1.T2.S1

## Goal

**Feature Goal**: Update 21 failing Task Orchestrator unit tests to use the existing `mockLogger` assertions instead of `console.log` spies, aligning test expectations with the Pino structured logging implementation.

**Deliverable**: Modified test file at `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts` where all 21 tests now assert on `mockLogger` method calls (info, warn, error, debug) instead of `console.log` spy expectations.

**Success Definition**:
- All 21 previously failing tests now pass
- No `vi.spyOn(console, 'log')` calls remain in the file
- All test assertions use `mockLogger.info/warn/error/debug` with structured data matching
- Mock setup remains unchanged (already correct with `vi.hoisted()`)
- Tests verify structured logging format: `expect(mockLogger.info).toHaveBeenCalledWith({ data }, 'message')`

## User Persona

**Target User**: Developer implementing bug fixes for Phase P3 (Test Alignment) who needs to update test assertions to match the actual Pino logger implementation.

**Use Case**: Developer has completed test analysis (P3.M1.T1.S1) which identified that tests expect `console.log` output but implementation uses Pino structured logging. The mock setup is already correct; only test assertions need updating.

**User Journey**:
1. Developer reads P3.M1.T1.S1 analysis (root cause identified)
2. Developer reviews this PRP for exact implementation patterns
3. Developer updates each of the 21 failing tests
4. Developer runs tests to verify all pass
5. Developer commits changes with reference to this PRP

**Pain Points Addressed**:
- **Uncertainty about correct assertion format**: PRP provides exact patterns to follow
- **Risk of breaking working mock setup**: PRP explicitly preserves existing mock structure
- **Need to understand all 21 test variations**: PRP provides categorized examples
- **Ensuring consistency across test file**: PRP establishes clear patterns

## Why

- **Business Value**: 21 failing tests block deployment and reduce confidence in the codebase. Fixing these tests restores test coverage and prevents regression.
- **Integration**: This fix completes the work started in P3.M1.T1.S1 (test analysis) by implementing the recommended fix: update test expectations to match implementation, not vice versa.
- **Problem Solved**: Aligns test assertions with the actual Pino structured logging architecture, ensuring tests verify the correct behavior without requiring implementation changes.

## What

Update 21 failing Task Orchestrator unit tests to assert on the mocked Pino logger calls instead of expecting `console.log` output. The existing mock setup is correct and must be preserved.

### Success Criteria

- [ ] All 21 tests updated to use `mockLogger` assertions
- [ ] No `vi.spyOn(console, 'log')` calls remain in test file
- [ ] All tests pass: `npm run test:run -- tests/unit/core/task-orchestrator.test.ts`
- [ ] Test assertions follow structured logging pattern: `expect(mockLogger.info).toHaveBeenCalledWith({ data }, 'message')`
- [ ] Mock setup unchanged (lines 22-34 preserved)
- [ ] No changes to implementation code (`src/core/task-orchestrator.ts`)

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
1. Exact file location and line numbers for all 21 failing tests
2. Complete assertion patterns to use for each test category
3. Mock setup that must be preserved (already correct)
4. Implementation logging reference with exact signatures
5. Best practices from external research on Pino mocking
6. Validation commands to verify success

### Documentation & References

```yaml
# PRIMARY: Test file with 21 failing tests
- file: tests/unit/core/task-orchestrator.test.ts
  why: Contains all 21 failing tests that need assertion updates
  pattern: Lines 22-34 - Mock setup (MUST PRESERVE)
  pattern: Lines 298-328 - executePhase logging tests
  pattern: Lines 404-433 - executeMilestone logging tests
  pattern: Lines 500-529 - executeTask logging tests
  pattern: Lines 608-649 - executeSubtask logging tests
  pattern: Lines 721-795 - smartCommit success/null tests
  pattern: Lines 797-876 - smartCommit error/warning tests
  pattern: Lines 963-973 - processNextItem empty queue tests
  pattern: Lines 1140-1146 - processNextItem item processing tests
  pattern: Lines 2455-2619 - setStatus and Researching tests
  gotcha: Mock setup is CORRECT - do not modify lines 22-34
  code: |
    # Mock setup (lines 22-34) - DO NOT CHANGE:
    const { mockLogger } = vi.hoisted(() => ({
      mockLogger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
    }));
    vi.mock('../../../src/utils/logger.js', () => ({
      getLogger: vi.fn(() => mockLogger),
    }));

# PRIMARY: Implementation logging reference
- file: src/core/task-orchestrator.ts
  why: Exact logging patterns tests should expect
  pattern: Line 112 - Logger init: this.#logger = getLogger('TaskOrchestrator')
  pattern: Lines 484-491 - executePhase logs: this.#logger.info({ phaseId }, 'Setting status')
  pattern: Lines 505-517 - executeMilestone logs
  pattern: Lines 531-562 - executeTask logs
  pattern: Lines 584-750 - executeSubtask logs (multiple log points)
  pattern: Lines 704-720 - smartCommit logs
  pattern: Lines 206-230 - setStatus logs
  pattern: Lines 805-834 - processNextItem logs
  gotcha: Pino uses structured logging: logger.info({ data }, 'message')
  code: |
    # Implementation pattern (line 487):
    this.#logger.info({ phaseId: phase.id }, 'Setting status to Implementing');

# INPUT: Test analysis from previous subtask
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M1T1S1/research/logging-test-analysis.md
  why: Complete analysis of all 21 failing tests vs implementation
  section: "Complete List of 21 Failing Tests" - All test names and line numbers
  section: "Implementation Logging Reference" - Exact logging patterns
  section: "Recommended Fix Strategy" - Option A: Update tests (RECOMMENDED)

# RESEARCH: Pino mocking best practices
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/docs/pino-logger-mocking-research.md
  why: Comprehensive guide on mocking Pino in Vitest
  section: "4. Recommended Mocking Strategy for getLogger" - Standard patterns
  section: "6. Structured Logging Best Practices" - Test patterns
  section: "12. Recommendations for Task Orchestrator Tests" - Specific guidance
  critical: Shows existing codebase patterns to follow

# REFERENCE: Correct assertion pattern from codebase
- file: tests/unit/core/task-patcher.test.ts
  why: Example of correct mockLogger assertion usage
  pattern: Lines 28-41 - Mock setup with vi.hoisted()
  pattern: Lines 458-482 - Assertions using mockLogger.warn
  code: |
    # Correct pattern from task-patcher.test.ts:
    expect(mockLogger.warn).toHaveBeenCalledWith(
      { changeType: 'added', taskId: 'P1.M1.T1.S1' },
      'Feature not implemented'
    );

# REFERENCE: Child logger pattern
- file: tests/unit/utils/high-priority-warning-verifier.test.ts
  why: Shows child logger mock pattern (if needed)
  pattern: Lines 24-38 - Mock with child method
  pattern: Lines 334 - child: vi.fn(function() { return this; })
  note: Task Orchestrator doesn't use child loggers, but good to know

# EXTERNAL: Vitest assertion documentation
- url: https://vitest.dev/api/expect.html
  why: Reference for assertion methods (toHaveBeenCalledWith, toHaveBeenNthCalledWith)
  section: "toHaveBeenCalledWith" - Exact match assertions
  section: "toHaveBeenNthCalledWith" - Multiple call verification
  section: "expect.objectContaining" - Partial object matching

# EXTERNAL: Pino structured logging
- url: https://getpino.io/#/docs/help?id=log-method-api
  why: Understanding Pino's log(data, msg) signature
  critical: First arg is structured data, second is message string
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   └── task-orchestrator.ts       # IMPLEMENTATION: Uses Pino logger (DO NOT MODIFY)
│   └── utils/
│       └── logger.ts                  # Logger factory (DO NOT MODIFY)
├── tests/
│   └── unit/
│       └── core/
│           └── task-orchestrator.test.ts  # TESTS: Update assertions (ONLY MODIFY THIS)
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        ├── P3M1T1S1/
        │   ├── PRP.md                 # Previous subtask: Test analysis
        │   └── research/
        │       ├── logging-test-analysis.md   # Test vs implementation analysis
        │       └── external-research.md       # Best practices research
        ├── P3M1T2S1/
        │   ├── PRP.md                 # This document
        │   └── research/              # Research notes for this PRP
        └── docs/
            └── pino-logger-mocking-research.md  # Comprehensive Pino mocking guide
```

### Desired Codebase Tree (After Implementation)

```bash
# No new files - only modifications to existing test file
# tests/unit/core/task-orchestrator.test.ts will have updated assertions
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Mock setup is ALREADY CORRECT - do not modify lines 22-34
// The mockLogger with vi.hoisted() is the right pattern
// Only update test assertions, not the mock setup

// CRITICAL: Pino uses structured logging, not formatted strings
// WRONG expectation: expect(consoleSpy).toHaveBeenCalledWith('[TaskOrchestrator] Executing Phase: P1')
// RIGHT expectation: expect(mockLogger.info).toHaveBeenCalledWith({ phaseId: 'P1' }, 'Executing Phase')

// CRITICAL: Implementation makes MULTIPLE log calls per execute method
// executePhase logs: 'Setting status to Implementing' then 'Executing Phase'
// Tests may need to use toHaveBeenNthCalledWith() or check only key calls

// CRITICAL: Different log levels are used (info, warn, error, debug)
// Tests must use the correct mockLogger method: mockLogger.info, mockLogger.warn, etc.

// CRITICAL: Some tests have multiple assertions for different log points
// Update all assertions in the test, not just the first one

// CRITICAL: Tests use expect.stringContaining() for flexible message matching
// Keep this pattern: expect(mockLogger.info).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('Executing'))

// GOTCHA: consoleSpy.mockRestore() calls should be removed
// When removing vi.spyOn(console, 'log'), also remove mockRestore()

// GOTCHA: Some tests may need to check for NO logging
// Pattern: expect(mockLogger.info).not.toHaveBeenCalled()

// CRITICAL: Do NOT use vi.mocked() unless necessary
// Direct mockLogger access works fine in this file

// CRITICAL: Child logger support not needed for Task Orchestrator
// Implementation doesn't use .child() method, so no need to add it to mock
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is a test assertion update task. Existing mock structure:

```typescript
// Lines 22-34 (DO NOT MODIFY):
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: VERIFY mock setup is correct
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - LINES: 22-34
  - VERIFY: mockLogger has info/error/warn/debug methods
  - VERIFY: vi.mock() returns mockLogger from getLogger
  - VERIFY: No changes needed to mock setup
  - OUTPUT: Confirmation that mock setup is preserved

Task 2: UPDATE executePhase logging tests (lines 298-328)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: expect(consoleSpy).toHaveBeenCalledWith(...) with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ phaseId: 'P1', title: 'Phase 1' }, 'Executing Phase')
  - COUNT: 2 tests affected (lines ~298, ~319)
  - PRESERVE: All test logic and setup, only change assertions

Task 3: UPDATE executeMilestone logging tests (lines 404-433)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ milestoneId: 'P1.M1' }, 'Executing Milestone')
  - COUNT: 2 tests affected (lines ~404, ~423)
  - PRESERVE: Test structure and mock setup

Task 4: UPDATE executeTask logging tests (lines 500-529)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ taskId: 'P1.M1.T1' }, 'Executing Task')
  - COUNT: 2 tests affected
  - PRESERVE: Test describe blocks and setup

Task 5: UPDATE executeSubtask logging tests (lines 608-649)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ subtaskId: 'P1.M1.T1.S1' }, 'Executing Subtask')
  - COUNT: 2 tests affected
  - PRESERVE: Test structure

Task 6: UPDATE smartCommit success tests (lines 721-758)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ subtaskId: 'P1.M1.T1.S1' }, 'Starting PRPRuntime execution')
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ subtaskId: 'P1.M1.T1.S1', commitHash: 'abc123' }, 'PRPRuntime execution succeeded')
  - COUNT: 2 tests affected
  - PRESERVE: Test logic

Task 7: UPDATE smartCommit null return tests (lines 759-795)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ subtaskId: 'P1.M1.T1.S1' }, 'No files to commit')
  - COUNT: 1 test affected
  - PRESERVE: Test structure

Task 8: UPDATE smartCommit error tests (lines 797-838)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({ subtaskId: 'P1.M1.T1.S1', error: expect.any(String) }), 'PRPRuntime execution failed')
  - COUNT: 1 test affected
  - NOTE: Uses mockLogger.error, not info

Task 9: UPDATE smartCommit warning tests (lines 840-876)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.warn).toHaveBeenCalledWith(expect.objectContaining({ subtaskId: 'P1.M1.T1.S1' }), expect.stringContaining('session path'))
  - COUNT: 1 test affected
  - NOTE: Uses mockLogger.warn

Task 10: UPDATE processNextItem empty queue tests (lines 963-973)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).not.toHaveBeenCalled() (no items to process)
  - COUNT: 1 test affected

Task 11: UPDATE processNextItem item processing tests (lines 1140-1210)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'P1.M1.T1.S1' }), 'Processing')
  - COUNT: 3 tests affected
  - PRESERVE: Complex test logic

Task 12: UPDATE dependency chain tests (lines 2132-2455)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith(expect.objectContaining({ blockedOn: ['P1.M1.T1.S2'] }), 'Blocked on dependency')
  - COUNT: 5 tests affected (various dependency scenarios)
  - PRESERVE: Complex dependency testing logic

Task 13: UPDATE setStatus tests (lines 2455-2619)
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - REMOVE: vi.spyOn(console, 'log') and consoleSpy variables
  - REPLACE: consoleSpy expectations with mockLogger assertions
  - PATTERN: expect(mockLogger.info).toHaveBeenCalledWith({ itemId: 'P1.M1.T1.S1', oldStatus: 'pending', newStatus: 'in_progress' }, 'Status changed')
  - COUNT: 4 tests affected
  - PRESERVE: Status transition testing

Task 14: VERIFY all tests pass
  - COMMAND: npm run test:run -- tests/unit/core/task-orchestrator.test.ts
  - EXPECTED: All 21 previously failing tests now pass
  - EXPECTED: No new test failures
  - VALIDATE: Test output shows green checkmarks for all tests

Task 15: CLEANUP research notes
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M1T2S1/research/
  - ACTION: Save any research notes for reference
  - ACTION: Document any deviations from PRP
  - OUTPUT: Clean research directory
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Simple logging assertion (most common)
// ============================================================================

// BEFORE (failing):
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
await orchestrator.executePhase(phase);
expect(consoleSpy).toHaveBeenCalledWith('[TaskOrchestrator] Executing Phase: P1 - Phase 1');
consoleSpy.mockRestore();

// AFTER (passing):
await orchestrator.executePhase(phase);
expect(mockLogger.info).toHaveBeenCalledWith(
  { phaseId: 'P1', title: 'Phase 1' },
  'Executing Phase'
);

// ============================================================================
// PATTERN 2: Multiple log calls verification
// ============================================================================

// Implementation makes 2 calls:
// 1. this.#logger.info({ phaseId: 'P1' }, 'Setting status to Implementing')
// 2. this.#logger.info({ phaseId: 'P1', title: 'Phase 1' }, 'Executing Phase')

// BEFORE:
expect(consoleSpy).toHaveBeenCalledWith('[TaskOrchestrator] Setting status to Implementing: P1');
expect(consoleSpy).toHaveBeenCalledWith('[TaskOrchestrator] Executing Phase: P1 - Phase 1');

// AFTER (Option A - Check both calls):
expect(mockLogger.info).toHaveBeenNthCalledWith(
  1,
  { phaseId: 'P1' },
  'Setting status to Implementing'
);
expect(mockLogger.info).toHaveBeenNthCalledWith(
  2,
  { phaseId: 'P1', title: 'Phase 1' },
  'Executing Phase'
);

// AFTER (Option B - Check only key call, simpler):
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.objectContaining({ phaseId: 'P1' }),
  expect.stringContaining('Executing')
);

// ============================================================================
// PATTERN 3: Error logging
// ============================================================================

// BEFORE:
expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PRPRuntime execution failed'));

// AFTER:
expect(mockLogger.error).toHaveBeenCalledWith(
  expect.objectContaining({
    subtaskId: 'P1.M1.T1.S1',
    error: expect.any(String),
  }),
  'PRPRuntime execution failed'
);

// ============================================================================
// PATTERN 4: Warning logging
// ============================================================================

// BEFORE:
expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('session path'));

// AFTER:
expect(mockLogger.warn).toHaveBeenCalledWith(
  expect.objectContaining({
    subtaskId: 'P1.M1.T1.S1',
  }),
  expect.stringContaining('session path')
);

// ============================================================================
// PATTERN 5: No logging verification
// ============================================================================

// BEFORE:
expect(consoleSpy).not.toHaveBeenCalled();

// AFTER:
expect(mockLogger.info).not.toHaveBeenCalled();

// ============================================================================
// PATTERN 6: Partial object matching (flexible)
// ============================================================================

// Use when exact object match is too brittle
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.objectContaining({
    taskId: 'P1.M1.T1',  // Only check critical fields
  }),
  'Task status changed'
);

// ============================================================================
// PATTERN 7: Message-only matching (most flexible)
// ============================================================================

// Use when data object is complex or variable
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.anything(),  // Skip data object entirely
  'Processing'  // Just check the message
);

// ============================================================================
// CRITICAL GOTCHA: Multiple log levels
// ============================================================================

// Different tests use different log levels:
mockLogger.info   // Normal operations (execute*, process*, status)
mockLogger.error  // Failures (PRPRuntime execution failed)
mockLogger.warn   // Non-critical issues (session path not available)
mockLogger.debug  // Diagnostic info (may not be tested)

// Ensure you use the RIGHT mockLogger method!

// ============================================================================
// CRITICAL GOTCHA: Remove consoleSpy setup AND cleanup
// ============================================================================

// When removing vi.spyOn(console, 'log'), also remove:
// - const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
// - consoleSpy.mockRestore(); (usually in afterEach or at end of test)

// ============================================================================
// CRITICAL GOTCHA: Implementation logs MORE than tests expect
// ============================================================================

// executePhase logs:
// 1. 'Setting status to Implementing'
// 2. 'Executing Phase'
// Tests may only check one - that's OK!

// Focus on KEY log points, not every single call.
```

### Integration Points

```yaml
NO_CHANGES_TO:
  - src/core/task-orchestrator.ts (implementation is correct)
  - src/utils/logger.ts (logger factory is correct)
  - Mock setup in lines 22-34 of test file (already correct)

DEPENDENCIES:
  - task: P3.M1.T1.S1 (Test analysis)
    status: Implementing in parallel
    contract: Analysis provides complete test list and implementation patterns
    evidence: Analysis document identifies all 21 tests with exact line numbers

  - task: P3.M2 (Fix Session Utils Validation Test)
    status: Planned
    contract: Similar pattern may apply to other test failures
    reason: Understanding test-implementation alignment helps future fixes

FILES_TO_MODIFY:
  - file: tests/unit/core/task-orchestrator.test.ts
    action: Update test assertions from consoleSpy to mockLogger
    lines: 298-328, 404-433, 500-529, 608-649, 721-876, 963-973, 1140-1210, 2132-2619
    count: 21 tests across ~8 describe blocks

PRESERVE:
  - Mock setup (lines 22-34)
  - All test logic and setup code
  - Describe block structure
  - Test data and helper functions
  - All other mocks (task-utils, scope-resolver, git-commit, etc.)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each test block update - fix before proceeding
npm run test:run -- tests/unit/core/task-orchestrator.test.ts 2>&1 | head -50

# Check for TypeScript errors
npx tsc --noEmit tests/unit/core/task-orchestrator.test.ts

# Check for linting errors
npm run lint -- tests/unit/core/task-orchestrator.test.ts

# Expected: Zero syntax errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific describe blocks as they're updated
npm run test:run -- tests/unit/core/task-orchestrator.test.ts -t "executePhase"

# Test another block
npm run test:run -- tests/unit/core/task-orchestrator.test.ts -t "executeMilestone"

# Test all updated tests
npm run test:run -- tests/unit/core/task-orchestrator.test.ts

# Expected: All tests pass. Previously failing tests (21) now show green checkmarks.
# If failing, debug root cause: check assertion matches implementation logging.
```

### Level 3: Regression Testing (System Validation)

```bash
# Ensure no other tests broke
npm run test:run -- tests/unit/core/

# Ensure logger tests still pass (verify we didn't break logger)
npm run test:run -- tests/unit/logger.test.ts

# Full unit test suite
npm run test:run -- tests/unit/

# Expected: All tests pass. No new failures introduced.
# If other tests fail, investigate if changes affected shared test setup.
```

### Level 4: Integration Validation (Full System)

```bash
# Run all tests to ensure complete system integrity
npm run test:run

# Expected: All tests pass, including E2E and integration tests.

# Verify specific test count
npm run test:run -- tests/unit/core/task-orchestrator.test.ts 2>&1 | grep -E "Test Files|Tests"

# Expected output should show:
# - All 21 previously failing tests now passing
# - No new test failures
# - Total test count should be the same (no tests removed)
```

## Final Validation Checklist

### Technical Validation

- [ ] All 21 tests updated from consoleSpy to mockLogger assertions
- [ ] No `vi.spyOn(console, 'log')` calls remain in test file
- [ ] No `consoleSpy.mockRestore()` calls remain
- [ ] All tests pass: `npm run test:run -- tests/unit/core/task-orchestrator.test.ts`
- [ ] Mock setup unchanged (lines 22-34 preserved)
- [ ] No changes to implementation files
- [ ] No new linting errors
- [ ] No new TypeScript errors

### Feature Validation

- [ ] All 21 previously failing tests now pass
- [ ] Test assertions match Pino structured logging format
- [ ] Correct log levels used (info, warn, error)
- [ ] Tests verify structured data, not formatted strings
- [ ] No test logic changed, only assertions
- [ ] Test coverage maintained (no tests removed)

### Code Quality Validation

- [ ] Follows existing codebase patterns from task-patcher.test.ts
- [ ] Consistent assertion patterns across all 21 tests
- [ ] Mock cleanup preserved in beforeEach hooks
- [ ] Test structure unchanged (describe blocks preserved)
- [ ] No test data or helper functions modified

### Documentation & Handoff

- [ ] Research notes saved to `research/` subdirectory
- [ ] Any deviations from PRP documented
- [ ] Git commit message references this PRP
- [ ] Ready for P3.M2 (Session Utils test fix)

## Anti-Patterns to Avoid

- ❌ **Don't modify mock setup** - Lines 22-34 are correct, preserve them
- ❌ **Don't change implementation** - `src/core/task-orchestrator.ts` stays unchanged
- ❌ **Don't update tests one at a time** - Update all 21 in single change for consistency
- ❌ **Don't add console.log to implementation** - Tests adapt to implementation, not vice versa
- ❌ **Don't use vi.mocked() unnecessarily** - Direct mockLogger access works fine
- ❌ **Don't forget to remove mockRestore()** - Remove consoleSpy cleanup code
- ❌ **Don't skip test cleanup** - Remove ALL consoleSpy references from each test
- ❌ **Don't change test logic** - Only update assertions, preserve test behavior
- ❌ **Don't add child logger mock** - Task Orchestrator doesn't use .child()
- ❌ **Don't modify other test files** - Only task-orchestrator.test.ts needs changes
- ❌ **Don't use exact object matching if brittle** - Use `expect.objectContaining()` for flexibility
- ❌ **Don't forget log level specificity** - Use info/warn/error appropriately
- ❌ **Don't verify every single log call** - Focus on key log points
- ❌ **Don't break test describe blocks** - Preserve test organization

---

## Confidence Score: 10/10

**One-Pass Implementation Success Likelihood**: EXTREMELY HIGH

**Rationale**:
1. Clear task boundaries - update test assertions only, no implementation changes
2. All 21 failing tests identified with exact line numbers from P3.M1.T1.S1
3. Mock setup is already correct and well-documented
4. Assertion patterns provided with before/after examples
5. Comprehensive research on Pino mocking best practices
6. Existing codebase patterns to follow (task-patcher.test.ts)
7. Validation commands are project-specific and executable
8. Template structure provides complete framework
9. No architectural decisions needed (Pino is correct)
10. Straightforward search-and-replace pattern with careful verification

**Potential Risks**:
- **Risk 1**: Some tests may have unique assertion patterns not covered in examples (Very Low - research covers all variations)
- **Risk 2**: Implementation may have more log calls than expected (Low - use flexible matching with `expect.objectContaining()`)
- **Risk 3**: Mock state leakage between tests if cleanup incomplete (Low - existing beforeEach should handle)

**Validation**: The completed PRP provides everything needed to update all 21 test assertions successfully. All failing tests are identified, assertion patterns are documented with examples, mock setup is preserved, and validation commands verify success. The implementation is straightforward search-and-replace with careful attention to log levels and structured data format.

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-16
**Status**: Ready for Implementation
**Dependencies**: P3.M1.T1.S1 (Test Analysis) - IN PROGRESS
