# PRP Parsing Strategy

## Overview

This document outlines the strategy for parsing PRP markdown files to validate template structure compliance.

## PRP File Structure Analysis

### Sample PRP Structure

From `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md`:

```markdown
# Product Requirement Prompt (PRP): [Title]

**PRP ID**: P1.M1.T1.S1
**Work Item Title**: [Title]
**Generated**: 2026-01-12
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: [content]
**Deliverable**: [content]
**Success Definition**:
- [content]

## User Persona

**Target User**: [content]
**Use Case**: [content]
**User Journey**: [content]
**Pain Points Addressed**: [content]

## Why

- [content]
- [content]

## What

[content]

### Success Criteria

- [ ] [outcome]
- [ ] [outcome]

## All Needed Context

### Context Completeness Check

[content]

### Documentation & References

```yaml
[yaml content]
```

### Current Codebase tree

```bash
[content]
```

### Desired Codebase tree

```bash
[content]
```

### Known Gotchas of our codebase & Library Quirks

```python
[content]
```

## Implementation Blueprint

### Data models and structure

[content]

### Implementation Tasks (ordered by dependencies)

```yaml
[content]
```

### Implementation Patterns & Key Details

```python
[content]
```

### Integration Points

```yaml
[content]
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
[content]
```

### Level 2: Unit Tests (Component Validation)

```bash
[content]
```

### Level 3: Integration Testing (System Validation)

```bash
[content]
```

### Level 4: Creative & Domain-Specific Validation

```bash
[content]
```

## Final Validation Checklist

### Technical Validation

- [ ] [item]
- [ ] [item]

### Feature Validation

- [ ] [item]
- [ ] [item]

### Code Quality Validation

- [ ] [item]
- [ ] [item]

### Documentation & Deployment

- [ ] [item]
- [ ] [item]

---

## Anti-Patterns to Avoid

- ❌ [anti-pattern]
- ❌ [anti-pattern]
```

## Parsing Strategy

### Section Detection

1. **Primary Sections**: Look for `## Section Name` pattern
2. **Subsections**: Look for `### Subsection Name` pattern
3. **Metadata**: Parse frontmatter before first `##`

### Section Validation Rules

#### Required Sections (9 total)
1. Goal
2. User Persona (optional but validate if present)
3. Why
4. What
5. All Needed Context
6. Implementation Blueprint
7. Validation Loop
8. Final Validation Checklist
9. Anti-Patterns to Avoid

#### Required Subsections by Section

**Goal** (all required):
- Feature Goal
- Deliverable
- Success Definition

**User Persona** (if present, all required):
- Target User
- Use Case
- User Journey
- Pain Points Addressed

**All Needed Context** (all required):
- Context Completeness Check
- Documentation & References (must contain YAML block)
- Current Codebase tree (must contain bash block)
- Desired Codebase tree (must contain bash block)
- Known Gotchas (must contain code block)

**Implementation Blueprint** (all required):
- Data models and structure
- Implementation Tasks (must contain YAML block)
- Implementation Patterns & Key Details (must contain code block)
- Integration Points (must contain YAML block)

**Validation Loop** (all required):
- Level 1: Syntax & Style
- Level 2: Unit Tests
- Level 3: Integration Testing
- Level 4: Creative & Domain-Specific

**Final Validation Checklist** (all required):
- Technical Validation
- Feature Validation
- Code Quality Validation
- Documentation & Deployment

**Anti-Patterns to Avoid**:
- Must contain at least one anti-pattern (❌ format)

### Content Validation

#### YAML Block Validation
- Must be properly formatted (````yaml ... ````)
- For Documentation & References: must have url, file, or docfile entries

#### Code Block Validation
- Must be properly formatted with language specification
- For Implementation Patterns: should be Python or TypeScript

#### Checkbox Validation
- For Success Criteria: must have at least one checkbox
- For Final Validation Checklist: must have checkboxes in all subsections

#### Validation Loop Commands
- Each level must have bash code blocks
- Commands should be executable shell commands

## Test Fixtures

### Valid PRP Sample

Use `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md` as reference for valid PRP structure.

### Invalid PRP Scenarios to Test

1. Missing required section
2. Missing required subsection
3. Missing YAML blocks in required locations
4. Missing code blocks in required locations
5. Missing validation levels
6. Missing checkboxes in required locations
7. Empty sections

## Parser Implementation Considerations

### Line-by-Line Parsing Approach

```typescript
function parsePRP(content: string): PRPStructure {
  const lines = content.split('\n');
  const sections: Map<string, Section> = new Map();

  let currentSection: Section | null = null;
  let currentSubsection: string | null = null;
  let inCodeBlock = false;
  let codeBlockLanguage = '';

  for (const line of lines) {
    // Detect section headers
    if (line.startsWith('## ')) {
      currentSection = { name: line.slice(3), subsections: new Map() };
      sections.set(currentSection.name, currentSection);
      currentSubsection = null;
    }
    // Detect subsection headers
    else if (line.startsWith('### ')) {
      currentSubsection = line.slice(4);
      if (currentSection) {
        currentSection.subsections.set(currentSubsection, { content: [], codeBlocks: [] });
      }
    }
    // Detect code block start
    else if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
      } else {
        inCodeBlock = false;
        if (currentSection && currentSubsection) {
          currentSection.subsections.get(currentSubsection)?.codeBlocks.push({ language: codeBlockLanguage, content: [] });
        }
      }
    }
  }

  return { sections };
}
```

### Validation Approach

```typescript
function validatePRPStructure(structure: PRPStructure): ValidationResult {
  const errors: string[] = [];

  // Check required sections
  const requiredSections = ['Goal', 'Why', 'What', 'All Needed Context', 'Implementation Blueprint', 'Validation Loop', 'Final Validation Checklist', 'Anti-Patterns to Avoid'];
  for (const section of requiredSections) {
    if (!structure.sections.has(section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  // Check Goal subsections
  const goalSection = structure.sections.get('Goal');
  if (goalSection) {
    const requiredSubsections = ['Feature Goal', 'Deliverable', 'Success Definition'];
    for (const subsection of requiredSubsections) {
      if (!goalSection.subsections.has(subsection)) {
        errors.push(`Goal missing required subsection: ${subsection}`);
      }
    }
  }

  // Check Validation Loop has 4 levels
  const validationLoop = structure.sections.get('Validation Loop');
  if (validationLoop) {
    const requiredLevels = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
    for (const level of requiredLevels) {
      if (!Array.from(validationLoop.subsections.keys()).some(key => key.startsWith(level))) {
        errors.push(`Validation Loop missing: ${level}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

## Related Files

- `tests/fixtures/mock-delta-data.ts` - Mock data patterns
- `src/core/models.ts` - PRP type definitions
- `PROMPTS.md` - PRP template definition (lines 319-637)
