# Codebase Analysis: Resource Monitoring System

## Overview

This document analyzes the existing resource monitoring implementation to understand what needs to be tested.

## Source Files

### 1. ResourceMonitor Class (`src/utils/resource-monitor.ts`)

**Purpose**: Monitor system resources (file handles, memory) and enforce limits.

**Key Components**:

#### FileHandleMonitor (lines ~50-180)
- **Primary method**: `process._getActiveHandles()` (internal Node.js API, fastest)
- **Linux fallback**: Read `/proc/<pid>/fd` directory count
- **macOS fallback**: Execute `lsof -p <pid>` (5s timeout)
- **Windows**: Returns 0 (no ulimit concept)
- **Ulimit detection**: `ulimit -n` command

#### MemoryMonitor (lines ~185-250)
- **V8 heap**: `process.memoryUsage().heapUsed`
- **System memory**: `os.totalmem()` and `os.freemem()`
- **RSS memory**: `process.memoryUsage().rss`

#### Main ResourceMonitor Class (lines ~255-600)
- **Constructor**: Takes `ResourceConfig` with limits
- **Polling**: 30-second intervals for status checks
- **Task tracking**: `recordTaskComplete()` increments counter
- **Duration tracking**: Starts at `start()`, checked via `getElapsed()`
- **Leak detection**: 20-sample circular buffer for trend analysis

**Key Methods**:
```typescript
class ResourceMonitor {
  constructor(config: ResourceConfig)
  start(): void  // Starts polling interval
  stop(): void   // Stops polling interval
  shouldStop(): boolean  // Checks if any limit exceeded
  getStatus(): ResourceLimitStatus  // Returns current status
  recordTaskComplete(): void  // Increments task counter
  getTasksCompleted(): number  // Returns task count
  getElapsed(): number  // Returns milliseconds since start
}
```

**Limit Enforcement** (shouldStop logic):
1. File handles > 85% of ulimit → critical
2. System memory > 90% → critical
3. Task count >= maxTasks → stop
4. Duration >= maxDuration → stop

**Report Generation** (private method `#generateResourceLimitReport()`):
- Creates `RESOURCE_LIMIT_REPORT.md` in plan directory
- Includes: timestamp, limit type, resource snapshot, progress summary, actionable suggestions

### 2. CLI Integration (`src/cli/index.ts`)

**Flag Definitions** (around lines 200-250):
```typescript
.option('--max-tasks <number>', 'Maximum number of tasks to execute')
.option('--max-duration <ms>', 'Maximum execution duration in milliseconds')
```

**Validation**:
- Both require positive integers
- Invalid values trigger `process.exit(1)`
- Passed to PRPPipeline constructor

### 3. Pipeline Integration (`src/workflows/prp-pipeline.ts`)

**Lifecycle**:
1. Constructor: Creates ResourceMonitor if limits provided
2. Start: `#resourceMonitor.start()` called immediately
3. Per-task: `#resourceMonitor.recordTaskComplete()` after each task
4. Loop check: `#resourceMonitor.shouldStop()` checked after each task
5. Shutdown: If true, sets `shutdownReason = 'RESOURCE_LIMIT'` and generates report
6. Cleanup: `#resourceMonitor.stop()` in finally block

**Integration Point** (around line 825-850):
```typescript
if (this.#resourceMonitor?.shouldStop()) {
  const status = this.#resourceMonitor.getStatus();
  this.#shutdownReason = 'RESOURCE_LIMIT';
  await this.#generateResourceLimitReport();
  break; // Exit loop
}
```

## Existing Tests (`tests/unit/utils/resource-monitor.test.ts`)

**Coverage**:
- Construction with various configs
- Task count tracking
- Duration tracking with fake timers
- Resource status reporting
- Leak detection (>20% growth)
- Edge cases (zero values, concurrent calls)
- File handle monitoring with mocked `_getActiveHandles`
- Memory monitoring
- Polling lifecycle (start/stop)

**Mocking Patterns**:
```typescript
// Mock process._getActiveHandles
const mockActiveHandles = (count: number) => {
  (process as any)._getActiveHandles = () => Array(count).fill({});
};

// Timer mocking
vi.useFakeTimers();
vi.advanceTimersByTime(1500);

// Logger spying
const logger = getLogger('ResourceMonitor');
const warnSpy = vi.spyOn(logger, 'warn');
```

## Platform-Specific Behaviors

| Platform | File Handle Method | Gotcha |
|----------|-------------------|--------|
| Linux | `/proc/<pid>/fd` directory count | Fast, accurate |
| macOS | `lsof -p <pid>` command | Slow, 5s timeout |
| Windows | Returns 0 | No ulimit concept |

| Memory Type | Method | Notes |
|-------------|--------|-------|
| V8 Heap | `process.memoryUsage().heapUsed` | JS objects only |
| RSS | `process.memoryUsage().rss` | Includes C++/Buffers |
| System | `(total - free) / total` | OOM protection |

## Thresholds

| Resource | Warning | Critical | Action |
|----------|---------|----------|--------|
| File Handles | 70% | 85% | Stop at critical |
| System Memory | 80% | 90% | Stop at critical |
| Task Count | N/A | maxTasks | Stop when reached |
| Duration | N/A | maxDuration | Stop when reached |

## RESOURCE_LIMIT_REPORT.md Format

```markdown
# Resource Limit Report

**Generated**: 2026-01-19T12:34:56.789Z
**Limit Type**: max_tasks

## Resource Snapshot

| Metric | Value | Limit | Status |
|--------|-------|-------|--------|
| File Handles | 245 / 1024 | 85% | 23.9% |
| Heap Memory | 128.45 MB | N/A | Normal |
| System Memory | 45.2% | 90% | Normal |

## Progress Summary

- Completed: 5 tasks
- Total: 10 tasks
- Progress: 50%

## Actionable Suggestions

[Specific suggestions based on limit type]

## Resume Instructions

\`\`\`bash
npx tsx src/cli/index.ts --continue
\`\`\`
```

## Key Gotchas

1. **`process._getActiveHandles()` is internal API** - May break between Node versions
2. **macOS `lsof` is slow** - Tests should mock this, not use real commands
3. **`process.memoryUsage()` returns V8 heap only** - RSS is more accurate for total memory
4. **Polling interval** - 30 seconds default, affects leak detection (requires 5 samples = 2.5 min)
5. **Limit priority** - File handles/memory checked first, then maxTasks/maxDuration
6. **Platform-specific behavior** - Tests should mock or handle all three platforms
7. **Report generation** - Only happens when limit is exceeded, not on warning
8. **Graceful shutdown** - Setting `shutdownReason = 'RESOURCE_LIMIT'` triggers cleanup

## Testing Requirements

Based on the contract definition in the work item:

1. **File handle count monitoring** - Verify platform-specific detection
2. **Heap stats capture** - Verify `process.memoryUsage()` usage
3. **max-tasks limit** - Verify stops after N tasks
4. **max-duration limit** - Verify stops after N milliseconds
5. **RESOURCE_LIMIT_REPORT.md generation** - Verify report content and suggestions

All of these require mocking of:
- `process._getActiveHandles()` or command execution
- `process.memoryUsage()` and `os` module
- Timers (`Date.now()` via fake timers)
- File system operations (report writing)
