---
name: 'Error Recovery Implementation - Pipeline Continuation with Error Tracking'
description: |
---

## Goal

**Feature Goal**: Implement robust error recovery in PRPPipeline that maximizes progress by continuing execution after non-fatal errors while tracking all failures for comprehensive error reporting.

**Deliverable**: Modified `src/workflows/prp-pipeline.ts` with try-catch wrapping on all `@Step()` methods, error tracking in context scope, fatal/non-fatal error detection, `--continue-on-error` CLI flag, and `ERROR_REPORT.md` generation in session directory.

**Success Definition**:

- Pipeline continues executing tasks after individual task failures (non-fatal errors)
- Fatal errors (session corruption, critical system failures) abort pipeline immediately
- All errors logged with full context using logger.error() with error hierarchy
- Error report generated at end if any failures occurred
- `--continue-on-error` flag treats all errors as non-fatal
- Failed tasks marked with status='Failed' and error context preserved
- Exit code reflects execution result (0=success, 1=errors occurred)

## User Persona

**Target User**: Internal pipeline execution requiring resilience against individual task failures while maintaining visibility into all errors.

**Use Case**: When executing large backlogs (100+ tasks), some tasks may fail due to transient issues, LLM errors, or edge cases. The pipeline should continue executing remaining tasks rather than aborting entirely, allowing maximum progress to be made.

**User Journey**:

1. Pipeline starts executing backlog
2. Individual task fails with error (e.g., AgentError, TaskError)
3. Error is logged with full context (task ID, error type, stack trace)
4. Task status set to 'Failed', error recorded in context scope
5. Pipeline continues to next task (if non-fatal)
6. At end, error report generated summarizing all failures
7. User reviews ERROR_REPORT.md and fixes specific failures
8. User re-runs with `--scope` to retry only failed tasks

**Pain Points Addressed**:

- Single task failure aborts entire pipeline, wasting potential progress
- No visibility into which tasks failed and why
- No error report for post-mortem analysis
- Must restart from beginning after fixing individual failures

## Why

- **Business value**: Maximizes pipeline completion rate by not aborting on individual task failures
- **Integration**: Works with retry logic from P5.M4.T1.S2 and error hierarchy from P5.M4.T1.S1
- **Problems solved**: Handles task-level failures gracefully, provides comprehensive error reporting for debugging

## What

Modify `PRPPipeline` class to implement error recovery:

1. **Error Tracking Field**: Add `failedTasks: Map<string, TaskError>` to track all failures
2. **Try-Catch Wrapping**: Wrap each `@Step()` method with try-catch
3. **Fatal Error Detection**: Detect fatal vs non-fatal errors using error hierarchy
4. **Continue on Error Flag**: Add `--continue-on-error` CLI flag
5. **Error Report Generation**: Generate `ERROR_REPORT.md` at end if failures occurred

### Success Criteria

- [ ] `failedTasks` Map tracks all task failures with error context
- [ ] `@Step()` methods wrapped with try-catch for error handling
- [ ] Fatal errors abort pipeline immediately (session corruption, critical failures)
- [ ] Non-fatal errors log and continue (task failures, agent errors)
- [ ] `--continue-on-error` CLI flag treats all errors as non-fatal
- [ ] Error report generated at session path if any failures occurred
- [ ] Error report includes: summary, failed tasks list, error categories, recommendations
- [ ] Exit code 1 if any failures, 0 if all successful
- [ ] 100% test coverage for error recovery scenarios

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with this codebase should be able to implement this PRP successfully using only this document and the referenced files.

### Documentation & References

```yaml
# MUST READ - Error hierarchy from P5.M4.T1.S1
- file: src/utils/errors.ts
  why: Provides PipelineError classes with error codes for fatal/non-fatal detection
  pattern: Use isPipelineError(), isSessionError(), isTaskError(), isAgentError() type guards
  critical: Error codes for detecting fatal errors (PIPELINE_SESSION_LOAD_FAILED, etc.)

# MUST READ - Retry logic from P5.M4.T1.S2 (parallel execution)
- file: src/utils/retry.ts
  why: Provides retry() utility that already handles transient errors
  note: This is created by P5.M4.T1.S2, assume it exists when implementing
  pattern: Errors reaching PRPPipeline have already been retried

# MUST READ - PRPPipeline class structure
- file: src/workflows/prp-pipeline.ts
  why: Main pipeline workflow class that needs error recovery modifications
  pattern: @Step() decorator usage (lines 349, 946)
  gotcha: Methods initializeSession, decomposePRD, executeBacklog, runQACycle, cleanup
  critical: Current error handling at lines 325-329, 517-520, 632-635, 903-908

# MUST READ - TaskOrchestrator for task execution
- file: src/core/task-orchestrator.ts
  why: Handles individual task execution, sets status to Failed on error
  pattern: executeSubtask() method (lines 581-747) has try-catch with status update
  gotcha: Already sets status to 'Failed' and re-throws error
  critical: Error context already logged at lines 732-739

# MUST READ - CLI argument parser for adding new flag
- file: src/cli/index.ts
  why: Need to add --continue-on-error flag to CLIArgs interface and parser
  pattern: Boolean flags use .option('--name', 'Description', default) (line 122)
  gotcha: Add to CLIArgs interface (lines 52-76) and parseCLIArgs function (line 102)

# MUST READ - Logger integration
- file: src/utils/logger.ts
  why: Structured logging with pino for error context tracking
  pattern: logger.error({ context }, 'message') for structured error logging
  critical: Use error level for failures, include error context object

# RESEARCH DOCUMENTATION
- docfile: plan/001_14b9dc2a33c7/P5M4T1S3/research/error-recovery-patterns.md
  why: Complete error recovery patterns and error report format specification
  section: "Error Report Format"
  critical: ERROR_REPORT.md template with summary, failed tasks, categories

# MUST READ - SessionManager for session directory path
- file: src/core/session-manager.ts
  why: Get session directory path for saving ERROR_REPORT.md
  pattern: sessionManager.currentSession.metadata.path
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts
│   ├── prp-executor.ts
│   ├── prp-generator.ts
│   └── prp-runtime.ts
├── cli/
│   └── index.ts                # ADD --continue-on-error flag
├── core/
│   ├── models.ts               # Status type: 'Complete' | 'Failed' | 'Planned' | 'Implementing'
│   ├── session-manager.ts      # Session directory path for ERROR_REPORT.md
│   └── task-orchestrator.ts    # executeSubtask() sets status to Failed
├── utils/
│   ├── errors.ts               # FROM P5.M4.T1.S1 - Error hierarchy
│   ├── logger.ts               # Structured logging with pino
│   ├── retry.ts                # FROM P5.M4.T1.S2 - Retry utility (assume exists)
│   └── task-utils.ts
└── workflows/
    ├── bug-hunt-workflow.ts
    └── prp-pipeline.ts         # MODIFY - Add error recovery

tests/
├── unit/
│   └── workflows/
│       └── prp-pipeline.test.ts # UPDATE - Add error recovery tests
```

### Desired Codebase Tree (After Implementation)

```bash
src/
├── cli/
│   └── index.ts                # MODIFIED: Add continueOnError: boolean to CLIArgs
├── workflows/
│   └── prp-pipeline.ts         # MODIFIED: Add error recovery logic

tests/
├── unit/
│   └── workflows/
│       └── prp-pipeline.test.ts # MODIFIED: Add error recovery test cases
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Error hierarchy from P5.M4.T1.S1 provides type guards
// Import: import { isPipelineError, isSessionError, ErrorCodes } from '../utils/errors.js'
// Use type guards to detect error categories for fatal/non-fatal decision

// CRITICAL: TaskOrchestrator already catches errors in executeSubtask()
// It sets status to 'Failed' and re-throws, so PRPPipeline sees the error
// Don't double-set status - TaskOrchestrator handles it

// CRITICAL: @Step() decorator is from Groundswell framework
// It tracks timing and snapshots - wrapping with try-catch preserves this
// @Step methods: initializeSession, decomposePRD, handleDelta, cleanup, runQACycle
// executeBacklog is NOT decorated with @Step (it's a loop)

// CRITICAL: Fatal vs Non-Fatal decision depends on pipeline phase
// initializeSession: FATAL - session required for everything
// decomposePRD: FATAL - backlog required for execution
// executeBacklog: NON-FATAL - individual task failures should continue
// handleDelta: FATAL - delta handling critical for session integrity
// runQACycle: NON-FATAL - QA is optional, failures are non-fatal
// cleanup: NEVER FAIL - must always complete for state preservation

// CRITICAL: Error report should only be generated if failedTasks.size > 0
// Save to session directory: sessionManager.currentSession.metadata.path + '/ERROR_REPORT.md'

// CRITICAL: Exit code should be 1 if any failures occurred, 0 if all successful
// In main entry point, check pipelineResult.success or failedTasks count

// CRITICAL: --continue-on-error flag overrides fatal detection
// When true, treat ALL errors as non-fatal (except cleanup which never fails)
// Log warning when continuing past potentially fatal error

// CRITICAL: Use logger.error() with full context object
// logger.error({ taskId, errorCode, errorMessage, stack, timestamp }, 'Task failed')
// The logger will redact sensitive data automatically via REDACT_PATHS

// CRITICAL: Store error context in failedTasks Map for report generation
// Key: task ID (string), Value: { error, timestamp, phase, milestone }
// Use Map to preserve insertion order and avoid duplicates
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Error tracking interface for failed tasks
interface TaskFailure {
  taskId: string;
  taskTitle: string;
  error: Error;
  errorCode?: string;
  timestamp: Date;
  phase?: string;
  milestone?: string;
}

// Error report data structure
interface ErrorReport {
  generated: Date;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continueOnError: boolean;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  failures: TaskFailure[];
  errorCategories: {
    taskError: number;
    agentError: number;
    validationError: number;
    sessionError: number;
    other: number;
  };
}

// Fatal error detection function
function isFatalError(error: unknown, continueOnError: boolean): boolean;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD continueOnError to CLIArgs interface
  - MODIFY: src/cli/index.ts
  - ADD: continueOnError: boolean property to CLIArgs interface (line 52-76)
  - ADD: .option('--continue-on-error', 'Treat all errors as non-fatal', false) to program (line 126)
  - PATTERN: Follow existing boolean flag pattern (lines 122-126)
  - NAMING: camelCase for CLI property, kebab-case for CLI flag
  - DEPENDENCIES: None

Task 2: ADD error tracking fields to PRPPipeline class
  - MODIFY: src/workflows/prp-pipeline.ts
  - ADD: private readonly #continueOnError: boolean field (after line 152)
  - ADD: private #failedTasks: Map<string, TaskFailure> field (after line 172)
  - MODIFY: Constructor to accept continueOnError parameter (line 188-192)
  - INITIALIZE: #failedTasks = new Map() in constructor
  - PATTERN: Follow existing private field naming convention (#fieldName)
  - DEPENDENCIES: Task 1

Task 3: IMPLEMENT isFatalError() function
  - CREATE: Private method #isFatalError(error: unknown): boolean
  - CHECK: If #continueOnError is true, return false (all errors non-fatal)
  - CHECK: Use error hierarchy type guards (isSessionError, isPipelineError)
  - FATAL: SessionError with PIPELINE_SESSION_LOAD_FAILED
  - FATAL: SessionError with PIPELINE_SESSION_SAVE_FAILED (if critical data)
  - FATAL: ValidationError with PIPELINE_VALIDATION_INVALID_INPUT for PRD parsing
  - NON-FATAL: TaskError, AgentError (individual task failures)
  - RETURN: true for fatal errors, false for non-fatal
  - PATTERN: Use type guards from src/utils/errors.ts
  - DEPENDENCIES: Task 2

Task 4: IMPLEMENT trackFailure() method
  - CREATE: Private method #trackFailure(taskId: string, error: unknown, context?: object): void
  - EXTRACT: Error type and code using error hierarchy
  - CREATE: TaskFailure object with all context
  - STORE: In #failedTasks Map using taskId as key
  - LOG: Via logger.error() with full context
  - PATTERN: logger.error({ taskId, errorCode, error, ...context }, 'Task failed')
  - DEPENDENCIES: Task 2, Task 3

Task 5: WRAP initializeSession() with try-catch
  - MODIFY: src/workflows/prp-pipeline.ts initializeSession method (lines 290-331)
  - WRAP: Entire method body in try-catch
  - CATCH: Check if error is fatal via #isFatalError()
  - IF FATAL: Log error, re-throw to abort pipeline
  - IF NON-FATAL: Track failure via #trackFailure(), set currentPhase to 'session_failed'
  - DEPENDENCIES: Task 3, Task 4

Task 6: WRAP handleDelta() with try-catch
  - MODIFY: src/workflows/prp-pipeline.ts handleDelta method (lines 349-441)
  - WRAP: Entire method body in try-catch
  - CATCH: Check if error is fatal via #isFatalError()
  - IF FATAL: Log error, re-throw to abort pipeline
  - IF NON-FATAL: Track failure via #trackFailure(), log warning, continue
  - DEPENDENCIES: Task 3, Task 4

Task 7: WRAP decomposePRD() with try-catch
  - MODIFY: src/workflows/prp-pipeline.ts decomposePRD method (lines 452-521)
  - WRAP: Entire method body in try-catch
  - CATCH: Check if error is fatal via #isFatalError()
  - IF FATAL: Log error, re-throw to abort pipeline
  - IF NON-FATAL: Track failure via #trackFailure(), set currentPhase to 'prd_decomposition_failed'
  - DEPENDENCIES: Task 3, Task 4

Task 8: MODIFY executeBacklog() to continue on errors
  - MODIFY: src/workflows/prp-pipeline.ts executeBacklog method (lines 538-636)
  - NOTE: This method calls TaskOrchestrator.processNextItem() which calls executeSubtask()
  - TaskOrchestrator already catches errors, sets status to Failed, and re-throws
  - WRAP: The while loop body in try-catch to catch individual task failures
  - CATCH: Individual task errors, track via #trackFailure()
  - CONTINUE: To next iteration (don't break loop)
  - LOG: Warning that task failed but continuing
  - DEPENDENCIES: Task 4

Task 9: WRAP runQACycle() with try-catch
  - MODIFY: src/workflows/prp-pipeline.ts runQACycle method (lines 653-909)
  - WRAP: Entire method body in try-catch
  - CATCH: Check if error is fatal via #isFatalError()
  - IF FATAL: Log error, re-throw to abort pipeline
  - IF NON-FATAL: Track failure via #trackFailure(), log warning, set currentPhase to 'qa_failed'
  - DEPENDENCIES: Task 3, Task 4

Task 10: MODIFY cleanup() to never fail
  - MODIFY: src/workflows/prp-pipeline.ts cleanup method (lines 946-1019)
  - NOTE: Already has try-catch that logs but doesn't throw (line 1015-1017)
  - PRESERVE: Existing best-effort cleanup pattern
  - ENSURE: No throws in cleanup under any circumstances
  - DEPENDENCIES: None (cleanup is already robust)

Task 11: IMPLEMENT generateErrorReport() method
  - CREATE: Private async method #generateErrorReport(): Promise<void>
  - CHECK: If #failedTasks.size === 0, return early (no report needed)
  - BUILD: ErrorReport data structure with all failures
  - CATEGORIZE: Failures by error type using error hierarchy
  - GENERATE: Markdown content following template in research doc
  - WRITE: To session directory path + '/ERROR_REPORT.md'
  - LOG: Info message with report path
  - PATTERN: Follow TEST_RESULTS.md generation pattern (lines 782-852)
  - DEPENDENCIES: Task 4, Task 8

Task 12: INTEGRATE error report generation in run() method
  - MODIFY: src/workflows/prp-pipeline.ts run() method (lines 1044-1121)
  - CALL: #generateErrorReport() before return in success path
  - CALL: #generateErrorReport() before return in error path
  - UPDATE: PipelineResult to include hasFailures: boolean flag
  - SET: hasFailures = #failedTasks.size > 0
  - PATTERN: Generate report in finally block or before both return paths
  - DEPENDENCIES: Task 11

Task 13: CREATE unit tests for error recovery
  - CREATE: tests/unit/workflows/prp-pipeline-error-recovery.test.ts
  - TEST: isFatalError() with various error types
  - TEST: trackFailure() populates failedTasks Map
  - TEST: Non-fatal errors in executeBacklog() continue execution
  - TEST: Fatal errors abort pipeline immediately
  - TEST: --continue-on-error flag treats all errors as non-fatal
  - TEST: Error report generation with various failure scenarios
  - PATTERN: Follow existing test structure in tests/unit/workflows/
  - COVERAGE: Target 100% for new error recovery code
  - DEPENDENCIES: All previous tasks complete

Task 14: UPDATE main entry point to pass continueOnError
  - MODIFY: src/index.ts or main entry point
  - PASS: args.continueOnError to PRPPipeline constructor
  - ENSURE: Exit code 1 if pipelineResult.hasFailures is true
  - PATTERN: Check pipelineResult.success or failedTasks count
  - DEPENDENCIES: Task 1, Task 2, Task 12
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// ERROR TRACKING FIELD (Task 2)
// ============================================================================
export class PRPPipeline extends Workflow {
  // ... existing fields ...

  /** Continue-on-error flag from CLI --continue-on-error */
  readonly #continueOnError: boolean;

  /** Map of failed tasks to error context for error reporting */
  #failedTasks: Map<string, TaskFailure> = new Map();

  // Update constructor
  constructor(
    prdPath: string,
    scope?: Scope,
    mode?: 'normal' | 'bug-hunt' | 'validate',
    noCache: boolean = false,
    continueOnError: boolean = false  // NEW parameter
  ) {
    // ... existing constructor code ...
    this.#continueOnError = continueOnError;
  }
}

// ============================================================================
// TASK FAILURE INTERFACE (Task 2)
// ============================================================================
interface TaskFailure {
  /** Task ID that failed */
  taskId: string;

  /** Task title */
  taskTitle: string;

  /** Error that caused failure */
  error: Error;

  /** Error code from error hierarchy (if available) */
  errorCode?: string;

  /** Timestamp of failure */
  timestamp: Date;

  /** Phase ID where failure occurred */
  phase?: string;

  /** Milestone ID where failure occurred */
  milestone?: string;
}

// ============================================================================
// FATAL ERROR DETECTION (Task 3)
// ============================================================================
import {
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  ErrorCodes,
} from '../utils/errors.js';

#isFatalError(error: unknown): boolean {
  // If --continue-on-error flag is set, treat all errors as non-fatal
  if (this.#continueOnError) {
    this.logger.warn(
      '[PRPPipeline] --continue-on-error enabled: treating error as non-fatal'
    );
    return false;
  }

  // Null/undefined check
  if (error == null || typeof error !== 'object') {
    return false; // Non-object errors are non-fatal
  }

  // Check for PipelineError from error hierarchy
  if (isPipelineError(error)) {
    // FATAL: Session errors that prevent pipeline execution
    if (isSessionError(error)) {
      return (
        error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
        error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
      );
    }

    // FATAL: Validation errors for PRD parsing
    if (isValidationError(error)) {
      return (
        error.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT &&
        error.context?.operation === 'parse_prd'
      );
    }

    // NON-FATAL: Task and Agent errors are individual failures
    if (isTaskError(error) || isAgentError(error)) {
      return false;
    }
  }

  // Default: non-fatal (continue on unknown errors)
  return false;
}

// ============================================================================
// FAILURE TRACKING (Task 4)
// ============================================================================
#trackFailure(
  taskId: string,
  error: unknown,
  context?: { phase?: string; milestone?: string }
): void {
  // Extract error information
  const errorObj = error instanceof Error ? error : new Error(String(error));
  let errorCode: string | undefined;

  // Extract error code from PipelineError
  if (isPipelineError(error)) {
    errorCode = error.code;
  }

  // Check for Node.js error codes
  if (error instanceof Object && 'code' in error) {
    errorCode = (error as { code: string }).code;
  }

  // Create failure record
  const failure: TaskFailure = {
    taskId,
    taskTitle: context?.taskId || taskId, // Will be updated with actual title
    error: errorObj,
    errorCode,
    timestamp: new Date(),
    phase: context?.phase,
    milestone: context?.milestone,
  };

  // Store in failed tasks Map
  this.#failedTasks.set(taskId, failure);

  // Log with full context
  this.logger.error(
    {
      taskId,
      taskTitle: failure.taskTitle,
      errorCode,
      errorMessage: errorObj.message,
      ...(errorObj.stack && { stack: errorObj.stack }),
      timestamp: failure.timestamp.toISOString(),
      ...context,
    },
    '[PRPPipeline] Task failure tracked'
  );
}

// ============================================================================
// TRY-CATCH WRAPPING PATTERN (Tasks 5-9)
// ============================================================================
// Example for executeBacklog() - most complex case
async executeBacklog(): Promise<void> {
  this.logger.info('[PRPPipeline] Executing backlog');

  try {
    // ... existing setup code (lines 541-557) ...

    let iterations = 0;
    const maxIterations = 10000;

    // WRAP: Loop body in try-catch to continue on individual task failures
    while (await this.taskOrchestrator.processNextItem()) {
      try {
        iterations++;

        // Safety check
        if (iterations > maxIterations) {
          throw new Error(`Execution exceeded ${maxIterations} iterations`);
        }

        // ... existing progress tracking code (lines 570-606) ...
        // (all the same)

        // Check for shutdown request after each task
        if (this.shutdownRequested) {
          // ... existing shutdown code (lines 585-597) ...
          break;
        }

        // ... existing logging code (lines 600-606) ...
      } catch (taskError) {
        // CATCH: Individual task failure - track and continue
        const currentItemId = this.taskOrchestrator.currentItemId;
        const taskId = currentItemId ?? `iteration-${iterations}`;

        this.#trackFailure(taskId, taskError, {
          phase: this.currentPhase,
        });

        this.logger.warn(
          { taskId, error: taskError instanceof Error ? taskError.message : String(taskError) },
          '[PRPPipeline] Task failed, continuing to next task'
        );

        // Continue to next iteration - don't re-throw
        // TaskOrchestrator already set status to Failed
      }
    }

    // ... existing completion code (lines 608-631) ...
    // (all the same - only log if not interrupted)
  } catch (error) {
    // CATCH: Fatal error in backlog execution setup
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (this.#isFatalError(error)) {
      this.logger.error(`[PRPPipeline] Fatal backlog execution error: ${errorMessage}`);
      throw error; // Re-throw to abort pipeline
    }

    // Non-fatal: track and continue
    this.#trackFailure('executeBacklog', error, { phase: this.currentPhase });
    this.logger.warn(`[PRPPipeline] Non-fatal backlog error, continuing: ${errorMessage}`);
  }
}

// ============================================================================
// ERROR REPORT GENERATION (Task 11)
// ============================================================================
async #generateErrorReport(): Promise<void> {
  // No failures - skip report generation
  if (this.#failedTasks.size === 0) {
    return;
  }

  this.logger.info(
    { failureCount: this.#failedTasks.size },
    '[PRPPipeline] Generating error report'
  );

  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (!sessionPath) {
    this.logger.warn('[PRPPipeline] Session path not available for error report');
    return;
  }

  // Build error report data
  const failures = Array.from(this.#failedTasks.values());

  // Categorize by error type
  const errorCategories = {
    taskError: 0,
    agentError: 0,
    validationError: 0,
    sessionError: 0,
    other: 0,
  };

  for (const failure of failures) {
    if (isTaskError(failure.error)) {
      errorCategories.taskError++;
    } else if (isAgentError(failure.error)) {
      errorCategories.agentError++;
    } else if (isValidationError(failure.error)) {
      errorCategories.validationError++;
    } else if (isSessionError(failure.error)) {
      errorCategories.sessionError++;
    } else {
      errorCategories.other++;
    }
  }

  const successRate = this.totalTasks > 0
    ? ((this.completedTasks / this.totalTasks) * 100).toFixed(1)
    : '0.0';

  // Generate markdown content
  const content = `# Error Report

**Generated**: ${new Date().toISOString()}
**Pipeline Mode**: ${this.mode}
**Continue on Error**: ${this.#continueOnError ? 'Yes' : 'No'}

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | ${this.totalTasks} |
| Completed | ${this.completedTasks} |
| Failed | ${this.#failedTasks.size} |
| Success Rate | ${successRate}% |

## Failed Tasks

${failures.map((failure, index) => {
  const errorType = failure.errorCode
    ? `${failure.error.constructor.name} (${failure.errorCode})`
    : failure.error.constructor.name;

  return `### ${index + 1}. ${failure.taskId}: ${failure.taskTitle}

**Phase**: ${failure.phase || 'Unknown'}
**Milestone**: ${failure.milestone || 'N/A'}
**Error Type**: ${errorType}
**Timestamp**: ${failure.timestamp.toISOString()}

**Error Message**:
\`\`\`
${failure.error.message}
\`\`\`

${failure.error.stack ? `**Stack Trace**:\n\`\`\`\n${failure.error.stack.split('\n').slice(0, 5).join('\n')}\n...\n\`\`\`\n` : ''}
`;
}).join('\n---\n')}

## Error Categories

- **TaskError**: ${errorCategories.taskError} tasks
- **AgentError**: ${errorCategories.agentError} tasks
- **ValidationError**: ${errorCategories.validationError} tasks
- **SessionError**: ${errorCategories.sessionError} tasks
- **Other**: ${errorCategories.other} tasks

## Recommendations

1. Review failed tasks above for common patterns
2. Check error messages and stack traces for root causes
3. Fix underlying issues (code, configuration, environment)
4. Re-run pipeline with \`--scope <task-id>\` to retry specific tasks
5. Use \`--continue-on-error\` flag to maximize progress on re-run

**Report Location**: ${sessionPath}/ERROR_REPORT.md
`;

  // Write error report to session directory
  const { resolve } = await import('node:path');
  const { writeFile } = await import('node:fs/promises');
  const reportPath = resolve(sessionPath, 'ERROR_REPORT.md');

  await writeFile(reportPath, content, 'utf-8');
  this.logger.info(`[PRPPipeline] Error report written to ${reportPath}`);
}

// ============================================================================
// RUN() METHOD INTEGRATION (Task 12)
// ============================================================================
async run(): Promise<PipelineResult> {
  this.#startTime = performance.now();
  this.setStatus('running');

  // ... existing logging ...

  try {
    // Create SessionManager (may throw if PRD doesn't exist)
    this.sessionManager = new SessionManagerClass(this.#prdPath);

    // Execute workflow steps
    await this.initializeSession();
    await this.decomposePRD();
    await this.executeBacklog();
    await this.runQACycle();

    this.setStatus('completed');

    const duration = performance.now() - this.#startTime;
    const sessionPath =
      this.sessionManager.currentSession?.metadata.path ?? '';

    this.logger.info('[PRPPipeline] Workflow completed successfully');
    this.logger.info(`[PRPPipeline] Duration: ${duration.toFixed(0)}ms`);

    // GENERATE: Error report if any failures occurred
    await this.#generateErrorReport();

    return {
      success: this.#failedTasks.size === 0, // Modified
      hasFailures: this.#failedTasks.size > 0, // NEW field
      sessionPath,
      totalTasks: this.totalTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.#failedTasks.size, // Use Map size
      finalPhase: this.currentPhase,
      duration,
      phases: this.#summarizePhases(),
      bugsFound: this.#bugsFound,
      shutdownInterrupted: false,
    };
  } catch (error) {
    this.setStatus('failed');

    const duration = performance.now() - this.#startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    this.logger.error(`[PRPPipeline] Workflow failed: ${errorMessage}`);

    // GENERATE: Error report even on fatal error
    await this.#generateErrorReport();

    return {
      success: false,
      hasFailures: this.#failedTasks.size > 0,
      sessionPath: this.sessionManager?.currentSession?.metadata.path ?? '',
      totalTasks: this.totalTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.#failedTasks.size,
      finalPhase: this.currentPhase,
      duration,
      phases: [],
      bugsFound: this.#bugsFound,
      error: errorMessage,
      shutdownInterrupted: this.shutdownRequested,
      shutdownReason: this.shutdownReason ?? undefined,
    };
  } finally {
    // Always cleanup, even if interrupted or errored
    await this.cleanup();
  }
}

// ============================================================================
// UPDATED PipelineResult INTERFACE
// ============================================================================
export interface PipelineResult {
  success: boolean;
  hasFailures: boolean;  // NEW: Indicates if any tasks failed
  sessionPath: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  finalPhase: string;
  duration: number;
  phases: PhaseSummary[];
  bugsFound: number;
  error?: string;
  shutdownInterrupted: boolean;
  shutdownReason?: 'SIGINT' | 'SIGTERM';
}
```

### Integration Points

```yaml
CLI:
  - modify: src/cli/index.ts
    add interface: "continueOnError?: boolean"
    add option: ".option('--continue-on-error', 'Treat all errors as non-fatal', false)"
    pass to: PRPPipeline constructor

ERROR HIERARCHY:
  - import from: src/utils/errors.ts
  - pattern: "import { isPipelineError, isSessionError, isTaskError, isAgentError, isValidationError, ErrorCodes } from '../utils/errors.js'"
  - use: Type guards for fatal/non-fatal detection

LOGGER:
  - import from: src/utils/logger.ts
  - pattern: "logger.error({ taskId, errorCode, errorMessage }, 'Task failed')"
  - use: Track failures with full context

SESSION:
  - use: sessionManager.currentSession.metadata.path for ERROR_REPORT.md location
  - pattern: resolve(sessionPath, 'ERROR_REPORT.md')

MAIN ENTRY POINT:
  - modify: src/index.ts or main entry point
  - pass: args.continueOnError to PRPPipeline constructor
  - exit: process.exit(pipelineResult.hasFailures ? 1 : 0)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying PRPPipeline class
npm run lint -- src/workflows/prp-pipeline.ts --fix
npm run lint -- src/cli/index.ts --fix
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test error recovery functionality
npm test -- tests/unit/workflows/prp-pipeline-error-recovery.test.ts --run

# Test full pipeline with error scenarios
npm test -- tests/unit/workflows/prp-pipeline.test.ts --run

# Coverage validation
npm test -- tests/unit/workflows/ --run --coverage

# Expected: All tests pass, 100% coverage for new error recovery code
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify --continue-on-error flag is parsed
node dist/cli/index.js --help | grep continue-on-error

# Test pipeline with non-fatal error (should continue)
# Setup: Create test PRD with a task that will fail
npm run build
node dist/index.js --prd tests/fixtures/error-prd.md --scope P1.M1.T1

# Test pipeline with fatal error (should abort)
# Setup: Create test PRD with missing session directory
node dist/index.js --prd /nonexistent/path/PRD.md

# Test error report generation
ls -la plan/*/ERROR_REPORT.md

# Expected: Error report created in session directory when failures occur
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual validation: Test error recovery with mock failure
node -e "
import { PRPPipeline } from './dist/workflows/prp-pipeline.js';

const pipeline = new PRPPipeline('./PRD.md', undefined, 'normal', false, true);
console.log('Pipeline created with continueOnError=true');

// Test isFatalError with various error types
import { TaskError, ErrorCodes } from './dist/utils/errors.js';

const taskError = new TaskError('Test task failed', { taskId: 'P1.M1.T1.S1' });
const isFatal = pipeline.#isFatalError(taskError);
console.log('TaskError is fatal:', isFatal, '(expected: false)');
"

# Test error report format
node -e "
import { readFile } from 'node:fs/promises';
const report = await readFile('plan/001_14b9dc2a33c7/ERROR_REPORT.md', 'utf-8');
console.log('Error report preview:');
console.log(report.split('##')[1]); // Show Summary section
"

# Test multiple task failures with continuation
# Create test scenario with multiple failing tasks
# Verify pipeline completes all non-failing tasks

# Test --continue-on-error with fatal error
# Verify warning logged when continuing past fatal error
# Verify pipeline completes despite fatal error when flag is set

# Expected: All creative validations pass, error recovery works as designed
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/workflows/ --run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] failedTasks Map tracks all task failures
- [ ] @Step() methods wrapped with try-catch
- [ ] Fatal errors abort pipeline immediately
- [ ] Non-fatal errors log and continue
- [ ] --continue-on-error flag works correctly
- [ ] Error report generated when failures occur
- [ ] Error report includes all required sections
- [ ] Exit code 1 if any failures, 0 if all successful

### Code Quality Validation

- [ ] Follows existing codebase patterns (error hierarchy, logger usage)
- [ ] File placement matches desired codebase tree
- [ ] Integration with CLI, TaskOrchestrator, SessionManager verified
- [ ] Integration with error hierarchy verified (type guards, error codes)
- [ ] Integration with retry utility verified (errors already retried)
- [ ] Sensitive data redaction in error logs (via logger)

### Documentation & Deployment

- [ ] Code is self-documenting with clear JSDoc comments
- [ ] Error report format documented in research notes
- [ ] CLI flag documented in --help output
- [ ] --continue-on-error behavior clear from name and description

---

## Anti-Patterns to Avoid

- ❌ Don't set task status to Failed in PRPPipeline - TaskOrchestrator handles it
- ❌ Don't wrap cleanup with abort-on-error logic - cleanup must always complete
- ❌ Don't lose error context - track full error object with stack trace
- ❌ Don't generate error report if no failures - check Map size first
- ❌ Don't use console.log for errors - use logger.error() with structured context
- ❌ Don't re-throw non-fatal errors - track and continue
- ❌ Don't forget to import error hierarchy type guards
- ❌ Don't hardcode fatal/non-fatal logic - use #isFatalError() method
- ❌ Don't generate report in cleanup - do it in run() before return
- ❌ Don't set exit code in pipeline - let main entry point handle it
