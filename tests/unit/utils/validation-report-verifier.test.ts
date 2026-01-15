/**
 * Unit tests for Validation Report Verifier
 *
 * @remarks
 * Tests validate validation report format verification functionality including:
 * 1. Early return when success is false (validation command failed)
 * 2. All 4 required sections present detection (happy path)
 * 3. Partial sections present detection
 * 4. No sections present detection
 * 5. Individual section detection (PRD Validation Report, File:, Status:, Summary:)
 * 6. Optional Issues: section handling (not required)
 * 7. Result structure validation
 * 8. Message generation
 * 9. Status pattern variants (✅ VALID, ❌ INVALID)
 * 10. Edge cases (empty report, malformed sections, whitespace variations)
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
import { verifyValidationReportFormat } from '../../../src/utils/validation-report-verifier.js';
import type { PrdValidationResult } from '../../../src/utils/prd-validation-executor.js';

// =============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock PrdValidationResult for testing
 *
 * @param options - Options for configuring the mock
 * @returns Mock PrdValidationResult object
 */
function createMockPrdValidationResult(
  options: {
    success?: boolean;
    validationReport?: string;
    valid?: boolean;
    exitCode?: number | null;
    error?: string;
  } = {}
): PrdValidationResult {
  const {
    success = true,
    validationReport = '',
    valid = true,
    exitCode = 0,
    error = undefined,
  } = options;

  return {
    success,
    validationReport,
    valid,
    exitCode,
    error,
  };
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('validation-report-verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests - All 4 required sections present
  // ========================================================================

  describe('All 4 required sections present', () => {
    const fullValidReport = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 2
  Info: 1
============================================================
`;

    it('should return formatValid: true when all 4 required sections are detected', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
    });

    it('should return all 4 sections in sectionsPresent array', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toHaveLength(4);
      expect(result.sectionsPresent).toContain('PRD Validation Report');
      expect(result.sectionsPresent).toContain('File:');
      expect(result.sectionsPresent).toContain('Status:');
      expect(result.sectionsPresent).toContain('Summary:');
    });

    it('should return empty missingSections array', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.missingSections).toHaveLength(0);
      expect(result.missingSections).toEqual([]);
    });

    it('should return success message with all sections listed', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.message).toContain('All expected sections detected');
      expect(result.message).toContain('PRD Validation Report');
      expect(result.message).toContain('File:');
      expect(result.message).toContain('Status:');
      expect(result.message).toContain('Summary:');
    });

    it('should work with ❌ INVALID status', () => {
      const invalidReport = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ❌ INVALID

Summary:
  Critical: 1
  Warnings: 0
  Info: 0
============================================================
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: invalidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
      expect(result.sectionsPresent).toContain('Status:');
    });
  });

  // ========================================================================
  // Early return tests - Validation command failed
  // ========================================================================

  describe('Early return on validation command failure', () => {
    it('should return formatValid: false when success is false', () => {
      const mockResult = createMockPrdValidationResult({
        success: false,
        validationReport: '',
        exitCode: null,
        error: 'PRD validation timed out after 10000ms',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(false);
    });

    it('should return empty sectionsPresent array when success is false', () => {
      const mockResult = createMockPrdValidationResult({
        success: false,
        validationReport: '',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toHaveLength(0);
      expect(result.sectionsPresent).toEqual([]);
    });

    it('should return all 4 sections as missing when success is false', () => {
      const mockResult = createMockPrdValidationResult({
        success: false,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.missingSections).toHaveLength(4);
      expect(result.missingSections).toContain('PRD Validation Report');
      expect(result.missingSections).toContain('File:');
      expect(result.missingSections).toContain('Status:');
      expect(result.missingSections).toContain('Summary:');
    });

    it('should return skipped message when success is false', () => {
      const mockResult = createMockPrdValidationResult({
        success: false,
        error: 'Timeout error',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.message).toContain(
        'Validation report format check skipped'
      );
      expect(result.message).toContain('validation command failed');
    });

    it('should not parse validationReport when success is false', () => {
      const mockResult = createMockPrdValidationResult({
        success: false,
        validationReport: fullValidReport,
      });

      // Even with valid report content, should not parse it
      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toHaveLength(0);
      expect(result.formatValid).toBe(false);
    });
  });

  // ========================================================================
  // Individual section detection tests
  // ========================================================================

  describe('Individual section detection', () => {
    it('should detect "PRD Validation Report" title', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'PRD Validation Report\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('PRD Validation Report');
    });

    it('should detect "File:" section with path', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File: /absolute/path/to/PRD.md\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('File:');
    });

    it('should detect "Status: ✅ VALID" section', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: ✅ VALID\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Status:');
    });

    it('should detect "Status: ❌ INVALID" section', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: ❌ INVALID\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Status:');
    });

    it('should detect "Summary:" section with all three counts', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: `
Summary:
  Critical: 0
  Warnings: 2
  Info: 1
`,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Summary:');
    });

    it('should not detect "Summary:" without all three counts', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Summary:\n  Critical: 0\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).not.toContain('Summary:');
    });

    it('should not detect "File:" without path content', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File:\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).not.toContain('File:');
    });
  });

  // ========================================================================
  // Optional Issues: section tests
  // ========================================================================

  describe('Optional Issues: section handling', () => {
    it('should return formatValid: true when Issues: section is absent (no issues)', () => {
      const reportWithoutIssues = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 0
  Info: 0
============================================================
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: reportWithoutIssues,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
    });

    it('should return formatValid: true when Issues: section is present', () => {
      const reportWithIssues = `
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
============================================================
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: reportWithIssues,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
    });

    it('should not include Issues: in sectionsPresent', () => {
      const reportWithIssues = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ❌ INVALID

Summary:
  Critical: 1
  Warnings: 0
  Info: 0

Issues:
❌ [CRITICAL] Missing required section
============================================================
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: reportWithIssues,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).not.toContain('Issues:');
    });

    it('should not include Issues: in missingSections when absent', () => {
      const reportWithoutIssues = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 0
  Info: 0
============================================================
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: reportWithoutIssues,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.missingSections).not.toContain('Issues:');
    });
  });

  // ========================================================================
  // Partial sections detection tests
  // ========================================================================

  describe('Partial sections detection', () => {
    it('should detect 2 of 4 sections present', () => {
      const partialReport = `
PRD Validation Report
File: /path/to/PRD.md
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: partialReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(false);
      expect(result.sectionsPresent).toHaveLength(2);
      expect(result.sectionsPresent).toContain('PRD Validation Report');
      expect(result.sectionsPresent).toContain('File:');
    });

    it('should report missing sections in missingSections array', () => {
      const partialReport = `
PRD Validation Report
File: /path/to/PRD.md
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: partialReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.missingSections).toHaveLength(2);
      expect(result.missingSections).toContain('Status:');
      expect(result.missingSections).toContain('Summary:');
    });

    it('should include found and missing sections in message', () => {
      const partialReport = `
PRD Validation Report
Status: ✅ VALID
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: partialReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.message).toContain('Validation report format incomplete');
      expect(result.message).toContain('Found:');
      expect(result.message).toContain('Missing:');
    });

    it('should handle only 1 section present', () => {
      const singleSectionReport = `
Status: ✅ VALID
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: singleSectionReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(false);
      expect(result.sectionsPresent).toHaveLength(1);
      expect(result.missingSections).toHaveLength(3);
    });
  });

  // ========================================================================
  // No sections detection tests
  // ========================================================================

  describe('No sections detected', () => {
    it('should return formatValid: false when no sections found', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Some random output\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(false);
    });

    it('should return empty sectionsPresent array when no sections found', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Random text output\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toHaveLength(0);
    });

    it('should return all 4 sections in missingSections array', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'No matching content\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.missingSections).toHaveLength(4);
      expect(result.missingSections).toContain('PRD Validation Report');
      expect(result.missingSections).toContain('File:');
      expect(result.missingSections).toContain('Status:');
      expect(result.missingSections).toContain('Summary:');
    });

    it('should report "No sections found" in message when none detected', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: '',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.message).toContain('No sections found');
    });

    it('should handle empty validation report', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: '',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(false);
      expect(result.sectionsPresent).toHaveLength(0);
      expect(result.missingSections).toHaveLength(4);
    });
  });

  // ========================================================================
  // Status pattern variant tests
  // ========================================================================

  describe('Status pattern variants', () => {
    it('should detect "Status: ✅VALID" without space after emoji', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: ✅VALID\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Status:');
    });

    it('should detect "Status: ✅  VALID" with multiple spaces after emoji', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: ✅  VALID\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Status:');
    });

    it('should detect "Status: ❌INVALID" without space after emoji', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: ❌INVALID\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Status:');
    });

    it('should detect "Status: ❌  INVALID" with multiple spaces', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: ❌  INVALID\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Status:');
    });

    it('should not detect status with wrong emoji', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: ✅ SUCCESS\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).not.toContain('Status:');
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('Result structure validation', () => {
    it('should return readonly sectionsPresent array', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toBeInstanceOf(Array);
    });

    it('should return readonly missingSections array', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.missingSections).toBeInstanceOf(Array);
    });

    it('should have message field of type string', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should have formatValid as boolean', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(typeof result.formatValid).toBe('boolean');
    });
  });

  // ========================================================================
  // Edge cases
  // ============================================================================

  describe('Edge cases', () => {
    it('should handle tabs instead of spaces after File:', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File:\t/path/to/PRD.md\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('File:');
    });

    it('should handle mixed spaces and tabs after Status:', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Status: \t ✅ VALID\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Status:');
    });

    it('should be case-sensitive for section names', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: `
prd validation report
file: /path/to/PRD.md
status: ✅ VALID
summary:
  Critical: 0
`,
      });

      const result = verifyValidationReportFormat(mockResult);

      // Lowercase should NOT match
      expect(result.sectionsPresent).not.toContain('PRD Validation Report');
      expect(result.sectionsPresent).not.toContain('File:');
      expect(result.sectionsPresent).not.toContain('Status:');
      expect(result.sectionsPresent).not.toContain('Summary:');
    });

    it('should handle Summary with different whitespace', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: `
Summary:
Critical: 0
Warnings: 2
Info: 1
`,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Summary:');
    });

    it('should handle Summary section on one line', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'Summary: Critical: 0 Warnings: 2 Info: 1\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Summary:');
    });

    it('should handle File: with relative path', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File: ./PRD.md\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('File:');
    });

    it('should handle File: with absolute path', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File: /home/user/project/PRD.md\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('File:');
    });

    it('should not match File: across lines', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File:\n/path/to/PRD.md\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      // Should not match because \s+ would match across newline, but [ \t]+ doesn't
      expect(result.sectionsPresent).not.toContain('File:');
    });

    it('should handle very long validation reports', () => {
      const longReport =
        '============================================================\n'.repeat(
          1000
        ) +
        'PRD Validation Report\n' +
        '============================================================\n' +
        'File: /path/to/PRD.md\n' +
        'Status: ✅ VALID\n' +
        '\n' +
        'Summary:\n' +
        '  Critical: 0\n' +
        '  Warnings: 2\n' +
        '  Info: 1\n' +
        '============================================================\n';

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: longReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
    });

    it('should handle Summary with zero counts', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: `
Summary:
  Critical: 0
  Warnings: 0
  Info: 0
`,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Summary:');
    });

    it('should handle Summary with large counts', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: `
Summary:
  Critical: 999
  Warnings: 888
  Info: 777
`,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('Summary:');
    });

    it('should handle borders with exactly 60 equals signs', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID
Summary:
  Critical: 0
  Warnings: 0
  Info: 0
============================================================
`,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
    });
  });

  // ========================================================================
  // Input preservation tests
  // ========================================================================

  describe('Input preservation', () => {
    it('should not mutate input PrdValidationResult object', () => {
      const originalResult = createMockPrdValidationResult({
        success: true,
        validationReport: fullValidReport,
        valid: true,
        exitCode: 0,
      });

      const originalResultCopy = { ...originalResult };
      verifyValidationReportFormat(originalResult);

      expect(originalResult.success).toBe(originalResultCopy.success);
      expect(originalResult.validationReport).toBe(
        originalResultCopy.validationReport
      );
      expect(originalResult.valid).toBe(originalResultCopy.valid);
      expect(originalResult.exitCode).toBe(originalResultCopy.exitCode);
    });
  });

  // ========================================================================
  // Real-world validation report format tests
  // ========================================================================

  describe('Real-world validation report formats', () => {
    it('should handle actual validation report format with issues', () => {
      const realReportWithIssues = `
============================================================
PRD Validation Report
============================================================
File: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/TEST_PRD.md
Status: ❌ INVALID

Summary:
  Critical: 2
  Warnings: 1
  Info: 0

Issues:
❌ [CRITICAL] Missing required section: ## What Problem Are We Solving?
   Suggestion: Add a "## What Problem Are We Solving?" section to your PRD
   Reference: PRD_VALIDATION_REQUIRED_SECTIONS

❌ [CRITICAL] Missing required section: ## Success Criteria
   Suggestion: Add a "## Success Criteria" section to your PRD

⚠️ [WARNING] Section "Executive Summary" is too short
   Suggestion: The Executive Summary should be at least 3 paragraphs
============================================================
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: realReportWithIssues,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
      expect(result.sectionsPresent).toHaveLength(4);
    });

    it('should handle actual validation report format without issues', () => {
      const realReportWithoutIssues = `
============================================================
PRD Validation Report
============================================================
File: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/TEST_PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 0
  Info: 1
============================================================
`;

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: realReportWithoutIssues,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
      expect(result.sectionsPresent).toHaveLength(4);
    });

    it('should handle validation report with Windows line endings', () => {
      const windowsReport =
        '============================================================\r\n' +
        'PRD Validation Report\r\n' +
        '============================================================\r\n' +
        'File: C:\\path\\to\\PRD.md\r\n' +
        'Status: ✅ VALID\r\n' +
        '\r\n' +
        'Summary:\r\n' +
        '  Critical: 0\r\n' +
        '  Warnings: 0\r\n' +
        '  Info: 0\r\n' +
        '============================================================\r\n';

      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: windowsReport,
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.formatValid).toBe(true);
    });
  });

  // ========================================================================
  // Regex pattern edge cases
  // ========================================================================

  describe('Regex pattern edge cases', () => {
    it('should match File: with hyphenated path', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File: /path/to/my-file.md\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('File:');
    });

    it('should match File: with underscore path', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File: /path/to/my_file.md\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('File:');
    });

    it('should match File: with query parameters', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: 'File: /path/to/file.md?query=1\n',
      });

      const result = verifyValidationReportFormat(mockResult);

      expect(result.sectionsPresent).toContain('File:');
    });

    it('should not match partial section names', () => {
      const mockResult = createMockPrdValidationResult({
        success: true,
        validationReport: `
PRD Report
FilePath: /path/to/PRD.md
StatusCode: ✅ VALID
SummaryOfIssues: 0
`,
      });

      const result = verifyValidationReportFormat(mockResult);

      // Should not match partial names
      expect(result.sectionsPresent).not.toContain('PRD Validation Report');
      expect(result.sectionsPresent).not.toContain('File:');
      expect(result.sectionsPresent).not.toContain('Status:');
    });
  });
});

// Helper variable for valid report output used across tests
const fullValidReport = `
============================================================
PRD Validation Report
============================================================
File: /path/to/PRD.md
Status: ✅ VALID

Summary:
  Critical: 0
  Warnings: 2
  Info: 1
============================================================
`;
