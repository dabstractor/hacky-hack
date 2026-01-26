# Node.js System Resource Detection Research

## Node.js OS Module

**Official Documentation:** https://nodejs.org/api/os.html

### CPU Core Detection

```typescript
import * as os from 'node:os';

// Get CPU core count
const cpuCores = os.cpus().length;
console.log(`Number of logical CPU cores: ${cpuCores}`);

// Each core contains:
// {
//   model: 'Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz',
//   speed: 2600,
//   times: { user: 123456, nice: 0, sys: 456789, idle: 7890123, irq: 0 }
// }
```

### Memory Detection

```typescript
// System memory (bytes)
const totalMemory = os.totalmem(); // Total system memory
const freeMemory = os.freemem(); // Free system memory
const usedMemory = totalMemory - freeMemory;

// Convert to GB
const totalGB = totalMemory / 1024 ** 3;
const freeGB = freeMemory / 1024 ** 3;
```

### Process Memory (for backpressure)

```typescript
// V8 heap memory (already in resource-monitor.ts)
const mem = process.memoryUsage();
// Returns: { rss, heapTotal, heapUsed, external, arrayBuffers }

const memoryRatio = mem.heapUsed / mem.heapTotal;
```

## System-Aware Default Calculation

```typescript
import * as os from 'node:os';

export function calculateDefaultParallelism(): {
  maxConcurrency: number;
  recommendedConcurrency: number;
  cpuCores: number;
  totalMemoryGB: number;
} {
  const cpuCores = os.cpus().length;
  const totalMemoryGB = os.totalmem() / 1024 ** 3;

  // Conservative defaults: leave headroom for system processes
  const cpuBasedLimit = Math.max(1, cpuCores - 1); // Reserve 1 core
  const memoryBasedLimit = Math.floor(totalMemoryGB / 2); // 2GB per worker

  const maxConcurrency = Math.min(cpuBasedLimit, memoryBasedLimit);

  return {
    maxConcurrency: Math.max(1, maxConcurrency), // At least 1
    recommendedConcurrency: Math.max(1, cpuCores - 1),
    cpuCores,
    totalMemoryGB: Math.round(totalMemoryGB * 100) / 100,
  };
}
```

## Resource Validation Pattern

```typescript
export function validateParallelismConfig(parallelism: number): {
  valid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const systemInfo = calculateDefaultParallelism();

  // Warning: Parallelism exceeds CPU cores
  if (parallelism > systemInfo.cpuCores) {
    warnings.push(
      `Parallelism (${parallelism}) exceeds CPU cores (${systemInfo.cpuCores}). ` +
        `This may cause context switching overhead.`
    );
    recommendations.push(
      `Consider setting parallelism to ${systemInfo.recommendedConcurrency} or less.`
    );
  }

  // Warning: Memory constraints
  const estimatedMemoryMB = parallelism * 500; // 500MB per worker
  const availableMemoryGB = (os.freemem() / 1024 ** 3).toFixed(1);

  if (estimatedMemoryMB > parseFloat(availableMemoryGB) * 1024) {
    warnings.push(
      `Estimated memory usage (${estimatedMemoryMB}MB) may exceed available memory (${availableMemoryGB}GB).`
    );
    recommendations.push(`Reduce parallelism or increase system memory.`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
    recommendations,
  };
}
```

## Industry Best Practices

| Scenario          | Formula                       | Example (8-core, 16GB) |
| ----------------- | ----------------------------- | ---------------------- |
| CPU-bound tasks   | `cpuCores - 1`                | 7                      |
| I/O-bound tasks   | `cpuCores × 2-4`              | 16-24                  |
| Mixed workload    | `cpuCores`                    | 8                      |
| Low-memory system | `min(cpuCores, memoryGB / 2)` | 4                      |
| CI environment    | `2` (fixed)                   | 2                      |

## Missing from Current Codebase

**Status:** The codebase has:

- Memory monitoring (`process.memoryUsage()`)
- File handle monitoring (macOS-specific)
- **Missing:** CPU core detection via `os.cpus()`

**Note:** The default parallelism is hardcoded to 3 in ConcurrentTaskExecutor, regardless of system resources.

## CLI Warning Format

```typescript
function displayResourceWarnings(
  parallelism: number,
  systemInfo: ReturnType<typeof calculateDefaultParallelism>
): void {
  const warnings: string[] = [];

  // CPU warning
  if (parallelism > systemInfo.cpuCores) {
    warnings.push(
      `⚠️  Warning: Parallelism (${parallelism}) exceeds CPU cores (${systemInfo.cpuCores})`
    );
    warnings.push(
      `   This may cause performance degradation due to context switching.`
    );
    warnings.push(
      `   Recommended: --parallelism ${systemInfo.recommendedConcurrency}`
    );
  }

  // Memory warning
  const freeMemoryGB = (os.freemem() / 1024 ** 3).toFixed(1);
  if (parallelism > parseFloat(freeMemoryGB)) {
    warnings.push(
      `⚠️  Warning: High parallelism may exhaust memory (${freeMemoryGB}GB free)`
    );
    warnings.push(
      `   Consider reducing parallelism or closing memory-intensive applications.`
    );
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('\n' + warnings.join('\n'));
  }
}
```

## Key References

- Node.js OS Module: https://nodejs.org/api/os.html
- Node.js Process: https://nodejs.org/api/process.html#processmemoryusage
- Existing Resource Monitor: `/home/dustin/projects/hacky-hack/src/utils/resource-monitor.ts`
