/**
 * PRP Generator for automated Product Requirement Prompt creation
 *
 * @module agents/prp-generator
 *
 * @remarks
 * Orchestrates the Researcher Agent to generate comprehensive PRPs
 * for any Task or Subtask in the backlog. Handles retry logic, file
 * persistence, and error recovery.
 */

// CRITICAL: Import patterns - use .js extensions for ES modules
import { createResearcherAgent } from './agent-factory.js';
import { createPRPBlueprintPrompt } from './prompts/prp-blueprint-prompt.js';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';
import type { Agent } from 'groundswell';
import type { PRPDocument, Task, Subtask, Backlog } from '../core/models.js';
import { PRPDocumentSchema } from '../core/models.js';
import type { SessionManager } from '../core/session-manager.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Custom error for PRP generation failures
 *
 * @remarks
 * Thrown when the Researcher Agent fails to generate a PRP after
 * all retry attempts are exhausted. Includes task ID and attempt
 * count for debugging and monitoring.
 */
export class PRPGenerationError extends Error {
  /**
   * Creates a new PRPGenerationError
   *
   * @param taskId - The work item ID that failed
   * @param attempt - The attempt number that failed (1-indexed)
   * @param originalError - The underlying error that caused the failure
   */
  constructor(
    public readonly taskId: string,
    public readonly attempt: number,
    originalError: unknown
  ) {
    super(
      `Failed to generate PRP for ${taskId} after ${attempt} attempts: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'PRPGenerationError';
  }
}

/**
 * Custom error for PRP file write failures
 *
 * @remarks
 * Thrown when the generated PRP cannot be written to disk. Includes
 * task ID and file path for debugging and recovery.
 */
export class PRPFileError extends Error {
  /**
   * Creates a new PRPFileError
   *
   * @param taskId - The work item ID whose PRP failed to write
   * @param filePath - The file path that could not be written
   * @param originalError - The underlying error that caused the failure
   */
  constructor(
    public readonly taskId: string,
    public readonly filePath: string,
    originalError: unknown
  ) {
    super(
      `Failed to write PRP file for ${taskId} to ${filePath}: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'PRPFileError';
  }
}

/**
 * PRP Generator for automated Product Requirement Prompt creation
 *
 * @remarks
 * Orchestrates the Researcher Agent to generate comprehensive PRPs
 * for any Task or Subtask in the backlog. Handles retry logic, file
 * persistence, and error recovery.
 *
 * Usage flow:
 * 1. Instantiate with SessionManager
 * 2. Call generate() with task/subtask and backlog
 * 3. PRP is generated, validated, and written to disk
 * 4. Returns PRPDocument for downstream use
 *
 * @example
 * ```typescript
 * import { PRPGenerator } from './agents/prp-generator.js';
 *
 * const generator = new PRPGenerator(sessionManager);
 * const prp = await generator.generate(subtask, backlog);
 * // PRP file written to: {sessionPath}/prps/P1M2T2S2.md
 * ```
 */
export class PRPGenerator {
  /** Logger instance for structured logging */
  readonly #logger: Logger;

  /** Session manager for accessing session state and paths */
  readonly sessionManager: SessionManager;

  /** Path to session directory (extracted for convenience) */
  readonly sessionPath: string;

  /** Cached Researcher Agent instance */
  #researcherAgent: Agent;

  /**
   * Creates a new PRPGenerator instance
   *
   * @param sessionManager - Session state manager
   * @throws {Error} If no session is currently loaded
   *
   * @example
   * ```typescript
   * const generator = new PRPGenerator(sessionManager);
   * ```
   */
  constructor(sessionManager: SessionManager) {
    this.#logger = getLogger('PRPGenerator');
    this.sessionManager = sessionManager;

    // Extract session path from current session
    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot create PRPGenerator: no active session');
    }
    this.sessionPath = currentSession.metadata.path;

    // Cache Researcher Agent for reuse
    this.#researcherAgent = createResearcherAgent();
  }

  /**
   * Generates a PRP for the given task or subtask
   *
   * @remarks
   * Executes the Researcher Agent with retry logic and exponential backoff.
   * The generated PRP is validated against the schema and written to disk.
   *
   * Retry configuration:
   * - Max retries: 3
   * - Base delay: 1000ms (1 second)
   * - Max delay: 30000ms (30 seconds)
   * - Exponential backoff: 2^n
   *
   * @param task - The Task or Subtask to generate a PRP for
   * @param backlog - The full Backlog for context extraction
   * @returns Generated PRPDocument with all PRP content
   * @throws {PRPGenerationError} If generation fails after all retries
   * @throws {PRPFileError} If PRP file cannot be written
   *
   * @example
   * ```typescript
   * const subtask = findItem(backlog, 'P1.M2.T2.S2') as Subtask;
   * const prp = await generator.generate(subtask, backlog);
   * console.log(prp.objective); // Feature goal from PRP
   * ```
   */
  async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
    // Retry configuration (from external research)
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Step 1: Build prompt with task context
        const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());

        // Step 2: Execute Researcher Agent
        this.#logger.info(
          { taskId: task.id, attempt: attempt + 1, maxRetries },
          'Generating PRP'
        );
        const result = await this.#researcherAgent.prompt(prompt);

        // Step 3: Validate against schema (defensive programming)
        const validated = PRPDocumentSchema.parse(result);

        // Step 4: Write PRP to file (throws PRPFileError directly on failure)
        await this.#writePRPToFile(validated);

        return validated;
      } catch (error) {
        // PRPFileError should propagate directly - don't retry file write failures
        if (error instanceof PRPFileError) {
          throw error;
        }

        // If this was the last attempt, throw custom error
        if (attempt === maxRetries - 1) {
          throw new PRPGenerationError(task.id, attempt + 1, error);
        }

        // Calculate exponential backoff delay
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        // Log retry attempt
        this.#logger.warn(
          {
            taskId: task.id,
            attempt: attempt + 1,
            error: error instanceof Error ? error.message : String(error),
            delay,
          },
          'PRP generation failed, retrying'
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new PRPGenerationError(task.id, maxRetries, 'Unknown error');
  }

  /**
   * Writes PRP content to markdown file in session directory
   *
   * @remarks
   * Creates the prps directory if it doesn't exist and writes the PRP
   * as markdown. The filename is sanitized from the taskId (dots replaced
   * with underscores).
   *
   * File location: {sessionPath}/prps/{taskId}.md
   *
   * @param prp - The PRPDocument to write
   * @throws {PRPFileError} If file write fails
   * @private
   */
  async #writePRPToFile(prp: PRPDocument): Promise<void> {
    // Sanitize taskId for filename (replace dots with underscores)
    const filename = prp.taskId.replace(/\./g, '_') + '.md';

    // Create prps directory path
    const prpsDir = join(this.sessionPath, 'prps');
    const filePath = join(prpsDir, filename);

    try {
      // Create prps directory if it doesn't exist
      await mkdir(prpsDir, { recursive: true });

      // Format PRP as markdown
      const markdown = this.#formatPRPAsMarkdown(prp);

      // Write PRP file with proper permissions
      await writeFile(filePath, markdown, { mode: 0o644 });

      this.#logger.info({ taskId: prp.taskId, filePath }, 'PRP written');
    } catch (error) {
      throw new PRPFileError(prp.taskId, filePath, error);
    }
  }

  /**
   * Formats PRPDocument as markdown string
   *
   * @remarks
   * Converts the structured PRPDocument into a markdown format suitable
   * for human reading and version control. Follows the PRP template structure
   * with sections for objective, context, implementation steps, validation
   * gates, success criteria, and references.
   *
   * @param prp - The PRPDocument to format
   * @returns Markdown string representation of the PRP
   * @private
   */
  #formatPRPAsMarkdown(prp: PRPDocument): string {
    // Build implementation steps section
    const implementationStepsMd = prp.implementationSteps
      .map((step, i) => `${i + 1}. ${step}`)
      .join('\n');

    // Build validation gates section
    const validationGatesMd = prp.validationGates
      .map(
        (gate, i) =>
          `### Level ${i + 1}: ${gate.level}\n\n${
            gate.command !== null ? gate.command : 'Manual validation required'
          }`
      )
      .join('\n\n');

    // Build success criteria section
    const successCriteriaMd = prp.successCriteria
      .map(c => `- [ ] ${c.description}`)
      .join('\n');

    // Build references section
    const referencesMd = prp.references.map(r => `- ${r}`).join('\n');

    return `# PRP for ${prp.taskId}

## Objective

${prp.objective}

## Context

${prp.context}

## Implementation Steps

${implementationStepsMd}

## Validation Gates

${validationGatesMd}

## Success Criteria

${successCriteriaMd}

## References

${referencesMd}
`;
  }
}

// PATTERN: Export type for convenience
export type { PRPDocument };
