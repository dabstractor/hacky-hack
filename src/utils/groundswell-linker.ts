/**
 * Groundswell npm linker utilities
 *
 * @module utils/groundswell-linker
 *
 * @remarks
 * Provides npm link functionality for the Groundswell library.
 * Executes npm link from the Groundswell directory with proper error handling,
 * output capture, and verification.
 *
 * @example
 * ```typescript
 * import { linkGroundswell } from './utils/groundswell-linker.js';
 *
 * const result = await linkGroundswell();
 *
 * if (result.success) {
 *   console.log('Groundswell linked successfully');
 * } else {
 *   console.error(`Failed to link: ${result.message}`);
 *   console.error(`stderr: ${result.stderr}`);
 * }
 * ```
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { verifyGroundswellExists } from './groundswell-verifier.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of npm link operation for Groundswell
 *
 * @remarks
 * Returned by {@link linkGroundswell} to indicate whether
 * npm link completed successfully and provide diagnostic information.
 *
 * @example
 * ```typescript
 * const result = await linkGroundswell();
 * if (!result.success) {
 *   console.error(`Exit code: ${result.exitCode}`);
 *   console.error(`Error: ${result.error}`);
 * }
 * ```
 */
export interface GroundswellLinkResult {
  /** Whether npm link completed successfully */
  success: boolean;

  /** Human-readable status message */
  message: string;

  /** Standard output from npm link command */
  stdout: string;

  /** Standard error from npm link command */
  stderr: string;

  /** Exit code from npm command (0 = success) */
  exitCode: number | null;

  /** Error message if link failed */
  error?: string;
}

/**
 * Options for npm link operation
 *
 * @remarks
 * Optional configuration for the linkGroundswell function.
 * Currently only timeout is configurable.
 */
export interface GroundswellLinkOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default timeout for npm link command in milliseconds
 *
 * @remarks
 * npm link typically completes within seconds. 30 seconds provides
 * a safe margin for slower systems or network issues.
 */
const DEFAULT_LINK_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Executes npm link from the Groundswell directory
 *
 * @remarks
 * Performs npm link operation with comprehensive validation and error handling:
 * 1. Validates Groundswell exists using verifyGroundswellExists()
 * 2. Executes npm link using spawn() with proper argument arrays
 * 3. Captures stdout, stderr, and exit code for debugging
 * 4. Implements timeout handling with SIGTERM then SIGKILL
 * 5. Returns structured result with actionable error messages
 *
 * The function throws an Error if Groundswell doesn't exist or is missing
 * required files. All other errors (spawn failures, npm link failures) are
 * returned in the structured result object.
 *
 * @param options - Optional configuration including timeout
 * @returns Promise resolving to link operation result
 *
 * @throws {Error} If Groundswell directory doesn't exist
 * @throws {Error} If Groundswell is missing required files (package.json, entry point)
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const result = await linkGroundswell();
 * if (result.success) {
 *   console.log('Linked!');
 * }
 *
 * // Custom timeout
 * const result = await linkGroundswell({ timeout: 60000 });
 * ```
 */
export async function linkGroundswell(
  options?: GroundswellLinkOptions
): Promise<GroundswellLinkResult> {
  const { timeout = DEFAULT_LINK_TIMEOUT } = options ?? {};

  // PATTERN: Input validation using S1 result
  const verification = verifyGroundswellExists();

  if (!verification.exists) {
    throw new Error(`Cannot create npm link: ${verification.message}`);
  }

  if (verification.missingFiles.length > 0) {
    throw new Error(
      `Cannot create npm link: Groundswell is missing required files: ` +
        verification.missingFiles.join(', ')
    );
  }

  const groundswellPath = verification.path;

  // PATTERN: Safe spawn execution (from bash-mcp.ts)
  let child: ChildProcess;

  try {
    child = spawn('npm', ['link'], {
      cwd: groundswellPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });
  } catch (error) {
    return {
      success: false,
      message: 'Failed to spawn npm link command',
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // PATTERN: Promise-based output capture (from bash-mcp.ts)
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // PATTERN: Timeout handler with SIGTERM/SIGKILL
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    // PATTERN: Capture stdout data
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return;
        stdout += data.toString();
      });
    }

    // PATTERN: Capture stderr data
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return;
        stderr += data.toString();
      });
    }

    // PATTERN: Handle close event with exit code
    child.on('close', exitCode => {
      clearTimeout(timeoutId);

      const success = exitCode === 0 && !timedOut && !killed;
      const message = success
        ? `Successfully linked Groundswell at ${groundswellPath}`
        : `npm link failed${exitCode !== null ? ` with exit code ${exitCode}` : ''}`;

      resolve({
        success,
        message,
        stdout,
        stderr,
        exitCode,
        error: timedOut ? `Command timed out after ${timeout}ms` : undefined,
      });
    });

    // PATTERN: Handle spawn errors
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        message: 'npm link command failed',
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}
