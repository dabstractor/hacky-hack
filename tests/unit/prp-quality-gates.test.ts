/**
 * Unit tests for PRP (Product Requirement Prompt) quality gate validation
 *
 * @remarks
 * Tests validate that PRPs meet quality standards defined in PROMPTS.md:
 * - Context Completeness: All required context sections present
 * - Template Structure Compliance: All required PRP sections present
 * - Information Density: PRP contains specific, actionable content
 * - "No Prior Knowledge" Test: PRP is self-contained without undefined references
 *
 * Quality gates prevent incomplete or vague PRPs from causing implementation failures.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import type { PRPDocument } from '../../src/core/models.js';
import {
  COMPLETE_PRP,
  INCOMPLETE_CONTEXT_PRP,
  VAGUE_PRP,
  MISSING_SECTIONS_PRP,
  UNDEFINED_REFERENCES_PRP,
  MODERATE_DENSITY_PRP,
} from '../fixtures/prp-samples.js';

// ============================================================================
// Type Definitions for Quality Gate Validation
// ============================================================================

/**
 * Result of a quality gate validation check
 *
 * @remarks
 * Contains validation status, error messages for failures, and warnings
 * for potential issues that don't block validation.
 */
interface QualityGateResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error messages explaining validation failures */
  errors: string[];
  /** Warning messages for potential issues */
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Required context subsections for Context Completeness check */
const REQUIRED_CONTEXT_SUBSECTIONS = [
  'Context Completeness Check',
  'Documentation & References',
  'Current Codebase Tree',
  'Desired Codebase Tree',
  'Known Gotchas',
] as const;

/** Vague phrases that indicate low information density */
const VAGUE_PHRASES = [
  'properly',
  'correctly',
  'appropriately',
  'best practices',
  'good coding standards',
  'make sure it works',
  'implement properly',
  'check the docs',
  'for more info',
  'follow best practices',
] as const;

/** Undefined reference patterns that indicate missing specificity */
const UNDEFINED_REFERENCE_PATTERNS = [
  /\bsome file\b/i,
  /\bsome directory\b/i,
  /\bthe docs\b/i,
  /\bthat file\b/i,
  /\bthat module\b/i,
  /\bthe folder\b/i,
  /\bsome module\b/i,
] as const;

/** Information density threshold (markers per 1000 characters) */
const DENSITY_THRESHOLD = 2.0;

// ============================================================================
// Quality Gate Validation Functions
// ============================================================================

/**
 * Validates Context Completeness quality gate
 *
 * @param prp - The PRP document to validate
 * @returns Validation result with errors for missing context sections
 *
 * @remarks
 * Checks that all required context subsections are present:
 * - Context Completeness Check
 * - Documentation & References
 * - Current Codebase Tree
 * - Desired Codebase Tree
 * - Known Gotchas (or "Known Gotchas & Library Quirks")
 */
function validateContextCompleteness(prp: PRPDocument): QualityGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const section of REQUIRED_CONTEXT_SUBSECTIONS) {
    // Use prefix matching to allow variations like "Known Gotchas & Library Quirks"
    const hasMatch =
      prp.context.includes(section) ||
      prp.context
        .split('\n')
        .some(
          line =>
            line.trim().startsWith('###') &&
            line.trim().slice(3).trim().startsWith(section)
        );

    if (!hasMatch) {
      errors.push(`Missing required context section: ${section}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Template Structure Compliance quality gate
 *
 * @param prp - The PRP document to validate
 * @returns Validation result with errors for missing required content
 *
 * @remarks
 * Checks that the PRP has minimal required content structure:
 * - Non-empty objective
 * - Non-empty context
 * - At least one implementation step
 * - Exactly 4 validation gates
 * - At least one success criterion
 */
function validateTemplateStructure(prp: PRPDocument): QualityGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check objective
  if (!prp.objective || prp.objective.trim().length === 0) {
    errors.push('Objective cannot be empty');
  }

  // Check context
  if (!prp.context || prp.context.trim().length === 0) {
    errors.push('Context cannot be empty');
  }

  // Check implementation steps
  if (!prp.implementationSteps || prp.implementationSteps.length === 0) {
    errors.push('Implementation steps cannot be empty');
  }

  // Check validation gates (must have exactly 4)
  if (!prp.validationGates || prp.validationGates.length !== 4) {
    errors.push(
      `Must have exactly 4 validation gates, found ${prp.validationGates?.length || 0}`
    );
  } else {
    // Check that each validation gate has required fields
    prp.validationGates.forEach((gate, index) => {
      if (!gate.level || gate.level < 1 || gate.level > 4) {
        errors.push(
          `Validation gate ${index + 1} has invalid level: ${gate.level}`
        );
      }
      if (!gate.description || gate.description.trim().length === 0) {
        errors.push(`Validation gate ${index + 1} missing description`);
      }
    });
  }

  // Check success criteria
  if (!prp.successCriteria || prp.successCriteria.length === 0) {
    errors.push('Success criteria cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculates information density score for a PRP
 *
 * @param prp - The PRP document to analyze
 * @returns Information density score (markers per 1000 characters)
 *
 * @remarks
 * Counts specific information markers:
 * - File paths with extensions
 * - URLs (http/https)
 * - Code blocks (triple backticks)
 * - Shell commands ($ prefix)
 * - Specific file references (src/, lib/, tests/)
 */
function calculateInformationDensity(prp: PRPDocument): number {
  const content = prp.context + '\n' + prp.implementationSteps.join('\n');
  const totalLength = content.length;

  if (totalLength === 0) {
    return 0;
  }

  // Count specific information markers
  let markerCount = 0;

  // File extensions (indicates specific file references)
  markerCount += (content.match(/\w+\.\w{2,4}/g) || []).length;

  // URLs
  markerCount += (content.match(/https?:\/\/[^\s]+/g) || []).length;

  // Code blocks
  markerCount += (content.match(/```/g) || []).length / 2;

  // Shell commands
  markerCount += (content.match(/\$\s+\w+/g) || []).length;

  // Directory paths
  markerCount += (content.match(/(src\/|lib\/|tests\/|docs\/)/g) || []).length;

  // TypeScript/JavaScript type annotations
  markerCount += (
    content.match(/:\s*(string|number|boolean|void|any|never)/g) || []
  ).length;

  // Calculate density score (markers per 1000 characters)
  return (markerCount / totalLength) * 1000;
}

/**
 * Validates Information Density quality gate
 *
 * @param prp - The PRP document to validate
 * @returns Validation result with errors for low information density
 *
 * @remarks
 * Checks that PRP contains specific, actionable content:
 * - Information density score above threshold
 * - Not too many vague phrases
 * - Has concrete examples and references
 */
function validateInformationDensity(prp: PRPDocument): QualityGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const densityScore = calculateInformationDensity(prp);

  if (densityScore < DENSITY_THRESHOLD) {
    errors.push(
      `Information density too low: ${densityScore.toFixed(2)} markers/1000 chars ` +
        `(threshold: ${DENSITY_THRESHOLD}). Add specific file paths, URLs, code examples, or commands.`
    );
  }

  // Check for vague phrases
  const content = (
    prp.context +
    ' ' +
    prp.implementationSteps.join(' ')
  ).toLowerCase();
  const vaguePhraseCount = VAGUE_PHRASES.filter(phrase =>
    content.includes(phrase.toLowerCase())
  ).length;

  // Too many vague phrases (more than 2 per 500 chars)
  const vagueRatio = vaguePhraseCount / (content.length / 500);
  if (vagueRatio > 1) {
    warnings.push(
      `PRP contains many vague phrases (${vaguePhraseCount} found). ` +
        `Replace with specific, actionable instructions.`
    );
  }

  // Check if implementation steps are too generic
  const genericStepPattern =
    /^(do|make|create|add|implement|fix|update)( \w+){1,3}$/i;
  const genericSteps = prp.implementationSteps.filter(step =>
    genericStepPattern.test(step.trim())
  );

  if (genericSteps.length > prp.implementationSteps.length / 2) {
    errors.push(
      'Too many generic implementation steps. ' +
        'Each step should be specific and actionable (e.g., "Create UserService class" not "Do the implementation").'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates "No Prior Knowledge" quality gate
 *
 * @param prp - The PRP document to validate
 * @returns Validation result with errors for undefined references
 *
 * @remarks
 * Checks that PRP is self-contained without external dependencies not explicitly referenced:
 * - No undefined references like "some file", "the docs"
 * - All file references are specific paths
 * - References are accessible or explicitly documented
 */
function validateNoPriorKnowledge(prp: PRPDocument): QualityGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const content =
    prp.context +
    ' ' +
    prp.implementationSteps.join(' ') +
    ' ' +
    prp.references.join(' ');

  // Check for undefined reference patterns
  for (const pattern of UNDEFINED_REFERENCE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      errors.push(
        `Undefined reference detected: "${matches[0]}". ` +
          `Replace with specific file paths or URLs.`
      );
    }
  }

  // Check that references are specific (contain paths or URLs)
  if (prp.references.length > 0) {
    const vagueReferences = prp.references.filter(ref => {
      const lowerRef = ref.toLowerCase();
      return (
        !lowerRef.includes('/') && // Not a path
        !lowerRef.includes('http') && // Not a URL
        !lowerRef.includes('.') && // Not a file
        lowerRef.length < 20
      ); // Short, likely vague
    });

    if (vagueReferences.length > 0) {
      warnings.push(
        `Some references are vague: ${vagueReferences.join(', ')}. ` +
          `Use specific file paths or URLs.`
      );
    }
  }

  // Check that context has specific indicators (file paths, URLs, code blocks)
  const hasSpecificIndicators =
    prp.context.includes('src/') ||
    prp.context.includes('http') ||
    prp.context.includes('```') ||
    prp.context.includes('```typescript') ||
    prp.context.includes('```bash') ||
    prp.context.includes('```yaml');

  if (!hasSpecificIndicators) {
    warnings.push(
      'Context lacks specific indicators (file paths, URLs, code blocks). ' +
        'Add concrete examples for better clarity.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Runs all quality gate validations on a PRP
 *
 * @param prp - The PRP document to validate
 * @returns Combined validation result from all quality gates
 *
 * @remarks
 * Executes all four quality gates and combines results:
 * - Context Completeness
 * - Template Structure Compliance
 * - Information Density
 * - "No Prior Knowledge" Test
 */
function validateAllQualityGates(prp: PRPDocument): QualityGateResult {
  const contextResult = validateContextCompleteness(prp);
  const structureResult = validateTemplateStructure(prp);
  const densityResult = validateInformationDensity(prp);
  const priorKnowledgeResult = validateNoPriorKnowledge(prp);

  return {
    valid:
      contextResult.valid &&
      structureResult.valid &&
      densityResult.valid &&
      priorKnowledgeResult.valid,
    errors: [
      ...contextResult.errors,
      ...structureResult.errors,
      ...densityResult.errors,
      ...priorKnowledgeResult.errors,
    ],
    warnings: [
      ...contextResult.warnings,
      ...structureResult.warnings,
      ...densityResult.warnings,
      ...priorKnowledgeResult.warnings,
    ],
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('unit/prp-quality-gates', () => {
  describe('context completeness check', () => {
    it('should pass for PRP with complete context', () => {
      // ARRANGE: Use COMPLETE_PRP fixture with all required sections
      const prp = COMPLETE_PRP;

      // ACT: Run context completeness validation
      const result = validateContextCompleteness(prp);

      // ASSERT: Should pass with no errors
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for PRP with missing context sections', () => {
      // ARRANGE: Use INCOMPLETE_CONTEXT_PRP fixture
      const prp = INCOMPLETE_CONTEXT_PRP;

      // ACT: Run context completeness validation
      const result = validateContextCompleteness(prp);

      // ASSERT: Should fail with specific errors
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(e => e.includes('Missing required context section'))
      ).toBe(true);
    });

    it('should accept context with "Known Gotchas & Library Quirks" variation', () => {
      // ARRANGE: PRP with gotchas variation
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        context: `
### Context Completeness Check
Complete

### Documentation & References
- file: src/models.ts

### Current Codebase Tree
src/

### Desired Codebase Tree
src/models.ts

### Known Gotchas & Library Quirks
Use readonly.
`,
      };

      // ACT
      const result = validateContextCompleteness(prp);

      // ASSERT: Should pass (prefix match accepts "Known Gotchas & Library Quirks")
      expect(result.valid).toBe(true);
    });
  });

  describe('template structure compliance', () => {
    it('should pass for PRP with complete structure', () => {
      // ARRANGE: Use COMPLETE_PRP fixture
      const prp = COMPLETE_PRP;

      // ACT: Run template structure validation
      const result = validateTemplateStructure(prp);

      // ASSERT: Should pass with no errors
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty objective', () => {
      // ARRANGE: PRP with empty objective
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        objective: '',
      };

      // ACT
      const result = validateTemplateStructure(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Objective cannot be empty');
    });

    it('should detect empty context', () => {
      // ARRANGE: Use MISSING_SECTIONS_PRP fixture with empty context
      const prp = MISSING_SECTIONS_PRP;

      // ACT
      const result = validateTemplateStructure(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Context cannot be empty');
    });

    it('should detect missing implementation steps', () => {
      // ARRANGE: PRP with empty implementation steps
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        implementationSteps: [],
      };

      // ACT
      const result = validateTemplateStructure(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Implementation steps cannot be empty');
    });

    it('should detect incorrect number of validation gates', () => {
      // ARRANGE: PRP with only 2 validation gates
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        validationGates: [
          { level: 1, description: 'Test', command: 'npm test', manual: false },
          { level: 2, description: 'Test', command: 'npm test', manual: false },
        ],
      };

      // ACT
      const result = validateTemplateStructure(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Must have exactly 4 validation gates, found 2'
      );
    });

    it('should detect missing success criteria', () => {
      // ARRANGE: Use MISSING_SECTIONS_PRP with empty success criteria
      const prp = MISSING_SECTIONS_PRP;

      // ACT
      const result = validateTemplateStructure(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Success criteria cannot be empty');
    });
  });

  describe('information density check', () => {
    it('should pass for PRP with high information density', () => {
      // ARRANGE: Use COMPLETE_PRP with specific details
      const prp = COMPLETE_PRP;

      // ACT: Run information density validation
      const result = validateInformationDensity(prp);

      // ASSERT: Should pass
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect vague PRPs with low information content', () => {
      // ARRANGE: Use VAGUE_PRP fixture with generic content
      const prp = VAGUE_PRP;

      // ACT: Run information density validation
      const result = validateInformationDensity(prp);

      // ASSERT: Should fail density check
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(e => e.includes('Information density too low'))
      ).toBe(true);
    });

    it('should pass PRPs with moderate density', () => {
      // ARRANGE: Use MODERATE_DENSITY_PRP
      const prp = MODERATE_DENSITY_PRP;

      // ACT
      const result = validateInformationDensity(prp);

      // ASSERT: Should pass (has specific file paths and URL)
      expect(result.valid).toBe(true);
    });

    it('should warn about vague phrases in context', () => {
      // ARRANGE: Use VAGUE_PRP with vague phrases
      const prp = VAGUE_PRP;

      // ACT
      const result = validateInformationDensity(prp);

      // ASSERT: Should have warnings about vague phrases
      expect(result.warnings.some(w => w.includes('vague phrases'))).toBe(true);
    });

    it('should detect generic implementation steps', () => {
      // ARRANGE: PRP with generic steps
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        implementationSteps: ['Do the thing', 'Make it work', 'Test it'],
      };

      // ACT
      const result = validateInformationDensity(prp);

      // ASSERT: Should fail with generic steps error
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(e => e.includes('generic implementation steps'))
      ).toBe(true);
    });
  });

  describe('"No Prior Knowledge" test', () => {
    it('should pass self-contained PRPs', () => {
      // ARRANGE: Use COMPLETE_PRP with specific references
      const prp = COMPLETE_PRP;

      // ACT: Run "No Prior Knowledge" validation
      const result = validateNoPriorKnowledge(prp);

      // ASSERT: Should pass
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect PRPs with undefined references', () => {
      // ARRANGE: Use UNDEFINED_REFERENCES_PRP fixture
      const prp = UNDEFINED_REFERENCES_PRP;

      // ACT: Run "No Prior Knowledge" validation
      const result = validateNoPriorKnowledge(prp);

      // ASSERT: Should fail with undefined reference errors
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(e => e.includes('Undefined reference detected'))
      ).toBe(true);
    });

    it('should warn about vague references', () => {
      // ARRANGE: PRP with vague references (short, non-specific)
      const prp: PRPDocument = {
        taskId: 'P1.M1.T1.S99',
        objective: 'Test objective',
        context: 'Minimal context without specific indicators',
        implementationSteps: ['Write code'],
        validationGates: [
          { level: 1, description: 'Test', command: 'npm test', manual: false },
          { level: 2, description: 'Test', command: 'npm test', manual: false },
          { level: 3, description: 'Test', command: 'npm test', manual: false },
          { level: 4, description: 'Manual', command: null, manual: true },
        ],
        successCriteria: [{ description: 'Done', satisfied: false }],
        references: ['docs', 'module'],
      };

      // ACT
      const result = validateNoPriorKnowledge(prp);

      // ASSERT: Should warn about vague references
      expect(result.warnings.some(w => w.includes('are vague'))).toBe(true);
    });

    it('should detect context without specific indicators', () => {
      // ARRANGE: PRP without file paths, URLs, or code blocks
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        context: 'Some generic context without specifics',
      };

      // ACT
      const result = validateNoPriorKnowledge(prp);

      // ASSERT: Should warn about lack of specific indicators
      expect(
        result.warnings.some(w => w.includes('lacks specific indicators'))
      ).toBe(true);
    });
  });

  describe('all quality gates combined', () => {
    it('should pass COMPLETE_PRP through all quality gates', () => {
      // ARRANGE: Use high-quality COMPLETE_PRP
      const prp = COMPLETE_PRP;

      // ACT: Run all quality gate validations
      const result = validateAllQualityGates(prp);

      // ASSERT: Should pass all gates
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail INCOMPLETE_CONTEXT_PRP on context completeness', () => {
      // ARRANGE
      const prp = INCOMPLETE_CONTEXT_PRP;

      // ACT
      const result = validateAllQualityGates(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(e => e.includes('Missing required context section'))
      ).toBe(true);
    });

    it('should fail VAGUE_PRP on information density', () => {
      // ARRANGE
      const prp = VAGUE_PRP;

      // ACT
      const result = validateAllQualityGates(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(e => e.includes('Information density too low'))
      ).toBe(true);
    });

    it('should fail MISSING_SECTIONS_PRP on template structure', () => {
      // ARRANGE
      const prp = MISSING_SECTIONS_PRP;

      // ACT
      const result = validateAllQualityGates(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be empty'))).toBe(true);
    });

    it('should fail UNDEFINED_REFERENCES_PRP on "No Prior Knowledge" test', () => {
      // ARRANGE
      const prp = UNDEFINED_REFERENCES_PRP;

      // ACT
      const result = validateAllQualityGates(prp);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(e => e.includes('Undefined reference detected'))
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle PRP with minimal but valid content', () => {
      // ARRANGE: Minimal valid PRP
      const minimalPRP: PRPDocument = {
        taskId: 'P1.M1.T1.S99',
        objective: 'Do something specific',
        context: `### Context Completeness Check
Complete

### Documentation & References
- file: src/test.ts
  why: Reference file

### Current Codebase Tree
src/

### Desired Codebase Tree
src/test.ts

### Known Gotchas
None`,
        implementationSteps: ['Create test.ts with exports'],
        validationGates: [
          { level: 1, description: 'Test', command: 'npm test', manual: false },
          { level: 2, description: 'Test', command: 'npm test', manual: false },
          { level: 3, description: 'Test', command: 'npm test', manual: false },
          { level: 4, description: 'Manual', command: null, manual: true },
        ],
        successCriteria: [{ description: 'Done', satisfied: false }],
        references: ['src/test.ts'],
      };

      // ACT
      const result = validateAllQualityGates(minimalPRP);

      // ASSERT: Should pass (minimal but meets requirements)
      expect(result.valid).toBe(true);
    });

    it('should handle PRP with extremely long context', () => {
      // ARRANGE: PRP with very long context
      const longContextPRP: PRPDocument = {
        ...COMPLETE_PRP,
        context: '### Context\n' + 'x'.repeat(100000), // Very long but has specific markers
      };

      // ACT
      const result = validateAllQualityGates(longContextPRP);

      // ASSERT: Density might be low but shouldn't crash
      expect(result).toBeDefined();
    });

    it('should handle PRP with special characters in context', () => {
      // ARRANGE: PRP with special characters
      const specialCharsPRP: PRPDocument = {
        ...COMPLETE_PRP,
        context: `### Context Completeness Check
Complete

### Documentation & References
- file: src/test-file.ts
  why: Testing special chars and escape sequences

### Current Codebase Tree
src/

### Desired Codebase Tree
src/

### Known Gotchas
Handle special characters in strings`,
      };

      // ACT
      const result = validateAllQualityGates(specialCharsPRP);

      // ASSERT: Should handle special characters gracefully
      expect(result).toBeDefined();
    });

    it('should provide specific error messages for each failure', () => {
      // ARRANGE: PRP with multiple issues
      const badPRP: PRPDocument = {
        taskId: 'P1.M1.T1.S99',
        objective: '',
        context: '', // Empty context
        implementationSteps: [],
        validationGates: [],
        successCriteria: [],
        references: [],
      };

      // ACT
      const result = validateAllQualityGates(badPRP);

      // ASSERT: Should have specific errors for each issue
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Objective cannot be empty');
      expect(result.errors).toContain('Context cannot be empty');
      expect(result.errors).toContain('Implementation steps cannot be empty');
      expect(result.errors).toContain(
        'Must have exactly 4 validation gates, found 0'
      );
    });

    it('should separate errors from warnings', () => {
      // ARRANGE: PRP with warnings but valid structure
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        context:
          'Implement properly using best practices. Check src/file.ts for reference.',
        implementationSteps: ['Do it properly', 'Test it'],
      };

      // ACT
      const result = validateAllQualityGates(prp);

      // ASSERT: Should have warnings even if valid
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle PRP with all validation gate levels 1-4', () => {
      // ARRANGE: PRP with proper validation gates
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        validationGates: [
          { level: 1, description: 'Syntax', command: 'tsc', manual: false },
          { level: 2, description: 'Unit', command: 'npm test', manual: false },
          {
            level: 3,
            description: 'Integration',
            command: 'npm run test:int',
            manual: false,
          },
          { level: 4, description: 'Manual', command: null, manual: true },
        ],
      };

      // ACT
      const result = validateAllQualityGates(prp);

      // ASSERT: Should pass validation gates check
      expect(result.errors.some(e => e.includes('validation gate'))).toBe(
        false
      );
    });

    it('should detect validation gate with invalid level', () => {
      // ARRANGE: PRP with gate level outside 1-4 range
      // Use type assertion to test invalid level (edge case)
      const prp: PRPDocument = {
        ...COMPLETE_PRP,
        validationGates: [
          { level: 1, description: 'Test', command: 'test', manual: false },
          { level: 2, description: 'Test', command: 'test', manual: false },
          { level: 3, description: 'Test', command: 'test', manual: false },
          {
            level: 99 as 1,
            description: 'Invalid',
            command: null,
            manual: true,
          }, // Invalid level - type assertion for testing
        ],
      };

      // ACT
      const result = validateAllQualityGates(prp);

      // ASSERT: Should detect invalid level
      expect(result.errors.some(e => e.includes('invalid level'))).toBe(true);
    });
  });
});
