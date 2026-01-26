# Bug Fix Requirements

## Overview

This document contains critical bugs found during end-to-end validation of the PRP Pipeline implementation against the original PRD requirements. The validation covered the four core processing engines (Session Manager, Task Orchestrator, Agent Runtime, Pipeline Controller), workflows, configuration system, delta workflow, bug hunting/fix cycle, and state management.

**Overall Assessment**: The implementation is largely complete with strong architectural patterns, but contains several critical bugs that prevent core functionality from working correctly, particularly around test compatibility, state validation, and the bug fix cycle itself.

## Critical Issues (Must Fix)

### Issue 1: ResearchQueue Constructor Signature Mismatch

**Severity**: Critical
**PRD Reference**: PRD §9.2.2 (Required Environment Variables) and §5.2 (Agent Capabilities)
**Expected Behavior**: ResearchQueue should be constructed with parameters matching the actual implementation.
**Actual Behavior**: Tests expect `new ResearchQueue(sessionManager, noCache)` but the actual constructor requires 4 parameters: `new ResearchQueue(sessionManager, concurrency, noCache, cacheTtl)`.

**Steps to Reproduce**:
1. Run `npm test` to see the failing test in `tests/unit/core/research-queue.test.ts`
2. The test `should create PRPGenerator with sessionManager` fails because it only passes 2 arguments
3. Actual constructor expects: `(sessionManager, concurrency, noCache, cacheTtl)`

**Impact**: This breaks the contract between TaskOrchestrator and ResearchQueue. The TaskOrchestrator at line 161-166 creates a ResearchQueue with 3 parameters, but tests show it expects 2. This mismatch will cause runtime failures.

**Suggested Fix**:
- Update tests to pass all 4 required parameters
- Update TaskOrchestrator to pass the `cacheTtl` parameter (currently missing from line 161)
- Verify the constructor signature is consistent across all instantiations

**Location**:
- `src/core/task-orchestrator.ts:161-166`
- `tests/unit/core/research-queue.test.ts`

---

### Issue 2: SessionManager Constructor Signature Inconsistency

**Severity**: Critical
**PRD Reference**: PRD §5.1 (State & File Management)
**Expected Behavior**: SessionManager should be constructed with consistent parameter signature across all usages.
**Actual Behavior**: Tests expect `new SessionManager(prdPath, flushRetries)` but the actual constructor is `new SessionManager(prdPath, planDir, flushRetries)`.

**Steps to Reproduce**:
1. Run `npm test` to see multiple failing tests in `tests/unit/core/session-manager.test.ts`
2. The test `should create new session when hash not found` calls SessionManager with 2 arguments
3. Actual constructor requires 3 arguments with `planDir` as the second parameter

**Impact**: All SessionManager instantiations in tests are broken, which prevents proper testing of session state management - a core requirement.

**Suggested Fix**:
- Update all test instantiations to include the `planDir` parameter
- Default the `planDir` parameter in the constructor if appropriate
- Or, update TaskOrchestrator's usage at line 1768 to pass `undefined` for planDir if using default

**Location**:
- `src/core/session-manager.ts:190-219` (constructor)
- `tests/unit/core/session-manager.test.ts` (multiple test cases)
- `src/workflows/prp-pipeline.ts:1768-1772`

---

### Issue 3: Missing "Retrying" Status in StatusEnum

**Severity**: Critical
**PRD Reference**: PRD §5.3 (Task Management)
**Expected Behavior**: The StatusEnum should include "Retrying" status as indicated by recent commits.
**Actual Behavior**: Tests expect 6 status values plus "Retrying" (total 7), but the StatusEnum only defines 6 values.

**Steps to Reproduce**:
1. Run `npm test` to see failing tests in `tests/unit/core/models.test.ts`
2. Test `should expose all enum values via options property` expects 7 values but gets 6
3. Test `should document complete status lifecycle` expects 7 status values but enum only has 6

**Impact**: The "Retrying" status is referenced in recent commits (63bed9c) but not implemented in the StatusEnum. This breaks the status transition workflow for tasks that are being retried.

**Suggested Fix**:
- Add "Retrying" to the StatusEnum in `src/core/models.ts`
- Update Status type union to include "Retrying"
- Implement status transitions to "Retrying" when TaskRetryManager initiates a retry
- Update all status validation logic to handle "Retrying"

**Location**:
- `src/core/models.ts` (StatusEnum and Status type)
- Recent commit 63bed9c adds Retrying status support with yellow indicator

---

### Issue 4: Bug Hunt Workflow Does Not Write TEST_RESULTS.md When Bugs Found

**Severity**: Critical
**PRD Reference**: PRD §4.4 (The QA & Bug Hunt Loop) and §6.5 (Creative Bug Finding Prompt)
**Expected Behavior**: When QA agent finds critical or major bugs, BugHuntWorkflow MUST write TEST_RESULTS.md to trigger bug fix cycle.
**Actual Behavior**: The BugHuntWorkflow returns TestResults object but does NOT write the TEST_RESULTS.md file. The PRP Pipeline at line 1214-1285 writes TEST_RESULTS.md, but only after BugHuntWorkflow AND FixCycleWorkflow complete.

**Steps to Reproduce**:
1. Examine `src/workflows/bug-hunt-workflow.ts:generateReport()` - it only returns TestResults
2. Examine `src/workflows/prp-pipeline.ts:runQACycle()` - TEST_RESULTS.md is written at line 1220
3. The bug report file writing happens AFTER FixCycleWorkflow runs
4. The bugfix session expects TEST_RESULTS.md to exist before tasks are generated

**Impact**: The bug fix cycle requires TEST_RESULTS.md to exist to generate fix tasks. If the file is written after the fix cycle attempts to run, it will fail. The bugfix session directory exists but is empty, confirming this issue.

**Suggested Fix**:
- Move TEST_RESULTS.md writing to immediately after BugHuntWorkflow completes (before FixCycleWorkflow)
- Or, have BugHuntWorkflow.writeBugReport() method that writes the file when bugs are found
- Ensure FixCycleWorkflow reads from the written file rather than using in-memory TestResults

**Location**:
- `src/workflows/prp-pipeline.ts:1214-1285` (TEST_RESULTS.md writing logic)
- `src/workflows/bug-hunt-workflow.ts` (should write bug report directly)

---

### Issue 5: No Validation of Bugfix Session Path Before Creating Tasks

**Severity**: Critical
**PRD Reference**: PRD §5.1 (State & File Management) - "Must validate session paths in bug fix mode"
**Expected Behavior**: System must validate that session path contains "bugfix" before creating bug fix tasks.
**Actual Behavior**: No validation exists to ensure bug fix tasks are created within a valid bugfix session directory.

**Steps to Reproduce**:
1. Search codebase for "bugfix" path validation
2. No checks found that verify session path contains "bugfix" before task generation
3. PRD explicitly requires this validation

**Impact**: Bug fix tasks could be created in the wrong session directory, corrupting the main session state. This violates a core requirement for protected session paths.

**Suggested Fix**:
- Add validation in FixCycleWorkflow or TaskOrchestrator to verify session path contains "bugfix"
- Throw error if trying to execute bug fix tasks outside of bugfix session
- Add debug logging showing PLAN_DIR, SESSION_DIR, and SKIP_BUG_FINDING as specified in PRD §9.2.5

**Location**:
- `src/workflows/fix-cycle-workflow.ts` (constructor or run method)
- `src/core/task-orchestrator.ts` (executeSubtask or similar)

---

## Major Issues (Should Fix)

### Issue 6: Empty SessionManager.currentSession After Initialization

**Severity**: Major
**PRD Reference**: PRD §5.1 (State & File Management)
**Expected Behavior**: After SessionManager.initialize(), currentSession should contain the session state.
**Actual Behavior**: Tests indicate potential issues with session state after initialization.

**Impact**: Could cause null reference errors when accessing session metadata or taskRegistry after initialization.

**Suggested Fix**:
- Verify SessionManager.initialize() always sets currentSession before returning
- Add null checks after initialize() calls
- Ensure session state is properly persisted before returning

**Location**:
- `src/core/session-manager.ts:280-542` (initialize method)

---

### Issue 7: Missing Nested Execution Guard Validation in Pipeline

**Severity**: Major
**PRD Reference**: PRD §5.1 and §9.2.5 - "Must implement nested execution guard via PRP_PIPELINE_RUNNING"
**Expected Behavior**: Pipeline should check PRP_PIPELINE_RUNNING environment variable and validate conditions before execution.
**Actual Behavior**: No code found that implements the nested execution guard validation logic described in PRD.

**Impact**: Could cause recursive pipeline execution if agents accidentally invoke the pipeline, leading to corrupted state and infinite loops.

**Suggested Fix**:
- Implement PRP_PIPELINE_RUNNING check at pipeline entry point
- Validate SKIP_BUG_FINDING=true AND path contains "bugfix" for legitimate recursion
- Set PRP_PIPELINE_RUNNING to current PID on valid entry
- Clear on exit

**Location**:
- `src/index.ts` or `src/workflows/prp-pipeline.ts` (run method)

---

### Issue 8: PRD Delta Generation Without Retry Logic Implementation

**Severity**: Major
**PRD Reference**: PRD §4.3 - "Delta PRD Generation (with retry logic)"
**Expected Behavior**: System should retry delta PRD generation if first attempt fails, and fail fast if not generated after retry.
**Actual Behavior**: DeltaAnalysisWorkflow runs but does not implement the explicit retry logic mentioned in PRD.

**Impact**: If delta PRD generation fails, the session will proceed without proper delta handling, potentially causing incorrect task patching.

**Suggested Fix**:
- Implement retry logic in DeltaAnalysisWorkflow or where delta PRD is generated
- Add session failure if delta PRD cannot be generated after retry
- Implement detection and regeneration of missing delta PRDs on resume

**Location**:
- `src/workflows/delta-analysis-workflow.ts`

---

## Minor Issues (Nice to Fix)

### Issue 9: mkdtemp() Template Portability Warning

**Severity**: Minor
**PRD Reference**: None (code quality issue)
**Expected Behavior**: No warnings during test execution.
**Actual Behavior**: Warning appears during test runs: "Warning: mkdtemp() templates ending with X are not portable."

**Impact**: Minor - test execution still works but warnings indicate non-portable code.

**Suggested Fix**: Update mkdtemp() calls to use more portable templates.

---

### Issue 10: PromiseRejectionHandledWarning During Tests

**Severity**: Minor
**PRD Reference**: None (code quality issue)
**Expected Behavior**: All promise rejections should be properly handled.
**Actual Behavior**: "PromiseRejectionHandledWarning: Promise rejection was handled asynchronously" appears during tests.

**Impact**: Minor - indicates unhandled promise rejections that should be caught and handled.

**Suggested Fix**: Ensure all promises have proper .catch() handlers or try/catch blocks.

---

## Testing Summary

- **Total tests performed**: Full analysis of codebase against PRD requirements
- **Passing areas**:
  - Session management architecture (primitives in place)
  - Task orchestrator structure (DFS traversal implemented)
  - Agent factory and prompts (all 6 prompts defined)
  - Workflow structure (BugHuntWorkflow, FixCycleWorkflow, DeltaAnalysisWorkflow)
  - Configuration system (environment variables, constants)
  - State management (batching, flush logic)
  - Git integration (smart commits)
  - Retry logic (TaskRetryManager, retry utilities)
  - Progress tracking and display
  - Metrics collection
  - Error reporting infrastructure

- **Failing areas**:
  - Test compatibility (constructor signature mismatches)
  - Status enum completeness (missing "Retrying")
  - Bug report file writing workflow
  - Bugfix session path validation
  - Nested execution guard implementation
  - Delta PRD retry logic

- **Areas needing more attention**:
  - End-to-end integration testing
  - Bug fix cycle testing
  - Delta workflow testing
  - Nested execution guard validation
  - Session state corruption prevention
