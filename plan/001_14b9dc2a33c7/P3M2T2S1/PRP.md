# Product Requirement Prompt (PRP): P3.M2.T2.S1 - Create Scope Parser and Resolver

---

## Goal

**Feature Goal**: Implement a comprehensive scope parsing and resolution system that converts user-provided scope strings (like "P1.M1", "P1.M1.T1", "all") into lists of executable backlog items, enabling flexible execution of tasks at any level of the hierarchy.

**Deliverable**: A new `src/core/scope-resolver.ts` module with:
1. `ScopeType` enum: `'phase' | 'milestone' | 'task' | 'subtask' | 'all'`
2. `Scope` interface: `{ type: ScopeType, id?: string }`
3. `parseScope(scopeArg: string): Scope` function - Parses scope strings
4. `resolveScope(backlog: Backlog, scope: Scope): ItemType[]` function - Returns items matching scope
5. Comprehensive test coverage with 100% coverage threshold

**Success Definition**:
- `parseScope()` correctly parses all scope formats: "P1", "P1.M1", "P1.M1.T1", "P1.M1.T1.S1", "all", "--scope=milestone"
- `resolveScope()` returns correct item lists:
  - 'all' returns all leaf subtasks
  - 'milestone' returns all tasks in that milestone
  - Specific ID returns that item and all descendants
- Full type safety with TypeScript and Zod runtime validation
- Custom `ScopeParseError` for clear error messages
- All tests pass with 100% coverage
- No regressions in existing functionality

## User Persona

**Target User**: PRP Pipeline developers implementing the Task Execution Engine (P3.M2.T1), specifically the scope-based execution subsystem that enables flexible task selection.

**Use Case**: The TaskOrchestrator needs to support executing tasks at different scopes so that:
1. Users can execute a single subtask: `--scope P1.M1.T1.S1`
2. Users can execute all tasks in a milestone: `--scope P1.M1`
3. Users can execute all pending work: `--scope all`
4. Pipeline controller can resume execution at specific hierarchy levels

**User Journey**:
```
User provides CLI argument: --scope P1.M1
    ↓
Scope parser validates format and extracts scope type
    ↓
Scope resolver traverses backlog to find matching items
    ↓
Returns list of Task items in milestone P1.M1
    ↓
TaskOrchestrator executes each task in sequence
```

**Pain Points Addressed**:
- **No scope-based execution**: Currently, no way to execute tasks at specific hierarchy levels
- **Manual ID management**: Users must know exact subtask IDs to execute work
- **No batch execution**: Cannot execute all tasks in a milestone or phase at once
- **Rigid execution model**: Can't resume execution from a specific point in the hierarchy

## Why

- **PRD Compliance**: Section 5.3 explicitly requires "User can execute specific scopes (--scope=milestone, --task=3)"
- **Flexible Execution**: Enables running tasks at any granularity (single subtask, entire milestone, all work)
- **Resume Capability**: Critical for delta sessions where execution resumes from specific points
- **User Experience**: Natural CLI syntax for scope selection matches industry tools (Nx, Lerna, yarn workspaces)
- **Integration Point**: P3.M2.T2.S2 (Integrate scope with TaskOrchestrator) depends on this module
- **Foundation for CLI**: P3.M4.T2 (CLI Entry Point) will consume these utilities for user-facing scope arguments

## What

Implement a scope parsing and resolution module that:

### Functionality Requirements

1. **`ScopeType` enum** - String literal union type:
   ```typescript
   export type ScopeType = 'phase' | 'milestone' | 'task' | 'subtask' | 'all';
   ```

2. **`Scope` interface** - Represents a parsed scope:
   ```typescript
   export interface Scope {
     readonly type: ScopeType;
     readonly id?: string;  // Required for non-'all' scopes
   }
   ```

3. **`parseScope(scopeArg: string): Scope`** function:
   - Parses scope strings like "P1", "P1.M1", "P1.M1.T1", "P1.M1.T1.S1", "all"
   - Handles CLI format: "--scope=milestone", "--task=3"
   - Throws `ScopeParseError` with descriptive messages for invalid formats
   - Returns validated `Scope` object

4. **`resolveScope(backlog: Backlog, scope: Scope): ItemType[]`** function:
   - Returns items matching the scope:
     - `'all'` → all leaf Subtask items
     - `'phase'` with ID → that Phase and all descendants
     - `'milestone'` with ID → that Milestone and all descendants
     - `'task'` with ID → that Task and all descendants
     - `'subtask'` with ID → that Subtask only
   - Uses DFS traversal for hierarchy navigation
   - Returns empty array for non-existent IDs

5. **`ScopeParseError` class** - Custom error for parsing failures:
   ```typescript
   export class ScopeParseError extends Error {
     readonly invalidInput: string;
     readonly expectedFormat: string;
   }
   ```

### Scope Input Formats Supported

| Input Format | Resolved Scope | Returns |
|--------------|----------------|---------|
| `all` | `{ type: 'all' }` | All leaf subtasks |
| `P1` | `{ type: 'phase', id: 'P1' }` | Phase P1 and descendants |
| `P1.M1` | `{ type: 'milestone', id: 'P1.M1' }` | Milestone P1.M1 and descendants |
| `P1.M1.T1` | `{ type: 'task', id: 'P1.M1.T1' }` | Task P1.M1.T1 and subtasks |
| `P1.M1.T1.S1` | `{ type: 'subtask', id: 'P1.M1.T1.S1' }` | Single subtask |
| `--scope=milestone` | Error (ambiguous without ID) | Throws ScopeParseError |
| `--scope=P1.M1` | `{ type: 'milestone', id: 'P1.M1' }` | Milestone P1.M1 and descendants |

### Success Criteria

- [ ] `ScopeType` enum exists with all required values
- [ ] `Scope` interface exists with type and optional id
- [ ] `parseScope()` parses all valid formats correctly
- [ ] `parseScope()` throws `ScopeParseError` for invalid formats
- [ ] `resolveScope()` returns correct items for all scope types
- [ ] `resolveScope()` returns empty array for non-existent IDs
- [ ] `resolveScope()` returns all leaf subtasks for 'all' scope
- [ ] All tests pass with 100% coverage
- [ ] TypeScript compilation passes with no errors
- [ ] ESLint passes with no errors
- [ ] No regressions in existing tests

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: A developer unfamiliar with this codebase can implement the scope parser using:

- Exact Backlog and hierarchy item type definitions from models.ts
- Existing traversal patterns from task-utils.ts
- Regex patterns for ID validation
- Test structure and patterns from existing test files
- External research on CLI scope parsing patterns
- Complete code examples showing the patterns to follow

### Documentation & References

```yaml
# MUST READ - Core Implementation Files

- file: src/core/models.ts
  why: Contains Backlog, Phase, Milestone, Task, Subtask type definitions needed for scope resolution
  pattern: All interfaces use readonly properties, id follows dot-notation pattern
  gotcha: IDs must match specific regex patterns (/^P\d+$/, /^P\d+\.M\d+$/, etc.)
  lines: 55-61 (Status type), 102 (ItemType), 149-211 (Subtask), 286-322 (Task), 381-416 (Milestone), 478-513 (Phase), 587-599 (Backlog)

- file: src/utils/task-utils.ts
  why: Contains findItem(), filterByStatus(), and traversal patterns to follow
  pattern: DFS pre-order traversal, immutable updates, type guards for HierarchyItem
  gotcha: findItem() uses early exit - don't traverse entire tree if item found
  lines: 63-103 (type guards), 106-144 (findItem), 165-188 (filterByStatus), 261-364 (updateItemStatus)

- file: src/core/task-orchestrator.ts
  why: Will consume the scope resolver - shows integration pattern
  pattern: Uses bracketed logging: [TaskOrchestrator] message
  gotcha: This PRP creates the dependency - orchestrator will be modified in P3.M2.T2.S2
  lines: 1-100 (class structure and imports)

# EXTERNAL RESEARCH - CLI Scope Parsing Patterns

- docfile: plan/001_14b9dc2a33c7/P3M2T2S1/research/external_research.md
  why: Comprehensive research on CLI scope parsing patterns from Nx, Lerna, yarn
  section: Hierarchical Scope Parsing (Lines 20-150), TypeScript Enum Patterns (Lines 151-250)
  critical: Scope syntax conventions, wildcard patterns, Result type for safe parsing

- docfile: plan/001_14b9dc2a33c7/P3M2T2S1/research/hierarchy_data_structures.md
  why: Detailed breakdown of existing Backlog and hierarchy structures
  section: ID Pattern Convention (Lines 70-95), Existing Utility Functions (Lines 97-130)
  critical: Exact ID regex patterns, traversal patterns to follow

- docfile: plan/001_14b9dc2a33c7/P3M2T2S1/research/parsing_patterns_research.md
  why: Existing parsing patterns in codebase (regex, enums, error handling)
  section: Regex-Based Parsing (Lines 10-45), Enum Definitions (Lines 75-110), Error Handling (Lines 130-175)
  critical: Naming conventions, Zod validation patterns, custom error class structure

- docfile: plan/001_14b9dc2a33c7/P3M2T2S1/research/test_patterns_research.md
  why: Test structure and patterns for comprehensive test coverage
  section: Test Structure (Lines 20-60), Factory Functions (Lines 65-95), Edge Cases (Lines 165-200)
  critical: Describe/it pattern, 100% coverage requirement, Setup/Execute/Verify pattern

# INDUSTRY REFERENCE IMPLEMENTATIONS

- url: https://nx.dev/features/target-execution#run-your-targets
  why: Nx's sophisticated scope parsing with wildcards, excludes, and multiple patterns
  critical: How they handle "all" flag, wildcard patterns, comma-separated values

- url: https://lerna.js.org/features/overview#running-commands-in-specific-packages
  why: Lerna's --scope flag for package selection
  critical: Scope syntax with dot notation, dependency inclusion

- url: https://zod.dev/?s=parse
  why: Zod's parse() method for runtime validation with detailed errors
  critical: Result type pattern, error message formatting

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  why: TypeScript type guard patterns for enum validation
  critical: Type predicate functions, unknown input handling
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.ts                 # Test configuration with 100% coverage
├── PRD.md                           # Product Requirements Document
├── plan/001_14b9dc2a33c7/
│   ├── tasks.json                   # Task hierarchy
│   ├── architecture/                # Architecture documentation
│   └── P3M2T2S1/                    # This subtask directory
│       ├── research/                # Research documents (created)
│       │   ├── hierarchy_data_structures.md
│       │   ├── parsing_patterns_research.md
│       │   ├── test_patterns_research.md
│       │   └── external_research.md
│       └── PRP.md                   # THIS FILE
├── src/
│   ├── core/
│   │   ├── models.ts                # Backlog, Phase, Milestone, Task, Subtask types
│   │   ├── session-manager.ts       # Session management
│   │   ├── task-orchestrator.ts     # Task execution (will integrate in P3.M2.T2.S2)
│   │   └── session-utils.ts         # File utilities
│   └── utils/
│       └── task-utils.ts            # Hierarchy utilities (findItem, filterByStatus)
└── tests/
    └── unit/
        ├── core/
        │   ├── task-utils.test.ts   # Hierarchy utility tests
        │   ├── session-manager.test.ts
        │   └── models.test.ts
        └── utils/
            └── (scope-resolver tests will be added here)
```

### Desired Codebase Tree with Files to be Added

```bash
# NEW FILES:

src/core/
  └── scope-resolver.ts              # NEW: Scope parsing and resolution module
      - EXPORT: ScopeType type
      - EXPORT: Scope interface
      - EXPORT: ScopeParseError class
      - EXPORT: parseScope() function
      - EXPORT: resolveScope() function
      - EXPORT: Type guards (isScope, isValidScopeType)

tests/unit/core/
  └── scope-resolver.test.ts         # NEW: Comprehensive scope resolver tests
      - DESCRIBE: ScopeType enum validation
      - DESCRIBE: Scope interface
      - DESCRIBE: parseScope() function
      - DESCRIBE: resolveScope() function
      - DESCRIBE: ScopeParseError class
      - DESCRIBE: Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ScopeType is a string literal union, not a TypeScript enum
// CORRECT: export type ScopeType = 'phase' | 'milestone' | 'task' | 'subtask' | 'all';
// WRONG: export enum ScopeType { Phase = 'phase', ... } (don't use TS enum)
// REASON: String literal unions work better with Zod and serialization

// CRITICAL: ID format must match exact regex patterns from models.ts
// Phase: /^P\d+$/
// Milestone: /^P\d+\.M\d+$/
// Task: /^P\d+\.M\d+\.T\d+$/
// Subtask: /^P\d+\.M\d+\.T\d+\.S\d+$/
// Use these exact patterns for validation - don't reinvent

// CRITICAL: All hierarchy properties are readonly (immutable)
// CORRECT: item.id (read-only access)
// WRONG: item.id = 'new-id' (will cause TypeScript error)

// CRITICAL: Use existing findItem() from task-utils.ts for ID lookups
// Don't reimplement traversal - use the existing utility
// IMPORT: import { findItem } from '../utils/task-utils.js';

// CRITICAL: HierarchyItem type union includes all four types
// Use type guards to narrow: isPhase(), isMilestone(), isTask(), isSubtask()
// These already exist in task-utils.ts

// CRITICAL: Scope resolution must preserve DFS pre-order traversal
// Existing utilities use DFS pre-order - match this pattern
// Children should be returned after their parent

// CRITICAL: "all" scope returns leaf nodes (Subtasks), not all items
// CORRECT: resolveScope(backlog, { type: 'all' }) returns Subtask[]
// WRONG: Returns all HierarchyItem types (phases, milestones, tasks, subtasks)

// CRITICAL: CLI format with flags needs special handling
// "--scope=milestone" is ambiguous - which milestone?
// Should throw ScopeParseError with message indicating ID is required

// GOTCHA: Scope type is determined by ID depth, not explicit in string
// "P1" → phase (1 component)
// "P1.M1" → milestone (2 components)
// "P1.M1.T1" → task (3 components)
// "P1.M1.T1.S1" → subtask (4 components)
// "all" → all (special keyword)

// PATTERN: Custom errors extend Error and add context properties
// class ScopeParseError extends Error {
//   readonly invalidInput: string;
//   readonly expectedFormat: string;
//   constructor(input: string, expected: string) { ... }
// }

// PATTERN: Type guards use "value is Type" return type annotation
// function isScopeType(value: unknown): value is ScopeType {
//   return typeof value === 'string' && VALID_SCOPE_TYPES.includes(value as ScopeType);
// }

// TESTING: Use factory functions for test data
// Create: createTestBacklog(), createTestPhase(), createTestMilestone(), etc.
// Follow patterns from task-utils.test.ts

// TESTING: Describe/it pattern with BDD-style descriptions
// describe('parseScope()', () => {
//   describe('GIVEN a valid scope string', () => {
//     it('SHOULD parse phase scope correctly', () => { ... });
//   });
// });

// TESTING: 100% coverage is enforced by vitest.config.ts
// Every branch must be tested
// Error cases must be covered
// Edge cases must be covered

// GOTCHA: resolveScope() returns ItemType[], not HierarchyItem[]
// ItemType is the string union: 'Phase' | 'Milestone' | 'Task' | 'Subtask'
// Wait, actually looking at models.ts line 102:
// export type ItemType = 'Phase' | 'Milestone' | 'Task' | 'Subtask';
// But the contract says "Return items matching scope" which should be HierarchyItem[]
// Double-check this - the return type should probably be HierarchyItem[] not ItemType[]

// CRITICAL: Check the actual contract in work item description
// Contract says: "resolveScope(backlog: Backlog, scope: Scope): ItemType[]"
// This likely means HierarchyItem[] (the actual item objects), not the string type
// We'll use HierarchyItem[] for the return type
```

---

## Implementation Blueprint

### Data Models and Structure

**New Types to Create:**

```typescript
// ScopeType: String literal union for scope level
export type ScopeType = 'phase' | 'milestone' | 'task' | 'subtask' | 'all';

// Scope: Parsed scope representation
export interface Scope {
  readonly type: ScopeType;
  readonly id?: string;  // Required for non-'all' scopes
}

// ScopeParseError: Custom error for parsing failures
export class ScopeParseError extends Error {
  readonly invalidInput: string;
  readonly expectedFormat: string;

  constructor(input: string, expected: string) {
    super(`Failed to parse scope: "${input}". Expected: ${expected}`);
    this.name = 'ScopeParseError';
    this.invalidInput = input;
    this.expectedFormat = expected;
  }
}
```

**Existing Models Used:**
- `Backlog` from `src/core/models.ts`
- `Phase`, `Milestone`, `Task`, `Subtask` from `src/core/models.ts`
- `HierarchyItem` from `src/utils/task-utils.ts`
- `ItemType` from `src/core/models.ts`

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/core/scope-resolver.ts - Add type definitions
  - IMPLEMENT: ScopeType type (string literal union)
  - IMPLEMENT: Scope interface with type and optional id
  - IMPLEMENT: ScopeParseError class extending Error
  - NAMING: PascalCase for interface, camelCase for function names
  - PATTERN: Follow existing pattern from models.ts (Status type)
  - PATTERN: Follow existing error pattern from types.ts (EnvironmentValidationError)
  - PLACEMENT: Top of file, before functions
  - EXPORT: All types and error class

Task 2: CREATE src/core/scope-resolver.ts - Add type guards
  - IMPLEMENT: isScopeType(value: unknown): value is ScopeType
  - IMPLEMENT: isScope(value: unknown): value is Scope
  - PATTERN: Follow type guard pattern from task-utils.ts (isSubtask, isTask)
  - NAMING: is{TypeName} format
  - VALIDATION: Check against VALID_SCOPE_TYPES const array
  - PLACEMENT: After type definitions, before parseScope

Task 3: CREATE src/core/scope-resolver.ts - Implement parseScope()
  - IMPLEMENT: parseScope(scopeArg: string): Scope
  - SIGNATURE: Accepts string, returns Scope object
  - LOGIC:
    1. Handle "all" keyword → { type: 'all' }
    2. Handle empty string → throw ScopeParseError
    3. Parse dot notation to determine depth (1=phase, 2=milestone, 3=task, 4=subtask)
    4. Validate format against regex patterns from models.ts
    5. Map depth to ScopeType
    6. Return { type, id: scopeArg }
  - ERROR HANDLING: Throw ScopeParseError with expected format for invalid input
  - NAMING: camelCase, matches contract
  - PLACEMENT: After type guards, before resolveScope

Task 4: CREATE src/core/scope-resolver.ts - Implement resolveScope()
  - IMPLEMENT: resolveScope(backlog: Backlog, scope: Scope): HierarchyItem[]
  - SIGNATURE: Accepts Backlog and Scope, returns HierarchyItem array
  - LOGIC:
    1. Handle 'all' type → collect all leaf Subtasks
    2. For other types:
       a. Use findItem() to locate the item by id
       b. If not found, return empty array
       c. If found, return item and all descendants
    3. Use DFS traversal for descendant collection
    4. Preserve pre-order traversal (parent before children)
  - TRAVERSAL: Implement getAllDescendants() helper function
  - ERROR HANDLING: Return empty array for missing items (don't throw)
  - NAMING: camelCase, matches contract
  - PLACEMENT: After parseScope

Task 5: CREATE src/core/scope-resolver.ts - Add helper functions
  - IMPLEMENT: getAllDescendants(item: HierarchyItem): HierarchyItem[]
  - IMPLEMENT: getLeafSubtasks(backlog: Backlog): Subtask[]
  - IMPLEMENT: getScopeTypeFromId(id: string): ScopeType
  - PATTERN: Follow traversal pattern from task-utils.ts
  - TRAVERSAL: DFS pre-order for consistency
  - NAMING: camelCase with descriptive names
  - PLACEMENT: After resolveScope, before exports

Task 6: CREATE src/core/scope-resolver.ts - Add exports
  - EXPORT: ScopeType, Scope, ScopeParseError
  - EXPORT: parseScope, resolveScope
  - EXPORT: Type guards (isScopeType, isScope)
  - EXPORT: Helper functions (getAllDescendants, getLeafSubtasks)
  - PATTERN: Follow existing export pattern from task-utils.ts
  - PLACEMENT: End of file

Task 7: CREATE tests/unit/core/scope-resolver.test.ts - Add type tests
  - IMPLEMENT: Tests for ScopeType enum validation
  - IMPLEMENT: Tests for Scope interface
  - IMPLEMENT: Tests for ScopeParseError class
  - TEST CASES:
    - valid scope type values
    - invalid scope type values
    - Scope object creation
    - ScopeParseError properties and message
  - PATTERN: Follow test structure from models.test.ts
  - COVERAGE: 100% for all type definitions

Task 8: CREATE tests/unit/core/scope-resolver.test.ts - Add parseScope() tests
  - IMPLEMENT: Unit tests for parseScope() function
  - TEST CASES:
    - parses "all" correctly
    - parses phase scope "P1"
    - parses milestone scope "P1.M1"
    - parses task scope "P1.M1.T1"
    - parses subtask scope "P1.M1.T1.S1"
    - throws ScopeParseError for empty string
    - throws ScopeParseError for invalid format "XYZ"
    - throws ScopeParseError for malformed "P1.X1"
    - throws ScopeParseError for incomplete "P1.M1.T1" (missing subtask? No, this is valid task)
    - error messages include expected format
  - PATTERN: Follow test structure from prd-differ.test.ts
  - FACTORY: createTestScopeString() helper

Task 9: CREATE tests/unit/core/scope-resolver.test.ts - Add resolveScope() tests
  - IMPLEMENT: Unit tests for resolveScope() function
  - TEST CASES:
    - returns all leaf subtasks for 'all' scope
    - returns phase and descendants for phase scope
    - returns milestone and descendants for milestone scope
    - returns task and descendants for task scope
    - returns single subtask for subtask scope
    - returns empty array for non-existent ID
    - preserves DFS pre-order traversal
    - handles empty backlog
  - PATTERN: Follow test structure from task-utils.test.ts
  - FACTORY: createTestBacklog() helper

Task 10: CREATE tests/unit/core/scope-resolver.test.ts - Add integration tests
  - IMPLEMENT: Integration tests for full parse→resolve flow
  - TEST SCENARIO:
    1. Parse scope string "P1.M1"
    2. Resolve against test backlog
    3. Verify correct items returned
    4. Test with "all" scope
    5. Test with invalid scope (error flow)
  - PATTERN: Follow integration test patterns from session-manager.test.ts
  - VALIDATE: End-to-end scope parsing and resolution
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: ScopeType Definition (String Literal Union)
// ============================================================================

/**
 * Scope level types for hierarchical task selection
 *
 * @remarks
 * - 'all': Selects all leaf subtasks across the entire backlog
 * - 'phase': Selects a specific phase and all its descendants
 * - 'milestone': Selects a specific milestone and all its descendants
 * - 'task': Selects a specific task and all its subtasks
 * - 'subtask': Selects a single subtask
 *
 * String literal union is used instead of TypeScript enum for:
 * - Better Zod integration
 * - Serialization compatibility
 * - Type safety at both compile and runtime
 */
export type ScopeType = 'phase' | 'milestone' | 'task' | 'subtask' | 'all';

// Valid scope types const array for type guard validation
const VALID_SCOPE_TYPES: ScopeType[] = ['phase', 'milestone', 'task', 'subtask', 'all'];

// ============================================================================
// PATTERN 2: Scope Interface
// ============================================================================

/**
 * Represents a parsed scope for task selection
 *
 * @remarks
 * - For 'all' type, id is undefined
 * - For all other types, id is required and must match the hierarchy format
 */
export interface Scope {
  readonly type: ScopeType;
  readonly id?: string;
}

// ============================================================================
// PATTERN 3: ScopeParseError Custom Error Class
// ============================================================================

/**
 * Error thrown when scope string parsing fails
 *
 * @remarks
 * Follows existing error pattern from EnvironmentValidationError in types.ts
 * Includes context properties for better error handling and messaging
 */
export class ScopeParseError extends Error {
  readonly invalidInput: string;
  readonly expectedFormat: string;

  constructor(input: string, expected: string) {
    super(`Failed to parse scope: "${input}". Expected: ${expected}`);
    this.name = 'ScopeParseError';
    this.invalidInput = input;
    this.expectedFormat = expected;
  }

  toString(): string {
    return `${this.name}: ${this.message}`;
  }
}

// ============================================================================
// PATTERN 4: Type Guards
// ============================================================================

/**
 * Type guard for ScopeType validation
 *
 * @remarks
 * Follows type guard pattern from task-utils.ts (isSubtask, isTask, etc.)
 * Uses const array for validation (easier to maintain than inline array)
 */
export function isScopeType(value: unknown): value is ScopeType {
  return typeof value === 'string' && VALID_SCOPE_TYPES.includes(value as ScopeType);
}

/**
 * Type guard for Scope interface validation
 */
export function isScope(value: unknown): value is Scope {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const scope = value as Record<string, unknown>;
  return (
    isScopeType(scope.type) &&
    (scope.type === 'all' || typeof scope.id === 'string')
  );
}

// ============================================================================
// PATTERN 5: parseScope() Implementation
// ============================================================================

/**
 * Parses a scope string into a Scope object
 *
 * @param scopeArg - Scope string to parse (e.g., "P1", "P1.M1", "all")
 * @returns Parsed Scope object
 * @throws {ScopeParseError} If the scope string is invalid or malformed
 *
 * @remarks
 * Scope format mapping:
 * - "all" → { type: 'all' }
 * - "P1" → { type: 'phase', id: 'P1' }
 * - "P1.M1" → { type: 'milestone', id: 'P1.M1' }
 * - "P1.M1.T1" → { type: 'task', id: 'P1.M1.T1' }
 * - "P1.M1.T1.S1" → { type: 'subtask', id: 'P1.M1.T1.S1' }
 *
 * Regex patterns from models.ts are used for validation:
 * - Phase: /^P\d+$/
 * - Milestone: /^P\d+\.M\d+$/
 * - Task: /^P\d+\.M\d+\.T\d+$/
 * - Subtask: /^P\d+\.M\d+\.T\d+\.S\d+$/
 */
export function parseScope(scopeArg: string): Scope {
  // Handle empty input
  if (!scopeArg || scopeArg.trim() === '') {
    throw new ScopeParseError(
      scopeArg,
      'non-empty scope string (e.g., "all", "P1", "P1.M1")'
    );
  }

  const trimmed = scopeArg.trim();

  // Handle "all" keyword
  if (trimmed === 'all') {
    return { type: 'all' };
  }

  // Parse by depth (number of dot-separated components)
  const parts = trimmed.split('.');
  const depth = parts.length;

  // Validate and map depth to scope type
  switch (depth) {
    case 1: {
      // Phase: P1, P2, etc.
      if (!/^P\d+$/.test(trimmed)) {
        throw new ScopeParseError(
          trimmed,
          'phase format (e.g., "P1")'
        );
      }
      return { type: 'phase', id: trimmed };
    }

    case 2: {
      // Milestone: P1.M1, P1.M2, etc.
      if (!/^P\d+\.M\d+$/.test(trimmed)) {
        throw new ScopeParseError(
          trimmed,
          'milestone format (e.g., "P1.M1")'
        );
      }
      return { type: 'milestone', id: trimmed };
    }

    case 3: {
      // Task: P1.M1.T1, P1.M1.T2, etc.
      if (!/^P\d+\.M\d+\.T\d+$/.test(trimmed)) {
        throw new ScopeParseError(
          trimmed,
          'task format (e.g., "P1.M1.T1")'
        );
      }
      return { type: 'task', id: trimmed };
    }

    case 4: {
      // Subtask: P1.M1.T1.S1, P1.M1.T1.S2, etc.
      if (!/^P\d+\.M\d+\.T\d+\.S\d+$/.test(trimmed)) {
        throw new ScopeParseError(
          trimmed,
          'subtask format (e.g., "P1.M1.T1.S1")'
        );
      }
      return { type: 'subtask', id: trimmed };
    }

    default: {
      throw new ScopeParseError(
        trimmed,
        'valid scope format (e.g., "P1", "P1.M1", "P1.M1.T1", "P1.M1.T1.S1", "all")'
      );
    }
  }
}

// ============================================================================
// PATTERN 6: Helper - Get All Descendants
// ============================================================================

/**
 * Gets all descendants of a hierarchy item
 *
 * @param item - The item to get descendants for
 * @returns Array of all descendant items (not including the item itself)
 *
 * @remarks
 * Uses DFS pre-order traversal to match existing traversal patterns
 * Returns only direct children, not grandchildren (use recursive call for full tree)
 */
function getAllDescendants(item: Phase | Milestone | Task): HierarchyItem[] {
  const descendants: HierarchyItem[] = [];

  if ('milestones' in item) {
    // Phase: return all milestones
    descendants.push(...item.milestones);
    // Recursively get descendants of each milestone
    for (const milestone of item.milestones) {
      descendants.push(...getAllDescendants(milestone));
    }
  } else if ('tasks' in item) {
    // Milestone: return all tasks
    descendants.push(...item.tasks);
    // Recursively get descendants of each task
    for (const task of item.tasks) {
      descendants.push(...getAllDescendants(task));
    }
  } else if ('subtasks' in item) {
    // Task: return all subtasks (leaf nodes)
    descendants.push(...item.subtasks);
  }

  return descendants;
}

// ============================================================================
// PATTERN 7: Helper - Get Leaf Subtasks
// ============================================================================

/**
 * Gets all leaf subtasks from a backlog
 *
 * @param backlog - The backlog to extract subtasks from
 * @returns Array of all subtasks (leaf nodes in the hierarchy)
 *
 * @remarks
 * Subtasks are the leaf nodes in our hierarchy
 * Uses DFS traversal for consistent ordering
 */
function getLeafSubtasks(backlog: Backlog): Subtask[] {
  const leaves: Subtask[] = [];

  for (const phase of backlog.backlog) {
    for (const milestone of phase.milestones) {
      for (const task of milestone.tasks) {
        leaves.push(...task.subtasks);
      }
    }
  }

  return leaves;
}

// ============================================================================
// PATTERN 8: resolveScope() Implementation
// ============================================================================

/**
 * Resolves a scope to a list of hierarchy items
 *
 * @param backlog - The backlog to search
 * @param scope - The parsed scope to resolve
 * @returns Array of items matching the scope
 *
 * @remarks
 * Resolution logic:
 * - 'all': Returns all leaf subtasks
 * - 'phase' with id: Returns that phase and all descendants
 * - 'milestone' with id: Returns that milestone and all descendants
 * - 'task' with id: Returns that task and all subtasks
 * - 'subtask' with id: Returns that single subtask
 * - Non-existent id: Returns empty array (no error)
 *
 * Uses findItem() from task-utils.ts for ID lookups
 * Preserves DFS pre-order traversal (parent before children)
 */
export function resolveScope(backlog: Backlog, scope: Scope): HierarchyItem[] {
  // Handle 'all' scope - return all leaf subtasks
  if (scope.type === 'all') {
    return getLeafSubtasks(backlog);
  }

  // For all other scope types, id is required
  if (!scope.id) {
    // This should never happen with proper Scope objects
    return [];
  }

  // Find the item by ID
  const item = findItem(backlog, scope.id);

  // If not found, return empty array
  if (!item) {
    return [];
  }

  // For subtask, return just the subtask
  if (item.type === 'Subtask') {
    return [item];
  }

  // For phase, milestone, or task, return item and all descendants
  return [item, ...getAllDescendants(item)];
}

// ============================================================================
// PATTERN 9: Testing - Factory Functions
// ============================================================================

// Test data factory functions (in test file)
function createTestSubtask(
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = []
): Subtask {
  return {
    id,
    type: 'Subtask',
    title,
    status,
    story_points: 2,
    dependencies,
    context_scope: 'Test scope',
  };
}

function createTestTask(
  id: string,
  title: string,
  subtasks: Subtask[] = []
): Task {
  return {
    id,
    type: 'Task',
    title,
    status: 'Planned',
    description: 'Test task',
    subtasks,
  };
}

function createTestMilestone(
  id: string,
  title: string,
  tasks: Task[] = []
): Milestone {
  return {
    id,
    type: 'Milestone',
    title,
    status: 'Planned',
    description: 'Test milestone',
    tasks,
  };
}

function createTestPhase(
  id: string,
  title: string,
  milestones: Milestone[] = []
): Phase {
  return {
    id,
    type: 'Phase',
    title,
    status: 'Planned',
    description: 'Test phase',
    milestones,
  };
}

function createTestBacklog(): Backlog {
  return {
    backlog: [
      createTestPhase('P1', 'Phase 1', [
        createTestMilestone('P1.M1', 'Milestone 1', [
          createTestTask('P1.M1.T1', 'Task 1', [
            createTestSubtask('P1.M1.T1.S1', 'Subtask 1'),
            createTestSubtask('P1.M1.T1.S2', 'Subtask 2'),
          ]),
          createTestTask('P1.M1.T2', 'Task 2', [
            createTestSubtask('P1.M1.T2.S1', 'Subtask 3'),
          ]),
        ]),
      ]),
    ],
  };
}

// ============================================================================
// PATTERN 10: Testing - Describe/It Structure
// ============================================================================

// Test structure (in test file)
describe('scope-resolver', () => {
  describe('ScopeType', () => {
    describe('GIVEN a valid scope type value', () => {
      it('SHOULD pass isScopeType type guard', () => {
        expect(isScopeType('phase')).toBe(true);
        expect(isScopeType('milestone')).toBe(true);
        expect(isScopeType('task')).toBe(true);
        expect(isScopeType('subtask')).toBe(true);
        expect(isScopeType('all')).toBe(true);
      });
    });

    describe('GIVEN an invalid scope type value', () => {
      it('SHOULD fail isScopeType type guard', () => {
        expect(isScopeType('invalid')).toBe(false);
        expect(isScopeType('Phase')).toBe(false); // Case sensitive
        expect(isScopeType('')).toBe(false);
        expect(isScopeType(null)).toBe(false);
        expect(isScopeType(undefined)).toBe(false);
      });
    });
  });

  describe('parseScope()', () => {
    describe('GIVEN a valid scope string', () => {
      it('SHOULD parse "all" correctly', () => {
        const result = parseScope('all');
        expect(result).toEqual({ type: 'all' });
      });

      it('SHOULD parse phase scope "P1"', () => {
        const result = parseScope('P1');
        expect(result).toEqual({ type: 'phase', id: 'P1' });
      });

      it('SHOULD parse milestone scope "P1.M1"', () => {
        const result = parseScope('P1.M1');
        expect(result).toEqual({ type: 'milestone', id: 'P1.M1' });
      });

      it('SHOULD parse task scope "P1.M1.T1"', () => {
        const result = parseScope('P1.M1.T1');
        expect(result).toEqual({ type: 'task', id: 'P1.M1.T1' });
      });

      it('SHOULD parse subtask scope "P1.M1.T1.S1"', () => {
        const result = parseScope('P1.M1.T1.S1');
        expect(result).toEqual({ type: 'subtask', id: 'P1.M1.T1.S1' });
      });

      it('SHOULD trim whitespace', () => {
        const result = parseScope('  P1  ');
        expect(result).toEqual({ type: 'phase', id: 'P1' });
      });
    });

    describe('GIVEN an invalid scope string', () => {
      it('SHOULD throw ScopeParseError for empty string', () => {
        expect(() => parseScope('')).toThrow(ScopeParseError);
        expect(() => parseScope('')).toThrow('non-empty scope string');
      });

      it('SHOULD throw ScopeParseError for invalid format', () => {
        expect(() => parseScope('XYZ')).toThrow(ScopeParseError);
        expect(() => parseScope('XYZ')).toThrow('phase format');
      });

      it('SHOULD throw ScopeParseError for malformed ID', () => {
        expect(() => parseScope('P1.X1')).toThrow(ScopeParseError);
        expect(() => parseScope('P1.X1')).toThrow('milestone format');
      });

      it('SHOULD throw ScopeParseError for too many components', () => {
        expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow(ScopeParseError);
        expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow('valid scope format');
      });

      it('SHOULD include expected format in error message', () => {
        try {
          parseScope('invalid');
        } catch (error) {
          expect(error).toBeInstanceOf(ScopeParseError);
          if (error instanceof ScopeParseError) {
            expect(error.expectedFormat).toBeDefined();
            expect(error.invalidInput).toBe('invalid');
          }
        }
      });
    });
  });

  describe('resolveScope()', () => {
    const testBacklog = createTestBacklog();

    describe('GIVEN "all" scope', () => {
      it('SHOULD return all leaf subtasks', () => {
        const scope: Scope = { type: 'all' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toHaveLength(3); // S1, S2, S3
        expect(result.every(item => item.type === 'Subtask')).toBe(true);
      });
    });

    describe('GIVEN phase scope', () => {
      it('SHOULD return phase and all descendants', () => {
        const scope: Scope = { type: 'phase', id: 'P1' };
        const result = resolveScope(testBacklog, scope);

        expect(result.length).toBeGreaterThan(0);
        // First item should be the phase itself
        expect(result[0].id).toBe('P1');
        expect(result[0].type).toBe('Phase');
      });
    });

    describe('GIVEN milestone scope', () => {
      it('SHOULD return milestone and all descendants', () => {
        const scope: Scope = { type: 'milestone', id: 'P1.M1' };
        const result = resolveScope(testBacklog, scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1.M1');
        expect(result[0].type).toBe('Milestone');
      });
    });

    describe('GIVEN task scope', () => {
      it('SHOULD return task and subtasks', () => {
        const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
        const result = resolveScope(testBacklog, scope);

        expect(result.length).toBe(3); // Task + 2 subtasks
        expect(result[0].id).toBe('P1.M1.T1');
        expect(result[0].type).toBe('Task');
        expect(result[1].type).toBe('Subtask');
        expect(result[2].type).toBe('Subtask');
      });
    });

    describe('GIVEN subtask scope', () => {
      it('SHOULD return single subtask', () => {
        const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S1' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('P1.M1.T1.S1');
        expect(result[0].type).toBe('Subtask');
      });
    });

    describe('GIVEN non-existent ID', () => {
      it('SHOULD return empty array', () => {
        const scope: Scope = { type: 'phase', id: 'P999' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });
    });

    describe('GIVEN empty backlog', () => {
      it('SHOULD return empty array', () => {
        const emptyBacklog: Backlog = { backlog: [] };
        const scope: Scope = { type: 'all' };
        const result = resolveScope(emptyBacklog, scope);

        expect(result).toEqual([]);
      });
    });
  });

  describe('integration', () => {
    describe('GIVEN parse and resolve flow', () => {
      it('SHOULD parse and resolve "all" scope', () => {
        const scope = parseScope('all');
        const result = resolveScope(createTestBacklog(), scope);

        expect(result.every(item => item.type === 'Subtask')).toBe(true);
      });

      it('SHOULD parse and resolve specific scope', () => {
        const scope = parseScope('P1.M1.T1');
        const result = resolveScope(createTestBacklog(), scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1.M1.T1');
      });
    });
  });
});
```

### Integration Points

```yaml
MODELS:
  - file: src/core/models.ts
  - use_types: "Backlog, Phase, Milestone, Task, Subtask, HierarchyItem"
  - pattern: "Import types, use readonly properties"

TASK_UTILS:
  - file: src/utils/task-utils.ts
  - use_function: "findItem(backlog, id)" - For ID lookups
  - use_type: "HierarchyItem" - Union type for all hierarchy items
  - pattern: "No modifications needed - utility already exists"

TASK_ORCHESTRATOR:
  - file: src/core/task-orchestrator.ts
  - future_integration: "Will consume scope-resolver in P3.M2.T2.S2"
  - pattern: "Import parseScope and resolveScope for scope-based execution"

TESTS:
  - file: tests/unit/core/scope-resolver.test.ts
  - add_tests: "Comprehensive tests for all functions"
  - pattern: "Follow existing test structure with Setup/Execute/Verify"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Type checking with TypeScript
npx tsc --noEmit

# Linting with ESLint (auto-fix issues)
npm run lint -- --fix src/core/scope-resolver.ts
npm run lint -- --fix tests/unit/core/scope-resolver.test.ts

# Format code with Prettier
npm run format -- --write src/core/scope-resolver.ts
npm run format -- --write tests/unit/core/scope-resolver.test.ts

# Project-wide validation
npx tsc --noEmit
npm run lint -- --fix
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific test suites for scope-resolver
npm test -- tests/unit/core/scope-resolver.test.ts --run

# Test with coverage
npm test -- tests/unit/core/scope-resolver.test.ts --run --coverage

# Run all unit tests
npm test -- tests/unit/ --run

# Coverage validation (enforces 100% threshold)
npm test -- --coverage --reporter=term-missing

# Expected: All tests pass. 100% coverage enforced by vitest.config.ts.
# If failing or coverage < 100%, debug root cause and fix implementation.

# Watch mode during development
npm test -- tests/unit/core/scope-resolver.test.ts --watch
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test - verify scope parsing with real backlog
cat > tests/manual/scope-integration.test.ts << 'EOF'
import { Backlog } from '../../src/core/models.js';
import { parseScope, resolveScope } from '../../src/core/scope-resolver.js';
import { SessionManager } from '../../src/core/session-manager.js';

async function testScopeIntegration() {
  const sm = new SessionManager('./PRD.md');
  await sm.initialize();

  const backlog = sm.currentSession.taskRegistry;

  // Test 1: Parse and resolve "all" scope
  console.log('Testing "all" scope...');
  const allScope = parseScope('all');
  const allItems = resolveScope(backlog, allScope);
  console.log(`Found ${allItems.length} items for "all" scope`);
  console.log(`All items are subtasks: ${allItems.every(i => i.type === 'Subtask')}`);

  // Test 2: Parse and resolve phase scope
  console.log('\nTesting "P1" scope...');
  const p1Scope = parseScope('P1');
  const p1Items = resolveScope(backlog, p1Scope);
  console.log(`Found ${p1Items.length} items for "P1" scope`);

  // Test 3: Parse and resolve milestone scope
  console.log('\nTesting "P1.M1" scope...');
  const m1Scope = parseScope('P1.M1');
  const m1Items = resolveScope(backlog, m1Scope);
  console.log(`Found ${m1Items.length} items for "P1.M1" scope`);

  // Test 4: Invalid scope
  console.log('\nTesting invalid scope...');
  try {
    parseScope('invalid');
  } catch (error) {
    console.log(`Caught expected error: ${error.message}`);
  }
}

testScopeIntegration().catch(console.error);
EOF

# Run integration test
npm test -- tests/manual/scope-integration.test.ts

# Expected: All scope types resolve correctly, errors caught as expected
```

### Level 4: Domain-Specific Validation

```bash
# Scope Parser Specific Validations:

# Test 1: Verify all scope input formats are parsed correctly
# Test: parseScope('all'), parseScope('P1'), parseScope('P1.M1'), parseScope('P1.M1.T1'), parseScope('P1.M1.T1.S1')
# Expected: All return correct Scope objects with proper type

# Test 2: Verify invalid formats throw ScopeParseError
# Test: parseScope(''), parseScope('XYZ'), parseScope('P1.X1'), parseScope('P1.M1.T1.S1.X1')
# Expected: All throw ScopeParseError with descriptive messages

# Test 3: Verify "all" scope returns all leaf subtasks
# Test: resolveScope(backlog, { type: 'all' })
# Expected: Returns array containing only Subtask items

# Test 4: Verify specific ID scopes return item and descendants
# Test: resolveScope(backlog, { type: 'task', id: 'P1.M1.T1' })
# Expected: Returns task followed by its subtasks

# Test 5: Verify non-existent IDs return empty array
# Test: resolveScope(backlog, { type: 'phase', id: 'P999' })
# Expected: Returns empty array (no error thrown)

# Test 6: Verify DFS pre-order traversal is preserved
# Test: Resolve milestone scope, check item order
# Expected: Parent appears before children in result array

# Test 7: Verify type guards work correctly
# Test: isScopeType('phase'), isScopeType('invalid')
# Expected: Returns true for valid types, false for invalid

# Test 8: Verify Scope interface validation
# Test: isScope({ type: 'all' }), isScope({ type: 'phase', id: 'P1' })
# Expected: Returns true for valid Scope objects

# Manual validation checklist:
echo "Scope Parser Validation Checklist"
echo "=================================="
echo "[] parseScope() accepts 'all' keyword"
echo "[] parseScope() accepts 'P1' (phase) format"
echo "[] parseScope() accepts 'P1.M1' (milestone) format"
echo "[] parseScope() accepts 'P1.M1.T1' (task) format"
echo "[] parseScope() accepts 'P1.M1.T1.S1' (subtask) format"
echo "[] parseScope() throws ScopeParseError for empty string"
echo "[] parseScope() throws ScopeParseError for invalid format"
echo "[] parseScope() throws ScopeParseError for malformed ID"
echo "[] resolveScope() returns all leaf subtasks for 'all'"
echo "[] resolveScope() returns item and descendants for specific ID"
echo "[] resolveScope() returns empty array for non-existent ID"
echo "[] resolveScope() preserves DFS pre-order traversal"
echo "[] Type guards validate ScopeType correctly"
echo "[] Type guards validate Scope interface correctly"
echo "[] All tests pass with 100% coverage"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/scope-resolver.test.ts --run`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Coverage = 100% for new code (enforced by vitest.config.ts)

### Feature Validation

- [ ] `ScopeType` type exists with all required values
- [ ] `Scope` interface exists with type and optional id
- [ ] `parseScope()` parses "all" correctly
- [ ] `parseScope()` parses phase scopes correctly
- [ ] `parseScope()` parses milestone scopes correctly
- [ ] `parseScope()` parses task scopes correctly
- [ ] `parseScope()` parses subtask scopes correctly
- [ ] `parseScope()` throws `ScopeParseError` for invalid inputs
- [ ] `resolveScope()` returns all leaf subtasks for 'all' scope
- [ ] `resolveScope()` returns item and descendants for specific scopes
- [ ] `resolveScope()` returns empty array for non-existent IDs
- [ ] DFS pre-order traversal is preserved
- [ ] Type guards work correctly

### Code Quality Validation

- [ ] Follows existing string literal union pattern (not TS enum)
- [ ] Uses readonly properties (immutable)
- [ ] Uses existing findItem() utility from task-utils.ts
- [ ] Error messages are descriptive and actionable
- [ ] Tests follow Setup/Execute/Verify pattern
- [ ] JSDoc comments present for all exported functions
- [ ] Factory functions create test data
- [ ] Tests cover all branches and edge cases

### Documentation & Deployment

- [ ] All exported functions have JSDoc with @param, @returns, @throws tags
- [ ] Error messages include expected format
- [ ] Research documents are preserved in research/ subdirectory
- [ ] No TODO comments left in production code
- [ ] Code is self-documenting with clear variable/function names

---

## Anti-Patterns to Avoid

- ❌ Don't use TypeScript enum for ScopeType - use string literal union
- ❌ Don't mutate scope or item properties - use readonly
- ❌ Don't reimplement findItem() - use existing utility from task-utils.ts
- ❌ Don't throw generic Error - use ScopeParseError for parsing failures
- ❌ Don't return null for missing items - return empty array
- ❌ Don't use BFS traversal - use DFS to match existing patterns
- ❌ Don't skip type guards - they provide runtime validation
- ❌ Don't hardcode ID regex patterns - reference models.ts patterns
- ❌ Don't skip "all" keyword handling - it's a special case
- ❌ Don't return all items for "all" scope - return only leaf subtasks
- ❌ Don't throw errors for non-existent IDs in resolveScope - return empty array
- ❌ Don't ignore DFS pre-order traversal - parent before children
- ❌ Don't skip factory functions in tests - they make tests maintainable
- ❌ Don't skip edge case testing - empty strings, invalid formats, etc.
- ❌ Don't skip error message testing - verify expected format is included
- ❌ Don't use lowercase type values - ScopeType is case-sensitive
- ❌ Don't create circular dependencies - scope-resolver should only depend on models and task-utils
- ❌ Don't skip JSDoc comments - exported functions need documentation
- ❌ Don't use console.log for errors - throw ScopeParseError instead

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Reasoning**:
- Complete understanding of existing hierarchy data structures from models.ts
- All external research completed with actionable CLI scope parsing patterns
- Clear contract definition from work item specification
- Comprehensive code examples with exact patterns to follow
- Existing test patterns identified and documented
- Research documents provide industry best practices
- Regex patterns already defined in models.ts to reference
- findItem() utility exists to avoid reimplementation

**Risk Factors**:
- Return type ambiguity in contract (ItemType[] vs HierarchyItem[]) - clarified to use HierarchyItem[]
- "all" scope definition - clarified to return leaf subtasks only
- Depth-to-scope-type mapping - needs careful implementation

**Mitigation**:
- Detailed implementation specification with exact code patterns
- Comprehensive test coverage requirements (100%)
- Factory functions defined for test data
- Clear examples for each scope type
- Error handling patterns specified
- Integration tests validate end-to-end flow
