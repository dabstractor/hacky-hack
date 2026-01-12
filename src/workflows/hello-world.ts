/**
 * Hello-world workflow for validating Groundswell integration
 *
 * @module workflows/hello-world
 *
 * @remarks
 * This is the simplest possible workflow to validate that Groundswell
 * is properly linked and the basic workflow pattern works.
 *
 * @example
 * ```ts
 * import { HelloWorldWorkflow } from './workflows/hello-world.js';
 *
 * const workflow = new HelloWorldWorkflow('HelloWorld');
 * await workflow.run();
 * ```
 */

import { Workflow } from 'groundswell';

/**
 * Hello-world workflow class
 *
 * @remarks
 * Extends Groundswell's Workflow class to validate the integration is working.
 * Logs initialization message to confirm the PRP Pipeline system is operational.
 */
export class HelloWorldWorkflow extends Workflow {
  /**
   * Run the workflow
   *
   * @remarks
   * This is the main entry point for workflow execution.
   * Must explicitly set status to track workflow lifecycle.
   */
  async run(): Promise<void> {
    this.setStatus('running');
    this.logger.info('Starting Hello-World Workflow');

    this.logger.info('PRP Pipeline initialized');

    this.setStatus('completed');
    this.logger.info('Hello-World Workflow completed successfully');
  }
}
