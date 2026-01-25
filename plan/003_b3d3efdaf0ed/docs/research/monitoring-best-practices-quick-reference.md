# Monitoring Best Practices - Quick Reference

## Executive Summary

This document provides a condensed reference for implementing optimized monitoring in the PRP runtime based on industry best practices from Google SRE, Prometheus, Node.js, and other production systems.

**Key Recommendation:** Implement adaptive, lazy monitoring that adjusts sampling frequency based on resource usage, keeping overhead under 5% of system resources.

---

## 1. Sampling Interval Guidelines

### Standard Intervals by Metric Type

| Metric Type | Interval | Use Case |
|-------------|----------|----------|
| **Critical Alerts** | 1-5 seconds | SLA violations, system failures |
| **Performance** | 15-30 seconds | Response times, throughput, errors |
| **Resources** | 30-60 seconds | CPU, memory, disk, network |
| **Trends** | 60-300 seconds | Capacity planning, forecasting |

### Configuration for PRP Runtime

```typescript
const RECOMMENDED_INTERVALS = {
  critical: 5000,    // 5s - when resources > 90%
  warning: 15000,    // 15s - when resources > 70%
  normal: 30000,     // 30s - default operating state
  idle: 60000        // 60s - minimal resource usage
};
```

---

## 2. Lazy Evaluation Implementation

### Core Principle

**Only monitor when it matters.** Activate detailed monitoring only when resources exceed 70% usage.

### Implementation Pattern

```typescript
class LazyResourceMonitor {
  private isActive = false;

  shouldMonitor(currentUsage: number): boolean {
    if (currentUsage >= 90) {
      // Critical zone - monitor every 5s
      return true;
    } else if (currentUsage >= 70) {
      // Warning zone - monitor every 15s
      return true;
    } else {
      // Safe zone - minimal monitoring
      return false;
    }
  }
}
```

### Key Techniques

1. **Threshold-Based Gating**
   - Check simple conditions before expensive operations
   - Skip detailed checks when resources are healthy

2. **Cached Computation**
   - Cache metrics with 30-60 second TTL
   - Invalidate only on state changes

3. **On-Demand Aggregation**
   - Compute percentiles/averages only when queried
   - Store raw data, aggregate on retrieval

---

## 3. Adaptive Monitoring Algorithm

### AIMD Strategy (Additive Increase, Multiplicative Decrease)

```typescript
class AdaptiveMonitor {
  private interval = 30000; // Start at 30s
  private readonly MIN = 5000;   // 5s minimum
  private readonly MAX = 300000; // 5min maximum

  onThresholdBreached(): void {
    // Cut interval in half when danger detected
    this.interval = Math.max(this.MIN, this.interval / 2);
  }

  onStablePeriod(): void {
    // Add 5 seconds when stable
    this.interval = Math.min(this.MAX, this.interval + 5000);
  }
}
```

### Adaptation Rules

| Condition | Action |
|-----------|--------|
| Usage > 90% or volatility > 20% | Set interval to 5s (MIN) |
| Usage > 70% or volatility > 10% | Set interval to 15s |
| Usage < 30% and stable | Gradually increase to 60s+ |
| Normal operation | Maintain 30s interval |

### Hysteresis to Prevent Oscillation

```typescript
// Use different thresholds for increasing vs decreasing
const WARN_UP = 70;   // Activate at 70%
const WARN_DOWN = 60; // Deactivate at 60%

if (usage > WARN_UP && !isActive) {
  isActive = true;
  interval = 15000;
} else if (usage < WARN_DOWN && isActive) {
  isActive = false;
  interval = 60000;
}
```

---

## 4. Overhead Reduction Techniques

### Target Budget

| Resource | Budget | Allocation |
|----------|--------|------------|
| **CPU** | 5% | 2% collection, 1% aggregation, 2% transmission |
| **Memory** | 50MB | 20MB buffers, 20MB cache, 10MB overhead |
| **Network** | 100KB/s | 50KB/s telemetry, 50KB/s alerts |

### Implementation Strategies

#### 1. Batch Collection

```typescript
class BatchCollector {
  private batch: any[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30s

  addMetric(metric: any): void {
    this.batch.push(metric);
    if (this.batch.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  flush(): void {
    if (this.batch.length === 0) return;
    sendToBackend(this.batch);
    this.batch = [];
  }
}
```

#### 2. Asynchronous Monitoring

```typescript
import { Worker } from 'worker_threads';

// Don't block the event loop
const monitorWorker = new Worker('./monitor.js', {
  resourceLimits: {
    maxOldGenerationSizeMb: 16  // Limit monitor memory
  }
});
```

#### 3. Smart Sampling

```typescript
class SmartSampler {
  private sampleRate = 0.1; // Sample 10%

  shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }

  // Reservoir sampling for representative data
  private reservoir: number[] = [];
  private readonly MAX_SAMPLES = 1000;

  addToReservoir(value: number): void {
    if (this.reservoir.length < this.MAX_SAMPLES) {
      this.reservoir.push(value);
    } else {
      // Random replacement maintains representativeness
      const index = Math.floor(Math.random() * this.reservoir.length);
      this.reservoir[index] = value;
    }
  }
}
```

#### 4. Pre-Aggregation

```typescript
// Compute percentiles locally, not remotely
class PreAggregator {
  private timings: number[] = [];

  addTiming(value: number): void {
    this.timings.push(value);
    if (this.timings.length >= 1000) {
      this.aggregateAndFlush();
    }
  }

  private aggregateAndFlush(): void {
    const sorted = this.timings.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Send only 3 values instead of 1000
    sendMetric('p50', p50);
    sendMetric('p95', p95);
    sendMetric('p99', p99);

    this.timings = [];
  }
}
```

---

## 5. Node.js-Specific Optimizations

### Event Loop Monitoring

```typescript
import { performance } from 'perf_hooks';

class EventLoopMonitor {
  private lastLoop = performance.now();

  checkLag(): number {
    const now = performance.now();
    const lag = now - this.lastLoop;
    this.lastLoop = now;
    return lag;
  }

  isHealthy(): boolean {
    return this.checkLag() < 100; // 100ms threshold
  }
}
```

### Memory Monitoring (Lazy)

```typescript
import v8 from 'v8';

class MemoryMonitor {
  shouldSnapshot(): boolean {
    const stats = v8.getHeapStatistics();
    const usagePercent = (stats.used_heap_size / stats.heap_size_limit) * 100;
    return usagePercent > 80; // Only snapshot at 80%+
  }
}
```

### Conditional Profiling

```typescript
// Only enable CPU profiling when explicitly needed
if (process.env.ENABLE_PROFILING) {
  // Enable inspector
} else {
  // Use lightweight monitoring only
}
```

---

## 6. Implementation Checklist

### Phase 1: Lazy Evaluation (Week 1)

- [ ] Implement threshold-based activation (70% warning, 90% critical)
- [ ] Add metric caching with 30-60 second TTL
- [ ] Implement on-demand aggregation (compute only when queried)
- [ ] Add simple boolean gating before expensive operations

### Phase 2: Adaptive Monitoring (Week 2)

- [ ] Implement AIMD algorithm for interval adjustment
- [ ] Add hysteresis to prevent oscillation (70% up, 60% down)
- [ ] Implement volatility detection (rate of change tracking)
- [ ] Add gradual drift toward default intervals

### Phase 3: Overhead Reduction (Week 3)

- [ ] Implement batch collection (100 items or 30 seconds)
- [ ] Move monitoring to Worker Threads
- [ ] Implement reservoir sampling for histograms
- [ ] Add pre-aggregation before transmission

### Phase 4: Integration (Week 4)

- [ ] Integrate with PRP runtime checkpointing
- [ ] Add configuration via CLI flags
- [ ] Implement graceful degradation under load
- [ ] Add monitoring health checks

---

## 7. Configuration Recommendations

### Production Configuration

```typescript
const PRODUCTION_CONFIG = {
  // Sampling intervals
  baseInterval: 30000,        // 30 seconds
  minInterval: 5000,          // 5 seconds
  maxInterval: 300000,        // 5 minutes

  // Thresholds
  warningThreshold: 70,       // 70%
  criticalThreshold: 90,      // 90%

  // Lazy evaluation
  enableLazyEval: true,
  cacheTTL: 60000,            // 60 seconds

  // Adaptive monitoring
  enableAdaptive: true,
  hysteresisGap: 10,          // 10% gap between up/down

  // Overhead reduction
  enableBatching: true,
  batchSize: 100,
  flushInterval: 30000,       // 30 seconds
  sampleRate: 0.1,            // 10%

  // Resource limits
  maxMemoryMB: 50,
  maxCPUPercent: 5
};
```

### Development Configuration

```typescript
const DEVELOPMENT_CONFIG = {
  ...PRODUCTION_CONFIG,
  baseInterval: 5000,         // More frequent for debugging
  enableLazyEval: false,      // Always monitor in dev
  enableAdaptive: false,      // Consistent behavior
};
```

---

## 8. Common Pitfalls to Avoid

### Don't

1. **Poll too frequently** - Every 100ms is overkill for most metrics
2. **Monitor everything** - Use sampling and lazy evaluation
3. **Block the event loop** - Use async/await and Worker Threads
4. **Ignore overhead** - Monitoring shouldn't impact performance
5. **Hardcode intervals** - Use adaptive algorithms
6. **Send raw data** - Pre-aggregate before transmission

### Do

1. **Start conservative** - 30-second intervals are usually fine
2. **Use thresholds** - Only monitor when approaching limits
3. **Cache aggressively** - TTL of 30-60 seconds is appropriate
4. **Batch operations** - Reduce syscalls and network overhead
5. **Monitor the monitor** - Track monitoring overhead itself
6. **Adapt to conditions** - Increase frequency during degradation

---

## 9. Quick Decision Tree

```
Need to monitor a resource?
│
├─ Is it critical for SLA compliance?
│  └─ Yes → Use 5s intervals, no lazy evaluation
│
├─ Is current usage < 70%?
│  └─ Yes → Use lazy evaluation, 60s intervals
│
├─ Is current usage 70-90%?
│  └─ Yes → Activate monitoring, 15s intervals
│
└─ Is current usage > 90%?
   └─ Yes → Maximum monitoring, 5s intervals, alert
```

---

## 10. Key Metrics to Track

### System Health

| Metric | Interval | Threshold | Action |
|--------|----------|-----------|--------|
| Event Loop Lag | 5s | > 100ms | Alert |
| Heap Used % | 30s | > 85% | Alert |
| CPU Usage | 30s | > 90% | Alert |
| Memory RSS | 30s | > 1GB | Alert |

### Monitoring Health

| Metric | Interval | Threshold | Action |
|--------|----------|-----------|--------|
| Monitor CPU % | 60s | > 5% | Reduce frequency |
| Monitor Memory | 60s | > 50MB | Reduce cache size |
| Monitor Lag | 30s | > 1s | Increase intervals |

---

## 11. External References

### Primary Documentation

1. **Prometheus Best Practices**
   - https://prometheus.io/docs/practices/
   - Industry standard for metric collection

2. **Google SRE Book - Chapter 6**
   - https://sre.google/sre-book/monitoring-distributed-systems/
   - Monitoring philosophy and practices

3. **Node.js Diagnostics**
   - https://nodejs.org/en/docs/guides/simple-profiling/
   - Performance profiling techniques

4. **OpenTelemetry Specification**
   - https://opentelemetry.io/docs/reference/specification/best-practices/
   - Telemetry collection standards

### Research Papers

1. **Gorilla: Fast Time-Series Database** (Facebook)
   - Compression and efficient storage techniques

2. **Adaptive Sampling in Sensor Networks**
   - Dynamic frequency adjustment algorithms

3. **Western Electric Rules** (Statistical Process Control)
   - Threshold-based anomaly detection

---

## Summary

**Implementation priority:**

1. **Start with lazy evaluation** - Only monitor when resources > 70%
2. **Add adaptive intervals** - Use AIMD algorithm (5s-300s range)
3. **Implement batching** - Collect 100 items or 30 seconds
4. **Move to async** - Use Worker Threads for monitoring
5. **Pre-aggregate** - Compute statistics locally

**Expected outcomes:**

- Monitoring overhead < 5% of system resources
- Adaptive response to resource pressure
- Reduced network and storage costs
- Better signal-to-noise ratio in alerts
- Improved system stability

These practices are proven at scale by industry leaders and directly applicable to the PRP runtime's monitoring needs.
