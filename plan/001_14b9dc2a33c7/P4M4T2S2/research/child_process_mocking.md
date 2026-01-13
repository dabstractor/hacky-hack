# Best Practices for Mocking Node.js child_process in TypeScript/Vitest Tests

> **Research Document**: Comprehensive guide for mocking `child_process.spawn()` in Vitest tests
> **Created**: 2026-01-13
> **Context**: P4M4T2S2 - Bash MCP Tool Testing Enhancement

---

## Table of Contents

1. [Overview](#overview)
2. [Best Practices for Mocking spawn()](#best-practices-for-mocking-spawn)
3. [Mocking ChildProcess Events](#mocking-childprocess-events)
4. [Testing Timeout Handling](#testing-timeout-handling)
5. [Common Pitfalls and Gotchas](#common-pitfalls-and-gotchas)
6. [Vitest-Specific Patterns](#vitest-specific-patterns)
7. [References and Sources](#references-and-sources)

---

## Overview

Testing code that spawns child processes requires careful mocking to avoid:

- Real process execution during tests
- Race conditions from async event emissions
- Flaky tests from timing dependencies
- Incomplete coverage of error scenarios

This guide combines Node.js testing best practices with Vitest-specific patterns, drawing from real implementations in the hacky-hack project.

---

## Best Practices for Mocking spawn()

### 1. Use Top-Level Module Mocking

**Why**: Mocking at the module level ensures all imports receive the same mock, preventing real process execution.

```typescript
// tests/unit/tools/bash-mcp.test.ts
import { vi } from 'vitest';

// Mock at top level before imports
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Now import after mocking
import { spawn, type ChildProcess } from 'node:child_process';

// Get typed mock reference
const mockSpawn = vi.mocked(spawn);
```

**Key Benefits**:

- Single source of truth for the mock
- All code paths use the same mock
- Prevents real `spawn()` calls during tests

**Source**: [Vitest Mocking Documentation](https://vitest.dev/guide/mocking.html)

---

### 2. Create Mock Factory Functions

**Why**: A factory function creates consistent, realistic mock objects with configurable behavior.

```typescript
/**
 * Helper to create mock ChildProcess for testing
 *
 * @remarks
 * Creates a realistic mock of Node.js ChildProcess that emits
 * data events and closes with the specified exit code.
 *
 * @param options - Options for configuring the mock behavior
 * @returns Mock ChildProcess object
 */
function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        // Simulate async close
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

**Usage in Tests**:

```typescript
describe('executeBashCommand', () => {
  let mockChild: ReturnType<typeof createMockChild>;

  beforeEach(() => {
    mockChild = createMockChild();
    mockSpawn.mockReturnValue(mockChild as any);
  });

  it('should execute simple command successfully', async () => {
    const input: BashToolInput = { command: 'echo test' };
    const result = await executeBashCommand(input);

    expect(result.success).toBe(true);
    expect(result.stdout).toBe('test output');
  });
});
```

**Best Practices**:

- Use TypeScript for type safety
- Provide sensible defaults
- Make behavior configurable via options
- Simulate async timing realistically
- Return `unknown as ChildProcess` to satisfy type checks

**Source**: [Testing Node.js Applications - Mocking Child Processes](https://nodejs.org/en/guides/testing/)

---

### 3. Mock Both Success and Failure Scenarios

**Success Case**:

```typescript
it('should execute simple command successfully', async () => {
  // SETUP
  mockChild = createMockChild({ stdout: 'captured output' });
  mockSpawn.mockReturnValue(mockChild as any);
  const input: BashToolInput = { command: 'cat file.txt' };

  // EXECUTE
  const result = await executeBashCommand(input);

  // VERIFY
  expect(result.stdout).toBe('captured output');
  expect(result.exitCode).toBe(0);
});
```

**Failure Case (Non-Zero Exit)**:

```typescript
it('should return failure for non-zero exit code', async () => {
  // SETUP
  mockChild = createMockChild({ exitCode: 1, stderr: 'error occurred' });
  mockSpawn.mockReturnValue(mockChild as any);
  const input: BashToolInput = { command: 'false' };

  // EXECUTE
  const result = await executeBashCommand(input);

  // VERIFY
  expect(result.success).toBe(false);
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toBe('error occurred');
  expect(result.error).toContain('failed with exit code 1');
});
```

**Spawn Errors**:

```typescript
it('should handle spawn errors (command not found)', async () => {
  // SETUP - spawn throws an error
  const spawnError = new Error('spawn echo ENOENT');
  mockSpawn.mockImplementation(() => {
    throw spawnError;
  });

  const input: BashToolInput = { command: 'echo test' };

  // EXECUTE
  const result = await executeBashCommand(input);

  // VERIFY
  expect(result.success).toBe(false);
  expect(result.exitCode).toBeNull();
  expect(result.error).toContain('ENOENT');
});
```

---

## Mocking ChildProcess Events

### Understanding ChildProcess Event Flow

The `ChildProcess` object emits several critical events:

```typescript
child.stdout.on('data', (data: Buffer) => {
  /* ... */
});
child.stderr.on('data', (data: Buffer) => {
  /* ... */
});
child.on('close', (exitCode: number) => {
  /* ... */
});
child.on('error', (error: Error) => {
  /* ... */
});
```

### 1. Mocking Data Events

**Pattern**: Use `setTimeout` to simulate async data emission

```typescript
function createMockChild(options: { stdout?: string; stderr?: string } = {}) {
  const { stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
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
  };
}
```

**Key Points**:

- Always use `Buffer.from()` to match real behavior
- Add small delays (5ms) to simulate async I/O
- Emit data in chunks for realistic testing

---

### 2. Mocking Close Event

**Pattern**: Close event emits exit code after all data events

```typescript
function createMockChild(options: { exitCode?: number } = {}) {
  const { exitCode = 0 } = options;

  return {
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        // Simulate async close (after data events)
        setTimeout(() => callback(exitCode), 10);
      }
    }),
  };
}
```

**Timing Strategy**:

- Data events: 5ms delay
- Close event: 10ms delay (after data)
- Ensures proper event ordering

---

### 3. Mocking Error Events

**Pattern**: Manually trigger error callbacks for async error testing

```typescript
it('should handle async child process error events', async () => {
  // SETUP - child emits 'error' event asynchronously
  let errorCallback: ((error: Error) => void) | null = null;
  const erroringChild = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, callback: any) => {
      if (event === 'error') errorCallback = callback;
    }),
    kill: vi.fn(),
    killed: false,
  } as any;
  mockSpawn.mockReturnValue(erroringChild);

  const input: BashToolInput = { command: 'failing-command' };

  // EXECUTE - start command but don't await yet
  const resultPromise = executeBashCommand(input);

  // Emit error event
  if (errorCallback) {
    errorCallback(new Error('EMFILE: too many open files'));
  }

  const result = await resultPromise;

  // VERIFY
  expect(result.success).toBe(false);
  expect(result.exitCode).toBeNull();
  expect(result.error).toBe('EMFILE: too many open files');
});
```

**Common Error Types to Test**:

- `ENOENT`: Command not found
- `EACCES`: Permission denied
- `EMFILE`: Too many open files
- Generic spawn errors

---

### 4. Testing Data Events After Kill

**Critical Pattern**: Ensure data after process kill is ignored

```typescript
it('should handle data events after kill (should ignore)', async () => {
  // SETUP - Mock child that emits data after timeout
  let stdoutCallback: ((data: Buffer) => void) | null = null;
  let closeCallback: ((code: number) => void) | null = null;
  let childKilled = false;
  const mockChild = {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') stdoutCallback = callback;
      }),
    },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, callback: any) => {
      if (event === 'close') closeCallback = callback;
    }),
    kill: vi.fn(() => {
      childKilled = true;
    }),
    get killed() {
      return childKilled;
    },
  };
  mockSpawn.mockReturnValue(mockChild as any);

  const input: BashToolInput = { command: 'slow-cmd', timeout: 10 };

  // EXECUTE - start command but don't await
  const resultPromise = executeBashCommand(input);

  // Wait for timeout
  await new Promise(resolve => setTimeout(resolve, 20));

  // Try to send data after kill (should be ignored)
  if (stdoutCallback) {
    stdoutCallback(Buffer.from('late data'));
  }

  // Trigger close
  if (closeCallback) {
    closeCallback(143);
  }

  const result = await resultPromise;

  // VERIFY - late data should not be in stdout
  expect(result.stdout).toBe('');
  expect(mockChild.kill).toHaveBeenCalled();
});
```

**Implementation Requirement**:

```typescript
// In production code
if (child.stdout) {
  child.stdout.on('data', (data: Buffer) => {
    if (killed) return; // Critical: ignore data after kill
    stdout += data.toString();
  });
}
```

---

## Testing Timeout Handling

### 1. Testing with Real Timers (Recommended)

**Why**: Real timers catch race conditions and timing bugs that fake timers miss.

```typescript
it('should handle timeout correctly', async () => {
  // SETUP - Create a child that never closes
  let closeCallback: ((code: number) => void) | null = null;
  let childKilled = false;
  mockChild = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, callback: any) => {
      if (event === 'close') closeCallback = callback;
    }),
    kill: vi.fn(() => {
      childKilled = true;
    }),
    get killed() {
      return childKilled;
    },
  } as any;
  mockSpawn.mockReturnValue(mockChild);

  const input: BashToolInput = { command: 'sleep 100', timeout: 50 };

  // EXECUTE
  const resultPromise = executeBashCommand(input);

  // Wait for timeout
  await new Promise(resolve => setTimeout(resolve, 100));

  // VERIFY - kill should be called with SIGTERM
  expect(mockChild.killed).toBe(true);
  expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');

  // Clean up - trigger close to resolve promise
  if (closeCallback) {
    closeCallback(143); // SIGTERM exit code
  }
  await resultPromise;
});
```

**Best Practices**:

- Use short timeouts (50-100ms) for fast tests
- Always cleanup by triggering close event
- Verify correct signal (SIGTERM, then SIGKILL)

---

### 2. Testing SIGKILL Fallback

**Pattern**: Test graceful shutdown then force kill

```typescript
it('should send SIGKILL if SIGTERM does not kill process', async () => {
  // SETUP - Create a stubborn child that ignores SIGTERM
  let closeCallback: ((code: number) => void) | null = null;
  let childKilled = false;
  const killCalls: string[] = [];
  const stubbornChild = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, callback: any) => {
      if (event === 'close') closeCallback = callback;
    }),
    kill: vi.fn((signal: string) => {
      killCalls.push(signal);
      childKilled = signal === 'SIGKILL'; // Only SIGKILL "kills" this child
    }),
    get killed() {
      return childKilled;
    },
  } as any;
  mockSpawn.mockReturnValue(stubbornChild);

  const input: BashToolInput = { command: 'stubborn', timeout: 10 };

  // EXECUTE - start command
  const resultPromise = executeBashCommand(input);

  // Wait for initial timeout + SIGKILL grace period
  await new Promise(resolve => setTimeout(resolve, 2250));

  // VERIFY - both SIGTERM and SIGKILL should be called
  expect(killCalls).toContain('SIGTERM');
  expect(killCalls).toContain('SIGKILL');

  // Clean up - trigger close to resolve promise
  if (closeCallback) {
    closeCallback(137); // SIGKILL exit code
  }
  await resultPromise;
});
```

**Implementation Pattern**:

```typescript
// Production code
const timeoutId = setTimeout(() => {
  timedOut = true;
  killed = true;
  child.kill('SIGTERM');

  // Force kill after grace period
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 2000);
}, timeout);
```

---

### 3. Fake Timers Approach (Use with Caution)

**When to Use**: Only for testing complex timeout logic without real delays.

```typescript
it('should include timeout error in result', async () => {
  // SETUP
  const mockChild = createMockChild({ exitCode: 143 });
  mockSpawn.mockReturnValue(mockChild as any);

  // Mock setTimeout to trigger immediately
  vi.useFakeTimers();
  const input: BashToolInput = { command: 'sleep 100', timeout: 50 };

  // EXECUTE
  const resultPromise = executeBashCommand(input);
  vi.advanceTimersByTime(60);
  await resultPromise;

  // Clean up
  vi.useRealTimers();
});
```

**Pitfalls of Fake Timers**:

- Don't test real async behavior
- Can miss race conditions
- Complex to set up correctly
- Often unnecessary for timeout testing

**Recommendation**: Use real timers for timeout testing whenever possible.

---

## Common Pitfalls and Gotchas

### 1. Forgetting to Clear Mocks Between Tests

**Problem**: Mock state leaks between tests causing flaky failures.

**Solution**: Always clear mocks in `afterEach`:

```typescript
describe('executeBashCommand', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Tests...
});
```

---

### 2. Not Simulating Async Event Timing

**Problem**: Tests pass with synchronous mocks but fail with real async events.

**Bad Example**:

```typescript
// BAD - Immediate synchronous callback
stdout: {
  on: vi.fn((event, callback) => {
    callback(Buffer.from('output')); // Synchronous!
  }),
}
```

**Good Example**:

```typescript
// GOOD - Async callback with delay
stdout: {
  on: vi.fn((event, callback) => {
    if (event === 'data') {
      setTimeout(() => callback(Buffer.from('output')), 5);
    }
  }),
}
```

---

### 3. Ignoring Data After Process Kill

**Problem**: Tests don't verify late data is rejected after timeout.

**Solution**: Always test data-after-kill scenario:

```typescript
// After timeout
expect(mockChild.killed).toBe(true);

// Try to send late data
stdoutCallback(Buffer.from('late data'));

// Verify it's ignored
expect(result.stdout).toBe('');
```

**Implementation Must-Have**:

```typescript
child.stdout.on('data', (data: Buffer) => {
  if (killed) return; // Critical check
  stdout += data.toString();
});
```

---

### 4. Not Testing All Error Paths

**Common Missed Scenarios**:

- Spawn throws synchronously (command not found)
- Child emits async 'error' event
- Non-Error objects thrown
- Empty command strings

**Complete Error Testing**:

```typescript
describe('spawn error handling', () => {
  it('should handle spawn errors (command not found)', async () => {
    const spawnError = new Error('spawn echo ENOENT');
    mockSpawn.mockImplementation(() => {
      throw spawnError;
    });

    const result = await executeBashCommand({ command: 'echo test' });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBeNull();
    expect(result.error).toContain('ENOENT');
  });

  it('should handle async child process error events', async () => {
    let errorCallback: ((error: Error) => void) | null = null;
    const erroringChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, callback: any) => {
        if (event === 'error') errorCallback = callback;
      }),
      kill: vi.fn(),
      killed: false,
    } as any;
    mockSpawn.mockReturnValue(erroringChild);

    const resultPromise = executeBashCommand({ command: 'failing-command' });

    // Emit error event
    if (errorCallback) {
      errorCallback(new Error('EMFILE: too many open files'));
    }

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toBe('EMFILE: too many open files');
  });

  it('should handle non-Error objects thrown during spawn', async () => {
    mockSpawn.mockImplementation(() => {
      throw 'string error'; // Not an Error object
    });

    const result = await executeBashCommand({ command: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });
});
```

---

### 5. Mocking spawn() Wrong Way

**Bad**: Mocking individual imports

```typescript
// BAD - Inconsistent mocking
import * as childProcess from 'child_process';

vi.spyOn(childProcess, 'spawn').mockReturnValue(mockChild);
```

**Good**: Top-level module mocking

```typescript
// GOOD - Consistent mocking across all imports
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { spawn } from 'node:child_process';
const mockSpawn = vi.mocked(spawn);
```

---

### 6. Not Verifying spawn() Arguments

**Problem**: Tests don't verify correct spawn configuration.

**Solution**: Always verify spawn calls:

```typescript
it('should use shell: false for security', async () => {
  await executeBashCommand({ command: 'echo test' });

  expect(mockSpawn).toHaveBeenCalledWith(
    'echo',
    ['test'],
    expect.objectContaining({
      shell: false, // Critical for security
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  );
});

it('should pass cwd to spawn when provided', async () => {
  await executeBashCommand({ command: 'ls', cwd: '/tmp' });

  expect(mockSpawn).toHaveBeenCalledWith(
    'ls',
    [],
    expect.objectContaining({
      cwd: '/tmp',
    })
  );
});
```

---

### 7. Race Conditions in Promise Resolution

**Problem**: Tests fail intermittently due to timing issues.

**Solution**: Use proper async/await patterns:

```typescript
// BAD - Not awaiting properly
const resultPromise = executeBashCommand(input);
// Do assertions
await resultPromise;

// GOOD - Explicit control flow
const resultPromise = executeBashCommand(input);
await new Promise(resolve => setTimeout(resolve, 100));
expect(mockChild.kill).toHaveBeenCalled();
if (closeCallback) closeCallback(143);
const result = await resultPromise;
expect(result.success).toBe(false);
```

---

## Vitest-Specific Patterns

### 1. Using vi.mocked() for Type Safety

**Pattern**: Get typed mock references

```typescript
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

// Mock modules
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn(path => path),
}));

// Get typed mocks
const mockSpawn = vi.mocked(spawn);
const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);

// Now you get autocomplete and type checking
mockSpawn.mockReturnValue(mockChild);
mockExistsSync.mockReturnValue(false);
```

---

### 2. Mock Return Values with vi.fn()

**Pattern**: Configure mock behavior per test

```typescript
describe('different scenarios', () => {
  it('should handle success', () => {
    mockSpawn.mockReturnValue(createMockChild({ exitCode: 0 }));
  });

  it('should handle failure', () => {
    mockSpawn.mockReturnValue(createMockChild({ exitCode: 1 }));
  });

  it('should handle errors', () => {
    mockSpawn.mockImplementation(() => {
      throw new Error('ENOENT');
    });
  });
});
```

---

### 3. Global Test Setup

**Pattern**: Use `beforeEach` for consistent state

```typescript
describe('executeBashCommand', () => {
  let mockChild: ReturnType<typeof createMockChild>;

  beforeEach(() => {
    // Reset state before each test
    mockChild = createMockChild();
    mockSpawn.mockReturnValue(mockChild as any);
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation(path => path as string);
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });
});
```

---

### 4. Organizing Tests with describe Blocks

**Pattern**: Group related tests

```typescript
describe('executeBashCommand', () => {
  describe('successful execution', () => {
    it('should execute simple command successfully', async () => {});
    it('should use default timeout of 30000ms', async () => {});
    it('should capture stdout correctly', async () => {});
  });

  describe('failed execution', () => {
    it('should return failure for non-zero exit code', async () => {});
    it('should capture stderr for failed commands', async () => {});
  });

  describe('timeout handling', () => {
    it('should handle timeout correctly', async () => {});
    it('should send SIGKILL if SIGTERM does not kill process', async () => {});
  });

  describe('spawn error handling', () => {
    it('should handle spawn errors (command not found)', async () => {});
    it('should handle async child process error events', async () => {});
  });
});
```

---

### 5. Using expect.objectContaining()

**Pattern**: Partial object matching

```typescript
it('should pass cwd to spawn when provided', async () => {
  await executeBashCommand({ command: 'ls', cwd: '/tmp' });

  expect(mockSpawn).toHaveBeenCalledWith(
    'ls',
    [],
    expect.objectContaining({
      cwd: '/tmp',
      // Don't need to specify all properties
    })
  );
});
```

---

### 6. Testing Async Errors with rejects.toThrow()

**Pattern**: Test thrown errors

```typescript
it('should validate working directory exists', async () => {
  mockExistsSync.mockReturnValue(false);
  const input: BashToolInput = { command: 'ls', cwd: '/nonexistent' };

  await expect(executeBashCommand(input)).rejects.toThrow(
    'Working directory does not exist: /nonexistent'
  );
});
```

---

## Complete Example: Comprehensive Test Suite

Here's a complete example from the hacky-hack project demonstrating all best practices:

```typescript
/**
 * Unit tests for Bash MCP tool
 *
 * @remarks
 * Tests validate bash command execution with security constraints
 * and achieve 100% code coverage of src/tools/bash-mcp.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock child_process to avoid actual command execution
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock fs modules for directory validation
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn(path => path),
}));

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import {
  executeBashCommand,
  type BashToolInput,
} from '../../../src/tools/bash-mcp.js';

const mockSpawn = vi.mocked(spawn);
const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);

describe('tools/bash-mcp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeBashCommand', () => {
    let mockChild: ReturnType<typeof createMockChild>;

    beforeEach(() => {
      mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild as any);
      mockExistsSync.mockReturnValue(true);
      mockRealpathSync.mockImplementation(path => path as string);
    });

    // Success cases...
    // Failure cases...
    // Timeout cases...
    // Error cases...
  });
});

/**
 * Helper to create mock ChildProcess for testing
 */
function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

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
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

---

## Summary of Key Recommendations

### Do's:

1. **Mock at module level** using `vi.mock()`
2. **Create mock factories** for consistent test objects
3. **Simulate async timing** with `setTimeout`
4. **Test all error paths**: spawn errors, async errors, non-Error objects
5. **Verify spawn arguments** including security settings
6. **Use real timers** for timeout testing
7. **Clean up mocks** in `afterEach`
8. **Test data-after-kill** scenarios
9. **Use typed mocks** with `vi.mocked()`

### Don'ts:

1. **Don't use real `spawn()`** in tests
2. **Don't make callbacks synchronous**
3. **Don't forget to clear mocks**
4. **Don't skip error path testing**
5. **Don't rely on fake timers** unless necessary
6. **Don't let state leak** between tests
7. **Don't ignore edge cases**: empty commands, relative paths, etc.

---

## References and Sources

### Official Documentation

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html) - Official Vitest mocking documentation
- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html) - Child process API reference
- [Node.js Testing Best Practices](https://nodejs.org/en/guides/testing/) - Official testing guidelines

### Testing Patterns

- [Testing Node.js Applications](https://nodejs.dev/learn) - Comprehensive testing guide
- [Unit Testing Async Code](https://jestjs.io/docs/asynchronous) - Patterns applicable to Vitest
- [Mock Functions in Vitest](https://vitest.dev/api/#vi-fn) - vi.fn() reference

### Specific Examples

- **hacky-hack project**: `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts`
  - Production-ready implementation with 100% coverage
  - Real-world timeout handling tests
  - Comprehensive error path testing

### Community Resources

- [Vitest GitHub Discussions](https://github.com/vitest-dev/vitest/discussions) - Community Q&A
- [Node.js Testing Working Group](https://github.com/nodejs/testing) - Best practices discussions

### Security Considerations

- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- Always test `shell: false` to prevent shell injection
- Verify command parsing to prevent argument injection

---

## Appendix: Common Exit Codes

```typescript
// Standard exit codes for testing
const EXIT_CODES = {
  SUCCESS: 0, // Command succeeded
  GENERAL_ERROR: 1, // Catch-all for errors
  MISUSE: 2, // Shell builtin misuse
  CANNOT_EXECUTE: 126, // Command found but not executable
  COMMAND_NOT_FOUND: 127, // Command not found
  SIGTERM: 143, // Killed by SIGTERM (128 + 15)
  SIGKILL: 137, // Killed by SIGKILL (128 + 9)
};
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Maintainer**: Research for P4M4T2S2 Task
