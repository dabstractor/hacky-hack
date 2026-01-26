# Product Requirement Prompt (PRP): Add state validation and repair tools

**PRP ID**: P3.M2.T2.S3
**Work Item Title**: Add state validation and repair tools
**Generated**: 2026-01-24
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Add a `prd validate-state` CLI command that validates tasks.json against Zod schemas, detects orphaned dependencies, detects circular dependencies, validates parent-child status consistency, and offers auto-repair with backup creation.

**Deliverable**:

1. `prd validate-state` CLI command in `src/cli/commands/validate-state.ts`
2. State validation functions in `src/core/state-validator.ts`
3. Backup and auto-repair functionality for common issues
4. Integration tests in `tests/integration/validate-state.test.ts`

**Success Definition**:

- `prd validate-state` loads and validates tasks.json against Zod BacklogSchema
- Detects orphaned dependencies (deps to non-existent tasks)
- Detects circular dependencies using DFS three-color algorithm
- Validates status consistency (parent complete but child incomplete)
- Creates timestamped backup before any repair (`tasks.json.backup.{timestamp}`)
- Offers auto-repair for orphaned dependencies (remove invalid deps)
- Offers auto-repair for circular dependencies (remove last edge in cycle)
- Offers auto-repair for missing required fields (add empty arrays)
- Outputs results in table/json/yaml formats
- Returns appropriate exit codes (0 for valid/warning, 1 for errors)

---

## User Persona

**Target User**: Developer or operator managing PRD pipeline sessions who needs to diagnose and repair corrupted task state.

**Use Case**: When tasks.json becomes corrupted (e.g., manual edits, failed writes, merge conflicts), the user needs to:

1. Detect what's wrong with the state
2. Understand the impact of the issues
3. Optionally auto-repair common problems
4. Get a backup before any modifications

**User Journey**:

1. User runs `prd validate-state` to check current session state
2. System loads tasks.json and runs all validation checks
3. Validation results are displayed with clear error/warning messages
4. If issues found and auto-repair available, user is prompted
5. On confirmation, backup is created and repairs applied
6. Re-validation confirms repairs were successful

**Pain Points Addressed**:

- **No validation tools**: From system_context.md - "No state validation tools exist. Corrupted tasks.json could block pipeline."
- **Manual debugging**: Currently must manually inspect JSON to find issues
- **Risk of data loss**: No backup before manual repairs
- **Unclear impact**: Can't tell if a circular dep will block execution
- **Time-consuming**: Manual repair requires understanding JSON structure

---

## Why

- **System reliability**: From system_context.md lines 445-448 - Corrupted tasks.json could block pipeline execution
- **Developer productivity**: Automated validation faster than manual JSON inspection
- **Data safety**: Backup creation prevents data loss during repairs
- **Operational confidence**: Clear validation status before running pipeline
- **Self-healing**: Auto-repair for common issues reduces manual intervention

---

## What

Implement a `prd validate-state` CLI command with comprehensive validation and repair capabilities.

### Success Criteria

- [ ] Command registered in `src/cli/index.ts` as `prd validate-state`
- [ ] Loads tasks.json from current session (or custom file via `--file`)
- [ ] Validates against Zod BacklogSchema (schema validation)
- [ ] Detects orphaned dependencies (deps to non-existent tasks)
- [ ] Detects circular dependencies using DFS three-color algorithm
- [ ] Validates parent-child status consistency
- [ ] Creates timestamped backup before repair (`tasks.json.backup.{iso-timestamp}`)
- [ ] Offers auto-repair for orphaned dependencies
- [ ] Offers auto-repair for circular dependencies
- [ ] Offers auto-repair for missing required fields
- [ ] Outputs results in table/json/yaml formats (`--output` option)
- [ ] Returns exit code 0 for valid/warnings, 1 for errors
- [ ] Integration tests cover all validation types and repair scenarios

---

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:

- Complete analysis of existing CLI command patterns (`src/cli/commands/inspect.ts`)
- Existing Zod schemas for validation (`src/core/models.ts`)
- Existing circular dependency detection (`src/core/dependency-validator.ts`)
- Atomic write pattern for safe repairs (`src/core/session-utils.ts`)
- Backup/repair algorithms with full implementations
- Test patterns from existing integration tests
- Specific file paths, line numbers, and code patterns

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Existing Circular Dependency Detection (REUSE)
- file: src/core/dependency-validator.ts
  why: Use existing DFS three-color algorithm for circular dependency detection
  pattern:
    - detectCircularDeps() function (lines 392-440) - main validation entry point
    - detectCycleDFS() function (lines 210-272) - DFS with three-color marking
    - buildDependencyGraph() function (lines 139-148) - build adjacency list
    - NodeState enum (lines 76-80) - UNVISITED/VISITING/VISITED states
  gotcha:
    - Only validates subtasks currently, need to extend to all hierarchy levels
    - Uses ValidationError from src/utils/errors.ts
    - Logs warnings for long chains (>5 levels)

# Existing CLI Command Pattern (FOLLOW)
- file: src/cli/commands/inspect.ts
  why: Reference for CLI command structure and session loading
  pattern:
    - InspectCommand class (lines 132-903) - command class structure
    - execute() method (lines 165-177) - main entry point
    - #loadSession() method (lines 188-219) - session discovery and loading
    - #formatOverview() method (lines 341-424) - output formatting
    - InspectorOptions interface (lines 51-66) - options pattern
  gotcha:
    - Uses SessionManager.loadSession() to load session state
    - Supports multiple output formats (table, json, yaml, tree)
    - Uses chalk for colored terminal output

# Zod Validation Schemas (REUSE)
- file: src/core/models.ts
  why: Existing Zod schemas for tasks.json validation
  pattern:
    - BacklogSchema (lines 711-713) - root backlog validation
    - StatusEnum (lines 161-169) - valid status values
    - ItemTypeEnum (line 203) - valid item types
    - PhaseSchema, MilestoneSchema, TaskSchema, SubtaskSchema (lines 320-630)
  gotcha:
    - Use BacklogSchema.parse() for validation
    - Catch ZodError and format for user display
    - Schema validates structure, not business logic (orphaned deps, etc.)

# SessionManager for Loading State (REUSE)
- file: src/core/session-manager.ts
  why: Load session and tasks.json
  pattern:
    - SessionManager.findLatestSession() - find current session
    - SessionManager.loadSession() - load session state
  gotcha:
    - Returns SessionState with taskRegistry (Backlog) and metadata
    - Can throw SessionFileError if tasks.json missing

# Atomic Write for Safe Repairs (REUSE)
- file: src/core/session-utils.ts
  why: Safe writing of repaired tasks.json
  pattern:
    - writeTasksJSON() function (lines 533-570) - write with Zod validation
    - atomicWrite() function (lines 98-180) - temp file + rename pattern
  gotcha:
    - Always validates with BacklogSchema before writing
    - Throws SessionFileError on failure
    - Use existing pattern, don't duplicate

# Error Handling (REUSE)
- file: src/utils/errors.ts
  why: Use existing error classes
  pattern:
    - ValidationError class (lines 100+) - validation errors
    - ErrorCodes object (lines 58-89) - standardized error codes
    - PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY - use for circular deps
  gotcha:
    - ValidationError accepts context object with details
    - Error code format: PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME}

# Task Utilities for Traversal (REUSE)
- file: src/core/task-utils.ts
  why: Helper functions for traversing hierarchy
  pattern:
    - findItem(backlog, itemId) (line 90) - find item by ID
    - getAllSubtasks(backlog) (line 169) - get all subtasks recursively
    - filterByStatus(backlog, status) (line 205) - filter by status
  gotcha:
    - Returns HierarchyItem union type (Phase | Milestone | Task | Subtask)

# CLI Registration (MODIFY)
- file: src/cli/index.ts
  why: Add validate-state command registration
  pattern:
    - inspect command registration (lines 262-278)
    - artifacts command registration (lines 287-315)
    - Commander.js .command() pattern
  gotcha:
    - Register after inspect command (around line 278)
    - Use same .action() pattern with process.exit(0)

# System Context (SOURCE OF REQUIREMENT)
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Original requirement source
  section: "Limitations & Pain Points" -> "State Management Problems"
  quote: "No state validation tools exist. Corrupted tasks.json could block pipeline."

# Test Patterns (FOLLOW)
- file: tests/integration/
  why: Reference for integration test structure
  pattern:
    - Use describe/it from vitest
    - Create temporary test directories
    - Mock or create sample tasks.json files
    - Test both success and failure paths
  gotcha:
    - Cleanup test directories in afterEach
    - Use resolve() for path handling

# Research Documentation (REFERENCE)
- docfile: plan/003_b3d3efdaf0ed/P3M2T2S3/research/codebase-analysis-summary.md
  why: Summary of codebase patterns and files
- docfile: plan/003_b3d3efdaf0ed/P3M2T2S3/research/circular-dependency-algorithms.md
  why: Complete algorithms for circular dependency detection
- docfile: plan/003_b3d3efdaf0ed/P3M2T2S3/research/backup-and-repair-patterns.md
  why: Backup creation and auto-repair implementations
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   ├── index.ts                     # MODIFY: Register command (after line 278)
│   │   └── commands/
│   │       ├── inspect.ts               # REFERENCE: Command pattern
│   │       └── validate-state.ts        # NEW: Create this file
│   ├── core/
│   │   ├── models.ts                    # REFERENCE: Zod schemas (lines 161-713)
│   │   ├── session-manager.ts           # REFERENCE: Session loading
│   │   ├── session-utils.ts             # REFERENCE: readTasksJSON(), writeTasksJSON()
│   │   ├── dependency-validator.ts      # REFERENCE: Circular dep detection (lines 210-440)
│   │   ├── task-utils.ts                # REFERENCE: findItem(), getAllSubtasks()
│   │   └── state-validator.ts           # NEW: Create this file
│   └── utils/
│       ├── errors.ts                    # REFERENCE: ValidationError class
│       ├── logger.ts                    # REFERENCE: getLogger()
│       └── display/
│           └── table-formatter.ts       # REFERENCE: Table formatting
├── tests/
│   └── integration/
│       └── validate-state.test.ts       # NEW: Create this file
└── plan/
    └── 003_b3d3efdaf0ed/
        ├── docs/
        │   └── system_context.md        # SOURCE OF REQUIREMENT
        └── P3M2T2S3/
            ├── PRP.md                   # THIS FILE
            └── research/
                ├── codebase-analysis-summary.md
                ├── circular-dependency-algorithms.md
                └── backup-and-repair-patterns.md
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   ├── index.ts                     # MODIFIED: Added validate-state command
│   │   └── commands/
│   │       ├── inspect.ts               # UNCHANGED
│   │       └── validate-state.ts        # NEW: ValidateStateCommand class
│   ├── core/
│   │   ├── models.ts                    # UNCHANGED: Reuse existing schemas
│   │   ├── session-manager.ts           # UNCHANGED: Reuse for loading
│   │   ├── session-utils.ts             # UNCHANGED: Reuse read/write
│   │   ├── dependency-validator.ts      # UNCHANGED: Reuse detectCycleDFS
│   │   ├── task-utils.ts                # UNCHANGED: Reuse utilities
│   │   └── state-validator.ts           # NEW: State validation functions
│   └── utils/
│       ├── errors.ts                    # UNCHANGED: Reuse ValidationError
│       ├── logger.ts                    # UNCHANGED: Reuse getLogger
│       └── display/
│           └── table-formatter.ts       # UNCHANGED: Reuse formatting
├── tests/
│   └── integration/
│       └── validate-state.test.ts       # NEW: Integration tests
└── plan/
    └── 003_b3d3efdaf0ed/
        └── P3M2T2S3/
            └── PRP.md                   # THIS FILE
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Existing detectCircularDeps() only validates subtasks
// File: src/core/dependency-validator.ts (lines 392-440)
// Need to build a NEW function that validates ALL hierarchy levels
// Or extend buildDependencyGraph() to include Phase/Milestone/Task

// GOTCHA: dependencies array exists on ALL hierarchy levels
// Phase.dependencies, Milestone.dependencies, Task.dependencies, Subtask.dependencies
// All use same format: string[] of task IDs

// CRITICAL: Use existing BacklogSchema.parse() for Zod validation
// Don't create new schemas - reuse existing ones from src/core/models.ts
// BacklogSchema validates the entire structure recursively

// GOTCHA: SessionManager.loadSession() requires session path
// Use SessionManager.findLatestSession() to find current session
// Or use custom file path via --file option

// CRITICAL: Backup file naming convention
// Use: tasks.json.backup.{iso-timestamp}
// ISO timestamp: new Date().toISOString().replace(/[:.]/g, '-')
// Example: tasks.json.backup.2026-01-24T15-30-45-123Z

// GOTCHA: Circular dependency detection must handle disconnected graphs
// DFS must start from all unvisited nodes
// See detectCycleDFS() pattern in dependency-validator.ts (lines 264-269)

// CRITICAL: Auto-repair should be safe and conservative
// Only repair when outcome is certain
// Orphaned deps: Remove from array (safe)
// Circular deps: Remove last edge in cycle (breaks cycle, may need manual review)
// Missing fields: Add defaults (safe for dependencies array)

// GOTCHA: Status consistency check is hierarchical
// Parent Complete requires all children Complete
// Check: Phase -> Milestones -> Tasks -> Subtasks
// A Complete parent with incomplete children is an inconsistency

// CRITICAL: Use chalk for terminal output
// Colors: green for success, red for errors, yellow for warnings, cyan for headers
// See InspectCommand pattern in inspect.ts (lines 456-514)

// GOTCHA: Exit codes matter for CI/CD
// 0: Valid or warnings only
// 1: Errors found (validation failed)
// Use process.exit(code) at end of command

// CRITICAL: Don't modify existing dependency-validator.ts
// It's specifically for subtasks and used by SessionManager.initialize()
// Create new validation functions in state-validator.ts
```

---

## Implementation Blueprint

### Data Models and Structure

**1. Validation Result Interface**

```typescript
// File: src/core/state-validator.ts

/**
 * State validation result
 *
 * Contains all validation issues found during state validation.
 */
interface StateValidationResult {
  /** Overall validation status */
  isValid: boolean;

  /** Schema validation errors (Zod) */
  schemaErrors?: ZodError[];

  /** Orphaned dependencies (deps to non-existent tasks) */
  orphanedDependencies?: OrphanedDependency[];

  /** Circular dependencies detected */
  circularDependencies?: CircularDependency[];

  /** Status inconsistencies found */
  statusInconsistencies?: StatusInconsistency[];

  /** Summary counts */
  summary: {
    totalErrors: number;
    totalWarnings: number;
  };
}

/**
 * Orphaned dependency (dependency to non-existent task)
 */
interface OrphanedDependency {
  /** Task ID that has the orphaned dependency */
  taskId: string;

  /** Non-existent task ID referenced */
  missingTaskId: string;

  /** Severity: error (blocks execution) */
  severity: 'error';
}

/**
 * Circular dependency information
 */
interface CircularDependency {
  /** Array of task IDs forming the cycle */
  cycle: string[];

  /** Human-readable cycle string */
  cycleString: string;

  /** Number of edges in cycle */
  length: number;

  /** Severity: error (blocks execution) */
  severity: 'error';
}

/**
 * Status inconsistency (parent complete but child incomplete)
 */
interface StatusInconsistency {
  /** Parent item ID */
  parentId: string;

  /** Child item ID */
  childId: string;

  /** Parent status (should not be Complete) */
  parentStatus: string;

  /** Child status (not Complete) */
  childStatus: string;

  /** Severity: warning (may cause issues) */
  severity: 'warning';
}
```

**2. Command Options Interface**

```typescript
// File: src/cli/commands/validate-state.ts

/**
 * Options for validate-state command
 */
export interface ValidateStateOptions {
  /** Output format (table, json, yaml) */
  output: 'table' | 'json' | 'yaml';

  /** Override tasks.json file path */
  file?: string;

  /** Auto-repair without prompting */
  autoRepair: boolean;

  /** Create backup before repair (default: true) */
  backup: boolean;

  /** Maximum backups to keep (default: 5) */
  maxBackups: number;

  /** Session hash to validate (default: latest) */
  session?: string;
}

/**
 * Auto-repair result
 */
interface RepairResult {
  /** Whether any repairs were made */
  repaired: boolean;

  /** Number of items repaired */
  itemsRepaired: number;

  /** Backup file path created */
  backupPath?: string;

  /** Repairs applied by type */
  repairs: {
    orphanedDependencies: number;
    circularDependencies: number;
    missingFields: number;
  };
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/core/state-validator.ts - Validation functions
  DEPENDENCIES: None (first task)
  IMPLEMENT:
    - StateValidationResult, OrphanedDependency, CircularDependency, StatusInconsistency interfaces
    - validateBacklogState(backlog: Backlog): StateValidationResult function
    - validateSchema(backlog: Backlog): ZodError[] function
    - detectOrphanedDependencies(backlog: Backlog): OrphanedDependency[] function
    - detectCircularDependenciesAll(backlog: Backlog): CircularDependency[] function
    - validateStatusConsistency(backlog: Backlog): StatusInconsistency[] function
    - buildFullDependencyGraph(backlog: Backlog): DependencyGraph helper
  REUSE:
    - BacklogSchema from src/core/models.ts for schema validation
    - DFS algorithm from src/core/dependency-validator.ts as reference
  NAMING: camelCase for functions, PascalCase for interfaces
  PLACEMENT: src/core/state-validator.ts

Task 2: CREATE src/core/state-validator.ts - Repair functions
  DEPENDENCIES: Task 1 (validation functions must exist)
  IMPLEMENT:
    - repairBacklog(backlog: Backlog, validation: StateValidationResult, backupPath: string): RepairResult function
    - repairOrphanedDependencies(backlog: Backlog, orphans: OrphanedDependency[]): number function
    - repairCircularDependencies(backlog: Backlog, cycles: CircularDependency[]): number function
    - repairMissingFields(backlog: Backlog): number function
    - createBackup(tasksPath: string, maxBackups: number): Promise<string> function
    - rotateBackups(backupDir: string, maxBackups: number): Promise<void> function
  REUSE:
    - writeTasksJSON() from src/core/session-utils.ts for writing
    - copyFile() from node:fs/promises for backup
  NAMING: camelCase for functions
  PLACEMENT: src/core/state-validator.ts (same file as Task 1)

Task 3: CREATE src/cli/commands/validate-state.ts - Command class
  DEPENDENCIES: Task 1, Task 2 (validation and repair functions)
  IMPLEMENT:
    - ValidateStateOptions interface
    - ValidateStateCommand class
    - constructor(planDir?, prdPath?)
    - async execute(options: ValidateStateOptions): Promise<void> method
    - #loadSession(options): Promise<SessionState> private method
    - #runValidations(backlog, options): Promise<StateValidationResult> private method
    - #outputResults(validation, options): void private method
    - #promptForRepair(validation): Promise<boolean> private method
    - #formatTableOutput(validation): string private method
    - #formatJsonOutput(validation): string private method
    - #formatYamlOutput(validation): string private method
  REUSE:
    - SessionManager from src/core/session-manager.ts for loading
    - chalk from 'chalk' for colored output
    - InspectCommand pattern from src/cli/commands/inspect.ts
  NAMING: PascalCase for class, camelCase for methods, # for private
  PLACEMENT: src/cli/commands/validate-state.ts

Task 4: MODIFY src/cli/index.ts - Register command
  DEPENDENCIES: Task 3 (command class must exist)
  ADD:
    - Import ValidateStateCommand from './commands/validate-state.js'
    - .command() registration after inspect command (after line 278)
    - Commander options: --output, --file, --auto-repair, --backup, --max-backups, --session
    - .action() handler to execute command
  PATTERN:
    - Follow exact pattern from inspect command registration
    - Use process.exit(0) in action handler
  PLACEMENT: src/cli/index.ts (after line 278)

Task 5: CREATE tests/integration/validate-state.test.ts - Integration tests
  DEPENDENCIES: Task 1, Task 2, Task 3, Task 4 (implementation complete)
  IMPLEMENT:
    - describe('validate-state command') suite
    - test('should validate clean backlog successfully')
    - test('should detect orphaned dependencies')
    - test('should detect circular dependencies')
    - test('should detect status inconsistencies')
    - test('should create backup before repair')
    - test('should repair orphaned dependencies')
    - test('should repair circular dependencies')
    - test('should output json format')
    - test('should output table format')
    - test('should return exit code 0 for valid state')
    - test('should return exit code 1 for errors')
  MOCK:
    - Create temporary test directories
    - Create sample tasks.json files for each scenario
    - Mock console.log for output testing
  FOLLOW pattern: tests/integration/ pattern
  PLACEMENT: tests/integration/validate-state.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ================================================================
// PATTERN 1: Schema Validation with Zod
// ================================================================
// File: src/core/state-validator.ts

import { BacklogSchema } from './models.js';
import type { Backlog } from './models.js';

/**
 * Validates backlog against Zod schema
 *
 * @param backlog - Backlog to validate
 * @returns Array of Zod errors (empty if valid)
 */
export function validateSchema(backlog: Backlog): ZodError[] {
  try {
    BacklogSchema.parse(backlog);
    return [];
  } catch (error) {
    if (error instanceof ZodError) {
      return [error];
    }
    return [
      {
        issues: [
          {
            code: 'custom',
            path: [],
            message: `Unexpected error: ${error}`,
          },
        ],
      } as ZodError,
    ];
  }
}

// ================================================================
// PATTERN 2: Orphaned Dependency Detection
// ================================================================
// File: src/core/state-validator.ts

/**
 * Detects orphaned dependencies (deps to non-existent tasks)
 *
 * @param backlog - Backlog to validate
 * @returns Array of orphaned dependencies
 */
export function detectOrphanedDependencies(
  backlog: Backlog
): OrphanedDependency[] {
  const orphans: OrphanedDependency[] = [];

  // Collect all valid task IDs
  const allTaskIds = new Set<string>();
  const collectIds = (item: HierarchicalItem): void => {
    allTaskIds.add(item.id);
    if ('milestones' in item) item.milestones.forEach(collectIds);
    if ('tasks' in item) item.tasks.forEach(collectIds);
    if ('subtasks' in item) item.subtasks.forEach(collectIds);
  };
  backlog.backlog.forEach(collectIds);

  // Check all dependencies
  const checkItem = (item: HierarchicalItem): void => {
    const deps = (item as any).dependencies || [];
    for (const depId of deps) {
      if (!allTaskIds.has(depId)) {
        orphans.push({
          taskId: item.id,
          missingTaskId: depId,
          severity: 'error',
        });
      }
    }
    // Recursively check nested items
    if ('milestones' in item) item.milestones.forEach(checkItem);
    if ('tasks' in item) item.tasks.forEach(checkItem);
    if ('subtasks' in item) item.subtasks.forEach(checkItem);
  };
  backlog.backlog.forEach(checkItem);

  return orphans;
}

// ================================================================
// PATTERN 3: Full Dependency Graph Building (All Levels)
// ================================================================
// File: src/core/state-validator.ts

import type { DependencyGraph } from './dependency-validator.js';

/**
 * Builds dependency graph for all hierarchy levels
 *
 * @param backlog - Backlog to build graph from
 * @returns Dependency graph adjacency list
 */
export function buildFullDependencyGraph(backlog: Backlog): DependencyGraph {
  const graph: DependencyGraph = {};

  const addItem = (item: HierarchicalItem): void => {
    // Add to graph with dependencies
    graph[item.id] = (item as any).dependencies || [];

    // Recursively add nested items
    if ('milestones' in item) item.milestones.forEach(addItem);
    if ('tasks' in item) item.tasks.forEach(addItem);
    if ('subtasks' in item) item.subtasks.forEach(addItem);
  };
  backlog.backlog.forEach(addItem);

  return graph;
}

/**
 * Detects circular dependencies across all hierarchy levels
 *
 * @param backlog - Backlog to validate
 * @returns Array of circular dependencies
 */
export function detectCircularDependenciesAll(
  backlog: Backlog
): CircularDependency[] {
  const graph = buildFullDependencyGraph(backlog);
  const cycles: CircularDependency[] = [];

  // Use DFS three-color algorithm (from dependency-validator.ts)
  const state = new Map<string, NodeState>();
  const currentPath: string[] = [];

  // Initialize all nodes as UNVISITED
  for (const nodeId of Object.keys(graph)) {
    state.set(nodeId, NodeState.UNVISITED);
  }

  const dfs = (nodeId: string): string[] | null => {
    const currentState = state.get(nodeId) ?? NodeState.UNVISITED;

    if (currentState === NodeState.VISITING) {
      // BACK EDGE DETECTED - cycle found
      const cycleStart = currentPath.indexOf(nodeId);
      return [...currentPath.slice(cycleStart), nodeId];
    }

    if (currentState === NodeState.VISITED) {
      return null; // Already explored
    }

    state.set(nodeId, NodeState.VISITING);
    currentPath.push(nodeId);

    // Explore dependencies
    for (const depId of graph[nodeId] ?? []) {
      const result = dfs(depId);
      if (result) return result;
    }

    state.set(nodeId, NodeState.VISITED);
    currentPath.pop();
    return null;
  };

  // Check all nodes
  for (const nodeId of Object.keys(graph)) {
    if (state.get(nodeId) === NodeState.UNVISITED) {
      const cycle = dfs(nodeId);
      if (cycle) {
        cycles.push({
          cycle,
          cycleString: cycle.join(' → '),
          length: cycle.length - 1,
          severity: 'error',
        });
      }
    }
  }

  return cycles;
}

// ================================================================
// PATTERN 4: Status Consistency Validation
// ================================================================
// File: src/core/state-validator.ts

/**
 * Validates parent-child status consistency
 *
 * A parent should not be Complete if any child is not Complete.
 *
 * @param backlog - Backlog to validate
 * @returns Array of status inconsistencies
 */
export function validateStatusConsistency(
  backlog: Backlog
): StatusInconsistency[] {
  const inconsistencies: StatusInconsistency[] = [];

  const checkChildren = (
    parentId: string,
    parentStatus: string,
    children: HierarchicalItem[]
  ): void => {
    if (parentStatus !== 'Complete') return;

    for (const child of children) {
      if (child.status !== 'Complete') {
        inconsistencies.push({
          parentId,
          childId: child.id,
          parentStatus,
          childStatus: child.status,
          severity: 'warning',
        });
      }

      // Recursively check nested children
      if ('milestones' in child) {
        checkChildren(child.id, child.status, child.milestones);
      }
      if ('tasks' in child) {
        checkChildren(child.id, child.status, child.tasks);
      }
      if ('subtasks' in child) {
        checkChildren(child.id, child.status, child.subtasks);
      }
    }
  };

  for (const phase of backlog.backlog) {
    checkChildren(phase.id, phase.status, phase.milestones);
  }

  return inconsistencies;
}

// ================================================================
// PATTERN 5: Backup Creation
// ================================================================
// File: src/core/state-validator.ts

import { copyFile, readdir, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/**
 * Creates timestamped backup of tasks.json
 *
 * @param tasksPath - Path to tasks.json
 * @param maxBackups - Maximum backups to keep (default: 5)
 * @returns Path to created backup file
 */
export async function createBackup(
  tasksPath: string,
  maxBackups: number = 5
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = dirname(tasksPath);
  const backupName = `tasks.json.backup.${timestamp}`;
  const backupPath = resolve(backupDir, backupName);

  // Create backup
  await copyFile(tasksPath, backupPath);

  // Rotate old backups
  await rotateBackups(backupDir, maxBackups);

  return backupPath;
}

/**
 * Rotates backup files, keeping only the most recent
 *
 * @param backupDir - Directory containing backups
 * @param maxBackups - Maximum backups to keep
 */
async function rotateBackups(
  backupDir: string,
  maxBackups: number
): Promise<void> {
  const files = await readdir(backupDir);

  // Get backup files sorted by date (newest first)
  const backups = files
    .filter(f => f.startsWith('tasks.json.backup.'))
    .sort()
    .reverse();

  // Remove old backups
  for (const oldBackup of backups.slice(maxBackups)) {
    await unlink(resolve(backupDir, oldBackup));
  }
}

// ================================================================
// PATTERN 6: Auto-Repair Functions
// ================================================================
// File: src/core/state-validator.ts

/**
 * Repairs orphaned dependencies by removing invalid references
 *
 * @param backlog - Backlog to repair (modified in-place)
 * @param orphans - Orphaned dependencies to remove
 * @returns Number of items repaired
 */
export function repairOrphanedDependencies(
  backlog: Backlog,
  orphans: OrphanedDependency[]
): number {
  let repaired = 0;
  const orphanMap = new Map<string, string[]>();

  // Group orphans by task ID
  for (const orphan of orphans) {
    if (!orphanMap.has(orphan.taskId)) {
      orphanMap.set(orphan.taskId, []);
    }
    orphanMap.get(orphan.taskId)!.push(orphan.missingTaskId);
  }

  // Remove orphaned dependencies
  const repairItem = (item: HierarchicalItem): void => {
    const deps = (item as any).dependencies;
    if (deps && orphanMap.has(item.id)) {
      const missingIds = orphanMap.get(item.id)!;
      const originalLength = deps.length;
      (item as any).dependencies = deps.filter(
        (id: string) => !missingIds.includes(id)
      );
      if (deps.length < originalLength) {
        repaired++;
      }
    }

    // Recursively repair nested items
    if ('milestones' in item) item.milestones.forEach(repairItem);
    if ('tasks' in item) item.tasks.forEach(repairItem);
    if ('subtasks' in item) item.subtasks.forEach(repairItem);
  };
  backlog.backlog.forEach(repairItem);

  return repaired;
}

/**
 * Repairs circular dependencies by removing last edge in cycle
 *
 * @param backlog - Backlog to repair (modified in-place)
 * @param cycles - Circular dependencies to fix
 * @returns Number of items repaired
 */
export function repairCircularDependencies(
  backlog: Backlog,
  cycles: CircularDependency[]
): number {
  let repaired = 0;

  for (const cycle of cycles) {
    // Remove last edge: second-to-last task depends on first
    const lastTaskId = cycle.cycle[cycle.cycle.length - 2];
    const firstTaskId = cycle.cycle[0];

    const findAndRepair = (item: HierarchicalItem): boolean => {
      if (item.id === lastTaskId && (item as any).dependencies) {
        const deps = (item as any).dependencies as string[];
        const idx = deps.indexOf(firstTaskId);
        if (idx !== -1) {
          deps.splice(idx, 1);
          repaired++;
          return true;
        }
      }

      // Recursively search
      if ('milestones' in item) {
        for (const m of item.milestones) {
          if (findAndRepair(m)) return true;
        }
      }
      if ('tasks' in item) {
        for (const t of item.tasks) {
          if (findAndRepair(t)) return true;
        }
      }
      if ('subtasks' in item) {
        for (const s of item.subtasks) {
          if (findAndRepair(s)) return true;
        }
      }
      return false;
    };

    for (const phase of backlog.backlog) {
      if (findAndRepair(phase)) break;
    }
  }

  return repaired;
}

// ================================================================
// PATTERN 7: Main Validation Function
// ================================================================
// File: src/core/state-validator.ts

/**
 * Validates backlog state comprehensively
 *
 * @param backlog - Backlog to validate
 * @returns Complete validation result
 */
export function validateBacklogState(backlog: Backlog): StateValidationResult {
  const result: StateValidationResult = {
    isValid: true,
    summary: { totalErrors: 0, totalWarnings: 0 },
  };

  // Schema validation
  result.schemaErrors = validateSchema(backlog);
  if (result.schemaErrors.length > 0) {
    result.isValid = false;
    result.summary.totalErrors += result.schemaErrors.reduce(
      (sum, e) => sum + e.issues.length,
      0
    );
  }

  // Orphaned dependencies
  result.orphanedDependencies = detectOrphanedDependencies(backlog);
  if (result.orphanedDependencies.length > 0) {
    result.isValid = false;
    result.summary.totalErrors += result.orphanedDependencies.length;
  }

  // Circular dependencies
  result.circularDependencies = detectCircularDependenciesAll(backlog);
  if (result.circularDependencies.length > 0) {
    result.isValid = false;
    result.summary.totalErrors += result.circularDependencies.length;
  }

  // Status consistency
  result.statusInconsistencies = validateStatusConsistency(backlog);
  if (result.statusInconsistencies.length > 0) {
    // Status inconsistencies are warnings, don't affect isValid
    result.summary.totalWarnings += result.statusInconsistencies.length;
  }

  return result;
}

/**
 * Repairs backlog issues
 *
 * @param backlog - Backlog to repair (modified in-place)
 * @param validation - Validation result with issues
 * @param backupPath - Backup file path created
 * @returns Repair result
 */
export async function repairBacklog(
  backlog: Backlog,
  validation: StateValidationResult,
  backupPath: string
): Promise<RepairResult> {
  const result: RepairResult = {
    repaired: false,
    itemsRepaired: 0,
    backupPath,
    repairs: {
      orphanedDependencies: 0,
      circularDependencies: 0,
      missingFields: 0,
    },
  };

  // Repair orphaned dependencies
  if (validation.orphanedDependencies) {
    result.repairs.orphanedDependencies = repairOrphanedDependencies(
      backlog,
      validation.orphanedDependencies
    );
    result.itemsRepaired += result.repairs.orphanedDependencies;
  }

  // Repair circular dependencies
  if (validation.circularDependencies) {
    result.repairs.circularDependencies = repairCircularDependencies(
      backlog,
      validation.circularDependencies
    );
    result.itemsRepaired += result.repairs.circularDependencies;
  }

  result.repaired = result.itemsRepaired > 0;
  return result;
}

// ================================================================
// PATTERN 8: Command Class
// ================================================================
// File: src/cli/commands/validate-state.ts

import { SessionManager } from '../../core/session-manager.js';
import type { SessionState } from '../../core/models.js';
import {
  validateBacklogState,
  repairBacklog,
  createBackup,
} from '../../core/state-validator.js';
import { writeTasksJSON } from '../../core/session-utils.js';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { createInterface } from 'node:readline';

export class ValidateStateCommand {
  readonly #planDir: string;
  readonly #prdPath: string;

  constructor(
    planDir: string = resolve('plan'),
    prdPath: string = resolve('PRD.md')
  ) {
    this.#planDir = planDir;
    this.#prdPath = prdPath;
  }

  async execute(options: ValidateStateOptions): Promise<void> {
    // Load session
    const sessionState = await this.#loadSession(options);

    // Run validations
    const validation = this.#runValidations(sessionState.taskRegistry, options);

    // Output results
    this.#outputResults(validation, options);

    // Exit if valid
    if (validation.isValid) {
      process.exit(0);
    }

    // Handle repair
    const shouldRepair =
      options.autoRepair ||
      (process.stdin.isTTY && (await this.#promptForRepair(validation)));

    if (shouldRepair) {
      // Create backup
      const backupPath = options.backup
        ? await createBackup(
            resolve(sessionState.metadata.path, 'tasks.json'),
            options.maxBackups
          )
        : undefined;

      // Perform repairs
      const repairResult = await repairBacklog(
        sessionState.taskRegistry,
        validation,
        backupPath!
      );

      if (repairResult.repaired) {
        console.log(
          chalk.green(`✓ Repaired ${repairResult.itemsRepaired} items`)
        );
        if (backupPath) {
          console.log(chalk.gray(`  Backup: ${backupPath}`));
        }

        // Write repaired backlog
        await writeTasksJSON(
          sessionState.metadata.path,
          sessionState.taskRegistry
        );

        // Re-validate
        const revalidation = this.#runValidations(
          sessionState.taskRegistry,
          options
        );
        if (revalidation.isValid) {
          console.log(chalk.green('✓ State is now valid'));
        }
      }
    }

    // Exit with error code
    process.exit(validation.isValid ? 0 : 1);
  }

  async #loadSession(options: ValidateStateOptions): Promise<SessionState> {
    const manager = new SessionManager(this.#prdPath, this.#planDir);

    if (options.file) {
      // Load from specific file
      const sessionPath = resolve(options.file, '..');
      return await manager.loadSession(sessionPath);
    } else if (options.session) {
      // Find session by hash
      const sessions = await SessionManager.listSessions(this.#planDir);
      const session = sessions.find(s => s.hash.startsWith(options.session!));
      if (!session) {
        throw new Error(`Session not found: ${options.session}`);
      }
      return await manager.loadSession(session.path);
    } else {
      // Load latest session
      const latest = await SessionManager.findLatestSession(this.#planDir);
      if (!latest) {
        throw new Error('No sessions found');
      }
      return await manager.loadSession(latest.path);
    }
  }

  #runValidations(
    backlog: import('../../core/models.js').Backlog,
    _options: ValidateStateOptions
  ): import('../../core/state-validator.js').StateValidationResult {
    return validateBacklogState(backlog);
  }

  #outputResults(
    validation: import('../../core/state-validator.js').StateValidationResult,
    options: ValidateStateOptions
  ): void {
    if (options.output === 'json') {
      console.log(JSON.stringify(validation, null, 2));
    } else if (options.output === 'yaml') {
      console.log(JSON.stringify(validation, null, 2)); // Use yaml lib in production
    } else {
      console.log(this.#formatTableOutput(validation));
    }
  }

  #formatTableOutput(
    validation: import('../../core/state-validator.js').StateValidationResult
  ): string {
    const lines: string[] = [];

    lines.push(
      chalk.bold.cyan('\n═════════════════════════════════════════════════════')
    );
    lines.push(chalk.bold.cyan('  State Validation Results'));
    lines.push(
      chalk.bold.cyan('═════════════════════════════════════════════════════\n')
    );

    // Status
    const statusIcon = validation.isValid ? chalk.green('✓') : chalk.red('✗');
    const statusText = validation.isValid ? 'Valid' : 'Invalid';
    lines.push(`Status: ${statusIcon} ${statusText}`);
    lines.push(
      `Errors: ${chalk.red(validation.summary.totalErrors.toString())}`
    );
    lines.push(
      `Warnings: ${chalk.yellow(validation.summary.totalWarnings.toString())}`
    );
    lines.push('');

    // Schema errors
    if (validation.schemaErrors && validation.schemaErrors.length > 0) {
      lines.push(chalk.bold.red('Schema Errors:'));
      for (const error of validation.schemaErrors) {
        for (const issue of error.issues) {
          lines.push(
            chalk.red(`  ✗ ${issue.path.join('.')}: ${issue.message}`)
          );
        }
      }
      lines.push('');
    }

    // Orphaned dependencies
    if (
      validation.orphanedDependencies &&
      validation.orphanedDependencies.length > 0
    ) {
      lines.push(chalk.bold.red('Orphaned Dependencies:'));
      for (const orphan of validation.orphanedDependencies) {
        lines.push(
          chalk.red(
            `  ✗ ${orphan.taskId} depends on non-existent ${orphan.missingTaskId}`
          )
        );
      }
      lines.push('');
    }

    // Circular dependencies
    if (
      validation.circularDependencies &&
      validation.circularDependencies.length > 0
    ) {
      lines.push(chalk.bold.red('Circular Dependencies:'));
      for (const cycle of validation.circularDependencies) {
        lines.push(chalk.red(`  ✗ ${cycle.cycleString}`));
      }
      lines.push('');
    }

    // Status inconsistencies
    if (
      validation.statusInconsistencies &&
      validation.statusInconsistencies.length > 0
    ) {
      lines.push(chalk.bold.yellow('Status Inconsistencies:'));
      for (const inc of validation.statusInconsistencies) {
        lines.push(
          chalk.yellow(
            `  ⚠ ${inc.parentId} is Complete but ${inc.childId} is ${inc.childStatus}`
          )
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  async #promptForRepair(
    validation: import('../../core/state-validator.js').StateValidationResult
  ): Promise<boolean> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt: string): Promise<string> =>
      new Promise(resolve => rl.question(prompt, resolve));

    const answer = await question('\nAttempt auto-repair? (y/N): ');
    rl.close();

    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }
}

// ================================================================
// PATTERN 9: CLI Registration
// ================================================================
// File: src/cli/index.ts (add after line 278)

// Import at top of file
import { ValidateStateCommand } from './commands/validate-state.js';

// Register command after inspect command
program
  .command('validate-state')
  .description('Validate task hierarchy state and dependencies')
  .option('-o, --output <format>', 'Output format (table, json, yaml)', 'table')
  .option('-f, --file <path>', 'Override tasks.json file path')
  .option('--auto-repair', 'Automatically repair without prompting', false)
  .option('--no-backup', 'Skip backup creation before repair', false)
  .option('--max-backups <n>', 'Maximum backups to keep', '5')
  .option('-s, --session <hash>', 'Validate specific session by hash')
  .action(async options => {
    const validateCommand = new ValidateStateCommand();
    await validateCommand.execute({
      output: options.output || 'table',
      file: options.file,
      autoRepair: options.autoRepair || false,
      backup: options.backup !== false,
      maxBackups: parseInt(options.maxBackups || '5', 10),
      session: options.session,
    });
    process.exit(0);
  });
```

### Integration Points

```yaml
STATE_VALIDATOR:
  - create: src/core/state-validator.ts
  - export: validateBacklogState(), repairBacklog(), createBackup()
  - export: detectOrphanedDependencies(), detectCircularDependenciesAll(), validateStatusConsistency()
  - export: Types: StateValidationResult, OrphanedDependency, CircularDependency, StatusInconsistency, RepairResult

CLI_COMMAND:
  - create: src/cli/commands/validate-state.ts
  - export: ValidateStateCommand class
  - export: ValidateStateOptions interface
  - implement: execute(), #loadSession(), #runValidations(), #outputResults(), #promptForRepair()

CLI_REGISTRATION:
  - modify: src/cli/index.ts
  - add: import for ValidateStateCommand
  - add: .command('validate-state') registration
  - add: options: --output, --file, --auto-repair, --no-backup, --max-backups, --session

INTEGRATION_TESTS:
  - create: tests/integration/validate-state.test.ts
  - test: All validation types
  - test: Repair functionality
  - test: Output formats
  - test: Exit codes
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Type checking
npx tsc --noEmit src/core/state-validator.ts
npx tsc --noEmit src/cli/commands/validate-state.ts
npx tsc --noEmit src/cli/index.ts

# Linting (if configured)
npx eslint src/core/state-validator.ts --fix
npx eslint src/cli/commands/validate-state.ts --fix

# Format
npx prettier --write src/core/state-validator.ts
npx prettier --write src/cli/commands/validate-state.ts

# Expected: Zero type errors, zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test state validation functions
vitest run tests/unit/core/state-validator.test.ts

# Test CLI command
vitest run tests/unit/cli/validate-state.test.ts

# Full unit test suite
vitest run tests/unit/

# Coverage
vitest run tests/unit/ --coverage

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test full validate-state command
prd validate-state

# Test with specific session
prd validate-state --session 14b

# Test with custom file
prd validate-state --file plan/001_14b9dc2a33c7/tasks.json

# Test auto-repair
echo "y" | prd validate-state --auto-repair

# Test output formats
prd validate-state --output json
prd validate-state --output yaml

# Expected: Command executes, validation results displayed
```

### Level 4: Manual Validation

```bash
# Create test session with circular dependency
# Manually edit tasks.json to add: P1.M1.T1.S1 dependencies: ["P1.M1.T1.S1"]

# Run validation
prd validate-state

# Expected:
# - Detects circular dependency
# - Shows cycle path
# - Offers auto-repair
# - Creates backup before repair
# - Confirms repair success

# Verify backup created
ls -la plan/*/tasks.json.backup.*

# Verify repaired state
prd validate-state

# Expected: State now valid, no errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] State validation functions implemented in `src/core/state-validator.ts`
- [ ] `validateBacklogState()` runs all 4 validation types
- [ ] `validateSchema()` uses BacklogSchema.parse()
- [ ] `detectOrphanedDependencies()` finds deps to non-existent tasks
- [ ] `detectCircularDependenciesAll()` uses DFS three-color algorithm
- [ ] `validateStatusConsistency()` checks parent-child relationships
- [ ] Backup creation uses ISO timestamp format
- [ ] Backup rotation keeps max N most recent
- [ ] `repairOrphanedDependencies()` removes invalid deps
- [ ] `repairCircularDependencies()` removes last edge in cycle
- [ ] `ValidateStateCommand` class implemented
- [ ] Command registered in `src/cli/index.ts`
- [ ] All 4 validation levels completed successfully
- [ ] No type errors: `npx tsc --noEmit`

### Feature Validation

- [ ] `prd validate-state` executes without errors
- [ ] Loads tasks.json from current/latest session
- [ ] `--file` option loads from specific path
- [ ] `--session` option loads specific session
- [ ] `--output json` produces valid JSON
- [ ] `--output yaml` produces YAML-like output
- [ ] `--output table` produces formatted table
- [ ] Detects orphaned dependencies with clear messages
- [ ] Detects circular dependencies with cycle path
- [ ] Detects status inconsistencies with parent-child info
- [ ] Creates backup before repair (`tasks.json.backup.{timestamp}`)
- [ ] `--auto-repair` skips prompting
- [ ] `--no-backup` skips backup creation
- [ ] `--max-backups N` keeps N most recent backups
- [ ] Returns exit code 0 for valid state
- [ ] Returns exit code 1 for errors

### Code Quality Validation

- [ ] Follows existing CLI command patterns (InspectCommand)
- [ ] Reuses existing Zod schemas from models.ts
- [ ] Reuses existing DFS algorithm from dependency-validator.ts
- [ ] Reuses atomic write pattern from session-utils.ts
- [ ] Uses chalk for colored terminal output
- [ ] Error handling is comprehensive
- [ ] JSDoc comments added for public functions
- [ ] Anti-patterns avoided (see below)

### Documentation & Deployment

- [ ] Code is self-documenting with clear names
- [ ] Help text is clear (`prd validate-state --help`)
- [ ] Error messages are actionable
- [ ] Backup location is logged

---

## Anti-Patterns to Avoid

- **Don't** modify existing `detectCircularDeps()` in dependency-validator.ts - create new functions
- **Don't** duplicate Zod schemas - reuse from models.ts
- **Don't** use sync file operations - use async/promises
- **Don't** skip backup creation in auto-repair - data safety is critical
- **Don't** repair without user confirmation unless `--auto-repair` flag
- **Don't** modify tasks.json without Zod validation first
- **Don't** use recursive DFS for large graphs without considering stack depth
- **Don't** forget to handle disconnected graphs in cycle detection
- **Don't** repair schema errors automatically - these need manual review
- **Don't** use process.exit() inside the command class - use in CLI registration only
- **Don't** create backups in session root - place alongside tasks.json
- **Don't** keep unlimited backups - implement rotation

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:

- Complete analysis of existing CLI command patterns (InspectCommand)
- Existing Zod schemas are comprehensive
- Existing circular dependency algorithm is production-ready
- Clear patterns for atomic writes and backup creation
- Test patterns well-established in the codebase
- Comprehensive research with full algorithm implementations
- Specific file paths, line numbers, and code patterns provided

**Risk Areas**:

- Full dependency graph must include ALL hierarchy levels (not just subtasks)
- Auto-repair logic must be conservative and safe
- Backup file naming must use consistent format
- Interactive prompt must handle non-TTY environments

**Mitigation**:

- Build full dependency graph from all hierarchy levels
- Only auto-repair when outcome is certain (orphaned deps, circular deps)
- Use ISO timestamp format with character replacement
- Check `process.stdin.isTTY` before prompting

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Related Documents**:

- Codebase Analysis: `plan/003_b3d3efdaf0ed/P3M2T2S3/research/codebase-analysis-summary.md`
- Circular Dependency Algorithms: `plan/003_b3d3efdaf0ed/P3M2T2S3/research/circular-dependency-algorithms.md`
- Backup and Repair Patterns: `plan/003_b3d3efdaf0ed/P3M2T2S3/research/backup-and-repair-patterns.md`
- Flush Retry PRP: `plan/003_b3d3efdaf0ed/P3M2T2S2/PRP.md` (parallel work)
- Checkpoint PRP: `plan/003_b3d3efdaf0ed/P3M2T2S1/PRP.md` (parallel work)
