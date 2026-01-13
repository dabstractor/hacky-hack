/**
 * PRP Pipeline workflow for complete PRD implementation
 *
 * @module workflows/prp-pipeline
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

import { Workflow, Step } from 'groundswell';
import { readFile } from 'node:fs/promises';
import type { SessionManager } from '../core/session-manager.js';
import type { TaskOrchestrator } from '../core/task-orchestrator.js';
import type { PRPRuntime } from '../agents/prp-runtime.js';
import type { Backlog, Status, DeltaAnalysis, Task } from '../core/models.js';
import type { Scope } from '../core/scope-resolver.js';
import type { Logger } from '../utils/logger.js';
import { getLogger } from '../utils/logger.js';
import { SessionManager as SessionManagerClass } from '../core/session-manager.js';
import { TaskOrchestrator as TaskOrchestratorClass } from '../core/task-orchestrator.js';
import { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
import { BugHuntWorkflow } from './bug-hunt-workflow.js';
import { FixCycleWorkflow } from './fix-cycle-workflow.js';
import { patchBacklog } from '../core/task-patcher.js';
import { filterByStatus } from '../utils/task-utils.js';

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
  /** Whether execution was interrupted by shutdown signal */
  shutdownInterrupted: boolean;
  /** Reason for shutdown (if interrupted) */
  shutdownReason?: 'SIGINT' | 'SIGTERM';
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
 */
export class PRPPipeline extends Workflow {
  // ========================================================================
  // Public Observed State Fields (tracked by Groundswell)
  // ========================================================================

  /** Session state manager */
  sessionManager: SessionManager;

  /** Task execution orchestrator */
  taskOrchestrator: TaskOrchestrator;

  /** Correlation logger with correlation ID for tracing */
  correlationLogger: Logger;

  /** PRP Runtime for inner loop execution */
  runtime: PRPRuntime | null = null;

  /** Current pipeline phase */
  currentPhase: string = 'init';

  /** Pipeline execution mode */
  mode: 'normal' | 'bug-hunt' | 'validate' = 'normal';

  /** Total number of subtasks in backlog */
  totalTasks: number = 0;

  /** Number of completed subtasks */
  completedTasks: number = 0;

  /** Whether graceful shutdown has been requested */
  shutdownRequested: boolean = false;

  /** ID of the currently executing task */
  currentTaskId: string | null = null;

  /** Reason for shutdown request */
  shutdownReason: 'SIGINT' | 'SIGTERM' | null = null;

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

  /** SIGINT event handler reference */
  #sigintHandler: (() => void) | null = null;

  /** SIGTERM event handler reference */
  #sigtermHandler: (() => void) | null = null;

  /** Counter for duplicate SIGINT (force exit) */
  #sigintCount: number = 0;

  /** Correlation ID for tracing workflow execution */
  readonly #correlationId: string;

  // ========================================================================
  // Constructor
  // ========================================================================

  /**
   * Creates a new PRPPipeline instance
   *
   * @param prdPath - Path to PRD markdown file
   * @param scope - Optional scope to limit execution
   * @param mode - Execution mode: 'normal', 'bug-hunt', or 'validate' (default: 'normal')
   * @throws {Error} If prdPath is empty
   */
  constructor(
    prdPath: string,
    scope?: Scope,
    mode?: 'normal' | 'bug-hunt' | 'validate'
  ) {
    super('PRPPipeline');

    if (!prdPath || prdPath.trim() === '') {
      throw new Error('PRP path cannot be empty');
    }

    // Generate correlation ID for workflow tracing
    this.#correlationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.#prdPath = prdPath;
    this.#scope = scope;
    this.mode = mode ?? 'normal';

    // SessionManager will be created in run() to catch initialization errors
    this.sessionManager = null as any;

    // Create TaskOrchestrator (will be initialized with session after initializeSession)
    // Placeholder for now - will be recreated after session initialization
    this.taskOrchestrator = null as any;

    // Create correlation logger with correlation ID
    this.correlationLogger = getLogger('PRPPipeline').child({
      correlationId: this.#correlationId,
    });

    // Setup signal handlers for graceful shutdown
    this.#setupSignalHandlers();
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Registers SIGINT and SIGTERM handlers for graceful shutdown
   *
   * @remarks
   * - First SIGINT: Sets shutdownRequested flag, current task completes
   * - Second SIGINT: Logs warning (shutdown already in progress)
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
  async initializeSession(): Promise<void> {
    this.correlationLogger.info('[PRPPipeline] Initializing session', {
      correlationId: this.#correlationId,
    });
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

      // Check for PRD changes and handle delta if needed
      if (this.sessionManager.hasSessionChanged()) {
        this.logger.info(
          '[PRPPipeline] PRD has changed, initializing delta session'
        );
        await this.handleDelta();
      }

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
   * Handle PRD changes via delta workflow
   *
   * @remarks
   * Executes delta analysis and task patching to create a delta session
   * that preserves completed work while re-executing affected tasks.
   *
   * Steps:
   * 1. Load old PRD from session snapshot
   * 2. Load new PRD from disk
   * 3. Extract completed task IDs
   * 4. Run DeltaAnalysisWorkflow
   * 5. Apply patches via TaskPatcher
   * 6. Create delta session
   * 7. Log delta summary
   */
  @Step({ trackTiming: true, name: 'handleDelta' })
  async handleDelta(): Promise<void> {
    this.currentPhase = 'delta_handling';

    try {
      // Get current session state
      const currentSession = this.sessionManager.currentSession;
      if (!currentSession) {
        throw new Error('Cannot handle delta: no session loaded');
      }

      // Step 1: Get old PRD from session snapshot
      const oldPRD = currentSession.prdSnapshot;
      if (!oldPRD) {
        throw new Error('Cannot handle delta: no PRD snapshot in session');
      }

      // Step 2: Load new PRD from disk
      let newPRD: string;
      try {
        newPRD = await readFile(this.sessionManager.prdPath, 'utf-8');
      } catch (error) {
        throw new Error(
          `Failed to load new PRD from ${this.sessionManager.prdPath}: ${error}`
        );
      }

      // Step 3: Extract completed task IDs
      const backlog = currentSession.taskRegistry;
      const completedItems = filterByStatus(backlog, 'Complete');
      const completedTaskIds = completedItems
        .filter(item => item.type === 'Task' || item.type === 'Subtask')
        .map(item => item.id);

      this.logger.info(
        `[PRPPipeline] Found ${completedTaskIds.length} completed tasks`
      );

      // Step 4: Run DeltaAnalysisWorkflow
      this.logger.info('[PRPPipeline] Running delta analysis...');
      const workflow = new DeltaAnalysisWorkflow(
        oldPRD,
        newPRD,
        completedTaskIds
      );
      const delta: DeltaAnalysis = await workflow.run();

      this.logger.info(
        `[PRPPipeline] Delta analysis found ${delta.changes.length} changes`
      );
      this.logger.info(
        `[PRPPipeline] Tasks to re-execute: ${delta.taskIds.join(', ')}`
      );

      // Step 5: Apply patches to backlog
      this.logger.info('[PRPPipeline] Patching backlog...');
      const patchedBacklog = patchBacklog(backlog, delta);

      // Step 6: Create delta session
      this.logger.info('[PRPPipeline] Creating delta session...');
      await this.sessionManager.createDeltaSession(this.sessionManager.prdPath);

      // Step 7: Save patched backlog to delta session
      await this.sessionManager.saveBacklog(patchedBacklog);

      // Log delta summary
      const deltaSession = this.sessionManager.currentSession;
      this.logger.info('[PRPPipeline] ===== Delta Summary =====');
      this.logger.info(
        `[PRPPipeline] Delta session: ${deltaSession?.metadata.id}`
      );
      this.logger.info(
        `[PRPPipeline] Parent session: ${deltaSession?.metadata.parentSession}`
      );
      this.logger.info(`[PRPPipeline] Changes found: ${delta.changes.length}`);
      this.logger.info(
        `[PRPPipeline] Tasks to re-execute: ${delta.taskIds.length}`
      );
      this.logger.info(
        `[PRPPipeline] Affected tasks: ${delta.taskIds.join(', ')}`
      );
      this.logger.info(
        `[PRPPipeline] Patch instructions: ${delta.patchInstructions}`
      );
      this.logger.info('[PRPPipeline] ===== End Delta Summary =====');

      // Update phase
      this.currentPhase = 'session_initialized';
    } catch (error) {
      this.logger.error(`[PRPPipeline] Delta handling failed: ${error}`);
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
      const { TASK_BREAKDOWN_PROMPT } = await import('../agents/prompts.js');

      // Create Architect agent
      const architectAgent = createArchitectAgent();

      // Get PRD content from session snapshot
      const prdContent = this.sessionManager.currentSession?.prdSnapshot ?? '';

      // Create prompt with PRD content
      const architectPrompt = `${TASK_BREAKDOWN_PROMPT}\n\n## PRD Content\n\n${prdContent}`;

      // Generate backlog
      this.logger.info('[PRPPipeline] Calling Architect agent...');
      // @ts-expect-error -- Groundswell agent.prompt() type signature is incorrect, accepts string
      const _result = await architectAgent.prompt(architectPrompt);

      // Parse the result - architect agent returns { backlog: Backlog }
      // Note: The architect agent writes to $TASKS_FILE, but we can also parse from response
      // For this implementation, we'll read from the file the agent writes
      const { readFile } = await import('node:fs/promises');
      const { resolve } = await import('node:path');
      const tasksPath = resolve(
        this.sessionManager.currentSession!.metadata.path,
        'tasks.json'
      );
      const tasksContent = await readFile(tasksPath, 'utf-8');
      const parsedBacklog = JSON.parse(tasksContent) as Backlog;

      // Save backlog
      await this.sessionManager.saveBacklog(parsedBacklog);

      // Update task counts
      this.totalTasks = this.#countTasks();

      // Log summary
      const phaseCount = parsedBacklog.backlog.length;
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
   * Supports graceful shutdown via SIGINT/SIGTERM signals - checks
   * shutdownRequested flag after each task completes and breaks loop
   * if shutdown was requested.
   *
   * NOTE: TaskOrchestrator.executeSubtask() is currently a placeholder.
   * Future: Will integrate PRPRuntime for actual PRP execution.
   */
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

        // Check for shutdown request after each task
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
        this.logger.info(
          '[PRPPipeline] Bug-hunt mode: running QA regardless of task status'
        );
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
          const criticalBugs = finalResults.bugs.filter(
            b => b.severity === 'critical'
          );
          const majorBugs = finalResults.bugs.filter(
            b => b.severity === 'major'
          );
          const minorBugs = finalResults.bugs.filter(
            b => b.severity === 'minor'
          );
          const cosmeticBugs = finalResults.bugs.filter(
            b => b.severity === 'cosmetic'
          );

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

${finalResults.bugs
  .map(
    (bug, index) => `
### ${index + 1}. ${bug.title}

**Severity**: ${bug.severity}
**ID**: ${bug.id}

${bug.description}

**Reproduction**:
${bug.reproduction}

${bug.location ? `**Location**: ${bug.location}` : ''}
`
  )
  .join('\n')}

## Recommendations

${finalResults.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

          await writeFile(resultsPath, content, 'utf-8');
          this.logger.info(
            `[PRPPipeline] TEST_RESULTS.md written to ${resultsPath}`
          );
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

        const criticalCount = finalResults.bugs.filter(
          b => b.severity === 'critical'
        ).length;
        const majorCount = finalResults.bugs.filter(
          b => b.severity === 'major'
        ).length;
        const minorCount = finalResults.bugs.filter(
          b => b.severity === 'minor'
        ).length;
        const cosmeticCount = finalResults.bugs.filter(
          b => b.severity === 'cosmetic'
        ).length;

        console.log(`  🔴 Critical: ${criticalCount}`);
        console.log(`  🟠 Major: ${majorCount}`);
        console.log(`  🟡 Minor: ${minorCount}`);
        console.log(`  ⚪ Cosmetic: ${cosmeticCount}`);

        console.log(`\n${finalResults.summary}`);

        if (criticalCount > 0 || majorCount > 0) {
          console.log(
            '\n⚠️  Critical or major bugs detected - manual review recommended'
          );
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
      // Check if sessionManager was initialized
      if (!this.sessionManager) {
        this.logger.warn(
          '[PRPPipeline] SessionManager not initialized, skipping state save'
        );
        // Still remove signal listeners
        if (this.#sigintHandler) {
          process.off('SIGINT', this.#sigintHandler);
          this.logger.debug('[PRPPipeline] SIGINT handler removed');
        }
        if (this.#sigtermHandler) {
          process.off('SIGTERM', this.#sigtermHandler);
          this.logger.debug('[PRPPipeline] SIGTERM handler removed');
        }
        this.currentPhase = 'shutdown_complete';
        this.logger.info('[PRPPipeline] Cleanup complete (no session)');
        return;
      }

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
   * Supports graceful shutdown via SIGINT/SIGTERM signals. When a signal
   * is received, the current task completes before the pipeline exits,
   * and state is preserved for resumption.
   *
   * Returns PipelineResult with execution summary including shutdown status.
   *
   * @returns Pipeline execution result with summary
   */
  async run(): Promise<PipelineResult> {
    this.#startTime = performance.now();
    this.setStatus('running');

    this.correlationLogger.info(
      '[PRPPipeline] Starting PRP Pipeline workflow',
      {
        correlationId: this.#correlationId,
        prdPath: this.#prdPath,
        scope: this.#scope ?? 'all',
        mode: this.mode,
      }
    );
    this.logger.info('[PRPPipeline] Starting PRP Pipeline workflow');
    this.logger.info(`[PRPPipeline] PRD: ${this.#prdPath}`);
    this.logger.info(
      `[PRPPipeline] Scope: ${JSON.stringify(this.#scope ?? 'all')}`
    );

    try {
      // Create SessionManager (may throw if PRD doesn't exist)
      this.sessionManager = new SessionManagerClass(this.#prdPath);

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
        sessionPath: this.sessionManager?.currentSession?.metadata.path ?? '',
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
      // Always cleanup, even if interrupted or errored
      await this.cleanup();
    }
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Counts total subtasks in backlog
   */
  #countTasks(): number {
    if (!this.sessionManager) return 0;
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
    if (!this.sessionManager) return 0;
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
    if (!this.sessionManager) return 0;
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
    if (!this.sessionManager) return [];
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
