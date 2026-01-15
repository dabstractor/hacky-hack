/**
 * Unit tests for Console.log Verifier
 *
 * @remarks
 * Tests validate console.log verification functionality including:
 * 1. Happy path - no console.log detected (logger only)
 * 2. Console.log detected in validation output
 * 3. Logger output detected (JSON and bracketed formats)
 * 4. Mixed output (both console.log and logger)
 * 5. Empty output handling
 * 6. Edge cases (single line, unicode, special characters)
 * 7. Result structure validation
 * 8. Message generation with Phase 3 references
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  })),
}));

// Import module under test
import {
  verifyConsoleLogAbsence,
  type _ConsoleLogVerificationResult,
} from '../../../src/utils/console-log-verifier.js';
import type { ValidationReportFormatResult } from '../../../src/utils/validation-report-verifier.js';

// =============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock ValidationReportFormatResult for testing
 *
 * @param options - Options for configuring the mock
 * @returns Mock ValidationReportFormatResult object
 */
function createMockValidationReportFormatResult(
  options: {
    formatValid?: boolean;
    sectionsPresent?: readonly string[];
    missingSections?: readonly string[];
    message?: string;
  } = {}
): ValidationReportFormatResult {
  const {
    formatValid = true,
    sectionsPresent = [],
    missingSections = [],
    message = '',
  } = options;

  return {
    formatValid,
    sectionsPresent,
    missingSections,
    message,
  };
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('console-log-verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests - No console.log detected (logger only)
  // ========================================================================

  describe('Logger output only (no console.log)', () => {
    const loggerOnlyOutput = `{"level":"info","time":1705237200000,"msg":"PRD validation started"}
[INFO] Validating PRD file: /path/to/PRD.md
{"level":"info","time":1705237200100,"msg":"PRD validation completed","status":"valid"}`;

    it('should return hasConsoleLog: false when only logger patterns detected', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: loggerOnlyOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
    });

    it('should return usesLogger: true when logger patterns detected', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: loggerOnlyOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.usesLogger).toBe(true);
    });

    it('should return consoleLogCount: 0 for logger-only output', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: loggerOnlyOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.consoleLogCount).toBe(0);
    });

    it('should return empty detectedPatterns array', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: loggerOnlyOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.detectedPatterns).toEqual([]);
    });

    it('should return success message for logger-only output', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: loggerOnlyOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.message).toContain('Structured logger output detected');
      expect(result.message).toContain('no console.log patterns found');
    });

    it('should detect JSON logger format', () => {
      const jsonLoggerOutput = `{"level":"info","msg":"Starting"}
{"level":"debug","msg":"Processing"}
{"level":"info","msg":"Complete"}`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: jsonLoggerOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
      expect(result.usesLogger).toBe(true);
    });

    it('should detect bracketed log level format', () => {
      const bracketedLoggerOutput = `[INFO] Starting validation
[DEBUG] Processing file
[INFO] Validation complete`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: bracketedLoggerOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
      expect(result.usesLogger).toBe(true);
    });

    it('should detect context prefix format', () => {
      const contextLoggerOutput = `[Validator] Starting PRD validation
[Parser] Reading file contents
[Validator] Validation complete`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: contextLoggerOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
      expect(result.usesLogger).toBe(true);
    });

    it('should detect ISO timestamp format', () => {
      const timestampLoggerOutput = `2024-01-14T10:30:00.000Z INFO Starting
2024-01-14T10:30:01.000Z INFO Complete`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: timestampLoggerOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
      expect(result.usesLogger).toBe(true);
    });
  });

  // ========================================================================
  // Console.log detected tests
  // ========================================================================

  describe('Console.log patterns detected', () => {
    const consoleLogOutput = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 2
  Info: 1

Issues:
⚠️ [WARNING] Missing required section: ## Executive Summary
   Suggestion: Add a "## Executive Summary" section to your PRD
============================================================`;

    it('should return hasConsoleLog: true when console.log patterns detected', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: consoleLogOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should return accurate consoleLogCount', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: consoleLogOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      // Should detect the console.log lines (approximately 12-13 lines)
      expect(result.consoleLogCount).toBeGreaterThan(0);
    });

    it('should return usesLogger: false when only console.log patterns present', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: consoleLogOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.usesLogger).toBe(false);
    });

    it('should populate detectedPatterns with console.log lines', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: consoleLogOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.detectedPatterns.length).toBeGreaterThan(0);
      expect(
        result.detectedPatterns.some(p => p.includes('PRD Validation Report'))
      ).toBe(true);
    });

    it('should return message mentioning Issue 5 and Phase 3', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: consoleLogOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.message).toContain('Console.log output detected');
      expect(result.message).toContain('Issue 5 violation');
      expect(result.message).toContain('Phase 3 fix required');
    });

    it('should detect border lines with equals signs', () => {
      const borderOutput = `============================================================
Some text
============================================================`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: borderOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should detect border lines with dashes', () => {
      const dashBorderOutput = `------------------------------------------------------------
Some text
------------------------------------------------------------`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: dashBorderOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should detect emoji status indicators', () => {
      const emojiOutput = `Status: ✅ VALID
Another: ❌ INVALID
Warning: ⚠️ Check this
Info: ℹ️ Information`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: emojiOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should detect key-value section patterns', () => {
      const keyValueOutput = `File: /path/to/file.md
Status: ✅ VALID
Summary: Some summary
Issues: No issues`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: keyValueOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should detect plain text starting with capital letters', () => {
      const plainTextOutput = `Starting validation process
Processing the file
Validation complete`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: plainTextOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should detect indented content lines', () => {
      const indentedOutput = `Summary:
  Critical: 0
  Warnings: 2
  Info: 1`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: indentedOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });
  });

  // ========================================================================
  // Mixed output tests (both console.log and logger)
  // ========================================================================

  describe('Mixed output (console.log and logger)', () => {
    const mixedOutput = `[INFO] Starting PRD validation...
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID
============================================================
[INFO] Validation complete`;

    it('should return hasConsoleLog: true when both patterns present', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: mixedOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should return usesLogger: true when both patterns present', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: mixedOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.usesLogger).toBe(true);
    });

    it('should return message mentioning both patterns', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: mixedOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.message).toContain('Mixed output detected');
      expect(result.message).toContain(
        'console.log lines found alongside logger output'
      );
      expect(result.message).toContain('Phase 3 fix required');
    });
  });

  // ========================================================================
  // Empty output tests
  // ========================================================================

  describe('Empty output handling', () => {
    it('should return hasConsoleLog: false for empty output', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: '',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
    });

    it('should return usesLogger: false for empty output', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: '',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.usesLogger).toBe(false);
    });

    it('should return consoleLogCount: 0 for empty output', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: '',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.consoleLogCount).toBe(0);
    });

    it('should return empty detectedPatterns for empty output', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: '',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.detectedPatterns).toHaveLength(0);
    });

    it('should handle output with only newlines', () => {
      const newlinesOnly = '\n\n\n\n';

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: newlinesOnly,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
      expect(result.usesLogger).toBe(false);
    });

    it('should handle output with only whitespace', () => {
      const whitespaceOnly = '     \n\t\t\n   ';

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: whitespaceOnly,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
      expect(result.usesLogger).toBe(false);
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle single line output', () => {
      const singleLine = 'PRD Validation Report';

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: singleLine,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
      expect(result.consoleLogCount).toBe(1);
    });

    it('should handle unicode characters in output', () => {
      const unicodeOutput = `🔍 Validating PRD
📊 Summary:
  ✅ Critical: 0
  ⚠️ Warnings: 2
ℹ️ Info: 1`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: unicodeOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should handle special characters in output', () => {
      const specialCharsOutput = `File: /path/to/file@name.md
Status: ✅ VALID (passed)
Summary: Critical: 0, Warnings: 2`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: specialCharsOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should handle very long output lines', () => {
      const longLine =
        'PRD Validation Report' + ' with additional text '.repeat(1000);

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: longLine,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
    });

    it('should handle output with mixed case', () => {
      const mixedCaseOutput = `prd validation report
File: /path/to/PRD.md
status: valid`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: mixedCaseOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      // "prd validation report" should not match PLAIN_TEXT pattern (starts with lowercase)
      // But "File:" should match KEY_VALUE_SECTION
      expect(result.consoleLogCount).toBeGreaterThan(0);
    });

    it('should not detect logger patterns as console.log', () => {
      const loggerOutput = `[INFO] Validation started
{"level":"info","msg":"Processing"}`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: loggerOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(false);
    });

    it('should handle very long output without performance issues', () => {
      const longOutput = 'PRD Validation Report\n'.repeat(10000);

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: longOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
      expect(result.consoleLogCount).toBe(10000);
    });

    it('should handle lines starting with numbers (not console.log)', () => {
      const numericOutput = `123 items processed
456 errors found
789 warnings`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: numericOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      // Lines starting with numbers should not match PLAIN_TEXT pattern
      expect(result.consoleLogCount).toBe(0);
    });

    it('should handle lines with only symbols', () => {
      const symbolsOutput = `!!!===
@@@###
$$$%%%`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: symbolsOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      // Symbol-only lines should not match console.log patterns
      expect(result.consoleLogCount).toBe(0);
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('Result structure validation', () => {
    it('should return readonly detectedPatterns array', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: 'Some text',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.detectedPatterns).toBeInstanceOf(Array);
    });

    it('should have usesLogger field of type boolean', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: 'Some text',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(typeof result.usesLogger).toBe('boolean');
    });

    it('should have hasConsoleLog field of type boolean', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: 'Some text',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(typeof result.hasConsoleLog).toBe('boolean');
    });

    it('should have consoleLogCount field of type number', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: 'Some text',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(typeof result.consoleLogCount).toBe('number');
    });

    it('should have message field of type string', () => {
      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: 'Some text',
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Always check regardless of format validity
  // ========================================================================

  describe('Check output regardless of format validity', () => {
    it('should check for console.log even when formatValid is false', () => {
      const consoleLogOutput = `
============================================================
PRD Validation Report
============================================================`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: false,
        message: consoleLogOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      // Should still detect console.log even if format is invalid
      expect(result.hasConsoleLog).toBe(true);
    });

    it('should check for logger even when formatValid is false', () => {
      const loggerOutput = `[INFO] Starting validation`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: false,
        message: loggerOutput,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.usesLogger).toBe(true);
    });
  });

  // ========================================================================
  // Real-world validation report format tests (from src/index.ts:138-169)
  // ========================================================================

  describe('Real-world validation report format', () => {
    it('should detect console.log in actual src/index.ts validation report', () => {
      const actualReport = `
============================================================
PRD Validation Report
============================================================
File: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/TEST_PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 2
  Info: 1

Issues:
⚠️ [WARNING] Missing required section: ## Executive Summary
   Suggestion: Add a "## Executive Summary" section to your PRD
ℹ️ [INFO] Consider adding: ## Table of Contents
============================================================`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: actualReport,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      // Should detect approximately 12 console.log lines (Issue 5)
      expect(result.hasConsoleLog).toBe(true);
      expect(result.consoleLogCount).toBeGreaterThanOrEqual(10);
      expect(result.usesLogger).toBe(false);
    });

    it('should detect invalid status in validation report', () => {
      const invalidReport = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ❌ INVALID

Summary:
  Critical: 3
  Warnings: 5
  Info: 2

Issues:
❌ [CRITICAL] Missing required section: ## Problem Statement
============================================================`;

      const mockResult = createMockValidationReportFormatResult({
        formatValid: true,
        message: invalidReport,
      });

      const result = verifyConsoleLogAbsence(mockResult);

      expect(result.hasConsoleLog).toBe(true);
      expect(result.message).toContain('Issue 5 violation');
    });
  });
});
