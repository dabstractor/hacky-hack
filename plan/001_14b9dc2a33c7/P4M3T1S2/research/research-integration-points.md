# Research: FixCycleWorkflow Integration with PRPPipeline and BugHuntWorkflow

**Date**: 2026-01-13
**Task**: P4.M3.T1.S2 - Implement fix cycle for bugs
**Researcher**: Claude Code

---

## Executive Summary

This document researches how a new `FixCycleWorkflow` would integrate with the existing `PRPPipeline` and `BugHuntWorkflow` to create a complete QA and bug fixing cycle. The research identifies integration points, control flow patterns, data passing mechanisms, and architectural decisions needed for implementation.

### Key Findings

1. **BugHuntWorkflow exists and is complete** - Already implements three-phase QA testing
2. **Clear integration point in PRPPipeline** - `runQACycle()` method (line 564-599) is the TODO for QA integration
3. **Pattern established by DeltaAnalysisWorkflow** - Shows how PRPPipeline calls and consumes workflow results
4. **TestResults schema defines data contract** - Structured interface for passing bugs between workflows
5. **TaskOrchestrator provides execution engine** - Can execute fix tasks via PRPRuntime
6. **PRPRuntime orchestrates research→implementation** - Inner loop workflow for fix execution

---

## 1. Current Architecture Overview

### 1.1 PRPPipeline Structure

**File**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

The `PRPPipeline` orchestrates the complete PRD implementation lifecycle:

```typescript
export class PRPPipeline extends Workflow {
  // Observed State
  sessionManager: SessionManager;
  taskOrchestrator: TaskOrchestrator;
  runtime: PRPRuntime | null = null;
  currentPhase: string = 'init';
  totalTasks: number = 0;
  completedTasks: number = 0;

  // Main workflow steps
  async run(): Promise<PipelineResult> {
    await this.initializeSession();
    await this.decomposePRD();
    await this.executeBacklog();
    await this.runQACycle(); // ← INTEGRATION POINT (line 708)
  }

  // Current implementation (lines 564-599)
  async runQACycle(): Promise<void> {
    this.logger.info('[PRPPipeline] QA Cycle');

    if (!this.#allTasksComplete()) {
      this.logger.info('[PRPPipeline] Not all tasks complete, skipping QA');
      this.#bugsFound = 0;
      this.currentPhase = 'qa_skipped';
      return;
    }

    this.logger.info('[PRPPipeline] All tasks complete, running QA bug hunt');

    // TODO: Integrate QA agent (P4.M3.T1)
    this.logger.info('[PRPPipeline] QA integration pending (P4.M3.T1)');

    this.#bugsFound = 0;
    this.currentPhase = 'qa_complete';
  }
}
```

**Integration Pattern**: The `runQACycle()` method is called after `executeBacklog()` completes. This is where BugHuntWorkflow should be integrated.

### 1.2 BugHuntWorkflow Implementation

**File**: `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`

The `BugHuntWorkflow` is fully implemented and follows the established workflow pattern:

```typescript
export class BugHuntWorkflow extends Workflow {
  // Observed State (lines 49-59)
  @ObservedState()
  prdContent: string;

  @ObservedState()
  completedTasks: Task[];

  @ObservedState()
  testResults: TestResults | null = null;

  // Constructor (lines 73-93)
  constructor(prdContent: string, completedTasks: Task[]) {
    super('BugHuntWorkflow');
    // Validation...
    this.prdContent = prdContent;
    this.completedTasks = completedTasks;
  }

  // Four @Step methods (lines 109-254)
  @Step({ trackTiming: true })
  async analyzeScope(): Promise<void> {
    /* Phase 1 */
  }

  @Step({ trackTiming: true })
  async creativeE2ETesting(): Promise<void> {
    /* Phase 2 */
  }

  @Step({ trackTiming: true })
  async adversarialTesting(): Promise<void> {
    /* Phase 3 */
  }

  @Step({ trackTiming: true })
  async generateReport(): Promise<TestResults> {
    const qaAgent = createQAAgent();
    const prompt = createBugHuntPrompt(this.prdContent, this.completedTasks);
    const results = (await qaAgent.prompt(prompt)) as TestResults;
    this.testResults = results;
    return results;
  }

  // Main entry point (lines 276-303)
  async run(): Promise<TestResults> {
    this.setStatus('running');
    await this.analyzeScope();
    await this.creativeE2ETesting();
    await this.adversarialTesting();
    const results = await this.generateReport();
    this.setStatus('completed');
    return results;
  }
}
```

**Key Integration Points**:

- **Input**: `prdContent: string`, `completedTasks: Task[]`
- **Output**: `TestResults` object with `hasBugs`, `bugs[]`, `summary`, `recommendations`
- **Agent Integration**: Uses `createQAAgent()` and `createBugHuntPrompt()` from P2.M2.T4
- **Status Tracking**: Uses Groundswell `@ObservedState` and `@Step` decorators

### 1.3 TaskOrchestrator and PRPRuntime

**Files**:

- `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- `/home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts`

The execution engine for fix tasks:

```typescript
// TaskOrchestrator (lines 60-121)
export class TaskOrchestrator {
  readonly sessionManager: SessionManager;
  readonly researchQueue: ResearchQueue;
  readonly #prpRuntime: PRPRuntime;

  constructor(sessionManager: SessionManager, scope?: Scope) {
    this.researchQueue = new ResearchQueue(sessionManager, 3);
    this.#prpRuntime = new PRPRuntime(this);
  }

  // Main execution method for subtasks (lines 574-733)
  async executeSubtask(subtask: Subtask): Promise<void> {
    // Set status to Researching
    await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');

    // Check PRP cache
    const cachedPRP = this.researchQueue.getPRP(subtask.id);

    // Set status to Implementing
    await this.setStatus(subtask.id, 'Implementing', 'Starting implementation');

    // Execute via PRPRuntime (lines 638-641)
    const result = await this.#prpRuntime.executeSubtask(
      subtask,
      this.#backlog
    );

    // Set final status
    if (result.success) {
      await this.setStatus(
        subtask.id,
        'Complete',
        'Implementation completed successfully'
      );
    } else {
      await this.setStatus(
        subtask.id,
        'Failed',
        result.error ?? 'Execution failed'
      );
    }
  }
}

// PRPRuntime (lines 83-119)
export class PRPRuntime {
  readonly #orchestrator: TaskOrchestrator;
  readonly #sessionPath: string;
  readonly #generator: PRPGenerator;
  readonly #executor: PRPExecutor;

  constructor(orchestrator: TaskOrchestrator) {
    this.#orchestrator = orchestrator;
    this.#sessionPath = currentSession.metadata.path;
    this.#generator = new PRPGenerator(sessionManager);
    this.#executor = new PRPExecutor(this.#sessionPath);
  }

  // Main execution method (lines 133-227)
  async executeSubtask(
    subtask: Subtask,
    backlog: Backlog
  ): Promise<ExecutionResult> {
    // Phase 1: Research (PRP generation)
    await this.#orchestrator.setStatus(
      subtask.id,
      'Researching',
      'Starting PRP generation'
    );
    const prp = await this.#generator.generate(subtask, backlog);

    // Phase 2: Implementation (PRP execution)
    await this.#orchestrator.setStatus(
      subtask.id,
      'Implementing',
      'Starting PRP execution'
    );
    const result = await this.#executor.execute(prp, prpPath);

    // Phase 3: Update status
    if (result.success) {
      await this.#orchestrator.setStatus(
        subtask.id,
        'Complete',
        'Implementation completed successfully'
      );
    } else {
      await this.#orchestrator.setStatus(
        subtask.id,
        'Failed',
        result.error ?? 'Execution failed'
      );
    }

    return result;
  }
}
```

**Key Integration Points**:

- **TaskOrchestrator** can execute individual subtasks via `executeSubtask()`
- **PRPRuntime** orchestrates research (PRP generation) → implementation (PRP execution)
- **Status Management**: Orchestrator manages task status transitions
- **Session Integration**: Both work with SessionManager for state persistence

---

## 2. TestResults Data Contract

**File**: `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 1683-1785)

The `TestResults` interface defines the data contract between BugHuntWorkflow and FixCycleWorkflow:

```typescript
export interface TestResults {
  // Boolean flag driving fix cycle
  readonly hasBugs: boolean;

  // Array of bug reports
  readonly bugs: Bug[];

  // High-level summary
  readonly summary: string;

  // Fix recommendations
  readonly recommendations: string[];
}

export interface Bug {
  readonly id: string;
  readonly severity: BugSeverity; // 'critical' | 'major' | 'minor' | 'cosmetic'
  readonly title: string;
  readonly description: string;
  readonly reproduction: string;
  readonly location?: string;
}

// Zod schema for validation
export const TestResultsSchema: z.ZodType<TestResults> = z.object({
  hasBugs: z.boolean(),
  bugs: z.array(BugSchema),
  summary: z.string().min(1, 'Summary is required'),
  recommendations: z.array(z.string()).min(0),
});
```

**Integration Flow**:

1. `BugHuntWorkflow.run()` → returns `TestResults`
2. `TestResults.hasBugs` → determines if fix cycle is needed
3. `TestResults.bugs[]` → input for fix task generation
4. `FixCycleWorkflow.run()` → returns final `TestResults`

---

## 3. Workflow Composition Pattern

### 3.1 Existing Pattern: DeltaAnalysisWorkflow in PRPPipeline

**File**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` (lines 308-353)

PRPPipeline demonstrates the pattern for calling one workflow from another:

```typescript
async handleDelta(): Promise<void> {
  this.currentPhase = 'delta_handling';

  // Step 1: Get old PRD from session snapshot
  const oldPRD = currentSession.prdSnapshot;

  // Step 2: Load new PRD from disk
  const newPRD = await readFile(this.sessionManager.prdPath, 'utf-8');

  // Step 3: Extract completed task IDs
  const backlog = currentSession.taskRegistry;
  const completedItems = filterByStatus(backlog, 'Complete');
  const completedTaskIds = completedItems
    .filter(item => item.type === 'Task' || item.type === 'Subtask')
    .map(item => item.id);

  // Step 4: Run DeltaAnalysisWorkflow
  this.logger.info('[PRPPipeline] Running delta analysis...');
  const workflow = new DeltaAnalysisWorkflow(oldPRD, newPRD, completedTaskIds);
  const delta: DeltaAnalysis = await workflow.run();

  // Step 5: Use workflow results
  this.logger.info(`[PRPPipeline] Delta analysis found ${delta.changes.length} changes`);
  const patchedBacklog = patchBacklog(backlog, delta);
  await this.sessionManager.saveBacklog(patchedBacklog);
}
```

**Pattern Elements**:

1. **Import** the workflow class
2. **Prepare input data** (old PRD, new PRD, completed tasks)
3. **Instantiate** workflow with constructor parameters
4. **Call** `workflow.run()` and await results
5. **Consume** results for next steps
6. **Log** progress and results

### 3.2 Proposed Pattern: FixCycleWorkflow Integration

Following the DeltaAnalysisWorkflow pattern, the integration should be:

```typescript
// In PRPPipeline.runQACycle()
async runQACycle(): Promise<void> {
  this.logger.info('[PRPPipeline] QA Cycle');

  if (!this.#allTasksComplete()) {
    this.logger.info('[PRPPipeline] Not all tasks complete, skipping QA');
    this.#bugsFound = 0;
    this.currentPhase = 'qa_skipped';
    return;
  }

  this.logger.info('[PRPPipeline] All tasks complete, running QA bug hunt');

  // Step 1: Prepare BugHuntWorkflow inputs
  const prdContent = this.sessionManager.currentSession?.prdSnapshot ?? '';
  const completedTasks = this.#extractCompletedTasks();

  // Step 2: Run BugHuntWorkflow
  this.logger.info('[PRPPipeline] Running BugHuntWorkflow...');
  const bugHuntWorkflow = new BugHuntWorkflow(prdContent, completedTasks);
  const testResults: TestResults = await bugHuntWorkflow.run();

  // Step 3: Check if bugs were found
  if (!testResults.hasBugs) {
    this.logger.info('[PRPPipeline] QA found no bugs - implementation complete');
    this.#bugsFound = 0;
    this.currentPhase = 'qa_complete';
    return;
  }

  // Step 4: Bugs found - run FixCycleWorkflow
  this.logger.info(`[PRPPipeline] QA found ${testResults.bugs.length} bugs - starting fix cycle`);
  const fixCycleWorkflow = new FixCycleWorkflow(
    testResults,
    prdContent,
    this.taskOrchestrator,
    this.sessionManager
  );
  const finalResults: TestResults = await fixCycleWorkflow.run();

  // Step 5: Report final results
  this.logger.info('[PRPPipeline] Fix cycle complete');
  this.logger.info(`[PRPPipeline] Remaining bugs: ${finalResults.bugs.length}`);
  this.#bugsFound = finalResults.bugs.length;

  // Step 6: Write TEST_RESULTS.md if critical/major bugs remain
  if (finalResults.hasBugs) {
    await this.#writeTestResults(finalResults);
    this.currentPhase = 'qa_complete_with_issues';
  } else {
    this.currentPhase = 'qa_complete';
  }
}
```

---

## 4. FixCycleWorkflow Design Requirements

### 4.1 Task Specification (from tasks.json)

**Subtask**: P4.M3.T1.S2 - "Implement fix cycle for bugs"
**Status**: Researching
**Dependencies**: P4.M3.T1.S1 (BugHuntWorkflow)

**Contract Definition**:

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: From PRD section 4.4 - If bugs found, treat TEST_RESULTS.md as mini-PRD, loop (Fix → Re-test) until no issues.
2. INPUT: TestResults with bugs. PRPPipeline execution engine.
3. LOGIC: Create src/workflows/fix-cycle-workflow.ts:
   - Export class FixCycleWorkflow extends Workflow
   - @ObservedState() testResults: TestResults
   - @ObservedState() iteration: number = 0
   - @ObservedState() maxIterations: number = 3
   - @Step() async createFixTasks(): Promise<void> - Convert each bug into subtask-like fix task
   - @Step() async executeFixes(): Promise<void> - Run fix tasks using PRPRuntime
   - @Step() async retest(): Promise<TestResults> - Run BugHuntWorkflow again
   - @Step() async checkComplete(): Promise<boolean> - Return true if no critical/major bugs
   - Override async run(): Promise<TestResults> - Loop until complete or max iterations
4. OUTPUT: Fix cycle that iterates until bugs resolved.
```

### 4.2 Proposed Architecture

```typescript
/**
 * Fix Cycle workflow for iterative bug fixing
 *
 * @module workflows/fix-cycle-workflow
 *
 * Orchestrates the bug fix cycle:
 * 1. Convert bugs to fix tasks
 * 2. Execute fixes via PRPRuntime
 * 3. Re-test with BugHuntWorkflow
 * 4. Loop until no critical/major bugs or max iterations
 */
export class FixCycleWorkflow extends Workflow {
  // Observed State
  @ObservedState()
  testResults: TestResults;

  @ObservedState()
  prdContent: string;

  @ObservedState()
  taskOrchestrator: TaskOrchestrator;

  @ObservedState()
  sessionManager: SessionManager;

  @ObservedState()
  iteration: number = 0;

  @ObservedState()
  maxIterations: number = 3;

  @ObservedState()
  currentResults: TestResults | null = null;

  /**
   * Creates a new FixCycleWorkflow instance
   *
   * @param testResults - Initial test results from BugHuntWorkflow
   * @param prdContent - Original PRD content for context
   * @param taskOrchestrator - TaskOrchestrator for executing fix tasks
   * @param sessionManager - SessionManager for state persistence
   */
  constructor(
    testResults: TestResults,
    prdContent: string,
    taskOrchestrator: TaskOrchestrator,
    sessionManager: SessionManager
  ) {
    super('FixCycleWorkflow');
    this.testResults = testResults;
    this.prdContent = prdContent;
    this.taskOrchestrator = taskOrchestrator;
    this.sessionManager = sessionManager;
  }

  /**
   * Phase 1: Create fix tasks from bugs
   *
   * Converts each bug in testResults.bugs into a subtask-like fix task.
   * Stores fix tasks for execution.
   */
  @Step({ trackTiming: true })
  async createFixTasks(): Promise<void> {
    this.logger.info('[FixCycleWorkflow] Creating fix tasks from bugs');
    this.logger.info(
      `[FixCycleWorkflow] Processing ${this.testResults.bugs.length} bugs`
    );

    // Convert bugs to fix tasks
    // Each bug becomes a subtask with:
    // - id: FIX-{bug.id}
    // - title: bug.title
    // - description: bug.description + reproduction + location
    // - dependencies: [] (fix tasks are independent)
  }

  /**
   * Phase 2: Execute fixes via PRPRuntime
   *
   * Executes all fix tasks using TaskOrchestrator and PRPRuntime.
   * Handles failures gracefully (log but continue).
   */
  @Step({ trackTiming: true })
  async executeFixes(): Promise<void> {
    this.logger.info('[FixCycleWorkflow] Executing fixes');

    // For each fix task:
    // 1. Create subtask object
    // 2. Call await this.taskOrchestrator.executeSubtask(subtask)
    // 3. Handle success/failure
    // 4. Continue with next fix (don't fail entire cycle on single fix failure)
  }

  /**
   * Phase 3: Re-test with BugHuntWorkflow
   *
   * Runs BugHuntWorkflow again to verify fixes.
   * Returns new TestResults with remaining bugs.
   */
  @Step({ trackTiming: true })
  async retest(): Promise<TestResults> {
    this.logger.info('[FixCycleWorkflow] Re-testing after fixes');

    // Get completed tasks from session
    const completedTasks = this.#extractCompletedTasks();

    // Run BugHuntWorkflow
    const bugHuntWorkflow = new BugHuntWorkflow(
      this.prdContent,
      completedTasks
    );
    const results = await bugHuntWorkflow.run();

    // Store results
    this.currentResults = results;

    return results;
  }

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

    this.logger.info(
      `[FixCycleWorkflow] Completion check: ${!hasCriticalOrMajor}`
    );
    return !hasCriticalOrMajor;
  }

  /**
   * Run the complete fix cycle workflow
   *
   * Loops until:
   * - No critical/major bugs remain, OR
   * - Max iterations reached
   *
   * @returns Final TestResults after fix cycle
   */
  async run(): Promise<TestResults> {
    this.setStatus('running');
    this.logger.info('[FixCycleWorkflow] Starting fix cycle workflow');

    try {
      while (this.iteration < this.maxIterations) {
        this.iteration++;
        this.logger.info(
          `[FixCycleWorkflow] Iteration ${this.iteration}/${this.maxIterations}`
        );

        // Phase 1: Create fix tasks
        await this.createFixTasks();

        // Phase 2: Execute fixes
        await this.executeFixes();

        // Phase 3: Re-test
        const results = await this.retest();

        // Phase 4: Check completion
        const complete = await this.checkComplete();
        if (complete) {
          this.logger.info(
            '[FixCycleWorkflow] All critical/major bugs resolved'
          );
          this.setStatus('completed');
          return results;
        }

        this.logger.info(
          `[FixCycleWorkflow] Iteration ${this.iteration} complete - ${results.bugs.length} bugs remain`
        );
      }

      // Max iterations reached
      this.logger.warn(
        `[FixCycleWorkflow] Max iterations (${this.maxIterations}) reached`
      );
      this.setStatus('completed');
      return this.currentResults!;
    } catch (error) {
      this.setStatus('failed');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[FixCycleWorkflow] Fix cycle failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Extract completed tasks from session
   *
   * @private
   */
  #extractCompletedTasks(): Task[] {
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (!backlog) return [];

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
}
```

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRPPipeline.run()                            │
├─────────────────────────────────────────────────────────────────────┤
│  1. initializeSession()                                              │
│  2. decomposePRD()                                                   │
│  3. executeBacklog() → TaskOrchestrator.processNextItem()            │
│                      → PRPRuntime.executeSubtask()                   │
│                      → PRPGenerator.generate()                       │
│                      → PRPExecutor.execute()                         │
│  4. runQACycle() ─────────────────────────────────────────────┐     │
└──────────────────────────────────────────────────────────────┼──────┘
                                                               │
                                                               ▼
                    ┌──────────────────────────────────────────────────┐
                    │           BugHuntWorkflow.run()                  │
                    ├──────────────────────────────────────────────────┤
                    │  Input:  prdContent: string                      │
                    │          completedTasks: Task[]                   │
                    │                                                  │
                    │  1. analyzeScope()                               │
                    │  2. creativeE2ETesting()                         │
                    │  3. adversarialTesting()                         │
                    │  4. generateReport()                             │
                    │     → createQAAgent()                            │
                    │     → createBugHuntPrompt(prd, tasks)            │
                    │     → qaAgent.prompt(prompt)                     │
                    │                                                  │
                    │  Output: TestResults {                           │
                    │            hasBugs: boolean                       │
                    │            bugs: Bug[]                            │
                    │            summary: string                        │
                    │            recommendations: string[]              │
                    │          }                                        │
                    └──────────────────────────────────────────────────┘
                                                               │
                                                               │ testResults
                                                               ▼
                    ┌──────────────────────────────────────────────────┐
                    │     PRPPipeline.runQACycle() Decision Point      │
                    ├──────────────────────────────────────────────────┤
                    │  if (!testResults.hasBugs) {                     │
                    │    → Complete (no bugs)                          │
                    │  } else {                                        │
                    │    → Start FixCycleWorkflow                      │
                    │  }                                               │
                    └──────────────────────────────────────────────────┘
                                                               │
                                                               ▼ (if hasBugs)
                    ┌──────────────────────────────────────────────────┐
                    │         FixCycleWorkflow.run()                    │
                    ├──────────────────────────────────────────────────┤
                    │  Input:  testResults: TestResults                 │
                    │          prdContent: string                       │
                    │          taskOrchestrator: TaskOrchestrator       │
                    │          sessionManager: SessionManager           │
                    │                                                  │
                    │  State:  iteration: number = 0                    │
                    │          maxIterations: number = 3                │
                    │          currentResults: TestResults | null       │
                    │                                                  │
                    │  ┌────────────────────────────────────────────┐  │
                    │  │ while (iteration < maxIterations) {        │  │
                    │  │   iteration++                              │  │
                    │  │                                            │  │
                    │  │   1. createFixTasks()                      │  │
                    │  │      → Convert bugs[] to fix subtasks       │  │
                    │  │                                            │  │
                    │  │   2. executeFixes()                        │  │
                    │  │      → For each fix task:                   │  │
                    │  │        → taskOrchestrator.executeSubtask()  │  │
                    │  │        → PRPRuntime.executeSubtask()        │  │
                    │  │                                            │  │
                    │  │   3. retest()                              │  │
                    │  │      → BugHuntWorkflow.run(prd, completed)  │  │
                    │  │      → Returns TestResults                  │  │
                    │  │                                            │  │
                    │  │   4. checkComplete()                       │  │
                    │  │      → if (!hasCriticalOrMajor) break      │  │
                    │  │ }                                          │  │
                    │  └────────────────────────────────────────────┘  │
                    │                                                  │
                    │  Output: TestResults (final state)               │
                    └──────────────────────────────────────────────────┘
                                                               │
                                                               │ finalResults
                                                               ▼
                    ┌──────────────────────────────────────────────────┐
                    │     PRPPipeline.runQACycle() Completion          │
                    ├──────────────────────────────────────────────────┤
                    │  Log final results                               │
                    │  Update #bugsFound                               │
                    │  if (finalResults.hasBugs) {                     │
                    │    → Write TEST_RESULTS.md                       │
                    │    → currentPhase = 'qa_complete_with_issues'    │
                    │  } else {                                        │
                    │    → currentPhase = 'qa_complete'                │
                    │  }                                               │
                    └──────────────────────────────────────────────────┘
                                                               │
                                                               ▼
                    ┌──────────────────────────────────────────────────┐
                    │           PRPPipeline.cleanup()                  │
                    ├──────────────────────────────────────────────────┤
                    │  Save backlog state                              │
                    │  Remove signal handlers                          │
                    │  Return PipelineResult                           │
                    └──────────────────────────────────────────────────┘
```

---

## 6. Control Flow Sequences

### 6.1 Happy Path: No Bugs Found

```typescript
PRPPipeline.run()
  → executeBacklog() completes
  → runQACycle()
    → BugHuntWorkflow.run(prd, completedTasks)
    → Returns { hasBugs: false, bugs: [], ... }
    → Log "QA found no bugs"
    → Set currentPhase = 'qa_complete'
  → cleanup()
  → Return PipelineResult { success: true, bugsFound: 0, ... }
```

### 6.2 Bug Fix Path: All Bugs Resolved

```typescript
PRPPipeline.run()
  → executeBacklog() completes
  → runQACycle()
    → BugHuntWorkflow.run(prd, completedTasks)
    → Returns { hasBugs: true, bugs: [bug1, bug2, ...], ... }
    → FixCycleWorkflow.run(testResults, prd, orchestrator, session)
      → Iteration 1:
        → createFixTasks() → Creates fix tasks for bug1, bug2, ...
        → executeFixes() → Executes all fix tasks via PRPRuntime
        → retest() → BugHuntWorkflow.run() returns { hasBugs: false, ... }
        → checkComplete() → Returns true (no critical/major bugs)
        → Break loop
      → Returns { hasBugs: false, bugs: [], ... }
    → Log "All bugs resolved"
    → Set currentPhase = 'qa_complete'
  → cleanup()
  → Return PipelineResult { success: true, bugsFound: 0, ... }
```

### 6.3 Bug Fix Path: Max Iterations Reached

```typescript
PRPPipeline.run()
  → executeBacklog() completes
  → runQACycle()
    → BugHuntWorkflow.run(prd, completedTasks)
    → Returns { hasBugs: true, bugs: [bug1, bug2, bug3], ... }
    → FixCycleWorkflow.run(testResults, prd, orchestrator, session)
      → Iteration 1:
        → createFixTasks() → Creates fix tasks
        → executeFixes() → Executes fixes
        → retest() → Returns { hasBugs: true, bugs: [bug2, bug3], ... }
        → checkComplete() → Returns false (still has bugs)
      → Iteration 2:
        → createFixTasks() → Creates fix tasks for bug2, bug3
        → executeFixes() → Executes fixes
        → retest() → Returns { hasBugs: true, bugs: [bug3], ... }
        → checkComplete() → Returns false (still has bugs)
      → Iteration 3:
        → createFixTasks() → Creates fix tasks for bug3
        → executeFixes() → Executes fixes
        → retest() → Returns { hasBugs: true, bugs: [bug3], ... }
        → checkComplete() → Returns false (still has bugs)
      → Max iterations reached (3/3)
      → Return { hasBugs: true, bugs: [bug3], ... }
    → Log "Max iterations reached, 1 bug remaining"
    → Write TEST_RESULTS.md
    → Set currentPhase = 'qa_complete_with_issues'
  → cleanup()
  → Return PipelineResult { success: true, bugsFound: 1, ... }
```

### 6.4 Error Path: Fix Task Failure

```typescript
PRPPipeline.run()
  → executeBacklog() completes
  → runQACycle()
    → BugHuntWorkflow.run(prd, completedTasks)
    → Returns { hasBugs: true, bugs: [bug1, bug2], ... }
    → FixCycleWorkflow.run(testResults, prd, orchestrator, session)
      → Iteration 1:
        → createFixTasks() → Creates fix tasks
        → executeFixes()
          → Fix task 1: SUCCESS
          → Fix task 2: FAILED → Log error, continue with next fix
        → retest() → BugHuntWorkflow.run()
          → Returns { hasBugs: true, bugs: [bug2, bug3], ... }
          → (bug2 still there, bug3 is new regression)
        → checkComplete() → Returns false
      → Iteration 2:
        → createFixTasks() → Creates fix tasks for bug2, bug3
        → executeFixes() → Executes fixes
        → retest() → Returns { hasBugs: false, ... }
        → checkComplete() → Returns true
      → Returns { hasBugs: false, bugs: [], ... }
    → Log "All bugs resolved after 2 iterations"
    → Set currentPhase = 'qa_complete'
  → cleanup()
  → Return PipelineResult { success: true, bugsFound: 0, ... }
```

---

## 7. Integration Points Summary

### 7.1 PRPPipeline → BugHuntWorkflow

**Location**: `PRPPipeline.runQACycle()` (line 564-599)

**Integration Steps**:

1. Extract `prdContent` from `sessionManager.currentSession.prdSnapshot`
2. Extract `completedTasks` from backlog (filter by `status === 'Complete'`)
3. Instantiate `BugHuntWorkflow(prdContent, completedTasks)`
4. Call `await bugHuntWorkflow.run()`
5. Consume `TestResults` output

**Code Changes Required**:

```typescript
// Add import at top of prp-pipeline.ts
import { BugHuntWorkflow } from './bug-hunt-workflow.js';

// Replace TODO in runQACycle()
async runQACycle(): Promise<void> {
  this.logger.info('[PRPPipeline] QA Cycle');

  if (!this.#allTasksComplete()) {
    this.logger.info('[PRPPipeline] Not all tasks complete, skipping QA');
    this.#bugsFound = 0;
    this.currentPhase = 'qa_skipped';
    return;
  }

  this.logger.info('[PRPPipeline] All tasks complete, running QA bug hunt');

  // Extract inputs
  const prdContent = this.sessionManager.currentSession?.prdSnapshot ?? '';
  const completedTasks = this.#extractCompletedTasks();

  // Run BugHuntWorkflow
  const bugHuntWorkflow = new BugHuntWorkflow(prdContent, completedTasks);
  const testResults = await bugHuntWorkflow.run();

  // Log results
  this.logger.info(`[PRPPipeline] QA complete: ${testResults.bugs.length} bugs found`);
  this.logger.info(`[PRPPipeline] Summary: ${testResults.summary}`);

  // Check if fix cycle needed
  if (testResults.hasBugs) {
    this.logger.info('[PRPPipeline] Critical/major bugs found - starting fix cycle');
    await this.#runFixCycle(testResults, prdContent);
  }

  this.#bugsFound = testResults.bugs.length;
  this.currentPhase = 'qa_complete';
}
```

### 7.2 PRPPipeline → FixCycleWorkflow

**Location**: `PRPPipeline.runQACycle()` (new method: `#runFixCycle()`)

**Integration Steps**:

1. Check `testResults.hasBugs` flag
2. Instantiate `FixCycleWorkflow(testResults, prdContent, taskOrchestrator, sessionManager)`
3. Call `await fixCycleWorkflow.run()`
4. Consume final `TestResults`
5. Write `TEST_RESULTS.md` if bugs remain

**Code Changes Required**:

```typescript
// Add import at top of prp-pipeline.ts
import { FixCycleWorkflow } from './fix-cycle-workflow.js';

// Add private method to PRPPipeline
async #runFixCycle(testResults: TestResults, prdContent: string): Promise<TestResults> {
  this.logger.info('[PRPPipeline] Starting fix cycle');
  this.logger.info(`[PRPPipeline] Initial bug count: ${testResults.bugs.length}`);

  const fixCycleWorkflow = new FixCycleWorkflow(
    testResults,
    prdContent,
    this.taskOrchestrator,
    this.sessionManager
  );

  const finalResults = await fixCycleWorkflow.run();

  this.logger.info('[PRPPipeline] Fix cycle complete');
  this.logger.info(`[PRPPipeline] Final bug count: ${finalResults.bugs.length}`);

  // Write TEST_RESULTS.md if bugs remain
  if (finalResults.hasBugs) {
    await this.#writeTestResults(finalResults);
  }

  return finalResults;
}

// Add helper method
async #writeTestResults(testResults: TestResults): Promise<void> {
  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (!sessionPath) {
    this.logger.warn('[PRPPipeline] No session path - cannot write TEST_RESULTS.md');
    return;
  }

  const testResultsPath = join(sessionPath, 'TEST_RESULTS.md');
  const content = this.#formatTestResults(testResults);

  await writeFile(testResultsPath, content, { mode: 0o644 });
  this.logger.info(`[PRPPipeline] Wrote TEST_RESULTS.md to ${testResultsPath}`);
}

#formatTestResults(testResults: TestResults): string {
  const bugList = testResults.bugs.map(bug => `
## ${bug.id}: ${bug.title}

**Severity**: ${bug.severity}
**Location**: ${bug.location ?? 'Unknown'}

### Description
${bug.description}

### Reproduction
${bug.reproduction}
`).join('\n');

  return `# Test Results

**Summary**: ${testResults.summary}
**Bugs Found**: ${testResults.bugs.length}

## Bugs

${bugList}

## Recommendations

${testResults.recommendations.map(r => `- ${r}`).join('\n')}
`;
}

#extractCompletedTasks(): Task[] {
  const backlog = this.sessionManager.currentSession?.taskRegistry;
  if (!backlog) return [];

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
```

### 7.3 FixCycleWorkflow → TaskOrchestrator

**Location**: `FixCycleWorkflow.executeFixes()` (line TBD)

**Integration Steps**:

1. Convert `Bug[]` to `Subtask[]` fix tasks
2. For each fix task:
   - Call `await this.taskOrchestrator.executeSubtask(fixSubtask)`
   - Handle success/failure gracefully
3. Continue with next fix task even if one fails

**Code Changes Required**:

```typescript
// In FixCycleWorkflow.executeFixes()
async executeFixes(): Promise<void> {
  this.logger.info('[FixCycleWorkflow] Executing fixes');

  // Get current backlog for context
  const backlog = this.sessionManager.currentSession?.taskRegistry;

  let successCount = 0;
  let failureCount = 0;

  for (const fixTask of this.fixTasks) {
    this.logger.info(`[FixCycleWorkflow] Executing fix: ${fixTask.id}`);

    try {
      await this.taskOrchestrator.executeSubtask(fixTask);
      successCount++;
      this.logger.info(`[FixCycleWorkflow] Fix ${fixTask.id} completed successfully`);
    } catch (error) {
      failureCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[FixCycleWorkflow] Fix ${fixTask.id} failed: ${errorMessage}`);
      // Don't throw - continue with next fix
    }
  }

  this.logger.info(`[FixCycleWorkflow] Fixes complete: ${successCount} success, ${failureCount} failed`);
}
```

### 7.4 FixCycleWorkflow → BugHuntWorkflow

**Location**: `FixCycleWorkflow.retest()` (line TBD)

**Integration Steps**:

1. Extract completed tasks from session
2. Instantiate `BugHuntWorkflow(prdContent, completedTasks)`
3. Call `await bugHuntWorkflow.run()`
4. Store and return results

**Code Changes Required**:

```typescript
// In FixCycleWorkflow.retest()
async retest(): Promise<TestResults> {
  this.logger.info('[FixCycleWorkflow] Re-testing after fixes');

  // Extract completed tasks from session
  const completedTasks = this.#extractCompletedTasks();
  this.logger.info(`[FixCycleWorkflow] Testing against ${completedTasks.length} completed tasks`);

  // Run BugHuntWorkflow
  const bugHuntWorkflow = new BugHuntWorkflow(this.prdContent, completedTasks);
  const results = await bugHuntWorkflow.run();

  // Store results
  this.currentResults = results;

  // Log results
  this.logger.info(`[FixCycleWorkflow] Re-test complete: ${results.bugs.length} bugs found`);
  this.logger.info(`[FixCycleWorkflow] Summary: ${results.summary}`);

  return results;
}
```

---

## 8. TaskOrchestrator and PRPRuntime Access Patterns

### 8.1 Accessing TaskOrchestrator from PRPPipeline

**Current State**: PRPPipeline already has `taskOrchestrator` as public observed state (line 107)

```typescript
export class PRPPipeline extends Workflow {
  taskOrchestrator: TaskOrchestrator;

  // In runQACycle(), can access directly:
  await this.taskOrchestrator.executeSubtask(fixSubtask);
}
```

### 8.2 Accessing PRPRuntime from FixCycleWorkflow

**Option 1**: Pass TaskOrchestrator (recommended)

```typescript
// FixCycleWorkflow receives TaskOrchestrator in constructor
constructor(
  testResults: TestResults,
  prdContent: string,
  taskOrchestrator: TaskOrchestrator,
  sessionManager: SessionManager
) {
  super('FixCycleWorkflow');
  this.taskOrchestrator = taskOrchestrator;
}

// TaskOrchestrator.executeSubtask() internally uses PRPRuntime
// No need to access PRPRuntime directly
```

**Option 2**: Pass PRPRuntime directly

```typescript
// FixCycleWorkflow receives PRPRuntime in constructor
constructor(
  testResults: TestResults,
  prdContent: string,
  prpRuntime: PRPRuntime,
  sessionManager: SessionManager
) {
  super('FixCycleWorkflow');
  this.#prpRuntime = prpRuntime;
}

// But this requires creating PRPRuntime instance in PRPPipeline
// TaskOrchestrator already has PRPRuntime, so Option 1 is simpler
```

**Recommendation**: Use Option 1 - pass TaskOrchestrator, which internally uses PRPRuntime.

### 8.3 Creating Fix Subtasks

Fix tasks need to be structured as `Subtask` objects for TaskOrchestrator:

```typescript
interface Subtask {
  id: string;
  title: string;
  description: string;
  status: Status;
  dependencies: string[];
}

// Convert Bug to Subtask
function bugToFixSubtask(bug: Bug, index: number): Subtask {
  return {
    id: `FIX-${bug.id}`, // e.g., FIX-BUG-001
    title: `Fix: ${bug.title}`,
    description: `
**Bug**: ${bug.description}

**Severity**: ${bug.severity}

**Location**: ${bug.location ?? 'Unknown'}

**Reproduction**:
${bug.reproduction}

**Task**: Fix this bug by implementing the necessary code changes.
    `.trim(),
    status: 'Planned',
    dependencies: [], // Fix tasks are independent
  };
}
```

---

## 9. Status Management and Persistence

### 9.1 Fix Task Status Tracking

Fix tasks should be tracked in the session backlog:

```typescript
// In FixCycleWorkflow.createFixTasks()
async createFixTasks(): Promise<void> {
  this.logger.info('[FixCycleWorkflow] Creating fix tasks from bugs');

  // Convert bugs to fix subtasks
  this.fixTasks = this.testResults.bugs.map((bug, index) => ({
    id: `FIX-${bug.id}`,
    title: `Fix: ${bug.title}`,
    description: `Fix bug: ${bug.description}\n\nReproduction: ${bug.reproduction}`,
    status: 'Planned' as Status,
    dependencies: [],
  }));

  this.logger.info(`[FixCycleWorkflow] Created ${this.fixTasks.length} fix tasks`);

  // Add fix tasks to backlog?
  // Option 1: Add to session backlog (persistent)
  // Option 2: Keep in memory (ephemeral)
  // Recommendation: Option 2 (keep ephemeral - fix tasks don't need to persist)
}
```

### 9.2 Session State Updates

After each fix iteration, update the session backlog:

```typescript
// In FixCycleWorkflow.executeFixes()
async executeFixes(): Promise<void> {
  // ... execute fixes ...

  // Refresh session state
  const backlog = this.sessionManager.currentSession?.taskRegistry;
  if (backlog) {
    // Save updated backlog to session
    await this.sessionManager.saveBacklog(backlog);
    this.logger.info('[FixCycleWorkflow] Session state updated');
  }
}
```

---

## 10. Error Handling and Edge Cases

### 10.1 Fix Task Failure

**Strategy**: Log and continue - don't fail entire fix cycle

```typescript
// In FixCycleWorkflow.executeFixes()
for (const fixTask of this.fixTasks) {
  try {
    await this.taskOrchestrator.executeSubtask(fixTask);
    this.logger.info(`[FixCycleWorkflow] Fix ${fixTask.id} succeeded`);
  } catch (error) {
    this.logger.error(`[FixCycleWorkflow] Fix ${fixTask.id} failed: ${error}`);
    // Continue with next fix
    // The retest phase will catch remaining bugs
  }
}
```

### 10.2 BugHuntWorkflow Failure

**Strategy**: Treat as test failure - don't run fix cycle

```typescript
// In PRPPipeline.runQACycle()
try {
  const bugHuntWorkflow = new BugHuntWorkflow(prdContent, completedTasks);
  const testResults = await bugHuntWorkflow.run();
} catch (error) {
  this.logger.warn(`[PRPPipeline] BugHuntWorkflow failed: ${error}`);
  this.logger.warn('[PRPPipeline] Skipping fix cycle due to QA failure');
  this.#bugsFound = 0;
  this.currentPhase = 'qa_failed';
  return;
}
```

### 10.3 FixCycleWorkflow Failure

**Strategy**: Log but don't fail pipeline - return partial results

```typescript
// In PRPPipeline.#runFixCycle()
try {
  const fixCycleWorkflow = new FixCycleWorkflow(...);
  const finalResults = await fixCycleWorkflow.run();
  return finalResults;
} catch (error) {
  this.logger.error(`[PRPPipeline] FixCycleWorkflow failed: ${error}`);
  this.logger.error('[PRPPipeline] Returning original test results');
  // Return original results - some fixes may have succeeded
  return testResults;
}
```

### 10.4 Max Iterations Reached

**Strategy**: Log warning and return current results

```typescript
// In FixCycleWorkflow.run()
while (this.iteration < this.maxIterations) {
  // ... fix cycle ...
}

// Max iterations reached
this.logger.warn(
  `[FixCycleWorkflow] Max iterations (${this.maxIterations}) reached`
);
this.logger.warn(
  `[FixCycleWorkflow] ${this.currentResults?.bugs.length ?? 0} bugs remain`
);
this.setStatus('completed');
return this.currentResults!;
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Test File**: `tests/unit/workflows/fix-cycle-workflow.test.ts`

```typescript
describe('FixCycleWorkflow', () => {
  it('should create fix tasks from bugs', async () => {
    const testResults: TestResults = {
      hasBugs: true,
      bugs: [
        {
          id: 'BUG-001',
          severity: 'critical',
          title: 'Login fails',
          description: 'System crashes on login',
          reproduction: '1. Go to /login\n2. Enter credentials\n3. Click submit',
          location: 'src/auth.ts:45',
        },
      ],
      summary: 'Found 1 critical bug',
      recommendations: ['Add error handling'],
    };

    const workflow = new FixCycleWorkflow(
      testResults,
      prdContent,
      mockOrchestrator,
      mockSessionManager
    );

    await workflow.createFixTasks();

    expect(workflow.fixTasks).toHaveLength(1);
    expect(workflow.fixTasks[0].id).toBe('FIX-BUG-001');
  });

  it('should execute fixes via TaskOrchestrator', async () => {
    const workflow = new FixCycleWorkflow(...);
    await workflow.createFixTasks();

    await workflow.executeFixes();

    expect(mockOrchestrator.executeSubtask).toHaveBeenCalledTimes(1);
  });

  it('should retest with BugHuntWorkflow', async () => {
    const workflow = new FixCycleWorkflow(...);

    const results = await workflow.retest();

    expect(results).toBeDefined();
    expect(results.bugs).toBeDefined();
  });

  it('should loop until no critical/major bugs', async () => {
    // Mock BugHuntWorkflow to return bugs, then no bugs
    mockBugHuntWorkflow.run
      .mockResolvedValueOnce({ hasBugs: true, bugs: [criticalBug], ... })
      .mockResolvedValueOnce({ hasBugs: false, bugs: [], ... });

    const workflow = new FixCycleWorkflow(...);
    const results = await workflow.run();

    expect(workflow.iteration).toBe(1);
    expect(results.hasBugs).toBe(false);
  });

  it('should stop at max iterations', async () => {
    // Mock BugHuntWorkflow to always return bugs
    mockBugHuntWorkflow.run.mockResolvedValue({
      hasBugs: true,
      bugs: [criticalBug],
      ...
    });

    const workflow = new FixCycleWorkflow(...);
    workflow.maxIterations = 2;
    const results = await workflow.run();

    expect(workflow.iteration).toBe(2);
    expect(results.hasBugs).toBe(true);
  });
});
```

### 11.2 Integration Tests

**Test File**: `tests/integration/fix-cycle-workflow-integration.test.ts`

```typescript
describe('FixCycleWorkflow Integration', () => {
  it('should integrate with TaskOrchestrator and BugHuntWorkflow', async () => {
    // Create real session
    const sessionManager = new SessionManager('./test/fixtures/PRD.md');
    await sessionManager.initialize();

    // Create real TaskOrchestrator
    const taskOrchestrator = new TaskOrchestrator(sessionManager);

    // Create FixCycleWorkflow
    const testResults: TestResults = {
      /* ... */
    };
    const workflow = new FixCycleWorkflow(
      testResults,
      prdContent,
      taskOrchestrator,
      sessionManager
    );

    const results = await workflow.run();

    expect(results).toBeDefined();
  });

  it('should handle fix cycle end-to-end', async () => {
    // Full E2E test with mocked LLM calls
    // 1. Run BugHuntWorkflow → finds bugs
    // 2. Run FixCycleWorkflow → fixes bugs
    // 3. Run BugHuntWorkflow again → no bugs
  });
});
```

---

## 12. Open Questions and Decisions

### 12.1 Fix Task Persistence

**Question**: Should fix tasks be added to the session backlog or kept in memory?

**Options**:

1. **Add to backlog**: Persistent, visible in session state, but cluttered
2. **Keep in memory**: Clean, but lost if workflow interrupted

**Recommendation**: Keep in memory (Option 2)

- Fix tasks are ephemeral - only needed during fix cycle
- Session backlog should reflect original PRD structure
- If workflow interrupted, can restart from original TestResults

### 12.2 Fix Task IDs

**Question**: What ID scheme for fix tasks?

**Options**:

1. `FIX-{bugId}` - e.g., `FIX-BUG-001`
2. `P1.M1.T1.S1-FIX` - e.g., `P1.M1.T1.S1-FIX` (ties to original task)
3. Sequential - e.g., `FIX-001`, `FIX-002`

**Recommendation**: `FIX-{bugId}` (Option 1)

- Clear link to bug report
- Easy to track in logs
- Independent of original task structure

### 12.3 Max Iterations Value

**Question**: What should `maxIterations` default to?

**Options**:

1. `3` - Current specification
2. `5` - More attempts for complex bugs
3. Configurable via constructor parameter

**Recommendation**: Default to `3`, make configurable

- 3 iterations is reasonable for most cases
- Configurable for edge cases
- Log warning when approaching limit

### 12.4 TEST_RESULTS.md Format

**Question**: What format for TEST_RESULTS.md?

**Options**:

1. Markdown (human-readable)
2. JSON (machine-readable)
3. Both (write two files)

**Recommendation**: Markdown (Option 1)

- Human-readable for developers
- Easy to review in PRs
- Can be converted to JSON if needed
- Matches PRD format

### 12.5 Fix Task Dependencies

**Question**: Should fix tasks have dependencies?

**Options**:

1. No dependencies - all fixes independent
2. Smart dependencies - infer from bug location
3. Manual dependencies - specified in bug report

**Recommendation**: No dependencies (Option 1)

- Fixes are usually independent
- Complex dependencies add complexity
- Retest phase catches regressions
- Can evolve to smart dependencies if needed

---

## 13. Implementation Checklist

### 13.1 Create FixCycleWorkflow

- [ ] Create `src/workflows/fix-cycle-workflow.ts`
- [ ] Import `Workflow`, `Step`, `ObservedState` from 'groundswell'
- [ ] Import `TestResults`, `Bug`, `Task`, `Subtask`, `Status` from '../core/models.js'
- [ ] Import `TaskOrchestrator` from '../core/task-orchestrator.js'
- [ ] Import `SessionManager` from '../core/session-manager.js'
- [ ] Export `FixCycleWorkflow extends Workflow`
- [ ] Add `@ObservedState()` properties: `testResults`, `prdContent`, `taskOrchestrator`, `sessionManager`, `iteration`, `maxIterations`, `currentResults`
- [ ] Implement constructor with validation
- [ ] Implement `@Step() createFixTasks()` method
- [ ] Implement `@Step() executeFixes()` method
- [ ] Implement `@Step() retest()` method
- [ ] Implement `@Step() checkComplete()` method
- [ ] Implement `run()` method with loop logic

### 13.2 Integrate with PRPPipeline

- [ ] Add `import { FixCycleWorkflow } from './fix-cycle-workflow.js'`
- [ ] Implement `#extractCompletedTasks()` helper method
- [ ] Implement `#runFixCycle()` private method
- [ ] Implement `#writeTestResults()` private method
- [ ] Implement `#formatTestResults()` private method
- [ ] Update `runQACycle()` to call BugHuntWorkflow
- [ ] Update `runQACycle()` to call FixCycleWorkflow if bugs found
- [ ] Update `runQACycle()` to write TEST_RESULTS.md if bugs remain

### 13.3 Update Exports

- [ ] Add `export { FixCycleWorkflow } from './fix-cycle-workflow.js'` to `src/workflows/index.ts`

### 13.4 Add Tests

- [ ] Create `tests/unit/workflows/fix-cycle-workflow.test.ts`
- [ ] Test `createFixTasks()` converts bugs to subtasks
- [ ] Test `executeFixes()` calls TaskOrchestrator
- [ ] Test `retest()` calls BugHuntWorkflow
- [ ] Test `checkComplete()` returns correct boolean
- [ ] Test `run()` loops until complete or max iterations
- [ ] Test max iterations reached
- [ ] Test fix task failure handling
- [ ] Create `tests/integration/fix-cycle-workflow-integration.test.ts`
- [ ] Test full fix cycle end-to-end

### 13.5 Documentation

- [ ] Add JSDoc comments to FixCycleWorkflow class
- [ ] Add JSDoc comments to all methods
- [ ] Update PRPPipeline JSDoc for runQACycle()
- [ ] Update README.md with fix cycle documentation

---

## 14. Conclusion

### 14.1 Integration Architecture

The FixCycleWorkflow integrates cleanly with existing components:

```
PRPPipeline (orchestrator)
  ├─> BugHuntWorkflow (QA testing)
  │    └─> TestResults output
  ├─> FixCycleWorkflow (bug fixing)
  │    ├─> TaskOrchestrator (execution engine)
  │    │    └─> PRPRuntime (research→implementation)
  │    └─> BugHuntWorkflow (retesting)
  └─> PipelineResult (final output)
```

### 14.2 Key Patterns

1. **Workflow Composition**: One workflow instantiating and calling another (DeltaAnalysisWorkflow pattern)
2. **Data Passing**: Structured interfaces (TestResults) as data contracts
3. **Status Tracking**: Groundswell `@ObservedState` and `@Step` decorators
4. **Error Handling**: Graceful degradation - log and continue
5. **Session Integration**: SessionManager for state persistence

### 14.3 Next Steps

1. **Implement FixCycleWorkflow** following this research document
2. **Update PRPPipeline.runQACycle()** to integrate BugHuntWorkflow and FixCycleWorkflow
3. **Add comprehensive tests** for all integration points
4. **Document the complete QA/fix cycle** in project README
5. **Test end-to-end** with a sample PRD containing bugs

---

## Appendix A: File Reference Summary

### Existing Files

| File                                        | Purpose                    | Key Classes/Functions                   |
| ------------------------------------------- | -------------------------- | --------------------------------------- |
| `/src/workflows/prp-pipeline.ts`            | Main pipeline orchestrator | `PRPPipeline.run()`, `runQACycle()`     |
| `/src/workflows/bug-hunt-workflow.ts`       | QA testing workflow        | `BugHuntWorkflow.run()`                 |
| `/src/workflows/delta-analysis-workflow.ts` | Delta analysis workflow    | `DeltaAnalysisWorkflow.run()`           |
| `/src/core/task-orchestrator.ts`            | Task execution engine      | `TaskOrchestrator.executeSubtask()`     |
| `/src/agents/prp-runtime.ts`                | PRP execution orchestrator | `PRPRuntime.executeSubtask()`           |
| `/src/core/models.ts`                       | Data models                | `TestResults`, `Bug`, `Task`, `Subtask` |
| `/src/agents/prompts/bug-hunt-prompt.ts`    | QA prompt generator        | `createBugHuntPrompt()`                 |
| `/src/agents/agent-factory.ts`              | Agent factory              | `createQAAgent()`                       |
| `/src/workflows/index.ts`                   | Workflow exports           | Barrel exports                          |

### Files to Create

| File                                                        | Purpose            |
| ----------------------------------------------------------- | ------------------ |
| `/src/workflows/fix-cycle-workflow.ts`                      | Fix cycle workflow |
| `/tests/unit/workflows/fix-cycle-workflow.test.ts`          | Unit tests         |
| `/tests/integration/fix-cycle-workflow-integration.test.ts` | Integration tests  |

### Files to Modify

| File                             | Changes                                   |
| -------------------------------- | ----------------------------------------- |
| `/src/workflows/prp-pipeline.ts` | Update `runQACycle()`, add helper methods |
| `/src/workflows/index.ts`        | Add `FixCycleWorkflow` export             |

---

## Appendix B: Task Specification Reference

**From**: `/plan/001_14b9dc2a33c7/tasks.json` (lines 920-928)

```json
{
  "type": "Subtask",
  "id": "P4.M3.T1.S2",
  "title": "Implement fix cycle for bugs",
  "status": "Researching",
  "story_points": 2,
  "dependencies": ["P4.M3.T1.S1"],
  "context_scope": "CONTRACT DEFINITION:\n1. RESEARCH NOTE: From PRD section 4.4 - If bugs found, treat TEST_RESULTS.md as mini-PRD, loop (Fix → Re-test) until no issues.\n2. INPUT: TestResults with bugs. PRPPipeline execution engine.\n3. LOGIC: Create src/workflows/fix-cycle-workflow.ts:\n   - Export class FixCycleWorkflow extends Workflow\n   - @ObservedState() testResults: TestResults\n   - @ObservedState() iteration: number = 0\n   - @ObservedState() maxIterations: number = 3\n   - @Step() async createFixTasks(): Promise<void> - Convert each bug into subtask-like fix task\n   - @Step() async executeFixes(): Promise<void> - Run fix tasks using PRPRuntime\n   - @Step() async retest(): Promise<TestResults> - Run BugHuntWorkflow again\n   - @Step() async checkComplete(): Promise<boolean> - Return true if no critical/major bugs\n   - Override async run(): Promise<TestResults> - Loop until complete or max iterations\n4. OUTPUT: Fix cycle that iterates until bugs resolved."
}
```

---

**End of Research Document**
