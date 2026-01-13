# PRP for P4.M1.T1.S3: Integrate delta workflow with pipeline

---

## Goal

**Feature Goal**: Modify PRPPipeline to automatically detect PRD changes during session initialization and seamlessly handle them via delta sessions that preserve completed work and selectively re-execute affected tasks.

**Deliverable**:

- Modified `src/workflows/prp-pipeline.ts` with delta detection in `initializeSession()`
- New `@Step()` decorated `handleDelta()` method that orchestrates delta workflow
- Updated `run()` method to conditionally execute delta handling
- Unit tests for delta integration in `tests/unit/workflows/prp-pipeline.test.ts`

**Success Definition**:

- PRPPipeline detects PRD changes via `hasSessionChanged()` check in `initializeSession()`
- When changes detected, `handleDelta()` step loads old/new PRD, runs DeltaAnalysisWorkflow, applies TaskPatcher, creates delta session
- Delta session becomes the active session with patched backlog
- Completed tasks not in `delta.taskIds` are preserved unchanged
- Delta summary is logged to user showing affected tasks
- All tests pass with full coverage

## User Persona

**Target User**: PRP Pipeline system - specifically the `initializeSession()` step that needs to branch based on PRD changes

**Use Case**: When a user runs the PRP pipeline after modifying the PRD, the system should automatically detect the change, create a delta session, and only re-execute affected tasks while preserving completed work

**User Journey**:

1. User modifies PRD file (adds/changes/removes requirements)
2. User runs pipeline: `npm run pipeline -- docs/PRD.md`
3. Pipeline initializes session, detects PRD hash mismatch via `hasSessionChanged()`
4. Delta workflow executes automatically:
   - Old PRD loaded from previous session snapshot
   - New PRD loaded from disk
   - DeltaAnalysisWorkflow analyzes changes
   - TaskPatcher applies patches to backlog
   - Delta session created with patched backlog
5. User sees delta summary: "Found 3 changes, 2 tasks need re-execution"
6. Pipeline proceeds with normal execution, skipping preserved completed tasks

**Pain Points Addressed**:

- Manual delta session creation is eliminated - automatic detection
- No more re-running all tasks after PRD changes - only affected tasks re-execute
- No risk of losing completed work - delta preserves unaffected tasks
- Clear visibility into what changed via delta summary logging

## Why

- **Delta Session Completion**: Final step in P4.M1 (Delta Session Implementation) - integrates DeltaAnalysisWorkflow (S1) and TaskPatcher (S2) into main pipeline
- **Zero-Friction PRD Iteration**: Users can modify PRD and re-run pipeline without manual intervention
- **Work Preservation**: Leveraging `delta.taskIds` from DeltaAnalysisWorkflow ensures only affected tasks are reset
- **Pipeline Consistency**: Delta handling follows existing step pattern (@Step decorator, phase tracking)
- **Session Lineage**: Delta sessions maintain parent reference for change tracking

## What

### System Behavior

Modify PRPPipeline to:

1. **Detect Changes in initializeSession()**: After calling `sessionManager.initialize()`, check `hasSessionChanged()`
2. **Branch Execution**: If changed, call `handleDelta()` step before proceeding
3. **handleDelta() Step** (new @Step decorated method):
   - Load old PRD from `currentSession.prdSnapshot` (or from session path)
   - Load new PRD from `sessionManager.prdPath` via `readFile()`
   - Get completed task IDs from `currentSession.taskRegistry` using `filterByStatus(backlog, 'Complete')`
   - Instantiate `DeltaAnalysisWorkflow` with old PRD, new PRD, completed task IDs
   - Run workflow: `const delta = await workflow.run()`
   - Apply patches: `const patchedBacklog = patchBacklog(backlog, delta)`
   - Create delta session: `await sessionManager.createDeltaSession(newPRDPath, patchedBacklog, delta.diffSummary)`
   - Update `currentSession` to point to delta session
   - Log delta summary showing changes count and affected tasks
4. **Continue Normal Flow**: After delta handling (if any), proceed to `decomposePRD()` step

### Success Criteria

- [ ] `initializeSession()` checks `hasSessionChanged()` after session initialization
- [ ] New `@Step({ trackTiming: true })` decorated `handleDelta()` method added
- [ ] `handleDelta()` loads old PRD from session snapshot, new PRD from disk
- [ ] `handleDelta()` extracts completed task IDs via `filterByStatus(backlog, 'Complete')`
- [ ] `handleDelta()` runs DeltaAnalysisWorkflow with correct inputs
- [ ] `handleDelta()` calls `patchBacklog()` with backlog and delta analysis
- [ ] `handleDelta()` creates delta session with patched backlog
- [ ] `handleDelta()` updates pipeline to use delta session
- [ ] `handleDelta()` logs delta summary (changes count, affected tasks)
- [ ] `run()` method calls `handleDelta()` when `hasSessionChanged()` is true
- [ ] Unit tests cover delta detection, session switching, backlog patching
- [ ] Integration test verifies full delta workflow end-to-end

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Complete PRPPipeline structure with line numbers for `initializeSession()` and `run()` methods
- Exact SessionManager API (`hasSessionChanged()`, `createDeltaSession()`, `currentSession` getter)
- Complete DeltaAnalysisWorkflow invocation pattern (constructor + `run()`)
- Complete TaskPatcher API (`patchBacklog()` function signature and import)
- Exact utility functions for extracting completed tasks (`filterByStatus()`)
- @Step() decorator pattern with options
- Session loading and PRD file paths
- Test patterns from existing pipeline tests
- Import patterns with .js extension requirements

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: src/workflows/prp-pipeline.ts
  why: Main pipeline class to modify for delta integration
  critical: Lines 94-130 show class structure and constructor
  critical: Lines 249-278 show initializeSession() implementation
  critical: Lines 568-636 show run() method with step sequence
  critical: Lines 487-522 show cleanup() @Step() decorator pattern
  pattern: this.sessionManager, this.taskOrchestrator, this.logger usage
  pattern: this.currentPhase for phase tracking
  gotcha: TaskOrchestrator created AFTER session initialization (line 268)
  gotcha: Steps are called sequentially with await, no parallel execution

- file: src/core/session-manager.ts
  why: Session management APIs needed for delta detection and session creation
  critical: Lines 825-833 show hasSessionChanged() implementation
  critical: Lines 338-485 show createDeltaSession() method signature
  critical: Lines 147-242 show initialize() method
  critical: Lines 234-242 show currentSession getter
  pattern: await sessionManager.initialize() returns SessionState
  pattern: sessionManager.currentSession.prdSnapshot contains old PRD
  pattern: sessionManager.prdPath contains PRD file path
  gotcha: hasSessionChanged() throws if no session loaded or no hash computed

- file: src/workflows/delta-analysis-workflow.ts
  why: Produces DeltaAnalysis that TaskPatcher consumes
  critical: Lines 65-79 show constructor (oldPRD, newPRD, completedTasks)
  critical: Lines 94-129 show analyzeDelta() step implementation
  critical: Lines 147-163 show run() method that calls analyzeDelta()
  pattern: new DeltaAnalysisWorkflow(oldPRD, newPRD, completedTasks)
  pattern: const analysis = await workflow.run() returns DeltaAnalysis
  pattern: analysis.changes, analysis.patchInstructions, analysis.taskIds
  gotcha: Constructor throws if oldPRD or newPRD is empty

- docfile: plan/001_14b9dc2a33c7/P4M1T1S2/PRP.md
  why: Defines TaskPatcher contract from parallel work item
  critical: TaskPatcher provides patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog
  critical: Export from src/core/task-patcher.ts
  critical: Handles 'added', 'modified', 'removed' changes
  note: Assume implementation exists exactly as specified in that PRP

- file: src/utils/task-utils.ts
  why: Contains filterByStatus() for extracting completed tasks
  critical: Lines 165-188 show filterByStatus() implementation
  pattern: const completedItems = filterByStatus(backlog, 'Complete')
  pattern: const completedIds = completedItems.map(item => item.id)
  note: Returns HierarchyItem[] which includes Phase, Milestone, Task, Subtask

- file: src/core/models.ts
  why: All data model definitions needed for type safety
  critical: Lines 762-807 show SessionState interface (prdSnapshot, taskRegistry fields)
  critical: Lines 663-716 show SessionMetadata interface (id, hash, path fields)
  critical: Lines 847-881 show DeltaSession interface (oldPRD, newPRD, diffSummary)
  critical: Lines 55-61 show Status enum ('Complete' value)
  critical: Lines 1462-1496 show DeltaAnalysis interface
  critical: Lines 587-599 show Backlog interface
  pattern: All properties are readonly - immutability enforced
  note: DeltaSession extends SessionState with additional fields

- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Groundswell Workflow and Step decorator documentation
  critical: @Step decorator options: name, trackTiming, snapshotState, logStart, logFinish
  pattern: @Step({ trackTiming: true }) async methodName() { ... }
  note: Steps are tracked automatically when decorated

- file: tests/unit/workflows/prp-pipeline.test.ts
  why: Existing test patterns for pipeline modifications
  critical: Shows vi.mock() pattern for mocking SessionManager
  critical: Shows AAA (Arrange-Act-Assert) test structure
  pattern: describe() for suites, it() for individual tests
  pattern: Use vi.fn() for mocks, expect().toEqual() for assertions
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── workflows/
│   ├── prp-pipeline.ts                # MODIFY: Add delta detection and handleDelta()
│   ├── delta-analysis-workflow.ts     # USE: Already exists from P4.M1.T1.S1
│   └── index.ts                       # EXPORT: Exports PRPPipeline
├── core/
│   ├── session-manager.ts             # USE: hasSessionChanged(), createDeltaSession()
│   ├── task-patcher.ts                # USE: patchBacklog() from P4.M1.T1.S2
│   ├── task-orchestrator.ts           # USE: Updated with patched backlog
│   └── models.ts                      # USE: SessionState, DeltaAnalysis, Backlog types
└── utils/
    └── task-utils.ts                  # USE: filterByStatus() for completed tasks

tests/
└── unit/
    └── workflows/
        └── prp-pipeline.test.ts       # MODIFY: Add delta integration tests
```

### Desired Codebase Tree with Files Modified

```bash
# MODIFIED FILES:
src/workflows/
└── prp-pipeline.ts                    # MODIFY:
                                        # - Add hasSessionChanged check in initializeSession()
                                        # - Add handleDelta() method with @Step() decorator
                                        # - Update run() to call handleDelta() when changed

tests/unit/workflows/
└── prp-pipeline.test.ts               # MODIFY:
                                        # - Add delta detection tests
                                        # - Add handleDelta() tests
                                        # - Add integration test for full delta flow

# All other files remain unchanged
# (DeltaAnalysisWorkflow and TaskPatcher already exist from previous work items)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: TypeScript ES Module imports
// - ALL imports must use .js extension (even for .ts files)
// - Example: import { patchBacklog } from '../core/task-patcher.js';
// - This is due to "module": "NodeNext" in tsconfig.json

// CRITICAL: TaskOrchestrator creation timing
// - TaskOrchestrator is created in initializeSession() AFTER sessionManager.initialize()
// - See prp-pipeline.ts line 268
// - Delta handling must happen AFTER TaskOrchestrator is created
// - Order: sessionManager.initialize() -> check hasSessionChanged() -> if changed: handleDelta()

// CRITICAL: SessionManager hasSessionChanged() behavior
// - Returns true if current PRD hash differs from session hash
// - Throws if no session loaded or no hash computed
// - Must be called AFTER sessionManager.initialize() succeeds
// - Cached #prdHash is computed during initialize()

// CRITICAL: Old PRD content location
// - Option 1: sessionManager.currentSession.prdSnapshot (already loaded in memory)
// - Option 2: Load from session path: readFile(session.metadata.path + '/prd_snapshot.md')
// - Use Option 1 for simplicity - prdSnapshot already available

// CRITICAL: New PRD content location
// - Load from disk: readFile(sessionManager.prdPath, 'utf-8')
// - sessionManager.prdPath is the original PRD file path
// - Use readFile() from 'node:fs/promises'

// CRITICAL: Completed task extraction
// - Use filterByStatus(backlog, 'Complete') from task-utils.ts
// - Returns HierarchyItem[] (all levels: Phase, Milestone, Task, Subtask)
// - Map to IDs: .map(item => item.id)
// - Consider filtering to only leaf tasks (Task/Subtask) if needed
// - For delta analysis, pass all completed item IDs

// CRITICAL: DeltaAnalysisWorkflow constructor validation
// - Throws Error if oldPRD is empty or whitespace-only
// - Throws Error if newPRD is empty or whitespace-only
// - completedTasks can be empty array (no completed work)

// CRITICAL: SessionManager.createDeltaSession() signature
// - Based on session-manager.ts lines 338-485
// - Signature: createDeltaSession(newPRDPath: string, backlog: Backlog, summary: string)
// - Creates new session with parentSession reference
// - Returns Promise<DeltaSession>

// CRITICAL: @Step() decorator pattern
// - Import: import { Workflow, Step } from 'groundswell';
// - Decorator: @Step({ trackTiming: true })
// - Only cleanup() currently uses @Step in PRPPipeline
// - Decorated steps are automatically tracked for timing and logging

// CRITICAL: Phase tracking
// - Use this.currentPhase to track pipeline phase
// - Set to 'delta_handling' when in handleDelta()
// - Set to 'session_initialized' after delta handling completes

// CRITICAL: Logger usage
// - Use this.logger.info() for informational messages
// - Use this.logger.warn() for warnings
// - Use this.logger.error() for errors
// - Format: '[PRPPipeline] Message'

// GOTCHA: Delta session becomes the new currentSession
// - After createDeltaSession(), need to reload session
// - Or: createDeltaSession() returns DeltaSession, assign to session context
// - TaskOrchestrator may need to be updated with new backlog
// - Check session-manager.ts for exact createDeltaSession() behavior

// GOTCHA: TaskOrchestrator update after delta
// - TaskOrchestrator receives sessionManager in constructor
// - If backlog changes, TaskOrchestrator needs to be aware
// - May need to recreate TaskOrchestrator or update its session reference
// - Check task-orchestrator.ts for how it accesses backlog

// GOTCHA: Delta summary logging
// - Log changes count: delta.changes.length
// - Log affected tasks: delta.taskIds.join(', ')
// - Log patch instructions: delta.patchInstructions
// - Format: "[PRPPipeline] Delta: Found X changes, Y tasks need re-execution"
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Uses existing interfaces:

```typescript
// From src/core/models.ts

// Session state (current session loaded from previous run)
interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string; // Old PRD content
  readonly taskRegistry: Backlog; // Current backlog
  readonly currentItemId: string | null;
}

// Delta analysis result (from DeltaAnalysisWorkflow)
interface DeltaAnalysis {
  readonly changes: RequirementChange[];
  readonly patchInstructions: string;
  readonly taskIds: string[];
}

// Requirement change details
interface RequirementChange {
  readonly itemId: string;
  readonly type: 'added' | 'modified' | 'removed';
  readonly description: string;
  readonly impact: string;
}

// Status enum for filtering completed tasks
type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// Backlog structure
interface Backlog {
  readonly backlog: Phase[];
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY initializeSession() - Add delta detection check
  - ADD: Import for readFile from 'node:fs/promises'
  - ADD: Import for filterByStatus from '../utils/task-utils.js'
  - LOCATE: Lines 249-278 in src/workflows/prp-pipeline.ts
  - FIND: After line 268 where TaskOrchestrator is created
  - ADD: Check if sessionManager.hasSessionChanged()
  - IF true: Call await this.handleDelta()
  - PRESERVE: All existing initializeSession() logic
  - PATTERN: if (this.sessionManager.hasSessionChanged()) { await this.handleDelta(); }
  - PLACEMENT: src/workflows/prp-pipeline.ts initializeSession() method

Task 2: ADD imports for delta workflow dependencies
  - ADD: import { readFile } from 'node:fs/promises';
  - ADD: import { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
  - ADD: import { patchBacklog } from '../core/task-patcher.js';
  - ADD: import { filterByStatus } from '../utils/task-utils.js';
  - ADD: import type { DeltaAnalysis } from '../core/models.js';
  - PRESERVE: All existing imports
  - PLACEMENT: Top of src/workflows/prp-pipeline.ts

Task 3: CREATE handleDelta() method with @Step() decorator
  - DECORATE: @Step({ trackTiming: true, name: 'handleDelta' })
  - SIGNATURE: async handleDelta(): Promise<void>
  - IMPLEMENT: Set this.currentPhase = 'delta_handling'
  - IMPLEMENT: Log "[PRPPipeline] PRD has changed, initializing delta session"
  - IMPLEMENT: Get old PRD from this.sessionManager.currentSession.prdSnapshot
  - IMPLEMENT: Load new PRD via readFile(this.sessionManager.prdPath, 'utf-8')
  - IMPLEMENT: Get backlog from this.sessionManager.currentSession.taskRegistry
  - IMPLEMENT: Extract completed task IDs via filterByStatus(backlog, 'Complete')
  - IMPLEMENT: Create DeltaAnalysisWorkflow instance
  - IMPLEMENT: Run workflow: const delta = await workflow.run()
  - IMPLEMENT: Call patchBacklog(backlog, delta)
  - IMPLEMENT: Create delta session via sessionManager.createDeltaSession()
  - IMPLEMENT: Update pipeline session state
  - IMPLEMENT: Log delta summary
  - IMPLEMENT: Set this.currentPhase = 'session_initialized'
  - PLACEMENT: src/workflows/prp-pipeline.ts after initializeSession()

Task 4: IMPLEMENT old PRD retrieval
  - ACCESS: this.sessionManager.currentSession.prdSnapshot
  - VALIDATE: Ensure currentSession exists (should from initialize())
  - ASSIGN: const oldPRD = this.sessionManager.currentSession.prdSnapshot
  - PATTERN: Direct property access - already loaded in memory

Task 5: IMPLEMENT new PRD loading from disk
  - ACCESS: this.sessionManager.prdPath for PRD file path
  - LOAD: const newPRD = await readFile(this.sessionManager.prdPath, 'utf-8')
  - IMPORT: readFile from 'node:fs/promises'
  - ERROR HANDLING: Wrap in try-catch, log error, re-throw
  - PATTERN: await readFile(path, 'utf-8') for text content

Task 6: IMPLEMENT completed task IDs extraction
  - ACCESS: this.sessionManager.currentSession.taskRegistry for backlog
  - FILTER: const completedItems = filterByStatus(backlog, 'Complete')
  - EXTRACT: const completedTaskIds = completedItems.map(item => item.id)
  - CONSIDER: Filter to only Task/Subtask if needed (exclude Phase/Milestone)
  - PATTERN: filterByStatus(backlog, 'Complete').map(i => i.id)

Task 7: IMPLEMENT DeltaAnalysisWorkflow execution
  - IMPORT: DeltaAnalysisWorkflow from './delta-analysis-workflow.js'
  - INSTANTIATE: const workflow = new DeltaAnalysisWorkflow(oldPRD, newPRD, completedTaskIds)
  - EXECUTE: const delta = await workflow.run()
  - TYPE: const delta: DeltaAnalysis = await workflow.run()
  - ERROR HANDLING: Wrap in try-catch, log error, re-throw
  - PATTERN: await new Workflow(...).run()

Task 8: IMPLEMENT backlog patching via TaskPatcher
  - IMPORT: patchBacklog from '../core/task-patcher.js'
  - CALL: const patchedBacklog = patchBacklog(backlog, delta)
  - PRESERVE: Original backlog unchanged (immutability)
  - PATTERN: Direct function call with backlog and delta

Task 9: IMPLEMENT delta session creation
  - CALL: await this.sessionManager.createDeltaSession(newPRDPath, patchedBacklog, summary)
  - PARAMETERS:
    - newPRDPath: this.sessionManager.prdPath
    - backlog: patchedBacklog
    - summary: delta.patchInstructions or custom summary
  - HANDLE: Create delta session with parent reference
  - UPDATE: Ensure pipeline uses new delta session
  - PATTERN: await sessionManager.createDeltaSession(...)

Task 10: IMPLEMENT delta summary logging
  - LOG: "[PRPPipeline] Delta: Found {delta.changes.length} changes"
  - LOG: "[PRPPipeline] Tasks to re-execute: {delta.taskIds.join(', ')}"
  - LOG: "[PRPPipeline] Patch instructions: {delta.patchInstructions}"
  - LOG: "[PRPPipeline] Delta session created: {deltaSessionId}"
  - PATTERN: this.logger.info() for informational messages

Task 11: UPDATE TaskOrchestrator if needed
  - CHECK: If TaskOrchestrator caches backlog, update it
  - OPTION 1: Recreate TaskOrchestrator with new session
  - OPTION 2: TaskOrchestrator reads from sessionManager (no update needed)
  - VERIFY: Check task-orchestrator.ts implementation
  - DECISION: Based on TaskOrchestrator design

Task 12: CREATE unit tests for delta detection in initializeSession()
  - IMPORT: describe, expect, it, vi, beforeEach from 'vitest'
  - IMPORT: PRPPipeline from '../../../src/workflows/prp-pipeline.js'
  - MOCK: SessionManager with hasSessionChanged() returning true/false
  - MOCK: handleDelta() method
  - TEST: "initializeSession calls handleDelta when hasSessionChanged is true"
  - TEST: "initializeSession does not call handleDelta when hasSessionChanged is false"
  - TEST: "initializeSession throws when hasSessionChanged throws"
  - FOLLOW pattern: tests/unit/workflows/prp-pipeline.test.ts

Task 13: CREATE unit tests for handleDelta() method
  - MOCK: SessionManager.currentSession with prdSnapshot and taskRegistry
  - MOCK: readFile for new PRD loading
  - MOCK: DeltaAnalysisWorkflow.run() returning DeltaAnalysis
  - MOCK: patchBacklog() returning patched backlog
  - MOCK: SessionManager.createDeltaSession()
  - TEST: "handleDelta loads old PRD from session"
  - TEST: "handleDelta loads new PRD from disk"
  - TEST: "handleDelta extracts completed task IDs"
  - TEST: "handleDelta runs DeltaAnalysisWorkflow"
  - TEST: "handleDelta calls patchBacklog with correct parameters"
  - TEST: "handleDelta creates delta session"
  - TEST: "handleDelta logs delta summary"
  - COVERAGE: All branches and error paths

Task 14: CREATE integration test for full delta workflow
  - SETUP: Create test PRD files (old and new)
  - SETUP: Create test session with backlog
  - EXECUTE: Run full initializeSession with delta detection
  - VERIFY: Delta session created
  - VERIFY: Backlog patched correctly
  - VERIFY: Completed tasks preserved
  - VERIFY: Delta summary logged
  - PATTERN: End-to-end test with minimal mocking

Task 15: VERIFY all imports use .js extension
  - CHECK: All import statements end with .js
  - VERIFY: No bare imports (e.g., './delta-analysis-workflow')
  - PATTERN: import { X } from './path/to/file.js';
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// IMPORTS TO ADD (top of src/workflows/prp-pipeline.ts)
// ============================================================================

import { readFile } from 'node:fs/promises';
import { Workflow, Step } from 'groundswell';
import { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
import { patchBacklog } from '../core/task-patcher.js';
import { filterByStatus } from '../utils/task-utils.js';
import type { DeltaAnalysis } from '../core/models.js';

// ============================================================================
// MODIFIED initializeSession() METHOD
// ============================================================================

/**
 * Initialize session - detect PRD changes and handle delta if needed
 *
 * @remarks
 * After normal session initialization, checks if PRD has changed.
 * If changed, invokes delta workflow to create delta session with
 * patched backlog that preserves completed work.
 */
async initializeSession(): Promise<void> {
  this.logger.info('[PRPPipeline] Initializing session');

  try {
    // Initialize session manager (detects new vs existing)
    const session = await this.sessionManager.initialize();

    this.logger.info(`[PRPPipeline] Session: ${session.metadata.id}`);
    this.logger.info(`[PRPPipeline] Path: ${session.metadata.path}`);
    this.logger.info(
      `[PRPPipeline] Existing: ${session.taskRegistry.backlog.length > 0}`
    );

    // Create TaskOrchestrator now that session is initialized
    this.taskOrchestrator = new TaskOrchestratorClass(
      this.sessionManager,
      this.#scope
    );

    // ============================================================================
    // NEW: Check for PRD changes and handle delta if needed
    // ============================================================================
    if (this.sessionManager.hasSessionChanged()) {
      this.logger.info('[PRPPipeline] PRD has changed, initializing delta session');
      await this.handleDelta();
    }

    // Update phase
    this.currentPhase = 'session_initialized';

    this.logger.info('[PRPPipeline] Session initialized successfully');
  } catch (error) {
    this.logger.error(
      `[PRPPipeline] Session initialization failed: ${error}`
    );
    throw error;
  }
}

// ============================================================================
// NEW handleDelta() METHOD
// ============================================================================

/**
 * Handle PRD changes via delta workflow
 *
 * @remarks
 * Executes delta analysis and task patching to create a delta session
 * that preserves completed work while re-executing affected tasks.
 *
 * Steps:
 * 1. Load old PRD from session snapshot
 * 2. Load new PRD from disk
 * 3. Extract completed task IDs
 * 4. Run DeltaAnalysisWorkflow
 * 5. Apply patches via TaskPatcher
 * 6. Create delta session
 * 7. Log delta summary
 */
@Step({ trackTiming: true, name: 'handleDelta' })
async handleDelta(): Promise<void> {
  this.currentPhase = 'delta_handling';

  try {
    // Get current session state
    const currentSession = this.sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot handle delta: no session loaded');
    }

    // Step 1: Get old PRD from session snapshot
    const oldPRD = currentSession.prdSnapshot;
    if (!oldPRD) {
      throw new Error('Cannot handle delta: no PRD snapshot in session');
    }

    // Step 2: Load new PRD from disk
    let newPRD: string;
    try {
      newPRD = await readFile(this.sessionManager.prdPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load new PRD from ${this.sessionManager.prdPath}: ${error}`);
    }

    // Step 3: Extract completed task IDs
    const backlog = currentSession.taskRegistry;
    const completedItems = filterByStatus(backlog, 'Complete');
    const completedTaskIds = completedItems
      .filter(item => item.type === 'Task' || item.type === 'Subtask')
      .map(item => item.id);

    this.logger.info(`[PRPPipeline] Found ${completedTaskIds.length} completed tasks`);

    // Step 4: Run DeltaAnalysisWorkflow
    this.logger.info('[PRPPipeline] Running delta analysis...');
    const workflow = new DeltaAnalysisWorkflow(oldPRD, newPRD, completedTaskIds);
    const delta: DeltaAnalysis = await workflow.run();

    this.logger.info(`[PRPPipeline] Delta analysis found ${delta.changes.length} changes`);
    this.logger.info(`[PRPPipeline] Tasks to re-execute: ${delta.taskIds.join(', ')}`);

    // Step 5: Apply patches to backlog
    this.logger.info('[PRPPipeline] Patching backlog...');
    const patchedBacklog = patchBacklog(backlog, delta);

    // Step 6: Create delta session
    this.logger.info('[PRPPipeline] Creating delta session...');
    const deltaSession = await this.sessionManager.createDeltaSession(
      this.sessionManager.prdPath,
      patchedBacklog,
      delta.patchInstructions
    );

    // Step 7: Update pipeline to use delta session
    // Note: createDeltaSession() should update currentSession internally
    // Verify session-manager.ts implementation for exact behavior

    // Log delta summary
    this.logger.info('[PRPPipeline] ===== Delta Summary =====');
    this.logger.info(`[PRPPipeline] Delta session: ${deltaSession.metadata.id}`);
    this.logger.info(`[PRPPipeline] Parent session: ${deltaSession.metadata.parentSession}`);
    this.logger.info(`[PRPPipeline] Changes found: ${delta.changes.length}`);
    this.logger.info(`[PRPPipeline] Tasks to re-execute: ${delta.taskIds.length}`);
    this.logger.info(`[PRPPipeline] Affected tasks: ${delta.taskIds.join(', ')}`);
    this.logger.info(`[PRPPipeline] Patch instructions: ${delta.patchInstructions}`);
    this.logger.info('[PRPPipeline] ===== End Delta Summary =====');

    // Update phase
    this.currentPhase = 'session_initialized';
  } catch (error) {
    this.logger.error(`[PRPPipeline] Delta handling failed: ${error}`);
    throw error;
  }
}

// ============================================================================
// RUN() METHOD UPDATE (if needed)
// ============================================================================

// The run() method may not need modification if handleDelta() is called
// from within initializeSession(). Verify based on actual implementation.
```

### Integration Points

```yaml
SESSION_MANAGER:
  - file: src/core/session-manager.ts
  - methods:
    - hasSessionChanged(): boolean - Detect PRD hash mismatch
    - createDeltaSession(newPRDPath, backlog, summary): Promise<DeltaSession>
    - currentSession: SessionState - Access current session state
    - prdPath: string - Path to PRD file
  - flow: initialize() -> hasSessionChanged() -> (if true) -> handleDelta() -> createDeltaSession()

DELTA_ANALYSIS_WORKFLOW:
  - file: src/workflows/delta-analysis-workflow.ts
  - constructor: DeltaAnalysisWorkflow(oldPRD, newPRD, completedTasks)
  - method: run(): Promise<DeltaAnalysis>
  - output: DeltaAnalysis with changes, patchInstructions, taskIds
  - flow: handleDelta() -> new Workflow() -> run() -> DeltaAnalysis

TASK_PATCHER:
  - file: src/core/task-patcher.ts
  - function: patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog
  - input: Current backlog and delta analysis
  - output: New immutable backlog with applied patches
  - flow: handleDelta() -> patchBacklog() -> patchedBacklog

TASK_UTILS:
  - file: src/utils/task-utils.ts
  - function: filterByStatus(backlog: Backlog, status: Status): HierarchyItem[]
  - usage: Extract completed tasks for delta analysis
  - flow: handleDelta() -> filterByStatus(backlog, 'Complete') -> completedTaskIds

TASK_ORCHESTRATOR:
  - file: src/core/task-orchestrator.ts
  - constructor: TaskOrchestrator(sessionManager, scope)
  - note: May need update after backlog changes
  - verify: Check if TaskOrchestrator reads fresh backlog from sessionManager
  - flow: initializeSession() -> create TaskOrchestrator -> (after delta) -> verify/recreate
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying prp-pipeline.ts
npm run lint -- src/workflows/prp-pipeline.ts
npm run format -- src/workflows/prp-pipeline.ts
npm run typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run tests for pipeline
npm test -- tests/unit/workflows/prp-pipeline.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/workflows/prp-pipeline.test.ts

# Full test suite
npm test

# Expected: All tests pass. Coverage maintained or improved.
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify delta detection works end-to-end
# 1. Create initial session with test PRD
npm run pipeline -- test-data/sample-prd.md

# 2. Modify PRD file
echo "## New Requirement\nAdded feature" >> test-data/sample-prd.md

# 3. Re-run pipeline - should trigger delta detection
npm run pipeline -- test-data/sample-prd.md

# 4. Verify delta session created
ls -la plan/ | grep delta

# 5. Verify logs show delta summary
grep "Delta Summary" logs/pipeline.log

# Expected: Delta session created, delta summary logged, affected tasks re-executed
```

### Level 4: Manual Testing (Functional Validation)

```bash
# Test complete delta workflow manually

# Setup: Create test PRD
cat > /tmp/test-prd.md << 'EOF'
# Test Project

## P1: Phase 1
### P1.M1: Milestone 1
#### P1.M1.T1: Task 1
##### P1.M1.T1.S1: Implement feature
Status: Planned
##### P1.M1.T1.S2: Test feature
Status: Planned
EOF

# Run initial pipeline
npm run pipeline -- /tmp/test-prd.md

# Mark some tasks complete (simulate previous run)
# (This would require editing session state manually for testing)

# Modify PRD
cat > /tmp/test-prd.md << 'EOF'
# Test Project

## P1: Phase 1
### P1.M1: Milestone 1
#### P1.M1.T1: Task 1
##### P1.M1.T1.S1: Implement feature with OAuth2
Status: Planned
##### P1.M1.T1.S2: Test feature
Status: Planned
#### P1.M1.T2: Task 2 (NEW)
##### P1.M1.T2.S1: Implement new feature
Status: Planned
EOF

# Run pipeline again - should detect delta
npm run pipeline -- /tmp/test-prd.md

# Expected:
# - Log message: "PRD has changed, initializing delta session"
# - Delta analysis runs
# - Patch backlog created
# - Delta session created with parent reference
# - Delta summary logged showing:
#   - P1.M1.T1.S1 marked as 'modified'
#   - P1.M1.T2 added as 'added'
#   - P1.M1.T1.S2 preserved as 'Complete' (unchanged)
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm test` passes with zero failures
- [ ] `npm run test:coverage` shows maintained/improved coverage
- [ ] All imports use .js extension

### Feature Validation

- [ ] `initializeSession()` calls `hasSessionChanged()` after session initialization
- [ ] `handleDelta()` is called when `hasSessionChanged()` returns true
- [ ] `handleDelta()` is NOT called when `hasSessionChanged()` returns false
- [ ] `handleDelta()` loads old PRD from `sessionManager.currentSession.prdSnapshot`
- [ ] `handleDelta()` loads new PRD from `sessionManager.prdPath`
- [ ] `handleDelta()` extracts completed task IDs via `filterByStatus()`
- [ ] `handleDelta()` runs `DeltaAnalysisWorkflow` with correct parameters
- [ ] `handleDelta()` calls `patchBacklog()` with backlog and delta
- [ ] `handleDelta()` creates delta session via `createDeltaSession()`
- [ ] `handleDelta()` logs delta summary with changes count and affected tasks
- [ ] Delta session preserves completed tasks not in `delta.taskIds`
- [ ] Delta session parent reference is set correctly
- [ ] TaskOrchestrator works with patched backlog

### Code Quality Validation

- [ ] `handleDelta()` decorated with `@Step({ trackTiming: true })`
- [ ] Phase tracking updated (delta_handling -> session_initialized)
- [ ] Logger used for all informational/error messages
- [ ] Error handling with try-catch blocks
- [ ] Errors re-thrown after logging
- [ ] File paths validated before readFile()
      -- Session state validated before access
- [ ] Type-safe operations (no any types)
- [ ] JSDoc comments on new methods

### Documentation & Deployment

- [ ] `handleDelta()` has JSDoc comments
- [ ] Delta summary logging is user-friendly
- [ ] Error messages are clear and actionable
- [ ] Code is self-documenting with clear names
- [ ] Integration points documented in code comments

---

## Anti-Patterns to Avoid

- **Don't** call `handleDelta()` before `TaskOrchestrator` is created - it's created at line 268
- **Don't** forget .js extension in imports - breaks ES module resolution
- **Don't** skip validating `currentSession` exists before accessing properties
- **Don't** skip validating PRD content is not empty before passing to DeltaAnalysisWorkflow
- **Don't** mutate the original backlog - use `patchBacklog()` which returns new immutable backlog
- **Don't** forget to catch errors from `readFile()` - PRD file may not exist
- **Don't** hardcode PRD paths - use `sessionManager.prdPath`
- **Don't** skip logging the delta summary - users need visibility into changes
- **Don't** recreate TaskOrchestrator unnecessarily - check if it reads fresh backlog from sessionManager
- **Don't** skip updating `currentPhase` - phase tracking is important for observability
- **Don't** use console.log for errors - use `this.logger.error()`
- **Don't** skip @Step decorator on handleDelta - timing tracking is valuable
- **Don't** filter out Phase/Milestone from completed tasks unless required - include all completed work
- **Don't** assume `createDeltaSession()` updates currentSession - verify SessionManager implementation
