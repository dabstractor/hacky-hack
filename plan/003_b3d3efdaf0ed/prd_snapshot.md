# Product Requirements Document: Autonomous PRP Development Pipeline

## 1. Executive Summary

The **PRP (Product Requirement Prompt) Pipeline** is an agentic software development system designed to convert a high-level Product Requirements Document (PRD) into a fully implemented, tested, and polished codebase with minimal human intervention.

Unlike standard "coding agents" that drift and lose context, this pipeline uses a **structured, phase-based architecture**. It breaks large projects into atomic units, generates highly context-aware "Product Requirement Prompts" (PRPs) for every single task, and enforces rigorous validation loops. It features self-healing capabilities through iterative bug hunting and handles changing requirements via "Delta Sessions."

## 2. Core Philosophy & Concepts

### 2.1 The "PRP" Concept

The central thesis is that AI fails at complex coding tasks due to context dilution. A **PRP** is a focused, information-dense "micro-PRD" for a single task that includes:

- The specific goal.
- Curated context (file paths, specific code snippets).
- Implementation strategy.
- Validation gates (syntax, unit test, integration, manual).
- "No Prior Knowledge" guarantee: An agent should need _only_ the PRP to succeed.

### 2.2 The Session Model

The system creates an immutable audit trail of development.

- **Session:** A directory containing the state of a specific run (tasks, architecture notes, code).
- **Delta Logic:** If the master PRD changes, the system does not overwrite the current session. It creates a linked **Delta Session** that focuses only on the differences (new/modified features) while preserving completed work.

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
    - The **Researcher Agent** analyzes the task, the codebase, and external docs.
    - Produces a `PRP.md` file containing the "contract" for the implementation.
3.  **Implementation:**
    - The **Coder Agent** reads the `PRP.md`.
    - Executes the plan.
    - Must pass 4 levels of "Progressive Validation" defined in the PRP.
4.  **Cleanup & Commit:**
    - Temporary artifacts are removed.
    - Documentation is moved to `docs/`.
    - State is saved (`tasks.json` updated).
    - Git commit is triggered (aliased as `commit-claude`).

### 4.3 The "Delta" Workflow (Change Management)

If the user modifies `PRD.md` mid-project:

1.  **Detection:** System detects hash mismatch (computed from `prd_snapshot.md` content).
2.  **Delta Session:** Creates a new session directory linked to the previous one via `delta_from.txt`.
3.  **Delta Analysis:** An agent compares Old PRD vs. New PRD.
4.  **Delta PRD Generation (with retry logic):**
    - Agent generates `delta_prd.md` focusing only on differences.
    - If delta PRD not created on first attempt, system demands agent retry.
    - Session fails fast if delta PRD cannot be generated after retry.
    - Incomplete delta sessions detect and regenerate missing delta PRDs on resume.
5.  **Task Patching:**
    - Identifies new requirements -> Adds new tasks.
    - Identifies modified requirements -> Marks affected existing tasks for "Update/Re-implementation".
    - Identifies removed requirements -> Marks tasks as "Obsolete".
    - Phase indexing searches for matching IDs (handles non-sequential phase IDs in delta sessions).
6.  **Resume:** The pipeline continues execution using the updated backlog.

### 4.4 The QA & Bug Hunt Loop

Once all tasks are complete, or if run in `bug-hunt` mode:

1.  **Validation Scripting:** An agent generates a custom `validate.sh` based on the PRD requirements and codebase tools.
2.  **Creative Bug Hunt:** The **QA Agent** (Adversarial Persona) creates a `TEST_RESULTS.md` report. It looks for logic gaps, not just failing tests.
3.  **The Fix Cycle (Self-Contained Sessions):**
    - If critical/major bugs are found, a self-contained "Bug Fix" sub-pipeline starts.
    - Each bug hunt iteration creates a new numbered session: `bugfix/001_hash/`, `bugfix/002_hash/`, etc.
    - Bug reports (`TEST_RESULTS.md`) and tasks are stored within the bugfix session directory.
    - It treats the `TEST_RESULTS.md` as a mini-PRD with simplified task breakdown (one task per bug, 1-3 subtasks max).
    - It loops (Fix -> Re-test) until the QA Agent reports no issues.
4.  **Interactive Prompts:**
    - User is prompted before starting a new bug hunt on a completed session.
    - User is prompted before resuming an incomplete bug fix cycle, with option to archive and start fresh.
5.  **Artifact Preservation:**
    - Bug fix artifacts are archived (not deleted) for audit trail and debugging history.
    - Session structure: `plan/NNN_hash/bugfix/NNN_hash/` contains `tasks.json` and `TEST_RESULTS.md`.

## 5. Functional Requirements

### 5.1 State & File Management

- **Must** maintain a `tasks.json` file as the single source of truth.
- **Must** create a `plan/` directory structure: `plan/{sequence}_{hash}/`.
- **Must** support bugfix session structure: `plan/{sequence}_{hash}/bugfix/{sequence}_{hash}/`.
- **Must** support "Smart Commit": Automatically staging changes while protecting pipeline state files.
- **Must** handle graceful shutdown (finish current task before exiting on SIGINT).
- **Must** implement nested execution guard via `PRP_PIPELINE_RUNNING` environment variable.
- **Must** validate session paths in bug fix mode (must contain "bugfix" in path).

**Protected Files (NEVER delete or move):**

- `$SESSION_DIR/tasks.json` - Pipeline state tracking
- `$SESSION_DIR/prd_snapshot.md` - PRD snapshot for session
- `$SESSION_DIR/delta_prd.md` - Delta PRD for incremental sessions
- `$SESSION_DIR/delta_from.txt` - Delta session linkage
- `$SESSION_DIR/TEST_RESULTS.md` - Bug report file
- `PRD.md` - Product requirements document (human-owned)
- Any file matching `*tasks*.json` pattern
- Any file directly in `$SESSION_DIR/` root (never move to subdirectories)

### 5.2 Agent Capabilities

- **Tooling:** Agents must have access to:
  - File I/O (Read/Write).
  - Shell execution (for running tests/linters).
  - Search (Grep/Glob).
  - Web Research (for fetching docs).
- **Context Management:** The system must inject specific context (Previous session notes, Architecture docs) into agent prompts.

**Agent Operational Boundaries (FORBIDDEN OPERATIONS):**

Each agent type has strictly defined output scopes and forbidden operations to prevent pipeline corruption:

| Agent Type     | Allowed Output Scope                  | Forbidden Operations                           |
| -------------- | ------------------------------------- | ---------------------------------------------- |
| Task Breakdown | `tasks.json`, `architecture/`         | PRD.md, source code, .gitignore                |
| Research (PRP) | `PRP.md`, `research/`                 | tasks.json, source code, prd_snapshot.md       |
| Implementation | `src/`, `tests/`, `lib/`              | plan/, PRD.md, tasks.json, pipeline scripts    |
| Cleanup        | `docs/` organization                  | plan/, PRD.md, tasks.json, session directories |
| Task Update    | `tasks.json` modifications            | PRD.md, source code, prd_snapshot.md           |
| Validation     | `validate.sh`, `validation_report.md` | plan/, source code, tasks.json                 |
| Bug Hunter     | `TEST_RESULTS.md` (if bugs found)     | plan/, source code, tasks.json                 |

**Universal Forbidden Operations (all agents):**

- Never modify `PRD.md` (human-owned document)
- Never add `plan/`, `PRD.md`, or task files to `.gitignore`
- Never run `prd`, `run-prd.sh`, or `tsk` commands (prevents recursive execution)
- Never create session-pattern directories (`[0-9]*_*`) outside designated locations

### 5.3 Task Management

- Support status: `Planned`, `Researching`, `Implementing`, `Complete`, `Failed`, `Obsolete`.
- Support scopes: User can execute specific scopes (`--scope=milestone`, `--task=3`).

**`prd task` Subcommand:**

Provides convenient wrapper to interact with tasks in the current session:

```bash
prd task              # Show tasks for current session
prd task next         # Get next task
prd task status       # Show status
prd task -f <file>    # Override with specific file
```

**Task File Discovery Priority:**

1. Incomplete bugfix session tasks (`SESSION_DIR/bugfix/NNN_hash/tasks.json`)
2. Main session tasks (`SESSION_DIR/tasks.json`)

## 6. Critical Prompts & Personas

The system relies on specific, highly-engineered prompts. These must be preserved in the rewrite.

### 6.1 Task Breakdown System Prompt

- **Role:** Lead Technical Architect.
- **Goal:** Decompose PRD into strict JSON.
- **Constraint:** "Validate before breaking down." Spawn sub-agents to research before defining tasks.
- **Logic:** Implicit TDD (tests are part of the subtask, not separate).

### 6.2 PRP Creation Prompt ("The Blueprint")

- **Role:** Product Owner / Researcher.
- **Goal:** Create a `PRP.md` that ensures "One-pass implementation success."
- **Process:**
  1.  Codebase Analysis (Find similar patterns).
  2.  Internal/External Research.
  3.  Template Filling (Context, Implementation Steps, Validation Gates).
- **Output:** A markdown file adhering to a strict template.

### 6.3 PRP Execution Prompt ("The Builder")

- **Role:** Senior Engineer.
- **Goal:** Execute the PRP contract.
- **Logic:**
  - **CRITICAL:** Read PRP first.
  - **Progressive Validation:** Level 1 (Lint/Type), Level 2 (Unit Test), Level 3 (Integration), Level 4 (Manual/Creative).
  - Failure Protocol: Fix and retry until validation passes.

### 6.4 Delta PRD Generation Prompt

- **Role:** Change Manager.
- **Input:** Old PRD, New PRD, Completed Tasks.
- **Goal:** Generate a "Delta PRD" focusing _only_ on the diffs, referencing existing implementations to avoid work duplication.

### 6.5 Creative Bug Finding Prompt

- **Role:** Adversarial QA Engineer.
- **Input:** PRD, Completed Tasks.
- **Phases:**
  1.  Scope Analysis.
  2.  Creative E2E Testing (Happy path + Edge cases).
  3.  Adversarial Testing (Unexpected inputs).
- **Output:** `TEST_RESULTS.md` (only if bugs exist).

### 6.6 PRD Brainstormer Prompt ("Requirements Interrogation Engine")

- **Role:** Requirements Interrogation and Convergence Engine.
- **Goal:** Produce comprehensive PRDs through aggressive questioning rather than invention.
- **Four-Phase Model:**
  1.  **Discovery:** Initial requirements gathering.
  2.  **Interrogation:** Deep questioning to uncover gaps and ambiguities.
  3.  **Convergence:** Consolidating answers into coherent specifications.
  4.  **Finalization:** Final PRD generation with testability validation.
- **Key Rules:**
  - Maintains a Decision Ledger for tracking confirmed facts.
  - Linear questioning rule (no parallel questions that could invalidate each other).
  - All specifications must have testability requirements.
  - Impossibility detection for conflicting requirements.

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

## 9. Technical Specification (Groundswell Implementation)

This section details the implementation strategy leveraging the local [Groundswell](~/projects/groundswell) library.

### 9.1 Technology Stack

- **Runtime**: Node.js 20+ / TypeScript 5.2+
- **Core Framework**: Groundswell (local library at `~/projects/groundswell`)
- **LLM Provider**: z.ai (Anthropic compatible API)
- **State Management**: Groundswell `@ObservedState` & `Workflow` persistence

### 9.2 Environment Configuration

The system uses a layered environment configuration strategy with proper fallback handling.

#### 9.2.1 Configuration Source Priority

Configuration is loaded in the following order (later sources override earlier ones):

1. **Shell Environment**: Inherited environment variables
2. **`.env` File**: Local project configuration (automatically loaded by test setup)
3. **Runtime Overrides**: Explicit environment variable settings

#### 9.2.2 Required Environment Variables

- **API Connection**:
  - `ANTHROPIC_AUTH_TOKEN`: z.ai API authentication token (mapped to `ANTHROPIC_API_KEY` for SDK compatibility)
  - `ANTHROPIC_BASE_URL`: API endpoint (defaults to `https://api.z.ai/api/anthropic` if not set)

- **Pipeline Control**:
  - `PRP_PIPELINE_RUNNING`: Guard to prevent nested execution (set to PID when pipeline starts)
  - `SKIP_BUG_FINDING`: Skip bug hunt stage; also identifies bug fix mode when `true`
  - `SKIP_EXECUTION_LOOP`: Internal flag to skip task execution while allowing validation/bug hunt

- **Bug Hunt Configuration**:
  - `BUG_FINDER_AGENT`: Agent used for bug discovery (default: `glp`)
  - `BUG_RESULTS_FILE`: Bug report output file (default: `TEST_RESULTS.md`)
  - `BUGFIX_SCOPE`: Granularity for bug fix tasks (default: `subtask`)

#### 9.2.3 Model Selection

- **`ANTHROPIC_DEFAULT_SONNET_MODEL`**: Model for complex reasoning tasks (default: `GLM-4.7`)
- **`ANTHROPIC_DEFAULT_HAIKU_MODEL`**: Model for faster/lighter tasks (default: `GLM-4.5-Air`)

These values should be read from the environment at runtime, not hardcoded.

#### 9.2.4 API Endpoint Safeguards

**CRITICAL**: All tests and validation scripts enforce z.ai API usage:

- Tests will fail immediately if `ANTHROPIC_BASE_URL` is set to Anthropic's official API (`https://api.anthropic.com`)
- Validation scripts block execution to prevent accidental API usage
- Warnings are issued for non-z.ai endpoints (excluding localhost/mock/test endpoints)

This prevents the massive usage spikes that occurred when tests were accidentally configured to use Anthropic's production API.

#### 9.2.5 Nested Execution Guard

**Problem:** Agents could accidentally invoke `run-prd.sh` during implementation, causing recursive execution and corrupted pipeline state.

**Solution:** The pipeline sets `PRP_PIPELINE_RUNNING` environment variable at script entry and validates it before proceeding.

**Guard Logic:**

1. On pipeline start, check if `PRP_PIPELINE_RUNNING` is already set
2. If set, only allow execution if BOTH conditions are true:
   - `SKIP_BUG_FINDING=true` (legitimate bug fix recursion)
   - `PLAN_DIR` contains "bugfix" (validates bugfix context)
3. If validation fails, exit with clear error message
4. On valid entry, set `PRP_PIPELINE_RUNNING` to current PID

**Session Creation Guards:**

- In bug fix mode, prevent creating sessions in main `plan/` directory
- Bug fix session paths must contain "bugfix" in the path
- Provides debug logging showing `PLAN_DIR`, `SESSION_DIR`, and `SKIP_BUG_FINDING` values

### 9.3 System Components (Groundswell Mapping)

#### 9.3.1 Pipeline Controller (`MainWorkflow`)

The entry point will be a class extending `Workflow` that manages the high-level lifecycle.

```typescript
import { Workflow, Step, ObservedState, Task } from 'groundswell';

class PRPPipeline extends Workflow {
  @ObservedState() sessionPath: string;
  @ObservedState() taskState: TaskRegistry;

  @Step()
  async initializeSession() {
    // Hash PRD, check for deltas, setup plan/ directory
  }

  @Task()
  async executePhase() {
    // Triggers the main loop
  }
}
```

#### 9.3.2 Task Orchestrator

Leverage Groundswell's hierarchical `@Task` feature.

- **Recursive Workflow**: Instead of a flat loop, the `TaskExecutor` can be a recursive workflow where each Phase/Milestone/Task is a sub-workflow.
- **Concurrency**: Use `@Task({ concurrent: true })` for "Parallel Research" where applicable (e.g., researching next tasks while current one executes).

#### 9.3.3 Agent Runtime & Personas

Agents will be instantiated using Groundswell's `createAgent` factory or by extending the `Agent` class.

- **Tooling**: Use `MCPHandler` to register local system tools.
  - `BashTool`: For executing validation scripts and git commands.
  - `FileTool`: For reading/writing PRPs and code.
  - `WebSearchTool`: For external documentation.

#### 9.3.4 Prompt Engineering (From PROMPTS.md)

The critical prompts from `PROMPTS.md` must be ported to a structured format compatible with Groundswell's `Prompt` object.

- **Templates**: Convert raw HEREDOC prompts into TypeScript template literals or external text files loaded at runtime.
- **Structured Output**: For the **Architect Agent**, use Zod schemas to enforce the strict JSON output format required for `tasks.json`.

```typescript
// Example Architect Prompt Definition
const architectPrompt = createPrompt({
  name: 'architect_breakdown',
  user: prdContent,
  system: TASK_BREAKDOWN_SYSTEM_PROMPT, // Ported from PROMPTS.md
  responseFormat: z.object({
    backlog: z.array(
      z.object({
        type: z.literal('Phase'),
        // ... full schema definition
      })
    ),
  }),
});
```

### 9.4 Implementation Roadmap

1.  **Project Setup**:
    - Initialize TypeScript project.
    - Link `groundswell` (`npm link ~/projects/groundswell`).
    - Implement `ConfigService` to normalize z.ai env vars.

2.  **Core Workflows**:
    - Implement `SessionManager` (Filesystem operations).
    - Implement `ArchitectAgent` (using `PROMPTS.md` logic).

3.  **Execution Engine**:
    - Implement `PRPGenerator` (Researcher).
    - Implement `CodeExecutor` (Coder).
    - Integrate `Groundswell`'s caching to save money/time on repeated architectural queries.

4.  **Validation & QA**:
    - Implement `QAAgent` (Bug Hunter).
    - Wrap validation scripts in a `ValidationWorkflow` step.
