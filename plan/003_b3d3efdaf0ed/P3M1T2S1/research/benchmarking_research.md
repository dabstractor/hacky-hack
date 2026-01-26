# Node.js/TypeScript Benchmarking Research

**Project:** hacky-hack
**Date:** 2026-01-24
**Task:** P3M1T2S1 - Research benchmarking frameworks and best practices for performance optimization

---

## Executive Summary

This research document covers benchmarking frameworks, patterns, and best practices for Node.js/TypeScript projects using Vitest. The focus is on measuring performance improvements for resource monitoring code, I/O operations vs CPU operations, and cached vs non-cached operations.

**Key Recommendation:** Use **tinybench** as the primary benchmarking framework due to its Vitest compatibility, small footprint (7KB), TypeScript support, and comprehensive statistical analysis.

---

## 1. Benchmark Frameworks Compatible with Vitest

### 1.1 Tinybench (Recommended)

**Package:** `tinybench`
**Version:** Latest
**Size:** 7KB (2KB minified and gzipped)
**TypeScript Support:** Native
**Repository:** [https://github.com/tinylibs/tinybench](https://github.com/tinylibs/tinybench)

#### Why Tinybench for Vitest Projects?

1. **Vitest Ecosystem Compatibility**
   - Created by the Vitest team (tinylibs)
   - Uses same design patterns as Vitest
   - Modern async/await API
   - Event-based architecture (EventTarget)

2. **Key Features**
   - Accurate timing using `process.hrtime` (Node.js) or `performance.now` (browser)
   - Statistical analysis with mean, variance, standard deviation
   - Percentile calculations (p75, p99, p995, p999)
   - Margin of error reporting
   - No dependencies
   - Concurrent execution support

3. **API Design**

   ```typescript
   import { Bench } from 'tinybench';

   const bench = new Bench({ time: 500 });

   bench
     .add('operation', () => {
       // Code to benchmark
     })
     .add('optimized operation', () => {
       // Optimized version
     });

   await bench.warmup(); // Essential for reliable results
   await bench.run();

   console.table(bench.table());
   ```

#### Configuration Options

```typescript
interface Options {
  time?: number; // Time per task (ms), default: 500
  iterations?: number; // Min iterations, default: 10
  now?: () => number; // Custom timing function
  signal?: AbortSignal; // For cancellation
  throws?: boolean; // Throw on errors
  warmupTime?: number; // Warmup time (ms), default: 100
  warmupIterations?: number; // Warmup iterations, default: 5
  setup?: Hook; // Before each task
  teardown?: Hook; // After each task
}
```

#### Task Lifecycle Hooks

```typescript
bench.add('task', fn, {
  beforeAll: () => {}, // Once before iterations start
  beforeEach: () => {}, // Before each iteration
  afterEach: () => {}, // After each iteration
  afterAll: () => {}, // Once after all iterations
});
```

### 1.2 Alternative: Benchmark.js

**Package:** `benchmark`
**Repository:** [https://github.com/bestiejs/benchmark.js](https://github.com/bestiejs/benchmark.js)

**Pros:**

- Industry standard, mature library
- Excellent statistical analysis
- Large community

**Cons:**

- Older callback-style API
- Larger bundle size
- Less TypeScript-friendly
- Not actively maintained as of 2026

**Verdict:** Use tinybench for modern Vitest-based projects.

### 1.3 Vitest Native Benchmarks (Not Available)

As of Vitest 1.6.1, Vitest does not include built-in benchmark functionality. Vitest focuses on unit testing, not performance testing. Use tinybench for benchmarks within the Vitest ecosystem.

---

## 2. Writing Meaningful Benchmarks for Resource Monitoring Code

### 2.1 Resource Monitor Benchmark Patterns

Based on the `/home/dustin/projects/hacky-hack/src/utils/resource-monitor.ts` file, here are specific benchmark patterns:

#### Pattern 1: File Handle Monitoring

```typescript
// benchmark/resource-monitor.bench.ts
import { Bench } from 'tinybench';
import { FileHandleMonitor } from '../src/utils/resource-monitor.js';

const bench = new Bench({
  time: 1000,
  warmupTime: 200,
});

const monitor = new FileHandleMonitor(0.7, 0.85);

bench
  .add('file handle count - internal API', () => {
    monitor.getHandleCount();
  })
  .add('file handle count - with ulimit check', () => {
    monitor.getHandleCount();
    monitor.getUlimit();
  })
  .add('file handle status check', () => {
    monitor.check();
  });

await bench.warmup();
await bench.run();

console.table(bench.table());
```

#### Pattern 2: Memory Monitoring

```typescript
import { Bench } from 'tinybench';
import { MemoryMonitor } from '../src/utils/resource-monitor.js';

const bench = new Bench({
  time: 1000,
  setup: async task => {
    // Force GC before each task for fair comparison (if --expose-gc)
    if (global.gc) global.gc();
  },
});

const monitor = new MemoryMonitor(0.8, 0.9);

bench
  .add('memory usage snapshot', () => {
    monitor.getMemoryUsage();
  })
  .add('memory check with thresholds', () => {
    monitor.check();
  });

await bench.warmup();
await bench.run();
```

#### Pattern 3: Combined Resource Monitor

```typescript
import { Bench } from 'tinybench';
import { ResourceMonitor } from '../src/utils/resource-monitor.js';

const bench = new Bench({ time: 500 });

bench
  .add('getStatus - cold start', () => {
    const monitor = new ResourceMonitor();
    monitor.getStatus();
  })
  .add(
    'getStatus - warm instance',
    () => {
      // Reuse instance
    },
    {
      beforeAll: () => {
        this.monitor = new ResourceMonitor();
      },
    }
  );

await bench.warmup();
await bench.run();
```

### 2.2 Best Practices for Resource Monitoring Benchmarks

1. **Isolate the Measurement**
   - Only benchmark the monitoring code, not the operations being monitored
   - Use mock data for consistent comparisons

2. **Account for Platform Differences**

   ```typescript
   bench
     .add('Linux - /proc/fs read', () => {
       // Linux-specific path
     })
     .add('macOS - lsof command', () => {
       // macOS-specific (slower)
     })
     .add('Cross-platform fallback', () => {
       // Universal method
     });
   ```

3. **Measure Overhead Impact**
   ```typescript
   bench
     .add('without monitoring', () => {
       // Operation without resource checks
     })
     .add('with monitoring', () => {
       // Operation with resource checks
     })
     .add('monitoring overhead only', () => {
       monitor.getStatus();
     });
   ```

---

## 3. Benchmarking I/O Operations vs CPU Operations

### 3.1 I/O Operation Benchmarks

I/O operations (file system, network, database) require special consideration:

#### Key Principles

1. **Use Async Benchmarks**

   ```typescript
   bench
     .add('fs.readFile', async () => {
       await fs.readFile('./test-data.json');
     })
     .add('fs.promises.readFile', async () => {
       await fs.promises.readFile('./test-data.json');
     });
   ```

2. **Control File Size**

   ```typescript
   const sizes = ['1KB', '10KB', '100KB', '1MB'];

   for (const size of sizes) {
     bench.add(`read ${size} file`, async () => {
       await fs.readFile(`./test-${size}.json`);
     });
   }
   ```

3. **Measure Both Latency and Throughput**
   - Latency: Time per single operation
   - Throughput: Operations per second (tinybench provides this)

#### I/O Benchmark Example

```typescript
import { Bench } from 'tinybench';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

const bench = new Bench({
  time: 2000, // Longer for I/O (variable timing)
  iterations: 50,
});

// Setup: Create test file before benchmark
const testFilePath = './benchmark-test.json';
const testData = JSON.stringify({ data: 'x'.repeat(10000) });
await writeFile(testFilePath, testData);

bench
  .add('async readFile', async () => {
    await readFile(testFilePath);
  })
  .add('sync readFileSync', () => {
    readFileSync(testFilePath);
  })
  .add('async with error handling', async () => {
    try {
      await readFile(testFilePath);
    } catch {
      // Handle error
    }
  });

await bench.warmup();
await bench.run();

console.table(bench.table());

// Cleanup
await unlink(testFilePath);
```

### 3.2 CPU Operation Benchmarks

CPU operations are more predictable and benefit from JIT optimization:

#### Key Principles

1. **Always Warm Up**
   - V8 needs to compile and optimize code
   - First runs are always slower
   - tinybench's `warmup()` handles this

2. **Prevent Dead Code Elimination**

   ```typescript
   // BAD: V8 might optimize away
   bench.add('bad example', () => {
     const result = expensiveCalculation();
     // Result never used
   });

   // GOOD: Use result
   bench.add('good example', () => {
     const result = expensiveCalculation();
     return result;
   });
   ```

3. **Control Input Size**

   ```typescript
   const inputSizes = [10, 100, 1000, 10000];

   for (const size of inputSizes) {
     const data = Array(size).fill('test');

     bench.add(`process ${size} items`, () => {
       data.forEach(item => processItem(item));
     });
   }
   ```

#### CPU Benchmark Example

```typescript
import { Bench } from 'tinybench';

const bench = new Bench({
  time: 1000,
  warmupTime: 500,
  warmupIterations: 10,
});

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function fibonacciMemoized(n: number, memo = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;

  const result =
    fibonacciMemoized(n - 1, memo) + fibonacciMemoized(n - 2, memo);
  memo.set(n, result);
  return result;
}

bench
  .add('fibonacci recursive', () => {
    fibonacci(20);
  })
  .add('fibonacci memoized', () => {
    fibonacciMemoized(20);
  });

await bench.warmup();
await bench.run();

console.table(bench.table());
```

### 3.3 Hybrid I/O + CPU Benchmarks

Many real-world operations combine I/O and CPU:

```typescript
bench
  .add('read and parse JSON', async () => {
    const data = await readFile('./data.json');
    JSON.parse(data.toString());
  })
  .add('read and parse with validation', async () => {
    const data = await readFile('./data.json');
    const parsed = JSON.parse(data.toString());
    validateSchema(parsed);
  });
```

---

## 4. Benchmarking Cached vs Non-Cached Operations

### 4.1 Cache Performance Patterns

Caching is a common optimization. Here's how to benchmark it properly:

#### Pattern 1: Simple Memoization

```typescript
import { Bench } from 'tinybench';

type Cache = Map<string, any>;

const bench = new Bench({ time: 1000 });

function expensiveOperation(input: string): string {
  // Simulate expensive computation
  return input.split('').reverse().join('').toUpperCase();
}

function cachedOperation(input: string, cache: Cache): string {
  if (cache.has(input)) {
    return cache.get(input);
  }
  const result = expensiveOperation(input);
  cache.set(input, result);
  return result;
}

// Setup test data
const inputs = ['test', 'benchmark', 'caching', 'performance', 'optimization'];
const cache = new Cache();
const uniqueInputs = [...new Set(inputs)]; // All unique for cold cache
const repeatedInputs = [...inputs, ...inputs]; // Duplicates for warm cache

bench
  .add('no cache - all unique', () => {
    uniqueInputs.forEach(input => expensiveOperation(input));
  })
  .add('with cache - cold (all unique)', () => {
    const coldCache = new Cache();
    uniqueInputs.forEach(input => cachedOperation(input, coldCache));
  })
  .add('with cache - warm (50% hits)', () => {
    repeatedInputs.forEach(input => cachedOperation(input, cache));
  })
  .add('with cache - hot (100% hits)', () => {
    // Pre-warm cache
    uniqueInputs.forEach(input => cachedOperation(input, cache));
    // Now measure hits
    uniqueInputs.forEach(input => cachedOperation(input, cache));
  });

await bench.warmup();
await bench.run();

console.table(bench.table());
```

#### Pattern 2: LRU Cache Benchmark

```typescript
import { Bench } from 'tinybench';
import { LRUCache } from 'lru-cache'; // Or your implementation

const bench = new Bench({ time: 1000 });

const lru = new LRUCache({ max: 100 });
const simpleCache = new Map();

const testData = Array.from({ length: 1000 }, (_, i) => `key-${i}`);

bench
  .add('Map set (unbounded)', () => {
    testData.forEach(key => simpleCache.set(key, `value-${key}`));
  })
  .add('LRU set (max 100)', () => {
    testData.forEach(key => lru.set(key, `value-${key}`));
  })
  .add('Map get (hit)', () => {
    testData.slice(0, 100).forEach(key => simpleCache.get(key));
  })
  .add('LRU get (hit)', () => {
    testData.slice(0, 100).forEach(key => lru.get(key));
  })
  .add('Map get (miss)', () => {
    testData.slice(500, 600).forEach(key => simpleCache.get(key));
  })
  .add('LRU get (miss)', () => {
    testData.slice(500, 600).forEach(key => lru.get(key));
  });

await bench.warmup();
await bench.run();
```

### 4.2 Cache Hit Rate Benchmarks

Measure performance at different cache hit rates:

```typescript
function createBenchmarkWithHitRate(hitRate: number) {
  const totalRequests = 1000;
  const cacheHits = Math.floor(totalRequests * hitRate);
  const cacheMisses = totalRequests - cacheHits;

  const cachedKeys = Array.from({ length: cacheHits }, (_, i) => `cached-${i}`);
  const uncachedKeys = Array.from(
    { length: cacheMisses },
    (_, i) => `uncached-${i}`
  );

  // Pre-warm cache
  const cache = new Map();
  cachedKeys.forEach(key => cache.set(key, `value-${key}`));

  return {
    add: (bench: Bench, name: string) => {
      bench.add(`${name} (${hitRate * 100}% hit rate)`, () => {
        [...cachedKeys, ...uncachedKeys].forEach(key => {
          if (cache.has(key)) {
            cache.get(key);
          } else {
            expensiveOperation(key);
            cache.set(key, `value-${key}`);
          }
        });
      });
    },
  };
}

// Create benchmarks for different hit rates
[0.0, 0.25, 0.5, 0.75, 0.9, 1.0].forEach(hitRate => {
  const scenario = createBenchmarkWithHitRate(hitRate);
  scenario.add(bench, 'cache performance');
});
```

### 4.3 Cache Invalidation Benchmarks

Measure the cost of cache invalidation strategies:

```typescript
bench
  .add('time-based invalidation (check every time)', () => {
    const now = Date.now();
    if (now - cacheTimestamp > TTL) {
      cache.clear();
      cacheTimestamp = now;
    }
    cache.get('key');
  })
  .add('lazy invalidation (check on miss)', () => {
    if (!cache.has('key') || isExpired(cache.get('key'))) {
      cache.set('key', fetchValue());
    }
    cache.get('key');
  })
  .add('proactive invalidation (background refresh)', () => {
    // Simulated background refresh
    if (Math.random() < 0.01) {
      // 1% chance
      cache.set('key', fetchValue());
    }
    cache.get('key');
  });
```

---

## 5. Measuring and Reporting Performance Improvements

### 5.1 Benchmark Result Metrics

Tinybench provides comprehensive metrics:

```typescript
interface TaskResult {
  error?: unknown; // Last error thrown
  totalTime: number; // Total time (ms)
  min: number; // Minimum sample time
  max: number; // Maximum sample time
  hz: number; // Operations per second
  period: number; // Time per operation (ms)
  samples: number[]; // All sample times
  mean: number; // Average time
  variance: number; // Sample variance
  sd: number; // Standard deviation
  sem: number; // Standard error of mean
  df: number; // Degrees of freedom
  critical: number; // Critical value
  moe: number; // Margin of error
  rme: number; // Relative margin of error (%)
  p75: number; // 75th percentile
  p99: number; // 99th percentile
  p995: number; // 99.5th percentile
  p999: number; // 99.9th percentile
}
```

### 5.2 Performance Improvement Calculation

```typescript
function calculateImprovement(baseline: TaskResult, optimized: TaskResult) {
  const opsPerSecondImprovement =
    ((optimized.hz - baseline.hz) / baseline.hz) * 100;
  const latencyImprovement =
    ((baseline.mean - optimized.mean) / baseline.mean) * 100;

  return {
    opsPerSecond: {
      baseline: baseline.hz.toFixed(0),
      optimized: optimized.hz.toFixed(0),
      improvement: opsPerSecondImprovement.toFixed(2) + '%',
      speedup: (optimized.hz / baseline.hz).toFixed(2) + 'x',
    },
    latency: {
      baseline: baseline.mean.toFixed(4) + ' ms',
      optimized: optimized.mean.toFixed(4) + ' ms',
      improvement: latencyImprovement.toFixed(2) + '%',
    },
    percentiles: {
      p99: {
        baseline: baseline.p99.toFixed(4) + ' ms',
        optimized: optimized.p99.toFixed(4) + ' ms',
        improvement:
          (((baseline.p99 - optimized.p99) / baseline.p99) * 100).toFixed(2) +
          '%',
      },
    },
  };
}
```

### 5.3 Reporting Formats

#### Console Table Format

```typescript
console.table(bench.table());

// Output:
// ┌─────────┬──────────────────┬──────────┬─────────────────┬──────────┬─────────┐
// │ (index) │   Task Name      │ ops/sec  │  Avg Time (ns)  │  Margin   │ Samples │
// ├─────────┼──────────────────┼──────────┼─────────────────┼──────────┼─────────┤
// │    0    │ 'baseline'       │ '1,234'  │ 810.37          │ '±2.15%'  │  617    │
// │    1    │ 'optimized'      │ '2,468'  │ 405.19          │ '±1.89%'  │ 1234    │
// └─────────┴──────────────────┴──────────┴─────────────────┴──────────┴─────────┘
```

#### Markdown Report Format

```typescript
function generateMarkdownReport(bench: Bench): string {
  const results = bench.tasks.map(task => ({
    name: task.name,
    result: task.result!,
  }));

  const baseline = results[0];
  const optimized = results[1];
  const improvement = calculateImprovement(baseline.result, optimized.result);

  return `
# Benchmark Results

## Summary

${optimized.name} is **${improvement.opsPerSecond.speedup} faster** than ${baseline.name}

## Performance Metrics

| Metric | Baseline | Optimized | Improvement |
|--------|----------|-----------|-------------|
| Operations/sec | ${improvement.opsPerSecond.baseline} | ${improvement.opsPer.second.optimized} | ${improvement.opsPerSecond.improvement} |
| Avg latency | ${improvement.latency.baseline} | ${improvement.latency.optimized} | ${improvement.latency.improvement} |
| P99 latency | ${improvement.percentiles.p99.baseline} | ${improvement.percentiles.p99.optimized} | ${improvement.percentiles.p99.improvement} |

## Detailed Results

\`\`\`
${console.table(bench.table())}
\`\`\`

## Environment

- Node.js: ${process.version}
- Platform: ${process.platform} ${process.arch}
- CPU: ${os.cpus()[0].model}
- Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
- Date: ${new Date().toISOString()}
`;
}

console.log(generateMarkdownReport(bench));
```

#### JSON Format for CI/CD

```typescript
function generateJSONReport(bench: Bench) {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cpu: os.cpus()[0].model,
        memory: os.totalmem(),
      },
      results: bench.tasks.map(task => ({
        name: task.name,
        metrics: task.result,
      })),
    },
    null,
    2
  );
}

// Write to file for trend analysis
await writeFile('benchmark-results.json', generateJSONReport(bench));
```

### 5.4 Comparison Format

Compare multiple runs:

```typescript
interface BenchmarkHistory {
  timestamp: string;
  commit: string;
  results: TaskResult[];
}

function compareBenchmarkRuns(
  current: BenchmarkHistory,
  previous: BenchmarkHistory
) {
  return current.results.map((currentResult, i) => {
    const previousResult = previous.results[i];
    const change =
      ((currentResult.hz - previousResult.hz) / previousResult.hz) * 100;

    return {
      name: currentResult.name,
      status:
        change > 5 ? '✅ Improved' : change < -5 ? '❌ Regressed' : '➡️ Stable',
      change: change.toFixed(2) + '%',
      previous: previousResult.hz.toFixed(0) + ' ops/sec',
      current: currentResult.hz.toFixed(0) + ' ops/sec',
    };
  });
}
```

---

## 6. Implementation Checklist

### 6.1 Setup

- [ ] Install tinybench: `npm install -D tinybench`
- [ ] Create benchmark directory: `src/benchmarks/`
- [ ] Add benchmark script to package.json: `"bench": "tsx src/benchmarks/*.bench.ts"`

### 6.2 Benchmark Structure

Create benchmarks following this structure:

```
src/benchmarks/
├── resource-monitor.bench.ts     # Resource monitoring benchmarks
├── cache-performance.bench.ts    # Cache hit/miss benchmarks
├── io-operations.bench.ts        # File system benchmarks
├── cpu-operations.bench.ts       # Computation benchmarks
└── utils/
    └── benchmark-helpers.ts      # Shared benchmark utilities
```

### 6.3 Running Benchmarks

```bash
# Run all benchmarks
npm run bench

# Run specific benchmark
npx tsx src/benchmarks/resource-monitor.bench.ts

# Run with GC exposed (for memory benchmarks)
node --expose-gc -r tsx src/benchmarks/memory.bench.ts
```

---

## 7. Key Takeaways

### Framework Selection

- **Use tinybench** for Vitest projects
- Native TypeScript support, modern API, excellent statistical analysis
- 7KB footprint with no dependencies

### Benchmark Patterns

- **Always use warmup()** to account for V8 JIT compilation
- **Use async/await** for I/O operations
- **Prevent dead code elimination** by using results
- **Isolate measurements** from setup/teardown

### I/O vs CPU

- **I/O operations**: Longer time (2000ms+), fewer iterations, expect high variance
- **CPU operations**: Standard time (500-1000ms), many iterations, expect low variance

### Cache Benchmarks

- Measure **cold cache** (all misses), **warm cache** (mix), and **hot cache** (all hits)
- Track **hit rates** at different percentages (0%, 25%, 50%, 75%, 90%, 100%)
- Include **invalidation overhead** in benchmarks

### Reporting

- Use **console.table()** for quick visual feedback
- Generate **Markdown reports** for documentation
- Export **JSON** for CI/CD trend analysis
- Calculate **percentage improvements** and **speedup factors**

---

## 8. Recommended Next Steps

1. **Install tinybench** and create basic benchmark structure
2. **Benchmark existing resource monitor code** to establish baselines
3. **Identify hot spots** through profiling (clinic.js, 0x)
4. **Implement optimizations** based on benchmark data
5. **Create before/after comparisons** to validate improvements
6. **Set up CI benchmark tracking** to catch regressions

---

## References

- [Tinybench Documentation](https://github.com/tinylibs/tinybench)
- [Vitest Documentation](https://vitest.dev/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [V8 Optimization Guide](https://v8.dev/blog/components)
- [Benchmark.js (for comparison)](https://benchmarkjs.com/)

**Generated:** 2026-01-24
**Project:** hacky-hack
**Task:** P3M1T2S1
