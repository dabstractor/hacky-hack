# System Context: PRP Development Pipeline

## Project Overview

**Project Name:** PRP Development Pipeline (codename: hacky-hack)
**Type:** Meta-Project / Autonomous Software Development Framework
**Status:** Greenfield Implementation (Specification Phase)
**Technology Stack:** Node.js 20+ / TypeScript 5.2+ / Groundswell Framework

## Current State Assessment

### Existing Infrastructure

- **Git Repository:** Initialized with 2 commits
- **Documentation:**
  - `PRD.md` (12,948 bytes) - Complete Product Requirements Document
  - `PROMPTS.md` (43,499 bytes) - Critical system prompts and agent personas
  - `plan/001_14b9dc2a33c7/prd_snapshot.md` - PRD snapshot for current session
- **Directory Structure:**
  - `plan/001_hash/` - Session-based development directories
  - `architecture/` - Architectural research storage (this file)

### Missing Infrastructure (To Be Implemented)

- No `package.json` or dependency management
- No TypeScript configuration
- No source code files
- No test infrastructure
- No CI/CD configuration
- No `.env` files

## Core Architecture

### Design Philosophy

The PRP Pipeline is an **agentic software development system** that converts high-level PRDs into implemented, tested, and polished codebases through:

1. **Structured Decomposition:** PRDs broken into atomic hierarchy (Phase > Milestone > Task > Subtask)
2. **Context-Dense Prompts:** Each task receives a focused PRP (Product Requirement Prompt)
3. **Progressive Validation:** 4-level validation gates (Syntax → Unit → Integration → Manual)
4. **Self-Healing:** Iterative bug hunting and fix cycles
5. **Delta Sessions:** Change management through PRD diffing

### Four Core Processing Engines

1. **Session Manager:**
   - State persistence
   - Directory structure management (`plan/001_hash/`)
   - PRD hashing and delta detection
   - Immutable audit trail

2. **Task Orchestrator:**
   - JSON backlog management (`tasks.json`)
   - Dependency resolution
   - Status tracking (Planned → Researching → Implementing → Complete/Failed)
   - Scope-based execution (`--scope=milestone`, `--task=3`)

3. **Agent Runtime:**
   - LLM interface wrapper
   - Persona execution (Architect, Researcher, Coder, QA)
   - Tool registration (File I/O, Shell, Search, Web Research)
   - Context injection

4. **Pipeline Controller:**
   - Main execution loop
   - Parallelization orchestration
   - Error recovery and graceful shutdown
   - Commit workflow

## Execution Workflows

### Primary Workflow: Initialization & Breakdown

```
PRD.md → Hash Check → Architecture Research → Architect Agent → JSON Backlog
```

### Secondary Workflow: The "Inner Loop" (Execution)

```
For each backlog item:
  Parallel Research (N+1) → PRP Generation → Implementation → Progressive Validation → Cleanup & Commit
```

### Tertiary Workflow: Delta Management

```
PRD Modified → Hash Mismatch → Delta Session → PRD Diff → Task Patching → Resume
```

### Quaternary Workflow: QA & Bug Hunt

```
All Complete → Validation Script → Creative QA → TEST_RESULTS.md → Fix Cycle (if needed)
```

## Key Data Structures

### Session Directory Structure

```
plan/001_14b9dc2a33c7/
├── prd_snapshot.md       # PRD state at session start
├── tasks.json            # Single source of truth (immutable until completion)
├── architecture/         # Architectural research findings
│   ├── system_context.md
│   ├── groundswell_api.md
│   └── environment_config.md
├── prps/                 # Generated PRPs per task
│   ├── P1.M1.T1.S1.md
│   └── ...
└── artifacts/            # Temporary implementation artifacts
```

### Task Hierarchy (JSON Schema)

```json
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P1",
      "title": "Phase Title",
      "status": "Planned|Researching|Implementing|Complete|Failed",
      "milestones": [
        {
          "type": "Milestone",
          "id": "P1.M1",
          "title": "Milestone Title",
          "status": "Planned",
          "tasks": [
            {
              "type": "Task",
              "id": "P1.M1.T1",
              "title": "Task Title",
              "status": "Planned",
              "subtasks": [
                {
                  "type": "Subtask",
                  "id": "P1.M1.T1.S1",
                  "title": "Subtask Title",
                  "status": "Planned",
                  "story_points": 1,
                  "dependencies": ["P1.M1.T1.S0"],
                  "context_scope": "Strict instructions for isolated development"
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

### PRP Template Structure

```markdown
# Product Requirement Prompt: [Task ID]

## 1. Objective

[Specific goal]

## 2. Context

- Codebase Analysis: [Similar patterns found]
- Previous Implementation Notes: [From dependency IDs]

## 3. Implementation Strategy

- Step 1: [Action]
- Step 2: [Action]

## 4. Validation Gates

- Level 1: Lint/Type Check
- Level 2: Unit Tests
- Level 3: Integration Tests
- Level 4: Manual/E2E

## 5. Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

## Critical Constraints

### 1. Research-Driven Architecture

- **No Vacuum Development:** Every task must be grounded in codebase reality
- **Pre-Validation:** Spawn sub-agents to research before defining tasks
- **Architectural Persistence:** Store findings in `architecture/` for downstream consumption

### 2. Coherence & Continuity

- **Explicit Handoffs:** If Subtask A defines schema, Subtask B must reference it
- **Strict References:** Specific file paths, variable names, API endpoints
- **Context Injection:** System must inject relevant context into agent prompts

### 3. Implicit TDD

- **No Separate Test Tasks:** Tests are implied in every subtask
- **Workflow:** Write failing test → Implement → Pass test → Refactor
- **Definition of Done:** Code is incomplete without passing tests

### 4. Context Scope

Every subtask requires a "context_scope" field defining:

- **INPUT:** Data/interfaces from dependency subtasks
- **OUTPUT:** Interface exposed to next subtask
- **MOCKING:** External services to mock for isolation

## Known Risks & Mitigations

| Risk                     | Impact   | Mitigation                                        |
| ------------------------ | -------- | ------------------------------------------------- |
| Context Dilution         | High     | PRP micro-contracts, strict context injection     |
| Agent Drift              | High     | Progressive validation gates, success criteria    |
| State Corruption         | Critical | Immutable `tasks.json`, atomic writes             |
| Delta Conflicts          | Medium   | Linked session structure, task patching           |
| z.ai API Incompatibility | High     | Groundswell abstraction layer, validation testing |

## Integration Points

### External Systems

- **Groundswell Library:** `~/projects/groundswell` (local npm link)
- **z.ai API:** `https://api.z.ai/api/anthropic` (Anthropic-compatible)
- **Git:** Local repository operations (commit, status, diff)
- **Filesystem:** PRD/PRP generation, session management

### Environment Variables (from `~/.config/zsh/functions.zsh`)

```bash
ANTHROPIC_AUTH_TOKEN=[token]        # Map to ANTHROPIC_API_KEY
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
ANTHROPIC_DEFAULT_SONNET_MODEL=GLM-4.7
ANTHROPIC_DEFAULT_HAIKU_MODEL=GLM-4.5-Air
API_TIMEOUT_MS=3000000
```

## Success Metrics

### Technical Metrics

- **PRP Success Rate:** % of tasks passing one-pass implementation
- **Validation Pass Rate:** % of tasks passing all 4 validation levels
- **Agent Retry Rate:** Average number of retries per task
- **Session Recovery:** Ability to resume from any interrupted state

### Development Metrics

- **Autonomy Ratio:** % of tasks completed without human intervention
- **Delta Efficiency:** Time savings from delta session vs. full rebuild
- **Bug Hunt Effectiveness:** % of critical bugs caught before deployment

## Next Steps

1. **Confirm Environment:** Validate z.ai API compatibility with Anthropic SDK
2. **Initialize Project:** Set up TypeScript project with Groundswell dependency
3. **Implement Core Data Structures:** `TaskRegistry`, `SessionManager`, `PRPGenerator`
4. **Port System Prompts:** Convert `PROMPTS.md` to Groundswell `Prompt` objects
5. **Build Main Workflow:** Implement the `PRPPipeline` class extending Groundswell `Workflow`
