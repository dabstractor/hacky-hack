# PRD Best Practices

> Comprehensive guide for writing effective Product Requirements Documents (PRDs) for the PRP Pipeline. This document covers PRD structure, writing clear requirements, defining success criteria, avoiding pitfalls, and using PRD Brainstormer.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

## Table of Contents

- [Overview](#overview)
- [PRD Structure and Sections](#prd-structure-and-sections)
  - [1. Executive Summary](#1-executive-summary)
  - [2. Problem Statement](#2-problem-statement)
  - [3. Goals & Success Metrics](#3-goals--success-metrics)
  - [4. Target Audience & User Personas](#4-target-audience--user-personas)
  - [5. Functional Requirements](#5-functional-requirements)
  - [6. Non-Functional Requirements](#6-non-functional-requirements)
  - [7. User Experience & Design](#7-user-experience--design)
  - [8. Technical Considerations](#8-technical-considerations)
  - [9. Assumptions, Dependencies & Constraints](#9-assumptions-dependencies--constraints)
  - [10. Risk Assessment](#10-risk-assessment)
  - [11. Release Planning](#11-release-planning)
  - [12. Open Questions](#12-open-questions)
- [Writing Clear Requirements](#writing-clear-requirements)
  - [SMART Criteria](#smart-criteria)
  - [User Story Template](#user-story-template)
  - [Given-When-Then Format](#given-when-then-format)
  - [Avoiding Ambiguous Language](#avoiding-ambiguous-language)
  - [Acceptance Criteria Template](#acceptance-criteria-template)
  - [Edge Cases to Consider](#edge-cases-to-consider)
- [Defining Success Criteria and Acceptance Criteria](#defining-success-criteria-and-acceptance-criteria)
  - [Product-Level Success Criteria](#product-level-success-criteria)
  - [Story-Level Acceptance Criteria](#story-level-acceptance-criteria)
  - [Definition of Done](#definition-of-done)
  - [Success Metrics Framework](#success-metrics-framework)
- [Avoiding Contradictions and Ambiguity](#avoiding-contradictions-and-ambiguity)
  - [Language Guidelines](#language-guidelines)
  - [Glossary Creation](#glossary-creation)
  - [Traceability Matrix](#traceability-matrix)
  - [Cross-Referencing](#cross-referencing)
  - [Automated Validation](#automated-validation)
- [Using PRD Brainstormer](#using-prd-brainstormer)
  - [What is PRD Brainstormer?](#what-is-prd-brainstormer)
  - [Four-Phase Model](#four-phase-model)
  - [Decision Ledger](#decision-ledger)
  - [Linear Questioning Rule](#linear-questioning-rule)
  - [Testability Requirements](#testability-requirements)
  - [Impossibility Detection](#impossibility-detection)
  - [Best Practices for Brainstormer](#best-practices-for-brainstormer)
- [Example PRDs with Annotations](#example-prds-with-annotations)
  - [Minimal PRD Example](#minimal-prd-example)
  - [Full PRD Example](#full-prd-example)
  - [Good vs Bad Requirements](#good-vs-bad-requirements)
- [Common Pitfalls and How to Avoid Them](#common-pitfalls-and-how-to-avoid-them)
  - [10 Common Pitfalls](#10-common-pitfalls)
  - [Pitfall Detection Checklist](#pitfall-detection-checklist)
  - [Prevention Strategies](#prevention-strategies)
- [See Also](#see-also)

---

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

### Why PRD Quality Matters

The PRP Pipeline uses AI agents to transform your PRD into working code. When requirements are unclear, ambiguous, or incomplete:
- Implementation agents make incorrect assumptions
- Validation gates fail unexpectedly
- Bug reports identify missing requirements
- Rework is required, increasing time and cost

**Well-written PRDs enable one-pass implementation success.**

---

## PRD Structure and Sections

A comprehensive PRD includes the following sections. Each section serves a specific purpose in guiding implementation.

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

### 2. Problem Statement

**Purpose**: Clearly articulate what problem you're solving and why it matters

**Content**:
- Current pain points
- Why existing solutions are inadequate
- Impact of not solving the problem

**Example**:
```markdown
## 2. Problem Statement

AI coding agents often fail at complex tasks due to context dilution. As projects grow, agents lose track of requirements, make invalid assumptions, and produce code that doesn't match expectations. There is no systematic way to maintain context fidelity throughout the development lifecycle.
```

### 3. Goals & Success Metrics

**Purpose**: Define specific, measurable objectives

**Content**:
- Primary goals (specific outcomes)
- Success metrics (quantifiable measures)
- Key performance indicators

**Example**:
```markdown
## 3. Goals & Success Metrics

**Primary Goals**:
- Enable autonomous code generation from PRDs
- Maintain context fidelity across complex projects
- Reduce human intervention in development lifecycle

**Success Metrics**:
- >80% of tasks complete without human revision
- PRD-to-code latency <24 hours for typical projects
- Bug density <0.5 bugs per KLOC
```

### 4. Target Audience & User Personas

**Purpose**: Define who will use the product

**Content**:
- Primary user personas
- User characteristics and needs
- User skill levels and contexts

**Example**:
```markdown
## 4. Target Audience & User Personas

**Primary Users**:
- Product Managers: Need to translate ideas into working code
- Technical Founders: Want to prototype quickly without hiring
- Development Teams: Seeking to accelerate feature delivery

**User Persona: "Product Paula"**
- Background: Product manager at B2B SaaS company
- Pain Points: Engineering backlog is 3+ months
- Goals: Ship features faster without sacrificing quality
- Technical Comfort: Comfortable with technical concepts, not a coder
```

### 5. Functional Requirements

**Purpose**: Detailed feature specifications (required by PRP validator)

**Content**:
- Feature breakdown with user stories
- Input/output specifications
- Functional behavior and constraints

**Example**:
```markdown
## 5. Functional Requirements

### 5.1 State & File Management
- **Must** maintain a `tasks.json` file as the single source of truth
- **Must** create a `plan/` directory structure: `plan/{sequence}_{hash}/`
- **Must** support "Smart Commit": Automatically staging changes while protecting pipeline state files
```

### 6. Non-Functional Requirements

**Purpose**: Performance, security, and quality attributes

**Content**:
- Performance requirements (latency, throughput)
- Security requirements (authentication, authorization)
- Scalability requirements
- Reliability/availability

**Example**:
```markdown
## 6. Non-Functional Requirements

### Performance
- PRD decomposition must complete within 120 seconds
- API request timeout: 60 seconds (configurable)
- Cache hit ratio target: >80%

### Security
- API tokens must be stored in environment variables only
- `.env` files must never be committed to version control
```

### 7. User Experience & Design

**Purpose**: Define how users interact with the system

**Content**:
- User workflows and journeys
- UI/UX requirements (if applicable)
- Accessibility considerations
- Error handling expectations

**Example**:
```markdown
## 7. User Experience & Design

### User Workflows
1. User provides PRD.md
2. System validates PRD structure
3. System generates task backlog
4. System executes tasks autonomously
5. User reviews completed implementation

### Error Handling
- Clear error messages with actionable suggestions
- Graceful degradation on partial failures
- State preservation for resumption
```

### 8. Technical Considerations

**Purpose**: Architectural and technical constraints

**Content**:
- Architecture decisions
- Technology stack
- Integration requirements
- Data models

**Example**:
```markdown
## 8. Technical Considerations

### Technology Stack
- **Runtime**: Node.js 20+ / TypeScript 5.2+
- **Core Framework**: Groundswell (local library)
- **LLM Provider**: z.ai (Anthropic compatible API)
- **State Management**: Groundswell `@ObservedState` & `Workflow` persistence

### Architecture
- Workflow orchestration via Groundswell
- Agent-based task execution
- Immutable session state
```

### 9. Assumptions, Dependencies & Constraints

**Purpose**: Document assumptions and external dependencies

**Content**:
- What we're assuming to be true
- External dependencies (APIs, libraries)
- Technical and business constraints

**Example**:
```markdown
## 9. Assumptions, Dependencies & Constraints

### Assumptions
- Users have Node.js 20+ installed
- Groundswell library is available via npm link
- z.ai API endpoint is accessible

### Dependencies
- Groundswell library (local, ~/projects/groundswell)
- Anthropic TypeScript SDK
- z.ai API endpoint

### Constraints
- Must use z.ai proxy endpoint (not production Anthropic API)
- Pipeline execution must be guarded against recursion
```

### 10. Risk Assessment

**Purpose**: Identify potential risks and mitigation strategies

**Content**:
- Technical risks
- Business risks
- Mitigation strategies

**Example**:
```markdown
## 10. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM API rate limits | High | Medium | Implement retry with exponential backoff |
| Context window overflow | High | Low | Use context compression and caching |
| PRD ambiguity | Medium | High | Validation checks and error messages |
```

### 11. Release Planning

**Purpose**: Define phases and milestones (optional but recommended)

**Content**:
- Development phases
- Milestones and deliverables
- Timeline estimates

### 12. Open Questions

**Purpose**: Track issues to be resolved

**Content**:
- Outstanding questions
- Decisions needed
- Blockers

---

## Writing Clear Requirements

Clear requirements are the foundation of successful implementation. This section provides frameworks and templates for writing requirements that AI agents can execute correctly.

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

**Context:**
[Additional background information]

**Acceptance Criteria:**
- [ ] Given [context], when [action], then [outcome]
- [ ] [specific criterion 2]
- [ ] [specific criterion 3]

**Edge Cases:**
- [edge case 1]
- [edge case 2]

**Dependencies:**
- [dependency 1]
- [dependency 2]

**Story Points**: [estimate]
**Priority**: [Must/Should/Could]
```

**Example**:
```markdown
#### P1.M1.T1: User Authentication

**As a** user
**I want** to log in with my email and password
**So that** I can access my personalized dashboard

**Acceptance Criteria:**
- [ ] Given a registered email, when user enters correct password, then user is logged in
- [ ] Given a registered email, when user enters incorrect password, then "Invalid credentials" message is shown
- [ ] Given an unregistered email, when user attempts login, then "Email not found" message is shown
- [ ] Session token expires after 24 hours of inactivity

**Story Points**: 8
**Priority**: Must
```

### Given-When-Then Format

The Given-When-Then format (from BDD) provides clear, testable acceptance criteria:

```gherkin
GIVEN a user is logged in
WHEN they click "Save"
THEN their changes are persisted to the database
AND a success message is displayed
```

**Template**:
```markdown
**Acceptance Criteria:**
- [ ] GIVEN [precondition/context], WHEN [action/trigger], THEN [expected outcome]
- [ ] GIVEN [context], WHEN [action], THEN [outcome] AND [additional outcome]
- [ ] WHEN [action], THEN [outcome] (implicit context)
```

### Avoiding Ambiguous Language

| Avoid | Use Instead | Why |
|-------|-------------|-----|
| "fast" | "responds in <200ms for 95% of requests" | "Fast" is subjective |
| "user-friendly" | "requires <3 clicks to complete task" | "User-friendly" is vague |
| "scalable" | "handles 10,000 concurrent users" | "Scalable" has no bounds |
| "soon" | "within 5 seconds" | "Soon" is not measurable |
| "good performance" | "<100ms response time (p95)" | "Good" is subjective |
| "appropriate" | "[specific behavior]" | "Appropriate" is context-dependent |
| "etc." | [list all items] | "Etc." implies completeness without specifying |
| "various" | [list specific types] | "Various" is not specific |

### Acceptance Criteria Template

```markdown
**Acceptance Criteria:**

**Functional Requirements:**
- [ ] [specific functional requirement 1]
- [ ] [specific functional requirement 2]
- [ ] [specific functional requirement 3]

**Non-Functional Requirements:**
- [ ] Performance: [metric]
- [ ] Security: [requirement]
- [ ] Accessibility: [requirement]

**Error Handling:**
- [ ] Given [error condition], when [action], then [error response]

**Edge Cases:**
- [ ] [edge case 1]
- [ ] [edge case 2]
- [ ] [edge case 3]
```

### Edge Cases to Consider

Always specify behavior for edge cases:

- **Empty/null input**: What happens when input is missing?
- **Boundary conditions**: Minimum, maximum, zero, negative values
- **Invalid data**: Malformed input, wrong types, encoding issues
- **Resource limits**: Out of memory, disk full, network timeout
- **Concurrency**: Simultaneous requests, race conditions
- **Error recovery**: How to recover from failures?

**Example**:
```markdown
**Edge Cases:**
- Empty email field → Show "Email is required" validation
- Email without @ symbol → Show "Invalid email format" validation
- Password < 8 characters → Show "Password must be at least 8 characters"
- Network timeout after 30s → Show "Request timed out, please try again"
- Session already exists → Terminate old session, create new one
```

---

## Defining Success Criteria and Acceptance Criteria

### Product-Level Success Criteria

| Category | Metrics | Example | How to Measure |
|----------|---------|---------|----------------|
| **Business** | Revenue, conversion, retention | "Increase conversion by 15%" | Analytics tracking |
| **Engagement** | DAU/MAU, session length, feature usage | "Average session >5 minutes" | Usage metrics |
| **UX** | Task completion, error rate, satisfaction | "95% task completion rate" | User testing |
| **Support** | Ticket volume, resolution time | "Reduce tickets by 30%" | Support metrics |

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
- [ ] Users can log out and are redirected to home

**Story Points**: 8
**Priority**: Must
```

### Definition of Done

A Definition of Done (DoD) checklist ensures consistent quality:

```markdown
**Definition of Done:**
- [ ] Code written and reviewed
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Acceptance criteria met
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Security review complete (if applicable)
```

### Success Metrics Framework

Define measurable metrics for each requirement:

```markdown
**Success Metrics:**

| Metric | Target | Measurement Method | Frequency |
|--------|--------|-------------------|-----------|
| Task completion rate | >90% | Automated tests | Per build |
| Response time (p95) | <200ms | Performance monitoring | Continuous |
| Bug density | <0.5/KLOC | Bug tracking | Per release |
| User satisfaction | >4.5/5 | User surveys | Quarterly |
```

---

## Avoiding Contradictions and Ambiguity

### Language Guidelines

- **Use present tense**: "System validates" not "System will validate"
- **Use active voice**: "Users can log in" not "Login can be performed by users"
- **Avoid jargon**: Define technical terms or use plain language
- **Use consistent terminology**: Use the same term throughout (e.g., always "user" not "user/customer/member")
- **Avoid subjective adjectives**: Replace "fast", "good", "appropriate" with specific metrics

### Glossary Creation

Define terms to ensure consistent understanding:

```markdown
## Glossary

| Term | Definition |
|------|------------|
| Session | A user's authenticated interaction with the system, bounded by login/logout |
| PRP | Product Requirement Prompt - a micro-PRD for a single task containing all context needed for implementation |
| Subtask | The smallest unit of work in the PRP Pipeline, containing a CONTRACT DEFINITION with INPUT/LOGIC/OUTPUT |
| Delta Session | A new session created when the PRD changes, preserving completed work from the parent session |
```

### Traceability Matrix

Track requirements from definition to implementation:

| Requirement | Feature | Test Case | Status |
|-------------|---------|-----------|--------|
| REQ-001: User Login | P1.M1.T1 | TC-101: Login Valid Credentials | Pass |
| REQ-002: Password Reset | P1.M1.T2 | TC-102: Password Reset Flow | Pass |
| REQ-003: Session Timeout | P1.M1.T3 | TC-103: Session Expiry | Pending |

### Cross-Referencing

Link related requirements and dependencies:

```markdown
**See Also:**
- Related to REQ-001 (User Login)
- Depends on REQ-005 (Database Schema)
- Conflicts with: None identified
- Overrides: Legacy authentication system (v1.0)
```

### Automated Validation

The PRP Pipeline includes automated PRD validation:

```bash
# Validate PRD structure
npm run dev -- --prd ./PRD.md --validate-prd
```

**Validation Checks:**
- File existence
- Content length (minimum 100 characters)
- Required sections present (Executive Summary, Functional Requirements, User Workflows)

---

## Using PRD Brainstormer

> **Note**: PRD Brainstormer is planned for **Phase 3, Milestone 5 (P3.M5)**. This section describes how it will work when implemented.

### What is PRD Brainstormer?

**PRD Brainstormer** is a "Requirements Interrogation and Convergence Engine" that helps create comprehensive PRDs through aggressive questioning rather than invention. Instead of guessing what you want, it asks targeted questions to uncover gaps and ambiguities.

### Four-Phase Model

1. **Discovery**: Initial requirements gathering
   - Brainstormer asks about your product vision
   - Identifies primary goals and target audience
   - Explores high-level feature concepts

2. **Interrogation**: Deep questioning to uncover gaps
   - Asks specific questions about each requirement
   - Probes edge cases and error conditions
   - Challenges vague or ambiguous statements

3. **Convergence**: Consolidating answers into specifications
   - Synthesizes your answers into structured requirements
   - Organizes requirements into PRD sections
   - Identifies relationships and dependencies

4. **Finalization**: Final PRD generation with validation
   - Generates complete PRD document
   - Validates testability of all requirements
   - Checks for contradictions and impossibilities

### Decision Ledger

PRD Brainstormer maintains a **Decision Ledger** throughout the conversation:

```markdown
## Decision Ledger

| Question | Answer | Confirmed |
|----------|--------|-----------|
| Who is the primary user? | Product managers at B2B SaaS companies | Yes |
| What is the max response time? | <200ms for 95% of requests | Yes |
| Should we support OAuth? | Not in v1, consider for v2 | Yes |
```

**Benefits:**
- Tracks confirmed facts
- Prevents circular questioning
- Provides audit trail of decisions
- Enables review and revision

### Linear Questioning Rule

PRD Brainstormer follows a **linear questioning rule**: no parallel questions that could invalidate each other.

**Bad (Parallel Questions):**
> "What should the timeout be? Should we support retry logic?"

**Good (Linear Questions):**
> "What should the timeout be?" → "30 seconds"
> "Given the 30-second timeout, should we support retry logic?" → "Yes, up to 3 retries"

### Testability Requirements

Every specification generated by PRD Brainstormer must have testability requirements:

```markdown
**Requirement**: Users can log in with email and password

**Testability**:
- Can verify via automated test: Yes
- Test case: "Given valid credentials, when login attempted, then redirect to dashboard"
- Measurable outcome: HTTP 302 redirect to /dashboard
```

### Impossibility Detection

PRD Brainstormer identifies conflicting requirements:

```markdown
**Conflict Detected**:
- Requirement A: "System must respond instantly"
- Requirement B: "System must perform complex validation"
- Resolution: Changed to "System must respond in <200ms after validation completes"
```

### Best Practices for Brainstormer

When PRD Brainstormer is available (P3.M5):

1. **Start with a clear problem statement**: Prepare a concise description of what you're building
2. **Answer as specifically as possible**: Vague answers lead to vague PRDs
3. **Request clarification if questions are ambiguous**: Don't guess at intent
4. **Review the Decision Ledger**: Ensure all facts are correct before finalizing
5. **Validate testability**: Ensure every requirement can be verified
6. **Consider edge cases**: Think about empty inputs, timeouts, and failures

---

## Example PRDs with Annotations

### Minimal PRD Example

The following is a minimal valid PRD from the codebase (`tests/fixtures/simple-prd.ts`):

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

**Annotations:**
- Clear title and description
- Hierarchical structure (Phase > Milestone > Task > Subtask)
- Each subtask has `story_points`, `dependencies`, `status`
- `context_scope` includes CONTRACT DEFINITION with:
  - `RESEARCH NOTE`: What to research
  - `INPUT`: What inputs are available
  - `LOGIC`: Implementation logic
  - `OUTPUT`: Expected output

### Full PRD Example

For a comprehensive PRD example, see the main [PRD.md](../PRD.md) file which defines the PRP Pipeline itself. Key sections include:

```markdown
# Product Requirements Document: Autonomous PRP Development Pipeline

## 1. Executive Summary
The **PRP (Product Requirement Prompt) Pipeline** is an agentic software development system...

## 2. Core Philosophy & Concepts
### 2.1 The "PRP" Concept
The central thesis is that AI fails at complex coding tasks due to context dilution...

## 3. System Architecture
The new system must implement four distinct processing engines...

## 4. User Workflows
### 4.1 Initialization & Breakdown
1. Input: User provides a `PRD.md`
2. State Check: System hashes the PRD...
```

### Good vs Bad Requirements

| Aspect | Bad Requirement | Good Requirement |
|--------|----------------|------------------|
| **Specificity** | "Make it fast" | "Responds in <200ms for 95% of requests" |
| **Measurability** | "Improve UX" | "Task completion rate >95%, error rate <5%" |
| **Completeness** | "User can log in" | "Users can log in with email/password, session expires after 24h" |
| **Context** | "Add caching" | "Cache API responses for 5 minutes to reduce load" |
| **Edge Cases** | "Handle errors" | "Show specific error messages: network timeout, invalid credentials, server error" |
| **Testability** | "System works well" | "All unit tests pass, integration tests cover 80%+ of code paths" |

**Bad Example:**
```markdown
## User Authentication
The system should have fast, user-friendly authentication that works well.
```

**Good Example:**
```markdown
## User Authentication

### P1.M1.T1: Email/Password Login

**As a** user
**I want** to log in with my email and password
**So that** I can access my personalized dashboard

**Acceptance Criteria:**
- [ ] Given valid email/password, when login submitted, then redirect to dashboard within 200ms
- [ ] Given invalid credentials, when login submitted, then show "Invalid email or password" message
- [ ] Given empty fields, when login submitted, then show "Email and password are required" validation
- [ ] Session expires after 24 hours of inactivity
- [ ] Failed login attempts are logged for security monitoring

**Performance:**
- Response time <200ms for 95% of requests
- Maximum 3 concurrent sessions per user

**Security:**
- Passwords hashed using bcrypt with salt rounds=10
- Session tokens are cryptographically signed
```

---

## Common Pitfalls and How to Avoid Them

### 10 Common Pitfalls

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

### Pitfall Detection Checklist

Before submitting your PRD to the pipeline:

- [ ] All requirements are specific (no "fast", "good", "appropriate")
- [ ] All requirements are measurable (include numbers/metrics)
- [ ] All requirements are testable (can write automated tests)
- [ ] Edge cases are covered (empty input, timeouts, failures)
- [ ] Non-functional requirements are included (performance, security)
- [ ] No contradictions exist (review conflicting requirements)
- [ ] Definition of Done is clear
- [ ] Dependencies are documented
- [ ] Problem statement explains "why"
- [ ] User personas are defined

### Prevention Strategies

1. **Use templates**: Follow the user story and acceptance criteria templates
2. **Peer review**: Have others review your PRD for clarity
3. **Automated validation**: Run `--validate-prd` to catch structural issues
4. **Iterative refinement**: Start with high-level requirements, then add detail
5. **Traceability**: Map requirements to features to test cases
6. **Version control**: Track PRD changes with git
7. **Examples**: Study good PRDs (like PRD.md) for patterns

---

## See Also

- **[README.md](../README.md)** - Project overview and architecture
- **[CLI Reference](./CLI_REFERENCE.md)** - Command-line interface for running the pipeline
- **[Configuration Reference](./CONFIGURATION.md)** - Environment variables and configuration
- **[Installation Guide](./INSTALLATION.md)** - Setup instructions
- **[Workflows](./WORKFLOWS.md)** - Pipeline workflow documentation
- **[User Guide](./user-guide.md)** - Advanced usage patterns
- **[PRD.md](../PRD.md)** - Example of a comprehensive PRD

**For PRD Validation:**
```bash
# Validate your PRD before running the pipeline
npm run dev -- --prd ./YOUR_PRD.md --validate-prd
```

**For Running Your PRD:**
```bash
# Run the pipeline with your PRD
npm run dev -- --prd ./YOUR_PRD.md

# Run with scope (start small)
npm run dev -- --prd ./YOUR_PRD.md --scope P1.M1

# Resume from previous session
npm run dev -- --prd ./YOUR_PRD.md --continue
```

---

**PRD Best Practices Guide Version**: 1.0.0
**Last Updated**: 2026-01-23
**For PRP Pipeline Version**: 0.1.0
