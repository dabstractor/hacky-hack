/**
 * Groundswell library verification utilities
 *
 * @module utils/groundswell-verifier
 *
 * @remarks
 * Provides verification for the Groundswell library at the expected local path.
 * Checks directory existence and required files for npm linking.
 * Returns structured results with actionable error messages.
 *
 * @example
 * ```typescript
 * import { verifyGroundswellExists } from './utils/groundswell-verifier.js';
 *
 * const result = verifyGroundswellExists();
 *
 * if (!result.exists) {
 *   console.error(`Groundswell not found at ${result.path}`);
 * } else if (result.missingFiles.length > 0) {
 *   console.error(`Missing files: ${result.missingFiles.join(', ')}`);
 * } else {
 *   console.log('Groundswell is ready for npm link');
 * }
 * ```
 */

import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of Groundswell library verification
 *
 * @remarks
 * Returned by {@link verifyGroundswellExists} to indicate whether
 * the Groundswell library exists at the expected path and
 * has all required files for npm linking.
 *
 * @example
 * ```typescript
 * const result = verifyGroundswellExists();
 * if (!result.exists) {
 *   console.error(`Groundswell not found at ${result.path}`);
 * }
 * ```
 */
export interface GroundswellVerifyResult {
  /** Whether Groundswell directory exists at expected path */
  exists: boolean;

  /** Absolute path to Groundswell directory (with ~ expanded) */
  path: string;

  /** Array of missing required file names (empty if all present) */
  missingFiles: readonly string[];

  /** Human-readable status message */
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Expected relative path to Groundswell from home directory
 *
 * @remarks
 * The Groundswell library is expected to be at ~/projects/groundswell.
 * This path will be resolved to an absolute path using os.homedir().
 */
const GROUNDSWELL_RELATIVE_PATH = 'projects/groundswell' as const;

/**
 * Required files for npm link to work
 *
 * @remarks
 * According to npm link documentation, only package.json is strictly required.
 * For TypeScript packages, we also check for entry point files.
 * At least one entry point file must exist for the package to be linkable.
 */
const REQUIRED_ENTRY_POINTS = [
  'dist/index.js', // Typical compiled entry point
  'index.js', // Alternative entry point
  'src/index.ts', // Source entry point
] as const;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Verifies Groundswell library exists at expected path
 *
 * @returns Verification result with existence status, path, and missing files
 *
 * @remarks
 * Performs verification in stages:
 * 1. Resolves ~/projects/groundswell to absolute path
 * 2. Checks if directory exists
 * 3. If exists, verifies required files are present
 * 4. Returns structured result with actionable messages
 *
 * The function does not throw exceptions - all results are returned
 * in the structured result object for graceful handling.
 *
 * @example
 * ```typescript
 * const result = verifyGroundswellExists();
 *
 * if (result.exists && result.missingFiles.length === 0) {
 *   // Proceed with npm link
 * } else {
 *   // Handle error
 *   console.error(result.message);
 * }
 * ```
 */
export function verifyGroundswellExists(): GroundswellVerifyResult {
  // Resolve path: ~/projects/groundswell -> /home/user/projects/groundswell
  // CRITICAL: path.resolve() does NOT expand ~, must use os.homedir()
  const groundswellPath = resolve(homedir(), GROUNDSWELL_RELATIVE_PATH);

  // Check directory exists
  if (!existsSync(groundswellPath)) {
    return {
      exists: false,
      path: groundswellPath,
      missingFiles: [],
      message: `Groundswell directory not found at ${groundswellPath}`,
    };
  }

  // Check for required files
  const missingFiles: string[] = [];

  // Check for package.json (strictly required for npm link)
  const packageJsonPath = resolve(groundswellPath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    missingFiles.push('package.json');
  }

  // Check for at least one entry point file
  const hasEntryPoint = REQUIRED_ENTRY_POINTS.some(entryPoint =>
    existsSync(resolve(groundswellPath, entryPoint))
  );

  if (!hasEntryPoint) {
    missingFiles.push('entry point (dist/index.js, index.js, or src/index.ts)');
  }

  // Build result message
  const message =
    missingFiles.length === 0
      ? `Groundswell verified at ${groundswellPath}`
      : `Groundswell exists at ${groundswellPath} but missing: ${missingFiles.join(', ')}`;

  return {
    exists: true,
    path: groundswellPath,
    missingFiles,
    message,
  };
}
