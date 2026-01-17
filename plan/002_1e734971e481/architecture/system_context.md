# System Context: PRP Development Pipeline

**Research Date:** 2026-01-15
**Project:** hacky-hack / Autonomous PRP Development Pipeline
**Status:** ✅ EXISTING IMPLEMENTATION - Enhancement Project

---

## Executive Summary

The **hacky-hack** project is a **mature, production-ready TypeScript application** implementing an Autonomous PRP (Product Requirement Prompt) Development Pipeline. The system converts high-level Product Requirements Documents (PRDs) into fully implemented, tested codebases with minimal human intervention.

**Critical Finding:** This is **NOT a greenfield project**. The codebase contains **69 TypeScript files with ~29,249 lines of production code**. All four core components (Session Manager, Task Orchestrator, Agent Runtime, Pipeline Controller) are **already fully implemented**.

---

## 1. Current Implementation Status

### 1.1 Component Completeness

| Component               | Status      | Implementation                                   | File Location                    |
| ----------------------- | ----------- | ------------------------------------------------ | -------------------------------- |
| **Session Manager**     | ✅ COMPLETE | 1027 lines, batch updates, delta sessions        | `/src/core/session-manager.ts`   |
| **Task Orchestrator**   | ✅ COMPLETE | 835 lines, DFS traversal, dependency resolution  | `/src/core/task-orchestrator.ts` |
| **Agent Runtime**       | ✅ COMPLETE | PRPRuntime with research→implement→validate loop | `/src/agents/prp-runtime.ts`     |
| **Pipeline Controller** | ✅ COMPLETE | 1840 lines, full lifecycle, graceful shutdown    | `/src/workflows/prp-pipeline.ts` |

### 1.2 Additional Implemented Components

- **PRP Generator** - Generates Product Requirement Prompts from subtasks
- **PRP Executor** - Executes PRPs with 4-level validation gates
- **Research Queue** - Parallel PRP generation with caching (max 3 concurrent)
- **Delta Workflow** - Handles PRD changes with delta analysis
- **Bug Hunt Workflow** - QA testing with adversarial bug detection
- **Fix Cycle Workflow** - Iterative bug resolution
- **Agent Factory** - Creates architect, researcher, coder, QA agents
- **MCP Tools** - Bash, Filesystem, Git tools implemented
- **Configuration Service** - z.ai API compatibility layer
- **Logger** - Structured logging with Pino
- **Error Hierarchy** - 10+ error types with error codes
- **Resource Monitor** - File handle and memory limits

### 1.3 Project Maturity Indicators

✅ **Production-Ready Features:**

- Comprehensive error handling and recovery
- Graceful shutdown (SIGINT/SIGTERM)
- Resource monitoring and limits
- Structured logging and observability
- Test infrastructure (Vitest with 100% coverage requirements)
- CLI with multiple execution modes
- Documentation generation
- Validation scripts
- Smart git commits

---

## 2. Technology Stack

### 2.1 Core Technologies

| Technology      | Version             | Purpose                             |
| --------------- | ------------------- | ----------------------------------- |
| **Node.js**     | 20+                 | Runtime environment                 |
| **TypeScript**  | 5.2+                | Application language                |
| **Groundswell** | 0.0.3 (local)       | Hierarchical workflow orchestration |
| **z.ai API**    | (via Anthropic SDK) | LLM provider (GLM-4.7, GLM-4.5-Air) |

### 2.2 Key Dependencies

**Production:**

- `commander` ^14.0.2 - CLI argument parsing
- `pino` ^9.14.0 - Structured logging
- `simple-git` ^3.30.0 - Git operations
- `zod` ^3.22.4 - Runtime type validation
- `fast-glob` ^3.3.3 - Pattern-based file matching

**Development:**

- `vitest` ^1.6.1 - Testing framework with 100% coverage enforcement
- `tsx` ^4.7.0 - TypeScript execution engine
- `esbuild` ^0.27.2 - Fast bundling (used by Vitest)
- `@anthropic-ai/sdk` ^0.71.1 - Anthropic API client (via Groundswell)

### 2.3 Module System

- **Type:** ESM modules (`"type": "module"`)
- **Resolution:** NodeNext (native ESM support)
- **Path Aliases:**
  - `@` → `./src`
  - `#` → `./src/agents`
  - `groundswell` → `../groundswell/dist/index.js`

---

## 3. Architecture Patterns

### 3.1 Dominant Design Patterns

1. **Factory Pattern** - Agent creation via `agent-factory.ts`
2. **Repository Pattern** - Session persistence via `SessionManager`
3. **Strategy Pattern** - Agent personas (architect, researcher, coder, qa)
4. **Observer Pattern** - Workflow observability via Groundswell
5. **Template Method** - Groundswell `Workflow` base class with `@Step` decorators
6. **Immutability Pattern** - Readonly interfaces, immutable update utilities
7. **Batch Pattern** - Atomic updates in SessionManager
8. **Error Hierarchy** - Structured error types (PipelineError, TaskError, AgentError, etc.)
9. **Dependency Injection** - Constructor injection of SessionManager, TaskOrchestrator
10. **Decorator Pattern** - Groundswell decorators (@Step, @Task, @ObservedState)

### 3.2 Architecture Layer Structure

```
┌─────────────────────────────────────────┐
│         CLI Layer (cli/)                │  ← User interaction
│  - Argument parsing                      │
│  - Environment configuration             │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Pipeline Controller (workflows/)    │  ← Orchestration
│  - PRPPipeline (extends Workflow)        │
│  - DeltaAnalysisWorkflow                 │
│  - BugHuntWorkflow                       │
│  - FixCycleWorkflow                      │
└─────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ Session │ │   Task   │ │  PRP Runtime │  ← Core engines
│Manager  │ │Orchestr. │ │   (agents/)  │
└─────────┘ └──────────┘ └──────────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  Groundswell Agents  │  ← AI execution
                      │  - Architect         │
                      │  - Researcher        │
                      │  - Coder             │
                      │  - QA                │
                      └──────────────────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │    MCP Tools         │  ← System interface
                      │  - Bash              │
                      │  - Filesystem        │
                      │  - Git               │
                      └──────────────────────┘
```

---

## 4. Groundswell Integration

### 4.1 Integration Status

**Status:** ✅ **FULLY INTEGRATED** via npm link

**Library Location:** `/home/dustin/projects/hacky-hack/node_modules/groundswell` → `~/projects/groundswell`

**Import Pattern:**

```typescript
import { createAgent, type Agent, type MCPHandler } from 'groundswell';
import { Workflow, Step } from 'groundswell';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';
import { createPrompt, type Prompt } from 'groundswell';
```

**Usage Across 17 Files:**

- `PRPPipeline` extends `Workflow` from Groundswell
- Agents created via `createAgent()` factory
- MCP tools inherit from `MCPHandler`
- Prompts created with `createPrompt()` template

### 4.2 Groundswell Features Utilized

- ✅ **Hierarchical Workflows** - Parent-child task relationships
- ✅ **@Step Decorator** - Lifecycle events and timing
- ✅ **@Task Decorator** - Child workflow spawning
- ✅ **@ObservedState** - State snapshots for persistence
- ✅ **Agent Factory** - Agent creation with tools/MCPs
- ✅ **Prompt Templates** - Immutable prompts with Zod validation
- ✅ **MCP Handler** - Tool registration and execution
- ✅ **Observers** - Event propagation and debugging
- ✅ **WorkflowTreeDebugger** - Visualization and introspection

### 4.3 Groundswell Configuration

**Available Decorators:**

- `@Step({ snapshotState, trackTiming, logStart, logFinish })`
- `@Task({ concurrent, errorMergeStrategy })`
- `@ObservedState({ hidden, redact })`

**Agent Creation:**

```typescript
const agent = createAgent({
  name: string,
  system?: string,
  tools?: Tool[],
  mcps?: MCPServer[],
  model?: string,  // Default: GLM-4.7 (sonnet)
  maxTokens?: number,
  temperature?: number,
  enableCache?: boolean,
  enableReflection?: boolean,
});
```

---

## 5. Environment Configuration

### 5.1 Required Environment Variables

| Variable             | Source                             | Purpose                                                  |
| -------------------- | ---------------------------------- | -------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | Mapped from `ANTHROPIC_AUTH_TOKEN` | z.ai API authentication                                  |
| `ANTHROPIC_BASE_URL` | Default or override                | API endpoint (default: `https://api.z.ai/api/anthropic`) |

### 5.2 Environment Variable Mapping

**Configuration Layer** (`/src/config/environment.ts`):

```typescript
// Maps AUTH_TOKEN to API_KEY for SDK compatibility
if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
}

// Sets default BASE_URL
if (!process.env.ANTHROPIC_BASE_URL) {
  process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/api/anthropic';
}
```

### 5.3 Model Configuration

| Tier   | Model       | Usage                               |
| ------ | ----------- | ----------------------------------- |
| opus   | GLM-4.7     | Architect agent (complex reasoning) |
| sonnet | GLM-4.7     | Researcher, Coder, QA agents        |
| haiku  | GLM-4.5-Air | Fast operations (future use)        |

### 5.4 API Safety Measures

**Test Setup Safeguard** (`tests/setup.ts`):

- Blocks execution if `ANTHROPIC_BASE_URL` is set to Anthropic's official API
- Validates on test load and before each test
- Prevents accidental usage of production Anthropic API

**Validation Script** (`src/scripts/validate-api.ts`):

- Checks endpoint availability
- Tests authentication
- Validates response structure
- Exits with error if wrong API detected

---

## 6. Data Structures

### 6.1 Task Hierarchy

**Four-Level Hierarchy** (defined in `/src/core/models.ts`):

```
Phase (P[#])
  └─ Milestone (P[#].M[#])
      └─ Task (P[#].M[#].T[#])
          └─ Subtask (P[#].M[#].T[#].S[#])
```

**Type Definitions:**

```typescript
interface Phase {
  type: 'Phase';
  id: string; // P[#]
  title: string;
  status: TaskStatus;
  description: string;
  milestones: Milestone[];
}

interface Milestone {
  type: 'Milestone';
  id: string; // P[#].M[#]
  title: string;
  status: TaskStatus;
  description: string;
  tasks: Task[];
}

interface Task {
  type: 'Task';
  id: string; // P[#].M[#].T[#]
  title: string;
  status: TaskStatus;
  description: string;
  subtasks: Subtask[];
}

interface Subtask {
  type: 'Subtask';
  id: string; // P[#].M[#].T[#].S[#]
  title: string;
  status: TaskStatus;
  story_points: 0.5 | 1 | 2;
  dependencies: string[];
  context_scope: string;
}
```

### 6.2 Task Status Values

```typescript
type TaskStatus =
  | 'Planned' // Initial state
  | 'Researching' // PRP generation in progress
  | 'Ready' // PRP ready, awaiting execution
  | 'Implementing' // PRP execution in progress
  | 'Complete' // Successfully completed
  | 'Failed' // Failed with error
  | 'Obsolete'; // Removed by delta analysis
```

### 6.3 Session State

**Session Directory Structure:**

```
plan/
  {sequence}_{hash}/
    tasks.json                    # Single source of truth
    prd_snapshot.md              # PRD snapshot
    delta_from.txt               # Link to previous session (if delta)
    delta_prd.md                 # Delta PRD (if delta session)
    bug_hunt_tasks.json          # Bug fix pipeline state
    TEST_RESULTS.md              # Bug report
    architecture/                # Architectural research
    docs/                        # Implementation documentation
    prp/                         # Product Requirement Prompts
      {task_id}/
        PRP.md                   # Implementation contract
        research/                # Research materials
```

### 6.4 Protected Files

**NEVER DELETE:**

- `tasks.json` - Pipeline state
- `bug_hunt_tasks.json` - Bug fix state
- `prd_snapshot.md` - PRD snapshot
- `delta_from.txt` - Delta linkage
- `PRD.md` - Product requirements (project root)
- `TEST_RESULTS.md` - Bug report

---

## 7. Agent Personas & Prompts

### 7.1 Implemented Agents

| Agent              | Role           | Location                                       | System Prompt                |
| ------------------ | -------------- | ---------------------------------------------- | ---------------------------- |
| **Architect**      | Task Breakdown | `/src/agents/prompts/architect-prompt.ts`      | Task Breakdown System Prompt |
| **Researcher**     | PRP Generation | `/src/agents/prompts/prp-blueprint-prompt.ts`  | PRP Blueprint Prompt         |
| **Coder**          | PRP Execution  | `/src/agents/prompts/` (inline)                | PRP Execution Prompt         |
| **QA**             | Bug Hunting    | `/src/agents/prompts/bug-hunt-prompt.ts`       | Creative Bug Finding Prompt  |
| **Change Manager** | Delta Analysis | `/src/agents/prompts/delta-analysis-prompt.ts` | Delta PRD Generation Prompt  |

### 7.2 Prompt Templates

**Location:** `/src/agents/prompts.ts` and `/src/agents/prompts/`

**Key Prompts:**

1. **Architect Prompt** - Decomposes PRD into JSON hierarchy
2. **PRP Blueprint Prompt** - Generates implementation contracts
3. **Bug Hunt Prompt** - Adversarial QA testing
4. **Delta Analysis Prompt** - PRD change detection
5. **PRP Execution Prompt** - Executes PRP with validation

### 7.3 Prompt Structure

**All prompts follow this pattern:**

```typescript
const prompt = createPrompt({
  user: string,              // Main instruction
  data?: Record<string, unknown>,  // Context data
  responseFormat: z.ZodType<T>,    // Zod schema for validation
  system?: string,           // System prompt override
  tools?: Tool[],            // Tool override
  enableReflection?: boolean,       // Error recovery
});
```

---

## 8. Validation Gates (Progressive Validation)

### 8.1 Four-Level Validation System

**Level 1: Syntax & Style** (Immediate feedback)

- Linting (ESLint)
- Type checking (tsc --noEmit)
- Formatting (Prettier)
- **Success Criteria:** Zero errors

**Level 2: Unit Tests** (Component validation)

- Component-level tests
- Isolated function/class tests
- **Success Criteria:** All tests pass

**Level 3: Integration Testing** (System validation)

- Service startup
- Endpoint testing
- Database validation
- **Success Criteria:** All integrations working

**Level 4: Creative & Domain-Specific** (Real-world validation)

- Playwright (web interfaces)
- Docker (containerized services)
- Performance testing
- Security scanning
- **Success Criteria:** All creative validations pass

### 8.2 Validation Implementation

**Location:** `/src/agents/prp-executor.ts`

**Flow:**

```typescript
// After code generation
await runLevel1Validation(); // Syntax
await runLevel2Validation(); // Unit tests
await runLevel3Validation(); // Integration
await runLevel4Validation(); // Creative
```

**Failure Protocol:**

- Fix issues using PRP patterns
- Re-run validation until passing
- Halt on fundamental issues with explanation

---

## 9. Delta Workflow (Change Management)

### 9.1 Delta Detection

**Trigger:** PRD hash mismatch

```typescript
// 1. Hash current PRD
const currentHash = hashPRD(prdContent);

// 2. Check for existing session
const existingSession = findSessionByPRD(currentHash);

// 3. If hash differs, create delta session
if (existingSession && existingSession.hash !== currentHash) {
  return createDeltaSession(existingSession);
}
```

### 9.2 Delta Session Creation

**Location:** `/src/core/session-manager.ts` - `createDeltaSession()`

**Process:**

1. Create new session directory: `plan/{sequence}_{new_hash}/`
2. Link to previous session via `delta_from.txt`
3. Copy previous session state for reference
4. Generate Delta PRD via DeltaAnalysisWorkflow
5. Patch tasks.json based on changes

### 9.3 Task Patching Logic

**Location:** `/src/core/task-patcher.ts`

**Change Types:**

- **New requirements** → Add new tasks
- **Modified requirements** → Mark existing tasks for "Update/Re-implementation"
- **Removed requirements** → Mark tasks as "Obsolete"

### 9.4 Previous Session Context

**Priority Order:**

1. Check `$PREV_SESSION_DIR/architecture/` for existing research
2. Check `$PREV_SESSION_DIR/docs/` for implementation notes
3. Reference completed work instead of re-researching
4. Build upon existing patterns
5. Only web search for genuinely NEW topics

---

## 10. Execution Flow

### 10.1 Main Pipeline Flow

**Location:** `/src/workflows/prp-pipeline.ts`

```
1. Initialize Session
   ├─ Hash PRD
   ├─ Check for existing session
   └─ Detect/create delta session

2. PRD Decomposition (if new session)
   ├─ Spawn Architect Agent
   ├─ Generate task hierarchy
   └─ Write to tasks.json

3. Backlog Execution
   ├─ Iterate: Phase → Milestone → Task → Subtask
   ├─ For each subtask:
   │  ├─ PRP Generation (Researcher Agent)
   │  ├─ PRP Execution (Coder Agent)
   │  └─ Validation (4-level gates)
   └─ Smart git commits

4. QA & Bug Hunt
   ├─ Generate validation script
   ├─ Run QA Agent (Adversarial)
   ├─ If bugs found: Fix Cycle
   └─ Re-test until clean

5. Cleanup & Commit
   ├─ Move docs to docs/
   ├─ Remove temporary files
   └─ Final git commit
```

### 10.2 Subtask Execution Flow (Inner Loop)

**Location:** `/src/agents/prp-runtime.ts`

```
For each Subtask:
  1. Set status: "Researching"
  2. Generate PRP (via ResearchQueue)
     ├─ Check cache first
     ├─ Spawn Researcher Agent
     ├─ Codebase analysis
     ├─ External research
     └─ Write PRP.md

  3. Set status: "Implementing"
  4. Execute PRP
     ├─ Load PRP.md
     ├─ Spawn Coder Agent
     ├─ Implement code
     ├─ Run 4-level validation
     └─ Collect artifacts

  5. Set status: "Complete" or "Failed"
  6. Smart git commit
  7. Flush state to tasks.json
```

---

## 11. Error Handling

### 11.1 Error Hierarchy

**Location:** `/src/utils/errors.ts`

**Error Types:**

- `PipelineError` - Top-level pipeline errors
- `TaskError` - Task execution errors
- `AgentError` - Agent execution errors
- `ValidationError` - Validation gate failures
- `SessionError` - Session management errors
- `ConfigurationError` - Configuration errors
- `PRDError` - PRD parsing errors
- `PRPError` - PRP generation/execution errors

**Error Structure:**

```typescript
class PipelineError extends Error {
  code: string;
  details?: unknown;
  recoverable: boolean;
  workflowId?: string;
  state?: SerializedWorkflowState;
}
```

### 11.2 Error Recovery

**Strategies:**

1. **Agent Retries** - Exponential backoff with reflection
2. **Validation Retries** - Fix and re-run validation gates
3. **Graceful Shutdown** - Finish current task on SIGINT
4. **State Preservation** - State snapshots in errors
5. **Error Reporting** - ERROR_REPORT.md generation

### 11.3 Resource Monitoring

**Location:** `/src/utils/resource-monitor.ts`

**Monitored Resources:**

- File handles (limit: 1000)
- Memory usage (limit: 2GB)
- Task execution time (timeout: 30 minutes)

**Actions on Limits:**

- Log warnings
- Trigger graceful shutdown
- Save state before exit

---

## 12. Testing Strategy

### 12.1 Test Structure

**Framework:** Vitest with 100% coverage requirements

**Directory Structure:**

```
tests/
├── unit/              # Unit tests
│   ├── config/        # Configuration tests
│   ├── agents/        # Agent tests
│   ├── tools/         # Tool tests
│   ├── workflows/     # Workflow tests
│   └── utils/         # Utility tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
├── manual/           # Manual test scripts
├── validation/       # Validation scripts
└── setup.ts          # Global test configuration
```

### 12.2 Coverage Requirements

**Enforced Thresholds:**

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

### 12.3 Test Safeguards

**Global Setup** (`tests/setup.ts`):

- Loads .env file
- **Validates z.ai endpoint** (blocks Anthropic API)
- Clears mocks before each test
- Restores environment after each test

---

## 13. Key Files & Locations

### 13.1 Core Components

| Component         | File                             | Lines |
| ----------------- | -------------------------------- | ----- |
| Session Manager   | `/src/core/session-manager.ts`   | 1027  |
| Task Orchestrator | `/src/core/task-orchestrator.ts` | 835   |
| PRP Runtime       | `/src/agents/prp-runtime.ts`     | 328   |
| PRP Pipeline      | `/src/workflows/prp-pipeline.ts` | 1840  |
| Models (Types)    | `/src/core/models.ts`            | 1786  |

### 13.2 Critical Configuration Files

| File                         | Purpose                    |
| ---------------------------- | -------------------------- |
| `/src/config/environment.ts` | z.ai API compatibility     |
| `/src/config/constants.ts`   | Model names, env var names |
| `/tsconfig.json`             | TypeScript configuration   |
| `/vitest.config.ts`          | Test configuration         |
| `/package.json`              | Dependencies and scripts   |

### 13.3 Entry Points

| File                | Purpose                      |
| ------------------- | ---------------------------- |
| `/src/index.ts`     | Main application entry point |
| `/src/cli/index.ts` | CLI argument parsing         |
| `/src/cli/index.ts` | Pipeline execution trigger   |

---

## 14. Development Workflow

### 14.1 Initial Setup

```bash
# Ensure Node.js 20+
node --version

# Install dependencies
npm install

# Configure environment (.env or .envrc)
echo "ANTHROPIC_AUTH_TOKEN=your_token" > .env
echo "ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic" >> .env

# Validate API
npm run validate:api
```

### 14.2 Development Cycle

```bash
# Make changes
npm run dev:watch    # Auto-reload on changes

# Run tests
npm test            # Watch mode
npm run test:run    # Single run
npm run test:coverage  # With coverage

# Type check
npm run typecheck

# Format and lint
npm run format
npm run lint
npm run fix         # Auto-fix issues
```

### 14.3 Before Commit

```bash
# Full validation
npm run validate    # lint + format + typecheck
npm run test:run    # All tests
npm run test:coverage  # Check 100% coverage
```

### 14.4 Production Build

```bash
npm run build       # Compile to dist/
npm start           # Run compiled code
```

---

## 15. Known Limitations & Improvement Areas

### 15.1 Limitations (from PRD.md Section 7)

1. **Concurrency Control** - Background subshells hard to monitor
2. **Structured State** - Uses jq parsing (but has native JSON now)
3. **Observability** - Uses print statements (but has Pino logging)
4. **Tool Abstraction** - Not dependent on tsk CLI (integrated)
5. **Error Handling** - Strong retry logic exists (reflection)

**Status:** Most limitations already addressed in current implementation.

### 15.2 Potential Enhancements

1. **Web UI** - Current state visualization dashboard
2. **Real-time Progress** - WebSocket progress updates
3. **Multi-PRD Support** - Concurrent project pipelines
4. **Custom Validation Gates** - User-defined validation strategies
5. **Agent Performance Metrics** - Token usage, timing analytics

---

## 16. Conclusion

The **hacky-hack** project is a **mature, production-ready implementation** of an Autonomous PRP Development Pipeline. All core components are fully implemented, tested, and operational.

**Key Facts:**

- ✅ 69 TypeScript files, ~29K lines of code
- ✅ All 4 core components complete
- ✅ Groundswell fully integrated
- ✅ Comprehensive error handling
- ✅ 100% test coverage requirements
- ✅ Production-ready CLI
- ✅ Graceful shutdown and recovery
- ✅ Delta workflow for change management
- ✅ 4-level progressive validation
- ✅ z.ai API integration with safeguards

**Next Steps:**
This project is in **maintenance and enhancement mode**. Any new work should focus on:

1. Bug fixes and stability improvements
2. Performance optimizations
3. Feature enhancements (not replacements)
4. Documentation improvements
5. Test coverage expansion

---

**End of System Context**
