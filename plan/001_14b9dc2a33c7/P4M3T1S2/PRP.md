# Product Requirement Prompt (PRP): Fix Cycle Workflow for Bug Resolution

**Work Item**: P4.M3.T1.S2 - Implement fix cycle for bugs
**Status**: Research Complete → Ready for Implementation
**Dependency**: P4.M3.T1.S1 (BugHuntWorkflow) - Complete

---

## Goal

**Feature Goal**: Create `FixCycleWorkflow` class that orchestrates an iterative bug fixing cycle (Fix → Re-test) until no critical or major bugs remain, or max iterations (3) are reached.

**Deliverable**: `src/workflows/fix-cycle-workflow.ts` containing:

- `FixCycleWorkflow` class extending `Workflow` from Groundswell
- `@ObservedState` decorated properties for test results, iteration tracking, PRD content, orchestrator, session manager
- `@Step` decorated methods: `createFixTasks()`, `executeFixes()`, `retest()`, `checkComplete()`
- `run()` method with async while loop (max 3 iterations) that orchestrates the full fix cycle
- Integration with `TaskOrchestrator` for executing fix tasks via `PRPRuntime`
- Integration with `BugHuntWorkflow` for retesting after fixes
- Helper methods: `#extractCompletedTasks()`, `#createFixSubtask()`, `#logIterationSummary()`

**Success Definition**:

- `FixCycleWorkflow` class exists and extends `Workflow`
- Constructor accepts `TestResults`, `prdContent`, `TaskOrchestrator`, `SessionManager`
- All four `@Step` methods are implemented and callable
- `run()` method loops until complete or max iterations, returning final `TestResults`
- Fix tasks are created from bugs using proper ID format (`PFIX.M1.T{N}.S1`)
- Fixes are executed via `TaskOrchestrator.executeSubtask()` → `PRPRuntime.executeSubtask()`
- Retesting uses `BugHuntWorkflow.run()` with updated completed tasks
- Completion check returns `true` only if no critical or major bugs remain
- All tests pass (unit and integration)
- No regressions in existing workflow tests

## User Persona (if applicable)

**Target User**: PRPPipeline (internal orchestration layer)

**Use Case**: After `BugHuntWorkflow` detects bugs, the pipeline needs an automated fix cycle that:

1. Converts bugs to executable fix tasks
2. Executes fixes via the existing PRP runtime
3. Re-tests with BugHuntWorkflow
4. Iterates until bugs are resolved or max attempts reached

**User Journey**:

1. BugHuntWorkflow returns `TestResults` with `hasBugs: true`
2. PRPPipeline creates `FixCycleWorkflow` with test results, PRD content, orchestrator, and session manager
3. FixCycleWorkflow executes fix cycle loop (max 3 iterations):
   - **Iteration Start**: Log iteration number and remaining bugs
   - **Phase 1 (createFixTasks)**: Convert `TestResults.bugs[]` to fix subtasks with proper ID format
   - **Phase 2 (executeFixes)**: Execute each fix task via `TaskOrchestrator.executeSubtask()`
   - **Phase 3 (retest)**: Run `BugHuntWorkflow.run()` with updated completed tasks
   - **Phase 4 (checkComplete)**: Check if any critical/major bugs remain
   - **Loop Decision**: Break if complete, continue if bugs remain and under max iterations
4. FixCycleWorkflow returns final `TestResults` to pipeline
5. PRPPipeline writes `TEST_RESULTS.md` if bugs remain, or completes successfully

**Pain Points Addressed**:

- **Manual Fix Bottleneck**: Automated fix cycle reduces manual bug fixing overhead
- **Lost Bug Context**: Fix tasks carry full bug details (description, reproduction, location)
- **Incomplete Fix Verification**: Automatic retesting catches regressions and missed fixes
- **Fix Loop Complexity**: Simplified while-loop orchestration with clear termination conditions
- **Orchestration Consistency**: Uses same `TaskOrchestrator` and `PRPRuntime` as original tasks

## Why

- **Automated Bug Resolution**: Reduces manual intervention in QA fix cycle from days to hours
- **Fix Verification**: Each fix cycle iteration includes full QA retest to catch regressions
- **Structured Bug Fixing**: Bug-to-Subtask conversion provides standardized fix task format
- **Consistent Execution**: Reuses `TaskOrchestrator` and `PRPRuntime` for fix tasks
- **Groundswell Integration**: `@ObservedState` and `@Step` decorators provide observability
- **Graceful Degradation**: Continues on individual fix failures; retest phase catches remaining issues
- **Configurable Limits**: Max iterations (3) prevent infinite fix loops
- **Progress Visibility**: Detailed logging at each iteration provides clear progress tracking

## What

`FixCycleWorkflow` is a Groundswell workflow that orchestrates the bug fix cycle:

### Input

- `testResults: TestResults` - Initial test results from `BugHuntWorkflow` containing bug reports
- `prdContent: string` - Original PRD content for QA context
- `taskOrchestrator: TaskOrchestrator` - Task orchestrator for executing fix tasks
- `sessionManager: SessionManager` - Session manager for state persistence

### State

- `testResults: TestResults` - Initial test results (input)
- `iteration: number = 0` - Current iteration counter (starts at 0, increments each loop)
- `maxIterations: number = 3` - Maximum fix iterations (hardcoded, may be made configurable later)
- `currentResults: TestResults | null = null` - Latest test results from retest phase
- `fixTasks: Subtask[] = []` - Fix subtasks created from bugs

### Output

- `TestResults` - Final test results after fix cycle:
  - If all critical/major bugs fixed: `hasBugs: false` or only minor/cosmetic bugs
  - If max iterations reached: `hasBugs: true` with remaining bugs

### Success Criteria

- [ ] `FixCycleWorkflow` class exists at `src/workflows/fix-cycle-workflow.ts`
- [ ] Class extends `Workflow` from Groundswell framework
- [ ] Constructor accepts and stores `TestResults`, `prdContent`, `TaskOrchestrator`, `SessionManager`
- [ ] `@ObservedState` decorated properties: `testResults`, `iteration`, `maxIterations`, `currentResults`
- [ ] `@Step({ trackTiming: true })` methods: `createFixTasks`, `executeFixes`, `retest`, `checkComplete`
- [ ] `run()` method implements async while loop with max iteration guard
- [ ] Fix tasks created with proper ID format: `PFIX.M1.T{N}.S1`
- [ ] Fix tasks include bug details in `context_scope` (description, reproduction, location)
- [ ] Fixes executed via `taskOrchestrator.executeSubtask(fixTask)`
- [ ] Retest phase instantiates and runs `BugHuntWorkflow` with updated completed tasks
- [ ] Completion check returns `false` if any critical or major bugs remain
- [ ] Loop breaks when complete or max iterations reached
- [ ] Final `TestResults` returned on loop exit
- [ ] Progress logging at each iteration (bug count, iteration number)
- [ ] Error handling: individual fix failures logged but don't stop cycle
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No regressions in existing workflow tests

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: **YES** - This PRP provides:

- Complete workflow architecture with class structure
- Exact decorator patterns to use (`@ObservedState`, `@Step({ trackTiming: true })`)
- Fix task ID format template (`PFIX.M1.T{N}.S1`)
- Bug-to-Subtask field mappings
- Integration patterns for `TaskOrchestrator` and `BugHuntWorkflow`
- Loop structure with max iteration guard
- Progress logging patterns
- Error handling strategies
- Test strategies and examples

### Documentation & References

```yaml
# MUST READ - Groundswell Workflow Patterns
- file: /home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts
  why: Reference for @ObservedState and @Step decorator usage, Workflow extension pattern
  pattern: BugHuntWorkflow class structure (lines 1-303)
  gotcha: Use @ObservedState() for all public state fields, use @Step({ trackTiming: true }) for all step methods
  critical: BugHuntWorkflow.run() returns TestResults - this is the input to FixCycleWorkflow

# MUST READ - PRPPipeline Integration Pattern
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Reference for workflow composition pattern (one workflow calling another)
  pattern: DeltaAnalysisWorkflow integration (lines 308-353) and runQACycle() method (lines 564-599)
  gotcha: Follow the pattern: import → instantiate with constructor params → await workflow.run() → consume results
  critical: runQACycle() is where FixCycleWorkflow will be integrated (future work, not this PRP)

# MUST READ - TaskOrchestrator Execution
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Reference for how to execute fix subtasks via orchestrator
  pattern: executeSubtask() method (lines 574-733) - sets status, checks cache, calls PRPRuntime
  gotcha: TaskOrchestrator internally uses PRPRuntime - no need to access PRPRuntime directly
  critical: executeSubtask() expects Subtask object with proper ID format: /^P\d+\.M\d+\.T\d+\.S\d+$/

# MUST READ - PRPRuntime Execution Flow
- file: /home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts
  why: Understanding the inner loop that TaskOrchestrator.executeSubtask() triggers
  pattern: executeSubtask() method (lines 83-227) - Research → Implementation → Validation → Status Update
  gotcha: PRPRuntime requires TaskOrchestrator (cannot be instantiated standalone)
  critical: Fix tasks follow same flow: Research (PRP generation) → Implementation (PRP execution) → Validation gates

# MUST READ - Data Models
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Reference for TestResults, Bug, Subtask interfaces
  pattern: TestResults (lines 1683-1785), Bug (lines 1588-1649), Subtask (lines 149-211)
  gotcha: Bug has optional `location` field - handle gracefully if undefined
  critical: Subtask.id must match regex /^P\d+\.M\d+\.T\d+\.S\d+$/ (e.g., PFIX.M1.T001.S1)

# MUST READ - Loop Patterns
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Reference for async while loop with max iteration guard
  pattern: executeBacklog() method (lines 497-554) - iteration counter, safety check, periodic logging
  gotcha: Use post-increment check (if (iterations > maxIterations) throw) not pre-check
  critical: Log progress every N iterations (e.g., every iteration in fix cycle, since max is only 3)

# MUST READ - Bug to Task Conversion
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M3T1S2/research-bug-to-task-conversion.md
  why: Complete mapping from Bug fields to Subtask fields with ready-to-use conversion function
  pattern: createFixSubtasks() function (lines 300-390)
  gotcha: Use PFIX.M1.T{index}.S1 format for fix subtask IDs
  critical: context_scope is the MOST IMPORTANT field - must include full bug details

# MUST READ - Integration Points
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M3T1S2/research-integration-points.md
  why: Complete integration architecture for FixCycleWorkflow with PRPPipeline and BugHuntWorkflow
  pattern: FixCycleWorkflow architecture section (lines 379-615)
  gotcha: FixCycleWorkflow receives TaskOrchestrator, not PRPRuntime directly
  critical: Integration with PRPPipeline.runQACycle() is future work (P4.M3.T1.S3), not this PRP

# MUST READ - Loop Patterns Research
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M3T1S2/research-loop-patterns.md
  why: Complete async iteration patterns with max iteration guards and progress logging
  pattern: Recommended Patterns for Fix Cycle section (lines 1095-1312)
  gotcha: Use while (iteration < maxIterations) with pre-increment (iteration++ at start of loop)
  critical: Check shutdownRequested flag if implementing graceful shutdown (optional for fix cycle)
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json
├── tsconfig.json
├── src/
│   ├── core/
│   │   ├── models.ts                    # TestResults, Bug, Subtask, Task, Status interfaces
│   │   ├── session-manager.ts           # SessionManager class for state persistence
│   │   └── task-orchestrator.ts         # TaskOrchestrator class with executeSubtask()
│   ├── agents/
│   │   ├── agent-factory.ts             # createQAAgent() factory
│   │   ├── prp-runtime.ts               # PRPRuntime class (research→implementation flow)
│   │   └── prompts/
│   │       └── bug-hunt-prompt.ts       # createBugHuntPrompt() function
│   ├── workflows/
│   │   ├── delta-analysis-workflow.ts   # DeltaAnalysisWorkflow reference pattern
│   │   ├── bug-hunt-workflow.ts         # BugHuntWorkflow (dependency, already implemented)
│   │   ├── prp-pipeline.ts              # PRPPipeline with runQACycle() TODO (future integration)
│   │   └── index.ts                     # Workflow exports barrel
│   └── index.ts
├── tests/
│   ├── unit/
│   │   └── workflows/
│   └── integration/
└── plan/
    └── 001_14b9dc2a33c7/
        ├── P4M3T1S1/
        │   └── PRP.md                    # BugHuntWorkflow PRP (dependency)
        └── P4M3T1S2/
            ├── PRP.md                    # THIS FILE
            └── research-*.md             # Research documentation files
```

### Desired Codebase Tree (files to add)

```bash
src/workflows/
└── fix-cycle-workflow.ts                # NEW: FixCycleWorkflow class

tests/unit/workflows/
└── fix-cycle-workflow.test.ts           # NEW: Unit tests for FixCycleWorkflow

tests/integration/
└── fix-cycle-workflow-integration.test.ts # NEW: Integration tests for FixCycleWorkflow
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Groundswell @ObservedState decorator
// - Must be imported from 'groundswell'
// - Applied to public class properties
// - Automatically makes fields observable in monitoring tools
import { ObservedState } from 'groundswell';

// CRITICAL: Groundswell @Step decorator
// - Must be imported from 'groundswell'
// - Applied to async methods
// - trackTiming: true is required (100% usage in codebase)
import { Step } from 'groundswell';
@Step({ trackTiming: true })
async methodName(): Promise<ReturnType> { /* ... */ }

// CRITICAL: Workflow class extension
// - All workflows must extend Workflow from 'groundswell'
// - Constructor must call super('WorkflowName')
// - run() method must orchestrate @Step methods
import { Workflow } from 'groundswell';
export class FixCycleWorkflow extends Workflow {
  constructor() {
    super('FixCycleWorkflow');
  }
}

// CRITICAL: Subtask ID format
// - Must match regex: /^P\d+\.M\d+\.T\d+\.S\d+$/
// - Examples: P1.M2.T3.S4, PFIX.M1.T001.S1
// - Fix tasks use: PFIX.M1.T{index}.S1 format
// - Invalid: FIX-BUG-001, P1.M2.T3, P1M2T3S4

// CRITICAL: Bug to Subtask field mapping
// - Bug.id → NOT directly used (use generated ID: PFIX.M1.T{index}.S1)
// - Bug.title → Subtask.title (prefix with "[BUG FIX]")
// - Bug.severity → Subtask.story_points (critical=13, major=8, minor=3, cosmetic=1)
// - Bug.all fields → Subtask.context_scope (construct detailed fix instructions)
// - Subtask.status → Hardcode to 'Planned'
// - Subtask.dependencies → Empty array [] (fix tasks are independent)

// CRITICAL: TaskOrchestrator usage
// - Access via public property (passed in constructor)
// - Call await taskOrchestrator.executeSubtask(subtask) for each fix task
// - Do NOT instantiate PRPRuntime directly (TaskOrchestrator has it internally)
// - executeSubtask() throws on failure - wrap in try/catch

// CRITICAL: BugHuntWorkflow instantiation
// - Import: import { BugHuntWorkflow } from './bug-hunt-workflow.js';
// - Constructor: new BugHuntWorkflow(prdContent, completedTasks)
// - Execution: await bugHuntWorkflow.run() returns TestResults
// - Completed tasks must be extracted from session backlog

// CRITICAL: Loop iteration pattern
// - Use while (iteration < maxIterations) with pre-increment
// - Increment at START of loop: iteration++
// - Log iteration number at start: this.logger.info(`Iteration ${iteration}/${maxIterations}`)
// - Check completion condition AFTER executing phases
// - Break loop when complete or max iterations reached

// CRITICAL: Completion check logic
// - Return true ONLY if no critical OR major bugs remain
// - Minor and cosmetic bugs are acceptable (return true)
// - Check: !bugs.some(b => b.severity === 'critical' || b.severity === 'major')

// CRITICAL: Error handling
// - Individual fix task failures: LOG and continue (don't fail entire cycle)
// - BugHuntWorkflow failures: Throw (retest phase failed)
// - Uncaught exceptions: Set status to 'failed' and rethrow
// - Use try/catch with descriptive error messages

// CRITICAL: Logger usage
// - Access via this.logger (inherited from Workflow base class)
// - Use structured logging: this.logger.info('[FixCycleWorkflow] Message', { metadata })
// - Log each phase start/completion
// - Log iteration progress

// CRITICAL: TypeScript this context
// - Private methods use # prefix (e.g., #extractCompletedTasks())
// - Access private methods via this.#methodName()
// - Private fields use # prefix (e.g., #fixTasks)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed - this workflow uses existing interfaces:

```typescript
// Existing interfaces from src/core/models.ts

// TestResults - BugHuntWorkflow output, FixCycleWorkflow input/output
interface TestResults {
  readonly hasBugs: boolean;
  readonly bugs: Bug[];
  readonly summary: string;
  readonly recommendations: string[];
}

// Bug - Individual bug report
interface Bug {
  readonly id: string;
  readonly severity: 'critical' | 'major' | 'minor' | 'cosmetic';
  readonly title: string;
  readonly description: string;
  readonly reproduction: string;
  readonly location?: string;
}

// Subtask - Fix task structure
interface Subtask {
  readonly id: string;
  readonly type: 'Subtask';
  readonly title: string;
  readonly status: Status;
  readonly story_points: number;
  readonly dependencies: string[];
  readonly context_scope: string;
}

// Task - Completed task extraction
interface Task {
  readonly id: string;
  readonly status: Status;
  // ... other fields
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/workflows/fix-cycle-workflow.ts
  - IMPLEMENT: FixCycleWorkflow class extending Workflow
  - IMPORT: Workflow, ObservedState, Step from 'groundswell'
  - IMPORT: TestResults, Bug, Task, Subtask, Status from '../core/models.js'
  - IMPORT: TaskOrchestrator from '../core/task-orchestrator.js'
  - IMPORT: SessionManager from '../core/session-manager.js'
  - DECLARE: @ObservedState() properties (testResults, prdContent, taskOrchestrator, sessionManager, iteration, maxIterations, currentResults)
  - IMPLEMENT: Constructor with validation
  - IMPLEMENT: run() method with while loop skeleton
  - NAMING: FixCycleWorkflow class name exactly as specified
  - PLACEMENT: src/workflows/fix-cycle-workflow.ts (new file)

Task 2: IMPLEMENT createFixTasks() @Step method
  - IMPLEMENT: @Step({ trackTiming: true }) createFixTasks(): Promise<void>
  - LOG: Start message with bug count
  - CONVERT: this.testResults.bugs[] to Subtask[] using #createFixSubtask()
  - STORE: fix tasks in this.fixTasks (private field: #fixTasks)
  - MAP: Bug.severity to story_points (critical=13, major=8, minor=3, cosmetic=1)
  - GENERATE: IDs using format PFIX.M1.T{index}.S1 (zero-padded index)
  - CONSTRUCT: context_scope with bug details (description, reproduction, location)
  - LOG: Completion message with fix task count
  - DEPENDENCIES: Task 1 (class structure)

Task 3: IMPLEMENT #createFixSubtask() helper method
  - IMPLEMENT: #createFixSubtask(bug: Bug, index: number): Subtask
  - GENERATE: ID using format `PFIX.M1.T${String(index + 1).padStart(3, '0')}.S1`
  - PREFIX: title with "[BUG FIX]" prefix
  - SET: status to 'Planned'
  - SET: dependencies to empty array []
  - SET: story_points based on bug.severity
  - CONSTRUCT: detailed context_scope including:
    - BUG REFERENCE section (ID, severity, title)
    - BUG DESCRIPTION section (full description)
    - REPRODUCTION STEPS section (step-by-step)
    - TARGET LOCATION section (if available)
    - FIX REQUIREMENTS section (INPUT/OUTPUT/MOCKING)
    - VALIDATION criteria (test the fix)
  - RETURN: Subtask object
  - DEPENDENCIES: Task 1

Task 4: IMPLEMENT executeFixes() @Step method
  - IMPLEMENT: @Step({ trackTiming: true }) executeFixes(): Promise<void>
  - LOG: Start message
  - GET: backlog from sessionManager.currentSession?.taskRegistry
  - ITERATE: for each fixTask in this.#fixTasks
  - TRY: await this.taskOrchestrator.executeSubtask(fixTask)
  - LOG: Success message for each completed fix
  - CATCH: Log error but continue with next fix (don't fail entire cycle)
  - TRACK: successCount and failureCount
  - LOG: Summary message with success/failure counts
  - DEPENDENCIES: Task 1, Task 2, Task 3

Task 5: IMPLEMENT retest() @Step method
  - IMPLEMENT: @Step({ trackTiming: true }) retest(): Promise<TestResults>
  - LOG: Start message
  - EXTRACT: completed tasks via #extractCompletedTasks()
  - LOG: Completed task count for context
  - INSTANTIATE: BugHuntWorkflow(prdContent, completedTasks)
  - EXECUTE: await bugHuntWorkflow.run()
  - STORE: results in this.currentResults
  - LOG: Results summary (bug count, summary)
  - RETURN: TestResults
  - DEPENDENCIES: Task 1, Task 6

Task 6: IMPLEMENT #extractCompletedTasks() helper method
  - IMPLEMENT: #extractCompletedTasks(): Task[]
  - GET: backlog from this.sessionManager.currentSession?.taskRegistry
  - GUARD: Return [] if no backlog
  - ITERATE: nested for loops (phase → milestone → task)
  - FILTER: tasks where status === 'Complete'
  - ACCUMULATE: into completedTasks array
  - RETURN: completedTasks array
  - DEPENDENCIES: Task 1

Task 7: IMPLEMENT checkComplete() @Step method
  - IMPLEMENT: @Step({ trackTiming: true }) checkComplete(): Promise<boolean>
  - GUARD: Return false if this.currentResults is null
  - CHECK: if any bug has severity 'critical' or 'major'
  - LOG: Completion check result
  - RETURN: true if NO critical or major bugs, false otherwise
  - DEPENDENCIES: Task 1

Task 8: IMPLEMENT run() method loop logic
  - IMPLEMENT: async run(): Promise<TestResults>
  - CALL: this.setStatus('running') at start
  - LOG: Start message
  - TRY: while (this.iteration < this.maxIterations)
    - INCREMENT: this.iteration++ at start of loop
    - LOG: Iteration start message (iteration/maxIterations)
    - AWAIT: this.createFixTasks()
    - AWAIT: this.executeFixes()
    - AWAIT: this.retest() - store results
    - AWAIT: this.checkComplete() - store complete flag
    - CHECK: if (complete) break and log success
    - LOG: Iteration complete message with remaining bug count
  - AFTER LOOP: Check if max iterations reached, log warning
  - CALL: this.setStatus('completed') before return
  - RETURN: this.currentResults! (non-null assertion)
  - CATCH: Set status to 'failed', log error, rethrow
  - DEPENDENCIES: Tasks 1-7

Task 9: ADD import for BugHuntWorkflow
  - ADD: import { BugHuntWorkflow } from './bug-hunt-workflow.js';
  - PLACEMENT: Top of src/workflows/fix-cycle-workflow.ts
  - DEPENDENCIES: Task 1

Task 10: UPDATE src/workflows/index.ts
  - ADD: export { FixCycleWorkflow } from './fix-cycle-workflow.js';
  - PLACEMENT: In barrel export file src/workflows/index.ts
  - PRESERVE: All existing exports
  - DEPENDENCIES: Task 1
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// FILE: src/workflows/fix-cycle-workflow.ts
// =============================================================================

// ----------------------------------------------------------------------------
// Imports
// ----------------------------------------------------------------------------

import { Workflow, ObservedState, Step } from 'groundswell';
import type {
  TestResults,
  Bug,
  Task,
  Subtask,
  Status,
} from '../core/models.js';
import { TaskOrchestrator } from '../core/task-orchestrator.js';
import { SessionManager } from '../core/session-manager.js';
import { BugHuntWorkflow } from './bug-hunt-workflow.js';

// ----------------------------------------------------------------------------
// FixCycleWorkflow Class
// ----------------------------------------------------------------------------

export class FixCycleWorkflow extends Workflow {
  // ==========================================================================
  // Public Observed State Fields
  // ==========================================================================

  /** Initial test results from BugHuntWorkflow */
  @ObservedState()
  testResults: TestResults;

  /** Original PRD content for QA context */
  @ObservedState()
  prdContent: string;

  /** Task orchestrator for executing fix tasks */
  @ObservedState()
  taskOrchestrator: TaskOrchestrator;

  /** Session manager for state persistence */
  @ObservedState()
  sessionManager: SessionManager;

  /** Current iteration counter (starts at 0, increments each loop) */
  @ObservedState()
  iteration: number = 0;

  /** Maximum fix iterations (hardcoded to 3 per specification) */
  @ObservedState()
  maxIterations: number = 3;

  /** Latest test results from retest phase */
  @ObservedState()
  currentResults: TestResults | null = null;

  // ==========================================================================
  // Private Fields
  // ==========================================================================

  /** Fix subtasks created from bugs */
  #fixTasks: Subtask[] = [];

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Creates a new FixCycleWorkflow instance
   *
   * @param testResults - Initial test results from BugHuntWorkflow containing bug reports
   * @param prdContent - Original PRD content for QA context
   * @param taskOrchestrator - Task orchestrator for executing fix tasks
   * @param sessionManager - Session manager for state persistence
   * @throws {Error} If testResults is missing bugs array
   */
  constructor(
    testResults: TestResults,
    prdContent: string,
    taskOrchestrator: TaskOrchestrator,
    sessionManager: SessionManager
  ) {
    super('FixCycleWorkflow');

    // Validate inputs
    if (!testResults.bugs || testResults.bugs.length === 0) {
      throw new Error('FixCycleWorkflow requires testResults with bugs to fix');
    }

    this.testResults = testResults;
    this.prdContent = prdContent;
    this.taskOrchestrator = taskOrchestrator;
    this.sessionManager = sessionManager;
  }

  // ==========================================================================
  // Phase 1: Create Fix Tasks
  // ==========================================================================

  /**
   * Phase 1: Create fix tasks from bugs
   *
   * Converts each bug in testResults.bugs into a subtask-like fix task.
   * Stores fix tasks for execution in executeFixes().
   */
  @Step({ trackTiming: true })
  async createFixTasks(): Promise<void> {
    this.logger.info('[FixCycleWorkflow] Creating fix tasks from bugs');
    this.logger.info(
      `[FixCycleWorkflow] Processing ${this.testResults.bugs.length} bugs`
    );

    // Convert bugs to fix subtasks
    this.#fixTasks = this.testResults.bugs.map((bug, index) =>
      this.#createFixSubtask(bug, index)
    );

    this.logger.info(
      `[FixCycleWorkflow] Created ${this.#fixTasks.length} fix tasks`
    );
  }

  // ==========================================================================
  // Phase 2: Execute Fixes
  // ==========================================================================

  /**
   * Phase 2: Execute fixes via PRPRuntime
   *
   * Executes all fix tasks using TaskOrchestrator (which internally uses PRPRuntime).
   * Handles failures gracefully - logs error but continues with next fix.
   */
  @Step({ trackTiming: true })
  async executeFixes(): Promise<void> {
    this.logger.info('[FixCycleWorkflow] Executing fixes');

    let successCount = 0;
    let failureCount = 0;

    for (const fixTask of this.#fixTasks) {
      this.logger.info(
        `[FixCycleWorkflow] Executing fix task: ${fixTask.id} - ${fixTask.title}`
      );

      try {
        await this.taskOrchestrator.executeSubtask(fixTask);
        successCount++;
        this.logger.info(
          `[FixCycleWorkflow] Fix task ${fixTask.id} completed successfully`
        );
      } catch (error) {
        failureCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `[FixCycleWorkflow] Fix task ${fixTask.id} failed: ${errorMessage}`
        );
        // Don't throw - continue with next fix
        // The retest phase will catch remaining bugs
      }
    }

    this.logger.info('[FixCycleWorkflow] Fixes execution complete', {
      success: successCount,
      failed: failureCount,
      total: this.#fixTasks.length,
    });
  }

  // ==========================================================================
  // Phase 3: Re-test
  // ==========================================================================

  /**
   * Phase 3: Re-test with BugHuntWorkflow
   *
   * Runs BugHuntWorkflow again to verify fixes.
   * Returns new TestResults with remaining bugs.
   */
  @Step({ trackTiming: true })
  async retest(): Promise<TestResults> {
    this.logger.info('[FixCycleWorkflow] Re-testing after fixes');

    // Extract completed tasks from session
    const completedTasks = this.#extractCompletedTasks();
    this.logger.info(
      `[FixCycleWorkflow] Testing against ${completedTasks.length} completed tasks`
    );

    // Run BugHuntWorkflow
    const bugHuntWorkflow = new BugHuntWorkflow(
      this.prdContent,
      completedTasks
    );
    const results = await bugHuntWorkflow.run();

    // Store results
    this.currentResults = results;

    // Log results
    this.logger.info('[FixCycleWorkflow] Re-test complete', {
      bugsFound: results.bugs.length,
      hasBugs: results.hasBugs,
      summary: results.summary,
    });

    return results;
  }

  // ==========================================================================
  // Phase 4: Check Completion
  // ==========================================================================

  /**
   * Phase 4: Check completion
   *
   * Returns true if no critical or major bugs remain.
   * Minor and cosmetic bugs are acceptable.
   */
  @Step({ trackTiming: true })
  async checkComplete(): Promise<boolean> {
    if (!this.currentResults) {
      return false;
    }

    const hasCriticalOrMajor = this.currentResults.bugs.some(
      bug => bug.severity === 'critical' || bug.severity === 'major'
    );

    this.logger.info('[FixCycleWorkflow] Completion check', {
      complete: !hasCriticalOrMajor,
      criticalOrMajorBugs: this.currentResults.bugs.filter(
        b => b.severity === 'critical' || b.severity === 'major'
      ).length,
    });

    return !hasCriticalOrMajor;
  }

  // ==========================================================================
  // Main Fix Cycle Loop
  // ==========================================================================

  /**
   * Run the complete fix cycle workflow
   *
   * Loops until:
   * - No critical/major bugs remain, OR
   * - Max iterations (3) reached
   *
   * @returns Final TestResults after fix cycle
   */
  async run(): Promise<TestResults> {
    this.setStatus('running');
    this.logger.info('[FixCycleWorkflow] Starting fix cycle workflow');
    this.logger.info(
      `[FixCycleWorkflow] Initial bug count: ${this.testResults.bugs.length}`
    );

    try {
      while (this.iteration < this.maxIterations) {
        // Increment iteration counter
        this.iteration++;

        this.logger.info(
          `[FixCycleWorkflow] ========== Iteration ${this.iteration}/${this.maxIterations} ==========`
        );

        // Phase 1: Create fix tasks
        await this.createFixTasks();

        // Phase 2: Execute fixes
        await this.executeFixes();

        // Phase 3: Re-test
        await this.retest();

        // Phase 4: Check completion
        const complete = await this.checkComplete();

        if (complete) {
          this.logger.info(
            '[FixCycleWorkflow] All critical/major bugs resolved - fix cycle complete'
          );
          break;
        }

        this.logger.info(
          `[FixCycleWorkflow] Iteration ${this.iteration} complete - ${this.currentResults?.bugs.length ?? 0} bugs remain`
        );
      }

      // Check if max iterations reached
      if (
        (this.iteration >= this.maxIterations &&
          this.currentResults?.bugs.length) ??
        0 > 0
      ) {
        this.logger.warn(
          `[FixCycleWorkflow] Max iterations (${this.maxIterations}) reached`
        );
        this.logger.warn(
          `[FixCycleWorkflow] ${this.currentResults?.bugs.length ?? 0} bugs remaining`
        );
      }

      this.setStatus('completed');

      // Return final results
      return this.currentResults ?? this.testResults;
    } catch (error) {
      this.setStatus('failed');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[FixCycleWorkflow] Fix cycle failed: ${errorMessage}`);
      throw error;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Extract completed tasks from session backlog
   *
   * @returns Array of completed Task objects
   * @private
   */
  #extractCompletedTasks(): Task[] {
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) {
      this.logger.warn('[FixCycleWorkflow] No session backlog found');
      return [];
    }

    const completedTasks: Task[] = [];

    for (const phase of backlog.backlog) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          if (task.status === 'Complete') {
            completedTasks.push(task);
          }
        }
      }
    }

    return completedTasks;
  }

  /**
   * Create a fix subtask from a bug report
   *
   * @param bug - Bug report to convert
   * @param index - Bug index for ID generation
   * @returns Subtask object representing the fix task
   * @private
   */
  #createFixSubtask(bug: Bug, index: number): Subtask {
    // Generate ID: PFIX.M1.T{index}.S1 (zero-padded)
    const taskId = String(index + 1).padStart(3, '0');
    const id = `PFIX.M1.T${taskId}.S1`;

    // Map severity to story points
    const severityToPoints: Record<Bug['severity'], number> = {
      critical: 13,
      major: 8,
      minor: 3,
      cosmetic: 1,
    };

    // Construct context_scope with all bug details
    const contextScope = `
# BUG REFERENCE
Bug ID: ${bug.id}
Severity: ${bug.severity}
Title: ${bug.title}

# BUG DESCRIPTION
${bug.description}

# REPRODUCTION STEPS
${bug.reproduction}

# TARGET LOCATION
${bug.location ?? 'Not specified'}

# FIX REQUIREMENTS
INPUT: Current implementation at target location
OUTPUT: Fixed implementation that addresses the bug
MOCKING: None (real execution context)

# VALIDATION CRITERIA
1. Bug no longer reproduces following reproduction steps
2. No regressions in related functionality
3. Code follows existing patterns in the file
4. Changes are minimal and focused on the bug fix
    `.trim();

    return {
      id,
      type: 'Subtask',
      title: `[BUG FIX] ${bug.title}`,
      status: 'Planned',
      story_points: severityToPoints[bug.severity],
      dependencies: [], // Fix tasks are independent
      context_scope: contextScope,
    };
  }
}
```

### Integration Points

```yaml
PRPPipeline Integration (Future Work - P4.M3.T1.S3):
  - modify: src/workflows/prp-pipeline.ts
  - method: runQACycle() (lines 564-599)
  - pattern: |
      1. Run BugHuntWorkflow
      2. If testResults.hasBugs, instantiate FixCycleWorkflow
      3. Call await fixCycleWorkflow.run()
      4. If final bugs remain, write TEST_RESULTS.md
  - NOT PART OF THIS PRP - This is P4.M3.T1.S3 work

TaskOrchestrator Usage:
  - call: this.taskOrchestrator.executeSubtask(fixTask)
  - method: src/core/task-orchestrator.ts lines 574-733
  - flow: setStatus → checkCache → PRPRuntime.executeSubtask → setStatus → smartCommit
  - error: Throws on failure - wrap in try/catch

BugHuntWorkflow Usage:
  - import: import { BugHuntWorkflow } from './bug-hunt-workflow.js'
  - instantiate: new BugHuntWorkflow(prdContent, completedTasks)
  - execute: await bugHuntWorkflow.run()
  - returns: TestResults

SessionManager Usage:
  - property: this.sessionManager.currentSession?.taskRegistry
  - access: Backlog object with nested phases/milestones/tasks
  - pattern: Iterate and filter by status === 'Complete'

Workflow Exports:
  - modify: src/workflows/index.ts
  - add: export { FixCycleWorkflow } from './fix-cycle-workflow.js';
  - preserve: All existing exports
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint src/workflows/fix-cycle-workflow.ts --fix     # Auto-format and fix linting issues
npx tsc --noEmit                                         # Type checking

# Project-wide validation
npm run lint                                            # Check all files
npm run typecheck                                       # Check all types
npm run format                                          # Format all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test FixCycleWorkflow class
npm test -- src/workflows/fix-cycle-workflow.test.ts     # Unit tests for FixCycleWorkflow

# Test all workflows
npm test -- tests/unit/workflows/                       # All workflow unit tests

# Coverage validation (if coverage tools available)
npm run test:coverage                                    # Full coverage report

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test FixCycleWorkflow integration with TaskOrchestrator and BugHuntWorkflow
npm test -- tests/integration/fix-cycle-workflow-integration.test.ts

# Full integration test suite
npm run test:integration

# Expected: All integrations working, proper TestResults returned, no errors
```

### Level 4: Manual & End-to-End Validation

```bash
# Manual workflow testing (requires test session)
# 1. Create test PRD with known bugs
# 2. Run PRPPipeline to completion
# 3. Verify BugHuntWorkflow detects bugs
# 4. Verify FixCycleWorkflow is instantiated (if integrated in P4.M3.T1.S3)
# 5. Verify fix tasks are created with proper IDs
# 6. Verify fixes are executed via TaskOrchestrator
# 7. Verify retest runs BugHuntWorkflow again
# 8. Verify loop terminates when complete or max iterations reached

# Expected: All phases execute successfully, bugs are fixed or reported
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format --check`

### Feature Validation

- [ ] `FixCycleWorkflow` class exists at `src/workflows/fix-cycle-workflow.ts`
- [ ] Class extends `Workflow` from Groundswell
- [ ] Constructor accepts `TestResults`, `prdContent`, `TaskOrchestrator`, `SessionManager`
- [ ] All `@ObservedState` properties properly decorated
- [ ] All `@Step({ trackTiming: true })` methods implemented
- [ ] `run()` method implements while loop with max iteration guard
- [ ] Fix tasks created with proper ID format (`PFIX.M1.T{N}.S1`)
- [ ] Fix tasks include bug details in `context_scope`
- [ ] Fixes executed via `taskOrchestrator.executeSubtask()`
- [ ] Retest phase uses `BugHuntWorkflow.run()`
- [ ] Completion check returns `false` for critical/major bugs
- [ ] Loop breaks when complete or max iterations reached
- [ ] Final `TestResults` returned
- [ ] Progress logging at each iteration
- [ ] Error handling for individual fix failures

### Code Quality Validation

- [ ] Follows BugHuntWorkflow pattern for `@ObservedState` and `@Step` usage
- [ ] Follows PRPPipeline loop pattern (iteration counter, max guard, logging)
- [ ] Fix tasks use proper ID format matching SubtaskSchema regex
- [ ] Bug-to-Subtask mapping follows severity to story_points convention
- [ ] context_scope includes all bug details (description, reproduction, location)
- [ ] Private methods use `#` prefix convention
- [ ] JSDoc comments on class and all public methods
- [ ] Anti-patterns avoided (no sync in async context, no broad exception catches)

### Integration Validation

- [ ] `BugHuntWorkflow` import present and correct
- [ ] `TaskOrchestrator` used via constructor parameter (not instantiated)
- [ ] `SessionManager` used for backlog access (not instantiated)
- [ ] Export added to `src/workflows/index.ts`
- [ ] No regressions in existing workflow tests
- [ ] No modifications to existing workflow files

---

## Anti-Patterns to Avoid

- ❌ Don't create fix task IDs that don't match `/^P\d+\.M\d+\.T\d+\.S\d+$/` regex
- ❌ Don't skip the `context_scope` field - it's critical for fix success
- ❌ Don't throw on individual fix failures - log and continue
- ❌ Don't instantiate `PRPRuntime` directly - use `TaskOrchestrator.executeSubtask()`
- ❌ Don't use pre-increment check - use post-increment pattern from PRPPipeline
- ❌ Don't forget to call `this.setStatus()` in run() method
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions broadly - be specific and handle appropriately
- ❌ Don't hardcode bug IDs in fix task IDs - use generated sequential IDs
- ❌ Don't skip logging - each phase should log start/completion
- ❌ Don't return `testResults` directly - return `currentResults ?? testResults`
- ❌ Don't check `iteration === maxIterations` - use `iteration >= maxIterations`
- ❌ Don't forget to import `BugHuntWorkflow` from `./bug-hunt-workflow.js`
- ❌ Don't modify existing workflow files during this task
- ❌ Don't add fix tasks to session backlog - keep them in memory

---

## Test Examples

### Unit Test Structure

```typescript
// tests/unit/workflows/fix-cycle-workflow.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FixCycleWorkflow } from '../../../src/workflows/fix-cycle-workflow.js';
import type { TestResults, Bug, Task } from '../../../src/core/models.js';

describe('FixCycleWorkflow', () => {
  const mockTestResults: TestResults = {
    hasBugs: true,
    bugs: [
      {
        id: 'BUG-001',
        severity: 'critical',
        title: 'Login fails with empty password',
        description: 'Unhandled exception when password field is empty',
        reproduction:
          '1. Go to /login\n2. Leave password empty\n3. Click Submit',
        location: 'src/services/auth.ts:45',
      },
    ],
    summary: 'Found 1 critical bug',
    recommendations: ['Add error handling'],
  };

  const mockPrdContent = '# Test PRD\n...';
  const mockTaskOrchestrator = {
    executeSubtask: vi.fn().mockResolvedValue(undefined),
  } as any;
  const mockSessionManager = {
    currentSession: {
      taskRegistry: {
        backlog: [
          {
            phases: [
              {
                milestones: [
                  {
                    tasks: [{ id: 'P1.M1.T1', status: 'Complete' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  } as any;

  describe('constructor', () => {
    it('should create workflow with correct initial state', () => {
      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      expect(workflow.testResults).toEqual(mockTestResults);
      expect(workflow.prdContent).toEqual(mockPrdContent);
      expect(workflow.iteration).toBe(0);
      expect(workflow.maxIterations).toBe(3);
      expect(workflow.currentResults).toBeNull();
    });

    it('should throw if testResults has no bugs', () => {
      const emptyResults: TestResults = {
        hasBugs: false,
        bugs: [],
        summary: 'No bugs',
        recommendations: [],
      };

      expect(() => {
        new FixCycleWorkflow(
          emptyResults,
          mockPrdContent,
          mockTaskOrchestrator,
          mockSessionManager
        );
      }).toThrow('requires testResults with bugs to fix');
    });
  });

  describe('createFixTasks', () => {
    it('should convert bugs to fix subtasks with correct format', async () => {
      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      await workflow.createFixTasks();

      // Access private field via test helper or public getter
      const fixTasks = (workflow as any)['#fixTasks'];

      expect(fixTasks).toHaveLength(1);
      expect(fixTasks[0].id).toBe('PFIX.M1.T001.S1');
      expect(fixTasks[0].title).toContain('[BUG FIX]');
      expect(fixTasks[0].status).toBe('Planned');
      expect(fixTasks[0].story_points).toBe(13); // critical = 13
      expect(fixTasks[0].dependencies).toEqual([]);
      expect(fixTasks[0].context_scope).toContain('BUG-001');
      expect(fixTasks[0].context_scope).toContain('Login fails');
    });
  });

  describe('executeFixes', () => {
    it('should execute all fix tasks via orchestrator', async () => {
      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      await workflow.createFixTasks();
      await workflow.executeFixes();

      expect(mockTaskOrchestrator.executeSubtask).toHaveBeenCalledTimes(1);
    });

    it('should continue on individual fix failures', async () => {
      const mockOrchestrator = {
        executeSubtask: vi
          .fn()
          .mockRejectedValueOnce(new Error('Fix failed'))
          .mockResolvedValueOnce(undefined),
      } as any;

      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockOrchestrator,
        mockSessionManager
      );

      await workflow.createFixTasks();
      await workflow.executeFixes();

      // Should not throw
      expect(mockOrchestrator.executeSubtask).toHaveBeenCalled();
    });
  });

  describe('checkComplete', () => {
    it('should return false if critical bugs remain', async () => {
      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      // Set currentResults with critical bug
      (workflow as any).currentResults = mockTestResults;

      const complete = await workflow.checkComplete();

      expect(complete).toBe(false);
    });

    it('should return true if only minor bugs remain', async () => {
      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      const minorBugResults: TestResults = {
        hasBugs: true,
        bugs: [
          {
            id: 'BUG-002',
            severity: 'minor',
            title: 'Typo in error message',
            description: 'Minor typo',
            reproduction: 'N/A',
          },
        ],
        summary: 'Found 1 minor bug',
        recommendations: [],
      };

      (workflow as any).currentResults = minorBugResults;

      const complete = await workflow.checkComplete();

      expect(complete).toBe(true);
    });

    it('should return true if no bugs remain', async () => {
      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      const noBugsResults: TestResults = {
        hasBugs: false,
        bugs: [],
        summary: 'No bugs found',
        recommendations: [],
      };

      (workflow as any).currentResults = noBugsResults;

      const complete = await workflow.checkComplete();

      expect(complete).toBe(true);
    });
  });

  describe('run loop', () => {
    it('should loop until complete', async () => {
      // Mock BugHuntWorkflow to return bugs, then no bugs
      const mockBugHuntWorkflow = {
        run: vi
          .fn()
          .mockResolvedValueOnce(mockTestResults) // First run: bugs
          .mockResolvedValueOnce({
            // Second run: no bugs
            hasBugs: false,
            bugs: [],
            summary: 'No bugs found',
            recommendations: [],
          }),
      };

      // Mock BugHuntWorkflow import
      vi.doMock('../../../src/workflows/bug-hunt-workflow.js', () => ({
        BugHuntWorkflow: vi.fn().mockImplementation(() => mockBugHuntWorkflow),
      }));

      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      const results = await workflow.run();

      expect(workflow.iteration).toBe(1);
      expect(results.hasBugs).toBe(false);
      expect(workflow['status']()).toBe('completed');
    });

    it('should stop at max iterations', async () => {
      // Mock BugHuntWorkflow to always return bugs
      const mockBugHuntWorkflow = {
        run: vi.fn().mockResolvedValue(mockTestResults),
      };

      const workflow = new FixCycleWorkflow(
        mockTestResults,
        mockPrdContent,
        mockTaskOrchestrator,
        mockSessionManager
      );

      // Override maxIterations for test
      (workflow as any).maxIterations = 2;

      const results = await workflow.run();

      expect(workflow.iteration).toBe(2);
      expect(results.hasBugs).toBe(true);
    });
  });
});
```

---

## Confidence Score

**9/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ Complete workflow architecture with exact class structure
- ✅ Precise decorator patterns (`@ObservedState`, `@Step({ trackTiming: true })`)
- ✅ Exact fix task ID format (`PFIX.M1.T{N}.S1`)
- ✅ Complete bug-to-Subtask field mappings
- ✅ Integration patterns for `TaskOrchestrator` and `BugHuntWorkflow`
- ✅ Loop structure with max iteration guard
- ✅ Progress logging patterns from existing codebase
- ✅ Error handling strategies
- ✅ Comprehensive test examples
- ⚠️ Minor uncertainty: Integration with PRPPipeline is future work (P4.M3.T1.S3), but FixCycleWorkflow is designed to be standalone testable

**Validation**: The completed PRP enables an AI agent unfamiliar with the codebase to implement FixCycleWorkflow successfully using only the PRP content and codebase access.

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-13
**Author**: Claude Code (Research Phase)
**Next Phase**: Implementation (P4.M3.T1.S2 - Implementing)
