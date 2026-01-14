---
name: 'Circular Dependency Detection - Task Dependency Graph Validation'
description: |
---

## Goal

**Feature Goal**: Implement circular dependency detection in the task backlog using Depth-First Search (DFS) with cycle path reconstruction, preventing deadlock conditions that would occur when tasks depend on each other in a circular manner.

**Deliverable**: New `src/core/dependency-validator.ts` module with `detectCircularDeps()` function, modified `SessionManager.initialize()` to call validator, helpful error messages showing the exact cycle path, and comprehensive unit tests.

**Success Definition**:

- `detectCircularDeps()` function detects all circular dependencies in a backlog
- DFS algorithm with visited set + recursion stack correctly identifies back edges
- Cycle path is reconstructed and included in error context (e.g., `['P1.M1.T1.S1', 'P1.M1.T2.S1', 'P1.M1.T1.S1']`)
- Self-dependencies (A → A) are detected immediately
- Multiple disconnected components are all validated
- ValidationError thrown with cycle path and helpful message
- Logged warnings for long dependency chains (>5 levels) without cycles
- 100% test coverage for all edge cases

## User Persona

**Target User**: Developers and product managers using the PRP Pipeline to manage task backlogs with complex dependency relationships.

**Use Case**: When a backlog contains tasks with circular dependencies (e.g., Task A depends on Task B, which depends on Task A), the pipeline should detect this during initialization and fail fast with a clear error showing the exact cycle path, rather than deadlocking during task execution.

**User Journey**:

1. User runs pipeline with a backlog containing circular dependencies
2. SessionManager.initialize() calls detectCircularDeps()
3. DFS traversal detects back edge indicating a cycle
4. ValidationError thrown with cycle path: `P1.M1.T1.S1 → P1.M1.T2.S1 → P1.M1.T1.S1`
5. Error message shows: "Circular dependency detected: Task A depends on Task B, which depends on Task A"
6. User fixes dependencies by removing one edge in the cycle
7. Pipeline proceeds with valid dependency graph

**Pain Points Addressed**:

- Cryptic deadlocks during task execution when cycles exist
- No indication of which tasks form the cycle
- Time wasted debugging dependency issues at runtime
- No validation of dependency graph structure upfront

## Why

- **Business value**: Prevents pipeline deadlock from circular dependencies, provides clear actionable error messages for faster debugging
- **Integration**: Uses ValidationError from error hierarchy (P5.M4.T1.S1), integrates with SessionManager initialization, works alongside PRDValidator from P5.M4.T2.S1
- **Problems solved**: Deadlock conditions, unclear cycle information, no upfront dependency validation

## What

Implement circular dependency detection in SessionManager.initialize():

1. **Dependency Graph Building**: Extract all Subtasks from backlog and build adjacency list (task ID → dependencies array)
2. **DFS Cycle Detection**: Implement three-color marking algorithm (White/Gray/Black) with visited set + recursion stack
3. **Cycle Path Reconstruction**: When back edge detected, reconstruct the exact cycle path for error message
4. **Long Chain Warning**: Detect dependency chains >5 levels and log warnings (non-blocking)
5. **SessionManager Integration**: Call validator in initialize() after backlog creation, throw ValidationError if cycles found
6. **Self-Dependency Check**: Detect tasks that depend on themselves immediately

### Success Criteria

- [ ] detectCircularDeps() function exported from src/core/dependency-validator.ts
- [ ] DFS algorithm with three-color marking (UNVISITED/VISITING/VISITED states)
- [ ] Cycle path reconstruction returns array of task IDs forming the cycle
- [ ] Self-dependencies detected and reported
- [ ] Multiple disconnected components all validated
- [ ] SessionManager.initialize() calls validator before task execution
- [ ] ValidationError thrown with cycle path in error context
- [ ] Logged warnings for dependency chains >5 levels
- [ ] 100% test coverage for all edge cases
- [ ] Error messages include visual formatting (box drawing, arrows)

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with this codebase should be able to implement this PRP successfully using only this document and the referenced files.

### Documentation & References

```yaml
# MUST READ - Task dependency data structure
- file: src/core/models.ts
  why: Subtask interface with dependencies field, Backlog structure
  pattern: Subtask.dependencies: string[] (line 193), Backlog.backlog: Phase[] (line 598)
  critical: Only Subtasks have dependencies, stored as string array of task IDs
  gotcha: Dependencies use string IDs like 'P1.M1.T1.S1', not references

# MUST READ - SessionManager initialization flow
- file: src/core/session-manager.ts
  why: initialize() method is where to call circular dependency detection
  pattern: Lines 227-252 create new session with empty backlog, validate after this
  critical: Call validator after backlog is populated but before task execution begins
  gotcha: initialize() loads existing session or creates new one - validate in both paths

# MUST READ - Error hierarchy for circular dependency errors
- file: src/utils/errors.ts
  why: Provides ValidationError class and ErrorCodes for dependency failures
  pattern: Use ValidationError for circular dependencies, include cycle path in context
  critical: Lines 433-440 define ValidationError, lines 58-83 define ErrorCodes
  usage: throw new ValidationError('Circular dependency detected', { cyclePath, taskId }, errorCode)

# MUST READ - Task hierarchy utilities for traversal
- file: src/utils/task-utils.ts
  why: Provides getAllSubtasks() for extracting all subtasks from backlog
  pattern: Recursively traverse Phase > Milestone > Task > Subtask hierarchy
  critical: getDependencies() function (lines 131-142) resolves IDs to Subtask objects
  gotcha: Use getAllSubtasks() to build dependency graph, not manual traversal

# MUST READ - Logger for validation warnings
- file: src/utils/logger.ts
  why: Structured logging for long chain warnings and error messages
  pattern: logger.warn() for long dependency chains, logger.error() for cycles
  critical: Use getLogger('DependencyValidator') for consistent log context

# MUST READ - Existing validator pattern (PRDValidator from P5.M4.T2.S1)
- file: src/utils/prd-validator.ts
  why: Reference pattern for validator class structure and error handling
  pattern: Class-based validator with validate() method returning structured result
  critical: Similar integration in SessionManager.initialize()
  gotcha: PRDValidator returns ValidationResult, we throw ValidationError directly

# RESEARCH DOCUMENTATION - DFS cycle detection algorithm
- docfile: plan/001_14b9dc2a33c7/P5M4T2S1/research/circular_dependency_detection_research.md
  why: Comprehensive DFS algorithm with three-color marking, path reconstruction, edge cases
  section: "Core Algorithm: DFS Cycle Detection", "Cycle Path Reconstruction", "Edge Cases and Handling"
  critical: Three-color enum (UNVISITED=0, VISITING=1, VISITED=2), currentPath tracking
```

### Current Codebase Tree

```bash
src/
├── core/
│   ├── models.ts                # Subtask.dependencies field (line 193)
│   ├── session-manager.ts       # MODIFY - Call validator in initialize()
│   └── task-orchestrator.ts     # REFERENCE - canExecute() checks dependencies
├── utils/
│   ├── errors.ts                # USE - ValidationError class
│   ├── logger.ts                # USE - Structured logging
│   └── task-utils.ts            # USE - getAllSubtasks() for graph building
└── index.ts

tests/
└── unit/
    └── core/
        └── dependency-validator.test.ts  # CREATE - Comprehensive tests
```

### Desired Codebase Tree (After Implementation)

```bash
src/
├── core/
│   ├── dependency-validator.ts  # NEW - detectCircularDeps() function
│   ├── models.ts                # EXISTING - Subtask interface
│   └── session-manager.ts       # MODIFIED - Call validator in initialize()
├── utils/
│   ├── errors.ts                # EXISTING - Use ValidationError
│   ├── logger.ts                # EXISTING - Use getLogger()
│   └── task-utils.ts            # EXISTING - Use getAllSubtasks()

tests/
└── unit/
    └── core/
        └── dependency-validator.test.ts  # NEW - Comprehensive test suite
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Only Subtasks have dependencies, not Tasks/Milestones/Phases
// When building graph, only iterate over Subtask objects
// Import: import { isSubtask, type Subtask } from '../core/models.js'
// Use: getAllSubtasks() returns flat array of Subtask objects

// CRITICAL: Dependencies are string IDs, not object references
// Pattern: task.dependencies = ['P1.M1.T1.S1', 'P1.M1.T1.S2']
// Need to build adjacency list mapping ID -> dependencies array

// CRITICAL: Task IDs follow dot notation format
// Format: P{phase}.M{milestone}.T{task}.S{subtask}
// Example: 'P1.M1.T1.S1' = Phase 1, Milestone 1, Task 1, Subtask 1
// IDs are unique across entire backlog

// CRITICAL: DFS must handle disconnected components
// Backlog may have multiple independent dependency graphs
// Must iterate through all nodes, not just start from first task
// Pattern: for (const node of Object.keys(graph)) { if (!visited.has(node)) { dfs(node); } }

// CRITICAL: Cycle path reconstruction requires currentPath tracking
// When back edge detected, find index of neighbor in currentPath
// Cycle = currentPath.slice(cycleStart) + [neighbor]
// Example: ['A', 'B', 'C'] + ['A'] = ['A', 'B', 'C', 'A']

// CRITICAL: Self-dependency is A → A (single node cycle)
// Check this first before DFS: if (dependencies.includes(taskId)) { self-cycle! }
// Throws immediately with special message "Task {id} depends on itself"

// CRITICAL: Three-color marking for clarity (alternative to two-set approach)
// UNVISITED (0) = Never seen this node
// VISITING (1) = Currently in recursion stack (gray)
// VISITED (2) = Fully explored, no cycles from here (black)
// Back edge detected when we encounter a VISITING node

// CRITICAL: ValidationError from error hierarchy has specific structure
// Import: import { ValidationError, ErrorCodes } from '../utils/errors.js'
// Usage: throw new ValidationError(message, { cyclePath, taskId, suggestion }, errorCode)
// Need to add new error code: PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY

// CRITICAL: Log warnings for long chains (>5 levels) but don't throw
// These are valid but may indicate design issues
// Pattern: if (chainDepth > 5) { logger.warn({ taskId, depth }, 'Long dependency chain'); }
// Use: getLogger('DependencyValidator') for consistent log context

// CRITICAL: SessionManager.initialize() loads existing session or creates new
// Validation should happen in BOTH paths (new session and resume existing)
// Lines 227-252: Create new session with empty backlog
// Lines 175-206: Load existing session from disk
// Validate AFTER backlog is available in both cases

// CRITICAL: Use getAllSubtasks() from task-utils.ts for traversal
// Don't manually traverse Phase > Milestone > Task > Subtask hierarchy
// Import: import { getAllSubtasks } from '../utils/task-utils.js'
// Returns: Subtask[] - flat array of all subtasks in backlog

// CRITICAL: Graph is directed (dependencies are one-way)
// A depends on B means edge A → B
// Cycle detection follows direction of edges
// Don't confuse with reverse graph for topological sort

// CRITICAL: Multiple cycles may exist - find first one and throw
// Don't try to find all cycles, just detect first and fail fast
// User fixes first cycle, then re-runs to find next one
// Pattern: early return when first cycle detected

// CRITICAL: Empty dependencies array is valid (no dependencies)
// Graph may have nodes with no edges (leaf tasks)
// Handle gracefully: graph[nodeId] = [] for tasks with no dependencies
// Don't treat empty array as error

// CRITICAL: Dependency IDs may reference non-existent tasks (separate issue)
// This validator only checks for cycles, not dependency existence
// Missing dependency IDs should be caught by separate validation
// Focus: Detect cycles, not validate dependency references
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Dependency graph adjacency list
interface DependencyGraph {
  [taskId: string]: string[]; // taskId -> array of dependency IDs
}

// Node state for three-color marking
enum NodeState {
  UNVISITED = 0, // White - never seen
  VISITING = 1, // Gray - in current recursion stack
  VISITED = 2, // Black - fully explored
}

// Cycle detection result
interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[]; // Array of task IDs forming the cycle
  cycleLength?: number; // Number of edges in cycle
}

// Long chain information for warnings
interface LongChainInfo {
  taskId: string;
  depth: number;
  chain: string[];
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/core/dependency-validator.ts
  - IMPLEMENT: detectCircularDeps(backlog: Backlog): string[] function
  - IMPORT: Backlog, Subtask from '../core/models.js'
  - IMPORT: getAllSubtasks from '../utils/task-utils.js'
  - DEFINE: DependencyGraph, NodeState, CycleDetectionResult interfaces
  - DEFINE: NodeState enum (UNVISITED=0, VISITING=1, VISITED=2)
  - NAMING: camelCase for function, PascalCase for interfaces
  - PLACEMENT: Core module alongside session-manager.ts

Task 2: IMPLEMENT buildDependencyGraph() helper
  - CREATE: buildDependencyGraph(subtasks: Subtask[]): DependencyGraph
  - EXTRACT: All subtasks from backlog using getAllSubtasks()
  - BUILD: Adjacency list mapping taskId -> dependencies array
  - FILTER: Only include Subtasks (other levels don't have dependencies)
  - RETURN: Graph object with { taskId: dependencies[] }
  - DEPENDENCIES: Task 1

Task 3: IMPLEMENT detectSelfDependencies() helper
  - CREATE: detectSelfDependencies(graph: DependencyGraph): string[]
  - CHECK: For each task, does dependencies array include its own ID?
  - RETURN: Array of task IDs with self-dependencies
  - PRIORITY: Check this first, throw immediately if found
  - DEPENDENCIES: Task 2

Task 4: IMPLEMENT DFS cycle detection with three-color marking
  - CREATE: detectCycleDFS(graph: DependencyGraph): CycleDetectionResult
  - USE: NodeState enum (UNVISITED, VISITING, VISITED) instead of two sets
  - TRACK: currentPath: string[] for cycle reconstruction
  - DETECT: Back edge when encountering VISITING node
  - RECONSTRUCT: Cycle path using currentPath.slice(cycleStart) + [neighbor]
  - HANDLE: Disconnected components by iterating all nodes
  - DEPENDENCIES: Task 2

Task 5: IMPLEMENT detectLongChains() helper (non-blocking warnings)
  - CREATE: detectLongChains(graph: DependencyGraph, threshold: number): LongChainInfo[]
  - TRAVERSE: Each path to find maximum depth
  - RETURN: Array of chains exceeding threshold depth
  - DEFAULT: threshold = 5 levels
  - LOG: Warning for each long chain found
  - DEPENDENCIES: Task 2

Task 6: IMPLEMENT main detectCircularDeps() function
  - CREATE: detectCircularDeps(backlog: Backlog): void
  - CALL: buildDependencyGraph() to build adjacency list
  - CALL: detectSelfDependencies() - throw if found
  - CALL: detectCycleDFS() - throw if cycle found
  - CALL: detectLongChains() - log warnings (non-blocking)
  - THROW: ValidationError with cycle path if cycle detected
  - DEPENDENCIES: Task 2, Task 3, Task 4, Task 5

Task 7: ADD new error code to error hierarchy
  - MODIFY: src/utils/errors.ts
  - ADD: PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY to ErrorCodes const
  - VALUE: 'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY'
  - PATTERN: Follow existing error code naming convention
  - DEPENDENCIES: Task 1 (need to know what error code to use)

Task 8: INTEGRATE validator in SessionManager.initialize()
  - MODIFY: src/core/session-manager.ts initialize() method
  - IMPORT: detectCircularDeps from '../core/dependency-validator.js'
  - IMPORT: ValidationError from '../utils/errors.js'
  - CALL: detectCircularDeps(this.#currentSession.taskRegistry)
  - CATCH: ValidationError and re-throw with additional context
  - LOCATION: After backlog is loaded/created (after line 252)
  - DEPENDENCIES: Task 6, Task 7

Task 9: CREATE unit tests for cycle detection
  - CREATE: tests/unit/core/dependency-validator.test.ts
  - TEST: Simple cycle (A → B → A)
  - TEST: Complex cycle (A → B → C → A)
  - TEST: Self-dependency (A → A)
  - TEST: No cycle (DAG - directed acyclic graph)
  - TEST: Multiple disconnected components
  - TEST: Long chain detection (>5 levels)
  - TEST: Empty graph
  - TEST: Single task with no dependencies
  - PATTERN: Follow existing test structure in tests/unit/core/
  - COVERAGE: Target 100% for dependency-validator.ts
  - DEPENDENCIES: All previous tasks complete

Task 10: UPDATE SessionManager tests for validation
  - MODIFY: tests/unit/core/session-manager.test.ts
  - ADD: Test case for valid backlog (no cycles)
  - ADD: Test case for backlog with circular dependency
  - ADD: Test case for backlog with self-dependency
  - VERIFY: ValidationError thrown with correct cycle path
  - VERIFY: Long chain warnings logged
  - PATTERN: Follow existing SessionManager test patterns
  - DEPENDENCIES: Task 8, Task 9
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// TASK 2: BUILD DEPENDENCY GRAPH
// ============================================================================
import { getAllSubtasks, type Subtask } from '../utils/task-utils.js';

function buildDependencyGraph(subtasks: Subtask[]): DependencyGraph {
  const graph: DependencyGraph = {};

  for (const subtask of subtasks) {
    // Build adjacency list: taskId -> array of dependency IDs
    graph[subtask.id] = subtask.dependencies;
  }

  return graph;
}

// ============================================================================
// TASK 3: DETECT SELF-DEPENDENCIES
// ============================================================================
function detectSelfDependencies(graph: DependencyGraph): string[] {
  const selfDependencies: string[] = [];

  for (const [taskId, deps] of Object.entries(graph)) {
    // GOTCHA: Check if task depends on itself (A → A)
    if (deps.includes(taskId)) {
      selfDependencies.push(taskId);
    }
  }

  return selfDependencies;
}

// ============================================================================
// TASK 4: DFS CYCLE DETECTION WITH THREE-COLOR MARKING
// ============================================================================
enum NodeState {
  UNVISITED = 0,  // White - never seen
  VISITING = 1,   // Gray - in current recursion stack
  VISITED = 2     // Black - fully explored
}

function detectCycleDFS(graph: DependencyGraph): CycleDetectionResult {
  const state = new Map<string, NodeState>();
  const currentPath: string[] = [];

  // Initialize all nodes as UNVISITED
  for (const nodeId of Object.keys(graph)) {
    state.set(nodeId, NodeState.UNVISITED);
  }

  function dfs(nodeId: string): CycleDetectionResult | null {
    const currentState = state.get(nodeId) ?? NodeState.UNVISITED;

    if (currentState === NodeState.VISITING) {
      // BACK EDGE DETECTED! Node is currently being visited
      const cycleStart = currentPath.indexOf(nodeId);
      const cyclePath = [...currentPath.slice(cycleStart), nodeId];

      return {
        hasCycle: true,
        cyclePath,
        cycleLength: cyclePath.length - 1  // Number of edges
      };
    }

    if (currentState === NodeState.VISITED) {
      // Already fully explored - skip
      return null;
    }

    // Mark as currently visiting (GRAY)
    state.set(nodeId, NodeState.VISITING);
    currentPath.push(nodeId);

    // Explore all dependencies
    for (const depId of (graph[nodeId] || [])) {
      const result = dfs(depId);
      if (result) return result;
    }

    // Mark as fully visited (BLACK)
    state.set(nodeId, NodeState.VISITED);
    currentPath.pop();

    return null;
  }

  // Check all nodes (handles disconnected components)
  for (const nodeId of Object.keys(graph)) {
    if (state.get(nodeId) === NodeState.UNVISITED) {
      const result = dfs(nodeId);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}

// ============================================================================
// TASK 5: DETECT LONG CHAINS (NON-BLOCKING WARNINGS)
// ============================================================================
function detectLongChains(graph: DependencyGraph, threshold: number = 5): LongChainInfo[] {
  const longChains: LongChainInfo[] = [];
  const visited = new Set<string>();

  function findLongestPath(nodeId: string, currentDepth: number, path: string[]): void {
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    path.push(nodeId);

    if (currentDepth > threshold) {
      longChains.push({
        taskId: path[0],
        depth: currentDepth,
        chain: [...path]
      });
    }

    // Recurse through dependencies
    for (const depId of (graph[nodeId] || [])) {
      findLongestPath(depId, currentDepth + 1, path);
    }

    path.pop();
  }

  for (const nodeId of Object.keys(graph)) {
    if (!visited.has(nodeId)) {
      findLongestPath(nodeId, 1, []);
    }
  }

  return longChains;
}

// ============================================================================
// TASK 6: MAIN DETECT CIRCULAR DEPENDENCIES FUNCTION
// ============================================================================
import { ValidationError, ErrorCodes } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger('DependencyValidator');

export function detectCircularDeps(backlog: Backlog): void {
  // Step 1: Build dependency graph
  const allSubtasks = getAllSubtasks(backlog);
  const graph = buildDependencyGraph(allSubtasks);

  // Step 2: Check for self-dependencies (fail fast)
  const selfDeps = detectSelfDependencies(graph);
  if (selfDeps.length > 0) {
    const cyclePath = [selfDeps[0], selfDeps[0]];  // A → A
    throw new ValidationError(
      `Task ${selfDeps[0]} depends on itself`,
      {
        taskId: selfDeps[0],
        cyclePath,
        suggestion: `Remove ${selfDeps[0]} from its own dependencies array`
      },
      ErrorCodes.PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY
    );
  }

  // Step 3: Detect cycles using DFS
  const cycleResult = detectCycleDFS(graph);
  if (cycleResult.hasCycle && cycleResult.cyclePath) {
    const pathStr = cycleResult.cyclePath.join(' → ');
    throw new ValidationError(
      `Circular dependency detected: ${pathStr}`,
      {
        cyclePath: cycleResult.cyclePath,
        cycleLength: cycleResult.cycleLength,
        suggestion: 'Remove one of the dependencies in the cycle to break the circular reference'
      },
      ErrorCodes.PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY
    );
  }

  // Step 4: Warn about long chains (non-blocking)
  const longChains = detectLongChains(graph, 5);
  for (const chain of longChains) {
    logger.warn(
      {
        taskId: chain.taskId,
        depth: chain.depth,
        chain: chain.chain
      },
      `Long dependency chain detected (${chain.depth} levels)`
    );
  }
}

// ============================================================================
// TASK 8: SESSIONMANAGER INTEGRATION
// ============================================================================
// In src/core/session-manager.ts
import { detectCircularDeps } from '../core/dependency-validator.js';
import { ValidationError, ErrorCodes } from '../utils/errors.js';

async initialize(): Promise<void> {
  // ... existing code for PRD loading and backlog creation ...

  // After backlog is created/loaded (after line 252)
  try {
    detectCircularDeps(this.#currentSession.taskRegistry);
    this.logger.info('[SessionManager] Dependency validation passed');
  } catch (error) {
    if (error instanceof ValidationError) {
      this.logger.error(
        {
          cyclePath: error.context?.cyclePath,
          code: error.code
        },
        '[SessionManager] Circular dependency detected'
      );
      throw error;  // Re-throw with context
    }
    throw error;  // Re-throw other errors
  }

  // ... continue with rest of initialization ...
}

// ============================================================================
// ERROR CODE ADDITION (Task 7)
// ============================================================================
// In src/utils/errors.ts
export const ErrorCodes = {
  // ... existing error codes ...

  // Validation errors
  PIPELINE_VALIDATION_INVALID_INPUT: 'PIPELINE_VALIDATION_INVALID_INPUT',
  PIPELINE_VALIDATION_MISSING_FIELD: 'PIPELINE_VALIDATION_MISSING_FIELD',
  PIPELINE_VALIDATION_SCHEMA_FAILED: 'PIPELINE_VALIDATION_SCHEMA_FAILED',
  PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY: 'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY',  // NEW
} as const;
```

### Integration Points

```yaml
SESSION_MANAGER:
  - modify: src/core/session-manager.ts
  - method: initialize()
  - import: "import { detectCircularDeps } from '../core/dependency-validator.js'"
  - call: 'detectCircularDeps(this.#currentSession.taskRegistry)'
  - location: After backlog is loaded/created (after line 252)
  - catch: ValidationError and log with cycle path context

ERROR_HIERARCHY:
  - modify: src/utils/errors.ts
  - add: PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY to ErrorCodes
  - pattern: "throw new ValidationError('message', { cyclePath, suggestion }, errorCode)"

TASK_UTILS:
  - import from: src/utils/task-utils.ts
  - pattern: "import { getAllSubtasks } from '../utils/task-utils.js'"
  - use: Extract all Subtask objects from backlog

LOGGER:
  - import from: src/utils/logger.ts
  - pattern: "import { getLogger } from '../utils/logger.js'"
  - use: getLogger('DependencyValidator') for consistent log context
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating dependency-validator.ts
npm run lint -- src/core/dependency-validator.ts --fix
npm run type-check
npm run format

# Run after modifying session-manager.ts
npm run lint -- src/core/session-manager.ts --fix
npm run lint -- src/utils/errors.ts --fix

# Project-wide validation
npm run lint
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test dependency validator
npm test -- tests/unit/core/dependency-validator.test.ts --run

# Test SessionManager integration
npm test -- tests/unit/core/session-manager.test.ts --run

# Full test suite for core module
npm test -- tests/unit/core/ --run

# Coverage validation
npm test -- tests/unit/ --run --coverage

# Expected: All tests pass, 100% coverage for dependency-validator.ts
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the project
npm run build

# Test with valid backlog (no cycles)
node dist/index.js --prd PRD.md
# Expected: Pipeline proceeds normally, dependency validation passes

# Test with circular dependency backlog
# Create test backlog with cycle
cat > /tmp/test-cycle-backlog.json << 'EOF'
{
  "backlog": [{
    "id": "P1",
    "type": "Phase",
    "title": "Test Phase",
    "status": "Planned",
    "description": "Test",
    "milestones": [{
      "id": "P1.M1",
      "type": "Milestone",
      "title": "Test Milestone",
      "status": "Planned",
      "description": "Test",
      "tasks": [{
        "id": "P1.M1.T1",
        "type": "Task",
        "title": "Test Task",
        "status": "Planned",
        "description": "Test",
        "subtasks": [
          {
            "id": "P1.M1.T1.S1",
            "type": "Subtask",
            "title": "Task A",
            "status": "Planned",
            "story_points": 1,
            "dependencies": ["P1.M1.T1.S2"],
            "context_scope": "Test"
          },
          {
            "id": "P1.M1.T1.S2",
            "type": "Subtask",
            "title": "Task B",
            "status": "Planned",
            "story_points": 1,
            "dependencies": ["P1.M1.T1.S1"],
            "context_scope": "Test"
          }
        ]
      }]
    }]
  }]
}
EOF

node dist/index.js --backlog /tmp/test-cycle-backlog.json
# Expected: ValidationError thrown with cycle path

# Test with self-dependency
cat > /tmp/test-self-dep-backlog.json << 'EOF'
{
  "backlog": [{
    "id": "P1",
    "type": "Phase",
    "title": "Test Phase",
    "status": "Planned",
    "description": "Test",
    "milestones": [{
      "id": "P1.M1",
      "type": "Milestone",
      "title": "Test Milestone",
      "status": "Planned",
      "description": "Test",
      "tasks": [{
        "id": "P1.M1.T1",
        "type": "Task",
        "title": "Test Task",
        "status": "Planned",
        "description": "Test",
        "subtasks": [{
          "id": "P1.M1.T1.S1",
          "type": "Subtask",
          "title": "Self Dep Task",
          "status": "Planned",
          "story_points": 1,
          "dependencies": ["P1.M1.T1.S1"],
          "context_scope": "Test"
        }]
      }]
    }]
  }]
}
EOF

node dist/index.js --backlog /tmp/test-self-dep-backlog.json
# Expected: ValidationError thrown for self-dependency

# Expected: All integration tests pass, validation works as designed
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test error message formatting with visual output
node dist/index.js --backlog /tmp/test-cycle-backlog.json 2>&1 | grep -E "(Circular dependency|→)"
# Expected: Formatted error with cycle path and arrows

# Test long chain warning (non-blocking)
cat > /tmp/test-long-chain-backlog.json << 'EOF'
{
  "backlog": [{
    "id": "P1",
    "type": "Phase",
    "title": "Test Phase",
    "status": "Planned",
    "description": "Test",
    "milestones": [{
      "id": "P1.M1",
      "type": "Milestone",
      "title": "Test Milestone",
      "status": "Planned",
      "description": "Test",
      "tasks": [{
        "id": "P1.M1.T1",
        "type": "Task",
        "title": "Test Task",
        "status": "Planned",
        "description": "Test",
        "subtasks": [
          {"id": "S1", "type": "Subtask", "title": "S1", "status": "Planned", "story_points": 1, "dependencies": ["S2"], "context_scope": "T"},
          {"id": "S2", "type": "Subtask", "title": "S2", "status": "Planned", "story_points": 1, "dependencies": ["S3"], "context_scope": "T"},
          {"id": "S3", "type": "Subtask", "title": "S3", "status": "Planned", "story_points": 1, "dependencies": ["S4"], "context_scope": "T"},
          {"id": "S4", "type": "Subtask", "title": "S4", "status": "Planned", "story_points": 1, "dependencies": ["S5"], "context_scope": "T"},
          {"id": "S5", "type": "Subtask", "title": "S5", "status": "Planned", "story_points": 1, "dependencies": ["S6"], "context_scope": "T"},
          {"id": "S6", "type": "Subtask", "title": "S6", "status": "Planned", "story_points": 1, "dependencies": [], "context_scope": "T"}
        ]
      }]
    }]
  }]
}
EOF

node dist/index.js --backlog /tmp/test-long-chain-backlog.json 2>&1 | grep -i "long dependency"
# Expected: Warning logged for long chain, but pipeline continues

# Test disconnected components (multiple independent graphs)
cat > /tmp/test-disconnected-backlog.json << 'EOF'
{
  "backlog": [{
    "id": "P1",
    "type": "Phase",
    "title": "Test Phase",
    "status": "Planned",
    "description": "Test",
    "milestones": [
      {
        "id": "P1.M1",
        "type": "Milestone",
        "title": "Component 1",
        "status": "Planned",
        "description": "Test",
        "tasks": [{
          "id": "P1.M1.T1",
          "type": "Task",
          "title": "Task 1",
          "status": "Planned",
          "description": "Test",
          "subtasks": [{
            "id": "P1.M1.T1.S1",
            "type": "Subtask",
            "title": "S1",
            "status": "Planned",
            "story_points": 1,
            "dependencies": [],
            "context_scope": "T"
          }]
        }]
      },
      {
        "id": "P1.M2",
        "type": "Milestone",
        "title": "Component 2 (has cycle)",
        "status": "Planned",
        "description": "Test",
        "tasks": [{
          "id": "P1.M2.T1",
          "type": "Task",
          "title": "Task 2",
          "status": "Planned",
          "description": "Test",
          "subtasks": [
            {"id": "P1.M2.T1.S1", "type": "Subtask", "title": "A", "status": "Planned", "story_points": 1, "dependencies": ["P1.M2.T1.S2"], "context_scope": "T"},
            {"id": "P1.M2.T1.S2", "type": "Subtask", "title": "B", "status": "Planned", "story_points": 1, "dependencies": ["P1.M2.T1.S1"], "context_scope": "T"}
          ]
        }]
      }
    ]
  }]
}
EOF

node dist/index.js --backlog /tmp/test-disconnected-backlog.json
# Expected: Cycle detected in component 2, error thrown with correct path

# Test cycle path reconstruction accuracy
node dist/index.js --backlog /tmp/test-cycle-backlog.json 2>&1 | grep -o "P1\.M1\.T1\.S[12] → P1\.M1\.T1\.S[12] → P1\.M1\.T1\.S[12]"
# Expected: Exact cycle path: S1 → S2 → S1

# Test with complex multi-level cycle
cat > /tmp/test-complex-cycle-backlog.json << 'EOF'
{
  "backlog": [{
    "id": "P1",
    "type": "Phase",
    "title": "Test Phase",
    "status": "Planned",
    "description": "Test",
    "milestones": [{
      "id": "P1.M1",
      "type": "Milestone",
      "title": "Test Milestone",
      "status": "Planned",
      "description": "Test",
      "tasks": [{
        "id": "P1.M1.T1",
        "type": "Task",
        "title": "Test Task",
        "status": "Planned",
        "description": "Test",
        "subtasks": [
          {"id": "S1", "type": "Subtask", "title": "S1", "status": "Planned", "story_points": 1, "dependencies": ["S2"], "context_scope": "T"},
          {"id": "S2", "type": "Subtask", "title": "S2", "status": "Planned", "story_points": 1, "dependencies": ["S3"], "context_scope": "T"},
          {"id": "S3", "type": "Subtask", "title": "S3", "status": "Planned", "story_points": 1, "dependencies": ["S4"], "context_scope": "T"},
          {"id": "S4", "type": "Subtask", "title": "S4", "status": "Planned", "story_points": 1, "dependencies": ["S1"], "context_scope": "T"}
        ]
      }]
    }]
  }]
}
EOF

node dist/index.js --backlog /tmp/test-complex-cycle-backlog.json 2>&1 | grep "Circular dependency"
# Expected: 4-node cycle detected: S1 → S2 → S3 → S4 → S1

# Expected: All creative validations pass, edge cases handled correctly
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/ --run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] detectCircularDeps() function detects circular dependencies
- [ ] DFS algorithm with three-color marking works correctly
- [ ] Cycle path is reconstructed accurately (e.g., ['A', 'B', 'A'])
- [ ] Self-dependencies (A → A) detected immediately
- [ ] Multiple disconnected components all validated
- [ ] Long chains (>5 levels) trigger warnings but don't block
- [ ] ValidationError thrown with cycle path in context
- [ ] SessionManager.initialize() calls validator
- [ ] Error messages include cycle path and suggestions

### Code Quality Validation

- [ ] Follows existing codebase patterns (error usage, logger, imports)
- [ ] File placement matches desired codebase tree
- [ ] Uses getAllSubtasks() from task-utils.ts
- [ ] Uses ValidationError from error hierarchy
- [ ] Uses getLogger() for structured logging
- [ ] Three-color marking enum properly defined
- [ ] Cycle reconstruction uses currentPath tracking

### Documentation & Deployment

- [ ] Code is self-documenting with clear JSDoc comments
- [ ] Logs are informative but not verbose
- [ ] Error messages show cycle path visually (arrows)
- [ ] Warnings include task ID and chain depth
- [ ] Error code added to ErrorCodes constant

---

## Anti-Patterns to Avoid

- ❌ Don't manually traverse Phase > Milestone > Task > Subtask - use getAllSubtasks()
- ❌ Don't forget to handle disconnected components - iterate all nodes
- ❌ Don't use generic Error - use ValidationError from error hierarchy
- ❌ Don't skip self-dependency check - check this first before DFS
- ❌ Don't confuse visited set with recursion stack - use three-color marking for clarity
- ❌ Don't throw on long chains - log warnings instead (non-blocking)
- ❌ Don't try to find all cycles - find first one and fail fast
- ❌ Don't forget to validate in both SessionManager paths (new and existing)
- ❌ Don't include cycle detection in TaskOrchestrator - belongs in SessionManager.initialize()
- ❌ Don't validate dependency existence - that's a separate concern, focus on cycles only
