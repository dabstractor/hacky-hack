# PRD Brainstormer Prompt Analysis

## Source: PRD.md Section 6.6

### Role
**Requirements Interrogation and Convergence Engine**

### Goal
Produce comprehensive PRDs through aggressive questioning rather than invention.

### Four-Phase Model

1. **Discovery**: Initial requirements gathering
2. **Interrogation**: Deep questioning to uncover gaps and ambiguities
3. **Convergence**: Consolidating answers into coherent specifications
4. **Finalization**: Final PRD generation with testability validation

### Key Rules

- **Decision Ledger**: Maintains a ledger for tracking confirmed facts
- **Linear Questioning**: No parallel questions that could invalidate each other
- **Testability Requirements**: All specifications must have testability requirements
- **Impossibility Detection**: Detects conflicting requirements

### Characteristics of Good PRDs (from codebase analysis)

1. **Clear Requirements** - No ambiguity, specific and measurable
2. **Testable Criteria** - Every requirement has validation criteria
3. **No Contradictions** - Requirements don't conflict with each other
4. **Structured Format** - Follows established PRD template
5. **Context-Rich** - Includes references to existing code, patterns, files

### PRD Structure (from PRD.md)

```markdown
# Product Requirements Document: [Project Name]

## 1. Executive Summary
## 2. Core Philosophy & Concepts
## 3. System Architecture
## 4. Functional Requirements
## 5. User Workflows
## 6. Critical Prompts & Personas (if applicable)
```

### PRD Validation (from src/utils/prd-validator.ts)

**Required Sections:**
- `## Executive Summary` (1-2 paragraphs)
- `## Functional Requirements`
- `## User Workflows`

**Quality Criteria:**
- Measurability (avoid vague terms)
- Specificity (use concrete metrics)
- Acceptance Criteria (clear, testable)
- Success Metrics (measurable outcomes)
- Context (existing code integration)
- Research-Driven (matches codebase reality)
