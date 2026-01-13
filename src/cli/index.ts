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
import { getLogger } from '../utils/logger.js';

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
 * @example
 * ```typescript
 * const args = parseCLIArgs();
 * const pipeline = new PRPPipeline(args.prd);
 * await pipeline.run();
 * ```
 */
export function parseCLIArgs(): CLIArgs {
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
    .parse(process.argv);

  // Get typed options
  const options = program.opts<CLIArgs>();

  // Validate PRD file exists
  if (!existsSync(options.prd)) {
    logger.error(`PRD file not found: ${options.prd}`);
    logger.error('Please provide a valid PRD file path using --prd');
    process.exit(1);
  }

  // Validate scope format if provided
  if (options.scope) {
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

  return options;
}
