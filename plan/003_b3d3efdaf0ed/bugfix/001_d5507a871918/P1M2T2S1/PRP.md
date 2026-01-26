# Product Requirement Prompt (PRP): Update FixCycleWorkflow Constructor to Accept Session Path

**Task ID**: P1.M2.T2.S1
**Work Item**: Update FixCycleWorkflow constructor to accept session path
**Date**: 2026-01-26
**Confidence Score**: 9/10

---

## Goal

**Feature Goal**: Update FixCycleWorkflow constructor signature to accept `sessionPath` (string) instead of `testResults` (TestResults object), enabling the workflow to read TEST_RESULTS.md from disk as part of the bug fix cycle refactoring.

**Deliverable**: Updated FixCycleWorkflow class with modified constructor signature that:
1. Accepts `sessionPath: string` as first parameter (replacing `testResults: TestResults`)
2. Stores `sessionPath` as instance property `this.sessionPath`
3. Removes `testResults` parameter and in-memory storage
4. Preserves all other constructor parameters (`prdContent`, `taskOrchestrator`, `sessionManager`)
5. Maintains existing constructor validation logic

**Success Definition**:
- Constructor signature changed from `constructor(testResults, prdContent, taskOrchestrator, sessionManager)` to `constructor(sessionPath, prdContent, taskOrchestrator, sessionManager)`
- `this.sessionPath` is stored and accessible for later file reading (subtask P1.M2.T2.S2)
- All existing unit tests are updated to pass `sessionPath` instead of `testResults`
- Constructor validation that checks for bugs is deferred to file loading in next subtask
- No compilation errors or type errors after changes

---

## Why

- **Fixes Bug 3** from architecture/003_system_context.md: TEST_RESULTS.md workflow timing issue
- **Enables file-based persistence**: FixCycleWorkflow will read bug report from disk in next subtask (P1.M2.T2.S2)
- **Aligns with PRD requirement**: Bug fix cycle should use persistent TEST_RESULTS.md file, not in-memory object
- **Prepares for session validation**: sessionPath needed for bugfix session path validation (P1.M3.T1)
- **Maintains architecture consistency**: Matches pattern where workflows accept paths, not data objects

---

## What

**User-Visible Behavior**: No direct user-visible change in this subtask. This is a constructor refactoring that enables file reading in the next subtask.

**Technical Requirements**:

### Constructor Signature Changes

**BEFORE** (current at src/workflows/fix-cycle-workflow.ts:100-105):
```typescript
constructor(
  testResults: TestResults,
  prdContent: string,
  taskOrchestrator: TaskOrchestrator,
  sessionManager: SessionManager
)
```

**AFTER** (target):
```typescript
constructor(
  sessionPath: string,
  prdContent: string,
  taskOrchestrator: TaskOrchestrator,
  sessionManager: SessionManager
)
```

### Instance Property Changes

**REMOVE** (line 57):
```typescript
testResults: TestResults;
```

**ADD**:
```typescript
/** Path to bugfix session directory for reading TEST_RESULTS.md */
sessionPath: string;
```

### Constructor Logic Changes

**REMOVE** (lines 108-111):
```typescript
// Validate inputs
if (testResults.bugs.length === 0) {
  throw new Error('FixCycleWorkflow requires testResults with bugs to fix');
}
```

**REMOVE** (line 113):
```typescript
this.testResults = testResults;
```

**ADD**:
```typescript
// Validate sessionPath is non-empty string
if (typeof sessionPath !== 'string' || sessionPath.trim() === '') {
  throw new Error('FixCycleWorkflow requires valid sessionPath');
}

// Store sessionPath for file reading
this.sessionPath = sessionPath;
```

**PRESERVE** (lines 114-132): All other constructor logic remains unchanged
- `this.prdContent = prdContent;`
- `this.taskOrchestrator = taskOrchestrator;`
- `this.sessionManager = sessionManager;`
- Correlation logger setup
- Logging statements (update to reference sessionPath instead of testResults.bugs.length)

### Usage Changes Required (Future Subtasks)

**NOTE**: This subtask ONLY changes the constructor. Calling code updates occur in P1.M2.T2.S4.

- `src/workflows/prp-pipeline.ts:1165-1170` - will be updated in P1.M2.T2.S4
- Unit tests - updated in this subtask

### Success Criteria

- [ ] Constructor signature accepts `sessionPath: string` as first parameter
- [ ] Constructor throws if `sessionPath` is empty string
- [ ] `this.sessionPath` property is set and accessible
- [ ] `this.testResults` property is removed
- [ ] All unit tests updated to pass `sessionPath` instead of `testResults`
- [ ] Constructor logging updated to reference sessionPath
- [ ] No TypeScript compilation errors
- [ ] No existing functionality broken (tests pass)

---

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" Test**: If someone knew nothing about this codebase, they would have everything needed to:
- Understand the current constructor signature
- Know what to change and what to preserve
- Update tests correctly
- Follow file reading patterns for next subtask

### Documentation & References

```yaml
# MUST READ - Architecture context for this bug fix
- url: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/003_system_context.md
  why: Bug 3 details (lines 144-196) - explains TEST_RESULTS.md workflow timing issue and expected flow
  critical: "Expected flow: BugHuntWorkflow → Write TEST_RESULTS.md → FixCycleWorkflow reads file"
  section: "Bug 3: TEST_RESULTS.md Workflow Timing"

# MUST READ - Current implementation to modify
- file: src/workflows/fix-cycle-workflow.ts
  why: Target file for constructor update - lines 100-133 contain constructor logic
  pattern: "Constructor stores testResults as instance property, validates bugs array is non-empty"
  gotcha: "Constructor validation checks testResults.bugs.length - this must be removed since testResults no longer passed"

# MUST READ - Test patterns to update
- file: tests/unit/workflows/fix-cycle-workflow.test.ts
  why: All constructor tests pass testResults - need updating to pass sessionPath instead
  pattern: "Factory functions createTestResults, createMockTaskOrchestrator, createMockSessionManager"
  gotcha: "Tests mock BugHuntWorkflow - constructor test validation needs to change from bug count to sessionPath validation"

# MUST READ - Calling code (updated in future subtask)
- file: src/workflows/prp-pipeline.ts
  why: Lines 1165-1170 instantiate FixCycleWorkflow - will need sessionPath in P1.M2.T2.S4
  pattern: "new FixCycleWorkflow(testResults, prdContent, this.taskOrchestrator, this.sessionManager)"
  gotcha: "sessionPath comes from this.sessionManager.currentSession.metadata.path"

# REFERENCE - File reading pattern for next subtask
- file: src/core/session-utils.ts
  why: Lines 197-208 show readUTF8FileStrict() pattern for reading files with validation
  pattern: "readUTF8FileStrict(path, operation) throws SessionFileError on failure"
  gotcha: "Use readFile() with 'utf-8' encoding for JSON files, then JSON.parse() and Zod validate"

# REFERENCE - JSON reading pattern
- file: src/core/session-utils.ts
  why: Lines 492-534 show readTasksJSON() pattern for reading and validating JSON from disk
  pattern: "readFile(path, 'utf-8') → JSON.parse() → Schema.parse() → return validated"
  gotcha: "Always wrap readFile in try/catch and throw SessionFileError with descriptive operation name"

# REFERENCE - TestResults schema for validation
- file: src/core/models.ts
  why: Lines 1902-1907 define TestResultsSchema for Zod validation
  pattern: "z.object({ hasBugs: z.boolean(), bugs: z.array(BugSchema), summary: z.string(), recommendations: z.array(z.string()) })"
  gotcha: "TestResultsSchema will be used in next subtask (P1.M2.T2.S2) to validate loaded JSON"

# REFERENCE - BugHuntWorkflow write pattern
- file: src/workflows/bug-hunt-workflow.ts
  why: Lines 323-385 show writeBugReport() method that writes TEST_RESULTS.md
  pattern: "JSON.stringify(testResults, null, 2) → atomicWrite(resolve(sessionPath, 'TEST_RESULTS.md'), content)"
  gotcha: "File is JSON format, not markdown format despite .md extension"

# REFERENCE - Groundswell Workflow base class
- file: node_modules/groundswell/dist/Workflow.js
  why: FixCycleWorkflow extends Workflow - must call super('FixCycleWorkflow') in constructor
  pattern: "super(className) initializes status, timing tracking from Groundswell"
  gotcha: "No changes needed to super() call - preserve existing line 106"
```

### Current Codebase Tree

```bash
src/
├── workflows/
│   ├── fix-cycle-workflow.ts    # TARGET: Constructor at lines 100-133
│   ├── bug-hunt-workflow.ts     # REFERENCE: writeBugReport() at lines 323-385
│   └── prp-pipeline.ts          # CALLING CODE: Lines 1165-1170 (update in P1.M2.T2.S4)
├── core/
│   ├── session-utils.ts         # REFERENCE: readUTF8FileStrict() at 197-208, readTasksJSON() at 492-534
│   ├── models.ts                # REFERENCE: TestResultsSchema at 1902-1907
│   ├── task-orchestrator.ts
│   └── session-manager.ts
└── utils/
    └── logger.ts

tests/
└── unit/
    └── workflows/
        └── fix-cycle-workflow.test.ts  # UPDATE: All constructor tests (lines 114-196)
```

### Desired Codebase Tree (after this subtask)

```bash
# No new files - modifications only
src/workflows/fix-cycle-workflow.ts  # MODIFIED: Constructor signature changed
tests/unit/workflows/fix-cycle-workflow.test.ts  # MODIFIED: Tests updated
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Constructor validation must change
// BEFORE: Checks testResults.bugs.length === 0
// AFTER: Cannot validate bugs yet (file not read), just validate sessionPath is non-empty

// GOTCHA: testResults property used throughout the class
// Lines 151-152, 301 use this.testResults.bugs.length
// These references will be updated in P1.M2.T2.S3 when loadBugReport() is added

// GOTCHA: Test factory functions create in-memory TestResults
// Tests will need to create mock session path strings instead
// Example: 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918'

// CRITICAL: Groundswell Workflow base class requires string identifier
// Line 106: super('FixCycleWorkflow') - MUST PRESERVE THIS

// CRITICAL: Correlation logger uses testResults.bugs.length in logging (lines 125, 130)
// Update logging to reference sessionPath instead:
// BEFORE: initialBugCount: testResults.bugs.length
// AFTER: sessionPath: sessionPath

// GOTCHA: Constructor tests check for Error thrown when bugs array empty
// Test at line 115 expects: 'requires testResults with bugs to fix'
// This validation is removed since file not read yet in constructor
// Update test to check for: 'requires valid sessionPath' instead

// CRITICAL: TEST_RESULTS.md is JSON format, not markdown
// Despite .md extension, file contains JSON.stringify(testResults, null, 2)
// Next subtask will read with: JSON.parse(content) then TestResultsSchema.parse()

// GOTCHA: Session path validation not added in this subtask
// Bugfix session path validation (checking for 'bugfix' in path)
// is added in P1.M3.T1.S1 - just validate non-empty string here
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models in this subtask. We are modifying an existing class constructor.

**Type Changes**:
```typescript
// FixCycleWorkflow class - BEFORE
export class FixCycleWorkflow extends Workflow {
  testResults: TestResults;  // REMOVE
  // ... other properties
}

// FixCycleWorkflow class - AFTER
export class FixCycleWorkflow extends Workflow {
  /** Path to bugfix session directory for reading TEST_RESULTS.md */
  sessionPath: string;  // ADD
  // ... other properties
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY FixCycleWorkflow constructor signature
  FILE: src/workflows/fix-cycle-workflow.ts
  POSITION: Lines 100-105
  IMPLEMENT: Change first parameter from testResults: TestResults to sessionPath: string
  PRESERVE: All other parameters (prdContent, taskOrchestrator, sessionManager) unchanged
  PRESERVE: super('FixCycleWorkflow') call at line 106
  NAMING: Parameter name must be sessionPath (camelCase)

Task 2: REMOVE testResults instance property
  FILE: src/workflows/fix-cycle-workflow.ts
  POSITION: Line 57
  REMOVE: "testResults: TestResults;" comment and property declaration
  ADD: JSDoc comment for sessionPath property
  ADD: "sessionPath: string;" property declaration

Task 3: UPDATE constructor validation logic
  FILE: src/workflows/fix-cycle-workflow.ts
  POSITION: Lines 108-111
  REMOVE: Bug count validation (if testResults.bugs.length === 0)
  ADD: sessionPath validation (check non-empty string)
  PATTERN: Follow existing validation style - throw Error with descriptive message
  ERROR_MESSAGE: "FixCycleWorkflow requires valid sessionPath"

Task 4: UPDATE constructor property assignments
  FILE: src/workflows/fix-cycle-workflow.ts
  POSITION: Line 113
  REMOVE: "this.testResults = testResults;"
  ADD: "this.sessionPath = sessionPath;"
  PRESERVE: Lines 114-116 (prdContent, taskOrchestrator, sessionManager assignments)

Task 5: UPDATE constructor logging statements
  FILE: src/workflows/fix-cycle-workflow.ts
  POSITION: Lines 125, 130
  BEFORE: initialBugCount: testResults.bugs.length
  AFTER: sessionPath: sessionPath
  PRESERVE: All other log fields (maxIterations, correlationId)

Task 6: UPDATE unit test constructor validation tests
  FILE: tests/unit/workflows/fix-cycle-workflow.test.ts
  POSITION: Lines 115-135
  IMPLEMENT: Test that empty string sessionPath throws Error
  IMPLEMENT: Test that non-empty string sessionPath does NOT throw
  REMOVE: Test for empty bugs array (that validation is gone)
  ERROR_MESSAGE_CHECK: 'requires valid sessionPath'

Task 7: UPDATE unit test initialization tests
  FILE: tests/unit/workflows/fix-cycle-workflow.test.ts
  POSITION: Lines 137-174
  UPDATE: Test assertions to check workflow.sessionPath instead of workflow.testResults
  UPDATE: Constructor calls to pass sessionPath string instead of testResults object
  REMOVE: Expectations for testResults property
  ADD: Expectations for sessionPath property

Task 8: UPDATE remaining unit test constructor calls
  FILE: tests/unit/workflows/fix-cycle-workflow.test.ts
  POSITION: All test cases (lines 200-747)
  FIND: All instances of "new FixCycleWorkflow(testResults, ...)"
  REPLACE: "new FixCycleWorkflow('/mock/session/path', ...)"
  PRESERVE: All other constructor parameters (prdContent, orchestrator, sessionManager)
  COUNT: Approximately 15+ constructor calls to update across test file

Task 9: VERIFY TypeScript compilation
  COMMAND: npm run tsc --noEmit (or npx tsc --noEmit)
  EXPECTED: No compilation errors
  CHECK: FixCycleWorkflow constructor type signature
  CHECK: All test files compile with new signature

Task 10: RUN unit tests for FixCycleWorkflow
  COMMAND: npm test -- tests/unit/workflows/fix-cycle-workflow.test.ts
  EXPECTED: All tests pass
  VERIFY: Constructor validation tests pass
  VERIFY: Initialization tests pass
  VERIFY: All workflow phase tests pass (createFixTasks, executeFixes, etc.)
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Constructor parameter validation
// FILE: src/workflows/fix-cycle-workflow.ts, lines 108-111
// BEFORE:
if (testResults.bugs.length === 0) {
  throw new Error('FixCycleWorkflow requires testResults with bugs to fix');
}

// AFTER:
if (typeof sessionPath !== 'string' || sessionPath.trim() === '') {
  throw new Error('FixCycleWorkflow requires valid sessionPath');
}

// Pattern 2: Instance property declaration
// FILE: src/workflows/fix-cycle-workflow.ts, line 57
// BEFORE:
/** Initial test results from BugHuntWorkflow */
testResults: TestResults;

// AFTER:
/** Path to bugfix session directory for reading TEST_RESULTS.md */
sessionPath: string;

// Pattern 3: Property assignment in constructor
// FILE: src/workflows/fix-cycle-workflow.ts, line 113
// BEFORE:
this.testResults = testResults;

// AFTER:
this.sessionPath = sessionPath;

// Pattern 4: Logging update
// FILE: src/workflows/fix-cycle-workflow.ts, lines 125, 130
// BEFORE:
this.logger.info('[FixCycleWorkflow] Initialized', {
  initialBugCount: testResults.bugs.length,
  maxIterations: this.maxIterations,
});

// AFTER:
this.logger.info('[FixCycleWorkflow] Initialized', {
  sessionPath: sessionPath,
  maxIterations: this.maxIterations,
});

// Pattern 5: Test constructor call update
// FILE: tests/unit/workflows/fix-cycle-workflow.test.ts
// BEFORE:
new FixCycleWorkflow(
  testResults,
  'PRD content',
  orchestrator,
  sessionManager
);

// AFTER:
new FixCycleWorkflow(
  'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918',  // Mock session path
  'PRD content',
  orchestrator,
  sessionManager
);

// Pattern 6: Test assertion update
// FILE: tests/unit/workflows/fix-cycle-workflow.test.ts
// BEFORE:
expect(workflow.testResults).toEqual(testResults);

// AFTER:
expect(workflow.sessionPath).toBe('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');

// GOTCHA: testResults property used in createFixTasks() method
// Lines 151-152 reference this.testResults.bugs.length
// These will be updated in P1.M2.T2.S3 when loadBugReport() method is added
// For this subtask, those references remain but will cause compilation errors
// This is EXPECTED - the fix comes in the next subtask
```

### Integration Points

```yaml
# NOTE: This subtask only modifies FixCycleWorkflow constructor
# Calling code updates occur in P1.M2.T2.S4

FUTURE_INTEGRATION:
  - file: src/workflows/prp-pipeline.ts
    line: 1165-1170
    update_in: P1.M2.T2.S4
    change: "Pass sessionManager.currentSession.metadata.path instead of testResults"

FUTURE_INTEGRATION:
  - file: src/workflows/fix-cycle-workflow.ts
    method: loadBugReport()
    add_in: P1.M2.T2.S2
    purpose: "Read TEST_RESULTS.md from this.sessionPath and return TestResults"

FUTURE_INTEGRATION:
  - file: src/workflows/fix-cycle-workflow.ts
    method: run()
    update_in: P1.M2.T2.S3
    change: "Call this.loadBugReport() to get testResults instead of using this.testResults"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npm run lint  # Or: npx eslint src/workflows/fix-cycle-workflow.ts --fix

# Type checking with TypeScript
npx tsc --noEmit

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.

# Common errors and fixes:
# Error: "Property 'testResults' does not exist on type 'FixCycleWorkflow'"
# Fix: This is EXPECTED - testResults removed, references updated in P1.M2.T2.S3
# Note: createFixTasks() method (line 151) will have this error - fix in next subtask

# Error: "Expected 4 arguments, but got 3" in test files
# Fix: Update all test constructor calls to pass sessionPath as first parameter
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test FixCycleWorkflow specifically
npm test -- tests/unit/workflows/fix-cycle-workflow.test.ts

# Expected: All tests pass. If failing, debug root cause and fix implementation.

# Test cases to verify:
# 1. Constructor validation: throws on empty sessionPath
# 2. Constructor validation: accepts non-empty sessionPath
# 3. Constructor initialization: sets sessionPath property
# 4. Constructor initialization: sets all other properties correctly
# 5. Constructor logging: logs sessionPath instead of bug count

# Full test suite for workflow tests
npm test -- tests/unit/workflows/

# Expected: All workflow tests pass. FixCycleWorkflow tests pass, others unaffected.
```

### Level 3: Integration Testing (System Validation)

```bash
# NOTE: FixCycleWorkflow is called by PRPPipeline.runQACycle()
# PRPPipeline will be updated in P1.M2.T2.S4 to pass sessionPath
# For this subtask, we only verify constructor changes work in isolation

# Verify constructor signature is correct
node -e "
import { FixCycleWorkflow } from './src/workflows/fix-cycle-workflow.js';
const workflow = new FixCycleWorkflow(
  'test/session/path',
  'PRD content',
  {},
  {}
);
console.log('Constructor signature accepted');
console.log('sessionPath:', workflow.sessionPath);
"

# Expected: No errors, sessionPath property is 'test/session/path'
```

### Level 4: Manual & Domain-Specific Validation

```bash
# Verify the changes align with Bug 3 fix strategy
cat plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/003_system_context.md | grep -A 30 "Bug 3"

# Verify constructor signature matches expected pattern
grep -A 5 "constructor(" src/workflows/fix-cycle-workflow.ts

# Expected output:
#   constructor(
#     sessionPath: string,
#     prdContent: string,
#     taskOrchestrator: TaskOrchestrator,
#     sessionManager: SessionManager
#   )

# Verify sessionPath property exists
grep "sessionPath:" src/workflows/fix-cycle-workflow.ts

# Expected output:
#   /** Path to bugfix session directory for reading TEST_RESULTS.md */
#   sessionPath: string;

# Verify testResults property removed
! grep "testResults: TestResults" src/workflows/fix-cycle-workflow.ts

# Expected: No matches (property removed)

# Verify all test constructor calls updated
grep "new FixCycleWorkflow(" tests/unit/workflows/fix-cycle-workflow.test.ts | grep -v "sessionPath"

# Expected: No matches (all calls should include sessionPath)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Constructor signature changed: first parameter is `sessionPath: string`
- [ ] `testResults: TestResults` parameter removed from constructor
- [ ] `testResults` property removed from class (line 57)
- [ ] `sessionPath: string` property added to class
- [ ] Constructor validation updated: checks `sessionPath` is non-empty string
- [ ] Constructor validation removed: no longer checks `testResults.bugs.length`
- [ ] Property assignment updated: `this.sessionPath = sessionPath`
- [ ] Property assignment removed: no longer assigns `this.testResults`
- [ ] Logging updated: references `sessionPath` instead of `testResults.bugs.length`
- [ ] `super('FixCycleWorkflow')` call preserved (line 106)
- [ ] All other constructor parameters preserved (`prdContent`, `taskOrchestrator`, `sessionManager`)
- [ ] No TypeScript compilation errors: `npx tsc --noEmit` passes
- [ ] No linting errors: `npm run lint` passes

### Unit Test Validation

- [ ] All constructor calls in test file updated to pass `sessionPath`
- [ ] Constructor validation tests updated (empty string throws)
- [ ] Constructor initialization tests updated (checks `sessionPath` property)
- [ ] All `workflow.testResults` references changed to `workflow.sessionPath`
- [ ] Test factory functions preserved (`createMockTaskOrchestrator`, `createMockSessionManager`)
- [ ] `npm test -- tests/unit/workflows/fix-cycle-workflow.test.ts` passes
- [ ] All test cases pass (constructor, createFixTasks, executeFixes, checkComplete, run loop)

### Code Quality Validation

- [ ] JSDoc comments added for `sessionPath` property
- [ ] JSDoc comments removed for `testResults` property
- [ ] Constructor parameter comments updated
- [ ] Error messages are descriptive and consistent
- [ ] Code follows existing patterns in file
- [ ] No commented-out code left behind
- [ ] No debug statements added
- [ ] Indentation and formatting consistent

### Integration & Future Work Validation

- [ ] PRPPipeline calling code NOT modified (happens in P1.M2.T2.S4)
- [ ] `createFixTasks()` method reference to `this.testResults` left as-is (fixed in P1.M2.T2.S3)
- [ ] `run()` method reference to `this.testResults` left as-is (fixed in P1.M2.T2.S3)
- [ ] Ready for P1.M2.T2.S2: Add `loadBugReport()` method
- [ ] Ready for P1.M2.T2.S3: Update `run()` to call `loadBugReport()`
- [ ] Ready for P1.M2.T2.S4: Update PRPPipeline to pass `sessionPath`

---

## Anti-Patterns to Avoid

- ❌ **Don't modify PRPPipeline calling code** - That's P1.M2.T2.S4
- ❌ **Don't add loadBugReport() method** - That's P1.M2.T2.S2
- ❌ **Don't update run() method** - That's P1.M2.T2.S3
- ❌ **Don't add bugfix session validation** - That's P1.M3.T1.S1
- ❌ **Don't skip constructor validation** - Must validate sessionPath is non-empty
- ❌ **Don't keep testResults property** - Must remove to avoid confusion
- ❌ **Don't change other constructor parameters** - Only change first parameter
- ❌ **Don't modify super() call** - Must preserve `super('FixCycleWorkflow')`
- ❌ **Don't use vague error messages** - Be specific: "requires valid sessionPath"
- ❌ **Don't forget to update all test constructor calls** - Every single one needs sessionPath
- ❌ **Don't break existing test patterns** - Preserve factory functions and mock setup
- ❌ **Don't add file reading logic** - That's the next subtask (P1.M2.T2.S2)

---

## Dependencies & Sequencing

### Prerequisites (Already Complete)

- ✅ P1.M2.T1.S1: BugHuntWorkflow.writeBugReport() method exists
- ✅ P1.M2.T1.S2: BugHuntWorkflow.run() calls writeBugReport()
- ✅ P1.M2.T1.S3: BugHuntWorkflow write tests added

### This Subtask (P1.M2.T2.S1)

- 🔄 **IN PROGRESS**: Update FixCycleWorkflow constructor to accept sessionPath

### Dependent Subtasks (Must Complete After This)

- ⏳ P1.M2.T2.S2: Add loadBugReport() method to FixCycleWorkflow (requires this.sessionPath)
- ⏳ P1.M2.T2.S3: Update FixCycleWorkflow.run() to call loadBugReport()
- ⏳ P1.M2.T2.S4: Update PRPPipeline to pass sessionPath to FixCycleWorkflow
- ⏳ P1.M2.T2.S5: Add unit tests for FixCycleWorkflow file loading

### Parallel Work

- None - this subtask must complete before dependent subtasks can begin

---

## Research Notes

### File Reading Pattern Discovery

During research, identified the standard pattern for reading JSON files from disk in this codebase:

**Pattern from `src/core/session-utils.ts:492-534` (readTasksJSON)**:
```typescript
const tasksPath = resolve(sessionPath, 'tasks.json');
const content = await readFile(tasksPath, 'utf-8');
const parsed = JSON.parse(content);
const validated = BacklogSchema.parse(parsed);
return validated;
```

This pattern will be used in P1.M2.T2.S2 when implementing `loadBugReport()` method.

### Constructor Validation Pattern

Current validation pattern in FixCycleWorkflow:
```typescript
if (testResults.bugs.length === 0) {
  throw new Error('FixCycleWorkflow requires testResults with bugs to fix');
}
```

This validation is REMOVED because:
1. File not read in constructor (deferred to loadBugReport method)
2. Cannot validate bugs without reading file first
3. Constructor only validates sessionPath is non-empty string

Bug count validation will occur in P1.M2.T2.S2 (loadBugReport method).

### Test Mock Pattern

Discovered test mocking pattern from `tests/unit/workflows/fix-cycle-workflow.test.ts`:
- Factory functions create test data: `createTestBug()`, `createMockTaskOrchestrator()`, `createMockSessionManager()`
- BugHuntWorkflow is mocked globally: `vi.mock('../../../src/workflows/bug-hunt-workflow.js')`
- All tests avoid real I/O through mocking

This pattern preserved - tests still use mocks, just pass different constructor parameter.

### Groundswell Workflow Base Class

FixCycleWorkflow extends Groundswell's Workflow class:
- Requires `super('FixCycleWorkflow')` call in constructor
- Provides status tracking, step decorators, timing tracking
- No changes needed to super() call

Verified: Constructor changes do not affect base class integration.

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Validation**:
- Constructor signature change is straightforward parameter swap
- Test updates are mechanical (find/replace with validation)
- No complex logic changes in this subtask
- All patterns identified from existing codebase
- File reading deferred to next subtask (reduces complexity)

**Risk Mitigation**:
- Clear scope boundary: ONLY constructor, NO file reading
- Comprehensive test coverage to catch regressions
- Dependent subtasks clearly sequenced
- Architecture context provides complete picture

**Expected Duration**: 30-45 minutes
- 15 min: Update constructor in fix-cycle-workflow.ts
- 20 min: Update all tests in fix-cycle-workflow.test.ts
- 10 min: Run tests and fix any issues

---

## References

- Architecture: `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/003_system_context.md`
- Bug Report: `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/TEST_RESULTS.md`
- Implementation: `src/workflows/fix-cycle-workflow.ts`
- Tests: `tests/unit/workflows/fix-cycle-workflow.test.ts`
- File Utils: `src/core/session-utils.ts`
- Models: `src/core/models.ts`
- Calling Code: `src/workflows/prp-pipeline.ts:1165-1170`

---

**End of PRP**
