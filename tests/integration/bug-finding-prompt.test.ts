/**
 * Integration tests for BUG_HUNT_PROMPT structure verification
 *
 * @remarks
 * Tests validate that the BUG_HUNT_PROMPT constant contains all required
 * testing phases and categories as specified in the PRD requirements.
 *
 * Verifies:
 * - Phase 1: PRD Scope Analysis (4 elements)
 * - Phase 2: Creative End-to-End Testing (8 categories)
 * - Phase 3: Adversarial Testing (5 categories)
 * - Phase 4: Documentation as Bug Report
 * - Happy path, edge case, workflow, and adversarial testing specifications
 * - QA engineer mindset definition
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeAll } from 'vitest';

// =============================================================================
// DYNAMIC IMPORT - Load BUG_HUNT_PROMPT constant
// =============================================================================

/**
 * Dynamic import to avoid Groundswell initialization side effects
 *
 * @remarks
 * CRITICAL: BUG_HUNT_PROMPT is in src/agents/prompts.ts which imports Groundswell.
 * Groundswell initialization may have side effects, so use dynamic import in beforeAll.
 */
let BUG_HUNT_PROMPT: string;

beforeAll(async () => {
  const realPromptExports = await import('../../src/agents/prompts.js');
  BUG_HUNT_PROMPT = realPromptExports.BUG_HUNT_PROMPT;
});

// =============================================================================
// TEST CONSTANTS - Expected prompt content
// =============================================================================

const SCOPE_ANALYSIS_PHASE = 'Phase 1: PRD Scope Analysis';
const E2E_TESTING_PHASE = 'Phase 2: Creative End-to-End Testing';
const ADVERSARIAL_TESTING_PHASE = 'Phase 3: Adversarial Testing';
const DOCUMENTATION_PHASE = 'Phase 4: Documentation as Bug Report';

const QA_ENGINEER_ROLE = 'creative QA engineer and bug hunter';
const THINK_MINDSET = 'Think like a user, then think like an adversary';

// =============================================================================
// TEST SUITE: BUG_HUNT_PROMPT Structure Verification
// =============================================================================

describe('integration/bug-finding-prompt', () => {
  // ==========================================================================
  // TEST SUITE 1: Phase 1 - PRD Scope Analysis
  // ==========================================================================

  describe('Phase 1: PRD Scope Analysis', () => {
    it('should contain phase header', () => {
      expect(BUG_HUNT_PROMPT).toContain(SCOPE_ANALYSIS_PHASE);
    });

    it('should contain "Read and deeply understand the original PRD requirements"', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        'Read and deeply understand the original PRD requirements'
      );
    });

    it('should contain "Map each requirement to what should have been implemented"', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        'Map each requirement to what should have been implemented'
      );
    });

    it('should contain "Identify the expected user journeys and workflows"', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        'Identify the expected user journeys and workflows'
      );
    });

    it('should contain "Note any edge cases or corner cases implied by the requirements"', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        'Note any edge cases or corner cases implied by the requirements'
      );
    });
  });

  // ==========================================================================
  // TEST SUITE 2: Phase 2 - Creative End-to-End Testing
  // ==========================================================================

  describe('Phase 2: Creative End-to-End Testing', () => {
    it('should contain phase header', () => {
      expect(BUG_HUNT_PROMPT).toContain(E2E_TESTING_PHASE);
    });

    it('should contain "Happy Path Testing" with "primary use case" guidance', () => {
      expect(BUG_HUNT_PROMPT).toContain('Happy Path Testing');
      expect(BUG_HUNT_PROMPT).toContain('primary use case');
    });

    it('should contain "Edge Case Testing" with boundary examples', () => {
      expect(BUG_HUNT_PROMPT).toContain('Edge Case Testing');
      expect(BUG_HUNT_PROMPT).toContain('boundaries');
      expect(BUG_HUNT_PROMPT).toContain('empty inputs');
      expect(BUG_HUNT_PROMPT).toContain('max values');
      expect(BUG_HUNT_PROMPT).toContain('unicode');
      expect(BUG_HUNT_PROMPT).toContain('special chars');
    });

    it('should contain "Workflow Testing" with "full journey" specification', () => {
      expect(BUG_HUNT_PROMPT).toContain('Workflow Testing');
      expect(BUG_HUNT_PROMPT).toContain('full journey');
    });

    it('should contain "Integration Testing"', () => {
      expect(BUG_HUNT_PROMPT).toContain('Integration Testing');
    });

    it('should contain "Error Handling" with "graceful" specification', () => {
      expect(BUG_HUNT_PROMPT).toContain('Error Handling');
      expect(BUG_HUNT_PROMPT).toContain('graceful');
    });

    it('should contain "State Testing" with "state transitions"', () => {
      expect(BUG_HUNT_PROMPT).toContain('State Testing');
      expect(BUG_HUNT_PROMPT).toContain('state transitions');
    });

    it('should contain "Concurrency Testing"', () => {
      expect(BUG_HUNT_PROMPT).toContain('Concurrency Testing');
    });

    it('should contain "Regression Testing"', () => {
      expect(BUG_HUNT_PROMPT).toContain('Regression Testing');
    });

    it('should verify all 8 testing categories are present', () => {
      const expectedCategories = [
        'Happy Path Testing',
        'Edge Case Testing',
        'Workflow Testing',
        'Integration Testing',
        'Error Handling',
        'State Testing',
        'Concurrency Testing',
        'Regression Testing',
      ];

      expectedCategories.forEach(category => {
        expect(BUG_HUNT_PROMPT).toContain(category);
      });
    });
  });

  // ==========================================================================
  // TEST SUITE 3: Phase 3 - Adversarial Testing
  // ==========================================================================

  describe('Phase 3: Adversarial Testing', () => {
    it('should contain phase header', () => {
      expect(BUG_HUNT_PROMPT).toContain(ADVERSARIAL_TESTING_PHASE);
    });

    it('should contain "Unexpected Inputs"', () => {
      expect(BUG_HUNT_PROMPT).toContain('Unexpected Inputs');
    });

    it('should contain "Missing Features" with "PRD ask for that might not be implemented"', () => {
      expect(BUG_HUNT_PROMPT).toContain('Missing Features');
      expect(BUG_HUNT_PROMPT).toContain(
        'PRD ask for that might not be implemented'
      );
    });

    it('should contain "Incomplete Features"', () => {
      expect(BUG_HUNT_PROMPT).toContain('Incomplete Features');
    });

    it('should contain "Implicit Requirements"', () => {
      expect(BUG_HUNT_PROMPT).toContain('Implicit Requirements');
    });

    it('should contain "User Experience Issues"', () => {
      expect(BUG_HUNT_PROMPT).toContain('User Experience Issues');
    });

    it('should verify all 5 adversarial categories are present', () => {
      const expectedCategories = [
        'Unexpected Inputs',
        'Missing Features',
        'Incomplete Features',
        'Implicit Requirements',
        'User Experience Issues',
      ];

      expectedCategories.forEach(category => {
        expect(BUG_HUNT_PROMPT).toContain(category);
      });
    });
  });

  // ==========================================================================
  // TEST SUITE 4: Phase 4 - Documentation as Bug Report
  // ==========================================================================

  describe('Phase 4: Documentation as Bug Report', () => {
    it('should contain phase header', () => {
      expect(BUG_HUNT_PROMPT).toContain(DOCUMENTATION_PHASE);
    });

    it('should contain bug report structure with severity levels', () => {
      expect(BUG_HUNT_PROMPT).toContain('Critical Issues (Must Fix)');
      expect(BUG_HUNT_PROMPT).toContain('Major Issues (Should Fix)');
      expect(BUG_HUNT_PROMPT).toContain('Minor Issues (Nice to Fix)');
    });

    it('should contain bug report template sections', () => {
      expect(BUG_HUNT_PROMPT).toContain('## Overview');
      expect(BUG_HUNT_PROMPT).toContain('## Critical Issues (Must Fix)');
      expect(BUG_HUNT_PROMPT).toContain('## Major Issues (Should Fix)');
      expect(BUG_HUNT_PROMPT).toContain('## Minor Issues (Nice to Fix)');
      expect(BUG_HUNT_PROMPT).toContain('## Testing Summary');
    });

    it('should contain bug report fields', () => {
      expect(BUG_HUNT_PROMPT).toContain('**Severity**');
      expect(BUG_HUNT_PROMPT).toContain('**PRD Reference**');
      expect(BUG_HUNT_PROMPT).toContain('**Expected Behavior**');
      expect(BUG_HUNT_PROMPT).toContain('**Actual Behavior**');
      expect(BUG_HUNT_PROMPT).toContain('**Steps to Reproduce**');
      expect(BUG_HUNT_PROMPT).toContain('**Suggested Fix**');
    });
  });

  // ==========================================================================
  // TEST SUITE 5: Comprehensive Prompt Structure
  // ==========================================================================

  describe('comprehensive prompt structure', () => {
    it('should verify all 4 phases are present', () => {
      expect(BUG_HUNT_PROMPT).toContain(SCOPE_ANALYSIS_PHASE);
      expect(BUG_HUNT_PROMPT).toContain(E2E_TESTING_PHASE);
      expect(BUG_HUNT_PROMPT).toContain(ADVERSARIAL_TESTING_PHASE);
      expect(BUG_HUNT_PROMPT).toContain(DOCUMENTATION_PHASE);
    });

    it('should contain prompt title "Creative Bug Finding - End-to-End PRD Validation"', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        'Creative Bug Finding - End-to-End PRD Validation'
      );
    });
  });

  // ==========================================================================
  // TEST SUITE 6: QA Engineer Mindset Verification
  // ==========================================================================

  describe('QA engineer mindset verification', () => {
    it('should define the role as "creative QA engineer and bug hunter"', () => {
      expect(BUG_HUNT_PROMPT).toContain(QA_ENGINEER_ROLE);
    });

    it('should contain "Think like a user, then think like an adversary" instruction', () => {
      expect(BUG_HUNT_PROMPT).toContain(THINK_MINDSET);
    });

    it('should contain "Think creatively about what could go wrong" instruction', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        'Think creatively about what could go wrong'
      );
    });

    it('should contain "Be Thorough" guideline', () => {
      expect(BUG_HUNT_PROMPT).toContain('**Be Thorough**');
      expect(BUG_HUNT_PROMPT).toContain('Test everything you can think of');
    });

    it('should contain "Be Creative" guideline', () => {
      expect(BUG_HUNT_PROMPT).toContain('**Be Creative**');
      expect(BUG_HUNT_PROMPT).toContain('Think outside the box');
    });

    it('should contain "Be Specific" guideline', () => {
      expect(BUG_HUNT_PROMPT).toContain('**Be Specific**');
      expect(BUG_HUNT_PROMPT).toContain('Provide exact reproduction steps');
    });

    it('should contain "Be Constructive" guideline', () => {
      expect(BUG_HUNT_PROMPT).toContain('**Be Constructive**');
      expect(BUG_HUNT_PROMPT).toContain('Frame issues as improvements');
    });

    it('should contain "Prioritize" guideline', () => {
      expect(BUG_HUNT_PROMPT).toContain('**Prioritize**');
      expect(BUG_HUNT_PROMPT).toContain('Focus on what matters most to users');
    });

    it('should contain "Document Everything" guideline', () => {
      expect(BUG_HUNT_PROMPT).toContain('**Document Everything**');
      expect(BUG_HUNT_PROMPT).toContain('note it');
    });
  });

  // ==========================================================================
  // TEST SUITE 7: Important Guidelines Section
  // ==========================================================================

  describe('Important Guidelines section', () => {
    it('should contain "## Important Guidelines" section header', () => {
      expect(BUG_HUNT_PROMPT).toContain('## Important Guidelines');
    });

    it('should contain all 6 guidelines', () => {
      const guidelines = [
        'Be Thorough',
        'Be Creative',
        'Be Specific',
        'Be Constructive',
        'Prioritize',
        'Document Everything',
      ];

      guidelines.forEach(guideline => {
        expect(BUG_HUNT_PROMPT).toContain(guideline);
      });
    });
  });

  // ==========================================================================
  // TEST SUITE 8: Output Instructions (File Writing Rules)
  // ==========================================================================

  describe('Output instructions', () => {
    it('should contain "## Output - IMPORTANT" section', () => {
      expect(BUG_HUNT_PROMPT).toContain('## Output - IMPORTANT');
    });

    it('should specify rules for writing bug report file', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        '**If you find Critical or Major bugs**: You MUST write the bug report'
      );
      expect(BUG_HUNT_PROMPT).toContain(
        '**If you find NO Critical or Major bugs**: Do NOT write any file'
      );
      expect(BUG_HUNT_PROMPT).toContain('Do NOT create');
      expect(BUG_HUNT_PROMPT).toContain('Leave no trace');
    });

    it('should explain the importance of file presence/absence', () => {
      expect(BUG_HUNT_PROMPT).toContain(
        'presence or absence of the bug report file'
      );
      expect(BUG_HUNT_PROMPT).toContain('controls the entire bugfix pipeline');
    });
  });
});
