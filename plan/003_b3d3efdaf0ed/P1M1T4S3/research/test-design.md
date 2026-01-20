# Test Design: Resource Monitoring Verification

## Test Strategy

This document outlines the comprehensive test design for verifying resource monitoring and limits.

## Test File Location

**File**: `tests/unit/resource-monitoring.test.ts`

**Why unit tests, not integration?**
- ResourceMonitor is a self-contained utility class
- All external dependencies (process, os, child_process) can be mocked
- Fast, deterministic tests without real resource constraints
- Integration with pipeline is covered by P1.M1.T4.S1 (main loop) and P1.M1.T4.S2 (shutdown)

## Test Categories

### 1. File Handle Monitoring Tests

#### 1.1 Linux Platform Tests
```typescript
describe('File Handle Monitoring - Linux', () => {
  beforeEach(() => {
    vi.stubGlobal('process', { platform: 'linux', pid: 1234 });
  });

  it('should count file handles from /proc filesystem', async () => {
    // SETUP: Mock fs.readdir to return file descriptors
    // EXECUTE: Call FileHandleMonitor.getActiveHandleCount()
    // VERIFY: Returns count matching mocked entries
  });

  it('should handle /proc read errors gracefully', async () => {
    // SETUP: Mock fs.readdir to throw ENOENT
    // EXECUTE: Call monitoring method
    // VERIFY: Falls back to process._getActiveHandles()
  });
});
```

#### 1.2 macOS Platform Tests
```typescript
describe('File Handle Monitoring - macOS', () => {
  beforeEach(() => {
    vi.stubGlobal('process', { platform: 'darwin', pid: 1234 });
  });

  it('should use lsof command for handle counting', async () => {
    // SETUP: Mock spawn to return lsof output
    // EXECUTE: Call monitoring method
    // VERIFY: Parses lsof output correctly
  });

  it('should handle lsof timeout', async () => {
    // SETUP: Mock spawn that doesn't respond within timeout
    // EXECUTE: Call monitoring method
    // VERIFY: Falls back to process._getActiveHandles()
  });

  it('should handle lsof not found', async () => {
    // SETUP: Mock spawn to throw ENOENT
    // EXECUTE: Call monitoring method
    // VERIFY: Returns 0 or fallback value
  });
});
```

#### 1.3 Windows Platform Tests
```typescript
describe('File Handle Monitoring - Windows', () => {
  beforeEach(() => {
    vi.stubGlobal('process', { platform: 'win32', pid: 1234 });
  });

  it('should return 0 for file handles on Windows', async () => {
    // EXECUTE: Call monitoring method
    // VERIFY: Returns 0 (no ulimit concept)
  });
});
```

### 2. Heap Stats Monitoring Tests

```typescript
describe('Heap Memory Monitoring', () => {
  it('should capture V8 heap stats via process.memoryUsage()', () => {
    // SETUP: Mock process.memoryUsage() to return specific values
    const mockMemoryUsage = {
      heapUsed: 128 * 1024 * 1024,  // 128 MB
      heapTotal: 256 * 1024 * 1024, // 256 MB
      rss: 180 * 1024 * 1024,       // 180 MB
      external: 10 * 1024 * 1024,   // 10 MB
      arrayBuffers: 5 * 1024 * 1024 // 5 MB
    };
    vi.mocked(process.memoryUsage).mockReturnValue(mockMemoryUsage);

    // EXECUTE: Call monitoring method
    const heapStats = monitor.getHeapStats();

    // VERIFY: Returns correct values in MB
    expect(heapStats.heapUsed).toBe(128);
    expect(heapStats.heapTotal).toBe(256);
  });

  it('should calculate heap usage percentage', () => {
    // SETUP: Mock process.memoryUsage() with known values
    // EXECUTE: Call monitoring method
    // VERIFY: Returns correct percentage (heapUsed / heapTotal * 100)
  });

  it('should detect memory leaks over time', async () => {
    // SETUP: Configure leak detection threshold
    // Mock memory growth >20% over 5 samples
    vi.useFakeTimers();

    // EXECUTE: Advance time through 5 polling intervals
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(30000); // 30 seconds
    }

    // VERIFY: Leak warning logged
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Potential memory leak detected')
    );
  });
});
```

### 3. Max-Tasks Limit Tests

```typescript
describe('Max-Tasks Limit', () => {
  it('should stop pipeline after N tasks complete', async () => {
    // SETUP: Create ResourceMonitor with maxTasks = 3
    const monitor = new ResourceMonitor({ maxTasks: 3 });
    monitor.start();

    // EXECUTE: Record 3 task completions
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();

    // VERIFY: shouldStop() returns true
    expect(monitor.shouldStop()).toBe(true);
    expect(monitor.getTasksCompleted()).toBe(3);
  });

  it('should not stop before maxTasks is reached', async () => {
    // SETUP: Create ResourceMonitor with maxTasks = 5
    const monitor = new ResourceMonitor({ maxTasks: 5 });
    monitor.start();

    // EXECUTE: Record only 2 task completions
    monitor.recordTaskComplete();
    monitor.recordTaskComplete();

    // VERIFY: shouldStop() returns false
    expect(monitor.shouldStop()).toBe(false);
    expect(monitor.getTasksCompleted()).toBe(2);
  });

  it('should handle zero maxTasks (no limit)', async () => {
    // SETUP: Create ResourceMonitor with maxTasks = 0
    const monitor = new ResourceMonitor({ maxTasks: 0 });
    monitor.start();

    // EXECUTE: Record many task completions
    for (let i = 0; i < 100; i++) {
      monitor.recordTaskComplete();
    }

    // VERIFY: shouldStop() never returns true (unless other limits)
    expect(monitor.shouldStop()).toBe(false);
  });
});
```

### 4. Max-Duration Limit Tests

```typescript
describe('Max-Duration Limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-19T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should stop pipeline after N milliseconds', async () => {
    // SETUP: Create ResourceMonitor with maxDuration = 5000
    const monitor = new ResourceMonitor({ maxDuration: 5000 });
    monitor.start();

    // EXECUTE: Advance time by 5000ms
    vi.advanceTimersByTime(5000);

    // VERIFY: shouldStop() returns true
    expect(monitor.shouldStop()).toBe(true);
    expect(monitor.getElapsed()).toBe(5000);
  });

  it('should not stop before maxDuration is reached', async () => {
    // SETUP: Create ResourceMonitor with maxDuration = 10000
    const monitor = new ResourceMonitor({ maxDuration: 10000 });
    monitor.start();

    // EXECUTE: Advance time by only 5000ms
    vi.advanceTimersByTime(5000);

    // VERIFY: shouldStop() returns false
    expect(monitor.shouldStop()).toBe(false);
    expect(monitor.getElapsed()).toBe(5000);
  });

  it('should handle zero maxDuration (no limit)', async () => {
    // SETUP: Create ResourceMonitor with maxDuration = 0
    const monitor = new ResourceMonitor({ maxDuration: 0 });
    monitor.start();

    // EXECUTE: Advance time significantly
    vi.advanceTimersByTime(999999);

    // VERIFY: shouldStop() never returns true (unless other limits)
    expect(monitor.shouldStop()).toBe(false);
  });
});
```

### 5. Resource Limit Report Generation Tests

```typescript
describe('RESOURCE_LIMIT_REPORT.md Generation', () => {
  it('should generate report with correct format on maxTasks limit', async () => {
    // SETUP: Create ResourceMonitor with maxTasks = 1
    // Mock fs.writeFile to capture output
    const mockWriteFile = vi.mocked(fs.promises.writeFile);
    const monitor = new ResourceMonitor({ maxTasks: 1 });
    monitor.start();
    monitor.recordTaskComplete();

    // EXECUTE: Check shouldStop (triggers report internally via pipeline)
    const status = monitor.getStatus();

    // VERIFY: Status contains correct information
    expect(status.limitType).toBe('max_tasks');
    expect(status.tasksCompleted).toBe(1);
  });

  it('should include actionable suggestions based on limit type', async () => {
    // SETUP: Test each limit type
    const limitTypes = ['max_tasks', 'max_duration', 'file_handles', 'memory'];
    const suggestions = {
      max_tasks: 'Increase --max-tasks or split workload',
      max_duration: 'Increase --max-duration or optimize tasks',
      file_handles: 'Check for unclosed files/streams, run "ulimit -n 4096"',
      memory: 'Close other applications, increase system memory'
    };

    for (const type of limitTypes) {
      // EXECUTE: Get status for each limit type
      // VERIFY: Correct suggestion included
    }
  });

  it('should include resume instructions in report', async () => {
    // SETUP: Mock resource limit scenario
    // EXECUTE: Generate report
    // VERIFY: Report contains "npx tsx src/cli/index.ts --continue"
  });

  it('should include resource snapshot table', async () => {
    // SETUP: Mock specific resource values
    const mockSnapshot = {
      fileHandles: { count: 245, limit: 1024, percentage: 23.9 },
      heapMemory: { used: 128.45, unit: 'MB' },
      systemMemory: { percentage: 45.2 }
    };

    // EXECUTE: Generate report
    // VERIFY: Table formatted correctly with all metrics
  });
});
```

### 6. Combined Limits Tests

```typescript
describe('Combined Limits', () => {
  it('should prioritize critical resource limits over maxTasks', async () => {
    // SETUP: Create monitor with maxTasks = 100, but file handle limit near
    // Mock file handles at 90% of ulimit
    const monitor = new ResourceMonitor({
      maxTasks: 100,
      fileHandleCriticalThreshold: 85
    });

    // EXECUTE: Check shouldStop after only 1 task
    monitor.recordTaskComplete();

    // VERIFY: Stops due to file handles, not task count
    const status = monitor.getStatus();
    expect(status.limitType).toBe('file_handles');
    expect(monitor.getTasksCompleted()).toBe(1);
  });

  it('should handle multiple limit types simultaneously', async () => {
    // SETUP: Create monitor with both maxTasks and maxDuration
    const monitor = new ResourceMonitor({
      maxTasks: 10,
      maxDuration: 5000
    });
    monitor.start();

    // EXECUTE: Advance time and complete tasks
    vi.advanceTimersByTime(6000); // Exceeds duration
    monitor.recordTaskComplete();

    // VERIFY: Duration limit takes precedence (checked first in loop)
    expect(monitor.getStatus().limitType).toBe('max_duration');
  });
});
```

### 7. Edge Cases Tests

```typescript
describe('Edge Cases', () => {
  it('should handle start() called multiple times', async () => {
    // SETUP: Create monitor
    const monitor = new ResourceMonitor({ maxTasks: 5 });

    // EXECUTE: Call start() twice
    monitor.start();
    monitor.start(); // Should not create duplicate intervals

    // VERIFY: Only one polling interval exists
    // (Can verify by checking only one set of warnings logged)
  });

  it('should handle stop() without start', async () => {
    // SETUP: Create monitor without calling start()
    const monitor = new ResourceMonitor({ maxTasks: 5 });

    // EXECUTE: Call stop() without start()
    monitor.stop();

    // VERIFY: No errors thrown, clean exit
  });

  it('should handle getStatus() before start', async () => {
    // SETUP: Create monitor without start
    const monitor = new ResourceMonitor({ maxTasks: 5 });

    // EXECUTE: Get status
    const status = monitor.getStatus();

    // VERIFY: Returns valid status with zero values
    expect(status.tasksCompleted).toBe(0);
    expect(status.elapsedMs).toBe(0);
  });

  it('should handle concurrent recordTaskComplete() calls', async () => {
    // SETUP: Create monitor
    const monitor = new ResourceMonitor({ maxTasks: 10 });
    monitor.start();

    // EXECUTE: Call recordTaskComplete() concurrently
    await Promise.all([
      Promise.resolve().then(() => monitor.recordTaskComplete()),
      Promise.resolve().then(() => monitor.recordTaskComplete()),
      Promise.resolve().then(() => monitor.recordTaskComplete()),
    ]);

    // VERIFY: All tasks recorded correctly
    expect(monitor.getTasksCompleted()).toBe(3);
  });
});
```

## Mock Helper Functions

```typescript
// File: tests/unit/resource-monitoring.test.ts

/**
 * Helper to mock process._getActiveHandles
 */
function mockActiveHandles(count: number): void {
  (process as any)._getActiveHandles = () => Array(count).fill({});
}

/**
 * Helper to restore process._getActiveHandles
 */
function restoreActiveHandles(): void {
  (process as any)._getActiveHandles = undefined;
}

/**
 * Helper to mock process.memoryUsage()
 */
function mockMemoryUsage(usage: NodeJS.MemoryUsage): void {
  vi.mocked(process.memoryUsage).mockReturnValue(usage);
}

/**
 * Helper to create a mock child process for spawn
 */
function createMockChild(options: {
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  delay?: number;
} = {}): ChildProcess {
  const { exitCode = 0, stdout = '', stderr = '', delay = 5 } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), delay);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), delay);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), delay + 5);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

/**
 * Helper to mock os module memory values
 */
function mockSystemMemory(totalGB: number, freeGB: number): void {
  vi.mocked(os.totalmem).mockReturnValue(totalGB * 1024 * 1024 * 1024);
  vi.mocked(os.freemem).mockReturnValue(freeGB * 1024 * 1024 * 1024);
}
```

## Test Data Fixtures

```typescript
// Realistic memory usage values (in bytes)
const MEMORY_FIXTURES = {
  low: {
    heapUsed: 64 * 1024 * 1024,      // 64 MB
    heapTotal: 128 * 1024 * 1024,    // 128 MB
    rss: 90 * 1024 * 1024,           // 90 MB
    external: 5 * 1024 * 1024,       // 5 MB
    arrayBuffers: 2 * 1024 * 1024    // 2 MB
  },
  medium: {
    heapUsed: 256 * 1024 * 1024,     // 256 MB
    heapTotal: 512 * 1024 * 1024,    // 512 MB
    rss: 350 * 1024 * 1024,          // 350 MB
    external: 20 * 1024 * 1024,      // 20 MB
    arrayBuffers: 10 * 1024 * 1024   // 10 MB
  },
  high: {
    heapUsed: 1024 * 1024 * 1024,    // 1 GB
    heapTotal: 2048 * 1024 * 1024,   // 2 GB
    rss: 1500 * 1024 * 1024,         // 1.5 GB
    external: 100 * 1024 * 1024,     // 100 MB
    arrayBuffers: 50 * 1024 * 1024   // 50 MB
  }
};

// Realistic ulimit values
const ULIMIT_FIXTURES = {
  low: 256,      // Development environment
  default: 1024, // Typical macOS/Linux default
  high: 65536,   // Production server
  unlimited: null // No limit
};
```

## Validation Commands

```bash
# Run the resource monitoring tests
npx vitest run tests/unit/resource-monitoring.test.ts

# Run with coverage
npx vitest run tests/unit/resource-monitoring.test.ts --coverage

# Run specific test suite
npx vitest run tests/unit/resource-monitoring.test.ts --grep "File Handle Monitoring"

# Run in watch mode during development
npx vitest watch tests/unit/resource-monitoring.test.ts
```

## Coverage Goals

- **Lines**: >90%
- **Branches**: >85%
- **Functions**: >95%
- **Statements**: >90%

## Notes

1. These tests focus on **ResourceMonitor class behavior**, not pipeline integration
2. Pipeline integration is covered by P1.M1.T4.S1 (main loop) tests
3. Resource limit shutdown flow is covered by P1.M1.T4.S2 (shutdown) tests
4. All tests use mocking for deterministic, fast execution
5. Platform-specific tests are isolated with proper beforeEach/afterEach cleanup
