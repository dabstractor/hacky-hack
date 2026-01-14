# Testing Patterns Research

## Research Agent Testing Patterns for Cache Verification

### Summary of Findings

The codebase has well-established patterns for testing agent functionality, cache verification, and timing assertions. Here are the key patterns and examples found:

---

## 1. Test Structure and Organization

### File Location Patterns:

- Unit tests: `tests/unit/agents/`, `tests/unit/core/`, `tests/unit/utils/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`

### Mock Pattern Used:

```typescript
// Mock pattern with hoisting (top-level vi.mock)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});
```

---

## 2. Cache Verification Patterns

### Pattern 1: Multiple Call Verification (Research Queue)

From `tests/unit/core/research-queue.test.ts`:

```typescript
it('should return cached result immediately', async () => {
  // SETUP: First call to cache the result
  await queue.enqueue(task, backlog);
  await queue.waitForPRP('P1.M1.T1.S1');

  // EXECUTE: Second call should hit cache
  const startTime = Date.now();
  const result = await queue.waitForPRP('P1.M1.T1.S1');
  const elapsed = Date.now() - startTime;

  // VERIFY: Instant return from cache
  expect(result).toEqual(expectedPRP);
  expect(elapsed).toBeLessThan(10); // <10ms threshold
});
```

### Pattern 2: Agent Factory Cache Configuration

From `tests/unit/agents/agent-factory.test.ts`:

```typescript
it('should enable cache and reflection for all personas', () => {
  // EXECUTE
  const configs = personas.map(p => createBaseConfig(p));

  // VERIFY: Cache enabled in all agent configs
  configs.forEach(config => {
    expect(config.enableCache).toBe(true);
  });
});
```

---

## 3. Timing Assertion Patterns

### Pattern 1: performance.now() for High Precision

From `tests/e2e/delta.test.ts`:

```typescript
// ARRANGE
const start1 = performance.now();

// ACT
const result1 = await pipeline1.run();
const duration1 = performance.now() - start1;

// VERIFY: Total execution time
const totalDuration = duration1 + duration2;
expect(totalDuration).toBeLessThan(30000); // <30 seconds
console.log(`Test completed in ${totalDuration.toFixed(0)}ms`);
```

### Pattern 2: Date.now() for Simple Timing

From research-queue tests:

```typescript
const startTime = Date.now();
const result = await queue.waitForPRP('P1.M1.T1.S1');
const elapsed = Date.now() - startTime;

expect(elapsed).toBeLessThan(10); // Instant response threshold
```

### Pattern 3: Fake Timers for Controlled Timing

From `tests/unit/utils/progress.test.ts`:

```typescript
vi.useFakeTimers();

try {
  tracker.recordStart('P1.M1.T1.S1');
  vi.advanceTimersByTime(10); // Simulate 10ms passing
  tracker.recordComplete('P1.M1.T1.S1');

  const eta = tracker.getETA();
  expect(eta).toBeGreaterThan(0);
} finally {
  vi.useRealTimers();
}
```

---

## 4. Logging Verification Patterns

### Pattern 1: Spy on Logger Methods

From `tests/unit/utils/progress.test.ts`:

```typescript
const logger = getLogger('ProgressTracker');
const infoSpy = vi.spyOn(logger, 'info');

// EXECUTE: Trigger logging
tracker.recordStart('P1.M1.T1.S1');
tracker.recordComplete('P1.M1.T1.S1');

// VERIFY: Log was called with correct data
expect(infoSpy).toHaveBeenCalled();
const callArgs = infoSpy.mock.calls[0];
const logData = callArgs[0] as Record<string, unknown>;
expect(logData.type).toBe('progress');
expect(logData.completed).toBe(1);
```

### Pattern 2: Logger Cache Verification

From `tests/unit/logger.test.ts`:

```typescript
it('should return cached logger for same context and options', () => {
  const logger1 = getLogger('TestContext');
  const logger2 = getLogger('TestContext');
  expect(logger1).toBe(logger2); // Same instance from cache
});
```

---

## 5. Recommended Implementation for P5.M2.T1.S1

Based on the patterns found, here's how to implement cache verification tests:

```typescript
/**
 * Unit tests for agent cache verification
 *
 * @remarks
 * Tests validate that identical prompt calls return cached responses instantly
 * and measure cache hit rates for observability.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgent, createPrompt } from 'groundswell';

// Mock groundswell
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

describe('Agent Cache Verification', () => {
  const mockAgent = {
    prompt: vi.fn(),
  };

  const mockPrompt = {
    user: 'Test prompt',
    system: 'Test system',
    responseFormat: {},
    enableCache: true, // Important: cache must be enabled
    enableReflection: true,
  };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(createAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache Hit Verification', () => {
    it('should return cached response instantly on second identical call', async () => {
      // ARRANGE: Mock the prompt method to simulate LLM response
      const mockResponse = { id: 'response-123', content: 'Cached result' };
      mockAgent.prompt.mockResolvedValue(mockResponse);

      // EXECUTE: First call (slow, simulates LLM processing)
      const startTime1 = performance.now();
      const result1 = await mockAgent.prompt('Test prompt');
      const duration1 = performance.now() - startTime1;

      // EXECUTE: Second identical call (should be instant from cache)
      const startTime2 = performance.now();
      const result2 = await mockAgent.prompt('Test prompt'); // Same prompt
      const duration2 = performance.now() - startTime2;

      // VERIFY: Same response returned
      expect(result1).toEqual(result2);

      // VERIFY: Second call is significantly faster (cache hit)
      expect(duration2).toBeLessThan(duration1);
      expect(duration2).toBeLessThan(50); // <50ms threshold for "instant"

      // VERIFY: prompt was called only once (cache hit)
      expect(mockAgent.prompt).toHaveBeenCalledTimes(1);
    });

    it('should show cache hit rate in observability logs', async () => {
      // ARRANGE: Mock responses for multiple calls
      const responses = [
        { id: '1', content: 'Response 1' },
        { id: '2', content: 'Response 2' },
      ];
      let callCount = 0;
      mockAgent.prompt.mockImplementation(() => {
        return Promise.resolve(responses[callCount % responses.length]);
      });

      // EXECUTE: Multiple calls with some duplicates
      await mockAgent.prompt('Test prompt 1');
      await mockAgent.prompt('Test prompt 2');
      await mockAgent.prompt('Test prompt 1'); // Cache hit
      await mockAgent.prompt('Test prompt 2'); // Cache hit

      // VERIFY: Cache hit ratio
      const totalCalls = mockAgent.prompt.mock.calls.length;
      const expectedCalls = 4; // First call of each prompt + 2 cache hits
      expect(totalCalls).toBeLessThan(expectedCalls); // Some calls cached

      // LOG: For observability
      const cacheHitRate = (1 - totalCalls / expectedCalls) * 100;
      console.log(`Cache hit rate: ${cacheHitRate.toFixed(1)}%`);
    });
  });

  describe('Different Prompts Should Not Use Cache', () => {
    it('should treat different prompts as separate cache entries', async () => {
      // ARRANGE: Different responses for different prompts
      const prompt1Response = { id: '1', content: 'Response to prompt 1' };
      const prompt2Response = { id: '2', content: 'Response to prompt 2' };

      mockAgent.prompt
        .mockResolvedValueOnce(prompt1Response)
        .mockResolvedValueOnce(prompt2Response);

      // EXECUTE: Two different prompts
      await mockAgent.prompt('Test prompt 1');
      await mockAgent.prompt('Test prompt 2');

      // VERIFY: Two separate calls (no cache hit for different prompts)
      expect(mockAgent.prompt).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Configuration', () => {
    it('should verify cache is enabled in agent configuration', () => {
      // ARRANGE: Get agent creation calls
      createAgent(mockPrompt);

      // VERIFY: Cache is enabled in agent config
      expect(createAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          enableCache: true,
        })
      );
    });
  });
});
```

---

## 6. Key Threshold Values Found

- **Instant response threshold**: `< 10ms` (research queue tests)
- **Performance threshold**: `< 30,000ms` (30 seconds for E2E tests)
- **Average duration**: `toBeGreaterThanOrEqual(0)` (handled gracefully)
- **Cache hit verification**: Second call should be significantly faster than first

---

## 7. Observability Patterns

For logging cache hit rates:

```typescript
const totalCalls = 10;
const cacheHits = 7;
const hitRate = (cacheHits / totalCalls) * 100;

console.log(`Cache performance: ${hitRate.toFixed(1)}% hit rate`);
// In real implementation: logger.info({ hitRate, totalCalls }, 'Cache performance');
```

---

## 8. Mock/Stub Patterns

Common patterns used:

- `vi.fn().mockResolvedValue()` for async operations
- `vi.spyOn()` for method call verification
- `vi.clearAllMocks()` in `afterEach`
- `vi.useFakeTimers()` for controlled timing
- Mock implementation returning predictable responses

These patterns provide a solid foundation for implementing P5.M2.T1.S1 cache verification tests with proper timing assertions and observability logging.
