# External Research: File I/O Retry Best Practices

## Work Item: P3.M2.T2.S2 - Improve batch write failure recovery

**Date**: 2026-01-24
**Researcher**: AI Agent

---

## Research URLs and Key Findings

### 1. File System Error Classification

**Source**: Node.js Documentation
**URL**: https://nodejs.org/api/errors.html

#### Retryable Error Codes (Transient)

| Error Code | Description                      | Retry Strategy                |
| ---------- | -------------------------------- | ----------------------------- |
| `EBUSY`    | Resource busy or locked          | 3 retries, 100ms base delay   |
| `EAGAIN`   | Resource temporarily unavailable | 2-3 retries, 100ms base delay |
| `EIO`      | I/O error (transient disk issue) | 2 retries, 200ms base delay   |
| `ENFILE`   | System file table full           | 1 retry, 500ms delay          |

#### Non-Retryable Error Codes (Permanent)

| Error Code | Description                 | Action                          |
| ---------- | --------------------------- | ------------------------------- |
| `ENOSPC`   | No space left on device     | Fail fast, user must free space |
| `ENOENT`   | File or directory not found | Fail fast, create file first    |
| `EACCES`   | Permission denied           | Fail fast, fix permissions      |
| `EMFILE`   | Too many open files         | Application bug, fail fast      |

### 2. Exponential Backoff for File I/O

**Source**: Node.js Best Practices
**URL**: https://github.com/goldbergyoni/nodebestpractices

File I/O operations are **10x faster** than network operations:

```typescript
const FILE_IO_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 100, // 100ms (vs 1000ms for network)
  maxDelay: 2000, // 2 seconds (vs 30 seconds for network)
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

**Total time for 3 retries**:

- Attempt 1: Immediate
- Attempt 2: 100ms delay
- Attempt 3: 200ms delay (exponential)
- Total: ~750ms (vs ~18 seconds for network)

### 3. State Preservation Patterns

**Source**: AWS Architecture Blog
**URL**: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/

When all retries fail:

#### Option 1: Save to fallback file (Recommended)

```typescript
// Save to recovery file with timestamp
const recoveryPath = `${sessionPath}/tasks-pending-${new Date().toISOString()}.json`;
await writeFile(recoveryPath, JSON.stringify(pendingUpdates));
```

Benefits:

- Timestamp ensures uniqueness
- Easy to recover manually
- In same directory as original file

#### Option 2: Alternative directory

```typescript
// Fall back to home directory if session directory not writable
const fallbackPath = `${homedir}/.hacky-hack/pending-updates/${timestamp}.json`;
await writeFile(fallbackPath, JSON.stringify(pendingUpdates));
```

Benefits:

- Works even if session directory corrupted
- Can be recovered across sessions

### 4. Jitter for Distributed Systems

**Source**: AWS Architecture Blog
**URL**: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/

For single-process systems (like our PRP Pipeline):

- **Positive jitter only**: Always adds variance, never subtracts
- **Jitter factor**: 10% (0.1) is standard
- **Formula**: `delay = exponentialDelay + (exponentialDelay * jitterFactor * Math.random())`

```typescript
const exponentialDelay = Math.min(
  baseDelay * Math.pow(backoffFactor, attempt),
  maxDelay
);
const jitter = exponentialDelay * jitterFactor * Math.random();
const delay = Math.max(1, Math.floor(exponentialDelay + jitter));
```

### 5. Retry Configuration from Industry Standards

**Source**: Google Cloud Platform
**URL**: https://cloud.google.com/iot/docs/how-tos/exponential-backoff

| Operation        | Base Delay | Max Delay | Max Attempts |
| ---------------- | ---------- | --------- | ------------ |
| File I/O (local) | 100ms      | 2s        | 3            |
| Network (HTTP)   | 1000ms     | 30s       | 3            |
| Database         | 200ms      | 5s        | 5            |

### 6. CLI Configuration Patterns

**Source**: Commander.js Documentation
**URL**: https://github.com/tj/commander.js

```typescript
// Environment variable fallback
.option(
  '--flush-retries <n>',
  'Max retries for batch write (0-10, default: 3)',
  process.env.HACKY_FLUSH_RETRIES ?? '3'
)

// Validation
const flushRetries = parseInt(options.flushRetries, 10);
if (isNaN(flushRetries) || flushRetries < 0 || flushRetries > 10) {
  logger.error('--flush-retries must be an integer between 0 and 10');
  process.exit(1);
}
```

### 7. Recovery File Naming Conventions

**Source**: ISO 8601 Standard
**URL**: https://en.wikipedia.org/wiki/ISO_8601

Recommended format: `tasks-pending-2026-01-24T15-30-45-123Z.json`

Components:

- `tasks-pending-`: Prefix indicating content
- `2026-01-24T15-30-45-123Z`: ISO 8601 timestamp (colons replaced with dashes for filename compatibility)
- `.json`: File extension

Alternative: `tasks.json.failed` (simpler, no timestamp)

### 8. Logging Best Practices

**Source**: Twelve-Factor App
**URL**: https://12factor.net/logs

For retry operations:

```typescript
this.#logger.warn(
  {
    attempt,
    maxAttempts,
    delay,
    errorCode: error.code,
    errorMessage: error.message,
    pendingCount: this.#updateCount,
  },
  'Batch write failed, retrying...'
);
```

Key fields:

- `attempt`: Current retry attempt (1-indexed)
- `maxAttempts`: Configured retry limit
- `delay`: Delay before next retry (ms)
- `errorCode`: Node.js errno code
- `errorMessage`: Error message
- `pendingCount`: Number of pending updates

---

## Implementation Recommendations

### 1. Use Existing Retry Infrastructure

The codebase already has excellent retry utilities in `src/utils/retry.ts`:

- `calculateDelay()` for exponential backoff
- `isTransientError()` for error classification
- `retry()` for generic retry wrapper

**Recommendation**: Reuse these functions instead of duplicating logic.

### 2. File I/O Specific Configuration

Create file-specific config (faster than network):

```typescript
const FILE_IO_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 100, // 100ms (10x faster than network)
  maxDelay: 2000, // 2 seconds
  backoffFactor: 2,
  jitterFactor: 0.1,
} as const;
```

### 3. Error Classification for File I/O

Add file-specific error classification:

```typescript
function isFileIORetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as NodeJS.ErrnoException).code;
  return ['EBUSY', 'EAGAIN', 'EIO', 'ENFILE'].includes(code || '');
}
```

### 4. Recovery File Structure

```typescript
interface RecoveryFile {
  version: '1.0';
  timestamp: string; // ISO 8601
  sessionPath: string;
  pendingUpdates: Backlog;
  error: {
    message: string;
    code?: string;
    attempts: number;
  };
}
```

### 5. Integration with SessionManager

Add to `SessionManager` class:

```typescript
class SessionManager {
  readonly #flushRetries: number;
  readonly #flushRetryConfig: typeof FILE_IO_RETRY_CONFIG;

  async flushUpdates(): Promise<void> {
    // ... existing validation ...

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.#flushRetries) {
      try {
        await this.saveBacklog(this.#pendingUpdates);
        // ... success: reset state and return ...
        return;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt > this.#flushRetries) {
          // All retries failed - preserve to recovery file
          await this.#preservePendingUpdates(lastError);
          throw lastError;
        }

        // Check if error is retryable
        if (!isFileIORetryableError(lastError)) {
          // Non-retryable error - preserve and fail fast
          await this.#preservePendingUpdates(lastError);
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = calculateDelay(
          attempt,
          this.#flushRetryConfig.baseDelay,
          this.#flushRetryConfig.maxDelay,
          this.#flushRetryConfig.backoffFactor,
          this.#flushRetryConfig.jitterFactor
        );

        this.#logger.warn(
          {
            attempt,
            maxAttempts: this.#flushRetries,
            delay,
            errorCode: (lastError as NodeJS.ErrnoException).code,
            errorMessage: lastError.message,
            pendingCount: this.#updateCount,
          },
          'Batch write failed, retrying...'
        );

        await sleep(delay);
      }
    }
  }

  async #preservePendingUpdates(error: Error): Promise<void> {
    const recoveryPath = resolve(
      this.#currentSession!.metadata.path,
      'tasks.json.failed'
    );

    const recoveryData: RecoveryFile = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      sessionPath: this.#currentSession!.metadata.path,
      pendingUpdates: this.#pendingUpdates!,
      error: {
        message: error.message,
        code: (error as NodeJS.ErrnoException).code,
        attempts: this.#flushRetries,
      },
    };

    await writeFile(recoveryPath, JSON.stringify(recoveryData, null, 2));

    this.#logger.error(
      {
        recoveryPath,
        pendingCount: this.#updateCount,
        errorCode: (error as NodeJS.ErrnoException).code,
      },
      'All flush retries failed - pending updates preserved to recovery file'
    );
  }
}
```

---

## References

1. Node.js Error Documentation: https://nodejs.org/api/errors.html
2. Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
3. AWS Exponential Backoff: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
4. Google Cloud Retry Patterns: https://cloud.google.com/iot/docs/how-tos/exponential-backoff
5. Commander.js Documentation: https://github.com/tj/commander.js
6. ISO 8601 Timestamp Format: https://en.wikipedia.org/wiki/ISO_8601
7. Twelve-Factor App - Logs: https://12factor.net/logs

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
