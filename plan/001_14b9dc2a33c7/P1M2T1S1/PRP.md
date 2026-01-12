# Product Requirement Prompt (PRP): TypeScript Interfaces for Task Hierarchy

**PRP ID**: P1.M2.T1.S1
**Work Item**: Create TypeScript interfaces for task hierarchy
**Story Points**: 2
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create comprehensive TypeScript type definitions for the PRP Pipeline's four-level task hierarchy (Phase > Milestone > Task > Subtask) with proper JSDoc documentation, establishing the foundation for all subsequent task management functionality.

**Deliverable**: `src/core/models.ts` with complete type definitions including:
- `Status` enum (6 states: Planned, Researching, Implementing, Complete, Failed, Obsolete)
- `ItemType` enum (4 types: Phase, Milestone, Task, Subtask)
- `Subtask`, `Task`, `Milestone`, `Phase`, and `Backlog` interfaces
- Comprehensive JSDoc documentation on all exports
- All exports properly typed with zero compilation errors

**Success Definition**:
- All 6 enum values and 5 interfaces are defined and exported
- TypeScript compiles without errors (`tsc --noEmit`)
- All interfaces follow the existing codebase JSDoc patterns
- File placement matches `src/core/models.ts` exactly
- All exports use `readonly` modifiers for immutable properties
- Module can be imported using ESM syntax (`import { ... } from './core/models.js'`)

---

## User Persona

**Target User**: Developer implementing the PRP Pipeline core data structures and subsequent task orchestration logic.

**Use Case**: Before implementing task iteration, dependency resolution, or status tracking (P1.M2.T1.S3, P3.M2), the developer needs type-safe interfaces that define the shape of task data throughout the system.

**User Journey**:
1. Developer imports types from `src/core/models.js`
2. Uses `Backlog` interface to validate `tasks.json` structure
3. Uses `Status` enum for status transitions in task orchestration
4. Uses `ItemType` enum for type narrowing when processing different hierarchy levels

**Pain Points Addressed**:
- **No shared type definitions**: Without interfaces, each module would define its own incompatible types
- **Unclear hierarchy**: Lacking explicit interfaces makes the Phase > Milestone > Task > Subtask relationship implicit
- **No documentation**: JSDoc comments provide IDE autocomplete and inline documentation
- **Status inconsistency**: Enum ensures consistent status values across the codebase

---

## Why

- **Foundation for task orchestration**: All subsequent work (P1.M2.T1.S3 utilities, P3.M2 Task Orchestrator, P3.M1 Session Manager) depends on these type definitions
- **Type safety for tasks.json**: The Architect Agent (P2.M2.T1) will generate backlog JSON that must conform to these interfaces
- **Enables status tracking**: The `Status` enum is used by Task Orchestrator to track lifecycle state
- **Prevents data corruption**: Immutable (`readonly`) properties prevent accidental mutation of task state
- **Self-documenting code**: JSDoc provides IDE tooltips and generated documentation
- **Integration with existing patterns**: Follows the established patterns from `src/config/types.ts`

---

## What

Create a TypeScript module that defines the complete type hierarchy for task management:

### Data Models to Define

```typescript
// 1. Status Enum (6 values)
type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'

// 2. ItemType Enum (4 values)
type ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask'

// 3. Subtask Interface (leaf nodes)
interface Subtask {
  readonly id: string;           // Format: P1.M1.T1.S1
  readonly type: 'Subtask';
  readonly title: string;
  readonly status: Status;
  readonly story_points: number;
  readonly dependencies: string[];  // Array of subtask IDs
  readonly context_scope: string;
}

// 4. Task Interface (contains subtasks)
interface Task {
  readonly id: string;
  readonly type: 'Task';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly subtasks: Subtask[];
}

// 5. Milestone Interface (contains tasks)
interface Milestone {
  readonly id: string;
  readonly type: 'Milestone';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly tasks: Task[];
}

// 6. Phase Interface (contains milestones)
interface Phase {
  readonly id: string;
  readonly type: 'Phase';
  readonly title: string;
  readonly status: Status;
  readonly description: string;
  readonly milestones: Milestone[];
}

// 7. Backlog Interface (root container)
interface Backlog {
  readonly backlog: Phase[];
}
```

### Success Criteria

- [ ] `Status` type alias defined with all 6 literal values
- [ ] `ItemType` type alias defined with all 4 literal values
- [ ] `Subtask` interface with `id`, `type`, `title`, `status`, `story_points`, `dependencies`, `context_scope`
- [ ] `Task` interface with `id`, `type`, `title`, `status`, `description`, `subtasks`
- [ ] `Milestone` interface with `id`, `type`, `title`, `status`, `description`, `tasks`
- [ ] `Phase` interface with `id`, `type`, `title`, `status`, `description`, `milestones`
- [ ] `Backlog` interface with `backlog` property containing `Phase[]`
- [ ] All properties use `readonly` modifier
- [ ] All exports have comprehensive JSDoc comments
- [ ] `tsc --noEmit` completes without errors
- [ ] File saved at `src/core/models.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes - this PRP provides:
- Exact file location and module structure
- Complete interface definitions with all property names and types
- JSDoc patterns to follow from existing codebase
- TypeScript configuration specifics (strict mode, ESM)
- Validation commands for verification

### Documentation & References

```yaml
# MUST READ - Critical architecture documentation

- file: plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Defines the exact task hierarchy structure used in PRD (lines 98-156)
  critical: The Task Hierarchy JSON Schema shows the exact structure needed
  section: Lines 98-156 (Task Hierarchy JSON Schema)

- file: plan/001_14b9dc2a33c7/P1M2T1S1/research/typescript_interfaces.md
  why: Best practices for TypeScript interfaces, readonly modifiers, JSDoc patterns
  pattern: Follow the naming conventions and JSDoc examples (lines 525-586)
  gotcha: Use PascalCase for types, camelCase for properties, readonly for immutable fields

- file: plan/001_14b9dc2a33c7/P1M2T1S1/research/task_hierarchy_patterns.md
  why: Open source examples of task hierarchy implementations
  pattern: Status enum patterns (lines 114-228), dependency arrays (lines 234-344)
  gotcha: The project uses a custom 6-status enum, not the standard GitHub/Jira patterns

- file: plan/001_14b9dc2a33c7/P1M2T1S1/research/zod_patterns.md
  why: Zod integration patterns for the NEXT subtask (P1.M2.T1.S2)
  context: This subtask defines interfaces, Zod schemas will be created in P1.M2.T1.S2
  gotcha: Don't create Zod schemas in this PRP - only TypeScript interfaces

- file: src/config/types.ts
  why: Existing pattern for JSDoc documentation and type definitions in this codebase
  pattern: Follow the exact JSDoc structure with @remarks, @example tags
  gotcha: Use the same module-level JSDoc comment format

- url: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases
  why: Type alias syntax for Status and ItemType enums
  critical: Use union of literal types, not native TypeScript enums

- url: https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties
  why: Readonly modifier syntax for immutable properties
  pattern: readonly propertyName: type

- url: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
  why: JSDoc tags supported by TypeScript
  pattern: Use @remarks, @example, @see for comprehensive documentation
```

### Current Codebase Tree

```bash
.
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/
│       │   ├── system_context.md         # Task hierarchy definition
│       │   ├── groundswell_api.md        # Groundswell patterns
│       │   └── environment_config.md     # Environment config
│       ├── P1M2T1S1/
│       │   └── research/                 # Research documents
│       │       ├── typescript_interfaces.md
│       │       ├── zod_patterns.md
│       │       └── task_hierarchy_patterns.md
│       └── tasks.json                    # Task hierarchy instance
├── src/
│   ├── agents/                           # (empty - future)
│   ├── config/                           # Environment configuration
│   │   ├── constants.ts
│   │   ├── environment.ts
│   │   └── types.ts                      # REFERENCE: JSDoc patterns
│   ├── core/                             # (empty - TARGET DIRECTORY)
│   ├── utils/                            # (empty - future)
│   └── workflows/                        # Hello-world workflow
├── tests/
│   ├── unit/config/                      # Unit test patterns
│   └── integration/                      # Integration test patterns
├── package.json                          # Zod 3.22.4 installed
├── tsconfig.json                         # ES2022, NodeNext, strict mode
└── vitest.config.ts                      # Test configuration
```

### Desired Codebase Tree with Files to be Added

```bash
src/
└── core/
    └── models.ts                         # NEW: Task hierarchy type definitions (this PRP)
        # Exports:
        # - Status (type alias)
        # - ItemType (type alias)
        # - Subtask (interface)
        # - Task (interface)
        # - Milestone (interface)
        # - Phase (interface)
        # - Backlog (interface)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: This project uses "type": "module" in package.json (ESM)
// Import statements MUST use .js extension:
// import { Status } from './core/models.js';  // CORRECT
// import { Status } from './core/models';    // WRONG - runtime error

// CRITICAL: TypeScript target is ES2022 with NodeNext module resolution
// Use type aliases for enums, NOT native TypeScript enums
type Status = 'Planned' | 'Researching' | ...;  // CORRECT
enum Status { Planned, Researching, ... }       // WRONG - not consistent with codebase

// CRITICAL: TypeScript strict mode is enabled
// All properties must have explicit type annotations
// No implicit any types allowed

// CRITICAL: Use readonly modifier for ALL properties
// Task data should be treated as immutable
interface Subtask {
  readonly id: string;     // CORRECT - immutable
  id: string;              // WRONG - allows mutation

// GOTCHA: Follow existing JSDoc patterns from src/config/types.ts
// Use @remarks for additional context
// Use @example with executable code
// Use @see for cross-references

// GOTCHA: Interface naming - NO "I" prefix
interface Subtask { }     // CORRECT
interface ISubtask { }    // WRONG - not following codebase conventions

// GOTCHA: Property naming - camelCase for properties
story_points: number;    // CORRECT
storyPoints: number;     // WRONG - inconsistent with system_context.md

// GOTCHA: The type discriminator field name
// system_context.md uses "type" field (line 120)
type: 'Subtask';         // CORRECT
kind: 'Subtask';         // WRONG - inconsistent with architecture

// GOTCHA: dependencies array uses string IDs, not object references
readonly dependencies: string[];   // CORRECT
readonly dependencies: Subtask[];  // WRONG - causes circular reference issues
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Type definitions for task hierarchy models
 *
 * @module core/models
 *
 * @remarks
 * Defines the four-level task hierarchy used throughout the PRP Pipeline:
 * Phase > Milestone > Task > Subtask. All types use readonly properties
 * to ensure immutability and prevent accidental state mutation.
 *
 * @example
 * ```typescript
 * import { Backlog, Status } from './core/models.js';
 *
 * const backlog: Backlog = {
 *   backlog: [
 *     {
 *       id: 'P1',
 *       type: 'Phase',
 *       title: 'Phase 1: Foundation',
 *       status: 'Planned',
 *       description: 'Project initialization',
 *       milestones: []
 *     }
 *   ]
 * };
 * ```
 */

/**
 * Lifecycle status of a work item in the PRP Pipeline
 *
 * @remarks
 * Each work item progresses through these states as it moves from
 * conception to completion. The Architect Agent creates items in
 * 'Planned' status, and the Task Orchestrator updates status as
 * work progresses.
 *
 * - `Planned`: Initial state after Architect Agent generates the backlog
 * - `Researching`: Research Agent is gathering context for PRP generation
 * - `Implementing`: Coder Agent is actively implementing the PRP
 * - `Complete`: All validation gates passed, work is done
 * - `Failed`: Implementation failed, requires retry or manual intervention
 * - `Obsolete`: Work item was deprecated or replaced (e.g., delta session)
 *
 * @example
 * ```typescript
 * import { Status } from './core/models.js';
 *
 * const currentStatus: Status = 'Implementing';
 * ```
 */
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

/**
 * Type discriminator for the four levels of task hierarchy
 *
 * @remarks
 * Each work item has a `type` field that indicates its level in the
 * hierarchy. This enables type narrowing when processing heterogeneous
 * collections of work items.
 *
 * @example
 * ```typescript
 * import { ItemType } from './core/models.js';
 *
 * const type: ItemType = 'Subtask';
 * ```
 */
export type ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask';

/**
 * Leaf node in the task hierarchy - the smallest unit of work
 *
 * @remarks
 * Subtasks represent atomic work items that can be completed in a single
 * implementation pass. Each subtask has a PRP (Product Requirement Prompt)
 * generated by the Researcher Agent and executed by the Coder Agent.
 *
 * The `context_scope` field contains critical instructions for the Coder Agent,
 * defining what code it can access and modify during implementation.
 *
 * @see {@link https://github.com/anthropics/claude-code/blob/main/PRP-TEMPLATE.md | PRP Template}
 *
 * @example
 * ```typescript
 * import { Subtask, Status } from './core/models.js';
 *
 * const subtask: Subtask = {
 *   id: 'P1.M1.T1.S1',
 *   type: 'Subtask',
 *   title: 'Create TypeScript interfaces for task hierarchy',
 *   status: 'Planned',
 *   story_points: 2,
 *   dependencies: [],
 *   context_scope: 'Strict scope: src/core/ directory only'
 * };
 * ```
 */
export interface Subtask {
  /**
   * Unique identifier following dot-notation hierarchy
   *
   * @format P{phase}.M{milestone}.T{task}.S{subtask}
   * @example 'P1.M1.T1.S1'
   */
  readonly id: string;

  /** Type discriminator for type narrowing */
  readonly type: 'Subtask';

  /**
   * Human-readable title of the work item
   *
   * @minLength 1
   * @maxLength 200
   */
  readonly title: string;

  /** Current lifecycle status */
  readonly status: Status;

  /**
   * Estimated complexity in Fibonacci story points
   *
   * @remarks
   * Uses the Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21
   * Larger values indicate higher uncertainty and complexity
   *
   * @min 1
   * @max 21
   */
  readonly story_points: number;

  /**
   * IDs of subtasks that must complete before this one can start
   *
   * @remarks
   * The Task Orchestrator uses this array to enforce dependency ordering.
   * Empty array means no dependencies.
   *
   * @example ['P1.M1.T1.S1', 'P1.M1.T1.S2']
   */
  readonly dependencies: string[];

  /**
   * Strict instructions for isolated development
   *
   * @remarks
   * Defines INPUT (what to use), OUTPUT (what to produce), and MOCKING
   * (what external services to fake). This context is injected into the
   * Coder Agent's prompt.
   *
   * @example
   * ```
   * INPUT: TaskRegistry from dependency P1.M2.T1.S1
   * OUTPUT: TaskService.create() method
   * MOCKING: Groundswell agents, file system operations
   * ```
   */
  readonly context_scope: string;
}

/**
 * Container for related subtasks forming a coherent unit of work
 *
 * @remarks
 * Tasks represent intermediate-level work items that group related subtasks.
 * A Task is typically completed when all its subtasks are Complete.
 *
 * @example
 * ```typescript
 * import { Task, Status } from './core/models.js';
 *
 * const task: Task = {
 *   id: 'P1.M1.T1',
 *   type: 'Task',
 *   title: 'Initialize TypeScript Project',
 *   status: 'Planned',
 *   description: 'Set up package.json, tsconfig.json, and directory structure',
 *   subtasks: [
 *     {
 *       id: 'P1.M1.T1.S1',
 *       type: 'Subtask',
 *       title: 'Initialize package.json',
 *       status: 'Complete',
 *       story_points: 1,
 *       dependencies: [],
 *       context_scope: '...'
 *     }
 *   ]
 * };
 * ```
 */
export interface Task {
  /**
   * Unique identifier following dot-notation hierarchy
   *
   * @format P{phase}.M{milestone}.T{task}
   * @example 'P1.M1.T1'
   */
  readonly id: string;

  /** Type discriminator for type narrowing */
  readonly type: 'Task';

  /** Human-readable title of the work item */
  readonly title: string;

  /** Current lifecycle status */
  readonly status: Status;

  /**
   * Detailed description of the task's objectives
   *
   * @remarks
   * Explains what the task accomplishes and how its subtasks
   * contribute to the overall goal.
   */
  readonly description: string;

  /**
   * Array of subtasks that comprise this task
   *
   * @remarks
   * Tasks contain subtasks, forming a parent-child relationship.
   * The Task Orchestrator processes subtasks sequentially based on
   * dependency ordering within this array.
   */
  readonly subtasks: Subtask[];
}

/**
 * Significant checkpoint or deliverable within a phase
 *
 * @remarks
 * Milestones represent major progress points that group related tasks.
 * They often correspond to deliverable increments or validation gates.
 *
 * @example
 * ```typescript
 * import { Milestone, Status } from './core/models.js';
 *
 * const milestone: Milestone = {
 *   id: 'P1.M1',
 *   type: 'Milestone',
 *   title: 'Project Initialization',
 *   status: 'Complete',
 *   description: 'Foundation setup and environment configuration',
 *   tasks: [ /* ... */ ]
 * };
 * ```
 */
export interface Milestone {
  /**
   * Unique identifier following dot-notation hierarchy
   *
   * @format P{phase}.M{milestone}
   * @example 'P1.M1'
   */
  readonly id: string;

  /** Type discriminator for type narrowing */
  readonly type: 'Milestone';

  /** Human-readable title of the work item */
  readonly title: string;

  /** Current lifecycle status */
  readonly status: Status;

  /**
   * Detailed description of the milestone's objectives
   *
   * @remarks
   * Explains what the milestone accomplishes and what deliverables
   * are expected upon completion.
   */
  readonly description: string;

  /**
   * Array of tasks that comprise this milestone
   *
   * @remarks
   * Milestones contain tasks, forming a parent-child relationship.
   * Tasks are processed based on their internal dependencies.
   */
  readonly tasks: Task[];
}

/**
 * Top-level container representing a major development phase
 *
 * @remarks
 * Phases represent the highest level of organization in the PRP Pipeline.
 * Each phase typically corresponds to a major capability or milestone
 * in the overall product roadmap (e.g., "Foundation", "Core Agent System").
 *
 * @example
 * ```typescript
 * import { Phase, Status } from './core/models.js';
 *
 * const phase: Phase = {
 *   id: 'P1',
 *   type: 'Phase',
 *   title: 'Phase 1: Foundation & Environment Setup',
 *   status: 'Complete',
 *   description: 'Project initialization, environment configuration, and core data structures',
 *   milestones: [ /* ... */ ]
 * };
 * ```
 */
export interface Phase {
  /**
   * Unique identifier for the phase
   *
   * @format P{phase}
   * @example 'P1'
   */
  readonly id: string;

  /** Type discriminator for type narrowing */
  readonly type: 'Phase';

  /** Human-readable title of the work item */
  readonly title: string;

  /** Current lifecycle status */
  readonly status: Status;

  /**
   * Detailed description of the phase's objectives
   *
   * @remarks
   * Explains the overall goals, scope, and expected outcomes
   * for this phase of development.
   */
  readonly description: string;

  /**
   * Array of milestones that comprise this phase
   *
   * @remarks
   * Phases contain milestones, forming the top level of the hierarchy.
   * The PRP Pipeline processes phases sequentially.
   */
  readonly milestones: Milestone[];
}

/**
 * Root container for the entire task backlog
 *
 * @remarks
 * The Backlog interface represents the top-level structure stored in
 * `tasks.json`. It contains an array of Phases, forming the complete
 * hierarchy of work for the PRP Pipeline.
 *
 * The Session Manager loads this structure, and the Task Orchestrator
 * iterates through it to execute work items.
 *
 * @see {@link ./architecture/system_context.md#task-hierarchy-json-schema | System Context}
 *
 * @example
 * ```typescript
 * import { Backlog, Phase } from './core/models.js';
 *
 * const backlog: Backlog = {
 *   backlog: [
 *     {
 *       id: 'P1',
 *       type: 'Phase',
 *       title: 'Phase 1: Foundation',
 *       status: 'Planned',
 *       description: 'Project setup and core data structures',
 *       milestones: [ /* ... */ ]
 *     },
 *     {
 *       id: 'P2',
 *       type: 'Phase',
 *       title: 'Phase 2: Core Agent System',
 *       status: 'Planned',
 *       description: 'Groundswell agent integration and prompt system',
 *       milestones: [ /* ... */ ]
 *     }
 *   ]
 * };
 * ```
 */
export interface Backlog {
  /**
   * Array of phases comprising the complete project backlog
   *
   * @remarks
   * This is the root of the task hierarchy. All phases, milestones,
   * tasks, and subtasks are contained within this array.
   *
   * The Task Orchestrator processes phases sequentially in order,
   * then recursively processes nested items.
   */
  readonly backlog: Phase[];
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/core/models.ts with module header
  - IMPLEMENT: Module-level JSDoc comment explaining the module purpose
  - FOLLOW pattern: src/config/types.ts (module documentation style)
  - NAMING: Use @module tag with path, @remarks for additional context, @example for usage
  - PLACEMENT: src/core/models.ts (new file)
  - DEPENDENCIES: None

Task 2: DEFINE Status type alias
  - IMPLEMENT: type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
  - PATTERN: Use union of literal types (not native enum)
  - NAMING: PascalCase for type name, PascalCase for each literal value
  - DOCUMENTATION: Add comprehensive JSDoc with @remarks explaining each status value
  - PLACEMENT: Add to src/core/models.ts
  - DEPENDENCIES: Task 1 (module header)

Task 3: DEFINE ItemType type alias
  - IMPLEMENT: type ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask'
  - PATTERN: Use union of literal types matching system_context.md
  - NAMING: PascalCase for type name, PascalCase for each literal value
  - DOCUMENTATION: Add JSDoc with @remarks explaining type narrowing usage
  - PLACEMENT: Add to src/core/models.ts after Status
  - DEPENDENCIES: Task 1

Task 4: DEFINE Subtask interface
  - IMPLEMENT: Subtask interface with id, type, title, status, story_points, dependencies, context_scope
  - PATTERN: Use readonly modifier on all properties
  - NAMING: camelCase for properties (story_points not storyPoints)
  - DOCUMENTATION: Comprehensive JSDoc with @remarks, @see, @example
  - PLACEMENT: Add to src/core/models.ts after ItemType
  - DEPENDENCIES: Task 2 (Status type), Task 3 (ItemType)

Task 5: DEFINE Task interface
  - IMPLEMENT: Task interface with id, type, title, status, description, subtasks
  - PATTERN: Use readonly modifier, subtasks property is Subtask[]
  - NAMING: camelCase for properties
  - DOCUMENTATION: JSDoc with @remarks, @example
  - PLACEMENT: Add to src/core/models.ts after Subtask
  - DEPENDENCIES: Task 4 (Subtask interface)

Task 6: DEFINE Milestone interface
  - IMPLEMENT: Milestone interface with id, type, title, status, description, tasks
  - PATTERN: Use readonly modifier, tasks property is Task[]
  - NAMING: camelCase for properties
  - DOCUMENTATION: JSDoc with @remarks, @example
  - PLACEMENT: Add to src/core/models.ts after Task
  - DEPENDENCIES: Task 5 (Task interface)

Task 7: DEFINE Phase interface
  - IMPLEMENT: Phase interface with id, type, title, status, description, milestones
  - PATTERN: Use readonly modifier, milestones property is Milestone[]
  - NAMING: camelCase for properties
  - DOCUMENTATION: JSDoc with @remarks, @example
  - PLACEMENT: Add to src/core/models.ts after Milestone
  - DEPENDENCIES: Task 6 (Milestone interface)

Task 8: DEFINE Backlog interface
  - IMPLEMENT: Backlog interface with backlog property containing Phase[]
  - PATTERN: Use readonly modifier, backlog property is Phase[]
  - NAMING: lowercase 'backlog' for property name (matches tasks.json structure)
  - DOCUMENTATION: JSDoc with @remarks, @see, @example
  - PLACEMENT: Add to src/core/models.ts after Phase
  - DEPENDENCIES: Task 7 (Phase interface)

Task 9: VERIFY TypeScript compilation
  - RUN: npx tsc --noEmit src/core/models.ts
  - EXPECTED: Zero errors
  - IF ERRORS: Check for missing imports, incorrect property types, JSDoc syntax
  - VALIDATION: All types are correctly defined, no implicit any
  - DEPENDENCIES: Task 8 (all interfaces defined)

Task 10: VERIFY module can be imported
  - CREATE: tests/integration/models-import-test.ts
  - CONTENT: import { Backlog, Status, ItemType, Subtask, Task, Milestone, Phase } from '../src/core/models.js';
  - RUN: npx tsx tests/integration/models-import-test.ts
  - EXPECTED: No runtime errors, all types are importable
  - DEPENDENCIES: Task 9
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL PATTERNS - Follow these for consistency
// ============================================================================

// PATTERN 1: Module-level JSDoc documentation
/**
 * Type definitions for task hierarchy models
 *
 * @module core/models
 *
 * @remarks
 * [Explain the module's purpose and what it contains]
 *
 * @example
 * ```typescript
 * import { Backlog } from './core/models.js';
 * const backlog: Backlog = { ... };
 * ```
 */

// PATTERN 2: Type alias for enums (NOT native TypeScript enums)
// GOOD:
export type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete';

// BAD:
export enum Status { Planned, Researching, Implementing, Complete, Failed, Obsolete }

// PATTERN 3: Interface with readonly properties
export interface Subtask {
  readonly id: string;        // Immutable - identity never changes
  readonly title: string;     // Immutable - title is part of the contract
  readonly status: Status;    // Immutable - status updates create new objects
  readonly story_points: number;
  readonly dependencies: string[];
  readonly context_scope: string;
}

// PATTERN 4: JSDoc comment structure (use for ALL exports)
/**
 * [One-line summary of what this type represents]
 *
 * @remarks
 * [Additional context about usage, constraints, or relationships]
 * [May include multiple paragraphs]
 *
 * @example
 * ```typescript
 * import { Type } from './core/models.js';
 * const value: Type = { ... };
 * ```
 */
export interface Type {
  // Properties...
}

// PATTERN 5: Property-specific JSDoc comments
export interface Subtask {
  /**
   * Unique identifier following dot-notation hierarchy
   *
   * @format P{phase}.M{milestone}.T{task}.S{subtask}
   * @example 'P1.M1.T1.S1'
   */
  readonly id: string;

  /** Type discriminator for type narrowing */
  readonly type: 'Subtask';

  /**
   * Estimated complexity in Fibonacci story points
   *
   * @remarks
   * Uses the Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21
   * Larger values indicate higher uncertainty and complexity
   *
   * @min 1
   * @max 21
   */
  readonly story_points: number;
}

// PATTERN 6: Hierarchical interfaces (parent contains child arrays)
export interface Task {
  readonly subtasks: Subtask[];  // Array of child type
}

export interface Milestone {
  readonly tasks: Task[];  // Array of child type
}

// PATTERN 7: Type discriminator field
// All interfaces have a 'type' field for discriminated unions
export interface Subtask {
  readonly type: 'Subtask';  // Literal type for discrimination
}

// GOTCHA: ESM import syntax
// Imports MUST include .js extension
import { Backlog } from './core/models.js';  // CORRECT
import { Backlog } from './core/models';    // WRONG - runtime error

// GOTCHA: Property naming matches system_context.md
story_points: number;   // CORRECT - matches JSON schema
storyPoints: number;    // WRONG - inconsistent with architecture

// GOTCHA: Type discriminator field name
type: 'Subtask';    // CORRECT - matches system_context.md
kind: 'Subtask';    // WRONG - inconsistent with architecture

// GOTCHA: Dependencies use string IDs, not object references
readonly dependencies: string[];    // CORRECT - avoids circular reference
readonly dependencies: Subtask[];   // WRONG - causes circular reference

// GOTCHA: Use readonly modifier consistently
readonly id: string;   // CORRECT - prevents mutation
id: string;            // WRONG - allows accidental mutation
```

### Integration Points

```yaml
FUTURE_INTEGRATION (not part of this PRP):
  - P1.M2.T1.S2: Create Zod schemas matching these interfaces for validation
  - P1.M2.T1.S3: Create task hierarchy helper utilities using these types
  - P2.M2.T1: Architect Agent uses Backlog interface for structured output
  - P3.M1: Session Manager loads tasks.json and validates against Backlog interface
  - P3.M2: Task Orchestrator uses Status enum for state transitions

FILES_REFERENCED:
  - plan/001_14b9dc2a33c7/tasks.json: Instance of Backlog interface
  - plan/001_14b9dc2a33c7/architecture/system_context.md: Schema definition
  - src/config/types.ts: JSDoc documentation pattern to follow
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit src/core/models.ts       # Type check new file
npx tsc --noEmit                           # Full project type check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common errors:
# - TS2307: Cannot find module -> Check import paths include .js extension
# - TS7006: Parameter implicitly has 'any' type -> Add explicit type annotation
# - TS2322: Type 'X' is not assignable to type 'Y' -> Check property types match interface

# Format check (Prettier is configured in P1.M1.T3)
npx prettier --check src/core/models.ts

# If formatting issues exist:
npx prettier --write src/core/models.ts
```

### Level 2: Unit Tests (Component Validation)

```bash
# NOTE: These tests will be created in P1.M2.T1.S3 (next subtask)
# For now, perform manual verification:

# Create manual type validation test
cat > tests/manual/models-type-test.ts << 'EOF'
import {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
  ItemType
} from '../../src/core/models.js';

// Verify Status type works
const status1: Status = 'Planned';
const status2: Status = 'Complete';
// @ts-expect-error - Invalid status should error
const status3: Status = 'Invalid';

// Verify ItemType type works
const type1: ItemType = 'Subtask';
const type2: ItemType = 'Phase';
// @ts-expect-error - Invalid type should error
const type3: ItemType = 'Invalid';

// Verify Subtask interface
const subtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test Subtask',
  status: 'Planned',
  story_points: 2,
  dependencies: ['P1.M1.T1.S0'],
  context_scope: 'Test scope'
};

// Verify Task interface
const task: Task = {
  id: 'P1.M1.T1',
  type: 'Task',
  title: 'Test Task',
  status: 'Planned',
  description: 'Test description',
  subtasks: [subtask]
};

// Verify Milestone interface
const milestone: Milestone = {
  id: 'P1.M1',
  type: 'Milestone',
  title: 'Test Milestone',
  status: 'Planned',
  description: 'Test description',
  tasks: [task]
};

// Verify Phase interface
const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Test Phase',
  status: 'Planned',
  description: 'Test description',
  milestones: [milestone]
};

// Verify Backlog interface
const backlog: Backlog = {
  backlog: [phase]
};

console.log('All type validations passed!');
console.log('Backlog:', JSON.stringify(backlog, null, 2));
EOF

# Run manual type check
npx tsx tests/manual/models-type-test.ts

# Expected: "All type validations passed!" with no TypeScript errors
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify module can be imported with correct ESM syntax
cat > tests/integration/models-esm-test.ts << 'EOF'
// Test ESM import with .js extension
import { Backlog, Status, ItemType } from '../src/core/models.js';

console.log('ESM import successful!');
console.log('Available Status values:', ['Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete']);
console.log('Available ItemType values:', ['Phase', 'Milestone', 'Task', 'Subtask']);
EOF

npx tsx tests/integration/models-esm-test.ts

# Expected: "ESM import successful!" with all values displayed

# Verify TypeScript compilation from a consuming module
cat > tests/integration/models-consumer-test.ts << 'EOF'
import { Backlog, Phase } from '../src/core/models.js';

const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Phase 1',
  status: 'Planned',
  description: 'Test phase',
  milestones: []
};

const backlog: Backlog = {
  backlog: [phase]
};

console.log('Consumer test passed!');
console.log('Backlog has', backlog.backlog.length, 'phase(s)');
EOF

npx tsc --noEmit tests/integration/models-consumer-test.ts

# Expected: No compilation errors

# Verify all exports are accessible
cat > tests/integration/models-exports-test.ts << 'EOF'
import * as Models from '../src/core/models.js';

const exports = Object.keys(Models);
console.log('Module exports:', exports);

// Verify expected exports exist
const expectedExports = ['Status', 'ItemType', 'Subtask', 'Task', 'Milestone', 'Phase', 'Backlog'];
const missingExports = expectedExports.filter(e => !exports.includes(e));

if (missingExports.length > 0) {
  console.error('Missing exports:', missingExports);
  process.exit(1);
}

console.log('All expected exports present!');
EOF

npx tsx tests/integration/models-exports-test.ts

# Expected: "All expected exports present!"
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test 1: Verify type narrowing works correctly
cat > tests/integration/type-narrowing-test.ts << 'EOF'
import { Phase, Milestone, Task, Subtask, ItemType } from '../src/core/models.js';

function processItem(item: Phase | Milestone | Task | Subtask): string {
  // Type narrowing using the 'type' discriminator
  switch (item.type) {
    case 'Phase':
      return `Phase ${item.id} has ${item.milestones.length} milestones`;
    case 'Milestone':
      return `Milestone ${item.id} has ${item.tasks.length} tasks`;
    case 'Task':
      return `Task ${item.id} has ${item.subtasks.length} subtasks`;
    case 'Subtask':
      return `Subtask ${item.id} has ${item.dependencies.length} dependencies`;
    default:
      // This should never happen if types are correct
      const _exhaustiveCheck: never = item;
      return _exhaustiveCheck;
  }
}

const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Phase 1',
  status: 'Planned',
  description: 'Test',
  milestones: []
};

console.log('Type narrowing test:', processItem(phase));
EOF

npx tsx tests/integration/type-narrowing-test.ts

# Expected: "Type narrowing test: Phase P1 has 0 milestones"

# Test 2: Verify immutability with readonly modifier
cat > tests/integration/readonly-test.ts << 'EOF'
import { Subtask, Status } from '../src/core/models.js';

const subtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test Subtask',
  status: 'Planned',
  story_points: 2,
  dependencies: [],
  context_scope: 'Test'
};

// This should cause a TypeScript error (commented out to allow test run)
// subtask.id = 'new-id';  // Error: Cannot assign to 'id' because it is read-only

console.log('Readonly test: immutability enforced by TypeScript');
console.log('Subtask ID:', subtask.id);
EOF

npx tsx tests/integration/readonly-test.ts

# Expected: Test runs without errors, readonly properties are protected

# Test 3: Verify interface compatibility with tasks.json structure
cat > tests/integration/tasksjson-compat-test.ts << 'EOF'
import { Backlog } from '../src/core/models.js';
import { readFileSync } from 'fs';

// Read the actual tasks.json file
const tasksJsonPath = 'plan/001_14b9dc2a33c7/tasks.json';
const tasksJson = JSON.parse(readFileSync(tasksJsonPath, 'utf-8'));

// Verify it matches the Backlog interface
const backlog: Backlog = tasksJson;

console.log('tasks.json compatibility test passed!');
console.log('Backlog has', backlog.backlog.length, 'phase(s)');

// Find first subtask and verify its structure
for (const phase of backlog.backlog) {
  for (const milestone of phase.milestones) {
    for (const task of milestone.tasks) {
      if (task.subtasks.length > 0) {
        const subtask = task.subtasks[0];
        console.log('Sample subtask:', {
          id: subtask.id,
          type: subtask.type,
          title: subtask.title,
          status: subtask.status,
          story_points: subtask.story_points
        });
        break;
      }
    }
    break;
  }
}
EOF

npx tsx tests/integration/tasksjson-compat-test.ts

# Expected: Compatibility confirmed, sample subtask displayed

# Test 4: Verify JSDoc comments are parseable
cat > tests/integration/jsdoc-test.ts << 'EOF'
import { Subtask } from '../src/core/models.js';

// Hover over 'subtask' in an IDE to see JSDoc
// This test verifies the file compiles (JSDoc syntax errors prevent compilation)
const subtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test',
  status: 'Planned',
  story_points: 1,
  dependencies: [],
  context_scope: 'Test'
};

console.log('JSDoc parse test: TypeScript compiled successfully with JSDoc comments');
EOF

npx tsc --noEmit tests/integration/jsdoc-test.ts

# Expected: No compilation errors (JSDoc is valid)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 7 types defined: `Status`, `ItemType`, `Subtask`, `Task`, `Milestone`, `Phase`, `Backlog`
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] All exports have comprehensive JSDoc comments with `@remarks` and `@example`
- [ ] All properties use `readonly` modifier
- [ ] File saved at `src/core/models.ts`
- [ ] ESM import syntax works with `.js` extension
- [ ] Prettier formatting passes

### Feature Validation

- [ ] `Status` type has all 6 literal values: Planned, Researching, Implementing, Complete, Failed, Obsolete
- [ ] `ItemType` type has all 4 literal values: Phase, Milestone, Task, Subtask
- [ ] `Subtask` has 7 properties: id, type, title, status, story_points, dependencies, context_scope
- [ ] `Task` has 6 properties: id, type, title, status, description, subtasks
- [ ] `Milestone` has 6 properties: id, type, title, status, description, tasks
- [ ] `Phase` has 6 properties: id, type, title, status, description, milestones
- [ ] `Backlog` has 1 property: backlog (array of Phase)
- [ ] Type narrowing works using `type` discriminator field
- [ ] Interfaces match tasks.json structure

### Code Quality Validation

- [ ] Follows existing codebase patterns from `src/config/types.ts`
- [ ] JSDoc comments use `@remarks`, `@example`, `@see` tags appropriately
- [ ] Property naming uses camelCase (story_points not storyPoints)
- [ ] Type discriminator field is named `type` (not `kind`)
- [ ] No "I" prefix on interfaces (Subtask not ISubtask)
- [ ] Uses type aliases for enums, not native TypeScript enums
- [ ] Dependencies use string arrays, not object references

### Documentation & Deployment

- [ ] Module-level JSDoc explains the module's purpose
- [ ] Each interface has clear description in JSDoc
- [ ] Each property has inline JSDoc where clarification is needed
- [ ] `@example` tags show executable usage code
- [ ] `@see` tags reference related documentation

---

## Anti-Patterns to Avoid

- ❌ **Don't use native TypeScript enums** - Use type aliases with union of literal types
- ❌ **Don't omit `readonly` modifier** - All properties should be immutable
- ❌ **Don't use "I" prefix** - Interface names should be Subtask, not ISubtask
- ❌ **Don't use `kind` as discriminator** - Use `type` to match system_context.md
- ❌ **Don't use camelCase for enum values** - Status values should be PascalCase (Planned, not planned)
- ❌ **Don't make dependencies object references** - Use string arrays of IDs
- ❌ **Don't skip JSDoc comments** - All exports need comprehensive documentation
- ❌ **Don't use `@default` tag in JSDoc** - Not supported by TypeScript
- ❌ **Don't forget `.js` extension in imports** - ESM requires it even for TypeScript files
- ❌ **Don't create circular references** - Keep interfaces strictly hierarchical

---

## Confidence Score

**9/10** - One-pass implementation success likelihood

**Confidence Rationale**:

- ✅ Complete interface specifications with exact property names and types
- ✅ JSDoc patterns demonstrated from existing codebase
- ✅ TypeScript configuration specifics documented (strict mode, ESM)
- ✅ Research findings integrated (TypeScript best practices, task hierarchy patterns)
- ✅ Validation commands provided for all 4 levels
- ✅ No ambiguity in implementation approach
- ✅ Follows existing codebase conventions

**Risk Mitigation**:

- Verify `src/core/` directory exists before starting (should exist from P1.M1.T1.S4)
- Run `npx tsc --noEmit` before making changes to establish baseline
- Follow JSDoc pattern exactly from `src/config/types.ts`
- Use `readonly` modifier consistently to prevent issues with future immutability requirements

**Minor Deduction**:
- The next subtask (P1.M2.T1.S2) will create Zod schemas matching these interfaces - if interface design has issues, they'll surface during Zod schema creation
- This is acceptable as it's part of the iterative refinement process
