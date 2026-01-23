# Product Requirement Prompt (PRP): Create PRD Best Practices Guide

> Transform PRD into working code with complete context, clear objectives, and validation criteria

**Status**: Ready for Implementation
**Last Updated**: 2026-01-23
**Work Item**: P2.M1.T2.S3 - Create PRD best practices guide

---

## Goal

**Feature Goal**: Create a comprehensive PRD best practices guide (`docs/PRD_BEST_PRACTICES.md`) that covers PRD structure, writing clear requirements, defining testable success criteria, avoiding contradictions and ambiguity, using PRD Brainstormer for requirements gathering, and annotated examples

**Deliverable**: Documentation file `docs/PRD_BEST_PRACTICES.md` containing:
- PRD structure and essential sections
- Writing clear, testable requirements guidelines
- Defining success criteria and acceptance criteria
- Avoiding contradictions and ambiguity
- Using PRD Brainstormer for requirements gathering
- Example PRDs with annotations
- Common pitfalls and how to avoid them

**Success Definition**:
- A user can write a complete, testable PRD following this guide
- All essential PRD sections are documented with examples
- Clear guidelines for writing requirements with acceptance criteria
- Specific examples of good vs bad requirements
- Integration with PRD Brainstormer workflow explained
- Document follows patterns from docs/INSTALLATION.md, docs/CONFIGURATION.md, docs/CLI_REFERENCE.md, and docs/WORKFLOWS.md

## User Persona

**Target User**: Product manager, technical writer, or developer who needs to:
- Write comprehensive PRDs for the PRP Pipeline
- Understand what makes a good PRD
- Learn how to use the PRD Brainstormer agent
- Avoid common PRD pitfalls
- Create testable, unambiguous requirements

**Use Case**: User needs to write a PRD that will be processed by the PRP Pipeline. They need to understand:
- What sections to include in their PRD
- How to write clear, testable requirements
- How to define success criteria
- How to avoid contradictions
- How to use PRD Brainstormer for requirements gathering
- What good PRDs look like

**User Journey**:
1. User opens PRD_BEST_PRACTICES.md to learn PRD writing
2. User reads PRD structure section to understand required sections
3. User studies writing clear requirements guidelines
4. User learns about success criteria and acceptance criteria
5. User reviews common pitfalls to avoid
6. User studies annotated PRD examples
7. User writes their own PRD following the guidelines
8. User optionally uses PRD Brainstormer for requirements gathering

**Pain Points Addressed**:
- "What sections should I include in my PRD?" - PRD structure with examples
- "How do I write testable requirements?" - Clear requirements guidelines with templates
- "What makes a good requirement?" - Good vs bad examples
- "How do I avoid vague requirements?" - Specific language guidelines
- "How do I use PRD Brainstormer?" - PRD Brainstormer usage section
- "What does a complete PRD look like?" - Annotated examples from the codebase

## Why

- **PRD Quality Foundation**: Good PRDs are the foundation for successful autonomous development in the PRP Pipeline
- **One-Pass Implementation Success**: Well-written PRDs enable the pipeline to implement features correctly on the first attempt
- **Reduced Iteration**: Clear requirements minimize back-and-forth and rework
- **Testability**: Testable requirements enable automated validation
- **Consistency**: Standardized PRD format improves processing and understanding
- **Onboarding**: New users learn to write effective PRDs quickly
- **Integration**: Works with PRD Brainstormer for requirements gathering

## What

Create docs/PRD_BEST_PRACTICES.md with comprehensive PRD writing guidelines:

### Success Criteria

- [ ] File created at docs/PRD_BEST_PRACTICES.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents included with anchor links
- [ ] PRD structure section with all essential sections
- [ ] Writing clear requirements section with guidelines and templates
- [ ] Success criteria and acceptance criteria section
- [ ] Avoiding contradictions and ambiguity section
- [ ] PRD Brainstormer usage section
- [ ] Example PRDs with annotations
- [ ] Common pitfalls section with solutions
- [ ] Cross-references to related documentation
- [ ] All examples use codebase-specific formats

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:
- Exact PRD structure from the main PRD.md
- PRD Brainstormer prompt details from PRD.md Section 6.6
- PRD fixture examples from tests/fixtures/simple-prd.ts
- Complete documentation formatting patterns from existing docs
- External research on PRD best practices
- Integration context with parallel work item (P2.M1.T2.S2 WORKFLOWS.md)

### Documentation & References

```yaml
# MUST READ - PRD Brainstormer and PRD structure
- file: PRD.md
  why: Source of truth for PRD structure and PRD Brainstormer prompt
  pattern: Sections 1-6 show comprehensive PRD structure; Section 6.6 defines PRD Brainstormer
  gotcha: PRD Brainstormer is a planned feature (P3.M5) but should be documented

- file: tests/fixtures/simple-prd.ts
  why: Minimal valid PRD example showing hierarchical structure
  pattern: Phase > Milestone > Task > Subtask with context_scope CONTRACT DEFINITION
  gotcha: Shows CONTRACT DEFINITION format (RESEARCH NOTE, INPUT, LOGIC, OUTPUT)

- file: src/utils/prd-validator.ts
  why: PRD validation logic showing required sections
  pattern: Validates Executive Summary, Functional Requirements, User Workflows
  gotcha: Quality criteria include measurability, specificity, acceptance criteria

- file: docs/INSTALLATION.md
  why: Follow header format, section organization, troubleshooting pattern
  pattern: Document header (Status, Last Updated, Version), numbered sections, "What you see/Why/How to fix" pattern
  gotcha: Uses ** for bold emphasis on important variables/commands

- file: docs/CONFIGURATION.md
  why: Follow table formatting, quick reference section pattern
  pattern: Quick Reference table at top, detailed sections with tables
  gotcha: Environment variable names use ALL_CAPS with backticks

- file: docs/CLI_REFERENCE.md
  why: Reference for linking PRD best practices to CLI documentation
  pattern: Command examples, option tables, troubleshooting sections
  gotcha: Being implemented in parallel (P2.M1.T2.S1) - will exist when this PRP executes

- file: docs/WORKFLOWS.md
  why: Reference for linking PRD best practices to workflow documentation
  pattern: Workflow documentation with diagrams, phase breakdowns
  gotcha: Being implemented in parallel (P2.M1.T2.S2) - will exist when this PRP executes

- docfile: plan/003_b3d3efdaf0ed/P2M1T2S3/research/01_prd_brainstormer_prompt_analysis.md
  why: PRD Brainstormer prompt analysis from codebase
  section: Four-phase model, key rules, good PRD characteristics
  gotcha: Decision Ledger, linear questioning, testability requirements

- docfile: plan/003_b3d3efdaf0ed/P2M1T2S3/research/02_prd_fixture_examples.md
  why: PRD fixture examples showing minimal valid structure
  section: Hierarchical structure, subtask context scope, contract definition format
  gotcha: CONTRACT DEFINITION pattern (RESEARCH NOTE, INPUT, LOGIC, OUTPUT)

- docfile: plan/003_b3d3efdaf0ed/P2M1T2S3/research/03_documentation_patterns.md
  why: Internal research on existing documentation patterns
  section: Header format, table patterns, code block formatting, cross-reference linking
  gotcha: Contains exact formatting patterns to follow

- docfile: plan/003_b3d3efdaf0ed/P2M1T2S3/research/04_external_research_summary.md
  why: External research on PRD best practices
  section: PRD structure, writing requirements, success criteria, pitfalls, examples
  gotcha: Comprehensive industry best practices with templates and checklists
```

### Current Codebase Tree (relevant subset)

```bash
hacky-hack/
├── PRD.md                          # Main product requirements (PRD structure reference)
├── README.md                       # Project overview
├── docs/
│   ├── INSTALLATION.md             # Installation guide (header format, troubleshooting pattern)
│   ├── CONFIGURATION.md            # Configuration reference (table formatting, quick reference)
│   ├── QUICKSTART.md               # Quick start tutorial
│   ├── user-guide.md               # User guide with advanced usage
│   ├── CLI_REFERENCE.md            # CLI command reference (P2.M1.T2.S1 - parallel)
│   ├── WORKFLOWS.md                # Workflow documentation (P2.M1.T2.S2 - parallel)
│   └── PRD_BEST_PRACTICES.md       # TARGET FILE - TO BE CREATED
├── tests/
│   └── fixtures/
│       └── simple-prd.ts           # Minimal PRD example
└── src/
    └── utils/
        └── prd-validator.ts        # PRD validation logic
```

### Desired Codebase Tree with Files to be Added

```bash
hacky-hack/
├── docs/
│   ├── INSTALLATION.md             # (existing)
│   ├── CONFIGURATION.md            # (existing)
│   ├── QUICKSTART.md               # (existing)
│   ├── CLI_REFERENCE.md            # (existing - from P2.M1.T2.S1)
│   ├── WORKFLOWS.md                # (existing - from P2.M1.T2.S2)
│   └── PRD_BEST_PRACTICES.md       # NEW FILE - PRD writing guide
│       ├── Overview
│       ├── PRD Structure and Sections
│       │   ├── Executive Summary
│       │   ├── Problem Statement
│       │   ├── Goals & Success Metrics
│       │   ├── Target Audience & User Personas
│       │   ├── Functional Requirements
│       │   ├── Non-Functional Requirements
│       │   ├── User Experience & Design
│       │   ├── Technical Considerations
│       │   └── Assumptions, Dependencies & Constraints
│       ├── Writing Clear Requirements
│       │   ├── SMART Criteria
│       │   ├── User Story Template
│       │   ├── Given-When-Then Format
│       │   └── Avoiding Ambiguous Language
│       ├── Defining Success Criteria and Acceptance Criteria
│       │   ├── Product-Level Success Criteria
│       │   ├── Story-Level Acceptance Criteria
│       │   └── Definition of Done
│       ├── Avoiding Contradictions and Ambiguity
│       │   ├── Language Guidelines
│       │   ├── Glossary Creation
│       │   ├── Traceability Matrix
│       │   └── Cross-Referencing
│       ├── Using PRD Brainstormer
│       │   ├── What is PRD Brainstormer
│       │   ├── Four-Phase Model
│       │   ├── Decision Ledger
│       │   └── ├── Best Practices for Brainstormer
│       ├── Example PRDs with Annotations
│       │   ├── Minimal PRD (from simple-prd.ts)
│       │   ├── Full PRD (from PRD.md)
│       │   └── Good vs Bad Examples
│       ├── Common Pitfalls and How to Avoid Them
│       │   ├── 10 Common Pitfalls
│       │   ├── Pitfall Detection
│       │   └── Prevention Strategies
│       └── See Also
```

### Known Gotchas of Our Codebase & Library Quirks

```bash
# CRITICAL: PRD Brainstormer is a planned feature (P3.M5), not yet implemented
# Document it as a feature that will be available, not as currently available

# CRITICAL: The main PRD.md shows the hierarchical structure (Phase > Milestone > Task > Subtask)
# This is specific to the PRP Pipeline - standard PRDs may not use this structure

# CRITICAL: Subtasks include context_scope with CONTRACT DEFINITION
# Format: RESEARCH NOTE, INPUT, LOGIC, OUTPUT
# This is unique to the PRP Pipeline's task breakdown

# CRITICAL: PRD validation (src/utils/prd-validator.ts) requires specific sections
# Must include: Executive Summary, Functional Requirements, User Workflows

# CRITICAL: Documentation header format is consistent across all docs
# Must include: Status, Last Updated, Version

# CRITICAL: Cross-reference links use relative paths
# Use [CLI Reference](./CLI_REFERENCE.md) format

# CRITICAL: Table formatting follows established patterns
# Left-aligned columns, consistent spacing

# CRITICAL: The docs/INSTALLATION.md, docs/CONFIGURATION.md, docs/CLI_REFERENCE.md, docs/WORKFLOWS.md are the style guide
# Match header format, table formatting, section organization exactly

# CRITICAL: Use code blocks with language tags (bash, typescript, markdown, etc.)

# CRITICAL: "What you see/Why it happens/How to fix" pattern for troubleshooting
# Follow this pattern for any troubleshooting examples

# CRITICAL: The PRP Pipeline processes PRDs autonomously
# PRD quality directly affects implementation success

# CRITICAL: PRD Brainstormer uses a Four-Phase Model (Discovery, Interrogation, Convergence, Finalization)
# Document this process for when the feature is implemented
```

## Implementation Blueprint

### Document Structure

Create docs/PRD_BEST_PRACTICES.md following established documentation patterns:

```markdown
# PRD Best Practices

> Comprehensive guide for writing effective Product Requirements Documents (PRDs) for the PRP Pipeline. This document covers PRD structure, writing clear requirements, defining success criteria, avoiding pitfalls, and using PRD Brainstormer.

**Status**: Published
**Last Updated**: [DATE]
**Version**: 1.0.0

## Table of Contents

## Overview

## PRD Structure and Sections

## Writing Clear Requirements

## Defining Success Criteria and Acceptance Criteria

## Avoiding Contradictions and Ambiguity

## Using PRD Brainstormer

## Example PRDs with Annotations

## Common Pitfalls and How to Avoid Them

## See Also
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: PREPARE - Review existing documentation patterns
  - READ: docs/INSTALLATION.md for header format, section organization, troubleshooting
  - READ: docs/CONFIGURATION.md for table formatting, quick reference pattern
  - READ: docs/CLI_REFERENCE.md for linking patterns, troubleshooting format
  - READ: docs/WORKFLOWS.md for section organization (parallel context)
  - READ: PRD.md for PRD structure reference
  - READ: tests/fixtures/simple-prd.ts for minimal PRD example
  - EXTRACT: Document header template (Status, Last Updated, Version)
  - EXTRACT: Table formatting patterns (column alignment, spacing)
  - EXTRACT: "What you see/Why/How to fix" troubleshooting pattern

Task 2: CREATE - Document header and Overview section
  - CREATE: File docs/PRD_BEST_PRACTICES.md
  - ADD: Document header (Status: Published, Last Updated, Version: 1.0.0)
  - ADD: Brief description "Comprehensive guide for writing effective PRDs..."
  - ADD: Table of Contents with anchor links
  - ADD: Overview section explaining what a PRD is and why it matters
  - ADD: Brief mention of PRD Brainstormer (as planned feature)
  - FOLLOW: Pattern from docs/CONFIGURATION.md Quick Reference section

Task 3: WRITE - PRD Structure and Sections section
  - ADD: Section explaining essential PRD sections
  - INCLUDE: Executive Summary (1-2 paragraphs, high-level overview)
  - INCLUDE: Problem Statement (what problem, why important, pain points)
  - INCLUDE: Goals & Success Metrics (specific, measurable goals)
  - INCLUDE: Target Audience & User Personas (who are we building for)
  - INCLUDE: Functional Requirements (detailed feature specifications)
  - INCLUDE: Non-Functional Requirements (performance, security, scalability)
  - INCLUDE: User Experience & Design (user flows, UI/UX requirements)
  - INCLUDE: Technical Considerations (architecture, technology stack)
  - INCLUDE: Assumptions, Dependencies & Constraints
  - INCLUDE: Risk Assessment (potential risks, mitigation)
  - INCLUDE: Release Planning (phases, milestones)
  - INCLUDE: Open Questions (issues to resolve)
  - FORMAT: Numbered sections with clear descriptions

Task 4: WRITE - Writing Clear Requirements section
  - ADD: SMART Criteria for requirements (Specific, Measurable, Achievable, Relevant, Time-bound)
  - ADD: User Story Template (As a [user persona], I want [action], So that [benefit])
  - ADD: Given-When-Then Format for acceptance criteria
  - ADD: Table of "Avoid" vs "Use Instead" for ambiguous language
  - INCLUDE: Examples:
    - Bad: "Make it fast" vs Good: "responds in <200ms for 95% of requests"
    - Bad: "user-friendly" vs Good: "requires <3 clicks to complete task"
  - ADD: Acceptance Criteria template
  - ADD: Edge cases to consider
  - FORMAT: Tables for comparisons, code blocks for templates

Task 5: WRITE - Defining Success Criteria and Acceptance Criteria section
  - ADD: Product-Level Success Criteria (business, engagement, UX, support metrics)
  - ADD: Story-Level Acceptance Criteria with example
  - ADD: Definition of Done (DoD) checklist
  - INCLUDE: Example from codebase (annotated requirement with acceptance criteria)
  - ADD: Success Metrics Framework
  - FORMAT: Tables for metrics, checklists for DoD

Task 6: WRITE - Avoiding Contradictions and Ambiguity section
  - ADD: Language Guidelines (present tense, active voice, no jargon)
  - ADD: Glossary Creation template
  - ADD: Traceability Matrix template (Requirement, Feature, Test Case, Status)
  - ADD: Cross-Referencing guidelines
  - ADD: Automated Validation suggestions
  - INCLUDE: Example glossary from codebase concepts
  - FORMAT: Tables for glossary and traceability

Task 7: WRITE - Using PRD Brainstormer section
  - ADD: What is PRD Brainstormer (Requirements Interrogation Engine)
  - ADD: Four-Phase Model (Discovery, Interrogation, Convergence, Finalization)
  - ADD: Decision Ledger explanation (fact tracking)
  - ADD: Linear Questioning rule (no parallel questions)
  - ADD: Testability Requirements validation
  - ADD: Impossibility Detection for conflicts
  - INCLUDE: Note that PRD Brainstormer is planned for P3.M5
  - ADD: Best practices for using PRD Brainstormer when available
  - FORMAT: Numbered phases, bullet points for rules

Task 8: WRITE - Example PRDs with Annotations section
  - ADD: Minimal PRD Example (from tests/fixtures/simple-prd.ts)
  - ADD: Annotations explaining each part
  - ADD: Full PRD Example (from PRD.md - annotated sections)
  - ADD: Good vs Bad Requirements comparison table
  - INCLUDE: Specific examples from codebase
  - ADD: Annotations showing what makes each example good
  - FORMAT: Code blocks with inline comments, comparison tables

Task 9: WRITE - Common Pitfalls and How to Avoid Them section
  - ADD: 10 Common Pitfalls:
    1. Ambiguity and Vagueness
    2. Over-Specification (Solutioneering)
    3. Under-Specification
    4. Contradictions and Inconsistencies
    5. Ignoring the "Why"
    6. Unrealistic Timelines or Scope
    7. Lack of Stakeholder Alignment
    8. Ignoring Non-Functional Requirements
    9. Not Defining "Done"
    10. Writing Once and Never Updating
  - ADD: For each pitfall: Problem, Solution, Example
  - ADD: Pitfall Detection checklist
  - ADD: Prevention Strategies
  - FORMAT: Table with columns: Pitfall, Problem, Solution, Example

Task 10: WRITE - See Also section
  - ADD: Cross-references to related documentation
  - INCLUDE: CLI_REFERENCE.md (for running pipeline)
  - INCLUDE: WORKFLOWS.md (for understanding pipeline flow)
  - INCLUDE: INSTALLATION.md (for setup)
  - INCLUDE: CONFIGURATION.md (for environment variables)
  - INCLUDE: README.md (for project overview)
  - INCLUDE: PRD.md (for example of comprehensive PRD)
  - INCLUDE: user-guide.md (for advanced usage)
  - FORMAT: Unordered list with descriptive links

Task 11: VALIDATE - Review against success criteria
  - CHECK: Document header follows pattern
  - CHECK: All PRD sections documented with examples
  - CHECK: Writing clear requirements guidelines present
  - CHECK: Success criteria section present
  - CHECK: Avoiding pitfalls section present
  - CHECK: PRD Brainstormer usage explained
  - CHECK: Example PRDs annotated
  - CHECK: Cross-references link appropriately
  - CHECK: All examples use codebase-specific formats
  - CHECK: PRD Brainstormer noted as planned feature (P3.M5)
```

### Implementation Patterns & Key Details

```markdown
<!-- Header Pattern (from INSTALLATION.md) -->
# PRD Best Practices

> Comprehensive guide for writing effective Product Requirements Documents (PRDs) for the PRP Pipeline. This document covers PRD structure, writing clear requirements, defining success criteria, avoiding pitfalls, and using PRD Brainstormer.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

---

<!-- Overview Pattern -->
## Overview

A Product Requirements Document (PRD) is a **complete specification** of what needs to be built. The PRP Pipeline processes PRDs autonomously to generate working code, so **PRD quality directly affects implementation success**.

This guide covers:
- PRD structure and essential sections
- Writing clear, testable requirements
- Defining success criteria and acceptance criteria
- Avoiding contradictions and ambiguity
- Using PRD Brainstormer for requirements gathering (coming in P3.M5)
- Example PRDs with annotations
- Common pitfalls and how to avoid them

---

<!-- PRD Structure Section Pattern -->
## PRD Structure and Sections

A comprehensive PRD includes the following sections:

### 1. Executive Summary

**Purpose**: High-level overview of the product (1-2 paragraphs)

**Content**:
- What the product does
- Primary goals and success metrics
- Target audience

**Example**:
```markdown
## 1. Executive Summary

The **PRP (Product Requirement Prompt) Pipeline** is an agentic software development system designed to convert a high-level Product Requirements Document (PRD) into a fully implemented, tested, and polished codebase with minimal human intervention.

Unlike standard "coding agents" that drift and lose context, this pipeline uses a **structured, phase-based architecture**. It breaks large projects into atomic units, generates highly context-aware "Product Requirement Prompts" (PRPs) for every single task, and enforces rigorous validation loops.
```

---

<!-- Writing Clear Requirements Pattern -->
## Writing Clear Requirements

### SMART Criteria

Every requirement should be:

| Criterion | Description | Example |
|-----------|-------------|---------|
| **Specific** | Clear and unambiguous | "Users can log in with email and password" |
| **Measurable** | Quantifiable outcomes | "Login responds in <200ms for 95% of requests" |
| **Achievable** | Realistic given constraints | "Support 1,000 concurrent users" |
| **Relevant** | Aligned with business goals | "Reduces support tickets by 30%" |
| **Time-bound** | Clear timeline | "Available in Q2 2026" |

### User Story Template

```markdown
#### [Story ID]: [Story Title]

**As a** [user persona]
**I want** [specific action/feature]
**So that** [benefit/value]

**Acceptance Criteria:**
- [ ] Given [context], when [action], then [outcome]
- [ ] [specific criterion 2]
- [ ] [specific criterion 3]

**Story Points**: [estimate]
**Priority**: [Must/Should/Could]
```

### Avoiding Ambiguous Language

| Avoid | Use Instead |
|-------|-------------|
| "fast" | "responds in <200ms for 95% of requests" |
| "user-friendly" | "requires <3 clicks to complete task" |
| "scalable" | "handles 10,000 concurrent users" |
| "soon" | "within 5 seconds" |
| "good performance" | "<100ms response time (p95)" |

---

<!-- Success Criteria Pattern -->
## Defining Success Criteria and Acceptance Criteria

### Product-Level Success Criteria

| Category | Metrics | Example |
|----------|---------|---------|
| **Business** | Revenue, conversion, retention | "Increase conversion by 15%" |
| **Engagement** | DAU/MAU, session length | "Average session >5 minutes" |
| **UX** | Task completion, error rate | "95% task completion rate" |
| **Support** | Ticket volume, resolution | "Reduce tickets by 30%" |

### Story-Level Acceptance Criteria

```markdown
#### P1.M1.T1: User Authentication

**Acceptance Criteria:**
- [ ] Users can register with email and password
- [ ] Email validation requires @ symbol and domain
- [ ] Password must be at least 8 characters with 1 uppercase, 1 number
- [ ] Registration sends confirmation email
- [ ] Users can log in with registered credentials
- [ ] Failed login shows "Invalid credentials" message
- [ ] Session expires after 24 hours of inactivity
```

### Definition of Done (DoD)

- [ ] Code written and reviewed
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Acceptance criteria met
- [ ] No critical bugs
- [ ] Performance benchmarks met

---

<!-- PRD Brainstormer Pattern -->
## Using PRD Brainstormer

> **Note**: PRD Brainstormer is planned for **Phase 3, Milestone 5 (P3.M5)**. This section describes how it will work when implemented.

### What is PRD Brainstormer?

**PRD Brainstormer** is a "Requirements Interrogation and Convergence Engine" that helps create comprehensive PRDs through aggressive questioning rather than invention.

### Four-Phase Model

1. **Discovery**: Initial requirements gathering
2. **Interrogation**: Deep questioning to uncover gaps and ambiguities
3. **Convergence**: Consolidating answers into coherent specifications
4. **Finalization**: Final PRD generation with testability validation

### Key Features

- **Decision Ledger**: Tracks confirmed facts throughout the conversation
- **Linear Questioning**: No parallel questions that could invalidate each other
- **Testability Validation**: All specifications must have testability requirements
- **Impossibility Detection**: Identifies conflicting requirements

### Best Practices (when available)

- Start with a clear problem statement
- Answer questions as specifically as possible
- Request clarification if questions are ambiguous
- Review the Decision Ledger for accuracy
- Validate that all requirements have testability criteria

---

<!-- Example PRDs Pattern -->
## Example PRDs with Annotations

### Minimal PRD Example (from tests/fixtures/simple-prd.ts)

```markdown
# Test Project

A minimal project for fast E2E pipeline testing.

## P1: Test Phase

Validate pipeline functionality with minimal complexity.

### P1.M1: Test Milestone

Create a simple hello world implementation.

#### P1.M1.T1: Create Hello World

Implement a basic hello world function with tests.

##### P1.M1.T1.S1: Write Hello World Function

Create a simple hello world function.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Simple function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!"
4. OUTPUT: src/hello.ts with exported hello function
```

**Annotations**:
- Clear title and description
- Hierarchical structure (Phase > Milestone > Task > Subtask)
- Each subtask has story points, dependencies, status
- `context_scope` includes CONTRACT DEFINITION with RESEARCH NOTE, INPUT, LOGIC, OUTPUT

---

<!-- Common Pitfalls Pattern -->
## Common Pitfalls and How to Avoid Them

| Pitfall | Problem | Solution | Example |
|---------|---------|----------|---------|
| **Ambiguity and Vagueness** | "Make it fast" | Use specific metrics | "responds in <200ms" |
| **Over-Specification** | "Use React for frontend" | Focus on WHAT, not HOW | "Supports modern browsers" |
| **Under-Specification** | Missing edge cases | Cover all scenarios | Include error handling |
| **Contradictions** | "Always respond instantly" and "Must validate" | Review for conflicts | "Respond in <5s after validation" |
| **Ignoring the "Why"** | Requirements without context | Include problem statement | "Reduces support load" |
| **Unrealistic Timelines** | "Build in 2 weeks" | Break into phases | "Phase 1: MVP in 6 weeks" |
| **No Stakeholder Alignment** | Different understandings | Collaborative writing | Shared review process |
| **Ignoring NFRs** | Forgetting performance | Include NFRs section | "Handles 10k concurrent users" |
| **Not Defining "Done"** | Unclear completion | Definition of Done | DoD checklist |
| **Never Updating** | PRD becomes stale | Living document | Version control, changelog |

---

<!-- See Also Pattern -->
## See Also

- **[README.md](../README.md)** - Project overview and architecture
- **[CLI Reference](./CLI_REFERENCE.md)** - Command-line interface for running the pipeline
- **[Configuration Reference](./CONFIGURATION.md)** - Environment variables and configuration
- **[Installation Guide](./INSTALLATION.md)** - Setup instructions
- **[Workflows](./WORKFLOWS.md)** - Pipeline workflow documentation
- **[User Guide](./user-guide.md)** - Advanced usage patterns
- **[PRD.md](../PRD.md)** - Example of a comprehensive PRD
```

### Integration Points

```yaml
CLI_REFERENCE.md:
  - reference: "For running the pipeline with your PRD, see [CLI Reference](./CLI_REFERENCE.md)"
  - assume: User has written a PRD and wants to execute it
  - link: --prd option, --scope option, --validate-prd flag

WORKFLOWS.md:
  - reference: "For understanding how the pipeline processes PRDs, see [Workflows](./WORKFLOWS.md)"
  - assume: User wants to understand the PRD-to-code workflow
  - link: PRPPipeline workflow, Task Breakdown phase

INSTALLATION.md:
  - reference: "For setting up the development environment, see [Installation Guide](./INSTALLATION.md)"
  - assume: User needs to set up before running pipeline
  - link: Prerequisites, Installation steps

CONFIGURATION.md:
  - reference: "For configuring the pipeline, see [Configuration Reference](./CONFIGURATION.md)"
  - assume: User needs to set environment variables
  - link: ANTHROPIC_AUTH_TOKEN, model selection

user-guide.md:
  - reference: "For advanced usage patterns, see [User Guide](./user-guide.md)"
  - placement: See Also section
  - context: Beyond PRD writing to full pipeline usage

PRD.md:
  - reference: "For an example of a comprehensive PRD, see [PRD.md](../PRD.md)"
  - placement: Example PRDs section
  - context: Real-world PRD that defines the pipeline itself
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Check markdown syntax
npm run check-docs 2>/dev/null || echo "Verify markdown links are valid"

# Manual validation checklist
- [ ] All markdown links resolve (./, ../ paths correct)
- [ ] All code blocks have language tags (```bash, ```typescript)
- [ ] Table formatting is aligned (columns line up)
- [ ] No broken internal references (#anchors exist)
- [ ] Document follows established formatting patterns
- [ ] Document header follows pattern

# Validate table formatting
# Check that table columns are aligned and pipes are correct

# Expected: Zero formatting errors, all links valid, tables aligned
```

### Level 2: Link Validation (Connectivity)

```bash
# Verify all internal links resolve
grep -o '\[.*\](\./[^)]*)' docs/PRD_BEST_PRACTICES.md | while read link; do
  target=$(echo "$link" | sed 's/.*(\(.*\))/\1/');
  if [ ! -f "docs/$target" ] && [ ! -f "$target" ]; then
    echo "Broken link: $target";
  fi;
done

# Verify anchor links
grep -o '\[.*\](#[^)]*)' docs/PRD_BEST_PRACTICES.md | while read link; do
  anchor=$(echo "$link" | sed 's/.*(#\(.*\))/\1/');
  if ! grep -q "^##.*$anchor" docs/PRD_BEST_PRACTICES.md; then
    echo "Broken anchor: $anchor";
  fi;
done

# Expected: All links valid, all anchors resolve
```

### Level 3: Content Validation (Completeness)

```bash
# Manual content review checklist
- [ ] All PRD sections documented (Executive Summary, Functional Requirements, etc.)
- [ ] Writing clear requirements section present with SMART criteria
- [ ] Success criteria section present with examples
- [ ] Acceptance criteria template included
- [ ] Avoiding pitfalls section present with 10 common pitfalls
- [ ] PRD Brainstormer section explains four-phase model
- [ ] Example PRDs annotated (minimal and full)
- [ ] Good vs bad examples comparison table included
- [ ] Cross-references link to appropriate docs
- [ ] PRD Brainstormer noted as planned feature (P3.M5)

# Verify section count
grep -c "^## " docs/PRD_BEST_PRACTICES.md  # Should count all top-level sections

# Verify code blocks
grep -c "^```" docs/PRD_BEST_PRACTICES.md  # Should count all code blocks

# Expected: All content validation checks pass
```

### Level 4: Usability Validation (User Experience)

```bash
# Manual usability review checklist
- [ ] User can understand PRD structure from this document
- [ ] User can write a complete PRD following the guidelines
- [ ] Templates are clear and easy to use
- [ ] Examples are annotated and helpful
- [ ] Pitfalls section helps avoid common mistakes
- [ ] PRD Brainstormer usage is clear (as planned feature)
- [ ] Cross-references guide to related documentation
- [ ] New users can learn PRD writing systematically
- [ ] Document is approachable for non-technical users
- [ ] Code examples use PRP Pipeline-specific formats

# Test template usability
# Can someone copy a template and fill it out correctly?

# Expected: All usability validation checks pass
```

## Final Validation Checklist

### Technical Validation

- [ ] File created at docs/PRD_BEST_PRACTICES.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents with all sections and anchors
- [ ] All code blocks have syntax highlighting (```bash, ```typescript, etc.)
- [ ] All internal links use correct relative paths (./, ../)
- [ ] All external links are valid URLs
- [ ] Markdown syntax is valid (tables, lists, code blocks)
- [ ] Table columns are properly aligned
- [ ] No broken internal references (#anchors exist)

### Content Validation

- [ ] All PRD sections documented (Executive Summary, Problem Statement, Goals, etc.)
- [ ] Writing clear requirements section with SMART criteria
- [ ] User Story template provided
- [ ] Given-When-Then format explained
- [ ] Avoiding ambiguous language table included
- [ ] Success criteria section with examples
- [ ] Acceptance criteria template included
- [ ] Definition of Done checklist provided
- [ ] Avoiding contradictions section with guidelines
- [ ] PRD Brainstormer usage explained (four-phase model, Decision Ledger)
- [ ] PRD Brainstormer noted as planned feature (P3.M5)
- [ ] Example PRDs annotated (minimal from simple-prd.ts, full from PRD.md)
- [ ] Good vs bad requirements comparison table
- [ ] Common pitfalls section with 10 pitfalls and solutions
- [ ] Cross-references to CLI_REFERENCE.md, WORKFLOWS.md, etc.

### Documentation Pattern Compliance

- [ ] Header matches INSTALLATION.md and CONFIGURATION.md format
- [ ] Table formatting follows established patterns
- [ ] Code block language tags match content type
- [ ] Section organization follows logical flow
- [ ] Cross-references use consistent link format
- [ ] Tone matches existing documentation (professional, approachable)
- [ ] Overview section provides high-level introduction
- [ ] Examples are specific to the PRP Pipeline codebase

### Usability Validation

- [ ] User can understand PRD structure from this document
- [ ] User can write a complete PRD following the guidelines
- [ ] Templates are clear and easy to use
- [ ] Examples are annotated and helpful
- [ ] Pitfalls section helps avoid common mistakes
- [ ] PRD Brainstormer section is clear about feature status
- [ ] Cross-references guide to related documentation
- [ ] New users can learn PRD writing systematically
- [ ] Document is approachable for both technical and non-technical users
- [ ] Code examples use PRP Pipeline-specific formats (context_scope, CONTRACT DEFINITION)

---

## Anti-Patterns to Avoid

- [ ] Don't create new documentation patterns when existing ones work
- [ ] Don't use inconsistent header format (follow INSTALLATION.md exactly)
- [ ] Don't skip the PRD Brainstormer section (even as planned feature)
- [ ] Don't forget to annotate examples (explain what makes them good)
- [ ] Don't omit good vs bad comparisons (essential for learning)
- [ ] Don't use codebase-agnostic examples (use PRP Pipeline-specific ones)
- [ ] Don't skip the pitfalls section (critical for quality)
- [ ] Don't create broken internal links (verify all ./ and ../ paths)
- [ ] Don't forget to mention PRD Brainstormer is in P3.M5 (manages expectations)
- [ ] Don't use vague language in a best practices guide (practice what you preach)
- [ ] Don't omit the Definition of Done (critical for completion)
- [ ] Don't forget cross-references to WORKFLOWS.md and CLI_REFERENCE.md (parallel context)
- [ ] Don't use inconsistent table formatting (follow established patterns)
- [ ] Don't skip the CONTRACT DEFINITION format explanation (unique to PRP Pipeline)
- [ ] Don't document PRD Brainstormer as currently available (it's planned)
