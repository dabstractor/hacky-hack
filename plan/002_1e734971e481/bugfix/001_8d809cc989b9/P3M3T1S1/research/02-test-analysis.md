# Test Analysis: "should add jitter to delay"

## Location

- **File**: `/home/dustin/projects/hacky-hack/tests/unit/utils/retry.test.ts`
- **Lines**: 590-632
- **Test Framework**: Vitest

## Test Code

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
  vi.spyOn(global, 'setTimeout').mockImplementation(
    (callback: (...args: unknown[]) => void, ms: number) => {
      delays.push(ms);
      return originalSetTimeout(callback, ms) as unknown as NodeJS.Timeout;
    }
  );

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

## Test Expectations

### Configuration

- `baseDelay: 1000` - Base delay of 1 second
- `jitterFactor: 0.2` - 20% jitter variance
- `maxAttempts: 3` - Will trigger 2 retries (attempts 1 and 2 fail, attempt 3 succeeds)

### Expected Behavior

The test expects delays to be within these ranges:

1. **First delay**: 800ms to 1200ms (1000ms +/- 200ms)
2. **Second delay**: 1600ms to 2400ms (2000ms +/- 400ms)

### Why the Test May Fail

With the current bidirectional jitter formula:

- Delay can be LESS than exponentialDelay (when jitter is negative)
- This violates the test's implicit expectation that jitter adds positive variance

### Test Methodology

- Uses `vi.spyOn(global, 'setTimeout')` to capture delay values
- Uses `vi.runAllTimersAsync()` for deterministic timing
- Validates that delays fall within expected variance bounds

## Related Tests in the Same File

The test file also includes:

- `should use exponential backoff` - Validates exponential delay growth
- `should cap delay at maxDelay` - Validates max delay cap
- Various retry behavior tests
