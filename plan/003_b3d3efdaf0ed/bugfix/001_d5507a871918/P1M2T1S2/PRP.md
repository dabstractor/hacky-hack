# PRP: Update BugHuntWorkflow.run() to Call writeBugReport

## Goal

**Feature Goal**: Modify the `BugHuntWorkflow.run()` method to automatically call `writeBugReport()` when critical or major bugs are found, ensuring `TEST_RESULTS.md` is written immediately after the bug hunt completes.

**Deliverable**: Updated `BugHuntWorkflow.run()` method that:

- Calls `generateReport()` to get `testResults`
- Checks if `testResults` has critical or major bugs
- If yes: calls `await this.writeBugReport(sessionPath, testResults)`
- Returns `testResults` (preserving backward compatibility)
- Adds debug logging when writing bug report

**Success Definition**:

- `TEST_RESULTS.md` is written to disk immediately when bugs are found
- The write happens before `run()` returns, ensuring persistence
- Session path is obtained from `PRPPipeline` caller via parameter or dependency
- Backward compatibility is maintained (still returns `TestResults`)
- All existing tests pass without modification
- New tests verify the automatic write behavior

## Why

- **Bug Fix Pipeline Timing**: Per system context Bug 3, `TEST_RESULTS.md` must be written immediately after `BugHuntWorkflow` completes, not delayed until after `FixCycleWorkflow` runs. The current flow writes the file too late.
- **Session Persistence**: Writing bug reports immediately ensures the bug fix session directory contains the `TEST_RESULTS.md` file when `FixCycleWorkflow` needs to read it.
- **Resumable Sessions**: Immediate persistence enables resuming bug fix sessions after interruption.
- **Separation of Concerns**: `BugHuntWorkflow` should own its output persistence, not rely on `PRPPipeline` to write files.
- **PRD Compliance**: PRD §4.4 requires the workflow to write `TEST_RESULTS.md` when bugs are found.

## What

### User-Visible Behavior

When the bug hunt workflow runs and finds bugs:

1. `BugHuntWorkflow.run()` executes the four phases (scope analysis, E2E testing, adversarial testing, report generation)
2. After `generateReport()` completes with bugs, `run()` automatically calls `writeBugReport(sessionPath, testResults)`
3. `TEST_RESULTS.md` is written to the session directory containing JSON bug data
4. `run()` returns the `TestResults` object (backward compatible)
5. Debug logging shows the write operation

### Success Criteria

- [ ] `BugHuntWorkflow.run()` calls `writeBugReport()` when bugs are found
- [ ] Session path is passed to `writeBugReport()` (from PRPPipeline or constructor)
- [ ] Write only happens for critical or major bugs (severity 'critical' or 'major')
- [ ] Backward compatibility: `run()` still returns `TestResults`
- [ ] Debug logging added: 'Writing TEST_RESULTS.md to {sessionPath}'
- [ ] Error handling preserves existing pattern (errors propagate, status set to 'failed')
- [ ] All existing tests pass without modification
- [ ] New tests verify automatic write behavior

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES. This PRP provides:

- Complete existing `BugHuntWorkflow.run()` implementation with all dependencies
- Exact location and pattern for modification
- How to obtain session path from calling context
- The `writeBugReport()` method implementation (from P1.M2.T1.S1)
- Test patterns and existing test structure
- Integration context with `PRPPipeline`
- All validation commands specific to this project

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/workflows/bug-hunt-workflow.ts
  why: Complete run() method implementation, writeBugReport method, logging patterns
  pattern: Lines 407-444 show current run() implementation
  pattern: Lines 323-385 show writeBugReport() implementation (from P1.M2.T1.S1)
  gotcha: run() must preserve existing error handling and status transitions
  critical: writeBugReport already exists - just need to call it from run()

- file: src/workflows/prp-pipeline.ts
  why: Shows how BugHuntWorkflow is called and session path is obtained
  pattern: Lines 1214-1285 show current problematic flow (file written too late)
  pattern: Line 1215 shows sessionPath pattern: this.sessionManager.currentSession?.metadata.path
  gotcha: BugHuntWorkflow doesn't have SessionManager - session path must be passed in
  critical: Need to decide: add sessionPath parameter vs. add SessionManager dependency

- file: src/workflows/fix-cycle-workflow.ts
  why: Shows pattern for workflows that need session access
  pattern: Constructor accepts SessionManager as dependency
  pattern: Accesses session path via this.sessionManager.currentSession?.metadata.path
  gotcha: BugHuntWorkflow uses simpler pattern (just prdContent + completedTasks)
  critical: Consider whether to add SessionManager dependency or pass sessionPath directly

- file: tests/unit/workflows/bug-hunt-workflow.test.ts
  why: Existing test patterns for run() method
  pattern: Lines 504-765 show comprehensive run() test coverage
  pattern: Tests mock agent, verify status transitions, verify return value
  gotcha: Tests don't currently pass session path - will need to update
  critical: Need to test writeBugReport is called with correct parameters

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T1S1/PRP.md
  why: PRP for writeBugReport method - explains the method being called
  section: Implementation Blueprint - Task 2 shows writeBugReport signature
  section: Known Gotchas - shows severity checking pattern

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/003_system_context.md
  why: Explains Bug 3 and why this change is needed
  section: Bug 3: TEST_RESULTS.md Workflow Timing
  gotcha: Current flow writes file too late - need to move write to after BugHuntWorkflow
```

### Current Codebase Tree

```bash
src/
├── workflows/
│   ├── bug-hunt-workflow.ts       # TARGET FILE - Update run() method here
│   │   ├── [EXISTING] Constructor (lines 79-110)
│   │   ├── [EXISTING] analyzeScope (lines 127-149)
│   │   ├── [EXISTING] creativeE2ETesting (lines 168-194)
│   │   ├── [EXISTING] adversarialTesting (lines 211-236)
│   │   ├── [EXISTING] generateReport (lines 255-311)
│   │   ├── [EXISTING] writeBugReport (lines 323-385) - from P1.M2.T1.S1
│   │   └── [TARGET] run() (lines 407-444) - MODIFY THIS METHOD
│   ├── fix-cycle-workflow.ts      # Has SessionManager dependency pattern
│   └── prp-pipeline.ts            # Calls BugHuntWorkflow, has sessionPath access
├── core/
│   ├── session-manager.ts         # SessionManager class
│   └── models.ts                  # TestResults, Bug, BugSeverity types

tests/
└── unit/
    └── workflows/
        └── bug-hunt-workflow.test.ts  # UPDATE - Add tests for run() write behavior
```

### Desired Codebase Tree

```bash
src/workflows/bug-hunt-workflow.ts
├── [EXISTING] Constructor (no changes)
├── [EXISTING] All phase methods (no changes)
├── [EXISTING] writeBugReport (no changes - from P1.M2.T1.S1)
└── [MODIFIED] run()
    ├── [EXISTING] Set status to 'running'
    ├── [EXISTING] Execute phases (analyzeScope, creativeE2ETesting, adversarialTesting)
    ├── [EXISTING] Call generateReport() to get testResults
    ├── [NEW] Check if testResults has critical or major bugs
    ├── [NEW] If yes, call writeBugReport(sessionPath, testResults)
    ├── [NEW] Log: 'Writing TEST_RESULTS.md to {sessionPath}'
    ├── [EXISTING] Set status to 'completed'
    ├── [EXISTING] Log success
    └── [EXISTING] Return testResults (backward compatible)

# Decision point: How to pass sessionPath to run()?
Option A: Add sessionPath parameter to run() method
Option B: Add sessionPath to constructor
Option C: Add SessionManager dependency to constructor
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: BugHuntWorkflow currently doesn't have session path access
// Current constructor: (prdContent: string, completedTasks: Task[])
// Must decide how to pass sessionPath - see Implementation Tasks

// CRITICAL: writeBugReport() exists from P1.M2.T1.S1
// It's a public method that accepts (sessionPath: string, testResults: TestResults)
// Just need to call it from run() with the right parameters

// CRITICAL: writeBugReport() already does severity checking
// It only writes if critical or major bugs are present
// No need to duplicate this check in run() - just call it

// CRITICAL: Session path pattern from PRPPipeline
const sessionPath = this.sessionManager.currentSession?.metadata.path;
// But BugHuntWorkflow doesn't have SessionManager dependency

// GOTCHA: Error handling must preserve existing pattern
// run() catches errors, sets status to 'failed', re-throws
// writeBugReport() call must not break this pattern

// GOTCHA: Status transitions must be preserved
// running -> completed (on success)
// running -> failed (on error)
// writeBugReport() errors should trigger failed status

// GOTCHA: Existing tests don't pass session path
// Tests will need updates to:
// 1. Pass session path to constructor or run()
// 2. Mock writeBugReport to verify it's called
// 3. Verify writeBugReport is called with correct parameters

// GOTCHA: Backward compatibility requirement
// run() MUST still return TestResults
// Calling code expects return value

// GOTCHA: writeBugReport() is async
// Must use await when calling it from run()

// GOTCHA: Logging pattern in run()
// Uses this.correlationLogger.info() for all logging
// Add log message: 'Writing TEST_RESULTS.md to {sessionPath}'

// GOTCHA: PRPPipeline integration point
// Current code at lines 1214-1285 writes file too late
// After this change, PRPPipeline should remove that file write code
// But that's a separate task (not in scope for this PRP)
```

## Implementation Blueprint

### Data Models and Structure

No new data models. Uses existing types:

```typescript
// From src/core/models.ts
export interface TestResults {
  readonly hasBugs: boolean; // true if critical/major bugs found
  readonly bugs: Bug[];
  readonly summary: string;
  readonly recommendations: string[];
}

export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: DECIDE session path passing strategy
  - OPTIONS:
    A) Add sessionPath parameter to run() method
    B) Add sessionPath to constructor (store as private field)
    C) Add SessionManager dependency to constructor
  - RECOMMENDATION: Option A - Add optional sessionPath parameter to run()
  - RATIONALE:
    - Minimal change to existing API
    - Backward compatible (optional parameter)
    - PRPPipeline already has sessionPath, can easily pass it
    - Doesn't change constructor signature (no test updates needed for constructor)
  - SIGNATURE: async run(sessionPath?: string): Promise<TestResults>
  - NULL CHECK: Only call writeBugReport if sessionPath is provided

Task 2: MODIFY run() method to call writeBugReport
  - LOCATION: src/workflows/bug-hunt-workflow.ts, lines 407-444
  - UPDATE signature: async run(sessionPath?: string): Promise<TestResults>
  - AFTER generateReport(): Add writeBugReport call
  - LOGIC:
    1. Call generateReport() to get testResults
    2. Check if sessionPath is provided
    3. If yes, call await this.writeBugReport(sessionPath, testResults)
    4. Log: 'Writing TEST_RESULTS.md to {sessionPath}' (before write)
    5. Return testResults
  - PRESERVE: All existing error handling and status transitions
  - PRESERVE: All existing logging
  - ADD: New log for writeBugReport call
  - PATTERN: Follow existing correlationLogger pattern

Task 3: UPDATE unit tests for run() method
  - LOCATION: tests/unit/workflows/bug-hunt-workflow.test.ts
  - EXISTING: Lines 504-765 have run() tests
  - ADD: New test case for writeBugReport invocation
  - MOCK: Spy on writeBugReport method
  - TEST CASES:
    1. Should call writeBugReport when sessionPath provided and bugs found
    2. Should NOT call writeBugReport when sessionPath not provided
    3. Should NOT call writeBugReport when no bugs found
    4. Should pass correct sessionPath and testResults to writeBugReport
    5. Should still return testResults when writeBugReport called
    6. Should set status to failed if writeBugReport throws
  - PATTERN: Use vi.spyOn(workflow, 'writeBugReport')
  - VERIFY: mockWriteBugReporttoHaveBeenCalledWith(sessionPath, testResults)

Task 4: VERIFY backward compatibility
  - TEST: Run existing tests without modifications
  - VERIFY: run() can still be called without sessionPath
  - VERIFY: run() still returns TestResults
  - VERIFY: No errors when sessionPath is undefined
  - RUN: npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts

Task 5: INTEGRATION with PRPPipeline (informational, not implementation)
  - NOTE: PRPPipeline will need to pass sessionPath to run()
  - PATTERN:
    const bugHunt = new BugHuntWorkflow(this.prdSnapshot, completedTasks);
    const sessionPath = this.sessionManager.currentSession?.metadata.path;
    const testResults = await bugHunt.run(sessionPath);
  - OUT OF SCOPE: PRPPipeline modification is separate task
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Updated run() method signature (optional parameter)
async run(sessionPath?: string): Promise<TestResults>

// Pattern 2: Call writeBugReport after generateReport
async run(sessionPath?: string): Promise<TestResults> {
  this.setStatus('running');
  this.correlationLogger.info('[BugHuntWorkflow] Starting bug hunt workflow');

  try {
    // Execute phases sequentially
    await this.analyzeScope();
    await this.creativeE2ETesting();
    await this.adversarialTesting();

    // Generate and return bug report
    const results = await this.generateReport();

    // NEW: Write bug report if sessionPath provided
    if (sessionPath) {
      this.correlationLogger.info(
        `[BugHuntWorkflow] Writing TEST_RESULTS.md to ${sessionPath}`
      );
      await this.writeBugReport(sessionPath, results);
    }

    this.setStatus('completed');
    this.correlationLogger.info(
      '[BugHuntWorkflow] Bug hunt workflow completed successfully',
      { hasBugs: results.hasBugs, bugCount: results.bugs.length }
    );

    return results;
  } catch (error) {
    // EXISTING: Error handling pattern
    this.setStatus('failed');
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.correlationLogger.error(
      '[BugHuntWorkflow] Bug hunt workflow failed',
      { error: errorMessage }
    );
    throw error;
  }
}

// Pattern 3: Test spy for writeBugReport
const mockWriteBugReport = vi.spyOn(workflow, 'writeBugReport');
await workflow.run('/path/to/session');
expect(mockWriteBugReport).toHaveBeenCalledWith(
  '/path/to/session',
  testResults
);

// Pattern 4: Test backward compatibility
await workflow.run(); // No sessionPath - should not throw
expect(mockWriteBugReport).not.toHaveBeenCalled();

// Pattern 5: Test writeBugReport error handling
mockWriteBugReport.mockRejectedValue(new Error('Write failed'));
await expect(workflow.run('/path')).rejects.toThrow('Write failed');
// Verify status is 'failed'
expect(workflow.status).toBe('failed');

// Pattern 6: Verify return value preserved
const results = await workflow.run('/path');
expect(results).toEqual(expectedResults);
// writeBugReport doesn't change return value
```

### Integration Points

```yaml
BUGHUNTWORKFLOW API:
  - method: run(sessionPath?: string)
  - change: Added optional sessionPath parameter
  - backward_compatible: Yes (parameter is optional)
  - return_type: Promise<TestResults> (unchanged)

PRPPIPELINE CALL SITE:
  - file: src/workflows/prp-pipeline.ts
  - location: ~line 1150 (BugHuntWorkflow instantiation)
  - pattern:
    const bugHunt = new BugHuntWorkflow(this.prdSnapshot, completedTasks);
    const sessionPath = this.sessionManager.currentSession?.metadata.path;
    const testResults = await bugHunt.run(sessionPath);
  - note: PRPPipeline change is out of scope for this task

FILESYSTEM:
  - operation: Atomic write to sessionPath/TEST_RESULTS.md
  - handler: writeBugReport() method (already implemented)
  - timing: Immediately after generateReport() completes

ERROR_HANDLING:
  - writeBugReport errors: Propagate through run() catch block
  - status: Set to 'failed' on write errors
  - logging: Log error with correlationLogger
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after completing implementation - fix before proceeding
npm run lint  # Runs ESLint on src/
npm run format  # Runs Prettier to format code

# Check specific file
npx eslint src/workflows/bug-hunt-workflow.ts
npx prettier --check src/workflows/bug-hunt-workflow.ts

# TypeScript compilation check
npx tsc --noEmit src/workflows/bug-hunt-workflow.ts

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test BugHuntWorkflow with updated run() method
npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/workflows/bug-hunt-workflow.test.ts

# Watch mode for rapid iteration
npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts --watch

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Verify new tests cover writeBugReport invocation from run().
```

### Level 3: Integration Testing (System Validation)

```bash
# Test the complete workflow integration
npm test -- tests/integration/bug-hunt-workflow-integration.test.ts

# Manual integration test (if needed):
# 1. Set up test PRD and completed tasks
# 2. Create BugHuntWorkflow instance
# 3. Run workflow.run(sessionPath) with real session path
# 4. Verify TEST_RESULTS.md is created in session directory
# 5. Verify file content is valid JSON
# 6. Verify workflow returns TestResults

# Expected: Integration passes, TEST_RESULTS.md created, workflow completes.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual smoke test for run() automatic write behavior
# Create a test script:

cat > test-run-writereport.mjs << 'EOF'
import { BugHuntWorkflow } from './src/workflows/bug-hunt-workflow.js';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

// Create test session
const testSessionPath = resolve(tmpdir(), 'test-bughunt-run-session');
await mkdir(testSessionPath, { recursive: true });

// Create workflow
const workflow = new BugHuntWorkflow(
  '# Test PRD\n## Feature\nBuild a user login system.',
  []
);

// Mock generateReport to return test results
workflow.generateReport = async () => ({
  hasBugs: true,
  bugs: [{
    id: 'BUG-001',
    severity: 'critical',
    title: 'No authentication',
    description: 'Login system has no authentication',
    reproduction: '1. Start app\n2. Try to login'
  }],
  summary: 'Found 1 critical bug',
  recommendations: ['Add authentication']
});

// Run workflow with sessionPath
const results = await workflow.run(testSessionPath);

console.log('Workflow completed');
console.log('Returned results:', results);
console.log('Check TEST_RESULTS.md at:', testSessionPath);
EOF

node test-run-writereport.mjs

# Verify file exists and contains valid JSON
cat $(mktemp -d)/test-bughunt-run-session/TEST_RESULTS.md | jq .

# Expected: File is created, contains valid JSON, workflow returns results.
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format`
- [ ] TypeScript compilation succeeds
- [ ] run() method signature updated with optional sessionPath parameter
- [ ] writeBugReport() called when sessionPath provided
- [ ] Backward compatibility maintained

### Feature Validation

- [ ] run() accepts optional sessionPath parameter
- [ ] writeBugReport() called with correct parameters (sessionPath, testResults)
- [ ] Log message added: 'Writing TEST_RESULTS.md to {sessionPath}'
- [ ] writeBugReport() only called when sessionPath is provided
- [ ] Return value preserved (still returns TestResults)
- [ ] Error handling works (write errors trigger 'failed' status)
- [ ] No file written when sessionPath is undefined

### Code Quality Validation

- [ ] Follows existing BugHuntWorkflow patterns
- [ ] Uses correlationLogger for new log message
- [ ] Preserves all existing error handling
- [ ] Preserves all existing status transitions
- [ ] Preserves all existing logging
- [ ] JSDoc comment updated for run() method
- [ ] No console.log statements (use logger)

### Test Coverage Validation

- [ ] New test: writeBugReport called when sessionPath provided
- [ ] New test: writeBugReport NOT called when sessionPath undefined
- [ ] New test: writeBugReport receives correct parameters
- [ ] New test: Return value preserved when writeBugReport called
- [ ] New test: Error handling when writeBugReport fails
- [ ] Existing tests still pass without modification

### Documentation & Deployment

- [ ] JSDoc comment updated for run() method (optional parameter)
- [ ] @param tag added for sessionPath parameter
- [ ] Code is self-documenting with clear variable names
- [ ] No TODO comments or placeholder code

---

## Anti-Patterns to Avoid

- ❌ Don't change constructor signature (use optional parameter in run() instead)
- ❌ Don't make sessionPath required in run() (breaks backward compatibility)
- ❌ Don't add SessionManager dependency (unnecessary coupling)
- ❌ Don't duplicate severity checking logic (writeBugReport already does it)
- ❌ Don't skip error handling (write errors must trigger 'failed' status)
- ❌ Don't change return type (must still return TestResults)
- ❌ Don't forget to add log message for write operation
- ❌ Don't remove existing tests (update them, don't replace)
- ❌ Don't write files in unit tests (mock writeBugReport)
- ❌ Don't use sync operations (writeBugReport is async, use await)
- ❌ Don't catch and suppress writeBugReport errors (propagate them)
- ❌ Don't call writeBugReport before generateReport (wrong order)
- ❌ Don't call writeBugReport if sessionPath is undefined (check first)
