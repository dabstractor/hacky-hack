# System Context & Current Architecture

## Executive Summary

The **PRP Pipeline** is a fully-functional TypeScript-based autonomous development system currently implemented at `/home/dustin/projects/hacky-hack`. This document captures the current state to inform the bootstrap/refactoring effort described in the PRD.

**Key Finding**: The system described in the PRD is **already implemented**. The PRD appears to be a retrospective specification or blueprint for the existing system, rather than requirements for a new build.

## Current Implementation Status

### ✅ Already Implemented Components

| Component | PRD Section | Current Implementation | Status |
|-----------|-------------|------------------------|--------|
| **Session Manager** | §3.1, §5.1 | `src/core/session-manager.ts` (1172 lines) | ✅ Complete |
| **Task Orchestrator** | §3.2, §5.3 | `src/core/task-orchestrator.ts` (836 lines) | ✅ Complete |
| **Agent Runtime** | §3.3, §6 | `src/agents/` directory with factory pattern | ✅ Complete |
| **Pipeline Controller** | §3.4 | `src/workflows/prp-pipeline.ts` (1848 lines) | ✅ Complete |
| **Delta Sessions** | §4.3 | Delta analysis workflow + task patcher | ✅ Complete |
| **Bug Hunt Workflow** | §4.4, §6.5 | BugHuntWorkflow + FixCycleWorkflow | ✅ Complete |
| **CLI Interface** | - | `src/cli/index.ts` with Commander.js | ✅ Complete |
| **MCP Tools** | §5.2 | BashMCP, FilesystemMCP, GitMCP | ✅ Complete |
| **State Persistence** | §5.1 | tasks.json with atomic writes | ✅ Complete |
| **Smart Commits** | §5.1 | Git commit automation | ✅ Complete |

### 📊 Codebase Metrics

- **Total Lines**: ~10,000+ lines of TypeScript
- **Test Coverage**: 100% coverage requirement (Vitest)
- **Dependencies**: 15 production, 20 dev dependencies
- **Groundswell Integration**: Full decorator-based workflow system

## Architecture Patterns

### 1. Groundswell-Based Workflow System

The system uses the **Groundswell** library (`~/projects/groundswell`) as its foundational framework:

```typescript
import { Workflow, Step, ObservedState, Task } from 'groundswell';

class PRPPipeline extends Workflow {
  @ObservedState()
  sessionManager!: SessionManager;

  @Step({ snapshotState: true, trackTiming: true })
  async initializeSession(): Promise<void> {
    // PRD hashing, session directory creation
  }

  @Task()
  async executePhase(): Promise<void> {
    // Hierarchical task execution
  }
}
```

**Key Decorators**:
- `@ObservedState()`: Automatic state tracking and snapshots
- `@Step()`: Wraps methods with timing, logging, and error handling
- `@Task({ concurrent: true })`: Spawns parallel child workflows

### 2. Multi-Agent Architecture

Four specialized agents created via `AgentFactory`:

| Agent | Role | Model | Max Tokens | Cache |
|-------|------|-------|------------|-------|
| **Architect** | PRD → Task Breakdown | GLM-4.7 | 8192 | ✅ |
| **Researcher** | Task → PRP Generation | GLM-4.7 | 4096 | ✅ |
| **Coder** | PRP → Implementation | GLM-4.7 | 4096 | ✅ |
| **QA** | Bug Hunting | GLM-4.7 | 4096 | ✅ |

All agents share the same MCP tools:
- **BashMCP**: Shell command execution
- **FilesystemMCP**: File I/O, glob, grep
- **GitMCP**: Git operations

### 3. Session State Management

**Session Structure**:
```
plan/
├── 001_14b9dc2a33c7/          # Session directory (sequence_hash)
│   ├── tasks.json              # Backlog (single source of truth)
│   ├── prd_snapshot.md         # PRD content hash
│   ├── parent_session.txt      # Delta linkage
│   ├── prps/                   # Generated PRPs
│   │   ├── P1M1T1S1.md
│   │   └── .cache/             # PRP cache metadata (24hr TTL)
│   ├── artifacts/              # Execution artifacts
│   │   └── P1M1T1S1/
│   │       ├── validation-results.json
│   │       ├── execution-summary.md
│   │       └── artifacts-list.json
│   └── TEST_RESULTS.md         # QA bug report
```

**Key Features**:
- PRD hash-based session detection (SHA-256, first 12 chars)
- Delta session creation for PRD changes
- Atomic state updates (temp file + rename pattern)
- Batching pattern for performance (flush on checkpoint)

### 4. Task Hierarchy & Dependency Resolution

**Data Model** (from `src/core/models.ts`):

```typescript
interface Backlog {
  backlog: Phase[];
}

interface Phase {
  type: 'Phase';
  id: string;                    // "P1"
  title: string;
  status: Status;                // Planned | Researching | Implementing | Complete | Failed
  description: string;
  milestones: Milestone[];
}

interface Milestone {
  type: 'Milestone';
  id: string;                    // "P1.M1"
  title: string;
  status: Status;
  description: string;
  tasks: Task[];
}

interface Task {
  type: 'Task';
  id: string;                    // "P1.M1.T1"
  title: string;
  status: Status;
  description: string;
  subtasks: Subtask[];
}

interface Subtask {
  type: 'Subtask';
  id: string;                    // "P1.M1.T1.S1"
  title: string;
  status: Status;
  story_points: number;          // 0.5, 1, or 2 (max 2)
  dependencies: string[];        // Subtask IDs
  context_scope: string;         // CONTRACT DEFINITION format
}
```

**Traversal Algorithm**: Depth-first pre-order
```
Phase → Milestone → Task → Subtask (execute)
```

**Dependency Resolution**:
```typescript
canExecute(subtask): boolean {
  const dependencies = getDependencies(subtask, backlog);
  return dependencies.every(dep => dep.status === 'Complete');
}
```

### 5. PRP (Product Requirement Prompt) System

**PRP Template Structure** (from `PROMPTS.md`):

```markdown
# PRP: [Subtask ID] - [Subtask Title]

## Goal
- Feature Goal
- Deliverable
- Success Definition

## User Persona
- Target User
- Use Case
- User Journey
- Pain Points

## Why
- Business Value
- Integration Points
- Problems Solved

## What
- User-Visible Behavior
- Success Criteria

## All Needed Context
- Documentation & References
- Codebase Tree
- Gotchas & Patterns

## Implementation Blueprint
- Data Models
- Implementation Tasks
- Patterns to Follow
- Integration Points

## Validation Loop
- Level 1: Syntax & Style
- Level 2: Unit Tests
- Level 3: Integration Tests
- Level 4: Creative & Domain-Specific

## Final Validation Checklist

## Anti-Patterns to Avoid
```

**Cache System**:
- Key: SHA-256 hash of task definition
- TTL: 24 hours
- Metadata: Stored in `prps/.cache/{taskId}.json`
- Cache hit detection: Compare task hash with cached metadata

### 6. Progressive Validation System

**4-Level Gates** (from PRP Execution Prompt):

1. **Syntax & Style**: Immediate feedback
   - Tools: `ruff`, `mypy`, `prettier`, `eslint`
   - Fail-fast: Continue on warnings, fail on errors

2. **Unit Tests**: Component validation
   - Tools: `pytest`, `jest`, `vitest`
   - Coverage threshold enforcement

3. **Integration Testing**: System validation
   - API endpoints
   - Service integration
   - Database operations

4. **Creative & Domain-Specific**: Business logic
   - MCP tools for custom validation
   - Performance benchmarks
   - Security scans

**Fix Cycle**:
- Max 2 attempts with exponential backoff
- Automatic retry on validation failure
- Artifact preservation for debugging

### 7. Delta Session Workflow

**Trigger**: PRD hash mismatch detected

**Process**:
1. Load old PRD from `prd_snapshot.md`
2. Load new PRD from disk
3. Run `DeltaAnalysisWorkflow` to compute diffs
4. Generate `delta_prd.md` focusing on changes
5. Use `TaskPatcher` to apply patches:
   - New requirements → Add new tasks
   - Modified requirements → Mark for re-implementation
   - Removed requirements → Mark as obsolete
6. Create new session with `parent_session.txt` reference
7. Resume execution from modified tasks

**Retry Logic** (from PRD):
- If delta PRD not created on first attempt, demand retry
- Fail fast if delta PRD cannot be generated after retry
- Incomplete delta sessions detect and regenerate missing delta PRDs on resume

### 8. Bug Hunt & Fix Cycle

**Bug Hunt Workflow** (3 phases):

1. **Scope Analysis**: Understand PRD requirements
2. **Creative E2E Testing**: Happy paths, edge cases, workflows, integrations, errors, state, concurrency
3. **Adversarial Testing**: Unexpected inputs, missing features, incomplete features, UX issues

**Bug Severity Levels**:
- `critical`: Blocks core functionality
- `major`: Significantly impacts UX/functionality
- `minor`: Small improvements
- `cosmetic`: Polish items

**Fix Cycle** (Self-Contained Sessions):
```
bugfix/
├── 001_hash/                  # First bug hunt iteration
│   ├── tasks.json              # One task per bug (1-3 subtasks max)
│   └── TEST_RESULTS.md         # Original bug report
├── 002_hash/                  # Second iteration (if bugs remain)
│   ├── tasks.json
│   └── TEST_RESULTS.md
└── ...
```

**Termination**: Loop until QA Agent reports no issues

**Interactive Prompts**:
- Before starting bug hunt on completed session
- Before resuming incomplete bug fix cycle (with archive option)

**Artifact Preservation**: Bug fix artifacts are archived (not deleted) for audit trail

## Technology Stack

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | >=20.0.0 | JavaScript runtime |
| **Language** | TypeScript | 5.2+ | Type-safe development |
| **Framework** | Groundswell | 0.0.1 | Workflow orchestration |
| **LLM Provider** | z.ai | - | GLM-4.7, GLM-4.5-Air models |
| **Test Runner** | Vitest | 1.6.1 | Unit/integration tests |
| **CLI Parser** | Commander.js | 14.0.2 | Command-line interface |

### Key Dependencies

**Production**:
- `@anthropic-ai/sdk`: LLM API client
- `zod`: Schema validation
- `pino`: Structured logging
- `fast-glob`: File globbing
- `simple-git`: Git operations

**Development**:
- `tsx`: TypeScript execution
- `vitest`: Test framework
- `esbuild`: Fast builds
- `prettier`: Code formatting
- `eslint`: Linting

### Module System

**ES Modules** (`.js` extensions required):
```typescript
import { Workflow } from 'groundswell';
import { SessionManager } from './core/session-manager.js';
```

**Path Resolution**:
- Groundswell linked via local path alias in `vitest.config.ts`
- Absolute imports recommended for stability

## Environment Configuration

### API Provider: z.ai

**Environment Variables**:
```bash
# Authentication
ANTHROPIC_AUTH_TOKEN=z.ai_api_key_here
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic

# Models (mapped internally)
ANTHROPIC_DEFAULT_SONNET_MODEL=GLM-4.7
ANTHROPIC_DEFAULT_HAIKU_MODEL=GLM-4.5-Air
```

**Mapping**:
- Shell uses `ANTHROPIC_AUTH_TOKEN`
- SDK expects `ANTHROPIC_API_KEY`
- System automatically maps AUTH_TOKEN → API_KEY

### Pipeline Control Flags

```bash
PRP_PIPELINE_RUNNING=<PID>        # Prevents nested execution
SKIP_BUG_FINDING=true             # Skip bug hunt (also bug fix mode)
SKIP_EXECUTION_LOOP=true          # Skip execution, run validation/bug hunt only

# Bug Hunt Configuration
BUG_FINDER_AGENT=glp              # Agent for bug discovery
BUG_RESULTS_FILE=TEST_RESULTS.md  # Bug report output
BUGFIX_SCOPE=subtask              # Granularity for bug fix tasks
```

### API Endpoint Safeguards

**CRITICAL**: Tests enforce z.ai API usage
- Tests fail immediately if `ANTHROPIC_BASE_URL` is `https://api.anthropic.com`
- Validation scripts block execution to prevent accidental API usage
- Warnings for non-z.ai endpoints (excluding localhost/mock/test)

### Nested Execution Guard

**Logic**:
1. On pipeline start, check if `PRP_PIPELINE_RUNNING` is already set
2. If set, only allow execution if BOTH:
   - `SKIP_BUG_FINDING=true` (legitimate bug fix recursion)
   - `PLAN_DIR` contains "bugfix" (validates bugfix context)
3. If validation fails, exit with clear error message
4. On valid entry, set `PRP_PIPELINE_RUNNING` to current PID

**Session Creation Guards**:
- In bug fix mode, prevent creating sessions in main `plan/` directory
- Bug fix session paths must contain "bugfix" in the path
- Debug logging shows `PLAN_DIR`, `SESSION_DIR`, `SKIP_BUG_FINDING` values

## Limitations & Pain Points

### Concurrency Issues

1. **File Handle Monitoring Overhead** (macOS):
   - Uses `lsof` command (slower, requires spawn)
   - Impact: Resource exhaustion detection is slower

2. **Sequential Subtask Execution**:
   - No parallel subtask execution despite dependency resolution support
   - Impact: With hundreds of subtasks, execution time is linear

3. **Fixed ResearchQueue Concurrency**:
   - Concurrency limit hardcoded to 3
   - Not configurable based on workload

### State Management Problems

1. **Batching State Corruption Risk**:
   - If `flushUpdates()` fails, retry is required
   - No automatic retry mechanism
   - Pending updates preserved on error

2. **Session Manager Singleton**:
   - No support for multi-session concurrent execution
   - Assumes single session per process

3. **PRD Hash Computed Once**:
   - Cannot detect PRD changes after session initialization
   - Requires re-computing hash to detect changes

### Error Handling Gaps

1. **Individual Task Failures**:
   - Failed tasks don't stop pipeline (continue to next)
   - No automatic retry mechanism for failed tasks

2. **Fix Cycle Failure**:
   - If fix cycle fails, original bugs remain
   - Pipeline continues without fixing bugs

3. **Cache Load Failures**:
   - Silent failures (cache corruption causes cache miss)
   - No logging of cache parse errors

### Performance Bottlenecks

1. **Sequential Task Execution**:
   - Linear execution time for hundreds of subtasks

2. **PRP Cache TTL Fixed at 24 Hours**:
   - Not configurable based on use case

3. **Resource Monitoring Overhead**:
   - File handle counting via spawn adds overhead
   - Heap stats on every task execution

4. **Research Queue Fire-and-Forget**:
   - No visibility into background research progress
   - Errors logged but not tracked

5. **Large PRP Files**:
   - PRPs stored as markdown files
   - Large projects increase agent token usage

## Protected Files

**NEVER delete or move** (from PRD §5.1):
- `$SESSION_DIR/tasks.json`
- `$SESSION_DIR/prd_snapshot.md`
- `$SESSION_DIR/delta_prd.md`
- `$SESSION_DIR/delta_from.txt`
- `$SESSION_DIR/TEST_RESULTS.md`
- `PRD.md` (human-owned)
- Any file matching `*tasks*.json` pattern
- Any file directly in `$SESSION_DIR/` root

## Forbidden Operations (All Agents)

**Universal** (from PRD §5.2):
- Never modify `PRD.md` (human-owned document)
- Never add `plan/`, `PRD.md`, or task files to `.gitignore`
- Never run `prd`, `run-prd.sh`, or `tsk` commands (prevents recursive execution)
- Never create session-pattern directories (`[0-9]*_*`) outside designated locations

## CLI Interface

**Command**: `prd` (via `src/index.ts`)

**Modes**:
- `normal`: Full pipeline execution (default)
- `bug-hunt`: Run QA workflow only
- `validate`: Run validation scripts only

**Options**:
- `--prd <path>`: PRD file path
- `--scope <scope>`: Limit execution (e.g., "P3.M4")
- `--mode <mode>`: Execution mode
- `--continue`: Resume from previous session
- `--dry-run`: Show plan without executing
- `--no-cache`: Bypass PRP cache
- `--continue-on-error`: Treat errors as non-fatal
- `--max-tasks <number>`: Task limit
- `--max-duration <ms>`: Duration limit

**Task Subcommand**:
```bash
prd task              # Show tasks for current session
prd task next         # Get next task
prd task status       # Show status
prd task -f <file>    # Override with specific file
```

**Task File Discovery Priority**:
1. Incomplete bugfix session tasks
2. Main session tasks

## Key Files Reference

### Entry Points
- `src/index.ts`: Main CLI entry point
- `src/cli/index.ts`: CLI argument parsing
- `src/workflows/prp-pipeline.ts`: Primary pipeline workflow

### Core Logic
- `src/core/models.ts`: Type definitions and Zod schemas
- `src/core/session-manager.ts`: Session state management
- `src/core/task-orchestrator.ts`: Task execution coordination
- `src/core/prd-differ.ts`: PRD change detection
- `src/core/task-patcher.ts`: Delta session task patching

### Agent System
- `src/agents/agent-factory.ts`: Agent creation factory
- `src/agents/prp-runtime.ts`: Research→implementation orchestration
- `src/agents/prp-generator.ts`: PRP generation from tasks
- `src/agents/prp-executor.ts`: PRP execution and validation

### Tools
- `src/tools/bash-mcp.ts`: Shell command execution
- `src/tools/filesystem-mcp.ts`: File operations
- `src/tools/git-mcp.ts`: Git operations

### Configuration
- `src/config/environment.ts`: Environment variable management
- `src/config/constants.ts`: Model names and defaults

## Conclusion

The PRP Pipeline is a **production-ready, fully-implemented system** built with:
- Solid TypeScript foundation (ES Modules, strict typing, 100% test coverage)
- Groundswell integration (decorators, agents, workflows, MCP tools)
- Multi-agent architecture (specialized agents for different phases)
- Robust state management (immutable models, session persistence, delta execution)
- Comprehensive tooling (Bash, filesystem, Git MCP tools)
- Production-grade features (structured logging, error handling, CLI, validation)

The PRD appears to be a **retrospective specification** documenting the architecture and features of the existing system, rather than requirements for a new implementation. Any future work should focus on:
1. Addressing the limitations and pain points identified above
2. Enhancing concurrency and performance
3. Improving error handling and retry mechanisms
4. Adding observability and monitoring
5. Refactoring based on lessons learned

**Critical**: The system is already complete. Do not rebuild from scratch. Use this architecture documentation to understand the current state before making modifications.
