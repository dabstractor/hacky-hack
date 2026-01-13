/**
 * Bug Hunt workflow for three-phase QA testing
 *
 * @module workflows/bug-hunt-workflow
 *
 * @remarks
 * Orchestrates comprehensive QA testing across three phases:
 * 1. Scope Analysis - Understand PRD requirements and expected behaviors
 * 2. Creative E2E Testing - Test happy paths, edge cases, integrations
 * 3. Adversarial Testing - Test unexpected inputs, missing features, UX issues
 *
 * Uses AI-powered QA agent with adversarial mindset to find bugs beyond
 * standard validation. Generates structured TestResults for automated
 * bug fix pipeline integration.
 *
 * @example
 * ```typescript
 * import { BugHuntWorkflow } from './workflows/bug-hunt-workflow.js';
 *
 * const workflow = new BugHuntWorkflow(prdContent, completedTasks);
 * const results = await workflow.run();
 * console.log(`Found ${results.bugs.length} bugs`);
 * ```
 */

import { Workflow, Step } from 'groundswell';
import type { Task, TestResults } from '../core/models.js';
import type { Logger } from '../utils/logger.js';
import { getLogger } from '../utils/logger.js';
import { createQAAgent } from '../agents/agent-factory.js';
import { createBugHuntPrompt } from '../agents/prompts/bug-hunt-prompt.js';

/**
 * Bug Hunt workflow class
 *
 * @remarks
 * Orchestrates the three-phase QA testing process:
 * 1. Scope Analysis - Analyze PRD content to understand requirements
 * 2. Creative E2E Testing - Generate comprehensive test scenarios
 * 3. Adversarial Testing - Find bugs beyond standard validation
 * 4. Generate Report - Execute QA agent and produce TestResults
 *
 * Uses Groundswell Workflow base class with public state fields
 * and @Step decorators for method tracking.
 */
export class BugHuntWorkflow extends Workflow {
  // ========================================================================
  // Public State Fields (observable via Groundswell Workflow base)
  // ========================================================================

  /** Original PRD content for requirement validation */
  prdContent: string;

  /** List of completed tasks to test against PRD */
  completedTasks: Task[];

  /** Generated test results (null until report phase completes) */
  testResults: TestResults | null = null;

  /** Correlation logger with correlation ID for tracing */
  private correlationLogger: Logger;

  // ========================================================================
  // Constructor
  // ========================================================================

  /**
   * Creates a new BugHuntWorkflow instance
   *
   * @param prdContent - The original PRD content for requirement validation
   * @param completedTasks - List of completed tasks to test against PRD
   * @throws {Error} If prdContent is empty or not a string
   * @throws {Error} If completedTasks is not an array
   */
  constructor(prdContent: string, completedTasks: Task[]) {
    super('BugHuntWorkflow');

    // PATTERN: Input validation in constructor
    if (typeof prdContent !== 'string' || prdContent.trim() === '') {
      throw new Error('prdContent must be a non-empty string');
    }

    if (!Array.isArray(completedTasks)) {
      throw new Error('completedTasks must be an array');
    }

    // Initialize properties
    this.prdContent = prdContent;
    this.completedTasks = completedTasks;

    // Create correlation logger with correlation ID
    const correlationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.correlationLogger = getLogger('BugHuntWorkflow').child({
      correlationId,
    });

    this.logger.info('[BugHuntWorkflow] Initialized', {
      prdLength: prdContent.length,
      tasksCount: completedTasks.length,
    });
    this.correlationLogger.info('[BugHuntWorkflow] Initialized', {
      correlationId,
      prdLength: prdContent.length,
      tasksCount: completedTasks.length,
    });
  }

  // ========================================================================
  // Step Methods
  // ========================================================================

  /**
   * Phase 1: Scope Analysis
   *
   * Analyzes PRD content to understand requirements, expected behaviors,
   * user journeys, and edge cases. This phase builds context for testing.
   *
   * @remarks
   * Logs scope analysis findings for observability. Actual analysis
   * is performed by QA agent in generateReport() phase.
   */
  @Step({ trackTiming: true })
  async analyzeScope(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 1: Scope Analysis');
    this.logger.info('[BugHuntWorkflow] Analyzing PRD requirements...', {
      prdLength: this.prdContent.length,
    });

    // Log completed tasks for context
    this.logger.info('[BugHuntWorkflow] Completed tasks for testing:', {
      count: this.completedTasks.length,
      tasks: this.completedTasks.map(t => `${t.id}: ${t.title}`),
    });

    // PATTERN: Log scope findings (QA agent will do actual analysis)
    this.logger.info(
      '[BugHuntWorkflow] Scope analysis complete - QA context established'
    );
  }

  /**
   * Phase 2: Creative End-to-End Testing
   *
   * Generates and executes comprehensive test scenarios covering:
   * - Happy path testing (primary use cases)
   * - Edge case testing (boundaries, empty inputs, unicode)
   * - Workflow testing (complete user journeys)
   * - Integration testing (component interactions)
   * - Error handling (graceful failures)
   * - State testing (transitions and persistence)
   * - Concurrency testing (parallel operations)
   *
   * @remarks
   * Logs test scenario categories. Actual testing is performed
   * by QA agent in generateReport() phase.
   */
  @Step({ trackTiming: true })
  async creativeE2ETesting(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 2: Creative E2E Testing');

    // PATTERN: Log test categories for observability
    const testCategories = [
      'Happy Path Testing',
      'Edge Case Testing',
      'Workflow Testing',
      'Integration Testing',
      'Error Handling',
      'State Testing',
      'Concurrency Testing',
      'Regression Testing',
    ];

    this.logger.info('[BugHuntWorkflow] E2E test categories:', testCategories);

    // QA agent will perform actual testing in generateReport()
    this.logger.info(
      '[BugHuntWorkflow] E2E testing scenarios defined - awaiting QA agent execution'
    );
  }

  /**
   * Phase 3: Adversarial Testing
   *
   * Performs adversarial testing to find bugs beyond standard validation:
   * - Unexpected inputs (undefined scenarios, malformed data)
   * - Missing features (PRD requirements not implemented)
   * - Incomplete features (partial implementations)
   * - Implicit requirements (obvious but unstated functionality)
   * - User experience issues (usability, intuitiveness)
   *
   * @remarks
   * Logs adversarial test categories. Actual testing is performed
   * by QA agent in generateReport() phase.
   */
  @Step({ trackTiming: true })
  async adversarialTesting(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 3: Adversarial Testing');

    // PATTERN: Log adversarial categories for observability
    const adversarialCategories = [
      'Unexpected Inputs',
      'Missing Features',
      'Incomplete Features',
      'Implicit Requirements',
      'User Experience Issues',
      'Security Concerns',
      'Performance Issues',
    ];

    this.logger.info(
      '[BugHuntWorkflow] Adversarial test categories:',
      adversarialCategories
    );

    // QA agent will perform actual adversarial testing in generateReport()
    this.logger.info(
      '[BugHuntWorkflow] Adversarial testing scenarios defined - awaiting QA agent execution'
    );
  }

  /**
   * Phase 4: Generate Bug Report
   *
   * Uses QA agent with createBugHuntPrompt() to generate structured
   * TestResults containing found bugs, severity classification, and
   * fix recommendations.
   *
   * @returns Promise<TestResults> - Structured test results with bug reports
   * @throws {Error} If QA agent fails to generate report
   *
   * @remarks
   * This is the only phase that makes actual LLM calls. The previous
   * phases (analyzeScope, creativeE2ETesting, adversarialTesting) are
   * logical phases for tracking and observability. The QA agent
   * performs all testing work based on PRD + completed tasks context.
   */
  @Step({ trackTiming: true })
  async generateReport(): Promise<TestResults> {
    this.logger.info('[BugHuntWorkflow] Phase 4: Generating Bug Report');

    try {
      // PATTERN: Create QA agent
      const qaAgent = createQAAgent();
      this.logger.info('[BugHuntWorkflow] QA agent created');

      // PATTERN: Create bug hunt prompt with PRD and completed tasks
      const prompt = createBugHuntPrompt(this.prdContent, this.completedTasks);
      this.logger.info('[BugHuntWorkflow] Bug hunt prompt created');

      // PATTERN: Execute QA agent and cast results to TestResults
      const results = (await qaAgent.prompt(prompt)) as TestResults;

      // Store results for observability
      this.testResults = results;

      // Log summary
      this.logger.info('[BugHuntWorkflow] Bug report generated', {
        hasBugs: results.hasBugs,
        bugCount: results.bugs.length,
        criticalCount: results.bugs.filter(b => b.severity === 'critical')
          .length,
        majorCount: results.bugs.filter(b => b.severity === 'major').length,
        minorCount: results.bugs.filter(b => b.severity === 'minor').length,
        cosmeticCount: results.bugs.filter(b => b.severity === 'cosmetic')
          .length,
      });

      // Log summary and recommendations
      this.logger.info(`[BugHuntWorkflow] Summary: ${results.summary}`);
      this.logger.info(
        '[BugHuntWorkflow] Recommendations:',
        results.recommendations
      );

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('[BugHuntWorkflow] Failed to generate bug report', {
        error: errorMessage,
      });
      throw new Error(`Bug report generation failed: ${errorMessage}`);
    }
  }

  // ========================================================================
  // Main Entry Point
  // ========================================================================

  /**
   * Runs the complete bug hunt workflow
   *
   * Orchestrates all four phases sequentially:
   * 1. Scope Analysis - Understand PRD requirements
   * 2. Creative E2E Testing - Define test scenarios
   * 3. Adversarial Testing - Define adversarial scenarios
   * 4. Generate Report - Execute QA and produce TestResults
   *
   * @returns Promise<TestResults> - Structured test results with bug findings
   * @throws {Error} If any phase fails or QA agent fails
   *
   * @remarks
   * The workflow status transitions through: idle → running → completed/failed
   * TestResults.hasBugs drives the bug fix pipeline (true = trigger fix cycle)
   */
  async run(): Promise<TestResults> {
    this.setStatus('running');
    this.correlationLogger.info('[BugHuntWorkflow] Starting bug hunt workflow');
    this.logger.info('[BugHuntWorkflow] Starting bug hunt workflow');

    try {
      // Execute phases sequentially
      await this.analyzeScope();
      await this.creativeE2ETesting();
      await this.adversarialTesting();

      // Generate and return bug report
      const results = await this.generateReport();

      this.setStatus('completed');
      this.logger.info(
        '[BugHuntWorkflow] Bug hunt workflow completed successfully',
        {
          hasBugs: results.hasBugs,
          bugCount: results.bugs.length,
        }
      );

      return results;
    } catch (error) {
      // PATTERN: Set status to failed on error
      this.setStatus('failed');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('[BugHuntWorkflow] Bug hunt workflow failed', {
        error: errorMessage,
      });
      throw error;
    }
  }
}
