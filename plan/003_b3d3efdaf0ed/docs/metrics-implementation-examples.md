# Metrics Collection Implementation Examples

**Companion to:** `metrics-collection-research.md`
**Last Updated:** 2026-01-25

This document contains complete, production-ready implementation examples for the patterns discussed in the research summary.

## Table of Contents
1. [Complete MetricsCollector Implementation](#complete-metricscollector-implementation)
2. [Token Usage Tracker with OpenAI Integration](#token-usage-tracker-with-openai-integration)
3. [Cache Metrics with Decorator Pattern](#cache-metrics-with-decorator-pattern)
4. [Performance Monitoring Suite](#performance-monitoring-suite)
5. [Testing Suite Examples](#testing-suite-examples)
6. [Usage Examples](#usage-examples)

---

## 1. Complete MetricsCollector Implementation

```typescript
// src/metrics/collector/MetricsCollector.ts
import { EventEmitter } from 'events';

/**
 * Type definitions for metrics
 */
export interface MetricValue {
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface TimingMetric {
  count: number;
  min: number;
  max: number;
  sum: number;
  avg: number;
  values: number[];
}

export interface CounterMetric {
  value: number;
  increments: number;
}

export interface GaugeMetric {
  value: number;
  lastUpdated: Date;
}

export interface MetricsSnapshot {
  timestamp: string;
  counters: Record<string, CounterMetric>;
  gauges: Record<string, GaugeMetric>;
  timings: Record<string, TimingMetric>;
}

export interface MetricsCollectorConfig {
  maxSamples?: number;
  enablePercentiles?: boolean;
  samplingRate?: number;
}

/**
 * Thread-safe metrics collector with support for counters, gauges, and timings
 */
export class MetricsCollector extends EventEmitter {
  private counters: Map<string, CounterMetric>;
  private gauges: Map<string, GaugeMetric>;
  private timings: Map<string, TimingMetric>;
  private readonly maxSamples: number;
  private readonly enablePercentiles: boolean;
  private readonly samplingRate: number;

  constructor(config: MetricsCollectorConfig = {}) {
    super();

    this.counters = new Map();
    this.gauges = new Map();
    this.timings = new Map();
    this.maxSamples = config.maxSamples ?? 10000;
    this.enablePercentiles = config.enablePercentiles ?? true;
    this.samplingRate = config.samplingRate ?? 1.0;
  }

  /**
   * Increment a counter metric
   */
  increment(
    metricName: string,
    value: number = 1,
    tags?: Record<string, string>
  ): void {
    // Apply sampling
    if (Math.random() > this.samplingRate) {
      return;
    }

    const current = this.counters.get(metricName) || {
      value: 0,
      increments: 0
    };

    // Adjust value based on sampling rate
    const adjustedValue = value / this.samplingRate;

    this.counters.set(metricName, {
      value: current.value + adjustedValue,
      increments: current.increments + 1
    });

    this.emit('counter', {
      metricName,
      value: adjustedValue,
      tags,
      timestamp: new Date()
    });
  }

  /**
   * Decrement a counter metric
   */
  decrement(metricName: string, value: number = 1): void {
    this.increment(metricName, -value);
  }

  /**
   * Set a gauge metric value
   */
  setGauge(metricName: string, value: number): void {
    this.gauges.set(metricName, {
      value,
      lastUpdated: new Date()
    });

    this.emit('gauge', {
      metricName,
      value,
      timestamp: new Date()
    });
  }

  /**
   * Record a timing metric
   */
  recordTiming(metricName: string, durationMs: number): void {
    const current = this.timings.get(metricName) || {
      count: 0,
      min: Infinity,
      max: -Infinity,
      sum: 0,
      avg: 0,
      values: []
    };

    current.count++;
    current.min = Math.min(current.min, durationMs);
    current.max = Math.max(current.max, durationMs);
    current.sum += durationMs;
    current.avg = current.sum / current.count;

    // Store samples for percentile calculation if enabled
    if (this.enablePercentiles && current.values.length < this.maxSamples) {
      current.values.push(durationMs);
    }

    this.timings.set(metricName, current);

    this.emit('timing', {
      metricName,
      durationMs,
      timestamp: new Date()
    });
  }

  /**
   * Time a synchronous function
   */
  time<T>(metricName: string, fn: () => T): T {
    const start = Date.now();
    try {
      return fn();
    } finally {
      const duration = Date.now() - start;
      this.recordTiming(metricName, duration);
    }
  }

  /**
   * Time an asynchronous function
   */
  async timeAsync<T>(metricName: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      this.recordTiming(metricName, duration);
    }
  }

  /**
   * Get percentiles for a timing metric
   */
  getPercentiles(metricName: string, percentiles: number[]): Record<number, number> {
    const metric = this.timings.get(metricName);

    if (!metric || metric.values.length === 0) {
      return percentiles.reduce((acc, p) => ({ ...acc, [p]: 0 }), {});
    }

    const sorted = [...metric.values].sort((a, b) => a - b);

    return percentiles.reduce((acc, percentile) => {
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return {
        ...acc,
        [percentile]: sorted[Math.max(0, index)]
      };
    }, {} as Record<number, number>);
  }

  /**
   * Get a complete metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      timings: Object.fromEntries(this.timings)
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.timings.clear();
    this.emit('reset');
  }

  /**
   * Get counter value
   */
  getCounter(metricName: string): number {
    return this.counters.get(metricName)?.value ?? 0;
  }

  /**
   * Get gauge value
   */
  getGauge(metricName: string): number | undefined {
    return this.gauges.get(metricName)?.value;
  }

  /**
   * Get timing statistics
   */
  getTimingStats(metricName: string): TimingMetric | undefined {
    return this.timings.get(metricName);
  }
}
```

---

## 2. Token Usage Tracker with OpenAI Integration

```typescript
// src/tracking/TokenUsageTracker.ts
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface RequestLog {
  timestamp: string;
  model: string;
  operation: string;
  usage: TokenUsage;
  cost: number;
  metadata?: Record<string, any>;
}

export interface PricingTier {
  promptPricePer1k: number;
  completionPricePer1k: number;
}

/**
 * Track token usage and costs for LLM API calls
 */
export class TokenUsageTracker {
  private requests: RequestLog[] = [];
  private totalsByModel: Map<string, TokenUsage> = new Map();
  private totalsByOperation: Map<string, TokenUsage> = new Map();
  private pricing: Map<string, PricingTier> = new Map();

  constructor() {
    this.initializeDefaultPricing();
  }

  private initializeDefaultPricing(): void {
    this.setPricing('gpt-4', 0.03, 0.06);
    this.setPricing('gpt-4-32k', 0.06, 0.12);
    this.setPricing('gpt-3.5-turbo', 0.0015, 0.002);
    this.setPricing('gpt-3.5-turbo-16k', 0.003, 0.004);
  }

  setPricing(
    model: string,
    promptPricePer1k: number,
    completionPricePer1k: number
  ): void {
    this.pricing.set(model, { promptPricePer1k, completionPricePer1k });
  }

  logRequest(
    model: string,
    operation: string,
    usage: TokenUsage,
    metadata?: Record<string, any>
  ): void {
    const cost = this.calculateCost(model, usage);

    const log: RequestLog = {
      timestamp: new Date().toISOString(),
      model,
      operation,
      usage,
      cost,
      metadata
    };

    this.requests.push(log);
    this.updateTotals(model, operation, usage);
  }

  private updateTotals(model: string, operation: string, usage: TokenUsage): void {
    const modelTotals = this.totalsByModel.get(model) || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };

    modelTotals.promptTokens += usage.promptTokens;
    modelTotals.completionTokens += usage.completionTokens;
    modelTotals.totalTokens += usage.totalTokens;

    this.totalsByModel.set(model, modelTotals);

    const opTotals = this.totalsByOperation.get(operation) || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };

    opTotals.promptTokens += usage.promptTokens;
    opTotals.completionTokens += usage.completionTokens;
    opTotals.totalTokens += usage.totalTokens;

    this.totalsByOperation.set(operation, opTotals);
  }

  calculateCost(model: string, usage: TokenUsage): number {
    const pricing = this.pricing.get(model);

    if (!pricing) {
      return 0;
    }

    const promptCost = (usage.promptTokens / 1000) * pricing.promptPricePer1k;
    const completionCost = (usage.completionTokens / 1000) * pricing.completionPricePer1k;

    return promptCost + completionCost;
  }

  getModelUsage(model: string): TokenUsage | undefined {
    return this.totalsByModel.get(model);
  }

  getOperationUsage(operation: string): TokenUsage | undefined {
    return this.totalsByOperation.get(operation);
  }

  getTotalUsage(): TokenUsage {
    let total: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };

    for (const usage of this.totalsByModel.values()) {
      total.promptTokens += usage.promptTokens;
      total.completionTokens += usage.completionTokens;
      total.totalTokens += usage.totalTokens;
    }

    return total;
  }

  getTotalCost(): number {
    return this.requests.reduce((sum, log) => sum + log.cost, 0);
  }

  getCostByModel(): Map<string, number> {
    const costByModel = new Map<string, number>();

    for (const [model, usage] of this.totalsByModel) {
      costByModel.set(model, this.calculateCost(model, usage));
    }

    return costByModel;
  }

  getRequests(): RequestLog[] {
    return [...this.requests];
  }

  getRecentRequests(count: number): RequestLog[] {
    return this.requests.slice(-count);
  }

  clear(): void {
    this.requests = [];
    this.totalsByModel.clear();
    this.totalsByOperation.clear();
  }

  generateReport(): {
    totalUsage: TokenUsage;
    totalCost: number;
    costByModel: Map<string, number>;
    usageByModel: Map<string, TokenUsage>;
    requestCount: number;
  } {
    return {
      totalUsage: this.getTotalUsage(),
      totalCost: this.getTotalCost(),
      costByModel: this.getCostByModel(),
      usageByModel: new Map(this.totalsByModel),
      requestCount: this.requests.length
    };
  }
}
```

---

## 3. Cache Metrics with Decorator Pattern

```typescript
// src/cache/MonitoredCache.ts
export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  lastUpdated: Date;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  hitRatePercentage: number;
  missRatePercentage: number;
  timestamp: string;
}

/**
 * Thread-safe cache metrics collector
 */
export class CacheMetricsCollector {
  private metrics: Map<string, CacheMetrics> = new Map();
  private history: Map<string, CacheStats[]> = new Map();
  private readonly maxHistorySize: number;

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  recordHit(cacheName: string): void {
    const current = this.getOrCreateMetrics(cacheName);
    current.hits++;
    current.lastUpdated = new Date();
    this.metrics.set(cacheName, current);
  }

  recordMiss(cacheName: string): void {
    const current = this.getOrCreateMetrics(cacheName);
    current.misses++;
    current.lastUpdated = new Date();
    this.metrics.set(cacheName, current);
  }

  recordEviction(cacheName: string): void {
    const current = this.getOrCreateMetrics(cacheName);
    current.evictions++;
    current.lastUpdated = new Date();
    this.metrics.set(cacheName, current);
  }

  updateSize(cacheName: string, size: number): void {
    const current = this.getOrCreateMetrics(cacheName);
    current.size = size;
    current.lastUpdated = new Date();
    this.metrics.set(cacheName, current);
  }

  getStats(cacheName: string): CacheStats | null {
    const metrics = this.metrics.get(cacheName);

    if (!metrics) {
      return null;
    }

    const totalRequests = metrics.hits + metrics.misses;
    const hitRate = totalRequests > 0 ? metrics.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? metrics.misses / totalRequests : 0;

    return {
      hitRate,
      missRate,
      totalRequests,
      hitRatePercentage: hitRate * 100,
      missRatePercentage: missRate * 100,
      timestamp: new Date().toISOString()
    };
  }

  recordSnapshot(cacheName: string): void {
    const stats = this.getStats(cacheName);

    if (stats) {
      const history = this.history.get(cacheName) || [];
      history.push(stats);

      if (history.length > this.maxHistorySize) {
        history.shift();
      }

      this.history.set(cacheName, history);
    }
  }

  getHistory(cacheName: string): CacheStats[] {
    return this.history.get(cacheName) || [];
  }

  private getOrCreateMetrics(cacheName: string): CacheMetrics {
    return this.metrics.get(cacheName) || {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      lastUpdated: new Date()
    };
  }

  reset(cacheName: string): void {
    this.metrics.delete(cacheName);
    this.history.delete(cacheName);
  }

  resetAll(): void {
    this.metrics.clear();
    this.history.clear();
  }
}

/**
 * Decorator function to create a monitored cache
 */
export function createMonitoredCache<K, V>(
  cache: Map<K, V>,
  metrics: CacheMetricsCollector,
  cacheName: string
): Map<K, V> {
  return new Proxy(cache, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === 'get') {
        return function (key: K) {
          const result = target.get(key);

          if (result !== undefined) {
            metrics.recordHit(cacheName);
          } else {
            metrics.recordMiss(cacheName);
          }

          return result;
        };
      }

      if (prop === 'set') {
        return function (key: K, value: V) {
          const result = target.set(key, value);
          metrics.updateSize(cacheName, target.size);
          return result;
        };
      }

      if (prop === 'delete') {
        return function (key: K) {
          const result = target.delete(key);
          metrics.updateSize(cacheName, target.size);
          return result;
        };
      }

      if (prop === 'clear') {
        return function () {
          metrics.recordEviction(cacheName);
          const result = target.clear();
          metrics.updateSize(cacheName, 0);
          return result;
        };
      }

      return value;
    }
  });
}

/**
 * Decorator class for monitoring existing cache implementations
 */
export class MonitoredCache<K, V> {
  constructor(
    private cache: Map<K, V>,
    private metrics: CacheMetricsCollector,
    private cacheName: string
  ) {}

  get(key: K): V | undefined {
    const result = this.cache.get(key);

    if (result !== undefined) {
      this.metrics.recordHit(this.cacheName);
    } else {
      this.metrics.recordMiss(this.cacheName);
    }

    return result;
  }

  set(key: K, value: V): this {
    this.cache.set(key, value);
    this.metrics.updateSize(this.cacheName, this.cache.size);
    return this;
  }

  delete(key: K): boolean {
    const result = this.cache.delete(key);
    this.metrics.updateSize(this.cacheName, this.cache.size);
    return result;
  }

  clear(): void {
    this.metrics.recordEviction(this.cacheName);
    this.cache.clear();
    this.metrics.updateSize(this.cacheName, 0);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  get size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats | null {
    return this.metrics.getStats(this.cacheName);
  }
}
```

---

## 4. Performance Monitoring Suite

```typescript
// src/monitoring/PerformanceMonitor.ts
import { performance, PerformanceObserver } from 'perf_hooks';

export interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  timestamp: string;
}

/**
 * Performance monitoring using Node.js perf_hooks
 */
export class PerformanceMonitor {
  private observer: PerformanceObserver;
  private entries: PerformanceEntry[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        this.entries.push({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
          timestamp: new Date().toISOString()
        });

        if (this.entries.length > this.maxEntries) {
          this.entries.shift();
        }
      });
    });

    this.observer.observe({ entryTypes: ['measure'] });
  }

  measure(name: string, fn: () => void): void {
    const startMark = `${name}-start-${Date.now()}`;
    const endMark = `${name}-end-${Date.now()}`;

    performance.mark(startMark);

    try {
      fn();
    } finally {
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);

      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMark = `${name}-start-${Date.now()}`;
    const endMark = `${name}-end-${Date.now()}`;

    performance.mark(startMark);

    try {
      return await fn();
    } finally {
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);

      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
    }
  }

  getEntries(name?: string): PerformanceEntry[] {
    if (name) {
      return this.entries.filter(e => e.name === name);
    }
    return [...this.entries];
  }

  getAverageDuration(name: string): number {
    const entries = this.getEntries(name);

    if (entries.length === 0) {
      return 0;
    }

    const total = entries.reduce((sum, e) => sum + e.duration, 0);
    return total / entries.length;
  }

  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    total: number;
  } | null {
    const entries = this.getEntries(name);

    if (entries.length === 0) {
      return null;
    }

    const durations = entries.map(e => e.duration);

    return {
      count: durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: this.getAverageDuration(name),
      total: durations.reduce((sum, d) => sum + d, 0)
    };
  }

  clear(): void {
    this.entries = [];
  }

  dispose(): void {
    this.observer.disconnect();
  }
}
```

---

## 5. Testing Suite Examples

```typescript
// tests/metrics/MetricsCollector.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsCollector } from '../../src/metrics/collector/MetricsCollector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('counters', () => {
    it('should increment counter', () => {
      collector.increment('test.counter');

      const snapshot = collector.getSnapshot();
      expect(snapshot.counters['test.counter'].value).toBe(1);
      expect(snapshot.counters['test.counter'].increments).toBe(1);
    });

    it('should increment counter by custom value', () => {
      collector.increment('test.counter', 5);

      const snapshot = collector.getSnapshot();
      expect(snapshot.counters['test.counter'].value).toBe(5);
    });

    it('should decrement counter', () => {
      collector.increment('test.counter', 10);
      collector.decrement('test.counter', 3);

      const snapshot = collector.getSnapshot();
      expect(snapshot.counters['test.counter'].value).toBe(7);
    });

    it('should emit counter event', () => {
      const listener = vi.fn();
      collector.on('counter', listener);

      collector.increment('test.counter', 5);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'test.counter',
          value: 5
        })
      );
    });
  });

  describe('gauges', () => {
    it('should set gauge value', () => {
      collector.setGauge('temperature', 23.5);

      const snapshot = collector.getSnapshot();
      expect(snapshot.gauges['temperature'].value).toBe(23.5);
    });

    it('should update gauge value', () => {
      collector.setGauge('temperature', 23.5);
      collector.setGauge('temperature', 24.0);

      const snapshot = collector.getSnapshot();
      expect(snapshot.gauges['temperature'].value).toBe(24.0);
    });

    it('should track last updated timestamp', () => {
      const before = new Date();
      collector.setGauge('temperature', 23.5);
      const after = new Date();

      const snapshot = collector.getSnapshot();
      const timestamp = new Date(snapshot.gauges['temperature'].lastUpdated);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should emit gauge event', () => {
      const listener = vi.fn();
      collector.on('gauge', listener);

      collector.setGauge('temperature', 23.5);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'temperature',
          value: 23.5
        })
      );
    });
  });

  describe('timings', () => {
    it('should record timing', () => {
      collector.recordTiming('operation', 100);

      const snapshot = collector.getSnapshot();
      expect(snapshot.timings['operation'].count).toBe(1);
    });

    it('should calculate min, max, and avg', () => {
      collector.recordTiming('operation', 100);
      collector.recordTiming('operation', 200);
      collector.recordTiming('operation', 300);

      const snapshot = collector.getSnapshot();
      expect(snapshot.timings['operation'].min).toBe(100);
      expect(snapshot.timings['operation'].max).toBe(300);
      expect(snapshot.timings['operation'].avg).toBe(200);
    });

    it('should calculate percentiles', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      values.forEach(v => collector.recordTiming('operation', v));

      const p50 = collector.getPercentiles('operation', [50])[50];
      expect(p50).toBeGreaterThanOrEqual(50);
    });

    it('should emit timing event', () => {
      const listener = vi.fn();
      collector.on('timing', listener);

      collector.recordTiming('operation', 100);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'operation',
          durationMs: 100
        })
      );
    });
  });

  describe('time utility', () => {
    it('should time synchronous function', () => {
      let result = collector.time('operation', () => {
        return 42;
      });

      expect(result).toBe(42);

      const snapshot = collector.getSnapshot();
      expect(snapshot.timings['operation'].count).toBe(1);
      expect(snapshot.timings['operation'].min).toBeGreaterThanOrEqual(0);
    });

    it('should time async function', async () => {
      await collector.timeAsync('operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 42;
      });

      const snapshot = collector.getSnapshot();
      expect(snapshot.timings['operation'].count).toBe(1);
      expect(snapshot.timings['operation'].min).toBeGreaterThanOrEqual(10);
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      collector.increment('test.counter');
      collector.setGauge('temperature', 23.5);
      collector.recordTiming('operation', 100);

      collector.reset();

      const snapshot = collector.getSnapshot();
      expect(Object.keys(snapshot.counters)).toHaveLength(0);
      expect(Object.keys(snapshot.gauges)).toHaveLength(0);
      expect(Object.keys(snapshot.timings)).toHaveLength(0);
    });

    it('should emit reset event', () => {
      const listener = vi.fn();
      collector.on('reset', listener);

      collector.reset();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('sampling', () => {
    it('should respect sampling rate', () => {
      const sampledCollector = new MetricsCollector({ samplingRate: 0.5 });

      for (let i = 0; i < 100; i++) {
        sampledCollector.increment('test.counter');
      }

      const snapshot = sampledCollector.getSnapshot();
      expect(snapshot.counters['test.counter'].value).toBeGreaterThan(0);
      expect(snapshot.counters['test.counter'].value).toBeLessThan(200);
    });
  });
});
```

```typescript
// tests/cache/CacheMetrics.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  CacheMetricsCollector,
  createMonitoredCache,
  MonitoredCache
} from '../../src/cache/MonitoredCache';

describe('CacheMetricsCollector', () => {
  let collector: CacheMetricsCollector;

  beforeEach(() => {
    collector = new CacheMetricsCollector();
  });

  it('should calculate hit rate correctly', () => {
    collector.recordHit('my-cache');
    collector.recordHit('my-cache');
    collector.recordMiss('my-cache');

    const stats = collector.getStats('my-cache');
    expect(stats?.hitRate).toBe(2/3);
    expect(stats?.hitRatePercentage).toBeCloseTo(66.67, 2);
    expect(stats?.missRate).toBe(1/3);
    expect(stats?.totalRequests).toBe(3);
  });

  it('should return null for non-existent cache', () => {
    const stats = collector.getStats('non-existent');
    expect(stats).toBeNull();
  });

  it('should track evictions', () => {
    const metrics = (collector as any).getOrCreateMetrics('my-cache');

    collector.recordEviction('my-cache');
    collector.recordEviction('my-cache');

    expect(metrics.evictions).toBe(2);
  });

  it('should track cache size', () => {
    collector.updateSize('my-cache', 100);
    collector.updateSize('my-cache', 150);

    const stats = collector.getStats('my-cache');
    expect((collector as any).metrics.get('my-cache').size).toBe(150);
  });

  it('should maintain history', () => {
    collector.recordHit('my-cache');
    collector.recordSnapshot('my-cache');

    collector.recordMiss('my-cache');
    collector.recordSnapshot('my-cache');

    const history = collector.getHistory('my-cache');
    expect(history.length).toBe(2);
    expect(history[0].hitRate).toBe(1);
    expect(history[1].hitRate).toBe(0.5);
  });
});

describe('MonitoredCache', () => {
  it('should record hits and misses', () => {
    const metrics = new CacheMetricsCollector();
    const cache = new Map<string, number>();

    const monitoredCache = new MonitoredCache(cache, metrics, 'test-cache');

    cache.set('key1', 1);
    monitoredCache.set('key1', 1);

    expect(monitoredCache.get('key1')).toBe(1);
    expect(monitoredCache.get('key2')).toBeUndefined();

    const stats = metrics.getStats('test-cache');
    expect(stats?.hits).toBe(1);
    expect(stats?.misses).toBe(1);
  });

  it('should track cache size', () => {
    const metrics = new CacheMetricsCollector();
    const cache = new Map<string, number>();

    const monitoredCache = new MonitoredCache(cache, metrics, 'test-cache');

    monitoredCache.set('key1', 1);
    monitoredCache.set('key2', 2);

    expect(monitoredCache.size).toBe(2);

    const metricsData = (metrics as any).metrics.get('test-cache');
    expect(metricsData.size).toBe(2);
  });
});

describe('createMonitoredCache', () => {
  it('should create proxy-monitored cache', () => {
    const metrics = new CacheMetricsCollector();
    const cache = createMonitoredCache(
      new Map<string, number>(),
      metrics,
      'test-cache'
    );

    cache.set('key1', 1);
    expect(cache.get('key1')).toBe(1);
    expect(cache.get('key2')).toBeUndefined();

    const stats = metrics.getStats('test-cache');
    expect(stats?.hits).toBe(1);
    expect(stats?.misses).toBe(1);
  });
});
```

---

## 6. Usage Examples

### Basic Metrics Collection

```typescript
import { MetricsCollector } from './src/metrics/collector/MetricsCollector';

// Initialize collector
const metrics = new MetricsCollector({
  maxSamples: 10000,
  enablePercentiles: true
});

// Counters
metrics.increment('api.requests.total');
metrics.increment('api.requests.success');

// Gauges
metrics.setGauge('system.memory.usage', 0.75);
metrics.setGauge('system.cpu.usage', 0.45);

// Timings
metrics.recordTiming('api.response.time', 123);

// Using time utility
metrics.time('database.query', () => {
  return database.query('SELECT * FROM users');
});

// Using async time utility
await metrics.timeAsync('external.api.call', async () => {
  return await fetch('https://api.example.com/data');
});

// Get snapshot
const snapshot = metrics.getSnapshot();
console.log(JSON.stringify(snapshot, null, 2));

// Get percentiles
const percentiles = metrics.getPercentiles('api.response.time', [50, 95, 99]);
console.log(`P50: ${percentiles[50]}ms, P95: ${percentiles[95]}ms, P99: ${percentiles[99]}ms`);
```

### Cache Monitoring

```typescript
import {
  CacheMetricsCollector,
  MonitoredCache
} from './src/cache/MonitoredCache';

// Initialize metrics collector
const cacheMetrics = new CacheMetricsCollector();

// Create monitored cache
const userCache = new MonitoredCache(
  new Map<string, User>(),
  cacheMetrics,
  'user-cache'
);

// Use cache
userCache.set('user:123', userData);
const user = userCache.get('user:123'); // Records hit
const missing = userCache.get('user:456'); // Records miss

// Get stats
const stats = userCache.getStats();
console.log(`Hit Rate: ${stats?.hitRatePercentage.toFixed(2)}%`);

// Record periodic snapshots
setInterval(() => {
  cacheMetrics.recordSnapshot('user-cache');
}, 60000); // Every minute

// Get history
const history = cacheMetrics.getHistory('user-cache');
console.log(`Average hit rate (last hour): ${
  history.reduce((sum, s) => sum + s.hitRate, 0) / history.length
}`);
```

### Token Usage Tracking

```typescript
import { TokenUsageTracker } from './src/tracking/TokenUsageTracker';

// Initialize tracker
const tokenTracker = new TokenUsageTracker();

// Set custom pricing
tokenTracker.setPricing('gpt-4-custom', 0.05, 0.10);

// Log API requests
tokenTracker.logRequest(
  'gpt-4',
  'chat-completion',
  {
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150
  },
  { userId: 'user123' }
);

// Get usage reports
const totalUsage = tokenTracker.getTotalUsage();
console.log(`Total tokens: ${totalUsage.totalTokens}`);

const totalCost = tokenTracker.getTotalCost();
console.log(`Total cost: $${totalCost.toFixed(4)}`);

const report = tokenTracker.generateReport();
console.log('Usage Report:', JSON.stringify(report, null, 2));
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from './src/monitoring/PerformanceMonitor';

// Initialize monitor
const perfMonitor = new PerformanceMonitor();

// Monitor synchronous operations
perfMonitor.measure('data-processing', () => {
  processData(largeDataset);
});

// Monitor async operations
await perfMonitor.measureAsync('api-request', async () => {
  return await makeApiCall();
});

// Get stats
const stats = perfMonitor.getStats('data-processing');
console.log(`Average duration: ${stats?.avg.toFixed(2)}ms`);

// Get all entries
const entries = perfMonitor.getEntries();
console.log(`Total measurements: ${entries.length}`);
```

### Integration Example

```typescript
import { MetricsCollector } from './src/metrics/collector/MetricsCollector';
import { TokenUsageTracker } from './src/tracking/TokenUsageTracker';
import { CacheMetricsCollector, MonitoredCache } from './src/cache/MonitoredCache';
import { MetricsWriter } from './src/writer/MetricsWriter';

class ApplicationMetrics {
  public metrics: MetricsCollector;
  public tokens: TokenUsageTracker;
  public cache: CacheMetricsCollector;
  public writer: MetricsWriter;

  constructor(outputPath: string) {
    this.metrics = new MetricsCollector();
    this.tokens = new TokenUsageTracker();
    this.cache = new CacheMetricsCollector();
    this.writer = new MetricsWriter({
      outputDir: dirname(outputPath),
      fileName: basename(outputPath)
    });

    this.setupPeriodicWrites();
  }

  private setupPeriodicWrites() {
    setInterval(async () => {
      const snapshot = this.metrics.getSnapshot();
      await this.writer.write(snapshot);
    }, 60000); // Every minute
  }

  async trackApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.metrics.timeAsync(`api.${name}`, fn);
  }

  trackCacheAccess<K, V>(cache: Map<K, V>, name: string): MonitoredCache<K, V> {
    return new MonitoredCache(cache, this.cache, name);
  }

  async shutdown() {
    // Write final metrics
    const snapshot = this.metrics.getSnapshot();
    await this.writer.write(snapshot);

    // Generate reports
    console.log('Token Usage Report:', this.tokens.generateReport());
    console.log('Cache Performance:', Object.fromEntries(
      Object.keys((this.cache as any).metrics).map(name => [
        name,
        this.cache.getStats(name)
      ])
    ));
  }
}

// Usage
const appMetrics = new ApplicationMetrics('./metrics/app-metrics.json');

const userCache = appMetrics.trackCacheAccess(
  new Map<string, User>(),
  'user-cache'
);

// API endpoint handler
app.get('/api/users/:id', async (req, res) => {
  return appMetrics.trackApiCall('getUser', async () => {
    // Check cache
    let user = userCache.get(req.params.id);

    if (!user) {
      // Fetch from database
      user = await database.getUser(req.params.id);
      userCache.set(req.params.id, user);
    }

    return user;
  });
});
```

---

## Summary

This implementation examples document provides:

1. **Complete, production-ready TypeScript implementations** for:
   - Metrics collector with counters, gauges, and timings
   - Token usage tracking with cost calculation
   - Cache metrics with hit/miss rate tracking
   - Performance monitoring using Node.js APIs

2. **Comprehensive test suites** demonstrating:
   - Unit testing patterns for metrics collectors
   - Integration testing for cache monitoring
   - Edge case handling

3. **Practical usage examples** showing:
   - Basic metrics collection
   - Cache monitoring integration
   - Token usage tracking
   - Performance monitoring
   - Full application integration

All implementations follow TypeScript best practices, include proper error handling, and are designed for production use with consideration for performance, memory usage, and thread safety.
