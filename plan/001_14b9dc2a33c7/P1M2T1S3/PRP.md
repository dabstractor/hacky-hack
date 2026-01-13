# PRP: Task Hierarchy Helper Utilities

**Work Item:** P1.M2.T1.S3 - Create task hierarchy helper utilities
**Created:** 2026-01-12
**Confidence Score:** 9/10

---

## Goal

**Feature Goal**: Create `src/utils/task-utils.ts` with fully typed utility functions for navigating, querying, and updating the 4-level task hierarchy (Backlog > Phase > Milestone > Task > Subtask).

**Deliverable**: A single `src/utils/task-utils.ts` file exporting 5 pure utility functions with 100% test coverage in `tests/unit/core/task-utils.test.ts`.

**Success Definition**:

- All 5 functions work correctly with the existing type definitions from `src/core/models.ts`
- 100% test coverage achieved (statements, branches, functions, lines)
- All existing tests pass after implementation
- No new runtime dependencies added (use existing patterns)

---

## User Persona

**Target User**: Task Orchestrator (internal system component)

**Use Case**: The Task Orchestrator needs to navigate the task hierarchy to:

- Find specific work items by ID for status updates
- Resolve dependency chains for proper execution order
- Filter items by status for next-work selection
- Update item statuses immutably without corrupting the backlog

**User Journey**:

1. Task Orchestrator loads Backlog from `tasks.json`
2. Calls `getNextPendingItem()` to find the first 'Planned' subtask
3. Calls `getDependencies()` to check if all prerequisites are complete
4. Executes the work item
5. Calls `updateItemStatus()` to mark it complete
6. Repeats until backlog is complete

**Pain Points Addressed**:

- **No existing utilities**: The `src/utils/` directory is empty
- **Complex navigation**: 4-level nesting requires careful recursive traversal
- **Immutability required**: Readonly properties prevent accidental mutation
- **Type safety needed**: Discriminated unions must be handled correctly

---

## Why

- **Foundation for Task Orchestrator**: These utilities are required by P3.M2 (Task Orchestrator) to navigate and manipulate the task hierarchy
- **Enables dependency resolution**: The Task Orchestrator must check subtask dependencies before execution
- **Supports status propagation**: Immutable updates prevent state corruption across the pipeline
- **Reusability**: Other phases (Delta Analysis, QA Bug Hunt) will also need to query the backlog

---

## What

Create 5 utility functions in `src/utils/task-utils.ts`:

1. **`findItem`** - Recursively search hierarchy for item by ID
2. **`getDependencies`** - Resolve dependency IDs to actual Subtask objects
3. **`filterByStatus`** - Return all items with given status
4. **`getNextPendingItem`** - Find first 'Planned' item in depth-first order
5. **`updateItemStatus`** - Immutable status update with deep copy

### Success Criteria

- [ ] `findItem` returns correct item at any hierarchy level or null if not found
- [ ] `getDependencies` returns array of Subtask objects matching dependency IDs
- [ ] `filterByStatus` returns all items matching the status across all levels
- [ ] `getNextPendingItem` returns first 'Planned' item in DFS order or null
- [ ] `updateItemStatus` returns new Backlog with updated status, original unchanged
- [ ] All functions handle empty arrays, missing items, and edge cases
- [ ] 100% test coverage achieved
- [ ] No linting errors pass `ruff check src/` (when configured)

---

## All Needed Context

### Context Completeness Check

This PRP passes the "No Prior Knowledge" test - an AI agent unfamiliar with the codebase has everything needed to implement these utilities successfully.

### Documentation & References

```yaml
# MUST READ - Core type definitions
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Exact type definitions for Backlog, Phase, Milestone, Task, Subtask, Status, ItemType
  pattern: Import all types and Zod schemas; use readonly properties; discriminated unions with `type` field
  gotcha: Subtask has `story_points` and `context_scope`; Task/Milestone/Phase have `description` and child arrays

# MUST READ - Existing test patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts
  why: Test structure, fixture patterns, assertion style used in this codebase
  pattern: Setup/Execute/Verify comments; describe/it nesting; vi.fn() for spies; comprehensive edge case testing
  gotcha: All tests use `.js` extension in imports (ESM mode); 100% coverage threshold enforced

# MUST READ - Research on recursive patterns
- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/recursive_hierarchy_traversal_research.md
  why: Best practices for DFS traversal, immutable updates, testing recursive functions
  section: Sections 1.1 (DFS), 1.3 (Find Operations), 2.1 (Manual Immutable Updates), 5 (Testing Strategies)
  critical: Use for...of loops for performance; early returns for search; manual spread updates (no Immer dependency)

# EXTERNAL - TypeScript discriminated unions
- url: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions
  why: Type narrowing patterns for Phase | Milestone | Task | Subtask unions
  critical: Use `switch (item.type)` for proper type narrowing

# EXTERNAL - Vitest testing
- url: https://vitest.dev/api/expect.html
  why: Expect API for assertions (toBe, toEqual, toBeNull, toThrow, etc.)
  critical: Import from `vitest/globals` for describe, it, expect, vi

# EXTERNAL - Tree traversal algorithms
- url: https://en.wikipedia.org/wiki/Tree_traversal
  why: Understanding of pre-order (parent before children) vs post-order traversal
  critical: Use pre-order DFS for finding items; ensures we check parent before children
```

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   └── models.ts          # All type definitions (READ THIS FIRST)
│   ├── config/
│   │   └── environment.ts     # Example of utility module patterns
│   ├── utils/                 # EMPTY - PLACE task-utils.ts HERE
│   ├── agents/
│   ├── workflows/
│   └── index.ts
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   │   └── models.test.ts # Test patterns to follow
│   │   └── config/
│   │       └── environment.test.ts
│   └── integration/
├── package.json               # ESM mode, "type": "module"
├── tsconfig.json             # Strict mode enabled
├── vite.config.ts            # Vitest configuration
└── plan/001_14b9dc2a33c7/
    └── docs/
        └── recursive_hierarchy_traversal_research.md
```

### Desired Codebase Tree with New Files

```bash
hacky-hack/
├── src/
│   ├── utils/
│   │   └── task-utils.ts      # NEW: 5 utility functions for hierarchy operations
│   └── core/
│       └── models.ts          # EXISTING: Type definitions (no changes)
└── tests/
    └── unit/
        └── core/
            ├── models.test.ts    # EXISTING (no changes)
            └── task-utils.test.ts # NEW: 100% coverage of task-utils.ts
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports require .js extension
// BAD: import { Backlog } from './core/models'
// GOOD: import { Backlog } from './core/models.js'

// CRITICAL: All properties are readonly - cannot mutate directly
// Use spread operators for immutable updates:
const updatedPhase = {
  ...phase,
  milestones: phase.milestones.map(m => ({
    ...m,
    tasks: m.tasks.map(t => ({
      ...t,
      subtasks: t.subtasks.map(s =>
        s.id === targetId ? { ...s, status: newStatus } : s
      ),
    })),
  })),
};

// CRITICAL: Use discriminated union type narrowing
function processItem(item: Phase | Milestone | Task | Subtask) {
  switch (
    item.type // 'type' field narrows the union
  ) {
    case 'Subtask':
      return item.story_points; // TypeScript knows this is Subtask
    case 'Task':
      return item.subtasks.length; // TypeScript knows this is Task
    // ... etc
  }
}

// CRITICAL: Early return in recursive search
// Don't continue after finding the item
function findById(backlog: Backlog, id: string) {
  for (const phase of backlog.backlog) {
    if (phase.id === id) return phase; // Early exit!
    for (const milestone of phase.milestones) {
      if (milestone.id === id) return milestone; // Early exit!
      // ... continue nesting
    }
  }
  return null; // Not found
}

// CRITICAL: Handle empty arrays gracefully
// Empty phases, milestones, tasks arrays are valid
// Filter operations should return empty arrays, not error

// CRITICAL: Vitest uses global test functions
// Import from 'vitest/globals' not 'vitest'
import { describe, it, expect, vi } from 'vitest/globals';
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - use existing types from `src/core/models.ts`:

```typescript
// Import all needed types
import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
  ItemType,
} from '../core/models.js';

// Union type for any item in hierarchy
export type HierarchyItem = Phase | Milestone | Task | Subtask;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/task-utils.ts with imports and type exports
  - IMPLEMENT: Import all types from ../core/models.js with .js extension
  - IMPLEMENT: Export HierarchyItem union type
  - IMPLEMENT: Add JSDoc module comment matching models.ts pattern
  - NAMING: camelCase for functions, PascalCase for types
  - PLACEMENT: src/utils/task-utils.ts (create new file)

Task 2: IMPLEMENT findItem function
  - SIGNATURE: export function findItem(backlog: Backlog, id: string): HierarchyItem | null
  - ALGORITHM: Nested for-loops with early returns (DFS pre-order)
  - PATTERN: Loop backlog.backlog → phase.milestones → milestone.tasks → task.subtasks
  - RETURN: Found item or null if not found
  - DEPENDENCIES: Import Backlog, HierarchyItem types
  - GOTCHA: Use early return after finding item; don't continue search

Task 3: IMPLEMENT getDependencies function
  - SIGNATURE: export function getDependencies(task: Subtask, backlog: Backlog): Subtask[]
  - ALGORITHM: Map task.dependencies array, call findItem for each ID
  - FILTER: Include only Subtask results (findItem can return any type)
  - VALIDATION: Handle circular/malformed dependencies gracefully
  - DEPENDENCIES: Requires findItem from Task 2

Task 4: IMPLEMENT filterByStatus function
  - SIGNATURE: export function filterByStatus(backlog: Backlog, status: Status): HierarchyItem[]
  - ALGORITHM: DFS traversal collecting items matching status
  - PATTERN: for...of loops through all levels, push matches to result array
  - RETURN: Array of items (may be empty)
  - GOTCHA: Include all 4 types in results (Phase, Milestone, Task, Subtask)

Task 5: IMPLEMENT getNextPendingItem function
  - SIGNATURE: export function getNextPendingItem(backlog: Backlog): HierarchyItem | null
  - ALGORITHM: DFS pre-order traversal, return first item with status 'Planned'
  - PATTERN: Early return on first match
  - RETURN: First 'Planned' item or null if none exist
  - GOTCHA: Check parent before children (pre-order), subtasks before parents

Task 6: IMPLEMENT updateItemStatus function
  - SIGNATURE: export function updateItemStatus(backlog: Backlog, id: string, status: Status): Backlog
  - ALGORITHM: Deep copy using nested spread operators, update target item
  - PATTERN: Map each level, check child IDs, spread with updated status
  - IMMUTABILITY: Create new objects at every level, preserve unchanged branches
  - RETURN: New Backlog object with updated status
  - GOTCHA: Must copy entire path to item; use structural sharing where possible

Task 7: CREATE tests/unit/core/task-utils.test.ts
  - IMPLEMENT: Test fixtures for backlog, phase, milestone, task, subtask
  - IMPLEMENT: Tests for findItem (found at each level, not found, empty)
  - IMPLEMENT: Tests for getDependencies (empty, single, multiple, invalid)
  - IMPLEMENT: Tests for filterByStatus (each status value, empty results)
  - IMPLEMENT: Tests for getNextPendingItem (found, not found, complex order)
  - IMPLEMENT: Tests for updateItemStatus (immutability, correctness, deep nested)
  - COVERAGE: Achieve 100% for all statements, branches, functions, lines
  - PATTERN: Follow models.test.ts structure with Setup/Execute/Verify comments
  - NAMING: test_{function}_{scenario} naming convention
```

### Implementation Patterns & Key Details

````typescript
// PATTERN: Module structure matching src/core/models.ts
/**
 * Utility functions for task hierarchy operations
 *
 * @module utils/task-utils
 *
 * @remarks
 * Provides pure functions for navigating, querying, and updating the
 * 4-level task hierarchy (Backlog > Phase > Milestone > Task > Subtask).
 * All functions maintain immutability and type safety.
 *
 * @example
 * ```typescript
 * import { findItem, updateItemStatus } from './utils/task-utils.js';
 *
 * const item = findItem(backlog, 'P1.M1.T1.S1');
 * const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Complete');
 * ```
 */

// PATTERN: Discriminated union type narrowing
function getTypeInfo(item: HierarchyItem): string {
  switch (item.type) {
    case 'Subtask':
      return `Subtask with ${item.story_points} points`; // item is Subtask
    case 'Task':
      return `Task with ${item.subtasks.length} subtasks`; // item is Task
    case 'Milestone':
      return `Milestone with ${item.tasks.length} tasks`; // item is Milestone
    case 'Phase':
      return `Phase with ${item.milestones.length} milestones`; // item is Phase
  }
}

// PATTERN: DFS pre-order find with early exit
export function findItem(backlog: Backlog, id: string): HierarchyItem | null {
  for (const phase of backlog.backlog) {
    if (phase.id === id) return phase;

    for (const milestone of phase.milestones) {
      if (milestone.id === id) return milestone;

      for (const task of milestone.tasks) {
        if (task.id === id) return task;

        for (const subtask of task.subtasks) {
          if (subtask.id === id) return subtask;
        }
      }
    }
  }

  return null;
}

// PATTERN: Type guard for Subtask
function isSubtask(item: HierarchyItem): item is Subtask {
  return item.type === 'Subtask';
}

export function getDependencies(task: Subtask, backlog: Backlog): Subtask[] {
  const results: HierarchyItem[] = [];

  for (const depId of task.dependencies) {
    const item = findItem(backlog, depId);
    if (item && isSubtask(item)) {
      results.push(item);
    }
  }

  return results;
}

// PATTERN: DFS collector with accumulator array
export function filterByStatus(
  backlog: Backlog,
  status: Status
): HierarchyItem[] {
  const results: HierarchyItem[] = [];

  for (const phase of backlog.backlog) {
    if (phase.status === status) results.push(phase);

    for (const milestone of phase.milestones) {
      if (milestone.status === status) results.push(milestone);

      for (const task of milestone.tasks) {
        if (task.status === status) results.push(task);

        for (const subtask of task.subtasks) {
          if (subtask.status === status) results.push(subtask);
        }
      }
    }
  }

  return results;
}

// PATTERN: DFS with early return for first match
export function getNextPendingItem(backlog: Backlog): HierarchyItem | null {
  for (const phase of backlog.backlog) {
    if (phase.status === 'Planned') return phase;

    for (const milestone of phase.milestones) {
      if (milestone.status === 'Planned') return milestone;

      for (const task of milestone.tasks) {
        if (task.status === 'Planned') return task;

        for (const subtask of task.subtasks) {
          if (subtask.status === 'Planned') return subtask;
        }
      }
    }
  }

  return null;
}

// PATTERN: Immutable deep update with nested spreads
export function updateItemStatus(
  backlog: Backlog,
  id: string,
  newStatus: Status
): Backlog {
  return {
    ...backlog,
    backlog: backlog.backlog.map(phase => {
      // Check if this is the target phase
      if (phase.id === id) {
        return { ...phase, status: newStatus };
      }

      // Otherwise, search deeper
      return {
        ...phase,
        milestones: phase.milestones.map(milestone => {
          if (milestone.id === id) {
            return { ...milestone, status: newStatus };
          }

          return {
            ...milestone,
            tasks: milestone.tasks.map(task => {
              if (task.id === id) {
                return { ...task, status: newStatus };
              }

              return {
                ...task,
                subtasks: task.subtasks.map(subtask =>
                  subtask.id === id
                    ? { ...subtask, status: newStatus }
                    : subtask
                ),
              };
            }),
          };
        }),
      };
    }),
  };
}

// GOTCHA: Manual spread updates are verbose but maintainable for 4-level hierarchy
// GOTCHA: Consider adding Immer in future if updates become more complex
````

### Integration Points

```yaml
NO_NEW_DEPENDENCIES:
  - Use existing TypeScript patterns only
  - No additional npm packages required

IMPORT_CHANGES:
  - add to: Future files that need task utilities
  - pattern: "import { findItem, updateItemStatus } from './utils/task-utils.js';"

TYPE_IMPORTS:
  - add to: Test files
  - pattern: "import type { Backlog, Subtask, Status } from '../../src/core/models.js';"

TEST_STRUCTURE:
  - create: tests/unit/core/task-utils.test.ts
  - pattern: Follow models.test.ts structure with describe/it nesting
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check types
npm run build

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.
# Common issues: missing .js extensions, incorrect type narrowing, spread operator mistakes

# Note: Project does not use ESLint/Prettier yet (see P1.M3.T1.S2 status)
# Skip ruff commands until linting is fully configured
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run tests for task-utils specifically
npm test -- tests/unit/core/task-utils.test.ts

# Run all unit tests to ensure no regressions
npm test -- tests/unit/

# Run with coverage
npm run test:coverage

# Expected: All tests pass with 100% coverage
# If failing, debug root cause and fix implementation.

# Coverage thresholds (from vite.config.ts):
# - statements: 100%
# - branches: 100%
# - functions: 100%
# - lines: 100%
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify module imports correctly
node -e "import { findItem } from './src/utils/task-utils.js'; console.log('Import OK');"

# Run full test suite
npm test

# Expected: All tests pass, no errors in models.test.ts or other existing tests
# If existing tests fail, check for unintended side effects

# Verify type exports work
node -e "import type { HierarchyItem } from './src/utils/task-utils.js'; console.log('Types OK');"
```

### Level 4: Domain-Specific Validation

```bash
# Test with real backlog structure (create temporary test)
cat > /tmp/test-backlog.json << 'EOF'
{
  "backlog": [
    {
      "id": "P1",
      "type": "Phase",
      "title": "Test Phase",
      "status": "Planned",
      "description": "Test",
      "milestones": [
        {
          "id": "P1.M1",
          "type": "Milestone",
          "title": "Test Milestone",
          "status": "Planned",
          "description": "Test",
          "tasks": [
            {
              "id": "P1.M1.T1",
              "type": "Task",
              "title": "Test Task",
              "status": "Planned",
              "description": "Test",
              "subtasks": [
                {
                  "id": "P1.M1.T1.S1",
                  "type": "Subtask",
                  "title": "Test Subtask",
                  "status": "Planned",
                  "story_points": 2,
                  "dependencies": [],
                  "context_scope": "Test"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
EOF

# Create and run integration test script
cat > /tmp/test-utils.mjs << 'EOF'
import { readFileSync } from 'fs';
import { findItem, updateItemStatus, getNextPendingItem } from './src/utils/task-utils.js';
import { BacklogSchema } from './src/core/models.js';

const backlog = JSON.parse(readFileSync('/tmp/test-backlog.json', 'utf-8'));
const validated = BacklogSchema.parse(backlog);

console.log('Test 1: findItem');
const found = findItem(validated, 'P1.M1.T1.S1');
console.assert(found?.id === 'P1.M1.T1.S1', 'Should find subtask');
console.log('PASS');

console.log('Test 2: getNextPendingItem');
const next = getNextPendingItem(validated);
console.assert(next?.id === 'P1', 'Should return phase (pre-order DFS)');
console.log('PASS');

console.log('Test 3: updateItemStatus immutability');
const originalJSON = JSON.stringify(validated);
const updated = updateItemStatus(validated, 'P1.M1.T1.S1', 'Complete');
console.assert(JSON.stringify(validated) === originalJSON, 'Should not mutate original');
console.assert(updated.backlog[0].milestones[0].tasks[0].subtasks[0].status === 'Complete', 'Should update status');
console.log('PASS');

console.log('All integration tests passed!');
EOF

node /tmp/test-utils.mjs

# Expected: All assertions pass, no errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All functions in task-utils.ts export correctly
- [ ] TypeScript compiler reports zero errors (`npm run build`)
- [ ] All unit tests pass (`npm test -- tests/unit/core/task-utils.test.ts`)
- [ ] 100% coverage achieved (`npm run test:coverage`)
- [ ] No existing tests broken (`npm test`)

### Feature Validation

- [ ] `findItem` finds items at all 4 hierarchy levels
- [ ] `findItem` returns `null` for non-existent IDs
- [ ] `getDependencies` returns array of Subtask objects
- [ ] `getDependencies` handles empty dependencies array
- [ ] `getDependencies` filters out non-Subtask items gracefully
- [ ] `filterByStatus` returns all items matching given status
- [ ] `filterByStatus` returns empty array when no matches
- [ ] `getNextPendingItem` returns first 'Planned' item in DFS order
- [ ] `getNextPendingItem` returns null when no 'Planned' items exist
- [ ] `updateItemStatus` returns new Backlog with updated status
- [ ] `updateItemStatus` does not mutate original backlog (immutability test)
- [ ] All functions handle empty arrays gracefully

### Code Quality Validation

- [ ] File uses .js extension in all imports (ESM mode)
- [ ] All functions have JSDoc comments with @example
- [ ] Type narrowing uses discriminated unions correctly
- [ ] Early returns used in search functions
- [ ] Spread operators used for immutable updates
- [ ] No mutation of input parameters
- [ ] Proper error handling for edge cases

### Documentation & Deployment

- [ ] Module-level JSDoc comment explains purpose
- [ ] Each function has JSDoc with @param, @returns, @example
- [ ] Test file includes descriptive comments for complex scenarios
- [ ] Integration test script demonstrates real-world usage

---

## Anti-Patterns to Avoid

- [ ] **Don't use forEach with early returns** - Use for...of loops instead
- [ ] **Don't mutate input parameters** - Always return new objects for updates
- [ ] **Don't forget .js extensions** - ESM mode requires them in imports
- [ ] **Don't ignore type narrowing** - Use discriminated unions for HierarchyItem
- [ ] **Don't skip immutability tests** - Verify original is unchanged
- [ ] **Don't use async/await** - These are synchronous pure functions
- [ ] **Don't add Immer dependency yet** - Manual spreads are fine for 4 levels
- [ ] **Don't test only happy paths** - Include empty arrays, missing items, edge cases
- [ ] **Don't continue search after finding item** - Use early return
- [ ] **Don't assume dependencies are valid** - Handle missing/circular refs gracefully

---

## Research Summary

This PRP was created with comprehensive research including:

1. **Codebase Analysis**: Full review of `src/core/models.ts` type definitions, existing test patterns in `tests/unit/core/models.test.ts`, and project structure
2. **External Research**: Best practices for recursive tree traversal, immutable updates with spread operators, TypeScript discriminated unions
3. **Testing Patterns**: Vitest setup, fixture creation, 100% coverage requirements
4. **Documentation**: TypeScript Handbook, Vitest API docs, tree traversal algorithms

**Confidence Score: 9/10** - All necessary context provided for one-pass implementation success.
