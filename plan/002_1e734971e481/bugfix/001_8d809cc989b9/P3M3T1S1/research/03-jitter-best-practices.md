# Jitter Calculation Best Practices Research

## Industry Sources

### 1. AWS Exponential Backoff and Jitter

**Source**: [AWS Architecture Blog - "Exponential Backoff and Jitter"](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
**Author**: Marc Brooker, AWS

**Key Insights:**

- "Full jitter" is the recommended approach
- Jitter should be a random value between 0 and the exponential delay
- This prevents the "thundering herd" problem effectively
- Formula: `delay = random_between(0, min(cap, base * 2^attempt))`

### 2. Google Cloud Architecture

**Source**: [Google Cloud - Retrying with Cloud Tasks](https://cloud.google.com/architecture/retrying-with-cloud-tasks)

**Key Insights:**

- Recommends exponential backoff with jitter for distributed systems
- Jitter helps spread out retry attempts
- Randomization prevents synchronized retry storms

### 3. Microsoft Azure Retry Pattern

**Source**: [Microsoft Azure - Retry Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/retry)

**Key Insights:**

- Provides implementation examples in multiple languages
- Jitter is essential for cloud-scale applications
- Different jitter strategies for different scenarios

## Jitter Strategies

### Strategy 1: Full Jitter (AWS Recommended)

```typescript
// Formula: delay = random_between(0, exponentialDelay)
const delay = Math.floor(Math.random() * exponentialDelay);
```

**Pros:**

- Simple implementation
- Best distribution of retries
- AWS-proven approach

**Cons:**

- Can produce very small delays (close to 0)
- May not respect minimum delay expectations

### Strategy 2: Equal Jitter

```typescript
// Formula: delay = (exponentialDelay / 2) + random(0, exponentialDelay / 2)
const halfDelay = exponentialDelay / 2;
const delay = Math.floor(halfDelay + Math.random() * halfDelay);
```

**Pros:**

- Guarantees minimum delay (half of exponential)
- More predictable retry behavior

**Cons:**

- Less distribution than full jitter
- Still can produce delays equal to base

### Strategy 3: Decorrelated Jitter

```typescript
// Formula: delay = min(cap, random(base, previousDelay * 3))
const delay = Math.min(
  maxDelay,
  Math.random() * (previousDelay * 3 - baseDelay) + baseDelay
);
```

**Pros:**

- Better for long-running operations
- Adapts based on previous delay

**Cons:**

- More complex state tracking
- Requires storing previous delay

### Strategy 4: Positive Jitter with Factor (Recommended for This Codebase)

```typescript
// Formula: jitter = exponentialDelay * jitterFactor * Math.random()
// Result: delay = exponentialDelay + jitter
const jitter = exponentialDelay * jitterFactor * Math.random();
const delay = Math.floor(exponentialDelay + jitter);
```

**Pros:**

- Maintains the existing `jitterFactor` parameter
- Always produces positive jitter (delay > exponentialDelay)
- Simple change from current implementation
- Preserves backward compatibility with jitterFactor semantics

**Cons:**

- Delays will always be greater than base (may increase average retry time)

## Why Positive Jitter Is Better

1. **Prevents Retry Storms**: Positive jitter ensures clients don't retry too quickly
2. **Respects Backoff Intent**: Exponential backoff is designed to increase delays over time
3. **Server Protection**: Gives services time to recover between retry waves
4. **Better Distribution**: Spreads retries across the full delay range
5. **Test Alignment**: Matches the test expectation that "jitter adds to delay"

## Recommended Fix for This Codebase

Based on PRD Issue 6 and the existing code structure:

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

  // POSITIVE jitter: always adds variance, never subtracts
  // Math.random() gives range [0, 1), so jitter is always >= 0
  const jitter = exponentialDelay * jitterFactor * Math.random();

  // Ensure delay is at least exponentialDelay + 1ms to guarantee strict inequality
  const delay = Math.max(1, Math.floor(exponentialDelay + jitter));

  return delay;
}
```

**Key Changes:**

1. Changed `(Math.random() - 0.5) * 2` to `Math.random()` for positive-only jitter
2. Ensures `delay > exponentialDelay` (always strictly greater)
3. Maintains the `jitterFactor` parameter for compatibility
4. Uses `Math.max(1, ...)` to ensure minimum 1ms positive addition

## Alternative: Update Test (Not Recommended)

The PRD mentions an alternative: "update test to allow >= instead of >"

**Why this is NOT recommended:**

1. The test's intent is correct - jitter SHOULD add positive variance
2. Allowing delays <= base defeats the purpose of jitter
3. Goes against industry best practices (AWS, Google, Microsoft)
4. Would require documentation changes explaining why bidirectional jitter is acceptable

**Conclusion**: Implement the calculation fix, not the test change.
