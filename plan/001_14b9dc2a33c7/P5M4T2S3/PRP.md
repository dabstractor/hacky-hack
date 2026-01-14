---
name: "Resource Limit Handling - Graceful Degradation for Long-Running Pipelines"
description: |

---

## Goal

**Feature Goal**: Implement comprehensive resource monitoring and graceful degradation in PRPPipeline to prevent system exhaustion from long-running pipeline executions, with automatic shutdown when limits are reached and progress preservation for resumption.

**Deliverable**: New `src/utils/resource-monitor.ts` module with `ResourceMonitor` class, CLI flags (`--max-tasks`, `--max-duration`), integrated monitoring in `PRPPipeline`, graceful shutdown with progress preservation, and unit tests.

**Success Definition**:
- `ResourceMonitor` class monitors file handles and memory usage with configurable thresholds
- CLI flags `--max-tasks N` and `--max-duration MS` are parsed and validated
- PRPPipeline checks resource limits during `executeBacklog()` loop
- Graceful shutdown triggered when any limit is reached, with state preserved
- User receives clear warnings and actionable suggestions (increase ulimit, split PRD)
- 100% test coverage for resource monitoring logic
- Progress is saved and can be resumed with `--continue` flag

## User Persona

**Target User**: Developers running PRP Pipeline on large PRDs that generate hundreds of tasks and may run for hours or days.

**Use Case**: When executing a large PRD with 500+ subtasks, the pipeline may hit system resource limits (file handles, memory) or run indefinitely. Users need safeguards to prevent system exhaustion and ability to resume from checkpoint.

**User Journey**:
1. User runs pipeline with large PRD: `node dist/index.js --prd PRD.md --max-tasks 100 --max-duration 3600000`
2. Pipeline starts executing tasks, monitoring resources in background
3. At task 95, file handle count reaches 85% of ulimit - warning logged
4. At task 100, `--max-tasks` limit reached - graceful shutdown triggered
5. Progress saved to session, user sees summary: "Stopped at 100/500 tasks (20%). Resume with --continue"
6. User increases ulimit and splits PRD, then resumes: `node dist/index.js --prd PRD.md --continue`
7. Pipeline continues from task 101

**Pain Points Addressed**:
- Long-running pipelines exhaust system resources (EMFILE errors, OOM kills)
- No visibility into resource usage during execution
- No way to limit execution time or task count
- Lost progress when pipeline is interrupted
- No guidance on how to handle resource exhaustion

## Why

- **Business value**: Prevents pipeline failures from resource exhaustion, provides predictable execution bounds, enables processing of arbitrarily large PRDs through checkpoint/resume
- **Integration**: Extends existing graceful shutdown pattern (SIGINT/SIGTERM), uses SessionManager persistence, integrates with ProgressTracker for metrics, follows error hierarchy pattern
- **Problems solved**: EMFILE errors from file handle exhaustion, OOM kills from memory leaks, indefinite executions, lost progress on interruption, lack of resource visibility

## What

Implement resource monitoring and graceful degradation in PRPPipeline:

### 1. Resource Monitor Module (`src/utils/resource-monitor.ts`)
- **FileHandleMonitor**: Get current open file handle count, check ulimit, warn at 70%/85% thresholds
- **MemoryMonitor**: Get heap and system memory usage, warn at 80%/90% thresholds
- **ResourceMonitor**: Unified class combining both monitors with configurable polling interval
- **Leak detection**: Alert on >20% growth over 10-15 minutes
- **Platform support**: Linux (/proc), macOS (lsof), Windows (PowerShell/internal API)

### 2. CLI Argument Extensions (`src/cli/index.ts`)
- Add `maxTasks?: number` to `CLIArgs` interface
- Add `maxDuration?: number` to `CLIArgs` interface (milliseconds)
- Parse with `.option()` and validate positive integers
- Pass through to PRPPipeline constructor

### 3. PRPPipeline Integration (`src/workflows/prp-pipeline.ts`)
- Add `#maxTasks?: number` and `#maxDuration?: number` private fields
- Add `#resourceMonitor?: ResourceMonitor` field
- Create monitor in constructor if limits specified
- Check limits in `executeBacklog()` loop after each task
- Trigger graceful shutdown with `shutdownRequested = true`
- Set `shutdownReason = 'RESOURCE_LIMIT'` for new shutdown type

### 4. Graceful Shutdown Enhancement
- Extend `shutdownReason` type: `'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT'`
- Log resource summary when shutting down (file handles, memory, task count, duration)
- Provide actionable suggestions: "Increase ulimit with `ulimit -n 4096`", "Split PRD into smaller phases"

### 5. Progress Preservation
- Call `sessionManager.flushUpdates()` before shutdown
- Call `sessionManager.saveBacklog()` to persist current state
- Log completion percentage and resume instructions
- Generate `RESOURCE_LIMIT_REPORT.md` in session directory

### Success Criteria

- [ ] ResourceMonitor class exported from src/utils/resource-monitor.ts
- [ ] FileHandleMonitor uses platform-specific detection (Linux/macOS/Windows)
- [ ] MemoryMonitor tracks heap and system memory with thresholds
- [ ] CLI flags --max-tasks and --max-duration parse and validate correctly
- [ ] PRPPipeline checks all limits after each task completion
- [ ] Graceful shutdown preserves session state for resumption
- [ ] RESOURCE_LIMIT_REPORT.md generated with actionable suggestions
- [ ] 100% test coverage for resource monitoring logic
- [ ] Warnings logged at warning thresholds (70% file, 80% memory)
- [ ] Shutdown triggered at critical thresholds (85% file, 90% memory, user limits)

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with this codebase should be able to implement this PRP successfully using only this document and the referenced files.

### Documentation & References

```yaml
# MUST READ - PRPPipeline graceful shutdown pattern
- file: src/workflows/prp-pipeline.ts
  why: Understand existing shutdown pattern with shutdownRequested flag, signal handlers, cleanup() method
  pattern: Lines 168-174 (shutdownRequested field), 282-316 (#setupSignalHandlers), 810-824 (shutdown check in loop), 1225-1298 (cleanup())
  critical: shutdownRequested flag pattern, cleanup() always runs via finally, flushUpdates() + saveBacklog() sequence
  gotcha: Must set shutdownRequested flag AND shutdownReason, then break from loop - cleanup() handles the rest

# MUST READ - Session state persistence
- file: src/core/session-manager.ts
  why: Exact methods for saving progress: flushUpdates(), saveBacklog()
  pattern: Lines 526-576 (flushUpdates()), 492-502 (saveBacklog())
  critical: Always call flushUpdates() before saveBacklog() to persist batch updates atomically
  gotcha: flushUpdates() has early return if !#dirty - still call it, it handles the check

# MUST READ - CLI argument pattern
- file: src/cli/index.ts
  why: Pattern for adding new CLI flags with validation
  pattern: Lines 52-82 (CLIArgs interface), 108-171 (parseCLIArgs function)
  critical: Add properties to CLIArgs interface, use .option() with validation, pass to PRPPipeline constructor
  gotcha: Validate === undefined check before validating numeric values, use process.exit(1) on validation failure

# MUST READ - Progress tracking for metrics
- file: src/utils/progress.ts
  why: ProgressTracker provides completion percentage, ETA, elapsed time
  pattern: Lines 47-62 (ProgressReport interface), 291-310 (getProgress() method)
  critical: Use progressTracker.getProgress() for current completion % when shutting down
  gotcha: Call getProgress() after each task completes for accurate metrics

# MUST READ - Error hierarchy for resource limit errors
- file: src/utils/errors.ts
  why: Use PipelineError or create ResourceLimitError for resource exhaustion
  pattern: Lines 58-85 (ErrorCodes), 140-333 (PipelineError base class)
  critical: Add new error code: PIPELINE_RESOURCE_LIMIT_EXCEEDED
  gotcha: Don't throw for resource limits - log warning and set shutdownRequested flag instead

# MUST READ - Main entry point integration
- file: src/index.ts
  why: How CLI args flow to PRPPipeline constructor
  pattern: Find where PRPPipeline is instantiated, pass new args
  critical: Args flow: parseCLIArgs() → CLIArgs → PRPPipeline constructor → private fields
  gotcha: All CLI args must be added to PRPPipeline constructor signature before use

# RESEARCH DOCUMENTATION - Node.js resource monitoring APIs
- docfile: plan/001_14b9dc2a33c7/P5M4T2S3/research/nodejs-resource-monitoring.md
  why: Complete implementation of FileHandleMonitor, MemoryMonitor, ResourceMonitor with platform-specific code
  section: "Complete Implementation", "Platform-Specific Considerations", "Best Practices and Gotchas"
  critical: process._getActiveHandles() (internal), process.memoryUsage(), v8.getHeapStatistics(), os.totalmem()/os.freemem()
  gotcha: process._getActiveHandles() is internal API - use with fallback to platform commands

# RESEARCH DOCUMENTATION - Graceful shutdown patterns
- docfile: plan/001_14b9dc2a33c7/P5M4T2S3/research/graceful-shutdown-patterns.md
  why: Existing shutdown pattern to extend for resource limits
  section: "Current Graceful Shutdown Pattern", "Extending for Resource Limits"
  critical: shutdownRequested boolean flag, check after each task, break from loop, cleanup() in finally
  gotcha: Don't throw error for resource limit - use flag pattern like SIGINT/SIGTERM

# RESEARCH DOCUMENTATION - Session persistence patterns
- docfile: plan/001_14b9dc2a33c7/P5M4T2S3/research/session-persistence-patterns.md
  why: Exact API calls for saving progress before shutdown
  section: "API Calls for Graceful Stopping", "Essential Sequence"
  critical: await sessionManager.flushUpdates(), await sessionManager.saveBacklog(backlog)
  gotcha: Order matters: flushUpdates() FIRST, then saveBacklog()

# RESEARCH DOCUMENTATION - CLI argument patterns
- docfile: plan/001_14b9dc2a33c7/P5M4T2S3/research/cli-argument-patterns.md
  why: Exact pattern for adding --max-tasks and --max-duration flags
  section: "Exact Pattern for --max-tasks N", "Exact Pattern for --max-duration N"
  critical: Add to CLIArgs interface, .option() with validation, pass to PRPPipeline constructor
  gotcha: Optional numeric flags use undefined as default, validate !== undefined before checking value
```

### Current Codebase Tree

```bash
src/
├── cli/
│   └── index.ts                  # MODIFY - Add --max-tasks, --max-duration flags
├── core/
│   ├── session-manager.ts        # USE - flushUpdates(), saveBacklog() for progress preservation
│   └── task-orchestrator.ts      # REFERENCE - processNextItem() loop pattern
├── utils/
│   ├── errors.ts                 # MODIFY - Add PIPELINE_RESOURCE_LIMIT_EXceeded error code
│   ├── logger.ts                 # USE - getLogger('ResourceMonitor') for structured logging
│   ├── progress.ts               # USE - ProgressTracker for completion metrics
│   └── retry.ts                  # REFERENCE - Retry pattern (not used for this PRP)
├── workflows/
│   └── prp-pipeline.ts           # MODIFY - Add resource monitoring, limit checking
└── index.ts                      # MODIFY - Pass new CLI args to PRPPipeline

tests/
└── unit/
    └── utils/
        └── resource-monitor.test.ts  # CREATE - Comprehensive tests
```

### Desired Codebase Tree (After Implementation)

```bash
src/
├── cli/
│   └── index.ts                  # MODIFIED - Added maxTasks, maxDuration to CLIArgs
├── core/
│   ├── session-manager.ts        # EXISTING - Use for progress preservation
│   └── task-orchestrator.ts      # EXISTING - Reference for loop pattern
├── utils/
│   ├── errors.ts                 # MODIFIED - Added PIPELINE_RESOURCE_LIMIT_EXCEEDED
│   ├── resource-monitor.ts       # NEW - ResourceMonitor, FileHandleMonitor, MemoryMonitor
│   ├── logger.ts                 # EXISTING - Use for logging
│   └── progress.ts               # EXISTING - Use for metrics
├── workflows/
│   └── prp-pipeline.ts           # MODIFIED - Added resource monitoring, limit checking
└── index.ts                      # MODIFIED - Pass new CLI args

tests/
└── unit/
    └── utils/
        └── resource-monitor.test.ts  # NEW - Comprehensive test suite
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: process._getActiveHandles() is internal Node.js API
// Not guaranteed to be stable across Node.js versions
// Use as primary method with fallbacks to platform commands
// Import: No import needed - available on global process object
// Usage: const handleCount = process._getActiveHandles()?.length || 0

// CRITICAL: File handle monitoring is platform-specific
// Linux: Read /proc/<pid>/fd directory (fast, accurate)
// macOS: Use `lsof -p <pid>` command (slow, requires spawn)
// Windows: Use PowerShell or internal API only
// Pattern: Detect platform with process.platform, use appropriate method

// CRITICAL: ulimit command only works on Unix-like systems
// Windows doesn't have ulimit concept - file handle limit is different
// For cross-platform compatibility, only check ulimit on Linux/macOS
// Usage: execSync('ulimit -n').toString().trim() to get soft limit

// CRITICAL: Memory monitoring requires understanding V8 heap vs system memory
// process.memoryUsage() returns V8 heap (RSS, heapTotal, heapUsed, external)
// os.totalmem() / os.freemem() returns system-wide memory
// Use BOTH: heap for Node.js-specific limits, system for OS-level limits
// Gotcha: RSS can exceed heapTotal due to external memory (C++ bindings, Buffers)

// CRITICAL: Polling frequency affects performance and accuracy
// Too frequent (1s): Performance degradation, false positives from GC spikes
// Too infrequent (5m): Miss critical resource exhaustion, slow response
// Recommendation: 30 seconds for production, 10 seconds for development
// Pattern: Use setInterval() in constructor, clear in cleanup()

// CRITICAL: Resource monitoring should be non-blocking
// Don't use execSync() - it blocks the event loop
// Use spawn() with callbacks or promises for platform commands
// Pattern: Use child_process.spawn() with streams, timeout after 5 seconds

// CRITICAL: Graceful shutdown must NOT throw errors
// Use shutdownRequested flag pattern (boolean), not exceptions
// Check flag in loop, break gracefully, let cleanup() handle the rest
// Pattern: if (this.#resourceMonitor?.shouldStop() || this.shutdownRequested) { break; }

// CRITICAL: Session state preservation order matters
// ALWAYS call flushUpdates() BEFORE saveBacklog()
// flushUpdates() persists batch updates atomically
// saveBacklog() writes the complete task registry
// Pattern: await this.sessionManager.flushUpdates(); await this.sessionManager.saveBacklog(backlog);

// CRITICAL: shutdownReason type needs to be extended
// Current type: 'SIGINT' | 'SIGTERM' | null
// New type: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT' | null
// Update in prp-pipeline.ts line 174 and PipelineResult interface line 81

// CRITICAL: --max-tasks and --max-duration are OPTIONAL flags
// Default to undefined, not 0 or Infinity
// Validation: Check !== undefined before validating positive integer
// Pattern: if (options.maxTasks !== undefined && options.maxTasks <= 0) { error }

// CRITICAL: Resource limit shutdown is DIFFERENT from signal shutdown
// Signal shutdown: User-initiated (Ctrl+C), finish current task, exit
// Resource limit: Automatic, finish current task, exit with message
// Both use same shutdownRequested flag but different shutdownReason values

// CRITICAL: ProgressTracker must be updated before resource check
// Call tracker.recordComplete(itemId) AFTER task completes
// THEN check resource limits with fresh progress data
// Pattern: tracker.recordComplete(itemId); if (checkLimits()) { break; }

// CRITICAL: ResourceMonitor should be created in constructor
// Don't create in executeBacklog() - too late, wastes time
// Pass options from CLI args to ResourceMonitor constructor
// Pattern: this.#resourceMonitor = new ResourceMonitor({ maxTasks, maxDuration });

// CRITICAL: Leak detection uses historical data, not instantaneous
// Track samples over time (last 10-15 minutes), calculate trend
// Alert if >20% growth over sampling window
// Pattern: Circular buffer of samples, calculate slope, alert if positive

// CRITICAL: Platform detection uses process.platform
// Values: 'darwin' (macOS), 'linux', 'win32' (Windows)
// Use strict equality: process.platform === 'linux'
// Pattern: const platform = process.platform; if (platform === 'win32') { /* Windows */ }

// CRITICAL: Logging should use structured logger with context
// Import: import { getLogger } from '../utils/logger.js'
// Usage: const logger = getLogger('ResourceMonitor')
// Pattern: logger.warn({ handleCount, ulimit, percentage }, 'File handle usage high')

// CRITICAL: RESOURCE_LIMIT_REPORT.md should be generated in session directory
// Get path from: this.sessionManager.currentSession?.metadata.path
// Use resolve() and writeFile() from 'node:path' and 'node:fs/promises'
// Pattern: const reportPath = resolve(sessionPath, 'RESOURCE_LIMIT_REPORT.md')
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Resource configuration from CLI
interface ResourceConfig {
  /** Maximum number of tasks to execute (optional) */
  maxTasks?: number;
  /** Maximum execution duration in milliseconds (optional) */
  maxDuration?: number;
  /** File handle warning threshold (default: 0.7 = 70%) */
  fileHandleWarnThreshold?: number;
  /** File handle critical threshold (default: 0.85 = 85%) */
  fileHandleCriticalThreshold?: number;
  /** Memory warning threshold (default: 0.8 = 80%) */
  memoryWarnThreshold?: number;
  /** Memory critical threshold (default: 0.9 = 90%) */
  memoryCriticalThreshold?: number;
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  pollingInterval?: number;
}

// Resource snapshot for monitoring
interface ResourceSnapshot {
  /** Timestamp when snapshot was taken */
  timestamp: number;
  /** Open file handle count */
  fileHandles: number;
  /** File handle ulimit (0 on Windows) */
  fileHandleUlimit: number;
  /** File handle usage percentage (0-1) */
  fileHandleUsage: number;
  /** Heap memory used in bytes */
  heapUsed: number;
  /** Heap memory total in bytes */
  heapTotal: number;
  /** System total memory in bytes */
  systemTotal: number;
  /** System free memory in bytes */
  systemFree: number;
  /** Memory usage percentage (0-1) */
  memoryUsage: number;
}

// Resource limit status
interface ResourceLimitStatus {
  /** Whether any limit has been reached */
  shouldStop: boolean;
  /** Which limit was reached */
  limitType: 'maxTasks' | 'maxDuration' | 'fileHandles' | 'memory' | null;
  /** Current resource snapshot */
  snapshot: ResourceSnapshot;
  /** Warning messages (if any) */
  warnings: string[];
  /** Suggestion message for user */
  suggestion?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/resource-monitor.ts
  - IMPLEMENT: ResourceSnapshot, ResourceConfig, ResourceLimitStatus interfaces
  - IMPLEMENT: FileHandleMonitor class with platform-specific detection
  - IMPLEMENT: MemoryMonitor class with heap and system tracking
  - IMPLEMENT: ResourceMonitor class combining both monitors
  - NAMING: PascalCase for classes, camelCase for methods
  - PLACEMENT: Utils module alongside logger.ts, errors.ts
  - EXPORT: ResourceMonitor as default export

Task 2: IMPLEMENT FileHandleMonitor class
  - CREATE: FileHandleMonitor class with constructor accepting threshold config
  - IMPLEMENT: getHandleCount() method - platform-specific (Linux/macOS/Windows)
  - IMPLEMENT: getUlimit() method - Unix only, returns 0 on Windows
  - IMPLEMENT: check() method - returns { exceeded, percentage, suggestion }
  - PLATFORM: Use process.platform detection, /proc for Linux, lsof for macOS
  - DEPENDENCIES: Task 1 (interfaces defined)

Task 3: IMPLEMENT MemoryMonitor class
  - CREATE: MemoryMonitor class with constructor accepting threshold config
  - IMPLEMENT: getMemoryUsage() method using process.memoryUsage()
  - IMPLEMENT: getSystemMemory() method using os.totalmem()/os.freemem()
  - IMPLEMENT: check() method - returns { exceeded, percentage, suggestion }
  - DEPENDENCIES: Task 1 (interfaces defined)

Task 4: IMPLEMENT ResourceMonitor unified class
  - CREATE: ResourceMonitor class accepting ResourceConfig
  - COMPOSE: FileHandleMonitor and MemoryMonitor instances
  - IMPLEMENT: start() method - begins polling with setInterval
  - IMPLEMENT: stop() method - clears interval with clearInterval
  - IMPLEMENT: getStatus() method - returns ResourceLimitStatus
  - IMPLEMENT: shouldStop() method - boolean check for any limit exceeded
  - TRACK: Task count, duration, historical samples for leak detection
  - DEPENDENCIES: Task 2, Task 3

Task 5: ADD new error code to error hierarchy
  - MODIFY: src/utils/errors.ts
  - ADD: PIPELINE_RESOURCE_LIMIT_EXCEEDED to ErrorCodes const
  - VALUE: 'PIPELINE_RESOURCE_LIMIT_EXCEEDED'
  - PATTERN: Follow existing error code naming convention
  - DEPENDENCIES: None (can be done in parallel with Tasks 1-4)

Task 6: MODIFY CLI arguments in src/cli/index.ts
  - ADD: maxTasks?: number to CLIArgs interface
  - ADD: maxDuration?: number to CLIArgs interface
  - IMPLEMENT: .option('--max-tasks <number>', 'Maximum tasks to execute')
  - IMPLEMENT: .option('--max-duration <ms>', 'Max duration in milliseconds')
  - VALIDATE: Positive integer check, log error, process.exit(1) on failure
  - PATTERN: Follow existing .option() pattern (lines 117-138)
  - DEPENDENCIES: None (can be done in parallel with Tasks 1-4)

Task 7: MODIFY main entry point src/index.ts
  - FIND: PRPPipeline instantiation
  - PASS: args.maxTasks as constructor parameter
  - PASS: args.maxDuration as constructor parameter
  - PRESERVE: All existing constructor arguments
  - ORDER: Add after continueOnError parameter
  - DEPENDENCIES: Task 6 (CLI args defined)

Task 8: MODIFY PRPPipeline constructor
  - ADD: #maxTasks?: number private readonly field
  - ADD: #maxDuration?: number private readonly field
  - ADD: #resourceMonitor?: ResourceMonitor private field
  - ADD: #resourceLimitReached: boolean = false field
  - ACCEPT: maxTasks and maxDuration constructor parameters
  - CREATE: ResourceMonitor instance if limits specified
  - START: Monitoring with resourceMonitor.start() if created
  - DEPENDENCIES: Task 4, Task 7

Task 9: EXTEND shutdownReason type in PRPPipeline
  - MODIFY: shutdownReason field type from 'SIGINT' | 'SIGTERM' | null
  - TO: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT' | null
  - MODIFY: PipelineResult.shutdownReason type to match
  - DEPENDENCIES: None (type change, can be done anytime)

Task 10: INTEGRATE resource checking in executeBacklog()
  - MODIFY: src/workflows/prp-pipeline.ts executeBacklog() method
  - ADD: Resource check after each task completion (line ~807)
  - CHECK: this.#resourceMonitor?.shouldStop() after tracking progress
  - CHECK: this.completedTasks >= this.#maxTasks if maxTasks specified
  - CHECK: elapsed time >= this.#maxDuration if maxDuration specified
  - TRIGGER: Graceful shutdown if any limit reached
  - SET: shutdownReason = 'RESOURCE_LIMIT' before breaking
  - LOG: Resource summary and suggestion before exit
  - DEPENDENCIES: Task 8, Task 9

Task 11: CREATE RESOURCE_LIMIT_REPORT.md generator
  - CREATE: #generateResourceLimitReport() private method in PRPPipeline
  - WRITE: Report to session directory at cleanup time
  - INCLUDE: Resource snapshot, task progress, suggestions for resolution
  - CONTENT: ulimit increase command, PRD splitting guidance
  - PATH: resolve(sessionPath, 'RESOURCE_LIMIT_REPORT.md')
  - DEPENDENCIES: Task 10 (triggered when limit reached)

Task 12: ENHANCE cleanup() for resource monitor
  - MODIFY: cleanup() method in prp-pipeline.ts
  - ADD: this.#resourceMonitor?.stop() to halt polling
  - ADD: Check for #resourceLimitReached flag
  - GENERATE: RESOURCE_LIMIT_REPORT.md if flag set
  - PRESERVE: All existing cleanup logic (signal handlers, state save)
  - DEPENDENCIES: Task 11

Task 13: CREATE unit tests for resource monitor
  - CREATE: tests/unit/utils/resource-monitor.test.ts
  - TEST: FileHandleMonitor on all platforms (mock platform detection)
  - TEST: MemoryMonitor with mock process.memoryUsage() and os module
  - TEST: ResourceMonitor start/stop lifecycle
  - TEST: shouldStop() returns true when limits exceeded
  - TEST: Leak detection with historical samples
  - COVERAGE: Target 100% for resource-monitor.ts
  - DEPENDENCIES: Task 4 (ResourceMonitor complete)

Task 14: CREATE integration test for PRPPipeline resource limits
  - CREATE: tests/integration/prp-pipeline-resource-limits.test.ts
  - TEST: Pipeline stops at --max-tasks limit
  - TEST: Pipeline stops at --max-duration limit
  - TEST: State preserved and can be resumed
  - TEST: RESOURCE_LIMIT_REPORT.md generated
  - VERIFY: shutdownReason = 'RESOURCE_LIMIT'
  - DEPENDENCIES: Task 10, Task 12
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// TASK 2: FILE HANDLE MONITOR (Platform-Specific)
// ============================================================================
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

class FileHandleMonitor {
  readonly warnThreshold: number;
  readonly criticalThreshold: number;
  readonly logger: ReturnType<typeof getLogger>;

  constructor(warnThreshold: number = 0.7, criticalThreshold: number = 0.85) {
    this.warnThreshold = warnThreshold;
    this.criticalThreshold = criticalThreshold;
    this.logger = getLogger('FileHandleMonitor');
  }

  /**
   * Gets current open file handle count
   * Platform-specific: Linux (/proc), macOS (lsof), Windows (internal API)
   */
  getHandleCount(): number {
    // GOTCHA: process._getActiveHandles() is internal API
    // Use as primary with fallback to platform commands
    try {
      const handles = (process as any)._getActiveHandles();
      if (handles && Array.isArray(handles)) {
        return handles.length;
      }
    } catch {
      // Internal API not available, use platform-specific method
    }

    // Platform-specific fallback
    const platform = process.platform;
    if (platform === 'linux') {
      // FAST: Read /proc/<pid>/fd directory
      const fdPath = `/proc/${process.pid}/fd`;
      if (existsSync(fdPath)) {
        return readdirSync(fdPath).length;
      }
    } else if (platform === 'darwin') {
      // SLOW: Use lsof command (spawn, not execSync to avoid blocking)
      // For this implementation, we'll use execSync with timeout awareness
      try {
        const result = execSync(`lsof -p ${process.pid} | wc -l`, {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
        return parseInt(result.trim(), 10) - 1; // Subtract header line
      } catch {
        return 0;
      }
    }

    // Windows or fallback: return 0 (no ulimit concept)
    return 0;
  }

  /**
   * Gets file handle ulimit (Unix only)
   * Returns 0 on Windows (no ulimit)
   */
  getUlimit(): number {
    const platform = process.platform;
    if (platform === 'win32') {
      return 0; // Windows doesn't have ulimit
    }

    try {
      const ulimit = execSync('ulimit -n', { encoding: 'utf-8' });
      return parseInt(ulimit.trim(), 10);
    } catch {
      return 1024; // Common default
    }
  }

  /**
   * Checks if file handle limit is exceeded
   * Returns status with suggestion
   */
  check(): {
    exceeded: boolean;
    percentage: number;
    suggestion?: string;
  } {
    const handleCount = this.getHandleCount();
    const ulimit = this.getUlimit();

    if (ulimit === 0) {
      // Windows or no ulimit - no check
      return { exceeded: false, percentage: 0 };
    }

    const percentage = handleCount / ulimit;

    if (percentage >= this.criticalThreshold) {
      return {
        exceeded: true,
        percentage,
        suggestion: `Increase file handle limit: ulimit -n ${Math.floor(ulimit * 2)}`
      };
    }

    if (percentage >= this.warnThreshold) {
      this.logger.warn(
        { handleCount, ulimit, percentage: (percentage * 100).toFixed(1) + '%' },
        'File handle usage high'
      );
    }

    return { exceeded: false, percentage };
  }
}

// ============================================================================
// TASK 3: MEMORY MONITOR
// ============================================================================
import { totalmem, freemem } from 'node:os';

class MemoryMonitor {
  readonly warnThreshold: number;
  readonly criticalThreshold: number;
  readonly logger: ReturnType<typeof getLogger>;

  constructor(warnThreshold: number = 0.8, criticalThreshold: number = 0.9) {
    this.warnThreshold = warnThreshold;
    this.criticalThreshold = criticalThreshold;
    this.logger = getLogger('MemoryMonitor');
  }

  /**
   * Gets current memory usage
   * Combines V8 heap and system memory
   */
  getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    systemTotal: number;
    systemFree: number;
    usage: number;
  } {
    // GOTCHA: process.memoryUsage() returns V8 heap ONLY
    // RSS includes external memory (C++ bindings, Buffers)
    const mem = process.memoryUsage();
    const sysTotal = totalmem();
    const sysFree = freemem();
    const sysUsed = sysTotal - sysFree;

    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      systemTotal: sysTotal,
      systemFree: sysFree,
      usage: sysUsed / sysTotal
    };
  }

  /**
   * Checks if memory limit is exceeded
   */
  check(): {
    exceeded: boolean;
    percentage: number;
    suggestion?: string;
  } {
    const { usage } = this.getMemoryUsage();

    if (usage >= this.criticalThreshold) {
      return {
        exceeded: true,
        percentage: usage,
        suggestion: 'Reduce memory usage or increase system memory. Consider splitting PRD into smaller phases.'
      };
    }

    if (usage >= this.warnThreshold) {
      this.logger.warn(
        { percentage: (usage * 100).toFixed(1) + '%' },
        'Memory usage high'
      );
    }

    return { exceeded: false, percentage: usage };
  }
}

// ============================================================================
// TASK 4: UNIFIED RESOURCE MONITOR
// ============================================================================
interface ResourceConfig {
  maxTasks?: number;
  maxDuration?: number;
  fileHandleWarnThreshold?: number;
  fileHandleCriticalThreshold?: number;
  memoryWarnThreshold?: number;
  memoryCriticalThreshold?: number;
  pollingInterval?: number;
}

class ResourceMonitor {
  readonly fileHandleMonitor: FileHandleMonitor;
  readonly memoryMonitor: MemoryMonitor;
  readonly config: ResourceConfig;
  readonly logger: ReturnType<typeof getLogger>;

  #tasksCompleted: number = 0;
  #startTime: number = Date.now();
  #intervalId: NodeJS.Timeout | null = null;
  #snapshots: ResourceSnapshot[] = [];

  constructor(config: ResourceConfig = {}) {
    this.config = config;
    this.fileHandleMonitor = new FileHandleMonitor(
      config.fileHandleWarnThreshold,
      config.fileHandleCriticalThreshold
    );
    this.memoryMonitor = new MemoryMonitor(
      config.memoryWarnThreshold,
      config.memoryCriticalThreshold
    );
    this.logger = getLogger('ResourceMonitor');
  }

  /**
   * Starts resource monitoring polling
   */
  start(): void {
    if (this.#intervalId) {
      return; // Already started
    }

    const interval = this.config.pollingInterval ?? 30000; // 30s default

    this.#intervalId = setInterval(() => {
      this.#takeSnapshot();
    }, interval);

    this.logger.debug({ interval }, 'Resource monitoring started');
  }

  /**
   * Stops resource monitoring polling
   */
  stop(): void {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
      this.logger.debug('Resource monitoring stopped');
    }
  }

  /**
   * Records a task completion
   */
  recordTaskComplete(): void {
    this.#tasksCompleted++;
  }

  /**
   * Gets current resource status
   */
  getStatus(): ResourceLimitStatus {
    const fileStatus = this.fileHandleMonitor.check();
    const memStatus = this.memoryMonitor.check();

    const warnings: string[] = [];
    let limitType: 'maxTasks' | 'maxDuration' | 'fileHandles' | 'memory' | null = null;
    let suggestion: string | undefined;

    // Check resource limits
    if (fileStatus.exceeded) {
      limitType = 'fileHandles';
      suggestion = fileStatus.suggestion;
    }

    if (memStatus.exceeded) {
      limitType = 'memory';
      suggestion = memStatus.suggestion;
    }

    // Check user-defined limits
    if (this.config.maxTasks && this.#tasksCompleted >= this.config.maxTasks) {
      limitType = 'maxTasks';
      suggestion = 'Resume with --continue flag or increase --max-tasks limit';
    }

    if (this.config.maxDuration) {
      const elapsed = Date.now() - this.#startTime;
      if (elapsed >= this.config.maxDuration) {
        limitType = 'maxDuration';
        suggestion = 'Resume with --continue flag or increase --max-duration limit';
      }
    }

    return {
      shouldStop: limitType !== null,
      limitType,
      snapshot: this.#getCurrentSnapshot(),
      warnings,
      suggestion
    };
  }

  /**
   * Quick check if should stop (for loop condition)
   */
  shouldStop(): boolean {
    return this.getStatus().shouldStop;
  }

  /**
   * Takes a resource snapshot for historical tracking
   */
  #takeSnapshot(): void {
    const snapshot = this.#getCurrentSnapshot();
    this.#snapshots.push(snapshot);

    // Keep last 20 samples (10 minutes at 30s interval)
    if (this.#snapshots.length > 20) {
      this.#snapshots.shift();
    }

    // Check for leaks (20% growth over sampling window)
    this.#checkForLeaks();
  }

  /**
   * Gets current resource snapshot
   */
  #getCurrentSnapshot(): ResourceSnapshot {
    const mem = this.memoryMonitor.getMemoryUsage();
    return {
      timestamp: Date.now(),
      fileHandles: this.fileHandleMonitor.getHandleCount(),
      fileHandleUlimit: this.fileHandleMonitor.getUlimit(),
      fileHandleUsage: this.fileHandleMonitor.check().percentage,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      systemTotal: mem.systemTotal,
      systemFree: mem.systemFree,
      memoryUsage: mem.usage
    };
  }

  /**
   * Checks for resource leaks based on historical data
   */
  #checkForLeaks(): void {
    if (this.#snapshots.length < 5) return; // Need minimum samples

    const oldest = this.#snapshots[0];
    const newest = this.#snapshots[this.#snapshots.length - 1];

    // Check file handle leak (>20% growth)
    if (oldest.fileHandleUlimit > 0) {
      const growth = (newest.fileHandles - oldest.fileHandles) / oldest.fileHandles;
      if (growth > 0.2) {
        this.logger.warn(
          { growth: (growth * 100).toFixed(1) + '%', oldest: oldest.fileHandles, newest: newest.fileHandles },
          'Potential file handle leak detected'
        );
      }
    }

    // Check memory leak (>20% growth)
    const memGrowth = (newest.heapUsed - oldest.heapUsed) / oldest.heapUsed;
    if (memGrowth > 0.2) {
      this.logger.warn(
        { growth: (memGrowth * 100).toFixed(1) + '%', oldest: oldest.heapUsed, newest: newest.heapUsed },
        'Potential memory leak detected'
      );
    }
  }
}

// ============================================================================
// TASK 6: CLI ARGUMENT PATTERN
// ============================================================================
// In src/cli/index.ts

export interface CLIArgs {
  // ... existing properties ...
  /** Maximum number of tasks to execute */
  maxTasks?: number;
  /** Maximum execution duration in milliseconds */
  maxDuration?: number;
}

export function parseCLIArgs(): CLIArgs {
  const program = new Command();

  program
    .name('prp-pipeline')
    .description('PRD to PRP Pipeline - Automated software development')
    .version('1.0.0')
    // ... existing options ...
    .option('--max-tasks <number>', 'Maximum number of tasks to execute')
    .option('--max-duration <ms>', 'Maximum execution duration in milliseconds')
    .parse(process.argv);

  const options = program.opts<CLIArgs>();

  // Validate maxTasks
  if (options.maxTasks !== undefined) {
    if (!Number.isInteger(options.maxTasks) || options.maxTasks <= 0) {
      logger.error('--max-tasks must be a positive integer');
      process.exit(1);
    }
  }

  // Validate maxDuration
  if (options.maxDuration !== undefined) {
    if (!Number.isInteger(options.maxDuration) || options.maxDuration <= 0) {
      logger.error('--max-duration must be a positive integer (milliseconds)');
      process.exit(1);
    }
  }

  return options;
}

// ============================================================================
// TASK 8: PRPPIPELINE CONSTRUCTOR MODIFICATION
// ============================================================================
// In src/workflows/prp-pipeline.ts

import { ResourceMonitor, type ResourceConfig } from '../utils/resource-monitor.js';

export class PRPPipeline extends Workflow {
  // ... existing fields ...

  /** Reason for shutdown request */
  shutdownReason: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT' | null = null;

  /** Maximum tasks limit */
  readonly #maxTasks?: number;

  /** Maximum duration limit in milliseconds */
  readonly #maxDuration?: number;

  /** Resource monitor instance */
  #resourceMonitor?: ResourceMonitor;

  /** Whether resource limit was reached */
  #resourceLimitReached: boolean = false;

  constructor(
    prdPath: string,
    scope?: Scope,
    mode?: 'normal' | 'bug-hunt' | 'validate',
    noCache: boolean = false,
    continueOnError: boolean = false,
    maxTasks?: number,
    maxDuration?: number
  ) {
    super('PRPPipeline');

    // ... existing constructor code ...

    this.#maxTasks = maxTasks;
    this.#maxDuration = maxDuration;

    // Create resource monitor if limits specified
    if (maxTasks || maxDuration) {
      const resourceConfig: ResourceConfig = {
        maxTasks,
        maxDuration
      };
      this.#resourceMonitor = new ResourceMonitor(resourceConfig);
      this.#resourceMonitor.start();
      this.logger.info(
        { maxTasks, maxDuration },
        'Resource monitoring enabled'
      );
    }

    // ... rest of constructor ...
  }
}

// ============================================================================
// TASK 10: EXECUTEBACKLOG RESOURCE CHECKING
// ============================================================================
// In src/workflows/prp-pipeline.ts executeBacklog() method

async executeBacklog(): Promise<void> {
  this.logger.info('[PRPPipeline] Executing backlog');

  try {
    // ... existing initialization code ...

    let iterations = 0;
    const maxIterations = 10000;

    // Process items until queue is empty or shutdown requested
    while (await this.taskOrchestrator.processNextItem()) {
      try {
        iterations++;

        // Safety check
        if (iterations > maxIterations) {
          throw new Error(`Execution exceeded ${maxIterations} iterations`);
        }

        // Update completed tasks count
        this.completedTasks = this.#countCompletedTasks();

        // Track task completion for progress
        const currentItemId = this.taskOrchestrator.currentItemId ?? 'unknown';
        this.#progressTracker?.recordComplete(currentItemId);

        // CRITICAL: Record task completion in resource monitor
        if (this.#resourceMonitor) {
          this.#resourceMonitor.recordTaskComplete();
        }

        // Log progress every 5 tasks
        if (this.completedTasks % 5 === 0) {
          this.logger.info(
            `[PRPPipeline] ${this.#progressTracker?.formatProgress()}`
          );
        }

        // CRITICAL: Check for resource limits after each task
        if (this.#resourceMonitor?.shouldStop()) {
          const status = this.#resourceMonitor.getStatus();
          this.logger.warn(
            {
              limitType: status.limitType,
              tasksCompleted: this.completedTasks,
              snapshot: status.snapshot
            },
            '[PRPPipeline] Resource limit reached, initiating graceful shutdown'
          );

          if (status.suggestion) {
            this.logger.info(`[PRPPipeline] Suggestion: ${status.suggestion}`);
          }

          this.#resourceLimitReached = true;
          this.shutdownRequested = true;
          this.shutdownReason = 'RESOURCE_LIMIT';
          this.currentPhase = 'resource_limit_reached';
          break;
        }

        // Check for signal-based shutdown request
        if (this.shutdownRequested) {
          this.logger.info(
            '[PRPPipeline] Shutdown requested, finishing current task'
          );
          this.currentPhase = 'shutdown_interrupted';
          break;
        }

        // ... rest of loop code ...
      } catch (taskError) {
        // ... existing error handling ...
      }
    }

    // ... rest of method ...
  } catch (error) {
    // ... existing error handling ...
  }
}

// ============================================================================
// TASK 11: RESOURCE LIMIT REPORT GENERATOR
// ============================================================================
// In src/workflows/prp-pipeline.ts

async #generateResourceLimitReport(): Promise<void> {
  const status = this.#resourceMonitor?.getStatus();
  if (!status || !status.shouldStop) {
    return;
  }

  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (!sessionPath) {
    this.logger.warn('[PRPPipeline] Session path not available for resource report');
    return;
  }

  const progress = this.#progressTracker?.getProgress();
  const snapshot = status.snapshot;

  const content = `# Resource Limit Report

**Generated**: ${new Date().toISOString()}
**Limit Type**: ${status.limitType}
**Tasks Completed**: ${progress?.completed ?? 0} / ${progress?.total ?? 0}

## Summary

The pipeline reached a resource limit and gracefully shut down to prevent system exhaustion.

### Resource Snapshot

| Metric | Value |
|--------|-------|
| File Handles | ${snapshot.fileHandles} |
| File Handle Limit | ${snapshot.fileHandleUlimit > 0 ? snapshot.fileHandleUlimit : 'N/A (Windows)'} |
| File Handle Usage | ${(snapshot.fileHandleUsage * 100).toFixed(1)}% |
| Heap Used | ${(snapshot.heapUsed / 1024 / 1024).toFixed(1)} MB |
| Heap Total | ${(snapshot.heapTotal / 1024 / 1024).toFixed(1)} MB |
| System Memory Used | ${((1 - snapshot.systemFree / snapshot.systemTotal) * 100).toFixed(1)}% |

### Progress

- **Completed**: ${progress?.completed ?? 0} tasks
- **Remaining**: ${progress?.remaining ?? 0} tasks
- **Completion**: ${progress?.percentage.toFixed(1) ?? 0}%
- **Elapsed**: ${progress?.elapsed ? (progress.elapsed / 1000).toFixed(1) + 's' : 'N/A'}

## Recommendations

${status.suggestion ? `- ${status.suggestion}` : ''}

### How to Resume

\`\`\`bash
# Resume from where the pipeline stopped
node dist/index.js --prd PRD.md --continue
\`\`\`

### If Hitting File Handle Limits

\`\`\`bash
# Increase file handle limit (Linux/macOS)
ulimit -n 4096

# Then re-run the pipeline
node dist/index.js --prd PRD.md --continue
\`\`\`

### If Hitting Memory Limits

1. Consider splitting your PRD into smaller phases
2. Use \`--scope P1.M1\` to limit execution to specific milestones
3. Increase system memory or close other applications

---

Report Location: ${sessionPath}/RESOURCE_LIMIT_REPORT.md
`;

  const { resolve } = await import('node:path');
  const { writeFile } = await import('node:fs/promises');
  const reportPath = resolve(sessionPath, 'RESOURCE_LIMIT_REPORT.md');

  await writeFile(reportPath, content, 'utf-8');
  this.logger.info(`[PRPPipeline] Resource limit report written to ${reportPath}`);
}

// ============================================================================
// TASK 12: ENHANCED CLEANUP FOR RESOURCE MONITOR
// ============================================================================
// In src/workflows/prp-pipeline.ts cleanup() method

@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  this.logger.info('[PRPPipeline] Starting cleanup and state preservation');

  try {
    // CRITICAL: Stop resource monitoring
    if (this.#resourceMonitor) {
      this.#resourceMonitor.stop();
      this.logger.debug('[PRPPipeline] Resource monitoring stopped');
    }

    // ... existing cleanup code ...

    // Check if resource limit was reached
    if (this.#resourceLimitReached) {
      await this.#generateResourceLimitReport();
    }

    // ... rest of cleanup code ...
  } catch (error) {
    this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
  }
}
```

### Integration Points

```yaml
CLI_ARGS:
  - modify: src/cli/index.ts
  - add: "maxTasks?: number" and "maxDuration?: number" to CLIArgs interface
  - add: .option('--max-tasks <number>', 'Maximum tasks to execute')
  - add: .option('--max-duration <ms>', 'Max duration in milliseconds')
  - validate: Positive integer check, process.exit(1) on failure

MAIN_ENTRY:
  - modify: src/index.ts
  - pass: args.maxTasks and args.maxDuration to PRPPipeline constructor
  - pattern: "new PRPPipeline(args.prd, scope, args.mode, args.noCache, args.continueOnError, args.maxTasks, args.maxDuration)"

PRPPIPELINE_CONSTRUCTOR:
  - modify: src/workflows/prp-pipeline.ts constructor
  - add: "#maxTasks", "#maxDuration", "#resourceMonitor", "#resourceLimitReached" fields
  - create: ResourceMonitor instance if limits specified
  - start: Monitoring with resourceMonitor.start()

EXECUTE_BACKLOG:
  - modify: executeBacklog() method
  - check: resourceMonitor.shouldStop() after each task
  - check: completedTasks >= maxTasks
  - check: elapsed time >= maxDuration
  - trigger: Graceful shutdown with shutdownReason = 'RESOURCE_LIMIT'

CLEANUP:
  - modify: cleanup() method
  - add: resourceMonitor.stop() to halt polling
  - generate: RESOURCE_LIMIT_REPORT.md if #resourceLimitReached is true
  - preserve: All existing cleanup logic

ERROR_HIERARCHY:
  - modify: src/utils/errors.ts
  - add: PIPELINE_RESOURCE_LIMIT_EXCEEDED to ErrorCodes
  - value: 'PIPELINE_RESOURCE_LIMIT_EXCEEDED'
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating resource-monitor.ts
npm run lint -- src/utils/resource-monitor.ts --fix
npm run type-check
npm run format

# Run after modifying cli/index.ts
npm run lint -- src/cli/index.ts --fix

# Run after modifying prp-pipeline.ts
npm run lint -- src/workflows/prp-pipeline.ts --fix

# Run after modifying errors.ts
npm run lint -- src/utils/errors.ts --fix

# Project-wide validation
npm run lint
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test resource monitor
npm test -- tests/unit/utils/resource-monitor.test.ts --run

# Test CLI argument parsing (add test for new flags)
npm test -- tests/unit/cli/ --run

# Test PRPPipeline integration
npm test -- tests/unit/workflows/prp-pipeline.test.ts --run

# Full test suite
npm test -- tests/unit/ --run

# Coverage validation
npm test -- tests/unit/ --run --coverage

# Expected: All tests pass, 100% coverage for resource-monitor.ts
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the project
npm run build

# Test with --max-tasks flag (create small test PRD first)
cat > /tmp/test-prd.md << 'EOF'
# Test PRD

## Phase 1
### Milestone 1.1
#### Task 1.1: Simple task
Implement a simple function.
EOF

node dist/index.js --prd /tmp/test-prd.md --max-tasks 1
# Expected: Pipeline stops after 1 task, shows resource limit message

# Test with --max-duration flag (5 seconds)
node dist/index.js --prd /tmp/test-prd.md --max-duration 5000
# Expected: Pipeline stops after 5 seconds or task completion

# Test resume with --continue after resource limit
node dist/index.js --prd /tmp/test-prd.md --continue
# Expected: Pipeline resumes from checkpoint

# Test RESOURCE_LIMIT_REPORT.md generation
ls -la plan/*/RESOURCE_LIMIT_REPORT.md
# Expected: Report file exists in session directory

# Test CLI argument validation
node dist/index.js --max-tasks -1
# Expected: Error "max-tasks must be a positive integer"

# Test file handle monitoring (Linux/macOS only)
ulimit -n 256  # Set low limit for testing
node dist/index.js --prd /tmp/test-prd.md
# Expected: Warning logged when approaching ulimit

# Test memory monitoring
node --max-old-space-size=100 dist/index.js --prd /tmp/test-prd.md
# Expected: Warning logged when memory usage high

# Expected: All integration tests pass, resource monitoring works as designed
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test leak detection with intentional resource leak
cat > /tmp/leak-test.js << 'EOF'
// Intentional file handle leak for testing
const fs = require('fs');
const handles = [];
setInterval(() => {
  handles.push(fs.openSync('/dev/null', 'r'));
  console.log('Handles:', handles.length);
}, 1000);
EOF

node /tmp/leak-test.js &
LEAK_PID=$!
node dist/index.js --prd /tmp/test-prd.md
kill $LEAK_PID

# Test graceful shutdown with resource limit
node dist/index.js --prd /tmp/test-prd.md --max-tasks 1 &
sleep 2
# Pipeline should complete 1 task and exit gracefully

# Test concurrent resource monitoring
# Run multiple pipelines simultaneously to test file handle monitoring
node dist/index.js --prd /tmp/test-prd1.md --max-tasks 10 &
node dist/index.js --prd /tmp/test-prd2.md --max-tasks 10 &
wait
# Expected: Both pipelines complete without EMFILE errors

# Test progress preservation accuracy
node dist/index.js --prd /tmp/test-prd.md --max-tasks 5
node dist/index.js --prd /tmp/test-prd.md --continue
# Expected: Second run starts from task 6, not task 1

# Test RESOURCE_LIMIT_REPORT.md content
cat plan/*/RESOURCE_LIMIT_REPORT.md | grep -E "Tasks Completed|Limit Type|Recommendations"
# Expected: Report contains accurate metrics and suggestions

# Test ulimit suggestion accuracy
cat plan/*/RESOURCE_LIMIT_REPORT.md | grep "ulimit -n"
# Expected: Suggests doubling current ulimit

# Test cross-platform compatibility (if possible)
# Run on Linux, macOS, and Windows to verify platform-specific code
node dist/index.js --prd /tmp/test-prd.md
# Expected: Works on all platforms with appropriate fallbacks

# Expected: All creative validations pass, edge cases handled correctly
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/ --run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] ResourceMonitor class monitors file handles and memory
- [ ] FileHandleMonitor works on Linux, macOS, Windows with fallbacks
- [ ] MemoryMonitor tracks heap and system memory
- [ ] CLI flags --max-tasks and --max-duration parse correctly
- [ ] PRPPipeline checks limits after each task
- [ ] Graceful shutdown triggered when limits reached
- [ ] Session state preserved for resumption
- [ ] RESOURCE_LIMIT_REPORT.md generated with actionable suggestions
- [ ] Warnings logged at warning thresholds (70% file, 80% memory)
- [ ] Shutdown triggered at critical thresholds (85% file, 90% memory)

### Code Quality Validation

- [ ] Follows existing shutdownRequested flag pattern
- [ ] Uses SessionManager.flushUpdates() and saveBacklog() correctly
- [ ] Logger used with proper context (getLogger('ResourceMonitor'))
- [ ] Platform-specific code uses process.platform detection
- [ ] Non-blocking operations (no execSync for monitoring)
- [ ] Error handling with try-catch for platform commands
- [ ] Cleanup stops resource monitor polling

### Documentation & Deployment

- [ ] Code is self-documenting with JSDoc comments
- [ ] RESOURCE_LIMIT_REPORT.md has clear user guidance
- [ ] CLI help text describes new flags (--help)
- [ ] ulimit suggestion includes exact command
- [ ] PRD splitting guidance provided in suggestions

---

## Anti-Patterns to Avoid

- ❌ Don't use execSync() for monitoring - blocks event loop, use spawn/promises
- ❌ Don't throw errors for resource limits - use shutdownRequested flag pattern
- ❌ Don't forget cross-platform support - Windows doesn't have ulimit
- ❌ Don't create resource monitor in executeBacklog() - too late, create in constructor
- ❌ Don't skip flushUpdates() before saveBacklog() - order matters for atomicity
- ❌ Don't use process._getActiveHandles() without fallback - internal API may change
- ❌ Don't check resources before task completion - check AFTER with fresh metrics
- ❌ Don't forget to stop monitoring in cleanup() - causes memory leak from setInterval
- ❌ Don't hardcode thresholds - make configurable via ResourceConfig
- ❌ Don't ignore leak detection - warn user about resource growth trends
- ❌ Don't forget to update shutdownReason type - add 'RESOURCE_LIMIT' variant
- ❌ Don't generate RESOURCE_LIMIT_REPORT.md if limit not reached - check flag first
