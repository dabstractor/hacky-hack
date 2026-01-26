# TypeScript/Node.js Metrics Collection Patterns - Research Summary

**Research Date:** 2026-01-25
**Status:** Comprehensive compilation of industry best practices and implementation patterns

## Table of Contents

1. [Metrics Collector Class Implementation](#1-metrics-collector-class-implementation)
2. [Timing Metrics and Percentiles](#2-timing-metrics-and-percentiles)
3. [Memory and Resource Usage Monitoring](#3-memory-and-resource-usage-monitoring)
4. [JSON Metrics File Writing](#4-json-metrics-file-writing)
5. [Token Usage Tracking for LLM Applications](#5-token-usage-tracking-for-llm-applications)
6. [Cache Hit/Miss Rate Calculation](#6-cache-hitmiss-rate-calculation)
7. [Testing Approaches for Metrics Collectors](#7-testing-approaches-for-metrics-collectors)
8. [Performance Considerations](#8-performance-considerations)
9. [References and Further Reading](#9-references-and-further-reading)

---

## 1. Metrics Collector Class Implementation

### 1.1 Basic Metrics Collector Pattern

A well-designed metrics collector should be:

- **Type-safe** with comprehensive TypeScript interfaces
- **Thread-safe** for concurrent operations
- **Extensible** for custom metric types
- **Performant** with minimal overhead

```typescript
// interfaces/metrics.ts
interface MetricValue {
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface TimingMetric {
  count: number;
  min: number;
  max: number;
  sum: number;
  avg: number;
  values: number[];
}

interface CounterMetric {
  value: number;
  increments: number;
}

interface GaugeMetric {
  value: number;
  lastUpdated: Date;
}

interface MetricsSnapshot {
  timestamp: string;
  counters: Record<string, CounterMetric>;
  gauges: Record<string, GaugeMetric>;
  timings: Record<string, TimingMetric>;
}
```

### 1.2 Core Metrics Collector Class

```typescript
// collector/MetricsCollector.ts
import { EventEmitter } from 'events';

export class MetricsCollector extends EventEmitter {
  private counters: Map<string, CounterMetric>;
  private gauges: Map<string, GaugeMetric>;
  private timings: Map<string, TimingMetric>;
  private maxSamples: number;

  constructor(config: { maxSamples?: number } = {}) {
    super();
    this.counters = new Map();
    this.gauges = new Map();
    this.timings = new Map();
    this.maxSamples = config.maxSamples || 10000;
  }

  // Counter operations
  increment(
    metricName: string,
    value: number = 1,
    tags?: Record<string, string>
  ): void {
    const current = this.counters.get(metricName) || {
      value: 0,
      increments: 0,
    };
    this.counters.set(metricName, {
      value: current.value + value,
      increments: current.increments + 1,
    });
    this.emit('counter', { metricName, value, tags });
  }

  decrement(metricName: string, value: number = 1): void {
    this.increment(metricName, -value);
  }

  // Gauge operations
  setGauge(metricName: string, value: number): void {
    this.gauges.set(metricName, {
      value,
      lastUpdated: new Date(),
    });
    this.emit('gauge', { metricName, value });
  }

  // Timing operations
  recordTiming(metricName: string, durationMs: number): void {
    const current = this.timings.get(metricName) || {
      count: 0,
      min: Infinity,
      max: -Infinity,
      sum: 0,
      avg: 0,
      values: [],
    };

    current.count++;
    current.min = Math.min(current.min, durationMs);
    current.max = Math.max(current.max, durationMs);
    current.sum += durationMs;
    current.avg = current.sum / current.count;

    // Store samples for percentile calculation
    if (current.values.length < this.maxSamples) {
      current.values.push(durationMs);
    }

    this.timings.set(metricName, current);
    this.emit('timing', { metricName, durationMs });
  }

  // Timer utility
  time<T>(metricName: string, fn: () => T): T {
    const start = Date.now();
    try {
      return fn();
    } finally {
      const duration = Date.now() - start;
      this.recordTiming(metricName, duration);
    }
  }

  // Async timer utility
  async timeAsync<T>(metricName: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      this.recordTiming(metricName, duration);
    }
  }

  // Get metrics snapshot
  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      timings: Object.fromEntries(this.timings),
    };
  }

  // Reset all metrics
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.timings.clear();
    this.emit('reset');
  }
}
```

### 1.3 Singleton Pattern for Global Metrics

```typescript
// collector/MetricsManager.ts
export class MetricsManager {
  private static instance: MetricsCollector;

  static getInstance(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector({
        maxSamples: parseInt(process.env.METRICS_MAX_SAMPLES || '10000'),
      });
    }
    return this.instance;
  }
}

// Usage
const metrics = MetricsManager.getInstance();
metrics.increment('requests.total');
metrics.time('db.query', () => database.query('SELECT * FROM users'));
```

---

## 2. Timing Metrics and Percentiles

### 2.1 Percentile Calculation Strategies

#### Strategy 1: Exact Percentiles (for small datasets)

```typescript
class ExactPercentileCalculator {
  static calculate(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  static getStats(values: number[]) {
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: this.calculate(sorted, 50),
      p95: this.calculate(sorted, 95),
      p99: this.calculate(sorted, 99),
    };
  }
}
```

#### Strategy 2: Reservoir Sampling (for large datasets)

```typescript
class ReservoirSampler {
  private reservoir: number[] = [];
  private readonly maxSize: number;
  private count = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  sample(value: number): void {
    this.count++;

    if (this.reservoir.length < this.maxSize) {
      this.reservoir.push(value);
    } else {
      // Replace random element with decreasing probability
      const probability = this.maxSize / this.count;
      if (Math.random() < probability) {
        const index = Math.floor(Math.random() * this.maxSize);
        this.reservoir[index] = value;
      }
    }
  }

  getPercentile(percentile: number): number {
    if (this.reservoir.length === 0) return 0;
    const sorted = [...this.reservoir].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  reset(): void {
    this.reservoir = [];
    this.count = 0;
  }
}
```

#### Strategy 3: T-Digest (for production systems)

For production systems with high-volume metrics, consider using the T-Digest algorithm:

- Library: `tdigest` (npm package)
- Provides accurate percentiles with bounded memory
- Suitable for streaming data

```typescript
import TDigest from 'tdigest';

class TDigestTimingMetric {
  private digest: TDigest;
  private count: number = 0;
  private min: number = Infinity;
  private max: number = -Infinity;

  constructor() {
    this.digest = new TDigest();
  }

  record(value: number): void {
    this.digest.push(value);
    this.count++;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
  }

  getPercentile(percentile: number): number {
    return this.digest.percentile(percentile);
  }

  getStats() {
    return {
      count: this.count,
      min: this.min === Infinity ? 0 : this.min,
      max: this.max === -Infinity ? 0 : this.max,
      p50: this.getPercentile(50),
      p90: this.getPercentile(90),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
    };
  }
}
```

### 2.2 Using Node.js Performance Hooks

```typescript
import { PerformanceObserver, performance } from 'perf_hooks';

class PerformanceMonitor {
  private observer: PerformanceObserver;

  constructor() {
    this.observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        // Process performance entries
        console.log(`${entry.name}: ${entry.duration}ms`);
      });
    });

    this.observer.observe({ entryTypes: ['measure', 'mark'] });
  }

  measure(name: string, fn: () => void): void {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    performance.mark(startMark);
    try {
      fn();
    } finally {
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);

      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

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

  dispose(): void {
    this.observer.disconnect();
  }
}
```

---

## 3. Memory and Resource Usage Monitoring

### 3.1 Memory Monitoring Implementation

```typescript
// monitoring/MemoryMonitor.ts
import { memoryUsage } from 'process';

interface MemoryStats {
  timestamp: string;
  rss: number; // Resident Set Size
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  usagePercentage: number;
}

export class MemoryMonitor {
  private samples: MemoryStats[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private readonly maxSamples: number;

  constructor(config: { maxSamples?: number } = {}) {
    this.maxSamples = config.maxSamples || 1000;
  }

  start(intervalMs: number = 5000): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.record();
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  record(): MemoryStats {
    const usage = memoryUsage();
    const stats: MemoryStats = {
      timestamp: new Date().toISOString(),
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      usagePercentage: (usage.heapUsed / usage.heapTotal) * 100,
    };

    this.samples.push(stats);

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    return stats;
  }

  getStats(): {
    current: MemoryStats;
    peak: MemoryStats;
    average: Partial<MemoryStats>;
  } {
    if (this.samples.length === 0) {
      this.record();
    }

    const current = this.samples[this.samples.length - 1];
    const peak = this.samples.reduce(
      (max, sample) => (sample.heapUsed > max.heapUsed ? sample : max),
      this.samples[0]
    );

    const average = {
      rss: this.average(this.samples.map(s => s.rss)),
      heapUsed: this.average(this.samples.map(s => s.heapUsed)),
      usagePercentage: this.average(this.samples.map(s => s.usagePercentage)),
    };

    return { current, peak, average };
  }

  private average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  clear(): void {
    this.samples = [];
  }
}
```

### 3.2 V8 Heap Statistics

```typescript
// monitoring/V8Monitor.ts
import { getHeapStatistics, getHeapSpaceStatistics } from 'v8';

interface V8HeapStats {
  timestamp: string;
  totalHeapSize: number;
  totalHeapSizeExecutable: number;
  totalPhysicalSize: number;
  totalAvailableSize: number;
  usedHeapSize: number;
  heapSizeLimit: number;
  mallocedMemory: number;
  peakMallocedMemory: number;
  doesZapGarbage: number;
  spaces: HeapSpaceStats[];
}

interface HeapSpaceStats {
  name: string;
  size: number;
  used: number;
  available: number;
  physicalSize: number;
}

export class V8Monitor {
  static getHeapStats(): V8HeapStats {
    const heapStats = getHeapStatistics();
    const spaceStats = getHeapSpaceStatistics();

    return {
      timestamp: new Date().toISOString(),
      totalHeapSize: heapStats.total_heap_size,
      totalHeapSizeExecutable: heapStats.total_heap_size_executable,
      totalPhysicalSize: heapStats.total_physical_size,
      totalAvailableSize: heapStats.total_available_size,
      usedHeapSize: heapStats.used_heap_size,
      heapSizeLimit: heapStats.heap_size_limit,
      mallocedMemory: heapStats.malloced_memory,
      peakMallocedMemory: heapStats.peak_malloced_memory,
      doesZapGarbage: heapStats.does_zap_garbage,
      spaces: spaceStats.map(space => ({
        name: space.space_name,
        size: space.space_size,
        used: space.space_used_size,
        available: space.space_available_size,
        physicalSize: space.physical_space_size,
      })),
    };
  }

  static getMemoryUsagePercentage(): number {
    const stats = this.getHeapStats();
    return (stats.usedHeapSize / stats.heapSizeLimit) * 100;
  }

  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
```

### 3.3 Event Loop Monitoring

```typescript
// monitoring/EventLoopMonitor.ts
import { setImmediate } from 'timers';

interface EventLoopStats {
  maxLag: number;
  avgLag: number;
  samples: number;
}

export class EventLoopMonitor {
  private lagSamples: number[] = [];
  private running = false;
  private intervalMs: number;
  private maxSamples: number;

  constructor(config: { intervalMs?: number; maxSamples?: number } = {}) {
    this.intervalMs = config.intervalMs || 1000;
    this.maxSamples = config.maxSamples || 100;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
  }

  private scheduleNext(): void {
    if (!this.running) return;

    const start = Date.now();

    setImmediate(() => {
      const lag = Date.now() - start;
      this.recordLag(lag);
      setTimeout(() => this.scheduleNext(), this.intervalMs);
    });
  }

  private recordLag(lag: number): void {
    this.lagSamples.push(lag);

    if (this.lagSamples.length > this.maxSamples) {
      this.lagSamples.shift();
    }
  }

  getStats(): EventLoopStats {
    if (this.lagSamples.length === 0) {
      return { maxLag: 0, avgLag: 0, samples: 0 };
    }

    const maxLag = Math.max(...this.lagSamples);
    const avgLag =
      this.lagSamples.reduce((a, b) => a + b, 0) / this.lagSamples.length;

    return {
      maxLag,
      avgLag,
      samples: this.lagSamples.length,
    };
  }

  reset(): void {
    this.lagSamples = [];
  }
}
```

---

## 4. JSON Metrics File Writing

### 4.1 Thread-Safe Metrics Writer

```typescript
// writer/MetricsWriter.ts
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export class MetricsWriter {
  private filePath: string;
  private writeQueue: Array<() => Promise<void>> = [];
  private processing = false;

  constructor(config: { outputDir: string; fileName: string }) {
    this.filePath = join(config.outputDir, config.fileName);
  }

  async write(metrics: MetricsSnapshot): Promise<void> {
    const task = async () => {
      await this.ensureDirectory();
      const json = JSON.stringify(metrics, null, 2);
      await writeFile(this.filePath, json, 'utf8');
    };

    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  async append(metricData: any): Promise<void> {
    const task = async () => {
      await this.ensureDirectory();

      let existingData: any[] = [];
      if (existsSync(this.filePath)) {
        try {
          const content = await readFile(this.filePath, 'utf8');
          existingData = JSON.parse(content);
          if (!Array.isArray(existingData)) {
            existingData = [existingData];
          }
        } catch {
          existingData = [];
        }
      }

      existingData.push(metricData);
      await writeFile(
        this.filePath,
        JSON.stringify(existingData, null, 2),
        'utf8'
      );
    };

    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.writeQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.writeQueue.length > 0) {
      const task = this.writeQueue.shift();
      if (task) {
        await task();
      }
    }

    this.processing = false;
  }

  private async ensureDirectory(): Promise<void> {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}
```

### 4.2 Rolling File Writer

```typescript
// writer/RollingMetricsWriter.ts
import { writeFile, rename } from 'fs/promises';
import { join } from 'path';

export class RollingMetricsWriter {
  private basePath: string;
  private maxSize: number;
  private maxFiles: number;
  private currentSize = 0;
  private currentFileIndex = 0;

  constructor(config: {
    outputDir: string;
    baseFileName: string;
    maxSize?: number; // bytes
    maxFiles?: number;
  }) {
    this.basePath = join(config.outputDir, config.baseFileName);
    this.maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB default
    this.maxFiles = config.maxFiles || 10;
  }

  async write(metrics: MetricsSnapshot): Promise<void> {
    const json = JSON.stringify(metrics, null, 2);
    const size = Buffer.byteLength(json, 'utf8');

    // Check if we need to roll
    if (this.currentSize > 0 && this.currentSize + size > this.maxSize) {
      await this.rollFile();
    }

    const filePath = this.getCurrentFilePath();
    await writeFile(filePath, json, 'utf8');
    this.currentSize += size;
  }

  private async rollFile(): Promise<void> {
    // Delete oldest file if we exceed maxFiles
    const oldestFile = `${this.basePath}.${this.maxFiles}.json`;
    try {
      await unlink(oldestFile);
    } catch {
      // File doesn't exist, ignore
    }

    // Rename existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile =
        i === 1 ? `${this.basePath}.json` : `${this.basePath}.${i}.json`;
      const newFile = `${this.basePath}.${i + 1}.json`;

      try {
        await rename(oldFile, newFile);
      } catch {
        // File doesn't exist, ignore
      }
    }

    this.currentFileIndex++;
    this.currentSize = 0;
  }

  private getCurrentFilePath(): string {
    return this.currentFileIndex === 0
      ? `${this.basePath}.json`
      : `${this.basePath}.${this.currentFileIndex}.json`;
  }
}
```

### 4.3 Atomic Write Pattern

```typescript
// writer/AtomicMetricsWriter.ts
import { writeFile, rename, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export class AtomicMetricsWriter {
  private filePath: string;

  constructor(outputPath: string) {
    this.filePath = outputPath;
  }

  async write(metrics: MetricsSnapshot): Promise<void> {
    const tempFilePath = `${this.filePath}.${randomUUID()}.tmp`;
    const json = JSON.stringify(metrics, null, 2);

    try {
      // Write to temporary file
      await writeFile(tempFilePath, json, 'utf8');

      // Atomic rename
      await rename(tempFilePath, this.filePath);
    } catch (error) {
      // Cleanup temp file on error
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore
      }
      throw error;
    }
  }

  async read(): Promise<MetricsSnapshot | null> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
```

---

## 5. Token Usage Tracking for LLM Applications

### 5.1 Token Usage Tracker

```typescript
// tracking/TokenUsageTracker.ts
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface RequestLog {
  timestamp: string;
  model: string;
  operation: string;
  usage: TokenUsage;
  metadata?: Record<string, any>;
}

export class TokenUsageTracker {
  private requests: RequestLog[] = [];
  private totalsByModel: Map<string, TokenUsage> = new Map();
  private totalsByOperation: Map<string, TokenUsage> = new Map();

  logRequest(
    model: string,
    operation: string,
    usage: TokenUsage,
    metadata?: Record<string, any>
  ): void {
    const log: RequestLog = {
      timestamp: new Date().toISOString(),
      model,
      operation,
      usage,
      metadata,
    };

    this.requests.push(log);
    this.updateTotals(model, operation, usage);
  }

  private updateTotals(
    model: string,
    operation: string,
    usage: TokenUsage
  ): void {
    // Update model totals
    const modelTotals = this.totalsByModel.get(model) || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    modelTotals.promptTokens += usage.promptTokens;
    modelTotals.completionTokens += usage.completionTokens;
    modelTotals.totalTokens += usage.totalTokens;
    this.totalsByModel.set(model, modelTotals);

    // Update operation totals
    const opTotals = this.totalsByOperation.get(operation) || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    opTotals.promptTokens += usage.promptTokens;
    opTotals.completionTokens += usage.completionTokens;
    opTotals.totalTokens += usage.totalTokens;
    this.totalsByOperation.set(operation, opTotals);
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
      totalTokens: 0,
    };

    for (const usage of this.totalsByModel.values()) {
      total.promptTokens += usage.promptTokens;
      total.completionTokens += usage.completionTokens;
      total.totalTokens += usage.totalTokens;
    }

    return total;
  }

  getRequests(): RequestLog[] {
    return [...this.requests];
  }

  clear(): void {
    this.requests = [];
    this.totalsByModel.clear();
    this.totalsByOperation.clear();
  }
}
```

### 5.2 OpenAI API Wrapper with Token Tracking

```typescript
// tracking/OpenAIMetricsWrapper.ts
import { OpenAI } from 'openai';

export class OpenAIMetricsWrapper {
  private client: OpenAI;
  private tracker: TokenUsageTracker;

  constructor(apiKey: string, tracker: TokenUsageTracker) {
    this.client = new OpenAI({ apiKey });
    this.tracker = tracker;
  }

  async chat(
    model: string,
    messages: any[],
    operation: string,
    options: any = {}
  ): Promise<any> {
    const response = await this.client.chat.completions.create({
      model,
      messages,
      ...options,
    });

    // Track token usage
    if (response.usage) {
      this.tracker.logRequest(
        model,
        operation,
        {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
        { messageCount: messages.length }
      );
    }

    return response;
  }

  async streamWithTracking(
    model: string,
    messages: any[],
    operation: string,
    options: any = {}
  ): Promise<AsyncIterable<any>> {
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      stream: true,
      ...options,
    });

    // Wrap stream to estimate tokens
    return this.trackStreamTokens(stream, model, operation, messages.length);
  }

  private async *trackStreamTokens(
    stream: AsyncIterable<any>,
    model: string,
    operation: string,
    messageCount: number
  ): AsyncIterable<any> {
    let completionTokens = 0;
    let promptTokens = 0;

    for await (const chunk of stream) {
      // Estimate completion tokens (rough approximation)
      if (chunk.choices[0]?.delta?.content) {
        completionTokens++;
      }

      yield chunk;
    }

    // Estimate prompt tokens (rough approximation: ~4 chars per token)
    // In production, use a proper tokenizer like tiktoken
    promptTokens = Math.ceil(JSON.stringify(messages).length / 4);

    this.tracker.logRequest(
      model,
      operation,
      {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      { messageCount, estimated: true }
    );
  }
}
```

### 5.3 Token Cost Calculator

```typescript
// tracking/TokenCostCalculator.ts
interface PricingTier {
  model: string;
  promptPricePer1k: number; // USD
  completionPricePer1k: number; // USD
}

export class TokenCostCalculator {
  private pricing: Map<string, PricingTier> = new Map();

  constructor() {
    // Initialize with common pricing (update regularly)
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
    this.pricing.set(model, { model, promptPricePer1k, completionPricePer1k });
  }

  calculateCost(model: string, usage: TokenUsage): number {
    const pricing = this.pricing.get(model);

    if (!pricing) {
      throw new Error(`No pricing found for model: ${model}`);
    }

    const promptCost = (usage.promptTokens / 1000) * pricing.promptPricePer1k;
    const completionCost =
      (usage.completionTokens / 1000) * pricing.completionPricePer1k;

    return promptCost + completionCost;
  }

  calculateTotalCost(usageByModel: Map<string, TokenUsage>): {
    totalCost: number;
    costByModel: Map<string, number>;
  } {
    let totalCost = 0;
    const costByModel = new Map<string, number>();

    for (const [model, usage] of usageByModel) {
      const cost = this.calculateCost(model, usage);
      costByModel.set(model, cost);
      totalCost += cost;
    }

    return { totalCost, costByModel };
  }

  formatCostUSD(cents: number): string {
    return `$${cents.toFixed(4)}`;
  }
}
```

---

## 6. Cache Hit/Miss Rate Calculation

### 6.1 Cache Metrics Collector

```typescript
// cache/CacheMetrics.ts
interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  lastUpdated: Date;
}

interface CacheRateStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  hitRatePercentage: number;
  missRatePercentage: number;
}

export class CacheMetricsCollector {
  private metrics: Map<string, CacheMetrics> = new Map();
  private history: Map<string, CacheRateStats[]> = new Map();
  private maxHistorySize: number;

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

  getStats(cacheName: string): CacheRateStats | null {
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
    };
  }

  recordSnapshot(cacheName: string): void {
    const stats = this.getStats(cacheName);

    if (stats) {
      const history = this.history.get(cacheName) || [];
      history.push({
        ...stats,
        timestamp: new Date().toISOString(),
      } as any);

      if (history.length > this.maxHistorySize) {
        history.shift();
      }

      this.history.set(cacheName, history);
    }
  }

  getHistory(cacheName: string): CacheRateStats[] {
    return this.history.get(cacheName) || [];
  }

  getTrend(
    cacheName: string,
    windowSize: number = 10
  ): {
    hitRateTrend: 'improving' | 'declining' | 'stable';
    averageHitRate: number;
  } | null {
    const history = this.history.get(cacheName);

    if (!history || history.length < 2) {
      return null;
    }

    const recent = history.slice(-windowSize);
    const averageHitRate =
      recent.reduce((sum, s) => sum + s.hitRate, 0) / recent.length;

    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.ceil(recent.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, s) => sum + s.hitRate, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, s) => sum + s.hitRate, 0) / secondHalf.length;

    const diff = secondHalfAvg - firstHalfAvg;

    let trend: 'improving' | 'declining' | 'stable';
    if (diff > 0.05) {
      trend = 'improving';
    } else if (diff < -0.05) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return { hitRateTrend: trend, averageHitRate };
  }

  private getOrCreateMetrics(cacheName: string): CacheMetrics {
    return (
      this.metrics.get(cacheName) || {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0,
        lastUpdated: new Date(),
      }
    );
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
```

### 6.2 Decorator Pattern for Cache Monitoring

```typescript
// cache/MonitoredCache.ts
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
    },
  });
}

// Usage
const metrics = new CacheMetricsCollector();
const cache = createMonitoredCache(
  new Map<string, any>(),
  metrics,
  'user-cache'
);
```

### 6.3 Sliding Window Cache Metrics

```typescript
// cache/SlidingWindowCacheMetrics.ts
interface WindowEntry {
  timestamp: number;
  isHit: boolean;
}

export class SlidingWindowCacheMetrics {
  private window: Map<string, WindowEntry[]> = new Map();
  private windowSizeMs: number;

  constructor(windowSizeMs: number = 60000) {
    // 1 minute default
    this.windowSizeMs = windowSizeMs;
  }

  recordAccess(cacheName: string, isHit: boolean): void {
    const entries = this.window.get(cacheName) || [];
    entries.push({
      timestamp: Date.now(),
      isHit,
    });

    this.cleanupWindow(entries);
    this.window.set(cacheName, entries);
  }

  private cleanupWindow(entries: WindowEntry[]): void {
    const cutoff = Date.now() - this.windowSizeMs;

    // Remove entries outside the window
    let writeIndex = 0;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].timestamp > cutoff) {
        entries[writeIndex++] = entries[i];
      }
    }

    entries.splice(writeIndex);
  }

  getHitRate(cacheName: string): number {
    const entries = this.window.get(cacheName);

    if (!entries || entries.length === 0) {
      return 0;
    }

    this.cleanupWindow(entries);

    const hits = entries.filter(e => e.isHit).length;
    return hits / entries.length;
  }

  getStats(cacheName: string): {
    hitRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
  } {
    const entries = this.window.get(cacheName);

    if (!entries || entries.length === 0) {
      return { hitRate: 0, totalRequests: 0, hits: 0, misses: 0 };
    }

    this.cleanupWindow(entries);

    const hits = entries.filter(e => e.isHit).length;
    const total = entries.length;

    return {
      hitRate: hits / total,
      totalRequests: total,
      hits,
      misses: total - hits,
    };
  }

  reset(cacheName: string): void {
    this.window.delete(cacheName);
  }

  resetAll(): void {
    this.window.clear();
  }
}
```

---

## 7. Testing Approaches for Metrics Collectors

### 7.1 Unit Testing Metrics Collector

```typescript
// tests/MetricsCollector.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsCollector } from '../collector/MetricsCollector';

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

    it('should track increment count', () => {
      collector.increment('test.counter');
      collector.increment('test.counter');

      const snapshot = collector.getSnapshot();
      expect(snapshot.counters['test.counter'].increments).toBe(2);
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

    it('should store values for percentile calculation', () => {
      collector.recordTiming('operation', 100);
      collector.recordTiming('operation', 200);

      const snapshot = collector.getSnapshot();
      expect(snapshot.timings['operation'].values).toEqual([100, 200]);
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
    });

    it('should record timing for sync function', async () => {
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
  });
});
```

### 7.2 Testing Percentile Calculations

```typescript
// tests/PercentileCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { ExactPercentileCalculator } from '../utils/PercentileCalculator';

describe('ExactPercentileCalculator', () => {
  describe('calculate', () => {
    it('should return 0 for empty array', () => {
      expect(ExactPercentileCalculator.calculate([], 50)).toBe(0);
    });

    it('should calculate p50 (median)', () => {
      const values = [1, 2, 3, 4, 5];
      expect(ExactPercentileCalculator.calculate(values, 50)).toBe(3);
    });

    it('should calculate p95', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(ExactPercentileCalculator.calculate(values, 95)).toBe(95);
    });

    it('should calculate p99', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(ExactPercentileCalculator.calculate(values, 99)).toBe(99);
    });

    it('should handle unsorted input', () => {
      const values = [5, 1, 3, 2, 4];
      expect(ExactPercentileCalculator.calculate(values, 50)).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return zeros for empty array', () => {
      const stats = ExactPercentileCalculator.getStats([]);
      expect(stats).toEqual({
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        count: 0,
      });
    });

    it('should calculate all statistics', () => {
      const values = [10, 20, 30, 40, 50];
      const stats = ExactPercentileCalculator.getStats(values);

      expect(stats.count).toBe(5);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.avg).toBe(30);
      expect(stats.p50).toBe(30);
    });
  });
});
```

### 7.3 Testing Cache Metrics

```typescript
// tests/CacheMetrics.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CacheMetricsCollector } from '../cache/CacheMetrics';

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
    expect(stats?.hitRate).toBe(2 / 3);
    expect(stats?.hitRatePercentage).toBeCloseTo(66.67, 2);
  });

  it('should return null for non-existent cache', () => {
    const stats = collector.getStats('non-existent');
    expect(stats).toBeNull();
  });

  it('should handle cache with no requests', () => {
    collector.recordHit('my-cache');
    collector.reset('my-cache');

    const stats = collector.getStats('my-cache');
    expect(stats).toBeNull();
  });

  it('should track evictions', () => {
    const metrics = (collector as any).getOrCreateMetrics('my-cache');
    expect(metrics.evictions).toBe(0);

    collector.recordEviction('my-cache');
    expect(metrics.evictions).toBe(1);
  });

  it('should track cache size', () => {
    collector.updateSize('my-cache', 100);

    const metrics = (collector as any).getOrCreateMetrics('my-cache');
    expect(metrics.size).toBe(100);
  });
});
```

### 7.4 Integration Testing

```typescript
// tests/integration/MetricsIntegration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../../collector/MetricsCollector';
import { MetricsWriter } from '../../writer/MetricsWriter';
import { existsSync, unlink } from 'fs/promises';
import { join } from 'path';

describe('Metrics Integration', () => {
  const testOutputPath = join(__dirname, 'test-metrics.json');

  beforeEach(async () => {
    if (existsSync(testOutputPath)) {
      await unlink(testOutputPath);
    }
  });

  it('should write metrics to file', async () => {
    const collector = new MetricsCollector();
    const writer = new MetricsWriter({
      outputDir: __dirname,
      fileName: 'test-metrics.json',
    });

    collector.increment('test.counter', 5);
    collector.setGauge('test.gauge', 42);
    collector.recordTiming('test.timing', 100);

    const snapshot = collector.getSnapshot();
    await writer.write(snapshot);

    expect(existsSync(testOutputPath)).toBe(true);
  });
});
```

---

## 8. Performance Considerations

### 8.1 Minimizing Overhead

**Key Strategies:**

1. **Sampling**: Only record a percentage of operations
2. **Batching**: Aggregate metrics before writing
3. **Async Operations**: Don't block on metrics collection
4. **Memory Limits**: Cap the number of stored samples

```typescript
// performance/SampledMetricsCollector.ts
export class SampledMetricsCollector extends MetricsCollector {
  private sampleRate: number;

  constructor(sampleRate: number = 0.1) {
    // 10% default
    super();
    this.sampleRate = sampleRate;
  }

  recordTiming(metricName: string, durationMs: number): void {
    if (Math.random() < this.sampleRate) {
      super.recordTiming(metricName, durationMs);
    }
  }

  increment(
    metricName: string,
    value: number = 1,
    tags?: Record<string, string>
  ): void {
    if (Math.random() < this.sampleRate) {
      super.increment(metricName, value / this.sampleRate, tags);
    }
  }
}
```

### 8.2 Batched Metrics Writer

```typescript
// performance/BatchedMetricsWriter.ts
export class BatchedMetricsWriter {
  private batch: any[] = [];
  private batchSize: number;
  private flushInterval: number;
  private writer: MetricsWriter;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    writer: MetricsWriter,
    config: { batchSize?: number; flushInterval?: number } = {}
  ) {
    this.writer = writer;
    this.batchSize = config.batchSize || 100;
    this.flushInterval = config.flushInterval || 5000;
    this.startFlushTimer();
  }

  async write(metrics: any): Promise<void> {
    this.batch.push(metrics);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const batchToWrite = this.batch;
    this.batch = [];

    try {
      await Promise.all(batchToWrite.map(m => this.writer.write(m)));
    } catch (error) {
      console.error('Failed to flush metrics batch:', error);
      // Re-add failed metrics
      this.batch.unshift(...batchToWrite);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  async dispose(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}
```

### 8.3 Memory-Efficient Metrics Storage

```typescript
// performance/CircularBuffer.ts
export class CircularBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private size: number = 0;
  private head: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;

    if (this.size < this.capacity) {
      this.size++;
    }
  }

  toArray(): T[] {
    const result: T[] = [];

    for (let i = 0; i < this.size; i++) {
      const index = (this.head - this.size + i + this.capacity) % this.capacity;
      result.push(this.buffer[index]);
    }

    return result;
  }

  get length(): number {
    return this.size;
  }

  clear(): void {
    this.size = 0;
    this.head = 0;
  }
}

// Usage in metrics collector
class MemoryEfficientMetricsCollector {
  private samples: CircularBuffer<number>;

  constructor(maxSamples: number) {
    this.samples = new CircularBuffer(maxSamples);
  }

  recordTiming(durationMs: number): void {
    this.samples.push(durationMs);
  }

  getPercentile(percentile: number): number {
    const values = this.samples.toArray();
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}
```

### 8.4 Async Metrics Collection

```typescript
// performance/AsyncMetricsCollector.ts
export class AsyncMetricsCollector {
  private queue: Array<() => void> = [];
  private processing = false;
  private metrics: MetricsCollector;

  constructor() {
    this.metrics = new MetricsCollector();
    this.processQueue();
  }

  increment(metricName: string, value: number = 1): void {
    this.queue.push(() => this.metrics.increment(metricName, value));
  }

  recordTiming(metricName: string, durationMs: number): void {
    this.queue.push(() => this.metrics.recordTiming(metricName, durationMs));
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        // Process tasks in next tick to avoid blocking
        await new Promise(resolve =>
          setImmediate(() => {
            task();
            resolve(undefined);
          })
        );
      }
    }

    // Schedule next processing cycle
    setImmediate(() => this.processQueue());
  }

  getSnapshot(): MetricsSnapshot {
    return this.metrics.getSnapshot();
  }
}
```

---

## 9. References and Further Reading

### Official Documentation

1. **Node.js Performance Hooks API**
   - URL: https://nodejs.org/api/perf_hooks.html
   - Description: Official documentation for Node.js performance measurement APIs
   - Topics: PerformanceObserver, performance.mark(), performance.measure()

2. **Node.js Process Memory Usage**
   - URL: https://nodejs.org/api/process.html#process_process_memoryusage
   - Description: Process memory monitoring documentation
   - Topics: RSS, heapTotal, heapUsed, external, arrayBuffers

3. **V8 Heap Statistics**
   - URL: https://nodejs.org/api/v8.html
   - Description: V8 engine heap statistics and space information
   - Topics: getHeapStatistics(), getHeapSpaceStatistics()

### Popular Libraries

4. **prom-client (Prometheus Client for Node.js)**
   - URL: https://github.com/siimon/prom-client
   - Description: Prometheus client for Node.js metrics collection
   - Topics: Counters, Gauges, Histograms, Summaries

5. **Datadog Metrics SDK**
   - URL: https://docs.datadoghq.com/developers/metrics/
   - Description: Datadog metrics integration guide
   - Topics: Distribution metrics, metric naming, tagging

6. **StatsD Client for Node.js**
   - URL: https://github.com/statsd/statsd
   - Description: StatsD protocol client implementation
   - Topics: Counting, timing, gauging, sampling

### Token Tracking Resources

7. **OpenAI API Usage Documentation**
   - URL: https://platform.openai.com/docs/api-reference/usage
   - Description: OpenAI API token usage tracking
   - Topics: prompt_tokens, completion_tokens, total_tokens

8. **Tiktoken (OpenAI's Tokenizer)**
   - URL: https://github.com/openai/tiktoken
   - Description: Byte Pair Encoding tokenizer for accurate token counting
   - Topics: Token counting, encoding, model-specific tokenizers

### Performance and Best Practices

9. **Prometheus Metric Naming Best Practices**
   - URL: https://prometheus.io/docs/practices/naming/
   - Description: Guidelines for naming metrics
   - Topics: Metric names, labels, unit conventions

10. **Node.js Performance Monitoring**
    - URL: https://nodejs.org/en/docs/guides/simple-profiling/
    - Description: Node.js profiling and performance monitoring
    - Topics: Profiling, performance analysis, optimization

11. **T-Digest Algorithm**
    - URL: https://github.com/caio/tdigest
    - Description: Approximate quantile algorithm for large datasets
    - Topics: Percentiles, streaming data, memory-efficient calculations

### Testing Resources

12. **Vitest Testing Framework**
    - URL: https://vitest.dev/
    - Description: Fast unit testing framework for TypeScript/Node.js
    - Topics: Unit testing, mocking, coverage

13. **Testing Node.js Performance**
    - URL: https://nodejs.org/en/docs/guides/testing/
    - Description: Node.js testing best practices
    - Topics: Benchmarking, performance testing, load testing

### Additional Resources

14. **Node.js Event Loop Monitoring**
    - URL: https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/
    - Description: Understanding and monitoring the Node.js event loop
    - Topics: Event loop lag, blocking operations, async operations

15. **Caching Strategies and Metrics**
    - URL: https://www.nginx.com/blog/benefits-of-microcaching-nginx/
    - Description: Caching strategies and performance metrics
    - Topics: Hit rates, cache eviction, TTL strategies

---

## Summary of Key Findings

### Implementation Patterns

1. **Type-Safe Metrics Collection**: Use TypeScript interfaces to define metric structures and ensure type safety throughout the metrics collection system.

2. **Modular Design**: Separate concerns into distinct classes for different metric types (counters, gauges, timings) and different operations (collection, storage, writing).

3. **Thread-Safety**: Use proper synchronization patterns for concurrent metric collection operations, especially in high-throughput systems.

4. **Percentile Calculations**: Choose the right strategy based on dataset size:
   - Exact calculation for small datasets
   - Reservoir sampling for medium datasets
   - T-Digest for large, streaming datasets

### Performance Best Practices

1. **Sampling**: Implement configurable sampling rates to reduce overhead in high-traffic scenarios.

2. **Batching**: Aggregate metrics before writing to reduce I/O operations.

3. **Async Operations**: Use non-blocking patterns for metric collection and writing.

4. **Memory Management**: Implement circular buffers or size limits to prevent unbounded memory growth.

### Testing Strategies

1. **Unit Testing**: Test individual metric types and calculations in isolation.

2. **Integration Testing**: Test the full metrics pipeline from collection to storage.

3. **Performance Testing**: Benchmark metrics collection overhead under load.

4. **Edge Cases**: Test empty datasets, single values, and boundary conditions.

### Node.js-Specific Considerations

1. **Built-in APIs**: Leverage `perf_hooks`, `process.memoryUsage()`, and `v8` APIs for native performance monitoring.

2. **Event Loop Monitoring**: Track event loop lag to identify blocking operations.

3. **Heap Statistics**: Monitor heap usage and garbage collection for memory leak detection.

### LLM Token Tracking

1. **API Wrappers**: Wrap OpenAI API calls to automatically track token usage.

2. **Cost Calculation**: Implement token-to-cost conversion using current pricing.

3. **Streaming Support**: Estimate tokens for streaming responses (with appropriate caveats).

### Cache Metrics

1. **Hit/Miss Rates**: Calculate and track hit rates as key cache performance indicators.

2. **Sliding Windows**: Use time-windowed metrics for real-time cache performance.

3. **Trend Analysis**: Track hit rate trends to identify cache effectiveness changes.

This research provides a comprehensive foundation for implementing a production-ready metrics collection system in TypeScript/Node.js applications.
