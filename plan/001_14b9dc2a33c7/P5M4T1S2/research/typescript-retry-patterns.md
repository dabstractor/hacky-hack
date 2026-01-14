# TypeScript/Node.js Retry Logic Best Practices Research

## Executive Summary

This document compiles industry best practices for implementing retry logic in TypeScript/Node.js applications, focusing on production-ready patterns, configuration guidelines, and common pitfalls.

---

## Table of Contents

1. [Exponential Backoff Implementation Patterns](#1-exponential-backoff-implementation-patterns)
2. [Transient Error Detection Strategies](#2-transient-error-detection-strategies)
3. [Retry Decorator vs Function Wrapper Patterns](#3-retry-decorator-vs-function-wrapper-patterns)
4. [Configuration Best Practices](#4-configuration-best-practices)
5. [Jitter and Randomization](#5-jitter-and-randomization)
6. [Logging and Observability](#6-logging-and-observability)
7. [TypeScript Type Safety](#7-typescript-type-safety)
8. [Common Pitfalls and Anti-Patterns](#8-common-pitfalls-and-anti-patterns)
9. [Recommended Libraries](#9-recommended-libraries)
10. [Key References](#10-key-references)

---

## 1. Exponential Backoff Implementation Patterns

### 1.1 Basic Formula

The fundamental exponential backoff formula:

```typescript
delay = min(baseDelay * (2 ^ attemptNumber), maxDelay) + jitter;
```

### 1.2 Implementation Pattern

```typescript
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor?: number; // Default: 2
}

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, backoffFactor = 2 } = options;

  let lastError: Error;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if this is the last attempt
      if (attempt >= maxAttempts - 1) {
        throw error;
      }

      // Calculate exponential delay
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      // Wait before next attempt
      await sleep(exponentialDelay);
      attempt++;
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 1.3 Progressive Backoff Delays

With `baseDelay: 1000`, `backoffFactor: 2`, `maxDelay: 30000`:

| Attempt | Delay (ms) | Delay (seconds) |
| ------- | ---------- | --------------- |
| 1       | 1000       | 1s              |
| 2       | 2000       | 2s              |
| 3       | 4000       | 4s              |
| 4       | 8000       | 8s              |
| 5       | 16000      | 16s             |
| 6       | 30000      | 30s (capped)    |

---

## 2. Transient Error Detection Strategies

### 2.1 Network Error Codes

Node.js system errors that are typically transient:

```typescript
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET', // Connection reset by peer
  'ECONNREFUSED', // Connection refused
  'ETIMEDOUT', // Connection timeout
  'ENOTFOUND', // DNS lookup failed
  'EPIPE', // Broken pipe
  'EAI_AGAIN', // DNS temporary failure
  'EHOSTUNREACH', // Host unreachable
  'ENETUNREACH', // Network unreachable
  'ECONNABORTED', // Connection aborted
]);
```

### 2.2 HTTP Status Codes

HTTP status codes that should trigger retries:

```typescript
const RETRYABLE_HTTP_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);
```

### 2.3 Comprehensive Error Classification

```typescript
interface RetryableError extends Error {
  code?: string;
  response?: {
    status?: number;
    headers?: Record<string, string>;
  };
}

function isTransientError(error: unknown): boolean {
  // Null/undefined check
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as RetryableError;

  // Check Node.js system error code
  if (err.code && TRANSIENT_ERROR_CODES.has(err.code)) {
    return true;
  }

  // Check HTTP status code
  const status = err.response?.status;
  if (status && RETRYABLE_HTTP_STATUS_CODES.has(status)) {
    return true;
  }

  // Check error message patterns
  const message = err.message?.toLowerCase() || '';
  const TRANSIENT_PATTERNS = [
    'network error',
    'timeout',
    'temporarily unavailable',
    'service unavailable',
    'connection reset',
    'connection refused',
  ];

  return TRANSIENT_PATTERNS.some(pattern => message.includes(pattern));
}
```

### 2.4 Non-Retryable Errors

Errors that should **never** be retried:

```typescript
const NON_RETRYABLE_HTTP_STATUS_CODES = new Set([
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  409, // Conflict (may need retry with backoff, context-dependent)
  410, // Gone
  422, // Unprocessable Entity
]);

// Client errors (4xx) except 408 and 429 are typically non-retryable
function isNonRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as RetryableError;
  const status = err.response?.status;

  if (status && status >= 400 && status < 500) {
    return status !== 408 && status !== 429;
  }

  return false;
}
```

---

## 3. Retry Decorator vs Function Wrapper Patterns

### 3.1 Function Wrapper Pattern (Recommended)

**Advantages:**

- Simpler, more straightforward
- Works with all TypeScript versions
- Better IDE autocomplete and type inference
- Easier to test and debug
- No experimental decorator flag needed

```typescript
interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: RetryConfig = {}
): T {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    isRetryable = isTransientError,
    onRetry,
  } = config;

  return (async (...args: Parameters<T>) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!isRetryable(error) || attempt >= maxAttempts - 1) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        // Call retry callback
        onRetry?.(attempt + 1, error);

        await sleep(delay);
      }
    }

    throw lastError;
  }) as T;
}

// Usage
const fetchWithRetry = createRetryWrapper(
  async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error: RetryableError = new Error(`HTTP ${response.status}`);
      error.response = { status: response.status };
      throw error;
    }
    return response.json();
  },
  {
    maxAttempts: 5,
    baseDelay: 500,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error);
    },
  }
);
```

### 3.2 Decorator Pattern

**Advantages:**

- Declarative syntax
- Clean method definitions
- Consistent application across methods

**Disadvantages:**

- Requires `experimentalDecorators` TypeScript flag
- More complex type inference
- Harder to test in isolation

```typescript
// Requires tsconfig.json: "experimentalDecorators": true

function Retry(config: RetryConfig = {}) {
  return function <T extends (this: any, ...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: any, ...args: Parameters<T>) {
      const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        isRetryable = isTransientError,
        onRetry,
      } = config;

      let lastError: unknown;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (!isRetryable(error) || attempt >= maxAttempts - 1) {
            throw error;
          }

          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

          onRetry?.(attempt + 1, error);
          await sleep(delay);
        }
      }

      throw lastError;
    } as T;

    return descriptor;
  };
}

// Usage
class ApiService {
  @Retry({ maxAttempts: 5, baseDelay: 500 })
  async fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}
```

### 3.3 Hybrid Approach: Higher-Order Function with Class Methods

```typescript
function wrapMethodWithRetry<T extends object>(
  instance: T,
  methodName: keyof T,
  config: RetryConfig
): void {
  const originalMethod = instance[methodName] as (...args: any[]) => any;
  const wrapped = createRetryWrapper(originalMethod.bind(instance), config);
  instance[methodName] = wrapped as any;
}

// Usage
class ApiService {
  constructor() {
    wrapMethodWithRetry(this, 'fetchUser', { maxAttempts: 5 });
  }

  async fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}
```

---

## 4. Configuration Best Practices

### 4.1 Recommended Default Values

| Parameter     | Recommended Range | Default  | Description                      |
| ------------- | ----------------- | -------- | -------------------------------- |
| maxAttempts   | 3-5               | 3        | Maximum number of retry attempts |
| baseDelay     | 100-1000 ms       | 500 ms   | Initial delay before first retry |
| maxDelay      | 10000-60000 ms    | 30000 ms | Maximum delay cap (30 seconds)   |
| backoffFactor | 2-3               | 2        | Exponential backoff multiplier   |

### 4.2 Context-Specific Guidelines

```typescript
// For internal microservice calls (low latency, highly available)
const INTERNAL_SERVICE_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 5000,
};

// For external API calls (higher latency, less reliable)
const EXTERNAL_API_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 60000,
};

// For database operations (may need longer for recovery)
const DATABASE_CONFIG: RetryConfig = {
  maxAttempts: 4,
  baseDelay: 500,
  maxDelay: 10000,
};

// For file operations (typically faster recovery)
const FILE_IO_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 200,
  maxDelay: 2000,
};
```

### 4.3 Timeout Configuration

```typescript
interface RetryWithTimeoutConfig extends RetryConfig {
  operationTimeout?: number; // Per-attempt timeout
  totalTimeout?: number; // Overall timeout including retries
}

async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  config: RetryWithTimeoutConfig
): Promise<T> {
  const { operationTimeout, totalTimeout, ...retryConfig } = config;

  const startTime = Date.now();

  return retryWithExponentialBackoff(async () => {
    // Check total timeout
    if (totalTimeout && Date.now() - startTime > totalTimeout) {
      throw new Error('Total timeout exceeded');
    }

    // Wrap with per-attempt timeout
    if (operationTimeout) {
      return Promise.race([
        fn(),
        sleep(operationTimeout).then(() => {
          throw new Error('Operation timeout');
        }),
      ]);
    }

    return fn();
  }, retryConfig);
}
```

---

## 5. Jitter and Randomization

### 5.1 The Thundering Herd Problem

When multiple clients retry simultaneously after a failure, they can overwhelm the system. Jitter randomizes retry delays to distribute requests over time.

### 5.2 Jitter Strategies

#### Full Jitter (Recommended)

```typescript
function fullJitter(baseDelay: number, attempt: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  return Math.random() * exponentialDelay;
}

// Example: baseDelay=1000, attempt=2
// exponentialDelay = 4000
// result = 0 to 4000ms (random)
```

#### Equal Jitter

```typescript
function equalJitter(baseDelay: number, attempt: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const half = exponentialDelay / 2;
  return half + Math.random() * half;
}

// Example: baseDelay=1000, attempt=2
// exponentialDelay = 4000
// result = 2000 + (0 to 2000) = 2000 to 4000ms
```

#### Decorrelated Jitter

```typescript
function decorrelatedJitter(
  previousDelay: number,
  baseDelay: number,
  maxDelay: number
): number {
  const delay = Math.min(maxDelay, Math.random() * previousDelay * 3);
  return Math.max(baseDelay, delay);
}

// Requires tracking previous delay
```

### 5.3 Recommended Implementation (Full Jitter)

```typescript
interface RetryWithJitterConfig extends RetryConfig {
  jitterFactor?: number; // 0-1, default 1 (full jitter)
}

function retryWithJitter<T>(
  fn: () => Promise<T>,
  config: RetryWithJitterConfig
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitterFactor = 1,
    isRetryable = isTransientError,
    onRetry,
  } = config;

  return (async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (!isRetryable(error) || attempt >= maxAttempts - 1) {
          throw error;
        }

        // Calculate exponential delay
        const exponentialDelay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        );

        // Add jitter
        const jitter = exponentialDelay * jitterFactor * Math.random();
        const delay = Math.floor(exponentialDelay - jitter / 2 + jitter);

        onRetry?.(attempt + 1, error, delay);
        await sleep(delay);
      }
    }

    throw lastError;
  })();
}
```

### 5.4 Visualizing Jitter Impact

Without jitter (synchronized retries):

```
Time:  0s    1s    2s    3s    4s
Load:  |████████████████████████|  (all clients retry together)
```

With full jitter (distributed retries):

```
Time:  0s    1s    2s    3s    4s
Load:  |███  ███  ███  █  ████|  (requests spread out)
```

---

## 6. Logging and Observability

### 6.1 Structured Logging

```typescript
interface RetryLogger {
  logRetry(attempt: number, delay: number, error: unknown): void;
  logSuccess(attempts: number, totalTime: number): void;
  logFailure(finalError: unknown, totalAttempts: number): void;
}

class ConsoleRetryLogger implements RetryLogger {
  logRetry(attempt: number, delay: number, error: unknown): void {
    console.log(
      JSON.stringify({
        level: 'info',
        event: 'retry_attempt',
        attempt,
        delayMs: delay,
        error: {
          message: (error as Error).message,
          code: (error as RetryableError).code,
          status: (error as RetryableError).response?.status,
        },
        timestamp: new Date().toISOString(),
      })
    );
  }

  logSuccess(attempts: number, totalTime: number): void {
    console.log(
      JSON.stringify({
        level: 'info',
        event: 'retry_success',
        attempts,
        totalTimeMs: totalTime,
        timestamp: new Date().toISOString(),
      })
    );
  }

  logFailure(finalError: unknown, totalAttempts: number): void {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'retry_failure',
        attempts: totalAttempts,
        error: {
          message: (finalError as Error).message,
          stack: (finalError as Error).stack,
        },
        timestamp: new Date().toISOString(),
      })
    );
  }
}
```

### 6.2 Metrics Collection

```typescript
interface RetryMetrics {
  operationName: string;
  totalAttempts: number;
  successful: boolean;
  totalDelayMs: number;
  errors: Array<{ attempt: number; errorType: string }>;
}

class RetryMetricsCollector {
  private metrics: Map<string, RetryMetrics[]> = new Map();

  record(operationName: string, metric: RetryMetrics): void {
    const operations = this.metrics.get(operationName) || [];
    operations.push(metric);
    this.metrics.set(operationName, operations);
  }

  getMetrics(operationName?: string): RetryMetrics[] {
    if (operationName) {
      return this.metrics.get(operationName) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  getSuccessRate(operationName: string): number {
    const metrics = this.getMetrics(operationName);
    if (metrics.length === 0) return 0;

    const successful = metrics.filter(m => m.successful).length;
    return successful / metrics.length;
  }

  getAverageAttempts(operationName: string): number {
    const metrics = this.getMetrics(operationName);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.totalAttempts, 0);
    return total / metrics.length;
  }
}
```

### 6.3 OpenTelemetry Integration

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

async function retryWithTracing<T>(
  operationName: string,
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const tracer = trace.getTracer('retry-library');

  return tracer.startActiveSpan(operationName, async span => {
    const startTime = Date.now();
    let lastError: unknown;

    for (let attempt = 0; attempt < config.maxAttempts!; attempt++) {
      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('retry.attempts', attempt + 1);
        span.setAttribute('retry.success', true);
        return result;
      } catch (error) {
        lastError = error;

        if (attempt >= config.maxAttempts! - 1) {
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message,
          });
          span.setAttribute('retry.success', false);
          span.setAttribute('retry.total_attempts', attempt + 1);
          throw error;
        }

        const delay = Math.min(
          config.baseDelay! * Math.pow(2, attempt),
          config.maxDelay!
        );

        span.addEvent('retry_attempt', {
          attempt: attempt + 1,
          delayMs: delay,
          error: (error as Error).message,
        });

        await sleep(delay);
      }
    }

    throw lastError;
  });
}
```

### 6.4 Distributed Tracing Context Propagation

```typescript
async function retryWithContextPropagation<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const ctx = context.active();

  for (let attempt = 0; attempt < config.maxAttempts!; attempt++) {
    try {
      // Execute within the original context
      return await context.with(ctx, () => fn());
    } catch (error) {
      if (attempt >= config.maxAttempts! - 1) throw error;

      const delay = Math.min(
        config.baseDelay! * Math.pow(2, attempt),
        config.maxDelay!
      );

      await sleep(delay);
    }
  }

  throw new Error('Max attempts exceeded');
}
```

---

## 7. TypeScript Type Safety

### 7.1 Generic Retry Function

```typescript
/**
 * Retry an async function with exponential backoff
 * @template T - Return type of the function
 * @template Args - Tuple of argument types
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @returns Promise that resolves to the function result
 */
async function retry<T, Args extends any[] = any[]>(
  fn: (...args: Args) => Promise<T>,
  config: RetryConfig
): Promise<T> {
  // Implementation...
}
```

### 7.2 Typed Error Predicates

```typescript
type ErrorPredicate<E extends Error = Error> = (error: unknown) => error is E;

interface TypedRetryConfig<E extends Error = Error> {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  isRetryable?: ErrorPredicate<E>;
  onRetry?: (attempt: number, error: E) => void;
}

function isNetworkError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    TRANSIENT_ERROR_CODES.has((error as NodeJS.ErrnoException).code!)
  );
}

function isHttpError(error: unknown): error is RetryableError {
  return typeof error === 'object' && error !== null && 'response' in error;
}

// Usage with typed error handling
async function fetchWithTypedRetry<T>(url: string): Promise<T> {
  return retry(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        const error: RetryableError = new Error(`HTTP ${response.status}`);
        error.response = { status: response.status };
        throw error;
      }
      return response.json();
    },
    {
      isRetryable: (error): error is RetryableError =>
        isNetworkError(error) || isHttpError(error),
      onRetry: (attempt, error) => {
        console.log(`Retry ${attempt}:`, error.message);
      },
    }
  );
}
```

### 7.3 Strict Type Checking for Retry Options

```typescript
type StrictRetryConfig = Required<
  Omit<RetryConfig, 'onRetry' | 'isRetryable'>
> &
  Pick<RetryConfig, 'onRetry' | 'isRetryable'>;

function createRetryConfig(config: RetryConfig): StrictRetryConfig {
  return {
    maxAttempts: config.maxAttempts ?? 3,
    baseDelay: config.baseDelay ?? 1000,
    maxDelay: config.maxDelay ?? 30000,
    isRetryable: config.isRetryable ?? isTransientError,
    onRetry: config.onRetry,
  };
}
```

### 7.4 Type-Safe Result Types

```typescript
type RetryResult<T, E extends Error = Error> =
  | { success: true; data: T; attempts: number }
  | { success: false; error: E; attempts: number };

async function retryWithResult<T, E extends Error = Error>(
  fn: () => Promise<T>,
  config: TypedRetryConfig<E>
): Promise<RetryResult<T, E>> {
  let lastError: E;

  for (let attempt = 0; attempt < config.maxAttempts!; attempt++) {
    try {
      const result = await fn();
      return { success: true, data: result, attempts: attempt + 1 };
    } catch (error) {
      lastError = error as E;

      if (!config.isRetryable?.(error) || attempt >= config.maxAttempts! - 1) {
        return { success: false, error: lastError, attempts: attempt + 1 };
      }

      const delay = Math.min(
        config.baseDelay! * Math.pow(2, attempt),
        config.maxDelay!
      );

      await sleep(delay);
    }
  }

  return { success: false, error: lastError!, attempts: config.maxAttempts! };
}
```

---

## 8. Common Pitfalls and Anti-Patterns

### 8.1 Anti-Patterns

#### ❌ Infinite Retry Loops

```typescript
// BAD: No max attempts limit
while (true) {
  try {
    return await fetchData();
  } catch {
    await sleep(1000);
  }
}
```

#### ❌ Ignoring Non-Retryable Errors

```typescript
// BAD: Retries all errors including 404, 401, etc.
for (let i = 0; i < 5; i++) {
  try {
    return await fetchData();
  } catch {
    await sleep(1000);
  }
}
```

#### ❌ Fixed Delay Without Backoff

```typescript
// BAD: No exponential backoff
for (let i = 0; i < 5; i++) {
  try {
    return await fetchData();
  } catch {
    await sleep(1000); // Always 1 second
  }
}
```

#### ❌ No Jitter (Thundering Herd)

```typescript
// BAD: All clients retry at exact same intervals
const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
await sleep(delay); // No randomness
```

#### ❌ Retry Without Idempotency

```typescript
// BAD: Retrying non-idempotent operations
async function chargeCreditCard(amount: number) {
  // If this fails midway and is retried, customer could be charged twice!
  await paymentProcessor.charge(amount);
}
```

### 8.2 Common Mistakes

#### Mistake 1: Not Checking Error Types

```typescript
// BAD
catch (error) {
  await sleep(1000);
}

// GOOD
catch (error) {
  if (isTransientError(error)) {
    await sleep(1000);
  } else {
    throw error;
  }
}
```

#### Mistake 2: Not Capturing Original Error

```typescript
// BAD
throw new Error('Max retries exceeded');

// GOOD
const finalError = new Error('Max retries exceeded');
finalError.cause = lastError;
throw finalError;
```

#### Mistake 3: Blocking Event Loop During Sleep

```typescript
// BAD - synchronous blocking
function sleep(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Blocking event loop!
  }
}

// GOOD - async non-blocking
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 8.3 Best Practices Checklist

- [ ] Always set a `maxAttempts` limit
- [ ] Always implement exponential backoff
- [ ] Always add jitter to prevent thundering herd
- [ ] Always check if errors are retryable
- [ ] Always log retry attempts for debugging
- [ ] Only retry idempotent operations
- [ ] Set appropriate timeouts per attempt
- [ ] Capture and propagate original errors
- [ ] Use async/await, never block the event loop
- [ ] Monitor retry rates in production
- [ ] Consider circuit breakers for cascading failures

---

## 9. Recommended Libraries

### 9.1 async-retry (Vercel)

**URL:** https://github.com/vercel/async-retry

**Features:**

- Simple API
- Exponential backoff with jitter
- Custom retry predicates
- TypeScript support
- Lightweight (~1KB)

**Example:**

```typescript
import retry from 'async-retry';

const result = await retry(
  async () => {
    const response = await fetch(url);
    return response.json();
  },
  {
    retries: 5,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 30000,
    randomize: true,
  }
);
```

### 9.2 exponential-backoff

**URL:** https://github.com/cb1kenoby/exponential-backoff

**Features:**

- Flexible backoff strategies
- Jitter support
- TypeScript first-class
- Promise-based API
- AbortController support

**Example:**

```typescript
import { retry } from 'exponential-backoff';

const result = await retry(() => fetch(url).then(r => r.json()), {
  delay: {
    initial: 1000,
    max: 30000,
  },
  retry: 5,
});
```

### 9.3 axios-retry

**URL:** https://github.com/softonic/axios-retry

**Features:**

- Axios interceptor
- Conditional retry based on response
- Network error detection
- Custom retry delay
- TypeScript support

**Example:**

```typescript
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});
```

### 9.4 retry (node-retry)

**URL:** https://github.com/tim-kos/node-retry

**Features:**

- Classic, battle-tested
- Multiple backoff strategies
- Event-based
- Node.js standard library alternative

**Example:**

```typescript
import retry from 'retry';

const operation = retry.operation({
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
  randomize: true,
});

operation.attempt(async currentAttempt => {
  try {
    const result = await fetchData();
    operation.reset();
    return result;
  } catch (error) {
    if (operation.retry(error)) {
      return;
    }
    throw error;
  }
});
```

### 9.5 Library Comparison

| Library             | Size | TypeScript | Axios Support | Jitter | Flexibility |
| ------------------- | ---- | ---------- | ------------- | ------ | ----------- |
| async-retry         | ~1KB | Yes        | No            | Yes    | Medium      |
| exponential-backoff | ~3KB | Yes        | No            | Yes    | High        |
| axios-retry         | ~5KB | Yes        | Yes           | Yes    | Medium      |
| node-retry          | ~8KB | Yes        | No            | Yes    | High        |

---

## 10. Key References

### Documentation URLs

1. **async-retry (Vercel)**
   - Repository: https://github.com/vercel/async-retry
   - npm: https://www.npmjs.com/package/async-retry

2. **exponential-backoff**
   - Repository: https://github.com/cb1kenoby/exponential-backoff
   - npm: https://www.npmjs.com/package/exponential-backoff

3. **axios-retry**
   - Repository: https://github.com/softonic/axios-retry
   - npm: https://www.npmjs.com/package/axios-retry

4. **node-retry**
   - Repository: https://github.com/tim-kos/node-retry
   - npm: https://www.npmjs.com/package/retry

5. **AWS Architecture Blog - Exponential Backoff and Jitter**
   - https://www.awsarchitectureblog.com/2015/03/backoff.html

6. **Google Cloud - Rate Limiting Strategies**
   - https://cloud.google.com/architecture/rate-limiting-strategies-techniques

7. **Google Cloud - Implementing Retry Logic**
   - https://cloud.google.com/iot/docs/how-tos/exponential-backoff

8. **Microsoft Azure - Transient Fault Handling**
   - https://docs.microsoft.com/en-us/azure/architecture/patterns/retry

9. **MDN - Fetch API**
   - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

10. **Node.js Error Codes**
    - https://nodejs.org/api/errors.html#errors_common_system_errors

### Critical Implementation Insights

#### Insight 1: Always Use Jitter

From AWS research: "Without jitter, a group of clients requesting a rate-limited service will remain synchronized even with exponential backoff."

**Recommendation:** Use full jitter for most cases, decorrelated jitter for highly variable workloads.

#### Insight 2: Distinguish Retryable Errors

Not all errors should trigger retries. Client errors (4xx except 408/429) indicate application bugs or invalid input, not transient issues.

**Recommendation:** Implement a robust `isRetryable()` predicate that checks error codes, status codes, and message patterns.

#### Insight 3: Consider Idempotency

Only retry operations that are safe to execute multiple times. POST requests that modify state should generally not be retried automatically.

**Recommendation:** Add an `idempotent` flag to your retry configuration and validate operation safety.

#### Insight 4: Monitor and Alert

High retry rates indicate infrastructure problems. Set up alerts for retry thresholds.

**Recommendation:** Track metrics for:

- Retry rate (retries / total attempts)
- Average attempts before success
- Most common retryable errors
- Operations with highest retry rates

#### Insight 5: Circuit Breakers for Cascading Failures

When a service is down, retries can make things worse. Implement circuit breakers to stop retries after threshold failures.

**Recommendation:** Use circuit breaker pattern alongside retry logic for resilience.

---

## Appendix: Complete Implementation Example

```typescript
// complete-retry-implementation.ts

interface RetryableError extends Error {
  code?: string;
  response?: {
    status?: number;
  };
}

const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EPIPE',
  'EAI_AGAIN',
]);

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitterFactor?: number;
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
  onSuccess?: (attempts: number, totalTime: number) => void;
  onFailure?: (error: unknown, attempts: number) => void;
}

function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as RetryableError;

  if (err.code && TRANSIENT_ERROR_CODES.has(err.code)) {
    return true;
  }

  const status = err.response?.status;
  if (status && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  const message = err.message?.toLowerCase() || '';
  const patterns = ['network', 'timeout', 'temporarily unavailable'];

  return patterns.some(p => message.includes(p));
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitterFactor = 1,
    isRetryable = isTransientError,
    onRetry,
    onSuccess,
    onFailure,
  } = config;

  const startTime = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      const totalTime = Date.now() - startTime;
      onSuccess?.(attempt + 1, totalTime);
      return result;
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt >= maxAttempts - 1) {
        onFailure?.(error, attempt + 1);
        throw error;
      }

      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      const jitter =
        exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;
      const delay = Math.max(0, Math.floor(exponentialDelay + jitter));

      onRetry?.(attempt + 1, error, delay);
      await sleep(delay);
    }
  }

  onFailure?.(lastError, maxAttempts);
  throw lastError;
}

// Usage examples
async function examples() {
  // Basic usage
  const data = await retry(
    () => fetch('https://api.example.com/data').then(r => r.json()),
    { maxAttempts: 5 }
  );

  // With logging
  const result = await retry(
    async () => {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        const error: RetryableError = new Error(`HTTP ${response.status}`);
        error.response = { status: response.status };
        throw error;
      }
      return response.json();
    },
    {
      maxAttempts: 5,
      baseDelay: 500,
      onRetry: (attempt, error, delay) => {
        console.log(`Retry ${attempt} after ${delay}ms:`, error);
      },
      onSuccess: (attempts, totalTime) => {
        console.log(`Success after ${attempts} attempts (${totalTime}ms)`);
      },
      onFailure: (error, attempts) => {
        console.error(`Failed after ${attempts} attempts:`, error);
      },
    }
  );

  return result;
}
```

---

## Summary

**Key Takeaways:**

1. **Always implement exponential backoff** with a maximum delay cap
2. **Always add jitter** (randomization) to prevent thundering herd
3. **Only retry transient errors** - check error codes and HTTP status
4. **Set reasonable limits** - 3-5 attempts, 30s max delay
5. **Log and monitor** - track retry rates and common failures
6. **Use TypeScript generics** for type-safe retry functions
7. **Consider using established libraries** rather than building from scratch
8. **Never retry non-idempotent operations** without careful consideration
9. **Add timeouts** for both individual attempts and total operation time
10. **Implement circuit breakers** for production resilience

**Recommended Libraries:**

- Simple use cases: `async-retry`
- Axios users: `axios-retry`
- Maximum flexibility: `exponential-backoff`
- Classic approach: `node-retry`
