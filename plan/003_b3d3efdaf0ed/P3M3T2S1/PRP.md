# PRP: P3.M3.T2.S1 - Optimize Resource Monitoring Frequency

---

## Goal

**Feature Goal**: Reduce resource monitoring overhead in the PRP Pipeline by implementing intelligent monitoring frequency optimization, lazy evaluation, and configurable monitoring controls.

**Deliverable**:
1. Optimized `ResourceMonitor` with interval-based monitoring (monitor every Nth task)
2. Lazy evaluation mode (only check when limits are approached)
3. CLI options `--monitor-interval` and `--no-resource-monitor`
4. Benchmarks validating overhead reduction in `tests/benchmark/resource-monitoring.bench.test.ts`

**Success Definition**:
- Monitoring overhead reduced by 60-80% in typical workloads
- No resource exhaustion events go undetected
- All existing tests pass with new optimization enabled
- Benchmarks demonstrate measurable performance improvement

---

## Why

### Business Value

From `system_context.md` limitations (lines 479-482):
> **Resource Monitoring Overhead**: File handle counting via spawn adds overhead. Heap stats on every task execution.

The current implementation monitors resources after **every task completion**, which adds unnecessary overhead when:
- Resource usage is stable and far from limits
- Running hundreds of short-lived subtasks
- System has abundant resources available

### Integration with Existing Features

This optimization builds on **P3.M1.T2.S1** (macOS lsof caching) by adding:
- **Interval-based monitoring**: Monitor only every Nth task (configurable)
- **Lazy evaluation**: Skip checks when resources are at safe levels
- **Complete disable**: Allow users to disable monitoring entirely with `--no-resource-monitor`

### Problems Solved

1. **Performance**: Reduces monitoring overhead from 100% (every task) to 10-25% (configurable)
2. **Flexibility**: Users can trade off monitoring granularity for performance
3. **Control**: Production environments may disable monitoring for maximum throughput

---

## What

### User-Visible Behavior

#### CLI Options

```bash
# Monitor only every 5th task (default: 1 = every task)
prd --monitor-interval 5

# Disable resource monitoring entirely
prd --no-resource-monitor

# Combine with other options
prd --max-tasks 100 --monitor-interval 10 --no-resource-monitor
```

#### Behavior Changes

| Scenario | Current Behavior | Optimized Behavior |
|----------|------------------|-------------------|
| Every task completion | Always check resources | Check only every Nth task (default: 1) |
| Resources at safe levels (<50%) | Full monitoring | Lazy evaluation: skip expensive checks |
| Resources approaching limits (>70%) | Full monitoring | Full monitoring (safety override) |
| `--no-resource-monitor` flag | N/A | Monitoring completely disabled |

### Success Criteria

- [ ] `--monitor-interval` accepts values 1-100 (default: 1)
- [ ] `--no-resource-monitor` flag disables all resource monitoring
- [ ] Lazy evaluation activates when resources < 50% usage
- [ ] Lazy evaluation deactivates when resources > 70% usage (hysteresis)
- [ ] Benchmarks show 60-80% reduction in monitoring overhead
- [ ] All existing tests pass
- [ ] No regression in resource limit detection accuracy

---

## All Needed Context

### Context Completeness Check

**Question**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes. This PRP provides:
- Exact file locations and line numbers for all integration points
- Complete code patterns for CLI options, validation, and pipeline integration
- External research with URLs for monitoring optimization best practices
- Benchmark patterns from existing tests
- Specific gotchas and platform-specific considerations

### Documentation & References

```yaml
# MUST READ - System context on monitoring limitations
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Lines 479-482 document the resource monitoring overhead problem
  section: "Performance Bottlenecks" > "Resource Monitoring Overhead"
  critical: File handle counting via spawn adds overhead; heap stats on every task execution

# MUST READ - Current ResourceMonitor implementation
- file: src/utils/resource-monitor.ts
  why: Complete ResourceMonitor class with caching mechanism from P3.M1.T2.S1
  pattern: TTL-based caching for lsof results (lines 141-146, 234-266)
  gotcha: Cache TTL is 1 second default; lazy evaluation should respect this

# MUST READ - CLI option patterns
- file: src/cli/index.ts
  why: Patterns for adding new CLI flags with validation
  pattern: Boolean flags (line 73), numeric options (lines 243-247), validation (lines 501-515)
  gotcha: Use Commander.js .option() method, validate ranges before pipeline instantiation

# MUST READ - PRPPipeline integration points
- file: src/workflows/prp-pipeline.ts
  why: Exact locations where ResourceMonitor is instantiated and used
  pattern: ResourceMonitor instantiation (lines 335-348), recordTaskComplete() (line 882), shouldStop() (line 893)
  critical: Monitoring happens after EVERY task completion; this is what we're optimizing

# MUST READ - Existing benchmark patterns
- file: tests/benchmark/resource-monitoring.bench.test.ts
  why: Tinybench framework usage and result reporting patterns
  pattern: Bench setup (lines 41-44), result calculation (lines 76-80), console.table() output (line 73)
  critical: Benchmark should measure both cached and uncached scenarios

# EXTERNAL RESEARCH - Monitoring optimization best practices
- url: https://github.com/tinylibs/tinybench
  why: Tinybench documentation for benchmark implementation
  critical: Use time=2000ms for stable results, warmupTime=500ms for JIT compilation

# EXTERNAL RESEARCH - Lazy evaluation patterns
- url: https://prometheus.io/docs/practices/
  why: Industry-standard sampling intervals and monitoring patterns
  critical: Resource metrics typically sampled every 30-60 seconds in production

# EXTERNAL RESEARCH - Adaptive monitoring algorithms
- url: https://sre.google/sre-book/monitoring-distributed-systems/
  why: Google SRE guidance on monitoring overhead and alerting thresholds
  critical: Use 70% warning, 85% critical thresholds with hysteresis

# INTERNAL RESEARCH - P3.M1.T2.S1 caching implementation
- file: src/utils/resource-monitor.ts
  why: Lines 234-266 show the TTL-based caching pattern to follow
  pattern: Cache check before expensive operation, cache store after success
  critical: lsofCacheTtl defaults to 1000ms; lazy evaluation should work with this

# INTERNAL RESEARCH - Plan milestone dependencies
- file: plan/003_b3d3efdaf0ed/docs/research/monitoring-optimization-lazy-evaluation-research.md
  why: Comprehensive research on monitoring optimization, lazy evaluation, and adaptive algorithms
  section: "Section 2: Lazy Evaluation for Resource Monitoring"
  critical: Threshold-based activation pattern (70% warning, 50% safe)
```

### Current Codebase Tree

```bash
src/
├── cli/
│   └── index.ts                    # CLI option definitions (add --monitor-interval, --no-resource-monitor)
├── utils/
│   └── resource-monitor.ts         # ResourceMonitor class (add lazy evaluation, interval tracking)
├── workflows/
│   └── prp-pipeline.ts             # PRPPipeline integration (pass monitor options)
└── index.ts                        # Main entry point (pipeline instantiation)

tests/
└── benchmark/
    └── resource-monitoring.bench.test.ts    # Add new benchmarks for optimization
```

### Desired Codebase Tree with New Files

```bash
src/
├── cli/
│   └── index.ts                    # MODIFIED: Add --monitor-interval, --no-resource-monitor options
├── utils/
│   └── resource-monitor.ts         # MODIFIED: Add lazy evaluation, task interval tracking
├── workflows/
│   └── prp-pipeline.ts             # MODIFIED: Pass monitor options to ResourceMonitor
└── index.ts                        # MODIFIED: Pass new options to pipeline

tests/
└── benchmark/
    └── resource-monitoring.bench.test.ts    # MODIFIED: Add benchmarks for lazy evaluation, interval monitoring
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ResourceMonitor only created when maxTasks or maxDuration specified
// Location: src/workflows/prp-pipeline.ts:335-348
// GOTCHA: If neither limit specified, resourceMonitor is undefined - handle null checks

// CRITICAL: Monitoring happens after EVERY task completion
// Location: src/workflows/prp-pipeline.ts:882 (recordTaskComplete), line 893 (shouldStop)
// PATTERN: Check happens in executeBacklog() method after each subtask
// GOTCHA: Must track task count internally to implement interval-based monitoring

// CRITICAL: CLI options use Commander.js with string-to-number conversion
// Location: src/cli/index.ts:501-515 (monitor-interval validation pattern)
// PATTERN: parseInt() with isNaN check, then range validation
// GOTCHA: Commander returns strings for numeric options; must convert to number

// CRITICAL: Boolean flags with --no- prefix
// Location: src/cli/index.ts:73 (--retry vs --no-retry pattern)
// PATTERN: .option('--flag', 'description', true) and .option('--no-flag', 'description', false)
// GOTCHA: Must handle both variants in validation logic

// CRITICAL: Lazy evaluation hysteresis to prevent oscillation
// Location: src/utils/resource-monitor.ts:343-366 (warning threshold check)
// PATTERN: Warn at 70%, critical at 85%
// GOTCHA: Use different thresholds for activation (70%) vs deactivation (50%) to prevent flapping

// CRITICAL: lsof caching already implemented (P3.M1.T2.S1)
// Location: src/utils/resource-monitor.ts:234-266
// PATTERN: Cache with 1-second TTL, check before execute, store after success
// GOTCHA: Lazy evaluation should complement caching, not replace it

// CRITICAL: Tinybench result reporting
// Location: tests/benchmark/resource-monitoring.bench.test.ts:76-80
// PATTERN: Extract period (mean time per operation) and hz (operations per second)
// GOTCHA: Use console.table(bench.table()) for formatted output, calculate improvement percentage

// CRITICAL: Platform-specific monitoring
// Location: src/utils/resource-monitor.ts:207-271
// PATTERN: Internal API > Linux /proc > macOS lsof (cached) > Windows fallback
// GOTCHA: Benchmark on all platforms; lazy evaluation benefits macOS most

// CRITICAL: ResourceMonitor.start() uses setInterval for polling
// Location: src/utils/resource-monitor.ts:554-568
// PATTERN: Background polling at configured interval (default 30s)
// GOTCHA: Lazy evaluation is in addition to polling, not a replacement
```

---

## Implementation Blueprint

### Data Models and Structure

#### Extended ResourceConfig Interface

```typescript
// Add to src/utils/resource-monitor.ts
export interface ResourceConfig {
  readonly maxTasks?: number;
  readonly maxDuration?: number;
  readonly fileHandleWarnThreshold?: number;
  readonly fileHandleCriticalThreshold?: number;
  readonly memoryWarnThreshold?: number;
  readonly memoryCriticalThreshold?: number;
  readonly pollingInterval?: number;
  readonly cacheTtl?: number;

  // NEW: Optimization options
  readonly monitorInterval?: number;           // Monitor every Nth task (default: 1)
  readonly lazyEvaluation?: boolean;           // Enable lazy evaluation (default: false)
  readonly lazyEvaluationThreshold?: number;   // Activate lazy eval below this % (default: 0.5)
  readonly disabled?: boolean;                 // Completely disable monitoring (default: false)
}
```

#### Lazy Evaluation State

```typescript
// Add to ResourceMonitor class private fields
#taskCounter: number = 0;                      // Track tasks for interval-based monitoring
#lazyEvaluationActive: boolean = false;        // Current lazy evaluation state
#lastResourceCheck: ResourceSnapshot | null = null; // Cache last check for lazy eval
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EXTEND src/cli/index.ts - Add new CLI options
  - ADD: --monitor-interval <n> option (1-100, default: 1)
  - ADD: --no-resource-monitor boolean flag
  - FOLLOW pattern: Lines 243-247 (monitor-interval definition)
  - FOLLOW pattern: Lines 73, 88 (--retry vs --no-retry pattern)
  - VALIDATE: Range check 1-100 for monitor-interval
  - HANDLED: Both --flag and --no-flag variants for boolean
  - PLACEMENT: After existing resource options (--max-tasks, --max-duration)

Task 2: EXTEND src/cli/index.ts - Add validation for new options
  - IMPLEMENT: Validation for --monitor-interval (lines 501-515 pattern)
  - IMPLEMENT: Boolean normalization for --no-resource-monitor
  - VALIDATE: parseInt() check, isNaN check, range check (1-100)
  - ERROR: "must be an integer between 1 and 100"
  - PLACEMENT: After existing monitorInterval validation (line 515)

Task 3: EXTEND src/cli/index.ts - Update ValidatedCLIArgs interface
  - ADD: monitorInterval?: number to ValidatedCLIArgs interface
  - ADD: noResourceMonitor: boolean to ValidatedCLIArgs interface
  - FOLLOW pattern: Lines 97-157 (interface definition)
  - PLACEMENT: After monitorInterval field (line 136)

Task 4: UPDATE src/index.ts - Pass new options to pipeline
  - MODIFY: PRPPipeline constructor call (lines 202-219)
  - ADD: args.monitorInterval parameter
  - ADD: args.noResourceMonitor parameter
  - FOLLOW pattern: Existing option passing (line 209: monitorInterval)
  - PLACEMENT: After monitorInterval parameter in constructor call

Task 5: UPDATE src/workflows/prp-pipeline.ts - Accept new options in constructor
  - MODIFY: Constructor signature to accept monitorTaskInterval and disableMonitoring
  - ADD: #monitorTaskInterval: number = 1 private field
  - ADD: #disableMonitoring: boolean = false private field
  - FOLLOW pattern: Lines 122-150 (constructor parameter handling)
  - PLACEMENT: After existing monitorInterval parameter (line 138)

Task 6: MODIFY src/workflows/prp-pipeline.ts - Update ResourceMonitor instantiation
  - MODIFY: Lines 335-348 (ResourceMonitor instantiation)
  - ADD: Check for #disableMonitoring before creating monitor
  - PASS: monitorTaskInterval to ResourceMonitor config
  - LOG: "Resource monitoring disabled by user" if #disableMonitoring is true
  - PLACEMENT: ResourceMonitor instantiation block

Task 7: MODIFY src/workflows/prp-pipeline.ts - Add task counting for interval monitoring
  - ADD: Task counter before executeBacklog() loop
  - INCREMENT: Counter after each task completion
  - CHECK: Only call recordTaskComplete() every Nth task
  - FOLLOW pattern: Lines 870-890 (task execution loop)
  - PLACEMENT: Inside executeBacklog() method, after task completion

Task 8: MODIFY src/workflows/prp-pipeline.ts - Conditional resource limit checking
  - MODIFY: Line 893 (shouldStop() check)
  - ADD: Skip check if monitoring disabled
  - ADD: Skip check if not on interval boundary
  - EXCEPTION: Always check on last task before graceful shutdown
  - PLACEMENT: Resource limit check block

Task 9: EXTEND src/utils/resource-monitor.ts - Add lazy evaluation to ResourceConfig
  - ADD: lazyEvaluation?: boolean field
  - ADD: lazyEvaluationThreshold?: number field (default: 0.5)
  - ADD: monitorInterval?: number field (task interval, not polling)
  - FOLLOW pattern: Lines 59-76 (interface definition)
  - PLACEMENT: After cacheTtl field (line 75)

Task 10: EXTEND src/utils/resource-monitor.ts - Add lazy evaluation state tracking
  - ADD: #taskCounter: number = 0 private field
  - ADD: #lazyEvaluationActive: boolean = false private field
  - ADD: #lastResourceCheck: ResourceSnapshot | null = null private field
  - ADD: #lazyEvaluationThreshold: number field (from config)
  - FOLLOW pattern: Lines 519-522 (private field declaration)
  - PLACEMENT: After #snapshots field (line 522)

Task 11: MODIFY src/utils/resource-monitor.ts - Implement lazy evaluation in getStatus()
  - MODIFY: Lines 606-655 (getStatus() method)
  - ADD: Check lazyEvaluation flag before expensive operations
  - ADD: Compare current usage with lazyEvaluationThreshold
  - ADD: Activate/deactivate lazy evaluation with hysteresis
  - LOG: "Lazy evaluation activated/deactivated" messages
  - PLACEMENT: Start of getStatus() method

Task 12: MODIFY src/utils/resource-monitor.ts - Add interval-based monitoring to recordTaskComplete()
  - MODIFY: Lines 593-595 (recordTaskComplete() method)
  - ADD: Increment #taskCounter
  - ADD: Check if counter % monitorInterval === 0 before doing work
  - ADD: Force update on limit approach (override interval when >70% usage)
  - PLACEMENT: recordTaskComplete() method

Task 13: MODIFY src/utils/resource-monitor.ts - Add shouldSkipLazyEvaluation() helper
  - CREATE: New private method for lazy evaluation decision
  - LOGIC: Return true if usage < threshold AND lazy evaluation is enabled
  - HYSTERESIS: Use different thresholds for activation (70%) vs deactivation (50%)
  - PLACEMENT: After shouldStop() method (line 668)

Task 14: CREATE tests/benchmark/resource-monitoring.bench.test.ts - Add lazy evaluation benchmarks
  - ADD: Benchmark suite for lazy evaluation overhead reduction
  - COMPARE: Full monitoring vs lazy evaluation (safe vs approaching limits)
  - COMPARE: Interval-based monitoring (every task vs every 5th task)
  - MEASURE: Percentage reduction in getStatus() calls
  - FOLLOW pattern: Lines 38-117 (existing benchmark structure)
  - REPORT: Speedup factor and improvement percentage
  - PLACEMENT: After existing cache effectiveness benchmarks (line 224)

Task 15: CREATE tests/benchmark/resource-monitoring.bench.test.ts - Add interval monitoring benchmarks
  - ADD: Benchmark suite for task interval monitoring
  - COMPARE: Every task (interval=1) vs every 5th task (interval=5) vs every 10th task (interval=10)
  - MEASURE: Overhead reduction percentage
  - VALIDATE: No resource limits missed during interval monitoring
  - FOLLOW pattern: Lines 155-179 (getStatus() benchmark pattern)
  - PLACEMENT: After lazy evaluation benchmarks

Task 16: UPDATE tests for CLI integration
  - VERIFY: --monitor-interval flag parsing and validation
  - VERIFY: --no-resource-monitor flag disables monitoring
  - VERIFY: Invalid values are rejected with clear error messages
  - FOLLOW pattern: Existing CLI tests in tests/cli/
  - PLACEMENT: New test file: tests/cli/resource-monitor-options.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: CLI Option Definition (Task 1, 2)
// ============================================================================

// In src/cli/index.ts, after line 247
program
  .option(
    '--monitor-interval <n>',
    'Monitor resources every Nth task (1-100, default: 1, env: MONITOR_INTERVAL)',
    process.env.MONITOR_INTERVAL ?? '1'
  )
  .option(
    '--no-resource-monitor',
    'Disable resource monitoring entirely',
    false
  );

// ============================================================================
// PATTERN 2: CLI Option Validation (Task 2)
// ============================================================================

// In src/cli/index.ts, after line 515
// Validate monitor-interval
if (options.monitorInterval !== undefined) {
  const intervalStr = String(options.monitorInterval);
  const interval = parseInt(intervalStr, 10);

  if (isNaN(interval) || interval < 1 || interval > 100) {
    logger.error('--monitor-interval must be an integer between 1 and 100');
    process.exit(1);
  }
  options.monitorInterval = interval;
}

// Normalize no-resource-monitor (boolean flag with --no- prefix)
if (options.noResourceMonitor === undefined) {
  options.noResourceMonitor = false;
}

// ============================================================================
// PATTERN 3: Lazy Evaluation with Hysteresis (Task 11)
// ============================================================================

// In src/utils/resource-monitor.ts, getStatus() method
#shouldUseLazyEvaluation(currentUsage: number): boolean {
  // Get thresholds with hysteresis
  const activationThreshold = this.config.fileHandleWarnThreshold ?? 0.7;  // 70%
  const deactivationThreshold = this.config.lazyEvaluationThreshold ?? 0.5; // 50%

  // Activate lazy evaluation when below 50%
  if (!this.#lazyEvaluationActive && currentUsage < deactivationThreshold) {
    this.#lazyEvaluationActive = true;
    void this.#loggerPromise.then(logger =>
      logger.info(
        { usage: (currentUsage * 100).toFixed(1) + '%' },
        'Lazy evaluation activated (resources stable)'
      )
    );
    return true;
  }

  // Deactivate lazy evaluation when above 70% (hysteresis)
  if (this.#lazyEvaluationActive && currentUsage > activationThreshold) {
    this.#lazyEvaluationActive = false;
    void this.#loggerPromise.then(logger =>
      logger.warn(
        { usage: (currentUsage * 100).toFixed(1) + '%' },
        'Lazy evaluation deactivated (resources approaching limits)'
      )
    );
    return false;
  }

  // Return current state
  return this.#lazyEvaluationActive;
}

// ============================================================================
// PATTERN 4: Interval-Based Monitoring (Task 7, 12)
// ============================================================================

// In src/workflows/prp-pipeline.ts, executeBacklog() method
let taskCounter = 0;

for (const subtask of executableSubtasks) {
  // ... task execution ...

  taskCounter++;

  // Only record task completion every Nth task
  if (this.#monitorTaskInterval === 1 || taskCounter % this.#monitorTaskInterval === 0) {
    if (this.#resourceMonitor) {
      this.#resourceMonitor.recordTaskComplete();
    }
  }

  // Always check for resource limits (but use lazy evaluation inside monitor)
  if (this.#resourceMonitor?.shouldStop()) {
    // ... graceful shutdown ...
  }
}

// ============================================================================
// PATTERN 5: Benchmark Structure (Task 14, 15)
// ============================================================================

// In tests/benchmark/resource-monitoring.bench.test.ts
describe('Lazy Evaluation Benchmarks', () => {
  it('should reduce overhead when resources are stable', async () => {
    const bench = new Bench({
      time: 2000,
      warmupTime: 500,
    });

    const monitorLazy = new ResourceMonitor({
      lazyEvaluation: true,
      lazyEvaluationThreshold: 0.5,
      fileHandleWarnThreshold: 0.7,
    });

    const monitorFull = new ResourceMonitor({
      lazyEvaluation: false,
    });

    // Mock stable resource usage (40% - below lazy eval threshold)
    vi.spyOn(monitorLazy.fileHandleMonitor, 'getHandleCount').mockReturnValue(400);
    vi.spyOn(monitorLazy.fileHandleMonitor, 'getUlimit').mockReturnValue(1000);

    bench
      .add('Full monitoring (every getStatus call)', () => {
        monitorFull.getStatus();
      })
      .add('Lazy evaluation (stable resources)', () => {
        monitorLazy.getStatus();
      });

    await bench.run();
    console.table(bench.table());

    // Extract results
    const results = bench.tasks.map(t => t.result?.period ?? 0);
    const fullTime = results[0];
    const lazyTime = results[1];

    const improvement = ((fullTime - lazyTime) / fullTime) * 100;
    console.log(`\nLazy evaluation improvement: ${improvement.toFixed(1)}%`);

    // Assert significant improvement (at least 50%)
    expect(improvement).toBeGreaterThan(50);
  });
});
```

### Integration Points

```yaml
CLI LAYER (src/cli/index.ts):
  - add to: program.option() calls (after line 247)
  - pattern: "--monitor-interval <n>" with validation
  - pattern: "--no-resource-monitor" boolean flag

PIPELINE LAYER (src/workflows/prp-pipeline.ts):
  - modify: Constructor signature (line 122)
  - modify: ResourceMonitor instantiation (lines 335-348)
  - modify: executeBacklog() task counting (lines 870-890)
  - modify: Resource limit checking (line 893)

RESOURCE MONITOR (src/utils/resource-monitor.ts):
  - extend: ResourceConfig interface (line 75)
  - add: Private fields for lazy evaluation state (line 522)
  - modify: getStatus() method (lines 606-655)
  - modify: recordTaskComplete() method (lines 593-595)

BENCHMARKS (tests/benchmark/resource-monitoring.bench.test.ts):
  - add: Lazy evaluation benchmark suite
  - add: Interval monitoring benchmark suite
  - follow: Existing benchmark patterns (lines 38-224)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npx eslint src/cli/index.ts --fix              # Auto-fix CLI file
npx eslint src/utils/resource-monitor.ts --fix # Auto-fix monitor file
npx eslint src/workflows/prp-pipeline.ts --fix # Auto-fix pipeline file
npx prettier --write src/ tests/               # Format all modified files

# Type checking
npx tsc --noEmit                               # Check for type errors

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test CLI option parsing
npm test -- src/cli/index.test.ts

# Test ResourceMonitor lazy evaluation
npm test -- src/utils/resource-monitor.test.ts

# Test PRPPipeline integration
npm test -- src/workflows/prp-pipeline.test.ts

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI flag combinations
npm run build && dist/prd.js --help                    # Verify --monitor-interval in help
npm run build && dist/prd.js --monitor-interval 5      # Should accept valid value
npm run build && dist/prd.js --monitor-interval 0      # Should error (out of range)
npm run build && dist/prd.js --monitor-interval abc    # Should error (not a number)
npm run build && dist/prd.js --no-resource-monitor     # Should accept flag

# Test with actual PRD (small scope for quick testing)
npm run build && dist/prd.js --scope P3.M3.T2 --monitor-interval 10 PRD.md
npm run build && dist/prd.js --scope P3.M3.T2 --no-resource-monitor PRD.md

# Verify monitoring behavior in logs
# - Should see "Lazy evaluation activated" when resources stable
# - Should see "Lazy evaluation deactivated" when approaching limits
# - Should see "Resource monitoring disabled by user" with --no-resource-monitor

# Expected: All integration tests pass, flags work correctly, monitoring behavior matches expectations.
```

### Level 4: Benchmarks (Performance Validation)

```bash
# Run resource monitoring benchmarks
npm test -- tests/benchmark/resource-monitoring.bench.test.ts

# Expected output:
# - Lazy evaluation: 50-80% reduction in getStatus() overhead when resources stable
# - Interval monitoring: Proportional reduction (interval=5 => ~80% reduction)
# - No regression: Cached lsof performance unchanged

# Verify benchmark results meet success criteria:
# - Lazy evaluation improvement > 50%
# - Interval monitoring overhead reduction > 60% (for interval=5)
# - Platform-specific: macOS shows largest improvement (lsof is expensive)

# Compare with baseline (before optimization)
git stash
npm test -- tests/benchmark/resource-monitoring.bench.test.ts
git stash pop

# Expected: New benchmarks show significant improvement over baseline.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npx eslint src/ --fix`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npx prettier --check src/ tests/`

### Feature Validation

- [ ] `--monitor-interval` accepts values 1-100
- [ ] `--monitor-interval` default is 1 (every task)
- [ ] `--monitor-interval` validates range and rejects invalid values
- [ ] `--no-resource-monitor` flag disables all monitoring
- [ ] Lazy evaluation activates when resources < 50%
- [ ] Lazy evaluation deactivates when resources > 70%
- [ ] Hysteresis prevents oscillation (different activation/deactivation thresholds)
- [ ] Interval-based monitoring skips checks between intervals
- [ ] Benchmarks show 60-80% overhead reduction
- [ ] No resource limits missed during optimization

### Code Quality Validation

- [ ] Follows existing CLI option patterns (Commander.js, validation)
- [ ] Follows existing ResourceMonitor patterns (caching, thresholds)
- [ ] Follows existing benchmark patterns (Tinybench, console.table output)
- [ ] Platform-specific optimizations preserved (Linux /proc, macOS lsof cache)
- [ ] Error messages are clear and actionable
- [ ] Logging messages inform users of optimization state

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] JSDoc comments added for new public methods
- [ ] Benchmark results documented with improvement percentages
- [ ] CLI help text updated with new options
- [ ] Environment variable support documented (MONITOR_INTERVAL)

---

## Anti-Patterns to Avoid

- ❌ Don't check resources on EVERY task if `--monitor-interval > 1` is set (defeats the purpose)
- ❌ Don't disable lazy evaluation when approaching critical limits (safety first)
- ❌ Don't use the same threshold for activation and deactivation (causes oscillation)
- ❌ Don't skip resource limit checks on the last task before shutdown (might miss limit)
- ❌ Don't forget to handle the case where ResourceMonitor is undefined (null checks)
- ❌ Don't use `process.env.MonitorInterval` (use uppercase: `process.env.MONITOR_INTERVAL`)
- ❌ Don't forget to convert Commander.js string options to numbers (parseInt with validation)
- ❌ Don't set `--monitor-interval` to 0 (must be at least 1)
- ❌ Don't enable lazy evaluation by default (opt-in for safety)
- ❌ Don't remove existing lsof caching (lazy evaluation complements caching, doesn't replace it)

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success likelihood

**Reasoning**:
- Comprehensive research with external documentation references
- Exact file locations and line numbers provided
- Complete implementation patterns with code examples
- Existing benchmarks provide clear pattern to follow
- Lazy evaluation and interval monitoring are well-understood patterns
- CLI option patterns are consistent and well-documented

**Validation**: The completed PRP provides everything needed for an AI agent unfamiliar with the codebase to implement this feature successfully using only the PRP content and codebase access.
