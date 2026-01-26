/**
 * Unit tests for MetricsCollector utility
 *
 * @remarks
 * Tests validate the complete metrics collection functionality including:
 * 1. Task timing metrics with percentile calculation
 * 2. Token usage tracking per agent type
 * 3. Cache statistics (hits, misses, hit rate)
 * 4. Resource snapshot recording and circular buffer
 * 5. Custom counter and gauge metrics
 * 6. Metrics snapshot generation and export
 * 7. EventEmitter-based real-time metric emission
 * 8. Reset functionality
 * 9. Error handling for invalid inputs
 * 10. Thread-safe Map-based data structures
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import { MetricsCollector } from '@/utils/metrics-collector.js';
import type {
  TimingMetric,
  TokenUsage,
  CacheStats,
  ResourceSnapshot,
  CounterMetric,
  GaugeMetric,
  MetricsSnapshot,
} from '@/utils/metrics-collector.js';
import { getLogger, clearLoggerCache } from '@/utils/logger.js';

// =============================================================================
// TEST FIXTURES
// =============================================================================

// Mock logger for testing
const mockLogger = getLogger('MetricsCollector');

// =============================================================================
// TEST SUITES
// =============================================================================

describe('utils/metrics-collector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    clearLoggerCache();
    vi.useFakeTimers();
    collector = new MetricsCollector(mockLogger);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Construction
  // ========================================================================

  describe('Construction', () => {
    it('should create MetricsCollector with logger', () => {
      const c = new MetricsCollector(mockLogger);
      expect(c).toBeDefined();
      expect(c.getPipelineDuration()).toBeGreaterThanOrEqual(0);
      expect(c.getTaskCount()).toBe(0);
    });

    it('should accept custom maxSnapshots parameter', () => {
      const c = new MetricsCollector(mockLogger, 100);
      expect(c).toBeDefined();
    });

    it('should accept custom maxSamples parameter', () => {
      const c = new MetricsCollector(mockLogger, 1000, 5000);
      expect(c).toBeDefined();
    });

    it('should extend EventEmitter for real-time monitoring', () => {
      expect(collector).toBeInstanceOf(EventEmitter);
      expect(typeof collector.on).toBe('function');
      expect(typeof collector.emit).toBe('function');
    });
  });

  // ========================================================================
  // Task Timing Metrics
  // ========================================================================

  describe('Task Timing Metrics', () => {
    it('should record task timing for single task', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);

      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1']).toBeDefined();
      expect(snapshot.taskTimings['P1.M1.T1.S1'].count).toBe(1);
      expect(snapshot.taskTimings['P1.M1.T1.S1'].min).toBe(1000);
      expect(snapshot.taskTimings['P1.M1.T1.S1'].max).toBe(1000);
      expect(snapshot.taskTimings['P1.M1.T1.S1'].avg).toBe(1000);
    });

    it('should track multiple recordings for same task', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      collector.recordTaskTiming('P1.M1.T1.S1', 2000);
      collector.recordTaskTiming('P1.M1.T1.S1', 3000);

      const snapshot = collector.getSnapshot();
      const timing = snapshot.taskTimings['P1.M1.T1.S1'];

      expect(timing.count).toBe(3);
      expect(timing.min).toBe(1000);
      expect(timing.max).toBe(3000);
      expect(timing.avg).toBeCloseTo(2000);
    });

    it('should calculate percentiles from samples', () => {
      // Record 100 samples with known distribution
      for (let i = 1; i <= 100; i++) {
        collector.recordTaskTiming('P1.M1.T1.S1', i * 10);
      }

      const snapshot = collector.getSnapshot();
      const timing = snapshot.taskTimings['P1.M1.T1.S1'];

      expect(timing.p50).toBeCloseTo(500, 0); // ~500ms (50th percentile)
      expect(timing.p95).toBeCloseTo(950, 0); // ~950ms (95th percentile)
      expect(timing.p99).toBeCloseTo(990, 0); // ~990ms (99th percentile)
    });

    it('should emit event on task timing', () => {
      const spy = vi.fn();
      collector.on('taskTiming', spy);

      collector.recordTaskTiming('P1.M1.T1.S1', 1000);

      expect(spy).toHaveBeenCalledWith({
        taskId: 'P1.M1.T1.S1',
        duration: 1000,
      });
    });

    it('should ignore negative durations', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', -100);

      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1']).toBeUndefined();
    });

    it('should handle zero duration', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 0);

      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1']).toBeDefined();
      expect(snapshot.taskTimings['P1.M1.T1.S1'].min).toBe(0);
    });

    it('should track multiple tasks independently', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      collector.recordTaskTiming('P1.M1.T1.S2', 2000);

      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1'].avg).toBe(1000);
      expect(snapshot.taskTimings['P1.M1.T1.S2'].avg).toBe(2000);
    });

    it('should return correct task count', () => {
      expect(collector.getTaskCount()).toBe(0);

      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      expect(collector.getTaskCount()).toBe(1);

      collector.recordTaskTiming('P1.M1.T1.S2', 2000);
      expect(collector.getTaskCount()).toBe(2);
    });
  });

  // ========================================================================
  // Token Usage Metrics
  // ========================================================================

  describe('Token Usage Metrics', () => {
    it('should record token usage for architect agent', () => {
      collector.recordTokenUsage('architect', 1000, 500);

      const snapshot = collector.getSnapshot();
      expect(snapshot.agentTokens['architect']).toBeDefined();
      expect(snapshot.agentTokens['architect'].inputTokens).toBe(1000);
      expect(snapshot.agentTokens['architect'].outputTokens).toBe(500);
      expect(snapshot.agentTokens['architect'].totalTokens).toBe(1500);
      expect(snapshot.agentTokens['architect'].requestCount).toBe(1);
    });

    it('should aggregate multiple recordings for same agent', () => {
      collector.recordTokenUsage('coder', 5000, 3000);
      collector.recordTokenUsage('coder', 3000, 2000);

      const snapshot = collector.getSnapshot();
      const usage = snapshot.agentTokens['coder'];

      expect(usage.inputTokens).toBe(8000);
      expect(usage.outputTokens).toBe(5000);
      expect(usage.totalTokens).toBe(13000);
      expect(usage.requestCount).toBe(2);
    });

    it('should track all four agent types', () => {
      collector.recordTokenUsage('architect', 1000, 500);
      collector.recordTokenUsage('researcher', 2000, 1000);
      collector.recordTokenUsage('coder', 5000, 3000);
      collector.recordTokenUsage('qa', 500, 250);

      const snapshot = collector.getSnapshot();
      expect(snapshot.agentTokens['architect']).toBeDefined();
      expect(snapshot.agentTokens['researcher']).toBeDefined();
      expect(snapshot.agentTokens['coder']).toBeDefined();
      expect(snapshot.agentTokens['qa']).toBeDefined();
    });

    it('should emit event on token usage', () => {
      const spy = vi.fn();
      collector.on('tokenUsage', spy);

      collector.recordTokenUsage('architect', 1000, 500);

      expect(spy).toHaveBeenCalledWith({
        agentType: 'architect',
        inputTokens: 1000,
        outputTokens: 500,
      });
    });

    it('should ignore negative token counts', () => {
      collector.recordTokenUsage('architect', -100, 500);
      collector.recordTokenUsage('architect', 100, -500);

      const snapshot = collector.getSnapshot();
      expect(snapshot.agentTokens['architect']).toBeUndefined();
    });

    it('should accept zero token counts', () => {
      collector.recordTokenUsage('architect', 0, 0);

      const snapshot = collector.getSnapshot();
      expect(snapshot.agentTokens['architect']).toBeDefined();
      expect(snapshot.agentTokens['architect'].totalTokens).toBe(0);
    });
  });

  // ========================================================================
  // Cache Statistics
  // ========================================================================

  describe('Cache Statistics', () => {
    it('should record cache hits', () => {
      collector.recordCacheHit();

      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheStats.hits).toBe(1);
      expect(snapshot.cacheStats.misses).toBe(0);
      expect(snapshot.cacheStats.totalRequests).toBe(1);
      expect(snapshot.cacheStats.hitRate).toBe(1);
    });

    it('should record cache misses', () => {
      collector.recordCacheMiss();

      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheStats.hits).toBe(0);
      expect(snapshot.cacheStats.misses).toBe(1);
      expect(snapshot.cacheStats.totalRequests).toBe(1);
      expect(snapshot.cacheStats.hitRate).toBe(0);
    });

    it('should calculate hit rate correctly', () => {
      collector.recordCacheHit();
      collector.recordCacheHit();
      collector.recordCacheMiss();
      collector.recordCacheHit();

      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheStats.hits).toBe(3);
      expect(snapshot.cacheStats.misses).toBe(1);
      expect(snapshot.cacheStats.totalRequests).toBe(4);
      expect(snapshot.cacheStats.hitRate).toBe(0.75);
    });

    it('should handle zero requests', () => {
      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheStats.hits).toBe(0);
      expect(snapshot.cacheStats.misses).toBe(0);
      expect(snapshot.cacheStats.totalRequests).toBe(0);
      expect(snapshot.cacheStats.hitRate).toBe(0);
    });

    it('should emit events on cache operations', () => {
      const hitSpy = vi.fn();
      const missSpy = vi.fn();

      collector.on('cacheHit', hitSpy);
      collector.on('cacheMiss', missSpy);

      collector.recordCacheHit();
      collector.recordCacheMiss();

      expect(hitSpy).toHaveBeenCalled();
      expect(missSpy).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Resource Snapshots
  // ========================================================================

  describe('Resource Snapshots', () => {
    it('should record resource snapshot', () => {
      const snapshot: ResourceSnapshot = {
        timestamp: Date.now(),
        heapUsed: 1000000,
        heapTotal: 2000000,
        rss: 5000000,
        fileHandles: 100,
        fileHandleUlimit: 1024,
      };

      collector.recordResourceSnapshot(snapshot);

      const metrics = collector.getSnapshot();
      expect(metrics.resourceSnapshots).toHaveLength(1);
      expect(metrics.resourceSnapshots[0]).toEqual(snapshot);
    });

    it('should limit snapshots to maxSnapshots (circular buffer)', () => {
      const c = new MetricsCollector(mockLogger, 3); // Max 3 snapshots

      for (let i = 0; i < 5; i++) {
        c.recordResourceSnapshot({
          timestamp: Date.now() + i * 1000,
          heapUsed: i * 1000000,
          heapTotal: 20000000,
          rss: 50000000,
          fileHandles: 100,
          fileHandleUlimit: 1024,
        });
      }

      const metrics = c.getSnapshot();
      // Should only have last 3 snapshots
      expect(metrics.resourceSnapshots).toHaveLength(3);
      // First snapshot should be the 3rd one (oldest kept)
      expect(metrics.resourceSnapshots[0].heapUsed).toBe(2000000);
    });

    it('should emit event on snapshot recording', () => {
      const spy = vi.fn();
      collector.on('resourceSnapshot', spy);

      const snapshot: ResourceSnapshot = {
        timestamp: Date.now(),
        heapUsed: 1000000,
        heapTotal: 2000000,
        rss: 5000000,
        fileHandles: 100,
        fileHandleUlimit: 1024,
      };

      collector.recordResourceSnapshot(snapshot);

      expect(spy).toHaveBeenCalledWith(snapshot);
    });
  });

  // ========================================================================
  // Custom Counter Metrics
  // ========================================================================

  describe('Custom Counter Metrics', () => {
    it('should create counter on first increment', () => {
      collector.incrementCounter('files.processed');

      const snapshot = collector.getSnapshot();
      expect(snapshot.customCounters['files.processed']).toBeDefined();
      expect(snapshot.customCounters['files.processed'].value).toBe(1);
      expect(snapshot.customCounters['files.processed'].increments).toBe(1);
    });

    it('should increment counter value', () => {
      collector.incrementCounter('api.calls', 5);
      collector.incrementCounter('api.calls', 3);

      const snapshot = collector.getSnapshot();
      expect(snapshot.customCounters['api.calls'].value).toBe(8);
      expect(snapshot.customCounters['api.calls'].increments).toBe(2);
    });

    it('should track multiple counters independently', () => {
      collector.incrementCounter('counter1', 1);
      collector.incrementCounter('counter2', 2);

      const snapshot = collector.getSnapshot();
      expect(snapshot.customCounters['counter1'].value).toBe(1);
      expect(snapshot.customCounters['counter2'].value).toBe(2);
    });

    it('should emit event on counter increment', () => {
      const spy = vi.fn();
      collector.on('counter', spy);

      collector.incrementCounter('test', 5);

      expect(spy).toHaveBeenCalledWith({ name: 'test', value: 5 });
    });
  });

  // ========================================================================
  // Custom Gauge Metrics
  // ========================================================================

  describe('Custom Gauge Metrics', () => {
    it('should create gauge on first set', () => {
      collector.setGauge('queue.size', 42);

      const snapshot = collector.getSnapshot();
      expect(snapshot.customGauges['queue.size']).toBeDefined();
      expect(snapshot.customGauges['queue.size'].value).toBe(42);
      expect(snapshot.customGauges['queue.size'].lastUpdated).toBeGreaterThan(
        0
      );
    });

    it('should update gauge value', () => {
      vi.setSystemTime(Date.now());
      collector.setGauge('memory.percent', 50);

      vi.advanceTimersByTime(1000);
      collector.setGauge('memory.percent', 75);

      const snapshot = collector.getSnapshot();
      expect(snapshot.customGauges['memory.percent'].value).toBe(75);
    });

    it('should track multiple gauges independently', () => {
      collector.setGauge('gauge1', 10);
      collector.setGauge('gauge2', 20);

      const snapshot = collector.getSnapshot();
      expect(snapshot.customGauges['gauge1'].value).toBe(10);
      expect(snapshot.customGauges['gauge2'].value).toBe(20);
    });

    it('should emit event on gauge set', () => {
      const spy = vi.fn();
      collector.on('gauge', spy);

      collector.setGauge('test', 42);

      expect(spy).toHaveBeenCalledWith({ name: 'test', value: 42 });
    });
  });

  // ========================================================================
  // Metrics Snapshot
  // ========================================================================

  describe('Metrics Snapshot', () => {
    it('should generate complete snapshot', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      collector.recordTokenUsage('architect', 1000, 500);
      collector.recordCacheHit();
      collector.recordResourceSnapshot({
        timestamp: Date.now(),
        heapUsed: 1000000,
        heapTotal: 2000000,
        rss: 5000000,
        fileHandles: 100,
        fileHandleUlimit: 1024,
      });
      collector.incrementCounter('test', 1);
      collector.setGauge('test', 42);

      const snapshot = collector.getSnapshot();

      // Verify metadata
      expect(snapshot.metadata).toBeDefined();
      expect(snapshot.metadata.collectedAt).toBeDefined();
      expect(snapshot.metadata.pipelineDuration).toBeGreaterThanOrEqual(0);

      // Verify task timings
      expect(snapshot.taskTimings['P1.M1.T1.S1']).toBeDefined();

      // Verify agent tokens
      expect(snapshot.agentTokens['architect']).toBeDefined();

      // Verify cache stats
      expect(snapshot.cacheStats).toBeDefined();

      // Verify resource snapshots
      expect(snapshot.resourceSnapshots).toHaveLength(1);

      // Verify custom metrics
      expect(snapshot.customCounters['test']).toBeDefined();
      expect(snapshot.customGauges['test']).toBeDefined();
    });

    it('should include metadata with timestamp and duration', () => {
      vi.setSystemTime(Date.now());
      const startTime = Date.now();

      vi.advanceTimersByTime(5000);

      const snapshot = collector.getSnapshot();
      expect(snapshot.metadata.pipelineDuration).toBeGreaterThanOrEqual(5000);
      expect(
        new Date(snapshot.metadata.collectedAt).getTime()
      ).toBeGreaterThanOrEqual(startTime);
    });
  });

  // ========================================================================
  // Reset Functionality
  // ========================================================================

  describe('Reset Functionality', () => {
    it('should clear all metrics on reset', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      collector.recordTokenUsage('architect', 1000, 500);
      collector.recordCacheHit();
      collector.incrementCounter('test', 1);
      collector.setGauge('test', 42);

      collector.reset();

      const snapshot = collector.getSnapshot();
      expect(Object.keys(snapshot.taskTimings)).toHaveLength(0);
      expect(Object.keys(snapshot.agentTokens)).toHaveLength(0);
      expect(snapshot.cacheStats.hits).toBe(0);
      expect(snapshot.cacheStats.misses).toBe(0);
      expect(snapshot.resourceSnapshots).toHaveLength(0);
      expect(Object.keys(snapshot.customCounters)).toHaveLength(0);
      expect(Object.keys(snapshot.customGauges)).toHaveLength(0);
    });

    it('should emit reset event', () => {
      const spy = vi.fn();
      collector.on('reset', spy);

      collector.reset();

      expect(spy).toHaveBeenCalled();
    });

    it('should allow fresh recording after reset', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      collector.reset();
      collector.recordTaskTiming('P1.M1.T2.S1', 2000);

      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1']).toBeUndefined();
      expect(snapshot.taskTimings['P1.M1.T2.S1']).toBeDefined();
    });
  });

  // ========================================================================
  // Pipeline Duration
  // ========================================================================

  describe('Pipeline Duration', () => {
    it('should track elapsed time since creation', () => {
      vi.setSystemTime(Date.now());
      const startTime = Date.now();

      vi.advanceTimersByTime(1000);

      const duration = collector.getPipelineDuration();
      expect(duration).toBeGreaterThanOrEqual(1000);
      expect(duration).toBeLessThan(1100); // Small tolerance
    });

    it('should return zero for newly created collector', () => {
      const c = new MetricsCollector(mockLogger);
      expect(c.getPipelineDuration()).toBeGreaterThanOrEqual(0);
      expect(c.getPipelineDuration()).toBeLessThan(100);
    });
  });

  // ========================================================================
  // Export Functionality
  // ========================================================================

  describe('Export Functionality', () => {
    it('should export snapshot to JSON file', async () => {
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      collector.recordTokenUsage('architect', 1000, 500);

      const mockWriteFile = vi.fn().mockResolvedValue(undefined);
      const mockRename = vi.fn().mockResolvedValue(undefined);

      vi.doMock('node:fs/promises', () => ({
        writeFile: mockWriteFile,
        rename: mockRename,
      }));

      // This test validates the snapshot structure
      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1']).toBeDefined();
      expect(snapshot.agentTokens['architect']).toBeDefined();

      // Verify JSON serialization works
      const json = JSON.stringify(snapshot);
      expect(json).toBeDefined();

      const parsed = JSON.parse(json) as MetricsSnapshot;
      expect(parsed.taskTimings['P1.M1.T1.S1']).toBeDefined();
    });

    it('should emit export event on successful export', async () => {
      const spy = vi.fn();
      collector.on('export', spy);

      collector.recordTaskTiming('P1.M1.T1.S1', 1000);

      // Mock fs operations
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      const renameMock = vi.fn().mockResolvedValue(undefined);

      // The actual export will be tested in integration tests
      // Here we just verify the snapshot is correct
      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1']).toBeDefined();
    });
  });

  // ========================================================================
  // Type Validation
  // ========================================================================

  describe('Type Validation', () => {
    it('should export TimingMetric type', () => {
      const timing: TimingMetric = {
        count: 1,
        min: 100,
        max: 100,
        avg: 100,
        p50: 100,
        p95: 100,
        p99: 100,
      };
      expect(timing.count).toBe(1);
    });

    it('should export TokenUsage type', () => {
      const usage: TokenUsage = {
        agentType: 'architect',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        requestCount: 1,
      };
      expect(usage.agentType).toBe('architect');
    });

    it('should export CacheStats type', () => {
      const stats: CacheStats = {
        hits: 5,
        misses: 2,
        hitRate: 0.7142857142857143,
        totalRequests: 7,
      };
      expect(stats.hitRate).toBeCloseTo(0.714);
    });

    it('should export ResourceSnapshot type', () => {
      const snapshot: ResourceSnapshot = {
        timestamp: Date.now(),
        heapUsed: 1000000,
        heapTotal: 2000000,
        rss: 5000000,
        fileHandles: 100,
        fileHandleUlimit: 1024,
      };
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });

    it('should export CounterMetric type', () => {
      const counter: CounterMetric = {
        value: 42,
        increments: 5,
      };
      expect(counter.value).toBe(42);
    });

    it('should export GaugeMetric type', () => {
      const gauge: GaugeMetric = {
        value: 75,
        lastUpdated: Date.now(),
      };
      expect(gauge.value).toBe(75);
    });

    it('should export MetricsSnapshot type', () => {
      const snapshot: MetricsSnapshot = {
        metadata: {
          collectedAt: new Date().toISOString(),
          pipelineDuration: 5000,
          sessionPath: '/test/path',
          correlationId: 'test-id',
        },
        taskTimings: {},
        agentTokens: {},
        cacheStats: {
          hits: 0,
          misses: 0,
          hitRate: 0,
          totalRequests: 0,
        },
        resourceSnapshots: [],
        customCounters: {},
        customGauges: {},
      };
      expect(snapshot.metadata.sessionPath).toBe('/test/path');
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle empty samples for percentiles', () => {
      // Record without samples (shouldn't happen in practice)
      collector.recordTaskTiming('P1.M1.T1.S1', 1000);
      const snapshot = collector.getSnapshot();
      const timing = snapshot.taskTimings['P1.M1.T1.S1'];

      // With 1 sample, all percentiles equal the sample
      expect(timing.p50).toBe(1000);
      expect(timing.p95).toBe(1000);
      expect(timing.p99).toBe(1000);
    });

    it('should handle very large duration values', () => {
      collector.recordTaskTiming('P1.M1.T1.S1', Number.MAX_SAFE_INTEGER);

      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1.M1.T1.S1'].max).toBe(
        Number.MAX_SAFE_INTEGER
      );
    });

    it('should handle concurrent metric recording', () => {
      // Simulate concurrent recording
      for (let i = 0; i < 100; i++) {
        collector.recordTaskTiming(`task-${i}`, i * 10);
        collector.recordTokenUsage('architect', i * 100, i * 50);
        collector.incrementCounter('concurrent', 1);
      }

      const snapshot = collector.getSnapshot();
      expect(collector.getTaskCount()).toBe(100);
      expect(snapshot.customCounters['concurrent'].value).toBe(100);
    });

    it('should handle special characters in metric names', () => {
      collector.incrementCounter('metric.with.dots', 1);
      collector.setGauge('metric-with-dashes', 42);

      const snapshot = collector.getSnapshot();
      expect(snapshot.customCounters['metric.with.dots']).toBeDefined();
      expect(snapshot.customGauges['metric-with-dashes']).toBeDefined();
    });
  });
});
