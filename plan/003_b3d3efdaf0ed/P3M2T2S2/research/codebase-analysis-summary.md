# Codebase Analysis Summary: Batch Write Failure Recovery

## Work Item: P3.M2.T2.S2 - Improve batch write failure recovery

**Date**: 2026-01-24
**Researcher**: AI Agent

---

## Executive Summary

This document summarizes the codebase analysis for implementing automatic retry mechanism for batch write operations in `flushUpdates()`. The current implementation has a **batching state corruption risk**: if `flushUpdates()` fails, retry is required but no automatic retry mechanism exists. Pending updates are preserved on error but require manual intervention.

### Key Finding from system_context.md (lines 445-448)

> **Batching State Corruption Risk**:
> - If `flushUpdates()` fails, retry is required
> - No automatic retry mechanism
> - Pending updates preserved on error

---

## Current State Analysis

### 1. SessionManager Batch Write Pattern

**File**: `src/core/session-manager.ts` (lines 109-119, 670-720)

```typescript
// Batching state fields
#dirty: boolean = false;
#pendingUpdates: Backlog | null = null;
#updateCount: number = 0;

// Current flushUpdates implementation (lines 670-720)
async flushUpdates(): Promise<void> {
  if (!this.#dirty) {
    this.#logger.debug('No pending updates to flush');
    return;
  }

  try {
    await this.saveBacklog(this.#pendingUpdates);
    // ... stats logging ...
    this.#dirty = false;
    this.#pendingUpdates = null;
    this.#updateCount = 0;
  } catch (error) {
    // Preserve dirty state on error - allow retry
    this.#logger.error(
      { error, pendingCount: this.#updateCount },
      'Batch write failed - pending updates preserved for retry'
    );
    throw error; // Re-throw for caller to handle
  }
}
```

**Current Behavior**:
- Pending updates (`#pendingUpdates`) ARE preserved on error
- Dirty flag (`#dirty`) remains true
- Error is re-thrown to caller
- **NO automatic retry** - caller must handle retry

### 2. Atomic Write Pattern

**File**: `src/core/session-utils.ts` (lines 98-179)

The `atomicWrite()` function implements temp file + rename pattern:

```typescript
export async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(dirname(targetPath), `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`);

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath);
    // ... success logging ...
  } catch (error) {
    // Clean up temp file on error
    try {
      await unlink(tempPath);
    } catch (cleanupError) {
      this.#logger.warn({ tempPath }, 'Failed to clean up temp file');
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}
```

**Key Characteristics**:
- Writes to temp file first
- Renames to target (atomic on POSIX)
- Cleans up temp file on error
- Throws `SessionFileError` with full context

### 3. Existing Retry Infrastructure

**File**: `src/utils/retry.ts` (comprehensive retry utilities)

The codebase has excellent retry infrastructure already:

| Component | Lines | Description |
|-----------|-------|-------------|
| `retry()` | 495-549 | Generic retry with exponential backoff |
| `calculateDelay()` | 246-268 | Exponential backoff with jitter |
| `isTransientError()` | 323-410 | Error classification |
| `retryAgentPrompt()` | 648-656 | LLM call retry wrapper |
| `retryMcpTool()` | 701-724 | MCP tool retry wrapper |

**Default Retry Configuration** (from TaskRetryManager):
```typescript
{
  maxAttempts: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 30000,    // 30 seconds
  backoffFactor: 2,   // Exponential
  jitterFactor: 0.1,  // 10% variance
}
```

### 4. File System Error Codes

From `src/utils/retry.ts` (lines 67-77):

**Retryable (Transient)**:
- `ECONNRESET`, `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND` - Network errors
- `EAGAIN`, `EBUSY` - Resource temporarily unavailable

**Not Retryable (Permanent)**:
- `ENOENT` - File not found
- `EACCES` - Permission denied
- `ENOSPC` - No space left on device (disk full)

---

## Integration with Checkpoint Mechanism (P3.M2.T2.S1)

The parallel work item P3.M2.T2.S1 is implementing a checkpoint mechanism:

**CheckpointManager**: `src/core/checkpoint-manager.ts` (NEW)
- Saves checkpoints at key execution points
- Uses atomic writes for persistence
- Stores in `{sessionPath}/artifacts/{taskId}/checkpoints.json`

**Relationship**:
- Checkpoint mechanism saves PRP execution state
- Batch write retry protects session state persistence
- Both use atomic write pattern from `session-utils.ts`
- Independent concerns but complementary reliability

---

## Test Patterns from Codebase

### 1. Flush Retry Test Pattern

**File**: `tests/unit/core/session-state-batching.test.ts`

```typescript
it('should preserve dirty state on flush failure for retry', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // MOCK: First flush fails
  mockWriteTasksJSON.mockRejectedValueOnce(
    new Error('ENOSPC: no space left on device')
  );

  // EXECUTE: First flush attempt (should fail)
  await expect(manager.flushUpdates()).rejects.toThrow('ENOSPC');

  // VERIFY: State preserved for retry
  expect(manager.getBatchingState()).toEqual({
    dirty: true,
    updateCount: 1,
  });

  // MOCK: Second flush succeeds
  mockWriteTasksJSON.mockResolvedValueOnce(undefined);

  // EXECUTE: Retry flush (should succeed)
  await expect(manager.flushUpdates()).resolves.not.toThrow();
});
```

### 2. Fake Timers Pattern

**File**: `tests/unit/utils/retry.test.ts`

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('should retry with exponential backoff', async () => {
  const delays: number[] = [];
  vi.spyOn(global, 'setTimeout').mockImplementation((callback, ms) => {
    if (ms !== undefined) delays.push(ms);
    return originalSetTimeout(callback as () => void, ms ?? 0);
  });

  // ... execute retry ...

  expect(delays[0]).toBe(1000); // First retry delay
  expect(delays[1]).toBe(2000); // Second retry delay (exponential)
});
```

### 3. Mock File System Failures

```typescript
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

const mockWriteFile = vi.mocked(writeFile);
mockWriteFile.mockRejectedValueOnce(new Error('EBUSY'));
```

---

## CLI Configuration Pattern

**File**: `src/cli/index.ts`

Existing retry-related CLI options (lines 230-246):

```typescript
.option(
  '--task-retry <n>',
  'Max retry attempts for transient errors (0-10, default: 3, env: HACKY_TASK_RETRY_MAX_ATTEMPTS)',
  process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS ?? '3'
)
.option(
  '--retry-backoff <ms>',
  'Base delay before first retry in ms (100-60000, default: 1000)',
  '1000'
)
.option(
  '--retry/--no-retry',
  'Enable automatic retry for all tasks (default: enabled)',
  true
)
```

**Validation Pattern** (lines 476-502):

```typescript
if (options.taskRetry !== undefined) {
  const taskRetryStr = String(options.taskRetry);
  const taskRetry = parseInt(taskRetryStr, 10);

  if (isNaN(taskRetry) || taskRetry < 0 || taskRetry > 10) {
    logger.error('--task-retry must be an integer between 0 and 10');
    process.exit(1);
  }

  options.taskRetry = taskRetry;
}
```

---

## Required Changes Summary

### 1. SessionManager.flushUpdates() Enhancement

**File**: `src/core/session-manager.ts` (lines 670-720)

**Current**:
```typescript
async flushUpdates(): Promise<void> {
  // ... validation ...
  try {
    await this.saveBacklog(this.#pendingUpdates);
    // ... reset state ...
  } catch (error) {
    // Preserve dirty state on error
    this.#logger.error({ error, pendingCount: this.#updateCount }, 'Batch write failed');
    throw error;
  }
}
```

**Enhanced**:
```typescript
async flushUpdates(): Promise<void> {
  // ... validation ...
  let attempt = 0;
  while (attempt < this.#flushRetries) {
    try {
      await this.saveBacklog(this.#pendingUpdates);
      // ... reset state ...
      return; // Success
    } catch (error) {
      attempt++;
      if (attempt >= this.#flushRetries) {
        // All retries failed - preserve to recovery file
        await this.#preservePendingUpdates(error as Error);
        throw error;
      }
      // Log retry with exponential backoff
      const delay = this.#calculateFlushRetryDelay(attempt);
      this.#logger.warn({ attempt, delay, error }, 'Batch write failed, retrying...');
      await this.#sleep(delay);
    }
  }
}
```

### 2. New Configuration

**File**: `src/cli/index.ts`

Add new CLI option:
```typescript
.option(
  '--flush-retries <n>',
  'Max retries for batch write failures (0-10, default: 3)',
  '3'
)
```

### 3. Recovery File Pattern

**Recovery File**: `tasks.json.failed`

Location: `{sessionPath}/tasks.json.failed`

Format:
```json
{
  "version": "1.0",
  "timestamp": "2026-01-24T15:30:45.123Z",
  "pendingUpdates": { /* Backlog data */ },
  "error": {
    "message": "ENOSPC: no space left on device",
    "code": "ENOSPC",
    "attempts": 3
  }
}
```

### 4. Test File

**New File**: `tests/unit/core/flush-retry.test.ts`

Test cases:
- Should retry on transient file I/O errors (EBUSY, EAGAIN)
- Should not retry on permanent errors (ENOSPC, ENOENT)
- Should use exponential backoff between retries
- Should preserve to recovery file after all retries fail
- Should log each retry attempt with error context
- Should respect --flush-retries CLI option

---

## File Tree: Desired State

```
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts       # MODIFIED: Add retry logic to flushUpdates()
│   │   │   # - Add #flushRetries field
│   │   │   # - Add #calculateFlushRetryDelay() method
│   │   │   # - Add #preservePendingUpdates() method
│   │   │   # - Modify flushUpdates() with retry loop
│   │   └── session-utils.ts          # REFERENCE: Existing atomic write pattern
│   ├── utils/
│   │   └── retry.ts                  # REFERENCE: Existing retry utilities
│   └── cli/
│       └── index.ts                  # MODIFIED: Add --flush-retries option
└── tests/
    └── unit/
        └── core/
            └── flush-retry.test.ts   # NEW: Flush retry tests
```

---

## Key Gotchas

1. **File I/O is faster than network I/O**: Use shorter delays (100ms base vs 1000ms)
2. **Not all file errors are retryable**: ENOSPC (disk full) should fail fast
3. **Atomic writes already protect against corruption**: Retry is for transient failures
4. **Pending updates are already preserved**: Just need automatic retry loop
5. **Recovery file is last resort**: Only create after all retries exhausted
6. **Use existing retry utilities**: Don't duplicate `calculateDelay()` from `src/utils/retry.ts`
7. **Log each retry attempt**: Include attempt number, delay, and error context
8. **Respect CLI configuration**: Allow users to disable retry (--flush-retries 0)

---

## References

- **system_context.md** (lines 445-448): Batching state corruption risk
- **src/core/session-manager.ts** (lines 670-720): Current flushUpdates() implementation
- **src/core/session-utils.ts** (lines 98-179): Atomic write pattern
- **src/utils/retry.ts**: Existing retry infrastructure
- **P3.M2.T2.S1 PRP**: Checkpoint mechanism (parallel work item)
- **tests/unit/core/session-state-batching.test.ts**: Test patterns
- **tests/unit/utils/retry.test.ts**: Retry test patterns

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
