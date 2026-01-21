/**
 * Unit tests for PRP (Product Requirement Prompt) template structure validation
 *
 * @remarks
 * Tests validate that PRP markdown files comply with the template structure
 * defined in PROMPTS.md (lines 319-637), ensuring all required sections,
 * subsections, and content formats are present.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ============================================================================
// Type Definitions for PRP Structure
// ============================================================================

interface CodeBlock {
  language: string;
  content: string[];
}

interface PRPSubsection {
  name: string;
  content: string[];
  codeBlocks: CodeBlock[];
}

interface PRPSection {
  name: string;
  content: string[];
  subsections: Map<string, PRPSubsection>;
}

interface PRPMetadata {
  prpId?: string;
  title?: string;
  generated?: string;
  status?: string;
}

interface PRPStructure {
  sections: Map<string, PRPSection>;
  metadata?: PRPMetadata;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

// Use absolute path from project root
const VALID_PRP_PATH = '/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md';

// Required sections (9 total, excluding optional User Persona)
const REQUIRED_SECTIONS = [
  'Goal',
  'Why',
  'What',
  'All Needed Context',
  'Implementation Blueprint',
  'Validation Loop',
  'Final Validation Checklist',
  'Anti-Patterns to Avoid',
] as const;

// Required subsections for Goal section
const REQUIRED_GOAL_SUBSECTIONS = [
  'Feature Goal',
  'Deliverable',
  'Success Definition',
] as const;

// Required subsections for User Persona (if present)
const REQUIRED_USER_PERSONA_SUBSECTIONS = [
  'Target User',
  'Use Case',
  'User Journey',
  'Pain Points Addressed',
] as const;

// Required subsections for All Needed Context section
// Note: Names match the actual PRP format (case-sensitive, exact wording)
const REQUIRED_CONTEXT_SUBSECTIONS = [
  'Context Completeness Check',
  'Documentation & References',
  'Current Codebase Tree',
  'Desired Codebase Tree',
  'Known Gotchas & Library Quirks',
] as const;

// Required subsections for Implementation Blueprint section
// Note: Names match the actual PRP format (case-sensitive, exact wording)
const REQUIRED_BLUEPRINT_SUBSECTIONS = [
  'Data Models and Structure',
  'Implementation Tasks (Ordered by Dependencies)',
  'Implementation Patterns & Key Details',
  'Integration Points',
] as const;

// Required subsections for Validation Loop (4 levels)
// Note: Names match the actual PRP format (case-sensitive, exact wording)
const REQUIRED_VALIDATION_LEVELS = [
  'Level 1: Syntax & Style',
  'Level 2: Unit Tests',
  'Level 3: Integration Testing',
  'Level 4: Creative & Domain-Specific',
] as const;

// Required subsections for Final Validation Checklist
const REQUIRED_CHECKLIST_SUBSECTIONS = [
  'Technical Validation',
  'Feature Validation',
  'Code Quality Validation',
  'Documentation & Deployment',
] as const;

// ============================================================================
// Parser Function: parsePRPStructure()
// ============================================================================

/**
 * Parses a PRP markdown file into a structured format
 *
 * @param content - The markdown content of the PRP file
 * @returns Parsed PRP structure with sections, subsections, and code blocks
 *
 * @remarks
 * Uses a state machine approach to handle nested structures:
 * - Sections (##) contain subsections and content
 * - Subsections (###) contain content and code blocks
 * - Code blocks (```) have language type and content
 */
function parsePRPStructure(content: string): PRPStructure {
  const lines = content.split('\n');
  const sections: Map<string, PRPSection> = new Map();
  const metadata: PRPMetadata = {};

  let currentSection: PRPSection | null = null;
  let currentSubsection: PRPSubsection | null = null;
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent: string[] = [];

  for (const line of lines) {
    // Detect metadata (frontmatter before first ##)
    if (!currentSection) {
      const prpIdMatch = line.match(/^\*\*PRP ID\*\*:\s*(.+)$/);
      if (prpIdMatch) {
        metadata.prpId = prpIdMatch[1]?.trim();
        continue;
      }

      const titleMatch = line.match(/^\*\*Work Item Title\*\*:\s*(.+)$/);
      if (titleMatch) {
        metadata.title = titleMatch[1]?.trim();
        continue;
      }

      const generatedMatch = line.match(/^\*\*Generated\*\*:\s*(.+)$/);
      if (generatedMatch) {
        metadata.generated = generatedMatch[1]?.trim();
        continue;
      }

      const statusMatch = line.match(/^\*\*Status\*\*:\s*(.+)$/);
      if (statusMatch) {
        metadata.status = statusMatch[1]?.trim();
        continue;
      }
    }

    // Detect section headers (## Section Name)
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1]?.trim();
      if (sectionName) {
        currentSection = {
          name: sectionName,
          content: [],
          subsections: new Map(),
        };
        sections.set(sectionName, currentSection);
        currentSubsection = null;
      }
      continue;
    }

    // Detect subsection headers (### Subsection Name)
    const subsectionMatch = line.match(/^###\s+(.+)$/);
    if (subsectionMatch && currentSection) {
      const subsectionName = subsectionMatch[1]?.trim();
      if (subsectionName) {
        currentSubsection = {
          name: subsectionName,
          content: [],
          codeBlocks: [],
        };
        currentSection.subsections.set(subsectionName, currentSubsection);
      }
      continue;
    }

    // Detect subsection headers using **bold** format (for Goal, User Persona sections)
    // Format: **Subsection Name**: content
    const boldSubsectionMatch = line.match(/^\*\*([^\*]+)\*\*:\s*(.*)$/);
    if (boldSubsectionMatch && currentSection) {
      const subsectionName = boldSubsectionMatch[1]?.trim();
      const subsectionContent = boldSubsectionMatch[2]?.trim() || '';

      // Only treat as subsection if we're in a section that uses this format
      // (Goal, User Persona) or if there's no existing subsection
      const isGoalOrPersonaSection =
        currentSection.name === 'Goal' || currentSection.name === 'User Persona';

      if (subsectionName && isGoalOrPersonaSection) {
        currentSubsection = {
          name: subsectionName,
          content: subsectionContent ? [subsectionContent] : [],
          codeBlocks: [],
        };
        currentSection.subsections.set(subsectionName, currentSubsection);
      }
      continue;
    }

    // Detect code block start/end (```language)
    const codeBlockMatch = line.match(/^```(\w*)$/);
    if (codeBlockMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLanguage = codeBlockMatch[1] || '';
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        if (currentSubsection) {
          currentSubsection.codeBlocks.push({
            language: codeBlockLanguage,
            content: [...codeBlockContent],
          });
        }
        codeBlockContent = [];
        codeBlockLanguage = '';
      }
      continue;
    }

    // Add content to current context
    if (inCodeBlock) {
      codeBlockContent.push(line);
    } else if (currentSubsection) {
      currentSubsection.content.push(line);
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  return { sections, metadata };
}

// ============================================================================
// Validator Function: validatePRPTemplate()
// ============================================================================

/**
 * Validates a PRP structure against the required template
 *
 * @param structure - Parsed PRP structure to validate
 * @returns Validation result with errors and warnings
 *
 * @remarks
 * Checks for:
 * - All 8 required sections (User Persona is optional)
 * - Required subsections for each section
 * - Validation Loop has exactly 4 levels
 * - Anti-Patterns section has at least one anti-pattern
 */
function validatePRPTemplate(structure: PRPStructure): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check all 8 required sections
  for (const sectionName of REQUIRED_SECTIONS) {
    if (!structure.sections.has(sectionName)) {
      errors.push(`Missing required section: ${sectionName}`);
    }
  }

  // Check Goal subsections (all required)
  const goalSection = structure.sections.get('Goal');
  if (goalSection) {
    for (const subsectionName of REQUIRED_GOAL_SUBSECTIONS) {
      if (!goalSection.subsections.has(subsectionName)) {
        errors.push(`Goal section missing required subsection: ${subsectionName}`);
      }
    }
  } else {
    // Error already added above for missing Goal section
  }

  // Check User Persona subsections (if section exists)
  const userPersonaSection = structure.sections.get('User Persona');
  if (userPersonaSection) {
    for (const subsectionName of REQUIRED_USER_PERSONA_SUBSECTIONS) {
      if (!userPersonaSection.subsections.has(subsectionName)) {
        errors.push(`User Persona section missing required subsection: ${subsectionName}`);
      }
    }
  }

  // Check What subsections (Success Criteria is required)
  const whatSection = structure.sections.get('What');
  if (whatSection && !whatSection.subsections.has('Success Criteria')) {
    errors.push('What section missing required subsection: Success Criteria');
  }

  // Check All Needed Context subsections
  // Use prefix matching to allow variations like "Desired Codebase Tree (After This Task)"
  const contextSection = structure.sections.get('All Needed Context');
  if (contextSection) {
    const existingSubsections = Array.from(contextSection.subsections.keys());
    for (const requiredName of REQUIRED_CONTEXT_SUBSECTIONS) {
      const hasMatch = existingSubsections.some(name => name.startsWith(requiredName) || requiredName.startsWith(name));
      if (!hasMatch) {
        errors.push(`All Needed Context section missing required subsection: ${requiredName}`);
      }
    }
  }

  // Check Implementation Blueprint subsections
  // Use prefix matching to allow variations
  const blueprintSection = structure.sections.get('Implementation Blueprint');
  if (blueprintSection) {
    const existingSubsections = Array.from(blueprintSection.subsections.keys());
    for (const requiredName of REQUIRED_BLUEPRINT_SUBSECTIONS) {
      const hasMatch = existingSubsections.some(name => name.startsWith(requiredName) || requiredName.startsWith(name));
      if (!hasMatch) {
        errors.push(`Implementation Blueprint section missing required subsection: ${requiredName}`);
      }
    }
  }

  // Check Validation Loop has 4 levels
  const validationLoopSection = structure.sections.get('Validation Loop');
  if (validationLoopSection) {
    const levelSubsections = Array.from(validationLoopSection.subsections.keys()).filter(name =>
      REQUIRED_VALIDATION_LEVELS.some(level => name.startsWith(level.split(':')[0]))
    );

    if (levelSubsections.length < 4) {
      errors.push(`Validation Loop must have 4 levels, found ${levelSubsections.length}`);
    }

    // Check each level has bash code blocks
    for (const levelName of REQUIRED_VALIDATION_LEVELS) {
      const matchingSubsection = Array.from(validationLoopSection.subsections.keys()).find(name =>
        name.startsWith(levelName.split(':')[0])
      );
      if (matchingSubsection) {
        const subsection = validationLoopSection.subsections.get(matchingSubsection);
        if (subsection) {
          const hasBashBlock = subsection.codeBlocks.some(block => block.language === 'bash');
          if (!hasBashBlock) {
            warnings.push(`${levelName} missing bash code block with commands`);
          }
        }
      }
    }
  }

  // Check Final Validation Checklist subsections
  // Use prefix matching to allow variations
  const checklistSection = structure.sections.get('Final Validation Checklist');
  if (checklistSection) {
    const existingSubsections = Array.from(checklistSection.subsections.keys());
    for (const requiredName of REQUIRED_CHECKLIST_SUBSECTIONS) {
      const hasMatch = existingSubsections.some(name => name.startsWith(requiredName) || requiredName.startsWith(name));
      if (!hasMatch) {
        errors.push(`Final Validation Checklist section missing required subsection: ${requiredName}`);
      }
    }
  }

  // Check Anti-Patterns has at least one anti-pattern
  // Accepts either ❌ emoji or **Don't** format
  const antiPatternsSection = structure.sections.get('Anti-Patterns to Avoid');
  if (antiPatternsSection) {
    const hasEmojiPattern = antiPatternsSection.content.some(line => line.includes('❌'));
    const hasDontPattern = antiPatternsSection.content.some(line =>
      line.match(/\*\*Don't\*\*/i) || line.match(/\*\*Do not\*\*/i) || line.match(/- \*\*/i)
    );
    const hasAntiPattern = hasEmojiPattern || hasDontPattern;
    if (!hasAntiPattern) {
      errors.push('Anti-Patterns section must contain at least one anti-pattern (❌ or **Don\'t** format)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('unit/prp-template-validation', () => {
  describe('valid PRP structure', () => {
    it('should validate a valid PRP structure', () => {
      // ARRANGE: Read valid PRP sample
      const validPRPContent = readFileSync(VALID_PRP_PATH, 'utf-8');

      // ACT: Parse and validate
      const structure = parsePRPStructure(validPRPContent);
      const result = validatePRPTemplate(structure);

      // DEBUG: Print errors if validation fails
      if (!result.valid) {
        console.log('Validation errors:', result.errors);
      }

      // ASSERT: Should be valid with no errors
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse all 9 required sections from valid PRP', () => {
      // ARRANGE
      const validPRPContent = readFileSync(VALID_PRP_PATH, 'utf-8');

      // ACT
      const structure = parsePRPStructure(validPRPContent);

      // ASSERT: Check for all required sections
      for (const sectionName of REQUIRED_SECTIONS) {
        expect(structure.sections.has(sectionName)).toBe(true);
      }

      // User Persona is optional but present in the sample
      expect(structure.sections.has('User Persona')).toBe(true);
      expect(structure.sections.size).toBeGreaterThanOrEqual(8);
    });

    it('should extract metadata from valid PRP', () => {
      // ARRANGE
      const validPRPContent = readFileSync(VALID_PRP_PATH, 'utf-8');

      // ACT
      const structure = parsePRPStructure(validPRPContent);

      // ASSERT
      expect(structure.metadata).toBeDefined();
      expect(structure.metadata?.prpId).toBe('P1.M1.T1.S1');
      expect(structure.metadata?.generated).toBe('2026-01-12');
      expect(structure.metadata?.status).toBe('Ready for Implementation');
    });

    it('should parse Goal subsections correctly', () => {
      // ARRANGE
      const validPRPContent = readFileSync(VALID_PRP_PATH, 'utf-8');

      // ACT
      const structure = parsePRPStructure(validPRPContent);
      const goalSection = structure.sections.get('Goal');

      // ASSERT
      expect(goalSection).toBeDefined();
      for (const subsectionName of REQUIRED_GOAL_SUBSECTIONS) {
        expect(goalSection?.subsections.has(subsectionName)).toBe(true);
      }
    });

    it('should parse Validation Loop with 4 levels', () => {
      // ARRANGE
      const validPRPContent = readFileSync(VALID_PRP_PATH, 'utf-8');

      // ACT
      const structure = parsePRPStructure(validPRPContent);
      const validationLoopSection = structure.sections.get('Validation Loop');

      // ASSERT
      expect(validationLoopSection).toBeDefined();

      const levelSubsections = Array.from(validationLoopSection?.subsections.keys() || []).filter(name =>
        REQUIRED_VALIDATION_LEVELS.some(level => name.startsWith(level.split(':')[0]))
      );

      expect(levelSubsections.length).toBe(4);
    });

    it('should detect bash code blocks in Validation Loop levels', () => {
      // ARRANGE
      const validPRPContent = readFileSync(VALID_PRP_PATH, 'utf-8');

      // ACT
      const structure = parsePRPStructure(validPRPContent);
      const validationLoopSection = structure.sections.get('Validation Loop');

      // ASSERT: Each level should have bash code blocks
      for (const levelName of REQUIRED_VALIDATION_LEVELS) {
        const matchingSubsection = Array.from(validationLoopSection?.subsections.keys() || []).find(name =>
          name.startsWith(levelName.split(':')[0])
        );

        expect(matchingSubsection).toBeDefined();

        const subsection = validationLoopSection?.subsections.get(matchingSubsection!);
        const hasBashBlock = subsection?.codeBlocks.some(block => block.language === 'bash');

        expect(hasBashBlock).toBe(true);
      }
    });

    it('should detect anti-patterns in Anti-Patterns section', () => {
      // ARRANGE
      const validPRPContent = readFileSync(VALID_PRP_PATH, 'utf-8');

      // ACT
      const structure = parsePRPStructure(validPRPContent);
      const antiPatternsSection = structure.sections.get('Anti-Patterns to Avoid');

      // ASSERT
      expect(antiPatternsSection).toBeDefined();

      // Accepts either ❌ emoji or **Don't** format
      const hasEmojiPattern = antiPatternsSection?.content.some(line => line.includes('❌'));
      const hasDontPattern = antiPatternsSection?.content.some(line =>
        line.match(/\*\*Don't\*\*/i) || line.match(/- \*\*/)
      );
      const hasAntiPattern = hasEmojiPattern || hasDontPattern;
      expect(hasAntiPattern).toBe(true);
    });
  });

  describe('missing required sections', () => {
    it('should detect missing Goal section', () => {
      // ARRANGE: Create PRP without Goal section
      const invalidPRP = `
## Why
- Business value

## What
### Success Criteria
- [ ] outcome
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Goal');
    });

    it('should detect missing Why section', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

## What
### Success Criteria
- [ ] outcome
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Why');
    });

    it('should detect missing What section', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

## Why
- Business value
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: What');
    });

    it('should detect missing All Needed Context section', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

## Why
- Business value

## What
### Success Criteria
- [ ] outcome
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: All Needed Context');
    });

    it('should detect missing Implementation Blueprint section', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

## Why
- Business value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Implementation Blueprint');
    });

    it('should detect missing Validation Loop section', () => {
      // ARRANGE: Minimal valid PRP missing Validation Loop
      const invalidPRP = `
## Goal

### Feature Goal
Build something

## Why
- Business value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

## Implementation Blueprint

### Data Models and Structure
Models here

## Final Validation Checklist

### Technical Validation
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Validation Loop');
    });

    it('should detect missing Final Validation Checklist section', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

## Why
- Business value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

## Implementation Blueprint

### Data Models and Structure
Models here

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Final Validation Checklist');
    });

    it('should detect missing Anti-Patterns to Avoid section', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

## Why
- Business value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

## Implementation Blueprint

### Data Models and Structure
Models here

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Anti-Patterns to Avoid');
    });
  });

  describe('missing required subsections', () => {
    it('should detect missing Feature Goal subsection', () => {
      // ARRANGE: Goal section without Feature Goal subsection
      const invalidPRP = `
## Goal

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
  why: reference
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Goal section missing required subsection: Feature Goal');
    });

    it('should detect missing Deliverable subsection', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Goal section missing required subsection: Deliverable');
    });

    it('should detect missing Success Definition subsection', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Goal section missing required subsection: Success Definition');
    });

    it('should detect missing Context Completeness Check subsection', () => {
      // ARRANGE
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'All Needed Context section missing required subsection: Context Completeness Check'
      );
    });

    it('should detect missing Success Criteria in What section', () => {
      // ARRANGE: What section without Success Criteria subsection
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
Just do it

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('What section missing required subsection: Success Criteria');
    });
  });

  describe('validation loop requirements', () => {
    it('should detect missing validation levels (less than 4)', () => {
      // ARRANGE: Validation Loop with only 2 levels
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Validation Loop must have 4 levels, found 2');
    });

    it('should warn when validation level missing bash code block', () => {
      // ARRANGE: Validation Loop with missing bash blocks
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
No bash block here

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should be valid (all 4 levels present) but with warning
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Level 1: Syntax & Style missing bash code block with commands');
    });
  });

  describe('anti-patterns requirements', () => {
    it('should detect missing anti-patterns (no ❌ emoji)', () => {
      // ARRANGE: Anti-Patterns section without ❌
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- Don't do this thing
- Avoid that other thing
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Anti-Patterns section must contain at least one anti-pattern (❌ or **Don\'t** format)');
    });

    it('should accept anti-patterns with ❌ emoji', () => {
      // ARRANGE: Minimal valid PRP with proper anti-patterns
      const validPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this thing
- ❌ Avoid that other thing
`;

      // ACT
      const structure = parsePRPStructure(validPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should be valid with proper anti-patterns
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('optional User Persona section', () => {
    it('should validate User Persona when present with all subsections', () => {
      // ARRANGE: PRP with complete User Persona section using ### subsections
      const validPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## User Persona

### Target User
Developer

### Use Case
Local development

### User Journey
Steps

### Pain Points Addressed
Pain

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(validPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should be valid with complete User Persona
      expect(result.valid).toBe(true);
      expect(structure.sections.has('User Persona')).toBe(true);
    });

    it('should detect missing User Persona subsections when section is present', () => {
      // ARRANGE: User Persona section without all required subsections
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## User Persona

### Target User
Developer

### Use Case
Local development

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should have errors for missing User Persona subsections
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('User Persona section missing required subsection: User Journey');
      expect(result.errors).toContain('User Persona section missing required subsection: Pain Points Addressed');
    });

    it('should allow PRP without User Persona section', () => {
      // ARRANGE: Minimal valid PRP without User Persona
      const validPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(validPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should be valid without User Persona (it's optional)
      expect(result.valid).toBe(true);
      expect(structure.sections.has('User Persona')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty PRP content', () => {
      // ARRANGE
      const emptyPRP = '';

      // ACT
      const structure = parsePRPStructure(emptyPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: All sections missing
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing required section: Goal');
    });

    it('should handle PRP with only metadata', () => {
      // ARRANGE
      const metadataOnlyPRP = `
**PRP ID**: P1.M1.T1.S1
**Work Item Title**: Test PRP
**Generated**: 2026-01-12
**Status**: Ready for Implementation

---

`;

      // ACT
      const structure = parsePRPStructure(metadataOnlyPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Metadata extracted but sections missing
      expect(structure.metadata?.prpId).toBe('P1.M1.T1.S1');
      expect(structure.metadata?.title).toBe('Test PRP');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Goal');
    });

    it('should handle PRP with sections but no subsections', () => {
      // ARRANGE
      const sectionsOnlyPRP = `
## Goal
Some content

## Why
- Some reason

## What
Some description

## All Needed Context
Context here

## Implementation Blueprint
Blueprint here

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist
Checklist here

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(sectionsOnlyPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should have errors for missing subsections
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Goal section missing required subsection: Feature Goal');
    });

    it('should handle nested code blocks correctly', () => {
      // ARRANGE: PRP with multiple code blocks in one subsection
      const prpWithNestedBlocks = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
  why: reference
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree output
\`\`\`

### Desired Codebase Tree
\`\`\`bash
desired tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas here
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: First task
Task 2: Second task
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
// First pattern
const pattern1 = 'value';

// Second pattern
const pattern2 = 'value';
\`\`\`

### Integration Points
\`\`\`yaml
DATABASE:
  - migration: "Create table"
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
command1
command2
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
test command
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
integration test
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
domain validation
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(prpWithNestedBlocks);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should be valid with multiple code blocks parsed correctly
      expect(result.valid).toBe(true);

      // Verify multiple code blocks in Implementation Patterns
      const blueprintSection = structure.sections.get('Implementation Blueprint');
      const patternsSubsection = blueprintSection?.subsections.get('Implementation Patterns & Key Details');
      expect(patternsSubsection?.codeBlocks.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle PRP with malformed markdown gracefully', () => {
      // ARRANGE: PRP with inconsistent markdown formatting
      const malformedPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

##Why
No space after hashes

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(malformedPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Malformed section name "Why" (no space) should not match
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Why');
    });

    it('should handle code blocks with various languages', () => {
      // ARRANGE: PRP with different code block languages
      const prpWithVariousLanguages = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`python
# Python code block
gotchas = "here"
\`\`\`

## Implementation Blueprint

### Data Models and Structure
\`\`\`typescript
interface Model {
  field: string;
}
\`\`\`

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

### Technical Validation
- [ ] done

### Feature Validation
- [ ] done

### Code Quality Validation
- [ ] done

### Documentation & Deployment
- [ ] done

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(prpWithVariousLanguages);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should detect different languages
      expect(result.valid).toBe(true);

      const contextSection = structure.sections.get('All Needed Context');
      const gotchasSubsection = contextSection?.subsections.get('Known Gotchas & Library Quirks');
      expect(gotchasSubsection?.codeBlocks.some(b => b.language === 'python')).toBe(true);

      const blueprintSection = structure.sections.get('Implementation Blueprint');
      const modelsSubsection = blueprintSection?.subsections.get('Data Models and Structure');
      expect(modelsSubsection?.codeBlocks.some(b => b.language === 'typescript')).toBe(true);
    });
  });

  describe('Final Validation Checklist subsections', () => {
    it('should detect missing Final Validation Checklist subsections', () => {
      // ARRANGE: Final Validation Checklist with missing subsections
      const invalidPRP = `
## Goal

### Feature Goal
Build something

### Deliverable
Something

### Success Definition
Done

## Why
- value

## What
### Success Criteria
- [ ] outcome

## All Needed Context

### Context Completeness Check
Complete

### Documentation & References
\`\`\`yaml
- file: test.md
\`\`\`

### Current Codebase Tree
\`\`\`bash
tree
\`\`\`

### Desired Codebase Tree
\`\`\`bash
tree
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`bash
gotchas
\`\`\`

## Implementation Blueprint

### Data Models and Structure
Models

### Implementation Tasks (Ordered by Dependencies)
\`\`\`yaml
Task 1: Do something
\`\`\`

### Implementation Patterns & Key Details
\`\`\`typescript
patterns
\`\`\`

### Integration Points
\`\`\`yaml
integrations
\`\`\`

## Validation Loop

### Level 1: Syntax & Style
\`\`\`bash
echo "test"
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
echo "test"
\`\`\`

### Level 3: Integration Testing
\`\`\`bash
echo "test"
\`\`\`

### Level 4: Creative & Domain-Specific
\`\`\`bash
echo "test"
\`\`\`

## Final Validation Checklist

Just some content without subsections

## Anti-Patterns to Avoid

- ❌ Don't do this
`;

      // ACT
      const structure = parsePRPStructure(invalidPRP);
      const result = validatePRPTemplate(structure);

      // ASSERT: Should have errors for missing Final Validation Checklist subsections
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Final Validation Checklist section missing required subsection: Technical Validation');
      expect(result.errors).toContain('Final Validation Checklist section missing required subsection: Feature Validation');
    });
  });
});
