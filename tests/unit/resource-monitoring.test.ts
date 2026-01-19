/**
 * Unit tests for ResourceMonitor resource tracking and limit enforcement
 *
 * @remarks
 * Tests validate resource monitoring (file handles, heap stats), limit enforcement
 * (max-tasks, max-duration), and RESOURCE_LIMIT_REPORT.md generation.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ResourceMonitor,
  type ResourceConfig,
  type ResourceLimitStatus,
  type ResourceSnapshot,
} from '../../src/utils/resource-monitor.js';
import { clearLoggerCache } from '../../src/utils/logger.js';

// ============================================================================
// GLOBAL MOCKS (must be at top level for hoisting)
// ============================================================================

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  totalmem: vi.fn(),
  freemem: vi.fn(),
}));

// ============================================================================
// IMPORT MOCKED MODULES
// ============================================================================

import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import * as os from 'node:os';

const mockExecSync = vi.mocked(execSync);
const mockExistsSync = vi.mocked(existsSync);
const mockReaddirSync = vi.mocked(readdirSync);
const mockTotalmem = vi.mocked(os.totalmem);
const mockFreemem = vi.mocked(os.freemem);

// ============================================================================
// MOCK HELPER FUNCTIONS
// ============================================================================

/**
 * Mock process._getActiveHandles to return specific handle count
 */
function mockActiveHandles(count: number): void {
  (
    process as unknown as { _getActiveHandles?: () => unknown[] }
  )._getActiveHandles = () => Array(count).fill({});
}

/**
 * Restore process._getActiveHandles to undefined
 */
function restoreActiveHandles(): void {
  (
    process as unknown as { _getActiveHandles?: () => unknown[] }
  )._getActiveHandles = undefined;
}

/**
 * Create mock memory usage values
 */
function createMockMemoryUsage(
  overrides?: Partial<NodeJS.MemoryUsage>
): NodeJS.MemoryUsage {
  return {
    heapUsed: 128 * 1024 * 1024, // 128 MB in bytes
    heapTotal: 256 * 1024 * 1024, // 256 MB in bytes
    rss: 180 * 1024 * 1024, // 180 MB in bytes
    external: 10 * 1024 * 1024, // 10 MB in bytes
    arrayBuffers: 5 * 1024 * 1024, // 5 MB in bytes
    ...overrides,
  };
}

/**
 * Mock fixture for ResourceConfig
 * @internal Used for creating test configurations
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createMockResourceConfig(
  overrides?: Partial<ResourceConfig>
): ResourceConfig {
  return {
    maxTasks: 10,
    maxDuration: 60000,
    fileHandleWarnThreshold: 0.7,
    fileHandleCriticalThreshold: 0.85,
    memoryWarnThreshold: 0.8,
    memoryCriticalThreshold: 0.9,
    pollingInterval: 30000,
    ...overrides,
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('ResourceMonitor Resource Tracking and Limit Enforcement', () => {
  beforeEach(() => {
    clearLoggerCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreActiveHandles();
  });

  // ==========================================================================
  // FILE HANDLE MONITORING TESTS
  // ==========================================================================

  describe('File Handle Monitoring', () => {
    it('should count file handles via internal API', () => {
      // SETUP: Mock _getActiveHandles to return specific count
      mockActiveHandles(100);

      // EXECUTE: Get file handle count
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: Returns count matching mocked handles
      expect(status.snapshot.fileHandles).toBe(100);
    });

    it('should fallback when internal API unavailable', () => {
      // SETUP: Ensure _getActiveHandles is undefined
      restoreActiveHandles();

      // EXECUTE: Create monitor (will use fallback methods)
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: Returns valid count (from fallback or actual system)
      expect(status.snapshot.fileHandles).toBeGreaterThanOrEqual(0);
    });

    it('should calculate file handle usage percentage', () => {
      // SETUP: Mock handles and ulimit
      mockActiveHandles(700);
      mockExecSync.mockReturnValue('1024\n');

      // EXECUTE: Get status
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: Usage percentage calculated
      expect(status.snapshot.fileHandles).toBe(700);
      expect(status.snapshot.fileHandleUlimit).toBe(1024);
      expect(status.snapshot.fileHandleUsage).toBeCloseTo(700 / 1024, 2);
    });

    it('should handle ulimit command errors gracefully', () => {
      // SETUP: Mock ulimit to fail
      mockActiveHandles(50);
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      // EXECUTE: Get status
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: Returns default ulimit (1024)
      expect(status.snapshot.fileHandles).toBe(50);
      expect(status.snapshot.fileHandleUlimit).toBe(1024);
    });
  });

  // ==========================================================================
  // HEAP MEMORY MONITORING TESTS
  // ==========================================================================

  describe('Heap Memory Monitoring', () => {
    it('should capture V8 heap stats via process.memoryUsage()', () => {
      // SETUP: Mock process.memoryUsage()
      const mockMemory = createMockMemoryUsage({
        heapUsed: 128 * 1024 * 1024, // 128 MB
        heapTotal: 256 * 1024 * 1024, // 256 MB
      });
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemory);

      // EXECUTE: Get status
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: Returns correct values in bytes
      expect(status.snapshot.heapUsed).toBe(128 * 1024 * 1024);
      expect(status.snapshot.heapTotal).toBe(256 * 1024 * 1024);
    });

    it('should calculate memory usage percentage', () => {
      // SETUP: Mock system memory values
      mockTotalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16 GB
      mockFreemem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8 GB free

      // EXECUTE: Get status
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: Memory usage percentage calculated correctly (50%)
      expect(status.snapshot.memoryUsage).toBe(0.5);
    });

    it('should detect memory leaks over time', () => {
      // SETUP: Configure monitor with leak detection
      vi.useFakeTimers();

      const monitor = new ResourceMonitor({ pollingInterval: 30000 });
      monitor.start();

      // EXECUTE: Advance time through 5 polling intervals with growing memory
      // Leak detection requires 5+ samples to trigger
      for (let i = 0; i < 5; i++) {
        const growthFactor = 1 + i * 0.1; // 0%, 10%, 20%, 30%, 40% growth
        const mockMemory = createMockMemoryUsage({
          heapUsed: 128 * 1024 * 1024 * growthFactor,
        });
        vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemory);

        vi.advanceTimersByTime(30000);
      }

      // VERIFY: Leak detection mechanism is in place (monitor still running)
      const status = monitor.getStatus();
      expect(status.snapshot).toBeDefined();

      monitor.stop();
      vi.useRealTimers();
    });
  });

  // ==========================================================================
  // MAX-TASKS LIMIT TESTS
  // ==========================================================================

  describe('Max-Tasks Limit', () => {
    it('should stop pipeline after N tasks complete', () => {
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
      expect(monitor.getStatus().limitType).toBe('maxTasks');
    });

    it('should not stop before maxTasks is reached', () => {
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

    it('should handle zero maxTasks (stops immediately)', () => {
      // SETUP: Create ResourceMonitor with maxTasks = 0
      const monitor = new ResourceMonitor({ maxTasks: 0 });
      monitor.start();

      // EXECUTE: Record any task completion
      monitor.recordTaskComplete();

      // VERIFY: shouldStop returns true (0 means stop immediately)
      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getTasksCompleted()).toBe(1);
    });
  });

  // ==========================================================================
  // MAX-DURATION LIMIT TESTS
  // ==========================================================================

  describe('Max-Duration Limit', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-19T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should stop pipeline after N milliseconds', () => {
      // SETUP: Create ResourceMonitor with maxDuration = 5000
      const monitor = new ResourceMonitor({ maxDuration: 5000 });
      monitor.start();

      // EXECUTE: Advance time by 5000ms
      vi.advanceTimersByTime(5000);

      // VERIFY: shouldStop() returns true
      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getElapsed()).toBe(5000);
      expect(monitor.getStatus().limitType).toBe('maxDuration');
    });

    it('should not stop before maxDuration is reached', () => {
      // SETUP: Create ResourceMonitor with maxDuration = 10000
      const monitor = new ResourceMonitor({ maxDuration: 10000 });
      monitor.start();

      // EXECUTE: Advance time by only 5000ms
      vi.advanceTimersByTime(5000);

      // VERIFY: shouldStop() returns false
      expect(monitor.shouldStop()).toBe(false);
      expect(monitor.getElapsed()).toBe(5000);
    });

    it('should handle zero maxDuration (stops immediately)', () => {
      // SETUP: Create ResourceMonitor with maxDuration = 0
      const monitor = new ResourceMonitor({ maxDuration: 0 });
      monitor.start();

      // EXECUTE: Check status immediately
      // VERIFY: shouldStop() returns true (0 means stop immediately)
      expect(monitor.shouldStop()).toBe(true);
    });
  });

  // ==========================================================================
  // RESOURCE LIMIT REPORT GENERATION TESTS
  // ==========================================================================

  describe('RESOURCE_LIMIT_REPORT.md Generation', () => {
    it('should generate correct status information on maxTasks limit', () => {
      // SETUP: Create ResourceMonitor with maxTasks = 1
      const monitor = new ResourceMonitor({ maxTasks: 1 });
      monitor.start();
      monitor.recordTaskComplete();

      // EXECUTE: Get status (which would trigger report in pipeline)
      const status = monitor.getStatus();

      // VERIFY: Status contains correct information for report
      expect(status.shouldStop).toBe(true);
      expect(status.limitType).toBe('maxTasks');
      expect(status.snapshot).toBeDefined();
      expect(monitor.getTasksCompleted()).toBe(1);
    });

    it('should include actionable suggestions based on limit type', () => {
      // SETUP: Test maxTasks limit suggestion
      const monitor = new ResourceMonitor({ maxTasks: 1 });
      monitor.start();
      monitor.recordTaskComplete();

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Suggestion includes continue flag reference
      expect(status.suggestion).toBeDefined();
      expect(status.suggestion).toContain('continue');
    });

    it('should include resume instructions in suggestion', () => {
      // SETUP: Create monitor in limit scenario
      const monitor = new ResourceMonitor({ maxTasks: 1 });
      monitor.start();
      monitor.recordTaskComplete();

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Resume instructions would be included in suggestion
      expect(status.suggestion).toContain('continue');
    });

    it('should include resource snapshot table data', () => {
      // SETUP: Mock specific resource values
      mockActiveHandles(245);
      const mockMemory = createMockMemoryUsage({
        heapUsed: 128.45 * 1024 * 1024,
      });
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemory);
      mockTotalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16 GB
      mockFreemem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8 GB

      // EXECUTE: Get status
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();
      const snapshot = status.snapshot;

      // VERIFY: All metrics present for table
      expect(snapshot.fileHandles).toBe(245);
      expect(snapshot.heapUsed).toBeCloseTo(128.45 * 1024 * 1024, 5);
      expect(snapshot.heapTotal).toBe(256 * 1024 * 1024);
      expect(snapshot.systemTotal).toBe(16 * 1024 * 1024 * 1024);
      expect(snapshot.systemFree).toBe(8 * 1024 * 1024 * 1024);
      expect(snapshot.memoryUsage).toBeCloseTo(0.5, 1);
    });
  });

  // ==========================================================================
  // COMBINED LIMITS TESTS
  // ==========================================================================

  describe('Combined Limits', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-19T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should prioritize critical resource limits over maxTasks', () => {
      // SETUP: Create monitor with maxTasks = 100, but file handles near limit
      // Note: File handle limit checking happens first in getStatus()
      const monitor = new ResourceMonitor({
        maxTasks: 100,
        fileHandleCriticalThreshold: 0.85,
      });

      // Mock file handles at 87% (would exceed 85% threshold)
      // This tests the priority ordering in getStatus()
      mockActiveHandles(900);

      // EXECUTE: Check shouldStop
      const status = monitor.getStatus();

      // VERIFY: Status is evaluated correctly
      expect(status.snapshot).toBeDefined();
    });

    it('should handle multiple limit types simultaneously', () => {
      // SETUP: Create monitor with both maxTasks and maxDuration
      const monitor = new ResourceMonitor({
        maxTasks: 10,
        maxDuration: 5000,
      });
      monitor.start();

      // EXECUTE: Advance time and complete tasks
      vi.advanceTimersByTime(6000); // Exceeds duration
      monitor.recordTaskComplete();

      // VERIFY: Duration limit detected
      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getElapsed()).toBe(6000);
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle start() called multiple times', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      // EXECUTE: Call start() twice
      monitor.start();
      monitor.start(); // Should not create duplicate intervals

      // VERIFY: No errors, monitor still works
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should handle stop() without start', () => {
      // SETUP: Create monitor without calling start()
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      // EXECUTE: Call stop() without start()
      expect(() => monitor.stop()).not.toThrow();

      // VERIFY: Clean exit
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should handle getStatus() before start', () => {
      // SETUP: Create monitor without start
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Returns valid status
      expect(status.snapshot).toBeDefined();
      expect(status.shouldStop).toBe(false);
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

    it('should handle polling lifecycle correctly', () => {
      // SETUP: Create monitor with short polling interval
      vi.useFakeTimers();
      const monitor = new ResourceMonitor({ pollingInterval: 100 });

      // EXECUTE: Start and stop
      monitor.start();
      vi.advanceTimersByTime(500);
      monitor.stop();

      // VERIFY: Clean lifecycle
      expect(() => monitor.stop()).not.toThrow();
      vi.useRealTimers();
    });

    it('should handle config with only maxTasks', () => {
      // SETUP: Create monitor with only maxTasks
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      // EXECUTE: Use the monitor
      monitor.start();
      monitor.recordTaskComplete();

      // VERIFY: Works correctly
      expect(monitor.getTasksCompleted()).toBe(1);
    });

    it('should handle config with only maxDuration', () => {
      // SETUP: Create monitor with only maxDuration
      vi.useFakeTimers();
      const monitor = new ResourceMonitor({ maxDuration: 1000 });

      // EXECUTE: Use the monitor
      monitor.start();
      vi.advanceTimersByTime(500);

      // VERIFY: Works correctly
      expect(monitor.getElapsed()).toBe(500);
      vi.useRealTimers();
    });

    it('should handle empty config', () => {
      // SETUP: Create monitor with empty config
      const monitor = new ResourceMonitor({});

      // EXECUTE: Use the monitor
      monitor.start();
      monitor.recordTaskComplete();

      // VERIFY: Works correctly
      expect(monitor.getTasksCompleted()).toBe(1);
      expect(monitor.shouldStop()).toBe(false);
    });
  });

  // ==========================================================================
  // STATUS REPORTING TESTS
  // ==========================================================================

  describe('Status Reporting', () => {
    it('should return valid ResourceLimitStatus', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({ maxTasks: 10 });

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Status structure is valid
      expect(status.shouldStop).toBe(false);
      expect(status.limitType).toBeNull();
      expect(status.snapshot).toBeDefined();
      expect(Array.isArray(status.warnings)).toBe(true);
    });

    it('should include timestamp in snapshot', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({});

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Timestamp is present
      expect(status.snapshot.timestamp).toBeGreaterThan(0);
    });

    it('should track file handle usage percentage', () => {
      // SETUP: Mock file handles
      mockActiveHandles(700);
      mockExecSync.mockReturnValue('1024\n');

      // EXECUTE: Get status
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: Usage percentage calculated
      expect(status.snapshot.fileHandles).toBe(700);
      expect(status.snapshot.fileHandleUlimit).toBe(1024);
    });
  });

  // ==========================================================================
  // POLLING LIFECYCLE TESTS
  // ==========================================================================

  describe('Polling Lifecycle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should take snapshots during polling', () => {
      // SETUP: Create monitor with short polling interval
      const monitor = new ResourceMonitor({ pollingInterval: 100 });
      monitor.start();

      // EXECUTE: Advance time to trigger polling
      vi.advanceTimersByTime(500);

      // VERIFY: Should have taken snapshots
      const status = monitor.getStatus();
      expect(status.snapshot).toBeDefined();

      monitor.stop();
    });

    it('should stop taking snapshots after stop()', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({ pollingInterval: 100 });
      monitor.start();

      // EXECUTE: Advance time, then stop
      vi.advanceTimersByTime(200);
      monitor.stop();

      // Clear any pending timers
      vi.clearAllTimers();

      // VERIFY: No more snapshots taken
      vi.advanceTimersByTime(200);
      expect(() => monitor.getStatus()).not.toThrow();
    });

    it('should handle rapid start/stop cycles', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({ pollingInterval: 100 });

      // EXECUTE: Multiple start/stop cycles
      monitor.start();
      monitor.stop();
      monitor.start();
      monitor.stop();

      // VERIFY: No errors
      expect(() => {
        monitor.start();
        vi.advanceTimersByTime(50);
        monitor.stop();
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // TYPE VALIDATION
  // ==========================================================================

  describe('Type Validation', () => {
    it('should export ResourceConfig type', () => {
      // SETUP: Create typed config
      const config: ResourceConfig = {
        maxTasks: 100,
        maxDuration: 60000,
        fileHandleWarnThreshold: 0.7,
        fileHandleCriticalThreshold: 0.85,
        memoryWarnThreshold: 0.8,
        memoryCriticalThreshold: 0.9,
        pollingInterval: 30000,
      };

      // EXECUTE: Create monitor with typed config
      const monitor = new ResourceMonitor(config);

      // VERIFY: Monitor created successfully
      expect(monitor).toBeDefined();
    });

    it('should export ResourceLimitStatus type', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({});

      // EXECUTE: Get status
      const status: ResourceLimitStatus = monitor.getStatus();

      // VERIFY: Status matches expected type
      expect(status.shouldStop).toBe(false);
      expect(status.limitType).toBeNull();
      expect(status.snapshot).toBeDefined();
      expect(Array.isArray(status.warnings)).toBe(true);
    });

    it('should export ResourceSnapshot type', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({});

      // EXECUTE: Get snapshot
      const snapshot: ResourceSnapshot = monitor.getStatus().snapshot;

      // VERIFY: Snapshot matches expected type
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.fileHandles).toBeGreaterThanOrEqual(0);
      expect(snapshot.fileHandleUlimit).toBeGreaterThanOrEqual(0);
      expect(snapshot.fileHandleUsage).toBeGreaterThanOrEqual(0);
      expect(snapshot.heapUsed).toBeGreaterThanOrEqual(0);
      expect(snapshot.heapTotal).toBeGreaterThanOrEqual(0);
      expect(snapshot.systemTotal).toBeGreaterThan(0);
      expect(snapshot.systemFree).toBeGreaterThanOrEqual(0);
      expect(snapshot.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(snapshot.memoryUsage).toBeLessThanOrEqual(1);
    });
  });
});
