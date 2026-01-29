# Research Report: PRP Pipeline Current State

## Executive Summary

The PRP Pipeline at `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` needs to be updated to align with the new FixCycleWorkflow constructor signature. The FixCycleWorkflow constructor was changed in commit `0f7fdce` to accept `sessionPath: string` instead of `testResults: TestResults`, but the PRP Pipeline was not updated accordingly.

**Critical Finding**: The PRP Pipeline still uses the OLD constructor signature at lines 1165-1170.

## Current FixCycleWorkflow Instantiation (NEEDS UPDATE)

**Location**: `src/workflows/prp-pipeline.ts:1165-1170`

### Current Code (OUTDATED):

```typescript
const fixCycleWorkflow = new FixCycleWorkflow(
  testResults, // ❌ OLD: TestResults object
  prdContent,
  this.taskOrchestrator,
  this.sessionManager
);
```

### Required Code (NEW):

```typescript
const fixCycleWorkflow = new FixCycleWorkflow(
  sessionPath, // ✅ NEW: string path to session directory
  prdContent,
  this.taskOrchestrator,
  this.sessionManager
);
```

## Current BugHuntWorkflow Call (NEEDS UPDATE)

**Location**: `src/workflows/prp-pipeline.ts:1145-1146`

### Current Code:

```typescript
const bugHuntWorkflow = new BugHuntWorkflow(prdContent, completedTasks);
const testResults = await bugHuntWorkflow.run();
```

### Required Code:

```typescript
const bugHuntWorkflow = new BugHuntWorkflow(prdContent, completedTasks);
const sessionPath = this.sessionManager.currentSession?.metadata.path;
const testResults = await bugHuntWorkflow.run(sessionPath);
```

## TEST_RESULTS.md Write (NEEDS REMOVAL)

**Location**: `src/workflows/prp-pipeline.ts:1214-1285`

The PRP Pipeline currently writes TEST_RESULTS.md in Markdown format after the fix cycle. This needs to be removed because:

1. BugHuntWorkflow now writes TEST_RESULTS.md automatically when sessionPath is provided
2. BugHuntWorkflow writes JSON format (required by FixCycleWorkflow)
3. PRP Pipeline writes Markdown format (incompatible)
4. This creates duplicate write logic

## Session Path Access Pattern

**Standard pattern used throughout the codebase:**

```typescript
const sessionPath = this.sessionManager.currentSession?.metadata.path;
```

**Usage examples in PRP Pipeline:**

- Line 783: `this.sessionManager.currentSession!.metadata.path`
- Line 1215: `const sessionPath = this.sessionManager.currentSession?.metadata.path;`
- Line 1326: `const sessionPath = this.sessionManager.currentSession?.metadata.path;`
- Line 1508: `const sessionPath = this.sessionManager.currentSession?.metadata.path;`
- Line 1624: `const sessionPath = this.sessionManager.currentSession?.metadata.path;`

## Execution Flow in runQACycle()

```
Phase 1: Bug Hunt (Lines 1133-1153)
  ├─ BugHuntWorkflow instantiated
  ├─ BugHuntWorkflow.run() called WITHOUT sessionPath
  └─ Returns testResults

Phase 2: Fix Cycle (Lines 1155-1201)
  ├─ If testResults.hasBugs is true
  ├─ FixCycleWorkflow instantiated with OUTDATED signature
  ├─ FixCycleWorkflow.run() called
  └─ Returns fixResults

Phase 3: Update State (Lines 1203-1208)
  └─ Update this.#bugsFound and this.currentPhase

Phase 4: Write TEST_RESULTS.md (Lines 1210-1285) [TO BE REMOVED]
  └─ Writes markdown-formatted TEST_RESULTS.md

Phase 5: Print Console Summary (Lines 1287-1333)
  └─ Display QA results to console
```

## Required Changes Summary

| Change                       | Location        | Action                               |
| ---------------------------- | --------------- | ------------------------------------ |
| BugHuntWorkflow.run() call   | Lines 1145-1146 | Add sessionPath parameter            |
| FixCycleWorkflow constructor | Lines 1165-1170 | Replace testResults with sessionPath |
| TEST_RESULTS.md write        | Lines 1214-1285 | Remove entire section                |
| Phase comments               | Lines 1203-1285 | Renumber after removal               |

## Dependencies

**Imports already present (no changes needed):**

```typescript
import { BugHuntWorkflow } from './bug-hunt-workflow.js';
import { FixCycleWorkflow } from './fix-cycle-workflow.js';
```

## References

- FixCycleWorkflow: `src/workflows/fix-cycle-workflow.ts`
- BugHuntWorkflow: `src/workflows/bug-hunt-workflow.ts`
- SessionManager: `src/core/session-manager.ts`
- TestResults model: `src/core/models.ts`
