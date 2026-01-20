# Product Requirement Prompt (PRP): P1.M1.T4.S2 - Verify graceful shutdown and signal handling

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify PRPPipeline's graceful shutdown and signal handling functionality ensures current task completion, state preservation, and clean resume capability.

**Deliverable**: Integration test file `tests/integration/pipeline-shutdown.test.ts` (note: file already exists as `prp-pipeline-shutdown.test.ts`, this PRP enhances it with additional test coverage for signal handling scenarios).

**Success Definition**: All tests pass, verifying:
- SIGINT/SIGTERM signals are caught and processed correctly
- Current task completes before shutdown (loop exits after task finishes)
- Pending tasks are preserved in tasks.json via saveBacklog()
- Pipeline can be resumed via --continue flag from saved state
- No state corruption occurs during shutdown (atomic writes, listener cleanup)
- PipelineResult accurately reflects shutdown state (shutdownInterrupted, shutdownReason)
- Signal handlers are properly registered and removed to prevent memory leaks

## Why

- PRPPipeline is a long-running workflow that must handle user interruption (Ctrl+C) gracefully
- Users need confidence that interrupting the pipeline won't lose work or corrupt state
- The --continue flag depends on reliable state preservation during shutdown
- Signal handler memory leaks would accumulate over multiple pipeline runs
- Existing `prp-pipeline-shutdown.test.ts` has basic coverage but lacks comprehensive scenarios
- Signal handling is critical for user experience in interactive CLI workflows
- State corruption could prevent resume functionality, forcing users to start over

## What

Integration tests that verify PRPPipeline's graceful shutdown behavior across multiple scenarios including signal emission, task completion timing, state preservation, resume functionality, and state corruption prevention.

### Success Criteria

- [ ] SIGINT signal sets shutdownRequested flag and shutdownReason to 'SIGINT'
- [ ] SIGTERM signal sets shutdownRequested flag and shutdownReason to 'SIGTERM'
- [ ] Duplicate SIGINT signals log warning but don't cause issues
- [ ] Current task completes before loop exits (processNextItem finishes)
- [ ] Loop exits after current task when shutdownRequested is true
- [ ] SessionManager.saveBacklog() is called during cleanup
- [ ] SessionManager.flushUpdates() is called before saveBacklog()
- [ ] Task statuses are correctly preserved in tasks.json
- [ ] currentItemId is preserved for resume functionality
- [ ] State is saved even if error occurs during shutdown
- [ ] Signal handlers are registered on pipeline construction
- [ ] Signal handlers are removed in cleanup() to prevent memory leaks
- [ ] PipelineResult.shutdownInterrupted is true when signal received
- [ ] PipelineResult.shutdownReason matches signal type (SIGINT/SIGTERM)
- [ ] Progress metrics (totalTasks, completedTasks, failedTasks) are accurate at shutdown
- [ ] --continue flag resumes from saved state without re-executing completed tasks
- [ ] Multiple signals in quick succession don't corrupt state
- [ ] Atomic write pattern prevents partial/corrupted tasks.json

## All Needed Context

### Context Completeness Check

*This PRP passes the "No Prior Knowledge" test:*
- Complete PRPPipeline signal handling implementation details with line numbers
- SessionManager state persistence mechanisms (saveBacklog, flushUpdates, atomic writes)
- Exact test patterns from existing shutdown tests with code examples
- Signal emission patterns for Vitest with async handler waiting
- Factory functions for consistent mock creation
- Complete test case design covering 8 categories with 40+ test scenarios

### Documentation & References

```yaml
# MUST READ - PRPPipeline signal handling implementation
- file: src/workflows/prp-pipeline.ts
  why: Contains complete signal handling and graceful shutdown logic
  lines: 170-224 (private fields: shutdownRequested, shutdownReason, signal handlers)
  lines: 218-224 (sigintCount, sigintHandler, sigtermHandler)
  lines: 303-355 (constructor and #setupSignalHandlers method)
  lines: 312-355 (#setupSignalHandlers - registers SIGINT/SIGTERM handlers)
  lines: 728-914 (executeBacklog method - main loop with shutdown check)
  lines: 825-838 (shutdown request check in main loop)
  lines: 1247-1331 (cleanup method - state preservation and listener removal)
  lines: 1735-1746 (run method - finally block ensures cleanup)
  pattern: Groundswell Workflow with @Step decorators, signal handlers in constructor
  gotcha: Signal handlers check shutdownRequested flag, don't call process.exit()
  gotcha: cleanup() is called in finally block of run() to ensure it always runs
  gotcha: Loop checks shutdownRequested AFTER current task completes (line 825)

# MUST READ - SessionManager state persistence
- file: src/core/session-manager.ts
  why: Contains state persistence mechanisms that tests must verify
  lines: 280-310 (updateItemStatus method - batches updates in memory)
  lines: 340-360 (flushUpdates method - atomically writes pending updates)
  lines: 580-620 (saveBacklog method - validates and writes tasks.json)
  pattern: Batching architecture with dirty tracking, atomic writes
  gotcha: flushUpdates() must be called before saveBacklog() to persist pending changes
  gotcha: Atomic write uses temp file + rename pattern for crash safety

# MUST READ - SessionManager utilities (atomic write)
- file: src/core/session-utils.ts
  why: Contains atomicWrite() implementation that prevents state corruption
  lines: 45-90 (atomicWrite function - temp file + rename pattern)
  pattern: Write to temp file, rename to target (atomic on POSIX)
  gotcha: Temp file has random name, cleaned up on failure

# MUST READ - Existing shutdown test patterns
- file: tests/integration/prp-pipeline-shutdown.test.ts
  why: Shows existing shutdown test patterns to enhance and build upon
  lines: 1-90 (file header, imports, mock setup, helper functions)
  lines: 100-135 (beforeEach/afterEach with listener restoration)
  lines: 150-276 (SIGINT handling test with shutdown flag verification)
  lines: 278-353 (SIGTERM handling test with state preservation)
  lines: 355-430 (duplicate SIGINT handling test)
  lines: 433-555 (state preservation during shutdown test)
  lines: 557-623 (signal listener cleanup test)
  lines: 625-761 (PipelineResult verification tests)
  lines: 763-883 (shutdown progress logging test)
  pattern: Mock orchestrator with controlled processNextItem, emit signals, verify state
  gotcha: Use await new Promise(resolve => setImmediate(resolve)) after emit for async handlers
  gotcha: Must store and restore original listeners in afterEach

# MUST READ - Main execution loop test patterns
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S1/PRP.md
  why: Previous PRP defines main execution loop behavior that shutdown interrupts
  section: "Implementation Blueprint" (task orchestration, loop structure)
  gotcha: This PRP tests shutdown DURING execution, previous PRP tests normal execution

# MUST READ - Integration test structure patterns
- file: tests/integration/bug-hunt-workflow-integration.test.ts
  why: Shows clean integration test structure with SETUP/EXECUTE/VERIFY comments
  lines: 1-100 (file header, imports, factory functions, test structure)
  pattern: Factory functions for test data, clear section comments, descriptive test names
  gotcha: Use vi.mock() at top level before imports for proper hoisting

# MUST READ - Fix cycle workflow test patterns
- file: tests/integration/fix-cycle-workflow-integration.test.ts
  why: Shows how to test workflow state transitions and cleanup
  lines: 1-100 (mock setup, factory functions, orchestrator mocking)
  pattern: Mock dependent workflows, spy on cleanup methods
  gotcha: Mock BugHuntWorkflow and TaskOrchestrator independently

# MUST READ - Research documents (in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S2/research/signal-handling-test-research.md
  why: Complete best practices for testing signal handling in TypeScript/Vitest
  section: "Mocking Process Signals" (emit patterns, async waiting)
  section: "Testing Task Completion" (verifying current task finishes)
  section: "Testing State Persistence" (saveBacklog verification)
  section: "Testing Signal Listener Cleanup" (preventing memory leaks)
  section: "Testing --continue Flag" (resume functionality)
  section: "Verifying No State Corruption" (atomic writes, multiple signals)

- docfile: plan/003_b3d3efdaf0ed/P1M1T4S2/research/state-persistence-research.md
  why: Complete SessionManager state persistence implementation details
  section: "SessionManager.saveBacklog() Method" (signature, delegation pattern)
  section: "SessionManager.flushUpdates() Method" (batching architecture)
  section: "Atomic Write Patterns" (temp file + rename for crash safety)
  section: "--continue Flag Implementation" (CLI option, session discovery)

- docfile: plan/003_b3d3efdaf0ed/P1M1T4S2/research/test-case-design.md
  why: Comprehensive test case design covering 8 categories with 40+ scenarios
  section: "Test Categories" (signal handling, task completion, state preservation, resume, corruption)
  section: "Test Implementation Notes" (mock strategy, test structure, cleanup pattern)
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   ├── prp-pipeline-shutdown.test.ts          # Existing: Basic shutdown tests (884 lines)
│   ├── pipeline-main-loop.test.ts             # NEW from P1.M1.T4.S1: Main loop tests
│   ├── prp-pipeline-integration.test.ts       # Existing: End-to-end pipeline tests
│   ├── bug-hunt-workflow-integration.test.ts  # Existing: Workflow test patterns
│   └── fix-cycle-workflow-integration.test.ts # Existing: Cleanup and state patterns
└── setup.ts                                    # Global test setup with API validation

src/
├── workflows/
│   └── prp-pipeline.ts                        # Main pipeline with signal handling (1848 lines)
├── core/
│   ├── session-manager.ts                     # State persistence (1172 lines)
│   └── session-utils.ts                       # Atomic write utilities
└── cli/
    └── index.ts                               # --continue flag implementation

plan/003_b3d3efdaf0ed/
├── P1M1T4S2/
│   ├── PRP.md                                 # This file
│   └── research/
│       ├── signal-handling-test-research.md   # Signal handling test best practices
│       ├── state-persistence-research.md      # State persistence implementation
│       ├── test-case-design.md                # Comprehensive test case design
│       └── README.md                          # Quick reference guide
└── P1M1T4S1/
    └── PRP.md                                 # Previous PRP: Main execution loop tests
```

### Desired Codebase Tree (enhancements to existing test file)

```bash
# NOTE: The test file already exists as tests/integration/prp-pipeline-shutdown.test.ts
# This PRP enhances it with additional test coverage. The file structure remains the same.

tests/
├── integration/
│   ├── prp-pipeline-shutdown.test.ts          # ENHANCED: Add comprehensive test cases
│   │   # Existing sections (keep and enhance):
│   │   ├── describe('SIGINT handling during execution')
│   │   ├── describe('state preservation during shutdown')
│   │   ├── describe('signal listener cleanup')
│   │   ├── describe('PipelineResult with shutdown info')
│   │   ├── describe('shutdown progress logging')
│   │   #
│   │   # NEW sections to add:
│   │   ├── describe('current task completion before shutdown')
│   │   ├── describe('--continue flag resume functionality')
│   │   ├── describe('state corruption prevention')
│   │   └── describe('edge cases and error scenarios')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: PRPPipeline signal handlers are registered in constructor
// Handlers are stored in private fields: #sigintHandler, #sigtermHandler
// Lines 303-355 in prp-pipeline.ts

// CRITICAL: Main loop checks shutdownRequested AFTER current task completes
// Line 825: if (this.shutdownRequested) { break; }
// This ensures current task finishes before shutdown

// CRITICAL: cleanup() is called in finally block of run() method
// Line 1744: await this.cleanup();
// This ensures cleanup always runs, even on error

// CRITICAL: Signal handlers DON'T call process.exit()
// They only set shutdownRequested flag
// Loop exits gracefully after current task

// CRITICAL: State preservation order:
// 1. flushUpdates() - writes pending batch updates
// 2. saveBacklog() - writes complete tasks.json
// Both happen in cleanup() method

// GOTCHA: Duplicate SIGINT signals increment #sigintCount
// First SIGINT: Sets shutdown flag
// Second SIGINT: Logs warning, returns early
// No force-exit on duplicate (yet)

// CRITICAL: Signal listener cleanup happens in cleanup()
// Lines 1310-1317: process.off('SIGINT', this.#sigintHandler)
// Must restore original listeners in tests to prevent pollution

// CRITICAL: Tests MUST use .js extensions for imports (ES modules)
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';

// GOTCHA: Global test setup (tests/setup.ts) blocks Anthropic API
// Tests will fail if ANTHROPIC_BASE_URL is https://api.anthropic.com

// CRITICAL: Use vi.mock() at top level BEFORE imports (hoisting required)
vi.mock('../../src/core/task-orchestrator.js', async () => {
  const actual = await vi.importActual('../../src/core/task-orchestrator.js');
  return {
    ...actual,
    TaskOrchestrator: vi.fn(),
  };
});

// CRITICAL: After emitting signals, await async handlers
process.emit('SIGINT');
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));
// Two setImmediate calls ensure handler has chance to run

// GOTCHA: Store original listeners in beforeEach
beforeEach(() => {
  originalListeners = {
    SIGINT: process.listeners('SIGINT').slice(),
    SIGTERM: process.listeners('SIGTERM').slice(),
  };
});

// CRITICAL: Restore listeners in afterEach
afterEach(() => {
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalListeners.SIGINT.forEach(fn => process.on('SIGINT', fn));
  originalListeners.SIGTERM.forEach(fn => process.on('SIGTERM', fn));
});

// CRITICAL: SessionManager uses batching architecture
// updateItemStatus() accumulates changes in memory
// flushUpdates() atomically writes all pending changes
// Tests must verify both methods are called

// CRITICAL: Atomic write pattern uses temp file + rename
// Prevents partial/corrupted files if shutdown happens during write
// Temp file has random name: tasks.json.tmp_<random>
// On failure, temp file is cleaned up

// CRITICAL: --continue flag works via PRD hash matching
// SessionManager.initialize() searches for existing session
// If found, loads tasks.json and restores state
// Tests can mock this behavior

// GOTCHA: PipelineResult includes shutdown information
// result.shutdownInterrupted: boolean
// result.shutdownReason: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT' | undefined
// Tests must verify these fields are accurate

// CRITICAL: Progress metrics at shutdown:
// result.totalTasks - total subtasks in backlog
// result.completedTasks - count of tasks with status 'Complete'
// result.failedTasks - count of failed tasks
// These should reflect state at shutdown moment

// CRITICAL: When testing task completion before shutdown:
// Mock processNextItem to track completion count
// Set shutdown flag AFTER first task completes
// Verify only first task executed, loop exited

// GOTCHA: Tests should focus on shutdown behavior
// Don't duplicate main loop tests from P1.M1.T4.S1
// Don't test resource monitoring (P1.M1.T4.S3)
// Don't test nested execution guard (P1.M1.T4.S4)
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from `src/core/models.ts`:

```typescript
// Import existing types for use in tests
import type { SessionState, Backlog, Status, PipelineResult } from '../../src/core/models.js';
import type { PRPPipeline } from '../../src/workflows/prp-pipeline.js';

// Mock fixture for SessionState with shutdown-relevant fields
const createMockSessionState = (overrides?: Partial<SessionState>): SessionState => ({
  metadata: {
    id: '001_test123',
    hash: 'test123',
    path: '/test/path/001_test123',
    createdAt: new Date(),
    parentSession: null,
  },
  prdSnapshot: '# Test PRD',
  taskRegistry: {
    backlog: [],
  },
  currentItemId: null, // Important for resume functionality
  ...overrides,
});

// Mock fixture for Backlog with task statuses
const createMockBacklog = (taskCount: number = 3): Backlog => ({
  backlog: Array.from({ length: taskCount }, (_, i) => ({
    type: 'Subtask',
    id: `P1.M1.T1.S${i + 1}`,
    title: `Test Subtask ${i + 1}`,
    status: i === 0 ? 'Complete' : 'Planned', // Mix of statuses
    description: `Description for subtask ${i + 1}`,
    dependencies: [],
    context_scope: 'Test scope',
    story_points: 1,
  })),
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE existing prp-pipeline-shutdown.test.ts
  - REVIEW: Current test coverage in tests/integration/prp-pipeline-shutdown.test.ts
  - IDENTIFY: Gaps in test coverage (refer to test-case-design.md)
  - DOCUMENT: Existing test patterns to follow
  - DELIVERABLE: Analysis document of enhancements needed

Task 2: ENHANCE tests/integration/prp-pipeline-shutdown.test.ts - Current Task Completion
  - ADD: describe block 'current task completion before shutdown'
  - IMPLEMENT: test 'should complete current task before exiting on SIGINT'
    - SETUP: Create backlog with 3 tasks
    - SETUP: Mock processNextItem to track completion
    - EXECUTE: Start pipeline, emit SIGINT after first task
    - VERIFY: First task completed, second task not started
    - VERIFY: Loop exited after current task
  - IMPLEMENT: test 'should not interrupt in-flight task execution'
    - SETUP: Mock long-running task (100ms)
    - EXECUTE: Start task, emit signal 50ms in
    - VERIFY: Task completes fully, then loop checks shutdown flag
  - FOLLOW pattern: Existing shutdown tests (lines 150-276)
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: After 'SIGINT handling during execution' section

Task 3: ENHANCE tests/integration/prp-pipeline-shutdown.test.ts - Resume Functionality
  - ADD: describe block '--continue flag resume functionality'
  - IMPLEMENT: test 'should resume from interrupted session state'
    - SETUP: Create tasks.json with partial completion (task 1 Complete, task 2 Planned)
    - SETUP: Mock SessionManager.initialize to return existing session
    - EXECUTE: Run pipeline with --continue flag
    - VERIFY: Task 1 skipped (already Complete)
    - VERIFY: Task 2 executed
  - IMPLEMENT: test 'should preserve currentItemId for resume'
    - SETUP: Create tasks.json with currentItemId = 'P1.M1.T1.S3'
    - EXECUTE: Resume with --continue
    - VERIFY: Execution starts from P1.M1.T1.S3
  - IMPLEMENT: test 'should skip completed tasks on resume'
    - SETUP: Create tasks.json with mix of Complete and Planned
    - EXECUTE: Resume with --continue
    - VERIFY: Only Planned tasks execute
  - FOLLOW pattern: Integration test patterns from fix-cycle-workflow-integration.test.ts
  - DEPENDENCIES: Task 2 (task completion tests)
  - PLACEMENT: After 'state preservation during shutdown' section

Task 4: ENHANCE tests/integration/prp-pipeline-shutdown.test.ts - State Corruption Prevention
  - ADD: describe block 'state corruption prevention'
  - IMPLEMENT: test 'should handle multiple signals without corruption'
    - SETUP: Create pipeline with 5 tasks
    - EXECUTE: Emit SIGINT, SIGTERM, SIGINT rapidly
    - VERIFY: Only first signal processed
    - VERIFY: State remains consistent (no duplicate saves)
  - IMPLEMENT: test 'should preserve state during error in cleanup'
    - SETUP: Mock cleanup to throw after saveBacklog
    - EXECUTE: Run pipeline with error
    - VERIFY: saveBacklog called before error
    - VERIFY: State saved despite cleanup error
  - IMPLEMENT: test 'should use atomic writes to prevent corruption'
    - SETUP: Mock fs.write to fail midway
    - EXECUTE: Trigger saveBacklog
    - VERIFY: Either original or new file exists, never partial
  - FOLLOW pattern: Error handling tests from prp-pipeline-integration.test.ts
  - DEPENDENCIES: Task 3 (resume tests)
  - PLACEMENT: After 'signal listener cleanup' section

Task 5: ENHANCE tests/integration/prp-pipeline-shutdown.test.ts - Edge Cases
  - ADD: describe block 'edge cases and error scenarios'
  - IMPLEMENT: test 'should handle shutdown before any tasks'
    - SETUP: Create pipeline, emit SIGINT before backlog execution
    - EXECUTE: Run pipeline
    - VERIFY: Clean shutdown, zero tasks completed
  - IMPLEMENT: test 'should handle shutdown during error recovery'
    - SETUP: Mock task to throw error
    - EXECUTE: Emit SIGINT during error handling
    - VERIFY: Error tracked, shutdown completes, state saved
  - IMPLEMENT: test 'should handle resource limit shutdown'
    - SETUP: Mock resource monitor to return shouldStop = true
    - EXECUTE: Run pipeline
    - VERIFY: shutdownReason = 'RESOURCE_LIMIT', state saved
  - FOLLOW pattern: Edge case tests from unit tests
  - DEPENDENCIES: Task 4 (corruption prevention tests)
  - PLACEMENT: After 'PipelineResult with shutdown info' section

Task 6: ENHANCE tests/integration/prp-pipeline-shutdown.test.ts - Enhanced Verification
  - ENHANCE: Existing tests with additional verification
  - ADD: Verify flushUpdates() called before saveBacklog()
  - ADD: Verify PipelineResult progress metrics accuracy
  - ADD: Verify currentItemId preservation in saved state
  - ADD: Verify signal handler registration on construction
  - FOLLOW pattern: Existing test structure
  - DEPENDENCIES: Task 5 (edge cases complete)
  - PLACEMENT: Throughout existing test sections

Task 7: VERIFY test coverage and completeness
  - VERIFY: All 8 test categories from test-case-design.md covered
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Mock setup matches existing patterns
  - VERIFY: Cleanup pattern includes listener restoration
  - VERIFY: No duplicate tests from P1.M1.T4.S1
  - VERIFY: No overlap with P1.M1.T4.S3 (resource monitoring)
  - VERIFY: No overlap with P1.M1.T4.S4 (nested execution guard)

Task 8: DOCUMENT test enhancements
  - CREATE: Summary document of enhancements made
  - DOCUMENT: New test sections added
  - DOCUMENT: Test coverage improvements
  - UPDATE: PRP.md with actual implementation notes
  - DELIVERABLE: Enhanced test documentation
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Integration tests for PRPPipeline graceful shutdown handling
 *
 * @remarks
 * Tests validate end-to-end graceful shutdown behavior with real SIGINT/SIGTERM signals.
 * Tests verify that current task completes before exit, state is saved, and proper cleanup occurs.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

// PATTERN: Import statements with .js extensions
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';
import type { Backlog, Status } from '../../src/core/models.js';

// CRITICAL: Mock agent factory to avoid LLM calls
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));

// CRITICAL: Mock SessionManager for controlled testing
vi.mock('../../src/core/session-manager.js', () => ({
  SessionManager: vi.fn().mockImplementation(() => ({
    currentSession: null,
    initialize: vi.fn(),
    saveBacklog: vi.fn(),
  })),
}));

// PATTERN: Original listener storage and restoration
describe('PRPPipeline Graceful Shutdown Integration Tests', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;
  let originalProcessListeners: {
    SIGINT: Array<() => void>;
    SIGTERM: Array<() => void>;
  };

  beforeEach(() => {
    // Reset SessionManager mock to default
    MockSessionManagerClass.mockImplementation(() => ({
      currentSession: null,
      initialize: vi.fn().mockResolvedValue({ currentSession: null }),
      saveBacklog: vi.fn().mockResolvedValue(undefined),
    }));

    // Store original process listeners to restore after tests
    originalProcessListeners = {
      SIGINT: (process as any)._events?.SIGINT
        ? [...(process as any)._events.SIGINT]
        : [],
      SIGTERM: (process as any)._events?.SIGTERM
        ? [...(process as any)._events.SIGTERM]
        : [],
    };

    // Create temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'prp-shutdown-test-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');
  });

  afterEach(async () => {
    // Allow pending async operations to complete
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();

    // Restore original process listeners
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    originalProcessListeners.SIGINT.forEach(listener =>
      process.on('SIGINT', listener)
    );
    originalProcessListeners.SIGTERM.forEach(listener =>
      process.on('SIGTERM', listener)
    );
  });

  // PATTERN: Current task completion test
  describe('current task completion before shutdown', () => {
    it('should complete current task before exiting on SIGINT', async () => {
      // SETUP: Create test PRD
      createTestPRD();

      // Create backlog with 3 subtasks
      const backlog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned' as Status,
            description: 'Test phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned' as Status,
                description: 'Test milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned' as Status,
                    description: 'Test task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                      {
                        id: 'P1.M1.T1.S3',
                        type: 'Subtask',
                        title: 'Subtask 3',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      // Setup mock SessionManager BEFORE creating pipeline
      const mockSessionManager = setupMockSessionManager(backlog);

      // EXECUTE: Create pipeline
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );

      // Mock processNextItem to simulate task execution with shutdown after first task
      let callCount = 0;
      const mockOrchestrator: any = {
        sessionManager: {},
        currentItemId: null as string | null,
        processNextItem: vi.fn().mockImplementation(async () => {
          callCount++;
          // After first task completes, set shutdown flag
          if (callCount === 1) {
            (pipeline as any).shutdownRequested = true;
            (pipeline as any).shutdownReason = 'SIGINT';
          }
          // Return false after second call to simulate queue empty
          return callCount <= 1;
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // Run pipeline
      const result = await pipeline.run();

      // VERIFY: First task completed before shutdown
      expect(callCount).toBeGreaterThan(0); // At least one task started
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(2); // 1 task + 1 false return

      // VERIFY: Pipeline shutdown gracefully
      expect(pipeline.shutdownRequested).toBe(true);
      expect(pipeline.shutdownReason).toBe('SIGINT');
      expect(result.shutdownInterrupted).toBe(true);
      expect(result.shutdownReason).toBe('SIGINT');

      // VERIFY: Cleanup was called
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
    });

    it('should not interrupt in-flight task execution', async () => {
      // SETUP: Create test PRD and backlog
      createTestPRD();
      const backlog: Backlog = { backlog: [] };
      const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
      const { createArchitectAgent } = await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      const mockSessionManager = setupMockSessionManager(backlog);
      const pipeline = new PRPPipeline(prdPath, undefined, undefined, false, false, undefined, undefined, planDir);

      // Mock processNextItem with delay (simulates long-running task)
      let taskStarted = false;
      const mockOrchestrator: any = {
        sessionManager: {},
        currentItemId: 'P1.M1.T1.S1',
        processNextItem: vi.fn().mockImplementation(async () => {
          taskStarted = true;
          // Simulate task taking 100ms
          await new Promise(resolve => setTimeout(resolve, 100));
          // Emit signal 50ms into task execution
          setTimeout(() => {
            process.emit('SIGINT');
          }, 50);
          return false; // No more items
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE: Run pipeline
      const result = await pipeline.run();

      // VERIFY: Task completed fully (not interrupted mid-execution)
      expect(taskStarted).toBe(true);
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(1);

      // VERIFY: Shutdown handled gracefully
      expect(result.shutdownInterrupted).toBe(true);
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
    });
  });

  // PATTERN: Resume functionality test
  describe('--continue flag resume functionality', () => {
    it('should resume from interrupted session state', async () => {
      // SETUP: Create test PRD
      createTestPRD();

      // Create backlog with task 1 Complete, task 2 Planned
      const backlog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Implementing' as Status,
            description: 'Test phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Implementing' as Status,
                description: 'Test milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Implementing' as Status,
                    description: 'Test task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Complete' as Status, // Already complete
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned' as Status, // Should execute
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
      const { createArchitectAgent } = await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
          currentItemId: 'P1.M1.T1.S2', // Resume from here
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: { id: 'test', hash: 'abc', path: tempDir, createdAt: new Date() },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: 'P1.M1.T1.S2',
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
        flushUpdates: vi.fn().mockResolvedValue(undefined),
      };
      MockSessionManagerClass.mockImplementation(() => mockSessionManager);

      // EXECUTE: Run pipeline (simulates --continue behavior)
      const pipeline = new PRPPipeline(prdPath, undefined, undefined, false, false, undefined, undefined, planDir);

      const processedTasks: string[] = [];
      const mockOrchestrator: any = {
        sessionManager: {},
        currentItemId: 'P1.M1.T1.S2',
        processNextItem: vi.fn().mockImplementation(async () => {
          // Track which tasks are processed
          processedTasks.push((pipeline as any).taskOrchestrator.currentItemId);
          return false; // No more items after first
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.run();

      // VERIFY: Task resumed from currentItemId
      expect(processedTasks).toContain('P1.M1.T1.S2');
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
    });
  });

  // PATTERN: State corruption prevention test
  describe('state corruption prevention', () => {
    it('should handle multiple signals without corruption', async () => {
      // SETUP: Create test PRD
      createTestPRD();
      const backlog: Backlog = { backlog: [] };
      const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
      const { createArchitectAgent } = await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      const mockSessionManager = setupMockSessionManager(backlog);
      const pipeline = new PRPPipeline(prdPath, undefined, undefined, false, false, undefined, undefined, planDir);
      const warnSpy = vi.spyOn((pipeline as any).logger, 'warn');

      // EXECUTE: Emit multiple signals rapidly
      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockImplementation(async () => {
          // Emit multiple signals
          process.emit('SIGINT');
          process.emit('SIGTERM');
          process.emit('SIGINT');

          // Allow async handlers to complete
          await new Promise(resolve => setImmediate(resolve));
          await new Promise(resolve => setImmediate(resolve));

          return false;
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;
      (pipeline as any).sessionManager = mockSessionManager;

      await pipeline.run();

      // VERIFY: Only first signal processed, warning logged for duplicate
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate SIGINT')
      );

      // VERIFY: State saved once (no duplicate saves)
      expect(mockSessionManager.saveBacklog).toHaveBeenCalledTimes(1);

      warnSpy.mockRestore();
    });

    it('should preserve state during error in cleanup', async () => {
      // SETUP
      createTestPRD();
      const backlog: Backlog = { backlog: [] };
      const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
      const { createArchitectAgent } = await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: { id: 'test', hash: 'abc', path: tempDir, createdAt: new Date() },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockImplementation(async () => {
          // State saved successfully
          return Promise.resolve();
        }),
      };

      const pipeline = new PRPPipeline(prdPath, undefined, undefined, false, false, undefined, undefined, planDir);

      // Spy on cleanup to throw after saveBacklog
      const cleanupSpy = vi.spyOn(pipeline as any, 'cleanup').mockImplementation(async function() {
        // Call original cleanup logic (saves state)
        await mockSessionManager.saveBacklog();
        // Then throw error
        throw new Error('Cleanup error after save');
      });

      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockResolvedValue(false),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;
      (pipeline as any).sessionManager = mockSessionManager;

      // EXECUTE: Run pipeline (will error in cleanup)
      const result = await pipeline.run();

      // VERIFY: State was saved before error
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();

      // VERIFY: Error was handled (cleanup failures don't prevent shutdown)
      expect(pipeline.currentPhase).toBe('shutdown_complete');

      cleanupSpy.mockRestore();
    });
  });

  // PATTERN: Edge cases test
  describe('edge cases and error scenarios', () => {
    it('should handle shutdown before any tasks', async () => {
      // SETUP: Create pipeline with empty backlog
      createTestPRD();
      const backlog: Backlog = { backlog: [] };
      const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
      const { createArchitectAgent } = await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      const mockSessionManager = setupMockSessionManager(backlog);
      const pipeline = new PRPPipeline(prdPath, undefined, undefined, false, false, undefined, undefined, planDir);

      // Set shutdown flag immediately
      (pipeline as any).shutdownRequested = true;

      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockResolvedValue(false),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE: Run pipeline
      const result = await pipeline.run();

      // VERIFY: Clean shutdown with zero tasks
      expect(result.completedTasks).toBe(0);
      expect(result.shutdownInterrupted).toBe(true);
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
    });

    it('should handle resource limit shutdown', async () => {
      // SETUP
      createTestPRD();
      const backlog: Backlog = { backlog: [] };
      const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
      const { createArchitectAgent } = await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      const mockSessionManager = setupMockSessionManager(backlog);
      const pipeline = new PRPPipeline(prdPath, undefined, undefined, false, false, undefined, undefined, planDir);

      // Mock resource monitor to trigger shutdown
      const mockResourceMonitor: any = {
        shouldStop: vi.fn().mockReturnValue(true),
        getStatus: vi.fn().mockReturnValue({
          limitType: 'memory',
          snapshot: { memoryUsage: '90%' },
          suggestion: 'Reduce concurrent tasks',
        }),
      };
      (pipeline as any)['#resourceMonitor'] = mockResourceMonitor;

      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockResolvedValue(false),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE: Run pipeline
      const result = await pipeline.run();

      // VERIFY: Resource limit shutdown
      expect(result.shutdownReason).toBe('RESOURCE_LIMIT');
      expect(pipeline.shutdownReason).toBe('RESOURCE_LIMIT');
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
    });
  });
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN TESTS:
  - Tests use mocks for TaskOrchestrator and SessionManager
  - Tests use temporary directories for PRD files
  - Focus on signal handling behavior, not end-to-end scenarios

MOCK INTEGRATIONS:
  - Mock: src/core/task-orchestrator.js (TaskOrchestrator) - control processNextItem behavior
  - Mock: src/core/session-manager.js (SessionManager) - control session state, spy on saveBacklog
  - Mock: src/agents/agent-factory.js - avoid LLM API calls
  - Real: src/workflows/prp-pipeline.js (test real signal handlers and cleanup)

SIGNAL HANDLING INTEGRATION:
  - Register: process.on('SIGINT', handler) in constructor
  - Emit: process.emit('SIGINT') in tests
  - Verify: shutdownRequested flag set, loop exits, cleanup runs
  - Cleanup: process.off('SIGINT', handler) in cleanup() method

STATE PERSISTENCE INTEGRATION:
  - Batch: updateItemStatus() accumulates changes
  - Flush: flushUpdates() writes pending changes atomically
  - Save: saveBacklog() writes complete tasks.json
  - Order: flushUpdates() → saveBacklog() in cleanup()

RESUME FUNCTIONALITY INTEGRATION:
  - CLI: --continue flag in src/cli/index.ts
  - Session: SessionManager.initialize() loads existing session
  - State: tasks.json preserves statuses and currentItemId
  - Skip: Completed tasks not re-executed on resume

DEPENDENCY ON PREVIOUS WORK ITEMS:
  - P1.M1.T4.S1 provides main execution loop test structure
  - Reference for processNextItem mocking patterns
  - Reference for loop termination testing

PARALLEL CONTEXT:
  - P1.M1.T4.S1 (Verify main execution loop) - completed, provides loop structure to test shutdown within
  - P1.M1.T4.S3 (Verify resource monitoring) - will test RESOURCE_LIMIT shutdown reason
  - P1.M1.T4.S4 (Verify nested execution guard) - will test nested pipeline behavior
  - This PRP focuses on signal handling (SIGINT/SIGTERM), not resource limits or nesting

SCOPE BOUNDARIES:
  - This PRP tests SIGINT/SIGTERM signal handling
  - This PRP tests graceful shutdown (current task completes, state saved)
  - This PRP tests --continue flag resume functionality
  - This PRP tests state corruption prevention
  - Does NOT test normal execution (P1.M1.T4.S1)
  - Does NOT test resource monitoring limits (P1.M1.T4.S3)
  - Does NOT test nested execution guard (P1.M1.T4.S4)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modifications - fix before proceeding
npx eslint tests/integration/prp-pipeline-shutdown.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the enhanced shutdown file
npx vitest run tests/integration/prp-pipeline-shutdown.test.ts

# Run with coverage
npx vitest run tests/integration/prp-pipeline-shutdown.test.ts --coverage

# Run related pipeline tests to ensure no breakage
npx vitest run tests/unit/workflows/prp-pipeline.test.ts
npx vitest run tests/integration/prp-pipeline-integration.test.ts

# Expected: All tests pass, coverage shows signal handling tested
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full integration test suite still passes
npx vitest run tests/integration/

# Check that existing shutdown tests still work
npx vitest run tests/integration/prp-pipeline-shutdown.test.ts

# Test signal handling specifically
npx vitest run tests/integration/prp-pipeline-shutdown.test.ts --grep "SIGINT|SIGTERM|shutdown"

# Expected: All integration tests pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/prp-pipeline-shutdown.test.ts

# Check test file follows project conventions
head -100 tests/integration/prp-pipeline-shutdown.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Verify new test sections are present
grep -n "describe.*current task completion" tests/integration/prp-pipeline-shutdown.test.ts
grep -n "describe.*resume functionality" tests/integration/prp-pipeline-shutdown.test.ts
grep -n "describe.*state corruption" tests/integration/prp-pipeline-shutdown.test.ts
grep -n "describe.*edge cases" tests/integration/prp-pipeline-shutdown.test.ts

# Run tests in watch mode to verify stability
npx vitest watch tests/integration/prp-pipeline-shutdown.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage for signal handling
npx vitest run tests/integration/prp-pipeline-shutdown.test.ts --coverage
# Should see coverage for signal handlers, cleanup, shutdown paths

# Expected: Test file is well-structured, new sections present, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npx vitest run tests/integration/prp-pipeline-shutdown.test.ts`
- [ ] No linting errors: `npx eslint tests/integration/prp-pipeline-shutdown.test.ts`
- [ ] Coverage shows signal handling and shutdown paths tested
- [ ] No existing tests broken by enhancements

### Feature Validation

- [ ] SIGINT signal sets shutdownRequested and shutdownReason correctly
- [ ] SIGTERM signal sets shutdownRequested and shutdownReason correctly
- [ ] Duplicate SIGINT signals handled gracefully (warning logged)
- [ ] Current task completes before loop exits
- [ ] Loop checks shutdownRequested after each task
- [ ] SessionManager.saveBacklog() called during cleanup
- [ ] SessionManager.flushUpdates() called before saveBacklog()
- [ ] Task statuses preserved in tasks.json
- [ ] currentItemId preserved for resume
- [ ] State saved even if error during shutdown
- [ ] Signal handlers registered on construction
- [ ] Signal handlers removed in cleanup
- [ ] PipelineResult.shutdownInterrupted accurate
- [ ] PipelineResult.shutdownReason matches signal type
- [ ] Progress metrics accurate at shutdown
- [ ] --continue flag resumes from saved state
- [ ] Completed tasks not re-executed on resume
- [ ] Multiple signals don't corrupt state
- [ ] Atomic writes prevent corruption

### Code Quality Validation

- [ ] Follows existing integration test patterns from prp-pipeline-shutdown.test.ts
- [ ] Uses SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.mock for dependencies
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes vi.unstubAllEnvs() and listener restoration
- [ ] Tests use factory functions for consistent mocks
- [ ] Tests focus on signal handling, not duplicating main loop tests
- [ ] No overlap with P1.M1.T4.S1 (main execution loop)
- [ ] No overlap with P1.M1.T4.S3 (resource monitoring)
- [ ] No overlap with P1.M1.T4.S4 (nested execution guard)

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Complex signal scenarios have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Research documents stored in research/ subdirectory
- [ ] Test case design document available
- [ ] PRP enhancements documented

---

## Anti-Patterns to Avoid

- ❌ Don't test main execution loop - that's P1.M1.T4.S1
- ❌ Don't test resource monitoring limits - that's P1.M1.T4.S3
- ❌ Don't test nested execution guard - that's P1.M1.T4.S4
- ❌ Don't use real LLM calls - always use mocks for deterministic testing
- ❌ Don't skip vi.unstubAllEnvs() in afterEach
- ❌ Don't forget to restore process listeners in afterEach
- ❌ Don't use setTimeout without proper waiting/awaiting
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't call process.exit() in signal handlers
- ❌ Don't test unit-level behavior - focus on integration scenarios
- ❌ Don't hardcode configuration values - use factory functions
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific about expected errors
- ❌ Don't forget to await async signal handlers (use setImmediate)
- ❌ Don't assume signal order - test rapid multiple signals
- ❌ Don't test state machines without proper call counting
- ❌ Don't forget to test flushUpdates() before saveBacklog()
- ❌ Don't skip testing currentItemId preservation
- ❌ Don't create temporary directories without cleanup
- ❌ Don't duplicate existing tests - enhance them with additional verification

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T4.S2
**Created:** 2026-01-19
**Status:** Ready for Implementation
