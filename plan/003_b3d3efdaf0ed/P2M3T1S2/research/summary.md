# Research Summary: P2M3T1S2 - Add Performance Metrics Collection

**Research Date:** 2026-01-25
**Status:** Complete - PRP created with comprehensive context

---

## Executive Summary

Comprehensive research conducted for implementing performance metrics collection in the PRP Pipeline. All necessary context gathered from codebase analysis, external research, and architecture documentation to enable one-pass implementation success.

**Confidence Score:** 9/10 for one-pass implementation success

---

## Research Findings

### 1. Codebase Analysis Results

#### Groundswell Integration

- **Finding**: Groundswell `@Step({ trackTiming: true })` decorator provides automatic timing collection
- **Location**: Used throughout `src/workflows/prp-pipeline.ts`
- **Implication**: Can leverage existing timing data instead of manual timing for many operations
- **Pattern**:
  ```typescript
  @Step({ trackTiming: true })
  async executeTask(): Promise<void> {
    // Timing automatically collected
  }
  ```

#### Existing Monitoring Infrastructure

- **ResourceMonitor** (`src/utils/resource-monitor.ts`): Already tracks memory and file handles
- **Logger** (`src/utils/logger.ts`): Structured Pino-based logging with correlation IDs
- **ProgressDisplay** (`src/utils/progress-display.ts`): Real-time progress tracking
- **Implication**: MetricsCollector should follow similar patterns for consistency

#### PRPPipeline Structure

- **Main integration point**: `src/workflows/prp-pipeline.ts` line ~133+
- **Key methods for instrumentation**:
  - `executeBacklog()`: Record task timing after each subtask
  - Agent execution methods: Extract token usage
  - Cleanup: Export metrics before final cleanup
- **State tracking**: Uses `@ObservedState()` decorator for automatic tracking

### 2. Testing Patterns Analysis

#### Test Structure (from `tests/unit/utils/*.test.ts`)

- **Framework**: Vitest with 100% coverage requirement
- **Pattern**: Nested describe blocks with beforeEach/afterEach
- **Setup**: Factory functions for test data, extensive mocking
- **Assertions**: Comprehensive positive and negative test cases

#### Mock Patterns

```typescript
// Logger mock pattern
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

### 3. CLI Integration Patterns

#### From `src/cli/index.ts`

- **Library**: Commander.js
- **Pattern**: All numeric options accept `string | number`, validate programmatically
- **Validation**: Custom argParser functions with error throwing
- **Example**:
  ```typescript
  option('--max-tasks <number>', 'Max tasks').argParser(val => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) throw new Error('Must be positive integer');
    return num;
  });
  ```

### 4. Architecture Requirements

#### From Phase 2 Milestone 3 (Observability Features)

- **P2M3T1.S1**: Enhanced logging (COMPLETE) - use this pattern
- **P2M3T1.S2**: Performance metrics (THIS TASK) - implement now
- **P2M3T1.S3**: Progress display (COMPLETE) - integrate with
- **Constraint**: Performance overhead must stay <5%
- **Integration**: Build on enhanced logging infrastructure

### 5. External Research Highlights

#### TypeScript Metrics Collection Patterns

From `/home/dustin/projects/hacky-hack/research/metrics-collection-research.md`:

**Key Patterns Identified**:

1. **Event-driven architecture** using EventEmitter for metric updates
2. **Singleton pattern** for global metrics access (optional for this use case)
3. **Sampling support** to reduce overhead (10-20% default rate)
4. **Thread-safe operations** with proper Map usage
5. **Circular buffers** to limit memory growth (max 10K samples)

**Timing Metrics**:

- Three implementation strategies: Exact (small datasets), Reservoir Sampling (medium), T-Digest (production)
- **Recommendation**: Use exact calculation for development, can upgrade to T-Digest later
- **Percentiles**: Calculate p50, p95, p99 for meaningful distribution analysis

**Resource Monitoring**:

- Use `process.memoryUsage()` for V8 heap stats
- Use `os.totalmem()` and `os.freemem()` for system memory
- Platform-specific file handle monitoring (already in ResourceMonitor)

**JSON Export**:

- **Atomic writes**: Temp file + rename pattern
- **Async operations**: Use `fs/promises` for non-blocking I/O
- **Error handling**: Validate write success, log failures

#### Token Usage Tracking

- Track per agent type (Architect, Researcher, Coder, QA)
- Extract from response metadata: `usage.inputTokens`, `usage.outputTokens`
- Calculate costs if pricing data available

#### Cache Statistics

- Simple counter pattern: hits, misses, totalRequests
- Hit rate calculation: `hits / totalRequests`
- Instrument cache get/set methods

### 6. Critical Gotchas Identified

```typescript
// 1. ES Module .js extension requirement
import { MetricsCollector } from './metrics-collector.js';  // ✓

// 2. Logger dynamic import to avoid circular dependency
const logger = getLogger('MetricsCollector');  // ✓

// 3. ResourceMonitor lazy evaluation
if (!monitor.config.disabled) {
  const snapshot = monitor.getCurrentSnapshot();
}

// 4. Atomic file writes for metrics export
const tempPath = `${path}.${randomUUID()}.tmp`;
await writeFile(tempPath, JSON.stringify(data));
await rename(tempPath, path);

// 5. Limit sample sizes for memory management
private readonly maxSamples = 10000;

// 6. CLI option validation
.argParser((val) => {
  const num = parseInt(val, 10);
  if (isNaN(num)) throw new Error('Invalid number');
  return num;
});

// 7. Async metrics collection (non-blocking)
async recordTiming(name: string, duration: number): Promise<void>

// 8. Percentile calculation on demand (not every record)
private calculatePercentiles(timing: TimingMetric): TimingMetric
```

---

## Implementation Blueprint Summary

### Files to Create

1. **`src/utils/metrics-collector.ts`** (main implementation)
   - MetricsCollector class with timing, token, cache, resource metrics
   - EventEmitter for real-time updates
   - Export to JSON functionality

2. **`src/utils/token-counter.ts`** (utility)
   - TokenCounter class for agent token tracking
   - Breakdown by agent type

3. **`tests/unit/utils/metrics-collector.test.ts`** (tests)
   - 100% coverage required
   - Mock Logger, ResourceMonitor
   - Test all metric types

### Files to Modify

1. **`src/workflows/prp-pipeline.ts`**
   - Initialize MetricsCollector in constructor
   - Instrument task execution
   - Export metrics on completion

2. **`src/cli/index.ts`**
   - Add `--metrics-output <path>` option
   - Validate path is writable
   - Pass to PRPPipeline

3. **`src/utils/cache-manager.ts`**
   - Add hit/miss counters
   - Add `getStats()` method

### Data Models

```typescript
interface MetricsSnapshot {
  metadata: { collectedAt; pipelineDuration; sessionPath; correlationId };
  taskTimings: Record<string, TimingMetric>;
  agentTokens: Record<string, TokenUsage>;
  cacheStats: CacheStats;
  resourceSnapshots: ResourceSnapshot[];
  customCounters: Record<string, CounterMetric>;
  customGauges: Record<string, GaugeMetric>;
}
```

---

## Validation Strategy

### Level 1: Syntax & Style

- ESLint with auto-fix
- TypeScript type checking
- Prettier formatting

### Level 2: Unit Tests

- Vitest with 100% coverage
- Mock all external dependencies
- Test edge cases (empty metrics, no tasks)

### Level 3: Integration Testing

- CLI option parsing
- Metrics export functionality
- JSON schema validation

### Level 4: Performance Validation

- **Critical**: Measure overhead (<5% requirement)
- Compare execution with/without metrics
- Memory leak detection (100 iterations)

---

## Key Decisions Made

### 1. Percentile Calculation Strategy

- **Decision**: Use exact calculation for initial implementation
- **Rationale**: Dataset size limited by task count (typically <1000), exact calculation is fast enough
- **Future**: Can upgrade to T-Digest if performance issues arise

### 2. Sampling Strategy

- **Decision**: No sampling for task timings (every task counted)
- **Rationale**: Task count is limited, timing data is valuable
- **Sampling**: Consider for high-frequency custom gauges if needed

### 3. Memory Management

- **Decision**: Limit resource snapshots to 1000 samples
- **Rationale**: Circular buffer prevents unbounded growth
- **Pattern**: Follow ResourceMonitor's 20-snapshot pattern but larger for metrics

### 4. Async vs Sync

- **Decision**: Use async operations for all I/O, sync for metric recording
- **Rationale**: Recording must be fast (non-blocking), I/O can be async
- **Pattern**: `record*()` methods are sync, `exportToFile()` is async

### 5. Integration with Groundswell

- **Decision**: Leverage @Step timing but also record task-level timings
- **Rationale**: @Step provides pipeline-level timing, task timing needed for granularity
- **Pattern**: Record both for comprehensive visibility

---

## Risk Assessment

### Low Risk Items

- ✅ File I/O patterns well-established (atomic writes)
- ✅ CLI integration pattern clear (Commander.js)
- ✅ Testing patterns consistent (Vitest, mocks)

### Medium Risk Items

- ⚠️ Token extraction from agent responses (need to verify response structure)
- ⚠️ Performance overhead measurement (need benchmark baseline)
- ⚠️ Cache manager instrumentation (need to verify hit/miss detection logic)

### Mitigation Strategies

1. **Token extraction**: Provide fallback to 0 if usage metadata missing
2. **Performance overhead**: Measure early, optimize if >5%
3. **Cache instrumentation**: Add comprehensive tests for all cache paths

---

## Next Steps for Implementation

1. **Read PRP.md** - Complete context and implementation blueprint
2. **Create MetricsCollector class** - Follow Task 1 in PRP
3. **Create TokenCounter utility** - Follow Task 2 in PRP
4. **Modify PRPPipeline** - Follow Task 3 in PRP
5. **Add CLI option** - Follow Task 4 in PRP
6. **Instrument cache** - Follow Task 5 in PRP
7. **Write tests** - Follow Task 6 in PRP
8. **Validate** - Run all 4 validation levels

---

## Confidence Score Breakdown

| Factor                  | Score | Notes                                                  |
| ----------------------- | ----- | ------------------------------------------------------ |
| Context completeness    | 10/10 | All files analyzed, patterns documented                |
| Testing patterns        | 10/10 | Clear test structure, examples available               |
| Integration points      | 9/10  | PRPPipeline clear, token extraction needs verification |
| Performance constraints | 8/10  | <5% achievable, needs measurement                      |
| External research       | 10/10 | Comprehensive patterns documented                      |
| Code quality standards  | 10/10 | ESLint, TypeScript, Vitest patterns clear              |

**Overall Confidence: 9/10**

Highest confidence item: Context completeness and testing patterns
Lowest confidence item: Token extraction from agent responses (needs runtime verification)

---

## References

### Internal Documentation

- `plan/003_b3d3efdaf0ed/docs/system_context.md` - System architecture
- `plan/003_b3d3efdaf0ed/P2M3T1S2/PRP.md` - This PRP

### External Documentation

- Node.js Performance Hooks: https://nodejs.org/api/perf_hooks.html
- Node.js Process Memory: https://nodejs.org/api/process.html#process_process_memoryusage
- Node.js V8 Stats: https://nodejs.org/api/v8.html
- Vitest Testing: https://vitest.dev/

### Research Files

- `/home/dustin/projects/hacky-hack/research/metrics-collection-research.md` - Comprehensive patterns
- `/home/dustin/projects/hacky-hack/research/metrics-implementation-examples.md` - Code examples

### Source Code References

- `src/utils/logger.ts` - Logger pattern
- `src/utils/resource-monitor.ts` - Monitoring pattern
- `src/workflows/prp-pipeline.ts` - Integration point
- `src/cli/index.ts` - CLI pattern
- `tests/unit/utils/*.test.ts` - Testing patterns
