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

import { Workflow } from 'groundswell';
import type { SessionManager } from '../core/session-manager.js';
import type { TaskOrchestrator } from '../core/task-orchestrator.js';
import type { PRPRuntime } from '../agents/prp-runtime.js';
import type { Backlog, Phase, Status } from '../core/models.js';
import type { Scope } from '../core/scope-resolver.js';
import { SessionManager as SessionManagerClass } from '../core/session-manager.js';
import { TaskOrchestrator as TaskOrchestratorClass } from '../core/task-orchestrator.js';

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
 */
export class PRPPipeline extends Workflow {
  // ========================================================================
  // Public Observed State Fields (tracked by Groundswell)
  // ========================================================================

  /** Session state manager */
  sessionManager: SessionManager;

  /** Task execution orchestrator */
  taskOrchestrator: TaskOrchestrator;

  /** PRP Runtime for inner loop execution */
  runtime: PRPRuntime | null = null;

  /** Current pipeline phase */
  currentPhase: string = 'init';

  /** Total number of subtasks in backlog */
  totalTasks: number = 0;

  /** Number of completed subtasks */
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
      const result = await architectAgent.prompt(architectPrompt);

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
   * NOTE: TaskOrchestrator.executeSubtask() is currently a placeholder.
   * Future: Will integrate PRPRuntime for actual PRP execution.
   */
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
