/**
 * Resume command generation for pipeline recovery
 *
 * @module utils/errors/resume-command-builder
 *
 * @remarks
 * Generates resume commands for various recovery strategies including retry,
 * skip, continue, and interactive modes.
 *
 * @example
 * ```typescript
 * import { ResumeCommandBuilder } from './resume-command-builder.js';
 *
 * const builder = new ResumeCommandBuilder();
 * const retryCmd = builder.buildRetryCommand('P1.M1.T1.S1', 'session123');
 * console.log(retryCmd); // 'npm run prp -- --task P1.M1.T1.S1 --retry'
 * ```
 */

import type { ResumeCommandOptions } from './types.js';

/**
 * Resume command builder with fluent API
 *
 * @remarks
 * Generates npm commands for resuming pipeline execution after failures.
 * Supports multiple recovery strategies.
 */
export class ResumeCommandBuilder {
  /** Base npm command for pipeline execution */
  readonly #baseCommand = 'npm run prp --';

  /**
   * Build resume command from options
   *
   * @param options - Command generation options
   * @returns Complete resume command string
   *
   * @remarks
   * Routes to specific builder method based on strategy.
   */
  buildCommand(options: ResumeCommandOptions): string {
    switch (options.strategy) {
      case 'retry':
        return this.buildRetryCommand(
          options.taskId,
          options.sessionId,
          options.flags
        );
      case 'skip':
        return this.buildSkipCommand(options.taskId, options.sessionId);
      case 'continue':
        return this.buildContinueCommand(options.sessionId);
      case 'interactive':
        return this.buildInteractiveCommand(options.sessionId);
      default:
        return this.buildRetryCommand(options.taskId, options.sessionId);
    }
  }

  /**
   * Build retry command for a specific task
   *
   * @param taskId - Task ID to retry
   * @param sessionId - Session identifier
   * @param flags - Optional additional flags
   * @returns Retry command string
   *
   * @remarks
   * Generates: npm run prp -- --task <taskId> --retry [flags...]
   */
  buildRetryCommand(
    taskId: string,
    _sessionId: string,
    flags?: string[]
  ): string {
    const parts = [this.#baseCommand, `--task ${taskId}`, '--retry'];

    if (flags && flags.length > 0) {
      parts.push(...flags);
    }

    return parts.join(' ');
  }

  /**
   * Build skip command to bypass a failed task
   *
   * @param taskId - Task ID to skip
   * @param sessionId - Session identifier
   * @param skipDependents - Whether to also skip dependent tasks
   * @returns Skip command string
   *
   * @remarks
   * Generates: npm run prp -- --skip <taskId> [--skip-dependents]
   *
   * Warning: Skipping tasks may cause downstream failures if dependencies
   * are not met.
   */
  buildSkipCommand(
    taskId: string,
    _sessionId: string,
    skipDependents = false
  ): string {
    const parts = [this.#baseCommand, `--skip ${taskId}`];

    if (skipDependents) {
      parts.push('--skip-dependents');
    }

    return parts.join(' ');
  }

  /**
   * Build continue command to resume from checkpoint
   *
   * @param sessionId - Session identifier
   * @returns Continue command string
   *
   * @remarks
   * Generates: npm run prp -- --continue
   *
   * Resumes execution from the last checkpoint, continuing with
   * remaining tasks.
   */
  buildContinueCommand(_sessionId: string): string {
    return `${this.#baseCommand} --continue`;
  }

  /**
   * Build interactive resume command
   *
   * @param sessionId - Session identifier
   * @returns Interactive command string
   *
   * @remarks
   * Generates: npm run prp -- --interactive
   *
   * Launches interactive mode where user can choose recovery strategy
   * for each failed task.
   */
  buildInteractiveCommand(_sessionId: string): string {
    return `${this.#baseCommand} --interactive`;
  }

  /**
   * Build verbose retry command with detailed logging
   *
   * @param taskId - Task ID to retry
   * @param sessionId - Session identifier
   * @returns Verbose retry command
   *
   * @remarks
   * Generates: npm run prp -- --task <taskId> --retry --verbose
   *
   * Use this when debugging intermittent failures.
   */
  buildVerboseRetryCommand(taskId: string, _sessionId: string): string {
    return this.buildRetryCommand(taskId, _sessionId, ['--verbose']);
  }

  /**
   * Build dry-run command to preview execution
   *
   * @param taskId - Task ID to preview
   * @param sessionId - Session identifier
   * @returns Dry-run command
   *
   * @remarks
   * Generates: npm run prp -- --task <taskId> --dry-run
   *
   * Shows what would be executed without making changes.
   */
  buildDryRunCommand(taskId: string, _sessionId: string): string {
    return `${this.#baseCommand} --task ${taskId} --dry-run`;
  }

  /**
   * Build force command to bypass validation
   *
   * @param taskId - Task ID to force execute
   * @param sessionId - Session identifier
   * @returns Force command
   *
   * @remarks
   * Generates: npm run prp -- --task <taskId> --force
   *
   * WARNING: Use with caution. Bypasses validation gates.
   */
  buildForceCommand(taskId: string, _sessionId: string): string {
    return `${this.#baseCommand} --task ${taskId} --force`;
  }

  /**
   * Get command description for display
   *
   * @param command - Command string to describe
   * @returns Human-readable description
   *
   * @remarks
   * Analyzes command string to generate a user-friendly description.
   */
  getCommandDescription(command: string): string {
    if (command.includes('--skip')) {
      return 'Skip this task and continue';
    }
    if (command.includes('--retry')) {
      return 'Retry this task';
    }
    if (command.includes('--continue')) {
      return 'Continue from this point';
    }
    if (command.includes('--interactive')) {
      return 'Enter interactive recovery mode';
    }
    if (command.includes('--dry-run')) {
      return 'Preview without executing';
    }
    if (command.includes('--force')) {
      return 'Force execution (bypasses validation)';
    }
    return 'Run command';
  }

  /**
   * Build all recovery commands for a task
   *
   * @param taskId - Task ID
   * @param sessionId - Session identifier
   * @returns Array of all available recovery commands
   *
   * @remarks
   * Returns multiple command options so users can choose their
   * preferred recovery strategy.
   */
  buildAllCommands(taskId: string, sessionId: string): string[] {
    return [
      this.buildRetryCommand(taskId, sessionId),
      this.buildSkipCommand(taskId, sessionId),
      this.buildVerboseRetryCommand(taskId, sessionId),
      this.buildDryRunCommand(taskId, sessionId),
    ];
  }

  /**
   * Format commands as markdown code block
   *
   * @param commands - Array of command strings
   * @param descriptions - Optional descriptions for each command
   * @returns Markdown formatted code block
   *
   * @remarks
   * Formats commands for display in ERROR_REPORT.md with descriptions.
   */
  formatAsMarkdown(commands: string[], descriptions?: string[]): string {
    const lines: string[] = [];

    for (let i = 0; i < commands.length; i++) {
      const desc = descriptions?.[i] || this.getCommandDescription(commands[i]);
      lines.push(`# ${desc}`);
      lines.push(`$ ${commands[i]}`);
      if (i < commands.length - 1) {
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Build resume command builder (fluent API)
   *
   * @returns Fluent builder for command construction
   *
   * @remarks
   * Provides a fluent interface for building complex commands.
   *
   * @example
   * ```typescript
   * const cmd = builder.build()
   *   .task('P1.M1.T1.S1')
   *   .session('session123')
   *   .retry()
   *   .verbose()
   *   .get();
   * ```
   */
  build(): FluentResumeBuilder {
    return new FluentResumeBuilder(this.#baseCommand);
  }
}

/**
 * Fluent builder for resume commands
 *
 * @remarks
 * Provides a fluent API for constructing complex resume commands.
 * Chain methods to build the desired command.
 */
export class FluentResumeBuilder {
  #parts: string[] = [];
  #baseCommand: string;

  constructor(baseCommand: string) {
    this.#baseCommand = baseCommand;
    this.#parts = [baseCommand];
  }

  /** Specify task ID */
  task(taskId: string): this {
    this.#parts.push(`--task ${taskId}`);
    return this;
  }

  /** Specify session ID */
  session(_sessionId: string): this {
    // Session ID is implicit in current implementation
    return this;
  }

  /** Add retry flag */
  retry(): this {
    this.#parts.push('--retry');
    return this;
  }

  /** Add skip flag */
  skip(): this {
    this.#parts.push('--skip');
    return this;
  }

  /** Add continue flag */
  continue(): this {
    this.#parts.push('--continue');
    return this;
  }

  /** Add verbose flag */
  verbose(): this {
    this.#parts.push('--verbose');
    return this;
  }

  /** Add dry-run flag */
  dryRun(): this {
    this.#parts.push('--dry-run');
    return this;
  }

  /** Add force flag */
  force(): this {
    this.#parts.push('--force');
    return this;
  }

  /** Add custom flag */
  flag(flag: string): this {
    this.#parts.push(flag);
    return this;
  }

  /** Build and return command string */
  get(): string {
    return this.#parts.join(' ');
  }

  /** Reset builder for new command */
  reset(): FluentResumeBuilder {
    this.#parts = [this.#baseCommand];
    return this;
  }
}
