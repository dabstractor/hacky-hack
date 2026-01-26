# System Context & Architectural Synthesis

**Bug Fix ID**: 001_d5507a871918
**Synthesis Date**: 2026-01-26
**Scope**: Critical bug fixes for PRP Pipeline implementation

---

## Executive Summary

This document synthesizes research findings from codebase audit (001) and external dependency research (002) to provide a unified architectural context for implementing the critical bug fixes. The PRP Pipeline implementation is approximately 80% complete with strong foundations, but requires immediate fixes to 4 critical issues that prevent core functionality.

---

## Current Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    PRP Pipeline Controller                   │
│  - Orchestrates all workflows                              │
│  - Manages session lifecycle                               │
│  - Coordinates QA and fix cycles                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼─────┐   ┌────▼────┐   ┌─────▼────────┐
│ Session │   │   Task  │   │    Agent     │
│ Manager │◄──┤Orchestr.├──►│   Factory    │
└─────────┘   └─────────┘   └──────────────┘
     │               │               │
     └───────────────┴───────────────┘
                     │
            ┌────────▼─────────┐
            │ Research Queue   │
            │ (PRP Generators) │
            └──────────────────┘
```

### Workflow Architecture

```
PRP Pipeline.run()
├── 1. Initialization
│   ├── SessionManager.initialize()
│   ├── TaskOrchestrator.loadPlan()
│   └── DeltaAnalysisWorkflow.run()
│
├── 2. Task Execution Loop
│   ├── DFS traversal of task tree
│   ├── Agent execution (Architect, Researcher, Coder)
│   └── Status management (Planned → Researching → Implementing → Complete)
│
├── 3. QA Cycle (Critical Bug Location)
│   ├── BugHuntWorkflow.run() → Returns TestResults
│   ├── FixCycleWorkflow.run() ← BUG: Should read TEST_RESULTS.md
│   └── Write TEST_RESULTS.md ← BUG: Written too late
│
└── 4. Completion
    ├── SessionManager.flushUpdates()
    └── Metrics reporting
```

---

## Critical Bug Analysis

### Bug 1: ResearchQueue Constructor Signature Mismatch

**Current Implementation** (`src/core/research-queue.ts:94-106`):
```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
)
```

**Problematic Instantiation** (`src/core/task-orchestrator.ts:161-166`):
```typescript
// CURRENT: Missing cacheTtlMs parameter
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  concurrency,  // maxSize
  noCache
  // Missing: cacheTtlMs
);

// TESTS: Only pass 2 parameters
new ResearchQueue(sessionManager, noCache)
```

**Root Cause**: Constructor evolved to add `cacheTtlMs` but calling code and tests were not updated.

**Impact**: Runtime failures when TaskOrchestrator tries to create ResearchQueue. Tests fail with argument count errors.

**Fix Strategy**:
1. Update TaskOrchestrator to pass all 4 parameters
2. Update tests to use full constructor signature
3. Consider parameter object pattern for future extensibility (see 002_external_dependencies.md §1.4)

---

### Bug 2: SessionManager Constructor Signature Inconsistency

**Current Implementation** (`src/core/session-manager.ts:190-219`):
```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```

**Problematic Test Pattern** (23 test files):
```typescript
// TESTS: Missing planDir parameter
new SessionManager(prdPath, flushRetries)

// EXPECTED: Should be
new SessionManager(prdPath, planDir, flushRetries)
```

**Root Cause**: `planDir` parameter was added with default value but tests were written before this change or without awareness of the new parameter.

**Impact**: All SessionManager tests fail. Tests cannot validate session state management.

**Fix Strategy**:
1. Update all 23 test files to include planDir parameter
2. Use consistent pattern: `resolve('plan')` for tests
3. Document constructor signature in test helpers

---

### Bug 3: TEST_RESULTS.md Workflow Timing

**Current Implementation** (`src/workflows/prp-pipeline.ts:1214-1285`):
```typescript
async runQACycle() {
  // 1. Run BugHuntWorkflow
  const bugHunt = new BugHuntWorkflow(this.prdSnapshot, completedTasks);
  const testResults = await bugHunt.run();

  // 2. Run FixCycleWorkflow
  const fixCycle = new FixCycleWorkflow(
    testResults,  // ← Passes in-memory object
    this.prdSnapshot,
    this.orchestrator,
    this.sessionManager
  );
  await fixCycle.run();

  // 3. Write TEST_RESULTS.md ← TOO LATE!
  await writeFile(
    resolve(this.sessionManager.currentSession.metadata.path, 'TEST_RESULTS.md'),
    JSON.stringify(testResults, null, 2)
  );
}
```

**Expected Flow** (per PRD §4.4):
```
BugHuntWorkflow → Write TEST_RESULTS.md → FixCycleWorkflow reads file → Execute fixes
```

**Actual Flow**:
```
BugHuntWorkflow → FixCycleWorkflow (in-memory) → Write TEST_RESULTS.md (after fixes complete)
```

**Root Cause**: TEST_RESULTS.md was originally intended for persistence between runs, but FixCycleWorkflow was refactored to accept in-memory TestResults. The file write remained but moved to the wrong location.

**Impact**:
- Bugfix session directory is empty when tasks are generated
- No persistent record of bugs found
- Cannot resume bug fix sessions after interruption

**Fix Strategy** (from 002_external_dependencies.md §2.2):
1. Move TEST_RESULTS.md write to immediately after BugHuntWorkflow
2. Add BugHuntWorkflow.writeBugReport() method for separation of concerns
3. FixCycleWorkflow should read from file, not accept in-memory object
4. Use atomic write-then-rename pattern for data safety

---

### Bug 4: Missing Bugfix Session Path Validation

**Current Implementation**: None. No validation exists.

**Expected Implementation** (per PRD §5.1):
```typescript
// Should validate session path contains "bugfix"
function validateBugfixSession(sessionPath: string): void {
  if (!sessionPath.includes('bugfix')) {
    throw new Error(
      `Bug fix tasks can only be executed within bugfix sessions. ` +
      `Invalid path: ${sessionPath}`
    );
  }
}
```

**Missing Nested Execution Guard** (per PRD §9.2.5):
```typescript
// Should check PRP_PIPELINE_RUNNING environment variable
function validateNestedExecution(sessionPath: string): void {
  if (process.env.PRP_PIPELINE_RUNNING) {
    const isValidRecursion =
      process.env.SKIP_BUG_FINDING === 'true' &&
      sessionPath.includes('bugfix');

    if (!isValidRecursion) {
      throw new Error(
        'Nested PRP Pipeline execution detected. ' +
        'Only bug fix sessions can recurse.'
      );
    }
  }

  // Set guard for this execution
  process.env.PRP_PIPELINE_RUNNING = process.pid.toString();
}
```

**Root Cause**: Guards were specified in PRD but never implemented.

**Impact**:
- Bug fix tasks could be created in wrong session directory
- Corrupts main session state
- No protection against recursive pipeline execution
- Violates core PRD requirement

**Fix Strategy** (from 002_external_dependencies.md §4):
1. Add validation to FixCycleWorkflow constructor
2. Implement nested execution guard in PRP Pipeline entry point
3. Add debug logging with PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING
4. Clear PRP_PIPELINE_RUNNING on exit (use finally block)

---

## Architectural Patterns Identified

### Pattern 1: Constructor Signature Evolution

**Problem**: Constructor signatures evolve over time but calling code lags behind.

**Solution**: Use parameter object pattern for complex constructors:
```typescript
// Instead of:
constructor(a, b, c, d, e, f)

// Use:
interface Options {
  a: string;
  b?: number;
  c?: boolean;
  // d, e, f can be added later without breaking existing code
}
constructor(options: Options)
```

**Application**: Consider refactoring ResearchQueue to use this pattern (future enhancement).

---

### Pattern 2: File-Based State Management

**Problem**: Determining when to write state to disk vs keep in memory.

**Solution**: Follow the "write at state transitions" pattern:
```typescript
// Write immediately when state changes
async transitionTo(newState: State): Promise<void> {
  await this.writeState(newState);
  await this.notifyDependents(newState);
}
```

**Application**: TEST_RESULTS.md must be written immediately when bugs are found, not delayed until after fix cycle.

---

### Pattern 3: Session Type Validation

**Problem**: Preventing operations in wrong session context.

**Solution**: Use session type guards and context validation:
```typescript
type SessionType = 'main' | 'bugfix' | 'delta';

interface SessionContext {
  type: SessionType;
  path: string;
  allowsNestedExecution: boolean;
}

function validateSessionContext(
  context: SessionContext,
  operation: string
): void {
  if (!isOperationAllowedInContext(context, operation)) {
    throw new ContextValidationError(operation, context);
  }
}
```

**Application**: FixCycleWorkflow must validate it's running in a bugfix session.

---

## Dependencies & Integration Points

### Internal Dependencies

```
PRP Pipeline
├── SessionManager ← Required by: TaskOrchestrator, FixCycleWorkflow
├── TaskOrchestrator ← Required by: PRP Pipeline
├── ResearchQueue ← Created by: TaskOrchestrator
├── BugHuntWorkflow ← Created by: PRP Pipeline
├── FixCycleWorkflow ← Created by: PRP Pipeline
└── Agent Factory ← Used by: TaskOrchestrator
```

### External Dependencies

- **Node.js fs/promises**: File system operations
- **Zod**: Schema validation (StatusEnum, Task models)
- **Vitest**: Testing framework
- **TypeScript**: Type system and compiler

---

## Risk Assessment

### High Risk Areas

1. **Constructor Signature Changes**: Risk of breaking existing code
   - **Mitigation**: Use default values, update all call sites, run full test suite

2. **TEST_RESULTS.md Workflow Timing**: Risk of breaking bug fix cycle
   - **Mitigation**: Ensure FixCycleWorkflow reads from file, add file existence checks

3. **Session Path Validation**: Risk of rejecting valid sessions
   - **Mitigation**: Clear validation rules, helpful error messages, debug logging

### Medium Risk Areas

1. **Nested Execution Guard**: Risk of blocking legitimate recursion
   - **Mitigation**: Clear exception for bugfix sessions with SKIP_BUG_FINDING=true

2. **Status Enum Changes**: Risk of breaking status transitions
   - **Mitigation**: StatusEnum already includes "Retrying", just need to verify transitions

---

## Implementation Sequencing

### Recommended Order

1. **Phase 1: Constructor Fixes** (1-2 hours)
   - Fix ResearchQueue constructor calls (TaskOrchestrator + tests)
   - Fix SessionManager constructor calls (23 test files)
   - Run tests to verify fixes

2. **Phase 2: Status Management** (0.5 hours)
   - Verify StatusEnum includes "Retrying" (likely already done)
   - Verify status transitions work correctly

3. **Phase 3: TEST_RESULTS.md Workflow** (2-3 hours)
   - Move file write to correct location
   - Add BugHuntWorkflow.writeBugReport() method
   - Update FixCycleWorkflow to read from file
   - Test bug fix cycle end-to-end

4. **Phase 4: Session Guards** (2-3 hours)
   - Add bugfix session path validation
   - Implement nested execution guard
   - Add debug logging
   - Test guard conditions

**Total Estimated Time**: 5.5-8.5 hours

---

## Success Criteria

### Definition of Done

Each bug fix is complete when:

1. **Code Changes**:
   - ✅ Implementation updated
   - ✅ All calling code updated
   - ✅ Tests updated to match
   - ✅ No new warnings introduced

2. **Testing**:
   - ✅ Unit tests pass
   - ✅ Integration tests pass
   - ✅ Manual testing of fixed workflow
   - ✅ Edge cases covered

3. **Documentation**:
   - ✅ Code comments explain changes
   - ✅ Architecture documentation updated
   - ✅ Test cases document expected behavior

4. **Validation**:
   - ✅ Original issue no longer reproducible
   - ✅ No regressions introduced
   - ✅ PRD requirements satisfied

---

## Open Questions

1. **Constructor Parameter Objects**: Should we refactor ResearchQueue and SessionManager to use parameter objects for future extensibility? (Deferred to future enhancement)

2. **Backwards Compatibility**: Do we need to support old constructor signatures for backwards compatibility? (No - this is internal code, we can update all call sites)

3. **Test File Organization**: Should we consolidate test helper functions to avoid duplication across 23 test files? (Consider during refactor)

4. **File Write Failures**: How should the system handle TEST_RESULTS.md write failures? (Need error handling strategy)

---

## References

- Research Document 1: `001_codebase_audit.md` - Detailed codebase analysis
- Research Document 2: `002_external_dependencies.md` - External best practices
- PRD: `PRD.md` - Original product requirements
- Commit 63bed9c: Added "Retrying" status support

---

## Conclusion

The PRP Pipeline implementation is fundamentally sound with strong architectural patterns. The 4 critical bugs are primarily due to:
1. Constructor signature evolution without updating all call sites
2. Workflow refactoring that left file operations in the wrong location
3. Missing validation logic specified in PRD but never implemented

All issues are fixable with clear, targeted changes. The research findings provide a solid foundation for implementing these fixes correctly.
