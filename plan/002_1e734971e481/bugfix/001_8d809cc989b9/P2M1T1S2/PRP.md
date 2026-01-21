name: "PRP: Add Debug Logging to Session Initialization"
description: |

---

## Goal

**Feature Goal**: Add comprehensive debug logging to `SessionManager.initialize()` and session file operations (`hashPRD`, `createSessionDirectory`, `writeTasksJSON`, `snapshotPRD`) to enable precise identification of where session initialization fails during E2E pipeline execution, specifically addressing PRD Issue 3 where `tasks.json` and `prd_snapshot.md` files are missing after pipeline runs.

**Deliverable**: Instrumented session initialization code with structured debug logging at each critical file operation using Pino logger with context objects for paths, operation results, and error details.

**Success Definition**:

- Debug logs emitted at each session initialization step (PRD hash generation, session directory creation, file writes)
- Debug logs emitted for each file operation in session-utils.ts (read, write, validation)
- All debug logs use structured logging with context objects (paths, sizes, durations)
- Debug logs only appear when `verbose: true` is set
- File operation failures are logged with full error context (error code, path, operation type)
- E2E tests run with verbose flag capture exact failure point in session initialization
- Logs follow existing codebase conventions (`[SessionManager]` prefix, context-first pattern)

## User Persona

**Target User**: Developer debugging E2E pipeline failures, QA engineer running integration tests, DevOps engineer troubleshooting production issues.

**Use Case**: Primary scenario is when E2E tests fail with `success: false` and missing files (`tasks.json`, `prd_snapshot.md`). The developer needs to identify exactly which file operation fails (hash computation, directory creation, tasks.json write, prd_snapshot.md write).

**User Journey**:

1. E2E test fails with ENOENT for tasks.json and prd_snapshot.md
2. Developer enables verbose logging and reruns pipeline
3. Debug logs show exactly which file operation fails (e.g., "Failed to write tasks.json: EACCES")
4. Developer identifies root cause from structured log context (permissions, disk space, validation error)
5. Developer fixes issue and validates with instrumented tests

**Pain Points Addressed**:

- Silent file operation failures with no error messages
- No visibility into which step of session initialization fails
- Cannot distinguish between directory creation, file write, or validation failures
- Time-consuming debugging without trace information

## Why

- **Business value**: Reduces debugging time from hours to minutes by providing immediate visibility into file operation failures
- **User impact**: Developers can quickly identify and fix session initialization failures instead of guessing at root cause
- **Integration**: Enables systematic debugging of E2E test failures as part of Phase P2.M1 (Debug E2E Pipeline Execution Failures)
- **Problems solved**: Addresses PRD Issue 3 "Missing tasks.json and prd_snapshot.md" by providing detailed trace information for each file operation
- **Dependency**: Builds on P2.M1.T1.S1 (debug logging in PRPPipeline.run()) by adding deeper instrumentation into the session initialization layer

## What

Add debug-level logging to session initialization following these requirements:

### Logging Points in SessionManager.initialize()

1. **Before PRD hash computation**: Log PRD path and operation intent
2. **After PRD hash computation**: Log computed hash (first 12 chars)
3. **Before PRD validation**: Log validation start
4. **After PRD validation**: Log validation result (pass/warning counts)
5. **Before session directory creation**: Log sequence, hash, plan directory
6. **After session directory creation**: Log created session path
7. **Before PRD snapshot write**: Log source and destination paths
8. **After PRD snapshot write**: Log write success with file size
9. **Before tasks.json write** (when backlog exists): Log write intent
10. **After tasks.json write** (when backlog exists): Log write success
11. **Error paths**: Log error with path, operation, error code for each file operation

### Logging Points in session-utils.ts

12. **hashPRD function**: Log PRD path, hash result, file read errors
13. **createSessionDirectory function**: Log PRD path, computed hash, directory creation, subdirectory creation
14. **writeTasksJSON function**: Log session path, backlog size, atomic write steps, write errors
15. **snapshotPRD function**: Log PRD path, session path, write operation, write errors
16. **readTasksJSON function**: Log session path, read operation (for existing sessions)
17. **loadSnapshot function**: Log session path, read operation (for existing sessions)

### Structured Logging Format

```typescript
// Standard pattern: { context object }, 'message'
this.#logger.debug(
  {
    prdPath: this.prdPath,
    operation: 'hashPRD',
    sessionHash: fullHash.slice(0, 12),
  },
  '[SessionManager] PRD hash computed'
);
```

### Success Criteria

- [ ] All 17 logging points implemented across SessionManager and session-utils
- [ ] All logs use `[SessionManager]` prefix for easy identification
- [ ] All logs use structured context objects (not string interpolation)
- [ ] Debug logs only appear when `verbose: true` is set
- [ ] Logs include relevant identifiers (paths, hashes, sizes, durations)
- [ ] Error paths include error context (error code, path, operation type)
- [ ] File operations log both intent (before) and result (after)
- [ ] No performance impact when verbose mode is disabled

## All Needed Context

### Context Completeness Check

✓ **Passes "No Prior Knowledge" test** - This PRP provides complete context on:

- Exact files to modify with line numbers
- Pino logger usage patterns from existing codebase
- Structured logging conventions with examples
- Test patterns for validation
- Specific logging points with format examples
- Gotchas and anti-patterns to avoid
- Related PRP from P2.M1.T1.S1 for pipeline-level logging

### Documentation & References

```yaml
# MUST READ - Primary implementation file
- file: src/core/session-manager.ts
  why: Target file for modification - contains SessionManager.initialize() method (lines 210-336)
  pattern: Observe existing logging patterns in initialize(), loadSession(), saveBacklog() methods
  gotcha: Uses private #logger field, initialized in constructor with getLogger('SessionManager')
  critical: Lines 293-297 write PRD snapshot without logging - key gap to fill

# MUST READ - Session utilities file
- file: src/core/session-utils.ts
  why: Target file for modification - contains hashPRD, createSessionDirectory, writeTasksJSON, snapshotPRD functions
  pattern: Observe existing SessionFileError usage, atomic write pattern, Zod validation
  gotcha: No logging currently exists - all file operations are silent
  critical: Lines 160-167 (hashPRD), 197-242 (createSessionDirectory), 266-290 (writeTasksJSON), 475-504 (snapshotPRD)

# MUST READ - Logger utility and patterns
- file: src/utils/logger.ts
  why: GetLogger function and Logger interface - understand verbose flag and child logger creation
  section: Lines 25-65 (getLogger function), lines 12-23 (Logger interface)
  critical: Debug logs only appear when verbose: true is set in options

# MUST READ - Existing debug logging examples in SessionManager
- file: src/core/session-manager.ts
  why: Reference implementation of debug logging patterns in same class
  pattern: Lines 239-249 (validation warning logging), lines 278-282 (session loaded logging)
  critical: Uses this.#logger.debug({ context }, 'message') pattern

# MUST READ - Related PRP for pipeline-level logging
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/PRP.md
  why: Understanding of pipeline-level debug logging added in previous subtask
  section: Implementation Patterns & Key Details, Logging Points
  critical: Pipeline logs at entry/exit - session logs should complement with file operation details

# MUST READ - Codebase logging conventions research
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/pino-logger-patterns.md
  why: Existing patterns and conventions for logging in this codebase
  section: Structured Logging Conventions, Key Conventions (Do/Don't)
  critical: Always use context objects with descriptive keys, consistent [ComponentName] prefix

# MUST READ - Pino best practices research
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/pino-best-practices.md
  why: Comprehensive Pino logger best practices for file operation logging
  section: File Operation Logging, Initialization Sequence Logging
  critical: Log before and after file operations, include timing information

# MUST READ - Test patterns for validation
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/test-patterns.md
  why: How to test logging behavior in this codebase
  section: Validation Patterns for Debug Logging, Logger Mocking Patterns
  critical: Use vi.spyOn() to verify debug method calls, test both verbose enabled/disabled

# MUST READ - PRD Issue 3 context
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T1S1/research/prd-issue-3-context.md
  why: Understanding of the problem we're solving - missing files in E2E tests
  section: Failure Points, Critical Files to Monitor
  critical: Session initialization is the suspected failure point based on missing files

# MUST READ - System architecture context
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/system_context.md
  why: Complete system architecture including session management flow
  section: Session Management, File Operations, Error Handling
  critical: SessionManager wraps session-utils.ts functions - both need logging

# MUST READ - Existing test files
- file: tests/unit/core/session-manager.test.ts
  why: See how SessionManager tests are structured and how logger mocking works
  pattern: Lines 40-80 (mock setup), lines 200-300 (initialize() tests)
  critical: Uses mockLogger with vi.mock() - follow same pattern for new tests

# MUST READ - Session utils tests
- file: tests/unit/core/session-utils.test.ts
  why: See how session-utils tests are structured
  pattern: Lines 30-60 (mock setup), lines 100-200 (hashPRD, createSessionDirectory tests)
  critical: Tests file operations but doesn't verify logging - logging tests will be added

# REFERENCE - PRPPipeline debug logging implementation
- file: src/workflows/prp-pipeline.ts
  why: See completed debug logging from P2.M1.T1.S1 as reference pattern
  section: Lines 1631-1666 (post-step debug logging in run() method)
  critical: Shows context objects, message format, correlation ID usage

# EXTERNAL - Pino official documentation
- url: https://getpino.io/#/docs/api?id=log-level
  why: Understanding log level hierarchy and when debug logs are emitted
  critical: debug is level 20, info is level 30 - debug only appears if level <= 20

# EXTERNAL - Pino child loggers
- url: https://getpino.io/#/docs/api?id=child
  why: Understanding child logger behavior and context inheritance
  critical: Child loggers are IMMUTABLE - once created, context cannot be changed

# EXTERNAL - Node.js file system best practices
- url: https://nodejs.org/api/fs.html
  why: Understanding file system error codes (ENOENT, EACCES, ENOSPC)
  critical: Error codes should be logged in debug context for troubleshooting
```

### Current Codebase tree (partial - relevant sections)

```bash
src/
├── utils/
│   └── logger.ts                    # getLogger() function, Logger interface
├── core/
│   ├── session-manager.ts           # TARGET FILE 1 - SessionManager.initialize() method (lines 210-336)
│   ├── session-utils.ts             # TARGET FILE 2 - hashPRD, createSessionDirectory, writeTasksJSON, snapshotPRD
│   └── task-orchestrator.ts         # Reference for debug logging patterns
└── workflows/
    └── prp-pipeline.ts              # Reference - completed debug logging from P2.M1.T1.S1

tests/
├── unit/
│   └── core/
│       ├── session-manager.test.ts     # Unit tests for SessionManager
│       └── session-utils.test.ts       # Unit tests for session-utils
└── e2e/
    └── pipeline.test.ts             # E2E tests that are currently failing (PRD Issue 3)
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
# No new files to add - only modifying existing files:
src/core/session-manager.ts         # MODIFY: Add debug logging to initialize() method
src/core/session-utils.ts           # MODIFY: Add debug logging to file operation functions

# Tests will be updated in next subtask (P2.M1.T1.S3)
tests/unit/core/session-manager.test.ts  # MODIFY: Add tests for debug logging (next subtask)
tests/unit/core/session-utils.test.ts    # MODIFY: Add tests for debug logging (next subtask)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Pino log levels - debug is level 20, info is level 30
// Debug logs only appear when verbose: true is set
// When level is 'info' (30), debug calls have ~zero performance cost
const logger = getLogger('SessionManager', { verbose: true }); // Required for debug logs

// CRITICAL: Use structured logging, not string interpolation
// GOOD:
this.#logger.debug({ prdPath: this.prdPath }, 'Computing PRD hash');
// BAD:
this.#logger.debug(`Computing PRD hash for: ${this.prdPath}`);

// CRITICAL: Always use [SessionManager] prefix for component-level logs
// This follows existing convention in the codebase
this.#logger.debug('[SessionManager] PRD hash computed');

// CRITICAL: session-utils.ts functions are NOT class methods
// They are standalone async functions that cannot access instance logger
// Must either: (1) accept optional logger parameter, or (2) use getLogger() internally
// PREFERRED: Use getLogger('session-utils') internally for consistency

// CRITICAL: File operations use async/await patterns
// All functions in session-utils.ts are async
// Logging should be done before and after await calls

// CRITICAL: SessionFileError wraps file system errors
// Error.code property contains Node.js errno (ENOENT, EACCES, etc.)
// Log error.code in debug context for troubleshooting

// CRITICAL: atomicWrite helper uses temp file + rename pattern
// Log both temp file creation and rename operation
// Rename failure is particularly important to log (atomicity violation)

// CRITICAL: Zod validation happens before file writes
// Log validation result (success/failure) before attempting write
// Validation failures should be logged with specific Zod error details

// CRITICAL: createSessionDirectory handles EEXIST gracefully
// Directory already existing is not an error - log as info, not error
// Other error codes (EACCES, ENOSPC) should be logged as errors

// CRITICAL: PRD hash computation reads entire file into memory
// Log file size along with hash for context on large PRDs

// CRITICAL: Session initialization creates multiple subdirectories
// Log creation of each subdirectory: architecture/, prps/, artifacts/
// First failure point in directory creation should be visible in logs

// GOTCHA: SessionManager.initialize() has two paths: new session vs existing session
// Existing session path (loadSession) also needs logging
# Don't only log the new session creation path

// GOTCHA: writeTasksJSON is only called when backlog is populated
# New sessions start with empty backlog - no tasks.json write
# Log this condition: "Skipping tasks.json write - backlog is empty"

// PATTERN: Log file operations with timing information
const startTime = performance.now();
await writeFile(path, content);
const duration = performance.now() - startTime;
this.#logger.debug({ path, size: content.length, duration }, 'File written');

// PATTERN: Log intent before operation, result after operation
this.#logger.debug({ path, operation: 'write' }, 'Writing file');
await writeFile(path, content);
this.#logger.debug({ path, result: 'success' }, 'Write complete');

// PATTERN: Use child logger for session-specific context
const sessionLogger = this.#logger.child({ sessionId: metadata.id });
sessionLogger.debug('Creating session directory');
// All sessionLogger calls include sessionId automatically
```

## Implementation Blueprint

### Data models and structure

No new data models needed - using existing:

- `SessionState` type from session-manager - contains session metadata
- `SessionFileError` class from session-utils - error with path, operation, code
- `Backlog` type from models - validated by Zod before write
- Existing Logger interface with `debug()` method

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD LOGGER to session-utils.ts functions
  - FILE: src/core/session-utils.ts
  - LOCATION: At top of file after imports (around line 31)
  - ADD: import { getLogger } from '../utils/logger.js';
  - ADD: const logger = getLogger('session-utils');
  - REASON: Standalone functions need logger instance for debug logging
  - PATTERN: Follow src/core/session-manager.ts line 26 (logger import)

Task 2: ADD debug logging to hashPRD function
  - FILE: src/core/session-utils.ts, lines 160-167
  - LOCATION: Before await readFile() - log intent
  - IMPLEMENT: logger.debug({ prdPath, operation: 'hashPRD' }, 'Reading PRD for hash computation')
  - LOCATION: After hash computation - log result
  - IMPLEMENT: logger.debug({ prdPath, hash: fullHash.slice(0, 12) }, 'PRD hash computed')
  - LOCATION: In catch block - log error
  - IMPLEMENT: logger.error({ prdPath, error: err?.code, operation: 'hashPRD' }, 'Failed to read PRD')
  - GOTCHA: fullHash is 64 chars, only log first 12 (session hash)

Task 3: ADD debug logging to createSessionDirectory function
  - FILE: src/core/session-utils.ts, lines 197-242
  - LOCATION: After hashPRD call - log hash result
  - IMPLEMENT: logger.debug({ prdPath, sessionHash, sequence }, 'Session hash computed')
  - LOCATION: Before mkdir loop - log directory creation intent
  - IMPLEMENT: logger.debug({ sessionId, sessionPath, directories: ['architecture', 'prps', 'artifacts'] }, 'Creating session directory structure')
  - LOCATION: In mkdir loop - log each subdirectory creation
  - IMPLEMENT: logger.debug({ dir, operation: 'mkdir' }, 'Creating subdirectory')
  - LOCATION: After successful completion - log result
  - IMPLEMENT: logger.info({ sessionId, sessionPath }, 'Session directory created')
  - LOCATION: In catch block - log error
  - IMPLEMENT: logger.error({ sessionId, sessionPath, error: err?.code, operation: 'createSessionDirectory' }, 'Failed to create session directory')
  - GOTCHA: EEXIST is not an error - log as debug, not error

Task 4: ADD debug logging to writeTasksJSON function
  - FILE: src/core/session-utils.ts, lines 266-290
  - LOCATION: At function entry - log intent
  - IMPLEMENT: logger.debug({ sessionPath, itemCount: backlog.backlog.length, operation: 'writeTasksJSON' }, 'Writing tasks.json')
  - LOCATION: After Zod validation - log validation success
  - IMPLEMENT: logger.debug({ sessionPath, validated: true, itemCount: backlog.backlog.length }, 'Backlog validated')
  - LOCATION: Before atomicWrite - log write operation
  - IMPLEMENT: logger.debug({ tasksPath, size: content.length, operation: 'atomicWrite' }, 'Writing tasks.json atomically')
  - LOCATION: After successful write - log result
  - IMPLEMENT: logger.info({ tasksPath, size: content.length }, 'tasks.json written successfully')
  - LOCATION: In catch block - log error
  - IMPLEMENT: logger.error({ tasksPath, error: err?.code, operation: 'writeTasksJSON' }, 'Failed to write tasks.json')
  - GOTCHA: SessionFileError already wraps errors - log error.code and error.path

Task 5: ADD debug logging to readTasksJSON function
  - FILE: src/core/session-utils.ts, lines 312-325
  - LOCATION: At function entry - log intent
  - IMPLEMENT: logger.debug({ sessionPath, operation: 'readTasksJSON' }, 'Reading tasks.json')
  - LOCATION: After successful read - log result
  - IMPLEMENT: logger.debug({ sessionPath, itemCount: parsed.backlog.length }, 'tasks.json read successfully')
  - LOCATION: In catch block - log error
  - IMPLEMENT: logger.error({ sessionPath, error: err?.code, operation: 'readTasksJSON' }, 'Failed to read tasks.json')

Task 6: ADD debug logging to snapshotPRD function
  - FILE: src/core/session-utils.ts, lines 475-504
  - LOCATION: At function entry - log intent
  - IMPLEMENT: logger.debug({ sessionPath, prdPath, operation: 'snapshotPRD' }, 'Creating PRD snapshot')
  - LOCATION: After readUTF8FileStrict - log read result
  - IMPLEMENT: logger.debug({ prdPath, size: content.length }, 'PRD content read for snapshot')
  - LOCATION: Before writeFile - log write operation
  - IMPLEMENT: logger.debug({ snapshotPath, size: content.length, mode: 0o644 }, 'Writing PRD snapshot')
  - LOCATION: After successful write - log result
  - IMPLEMENT: logger.info({ snapshotPath, size: content.length }, 'PRD snapshot created successfully')
  - LOCATION: In catch block - log error
  - IMPLEMENT: logger.error({ snapshotPath, error: err?.code, operation: 'snapshotPRD' }, 'Failed to create PRD snapshot')
  - GOTCHA: Re-throw SessionFileError without wrapping - log before re-throw

Task 7: ADD debug logging to loadSnapshot function
  - FILE: src/core/session-utils.ts, lines 523-530
  - LOCATION: At function entry - log intent
  - IMPLEMENT: logger.debug({ sessionPath, operation: 'loadSnapshot' }, 'Loading PRD snapshot')
  - LOCATION: After successful read - log result
  - IMPLEMENT: logger.debug({ sessionPath, size: (await content).length }, 'PRD snapshot loaded')
  - LOCATION: In catch block - log error
  - IMPLEMENT: logger.error({ sessionPath, error: err?.code, operation: 'loadSnapshot' }, 'Failed to load PRD snapshot')

Task 8: ADD debug logging to SessionManager.initialize() - PRD hash
  - FILE: src/core/session-manager.ts, lines 210-215
  - LOCATION: Before hashPRD call - log intent
  - IMPLEMENT: this.#logger.debug({ prdPath: this.prdPath, operation: 'initialize' }, '[SessionManager] Starting session initialization')
  - LOCATION: After hashPRD call - log result
  - IMPLEMENT: this.#logger.debug({ prdPath: this.prdPath, sessionHash, fullHashLength: fullHash.length }, '[SessionManager] PRD hash computed')
  - GOTCHA: Use this.#logger (private field) not logger (standalone)

Task 9: ADD debug logging to SessionManager.initialize() - PRD validation
  - FILE: src/core/session-manager.ts, lines 217-249
  - LOCATION: Before PRDValidator call - log validation start
  - IMPLEMENT: this.#logger.debug({ prdPath: this.prdPath, operation: 'validatePRD' }, '[SessionManager] Validating PRD structure')
  - LOCATION: After validation - log result
  - IMPLEMENT: If valid: this.#logger.debug({ valid: true, warnings: validationResult.summary.warning }, '[SessionManager] PRD validation passed')
  - IMPLEMENT: If invalid: this.#logger.error({ validationIssues: validationResult.issues }, '[SessionManager] PRD validation failed')
  - GOTCHA: Warning logging already exists (lines 239-246) - add debug before it

Task 10: ADD debug logging to SessionManager.initialize() - session discovery
  - FILE: src/core/session-manager.ts, lines 251-283
  - LOCATION: Before #findSessionByHash call - log search
  - IMPLEMENT: this.#logger.debug({ sessionHash, planDir: this.planDir, operation: 'findSession' }, '[SessionManager] Searching for existing session')
  - LOCATION: After #findSessionByHash - log result
  - IMPLEMENT: If found: this.#logger.debug({ existingSession, sessionHash }, '[SessionManager] Existing session found')
  - IMPLEMENT: If not found: this.#logger.debug({ sessionHash, result: 'not_found' }, '[SessionManager] No existing session found')
  - GOTCHA: Log the existingSession path for debugging

Task 11: ADD debug logging to SessionManager.initialize() - load existing session
  - FILE: src/core/session-manager.ts, lines 254-282
  - LOCATION: Before loadSession call - log load intent
  - IMPLEMENT: this.#logger.debug({ sessionPath: existingSession, operation: 'loadSession' }, '[SessionManager] Loading existing session')
  - LOCATION: After dependency validation - log result
  - IMPLEMENT: this.#logger.debug({ taskCount: this.#currentSession.taskRegistry.backlog.length }, '[SessionManager] Dependencies validated')
  - GOTCHA: Existing info log at line 278-281 - add debug before it

Task 12: ADD debug logging to SessionManager.initialize() - new session directory
  - FILE: src/core/session-manager.ts, lines 285-291
  - LOCATION: Before #getNextSequence call - log intent
  - IMPLEMENT: this.#logger.debug({ planDir: this.planDir, operation: 'getNextSequence' }, '[SessionManager] Determining session sequence')
  - LOCATION: After #getNextSequence - log result
  - IMPLEMENT: this.#logger.debug({ sequence, operation: 'getNextSequence' }, '[SessionManager] Sequence number determined')
  - LOCATION: Before createSessionDirectory call - log creation intent
  - IMPLEMENT: this.#logger.debug({ sequence, sessionHash, prdPath: this.prdPath, operation: 'createSessionDirectory' }, '[SessionManager] Creating session directory')
  - LOCATION: After createSessionDirectory - log result
  - IMPLEMENT: this.#logger.info({ sessionId, sessionPath }, '[SessionManager] Session directory created')

Task 13: ADD debug logging to SessionManager.initialize() - PRD snapshot write
  - FILE: src/core/session-manager.ts, lines 293-297
  - LOCATION: Before readFile call - log read intent
  - IMPLEMENT: this.#logger.debug({ prdPath: this.prdPath, operation: 'readPRD' }, '[SessionManager] Reading PRD for snapshot')
  - LOCATION: Before writeFile call - log write intent
  - IMPLEMENT: this.#logger.debug({ sessionPath, snapshotPath: resolve(sessionPath, 'prd_snapshot.md'), prdSize: prdContent.length, operation: 'writeSnapshot' }, '[SessionManager] Writing PRD snapshot')
  - LOCATION: After writeFile - log result
  - IMPLEMENT: this.#logger.info({ sessionId, snapshotPath: resolve(sessionPath, 'prd_snapshot.md'), size: prdContent.length }, '[SessionManager] PRD snapshot created')
  - GOTCHA: Add try-catch around writeFile for error logging

Task 14: ADD debug logging to SessionManager.initialize() - SessionState creation
  - FILE: src/core/session-manager.ts, lines 299-334
  - LOCATION: After SessionState creation - log result
  - IMPLEMENT: this.#logger.debug({ sessionId, sessionPath, backlogEmpty: true }, '[SessionManager] Session state created (empty backlog)')
  - LOCATION: After dependency validation - log result
  - IMPLEMENT: this.#logger.debug({ backlogSize: 0 }, '[SessionManager] Dependencies validated (empty backlog)')
  - LOCATION: Before return - log completion
  - IMPLEMENT: this.#logger.info({ sessionId, sessionPath, duration: Date.now() - initStartTime }, '[SessionManager] Session initialized successfully')
  - GOTCHA: Add initStartTime variable at beginning of initialize() for timing

Task 15: VERIFY all debug logs follow conventions
  - CHECK: All session-utils.ts logs use 'session-utils' context
  - CHECK: All SessionManager logs use '[SessionManager]' prefix
  - CHECK: All logs use structured context objects (no string interpolation)
  - CHECK: All context keys use camelCase and descriptive names
  - CHECK: Error logs include error.code property from SessionFileError
  - CHECK: Debug logs only appear when verbose: true is set
  - CHECK: Info logs appear regardless of verbose setting

Task 16: RUN existing tests to ensure no regressions
  - COMMAND: npm test -- tests/unit/core/session-manager.test.ts
  - EXPECTED: All existing tests pass (logging is additive, shouldn't break existing behavior)
  - COMMAND: npm test -- tests/unit/core/session-utils.test.ts
  - EXPECTED: All existing tests pass
  - VALIDATE: No new console output when verbose is disabled
  - VALIDATE: Tests still mock file system operations correctly

Task 17: MANUAL TESTING with verbose flag
  - COMMAND: npm run pipeline -- --prd PRD.md --verbose (or equivalent command)
  - EXPECTED: Debug logs appear in output when --verbose is set
  - VALIDATE: All 17 logging points emit debug logs
  - VALIDATE: Context objects are properly formatted in output
  - VALIDATE: Logs are readable and provide useful debugging information
  - VALIDATE: File operation failures are logged with error codes
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// Pattern 1: Function entry logging with operation context
// ============================================================================
// Location: At the start of each function in session-utils.ts
// Standalone functions use getLogger('session-utils')

logger.debug(
  {
    prdPath,
    operation: 'hashPRD'
  },
  'Reading PRD for hash computation'
);

// ============================================================================
// Pattern 2: Post-operation logging with result context
// ============================================================================
// Location: After successful operation completes

logger.debug(
  {
    prdPath,
    hash: fullHash.slice(0, 12),
    fullHashLength: fullHash.length
  },
  'PRD hash computed'
);

// ============================================================================
// Pattern 3: File operation logging with timing
// ============================================================================
// Location: Before and after file I/O operations

const readStart = performance.now();
const content = await readFile(prdPath, 'utf-8');
const readDuration = performance.now() - readStart;

logger.debug(
  {
    prdPath,
    size: content.length,
    duration: readDuration,
    operation: 'readFile'
  },
  'PRD file read successfully'
);

// ============================================================================
// Pattern 4: Error logging with full context
// ============================================================================
// Location: In catch blocks for file operations

catch (error) {
  const err = error as NodeJS.ErrnoException;
  logger.error(
    {
      path: prdPath,
      operation: 'hashPRD',
      errorCode: err?.code,
      errorMessage: err?.message,
      errorType: err?.constructor?.name
    },
    'Failed to read PRD'
  );
  throw new SessionFileError(prdPath, 'read PRD', error as Error);
}

// ============================================================================
// Pattern 5: SessionManager logging with private logger field
// ============================================================================
// Location: In SessionManager.initialize() method
// Uses this.#logger (private field initialized in constructor)

this.#logger.debug(
  {
    prdPath: this.prdPath,
    operation: 'initialize'
  },
  '[SessionManager] Starting session initialization'
);

// ============================================================================
// Pattern 6: Conditional logging for validation results
// ============================================================================
// Location: After PRD validation

if (!validationResult.valid) {
  this.#logger.error(
    {
      prdPath: this.prdPath,
      validationIssues: validationResult.issues,
      criticalIssue: criticalIssue?.message
    },
    '[SessionManager] PRD validation failed'
  );
  // ... throw error
}

if (validationResult.summary.warning > 0) {
  this.#logger.warn(
    {
      warnings: validationResult.summary.warning,
      issues: validationResult.issues.filter(i => i.severity === 'warning')
    },
    '[SessionManager] PRD validated with warnings'
  );
} else {
  this.#logger.info('[SessionManager] PRD validation passed');
}

// ============================================================================
// Pattern 7: Session state transition logging
// ============================================================================
// Location: When creating new session vs loading existing session

if (existingSession) {
  this.#logger.debug(
    {
      existingSession,
      sessionHash,
      operation: 'loadSession'
    },
    '[SessionManager] Existing session found - loading'
  );
  this.#currentSession = await this.loadSession(existingSession);
  // ...
} else {
  this.#logger.debug(
    {
      sessionHash,
      planDir: this.planDir,
      operation: 'createSession'
    },
    '[SessionManager] No existing session - creating new session'
  );
  // Create new session...
}

// ============================================================================
// Pattern 8: Timing information for performance debugging
// ============================================================================
// Location: Track overall session initialization duration

const initStartTime = Date.now();

// ... initialization steps ...

this.#logger.info(
  {
    sessionId,
    sessionPath,
    duration: Date.now() - initStartTime,
    backlogEmpty: true
  },
  '[SessionManager] Session initialized successfully'
);

// ============================================================================
// Pattern 9: Directory structure creation logging
// ============================================================================
// Location: In createSessionDirectory function

const directories = [
  sessionPath,
  join(sessionPath, 'architecture'),
  join(sessionPath, 'prps'),
  join(sessionPath, 'artifacts'),
];

logger.debug(
  {
    sessionId,
    sessionPath,
    directories: ['.', 'architecture', 'prps', 'artifacts'],
    operation: 'createDirectoryStructure'
  },
  'Creating session directory structure'
);

for (const dir of directories) {
  logger.debug({ dir, operation: 'mkdir' }, 'Creating subdirectory');
  try {
    await mkdir(dir, { recursive: true, mode: 0o755 });
    logger.debug({ dir, result: 'created' }, 'Subdirectory created');
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'EEXIST') {
      logger.error(
        {
          dir,
          errorCode: err.code,
          operation: 'mkdir'
        },
        'Failed to create subdirectory'
      );
      throw error;
    }
    logger.debug({ dir, result: 'exists' }, 'Subdirectory already exists');
  }
}

// ============================================================================
// Pattern 10: Atomic write operation logging
// ============================================================================
// Location: In atomicWrite helper function

async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  logger.debug(
    {
      targetPath,
      tempPath,
      size: data.length,
      operation: 'atomicWrite'
    },
    'Starting atomic write'
  );

  try {
    const writeStart = performance.now();
    await writeFile(tempPath, data, { mode: 0o644 });
    const writeDuration = performance.now() - writeStart;

    logger.debug(
      {
        tempPath,
        size: data.length,
        duration: writeDuration,
        operation: 'writeFile'
      },
      'Temp file written'
    );

    const renameStart = performance.now();
    await rename(tempPath, targetPath);
    const renameDuration = performance.now() - renameStart;

    logger.debug(
      {
        tempPath,
        targetPath,
        duration: renameDuration,
        operation: 'rename'
      },
      'Temp file renamed to target'
    );

    logger.info(
      {
        targetPath,
        size: data.length,
        totalDuration: writeDuration + renameDuration
      },
      'Atomic write completed successfully'
    );
  } catch (error) {
    logger.error(
      {
        targetPath,
        tempPath,
        errorCode: (error as NodeJS.ErrnoException)?.code,
        operation: 'atomicWrite'
      },
      'Atomic write failed'
    );

    // Clean up temp file on error
    try {
      await unlink(tempPath);
      logger.debug({ tempPath, operation: 'cleanup' }, 'Temp file cleaned up');
    } catch (cleanupError) {
      logger.warn(
        {
          tempPath,
          cleanupErrorCode: (cleanupError as NodeJS.ErrnoException)?.code
        },
        'Failed to clean up temp file'
      );
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}

// ============================================================================
// GOTCHA: EEXIST error handling in directory creation
// ============================================================================
// EEXIST is NOT an error for directory creation - it means directory already exists
// Log as debug, not error

try {
  await mkdir(dir, { recursive: true, mode: 0o755 });
  logger.debug({ dir, result: 'created' }, 'Subdirectory created');
} catch (error: unknown) {
  const err = error as NodeJS.ErrnoException;
  if (err.code !== 'EEXIST') {
    // This IS an error (EACCES, ENOSPC, etc.)
    logger.error(
      {
        dir,
        errorCode: err.code,
        operation: 'mkdir'
      },
      'Failed to create subdirectory'
    );
    throw error;
  }
  // EEXIST is expected - not an error
  logger.debug({ dir, result: 'exists' }, 'Subdirectory already exists');
}

// ============================================================================
// GOTCHA: SessionFileError already wraps errors
// ============================================================================
// Don't wrap SessionFileError again - log before re-throwing

export async function hashPRD(prdPath: string): Promise<string> {
  try {
    const content = await readFile(prdPath, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex');
    logger.debug({ prdPath, hash: hash.slice(0, 12) }, 'PRD hash computed');
    return hash;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    // Log before throwing SessionFileError
    logger.error(
      {
        prdPath,
        errorCode: err?.code,
        errorMessage: err?.message,
        operation: 'hashPRD'
      },
      'Failed to read PRD for hashing'
    );
    // SessionFileError wraps the original error
    throw new SessionFileError(prdPath, 'read PRD', error as Error);
  }
}

// ============================================================================
// GOTCHA: Zod validation errors should be logged with details
// ============================================================================
// When Zod validation fails, log the specific validation errors

export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  try {
    logger.debug(
      {
        sessionPath,
        itemCount: backlog.backlog.length,
        operation: 'writeTasksJSON'
      },
      'Writing tasks.json'
    );

    // Validate with Zod schema
    const validated = BacklogSchema.parse(backlog);
    logger.debug(
      {
        sessionPath,
        validated: true,
        itemCount: validated.backlog.length
      },
      'Backlog validated successfully'
    );

    // Serialize to JSON
    const content = JSON.stringify(validated, null, 2);

    // Write atomically
    const tasksPath = resolve(sessionPath, 'tasks.json');
    await atomicWrite(tasksPath, content);
  } catch (error) {
    if (error instanceof SessionFileError) {
      // Already logged by atomicWrite, just re-throw
      throw error;
    }
    // Zod validation error or other error
    logger.error(
      {
        sessionPath,
        errorCode: (error as Error)?.constructor?.name,
        errorMessage: (error as Error)?.message,
        operation: 'writeTasksJSON'
      },
      'Failed to write tasks.json'
    );
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'write tasks.json',
      error as Error
    );
  }
}
```

### Integration Points

```yaml
NO NEW INTEGRATIONS:
  - This task only adds logging to existing code
  - No new dependencies or imports needed (except getLogger in session-utils.ts)
  - No configuration changes needed
  - No database or API changes

EXISTING INTEGRATIONS USED:
  - Logger: src/utils/logger.ts (getLogger function)
  - Pino library: Already used in session-manager.ts
  - SessionFileError: Already used in session-utils.ts for error wrapping
  - Zod schema: Already used for backlog validation

SESSION-UTILS CHANGES:
  - Add: import { getLogger } from '../utils/logger.js';
  - Add: const logger = getLogger('session-utils');
  - Modify: hashPRD, createSessionDirectory, writeTasksJSON, readTasksJSON, snapshotPRD, loadSnapshot

SESSION-MANAGER CHANGES:
  - Modify: SessionManager.initialize() method (lines 210-336)
  - Add: 10+ debug log statements at key initialization points
  - Add: Timing information for initialization duration
  - Add: try-catch around PRD snapshot write for error logging

TEST INTEGRATION:
  - Tests will verify debug logs are emitted when verbose is true
  - Tests will verify no debug logs when verbose is false (default)
  - Next subtask (P2.M1.T1.S3) will add comprehensive test coverage and run E2E tests

PIPELINE INTEGRATION:
  - PRPPipeline calls SessionManager.initialize() (line 1617 in prp-pipeline.ts)
  - Debug logs from session initialization will appear between pipeline-level logs
  - Combined logging provides full trace from pipeline start to file creation
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npm run lint src/core/session-manager.ts
npm run lint src/core/session-utils.ts
# Expected: Zero linting errors

npm run type-check
# Expected: Zero type errors (verify getLogger import, logger usage)

# Format code to match project style
npm run format src/core/session-manager.ts
npm run format src/core/session-utils.ts

# Run all linting and formatting
npm run lint
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test SessionManager functionality (existing tests should still pass)
npm test -- tests/unit/core/session-manager.test.ts

# Test session-utils functionality (existing tests should still pass)
npm test -- tests/unit/core/session-utils.test.ts

# Expected: All existing tests pass (logging is additive, shouldn't break behavior)

# Run full core test suite
npm test -- tests/unit/core/

# Coverage validation (if coverage tools available)
npm test -- --coverage tests/unit/core/

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
# [SessionManager] Starting session initialization
#   level: "debug"
#   prdPath: "./PRD.md"
#   operation: "initialize"
# [session-utils] Reading PRD for hash computation
#   level: "debug"
#   prdPath: "./PRD.md"
#   operation: "hashPRD"
# [SessionManager] PRD hash computed
#   level: "debug"
#   sessionHash: "14b9dc2a33c7"
#   fullHashLength: 64
# [SessionManager] Validating PRD structure
#   level: "debug"
#   prdPath: "./PRD.md"
#   operation: "validatePRD"
# [SessionManager] PRD validation passed
#   level: "info"
#   valid: true
#   warnings: 0
# [SessionManager] Searching for existing session
#   level: "debug"
#   sessionHash: "14b9dc2a33c7"
#   planDir: "/path/to/plan"
#   operation: "findSession"
# [SessionManager] No existing session found
#   level: "debug"
#   sessionHash: "14b9dc2a33c7"
#   result: "not_found"
# [SessionManager] Creating session directory
#   level: "debug"
#   sequence: 1
#   sessionHash: "14b9dc2a33c7"
#   prdPath: "./PRD.md"
#   operation: "createSessionDirectory"
# [session-utils] Creating session directory structure
#   level: "debug"
#   sessionId: "001_14b9dc2a33c7"
#   sessionPath: "/path/to/plan/001_14b9dc2a33c7"
#   directories: [".", "architecture", "prps", "artifacts"]
#   operation: "createDirectoryStructure"
# [SessionManager] Session directory created
#   level: "info"
#   sessionId: "001_14b9dc2a33c7"
#   sessionPath: "/path/to/plan/001_14b9dc2a33c7"
# [SessionManager] Writing PRD snapshot
#   level: "debug"
#   sessionPath: "/path/to/plan/001_14b9dc2a33c7"
#   snapshotPath: "/path/to/plan/001_14b9dc2a33c7/prd_snapshot.md"
#   prdSize: 12345
#   operation: "writeSnapshot"
# [session-utils] Creating PRD snapshot
#   level: "debug"
#   sessionPath: "/path/to/plan/001_14b9dc2a33c7"
#   prdPath: "./PRD.md"
#   operation: "snapshotPRD"
# [SessionManager] PRD snapshot created
#   level: "info"
#   sessionId: "001_14b9dc2a33c7"
#   snapshotPath: "/path/to/plan/001_14b9dc2a33c7/prd_snapshot.md"
#   size: 12345
# [SessionManager] Session initialized successfully
#   level: "info"
#   sessionId: "001_14b9dc2a33c7"
#   sessionPath: "/path/to/plan/001_14b9dc2a33c7"
#   duration: 123
#   backlogEmpty: true

# Run pipeline WITHOUT verbose flag (default behavior)
npm run pipeline -- --prd PRD.md --no-cache

# Expected: NO debug logs in output, only info/warn/error logs
# Info logs like "Session directory created" should still appear
# Debug logs should NOT appear when verbose is false

# Test with failing PRD (to test error path logging)
npm run pipeline -- --prd /nonexistent.md --verbose

# Expected: Debug log in error path with error context
# [SessionManager] Failed to read PRD for hashing
#   level: "error"
#   prdPath: "/nonexistent.md"
#   errorCode: "ENOENT"
#   errorMessage: "No such file or directory"
#   operation: "hashPRD"

# Test with read-only directory (to test permission error logging)
mkdir -p /tmp/readonly-plan
chmod 444 /tmp/readonly-plan
npm run pipeline -- --prd PRD.md --plan /tmp/readonly-plan --verbose

# Expected: Debug log with EACCES error code
# [session-utils] Failed to create subdirectory
#   level: "error"
#   dir: "/tmp/readonly-plan/001_abc123"
#   errorCode: "EACCES"
#   operation: "mkdir"

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
# - Does PRD hash computation succeed? (check for "PRD hash computed" debug log)
# - Does session directory creation succeed? (check for "Session directory created" info log)
# - Does PRD snapshot write succeed? (check for "PRD snapshot created" info log)
# - If not, which file operation throws an error? (check error debug logs)
# - What is the error code? (ENOENT, EACCES, ENOSPC, etc.)

# Capture full output for analysis
npm test -- tests/e2e/pipeline.test.ts 2>&1 | tee e2e-session-debug-output.log

# Analyze output to identify failure point
# Look for the LAST successful debug log before error
# Look for error context in error debug log
# Check if sessionPath is logged (session directory creation succeeded)
# Check if snapshotPath is logged (PRD snapshot write succeeded)
# Check if tasks.json write was attempted (only if backlog exists)

# Verify files exist after test run
SESSION_PATH=$(grep "sessionPath" e2e-session-debug-output.log | head -1 | jq -r '.sessionPath')
ls -la "$SESSION_PATH"
# Expected: Should see prd_snapshot.md, architecture/, prps/, artifacts/
# If prd_snapshot.md is missing: check for snapshot error in logs
# If directory doesn't exist: check for mkdir error in logs

# Expected: E2E test output shows detailed failure information
# Next subtask (P2.M1.T1.S3) will analyze this output to identify root cause
```

## Final Validation Checklist

### Technical Validation

- [ ] All 17 implementation tasks completed successfully
- [ ] All 17 logging points implemented (SessionManager + session-utils)
- [ ] All tests pass: `npm test -- tests/unit/core/session-manager.test.ts`
- [ ] All tests pass: `npm test -- tests/unit/core/session-utils.test.ts`
- [ ] No linting errors: `npm run lint src/core/session-manager.ts`
- [ ] No linting errors: `npm run lint src/core/session-utils.ts`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format src/core/ --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Debug logs appear when `verbose: true` is set
- [ ] Debug logs do NOT appear when verbose is disabled (default)
- [ ] All logs use `[SessionManager]` or `session-utils` identifier
- [ ] All logs use structured context objects (not string interpolation)
- [ ] Context objects include relevant identifiers (paths, hashes, sizes, durations)
- [ ] Error paths include error context (error code, path, operation type)
- [ ] File operations log both intent (before) and result (after)
- [ ] No sensitive data logged (API keys, tokens, passwords)

### Code Quality Validation

- [ ] Follows existing codebase patterns (referenced in Context section)
- [ ] SessionManager uses this.#logger.debug() consistently
- [ ] session-utils uses getLogger('session-utils') consistently
- [ ] No string interpolation in log messages (all context in objects)
- [ ] Safe property access with optional chaining (?.) and nullish coalescing (??)
- [ ] Error type checking before accessing Error properties
- [ ] EEXIST errors logged as debug, not error
- [ ] No performance impact when verbose mode is disabled
- [ ] Logs provide useful debugging information (not redundant or verbose)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Debug logs are meaningful and actionable for debugging
- [ ] Context keys use descriptive names (prdPath, sessionPath, sessionHash, etc.)
- [ ] No changes to environment variables or configuration
- [ ] No changes to gitignore or build scripts
- [ ] Logger import added to session-utils.ts

### E2E Pipeline Validation

- [ ] E2E tests run with `--verbose` flag show detailed debug output
- [ ] Debug logs identify which step is failing (hash computation, directory creation, file write)
- [ ] Session path is logged (can verify session directory was created)
- [ ] Error context includes error type, message, path, and operation
- [ ] Debug output provides enough information to identify root cause of PRD Issue 3
- [ ] File operation failures are logged with specific error codes (ENOENT, EACCES, ENOSPC)
- [ ] Timing information helps identify slow operations
- [ ] Combined with P2.M1.T1.S1 pipeline logs, full trace is available

---

## Anti-Patterns to Avoid

- ❌ Don't use string interpolation for log data - use structured context objects instead
  - Bad: `logger.debug(\`Hashing PRD: ${prdPath}\`)`
  - Good: `logger.debug({ prdPath, operation: 'hashPRD' }, 'Reading PRD for hash computation')`

- ❌ Don't forget the `[SessionManager]` prefix - it's critical for log filtering
  - Bad: `this.#logger.debug('Starting initialization')`
  - Good: `this.#logger.debug({ prdPath: this.prdPath }, '[SessionManager] Starting session initialization')`

- ❌ Don't log sensitive data - Pino redacts common patterns but be careful
  - Bad: `logger.debug({ prdContent: content }, 'PRD read')` (logs entire PRD)
  - Good: `logger.debug({ prdPath, size: content.length }, 'PRD read')` (logs size only)

- ❌ Don't log the entire hash (64 chars) - log only the session hash (12 chars)
  - Bad: `logger.debug({ hash: fullHash }, 'Hash computed')` (64 chars is too long)
  - Good: `logger.debug({ sessionHash: fullHash.slice(0, 12) }, 'PRD hash computed')` (12 chars)

- ❌ Don't log EEXIST as an error - it's expected when directory exists
  - Bad: `logger.error({ dir, code: 'EEXIST' }, 'Directory creation failed')`
  - Good: `logger.debug({ dir, result: 'exists' }, 'Subdirectory already exists')`

- ❌ Don't skip logging in atomicWrite helper - temp file and rename are critical
  - Bad: Only log the final success/failure
  - Good: Log temp file creation, rename operation, and cleanup separately

- ❌ Don't log without operation context - include what operation is being performed
  - Bad: `logger.debug({ path: '/path/to/file' }, 'Operation started')`
  - Good: `logger.debug({ path: '/path/to/file', operation: 'writeFile' }, 'Writing file')`

- ❌ Don't forget to log Zod validation errors - they're critical for debugging
  - Bad: Catch Zod error and throw generic SessionFileError
  - Good: Log Zod error details before wrapping in SessionFileError

- ❌ Don't use inconsistent logger naming - use 'session-utils' for session-utils.ts
  - Bad: `const logger = getLogger('session-utils-file-operations')` (too specific)
  - Good: `const logger = getLogger('session-utils')` (matches file name)

- ❌ Don't log after throwing error - log before throwing
  - Bad: `throw new SessionFileError(...); logger.error('Failed');` (never reached)
  - Good: `logger.error('Failed'); throw new SessionFileError(...);` (logged before throw)

- ❌ Don't forget to log both success and failure paths
  - Bad: Only log errors, not successful operations
  - Good: Log successful operations (info/debug) and failed operations (error)

- ❌ Don't add debug logging that slows down file operations when verbose is disabled
  - Bad: Expensive computations in debug() call arguments
  - Good: Pino evaluates level before serialization - disabled levels have zero cost

- ❌ Don't duplicate existing info logs - debug should add detail, not replace
  - Bad: Remove existing info logs like "Session loaded"
  - Good: Add debug logs before existing info logs for verbose debugging

- ❌ Don't log at every line - be strategic about logging points
  - Bad: Debug log before and after every function call
  - Good: Debug log at major operation boundaries (hash, validate, create, write)

- ❌ Don't break existing tests - logging is additive
  - Bad: Modify test expectations to require debug logs
  - Good: Existing tests should pass without modification (next subtask adds new tests)

- ❌ Don't forget to test both verbose enabled and disabled scenarios
  - Bad: Only test with verbose=true
  - Good: Test that debug logs disappear when verbose=false (default)

- ❌ Don't log empty backlog as an error - it's expected for new sessions
  - Bad: `logger.error('Backlog is empty')`
  - Good: `logger.debug({ backlogEmpty: true }, 'Session state created (empty backlog)')`
