/**
 * Execution guard utilities for PRP Pipeline
 *
 * @module utils/validation/execution-guard
 *
 * @remarks
 * Provides validation functions to prevent recursive PRP Pipeline execution
 * while allowing legitimate bug fix session recursion.
 *
 * @example
 * ```typescript
 * import { validateNestedExecution } from './utils/validation/execution-guard.js';
 *
 * // Check for nested execution before proceeding
 * validateNestedExecution(sessionPath);
 * ```
 */

import { NestedExecutionError, isNestedExecutionError } from '../errors.js';

/**
 * Validates that PRP Pipeline is not already running (nested execution guard)
 *
 * @remarks
 * Prevents recursive PRP Pipeline execution by checking the PRP_PIPELINE_RUNNING
 * environment variable. Allows legitimate bug fix session recursion when
 * SKIP_BUG_FINDING='true' and session path contains 'bugfix'.
 *
 * Throws NestedExecutionError if:
 * - PRP_PIPELINE_RUNNING is set (pipeline already executing)
 * - AND not a legitimate bug fix recursion (SKIP_BUG_FINDING='true' + path contains 'bugfix')
 *
 * Returns without error if:
 * - PRP_PIPELINE_RUNNING is not set (first execution)
 * - OR legitimate bug fix recursion conditions are met
 *
 * @param sessionPath - The session path to validate for bugfix recursion
 * @throws {NestedExecutionError} When illegitimate nested execution is detected
 *
 * @example
 * ```typescript
 * // First execution - no pipeline running
 * delete process.env.PRP_PIPELINE_RUNNING;
 * validateNestedExecution('plan/003/feature/001'); // OK
 *
 * // Bug fix recursion - allowed
 * process.env.PRP_PIPELINE_RUNNING = '12345';
 * process.env.SKIP_BUG_FINDING = 'true';
 * validateNestedExecution('plan/003/bugfix/001'); // OK
 *
 * // Illegitimate nested execution - throws
 * process.env.PRP_PIPELINE_RUNNING = '12345';
 * validateNestedExecution('plan/003/feature/001'); // Throws NestedExecutionError
 * ```
 */
export function validateNestedExecution(sessionPath: string): void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;

  // If no pipeline is running, allow execution
  if (!existingPid) {
    return;
  }

  // Check if this is legitimate bug fix recursion
  // CRITICAL: SKIP_BUG_FINDING must use EXACT string match (case-sensitive)
  // CRITICAL: Path check must be case-insensitive for 'bugfix'
  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' &&
    sessionPath.toLowerCase().includes('bugfix');

  if (isBugfixRecursion) {
    // Legitimate recursion - allow it
    return;
  }

  // Illegitimate nested execution - throw error
  throw new NestedExecutionError(
    `Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: ${existingPid}`,
    {
      existingPid,
      currentPid: process.pid.toString(),
      sessionPath,
    }
  );
}

// Re-export for convenience
export { NestedExecutionError, isNestedExecutionError };
