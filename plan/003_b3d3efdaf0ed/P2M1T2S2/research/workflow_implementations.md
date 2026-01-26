# Workflow Implementations Research

**Research Date:** 2026-01-23
**Work Item:** P2.M1.T2.S2 - Create workflow documentation

## Workflow Files Analyzed

### 1. src/workflows/index.ts

**Purpose:** Central export point for all workflow classes
**Exports:** PRPPipeline, DeltaAnalysisWorkflow, BugHuntWorkflow, FixCycleWorkflow, HelloWorld

### 2. src/workflows/prp-pipeline.ts (59,177 bytes)

**Purpose:** Main workflow for complete PRD implementation

**Lifecycle Phases:**

1. **Session Initialization** (`initializeSession()`)
2. **PRD Decomposition** (`decomposePRD()`) - if new session
3. **Delta Handling** (`handleDelta()`) - if PRD changed
4. **Backlog Execution** (`executeBacklog()`)
5. **QA Cycle** (`runQACycle()`)
6. **Cleanup** (`cleanup()`)

**Key Features:**

- Uses `@Step({ trackTiming: true })` for timing tracking
- Supports graceful shutdown via SIGINT/SIGTERM
- Resource monitoring (max tasks, duration limits)
- Error handling with continuation strategies
- Session persistence and state management

**Entry Point:** `run()` method orchestrates entire pipeline
**Exit Point:** Returns `PipelineResult` with execution summary

### 3. src/workflows/delta-analysis-workflow.ts (6,133 bytes)

**Purpose:** PRD changes analysis

**Lifecycle Phases:**

1. **Delta Analysis** (`analyzeDelta()`)

**Key Features:**

- Single step workflow with `@Step({ trackTiming: true })`
- Compares old vs new PRD versions
- Uses QA agent for semantic comparison
- Generates structured `DeltaAnalysis` output
- Creates patch instructions for affected tasks

### 4. src/workflows/bug-hunt-workflow.ts (12,658 bytes)

**Purpose:** Three-phase QA testing

**Lifecycle Phases:**

1. **Scope Analysis** (`analyzeScope()`)
2. **Creative E2E Testing** (`creativeE2ETesting()`)
3. **Adversarial Testing** (`adversarialTesting()`)
4. **Generate Report** (`generateReport()`)

**Key Features:**

- Four phases with `@Step({ trackTiming: true })` on each
- Uses QA agent with adversarial mindset
- Three-tier testing approach (scope → creative → adversarial)
- Generates `TestResults` with severity classification
- Integrates with bug fix pipeline

### 5. src/workflows/fix-cycle-workflow.ts (14,183 bytes)

**Purpose:** Iterative bug fixing

**Lifecycle Phases:**

1. **Create Fix Tasks** (`createFixTasks()`)
2. **Execute Fixes** (`executeFixes()`)
3. **Re-test** (`retest()`)
4. **Check Completion** (`checkComplete()`)

**Key Features:**

- Iterative loop (max 3 iterations) with `@Step({ trackTiming: true })`
- Converts bugs to fix subtasks
- Executes fixes via TaskOrchestrator
- Re-runs BugHuntWorkflow for verification
- Stops when no critical/major bugs remain

## Groundswell Workflow Integration

All workflows extend `Workflow` from the 'groundswell' library:

**Base Class Provides:**

- Base lifecycle management (idle → running → completed/failed)
- State tracking with `this.setStatus()`
- Logging capabilities via `this.logger`
- Correlation ID support for distributed tracing
- Decorator support for `@Step` and `@Task`

**@Step Decorator Pattern:**

```typescript
@Step({ trackTiming: true })
async stepMethod(): Promise<Type> {
  // Implementation
}
```

**Common Workflow Pattern:**

```typescript
export class WorkflowName extends Workflow {
  publicField: Type;

  constructor(params) {
    super('WorkflowName');
    // Initialization
  }

  @Step({ trackTiming: true })
  async stepMethod(): Promise<Type> {
    // Implementation
  }

  async run(): Promise<ResultType> {
    this.setStatus('running');
    // Execute steps
    this.setStatus('completed');
    return result;
  }
}
```

## State Transitions

All workflows follow: `idle → running → completed/failed`

Status updates via:

- `this.setStatus('running')`
- `this.setStatus('completed')`
- `this.setStatus('failed')`

## Integration Points

- **PRPPipeline** coordinates all other workflows
- **DeltaAnalysisWorkflow** handles PRD changes
- **BugHuntWorkflow** called by PRPPipeline and FixCycleWorkflow
- **FixCycleWorkflow** integrates with TaskOrchestrator and SessionManager
