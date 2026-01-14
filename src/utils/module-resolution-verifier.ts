/**
 * Module resolution verifier for Groundswell dependency validation
 *
 * @module utils/module-resolution-verifier
 *
 * @remarks
 * Provides verification functionality for module-not-found errors after
 * Groundswell npm link. Consumes ErrorAnalysisResult from P1.M1.T2.S2 and
 * verifies that module resolution is working correctly.
 *
 * Features:
 * - Early return when no errors exist (S1 had success: true)
 * - Module-not-found error count checking
 * - File sampling verification with Groundswell import detection
 * - Structured result with milestone completion flag
 *
 * @example
 * ```typescript
 * import { verifyNoModuleErrors } from './utils/module-resolution-verifier.js';
 *
 * const typecheckResult = await runTypecheck();
 * const analysis = analyzeTypeScriptErrors(typecheckResult);
 * const verification = verifyNoModuleErrors(analysis);
 *
 * if (verification.resolved) {
 *   console.log('Module resolution verified - milestone complete');
 * }
 * ```
 */

import type { ErrorAnalysisResult } from './typescript-error-analyzer.js';
import { readFileSync } from 'node:fs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of module-not-found error verification
 *
 * @remarks
 * Returned by verifyNoModuleErrors() to indicate whether module resolution
 * is verified working after Groundswell npm link.
 *
 * @example
 * ```typescript
 * const verification = verifyNoModuleErrors(analysis);
 * if (verification.resolved) {
 *   console.log('Module resolution verified!');
 * }
 * ```
 */
export interface ModuleErrorVerifyResult {
  /** Whether module resolution is verified working (milestone complete) */
  resolved: boolean;

  /** Number of remaining module-not-found errors (0 if resolved) */
  remainingCount: number;

  /** List of files that were sampled for verification */
  verifiedFiles: readonly string[];

  /** Number of files that actually contain Groundswell imports */
  importCount: number;

  /** Human-readable verification message */
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Critical files to sample for verification
 *
 * @remarks
 * These files are known to contain Groundswell imports and are critical
 * for the application to function. Sampling these files provides high
 * confidence that module resolution is working correctly.
 */
const CRITICAL_FILES_TO_SAMPLE = [
  'src/workflows/prp-pipeline.ts', // Main pipeline with Workflow import
  'src/agents/agent-factory.ts', // Agent factory with createAgent import
  'src/index.ts', // Entry point (may have imports)
  'src/agents/prp-runtime.ts', // PRP runtime (may have imports)
  'src/core/session-manager.ts', // Session management (may have imports)
] as const;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Verifies no module-not-found errors remain after Groundswell link
 *
 * @remarks
 * * PATTERN: Early return when hasErrors is false (S1 had success: true)
 * This optimizes performance by skipping unnecessary verification when
 * TypeScript compilation already succeeded.
 *
 * * PATTERN: Check module-not-found count before file sampling
 * If any module errors exist, return unresolved immediately without
 * doing expensive file I/O.
 *
 * * PATTERN: File sampling only when module-not-found count is 0
 * When typecheck passes but we want to verify imports are actually working,
 * sample critical files and check for Groundswell import statements.
 *
 * @param analysis - ErrorAnalysisResult from analyzeTypeScriptErrors()
 * @returns ModuleErrorVerifyResult with verification status
 */
export function verifyNoModuleErrors(
  analysis: ErrorAnalysisResult
): ModuleErrorVerifyResult {
  // PATTERN: Early return when hasErrors is false (S1 had success: true)
  // CRITICAL: This means TypeScript compilation succeeded with no errors
  if (!analysis.hasErrors) {
    return {
      resolved: true,
      remainingCount: 0,
      verifiedFiles: [],
      importCount: 0,
      message: 'No TypeScript errors found - module resolution verified.',
    };
  }

  // Check module-not-found error count
  const moduleErrorCount = analysis.categories['module-not-found'];

  // PATTERN: Return unresolved if any module-not-found errors exist
  // CRITICAL: Any count > 0 means module resolution is still failing
  if (moduleErrorCount > 0) {
    return {
      resolved: false,
      remainingCount: moduleErrorCount,
      verifiedFiles: [],
      importCount: 0,
      message: `Found ${moduleErrorCount} module-not-found error(s) - milestone incomplete.`,
    };
  }

  // No module-not-found errors - perform file sampling verification
  // PATTERN: Sample critical files to verify Groundswell imports
  const sampledFiles = sampleCriticalFiles(analysis.files);
  let importCount = 0;

  for (const file of sampledFiles) {
    if (verifyGroundswellImportsInFile(file)) {
      importCount++;
    }
  }

  // PATTERN: Consider resolved if at least one sampled file has imports
  const resolved = importCount > 0;

  return {
    resolved,
    remainingCount: 0,
    verifiedFiles: sampledFiles,
    importCount,
    message: generateVerificationMessage(sampledFiles.length, importCount, resolved),
  };
}

// ============================================================================
// FILE SAMPLING
// ============================================================================

/**
 * Samples critical files from the list of files with errors
 *
 * @remarks
 * Prioritizes critical files (entry points, high-impact modules) from the
 * CRITICAL_FILES_TO_SAMPLE list. Returns up to 5 files for verification.
 *
 * If critical files are not in the error list (because hasErrors was false
 * but we're still sampling), returns the first 3 files from the list.
 *
 * @param availableFiles - List of file paths from ErrorAnalysisResult
 * @returns Array of critical file paths to sample
 */
function sampleCriticalFiles(
  availableFiles: readonly string[]
): string[] {
  // Prioritize critical files that exist in the available list
  const criticalFound = CRITICAL_FILES_TO_SAMPLE.filter(file =>
    availableFiles.includes(file)
  );

  // If no critical files found in error list, sample first 3 files
  if (criticalFound.length === 0 && availableFiles.length > 0) {
    return availableFiles.slice(0, Math.min(3, availableFiles.length));
  }

  // Return up to 5 critical files
  return criticalFound.slice(0, 5);
}

// ============================================================================
// IMPORT VERIFICATION
// ============================================================================

/**
 * Verifies Groundswell imports in a file
 *
 * @remarks
 * Reads file contents using fs.readFileSync and checks for Groundswell
 * import statements using regex pattern matching.
 *
 * Supports both regular and type-only imports:
 * - import { ... } from 'groundswell'
 * - import type { ... } from 'groundswell/types'
 * - import * as groundswell from 'groundswell'
 *
 * @param filePath - Path to file to verify
 * @returns True if file contains Groundswell imports
 */
function verifyGroundswellImportsInFile(filePath: string): boolean {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    return checkImportStatements(fileContent);
  } catch {
    // File not readable - assume no imports
    return false;
  }
}

/**
 * Checks if content contains Groundswell import statements
 *
 * @remarks
 * Uses regex pattern to find import statements containing 'groundswell'.
 * Matches various import patterns found in the codebase:
 *
 * - Regular imports: import { X } from 'groundswell'
 * - Type-only imports: import type { X } from 'groundswell'
 * - Namespace imports: import * as X from 'groundswell'
 * - Submodule imports: import { X } from 'groundswell/types'
 *
 * @param content - File content to check
 * @returns True if content contains Groundswell imports
 */
function checkImportStatements(content: string): boolean {
  // Pattern to match Groundswell import statements
  const patterns = [
    // Regular named imports: import { ... } from 'groundswell'
    /import\s+.*?from\s+['"]groundswell['"]/,

    // Type-only imports: import type { ... } from 'groundswell'
    /import\s+type\s+.*?from\s+['"]groundswell/,

    // Namespace imports: import * as ... from 'groundswell'
    /import\s+\*\s+as\s+\w+\s+from\s+['"]groundswell['"]/,

    // Submodule imports: import { ... } from 'groundswell/types'
    /import\s+.*?from\s+['"]groundswell\/[\w/]+['"]/,
  ];

  return patterns.some(pattern => pattern.test(content));
}

// ============================================================================
// MESSAGE GENERATION
// ============================================================================

/**
 * Generates human-readable verification message
 *
 * @remarks
 * Creates a descriptive message explaining the verification result,
 * including how many files were sampled and how many had imports.
 *
 * @param sampledCount - Number of files sampled
 * @param importCount - Number of files with Groundswell imports
 * @param resolved - Whether verification passed
 * @returns Human-readable verification message
 */
function generateVerificationMessage(
  sampledCount: number,
  importCount: number,
  resolved: boolean
): string {
  if (resolved) {
    return `No module-not-found errors found. Verified ${importCount}/${sampledCount} critical files have Groundswell imports.`;
  }

  return `No module-not-found errors found, but could not verify Groundswell imports in sampled files (${sampledCount} files checked).`;
}
