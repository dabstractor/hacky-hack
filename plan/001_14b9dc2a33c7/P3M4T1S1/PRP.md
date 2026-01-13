# PRP for P3.M4.T1.S1: Create PRPPipeline workflow class

---

## Goal

**Feature Goal**: Create `PRPPipeline` class that orchestrates the complete PRP Pipeline workflow: session initialization → PRD decomposition → backlog execution → QA cycle, with Groundswell Workflow integration for full observability and state tracking.

**Deliverable**: `src/workflows/prp-pipeline.ts` containing:

- `PRPPipeline` class extending Groundswell `Workflow`
- `@ObservedState()` decorators for session, orchestrator, runtime, phase, task counts
- `@Step()` decorated methods: `initializeSession()`, `decomposePRD()`, `executeBacklog()`, `runQACycle()`
- Override `run()` method orchestrating all steps
- `PipelineResult` interface for execution summary

**Success Definition**:

- `PRPPipeline` correctly extends Groundswell `Workflow`
- All `@Step()` methods execute with timing and state tracking
- `@ObservedState()` fields are tracked and snapshotted
- SessionManager initializes new or loads existing session
- Architect agent generates backlog for new sessions
- TaskOrchestrator processes backlog to completion
- QA cycle runs when all tasks complete
- Returns structured `PipelineResult` with full summary
- All existing tests continue to pass
- New tests validate PRPPipeline orchestration
- Full type safety with TypeScript

## User Persona (if applicable)

**Target User**: Developer/CLI user invoking the PRP Pipeline to implement a PRD

**Use Case**: The user has a PRD document and wants to execute the full PRP Pipeline: detect or create session, generate task backlog, execute all tasks with PRP generation/implementation, run QA bug hunt, and receive summary results.

**User Journey**:

1. User invokes CLI: `prp-pipeline run ./PRD.md`
2. PRPPipeline initializes - detects existing session or creates new one
3. For new sessions: Architect agent generates task backlog from PRD
4. TaskOrchestrator processes backlog items using PRPRuntime for each subtask
5. Each subtask: Research (PRP generation) → Implement (PRP execution) → Validate
6. When all tasks complete: QA agent runs bug hunt
7. Pipeline returns summary: tasks completed, duration, artifacts, bugs found
8. User reviews results in session directory

**Pain Points Addressed**:

- Eliminates manual orchestration of session → backlog → execution → QA
- Provides full visibility into pipeline execution via Groundswell observability
- State snapshots enable debugging and recovery
- Single entry point for complete PRD implementation
- Proper error handling at each phase
- Summary results for quick assessment

## Why

- **Complete Outer Loop**: The PRPPipeline is the top-level orchestration layer. Without it, the pipeline components exist but don't execute in a coordinated workflow.
- **Groundswell Integration**: Using `Workflow`, `@Step()`, and `@ObservedState()` provides automatic timing, logging, and state snapshots for debugging and observability.
- **Session Lifecycle Management**: Handles new vs existing session detection, PRD hashing, backlog generation, and persistence.
- **Orchestration Simplicity**: Single `run()` call executes entire pipeline. CLI and future UI layers can invoke directly.
- **Observability**: State tracking (phase, task counts) and timing data enable progress monitoring and performance analysis.
- **Foundation for Features**: Delta sessions (P4.M1), parallel research (P4.M2), and graceful shutdown (P3.M4.T1.S2) build on this workflow.
- **Dependency Integration**: SessionManager (P3.M1), TaskOrchestrator (P3.M2), PRPRuntime (P3.M3.T1) are complete - PRPPipeline ties them together.

## What

### System Behavior

The `PRPPipeline` class:

1. Accepts `prdPath: string` and optional `scope?: Scope` in constructor
2. Creates SessionManager, TaskOrchestrator, PRPRuntime instances
3. Declares `@ObservedState()` fields for sessionManager, taskOrchestrator, runtime, currentPhase, totalTasks, completedTasks
4. `run()` method orchestrates sequential @Step methods:
   - `initializeSession()`: SessionManager.initialize() → detect new vs existing
   - `decomposePRD()`: For new sessions, use Architect agent to generate backlog
   - `executeBacklog()`: Loop while orchestrator.processNextItem() returns true
   - `runQACycle()`: If all tasks complete, run QA bug hunt
5. Returns `PipelineResult` with summary (sessionPath, task counts, duration, artifacts)

### Success Criteria

- [ ] `PRPPipeline` class created in `src/workflows/prp-pipeline.ts`
- [ ] Extends Groundswell `Workflow` class
- [ ] `@ObservedState()` decorators on sessionManager, taskOrchestrator, runtime, currentPhase, totalTasks, completedTasks
- [ ] `@Step({ trackTiming: true })` on initializeSession, decomposePRD, executeBacklog, runQACycle
- [ ] `@Step({ trackTiming: true, snapshotState: true })` on initializeSession for initial snapshot
- [ ] Constructor accepts prdPath and optional scope, calls `super('PRPPipeline')`
- [ ] `initializeSession()` calls SessionManager.initialize(), sets currentPhase
- [ ] `decomposePRD()` checks if backlog empty, calls Architect agent if new session
- [ ] `executeBacklog()` loops while orchestrator.processNextItem() returns true
- [ ] `runQACycle()` checks all tasks complete, runs QA bug hunt
- [ ] `run()` method calls all steps sequentially, returns PipelineResult
- [ ] PipelineResult includes: success, sessionPath, totalTasks, completedTasks, duration, phases summary
- [ ] Unit tests for each @Step method
- [ ] Integration test for full run() workflow
- [ ] Zero regressions in existing test suite

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact Groundswell Workflow decorator patterns and options
- Complete component APIs (SessionManager, TaskOrchestrator, PRPRuntime)
- Architect agent invocation pattern for backlog generation
- Exact method signatures and return types
- State field naming and observation patterns
- Step orchestration with proper error handling
- PipelineResult interface definition
- Test patterns matching existing codebase
- Directory structure and file placement

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API reference - Workflow, @Step, @ObservedState decorators
  critical: Lines 10-114 cover Workflow class, decorator options, usage patterns
  pattern: |
    class MyWorkflow extends Workflow {
      @ObservedState() currentPhase: string = 'init';
      @Step({ trackTiming: true, snapshotState: true })
      async myStep(): Promise<void> { /* ... */ }
      async run(): Promise<Result> { /* ... */ }
    }

- file: src/workflows/hello-world.ts
  why: Simplest existing workflow showing Groundswell pattern
  pattern: Extend Workflow, override run(), use setStatus() and logger.info()
  critical: Shows super() call pattern, setStatus('running'), setStatus('completed')

- file: src/core/session-manager.ts
  why: SessionManager class - initialize(), currentSession, saveBacklog(), loadBacklog()
  pattern: constructor(prdPath, planDir), async initialize(): Promise<SessionState>
  critical: currentSession.taskRegistry.backlog[] contains backlog array
  critical: SessionManager.initialize() returns existing session if hash matches, or creates new

- file: src/core/task-orchestrator.ts
  why: TaskOrchestrator class - processNextItem(), setStatus(), scope support
  pattern: constructor(sessionManager, scope?), async processNextItem(): Promise<boolean>
  critical: processNextItem() returns true while items remain, false when empty
  critical: executeSubtask() is PLACEHOLDER - will be replaced with PRPRuntime in future

- file: src/agents/prp-runtime.ts
  why: PRPRuntime class - executeSubtask() orchestrates inner loop
  pattern: constructor(orchestrator), async executeSubtask(subtask, backlog): Promise<ExecutionResult>
  critical: This is from P3.M3.T1.S3 - assumes it exists as specified
  note: Not used in this PRP (future integration), but understand the pattern

- file: src/agents/agent-factory.ts
  why: createArchitectAgent() for backlog generation in decomposePRD()
  pattern: const agent = createArchitectAgent(); const result = await agent.prompt(prompt)
  critical: Architect prompt returns { backlog: Backlog } from Zod schema

- file: src/core/models.ts
  why: Backlog, Phase, Milestone, Task, Subtask, Status types
  fields: Backlog = { backlog: Phase[] }; each level has status field
  critical: Check if backlog empty: backlog.backlog.length === 0

- file: src/core/scope-resolver.ts
  why: Scope type definition for optional scope parameter
  pattern: type Scope = { type: 'all' | 'phase' | 'milestone' | 'task', id?: string }
  critical: Pass scope to TaskOrchestrator constructor

- file: plan/001_14b9dc2a33c7/P3M3T1S3/PRP.md
  why: Previous PRP for PRPRuntime - understand inner loop orchestration
  critical: PRPRuntime integrates PRPGenerator and PRPExecutor
  note: This PRP focuses on outer loop orchestration, not inner loop details

- url: https://www.typescriptlang.org/docs/handbook/decorators.html
  why: TypeScript decorator syntax for @Step and @ObservedState

- file: plan/001_14b9dc2a33c7/P3M4T1S1/research/README.md
  why: Research findings on workflow orchestration patterns
  critical: Best practices for state management, step orchestration, timing
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts       # createArchitectAgent(), createQAAgent()
│   ├── prp-generator.ts       # PRPGenerator (from P3.M3.T1.S1)
│   ├── prp-executor.ts        # PRPExecutor (from P3.M3.T1.S2)
│   └── prp-runtime.ts         # PRPRuntime (from P3.M3.T1.S3)
├── core/
│   ├── models.ts              # Backlog, Phase, Status, Scope types
│   ├── session-manager.ts     # SessionManager class
│   ├── task-orchestrator.ts   # TaskOrchestrator class
│   └── scope-resolver.ts      # Scope type and utilities
├── workflows/
│   └── hello-world.ts         # Simplest workflow pattern
└── utils/
    └── task-utils.ts          # Task hierarchy utilities

tests/
├── unit/
│   ├── agents/
│   │   └── agent-factory.test.ts
│   └── core/
│       ├── session-manager.test.ts
│       └── task-orchestrator.test.ts
└── integration/
    └── (integration tests)
```

### Desired Codebase Tree with Files to be Added

```bash
src/
├── agents/
│   └── ... (existing files)
├── core/
│   └── ... (existing files)
├── workflows/
│   ├── hello-world.ts         # EXISTING
│   └── prp-pipeline.ts        # NEW - PRPPipeline class

tests/
├── unit/
│   └── workflows/
│       ├── hello-world.test.ts   # EXISTING (may need to create)
│       └── prp-pipeline.test.ts  # NEW - Unit tests for PRPPipeline
└── integration/
    └── prp-pipeline-integration.test.ts  # NEW - Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports must use .js extension
// Even though source is .ts, imports must reference .js
import { Workflow } from 'groundswell';
import type { SessionManager } from '../core/session-manager.js';
import type { TaskOrchestrator } from '../core/task-orchestrator.js';

// CRITICAL: Workflow class requires super() call with name or config
class PRPPipeline extends Workflow {
  constructor() {
    super('PRPPipeline');  // MUST call super with workflow name
  }
}

// CRITICAL: @ObservedState() decorator goes ABOVE property declaration
@ObservedState()
sessionManager: SessionManager;  // Decorator on field, not in constructor

// CRITICAL: @Step() decorator goes ABOVE method declaration
@Step({ trackTiming: true, snapshotState: true })
async initializeSession(): Promise<void> {
  // Method implementation
}

// CRITICAL: @Step options - trackTiming is default true, snapshotState is false default
@Step({ trackTiming: true, snapshotState: true })  // Capture timing AND state
@Step({ trackTiming: true })                        // Capture timing only
@Step()                                              // Use defaults (timing only)

// CRITICAL: setStatus() and logger are from Workflow base class
this.setStatus('running');        // Sets workflow status
this.logger.info('message');      // Logs via workflow logger

// CRITICAL: SessionManager.initialize() returns EXISTING session if PRD hash matches
// Do NOT assume it always creates a new session
const session = await this.sessionManager.initialize();
// Check if backlog is empty to determine new vs existing session
const isNewSession = session.taskRegistry.backlog.length === 0;

// CRITICAL: TaskOrchestrator.processNextItem() returns false when queue is empty
// Use while loop to process all items
while (await this.orchestrator.processNextItem()) {
  // Continue processing until queue empty
}

// CRITICAL: TaskOrchestrator.executeSubtask() is PLACEHOLDER
// Do NOT call it - it just logs and marks Complete
// Future: Will integrate PRPRuntime.executeSubtask()

// CRITICAL: Architect agent requires PRD content as prompt
// Use SessionManager to get PRD content or read from file
const architectAgent = createArchitectAgent();
const backlogPrompt = createArchitectPrompt(session.prdSnapshot);
const result = await architectAgent.prompt(backlogPrompt);

// PATTERN: Use performance.now() for high-resolution timing
const startTime = performance.now();
// ... operations ...
const duration = performance.now() - startTime;

// PATTERN: Always wrap @Step methods in try/catch for proper error handling
@Step()
async myStep(): Promise<void> {
  try {
    // ... step logic ...
  } catch (error) {
    this.logger.error(`Step failed: ${error}`);
    throw error;  // Re-throw to propagate failure
  }
}

// GOTCHA: @ObservedState fields can be public or private
// Public fields are visible in snapshots
// Private fields (# prefix) are also observed but encapsulated
@ObservedState()
public currentPhase: string = 'init';  // Public, visible in snapshots

// GOTCHA: Groundswell Workflow extends EventEmitter
// Can emit custom events if needed for progress tracking
this.emit('progress', { phase: this.currentPhase, tasks: this.completedTasks });

// GOTCHA: run() method should return typed result for type safety
// Define PipelineResult interface with all summary fields
```

## Implementation Blueprint

### Data Models and Structure

Define PipelineResult interface for execution summary:

```typescript
/**
 * Result returned by PRPPipeline.run()
 */
export interface PipelineResult {
  /** Whether pipeline completed successfully */
  success: boolean;
  /** Path to session directory */
  sessionPath: string;
  /** Total number of tasks in backlog */
  totalTasks: number;
  /** Number of tasks completed */
  completedTasks: number;
  /** Number of tasks that failed */
  failedTasks: number;
  /** Current phase at completion */
  finalPhase: string;
  /** Pipeline execution duration in milliseconds */
  duration: number;
  /** Summary of each phase's status */
  phases: PhaseSummary[];
  /** Number of bugs found by QA (0 if QA not run) */
  bugsFound: number;
  /** Error message if pipeline failed */
  error?: string;
}

/**
 * Summary of a single phase's status
 */
export interface PhaseSummary {
  /** Phase ID (e.g., "P1") */
  id: string;
  /** Phase title */
  title: string;
  /** Phase status */
  status: Status;
  /** Number of milestones in phase */
  totalMilestones: number;
  /** Number of milestones completed */
  completedMilestones: number;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/workflows/prp-pipeline.ts
  - IMPLEMENT: PRPPipeline class extending Workflow
  - CLASS STRUCTURE:
    * Constructor: prdPath (string), scope? (Scope)
    * ObservedState fields: sessionManager, taskOrchestrator, runtime, currentPhase, totalTasks, completedTasks
    * Private fields: #prdPath, #scope, #startTime
    * Public methods: run() (override), initializeSession(), decomposePRD(), executeBacklog(), runQACycle()
    * Private methods: #summarizePhases(), #countTasks()
  - NAMING: PascalCase class, camelCase methods/properties
  - PLACEMENT: src/workflows/ directory (sibling to hello-world.ts)
  - DEPENDENCIES: Import from groundswell, session-manager.js, task-orchestrator.js, models.js, agent-factory.js

Task 2: IMPLEMENT constructor and @ObservedState fields
  - ACCEPT: prdPath (string), scope? (Scope) parameters
  - CALL: super('PRPPipeline') to initialize Workflow base class
  - CREATE: SessionManager instance with prdPath
  - CREATE: TaskOrchestrator instance with sessionManager and scope
  - STORE: #prdPath, #scope in private fields
  - INITIALIZE: @ObservedState fields to default values
  - ERROR HANDLING: Throw if prdPath is empty string

Task 3: IMPLEMENT initializeSession() @Step method
  - DECORATE: @Step({ trackTiming: true, snapshotState: true })
  - CALL: await this.sessionManager.initialize()
  - UPDATE: this.currentPhase = 'session_initialized'
  - LOG: this.logger.info() with session path and whether new or existing
  - DETECT: Check backlog.length to determine new vs existing session
  - ERROR HANDLING: Wrap in try/catch, log and re-throw

Task 4: IMPLEMENT decomposePRD() @Step method
  - DECORATE: @Step({ trackTiming: true })
  - CHECK: if backlog already has items (existing session), skip
  - UPDATE: this.currentPhase = 'decomposing_prd'
  - CREATE: Architect agent via createArchitectAgent()
  - CREATE: Architect prompt with PRD snapshot content
  - EXECUTE: await agent.prompt(backlogPrompt)
  - SAVE: backlog via this.sessionManager.saveBacklog(result.backlog)
  - UPDATE: this.totalTasks via #countTasks()
  - LOG: Number of phases, milestones, tasks, subtasks generated
  - ERROR HANDLING: Wrap in try/catch, log and re-throw

Task 5: IMPLEMENT executeBacklog() @Step method
  - DECORATE: @Step({ trackTiming: true })
  - UPDATE: this.currentPhase = 'executing_backlog'
  - LOG: Starting backlog execution with task count
  - LOOP: while (await this.orchestrator.processNextItem())
    * Update this.completedTasks after each item
    * Log progress (every N tasks or on phase completion)
    * Check for stop signals (future: graceful shutdown)
  - UPDATE: this.currentPhase = 'backlog_complete'
  - LOG: Backlog execution complete with final counts
  - ERROR HANDLING: Wrap in try/catch, log and re-throw

Task 6: IMPLEMENT runQACycle() @Step method
  - DECORATE: @Step({ trackTiming: true })
  - CHECK: if all tasks Complete (no Failed or Planned tasks)
  - UPDATE: this.currentPhase = 'qa_cycle'
  - CREATE: QA agent via createQAAgent() (if agent factory supports it)
  - EXECUTE: await agent.prompt(qaPrompt) with session context
  - LOG: Number of bugs found
  - RETURN: bugs found count (for PipelineResult)
  - SKIP: If tasks not all complete, log and skip QA
  - ERROR HANDLING: Wrap in try/catch, log non-fatal, don't fail pipeline

Task 7: IMPLEMENT run() override method
  - SET: this.#startTime = performance.now()
  - CALL: this.setStatus('running')
  - CALL: await this.initializeSession()
  - CALL: await this.decomposePRD()
  - CALL: await this.executeBacklog()
  - CALL: await this.runQACycle()
  - CALL: this.setStatus('completed')
  - CALCULATE: duration = performance.now() - this.#startTime
  - BUILD: PipelineResult with all summary fields
  - RETURN: PipelineResult
  - ERROR HANDLING: Wrap in try/catch, set status 'failed', return failed result

Task 8: IMPLEMENT private helper methods
  - CREATE: #countTasks(): number - counts total subtasks in backlog
  - CREATE: #countCompletedTasks(): number - counts Complete subtasks
  - CREATE: #countFailedTasks(): number - counts Failed subtasks
  - CREATE: #allTasksComplete(): boolean - checks if no Planned/Implementing tasks
  - CREATE: #summarizePhases(): PhaseSummary[] - builds phase summary array
  - PATTERN: Use task-utils.ts functions for hierarchy traversal

Task 9: CREATE tests/unit/workflows/prp-pipeline.test.ts
  - SETUP: Mock SessionManager, TaskOrchestrator
  - TEST: constructor creates instances correctly
  - TEST: initializeSession() calls SessionManager.initialize()
  - TEST: decomposePRD() skips if backlog exists
  - TEST: decomposePRD() generates and saves backlog if empty
  - TEST: executeBacklog() calls processNextItem() until false
  - TEST: runQACycle() skips if tasks not complete
  - TEST: run() calls all steps in order
  - TEST: run() returns PipelineResult with correct fields
  - PATTERN: Use vitest describe/it/expect, mock external dependencies

Task 10: CREATE tests/integration/prp-pipeline-integration.test.ts
  - SETUP: Use real SessionManager, TaskOrchestrator (mock agent calls)
  - TEST: Full run() workflow with new session
  - TEST: Full run() workflow with existing session
  - TEST: State transitions through all phases
  - TEST: PipelineResult summary is accurate
  - SKIP: Mark as test.skip if running in CI without dependencies
```

### Implementation Patterns & Key Details

````typescript
// File: src/workflows/prp-pipeline.ts

// CRITICAL: Import patterns - use .js extensions for ES modules
import { Workflow, Step, ObservedState } from 'groundswell';
import type { SessionManager } from '../core/session-manager.js';
import type { TaskOrchestrator } from '../core/task-orchestrator.js';
import type { PRPRuntime } from '../agents/prp-runtime.js';
import type { Backlog, Phase, Status, Scope } from '../core/models.js';
import { SessionManager as SessionManagerClass } from '../core/session-manager.js';
import { TaskOrchestrator as TaskOrchestratorClass } from '../core/task-orchestrator.js';
import { findItem, getDescendantTasks } from '../utils/task-utils.js';

/**
 * Result returned by PRPPipeline.run()
 */
export interface PipelineResult {
  /** Whether pipeline completed successfully */
  success: boolean;
  /** Path to session directory */
  sessionPath: string;
  /** Total number of subtasks in backlog */
  totalTasks: number;
  /** Number of subtasks completed */
  completedTasks: number;
  /** Number of subtasks that failed */
  failedTasks: number;
  /** Current phase at completion */
  finalPhase: string;
  /** Pipeline execution duration in milliseconds */
  duration: number;
  /** Summary of each phase's status */
  phases: PhaseSummary[];
  /** Number of bugs found by QA (0 if QA not run) */
  bugsFound: number;
  /** Error message if pipeline failed */
  error?: string;
}

/**
 * Summary of a single phase's status
 */
export interface PhaseSummary {
  /** Phase ID (e.g., "P1") */
  id: string;
  /** Phase title */
  title: string;
  /** Phase status */
  status: Status;
  /** Number of milestones in phase */
  totalMilestones: number;
  /** Number of milestones completed */
  completedMilestones: number;
}

/**
 * Main PRP Pipeline workflow
 *
 * @remarks
 * Orchestrates the complete PRP Pipeline lifecycle:
 * 1. Session Initialization: Detect existing or create new session
 * 2. PRD Decomposition: Generate task backlog via Architect agent
 * 3. Backlog Execution: Process all tasks via TaskOrchestrator
 * 4. QA Cycle: Run bug hunt if all tasks complete
 *
 * Uses Groundswell Workflow decorators for observability:
 * - @ObservedState: Tracks session, orchestrator, phase, task counts
 * - @Step: Tracks timing and snapshots for each phase
 *
 * @example
 * ```typescript
 * const pipeline = new PRPPipeline('./PRD.md');
 * const result = await pipeline.run();
 * console.log(`Completed ${result.completedTasks}/${result.totalTasks} tasks`);
 * ```
 */
export class PRPPipeline extends Workflow {
  // ========================================================================
  // Public Observed State Fields (tracked by Groundswell)
  // ========================================================================

  /** Session state manager */
  @ObservedState()
  sessionManager: SessionManager;

  /** Task execution orchestrator */
  @ObservedState()
  taskOrchestrator: TaskOrchestrator;

  /** PRP Runtime for inner loop execution */
  @ObservedState()
  runtime: PRPRuntime | null = null;

  /** Current pipeline phase */
  @ObservedState()
  currentPhase: string = 'init';

  /** Total number of subtasks in backlog */
  @ObservedState()
  totalTasks: number = 0;

  /** Number of completed subtasks */
  @ObservedState()
  completedTasks: number = 0;

  // ========================================================================
  // Private Fields
  // ========================================================================

  /** Path to PRD file */
  readonly #prdPath: string;

  /** Optional scope for limiting execution */
  readonly #scope?: Scope;

  /** Pipeline start time for duration calculation */
  #startTime: number = 0;

  /** Number of bugs found by QA agent */
  #bugsFound: number = 0;

  // ========================================================================
  // Constructor
  // ========================================================================

  /**
   * Creates a new PRPPipeline instance
   *
   * @param prdPath - Path to PRD markdown file
   * @param scope - Optional scope to limit execution
   * @throws {Error} If prdPath is empty
   */
  constructor(prdPath: string, scope?: Scope) {
    super('PRPPipeline');

    if (!prdPath || prdPath.trim() === '') {
      throw new Error('PRP path cannot be empty');
    }

    this.#prdPath = prdPath;
    this.#scope = scope;

    // Create SessionManager
    this.sessionManager = new SessionManagerClass(prdPath);

    // Create TaskOrchestrator (will be initialized with session after initializeSession)
    // Placeholder for now - will be recreated after session initialization
    this.taskOrchestrator = null as any;
  }

  // ========================================================================
  // Step Methods
  // ========================================================================

  /**
   * Initialize session - detect existing or create new
   *
   * @remarks
   * Calls SessionManager.initialize() which:
   * - Computes PRD hash
   * - Searches for existing session with matching hash
   * - Loads existing session if found, or creates new session directory
   * - Returns SessionState with metadata and task registry
   *
   * After session initialization, creates TaskOrchestrator instance.
   */
  @Step({ trackTiming: true, snapshotState: true })
  async initializeSession(): Promise<void> {
    this.logger.info('[PRPPipeline] Initializing session');

    try {
      // Initialize session manager (detects new vs existing)
      const session = await this.sessionManager.initialize();

      this.logger.info(`[PRPPipeline] Session: ${session.metadata.id}`);
      this.logger.info(`[PRPPipeline] Path: ${session.metadata.path}`);
      this.logger.info(
        `[PRPPipeline] Existing: ${session.taskRegistry.backlog.length > 0}`
      );

      // Create TaskOrchestrator now that session is initialized
      this.taskOrchestrator = new TaskOrchestratorClass(
        this.sessionManager,
        this.#scope
      );

      // Update phase
      this.currentPhase = 'session_initialized';

      this.logger.info('[PRPPipeline] Session initialized successfully');
    } catch (error) {
      this.logger.error(
        `[PRPPipeline] Session initialization failed: ${error}`
      );
      throw error;
    }
  }

  /**
   * Decompose PRD into task backlog
   *
   * @remarks
   * For new sessions (empty backlog), uses Architect agent to generate
   * task hierarchy from PRD content. For existing sessions, skips generation.
   *
   * Generated backlog is saved via SessionManager.saveBacklog().
   */
  @Step({ trackTiming: true })
  async decomposePRD(): Promise<void> {
    this.logger.info('[PRPPipeline] Decomposing PRD');

    try {
      // Check if backlog already exists (existing session)
      const backlog = this.sessionManager.currentSession?.taskRegistry;
      const hasBacklog = backlog && backlog.backlog.length > 0;

      if (hasBacklog) {
        this.logger.info(
          '[PRPPipeline] Existing backlog found, skipping generation'
        );
        this.totalTasks = this.#countTasks();
        this.currentPhase = 'prd_decomposed';
        return;
      }

      this.logger.info(
        '[PRPPipeline] New session, generating backlog from PRD'
      );

      // Import agent factory dynamically
      const { createArchitectAgent } =
        await import('../agents/agent-factory.js');
      const { createArchitectPrompt } = await import('../agents/prompts.js');

      // Create Architect agent
      const architectAgent = createArchitectAgent();

      // Get PRD content from session snapshot
      const prdContent = this.sessionManager.currentSession?.prdSnapshot ?? '';

      // Create prompt
      const architectPrompt = createArchitectPrompt(prdContent);

      // Generate backlog
      this.logger.info('[PRPPipeline] Calling Architect agent...');
      const result = await architectAgent.prompt(architectPrompt);

      // Save backlog
      await this.sessionManager.saveBacklog(result.backlog);

      // Update task counts
      this.totalTasks = this.#countTasks();

      // Log summary
      const phaseCount = result.backlog.backlog.length;
      this.logger.info(`[PRPPipeline] Generated ${phaseCount} phases`);
      this.logger.info(`[PRPPipeline] Total tasks: ${this.totalTasks}`);

      this.currentPhase = 'prd_decomposed';
      this.logger.info('[PRPPipeline] PRD decomposition complete');
    } catch (error) {
      this.logger.error(`[PRPPipeline] PRD decomposition failed: ${error}`);
      throw error;
    }
  }

  /**
   * Execute backlog until complete
   *
   * @remarks
   * Iterates through backlog by calling TaskOrchestrator.processNextItem()
   * until it returns false (queue empty). Updates completedTasks count
   * after each item for observability.
   *
   * NOTE: TaskOrchestrator.executeSubtask() is currently a placeholder.
   * Future: Will integrate PRPRuntime for actual PRP execution.
   */
  @Step({ trackTiming: true })
  async executeBacklog(): Promise<void> {
    this.logger.info('[PRPPipeline] Executing backlog');

    try {
      let iterations = 0;
      const maxIterations = 10000; // Safety limit

      // Process items until queue is empty
      while (await this.taskOrchestrator.processNextItem()) {
        iterations++;

        // Safety check
        if (iterations > maxIterations) {
          throw new Error(`Execution exceeded ${maxIterations} iterations`);
        }

        // Update completed tasks count
        this.completedTasks = this.#countCompletedTasks();

        // Log progress every 10 items
        if (iterations % 10 === 0) {
          this.logger.info(
            `[PRPPipeline] Processed ${iterations} items, ${this.completedTasks}/${this.totalTasks} tasks complete`
          );
        }
      }

      this.logger.info(`[PRPPipeline] Processed ${iterations} items total`);

      // Final counts
      this.completedTasks = this.#countCompletedTasks();
      const failedTasks = this.#countFailedTasks();

      this.logger.info(`[PRPPipeline] Complete: ${this.completedTasks}`);
      this.logger.info(`[PRPPipeline] Failed: ${failedTasks}`);

      this.currentPhase = 'backlog_complete';
      this.logger.info('[PRPPipeline] Backlog execution complete');
    } catch (error) {
      this.logger.error(`[PRPPipeline] Backlog execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * Run QA bug hunt cycle
   *
   * @remarks
   * If all tasks are Complete (no Failed or Planned), runs QA agent
   * to perform bug hunt. Currently logs intent - actual QA integration
   * is in P4.M3.
   */
  @Step({ trackTiming: true })
  async runQACycle(): Promise<void> {
    this.logger.info('[PRPPipeline] QA Cycle');

    try {
      // Check if all tasks are complete
      if (!this.#allTasksComplete()) {
        const failedCount = this.#countFailedTasks();
        const plannedCount =
          this.totalTasks - this.completedTasks - failedCount;

        this.logger.info('[PRPPipeline] Not all tasks complete, skipping QA');
        this.logger.info(
          `[PRPPipeline] Failed: ${failedCount}, Planned: ${plannedCount}`
        );

        this.#bugsFound = 0;
        this.currentPhase = 'qa_skipped';
        return;
      }

      this.logger.info('[PRPPipeline] All tasks complete, running QA bug hunt');

      // TODO: Integrate QA agent (P4.M3.T1)
      // For now, just log and continue
      this.logger.info('[PRPPipeline] QA integration pending (P4.M3.T1)');

      this.#bugsFound = 0;

      this.currentPhase = 'qa_complete';
      this.logger.info('[PRPPipeline] QA cycle complete');
    } catch (error) {
      // QA failure is non-fatal - log and continue
      this.logger.warn(`[PRPPipeline] QA cycle failed (non-fatal): ${error}`);
      this.#bugsFound = 0;
    }
  }

  // ========================================================================
  // Main Entry Point
  // ========================================================================

  /**
   * Run the complete PRP Pipeline workflow
   *
   * @remarks
   * Orchestrates all steps in sequence:
   * 1. Initialize session
   * 2. Decompose PRD (if new session)
   * 3. Execute backlog
   * 4. Run QA cycle
   *
   * Returns PipelineResult with execution summary.
   *
   * @returns Pipeline execution result with summary
   */
  async run(): Promise<PipelineResult> {
    this.#startTime = performance.now();
    this.setStatus('running');

    this.logger.info('[PRPPipeline] Starting PRP Pipeline workflow');
    this.logger.info(`[PRPPipeline] PRD: ${this.#prdPath}`);
    this.logger.info(
      `[PRPPipeline] Scope: ${JSON.stringify(this.#scope ?? 'all')}`
    );

    try {
      // Execute workflow steps
      await this.initializeSession();
      await this.decomposePRD();
      await this.executeBacklog();
      await this.runQACycle();

      this.setStatus('completed');

      const duration = performance.now() - this.#startTime;
      const sessionPath =
        this.sessionManager.currentSession?.metadata.path ?? '';

      this.logger.info('[PRPPipeline] Workflow completed successfully');
      this.logger.info(`[PRPPipeline] Duration: ${duration.toFixed(0)}ms`);

      return {
        success: true,
        sessionPath,
        totalTasks: this.totalTasks,
        completedTasks: this.completedTasks,
        failedTasks: this.#countFailedTasks(),
        finalPhase: this.currentPhase,
        duration,
        phases: this.#summarizePhases(),
        bugsFound: this.#bugsFound,
      };
    } catch (error) {
      this.setStatus('failed');

      const duration = performance.now() - this.#startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`[PRPPipeline] Workflow failed: ${errorMessage}`);

      return {
        success: false,
        sessionPath: this.sessionManager.currentSession?.metadata.path ?? '',
        totalTasks: this.totalTasks,
        completedTasks: this.completedTasks,
        failedTasks: this.#countFailedTasks(),
        finalPhase: this.currentPhase,
        duration,
        phases: [],
        bugsFound: this.#bugsFound,
        error: errorMessage,
      };
    }
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Counts total subtasks in backlog
   */
  #countTasks(): number {
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) return 0;

    let count = 0;
    for (const phase of backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          count += task.subtasks.length;
        }
      }
    }
    return count;
  }

  /**
   * Counts completed subtasks
   */
  #countCompletedTasks(): number {
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) return 0;

    let count = 0;
    for (const phase of backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          count += task.subtasks.filter(s => s.status === 'Complete').length;
        }
      }
    }
    return count;
  }

  /**
   * Counts failed subtasks
   */
  #countFailedTasks(): number {
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) return 0;

    let count = 0;
    for (const phase of backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          count += task.subtasks.filter(s => s.status === 'Failed').length;
        }
      }
    }
    return count;
  }

  /**
   * Checks if all tasks are complete
   */
  #allTasksComplete(): boolean {
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) return false;

    for (const phase of backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          for (const subtask of task.subtasks) {
            if (subtask.status !== 'Complete') {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  /**
   * Builds phase summary array
   */
  #summarizePhases(): PhaseSummary[] {
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) return [];

    return backlog.backlog.map(phase => ({
      id: phase.id,
      title: phase.title,
      status: phase.status,
      totalMilestones: phase.milestones.length,
      completedMilestones: phase.milestones.filter(m => m.status === 'Complete')
        .length,
    }));
  }
}
````

### Integration Points

```yaml
SESSION_MANAGER:
  - import: SessionManager from '../core/session-manager.js'
  - usage: new SessionManager(prdPath)
  - method: await sessionManager.initialize()
  - property: sessionManager.currentSession.taskRegistry.backlog[]
  - method: await sessionManager.saveBacklog(backlog)

TASK_ORCHESTRATOR:
  - import: TaskOrchestrator from '../core/task-orchestrator.js'
  - usage: new TaskOrchestrator(sessionManager, scope)
  - method: await orchestrator.processNextItem()
  - returns: boolean (true while items remain)

AGENT_FACTORY:
  - import: createArchitectAgent from '../agents/agent-factory.js'
  - import: createArchitectPrompt from '../agents/prompts.js'
  - usage: const agent = createArchitectAgent()
  - method: await agent.prompt(createArchitectPrompt(prdContent))
  - returns: { backlog: Backlog }

GROUNDSWELL_WORKFLOW:
  - import: Workflow, Step, ObservedState from 'groundswell'
  - extends: class PRPPipeline extends Workflow
  - decorator: @ObservedState() on fields
  - decorator: @Step({ trackTiming: true }) on methods
  - method: this.setStatus('running' | 'completed' | 'failed')
  - method: this.logger.info() / logger.error()
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- src/workflows/prp-pipeline.ts     # ESLint with auto-fix
npm run format -- src/workflows/prp-pipeline.ts   # Prettier formatting
npm run check -- src/workflows/prp-pipeline.ts    # TypeScript type checking

# Project-wide validation
npm run lint    # Check all files
npm run format  # Format all files
npm run check   # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test PRPPipeline specifically
npm test -- tests/unit/workflows/prp-pipeline.test.ts

# Run with coverage
npm test -- --coverage tests/unit/workflows/prp-pipeline.test.ts

# Full test suite for workflows
npm test -- tests/unit/workflows/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests
npm test -- tests/integration/prp-pipeline-integration.test.ts

# Test full workflow with mocked agent calls
npm test -- tests/integration/prp-pipeline-integration.test.ts -t "should run complete workflow"

# Expected: PRPPipeline runs through all phases, returns valid PipelineResult
```

### Level 4: Manual Execution Validation

```bash
# Create test PRD
cat > /tmp/test-prd.md << 'EOF'
# Test PRD

## P1: Phase 1
### P1.M1: Milestone 1
#### P1.M1.T1: Task 1
##### P1.M1.T1.S1: Subtask 1
Test subtask implementation
EOF

# Run pipeline (if CLI entry point exists)
npm run pipeline -- /tmp/test-prd.md

# Or import and run directly
node -e "
const { PRPPipeline } = require('./dist/workflows/prp-pipeline.js');
const pipeline = new PRPPipeline('/tmp/test-prd.md');
pipeline.run().then(r => console.log(r));
"

# Verify session directory created
ls -la plan/001_*/

# Verify tasks.json generated
cat plan/001_*/tasks.json | jq .

# Expected: Pipeline completes, session directory exists, tasks.json has backlog
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] `PRPPipeline` class created in `src/workflows/prp-pipeline.ts`
- [ ] Extends Groundswell `Workflow` class
- [ ] Constructor accepts prdPath and optional scope
- [ ] `@ObservedState()` on sessionManager, taskOrchestrator, runtime, currentPhase, totalTasks, completedTasks
- [ ] `@Step({ trackTiming: true, snapshotState: true })` on initializeSession
- [ ] `@Step({ trackTiming: true })` on decomposePRD, executeBacklog, runQACycle
- [ ] `initializeSession()` calls SessionManager.initialize()
- [ ] `decomposePRD()` checks backlog and calls Architect agent if empty
- [ ] `executeBacklog()` loops while processNextItem() returns true
- [ ] `runQACycle()` checks all tasks complete before running QA
- [ ] `run()` orchestrates all steps, returns PipelineResult
- [ ] PipelineResult includes all required fields
- [ ] Unit tests for each @Step method
- [ ] Integration test for full workflow

### Code Quality Validation

- [ ] Follows hello-world.ts pattern (super() call, setStatus(), logger)
- [ ] File placement matches desired codebase tree structure
- [ ] Uses `.js` extensions for ES module imports
- [ ] `@ObservedState()` decorators on field declarations
- [ ] `@Step()` decorators on method declarations
- [ ] Private fields use `#` prefix
- [ ] Proper error handling with try/catch in each @Step
- [ ] Console logging via this.logger.info() / logger.error()
- [ ] Performance timing with performance.now()

### Documentation & Deployment

- [ ] Comprehensive JSDoc comments on class and all public methods
- [ ] Module-level JSDoc explains purpose and usage
- [ ] Example usage in JSDoc @example blocks
- [ ] PipelineResult interface documented
- [ ] PhaseSummary interface documented

---

## Anti-Patterns to Avoid

- ❌ Don't forget to call `super('PRPPipeline')` in constructor - Workflow base class requires it
- ❌ Don't use `.ts` extensions in imports - ES modules require `.js`
- ❌ Don't skip `@ObservedState()` decorator - fields won't be tracked
- ❌ Don't skip `@Step()` decorator - methods won't have timing/snapshots
- ❌ Don't call `this.taskOrchestrator = new TaskOrchestrator()` in constructor - session not initialized yet
- ❌ Don't assume backlog is always empty - check for existing sessions
- ❌ Don't call `executeSubtask()` directly - it's a placeholder, use `processNextItem()`
- ❌ Don't forget to update `@ObservedState` fields - state changes need to be tracked
- ❌ Don't use `console.log()` - use `this.logger.info()` for workflow logging
- ❌ Don't throw generic errors - use descriptive error messages with context
- ❌ Don't skip error handling in @Step methods - wrap in try/catch
- ❌ Don't forget to return `PipelineResult` from `run()` - caller needs summary
- ❌ Don't hardcode `10000` as max iterations without comment - explain safety limit
- ❌ Don't create TaskOrchestrator before session initialization - needs session state
- ❌ Don't access `this.sessionManager.currentSession` without null check
