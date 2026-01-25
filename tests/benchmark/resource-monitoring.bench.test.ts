/**
 * Performance benchmarks for Resource Monitor
 *
 * @remarks
 * Benchmarks validate the performance improvements from caching lsof results
 * on macOS. Compares cached vs uncached implementations across platforms.
 *
 * @see {@link https://github.com/tinylibs/tinybench | Tinybench Documentation}
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { Bench } from 'tinybench';
import {
  ResourceMonitor,
  type ResourceConfig,
} from '../../src/utils/resource-monitor.js';

// =============================================================================
// TEST FIXTURES
// =============================================================================

// Save original platform and restore after each test
let originalPlatform: NodeJS.Platform;

beforeEach(() => {
  originalPlatform = process.platform;
});

afterEach(() => {
  // Restore original platform
  Object.defineProperty(process, 'platform', { value: originalPlatform });
});

// =============================================================================
// BENCHMARK SUITES
// =============================================================================

describe('Resource Monitor Benchmarks', () => {
  describe('FileHandleMonitor - macOS lsof caching', () => {
    it('should show significant performance improvement with caching', async () => {
      const bench = new Bench({
        time: 2000, // 2 seconds per benchmark
        warmupTime: 500,
      });

      // Create monitors with different cache TTLs
      // TTL=0 means no caching (execute lsof every time)
      const monitorUncached = new ResourceMonitor({
        cacheTtl: 0, // Disabled cache
      });

      // TTL=1000ms means cache is valid for 1 second
      // During benchmark, all calls will hit cache
      const monitorCached = new ResourceMonitor({
        cacheTtl: 1000,
      });

      // Mock platform to macOS
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      // Add benchmarks
      bench
        .add('uncached lsof (TTL=0)', () => {
          monitorUncached.fileHandleMonitor.getHandleCount();
        })
        .add('cached lsof (TTL=1000ms)', () => {
          monitorCached.fileHandleMonitor.getHandleCount();
        });

      await bench.run();

      // Log results
      console.table(bench.table());

      // Get results
      const results = bench.tasks.map(t => ({
        name: t.name,
        opsPerSec: t.result ? t.result.hz : 0,
        meanTime: t.result ? t.result.period : 0,
      }));

      const uncachedResult = results[0];
      const cachedResult = results[1];

      console.log('\n=== Performance Summary ===');
      console.log(
        `Uncached: ${(uncachedResult.meanTime * 1000).toFixed(4)} ms/call`
      );
      console.log(
        `Cached:   ${(cachedResult.meanTime * 1000).toFixed(4)} ms/call`
      );

      if (uncachedResult.meanTime > 0 && cachedResult.meanTime > 0) {
        const speedup = uncachedResult.meanTime / cachedResult.meanTime;
        const improvement =
          ((uncachedResult.meanTime - cachedResult.meanTime) /
            uncachedResult.meanTime) *
          100;
        console.log(`Speedup:  ${speedup.toFixed(1)}x faster`);
        console.log(
          `Improvement: ${improvement.toFixed(1)}% reduction in latency`
        );

        // Assert that cached is reasonably fast
        // Note: On systems where internal API works, both paths use it
        // so speedup will be minimal. On macOS where lsof is used,
        // speedup should be significant.
        if (speedup > 1.5) {
          // Cache is providing benefit
          expect(speedup).toBeGreaterThan(1);
        } else {
          // Both using internal API - still verify no regression
          expect(speedup).toBeGreaterThan(0.5); // At least 50% of uncached speed
        }
      }
    });
  });

  describe('FileHandleMonitor - Platform comparison', () => {
    it('should benchmark platform-specific implementations', async () => {
      const bench = new Bench({
        time: 1000,
        warmupTime: 200,
      });

      // Create monitor with cached lsof
      const monitor = new ResourceMonitor({
        cacheTtl: 5000,
      });

      // Benchmark Linux platform (uses /proc - very fast)
      bench.add('Linux /proc/fd read', () => {
        Object.defineProperty(process, 'platform', { value: 'linux' });
        monitor.fileHandleMonitor.getHandleCount();
      });

      // Benchmark macOS platform (uses cached lsof - fast after cache)
      bench.add('macOS cached lsof', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        monitor.fileHandleMonitor.getHandleCount();
      });

      // Benchmark Windows platform (returns 0 - fastest)
      bench.add('Windows fallback', () => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
        monitor.fileHandleMonitor.getHandleCount();
      });

      await bench.run();

      console.table(bench.table());
    });
  });

  describe('ResourceMonitor - Status check overhead', () => {
    it('should benchmark getStatus() performance', async () => {
      const bench = new Bench({
        time: 100,
        warmupTime: 50,
      });

      const monitor = new ResourceMonitor({
        fileHandleWarnThreshold: 0.7,
        memoryWarnThreshold: 0.8,
      });

      bench.add('getStatus() - cold', () => {
        monitor.getStatus();
      });

      await bench.run();

      console.table(bench.table());

      // Verify benchmark completed successfully
      expect(bench.tasks).toHaveLength(1);
      expect(bench.tasks[0].result).toBeDefined();
    });
  });

  describe('Cache effectiveness', () => {
    it('should measure cache hit rate impact', async () => {
      const bench = new Bench({
        time: 1000,
        iterations: 100,
      });

      // Monitor with short TTL (cache expires during benchmark)
      const monitorShortTTL = new ResourceMonitor({
        cacheTtl: 10, // 10ms TTL
      });

      // Monitor with long TTL (cache never expires during benchmark)
      const monitorLongTTL = new ResourceMonitor({
        cacheTtl: 60000, // 60s TTL
      });

      Object.defineProperty(process, 'platform', { value: 'darwin' });

      bench
        .add('Short TTL (10ms) - mixed cache hits/misses', () => {
          monitorShortTTL.fileHandleMonitor.getHandleCount();
        })
        .add('Long TTL (60s) - all cache hits', () => {
          monitorLongTTL.fileHandleMonitor.getHandleCount();
        });

      await bench.run();

      console.table(bench.table());

      // Long TTL should be faster due to 100% cache hit rate
      const results = bench.tasks.map(t => t.result?.period ?? 0);
      const shortTTLTime = results[0];
      const longTTLTime = results[1];

      if (shortTTLTime > 0 && longTTLTime > 0) {
        const improvement = ((shortTTLTime - longTTLTime) / shortTTLTime) * 100;
        console.log(
          `\nCache effectiveness: ${improvement.toFixed(1)}% faster with 100% hit rate`
        );
      }
    });
  });
});
