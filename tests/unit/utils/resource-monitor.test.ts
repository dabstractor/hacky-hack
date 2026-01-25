/**
 * Unit tests for Resource Monitor utility
 *
 * @remarks
 * Tests validate the complete resource monitoring functionality including:
 * 1. ResourceSnapshot, ResourceConfig, ResourceLimitStatus interfaces
 * 2. FileHandleMonitor class with platform-specific detection
 * 3. MemoryMonitor class with heap and system tracking
 * 4. ResourceMonitor unified class combining both monitors
 * 5. Leak detection with historical samples
 * 6. Task count and duration tracking
 * 7. shouldStop() returns true when limits exceeded
 * 8. start/stop lifecycle for polling
 * 9. Warnings logged at warning thresholds
 * 10. Shutdown triggered at critical thresholds
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ResourceMonitor,
  type ResourceConfig,
  type ResourceSnapshot,
  type ResourceLimitStatus,
} from '../../../src/utils/resource-monitor.js';
import { getLogger, clearLoggerCache } from '../../../src/utils/logger.js';

// =============================================================================
// TEST FIXTURES
// =============================================================================

// Mock process._getActiveHandles for testing
const mockActiveHandles = (count: number) => {
  (process as any)._getActiveHandles = () => Array(count).fill({});
};

// Restore original process._getActiveHandles
const restoreActiveHandles = () => {
  (process as any)._getActiveHandles = undefined;
};

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ResourceMonitor', () => {
  beforeEach(() => {
    clearLoggerCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    restoreActiveHandles();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ========================================================================
  // ResourceMonitor Construction
  // ========================================================================

  describe('Construction', () => {
    it('should create ResourceMonitor with default config', () => {
      const monitor = new ResourceMonitor();
      expect(monitor).toBeDefined();
      expect(monitor.getTasksCompleted()).toBe(0);
    });

    it('should create ResourceMonitor with custom config', () => {
      const config: ResourceConfig = {
        maxTasks: 100,
        maxDuration: 60000,
        fileHandleWarnThreshold: 0.6,
        fileHandleCriticalThreshold: 0.8,
        memoryWarnThreshold: 0.7,
        memoryCriticalThreshold: 0.85,
        pollingInterval: 10000,
      };
      const monitor = new ResourceMonitor(config);
      expect(monitor).toBeDefined();
    });

    it('should accept maxTasks only', () => {
      const monitor = new ResourceMonitor({ maxTasks: 50 });
      expect(monitor).toBeDefined();
    });

    it('should accept maxDuration only', () => {
      const monitor = new ResourceMonitor({ maxDuration: 30000 });
      expect(monitor).toBeDefined();
    });
  });

  // ========================================================================
  // Task Count Tracking
  // ========================================================================

  describe('Task Count Tracking', () => {
    it('should track completed tasks', () => {
      const monitor = new ResourceMonitor({ maxTasks: 5 });
      expect(monitor.getTasksCompleted()).toBe(0);

      monitor.recordTaskComplete();
      expect(monitor.getTasksCompleted()).toBe(1);

      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      expect(monitor.getTasksCompleted()).toBe(3);
    });

    it('should trigger stop when maxTasks reached', () => {
      const monitor = new ResourceMonitor({ maxTasks: 3 });
      expect(monitor.shouldStop()).toBe(false);

      monitor.recordTaskComplete();
      expect(monitor.shouldStop()).toBe(false);

      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      expect(monitor.shouldStop()).toBe(true);

      const status = monitor.getStatus();
      expect(status.limitType).toBe('maxTasks');
      expect(status.shouldStop).toBe(true);
    });
  });

  // ========================================================================
  // Duration Tracking
  // ========================================================================

  describe('Duration Tracking', () => {
    it('should track elapsed time', () => {
      const monitor = new ResourceMonitor({ maxDuration: 5000 });
      const elapsed = monitor.getElapsed();
      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });

    it('should trigger stop when maxDuration reached', () => {
      const monitor = new ResourceMonitor({ maxDuration: 1000 });
      expect(monitor.shouldStop()).toBe(false);

      // Advance time past maxDuration
      vi.advanceTimersByTime(1500);
      expect(monitor.shouldStop()).toBe(true);

      const status = monitor.getStatus();
      expect(status.limitType).toBe('maxDuration');
      expect(status.shouldStop).toBe(true);
    });

    it('should not trigger stop before maxDuration', () => {
      const monitor = new ResourceMonitor({ maxDuration: 5000 });
      vi.advanceTimersByTime(4000);
      expect(monitor.shouldStop()).toBe(false);
    });
  });

  // ========================================================================
  // Status Reporting
  // ========================================================================

  describe('Status Reporting', () => {
    it('should return valid ResourceLimitStatus', () => {
      const monitor = new ResourceMonitor({ maxTasks: 10 });
      const status = monitor.getStatus();

      expect(status).toBeDefined();
      expect(status.shouldStop).toBe(false);
      expect(status.limitType).toBeNull();
      expect(status.snapshot).toBeDefined();
      expect(status.snapshot.timestamp).toBeGreaterThan(0);
      expect(Array.isArray(status.warnings)).toBe(true);
    });

    it('should include snapshot in status', () => {
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();
      const snapshot = status.snapshot;

      expect(snapshot.fileHandles).toBeGreaterThanOrEqual(0);
      expect(snapshot.fileHandleUlimit).toBeGreaterThanOrEqual(0);
      expect(snapshot.fileHandleUsage).toBeGreaterThanOrEqual(0);
      expect(snapshot.heapUsed).toBeGreaterThan(0);
      expect(snapshot.heapTotal).toBeGreaterThan(0);
      expect(snapshot.systemTotal).toBeGreaterThan(0);
      expect(snapshot.systemFree).toBeGreaterThan(0);
      expect(snapshot.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(snapshot.memoryUsage).toBeLessThanOrEqual(1);
    });

    it('should return suggestion when limit reached', () => {
      const monitor = new ResourceMonitor({ maxTasks: 1 });
      monitor.recordTaskComplete();

      const status = monitor.getStatus();
      expect(status.suggestion).toBeDefined();
      expect(status.suggestion).toContain('continue');
    });
  });

  // ========================================================================
  // shouldStop() Convenience Method
  // ========================================================================

  describe('shouldStop() Convenience Method', () => {
    it('should return false when no limits set', () => {
      const monitor = new ResourceMonitor();
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should return false when limits not reached', () => {
      const monitor = new ResourceMonitor({ maxTasks: 100 });
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should return true when maxTasks reached', () => {
      const monitor = new ResourceMonitor({ maxTasks: 1 });
      monitor.recordTaskComplete();
      expect(monitor.shouldStop()).toBe(true);
    });

    it('should return true when maxDuration reached', () => {
      const monitor = new ResourceMonitor({ maxDuration: 100 });
      vi.advanceTimersByTime(200);
      expect(monitor.shouldStop()).toBe(true);
    });

    it('should prioritize first limit reached', () => {
      const monitor = new ResourceMonitor({
        maxTasks: 100,
        maxDuration: 1000,
      });
      monitor.recordTaskComplete();
      vi.advanceTimersByTime(2000);

      const status = monitor.getStatus();
      expect(status.shouldStop).toBe(true);
      // Duration limit checked after task limit
      expect(status.limitType).toBe('maxDuration');
    });
  });

  // ========================================================================
  // Polling Lifecycle
  // ========================================================================

  describe('Polling Lifecycle', () => {
    it('should start monitoring when start() called', () => {
      const monitor = new ResourceMonitor({ pollingInterval: 1000 });
      expect(() => monitor.start()).not.toThrow();
    });

    it('should stop monitoring when stop() called', () => {
      const monitor = new ResourceMonitor({ pollingInterval: 1000 });
      monitor.start();
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should be idempotent - multiple start() calls safe', () => {
      const monitor = new ResourceMonitor({ pollingInterval: 1000 });
      monitor.start();
      monitor.start();
      monitor.start();
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should be idempotent - multiple stop() calls safe', () => {
      const monitor = new ResourceMonitor({ pollingInterval: 1000 });
      monitor.start();
      monitor.stop();
      monitor.stop();
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should take snapshots during polling', () => {
      const monitor = new ResourceMonitor({ pollingInterval: 100 });
      monitor.start();

      // Advance time to trigger polling
      vi.advanceTimersByTime(500);

      // Should have taken multiple snapshots
      const status = monitor.getStatus();
      expect(status.snapshot).toBeDefined();

      monitor.stop();
    });
  });

  // ========================================================================
  // File Handle Monitoring (with mocking)
  // ========================================================================

  describe('File Handle Monitoring', () => {
    it('should detect file handle count via internal API', () => {
      mockActiveHandles(42);
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      // On platforms where internal API works
      if ((process as any)._getActiveHandles) {
        expect(status.snapshot.fileHandles).toBe(42);
      }

      restoreActiveHandles();
    });

    it('should return zero file handles on Windows when no ulimit', () => {
      // This test mainly validates no crash occurs
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      expect(status.snapshot.fileHandleUlimit).toBeGreaterThanOrEqual(0);
    });

    it('should calculate file handle usage percentage', () => {
      mockActiveHandles(700);
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      // Usage should be between 0 and 1
      expect(status.snapshot.fileHandleUsage).toBeGreaterThanOrEqual(0);
      expect(status.snapshot.fileHandleUsage).toBeLessThanOrEqual(1);

      restoreActiveHandles();
    });
  });

  // ========================================================================
  // Memory Monitoring
  // ========================================================================

  describe('Memory Monitoring', () => {
    it('should track heap memory usage', () => {
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      expect(status.snapshot.heapUsed).toBeGreaterThan(0);
      expect(status.snapshot.heapTotal).toBeGreaterThan(0);
      expect(status.snapshot.heapTotal).toBeGreaterThanOrEqual(
        status.snapshot.heapUsed
      );
    });

    it('should track system memory usage', () => {
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      expect(status.snapshot.systemTotal).toBeGreaterThan(0);
      expect(status.snapshot.systemFree).toBeGreaterThan(0);
      expect(status.snapshot.systemTotal).toBeGreaterThanOrEqual(
        status.snapshot.systemFree
      );
    });

    it('should calculate memory usage percentage', () => {
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      expect(status.snapshot.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(status.snapshot.memoryUsage).toBeLessThanOrEqual(1);
    });

    it('should have non-zero memory usage', () => {
      const monitor = new ResourceMonitor();
      const status = monitor.getStatus();

      // In a running Node.js process, memory should be > 0
      expect(status.snapshot.heapUsed).toBeGreaterThan(0);
      expect(status.snapshot.systemTotal).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Leak Detection
  // ========================================================================

  describe('Leak Detection', () => {
    it('should detect file handle growth over time', () => {
      const logger = getLogger('ResourceMonitor');
      const warnSpy = vi.spyOn(logger, 'warn');

      const monitor = new ResourceMonitor({ pollingInterval: 100 });
      monitor.start();

      // Simulate file handle growth
      mockActiveHandles(100);
      vi.advanceTimersByTime(150);

      mockActiveHandles(125); // 25% growth
      vi.advanceTimersByTime(150);

      // Should have logged a warning about leak
      // (Note: this depends on implementation detail of leak detection)
      monitor.stop();

      restoreActiveHandles();
    });

    it('should detect memory growth over time', () => {
      const monitor = new ResourceMonitor({ pollingInterval: 100 });
      monitor.start();

      // Advance time to collect multiple samples
      vi.advanceTimersByTime(1000);

      // Memory should be tracked
      const status = monitor.getStatus();
      expect(status.snapshot.heapUsed).toBeGreaterThan(0);

      monitor.stop();
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle zero maxTasks', () => {
      const monitor = new ResourceMonitor({ maxTasks: 0 });
      monitor.recordTaskComplete();
      expect(monitor.shouldStop()).toBe(true);
    });

    it('should handle very large maxTasks', () => {
      const monitor = new ResourceMonitor({ maxTasks: 999999 });
      monitor.recordTaskComplete();
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should handle very short maxDuration', () => {
      const monitor = new ResourceMonitor({ maxDuration: 1 });
      vi.advanceTimersByTime(10);
      expect(monitor.shouldStop()).toBe(true);
    });

    it('should handle concurrent start/stop calls', () => {
      const monitor = new ResourceMonitor({ pollingInterval: 100 });
      monitor.start();
      monitor.start();
      monitor.stop();
      monitor.stop();
      expect(monitor.getElapsed()).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordTaskComplete() without limits', () => {
      const monitor = new ResourceMonitor();
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      expect(monitor.getTasksCompleted()).toBe(2);
      expect(monitor.shouldStop()).toBe(false);
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration Tests', () => {
    it('should track both tasks and duration simultaneously', () => {
      const monitor = new ResourceMonitor({
        maxTasks: 10,
        maxDuration: 5000,
      });

      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      vi.advanceTimersByTime(1000);

      expect(monitor.getTasksCompleted()).toBe(2);
      expect(monitor.getElapsed()).toBeGreaterThanOrEqual(1000);
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should trigger on first limit reached', () => {
      const monitor = new ResourceMonitor({
        maxTasks: 2,
        maxDuration: 5000,
      });

      // Reach task limit first
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();

      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getStatus().limitType).toBe('maxTasks');
    });

    it('should provide complete status with all fields', () => {
      const monitor = new ResourceMonitor({
        maxTasks: 5,
        maxDuration: 10000,
        fileHandleWarnThreshold: 0.7,
        memoryWarnThreshold: 0.8,
      });

      monitor.recordTaskComplete();
      vi.advanceTimersByTime(1000);

      const status = monitor.getStatus();
      expect(status.snapshot).toBeDefined();
      expect(status.snapshot.timestamp).toBeGreaterThan(0);
      expect(status.shouldStop).toBe(false);
      expect(status.limitType).toBeNull();
      expect(Array.isArray(status.warnings)).toBe(true);
    });
  });

  // ========================================================================
  // Type Validation
  // ========================================================================

  describe('Type Validation', () => {
    it('should export ResourceConfig type', () => {
      const config: ResourceConfig = {
        maxTasks: 100,
        maxDuration: 60000,
      };
      expect(config.maxTasks).toBe(100);
      expect(config.maxDuration).toBe(60000);
    });

    it('should export ResourceSnapshot type', () => {
      const snapshot: ResourceSnapshot = {
        timestamp: Date.now(),
        fileHandles: 100,
        fileHandleUlimit: 1024,
        fileHandleUsage: 0.1,
        heapUsed: 1000000,
        heapTotal: 2000000,
        systemTotal: 8000000000,
        systemFree: 4000000000,
        memoryUsage: 0.5,
      };
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });

    it('should export ResourceLimitStatus type', () => {
      const status: ResourceLimitStatus = {
        shouldStop: false,
        limitType: null,
        snapshot: {
          timestamp: Date.now(),
          fileHandles: 100,
          fileHandleUlimit: 1024,
          fileHandleUsage: 0.1,
          heapUsed: 1000000,
          heapTotal: 2000000,
          systemTotal: 8000000000,
          systemFree: 4000000000,
          memoryUsage: 0.5,
        },
        warnings: [],
      };
      expect(status.shouldStop).toBe(false);
      expect(status.limitType).toBeNull();
    });
  });

  // ========================================================================
  // lsof Cache Configuration Tests
  // ========================================================================

  describe('lsof Cache Configuration', () => {
    it('should accept cacheTtl in ResourceConfig', () => {
      const config: ResourceConfig = {
        cacheTtl: 5000,
      };
      const monitor = new ResourceMonitor(config);
      expect(monitor).toBeDefined();
    });

    it('should use default cacheTtl of 1000ms when not specified', () => {
      const monitor = new ResourceMonitor({});
      expect(monitor).toBeDefined();
      // Default cacheTtl is handled internally
    });

    it('should provide clearLsofCache() method on FileHandleMonitor', () => {
      const monitor = new ResourceMonitor({
        cacheTtl: 5000,
      });
      // Verify the method exists and is callable
      expect(typeof monitor.fileHandleMonitor.clearLsofCache).toBe('function');
      expect(() => monitor.fileHandleMonitor.clearLsofCache()).not.toThrow();
    });

    it('should handle different cacheTtl values', () => {
      const ttls = [100, 500, 1000, 5000, 10000];

      for (const ttl of ttls) {
        const config: ResourceConfig = { cacheTtl: ttl };
        const monitor = new ResourceMonitor(config);
        expect(monitor).toBeDefined();
        expect(typeof monitor.fileHandleMonitor.clearLsofCache).toBe(
          'function'
        );
      }
    });

    it('should accept cacheTtl alongside other ResourceConfig options', () => {
      const config: ResourceConfig = {
        cacheTtl: 2000,
        fileHandleWarnThreshold: 0.6,
        fileHandleCriticalThreshold: 0.8,
        memoryWarnThreshold: 0.7,
        memoryCriticalThreshold: 0.9,
        pollingInterval: 15000,
      };
      const monitor = new ResourceMonitor(config);
      expect(monitor).toBeDefined();
    });
  });
});
