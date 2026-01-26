# Workflow Prompts Research

**Research Date:** 2026-01-23
**Work Item:** P2.M1.T2.S2 - Create workflow documentation

## Workflow-Related Prompts from PROMPTS.md

### 1. TASK_BREAKDOWN_SYSTEM_PROMPT (Architect Persona)

**Purpose:** Lead Technical Architect role for project decomposition
**Workflow Phase:** Phase 1 - Task Breakdown/Planning
**Input:** PRD document, codebase access
**Output:** JSON task hierarchy (tasks.json)
**Validation/Retry:** Research-driven validation before decomposition

**Key Features:**

- Defines strict hierarchy: Phase > Milestone > Task > Subtask
- Requires subagent spawning for research
- Enforces "context_scope" contracts for each subtask
- Story point system (0.5, 1, 2 SP max)

### 2. TASK_BREAKDOWN_PROMPT (Execution)

**Purpose:** Execute task decomposition based on system prompt
**Workflow Phase:** Phase 1 - Task Breakdown/Planning (execution)
**Input:** PRD content ($PRD_CONTENT)
**Output:** tasks.json file in current directory
**Validation/Retry:** Research validation before decomposition

**Key Features:**

- Directs agent to spawn subagents for codebase research
- Stores findings in $SESSION_DIR/architecture/
- Creates NEW tasks.json file (never modifies existing)

### 3. PRP_CREATE_PROMPT (The Researcher)

**Purpose:** Generate comprehensive PRPs for specific work items
**Workflow Phase:** Phase 2 - PRP Generation
**Input:** Work item title and description
**Output:** Complete PRP with research documentation
**Validation/Retry:** Context completeness checks, template compliance

**Key Features:**

- Four-stage research process: Codebase, Internal, External, User Clarification
- "No Prior Knowledge" test validation
- Comprehensive PRP template with all sections
- Information density requirements
- Confidence scoring (1-10) for implementation success

### 4. PRP_EXECUTE_PROMPT (The Builder)

**Purpose:** Execute PRP to generate working code
**Workflow Phase:** Phase 3 - Implementation
**Input:** PRP file path
**Output:** Working code passing all validation gates
**Validation/Retry:** 4-level progressive validation system

**Key Features:**

- Mandatory PRP reading before any work
- ULTRATHINK & Plan phase with TodoWrite tool
- Progressive validation (Syntax, Unit Tests, Integration, Creative)
- JSON result format for success/error reporting
- Failure protocol with pattern-based fixes

### 5. DELTA_PRD_GENERATION_PROMPT

**Purpose:** Generate focused delta PRDs for changed requirements
**Workflow Phase:** Delta sessions - Scope Analysis
**Input:** Previous PRD, current PRD, completed tasks
**Output:** Delta PRD at $SESSION_DIR/delta_prd.md
**Validation/Retry:** Reference completed work, avoid duplication

**Key Features:**

- Change detection and impact analysis
- Focuses ONLY on new/modified requirements
- Leverages previous session research
- References existing implementations rather than re-implementing

### 6. TASK_UPDATE_PROMPT

**Purpose:** Update task hierarchy for mid-session PRD changes
**Workflow Phase:** Mid-session integration
**Input:** Original PRD snapshot, updated PRD, current tasks
**Output:** Updated tasks.json file
**Validation/Retry:** Preserve completed work, add new subtasks

**Key Features:**

- Change impact analysis (new/modified/removed)
- Priority handling for affected completed tasks
- "Obsolete" status for removed requirements
- Maintains dependency coherence

### 7. VALIDATION_PROMPT

**Purpose:** Comprehensive project validation and bug detection
**Workflow Phase:** Phase 4 - Quality Assurance
**Input:** PRD, tasks.json
**Output:** validate.sh script, validation_report.md
**Validation/Retry:** Three levels of E2E testing

**Key Features:**

- Discover real user workflows from documentation
- Five validation phases (if applicable in codebase)
- Three-level E2E testing: Internal APIs, External Integrations, Complete User Journeys
- Creates executable validation script

### 8. BUG_FINDING_PROMPT (Adversarial QA)

**Purpose:** Creative bug hunting against PRD scope
**Workflow Phase:** Phase 4 - Bug Hunting
**Input:** Original PRD, completed tasks
**Output:** Bug report file (conditional)
**Validation/Retry:** Four-phase adversarial testing

**Key Features:**

- Four-phase process: PRD Analysis, E2E Testing, Adversarial Testing, Documentation
- Critical file presence/absence signaling system
- Structured bug report with severity classification
- Creates PRD for fixes when bugs found

### 9. CLEANUP_PROMPT

**Purpose:** Session cleanup and preparation for commit
**Workflow Phase:** Phase 5 - Finalization
**Input:** Current state, git diff reference
**Output:** Clean repository state
**Validation/Retry:** Critical file preservation rules

**Key Features:**

- Strict rules about never deleting critical files
- Documentation organization to $SESSION_DIR/docs/
- Gitignore updates for build artifacts
- Root directory cleanup rules

### 10. PREVIOUS_SESSION_CONTEXT_PROMPT

**Purpose:** Ensure delta sessions leverage previous work
**Workflow Phase:** Delta sessions - Context awareness
**Input:** Previous session directory
**Output:** Context awareness for current session
**Validation/Retry:** Priority on previous research over web searches

**Key Features:**

- Documentation priority hierarchy
- Research reuse directive
- Build upon existing patterns

## Prompt-to-Workflow Mapping

| Prompt                      | Workflow Phase          | Used By                         |
| --------------------------- | ----------------------- | ------------------------------- |
| TASK_BREAKDOWN_PROMPT       | Phase 1: Task Breakdown | PRPPipeline.initializeSession() |
| PRP_CREATE_PROMPT           | Phase 2: PRP Generation | PRPPipeline.executeBacklog()    |
| PRP_EXECUTE_PROMPT          | Phase 3: Implementation | PRPPipeline.executeBacklog()    |
| VALIDATION_PROMPT           | Phase 4: QA             | PRPPipeline.runQACycle()        |
| BUG_FINDING_PROMPT          | Phase 4: Bug Hunt       | BugHuntWorkflow                 |
| DELTA_PRD_GENERATION_PROMPT | Delta Session           | DeltaAnalysisWorkflow           |
| TASK_UPDATE_PROMPT          | Delta Session           | PRPPipeline.handleDelta()       |
| CLEANUP_PROMPT              | Phase 5: Cleanup        | PRPPipeline.cleanup()           |

## Prompt Organization Patterns

**Template Structure:**

- All prompts follow markdown format with clear sectioning
- Use of environment variables ($SESSION_DIR, $TASKS_FILE, etc.)
- Consistent output file path specifications

**Workflow Integration:**

- Prompts are chained: Task Breakdown → PRP Creation → PRP Execution → Validation
- State persistence through session directories
- Delta session support for incremental development

**Validation Patterns:**

- Progressive validation with multiple levels
- File-based signaling (bug report presence/absence)
- Research-driven validation before planning
