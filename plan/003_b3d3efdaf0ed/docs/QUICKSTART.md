# Quick Start Tutorial

> Build your first project with PRP Pipeline in under 5 minutes

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

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

## What You'll Build

In this tutorial, you'll create a simple **TODO application** with command-line interface. This example demonstrates the complete PRD-to-code pipeline while being simple enough to complete quickly.

**Features you'll build:**

- Add new tasks to a TODO list
- Display all tasks with their status
- Mark tasks as complete

**Expected time:** 3-5 minutes from PRD creation to working code.

---

## Prerequisites

Before starting, ensure you have completed the [Installation Guide](./INSTALLATION.md).

Quick verification:

```bash
# Check Node.js version (must be >= 20.0.0)
node --version

# Check npm version (must be >= 10.0.0)
npm --version

# Verify environment variables are set
echo $ANTHROPIC_AUTH_TOKEN  # Should display your API token
echo $ANTHROPIC_BASE_URL    # Should point to z.ai endpoint
```

If any of these checks fail, please complete the [Installation Guide](./INSTALLATION.md) first.

---

## Step 1: Create Your First PRD

A **PRD** (Product Requirements Document) describes what you want to build. The PRP Pipeline reads your PRD and automatically generates the implementation plan and code.

Create a file named `TODO_PRD.md` with the following content:

```markdown
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
```

**Save the file** in your project root:

```bash
# Option 1: Create file with nano
nano TODO_PRD.md
# Paste the content above, then Ctrl+O to save, Ctrl+X to exit

# Option 2: Create file with cat
cat > TODO_PRD.md << 'EOF'
# Simple TODO Application
[Paste the content above here]
EOF
```

**What's in a PRD?**

- **Overview**: High-level description of what you're building
- **Requirements**: Core features and technical constraints
- **User Stories**: Who needs what and why
- **Acceptance Criteria**: Specific, testable conditions for success
- **Technical Constraints**: Implementation boundaries and technology choices

---

## Step 2: Run the Pipeline

With your PRD ready, run the PRP Pipeline. The system will analyze your requirements, create a task breakdown, and implement the code.

```bash
# Run the pipeline with your TODO PRD
npm run dev -- --prd ./TODO_PRD.md
```

**Expected Output:**

```
[Session Manager] Computing PRD hash...
[Session Manager] PRD hash computed: a3f8e2b1d4c7
[Session Manager] Creating session: plan/001_a3f8e2b1d4c7/
[Session Manager] Session created

[PRPPipeline] Decomposing PRD...
[PRPPipeline] Calling Architect agent...
[Architect Agent] Analyzing PRD requirements...
[Architect Agent] Generating task backlog...
[PRPPipeline] Generated 3 tasks
[PRPPipeline] Total tasks: 9

[PRPPipeline] Executing backlog...
🔄 Processing Task P1.M1.T1.S1: Design data models...
✓ Task P1.M1.T1.S1 complete

🔄 Processing Task P1.M1.T1.S2: Implement task storage...
✓ Task P1.M1.T1.S2 complete

🔄 Processing Task P1.M1.T1.S3: Create CLI interface...
✓ Task P1.M1.T1.S3 complete

[PRPPipeline] ===== Pipeline Complete =====
[PRPPipeline] Progress: 9/9 (100%)
[PRPPipeline] Duration: 2453ms (2.5s)

🔍 Starting QA cycle...
🔍 Bug hunt in progress...
✅ No bugs found!

🎉 Pipeline complete!
```

**What Just Happened:**

1. **Session Creation**: The system computed a unique hash of your PRD and created a session directory at `plan/001_a3f8e2b1d4c7/`

2. **PRD Analysis**: The Architect Agent analyzed your PRD and broke it down into implementable tasks (3 main tasks with 9 total subtasks)

3. **Task Execution**: The Researcher and Coder Agents worked together to:
   - Generate detailed Product Requirement Prompts (PRPs) for each subtask
   - Implement the code following your requirements
   - Run 4-level validation (syntax, unit tests, integration, manual)

4. **QA Cycle**: The QA Agent performed a bug hunt and verified all requirements were met

---

## Step 3: Monitor Progress

During pipeline execution, you'll see real-time progress updates:

**Understanding the Output:**

- **Task IDs**: Each task has a unique ID like `P1.M1.T1.S1` (Phase 1, Milestone 1, Task 1, Subtask 1)
- **Status Indicators**:
  - `🔄 Processing` - Currently executing
  - `✓ complete` - Successfully finished
  - `✗ failed` - Encountered an error (details logged)

**Typical Execution Time:**

- Simple projects (like TODO app): 2-3 minutes
- Medium projects: 5-10 minutes
- Large projects: 15+ minutes

**Progress Indicators:**

```
[PRPPipeline] Progress: 3/9 (33.3%)
```

This shows how many subtasks have completed out of the total.

---

## Step 4: Explore the Session Directory

The pipeline creates a **session directory** containing all artifacts from the run. This directory is your audit trail and enables resumable sessions.

**Navigate to the session:**

```bash
# List all sessions
ls plan/

# Explore your session (replace with actual hash)
cd plan/001_a3f8e2b1d4c7/

# Show directory structure
tree .  # or: find . -type f | sort
```

**Expected Directory Structure:**

```
plan/001_a3f8e2b1d4c7/
├── tasks.json              # Task breakdown and status
├── prd_snapshot.md         # Your PRD content snapshot
├── P1M1T1S1/               # Task 1 directory
│   └── PRP.md              # Generated PRP for task 1
├── P1M1T1S2/               # Task 2 directory
│   └── PRP.md              # Generated PRP for task 2
├── P1M1T1S3/               # Task 3 directory
│   └── PRP.md              # Generated PRP for task 3
└── architecture/           # Architect Agent's research
    ├── system_context.md
    └── external_deps.md
```

**Key Files Explained:**

| File               | Purpose                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `tasks.json`       | Single source of truth for task hierarchy and status. Never edit manually.                       |
| `prd_snapshot.md`  | Snapshot of your PRD at session creation. Used for delta detection.                              |
| `{task_id}/PRP.md` | Generated Product Requirement Prompt for each subtask. Contains complete implementation context. |
| `architecture/`    | Research findings from the Architect Agent about codebase structure.                             |

**Session Hash Behavior:**

- Same PRD content = Same session hash = Same directory reused
- Different PRD content = Different hash = New session directory created
- This enables **delta sessions** - only changed tasks re-execute when PRD is modified

---

## Step 5: Review Generated Code

The pipeline has generated working code. Let's review what was created.

**View the generated source files:**

```bash
# List generated source files
ls -la src/

# View the main application file
cat src/todo-app.ts  # or similar filename
```

**Check git commits:**

The pipeline automatically commits each completed task:

```bash
# View recent commits
git log --oneline -5

# Example output:
# a1b2c3d Implement task storage layer (P1.M1.T1.S2)
# d4e5f6g Design data models for TODO items (P1.M1.T1.S1)
# f7g8h9i Add CLI command framework (P1.M1.T1.S3)
```

**Run your generated application:**

```bash
# Add a task
node dist/todo-app.js add "Buy groceries"

# List all tasks
node dist/todo-app.js list

# Mark task complete
node dist/todo-app.js complete 1
```

**Validation Performed:**

Your code went through 4-level validation:

1. **Level 1**: Syntax & Style (TypeScript compilation, linting)
2. **Level 2**: Unit Tests (component-level tests)
3. **Level 3**: Integration Tests (end-to-end workflows)
4. **Level 4**: Manual Validation (creative functionality)

All validation gates passed before the pipeline completed.

---

## Troubleshooting

Common first-run issues and solutions:

| Symptom                               | Solution                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Error: ANTHROPIC_AUTH_TOKEN not set` | Set environment variable: <br>`export ANTHROPIC_AUTH_TOKEN=zk-your-key`                                             |
| `Command not found: prd`              | Ensure installation completed: <br>`npm run dev -- --prd ./TODO_PRD.md` (not `prd` command)                         |
| `No tasks generated`                  | Verify PRD has Requirements and Acceptance Criteria sections                                                        |
| `Pipeline runs but no code created`   | Check task status in `plan/*/tasks.json` - look for Failed status                                                   |
| `API connection timeout`              | Verify `ANTHROPIC_BASE_URL` points to z.ai endpoint: <br>`export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic` |

**Getting More Help:**

- Enable verbose output: `npm run dev -- --prd ./TODO_PRD.md --verbose`
- Check the [User Guide](./user-guide.md) for advanced troubleshooting
- Review session logs in `plan/{hash}/` directory

---

## Next Steps

Congratulations! You've successfully run your first PRP Pipeline. Here's what to do next:

**Learn More:**

- **[User Guide](./user-guide.md)** - Comprehensive guide for writing custom PRDs, session management, delta workflow, scope-based execution, and advanced features
- **[Configuration Reference](./CONFIGURATION.md)** - All environment variables, CLI options, model selection, and performance tuning
- **[README](../README.md)** - Project overview and architecture

**Try More Examples:**

Explore additional PRD examples in the test fixtures:

```bash
# View example PRDs
ls tests/fixtures/
cat tests/fixtures/simple-prd.ts
```

**Build Your Own PRD:**

Now that you've seen the pipeline in action, try writing a PRD for your own project:

1. Start with a clear, focused feature set
2. Include detailed acceptance criteria
3. Specify technical constraints
4. Run the pipeline and iterate

**Advanced Features to Explore:**

- **Delta Sessions**: Modify your PRD and only re-execute changed tasks
- **Scope-Based Execution**: Run specific phases, milestones, or tasks
- **Custom Configuration**: Adjust models, timeouts, and performance settings

---

**Quick Start Tutorial Version**: 1.0.0
**Last Updated**: 2026-01-23
**For PRP Pipeline Version**: 0.1.0
