/**
 * CLI argument parser for PRP Pipeline
 *
 * @module cli/index
 *
 * @remarks
 * Provides command-line argument parsing and validation for the PRP Pipeline.
 * Uses Commander.js for robust parsing with type safety via TypeScript.
 *
 * Validates:
 * - PRD file exists before execution
 * - Scope string format (if provided)
 * - Mode is one of allowed choices
 *
 * @example
 * ```typescript
 * import { parseCLIArgs } from './cli/index.js';
 *
 * const args = parseCLIArgs();
 * console.log(`PRD: ${args.prd}`);
 * console.log(`Mode: ${args.mode}`);
 * if (args.scope) {
 *   console.log(`Scope: ${args.scope}`);
 * }
 * ```
 */

import { Command } from 'commander';
import { parseScope, ScopeParseError } from '../core/scope-resolver.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getLogger } from '../utils/logger.js';
import { InspectCommand, type InspectorOptions } from './commands/inspect.js';
import { ArtifactsCommand } from './commands/artifacts.js';
import * as os from 'node:os';

const logger = getLogger('CLI');

// ===== TYPE DEFINITIONS =====

/**
 * Parsed CLI arguments
 *
 * @remarks
 * All options are fully typed for compile-time safety.
 * Defaults are applied for unspecified options.
 *
 * @property prd - Path to PRD markdown file (required)
 * @property scope - Optional scope identifier (e.g., "P3.M4")
 * @property mode - Execution mode: normal, bug-hunt, or validate
 * @property continue - Resume from previous session
 * @property dryRun - Show plan without executing
 * @property verbose - Enable debug logging
 * @property machineReadable - Enable machine-readable JSON output
 * @property progressMode - Progress display mode: auto, always, or never
 */
export interface CLIArgs {
  /** Path to PRD markdown file */
  prd: string;

  /** Optional scope to limit execution (e.g., "P3.M4") */
  scope?: string;

  /** Execution mode */
  mode: 'normal' | 'bug-hunt' | 'validate';

  /** Resume from previous session */
  continue: boolean;

  /** Show plan without executing */
  dryRun: boolean;

  /** Enable debug logging */
  verbose: boolean;

  /** Enable machine-readable JSON output */
  machineReadable: boolean;

  /** Bypass PRP cache and regenerate all PRPs */
  noCache: boolean;

  /** Treat all errors as non-fatal and continue pipeline execution */
  continueOnError: boolean;

  /** Validate PRD syntax and structure without executing */
  validatePrd: boolean;

  /** Maximum number of tasks to execute (optional) */
  maxTasks?: number;

  /** Maximum execution duration in milliseconds (optional) */
  maxDuration?: number;

  /** Monitoring interval in milliseconds (1000-60000, default: 30000) */
  monitorInterval?: number;

  /** Progress display mode (auto/always/never) */
  progressMode?: 'auto' | 'always' | 'never';

  /** Max concurrent subtasks (1-10, default: 2) - may be string from commander */
  parallelism: number | string;

  /** Max concurrent research tasks (1-10, default: 3) - may be string from commander */
  researchConcurrency: number | string;
}

/**
 * Validated CLI arguments where parallelism is guaranteed to be a number
 *
 * @remarks
 * This is the type returned by parseCLIArgs() after validation.
 * The parallelism value is parsed and validated as a number.
 */
export interface ValidatedCLIArgs extends Omit<
  CLIArgs,
  'parallelism' | 'researchConcurrency'
> {
  /** Max concurrent subtasks (1-10, default: 2) - validated as number */
  parallelism: number;

  /** Max concurrent research tasks (1-10, default: 3) - validated as number */
  researchConcurrency: number;
}

// ===== MAIN FUNCTION =====

/**
 * Parses CLI arguments into typed configuration
 *
 * @returns Parsed and validated CLI arguments
 * @throws {Error} If PRD file doesn't exist
 * @throws {ScopeParseError} If scope string is invalid
 *
 * @remarks
 * Uses Commander.js to parse process.argv and validate options.
 * Performs additional validation:
 * - Checks PRD file exists
 * - Parses scope string using ScopeResolver
 *
 * Exits with code 1 on validation failures.
 *
 * Supports subcommands:
 * - No subcommand: Default pipeline execution (legacy behavior)
 * - `inspect`: Inspect pipeline state and session details
 * - `artifacts`: View and compare pipeline artifacts
 *
 * @example
 * ```typescript
 * // Legacy pipeline execution
 * const args = parseCLIArgs();
 * const pipeline = new PRPPipeline(args.prd);
 * await pipeline.run();
 *
 * // Or use inspect subcommand
 * // CLI: prp-pipeline inspect
 *
 * // Or use artifacts subcommand
 * // CLI: prp-pipeline artifacts list
 * ```
 */
export function parseCLIArgs():
  | ValidatedCLIArgs
  | { subcommand: 'inspect'; options: InspectorOptions }
  | { subcommand: 'artifacts'; options: Record<string, unknown> } {
  const program = new Command();

  // Configure program
  program
    .name('prp-pipeline')
    .description('PRD to PRP Pipeline - Automated software development')
    .version('1.0.0')
    // Required options
    .option('--prd <path>', 'Path to PRD markdown file', './PRD.md')
    // Optional options
    .option('--scope <scope>', 'Scope identifier (e.g., P3.M4, P3.M4.T2)')
    // Mode with choices
    .addOption(
      program
        .createOption('--mode <mode>', 'Execution mode')
        .choices(['normal', 'bug-hunt', 'validate'])
        .default('normal')
    )
    // Boolean flags with explicit defaults
    .option('--continue', 'Resume from previous session', false)
    .option('--dry-run', 'Show plan without executing', false)
    .option('--verbose', 'Enable debug logging', false)
    .option('--machine-readable', 'Enable machine-readable JSON output', false)
    .option('--no-cache', 'Bypass cache and regenerate all PRPs', false)
    .option('--continue-on-error', 'Treat all errors as non-fatal', false)
    .option(
      '--validate-prd',
      'Validate PRD and exit without running pipeline',
      false
    )
    .option('--max-tasks <number>', 'Maximum number of tasks to execute')
    .option('--max-duration <ms>', 'Maximum execution duration in milliseconds')
    .option(
      '--monitor-interval <ms>',
      'Resource monitoring interval in milliseconds (1000-60000, default: 30000)'
    )
    .option(
      '--parallelism <n>',
      'Max concurrent subtasks (1-10, default: 2)',
      '2'
    )
    .option(
      '--research-concurrency <n>',
      'Max concurrent research tasks (1-10, default: 3, env: RESEARCH_QUEUE_CONCURRENCY)',
      process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3'
    )
    // Progress mode with choices
    .addOption(
      program
        .createOption('--progress-mode <mode>', 'Progress display mode')
        .choices(['auto', 'always', 'never'])
        .default('auto')
    )
    // Default action when no subcommand is given - enables running with just options
    .action(() => {
      // No-op: actual execution happens in main() after parseCLIArgs() returns
    });

  // Add inspect subcommand
  program
    .command('inspect')
    .description('Inspect pipeline state and session details')
    .option(
      '-o, --output <format>',
      'Output format (table, json, yaml, tree)',
      'table'
    )
    .option('--task <id>', 'Show detailed information for specific task')
    .option('-f, --file <path>', 'Override tasks.json file path')
    .option('--session <id>', 'Inspect specific session by hash')
    .option('-v, --verbose', 'Show verbose output', false)
    .option('--artifacts', 'Show only artifact information', false)
    .option('--errors', 'Show only error information', false)
    .action(async options => {
      try {
        const inspectCommand = new InspectCommand();
        await inspectCommand.execute(options as InspectorOptions);
        // Exit successfully after inspect
        process.exit(0);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Inspect command failed: ${errorMessage}`);
        process.exit(1);
      }
    });

  // Add artifacts subcommand
  program
    .command('artifacts')
    .description('View and compare pipeline artifacts')
    .argument('[action]', 'Action: list, view, diff', 'list')
    .option('--session <id>', 'Session ID')
    .option('--task <id>', 'Task ID (for view)')
    .option('--task1 <id>', 'First task ID (for diff)')
    .option('--task2 <id>', 'Second task ID (for diff)')
    .option('-o, --output <format>', 'Output format: table, json', 'table')
    .option('--no-color', 'Disable colored output')
    .action(async (action, options) => {
      try {
        const planDir = resolve('plan');
        const prdPath = resolve('PRD.md');
        const artifactsCommand = new ArtifactsCommand(planDir, prdPath);
        await artifactsCommand.execute(action, options);
        // Exit successfully after artifacts
        process.exit(0);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Artifacts command failed: ${errorMessage}`);
        process.exit(1);
      }
    });

  // Parse arguments
  program.parse(process.argv);

  // Check if a subcommand was invoked
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0] === 'inspect') {
    // Inspect subcommand was invoked and already handled by action()
    // This return is for type safety; actual execution already happened
    return {
      subcommand: 'inspect',
      options: {
        output: 'table',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      },
    };
  }
  if (args.length > 0 && args[0] === 'artifacts') {
    // Artifacts subcommand was invoked and already handled by action()
    // This return is for type safety; actual execution already happened
    return {
      subcommand: 'artifacts',
      options: {},
    };
  }

  // Get typed options for default pipeline execution
  const options = program.opts<CLIArgs>();

  // Validate PRD file exists
  if (!existsSync(options.prd)) {
    logger.error(`PRD file not found: ${options.prd}`);
    logger.error('Please provide a valid PRD file path using --prd');
    process.exit(1);
  }

  // Validate scope format if provided
  if (options.scope !== undefined && options.scope.trim() !== '') {
    try {
      parseScope(options.scope);
      // Scope is valid, continue
    } catch (error) {
      if (error instanceof ScopeParseError) {
        logger.error(`Invalid scope "${options.scope}"`);
        logger.error(
          `Expected format: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, or all`
        );
        logger.error(`Details: ${error.message}`);
        process.exit(1);
      }
      // Re-throw unexpected errors
      throw error;
    }
  }

  // Validate maxTasks
  if (options.maxTasks !== undefined) {
    if (!Number.isInteger(options.maxTasks) || options.maxTasks <= 0) {
      logger.error('--max-tasks must be a positive integer');
      process.exit(1);
    }
  }

  // Validate maxDuration
  if (options.maxDuration !== undefined) {
    if (!Number.isInteger(options.maxDuration) || options.maxDuration <= 0) {
      logger.error('--max-duration must be a positive integer (milliseconds)');
      process.exit(1);
    }
  }

  // Validate monitorInterval
  if (options.monitorInterval !== undefined) {
    const monitorInterval = Number(options.monitorInterval);
    if (
      !Number.isInteger(monitorInterval) ||
      monitorInterval < 1000 ||
      monitorInterval > 60000
    ) {
      logger.error(
        '--monitor-interval must be an integer between 1000 and 60000'
      );
      process.exit(1);
    }
    // Convert to number
    options.monitorInterval = monitorInterval;
  }

  // Validate parallelism
  const parallelismStr =
    typeof options.parallelism === 'string'
      ? options.parallelism
      : String(options.parallelism);
  const parallelism = parseInt(parallelismStr, 10);

  if (isNaN(parallelism) || parallelism < 1 || parallelism > 10) {
    logger.error('--parallelism must be an integer between 1 and 10');
    process.exit(1);
  }

  // System resource warnings (non-blocking)
  const cpuCores = os.cpus().length;
  const freeMemoryGB = os.freemem() / 1024 ** 3;

  if (parallelism > cpuCores) {
    logger.warn(
      `⚠️  Warning: Parallelism (${parallelism}) exceeds CPU cores (${cpuCores})`
    );
    logger.warn(`   This may cause context switching overhead.`);
    logger.warn(`   Recommended: --parallelism ${Math.max(1, cpuCores - 1)}`);
  }

  // Memory warning
  const estimatedMemoryGB = parallelism * 0.5; // Assume 500MB per worker
  if (estimatedMemoryGB > freeMemoryGB * 0.8) {
    logger.warn(
      `⚠️  Warning: High parallelism may exhaust free memory (${freeMemoryGB.toFixed(1)}GB available)`
    );
  }

  // Store validated number value
  options.parallelism = parallelism;

  // Validate research-concurrency
  const researchConcurrencyStr =
    typeof options.researchConcurrency === 'string'
      ? options.researchConcurrency
      : String(options.researchConcurrency);
  const researchConcurrency = parseInt(researchConcurrencyStr, 10);

  if (
    isNaN(researchConcurrency) ||
    researchConcurrency < 1 ||
    researchConcurrency > 10
  ) {
    logger.error('--research-concurrency must be an integer between 1 and 10');
    process.exit(1);
  }

  // System resource warnings (non-blocking)
  if (researchConcurrency > cpuCores) {
    logger.warn(
      `⚠️  Warning: Research concurrency (${researchConcurrency}) exceeds CPU cores (${cpuCores})`
    );
    logger.warn(`   This may cause context switching overhead.`);
  }

  // Memory warning (lighter than task executor - 300MB per task)
  const estimatedResearchMemoryGB = researchConcurrency * 0.3;
  if (estimatedResearchMemoryGB > freeMemoryGB * 0.8) {
    logger.warn(
      `⚠️  Warning: High research concurrency may exhaust free memory (${freeMemoryGB.toFixed(1)}GB available)`
    );
  }

  // Store validated number value
  options.researchConcurrency = researchConcurrency;

  return options as ValidatedCLIArgs;
}

/**
 * Type guard to check if parsed args are CLIArgs (not a subcommand)
 *
 * @param args - Parsed args to check
 * @returns True if args is CLIArgs
 *
 * @example
 * ```typescript
 * const args = parseCLIArgs();
 * if (isCLIArgs(args)) {
 *   console.log(args.prd); // TypeScript knows this is CLIArgs
 * }
 * ```
 */
export function isCLIArgs(
  args: ValidatedCLIArgs | { subcommand: string; options: unknown }
): args is ValidatedCLIArgs {
  return !('subcommand' in args);
}
