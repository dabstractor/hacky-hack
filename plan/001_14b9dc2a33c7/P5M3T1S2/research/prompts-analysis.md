# PRP Pipeline System Prompts Analysis

**Analysis Date:** 2026-01-13
**Source File:** /home/dustin/projects/hacky-hack/PROMPTS.md
**Purpose:** Comprehensive analysis of all system prompts used in the PRP Pipeline

---

## Executive Summary

The PRP (Product Requirement Prompt) Pipeline uses **11 distinct system prompts** organized around **4 core agent personas** (Architect, Researcher, Coder, QA) plus utility prompts for session management. The system is designed to transform traditional Product Requirements Documents (PRDs) into working code through a structured, multi-agent workflow with emphasis on **context completeness**, **progressive validation**, and **one-pass implementation success**.

---

## Table of All Prompts

| #   | Prompt Name                     | Agent/Persona       | Purpose                                           | Key Concepts                                                     |
| --- | ------------------------------- | ------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | PRP_README                      | Concept Definition  | Defines what a PRP is and how it differs from PRD | Context, Implementation Details, Validation Gates                |
| 2   | TASK_BREAKDOWN_SYSTEM_PROMPT    | Architect           | Breaks down PRDs into hierarchical task structure | Phase > Milestone > Task > Subtask, Research-Driven Architecture |
| 3   | TASK_BREAKDOWN_PROMPT           | Architect Execution | Orchestrates PRD analysis and task decomposition  | Spawn subagents, Store findings in $SESSION_DIR/architecture/    |
| 4   | PRP_CREATE_PROMPT               | Researcher          | Creates detailed PRPs for individual work items   | Codebase analysis, External research, Context curation           |
| 5   | PRP_EXECUTE_PROMPT              | Coder/Builder       | Executes PRPs to implement features               | One-pass implementation, Progressive validation (4 levels)       |
| 6   | CLEANUP_PROMPT                  | Utility             | Prepares workspace for git commit                 | File organization, Critical file preservation                    |
| 7   | DELTA_PRD_GENERATION_PROMPT     | Session Manager     | Creates delta PRDs for incremental changes        | Diff analysis, Reference completed work                          |
| 8   | TASK_UPDATE_PROMPT              | Session Manager     | Updates task hierarchy mid-implementation         | Impact analysis, Preserve completed work                         |
| 9   | PREVIOUS_SESSION_CONTEXT_PROMPT | Research Context    | Awareness of prior session research               | Leverage existing research, Avoid duplication                    |
| 10  | VALIDATION_PROMPT               | QA Agent            | Comprehensive project validation                  | E2E testing, User workflows, Validation script generation        |
| 11  | BUG_FINDING_PROMPT              | Adversarial QA      | Creative bug hunting against PRD scope            | Edge cases, Adversarial testing, Bug report generation           |

---

## The PRP Concept Definition

### What is a PRP?

**Product Requirement Prompt (PRP)** - A structured prompt that supplies an AI coding agent with everything it needs to deliver a vertical slice of working software—no more, no less.

### Core Philosophy

> _"Over-specifying what to build while under-specifying the context, and how to build it, is why so many AI-driven coding attempts stall at 80%."_

### PRP vs Traditional PRD

| Aspect                      | Traditional PRD         | PRP                                                |
| --------------------------- | ----------------------- | -------------------------------------------------- |
| **Goal & Justification**    | ✓ Included              | ✓ Included                                         |
| **How to Build**            | ❌ Deliberately avoided | ✓ Explicitly stated                                |
| **Context**                 | ❌ Minimal              | ✓ Precise file paths, content, library versions    |
| **Implementation Strategy** | ❌ Not specified        | ✓ API endpoints, test runners, agent patterns      |
| **Validation**              | ❌ Not specified        | ✓ Deterministic checks (pytest, ruff, type passes) |

### Three AI-Critical Layers

1. **Context**
   - Precise file paths and content
   - Library versions and library context
   - Code snippets examples
   - Usage of `ai_docs/` directory for documentation
   - LLMs generate higher-quality code with direct, in-prompt references

2. **Implementation Details and Strategy**
   - Explicitly states how the product will be built
   - API endpoints, test runners, agent patterns (ReAct, Plan-and-Execute)
   - Typehints, dependencies, architectural patterns
   - Tools to ensure code is built correctly

3. **Validation Gates**
   - Deterministic checks: pytest, ruff, static type passes
   - "Shift-left" quality controls catch defects early
   - Each new function should be individually tested
   - Validation gate = all tests pass

### Why Context is Non-Negotiable

- LLM outputs are bounded by context window
- Irrelevant or missing context literally squeezes out useful tokens
- "Garbage In → Garbage Out" applies doubly to agentic engineering
- Sloppy input yields brittle code

### In Short

> A PRP is **PRD + curated codebase intelligence + agent/runbook**—the minimum viable packet an AI needs to plausibly ship production-ready code on the first pass.

---

## Prompt Details by Agent

### 1. ARCHITECT AGENT

#### Prompt: TASK_BREAKDOWN_SYSTEM_PROMPT

**Role:** Lead Technical Architect and Project Management Synthesizer

**Hierarchy Created:**

```
Phase (Weeks to months)
  └─ Milestone (1 to 12 weeks)
      └─ Task (Days to weeks)
          └─ Subtask (0.5, 1, or 2 Story Points - Max 2 SP)
```

**Critical Constraints:**

1. **RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)**
   - VALIDATE BEFORE BREAKING DOWN: Cannot plan what you don't understand
   - SPAWN SUBAGENTS: Use tools to research codebase and external documentation first
   - REALITY CHECK: Verify PRD requests match current codebase state
   - PERSISTENCE: Store findings in `$SESSION_DIR/architecture/` for downstream PRP agents

2. **COHERENCE & CONTINUITY**
   - NO VACUUMS: Ensure architectural flow
   - EXPLICIT HANDOFFS: If Subtask A defines schema, Subtask B must consume it
   - STRICT REFERENCES: Reference specific file paths, variable names, API endpoints

3. **IMPLICIT TDD & QUALITY**
   - DO NOT create subtasks for "Write Tests"
   - IMPLIED WORKFLOW: Every subtask implies "Write failing test → Implement → Pass test"
   - DEFINITION OF DONE: Code is not complete without tests

4. **CONTEXT SCOPE BLINDER**
   - Every subtask's `context_scope` must be strict instructions for isolated developer
   - Define: INPUT, OUTPUT, MOCKING

**Output Format:**

- Must write JSON to `./$TASKS_FILE` (current working directory)
- Do NOT output JSON to conversation
- Use file writing tools to create the file

**Status Values:**

- Planned, Researching, Ready, Implementing, Complete, Failed

#### Prompt: TASK_BREAKDOWN_PROMPT

**Purpose:** Execution prompt that triggers the architect's workflow

**Process:**

1. Analyze the PRD
2. Spawn subagents immediately to research codebase state and external docs
3. Store high-level research findings in `$SESSION_DIR/architecture/`
4. Decompose project into JSON Backlog format
5. CRITICAL: Write JSON to `./$TASKS_FILE` using file writing tools

**Key Constraint:** Must create NEW file at `./$TASKS_FILE`, not search for existing ones

---

### 2. RESEARCHER AGENT

#### Prompt: PRP_CREATE_PROMPT

**Role:** Create comprehensive PRPs for individual work items

**Critical Understanding:**

- Executing AI agent only receives: PRP content, training data, codebase access
- **Incomplete context = implementation failure**
- Research and context curation directly determines success

**Research Process:**

1. **Codebase Analysis in Depth**
   - Search for similar features/patterns
   - Identify necessary files to reference
   - Note existing conventions
   - Check test patterns
   - Use batch tools to spawn subagents

2. **Internal Research at Scale**
   - Use plan/architecture directory information
   - Consider scope within overall PRD
   - Ensure cohesion across completed work items
   - Guard against harming future work items

3. **External Research at Scale**
   - Deep research online for similar features/patterns
   - Library documentation (include specific URLs)
   - Implementation examples (GitHub, StackOverflow, blogs)
   - Best practices and common pitfalls
   - Store research in work item's research/ subdirectory

4. **User Clarification**
   - Ask if testing framework not found
   - Halt if fundamental misalignment detected

**PRP Generation Process:**

1. **Review Template** - Use attached template structure
2. **Context Completeness Validation** - Apply "No Prior Knowledge" test
3. **Research Integration** - Transform findings into template sections
4. **Information Density Standards** - Ensure every reference is specific and actionable
5. **ULTRATHINK Before Writing** - Create comprehensive PRP writing plan

**Quality Gates:**

- Context Completeness Check
- Template Structure Compliance
- Information Density Standards

**Success Metrics:**

- Confidence Score: 1-10 for one-pass implementation success
- Validation: Enables unfamiliar AI agent to implement successfully

**Template Structure Includes:**

- Goal (Feature Goal, Deliverable, Success Definition)
- User Persona
- Why (Business value)
- What (User-visible behavior, Success Criteria)
- All Needed Context (Documentation, References, Codebase tree, Gotchas)
- Implementation Blueprint (Data models, Tasks, Patterns, Integration Points)
- Validation Loop (4 levels: Syntax/Style, Unit Tests, Integration, Creative)
- Final Validation Checklist
- Anti-Patterns to Avoid

---

### 3. CODER/BUILDER AGENT

#### Prompt: PRP_EXECUTE_PROMPT

**Role:** Transform PRPs into working code

**Mission:** One-Pass Implementation Success

**How PRPs Enable Success:**

- Context Completeness: Everything needed, nothing guessed
- Progressive Validation: 4-level gates catch errors early
- Pattern Consistency: Follow existing codebase approaches

**Execution Process:**

1. **Load PRP (CRITICAL FIRST STEP)**
   - Use Read tool to read PRP file at provided path
   - MUST read before doing anything else
   - Absorb all context, patterns, requirements
   - Use provided documentation references
   - Trust PRP's context and guidance
   - Do additional exploration if needed

2. **ULTRATHINK & Plan**
   - Create comprehensive implementation plan
   - Use TodoWrite tool for clear todos
   - Use subagents for parallel work (create PRP-inspired prompts for them)
   - Follow patterns referenced in PRP
   - Use specific file paths, class names, method signatures
   - Never guess - verify codebase patterns

3. **Execute Implementation**
   - Follow PRP's Implementation Tasks sequence
   - Use patterns and examples from PRP
   - Create files in specified locations
   - Apply naming conventions from PRP and CLAUDE.md

4. **Progressive Validation**
   - Level 1: Syntax & Style
   - Level 2: Unit Tests
   - Level 3: Integration Testing
   - Level 4: Domain-Specific Validation
   - **Each level must pass before proceeding**

5. **Completion Verification**
   - Work through Final Validation Checklist
   - Verify all Success Criteria met
   - Confirm Anti-Patterns avoided

**Failure Protocol:**

- Use patterns and gotchas from PRP to fix issues
- Re-run validation until passing
- If fundamental issue found, halt with 10th-grade-level explanation

**Output Format:**

```json
{
   "result": "success" | "error" | "issue",
   "message": "Detailed explanation"
}
```

---

### 4. QA AGENT

#### Prompt: VALIDATION_PROMPT

**Role:** Comprehensive project validation

**Process:**

**Step 0: Discover Real User Workflows**

- Read workflow documentation (README.md, CLAUDE.md, docs/)
- Identify external integrations (CLIs, APIs, services)
- Extract complete user journeys
- **E2E tests should mirror actual workflows, not just internal APIs**

**Step 1: Deep Codebase Analysis**

- What validation tools exist (linting, type checking, style, unit tests)
- What the application does (frontend, backend, database, infrastructure)
- Review planning documents (tasks.json, PRD)

**Step 2: Generate Validation Script**
Create `validate.sh` with phases (ONLY include phases that exist):

- Phase 1: Linting
- Phase 2: Type Checking
- Phase 3: Style Checking
- Phase 4: Unit Testing
- Phase 5: End-to-End Testing (BE CREATIVE AND COMPREHENSIVE)

**E2E Testing Three Levels:**

1. Internal APIs (adapters, database, commands)
2. External Integrations (CLIs, platform APIs)
3. Complete User Journeys (follow docs start-to-finish)

**Step 3: Validation & Reporting**

- Execute validation script
- Manually simulate workflows if needed
- Generate Bug Tracker Report (itemized list)

**Output:**

- Write validation script to `./validate.sh` (exact path)
- Write bug report to `./validation_report.md` (exact path)
- Files are temporary, deleted after validation

#### Prompt: BUG_FINDING_PROMPT

**Role:** Creative QA engineer and bug hunter

**Mission:** Rigorously test implementation against original PRD scope

**Phases:**

**Phase 1: PRD Scope Analysis**

- Deeply understand original PRD requirements
- Map requirements to what should be implemented
- Identify expected user journeys and workflows
- Note edge cases and corner cases

**Phase 2: Creative End-to-End Testing**

- Happy Path Testing
- Edge Case Testing (empty inputs, max values, unicode, special chars)
- Workflow Testing
- Integration Testing
- Error Handling
- State Testing
- Concurrency Testing (if applicable)
- Regression Testing

**Phase 3: Adversarial Testing**

- Unexpected Inputs
- Missing Features
- Incomplete Features
- Implicit Requirements
- User Experience Issues

**Phase 4: Documentation as Bug Report**
Write structured bug report to `./$BUG_RESULTS_FILE`

**Bug Report Format:**

```markdown
# Bug Fix Requirements

## Overview

Brief summary and quality assessment

## Critical Issues (Must Fix)

### Issue 1: [Title]

**Severity**: Critical
**PRD Reference**: [Section]
**Expected Behavior**: ...
**Actual Behavior**: ...
**Steps to Reproduce**: ...
**Suggested Fix**: ...

## Major Issues (Should Fix)

[Same format]

## Minor Issues (Nice to Fix)

[Same format]

## Testing Summary

- Total tests performed: X
- Passing: X
- Failing: X
- Areas with good coverage: [list]
- Areas needing more attention: [list]
```

**CRITICAL OUTPUT RULE:**

- **If Critical/Major bugs found**: MUST write to `./$BUG_RESULTS_FILE`
- **If NO Critical/Major bugs**: Do NOT write any file. Leave no trace.
- Presence/absence of file controls entire bugfix pipeline

---

## Session Management Prompts

### CLEANUP_PROMPT

**Purpose:** Clean up, organize files, and prepare for commit

**Critical Files to NEVER DELETE:**

- `$SESSION_DIR/tasks.json` - Pipeline state tracking
- `$SESSION_DIR/bug_hunt_tasks.json` - Bug fix pipeline state
- `$SESSION_DIR/prd_snapshot.md` - PRD snapshot
- `$SESSION_DIR/delta_from.txt` - Delta session linkage
- `PRD.md` - Product requirements document
- `$SESSION_DIR/TEST_RESULTS.md` - Bug report
- Any file matching `*tasks*.json` pattern

**Documentation Organization:**

- Move markdown docs to `$SESSION_DIR/docs/`
- Keep in root: README.md, PRD.md, core config files
- Never delete git-tracked files (check with `git ls-files`)

**Delete or Gitignore:**

- Temporary files
- Build artifacts
- Dependency directories
- Environment files

### DELTA_PRD_GENERATION_PROMPT

**Purpose:** Generate delta PRD from changes between sessions

**Inputs:**

- Previous PRD (from completed session)
- Current PRD
- Previous session's completed tasks
- Previous session's architecture research

**Instructions:**

1. DIFF ANALYSIS: Identify changes
2. SCOPE DELTA: Focus on new/modified/removed requirements
3. REFERENCE COMPLETED WORK: Reference existing implementations
4. LEVERAGE PRIOR RESEARCH: Check `$PREV_SESSION_DIR/architecture/`
5. OUTPUT: Write delta PRD to `$SESSION_DIR/delta_prd.md`

### TASK_UPDATE_PROMPT

**Purpose:** Update tasks for PRD changes mid-implementation

**Process:**

1. IDENTIFY CHANGES: new, modified, removed requirements
2. IMPACT ANALYSIS: Determine which tasks affected
3. PRIORITIZE UPDATES: Completed tasks get HIGHEST priority
4. UPDATE TASK HIERARCHY: Modify `$TASKS_FILE` in place
5. MAINTAIN COHERENCE: Ensure dependencies still valid

**Rules:**

- Preserve status of unaffected tasks
- Add new tasks for new requirements
- Mark obsolete tasks for removed requirements
- Completed parent task keeps status, new subtasks created

### PREVIOUS_SESSION_CONTEXT_PROMPT

**Purpose:** Awareness of prior session research

**Critical Guidance:**

- Documentation from previous sessions takes PRIORITY over web searches
- FIRST check `$PREV_SESSION_DIR/architecture/` for existing research
- FIRST check `$PREV_SESSION_DIR/docs/` for implementation notes
- Reference completed work instead of re-researching
- Only web search for genuinely NEW topics

---

## Key Gotchas and Important Notes

### From PRP_README

- Context is non-negotiable - missing context = failed implementation
- PRPs can be small (single task) or large (multiple tasks)
- True power is chaining tasks together for complex features

### From Architect Prompts

- **NEW PRIORITY: Research-Driven Architecture** - Cannot plan what you don't understand
- Must spawn subagents to validate before breaking down
- Store findings in `$SESSION_DIR/architecture/` for downstream agents
- Context scope must define INPUT, OUTPUT, MOCKING for each subtask
- Max subtask size is 2 Story Points
- Tests are implicit, don't create "write tests" subtasks

### From Researcher Prompt

- Incomplete context = implementation failure
- Optimize for chance of success, not speed
- Use batch tools to spawn subagents for parallel research
- Apply "No Prior Knowledge" test before writing PRP
- Store research in work item's research/ subdirectory
- All YAML references must be specific and accessible
- URLs should include section anchors

### From Coder Prompt

- **CRITICAL FIRST STEP**: Load PRP before doing anything
- Trust PRP's context and guidance
- Never guess - verify codebase patterns yourself
- Use TodoWrite tool for clear implementation plan
- Create PRP-inspired prompts for subagents
- Each validation level must pass before proceeding
- If fundamental issue, halt with 10th-grade-level explanation

### From QA Prompts

- E2E tests should mirror actual user workflows from docs, not just internal APIs
- Test three levels: Internal APIs, External Integrations, Complete Journeys
- Be creative and comprehensive in validation
- For bug finding: absence of file = success, presence = bugs found
- Bug report should be actionable as a PRD for fixes

### From Session Management

- NEVER delete files matching `*tasks*.json` pattern
- Check `git ls-files` before deleting anything
- Move docs to `$SESSION_DIR/docs/` before commit
- Previous session research takes priority over web searches

---

## Relationships Between Prompts and Agents

```
┌─────────────────────────────────────────────────────────────┐
│                    PRP PIPELINE FLOW                        │
└─────────────────────────────────────────────────────────────┘

PRD.md
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ ARCHITECT AGENT                                             │
│                                                              │
│ 1. TASK_BREAKDOWN_SYSTEM_PROMPT (System definition)        │
│ 2. TASK_BREAKDOWN_PROMPT (Execution trigger)               │
│                                                              │
│ Input: PRD                                                  │
│ Process:                                                    │
│   - Spawn subagents to research codebase                   │
│   - Validate PRD feasibility                               │
│   - Store findings in $SESSION_DIR/architecture/           │
│ Output: tasks.json (Phase > Milestone > Task > Subtask)    │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ RESEARCHER AGENT (for each subtask)                        │
│                                                              │
│ Prompt: PRP_CREATE_PROMPT                                   │
│                                                              │
│ Input: Work item (subtask)                                  │
│ Process:                                                    │
│   - Deep codebase analysis                                 │
│   - Internal research (architecture/)                      │
│   - External research (docs, examples)                     │
│   - User clarification if needed                           │
│ Output: PRP file for work item                             │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ CODER/BUILDER AGENT (for each PRP)                         │
│                                                              │
│ Prompt: PRP_EXECUTE_PROMPT                                  │
│                                                              │
│ Input: PRP file                                             │
│ Process:                                                    │
│   - Load and absorb PRP context                            │
│   - ULTRATHINK & plan implementation                       │
│   - Execute implementation tasks                           │
│   - Progressive validation (4 levels)                      │
│   - Verification against checklist                         │
│ Output: Working code + validation results                  │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ QA AGENTS                                                   │
│                                                              │
│ 1. VALIDATION_PROMPT (Comprehensive validation)            │
│ 2. BUG_FINDING_PROMPT (Adversarial QA)                     │
│                                                              │
│ Input: PRD + tasks.json + codebase                          │
│ Process:                                                    │
│   - Discover real user workflows                           │
│   - Generate validation script                             │
│   - Execute comprehensive testing                          │
│   - Creative bug hunting                                   │
│ Output: validate.sh + validation_report.md OR              │
│         bug_hunt_tasks.json (if bugs found)                │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ SESSION MANAGEMENT                                          │
│                                                              │
│ - CLEANUP_PROMPT (prepare for commit)                      │
│ - DELTA_PRD_GENERATION_PROMPT (if PRD changes)             │
│ - TASK_UPDATE_PROMPT (if mid-session PRD changes)          │
│ - PREVIOUS_SESSION_CONTEXT_PROMPT (awareness)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Template Structure (PRP_CREATE_PROMPT)

The base PRP template includes the following sections:

### 1. Goal

- Feature Goal (specific, measurable end state)
- Deliverable (concrete artifact)
- Success Definition (how to know it's complete)

### 2. User Persona (if applicable)

- Target User
- Use Case
- User Journey
- Pain Points Addressed

### 3. Why

- Business value and user impact
- Integration with existing features
- Problems solved and for whom

### 4. What

- User-visible behavior and technical requirements
- Success Criteria

### 5. All Needed Context

- Context Completeness Check ("No Prior Knowledge" test)
- Documentation & References (YAML format with URLs, files, gotchas)
- Current Codebase tree (tree output)
- Desired Codebase tree (files to add)
- Known Gotchas of codebase & Library Quirks

### 6. Implementation Blueprint

- Data models and structure
- Implementation Tasks (ordered by dependencies, YAML format)
- Implementation Patterns & Key Details
- Integration Points

### 7. Validation Loop

- Level 1: Syntax & Style (Immediate Feedback)
- Level 2: Unit Tests (Component Validation)
- Level 3: Integration Testing (System Validation)
- Level 4: Creative & Domain-Specific Validation

### 8. Final Validation Checklist

- Technical Validation
- Feature Validation
- Code Quality Validation
- Documentation & Deployment

### 9. Anti-Patterns to Avoid

---

## Validation System (4-Level Progressive)

### Level 1: Syntax & Style

- Ruff linting with auto-fix
- Mypy type checking
- Ruff formatting
- **Run after each file creation - fix before proceeding**

### Level 2: Unit Tests

- Test each component as created
- Full test suite for affected areas
- Coverage validation if available
- **All tests must pass**

### Level 3: Integration Testing

- Service startup validation
- Health check validation
- Feature-specific endpoint testing
- MCP server validation (if applicable)
- Database validation (if applicable)
- **All integrations working, no connection errors**

### Level 4: Creative & Domain-Specific

- Playwright MCP (web interfaces)
- Docker MCP (containerized services)
- Database MCP (data operations)
- Custom business logic validation
- Performance testing
- Security scanning
- Load testing
- **All creative validations pass, performance meets requirements**

---

## JSON Schema Reference

### tasks.json Structure

```json
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P[#]",
      "title": "Phase Title",
      "status": "Planned | Researching | Ready | Implementing | Complete | Failed | Obsolete",
      "description": "High level goal.",
      "milestones": [
        {
          "type": "Milestone",
          "id": "P[#].M[#]",
          "title": "Milestone Title",
          "status": "Planned",
          "description": "Key objective.",
          "tasks": [
            {
              "type": "Task",
              "id": "P[#].M[#].T[#]",
              "title": "Task Title",
              "status": "Planned",
              "description": "Feature definition.",
              "subtasks": [
                {
                  "type": "Subtask",
                  "id": "P[#].M[#].T[#].S[#]",
                  "title": "Subtask Title",
                  "status": "Planned",
                  "story_points": 1,
                  "dependencies": ["ID of prerequisite subtask"],
                  "context_scope": "CONTRACT DEFINITION:\n1. RESEARCH NOTE: ...\n2. INPUT: ...\n3. LOGIC: ...\n4. OUTPUT: ..."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Critical Environment Variables

- `$SESSION_DIR` - Session directory for current pipeline run
- `$TASKS_FILE` - Path to tasks.json file
- `$PRD_FILE` - Path to PRD.md
- `$BUG_RESULTS_FILE` - Path to bug hunt results
- `$PREV_SESSION_DIR` - Previous session directory (for delta sessions)

---

## Summary for User Guide Documentation

### What Users Need to Understand About PRPs

1. **PRPs are not PRDs** - PRPs include implementation details and context
2. **Context is everything** - Missing context = failed implementation
3. **Validation is progressive** - 4 levels must pass sequentially
4. **Research is mandatory** - All implementation is research-driven
5. **Tests are implicit** - Don't create "write tests" tasks

### How the 4 Agents Work Together

1. **Architect** - Breaks down PRD into hierarchy, validates feasibility
2. **Researcher** - Creates detailed PRPs with complete context
3. **Coder** - Executes PRPs to working code
4. **QA** - Validates implementation comprehensively

### Critical Success Factors

1. **Complete Context** - Every PRP must pass "No Prior Knowledge" test
2. **Pattern Consistency** - Follow existing codebase patterns
3. **Progressive Validation** - Each level must pass before next
4. **Research-Driven** - Validate before planning, research before implementing
5. **Session State** - Never delete tasks.json or research artifacts

### Common Pitfalls to Avoid

1. Skipping research phase
2. Incomplete context in PRPs
3. Not following existing patterns
4. Skipping validation levels
5. Deleting critical session files
6. Not testing like a real user
7. Creating "write tests" tasks (tests are implicit)

---

**Document Status:** Complete
**Next Steps:** Use this analysis to create user guide sections on:

1. How to write effective PRDs
2. Understanding the PRP concept
3. The 4-agent workflow
4. Best practices for each stage
