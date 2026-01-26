# PRP: P2M3T1S2 - Add Performance Metrics Collection

---

## Goal

**Feature Goal**: Implement a comprehensive metrics collection system that tracks performance metrics throughout the PRP Pipeline execution lifecycle, enabling observability for task duration, agent token usage, cache efficiency, and resource utilization.

**Deliverable**: A `MetricsCollector` class at `src/utils/metrics-collector.ts` integrated with `PRPPipeline`, with CLI option `--metrics-output` for exporting metrics to JSON file, and comprehensive unit tests at `tests/unit/metrics-collector.test.ts`.

**Success Definition**:
- MetricsCollector tracks task execution duration (min, max, avg, p95)
- Agent token usage is tracked per agent (input/output tokens)
- Cache hit/miss rates are calculated and reported
- Resource usage (memory, file handles) is collected at intervals
- Custom counters and gauges can be created and tracked
- Metrics are exported to JSON via `--metrics-output <path>` CLI option
- All metrics collection has <5% performance overhead
- 100% test coverage with Vitest

## User Persona

**Target User**: Pipeline operators and system administrators who need visibility into PRP Pipeline performance characteristics.

**Use Case**: Analyzing pipeline execution patterns to identify bottlenecks, optimize resource allocation, and track efficiency over time.

**User Journey**:
1. User runs pipeline with `--metrics-output metrics.json`
2. Pipeline executes normally while collecting metrics in background
3. On completion, metrics.json contains comprehensive performance data
4. User analyzes metrics to identify optimization opportunities

**Pain Points Addressed**:
- No visibility into task duration distributions (which tasks are slowest)
- Unknown token usage per agent (cost tracking)
- Cache effectiveness unclear (is cache working?)
- Resource usage trends invisible (memory leaks, file handle growth)

## Why

- **Business Value**: Enables data-driven optimization of pipeline execution, reducing compute costs and improving throughput
- **Integration with Existing Features**: Builds upon enhanced logging (P2M3T1.S1) and resource monitoring (P2M3T1.S3)
- **Problems Solved**: Addresses observability gap identified in Phase 2 Milestone 3 requirements

---

## What

### User-Visible Behavior

1. **CLI Integration**: New `--metrics-output <path>` option writes metrics to specified JSON file on pipeline completion
2. **Metrics Categories**:
   - Task duration metrics per subtask (min, max, avg, p95 percentiles)
   - Agent token usage breakdown (Architect, Researcher, Coder, QA)
   - Cache statistics (hits, misses, hit rate)
   - Resource snapshots (memory, file handles over time)
3. **Performance**: Metrics collection overhead stays under 5% of total execution time
4. **Output Format**: Structured JSON with all metrics, timestamps, and metadata

### Success Criteria

- [ ] MetricsCollector class created at `src/utils/metrics-collector.ts`
- [ ] Tracks task duration with min/max/avg/p95 statistics
- [ ] Tracks agent token usage (input/output per agent type)
- [ ] Calculates cache hit/miss rates
- [ ] Records resource usage snapshots (memory, file handles)
- [ ] Supports custom counters and gauges
- [ ] Integrated with PRPPipeline for automatic collection
- [ ] CLI option `--metrics-output <path>` implemented
- [ ] Metrics exported to JSON file on pipeline completion
- [ ] 100% test coverage achieved
- [ ] Performance overhead <5%

---

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" Test**: This PRP provides all necessary context including file patterns, integration points, testing patterns, and code examples from the existing codebase.

### Documentation & References

```yaml
# MUST READ - Groundswell integration and existing patterns
- file: src/workflows/prp-pipeline.ts
  why: PRPPipeline class structure for metrics integration points
  pattern: Uses @Step decorator with trackTiming option, ResourceMonitor integration
  gotcha: Metrics collection must be non-blocking, use async operations

- file: src/utils/logger.ts
  why: Pino-based structured logging pattern to follow
  pattern: Child loggers for context, correlation ID tracking
  gotcha: Logger uses dynamic import to avoid circular dependency

- file: src/utils/resource-monitor.ts
  why: Existing resource monitoring patterns for memory/file handles
  pattern: Platform-specific detection, periodic polling, snapshots
  gotcha: Uses lazy evaluation to reduce overhead when resources stable

- file: src/cli/index.ts
  why: CLI options pattern and validation approach
  pattern: Commander.js with custom validation functions
  gotcha: All numeric options accept string|number, validate as numbers

- file: src/core/models.ts
  why: Type definitions for task hierarchy and Status enum
  pattern: Readonly properties, Zod schema validation
  gotcha: Status type is a union of string literals

- file: tests/unit/utils/logger.test.ts
  why: Testing pattern for utility classes with Pino mocks
  pattern: beforeEach/afterEach setup, factory functions for test data
  gotcha: Mock pino dynamically to avoid import issues

- file: research/metrics-collection-research.md
  why: Comprehensive TypeScript metrics collection patterns
  section: Complete implementation examples for timing metrics, percentiles, resource monitoring
  critical: Provides production-ready patterns for MetricsCollector class

- url: https://nodejs.org/api/perf_hooks.html
  why: Node.js Performance API for high-precision timing
  critical: Use performance.now() for accurate duration measurements

- url: https://nodejs.org/api/process.html#process_process_memoryusage
  why: Node.js process.memoryUsage() API for heap monitoring
  critical: Returns rss, heapTotal, heapUsed, external, arrayBuffers

# GROUNDSWELL DECORATORS
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Understanding Groundswell @Step decorator timing capabilities
  section: Lines 36-56 describe Groundswell decorator usage
  critical: @Step({ trackTiming: true }) provides automatic timing collection

# TOKEN TRACKING CONTEXT
- file: src/agents/prp-runtime.ts
  why: PRPRuntime orchestrates agent execution, token tracking point
  pattern: Agent execution returns results with token counts
  gotcha: Token counts must be extracted from agent response metadata

# CACHE STATISTICS CONTEXT
- file: src/utils/cache-manager.ts
  why: Existing cache implementation for hit/miss tracking
  pattern: Cache has get/set methods with success/failure tracking
  gotcha: Need to instrument cache operations to collect metrics
```

### Current Codebase Tree

```bash
src/
├── utils/
│   ├── logger.ts                    # Pino-based structured logging
│   ├── resource-monitor.ts          # Memory and file handle monitoring
│   ├── cache-manager.ts             # PRP cache with TTL
│   ├── progress.ts                  # Progress tracking utilities
│   └── progress-display.ts          # Real-time progress display
├── workflows/
│   └── prp-pipeline.ts              # Main pipeline orchestration
├── agents/
│   ├── agent-factory.ts             # Agent creation factory
│   └── prp-runtime.ts               # PRP execution runtime
├── core/
│   ├── session-manager.ts           # Session state management
│   ├── task-orchestrator.ts         # Task execution coordination
│   └── models.ts                    # Type definitions
└── cli/
    └── index.ts                     # CLI argument parsing

tests/
└── unit/
    └── utils/
        ├── logger.test.ts           # Logger testing pattern
        ├── resource-monitor.test.ts # Resource monitor testing pattern
        └── cache-manager.test.ts    # Cache manager testing
```

### Desired Codebase Tree (After Implementation)

```bash
src/
├── utils/
│   ├── logger.ts
│   ├── resource-monitor.ts
│   ├── cache-manager.ts
│   ├── metrics-collector.ts         # NEW: Main metrics collection class
│   └── token-counter.ts             # NEW: Token usage tracking utility
├── workflows/
│   └── prp-pipeline.ts              # MODIFIED: Integrate MetricsCollector
└── cli/
    └── index.ts                     # MODIFIED: Add --metrics-output option

tests/
└── unit/
    └── utils/
        ├── logger.test.ts
        ├── resource-monitor.test.ts
        ├── cache-manager.test.ts
        └── metrics-collector.test.ts # NEW: MetricsCollector tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports require .js extensions
import { MetricsCollector } from './utils/metrics-collector.js';  // ✓ Correct
import { MetricsCollector } from './utils/metrics-collector';     // ✗ Wrong

// CRITICAL: Logger uses dynamic import to avoid circular dependency
const logger = getLogger('MetricsCollector');  // ✓ Works
// Avoid: import { logger } from './logger.js' at module level

// CRITICAL: ResourceMonitor has lazy evaluation - check before collecting
if (!monitor.config.disabled) {
  const snapshot = monitor.getCurrentSnapshot();  // ✓ Safe
}

// CRITICAL: Agent token counts are in response metadata
interface AgentResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// CRITICAL: Cache hit detection requires metadata
interface CacheMetadata {
  taskId: string;
  taskHash: string;
  createdAt: number;
  accessedAt: number;
  version: string;
}
// Cache hit = taskHash matches current task hash

// CRITICAL: CLI options accept string|number, validate programmatically
option('--max-tasks <number>', 'Max tasks')
  .argParser((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) throw new Error('Must be positive integer');
    return num;
  });

// CRITICAL: Percentile calculation - limit sample size for memory
// Use reservoir sampling for large datasets (>10K samples)
class TimingMetric {
  private values: number[] = [];
  private readonly maxSamples = 10000;  // Prevent memory growth
  record(duration: number): void {
    if (this.values.length < this.maxSamples) {
      this.values.push(duration);
    }
  }
}

// CRITICAL: File writes must be atomic for metrics output
// Use temp file + rename pattern
async function writeMetrics(path: string, data: unknown): Promise<void> {
  const tempPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2));
  await rename(tempPath, path);
}

// CRITICAL: Groundswell @Step decorator provides timing
@Step({ trackTiming: true })
async executeTask(): Promise<void> {
  // Timing automatically collected by Groundswell
  // Access via: this.getStepMetrics('executeTask')
}

// CRITICAL: Performance overhead must stay <5%
// Use sampling for high-frequency metrics
class MetricsCollector {
  private sampleRate = 0.1;  // 10% sampling
  shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }
}
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// ===== src/utils/metrics-collector.ts =====

/**
 * Timing statistics with percentiles
 */
interface TimingMetric {
  count: number;           // Number of samples
  min: number;             // Minimum duration (ms)
  max: number;             // Maximum duration (ms)
  avg: number;             // Average duration (ms)
  p50: number;             // Median (ms)
  p95: number;             // 95th percentile (ms)
  p99: number;             // 99th percentile (ms)
}

/**
 * Token usage per agent
 */
interface TokenUsage {
  agentType: 'architect' | 'researcher' | 'coder' | 'qa';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;         // 0-1
  totalRequests: number;
}

/**
 * Resource snapshot
 */
interface ResourceSnapshot {
  timestamp: number;       // Milliseconds since epoch
  heapUsed: number;        // Bytes
  heapTotal: number;       // Bytes
  rss: number;             // Bytes
  fileHandles: number;
  fileHandleUlimit: number;
}

/**
 * Counter metric (monotonically increasing)
 */
interface CounterMetric {
  value: number;
  increments: number;
}

/**
 * Gauge metric (arbitrary up/down values)
 */
interface GaugeMetric {
  value: number;
  lastUpdated: number;     // Timestamp
}

/**
 * Complete metrics snapshot for export
 */
interface MetricsSnapshot {
  metadata: {
    collectedAt: string;   // ISO timestamp
    pipelineDuration: number; // Total pipeline duration (ms)
    sessionPath: string;
    correlationId: string;
  };
  taskTimings: Record<string, TimingMetric>;    // taskId -> timing stats
  agentTokens: Record<string, TokenUsage>;      // agentType -> usage
  cacheStats: CacheStats;
  resourceSnapshots: ResourceSnapshot[];
  customCounters: Record<string, CounterMetric>;
  customGauges: Record<string, GaugeMetric>;
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/utils/metrics-collector.ts
  - IMPLEMENT: MetricsCollector class with timing, token, cache, resource metrics
  - FOLLOW pattern: src/utils/resource-monitor.ts (periodic monitoring, snapshots)
  - NAMING: MetricsCollector class, record* methods for data collection
  - PLACEMENT: src/utils/ directory
  - DEPENDENCIES: Import Logger from logger.ts, ResourceMonitor interfaces

Task 2: CREATE src/utils/token-counter.ts
  - IMPLEMENT: TokenCounter utility for tracking agent token usage
  - FOLLOW pattern: Simple counter utility with agent type breakdown
  - NAMING: TokenCounter class with recordTokenUsage method
  - PLACEMENT: src/utils/ directory
  - DEPENDENCIES: None (standalone utility)

Task 3: MODIFY src/workflows/prp-pipeline.ts
  - INTEGRATE: Initialize MetricsCollector in constructor
  - ADD: metricsCollector field to PRPPipeline class
  - INSTRUMENT: Record task durations in executeBacklog method
  - INSTRUMENT: Record agent token usage after each agent call
  - INSTRUMENT: Record cache statistics from CacheManager
  - ADD: Export metrics on completion if --metrics-output provided
  - PRESERVE: All existing functionality, metrics collection is non-blocking

Task 4: MODIFY src/cli/index.ts
  - ADD: --metrics-output <path> CLI option to main command
  - VALIDATE: Path is valid writable location
  - INTEGRATE: Pass metricsOutputPath to PRPPipeline constructor
  - PRESERVE: All existing CLI options and validation

Task 5: MODIFY src/utils/cache-manager.ts
  - ADD: Hit/miss counters to CacheManager class
  - INSTRUMENT: Increment hit counter on cache hit
  - INSTRUMENT: Increment miss counter on cache miss
  - ADD: getStats() method returning CacheStats interface
  - PRESERVE: All existing cache functionality

Task 6: CREATE tests/unit/utils/metrics-collector.test.ts
  - IMPLEMENT: Unit tests for all MetricsCollector methods
  - FOLLOW pattern: tests/unit/utils/resource-monitor.test.ts (structure, mocks)
  - NAMING: describe('utils/metrics-collector') with feature-specific describes
  - COVERAGE: 100% coverage - all public methods tested
  - MOCK: Logger, ResourceMonitor, file system operations
  - PLACEMENT: tests/unit/utils/ directory

Task 7: MODIFY tests/unit/utils/cache-manager.test.ts
  - ADD: Tests for cache statistics tracking
  - VERIFY: Hit/miss counters increment correctly
  - VERIFY: getStats() returns accurate data
  - PRESERVE: All existing cache manager tests
```

### Implementation Patterns & Key Details

```typescript
// ===== Pattern 1: MetricsCollector Structure =====
// Follow ResourceMonitor pattern with periodic sampling and snapshots

import { EventEmitter } from 'events';
import { randomUUID } from 'node:crypto';
import { writeFile, rename } from 'node:fs/promises';

export class MetricsCollector extends EventEmitter {
  private taskTimings: Map<string, TimingMetric>;
  private agentTokens: Map<string, TokenUsage>;
  private resourceSnapshots: ResourceSnapshot[];
  private customCounters: Map<string, CounterMetric>;
  private customGauges: Map<string, GaugeMetric>;
  private readonly maxSnapshots = 1000;
  private startTime: number;

  constructor(private readonly logger: Logger) {
    super();
    this.taskTimings = new Map();
    this.agentTokens = new Map();
    this.resourceSnapshots = [];
    this.customCounters = new Map();
    this.customGauges = new Map();
    this.startTime = Date.now();
  }

  // Timing collection with percentile calculation
  recordTaskTiming(taskId: string, duration: number): void {
    const current = this.taskTimings.get(taskId) || this.createEmptyTiming();
    current.count++;
    current.min = Math.min(current.min, duration);
    current.max = Math.max(current.max, duration);
    // Store raw samples for percentile calculation (limit to 10K)
    // Calculate percentiles on demand in getSnapshot()
    this.taskTimings.set(taskId, this.updateTimingStats(current, duration));
    this.emit('taskTiming', { taskId, duration });
  }

  // Token usage tracking per agent
  recordTokenUsage(
    agentType: 'architect' | 'researcher' | 'coder' | 'qa',
    inputTokens: number,
    outputTokens: number
  ): void {
    const key = agentType;
    const current = this.agentTokens.get(key) || {
      agentType,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      requestCount: 0,
    };
    current.inputTokens += inputTokens;
    current.outputTokens += outputTokens;
    current.totalTokens += inputTokens + outputTokens;
    current.requestCount++;
    this.agentTokens.set(key, current);
    this.emit('tokenUsage', { agentType, inputTokens, outputTokens });
  }

  // Cache statistics
  recordCacheHit(): void {
    this.cacheStats.hits++;
    this.cacheStats.totalRequests++;
    this.emit('cacheHit');
  }

  recordCacheMiss(): void {
    this.cacheStats.misses++;
    this.cacheStats.totalRequests++;
    this.emit('cacheMiss');
  }

  // Resource snapshot collection
  recordResourceSnapshot(snapshot: ResourceSnapshot): void {
    this.resourceSnapshots.push(snapshot);
    // Keep last 1000 snapshots (circular buffer)
    if (this.resourceSnapshots.length > this.maxSnapshots) {
      this.resourceSnapshots.shift();
    }
    this.emit('resourceSnapshot', snapshot);
  }

  // Custom counter (monotonically increasing)
  incrementCounter(name: string, value: number = 1): void {
    const current = this.customCounters.get(name) || { value: 0, increments: 0 };
    current.value += value;
    current.increments++;
    this.customCounters.set(name, current);
  }

  // Custom gauge (arbitrary values)
  setGauge(name: string, value: number): void {
    this.customGauges.set(name, {
      value,
      lastUpdated: Date.now(),
    });
  }

  // Get complete metrics snapshot
  getSnapshot(): MetricsSnapshot {
    // Calculate hit rate
    const hitRate = this.cacheStats.totalRequests > 0
      ? this.cacheStats.hits / this.cacheStats.totalRequests
      : 0;

    return {
      metadata: {
        collectedAt: new Date().toISOString(),
        pipelineDuration: Date.now() - this.startTime,
        sessionPath: '', // Set by PRPPipeline
        correlationId: '', // Set by PRPPipeline
      },
      taskTimings: Object.fromEntries(
        Array.from(this.taskTimings.entries()).map(([id, timing]) =>
          [id, this.calculatePercentiles(timing)]
        )
      ),
      agentTokens: Object.fromEntries(this.agentTokens),
      cacheStats: { ...this.cacheStats, hitRate },
      resourceSnapshots: [...this.resourceSnapshots],
      customCounters: Object.fromEntries(this.customCounters),
      customGauges: Object.fromEntries(this.customGauges),
    };
  }

  // Export to JSON file (atomic write)
  async exportToFile(filePath: string): Promise<void> {
    const snapshot = this.getSnapshot();
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(snapshot, null, 2));
    await rename(tempPath, filePath);
    this.logger.info({ path: filePath }, 'Metrics exported');
  }

  // Helper: Calculate percentiles from timing samples
  private calculatePercentiles(timing: TimingMetric): TimingMetric {
    // Sort samples and calculate p50, p95, p99
    const samples = timing.samples || [];
    if (samples.length === 0) {
      return { ...timing, p50: timing.avg, p95: timing.avg, p99: timing.avg };
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const percentile = (p: number) => {
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, idx)];
    };
    return {
      ...timing,
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }
}

// ===== Pattern 2: PRPPipeline Integration =====
// Initialize in constructor, instrument throughout execution

export class PRPPipeline extends Workflow {
  private metricsCollector?: MetricsCollector;

  constructor(
    prdPath: string,
    options: PipelineOptions,
    metricsOutputPath?: string
  ) {
    super();
    // ... existing constructor code ...

    // Initialize metrics collector if output path provided
    if (metricsOutputPath) {
      this.metricsCollector = new MetricsCollector(
        this.correlationLogger.child({ component: 'Metrics' })
      );
      this.#metricsOutputPath = metricsOutputPath;
    }
  }

  @Step({ trackTiming: true })
  async executeBacklog(): Promise<void> {
    for (const subtask of this.getExecutableSubtasks()) {
      const startTime = Date.now();

      try {
        await this.executeSubtask(subtask);
        const duration = Date.now() - startTime;

        // Record task timing
        this.metricsCollector?.recordTaskTiming(subtask.id, duration);

        // Record resource snapshot after each task
        if (this.metricsCollector && !this.#disableMonitoring) {
          const snapshot = this.#getResourceSnapshot();
          this.metricsCollector.recordResourceSnapshot(snapshot);
        }
      } catch (error) {
        this.logger.error({ error, taskId: subtask.id }, 'Task failed');
        throw error;
      }
    }
  }

  // Export metrics on completion
  @Step({ trackTiming: true })
  async exportMetrics(): Promise<void> {
    if (this.metricsCollector && this.#metricsOutputPath) {
      const snapshot = this.metricsCollector.getSnapshot();
      snapshot.metadata.sessionPath = this.sessionManager.sessionDir;
      snapshot.metadata.correlationId = this.correlationLogger;

      await this.metricsCollector.exportToFile(this.#metricsOutputPath);
    }
  }
}

// ===== Pattern 3: Cache Statistics Tracking =====
// Add to existing CacheManager class

export class CacheManager {
  private hits = 0;
  private misses = 0;

  async get(taskId: string, taskHash: string): Promise<PRP | null> {
    const cachePath = this.getCachePath(taskId);
    try {
      const metadata = await this.loadMetadata(cachePath);
      if (metadata && metadata.taskHash === taskHash) {
        this.hits++;  // Record cache hit
        return this.loadPRP(cachePath);
      }
    } catch {
      // Cache miss or error
    }
    this.misses++;  // Record cache miss
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

// ===== Pattern 4: Agent Token Tracking =====
// Extract token usage from agent responses

async executeAgentWithTracking(
  agentType: 'architect' | 'researcher' | 'coder' | 'qa',
  prompt: string
): Promise<string> {
  const response = await this.agent.execute(prompt);

  // Extract token usage from response metadata
  // (Agent library returns usage in response metadata)
  const inputTokens = response.usage?.inputTokens || 0;
  const outputTokens = response.usage?.outputTokens || 0;

  this.metricsCollector?.recordTokenUsage(agentType, inputTokens, outputTokens);

  return response.content;
}
```

### Integration Points

```yaml
PIPELINE_INTEGRATION:
  - file: src/workflows/prp-pipeline.ts
  - add_to: Constructor - initialize MetricsCollector if --metrics-output provided
  - add_to: executeBacklog() - record task timing after each subtask
  - add_to: exportMetrics() - new Step method to export on completion
  - add_to: cleanup() - export metrics before final cleanup

CLI_INTEGRATION:
  - file: src/cli/index.ts
  - add_option: "--metrics-output <path>"
  - description: "Export performance metrics to JSON file"
  - validation: Path is valid writable directory
  - pass_to: PRPPipeline constructor

CACHE_INTEGRATION:
  - file: src/utils/cache-manager.ts
  - add_field: "private hits: number = 0"
  - add_field: "private misses: number = 0"
  - add_method: "getStats(): CacheStats"
  - instrument: "get()" method to track hits/misses

AGENT_INTEGRATION:
  - file: src/agents/prp-runtime.ts
  - instrument: Agent execution methods to extract token counts
  - callback: Pass token usage to MetricsCollector
  -时机: After each agent API call completes
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating metrics-collector.ts - fix before proceeding
npx eslint src/utils/metrics-collector.ts --fix     # Auto-format and fix linting
npx tsc --noEmit src/utils/metrics-collector.ts      # Type checking
npx prettier --write src/utils/metrics-collector.ts  # Ensure consistent formatting

# Project-wide validation after all modifications
npm run lint                                         # Full project lint
npm run typecheck                                    # Full project type check
npm run format                                       # Format all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test MetricsCollector as it's created
npm test -- tests/unit/utils/metrics-collector.test.ts --run

# Test cache manager statistics
npm test -- tests/unit/utils/cache-manager.test.ts --run

# Full test suite for utils directory
npm test -- tests/unit/utils/ --run

# Coverage validation (100% required)
npm test -- tests/unit/utils/metrics-collector.test.ts --coverage --run

# Expected: All tests pass with 100% coverage. If failing, debug root cause.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI option parsing
./bin/prd.js --help | grep metrics-output    # Verify option appears in help

# Test metrics export with sample pipeline
./bin/prd.js --prd ./test/fixtures/simple-prd.ts \
  --metrics-output /tmp/test-metrics.json \
  --dry-run

# Verify metrics file created
cat /tmp/test-metrics.json | jq .            # Pretty-print and validate structure

# Test metrics schema validation
cat <<'EOF' | node
const metrics = JSON.parse(require('fs').readFileSync('/tmp/test-metrics.json'));
console.log('metadata:', metrics.metadata);
console.log('taskTimings:', Object.keys(metrics.taskTimings));
console.log('agentTokens:', Object.keys(metrics.agentTokens));
console.log('cacheStats:', metrics.cacheStats);
EOF

# Expected: Valid JSON with all required fields present.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Performance Overhead Test (ensure <5%)
# Run pipeline 10 times without metrics, record average duration
for i in {1..10}; do
  time ./bin/prd.js --prd ./test/fixtures/simple-prd.ts --no-cache
done > /tmp/baseline.txt

# Run pipeline 10 times with metrics, record average duration
for i in {1..10}; do
  time ./bin/prd.js --prd ./test/fixtures/simple-prd.ts --no-cache \
    --metrics-output /tmp/metrics-$i.json
done > /tmp/with-metrics.txt

# Calculate overhead percentage
# Expected: <5% overhead for metrics collection

# Metrics Accuracy Validation
# Verify task timings match actual execution times
node <<'EOF'
const fs = require('fs');
const metrics = JSON.parse(fs.readFileSync('/tmp/metrics-1.json'));

// Verify timing data exists
if (Object.keys(metrics.taskTimings).length === 0) {
  console.error('ERROR: No task timings recorded');
  process.exit(1);
}

// Verify all timings are positive
for (const [taskId, timing] of Object.entries(metrics.taskTimings)) {
  if (timing.min < 0 || timing.avg < 0) {
    console.error(`ERROR: Invalid timing for ${taskId}`);
    process.exit(1);
  }
  console.log(`${taskId}: avg=${timing.avg}ms, p95=${timing.p95}ms`);
}

// Verify percentiles are monotonic
for (const [taskId, timing] of Object.entries(metrics.taskTimings)) {
  if (timing.p50 > timing.p95 || timing.p95 > timing.p99) {
    console.error(`ERROR: Invalid percentiles for ${taskId}`);
    process.exit(1);
  }
}

console.log('PASS: All metrics validations passed');
EOF

# Memory Leak Detection
# Run pipeline with metrics 100 times, monitor memory growth
for i in {1..100}; do
  ./bin/prd.js --prd ./test/fixtures/simple-prd.ts --no-cache \
    --metrics-output /tmp/metrics-$i.json
  node -e "console.log(process.memoryUsage().heapUsed)"
done | awk 'BEGIN{min=999999999999} {if($1<min)min=$1; if($1>max)max=$1} END{print "Min heap:",min, "Max heap:",max, "Growth:", max-min}'

# Expected: Memory growth <20MB over 100 iterations (no leak)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/ --run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format && npm run format:check`
- [ ] MetricsCollector class created at `src/utils/metrics-collector.ts`
- [ ] TokenCounter utility created at `src/utils/token-counter.ts`
- [ ] CLI option `--metrics-output` functional
- [ ] Metrics export to JSON working correctly

### Feature Validation

- [ ] Task duration metrics collected (min, max, avg, p50, p95, p99)
- [ ] Agent token usage tracked per agent type
- [ ] Cache statistics (hits, misses, hit rate) calculated
- [ ] Resource snapshots (memory, file handles) recorded
- [ ] Custom counters and gauges functional
- [ ] Metrics exported to JSON on pipeline completion
- [ ] Performance overhead <5% (measured via benchmark)
- [ ] Percentile calculations accurate

### Code Quality Validation

- [ ] Follows existing codebase patterns (ResourceMonitor, Logger)
- [ ] File placement matches desired codebase tree structure
- [ ] ES Module imports use .js extensions
- [ ] Logger uses dynamic import pattern
- [ ] File writes use atomic pattern (temp + rename)
- [ ] Percentile calculation limits sample size to prevent memory growth
- [ ] Metrics collection is non-blocking (async operations)
- [ ] Error handling follows existing patterns

### Documentation & Deployment

- [ ] JSDoc comments complete on all public methods
- [ ] Interface types documented with examples
- [ ] CLI help text describes `--metrics-output` option
- [ ] Metrics JSON schema documented
- [ ] Performance characteristics documented (<5% overhead)
- [ ] Integration with existing observability features documented

---

## Anti-Patterns to Avoid

- ❌ **Don't** use synchronous file I/O for metrics export - use async/promises
- ❌ **Don't** store unlimited raw samples - limit to 10K per metric
- ❌ **Don't** calculate percentiles on every record - defer to snapshot time
- ❌ **Don't** block pipeline execution for metrics collection - use async/emit patterns
- ❌ **Don't** forget .js extensions in ES Module imports
- ❌ **Don't** import Logger at module level - use dynamic import
- ❌ **Don't** skip atomic writes for metrics file - use temp + rename
- ❌ **Don't** collect metrics without checking if collector exists - use optional chaining
- ❌ **Don't** add metrics overhead to hot paths without sampling
- ❌ **Don't** create metrics without considering memory growth - use circular buffers
- ❌ **Don't** hardcode metric names - use constants for reusability
- ❌ **Don't** ignore performance overhead - measure and validate <5%
- ❌ **Don't** forget to handle cache manager miss/hit tracking - instrument both paths
- ❌ **Don't** assume agent responses have token counts - provide fallback to 0
- ❌ **Don't** create metrics without understanding Groundswell @Step timing - leverage existing
- ❌ **Don't** skip testing edge cases (empty metrics, no tasks, cache disabled)
- ❌ **Don't** export metrics without validating JSON structure - use schema validation
