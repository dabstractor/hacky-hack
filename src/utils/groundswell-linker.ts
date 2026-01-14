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
import { access, lstat, readFile, readlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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

/**
 * Result of npm link groundswell operation (local linking)
 *
 * @remarks
 * Returned by {@link linkGroundswellLocally} to indicate whether
 * npm link groundswell completed successfully and provide
 * symlink verification details.
 *
 * @example
 * ```typescript
 * const result = await linkGroundswellLocally(previousResult);
 * if (!result.success) {
 *   console.error(`Exit code: ${result.exitCode}`);
 *   console.error(`Error: ${result.error}`);
 * }
 * ```
 */
export interface GroundswellLocalLinkResult {
  /** Whether npm link groundswell completed and symlink exists */
  success: boolean;

  /** Human-readable status message */
  message: string;

  /** Path where symlink should exist (node_modules/groundswell) */
  symlinkPath: string;

  /** Actual symlink target (if verification succeeded) */
  symlinkTarget?: string;

  /** Standard output from npm link command */
  stdout: string;

  /** Standard error from npm link command */
  stderr: string;

  /** Exit code from npm command (0 = success) */
  exitCode: number | null;

  /** Error message if link or verification failed */
  error?: string;
}

/**
 * Optional configuration for linkGroundswellLocally()
 *
 * @remarks
 * Optional configuration for the linkGroundswellLocally function.
 */
export interface GroundswellLocalLinkOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}

/**
 * Result of Groundswell symlink verification
 *
 * @remarks
 * Returned by {@link verifyGroundswellSymlink} to indicate whether
 * the symlink exists at node_modules/groundswell and provides
 * diagnostic information for debugging.
 *
 * @example
 * ```typescript
 * const result = await verifyGroundswellSymlink(s3Result);
 * if (!result.exists) {
 *   console.error(`Symlink not found: ${result.path}`);
 *   console.error(`Error: ${result.error}`);
 * }
 * ```
 */
export interface GroundswellSymlinkVerifyResult {
  /** Whether symlink exists at node_modules/groundswell */
  exists: boolean;

  /** Absolute path where symlink should exist */
  path: string;

  /** Actual symlink target (if verification succeeded) */
  symlinkTarget?: string;

  /** Human-readable status message */
  message: string;

  /** Error message if verification failed */
  error?: string;
}

/**
 * Optional configuration for verifyGroundswellSymlink()
 *
 * @remarks
 * Optional configuration for the verifyGroundswellSymlink function.
 */
export interface GroundswellSymlinkVerifyOptions {
  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}

/**
 * Result of npm list verification for Groundswell
 *
 * @remarks
 * Returned by {@link verifyGroundswellNpmList} to indicate whether
 * npm list confirms the package is in the dependency tree.
 *
 * @example
 * ```typescript
 * const result = await verifyGroundswellNpmList(s4Result);
 * if (!result.linked) {
 *   console.error(`npm list verification failed: ${result.error}`);
 * }
 * ```
 */
export interface NpmListVerifyResult {
  /** Whether npm list shows groundswell in dependencies */
  linked: boolean;

  /** Version string from npm list (if available, may be undefined for links) */
  version?: string;

  /** Human-readable status message */
  message: string;

  /** Raw stdout from npm list command (for debugging) */
  stdout: string;

  /** Raw stderr from npm list command (for debugging) */
  stderr: string;

  /** Exit code from npm command */
  exitCode: number | null;

  /** Error message if verification failed */
  error?: string;
}

/**
 * Optional configuration for verifyGroundswellNpmList()
 *
 * @remarks
 * Optional configuration for the verifyGroundswellNpmList function.
 */
export interface NpmListVerifyOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;

  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;
}

/**
 * Result of README.md update with Groundswell setup documentation
 *
 * @remarks
 * Returned by {@link documentGroundswellReadme} to indicate whether
 * README.md was created or updated with Groundswell setup documentation.
 *
 * @example
 * ```typescript
 * const result = await documentGroundswellReadme(s5Result);
 * if (result.updated) {
 *   console.log('README updated successfully');
 * } else {
 *   console.log(`Skipped: ${result.message}`);
 * }
 * ```
 */
export interface ReadmeUpdateResult {
  /** Whether README.md was created or updated */
  updated: boolean;

  /** Absolute path to README.md */
  path: string;

  /** Human-readable status message */
  message: string;

  /** Error message if update failed */
  error?: string;
}

/**
 * Optional configuration for documentGroundswellReadme()
 *
 * @remarks
 * Optional configuration for the documentGroundswellReadme function.
 */
export interface ReadmeUpdateOptions {
  /** Project directory path (default: /home/dustin/projects/hacky-hack) */
  projectPath?: string;

  /** README file name (default: README.md) */
  readmeFileName?: string;
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

/**
 * Default project directory for local npm link
 *
 * @remarks
 * The hacky-hack project directory where npm link groundswell
 * will be executed to create the local symlink.
 */
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack';

/**
 * Default timeout for npm list command in milliseconds
 *
 * @remarks
 * npm list typically completes within seconds. 10 seconds provides
 * a safe margin for slower systems or large dependency trees.
 */
const DEFAULT_NPM_LIST_TIMEOUT = 10000; // 10 seconds

/**
 * Groundswell setup documentation section for README.md
 *
 * @remarks
 * Markdown content to be appended to README.md documenting
 * the npm link setup process for local Groundswell development.
 * Follows existing README formatting patterns (H2 headers, code blocks, tables).
 */
const GROUNDSWELL_README_SECTION = `
## Local Development with Groundswell

This project depends on the \`groundswell\` library for AI agent orchestration, workflow management, and MCP tool integration. For local development, \`groundswell\` is linked via \`npm link\` rather than installed from the npm registry.

### Prerequisites

- Groundswell package located at \`~/projects/groundswell\`
- Groundswell must be built (\`npm run build\`) before linking

### Setup

\`\`\`bash
# From groundswell directory (creates global symlink)
cd ~/projects/groundswell
npm link

# From hacky-hack directory (consumes global symlink)
cd ~/projects/hacky-hack
npm link groundswell
\`\`\`

### Verification

\`\`\`bash
# Verify symlink exists in node_modules
ls -la node_modules/groundswell

# Verify npm recognizes the linked package
npm list groundswell --json

# Verify TypeScript compilation
npm run typecheck
\`\`\`

### Troubleshooting

| Problem | Solution |
| ------- | -------- |
| Cannot find module 'groundswell' | Run \`npm link\` from groundswell directory first |
| Changes not reflected | Rebuild groundswell with \`npm run build\` |
| TypeScript compilation fails | Ensure \`preserveSymlinks: true\` in tsconfig.json |
| Permission denied (EACCES) | Use nvm instead of system npm, or fix permissions |
`;

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

/**
 * Executes npm link groundswell from the hacky-hack project directory
 *
 * @remarks
 * Performs local npm link operation with comprehensive validation and error handling:
 * 1. Validates S2 result.success - skips execution if global link failed
 * 2. Executes npm link groundswell using spawn() with proper argument arrays
 * 3. Captures stdout, stderr, and exit code for debugging
 * 4. Implements timeout handling with SIGTERM then SIGKILL
 * 5. Verifies symlink exists at node_modules/groundswell using fs.lstat()
 * 6. Returns structured result with symlink target for additional verification
 *
 * The function does not throw for normal errors (spawn failures, npm link failures).
 * All errors are returned in the structured result object.
 *
 * @param previousResult - Result from S2's linkGroundswell() function
 * @param options - Optional configuration including timeout and project path
 * @returns Promise resolving to local link operation result
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const globalResult = await linkGroundswell();
 * const localResult = await linkGroundswellLocally(globalResult);
 * if (localResult.success) {
 *   console.log('Linked locally!');
 *   console.log('Symlink target:', localResult.symlinkTarget);
 * }
 *
 * // Custom timeout and project path
 * const result = await linkGroundswellLocally(globalResult, {
 *   timeout: 60000,
 *   projectPath: '/custom/project/path'
 * });
 * ```
 */
export async function linkGroundswellLocally(
  previousResult: GroundswellLinkResult,
  options?: GroundswellLocalLinkOptions
): Promise<GroundswellLocalLinkResult> {
  const { timeout = DEFAULT_LINK_TIMEOUT, projectPath = DEFAULT_PROJECT_PATH } =
    options ?? {};

  const symlinkPath = join(projectPath, 'node_modules', 'groundswell');

  // PATTERN: Conditional execution based on S2 result
  if (!previousResult.success) {
    return {
      success: false,
      message: `Skipped: Global npm link failed - ${previousResult.message}`,
      symlinkPath,
      stdout: '',
      stderr: '',
      exitCode: null,
    };
  }

  // PATTERN: Safe spawn execution (from linkGroundswell)
  let child: ChildProcess;

  try {
    child = spawn('npm', ['link', 'groundswell'], {
      cwd: projectPath, // CRITICAL: Use project directory, not Groundswell directory
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });
  } catch (error) {
    return {
      success: false,
      message: 'Failed to spawn npm link groundswell command',
      symlinkPath,
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // PATTERN: Promise-based output capture with symlink verification
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

    // PATTERN: Handle close event with exit code and symlink verification
    child.on('close', async exitCode => {
      clearTimeout(timeoutId);

      // PATTERN: Verify symlink only if npm link succeeded
      if (exitCode === 0 && !timedOut && !killed) {
        try {
          const stats = await lstat(symlinkPath);
          if (!stats.isSymbolicLink()) {
            return resolve({
              success: false,
              message: 'npm link succeeded but path is not a symlink',
              symlinkPath,
              stdout,
              stderr,
              exitCode,
              error: 'Path exists but is not a symbolic link',
            });
          }

          const symlinkTarget = await readlink(symlinkPath);
          resolve({
            success: true,
            message: `Successfully linked groundswell in project at ${symlinkPath}`,
            symlinkPath,
            symlinkTarget,
            stdout,
            stderr,
            exitCode,
          });
        } catch (error) {
          const errno = error as NodeJS.ErrnoException;
          resolve({
            success: false,
            message: `npm link succeeded but symlink verification failed: ${errno.message}`,
            symlinkPath,
            stdout,
            stderr,
            exitCode,
            error: errno.code,
          });
        }
      } else {
        // npm link failed
        resolve({
          success: false,
          message: `npm link failed${exitCode !== null ? ` with exit code ${exitCode}` : ''}`,
          symlinkPath,
          stdout,
          stderr,
          exitCode,
          error: timedOut ? `Command timed out after ${timeout}ms` : undefined,
        });
      }
    });

    // PATTERN: Handle spawn errors
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        message: 'npm link groundswell command failed',
        symlinkPath,
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}

/**
 * Verifies that the Groundswell symlink exists at node_modules/groundswell
 *
 * @remarks
 * Performs symlink verification with comprehensive validation and error handling:
 * 1. Validates S3 result.success - skips verification if local link failed
 * 2. Uses native fs.lstat() for symlink detection (NOT stat() - stat() follows symlinks)
 * 3. Uses fs.readlink() to extract symlink target path
 * 4. Handles all error cases (ENOENT, EACCES, EINVAL)
 * 5. Returns structured result with symlink target for additional verification
 *
 * The function does not throw for normal errors. All errors are returned
 * in the structured result object.
 *
 * @param previousResult - Result from S3's linkGroundswellLocally() function
 * @param options - Optional configuration including project path
 * @returns Promise resolving to symlink verification result
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const s4Result = await verifyGroundswellSymlink(s3Result);
 * if (s4Result.exists) {
 *   console.log('Symlink verified!');
 *   console.log('Target:', s4Result.symlinkTarget);
 * }
 *
 * // Custom project path
 * const result = await verifyGroundswellSymlink(s3Result, {
 *   projectPath: '/custom/project/path'
 * });
 * ```
 */
export async function verifyGroundswellSymlink(
  previousResult: GroundswellLocalLinkResult,
  options?: GroundswellSymlinkVerifyOptions
): Promise<GroundswellSymlinkVerifyResult> {
  const { projectPath = DEFAULT_PROJECT_PATH } = options ?? {};

  const symlinkPath = join(projectPath, 'node_modules', 'groundswell');

  // PATTERN: Conditional execution based on S3 result
  if (!previousResult.success) {
    return {
      exists: false,
      path: symlinkPath,
      message: `Skipped: Local link failed - ${previousResult.message}`,
      error: undefined,
    };
  }

  // PATTERN: Use native fs.lstat() and fs.readlink() (recommended in research)
  try {
    // CRITICAL: Use lstat() NOT stat() for symlink detection
    // stat() follows symlinks and always returns isSymbolicLink() === false
    const stats = await lstat(symlinkPath);

    if (!stats.isSymbolicLink()) {
      return {
        exists: false,
        path: symlinkPath,
        message: `Path exists but is not a symbolic link: ${symlinkPath}`,
        error: 'Not a symlink',
      };
    }

    // Get symlink target
    const symlinkTarget = await readlink(symlinkPath);

    return {
      exists: true,
      path: symlinkPath,
      symlinkTarget,
      message: `Symlink verified at ${symlinkPath} -> ${symlinkTarget}`,
    };
  } catch (error) {
    // PATTERN: Handle Node.js errno codes (from linkGroundswellLocally)
    const errno = error as NodeJS.ErrnoException;

    if (errno?.code === 'ENOENT') {
      return {
        exists: false,
        path: symlinkPath,
        message: `Symlink not found: ${symlinkPath}`,
        error: 'ENOENT',
      };
    }

    if (errno?.code === 'EACCES') {
      return {
        exists: false,
        path: symlinkPath,
        message: `Permission denied: ${symlinkPath}`,
        error: 'EACCES',
      };
    }

    // Generic error
    return {
      exists: false,
      path: symlinkPath,
      message: `Verification failed: ${errno?.message || 'Unknown error'}`,
      error: errno?.code || 'UNKNOWN',
    };
  }
}

/**
 * Verifies that the Groundswell package is recognized by npm's dependency resolution
 *
 * @remarks
 * Performs npm list verification with comprehensive validation and error handling:
 * 1. Validates S4 result.exists - skips verification if symlink verification failed
 * 2. Executes npm list groundswell using spawn() with proper argument arrays
 * 3. Captures stdout, stderr, and exit code for debugging
 * 4. Implements timeout handling with SIGTERM then SIGKILL
 * 5. Parses JSON output to check for dependencies.groundswell
 * 6. Returns structured result with linked status and version
 *
 * The function does not throw for normal errors (spawn failures, npm list failures).
 * All errors are returned in the structured result object.
 *
 * @param previousResult - Result from S4's verifyGroundswellSymlink() function
 * @param options - Optional configuration including timeout and project path
 * @returns Promise resolving to npm list verification result
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const s5Result = await verifyGroundswellNpmList(s4Result);
 * if (s5Result.linked) {
 *   console.log('npm list confirms link!');
 *   console.log('Version:', s5Result.version);
 * }
 *
 * // Custom timeout and project path
 * const result = await verifyGroundswellNpmList(s4Result, {
 *   timeout: 5000,
 *   projectPath: '/custom/project/path'
 * });
 * ```
 */
export async function verifyGroundswellNpmList(
  previousResult: GroundswellSymlinkVerifyResult,
  options?: NpmListVerifyOptions
): Promise<NpmListVerifyResult> {
  const {
    timeout = DEFAULT_NPM_LIST_TIMEOUT,
    projectPath = DEFAULT_PROJECT_PATH,
  } = options ?? {};

  // PATTERN: Conditional execution based on S4 result
  if (!previousResult.exists) {
    return {
      linked: false,
      message: `Skipped: Symlink verification failed - ${previousResult.message}`,
      stdout: '',
      stderr: '',
      exitCode: null,
    };
  }

  // PATTERN: Safe spawn execution (from linkGroundswellLocally)
  let child: ChildProcess;

  try {
    child = spawn('npm', ['list', 'groundswell', '--json', '--depth=0'], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });
  } catch (error) {
    return {
      linked: false,
      message: 'Failed to spawn npm list command',
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // PATTERN: Promise-based output capture (from linkGroundswellLocally)
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    // PATTERN: Timeout handler with SIGTERM/SIGKILL
    const timeoutId = setTimeout(() => {
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
        if (killed) return; // CRITICAL: Stop capturing after kill
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

    // PATTERN: Handle close event with JSON parsing
    child.on('close', exitCode => {
      clearTimeout(timeoutId);

      // PATTERN: Handle exit code 0 or 1 with JSON output
      // Exit code 1 with JSON = package not found (not an error)
      if ((exitCode === 0 || exitCode === 1) && stdout.trim().startsWith('{')) {
        try {
          const output = JSON.parse(stdout);
          const pkgInfo = output.dependencies?.groundswell;

          if (!pkgInfo) {
            resolve({
              linked: false,
              version: undefined,
              message: 'npm list: groundswell not found in dependency tree',
              stdout,
              stderr,
              exitCode,
            });
            return;
          }

          // Package found in dependencies
          resolve({
            linked: true,
            version: pkgInfo.version, // May be undefined for linked packages
            message: 'npm list confirms groundswell is linked',
            stdout,
            stderr,
            exitCode,
          });
          return;
        } catch (parseError) {
          resolve({
            linked: false,
            version: undefined,
            message: 'Failed to parse npm list JSON output',
            stdout,
            stderr,
            exitCode,
            error:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          });
          return;
        }
      }

      // PATTERN: Exit code 1 without JSON = actual error
      if (exitCode === 1) {
        resolve({
          linked: false,
          version: undefined,
          message: 'npm list failed',
          stdout,
          stderr,
          exitCode,
          error: stderr || 'Unknown error',
        });
        return;
      }

      // PATTERN: Exit code 0 without JSON = unexpected output
      if (exitCode === 0) {
        resolve({
          linked: false,
          version: undefined,
          message: 'npm list succeeded but output is not valid JSON',
          stdout,
          stderr,
          exitCode,
          error: 'Invalid output format',
        });
        return;
      }

      // Other exit codes
      resolve({
        linked: false,
        version: undefined,
        message: `npm list failed with exit code ${exitCode}`,
        stdout,
        stderr,
        exitCode,
        error: stderr || 'Unknown error',
      });
    });

    // PATTERN: Handle spawn errors
    child.on('error', (_error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        linked: false,
        version: undefined,
        message: 'npm list command failed',
        stdout,
        stderr,
        exitCode: null,
        error: _error.message,
      });
    });
  });
}

/**
 * Documents Groundswell npm link setup in the project README.md
 *
 * @remarks
 * Performs README.md documentation with comprehensive validation and error handling:
 * 1. Validates S5 result.linked - skips documentation if npm list verification failed
 * 2. Checks if README.md exists using fs.promises.access()
 * 3. Creates README.md with Write tool if it doesn't exist
 * 4. Updates README.md with Edit tool if it exists (appends new section)
 * 5. Checks for existing "## Local Development with Groundswell" to avoid duplication
 * 6. Returns structured result with update status
 *
 * The function does not throw for normal errors (file system errors, write failures).
 * All errors are returned in the structured result object.
 *
 * @param previousResult - Result from S5's verifyGroundswellNpmList() function
 * @param options - Optional configuration including project path and README file name
 * @returns Promise resolving to README update result
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const s6Result = await documentGroundswellReadme(s5Result);
 * if (s6Result.updated) {
 *   console.log('README updated successfully');
 * }
 *
 * // Custom project path
 * const result = await documentGroundswellReadme(s5Result, {
 *   projectPath: '/custom/project/path'
 * });
 * ```
 */
export async function documentGroundswellReadme(
  previousResult: NpmListVerifyResult,
  options?: ReadmeUpdateOptions
): Promise<ReadmeUpdateResult> {
  const { projectPath = DEFAULT_PROJECT_PATH, readmeFileName = 'README.md' } =
    options ?? {};

  const readmePath = join(projectPath, readmeFileName);

  // PATTERN: Conditional execution based on S5 result
  if (!previousResult.linked) {
    return {
      updated: false,
      path: readmePath,
      message: 'Skipped: Groundswell not linked by npm list verification',
    };
  }

  // PATTERN: File existence check with fs.promises.access()
  let readmeExists: boolean;
  try {
    await access(readmePath);
    readmeExists = true;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno?.code === 'ENOENT') {
      readmeExists = false;
    } else {
      // Real error (permission denied, disk full, etc.)
      return {
        updated: false,
        path: readmePath,
        message: `Failed to check README existence: ${errno.message}`,
        error: errno.message,
      };
    }
  }

  // PATTERN: Create new README with writeFile if it doesn't exist
  if (!readmeExists) {
    try {
      await writeFile(readmePath, GROUNDSWELL_README_SECTION.trim(), 'utf-8');
      return {
        updated: true,
        path: readmePath,
        message: 'README.md created with Groundswell setup documentation',
      };
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      return {
        updated: false,
        path: readmePath,
        message: `Failed to create README.md: ${errno.message}`,
        error: errno.message,
      };
    }
  }

  // PATTERN: Update existing README - check for existing section first
  try {
    const existingContent = await readFile(readmePath, 'utf-8');

    // Check if section already exists to avoid duplication
    if (existingContent.includes('## Local Development with Groundswell')) {
      return {
        updated: false,
        path: readmePath,
        message: 'README.md already contains Groundswell documentation',
      };
    }

    // Append new section to existing README
    const updatedContent =
      existingContent.trimEnd() + '\n' + GROUNDSWELL_README_SECTION;
    await writeFile(readmePath, updatedContent, 'utf-8');

    return {
      updated: true,
      path: readmePath,
      message: 'README.md updated with Groundswell setup documentation',
    };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    return {
      updated: false,
      path: readmePath,
      message: `Failed to update README.md: ${errno.message}`,
      error: errno.message,
    };
  }
}
