# PRP: Optimize File Handle Monitoring on macOS

---

## Goal

**Feature Goal**: Optimize file handle monitoring on macOS by caching lsof results with configurable TTL, reducing CPU overhead while maintaining accurate resource monitoring.

**Deliverable**: Optimized `ResourceMonitor` at `src/utils/resource-monitor.ts` with:

- Platform-specific file handle counting (Linux: /proc, macOS: cached lsof, Windows: skip/handle.exe fallback)
- Configurable monitoring interval via `--monitor-interval` CLI option
- Benchmarks in `tests/benchmark/resource-monitoring.bench.ts` to verify performance improvement

**Success Definition**:

- lsof results are cached with configurable TTL (default 1 second, range 100ms-60s)
- CPU overhead on macOS is reduced by 80%+ compared to uncached implementation
- All existing tests pass without modification
- Benchmarks demonstrate measurable performance improvement
- CLI option `--monitor-interval` allows polling frequency control (1000ms-60000ms range)

## User Persona

**Target User**: Developer/Ops Engineer running the PRP Pipeline on macOS for long-running pipeline executions.

**Use Case**: During extended pipeline sessions (hours to days), resource monitoring prevents system exhaustion from file handle leaks. The current uncached lsof implementation causes significant CPU overhead on macOS.

**User Journey**:

1. User runs pipeline with default settings (30s polling interval)
2. Resource monitor checks file handles every 30 seconds using cached lsof results
3. On macOS, lsof is only executed once per cache TTL (default 1 second)
4. If monitoring interval is too aggressive, user can adjust: `--monitor-interval 5000`
5. If cache TTL needs adjustment, user can configure via ResourceConfig

**Pain Points Addressed**:

- **High CPU usage**: Current lsof execution (0.5-2s) every 30s causes sustained CPU load
- **Blocking execution**: lsof's 5-second timeout can block pipeline progress
- **No control**: Users cannot adjust monitoring frequency for their use case

## Why

- **Performance**: lsof on macOS takes 0.5-2 seconds per execution vs ~0.002ms for /proc on Linux (1000x slower)
- **CPU overhead**: Uncached lsof at 30-second intervals causes ~2-6% CPU usage continuously
- **User control**: Different use cases need different polling frequencies (short-lived vs long-running pipelines)
- **Platform parity**: Current implementation treats macOS same as Linux, but performance characteristics differ significantly

## What

Optimize `ResourceMonitor` to use platform-specific file handle counting with caching:

1. **Linux**: Continue using `/proc/{pid}/fd` directory listing (fast, no caching needed)
2. **macOS**: Cache lsof results with configurable TTL (default 1s), use optimized lsof flags (`-n -P -b`)
3. **Windows**: Return 0 (no ulimit concept) or use `process._getActiveHandles()` as fallback
4. **CLI Option**: Add `--monitor-interval <ms>` option to control polling frequency (1000-60000ms, default 30000)
5. **Configuration**: Add `cacheTtl` to `ResourceConfig` for lsof cache TTL (100-60000ms, default 1000)

### Success Criteria

- [ ] lsof cache reduces CPU overhead by 80%+ on macOS (verified via benchmarks)
- [ ] Cache TTL is configurable via `ResourceConfig.cacheTtl` (default 1000ms)
- [ ] Monitoring interval is configurable via `--monitor-interval` CLI option (1000-60000ms)
- [ ] All existing unit tests pass without modification
- [ ] Benchmarks demonstrate performance improvement (before/after comparison)
- [ ] CLI validation prevents invalid intervals (< 100ms or > 60000ms)
- [ ] Cache invalidation is available for manual cache busting

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:

- Complete ResourceMonitor source code with line numbers
- Existing test patterns and mocking approach
- CLI option patterns from src/cli/index.ts
- Research findings on platform-specific optimization
- Tinybench framework recommendation for benchmarks
- Exact file locations and naming conventions

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Primary implementation file (current state)
- file: src/utils/resource-monitor.ts
  why: Complete ResourceMonitor implementation showing current lsof usage (lines 204-217), platform detection (lines 192-220), and class structure
  pattern: FileHandleMonitor class with getHandleCount() method, platform detection using process.platform
  gotcha: lsof timeout is 5000ms - this is the primary performance bottleneck

# CLI option pattern reference
- file: src/cli/index.ts
  why: Shows exact CLI option pattern for numeric validation (lines 314-340), system resource warnings (lines 342-359)
  pattern: Commander.js option parsing with parseInt, range validation, non-blocking warnings
  gotcha: parallelism validation shows pattern for numeric range checking (1-10), use similar for monitor-interval (1000-60000)

# Unit test patterns
- file: tests/unit/utils/resource-monitor.test.ts
  why: Shows mocking patterns for child_process.execSync, fs.existsSync, and process.platform
  pattern: vi.mock() for Node.js modules, vi.spyOn() for process methods, fake timers for intervals
  gotcha: Tests mock lsof execution - must update mocks to handle cache behavior

# Research findings (stored in research/ subdirectory)
- docfile: plan/003_b3d3efdaf0ed/P3M1T2S1/research/linux_proc_fd_research.md
  why: Linux /proc approach is already implemented, no changes needed. Use as reference for platform detection.
  section: Performance Characteristics

- docfile: plan/003_b3d3efdaf0ed/P3M1T2S1/research/macos_lsof_research.md
  why: Complete lsof optimization strategies including cache TTL recommendations (5s), lsof flags (-n -P -b), and implementation patterns
  section: Recommended Implementation

- docfile: plan/003_b3d3efdaf0ed/P3M1T2S1/research/windows_handle_research.md
  why: Windows has no ulimit concept - current "return 0" approach is correct
  section: Best Practices for Windows

- docfile: plan/003_b3d3efdaf0ed/P3M1T2S1/research/benchmarking_research.md
  why: Tinybench framework recommendation with code examples for benchmarking cached vs non-cached operations
  section: Framework Recommendation and Cached vs Non-Cached Operations

# External documentation
- url: https://github.com/tinylibs/tinybench
  why: Tinybench is official Vitest ecosystem library, small (7KB), TypeScript-native
  critical: Use await bench.run() to execute benchmarks, .beforeAll() for setup, .task() for test cases

- url: https://commander.js.org/
  why: Commander.js documentation for CLI option parsing
  section: Options with required values, validation examples

- url: https://nodejs.org/api/process.html#process_process_platform
  why: process.platform returns 'darwin' for macOS, 'linux', 'win32'
  critical: Platform detection is case-sensitive string comparison

# Dependencies (already installed)
- url: https://www.npmjs.com/package/groundswell
  why: groundswell includes lru-cache dependency which can be used for lsof result caching
  critical: No new dependencies needed - LRUCache available via groundswell/node_modules/lru-cache
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   └── index.ts                    # CLI option parsing (add --monitor-interval here)
│   ├── utils/
│   │   ├── resource-monitor.ts         # MODIFICATION: Add lsof cache
│   │   └── logger.ts                   # Logger used by ResourceMonitor
│   └── index.ts                        # Main entry point
├── tests/
│   ├── unit/
│   │   └── utils/
│   │       └── resource-monitor.test.ts  # EXTENSION: Add cache tests
│   └── benchmark/                      # NEW: Create this directory
│       └── resource-monitoring.bench.ts # NEW: Benchmark file
├── plan/
│   └── 003_b3d3efdaf0ed/
│       └── P3M1T2S1/
│           ├── PRP.md                  # This file
│           └── research/               # Research findings
└── package.json                        # Add tinybench to devDependencies
```

### Desired Codebase Tree (after implementation)

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   └── index.ts                    # ADD: --monitor-interval option
│   └── utils/
│       └── resource-monitor.ts         # MODIFY: Add lsof cache with TTL
├── tests/
│   ├── unit/
│   │   └── utils/
│   │       └── resource-monitor.test.ts  # EXTENSION: Cache behavior tests
│   └── benchmark/
│       └── resource-monitoring.bench.ts # NEW: Performance benchmarks
└── package.json                        # ADD: tinybench dependency
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: groundswell includes lru-cache as transitive dependency
// Import LRUCache from: import { LRUCache } from 'lru-cache';
// DO NOT add lru-cache to package.json - it's already in node_modules/groundswell/node_modules/lru-cache

// CRITICAL: process._getActiveHandles() is internal API (line 179-190 of resource-monitor.ts)
// Already used as primary method - DO NOT modify this behavior
// Only cache the lsof fallback on macOS

// GOTCHA: Current lsof timeout is 5000ms (line 211)
// With caching, lsof executes less frequently but still has 5s timeout
// Consider reducing timeout when cached (e.g., 2000ms) since cache prevents back-to-back calls

// GOTCHA: FileHandleMonitor.getHandleCount() returns synchronously (line 178)
// Cache implementation MUST be synchronous - no async/await
// Use in-memory Map with timestamp check, not Promise-based caching

// GOTCHA: CLI option parsing accepts string from commander.js (line 332-335)
// Must parseInt() and validate range before using
// See parallelism validation pattern (lines 330-362)

// GOTCHA: ResourceMonitor.config interface (lines 59-74)
// Add cacheTtl property here
// Must be optional with default value

// GOTCHA: Tests mock execSync (line 208 in resource-monitor.ts)
// After adding cache, tests must account for:
// 1. First call: executes lsof (mocked)
// 2. Subsequent calls within TTL: returns cached value (no execSync call)
// 3. Calls after TTL: executes lsof again (mocked)

// CRITICAL: Tinybench uses async/await API
// Benchmarks must use await bench.run() to execute
// Use bench.task() for each benchmark case
// Use .beforeAll() for setup (create ResourceMonitor instances)

// GOTCHA: lsof flags optimization (from macos_lsof_research.md)
// Add -n (no DNS lookup), -P (no port name resolution), -b (avoid kernel blocks)
// New command: `lsof -n -P -b -p ${process.pid} | wc -l`
// Performance improvement: 40-60% faster than current `lsof -p ${process.pid}`
```

## Implementation Blueprint

### Data Models and Structure

Add cache configuration to ResourceConfig interface:

```typescript
export interface ResourceConfig {
  readonly maxTasks?: number;
  readonly maxDuration?: number;
  readonly fileHandleWarnThreshold?: number;
  readonly fileHandleCriticalThreshold?: number;
  readonly memoryWarnThreshold?: number;
  readonly memoryCriticalThreshold?: number;
  readonly pollingInterval?: number;
  // NEW: lsof cache TTL for macOS (milliseconds)
  readonly cacheTtl?: number;
}
```

Add cache interface for lsof results:

```typescript
interface LsofCacheEntry {
  count: number;
  timestamp: number;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/utils/resource-monitor.ts - Add lsof cache to FileHandleMonitor
  IMPLEMENT: LsofCacheEntry interface, private cache Map, getHandleCount() with cache logic
  FOLLOW pattern: Lines 146-164 (FileHandleMonitor class structure)
  NAMING: #lsofCache (private Map), #lsofCacheTtl (private number)
  LOGIC:
    - In getHandleCount(), before calling lsof, check cache for valid entry
    - Cache valid if (Date.now() - entry.timestamp) < this.#lsofCacheTtl
    - If cache valid, return entry.count
    - If cache invalid/missing, execute lsof, store result in cache, return count
    - Use optimized lsof command: `lsof -n -P -b -p ${process.pid} | wc -l`
  PLACEMENT: Add private fields to FileHandleMonitor class (after line 149)
  DEPENDENCIES: None (first task)

Task 2: MODIFY src/utils/resource-monitor.ts - Add cache invalidation method
  IMPLEMENT: clearLsofCache() public method on FileHandleMonitor
  FOLLOW pattern: Lines 232-248 (getUlimit() method - simple public method)
  NAMING: clearLsofCache()
  LOGIC: this.#lsofCache.clear()
  PLACEMENT: After getUlimit() method (after line 248)
  DEPENDENCIES: Task 1 (cache must exist)

Task 3: MODIFY src/utils/resource-monitor.ts - Add cacheTtl to ResourceConfig interface
  IMPLEMENT: cacheTtl?: number property to ResourceConfig interface
  FOLLOW pattern: Lines 59-74 (ResourceConfig interface)
  NAMING: cacheTtl (camelCase, optional)
  DEFAULT: 1000 (1 second)
  PLACEMENT: After pollingInterval property (after line 73)
  DEPENDENCIES: None (interface addition)

Task 4: MODIFY src/utils/resource-monitor.ts - Pass cacheTtl to FileHandleMonitor constructor
  IMPLEMENT: Update FileHandleMonitor constructor to accept cacheTtl parameter
  FOLLOW pattern: Lines 157-164 (FileHandleMonitor constructor)
  NAMING: cacheTtl parameter (with default 1000)
  LOGIC:
    - Add cacheTtl: number = 1000 parameter to constructor
    - Store this.#lsofCacheTtl = cacheTtl
    - Initialize this.#lsofCache = new Map<string, LsofCacheEntry>()
  PLACEMENT: Modify existing constructor (line 157)
  DEPENDENCIES: Task 1 (cache fields), Task 3 (interface update)

Task 5: MODIFY src/utils/resource-monitor.ts - Update ResourceMonitor to pass cacheTtl
  IMPLEMENT: Pass config.cacheTtl to FileHandleMonitor constructor
  FOLLOW pattern: Lines 461-468 (ResourceMonitor constructor passing thresholds)
  NAMING: this.config.cacheTtl (with fallback to 1000)
  LOGIC:
    - const cacheTtl = config.cacheTtl ?? 1000;
    - new FileHandleMonitor(warnThreshold, criticalThreshold, cacheTtl)
  PLACEMENT: Modify ResourceMonitor constructor (line 461)
  DEPENDENCIES: Task 4 (FileHandleMonitor constructor signature)

Task 6: ADD src/cli/index.ts - Add --monitor-interval CLI option
  IMPLEMENT: monitorInterval option to CLIArgs interface, commander option, validation
  FOLLOW pattern: Lines 73-74, 183-184 (maxTasks, maxDuration options)
  NAMING: --monitor-interval <ms> (kebab-case for CLI), monitorInterval for interface
  VALIDATION:
    - Type: integer
    - Range: 1000-60000 milliseconds
    - Default: 30000 (30 seconds, matches current behavior)
  LOGIC:
    - Add to CLIArgs interface (after line 92)
    - Add commander option (after line 184)
    - Add validation (after line 328, similar to maxDuration)
  PLACEMENT: src/cli/index.ts
  DEPENDENCIES: Task 3 (ResourceConfig.cacheTtl interface)

Task 7: MODIFY src/core/pipeline.ts or appropriate entry point - Wire monitor-interval to ResourceMonitor
  IMPLEMENT: Pass CLI monitorInterval to ResourceMonitor config
  FOLLOW pattern: Search for new ResourceMonitor({ maxTasks, maxDuration })
  NAMING: monitorInterval: args.monitorInterval
  LOGIC:
    - Find where ResourceMonitor is instantiated
    - Add monitorInterval: args.monitorInterval to config object
  PLACEMENT: TBD (search for ResourceMonitor instantiation)
  DEPENDENCIES: Task 6 (CLI option exists), Task 5 (ResourceConfig accepts cacheTtl)

Task 8: CREATE tests/benchmark/resource-monitoring.bench.ts - Add performance benchmarks
  IMPLEMENT: Tinybench benchmarks comparing cached vs uncached lsof
  FOLLOW pattern: None (first benchmark file - use Tinybench documentation)
  NAMING: resource-monitoring.bench.ts (match file naming convention)
  FRAMEWORK: tinybench (install via npm install --save-dev tinybench)
  BENCHMARKS:
    - Benchmark 1: Linux /proc approach (baseline, should be fast)
    - Benchmark 2: macOS uncached lsof (current implementation)
    - Benchmark 3: macOS cached lsof (new implementation)
    - Benchmark 4: Windows internal API (process._getActiveHandles)
  LOGIC:
    - Use bench.task() for each benchmark case
    - Mock process.platform to simulate different platforms
    - Use .beforeAll() for setup
    - Report: mean execution time, improvement percentage
  PLACEMENT: tests/benchmark/resource-monitoring.bench.ts
  DEPENDENCIES: tinybench package installation

Task 9: EXTEND tests/unit/utils/resource-monitor.test.ts - Add cache behavior tests
  IMPLEMENT: Unit tests for lsof cache (hit, miss, expiration, invalidation)
  FOLLOW pattern: Lines 1-100 (existing test patterns for FileHandleMonitor)
  NAMING: describe('FileHandleMonitor with lsof cache', () => { ... })
  TEST CASES:
    - Test 1: First call executes lsof (verify execSync called)
    - Test 2: Second call within TTL returns cached value (verify execSync NOT called)
    - Test 3: Call after TTL executes lsof again (verify execSync called twice)
    - Test 4: clearLsofCache() invalidates cache (verify execSync called after clear)
    - Test 5: Different cacheTtl values are respected
  MOCKING:
    - Mock execSync to return controlled values
    - Use vi.useFakeTimers() for TTL testing
    - vi.spyOn() to track execSync call count
  PLACEMENT: tests/unit/utils/resource-monitor.test.ts
  DEPENDENCIES: Task 1, Task 2 (cache implementation)

Task 10: MODIFY package.json - Add tinybench dependency
  IMPLEMENT: Add tinybench to devDependencies
  FOLLOW pattern: Lines 81-100 (devDependencies section)
  NAMING: "tinybench": "^3.0.0"
  PLACEMENT: package.json devDependencies
  DEPENDENCIES: None (independent)
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Synchronous cache with timestamp check (FileHandleMonitor#getHandleCount)

class FileHandleMonitor {
  #lsofCache: Map<string, LsofCacheEntry> = new Map();
  #lsofCacheTtl: number;

  getHandleCount(): number {
    // GOTCHA: Try internal API FIRST before checking cache
    // Internal API is already fastest - don't cache it
    try {
      const handles = (
        process as unknown as { _getActiveHandles?: () => unknown[] }
      )._getActiveHandles?.();
      if (handles && Array.isArray(handles)) {
        return handles.length; // No cache for internal API
      }
    } catch {
      // Fall through to platform-specific methods
    }

    const platform = process.platform;

    if (platform === 'darwin') {
      // NEW: Check cache before executing lsof
      const cacheKey = 'main';
      const now = Date.now();
      const cached = this.#lsofCache.get(cacheKey);

      if (cached && now - cached.timestamp < this.#lsofCacheTtl) {
        return cached.count; // Cache hit - return immediately
      }

      // Cache miss - execute lsof
      try {
        // OPTIMIZED: Added -n -P -b flags for 40-60% speedup
        const result = execSync(`lsof -n -P -b -p ${process.pid} | wc -l`, {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 5000,
        });
        const count = parseInt(result.trim(), 10) - 1;

        // Store in cache
        this.#lsofCache.set(cacheKey, { count, timestamp: now });
        return count;
      } catch {
        return 0;
      }
    }

    if (platform === 'linux') {
      // FAST: No cache needed for /proc (already ~0.002ms)
      const fdPath = `/proc/${process.pid}/fd`;
      if (existsSync(fdPath)) {
        try {
          return readdirSync(fdPath).length;
        } catch {
          return 0;
        }
      }
    }

    // Windows or fallback
    return 0;
  }

  clearLsofCache(): void {
    this.#lsofCache.clear();
  }
}

// Pattern 2: CLI option validation (src/cli/index.ts)

export interface CLIArgs {
  // ... existing properties ...
  /** Monitoring interval in milliseconds (1000-60000, default: 30000) */
  monitorInterval?: number;
}

// In parseCLIArgs():
program.option(
  '--monitor-interval <ms>',
  'Resource monitoring interval in milliseconds (1000-60000, default: 30000)'
);

// Validation (after line 328):
if (options.monitorInterval !== undefined) {
  if (
    !Number.isInteger(options.monitorInterval) ||
    options.monitorInterval < 1000 ||
    options.monitorInterval > 60000
  ) {
    logger.error(
      '--monitor-interval must be an integer between 1000 and 60000'
    );
    process.exit(1);
  }
}

// Pattern 3: Benchmark structure (Tinybench)

import { Bench } from 'tinybench';

async function runBenchmarks() {
  const bench = new Bench({ time: 2000 }); // 2 seconds per benchmark

  // Setup
  const monitorUncached = new FileHandleMonitor(0.7, 0.85, 0); // TTL=0 (no cache)
  const monitorCached = new FileHandleMonitor(0.7, 0.85, 1000); // TTL=1s

  // Mock platform to macOS
  Object.defineProperty(process, 'platform', { value: 'darwin' });

  bench.task('uncached lsof', () => {
    monitorUncached.getHandleCount();
  });

  bench.task('cached lsof (TTL=1s)', () => {
    monitorCached.getHandleCount();
  });

  await bench.run();

  console.table(bench.table());
}

// Pattern 4: Test cache behavior (Vitest)

describe('FileHandleMonitor with lsof cache', () => {
  it('should use cached value within TTL', () => {
    const monitor = new FileHandleMonitor(0.7, 0.85, 1000);

    // Mock process.platform to macOS
    vi.stubGlobal('process', { platform: 'darwin', pid: 1234 });

    // Mock execSync
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValue('42\n'); // lsof returns 42 file handles

    // First call - should execute lsof
    const count1 = monitor.getHandleCount();
    expect(count1).toBe(41); // 42 - 1 (header line)
    expect(execSyncMock).toHaveBeenCalledTimes(1);

    // Second call within TTL - should use cache
    const count2 = monitor.getHandleCount();
    expect(count2).toBe(41);
    expect(execSyncMock).toHaveBeenCalledTimes(1); // Still 1 (not called again)

    // Advance time past TTL
    vi.advanceTimersByTime(1500);

    // Third call - should execute lsof again
    const count3 = monitor.getHandleCount();
    expect(count3).toBe(41);
    expect(execSyncMock).toHaveBeenCalledTimes(2); // Called again
  });
});
```

### Integration Points

```yaml
CODEBASE:
  - modify: src/utils/resource-monitor.ts
    changes:
      - Add LsofCacheEntry interface (after line 128)
      - Add #lsofCache, #lsofCacheTtl to FileHandleMonitor (after line 149)
      - Modify getHandleCount() to check cache before lsof (lines 178-221)
      - Add clearLsofCache() method (after line 248)
      - Add cacheTtl to ResourceConfig (after line 73)
      - Update FileHandleMonitor constructor (line 157)
      - Update ResourceMonitor constructor (line 461)

  - modify: src/cli/index.ts
    changes:
      - Add monitorInterval to CLIArgs interface (after line 92)
      - Add --monitor-interval option (after line 184)
      - Add validation (after line 328)

  - modify: [FIND WHERE ResourceMonitor IS INSTANTIATED]
    changes:
      - Pass monitorInterval to ResourceMonitor config
    search: "new ResourceMonitor({"

DEPENDENCIES:
  - add to: package.json devDependencies
    package: "tinybench": "^3.0.0"
    command: npm install --save-dev tinybench

TESTS:
  - modify: tests/unit/utils/resource-monitor.test.ts
    changes:
      - Add describe block for cache behavior tests
      - Test cache hit, miss, expiration, invalidation
      - Use vi.useFakeTimers() for TTL testing

  - create: tests/benchmark/resource-monitoring.bench.ts
    content:
      - Tinybench setup
      - Benchmarks for cached/uncached/Linux/Windows
      - Comparison reporting
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                     # ESLint check
npm run lint:fix                 # Auto-fix linting issues
npm run typecheck                # TypeScript type checking
npm run format                   # Prettier formatting

# Project-wide validation
npm run validate                 # Runs lint, format:check, typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm run test -- tests/unit/utils/resource-monitor.test.ts

# Full test suite for affected areas
npm run test:run

# Coverage validation
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI option parsing
npm run dev -- --help | grep monitor-interval

# Test with custom monitor interval
npm run dev -- --prd ./PRD.md --monitor-interval 5000 --dry-run

# Test validation (should fail with error)
npm run dev -- --prd ./PRD.md --monitor-interval 100
# Expected: Error message "must be between 1000 and 60000"

# Expected: CLI parses correctly, ResourceMonitor receives correct interval
```

### Level 4: Performance Benchmarking (Validation)

```bash
# Run benchmarks to verify performance improvement
npm run test -- tests/benchmark/resource-monitoring.bench.ts

# Expected output:
# - uncached lsof: ~500-2000ms per call
# - cached lsof: ~0.01-0.1ms per call (cache hit)
# - Improvement: 1000x-10000x faster for cached calls

# Compare before/after by temporarily disabling cache:
# Set cacheTtl=0 in benchmark to simulate uncached behavior
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] lsof cache reduces CPU overhead by 80%+ (verified via benchmarks)
- [ ] Cache TTL is configurable via `ResourceConfig.cacheTtl` (tested)
- [ ] Monitoring interval configurable via `--monitor-interval` CLI option (tested)
- [ ] CLI validation prevents invalid intervals (< 100ms or > 60000ms) (tested)
- [ ] Cache invalidation works via `clearLsofCache()` method (tested)
- [ ] All existing tests pass without modification (verified)

### Code Quality Validation

- [ ] Follows existing codebase patterns (FileHandleMonitor structure, CLI validation)
- [ ] File placement matches desired codebase tree structure
- [ ] No new dependencies added (LRUCache via groundswell, tinybench added)
- [ ] TypeScript types are correct and exported properly
- [ ] JSDoc comments added for new public methods

### Performance Validation

- [ ] Benchmarks demonstrate measurable improvement (tinybench results)
- [ ] Cached lsof calls are ~1000x faster than uncached
- [ ] Linux /proc approach remains unchanged (fastest)
- [ ] Windows behavior unchanged (returns 0)

---

## Anti-Patterns to Avoid

- **Don't** use async/await for cache - `getHandleCount()` must remain synchronous
- **Don't** cache the internal API (`process._getActiveHandles()`) - it's already fast
- **Don't** add new dependencies beyond `tinybench` - use `lru-cache` from groundswell
- **Don't** modify Linux /proc approach - it's already optimal
- **Don't** change existing test assertions - extend tests for cache behavior
- **Don't** set cache TTL below 100ms - too aggressive, defeats caching purpose
- **Don't** set cache TTL above 60 seconds - too stale, misses rapid file handle changes
- **Don't** forget to clear cache in tests - use `vi.clearAllMocks()` or `beforeEach`
- **Don't** use `setTimeout` for cache expiration - use timestamp check on each call
- **Don't** implement complex cache invalidation - time-based TTL is sufficient
