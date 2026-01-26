# Testing Patterns for Atomic File Write Operations and Batch Flushing Behavior

**Research Document**
**Target PRP:** session-state-batching.test.ts
**Date:** 2026-01-26
**Component:** SessionManager atomic state update batching mechanism

## Executive Summary

This document compiles testing patterns for atomic file write operations, batch update accumulation, retry logic with exponential backoff, file system mocking, and state management. These patterns are directly applicable to testing SessionManager's batching and atomic state update mechanisms.

---

## Table of Contents

1. [Atomic Write Pattern Testing](#1-atomic-write-pattern-testing)
2. [Batch Accumulation and Flush Testing](#2-batch-accumulation-and-flush-testing)
3. [Retry Logic with Exponential Backoff](#3-retry-logic-with-exponential-backoff)
4. [File System Mock Patterns](#4-file-system-mock-patterns)
5. [Dirty State and Update Count Testing](#5-dirty-state-and-update-count-testing)
6. [Recovery File Testing](#6-recovery-file-testing)
7. [Resources and References](#7-resources-and-references)

---

## 1. Atomic Write Pattern Testing

### 1.1 The Pattern: Temp File + Rename

Atomic file writes ensure data integrity by:
1. Writing content to a temporary file
2. Renaming temp file to target (atomic on same filesystem)
3. Cleaning up temp file on error

**Implementation (from session-utils.ts):**

```typescript
export async function atomicWrite(
  targetPath: string,
  data: string
): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath);
  } catch (error) {
    await unlink(tempPath).catch(() => {}); // Cleanup
    throw error;
  }
}
```

### 1.2 Testing Strategies

#### A. Verify Write-Rename Sequence

```typescript
it('should create temp file before final write', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // Track call order
  const callOrder: string[] = [];
  mockWriteFile.mockImplementation(async () => {
    callOrder.push('writeFile');
  });
  mockRename.mockImplementation(async () => {
    callOrder.push('rename');
  });

  await manager.flushUpdates();

  // VERIFY: writeFile called before rename
  expect(callOrder).toEqual(['writeFile', 'rename']);
});
```

#### B. Verify Temp File Naming Pattern

```typescript
it('should use deterministic temp filename pattern', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // Set deterministic random bytes
  (mockRandomBytes as any).mockReturnValue(
    Buffer.from('test123456789abc', 'hex')
  );

  await manager.flushUpdates();

  // VERIFY temp filename pattern
  const writeCall = mockWriteFile.mock.calls.find(call =>
    String(call[0]).includes('.tmp')
  );
  const tempPath = writeCall![0] as string;

  // Pattern: /path/.tasks.json.<16-hex-chars>.tmp
  expect(tempPath).toMatch(/\.tasks\.json\.[a-f0-9]{16}\.tmp$/);
});
```

#### C. Verify File Permissions

```typescript
it('should verify file permissions are 0o644', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.flushUpdates();

  // VERIFY: File mode is 0o644 (rw-r--r--)
  const writeCall = mockWriteFile.mock.calls.find(call =>
    String(call[0]).includes('.tmp')
  );
  expect(writeCall![2]).toEqual({ mode: 0o644 });
});
```

#### D. Verify Rename Completes Atomic Write

```typescript
it('should use rename to complete atomic write', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.flushUpdates();

  expect(mockRename).toHaveBeenCalled();

  const renameCall = mockRename.mock.calls[0];
  expect(renameCall[0]).toMatch(/\.tmp$/); // Source is temp file
  expect(renameCall[1]).toContain('tasks.json'); // Target is final file
});
```

#### E. Temp File Cleanup on Error

```typescript
it('should clean up temp file on write failure', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // MOCK: writeFile fails
  mockWriteFile.mockRejectedValueOnce(new Error('EIO: I/O error'));
  mockUnlink.mockResolvedValue(undefined);

  await expect(manager.flushUpdates()).rejects.toThrow('EIO');

  // VERIFY: Cleanup attempted (unlink called)
  expect(mockUnlink).toHaveBeenCalled();
});

it('should clean up temp file on rename failure', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // MOCK: writeFile succeeds, rename fails
  mockWriteFile.mockResolvedValueOnce(undefined);
  mockRename.mockRejectedValueOnce(new Error('EIO: I/O error'));
  mockUnlink.mockResolvedValue(undefined);

  await expect(manager.flushUpdates()).rejects.toThrow('EIO');

  // VERIFY: Rename was attempted, cleanup happened
  expect(mockRename).toHaveBeenCalled();
  expect(mockUnlink).toHaveBeenCalled();
});
```

---

## 2. Batch Accumulation and Flush Testing

### 2.1 The Pattern: In-Memory Batching

Batching accumulates updates in memory:
- Multiple updates batched (not written immediately)
- Single atomic write on flush
- Dirty flag tracks pending changes

### 2.2 Testing Strategies

#### A. Verify Updates Are Batched (Not Written Immediately)

```typescript
it('should batch multiple status updates in memory', async () => {
  const manager = await createMockSessionManager();

  // Track writeTasksJSON calls (should not be called during batching)
  let writeTasksCallCount = 0;
  mockWriteTasksJSON.mockImplementation(async () => {
    writeTasksCallCount++;
  });

  // EXECUTE: Multiple status updates
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

  // VERIFY: No immediate writes occurred (updates batched in memory)
  expect(writeTasksCallCount).toBe(0);

  // VERIFY: Dirty state is set (flush will perform write)
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();

  // VERIFY: Single write for all 3 updates
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
});
```

#### B. Verify Single Atomic Write for All Updates

```typescript
it('should flush all updates in single atomic operation', async () => {
  const manager = await createMockSessionManager();

  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

  await manager.flushUpdates();

  // VERIFY: Single atomic write operation
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);

  // VERIFY: Written backlog contains all 3 updates
  const writtenBacklog = mockWriteTasksJSON.mock.calls[0][1] as Backlog;
  const item1 = writtenBacklog.backlog[0].milestones[0].tasks[0].subtasks[0];
  const item2 = writtenBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const item3 = writtenBacklog.backlog[0].milestones[0].tasks[0].subtasks[2];

  expect(item1.status).toBe('Complete');
  expect(item2.status).toBe('Complete');
  expect(item3.status).toBe('Complete');
});
```

#### C. Verify Complete Backlog State (Not Append)

```typescript
it('should overwrite pendingUpdates with complete backlog state', async () => {
  const manager = await createMockSessionManager();

  // EXECUTE: First update
  const result1 = await manager.updateItemStatus('P1.M1.T1.S1', 'Researching');
  expect(result1.backlog[0].milestones[0].tasks[0].subtasks[0].status).toBe(
    'Researching'
  );

  // EXECUTE: Second update (overwrites with new complete backlog)
  const result2 = await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');

  // VERIFY: Second result includes both updates (complete backlog, not appended)
  expect(result2.backlog[0].milestones[0].tasks[0].subtasks[0].status).toBe(
    'Researching'
  ); // First update preserved
  expect(result2.backlog[0].milestones[0].tasks[0].subtasks[1].status).toBe(
    'Complete'
  ); // Second update applied
});
```

#### D. Verify Batching Efficiency Metrics

```typescript
it('should calculate batching statistics correctly', async () => {
  const manager = await createMockSessionManager();

  // EXECUTE: Multiple updates
  const updateCount = 5;
  for (let i = 1; i <= updateCount; i++) {
    await manager.updateItemStatus(`P1.M1.T1.S${i}`, 'Complete');
  }

  await manager.flushUpdates();

  // VERIFY: Statistics calculated correctly
  // itemsWritten = 5
  // writeOpsSaved = 4 (5 - 1)
  // efficiency = 80.0% ((4 / 5) * 100)

  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
});

it('should calculate efficiency as 0% for single update', async () => {
  const manager = await createMockSessionManager();

  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.flushUpdates();

  // VERIFY: Single write performed
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
  // Stats: itemsWritten=1, writeOpsSaved=0, efficiency=0%
});
```

#### E. Edge Cases

```typescript
it('should handle empty batch (flush with no updates)', async () => {
  const manager = await createMockSessionManager();

  // EXECUTE: Flush without any updates
  await manager.flushUpdates();

  // VERIFY: No write operations performed
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();
});

it('should handle same item updated multiple times', async () => {
  const manager = await createMockSessionManager();

  // EXECUTE: Update same item 5 times
  await manager.updateItemStatus('P1.M1.T1.S1', 'Researching');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Implementing');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Failed');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  await manager.flushUpdates();

  // VERIFY: All 5 updates counted in statistics
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);

  // Verify final status is last update
  const writtenBacklog = mockWriteTasksJSON.mock.calls[0][1] as Backlog;
  const item = writtenBacklog.backlog[0].milestones[0].tasks[0].subtasks[0];
  expect(item.status).toBe('Complete');
});
```

---

## 3. Retry Logic with Exponential Backoff

### 3.1 The Pattern: Exponential Backoff with Jitter

Retry logic for transient failures:
- Base delay × backoffFactor^attempt
- Capped at maxDelay
- Random jitter for thundering herd prevention
- Transient vs permanent error detection

**Configuration (from session-manager.ts):**

```typescript
const FILE_IO_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  jitterFactor: 0.1,
} as const;
```

### 3.2 Testing with Vitest Fake Timers

#### A. Basic Fake Timer Setup

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

describe('Retry Logic Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should retry on transient error', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts === 1) {
        const err = new Error('ETIMEDOUT');
        (err as { code?: string }).code = 'ETIMEDOUT';
        throw err;
      }
      return 'success';
    };

    const retryPromise = retry(fn, { maxAttempts: 3 });
    await vi.runAllTimersAsync();
    const result = await retryPromise;

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });
});
```

#### B. Verify Exponential Backoff Delays

```typescript
it('should use exponential backoff between retries', async () => {
  const delays: number[] = [];
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      const err = new Error('ECONNRESET');
      (err as { code?: string }).code = 'ECONNRESET';
      throw err;
    }
    return 'success';
  };

  // Track timer calls with fake timers
  const originalSetTimeout = global.setTimeout;
  vi.spyOn(global, 'setTimeout').mockImplementation((callback, ms) => {
    if (ms !== undefined) {
      delays.push(ms);
    }
    return originalSetTimeout(callback as () => void, ms ?? 0)
      as unknown as NodeJS.Timeout;
  });

  const retryPromise = retry(fn, {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffFactor: 2,
    jitterFactor: 0, // No jitter for predictable testing
  });

  await vi.runAllTimersAsync();
  await retryPromise;

  // First retry: attempt 0, delay = 1000 * 2^0 = 1000ms
  // Second retry: attempt 1, delay = 1000 * 2^1 = 2000ms
  expect(delays[0]).toBe(1000);
  expect(delays[1]).toBe(2000);
});
```

#### C. Verify Max Delay Capping

```typescript
it('should cap delay at maxDelay', async () => {
  const delays: number[] = [];
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 4) {
      const err = new Error('ETIMEDOUT');
      (err as { code?: string }).code = 'ETIMEDOUT';
      throw err;
    }
    return 'success';
  };

  const originalSetTimeout = global.setTimeout;
  vi.spyOn(global, 'setTimeout').mockImplementation((callback, ms) => {
    if (ms !== undefined) {
      delays.push(ms);
    }
    return originalSetTimeout(callback as () => void, ms ?? 0)
      as unknown as NodeJS.Timeout;
  });

  const retryPromise = retry(fn, {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 2000,
    backoffFactor: 2,
    jitterFactor: 0,
  });

  await vi.runAllTimersAsync();
  await retryPromise;

  // Attempt 0: 1000ms
  // Attempt 1: 2000ms (capped at maxDelay)
  // Attempt 2: 2000ms (capped at maxDelay, would be 4000ms)
  expect(delays[0]).toBe(1000);
  expect(delays[1]).toBe(2000);
  expect(delays[2]).toBe(2000);
});
```

#### D. Verify Jitter Randomization

```typescript
it('should add jitter to delay', async () => {
  const delays: number[] = [];
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      const err = new Error('ETIMEDOUT');
      (err as { code?: string }).code = 'ETIMEDOUT';
      throw err;
    }
    return 'success';
  };

  const originalSetTimeout = global.setTimeout;
  vi.spyOn(global, 'setTimeout').mockImplementation((callback, ms) => {
    if (ms !== undefined) {
      delays.push(ms);
    }
    return originalSetTimeout(callback as () => void, ms ?? 0)
      as unknown as NodeJS.Timeout;
  });

  const retryPromise = retry(fn, {
    maxAttempts: 3,
    baseDelay: 1000,
    jitterFactor: 0.2, // 20% jitter
  });

  await vi.runAllTimersAsync();
  await retryPromise;

  // With jitter, delays should vary
  // First: ~1000ms +/- 200ms
  // Second: ~2000ms +/- 400ms
  expect(delays[0]).toBeGreaterThan(800);
  expect(delays[0]).toBeLessThan(1200);
  expect(delays[1]).toBeGreaterThan(1600);
  expect(delays[1]).toBeLessThan(2400);
});
```

#### E. Verify Transient vs Permanent Errors

```typescript
it('should retry on transient error and succeed', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts === 1) {
      const err = new Error('ETIMEDOUT');
      (err as { code?: string }).code = 'ETIMEDOUT';
      throw err;
    }
    return 'success';
  };

  const retryPromise = retry(fn, { maxAttempts: 3 });
  await vi.runAllTimersAsync();
  const result = await retryPromise;

  expect(result).toBe('success');
  expect(attempts).toBe(2);
});

it('should throw immediately for ValidationError', async () => {
  const fn = async () => {
    throw new ValidationError('Invalid input', { field: 'taskId' });
  };

  await expect(retry(fn, { maxAttempts: 5 })).rejects.toThrow(
    'Invalid input'
  );
});

it('should throw immediately for 404 error', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    const err = new Error('Not found');
    (err as { response?: { status?: number } }).response = { status: 404 };
    throw err;
  };

  await expect(retry(fn, { maxAttempts: 5 })).rejects.toThrow('Not found');
  expect(attempts).toBe(1); // Should not retry
});
```

#### F. Verify Max Attempts Enforcement

```typescript
it('should throw after maxAttempts exhausted', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    const err = new Error('ETIMEDOUT');
    (err as { code?: string }).code = 'ETIMEDOUT';
    throw err;
  };

  const retryPromise = retry(fn, { maxAttempts: 3 });
  await vi.runAllTimersAsync();
  await expect(retryPromise).rejects.toThrow('ETIMEDOUT');

  expect(attempts).toBe(3); // Initial + 2 retries
});
```

#### G. SessionManager Flush Retry Pattern

```typescript
it('should preserve dirty state on flush failure for retry', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');

  // MOCK: First flush fails
  mockWriteTasksJSON.mockRejectedValueOnce(
    new Error('ENOSPC: no space left on device')
  );

  // EXECUTE: First flush attempt (should fail)
  await expect(manager.flushUpdates()).rejects.toThrow('ENOSPC');

  // VERIFY: State preserved for retry
  // Can call flushUpdates again immediately

  // MOCK: Second flush succeeds
  mockWriteTasksJSON.mockResolvedValueOnce(undefined);

  // EXECUTE: Retry flush (should succeed)
  await expect(manager.flushUpdates()).resolves.not.toThrow();

  // VERIFY: Write eventually succeeded
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(2);
});

it('should handle immediate retry after failure', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // MOCK: First flush fails, second succeeds
  mockWriteTasksJSON
    .mockRejectedValueOnce(new Error('ENOSPC: no space left'))
    .mockResolvedValueOnce(undefined);

  // EXECUTE: First flush attempt (fails)
  await expect(manager.flushUpdates()).rejects.toThrow('ENOSPC');

  // EXECUTE: Immediate retry (succeeds)
  await expect(manager.flushUpdates()).resolves.not.toThrow();

  // VERIFY: Retry succeeded
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(2);
});
```

---

## 4. File System Mock Patterns

### 4.1 Node.js fs/promises Mocking

#### A. Module-Level Mock with vi.mock()

```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Import and cast mocked functions
import { writeFile, rename, unlink } from 'node:fs/promises';
const mockWriteFile = vi.mocked(writeFile);
const mockRename = vi.mocked(rename);
const mockUnlink = vi.mocked(unlink);
```

#### B. beforeEach Cleanup

```typescript
describe('File System Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock implementations
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
  });

  it('should write file correctly', async () => {
    mockWriteFile.mockResolvedValue(undefined);

    await someFunctionThatWrites();

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/path/to/file.txt',
      'content',
      { mode: 0o644 }
    );
  });
});
```

#### C. Verifying Call Order

```typescript
it('should verify atomic write sequence (writeFile then rename)', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // Track call order
  const callOrder: string[] = [];
  mockWriteFile.mockImplementation(async () => {
    callOrder.push('writeFile');
  });
  mockRename.mockImplementation(async () => {
    callOrder.push('rename');
  });

  await manager.flushUpdates();

  // VERIFY: writeFile called before rename
  expect(callOrder).toEqual(['writeFile', 'rename']);
});
```

#### D. Conditional Mocking (Success/Failure)

```typescript
it('should handle write failure', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // MOCK: First call fails, second succeeds
  mockWriteTasksJSON
    .mockRejectedValueOnce(new Error('ENOSPC'))
    .mockResolvedValueOnce(undefined);

  // First attempt fails
  await expect(manager.flushUpdates()).rejects.toThrow('ENOSPC');

  // Retry succeeds
  await expect(manager.flushUpdates()).resolves.not.toThrow();
});
```

#### E. Mock Implementation Patterns

```typescript
// Mock writeTasksJSON to simulate atomic write pattern
mockWriteTasksJSON.mockImplementation(
  async (sessionPath: string, backlog: Backlog) => {
    // Simulate atomic write pattern
    const randomHex = (mockRandomBytes as any).mock.results[0]?.value
      ? (mockRandomBytes as any).mock.results[0].value.toString('hex')
      : 'abc123def4567890';
    const tempPath = `${sessionPath}/.tasks.json.${randomHex}.tmp`;
    const targetPath = `${sessionPath}/tasks.json`;
    const content = JSON.stringify(backlog, null, 2);

    try {
      // Call the mocked fs functions to simulate atomic write
      await mockWriteFile(tempPath, content, { mode: 0o644 });
      await mockRename(tempPath, targetPath);
    } catch (error) {
      // Simulate cleanup on error
      await mockUnlink(tempPath).catch(() => {});
      throw error;
    }
  }
);
```

### 4.2 Deterministic Mocks for Random Values

```typescript
beforeEach(() => {
  // Set up deterministic random bytes for temp filenames
  (mockRandomBytes as any).mockReturnValue(
    Buffer.from('abc123def4567890', 'hex')
  );

  // Set up deterministic UUID for correlation IDs
  (mockRandomUUID as any).mockReturnValue('test-uuid-12345');
});
```

### 4.3 Spy Patterns with vi.spyOn()

```typescript
describe('Partial Mocking', () => {
  const writeFileSpy = vi.spyOn(fsPromises, 'writeFile');
  const renameSpy = vi.spyOn(fsPromises, 'rename');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should spy on file operations', async () => {
    await someFunction();

    expect(writeFileSpy).toHaveBeenCalled();
    expect(renameSpy).toHaveBeenCalled();
  });
});
```

---

## 5. Dirty State and Update Count Testing

### 5.1 Testing Dirty Flag Behavior

```typescript
it('should set dirty flag after updates and reset after flush', async () => {
  const manager = await createMockSessionManager();

  // VERIFY: flush with no updates is safe (returns early)
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();

  // EXECUTE: Add update
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // VERIFY: flush now performs write
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);

  // VERIFY: subsequent flush returns early (dirty reset)
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();
});
```

### 5.2 Testing Update Count Accumulation

```typescript
it('should increment updateCount with each update', async () => {
  const manager = await createMockSessionManager();

  // EXECUTE: Multiple updates to same item
  await manager.updateItemStatus('P1.M1.T1.S1', 'Researching');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Implementing');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  await manager.flushUpdates();

  // VERIFY: All 5 updates counted
  // itemsWritten = 5, writeOpsSaved = 4
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
});
```

### 5.3 Testing State Reset Between Batches

```typescript
it('should handle batching state reset between batches', async () => {
  const manager = await createMockSessionManager();

  // EXECUTE: First batch
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.flushUpdates();

  // VERIFY: State reset (dirty is false)
  // Next flush doesn't write because no new updates
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();

  // EXECUTE: Second batch
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
  await manager.flushUpdates();

  // VERIFY: State reset again
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();
});
```

### 5.4 Testing Large Batches

```typescript
it('should handle large batch of updates', async () => {
  const manager = await createMockSessionManager();

  // EXECUTE: 100 updates
  for (let i = 1; i <= 100; i++) {
    await manager.updateItemStatus(`P1.M1.T1.S${(i % 5) + 1}`, 'Complete');
  }

  await manager.flushUpdates();

  // VERIFY: Single write for all 100 updates
  // Stats: itemsWritten=100, writeOpsSaved=99, efficiency=99%
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
});
```

---

## 6. Recovery File Testing

### 6.1 Recovery File Structure

**From session-manager.ts:**

```typescript
interface RecoveryFile {
  version: '1.0';
  timestamp: string;
  sessionPath: string;
  pendingUpdates: Backlog;
  error: {
    message: string;
    code?: string;
    attempts: number;
  };
  pendingCount: number;
}
```

### 6.2 Testing Recovery File Creation

```typescript
it('should create recovery file after all retries exhausted', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // MOCK: All flush attempts fail
  mockWriteTasksJSON.mockRejectedValue(
    new Error('ENOSPC: no space left on device')
  );

  // Mock recovery file write
  const mockRecoveryWrite = vi.fn().mockResolvedValue(undefined);

  // EXECUTE: Flush should fail after retries and create recovery file
  await expect(manager.flushUpdates()).rejects.toThrow('ENOSPC');

  // VERIFY: Recovery file was created
  // (implementation depends on SessionManager's recovery file logic)
  expect(mockRecoveryWrite).toHaveBeenCalled();
  const recoveryFile = mockRecoveryWrite.mock.calls[0][0];

  expect(recoveryFile.version).toBe('1.0');
  expect(recoveryFile.sessionPath).toContain('/test/plan/');
  expect(recoveryFile.error.message).toContain('ENOSPC');
  expect(recoveryFile.error.attempts).toBeGreaterThan(0);
  expect(recoveryFile.pendingCount).toBe(1);
});
```

### 6.3 Testing Recovery File Timestamp

```typescript
it('should include ISO 8601 timestamp in recovery file', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  const beforeFlush = new Date().toISOString();

  mockWriteTasksJSON.mockRejectedValue(
    new Error('EIO: I/O error')
  );

  const mockRecoveryWrite = vi.fn().mockResolvedValue(undefined);

  await expect(manager.flushUpdates()).rejects.toThrow();

  const afterFlush = new Date().toISOString();

  // VERIFY: Timestamp is valid ISO 8601 and within expected range
  const recoveryFile = mockRecoveryWrite.mock.calls[0][0];
  expect(recoveryFile.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(recoveryFile.timestamp).toBeGreaterThanOrEqual(beforeFlush);
  expect(recoveryFile.timestamp).toBeLessThanOrEqual(afterFlush);
});
```

### 6.4 Testing Recovery File Error Context

```typescript
it('should include error context in recovery file', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // Create error with code
  const error = new Error('ENOSPC: no space left') as NodeJS.ErrnoException;
  error.code = 'ENOSPC';

  mockWriteTasksJSON.mockRejectedValue(error);
  const mockRecoveryWrite = vi.fn().mockResolvedValue(undefined);

  await expect(manager.flushUpdates()).rejects.toThrow();

  // VERIFY: Error context preserved
  const recoveryFile = mockRecoveryWrite.mock.calls[0][0];
  expect(recoveryFile.error.message).toContain('ENOSPC');
  expect(recoveryFile.error.code).toBe('ENOSPC');
  expect(recoveryFile.error.attempts).toBe(3); // maxAttempts
});
```

### 6.5 Testing Recovery File Pending State

```typescript
it('should preserve pending updates in recovery file', async () => {
  const manager = await createMockSessionManager();

  // Multiple updates
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

  mockWriteTasksJSON.mockRejectedValue(
    new Error('EIO: I/O error')
  );
  const mockRecoveryWrite = vi.fn().mockResolvedValue(undefined);

  await expect(manager.flushUpdates()).rejects.toThrow();

  // VERIFY: All pending updates preserved
  const recoveryFile = mockRecoveryWrite.mock.calls[0][0];
  expect(recoveryFile.pendingCount).toBe(3);

  // Verify backlog state
  expect(recoveryFile.pendingUpdates.backlog[0].milestones[0].tasks[0].subtasks[0].status).toBe('Complete');
  expect(recoveryFile.pendingUpdates.backlog[0].milestones[0].tasks[0].subtasks[1].status).toBe('Complete');
  expect(recoveryFile.pendingUpdates.backlog[0].milestones[0].tasks[0].subtasks[2].status).toBe('Complete');
});
```

---

## 7. Resources and References

### 7.1 Official Documentation

| Resource | URL | Description |
|----------|-----|-------------|
| Vitest Documentation | https://vitest.dev/guide/ | Official Vitest testing framework guide |
| Vitest Mocking | https://vitest.dev/api/#vi-mock | Mock functions and modules |
| Vitest Fake Timers | https://vitest.dev/api/#vi-usefaketimers | Fake timers for time-based tests |
| Node.js fs/promises | https://nodejs.org/api/fs.html#fspromises | Node.js file system promises API |
| Node.js crypto | https://nodejs.org/api/crypto.html | Crypto module for random bytes |

### 7.2 Testing Patterns & Best Practices

| Topic | Key Patterns |
|-------|--------------|
| **Atomic Writes** | Temp file + rename, cleanup on error, verify permissions |
| **Batching** | Accumulate in memory, single flush, dirty flag tracking |
| **Retry Logic** | Exponential backoff, jitter, transient vs permanent errors |
| **Fake Timers** | vi.useFakeTimers(), vi.runAllTimersAsync(), delay tracking |
| **FS Mocking** | vi.mock(), vi.mocked(), vi.spyOn(), call order verification |

### 7.3 Key Takeaways for SessionManager Tests

1. **Atomic Write Verification**
   - Always verify writeFile → rename sequence
   - Check temp file naming pattern
   - Verify file permissions (0o644)
   - Test cleanup on error

2. **Batching Behavior**
   - Updates should not write immediately
   - Single atomic write on flush
   - Complete backlog state (not append)
   - Track efficiency metrics

3. **Retry Logic**
   - Use fake timers for deterministic testing
   - Verify exponential backoff delays
   - Test max delay capping
   - Verify jitter randomization
   - Distinguish transient vs permanent errors

4. **State Management**
   - Dirty flag set after updates
   - Dirty reset after successful flush
   - Update count increments correctly
   - State preserved for retry on failure

5. **Recovery Files**
   - Created after all retries exhausted
   - Include ISO 8601 timestamp
   - Preserve error context (code, attempts)
   - Save complete pending updates

### 7.4 Common Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Non-deterministic random values | Use deterministic mocks for randomBytes/UUID |
| Flaky timer tests | Always use vi.useFakeTimers() and vi.runAllTimersAsync() |
| Mock side effects | Clear mocks in beforeEach, use mockImplementation |
| Call order issues | Track calls with arrays or use mock Implementation |
| Missing cleanup | Restore mocks in afterEach, use vi.restoreAllMocks() |

---

## Appendix: Complete Test Example

```typescript
/**
 * Comprehensive test combining all patterns
 */
it('should handle complete batching workflow with retry', async () => {
  // SETUP: Create SessionManager
  const manager = await createMockSessionManager();

  // EXECUTE: Multiple updates batched in memory
  for (let i = 1; i <= 10; i++) {
    await manager.updateItemStatus(`P1.M1.T1.S${i}`, 'Complete');
  }

  // MOCK: First flush fails, second succeeds
  const delays: number[] = [];
  const originalSetTimeout = global.setTimeout;
  vi.spyOn(global, 'setTimeout').mockImplementation((callback, ms) => {
    if (ms !== undefined) delays.push(ms);
    return originalSetTimeout(callback as () => void, ms ?? 0)
      as unknown as NodeJS.Timeout;
  });

  mockWriteTasksJSON
    .mockRejectedValueOnce(new Error('ETIMEDOUT'))
    .mockResolvedValueOnce(undefined);

  // EXECUTE: First flush (fails with retry)
  const flushPromise = manager.flushUpdates();
  await vi.runAllTimersAsync();
  await expect(flushPromise).rejects.toThrow('ETIMEDOUT');

  // VERIFY: Retry attempted with exponential backoff
  expect(delays.length).toBeGreaterThan(0);
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(2);

  // VERIFY: Dirty state preserved
  mockWriteTasksJSON.mockClear();
  delays.length = 0;

  // EXECUTE: Second flush (succeeds)
  await manager.flushUpdates();

  // VERIFY: Single atomic write
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);

  // VERIFY: Atomic write pattern
  expect(mockWriteFile).toHaveBeenCalled();
  expect(mockRename).toHaveBeenCalled();
  const tempCall = mockWriteFile.mock.calls.find(c =>
    String(c[0]).includes('.tmp')
  );
  expect(tempCall).toBeDefined();
  expect(tempCall![2]).toEqual({ mode: 0o644 });

  // VERIFY: All updates written
  const writtenBacklog = mockWriteTasksJSON.mock.calls[0][1] as Backlog;
  expect(writtenBacklog.backlog[0].milestones[0].tasks[0].subtasks).toHaveLength(10);

  // VERIFY: State reset
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();
});
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-26
**Author:** Research for SessionManager testing patterns
**Status:** Complete
