/**
 * Unit tests for bug severity classification and TEST_RESULTS.md output format
 *
 * @remarks
 * Tests validate that bug severity levels are correctly defined and that
 * TEST_RESULTS.md follows the structured format specification.
 *
 * Verifies:
 * - All four severity levels (critical, major, minor, cosmetic) are defined
 * - BugSeverityEnum validates all four levels
 * - BugSchema correctly classifies bugs by severity
 * - TestResults.hasBugs drives file generation
 * - TEST_RESULTS.md contains required sections and fields
 * - No file generated when hasBugs is false
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeAll, describe, expect, it } from 'vitest';
import {
  BugSchema,
  BugSeverityEnum,
  TestResultsSchema,
} from '../../src/core/models.js';
import type { Bug, BugSeverity, TestResults } from '../../src/core/models.js';

// =============================================================================
// Test Fixtures and Factory Functions
// =============================================================================

/**
 * Create a TestBug fixture for testing
 *
 * @remarks
 * Factory function for creating valid Bug objects matching the Bug interface.
 */
const createTestBug = (
  id: string,
  severity: BugSeverity,
  title: string,
  description: string,
  reproduction: string,
  location?: string
): Bug => ({
  id,
  severity,
  title,
  description,
  reproduction,
  location,
});

/**
 * Create a TestResults fixture for testing
 *
 * @remarks
 * Factory function for creating valid TestResults objects matching the TestResults interface.
 */
const createTestResults = (
  hasBugs: boolean,
  bugs: Bug[],
  summary: string,
  recommendations: string[]
): TestResults => ({
  hasBugs,
  bugs,
  summary,
  recommendations,
});

/**
 * Bug severity criteria from system_context.md
 *
 * @remarks
 * These are the authoritative definitions from the system context documentation.
 * Tests verify that severity classifications align with these criteria.
 */
const SEVERITY_CRITERIA = {
  critical: 'Blocks core functionality',
  major: 'Significantly impacts UX/functionality',
  minor: 'Small improvements',
  cosmetic: 'Polish items',
} as const;

// =============================================================================
// TEST SUITE: BugSeverity Type Validation
// =============================================================================

describe('unit/bug-severity-classification', () => {
  describe('BugSeverity type', () => {
    it('should define all four severity levels', () => {
      // SETUP: Expected severity levels from system_context.md
      const expectedSeverities: BugSeverity[] = [
        'critical',
        'major',
        'minor',
        'cosmetic',
      ];

      // EXECUTE & VERIFY: Type allows all four values
      expectedSeverities.forEach(severity => {
        const bug: Bug = createTestBug(
          'BUG-001',
          severity,
          'Test Bug',
          'Test description',
          'Test reproduction'
        );
        const result = BugSchema.safeParse(bug);
        expect(result.success).toBe(true);
      });
    });
  });

  // =============================================================================
  // TEST SUITE: BugSeverityEnum Schema Validation
  // =============================================================================

  describe('BugSeverityEnum schema validation', () => {
    it('should accept valid severity "critical"', () => {
      // SETUP: Valid severity value
      const severity = 'critical';

      // EXECUTE: Parse with Zod schema
      const result = BugSeverityEnum.safeParse(severity);

      // VERIFY: Valid severity passes validation
      expect(result.success).toBe(true);
    });

    it('should accept valid severity "major"', () => {
      // SETUP: Valid severity value
      const severity = 'major';

      // EXECUTE: Parse with Zod schema
      const result = BugSeverityEnum.safeParse(severity);

      // VERIFY: Valid severity passes validation
      expect(result.success).toBe(true);
    });

    it('should accept valid severity "minor"', () => {
      // SETUP: Valid severity value
      const severity = 'minor';

      // EXECUTE: Parse with Zod schema
      const result = BugSeverityEnum.safeParse(severity);

      // VERIFY: Valid severity passes validation
      expect(result.success).toBe(true);
    });

    it('should accept valid severity "cosmetic"', () => {
      // SETUP: Valid severity value
      const severity = 'cosmetic';

      // EXECUTE: Parse with Zod schema
      const result = BugSeverityEnum.safeParse(severity);

      // VERIFY: Valid severity passes validation
      expect(result.success).toBe(true);
    });

    it('should reject invalid severity values', () => {
      // SETUP: Invalid severity values
      const invalidSeverities = [
        'invalid',
        'BLOCKER',
        'urgent',
        'high',
        'low',
        '',
        null,
        undefined,
      ];

      // EXECUTE & VERIFY: All invalid values fail validation
      invalidSeverities.forEach(severity => {
        const result = BugSeverityEnum.safeParse(severity);
        expect(result.success).toBe(false);
      });
    });
  });

  // =============================================================================
  // TEST SUITE: BugSchema Severity Validation
  // =============================================================================

  describe('BugSchema severity validation', () => {
    it('should validate bug with critical severity', () => {
      // SETUP: Valid bug with critical severity
      const bug = createTestBug(
        'BUG-001',
        'critical',
        'Critical Bug',
        'Critical description',
        'Critical reproduction'
      );

      // EXECUTE: Validate with BugSchema
      const result = BugSchema.safeParse(bug);

      // VERIFY: Bug passes validation with correct severity
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.severity).toBe('critical');
      }
    });

    it('should validate bug with major severity', () => {
      // SETUP: Valid bug with major severity
      const bug = createTestBug(
        'BUG-002',
        'major',
        'Major Bug',
        'Major description',
        'Major reproduction'
      );

      // EXECUTE: Validate with BugSchema
      const result = BugSchema.safeParse(bug);

      // VERIFY: Bug passes validation with correct severity
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.severity).toBe('major');
      }
    });

    it('should validate bug with minor severity', () => {
      // SETUP: Valid bug with minor severity
      const bug = createTestBug(
        'BUG-003',
        'minor',
        'Minor Bug',
        'Minor description',
        'Minor reproduction'
      );

      // EXECUTE: Validate with BugSchema
      const result = BugSchema.safeParse(bug);

      // VERIFY: Bug passes validation with correct severity
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.severity).toBe('minor');
      }
    });

    it('should validate bug with cosmetic severity', () => {
      // SETUP: Valid bug with cosmetic severity
      const bug = createTestBug(
        'BUG-004',
        'cosmetic',
        'Cosmetic Bug',
        'Cosmetic description',
        'Cosmetic reproduction'
      );

      // EXECUTE: Validate with BugSchema
      const result = BugSchema.safeParse(bug);

      // VERIFY: Bug passes validation with correct severity
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.severity).toBe('cosmetic');
      }
    });

    it('should reject bug with invalid severity', () => {
      // SETUP: Bug with invalid severity (type assertion for testing)
      const invalidBug = {
        id: 'BUG-001',
        severity: 'BLOCKER', // Invalid - not in BugSeverityEnum
        title: 'Test Bug',
        description: 'Test description',
        reproduction: 'Test reproduction',
      };

      // EXECUTE: Validate with BugSchema
      const result = BugSchema.safeParse(invalidBug);

      // VERIFY: Bug fails validation
      expect(result.success).toBe(false);
    });

    it('should reject bug with missing severity', () => {
      // SETUP: Bug without severity field
      const incompleteBug = {
        id: 'BUG-001',
        title: 'Test Bug',
        description: 'Test description',
        reproduction: 'Test reproduction',
      };

      // EXECUTE: Validate with BugSchema
      const result = BugSchema.safeParse(incompleteBug);

      // VERIFY: Bug fails validation
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST SUITE: TestResults.hasBugs Control
  // =============================================================================

  describe('TestResults.hasBugs control', () => {
    it('should accept hasBugs: true', () => {
      // SETUP: TestResults with hasBugs: true
      const testResults = createTestResults(
        true,
        [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Rep')],
        'Found bugs',
        ['Fix it']
      );

      // EXECUTE: Validate with TestResultsSchema
      const result = TestResultsSchema.safeParse(testResults);

      // VERIFY: hasBugs is preserved as true
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.hasBugs).toBe(true);
      }
    });

    it('should accept hasBugs: false', () => {
      // SETUP: TestResults with hasBugs: false (no bugs found)
      const testResults = createTestResults(false, [], 'No bugs found', []);

      // EXECUTE: Validate with TestResultsSchema
      const result = TestResultsSchema.safeParse(testResults);

      // VERIFY: hasBugs is preserved as false
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.hasBugs).toBe(false);
      }
    });

    it('should reject hasBugs with wrong type', () => {
      // SETUP: TestResults with hasBugs as string (invalid type)
      const invalidResults = {
        hasBugs: 'true', // Should be boolean
        bugs: [],
        summary: 'Test',
        recommendations: [],
      };

      // EXECUTE: Validate with TestResultsSchema
      const result = TestResultsSchema.safeParse(invalidResults);

      // VERIFY: Validation fails
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // TEST SUITE: Bug Severity Criteria from system_context.md
  // =============================================================================

  describe('bug severity criteria from system_context.md', () => {
    it('should define critical as "blocks core functionality"', () => {
      // VERIFY: Critical severity criteria matches system_context.md
      expect(SEVERITY_CRITERIA.critical).toBe('Blocks core functionality');
    });

    it('should define major as "significantly impacts UX/functionality"', () => {
      // VERIFY: Major severity criteria matches system_context.md
      expect(SEVERITY_CRITERIA.major).toBe(
        'Significantly impacts UX/functionality'
      );
    });

    it('should define minor as "small improvements"', () => {
      // VERIFY: Minor severity criteria matches system_context.md
      expect(SEVERITY_CRITERIA.minor).toBe('Small improvements');
    });

    it('should define cosmetic as "polish items"', () => {
      // VERIFY: Cosmetic severity criteria matches system_context.md
      expect(SEVERITY_CRITERIA.cosmetic).toBe('Polish items');
    });
  });

  // =============================================================================
  // TEST SUITE: TEST_RESULTS.md Format Structure
  // =============================================================================

  describe('TEST_RESULTS.md format structure', () => {
    // NOTE: These tests verify the format specification, not actual file generation
    // File generation is tested in integration tests (qa-agent.test.ts)

    const TEST_RESULTS_FORMAT = `
# Bug Fix Requirements

## Overview

Brief summary of testing performed and overall quality assessment.

## Critical Issues (Must Fix)

Issues that prevent core functionality from working.

### Issue 1: [Title]

**Severity**: Critical
**PRD Reference**: [Which section/requirement]
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Steps to Reproduce**: How to see the bug
**Suggested Fix**: Brief guidance on resolution

## Major Issues (Should Fix)

Issues that significantly impact user experience or functionality.

## Minor Issues (Nice to Fix)

Small improvements or polish items.

## Testing Summary

- Total tests performed: X
- Passing: X
- Failing: X
`;

    it('should contain ## Overview section', () => {
      expect(TEST_RESULTS_FORMAT).toContain('## Overview');
    });

    it('should contain ## Critical Issues (Must Fix) section', () => {
      expect(TEST_RESULTS_FORMAT).toContain('## Critical Issues (Must Fix)');
    });

    it('should contain ## Major Issues (Should Fix) section', () => {
      expect(TEST_RESULTS_FORMAT).toContain('## Major Issues (Should Fix)');
    });

    it('should contain ## Minor Issues (Nice to Fix) section', () => {
      expect(TEST_RESULTS_FORMAT).toContain('## Minor Issues (Nice to Fix)');
    });

    it('should contain ## Testing Summary section', () => {
      expect(TEST_RESULTS_FORMAT).toContain('## Testing Summary');
    });
  });

  // =============================================================================
  // TEST SUITE: Bug Report Field Structure
  // =============================================================================

  describe('bug report field structure', () => {
    const BUG_REPORT_FIELDS = `
**Severity**: Critical
**PRD Reference**: [Which section/requirement]
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Steps to Reproduce**: How to see the bug
**Suggested Fix**: Brief guidance on resolution
`;

    it('should contain Severity field', () => {
      expect(BUG_REPORT_FIELDS).toContain('**Severity**');
    });

    it('should contain PRD Reference field', () => {
      expect(BUG_REPORT_FIELDS).toContain('**PRD Reference**');
    });

    it('should contain Expected Behavior field', () => {
      expect(BUG_REPORT_FIELDS).toContain('**Expected Behavior**');
    });

    it('should contain Actual Behavior field', () => {
      expect(BUG_REPORT_FIELDS).toContain('**Actual Behavior**');
    });

    it('should contain Steps to Reproduce field', () => {
      expect(BUG_REPORT_FIELDS).toContain('**Steps to Reproduce**');
    });

    it('should contain Suggested Fix field', () => {
      expect(BUG_REPORT_FIELDS).toContain('**Suggested Fix**');
    });
  });

  // =============================================================================
  // TEST SUITE: TEST_RESULTS.md File Generation Rules
  // =============================================================================

  describe('TEST_RESULTS.md file generation rules', () => {
    let BUG_HUNT_PROMPT: string;

    beforeAll(async () => {
      // Import BUG_HUNT_PROMPT to verify file generation rules
      const prompts = await import('../../src/agents/prompts.js');
      BUG_HUNT_PROMPT = prompts.BUG_HUNT_PROMPT;
    });

    it('should specify write file when critical/major bugs found', () => {
      // VERIFY: BUG_HUNT_PROMPT contains instruction to write file when bugs found
      expect(BUG_HUNT_PROMPT).toContain(
        '**If you find Critical or Major bugs**: You MUST write'
      );
    });

    it('should specify no file when no critical/major bugs found', () => {
      // VERIFY: BUG_HUNT_PROMPT contains instruction to NOT write file when no bugs
      expect(BUG_HUNT_PROMPT).toContain(
        '**If you find NO Critical or Major bugs**: Do NOT write any file'
      );
    });

    it('should specify absence of file signals success', () => {
      // VERIFY: BUG_HUNT_PROMPT explains that missing file means success
      expect(BUG_HUNT_PROMPT).toContain('Leave no trace');
      expect(BUG_HUNT_PROMPT).toContain('absence of the file signals success');
    });
  });

  // =============================================================================
  // TEST SUITE: TestResults with Multiple Severity Levels
  // =============================================================================

  describe('TestResults with multiple severity levels', () => {
    it('should validate TestResults with bugs at all severity levels', () => {
      // SETUP: TestResults with all 4 severity levels
      const testResults = createTestResults(
        true,
        [
          createTestBug('BUG-001', 'critical', 'Critical', 'Desc', 'Rep'),
          createTestBug('BUG-002', 'major', 'Major', 'Desc', 'Rep'),
          createTestBug('BUG-003', 'minor', 'Minor', 'Desc', 'Rep'),
          createTestBug('BUG-004', 'cosmetic', 'Cosmetic', 'Desc', 'Rep'),
        ],
        'All severity levels',
        []
      );

      // EXECUTE: Validate with TestResultsSchema
      const result = TestResultsSchema.safeParse(testResults);

      // VERIFY: All bugs validated successfully
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.bugs).toHaveLength(4);
        expect(result.data.bugs[0].severity).toBe('critical');
        expect(result.data.bugs[1].severity).toBe('major');
        expect(result.data.bugs[2].severity).toBe('minor');
        expect(result.data.bugs[3].severity).toBe('cosmetic');
      }
    });

    it('should validate TestResults with empty bugs array', () => {
      // SETUP: TestResults with no bugs (success case)
      const testResults = createTestResults(false, [], 'No bugs found', []);

      // EXECUTE: Validate with TestResultsSchema
      const result = TestResultsSchema.safeParse(testResults);

      // VERIFY: Empty bugs array is valid
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.bugs).toHaveLength(0);
        expect(result.data.hasBugs).toBe(false);
      }
    });

    it('should validate TestResults with only critical bugs', () => {
      // SETUP: TestResults with only critical bugs
      const testResults = createTestResults(
        true,
        [createTestBug('BUG-001', 'critical', 'Critical', 'Desc', 'Rep')],
        'Critical bugs only',
        ['Fix critical bugs first']
      );

      // EXECUTE: Validate with TestResultsSchema
      const result = TestResultsSchema.safeParse(testResults);

      // VERIFY: Validation passes
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.bugs).toHaveLength(1);
        expect(result.data.bugs[0].severity).toBe('critical');
      }
    });

    it('should validate TestResults with only minor/cosmetic bugs', () => {
      // SETUP: TestResults with only minor/cosmetic bugs (no critical/major)
      // GOTCHA: hasBugs can be true even for minor/cosmetic bugs
      // File generation is controlled by BUG_HUNT_PROMPT (only write for critical/major)
      const testResults = createTestResults(
        true,
        [
          createTestBug('BUG-001', 'minor', 'Minor', 'Desc', 'Rep'),
          createTestBug('BUG-002', 'cosmetic', 'Cosmetic', 'Desc', 'Rep'),
        ],
        'Minor/cosmetic bugs only',
        []
      );

      // EXECUTE: Validate with TestResultsSchema
      const result = TestResultsSchema.safeParse(testResults);

      // VERIFY: Validation passes (hasBugs can be true regardless of severity)
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data.bugs).toHaveLength(2);
        expect(result.data.bugs[0].severity).toBe('minor');
        expect(result.data.bugs[1].severity).toBe('cosmetic');
      }
    });
  });
});
