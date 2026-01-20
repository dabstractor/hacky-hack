name: "PRP: Add Debug Logging to PRPPipeline.run()"
description: |

---

## Goal

**Feature Goal**: Add comprehensive debug logging to the `PRPPipeline.run()` method to enable precise identification of silent failure points in E2E pipeline execution, specifically addressing PRD Issue 3 where the pipeline fails to create `tasks.json` and `prd_snapshot.md` files without clear error messages.

**Deliverable**: Instrumented `PRPPipeline.run()` method with structured debug logging at each major workflow step using Pino logger with correlation ID context.

**Success Definition**:
- Debug logs are emitted at entry point with PRD path and correlation ID
- Debug logs are emitted after session initialization with session path
- Debug logs are emitted after each major workflow step (decomposePRD, executeBacklog, runQACycle)
- All debug logs use structured logging with context objects
- Debug logs only appear when `verbose: true` is set
- E2E tests can be run with verbose flag to capture detailed failure information
- Logs follow existing codebase conventions (`[PRPPipeline]` prefix, context-first pattern)

## User Persona

**Target User**: Developer debugging E2E pipeline failures, QA engineer running integration tests, DevOps engineer troubleshooting production issues.

**Use Case**: Primary scenario is when E2E tests fail with `success: false` and missing files (`tasks.json`, `prd_snapshot.md`). The developer needs to run the pipeline with verbose logging to identify exactly where initialization fails.

**User Journey**:
1. E2E test fails with generic error message
2. Developer reruns pipeline with `--verbose` flag
3. Debug logs output shows exactly which step failed (e.g., session initialization, file creation)
4. Developer identifies root cause from structured log context (e.g., permissions, validation error)
5. Developer fixes issue and validates with instrumented tests

**Pain Points Addressed**:
- Silent failures with no error messages
- No visibility into which step is failing
- Cannot distinguish between session initialization, file creation, or validation failures
- Time-consuming debugging without trace information

## Why

- **Business value**: Reduces debugging time from hours to minutes by providing immediate visibility into failure points
- **User impact**: Developers can quickly identify and fix pipeline failures instead of guessing at root cause
- **Integration**: Enables systematic debugging of E2E test failures as part of Phase P2 (Critical Bug Fixes - E2E Pipeline Execution)
- **Problems solved**: Addresses PRD Issue 3 "Pipeline failing silently" by providing detailed trace information at each workflow step

## What

Add debug-level logging to `PRPPipeline.run()` method following these requirements:

### Logging Points

1. **Entry point**: Log with PRD path, scope, mode, and correlation ID
2. **After session initialization**: Log with session path and existing/new session status
3. **After PRD decomposition**: Log with number of phases and total tasks
4. **After backlog execution**: Log with completion statistics
5. **After QA cycle**: Log with bug count and summary
6. **Error paths**: Log error details with full context in try-catch blocks

### Structured Logging Format

```typescript
// Standard pattern: { context object }, 'message'
this.logger.debug(
  {
    prdPath: this.#prdPath,
    scope: this.#scope,
    mode: this.mode,
    correlationId: this.#correlationId
  },
  '[PRPPipeline] Starting workflow'
);
```

### Success Criteria

- [ ] All 6 logging points implemented in `PRPPipeline.run()`
- [ ] All logs use `[PRPPipeline]` prefix for easy identification
- [ ] All logs use structured context objects (not string interpolation)
- [ ] Debug logs only appear when `verbose: true` is set
- [ ] Logs include relevant identifiers (correlationId, sessionPath, task counts)
- [ ] Error paths include error context (error code, message, stack trace)
- [ ] No performance impact when verbose mode is disabled

## All Needed Context

### Context Completeness Check

✓ **Passes "No Prior Knowledge" test** - This PRP provides complete context on:
- Exact file to modify with line numbers
- Pino logger usage patterns from existing codebase
- Structured logging conventions with examples
- Test patterns for validation
- Specific logging points with format examples
- Gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - Core implementation file
- file: src/workflows/prp-pipeline.ts
  why: Target file for modification - contains PRPPipeline.run() method (lines 1591-1679)
  pattern: Observe existing logging patterns in constructor, initializeSession, executeBacklog methods
  gotcha: Uses both `this.logger` and `this.correlationLogger` - correlationLogger has correlationId context

# MUST READ - Logger utility and patterns
- file: src/utils/logger.ts
  why: GetLogger function and Logger interface - understand verbose flag and child logger creation
  section: Lines 25-65 (getLogger function), lines 12-23 (Logger interface)
  critical: Debug logs only appear when verbose: true is set in options

# MUST READ - Existing debug logging examples
- file: src/core/session-manager.ts
  why: Reference implementation of debug logging patterns in codebase
  pattern: Lines 312-318 (structured debug with context), lines 424-426 (simple debug messages)
  critical: Uses this.#logger.debug({ context }, 'message') pattern

# MUST READ - Pino best practices
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/pino-best-practices.md
  why: Comprehensive Pino logger best practices from official documentation
  section: Gotchas for Debug-Level Logging, Structured Data Patterns
  critical: Pino evaluates log levels BEFORE serialization - disabled levels have zero cost

# MUST READ - Codebase logging conventions
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/pino-logger-patterns.md
  why: Existing patterns and conventions for logging in this codebase
  section: Structured Logging Conventions, Key Conventions (Do/Don't)
  critical: Always use context objects with descriptive keys, consistent [ComponentName] prefix

# MUST READ - Test patterns for validation
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/test-patterns.md
  why: How to test logging behavior in this codebase
  section: Validation Patterns for Debug Logging, Logger Mocking Patterns
  critical: Use vi.spyOn() to verify debug method calls, test both verbose enabled/disabled

# MUST READ - PRD Issue 3 context
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/prd-issue-3-context.md
  why: Understanding of the problem we're solving - silent pipeline failures
  section: Failure Points, Critical Files to Monitor
  critical: Session initialization is the suspected failure point based on missing files

# MUST READ - Existing test file
- file: tests/unit/workflows/prp-pipeline.test.ts
  why: See how PRPPipeline tests are structured and how logger mocking works
  pattern: Lines 20-35 (logger mock setup), lines 200-250 (run() method tests)
  critical: Uses mockLogger with hoisted variables and vi.hoisted()

# REFERENCE - Child logger usage
- file: src/workflows/prp-pipeline.ts
  why: See how correlationLogger is created with child context (lines 286-288)
  pattern: this.correlationLogger = getLogger('PRPPipeline').child({ correlationId: this.#correlationId })
  critical: Child loggers inherit parent context - correlationLogger automatically includes correlationId

# REFERENCE - SessionManager initialization
- file: src/core/session-manager.ts
  why: Understanding session initialization flow to log relevant context
  section: Lines 210-299 (initialize method)
  critical: Returns session metadata with id and path - these should be logged

# EXTERNAL - Pino official documentation
- url: https://getpino.io/#/docs/api?id=log-level
  why: Understanding log level hierarchy and when debug logs are emitted
  critical: debug is level 20, info is level 30 - debug only appears if level <= 20

# EXTERNAL - Pino child loggers
- url: https://getpino.io/#/docs/api?id=child
  why: Understanding child logger behavior and context inheritance
  critical: Child loggers are IMMUTABLE - once created, context cannot be changed
```

### Current Codebase tree (partial - relevant sections)

```bash
src/
├── utils/
│   └── logger.ts                    # getLogger() function, Logger interface
├── core/
│   ├── session-manager.ts           # Session initialization logic
│   └── task-orchestrator.ts         # Task execution with debug logging examples
└── workflows/
    └── prp-pipeline.ts              # TARGET FILE - PRPPipeline.run() method (lines 1591-1679)

tests/
├── unit/
│   └── workflows/
│       ├── prp-pipeline.test.ts     # Unit tests for PRPPipeline
│       └── prp-pipeline-progress.test.ts  # Progress tracking tests
└── e2e/
    └── pipeline.test.ts             # E2E tests that are currently failing (PRD Issue 3)
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
# No new files to add - only modifying existing file:
src/workflows/prp-pipeline.ts         # MODIFY: Add debug logging to run() method

# Tests will be updated in next subtask (P2.M1.T1.S3)
tests/unit/workflows/prp-pipeline.test.ts  # MODIFY: Add tests for debug logging (next subtask)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Pino log levels - debug is level 20, info is level 30
// Debug logs only appear when verbose: true is set
// When level is 'info' (30), debug calls have ~zero performance cost
const logger = getLogger('PRPPipeline', { verbose: true }); // Required for debug logs

// CRITICAL: Use structured logging, not string interpolation
// GOOD:
this.logger.debug({ prdPath: this.#prdPath }, 'Starting workflow');
// BAD:
this.logger.debug(`Starting workflow with PRD: ${this.#prdPath}`);

// CRITICAL: Always use [PRPPipeline] prefix for component-level logs
// This follows existing convention in the codebase
this.logger.debug('[PRPPipeline] Workflow started');

// CRITICAL: Use correlationLogger for correlation ID context
// correlationLogger already has correlationId in context via child()
this.correlationLogger.debug({ prdPath: this.#prdPath }, '[PRPPipeline] Starting workflow');

// CRITICAL: Child loggers are IMMUTABLE
// Once created, their context cannot be changed
// correlationLogger was created in constructor with correlationId - use it for run() logs

// CRITICAL: Error objects need special handling in Pino
// Error properties are not enumerable by default
// Use isFatalError() helper to check error types
if (isFatalError(error, this.#continueOnError)) {
  this.logger.error({ err: error, errorMessage }, '[PRPPipeline] Fatal error');
}

// GOTCHA: SessionManager might not be initialized if constructor fails
// Check if this.sessionManager exists before accessing its properties
const sessionPath = this.sessionManager?.currentSession?.metadata.path ?? 'unknown';

// GOTCHA: E2E tests fail with missing tasks.json and prd_snapshot.md
// Suspected failure point is session initialization (createSessionDirectory, writeTasksJSON)
// Log session path immediately after initialization to verify directory creation

// PATTERN: Log state changes with from/to values
this.logger.debug(
  { fromStatus: 'init', toStatus: 'running' },
  '[PRPPipeline] Status changed'
);

// PATTERN: Log timing information for performance debugging
const startTime = performance.now();
// ... operation ...
this.logger.debug(
  { phase: 'session_init', duration: performance.now() - startTime },
  '[PRPPipeline] Phase completed'
);
```

## Implementation Blueprint

### Data models and structure

No new data models needed - using existing:
- `PipelineResult` interface (lines 57-84) - already contains all needed fields
- `SessionState` type from session-manager - contains session metadata
- Existing Logger interface with `debug()` method

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ and UNDERSTAND existing PRPPipeline.run() method
  - FILE: src/workflows/prp-pipeline.ts, lines 1591-1679
  - UNDERSTAND: Current workflow steps and their order
  - UNDERSTAND: Existing error handling patterns
  - UNDERSTAND: Where SessionManager is created and initialized
  - IDENTIFY: All 6 logging points specified in requirements
  - NO MODIFICATIONS in this task - read-only analysis

Task 2: ADD debug logging at ENTRY POINT of run() method
  - FILE: src/workflows/prp-pipeline.ts, line 1592-1593
  - LOCATION: Immediately after `this.#startTime = performance.now()` and `this.setStatus('running')`
  - IMPLEMENT: this.correlationLogger.debug() call with context object
  - CONTEXT: { prdPath: this.#prdPath, scope: this.#scope, mode: this.mode, correlationId: this.#correlationId }
  - MESSAGE: '[PRPPipeline] Starting PRP Pipeline workflow'
  - PATTERN: Follow src/core/session-manager.ts lines 312-318 (structured debug with context)
  - NOTE: Existing info logs at lines 1595-1608 can remain - debug adds verbose detail

Task 3: ADD debug logging AFTER SESSION INITIALIZATION
  - FILE: src/workflows/prp-pipeline.ts, after line 1617 (after await this.initializeSession())
  - IMPLEMENT: this.logger.debug() call with session context
  - CONTEXT: { sessionPath: this.sessionManager?.currentSession?.metadata.path, hasExistingBacklog: boolean }
  - MESSAGE: '[PRPPipeline] Session initialized'
  - PATTERN: Follow src/core/session-manager.ts lines 424-426 (simple debug with context)
  - GOTCHA: Use optional chaining (this.sessionManager?.currentSession) - might not be initialized
  - GOTCHA: Log both session path and whether existing backlog was found

Task 4: ADD debug logging AFTER PRD DECOMPOSITION
  - FILE: src/workflows/prp-pipeline.ts, after line 1618 (after await this.decomposePRD())
  - IMPLEMENT: this.logger.debug() call with backlog context
  - CONTEXT: { totalPhases: number, totalTasks: this.totalTasks }
  - MESSAGE: '[PRPPipeline] PRD decomposition complete'
  - PATTERN: Follow src/workflows/prp-pipeline.ts line 693 (existing info log with counts)
  - NOTE: Existing info log at line 692 already logs this - debug adds structured context

Task 5: ADD debug logging AFTER BACKLOG EXECUTION
  - FILE: src/workflows/prp-pipeline.ts, after line 1619 (after await this.executeBacklog())
  - IMPLEMENT: this.logger.debug() call with execution context
  - CONTEXT: { completedTasks: this.completedTasks, totalTasks: this.totalTasks, failedTasks: this.#countFailedTasks() }
  - MESSAGE: '[PRPPipeline] Backlog execution complete'
  - PATTERN: Follow src/workflows/prp-pipeline.ts lines 871-881 (existing summary logging)
  - NOTE: Existing info logs at lines 864-884 already log this - debug adds structured context

Task 6: ADD debug logging AFTER QA CYCLE
  - FILE: src/workflows/prp-pipeline.ts, after line 1620 (after await this.runQACycle())
  - IMPLEMENT: this.logger.debug() call with QA context
  - CONTEXT: { bugsFound: this.#bugsFound, mode: this.mode }
  - MESSAGE: '[PRPPipeline] QA cycle complete'
  - PATTERN: Follow src/workflows/prp-pipeline.ts line 985 (existing info log with bug count)
  - NOTE: Existing info log at line 985 already logs this - debug adds structured context

Task 7: ADD debug logging in ERROR PATH (catch block)
  - FILE: src/workflows/prp-pipeline.ts, line 1648 (catch block)
  - LOCATION: Inside catch block, after `this.setStatus('failed')`
  - IMPLEMENT: this.logger.debug() call with error context
  - CONTEXT: { errorMessage, errorType: error?.constructor?.name, currentPhase: this.currentPhase }
  - MESSAGE: '[PRPPipeline] Workflow failed with error'
  - PATTERN: Follow src/workflows/prp-pipeline.ts lines 1655 (existing error log)
  - GOTCHA: Check if error is Error object before accessing constructor.name
  - GOTCHA: Use same error message extraction as existing code (lines 1652-1653)

Task 8: VERIFY all debug logs follow conventions
  - CHECK: All logs use `[PRPPipeline]` prefix
  - CHECK: All logs use structured context objects (no string interpolation)
  - CHECK: All context keys use camelCase and descriptive names
  - CHECK: All logs use either this.logger.debug() or this.correlationLogger.debug()
  - CHECK: No sensitive data logged (API keys, tokens, passwords)
  - CHECK: Debug logs only appear when verbose: true is set

Task 9: RUN existing tests to ensure no regressions
  - COMMAND: npm test -- tests/unit/workflows/prp-pipeline.test.ts
  - EXPECTED: All existing tests pass (logging is additive, shouldn't break existing behavior)
  - VALIDATE: No new console output when verbose is disabled
  - VALIDATE: Tests still mock logger correctly

Task 10: MANUAL TESTING with verbose flag
  - COMMAND: npm run pipeline -- --prd PRD.md --verbose (or equivalent command)
  - EXPECTED: Debug logs appear in output when --verbose is set
  - VALIDATE: All 6 logging points emit debug logs
  - VALIDATE: Context objects are properly formatted in output
  - VALIDATE: Logs are readable and provide useful debugging information
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// Pattern 1: Entry point logging with correlation context
// ============================================================================
// Location: Immediately after line 1593 in run() method
// Use correlationLogger for automatic correlationId inclusion

this.correlationLogger.debug(
  {
    prdPath: this.#prdPath,
    scope: this.#scope ?? 'all',
    mode: this.mode,
    // correlationId is automatically included from child logger context
  },
  '[PRPPipeline] Starting PRP Pipeline workflow'
);

// ============================================================================
// Pattern 2: Post-step logging with step result context
// ============================================================================
// Location: After each major workflow step (initializeSession, decomposePRD, etc.)

this.logger.debug(
  {
    sessionPath: this.sessionManager?.currentSession?.metadata.path,
    hasExistingBacklog: backlog && backlog.backlog.length > 0,
    // Add any other relevant context from the step
  },
  '[PRPPipeline] Session initialized'
);

// ============================================================================
// Pattern 3: Error path logging with error context
// ============================================================================
// Location: Inside catch block (line 1648)

const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
const errorMessage = error instanceof Error ? error.message : String(error);

this.logger.debug(
  {
    errorMessage,
    errorType,
    errorCode: (error as any)?.code,
    currentPhase: this.currentPhase,
    // Add error stack trace if available
    ...(error instanceof Error && { stack: error.stack })
  },
  '[PRPPipeline] Workflow failed with error'
);

// ============================================================================
// Pattern 4: Timing information for performance debugging
// ============================================================================
// Optional: Add timing context for each major step

const phaseStartTime = performance.now();
await this.initializeSession();
const phaseDuration = performance.now() - phaseStartTime;

this.logger.debug(
  {
    sessionPath: this.sessionManager?.currentSession?.metadata.path,
    phase: 'initializeSession',
    duration: phaseDuration
  },
  '[PRPPipeline] Session initialized'
);

// ============================================================================
// Pattern 5: State change logging with from/to values
// ============================================================================

this.logger.debug(
  {
    fromStatus: 'init',
    toStatus: 'running',
    phase: 'run'
  },
  '[PRPPipeline] Status changed'
);

// ============================================================================
// GOTCHA: Safe property access on potentially undefined objects
// ============================================================================

// GOOD: Use optional chaining and nullish coalescing
const sessionPath = this.sessionManager?.currentSession?.metadata.path ?? 'unknown';
const hasBacklog = backlog?.backlog?.length > 0 ?? false;

// BAD: Direct property access can throw if sessionManager is undefined
const sessionPath = this.sessionManager.currentSession.metadata.path; // THROWS if undefined

// ============================================================================
// GOTCHA: Error object type checking
// ============================================================================

// GOOD: Check if error is Error object before accessing properties
if (error instanceof Error) {
  const errorName = error.constructor.name;
  const errorMessage = error.message;
  const errorStack = error.stack;
}

// BAD: Direct property access on unknown error type
const errorName = error.constructor.name; // THROWS if error is not an Error object
```

### Integration Points

```yaml
NO NEW INTEGRATIONS:
  - This task only adds logging to existing code
  - No new dependencies or imports needed
  - No configuration changes needed
  - No database or API changes

EXISTING INTEGRATIONS USED:
  - Logger: src/utils/logger.ts (getLogger function)
  - Pino library: Already imported and used in prp-pipeline.ts
  - Correlation ID: Already created in constructor (line 267)
  - SessionManager: Already imported and used in run() method

TEST INTEGRATION:
  - Tests will verify debug logs are emitted when verbose is true
  - Tests will verify no debug logs when verbose is false (default)
  - Next subtask (P2.M1.T1.S3) will add comprehensive test coverage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npm run lint src/workflows/prp-pipeline.ts
# Expected: Zero linting errors

npm run type-check
# Expected: Zero type errors

# Format code to match project style
npm run format src/workflows/prp-pipeline.ts

# Run all linting and formatting
npm run lint
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test PRPPipeline functionality (existing tests should still pass)
npm test -- tests/unit/workflows/prp-pipeline.test.ts

# Test should not break existing functionality
# Expected: All existing tests pass (logging is additive)

# Run full workflow test suite
npm test -- tests/unit/workflows/

# Coverage validation (if coverage tools available)
npm test -- --coverage tests/unit/workflows/prp-pipeline.test.ts

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# NOTE: Comprehensive debug logging tests will be added in next subtask (P2.M1.T1.S3)
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual testing with verbose flag enabled
# This validates debug logs are emitted correctly

# Run pipeline with verbose flag (adjust command as needed for your project)
npm run pipeline -- --prd PRD.md --verbose --no-cache

# Expected output should include debug logs like:
# [PRPPipeline] Starting PRP Pipeline workflow
#   level: "debug"
#   prdPath: "./PRD.md"
#   scope: "all"
#   mode: "normal"
#   correlationId: "1234567890-abc123"
# [PRPPipeline] Session initialized
#   level: "debug"
#   sessionPath: "plan/002_1e734971e481/..."
#   hasExistingBacklog: false
# [PRPPipeline] PRD decomposition complete
#   level: "debug"
#   totalPhases: 4
#   totalTasks: 25
# ... and so on for each major step

# Run pipeline WITHOUT verbose flag (default behavior)
npm run pipeline -- --prd PRD.md --no-cache

# Expected: NO debug logs in output, only info/warn/error logs
# Debug logs should NOT appear when verbose is false

# Test with failing PRD (to test error path logging)
npm run pipeline -- --prd /nonexistent.md

# Expected: Debug log in error path with error context
# [PRPPipeline] Workflow failed with error
#   errorMessage: "PRD file not found"
#   errorType: "Error"
#   currentPhase: "init"

# Expected: All integration tests working, debug logs appear/disappear based on verbose flag
```

### Level 4: E2E Testing (Full Pipeline Validation)

```bash
# Run E2E tests with verbose logging to capture detailed failure information
# This is the PRIMARY validation for PRD Issue 3

# Set environment variable to enable verbose logging in tests
export VERBOSE=true
npm test -- tests/e2e/pipeline.test.ts

# Expected: E2E tests should now show detailed debug output
# If tests still fail, the debug logs will show exactly where failure occurs:
# - Does session initialization complete? (check for "Session initialized" debug log)
# - Does PRD decomposition complete? (check for "PRD decomposition complete" debug log)
# - Does backlog execution start? (check for "Backlog execution complete" debug log)
# - Does QA cycle run? (check for "QA cycle complete" debug log)
# - If not, which step throws an error? (check error debug log)

# Capture full output for analysis
npm test -- tests/e2e/pipeline.test.ts 2>&1 | tee e2e-test-output.log

# Analyze output to identify failure point
# Look for the LAST successful debug log before error
# Look for error context in error debug log
# Check if sessionPath is logged (session directory creation succeeded)
# Check if tasks.json and prd_snapshot.md exist in logged sessionPath

# Expected: E2E test output shows detailed failure information
# Next subtask (P2.M1.T1.S3) will analyze this output to identify root cause
```

## Final Validation Checklist

### Technical Validation

- [ ] All 10 implementation tasks completed successfully
- [ ] All 6 logging points implemented in `PRPPipeline.run()`
- [ ] All tests pass: `npm test -- tests/unit/workflows/prp-pipeline.test.ts`
- [ ] No linting errors: `npm run lint src/workflows/prp-pipeline.ts`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format src/workflows/prp-pipeline.ts --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Debug logs appear when `verbose: true` is set
- [ ] Debug logs do NOT appear when verbose is disabled (default)
- [ ] All logs use `[PRPPipeline]` prefix for easy identification
- [ ] All logs use structured context objects (not string interpolation)
- [ ] Context objects include relevant identifiers (correlationId, sessionPath, counts)
- [ ] Error path includes error context (type, message, phase)
- [ ] No sensitive data logged (API keys, tokens, passwords)

### Code Quality Validation

- [ ] Follows existing codebase patterns (referenced in Context section)
- [ ] Uses this.logger.debug() or this.correlationLogger.debug() consistently
- [ ] No string interpolation in log messages (all context in objects)
- [ ] Safe property access with optional chaining (?.) and nullish coalescing (??)
- [ ] Error type checking before accessing Error properties
- [ ] No performance impact when verbose mode is disabled
- [ ] Logs provide useful debugging information (not redundant or verbose)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Debug logs are meaningful and actionable for debugging
- [ ] Context keys use descriptive names (prdPath, sessionPath, totalTasks, etc.)
- [ ] No changes to environment variables or configuration
- [ ] No changes to gitignore or build scripts

### E2E Pipeline Validation

- [ ] E2E tests run with `--verbose` flag show detailed debug output
- [ ] Debug logs identify which step is failing (session init, decomposition, execution, QA)
- [ ] Session path is logged (can verify session directory was created)
- [ ] Error context includes error type, message, and current phase
- [ ] Debug output provides enough information to identify root cause of PRD Issue 3

---

## Anti-Patterns to Avoid

- ❌ Don't use string interpolation for log data - use structured context objects instead
  - Bad: `this.logger.debug(\`Starting workflow with PRD: ${this.#prdPath}\`)`
  - Good: `this.logger.debug({ prdPath: this.#prdPath }, 'Starting workflow')`

- ❌ Don't forget the `[PRPPipeline]` prefix - it's critical for log filtering
  - Bad: `this.logger.debug('Starting workflow')`
  - Good: `this.logger.debug('[PRPPipeline] Starting workflow')`

- ❌ Don't log sensitive data - Pino redacts common patterns but be careful
  - Bad: `this.logger.debug({ apiKey: process.env.API_KEY }, 'Starting')`
  - Good: `this.logger.debug({ apiEndpoint: 'https://api.example.com' }, 'Starting')`

- ❌ Don't use this.logger for correlation ID context - use correlationLogger
  - Bad: `this.logger.debug({ correlationId: this.#correlationId }, 'Starting')`
  - Good: `this.correlationLogger.debug({ prdPath: this.#prdPath }, 'Starting')`

- ❌ Don't access properties on potentially undefined objects without safe navigation
  - Bad: `this.logger.debug({ path: this.sessionManager.currentSession.metadata.path }, 'Done')`
  - Good: `this.logger.debug({ path: this.sessionManager?.currentSession?.metadata.path }, 'Done')`

- ❌ Don't assume error objects have Error properties - check type first
  - Bad: `this.logger.debug({ errorType: error.constructor.name }, 'Failed')`
  - Good: `this.logger.debug({ errorType: error instanceof Error ? error.constructor.name : 'Unknown' }, 'Failed')`

- ❌ Don't add debug logging that slows down the pipeline when verbose is disabled
  - Bad: Expensive computations in debug() call arguments
  - Good: Pino evaluates level before serialization - disabled levels have zero cost

- ❌ Don't duplicate existing info logs - debug should add structured context, not replace
  - Bad: Remove existing info logs
  - Good: Add debug logs alongside existing info logs for verbose debugging

- ❌ Don't log at every line - be strategic about logging points
  - Bad: Debug log before and after every function call
  - Good: Debug log at major workflow step boundaries (init, decompose, execute, QA)

- ❌ Don't forget to test both verbose enabled and disabled scenarios
  - Bad: Only test with verbose=true
  - Good: Test that debug logs disappear when verbose=false (default)

- ❌ Don't break existing tests - logging is additive
  - Bad: Modify test expectations to require debug logs
  - Good: Existing tests should pass without modification (next subtask adds new tests)
