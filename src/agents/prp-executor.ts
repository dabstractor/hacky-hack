/**
 * PRP Executor for automated PRP execution with progressive validation
 *
 * @module agents/prp-executor
 *
 * @remarks
 * Orchestrates the Coder Agent to execute PRPs, runs progressive
 * validation gates (4 levels), and implements fix-and-retry logic
 * for handling validation failures.
 *
 * @example
 * ```ts
 * import { PRPExecutor } from './agents/prp-executor.js';
 *
 * const executor = new PRPExecutor(sessionPath);
 * const result = await executor.execute(prpDocument, prpPath);
 * // Returns ExecutionResult with validation results and artifacts
 * ```
 */

// CRITICAL: Import patterns - use .js extensions for ES modules
import { createCoderAgent } from './agent-factory.js';
import { PRP_BUILDER_PROMPT } from './prompts.js';
import type { Agent } from 'groundswell';
import type { PRPDocument, ValidationGate } from '../core/models.js';
import { BashMCP } from '../tools/bash-mcp.js';

/**
 * Result from a single validation gate execution
 *
 * @remarks
 * Contains the execution results for a single validation gate level,
 * including success status, captured output, and exit code.
 */
export interface ValidationGateResult {
  /** Validation level (1-4) */
  readonly level: 1 | 2 | 3 | 4;
  /** Description of what this level validates */
  readonly description: string;
  /** Whether the validation passed */
  readonly success: boolean;
  /** Command that was executed (null if skipped) */
  readonly command: string | null;
  /** Standard output from command */
  readonly stdout: string;
  /** Standard error from command */
  readonly stderr: string;
  /** Exit code from process (null if skipped) */
  readonly exitCode: number | null;
  /** True if this gate was skipped (manual or no command) */
  readonly skipped: boolean;
}

/**
 * Overall PRP execution result
 *
 * @remarks
 * Contains the complete execution results from running a PRP,
 * including validation gate results, artifacts produced, and
 * overall success status.
 */
export interface ExecutionResult {
  /** Whether all validation gates passed */
  readonly success: boolean;
  /** Results from each validation gate that was executed */
  readonly validationResults: ValidationGateResult[];
  /** File paths created/modified during execution */
  readonly artifacts: string[];
  /** Error message if execution failed */
  readonly error?: string;
  /** Number of fix attempts made (0-2) */
  readonly fixAttempts: number;
}

/**
 * Custom error for PRP execution failures
 *
 * @remarks
 * Thrown when the PRP execution fails at a fundamental level,
 * such as inability to create the agent or parse results.
 */
export class PRPExecutionError extends Error {
  /**
   * Creates a new PRPExecutionError
   *
   * @param taskId - The work item ID that failed
   * @param prpPath - Path to the PRP file
   * @param originalError - The underlying error that caused the failure
   */
  constructor(
    public readonly taskId: string,
    public readonly prpPath: string,
    originalError: unknown
  ) {
    super(
      `Failed to execute PRP for ${taskId} at ${prpPath}: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'PRPExecutionError';
  }
}

/**
 * Custom error for validation failures
 *
 * @remarks
 * Thrown when validation gates fail after all fix attempts
 * are exhausted. Contains detailed information about which
 * gate failed and why.
 */
export class ValidationError extends Error {
  /**
   * Creates a new ValidationError
   *
   * @param level - The validation level that failed (1-4)
   * @param command - The command that was executed
   * @param stdout - Standard output from the command
   * @param stderr - Standard error from the command
   */
  constructor(
    public readonly level: number,
    public readonly command: string,
    public readonly stdout: string,
    public readonly stderr: string
  ) {
    super(
      `Validation failed at Level ${level} for command "${command}":\n${stderr}`
    );
    this.name = 'ValidationError';
  }
}

/**
 * PRP Executor for automated PRP execution with progressive validation
 *
 * @remarks
 * Orchestrates the Coder Agent to execute PRPs, runs progressive
 * validation gates (4 levels), and implements fix-and-retry logic
 * for handling validation failures.
 *
 * Usage flow:
 * 1. Instantiate with session path
 * 2. Call execute() with PRPDocument and file path
 * 3. Coder Agent reads PRP and implements code
 * 4. Validation gates run sequentially (Level 1 → 2 → 3 → 4)
 * 5. If validation fails, fix-and-retry triggers (up to 2 attempts)
 * 6. Returns ExecutionResult with all results and artifacts
 *
 * @example
 * ```typescript
 * import { PRPExecutor } from './agents/prp-executor.js';
 *
 * const executor = new PRPExecutor(sessionPath);
 * const result = await executor.execute(prpDocument, prpPath);
 *
 * if (result.success) {
 *   console.log('All validation gates passed!');
 * } else {
 *   console.error('Failed:', result.error);
 *   console.log('Validation results:', result.validationResults);
 * }
 * ```
 */
export class PRPExecutor {
  /** Path to session directory (for working directory context) */
  readonly sessionPath: string;

  /** Coder Agent instance for PRP execution */
  readonly #coderAgent: Agent;

  /** BashMCP instance for running validation commands */
  readonly #bashMCP: BashMCP;

  /**
   * Creates a new PRPExecutor instance
   *
   * @param sessionPath - Path to session directory for working directory context
   * @throws {Error} If sessionPath is not provided
   *
   * @example
   * ```typescript
   * const executor = new PRPExecutor('/path/to/session');
   * ```
   */
  constructor(sessionPath: string) {
    if (!sessionPath) {
      throw new Error('sessionPath is required for PRPExecutor');
    }
    this.sessionPath = sessionPath;
    this.#coderAgent = createCoderAgent();
    this.#bashMCP = new BashMCP();
  }

  /**
   * Executes a PRP with progressive validation and fix-and-retry
   *
   * @remarks
   * The complete PRP execution flow:
   * 1. Injects PRP path into PRP_BUILDER_PROMPT
   * 2. Executes Coder Agent to implement code
   * 3. Parses JSON result from Coder Agent
   * 4. Runs validation gates sequentially (Level 1 → 2 → 3 → 4)
   * 5. If any gate fails, triggers fix-and-retry (up to 2 attempts)
   * 6. Returns ExecutionResult with all validation results
   *
   * Fix-and-retry configuration:
   * - Max attempts: 2 (1 initial + 2 retries = 3 total)
   * - Base delay: 2000ms (2 seconds)
   * - Max delay: 30000ms (30 seconds)
   * - Exponential backoff: 2^n
   *
   * @param prp - The PRPDocument to execute
   * @param prpPath - File path to the PRP markdown file (for Coder Agent to read)
   * @returns ExecutionResult with validation results and artifacts
   *
   * @example
   * ```typescript
   * const prp: PRPDocument = { ... };
   * const result = await executor.execute(prp, '/path/to/prp.md');
   *
   * console.log(`Success: ${result.success}`);
   * console.log(`Fix attempts: ${result.fixAttempts}`);
   * for (const vr of result.validationResults) {
   *   console.log(`Level ${vr.level}: ${vr.success ? 'PASS' : 'FAIL'}`);
   * }
   * ```
   */
  async execute(prp: PRPDocument, prpPath: string): Promise<ExecutionResult> {
    let fixAttempts = 0;
    const maxFixAttempts = 2;

    // STEP 1: Inject PRP path into prompt
    const injectedPrompt = PRP_BUILDER_PROMPT.replace(
      /\$PRP_FILE_PATH/g,
      prpPath
    );

    try {
      // STEP 2: Execute Coder Agent
      // eslint-disable-next-line no-console -- Intentional logging for execution tracking
      console.log(`Executing PRP for ${prp.taskId}...`);
      const coderResponse = await this.#coderAgent.prompt(injectedPrompt);

      // STEP 3: Parse JSON result
      const coderResult = this.#parseCoderResult(coderResponse as string);

      // If Coder Agent reported error, return failed result
      if (coderResult.result !== 'success') {
        return {
          success: false,
          validationResults: [],
          artifacts: [],
          error: coderResult.message,
          fixAttempts: 0,
        };
      }

      // STEP 4: Run validation gates with fix-and-retry
      let validationResults: ValidationGateResult[] = [];

      while (fixAttempts <= maxFixAttempts) {
        validationResults = await this.#runValidationGates(prp);

        // Check if all gates passed
        const allPassed = validationResults.every(r => r.success || r.skipped);

        if (allPassed) {
          break; // Success!
        }

        // If we have more fix attempts available
        if (fixAttempts < maxFixAttempts) {
          fixAttempts++;
          const delay = Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000);
          // eslint-disable-next-line no-console -- Intentional logging for retry tracking
          console.warn(
            `Validation failed for ${prp.taskId}. ` +
              `Fix attempt ${fixAttempts}/${maxFixAttempts} in ${delay}ms...`
          );
          await this.#sleep(delay);

          // Trigger fix attempt
          await this.#fixAndRetry(prp, validationResults, fixAttempts);
        } else {
          break; // Exhausted fix attempts
        }
      }

      // STEP 5: Build final result
      const allPassed = validationResults.every(r => r.success || r.skipped);

      return {
        success: allPassed,
        validationResults,
        artifacts: [], // TODO: Extract artifacts from Coder Agent output
        error: allPassed
          ? undefined
          : 'Validation failed after all fix attempts',
        fixAttempts,
      };
    } catch (error) {
      return {
        success: false,
        validationResults: [],
        artifacts: [],
        error: error instanceof Error ? error.message : String(error),
        fixAttempts,
      };
    }
  }

  /**
   * Runs all validation gates from the PRP in sequence
   *
   * @remarks
   * Iterates through validationGates in order by level. Skips manual
   * gates or gates with no command. Stops execution on first failure.
   *
   * @param prp - The PRPDocument containing validation gates
   * @returns Array of ValidationGateResult for each executed gate
   * @private
   */
  async #runValidationGates(prp: PRPDocument): Promise<ValidationGateResult[]> {
    const results: ValidationGateResult[] = [];

    // Sort gates by level to ensure sequential execution
    const sortedGates = [...prp.validationGates].sort(
      (a, b) => a.level - b.level
    );

    for (const gate of sortedGates) {
      // Skip manual gates or gates with no command
      if (gate.manual || gate.command === null) {
        results.push({
          level: gate.level,
          description: gate.description,
          success: true, // Skipped gates count as "passed"
          command: gate.command,
          stdout: '',
          stderr: '',
          exitCode: null,
          skipped: true,
        });
        continue;
      }

      // Execute command via BashMCP
      const result = await this.#bashMCP.execute_bash({
        command: gate.command,
        cwd: this.sessionPath,
        timeout: 120000, // 2 minute timeout for validation commands
      });

      const gateResult: ValidationGateResult = {
        level: gate.level,
        description: gate.description,
        success: result.success,
        command: gate.command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode ?? null,
        skipped: false,
      };

      results.push(gateResult);

      // Stop sequential execution on first failure
      if (!gateResult.success) {
        // eslint-disable-next-line no-console -- Intentional logging for validation failures
        console.error(
          `Validation Level ${gate.level} failed: ${gate.description}\n` +
            `Command: ${gate.command}\n` +
            `Exit Code: ${result.exitCode}\n` +
            `Stderr: ${result.stderr}`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Triggers fix-and-retry by providing error context to Coder Agent
   *
   * @remarks
   * Builds error context from failed validation gates and prompts
   * the Coder Agent to fix the issues. The fix prompt includes specific
   * error details to guide the agent's fix attempt.
   *
   * @param prp - The PRPDocument being executed
   * @param failedGates - Validation gates that failed
   * @param attemptNumber - Current fix attempt number (1 or 2)
   * @private
   */
  async #fixAndRetry(
    prp: PRPDocument,
    failedGates: ValidationGateResult[],
    attemptNumber: number
  ): Promise<void> {
    // Build error context
    const errorContext = failedGates
      .filter(g => !g.success && !g.skipped)
      .map(
        g => `
Level ${g.level}: ${g.description}
Command: ${g.command}
Exit Code: ${g.exitCode}
Output: ${g.stdout}
Error: ${g.stderr}
      `
      )
      .join('\n');

    // Create fix prompt
    const fixPrompt = `
The previous implementation failed validation. Please fix the issues.

PRP Task ID: ${prp.taskId}
Failed Validation Gates:
${errorContext}

Fix Attempt: ${attemptNumber}/2

Please analyze the validation failures and fix the implementation.
Focus on the specific errors reported above.

Output your result in the same JSON format:
{
  "result": "success" | "error" | "issue",
  "message": "Detailed explanation"
}
    `.trim();

    // Execute fix attempt
    await this.#coderAgent.prompt(fixPrompt);
  }

  /**
   * Parses JSON result from Coder Agent response
   *
   * @remarks
   * Extracts JSON from the Coder Agent response, handling both
   * raw JSON and markdown code block wrapped JSON.
   *
   * @param response - Raw string response from Coder Agent
   * @returns Parsed result object with result and message fields
   * @private
   */
  #parseCoderResult(response: string): { result: string; message: string } {
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;

      return JSON.parse(jsonStr);
    } catch (error) {
      // If parsing fails, assume error
      return {
        result: 'error',
        message: `Failed to parse Coder Agent response: ${response}`,
      };
    }
  }

  /**
   * Sleep utility for delays
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   * @private
   */
  #sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// PATTERN: Export type for convenience
export type { PRPDocument, ValidationGate };
