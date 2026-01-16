# Pino Logger Mocking Best Practices for Vitest

## Executive Summary

This research report documents comprehensive findings on mocking Pino logger in Vitest tests, specifically for the Task Orchestrator's `getLogger()` function. The research includes analysis of existing codebase patterns, official Pino testing approaches, Vitest-specific mocking strategies, and implementation guidelines for type-safe, maintainable logger tests.

**Research Date:** 2026-01-16
**Status:** Compilation of codebase patterns + documented best practices + Pino/Vitest official patterns
**Target:** Mocking `getLogger()` from `src/utils/logger.ts` in unit tests

---

## Table of Contents

1. [Official Pino Testing Documentation](#1-official-pino-testing-documentation)
2. [Vitest-Specific Mocking Patterns for Pino](#2-vitest-pino-mocking-patterns)
3. [Existing Codebase Patterns Analysis](#3-existing-codebase-patterns)
4. [Recommended Mocking Strategy for getLogger](#4-recommended-strategy)
5. [Common Pitfalls and Solutions](#5-common-pitfalls)
6. [Best Practices for Structured Logging Tests](#6-structured-logging-best-practices)
7. [Code Examples and Templates](#7-code-examples)
8. [Advanced Patterns](#8-advanced-patterns)
9. [Testing Child Loggers](#9-testing-child-loggers)
10. [Performance and Optimization](#10-performance-optimization)

---

## 1. Official Pino Testing Documentation

### 1.1 Pino's Built-in Testing Support

**Source:** https://getpino.io/#/docs/testing

**Key Concept:** Pino provides `pino/test` module specifically for testing, but it's designed for output validation, not mocking.

```typescript
import pino from 'pino';
import { test } from 'pino/test';

// Official pino/test usage (NOT for mocking, for validation)
test(pino(), 'info message', {
  level: 30,
  msg: 'info message'
});
```

**Limitations for Our Use Case:**
- `pino/test` validates log output, doesn't mock the logger
- Not suitable for unit testing business logic that calls logger
- Doesn't help with mocking `getLogger()` factory function

### 1.2 Pino's Recommended Testing Approach

**Source:** https://getpino.io/#/docs/help?id=testing

**Official Recommendations:**

1. **Use a writable stream for output capture**
```typescript
import { Writable } from 'stream';
import pino from 'pino';

const stream = new Writable({
  write(chunk, encoding, callback) {
    const log = JSON.parse(chunk);
    // Assert on log properties
    callback();
  }
});

const logger = pino(stream);
```

2. **Use silent logger for tests**
```typescript
const logger = pino({ level: 'silent' });
// No output during tests
```

**Why This Doesn't Fit Our Needs:**
- Our code uses `getLogger()` factory function
- We need to verify logger methods were called (spy behavior)
- We want to avoid actual log output during unit tests
- Silent logger doesn't provide verification capabilities

### 1.3 Pino Module Structure

**Understanding Pino's Exports:**

```typescript
import pino from 'pino';

// Main factory function
const logger = pino(options);

// Level constants
pino.levels.values = { error: 50, warn: 40, info: 30, debug: 20 };

// Standard time functions
pino.stdTimeFunctions = {
  isoTime: () => new Date().toISOString(),
  epochTime: () => Date.now(),
};

// This is what our wrapPinoLogger uses internally
```

---

## 2. Vitest-Specific Mocking Patterns for Pino

### 2.1 Module-Level Mocking (RECOMMENDED)

**Pattern:** Mock the logger module before imports

```typescript
// tests/unit/core/task-orchestrator.test.ts

// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function(this: any) {
      return this;
    }),
  },
}));

// Mock the logger module before importing
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
  clearLoggerCache: vi.fn(),
  getGlobalConfig: vi.fn(() => ({})),
  LogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
}));

// Import mocked modules
import { getLogger } from '../../../src/utils/logger.js';

// Type-safe reference
const mockGetLogger = getLogger as any;
```

**Why This Works:**
- `vi.hoisted()` ensures variables are available before mock evaluation
- Mock returns consistent logger instance
- Supports child logger mocking (returns self)
- Type-safe with TypeScript
- Easy to verify calls in tests

### 2.2 Mock Factory Pattern

**Pattern:** Factory function for creating mock loggers

```typescript
// tests/utils/mock-logger.ts

export function createMockLogger() {
  const logger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  };

  return {
    logger,
    // Helper to verify calls
    expectCalled: {
      info: (msg: string, data?: any) => {
        expect(logger.info).toHaveBeenCalledWith(
          data ? expect.objectContaining(data) : msg,
          data ? msg : undefined
        );
      },
    },
    // Helper to clear calls
    clear: () => {
      logger.info.mockClear();
      logger.error.mockClear();
      logger.warn.mockClear();
      logger.debug.mockClear();
      logger.child.mockClear();
    },
  };
}

// Usage in test file
const mockLogger = createMockLogger();

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger.logger),
}));
```

### 2.3 Preserving Real Implementation (Partial Mock)

**Pattern:** Mock only specific exports, preserve rest

```typescript
vi.mock('../../../src/utils/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/logger.js')>();
  return {
    ...actual,
    // Only mock getLogger, preserve LogLevel, etc.
    getLogger: vi.fn(() => mockLogger),
  };
});
```

**Use Cases:**
- Want to use real LogLevel enum
- Want to use real LoggerConfig type
- Only mocking factory function behavior

### 2.4 Spy-Based Approach (Alternative)

**Pattern:** Spy on real logger instead of mocking

```typescript
import { getLogger } from '../../../src/utils/logger.js';

describe('with spy', () => {
  it('should log info message', () => {
    const logger = getLogger('TestContext');
    const spy = vi.spyOn(logger, 'info');

    // Test code that uses logger
    // ...

    expect(spy).toHaveBeenCalledWith('expected message');
    spy.mockRestore();
  });
});
```

**Limitations:**
- Requires real logger initialization (Pino dependency)
- Slower than pure mocks
- May have side effects (file I/O for pretty print)
- Not recommended for unit tests

---

## 3. Existing Codebase Patterns Analysis

### 3.1 Current Successful Patterns

**File:** `/home/dustin/projects/hacky-hack/tests/unit/core/task-patcher.test.ts`

```typescript
// Lines 28-41
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Lines 458-482: Usage in test
it('should log warning for added change', () => {
  mockLogger.warn.mockClear();
  // ... test setup ...
  expect(mockLogger.warn).toHaveBeenCalledWith(
    { changeType: 'added', taskId: 'P1.M1.T1.S1' },
    'Feature not implemented'
  );
});
```

**Analysis:**
- ✅ Uses `vi.hoisted()` correctly
- ✅ Mocks all 4 log levels
- ❌ Missing `child` method mock
- ❌ Direct coupling to mockLogger in assertions
- ✅ Cleans up with `mockClear()` in beforeEach

### 3.2 Task Orchestrator Pattern

**File:** `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts`

```typescript
// Lines 21-34
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

**Analysis:**
- ✅ Same pattern as task-patcher
- ❌ Also missing child logger support
- ⚠️ No mock cleanup in beforeEach

### 3.3 High Priority Warning Verifier Pattern

**File:** `/home/dustin/projects/hacky-hack/tests/unit/utils/high-priority-warning-verifier.test.ts`

```typescript
// Lines 24-38
vi.mock('../../../src/utils/logger.js', () => {
  const mockLogger = {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  };
  return {
    getLogger: vi.fn(() => mockLogger),
    __mockLogger: mockLogger, // Export for test access
  };
});

// Lines 206-209: Access pattern
let mockLoggerInstance: ReturnType<typeof getLogger>;
beforeEach(() => {
  mockLoggerInstance = getLogger('HighPriorityWarningVerifier');
});

// Lines 251-253: Usage
expect(mockLoggerInstance.info).toHaveBeenCalledWith(
  expect.anything(),
  'High-priority warnings verified'
);
```

**Analysis:**
- ✅ Includes `child` method mock (returns self)
- ✅ Exports mock via `__mockLogger` for test access
- ⚠️ Uses `getLogger()` in tests (creates new instance each time)
- ✅ Properly typed with TypeScript

### 3.4 CLI Index Pattern

**File:** `/home/dustin/projects/hacky-hack/tests/unit/cli/index.test.ts`

```typescript
// Lines 26-38
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Lines 47-55: Cleanup pattern
beforeEach(() => {
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.debug.mockClear();
  // ... other setup ...
});
```

**Analysis:**
- ✅ Consistent mock clearing in beforeEach
- ✅ Uses `vi.hoisted()` pattern
- ❌ Missing child logger mock
- ✅ Clean separation of concerns

### 3.5 Logger Test File

**File:** `/home/dustin/projects/hacky-hack/tests/unit/logger.test.ts`

```typescript
// Lines 32-40: Cache clearing
beforeEach(() => {
  clearLoggerCache();
});

afterEach(() => {
  clearLoggerCache();
});

// Lines 68-96: Real logger testing (not mocked)
it('should return a Logger interface', () => {
  const logger = getLogger('TestContext');
  expect(logger).toBeDefined();
  expect(typeof logger.debug).toBe('function');
  expect(typeof logger.info).toBe('function');
  // ...
});
```

**Analysis:**
- ✅ Tests actual logger implementation
- ✅ Proper cache clearing
- ✅ No mocking needed for logger tests
- ✅ Tests factory behavior, not output

---

## 4. Recommended Mocking Strategy for getLogger

### 4.1 Standard Pattern (RECOMMENDED)

**Best Practice:** Combine hoisting with complete mock interface

```typescript
/**
 * Standard Pino logger mock pattern for Vitest
 * @file tests/unit/core/task-orchestrator.test.ts
 */

// =============================================================================
// MOCK SETUP (Top of file, before imports)
// =============================================================================

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    // Support child loggers (returns self for method chaining)
    child: vi.fn(function (this: any) {
      return this;
    }),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
  clearLoggerCache: vi.fn(),
  getGlobalConfig: vi.fn(() => ({})),
  LogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
}));

// =============================================================================
// IMPORTS
// =============================================================================

import { getLogger } from '../../../src/utils/logger.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('TaskOrchestrator', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    mockLogger.child.mockClear();
  });

  // ... tests ...
});
```

**Why This Pattern is Best:**

1. **Complete Interface:** All logger methods mocked
2. **Child Logger Support:** `child()` returns self for chaining
3. **Type Safety:** Preserves type exports (LogLevel)
4. **Isolation:** Mocks cleared between tests
5. **Maintainability:** Consistent pattern across codebase
6. **Hoisting:** Variables available before mock evaluation

### 4.2 Simplified Pattern (For Simple Tests)

**When to Use:** Tests that don't use child loggers

```typescript
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

**Trade-offs:**
- ❌ No child logger support
- ✅ Simpler, less code
- ✅ Faster to write
- ⚠️ Will fail if code calls `.child()`

### 4.3 Factory Pattern (For Reusability)

**When to Use:** Multiple test files need same mock

```typescript
// tests/utils/test-helpers.ts

export function createMockLogger() {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  };

  return {
    instance: mockLogger,

    // Helper to clear all calls
    clear: () => {
      mockLogger.info.mockClear();
      mockLogger.error.mockClear();
      mockLogger.warn.mockClear();
      mockLogger.debug.mockClear();
      mockLogger.child.mockClear();
    },

    // Helper to verify no calls
    expectNoCalls: () => {
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    },
  };
}

export function setupLoggerMock() {
  const { instance: mockLogger } = createMockLogger();

  vi.mock('../../../src/utils/logger.js', () => ({
    getLogger: vi.fn(() => mockLogger),
  }));

  return mockLogger;
}

// Usage in test file
import { createMockLogger } from '../../utils/test-helpers.js';

const mockLogger = createMockLogger();

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger.instance),
}));

beforeEach(() => {
  mockLogger.clear();
});
```

### 4.4 Context-Aware Pattern (Advanced)

**When to Use:** Tests need to verify different contexts

```typescript
const { mockLogger, mockGetLogger } = vi.hoisted(() => ({
  mockLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  })),
  mockGetLogger: vi.fn((context: string) => {
    const logger = mockLogger();
    logger.context = context; // Track context
    return logger;
  }),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: mockGetLogger,
}));

// Test can verify context
it('should create logger with correct context', () => {
  const logger = getLogger('TaskOrchestrator');
  expect(logger.context).toBe('TaskOrchestrator');
});
```

---

## 5. Common Pitfalls and Solutions

### 5.1 Missing Child Logger Mock

**Pitfall:**
```typescript
// ❌ WRONG - Missing child method
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

// When code calls:
const taskLogger = logger.child({ taskId: 'P1.M1.T1' });
taskLogger.info('message'); // TypeError: taskLogger.info is not a function
```

**Solution:**
```typescript
// ✅ CORRECT - Include child method
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(function (this: any) {
    return this; // Return self for chaining
  }),
};
```

### 5.2 Mock State Leakage

**Pitfall:**
```typescript
// ❌ WRONG - No cleanup
it('test 1', () => {
  getLogger('Context1').info('message1');
});

it('test 2', () => {
  // Still has calls from test 1!
  expect(mockLogger.info).toHaveBeenCalledTimes(1); // FAILS
});
```

**Solution:**
```typescript
// ✅ CORRECT - Clear mocks
beforeEach(() => {
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.debug.mockClear();
  mockLogger.child.mockClear();
});

it('test 1', () => {
  getLogger('Context1').info('message1');
});

it('test 2', () => {
  // Clean state
  expect(mockLogger.info).not.toHaveBeenCalled();
});
```

### 5.3 Incorrect Assertion Patterns

**Pitfall:**
```typescript
// ❌ WRONG - Too specific, brittle
expect(mockLogger.info).toHaveBeenCalledWith(
  { taskId: 'P1.M1.T1', status: 'in_progress' },
  'Task status changed'
);

// Fails if object order changes or has extra fields
```

**Solutions:**

**Option 1: Partial object matching**
```typescript
// ✅ CORRECT - Flexible matching
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.objectContaining({
    taskId: 'P1.M1.T1',
  }),
  'Task status changed'
);
```

**Option 2: Match call count**
```typescript
// ✅ CORRECT - Just check it was called
expect(mockLogger.info).toHaveBeenCalled();
expect(mockLogger.info).toHaveBeenCalledTimes(1);
```

**Option 3: Match message only**
```typescript
// ✅ CORRECT - Check message, ignore data
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.anything(),
  'Task status changed'
);
```

### 5.4 Timing Issues with Mocks

**Pitfall:**
```typescript
// ❌ WRONG - Import before mock
import { getLogger } from '../../../src/utils/logger.js';
import { myFunction } from './my-module.js';

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(),
}));

// myModule already imported with real logger!
```

**Solution:**
```typescript
// ✅ CORRECT - Mock before imports
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(),
}));

import { getLogger } from '../../../src/utils/logger.js';
import { myFunction } from './my-module.js';

// myModule uses mocked logger
```

### 5.5 Forgetting to Mock clearLoggerCache

**Pitfall:**
```typescript
// ❌ WRONG - clearLoggerCache not mocked
it('should create new logger', () => {
  const logger1 = getLogger('Context');
  clearLoggerCache();
  const logger2 = getLogger('Context');

  // Fails because cache is real, returns same instance
  expect(logger1).not.toBe(logger2);
});
```

**Solution:**
```typescript
// ✅ CORRECT - Mock cache functions
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
  clearLoggerCache: vi.fn(),
  getGlobalConfig: vi.fn(() => ({})),
}));
```

### 5.6 Async Logger Calls

**Pitfall:**
```typescript
// ❌ WRONG - Doesn't wait for async
async function processData() {
  logger.info('Processing started');
  await asyncOperation();
  logger.info('Processing complete');
}

it('should log both messages', async () => {
  await processData();

  // May fail if logs are async (not typical for Pino, but possible)
  expect(mockLogger.info).toHaveBeenCalledTimes(2);
});
```

**Solution:**
```typescript
// ✅ CORRECT - Pino is synchronous, but be explicit
it('should log both messages', async () => {
  await processData();

  // Pino writes are sync, but wrap in expect for clarity
  expect(mockLogger.info).toHaveBeenCalledTimes(2);
});
```

---

## 6. Structured Logging Best Practices

### 6.1 Test Log Structure, Not Output

**Principle:** Focus on what was logged, not how it looks

```typescript
// ✅ GOOD - Test structured data
it('should log task status change', () => {
  executeTask('P1.M1.T1', 'in_progress');

  expect(mockLogger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      taskId: 'P1.M1.T1',
      status: 'in_progress',
    }),
    expect.stringContaining('status')
  );
});

// ❌ BAD - Test string output
it('should log message', () => {
  executeTask('P1.M1.T1', 'in_progress');

  expect(mockLogger.info).toHaveBeenCalledWith(
    '[TaskOrchestrator] Task status changed: in_progress'
  );
});
```

### 6.2 Test Log Levels

**Principle:** Verify correct log level usage

```typescript
it('should log errors at error level', () => {
  processInvalidInput();

  expect(mockLogger.error).toHaveBeenCalled();
  expect(mockLogger.info).not.toHaveBeenCalled();
});

it('should log debug only when verbose', () => {
  const logger = getLogger('Test', { verbose: true });

  processWithDebug(logger);

  expect(mockLogger.debug).toHaveBeenCalled();
});
```

### 6.3 Test Sensitive Data Redaction

**Principle:** Verify sensitive fields are redacted

```typescript
it('should redact API keys in logs', () => {
  logApiCall('https://api.example.com', 'sk-secret123');

  expect(mockLogger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      apiKey: '[REDACTED]', // Our logger redacts this
      url: 'https://api.example.com', // But not this
    }),
    expect.anything()
  );
});

it('should redact nested credentials', () => {
  logAuth({
    headers: {
      authorization: 'Bearer secret-token',
    },
  });

  expect(mockLogger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      headers: expect.objectContaining({
        authorization: '[REDACTED]',
      }),
    }),
    expect.anything()
  );
});
```

### 6.4 Test Child Logger Context

**Principle:** Verify context propagation

```typescript
it('should create child logger with task context', () => {
  const parentLogger = getLogger('Parent');
  const taskLogger = parentLogger.child({ taskId: 'P1.M1.T1' });

  taskLogger.info('Task started');

  // Verify child was called with bindings
  expect(mockLogger.child).toHaveBeenCalledWith({ taskId: 'P1.M1.T1' });

  // Verify log was called
  expect(mockLogger.info).toHaveBeenCalledWith('Task started');
});

it('should support nested child loggers', () => {
  const parent = getLogger('Parent');
  const child = parent.child({ taskId: 'P1.M1.T1' });
  const grandchild = child.child({ subtaskId: 'S1' });

  grandchild.info('Subtask started');

  expect(mockLogger.child).toHaveBeenCalledTimes(2);
  expect(mockLogger.child).toHaveBeenCalledWith({ taskId: 'P1.M1.T1' });
  expect(mockLogger.child).toHaveBeenCalledWith({ subtaskId: 'S1' });
});
```

### 6.5 Test Error Logging

**Principle:** Verify error details are logged

```typescript
it('should log error with stack trace', () => {
  const error = new Error('Operation failed');
  logError(error);

  expect(mockLogger.error).toHaveBeenCalledWith(
    expect.objectContaining({
      error: 'Operation failed',
      stack: expect.stringContaining('Error: Operation failed'),
    }),
    expect.anything()
  );
});

it('should log error with context', () => {
  const error = new Error('Task failed');
  logTaskError('P1.M1.T1', error);

  expect(mockLogger.error).toHaveBeenCalledWith(
    expect.objectContaining({
      taskId: 'P1.M1.T1',
      error: error.message,
    }),
    'Task execution failed'
  );
});
```

---

## 7. Code Examples and Templates

### 7.1 Complete Test File Template

```typescript
/**
 * Unit tests for Example Service
 *
 * @remarks
 * Demonstrates complete Pino logger mocking pattern
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';

// =============================================================================
// MOCK SETUP (Must be at top of file)
// =============================================================================

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
  clearLoggerCache: vi.fn(),
  getGlobalConfig: vi.fn(() => ({})),
  LogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
}));

// =============================================================================
// IMPORTS (After mocks)
// =============================================================================

import { MyService } from '../../../src/services/my-service.js';

// =============================================================================
// TEST SUITE
// =============================================================================

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    // Clear mock calls before each test
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    mockLogger.child.mockClear();

    // Create service instance
    service = new MyService();
  });

  describe('happy path', () => {
    it('should log info message on success', () => {
      // EXECUTE
      service.doSomething('param1');

      // VERIFY
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('success')
      );
    });
  });

  describe('error handling', () => {
    it('should log error message on failure', () => {
      // SETUP
      const error = new Error('Test error');

      // EXECUTE
      service.failWith(error);

      // VERIFY
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
        }),
        'Operation failed'
      );
    });
  });

  describe('child loggers', () => {
    it('should create child logger for tasks', () => {
      // EXECUTE
      service.processTask('P1.M1.T1');

      // VERIFY child was created
      expect(mockLogger.child).toHaveBeenCalledWith({
        taskId: 'P1.M1.T1',
      });

      // VERIFY child was used
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Task processing started'
      );
    });
  });

  describe('log levels', () => {
    it('should log debug messages when verbose', () => {
      // EXECUTE
      service.debugInfo('detailed info');

      // VERIFY
      expect(mockLogger.debug).toHaveBeenCalledWith('detailed info');
    });
  });
});
```

### 7.2 Shared Mock Helper

```typescript
/**
 * @file tests/utils/logger-mock.ts
 * Shared Pino logger mock utilities
 */

import { vi } from 'vitest';

/**
 * Creates a mock Pino logger instance
 */
export function createMockLogger() {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  };

  return {
    instance: mockLogger,

    /**
     * Clears all mock calls
     */
    clear: () => {
      mockLogger.info.mockClear();
      mockLogger.error.mockClear();
      mockLogger.warn.mockClear();
      mockLogger.debug.mockClear();
      mockLogger.child.mockClear();
    },

    /**
     * Resets all mocks (removes mock implementations)
     */
    reset: () => {
      mockLogger.info.mockReset();
      mockLogger.error.mockReset();
      mockLogger.warn.mockReset();
      mockLogger.debug.mockReset();
      mockLogger.child.mockReset();
    },

    /**
     * Verifies no methods were called
     */
    expectNoCalls: () => {
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    },

    /**
     * Expects specific number of total calls across all levels
     */
    expectTotalCalls: (count: number) => {
      const totalCalls =
        mockLogger.info.mock.calls.length +
        mockLogger.error.mock.calls.length +
        mockLogger.warn.mock.calls.length +
        mockLogger.debug.mock.calls.length;

      expect(totalCalls).toBe(count);
    },
  };
}

/**
 * Sets up logger mock in test file
 * @returns Mock logger instance for assertions
 */
export function setupLoggerMock() {
  const { instance: mockLogger } = createMockLogger();

  vi.mock('../../../src/utils/logger.js', () => ({
    getLogger: vi.fn(() => mockLogger),
    clearLoggerCache: vi.fn(),
    getGlobalConfig: vi.fn(() => ({})),
    LogLevel: {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
    },
  }));

  return mockLogger;
}

/**
 * Setup function that also adds beforeEach cleanup
 */
export function setupLoggerMockWithCleanup() {
  const mockHelper = createMockLogger();

  vi.mock('../../../src/utils/logger.js', () => ({
    getLogger: vi.fn(() => mockHelper.instance),
    clearLoggerCache: vi.fn(),
    getGlobalConfig: vi.fn(() => ({})),
  }));

  // Return cleanup function
  return {
    logger: mockHelper.instance,
    cleanup: () => mockHelper.clear(),
  };
}
```

### 7.3 Usage Examples

```typescript
// Example 1: Basic usage
import { createMockLogger } from '../../utils/logger-mock.js';

const mockLogger = createMockLogger();

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger.instance),
}));

beforeEach(() => {
  mockLogger.clear();
});

// Example 2: With helper
import { setupLoggerMockWithCleanup } from '../../utils/logger-mock.js';

const { logger, cleanup } = setupLoggerMockWithCleanup();

beforeEach(() => {
  cleanup();
});

// Example 3: Advanced assertions
import { createMockLogger } from '../../utils/logger-mock.js';

const mockLogger = createMockLogger();

it('should only log info', () => {
  // ... test code ...

  mockLogger.expectNoCalls(); // Initially no calls

  // ... more code ...

  mockLogger.expectTotalCalls(3); // Exactly 3 calls total
});
```

---

## 8. Advanced Patterns

### 8.1 Conditional Mocking Based on Context

```typescript
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: vi.fn((context: string) => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
    context, // Store context for verification
  })),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: mockLogger,
}));

// Test can verify different contexts
it('should create logger for each component', () => {
  const orchestratorLogger = getLogger('TaskOrchestrator');
  const patcherLogger = getLogger('TaskPatcher');

  expect(orchestratorLogger.context).toBe('TaskOrchestrator');
  expect(patcherLogger.context).toBe('TaskPatcher');
});
```

### 8.2 Recording All Log Calls

```typescript
const logHistory: Array<{
  level: string;
  args: any[];
  timestamp: number;
}> = [];

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn((...args: any[]) => {
      logHistory.push({ level: 'info', args, timestamp: Date.now() });
    }),
    error: vi.fn((...args: any[]) => {
      logHistory.push({ level: 'error', args, timestamp: Date.now() });
    }),
    warn: vi.fn((...args: any[]) => {
      logHistory.push({ level: 'warn', args, timestamp: Date.now() });
    }),
    debug: vi.fn((...args: any[]) => {
      logHistory.push({ level: 'debug', args, timestamp: Date.now() });
    }),
    child: vi.fn(function (this: any) {
      return this;
    }),
  },
}));

beforeEach(() => {
  logHistory.length = 0; // Clear history
});

it('should log in correct order', () => {
  processWorkflow();

  expect(logHistory).toHaveLength(3);
  expect(logHistory[0].level).toBe('info');
  expect(logHistory[0].args[0]).toContain('started');
  expect(logHistory[1].level).toBe('debug');
  expect(logHistory[2].level).toBe('info');
  expect(logHistory[2].args[0]).toContain('completed');
});
```

### 8.3 Mocking Different Log Levels Per Context

```typescript
const { mockLogger, mockGetLogger } = vi.hoisted(() => {
  const loggers = new Map<string, any>();

  const createMockLogger = (level: string = 'info') => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
    level,
  });

  return {
    mockLogger: createMockLogger(),
    mockGetLogger: vi.fn((context: string, options?: any) => {
      const level = options?.level || options?.verbose ? 'debug' : 'info';
      const logger = createMockLogger(level);
      loggers.set(context, logger);
      return logger;
    }),
    getLoggers: () => loggers,
  };
});

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: mockGetLogger,
}));

it('should use debug level for verbose loggers', () => {
  const normalLogger = getLogger('Component1');
  const verboseLogger = getLogger('Component2', { verbose: true });

  expect(normalLogger.level).toBe('info');
  expect(verboseLogger.level).toBe('debug');
});
```

### 8.4 Spy on Real Logger (Integration Tests)

```typescript
// For integration tests that need real logger behavior
import pino from 'pino';

const { write } = vi.hoisted(() => {
  const logs: any[] = [];
  return {
    logs,
    write: vi.fn((chunk: any) => {
      logs.push(JSON.parse(chunk));
    }),
  };
});

const stream = new Writable({
  write: write,
});

const realLogger = pino(
  {
    level: 'debug',
    base: { context: 'IntegrationTest' },
  },
  stream
);

it('should log structured data', () => {
  realLogger.info({ taskId: 'P1.M1.T1' }, 'Task started');

  expect(write.logs).toHaveLength(1);
  expect(write.logs[0]).toMatchObject({
    level: 30,
    taskId: 'P1.M1.T1',
    msg: 'Task started',
    context: 'IntegrationTest',
  });
});
```

---

## 9. Testing Child Loggers

### 9.1 Basic Child Logger Test

```typescript
it('should create child logger with bindings', () => {
  const parent = getLogger('ParentContext');

  const child = parent.child({ taskId: 'P1.M1.T1' });

  expect(mockLogger.child).toHaveBeenCalledWith({ taskId: 'P1.M1.T1' });

  child.info('Child message');

  expect(mockLogger.info).toHaveBeenCalledWith('Child message');
});
```

### 9.2 Nested Child Loggers

```typescript
it('should support nested child loggers', () => {
  const parent = getLogger('Parent');
  const child = parent.child({ taskId: 'P1.M1.T1' });
  const grandchild = child.child({ subtaskId: 'S1' });

  grandchild.info('Grandchild message');

  expect(mockLogger.child).toHaveBeenCalledTimes(2);
  expect(mockLogger.child).toHaveBeenNthCalledWith(1, { taskId: 'P1.M1.T1' });
  expect(mockLogger.child).toHaveBeenNthCalledWith(2, { subtaskId: 'S1' });
  expect(mockLogger.info).toHaveBeenCalledWith('Grandchild message');
});
```

### 9.3 Child Logger Preserves Methods

```typescript
it('child logger should have all log methods', () => {
  const parent = getLogger('Parent');
  const child = parent.child({ key: 'value' });

  child.debug('debug message');
  child.info('info message');
  child.warn('warn message');
  child.error('error message');

  expect(mockLogger.debug).toHaveBeenCalledWith('debug message');
  expect(mockLogger.info).toHaveBeenCalledWith('info message');
  expect(mockLogger.warn).toHaveBeenCalledWith('warn message');
  expect(mockLogger.error).toHaveBeenCalledWith('error message');
});
```

### 9.4 Task Orchestrator Child Logger Pattern

```typescript
describe('TaskOrchestrator child loggers', () => {
  it('should create child logger for each task execution', () => {
    const orchestrator = new TaskOrchestrator();

    orchestrator.executeTask('P1.M1.T1');

    // Verify child logger was created with task context
    expect(mockLogger.child).toHaveBeenCalledWith({
      taskId: 'P1.M1.T1',
    });
  });

  it('should use child logger for task-specific logs', () => {
    const orchestrator = new TaskOrchestrator();

    orchestrator.executeTask('P1.M1.T1');

    // All task logs go through child logger
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'P1.M1.T1',
      }),
      'Task execution started'
    );
  });

  it('should support multiple concurrent tasks', () => {
    const orchestrator = new TaskOrchestrator();

    orchestrator.executeTask('P1.M1.T1');
    orchestrator.executeTask('P1.M1.T2');

    expect(mockLogger.child).toHaveBeenCalledTimes(2);
    expect(mockLogger.child).toHaveBeenNthCalledWith(1, { taskId: 'P1.M1.T1' });
    expect(mockLogger.child).toHaveBeenNthCalledWith(2, { taskId: 'P1.M1.T2' });
  });
});
```

---

## 10. Performance and Optimization

### 10.1 Mock Performance Considerations

**Principle:** Mocks should be fast and have minimal overhead

```typescript
// ✅ GOOD - Simple function mocks
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(function () { return this; }),
};

// ❌ BAD - Complex implementations in mocks
const mockLogger = {
  info: vi.fn((...args) => {
    // Don't do complex processing here
    console.log(JSON.stringify(args));
    logHistory.push({ level: 'info', args });
    return args;
  }),
  // ... other methods with complex logic
};
```

### 10.2 Avoiding Mock Bloat

**Principle:** Only mock what your test needs

```typescript
// ✅ GOOD - Minimal mock for this test
const mockLogger = {
  info: vi.fn(),
};

// ❌ BAD - Always mocking everything "just in case"
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
  level: 'info',
  context: '',
  bindings: {},
  // ... 20 more properties
};
```

### 10.3 Efficient Cleanup

```typescript
// ✅ GOOD - Clear only what was used
beforeEach(() => {
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
});

// ❌ BAD - Clear everything unnecessarily
beforeEach(() => {
  vi.clearAllMocks(); // Slower, clears all mocks in file
});
```

### 10.4 Batch Test Organization

```typescript
// Group tests by what they mock
describe('TaskOrchestrator', () => {
  describe('info logging', () => {
    beforeEach(() => {
      mockLogger.info.mockClear();
    });

    it('should log info message', () => {
      // Only uses info
    });
  });

  describe('error logging', () => {
    beforeEach(() => {
      mockLogger.error.mockClear();
    });

    it('should log error message', () => {
      // Only uses error
    });
  });

  describe('child loggers', () => {
    beforeEach(() => {
      mockLogger.child.mockClear();
    });

    it('should create child logger', () => {
      // Only uses child
    });
  });
});
```

---

## 11. Quick Reference Guide

### 11.1 Standard Mock Pattern

```typescript
// Copy-paste this for new test files
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(function (this: any) { return this; }),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

beforeEach(() => {
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.debug.mockClear();
  mockLogger.child.mockClear();
});
```

### 11.2 Common Assertions

```typescript
// Was it called?
expect(mockLogger.info).toHaveBeenCalled();

// How many times?
expect(mockLogger.info).toHaveBeenCalledTimes(1);

// With what args (exact)?
expect(mockLogger.info).toHaveBeenCalledWith(
  { taskId: 'P1.M1.T1' },
  'Message'
);

// With what args (partial)?
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.objectContaining({ taskId: 'P1.M1.T1' }),
  expect.any(String)
);

// Not called?
expect(mockLogger.error).not.toHaveBeenCalled();
```

### 11.3 Troubleshooting

| Issue | Solution |
|-------|----------|
| `TypeError: logger.child is not a function` | Add `child: vi.fn(function() { return this; })` to mock |
| Test sees calls from previous test | Add `mockClear()` in `beforeEach()` |
| Mock not working | Ensure `vi.mock()` is before imports |
| `getLogger` returns same instance | Mock `clearLoggerCache` |
| Child logger not returning methods | Make `child` return `this` |

---

## 12. Recommendations for Task Orchestrator Tests

### 12.1 Immediate Actions

1. **Add Child Logger Support** to all Task Orchestrator tests
```typescript
// Add to existing mocks
child: vi.fn(function (this: any) { return this; }),
```

2. **Standardize Mock Cleanup** across all test files
```typescript
beforeEach(() => {
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.debug.mockClear();
  mockLogger.child.mockClear();
});
```

3. **Add Mock Helper** to reduce duplication
```typescript
// Create tests/utils/logger-mock.ts
export function createMockLogger() { /* ... */ }
```

### 12.2 Test Categories to Implement

1. **Happy Path Logging**
   - Task started
   - Task completed
   - Status changes

2. **Error Logging**
   - Task failed
   - Dependency errors
   - Session errors

3. **Child Logger Usage**
   - Per-task child loggers
   - Context binding
   - Nested children

4. **Log Levels**
   - Debug in verbose mode
   - Info by default
   - Error always

5. **Structured Data**
   - Task IDs logged
   - Status tracked
   - Errors with context

### 12.3 Migration Checklist

- [ ] Add `child` method to all existing logger mocks
- [ ] Add `beforeEach` cleanup to all test files
- [ ] Update assertions to use `expect.objectContaining()`
- [ ] Add tests for child logger creation
- [ ] Add tests for log level filtering
- [ ] Add tests for error logging patterns
- [ ] Create shared mock helper utilities
- [ ] Document project-specific logging patterns
- [ ] Add logging tests to coverage goals

---

## 13. References and Resources

### 13.1 Official Documentation

- **Pino Documentation:** https://getpino.io/
- **Pino Testing Guide:** https://getpino.io/#/docs/testing
- **Pino API Reference:** https://getpino.io/#/docs/api
- **Vitest Mocking:** https://vitest.dev/guide/mocking.html
- **Vitest vi.mock API:** https://vitest.dev/api/vi.html#vi-mock
- **Vitest vi.hoisted:** https://vitest.dev/api/vi.html#vi-hoisted

### 13.2 Community Resources

- **Vitest Discussions:** https://github.com/vitest-dev/vitest/discussions
- **Pino GitHub:** https://github.com/pinojs/pino
- **StackOverflow Tags:** [pino], [vitest], [jest]

### 13.3 Search Queries for Further Research

- "pino logger unit testing best practices"
- "vitest mock child logger"
- "pino structured logging test patterns"
- "typescript mock logger factory function"
- "testing logger call assertions"

### 13.4 Related Projects

- **pino-test:** Official Pino testing utilities
- **vitest-mock-extended:** Extended mocking utilities for Vitest
- **testdouble.js:** Alternative test double library

---

## 14. Conclusion

### 14.1 Summary of Key Findings

1. **Best Pattern:** Use `vi.hoisted()` with complete mock interface
2. **Critical Component:** Must mock `child` method for Task Orchestrator
3. **Cleanup Essential:** Always clear mocks in `beforeEach()`
4. **Flexible Assertions:** Use `expect.objectContaining()` for data
5. **Type Safety:** Preserve LogLevel enum exports in mocks

### 14.2 Recommendations

1. **Immediate:** Add `child` method to all existing mocks
2. **Short-term:** Create shared mock helper utilities
3. **Long-term:** Develop project-specific testing guidelines

### 14.3 Next Steps

1. Update Task Orchestrator tests with child logger support
2. Add comprehensive logging test coverage
3. Document project-specific patterns
4. Consider integration tests with real logger output

---

**Document Version:** 1.0
**Last Updated:** 2026-01-16
**Author:** Research compilation based on codebase analysis + best practices
**Status:** Ready for implementation
