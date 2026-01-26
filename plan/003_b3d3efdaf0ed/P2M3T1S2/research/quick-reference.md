# Quick Reference: MetricsCollector Implementation

**For the AI Agent implementing P2M3T1S2**

---

## TL;DR - What to Build

Create a `MetricsCollector` class that tracks:

1. **Task durations** (min, max, avg, p95) per subtask
2. **Agent token usage** (input/output) per agent type
3. **Cache stats** (hits, misses, hit rate)
4. **Resource snapshots** (memory, file handles)
5. **Custom counters/gauges** for extensibility

Export to JSON via `--metrics-output <path>` CLI option.
Keep overhead <5%. 100% test coverage.

---

## File Creation Checklist

- [ ] `src/utils/metrics-collector.ts` - Main implementation
- [ ] `src/utils/token-counter.ts` - Token tracking utility
- [ ] `tests/unit/utils/metrics-collector.test.ts` - Unit tests
- [ ] Modify `src/workflows/prp-pipeline.ts` - Integration
- [ ] Modify `src/cli/index.ts` - CLI option
- [ ] Modify `src/utils/cache-manager.ts` - Cache stats

---

## Key Code Patterns

### MetricsCollector Structure

```typescript
import { EventEmitter } from 'events';
import type { Logger } from './logger.js';

export class MetricsCollector extends EventEmitter {
  private taskTimings: Map<string, TimingMetric>;
  private agentTokens: Map<string, TokenUsage>;
  private cacheStats = { hits: 0, misses: 0 };
  private resourceSnapshots: ResourceSnapshot[] = [];
  private readonly maxSnapshots = 1000;

  constructor(private readonly logger: Logger) {
    super();
  }

  recordTaskTiming(taskId: string, duration: number): void {
    // Update timing stats, emit event
  }

  recordTokenUsage(
    agentType: 'architect' | 'researcher' | 'coder' | 'qa',
    inputTokens: number,
    outputTokens: number
  ): void {
    // Accumulate token counts, emit event
  }

  recordCacheHit(): void {
    this.cacheStats.hits++;
  }
  recordCacheMiss(): void {
    this.cacheStats.misses++;
  }

  recordResourceSnapshot(snapshot: ResourceSnapshot): void {
    this.resourceSnapshots.push(snapshot);
    if (this.resourceSnapshots.length > this.maxSnapshots) {
      this.resourceSnapshots.shift(); // Circular buffer
    }
  }

  getSnapshot(): MetricsSnapshot {
    // Calculate hit rate, percentiles, return complete snapshot
  }

  async exportToFile(filePath: string): Promise<void> {
    // Atomic write: temp file + rename
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(this.getSnapshot(), null, 2));
    await rename(tempPath, filePath);
  }
}
```

### PRPPipeline Integration

```typescript
export class PRPPipeline extends Workflow {
  private metricsCollector?: MetricsCollector;

  constructor(
    prdPath: string,
    options: PipelineOptions,
    private readonly metricsOutputPath?: string
  ) {
    super();
    // ... existing code ...
    if (metricsOutputPath) {
      this.metricsCollector = new MetricsCollector(
        this.correlationLogger.child({ component: 'Metrics' })
      );
    }
  }

  async executeBacklog(): Promise<void> {
    for (const subtask of this.getExecutableSubtasks()) {
      const startTime = Date.now();
      try {
        await this.executeSubtask(subtask);
        const duration = Date.now() - startTime;
        this.metricsCollector?.recordTaskTiming(subtask.id, duration);
      } catch (error) {
        // ... error handling ...
      }
    }
  }

  async exportMetrics(): Promise<void> {
    if (this.metricsCollector && this.metricsOutputPath) {
      await this.metricsCollector.exportToFile(this.metricsOutputPath);
    }
  }
}
```

### CLI Option Addition

```typescript
// In src/cli/index.ts
.option('--metrics-output <path>', 'Export performance metrics to JSON file')

// In argument processing
const metricsOutputPath = options.metricsOutput as string | undefined;

// Pass to PRPPipeline
const pipeline = new PRPPipeline(prdPath, parsedOptions, metricsOutputPath);
```

### Cache Statistics

```typescript
// In src/utils/cache-manager.ts
export class CacheManager {
  private hits = 0;
  private misses = 0;

  async get(taskId: string, taskHash: string): Promise<PRP | null> {
    // ... existing logic ...
    if (cacheHit) {
      this.hits++;
      return cachedPRP;
    }
    this.misses++;
    return null;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      totalRequests: total,
    };
  }
}
```

---

## Critical Gotchas (READ THESE!)

1. **ES Module .js extensions**: `import { X } from './file.js';` not `./file`
2. **Atomic file writes**: Use temp file + rename pattern for metrics export
3. **Limit sample sizes**: Max 10K timing samples, 1K resource snapshots
4. **Non-blocking I/O**: Use async operations for file writes, sync for metric recording
5. **Optional chaining**: `this.metricsCollector?.recordTaskTiming(...)` for conditional calls
6. **Logger dynamic import**: Don't import logger at module level, use `getLogger()`
7. **CLI validation**: All numeric options accept string|number, validate as numbers
8. **Percentile calculation**: Calculate on-demand (in getSnapshot), not on every record
9. **Memory circular buffer**: Shift array when exceeding maxSnapshots
10. **Token extraction**: Provide fallback to 0 if usage metadata missing

---

## Testing Requirements

### Test Structure

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MetricsCollector } from '../../../src/utils/metrics-collector.js';

describe('utils/metrics-collector', () => {
  let collector: MetricsCollector;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(() => mockLogger),
    };
    collector = new MetricsCollector(mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Timing', () => {
    it('should record task duration', () => {
      collector.recordTaskTiming('P1M1T1S1', 1000);
      const snapshot = collector.getSnapshot();
      expect(snapshot.taskTimings['P1M1T1S1'].count).toBe(1);
      expect(snapshot.taskTimings['P1M1T1S1'].avg).toBe(1000);
    });

    it('should calculate min/max correctly', () => {
      collector.recordTaskTiming('P1M1T1S1', 1000);
      collector.recordTaskTiming('P1M1T1S1', 2000);
      collector.recordTaskTiming('P1M1T1S1', 500);
      const timing = collector.getSnapshot().taskTimings['P1M1T1S1'];
      expect(timing.min).toBe(500);
      expect(timing.max).toBe(2000);
    });

    it('should calculate percentiles correctly', () => {
      // Add samples in random order
      collector.recordTaskTiming('P1M1T1S1', 100);
      collector.recordTaskTiming('P1M1T1S1', 500);
      collector.recordTaskTiming('P1M1T1S1', 300);
      collector.recordTaskTiming('P1M1T1S1', 200);
      collector.recordTaskTiming('P1M1T1S1', 400);
      const timing = collector.getSnapshot().taskTimings['P1M1T1S1'];
      expect(timing.p50).toBe(300); // Median
      expect(timing.p95).toBeGreaterThan(400);
    });
  });

  describe('Token Usage', () => {
    it('should track tokens per agent type', () => {
      collector.recordTokenUsage('architect', 1000, 500);
      collector.recordTokenUsage('architect', 2000, 1000);
      const tokens = collector.getSnapshot().agentTokens['architect'];
      expect(tokens.inputTokens).toBe(3000);
      expect(tokens.outputTokens).toBe(1500);
      expect(tokens.totalTokens).toBe(4500);
      expect(tokens.requestCount).toBe(2);
    });
  });

  describe('Cache Statistics', () => {
    it('should calculate hit rate correctly', () => {
      collector.recordCacheHit();
      collector.recordCacheHit();
      collector.recordCacheMiss();
      const stats = collector.getSnapshot().cacheStats;
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(2 / 3);
    });
  });

  describe('Resource Snapshots', () => {
    it('should limit snapshots to maxSnapshots', () => {
      const maxSnapshots = 1000;
      for (let i = 0; i < maxSnapshots + 100; i++) {
        collector.recordResourceSnapshot({
          timestamp: Date.now(),
          heapUsed: 1000000,
          heapTotal: 2000000,
          rss: 3000000,
          fileHandles: 100,
          fileHandleUlimit: 1024,
        });
      }
      const snapshot = collector.getSnapshot();
      expect(snapshot.resourceSnapshots.length).toBe(maxSnapshots);
    });
  });

  describe('Export to File', () => {
    it('should export metrics to JSON file', async () => {
      const testPath = '/tmp/test-metrics.json';
      collector.recordTaskTiming('P1M1T1S1', 1000);
      await collector.exportToFile(testPath);

      const fs = await import('node:fs/promises');
      const data = JSON.parse(await fs.readFile(testPath, 'utf-8'));
      expect(data.metadata.collectedAt).toBeDefined();
      expect(data.taskTimings['P1M1T1S1']).toBeDefined();
    });
  });
});
```

---

## Validation Commands

```bash
# Level 1: Syntax
npx eslint src/utils/metrics-collector.ts --fix
npx tsc --noEmit
npx prettier --write src/utils/metrics-collector.ts

# Level 2: Tests
npm test -- tests/unit/utils/metrics-collector.test.ts --run
npm test -- tests/unit/utils/metrics-collector.test.ts --coverage --run

# Level 3: Integration
./bin/prd.js --help | grep metrics-output
./bin/prd.js --prd ./test/fixtures/simple-prd.ts \
  --metrics-output /tmp/test-metrics.json --dry-run
cat /tmp/test-metrics.json | jq .

# Level 4: Performance
# Run with and without metrics, compare durations
time ./bin/prd.js --prd ./test/fixtures/simple-prd.ts --no-cache
time ./bin/prd.js --prd ./test/fixtures/simple-prd.ts --no-cache \
  --metrics-output /tmp/metrics.json
# Overhead should be <5%
```

---

## Success Criteria

- [ ] MetricsCollector class created with all required methods
- [ ] Task timing with min/max/avg/p95 recorded
- [ ] Agent token usage tracked per agent type
- [ ] Cache statistics calculated
- [ ] Resource snapshots collected (circular buffer)
- [ ] Custom counters/gauges functional
- [ ] CLI option `--metrics-output` working
- [ ] Metrics export to JSON (atomic write)
- [ ] 100% test coverage
- [ ] Performance overhead <5%

---

## If You Get Stuck

1. **Check PRP.md**: Full implementation blueprint with all patterns
2. **Check system_context.md**: Groundswell integration details
3. **Check existing code**: ResourceMonitor, Logger patterns
4. **Check research summary**: `/research/summary.md`
5. **Check external research**: `/research/metrics-collection-research.md`

---

## Estimated Implementation Time

- MetricsCollector class: 2-3 hours
- TokenCounter utility: 1 hour
- PRPPipeline integration: 1-2 hours
- CLI option: 30 minutes
- Cache instrumentation: 30 minutes
- Tests: 2-3 hours
- Validation: 1 hour

**Total: 8-11 hours** for experienced developer
