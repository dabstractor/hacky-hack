/**
 * Unit tests for TypeScript Error Analyzer
 *
 * @remarks
 * Tests validate error analysis functionality including:
 * 1. Error categorization by type (module-not-found, type-mismatch, other)
 * 2. Error grouping by file path
 * 3. Summary statistics generation
 * 4. Early return when no errors present
 * 5. Edge cases (empty arrays, single file, all same error)
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import type {
  TypecheckResult,
  ParsedTscError,
} from '../../../src/utils/typecheck-runner.js';
import {
  analyzeTypeScriptErrors,
  type ErrorAnalysisResult,
  type ErrorCategories,
  type ErrorsByFile,
  type ErrorSummary,
} from '../../../src/utils/typescript-error-analyzer.js';

// =============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Creates a mock TypecheckResult for testing
 */
function createMockTypecheckResult(
  options: {
    success?: boolean;
    errors?: ParsedTscError[];
  } = {}
): TypecheckResult {
  const { success = false, errors = [] } = options;

  return {
    success,
    errorCount: errors.length,
    errors,
    stdout: '',
    stderr: '',
    exitCode: success ? 0 : 2,
  };
}

/**
 * Creates a mock ParsedTscError for testing
 */
function createMockError(
  file: string,
  line: number,
  code: string,
  message?: string,
  module?: string
): ParsedTscError {
  return {
    file,
    line,
    column: 1,
    code,
    message: message ?? `Error ${code} in ${file}`,
    ...(module !== undefined && { module }),
  };
}

// =============================================================================
// TEST SUITE
// ============================================================================

describe('typescript-error-analyzer', () => {
  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Successful error analysis', () => {
    it('should categorize TS2307 as module-not-found', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2307',
            "Cannot find module 'express'",
            'express'
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(1);
      expect(analysis.categories['type-mismatch']).toBe(0);
      expect(analysis.categories['other']).toBe(0);
    });

    it('should categorize TS2304 as module-not-found', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2304',
            "Cannot find name 'myVariable'"
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(1);
    });

    it('should categorize TS2305 as module-not-found', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2305',
            "Module '\"~/src/util\"' has no exported member 'foo'"
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(1);
    });

    it('should categorize TS2306 as module-not-found', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/index.ts', 10, 'TS2306', 'File is not a module'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(1);
    });

    it('should categorize TS2688 as module-not-found', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2688',
            "Cannot find type definition file for 'node'"
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(1);
    });

    it('should categorize TS6053 as module-not-found', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS6053',
            "File '/path/to/file.ts' not found"
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(1);
    });

    it('should categorize TS2322 as type-mismatch', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2322',
            "Type 'string' is not assignable to type 'number'"
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(0);
      expect(analysis.categories['type-mismatch']).toBe(1);
      expect(analysis.categories['other']).toBe(0);
    });

    it('should categorize TS2345 as type-mismatch', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2345',
            "Argument of type 'string' is not assignable to parameter of type 'number'"
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['type-mismatch']).toBe(1);
    });

    it('should categorize TS2741 as type-mismatch', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2741',
            "Missing required property 'name'"
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['type-mismatch']).toBe(1);
    });

    it('should categorize unknown error codes as other', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/index.ts', 10, 'TS9999', 'Unknown error'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(0);
      expect(analysis.categories['type-mismatch']).toBe(0);
      expect(analysis.categories['other']).toBe(1);
    });

    it('should categorize mixed errors correctly', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/a.ts',
            1,
            'TS2307',
            "Cannot find module 'x'",
            'x'
          ),
          createMockError('src/b.ts', 2, 'TS2322', 'Type not assignable'),
          createMockError('src/a.ts', 3, 'TS2304', 'Cannot find name'),
          createMockError('src/c.ts', 4, 'TS2345', 'Argument not assignable'),
          createMockError('src/b.ts', 5, 'TS2741', 'Missing property'),
          createMockError('src/d.ts', 6, 'TS9999', 'Unknown error'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(2); // TS2307, TS2304
      expect(analysis.categories['type-mismatch']).toBe(3); // TS2322, TS2345, TS2741
      expect(analysis.categories['other']).toBe(1); // TS9999
    });

    it('should group errors by file path', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/b.ts', 2, 'TS2322', 'Type not assignable'),
          createMockError('src/a.ts', 3, 'TS2304', 'Cannot find name'),
          createMockError('src/c.ts', 4, 'TS2345', 'Argument not assignable'),
          createMockError('src/b.ts', 5, 'TS2741', 'Missing property'),
          createMockError('src/d.ts', 6, 'TS9999', 'Unknown error'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.files).toHaveLength(4);
      expect(analysis.files).toContain('src/a.ts');
      expect(analysis.files).toContain('src/b.ts');
      expect(analysis.files).toContain('src/c.ts');
      expect(analysis.files).toContain('src/d.ts');
      expect(analysis.errorsByFile['src/a.ts']).toHaveLength(2);
      expect(analysis.errorsByFile['src/b.ts']).toHaveLength(2);
      expect(analysis.errorsByFile['src/c.ts']).toHaveLength(1);
      expect(analysis.errorsByFile['src/d.ts']).toHaveLength(1);
    });

    it('should generate correct summary statistics', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/b.ts', 2, 'TS2322', 'Type not assignable'),
          createMockError('src/a.ts', 3, 'TS2304', 'Cannot find name'),
          createMockError('src/c.ts', 4, 'TS2345', 'Argument not assignable'),
          createMockError('src/b.ts', 5, 'TS2741', 'Missing property'),
          createMockError('src/d.ts', 6, 'TS9999', 'Unknown error'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.summary.total).toBe(6);
      expect(analysis.summary.fileCount).toBe(4);
      // Most common code should be one of the codes (all appear once, so first wins)
      expect(analysis.summary.mostCommonCode).toBeTruthy();
      // File with most errors should be src/a.ts or src/b.ts (2 errors each)
      expect(['src/a.ts', 'src/b.ts']).toContain(
        analysis.summary.fileWithMostErrors ?? ''
      );
    });

    it('should identify most common error code correctly', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/b.ts', 2, 'TS2307', "Cannot find module 'y'"),
          createMockError('src/c.ts', 3, 'TS2322', 'Type not assignable'),
          createMockError('src/d.ts', 4, 'TS9999', 'Unknown error'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.summary.mostCommonCode).toBe('TS2307');
    });

    it('should identify file with most errors correctly', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/a.ts', 2, 'TS2304', 'Cannot find name'),
          createMockError('src/a.ts', 3, 'TS2322', 'Type not assignable'),
          createMockError('src/b.ts', 4, 'TS2345', 'Argument not assignable'),
          createMockError('src/c.ts', 5, 'TS9999', 'Unknown error'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.summary.fileWithMostErrors).toBe('src/a.ts');
    });
  });

  // ========================================================================
  // Empty/Success input tests
  // ========================================================================

  describe('Empty or successful typecheck result', () => {
    it('should return empty analysis when success is true', () => {
      const result = createMockTypecheckResult({
        success: true,
        errors: [],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(false);
      expect(analysis.categories['module-not-found']).toBe(0);
      expect(analysis.categories['type-mismatch']).toBe(0);
      expect(analysis.categories['other']).toBe(0);
      expect(analysis.files).toHaveLength(0);
      expect(Object.keys(analysis.errorsByFile)).toHaveLength(0);
      expect(analysis.summary.total).toBe(0);
      expect(analysis.summary.fileCount).toBe(0);
      expect(analysis.summary.mostCommonCode).toBe(null);
      expect(analysis.summary.fileWithMostErrors).toBe(null);
    });

    it('should return empty analysis when errors array is empty', () => {
      const result = createMockTypecheckResult({
        success: false,
        errors: [],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(false);
      expect(analysis.summary.total).toBe(0);
    });

    it('should return empty analysis with all zero counts', () => {
      const result = createMockTypecheckResult({
        success: true,
        errors: [],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.categories).toEqual({
        'module-not-found': 0,
        'type-mismatch': 0,
        other: 0,
      });
    });
  });

  // ========================================================================
  // Single error tests
  // ========================================================================

  describe('Single error analysis', () => {
    it('should handle single module-not-found error', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2307',
            "Cannot find module 'express'",
            'express'
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['module-not-found']).toBe(1);
      expect(analysis.files).toHaveLength(1);
      expect(analysis.summary.total).toBe(1);
      expect(analysis.summary.fileCount).toBe(1);
    });

    it('should handle single type-mismatch error', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/index.ts', 10, 'TS2322', 'Type not assignable'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['type-mismatch']).toBe(1);
    });

    it('should handle single other error', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/index.ts', 10, 'TS9999', 'Unknown error'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.categories['other']).toBe(1);
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle all errors in same file', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            1,
            'TS2307',
            "Cannot find module 'x'"
          ),
          createMockError('src/index.ts', 2, 'TS2322', 'Type not assignable'),
          createMockError('src/index.ts', 3, 'TS2304', 'Cannot find name'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.files).toHaveLength(1);
      expect(analysis.files[0]).toBe('src/index.ts');
      expect(analysis.errorsByFile['src/index.ts']).toHaveLength(3);
      expect(analysis.summary.fileCount).toBe(1);
      expect(analysis.summary.fileWithMostErrors).toBe('src/index.ts');
    });

    it('should handle all same error code', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/b.ts', 2, 'TS2307', "Cannot find module 'y'"),
          createMockError('src/c.ts', 3, 'TS2307', "Cannot find module 'z'"),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.summary.mostCommonCode).toBe('TS2307');
      expect(analysis.categories['module-not-found']).toBe(3);
    });

    it('should handle special characters in file paths', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/path with spaces/file.ts',
            1,
            'TS2307',
            "Cannot find module 'x'"
          ),
          createMockError(
            'src/path-with-dashes/file.ts',
            2,
            'TS2322',
            'Type not assignable'
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.files).toHaveLength(2);
      expect(analysis.files).toContain('src/path with spaces/file.ts');
      expect(analysis.files).toContain('src/path-with-dashes/file.ts');
    });

    it('should handle absolute and relative file paths', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            '/absolute/path/file.ts',
            1,
            'TS2307',
            "Cannot find module 'x'"
          ),
          createMockError(
            './relative/path/file.ts',
            2,
            'TS2322',
            'Type not assignable'
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.files).toHaveLength(2);
      // Paths should be grouped by exact string match, not normalized
      expect(analysis.errorsByFile['/absolute/path/file.ts']).toHaveLength(1);
      expect(analysis.errorsByFile['./relative/path/file.ts']).toHaveLength(1);
    });

    it('should preserve line numbers from original errors', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 10, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/b.ts', 20, 'TS2322', 'Type not assignable'),
          createMockError('src/c.ts', 30, 'TS2304', 'Cannot find name'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.errorsByFile['src/a.ts'][0].line).toBe(10);
      expect(analysis.errorsByFile['src/b.ts'][0].line).toBe(20);
      expect(analysis.errorsByFile['src/c.ts'][0].line).toBe(30);
    });

    it('should handle errors with module field', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2307',
            "Cannot find module 'express'",
            'express'
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.errorsByFile['src/index.ts'][0].module).toBe('express');
    });

    it('should handle errors without module field', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/index.ts', 10, 'TS2322', 'Type not assignable'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.errorsByFile['src/index.ts'][0].module).toBeUndefined();
    });

    it('should handle tie for most common error code', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/b.ts', 2, 'TS2322', 'Type not assignable'),
          createMockError('src/c.ts', 3, 'TS2345', 'Argument not assignable'),
          createMockError('src/d.ts', 4, 'TS2741', 'Missing property'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      // Should return one of the codes (first one encountered with max count)
      expect(analysis.summary.mostCommonCode).toBeTruthy();
    });

    it('should handle tie for file with most errors', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/a.ts', 2, 'TS2322', 'Type not assignable'),
          createMockError('src/b.ts', 3, 'TS2345', 'Argument not assignable'),
          createMockError('src/b.ts', 4, 'TS2741', 'Missing property'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      // Should return one of the files (first one encountered with max count)
      expect(['src/a.ts', 'src/b.ts']).toContain(
        analysis.summary.fileWithMostErrors ?? ''
      );
    });
  });

  // ========================================================================
  // Result structure validation
  // ========================================================================

  describe('Result structure validation', () => {
    it('should return ErrorAnalysisResult with correct structure', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2307',
            "Cannot find module 'express'",
            'express'
          ),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      // Check all required properties exist
      expect(analysis).toHaveProperty('hasErrors');
      expect(analysis).toHaveProperty('categories');
      expect(analysis).toHaveProperty('files');
      expect(analysis).toHaveProperty('errorsByFile');
      expect(analysis).toHaveProperty('summary');

      // Check categories structure
      expect(analysis.categories).toHaveProperty('module-not-found');
      expect(analysis.categories).toHaveProperty('type-mismatch');
      expect(analysis.categories).toHaveProperty('other');

      // Check summary structure
      expect(analysis.summary).toHaveProperty('total');
      expect(analysis.summary).toHaveProperty('fileCount');
      expect(analysis.summary).toHaveProperty('mostCommonCode');
      expect(analysis.summary).toHaveProperty('fileWithMostErrors');
    });

    it('should return files as array of strings', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
          createMockError('src/b.ts', 2, 'TS2322', 'Type not assignable'),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(Array.isArray(analysis.files)).toBe(true);
      expect(analysis.files.every(f => typeof f === 'string')).toBe(true);
    });

    it('should return errorsByFile as Record with array values', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError('src/a.ts', 1, 'TS2307', "Cannot find module 'x'"),
        ],
      });

      const analysis = analyzeTypeScriptErrors(result);

      expect(typeof analysis.errorsByFile).toBe('object');
      for (const file in analysis.errorsByFile) {
        expect(Array.isArray(analysis.errorsByFile[file])).toBe(true);
      }
    });
  });

  // ========================================================================
  // Integration with TypecheckResult
  // ========================================================================

  describe('Integration with TypecheckResult', () => {
    it('should consume TypecheckResult correctly', () => {
      const result: TypecheckResult = {
        success: false,
        errorCount: 3,
        errors: [
          createMockError(
            'src/a.ts',
            1,
            'TS2307',
            "Cannot find module 'x'",
            'x'
          ),
          createMockError('src/b.ts', 2, 'TS2322', 'Type not assignable'),
          createMockError('src/c.ts', 3, 'TS2345', 'Argument not assignable'),
        ],
        stdout: '',
        stderr: 'Error output',
        exitCode: 2,
      };

      const analysis = analyzeTypeScriptErrors(result);

      expect(analysis.hasErrors).toBe(true);
      expect(analysis.summary.total).toBe(3);
    });

    it('should not mutate input TypecheckResult', () => {
      const result = createMockTypecheckResult({
        errors: [
          createMockError(
            'src/index.ts',
            10,
            'TS2307',
            "Cannot find module 'express'",
            'express'
          ),
        ],
      });

      const originalErrors = [...result.errors];
      analyzeTypeScriptErrors(result);

      expect(result.errors).toEqual(originalErrors);
    });
  });
});
