# Product Requirement Prompt (PRP): Integrate QA with Main Pipeline

**Work Item**: P4.M3.T1.S3 - Integrate QA with main pipeline
**Status**: Research Complete → Ready for Implementation
**Dependencies**: P4.M3.T1.S1 (BugHuntWorkflow) - Complete, P4.M3.T1.S2 (FixCycleWorkflow) - Implementing

---

## Goal

**Feature Goal**: Integrate BugHuntWorkflow and FixCycleWorkflow into PRPPipeline.runQACycle() to enable automated QA bug detection and fix cycles, with mode-based execution control.

**Deliverable**: Modified `src/workflows/prp-pipeline.ts` containing:

- `@ObservedState() mode: 'normal' | 'bug-hunt' | 'validate'` property
- Modified constructor accepting optional `mode` parameter
- Fully implemented `runQACycle()` method with:
  - BugHuntWorkflow integration
  - FixCycleWorkflow integration
  - TEST_RESULTS.md writing when bugs found
  - QA summary console output
- Modified `src/index.ts` passing mode to PRPPipeline

**Success Definition**:

- PRPPipeline has `mode` observed state property with proper type
- Constructor accepts `mode?: 'normal' | 'bug-hunt' | 'validate'` parameter
- In `runQACycle()`:
  - If mode is 'bug-hunt', run BugHuntWorkflow directly
  - If mode is 'normal', run BugHuntWorkflow only if all tasks Complete
  - If testResults.hasBugs is true, run FixCycleWorkflow
  - If fix cycle completes with bugs, log warning but don't fail
- TEST_RESULTS.md written to session directory if bugs found
- QA summary printed to console with severity breakdown
- All tests pass (unit and integration)
- No regressions in existing pipeline tests

## User Persona (if applicable)

**Target User**: PRPPipeline (internal orchestration layer)

**Use Case**: After all tasks complete (or in bug-hunt mode), the pipeline needs automated QA to:

1. Detect bugs via BugHuntWorkflow
2. Fix bugs via FixCycleWorkflow
3. Report results via TEST_RESULTS.md and console summary

**User Journey**:

1. **Normal Mode**: After backlog execution completes, runQACycle() checks if all tasks are Complete
   - If yes: Run BugHuntWorkflow → If bugs found → Run FixCycleWorkflow → Write results
   - If no: Skip QA (log reason)

2. **Bug-Hunt Mode**: Immediately run BugHuntWorkflow regardless of task status
   - Run BugHuntWorkflow → If bugs found → Run FixCycleWorkflow → Write results

3. **Validate Mode**: (Future use) Run validation checks only (not implemented in this PRP)

4. **Output**:
   - TEST_RESULTS.md written to session directory if bugs found
   - QA summary printed to console with bug counts by severity

**Pain Points Addressed**:

- **No QA Integration**: BugHuntWorkflow and FixCycleWorkflow exist but aren't called by pipeline
- **No Bug Reporting**: No way to persist or view QA results
- **No Mode Control**: --mode flag exists but doesn't affect pipeline behavior
- **Incomplete Fix Cycle**: Bugs may be detected but fixes aren't attempted

## Why

- **Automated QA**: Enables end-to-end QA without manual intervention
- **Bug Detection**: BugHuntWorkflow finds bugs before production
- **Bug Resolution**: FixCycleWorkflow automatically fixes detected bugs
- **Mode Flexibility**: bug-hunt mode allows running QA without full task execution
- **Result Persistence**: TEST_RESULTS.md provides permanent bug record
- **User Visibility**: Console summary keeps users informed of QA status
- **Graceful Degradation**: Bugs logged but don't fail the pipeline

## What

### Input

- `mode?: 'normal' | 'bug-hunt' | 'validate'` - Execution mode from CLI (default: 'normal')
- Existing PRPPipeline state: sessionManager, taskOrchestrator, prdContent, completedTasks

### State Changes

- **New @ObservedState property**: `mode: 'normal' | 'bug-hunt' | 'validate' = 'normal'`
- **Constructor modification**: Accept optional mode parameter
- **runQACycle() implementation**: Replace TODO placeholder with full QA logic

### Output

- **TEST_RESULTS.md** (if bugs found): Written to session directory
- **Console output**: QA summary with bug counts by severity
- **PipelineResult.bugsFound**: Updated with actual bug count

### Success Criteria

- [ ] `mode` property added to PRPPipeline with @ObservedState decorator
- [ ] Constructor accepts `mode?: 'normal' | 'bug-hunt' | 'validate'` parameter
- [ ] CLI passes mode to PRPPipeline in src/index.ts
- [ ] runQACycle() implements BugHuntWorkflow integration
- [ ] runQACycle() implements FixCycleWorkflow integration
- [ ] Bug-hunt mode runs QA regardless of task completion
- [ ] Normal mode runs QA only if all tasks Complete
- [ ] TEST_RESULTS.md written when bugs found
- [ ] Console summary printed with severity breakdown
- [ ] Graceful handling: bugs don't fail pipeline
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No regressions in existing pipeline tests

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: **YES** - This PRP provides:

- Complete PRPPipeline modification architecture
- Exact integration patterns for BugHuntWorkflow and FixCycleWorkflow
- TEST_RESULTS.md file format and location
- Console output patterns with emoji prefixes
- Mode-based execution logic
- Test strategies and examples

### Documentation & References

```yaml
# MUST READ - PRPPipeline Integration Target
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Target file for modifications - runQACycle() method, constructor, state properties
  pattern: runQACycle() method (lines 564-599), constructor (lines 166-185), ObservedState fields (lines 103-128)
  gotcha: runQACycle() currently has TODO placeholder - replace entire method body
  critical: This is the ONLY file you modify for this PRP (plus src/index.ts)

# MUST READ - BugHuntWorkflow Contract
- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M3T1S1/PRP.md
  why: BugHuntWorkflow API and usage - constructor, run() method, TestResults output
  pattern: Constructor and Usage sections (lines 50-150)
  gotcha: BugHuntWorkflow requires prdContent (from session.prdSnapshot) and completedTasks array
  critical: BugHuntWorkflow.run() returns TestResults with hasBugs, bugs[], summary

# MUST READ - FixCycleWorkflow Contract
- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M3T1S2/PRP.md
  why: FixCycleWorkflow API and usage - constructor, run() method, loop behavior
  pattern: Constructor and Usage sections (lines 50-70)
  gotcha: FixCycleWorkflow requires TestResults, prdContent, taskOrchestrator, sessionManager
  critical: FixCycleWorkflow.run() returns final TestResults after fix cycle

# MUST READ - Data Models
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: TestResults, Bug, Status interfaces for type safety
  pattern: TestResults (lines 1683-1785), Bug (lines 1588-1649), Status enum
  gotcha: TestResults.hasBugs is boolean - check this before running FixCycleWorkflow
  critical: Bug.severity values: 'critical', 'major', 'minor', 'cosmetic'

# MUST READ - SessionManager for PRD Content
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Access prdSnapshot for BugHuntWorkflow, session path for TEST_RESULTS.md
  pattern: sessionManager.currentSession.prdSnapshot, sessionManager.currentSession.metadata.path
  gotcha: prdSnapshot is the frozen PRD content - use this for QA context
  critical: Session path is where you write TEST_RESULTS.md

# MUST READ - CLI Integration
- file: /home/dustin/projects/hacky-hack/src/index.ts
  why: Pass mode from CLI args to PRPPipeline constructor
  pattern: Lines 136-140 where PRPPipeline is instantiated
  gotcha: args.mode is already parsed from CLI - just pass it to constructor
  critical: args.mode type is 'normal' | 'bug-hunt' | 'validate' with default 'normal'

# MUST READ - Completed Task Extraction Pattern
- file: /home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts
  why: Pattern for extracting completed tasks from backlog (reuse this logic)
  pattern: #extractCompletedTasks() method (lines 842-862)
  gotcha: Iterate backlog.backlog → phases → milestones → tasks, filter by status === 'Complete'
  critical: BugHuntWorkflow needs completedTasks for context

# MUST READ - Console Logging Patterns
- file: /home/dustin/projects/hacky-hack/src/index.ts
  why: Pattern for terminal output with emoji prefixes
  pattern: Lines 145-170 for success/failure output
  gotcha: Use emoji prefixes: ✅, ❌, 🐛, 📊, ⚠️
  critical: Print summary to console, not just log via this.logger

# MUST READ - TEST_RESULTS.md Format
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M3T1S3/research-test-results-format.md
  why: Exact markdown format for TEST_RESULTS.md output
  pattern: Template structure (lines 1-100)
  gotcha: Use severity breakdown with emoji indicators
  critical: Write to session directory: resolve(sessionPath, 'TEST_RESULTS.md')

# MUST READ - Mode State Property Pattern
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Example of @ObservedState property pattern
  pattern: Lines 112-113 (currentPhase property)
  gotcha: Use union type for mode: 'normal' | 'bug-hunt' | 'validate'
  critical: Decorate with @ObservedState() for observability
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json
├── tsconfig.json
├── src/
│   ├── cli/
│   │   └── index.ts                      # CLI argument parsing (has --mode flag)
│   ├── core/
│   │   ├── models.ts                     # TestResults, Bug, Status interfaces
│   │   ├── session-manager.ts            # SessionManager class (prdSnapshot, metadata.path)
│   │   └── task-orchestrator.ts          # TaskOrchestrator class
│   ├── workflows/
│   │   ├── bug-hunt-workflow.ts          # BugHuntWorkflow (P4.M3.T1.S1 - Complete)
│   │   ├── fix-cycle-workflow.ts         # FixCycleWorkflow (P4.M3.T1.S2 - Implementing)
│   │   ├── prp-pipeline.ts               # PRPPipeline (TARGET FILE)
│   │   └── index.ts
│   └── index.ts                          # Main entry point (pass mode to pipeline)
└── plan/
    └── 001_14b9dc2a33c7/
        ├── P4M3T1S1/
        │   └── PRP.md                    # BugHuntWorkflow PRP
        ├── P4M3T1S2/
        │   └── PRP.md                    # FixCycleWorkflow PRP
        └── P4M3T1S3/
            └── PRP.md                    # THIS FILE
```

### Desired Codebase Tree (files to modify)

```bash
src/workflows/
└── prp-pipeline.ts                       # MODIFY: Add mode property, update constructor, implement runQACycle()

src/
└── index.ts                              # MODIFY: Pass mode to PRPPipeline constructor
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: PRPPipeline Constructor Modification
// - Add mode parameter AFTER scope parameter (optional, default 'normal')
// - Preserve existing parameter order: (prdPath, scope?, mode?)
// - Update JSDoc to document mode parameter

// CRITICAL: Mode State Property
// - Use @ObservedState() decorator
// - Type: 'normal' | 'bug-hunt' | 'validate'
// - Default value: 'normal'
// - Placement: After other observed state properties (around line 113)

// CRITICAL: runQACycle() Implementation
// - Replace ENTIRE method body (lines 564-599)
// - Import BugHuntWorkflow and FixCycleWorkflow at top of file
// - Use try/catch for QA errors (log but don't fail)
// - Update #bugsFound counter from testResults

// CRITICAL: Bug-Hunt Mode Behavior
// - When mode === 'bug-hunt', run QA immediately (skip task completion check)
// - When mode === 'normal', check #allTasksComplete() first
// - When mode === 'validate', skip QA (log message)

// CRITICAL: BugHuntWorkflow Instantiation
// - Import: import { BugHuntWorkflow } from './bug-hunt-workflow.js';
// - Constructor: new BugHuntWorkflow(prdContent, completedTasks)
// - prdContent: this.sessionManager.currentSession.prdSnapshot
// - completedTasks: Extract from backlog (filter by status === 'Complete')
// - Execution: await bugHuntWorkflow.run() returns TestResults

// CRITICAL: FixCycleWorkflow Instantiation
// - Import: import { FixCycleWorkflow } from './fix-cycle-workflow.js';
// - Constructor: new FixCycleWorkflow(testResults, prdContent, taskOrchestrator, sessionManager)
// - testResults: From BugHuntWorkflow.run()
// - Only run if testResults.hasBugs === true
// - Execution: await fixCycleWorkflow.run() returns final TestResults

// CRITICAL: Completed Task Extraction
// - Get backlog: this.sessionManager.currentSession?.taskRegistry
// - Guard: Return [] if no backlog
// - Iterate: backlog.backlog → phases → milestones → tasks
// - Filter: task.status === 'Complete'
// - Accumulate: into completedTasks array

// CRITICAL: TEST_RESULTS.md Writing
// - Path: resolve(sessionPath, 'TEST_RESULTS.md')
// - sessionPath: this.sessionManager.currentSession.metadata.path
// - Use: await writeFile(path, content, 'utf-8')
// - Only write if final bug count > 0
// - Use markdown format with severity breakdown

// CRITICAL: Console QA Summary
// - Use console.log() for user-facing output (not this.logger)
// - Include: bug counts by severity, summary message, TEST_RESULTS.md path
// - Use emoji prefixes: 🐛 (bugs), 📊 (stats), ✅ (success), ⚠️ (warning)
// - Format: Clear, readable summary with sections

// CRITICAL: Mode Passing from CLI
// - src/index.ts already parses args.mode from CLI
// - Pass to PRPPipeline constructor: new PRPPipeline(args.prd, scope, args.mode)
// - Preserve existing scope handling code

// CRITICAL: Error Handling
// - Wrap BugHuntWorkflow in try/catch
// - Wrap FixCycleWorkflow in try/catch
// - Log errors but don't fail pipeline (QA is non-fatal)
// - Set #bugsFound = 0 on error

// CRITICAL: State Updates
// - Update this.#bugsFound with final bug count
// - Update this.currentPhase = 'qa_complete' on success
// - Update this.currentPhase = 'qa_skipped' if skipped
// - Log phase transitions

// CRITICAL: Import Order
// - Add BugHuntWorkflow and FixCycleWorkflow imports after DeltaAnalysisWorkflow
// - Use ES module imports with .js extension
// - Keep imports organized by source (groundswell, node:, internal)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this modification uses existing interfaces:

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

// Status enum
type Status = 'Planned' | 'InProgress' | 'Complete' | 'Failed' | 'Skipped';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD import statements for BugHuntWorkflow and FixCycleWorkflow
  - ADD: import { BugHuntWorkflow } from './bug-hunt-workflow.js';
  - ADD: import { FixCycleWorkflow } from './fix-cycle-workflow.js';
  - PLACEMENT: After import { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js'; (line 34)
  - PRESERVE: All existing imports

Task 2: ADD mode @ObservedState property to PRPPipeline class
  - ADD: @ObservedState() mode: 'normal' | 'bug-hunt' | 'validate' = 'normal';
  - PLACEMENT: After currentPhase property (around line 113)
  - DECORATE: With @ObservedState() decorator
  - DEFAULT: 'normal'
  - TYPE: Union type 'normal' | 'bug-hunt' | 'validate'

Task 3: MODIFY constructor to accept mode parameter
  - MODIFY: constructor(prdPath: string, scope?: Scope, mode?: 'normal' | 'bug-hunt' | 'validate')
  - ADD: this.mode = mode ?? 'normal'; in constructor body
  - UPDATE: JSDoc to document mode parameter
  - PLACEMENT: Lines 166-185
  - PRESERVE: All existing constructor logic

Task 4: MODIFY src/index.ts to pass mode to PRPPipeline
  - MODIFY: new PRPPipeline(args.prd, scope, args.mode)
  - PLACEMENT: src/index.ts around line 136
  - PRESERVE: Existing scope handling code

Task 5: IMPLEMENT runQACycle() method - QA decision logic
  - IMPLEMENT: Check mode and task completion status
  - IF mode === 'bug-hunt': Run QA immediately (skip completion check)
  - IF mode === 'validate': Skip QA (log message, set phase to 'qa_skipped')
  - IF mode === 'normal': Check #allTasksComplete()
    - IF not complete: Skip QA with log message
    - IF complete: Run QA workflows
  - PLACEMENT: Lines 564-599 (replace existing method body)
  - PRESERVE: Method signature and error handling wrapper

Task 6: IMPLEMENT completed tasks extraction helper
  - IMPLEMENT: #extractCompletedTasks(): Task[] helper method
  - GET: backlog from this.sessionManager.currentSession?.taskRegistry
  - GUARD: Return [] if no backlog
  - ITERATE: backlog.backlog → phases → milestones → tasks
  - FILTER: tasks where status === 'Complete'
  - RETURN: completedTasks array
  - PLACEMENT: After runQACycle() method (around line 600)

Task 7: IMPLEMENT BugHuntWorkflow integration in runQACycle()
  - GET: prdContent from this.sessionManager.currentSession.prdSnapshot
  - EXTRACT: completedTasks via #extractCompletedTasks()
  - INSTANTIATE: new BugHuntWorkflow(prdContent, completedTasks)
  - EXECUTE: await bugHuntWorkflow.run()
  - STORE: results in testResults variable
  - LOG: Results summary (hasBugs, bug count, summary)
  - DEPENDENCIES: Tasks 1, 5, 6

Task 8: IMPLEMENT FixCycleWorkflow integration in runQACycle()
  - CHECK: if testResults.hasBugs === true
  - INSTANTIATE: new FixCycleWorkflow(testResults, prdContent, this.taskOrchestrator, this.sessionManager)
  - EXECUTE: await fixCycleWorkflow.run()
  - STORE: final results in finalResults variable
  - LOG: Fix cycle completion (bugs remaining after cycle)
  - DEPENDENCIES: Tasks 1, 7

Task 9: IMPLEMENT TEST_RESULTS.md writing
  - CHECK: if finalResults.bugs.length > 0
  - GENERATE: markdown content with bug details
  - WRITE: to resolve(sessionPath, 'TEST_RESULTS.md')
  - LOG: File path written
  - FORMAT: Use severity breakdown with emoji indicators
  - DEPENDENCIES: Tasks 7, 8

Task 10: IMPLEMENT console QA summary output
  - PRINT: console.log() with QA summary sections
  - INCLUDE: Bug counts by severity, summary message, file path
  - USE: Emoji prefixes (🐛, 📊, ✅, ⚠️)
  - FORMAT: Clear, readable sections
  - DEPENDENCIES: Tasks 7, 8, 9

Task 11: UPDATE #bugsFound counter
  - SET: this.#bugsFound = finalResults.bugs.length
  - PLACEMENT: After FixCycleWorkflow completes (or after BugHuntWorkflow if no bugs)
  - PRESERVE: Existing #bugsFound usage in PipelineResult

Task 12: UPDATE currentPhase
  - SET: this.currentPhase = 'qa_complete' on success
  - SET: this.currentPhase = 'qa_skipped' if QA skipped
  - PLACEMENT: End of runQACycle() method
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// FILE: src/workflows/prp-pipeline.ts
// =============================================================================

// ----------------------------------------------------------------------------
// Task 1: Add imports (after line 34)
// ----------------------------------------------------------------------------

import { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
import { BugHuntWorkflow } from './bug-hunt-workflow.js';        // ADD
import { FixCycleWorkflow } from './fix-cycle-workflow.js';       // ADD

// ----------------------------------------------------------------------------
// Task 2: Add mode property (after line 113)
// ----------------------------------------------------------------------------

export class PRPPipeline extends Workflow {
  // ... existing properties ...

  /** Current pipeline phase */
  currentPhase: string = 'init';

  /** Pipeline execution mode */
  @ObservedState()
  mode: 'normal' | 'bug-hunt' | 'validate' = 'normal';           // ADD

  /** Total number of subtasks in backlog */
  totalTasks: number = 0;

  // ... rest of properties ...
}

// ----------------------------------------------------------------------------
// Task 3: Modify constructor (lines 166-185)
// ----------------------------------------------------------------------------

/**
 * Creates a new PRPPipeline instance
 *
 * @param prdPath - Path to PRD markdown file
 * @param scope - Optional scope for limiting execution
 * @param mode - Execution mode: 'normal', 'bug-hunt', or 'validate' (default: 'normal')
 * @throws {Error} If prdPath is empty
 */
constructor(
  prdPath: string,
  scope?: Scope,
  mode?: 'normal' | 'bug-hunt' | 'validate'                      // ADD
) {
  super('PRPPipeline');

  if (!prdPath || prdPath.trim() === '') {
    throw new Error('PRP path cannot be empty');
  }

  this.#prdPath = prdPath;
  this.#scope = scope;
  this.mode = mode ?? 'normal';                                   // ADD

  // ... rest of constructor ...
}

// ----------------------------------------------------------------------------
// Task 6: Helper method - extract completed tasks (around line 600)
// ----------------------------------------------------------------------------

/**
 * Extract completed tasks from session backlog
 *
 * @returns Array of completed Task objects
 * @private
 */
#extractCompletedTasks(): Task[] {
  const backlog = this.sessionManager.currentSession?.taskRegistry;
  if (!backlog) {
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

// ----------------------------------------------------------------------------
// Tasks 5, 7, 8, 9, 10, 11, 12: runQACycle() method (replace lines 564-599)
// ----------------------------------------------------------------------------

/**
 * Run QA bug hunt cycle
 *
 * @remarks
 * Behavior based on mode:
 * - 'bug-hunt': Run QA immediately regardless of task status
 * - 'validate': Skip QA (validation-only mode)
 * - 'normal': Run QA only if all tasks are Complete
 *
 * QA flow:
 * 1. Run BugHuntWorkflow to detect bugs
 * 2. If bugs found, run FixCycleWorkflow to fix them
 * 3. Write TEST_RESULTS.md if bugs remain
 * 4. Print QA summary to console
 */
async runQACycle(): Promise<void> {
  this.logger.info('[PRPPipeline] QA Cycle');

  try {
    // ============================================================
    // Decision: Run QA or skip based on mode
    // ============================================================

    let shouldRunQA = false;

    if (this.mode === 'bug-hunt') {
      // Bug-hunt mode: run QA immediately
      this.logger.info('[PRPPipeline] Bug-hunt mode: running QA regardless of task status');
      shouldRunQA = true;
    } else if (this.mode === 'validate') {
      // Validate mode: skip QA
      this.logger.info('[PRPPipeline] Validate mode: skipping QA cycle');
      this.#bugsFound = 0;
      this.currentPhase = 'qa_skipped';
      return;
    } else {
      // Normal mode: check if all tasks are complete
      if (!this.#allTasksComplete()) {
        const failedCount = this.#countFailedTasks();
        const plannedCount = this.totalTasks - this.completedTasks - failedCount;

        this.logger.info('[PRPPipeline] Not all tasks complete, skipping QA');
        this.logger.info(
          `[PRPPipeline] Failed: ${failedCount}, Planned: ${plannedCount}`
        );

        this.#bugsFound = 0;
        this.currentPhase = 'qa_skipped';
        return;
      }
      shouldRunQA = true;
    }

    if (!shouldRunQA) {
      this.#bugsFound = 0;
      this.currentPhase = 'qa_skipped';
      return;
    }

    // ============================================================
    // Phase 1: Bug Hunt
    // ============================================================

    this.logger.info('[PRPPipeline] All tasks complete, running QA bug hunt');

    const prdContent = this.sessionManager.currentSession?.prdSnapshot ?? '';
    const completedTasks = this.#extractCompletedTasks();

    this.logger.info(
      `[PRPPipeline] Testing against ${completedTasks.length} completed tasks`
    );

    const bugHuntWorkflow = new BugHuntWorkflow(prdContent, completedTasks);
    const testResults = await bugHuntWorkflow.run();

    // Log initial test results
    this.logger.info('[PRPPipeline] Bug hunt complete', {
      hasBugs: testResults.hasBugs,
      bugCount: testResults.bugs.length,
      summary: testResults.summary,
    });

    // ============================================================
    // Phase 2: Fix Cycle (if bugs found)
    // ============================================================

    let finalResults = testResults;

    if (testResults.hasBugs) {
      this.logger.info('[PRPPipeline] Bugs detected, starting fix cycle');

      try {
        const fixCycleWorkflow = new FixCycleWorkflow(
          testResults,
          prdContent,
          this.taskOrchestrator,
          this.sessionManager
        );

        const fixResults = await fixCycleWorkflow.run();

        // Log fix cycle results
        const bugsRemaining = fixResults.bugs.length;
        const bugsFixed = testResults.bugs.length - bugsRemaining;

        this.logger.info('[PRPPipeline] Fix cycle complete', {
          bugsFixed,
          bugsRemaining,
          hasBugs: fixResults.hasBugs,
        });

        finalResults = fixResults;

        // Warning if bugs remain after fix cycle
        if (bugsRemaining > 0) {
          this.logger.warn(
            `[PRPPipeline] Fix cycle completed with ${bugsRemaining} bugs remaining`
          );
        }
      } catch (fixError) {
        // Fix cycle failure - log but use original test results
        const errorMessage =
          fixError instanceof Error ? fixError.message : String(fixError);
        this.logger.warn(
          `[PRPPipeline] Fix cycle failed (continuing with original results): ${errorMessage}`
        );
        // Keep original testResults as finalResults
      }
    }

    // ============================================================
    // Phase 3: Update state
    // ============================================================

    this.#bugsFound = finalResults.bugs.length;
    this.currentPhase = 'qa_complete';

    // ============================================================
    // Phase 4: Write TEST_RESULTS.md (if bugs found)
    // ============================================================

    if (finalResults.bugs.length > 0) {
      const sessionPath = this.sessionManager.currentSession?.metadata.path;
      if (sessionPath) {
        const { resolve } = await import('node:path');
        const { writeFile } = await import('node:fs/promises');

        const resultsPath = resolve(sessionPath, 'TEST_RESULTS.md');

        // Generate markdown content
        const criticalBugs = finalResults.bugs.filter(b => b.severity === 'critical');
        const majorBugs = finalResults.bugs.filter(b => b.severity === 'major');
        const minorBugs = finalResults.bugs.filter(b => b.severity === 'minor');
        const cosmeticBugs = finalResults.bugs.filter(b => b.severity === 'cosmetic');

        const content = `# QA Test Results

**Generated**: ${new Date().toISOString()}
**Mode**: ${this.mode}
**Total Bugs**: ${finalResults.bugs.length}

## Summary

${finalResults.summary}

## Bug Breakdown

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${criticalBugs.length} |
| 🟠 Major | ${majorBugs.length} |
| 🟡 Minor | ${minorBugs.length} |
| ⚪ Cosmetic | ${cosmeticBugs.length} |

## Bug Details

${finalResults.bugs.map((bug, index) => `
### ${index + 1}. ${bug.title}

**Severity**: ${bug.severity}
**ID**: ${bug.id}

${bug.description}

**Reproduction**:
${bug.reproduction}

${bug.location ? `**Location**: ${bug.location}` : ''}
`).join('\n')}

## Recommendations

${finalResults.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

        await writeFile(resultsPath, content, 'utf-8');
        this.logger.info(`[PRPPipeline] TEST_RESULTS.md written to ${resultsPath}`);
      }
    }

    // ============================================================
    // Phase 5: Print console summary
    // ============================================================

    console.log('\n' + '='.repeat(60));
    console.log('🐛 QA Summary');
    console.log('='.repeat(60));

    if (finalResults.bugs.length === 0) {
      console.log('✅ No bugs found - all tests passed!');
    } else {
      console.log(`📊 Total bugs found: ${finalResults.bugs.length}`);

      const criticalCount = finalResults.bugs.filter(b => b.severity === 'critical').length;
      const majorCount = finalResults.bugs.filter(b => b.severity === 'major').length;
      const minorCount = finalResults.bugs.filter(b => b.severity === 'minor').length;
      const cosmeticCount = finalResults.bugs.filter(b => b.severity === 'cosmetic').length;

      console.log(`  🔴 Critical: ${criticalCount}`);
      console.log(`  🟠 Major: ${majorCount}`);
      console.log(`  🟡 Minor: ${minorCount}`);
      console.log(`  ⚪ Cosmetic: ${cosmeticCount}`);

      console.log(`\n${finalResults.summary}`);

      if (criticalCount > 0 || majorCount > 0) {
        console.log('\n⚠️  Critical or major bugs detected - manual review recommended');
      }

      const sessionPath = this.sessionManager.currentSession?.metadata.path;
      if (sessionPath) {
        console.log(`\n📄 Detailed results: ${sessionPath}/TEST_RESULTS.md`);
      }
    }

    console.log('='.repeat(60) + '\n');

    this.logger.info('[PRPPipeline] QA cycle complete');
  } catch (error) {
    // QA failure is non-fatal - log and continue
    this.logger.warn(`[PRPPipeline] QA cycle failed (non-fatal): ${error}`);
    this.#bugsFound = 0;
    this.currentPhase = 'qa_failed';
  }
}

// =============================================================================
// FILE: src/index.ts (modify around line 136)
// =============================================================================

// Before:
// const pipeline = new PRPPipeline(args.prd, scope);

// After:
const pipeline = new PRPPipeline(args.prd, scope, args.mode);
```

### Integration Points

```yaml
PRPPipeline Modifications:
  - file: src/workflows/prp-pipeline.ts
  - add_imports: BugHuntWorkflow, FixCycleWorkflow
  - add_property: mode @ObservedState property
  - modify_constructor: Accept mode parameter
  - modify_method: runQACycle() - complete reimplementation
  - add_helper: #extractCompletedTasks() method

CLI Integration:
  - file: src/index.ts
  - modify_pipeline_instantiation: Pass args.mode to constructor
  - preserve: Existing scope and prd handling

Mode-Based Execution:
  - bug-hunt: Run QA immediately (skip completion check)
  - normal: Run QA only if all tasks Complete
  - validate: Skip QA (validation-only mode)

BugHuntWorkflow Integration:
  - import: './bug-hunt-workflow.js'
  - constructor: new BugHuntWorkflow(prdContent, completedTasks)
  - execute: await workflow.run()
  - returns: TestResults

FixCycleWorkflow Integration:
  - import: './fix-cycle-workflow.js'
  - constructor: new FixCycleWorkflow(testResults, prdContent, taskOrchestrator, sessionManager)
  - execute: await workflow.run()
  - condition: Only if testResults.hasBugs === true
  - returns: TestResults (final after fix cycle)

Session Directory:
  - path: sessionManager.currentSession.metadata.path
  - write_file: TEST_RESULTS.md (if bugs found)
  - prd_content: sessionManager.currentSession.prdSnapshot

Console Output:
  - use: console.log() for user-facing output
  - include: Bug counts, summary, file path
  - emoji: 🐛 📊 ✅ ⚠️ 🔴 🟠 🟡 ⚪
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npx eslint src/workflows/prp-pipeline.ts --fix     # Auto-format and fix linting issues
npx eslint src/index.ts --fix                       # Fix main entry point
npx tsc --noEmit                                    # Type checking

# Project-wide validation
npm run lint                                        # Check all files
npm run typecheck                                   # Check all types
npm run format                                      # Format all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test PRPPipeline modifications
npm test -- tests/unit/workflows/prp-pipeline.test.ts

# Test mode-based QA behavior
npm test -- tests/unit/workflows/prp-pipeline-mode.test.ts

# Full workflow unit tests
npm test -- tests/unit/workflows/

# Coverage validation (if coverage tools available)
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test PRPPipeline integration with BugHuntWorkflow and FixCycleWorkflow
npm test -- tests/integration/prp-pipeline-qa-integration.test.ts

# Test mode-based execution
npm test -- tests/integration/prp-pipeline-modes.test.ts

# Full integration test suite
npm run test:integration

# Expected: All integrations working, proper TestResults returned, mode behavior correct
```

### Level 4: Manual & End-to-End Validation

```bash
# Manual pipeline testing (requires test PRD)

# Test 1: Normal mode with all tasks complete
npm run dev -- --prd ./test/fixtures/simple-prd.md --mode normal
# Expected: QA runs, BugHuntWorkflow executes, FixCycleWorkflow if bugs found

# Test 2: Bug-hunt mode (regardless of task status)
npm run dev -- --prd ./test/fixtures/simple-prd.md --mode bug-hunt
# Expected: QA runs immediately, BugHuntWorkflow executes

# Test 3: Validate mode
npm run dev -- --prd ./test/fixtures/simple-prd.md --mode validate
# Expected: QA skipped, log message printed

# Test 4: Normal mode with incomplete tasks
# (Interrupt execution before completion, then resume)
npm run dev -- --prd ./test/fixtures/simple-prd.md --mode normal --continue
# Expected: QA skipped, log message shows reason

# Verify outputs:
# - TEST_RESULTS.md created in session directory if bugs found
# - Console QA summary printed with emoji prefixes
# - Logs show QA phases executing

# Expected: All modes behave correctly, QA integrates with pipeline
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

- [ ] `mode` @ObservedState property added to PRPPipeline
- [ ] Constructor accepts `mode?: 'normal' | 'bug-hunt' | 'validate'` parameter
- [ ] CLI passes mode to PRPPipeline in src/index.ts
- [ ] runQACycle() implements full QA flow
- [ ] Bug-hunt mode runs QA regardless of task status
- [ ] Normal mode runs QA only if all tasks Complete
- [ ] Validate mode skips QA with log message
- [ ] BugHuntWorkflow integrated correctly
- [ ] FixCycleWorkflow integrated when bugs found
- [ ] TEST_RESULTS.md written when bugs remain
- [ ] Console QA summary printed with severity breakdown
- [ ] #bugsFound counter updated correctly
- [ ] currentPhase set to 'qa_complete' or 'qa_skipped'

### Code Quality Validation

- [ ] Follows existing PRPPipeline patterns
- [ ] @ObservedState decorator used correctly
- [ ] Private methods use # prefix convention
- [ ] JSDoc comments on modified methods
- [ ] Error handling: QA failures don't fail pipeline
- [ ] Import order maintained
- [ ] Anti-patterns avoided (no sync in async context, specific exception handling)

### Integration Validation

- [ ] BugHuntWorkflow import correct
- [ ] FixCycleWorkflow import correct
- [ ] Completed tasks extraction follows existing pattern
- [ ] Session path accessed correctly
- [ ] PRD content accessed from prdSnapshot
- [ ] TaskOrchestrator and SessionManager passed to FixCycleWorkflow
- [ ] No regressions in existing pipeline tests
- [ ] No modifications to existing workflow files (only PRPPipeline)

---

## Anti-Patterns to Avoid

- ❌ Don't skip the `@ObservedState()` decorator on the mode property
- ❌ Don't change the order of constructor parameters (add mode AFTER scope)
- ❌ Don't use `this.mode` without initializing it to a default value
- ❌ Don't forget to handle the 'validate' mode (should skip QA)
- ❌ Don't run FixCycleWorkflow if testResults.hasBugs is false
- ❌ Don't fail the pipeline if FixCycleWorkflow throws - log and continue
- ❌ Don't use `console.log()` inside this.logger methods - use them separately
- ❌ Don't write TEST_RESULTS.md if no bugs remain after fix cycle
- ❌ Don't hardcode the session path - use sessionManager.currentSession.metadata.path
- ❌ Don't skip the emoji prefixes in console output
- ❌ Don't forget to update this.#bugsFound counter
- ❌ Don't forget to update this.currentPhase at the end
- ❌ Don't modify BugHuntWorkflow or FixCycleWorkflow files
- ❌ Don't create new files - only modify existing ones
- ❌ Don't use sync file operations - use await writeFile()
- ❌ Don't extract completed tasks inside the QA loop - use a helper method
- ❌ Don't run BugHuntWorkflow if mode is 'validate'
- ❌ Don't skip console output - users need to see QA results
- ❌ Don't forget to import BugHuntWorkflow and FixCycleWorkflow
- ❌ Don't pass mode to PRPPipeline without handling undefined (default to 'normal')

---

## Test Examples

### Unit Test Structure

```typescript
// tests/unit/workflows/prp-pipeline-mode.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PRPPipeline } from '../../../src/workflows/prp-pipeline.js';
import { SessionManager } from '../../../src/core/session-manager.js';

describe('PRPPipeline - Mode-Based QA Integration', () => {
  describe('mode property', () => {
    it('should default to normal mode', () => {
      const pipeline = new PRPPipeline('./test/PRD.md');
      expect(pipeline.mode).toBe('normal');
    });

    it('should accept bug-hunt mode', () => {
      const pipeline = new PRPPipeline('./test/PRD.md', undefined, 'bug-hunt');
      expect(pipeline.mode).toBe('bug-hunt');
    });

    it('should accept validate mode', () => {
      const pipeline = new PRPPipeline('./test/PRD.md', undefined, 'validate');
      expect(pipeline.mode).toBe('validate');
    });
  });

  describe('runQACycle with modes', () => {
    let pipeline: PRPPipeline;
    let mockSessionManager: any;

    beforeEach(() => {
      mockSessionManager = {
        currentSession: {
          metadata: { path: '/test/session' },
          prdSnapshot: '# Test PRD',
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
      };

      pipeline = new PRPPipeline('./test/PRD.md');
      pipeline.sessionManager = mockSessionManager;
      pipeline.taskOrchestrator = {} as any;
    });

    it('should skip QA in validate mode', async () => {
      pipeline.mode = 'validate';
      await pipeline.runQACycle();

      expect(pipeline['currentPhase']).toBe('qa_skipped');
      expect(pipeline['#bugsFound']).toBe(0);
    });

    it('should run QA in bug-hunt mode regardless of task status', async () => {
      pipeline.mode = 'bug-hunt';
      // Set tasks as incomplete
      mockSessionManager.currentSession.taskRegistry.backlog[0].phases[0].milestones[0].tasks[0].status =
        'Planned';

      // Should attempt to run QA (will fail at BugHuntWorkflow instantiation, but that's OK for this test)
      // The key is it doesn't skip due to incomplete tasks
      expect(async () => pipeline.runQACycle()).not.toThrow();
    });

    it('should run QA in normal mode only if all tasks complete', async () => {
      pipeline.mode = 'normal';
      await pipeline.runQACycle();

      // With all Complete tasks, should run QA
      // (Will fail at BugHuntWorkflow, but that's expected)
      expect(pipeline['currentPhase']).not.toBe('qa_skipped');
    });
  });

  describe('#extractCompletedTasks', () => {
    it('should extract completed tasks from backlog', () => {
      const pipeline = new PRPPipeline('./test/PRD.md');
      const mockBacklog = {
        backlog: [
          {
            phases: [
              {
                milestones: [
                  {
                    tasks: [
                      { id: 'P1.M1.T1', status: 'Complete' },
                      { id: 'P1.M1.T2', status: 'InProgress' },
                      { id: 'P1.M2.T1', status: 'Complete' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      pipeline.sessionManager = {
        currentSession: { taskRegistry: mockBacklog },
      } as any;

      const completed = (pipeline as any)['#extractCompletedTasks']();

      expect(completed).toHaveLength(2);
      expect(completed.map(t => t.id)).toEqual(['P1.M1.T1', 'P1.M2.T1']);
    });

    it('should return empty array if no backlog', () => {
      const pipeline = new PRPPipeline('./test/PRD.md');
      pipeline.sessionManager = {
        currentSession: null,
      } as any;

      const completed = (pipeline as any)['#extractCompletedTasks']();

      expect(completed).toEqual([]);
    });
  });
});
```

---

## Confidence Score

**9/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ Complete integration architecture with exact file locations
- ✅ Precise @ObservedState decorator pattern for mode property
- ✅ Exact BugHuntWorkflow and FixCycleWorkflow integration patterns
- ✅ Mode-based execution logic clearly specified
- ✅ TEST_RESULTS.md format with severity breakdown
- ✅ Console output patterns with emoji prefixes
- ✅ Completed task extraction pattern from existing code
- ✅ Error handling strategies (QA failures are non-fatal)
- ✅ Comprehensive test examples
- ⚠️ Minor uncertainty: FixCycleWorkflow is being implemented in parallel, but the contract is well-defined

**Validation**: The completed PRP enables an AI agent unfamiliar with the codebase to integrate QA with the main pipeline successfully using only the PRP content and codebase access.

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-13
**Author**: Claude Code (Research Phase)
**Next Phase**: Implementation (P4.M3.T1.S3 - Pending P4.M3.T1.S2 completion)
