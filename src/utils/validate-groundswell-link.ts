/**
 * Groundswell npm link validation module
 *
 * @module utils/validate-groundswell-link
 *
 * @remarks
 * Validates that the Groundswell library is properly linked via npm link
 * and can be resolved by TypeScript for import operations.
 *
 * This is a critical validation step for Phase 1 (P1.M1.T1) to ensure
 * Groundswell library integration is functional before proceeding with
 * import tests (S2) and version compatibility checks (S3).
 *
 * Features:
 * - Checks npm link status of groundswell package
 * - Validates symlink integrity (if link exists)
 * - Verifies TypeScript can resolve imports from groundswell
 * - Returns structured result for downstream consumption by S2
 *
 * @example
 * ```typescript
 * import { validateNpmLink } from './utils/validate-groundswell-link.js';
 *
 * const result = await validateNpmLink();
 *
 * if (result.success) {
 *   console.log(`Groundswell linked at: ${result.linkedPath}`);
 * } else {
 *   console.error(`Validation failed: ${result.errorMessage}`);
 * }
 * ```
 */

import { lstat, readlink } from 'node:fs/promises';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import * as ts from 'typescript';
import { PipelineError, type ErrorCode } from './errors.js';

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Error codes specific to Groundswell link validation
 *
 * @remarks
 * Extends the base ErrorCodes with link validation specific codes.
 */
export const LinkErrorCodes = {
  GROUNDSWELL_NOT_LINKED: 'GROUNDSWELL_NOT_LINKED',
  GROUNDSWELL_BAD_SYMLINK: 'GROUNDSWELL_BAD_SYMLINK',
  GROUNDSWELL_BUILD_MISSING: 'GROUNDSWELL_BUILD_MISSING',
  GROUNDSWELL_TYPESCRIPT_ERROR: 'GROUNDSWELL_TYPESCRIPT_ERROR',
  GROUNDSWELL_PERMISSION_DENIED: 'GROUNDSWELL_PERMISSION_DENIED',
} as const;

/**
 * Type for link validation error codes
 *
 * @remarks
 * Combines base PipelineError error codes with link-specific codes.
 */
export type LinkErrorCode =
  | (typeof LinkErrorCodes)[keyof typeof LinkErrorCodes]
  | ErrorCode;

// ============================================================================
// DATA MODELS
// ============================================================================

/**
 * Result type for npm link validation
 *
 * @remarks
 * Provides comprehensive status of the Groundswell npm link configuration
 * including symlink status, TypeScript resolution, and actionable error messages.
 */
export interface NpmLinkValidationResult {
  /** Whether npm link is properly configured */
  success: boolean;

  /** Absolute path to linked groundswell package (if success) */
  linkedPath: string | null;

  /** Error message if validation failed */
  errorMessage?: string;

  /** Whether node_modules/groundswell is a symlink */
  isSymlink: boolean;

  /** Target of symlink if isSymlink is true */
  symlinkTarget?: string;

  /** Whether TypeScript can resolve imports from groundswell */
  typescriptResolves: boolean;

  /** Entry point from package.json if available */
  packageJsonEntry?: string;

  /** Version from npm list if available */
  version?: string;

  /** Whether the symlink points to the expected target */
  isValidTarget?: boolean;
}

// ============================================================================
// ERROR CLASS
// ============================================================================

/**
 * Error type for Groundswell link validation failures
 *
 * @remarks
 * Follows the PipelineError pattern from errors.ts with specific error codes
 * for link validation scenarios.
 *
 * @example
 * ```typescript
 * throw new LinkValidationError(
 *   'npm link does not exist',
 *   LinkErrorCodes.GROUNDSWELL_NOT_LINKED,
 *   { linkPath: '/path/to/node_modules/groundswell' }
 * );
 * ```
 */
export class LinkValidationError extends PipelineError {
  readonly code: ErrorCode;

  constructor(
    message: string,
    errorCode: LinkErrorCode,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, context, cause);
    this.name = 'LinkValidationError';
    this.code = errorCode as ErrorCode;
    // Ensure prototype is set for this class
    Object.setPrototypeOf(this, LinkValidationError.prototype);
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default configuration for validation
 *
 * @remarks
 * Paths are resolved relative to the project root.
 */
const CONFIG = {
  /** Project root directory */
  projectRoot: '/home/dustin/projects/hacky-hack',

  /** Expected Groundswell package location */
  groundswellPath: '/home/dustin/projects/groundswell',

  /** Where npm link should create symlink */
  linkPath: '/home/dustin/projects/hacky-hack/node_modules/groundswell',

  /** Timeout for npm commands in milliseconds */
  npmTimeout: 30000,

  /** Temporary directory for TypeScript test files */
  tempDir: '/tmp',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if groundswell is listed in package.json dependencies
 *
 * @remarks
 * This is informational only - npm link works without a package.json entry.
 * The check is included for diagnostic purposes.
 *
 * @returns Promise resolving to boolean indicating if dependency exists
 *
 * @example
 * ```typescript
 * const hasDependency = await checkPackageJsonDependency();
 * console.log(hasDependency); // false (expected for npm link setup)
 * ```
 */
async function checkPackageJsonDependency(): Promise<boolean> {
  try {
    const packageJsonPath = path.join(CONFIG.projectRoot, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    const deps = packageJson.dependencies ?? {};
    const devDeps = packageJson.devDependencies ?? {};

    return 'groundswell' in deps || 'groundswell' in devDeps;
  } catch {
    return false;
  }
}

/**
 * Runs 'npm list groundswell' and parses the output
 *
 * @remarks
 * Checks if npm recognizes groundswell as an installed/linked package.
 * Empty stdout indicates the package is not linked.
 *
 * @returns Promise resolving to npm list check result
 *
 * @example
 * ```typescript
 * const result = await checkNpmList();
 * console.log(result.linked); // true if linked
 * console.log(result.target); // '../projects/groundswell' if linked
 * ```
 */
async function checkNpmList(): Promise<{
  linked: boolean;
  version?: string;
  target?: string;
}> {
  return new Promise(resolve => {
    const npmProcess = spawn('npm', ['list', 'groundswell', '--json'], {
      cwd: CONFIG.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      npmProcess.kill();
      resolve({ linked: false });
    }, CONFIG.npmTimeout);

    npmProcess.stdout?.on('data', data => {
      stdout += data.toString();
    });

    npmProcess.stderr?.on('data', data => {
      stderr += data.toString();
    });

    npmProcess.on('close', code => {
      clearTimeout(timeout);

      // Try parsing JSON output first
      try {
        const jsonOutput = JSON.parse(stdout);
        const dependencies = jsonOutput.dependencies ?? {};
        const groundswellInfo = dependencies.groundswell;

        if (groundswellInfo !== undefined && groundswellInfo !== null) {
          // Check if it's a linked package (has resolved path)
          if (
            groundswellInfo.resolved !== undefined &&
            groundswellInfo.resolved !== null
          ) {
            resolve({
              linked: true,
              version: groundswellInfo.version,
              target: groundswellInfo.resolved,
            });
            return;
          }
          // Has version but might not be linked (local file install)
          resolve({
            linked: true,
            version: groundswellInfo.version,
          });
          return;
        }
      } catch {
        // Fallback to text parsing if JSON fails
      }

      // Fallback: Parse text output
      // Empty stdout or error output means not linked
      if (stdout.trim() === '' || (code !== 0 && stderr.includes('empty'))) {
        resolve({ linked: false });
        return;
      }

      // Try to parse format: "groundswell@0.0.3 -> ../projects/groundswell"
      const match = stdout.match(/groundswell@([\d.]+)\s+->\s+(.+)/);
      if (match) {
        resolve({ linked: true, version: match[1], target: match[2] });
      } else if (stdout.includes('groundswell@')) {
        // Has groundswell but couldn't parse target
        const versionMatch = stdout.match(/groundswell@([\d.]+)/);
        resolve({ linked: true, version: versionMatch?.[1] });
      } else {
        resolve({ linked: false });
      }
    });

    npmProcess.on('error', () => {
      clearTimeout(timeout);
      resolve({ linked: false });
    });
  });
}

/**
 * Verifies that node_modules/groundswell is a valid symlink
 *
 * @remarks
 * Checks if the symlink exists and points to the correct Groundswell location.
 * Returns success=false if the file doesn't exist (not an error condition).
 *
 * @returns Promise resolving to symlink check result
 *
 * @example
 * ```typescript
 * const result = await checkSymlink();
 * console.log(result.isSymlink); // true if symlink exists
 * console.log(result.isValid); // true if points to correct location
 * ```
 */
async function checkSymlink(): Promise<{
  isSymlink: boolean;
  target?: string;
  isValid?: boolean;
}> {
  try {
    const stats = await lstat(CONFIG.linkPath);

    if (!stats.isSymbolicLink()) {
      return { isSymlink: false };
    }

    const target = await readlink(CONFIG.linkPath);
    const absoluteTarget = path.resolve(path.dirname(CONFIG.linkPath), target);
    const expectedTarget = CONFIG.groundswellPath;

    return {
      isSymlink: true,
      target: absoluteTarget,
      isValid: absoluteTarget === expectedTarget,
    };
  } catch (error) {
    const errnoError = error as NodeJS.ErrnoException;

    // File doesn't exist - not an error, just not linked
    if (errnoError.code === 'ENOENT') {
      return { isSymlink: false };
    }

    // Permission error - this is a real problem
    if (errnoError.code === 'EACCES') {
      throw new LinkValidationError(
        `Permission denied accessing ${CONFIG.linkPath}`,
        LinkErrorCodes.GROUNDSWELL_PERMISSION_DENIED,
        { linkPath: CONFIG.linkPath, originalError: errnoError.message }
      );
    }

    // Other errors
    return { isSymlink: false };
  }
}

/**
 * Tests if TypeScript can resolve imports from groundswell
 *
 * @remarks
 * Creates a temporary test file with an import statement and attempts
 * to compile it with the project's tsconfig settings.
 *
 * The temporary file is cleaned up in a finally block.
 *
 * @returns Promise resolving to boolean indicating if TypeScript can resolve imports
 *
 * @example
 * ```typescript
 * const resolves = await checkTypeScriptResolution();
 * console.log(resolves); // true if 'import { Workflow } from "groundswell"' works
 * ```
 */
async function checkTypeScriptResolution(): Promise<boolean> {
  const testFileName = `test-groundswell-import-${Date.now()}.ts`;
  const testFilePath = path.join(CONFIG.tempDir, testFileName);

  // Import statement that tests both ESM and types resolution
  const testContent = "import { Workflow } from 'groundswell';\n";

  try {
    await fs.writeFile(testFilePath, testContent, 'utf-8');

    // Create a TypeScript program with the project's tsconfig settings
    const program = ts.createProgram([testFilePath], {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      lib: ['ES2022'],
      types: [],
    });

    // Get diagnostics - this will include module resolution errors
    const diagnostics = [
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ];

    // Check for module resolution errors
    const hasModuleResolutionError = diagnostics.some(diag => {
      const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
      return (
        message.includes("Cannot find module 'groundswell'") ||
        message.includes('has no exported member') ||
        message.includes('Module') ||
        message.toLowerCase().includes('resolve')
      );
    });

    return !hasModuleResolutionError;
  } catch {
    // If compilation fails for any reason, assume imports don't resolve
    return false;
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(testFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Generates an actionable error message based on validation results
 *
 * @param npmList - Result from checkNpmList()
 * @param symlink - Result from checkSymlink()
 * @param tsResolves - Result from checkTypeScriptResolution()
 * @returns Formatted error message with fix instructions
 *
 * @remarks
 * Provides clear, actionable error messages that guide the user
 * to fix the npm link configuration.
 */
function generateErrorMessage(
  npmList: { linked: boolean; version?: string; target?: string },
  symlink: { isSymlink: boolean; target?: string; isValid?: boolean },
  tsResolves: boolean
): string {
  const issues: string[] = [];

  if (!symlink.isSymlink) {
    issues.push('npm link does not exist');
    issues.push('');
    issues.push('To create the link, run:');
    issues.push(`  cd ${CONFIG.groundswellPath}`);
    issues.push('  npm link');
    issues.push(`  cd ${CONFIG.projectRoot}`);
    issues.push('  npm link groundswell');
  } else if (symlink.isValid === false) {
    issues.push(`symlink exists but points to wrong location`);
    issues.push(`Current target: ${symlink.target}`);
    issues.push(`Expected target: ${CONFIG.groundswellPath}`);
    issues.push('');
    issues.push('To fix the link, run:');
    issues.push('  rm node_modules/groundswell');
    issues.push(`  cd ${CONFIG.groundswellPath}`);
    issues.push('  npm link');
    issues.push(`  cd ${CONFIG.projectRoot}`);
    issues.push('  npm link groundswell');
  }

  if (!tsResolves) {
    if (issues.length > 0) {
      issues.push('');
    }
    issues.push('TypeScript cannot resolve imports from groundswell');
    issues.push('');
    issues.push('Ensure:');
    issues.push(
      `  1. Groundswell is built: cd ${CONFIG.groundswellPath} && npm run build`
    );
    issues.push('  2. Type definitions exist: dist/index.d.ts');
    issues.push('  3. The symlink is correctly created');
  }

  if (npmList.linked === true && npmList.target === undefined) {
    if (issues.length > 0) {
      issues.push('');
    }
    issues.push('npm list shows groundswell but target path is unclear');
    issues.push(`Version detected: ${npmList.version ?? 'unknown'}`);
  }

  return issues.join('\n');
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validates the npm link configuration for Groundswell
 *
 * @remarks
 * Main entry point for npm link validation. Performs comprehensive checks:
 * 1. Package.json dependency check (informational)
 * 2. npm list check
 * 3. Symlink verification
 * 4. TypeScript resolution test
 *
 * Overall success requires:
 * - Symlink exists AND points to correct target
 * - TypeScript can resolve imports
 *
 * @returns Promise resolving to comprehensive validation result
 *
 * @example
 * ```typescript
 * import { validateNpmLink } from './utils/validate-groundswell-link.js';
 *
 * const result = await validateNpmLink();
 *
 * if (result.success) {
 *   console.log(`Groundswell properly linked at: ${result.linkedPath}`);
 *   console.log(`TypeScript resolution: ${result.typescriptResolves}`);
 * } else {
 *   console.error(`Validation failed: ${result.errorMessage}`);
 * }
 * ```
 */
export async function validateNpmLink(): Promise<NpmLinkValidationResult> {
  const results: NpmLinkValidationResult = {
    success: false,
    linkedPath: null,
    isSymlink: false,
    typescriptResolves: false,
  };

  // Check package.json (informational, not required for npm link)
  const hasDependency = await checkPackageJsonDependency();
  results.packageJsonEntry = hasDependency ? 'present' : 'absent';

  // Check npm list
  const npmListResult = await checkNpmList();
  if (npmListResult.version !== undefined) {
    results.version = npmListResult.version;
  }

  // Check symlink
  const symlinkResult = await checkSymlink();
  results.isSymlink = symlinkResult.isSymlink;
  results.symlinkTarget = symlinkResult.target;
  results.isValidTarget = symlinkResult.isValid;

  // Check TypeScript resolution
  const tsResolves = await checkTypeScriptResolution();
  results.typescriptResolves = tsResolves;

  // Determine overall success
  // Success requires: symlink exists, points to correct target, AND TypeScript resolves
  if (
    symlinkResult.isSymlink === true &&
    symlinkResult.isValid === true &&
    tsResolves === true
  ) {
    results.success = true;
    results.linkedPath = symlinkResult.target ?? null;
  } else {
    results.errorMessage = generateErrorMessage(
      npmListResult,
      symlinkResult,
      tsResolves
    );
  }

  return results;
}
