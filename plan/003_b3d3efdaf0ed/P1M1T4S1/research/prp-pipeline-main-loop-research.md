# PRPPipeline Main Execution Loop Research

## PRPPipeline Class Structure

### Location

- **File**: `src/workflows/prp-pipeline.ts`
- **Lines**: 1848 lines total
- **Extends**: `Groundswell Workflow`

### Key Properties

| Property            | Type                       | Description                                                                   |
| ------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `sessionManager`    | `SessionManager`           | Manages session state, persistence, and PRD hash-based identification         |
| `taskOrchestrator`  | `TaskOrchestrator`         | Handles task execution hierarchy and queue management                         |
| `correlationLogger` | `CorrelationLogger`        | Structured logging with correlation ID for tracing                            |
| `runtime`           | `PRPRuntime \| null`       | PRPRuntime instance for subtask execution (null until session initialization) |
| `currentPhase`      | `string`                   | Tracks current pipeline phase                                                 |
| `totalTasks`        | `number`                   | Total tasks in backlog (progress tracking)                                    |
| `completedTasks`    | `number`                   | Completed tasks count (progress tracking)                                     |
| `#failedTasks`      | `Map<string, TaskFailure>` | Private map tracking failed tasks with error context                          |
| `shutdownRequested` | `boolean`                  | Flag for graceful shutdown handling                                           |
| `shutdownReason`    | `string \| undefined`      | Reason for shutdown (SIGINT, SIGTERM, RESOURCE_LIMIT)                         |

### Key Methods

| Method                | Description                                           | Location        |
| --------------------- | ----------------------------------------------------- | --------------- |
| `run()`               | Main entry point that orchestrates all workflow steps | Lines ~180-250  |
| `initializeSession()` | Session initialization from PRD hash                  | Lines ~260-320  |
| `decomposePRD()`      | Generate task backlog via Architect agent             | Lines ~330-390  |
| `executeBacklog()`    | **Main execution loop processing tasks**              | Lines ~768-870  |
| `runQACycle()`        | QA bug hunt and fix cycle                             | Lines ~880-950  |
| `cleanup()`           | State preservation and resource cleanup               | Lines ~960-1020 |

## Main Execution Loop (executeBacklog Method)

### Loop Structure

The `executeBacklog()` method implements the main task processing loop:

```typescript
// Process items until queue is empty or shutdown requested
while (await this.taskOrchestrator.processNextItem()) {
  try {
    // Process individual item
    iterations++;
    this.completedTasks = this.#countCompletedTasks();

    // Check resource limits after each task
    if (this.#resourceMonitor?.shouldStop()) {
      this.shutdownRequested = true;
      break;
    }

    // Check for shutdown request
    if (this.shutdownRequested) {
      break;
    }
  } catch (taskError) {
    // Track failure but continue processing
    this.#trackFailure(taskId, taskError);
  }
}
```

### Task Processing Flow

1. **Queue Processing**: Uses `TaskOrchestrator.processNextItem()` which processes items in FIFO order
2. **Progress Tracking**: Updates `completedTasks` count and tracks progress via `ProgressTracker`
3. **Resource Monitoring**: Checks task/duration limits after each completion
4. **Shutdown Handling**: Gracefully handles SIGINT/SIGTERM signals
5. **Error Resilience**: Individual task failures are tracked but don't stop the pipeline

### Termination Conditions

The loop terminates when:

1. `processNextItem()` returns `false` (queue empty)
2. `shutdownRequested` is `true` (graceful shutdown)
3. Resource limit exceeded (`#resourceMonitor.shouldStop()` returns true)
4. Max iterations exceeded (safety check at 10,000 iterations)

## Session Initialization Process

### PRD Hash-Based Session Discovery

1. **Hash PRD**: Computes SHA-256 hash of PRD content for session identification
2. **Search Existing**: Looks for session directory with matching hash in `plan/` directory
3. **Load or Create**:
   - If found: Loads existing session with validation
   - If not found: Creates new session directory with incremented sequence

### Session Structure

```
plan/
├── 001_<hash>/          # Session directory
│   ├── prd_snapshot.md  # Original PRD content
│   ├── tasks.json       # Task registry
│   └── artifacts/      # Generated artifacts
```

### Delta Session Handling

If PRD changes are detected, the pipeline:

1. Loads old PRD from session snapshot
2. Loads new PRD from disk
3. Extracts completed task IDs
4. Runs `DeltaAnalysisWorkflow` to determine affected tasks
5. Patches backlog using `TaskPatcher`
6. Creates delta session preserving completed work

## Task Queue and Processing Logic

### Task Hierarchy

The pipeline processes tasks in this hierarchy:

```
Phase → Milestone → Task → Subtask
```

### TaskOrchestrator Processing

1. **Queue Construction**: Builds execution queue from scope (all items by default)
2. **Type Dispatch**: Uses `#delegateByType()` to route to appropriate handler
3. **Phase/Milestone/Task Execution**: Sets status to 'Implementing' and processes children
4. **Subtask Execution**: Main execution unit with dependency checking

### Subtask Execution Flow

1. **Status Progression**: `Planned` → `Researching` → `Implementing` → `Complete/Failed`
2. **Dependency Check**: Uses `canExecute()` to verify all dependencies are `Complete`
3. **Research Phase**: Generates PRP via `PRPGenerator` (checks cache first)
4. **Implementation Phase**: Executes PRP via `PRPRuntime/Coder` agent
5. **Result Handling**: Sets final status and commits changes

## Error Handling for Individual Task Failures

### Failure Tracking

- `#trackFailure()` method creates `TaskFailure` records with:
  - Task ID and title
  - Error object and message
  - Error code (if available)
  - Timestamp
  - Phase/milestone context

### Error Resilience

1. **Individual Task Failures**: Caught and tracked in `#failedTasks` Map
2. **Non-Fatal Errors**: Continue processing unless `isFatalError()` returns true
3. **Continue-on-Error Mode**: CLI flag `--continue-on-error` treats all errors as non-fatal
4. **Resource Exhaustion**: Monitors file handles, memory, and task limits

### Error Categories

- `TaskError`: Task execution failures
- `AgentError`: Agent prompt/response failures
- `ValidationError`: PRD or task validation failures
- `SessionError`: Session management failures
- `PipelineError`: Pipeline orchestration failures

## Progress Tracking and Metrics

### Progress Tracker

Uses `progressTracker` utility that provides:

- Real-time progress updates every 5 tasks
- Progress bar with configurable width
- Completion percentage and ETA estimation
- Task completion recording

### Key Metrics

- **totalTasks**: Total subtasks in backlog
- **completedTasks**: Successfully completed subtasks
- **failedTasks**: Failed subtasks (from `#failedTasks.size`)
- **successRate**: `(completedTasks / totalTasks) * 100`

### Resource Monitoring

Monitors:

- **Task Limits**: Stop after `--max-tasks` limit
- **Duration Limits**: Stop after `--max-duration` milliseconds
- **File Handles**: Prevents system resource exhaustion
- **Memory Usage**: Tracks heap and system memory usage

## Status Transitions

### Pipeline Status Flow

```
'init' → 'session_initialized' → 'prd_decomposed' →
'backlog_running' → 'backlog_complete' →
'qa_complete'/'qa_skipped' → 'shutdown_complete'
```

### Status Transitions

1. **Initialization**: `initializeSession()` → `session_initialized`
2. **PRD Processing**: `decomposePRD()` → `prd_decomposed` or `prd_decomposition_failed`
3. **Task Execution**: `executeBacklog()` → `backlog_complete` or `shutdown_interrupted`
4. **QA Cycle**: `runQACycle()` → `qa_complete`, `qa_skipped`, or `qa_failed`
5. **Final State**: `cleanup()` → `shutdown_complete`

### Error Handling States

- `session_failed`: Session initialization failed
- `resource_limit_reached`: Resource limits exceeded
- `shutdown_interrupted`: Graceful shutdown requested
- `qa_failed`: QA cycle failed (non-fatal)

### Final Result Object

The `run()` method returns a `PipelineResult` object with:

```typescript
{
  success: boolean,           // Overall success (no fatal errors)
  hasFailures: boolean,      // Whether any tasks failed
  sessionPath: string,       // Session directory path
  totalTasks: number,        // Total subtasks
  completedTasks: number,    // Completed subtasks
  failedTasks: number,       // Failed subtasks
  finalPhase: string,        // Final phase name
  duration: number,          // Execution duration (ms)
  phases: PhaseSummary[],    // Phase-by-phase summary
  bugsFound: number,         // Bugs detected by QA
  error?: string,            // Error message if failed
  shutdownInterrupted: boolean, // Was execution interrupted
  shutdownReason?: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT'
}
```

## Key Integration Points

### SessionManager Integration

The pipeline creates a `SessionManager` instance in the constructor and uses it for:

- Session initialization and loading
- State persistence (via `updateItemStatus`, `flushUpdates`)
- PRD hash-based session discovery
- Delta session creation for PRD changes

### TaskOrchestrator Integration

The pipeline initializes the `TaskOrchestrator` after session initialization and uses it for:

- Building execution queue from scope
- Processing items via `processNextItem()`
- Managing task status and dependencies
- Tracking current item ID

### PRPRuntime Integration

The `PRPRuntime` is used for subtask execution during the implementation phase:

- Executes PRPs for individual subtasks
- Returns execution results with validation gates
- Handles both success and failure cases

## Sources

- **PRPPipeline Implementation**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`
- **TaskOrchestrator**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- **SessionManager**: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
- **PRPRuntime**: `/home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts`
