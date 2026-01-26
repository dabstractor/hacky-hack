/**
 * Session path validation utilities
 *
 * @module utils/validation/session-validation
 *
 * @remarks
 * Provides validation functions for session paths to ensure operations
 * execute in the correct session context. Enforces architectural boundaries
 * from PRD §5.1 that bug fix operations must only occur in bugfix sessions.
 *
 * @example
 * ```typescript
 * import { validateBugfixSession } from './utils/validation/session-validation.js';
 *
 * // Valid bugfix session path
 * validateBugfixSession('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918'); // OK
 *
 * // Invalid session path (no 'bugfix')
 * validateBugfixSession('plan/003_b3d3efdaf0ed/feature/001_xyz'); // Throws
 * ```
 */

import {
  BugfixSessionValidationError,
  isBugfixSessionValidationError,
} from '../errors.js';

// Re-export for convenience
export { BugfixSessionValidationError, isBugfixSessionValidationError };

/**
 * Validates that a session path is for a bugfix session
 *
 * @remarks
 * Enforces PRD §5.1 requirement that bug fix tasks only execute within
 * bugfix session directories. A bugfix session is identified by the presence
 * of the 'bugfix' substring in the session path.
 *
 * Session path structure:
 * - Regular session: `plan/{sequence}_{hash}/`
 * - Bugfix session: `plan/{sequence}_{hash}/bugfix/{sequence}_{hash}/`
 *
 * This function performs a simple substring check for 'bugfix' anywhere
 * in the path. This ensures that bug fix tasks cannot be accidentally
 * created in feature implementation sessions or other non-bugfix contexts.
 *
 * Validation is performed early in FixCycleWorkflow constructor to prevent
 * state corruption from creating fix tasks in the wrong session directory.
 *
 * @param sessionPath - The session path to validate
 * @returns undefined if the session path is valid (contains 'bugfix')
 * @throws {BugfixSessionValidationError} If the session path does not contain 'bugfix'
 *
 * @example
 * ```typescript
 * import { validateBugfixSession } from './utils/validation/session-validation.js';
 *
 * // Valid bugfix session - no error thrown
 * validateBugfixSession('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 *
 * // Invalid session - throws BugfixSessionValidationError
 * try {
 *   validateBugfixSession('plan/003_b3d3efdaf0ed/feature/001_xyz');
 * } catch (error) {
 *   if (error instanceof BugfixSessionValidationError) {
 *   console.error(error.message);
 *   // "Bug fix tasks can only be executed within bugfix sessions.
 *   //  Invalid path: plan/003_b3d3efdaf0ed/feature/001_xyz"
 *   }
 * }
 * ```
 */
export function validateBugfixSession(sessionPath: string): void {
  // PATTERN: Simple substring check for 'bugfix' (case-sensitive)
  // Using includes() is sufficient - matches anywhere in path
  // This matches both: plan/.../bugfix/... and bugfix/... patterns
  if (!sessionPath.includes('bugfix')) {
    throw new BugfixSessionValidationError(
      `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${sessionPath}`,
      { sessionPath }
    );
  }

  // PATTERN: Return undefined for success (implicit - no return statement)
  // Function exits normally when validation passes
}
