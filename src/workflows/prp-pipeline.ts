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
import {
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  ErrorCodes,
} from '../utils/errors.js';
import { SessionManager as SessionManagerClass } from '../core/session-manager.js';
import { TaskOrchestrator as TaskOrchestratorClass } from '../core/task-orchestrator.js';
import { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
import { BugHuntWorkflow } from './bug-hunt-workflow.js';
import { FixCycleWorkflow } from './fix-cycle-workflow.js';
import { patchBacklog } from '../core/task-patcher.js';
import { filterByStatus } from '../utils/task-utils.js';
import { progressTracker, type ProgressTracker } from '../utils/progress.js';
import { retryAgentPrompt } from '../utils/retry.js';
import {
  ResourceMonitor,
  type ResourceConfig,
} from '../utils/resource-monitor.js';

/**
 * Result returned by PRPPipeline.run()
 */
export interface PipelineResult {
  /** Whether pipeline completed successfully */
  success: boolean;
  /** Whether any tasks failed during execution */
  hasFailures: boolean;
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
  shutdownReason?: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT';
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
 * Error tracking record for failed tasks
 *
 * @remarks
 * Captures complete context about task failures for error reporting.
 * Stored in failedTasks Map keyed by task ID.
 */
interface TaskFailure {
  /** Task ID that failed */
  taskId: string;
  /** Task title */
  taskTitle: string;
  /** Error that caused failure */
  error: Error;
  /** Error code from error hierarchy (if available) */
  errorCode?: string;
  /** Timestamp of failure */
  timestamp: Date;
  /** Phase ID where failure occurred */
  phase?: string;
  /** Milestone ID where failure occurred */
  milestone?: string;
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
  shutdownReason: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT' | null = null;

  // ========================================================================
  // Private Fields
  // ========================================================================

  /** Path to PRD file */
  readonly #prdPath: string;

  /** Optional scope for limiting execution */
  readonly #scope?: Scope;

  /** Cache bypass flag from CLI --no-cache */
  readonly #noCache: boolean;

  /** Continue-on-error flag from CLI --continue-on-error */
  readonly #continueOnError: boolean;

  /** Maximum tasks limit from CLI --max-tasks */
  readonly #maxTasks?: number;

  /** Maximum duration limit from CLI --max-duration (milliseconds) */
  readonly #maxDuration?: number;

  /** Resource monitor instance */
  #resourceMonitor?: import('../utils/resource-monitor.js').ResourceMonitor;

  /** Whether resource limit was reached */
  #resourceLimitReached: boolean = false;

  /** Map of failed tasks to error context for error reporting */
  #failedTasks: Map<string, TaskFailure> = new Map();

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

  /** Progress tracker for real-time execution metrics */
  #progressTracker?: ProgressTracker;

  // ========================================================================
  // Constructor
  // ========================================================================

  /**
   * Creates a new PRPPipeline instance
   *
   * @param prdPath - Path to PRD markdown file
   * @param scope - Optional scope to limit execution
   * @param mode - Execution mode: 'normal', 'bug-hunt', or 'validate' (default: 'normal')
   * @param noCache - Whether to bypass PRP cache (default: false)
   * @param continueOnError - Whether to treat all errors as non-fatal (default: false)
   * @param maxTasks - Maximum number of tasks to execute (optional)
   * @param maxDuration - Maximum execution duration in milliseconds (optional)
   * @throws {Error} If prdPath is empty
   */
  constructor(
    prdPath: string,
    scope?: Scope,
    mode?: 'normal' | 'bug-hunt' | 'validate',
    noCache: boolean = false,
    continueOnError: boolean = false,
    maxTasks?: number,
    maxDuration?: number
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
    this.#noCache = noCache;
    this.#continueOnError = continueOnError;
    this.#maxTasks = maxTasks;
    this.#maxDuration = maxDuration;

    // SessionManager will be created in run() to catch initialization errors
    this.sessionManager = null as any;

    // Create TaskOrchestrator (will be initialized with session after initializeSession)
    // Placeholder for now - will be recreated after session initialization
    this.taskOrchestrator = null as any;

    // Create correlation logger with correlation ID
    this.correlationLogger = getLogger('PRPPipeline').child({
      correlationId: this.#correlationId,
    });

    // Create resource monitor if limits specified
    if (maxTasks || maxDuration) {
      this.#resourceMonitor = new ResourceMonitor({
        maxTasks,
        maxDuration,
      });
      this.#resourceMonitor.start();
      this.logger.info(
        { maxTasks, maxDuration },
        '[PRPPipeline] Resource monitoring enabled'
      );
    }

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

  /**
   * Determines if an error should be treated as fatal
   *
   * @param error - Unknown error to evaluate
   * @returns true if error is fatal (should abort pipeline), false otherwise
   *
   * @remarks
   * Fatal errors abort the pipeline immediately. Non-fatal errors are tracked
   * and execution continues.
   *
   * Fatal error types:
   * - Session load/save failures (when --continue-on-error is false)
   * - Validation errors for PRD parsing
   *
   * Non-fatal error types:
   * - Task execution failures (TaskError)
   * - Agent LLM failures (AgentError)
   * - All other errors when --continue-on-error is true
   *
   * @private
   */
  #isFatalError(error: unknown): boolean {
    // If --continue-on-error flag is set, treat all errors as non-fatal
    if (this.#continueOnError) {
      this.logger.warn(
        '[PRPPipeline] --continue-on-error enabled: treating error as non-fatal'
      );
      return false;
    }

    // Null/undefined check
    if (error == null || typeof error !== 'object') {
      return false; // Non-object errors are non-fatal
    }

    // Check for PipelineError from error hierarchy
    if (isPipelineError(error)) {
      // FATAL: Session errors that prevent pipeline execution
      if (isSessionError(error)) {
        return (
          error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
          error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
        );
      }

      // FATAL: Validation errors for PRD parsing
      if (isValidationError(error)) {
        return (
          error.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT &&
          error.context?.operation === 'parse_prd'
        );
      }

      // NON-FATAL: Task and Agent errors are individual failures
      if (isTaskError(error) || isAgentError(error)) {
        return false;
      }
    }

    // Default: non-fatal (continue on unknown errors)
    return false;
  }

  /**
   * Tracks a task failure in the failedTasks Map
   *
   * @param taskId - ID of the task that failed
   * @param error - Error that caused the failure
   * @param context - Optional context about the failure
   *
   * @remarks
   * Creates a TaskFailure record with all available context and stores it
   * in the failedTasks Map. Logs the error with full context for debugging.
   *
   * @private
   */
  #trackFailure(
    taskId: string,
    error: unknown,
    context?: { phase?: string; milestone?: string; taskTitle?: string }
  ): void {
    // Extract error information
    const errorObj = error instanceof Error ? error : new Error(String(error));
    let errorCode: string | undefined;

    // Extract error code from PipelineError
    if (isPipelineError(error)) {
      errorCode = error.code;
    }

    // Check for Node.js error codes
    if (error instanceof Object && 'code' in error) {
      errorCode = (error as { code: string }).code;
    }

    // Get task title from context or use taskId as fallback
    const taskTitle = context?.taskTitle ?? taskId;

    // Create failure record
    const failure: TaskFailure = {
      taskId,
      taskTitle,
      error: errorObj,
      errorCode,
      timestamp: new Date(),
      phase: context?.phase,
      milestone: context?.milestone,
    };

    // Store in failed tasks Map
    this.#failedTasks.set(taskId, failure);

    // Log with full context
    this.logger.error(
      {
        taskId,
        taskTitle: failure.taskTitle,
        errorCode,
        errorMessage: errorObj.message,
        ...(errorObj.stack && { stack: errorObj.stack }),
        timestamp: failure.timestamp.toISOString(),
        ...context,
      },
      '[PRPPipeline] Task failure tracked'
    );
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
        this.#scope,
        this.#noCache
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if error is fatal
      if (this.#isFatalError(error)) {
        this.logger.error(
          `[PRPPipeline] Fatal session initialization error: ${errorMessage}`
        );
        throw error; // Re-throw to abort pipeline
      }

      // Non-fatal: track failure and continue
      this.#trackFailure('initializeSession', error, {
        phase: this.currentPhase,
      });
      this.logger.warn(
        `[PRPPipeline] Non-fatal session initialization error, continuing: ${errorMessage}`
      );
      this.currentPhase = 'session_failed';
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if error is fatal
      if (this.#isFatalError(error)) {
        this.logger.error(
          `[PRPPipeline] Fatal delta handling error: ${errorMessage}`
        );
        throw error; // Re-throw to abort pipeline
      }

      // Non-fatal: track failure and continue
      this.#trackFailure('handleDelta', error, {
        phase: this.currentPhase,
      });
      this.logger.warn(
        `[PRPPipeline] Non-fatal delta handling error, continuing: ${errorMessage}`
      );
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

      // Generate backlog with retry logic
      this.logger.info('[PRPPipeline] Calling Architect agent...');
      // @ts-expect-error -- Groundswell agent.prompt() type signature is incorrect, accepts string
      const _result = await retryAgentPrompt(
        () => architectAgent.prompt(architectPrompt) as Promise<unknown>,
        { agentType: 'Architect', operation: 'decomposePRD' }
      );

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if error is fatal
      if (this.#isFatalError(error)) {
        this.logger.error(
          `[PRPPipeline] Fatal PRD decomposition error: ${errorMessage}`
        );
        throw error; // Re-throw to abort pipeline
      }

      // Non-fatal: track failure and continue
      this.#trackFailure('decomposePRD', error, {
        phase: this.currentPhase,
      });
      this.logger.warn(
        `[PRPPipeline] Non-fatal PRD decomposition error, continuing: ${errorMessage}`
      );
      this.currentPhase = 'prd_decomposition_failed';
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
      // Initialize progress tracker with session backlog
      const backlog = this.sessionManager.currentSession?.taskRegistry;
      if (!backlog) {
        throw new Error('Cannot execute pipeline: no backlog found in session');
      }

      this.#progressTracker = progressTracker({
        backlog,
        logInterval: 5, // Log progress every 5 tasks per work item spec
        barWidth: 40,
      });

      this.logger.info(
        `[PRPPipeline] Progress tracking initialized: ${this.#progressTracker?.getProgress().total ?? 0} subtasks`
      );

      let iterations = 0;
      const maxIterations = 10000; // Safety limit

      // Process items until queue is empty or shutdown requested
      while (await this.taskOrchestrator.processNextItem()) {
        // WRAP: Loop body in try-catch to continue on individual task failures
        try {
          iterations++;

          // Safety check
          if (iterations > maxIterations) {
            throw new Error(`Execution exceeded ${maxIterations} iterations`);
          }

          // Update completed tasks count
          this.completedTasks = this.#countCompletedTasks();

          // Track task completion for progress
          const currentItemId =
            this.taskOrchestrator.currentItemId ?? 'unknown';
          this.#progressTracker?.recordComplete(currentItemId);

          // CRITICAL: Record task completion in resource monitor
          if (this.#resourceMonitor) {
            this.#resourceMonitor.recordTaskComplete();
          }

          // Log progress every 5 tasks
          if (this.completedTasks % 5 === 0) {
            this.logger.info(
              `[PRPPipeline] ${this.#progressTracker?.formatProgress()}`
            );
          }

          // CRITICAL: Check for resource limits after each task
          if (this.#resourceMonitor?.shouldStop()) {
            const status = this.#resourceMonitor.getStatus();
            this.logger.warn(
              {
                limitType: status.limitType,
                tasksCompleted: this.completedTasks,
                snapshot: status.snapshot,
              },
              '[PRPPipeline] Resource limit reached, initiating graceful shutdown'
            );

            if (status.suggestion) {
              this.logger.info(`[PRPPipeline] Suggestion: ${status.suggestion}`);
            }

            this.#resourceLimitReached = true;
            this.shutdownRequested = true;
            this.shutdownReason = 'RESOURCE_LIMIT';
            this.currentPhase = 'resource_limit_reached';
            break;
          }

          // Check for shutdown request after each task
          if (this.shutdownRequested) {
            this.logger.info(
              '[PRPPipeline] Shutdown requested, finishing current task'
            );

            // Log progress state at shutdown
            const progress = this.#progressTracker?.getProgress();
            this.logger.info(
              `[PRPPipeline] Shutting down: ${progress?.completed}/${progress?.total} tasks complete (${progress?.percentage.toFixed(1)}%)`
            );

            this.currentPhase = 'shutdown_interrupted';
            break;
          }

          // Log progress every 10 items (kept for compatibility)
          if (iterations % 10 === 0) {
            this.logger.info(
              `[PRPPipeline] Processed ${iterations} items, ${this.completedTasks}/${this.totalTasks} tasks complete`
            );
          }
        } catch (taskError) {
          // CATCH: Individual task failure - track and continue
          const currentItemId =
            this.taskOrchestrator.currentItemId ?? `iteration-${iterations}`;
          const taskId = currentItemId;

          this.#trackFailure(taskId, taskError, {
            phase: this.currentPhase,
          });

          this.logger.warn(
            {
              taskId,
              error:
                taskError instanceof Error
                  ? taskError.message
                  : String(taskError),
            },
            '[PRPPipeline] Task failed, continuing to next task'
          );

          // Continue to next iteration - don't re-throw
          // TaskOrchestrator already set status to Failed
        }
      }

      // Only log "complete" if not interrupted
      if (!this.shutdownRequested) {
        this.logger.info(`[PRPPipeline] Processed ${iterations} items total`);

        // Final counts
        this.completedTasks = this.#countCompletedTasks();
        const failedTasks = this.#countFailedTasks();

        // Log final progress summary
        const progress = this.#progressTracker?.getProgress();
        this.logger.info('[PRPPipeline] ===== Pipeline Complete =====');
        this.logger.info(
          `[PRPPipeline] Progress: ${this.#progressTracker?.formatProgress()}`
        );
        this.logger.info(
          `[PRPPipeline] Duration: ${(progress?.elapsed ?? 0).toFixed(0)}ms (${((progress?.elapsed ?? 0) / 1000).toFixed(1)}s)`
        );
        this.logger.info(`[PRPPipeline] Complete: ${progress?.completed ?? 0}`);
        this.logger.info(`[PRPPipeline] Failed: ${failedTasks}`);
        this.logger.info('[PRPPipeline] ===== End Summary =====');

        this.currentPhase = 'backlog_complete';
        this.logger.info('[PRPPipeline] Backlog execution complete');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if error is fatal
      if (this.#isFatalError(error)) {
        this.logger.error(
          `[PRPPipeline] Fatal backlog execution error: ${errorMessage}`
        );
        throw error; // Re-throw to abort pipeline
      }

      // Non-fatal: track and continue
      this.#trackFailure('executeBacklog', error, { phase: this.currentPhase });
      this.logger.warn(
        `[PRPPipeline] Non-fatal backlog error, continuing: ${errorMessage}`
      );
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if error is fatal
      if (this.#isFatalError(error)) {
        this.logger.error(
          `[PRPPipeline] Fatal QA cycle error: ${errorMessage}`
        );
        throw error; // Re-throw to abort pipeline
      }

      // QA failure is non-fatal - track and continue
      this.#trackFailure('runQACycle', error, {
        phase: this.currentPhase,
      });
      this.logger.warn(
        `[PRPPipeline] QA cycle failed (non-fatal): ${errorMessage}`
      );
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
      // CRITICAL: Stop resource monitoring
      if (this.#resourceMonitor) {
        this.#resourceMonitor.stop();
        this.logger.debug('[PRPPipeline] Resource monitoring stopped');
      }

      // Log progress state before shutdown
      const progress = this.#progressTracker?.getProgress();
      if (progress) {
        this.logger.info('[PRPPipeline] 💾 Saving progress state', {
          completedTasks: progress.completed,
          pendingTasks: progress.remaining,
          totalTasks: progress.total,
          completionRate: `${progress.percentage.toFixed(1)}%`,
          elapsed: `${progress.elapsed}ms`,
          eta: progress.eta === Infinity ? null : progress.eta,
        });
      }

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
        // FLUSH: Flush any pending batch updates before shutdown
        await this.sessionManager.flushUpdates();
        this.logger.debug('[PRPPipeline] Pending updates flushed on shutdown');

        await this.sessionManager.saveBacklog(backlog);
        this.logger.info('[PRPPipeline] ✅ State saved successfully');

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

      // Check if resource limit was reached and generate report
      if (this.#resourceLimitReached) {
        await this.#generateResourceLimitReport();
      }

      this.currentPhase = 'shutdown_complete';
      this.logger.info('[PRPPipeline] Cleanup complete');
    } catch (error) {
      // Log but don't throw - cleanup failures shouldn't prevent shutdown
      this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
    }
  }

  /**
   * Generates error report if any failures occurred
   *
   * @remarks
   * Creates ERROR_REPORT.md in the session directory with:
   * - Summary of total/completed/failed tasks
   * - List of all failed tasks with error details
   * - Error categories breakdown
   * - Recommendations for fixing failures
   *
   * Only generates report if failedTasks Map is non-empty.
   *
   * @private
   */
  async #generateErrorReport(): Promise<void> {
    // No failures - skip report generation
    if (this.#failedTasks.size === 0) {
      return;
    }

    this.logger.info(
      { failureCount: this.#failedTasks.size },
      '[PRPPipeline] Generating error report'
    );

    const sessionPath = this.sessionManager.currentSession?.metadata.path;
    if (!sessionPath) {
      this.logger.warn(
        '[PRPPipeline] Session path not available for error report'
      );
      return;
    }

    // Build error report data
    const failures = Array.from(this.#failedTasks.values());

    // Categorize by error type
    const errorCategories = {
      taskError: 0,
      agentError: 0,
      validationError: 0,
      sessionError: 0,
      other: 0,
    };

    for (const failure of failures) {
      if (isTaskError(failure.error)) {
        errorCategories.taskError++;
      } else if (isAgentError(failure.error)) {
        errorCategories.agentError++;
      } else if (isValidationError(failure.error)) {
        errorCategories.validationError++;
      } else if (isSessionError(failure.error)) {
        errorCategories.sessionError++;
      } else {
        errorCategories.other++;
      }
    }

    const successRate =
      this.totalTasks > 0
        ? ((this.completedTasks / this.totalTasks) * 100).toFixed(1)
        : '0.0';

    // Generate markdown content
    const content = `# Error Report

**Generated**: ${new Date().toISOString()}
**Pipeline Mode**: ${this.mode}
**Continue on Error**: ${this.#continueOnError ? 'Yes' : 'No'}

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | ${this.totalTasks} |
| Completed | ${this.completedTasks} |
| Failed | ${this.#failedTasks.size} |
| Success Rate | ${successRate}% |

## Failed Tasks

${failures
  .map((failure, index) => {
    const errorType = failure.errorCode
      ? `${failure.error.constructor.name} (${failure.errorCode})`
      : failure.error.constructor.name;

    return `### ${index + 1}. ${failure.taskId}: ${failure.taskTitle}

**Phase**: ${failure.phase || 'Unknown'}
**Milestone**: ${failure.milestone || 'N/A'}
**Error Type**: ${errorType}
**Timestamp**: ${failure.timestamp.toISOString()}

**Error Message**:
\`\`\`
${failure.error.message}
\`\`\`

${
  failure.error.stack
    ? `**Stack Trace**:
\`\`\`
${failure.error.stack.split('\n').slice(0, 5).join('\n')}
...
\`\`\`
`
    : ''
}
`;
  })
  .join('\n---\n')}

## Error Categories

- **TaskError**: ${errorCategories.taskError} tasks
- **AgentError**: ${errorCategories.agentError} tasks
- **ValidationError**: ${errorCategories.validationError} tasks
- **SessionError**: ${errorCategories.sessionError} tasks
- **Other**: ${errorCategories.other} tasks

## Recommendations

1. Review failed tasks above for common patterns
2. Check error messages and stack traces for root causes
3. Fix underlying issues (code, configuration, environment)
4. Re-run pipeline with \`--scope <task-id>\` to retry specific tasks
5. Use \`--continue-on-error\` flag to maximize progress on re-run

**Report Location**: ${sessionPath}/ERROR_REPORT.md
`;

    // Write error report to session directory
    const { resolve } = await import('node:path');
    const { writeFile } = await import('node:fs/promises');
    const reportPath = resolve(sessionPath, 'ERROR_REPORT.md');

    await writeFile(reportPath, content, 'utf-8');
    this.logger.info(`[PRPPipeline] Error report written to ${reportPath}`);
  }

  /**
   * Generates resource limit report when resource limit is reached
   *
   * @remarks
   * Creates RESOURCE_LIMIT_REPORT.md in the session directory with:
   * - Resource snapshot (file handles, memory)
   * - Task progress summary
   * - Actionable suggestions for resolution
   * - Resume instructions
   *
   * Only generates report if resource limit was reached.
   *
   * @private
   */
  async #generateResourceLimitReport(): Promise<void> {
    const status = this.#resourceMonitor?.getStatus();
    if (!status || !status.shouldStop) {
      return;
    }

    const sessionPath = this.sessionManager.currentSession?.metadata.path;
    if (!sessionPath) {
      this.logger.warn(
        '[PRPPipeline] Session path not available for resource report'
      );
      return;
    }

    const progress = this.#progressTracker?.getProgress();
    const snapshot = status.snapshot;

    const content = `# Resource Limit Report

**Generated**: ${new Date().toISOString()}
**Limit Type**: ${status.limitType}
**Tasks Completed**: ${progress?.completed ?? 0} / ${progress?.total ?? 0}

## Summary

The pipeline reached a resource limit and gracefully shut down to prevent system exhaustion.

### Resource Snapshot

| Metric | Value |
|--------|-------|
| File Handles | ${snapshot.fileHandles} |
| File Handle Limit | ${
  snapshot.fileHandleUlimit > 0
    ? snapshot.fileHandleUlimit
    : 'N/A (Windows)'
} |
| File Handle Usage | ${(snapshot.fileHandleUsage * 100).toFixed(1)}% |
| Heap Used | ${(snapshot.heapUsed / 1024 / 1024).toFixed(1)} MB |
| Heap Total | ${(snapshot.heapTotal / 1024 / 1024).toFixed(1)} MB |
| System Memory Used | ${(
    (1 - snapshot.systemFree / snapshot.systemTotal) *
    100
  ).toFixed(1)}% |

### Progress

- **Completed**: ${progress?.completed ?? 0} tasks
- **Remaining**: ${progress?.remaining ?? 0} tasks
- **Completion**: ${progress?.percentage.toFixed(1) ?? 0}%
- **Elapsed**: ${
    progress?.elapsed
      ? (progress.elapsed / 1000).toFixed(1) + 's'
      : 'N/A'
  }

## Recommendations

${status.suggestion ? `- ${status.suggestion}` : ''}

### How to Resume

\`\`\`bash
# Resume from where the pipeline stopped
node dist/index.js --prd PRD.md --continue
\`\`\`

### If Hitting File Handle Limits

\`\`\`bash
# Increase file handle limit (Linux/macOS)
ulimit -n 4096

# Then re-run the pipeline
node dist/index.js --prd PRD.md --continue
\`\`\`

### If Hitting Memory Limits

1. Consider splitting your PRD into smaller phases
2. Use \`--scope P1.M1\` to limit execution to specific milestones
3. Increase system memory or close other applications

---

Report Location: ${sessionPath}/RESOURCE_LIMIT_REPORT.md
`;

    const { resolve } = await import('node:path');
    const { writeFile } = await import('node:fs/promises');
    const reportPath = resolve(sessionPath, 'RESOURCE_LIMIT_REPORT.md');

    await writeFile(reportPath, content, 'utf-8');
    this.logger.info(
      `[PRPPipeline] Resource limit report written to ${reportPath}`
    );
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

      // GENERATE: Error report if any failures occurred
      await this.#generateErrorReport();

      return {
        success: this.#failedTasks.size === 0,
        hasFailures: this.#failedTasks.size > 0,
        sessionPath,
        totalTasks: this.totalTasks,
        completedTasks: this.completedTasks,
        failedTasks: this.#failedTasks.size,
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

      // GENERATE: Error report even on fatal error
      await this.#generateErrorReport();

      return {
        success: false,
        hasFailures: this.#failedTasks.size > 0,
        sessionPath: this.sessionManager?.currentSession?.metadata.path ?? '',
        totalTasks: this.totalTasks,
        completedTasks: this.completedTasks,
        failedTasks: this.#failedTasks.size,
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
