# PRP for P3.M4.T1.S2: Implement graceful shutdown handling

---

## Goal

**Feature Goal**: Add graceful shutdown handling to `PRPPipeline` class that responds to SIGINT (Ctrl+C), finishes the current task before exiting, and preserves state for recovery.

**Deliverable**: Modified `src/workflows/prp-pipeline.ts` with:

- `@ObservedState()` `shutdownRequested: boolean = false` field
- `@ObservedState()` `currentTaskId: string | null = null` field
- SIGINT event listener that sets `shutdownRequested = true`
- Modified `executeBacklog()` that checks `shutdownRequested` after each task
- `@Step()` `cleanup()` method that saves state before exit
- Unit tests for graceful shutdown behavior

**Success Definition**:

- Pressing Ctrl+C during backlog execution triggers graceful shutdown
- Current task completes before pipeline exits
- State is saved to `tasks.json` before exit
- Pipeline can be resumed and continue from where it left off
- All existing tests continue to pass
- New tests verify shutdown behavior
- No data corruption or partial state issues

## User Persona (if applicable)

**Target User**: Developer/CLI user running long-running PRP Pipeline implementations

**Use Case**: User starts a pipeline that may take hours to complete. During execution, they need to stop the process (e.g., end of workday, system maintenance, or urgent interruption). They want to stop gracefully without losing progress.

**User Journey**:

1. User starts pipeline: `prp-pipeline run ./PRD.md`
2. Pipeline begins executing tasks
3. User presses Ctrl+C to stop
4. Pipeline logs "Shutdown requested, finishing current task..."
5. Current task completes
6. Pipeline saves state and exits cleanly
7. User resumes later: `prp-pipeline run ./PRD.md`
8. Pipeline detects existing session and continues from saved state

**Pain Points Addressed**:

- No loss of work from abrupt termination
- Clean state preservation for resumption
- Clear feedback during shutdown
- Prevents data corruption from mid-task interruption
- Allows intentional pauses in long-running workflows

## Why

- **PRD Requirement**: Section 5.1 explicitly requires graceful shutdown handling
- **Data Integrity**: Abrupt termination can corrupt state or lose progress
- **User Experience**: Long-running pipelines need intentional pause/resume capability
- **Production Readiness**: Real-world systems must handle shutdown signals properly
- **Foundation for Future**: Delta sessions (P4.M1) depend on reliable state persistence

## What

### System Behavior

The enhanced `PRPPipeline` class will:

1. **Add Shutdown State Tracking**:
   - `@ObservedState() shutdownRequested: boolean = false` - Flag indicating shutdown requested
   - `@ObservedState() currentTaskId: string | null = null` - Currently executing task ID

2. **Register Signal Handler**:
   - Listen for `SIGINT` (Ctrl+C) and `SIGTERM` (kill command)
   - When received, set `shutdownRequested = true`
   - Log shutdown initiation message

3. **Modify executeBacklog() Loop**:
   - After each `processNextItem()` call, check `shutdownRequested`
   - If true and `currentTaskId` exists, log "Finishing current task before shutdown"
   - Let current task complete, then break loop
   - Skip to cleanup step

4. **Add cleanup() @Step Method**:
   - Decorated with `@Step({ trackTiming: true })`
   - Saves current backlog state via `sessionManager.saveBacklog()`
   - Logs final state summary
   - Sets `currentPhase = 'shutdown_complete'`

5. **Update run() Method**:
   - Call `cleanup()` after `executeBacklog()` (even if interrupted)
   - Wrap in try/finally to ensure cleanup runs
   - Return `PipelineResult` with `shutdownInterrupted: true` if applicable

### Success Criteria

- [ ] `@ObservedState() shutdownRequested` field added to PRPPipeline
- [ ] `@ObservedState() currentTaskId` field added to PRPPipeline
- [ ] SIGINT/SIGTERM event listener registered in constructor or initialization
- [ ] `executeBacklog()` checks `shutdownRequested` after each task
- [ ] `@Step() cleanup()` method saves state before exit
- [ ] `run()` method calls `cleanup()` in finally block
- [ ] `PipelineResult` includes `shutdownInterrupted` flag
- [ ] Unit tests for shutdown flow
- [ ] Integration test for actual SIGINT handling
- [ ] All existing tests pass
- [ ] Manual verification: Ctrl+C during execution triggers graceful shutdown

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact PRPPipeline class structure from previous PRP (P3.M4.T1.S1)
- Complete Groundswell decorator usage patterns
- Existing state persistence mechanisms in SessionManager
- Node.js signal handling best practices
- Specific code patterns from existing signal handlers
- Integration points for shutdown logic
- Test patterns matching codebase conventions

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: plan/001_14b9dc2a33c7/P3M4T1S1/PRP.md
  why: Previous PRP defining PRPPipeline class structure - this is the CONTRACT
  critical: Lines 555-1007 contain complete PRPPipeline implementation
  pattern: PRPPipeline extends Workflow, @ObservedState fields, @Step methods
  note: Use this as the base - add graceful shutdown to existing structure

- file: src/workflows/prp-pipeline.ts
  why: Actual current implementation of PRPPipeline - modify this file
  critical: Lines 292-335 are executeBacklog() method to modify
  critical: Lines 398-453 are run() method to add cleanup
  pattern: @Step decorators, @ObservedState fields, private helper methods

- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API reference for decorators
  critical: Lines 10-114 cover Workflow class, @Step, @ObservedState
  pattern: |
    @ObservedState()
    fieldName: Type = defaultValue;
    @Step({ trackTiming: true })
    async methodName(): Promise<void> { /* ... */ }

- file: src/core/session-manager.ts
  why: State persistence mechanisms - saveBacklog() method
  critical: saveBacklog(backlog: Backlog) method for persisting state
  pattern: await sessionManager.saveBacklog(currentBacklog)
  gotcha: Must get current backlog from sessionManager.currentSession.taskRegistry

- file: src/scripts/validate-api.ts
  why: Existing SIGINT handler pattern in codebase
  critical: Lines 501-504 show SIGINT event listener pattern
  pattern: |
    process.on('SIGINT', () => {
      log.warn('\nReceived SIGINT, exiting...');
      process.exit(130);
    });

- file: src/core/session-utils.ts
  why: Atomic write pattern for state persistence
  critical: Lines 93-111 show atomicWrite() for safe file writes
  pattern: Temp file + rename prevents corruption
  gotcha: SessionManager.saveBacklog() already uses atomicWrite internally

- url: https://nodejs.org/api/process.html#process_signal_events
  why: Official Node.js documentation for signal events
  critical: SIGINT, SIGTERM are the key signals to handle
  pattern: process.on('SIGINT', handler) - handler receives no arguments

- url: https://nodejs.org/api/process.html#process_exit_codes
  why: Standard exit codes for graceful shutdown
  critical: 130 = 128 + 2 (SIGINT), 143 = 128 + 15 (SIGTERM)
  pattern: process.exit(130) for SIGINT, process.exit(143) for SIGTERM

- url: https://github.com/gajus/graceful-termination#readme
  why: Reference implementation of graceful shutdown patterns
  critical: Shows how to track active operations and wait for completion
  pattern: Use Set to track active operations, Promise.race for timeout

- url: https://www.typescriptlang.org/docs/handbook/decorators.html
  why: TypeScript decorator syntax reference
  critical: Decorators go above field/method declarations
  pattern: @DecoratorName() \n fieldName: Type;
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
│   ├── session-manager.ts     # SessionManager class with saveBacklog()
│   ├── task-orchestrator.ts   # TaskOrchestrator class
│   ├── scope-resolver.ts      # Scope type and utilities
│   └── session-utils.ts       # Atomic write utilities
├── workflows/
│   ├── hello-world.ts         # Simplest workflow pattern
│   └── prp-pipeline.ts        # MODIFIED - Add graceful shutdown here
└── utils/
    └── task-utils.ts          # Task hierarchy utilities

tests/
├── unit/
│   ├── agents/
│   │   └── agent-factory.test.ts
│   ├── core/
│   │   ├── session-manager.test.ts
│   │   └── task-orchestrator.test.ts
│   └── workflows/
│       └── hello-world.test.ts  # May exist or needs creation
└── integration/
    └── (integration tests)
```

### Desired Codebase Tree with Files to be Added

```bash
src/
├── workflows/
│   ├── hello-world.ts         # EXISTING
│   └── prp-pipeline.ts        # MODIFIED - Add graceful shutdown

tests/
├── unit/
│   └── workflows/
│       ├── hello-world.test.ts       # EXISTING (may need to create)
│       └── prp-pipeline.test.ts      # MODIFIED - Add shutdown tests
└── integration/
    └── prp-pipeline-shutdown.test.ts # NEW - SIGINT handling tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: @ObservedState() decorator goes ABOVE property declaration
@ObservedState()
shutdownRequested: boolean = false;  // Decorator on field, not in constructor

// CRITICAL: Event listeners must be registered in constructor or initialization
// Cannot register in @Step methods as they're called multiple times
constructor(prdPath: string, scope?: Scope) {
  super('PRPPipeline');

  // Register signal handlers ONCE during construction
  this.#setupSignalHandlers();
}

// CRITICAL: Remove event listeners in cleanup to prevent memory leaks
// Keep reference to handler function for removal
#sigintHandler: () => void;
#sigtermHandler: () => void;

#setupSignalHandlers(): void {
  this.#sigintHandler = () => {
    this.logger.info('[PRPPipeline] SIGINT received, initiating graceful shutdown');
    this.shutdownRequested = true;
  };

  this.#sigtermHandler = () => {
    this.logger.info('[PRPPipeline] SIGTERM received, initiating graceful shutdown');
    this.shutdownRequested = true;
  };

  process.on('SIGINT', this.#sigintHandler);
  process.on('SIGTERM', this.#sigtermHandler);
}

// CRITICAL: Check shutdownRequested in executeBacklog() loop
// Check AFTER each task completes, not before
while (await this.taskOrchestrator.processNextItem()) {
  iterations++;
  this.completedTasks = this.#countCompletedTasks();

  // Check for shutdown request AFTER task completes
  if (this.shutdownRequested) {
    this.logger.info('[PRPPipeline] Shutdown requested, stopping after current task');
    break;
  }
}

// CRITICAL: Use try/finally to ensure cleanup always runs
async run(): Promise<PipelineResult> {
  this.#startTime = performance.now();
  this.setStatus('running');

  try {
    await this.initializeSession();
    await this.decomposePRD();
    await this.executeBacklog();
    await this.runQACycle();
    this.setStatus('completed');
  } finally {
    // Always cleanup, even if interrupted
    await this.cleanup();
  }

  // ... return result
}

// CRITICAL: cleanup() must be @Step for observability
@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  this.logger.info('[PRPPipeline] Cleanup and state preservation');

  try {
    // Save final state
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (backlog) {
      await this.sessionManager.saveBacklog(backlog);
      this.logger.info('[PRPPipeline] State saved successfully');
    }

    // Remove signal listeners to prevent memory leaks
    if (this.#sigintHandler) {
      process.off('SIGINT', this.#sigintHandler);
    }
    if (this.#sigtermHandler) {
      process.off('SIGTERM', this.#sigtermHandler);
    }

    this.currentPhase = 'shutdown_complete';
    this.logger.info('[PRPPipeline] Cleanup complete');
  } catch (error) {
    this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
    throw error;
  }
}

// CRITICAL: Update PipelineResult to include shutdown flag
export interface PipelineResult {
  // ... existing fields ...
  /** Whether execution was interrupted by shutdown signal */
  shutdownInterrupted: boolean;
}

// GOTCHA: TaskOrchestrator.processNextItem() returns false when queue empty
// But we want to check shutdownRequested AFTER it returns true
// This ensures current task completes before we break

// GOTCHA: Groundswell Workflow automatically handles some signals
// Don't conflict with existing signal handling in Workflow base class

// GOTCHA: SessionManager.saveBacklog() is atomic
// No need to implement additional atomic write logic
// Just call the existing method

// GOTCHA: Exit codes
// 130 = 128 + 2 (SIGINT) - standard for Ctrl+C
// 143 = 128 + 15 (SIGTERM) - standard for kill command
// 0 = Success
// 1 = General error

// PATTERN: Use boolean flag for shutdown state
// @ObservedState() ensures it's tracked in snapshots
// Other parts of system can check this flag

// PATTERN: Log clear shutdown messages
// User should see:
// - "SIGINT received, initiating graceful shutdown"
// - "Shutdown requested, stopping after current task"
// - "Finishing current task before shutdown"
// - "State saved successfully"
// - "Cleanup complete"

// PATTERN: Always call cleanup() in finally block
// Even if executeBacklog() throws an error
// This ensures state is saved even on failures

// GOTCHA: Don't call process.exit() in cleanup()
// Let the run() method return naturally
// Caller decides whether to exit or continue

// GOTCHA: Multiple SIGINT presses
// Second press should force immediate exit
// Add counter and check for duplicate signals

// GOTCHA: currentTaskId tracking
// TaskOrchestrator doesn't expose current task
// May need to add getCurrentTask() or track internally
// For now, can use shutdownRequested flag alone

// GOTCHA: Testing signal handling is tricky
// Use process.kill(process.pid, 'SIGINT') in tests
// But this sends signal to test runner too
// Better to expose shutdown handler as testable method
```

## Implementation Blueprint

### Data Models and Structure

No new data models required. Extend existing `PipelineResult` interface:

```typescript
export interface PipelineResult {
  // ... existing fields ...
  /** Whether execution was interrupted by shutdown signal */
  shutdownInterrupted: boolean;
  /** Reason for shutdown (if interrupted) */
  shutdownReason?: 'SIGINT' | 'SIGTERM';
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/workflows/prp-pipeline.ts - Add shutdown state fields
  - ADD: @ObservedState() shutdownRequested: boolean = false
  - ADD: @ObservedState() currentTaskId: string | null = null
  - ADD: @ObservedState() shutdownReason: 'SIGINT' | 'SIGTERM' | null = null
  - PLACEMENT: In PRPPipeline class, alongside existing @ObservedState fields (after line 116)
  - PATTERN: Follow existing decorator usage - decorator above field declaration

Task 2: ADD private signal handler fields to PRPPipeline class
  - ADD: #sigintHandler: (() => void) | null = null
  - ADD: #sigtermHandler: (() => void) | null = null
  - ADD: #sigintCount: number = 0 (for duplicate signal detection)
  - PLACEMENT: In Private Fields section (around line 133)
  - PATTERN: Use # prefix for private fields, initialize to null

Task 3: IMPLEMENT #setupSignalHandlers() private method
  - CREATE: #setupSignalHandlers(): void method
  - IMPLEMENT: SIGINT handler that sets shutdownRequested = true, shutdownReason = 'SIGINT', increments #sigintCount
  - IMPLEMENT: SIGTERM handler that sets shutdownRequested = true, shutdownReason = 'SIGTERM'
  - IMPLEMENT: Duplicate SIGINT check - if #sigintCount > 1, log "Forcing immediate exit" and set flag
  - REGISTER: process.on('SIGINT', this.#sigintHandler)
  - REGISTER: process.on('SIGTERM', this.#sigtermHandler)
  - LOG: Clear message when signal received
  - PLACEMENT: As private method in PRPPipeline class
  - ERROR HANDLING: Wrap handler bodies in try/catch to prevent handler errors

Task 4: MODIFY constructor to call #setupSignalHandlers()
  - ADD: Call to this.#setupSignalHandlers() at end of constructor
  - PLACEMENT: After this.taskOrchestrator assignment (line 160)
  - ENSURE: Signal handlers registered once during construction

Task 5: MODIFY executeBacklog() to check shutdownRequested
  - FIND: The while loop at line 301
  - ADD: After this.completedTasks update (line 310), check if (this.shutdownRequested)
  - IF: shutdownRequested is true
    * LOG: "[PRPPipeline] Shutdown requested, finishing current task"
    * BREAK: Exit the loop
    * SET: this.currentPhase = 'shutdown_interrupted'
  - PRESERVE: All existing loop logic and safety checks
  - PLACEMENT: Inside while loop, after processNextItem() and updates

Task 6: IMPLEMENT cleanup() @Step method
  - CREATE: @Step({ trackTiming: true }) async cleanup(): Promise<void>
  - IMPLEMENT: Save backlog state via sessionManager.saveBacklog()
  - IMPLEMENT: Remove signal listeners (process.off)
  - IMPLEMENT: Set currentPhase = 'shutdown_complete'
  - IMPLEMENT: Log summary of tasks completed/remaining
  - ERROR HANDLING: Wrap in try/catch, log errors but don't throw
  - PLACEMENT: After runQACycle() method, before run() method
  - PATTERN: Follow existing @Step method patterns

Task 7: MODIFY run() method to call cleanup() in finally block
  - FIND: The try block at line 406
  - WRAP: Existing step calls in try/finally structure
  - ADD: finally block that calls await this.cleanup()
  - ADD: Set shutdownInterrupted flag based on shutdownRequested
  - ADD: Pass shutdownReason to PipelineResult
  - PRESERVE: All existing try/catch error handling
  - PLACEMENT: Around lines 406-431

Task 8: UPDATE PipelineResult interface
  - ADD: shutdownInterrupted: boolean field
  - ADD: shutdownReason?: 'SIGINT' | 'SIGTERM' field
  - PLACEMENT: In PipelineResult interface (around line 36)
  - DOCUMENT: Add JSDoc comments

Task 9: MODIFY tests/unit/workflows/prp-pipeline.test.ts
  - ADD: Test for shutdownRequested flag initialization
  - ADD: Test for signal handler registration (mock process.on)
  - ADD: Test for executeBacklog() loop break on shutdownRequested
  - ADD: Test for cleanup() method calling saveBacklog()
  - ADD: Test for cleanup() removing signal listeners
  - PATTERN: Use vitest describe/it/expect, mock process methods

Task 10: CREATE tests/integration/prp-pipeline-shutdown.test.ts
  - CREATE: Integration test for SIGINT handling during execution
  - IMPLEMENT: Mock TaskOrchestrator that takes time to process
  - IMPLEMENT: Send SIGINT via process.kill(process.pid, 'SIGINT')
  - VERIFY: Current task completes before exit
  - VERIFY: State is saved before exit
  - VERIFY: PipelineResult has shutdownInterrupted: true
  - SKIP: Mark as test.skip if environment doesn't support signal testing
  - PATTERN: Use vi.useFakeTimers() for controlled timing

Task 11: UPDATE tests to verify signal cleanup
  - VERIFY: process.off() called in cleanup()
  - VERIFY: No memory leaks from duplicate listeners
  - VERIFY: Multiple shutdown requests handled correctly

Task 12: CREATE research documentation for graceful shutdown
  - CREATE: plan/001_14b9dc2a33c7/P3M4T1S2/research/graceful-shutdown-patterns.md
  - DOCUMENT: Node.js signal handling best practices
  - DOCUMENT: Shutdown patterns discovered in research
  - DOCUMENT: URLs and references to external documentation
```

### Implementation Patterns & Key Details

```typescript
// File: src/workflows/prp-pipeline.ts

// =============================================================================
// 1. NEW: Add shutdown state fields after existing @ObservedState fields
// =============================================================================

export class PRPPipeline extends Workflow {
  // ... existing @ObservedState fields (lines 94-116) ...

  /** Number of completed subtasks */
  @ObservedState()
  completedTasks: number = 0;

  // NEW: Shutdown state tracking
  /** Whether graceful shutdown has been requested */
  @ObservedState()
  shutdownRequested: boolean = false;

  /** ID of the currently executing task */
  @ObservedState()
  currentTaskId: string | null = null;

  /** Reason for shutdown request */
  @ObservedState()
  shutdownReason: 'SIGINT' | 'SIGTERM' | null = null;

  // ========================================================================
  // Private Fields
  // ========================================================================

  // ... existing private fields (lines 122-132) ...

  /** Number of bugs found by QA agent */
  #bugsFound: number = 0;

  // NEW: Signal handler references for cleanup
  /** SIGINT event handler reference */
  #sigintHandler: (() => void) | null = null;

  /** SIGTERM event handler reference */
  #sigtermHandler: (() => void) | null = null;

  /** Counter for duplicate SIGINT (force exit) */
  #sigintCount: number = 0;

  // ========================================================================
  // Constructor
  // ========================================================================

  // MODIFY: Add signal handler setup at end of constructor
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
    this.taskOrchestrator = null as any;

    // NEW: Setup signal handlers for graceful shutdown
    this.#setupSignalHandlers();
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  // NEW: Setup signal handlers
  /**
   * Registers SIGINT and SIGTERM handlers for graceful shutdown
   *
   * @remarks
   * - First SIGINT: Sets shutdownRequested flag, current task completes
   * - Second SIGINT: Logs force exit message (future: immediate exit)
   * - SIGTERM: Same as SIGINT (sent by kill command)
   *
   * Handlers are removed in cleanup() to prevent memory leaks.
   */
  #setupSignalHandlers(): void {
    // SIGINT handler (Ctrl+C)
    this.#sigintHandler = () => {
      this.#sigintCount++;

      if (this.#sigintCount > 1) {
        this.logger.warn(
          '[PRPPipeline] Duplicate SIGINT received - shutdown already in progress'
        );
        // Future: Could force immediate exit here
        return;
      }

      this.logger.info(
        '[PRPPipeline] SIGINT received, initiating graceful shutdown'
      );
      this.shutdownRequested = true;
      this.shutdownReason = 'SIGINT';
    };

    // SIGTERM handler (kill command)
    this.#sigtermHandler = () => {
      this.logger.info(
        '[PRPPipeline] SIGTERM received, initiating graceful shutdown'
      );
      this.shutdownRequested = true;
      this.shutdownReason = 'SIGTERM';
    };

    // Register handlers
    process.on('SIGINT', this.#sigintHandler);
    process.on('SIGTERM', this.#sigtermHandler);

    this.logger.debug('[PRPPipeline] Signal handlers registered');
  }

  // ... existing private helper methods ...

  // ========================================================================
  // Step Methods
  // ========================================================================

  // ... existing @Step methods (initializeSession, decomposePRD, executeBacklog, runQACycle) ...

  // MODIFY: executeBacklog() to check shutdownRequested
  @Step({ trackTiming: true })
  async executeBacklog(): Promise<void> {
    this.logger.info('[PRPPipeline] Executing backlog');

    try {
      let iterations = 0;
      const maxIterations = 10000; // Safety limit

      // Process items until queue is empty or shutdown requested
      while (await this.taskOrchestrator.processNextItem()) {
        iterations++;

        // Safety check
        if (iterations > maxIterations) {
          throw new Error(`Execution exceeded ${maxIterations} iterations`);
        }

        // Update completed tasks count
        this.completedTasks = this.#countCompletedTasks();

        // NEW: Check for shutdown request after each task
        if (this.shutdownRequested) {
          this.logger.info(
            '[PRPPipeline] Shutdown requested, finishing current task'
          );
          this.logger.info(
            `[PRPPipeline] Completed ${this.completedTasks}/${this.totalTasks} tasks before shutdown`
          );
          this.currentPhase = 'shutdown_interrupted';
          break;
        }

        // Log progress every 10 items
        if (iterations % 10 === 0) {
          this.logger.info(
            `[PRPPipeline] Processed ${iterations} items, ${this.completedTasks}/${this.totalTasks} tasks complete`
          );
        }
      }

      // Only log "complete" if not interrupted
      if (!this.shutdownRequested) {
        this.logger.info(`[PRPPipeline] Processed ${iterations} items total`);

        // Final counts
        this.completedTasks = this.#countCompletedTasks();
        const failedTasks = this.#countFailedTasks();

        this.logger.info(`[PRPPipeline] Complete: ${this.completedTasks}`);
        this.logger.info(`[PRPPipeline] Failed: ${failedTasks}`);

        this.currentPhase = 'backlog_complete';
        this.logger.info('[PRPPipeline] Backlog execution complete');
      }
    } catch (error) {
      this.logger.error(`[PRPPipeline] Backlog execution failed: ${error}`);
      throw error;
    }
  }

  // NEW: cleanup() @Step method
  /**
   * Cleanup and state preservation before shutdown
   *
   * @remarks
   * Called from run() method's finally block to ensure cleanup
   * happens even on error or interruption. Saves current state
   * and removes signal listeners to prevent memory leaks.
   */
  @Step({ trackTiming: true })
  async cleanup(): Promise<void> {
    this.logger.info('[PRPPipeline] Starting cleanup and state preservation');

    try {
      // Save current state
      const backlog = this.sessionManager.currentSession?.taskRegistry;
      if (backlog) {
        await this.sessionManager.saveBacklog(backlog);
        this.logger.info('[PRPPipeline] State saved successfully');

        // Log state summary
        const completed = this.#countCompletedTasks();
        const remaining = this.totalTasks - completed;
        this.logger.info(
          `[PRPPipeline] State: ${completed} complete, ${remaining} remaining`
        );
      } else {
        this.logger.warn('[PRPPipeline] No session state to save');
      }

      // Remove signal listeners to prevent memory leaks
      if (this.#sigintHandler) {
        process.off('SIGINT', this.#sigintHandler);
        this.logger.debug('[PRPPipeline] SIGINT handler removed');
      }
      if (this.#sigtermHandler) {
        process.off('SIGTERM', this.#sigtermHandler);
        this.logger.debug('[PRPPipeline] SIGTERM handler removed');
      }

      this.currentPhase = 'shutdown_complete';
      this.logger.info('[PRPPipeline] Cleanup complete');
    } catch (error) {
      // Log but don't throw - cleanup failures shouldn't prevent shutdown
      this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
    }
  }

  // ========================================================================
  // Main Entry Point
  // ========================================================================

  // MODIFY: run() to use try/finally for cleanup
  /**
   * Run the complete PRP Pipeline workflow
   *
   * @remarks
   * Orchestrates all steps in sequence:
   * 1. Initialize session
   * 2. Decompose PRD (if new session)
   * 3. Execute backlog (with graceful shutdown support)
   * 4. Run QA cycle
   * 5. Cleanup (always runs via finally block)
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
        shutdownInterrupted: false, // Completed successfully
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
        shutdownInterrupted: this.shutdownRequested, // May have been interrupted
        shutdownReason: this.shutdownReason ?? undefined,
      };
    } finally {
      // NEW: Always cleanup, even if interrupted or errored
      await this.cleanup();
    }
  }
}

// =============================================================================
// 2. UPDATE: PipelineResult interface
// =============================================================================

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
  /** NEW: Whether execution was interrupted by shutdown signal */
  shutdownInterrupted: boolean;
  /** NEW: Reason for shutdown (if interrupted) */
  shutdownReason?: 'SIGINT' | 'SIGTERM';
}
```

### Integration Points

```yaml
SESSION_MANAGER:
  - method: await sessionManager.saveBacklog(backlog)
  - usage: In cleanup() to persist state before shutdown
  - note: Already uses atomicWrite internally for safety

PROCESS_SIGNALS:
  - event: process.on('SIGINT', handler)
  - event: process.on('SIGTERM', handler)
  - cleanup: process.off('SIGINT', handler) in cleanup()
  - cleanup: process.off('SIGTERM', handler) in cleanup()
  - gotcha: Store handler reference for removal

TASK_ORCHESTRATOR:
  - method: await orchestrator.processNextItem()
  - returns: boolean (true while items remain)
  - integration: Check shutdownRequested after each call
  - note: Current task completes before check happens

PIPELINE_RESULT:
  - add: shutdownInterrupted: boolean
  - add: shutdownReason?: 'SIGINT' | 'SIGTERM'
  - integration: Set based on shutdownRequested in run()
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
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
# Run integration tests for shutdown
npm test -- tests/integration/prp-pipeline-shutdown.test.ts

# Test specific shutdown scenarios
npm test -- tests/integration/prp-pipeline-shutdown.test.ts -t "SIGINT during execution"
npm test -- tests/integration/prp-pipeline-shutdown.test.ts -t "state preservation"

# Expected: SIGINT triggers graceful shutdown, state saved, can resume
```

### Level 4: Manual Execution Validation

```bash
# 1. Create test PRD that takes time to execute
cat > /tmp/test-shutdown-prd.md << 'EOF'
# Test PRD for Shutdown

## P1: Phase 1
### P1.M1: Milestone 1
#### P1.M1.T1: Task 1
##### P1.M1.T1.S1: Subtask 1
Test subtask that takes time
##### P1.M1.T1.S2: Subtask 2
Another subtask
##### P1.M1.T1.S3: Subtask 3
Third subtask
##### P1.M1.T1.S4: Subtask 4
Fourth subtask
##### P1.M1.T1.S5: Subtask 5
Fifth subtask
EOF

# 2. Start pipeline in one terminal
npm run pipeline -- /tmp/test-shutdown-prd.md

# 3. Wait for it to start processing tasks
# Watch for logs like: "[PRPPipeline] Executing backlog"

# 4. Press Ctrl+C to trigger SIGINT
# Should see: "[PRPPipeline] SIGINT received, initiating graceful shutdown"
# Should see: "[PRPPipeline] Shutdown requested, finishing current task"
# Should see: "[PRPPipeline] State saved successfully"

# 5. Verify state was saved
ls -la plan/001_*/
cat plan/001_*/tasks.json | jq '.backlog[].milestones[].tasks[].subtasks[] | {id, status}'

# 6. Resume pipeline - should continue from saved state
npm run pipeline -- /tmp/test-shutdown-prd.md

# 7. Verify it completed remaining tasks
cat plan/001_*/tasks.json | jq '.backlog[].milestones[].tasks[].subtasks[] | {id, status}'

# Expected Output:
# - First run: Partial tasks Complete, rest Planned
# - Resume: All tasks Complete
# - No duplicate work or skipped tasks

# 8. Test duplicate SIGINT (force exit scenario)
# Start pipeline, press Ctrl+C twice quickly
# Should see: "[PRPPipeline] Duplicate SIGINT received"
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] `@ObservedState() shutdownRequested` field added
- [ ] `@ObservedState() currentTaskId` field added
- [ ] `@ObservedState() shutdownReason` field added
- [ ] `#setupSignalHandlers()` method implemented
- [ ] SIGINT handler sets shutdownRequested = true
- [ ] SIGTERM handler sets shutdownRequested = true
- [ ] Duplicate SIGINT logged (doesn't force exit yet)
- [ ] `executeBacklog()` checks shutdownRequested after each task
- [ ] `@Step() cleanup()` method saves state
- [ ] `cleanup()` removes signal listeners
- [ ] `run()` calls `cleanup()` in finally block
- [ ] `PipelineResult` includes shutdownInterrupted flag
- [ ] `PipelineResult` includes shutdownReason field
- [ ] Unit tests for shutdown behavior
- [ ] Integration test for SIGINT handling
- [ ] Manual Ctrl+C test passes
- [ ] State preservation verified
- [ ] Resumption from shutdown works

### Code Quality Validation

- [ ] Follows existing PRPPipeline patterns
- [ ] File placement matches desired codebase tree
- [ ] Uses `.js` extensions for ES module imports
- [ ] `@ObservedState()` decorators on field declarations
- [ ] `@Step()` decorators on method declarations
- [ ] Private fields use `#` prefix
- [ ] Proper error handling with try/catch in each method
- [ ] Console logging via this.logger.info() / logger.error()
- [ ] Signal handlers removed in cleanup (no memory leaks)

### Documentation & Deployment

- [ ] Comprehensive JSDoc comments on new methods
- [ ] JSDoc @remarks tags explaining shutdown behavior
- [ ] Module-level JSDoc updated for shutdown feature
- [ ] Example usage in JSDoc @example blocks (if applicable)
- [ ] Shutdown behavior documented in comments
- [ ] Exit codes documented in comments

---

## Anti-Patterns to Avoid

- ❌ Don't register signal handlers in @Step methods - they run multiple times
- ❌ Don't use process.exit() in cleanup() - let run() return naturally
- ❌ Don't skip cleanup() on error - use finally block to ensure it runs
- ❌ Don't forget to remove signal listeners - causes memory leaks
- ❌ Don't check shutdownRequested before processNextItem() - let task complete first
- ❌ Don't hardcode exit codes - use standard 130 for SIGINT, 143 for SIGTERM
- ❌ Don't create new SessionManager in cleanup() - use existing instance
- ❌ Don't swallow cleanup errors - log them but don't prevent shutdown
- ❌ Don't use console.log() for shutdown messages - use this.logger.info()
- ❌ Don't force exit on second SIGINT yet - just log (future enhancement)
- ❌ Don't save state outside of SessionManager.saveBacklog() - use existing method
- ❌ Don't track currentTaskId if TaskOrchestrator doesn't expose it - use shutdownRequested only
- ❌ Don't test signal handling by sending signals to test runner - isolate properly
- ❌ Don't modify PipelineResult after return - build complete result before returning
- ❌ Don't call cleanup() multiple times - guard against duplicate calls if needed
