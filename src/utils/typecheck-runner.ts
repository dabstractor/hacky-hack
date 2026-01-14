/**
 * TypeScript typecheck runner utilities
 *
 * @module utils/typecheck-runner
 *
 * @remarks
 * Provides TypeScript compiler execution and output parsing functionality.
 * Executes tsc --noEmit with proper error handling, output capture, and
 * structured error parsing for automated build verification.
 *
 * @example
 * ```typescript
 * import { runTypecheck } from './utils/typecheck-runner.js';
 *
 * const result = await runTypecheck();
 *
 * if (result.success) {
 *   console.log('TypeScript compilation successful');
 * } else {
 *   console.error(`Found ${result.errorCount} errors`);
 *   for (const error of result.errors) {
 *     console.error(`${error.file}:${error.line}:${error.column} - ${error.message}`);
 *   }
 * }
 * ```
 */

import { spawn, type ChildProcess } from 'node:child_process';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of TypeScript typecheck operation
 *
 * @remarks
 * Returned by {@link runTypecheck} to indicate whether
 * TypeScript compilation succeeded and provide detailed error information.
 *
 * @example
 * ```typescript
 * const result = await runTypecheck();
 * if (!result.success) {
 *   console.error(`Exit code: ${result.exitCode}`);
 *   console.error(`Error count: ${result.errorCount}`);
 * }
 * ```
 */
export interface TypecheckResult {
  /** Whether typecheck completed successfully (errorCount === 0) */
  success: boolean;

  /** Total number of TypeScript errors found */
  errorCount: number;

  /** Array of parsed error objects with file, line, column, code, and message */
  errors: ParsedTscError[];

  /** Captured stdout from tsc command (usually empty) */
  stdout: string;

  /** Raw stderr output from tsc command */
  stderr: string;

  /** Exit code from tsc process (0 = success, 2 = errors present) */
  exitCode: number | null;

  /** Error message if spawn failed or command timed out */
  error?: string;
}

/**
 * Parsed TypeScript compiler error
 *
 * @remarks
 * Represents a single TypeScript error extracted from tsc output.
 * Includes file location, error code, message, and optional module name for TS2307.
 *
 * @example
 * ```typescript
 * const error: ParsedTscError = {
 *   file: 'src/index.ts',
 *   line: 10,
 *   column: 5,
 *   code: 'TS2307',
 *   message: "Cannot find module 'express'",
 *   module: 'express'
 * };
 * ```
 */
export interface ParsedTscError {
  /** File path (relative or absolute) where the error occurred */
  file: string;

  /** Line number (1-indexed) where the error occurred */
  line: number;

  /** Column number (1-indexed) where the error occurred */
  column: number;

  /** Error code (e.g., "TS2307", "TS2322") */
  code: string;

  /** Error message from TypeScript compiler */
  message: string;

  /** Extracted module name (only present for TS2307 errors) */
  module?: string;
}

/**
 * Optional configuration for runTypecheck()
 *
 * @remarks
 * Optional configuration for the runTypecheck function.
 */
export interface TypecheckOptions {
  /** Command timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default timeout for tsc command in milliseconds
 *
 * @remarks
 * tsc typically completes within seconds for most projects. 30 seconds provides
 * a safe margin for large codebases or slower systems.
 */
const DEFAULT_TYPECHECK_TIMEOUT = 30000; // 30 seconds

/**
 * Default project directory for typecheck execution
 *
 * @remarks
 * The hacky-hack project directory where tsc --noEmit will be executed.
 */
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack';

/**
 * Regex pattern for matching TypeScript compiler error output
 *
 * @remarks
 * Matches the standard tsc error format:
 * file_path(line,column): error TSXXXX: error_message
 *
 * Uses non-greedy matching (.+?) for file paths to handle paths with spaces.
 */
const TSC_ERROR_PATTERN = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Executes TypeScript typecheck and parses errors
 *
 * @remarks
 * Performs tsc --noEmit execution with comprehensive validation and error handling:
 * 1. Executes tsc using spawn() with proper argument arrays
 * 2. Uses --pretty false flag for machine-parsable output without ANSI codes
 * 3. Captures stderr (all errors go to stderr, not stdout)
 * 4. Implements timeout handling with SIGTERM then SIGKILL escalation
 * 5. Parses all errors using regex pattern matching
 * 6. Extracts module names from TS2307 "Cannot find module" errors
 * 7. Returns structured result with error count and parsed error details
 *
 * The function does not throw for normal errors (spawn failures, tsc errors).
 * All errors are returned in the structured result object.
 *
 * @param options - Optional configuration including timeout and project path
 * @returns Promise resolving to typecheck operation result
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const result = await runTypecheck();
 * if (result.success) {
 *   console.log('No TypeScript errors!');
 * } else {
 *   console.log(`Found ${result.errorCount} errors`);
 *   for (const error of result.errors) {
 *     console.error(`${error.file}:${error.line}:${error.column} ${error.code}: ${error.message}`);
 *   }
 * }
 *
 * // Custom timeout and project path
 * const result = await runTypecheck({
 *   timeout: 60000,
 *   projectPath: '/custom/project/path'
 * });
 * ```
 */
export async function runTypecheck(
  options?: TypecheckOptions
): Promise<TypecheckResult> {
  const { timeout = DEFAULT_TYPECHECK_TIMEOUT, projectPath = DEFAULT_PROJECT_PATH } =
    options ?? {};

  // PATTERN: Safe spawn execution (from groundswell-linker.ts)
  let child: ChildProcess;

  try {
    // CRITICAL: Use npx tsc with --pretty false for machine-parsable output
    // This avoids ANSI escape codes that npm run typecheck includes
    child = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });
  } catch (error) {
    return {
      success: false,
      errorCount: 0,
      errors: [],
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // PATTERN: Promise-based output capture with timeout (from groundswell-linker.ts)
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // PATTERN: Timeout handler with SIGTERM/SIGKILL escalation
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      // Force kill after 2-second grace period
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    // PATTERN: Capture stdout with kill check
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return; // CRITICAL: Ignore data after kill
        stdout += data.toString();
      });
    }

    // PATTERN: Capture stderr with kill check
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return; // CRITICAL: Ignore data after kill
        stderr += data.toString();
      });
    }

    // PATTERN: Handle close event with result parsing
    child.on('close', (exitCode) => {
      clearTimeout(timeoutId);

      // Parse TypeScript errors from stderr
      const errors = parseTscOutput(stderr);

      resolve({
        success: errors.length === 0 && !timedOut,
        errorCount: errors.length,
        errors,
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
        errorCount: 0,
        errors: [],
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parses TypeScript compiler output into structured error objects
 *
 * @remarks
 * Handles the standard tsc error format:
 * file_path(line,column): error TSXXXX: error_message
 *
 * Extracts file path, line number, column number, error code, and message.
 * For TS2307 errors, also extracts the module name.
 *
 * @param output - Raw stderr output from tsc
 * @returns Array of parsed error objects
 *
 * @example
 * ```typescript
 * const stderr = "src/index.ts(10,5): error TS2307: Cannot find module 'express'";
 * const errors = parseTscOutput(stderr);
 * // errors[0] = { file: 'src/index.ts', line: 10, column: 5, code: 'TS2307', message: "...", module: 'express' }
 * ```
 */
function parseTscOutput(output: string): ParsedTscError[] {
  const errors: ParsedTscError[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    const match = line.match(TSC_ERROR_PATTERN);
    if (match) {
      const [, file, line, column, code, message] = match;

      const error: ParsedTscError = {
        file,
        line: parseInt(line, 10),
        column: parseInt(column, 10),
        code,
        message,
      };

      // Extract module name for TS2307 errors
      if (code === 'TS2307') {
        error.module = extractModuleName(message);
      }

      errors.push(error);
    }
  }

  return errors;
}

/**
 * Extracts module name from TS2307 error message
 *
 * @remarks
 * TS2307 format variations:
 * - Cannot find module 'express'
 * - Cannot find module './utils/helper'
 * - Cannot find module 'lodash' or its corresponding type declarations.
 *
 * Uses regex to extract the module name from within quotes.
 *
 * @param message - Error message from TS2307
 * @returns Module name or undefined
 *
 * @example
 * ```typescript
 * extractModuleName("Cannot find module 'express'") // returns 'express'
 * extractModuleName("Cannot find module './utils/helper'") // returns './utils/helper'
 * extractModuleName("Cannot find module 'lodash' or its corresponding type declarations.") // returns 'lodash'
 * ```
 */
function extractModuleName(message: string): string | undefined {
  const match = message.match(/Cannot find module ['"]([^'"]+)['"]/);
  return match ? match[1] : undefined;
}
