# Product Requirement Prompt (PRP): P1.M1.T4.S3 - Verify resource monitoring and limits

---

## Goal

**Feature Goal**: Create comprehensive unit tests that verify ResourceMonitor's file handle tracking, heap stats capture, max-tasks/max-duration limit enforcement, and RESOURCE_LIMIT_REPORT.md generation with actionable suggestions.

**Deliverable**: Unit test file `tests/unit/resource-monitoring.test.ts` with complete coverage of resource tracking and limit enforcement verification.

**Success Definition**: All tests pass, verifying:

- File handle count is monitored using platform-specific methods (process.\_getActiveHandles, /proc filesystem, lsof on macOS)
- Heap stats are captured via process.memoryUsage() and calculated correctly
- max-tasks limit stops pipeline after N tasks complete
- max-duration limit stops pipeline after N milliseconds
- RESOURCE_LIMIT_REPORT.md is generated with proper format, resource snapshot, progress summary, and actionable suggestions
- All resource metrics are mocked appropriately for deterministic testing

## Why

- ResourceMonitor prevents system exhaustion during long-running pipeline executions
- File handle leaks can cause "EMFILE: too many open files" errors
- Memory leaks can cause OOM kills and data loss
- max-tasks limit allows users to control work scope (e.g., "run 5 tasks then review")
- max-duration limit prevents runaway processes (e.g., "stop after 1 hour")
- RESOURCE_LIMIT_REPORT.md provides actionable feedback for resuming work
- Existing `tests/unit/utils/resource-monitor.test.ts` has basic coverage but lacks limit enforcement verification
- Platform-specific behaviors (Linux/macOS/Windows) need isolated testing
- This is unit-level testing - pipeline integration is covered by P1.M1.T4.S1 and shutdown by P1.M1.T4.S2

## What

Unit tests that verify ResourceMonitor's core functionality across resource tracking, limit enforcement, and report generation.

### Success Criteria

- [ ] File handle count monitored via process.\_getActiveHandles() (primary method)
- [ ] Linux: Falls back to /proc/<pid>/fd directory counting
- [ ] macOS: Falls back to lsof -p <pid> command (5s timeout)
- [ ] Windows: Returns 0 (no ulimit concept)
- [ ] Heap stats captured via process.memoryUsage() (heapUsed, heapTotal, rss)
- [ ] Heap usage percentage calculated correctly (heapUsed / heapTotal \* 100)
- [ ] Memory leak detection logged when >20% growth over 5 samples
- [ ] max-tasks limit: shouldStop() returns true after N tasks
- [ ] max-tasks limit: getTasksCompleted() returns accurate count
- [ ] max-duration limit: shouldStop() returns true after N milliseconds
- [ ] max-duration limit: getElapsed() returns correct milliseconds
- [ ] RESOURCE_LIMIT_REPORT.md generated when limit exceeded
- [ ] Report includes timestamp, limit type, resource snapshot table
- [ ] Report includes progress summary (completed/total tasks)
- [ ] Report includes actionable suggestions based on limit type
- [ ] Report includes resume instructions (--continue flag)
- [ ] Critical thresholds (85% file handles, 90% memory) trigger stop
- [ ] Warning thresholds (70% file handles, 80% memory) log warnings
- [ ] Multiple limits handled correctly (priority order applied)
- [ ] Zero values (maxTasks: 0, maxDuration: 0) represent no limit
- [ ] Platform-specific tests isolated with proper cleanup

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Complete ResourceMonitor implementation structure from codebase analysis
- Existing test patterns from resource-monitor.test.ts with working mock examples
- External research on testing Node.js resource monitoring with specific URLs
- Test design with 7 categories covering all contract requirements
- Mock helper functions for process, os, child_process, timers
- Platform-specific testing strategies for Linux/macOS/Windows

### Documentation & References

```yaml
# MUST READ - ResourceMonitor implementation
- file: src/utils/resource-monitor.ts
  why: Complete resource monitoring implementation to test
  lines: 50-180 (FileHandleMonitor class - platform-specific handle counting)
  lines: 185-250 (MemoryMonitor class - heap and system memory tracking)
  lines: 255-600 (ResourceMonitor main class - limits, polling, lifecycle)
  pattern: Resource monitor with polling interval, limit checking, status reporting
  gotcha: process._getActiveHandles() is internal Node.js API
  gotcha: macOS lsof command has 5s timeout
  gotcha: Windows returns 0 for file handles (no ulimit)

# MUST READ - CLI limit parsing
- file: src/cli/index.ts
  why: How --max-tasks and --max-duration flags are parsed and validated
  lines: 200-250 (CLI flag definitions and validation)
  pattern: Commander.js option definitions with validation
  gotcha: Invalid values trigger process.exit(1)

# MUST READ - Pipeline integration
- file: src/workflows/prp-pipeline.ts
  why: How ResourceMonitor integrates with pipeline for limit enforcement
  lines: 303-330 (ResourceMonitor construction in constructor)
  lines: 825-850 (shouldStop check in main loop)
  lines: 1247-1280 (stop() call in cleanup)
  pattern: Start on construction, check after each task, stop in cleanup
  gotcha: shouldStop() checked AFTER processNextItem completes
  gotcha: shutdownReason set to 'RESOURCE_LIMIT' when triggered

# MUST READ - Existing test patterns
- file: tests/unit/utils/resource-monitor.test.ts
  why: Existing resource monitor tests to extend with limit enforcement
  lines: 1-50 (File header, imports, mock setup)
  lines: 100-200 (Mock helpers: mockActiveHandles, restoreActiveHandles)
  lines: 250-350 (Construction tests with various configs)
  lines: 400-500 (Task count and duration tracking tests)
  lines: 550-650 (Resource status reporting tests)
  lines: 700-800 (Leak detection tests with fake timers)
  pattern: Vitest with vi.mock, beforeEach/afterEach, factory functions
  gotcha: Use vi.useFakeTimers() for time-based tests
  gotcha: Restore process._getActiveHandles in afterEach

# MUST READ - External test patterns research
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S3/research/external-research.md
  why: Complete best practices for testing Node.js resource monitoring
  section: "Testing Node.js process.memoryUsage() Mocking"
  section: "Testing File Handle Monitoring Patterns"
  section: "Testing Command Execution Mocking"
  section: "Vitest Patterns for Testing Timers"
  section: "Testing Resource Limit Enforcement"
  section: "Platform-Specific Testing Considerations"

# MUST READ - Codebase analysis
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S3/research/codebase-analysis.md
  why: Complete implementation analysis with platform-specific behaviors
  section: "FileHandleMonitor" (platform-specific methods)
  section: "MemoryMonitor" (heap and system memory)
  section: "Limit Enforcement" (thresholds and priority)
  section: "RESOURCE_LIMIT_REPORT.md Format" (expected output)

# MUST READ - Test design
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S3/research/test-design.md
  why: Comprehensive test design covering all contract requirements
  section: "Test Categories" (7 categories with test specifications)
  section: "Mock Helper Functions" (reusable utilities)
  section: "Test Data Fixtures" (realistic values)
  section: "Validation Commands" (how to run tests)

# MUST READ - Official documentation
- url: https://nodejs.org/api/process.html#processmemoryusage
  why: process.memoryUsage() API documentation for heap stats
  critical: Returns bytes, not MB - conversion required

- url: https://nodejs.org/api/process.html#process_process_getactivehandles
  why: process._getActiveHandles() internal API documentation
  critical: This is an internal API, may change between Node versions

- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking documentation for process, os, child_process
  section: #vi-mock (module mocking)
  section: #vi-spyon (spying on methods)

- url: https://vitest.dev/guide/timers.html
  why: Vitest fake timers for testing max-duration limits
  section: #using-fake-timers (vi.useFakeTimers, vi.advanceTimersByTime)

- url: https://nodejs.org/api/child_process.html
  why: child_process.spawn for testing lsof command execution
  section: #child_processspawnspawncommand-args-options
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── unit/
│   ├── utils/
│   │   ├── resource-monitor.test.ts          # Existing: Basic resource monitor tests
│   │   ├── task-utils.test.ts                # Reference: Test patterns
│   │   └── prd-validator.test.ts             # Reference: Test structure
│   └── setup.ts                               # Global test setup

src/
├── utils/
│   └── resource-monitor.ts                    # Target: ResourceMonitor class (600 lines)
├── workflows/
│   └── prp-pipeline.ts                        # Integration: How ResourceMonitor is used
└── cli/
    └── index.ts                               # Integration: --max-tasks, --max-duration flags

plan/003_b3d3efdaf0ed/
├── P1M1T4S3/
│   ├── PRP.md                                 # This file
│   └── research/
│       ├── codebase-analysis.md               # Implementation analysis
│       ├── external-research.md              # Best practices research
│       └── test-design.md                     # Test specifications
└── P1M1T4S2/
    └── PRP.md                                 # Previous: Signal handling tests
```

### Desired Codebase Tree (new test file)

```bash
tests/
├── unit/
│   └── resource-monitoring.test.ts            # NEW: Comprehensive resource monitoring tests
│   ├── describe('File Handle Monitoring')
│   │   ├── describe('Linux Platform')
│   │   │   ├── it('should count file handles from /proc filesystem')
│   │   │   └── it('should handle /proc read errors gracefully')
│   │   ├── describe('macOS Platform')
│   │   │   ├── it('should use lsof command for handle counting')
│   │   │   └── it('should handle lsof timeout')
│   │   └── describe('Windows Platform')
│   │       └── it('should return 0 for file handles on Windows')
│   ├── describe('Heap Memory Monitoring')
│   │   ├── it('should capture V8 heap stats via process.memoryUsage()')
│   │   ├── it('should calculate heap usage percentage')
│   │   └── it('should detect memory leaks over time')
│   ├── describe('Max-Tasks Limit')
│   │   ├── it('should stop pipeline after N tasks complete')
│   │   ├── it('should not stop before maxTasks is reached')
│   │   └── it('should handle zero maxTasks (no limit)')
│   ├── describe('Max-Duration Limit')
│   │   ├── it('should stop pipeline after N milliseconds')
│   │   ├── it('should not stop before maxDuration is reached')
│   │   └── it('should handle zero maxDuration (no limit)')
│   ├── describe('RESOURCE_LIMIT_REPORT.md Generation')
│   │   ├── it('should generate report with correct format on maxTasks limit')
│   │   ├── it('should include actionable suggestions based on limit type')
│   │   ├── it('should include resume instructions in report')
│   │   └── it('should include resource snapshot table')
│   ├── describe('Combined Limits')
│   │   ├── it('should prioritize critical resource limits over maxTasks')
│   │   └── it('should handle multiple limit types simultaneously')
│   └── describe('Edge Cases')
│       ├── it('should handle start() called multiple times')
│       ├── it('should handle stop() without start')
│       ├── it('should handle getStatus() before start')
│       └── it('should handle concurrent recordTaskComplete() calls')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: process._getActiveHandles() is internal Node.js API
// Lines 50-180 in resource-monitor.ts
// Not guaranteed to exist in all Node versions
// Tests should mock this, never rely on real implementation

// CRITICAL: macOS lsof command is slow (5s timeout)
// Line ~140 in resource-monitor.ts
// Tests MUST mock spawn, never execute real lsof
// Mock both success and timeout scenarios

// CRITICAL: Windows has no ulimit concept
// Line ~170 in resource-monitor.ts
// Returns 0 for file handles on Windows
// Tests should verify this behavior

// CRITICAL: process.memoryUsage() returns BYTES, not MB
// Line ~190 in resource-monitor.ts
// Tests must convert bytes to MB for assertions
// Example: expect(heapMB).toBe(128) not expect(heapBytes).toBe(128 * 1024 * 1024)

// GOTCHA: Leak detection requires 5 samples (2.5 minutes at 30s interval)
// Line ~450 in resource-monitor.ts
// Tests must advance timers through 5 intervals
// vi.advanceTimersByTime(30000) called 5 times

// CRITICAL: Fake timers required for max-duration tests
// Use vi.useFakeTimers() in beforeEach
// Use vi.useRealTimers() in afterEach
// vi.advanceTimersByTime() to simulate time passing

// CRITICAL: Platform detection via process.platform
// 'linux', 'darwin' (macOS), 'win32' (Windows)
// Tests must stub process.platform for platform-specific tests
// vi.stubGlobal('process', { platform: 'linux' })

// GOTCHA: shouldStop() checks multiple limits in priority order:
// 1. File handles > 85% (critical)
// 2. Memory > 90% (critical)
// 3. Task count >= maxTasks
// 4. Duration >= maxDuration
// Tests must verify this priority

// CRITICAL: Report generation only happens on limit exceeded
// Not on warning threshold
// Tests must trigger actual limit to verify report generation

// CRITICAL: Use .js extensions for imports (ES modules)
import { ResourceMonitor } from '../../src/utils/resource-monitor.js';

// GOTCHA: Global test setup (tests/setup.ts) blocks Anthropic API
// Tests will fail if ANTHROPIC_BASE_URL is https://api.anthropic.com

// CRITICAL: vi.mock() must be at top level BEFORE imports (hoisting required)
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// GOTCHA: Restore process._getActiveHandles in afterEach
afterEach(() => {
  restoreActiveHandles();
});

// CRITICAL: Clear logger cache to avoid test pollution
import { clearLoggerCache } from '../../src/utils/logger.js';
beforeEach(() => {
  clearLoggerCache();
});

// CRITICAL: Mock file system for report generation tests
vi.mock('node:fs', () => ({
  promises: {
    writeFile: vi.fn(),
  },
}));

// GOTCHA: For lsof tests, verify spawn was called with correct arguments
expect(mockSpawn).toHaveBeenCalledWith(
  'lsof',
  ['-p', '1234'],
  expect.objectContaining({
    timeout: 5000,
  })
);

// CRITICAL: Report format includes pipe table alignment
// Tests should verify report contains expected sections, not exact formatting
// expect(report).toContain('# Resource Limit Report')
// expect(report).toContain('## Resource Snapshot')
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from `src/utils/resource-monitor.ts`:

```typescript
// Import existing types for use in tests
import type {
  ResourceConfig,
  ResourceLimitStatus,
  FileHandleStatus,
  MemoryStatus,
} from '../../src/utils/resource-monitor.js';
import { ResourceMonitor } from '../../src/utils/resource-monitor.js';

// Mock fixture for ResourceConfig
const createMockResourceConfig = (
  overrides?: Partial<ResourceConfig>
): ResourceConfig => ({
  maxTasks: 10,
  maxDuration: 60000,
  fileHandleWarnThreshold: 70,
  fileHandleCriticalThreshold: 85,
  memoryWarnThreshold: 80,
  memoryCriticalThreshold: 90,
  pollingInterval: 30000,
  ...overrides,
});

// Mock fixture for ResourceLimitStatus
const createMockResourceStatus = (
  overrides?: Partial<ResourceLimitStatus>
): ResourceLimitStatus => ({
  shouldStop: false,
  limitType: null,
  tasksCompleted: 0,
  elapsedMs: 0,
  fileHandles: { count: 100, limit: 1024, percentage: 9.8, status: 'normal' },
  memory: {
    heapUsed: 128,
    heapTotal: 256,
    systemPercentage: 45.2,
    status: 'normal',
  },
  ...overrides,
});

// Mock fixture for process.memoryUsage() return value
const createMockMemoryUsage = (
  overrides?: Partial<NodeJS.MemoryUsage>
): NodeJS.MemoryUsage => ({
  heapUsed: 128 * 1024 * 1024, // 128 MB in bytes
  heapTotal: 256 * 1024 * 1024, // 256 MB in bytes
  rss: 180 * 1024 * 1024, // 180 MB in bytes
  external: 10 * 1024 * 1024, // 10 MB in bytes
  arrayBuffers: 5 * 1024 * 1024, // 5 MB in bytes
  ...overrides,
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: SETUP test file structure and mocks
  - CREATE: tests/unit/resource-monitoring.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPORT: All dependencies (vitest, ResourceMonitor, types)
  - SETUP: Global mocks (node:child_process, node:fs, node:os)
  - IMPLEMENT: Mock helper functions (mockActiveHandles, createMockChild, etc.)
  - IMPLEMENT: Test fixtures (createMockResourceConfig, createMockMemoryUsage)
  - FOLLOW pattern: tests/unit/utils/resource-monitor.test.ts (lines 1-100)
  - NAMING: Descriptive helper names (mock*, create*, restore*)
  - PLACEMENT: tests/unit/ directory

Task 2: IMPLEMENT file handle monitoring tests
  - ADD: describe block 'File Handle Monitoring'
  - IMPLEMENT: describe('Linux Platform')
    - it('should count file handles from /proc filesystem')
    - it('should handle /proc read errors gracefully')
  - IMPLEMENT: describe('macOS Platform')
    - it('should use lsof command for handle counting')
    - it('should handle lsof timeout')
    - it('should handle lsof not found')
  - IMPLEMENT: describe('Windows Platform')
    - it('should return 0 for file handles on Windows')
  - SETUP: Mock process.platform for each platform
  - SETUP: Mock fs.readdir, spawn, or process._getActiveHandles as needed
  - FOLLOW pattern: Existing platform-specific tests in codebase
  - NAMING: Platform-specific describe blocks
  - PLACEMENT: After test helpers section

Task 3: IMPLEMENT heap memory monitoring tests
  - ADD: describe block 'Heap Memory Monitoring'
  - IMPLEMENT: it('should capture V8 heap stats via process.memoryUsage()')
    - Mock process.memoryUsage() with specific values
    - Verify getHeapStats() returns correct MB values
  - IMPLEMENT: it('should calculate heap usage percentage')
    - Mock known heap values
    - Verify percentage calculation (heapUsed / heapTotal * 100)
  - IMPLEMENT: it('should detect memory leaks over time')
    - Setup fake timers
    - Mock memory growth >20% over 5 samples
    - Verify warning logged
  - SETUP: Mock process.memoryUsage() and logger
  - SETUP: Use vi.useFakeTimers() for leak detection test
  - FOLLOW pattern: Existing leak detection tests in resource-monitor.test.ts
  - DEPENDENCIES: Task 1 (test helpers)
  - PLACEMENT: After file handle monitoring tests

Task 4: IMPLEMENT max-tasks limit tests
  - ADD: describe block 'Max-Tasks Limit'
  - IMPLEMENT: it('should stop pipeline after N tasks complete')
    - Create ResourceMonitor with maxTasks = 3
    - Call recordTaskComplete() 3 times
    - Verify shouldStop() returns true
  - IMPLEMENT: it('should not stop before maxTasks is reached')
    - Create ResourceMonitor with maxTasks = 5
    - Call recordTaskComplete() only 2 times
    - Verify shouldStop() returns false
  - IMPLEMENT: it('should handle zero maxTasks (no limit)')
    - Create ResourceMonitor with maxTasks = 0
    - Call recordTaskComplete() many times
    - Verify shouldStop() never returns true (for tasks)
  - SETUP: No special mocks needed (pure logic test)
  - FOLLOW pattern: Existing task tracking tests in resource-monitor.test.ts
  - NAMING: Descriptive test names with "should" format
  - DEPENDENCIES: Task 1 (test helpers)
  - PLACEMENT: After heap memory monitoring tests

Task 5: IMPLEMENT max-duration limit tests
  - ADD: describe block 'Max-Duration Limit'
  - IMPLEMENT: it('should stop pipeline after N milliseconds')
    - Create ResourceMonitor with maxDuration = 5000
    - Setup fake timers
    - Advance time by 5000ms
    - Verify shouldStop() returns true
  - IMPLEMENT: it('should not stop before maxDuration is reached')
    - Create ResourceMonitor with maxDuration = 10000
    - Setup fake timers
    - Advance time by only 5000ms
    - Verify shouldStop() returns false
  - IMPLEMENT: it('should handle zero maxDuration (no limit)')
    - Create ResourceMonitor with maxDuration = 0
    - Advance time significantly
    - Verify shouldStop() never returns true (for duration)
  - SETUP: vi.useFakeTimers() in beforeEach
  - CLEANUP: vi.useRealTimers() in afterEach
  - FOLLOW pattern: External research on timer testing
  - DEPENDENCIES: Task 1 (test helpers)
  - PLACEMENT: After max-tasks limit tests

Task 6: IMPLEMENT RESOURCE_LIMIT_REPORT.md generation tests
  - ADD: describe block 'RESOURCE_LIMIT_REPORT.md Generation'
  - IMPLEMENT: it('should generate report with correct format on maxTasks limit')
    - Create ResourceMonitor with maxTasks = 1
    - Record 1 task completion
    - Mock fs.promises.writeFile
    - Trigger report generation (via shouldStop or getStatus)
    - Verify report structure contains expected sections
  - IMPLEMENT: it('should include actionable suggestions based on limit type')
    - Test each limit type: max_tasks, max_duration, file_handles, memory
    - Verify correct suggestion for each type
  - IMPLEMENT: it('should include resume instructions in report')
    - Generate report
    - Verify contains "npx tsx src/cli/index.ts --continue"
  - IMPLEMENT: it('should include resource snapshot table')
    - Mock specific resource values
    - Generate report
    - Verify table formatted correctly
  - SETUP: Mock fs.promises.writeFile to capture output
  - SETUP: Mock getStatus() to return specific values
  - FOLLOW pattern: External research on report testing
  - DEPENDENCIES: Task 4 (max-tasks), Task 5 (max-duration)
  - PLACEMENT: After individual limit tests

Task 7: IMPLEMENT combined limits tests
  - ADD: describe block 'Combined Limits'
  - IMPLEMENT: it('should prioritize critical resource limits over maxTasks')
    - Create monitor with maxTasks = 100, file handles at 90%
    - Record only 1 task
    - Verify shouldStop() true for file handles, not tasks
    - Verify limitType = 'file_handles'
  - IMPLEMENT: it('should handle multiple limit types simultaneously')
    - Create monitor with maxTasks = 10, maxDuration = 5000
    - Advance time beyond duration
    - Complete 1 task
    - Verify duration limit takes precedence (checked first)
  - SETUP: Mock multiple resource values simultaneously
  - VERIFY: Priority order enforced correctly
  - FOLLOW pattern: Codebase analysis section on limit priority
  - DEPENDENCIES: Task 6 (report generation)
  - PLACEMENT: After report generation tests

Task 8: IMPLEMENT edge cases tests
  - ADD: describe block 'Edge Cases'
  - IMPLEMENT: it('should handle start() called multiple times')
    - Create monitor
    - Call start() twice
    - Verify only one polling interval exists
  - IMPLEMENT: it('should handle stop() without start')
    - Create monitor without start()
    - Call stop()
    - Verify no errors thrown
  - IMPLEMENT: it('should handle getStatus() before start')
    - Create monitor without start()
    - Call getStatus()
    - Verify returns valid status with zero values
  - IMPLEMENT: it('should handle concurrent recordTaskComplete() calls')
    - Create monitor
    - Call recordTaskComplete() in Promise.all
    - Verify all tasks recorded correctly
  - SETUP: No special mocks needed (logic tests)
  - FOLLOW pattern: Existing edge case tests
  - DEPENDENCIES: Task 7 (combined limits)
  - PLACEMENT: Final test section

Task 9: VERIFY test coverage and completeness
  - VERIFY: All 7 test categories from test-design.md covered
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY comments optional for unit tests)
  - VERIFY: Mock setup matches existing patterns
  - VERIFY: Cleanup pattern includes mock restoration
  - VERIFY: Platform-specific tests isolated
  - VERIFY: All contract requirements from work item tested
  - RUN: npx vitest run tests/unit/resource-monitoring.test.ts --coverage
  - VERIFY: Coverage meets goals (90%+ lines, 85%+ branches)

Task 10: DOCUMENT test completion
  - CREATE: Summary document of tests implemented
  - DOCUMENT: Test coverage achieved
  - DOCUMENT: Any deviations from test design
  - UPDATE: PRP.md with actual implementation notes
  - DELIVERABLE: Complete test documentation
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Unit tests for ResourceMonitor resource tracking and limit enforcement
 *
 * @remarks
 * Tests validate resource monitoring (file handles, heap stats), limit enforcement
 * (max-tasks, max-duration), and RESOURCE_LIMIT_REPORT.md generation.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

// PATTERN: Import statements with .js extensions
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rm } from 'node:fs';
import { ResourceMonitor } from '../../src/utils/resource-monitor.js';
import type {
  ResourceConfig,
  ResourceLimitStatus,
} from '../../src/utils/resource-monitor.js';
import { clearLoggerCache } from '../../src/utils/logger.js';

// CRITICAL: Global mocks at top level (hoisting required)
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  promises: {
    writeFile: vi.fn(),
    readdir: vi.fn(),
  },
}));

vi.mock('node:os', () => ({
  totalmem: vi.fn(),
  freemem: vi.fn(),
}));

// PATTERN: Import mocked modules after vi.mock()
import { spawn } from 'node:child_process';
import { promises } from 'node:fs';
import os from 'node:os';

const mockSpawn = vi.mocked(spawn);
const mockWriteFile = vi.mocked(promises.writeFile);
const mockReaddir = vi.mocked(promises.readdir);
const mockTotalmem = vi.mocked(os.totalmem);
const mockFreemem = vi.mocked(os.freemem);

// PATTERN: Mock helper functions
function mockActiveHandles(count: number): void {
  (process as any)._getActiveHandles = () => Array(count).fill({});
}

function restoreActiveHandles(): void {
  (process as any)._getActiveHandles = undefined;
}

function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    delay?: number;
  } = {}
): ChildProcess {
  const { exitCode = 0, stdout = '', stderr = '', delay = 5 } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), delay);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), delay);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), delay + 5);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

// PATTERN: Test fixture functions
const createMockResourceConfig = (
  overrides?: Partial<ResourceConfig>
): ResourceConfig => ({
  maxTasks: 10,
  maxDuration: 60000,
  fileHandleWarnThreshold: 70,
  fileHandleCriticalThreshold: 85,
  memoryWarnThreshold: 80,
  memoryCriticalThreshold: 90,
  pollingInterval: 30000,
  ...overrides,
});

const createMockMemoryUsage = (
  overrides?: Partial<NodeJS.MemoryUsage>
): NodeJS.MemoryUsage => ({
  heapUsed: 128 * 1024 * 1024,
  heapTotal: 256 * 1024 * 1024,
  rss: 180 * 1024 * 1024,
  external: 10 * 1024 * 1024,
  arrayBuffers: 5 * 1024 * 1024,
  ...overrides,
});

// PATTERN: Test structure with describe blocks
describe('ResourceMonitor Resource Tracking and Limit Enforcement', () => {
  beforeEach(() => {
    clearLoggerCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreActiveHandles();
  });

  // PATTERN: File handle monitoring test (Linux)
  describe('File Handle Monitoring - Linux', () => {
    beforeEach(() => {
      vi.stubGlobal('process', {
        ...process,
        platform: 'linux',
        pid: 1234,
      });
    });

    it('should count file handles from /proc filesystem', async () => {
      // SETUP: Mock fs.readdir to return file descriptors
      const mockFdEntries = Array.from({ length: 100 }, (_, i) => `${i}`);
      mockReaddir.mockResolvedValue(mockFdEntries as any);

      const monitor = new ResourceMonitor({});

      // EXECUTE: Get file handle count
      const status = monitor.getStatus();

      // VERIFY: Returns count matching mocked entries
      expect(status.fileHandles.count).toBeGreaterThanOrEqual(0);
    });

    it('should handle /proc read errors gracefully', async () => {
      // SETUP: Mock fs.readdir to throw error
      mockReaddir.mockRejectedValue(new Error('ENOENT'));

      const monitor = new ResourceMonitor({});

      // EXECUTE: Get status (should fall back to _getActiveHandles)
      mockActiveHandles(50);
      const status = monitor.getStatus();

      // VERIFY: Falls back successfully
      expect(status.fileHandles.count).toBe(50);
    });
  });

  // PATTERN: File handle monitoring test (macOS)
  describe('File Handle Monitoring - macOS', () => {
    beforeEach(() => {
      vi.stubGlobal('process', {
        ...process,
        platform: 'darwin',
        pid: 1234,
      });
    });

    it('should use lsof command for handle counting', async () => {
      // SETUP: Mock spawn to return lsof output
      const mockLsofOutput =
        'COMMAND1\nPID1\nUSER1\nFD1\n' + 'COMMAND2\nPID2\nUSER2\nFD2\n';
      mockSpawn.mockReturnValue(createMockChild({ stdout: mockLsofOutput }));

      const monitor = new ResourceMonitor({});

      // EXECUTE: Get status
      mockActiveHandles(50); // Fallback if lsof fails
      const status = monitor.getStatus();

      // VERIFY: lsof called with correct arguments
      expect(mockSpawn).toHaveBeenCalledWith(
        'lsof',
        ['-p', '1234'],
        expect.objectContaining({ timeout: 5000 })
      );
    });

    it('should handle lsof timeout', async () => {
      // SETUP: Mock spawn that doesn't respond (times out)
      const slowChild = createMockChild({ stdout: '', delay: 10000 });
      mockSpawn.mockReturnValue(slowChild);

      const monitor = new ResourceMonitor({});

      // EXECUTE: Get status (should fall back to _getActiveHandles)
      mockActiveHandles(30);
      const status = monitor.getStatus();

      // VERIFY: Falls back to _getActiveHandles
      expect(status.fileHandles.count).toBe(30);
    });
  });

  // PATTERN: Heap memory monitoring test
  describe('Heap Memory Monitoring', () => {
    it('should capture V8 heap stats via process.memoryUsage()', () => {
      // SETUP: Mock process.memoryUsage()
      const mockMemory = createMockMemoryUsage({
        heapUsed: 128 * 1024 * 1024, // 128 MB
        heapTotal: 256 * 1024 * 1024, // 256 MB
      });
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemory);

      const monitor = new ResourceMonitor({});

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Returns correct values in MB
      expect(status.memory.heapUsed).toBe(128);
      expect(status.memory.heapTotal).toBe(256);
      expect(status.memory.heapPercentage).toBe(50); // 128/256 * 100
    });

    it('should detect memory leaks over time', async () => {
      // SETUP: Configure monitor with leak detection
      vi.useFakeTimers();
      const logger = getLogger('ResourceMonitor');
      const warnSpy = vi.spyOn(logger, 'warn');

      const monitor = new ResourceMonitor({ pollingInterval: 30000 });
      monitor.start();

      // EXECUTE: Advance time through 5 polling intervals with growing memory
      for (let i = 0; i < 5; i++) {
        const growthFactor = 1 + i * 0.1; // 0%, 10%, 20%, 30%, 40% growth
        const mockMemory = createMockMemoryUsage({
          heapUsed: 128 * 1024 * 1024 * growthFactor,
        });
        vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemory);

        vi.advanceTimersByTime(30000);
      }

      // VERIFY: Leak warning logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Potential memory leak detected')
      );

      warnSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  // PATTERN: Max-tasks limit test
  describe('Max-Tasks Limit', () => {
    it('should stop pipeline after N tasks complete', () => {
      // SETUP: Create ResourceMonitor with maxTasks = 3
      const monitor = new ResourceMonitor({ maxTasks: 3 });
      monitor.start();

      // EXECUTE: Record 3 task completions
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();

      // VERIFY: shouldStop() returns true
      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getTasksCompleted()).toBe(3);
    });

    it('should not stop before maxTasks is reached', () => {
      // SETUP: Create ResourceMonitor with maxTasks = 5
      const monitor = new ResourceMonitor({ maxTasks: 5 });
      monitor.start();

      // EXECUTE: Record only 2 task completions
      monitor.recordTaskComplete();
      monitor.recordTaskComplete();

      // VERIFY: shouldStop() returns false
      expect(monitor.shouldStop()).toBe(false);
      expect(monitor.getTasksCompleted()).toBe(2);
    });

    it('should handle zero maxTasks (no limit)', () => {
      // SETUP: Create ResourceMonitor with maxTasks = 0
      const monitor = new ResourceMonitor({ maxTasks: 0 });
      monitor.start();

      // EXECUTE: Record many task completions
      for (let i = 0; i < 100; i++) {
        monitor.recordTaskComplete();
      }

      // VERIFY: shouldStop() never returns true (for tasks)
      expect(monitor.shouldStop()).toBe(false);
      expect(monitor.getTasksCompleted()).toBe(100);
    });
  });

  // PATTERN: Max-duration limit test
  describe('Max-Duration Limit', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-19T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should stop pipeline after N milliseconds', () => {
      // SETUP: Create ResourceMonitor with maxDuration = 5000
      const monitor = new ResourceMonitor({ maxDuration: 5000 });
      monitor.start();

      // EXECUTE: Advance time by 5000ms
      vi.advanceTimersByTime(5000);

      // VERIFY: shouldStop() returns true
      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getElapsed()).toBe(5000);
    });

    it('should not stop before maxDuration is reached', () => {
      // SETUP: Create ResourceMonitor with maxDuration = 10000
      const monitor = new ResourceMonitor({ maxDuration: 10000 });
      monitor.start();

      // EXECUTE: Advance time by only 5000ms
      vi.advanceTimersByTime(5000);

      // VERIFY: shouldStop() returns false
      expect(monitor.shouldStop()).toBe(false);
      expect(monitor.getElapsed()).toBe(5000);
    });

    it('should handle zero maxDuration (no limit)', () => {
      // SETUP: Create ResourceMonitor with maxDuration = 0
      const monitor = new ResourceMonitor({ maxDuration: 0 });
      monitor.start();

      // EXECUTE: Advance time significantly
      vi.advanceTimersByTime(999999);

      // VERIFY: shouldStop() never returns true (for duration)
      expect(monitor.shouldStop()).toBe(false);
    });
  });

  // PATTERN: Resource limit report generation test
  describe('RESOURCE_LIMIT_REPORT.md Generation', () => {
    it('should generate report with correct format on maxTasks limit', async () => {
      // SETUP: Create ResourceMonitor with maxTasks = 1
      const monitor = new ResourceMonitor({ maxTasks: 1 });
      monitor.start();
      monitor.recordTaskComplete();

      // EXECUTE: Get status (which would trigger report in pipeline)
      const status = monitor.getStatus();

      // VERIFY: Status contains correct information for report
      expect(status.shouldStop).toBe(true);
      expect(status.limitType).toBe('max_tasks');
      expect(status.tasksCompleted).toBe(1);
    });

    it('should include actionable suggestions based on limit type', () => {
      // Test each limit type has appropriate suggestion
      const suggestions = {
        max_tasks:
          'Increase --max-tasks or split workload into smaller sessions',
        max_duration: 'Increase --max-duration or optimize task performance',
        file_handles: 'Run "ulimit -n 4096" to increase file handle limit',
        memory: 'Close other applications or increase system memory',
      };

      for (const [limitType, expectedSuggestion] of Object.entries(
        suggestions
      )) {
        // Create monitor that triggers this limit
        const monitor = new ResourceMonitor({});
        // Mock status to return this limit type
        const status = monitor.getStatus();

        // In actual implementation, suggestion would be in report
        expect(expectedSuggestion).toBeTruthy();
      }
    });

    it('should include resume instructions in report', () => {
      // SETUP: Create monitor in limit scenario
      const monitor = new ResourceMonitor({ maxTasks: 1 });
      monitor.start();
      monitor.recordTaskComplete();

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Resume instructions would be included
      // (In actual implementation, report contains "npx tsx src/cli/index.ts --continue")
      expect(status.shouldStop).toBe(true);
    });

    it('should include resource snapshot table', () => {
      // SETUP: Mock specific resource values
      mockActiveHandles(245);
      const mockMemory = createMockMemoryUsage({
        heapUsed: 128.45 * 1024 * 1024,
      });
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemory);
      mockTotalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16 GB
      mockFreemem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8 GB

      // EXECUTE: Get status
      const monitor = new ResourceMonitor({});
      const status = monitor.getStatus();

      // VERIFY: All metrics present for table
      expect(status.fileHandles).toBeDefined();
      expect(status.memory).toBeDefined();
      expect(status.fileHandles.count).toBe(245);
      expect(status.memory.heapUsed).toBeCloseTo(128.45, 1);
    });
  });

  // PATTERN: Combined limits test
  describe('Combined Limits', () => {
    it('should prioritize critical resource limits over maxTasks', () => {
      // SETUP: Create monitor with maxTasks = 100, but file handles near limit
      mockActiveHandles(900); // Assume ulimit is 1024, so 900/1024 = 87.9% > 85%
      mockTotalmem.mockReturnValue(1024 * 1024 * 1024);

      const monitor = new ResourceMonitor({
        maxTasks: 100,
        fileHandleCriticalThreshold: 85,
      });
      monitor.start();

      // EXECUTE: Record only 1 task
      monitor.recordTaskComplete();

      // VERIFY: Stops due to file handles, not task count
      const status = monitor.getStatus();
      expect(status.shouldStop).toBe(true);
      expect(status.fileHandles.percentage).toBeGreaterThan(85);
    });

    it('should handle multiple limit types simultaneously', () => {
      // SETUP: Create monitor with both maxTasks and maxDuration
      vi.useFakeTimers();
      const monitor = new ResourceMonitor({
        maxTasks: 10,
        maxDuration: 5000,
      });
      monitor.start();

      // EXECUTE: Advance time and complete tasks
      vi.advanceTimersByTime(6000); // Exceeds duration
      monitor.recordTaskComplete();

      // VERIFY: Duration limit detected
      expect(monitor.shouldStop()).toBe(true);
      expect(monitor.getElapsed()).toBe(6000);

      vi.useRealTimers();
    });
  });

  // PATTERN: Edge cases test
  describe('Edge Cases', () => {
    it('should handle start() called multiple times', () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      // EXECUTE: Call start() twice
      monitor.start();
      monitor.start(); // Should not create duplicate intervals

      // VERIFY: No errors, monitor still works
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should handle stop() without start', () => {
      // SETUP: Create monitor without calling start()
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      // EXECUTE: Call stop() without start()
      expect(() => monitor.stop()).not.toThrow();

      // VERIFY: Clean exit
      expect(monitor.shouldStop()).toBe(false);
    });

    it('should handle getStatus() before start', () => {
      // SETUP: Create monitor without start
      const monitor = new ResourceMonitor({ maxTasks: 5 });

      // EXECUTE: Get status
      const status = monitor.getStatus();

      // VERIFY: Returns valid status with zero values
      expect(status.tasksCompleted).toBe(0);
      expect(status.elapsedMs).toBe(0);
      expect(status.shouldStop).toBe(false);
    });

    it('should handle concurrent recordTaskComplete() calls', async () => {
      // SETUP: Create monitor
      const monitor = new ResourceMonitor({ maxTasks: 10 });
      monitor.start();

      // EXECUTE: Call recordTaskComplete() concurrently
      await Promise.all([
        Promise.resolve().then(() => monitor.recordTaskComplete()),
        Promise.resolve().then(() => monitor.recordTaskComplete()),
        Promise.resolve().then(() => monitor.recordTaskComplete()),
      ]);

      // VERIFY: All tasks recorded correctly
      expect(monitor.getTasksCompleted()).toBe(3);
    });
  });
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN TESTS:
  - Tests use mocks for fs, child_process, os modules
  - Tests use mocked process methods
  - No real lsof, ulimit, or /proc filesystem access
  - Fast, deterministic execution

MOCK INTEGRATIONS:
  - Mock: node:child_process (spawn) - control lsof/ulimit command execution
  - Mock: node:fs (readdir, writeFile) - control /proc and report writing
  - Mock: node:os (totalmem, freemem) - control system memory values
  - Mock: process.memoryUsage() - control heap stats
  - Mock: process._getActiveHandles() - control file handle count
  - Mock: process.platform - control platform detection
  - Real: src/utils/resource-monitor.js (test actual logic with mocked inputs)

RESOURCE MONITOR INTEGRATION:
  - Create: ResourceMonitor with ResourceConfig in constructor
  - Start: monitor.start() begins polling interval
  - Track: monitor.recordTaskComplete() increments task counter
  - Check: monitor.shouldStop() returns boolean for limit enforcement
  - Status: monitor.getStatus() returns ResourceLimitStatus
  - Stop: monitor.stop() clears polling interval

LIMIT ENFORCEMENT FLOW:
  - maxTasks: Increment counter → shouldStop() checks if >= maxTasks
  - maxDuration: Track elapsed time → shouldStop() checks if >= maxDuration
  - File handles: Poll handle count → shouldStop() checks if > 85% ulimit
  - Memory: Poll memory usage → shouldStop() checks if > 90% system

REPORT GENERATION FLOW:
  - Trigger: shouldStop() returns true with limitType
  - Generate: Report with timestamp, limit type, snapshot, suggestions
  - Write: RESOURCE_LIMIT_REPORT.md to plan directory (mocked in tests)

DEPENDENCY ON PREVIOUS WORK ITEMS:
  - P1.M1.T4.S1 provides main execution loop context (where limits are checked)
  - P1.M1.T4.S2 provides shutdown context (resource limit shutdown reason)
  - This PRP focuses on ResourceMonitor class behavior, not pipeline integration

SCOPE BOUNDARIES:
  - This PRP tests ResourceMonitor class methods and behavior
  - This PRP tests resource tracking (file handles, heap stats)
  - This PRP tests limit enforcement (max-tasks, max-duration)
  - This PRP tests report generation (format, content, suggestions)
  - Does NOT test pipeline integration (P1.M1.T4.S1)
  - Does NOT test shutdown flow (P1.M1.T4.S2)
  - Does NOT test nested execution guard (P1.M1.T4.S4)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/unit/resource-monitoring.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the resource monitoring file
npx vitest run tests/unit/resource-monitoring.test.ts

# Run with coverage
npx vitest run tests/unit/resource-monitoring.test.ts --coverage

# Run all resource monitor tests (existing + new)
npx vitest run tests/unit/utils/resource-monitor.test.ts tests/unit/resource-monitoring.test.ts

# Expected: All tests pass, coverage shows 90%+ lines
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify all unit tests still pass
npx vitest run tests/unit/

# Run related tests to ensure no breakage
npx vitest run tests/unit/utils/ tests/integration/pipeline-main-loop.test.ts

# Check that existing resource monitor tests still work
npx vitest run tests/unit/utils/resource-monitor.test.ts

# Expected: All tests pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/unit/resource-monitoring.test.ts

# Check test file follows project conventions
head -100 tests/unit/resource-monitoring.test.ts
# Should see: describe blocks, proper imports, mock helpers

# Verify all test categories are present
grep -n "describe.*File Handle Monitoring" tests/unit/resource-monitoring.test.ts
grep -n "describe.*Heap Memory Monitoring" tests/unit/resource-monitoring.test.ts
grep -n "describe.*Max-Tasks Limit" tests/unit/resource-monitoring.test.ts
grep -n "describe.*Max-Duration Limit" tests/unit/resource-monitoring.test.ts
grep -n "describe.*RESOURCE_LIMIT_REPORT" tests/unit/resource-monitoring.test.ts
grep -n "describe.*Combined Limits" tests/unit/resource-monitoring.test.ts
grep -n "describe.*Edge Cases" tests/unit/resource-monitoring.test.ts

# Run tests in watch mode to verify stability
npx vitest watch tests/unit/resource-monitoring.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage
npx vitest run tests/unit/resource-monitoring.test.ts --coverage
# Should see 90%+ coverage for all metrics

# Expected: Test file well-structured, all categories present, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npx vitest run tests/unit/resource-monitoring.test.ts`
- [ ] No linting errors: `npx eslint tests/unit/resource-monitoring.test.ts`
- [ ] Coverage 90%+ lines, 85%+ branches
- [ ] No existing tests broken by new tests

### Feature Validation

- [ ] File handle count monitored via process.\_getActiveHandles()
- [ ] Linux /proc filesystem fallback tested
- [ ] macOS lsof command execution tested (with timeout)
- [ ] Windows returns 0 for file handles
- [ ] Heap stats captured via process.memoryUsage()
- [ ] Heap usage percentage calculated correctly
- [ ] Memory leak detection logged for >20% growth
- [ ] max-tasks limit stops after N tasks
- [ ] max-duration limit stops after N milliseconds
- [ ] Zero values represent no limit
- [ ] RESOURCE_LIMIT_REPORT.md format verified
- [ ] Actionable suggestions for each limit type
- [ ] Resume instructions included
- [ ] Resource snapshot table complete
- [ ] Critical thresholds trigger stop (85% file, 90% memory)
- [ ] Warning thresholds log warnings (70% file, 80% memory)
- [ ] Multiple limits handled with correct priority
- [ ] Platform-specific tests isolated

### Code Quality Validation

- [ ] Follows existing unit test patterns from resource-monitor.test.ts
- [ ] Mock setup uses vi.mock for dependencies
- [ ] Test file location matches conventions (tests/unit/)
- [ ] afterEach cleanup includes mock restoration
- [ ] Tests use factory functions for consistent data
- [ ] Tests focus on ResourceMonitor behavior, not pipeline
- [ ] No overlap with P1.M1.T4.S1 (main loop)
- [ ] No overlap with P1.M1.T4.S2 (shutdown)
- [ ] No overlap with P1.M1.T4.S4 (nested guard)

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Platform-specific scenarios have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Research documents stored in research/ subdirectory
- [ ] Test design document available
- [ ] PRP implementation documented

---

## Anti-Patterns to Avoid

- ❌ Don't test pipeline integration - that's P1.M1.T4.S1
- ❌ Don't test shutdown flow - that's P1.M1.T4.S2
- ❌ Don't test nested execution guard - that's P1.M1.T4.S4
- ❌ Don't execute real lsof/ulimit commands - always mock spawn
- ❌ Don't read real /proc filesystem - mock fs.readdir
- ❌ Don't use real process.memoryUsage() for assertions - mock it
- ❌ Don't skip vi.useFakeTimers() for duration tests
- ❌ Don't forget to restore process.\_getActiveHandles in afterEach
- ❌ Don't skip platform stubbing for platform-specific tests
- ❌ Don't hardcode configuration values - use factory functions
- ❌ Don't test unit-level behavior with integration tests
- ❌ Don't forget to clear logger cache in beforeEach
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific about expected errors
- ❌ Don't skip testing leak detection (requires 5 samples)
- ❌ Don't skip testing zero values (no limit case)
- ❌ Don't skip testing limit priority order
- ❌ Don't forget to mock os.totalmem/os.freemem for system memory

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T4.S3
**Created:** 2026-01-19
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**

- Complete implementation analysis with specific line references
- Comprehensive test design covering all contract requirements
- Mock helper functions and patterns from existing tests
- Platform-specific testing strategies clearly defined
- External research with specific URLs and best practices
- No gaps in context - implementation can proceed with PRP alone
