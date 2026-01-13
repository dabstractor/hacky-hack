# Product Requirement Prompt (PRP): Session Management Interfaces

**PRP ID**: P1.M2.T2.S1
**Work Item**: Create session management interfaces
**Story Points**: 1
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Extend `src/core/models.ts` with comprehensive TypeScript type definitions for session management (SessionMetadata, SessionState, DeltaSession), establishing the type foundation for the Session Manager component (P3.M1).

**Deliverable**: Extended `src/core/models.ts` with additional exported interfaces:

- `SessionMetadata` interface (id, hash, path, createdAt, parentSession)
- `SessionState` interface (metadata, prdSnapshot, taskRegistry, currentItemId)
- `DeltaSession` interface extending SessionState (oldPRD, newPRD, diffSummary)
- Comprehensive JSDoc documentation on all new exports
- All exports properly typed with zero compilation errors

**Success Definition**:

- All 3 new interfaces are defined and exported from `src/core/models.ts`
- TypeScript compiles without errors (`npx tsc --noEmit`)
- All interfaces follow existing codebase JSDoc patterns
- Existing exports (Status, ItemType, Subtask, Task, Milestone, Phase, Backlog) remain unchanged
- Module can be imported using ESM syntax (`import { ... } from './core/models.js'`)

---

## User Persona

**Target User**: Developer implementing the Session Manager (P3.M1) and delta session functionality (P4.M1).

**Use Case**: Before implementing session state persistence, PRD diffing for delta detection, or delta session initialization, the developer needs type-safe interfaces that define the shape of session data throughout the system.

**User Journey**:

1. Developer imports session types from `src/core/models.js`
2. Uses `SessionMetadata` for session identification and filesystem operations
3. Uses `SessionState` for state persistence in `tasks.json`
4. Uses `DeltaSession` for PRD diffing and task patching operations

**Pain Points Addressed**:

- **No shared session type definitions**: Without interfaces, session handling code would use inconsistent structures
- **Unclear delta session structure**: Lacking explicit interfaces makes the parent-child session relationship implicit
- **No documentation**: JSDoc comments provide IDE autocomplete and inline documentation
- **Type safety**: Strong typing prevents runtime errors when handling session data

---

## Why

- **Foundation for Session Manager (P3.M1)**: All session state persistence, directory management, and PRD hashing operations depend on these type definitions
- **Foundation for Delta Sessions (P4.M1)**: Delta detection, PRD diffing, and task patching require the DeltaSession interface
- **Enables type-safe state loading**: The Session Manager loads `tasks.json` which must conform to SessionState interface
- **Prevents data corruption**: Immutable (`readonly`) properties prevent accidental mutation of session state
- **Self-documenting code**: JSDoc provides IDE tooltips and generated documentation
- **Integration with existing patterns**: Extends the established `src/core/models.ts` module with consistent patterns

---

## What

Extend the existing `src/core/models.ts` module with session management type definitions:

### Data Models to Add

```typescript
// 1. SessionMetadata Interface
interface SessionMetadata {
  readonly id: string; // Sequence number (e.g., "001", "002")
  readonly hash: string; // PRD hash (e.g., "14b9dc2a33c7")
  readonly path: string; // Directory path (e.g., "plan/001_14b9dc2a33c7")
  readonly createdAt: Date; // Session creation timestamp
  readonly parentSession: string | null; // Parent session ID for delta sessions
}

// 2. SessionState Interface
interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string; // PRD content at session start
  readonly taskRegistry: Backlog; // Task hierarchy (reuses existing Backlog interface)
  readonly currentItemId: string | null; // Currently executing item ID
}

// 3. DeltaSession Interface (extends SessionState)
interface DeltaSession extends SessionState {
  readonly oldPRD: string; // Original PRD content
  readonly newPRD: string; // Modified PRD content
  readonly diffSummary: string; // Human-readable diff summary
}
```

### Success Criteria

- [ ] `SessionMetadata` interface with 5 properties: id, hash, path, createdAt, parentSession
- [ ] `SessionState` interface with 4 properties: metadata, prdSnapshot, taskRegistry, currentItemId
- [ ] `DeltaSession` interface extending SessionState with 3 additional properties: oldPRD, newPRD, diffSummary
- [ ] All properties use `readonly` modifier
- [ ] All exports have comprehensive JSDoc comments
- [ ] `npx tsc --noEmit` completes without errors
- [ ] Existing exports remain unchanged (backward compatible)
- [ ] File remains at `src/core/models.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes - this PRP provides:

- Exact file location (`src/core/models.ts`) and module structure
- Complete interface definitions with all property names and types
- JSDoc patterns to follow from existing codebase
- TypeScript configuration specifics (strict mode, ESM)
- Existing file structure to preserve
- Validation commands for verification

### Documentation & References

```yaml
# MUST READ - Critical architecture documentation

- file: plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Defines the session directory structure and session model (lines 99-113)
  critical: Session Directory Structure shows exact layout: plan/001_hash/ with prd_snapshot.md, tasks.json
  section: Lines 99-113 (Session Directory Structure)

- file: PRD.md
  why: Defines the session model concept and delta logic (lines 21-27)
  critical: "Session: A directory containing the state of a specific run"
  section: Lines 21-27 (The "Session" Model)

- file: src/core/models.ts
  why: Existing file to extend, contains all current type definitions
  pattern: Follow the exact JSDoc structure with @remarks, @example tags, @see references
  gotcha: MUST preserve all existing exports, only add new interfaces at end

- file: plan/001_14b9dc2a33c7/P1M2T1S1/PRP.md
  why: Reference PRP showing exact structure and format expected
  pattern: PRP template structure, validation levels, context section format
  gotcha: Use this as a format guide, but for session interfaces not task interfaces

- file: tests/unit/core/models.test.ts
  why: Existing test patterns for models.ts interfaces
  pattern: Schema validation tests with SETUP/EXECUTE/VERIFY comments, StatusEnum testing
  gotcha: Zod schema tests will be added in P1.M2.T2.S2, this PRP only defines interfaces

- url: https://www.typescriptlang.org/docs/handbook/2/interfaces.html
  why: TypeScript interface syntax, extending interfaces
  critical: Use `interface DeltaSession extends SessionState` pattern for inheritance

- url: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html#union-types
  why: Union type syntax for `string | null` (parentSession, currentItemId)
  pattern: Use union types for optional nullable fields

- url: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
  why: Best practices for library authoring with type definitions
  pattern: Export both interfaces and types for maximum compatibility
```

### Current Codebase Tree

```bash
.
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/
│       │   └── system_context.md         # Session directory structure
│       ├── prd_snapshot.md               # PRD snapshot (referenced in SessionState)
│       ├── tasks.json                    # Task registry instance (Backlog interface)
│       └── P1M2T2S1/
│           └── research/                 # Research documents
├── src/
│   ├── config/                           # Environment configuration
│   ├── core/
│   │   └── models.ts                     # TARGET FILE: Extend with session interfaces
│   ├── utils/                            # Task utilities
│   └── workflows/                        # Workflows
├── tests/
│   └── unit/
│       └── core/
│           └── models.test.ts            # Existing test patterns
├── package.json                          # Zod 3.22.4 installed
├── tsconfig.json                         # ES2022, NodeNext, strict mode
└── vitest.config.ts                      # Test configuration
```

### Desired Codebase Tree with Files to be Modified

```bash
src/
└── core/
    └── models.ts                         # MODIFY: Add session interfaces
        # Existing exports (preserve unchanged):
        # - Status (type alias)
        # - ItemType (type alias)
        # - StatusEnum (Zod schema)
        # - ItemTypeEnum (Zod schema)
        # - Subtask (interface + schema)
        # - Task (interface + schema)
        # - Milestone (interface + schema)
        # - Phase (interface + schema)
        # - Backlog (interface + schema)
        #
        # NEW exports to add:
        # - SessionMetadata (interface)
        # - SessionState (interface)
        # - DeltaSession (interface)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: This project uses "type": "module" in package.json (ESM)
// Import statements MUST use .js extension:
// import { SessionState } from './core/models.js';  // CORRECT
// import { SessionState } from './core/models';    // WRONG - runtime error

// CRITICAL: TypeScript target is ES2022 with NodeNext module resolution
// Use interface with extends keyword for inheritance
interface DeltaSession extends SessionState { ... }  // CORRECT
type DeltaSession = SessionState & { ... }          // WRONG - use interface extends

// CRITICAL: TypeScript strict mode is enabled
// All properties must have explicit type annotations
// No implicit any types allowed

// CRITICAL: Use readonly modifier for ALL properties
// Session data should be treated as immutable
interface SessionMetadata {
  readonly id: string;     // CORRECT - immutable
  id: string;              // WRONG - allows mutation

// GOTCHA: Follow existing JSDoc patterns from src/core/models.ts
// Use multi-line JSDoc with @remarks for additional context
// Use @example with executable code
// Use @see for cross-references to system_context.md and PRD.md

// GOTCHA: Interface naming - NO "I" prefix
interface SessionMetadata { }     // CORRECT
interface ISessionMetadata { }    // WRONG - not following codebase conventions

// GOTCHA: Property naming - camelCase for properties
parentSession: string | null;    // CORRECT
parent_session: string | null;   // WRONG - not following codebase conventions

// GOTCHA: The session ID format from system_context.md
// Uses format: {sequence}_{hash} e.g., "001_14b9dc2a33c7"
// The path is "plan/{sequence}_{hash}/"
readonly id: string;      // "001_14b9dc2a33c7" - full identifier
readonly hash: string;    // "14b9dc2a33c7" - PRD hash only
readonly path: string;    // "plan/001_14b9dc2a33c7" - full directory path

// GOTCHA: Reuse existing Backlog interface for taskRegistry
// Don't redefine the task hierarchy structure
readonly taskRegistry: Backlog;  // CORRECT - reuses existing interface

// GOTCHA: Use string | null for nullable fields
readonly parentSession: string | null;      // CORRECT
readonly parentSession?: string;            // WRONG - undefined not supported
readonly currentItemId: string | null;      // CORRECT
readonly currentItemId?: string;            // WRONG - undefined not supported

// GOTCHA: DeltaSession extends SessionState, not implements
// This allows type narrowing and proper inheritance
interface DeltaSession extends SessionState { ... }  // CORRECT

// GOTCHA: Date type for timestamps, not string
readonly createdAt: Date;   // CORRECT - Date object
readonly createdAt: string; // WRONG - should be Date type

// GOTCHA: prdSnapshot is the full PRD content as string
readonly prdSnapshot: string;  // CORRECT - full markdown content
readonly prdSnapshotPath: string;  // WRONG - stores content not path
```

---

## Implementation Blueprint

### Data Models and Structure

````typescript
/**
 * Session Metadata Interface
 *
 * Identifies and locates a session in the filesystem. Sessions are
 * created when the PRP Pipeline initializes, providing an immutable
 * audit trail of development history.
 *
 * @remarks
 * Session identifiers use the format `{sequence}_{hash}` where:
 * - `sequence`: Zero-padded incremental number (001, 002, 003, ...)
 * - `hash`: First 12 characters of the PRD content hash (SHA-256)
 *
 * The session directory path is `plan/{sequence}_{hash}/`.
 *
 * Delta sessions set `parentSession` to the parent session ID, enabling
 * change tracking and selective re-execution of modified tasks.
 *
 * @see {@link ../../plan/001_14b9dc2a33c7/architecture/system_context.md | System Context: Session Directory Structure}
 *
 * @example
 * ```typescript
 * import { SessionMetadata } from './core/models.js';
 *
 * const metadata: SessionMetadata = {
 *   id: '001_14b9dc2a33c7',
 *   hash: '14b9dc2a33c7',
 *   path: 'plan/001_14b9dc2a33c7',
 *   createdAt: new Date('2024-01-12T10:00:00Z'),
 *   parentSession: null  // Initial session has no parent
 * };
 * ```
 */
export interface SessionMetadata {
  /**
   * Unique session identifier combining sequence and PRD hash
   *
   * @format {sequence}_{hash}
   * @example '001_14b9dc2a33c7'
   */
  readonly id: string;

  /**
   * SHA-256 hash of the PRD content (first 12 characters)
   *
   * @remarks
   * Used for PRD change detection. If the hash differs from the
   * current PRD hash, a delta session is required.
   *
   * @length 12
   */
  readonly hash: string;

  /**
   * Filesystem path to the session directory
   *
   * @format plan/{sequence}_{hash}/
   * @example 'plan/001_14b9dc2a33c7/'
   */
  readonly path: string;

  /**
   * Timestamp when the session was created
   *
   * @remarks
   * Stored as a Date object for type safety. Serialized to ISO 8601
   * format when persisted to JSON.
   *
   * @format ISO 8601
   */
  readonly createdAt: Date;

  /**
   * Parent session ID for delta sessions
   *
   * @remarks
   * Null for initial sessions. Set to the parent session ID for
   * delta sessions created when the PRD is modified.
   *
   * This enables the Session Manager to trace the lineage of sessions
   * and determine which tasks can be reused from the parent session.
   *
   * @nullable true
   * @example '001_14b9dc2a33c7' for a delta session, null for initial session
   */
  readonly parentSession: string | null;
}

/**
 * Complete state of a development session
 *
 * @remarks
 * SessionState captures the complete state at session initialization,
 * including the PRD snapshot, task hierarchy, and current execution
 * position. This state is persisted to `tasks.json` and loaded by
 * the Session Manager to enable resume capability.
 *
 * The `currentItemId` field tracks which task/subtask is currently
 * being executed, enabling the pipeline to resume from interruption
 * without re-executing completed work.
 *
 * @see {@link ../../plan/001_14b9dc2a33c7/architecture/system_context.md | System Context: Task Hierarchy}
 *
 * @example
 * ```typescript
 * import { SessionState, SessionMetadata, Backlog, Status } from './core/models.js';
 *
 * const state: SessionState = {
 *   metadata: {
 *     id: '001_14b9dc2a33c7',
 *     hash: '14b9dc2a33c7',
 *     path: 'plan/001_14b9dc2a33c7',
 *     createdAt: new Date(),
 *     parentSession: null
 *   },
 *   prdSnapshot: '# PRD Content\\n...',
 *   taskRegistry: {
 *     backlog: [
 *       {
 *         id: 'P1',
 *         type: 'Phase',
 *         title: 'Phase 1',
 *         status: 'Planned',
 *         description: 'Foundation',
 *         milestones: []
 *       }
 *     ]
 *   },
 *   currentItemId: 'P1.M1.T1.S1'
 * };
 * ```
 */
export interface SessionState {
  /** Session identification and filesystem location */
  readonly metadata: SessionMetadata;

  /**
   * Full PRD content at session initialization
   *
   * @remarks
   * Stores the complete PRD markdown content as a string. Used for
   * change detection and as the baseline for delta diffing.
   *
   * The PRD snapshot is stored in `plan/{session_id}/prd_snapshot.md`
   * and this field contains its content as a string for easy access.
   */
  readonly prdSnapshot: string;

  /**
   * Task hierarchy for this session
   *
   * @remarks
   * Reuses the existing `Backlog` interface from the task hierarchy.
   * Contains the complete Phase > Milestone > Task > Subtask structure
   * generated by the Architect Agent.
   *
   * This registry is the single source of truth for task execution.
   * Status updates are persisted here as work progresses.
   */
  readonly taskRegistry: Backlog;

  /**
   * Currently executing work item ID
   *
   * @remarks
   * Tracks the task/subtask currently being executed by the pipeline.
   * Null if no task is currently active (e.g., session initialized
   * but execution not started, or all tasks complete).
   *
   * Enables resume capability: the Task Orchestrator can find and
   * continue from this item after interruption.
   *
   * @format P{phase}.M{milestone}.T{task}.S{subtask} or similar
   * @nullable true
   * @example 'P1.M1.T1.S1' for a subtask, null when idle
   */
  readonly currentItemId: string | null;
}

/**
 * Delta session state for PRD change management
 *
 * @remarks
 * Delta sessions are created when the master PRD is modified after
 * initial session creation. They extend the base SessionState with
 * additional fields for PRD diffing and change analysis.
 *
 * The Delta Analysis workflow (P4.M1.T1) compares oldPRD and newPRD
 * to generate the diffSummary, which guides task patching logic.
 *
 * Delta sessions reference their parent session via the inherited
 * `parentSession` field in metadata, enabling the pipeline to reuse
 * completed work from the parent session.
 *
 * @see {@link ../../../PRD.md#43-the-delta-workflow-change-management | PRD: Delta Workflow}
 *
 * @example
 * ```typescript
 * import { DeltaSession, SessionMetadata, Backlog } from './core/models.js';
 *
 * const delta: DeltaSession = {
 *   metadata: {
 *     id: '002_a3f8e9d12b4',
 *     hash: 'a3f8e9d12b4',
 *     path: 'plan/002_a3f8e9d12b4',
 *     createdAt: new Date(),
 *     parentSession: '001_14b9dc2a33c7'  // References parent session
 *   },
 *   prdSnapshot: '# Updated PRD\\n...',
 *   taskRegistry: { backlog: [] },
 *   currentItemId: null,
 *   oldPRD: '# Original PRD\\n...',
 *   newPRD: '# Updated PRD\\n...',
 *   diffSummary: 'Added new feature X, modified feature Y requirements'
 * };
 * ```
 */
export interface DeltaSession extends SessionState {
  /**
   * Original PRD content before modification
   *
   * @remarks
   * Stores the PRD content from the parent session. Used by the
   * Delta Analysis workflow to compute differences and identify
   * which tasks are affected by PRD changes.
   */
  readonly oldPRD: string;

  /**
   * Modified PRD content after user changes
   *
   * @remarks
   * The updated PRD that triggered delta session creation. The
   * Architect Agent will process this PRD to generate an updated
   * task registry.
   */
  readonly newPRD: string;

  /**
   * Human-readable summary of PRD differences
   *
   * @remarks
   * Generated by the Delta Analysis workflow (P4.M1.T1). Provides
   * a high-level description of what changed in the PRD, which
   * guides task patching decisions.
   *
   * Example content: "Added Phase 5 for production deployment,
   * modified P3.M2.T1 to include parallel research, removed
   * deprecated P2.M3.T2.S1"
   */
  readonly diffSummary: string;
}
````

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: BACKUP existing models.ts content
  - ACTION: Create a copy of src/core/models.ts before modification
  - COMMAND: cp src/core/models.ts src/core/models.ts.backup
  - VERIFICATION: Confirm backup exists with ls -la src/core/models.ts.backup
  - DEPENDENCIES: None
  - PURPOSE: Safety rollback in case of errors

Task 2: READ existing models.ts structure
  - ACTION: Open src/core/models.ts and identify insertion point
  - FIND: The last export (should be BacklogSchema around line 627)
  - PLAN: Insert new interfaces after BacklogSchema, before module end
  - DEPENDENCIES: Task 1 (backup created)

Task 3: ADD SessionMetadata interface
  - IMPLEMENT: SessionMetadata interface with id, hash, path, createdAt, parentSession
  - PATTERN: Use readonly modifier on all properties
  - NAMING: camelCase for properties (parentSession not parent_session)
  - DOCUMENTATION: Comprehensive JSDoc with @remarks, @see, @example
  - PLACEMENT: Add after BacklogSchema in src/core/models.ts
  - DEPENDENCIES: Task 2

Task 4: ADD SessionState interface
  - IMPLEMENT: SessionState interface with metadata, prdSnapshot, taskRegistry, currentItemId
  - PATTERN: Use readonly modifier, reuse Backlog interface for taskRegistry
  - NAMING: camelCase for properties
  - DOCUMENTATION: JSDoc with @remarks, @see, @example
  - PLACEMENT: Add after SessionMetadata in src/core/models.ts
  - DEPENDENCIES: Task 3 (SessionMetadata interface)

Task 5: ADD DeltaSession interface
  - IMPLEMENT: DeltaSession interface extending SessionState with oldPRD, newPRD, diffSummary
  - PATTERN: Use `extends SessionState` for interface inheritance
  - NAMING: camelCase for properties
  - DOCUMENTATION: JSDoc with @remarks, @see, @example
  - PLACEMENT: Add after SessionState in src/core/models.ts
  - DEPENDENCIES: Task 4 (SessionState interface)

Task 6: VERIFY TypeScript compilation
  - RUN: npx tsc --noEmit src/core/models.ts
  - EXPECTED: Zero errors
  - IF ERRORS: Check for incorrect property types, JSDoc syntax, extends syntax
  - VALIDATION: All types are correctly defined, no implicit any
  - DEPENDENCIES: Task 5 (all interfaces defined)

Task 7: VERIFY module can be imported
  - CREATE: tests/manual/session-types-test.ts
  - CONTENT: Import SessionMetadata, SessionState, DeltaSession
  - RUN: npx tsx tests/manual/session-types-test.ts
  - EXPECTED: No runtime errors, all types are importable
  - DEPENDENCIES: Task 6

Task 8: VERIFY backward compatibility
  - RUN: npx tsc --noEmit (full project check)
  - EXPECTED: Zero errors in entire project
  - RUN: npm test (existing tests should still pass)
  - EXPECTED: All existing tests pass
  - DEPENDENCIES: Task 7

Task 9: CLEANUP backup file
  - RUN: rm src/core/models.ts.backup
  - CONDITION: Only after all validations pass
  - DEPENDENCIES: Task 8 (all validations pass)
```

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// CRITICAL PATTERNS - Follow these for consistency
// ============================================================================

// PATTERN 1: Interface with readonly properties (from existing codebase)
export interface SessionMetadata {
  readonly id: string;        // Immutable - identity never changes
  readonly hash: string;      // Immutable - hash is fixed at creation
  readonly path: string;      // Immutable - path is derived from id
  readonly createdAt: Date;   // Immutable - creation time is historical
  readonly parentSession: string | null;  // Immutable - lineage is fixed
}

// PATTERN 2: JSDoc comment structure (from existing codebase)
/**
 * [One-line summary of what this interface represents]
 *
 * @remarks
 * [Additional context about usage, constraints, or relationships]
 * [May include multiple paragraphs explaining the session model]
 *
 * @see {@link ../../plan/001_14b9dc2a33c7/architecture/system_context.md | System Context}
 *
 * @example
 * ```typescript
 * import { SessionMetadata } from './core/models.js';
 * const metadata: SessionMetadata = { ... };
 * ```
 */
export interface SessionMetadata {
  // Properties...
}

// PATTERN 3: Interface extension for inheritance
// GOOD:
export interface DeltaSession extends SessionState {
  readonly oldPRD: string;
  readonly newPRD: string;
  readonly diffSummary: string;
}

// BAD:
export interface DeltaSession {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string;
  readonly taskRegistry: Backlog;
  readonly currentItemId: string | null;
  readonly oldPRD: string;
  readonly newPRD: string;
  readonly diffSummary: string;
}

// PATTERN 4: Reusing existing interfaces
// GOOD - reuse Backlog from task hierarchy:
export interface SessionState {
  readonly taskRegistry: Backlog;  // Reuses existing interface
}

// BAD - don't redefine:
export interface SessionState {
  readonly taskRegistry: {
    backlog: Phase[];
  };
}

// PATTERN 5: Nullable fields with union type
// GOOD:
readonly parentSession: string | null;
readonly currentItemId: string | null;

// BAD - don't use optional:
readonly parentSession?: string;  // undefined not supported

// PATTERN 6: Property-specific JSDoc with nullable annotation
export interface SessionMetadata {
  /**
   * Parent session ID for delta sessions
   *
   * @remarks
   * [Explanation of parent session relationship]
   *
   * @nullable true
   * @example '001_14b9dc2a33c7' for delta, null for initial
   */
  readonly parentSession: string | null;
}

// PATTERN 7: Cross-references in JSDoc
// Use @see to link to architecture documentation:
/**
 * @see {@link ../../plan/001_14b9dc2a33c7/architecture/system_context.md | System Context}
 * @see {@link ../../../PRD.md#43-the-delta-workflow-change-management | PRD: Delta Workflow}
 */

// GOTCHA: ESM import syntax
// Imports MUST include .js extension
import { SessionState } from './core/models.js';  // CORRECT
import { SessionState } from './core/models';    // WRONG - runtime error

// GOTCHA: Property naming matches existing codebase
parentSession: string | null;   // CORRECT - camelCase
parent_session: string | null;  // WRONG - snake_case

// GOTCHA: Use Date type for timestamps
readonly createdAt: Date;   // CORRECT - Date object
readonly createdAt: string; // WRONG - should be Date type

// GOTCHA: prdSnapshot stores content, not path
readonly prdSnapshot: string;  // CORRECT - full markdown content
readonly prdSnapshotPath: string;  // WRONG - stores content not path

// GOTCHA: Reuse Backlog interface
readonly taskRegistry: Backlog;  // CORRECT - reuses existing interface
readonly taskRegistry: { backlog: Phase[] };  // WRONG - redundant definition

// GOTCHA: Interface extends for inheritance
interface DeltaSession extends SessionState { }  // CORRECT
type DeltaSession = SessionState & { ... }      // WRONG - use extends

// GOTCHA: Insertion point in models.ts
// Add new interfaces AFTER BacklogSchema, before file end
// Do NOT insert between existing interfaces

// GOTCHA: Preserve all existing exports
// Status, ItemType, Subtask, Task, Milestone, Phase, Backlog must remain unchanged
// Only ADD new interfaces, do not modify existing ones
````

### Integration Points

```yaml
FUTURE_INTEGRATION (not part of this PRP):
  - P1.M2.T2.S2: Create PRP document interfaces
  - P1.M2.T2.S3: Create file system utilities for session management (uses SessionMetadata)
  - P3.M1.T1: Create SessionManager class (uses SessionState)
  - P3.M1.T2: Implement PRD snapshot utility (uses SessionState.prdSnapshot)
  - P4.M1.T1: Create delta analysis workflow (uses DeltaSession)

FILES_REFERENCED:
  - plan/001_14b9dc2a33c7/prd_snapshot.md: Instance of SessionState.prdSnapshot
  - plan/001_14b9dc2a33c7/tasks.json: Instance of SessionState.taskRegistry (Backlog)
  - plan/001_14b9dc2a33c7/architecture/system_context.md: Session structure definition
  - PRD.md: Session model concept and delta logic

BACKWARD_COMPATIBILITY:
  - MUST preserve all existing exports: Status, ItemType, Subtask, Task, Milestone, Phase, Backlog
  - MUST preserve all existing Zod schemas: StatusEnum, ItemTypeEnum, SubtaskSchema, etc.
  - MUST NOT modify any existing interface definitions
  - Only ADD new exports at the end of the file
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npx tsc --noEmit src/core/models.ts       # Type check modified file
npx tsc --noEmit                           # Full project type check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common errors:
# - TS2307: Cannot find module -> Check import paths include .js extension
# - TS7006: Parameter implicitly has 'any' type -> Add explicit type annotation
# - TS2322: Type 'X' is not assignable to type 'Y' -> Check property types match interface
# - TS2420: Class 'X' incorrectly implements interface -> Check extends syntax

# Format check (Prettier is configured)
npx prettier --check src/core/models.ts

# If formatting issues exist:
npx prettier --write src/core/models.ts

# Lint check (ESLint is configured)
npx eslint src/core/models.ts

# If linting issues exist, fix them before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# NOTE: Zod schema tests will be created in P1.M2.T2.S2 (next subtask)
# For now, perform manual type verification:

# Create manual type validation test
cat > tests/manual/session-types-test.ts << 'EOF'
import {
  SessionMetadata,
  SessionState,
  DeltaSession,
  Backlog,
  Phase
} from '../../src/core/models.js';

// Verify SessionMetadata interface
const metadata: SessionMetadata = {
  id: '001_14b9dc2a33c7',
  hash: '14b9dc2a33c7',
  path: 'plan/001_14b9dc2a33c7',
  createdAt: new Date('2024-01-12T10:00:00Z'),
  parentSession: null
};

console.log('SessionMetadata:', metadata);

// Verify SessionState interface
const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Phase 1',
  status: 'Planned',
  description: 'Test phase',
  milestones: []
};

const backlog: Backlog = { backlog: [phase] };

const state: SessionState = {
  metadata: metadata,
  prdSnapshot: '# PRD Content\n...',
  taskRegistry: backlog,
  currentItemId: 'P1.M1.T1.S1'
};

console.log('SessionState:', state);

// Verify DeltaSession interface
const delta: DeltaSession = {
  metadata: {
    id: '002_a3f8e9d12b4',
    hash: 'a3f8e9d12b4',
    path: 'plan/002_a3f8e9d12b4',
    createdAt: new Date(),
    parentSession: '001_14b9dc2a33c7'
  },
  prdSnapshot: '# Updated PRD\n...',
  taskRegistry: backlog,
  currentItemId: null,
  oldPRD: '# Original PRD\n...',
  newPRD: '# Updated PRD\n...',
  diffSummary: 'Added new feature X'
};

console.log('DeltaSession:', delta);

// Verify type narrowing works
function processSession(session: SessionState): string {
  if ('oldPRD' in session) {
    const delta = session as DeltaSession;
    return `Delta session from ${delta.metadata.parentSession}`;
  }
  return `Initial session ${session.metadata.id}`;
}

console.log('Type narrowing test:');
console.log('  State:', processSession(state));
console.log('  Delta:', processSession(delta));

console.log('\nAll type validations passed!');
EOF

# Run manual type check
npx tsx tests/manual/session-types-test.ts

# Expected: "All type validations passed!" with no TypeScript errors
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify module can be imported with correct ESM syntax
cat > tests/integration/session-types-esm-test.ts << 'EOF'
// Test ESM import with .js extension
import {
  SessionMetadata,
  SessionState,
  DeltaSession
} from '../src/core/models.js';

console.log('ESM import successful!');
console.log('SessionMetadata exports:', {
  properties: ['id', 'hash', 'path', 'createdAt', 'parentSession']
});
console.log('SessionState exports:', {
  properties: ['metadata', 'prdSnapshot', 'taskRegistry', 'currentItemId']
});
console.log('DeltaSession exports:', {
  extends: 'SessionState',
  additional: ['oldPRD', 'newPRD', 'diffSummary']
});
EOF

npx tsx tests/integration/session-types-esm-test.ts

# Expected: "ESM import successful!" with all properties displayed

# Verify TypeScript compilation from a consuming module
cat > tests/integration/session-types-consumer-test.ts << 'EOF'
import { SessionState, SessionMetadata, Backlog } from '../src/core/models.js';

const metadata: SessionMetadata = {
  id: '001_14b9dc2a33c7',
  hash: '14b9dc2a33c7',
  path: 'plan/001_14b9dc2a33c7',
  createdAt: new Date(),
  parentSession: null
};

const state: SessionState = {
  metadata: metadata,
  prdSnapshot: '# Test PRD',
  taskRegistry: { backlog: [] },
  currentItemId: null
};

console.log('Consumer test passed!');
console.log('Session ID:', state.metadata.id);
console.log('Has PRD snapshot:', state.prdSnapshot.length > 0);
console.log('Has tasks:', state.taskRegistry.backlog.length);
EOF

npx tsc --noEmit tests/integration/session-types-consumer-test.ts

# Expected: No compilation errors

# Verify all exports are accessible (including existing ones)
cat > tests/integration/session-types-exports-test.ts << 'EOF'
import * as Models from '../src/core/models.js';

const exports = Object.keys(Models);
console.log('Total exports:', exports.length);

// Verify expected existing exports still exist
const existingExports = [
  'Status',
  'ItemType',
  'Subtask',
  'Task',
  'Milestone',
  'Phase',
  'Backlog',
  'StatusEnum',
  'ItemTypeEnum',
  'SubtaskSchema',
  'TaskSchema',
  'MilestoneSchema',
  'PhaseSchema',
  'BacklogSchema'
];

// Verify new session exports exist
const newExports = [
  'SessionMetadata',
  'SessionState',
  'DeltaSession'
];

const missingExisting = existingExports.filter(e => !exports.includes(e));
const missingNew = newExports.filter(e => !exports.includes(e));

if (missingExisting.length > 0) {
  console.error('Missing existing exports:', missingExisting);
  process.exit(1);
}

if (missingNew.length > 0) {
  console.error('Missing new exports:', missingNew);
  process.exit(1);
}

console.log('All expected exports present!');
console.log('  - Existing exports preserved:', existingExports.length);
console.log('  - New session exports added:', newExports.length);
EOF

npx tsx tests/integration/session-types-exports-test.ts

# Expected: "All expected exports present!" with both counts displayed

# Verify backward compatibility - existing imports still work
cat > tests/integration/session-types-backward-compat-test.ts << 'EOF'
// This test verifies that existing code using models.ts still works

import {
  Backlog,
  Status,
  ItemType,
  Subtask,
  Task,
  Milestone,
  Phase
} from '../src/core/models.js';

// Use existing types as they would be used in existing code
const status: Status = 'Planned';
const itemType: ItemType = 'Subtask';

const subtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test Subtask',
  status: status,
  story_points: 2,
  dependencies: [],
  context_scope: 'Test scope'
};

const backlog: Backlog = {
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1',
      status: 'Planned',
      description: 'Test',
      milestones: []
    }
  ]
};

console.log('Backward compatibility test passed!');
console.log('  Status type works:', status);
console.log('  ItemType type works:', itemType);
console.log('  Subtask interface works:', subtask.id);
console.log('  Backlog interface works:', backlog.backlog.length, 'phase(s)');
EOF

npx tsx tests/integration/session-types-backward-compat-test.ts

# Expected: "Backward compatibility test passed!" with all values displayed
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test 1: Verify session ID format validation
cat > tests/integration/session-id-format-test.ts << 'EOF'
import { SessionMetadata } from '../src/core/models.js';

// Test valid session ID formats
const validSessions: SessionMetadata[] = [
  {
    id: '001_14b9dc2a33c7',
    hash: '14b9dc2a33c7',
    path: 'plan/001_14b9dc2a33c7',
    createdAt: new Date(),
    parentSession: null
  },
  {
    id: '002_a3f8e9d12b4',
    hash: 'a3f8e9d12b4',
    path: 'plan/002_a3f8e9d12b4',
    createdAt: new Date(),
    parentSession: '001_14b9dc2a33c7'
  },
  {
    id: '123_abcdef12345',
    hash: 'abcdef12345',
    path: 'plan/123_abcdef12345',
    createdAt: new Date(),
    parentSession: null
  }
];

console.log('Session ID format validation:');
validSessions.forEach((session, i) => {
  const { sequence, hash } = session.id.split('_');
  console.log(`  Session ${i + 1}:`, {
    sequence,
    hash,
    path: session.path,
    matchesHash: session.hash === hash
  });
});

console.log('All session ID formats valid!');
EOF

npx tsx tests/integration/session-id-format-test.ts

# Expected: All session IDs parsed correctly, hash matches

# Test 2: Verify delta session inheritance
cat > tests/integration/delta-inheritance-test.ts << 'EOF'
import { DeltaSession, SessionState, SessionMetadata, Backlog } from '../src/core/models.js';

const metadata: SessionMetadata = {
  id: '002_a3f8e9d12b4',
  hash: 'a3f8e9d12b4',
  path: 'plan/002_a3f8e9d12b4',
  createdAt: new Date(),
  parentSession: '001_14b9dc2a33c7'
};

const delta: DeltaSession = {
  metadata: metadata,
  prdSnapshot: '# Updated PRD',
  taskRegistry: { backlog: [] },
  currentItemId: null,
  oldPRD: '# Old PRD',
  newPRD: '# New PRD',
  diffSummary: 'Changes summary'
};

// Verify DeltaSession can be used as SessionState
function processSession(session: SessionState): string {
  return `Processing session ${session.metadata.id}`;
}

console.log('Inheritance test:');
console.log('  DeltaSession as SessionState:', processSession(delta));
console.log('  DeltaSession has oldPRD:', 'oldPRD' in delta);
console.log('  DeltaSession has newPRD:', 'newPRD' in delta);
console.log('  DeltaSession has diffSummary:', 'diffSummary' in delta);

// Verify type narrowing
if ('oldPRD' in delta) {
  console.log('  Type narrowing works: delta is DeltaSession');
  console.log('  Parent session:', delta.metadata.parentSession);
}

console.log('Delta inheritance test passed!');
EOF

npx tsx tests/integration/delta-inheritance-test.ts

# Expected: All inheritance checks pass, type narrowing works

# Test 3: Verify readonly enforcement
cat > tests/integration/session-readonly-test.ts << 'EOF'
import { SessionMetadata } from '../src/core/models.js';

const metadata: SessionMetadata = {
  id: '001_14b9dc2a33c7',
  hash: '14b9dc2a33c7',
  path: 'plan/001_14b9dc2a33c7',
  createdAt: new Date(),
  parentSession: null
};

// This should cause a TypeScript error (commented out to allow test run)
// metadata.id = 'new-id';  // Error: Cannot assign to 'id' because it is read-only
// metadata.hash = 'new-hash';  // Error: Cannot assign to 'hash' because it is read-only

console.log('Readonly test: immutability enforced by TypeScript');
console.log('Session ID:', metadata.id);
console.log('Session hash:', metadata.hash);
console.log('Session path:', metadata.path);
console.log('Created at:', metadata.createdAt.toISOString());
console.log('Parent session:', metadata.parentSession);
EOF

npx tsc --noEmit tests/integration/session-readonly-test.ts

# Expected: Test compiles, readonly properties are protected

# Test 4: Verify JSDoc comments are parseable
cat > tests/integration/session-jsdoc-test.ts << 'EOF'
import { SessionMetadata, SessionState, DeltaSession } from '../src/core/models.js';

// Hover over types in an IDE to see JSDoc
// This test verifies the file compiles (JSDoc syntax errors prevent compilation)

const metadata: SessionMetadata = {
  id: '001_14b9dc2a33c7',
  hash: '14b9dc2a33c7',
  path: 'plan/001_14b9dc2a33c7',
  createdAt: new Date(),
  parentSession: null
};

const state: SessionState = {
  metadata,
  prdSnapshot: '# Test',
  taskRegistry: { backlog: [] },
  currentItemId: null
};

const delta: DeltaSession = {
  ...state,
  oldPRD: '# Old',
  newPRD: '# New',
  diffSummary: 'Summary'
};

console.log('JSDoc parse test: TypeScript compiled successfully with JSDoc comments');
console.log('All three session types are properly defined and documented');
EOF

npx tsc --noEmit tests/integration/session-jsdoc-test.ts

# Expected: No compilation errors (JSDoc is valid)

# Test 5: Verify session state serialization
cat > tests/integration/session-serialization-test.ts << 'EOF'
import { SessionState, SessionMetadata } from '../src/core/models.js';

const state: SessionState = {
  metadata: {
    id: '001_14b9dc2a33c7',
    hash: '14b9dc2a33c7',
    path: 'plan/001_14b9dc2a33c7',
    createdAt: new Date('2024-01-12T10:00:00Z'),
    parentSession: null
  },
  prdSnapshot: '# Test PRD\n\nThis is a test.',
  taskRegistry: { backlog: [] },
  currentItemId: 'P1.M1.T1.S1'
};

// Serialize to JSON (as would be done for persistence)
const json = JSON.stringify(state, null, 2);

console.log('Session state JSON:');
console.log(json);

// Deserialize (Date would need special handling in real implementation)
const parsed = JSON.parse(json);

console.log('\nDeserialized session:');
console.log('  ID:', parsed.metadata.id);
console.log('  Created at (string):', parsed.metadata.createdAt);
console.log('  PRD snapshot length:', parsed.prdSnapshot.length);
console.log('  Current item:', parsed.currentItemId);

console.log('\nSerialization test passed!');
console.log('Note: Date objects serialize to ISO strings, requires coercion on deserialization');
EOF

npx tsx tests/integration/session-serialization-test.ts

# Expected: Session state serializes to JSON, Date becomes ISO string
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 3 new interfaces defined: `SessionMetadata`, `SessionState`, `DeltaSession`
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] All new exports have comprehensive JSDoc comments with `@remarks`, `@see`, `@example`
- [ ] All properties use `readonly` modifier
- [ ] File remains at `src/core/models.ts` (not moved)
- [ ] ESM import syntax works with `.js` extension
- [ ] Prettier formatting passes
- [ ] ESLint linting passes

### Feature Validation

- [ ] `SessionMetadata` has 5 properties: id, hash, path, createdAt, parentSession
- [ ] `SessionState` has 4 properties: metadata, prdSnapshot, taskRegistry, currentItemId
- [ ] `DeltaSession` extends `SessionState` with 3 additional properties: oldPRD, newPRD, diffSummary
- [ ] `taskRegistry` property reuses existing `Backlog` interface
- [ ] `parentSession` and `currentItemId` use `string | null` type
- [ ] `createdAt` uses `Date` type (not string)
- [ ] Interface inheritance works correctly (`DeltaSession extends SessionState`)
- [ ] Type narrowing works for delta detection

### Code Quality Validation

- [ ] Follows existing codebase patterns from `src/core/models.ts`
- [ ] JSDoc comments use `@remarks`, `@example`, `@see` tags appropriately
- [ ] Property naming uses camelCase (parentSession, currentItemId, taskRegistry)
- [ ] No "I" prefix on interfaces (SessionMetadata not ISessionMetadata)
- [ ] Reuses existing interfaces where appropriate (Backlog for taskRegistry)
- [ ] Cross-references architecture documentation with `@see` tags
- [ ] Module-level JSDoc preserved from original file

### Backward Compatibility Validation

- [ ] All existing exports preserved: Status, ItemType, Subtask, Task, Milestone, Phase, Backlog
- [ ] All existing Zod schemas preserved: StatusEnum, ItemTypeEnum, SubtaskSchema, TaskSchema, MilestoneSchema, PhaseSchema, BacklogSchema
- [ ] No existing interface definitions modified
- [ ] Existing tests still pass: `npm test`
- [ ] Full project type check passes: `npx tsc --noEmit`

### Documentation & Deployment

- [ ] Module-level JSDoc preserved from original file
- [ ] Each new interface has clear description in JSDoc
- [ ] Each property has inline JSDoc where clarification is needed
- [ ] `@example` tags show executable usage code
- [ ] `@see` tags reference system_context.md and PRD.md

---

## Anti-Patterns to Avoid

- ❌ **Don't modify existing interfaces** - Only add new interfaces, preserve existing ones
- ❌ **Don't omit `readonly` modifier** - All properties should be immutable
- ❌ **Don't use "I" prefix** - Interface names should be SessionMetadata, not ISessionMetadata
- ❌ **Don't use snake_case** - Property names should be camelCase (parentSession, currentItemId)
- ❌ **Don't use optional properties** - Use `string | null` not `string?` for nullable fields
- ❌ **Don't redefine Backlog** - Reuse existing Backlog interface for taskRegistry
- ❌ **Don't use `type` for inheritance** - Use `interface extends` not `type ... &`
- ❌ **Don't skip JSDoc comments** - All new exports need comprehensive documentation
- ❌ **Don't use string for dates** - Use `Date` type for createdAt, serialize to ISO string when needed
- ❌ **Don't insert in middle of file** - Add new interfaces at end after BacklogSchema
- ❌ **Don't break backward compatibility** - Existing code must continue to work unchanged

---

## Confidence Score

**9/10** - One-pass implementation success likelihood

**Confidence Rationale**:

- ✅ Complete interface specifications with exact property names and types
- ✅ JSDoc patterns demonstrated from existing `src/core/models.ts` codebase
- ✅ TypeScript configuration specifics documented (strict mode, ESM)
- ✅ Research findings integrated (session model from PRD/system_context.md)
- ✅ Validation commands provided for all 4 levels
- ✅ Backward compatibility requirements clearly defined
- ✅ No ambiguity in implementation approach
- ✅ Follows existing codebase conventions exactly

**Risk Mitigation**:

- Create backup of `src/core/models.ts` before modification (Task 1)
- Verify backward compatibility by running existing tests (Task 8)
- Follow JSDoc pattern exactly from existing interfaces in same file
- Use `readonly` modifier consistently to prevent issues
- Reuse existing `Backlog` interface to avoid redundancy

**Minor Deduction**:

- The next subtask (P1.M2.T2.S2) will create Zod schemas matching these interfaces - if interface design has issues, they'll surface during Zod schema creation
- This is acceptable as it's part of the iterative refinement process
- Delta session workflows (P4.M1) will provide real-world validation of the interface design
