# PRP for P4.M1.T1.S2: Implement task patching logic

---

## Goal

**Feature Goal**: Create an immutable task patching utility that updates a Backlog based on DeltaAnalysis, handling added requirements (new tasks via Architect agent), modified requirements (status reset to Planned), and removed requirements (status set to Obsolete).

**Deliverable**:

- `src/core/task-patcher.ts` - Pure function `patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog`
- Unit tests in `tests/unit/core/task-patcher.test.ts`

**Success Definition**:

- `patchBacklog()` function accepts Backlog and DeltaAnalysis, returns new immutable Backlog
- For each affected task in delta.taskIds: 'added' changes run Architect agent for new sections, 'modified' changes set status to 'Planned', 'removed' changes set status to 'Obsolete'
- Completed tasks not in delta.taskIds are preserved unchanged
- All tests pass with 100% coverage

## User Persona

**Target User**: PRP Pipeline system - specifically the DeltaAnalysisWorkflow caller that consumes DeltaAnalysis

**Use Case**: When PRD changes are detected (delta session), the task patching logic transforms the current backlog based on what changed, preparing it for re-execution

**User Journey**:

1. DeltaAnalysisWorkflow completes and returns DeltaAnalysis
2. Pipeline calls `patchBacklog(currentBacklog, deltaAnalysis)`
3. Task patcher processes each change type appropriately:
   - Added: Generates new tasks via Architect agent and inserts into backlog
   - Modified: Resets task status to 'Planned' for re-implementation
   - Removed: Marks task as 'Obsolete' with deprecation note
4. Returns patched backlog ready for delta session execution
5. TaskOrchestrator consumes patched backlog, skipping Complete/Obsolete tasks

**Pain Points Addressed**:

- Manual backlog editing after PRD changes is eliminated
- Completed work is automatically preserved (only affected tasks reset)
- Type-safe immutable updates prevent accidental state corruption
- Architect agent integration ensures new sections follow proper task hierarchy

## Why

- **Delta Session Core**: Second step in P4.M1 (Delta Session Implementation) - transforms DeltaAnalysis into actionable backlog updates
- **Work Preservation**: Uses delta.taskIds to precisely identify affected tasks, leaving completed work intact
- **Immutable Safety**: Maintains codebase immutability patterns (readonly properties, spread operators)
- **Agent Integration**: Leverages existing Architect agent for new section generation
- **Type Safety**: Builds on existing Zod-validated DeltaAnalysis and Backlog interfaces

## What

### System Behavior

Create a pure function that:

1. **Accepts Input**: `backlog: Backlog` (current state), `delta: DeltaAnalysis` (from P4.M1.T1.S1)
2. **Preserves Completed Work**: Tasks not in `delta.taskIds` remain unchanged (especially Complete status)
3. **Handles Three Change Types**:
   - **Added** (type: 'added'): Run Architect agent to generate new task sections, insert into backlog
   - **Modified** (type: 'modified'): Set task status to 'Planned' (reset for re-implementation)
   - **Removed** (type: 'removed'): Set task status to 'Obsolete', add deprecation note to context_scope or description
4. **Returns**: New immutable Backlog with applied patches

### Success Criteria

- [ ] `patchBacklog()` function exported from `src/core/task-patcher.ts`
- [ ] Function signature: `patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog`
- [ ] For 'added' changes: Calls `createArchitectAgent().prompt()` with new PRD section, generates new tasks, inserts into backlog
- [ ] For 'modified' changes: Uses existing `updateItemStatus()` utility to set status to 'Planned'
- [ ] For 'removed' changes: Sets status to 'Obsolete' and adds deprecation note
- [ ] Completed tasks (status: 'Complete') not in delta.taskIds remain unchanged
- [ ] Returns new Backlog (original unchanged - immutability verified)
- [ ] Unit tests cover all three change types, immutability, and edge cases
- [ ] 100% test coverage achieved

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Complete DeltaAnalysis interface from previous work item (P4.M1.T1.S1 PRP)
- Exact Backlog structure and Status enum values
- Existing `updateItemStatus()` utility pattern from task-utils.ts
- Architect agent invocation pattern from agent-factory.ts
- Immutability patterns (spread operators, readonly properties)
- Test patterns from existing task-utils tests
- Import patterns with .js extension requirements

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- docfile: plan/001_14b9dc2a33c7/P4M1T1S1/PRP.md
  why: Previous PRP that produces DeltaAnalysis - defines input contract
  critical: Lines 1462-1496 show DeltaAnalysis interface structure
  critical: Lines 1361-1400 show RequirementChange interface
  note: delta.taskIds contains IDs of tasks needing re-execution

- file: src/core/models.ts
  why: All data model definitions needed for implementation
  critical: Lines 55-85 show Status enum (Planned, Complete, Obsolete, etc.)
  critical: Lines 286-322 show Task interface structure
  critical: Lines 478-513 show Phase interface structure
  critical: Lines 1462-1496 show DeltaAnalysis interface
  critical: Lines 1361-1400 show RequirementChange interface with type: 'added' | 'modified' | 'removed'
  pattern: All properties are readonly - immutability is enforced at type level
  gotcha: Subtask has context_scope field that can be modified for deprecation notes

- file: src/utils/task-utils.ts
  why: Contains `updateItemStatus()` utility for status updates
  critical: Lines 261-364 show updateItemStatus() implementation pattern
  critical: Lines 90-108 show findItem() for locating tasks by ID
  pattern: Uses nested spread operators for deep immutable updates
  pattern: Returns new Backlog object - original is unchanged
  gotcha: Must copy entire path from root to target item (readonly properties prevent shallow mutation)

- file: src/agents/agent-factory.ts
  why: Contains createArchitectAgent() for generating new tasks
  critical: Lines 185-193 show createArchitectAgent() implementation
  critical: Returns Agent instance - call .prompt() to execute
  pattern: const architect = createArchitectAgent(); const result = await architect.prompt(prompt);
  gotcha: Architect agent returns Backlog type - needs validation before inserting

- file: src/agents/prompts/architect-prompt.ts
  why: Contains createArchitectPrompt() for new task generation
  critical: Shows how to create prompts for Architect agent
  pattern: createArchitectPrompt(prdContent) returns Prompt<Backlog>
  note: For 'added' changes, extract the new PRD section and pass to Architect

- file: tests/unit/utils/task-utils.test.ts
  why: Test patterns for task manipulation functions
  critical: Shows vi.mock() pattern for mocking agents
  critical: Shows AAA (Arrange-Act-Assert) test structure
  pattern: describe() for suites, it() for individual tests
  pattern: Use vi.fn() for mocks, expect().toEqual() for assertions

- file: vitest.config.ts
  why: Test configuration requirements
  critical: Lines 30-36 show 100% coverage threshold requirement
  pattern: All branches, functions, lines, statements must be covered
```

### Current Codebase Tree

```bash
src/
├── core/
│   ├── models.ts                  # Backlog, Task, Status, DeltaAnalysis interfaces
│   ├── task-patcher.ts            # CREATE: New file for patchBacklog()
│   └── index.ts                   # EXPORT: Add patchBacklog export
├── utils/
│   └── task-utils.ts              # updateItemStatus(), findItem() utilities
├── agents/
│   ├── agent-factory.ts           # createArchitectAgent()
│   └── prompts/
│       └── architect-prompt.ts    # createArchitectPrompt()
└── ...

tests/
└── unit/
    └── core/
        └── task-patcher.test.ts   # CREATE: Unit tests
```

### Desired Codebase Tree with Files Added

```bash
# NEW FILES:
src/core/
└── task-patcher.ts                # CREATE: patchBacklog() function

tests/unit/core/
└── task-patcher.test.ts           # CREATE: Unit tests

# MODIFIED FILES:
src/core/index.ts                  # MODIFY: Export patchBacklog function

# All other files remain unchanged
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: TypeScript ES Module imports
// - ALL imports must use .js extension (even for .ts files)
// - Example: import { Backlog } from './core/models.js';
// - This is due to "module": "NodeNext" in tsconfig.json

// CRITICAL: Immutability enforcement
// - All model properties are readonly
// - Cannot mutate existing objects - must create new copies
// - Use spread operators for structural sharing
// - updateItemStatus() shows the pattern (task-utils.ts lines 261-364)

// CRITICAL: Architect agent invocation for 'added' changes
// - createArchitectAgent() returns Agent instance
// - Agent.prompt() returns Promise<z.infer<typeof BacklogSchema>>
// - Type assertion needed: const result = await architect.prompt(prompt) as Backlog;
// - Architect generates full Backlog - extract the new section for insertion

// GOTCHA: DeltaAnalysis.changes may contain duplicate taskIds
// - Multiple RequirementChange objects can reference same itemId
// - De-duplicate before processing to avoid redundant work
// - Use Set or filter to ensure each task processed once

// GOTCHA: 'added' changes require PRD section content
// - DeltaAnalysis doesn't contain the new PRD section text
// - For P4.M1.T1.S2 scope, mock Architect agent call in tests
// - Future: Delta session will need to pass new PRD for Architect processing
// - Current implementation: Log warning for 'added' changes (Architect call out of scope)

// GOTCHA: 'removed' changes need deprecation note
// - Subtask has context_scope field - append deprecation note there
// - Task/Milestone/Phase have description field - append there
// - Use type narrowing to determine which field to modify

// GOTCHA: Status enum values
// - 'Planned' - reset modified tasks to this
// - 'Complete' - preserve these (don't reset if not in delta.taskIds)
// - 'Obsolete' - set removed tasks to this

// GOTCHA: findItem() returns HierarchyItem | null
// - Need type narrowing: if (item.type === 'Task') { ... }
// - HierarchyItem = Phase | Milestone | Task | Subtask

// CRITICAL: Vitest 100% coverage requirement
// - All branches, functions, lines, statements must be covered
// - Missing coverage causes tests to fail
// - See vitest.config.ts lines 30-36
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Uses existing interfaces:

```typescript
// From src/core/models.ts

// Input models
export interface DeltaAnalysis {
  readonly changes: RequirementChange[];
  readonly patchInstructions: string;
  readonly taskIds: string[];
}

export interface RequirementChange {
  readonly itemId: string;
  readonly type: 'added' | 'modified' | 'removed';
  readonly description: string;
  readonly impact: string;
}

export interface Backlog {
  readonly backlog: Phase[];
}

// Status values
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/core/task-patcher.ts
  - IMPORT: { Backlog, DeltaAnalysis, Status } from '../core/models.js'
  - IMPORT: { updateItemStatus, findItem } from '../utils/task-utils.js'
  - IMPORT: { createArchitectAgent } from '../agents/agent-factory.js'
  - IMPLEMENT: patchBacklog function signature
  - FOLLOW pattern: src/utils/task-utils.ts (pure function pattern)
  - NAMING: camelCase function name, snake_case file name with hyphens
  - PLACEMENT: src/core/task-patcher.ts

Task 2: IMPLEMENT core patchBacklog logic - de-duplicate taskIds
  - CREATE: Set<string> from delta.taskIds to remove duplicates
  - CREATE: Map<string, RequirementChange> from changes for O(1) lookup
  - PATTERN: const uniqueTaskIds = [...new Set(delta.taskIds)]
  - PATTERN: const changeMap = new Map(delta.changes.map(c => [c.itemId, c]))
  - GOTCHA: Changes array may have multiple entries for same itemId

Task 3: IMPLEMENT 'modified' change handling
  - ITERATE: For each change with type: 'modified'
  - FIND: Check if item exists in backlog via findItem()
  - UPDATE: Call updateItemStatus(backlog, itemId, 'Planned')
  - ACCUMULATE: Chain updates, passing new backlog to next iteration
  - PATTERN: backlog = updateItemStatus(backlog, itemId, 'Planned')
  - GOTCHA: updateItemStatus() returns new backlog - must assign

Task 4: IMPLEMENT 'removed' change handling
  - ITERATE: For each change with type: 'removed'
  - FIND: Find item via findItem(backlog, itemId)
  - CHECK: Use type narrowing to determine item type
  - UPDATE: Call updateItemStatus(backlog, itemId, 'Obsolete')
  - NOTE: Deprecation note addition is DEFERRED (requires context manipulation beyond updateItemStatus)
  - PATTERN: backlog = updateItemStatus(backlog, itemId, 'Obsolete')
  - FUTURE: Enhancement to append deprecation note to context_scope or description

Task 5: IMPLEMENT 'added' change handling with Architect agent
  - ITERATE: For each change with type: 'added'
  - CHECK: If itemId already exists in backlog, log warning and skip
  - INVOKE: createArchitectAgent() to get Architect agent
  - CREATE: Prompt with new PRD section content (placeholder for now)
  - EXECUTE: const newBacklog = await architect.prompt(prompt) as Backlog
  - EXTRACT: New task/section from generated backlog
  - INSERT: Insert new item into appropriate location in backlog
  - LOG: Warning that Architect integration is placeholder (new PRD content not available)
  - PATTERN: const architect = createArchitectAgent()
  - GOTCHA: Architect returns full Backlog - need to extract specific new section
  - GOTCHA: Out of scope for this task: Delta session doesn't provide new PRD sections yet

Task 6: IMPLEMENT preservation of completed tasks
  - FILTER: Iterate through all items in backlog
  - CHECK: If item.status === 'Complete' AND item.id NOT in delta.taskIds
  - PRESERVE: Leave unchanged (default behavior - don't call updateItemStatus)
  - VERIFY: Original Complete tasks remain Complete in output

Task 7: MODIFY src/core/index.ts
  - ADD: export { patchBacklog } from './task-patcher.js';
  - PRESERVE: All existing exports
  - PLACEMENT: After existing utility exports

Task 8: CREATE tests/unit/core/task-patcher.test.ts
  - IMPORT: describe, expect, it, vi, beforeEach from 'vitest'
  - IMPORT: patchBacklog from '../../../src/core/task-patcher.js'
  - IMPORT: { Backlog, DeltaAnalysis, Status } from '../../../src/core/models.js'
  - MOCK: vi.mock('../agents/agent-factory.js') for createArchitectAgent
  - IMPLEMENT: describe('patchBacklog') suite
  - IMPLEMENT: 'modified' change test - status resets to 'Planned'
  - IMPLEMENT: 'removed' change test - status sets to 'Obsolete'
  - IMPLEMENT: 'added' change test - Architect agent called
  - IMPLEMENT: completed task preservation test - Complete tasks unchanged
  - IMPLEMENT: immutability test - original backlog unchanged
  - IMPLEMENT: empty changes test - backlog unchanged
  - IMPLEMENT: duplicate taskIds test - each task processed once
  - FOLLOW pattern: tests/unit/utils/task-utils.test.ts
  - COVERAGE: 100% coverage (all branches, lines, statements)
  - PLACEMENT: tests/unit/core/task-patcher.test.ts
```

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// FILE STRUCTURE PATTERN
// ============================================================================

/**
 * Task patching utility for delta session backlog updates
 *
 * @module core/task-patcher
 *
 * @remarks
 * Transforms a backlog based on DeltaAnalysis results from PRD comparison.
 * Handles three change types: added (new tasks), modified (reset to Planned),
 * and removed (mark Obsolete). Completed work is preserved unless explicitly
 * affected by changes.
 *
 * @example
 * ```typescript
 * import { patchBacklog } from './core/task-patcher.js';
 *
 * const patched = patchBacklog(currentBacklog, deltaAnalysis);
 * console.log(`Patched ${deltaAnalysis.taskIds.length} tasks`);
 * ```
 */

import type { Backlog, DeltaAnalysis, Status } from './models.js';
import { updateItemStatus, findItem } from '../utils/task-utils.js';
import { createArchitectAgent } from '../agents/agent-factory.js';

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Patch backlog based on delta analysis
 *
 * @param backlog - Current backlog to patch
 * @param delta - Delta analysis from PRD comparison
 * @returns New immutable backlog with applied patches
 *
 * @remarks
 * Processes three change types:
 * - 'added': Generate new tasks via Architect agent and insert into backlog
 * - 'modified': Reset task status to 'Planned' for re-implementation
 * - 'removed': Set task status to 'Obsolete'
 *
 * Completed tasks not in delta.taskIds are preserved unchanged.
 *
 * Patches are applied immutably - original backlog is unchanged.
 *
 * @example
 * ```typescript
 * const delta: DeltaAnalysis = {
 *   changes: [
 *     { itemId: 'P1.M1.T1.S1', type: 'modified', description: '...', impact: '...' }
 *   ],
 *   patchInstructions: 'Re-execute P1.M1.T1.S1',
 *   taskIds: ['P1.M1.T1.S1']
 * };
 *
 * const patched = patchBacklog(backlog, delta);
 * const updatedTask = findItem(patched, 'P1.M1.T1.S1');
 * console.log(updatedTask?.status); // 'Planned'
 * ```
 */
export function patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog {
  // De-duplicate taskIds (changes may have duplicates)
  const uniqueTaskIds = new Set(delta.taskIds);

  // Create map for efficient change lookup
  const changeMap = new Map(
    delta.changes.map(change => [change.itemId, change])
  );

  // Start with original backlog
  let patchedBacklog = backlog;

  // Process each unique task ID
  for (const taskId of uniqueTaskIds) {
    const change = changeMap.get(taskId);

    if (!change) {
      // Task ID in taskIds but no change entry - skip
      continue;
    }

    switch (change.type) {
      case 'modified':
        // Reset to 'Planned' for re-implementation
        patchedBacklog = updateItemStatus(patchedBacklog, taskId, 'Planned');
        break;

      case 'removed':
        // Mark as obsolete
        patchedBacklog = updateItemStatus(patchedBacklog, taskId, 'Obsolete');
        break;

      case 'added':
        // Generate new tasks via Architect agent
        // NOTE: New PRD section content not available in current scope
        // Placeholder: Log warning and continue
        // TODO: Future enhancement - pass new PRD content to Architect
        console.warn(
          `[patchBacklog] 'added' change for ${taskId} - Architect agent call not implemented (new PRD content unavailable)`
        );
        break;
    }
  }

  return patchedBacklog;
}

// ============================================================================
// EXPORT PATTERN (src/core/index.ts)
// ============================================================================

// Add to existing exports in src/core/index.ts:
// export { patchBacklog } from './task-patcher.js';
````

### Integration Points

```yaml
DELTA_ANALYSIS_WORKFLOW:
  - file: src/workflows/delta-analysis-workflow.ts
  - output: DeltaAnalysis with changes, patchInstructions, taskIds
  - consumer: This function (patchBacklog) consumes that output
  - flow: DeltaAnalysisWorkflow -> patchBacklog -> TaskOrchestrator

UPDATE_ITEM_STATUS:
  - file: src/utils/task-utils.ts
  - function: updateItemStatus(backlog, id, newStatus)
  - usage: Called for 'modified' and 'removed' changes
  - returns: New immutable Backlog

FIND_ITEM:
  - file: src/utils/task-utils.ts
  - function: findItem(backlog, id)
  - usage: Verify item exists before processing
  - returns: HierarchyItem | null

ARCHITECT_AGENT:
  - file: src/agents/agent-factory.ts
  - function: createArchitectAgent() returns Agent
  - usage: Generate new tasks for 'added' changes
  - note: Integration is placeholder for this task scope

CORE_INDEX:
  - file: src/core/index.ts
  - modify: Add export { patchBacklog } from './task-patcher.js';
  - preserve: All existing exports
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating task-patcher.ts
npm run lint -- src/core/task-patcher.ts
npm run format -- src/core/task-patcher.ts
npm run typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run tests for task patcher
npm test -- tests/unit/core/task-patcher.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/core/task-patcher.test.ts

# Full test suite
npm test

# Expected: All tests pass. 100% coverage achieved (vitest.config.ts requirement)
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify exports are accessible
node -e "
  const { patchBacklog } = require('./dist/core/task-patcher.js');
  console.log('patchBacklog exported successfully');
"

# Verify imports resolve
npm run build
node -e "
  import { patchBacklog } from './dist/core/task-patcher.js';
  console.log('patchBacklog imported successfully');
"

# Expected: All exports resolve correctly, no runtime errors
```

### Level 4: Manual Testing (Functional Validation)

```bash
# Create test script to verify patching logic
cat > /tmp/test-task-patcher.mjs << 'EOF'
import { patchBacklog } from './dist/core/task-patcher.js';

const backlog = {
  backlog: [{
    id: 'P1',
    type: 'Phase',
    title: 'Phase 1',
    status: 'Complete',
    description: 'Test phase',
    milestones: [{
      id: 'P1.M1',
      type: 'Milestone',
      title: 'Milestone 1',
      status: 'Complete',
      description: 'Test milestone',
      tasks: [{
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Task 1',
        status: 'Complete',
        description: 'Test task',
        subtasks: [{
          id: 'P1.M1.T1.S1',
          type: 'Subtask',
          title: 'Subtask 1',
          status: 'Complete',
          story_points: 1,
          dependencies: [],
          context_scope: 'Test context'
        }]
      }]
    }]
  }]
};

const delta = {
  changes: [{
    itemId: 'P1.M1.T1.S1',
    type: 'modified',
    description: 'Modified requirement',
    impact: 'Re-implement subtask'
  }],
  patchInstructions: 'Re-execute P1.M1.T1.S1',
  taskIds: ['P1.M1.T1.S1']
};

const patched = patchBacklog(backlog, delta);
console.log('Original backlog:', JSON.stringify(backlog).substring(0, 100));
console.log('Patched backlog:', JSON.stringify(patched).substring(0, 100));
console.log('Immutability test:', backlog !== patched);
EOF

# Run test script
node /tmp/test-task-patcher.mjs

# Expected: backlog !== patched (immutability), status changed to 'Planned'
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm test` passes with zero failures
- [ ] `npm run test:coverage` shows 100% coverage for task-patcher.ts
- [ ] `npm run build` completes successfully

### Feature Validation

- [ ] patchBacklog() accepts Backlog and DeltaAnalysis
- [ ] 'modified' changes set status to 'Planned'
- [ ] 'removed' changes set status to 'Obsolete'
- [ ] 'added' changes log Architect placeholder warning
- [ ] Completed tasks not in delta.taskIds remain unchanged
- [ ] Original backlog is unchanged (immutability)
- [ ] Duplicate taskIds handled correctly
- [ ] Empty changes returns original backlog

### Code Quality Validation

- [ ] Follows task-utils.ts pure function pattern
- [ ] File uses .js extension for all imports
- [ ] JSDoc comments on function
- [ ] @remarks section in JSDoc
- [ ] @example section in JSDoc
- [ ] Type-safe operations (no any types)
- [ ] Export added to src/core/index.ts

### Documentation & Deployment

- [ ] Function JSDoc explains patching behavior
- [ ] @remarks section explains change type handling
- [ ] @example section shows usage
- [ ] File module JSDoc at top of file
- [ ] Code is self-documenting with clear names
- [ ] Architect placeholder warning is clear about limitation

---

## Anti-Patterns to Avoid

- **Don't** mutate original backlog - must return new object
- **Don't** forget .js extension in imports - breaks ES module resolution
- **Don't** process duplicate taskIds multiple times - de-duplicate first
- **Don't** reset Complete tasks not in delta.taskIds - preserve them
- **Don't** skip type narrowing with HierarchyItem - use item.type checks
- **Don't** assume Architect agent works for 'added' - log warning for placeholder
- **Don't** skip JSDoc comments - documentation is required
- **Don't** skip tests - 100% coverage is required by vitest.config.ts
- **Don't** use console.log for errors - use console.warn for warnings
- **Don't** forget to export from core/index.ts - makes function usable
