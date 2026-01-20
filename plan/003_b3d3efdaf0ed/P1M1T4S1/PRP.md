# Product Requirement Prompt (PRP): P1.M1.T4.S1 - Verify main execution loop and task processing

---

## Goal

**Feature Goal**: Verify the main execution loop of PRPPipeline correctly processes tasks from the backlog through integration tests that validate session initialization, task processing loop, individual failure handling, progress metrics updates, and pipeline status transitions.

**Deliverable**: Integration test file `tests/integration/pipeline-main-loop.test.ts` with comprehensive test cases covering:
- Pipeline initialization from PRD hash (session discovery/creation)
- Main execution loop processes tasks until queue empty
- Individual task failures don't stop pipeline (tracked and continued)
- Progress metrics are updated (total/completed/failed counts)
- Pipeline status transitions (running → completed/failed)
- Mock session state, task outcomes, and orchestrator behavior

**Success Definition**: All tests pass, verifying:
- PRPPipeline initializes session from PRD hash correctly
- Main execution loop processes all tasks until queue is empty
- Individual task failures are tracked but don't stop pipeline execution
- Progress metrics (totalTasks, completedTasks, failedTasks) are updated correctly
- Pipeline status transitions through expected states (init → session_initialized → prd_decomposed → backlog_running → backlog_complete → shutdown_complete)
- Mock TaskOrchestrator and SessionManager work correctly for deterministic testing

## Why

- PRPPipeline is the core orchestrator that executes the entire PRD-to-implementation workflow
- The main execution loop is critical for ensuring all tasks are processed correctly
- Individual task failures must be tracked without stopping the entire pipeline
- Progress metrics provide visibility into execution status for users
- Pipeline status transitions drive the workflow state machine
- No existing tests verify the main execution loop end-to-end with proper mocking
- The existing `prp-pipeline-integration.test.ts` focuses on end-to-end scenarios, not loop behavior
- The existing `prp-pipeline-shutdown.test.ts` focuses on signal handling, not normal execution

## What

Integration tests that verify the main execution loop of PRPPipeline processes tasks correctly, handles failures gracefully, updates progress metrics, and transitions status appropriately.

### Success Criteria

- [ ] Pipeline initializes session from PRD hash (session discovery or creation)
- [ ] Main execution loop processes tasks until queue empty (processNextItem returns false)
- [ ] Individual task failures are tracked but don't stop pipeline (loop continues)
- [ ] Progress metrics are updated: totalTasks, completedTasks, failedTasks counts
- [ ] Pipeline status transitions: init → session_initialized → prd_decomposed → backlog_running → backlog_complete → shutdown_complete
- [ ] TaskOrchestrator is mocked correctly for deterministic testing
- [ ] SessionManager is mocked correctly for deterministic testing
- [ ] Loop termination conditions are tested (empty queue, shutdown, max iterations)

## All Needed Context

### Context Completeness Check

*This PRP passes the "No Prior Knowledge" test:*
- Exact file paths and patterns from existing pipeline and orchestrator tests
- PRPPipeline implementation details (main loop, progress tracking, status transitions)
- Mock setup patterns for TaskOrchestrator and SessionManager
- Test file structure and naming conventions from the codebase
- Research documents with detailed implementation guidance

### Documentation & References

```yaml
# MUST READ - PRPPipeline main execution loop implementation
- file: src/workflows/prp-pipeline.ts
  why: Contains the complete PRPPipeline implementation including executeBacklog() main loop
  lines: 768-870 (executeBacklog method - main execution loop)
  lines: ~180-250 (run method - orchestrates all workflow steps)
  lines: ~260-320 (initializeSession method - session initialization from PRD hash)
  lines: ~330-390 (decomposePRD method - generates task backlog)
  lines: 435-445 (countCompletedTasks method - progress tracking)
  lines: 450-470 (trackFailure method - failure tracking)
  lines: 490-510 (updateProgress method - progress metric updates)
  pattern: Groundswell Workflow with @Step decorators, while loop for processing
  gotcha: Individual task failures are caught and tracked but don't stop the loop

# MUST READ - TaskOrchestrator interface
- file: src/core/task-orchestrator.ts
  why: Contains TaskOrchestrator interface that PRPPipeline uses for task processing
  lines: 805-834 (processNextItem method - main entry point for processing)
  lines: 206-230 (canExecute method - dependency checking)
  lines: 593-606 (backlog getter - read-only access to current backlog)
  lines: 593-606 (executionQueue getter - copy of execution queue)
  lines: 593-606 (currentItemId getter - currently processing item ID)
  pattern: Queue-based processing with FIFO ordering
  gotcha: Returns false when queue is empty

# MUST READ - SessionManager interface
- file: src/core/session-manager.ts
  why: Contains SessionManager interface that PRPPipeline uses for session management
  lines: 180-210 (initialize method - creates or loads session from PRD hash)
  lines: 230-260 (currentSession getter - current session state)
  lines: 280-310 (updateItemStatus method - updates task status with batching)
  lines: 340-360 (flushUpdates method - commits all pending writes)
  pattern: PRD hash-based session discovery and creation
  gotcha: Session ID format is {sequence}_{hash}

# MUST READ - Existing pipeline integration test (reference patterns)
- file: tests/integration/prp-pipeline-integration.test.ts
  why: Shows existing pipeline testing patterns for setup, mocking, and verification
  lines: 16-50 (test environment setup with temporary directories)
  lines: 60-100 (mock agent factory and PRPRuntime)
  lines: 110-150 (mock git operations)
  lines: 200-250 (pipeline execution and result verification)
  lines: 300-350 (progress tracking verification)
  pattern: Temporary directory, mocked dependencies, verify PipelineResult
  gotcha: This test focuses on end-to-end scenarios, not main loop behavior

# MUST READ - Pipeline shutdown test (reference for orchestrator mocking)
- file: tests/integration/prp-pipeline-shutdown.test.ts
  why: Shows how to mock TaskOrchestrator.processNextItem for controlled testing
  lines: 243-259 (mock orchestrator with controlled processNextItem behavior)
  lines: 265-269 (shutdown flag and result verification)
  lines: 150-276 (signal handler registration testing)
  pattern: Mock processNextItem to return true N times, then false
  gotcha: Use (pipeline as any).taskOrchestrator to set mock after construction

# MUST READ - Task orchestrator test (reference for loop testing)
- file: tests/integration/core/task-orchestrator-e2e.test.ts
  why: Shows how to test main processing loops with processNextItem
  lines: 294-300 (while loop with processNextItem)
  lines: 385-390 (currentItemId tracking)
  lines: 671-674 (queue length verification)
  pattern: while(hasMore) { hasMore = await processNextItem(); }
  gotcha: Track processedIds to verify execution order

# MUST READ - Task orchestrator runtime test (reference for status tracking)
- file: tests/integration/core/task-orchestrator-runtime.test.ts
  why: Shows how to track status transitions during execution
  lines: 315-333 (status progression tracking with spy)
  lines: 351-385 (failure status testing with mocked PRPRuntime)
  pattern: Spy on updateItemStatus to track status changes
  gotcha: Status progression: Planned → Researching → Implementing → Complete/Failed

# MUST READ - Pipeline progress test (reference for progress metrics)
- file: tests/unit/workflows/prp-pipeline-progress.test.ts
  why: Shows how to test progress tracking and metrics
  lines: 50-100 (progress counter testing)
  lines: 150-200 (progress formatter testing)
  pattern: Track completed count, verify percentage calculation
  gotcha: Progress updates happen every N tasks, not every task

# MUST READ - Test setup and global hooks
- file: tests/setup.ts
  why: Contains z.ai API safeguard and global cleanup patterns
  lines: 56-120 (z.ai API endpoint validation)
  lines: 162-180 (beforeEach hooks)
  lines: 189-229 (afterEach hooks with rejection tracking)
  pattern: Global test file with automatic API validation
  gotcha: Tests fail if ANTHROPIC_BASE_URL is api.anthropic.com

# MUST READ - Research documents (in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S1/research/prp-pipeline-main-loop-research.md
  why: Complete PRPPipeline implementation details including main loop, session initialization, error handling
  section: "Main Execution Loop (executeBacklog Method)" (loop structure, termination conditions)

- docfile: plan/003_b3d3efdaf0ed/P1M1T4S1/research/integration-test-patterns-research.md
  why: Integration test patterns, mock setup, test structure from the codebase
  section: "Mock Setup Patterns" (agent factory, PRPRuntime, git operations)

- docfile: plan/003_b3d3efdaf0ed/P1M1T4S1/research/execution-loop-testing-best-practices.md
  why: Best practices for testing execution loops, progress tracking, status transitions
  section: "Testing Main Execution Loops" (mock loop conditions, test exit paths)

# MUST READ - Previous PRP for parallel context
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S4/PRP.md
  why: Previous work item (QA Agent integration) provides test patterns to follow
  section: "Implementation Blueprint" (test structure, mock setup, SETUP/EXECUTE/VERIFY comments)
```

### Current Codebase Tree (test directories)

```bash
tests/
├── integration/
│   ├── prp-pipeline-integration.test.ts        # End-to-end pipeline testing
│   ├── prp-pipeline-shutdown.test.ts           # Graceful shutdown testing
│   ├── groundswell/
│   │   ├── workflow.test.ts                    # Groundswell Workflow tests
│   │   └── mcp.test.ts                         # Groundswell MCP tests
│   ├── core/
│   │   ├── session-manager.test.ts             # Session Manager tests
│   │   ├── task-orchestrator.test.ts           # Task Orchestrator tests
│   │   ├── task-orchestrator-runtime.test.ts   # Runtime orchestrator tests
│   │   └── task-orchestrator-e2e.test.ts       # End-to-end orchestrator tests
│   ├── agents.test.ts                          # Agent factory integration tests
│   └── tools.test.ts                           # MCP tools tests
├── unit/
│   └── workflows/
│       ├── prp-pipeline.test.ts                # Unit tests for PRPPipeline
│       └── prp-pipeline-progress.test.ts       # Progress tracking tests
├── e2e/
│   └── pipeline.test.ts                        # End-to-end pipeline tests
└── setup.ts                                    # Global test setup with API validation
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── integration/
│   ├── pipeline-main-loop.test.ts              # NEW: Main execution loop integration tests
│   ├── prp-pipeline-integration.test.ts        # Existing (keep)
│   ├── prp-pipeline-shutdown.test.ts           # Existing (keep)
│   └── core/
│       ├── task-orchestrator.test.ts           # Existing
│       ├── task-orchestrator-runtime.test.ts   # Existing
│       └── task-orchestrator-e2e.test.ts       # Existing
```

**New File**: `tests/integration/pipeline-main-loop.test.ts`
- Tests PRPPipeline main execution loop (executeBacklog)
- Tests session initialization from PRD hash
- Tests task processing until queue empty
- Tests individual failure handling (tracked, continued)
- Tests progress metrics updates (total/completed/failed)
- Tests pipeline status transitions
- Uses vi.mock for TaskOrchestrator and SessionManager
- Focuses on loop behavior, not end-to-end scenarios

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: PRPPipeline extends Groundswell Workflow
// The executeBacklog method is decorated with @Step
// Main loop is in lines 768-870 of prp-pipeline.ts

// CRITICAL: TaskOrchestrator.processNextItem() returns true while items remain
// Returns false when queue is empty
// This is the loop condition for the main execution loop

// CRITICAL: Individual task failures are caught in try-catch inside the loop
// They are tracked via #trackFailure() but don't re-throw
// This allows the pipeline to continue processing other tasks

// CRITICAL: Progress metrics are updated via countCompletedTasks()
// This is called after each task completion
// completedTasks = count of tasks with status === 'Complete'
// failedTasks = #failedTasks.size

// CRITICAL: Pipeline status transitions are managed via currentPhase
// Status flow: init → session_initialized → prd_decomposed → backlog_running → backlog_complete → qa_complete/qa_skipped → shutdown_complete
// Status is updated at key points in the workflow

// GOTCHA: SessionManager uses PRD hash for session discovery
// Session ID format: {sequence}_{hash}
// Hash is SHA-256 of PRD content
// Session directories are in plan/ folder

// GOTCHA: TaskOrchestrator.executionQueue is a copy, not the original
// Use orchestrator.executionQueue.length to check queue size
// Use orchestrator.currentItemId to track current item

// CRITICAL: Tests MUST use .js extensions for imports (ES modules)
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';

// GOTCHA: Global test setup (tests/setup.ts) blocks Anthropic API
// Tests will fail if ANTHROPIC_BASE_URL is https://api.anthropic.com
// Must use https://api.z.ai/api/anthropic

// CRITICAL: Use vi.mock() at top level BEFORE imports (hoisting required)
vi.mock('../../src/core/task-orchestrator.js', async () => {
  const actual = await vi.importActual('../../src/core/task-orchestrator.js');
  return {
    ...actual,
    TaskOrchestrator: vi.fn(),
  };
});

// GOTCHA: When testing PRPPipeline, mock TaskOrchestrator and SessionManager
// We want to test the REAL executeBacklog() loop behavior
// So we mock the dependencies to control behavior deterministically

// CRITICAL: Mock processNextItem to control loop iterations
// Return true N times to simulate N tasks
// Return false to simulate empty queue
// Throw on specific call to simulate task failure

// CRITICAL: Progress metrics are updated in the main loop
// After each task completes: this.completedTasks = this.#countCompletedTasks();
// Track this by spying on countCompletedTasks or checking result object

// CRITICAL: Pipeline status is updated at key points
// initializeSession → 'session_initialized'
// decomposePRD → 'prd_decomposed'
// executeBacklog → 'backlog_complete' or 'shutdown_interrupted'
// Track this by checking pipeline.currentPhase or result.finalPhase

// CRITICAL: Failure tracking uses private #failedTasks Map
// Access via (pipeline as any)['#failedTasks'] for testing
// Or check result.failedTasks count

// GOTCHA: Max iterations safety check is at 10,000 iterations
// Prevents infinite loops in production
// Test this by mocking processNextItem to always return true

// CRITICAL: Shutdown flag check is inside the loop
// if (this.shutdownRequested) { break; }
// Test this by setting (pipeline as any).shutdownRequested = true

// CRITICAL: Resource monitor check is inside the loop
// if (this.#resourceMonitor?.shouldStop()) { ... }
// For this PRP, we're not testing resource limits (separate work item)
// Focus on normal execution and failure handling

// CRITICAL: PipelineResult object contains final metrics
// result.totalTasks - total subtasks
// result.completedTasks - completed subtasks
// result.failedTasks - failed subtasks
// result.finalPhase - final phase name
// result.success - overall success (no fatal errors)
// result.hasFailures - whether any tasks failed

// GOTCHA: The main loop is in executeBacklog() method
// NOT in run() method
// run() orchestrates all steps, executeBacklog() is just the main loop

// CRITICAL: TaskOrchestrator delegates by item type
// Phases: set status to 'Implementing', process children
// Milestones: set status to 'Implementing', process children
// Tasks: set status to 'Implementing', process children
// Subtasks: main execution unit with dependency checking

// GOTCHA: Tests need to mock both TaskOrchestrator AND SessionManager
// TaskOrchestrator for processNextItem()
// SessionManager for session state and updateItemStatus()

// CRITICAL: Use factory functions for consistent mock creation
// createMockSessionManager(sessionState)
// createMockTaskOrchestrator()
// createMockPipeline(prdPath, mockSessionManager, mockTaskOrchestrator)

// GOTCHA: Temporary directory management
// Use mkdtempSync(join(tmpdir(), 'pipeline-test-'))
// Clean up with rmSync(tempDir, { recursive: true, force: true })
// Do this in beforeEach/afterEach hooks
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from `src/core/models.ts`:

```typescript
// Import existing types for use in tests
import type { SessionState, Backlog, PipelineResult } from '../../src/core/models.js';
import type { PRPPipeline } from '../../src/workflows/prp-pipeline.js';

// Mock fixture for SessionState
const createMockSessionState = (overrides?: Partial<SessionState>): SessionState => ({
  metadata: {
    id: '001_test123',
    hash: 'test123',
    path: '/test/path/001_test123',
    createdAt: new Date(),
    parentSession: null,
  },
  prdSnapshot: '# Test PRD\n\nBuild a feature.',
  taskRegistry: {
    backlog: [],
  },
  currentItemId: null,
  ...overrides,
});

// Mock fixture for Backlog
const createMockBacklog = (taskCount: number = 3): Backlog => ({
  backlog: Array.from({ length: taskCount }, (_, i) => ({
    type: 'Subtask',
    id: `P1.M1.T${i + 1}.S1`,
    title: `Test Subtask ${i + 1}`,
    status: 'Planned',
    description: `Description for subtask ${i + 1}`,
    dependencies: [],
  })),
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/pipeline-main-loop.test.ts
  - IMPLEMENT: File header with JSDoc comments describing test purpose
  - IMPLEMENT: Import statements for Vitest, types, mocks
  - IMPLEMENT: Top-level vi.mock() for TaskOrchestrator and SessionManager
  - IMPLEMENT: Temporary directory setup with mkdtempSync
  - FOLLOW pattern: tests/integration/prp-pipeline-shutdown.test.ts (mock setup)
  - NAMING: pipeline-main-loop.test.ts (distinguished from prp-pipeline-integration.test.ts)
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT mock setup with dynamic imports
  - IMPLEMENT: vi.mock('../../src/core/task-orchestrator.js') with TaskOrchestrator mock
  - IMPLEMENT: vi.mock('../../src/core/session-manager.js') with SessionManager mock
  - IMPLEMENT: vi.mock('../../src/agents/agent-factory.js') to avoid LLM calls
  - IMPLEMENT: vi.mock('../../src/agents/prp-runtime.js') for PRPRuntime
  - IMPLEMENT: Mock implementations with factory functions
  - DEPENDENCIES: Task 1 (file created)

Task 3: IMPLEMENT mock factory functions
  - IMPLEMENT: createMockSessionManager(sessionState) - returns mock SessionManager
  - IMPLEMENT: createMockTaskOrchestrator() - returns mock TaskOrchestrator
  - IMPLEMENT: createMockSessionState(overrides) - returns SessionState fixture
  - IMPLEMENT: createMockBacklog(taskCount) - returns Backlog fixture
  - DEPENDENCIES: Task 2 (mock setup complete)

Task 4: IMPLEMENT main describe block and hooks
  - IMPLEMENT: Main describe block 'integration/pipeline-main-loop'
  - IMPLEMENT: beforeAll to load mocked modules dynamically
  - IMPLEMENT: beforeEach to create temp directory and clear mocks
  - IMPLEMENT: afterEach to clean up temp directory and unstub environments
  - FOLLOW pattern: tests/integration/prp-pipeline-shutdown.test.ts (test structure)
  - DEPENDENCIES: Task 3 (factory functions complete)

Task 5: IMPLEMENT pipeline initialization tests
  - CREATE: describe block 'pipeline initialization from PRD hash'
  - IMPLEMENT: test 'should initialize session from PRD hash'
    - SETUP: Create temporary directory with PRD.md file
    - SETUP: Mock SessionManager.initialize to return mock session
    - EXECUTE: Create PRPPipeline with PRD path
    - VERIFY: SessionManager.initialize called with correct PRD path
    - VERIFY: Pipeline currentPhase is 'session_initialized'
  - DEPENDENCIES: Task 4 (test structure complete)

Task 6: IMPLEMENT main execution loop tests
  - CREATE: describe block 'main execution loop'
  - IMPLEMENT: test 'should process tasks until queue empty'
    - SETUP: Create PRPPipeline with mocked TaskOrchestrator
    - SETUP: Mock processNextItem to return true 3 times, then false
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: processNextItem called 4 times (3 true + 1 false)
    - VERIFY: Pipeline currentPhase is 'backlog_complete'
  - IMPLEMENT: test 'should update progress metrics during execution'
    - SETUP: Mock processNextItem to track completed tasks
    - SETUP: Mock countCompletedTasks to return incremental counts
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: completedTasks count matches number of processed tasks
    - VERIFY: totalTasks count matches backlog size
  - DEPENDENCIES: Task 5 (initialization tests complete)

Task 7: IMPLEMENT individual failure handling tests
  - CREATE: describe block 'individual task failure handling'
  - IMPLEMENT: test 'should track individual task failures'
    - SETUP: Mock processNextItem to throw on second call
    - SETUP: Mock processNextItem to return true for other calls
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: Pipeline continued processing after failure
    - VERIFY: #failedTasks Map contains the failed task ID
    - VERIFY: result.failedTasks count is 1
  - IMPLEMENT: test 'should not stop pipeline on individual failures'
    - SETUP: Mock processNextItem with mixed success/failure pattern
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: All tasks were attempted
    - VERIFY: Pipeline completed despite failures
    - VERIFY: result.hasFailures is true, result.success is true
  - DEPENDENCIES: Task 6 (main loop tests complete)

Task 8: IMPLEMENT progress metrics tests
  - CREATE: describe block 'progress metrics tracking'
  - IMPLEMENT: test 'should update totalTasks count'
    - SETUP: Create backlog with known task count
    - EXECUTE: Run pipeline
    - VERIFY: result.totalTasks matches backlog size
  - IMPLEMENT: test 'should update completedTasks count'
    - SETUP: Mock processNextItem to complete tasks
    - EXECUTE: Run pipeline
    - VERIFY: result.completedTasks matches number of successful completions
  - IMPLEMENT: test 'should update failedTasks count'
    - SETUP: Mock processNextItem to fail some tasks
    - EXECUTE: Run pipeline
    - VERIFY: result.failedTasks matches number of failures
  - DEPENDENCIES: Task 7 (failure handling tests complete)

Task 9: IMPLEMENT status transition tests
  - CREATE: describe block 'pipeline status transitions'
  - IMPLEMENT: test 'should transition through expected status states'
    - SETUP: Spy on currentPhase setter or track phase changes
    - EXECUTE: Run full pipeline (run method)
    - VERIFY: Status transitions: init → session_initialized → prd_decomposed → backlog_running → backlog_complete → shutdown_complete
  - IMPLEMENT: test 'should set backlog_complete after processing all tasks'
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: currentPhase is 'backlog_complete'
  - IMPLEMENT: test 'should set shutdown_interrupted on shutdown request'
    - SETUP: Set shutdownRequested flag during execution
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: currentPhase is 'shutdown_interrupted'
    - VERIFY: result.shutdownInterrupted is true
  - DEPENDENCIES: Task 8 (progress metrics tests complete)

Task 10: IMPLEMENT loop termination condition tests
  - CREATE: describe block 'loop termination conditions'
  - IMPLEMENT: test 'should terminate when queue is empty'
    - SETUP: Mock processNextItem to return false
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: Loop terminated immediately
    - VERIFY: No tasks processed
  - IMPLEMENT: test 'should terminate on shutdown request'
    - SETUP: Mock processNextItem to set shutdown flag
    - EXECUTE: Run pipeline.executeBacklog()
    - VERIFY: Loop terminated early
    - VERIFY: result.shutdownReason is set
  - IMPLEMENT: test 'should terminate on max iterations safety check'
    - SETUP: Mock processNextItem to always return true
    - EXECUTE: Run pipeline.executeBacklog() with expectation of error
    - VERIFY: Error thrown for exceeding max iterations
  - DEPENDENCIES: Task 9 (status transition tests complete)

Task 11: VERIFY all tests follow project patterns
  - VERIFY: Test file uses vi.mock for dependencies
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock variables use proper hoisting patterns
  - VERIFY: Test file location matches conventions (tests/integration/)
  - VERIFY: afterEach cleanup includes vi.unstubAllEnvs()
  - VERIFY: Tests use factory functions for consistent mocks
  - VERIFY: Tests focus on main loop behavior, not end-to-end scenarios
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Top-level module mocking
import { afterEach, beforeEach, describe, expect, it, vi, beforeAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// CRITICAL: Mock TaskOrchestrator and SessionManager at top level
vi.mock('../../src/core/task-orchestrator.js', async () => {
  const actual = await vi.importActual('../../src/core/task-orchestrator.js');
  return {
    ...actual,
    TaskOrchestrator: vi.fn(),
  };
});

vi.mock('../../src/core/session-manager.js', async () => {
  const actual = await vi.importActual('../../src/core/session-manager.js');
  return {
    ...actual,
    SessionManager: vi.fn(),
  };
});

vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createResearcherAgent: vi.fn(),
  createCoderAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));

vi.mock('../../src/agents/prp-runtime.js', () => ({
  PRPRuntime: vi.fn().mockImplementation(() => ({
    executeSubtask: vi.fn().mockResolvedValue({
      success: true,
      validationResults: [],
      artifacts: [],
      error: undefined,
    }),
  })),
}));

// PATTERN: Factory functions for consistent mocks
function createMockSessionState(overrides?: Partial<SessionState>): SessionState {
  return {
    metadata: {
      id: '001_test123',
      hash: 'test123',
      path: '/test/path/001_test123',
      createdAt: new Date(),
      parentSession: null,
    },
    prdSnapshot: '# Test PRD',
    taskRegistry: { backlog: [] },
    currentItemId: null,
    ...overrides,
  };
}

function createMockSessionManager(session: SessionState | null = null) {
  return {
    currentSession: session,
    initialize: vi.fn().mockResolvedValue(session),
    updateItemStatus: vi.fn().mockResolvedValue(undefined),
    flushUpdates: vi.fn().mockResolvedValue(undefined),
    saveBacklog: vi.fn().mockResolvedValue(undefined),
    hasSessionChanged: vi.fn().mockReturnValue(false),
    prdPath: '/test/prd.md',
  };
}

function createMockTaskOrchestrator() {
  return {
    processNextItem: vi.fn(),
    currentItemId: null as string | null,
    sessionManager: {},
    backlog: { backlog: [] },
    executionQueue: [],
  };
}

// PATTERN: Test structure with beforeAll for dynamic imports
describe('integration/pipeline-main-loop', () => {
  let tempDir: string;
  let prdPath: string;
  let TaskOrchestrator: any;
  let SessionManager: any;
  let PRPPipeline: any;

  beforeAll(async () => {
    // Dynamic imports after mocks are applied
    const orchestratorModule = await import('../../src/core/task-orchestrator.js');
    TaskOrchestrator = orchestratorModule.TaskOrchestrator;

    const sessionModule = await import('../../src/core/session-manager.js');
    SessionManager = sessionModule.SessionManager;

    const pipelineModule = await import('../../src/workflows/prp-pipeline.js');
    PRPPipeline = pipelineModule.PRPPipeline;
  });

  beforeEach(() => {
    // Create temporary directory
    tempDir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
    prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, '# Test PRD\n\nBuild a feature.', 'utf-8');

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // ... tests
});

// PATTERN: Pipeline initialization test
it('should initialize session from PRD hash', async () => {
  // SETUP: Create mock session
  const mockSession = createMockSessionState();
  const mockSessionManager = createMockSessionManager(mockSession);

  // Mock SessionManager constructor to return our mock
  vi.mocked(SessionManager).mockImplementation(() => mockSessionManager);

  // EXECUTE: Create pipeline
  const pipeline = new PRPPipeline(prdPath);

  // VERIFY: SessionManager.initialize was called
  expect(mockSessionManager.initialize).toHaveBeenCalled();

  // VERIFY: Pipeline has session
  expect(pipeline.currentPhase).toBe('session_initialized');
});

// PATTERN: Main execution loop test
it('should process tasks until queue empty', async () => {
  // SETUP: Create pipeline with mocks
  const mockSession = createMockSessionState();
  const mockSessionManager = createMockSessionManager(mockSession);
  const mockOrchestrator = createMockTaskOrchestrator();

  // Mock processNextItem to return true 3 times, then false
  let callCount = 0;
  mockOrchestrator.processNextItem = vi.fn().mockImplementation(async () => {
    callCount++;
    return callCount <= 3; // Returns true 3 times, then false
  });

  vi.mocked(SessionManager).mockImplementation(() => mockSessionManager);
  vi.mocked(TaskOrchestrator).mockImplementation(() => mockOrchestrator);

  // EXECUTE: Run pipeline
  const pipeline = new PRPPipeline(prdPath);
  await pipeline.executeBacklog();

  // VERIFY: processNextItem called 4 times (3 true + 1 false)
  expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(4);

  // VERIFY: Pipeline completed backlog
  expect(pipeline.currentPhase).toBe('backlog_complete');
});

// PATTERN: Individual failure handling test
it('should track individual task failures', async () => {
  // SETUP: Create pipeline with mocks
  const mockSession = createMockSessionState();
  const mockSessionManager = createMockSessionManager(mockSession);
  const mockOrchestrator = createMockTaskOrchestrator();

  // Mock processNextItem to throw on second call
  let callCount = 0;
  mockOrchestrator.processNextItem = vi.fn().mockImplementation(async () => {
    callCount++;
    if (callCount === 2) {
      throw new Error('Task failed');
    }
    return callCount <= 3;
  });

  // Track currentItemId for failure tracking
  mockOrchestrator.currentItemId = 'P1.M1.T1.S1';

  vi.mocked(SessionManager).mockImplementation(() => mockSessionManager);
  vi.mocked(TaskOrchestrator).mockImplementation(() => mockOrchestrator);

  // EXECUTE: Run pipeline
  const pipeline = new PRPPipeline(prdPath);
  const result = await pipeline.run();

  // VERIFY: All tasks were attempted (pipeline continued after failure)
  expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(4);

  // VERIFY: Failure was tracked
  expect(result.hasFailures).toBe(true);
  expect(result.failedTasks).toBe(1);

  // VERIFY: Pipeline completed despite failure
  expect(result.success).toBe(true);
});

// PATTERN: Progress metrics test
it('should update progress metrics during execution', async () => {
  // SETUP: Create pipeline with mocks
  const mockSession = createMockSessionState({
    taskRegistry: createMockBacklog(5),
  });
  const mockSessionManager = createMockSessionManager(mockSession);
  const mockOrchestrator = createMockTaskOrchestrator();

  // Mock backlog with 5 tasks
  mockOrchestrator.backlog = createMockBacklog(5);

  // Mock processNextItem to process 5 tasks
  let callCount = 0;
  mockOrchestrator.processNextItem = vi.fn().mockImplementation(async () => {
    callCount++;
    return callCount <= 5;
  });

  vi.mocked(SessionManager).mockImplementation(() => mockSessionManager);
  vi.mocked(TaskOrchestrator).mockImplementation(() => mockOrchestrator);

  // EXECUTE: Run pipeline
  const pipeline = new PRPPipeline(prdPath);
  const result = await pipeline.run();

  // VERIFY: Progress metrics match execution
  expect(result.totalTasks).toBe(5);
  expect(result.completedTasks).toBeGreaterThan(0);
  expect(result.failedTasks).toBe(0);
});

// PATTERN: Status transition test
it('should transition through expected status states', async () => {
  // SETUP: Create pipeline with mocks
  const mockSession = createMockSessionState();
  const mockSessionManager = createMockSessionManager(mockSession);
  const mockOrchestrator = createMockTaskOrchestrator();

  // Track phase transitions
  const phases: string[] = [];
  const originalPipeline = PRPPipeline;
  let pipelineInstance: any = null;

  vi.mocked(SessionManager).mockImplementation(() => mockSessionManager);
  vi.mocked(TaskOrchestrator).mockImplementation(() => mockOrchestrator);

  vi.spyOn(originalPipeline.prototype, 'initializeSession').mockImplementation(async function() {
    (this as any).currentPhase = 'session_initialized';
  });

  vi.spyOn(originalPipeline.prototype, 'decomposePRD').mockImplementation(async function() {
    (this as any).currentPhase = 'prd_decomposed';
  });

  // EXECUTE: Run full pipeline
  pipelineInstance = new PRPPipeline(prdPath);
  await pipelineInstance.run();

  // VERIFY: Final phase is complete
  expect(pipelineInstance.currentPhase).toBe('shutdown_complete');
});

// PATTERN: Loop termination condition test
it('should terminate when queue is empty', async () => {
  // SETUP: Create pipeline with empty queue
  const mockSession = createMockSessionState();
  const mockSessionManager = createMockSessionManager(mockSession);
  const mockOrchestrator = createMockTaskOrchestrator();

  // Mock processNextItem to return false immediately (empty queue)
  mockOrchestrator.processNextItem = vi.fn().mockResolvedValue(false);

  vi.mocked(SessionManager).mockImplementation(() => mockSessionManager);
  vi.mocked(TaskOrchestrator).mockImplementation(() => mockOrchestrator);

  // EXECUTE: Run pipeline
  const pipeline = new PRPPipeline(prdPath);
  await pipeline.executeBacklog();

  // VERIFY: Loop terminated immediately
  expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(1);

  // VERIFY: Pipeline completed backlog (0 tasks)
  expect(pipeline.currentPhase).toBe('backlog_complete');
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN TESTS:
  - Tests use mocks for TaskOrchestrator and SessionManager
  - Tests use temporary directories for PRD files
  - Focus on main loop behavior, not end-to-end scenarios

MOCK INTEGRATIONS:
  - Mock: src/core/task-orchestrator.js (TaskOrchestrator) - control processNextItem behavior
  - Mock: src/core/session-manager.js (SessionManager) - control session state
  - Mock: src/agents/agent-factory.js - avoid LLM API calls
  - Mock: src/agents/prp-runtime.js - control PRP execution
  - Real: src/workflows/prp-pipeline.js (test real executeBacklog loop)

DEPENDENCY ON PREVIOUS WORK ITEMS:
  - P1.M1.T3.S4 provides QA Agent integration test patterns to follow
  - Reference for test structure, SETUP/EXECUTE/VERIFY comments
  - Reference for mock setup patterns

PARALLEL CONTEXT:
  - P1.M1.T3.S4 (Verify QA Agent and bug hunting workflow) - running in parallel
  - That PRP tests QA Agent configuration
  - This PRP tests PRPPipeline main execution loop
  - No overlap or conflict in test coverage

SCOPE BOUNDARIES:
  - This PRP focuses on main execution loop testing
  - Does NOT test graceful shutdown (separate work item: P1.M1.T4.S2)
  - Does NOT test resource monitoring (separate work item: P1.M1.T4.S3)
  - Does NOT test nested execution guard (separate work item: P1.M1.T4.S4)
  - Focuses on normal execution: session init → task processing → completion
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/integration/pipeline-main-loop.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npx vitest run tests/integration/pipeline-main-loop.test.ts

# Run with coverage
npx vitest run tests/integration/pipeline-main-loop.test.ts --coverage

# Run related tests to ensure no breakage
npx vitest run tests/unit/workflows/prp-pipeline.test.ts
npx vitest run tests/unit/workflows/prp-pipeline-progress.test.ts

# Expected: All tests pass, good coverage for main loop behavior
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full integration test suite still passes
npx vitest run tests/integration/

# Check that existing pipeline tests still work
npx vitest run tests/integration/prp-pipeline-integration.test.ts
npx vitest run tests/integration/prp-pipeline-shutdown.test.ts

# Expected: All existing integration tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/pipeline-main-loop.test.ts

# Check test file follows project conventions
head -100 tests/integration/pipeline-main-loop.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/integration/pipeline-main-loop.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage for main execution loop
npx vitest run tests/integration/pipeline-main-loop.test.ts --coverage
# Should see coverage for executeBacklog, progress tracking, status transitions

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npx vitest run tests/integration/pipeline-main-loop.test.ts`
- [ ] No linting errors: `npx eslint tests/integration/pipeline-main-loop.test.ts`
- [ ] Coverage shows main execution loop tested
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] Pipeline initializes session from PRD hash correctly
- [ ] Main execution loop processes tasks until queue empty
- [ ] Individual task failures are tracked but don't stop pipeline
- [ ] Progress metrics are updated (total/completed/failed counts)
- [ ] Pipeline status transitions through expected states
- [ ] Loop termination conditions work correctly (empty queue, shutdown, max iterations)
- [ ] Mock TaskOrchestrator and SessionManager work deterministically

### Code Quality Validation

- [ ] Follows existing integration test patterns from prp-pipeline-shutdown.test.ts
- [ ] Uses SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.mock for dependencies
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes vi.unstubAllEnvs() and temp directory cleanup
- [ ] Tests use factory functions for consistent mocks
- [ ] Tests focus on main loop behavior, not end-to-end scenarios

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Complex validations (loop termination, failure handling) have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Documentation of main execution loop testing approach

---

## Anti-Patterns to Avoid

- ❌ Don't test end-to-end scenarios - focus on main loop behavior
- ❌ Don't test graceful shutdown - that's separate work item P1.M1.T4.S2
- ❌ Don't test resource monitoring - that's separate work item P1.M1.T4.S3
- ❌ Don't test nested execution guard - that's separate work item P1.M1.T4.S4
- ❌ Don't use real LLM calls - always use mocks for deterministic testing
- ❌ Don't skip vi.unstubAllEnvs() in afterEach
- ❌ Don't use setTimeout without proper waiting/awaiting
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't duplicate existing tests from prp-pipeline-integration.test.ts
- ❌ Don't mock the entire PRPPipeline - test the real executeBacklog() loop
- ❌ Don't test unit-level behavior - focus on integration scenarios
- ❌ Don't hardcode configuration values - use factory functions
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific about expected errors
- ❌ Don't forget to test failure tracking in #failedTasks Map
- ❌ Don't test state machines without proper call counting
- ❌ Don't use fake timers for timeout tests - use real timers
- ❌ Don't forget to test all loop termination conditions
- ❌ Don't test decomposePRD or runQACycle - focus on executeBacklog
- ❌ Don't create temporary directories without cleanup in afterEach

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T4.S1
**Created:** 2026-01-19
**Status:** Ready for Implementation
