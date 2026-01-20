# Integration Test Promise Rejection Analysis

## Overview

This document analyzes integration test files to identify patterns that could cause `PromiseRejectionHandledWarning` messages during test execution.

## Test Framework Configuration

**Framework**: Vitest 1.6.1
**Global Setup**: `tests/setup.ts`
**Test Directory**: `tests/integration/`, `tests/e2e/`

## Critical Issues Found

### 1. Uncaught Promise Rejections in beforeEach Hooks

**File**: `tests/integration/core/task-orchestrator-e2e.test.ts`
**Line**: 266

```typescript
beforeEach(async () => {
  const backlog = createComplexBacklog();
  const env = setupTestEnvironment(backlog);
  tempDir = env.tempDir;
  sessionManager = env.sessionManager;
  sessionPath = env.sessionPath;

  await sessionManager.loadSession(sessionPath);
});
```

**Issue**: The `sessionManager.loadSession(sessionPath)` call has no `.catch()` handler. If this operation rejects, the rejection will be unhandled.

**Fix Pattern**:
```typescript
beforeEach(async () => {
  const backlog = createComplexBacklog();
  const env = setupTestEnvironment(backlog);
  tempDir = env.tempDir;
  sessionManager = env.sessionManager;
  sessionPath = env.sessionPath;

  await sessionManager.loadSession(sessionPath).catch(err => {
    console.error('Session load failed in beforeEach:', err);
    throw err; // Re-throw to fail test
  });
});
```

### 2. Process Signal Handlers Without Proper Cleanup

**File**: `tests/integration/prp-pipeline-shutdown.test.ts`
**Lines**: 307-311, 380-383

```typescript
process.emit('SIGTERM');
return false; // No more items
```

**Issue**: Tests emit process signals that may trigger async operations without proper cleanup. If handlers create promises that reject after test ends, warnings occur.

**Current Cleanup**:
```typescript
afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  vi.clearAllMocks();

  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalProcessListeners.SIGINT.forEach(listener =>
    process.on('SIGINT', listener)
  );
  originalProcessListeners.SIGTERM.forEach(listener =>
    process.on('SIGTERM', listener)
  );
});
```

**Issue**: This cleanup doesn't wait for any pending async operations triggered by the signals.

**Fix Pattern**: Add a small delay before cleanup to allow async handlers to complete:
```typescript
afterEach(async () => {
  // Allow async signal handlers to complete
  await new Promise(resolve => setImmediate(resolve));

  rmSync(tempDir, { recursive: true, force: true });
  vi.clearAllMocks();

  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalProcessListeners.SIGINT.forEach(listener =>
    process.on('SIGINT', listener)
  );
  originalProcessListeners.SIGTERM.forEach(listener =>
    process.on('SIGTERM', listener)
  );
});
```

### 3. setTimeout Without Cleanup in Mocks

**File**: `tests/e2e/pipeline.test.ts`
**Lines**: 151-165

```typescript
return {
  stdout: {
    on: vi.fn((event: string, callback: (data: Buffer) => void) => {
      if (event === 'data') {
        setTimeout(() => callback(Buffer.from(stdout)), 5);
      }
    }),
  },
  stderr: {
    on: vi.fn((event: string, callback: (data: Buffer) => void) => {
      if (event === 'data') {
        setTimeout(() => callback(Buffer.from(stderr)), 5);
      }
    }),
  },
  on: vi.fn((event: string, callback: (code: number) => void) => {
    if (event === 'close') {
      setTimeout(() => callback(Buffer.from(exitCode)), 10);
    }
  }),
};
```

**Issue**: These setTimeout callbacks could create dangling promises if test ends before they complete.

**Fix Pattern**: Store timeout IDs and clear them in afterEach:
```typescript
let mockTimeouts: NodeJS.Timeout[] = [];

beforeEach(() => {
  mockTimeouts = [];
});

afterEach(() => {
  mockTimeouts.forEach(clearTimeout);
  mockTimeouts = [];
});

// In mock:
const timeoutId = setTimeout(() => callback(Buffer.from(stdout)), 5);
mockTimeouts.push(timeoutId);
```

### 4. Promise.all Without Individual Error Handling

**File**: `tests/integration/core/session-manager.test.ts`
**Line**: 1496

```typescript
await expect(Promise.all(flushPromises)).resolves.not.toThrow();
```

**Issue**: While this expects no throw, it doesn't handle individual promise rejections properly.

**Fix Pattern**: Use Promise.allSettled for better diagnostics:
```typescript
const results = await Promise.allSettled(flushPromises);
const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) {
  console.error(`${failures.length} promises rejected during flush`);
}
```

## Additional Files Requiring Review

### High Priority

1. **tests/integration/prp-pipeline-integration.test.ts**
   - beforeEach/afterEach with temp directory operations
   - Potential for async operations to outlive test lifecycle

2. **tests/integration/utils/error-handling.test.ts**
   - Tests specifically for error handling
   - Lines 344-367: Stack trace preservation test that fails

3. **tests/integration/fix-cycle-workflow-integration.test.ts**
   - Async workflow operations
   - Complex promise chains

### Medium Priority

4. **tests/integration/core/task-orchestrator-runtime.test.ts**
   - Runtime orchestration with async operations
   - Task management promises

5. **tests/integration/core/session-manager.test.ts**
   - Session state management
   - Multiple async operations

## Recommended Global Fix

Add to `tests/setup.ts`:

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

let unhandledRejections: unknown[] = [];

beforeEach(() => {
  unhandledRejections = [];
  vi.clearAllMocks();

  const handler = (reason: unknown) => {
    unhandledRejections.push(reason);
  };

  process.on('unhandledRejection', handler);
  (globalThis as any).__unhandledRejectionHandler = handler;
});

afterEach(() => {
  const handler = (globalThis as any).__unhandledRejectionHandler;
  if (handler) {
    process.removeListener('unhandledRejection', handler);
    delete (globalThis as any).__unhandledRejectionHandler;
  }

  // Fail test if there were unhandled rejections
  if (unhandledRejections.length > 0) {
    throw new Error(
      `Test had ${unhandledRejections.length} unhandled rejection(s): ` +
      unhandledRejections.map(String).join(', ')
    );
  }

  vi.unstubAllEnvs();
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

## References

- Node.js unhandledRejection documentation: https://nodejs.org/api/process.html#event-unhandledrejection
- Vitest async testing: https://vitest.dev/guide/advanced/
- Stack trace preservation test: tests/integration/utils/error-handling.test.ts:344-367
