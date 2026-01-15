/**
 * Unit tests for ESLint error verifier
 *
 * @remarks
 * Tests the verifyESLintErrorStatus function with various ESLint report scenarios.
 * Covers error count checking, classification, and acceptable status determination.
 */

import { describe, it, expect } from 'vitest';
import {
  verifyESLintErrorStatus,
  type ESLintErrorStatus,
} from '../../../src/utils/eslint-error-verifier.js';
import type { ESLintResultReport } from '../../../src/utils/eslint-result-parser.js';

describe('ESLintErrorVerifier', () => {
  describe('verifyESLintErrorStatus', () => {
    // Test case 1: No errors (best case)
    it('should return success when errorCount is 0', () => {
      const input: ESLintResultReport = {
        errorCount: 0,
        warningCount: 105,
        byRule: {
          '@typescript-eslint/strict-boolean-expressions': 105,
        },
        topFiles: ['src/workflows/prp-pipeline.ts'],
      };

      const expected: ESLintErrorStatus = {
        hasErrors: false,
        errors: [],
        acceptable: true,
      };

      const result = verifyESLintErrorStatus(input);

      expect(result).toEqual(expected);
    });

    // Test case 2: No errors, warnings present (typical case)
    it('should return success when errorCount is 0 with warnings', () => {
      const input: ESLintResultReport = {
        errorCount: 0,
        warningCount: 50,
        byRule: {
          'no-console': 12,
          '@typescript-eslint/strict-boolean-expressions': 38,
        },
        topFiles: [],
      };

      const expected: ESLintErrorStatus = {
        hasErrors: false,
        errors: [],
        acceptable: true,
      };

      const result = verifyESLintErrorStatus(input);

      expect(result).toEqual(expected);
    });

    // Test case 3: Critical blocking errors
    it('should return not acceptable when critical blocking errors exist', () => {
      const input: ESLintResultReport = {
        errorCount: 2,
        warningCount: 0,
        byRule: {
          'prettier/prettier': 1,
          '@typescript-eslint/no-floating-promises': 1,
        },
        topFiles: [],
        fullResults: [
          {
            filePath: '/home/user/project/src/file.ts',
            messages: [
              {
                ruleId: 'prettier/prettier',
                severity: 2,
                message: 'Code formatting issue',
                line: 1,
                column: 1,
              },
            ],
            errorCount: 1,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
          {
            filePath: '/home/user/project/src/async.ts',
            messages: [
              {
                ruleId: '@typescript-eslint/no-floating-promises',
                severity: 2,
                message: 'Floating promise',
                line: 25,
                column: 3,
              },
            ],
            errorCount: 1,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
        ],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.hasErrors).toBe(true);
      expect(result.acceptable).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some(e => e.includes('prettier/prettier'))).toBe(
        true
      );
      expect(result.errors.some(e => e.includes('no-floating-promises'))).toBe(
        true
      );
    });

    // Test case 4: Deferrable errors only (acceptable)
    it('should return acceptable when only deferrable errors exist', () => {
      const input: ESLintResultReport = {
        errorCount: 3,
        warningCount: 0,
        byRule: {
          '@typescript-eslint/no-explicit-any': 2,
          'no-console': 1,
        },
        topFiles: [],
        fullResults: [
          {
            filePath: '/home/user/project/src/file.ts',
            messages: [
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                severity: 2,
                message: 'Unexpected any type',
                line: 10,
                column: 5,
              },
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                severity: 2,
                message: 'Unexpected any type',
                line: 15,
                column: 7,
              },
              {
                ruleId: 'no-console',
                severity: 2,
                message: 'Unexpected console statement',
                line: 20,
                column: 5,
              },
            ],
            errorCount: 3,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
        ],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.hasErrors).toBe(true);
      expect(result.acceptable).toBe(true);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.some(e => e.includes('no-explicit-any'))).toBe(true);
      expect(result.errors.some(e => e.includes('no-console'))).toBe(true);
    });

    // Test case 5: Null/undefined input
    it('should handle null input gracefully', () => {
      const result = verifyESLintErrorStatus(null);

      expect(result.hasErrors).toBe(false);
      expect(result.acceptable).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should handle undefined input gracefully', () => {
      const result = verifyESLintErrorStatus(undefined);

      expect(result.hasErrors).toBe(false);
      expect(result.acceptable).toBe(false);
      expect(result.errors).toEqual([]);
    });

    // Test case 6: Aggregate classification (no fullResults)
    it('should classify errors from byRule when fullResults is missing', () => {
      const input: ESLintResultReport = {
        errorCount: 2,
        warningCount: 10,
        byRule: {
          '@typescript-eslint/no-unused-vars': 1,
          '@typescript-eslint/no-explicit-any': 1,
        },
        topFiles: ['src/file1.ts', 'src/file2.ts'],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.hasErrors).toBe(true);
      expect(result.acceptable).toBe(false); // no-unused-vars is critical
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain(
        '@typescript-eslint/no-unused-vars: 1 error(s)'
      );
      expect(result.errors).toContain(
        '@typescript-eslint/no-explicit-any: 1 error(s)'
      );
    });

    // Test case 7: Null ruleId handling
    it('should handle null ruleId in messages', () => {
      const input: ESLintResultReport = {
        errorCount: 1,
        warningCount: 0,
        byRule: {},
        topFiles: [],
        fullResults: [
          {
            filePath: '/home/user/project/src/file.ts',
            messages: [
              {
                ruleId: null,
                severity: 2,
                message: 'Parsing error',
                line: 1,
                column: 1,
              },
            ],
            errorCount: 1,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
        ],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.hasErrors).toBe(true);
      expect(result.acceptable).toBe(true); // null ruleId is not critical
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('no-rule-id');
    });

    // Test case 8: Empty fullResults array
    it('should handle empty fullResults array', () => {
      const input: ESLintResultReport = {
        errorCount: 1,
        warningCount: 5,
        byRule: {
          'prettier/prettier': 1,
        },
        topFiles: [],
        fullResults: [],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.hasErrors).toBe(true);
      expect(result.acceptable).toBe(false); // prettier/prettier is critical
      expect(result.errors).toContain('prettier/prettier: 1 error(s)');
    });

    // Test case 9: Mixed critical and deferrable errors
    it('should return not acceptable when both critical and deferrable errors exist', () => {
      const input: ESLintResultReport = {
        errorCount: 3,
        warningCount: 0,
        byRule: {
          'prettier/prettier': 1,
          '@typescript-eslint/no-explicit-any': 2,
        },
        topFiles: [],
        fullResults: [
          {
            filePath: '/home/user/project/src/file.ts',
            messages: [
              {
                ruleId: 'prettier/prettier',
                severity: 2,
                message: 'Format issue',
                line: 1,
                column: 1,
              },
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                severity: 2,
                message: 'Any type',
                line: 10,
                column: 5,
              },
            ],
            errorCount: 2,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
          {
            filePath: '/home/user/project/src/other.ts',
            messages: [
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                severity: 2,
                message: 'Any type',
                line: 5,
                column: 3,
              },
            ],
            errorCount: 1,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
        ],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.hasErrors).toBe(true);
      expect(result.acceptable).toBe(false); // has critical error
      expect(result.errors).toHaveLength(3);
    });

    // Test case 10: Absolute to relative path transformation
    it('should transform absolute paths to relative paths', () => {
      const cwd = process.cwd();
      const input: ESLintResultReport = {
        errorCount: 1,
        warningCount: 0,
        byRule: {},
        topFiles: [],
        fullResults: [
          {
            filePath: `${cwd}/src/utils/my-file.ts`,
            messages: [
              {
                ruleId: '@typescript-eslint/no-explicit-any',
                severity: 2,
                message: 'Any type found',
                line: 42,
                column: 7,
              },
            ],
            errorCount: 1,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
        ],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('src/utils/my-file.ts:42:7');
      expect(result.errors[0]).not.toContain(cwd);
    });

    // Test case 11: Verify all critical rules from .eslintrc.json
    it('should identify all critical blocking rules from .eslintrc.json', () => {
      const criticalRules = [
        'prettier/prettier',
        '@typescript-eslint/no-unused-vars',
        '@typescript-eslint/no-floating-promises',
        '@typescript-eslint/no-misused-promises',
      ];

      for (const rule of criticalRules) {
        const input: ESLintResultReport = {
          errorCount: 1,
          warningCount: 0,
          byRule: {
            [rule]: 1,
          },
          topFiles: [],
        };

        const result = verifyESLintErrorStatus(input);

        expect(result.hasErrors).toBe(true);
        expect(result.acceptable).toBe(false);
        expect(result.errors[0]).toContain(rule);
      }
    });

    // Test case 12: Verify deferrable rules
    it('should treat deferrable rules as acceptable', () => {
      const deferrableRules = [
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/strict-boolean-expressions',
        'no-console',
      ];

      for (const rule of deferrableRules) {
        const input: ESLintResultReport = {
          errorCount: 1,
          warningCount: 0,
          byRule: {
            [rule]: 1,
          },
          topFiles: [],
        };

        const result = verifyESLintErrorStatus(input);

        expect(result.hasErrors).toBe(true);
        expect(result.acceptable).toBe(true); // Deferrable errors are acceptable
        expect(result.errors[0]).toContain(rule);
      }
    });

    // Test case 13: Error description format
    it('should format error descriptions correctly', () => {
      const input: ESLintResultReport = {
        errorCount: 1,
        warningCount: 0,
        byRule: {},
        topFiles: [],
        fullResults: [
          {
            filePath: '/home/user/project/src/example.ts',
            messages: [
              {
                ruleId: 'prettier/prettier',
                severity: 2,
                message: 'Insert `;`',
                line: 10,
                column: 20,
              },
            ],
            errorCount: 1,
            warningCount: 0,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
        ],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.errors[0]).toMatch(
        /^prettier\/prettier: .*example\.ts:10:20 - Insert `;`$/
      );
    });

    // Test case 14: Severity filtering (only process errors)
    it('should only process severity 2 (errors), not warnings', () => {
      const input: ESLintResultReport = {
        errorCount: 0,
        warningCount: 5,
        byRule: {},
        topFiles: [],
        fullResults: [
          {
            filePath: '/home/user/project/src/file.ts',
            messages: [
              {
                ruleId: '@typescript-eslint/strict-boolean-expressions',
                severity: 1, // Warning, not error
                message: 'Nullable value',
                line: 10,
                column: 5,
              },
            ],
            errorCount: 0,
            warningCount: 1,
            fatalErrorCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
          },
        ],
      };

      const result = verifyESLintErrorStatus(input);

      expect(result.hasErrors).toBe(false);
      expect(result.errors).toEqual([]);
      expect(result.acceptable).toBe(true);
    });
  });
});
