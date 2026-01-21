# Delta PRD: PRP Development Pipeline Enhancements

**Session ID:** 003_b3d3efdaf0ed
**Parent Session:** 002_1e734971e481
**Delta Date:** 2026-01-17
**Delta From:** plan/002_1e734971e481

---

## Executive Summary

This delta PRD captures **enhancements to the existing PRP Development Pipeline** based on PRD changes. The previous session (002) implemented a production-ready pipeline with all four core engines. This delta focuses on:

1. **Delta Session Robustness** - Enhanced safeguards for delta PRD generation and session recovery
2. **Bug Hunt Pipeline** - Self-contained bug fix sessions with artifact preservation
3. **Nested Execution Guards** - Preventing recursive pipeline invocation
4. **Interactive User Prompts** - User confirmation for destructive operations

**Key Changes from Previous PRD:**

- **Modified:** Section 4.3 (Delta Workflow) - Added retry logic and delta PRD regeneration
- **Modified:** Section 4.4 (Bug Hunt Loop) - Added self-contained sessions and interactive prompts
- **Modified:** Section 5.1 (State Management) - Added protected files list and nested execution guard
- **Modified:** Section 5.2 (Agent Capabilities) - Added agent operational boundaries and forbidden operations
- **Added:** Section 6.6 (PRD Brainstormer Prompt) - New requirements interrogation agent
- **Modified:** Section 9.2 (Environment Configuration) - Added pipeline control variables

---

## Reference to Completed Work

**Previous Session (002) Completed:**

- Phase 1: Bootstrap Core Infrastructure (Complete)
  - Groundswell Integration & Validation (Complete)
  - Environment Configuration & API Safety (Complete)
  - Data Structure Validation (Complete)
- Phase 2: Core Engine Validation (Complete)
  - Session Manager Validation (Complete)
  - Task Orchestrator Validation (Complete)

**Existing Implementation Files:**

- `/src/core/session-manager.ts` (1027 lines) - Full state management with batch updates
- `/src/core/task-orchestrator.ts` (835 lines) - DFS traversal with dependency resolution
- `/src/core/task-patcher.ts` - Task patching for delta sessions
- `/src/workflows/delta-analysis-workflow.ts` - PRD diffing and delta PRD generation
- `/src/workflows/bug-hunt-workflow.ts` - QA bug discovery workflow
- `/src/agents/prp-generator.ts` - PRP creation from research
- `/src/agents/qa-agent.ts` - Adversarial QA testing
- `/src/config/environment.ts` - Environment configuration with z.ai safeguards

**Architecture Research Available:**

- `plan/002_1e734971e481/architecture/groundswell_analysis.md` - Complete Groundswell library reference
- `plan/002_1e734971e481/architecture/system_context.md` - System architecture documentation
- `plan/002_1e734971e481/architecture/research_summary.md` - Research findings summary

---

## Delta Requirements

### 1. Enhanced Delta Session Handling

**Status:** Modified from original PRD Section 4.3

**Original Behavior:**

- Detect PRD hash mismatch
- Create delta session directory
- Generate delta PRD
- Patch tasks.json

**New Requirements:**

#### 1.1 Delta PRD Generation with Retry Logic

**Requirement:** Delta PRD generation must be resilient to agent failures.

**Changes:**

- If delta PRD not created on first attempt, system must demand agent retry
- Session must fail fast if delta PRD cannot be generated after retry
- Incomplete delta sessions must detect and regenerate missing delta PRDs on resume

**Implementation Impact:**

- **File to Modify:** `/src/workflows/delta-analysis-workflow.ts`
- **Logic:**
  - Add retry counter for delta PRD generation
  - Check for `delta_prd.md` existence on session load
  - If missing and session is incomplete, trigger regeneration
  - Fail session if max retries exceeded

#### 1.2 Phase Indexing for Non-Sequential IDs

**Requirement:** Task patcher must handle non-sequential phase IDs in delta sessions.

**Changes:**

- Phase indexing must search for matching IDs rather than assuming sequential order
- Supports delta sessions that add/remove phases dynamically

**Implementation Impact:**

- **File to Modify:** `/src/core/task-patcher.ts`
- **Logic:**
  - Replace array-based phase lookups with ID-based lookups
  - Add `findPhaseById(phaseId: string)` method
  - Update all phase resolution to use search rather than index

---

### 2. Self-Contained Bug Hunt Pipeline

**Status:** Modified from original PRD Section 4.4

**Original Behavior:**

- Bug hunt runs in main session
- Bug reports created at session root
- Tasks mixed with main backlog

**New Requirements:**

#### 2.1 Self-Contained Bug Fix Sessions

**Requirement:** Bug hunt iterations must create isolated numbered sessions.

**Changes:**

- Each bug hunt iteration creates new numbered session: `bugfix/001_hash/`, `bugfix/002_hash/`, etc.
- Bug reports (`TEST_RESULTS.md`) and tasks stored within bugfix session directory
- Treats `TEST_RESULTS.md` as mini-PRD with simplified task breakdown
- Loop: Fix -> Re-test until QA Agent reports no issues

**Implementation Impact:**

- **File to Create:** `/src/core/bugfix-session-manager.ts`
- **File to Modify:** `/src/workflows/bug-hunt-workflow.ts`
- **Logic:**
  - Session structure: `plan/{sequence}_{hash}/bugfix/{sequence}_{hash}/`
  - Bugfix SessionManager creates subdirectory under parent session
  - Task breakdown simplified: one task per bug, 1-3 subtasks max
  - QA Agent compares against bugfix session's `TEST_RESULTS.md`

#### 2.2 Interactive User Prompts

**Requirement:** User must confirm before starting bug hunts or resuming incomplete cycles.

**Changes:**

- Prompt user before starting new bug hunt on completed session
- Prompt user before resuming incomplete bug fix cycle
- Option to archive and start fresh instead of resume

**Implementation Impact:**

- **File to Create:** `/src/utils/user-prompt.ts`
- **File to Modify:** `/src/workflows/bug-hunt-workflow.ts`
- **CLI Integration:** Add prompt handlers in `/src/index.ts` or CLI entry point
- **Logic:**
  - Use readline/inquirer for user interaction
  - Store user choice in session state
  - Implement "archive" option (rename incomplete session with `_archived` suffix)

#### 2.3 Artifact Preservation

**Requirement:** Bug fix artifacts must be archived (not deleted) for audit trail.

**Changes:**

- Never delete bug fix sessions
- Preserve `TEST_RESULTS.md` across iterations
- Maintain history of bugs found and fixed

**Implementation Impact:**

- **File to Modify:** `/src/core/session-manager.ts` - Add `archiveSession()` method
- **Protected Files:** Add bugfix session paths to protected files list
- **Logic:**
  - Bug fix sessions remain after completion
  - Summary shows all bugfix iterations with pass/fail status

---

### 3. Nested Execution Prevention

**Status:** Added to PRD Section 5.1

**New Requirements:**

#### 3.1 PRP_PIPELINE_RUNNING Environment Variable Guard

**Requirement:** Prevent agents from accidentally invoking `run-prd.sh` during implementation.

**Changes:**

- Pipeline sets `PRP_PIPELINE_RUNNING` to current PID on start
- Guard validates before allowing execution
- Only allow nested execution if BOTH conditions true:
  - `SKIP_BUG_FINDING=true` (legitimate bug fix recursion)
  - `PLAN_DIR` contains "bugfix" (validates bugfix context)

**Implementation Impact:**

- **File to Create:** `/src/utils/execution-guard.ts`
- **File to Modify:** `/src/index.ts` or main pipeline entry point
- **Logic:**

  ```typescript
  // On pipeline start
  if (process.env.PRP_PIPELINE_RUNNING) {
    if (!isValidNestedExecution()) {
      console.error('CRITICAL: Nested pipeline execution detected');
      process.exit(1);
    }
  }
  process.env.PRP_PIPELINE_RUNNING = process.pid.toString();

  function isValidNestedExecution(): boolean {
    return (
      process.env.SKIP_BUG_FINDING === 'true' &&
      process.env.PLAN_DIR?.includes('bugfix')
    );
  }
  ```

#### 3.2 Session Creation Guards

**Requirement:** Prevent bug fix mode from creating sessions in main `plan/` directory.

**Changes:**

- Bug fix session paths must contain "bugfix" in path
- Provides debug logging showing `PLAN_DIR`, `SESSION_DIR`, `SKIP_BUG_FINDING`

**Implementation Impact:**

- **File to Modify:** `/src/core/session-manager.ts`
- **Logic:**
  - Add validation in `initialize()` method
  - Throw error if bugfix mode and session path lacks "bugfix"
  - Add debug logging for session path resolution

---

### 4. Agent Operational Boundaries

**Status:** Added to PRD Section 5.2

**New Requirements:**

#### 4.1 Agent Output Scope Restrictions

**Requirement:** Each agent type has strictly defined output scopes and forbidden operations.

**Changes:**

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

**Implementation Impact:**

- **File to Create:** `/src/agents/agent-boundaries.ts`
- **File to Modify:** All agent files in `/src/agents/`
- **Logic:**
  - Create boundary validation middleware for agent tool usage
  - Wrap file operations with boundary checks
  - Add pre-execution validation for each agent type
  - Log boundary violations and block operations

---

### 5. New Agent Persona: PRD Brainstormer

**Status:** Added to PRD Section 6.6

**New Requirements:**

#### 5.1 Requirements Interrogation Engine

**Requirement:** New agent that produces comprehensive PRDs through aggressive questioning rather than invention.

**Agent Role:** Requirements Interrogation and Convergence Engine

**Four-Phase Model:**

1. **Discovery:** Initial requirements gathering
2. **Interrogation:** Deep questioning to uncover gaps and ambiguities
3. **Convergence:** Consolidating answers into coherent specifications
4. **Finalization:** Final PRD generation with testability validation

**Key Rules:**

- Maintains a Decision Ledger for tracking confirmed facts
- Linear questioning rule (no parallel questions that could invalidate each other)
- All specifications must have testability requirements
- Impossibility detection for conflicting requirements

**Implementation Impact:**

- **File to Create:** `/src/agents/prd-brainstormer.ts`
- **File to Create:** `/src/agents/decision-ledger.ts`
- **Prompt Template:** Add to `/src/prompts/prd-brainstormer-prompt.ts`
- **CLI Integration:** Add `prd brainstorm` command
- **Logic:**
  - Interactive conversation loop with user
  - Decision ledger tracks confirmed facts
  - Question queue management (no parallel questions)
  - Testability validation for each requirement
  - Conflict detection and impossibility warnings

---

### 6. Enhanced Task Management CLI

**Status:** Modified from original PRD Section 5.3

**New Requirements:**

#### 6.1 `prd task` Subcommand

**Requirement:** Convenient wrapper to interact with tasks in current session.

**CLI Interface:**

```bash
prd task              # Show tasks for current session
prd task next         # Get next task
prd task status       # Show status
prd task -f <file>    # Override with specific file
```

**Task File Discovery Priority:**

1. Incomplete bugfix session tasks (`SESSION_DIR/bugfix/NNN_hash/tasks.json`)
2. Main session tasks (`SESSION_DIR/tasks.json`)

**Implementation Impact:**

- **File to Modify:** `/src/index.ts` or CLI entry point
- **File to Create:** `/src/cli/task-command.ts`
- **Logic:**
  - Add `task` subcommand to CLI parser
  - Implement file discovery with priority order
  - Pretty-print task hierarchy with status indicators
  - Support filtering by status (next, in-progress, complete, failed)

---

### 7. Pipeline Control Environment Variables

**Status:** Added to PRD Section 9.2

**New Requirements:**

#### 7.1 New Environment Variables

**Pipeline Control:**

- `PRP_PIPELINE_RUNNING`: Guard to prevent nested execution (set to PID when pipeline starts)
- `SKIP_BUG_FINDING`: Skip bug hunt stage; also identifies bug fix mode when `true`
- `SKIP_EXECUTION_LOOP`: Internal flag to skip task execution while allowing validation/bug hunt

**Bug Hunt Configuration:**

- `BUG_FINDER_AGENT`: Agent used for bug discovery (default: `glp`)
- `BUG_RESULTS_FILE`: Bug report output file (default: `TEST_RESULTS.md`)
- `BUGFIX_SCOPE`: Granularity for bug fix tasks (default: `subtask`)

**Implementation Impact:**

- **File to Modify:** `/src/config/environment.ts`
- **File to Modify:** `/src/config/constants.ts`
- **Logic:**
  - Add new constants for default values
  - Add validation for pipeline control variables
  - Document each variable with usage examples

---

## Implementation Phases

### Phase 3: Delta Session Robustness (NEW)

**Status:** Ready for implementation

**Milestone P3.M1: Delta PRD Generation Safeguards**

- Task P3.M1.T1: Implement delta PRD retry logic
  - S1: Add retry counter to DeltaAnalysisWorkflow (2 SP)
  - S2: Detect and regenerate missing delta PRDs on resume (2 SP)
  - S3: Fail fast after max retries exceeded (1 SP)

- Task P3.M1.T2: Fix phase indexing for non-sequential IDs
  - S1: Implement findPhaseById() in TaskPatcher (2 SP)
  - S2: Replace array-based lookups with ID-based lookups (2 SP)
  - S3: Add tests for non-sequential phase IDs (1 SP)

**Milestone P3.M2: Bug Hunt Pipeline Enhancement**

- Task P3.M2.T1: Implement self-contained bug fix sessions
  - S1: Create BugfixSessionManager for subdirectory creation (3 SP)
  - S2: Simplify task breakdown for bug fixes (one task per bug) (2 SP)
  - S3: Store TEST_RESULTS.md within bugfix session (1 SP)

- Task P3.M2.T2: Add interactive user prompts
  - S1: Create user prompt utility for CLI interaction (2 SP)
  - S2: Add pre-bug hunt confirmation prompt (1 SP)
  - S3: Add resume confirmation with archive option (2 SP)

- Task P3.M2.T3: Implement artifact preservation
  - S1: Add archiveSession() method to SessionManager (1 SP)
  - S2: Update protected files list for bugfix sessions (1 SP)
  - S3: Add bugfix history summary display (1 SP)

**Milestone P3.M3: Nested Execution Prevention**

- Task P3.M3.T1: Implement PRP_PIPELINE_RUNNING guard
  - S1: Create execution-guard utility (2 SP)
  - S2: Add guard to pipeline entry point (1 SP)
  - S3: Add nested execution validation logic (2 SP)

- Task P3.M3.T2: Add session creation guards
  - S1: Validate bugfix session paths contain "bugfix" (1 SP)
  - S2: Add debug logging for session path resolution (1 SP)
  - S3: Prevent main plan/ directory creation in bugfix mode (1 SP)

**Milestone P3.M4: Agent Operational Boundaries**

- Task P3.M4.T1: Create agent boundary validation system
  - S1: Define boundary rules for each agent type (2 SP)
  - S2: Implement boundary middleware for file operations (2 SP)
  - S3: Add universal forbidden operations enforcement (1 SP)

- Task P3.M4.T2: Integrate boundaries into existing agents
  - S1: Add boundary checks to TaskBreakdownAgent (1 SP)
  - S2: Add boundary checks to PRPGenerator (1 SP)
  - S3: Add boundary checks to CodeExecutor (1 SP)
  - S4: Add boundary checks to QAAgent (1 SP)

**Milestone P3.M5: PRD Brainstormer Agent**

- Task P3.M5.T1: Implement PRD Brainstormer core
  - S1: Create DecisionLedger for fact tracking (2 SP)
  - S2: Implement four-phase conversation model (3 SP)
  - S3: Add linear questioning queue management (2 SP)

- Task P3.M5.T2: Add testability and conflict detection
  - S1: Implement testability validation for requirements (2 SP)
  - S2: Add impossibility detection for conflicts (2 SP)
  - S3: Create convergence logic for answers (2 SP)

- Task P3.M5.T3: CLI integration for PRD brainstorming
  - S1: Add `prd brainstorm` command (1 SP)
  - S2: Implement interactive conversation loop (2 SP)
  - S3: Add PRD generation output (1 SP)

**Milestone P3.M6: Enhanced Task Management CLI**

- Task P3.M6.T1: Implement `prd task` subcommand
  - S1: Create task-command.ts for CLI (1 SP)
  - S2: Implement task file discovery with priority (2 SP)
  - S3: Add pretty-print for task hierarchy (1 SP)

- Task P3.M6.T2: Add task status and filtering
  - S1: Implement status indicators (1 SP)
  - S2: Add filtering by status (next, in-progress, etc.) (1 SP)
  - S3: Support file override with -f flag (1 SP)

**Milestone P3.M7: Environment Configuration Enhancement**

- Task P3.M7.T1: Add pipeline control variables
  - S1: Define constants for new variables (1 SP)
  - S2: Add validation for pipeline control (1 SP)
  - S3: Document variable usage (1 SP)

- Task P3.M7.T2: Add bug hunt configuration variables
  - S1: Define bug hunt configuration constants (1 SP)
  - S2: Add validation for bug hunt vars (1 SP)
  - S3: Integrate with BugHuntWorkflow (1 SP)

---

## Testing Strategy

### Delta Session Testing

**Test Scenarios:**

1. Delta PRD generation failure and retry
2. Missing delta PRD regeneration on resume
3. Non-sequential phase ID resolution
4. Session failure after max retries

### Bug Hunt Pipeline Testing

**Test Scenarios:**

1. Self-contained bugfix session creation
2. Bugfix session directory structure validation
3. Interactive prompt acceptance/rejection
4. Archive and restart functionality
5. Artifact preservation across iterations
6. Bugfix history summary generation

### Nested Execution Testing

**Test Scenarios:**

1. Blocked nested execution without SKIP_BUG_FINDING
2. Allowed nested execution with bugfix context
3. Session creation guard validation
4. Debug logging verification

### Agent Boundary Testing

**Test Scenarios:**

1. Task Breakdown Agent forbidden operations blocked
2. PRP Generator forbidden operations blocked
3. Code Executor forbidden operations blocked
4. QA Agent forbidden operations blocked
5. Universal forbidden operations enforcement

### PRD Brainstormer Testing

**Test Scenarios:**

1. Decision Ledger fact tracking
2. Linear questioning queue management
3. Four-phase conversation flow
4. Testability validation
5. Conflict detection and impossibility warnings
6. PRD generation from gathered requirements

---

## Rollout Plan

### Phase 1: Core Safeguards (Week 1)

- Implement nested execution guard
- Add agent boundary validation
- Implement delta PRD retry logic

### Phase 2: Bug Hunt Enhancement (Week 2)

- Implement self-contained bugfix sessions
- Add interactive user prompts
- Implement artifact preservation

### Phase 3: New Features (Week 3)

- Implement PRD Brainstormer agent
- Add enhanced task CLI
- Complete environment configuration

### Phase 4: Testing & Validation (Week 4)

- Comprehensive delta session testing
- Bug hunt pipeline end-to-end testing
- Agent boundary violation testing
- PRD Brainstormer validation

---

## Dependencies

**On Previous Session (002):**

- All Phase 1 and Phase 2 tasks must be complete
- SessionManager must have batch update system working
- TaskOrchestrator must have DFS traversal validated
- DeltaAnalysisWorkflow must exist for modification

**External Dependencies:**

- None new (Groundswell library already integrated)

**New Dependencies:**

- None (all enhancements use existing patterns)

---

## Risks and Mitigations

### Risk 1: Delta PRD Regeneration Loops

**Risk:** Agent repeatedly fails to generate delta PRD, causing infinite retry loop.

**Mitigation:** Max retry limit (3 attempts), fail fast with clear error message, preserve original PRDs for manual delta creation.

### Risk 2: Bug Fix Session Proliferation

**Risk:** Too many bugfix sessions created without cleanup, cluttering directory structure.

**Mitigation:** Artifact preservation is intentional (audit trail), implement summary view, add archive old sessions command in future.

### Risk 3: Agent Boundary Over-Constraint

**Risk:** Boundaries too restrictive, blocking legitimate operations.

**Mitigation:** Extensive testing of each agent type, allow boundary overrides with explicit warnings, monitor boundary violations in production.

### Risk 4: PRD Brainstormer Agent Hallucination

**Risk:** Agent invents requirements rather than interrogating user.

**Mitigation:** Decision Ledger enforces fact tracking, linear questioning prevents assumption conflicts, testability validation requires concrete specifications.

---

## Success Criteria

### Delta Session Robustness

- [ ] Delta PRD generation succeeds on first attempt in 95% of cases
- [ ] Missing delta PRDs automatically regenerated on resume
- [ ] Non-sequential phase IDs resolve correctly
- [ ] Failed delta sessions clear error messages

### Bug Hunt Pipeline

- [ ] Bugfix sessions created in correct subdirectory structure
- [ ] User prompts displayed before destructive operations
- [ ] Artifacts preserved across all bugfix iterations
- [ ] Bugfix history accurately reflects all iterations

### Nested Execution Prevention

- [ ] Nested execution blocked without proper context
- [ ] Bugfix recursion allowed with SKIP_BUG_FINDING=true
- [ ] Session creation guards prevent invalid paths
- [ ] Debug logging provides clear context

### Agent Boundaries

- [ ] All agents respect operational boundaries
- [ ] Forbidden operations blocked and logged
- [ ] No agent modifies protected files
- [ ] Boundary violations cause clear error messages

### PRD Brainstormer

- [ ] Decision Ledger accurately tracks facts
- [ ] Linear questioning prevents conflicts
- [ ] Testability validation catches untestable requirements
- [ ] Conflict detection identifies impossibilities
- [ ] Generated PRDs are comprehensive and testable

---

## Appendix: File Changes Summary

### Files to Modify

- `/src/workflows/delta-analysis-workflow.ts` - Add retry logic
- `/src/core/task-patcher.ts` - Fix phase indexing
- `/src/workflows/bug-hunt-workflow.ts` - Self-contained sessions
- `/src/core/session-manager.ts` - Bugfix support, archive method
- `/src/config/environment.ts` - New environment variables
- `/src/config/constants.ts` - Pipeline control constants
- `/src/agents/*.ts` - Add boundary checks to all agents
- `/src/index.ts` - Add guards and CLI commands

### Files to Create

- `/src/core/bugfix-session-manager.ts` - Bugfix session management
- `/src/utils/execution-guard.ts` - Nested execution prevention
- `/src/utils/user-prompt.ts` - Interactive CLI prompts
- `/src/agents/agent-boundaries.ts` - Boundary validation system
- `/src/agents/prd-brainstormer.ts` - Requirements interrogation agent
- `/src/agents/decision-ledger.ts` - Fact tracking for brainstormer
- `/src/cli/task-command.ts` - Task management CLI
- `/src/prompts/prd-brainstormer-prompt.ts` - Brainstormer system prompt

---

**End of Delta PRD**

This delta PRD is self-contained but references the completed work from session 002. All new requirements build upon the existing production-ready pipeline.
