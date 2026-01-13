#!/usr/bin/env node
/**
 * Main entry point for PRP Pipeline CLI application
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

  // Setup global error handlers
  setupGlobalHandlers(args.verbose);

  // CRITICAL: Configure environment before any API operations
  configureEnvironment();

  // Verbose logging
  if (args.verbose) {
    console.error('[Entry] Verbose mode enabled');
    console.error(
      '[Entry] Parsed CLI arguments:',
      JSON.stringify(args, null, 2)
    );
  }

  // Handle dry-run mode
  if (args.dryRun) {
    console.log('🔍 DRY RUN - would execute with:');
    console.log(`  PRD: ${args.prd}`);
    console.log(`  Mode: ${args.mode}`);
    if (args.scope) {
      console.log(`  Scope: ${args.scope}`);
    }
    if (args.continue) {
      console.log(`  Resume: enabled`);
    }
    return 0;
  }

  // Parse scope if provided
  const scope: Scope | undefined = args.scope
    ? parseScope(args.scope)
    : undefined;

  if (args.verbose && scope) {
    console.error('[Entry] Parsed scope:', JSON.stringify(scope));
  }

  // Create pipeline instance
  if (args.verbose) {
    console.error('[Entry] Creating PRPPipeline instance');
  }
  const pipeline = new PRPPipeline(args.prd, scope, args.mode);

  // Run pipeline
  if (args.verbose) {
    console.error('[Entry] Starting pipeline execution');
  }
  const result = await pipeline.run();

  // Handle result based on state
  if (result.shutdownInterrupted) {
    // User interrupted with Ctrl+C
    console.log(`\n⚠️  Pipeline interrupted by ${result.shutdownReason}`);
    console.log(
      `📊 Progress: ${result.completedTasks}/${result.totalTasks} tasks completed`
    );
    console.log(`💾 State saved to: ${result.sessionPath}`);
    console.log(`\n🚀 To resume, run:`);
    console.log(`   npm run dev -- --prd ${args.prd} --continue`);
    return 130; // SIGINT exit code
  }

  if (!result.success) {
    // Pipeline failed
    console.log(`\n❌ Pipeline failed`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    console.log(`📊 Failed tasks: ${result.failedTasks}/${result.totalTasks}`);
    console.log(`💾 Session: ${result.sessionPath}`);
    if (args.continue) {
      console.log(`\n🚀 To retry, run:`);
      console.log(`   npm run dev -- --prd ${args.prd} --continue`);
    }
    return 1;
  }

  // Pipeline succeeded
  console.log(`\n✅ Pipeline completed successfully`);
  console.log(
    `📊 Tasks: ${result.completedTasks}/${result.totalTasks} completed`
  );
  console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`💾 Session: ${result.sessionPath}`);
  if (result.bugsFound > 0) {
    console.log(`🐛 Bugs found: ${result.bugsFound}`);
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
