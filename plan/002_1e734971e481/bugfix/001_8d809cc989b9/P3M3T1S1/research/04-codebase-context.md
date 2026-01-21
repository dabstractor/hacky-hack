# Codebase Context Analysis

## Retry Utility Usage in Codebase

### Files Using the Retry Utility

Based on codebase search, the retry utility is used in:

1. **src/utils/retry.ts** - The retry utility itself (706 lines)
2. **tests/unit/utils/retry.test.ts** - Comprehensive test suite

### Retry Configuration Patterns

The codebase defines three retry configurations:

1. **AGENT_RETRY_CONFIG** (lines 597-605)

   ```typescript
   const AGENT_RETRY_CONFIG: Required<
     Omit<RetryOptions, 'isRetryable' | 'onRetry'>
   > = {
     maxAttempts: 3,
     baseDelay: 1000,
     maxDelay: 30000,
     backoffFactor: 2,
     jitterFactor: 0.1,
   };
   ```

2. **MCP_RETRY_CONFIG** (lines 650-658)

   ```typescript
   const MCP_RETRY_CONFIG: Required<
     Omit<RetryOptions, 'isRetryable' | 'onRetry'>
   > = {
     maxAttempts: 2,
     baseDelay: 500,
     maxDelay: 5000,
     backoffFactor: 2,
     jitterFactor: 0.1,
   };
   ```

3. **Default retry options** (lines 480-488)
   ```typescript
   const {
     maxAttempts = 3,
     baseDelay = 1000,
     maxDelay = 30000,
     backoffFactor = 2,
     jitterFactor = 0.1,
     isRetryable = isTransientError,
     onRetry,
   } = options;
   ```

### Test Patterns in Codebase

The codebase uses **Vitest** as the testing framework:

- Imports: `import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';`
- Timing mocks: `vi.useFakeTimers()`, `vi.runAllTimersAsync()`
- Spies: `vi.spyOn(global, 'setTimeout')`
- Mock restoration: `vi.restoreAllMocks()`

### Testing Approach for Delay Calculations

The test file uses a specific pattern for validating delays:

1. **Mock setTimeout** to capture delay values
2. **Use fake timers** for deterministic timing
3. **Collect delays** in an array
4. **Assert** delays fall within expected ranges

Example from line 604-613:

```typescript
const originalSetTimeout = global.setTimeout;
vi.spyOn(global, 'setTimeout').mockImplementation(
  (callback: (...args: unknown[]) => void, ms: number) => {
    delays.push(ms); // Capture the delay
    return originalSetTimeout(callback, ms) as unknown as NodeJS.Timeout;
  }
);
```

### Related Test Files

Other test files that test utilities with similar patterns:

- `tests/unit/utils/errors.test.ts`
- `tests/unit/utils/logger.test.ts`
- `tests/unit/utils/build-logger.test.ts`
- `tests/unit/utils/git-commit.test.ts`

### Validation Commands

The project uses npm scripts for testing:

```bash
# Run specific test file
npm run test:run -- tests/unit/utils/retry.test.ts

# Run specific test
npm run test:run -- tests/unit/utils/retry.test.ts -t "should add jitter to delay"

# Run all unit tests
npm run test:run -- tests/unit/
```

### Package.json Test Scripts

(To be verified - check package.json for exact script names)
