# Product Requirement Prompt (PRP): Improve batch write failure recovery

**PRP ID**: P3.M2.T2.S2
**Work Item Title**: Improve batch write failure recovery
**Generated**: 2026-01-24
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Add automatic retry mechanism to `SessionManager.flushUpdates()` for handling transient file I/O failures during batch write operations, with exponential backoff, error classification, and fallback preservation to recovery file when all retries are exhausted.

**Deliverable**:

1. Enhanced `SessionManager.flushUpdates()` method with automatic retry loop
2. File I/O error classification for retryable vs non-retryable errors
3. Recovery file preservation (`tasks.json.failed`) when all retries fail
4. `--flush-retries <n>` CLI option with validation (0-10, default: 3)
5. `tests/unit/core/flush-retry.test.ts` - Unit tests for flush retry scenarios

**Success Definition**:

- `flushUpdates()` automatically retries on transient file I/O errors (EBUSY, EAGAIN, EIO, ENFILE)
- Retry attempts use exponential backoff with jitter (100ms base, 2s max, factor 2)
- Each retry attempt is logged with attempt number, delay, and error context
- Non-retryable errors (ENOSPC, ENOENT, EACCES) fail fast with recovery file
- After all retries exhausted, pending updates preserved to `{sessionPath}/tasks.json.failed`
- CLI option `--flush-retries` accepts values 0-10 with validation
- All unit tests pass with vitest

---

## User Persona

**Target User**: Backend developer implementing reliability improvements for the PRP Pipeline session state management.

**Use Case**: When batch write operations fail due to transient file system issues (e.g., file locked, temporary I/O error), the system should automatically retry with exponential backoff before failing. If all retries fail, pending updates should be preserved to a recovery file for manual recovery.

**User Journey**:

1. Pipeline executes multiple status updates batched in memory
2. `flushUpdates()` called to persist batched changes
3. First write attempt fails with EBUSY (file locked)
4. System waits with exponential backoff (100ms)
5. Second retry attempt fails with EIO (transient disk issue)
6. System waits with exponential backoff (200ms)
7. Third retry succeeds - batch written atomically
8. OR: All retries fail - pending updates saved to `tasks.json.failed`
9. Developer can manually recover from recovery file if needed

**Pain Points Addressed**:

- **No automatic retry**: Current implementation requires manual retry on flush failure
- **Lost pending updates**: If process crashes after flush failure, in-memory updates are lost
- **No recovery mechanism**: No way to recover pending updates when all retries fail
- **Poor observability**: No logging of retry attempts or error context
- **No configurability**: Retry behavior cannot be configured via CLI

---

## Why

- **Current limitation**: From `system_context.md` lines 445-448 - "Batching state corruption risk: if flushUpdates() fails, retry required but no automatic retry mechanism. Pending updates preserved on error."
- **Transient file system errors**: EBUSY (file locked), EAGAIN (temporarily unavailable), EIO (transient disk issue) are common in production
- **Data loss prevention**: Preserving pending updates to recovery file prevents data loss on unrecoverable failures
- **Operational visibility**: Logging retry attempts helps diagnose file system issues
- **Configurability**: Different environments may need different retry strategies (CI/CD vs local dev)

---

## What

Implement automatic retry mechanism for batch write operations with the following behavior:

### Success Criteria

- [ ] `SessionManager.flushUpdates()` retries up to configured limit (default: 3)
- [ ] Retry attempts use exponential backoff with jitter (100ms base, 2s max, factor 2)
- [ ] Each retry attempt logged with attempt number, delay, error code, and error message
- [ ] Retryable errors: EBUSY, EAGAIN, EIO, ENFILE
- [ ] Non-retryable errors fail fast: ENOSPC, ENOENT, EACCES, EMFILE
- [ ] After all retries exhausted, pending updates preserved to `tasks.json.failed`
- [ ] Recovery file contains: timestamp, session path, pending updates, error details
- [ ] `--flush-retries <n>` CLI option accepts 0-10 with validation
- [ ] Unit tests cover: retry success, retry exhaustion, non-retryable errors, recovery file creation
- [ ] All tests pass with `vitest run`

---

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:

- Complete analysis of current `SessionManager.flushUpdates()` implementation
- Existing retry infrastructure in `src/utils/retry.ts`
- Atomic write pattern from `src/core/session-utils.ts`
- File I/O error classification from external research
- CLI option patterns from existing retry configuration
- Test patterns from existing test files
- Specific file paths, class names, and method signatures

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Current Implementation (MODIFY THIS FILE)
- file: src/core/session-manager.ts
  why: Target file for flush retry implementation
  pattern:
    - flushUpdates() method (lines 670-720) - current implementation
    - Batching state fields (lines 109-116): #dirty, #pendingUpdates, #updateCount
    - saveBacklog() method (lines 636-646) - delegates to writeTasksJSON()
  gotcha:
    - Pending updates ARE preserved on error (#dirty remains true)
    - Must add retry loop around saveBacklog() call
    - Must preserve error context for recovery file

# Atomic Write Pattern (CRITICAL - REUSE)
- file: src/core/session-utils.ts
  why: Atomic write implementation used by writeTasksJSON()
  pattern:
    - atomicWrite() function (lines 98-180)
    - Temp file + rename pattern for POSIX atomicity
    - SessionFileError with path, operation, code fields
  gotcha:
    - atomicWrite() already has temp file cleanup on error
    - Retry logic goes in flushUpdates(), not atomicWrite()
    - Don't modify atomicWrite() - it's a low-level utility

# Retry Infrastructure (REUSE)
- file: src/utils/retry.ts
  why: Existing retry utilities to reuse
  pattern:
    - calculateDelay() (lines 246-268) - exponential backoff with jitter
    - isTransientError() (lines 323-346) - error classification reference
    - retry() function (lines 495-549) - generic retry wrapper
  gotcha:
    - File I/O retry is 10x faster than network (100ms vs 1000ms base)
    - Use calculateDelay() directly instead of retry() wrapper
    - Need file-specific error classification (isFileIORetryableError)

# SessionManager Constructor (MODIFY)
- file: src/core/session-manager.ts
  why: Add flushRetries parameter
  pattern:
    - Constructor (lines 125-149) - add flushRetries parameter
    - Private field declarations (lines 94-116) - add #flushRetries field
  gotcha:
    - flushRetries passed from CLI through PRPPipeline
    - Default value: 3 (same as task retry)

# CLI Options (MODIFY)
- file: src/cli/index.ts
  why: Add --flush-retries CLI option
  pattern:
    - CLIArgs interface (lines 107-113) - add flushRetries field
    - ValidatedCLIArgs interface (lines 134-141) - add flushRetries field
    - Commander options (around line 240) - add .option() call
    - Validation (lines 476-502) - add range validation (0-10)
  gotcha:
    - Follow exact pattern from --task-retry option
    - Environment variable: HACKY_FLUSH_RETRIES
    - Validation: parseInt with isNaN and range check

# PRPPipeline Integration (MODIFY)
- file: src/workflows/prp-pipeline.ts
  why: Pass flushRetries from CLI to SessionManager
  pattern:
    - Constructor (lines 250-290) - add flushRetries parameter
    - Private field (around line 240) - add #flushRetries field
    - Pass to SessionManager initialization
  gotcha:
    - SessionManager created in initializeSession() method
    - Use same pattern as existing taskRetry parameter

# Test Patterns (FOLLOW)
- file: tests/unit/core/session-state-batching.test.ts
  why: Reference for testing SessionManager batch operations
  pattern:
    - Mock writeTasksJSON with vi.mocked()
    - Test state preservation on failure
    - Use vi.useFakeTimers() for timing tests
  gotcha:
    - Mock SessionFileError, not generic Error
    - Verify state fields: dirty, updateCount, pendingUpdates

- file: tests/unit/utils/retry.test.ts
  why: Reference for testing retry logic
  pattern:
    - Track delays with setTimeout spy
    - Test exponential backoff calculations
    - Test max attempts enforcement
  gotcha:
    - Use vi.spyOn(global, 'setTimeout') for delay tracking

# System Context Limitation (SOURCE OF REQUIREMENT)
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Original requirement source
  section: "Limitations & Pain Points" -> "State Management Problems"
  lines: 445-448
  quote: "Batching state corruption risk: If flushUpdates() fails, retry is required but no automatic retry mechanism. Pending updates preserved on error."

# Related Work (PARALLEL IMPLEMENTATION)
- docfile: plan/003_b3d3efdaf0ed/P3M2T2S1/PRP.md
  why: Checkpoint mechanism being built in parallel
  section: "Goal", "Data Models and Structure"
  note: CheckpointManager saves PRP execution state, flush retry protects session state - complementary reliability features
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── core/
│   │   ├── session-manager.ts       # PRIMARY MODIFICATION TARGET
│   │   │   # Lines 109-116: Batching state fields
│   │   │   # Lines 670-720: flushUpdates() - ADD RETRY LOOP
│   │   ├── session-utils.ts         # REFERENCE: Atomic write pattern
│   │   │   # Lines 98-180: atomicWrite() function
│   │   └── models.ts                # REFERENCE: Type definitions
│   ├── utils/
│   │   └── retry.ts                 # REFERENCE: Retry utilities
│   │       # Lines 246-268: calculateDelay()
│   │       # Lines 323-410: isTransientError()
│   ├── workflows/
│   │   └── prp-pipeline.ts          # MODIFY: Add flushRetries parameter
│   │       # Lines 250-290: Constructor
│   │       # Lines 480-520: SessionManager initialization
│   └── cli/
│       └── index.ts                 # MODIFY: Add --flush-retries option
│           # Lines 107-141: CLI interfaces
│           # Lines 230-250: CLI options
│           # Lines 476-520: Validation
├── tests/
│   └── unit/
│       ├── core/
│       │   ├── session-manager.test.ts    # REFERENCE: SessionManager tests
│       │   └── session-state-batching.test.ts  # REFERENCE: Batching tests
│       └── utils/
│           └── retry.test.ts             # REFERENCE: Retry tests
└── plan/
    └── 003_b3d3efdaf0ed/
        ├── docs/
        │   └── system_context.md          # SOURCE OF REQUIREMENT
        └── P3M2T2S2/
            ├── PRP.md                     # THIS FILE
            └── research/
                ├── codebase-analysis-summary.md
                └── external-retry-best-practices.md
```

### Desired Codebase Tree with Files to be Added and Modified

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── core/
│   │   └── session-manager.ts       # MODIFIED: Add flush retry
│   │       # ADD: #flushRetries private field
│   │       # ADD: #flushRetryConfig constant
│   │       # ADD: #calculateFlushRetryDelay() method
│   │       # ADD: #preservePendingUpdates() method
│   │       # MODIFY: flushUpdates() with retry loop
│   │       # MODIFY: Constructor with flushRetries parameter
│   ├── utils/
│   │   └── retry.ts                 # REFERENCE: Reuse calculateDelay()
│   ├── workflows/
│   │   └── prp-pipeline.ts          # MODIFIED: Pass flushRetries
│   │       # ADD: #flushRetries private field
│   │       # MODIFY: Constructor with flushRetries parameter
│   │       # MODIFY: initializeSession() to pass flushRetries
│   └── cli/
│       └── index.ts                 # MODIFIED: Add CLI option
│           # ADD: flushRetries to CLIArgs interface
│           # ADD: flushRetries to ValidatedCLIArgs interface
│           # ADD: --flush-retries option to Commander config
│           # ADD: Validation for flushRetries (0-10)
├── tests/
│   └── unit/
│       └── core/
│           └── flush-retry.test.ts  # NEW: Flush retry tests
│           # Test: retry on transient errors (EBUSY, EAGAIN)
│           # Test: fail fast on non-retryable errors (ENOSPC)
│           # Test: exponential backoff delays
│           # Test: recovery file creation on exhaustion
│           # Test: logging of retry attempts
│           # Test: --flush-retries CLI option
└── plan/
    └── 003_b3d3efdaf0ed/
        └── P3M2T2S2/
            └── PRP.md               # THIS FILE
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Pending updates ARE already preserved on error
// File: src/core/session-manager.ts, flushUpdates() (lines 670-720)
// Current implementation preserves #dirty and #pendingUpdates on error
// Just need to add retry loop around saveBacklog() call

// GOTCHA: File I/O retry is 10x faster than network retry
// Base delay: 100ms (vs 1000ms for network)
// Max delay: 2000ms (vs 30000ms for network)
// Reason: Local disk operations are much faster than network calls

// CRITICAL: Not all file errors are retryable
// Retryable: EBUSY (file locked), EAGAIN (temporarily unavailable), EIO (transient I/O), ENFILE (file table full)
// Non-retryable: ENOSPC (disk full), ENOENT (file not found), EACCES (permission denied), EMFILE (process limit)
// Must classify error before retrying

// GOTCHA: Use existing calculateDelay() from src/utils/retry.ts
// Don't duplicate the exponential backoff logic
// Just pass file-specific config values (100ms base, 2s max)

// CRITICAL: Recovery file is last resort
// Only create after ALL retries exhausted
// Or when error is non-retryable (fail fast with preservation)
// Location: {sessionPath}/tasks.json.failed

// GOTCHA: SessionManager constructor receives flushRetries from PRPPipeline
// PRPPipeline receives flushRetries from CLI
// Flow: CLI -> PRPPipeline -> SessionManager

// CRITICAL: Follow exact CLI option pattern from --task-retry
// File: src/cli/index.ts (lines 230-246)
// Include environment variable: HACKY_FLUSH_RETRIES
// Validate range: 0-10 (same as task-retry)

// GOTCHA: Use vi.useFakeTimers() for timing tests
// File: tests/unit/utils/retry.test.ts
// Spy on setTimeout to track delays
// Use vi.runAllTimersAsync() to execute delays

// CRITICAL: Don't modify atomicWrite() function
// It's a low-level utility used by other code
// Retry logic goes in flushUpdates() which calls saveBacklog() -> writeTasksJSON() -> atomicWrite()

// GOTCHA: Recovery file should contain full context
// Include: timestamp, session path, pending updates, error details
// Format: JSON with version field for future migration

// CRITICAL: Log each retry attempt with structured logging
// Include: attempt number, max attempts, delay, error code, error message, pending count
// Use warn level for retries, error level for final failure
```

---

## Implementation Blueprint

### Data Models and Structure

**1. File I/O Retry Configuration**

```typescript
// File: src/core/session-manager.ts

/**
 * File I/O retry configuration
 *
 * File operations are 10x faster than network operations.
 * Use shorter delays for retry.
 */
const FILE_IO_RETRY_CONFIG = {
  /** Maximum retry attempts */
  maxAttempts: 3,

  /** Base delay before first retry (milliseconds) */
  baseDelay: 100,

  /** Maximum delay between retries (milliseconds) */
  maxDelay: 2000,

  /** Exponential backoff factor */
  backoffFactor: 2,

  /** Jitter factor (10% variance) */
  jitterFactor: 0.1,
} as const;
```

**2. Recovery File Structure**

```typescript
// File: src/core/session-manager.ts

/**
 * Recovery file data structure
 *
 * Saved when all flush retries fail. Contains pending updates
 * and error context for manual recovery.
 */
interface RecoveryFile {
  /** Format version for migration */
  version: '1.0';

  /** ISO 8601 timestamp when recovery file was created */
  timestamp: string;

  /** Session directory path */
  sessionPath: string;

  /** Pending updates that failed to flush */
  pendingUpdates: Backlog;

  /** Error details */
  error: {
    /** Error message */
    message: string;

    /** Node.js errno code (if available) */
    code?: string;

    /** Number of retry attempts made */
    attempts: number;
  };

  /** Number of pending updates in backlog */
  pendingCount: number;
}
```

**3. File I/O Error Classification**

```typescript
// File: src/core/session-manager.ts

/**
 * Check if an error is retryable for file I/O operations
 *
 * Retryable errors are transient file system issues that may
 * resolve on retry (file locked, temporary unavailable).
 *
 * @param error - Error to classify
 * @returns true if error is retryable, false otherwise
 */
function isFileIORetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = (error as NodeJS.ErrnoException).code;

  // Retryable: transient file system errors
  const retryableCodes = ['EBUSY', 'EAGAIN', 'EIO', 'ENFILE'];

  return code !== undefined && retryableCodes.includes(code);
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/core/session-manager.ts - Add flushRetries field and helper methods
  DEPENDENCIES: None (first task)
  ADD:
    - readonly #flushRetries: number field (after line 116)
    - readonly #flushRetryConfig constant (FILE_IO_RETRY_CONFIG)
    - #calculateFlushRetryDelay(attempt: number): number method
    - #isFileIORetryableError(error: unknown): boolean function
    - #preservePendingUpdates(error: Error): Promise<void> method
    - #sleep(ms: number): Promise<void> helper
  MODIFY:
    - Constructor to accept flushRetries: number parameter
  NAMING: camelCase for private methods, PascalCase for constants
  PLACEMENT: src/core/session-manager.ts

Task 2: MODIFY src/core/session-manager.ts - Enhance flushUpdates() with retry loop
  DEPENDENCIES: Task 1 (helper methods must exist)
  MODIFY:
    - flushUpdates() method (lines 670-720)
    - Wrap saveBacklog() call in retry loop
    - Add error classification before retry
    - Add exponential backoff delay between retries
    - Call #preservePendingUpdates() on final failure
    - Log each retry attempt with context
  PRESERVE:
    - Existing batching state (#dirty, #pendingUpdates, #updateCount)
    - Existing success logging and state reset
    - Error re-throw after all retries exhausted
  PLACEMENT: src/core/session-manager.ts (lines 670-720)

Task 3: MODIFY src/cli/index.ts - Add --flush-retries CLI option
  DEPENDENCIES: None (can be done in parallel with Task 1)
  ADD:
    - flushRetries?: number | string to CLIArgs interface (after line 110)
    - flushRetries?: number to ValidatedCLIArgs interface (after line 137)
    - .option() call for --flush-retries (after line 236)
    - Validation logic (after line 500)
  PATTERN:
    - Follow exact pattern from --task-retry option
    - Environment variable: process.env.HACKY_FLUSH_RETRIES ?? '3'
    - Validation: parseInt, isNaN check, range 0-10
  PLACEMENT: src/cli/index.ts

Task 4: MODIFY src/workflows/prp-pipeline.ts - Pass flushRetries to SessionManager
  DEPENDENCIES: Task 3 (CLI option must exist)
  ADD:
    - readonly #flushRetries?: number private field
    - flushRetries?: number parameter to constructor
    - Pass flushRetries to SessionManager initialization
  PATTERN:
    - Follow exact pattern from taskRetry parameter
    - Pass in initializeSession() method where SessionManager is created
  PLACEMENT: src/workflows/prp-pipeline.ts

Task 5: CREATE tests/unit/core/flush-retry.test.ts - Unit tests
  DEPENDENCIES: Tasks 1-4 (implementation must be complete)
  IMPLEMENT:
    - should retry on EBUSY error (file locked)
    - should retry on EAGAIN error (temporarily unavailable)
    - should retry on EIO error (transient I/O)
    - should not retry on ENOSPC error (disk full - fail fast)
    - should not retry on ENOENT error (file not found - fail fast)
    - should not retry on EACCES error (permission denied - fail fast)
    - should use exponential backoff between retries
    - should preserve to recovery file after all retries fail
    - should log each retry attempt with context
    - should respect --flush-retries CLI option
    - should allow 0 retries (disable retry)
  MOCK:
    - vi.mock('node:fs/promises') for file operations
    - Mock saveBacklog() method
    - Use vi.useFakeTimers() for timing tests
    - Spy on setTimeout for delay verification
  FOLLOW pattern: tests/unit/core/session-state-batching.test.ts
  PLACEMENT: tests/unit/core/flush-retry.test.ts

Task 6: MODIFY tests/integration/cli-options.test.ts - Add CLI integration test
  DEPENDENCIES: Task 3 (CLI option must exist)
  ADD:
    - Test --flush-retries with valid values
    - Test --flush-retries validation (reject -1, 11, NaN)
    - Test HACKY_FLUSH_RETRIES environment variable
  PATTERN:
    - Follow existing CLI option tests
    - Mock process.argv and process.env
  PLACEMENT: tests/integration/cli-options.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ================================================================
// PATTERN 1: SessionManager Constructor with flushRetries
// ================================================================
// File: src/core/session-manager.ts (modify lines 125-149)

export class SessionManager {
  readonly #logger: Logger;
  readonly prdPath: string;
  readonly planDir: string;
  readonly #flushRetries: number;  // ADD THIS

  // ... existing fields ...

  constructor(
    prdPath: string,
    planDir: string = resolve('plan'),
    flushRetries: number = 3  // ADD THIS PARAMETER
  ) {
    this.#logger = getLogger('SessionManager');
    // ... existing validation ...
    this.prdPath = absPath;
    this.planDir = resolve(planDir);
    this.#flushRetries = flushRetries;  // ADD THIS ASSIGNMENT
    // ... rest of constructor ...
  }
}

// ================================================================
// PATTERN 2: Helper Methods for Retry Logic
// ================================================================
// File: src/core/session-manager.ts (add after line 1171)

/**
 * Calculate delay for flush retry with exponential backoff
 *
 * @param attempt - Retry attempt number (1-indexed)
 * @returns Delay in milliseconds
 */
#calculateFlushRetryDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    FILE_IO_RETRY_CONFIG.baseDelay *
      Math.pow(FILE_IO_RETRY_CONFIG.backoffFactor, attempt - 1),
    FILE_IO_RETRY_CONFIG.maxDelay
  );
  const jitter =
    exponentialDelay *
    FILE_IO_RETRY_CONFIG.jitterFactor *
    Math.random();
  return Math.max(1, Math.floor(exponentialDelay + jitter));
}

/**
 * Check if error is retryable for file I/O operations
 *
 * @param error - Error to classify
 * @returns true if retryable, false otherwise
 */
#isFileIORetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const code = (error as NodeJS.ErrnoException).code;
  const retryableCodes = ['EBUSY', 'EAGAIN', 'EIO', 'ENFILE'];
  return code !== undefined && retryableCodes.includes(code);
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
#sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Preserve pending updates to recovery file
 *
 * Called when all flush retries fail or error is non-retryable.
 *
 * @param error - Error that caused failure
 */
async #preservePendingUpdates(error: Error): Promise<void> {
  if (!this.#currentSession) {
    throw new Error('Cannot preserve pending updates: no session loaded');
  }

  const recoveryPath = resolve(
    this.#currentSession.metadata.path,
    'tasks.json.failed'
  );

  const recoveryData: RecoveryFile = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    sessionPath: this.#currentSession.metadata.path,
    pendingUpdates: this.#pendingUpdates!,
    error: {
      message: error.message,
      code: (error as NodeJS.ErrnoException).code,
      attempts: this.#flushRetries,
    },
    pendingCount: this.#updateCount,
  };

  try {
    await writeFile(recoveryPath, JSON.stringify(recoveryData, null, 2), {
      mode: 0o644,
    });

    this.#logger.error(
      {
        recoveryPath,
        pendingCount: this.#updateCount,
        errorCode: (error as NodeJS.ErrnoException).code,
        attempts: this.#flushRetries,
      },
      'All flush retries failed - pending updates preserved to recovery file'
    );
  } catch (writeError) {
    this.#logger.error(
      {
        recoveryPath,
        writeErrorCode: (writeError as NodeJS.ErrnoException).code,
        originalError: error.message,
      },
      'Failed to write recovery file - pending updates lost'
    );
    // Don't throw - original error is more important
  }
}

// ================================================================
// PATTERN 3: Enhanced flushUpdates() with Retry Loop
// ================================================================
// File: src/core/session-manager.ts (replace lines 670-720)

/**
 * Flushes accumulated batch updates to disk with automatic retry
 *
 * Retries on transient file I/O errors with exponential backoff.
 * Preserves pending updates to recovery file if all retries fail.
 *
 * @throws {SessionFileError} If write fails after all retries
 * @throws {Error} If no session is loaded
 */
async flushUpdates(): Promise<void> {
  // Early return if no pending changes
  if (!this.#dirty) {
    this.#logger.debug('No pending updates to flush');
    return;
  }

  if (!this.#pendingUpdates) {
    this.#logger.warn(
      'Dirty flag set but no pending updates - skipping flush'
    );
    this.#dirty = false;
    return;
  }

  if (!this.#currentSession) {
    throw new Error('Cannot flush updates: no session loaded');
  }

  let attempt = 0;
  const maxAttempts = this.#flushRetries;
  let lastError: Error | null = null;

  while (attempt < maxAttempts) {
    try {
      // Attempt to persist accumulated updates
      await this.saveBacklog(this.#pendingUpdates);

      // Calculate stats for logging
      const itemsWritten = this.#updateCount;
      const writeOpsSaved = Math.max(0, itemsWritten - 1);

      // Log batch write completion
      this.#logger.info(
        {
          itemsWritten,
          writeOpsSaved,
          efficiency:
            itemsWritten > 0
              ? `${((writeOpsSaved / itemsWritten) * 100).toFixed(1)}%`
              : '0%',
          attempts: attempt + 1,
        },
        'Batch write complete'
      );

      // Reset batching state
      this.#dirty = false;
      this.#pendingUpdates = null;
      this.#updateCount = 0;

      this.#logger.debug('Batching state reset');
      return; // Success - exit retry loop

    } catch (error) {
      lastError = error as Error;
      attempt++;

      // Check if we've exhausted all retries
      if (attempt >= maxAttempts) {
        // All retries failed - preserve to recovery file
        await this.#preservePendingUpdates(lastError);
        throw lastError;
      }

      // Check if error is retryable
      if (!this.#isFileIORetryableError(lastError)) {
        // Non-retryable error - preserve and fail fast
        this.#logger.warn(
          {
            errorCode: (lastError as NodeJS.ErrnoException).code,
            errorMessage: lastError.message,
          },
          'Non-retryable error in flushUpdates - preserving to recovery file'
        );
        await this.#preservePendingUpdates(lastError);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = this.#calculateFlushRetryDelay(attempt);

      // Log retry attempt
      this.#logger.warn(
        {
          attempt,
          maxAttempts,
          delay,
          errorCode: (lastError as NodeJS.ErrnoException).code,
          errorMessage: lastError.message,
          pendingCount: this.#updateCount,
        },
        'Batch write failed, retrying...'
      );

      // Wait before retry
      await this.#sleep(delay);
    }
  }

  // Should not reach here, but TypeScript needs it
  if (lastError) {
    await this.#preservePendingUpdates(lastError);
    throw lastError;
  }
}

// ================================================================
// PATTERN 4: CLI Option Addition
// ================================================================
// File: src/cli/index.ts (add after line 236)

.option(
  '--flush-retries <n>',
  'Max retries for batch write failures (0-10, default: 3, env: HACKY_FLUSH_RETRIES)',
  process.env.HACKY_FLUSH_RETRIES ?? '3'
)

// File: src/cli/index.ts (add validation after line 500)

// Validate flush-retries
if (options.flushRetries !== undefined) {
  const flushRetriesStr = String(options.flushRetries);
  const flushRetries = parseInt(flushRetriesStr, 10);

  if (isNaN(flushRetries) || flushRetries < 0 || flushRetries > 10) {
    logger.error('--flush-retries must be an integer between 0 and 10');
    process.exit(1);
  }

  options.flushRetries = flushRetries;
}

// ================================================================
// PATTERN 5: PRPPipeline Integration
// ================================================================
// File: src/workflows/prp-pipeline.ts (modify constructor)

export class PRPPipeline extends Workflow {
  // ... existing fields ...
  readonly #flushRetries?: number;

  constructor(
    // ... existing parameters ...
    flushRetries?: number
  ) {
    super();
    // ... existing assignments ...
    this.#flushRetries = flushRetries;
  }

  // In initializeSession() method where SessionManager is created:
  const sessionManager = new SessionManager(
    this.#prdPath,
    this.#planDir,
    this.#flushRetries  // Pass flushRetries
  );
}
```

### Integration Points

```yaml
SESSION_MANAGER:
  - modify: src/core/session-manager.ts
  - add: #flushRetries private field
  - add: #calculateFlushRetryDelay() method
  - add: #isFileIORetryableError() function
  - add: #preservePendingUpdates() method
  - modify: flushUpdates() with retry loop
  - modify: constructor with flushRetries parameter

CLI_OPTIONS:
  - modify: src/cli/index.ts
  - add: flushRetries to CLIArgs interface
  - add: flushRetries to ValidatedCLIArgs interface
  - add: --flush-retries .option() call
  - add: validation logic (0-10 range)
  - env var: HACKY_FLUSH_RETRIES

PIPELINE_INTEGRATION:
  - modify: src/workflows/prp-pipeline.ts
  - add: #flushRetries private field
  - add: flushRetries parameter to constructor
  - pass: flushRetries to SessionManager initialization

RECOVERY_FILE:
  - location: {sessionPath}/tasks.json.failed
  - format: JSON with version, timestamp, pendingUpdates, error
  - created: When all retries exhausted or non-retryable error
  - purpose: Manual recovery of pending updates

LOGGING:
  - retry: warn level with attempt, delay, error context
  - success: info level with efficiency stats
  - failure: error level with recovery path
  - keys: attempt, maxAttempts, delay, errorCode, errorMessage, pendingCount
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Type checking with TypeScript
npx tsc --noEmit src/core/session-manager.ts
npx tsc --noEmit src/cli/index.ts
npx tsc --noEmit src/workflows/prp-pipeline.ts

# Linting with ESLint (if configured)
npx eslint src/core/session-manager.ts --fix
npx eslint tests/unit/core/flush-retry.test.ts --fix

# Format with Prettier (if configured)
npx prettier --write src/core/session-manager.ts

# Expected: Zero type errors, zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test flush retry logic in isolation
vitest run tests/unit/core/flush-retry.test.ts

# Test with coverage
vitest run tests/unit/core/flush-retry.test.ts --coverage

# Run all unit tests to ensure no regressions
vitest run tests/unit/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test flush retry during actual session operations
cat > test_flush_retry_integration.ts << 'EOF'
import { SessionManager } from './src/core/session-manager.js';

// Create a session manager with retry enabled
const manager = new SessionManager('./PRD.md', 'plan', 3);

// Initialize session
await manager.initialize();

// Batch some updates
await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');

// Flush with retry (will handle transient failures automatically)
await manager.flushUpdates();

console.log('Flush complete with automatic retry');
EOF

node --loader tsx test_flush_retry_integration.ts

# Expected: All operations complete successfully
rm test_flush_retry_integration.ts
```

### Level 4: Manual Validation

```bash
# Test CLI option parsing
npm run dev -- --prd PRD.md --flush-retries 5

# Test environment variable
HACKY_FLUSH_RETRIES=5 npm run dev -- --prd PRD.md

# Test validation (should exit with error)
npm run dev -- --prd PRD.md --flush-retries 11  # Should fail

# Expected: CLI option works, validation rejects invalid values
```

---

## Final Validation Checklist

### Technical Validation

- [ ] SessionManager has #flushRetries field
- [ ] #calculateFlushRetryDelay() calculates exponential backoff
- [ ] #isFileIORetryableError() classifies EBUSY, EAGAIN, EIO, ENFILE as retryable
- [ ] #preservePendingUpdates() creates recovery file with all context
- [ ] flushUpdates() has retry loop with exponential backoff
- [ ] Non-retryable errors fail fast with recovery file
- [ ] CLI option --flush-retries accepts 0-10 with validation
- [ ] PRPPipeline passes flushRetries to SessionManager
- [ ] All 4 validation levels completed successfully
- [ ] All unit tests pass: `vitest run tests/unit/core/flush-retry.test.ts`
- [ ] No type errors: `npx tsc --noEmit`

### Feature Validation

- [ ] Retries on EBUSY error (file locked)
- [ ] Retries on EAGAIN error (temporarily unavailable)
- [ ] Retries on EIO error (transient I/O)
- [ ] Does not retry on ENOSPC error (disk full)
- [ ] Does not retry on ENOENT error (file not found)
- [ ] Does not retry on EACCES error (permission denied)
- [ ] Uses exponential backoff (100ms, 200ms, 400ms...)
- [ ] Logs each retry attempt with context
- [ ] Creates recovery file after all retries exhausted
- [ ] Recovery file contains: timestamp, session path, pending updates, error details
- [ ] --flush-retries 0 disables retry
- [ ] --flush-retries 5 allows 5 retry attempts
- [ ] Invalid values (-1, 11, abc) are rejected with clear error message

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Reuses calculateDelay() from src/utils/retry.ts
- [ ] File placement matches desired codebase tree structure
- [ ] JSDoc comments added for public methods
- [ ] Error handling is comprehensive
- [ ] Anti-patterns avoided (see below)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Logs are informative but not verbose
- [ ] CLI help text is clear (--help shows flush-retries option)

---

## Anti-Patterns to Avoid

- **Don't** modify atomicWrite() function - it's a low-level utility
- **Don't** use network retry delays - file I/O is 10x faster (100ms vs 1000ms)
- **Don't** retry on ENOSPC - disk full requires user intervention
- **Don't** skip error classification - some errors should fail fast
- **Don't** forget to preserve pending updates on final failure
- **Don't** use setTimeout directly - use #sleep() helper for testability
- **Don't** log at error level for retries - use warn level
- **Don't** create recovery file on first failure - only after all retries
- **Don't** duplicate calculateDelay() logic - reuse from src/utils/retry.ts
- **Don't** hardcode retry count - make it configurable via CLI
- **Don't** forget to validate CLI input - reject values outside 0-10 range
- **Don't** throw in #preservePendingUpdates - log and continue

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:

- Complete analysis of existing SessionManager.flushUpdates() implementation
- Existing retry infrastructure in src/utils/retry.ts is well-designed
- Clear patterns from existing --task-retry CLI option
- Test patterns well-established in the codebase
- External research provides file I/O specific guidance
- Comprehensive research on retry mechanisms and error classification
- Specific file paths, class names, and method signatures provided

**Risk Areas**:

- Integration with PRPPipeline requires careful parameter passing
- Error classification must be accurate (retryable vs non-retryable)
- Recovery file format must be future-proof (version field)
- Timing tests require fake timers setup

**Mitigation**:

- Clear task breakdown with dependency ordering
- Exact error code lists from external research
- Recovery file uses version field for migration
- Test patterns include vi.useFakeTimers() for timing tests

---

## Appendix: Error Code Reference

| Error Code | Description                      | Retryable | Reason                          |
| ---------- | -------------------------------- | --------- | ------------------------------- |
| EBUSY      | Resource busy or locked          | Yes       | Lock may be released            |
| EAGAIN     | Resource temporarily unavailable | Yes       | May become available            |
| EIO        | I/O error                        | Yes       | Transient disk/controller issue |
| ENFILE     | System file table full           | Yes       | File descriptors may free up    |
| ENOSPC     | No space left on device          | No        | User must free space            |
| ENOENT     | File or directory not found      | No        | Create file first               |
| EACCES     | Permission denied                | No        | Fix permissions                 |
| EMFILE     | Too many open files              | No        | Application bug                 |

---

## Appendix: Retry Delay Calculation

For `--flush-retries 3` (default):

| Attempt | Delay Formula        | Delay (ms) | Cumulative (ms) |
| ------- | -------------------- | ---------- | --------------- |
| 1       | Immediate            | 0          | 0               |
| 2       | 100 \* 2^(2-1) = 100 | ~100       | ~100            |
| 3       | 100 \* 2^(3-1) = 200 | ~200       | ~300            |

Total time for 3 retries: ~300ms (with jitter: ~285-315ms)

For `--flush-retries 5`:

| Attempt | Delay Formula        | Delay (ms) | Cumulative (ms) |
| ------- | -------------------- | ---------- | --------------- |
| 1       | Immediate            | 0          | 0               |
| 2       | 100 \* 2^(2-1) = 100 | ~100       | ~100            |
| 3       | 100 \* 2^(3-1) = 200 | ~200       | ~300            |
| 4       | 100 \* 2^(4-1) = 400 | ~400       | ~700            |
| 5       | 100 \* 2^(5-1) = 800 | ~800       | ~1500           |

Total time for 5 retries: ~1500ms (capped at 2s max)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Related Documents**:

- Codebase Analysis: `plan/003_b3d3efdaf0ed/P3M2T2S2/research/codebase-analysis-summary.md`
- External Research: `plan/003_b3d3efdaf0ed/P3M2T2S2/research/external-retry-best-practices.md`
- Checkpoint Mechanism PRP: `plan/003_b3d3efdaf0ed/P3M2T2S1/PRP.md` (parallel work)
