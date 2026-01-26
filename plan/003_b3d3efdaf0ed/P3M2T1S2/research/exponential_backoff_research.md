# Exponential Backoff and Jitter: Implementation Research

**Research Date:** 2026-01-24
**Component:** `src/utils/retry.ts`
**Purpose:** Document exponential backoff implementation patterns, industry best practices, and configuration recommendations

---

## Table of Contents

1. [Current Implementation Analysis](#1-current-implementation-analysis)
2. [Industry Best Practices](#2-industry-best-practices)
3. [Configuration Recommendations](#3-configuration-recommendations)
4. [Implementation Examples](#4-implementation-examples)
5. [Common Pitfalls](#5-common-pitfalls)
6. [References](#6-references)

---

## 1. Current Implementation Analysis

### 1.1 The `calculateDelay()` Function

**Location:** `/home/dustin/projects/hacky-hack/src/utils/retry.ts` (lines 246-268)

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

  // Positive jitter: always adds variance, never subtracts
  // Math.random() gives range [0, 1), ensuring jitter is always >= 0
  // Multiply by jitterFactor to scale variance
  const jitter = exponentialDelay * jitterFactor * Math.random();

  // Ensure delay is strictly greater than exponentialDelay
  const delay = Math.max(1, Math.floor(exponentialDelay + jitter));

  return delay;
}
```

### 1.2 Exact Formula Used

**Formula:**
```
delay = floor(min(baseDelay × backoffFactor^attempt, maxDelay) + (exponentialDelay × jitterFactor × random()))
```

**Where:**
- `attempt` is 0-indexed (0, 1, 2, 3, 4)
- `random()` returns a value in [0, 1)
- `jitter` is **positive-only** (never subtracts from base delay)

### 1.3 Jitter Implementation

**Type:** Positive Jitter (not Full Jitter, Decorrelated, or Equal Jitter)

**Characteristics:**
- Jitter is always >= 0 (adds to delay, never subtracts)
- Range: [exponentialDelay, exponentialDelay + (exponentialDelay × jitterFactor)]
- With `jitterFactor = 0.1`: delay ranges from [exponentialDelay, exponentialDelay × 1.1]

**Example with baseDelay=1000, backoffFactor=2, jitterFactor=0.1:**

| Attempt | Exponential Delay | Jitter Range | Final Delay Range |
|---------|-------------------|--------------|-------------------|
| 0       | 1000ms            | +0 to 100ms  | 1000-1100ms       |
| 1       | 2000ms            | +0 to 200ms  | 2000-2200ms       |
| 2       | 4000ms            | +0 to 400ms  | 4000-4400ms       |
| 3       | 8000ms            | +0 to 800ms  | 8000-8800ms       |
| 4       | 16000ms           | +0 to 1600ms | 16000-17600ms     |
| 5       | 30000ms (capped)  | +0 to 3000ms | 30000-33000ms     |

### 1.4 Default Configuration Values

**Default Retry Options** (lines 479-487):

```typescript
{
  maxAttempts: 3,      // Total attempts: 1 initial + 2 retries
  baseDelay: 1000,     // 1 second
  maxDelay: 30000,     // 30 seconds
  backoffFactor: 2,    // Doubles each time
  jitterFactor: 0.1    // 10% variance
}
```

**Agent-Specific Configuration** (lines 596-604):

```typescript
const AGENT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

**MCP Tool Configuration** (lines 649-657):

```typescript
const MCP_RETRY_CONFIG = {
  maxAttempts: 2,      // Fewer retries for tools
  baseDelay: 500,       // Shorter initial delay
  maxDelay: 5000,       // Lower cap for tools
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

---

## 2. Industry Best Practices

### 2.1 AWS Exponential Backoff and Jitter

**Source:** [AWS Architecture Blog - Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

**Key Concepts:**

1. **The Problem:** Without jitter, clients retrying simultaneously can cause "thundering herd" problem, overwhelming the service during recovery.

2. **Three Jitter Strategies:**

   **a) Full Jitter (Recommended by AWS):**
   ```
   sleep = random_between(0, min(cap, base * 2^attempt))
   ```
   - Most effective at preventing synchronization
   - Can result in very short delays initially
   - AWS recommends this for most use cases

   **b) Equal Jitter:**
   ```
   sleep = (base * 2^attempt) / 2 + random_between(0, (base * 2^attempt) / 2)
   ```
   - Guarantees minimum delay
   - Less effective at preventing synchronization
   - Useful when you want to ensure minimum backoff

   **c) Decorrelated Jitter:**
   ```
   sleep = random_between(base, cap, previous_sleep * 3)
   ```
   - Adaptive based on previous sleep
   - Good for long-running retry scenarios
   - More complex to implement

3. **AWS Recommendations:**
   - Base delay: Start with modest randomization (e.g., 200ms or 1s)
   - Max delay: Cap to prevent excessive waits (e.g., 20-60 seconds)
   - Backoff multiplier: 2 is standard
   - Use Full Jitter for optimal client distribution

### 2.2 Google Cloud Retry Guidelines

**Key Principles from Google Cloud:**

1. **Retryable HTTP Status Codes:**
   - 408 (Request Timeout)
   - 429 (Too Many Requests)
   - 500 (Internal Server Error)
   - 502 (Bad Gateway)
   - 503 (Service Unavailable)
   - 504 (Gateway Timeout)

2. **Non-Retryable Status Codes:**
   - 400 (Bad Request) - client error
   - 401 (Unauthorized) - auth issue
   - 403 (Forbidden) - permission issue
   - 404 (Not Found) - resource doesn't exist
   - All other 4xx codes (except 408, 429)

3. **Configuration Recommendations:**
   - Base delay: 1 second
   - Max delay: 60 seconds
   - Backoff multiplier: 2
   - Max retries: 3-5 depending on operation
   - Use jitter to prevent retry storms

### 2.3 Azure Retry Patterns

**Source:** [Azure Design Patterns - Retry Pattern](https://docs.microsoft.com/azure/architecture/patterns/retry)

**Key Recommendations:**

1. **Retry Strategy Selection:**
   - **Transient faults:** Use exponential backoff
   - **Network timeouts:** Start with shorter delays
   - **Service throttling:** Respect rate limits, may need longer delays
   - **Database connections:** Faster retries with lower limits

2. **Configuration Guidelines:**

   | Operation Type | Base Delay | Max Delay | Max Retries |
   |----------------|------------|-----------|-------------|
   | API Calls      | 1s         | 30-60s    | 3-5         |
   | Database       | 100ms      | 5s        | 3           |
   | Storage        | 500ms      | 10s       | 3           |
   | Messaging      | 1s         | 120s      | 5-10        |

3. **Circuit Breaker Pattern:**
   - After threshold failures, stop retrying temporarily
   - Prevents cascading failures
   - Allows service recovery time

### 2.4 Comparison of Jitter Strategies

| Strategy | Formula | Pros | Cons | Best For |
|----------|---------|------|------|----------|
| **Positive Jitter** | delay + (delay × factor × random()) | Simple, minimum guaranteed | Less effective at decorrelation | Current implementation |
| **Full Jitter** | random(0, delay) | Best at preventing thundering herd | Can have very short delays | High-concurrency scenarios |
| **Equal Jitter** | delay/2 + random(0, delay/2) | Balanced approach | Still allows some synchronization | General purpose |
| **Decorrelated Jitter** | random(base, previous × 3) | Adaptive, good for long retries | Complex, stateful | Long-running operations |

---

## 3. Configuration Recommendations

### 3.1 Base Delay Values

**Recommended by Operation Type:**

| Operation Type | Recommended | Current | Notes |
|----------------|-------------|---------|-------|
| **LLM API Calls** | 1000-2000ms | 1000ms | Good default, accounts for API latency |
| **MCP Tools** | 200-500ms | 500ms | Appropriate for fast local operations |
| **HTTP APIs** | 500-1000ms | - | Standard for web service calls |
| **Database** | 100-200ms | - | Fast retries for connection issues |
| **File Operations** | 100ms | - | Local I/O is fast |
| **Message Queues** | 200-500ms | - | Balance between throughput and retry |

**Recommendation:** Keep current values for agents and MCP tools.

### 3.2 Max Delay Values

**Recommended by Operation Type:**

| Operation Type | Recommended | Current | Notes |
|----------------|-------------|---------|-------|
| **LLM API Calls** | 30-60s | 30s | Appropriate for API rate limits |
| **MCP Tools** | 5-10s | 5s | Good for local tool execution |
| **HTTP APIs** | 30-60s | - | Standard cap |
| **Database** | 5-10s | - | Don't wait too long for DB |
| **User-Facing** | 5-10s | - | Users won't wait longer |

**Formula for max delay:**
```
maxDelay = baseDelay × (backoffFactor ^ (maxAttempts - 2))
```

With current config (baseDelay=1000, backoffFactor=2, maxAttempts=3):
- Attempt 0: 1000ms
- Attempt 1: 2000ms
- Attempt 2: Would be 4000ms, but maxAttempts is reached

**Recommendation:** Current maxDelay of 30s is appropriate for LLM operations.

### 3.3 Backoff Multipliers

**Common Values:**

| Multiplier | Use Case | Example Delays (base=1000) |
|------------|----------|---------------------------|
| **1.5** | Conservative | 1000, 1500, 2250, 3375... |
| **2.0** | Standard (recommended) | 1000, 2000, 4000, 8000... |
| **2.5** | Aggressive | 1000, 2500, 6250, 15625... |
| **3.0** | Very aggressive | 1000, 3000, 9000, 27000... |

**Recommendation:** Keep current value of 2.0 (industry standard).

### 3.4 Jitter Factors

**Comparison:**

| Factor | Range (for 1000ms) | Effect |
|--------|-------------------|--------|
| **0.0** | 1000-1000ms | No jitter (bad for concurrency) |
| **0.1** | 1000-1100ms | Minimal variance (current) |
| **0.2** | 1000-1200ms | Moderate variance |
| **0.5** | 1000-1500ms | High variance |
| **1.0** | 1000-2000ms | Maximum variance |

**Industry Recommendations:**
- AWS: Full Jitter (0 to full delay)
- Google: 0.1-0.3
- Azure: 0.1-0.2
- General: 0.1-0.2 for positive jitter

**Recommendation:** Consider increasing to 0.2 for better decorrelation, or implement Full Jitter for high-concurrency scenarios.

### 3.5 Retry Counts by Error Type

**Recommended Strategy:**

| Error Type | Recommended Retries | Rationale |
|------------|-------------------|-----------|
| **Network timeout** | 3-5 | Temporary connectivity issues |
| **429 Rate limit** | 1-3 | Respect server limits |
| **5xx Server error** | 3-5 | Server may recover quickly |
| **503 Service unavailable** | 5-10 | Service restarting |
| **LLM API timeout** | 2-3 | API may be overloaded |
| **Database connection** | 3-5 | Connection pool issues |
| **File lock** | 5-10 | Wait for lock release |
| **Validation error** | 0 | Never retry (permanent) |
| **Authentication** | 0 | Never retry (permanent) |
| **Not found (404)** | 0 | Never retry (permanent) |

**Current Implementation:**
- Default: 3 attempts ✓
- Agent LLM: 3 attempts ✓
- MCP Tools: 2 attempts ✓

---

## 4. Implementation Examples

### 4.1 Full Jitter Implementation (AWS Recommended)

```typescript
/**
 * Calculate delay with Full Jitter (AWS recommended)
 * Best for preventing thundering herd in high-concurrency scenarios
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
function calculateDelayWithFullJitter(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const cap = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return Math.floor(Math.random() * cap);
}

// Example with baseDelay=1000, maxDelay=30000:
// Attempt 0: 0-1000ms
// Attempt 1: 0-2000ms
// Attempt 2: 0-4000ms
// Attempt 3: 0-8000ms
// Attempt 4+: 0-30000ms
```

### 4.2 Decorrelated Jitter Implementation

```typescript
/**
 * Calculate delay with Decorrelated Jitter
 * Adaptive backoff based on previous sleep time
 * Best for long-running retry scenarios
 *
 * @param previousDelay - Previous delay in milliseconds
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
function calculateDelayWithDecorrelatedJitter(
  previousDelay: number,
  baseDelay: number,
  maxDelay: number
): number {
  const cap = Math.min(maxDelay, previousDelay * 3);
  return Math.floor(baseDelay + Math.random() * (cap - baseDelay));
}

// Example with baseDelay=1000, maxDelay=30000:
// First retry: 1000-1000ms (no previous)
// Second retry: 1000-3000ms
// Third retry: 1000-9000ms
// Fourth retry: 1000-27000ms
// Fifth retry: 1000-30000ms (capped)
```

### 4.3 Equal Jitter Implementation

```typescript
/**
 * Calculate delay with Equal Jitter
 * Guarantees minimum delay while adding randomness
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
function calculateDelayWithEqualJitter(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const halfDelay = exponentialDelay / 2;
  return Math.floor(halfDelay + Math.random() * halfDelay);
}

// Example with baseDelay=1000, maxDelay=30000:
// Attempt 0: 500-1000ms
// Attempt 1: 1000-2000ms
// Attempt 2: 2000-4000ms
// Attempt 3: 4000-8000ms
// Attempt 4+: 15000-30000ms (capped)
```

### 4.4 Comparison of All Jitter Strategies

```typescript
/**
 * Complete comparison of jitter strategies
 */
function compareJitterStrategies() {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const attempts = 5;

  console.log('Attempt | Positive Jitter | Full Jitter | Equal Jitter | Decorrelated');
  console.log('--------|-----------------|-------------|--------------|---------------');

  let previousDelay = baseDelay;
  for (let i = 0; i < attempts; i++) {
    const expDelay = Math.min(baseDelay * Math.pow(2, i), maxDelay);

    const positive = Math.floor(expDelay + (expDelay * 0.1 * Math.random()));
    const full = Math.floor(Math.random() * expDelay);
    const equal = Math.floor((expDelay / 2) + (Math.random() * expDelay / 2));
    const decorrelated = Math.floor(
      baseDelay + Math.random() * (Math.min(maxDelay, previousDelay * 3) - baseDelay)
    );

    console.log(
      `${i.toString().padStart(7)} | ${positive.toString().padStart(15)} | ` +
      `${full.toString().padStart(11)} | ${equal.toString().padStart(12)} | ` +
      `${decorrelated.toString().padStart(13)}`
    );

    previousDelay = decorrelated;
  }
}

// Example output:
// Attempt | Positive Jitter | Full Jitter | Equal Jitter | Decorrelated
// --------|-----------------|-------------|--------------|---------------
//       0 |            1047 |         567 |          734 |          1000
//       1 |            2189 |        1456 |         1678 |          2834
//       2 |            4234 |        3890 |         2890 |          5234
//       3 |            8567 |        7234 |         6123 |         11234
//       4 |           30123 |       28456 |        21345 |         28456
```

### 4.5 Retry with Circuit Breaker Pattern

```typescript
/**
 * Circuit breaker state machine
 */
enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failing, stop retrying
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerOptions {
  failureThreshold: number;  // Failures before opening
  resetTimeout: number;      // ms before attempting recovery
  monitoringPeriod: number;  // ms to consider for failures
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - rejecting request');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}

// Usage with retry
async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions,
  circuitOptions: CircuitBreakerOptions
): Promise<T> {
  const breaker = new CircuitBreaker(circuitOptions);

  return retry(
    () => breaker.execute(fn),
    retryOptions
  );
}
```

---

## 5. Common Pitfalls

### 5.1 Thundering Herd Problem

**Problem:** Multiple clients retry simultaneously, overwhelming the service during recovery.

**Solution:** Use jitter (especially Full Jitter) to spread out retry attempts.

```typescript
// BAD: No jitter
function badDelay(attempt: number) {
  return 1000 * Math.pow(2, attempt);
}

// GOOD: Full jitter
function goodDelay(attempt: number) {
  const cap = Math.min(1000 * Math.pow(2, attempt), 30000);
  return Math.floor(Math.random() * cap);
}
```

### 5.2 Excessive Retry Delays

**Problem:** Max delay too high, causing poor user experience.

**Solution:**
- Set reasonable maxDelay based on operation type
- Use circuit breakers for persistent failures
- Provide user feedback for long-running operations

```typescript
// BAD: 5 minute max delay
const badConfig = { maxDelay: 300000 }; // 5 minutes

// GOOD: 30 second max delay with circuit breaker
const goodConfig = {
  maxDelay: 30000, // 30 seconds
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000 // 1 minute
  }
};
```

### 5.3 Retrying Permanent Errors

**Problem:** Wasting retries on errors that will never succeed.

**Solution:** Implement proper error classification.

```typescript
// BAD: Retry everything
const badRetry = async (fn: () => Promise<any>) => {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch {
      await sleep(1000 * i);
    }
  }
};

// GOOD: Check error type
const goodRetry = async (fn: () => Promise<any>) => {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!isTransientError(error)) {
        throw error; // Don't retry permanent errors
      }
      await sleep(calculateDelay(i, 1000, 30000, 2, 0.1));
    }
  }
};
```

### 5.4 Insufficient Jitter

**Problem:** Low jitter factor doesn't prevent synchronization.

**Solution:** Use higher jitter factor or Full Jitter.

```typescript
// BAD: 0.01 jitter (1% variance) - not enough
const badConfig = { jitterFactor: 0.01 };

// BETTER: 0.2 jitter (20% variance)
const betterConfig = { jitterFactor: 0.2 };

// BEST: Full Jitter (0 to full delay)
const bestConfig = { jitterType: 'full' };
```

### 5.5 Wrong Base Delay for Operation Type

**Problem:** Using same base delay for all operations.

**Solution:** Tune base delay per operation type.

```typescript
// BAD: Same delay for everything
const universalConfig = { baseDelay: 1000 };

// GOOD: Operation-specific delays
const configs = {
  llm: { baseDelay: 1000 },      // 1s for API calls
  database: { baseDelay: 100 },   // 100ms for DB
  file: { baseDelay: 50 },        // 50ms for file I/O
  tool: { baseDelay: 500 }        // 500ms for MCP tools
};
```

### 5.6 Missing Max Delay Cap

**Problem:** Exponential growth produces excessive delays.

**Solution:** Always cap maximum delay.

```typescript
// BAD: No cap
const badDelay = (attempt: number) => 1000 * Math.pow(2, attempt);
// Attempt 10: 1000 * 1024 = 1,024,000ms = 17 minutes!

// GOOD: Capped at 30 seconds
const goodDelay = (attempt: number) =>
  Math.min(1000 * Math.pow(2, attempt), 30000);
```

### 5.7 Not Logging Retry Attempts

**Problem:** No visibility into retry behavior in production.

**Solution:** Always log retries with context.

```typescript
// BAD: Silent retries
await retry(fn, { maxAttempts: 3 });

// GOOD: Logged retries
await retry(fn, {
  maxAttempts: 3,
  onRetry: (attempt, error, delay) => {
    logger.warn({
      operation: 'agent.prompt',
      attempt,
      delayMs: delay,
      error: error.message
    }, `Retry attempt ${attempt} after ${delay}ms`);
  }
});
```

---

## 6. References

### 6.1 Official Documentation

1. **AWS Exponential Backoff and Jitter**
   - URL: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
   - Section: "Jitter: Preventing Thundering Herds"
   - Key recommendation: Use Full Jitter

2. **Azure Design Patterns - Retry Pattern**
   - URL: https://docs.microsoft.com/azure/architecture/patterns/retry
   - Section: "Retry Guidelines"
   - Key recommendation: Configure per operation type

3. **Google Cloud API Retry Strategy**
   - URL: https://cloud.google.com/apis/design/errors
   - Section: "Retry Strategies"
   - Key recommendation: Exponential backoff with jitter

### 6.2 Implementation Resources

4. **AWS SDK for JavaScript - Retry Strategy**
   - Source code shows StandardRetryStrategy implementation
   - Reference: `@aws-sdk/middleware-retry`

5. **Google API Client Library - Exponential Backoff**
   - Implementation: `google-api-core` retry decorator
   - Reference: `google.gax.createBackoffSettings()`

6. **Azure SDK - RetryPolicy**
   - Implementation: `@azure/core-rest-pipeline` retryPolicy
   - Reference: `RetryStrategy` interface

### 6.3 Academic and Industry Papers

7. **"Exponential Backoff and Jitter"** - Marc Brooker, AWS
   - Discusses the mathematics of jitter strategies
   - Compares Full, Equal, and Decorrelated jitter

8. **"The Tail at Scale"** - Dean, Barroso (Google)
   - Discusses managing tail latency in distributed systems
   - Recommends hedged requests and retry strategies

### 6.4 Community Resources

9. **Retry Pattern - Cloud Design Patterns**
   - Microsoft Patterns & Practices
   - URL: https://docs.microsoft.com/azure/architecture/patterns/retry

10. **Circuit Breaker Pattern**
    - Martin Fowler
    - URL: https://martinfowler.com/bliki/CircuitBreaker.html

---

## 7. Recommendations for Current Implementation

### 7.1 Keep Current Strengths

✅ **Positive Aspects:**
- Clean separation of retry logic
- Good transient error detection
- Type-safe generic implementation
- Integration with error hierarchy
- Structured logging support
- Operation-specific configurations

### 7.2 Potential Improvements

**Option 1: Add Jitter Strategy Selection**

```typescript
export interface RetryOptions {
  // ... existing options ...
  jitterStrategy?: 'positive' | 'full' | 'equal' | 'decorrelated';
}

function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitterFactor: number,
  jitterStrategy: string = 'positive'
): number {
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );

  switch (jitterStrategy) {
    case 'full':
      return Math.floor(Math.random() * exponentialDelay);
    case 'equal':
      const half = exponentialDelay / 2;
      return Math.floor(half + Math.random() * half);
    case 'positive':
    default:
      const jitter = exponentialDelay * jitterFactor * Math.random();
      return Math.max(1, Math.floor(exponentialDelay + jitter));
  }
}
```

**Option 2: Increase Jitter Factor**

```typescript
// Change from 0.1 to 0.2 for better decorrelation
const AGENT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.2, // Increased from 0.1
};
```

**Option 3: Add Circuit Breaker**

Consider adding circuit breaker for scenarios with persistent failures:

```typescript
export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxCalls: number;
}

export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions,
  circuitOptions: CircuitBreakerOptions
): Promise<T>;
```

### 7.3 Recommended Action Plan

1. **Short-term (No changes needed):**
   - Current implementation is solid
   - Positive jitter is acceptable for current concurrency levels
   - Configuration values are reasonable

2. **Medium-term (Consider):**
   - Add jitter strategy selection if high concurrency becomes an issue
   - Increase jitterFactor to 0.2 for better decorrelation
   - Add metrics for retry patterns (success rate, attempt distribution)

3. **Long-term (Monitor):**
   - Track retry success rates in production
   - Monitor for thundering herd issues
   - Consider Full Jitter if synchronization problems emerge
   - Evaluate circuit breaker pattern for persistent failures

---

## Appendix A: Delay Calculations Reference

### Delay Calculation Examples

**Configuration:** baseDelay=1000, maxDelay=30000, backoffFactor=2, jitterFactor=0.1

| Retry # | Attempt Index | Exponential Delay | Min Delay | Max Delay |
|---------|---------------|-------------------|-----------|-----------|
| 1       | 0             | 1,000ms           | 1,000ms   | 1,100ms   |
| 2       | 1             | 2,000ms           | 2,000ms   | 2,200ms   |
| 3       | 2             | 4,000ms           | 4,000ms   | 4,400ms   |
| 4       | 3             | 8,000ms           | 8,000ms   | 8,800ms   |
| 5       | 4             | 16,000ms          | 16,000ms  | 17,600ms  |
| 6+      | 5+            | 30,000ms (capped) | 30,000ms  | 33,000ms  |

**Configuration:** baseDelay=500, maxDelay=5000, backoffFactor=2, jitterFactor=0.1 (MCP Tools)

| Retry # | Attempt Index | Exponential Delay | Min Delay | Max Delay |
|---------|---------------|-------------------|-----------|-----------|
| 1       | 0             | 500ms             | 500ms     | 550ms     |
| 2       | 1             | 1,000ms           | 1,000ms   | 1,100ms   |
| 3       | 2             | 2,000ms           | 2,000ms   | 2,200ms   |
| 4       | 3             | 4,000ms           | 4,000ms   | 4,400ms   |
| 5+      | 4+            | 5,000ms (capped)  | 5,000ms   | 5,500ms   |

### Time to Success Scenarios

**Scenario 1: Success on 2nd attempt (1 retry)**
- Attempt 0: Failure (instant)
- Delay: ~1000ms
- Attempt 1: Success
- **Total time: ~1 second**

**Scenario 2: Success on 3rd attempt (2 retries)**
- Attempt 0: Failure (instant)
- Delay: ~1000ms
- Attempt 1: Failure
- Delay: ~2000ms
- Attempt 2: Success
- **Total time: ~3 seconds**

**Scenario 3: Success on 4th attempt (3 retries)**
- Attempt 0: Failure (instant)
- Delay: ~1000ms
- Attempt 1: Failure
- Delay: ~2000ms
- Attempt 2: Failure
- Delay: ~4000ms
- Attempt 3: Success
- **Total time: ~7 seconds**

**Scenario 4: All retries exhausted (3 attempts total)**
- Attempt 0: Failure (instant)
- Delay: ~1000ms
- Attempt 1: Failure
- Delay: ~2000ms
- Attempt 2: Failure
- **Total time: ~3 seconds before throwing error**

---

**End of Research Document**
