# Testing Patterns Quick Reference: SessionManager Batching

**Quick Reference Guide**
**Target:** session-state-batching.test.ts enhancement

---

## Essential Patterns at a Glance

### Pattern 1: Atomic Write Verification

```typescript
// Quick template for testing atomic writes
it('should use atomic write pattern', async () => {
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // Track calls
  const callOrder: string[] = [];
  mockWriteFile.mockImplementation(async () => callOrder.push('writeFile'));
  mockRename.mockImplementation(async () => callOrder.push('rename'));

  await manager.flushUpdates();

  // Verify sequence
  expect(callOrder).toEqual(['writeFile', 'rename']);
  expect(mockWriteFile).toHaveBeenCalledWith(
    expect.stringContaining('.tmp'),
    expect.any(String),
    { mode: 0o644 }
  );
  expect(mockRename).toHaveBeenCalledWith(
    expect.stringContaining('.tmp'),
    expect.stringContaining('tasks.json')
  );
});
```

### Pattern 2: Batch Accumulation Verification

```typescript
// Quick template for batch testing
it('should batch updates in memory', async () => {
  const manager = await createMockSessionManager();

  // Track writes during batching
  let writeCount = 0;
  mockWriteTasksJSON.mockImplementation(async () => { writeCount++; });

  // Multiple updates
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

  // Verify no immediate writes
  expect(writeCount).toBe(0);

  // Flush and verify single write
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
});
```

### Pattern 3: Retry with Fake Timers

```typescript
// Quick template for retry testing
describe('with fake timers', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should retry with exponential backoff', async () => {
    const delays: number[] = [];
    vi.spyOn(global, 'setTimeout').mockImplementation((cb, ms) => {
      if (ms !== undefined) delays.push(ms);
      return originalSetTimeout(cb as () => void, ms ?? 0) as any;
    });

    // Setup failure then success
    mockWriteTasksJSON
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValueOnce(undefined);

    const promise = manager.flushUpdates();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.not.toThrow();

    // Verify exponential delays: 100, 200, 400...
    expect(delays[0]).toBe(100);
    expect(delays[1]).toBe(200);
  });
});
```

### Pattern 4: Dirty State Testing

```typescript
// Quick template for dirty flag
it('should manage dirty state correctly', async () => {
  const manager = await createMockSessionManager();

  // Initial flush - no writes
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();

  // Update - dirty set
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  mockWriteTasksJSON.mockClear();

  // Flush - writes and resets dirty
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);

  // Next flush - no writes (dirty reset)
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();
});
```

### Pattern 5: Mock Implementation

```typescript
// Mock implementation template
mockWriteTasksJSON.mockImplementation(
  async (sessionPath: string, backlog: Backlog) => {
    const tempPath = `${sessionPath}/.tasks.json.${randomHex}.tmp`;
    const targetPath = `${sessionPath}/tasks.json`;
    const content = JSON.stringify(backlog, null, 2);

    try {
      await mockWriteFile(tempPath, content, { mode: 0o644 });
      await mockRename(tempPath, targetPath);
    } catch (error) {
      await mockUnlink(tempPath).catch(() => {});
      throw error;
    }
  }
);
```

---

## Common Mock Setups

### Deterministic Random Values

```typescript
beforeEach(() => {
  (mockRandomBytes as any).mockReturnValue(
    Buffer.from('abc123def4567890', 'hex')
  );
  (mockRandomUUID as any).mockReturnValue('test-uuid-12345');
});
```

### Success/Failure Sequence

```typescript
// First N calls fail, rest succeed
mockWriteTasksJSON
  .mockRejectedValueOnce(new Error('ETIMEDOUT'))
  .mockRejectedValueOnce(new Error('ETIMEDOUT'))
  .mockResolvedValueOnce(undefined);
```

### Call Tracking

```typescript
const calls: Array<{fn: string; args: unknown[]}> = [];
mockWriteFile.mockImplementation(async (...args) => {
  calls.push({fn: 'writeFile', args});
});
mockRename.mockImplementation(async (...args) => {
  calls.push({fn: 'rename', args});
});
```

---

## Assertion Helpers

### Verify Temp File Pattern

```typescript
const getTempPath = () => {
  return mockWriteFile.mock.calls.find(c =>
    String(c[0]).includes('.tmp')
  )?.[0] as string;
};

expect(getTempPath()).toMatch(/\.tasks\.json\.[a-f0-9]{16}\.tmp$/);
```

### Verify Backlog State

```typescript
const getWrittenBacklog = () => {
  return mockWriteTasksJSON.mock.calls[0][1] as Backlog;
};

const backlog = getWrittenBacklog();
expect(backlog.backlog[0].milestones[0].tasks[0].subtasks[0].status).toBe('Complete');
```

### Verify Update Count

```typescript
// Verify N updates resulted in 1 write
for (let i = 1; i <= 10; i++) {
  await manager.updateItemStatus(`P1.M1.T1.S${i}`, 'Complete');
}
await manager.flushUpdates();
expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
```

---

## Test Checklist

### Atomic Write Tests
- [ ] Temp file created before rename
- [ ] Temp file follows naming pattern
- [ ] File permissions are 0o644
- [ ] Rename completes atomic write
- [ ] Temp file cleaned up on error
- [ ] Cleanup attempted on both write and rename failure

### Batching Tests
- [ ] Updates not written immediately
- [ ] Single atomic write for multiple updates
- [ ] Complete backlog state (not append)
- [ ] Efficiency metrics calculated
- [ ] Empty batch handled correctly
- [ ] Same item updated multiple times

### Retry Tests
- [ ] Transient errors trigger retry
- [ ] Permanent errors thrown immediately
- [ ] Exponential backoff used
- [ ] Max delay enforced
- [ ] Jitter applied
- [ ] Max attempts enforced
- [ ] Dirty state preserved for retry

### State Management Tests
- [ ] Dirty flag set after updates
- [ ] Dirty flag reset after flush
- [ ] Update count increments
- [ ] State reset between batches
- [ ] Large batches handled

### Recovery File Tests
- [ ] Created after all retries exhausted
- [ ] ISO 8601 timestamp included
- [ ] Error context preserved (code, attempts)
- [ ] Pending updates saved
- [ ] Pending count accurate

---

## Common Assertions

```typescript
// File operations
expect(mockWriteFile).toHaveBeenCalledWith(
  expect.stringContaining('.tmp'),
  expect.any(String),
  { mode: 0o644 }
);

expect(mockRename).toHaveBeenCalledWith(
  expect.stringContaining('.tmp'),
  expect.stringContaining('tasks.json')
);

expect(mockUnlink).toHaveBeenCalledWith(
  expect.stringContaining('.tmp')
);

// Batching
expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
expect(mockWriteTasksJSON).not.toHaveBeenCalled();

// Retry
expect(attempts).toBe(3);
expect(delays[0]).toBe(100);
expect(delays[1]).toBe(200);

// State
expect(callOrder).toEqual(['writeFile', 'rename']);
expect(writtenBacklog.backlog[0].milestones[0].tasks[0].subtasks[0].status).toBe('Complete');
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
import { getLogger } from '../utils/logger.js';

// In test
const logger = getLogger('SessionManager');
logger.level = 'debug';
```

### Inspect Mock Calls

```typescript
console.log('writeFile calls:', mockWriteFile.mock.calls);
console.log('rename calls:', mockRename.mock.calls);
console.log('writeTasksJSON calls:', mockWriteTasksJSON.mock.calls);
```

### Track Execution Flow

```typescript
const flow: string[] = [];
mockWriteFile.mockImplementation(async (...args) => {
  flow.push(`writeFile: ${args[0]}`);
  // ...
});

// After test
console.log('Execution flow:', flow);
```

---

**Quick Reference Version:** 1.0
**Last Updated:** 2026-01-26
