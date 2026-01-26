# Workflow Orchestration Analysis

## Main Pipeline Flow (PRPPipeline)

### 4 Phases

1. **Session Initialization**: Detect existing or create new session
2. **PRD Decomposition**: Generate task backlog (Architect agent)
3. **Backlog Execution**: Execute tasks via TaskOrchestrator
4. **QA Cycle**: Run BugHuntWorkflow and FixCycleWorkflow

## Delta Session Workflow

### Delta Detection

- Compare PRD hashes (SHA-256)
- Hash change → Create delta session
- Compute diff using `prd-differ.ts`

## Bug Hunt Workflow (3-Phase Testing)

### Phase 1: PRD Scope Analysis

### Phase 2: Creative E2E Testing

### Phase 3: Adversarial Testing

## Fix Cycle Workflow

### Iterative Process (Max 3 iterations)

1. Fix Task Creation
2. Fix Execution
3. Retesting
4. Completion Check

## Graceful Shutdown

### Signal Handling

- SIGINT/SIGTERM captured
- State preserved before exit
- Resumable from interruption point

## State Persistence Patterns

### File System Operations

- Atomic writes (temp + rename)
- JSON schema validation
- Incremental state saves
