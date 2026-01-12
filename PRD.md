# Product Requirements Document: Autonomous PRP Development Pipeline

## 1. Executive Summary
The **PRP (Product Requirement Prompt) Pipeline** is an agentic software development system designed to convert a high-level Product Requirements Document (PRD) into a fully implemented, tested, and polished codebase with minimal human intervention.

Unlike standard "coding agents" that drift and lose context, this pipeline uses a **structured, phase-based architecture**. It breaks large projects into atomic units, generates highly context-aware "Product Requirement Prompts" (PRPs) for every single task, and enforces rigorous validation loops. It features self-healing capabilities through iterative bug hunting and handles changing requirements via "Delta Sessions."

## 2. Core Philosophy & Concepts

### 2.1 The "PRP" Concept
The central thesis is that AI fails at complex coding tasks due to context dilution. A **PRP** is a focused, information-dense "micro-PRD" for a single task that includes:
*   The specific goal.
*   Curated context (file paths, specific code snippets).
*   Implementation strategy.
*   Validation gates (syntax, unit test, integration, manual).
*   "No Prior Knowledge" guarantee: An agent should need *only* the PRP to succeed.

### 2.2 The Session Model
The system creates an immutable audit trail of development.
*   **Session:** A directory containing the state of a specific run (tasks, architecture notes, code).
*   **Delta Logic:** If the master PRD changes, the system does not overwrite the current session. It creates a linked **Delta Session** that focuses only on the differences (new/modified features) while preserving completed work.

## 3. System Architecture

The new system must implement four distinct processing engines:

1.  **Session Manager:** Handles state, directory structures (`plan/001_hash`), and PRD diffing.
2.  **Task Orchestrator:** Manages the JSON backlog, dependency resolution, and status updates (replacing the `tsk` CLI).
3.  **Agent Runtime:** Interfaces with the LLM to run specific personas (Architect, Researcher, Coder, QA).
4.  **Pipeline Controller:** The main loop handling the sequence of operations, parallelization, and error recovery.

## 4. User Workflows

### 4.1 Initialization & Breakdown
1.  **Input:** User provides a `PRD.md`.
2.  **State Check:** System hashes the PRD. Checks for existing sessions.
3.  **Architecture Research:** Before planning, an agent explores the codebase to validate feasibility and store findings in `architecture/`.
4.  **Decomposition:** The **Architect Agent** breaks the PRD down into a strict hierarchy (Phase > Milestone > Task > Subtask) stored in a structured format (e.g., JSON).

### 4.2 The Execution Loop (The "Inner Loop")
For every item in the backlog (iterating Phase -> Milestone -> Task -> Subtask):
1.  **Parallel Research (Optional):** While Task $N$ is implementing, the system spins up a background thread to research Task $N+1$.
2.  **PRP Generation:**
    *   The **Researcher Agent** analyzes the task, the codebase, and external docs.
    *   Produces a `PRP.md` file containing the "contract" for the implementation.
3.  **Implementation:**
    *   The **Coder Agent** reads the `PRP.md`.
    *   Executes the plan.
    *   Must pass 4 levels of "Progressive Validation" defined in the PRP.
4.  **Cleanup & Commit:**
    *   Temporary artifacts are removed.
    *   Documentation is moved to `docs/`.
    *   State is saved (`tasks.json` updated).
    *   Git commit is triggered (aliased as `commit-claude`).

### 4.3 The "Delta" Workflow (Change Management)
If the user modifies `PRD.md` mid-project:
1.  **Detection:** System detects hash mismatch.
2.  **Delta Session:** Creates a new session directory linked to the previous one.
3.  **Delta Analysis:** An agent compares Old PRD vs. New PRD.
4.  **Task Patching:**
    *   Identifies new requirements -> Adds new tasks.
    *   Identifies modified requirements -> Marks affected existing tasks for "Update/Re-implementation".
    *   Identifies removed requirements -> Marks tasks as "Obsolete".
5.  **Resume:** The pipeline continues execution using the updated backlog.

### 4.4 The QA & Bug Hunt Loop
Once all tasks are complete, or if run in `bug-hunt` mode:
1.  **Validation Scripting:** An agent generates a custom `validate.sh` based on the PRD requirements and codebase tools.
2.  **Creative Bug Hunt:** The **QA Agent** (Adversarial Persona) creates a `TEST_RESULTS.md` report. It looks for logic gaps, not just failing tests.
3.  **The Fix Cycle:**
    *   If critical/major bugs are found, a "Bug Fix" sub-pipeline starts.
    *   It treats the `TEST_RESULTS.md` as a mini-PRD.
    *   It loops (Fix -> Re-test) until the QA Agent reports no issues.

## 5. Functional Requirements

### 5.1 State & File Management
*   **Must** maintain a `tasks.json` file as the single source of truth.
*   **Must** create a `plan/` directory structure: `plan/{sequence}_{hash}/`.
*   **Must** never delete `tasks.json`, `PRD.md`, or test results during cleanup.
*   **Must** support "Smart Commit": Automatically staging changes while protecting pipeline state files.
*   **Must** handle graceful shutdown (finish current task before exiting on SIGINT).

### 5.2 Agent Capabilities
*   **Tooling:** Agents must have access to:
    *   File I/O (Read/Write).
    *   Shell execution (for running tests/linters).
    *   Search (Grep/Glob).
    *   Web Research (for fetching docs).
*   **Context Management:** The system must inject specific context (Previous session notes, Architecture docs) into agent prompts.

### 5.3 Task Management
*   Support status: `Planned`, `Researching`, `Implementing`, `Complete`, `Failed`, `Obsolete`.
*   Support scopes: User can execute specific scopes (`--scope=milestone`, `--task=3`).

## 6. Critical Prompts & Personas

The system relies on specific, highly-engineered prompts. These must be preserved in the rewrite.

### 6.1 Task Breakdown System Prompt
*   **Role:** Lead Technical Architect.
*   **Goal:** Decompose PRD into strict JSON.
*   **Constraint:** "Validate before breaking down." Spawn sub-agents to research before defining tasks.
*   **Logic:** Implicit TDD (tests are part of the subtask, not separate).

### 6.2 PRP Creation Prompt ("The Blueprint")
*   **Role:** Product Owner / Researcher.
*   **Goal:** Create a `PRP.md` that ensures "One-pass implementation success."
*   **Process:**
    1.  Codebase Analysis (Find similar patterns).
    2.  Internal/External Research.
    3.  Template Filling (Context, Implementation Steps, Validation Gates).
*   **Output:** A markdown file adhering to a strict template.

### 6.3 PRP Execution Prompt ("The Builder")
*   **Role:** Senior Engineer.
*   **Goal:** Execute the PRP contract.
*   **Logic:**
    *   **CRITICAL:** Read PRP first.
    *   **Progressive Validation:** Level 1 (Lint/Type), Level 2 (Unit Test), Level 3 (Integration), Level 4 (Manual/Creative).
    *   Failure Protocol: Fix and retry until validation passes.

### 6.4 Delta PRD Generation Prompt
*   **Role:** Change Manager.
*   **Input:** Old PRD, New PRD, Completed Tasks.
*   **Goal:** Generate a "Delta PRD" focusing *only* on the diffs, referencing existing implementations to avoid work duplication.

### 6.5 Creative Bug Finding Prompt
*   **Role:** Adversarial QA Engineer.
*   **Input:** PRD, Completed Tasks.
*   **Phases:**
    1.  Scope Analysis.
    2.  Creative E2E Testing (Happy path + Edge cases).
    3.  Adversarial Testing (Unexpected inputs).
*   **Output:** `TEST_RESULTS.md` (only if bugs exist).

## 7. Improvements for the Rewrite

While the Bash script is functional, the rewrite in a higher-level language (Python/Go/Rust) must address these limitations:

1.  **Concurrency Control:** The bash script uses background subshells (`&`) which are hard to monitor. The rewrite should use proper async/await patterns or thread pools for "Parallel Research."
2.  **Structured State:** Replace `jq` parsing with native JSON serialization/deserialization to prevent corruption of `tasks.json`.
3.  **Observability:** structured logging instead of `print -P`.
4.  **Tool Abstraction:** Instead of relying on `tsk` CLI, integrate the task management logic directly into the codebase.
5.  **Error Handling:** Stronger retry logic and exception handling for API calls and tool failures.

## 8. Development Roadmap (Bootstrap)

To implement this PRD, the following self-bootstrapping sequence is recommended:
1.  **Core:** Implement the `Task` and `Session` data structures.
2.  **Orchestrator:** Implement the logic to iterate through the JSON hierarchy.
3.  **Prompts:** Port the HEREDOC prompts into a template engine (e.g., Jinja2).
4.  **Agent Interface:** Build the wrapper to send these prompts to the LLM.
5.  **CLI:** Build the entry point to trigger the pipeline.
