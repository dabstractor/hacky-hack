# PRP Template Structure Research

## Overview

This document contains the complete PRP template structure extracted from PROMPTS.md (lines 319-637) and system_context.md. This structure defines the required sections for PRP template validation.

## Required PRP Template Sections (9 total)

### 1. Goal (required)

**Required Subsections:**

- **Feature Goal**: [Specific, measurable end state of what needs to be built]
- **Deliverable**: [Concrete artifact - API endpoint, service class, integration, etc.]
- **Success Definition**: [How you'll know this is complete and working]

### 2. User Persona (if applicable) (optional but commonly present)

**Required Subsections:**

- **Target User**: [Specific user type - developer, end user, admin, etc.]
- **Use Case**: [Primary scenario when this feature will be used]
- **User Journey**: [Step-by-step flow of how user interacts with this feature]
- **Pain Points Addressed**: [Specific user frustrations this feature solves]

### 3. Why (required)

**Format**: Bullet points (dash-separated)

- [Business value and user impact]
- [Integration with existing features]
- [Problems this solves and for whom]

### 4. What (required)

**Content:** [User-visible behavior and technical requirements]

**Required Subsection:**

- **Success Criteria**: Checkbox list format
  - [ ] [Specific measurable outcomes]

### 5. All Needed Context (required)

**Required Subsections:**

#### Context Completeness Check

- Must validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

#### Documentation & References (YAML format)

```yaml
# MUST READ - Include these in your context window
- url: [Complete URL with section anchor]
  why: [Specific methods/concepts needed for implementation]
  critical: [Key insights that prevent common implementation errors]

- file: [exact/path/to/pattern/file.py]
  why: [Specific pattern to follow]
  pattern: [Brief description of what pattern to extract]
  gotcha: [Known constraints or limitations to avoid]

- docfile: [$SESSION_DIR/ai_docs/domain_specific.md]
  why: [Custom documentation for complex library/integration patterns]
  section: [Specific section if document is large]
```

#### Current Codebase Tree

- Empty bash section to be filled with actual `tree` command output

#### Desired Codebase Tree

- Empty bash section to be filled with proposed file additions

#### Known Gotchas of our codebase & Library Quirks

- Python code block format with CRITICAL comments

### 6. Implementation Blueprint (required)

**Required Subsections:**

#### Data models and structure

- Examples: orm models, pydantic models, pydantic schemas, pydantic validators

#### Implementation Tasks (ordered by dependencies) (YAML format)

```yaml
Task 1: CREATE src/models/{domain}_models.py
  - IMPLEMENT: {SpecificModel}Request, {SpecificModel}Response Pydantic models
  - FOLLOW pattern: src/models/existing_model.py (field validation approach)
  - NAMING: CamelCase for classes, snake_case for fields
  - PLACEMENT: Domain-specific model file in src/models/
```

#### Implementation Patterns & Key Details

- Python code block showing critical patterns and gotchas

#### Integration Points

- YAML format with DATABASE, CONFIG, ROUTES sections

### 7. Validation Loop (required)

**Required Structure: 4 Levels**

#### Level 1: Syntax & Style (Immediate Feedback)

- Bash commands for syntax checking
- Expected output: Zero errors

#### Level 2: Unit Tests (Component Validation)

- Bash commands for running unit tests
- Expected output: All tests pass

#### Level 3: Integration Testing (System Validation)

- Bash commands for integration testing
- Expected output: All integrations working

#### Level 4: Creative & Domain-Specific Validation

- Bash commands for domain-specific validation
- Expected output: All creative validations pass

### 8. Final Validation Checklist (required)

**Required Subsections:**

#### Technical Validation

- Checkbox list format
- Must include: All 4 validation levels completed, tests pass, no linting/type/formatting errors

#### Feature Validation

- Checkbox list format
- Must include: Success criteria met, manual testing, error handling, integration points

#### Code Quality Validation

- Checkbox list format
- Must include: Follows patterns, file placement, anti-patterns avoided, dependencies

#### Documentation & Deployment

- Checkbox list format
- Must include: Self-documenting code, informative logs, environment variables documented

### 9. Anti-Patterns to Avoid (required)

**Format:** Bullet points with ❌ symbols
**Required Anti-Patterns:**

- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them
- ❌ Don't use sync functions in async context
- ❌ Don't hardcode values that should be config
- ❌ Don't catch all exceptions - be specific

## Template Structure Requirements

### File Format

- Markdown syntax with proper section headers (## for main sections, ### for subsections)
- Code blocks use triple backticks with language specification
- YAML sections for structured data
- Checkbox lists for validation items (- [ ])

### Section Markers

- Sections start with ## (level 2 heading)
- Subsections start with ### (level 3 heading)
- Required subsections appear in specific order within each section

### Quality Gates

- Context completeness check (All Needed Context section)
- Template structure compliance (all 9 sections present)
- Information density standards (specific references, not generic)

## Validation Requirements

The Validation Loop is a critical component that must be followed exactly:

1. **Level 1**: Syntax and style checks (immediate feedback)
2. **Level 2**: Unit tests (component validation)
3. **Level 3**: Integration tests (system validation)
4. **Level 4**: Domain-specific validation (business logic)

Each level must pass before proceeding to the next, with the expectation of zero errors at each gate.

## Key Patterns for Parsing

### Section Detection Pattern

```regex
^##\s+(Goal|User Persona|Why|What|All Needed Context|Implementation Blueprint|Validation Loop|Final Validation Checklist|Anti-Patterns)
```

### Subsection Detection Pattern

```regex
^###\s+
```

### YAML Section Detection

````regex
^```yaml\s*$
````

### Code Block Detection

````regex
^```\w*\s*$
````

### Checkbox Detection

```regex
^-\s*\[\s*\]\s+
```

### Anti-Pattern Detection

```regex
^-\s*❌\s+
```
