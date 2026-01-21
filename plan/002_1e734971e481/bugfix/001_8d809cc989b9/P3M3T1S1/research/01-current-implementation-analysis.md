# Current Implementation Analysis

## File: `/home/dustin/projects/hacky-hack/src/utils/retry.ts`

### Current Jitter Calculation (lines 247-269)

```typescript
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitterFactor: number
): number {
  // Exponential backoff with cap
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );

  // Full jitter: randomize around exponential delay
  // (Math.random() - 0.5) * 2 gives range [-1, 1]
  // Multiply by jitterFactor to scale variance
  const jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;

  // Ensure non-negative delay
  const delay = Math.max(0, Math.floor(exponentialDelay + jitter));

  return delay;
}
```

### Problem Analysis

**The Jitter Formula:**

```
jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2
```

**Component Analysis:**

- `Math.random()` returns a value in [0, 1)
- `Math.random() - 0.5` returns a value in [-0.5, 0.5)
- `(Math.random() - 0.5) * 2` returns a value in [-1, 1)
- Multiplying by `exponentialDelay * jitterFactor` scales this bidirectional range

**Result:** Jitter can be:

- **Negative**: When random < 0.5 (reduces delay below exponentialDelay)
- **Zero**: Approaches zero when random ≈ 0.5 (makes delay equal to exponentialDelay)
- **Positive**: When random > 0.5 (increases delay above exponentialDelay)

### Current Math.max(0, ...) Protection

The line `const delay = Math.max(0, Math.floor(exponentialDelay + jitter))` only prevents the final delay from being negative (less than 0). It does NOT ensure that `delay > exponentialDelay`.

### Why This Fails the Test

The test `'should add jitter to delay'` expects:

- With baseDelay=1000 and jitterFactor=0.2
- First delay should be > 800 AND < 1200 (1000 +/- 200)
- But current implementation can produce delays less than 1000 (when jitter is negative)

The test assertion `expect(delays[0]).toBeGreaterThan(800)` would pass, but the intent is that jitter should increase variance positively, not allow delays to be less than the base.
