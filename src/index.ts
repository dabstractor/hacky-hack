#!/usr/bin/env node
/**
 * Main entry point for PRP Pipeline CLI application
 *
 * @packageDocumentation
 *
 * @module index
 *
 * @remarks
 * This is the primary entry point for the PRD-to-PRP Pipeline application.
 * It configures the environment, parses CLI arguments, creates the pipeline,
 * and manages the complete application lifecycle from start to exit.
 *
 * Exit codes:
 * - 0: Success
 * - 1: Error (general)
 * - 130: SIGINT (Ctrl+C)
 *
 * @example
 * ```bash
 * # Run full pipeline
 * npm run dev -- --prd ./PRD.md
 *
 * # Run with scope
 * npm run dev -- --prd ./PRD.md --scope P3.M4
 *
 * # Resume interrupted session
 * npm run dev -- --prd ./PRD.md --continue
 *
 * # Debug mode
 * npm run dev -- --prd ./PRD.md --verbose
 *
 * # Preview mode
 * npm run dev -- --prd ./PRD.md --dry-run
 * ```
 */

import { configureEnvironment } from './config/environment.js';
import { parseCLIArgs, type CLIArgs } from './cli/index.js';
import { PRPPipeline } from './workflows/prp-pipeline.js';
import { parseScope, type Scope } from './core/scope-resolver.js';
import { getLogger, type Logger } from './utils/logger.js';
import { PRDValidator } from './utils/prd-validator.js';

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

/**
 * Sets up global error handlers for uncaught exceptions and rejections
 *
 * @remarks
 * These handlers prevent silent failures and provide debugging information.
 * They set process.exitCode but don't exit immediately to allow cleanup.
 */
function setupGlobalHandlers(verbose: boolean): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('\n❌ UNCAUGHT EXCEPTION');
    console.error(`Message: ${error.message}`);
    if (verbose && (error.stack ?? undefined)) {
      console.error(`Stack:\n${error.stack}`);
    }
    process.exitCode = 1;
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('\n❌ UNHANDLED PROMISE REJECTION');
    console.error(`Reason: ${reason}`);
    process.exitCode = 1;
  });
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main application entry point
 *
 * @returns Exit code (0=success, 1=error, 130=SIGINT)
 *
 * @remarks
 * Executes the complete PRP Pipeline workflow:
 * 1. Configures environment
 * 2. Parses CLI arguments
 * 3. Creates pipeline instance
 * 4. Runs pipeline
 * 5. Displays results
 *
 * Environment configuration MUST happen first to ensure API keys are set.
 */
async function main(): Promise<number> {
  // Parse CLI arguments first (this may exit on validation failure)
  const args: CLIArgs = parseCLIArgs();

  // Setup global error handlers (preserve console.error for uncaught exceptions)
  setupGlobalHandlers(args.verbose);

  // CRITICAL: Configure environment before any API operations
  configureEnvironment();

  // Initialize root logger
  const logger: Logger = getLogger('App', {
    verbose: args.verbose,
    machineReadable: args.machineReadable,
  });

  // Verbose logging
  if (args.verbose) {
    logger.debug('Verbose mode enabled');
    logger.debug('Parsed CLI arguments:', args);
  }

  // Handle dry-run mode
  if (args.dryRun) {
    logger.info('🔍 DRY RUN - would execute with:');
    logger.info(`  PRD: ${args.prd}`);
    logger.info(`  Mode: ${args.mode}`);
    if (args.scope) {
      logger.info(`  Scope: ${args.scope}`);
    }
    if (args.continue) {
      logger.info(`  Resume: enabled`);
    }
    return 0;
  }

  // Handle --validate-prd mode: early exit after validation
  if (args.validatePrd) {
    logger.info('🔍 Validating PRD...');

    const validator = new PRDValidator();
    const result = await validator.validate(args.prd);

    // Print validation report
    console.log('\n' + '='.repeat(60));
    console.log('PRD Validation Report');
    console.log('='.repeat(60));
    console.log(`File: ${result.prdPath}`);
    console.log(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`\nSummary:`);
    console.log(`  Critical: ${result.summary.critical}`);
    console.log(`  Warnings: ${result.summary.warning}`);
    console.log(`  Info: ${result.summary.info}`);

    if (result.issues.length > 0) {
      console.log(`\nIssues:`);
      for (const issue of result.issues) {
        const icon =
          issue.severity === 'critical'
            ? '❌'
            : issue.severity === 'warning'
              ? '⚠️'
              : 'ℹ️';
        console.log(
          `\n${icon} [${issue.severity.toUpperCase()}] ${issue.message}`
        );
        if (issue.suggestion) {
          console.log(`   Suggestion: ${issue.suggestion}`);
        }
        if (issue.reference) {
          console.log(`   Reference: ${issue.reference}`);
        }
      }
    }

    console.log('='.repeat(60) + '\n');

    // Exit with appropriate code
    return result.valid ? 0 : 1;
  }

  // Parse scope if provided
  const scope: Scope | undefined = args.scope
    ? parseScope(args.scope)
    : undefined;

  if (args.verbose && scope) {
    logger.debug('Parsed scope:', scope);
  }

  // Create pipeline instance
  if (args.verbose) {
    logger.debug('Creating PRPPipeline instance');
  }
  const pipeline = new PRPPipeline(
    args.prd,
    scope,
    args.mode,
    args.noCache,
    args.continueOnError
  );

  // Run pipeline
  if (args.verbose) {
    logger.debug('Starting pipeline execution');
  }
  const result = await pipeline.run();

  // Handle result based on state
  if (result.shutdownInterrupted) {
    // User interrupted with Ctrl+C
    logger.info(`\n⚠️  Pipeline interrupted by ${result.shutdownReason}`);
    logger.info(
      `📊 Progress: ${result.completedTasks}/${result.totalTasks} tasks completed`
    );
    logger.info(`💾 State saved to: ${result.sessionPath}`);
    logger.info(`\n🚀 To resume, run:`);
    logger.info(`   npm run dev -- --prd ${args.prd} --continue`);
    return 130; // SIGINT exit code
  }

  if (!result.success) {
    // Pipeline failed with fatal error
    logger.info(`\n❌ Pipeline failed`);
    if (result.error) {
      logger.info(`Error: ${result.error}`);
    }
    logger.info(`📊 Failed tasks: ${result.failedTasks}/${result.totalTasks}`);
    logger.info(`💾 Session: ${result.sessionPath}`);
    if (result.hasFailures && result.sessionPath) {
      logger.info(`\n📄 Error report: ${result.sessionPath}/ERROR_REPORT.md`);
    }
    if (args.continue) {
      logger.info(`\n🚀 To retry, run:`);
      logger.info(`   npm run dev -- --prd ${args.prd} --continue`);
    }
    return 1;
  }

  if (result.hasFailures) {
    // Pipeline completed but some tasks failed
    logger.info(`\n⚠️  Pipeline completed with failures`);
    logger.info(
      `📊 Tasks: ${result.completedTasks}/${result.totalTasks} completed, ${result.failedTasks} failed`
    );
    logger.info(`⏱️  Duration: ${(result.duration / 1000).toFixed(1)}s`);
    logger.info(`💾 Session: ${result.sessionPath}`);
    logger.info(`\n📄 Error report: ${result.sessionPath}/ERROR_REPORT.md`);
    logger.info(`\n🚀 To retry failed tasks, run:`);
    logger.info(
      `   npm run dev -- --prd ${args.prd} --continue --scope <task-id>`
    );
    return 1; // Exit with error code when any tasks failed
  }

  // Pipeline succeeded
  logger.info(`\n✅ Pipeline completed successfully`);
  logger.info(
    `📊 Tasks: ${result.completedTasks}/${result.totalTasks} completed`
  );
  logger.info(`⏱️  Duration: ${(result.duration / 1000).toFixed(1)}s`);
  logger.info(`💾 Session: ${result.sessionPath}`);
  if (result.bugsFound > 0) {
    logger.info(`🐛 Bugs found: ${result.bugsFound}`);
  }

  return 0;
}

// ============================================================================
// ENTRY POINT INVOCATION
// ============================================================================

/**
 * Application entry point
 *
 * @remarks
 * Uses the void main().catch() pattern for proper top-level error handling.
 * The promise result is used as the exit code.
 */
void main().catch((error: unknown) => {
  console.error('\n❌ Fatal error in main():', error);
  process.exit(1);
});
