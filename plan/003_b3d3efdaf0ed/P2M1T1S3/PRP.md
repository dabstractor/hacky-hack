# Product Requirement Prompt (PRP): Create Quick Start Tutorial

> Transform PRD into working code with complete context, clear objectives, and validation criteria

**Status**: Ready for Implementation
**Last Updated**: 2025-01-23
**Work Item**: P2.M1.T1.S3 - Create quick start tutorial

---

## Goal

**Feature Goal**: Create a comprehensive quick start tutorial (docs/QUICKSTART.md) that enables new users to successfully run their first PRD-to-code pipeline in under 5 minutes

**Deliverable**: Documentation file `docs/QUICKSTART.md` containing a step-by-step tutorial with a realistic "build a TODO app" example PRD

**Success Definition**:

- A new user can follow the tutorial from scratch to successful completion in under 5 minutes
- Tutorial covers: PRD creation → pipeline execution → progress monitoring → understanding session structure → reviewing artifacts
- All example commands are copy-paste ready and produce expected outputs
- Tutorial follows established documentation patterns from docs/INSTALLATION.md and docs/CONFIGURATION.md

## User Persona

**Target User**: Developer who has just installed the PRP Pipeline and wants to see it in action immediately

**Use Case**: First-time user wants to validate their installation and understand the basic workflow before writing their own PRDs

**User Journey**:

1. User has completed installation (per INSTALLATION.md)
2. User opens QUICKSTART.md to run their first pipeline
3. User creates example PRD following the tutorial
4. User runs the pipeline command
5. User watches progress and learns to interpret output
6. User explores generated session directory and artifacts
7. User reviews the generated code and commits

**Pain Points Addressed**:

- "I installed it, now what?" - Provides immediate next action
- "What does a good PRD look like?" - Includes complete example PRD
- "Is it working? What should I see?" - Shows expected output at each step
- "Where did the code go?" - Explains session directory structure

## Why

- **User Onboarding**: Reduces time-to-first-success from exploration to under 5 minutes
- **Installation Validation**: Serves as integration test to verify setup is working correctly
- **Mental Model Building**: Through concrete example, users learn the PRD → tasks → PRPs → code flow
- **Confidence Building**: Early success encourages users to write their own PRDs
- **Support Reduction**: Self-service tutorial reduces basic "how do I start?" questions

## What

Create docs/QUICKSTART.md with a complete walkthrough using a realistic "TODO app" example:

### Success Criteria

- [ ] File created at docs/QUICKSTART.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents included with anchor links
- [ ] Prerequisites section with exact version requirements
- [ ] Step-by-step PRD creation with complete example TODO app PRD
- [ ] Pipeline execution command with expected output
- [ ] Progress monitoring explanation (logs, task status)
- [ ] Session directory structure explanation with example tree output
- [ ] Generated artifacts review (code, commits, PRPs)
- [ ] Next steps section linking to user-guide.md
- [ ] Troubleshooting section for common first-run issues
- [ ] All code blocks use proper syntax highlighting (bash, markdown)
- [ ] Length appropriate for quick start (target: 500-700 words total)

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:

- Exact file paths and content patterns to follow
- Complete TODO app PRD example content
- CLI command structure and expected outputs
- Session directory structure with examples
- Documentation formatting patterns from existing docs
- Cross-references to related documentation

### Documentation & References

```yaml
# MUST READ - Documentation formatting patterns
- file: docs/INSTALLATION.md
  why: Follow header format, table structure, troubleshooting section pattern
  pattern: Document header with Status/Last Updated/Version, numbered steps, tables for configuration
  gotcha: Uses ** for bold emphasis on important variables/commands

- file: docs/CONFIGURATION.md
  why: Follow table formatting, quick reference section pattern
  pattern: Quick Reference table at top, detailed sections with tables
  gotcha: Environment variable names use ALL_CAPS with backticks

- file: README.md
  why: Understand existing Quick Start section to avoid duplication
  pattern: Code blocks with language tags, mermaid diagrams for flow
  gotcha: Don't repeat README content - build on it with deeper walkthrough

- file: docs/user-guide.md
  why: Reference for "Next Steps" section linking
  pattern: Section numbering, cross-reference links
  gotcha: Use relative links like `[User Guide](./user-guide.md)`

- file: tests/fixtures/simple-prd.ts
  why: Example PRD structure to base TODO app PRD on
  pattern: PRD sections, acceptance criteria format
  gotcha: Keep example simple but realistic enough to demonstrate value

- file: tests/fixtures/simple-prd-v2.ts
  why: Example of PRD variation for delta session concept
  pattern: Similar structure, incremental changes
  gotcha: Not needed for initial quick start but good context

- file: src/cli/index.ts
  why: Understand CLI command structure for accurate examples
  pattern: `--prd` flag, subcommands, output format
  gotcha: Command is `npm run dev -- --prd ./PRD.md` (note double dash)

- file: src/workflows/prp-pipeline.ts
  why: Understand pipeline flow to explain what happens during execution
  pattern: Session creation, task processing, agent execution
  gotcha: Session stored in plan/{hash}/ directory

- file: src/core/session-manager.ts
  why: Understand session directory structure for explanation
  pattern: Hash-based naming, artifact storage
  gotcha: Session hash is PRD content-based (SHA256)

- docfile: plan/003_b3d3efdaf0ed/docs/external_deps.md
  why: Groundswell workflow context for agent explanation
  section: Agent Patterns (lines 818-840)
  gotcha: Four agent types (Architect, Researcher, Coder, QA) each have specific roles

- url: https://nodejs.org/en/download/package-manager
  why: Node.js installation prerequisite reference
  critical: Version requirement >= 20.0.0

- url: https://www.npmjs.com/package/npm
  why: npm version requirement reference
  critical: Version requirement >= 10.0.0
```

### Current Codebase Tree (relevant subset)

```bash
hacky-hack/
├── PRD.md                          # Main product requirements
├── README.md                       # Project overview with existing Quick Start
├── PROMPTS.md                      # PRP concept definitions
├── package.json                    # npm scripts (run dev)
├── docs/
│   ├── INSTALLATION.md             # Installation guide (P2.M1.T1.S1)
│   ├── CONFIGURATION.md            # Configuration reference (P2.M1.T1.S2)
│   ├── QUICKSTART.md               # TARGET FILE - TO BE CREATED
│   ├── user-guide.md               # Advanced usage guide
│   └── research/                   # Research notes directory
├── tests/
│   └── fixtures/
│       ├── simple-prd.ts           # Example PRD structure
│       └── simple-prd-v2.ts        # Example PRD variation
├── src/
│   ├── cli/
│   │   └── index.ts                # CLI command entry point
│   ├── core/
│   │   └── session-manager.ts      # Session directory management
│   └── workflows/
│       └── prp-pipeline.ts         # Main pipeline orchestration
└── plan/
    └── {hash}/                     # Session directories (created at runtime)
        ├── tasks.json              # Generated task breakdown
        ├── {task_id}/              # Individual task directories
        │   └── PRP.md              # Generated PRPs
        └── prd_snapshot.md         # PRD content snapshot
```

### Desired Codebase Tree with Files to be Added

```bash
hacky-hack/
├── docs/
│   ├── INSTALLATION.md             # (existing - P2.M1.T1.S1 output)
│   ├── CONFIGURATION.md            # (existing - P2.M1.T1.S2 output)
│   └── QUICKSTART.md               # NEW FILE - Quick start tutorial
│       ├── Step 1: Create Example PRD
│       ├── Step 2: Run Pipeline
│       ├── Step 3: Monitor Progress
│       ├── Step 4: Explore Session Directory
│       ├── Step 5: Review Generated Code
│       └── Next Steps
```

### Known Gotchas of Our Codebase & Library Quirks

```bash
# CRITICAL: CLI command requires double dash for argument passing
# Correct: npm run dev -- --prd ./PRD.md
# Incorrect: npm run dev --prd ./PRD.md (will fail)

# CRITICAL: Session hash is SHA256 of PRD content
# Same PRD = same session hash = same directory reused
# Different PRD content = different hash = new session directory

# CRITICAL: Environment variables must be set before running
# ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL are required
# Without these, pipeline will fail immediately

# CRITICAL: Session directory is plan/{hash}/ where hash is first 12 chars of SHA256
# Example: plan/003_b3d3efdaf0ed/ for a specific PRD

# CRITICAL: The tutorial must use a DIFFERENT example than README Quick Start
# README uses "simple API server" - use TODO app for variety
# This shows users the system works for different project types

# CRITICAL: Don't assume knowledge from user-guide.md
# Quick start should be self-contained for first-time success
# Reference user-guide.md only in "Next Steps" section

# CRITICAL: Expected output must be realistic
# Don't over-simplify - show real log output format
# Include timestamps, task IDs, status indicators

# CRITICAL: The TODO app PRD must be complete enough to generate real tasks
# Minimum: 2-3 features (create task, list tasks, mark complete)
# Include acceptance criteria for each feature
```

## Implementation Blueprint

### Document Structure

Create docs/QUICKSTART.md following established documentation patterns:

```markdown
# Quick Start Tutorial

> Build your first project with PRP Pipeline in under 5 minutes

**Status**: Published
**Last Updated**: [DATE]
**Version**: 1.0.0

## Table of Contents

## What You'll Build

## Prerequisites

## Step 1: Create Your First PRD

- What is a PRD?
- Example: TODO App PRD (complete content)
- Save the PRD

## Step 2: Run the Pipeline

- Command to run
- Expected output (real log sample)
- What just happened (brief explanation)

## Step 3: Monitor Progress

- Reading the output
- Task status indicators
- Estimated time

## Step 4: Explore the Session Directory

- Directory structure explanation
- Tree output example
- Key artifacts (tasks.json, PRPs, code)

## Step 5: Review Generated Code

- Where code was created
- Git commits
- Quality validation results

## Troubleshooting

## Next Steps
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: PREPARE - Review existing documentation patterns
  - READ: docs/INSTALLATION.md for header format, table patterns
  - READ: docs/CONFIGURATION.md for quick reference pattern
  - READ: README.md Quick Start section to avoid duplication
  - READ: tests/fixtures/simple-prd.ts for PRD structure reference
  - EXTRACT: Document header template (Status, Last Updated, Version)
  - EXTRACT: Table formatting patterns (alignment, column headers)
  - EXTRACT: Code block language tags (bash for commands, markdown for PRD content)

Task 2: DESIGN - Create complete TODO app PRD example
  - CREATE: PRD titled "Simple TODO Application"
  - DEFINE: 3 core features (Create Task, List Tasks, Mark Complete)
  - INCLUDE: Acceptance criteria for each feature
  - INCLUDE: Technical constraints (TypeScript, CLI-based)
  - FORMAT: Follow PRD.md structure (Title, Description, Requirements, Acceptance Criteria)
  - VALIDATE: PRD is complete enough to generate 3-5 tasks
  - STORE: Complete PRD content for inclusion in tutorial

Task 3: WRITE - Document header and overview sections
  - CREATE: File docs/QUICKSTART.md
  - ADD: Document header (Status: Published, Last Updated, Version: 1.0.0)
  - ADD: Brief description with "under 5 minutes" promise
  - ADD: Table of Contents with anchors
  - ADD: "What You'll Build" section with TODO app overview
  - FOLLOW: Pattern from docs/INSTALLATION.md header
  - LENGTH: Keep intro concise (target: 50-75 words)

Task 4: WRITE - Prerequisites section
  - ADD: Prerequisites section referencing INSTALLATION.md
  - LIST: Exact requirements with check commands (node --version, npm --version)
  - INCLUDE: Environment variable reminder (ANTHROPIC_AUTH_TOKEN)
  - LINK: To INSTALLATION.md for detailed setup if not completed
  - FORMAT: Use unordered list with check commands in code blocks
  - BREVITY: Assume installation is complete, just verify

Task 5: WRITE - Step 1: Create Your First PRD
  - ADD: Brief explanation "What is a PRD?" (2-3 sentences)
  - INCLUDE: Complete TODO app PRD content in markdown code block
  - ADD: Command to save the PRD (cat with heredoc or nano instructions)
  - EXPLAIN: Key PRD sections (Title, Features, Acceptance Criteria)
  - VALIDATE: PRD example is copy-paste ready and will generate tasks
  - LENGTH: PRD content ~150-200 words, explanation ~50 words

Task 6: WRITE - Step 2: Run the Pipeline
  - ADD: Command to run pipeline (npm run dev -- --prd ./PRD.md)
  - INCLUDE: Realistic expected output (log sample with timestamps, task IDs)
  - ADD: "What Just Happened" subsection explaining:
    - PRD analysis and task breakdown
    - Agent types (Architect → Researcher → Coder → QA)
    - Session directory creation
  - FORMAT: Code block for command, another for expected output
  - OUTPUT: Show ~10-15 lines of realistic log output

Task 7: WRITE - Step 3: Monitor Progress
  - ADD: How to read live output (task IDs, status indicators)
  - EXPLAIN: Status meanings (Queued → In Progress → Complete)
  - INCLUDE: Typical execution time estimates ("expect 2-3 minutes")
  - ADD: Note about task count ("5 tasks generated for TODO app")
  - FORMAT: Use bullet points for clarity

Task 8: WRITE - Step 4: Explore the Session Directory
  - ADD: Session directory explanation (plan/{hash}/ structure)
  - INCLUDE: Sample tree output showing directory structure
  - EXPLAIN: Key artifacts:
    - tasks.json: Task breakdown
    - {task_id}/PRP.md: Individual PRPs
    - prd_snapshot.md: PRD content
  - ADD: Command to explore (tree plan/ or ls -R plan/)
  - FORMAT: Use code block for tree output example

Task 9: WRITE - Step 5: Review Generated Code
  - ADD: Where code was created (src/ directory)
  - INCLUDE: Git log command to see commits (git log --oneline -5)
  - EXPLAIN: 4-level validation that was performed
  - ADD: How to run the generated application
  - FORMAT: Code blocks for git and run commands

Task 10: WRITE - Troubleshooting section
  - ADD: Common first-run issues with solutions:
    - "API key not set" → Set ANTHROPIC_AUTH_TOKEN
    - "Command not found" → Verify installation
    - "No tasks generated" → Check PRD format
  - FORMAT: Table with Symptom | Solution columns
  - FOLLOW: Pattern from docs/INSTALLATION.md Troubleshooting section

Task 11: WRITE - Next Steps section
  - ADD: Link to user-guide.md for writing custom PRDs
  - ADD: Link to CONFIGURATION.md for advanced options
  - ADD: Link to README.md for architecture overview
  - INCLUDE: Suggestion to explore existing PRD examples in tests/fixtures/
  - FORMAT: Unordered list with descriptive links

Task 12: VALIDATE - Review against success criteria
  - CHECK: Document header follows pattern
  - CHECK: Table of Contents present
  - CHECK: All 5 steps covered with complete content
  - CHECK: TODO app PRD is complete and realistic
  - CHECK: Expected output is realistic
  - CHECK: Session directory explanation accurate
  - CHECK: Troubleshooting covers common issues
  - CHECK: Next steps link appropriately
  - CHECK: Word count in target range (500-700)
  - CHECK: All code blocks have language tags
  - CHECK: All relative links use correct paths
```

### Implementation Patterns & Key Details

````markdown
<!-- Header Pattern (from INSTALLATION.md) -->

# Quick Start Tutorial

> Build your first project with PRP Pipeline in under 5 minutes

**Status**: Published
**Last Updated**: 2025-01-23
**Version**: 1.0.0

---

## Table of Contents

- [What You'll Build](#what-youll-build)
- [Prerequisites](#prerequisites)
- [Step 1: Create Your First PRD](#step-1-create-your-first-prd)
- [Step 2: Run the Pipeline](#step-2-run-the-pipeline)
- [Step 3: Monitor Progress](#step-3-monitor-progress)
- [Step 4: Explore the Session Directory](#step-4-explore-the-session-directory)
- [Step 5: Review Generated Code](#step-5-review-generated-code)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

<!-- TODO App PRD Example - Complete Content -->

# Simple TODO Application

## Overview

A command-line TODO application that allows users to manage tasks through a terminal interface.

## Requirements

### Core Features

1. **Create Task**: Add new tasks to the TODO list
2. **List Tasks**: Display all tasks with their status
3. **Mark Complete**: Toggle task completion status

### Technical Requirements

- Written in TypeScript
- Command-line interface using Node.js
- Data stored in local JSON file
- Simple file-based persistence

## User Stories

1. As a user, I want to add tasks so I can remember things I need to do
2. As a user, I want to see all my tasks so I know what needs to be done
3. As a user, I want to mark tasks as complete so I can track progress

## Acceptance Criteria

### Create Task

- [ ] CLI accepts task description as argument
- [ ] Task is saved with unique ID and "pending" status
- [ ] Confirmation message displays on success

### List Tasks

- [ ] All tasks display in a numbered list
- [ ] Each task shows ID, description, and status
- [ ] Empty state shows "No tasks found"

### Mark Complete

- [ ] CLI accepts task ID as argument
- [ ] Task status updates to "completed"
- [ ] Confirmation message displays on success

## Technical Constraints

- Single-file implementation preferred
- No external database (use tasks.json)
- Minimal dependencies (commander for CLI)
- TypeScript with strict mode

---

<!-- Command Pattern with Double Dash -->

```bash
# Run the pipeline
npm run dev -- --prd ./PRD.md
```
````

<!-- Expected Output Pattern - Realistic Log Sample -->

```bash
🔍 Analyzing PRD...
📋 Generated 3 tasks
✓ Task P1.T1.S1 queued
✓ Task P1.T1.S2 queued
✓ Task P1.T1.S3 queued

🔄 Processing Task P1.T1.S1: Create task models...
[2025-01-23 10:30:15] Starting PRP generation
[2025-01-23 10:30:45] PRP generated (187 tokens)
✓ Task P1.T1.S1 complete

🔄 Processing Task P1.T1.S2: Implement CLI commands...
[2025-01-23 10:30:46] Starting PRP generation
[2025-01-23 10:31:20] PRP generated (234 tokens)
✓ Task P1.T1.S2 complete

🔄 Processing Task P1.T1.S3: Add file persistence...
[2025-01-23 10:31:21] Starting PRP generation
[2025-01-23 10:31:55] PRP generated (198 tokens)
✓ Task P1.T1.S3 complete

✅ All 3 tasks completed successfully
🔍 Starting bug hunt...
✅ No bugs found!
🎉 Pipeline complete!
```

<!-- Session Directory Tree Pattern -->

```bash
plan/abc123def456/
├── tasks.json              # Task breakdown
├── prd_snapshot.md         # Your PRD content
├── P1T1S1/                 # Task 1 directory
│   └── PRP.md              # Generated PRP for task 1
├── P1T1S2/                 # Task 2 directory
│   └── PRP.md              # Generated PRP for task 2
└── P1T1S3/                 # Task 3 directory
    └── PRP.md              # Generated PRP for task 3
```

<!-- Troubleshooting Table Pattern -->

| Symptom                               | Solution                                                            |
| ------------------------------------- | ------------------------------------------------------------------- |
| `Error: ANTHROPIC_AUTH_TOKEN not set` | Set environment variable: `export ANTHROPIC_AUTH_TOKEN=zk-your-key` |
| `Command not found: prd`              | Ensure installation completed: `npm link`                           |
| `No tasks generated`                  | Verify PRD has Requirements and Acceptance Criteria sections        |

````

### Integration Points

```yaml
INSTALLATION.md:
  - reference: "If you haven't installed yet, see [Installation Guide](./INSTALLATION.md)"
  - assume: User has completed installation
  - link: Quick verification commands only

CONFIGURATION.md:
  - reference: "For all configuration options, see [Configuration Reference](./CONFIGURATION.md)"
  - assume: Default settings are fine for quick start
  - link: Environment variables reminder only

user-guide.md:
  - reference: "Learn to write custom PRDs in the [User Guide](./user-guide.md)"
  - placement: Next Steps section only
  - context: Advanced usage beyond quick start

README.md:
  - reference: "See [README](../README.md) for architecture overview"
  - placement: Optional Next Steps link
  - context: System architecture, not tutorial content

tests/fixtures/:
  - reference: "Explore more PRD examples in tests/fixtures/"
  - placement: Next Steps suggestion
  - context: Learning resources, not tutorial content
````

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

````bash
# Check markdown syntax
npm run check-docs 2>/dev/null || echo "Verify markdown links are valid"

# Manual validation checklist
- [ ] All markdown links resolve (./, ../ paths correct)
- [ ] All code blocks have language tags (```bash, ```markdown)
- [ ] Table formatting is aligned (columns line up)
- [ ] No broken internal references (#anchors exist)
- [ ] Document follows established formatting patterns

# Expected: Zero formatting errors, all links valid
````

### Level 2: Content Validation (Tutorial Completeness)

```bash
# Manual content review checklist
- [ ] Prerequisites section covers all requirements
- [ ] TODO app PRD is complete and realistic
- [ ] Pipeline command is correct (double dash)
- [ ] Expected output matches real log format
- [ ] Session directory explanation is accurate
- [ ] Troubleshooting covers common first-run issues
- [ ] Next steps link to appropriate docs
- [ ] Document can be followed independently

# Expected: All content validation checks pass
```

### Level 3: Tutorial Walkthrough (User Validation)

```bash
# Create test PRD from tutorial example
cat > /tmp/test-todo-prd.md << 'EOF'
# Simple TODO Application
[Copy exact PRD content from tutorial]
EOF

# Run pipeline with test PRD
npm run dev -- --prd /tmp/test-todo-prd.md

# Verify: Pipeline executes successfully
# Verify: Session directory created at plan/{hash}/
# Verify: tasks.json contains expected tasks
# Verify: Code generated in src/ directory

# Check git commits
git log --oneline -5

# Expected: Clean pipeline run, no errors, expected artifacts generated
```

### Level 4: Documentation Integration Testing

```bash
# Verify all internal links resolve
grep -o '\[.*\](\./[^)]*)' docs/QUICKSTART.md | while read link; do
  target=$(echo "$link" | sed 's/.*(\(.*\))/\1/');
  if [ ! -f "docs/$target" ] && [ ! -f "$target" ]; then
    echo "Broken link: $target";
  fi;
done

# Verify document fits quick start criteria
wc -w docs/QUICKSTART.md  # Should be 500-700 words
grep -c "^##" docs/QUICKSTART.md  # Should have 7-9 sections

# Verify cross-reference consistency
grep -c "INSTALLATION.md" docs/QUICKSTART.md  # Should link once
grep -c "CONFIGURATION.md" docs/QUICKSTART.md  # Should link once
grep -c "user-guide.md" docs/QUICKSTART.md  # Should link once

# Expected: All links valid, word count in range, appropriate cross-references
```

## Final Validation Checklist

### Technical Validation

- [ ] File created at docs/QUICKSTART.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents with all sections and anchors
- [ ] All code blocks have syntax highlighting language tags
- [ ] All internal links use correct relative paths (./, ../)
- [ ] All external links are valid URLs
- [ ] Markdown syntax is valid (tables, lists, code blocks)
- [ ] Word count in target range (500-700 words)

### Content Validation

- [ ] Prerequisites section references INSTALLATION.md appropriately
- [ ] TODO app PRD is complete (Title, Overview, Requirements, Acceptance Criteria)
- [ ] Pipeline command uses correct double-dash syntax
- [ ] Expected output is realistic and matches actual log format
- [ ] Session directory explanation is accurate (plan/{hash}/ structure)
- [ ] Troubleshooting covers common first-run issues (API key, command not found, no tasks)
- [ ] Next Steps link to user-guide.md, CONFIGURATION.md, README.md

### User Experience Validation

- [ ] Tutorial can be followed independently without other docs
- [ ] TODO app example is different from README example (proves system flexibility)
- [ ] Each step builds on previous knowledge (progressive disclosure)
- [ ] Expected output helps user recognize success
- [ ] Troubleshooting prevents common frustration points
- [ ] Next Steps guide user to deeper learning

### Documentation Pattern Compliance

- [ ] Header matches INSTALLATION.md and CONFIGURATION.md format
- [ ] Table formatting follows established patterns
- [ ] Code block language tags match content type
- [ ] Section organization follows logical flow
- [ ] Cross-references use consistent link format
- [ ] Tone matches existing documentation (professional, approachable)

---

## Anti-Patterns to Avoid

- ❌ Don't duplicate content from INSTALLATION.md (reference it instead)
- ❌ Don't use the same example as README Quick Start (use TODO app)
- ❌ Don't skip the double-dash in CLI command (`-- --prd`)
- ❌ Don't over-simplify expected output (show realistic logs)
- ❌ Don't assume user has read user-guide.md (keep self-contained)
- ❌ Don't make the TODO app PRD too complex (keep it under 200 words)
- ❌ Don't forget to mention session hash is PRD-content based
- ❌ Don't skip the "What just happened" explanation (builds mental model)
- ❌ Don't include advanced features in quick start (save for Next Steps)
- ❌ Don't make the tutorial longer than 5 minutes to complete
