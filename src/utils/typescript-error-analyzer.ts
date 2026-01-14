/**
 * TypeScript error analyzer for categorization and grouping
 *
 * @module utils/typescript-error-analyzer
 *
 * @remarks
 * Provides error categorization and analysis functionality for TypeScript
 * compiler errors. Consumes TypecheckResult from typecheck-runner and
 * produces structured analysis for pipeline decision-making.
 *
 * Features:
 * - Categorizes errors by type (module-not-found, type-mismatch, other)
 * - Groups errors by file path
 * - Generates summary statistics
 * - Early return when no errors present
 *
 * @example
 * ```typescript
 * import { runTypecheck } from './utils/typecheck-runner.js';
 * import { analyzeTypeScriptErrors } from './utils/typescript-error-analyzer.js';
 *
 * const typecheckResult = await runTypecheck();
 * const analysis = analyzeTypeScriptErrors(typecheckResult);
 *
 * if (!analysis.hasErrors) {
 *   console.log('No errors - proceed to S3');
 * } else {
 *   console.log(`Found ${analysis.categories['module-not-found']} module errors`);
 *   console.log(`Affected files: ${analysis.files.join(', ')}`);
 * }
 * ```
 */

import type { TypecheckResult, ParsedTscError } from './typecheck-runner.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Category counts for error types
 *
 * @remarks
 * Maps error category names to their occurrence counts.
 */
export interface ErrorCategories {
  /** Module-not-found errors (TS2307, TS2304, TS2305, TS2306, TS2688, TS6053) */
  'module-not-found': number;

  /** Type mismatch errors (TS2322, TS2345, TS2741) */
  'type-mismatch': number;

  /** All other error codes */
  other: number;
}

/**
 * Errors grouped by file path
 *
 * @remarks
 * Maps file paths to arrays of errors that occurred in those files.
 */
export type ErrorsByFile = Record<string, ParsedTscError[]>;

/**
 * Summary statistics for analyzed errors
 *
 * @remarks
 * Provides aggregate information about the error analysis results.
 */
export interface ErrorSummary {
  /** Total number of errors analyzed */
  total: number;

  /** Number of unique files with errors */
  fileCount: number;

  /** Most common error code */
  mostCommonCode: string | null;

  /** File with the most errors */
  fileWithMostErrors: string | null;
}

/**
 * Result of TypeScript error analysis
 *
 * @remarks
 * Returned by {@link analyzeTypeScriptErrors} to indicate categorized
 * error information for pipeline decision-making.
 *
 * @example
 * ```typescript
 * const result = await runTypecheck();
 * const analysis = analyzeTypeScriptErrors(result);
 *
 * if (analysis.hasErrors) {
 *   console.log(`Module errors: ${analysis.categories['module-not-found']}`);
 *   console.log(`Files affected: ${analysis.summary.fileCount}`);
 * }
 * ```
 */
export interface ErrorAnalysisResult {
  /** Whether analysis found any errors to categorize */
  hasErrors: boolean;

  /** Count of errors in each category */
  categories: ErrorCategories;

  /** Unique list of file paths with errors */
  files: string[];

  /** Errors grouped by file path */
  errorsByFile: ErrorsByFile;

  /** Summary statistics */
  summary: ErrorSummary;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * TypeScript error codes for module-not-found category
 *
 * @remarks
 * These error codes indicate module resolution failures.
 * - TS2307: Cannot find module
 * - TS2304: Cannot find name
 * - TS2305: Module has no exported member
 * - TS2306: File is not a module
 * - TS2688: Cannot find type definition file
 * - TS6053: File not found
 */
const MODULE_NOT_FOUND_CODES = new Set([
  'TS2307', // Cannot find module
  'TS2304', // Cannot find name
  'TS2305', // Module has no exported member
  'TS2306', // File is not a module
  'TS2688', // Cannot find type definition file
  'TS6053', // File not found
]);

/**
 * TypeScript error codes for type-mismatch category
 *
 * @remarks
 * These error codes indicate type incompatibility issues.
 * - TS2322: Type not assignable
 * - TS2345: Argument not assignable
 * - TS2741: Missing required properties
 */
const TYPE_MISMATCH_CODES = new Set([
  'TS2322', // Type not assignable
  'TS2345', // Argument not assignable
  'TS2741', // Missing required properties
]);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Analyzes TypeScript errors from typecheck result
 *
 * @remarks
 * Consumes TypecheckResult from P1.M1.T2.S1 (runTypecheck) and categorizes
 * errors by type, groups by file, and generates summary statistics.
 *
 * Early returns when TypecheckResult.success is true (no errors to analyze),
 * allowing pipeline to skip to P1.M1.T2.S3 (module-not-found verification).
 *
 * @param result - TypecheckResult from runTypecheck()
 * @returns ErrorAnalysisResult with categorized and grouped errors
 *
 * @example
 * ```typescript
 * const typecheckResult = await runTypecheck();
 * const analysis = analyzeTypeScriptErrors(typecheckResult);
 *
 * if (!analysis.hasErrors) {
 *   console.log('No errors - proceed to S3');
 * } else {
 *   console.log(`Found ${analysis.categories['module-not-found']} module errors`);
 *   console.log(`Affected files: ${analysis.files.join(', ')}`);
 * }
 * ```
 */
export function analyzeTypeScriptErrors(
  result: TypecheckResult
): ErrorAnalysisResult {
  // PATTERN: Early return when success is true (skip to S3)
  if (result.success || result.errors.length === 0) {
    return {
      hasErrors: false,
      categories: {
        'module-not-found': 0,
        'type-mismatch': 0,
        other: 0,
      },
      files: [],
      errorsByFile: {},
      summary: {
        total: 0,
        fileCount: 0,
        mostCommonCode: null,
        fileWithMostErrors: null,
      },
    };
  }

  // Categorize all errors
  const categorized = result.errors.map(error => ({
    error,
    category: categorizeError(error),
  }));

  // Count by category
  const categories: ErrorCategories = {
    'module-not-found': 0,
    'type-mismatch': 0,
    other: 0,
  };

  for (const { category } of categorized) {
    categories[category]++;
  }

  // Group by file
  const errorsByFile = groupErrorsByFile(result.errors);
  const files = Object.keys(errorsByFile);

  // Generate summary
  const summary = generateSummary(result.errors, errorsByFile);

  return {
    hasErrors: true,
    categories,
    files,
    errorsByFile,
    summary,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Categorizes a TypeScript error by its error code
 *
 * @remarks
 * Uses error code ranges and specific code matching to determine category:
 * - module-not-found: TS2307, TS2304, TS2305, TS2306, TS2688, TS6053
 * - type-mismatch: TS2322, TS2345, TS2741
 * - other: All remaining error codes
 *
 * @param error - Parsed TypeScript error
 * @returns Error category key
 */
function categorizeError(error: ParsedTscError): keyof ErrorCategories {
  const { code } = error;

  if (MODULE_NOT_FOUND_CODES.has(code)) {
    return 'module-not-found';
  }

  if (TYPE_MISMATCH_CODES.has(code)) {
    return 'type-mismatch';
  }

  // All other errors
  return 'other';
}

/**
 * Groups errors by file path
 *
 * @remarks
 * Uses reduce() to create a Record mapping file paths to arrays of errors.
 * Preserves original error objects for detailed inspection.
 *
 * @param errors - Array of parsed TypeScript errors
 * @returns Record mapping file paths to error arrays
 */
function groupErrorsByFile(errors: ParsedTscError[]): ErrorsByFile {
  return errors.reduce((groups, error) => {
    const { file } = error;

    if (!groups[file]) {
      groups[file] = [];
    }

    groups[file].push(error);
    return groups;
  }, {} as ErrorsByFile);
}

/**
 * Generates summary statistics from errors
 *
 * @remarks
 * Calculates total errors, unique file count, most common error code,
 * and file with the most errors for quick assessment.
 *
 * @param errors - Array of parsed TypeScript errors
 * @param errorsByFile - Errors grouped by file
 * @returns Summary statistics
 */
function generateSummary(
  errors: ParsedTscError[],
  errorsByFile: ErrorsByFile
): ErrorSummary {
  const total = errors.length;
  const fileCount = Object.keys(errorsByFile).length;

  // Find most common error code
  const codeCounts = new Map<string, number>();
  for (const error of errors) {
    codeCounts.set(error.code, (codeCounts.get(error.code) ?? 0) + 1);
  }

  let mostCommonCode: string | null = null;
  let maxCount = 0;
  for (const [code, count] of Array.from(codeCounts.entries())) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonCode = code;
    }
  }

  // Find file with most errors
  let fileWithMostErrors: string | null = null;
  let maxErrors = 0;
  for (const [file, fileErrors] of Object.entries(errorsByFile)) {
    if (fileErrors.length > maxErrors) {
      maxErrors = fileErrors.length;
      fileWithMostErrors = file;
    }
  }

  return {
    total,
    fileCount,
    mostCommonCode,
    fileWithMostErrors,
  };
}
