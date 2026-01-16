# System Context: PRP Development Pipeline Bug Fixes

**Project**: PRP Development Pipeline
**Bug Fix Sequence**: `002_1e734971e481`
**Bug Session**: `001_8d809cc989b9`
**Date**: 2026-01-15
**Research Type**: Bug Fix Architecture Analysis

---

## Executive Summary

The PRP Development Pipeline is **substantially complete** with excellent architecture (3,303 tests, 93.2% pass rate). However, **critical gaps** in error handling infrastructure prevent the system from functioning correctly. This document captures the current system state to guide bug fix implementation.

---

## 1. Current Error Handling Architecture

### 1.1 Implemented Error Hierarchy

**Location**: `/home/dustin/projects/hacky-hack/src/utils/errors.ts`

**Error Classes Implemented**:
```typescript
PipelineError (abstract base class)
├── SessionError         // Session load/save failures
├── TaskError            // Task execution failures
├── AgentError           // LLM/API failures
└── ValidationError      // Validation failures (variable codes)
```

**Key Features**:
- Error codes for programmatic handling
- Context objects with debugging info
- `toJSON()` method for structured logging
- Sensitive data sanitization (redacts API keys, etc.)
- Type guard functions: `isPipelineError()`, `isSessionError()`, `isTaskError()`, `isAgentError()`, `isValidationError()`

### 1.2 Missing Error Handling Components

#### ❌ **Missing: `EnvironmentError` Class**
- **Expected In**: `/home/dustin/projects/hacky-hack/src/utils/errors.ts`
- **Purpose**: Environment configuration validation failures (missing API keys, invalid config)
- **Error Code**: `ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT`
- **Impact**: 5 integration tests failing
- **Pattern**: Should follow same structure as `SessionError`, `TaskError`, `AgentError`

#### ❌ **Missing: `isFatalError()` Export Function**
- **Expected In**: `/home/dustin/projects/hacky-hack/src/utils/errors.ts` (exported)
- **Current State**: Private method `#isFatalError()` exists in `PRPPipeline` class
- **Purpose**: Determine if error should halt execution immediately (fatal) vs. allow retry/continuation (non-fatal)
- **Fatal Errors**: `SessionError`, `EnvironmentError` (prevent any execution)
- **Non-Fatal Errors**: `TaskError`, `AgentError`, `ValidationError` (allow retry/recovery)
- **Impact**: 6 integration tests failing

### 1.3 Error Usage Patterns

**Pipeline Fatal Error Detection** (from `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`):
```typescript
#isFatalError(error: unknown): boolean {
  // Private method implementation exists
  // Needs to be extracted and exported as public utility
}
```

**Expected Public API**:
```typescript
// In src/utils/errors.ts
export function isFatalError(error: unknown): boolean {
  if (!isPipelineError(error)) {
    return false; // Standard errors are non-fatal
  }
  // Session and Environment errors are fatal
  return isSessionError(error) || error instanceof EnvironmentError;
}
```

---

## 2. Session Management Architecture

### 2.1 Session Initialization Flow

**Location**: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

**Initialization Sequence**:
1. **PRD Hash Generation**: SHA-256 hash of PRD content
2. **Session Directory Creation**: `plan/{sequence}_{hash}/`
3. **Tasks JSON Write**: Atomic write of `tasks.json` with Zod validation
4. **PRD Snapshot Write**: Copy of original PRD to `prd_snapshot.md`
5. **Parent Session Link**: Optional `parent_session.txt` for delta sessions

### 2.2 Session Directory Structure

```
plan/
├── {sequence}_{hash}/              # Session directory
│   ├── tasks.json                 # Task registry state (Zod-validated)
│   ├── prd_snapshot.md            # PRD at session creation time
│   ├── parent_session.txt         # (Optional) Parent session reference
│   ├── architecture/              # Research findings storage
│   ├── prps/                      # Generated PRP documents
│   └── artifacts/                 # Temporary implementation artifacts
```

### 2.3 Critical Files

**tasks.json**:
- **Format**: Zod-validated JSON backlog
- **Structure**: Phase → Milestone → Task → Subtask hierarchy
- **Validation**: Strict schema including `context_scope` format
- **Write Pattern**: Atomic (temp file + rename)

**prd_snapshot.md**:
- **Content**: Exact PRD content at session creation
- **Purpose**: Immutable record of requirements
- **Location**: `{sessionPath}/prd_snapshot.md`

### 2.4 E2E Pipeline Failures

**Current Issue**: Pipeline returns `success: false` and fails to create expected files

**Symptoms**:
- `prd_snapshot.md` not created (ENOENT)
- `tasks.json` not created (ENOENT)
- Execution timeout (not completing in 30 seconds)
- Pipeline workflow not reaching completion

**Hypothesis**: Session initialization failing silently, likely during:
1. PRD hash generation
2. Directory creation (permissions?)
3. Atomic file write operations
4. Validation failures

---

## 3. Task Orchestrator Architecture

### 3.1 Logging Implementation

**Location**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`

**Current Logger**: Pino structured logging
```typescript
this.#logger = getLogger('TaskOrchestrator');
```

**Expected Logging Pattern** (from failing tests):
```typescript
// Tests expect console.log calls like:
console.log('[TaskOrchestrator] Executing Phase: P1 - Phase 1');
console.log('[TaskOrchestrator] Executing Milestone: P1.M1 - Milestone 1');
console.log('[TaskOrchestrator] Executing Task: P1.M1.T1 - Task 1');
console.log('[TaskOrchestrator] Executing Subtask: P1.M1.T1.S1 - Subtask 1');
```

**Current Implementation**: Uses Pino logger with structured objects
```typescript
this.#logger.info({ taskId, status }, 'Task status changed');
this.#logger.debug({ pendingCount }, 'Status update batched');
```

**Issue**: 21 unit tests failing because they expect `console.log()` calls but implementation uses Pino logger

**Root Cause**: Test mock setup expects console.log, but implementation uses Pino

**Fix Options**:
1. Update implementation to use console.log (regression)
2. Update test mocks to expect Pino logger calls (recommended)
3. Add wrapper that logs to both console and Pino

### 3.2 Task Execution Flow

**Traversal Strategy**: Depth-first search (DFS)
**Processing Order**: Phase → Milestone → Task → Subtask

**State Management**:
- Maintains execution state in SessionManager
- Updates task status in `tasks.json`
- Uses ResearchQueue for parallel PRP generation

---

## 4. Retry Utility Architecture

### 4.1 Jitter Calculation

**Location**: `/home/dustin/projects/hacky-hack/src/utils/retry.ts`

**Current Implementation**:
```typescript
const exponentialDelay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
const jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;
const delay = Math.max(0, Math.floor(exponentialDelay + jitter));
```

**Default Configuration**:
- `baseDelay: 1000ms`
- `maxDelay: 30000ms`
- `backoffFactor: 2`
- `jitterFactor: 0.1` (10% variance)

**Jitter Formula**: `±10% of exponentialDelay`

**Test Expectation**: "should add jitter to delay" expects delay > base (strictly greater)

**Issue**: Jitter can be zero when `Math.random() - 0.5` returns near -0.5, making delay equal to base

**Example Calculation**:
- Attempt 0: 1000ms ± 100ms (range: 900-1100ms)
- If jitter = -100ms: delay = 900ms (less than base)
- If jitter = 0ms: delay = 1000ms (equal to base)
- If jitter = +100ms: delay = 1100ms (greater than base)

**Fix Pattern**: Ensure jitter is always positive
```typescript
const jitter = Math.max(1, exponentialDelay * jitterFactor * Math.random());
```

---

## 5. Validation Schema Architecture

### 5.1 context_scope Validation

**Schema Location**: `/home/dustin/projects/hacky-hack/src/core/session-utils.ts` (Zod schema)

**Required Format**:
```typescript
context_scope: z.string().refine(
  (val) => val.startsWith("CONTRACT DEFINITION:\n"),
  { message: "context_scope must start with \"CONTRACT DEFINITION:\" followed by a newline" }
)
```

**Test Fixture Issue**:
- Test uses: `context_scope: 'Test scope'`
- Validation expects: `context_scope: "CONTRACT DEFINITION:\n..."`
- Error: "context_scope must start with \"CONTRACT DEFINITION:\" followed by a newline"

**Fix**: Update test fixture to use proper format

---

## 6. Git History Insights

### 6.1 Error Handling Timeline

**January 14, 2026** - Error Hierarchy Established
- `b2c18ca`: Added `PipelineError`, `SessionError`, `TaskError`, `AgentError`, `ValidationError`
- `d81e5cc`: Added retry utility with exponential backoff
- `dba41a5`: Added private `#isFatalError()` method in PRPPipeline

**Missing from Timeline**:
- `EnvironmentError` class was never added
- Public `isFatalError()` export was never created

### 6.2 Bug Fix Patterns

**Observed Patterns** (from recent commits):
1. **Test-Driven**: Comprehensive test coverage (800-1200+ tests per fix)
2. **Incremental Status Tracking**: Use `tasks.json` to track Researching → Complete
3. **Documentation First**: Research documents before implementation
4. **Error Logging Enhancement**: Stack traces, context preservation, structured logging

### 6.3 E2E Pipeline Timeline

**January 13, 2026**:
- `c5b6f0a`: Added minimal test PRD fixture
- `70cf815`: Added E2E pipeline test with comprehensive mocking
- `10a50a8`: Added delta session E2E test

**Issue**: E2E tests pass at creation time but now failing, suggesting regression or environment change

---

## 7. Critical Dependencies

### 7.1 Error Handling Dependencies

**Internal**:
- `src/utils/errors.ts` - Error hierarchy (missing components)
- `src/workflows/prp-pipeline.ts` - Has private `#isFatalError()` to extract

**External**:
- None (pure TypeScript error handling)

### 7.2 Session Management Dependencies

**Internal**:
- `src/core/session-manager.ts` - Session lifecycle
- `src/core/session-utils.ts` - Session utilities and Zod schemas
- `src/utils/file-utils.ts` - Atomic file operations

**External**:
- `zod` - Schema validation
- `fs/promises` - File system operations

### 7.3 Task Orchestrator Dependencies

**Internal**:
- `src/core/task-orchestrator.ts` - Task execution
- `src/core/session-manager.ts` - State persistence

**External**:
- `pino` - Structured logging

---

## 8. Test Infrastructure

### 8.1 Test Coverage

**Total Tests**: 3,303
**Passing**: 3,081 (93.2%)
**Failing**: 118
**Skipped**: 67

### 8.2 Failing Test Categories

**Critical Issues**:
1. **Error Handling Integration**: 11 tests expecting `EnvironmentError` and `isFatalError()`
2. **E2E Pipeline**: 4 tests (session initialization failures)

**Major Issues**:
3. **Task Orchestrator Logging**: 21 tests (console vs Pino mismatch)
4. **Session Utils Validation**: 1 test (test data format issue)
5. **Retry Utility Jitter**: 1 test (edge case)

**Minor Issues**:
6. **Integration Test Setup**: PromiseRejectionHandledWarning (setup issue)

---

## 9. Implementation Constraints

### 9.1 Must Follow

1. **Error Pattern**: Match existing error class structure (`SessionError`, `TaskError`, etc.)
2. **Zod Validation**: All schemas must pass validation
3. **Atomic Writes**: Use temp file + rename pattern for file operations
4. **TDD**: Write failing tests first, then implement
5. **Status Tracking**: Update `tasks.json` as work progresses

### 9.2 Must Avoid

1. **Breaking Changes**: Don't modify existing error class APIs
2. **Console Logging**: Don't replace Pino with console.log
3. **Silent Failures**: All errors must be logged with context
4. **Hardcoded Paths**: Use session utils for path generation

---

## 10. Recommendations for Bug Fix Implementation

### 10.1 Critical Path (Do First)

1. **Add `EnvironmentError` class** to `src/utils/errors.ts`
   - Follow pattern of `SessionError`
   - Add export to `src/core/index.ts` if needed
   - Write comprehensive tests (500+ tests)

2. **Extract and export `isFatalError()`** from `PRPPipeline.#isFatalError()`
   - Move to `src/utils/errors.ts` as public function
   - Add type guards for `EnvironmentError`
   - Write integration tests

3. **Debug E2E pipeline failures**
   - Add debug logging to session initialization
   - Verify directory creation permissions
   - Check atomic file write operations
   - Add error handling to catch session creation failures

### 10.2 Major Fixes (Do Second)

4. **Fix Task Orchestrator logging tests**
   - Update test mocks to expect Pino calls instead of console
   - Or add console.log wrapper (if preferred)
   - Verify 21 tests pass

5. **Fix session-utils test fixture**
   - Update test data to use proper `context_scope` format
   - Verify Zod validation passes

6. **Fix retry jitter calculation**
   - Ensure jitter is always positive
   - Update test expectations to match implementation

### 10.3 Polish (Do Last)

7. **Fix integration test setup**
   - Add proper promise rejection handlers
   - Review error wrapping for stack trace preservation

8. **Reduce test output verbosity**
   - Update dotenv to use `{ quiet: true }`

---

## 11. File Reference Summary

### 11.1 Source Files to Modify

1. `/home/dustin/projects/hacky-hack/src/utils/errors.ts` - Add missing components
2. `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` - Debug E2E issues
3. `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` - Logging investigation
4. `/home/dustin/projects/hacky-hack/src/utils/retry.ts` - Jitter calculation fix

### 11.2 Test Files to Modify

1. `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts` - Fix test fixture
2. `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts` - Fix logging mocks
3. `/home/dustin/projects/hacky-hack/tests/unit/utils/retry.test.ts` - Fix jitter assertion
4. `/home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts` - Will pass after errors.ts fixed
5. `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts` - Will pass after E2E debugged

---

## 12. Success Criteria

Bug fix implementation is complete when:

1. ✅ `EnvironmentError` class exists and is constructible
2. ✅ `isFatalError()` function exists and correctly identifies fatal errors
3. ✅ All error handling integration tests pass (11 tests)
4. ✅ E2E pipeline tests pass (4 tests)
5. ✅ Task Orchestrator logging tests pass (21 tests)
6. ✅ Session utils validation test passes (1 test)
7. ✅ Retry jitter test passes (1 test)
8. ✅ Overall test pass rate returns to >98%

---

**Document Version**: 1.0
**Last Updated**: 2026-01-15
**Research Agent**: Task Synthesizer (Lead Technical Architect)
