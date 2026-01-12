/**
 * Main entry point for PRP Pipeline application
 *
 * @module index
 *
 * @remarks
 * Configures environment and runs the hello-world workflow to validate
 * Groundswell integration. Exit codes: 0 = success, 1 = failure.
 *
 * @example
 * ```bash
 * npm run dev
 * ```
 */

import { configureEnvironment } from './config/environment.js';
import { HelloWorldWorkflow } from './workflows/hello-world.js';

/**
 * Main entry point for PRP Pipeline application
 *
 * @remarks
 * Configures environment and runs the hello-world workflow to validate
 * Groundswell integration. Exit codes: 0 = success, 1 = failure.
 */
async function main(): Promise<void> {
  try {
    // CRITICAL: Configure environment before any workflow operations
    configureEnvironment();

    // Create and run workflow
    const workflow = new HelloWorldWorkflow('HelloWorld');
    await workflow.run();

    // Success exit
    // eslint-disable-next-line no-console
    console.log('PRP Pipeline entry point: Execution complete');
    process.exit(0);
  } catch (error) {
    // Error exit with details
    // eslint-disable-next-line no-console
    console.error('PRP Pipeline entry point: Fatal error');
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
}

// Start the application
void main();
