name: "P5.M3.T1.S2: Create Detailed User Guide"
description: |

---

## Goal

**Feature Goal**: Create a comprehensive `docs/user-guide.md` that serves as the definitive reference for users who want to understand and use all advanced features of the PRP Pipeline system beyond the basic introduction provided in README.md.

**Deliverable**:

1. New `docs/user-guide.md` file with comprehensive documentation covering:
   - Writing PRDs section (structure, best practices, examples)
   - Session management overview and best practices
   - Delta workflow guide with detailed examples
   - Scope-based execution examples and use cases
   - QA and bug hunt workflow documentation
   - Troubleshooting common issues (organized by symptom)
   - Performance tuning tips and optimization
   - Migration guide from v0 (bash version) to TypeScript implementation

2. All code examples are copy-paste runnable
3. All CLI commands match actual implementation
4. Clear navigation with table of contents
5. Cross-references to related documentation

**Success Definition**:

- All sections from the work item description are present and complete
- Content follows Diátaxis Framework (20% tutorials, 30% how-to, 20% explanation, 30% reference)
- All code examples are tested and runnable
- Documentation passes "No Prior Knowledge" test for each section
- Zero broken internal or external links
- Troubleshooting section organized by symptom (not internal cause)
- Migration guide provides clear before/after comparisons

## User Persona

**Target User**: Developers and technical project managers who have read the README.md and want to:
- Write their own PRDs for the pipeline
- Understand advanced features like delta sessions and scope-based execution
- Troubleshoot common issues
- Migrate from the bash version (v0) to the TypeScript implementation
- Optimize pipeline performance

**Use Case**: A user has successfully run the basic pipeline and now wants to:
1. Write a custom PRD for their project
2. Use delta sessions to handle changing requirements
3. Run specific portions of their project with scoped execution
4. Debug issues that arise during execution
5. Optimize performance for large projects

**User Journey**:

1. User completes Quick Start from README.md
2. User wants to write their own PRD → reads "Writing PRDs" section
3. User modifies their PRD → reads "Delta Workflow" section
4. User encounters an error → goes to "Troubleshooting" section
5. User wants to run only a milestone → reads "Scope-Based Execution" section
6. User migrated from bash version → reads "Migration Guide" section

**Pain Points Addressed**:

- **"How do I write a PRD?"** - Comprehensive PRD writing guide with examples
- **"What happens when I change the PRD?"** - Delta session documentation
- **"Something broke, what do I do?"** - Symptom-based troubleshooting
- **"This is slow, how do I fix it?"** - Performance tuning guide
- **"I used the bash version, what's different?"** - Migration guide

## Why

- **Deepens Understanding**: Users who understand the "why" are more effective
- **Reduces Support Burden**: Comprehensive documentation answers questions before they're asked
- **Enables Advanced Usage**: Delta sessions, scoped execution, and QA workflows are powerful but complex
- **Smooths Migration**: Migration guide reduces friction for bash version users
- **Builds Confidence**: Troubleshooting guides help users recover from errors

## What

Create `docs/user-guide.md` with comprehensive documentation for advanced features.

### Success Criteria

- [ ] Writing PRDs section with structure, best practices, and example PRD
- [ ] Session management overview explaining sessions, persistence, and state
- [ ] Delta workflow guide with step-by-step examples
- [ ] Scope-based execution examples for all scope types (phase, milestone, task, subtask)
- [ ] QA and bug hunt workflow documentation
- [ ] Troubleshooting section organized by symptom with solutions
- [ ] Performance tuning tips covering caching, batching, and research-ahead
- [ ] Migration guide from v0 (bash) to TypeScript with before/after comparisons
- [ ] Table of contents with working anchor links
- [ ] All code examples tested and runnable
- [ ] All CLI commands match src/cli/index.ts implementation

---

## All Needed Context

### Context Completeness Check

_An implementing agent has everything needed: comprehensive research on user guide best practices, codebase structure, PRD and architecture documentation, prompts analysis, and the previous PRP (P5.M3.T1.S1) for README context._

### Documentation & References

```yaml
# MUST READ - User Guide Best Practices Research
- file: plan/001_14b9dc2a33c7/P5M3T1S2/research/user-guide-research.md
  why: Industry best practices for user guide structure, writing style, code examples, troubleshooting, and migration guides
  section: All sections - comprehensive research document (1200+ lines)
  critical: Contains Diátaxis Framework, progressive disclosure model, and troubleshooting patterns
  gotcha: Apply the "three-click rule" - users find info in 3 clicks or less

# MUST READ - Prompts Analysis
- file: plan/001_14b9dc2a33c7/P5M3T1S2/research/prompts-analysis.md
  why: Complete understanding of all 11 system prompts and 4 agent personas
  section: "Summary for User Guide Documentation" section
  critical: Contains PRP concept definition, agent workflow diagram, and common pitfalls
  gotcha: The "Research-Driven Architecture" is a NEW PRIORITY - emphasize this

# MUST READ - System Architecture
- docfile: plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Complete architecture overview for session management and system components
  section: All headings h2.0 through h2.9
  critical: Contains directory structures, data models, and workflow descriptions
  gotcha: The 4-level task hierarchy (Phase > Milestone > Task > Subtask) is key

# MUST READ - Master PRD
- file: PRD.md
  why: Source of truth for all system features and workflows
  section: All sections - particularly Section 2 (Core Philosophy), Section 4 (User Workflows), Section 6 (Critical Prompts)
  critical: Contains the authoritative description of delta sessions, QA workflows, and execution loops
  gotcha: PRD is comprehensive - use it as the source of truth for feature descriptions

# MUST READ - System Prompts
- file: PROMPTS.md
  why: Understanding of the 4 agent personas and prompt engineering
  section: PRP_README (PRP concept), TASK_BREAKDOWN_SYSTEM_PROMPT (Architect), PRP_CREATE_PROMPT (Researcher), PRP_EXECUTE_PROMPT (Coder)
  critical: PRP_README section defines what a PRP is and why context matters
  gotcha: Tests are implicit - don't create "write tests" tasks

# MUST READ - Previous README PRP (Parallel Context)
- docfile: plan/001_14b9dc2a33c7/P5M3T1S1/PRP.md
  why: Understanding what the README.md contains to avoid duplication
  section: "Goal" section (what README covers)
  critical: README covers Quick Start, Features, Usage Examples, Architecture, Contributing
  gotcha: User guide should build upon README, not repeat basic setup

# MUST READ - Task Orchestrator Implementation
- file: src/core/task-orchestrator.ts
  why: Understanding scope-based execution implementation
  pattern: Scope parsing (ScopeResolver), executeScope(), dependency resolution
  section: Methods for scope execution and task iteration
  critical: Actual scope syntax: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1
  gotcha: Scope is case-sensitive - use exact format

# MUST READ - Session Manager Implementation
- file: src/core/session-manager.ts
  why: Understanding session persistence, delta detection, and state management
  pattern: initializeSession(), createDeltaSession(), PRD snapshotting
  section: Session initialization and delta detection methods
  critical: Sessions stored in plan/{sequence}_{hash}/, tasks.json is single source of truth
  gotcha: Never delete tasks.json or PRD snapshot during cleanup

# MUST READ - CLI Implementation
- file: src/cli/index.ts
  why: Actual CLI command definitions - all examples must match
  pattern: Commander.js option definitions with .option(), .argument()
  section: All option definitions (--prd, --scope, --mode, --continue, --dry-run, --verbose, --no-cache)
  critical: Documentation must match actual CLI behavior exactly
  gotcha: Use -- separator for npm scripts: npm run dev -- [options]

# MUST READ - Bug Hunt Workflow
- file: src/workflows/bug-hunt-workflow.ts
  why: Understanding QA bug hunt implementation for documentation
  pattern: BugHuntWorkflow class, TEST_RESULTS.md generation
  section: Main workflow execution and bug reporting
  critical: Bug hunt runs adversarial testing, generates report only if bugs found
  gotcha: Absence of TEST_RESULTS.md means success (no critical bugs)

# MUST READ - Delta Analysis Workflow
- file: src/workflows/delta-analysis-workflow.ts
  why: Understanding delta session implementation for documentation
  pattern: DeltaAnalysisWorkflow class, PRD diffing, task patching
  section: Delta PRD generation and task update logic
  critical: Delta sessions link via delta_from.txt, preserve completed work
  gotcha: Delta focuses only on changes - new, modified, removed requirements

# MUST READ - Research Queue (Performance)
- file: src/core/research-queue.ts
  why: Understanding parallel research for performance tuning section
  pattern: ResearchQueue class, background research, promise deduplication
  section: Queue management and background task execution
  critical: Parallel research = N+1 pattern (research next task while current executes)
  gotcha: Fire-and-forget requires .catch() to prevent unhandled rejections

# MUST READ - Performance Features Documentation
- docfile: plan/001_14b9dc2a33c7/docs/README.md
  why: Understanding implemented performance optimizations
  section: "Key Findings" - background processing, Promise.all vs Promise.allSettled, anti-patterns
  critical: PRP caching (P5.M2.T1.S2), I/O batching (P5.M2.T2.S1), parallel research
  gotcha: These are NEW features in TypeScript version - not in bash version

# REFERENCE - Diátaxis Framework
- url: https://documentation.divio.com/
  why: Industry-standard documentation structure (Tutorials, How-To, Explanation, Reference)
  section: Diátaxis Framework overview
  critical: Balance: 20% tutorials, 30% how-to, 20% explanation, 30% reference
  gotcha: User guide should lean toward how-to and reference (tutorials are in README)

# REFERENCE - Google Developer Documentation Style Guide
- url: https://developers.google.com/tech-writing/one
  why: Industry-standard writing style guidelines
  section: Voice and tone, clarity principles, addressing the user
  critical: Use active voice, second person ("you"), one idea per sentence
  gotcha: Be direct: "Run this command" not "You should run this command"

# REFERENCE - Vue 3 Migration Guide (Example)
- url: https://v3-migration.vuejs.org/
  why: Excellent example of migration guide structure
  section: Breaking changes format, side-by-side comparisons, rollback procedures
  critical: Shows before/after code comparisons with explanations
  gotcha: Always provide rollback procedures in migration guides

# REFERENCE - Docker Troubleshooting (Example)
- url: https://docs.docker.com/engine/troubleshooting/
  why: Excellent example of symptom-based troubleshooting organization
  section: Common issues organized by what users see
  critical: Organize by symptom, not internal cause
  gotcha: Provide quick diagnostics and debug mode instructions
```

### Current Codebase Tree

```bash
# Project Root Structure
hacky-hack/
├── PRD.md                   # Reference: Master requirements document
├── PROMPTS.md               # Reference: 11 system prompts and PRP concept
├── README.md                # Reference: Basic documentation (Quick Start, Features, Usage)
├── package.json             # Reference: Scripts, version, metadata
├── docs/                    # CREATE: user-guide.md in this directory
├── src/
│   ├── cli/index.ts         # Reference: CLI implementation for accurate examples
│   ├── core/
│   │   ├── session-manager.ts    # Reference: Session management implementation
│   │   ├── task-orchestrator.ts  # Reference: Scope-based execution
│   │   ├── prd-differ.ts         # Reference: PRD diffing for delta sessions
│   │   └── research-queue.ts     # Reference: Parallel research implementation
│   ├── agents/
│   │   ├── agent-factory.ts       # Reference: 4 agent types
│   │   ├── prp-generator.ts       # Reference: PRP creation (Researcher agent)
│   │   └── prp-executor.ts        # Reference: PRP execution (Coder agent)
│   └── workflows/
│       ├── prp-pipeline.ts        # Reference: Main pipeline workflow
│       ├── delta-analysis-workflow.ts  # Reference: Delta session implementation
│       └── bug-hunt-workflow.ts   # Reference: QA bug hunt workflow
└── plan/
    └── 001_14b9dc2a33c7/
        ├── architecture/system_context.md  # Reference: Architecture overview
        └── docs/README.md                   # Reference: Research documentation
```

### Desired Codebase Tree

```bash
# New files to create:
docs/
└── user-guide.md           # CREATE: Comprehensive user guide (this PRP)

# Research artifacts (already created):
plan/001_14b9dc2a33c7/P5M3T1S2/
└── research/
    ├── user-guide-research.md     # User guide best practices (1200+ lines)
    ├── prompts-analysis.md        # System prompts analysis (780+ lines)
    └── (stored during PRP creation)
```

### Known Gotchas & Library Quirks

```markdown
# CRITICAL: User Guide Documentation Gotchas

# 1. PRD vs PRP Concept Distinction
# - PRD = Product Requirements Document (user writes)
# - PRP = Product Requirement Prompt (system generates from tasks)
# - PRD describes WHAT to build, PRP describes HOW with context
# Gotcha: Users often confuse these - clearly distinguish in documentation

# 2. Tests Are Implicit
# - Do NOT create "write tests" subtasks in PRDs
# - Tests are part of every subtask's workflow
# - Pattern: Write failing test → Implement → Pass test → Refactor
# Gotcha: This is a key architectural decision - emphasize it

# 3. Research-Driven Architecture (NEW PRIORITY)
# - Architect agent spawns subagents to research BEFORE breaking down
# - Findings stored in $SESSION_DIR/architecture/ for downstream use
# - Cannot plan what you don't understand
# Gotcha: This is a RECENT change - emphasize in PRD writing guide

# 4. Session State Files Are Immutable
# - tasks.json is single source of truth - NEVER deleted during cleanup
# - PRD snapshot preserved for delta detection
# - delta_from.txt links delta sessions to parent
# Gotcha: Users may try to manually edit tasks.json - warn against this

# 5. Delta Session Behavior
# - Only processes CHANGES (new, modified, removed requirements)
# - Preserves completed work from parent session
# - Can chain: session1 → delta1 → delta2
# Gotcha: Delta sessions are NOT full re-runs - explain the difference

# 6. Scope Syntax Is Exact
# - Format: P1 (phase), P1.M1 (milestone), P1.M1.T1 (task), P1.M1.T1.S1 (subtask)
# - Case-sensitive: use uppercase P, M, T, S
# - Use 'all' for complete execution
# Gotcha: Wrong format will cause scope parsing to fail

# 7. Four Agent Personas
# - Architect: Breaks down PRD into hierarchy (uses Opus model)
# - Researcher: Creates PRPs from tasks (uses Sonnet model)
# - Coder: Executes PRPs to code (uses Sonnet model)
# - QA: Bug hunting and validation (uses Sonnet model)
# Gotcha: "Researcher" generates PRPs, "Coder" implements them

# 8. 4-Level Progressive Validation
# - Level 1: Syntax & Style (linting, type check) - Run after EACH file
# - Level 2: Unit Tests (component validation)
# - Level 3: Integration Tests (system validation)
# - Level 4: Manual/E2E (creative validation)
# Gotcha: Each level MUST pass before proceeding to next

# 9. Bug Hunt Mode Behavior
# - Runs QA even with incomplete tasks
# - Generates TEST_RESULTS.md ONLY if critical/major bugs found
# - Absence of file = success (no bugs)
# - Triggers fix cycle if bugs found
# Gotcha: No file doesn't mean "failed" - it means success

# 10. PRP Caching (New in TypeScript Version)
# - Generated PRPs are cached and reused
# - Cache key based on task content + dependencies
# - Bypass with --no-cache flag
# Gotcha: This is a NEW optimization - not in bash version

# 11. I/O Batching (New in TypeScript Version)
# - State updates are batched for performance
# - Reduces filesystem operations
# - Atomic flush operations
# Gotcha: This is a NEW optimization - improves performance for large projects

# 12. Parallel Research (New in TypeScript Version)
# - N+1 pattern: Research next task while current executes
# - Fire-and-forget with .catch() error handling
# - Promise deduplication prevents duplicate work
# Gotcha: This is a NEW optimization - reduces overall execution time

# 13. Environment Variable Mapping
# - ANTHROPIC_AUTH_TOKEN (shell) maps to ANTHROPIC_API_KEY (SDK)
# - ANTHROPIC_BASE_URL defaults to z.ai endpoint
# - Model tiers: opus (GLM-4.7), sonnet (GLM-4.7), haiku (GLM-4.5-Air)
# Gotcha: z.ai is the provider, not api.anthropic.com

# 14. Session Directory Structure
# - Format: plan/{sequence}_{hash}/
# - hash is SHA-256 of PRD content
# - sequence auto-increments
# - Contains: tasks.json, prd_snapshot.md, architecture/, prps/, artifacts/
# Gotcha: Users may not understand where sessions are stored

# 15. Max Subtask Size: 2 Story Points
# - Architect agent limits subtasks to 0.5, 1, or 2 SP
# - Larger tasks must be broken down further
# - Ensures implementable units
# Gotcha: This is a constraint - affects PRD writing

# 16. Graceful Shutdown
# - SIGINT (Ctrl+C) triggers graceful shutdown
# - Completes current task before exiting
# - Preserves state for resumption
# Gotcha: Users may panic on Ctrl+C - explain it's safe

# 17. Git Auto-Commit
# - Automatic commits after each task completion
# - Smart commit messages generated from context
# - Uses commit-claude alias
# Gotcha: Commits happen automatically - users should know

# 18. Migration from Bash Version
# - Bash version was v0, TypeScript is v1
# - Feature parity + new optimizations
# - Different invocation (npm run dev vs bash script)
# Gotcha: Command syntax is different - clear migration needed

# 19. Documentation Structure (Diátaxis Framework)
# - User guide = How-To (30%) + Reference (30%) + Explanation (20%)
# - README = Tutorials (20%) + basic How-To
# - Don't repeat Quick Start in user guide
# Gotcha: User guide builds upon README, not replaces it

# 20. Troubleshooting Organization
# - Organize by SYMPTOM (what user sees), not internal cause
# - "Can't connect to server" not "TCP handshake timeout"
# - Provide quick diagnostics first
# Gotcha: Users don't know internals - describe what they see
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed - this is documentation only.

**Content Structure:**

```markdown
docs/user-guide.md Structure:

# User Guide

## Table of Contents
- Auto-generated from section headers

## 1. Writing PRDs
- PRD structure and sections
- Best practices for requirements
- Example PRD with annotations
- Common pitfalls to avoid

## 2. Session Management
- What is a session?
- Session directory structure
- State persistence
- Session lifecycle

## 3. Delta Workflow
- What are delta sessions?
- When to use delta mode
- Step-by-step delta workflow
- Delta session chaining

## 4. Scope-Based Execution
- Scope syntax reference
- Phase execution
- Milestone execution
- Task execution
- Subtask execution
- Use cases and examples

## 5. QA and Bug Hunt
- QA workflow overview
- 4-level validation system
- Bug hunt mode
- Interpreting TEST_RESULTS.md

## 6. Troubleshooting
- Quick diagnostics
- Common issues (by symptom)
- Error messages reference
- Debug mode
- Getting help

## 7. Performance Tuning
- PRP caching
- I/O batching
- Parallel research
- Environment optimization
- Metrics and monitoring

## 8. Migration Guide (v0 to v1)
- What's changed
- Breaking changes
- Command mapping
- Feature comparison
- Rollback procedures
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE docs/user-guide.md with TOC and Introduction
  - CREATE: docs/user-guide.md file
  - ADD: Table of contents (will update as sections are added)
  - ADD: Introduction explaining purpose and audience
  - ADD: Link to README.md for basic setup
  - NAMING: user-guide.md (lowercase with hyphen)
  - PLACEMENT: docs/ directory in project root

Task 2: WRITE "Writing PRDs" section
  - ADD: PRD structure overview (Executive Summary, Core Philosophy, Requirements, etc.)
  - ADD: Best practices for writing requirements (SMART criteria, acceptance criteria)
  - ADD: Example minimal PRD with inline annotations
  - ADD: Common pitfalls (over-specification, under-specification, missing acceptance criteria)
  - ADD: Research-Driven Architecture explanation (NEW PRIORITY)
  - REFERENCE: PRD.md as the example of a well-written PRD
  - GOTCHA: Emphasize that tests are implicit - don't create test tasks

Task 3: WRITE "Session Management" section
  - ADD: What is a session? (immutable audit trail, state persistence)
  - ADD: Session directory structure (plan/{sequence}_{hash}/)
  - ADD: Key files explanation (tasks.json, prd_snapshot.md, delta_from.txt)
  - ADD: Session lifecycle (initialization, execution, completion, delta)
  - ADD: State persistence explanation (how state is saved and restored)
  - REFERENCE: src/core/session-manager.ts for accurate details
  - DIAGRAM: ASCII or Mermaid diagram of session structure

Task 4: WRITE "Delta Workflow" section
  - ADD: What are delta sessions? (PRD change detection, incremental execution)
  - ADD: When to use delta mode (PRD modifications mid-project)
  - ADD: Step-by-step delta workflow:
    1. Modify PRD.md
    2. Run pipeline with --mode delta (or automatic detection)
    3. System creates delta session
    4. Only changed tasks execute
  - ADD: Delta session chaining (session1 → delta1 → delta2)
  - ADD: Example with before/after PRD snippets
  - REFERENCE: src/workflows/delta-analysis-workflow.ts
  - GOTCHA: Delta preserves completed work - doesn't re-run everything

Task 5: WRITE "Scope-Based Execution" section
  - ADD: Scope syntax reference table (P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, all)
  - ADD: Phase execution example (--scope P1)
  - ADD: Milestone execution example (--scope P1.M1)
  - ADD: Task execution example (--scope P1.M1.T1)
  - ADD: Subtask execution example (--scope P1.M1.T1.S1)
  - ADD: Use cases for each scope type
  - ADD: Combining scope with other flags (--scope P1.M1 --dry-run)
  - VERIFY: All examples match src/cli/index.ts implementation
  - GOTCHA: Scope is case-sensitive - use exact format

Task 6: WRITE "QA and Bug Hunt" section
  - ADD: QA workflow overview (when QA runs, what it does)
  - ADD: 4-level validation system explanation:
    - Level 1: Syntax & Style (ruff, mypy)
    - Level 2: Unit Tests
    - Level 3: Integration Tests
    - Level 4: Manual/E2E (creative testing)
  - ADD: Bug hunt mode (--mode bug-hunt)
  - ADD: Interpreting TEST_RESULTS.md (severity levels, fix cycle)
  - ADD: Example bug report snippet
  - REFERENCE: src/workflows/bug-hunt-workflow.ts
  - GOTCHA: No TEST_RESULTS.md = success (no critical bugs)

Task 7: WRITE "Troubleshooting" section
  - ADD: Quick diagnostics (--verbose, --dry-run, doctor command if available)
  - ADD: Common issues ORGANIZED BY SYMPTOM:
    - "Pipeline won't start"
    - "Task fails repeatedly"
    - "Slow performance"
    - "Session not found"
    - "Delta session not detecting changes"
    - "Agent seems stuck"
  - ADD: Each issue with: Symptom, Cause, Solution steps
  - ADD: Error messages reference (common errors and what they mean)
  - ADD: Debug mode instructions (--verbose flag)
  - ADD: Getting help (GitHub issues, documentation links)
  - PATTERN: Use "What you see" → "Why it happens" → "How to fix"
  - GOTCHA: Organize by symptom, not internal cause

Task 8: WRITE "Performance Tuning" section
  - ADD: PRP caching explanation (what's cached, cache key, invalidation)
  - ADD: How to bypass cache (--no-cache flag)
  - ADD: I/O batching explanation (atomic flush, dirty flag)
  - ADD: Parallel research explanation (N+1 pattern, look-ahead)
  - ADD: Environment optimization (model selection, API timeout)
  - ADD: Metrics and monitoring (what to track, target values)
  - ADD: Tips for large projects (scope usage, delta sessions)
  - REFERENCE: plan/001_14b9dc2a33c7/docs/README.md (performance research)
  - GOTCHA: These are NEW features - not in bash version

Task 9: WRITE "Migration Guide (v0 to v1)" section
  - ADD: Overview of changes (bash → TypeScript, new features)
  - ADD: Breaking changes table:
    - Command invocation (bash script → npm run dev)
    - Configuration (shell functions → package.json)
    - Session directory (may be different)
  - ADD: Command mapping table (old → new)
  - ADD: Feature comparison (what's same, what's new, what's removed)
  - ADD: Before/after code examples for common workflows
  - ADD: Rollback procedures (how to go back to bash version if needed)
  - ADD: New features in v1 (caching, batching, parallel research)
  - REFERENCE: Vue 3 migration guide pattern (https://v3-migration.vuejs.org/)
  - GOTCHA: Be honest about what's different - don't oversell

Task 10: CREATE and VERIFY table of contents
  - GENERATE: Table of contents from all section headers
  - VERIFY: All anchor links work (use #section-name format)
  - VERIFY: All internal links resolve correctly
  - ADD: "Back to top" links for long sections
  - TEST: Click each link in markdown preview

Task 11: ADD cross-references throughout
  - ADD: Links from Troubleshooting to relevant sections
  - ADD: Links from Delta Workflow to Session Management
  - ADD: Links from Scope-Based Execution to Writing PRDs
  - ADD: Links from Performance Tuning to relevant sections
  - VERIFY: All cross-reference links work

Task 12: VERIFY all code examples
  - TEST: Every CLI command in examples
  - VERIFY: All commands match src/cli/index.ts implementation
  - VERIFY: All scope examples use correct syntax
  - VERIFY: All output examples are realistic
  - UPDATE: Any examples that don't match actual behavior

Task 13: FINAL review against work item description
  - CHECK: Writing PRDs section present with structure and best practices
  - CHECK: Session management overview present
  - CHECK: Delta workflow guide present with examples
  - CHECK: Scope-based execution examples present
  - CHECK: QA and bug hunt workflow documentation present
  - CHECK: Troubleshooting section present (organized by symptom)
  - CHECK: Performance tuning tips present
  - CHECK: Migration guide from v0 present with before/after
  - CHECK: Table of contents present with working links
  - PLACE: Throughout document

Task 14: FORMAT and polish
  - APPLY: Consistent heading hierarchy (## for main sections, ### for subsections)
  - APPLY: Consistent code block language tags (bash, typescript, json, markdown)
  - APPLY: Consistent formatting for commands, options, file paths
  - VERIFY: No broken markdown syntax
  - VERIFY: Proper spacing and line breaks
  - PLACE: Throughout document
```

### Implementation Patterns & Key Details

```markdown
# ===== SECTION PATTERN: Writing PRDs =====
## Writing PRDs

A well-written PRD is the foundation of successful autonomous development. This section covers how to write effective PRDs for the PRP Pipeline.

### PRD Structure

Based on the [master PRD](../PRD.md), a PRD should include:

1. **Executive Summary** - High-level overview (1-2 paragraphs)
2. **Core Philosophy & Concepts** - Key architectural decisions
3. **System Architecture** - Components and their relationships
4. **Functional Requirements** - Detailed feature specifications
5. **User Workflows** - How users interact with the system
6. **Critical Prompts** - Agent personas and constraints (if applicable)

### Best Practices

**1. Be Specific and Measurable**

```markdown
# Poor
"The system should be fast."

# Better
"The system should respond to API requests within 100ms for 95% of requests."
```

**2. Include Acceptance Criteria**

Each feature should have clear acceptance criteria:

```markdown
## Feature: User Authentication

**Acceptance Criteria:**
- [ ] Users can log in with email/password
- [ ] Session tokens expire after 24 hours
- [ ] Failed login attempts are logged
- [ ] Password reset flow works end-to-end
```

**3. Research-Driven Architecture (NEW PRIORITY)**

The Architect agent will validate your PRD against the current codebase before breaking it down. This means:

- **No vacuum development**: Requirements must match codebase reality
- **Pre-validation**: Subagents research feasibility during planning
- **Architectural persistence**: Research findings stored for downstream use

**4. Tests Are Implicit**

Do NOT create tasks like "write tests for X". Testing is part of every subtask:

- Workflow: Write failing test → Implement feature → Pass test → Refactor
- Definition of Done: Code is incomplete without passing tests

### Example PRD

See the [master PRD](../PRD.md) for a complete example. Key highlights:

- Clear section hierarchy
- Specific acceptance criteria
- Architecture diagrams
- Agent persona definitions
- Validation requirements

### Common Pitfalls

| Pitfall | Consequence | Solution |
|---------|-------------|----------|
| Over-specifying implementation | Limits agent creativity | Focus on WHAT, not HOW |
| Under-specifying acceptance criteria | Ambiguous success | Add specific, measurable criteria |
| Missing architectural context | Implementation drift | Include system overview |
| Ignoring existing codebase | Conflicts and rework | Research before planning |

# ===== SECTION PATTERN: Delta Workflow =====
## Delta Workflow

Delta sessions allow you to modify your PRD mid-project and only re-execute the changes.

### What Are Delta Sessions?

When you modify `PRD.md`, the pipeline detects the change and creates a **delta session** that:

- Compares old PRD vs. new PRD
- Identifies new, modified, and removed requirements
- Preserves completed work from the parent session
- Only executes tasks affected by changes

### When to Use Delta Mode

Use delta mode when:
- You've discovered a missing requirement
- You need to modify an existing feature
- You want to remove something you no longer need
- Requirements have evolved based on learning

**Note:** Delta mode is automatically triggered when the PRD hash changes.

### Step-by-Step Delta Workflow

**1. Modify your PRD**

```bash
# Edit your PRD
vim PRD.md
```

**2. Run the pipeline**

```bash
# Delta mode is automatic when PRD changes
npm run dev -- --prd ./PRD.md
```

**3. Observe delta session creation**

```
[Session Manager] PRD hash changed
[Session Manager] Creating delta session: plan/002_newhash/
[Delta Analysis] Comparing PRDs...
[Delta Analysis] Found 3 new requirements, 2 modified, 1 removed
[Task Orchestrator] Updating task hierarchy...
```

**4. Only changed tasks execute**

The system will skip completed tasks and only execute:
- New tasks (for new requirements)
- Modified tasks (for changed requirements)
- Dependencies of the above

### Delta Session Chaining

You can chain multiple delta sessions:

```
session1 (initial) → delta1 (first change) → delta2 (second change)
```

Each delta session:
- Links to its parent via `delta_from.txt`
- Preserves all completed work
- Can be independently resumed

### Example: Adding a New Feature

**Before (original PRD):**
```markdown
## Features

### User Authentication
- Email/password login
- Session management
```

**After (modified PRD):**
```markdown
## Features

### User Authentication
- Email/password login
- Session management
- **Two-factor authentication (NEW)**
```

**Result:**
- Delta session created
- New task added for 2FA
- Existing tasks preserved
- Only new 2FA task executes

# ===== SECTION PATTERN: Scope-Based Execution =====
## Scope-Based Execution

Execute specific portions of your project using scope syntax.

### Scope Syntax Reference

| Scope | Format | Example | Executes |
|-------|--------|---------|----------|
| Phase | `P{N}` | `P1` | All tasks in Phase 1 |
| Milestone | `P{N}.M{N}` | `P1.M1` | All tasks in Milestone 1 of Phase 1 |
| Task | `P{N}.M{N}.T{N}` | `P1.M1.T1` | All subtasks in Task 1 of Milestone 1 of Phase 1 |
| Subtask | `P{N}.M{N}.T{N}.S{N}` | `P1.M1.T1.S1` | Only Subtask 1 |
| All | `all` | `all` | Entire backlog |

### Examples

**Execute a Phase:**
```bash
npm run dev -- --prd ./PRD.md --scope P1
# Executes all milestones, tasks, and subtasks in Phase 1
```

**Execute a Milestone:**
```bash
npm run dev -- --prd ./PRD.md --scope P3.M4
# Executes all tasks and subtasks in Milestone 4 of Phase 3
```

**Execute a Single Subtask:**
```bash
npm run dev -- --prd ./PRD.md --scope P1.M1.T1.S1
# Executes only Subtask 1 (useful for debugging or re-running)
```

**Dry Run with Scope:**
```bash
npm run dev -- --prd ./PRD.md --scope P1.M1 --dry-run
# Shows what would execute without running
```

### Use Cases

- **Development**: Work on a specific feature (milestone scope)
- **Debugging**: Re-run a failing task
- **Testing**: Execute a subset for validation
- **Demo**: Prepare specific functionality

# ===== SECTION PATTERN: Troubleshooting =====
## Troubleshooting

This section helps you diagnose and resolve common issues.

### Quick Diagnostics

```bash
# Run with verbose output
npm run dev -- --prd ./PRD.md --verbose

# Dry run to see what would happen
npm run dev -- --prd ./PRD.md --dry-run

# Check session state
cat plan/001_hash/tasks.json | jq '.backlog[] | select(.status == "Failed")'
```

### Common Issues

#### "Pipeline won't start"

**What you see:**
```bash
$ npm run dev -- --prd ./PRD.md
Error: PRD.md not found
```

**Why it happens:**
The PRD file path is incorrect or the file doesn't exist.

**How to fix:**
```bash
# Use absolute or relative path
npm run dev -- --prd /full/path/to/PRD.md

# Or verify current directory
pwd
ls PRD.md
```

#### "Task fails repeatedly"

**What you see:**
```
[Task Orchestrator] P1.M1.T1.S1 failed
[Task Orchestrator] Retrying...
[Task Orchestrator] P1.M1.T1.S1 failed
```

**Why it happens:**
The PRP for this task may have incomplete context, or there's a genuine implementation issue.

**How to fix:**
```bash
# 1. Check the PRP for this task
cat plan/001_hash/prps/P1.M1.T1.S1.md

# 2. Look for missing context or unclear instructions
# 3. Re-run the specific subtask with verbose mode
npm run dev -- --prd ./PRD.md --scope P1.M1.T1.S1 --verbose

# 4. If PRP is incomplete, you may need to manually enhance it
```

#### "Slow performance"

**What you see:**
Pipeline takes much longer than expected.

**Why it happens:**
- Large PRD with many tasks
- No caching enabled
- Sequential execution

**How to fix:**
```bash
# 1. Use scope to execute smaller portions
npm run dev -- --prd ./PRD.md --scope P1

# 2. Verify caching is enabled (default)
# Check for cache hits in verbose output

# 3. Use faster models for non-critical tasks
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air"

# 4. Run in parallel (if your project allows)
# Split into smaller PRDs for parallel execution
```

### Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `PRD hash changed` | PRD was modified | Run in delta mode or continue |
| `Session not found` | Invalid session directory | Check --continue or run fresh |
| `Scope parse error` | Invalid scope syntax | Use format: P1, P1.M1, P1.M1.T1.S1 |
| `Agent timeout` | LLM request took too long | Increase API_TIMEOUT_MS or simplify PRP |

### Getting Help

If you can't resolve the issue:

1. **Enable verbose mode**: `--verbose` flag
2. **Check logs**: Session directory contains execution logs
3. **Search issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/hacky-hack/issues)
4. **Create issue**: Include verbose output and PRD snippet

# ===== SECTION PATTERN: Migration Guide =====
## Migration Guide (v0 to v1)

This guide helps you migrate from the bash version (v0) to the TypeScript implementation (v1).

### What's Changed

| Aspect | v0 (Bash) | v1 (TypeScript) |
|--------|-----------|-----------------|
| Runtime | Bash script | Node.js / TypeScript |
| Invocation | `./prp-pipeline.sh` | `npm run dev --` |
| Configuration | Shell functions | Environment variables |
| State | JSON files | Same + enhanced |
| Performance | Sequential | Parallel + caching |

### Breaking Changes

**1. Command Invocation**

**Before (v0):**
```bash
./prp-pipeline.sh --prd PRD.md
```

**After (v1):**
```bash
npm run dev -- --prd PRD.md
# Note the -- separator for npm scripts
```

**2. Session Directory**

**Before (v0):**
```
.sessions/
└── hash/
```

**After (v1):**
```
plan/
└── 001_hash/
```

**3. Configuration**

**Before (v0):**
```bash
# Edited in script
PRP_MODEL="claude-sonnet-4"
```

**After (v1):**
```bash
# Environment variables
export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.7"
```

### Command Mapping

| v0 Command | v1 Equivalent | Notes |
|------------|---------------|-------|
| `./prp-pipeline.sh` | `npm run dev --` | Use -- for options |
| `--continue` | `--continue` | Same |
| `--scope P1` | `--scope P1` | Same |
| `N/A` | `--dry-run` | New feature |
| `N/A` | `--no-cache` | New feature |
| `N/A` | `--mode delta` | New feature |

### New Features in v1

- **PRP Caching**: Generated PRPs are cached and reused
- **I/O Batching**: State updates are batched for performance
- **Parallel Research**: Research next task while current executes
- **Delta Sessions**: Automatic PRD change detection
- **Graceful Shutdown**: Completes current task on Ctrl+C

### Before/After Examples

**Running a Milestone (v0):**
```bash
./prp-pipeline.sh --prd PRD.md --scope P1.M1
```

**Running a Milestone (v1):**
```bash
npm run dev -- --prd PRD.md --scope P1.M1
# Same scope syntax, different invocation
```

### Rollback Procedures

If you need to revert to v0:

```bash
# 1. Checkout v0 tag
git checkout v0

# 2. Use bash script
./prp-pipeline.sh --prd PRD.md

# 3. To return to v1
git checkout main
```

**Data compatibility:** Sessions are NOT compatible between v0 and v1 due to internal changes.

# ===== GOTCHA: Cross-Reference Pattern =====
# Use descriptive link text, not "click here"
# Pattern: [descriptive text](path/to/file#section)

# Examples:
- [PRD structure](#prd-structure)  ✓ Good
- [Click here](#prd-structure)     ✗ Bad
- See the [PRD](../PRD.md) for example  ✓ Good
- Click [here](../PRD.md)          ✗ Bad
```

### Integration Points

```yaml
USER_GUIDE_MD:
  - create: docs/user-guide.md
  - link_to: README.md (for basic setup context)
  - reference: PRD.md (as example PRD)
  - reference: PROMPTS.md (for PRP concept)
  - reference: src/cli/index.ts (for accurate CLI examples)

DOCS_DIRECTORY:
  - create: docs/ if it doesn't exist
  - place: user-guide.md in docs/
  - ensure: docs/ is git-tracked

README_MD:
  - link_from: README.md Advanced Features section
  - link_to: docs/user-guide.md
  - label: "User Guide" or "Detailed Documentation"

RESEARCH_ARTIFACTS:
  - preserve: plan/001_14b9dc2a33c7/P5M3T1S2/research/
  - reference: user-guide-research.md for patterns
  - reference: prompts-analysis.md for agent descriptions
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify markdown is well-formed
npx markdownlint docs/user-guide.md --fix 2>/dev/null || echo "markdownlint not installed, skipping"

# Manual checks:
# - All code blocks have language tags (```bash, ```typescript, etc.)
# - All links have descriptive text (not "click here")
# - All tables are properly formatted
# - No trailing whitespace
# - Consistent heading hierarchy (## for main, ### for subsections)

# Expected: Zero markdown formatting errors
# If errors exist:
#   - Fix markdown syntax issues
#   - Check table formatting (pipes and alignment)
#   - Verify code block closing
#   - Re-run validation
```

### Level 2: Link Validation (Content Validation)

```bash
# Test all internal links
# Manual process: Click each link in markdown preview

# Check anchor links (section headers)
grep -E '\[.*\]\(#' docs/user-guide.md | while read link; do
  # Extract anchor
  anchor=$(echo "$link" | sed -E 's/.*\(#([^)]+)\).*/\1/')
  echo "Checking anchor: $anchor"
done

# Check relative file links
grep -E '\[.*\]\([^)#]' docs/user-guide.md | while read link; do
  # Extract file path
  file=$(echo "$link" | sed -E 's/.*\]\(([^)]+)\).*/\1/' | sed 's/#.*//')
  if [ -f "$file" ]; then
    echo "✓ $file exists"
  else
    echo "✗ $file NOT FOUND"
  fi
done

# Expected: All links resolve correctly
# If broken links found:
#   - Fix anchor formatting (lowercase with hyphens)
#   - Verify file paths are correct
#   - Test in markdown preview
```

### Level 3: Content Accuracy Validation (System Validation)

```bash
# Verify all CLI examples match implementation
cd /home/dustin/projects/hacky-hack

# Get actual CLI options from source
npm run dev -- --help > /tmp/actual-help.txt 2>&1

# Manually compare documented options with actual
# Look for discrepancies in:
# - Option names (--prd, --scope, etc.)
# - Aliases (-p, -s, etc.)
# - Default values
# - Valid values (for --mode, etc.)

# Test documented examples
npm run dev -- --prd ./PRD.md --dry-run
npm run dev -- --prd ./PRD.md --dry-run --scope P1

# Expected: All examples execute without error
# If CLI examples fail:
#   - Update documentation to match actual implementation
#   - Check for typos in option names
#   - Verify npm script syntax (use of -- separator)
```

### Level 4: Documentation Quality Validation (Creative & Domain-Specific)

```bash
# Manual review checklist:

# 1. Writing PRDs Section
# [ ] PRD structure is clearly explained
# [ ] Best practices are specific and actionable
# [ ] Example PRD is referenced (PRD.md)
# [ ] Common pitfalls are listed with solutions
# [ ] Research-Driven Architecture is emphasized

# 2. Session Management Section
# [ ] Session concept is clearly explained
# [ ] Directory structure is documented
# [ ] Key files are explained (tasks.json, etc.)
# [ ] Session lifecycle is described
# [ ] Diagram or ASCII art aids understanding

# 3. Delta Workflow Section
# [ ] Delta sessions are clearly defined
# [ ] When to use delta is explained
# [ ] Step-by-step workflow is provided
# [ ] Example with before/after PRD
# [ ] Delta chaining is documented

# 4. Scope-Based Execution Section
# [ ] Scope syntax table is present
# [ ] Examples for all scope types (P, M, T, S)
# [ ] Use cases are listed
# [ ] Examples are tested and accurate

# 5. QA and Bug Hunt Section
# [ ] QA workflow is explained
# [ ] 4-level validation is documented
# [ ] Bug hunt mode is described
# [ ] TEST_RESULTS.md interpretation is clear

# 6. Troubleshooting Section
# [ ] Organized by symptom (not internal cause)
# [ ] Quick diagnostics provided
# [ ] Common issues covered
# [ ] Error messages reference table
# [ ] Debug mode instructions
# [ ] Getting help section

# 7. Performance Tuning Section
# [ ] PRP caching explained
# [ ] I/O batching explained
# [ ] Parallel research explained
# [ ] Environment optimization tips
# [ ] Metrics and monitoring guidance

# 8. Migration Guide Section
# [ ] Breaking changes listed
# [ ] Command mapping table
# [ ] Before/after examples
# [ ] New features highlighted
# [ ] Rollback procedures

# 9. General Quality
# [ ] Table of contents works
# [ ] All internal links work
# [ ] Code examples are runnable
# [ ] Writing follows best practices (active voice, second person)
# [ ] No jargon without explanation
# [ ] Consistent formatting throughout

# Expected: All checklist items pass
# If issues found:
#   - Add missing sections
#   - Fix broken links
#   - Improve explanations
#   - Add more examples
```

---

## Final Validation Checklist

### Technical Validation

- [ ] docs/user-guide.md exists and is valid markdown
- [ ] All internal links work (anchors and files)
- [ ] All external links load (referenced URLs)
- [ ] Code blocks have proper language tags
- [ ] Tables are properly formatted

### Content Validation

- [ ] All sections from work item description present
- [ ] Writing PRDs section with structure, best practices, examples
- [ ] Session management overview
- [ ] Delta workflow guide with examples
- [ ] Scope-based execution examples for all scope types
- [ ] QA and bug hunt workflow documentation
- [ ] Troubleshooting section organized by symptom
- [ ] Performance tuning tips
- [ ] Migration guide from v0 with before/after
- [ ] Table of contents with working links

### Accuracy Validation

- [ ] All CLI options match src/cli/index.ts
- [ ] All scope examples use correct syntax (P1, P1.M1, etc.)
- [ ] All file paths are accurate
- [ ] All agent descriptions match PROMPTS.md
- [ ] All workflow descriptions match actual implementation

### User Experience Validation

- [ ] User guide builds upon README (doesn't repeat basic setup)
- [ ] Each section is self-contained
- [ ] Cross-references link related sections
- [ ] Examples are copy-paste ready
- [ ] Troubleshooting is organized by symptom
- [ ] Migration guide is clear and actionable

### Integration Validation

- [ ] Links to README.md work
- [ ] Links to PRD.md work
- [ ] Links to PROMPTS.md work
- [ ] No broken relative paths
- [ ] External URLs are correct

---

## Anti-Patterns to Avoid

- **Don't repeat README content** - User guide builds upon, doesn't replace, README
- **Don't document non-existent features** - Verify all features work (check tasks.json)
- **Don't use untested examples** - Every CLI command must be verified
- **Don't organize troubleshooting by internal cause** - Use symptom-based organization
- **Don't forget the -- separator** - npm scripts need -- for options
- **Don't use jargon without explanation** - Define PRP, delta sessions, scope on first use
- **Don't use "click here" links** - Use descriptive link text
- **Don't ignore the migration guide** - Bash users need clear upgrade path
- **Don't oversell new features** - Be honest about v1 improvements vs v0
- **Don't miss the Research-Driven Architecture** - This is a NEW priority
- **Don't forget tests are implicit** - Emphasize this in PRD writing guide
- **Don't use wrong scope syntax** - P1.M1.T1.S1 format is required
- **Don't skip cross-references** - Link related sections together
- **Don't make the TOC static** - Verify all anchor links work
