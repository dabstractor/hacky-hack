# Comprehensive Research: Testing Node.js Resource Monitoring

**Research Date:** 2025-01-19
**Purpose:** Deep external research for testing Node.js resource monitoring to create comprehensive PRP (Prompt Response Pattern)
**Status:** External research tools at usage limit - compiled from authoritative documentation sources and testing best practices

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Node.js process.memoryUsage() Mocking](#testing-nodejs-processmemoryusage-mocking)
3. [Testing File Handle Monitoring Patterns](#testing-file-handle-monitoring-patterns)
4. [Testing Command Execution Mocking in Node.js/Vitest](#testing-command-execution-mocking-in-nodejsvitest)
5. [Vitest Patterns for Testing Timers](#vitest-patterns-for-testing-timers)
6. [Testing Resource Limit Enforcement](#testing-resource-limit-enforcement)
7. [Platform-Specific Testing Considerations](#platform-specific-testing-considerations)
8. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
9. [Official Documentation URLs](#official-documentation-urls)
10. [Code Examples Repository](#code-examples-repository)

---

## Executive Summary

This research document provides comprehensive guidance on testing Node.js resource monitoring functionality, including memory usage, file handle tracking, command execution, and time-based limits. The findings are organized by testing category with specific code examples, best practices, and platform-specific considerations.

**Key Research Findings:**

1. **Memory Testing**: Mock `process.memoryUsage()` and `os.totalmem()/os.freemem()` for deterministic tests
2. **File Handle Testing**: Mock `process._getActiveHandles()`, `readdirSync()`, and `execSync()` for cross-platform tests
3. **Command Execution**: Use `vi.spyOn()` for `child_process` mocking with realistic outputs
4. **Timer Testing**: Use `vi.useFakeTimers()` with `vi.advanceTimersByTime()` for time-based limit testing
5. **Platform Testing**: Implement platform-specific mocks with conditional logic
6. **Integration Testing**: Test resource monitoring with real system metrics in controlled environments

---

## Testing Node.js process.memoryUsage() Mocking

### Official Documentation

**Node.js process.memoryUsage() API:**
- **URL:** https://nodejs.org/api/process.html#processmemoryusage
- **Section:** `process.memoryUsage()`
- **Returns:** `Object` with properties:
  - `rss` (Resident Set Size) - Total memory occupied by process
  - `heapTotal` - Total size of the allocated heap
  - `heapUsed` - Actual memory used in the heap
  - `external` - Memory used by C++ objects bound to JavaScript objects
  - `arrayBuffers` - Memory allocated for ArrayBuffers and SharedArrayBuffers

### Mocking Strategies

#### Strategy 1: Direct Function Mocking (Recommended)

**Best Practice:** Mock the entire `process.memoryUsage` function to return controlled values.

```typescript
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('Memory Monitoring with Mocked process.memoryUsage', () => {
  const originalMemoryUsage = process.memoryUsage;

  beforeEach(() => {
    // Mock process.memoryUsage to return deterministic values
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 50_000_000,      // 50MB
      heapTotal: 40_000_000, // 40MB
      heapUsed: 30_000_000,  // 30MB
      external: 2_000_000,   // 2MB
      arrayBuffers: 0,       // 0MB
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should track heap memory usage correctly', () => {
    const usage = process.memoryUsage();
    expect(usage.heapUsed).toBe(30_000_000);
    expect(usage.heapTotal).toBe(40_000_000);
    expect(usage.heapUsed / usage.heapTotal).toBe(0.75); // 75% usage
  });

  it('should detect memory threshold exceeded', () => {
    // Simulate high memory usage
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 100_000_000,
      heapTotal: 90_000_000,
      heapUsed: 85_000_000, // 94.4% usage
      external: 5_000_000,
      arrayBuffers: 0,
    });

    const usage = process.memoryUsage();
    const usageRatio = usage.heapUsed / usage.heapTotal;
    expect(usageRatio).toBeGreaterThan(0.9); // Critical threshold
  });
});
```

#### Strategy 2: Dynamic Memory Mocking for Testing Growth

**Best Practice:** Test memory leak detection by simulating growing memory usage over time.

```typescript
describe('Memory Leak Detection Testing', () => {
  it('should detect memory growth over time', () => {
    const monitor = new ResourceMonitor({ pollingInterval: 100 });
    monitor.start();

    // Initial memory state
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 100_000_000,
      heapTotal: 80_000_000,
      heapUsed: 40_000_000, // 50% usage
      external: 5_000_000,
      arrayBuffers: 0,
    });

    vi.advanceTimersByTime(150);

    // Simulate 25% memory growth
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 125_000_000,
      heapTotal: 100_000_000,
      heapUsed: 50_000_000, // 50% usage, but 25% growth in absolute terms
      external: 6_000_000,
      arrayBuffers: 0,
    });

    vi.advanceTimersByTime(150);

    // Leak detection should trigger
    // Verify warning was logged

    monitor.stop();
  });
});
```

#### Strategy 3: Mocking System Memory (os module)

**Best Practice:** Mock both process memory and system memory for comprehensive testing.

```typescript
import * as os from 'node:os';

describe('System Memory Testing', () => {
  beforeEach(() => {
    // Mock system memory
    vi.spyOn(os, 'totalmem').mockReturnValue(16_000_000_000); // 16GB
    vi.spyOn(os, 'freemem').mockReturnValue(8_000_000_000);  // 8GB free

    // Mock process memory
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 500_000_000,
      heapTotal: 400_000_000,
      heapUsed: 350_000_000,
      external: 50_000_000,
      arrayBuffers: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should calculate system memory usage percentage', () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usageRatio = usedMem / totalMem;

    expect(usageRatio).toBe(0.5); // 50% usage
  });

  it('should trigger warning at system memory threshold', () => {
    // Simulate high system memory usage
    vi.spyOn(os, 'totalmem').mockReturnValue(16_000_000_000);
    vi.spyOn(os, 'freemem').mockReturnValue(1_600_000_000); // Only 10% free

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usageRatio = (totalMem - freeMem) / totalMem;

    expect(usageRatio).toBe(0.9); // 90% usage - critical threshold
  });
});
```

### Common Pitfalls

**Pitfall 1:** Not restoring mocks between tests
```typescript
// ❌ BAD: Mocks persist between tests
vi.spyOn(process, 'memoryUsage').mockReturnValue({...});

// ✅ GOOD: Always restore in afterEach
afterEach(() => {
  vi.restoreAllMocks();
});
```

**Pitfall 2:** Using unrealistic memory values
```typescript
// ❌ BAD: Unrealistic values
vi.spyOn(process, 'memoryUsage').mockReturnValue({
  heapUsed: 999999999999999,
  heapTotal: 1000000000000000,
});

// ✅ GOOD: Realistic Node.js memory values
vi.spyOn(process, 'memoryUsage').mockReturnValue({
  rss: 100_000_000,      // 100MB RSS
  heapTotal: 80_000_000, // 80MB heap
  heapUsed: 60_000_000,  // 60MB used
  external: 10_000_000,
  arrayBuffers: 0,
});
```

**Pitfall 3:** Forgetting that heapUsed can exceed heapTotal temporarily
```typescript
// ✅ GOOD: Handle edge cases where heapUsed > heapTotal
const usage = process.memoryUsage();
const usageRatio = Math.min(usage.heapUsed / usage.heapTotal, 1.0);
```

---

## Testing File Handle Monitoring Patterns

### Platform-Specific Implementation

**File Handle Detection Methods by Platform:**

1. **Linux:** Read `/proc/<pid>/fd` directory (fast, accurate)
2. **macOS:** Use `lsof -p <pid>` command (slower, requires spawn)
3. **Windows:** No ulimit concept, use `process._getActiveHandles()` only
4. **Cross-platform:** Use `process._getActiveHandles()` as primary method

### Mocking Strategy for File Handles

#### Strategy 1: Mocking Internal API (process._getActiveHandles)

**Best Practice:** Mock the internal Node.js API for consistent cross-platform testing.

```typescript
describe('File Handle Monitoring', () => {
  beforeEach(() => {
    // Mock process._getActiveHandles (internal API)
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(100).fill({})
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect file handle count via internal API', () => {
    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    expect(status.snapshot.fileHandles).toBe(100);
  });

  it('should calculate file handle usage percentage', () => {
    // Mock 700 open handles with ulimit of 1024
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(700).fill({})
    );

    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    expect(status.snapshot.fileHandles).toBe(700);
    expect(status.snapshot.fileHandleUsage).toBeCloseTo(700 / 1024, 2);
  });
});
```

#### Strategy 2: Mocking Linux /proc filesystem

**Best Practice:** Test platform-specific fallback mechanisms.

```typescript
import { readdirSync } from 'node:fs';
import { existsSync } from 'node:fs';

describe('Linux File Handle Detection', () => {
  beforeEach(() => {
    // Mock platform detection
    vi.spyOn(process, 'platform').mockReturnValue('linux');

    // Mock /proc/<pid>/fd existence
    vi.spyOn(process, 'pid').mockReturnValue(12345);

    // Mock existsSync for /proc path
    vi.mocked(existsSync).mockImplementation((path) => {
      if (typeof path === 'string' && path.includes('/proc/12345/fd')) {
        return true;
      }
      return false;
    });

    // Mock readdirSync to return file handle count
    vi.spyOn(require('node:fs'), 'readdirSync').mockReturnValue(
      Array.from({ length: 250 }, (_, i) => `${i}`)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should read file handles from /proc/<pid>/fd on Linux', () => {
    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    expect(status.snapshot.fileHandles).toBe(250);
  });
});
```

#### Strategy 3: Mocking macOS lsof Command

**Best Practice:** Mock `child_process.execSync` for lsof testing.

```typescript
import { execSync } from 'node:child_process';

describe('macOS File Handle Detection', () => {
  beforeEach(() => {
    // Mock platform as macOS
    vi.spyOn(process, 'platform').mockReturnValue('darwin');

    // Mock ulimit command
    vi.spyOn(require('node:child_process'), 'execSync').mockImplementation(
      (command: string) => {
        if (command.includes('lsof')) {
          // Mock lsof output: header + 500 lines
          return 'HEADER\n' + 'line\n'.repeat(500);
        }
        if (command.includes('ulimit')) {
          return '1024\n';
        }
        return '';
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use lsof on macOS', () => {
    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    expect(status.snapshot.fileHandles).toBe(500);
    expect(status.snapshot.fileHandleUlimit).toBe(1024);
  });

  it('should handle lsof command timeout gracefully', () => {
    // Mock lsof timeout
    vi.spyOn(require('node:child_process'), 'execSync').mockImplementation(() => {
      throw new Error('Command timed out');
    });

    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    // Should fall back to 0 handles on error
    expect(status.snapshot.fileHandles).toBe(0);
  });
});
```

### Testing File Handle Leak Detection

**Best Practice:** Simulate file handle growth over time with fake timers.

```typescript
describe('File Handle Leak Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should detect file handle growth >20% over sampling window', () => {
    const logger = getLogger('ResourceMonitor');
    const warnSpy = vi.spyOn(logger, 'warn');

    const monitor = new ResourceMonitor({ pollingInterval: 100 });
    monitor.start();

    // Initial state: 100 file handles
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(100).fill({})
    );
    vi.advanceTimersByTime(150);

    // After 150ms: 125 file handles (25% growth)
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(125).fill({})
    );
    vi.advanceTimersByTime(150);

    // After 300ms: 150 file handles (50% total growth)
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(150).fill({})
    );
    vi.advanceTimersByTime(150);

    // Should have logged leak warning
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        growth: expect.any(String),
      }),
      'Potential file handle leak detected'
    );

    monitor.stop();
  });
});
```

### Common Pitfalls

**Pitfall 1:** Not testing all code paths (internal API, /proc, lsof)
```typescript
// ✅ GOOD: Test all three detection methods
describe('File Handle Detection', () => {
  it('should use internal API when available', () => { /* ... */ });
  it('should fall back to /proc on Linux', () => { /* ... */ });
  it('should fall back to lsof on macOS', () => { /* ... */ });
  it('should return 0 on Windows', () => { /* ... */ });
});
```

**Pitfall 2:** Not handling lsof timeout
```typescript
// ❌ BAD: lsof can hang indefinitely
const result = execSync(`lsof -p ${process.pid}`);

// ✅ GOOD: Always use timeout with lsof
const result = execSync(`lsof -p ${process.pid}`, {
  timeout: 5000, // 5 second timeout
});
```

**Pitfall 3:** Forgetting lsof output includes header line
```typescript
// ❌ BAD: Doesn't subtract header
const result = execSync(`lsof -p ${process.pid}`);
const handleCount = parseInt(result.trim(), 10);

// ✅ GOOD: Subtract header line
const result = execSync(`lsof -p ${process.pid}`, {
  stdio: ['ignore', 'pipe', 'ignore'],
});
const handleCount = parseInt(result.trim(), 10) - 1; // Subtract header
```

---

## Testing Command Execution Mocking in Node.js/Vitest

### Official Documentation

**Vitest Mocking API:**
- **URL:** https://vitest.dev/api/vi.html#vi-spyon
- **Section:** `vi.spyOn()`
- **Description:** Spies on object methods or getters/setters

### Mocking child_process.execSync

#### Strategy 1: Basic execSync Mocking

**Best Practice:** Mock `execSync` to return controlled command outputs.

```typescript
import { execSync } from 'node:child_process';

describe('Command Execution Testing', () => {
  beforeEach(() => {
    // Mock execSync for all commands
    vi.mock('node:child_process', async () => {
      const actual = await vi.importActual('node:child_process');
      return {
        ...actual,
        execSync: vi.fn(),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should mock ulimit -n command', () => {
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue('1024\n');

    const result = execSync('ulimit -n', { encoding: 'utf-8' });

    expect(result).toBe('1024\n');
    expect(mockExecSync).toHaveBeenCalledWith('ulimit -n', expect.any(Object));
  });

  it('should mock lsof command with realistic output', () => {
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue(
      'COMMAND   PID USER   FD     TYPE DEVICE SIZE/OFF NODE NAME\n' +
      'node    12345 user  cwd      DIR    8,1    4096    2 /home/user\n' +
      'node    12345 user  rtd      DIR    8,1    4096    2 /\n'
    );

    const result = execSync('lsof -p 12345', { encoding: 'utf-8' });
    const lines = result.trim().split('\n');

    expect(lines.length).toBe(3); // Header + 2 lines
  });
});
```

#### Strategy 2: Conditional Command Mocking

**Best Practice:** Return different outputs based on the command being executed.

```typescript
describe('Conditional Command Mocking', () => {
  beforeEach(() => {
    vi.mock('node:child_process', async () => {
      const actual = await vi.importActual('node:child_process');
      return {
        ...actual,
        execSync: vi.fn((command: string, options: any) => {
          // ulimit command
          if (command.includes('ulimit')) {
            return '256\n';
          }

          // lsof command
          if (command.includes('lsof')) {
            return 'HEADER\n' + 'line\n'.repeat(200);
          }

          // Unknown command
          throw new Error(`Unknown command: ${command}`);
        }),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle ulimit command', () => {
    const result = execSync('ulimit -n', { encoding: 'utf-8' });
    expect(result.trim()).toBe('256');
  });

  it('should handle lsof command', () => {
    const result = execSync('lsof -p 12345', { encoding: 'utf-8' });
    const lines = result.trim().split('\n');
    expect(lines.length).toBe(201); // Header + 200 lines
  });
});
```

#### Strategy 3: Error Handling Testing

**Best Practice:** Test error conditions like command timeouts and missing commands.

```typescript
describe('Command Error Handling', () => {
  it('should handle execSync timeout error', () => {
    vi.mock('node:child_process', async () => {
      const actual = await vi.importActual('node:child_process');
      return {
        ...actual,
        execSync: vi.fn(() => {
          const error: any = new Error('Command timed out');
          error.status = 124;
          error.signal = 'SIGALRM';
          throw error;
        }),
      };
    });

    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    // Should handle timeout gracefully
    expect(status.snapshot.fileHandleUlimit).toBeGreaterThanOrEqual(0);
  });

  it('should handle command not found error', () => {
    vi.mock('node:child_process', async () => {
      const actual = await vi.importActual('node:child_process');
      return {
        ...actual,
        execSync: vi.fn(() => {
          const error: any = new Error('Command not found: lsof');
          error.code = 'ENOENT';
          error.errno = -2;
          throw error;
        }),
      };
    });

    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    // Should fall back to default values
    expect(status.snapshot.fileHandles).toBe(0);
  });
});
```

### Testing with Real Commands (Integration Tests)

**Best Practice:** Use real commands in integration tests with proper platform detection.

```typescript
describe('Integration: Real Command Execution', () => {
  it('should execute ulimit on Unix systems', () => {
    // Skip on Windows
    if (process.platform === 'win32') {
      return;
    }

    // Use real execSync for integration test
    const ulimit = execSync('ulimit -n', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000,
    });

    const limit = parseInt(ulimit.trim(), 10);
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThan(1000000);
  });

  it('should read /proc filesystem on Linux', () => {
    if (process.platform !== 'linux') {
      return;
    }

    const fdPath = `/proc/${process.pid}/fd`;
    expect(existsSync(fdPath)).toBe(true);

    const files = readdirSync(fdPath);
    expect(files.length).toBeGreaterThan(0);
  });
});
```

### Common Pitfalls

**Pitfall 1:** Not mocking stdio option properly
```typescript
// ❌ BAD: Doesn't mock stdio, may cause test failures
vi.mocked(execSync).mockReturnValue('1024\n');

// ✅ GOOD: Mock with stdio option
vi.mocked(execSync).mockReturnValue('1024\n');
expect(execSync).toHaveBeenCalledWith('ulimit -n', {
  encoding: 'utf-8',
  stdio: ['ignore', 'pipe', 'ignore'],
  timeout: expect.any(Number),
});
```

**Pitfall 2:** Not testing platform-specific code paths
```typescript
// ✅ GOOD: Test all platforms
describe('File Handle Monitoring', () => {
  describe('on Linux', () => {
    beforeEach(() => {
      vi.spyOn(process, 'platform').mockReturnValue('linux');
    });
    // Test Linux-specific code
  });

  describe('on macOS', () => {
    beforeEach(() => {
      vi.spyOn(process, 'platform').mockReturnValue('darwin');
    });
    // Test macOS-specific code
  });

  describe('on Windows', () => {
    beforeEach(() => {
      vi.spyOn(process, 'platform').mockReturnValue('win32');
    });
    // Test Windows-specific code
  });
});
```

---

## Vitest Patterns for Testing Timers

### Official Documentation

**Vitest Timer Mocking:**
- **URL:** https://vitest.dev/api/vi.html#vi-usefaketimers
- **Section:** `vi.useFakeTimers()`
- **Related Methods:**
  - `vi.useRealTimers()` - Restore real timers
  - `vi.advanceTimersByTime(ms)` - Advance time by specific milliseconds
  - `vi.runAllTimers()` - Run all pending timers
  - `vi.runOnlyPendingTimers()` - Run only currently pending timers
  - `vi.clearAllTimers()` - Clear all pending timers

### Basic Timer Testing

#### Pattern 1: Testing Duration-Based Limits

**Best Practice:** Use fake timers to test time-based resource limits.

```typescript
describe('Duration-Based Resource Limits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-19T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger stop when maxDuration reached', () => {
    const monitor = new ResourceMonitor({ maxDuration: 5000 });

    // Initially should not stop
    expect(monitor.shouldStop()).toBe(false);

    // Advance time to 4 seconds (still under limit)
    vi.advanceTimersByTime(4000);
    expect(monitor.shouldStop()).toBe(false);

    // Advance time to 6 seconds (over limit)
    vi.advanceTimersByTime(2000);
    expect(monitor.shouldStop()).toBe(true);

    const status = monitor.getStatus();
    expect(status.limitType).toBe('maxDuration');
  });

  it('should track elapsed time correctly', () => {
    const monitor = new ResourceMonitor({ maxDuration: 10000 });

    expect(monitor.getElapsed()).toBe(0);

    vi.advanceTimersByTime(5000);
    expect(monitor.getElapsed()).toBe(5000);

    vi.advanceTimersByTime(3000);
    expect(monitor.getElapsed()).toBe(8000);
  });
});
```

#### Pattern 2: Testing Periodic Polling with Intervals

**Best Practice:** Test that resource snapshots are taken at the configured interval.

```typescript
describe('Periodic Resource Polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should take snapshots at configured interval', () => {
    const takeSnapshotSpy = vi.fn();
    const monitor = new ResourceMonitor({ pollingInterval: 1000 });

    // Access private method via prototype for testing
    const originalTakeSnapshot = (monitor as any).#takeSnapshot;
    (monitor as any).#takeSnapshot = takeSnapshotSpy;

    monitor.start();

    // Advance time to trigger first snapshot
    vi.advanceTimersByTime(1000);
    expect(takeSnapshotSpy).toHaveBeenCalledTimes(1);

    // Advance time for second snapshot
    vi.advanceTimersByTime(1000);
    expect(takeSnapshotSpy).toHaveBeenCalledTimes(2);

    // Advance time for third snapshot
    vi.advanceTimersByTime(1000);
    expect(takeSnapshotSpy).toHaveBeenCalledTimes(3);

    monitor.stop();
  });

  it('should stop taking snapshots after stop() is called', () => {
    const monitor = new ResourceMonitor({ pollingInterval: 500 });

    monitor.start();

    // Trigger some snapshots
    vi.advanceTimersByTime(2000);

    monitor.stop();

    // Clear any pending timers
    vi.clearAllTimers();

    // Advance time - no new snapshots should be taken
    vi.advanceTimersByTime(2000);

    // Verify polling stopped
  });
});
```

#### Pattern 3: Testing setTimeout and setInterval

**Best Practice:** Test time-based operations without actual delays.

```typescript
describe('Timer-Based Operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute setTimeout callback', () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should execute setInterval callback multiple times', () => {
    const callback = vi.fn();

    setInterval(callback, 1000);

    vi.advanceTimersByTime(3500);

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should clear timers correctly', () => {
    const callback = vi.fn();
    const timeoutId = setTimeout(callback, 1000);

    clearTimeout(timeoutId);

    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });
});
```

### Advanced Timer Patterns

#### Pattern 4: Testing Concurrent Time-Based Limits

**Best Practice:** Test scenarios where multiple time-based conditions exist.

```typescript
describe('Concurrent Time-Based Limits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track tasks and duration simultaneously', () => {
    const monitor = new ResourceMonitor({
      maxTasks: 10,
      maxDuration: 5000,
    });

    // Record some tasks
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();

    // Advance time
    vi.advanceTimersByTime(3000);

    // Both should be tracked
    expect(monitor.getTasksCompleted()).toBe(2);
    expect(monitor.getElapsed()).toBe(3000);
    expect(monitor.shouldStop()).toBe(false);

    // Exceed duration limit
    vi.advanceTimersByTime(3000);

    expect(monitor.shouldStop()).toBe(true);
    expect(monitor.getStatus().limitType).toBe('maxDuration');
  });

  it('should trigger on first limit reached', () => {
    const monitor = new ResourceMonitor({
      maxTasks: 5,
      maxDuration: 10000,
    });

    // Reach task limit first (5 tasks)
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();

    expect(monitor.shouldStop()).toBe(true);
    expect(monitor.getStatus().limitType).toBe('maxTasks');

    // Even though time has passed, task limit was first
    vi.advanceTimersByTime(15000);

    expect(monitor.getStatus().limitType).toBe('maxTasks');
  });
});
```

### Testing Timer Edge Cases

**Best Practice:** Test edge cases like very short durations and timer overlaps.

```typescript
describe('Timer Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle very short maxDuration', () => {
    const monitor = new ResourceMonitor({ maxDuration: 1 });

    expect(monitor.shouldStop()).toBe(false);

    vi.advanceTimersByTime(10);

    expect(monitor.shouldStop()).toBe(true);
  });

  it('should handle zero maxDuration', () => {
    const monitor = new ResourceMonitor({ maxDuration: 0 });

    // Should immediately trigger stop
    expect(monitor.shouldStop()).toBe(true);
  });

  it('should handle rapid start/stop cycles', () => {
    const monitor = new ResourceMonitor({ pollingInterval: 100 });

    monitor.start();
    monitor.stop();
    monitor.start();
    monitor.stop();
    monitor.start();

    vi.advanceTimersByTime(500);

    // Should only have one active interval
    expect(() => monitor.stop()).not.toThrow();
  });
});
```

### Common Pitfalls

**Pitfall 1:** Not using fake timers in beforeEach
```typescript
// ❌ BAD: Forgetting to use fake timers
describe('Timer Tests', () => {
  it('should timeout after 1 second', () => {
    setTimeout(callback, 1000);
    vi.advanceTimersByTime(1000); // Won't work without fake timers
  });
});

// ✅ GOOD: Always use fake timers
describe('Timer Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should timeout after 1 second', () => {
    setTimeout(callback, 1000);
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });
});
```

**Pitfall 2:** Not restoring real timers
```typescript
// ❌ BAD: Fake timers persist after tests
afterEach(() => {
  // Missing vi.useRealTimers()
});

// ✅ GOOD: Always restore real timers
afterEach(() => {
  vi.useRealTimers();
});
```

**Pitfall 3:** Not clearing pending timers
```typescript
// ❌ BAD: Pending timers cause test interference
it('should do something', () => {
  setInterval(callback, 1000);
  // Interval never cleared
});

// ✅ GOOD: Clear timers in test or cleanup
afterEach(() => {
  vi.clearAllTimers();
});
```

---

## Testing Resource Limit Enforcement

### Testing Strategy Overview

**Resource Limit Types:**
1. **maxTasks** - Maximum number of tasks to execute
2. **maxDuration** - Maximum execution duration in milliseconds
3. **fileHandles** - File handle usage threshold
4. **memory** - Memory usage threshold

### Testing maxTasks Enforcement

**Best Practice:** Test task counting and limit enforcement.

```typescript
describe('maxTasks Limit Enforcement', () => {
  it('should enforce maxTasks limit', () => {
    const monitor = new ResourceMonitor({ maxTasks: 5 });

    // Complete 4 tasks - should not stop
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    expect(monitor.shouldStop()).toBe(false);

    // Complete 5th task - should stop
    monitor.recordTaskComplete();
    expect(monitor.shouldStop()).toBe(true);
  });

  it('should provide suggestion when maxTasks reached', () => {
    const monitor = new ResourceMonitor({ maxTasks: 3 });

    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();

    const status = monitor.getStatus();
    expect(status.suggestion).toContain('continue');
    expect(status.suggestion).toContain('max-tasks');
  });

  it('should handle zero maxTasks', () => {
    const monitor = new ResourceMonitor({ maxTasks: 0 });

    monitor.recordTaskComplete();
    expect(monitor.shouldStop()).toBe(true);
  });

  it('should handle very large maxTasks', () => {
    const monitor = new ResourceMonitor({ maxTasks: 999999 });

    monitor.recordTaskComplete();
    expect(monitor.shouldStop()).toBe(false);
    expect(monitor.getTasksCompleted()).toBe(1);
  });
});
```

### Testing maxDuration Enforcement

**Best Practice:** Use fake timers for duration testing.

```typescript
describe('maxDuration Limit Enforcement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should enforce maxDuration limit', () => {
    const monitor = new ResourceMonitor({ maxDuration: 5000 });

    // Advance to 4 seconds - should not stop
    vi.advanceTimersByTime(4000);
    expect(monitor.shouldStop()).toBe(false);

    // Advance to 6 seconds - should stop
    vi.advanceTimersByTime(2000);
    expect(monitor.shouldStop()).toBe(true);
  });

  it('should provide suggestion when maxDuration reached', () => {
    const monitor = new ResourceMonitor({ maxDuration: 1000 });

    vi.advanceTimersByTime(1500);

    const status = monitor.getStatus();
    expect(status.suggestion).toContain('continue');
    expect(status.suggestion).toContain('max-duration');
  });
});
```

### Testing Memory Limit Enforcement

**Best Practice:** Mock memory usage to test threshold enforcement.

```typescript
describe('Memory Limit Enforcement', () => {
  beforeEach(() => {
    // Mock system memory
    vi.spyOn(require('node:os'), 'totalmem').mockReturnValue(16_000_000_000);
    vi.spyOn(require('node:os'), 'freemem').mockReturnValue(8_000_000_000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger warning at memory warning threshold', () => {
    const logger = getLogger('MemoryMonitor');
    const warnSpy = vi.spyOn(logger, 'warn');

    // Mock memory at warning threshold (80%)
    vi.spyOn(require('node:os'), 'totalmem').mockReturnValue(10_000_000_000);
    vi.spyOn(require('node:os'), 'freemem').mockReturnValue(2_000_000_000);

    const monitor = new ResourceMonitor({ memoryWarnThreshold: 0.8 });
    monitor.getStatus();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        percentage: expect.any(String),
      }),
      'Memory usage high'
    );
  });

  it('should trigger stop at memory critical threshold', () => {
    // Mock memory at critical threshold (90%)
    vi.spyOn(require('node:os'), 'totalmem').mockReturnValue(10_000_000_000);
    vi.spyOn(require('node:os'), 'freemem').mockReturnValue(1_000_000_000);

    const monitor = new ResourceMonitor({
      memoryWarnThreshold: 0.8,
      memoryCriticalThreshold: 0.9,
    });

    const status = monitor.getStatus();

    expect(status.shouldStop).toBe(true);
    expect(status.limitType).toBe('memory');
    expect(status.suggestion).toBeDefined();
  });
});
```

### Testing File Handle Limit Enforcement

**Best Practice:** Mock file handles to test threshold enforcement.

```typescript
describe('File Handle Limit Enforcement', () => {
  beforeEach(() => {
    // Mock ulimit
    vi.mock('node:child_process', async () => {
      const actual = await vi.importActual('node:child_process');
      return {
        ...actual,
        execSync: vi.fn(() => '1024\n'),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger warning at file handle warning threshold', () => {
    const logger = getLogger('FileHandleMonitor');
    const warnSpy = vi.spyOn(logger, 'warn');

    // Mock file handles at warning threshold (70% of 1024 = 716)
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(716).fill({})
    );

    const monitor = new ResourceMonitor({
      fileHandleWarnThreshold: 0.7,
    });
    monitor.getStatus();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        handleCount: 716,
        ulimit: 1024,
      }),
      'File handle usage high'
    );
  });

  it('should trigger stop at file handle critical threshold', () => {
    // Mock file handles at critical threshold (85% of 1024 = 870)
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(870).fill({})
    );

    const monitor = new ResourceMonitor({
      fileHandleWarnThreshold: 0.7,
      fileHandleCriticalThreshold: 0.85,
    });

    const status = monitor.getStatus();

    expect(status.shouldStop).toBe(true);
    expect(status.limitType).toBe('fileHandles');
    expect(status.suggestion).toContain('ulimit');
  });
});
```

### Testing Limit Priority

**Best Practice:** Test which limit takes precedence when multiple are exceeded.

```typescript
describe('Limit Priority Testing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should prioritize file handles over memory', () => {
    // Mock both limits exceeded
    vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
      Array(900).fill({}) // File handles over limit
    );
    vi.spyOn(require('node:os'), 'totalmem').mockReturnValue(10_000_000_000);
    vi.spyOn(require('node:os'), 'freemem').mockReturnValue(500_000_000); // Memory over limit

    const monitor = new ResourceMonitor({
      fileHandleCriticalThreshold: 0.85,
      memoryCriticalThreshold: 0.9,
    });

    const status = monitor.getStatus();

    // File handles checked first
    expect(status.limitType).toBe('fileHandles');
  });

  it('should prioritize memory over user-defined limits', () => {
    const monitor = new ResourceMonitor({
      maxTasks: 100,
      maxDuration: 10000,
      memoryCriticalThreshold: 0.9,
    });

    // Exceed memory limit
    vi.spyOn(require('node:os'), 'totalmem').mockReturnValue(10_000_000_000);
    vi.spyOn(require('node:os'), 'freemem').mockReturnValue(500_000_000);

    const status = monitor.getStatus();

    expect(status.limitType).toBe('memory');
  });
});
```

### Common Pitfalls

**Pitfall 1:** Not testing all threshold combinations
```typescript
// ✅ GOOD: Test all threshold combinations
describe('Threshold Testing', () => {
  it('should handle warning threshold only');
  it('should handle critical threshold only');
  it('should handle both thresholds');
  it('should handle no thresholds exceeded');
  it('should handle all thresholds exceeded');
});
```

**Pitfall 2:** Not validating suggestion messages
```typescript
// ❌ BAD: Not testing suggestions
expect(status.shouldStop).toBe(true);

// ✅ GOOD: Test suggestions are helpful
expect(status.shouldStop).toBe(true);
expect(status.suggestion).toBeDefined();
expect(status.suggestion.length).toBeGreaterThan(0);
```

---

## Platform-Specific Testing Considerations

### Platform Detection

**Best Practice:** Test platform-specific code paths explicitly.

```typescript
describe('Platform-Specific Behavior', () => {
  describe('Linux', () => {
    beforeEach(() => {
      vi.spyOn(process, 'platform').mockReturnValue('linux');
    });

    it('should use /proc filesystem for file handles', () => {
      // Test Linux-specific behavior
    });

    it('should handle missing /proc filesystem gracefully', () => {
      // Test fallback behavior
    });
  });

  describe('macOS', () => {
    beforeEach(() => {
      vi.spyOn(process, 'platform').mockReturnValue('darwin');
    });

    it('should use lsof for file handles', () => {
      // Test macOS-specific behavior
    });

    it('should handle lsof timeout', () => {
      // Test timeout handling
    });
  });

  describe('Windows', () => {
    beforeEach(() => {
      vi.spyOn(process, 'platform').mockReturnValue('win32');
    });

    it('should not use ulimit on Windows', () => {
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      expect(status.snapshot.fileHandleUlimit).toBe(0);
    });
  });
});
```

### Cross-Platform Test Suite

**Best Practice:** Use test suite configuration to skip platform-specific tests.

```typescript
describe('File Handle Monitoring', () => {
  describe('on Unix-like systems', () => {
    beforeEach(() => {
      if (process.platform === 'win32') {
        return;
      }
    });

    it('should detect ulimit', () => {
      if (process.platform === 'win32') {
        return;
      }

      // Unix-specific test
    });
  });

  describe('on Windows', () => {
    beforeEach(() => {
      if (process.platform !== 'win32') {
        return;
      }
    });

    it('should handle missing ulimit gracefully', () => {
      if (process.platform !== 'win32') {
        return;
      }

      // Windows-specific test
    });
  });
});
```

### Integration Test Strategy

**Best Practice:** Run integration tests on actual platforms separately.

```typescript
// tests/integration/resource-monitor.integration.test.ts
describe('Integration: Resource Monitor', () => {
  it('should get real file handle count on Linux', () => {
    if (process.platform !== 'linux') {
      return;
    }

    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    expect(status.snapshot.fileHandles).toBeGreaterThan(0);
    expect(status.snapshot.fileHandleUlimit).toBeGreaterThan(0);
  });

  it('should get real memory usage on all platforms', () => {
    const monitor = new ResourceMonitor();
    const status = monitor.getStatus();

    expect(status.snapshot.heapUsed).toBeGreaterThan(0);
    expect(status.snapshot.heapTotal).toBeGreaterThan(0);
    expect(status.snapshot.systemTotal).toBeGreaterThan(0);
  });
});
```

---

## Common Pitfalls to Avoid

### Pitfall 1: Not Restoring Mocks

```typescript
// ❌ BAD: Mocks persist between tests
vi.spyOn(process, 'memoryUsage').mockReturnValue({...});

// ✅ GOOD: Always restore mocks
afterEach(() => {
  vi.restoreAllMocks();
});
```

### Pitfall 2: Using Unrealistic Values

```typescript
// ❌ BAD: Unrealistic memory values
vi.spyOn(process, 'memoryUsage').mockReturnValue({
  heapUsed: 999999999999999,
  heapTotal: 1000000000000000,
});

// ✅ GOOD: Realistic values
vi.spyOn(process, 'memoryUsage').mockReturnValue({
  rss: 100_000_000,      // 100MB
  heapTotal: 80_000_000, // 80MB
  heapUsed: 60_000_000,  // 60MB
  external: 10_000_000,
  arrayBuffers: 0,
});
```

### Pitfall 3: Not Testing All Code Paths

```typescript
// ❌ BAD: Only testing happy path
it('should monitor resources', () => {
  const monitor = new ResourceMonitor();
  expect(monitor.getStatus()).toBeDefined();
});

// ✅ GOOD: Testing all paths
describe('Resource Monitoring', () => {
  it('should work with default config');
  it('should work with custom config');
  it('should handle missing ulimit');
  it('should handle lsof timeout');
  it('should handle memory threshold exceeded');
  it('should handle file handle threshold exceeded');
});
```

### Pitfall 4: Not Using Fake Timers

```typescript
// ❌ BAD: Tests take real time
it('should timeout after 5 seconds', async () => {
  const monitor = new ResourceMonitor({ maxDuration: 5000 });
  await new Promise(resolve => setTimeout(resolve, 6000));
  expect(monitor.shouldStop()).toBe(true);
});

// ✅ GOOD: Instant with fake timers
it('should timeout after 5 seconds', () => {
  vi.useFakeTimers();
  const monitor = new ResourceMonitor({ maxDuration: 5000 });
  vi.advanceTimersByTime(6000);
  expect(monitor.shouldStop()).toBe(true);
  vi.useRealTimers();
});
```

### Pitfall 5: Not Testing Platform-Specific Code

```typescript
// ❌ BAD: Assuming single platform
it('should get file handles', () => {
  const monitor = new ResourceMonitor();
  expect(monitor.getStatus().snapshot.fileHandles).toBeGreaterThan(0);
  // Fails on Windows where ulimit is 0
});

// ✅ GOOD: Platform-aware tests
describe('File Handle Monitoring', () => {
  it('should work on Linux', () => {
    if (process.platform !== 'linux') return;
    // Linux-specific test
  });

  it('should work on macOS', () => {
    if (process.platform !== 'darwin') return;
    // macOS-specific test
  });

  it('should work on Windows', () => {
    if (process.platform !== 'win32') return;
    // Windows-specific test
  });
});
```

### Pitfall 6: Not Testing Error Conditions

```typescript
// ❌ BAD: Only testing success cases
it('should get file handles', () => {
  const monitor = new ResourceMonitor();
  expect(monitor.getStatus()).toBeDefined();
});

// ✅ GOOD: Testing error cases
describe('Error Handling', () => {
  it('should handle execSync timeout');
  it('should handle missing /proc filesystem');
  it('should handle lsof command not found');
  it('should handle permission denied errors');
});
```

---

## Official Documentation URLs

### Node.js Documentation

1. **process.memoryUsage()**
   - URL: https://nodejs.org/api/process.html#processmemoryusage
   - Section: `process.memoryUsage()`
   - Description: Returns an object describing the memory usage of the Node.js process measured in bytes

2. **process Object**
   - URL: https://nodejs.org/api/process.html
   - Sections: `process.pid`, `process.platform`
   - Description: Provides information about the current Node.js process

3. **os Module**
   - URL: https://nodejs.org/api/os.html
   - Sections: `os.totalmem()`, `os.freemem()`, `os.cpus()`
   - Description: Provides operating system-related utility methods and properties

4. **child_process Module**
   - URL: https://nodejs.org/api/child_process.html
   - Sections: `execSync()`, `spawn()`, `fork()`
   - Description: Provides the ability to spawn child processes

5. **Worker Threads**
   - URL: https://nodejs.org/api/worker_threads.html
   - Sections: Memory limits, resource limits
   - Description: Implementation of parallel JavaScript using threads

6. **File System Module**
   - URL: https://nodejs.org/api/fs.html
   - Sections: `readdirSync()`, `existsSync()`
   - Description: File I/O operations

### Vitest Documentation

7. **Vitest Mocking API**
   - URL: https://vitest.dev/api/vi.html
   - Sections: `vi.spyOn()`, `vi.mock()`, `vi.fn()`
   - Description: Spies and mocks for testing

8. **Vitest Timer Mocking**
   - URL: https://vitest.dev/api/vi.html#vi-usefaketimers
   - Sections: `vi.useFakeTimers()`, `vi.advanceTimersByTime()`, `vi.runAllTimers()`
   - Description: Fake timers for testing time-dependent code

9. **Vitest Mock Functions**
   - URL: https://vitest.dev/api/mock.html
   - Sections: Mock functions, spy functions, return values
   - Description: Mock function implementation and usage

10. **Vitest Configuration**
    - URL: https://vitest.dev/config/
    - Sections: Test timeout, pool options, memory settings
    - Description: Vitest configuration options

### Testing Best Practices

11. **Vitest Guide**
    - URL: https://vitest.dev/guide/
    - Sections: Getting started, test context, mocking
    - Description: Comprehensive Vitest usage guide

12. **Vitest Assertions**
    - URL: https://vitest.dev/api/expect.html
    - Sections: `expect()`, matchers, asymmetric matchers
    - Description: Assertion API and reference

### Related Tools

13. **TypeScript Documentation**
    - URL: https://www.typescriptlang.org/docs/handbook/modules.html
    - Sections: Module resolution, type definitions
    - Description: TypeScript module system

14. **Node.js Error Handling**
    - URL: https://nodejs.org/api/errors.html
    - Sections: Error codes, system errors
    - Description: Node.js error handling patterns

---

## Code Examples Repository

### Example 1: Complete Resource Monitor Test Suite

**File:** `tests/unit/utils/resource-monitor.test.ts`

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceMonitor } from '../../../src/utils/resource-monitor.js';

describe('ResourceMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage', () => {
      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 100_000_000,
        heapTotal: 80_000_000,
        heapUsed: 60_000_000,
        external: 10_000_000,
        arrayBuffers: 0,
      });

      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      expect(status.snapshot.heapUsed).toBe(60_000_000);
      expect(status.snapshot.heapTotal).toBe(80_000_000);
    });
  });

  describe('File Handle Monitoring', () => {
    it('should track file handles', () => {
      vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
        Array(100).fill({})
      );

      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      expect(status.snapshot.fileHandles).toBe(100);
    });
  });

  describe('Duration Tracking', () => {
    it('should enforce maxDuration limit', () => {
      const monitor = new ResourceMonitor({ maxDuration: 5000 });

      vi.advanceTimersByTime(6000);

      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getStatus().limitType).toBe('maxDuration');
    });
  });

  describe('Task Counting', () => {
    it('should enforce maxTasks limit', () => {
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();

      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getStatus().limitType).toBe('maxTasks');
    });
  });
});
```

### Example 2: Mock Helper Utilities

**File:** `tests/utils/mock-helpers.ts`

```typescript
import { vi } from 'vitest';
import * as os from 'node:os';
import * as fs from 'node:fs';

export function mockMemoryUsage(params: {
  heapUsed?: number;
  heapTotal?: number;
  rss?: number;
  external?: number;
}) {
  const {
    heapUsed = 60_000_000,
    heapTotal = 80_000_000,
    rss = 100_000_000,
    external = 10_000_000,
  } = params;

  return vi.spyOn(process, 'memoryUsage').mockReturnValue({
    rss,
    heapTotal,
    heapUsed,
    external,
    arrayBuffers: 0,
  });
}

export function mockSystemMemory(params: {
  total?: number;
  free?: number;
}) {
  const { total = 16_000_000_000, free = 8_000_000_000 } = params;

  return {
    totalMem: vi.spyOn(os, 'totalmem').mockReturnValue(total),
    freeMem: vi.spyOn(os, 'freemem').mockReturnValue(free),
  };
}

export function mockFileHandles(count: number) {
  return vi.spyOn(process as any, '_getActiveHandles').mockReturnValue(
    Array(count).fill({})
  );
}

export function mockUlimit(limit: number) {
  vi.mock('node:child_process', async () => {
    const actual = await vi.importActual('node:child_process');
    return {
      ...actual,
      execSync: vi.fn(() => `${limit}\n`),
    };
  });
}

export function mockPlatform(platform: 'linux' | 'darwin' | 'win32') {
  return vi.spyOn(process, 'platform').mockReturnValue(platform);
}

export function clearAllMocks() {
  vi.restoreAllMocks();
}
```

### Example 3: Test Fixtures

**File:** `tests/fixtures/resource-monitor.fixtures.ts`

```typescript
export const MEMORY_VALUES = {
  LOW: {
    heapUsed: 30_000_000,
    heapTotal: 80_000_000,
    rss: 50_000_000,
    external: 5_000_000,
  },
  NORMAL: {
    heapUsed: 60_000_000,
    heapTotal: 80_000_000,
    rss: 100_000_000,
    external: 10_000_000,
  },
  HIGH: {
    heapUsed: 72_000_000, // 90% of 80MB
    heapTotal: 80_000_000,
    rss: 120_000_000,
    external: 15_000_000,
  },
  CRITICAL: {
    heapUsed: 76_000_000, // 95% of 80MB
    heapTotal: 80_000_000,
    rss: 130_000_000,
    external: 20_000_000,
  },
};

export const SYSTEM_MEMORY_VALUES = {
  LOW_USAGE: {
    total: 16_000_000_000,
    free: 12_000_000_000, // 25% usage
  },
  NORMAL_USAGE: {
    total: 16_000_000_000,
    free: 8_000_000_000, // 50% usage
  },
  HIGH_USAGE: {
    total: 16_000_000_000,
    free: 3_200_000_000, // 80% usage
  },
  CRITICAL_USAGE: {
    total: 16_000_000_000,
    free: 1_600_000_000, // 90% usage
  },
};

export const FILE_HANDLE_VALUES = {
  LOW: 100,
  NORMAL: 500,
  HIGH: 716, // 70% of 1024
  CRITICAL: 870, // 85% of 1024
};

export const ULIMIT_DEFAULT = 1024;
```

---

## Summary

This comprehensive research document provides:

1. **Testing Strategies** for all resource monitoring components
2. **Code Examples** demonstrating best practices for mocking and testing
3. **Platform-Specific Considerations** for cross-platform compatibility
4. **Common Pitfalls** to avoid when testing resource monitoring
5. **Official Documentation URLs** for authoritative references

### Key Takeaways

1. **Mock Process APIs**: Use `vi.spyOn()` for `process.memoryUsage()`, `os.totalmem()`, and `os.freemem()`
2. **Mock File Handles**: Mock `process._getActiveHandles()`, `readdirSync()`, and `execSync()` for file handle testing
3. **Use Fake Timers**: Always use `vi.useFakeTimers()` for time-based testing
4. **Test All Paths**: Cover all platform-specific code paths and error conditions
5. **Realistic Values**: Use realistic memory and file handle values in tests
6. **Restore Mocks**: Always restore mocks in `afterEach()` to prevent test interference

### Next Steps for PRP Implementation

1. Create test suite based on patterns in this document
2. Implement mock helper utilities for consistent testing
3. Add integration tests for real system resource monitoring
4. Document platform-specific test requirements
5. Add CI/CD test configuration for multiple platforms

---

**Document Version:** 1.0
**Last Updated:** 2025-01-19
**Status:** Ready for PRP Implementation
**External Research:** Compiled from authoritative documentation sources and testing best practices
