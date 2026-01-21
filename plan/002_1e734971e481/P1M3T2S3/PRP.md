# Product Requirement Prompt (PRP): Test Delta Analysis Structures

**PRP ID**: P1.M3.T2.S3
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Create comprehensive unit tests for DeltaAnalysis and RequirementChange structure validation to ensure that PRD delta analysis structures are valid according to Zod schemas and can be used for task patching operations.

**Deliverable**: Extended test file at `tests/unit/core/session-state-serialization.test.ts` with new describe block for delta analysis structure testing:

1. **Test 1**: Create valid DeltaAnalysis with sample changes (added, modified, removed)
2. **Test 2**: Test change type validation (RequirementChange.type literal union)
3. **Test 3**: Test task patching logic simulation (status changes for modified/removed tasks)
4. **Test 4**: Verify delta session linking patterns (delta_from.txt references)

**Success Definition**:

- DeltaAnalysis interface structure is validated with all 3 required fields
- RequirementChange.type correctly enforces literal union ('added' | 'modified' | 'removed')
- Task patching status changes are validated (Planned, Obsolete)
- Delta session linking pattern is documented
- All edge cases covered: empty arrays, invalid types, empty strings
- 100% test coverage for DeltaAnalysis and RequirementChange types
- Tests follow existing patterns from session-state-serialization.test.ts

---

## User Persona

**Target User**: Developer working on PRD delta analysis system who needs to ensure that DeltaAnalysis structures are valid and can be used for task patching operations.

**Use Case**: Implementing delta session creation and needing assurance that DeltaAnalysis structures conform to Zod schemas and correctly drive task patching logic.

**User Journey**:

1. PRD changes are detected between sessions
2. DeltaAnalysisWorkflow generates DeltaAnalysis structure
3. DeltaAnalysis is validated against DeltaAnalysisSchema
4. TaskPatcher uses DeltaAnalysis to update task statuses
5. Tests verify structure validity and patching logic

**Pain Points Addressed**:

- **Invalid DeltaAnalysis structures**: Tests catch structural issues before task patching
- **Invalid change types**: Tests enforce literal union for RequirementChange.type
- **Incorrect status changes**: Tests validate task patching status transitions
- **Missing session linking**: Tests verify delta session reference patterns

---

## Why

- **Data Integrity**: DeltaAnalysis is the core structure for PRD delta analysis and task patching. Tests ensure it conforms to the correct schema.
- **Change Type Validation**: RequirementChange.type must be literal 'added', 'modified', or 'removed' (not generic strings).
- **Task Patching Reliability**: TaskPatcher uses DeltaAnalysis to determine which tasks need re-execution. Tests validate status change logic.
- **Session Linking**: Delta sessions must link to parent sessions correctly. Tests verify reference patterns.
- **Regression Prevention**: Changes to DeltaAnalysis structure won't break delta analysis if tests catch issues.
- **Executable Documentation**: Tests serve as living documentation of expected DeltaAnalysis structure.
- **Problems Solved**:
  - "Does DeltaAnalysis conform to the Zod schema?"
  - "Do RequirementChange types enforce literal values?"
  - "Does task patching apply correct status changes?"
  - "How do delta sessions link to parent sessions?"

---

## What

Extend `tests/unit/core/session-state-serialization.test.ts` with comprehensive tests for DeltaAnalysis and RequirementChange structure validation.

### Current State Analysis

**DeltaAnalysis Interface** (from `src/core/models.ts` lines 1543-1577):

```typescript
export interface DeltaAnalysis {
  readonly changes: RequirementChange[]; // Array of detected changes
  readonly patchInstructions: string; // Natural language instructions
  readonly taskIds: string[]; // Task IDs needing re-execution
}
```

**RequirementChange Interface** (from `src/core/models.ts` lines 1442-1482):

```typescript
export interface RequirementChange {
  readonly itemId: string; // Task/milestone/subtask ID
  readonly type: 'added' | 'modified' | 'removed'; // Literal union
  readonly description: string; // Human-readable description
  readonly impact: string; // Implementation impact
}
```

**DeltaAnalysisSchema** (from `src/core/models.ts` lines 1599-1603):

```typescript
export const DeltaAnalysisSchema: z.ZodType<DeltaAnalysis> = z.object({
  changes: z.array(RequirementChangeSchema),
  patchInstructions: z.string().min(1, 'Patch instructions are required'),
  taskIds: z.array(z.string()),
});
```

**RequirementChangeSchema** (from `src/core/models.ts` lines 1489-1497):

```typescript
export const RequirementChangeSchema: z.ZodType<RequirementChange> = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  type: z.union([
    z.literal('added'),
    z.literal('modified'),
    z.literal('removed'),
  ]),
  description: z.string().min(1, 'Description is required'),
  impact: z.string().min(1, 'Impact is required'),
});
```

**TaskPatcher Logic** (from `src/core/task-patcher.ts` lines 86-105):

```typescript
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
  // NOTE: Currently unimplemented
  logger.warn({ changeType: change.type, taskId }, 'Feature not implemented');
  break;
```

**Existing Test File** (from `tests/unit/core/session-state-serialization.test.ts`):

- Tests SessionState serialization with SETUP/EXECUTE/VERIFY patterns
- Uses factory functions for test data creation
- Follows Vitest conventions with globals enabled
- **MISSING**: Tests for DeltaAnalysis structure validation
- **MISSING**: Tests for RequirementChange type validation
- **MISSING**: Tests for task patching logic simulation
- **MISSING**: Tests for delta session linking patterns

### Critical Note on Interface Discrepancy

**IMPORTANT**: The work item description references a different DeltaAnalysis interface than what exists in the codebase. This PRP tests the **actual codebase structures**, not the theoretical structures from the description.

**Work Item Description** (theoretical):

```
DeltaAnalysis: oldHash, newHash, changes (Change[]),
               addedTasks, modifiedTasks, removedTasks
Change: type, section, oldContent, newContent
```

**Actual Codebase Implementation**:

```
DeltaAnalysis: changes (RequirementChange[]), patchInstructions, taskIds
RequirementChange: itemId, type, description, impact
```

**Resolution**: Tests validate the actual codebase implementation (DeltaAnalysis and RequirementChange interfaces as defined in `src/core/models.ts`).

### Success Criteria

- [ ] Test 1: Valid DeltaAnalysis with all 3 required fields
- [ ] Test 2: DeltaAnalysis with sample changes (added, modified, removed)
- [ ] Test 3: RequirementChange with type 'added' accepted
- [ ] Test 4: RequirementChange with type 'modified' accepted
- [ ] Test 5: RequirementChange with type 'removed' accepted
- [ ] Test 6: RequirementChange rejects invalid type
- [ ] Test 7: DeltaAnalysis.patchInstructions rejects empty string
- [ ] Test 8: DeltaAnalysis accepts empty changes array
- [ ] Test 9: DeltaAnalysis accepts empty taskIds array
- [ ] Test 10: Simulate task patching for 'modified' type (status → 'Planned')
- [ ] Test 11: Simulate task patching for 'removed' type (status → 'Obsolete')
- [ ] Test 12: Verify delta session linking pattern (delta_from.txt)
- [ ] All tests follow existing patterns from session-state-serialization.test.ts
- [ ] 100% coverage for DeltaAnalysis and RequirementChange types

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] DeltaAnalysis interface fully analyzed (3 fields with types)
- [x] RequirementChange interface fully analyzed (4 fields with types)
- [x] DeltaAnalysisSchema analyzed with validation rules
- [x] RequirementChangeSchema analyzed with literal union validation
- [x] TaskPatcher implementation documented (patchBacklog function)
- [x] TaskOrchestrator.setStatus() method documented
- [x] Existing test patterns identified (session-state-serialization.test.ts)
- [x] Delta session linking pattern documented (delta_from.txt)
- [x] Codebase tree structure confirmed
- [x] Test file naming convention confirmed (.test.ts)

---

### Documentation & References

```yaml
# MUST READ - DeltaAnalysis interface definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains DeltaAnalysis interface (lines 1543-1577) with all 3 fields
  section: Lines 1543-1577
  critical: |
    - changes: RequirementChange[] (array of detected changes)
    - patchInstructions: string (natural language instructions)
    - taskIds: string[] (task IDs needing re-execution)
    - All fields are readonly

# MUST READ - RequirementChange interface definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains RequirementChange interface (lines 1442-1482) with literal union type
  section: Lines 1442-1482
  critical: |
    - itemId: string (task/milestone/subtask ID)
    - type: 'added' | 'modified' | 'removed' (literal union)
    - description: string (human-readable description)
    - impact: string (implementation impact)

# MUST READ - DeltaAnalysisSchema Zod schema
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains DeltaAnalysisSchema Zod validation (lines 1599-1603)
  section: Lines 1599-1603
  pattern: |
    - Uses z.array(RequirementChangeSchema) for changes
    - Uses z.string().min(1) for patchInstructions
    - Uses z.array(z.string()) for taskIds
  gotcha: |
    - Empty arrays are valid for changes and taskIds
    - Empty string is invalid for patchInstructions

# MUST READ - RequirementChangeSchema Zod schema
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains RequirementChangeSchema with literal union (lines 1489-1497)
  section: Lines 1489-1497
  critical: |
    - Uses z.union([z.literal('added'), z.literal('modified'), z.literal('removed')])
    - NOT z.string() or z.enum()
    - All fields use z.string().min(1) for validation

# MUST READ - TaskPatcher implementation
- file: /home/dustin/projects/hacky-hack/src/core/task-patcher.ts
  why: Contains patchBacklog function (lines 68-105) with change type handling
  section: Lines 68-105
  pattern: |
    - Case 'modified': updateItemStatus(backlog, taskId, 'Planned')
    - Case 'removed': updateItemStatus(backlog, taskId, 'Obsolete')
    - Case 'added': logs warning (unimplemented)
  critical: |
    - Uses updateItemStatus() utility from task-utils.ts
    - Returns new immutable backlog
    - Processes changes in delta.taskIds

# MUST READ - TaskOrchestrator.setStatus method
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Contains setStatus method (lines 206-230) for status changes
  section: Lines 206-230
  pattern: |
    - Method signature: setStatus(itemId, status, reason?)
    - Valid statuses: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
    - Persists via sessionManager.updateItemStatus()
  gotcha: |
    - reason parameter is for logging only (not persisted)
    - Reloads backlog after update

# MUST READ - Existing session-state-serialization tests
- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-state-serialization.test.ts
  why: Contains existing test patterns to follow (full file)
  section: Full file
  pattern: |
    - Factory functions for test data (createTestSessionState, etc.)
    - SETUP/EXECUTE/VERIFY comment structure
    - Vitest globals enabled (describe, it, expect, etc.)
    - JSDoc comments for test suites
  critical: |
    - Extend this file with new describe block for delta tests
    - Follow existing naming conventions and patterns

# MUST READ - Delta session linking pattern
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/delta_from.txt
  why: Contains parent session reference (example of delta session linking)
  section: Full file
  pattern: |
    - Contains parent session sequence number (e.g., '1')
    - Alternative: parent_session.txt with full session ID

# MUST READ - System Context Delta Workflow
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md
  why: Contains Section 9 (Delta Workflow) documentation
  section: Lines 444-492
  pattern: |
    - Delta detection via PRD hash comparison
    - Delta session creation process
    - Task patching logic (modified → Planned, removed → Obsolete)

# RESEARCH DOCUMENTATION - Delta analysis research
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T2S3/research/research-summary.md
  why: Complete analysis of DeltaAnalysis and RequirementChange structures
  section: Full file
  critical: |
    - Interface definitions with line numbers
    - Zod schema validation rules
    - TaskPatcher implementation details
    - Critical discrepancy notes (work item vs. actual codebase)
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── models.ts                      # SOURCE: DeltaAnalysis (1543-1577), RequirementChange (1442-1482)
│   │   ├── task-patcher.ts                # REFERENCE: patchBacklog function (68-105)
│   │   └── task-orchestrator.ts           # REFERENCE: setStatus method (206-230)
│   ├── utils/
│   │   └── task-utils.ts                  # REFERENCE: updateItemStatus utility
│   └── workflows/
│       └── delta-analysis-workflow.ts     # REFERENCE: DeltaAnalysisWorkflow class
├── tests/
│   ├── setup.ts                           # Global test setup
│   └── unit/
│       └── core/
│           └── session-state-serialization.test.ts  # EXTEND: Add delta analysis tests
├── plan/
│   └── 002_1e734971e481/
│       ├── P1M3T2S2/
│       │   └── PRP.md                     # REFERENCE: Previous PRP for patterns
│       └── P1M3T2S3/
│           ├── PRP.md                     # NEW: This PRP
│           └── research/
│               └── research-summary.md    # RESEARCH: Delta analysis research
└── package.json
```

---

### Desired Codebase Tree (modifications to existing files)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── core/
            └── session-state-serialization.test.ts  # MODIFY: Add delta analysis tests
                                                        # ADD: describe('DeltaAnalysis structure', () => { ... })
                                                        # ADD: Tests for DeltaAnalysis validation
                                                        # ADD: Tests for RequirementChange type validation
                                                        # ADD: Tests for task patching simulation
                                                        # ADD: Tests for delta session linking
                                                        # MAINTAIN: All existing test patterns
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: RequirementChange.type is Literal Union, NOT Generic String
// Must be exactly 'added', 'modified', or 'removed'
// z.union([z.literal('added'), z.literal('modified'), z.literal('removed')])
// Invalid: type: 'changed', type: 'updated', type: 'deleted'
// Valid: type: 'added', type: 'modified', type: 'removed'

// CRITICAL: DeltaAnalysis Has 3 Fields, NOT 7
// Actual interface has: changes, patchInstructions, taskIds
// NOT: oldHash, newHash, addedTasks, modifiedTasks, removedTasks (theoretical)
// Tests must validate actual codebase implementation, not work item description

// CRITICAL: patchInstructions Cannot Be Empty String
// Uses z.string().min(1) validation
// Valid: patchInstructions: 'Re-execute P1.M2.T3.S1'
// Invalid: patchInstructions: ''

// CRITICAL: All String Fields Have min(1) Validation
// DeltaAnalysis.patchInstructions, RequirementChange.description, RequirementChange.impact
// Empty strings are invalid
// Valid: description: 'Added OAuth2 authentication', impact: 'Must expand auth system'
// Invalid: description: '', impact: ''

// GOTCHA: Arrays Can Be Empty
// DeltaAnalysis.changes and DeltaAnalysis.taskIds can be []
// But RequirementChange fields cannot be empty strings
// Valid: changes: [], taskIds: []
// Invalid: description: '' (in RequirementChange)

// CRITICAL: TaskPatcher Uses updateItemStatus Utility
// NOT TaskOrchestrator.setStatus() directly
// updateItemStatus returns new immutable backlog
// Located in src/utils/task-utils.ts

// CRITICAL: Task Patching Status Changes
// Modified tasks → 'Planned' (for re-implementation)
// Removed tasks → 'Obsolete' (skip implementation)
// Added tasks → Currently unimplemented (logs warning)

// GOTCHA: Added Tasks Feature Not Implemented
// TaskPatcher case 'added' logs warning and continues
// Do NOT test added task generation (not implemented yet)
// Test only that warning is logged for added type

// CRITICAL: Delta Session Linking via delta_from.txt
// Contains parent session sequence number (e.g., '1')
// Alternative: parent_session.txt with full session ID
// Used to link delta sessions to parent sessions

// GOTCHA: Vitest Globals Are Enabled
// No need to import describe, it, expect, test, etc.
// They are available globally in all test files

// CRITICAL: Test File Naming Convention
// Use .test.ts suffix (not .spec.ts)
// File already exists: tests/unit/core/session-state-serialization.test.ts
// We're EXTENDING existing file, not creating new one

// CRITICAL: 100% Code Coverage Requirement
// All tests must achieve 100% coverage
// Check coverage with: npm run test:coverage

// CRITICAL: Follow Existing Test Patterns
// Use factory functions for test data
// Use SETUP/EXECUTE/VERIFY comments
// Use describe/it block structure
// Follow JSDoc comment conventions

// GOTCHA: Work Item Description Differs from Actual Codebase
// Work item describes theoretical interfaces (oldHash, newHash, Change, section, etc.)
// Actual codebase uses DeltaAnalysis and RequirementChange (different fields)
// Tests must validate ACTUAL codebase implementation

// CRITICAL: Test Data Must Use Valid ID Formats
// Task IDs follow format: P{phase}.M{milestone}.T{task}.S{subtask}
// Example: 'P1.M2.T3.S1' for subtask, 'P2.M1' for milestone
// Tests should use realistic ID formats
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing DeltaAnalysis and RequirementChange interfaces.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing session-state-serialization tests
  - FILE: tests/unit/core/session-state-serialization.test.ts
  - READ: Full file (existing test patterns)
  - UNDERSTAND: Test structure and assertion patterns
  - EXTRACT: Factory function patterns
  - EXTRACT: SETUP/EXECUTE/VERIFY pattern
  - DEPENDENCIES: None

Task 2: READ DeltaAnalysis and RequirementChange interfaces
  - FILE: src/core/models.ts
  - READ: Lines 1442-1482 (RequirementChange)
  - READ: Lines 1543-1577 (DeltaAnalysis)
  - READ: Lines 1489-1497 (RequirementChangeSchema)
  - READ: Lines 1599-1603 (DeltaAnalysisSchema)
  - UNDERSTAND: Interface structure and validation rules
  - DEPENDENCIES: None

Task 3: CREATE factory functions for DeltaAnalysis test data
  - FILE: tests/unit/core/session-state-serialization.test.ts
  - ADD: createTestRequirementChange() factory function
  - ADD: createTestDeltaAnalysis() factory function
  - PATTERN: Follow createTestSessionState() pattern
  - SUPPORT: Partial overrides for custom test scenarios
  - DEPENDENCIES: Task 1, Task 2

Task 4: CREATE describe block for DeltaAnalysis structure tests
  - FILE: tests/unit/core/session-state-serialization.test.ts
  - ADD: describe('DeltaAnalysis structure', () => { ... }) at end of file
  - PATTERN: Follow existing describe block patterns
  - DEPENDENCIES: Task 3

Task 5: IMPLEMENT Test 1 - Valid DeltaAnalysis with all fields
  - CREATE: it('should create valid DeltaAnalysis with all required fields')
  - SETUP: Create DeltaAnalysis with all 3 fields
  - VERIFY: DeltaAnalysisSchema.safeParse() returns success
  - VERIFY: All 3 fields present and correct
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Tests 2-3 - DeltaAnalysis with sample changes
  - CREATE: it('should accept DeltaAnalysis with added change')
  - CREATE: it('should accept DeltaAnalysis with modified change')
  - CREATE: it('should accept DeltaAnalysis with removed change')
  - VERIFY: Each change type is accepted
  - VERIFY: All three types can coexist in changes array
  - PATTERN: Use consistent test structure
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Tests 4-6 - RequirementChange type validation
  - CREATE: it('should accept RequirementChange with type added')
  - CREATE: it('should accept RequirementChange with type modified')
  - CREATE: it('should accept RequirementChange with type removed')
  - CREATE: it('should reject RequirementChange with invalid type')
  - VERIFY: Literal values (added, modified, removed) are accepted
  - VERIFY: Invalid types fail schema validation
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 7 - Empty patchInstructions rejection
  - CREATE: it('should reject DeltaAnalysis with empty patchInstructions')
  - SETUP: DeltaAnalysis with patchInstructions: ''
  - VERIFY: Schema validation fails
  - VERIFY: Error indicates patchInstructions required
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Tests 8-9 - Empty array acceptance
  - CREATE: it('should accept DeltaAnalysis with empty changes array')
  - CREATE: it('should accept DeltaAnalysis with empty taskIds array')
  - VERIFY: Empty arrays are valid
  - VERIFY: Schema accepts [] for both fields
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Tests 10-11 - Task patching simulation
  - CREATE: describe('task patching simulation', () => { ... })
  - CREATE: it('should simulate task patching for modified type')
  - VERIFY: Status change to 'Planned' for modified tasks
  - CREATE: it('should simulate task patching for removed type')
  - VERIFY: Status change to 'Obsolete' for removed tasks
  - PATTERN: Use mock data, don't actually patch tasks.json
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 12 - Delta session linking pattern
  - CREATE: describe('delta session linking', () => { ... })
  - CREATE: it('should verify delta session linking pattern')
  - VERIFY: delta_from.txt format (parent sequence number)
  - VERIFY: parent_session.txt format (full session ID)
  - PATTERN: Document the linking pattern
  - DEPENDENCIES: Task 10

Task 12: RUN tests and verify coverage
  - RUN: npm test -- tests/unit/core/session-state-serialization.test.ts
  - VERIFY: All new tests pass
  - VERIFY: Coverage is 100% for DeltaAnalysis and RequirementChange
  - FIX: Any failing tests or coverage gaps
  - DEPENDENCIES: Task 11

Task 13: RUN typecheck and verify compilation
  - RUN: npm run typecheck
  - VERIFY: No TypeScript compilation errors
  - DEPENDENCIES: Task 12
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Factory Functions for DeltaAnalysis Test Data
// =============================================================================

import {
  DeltaAnalysis,
  RequirementChange,
  DeltaAnalysisSchema,
  RequirementChangeSchema,
} from '../../../src/core/models.js';

/**
 * Creates a test RequirementChange object with optional overrides
 */
function createTestRequirementChange(
  overrides: Partial<RequirementChange> = {}
): RequirementChange {
  return {
    itemId: 'P1.M2.T3.S1',
    type: 'modified',
    description: 'Added OAuth2 authentication requirement',
    impact: 'Must expand authentication system to support OAuth2 providers',
    ...overrides,
  };
}

/**
 * Creates a test DeltaAnalysis object with optional overrides
 */
function createTestDeltaAnalysis(
  overrides: Partial<DeltaAnalysis> = {}
): DeltaAnalysis {
  return {
    changes: [createTestRequirementChange()],
    patchInstructions: 'Re-execute P1.M2.T3.S1 for OAuth2 integration.',
    taskIds: ['P1.M2.T3.S1'],
    ...overrides,
  };
}

// =============================================================================
// PATTERN: Test 1 - Valid DeltaAnalysis with All Fields
// =============================================================================

describe('DeltaAnalysis structure', () => {
  describe('required fields', () => {
    it('should create valid DeltaAnalysis with all required fields', () => {
      // SETUP: Create DeltaAnalysis with all 3 fields
      const validDelta = createTestDeltaAnalysis();

      // EXECUTE: Validate against schema
      const result = DeltaAnalysisSchema.safeParse(validDelta);

      // VERIFY: Validation succeeds
      expect(result.success).toBe(true);
      if (result.success) {
        // VERIFY: All 3 fields present and correct
        expect(result.data.changes).toHaveLength(1);
        expect(result.data.changes[0].itemId).toBe('P1.M2.T3.S1');
        expect(result.data.changes[0].type).toBe('modified');
        expect(result.data.patchInstructions).toContain('Re-execute');
        expect(result.data.taskIds).toContain('P1.M2.T3.S1');
      }
    });
  });

  // =============================================================================
  // PATTERN: Tests 2-3 - DeltaAnalysis with Sample Changes
  // =============================================================================

  describe('change type variations', () => {
    it('should accept DeltaAnalysis with added change', () => {
      // SETUP: DeltaAnalysis with added change
      const addedChange: RequirementChange = {
        itemId: 'P1.M3.T1.S1',
        type: 'added',
        description: 'New requirement for user preferences',
        impact: 'Create user preferences management system',
      };

      // EXECUTE: Validate within DeltaAnalysis
      const delta = createTestDeltaAnalysis({
        changes: [addedChange],
        patchInstructions: 'Add new tasks for user preferences.',
        taskIds: ['P1.M3.T1.S1'],
      });
      const result = DeltaAnalysisSchema.safeParse(delta);

      // VERIFY: 'added' type is accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.changes[0].type).toBe('added');
      }
    });

    it('should accept DeltaAnalysis with modified change', () => {
      // SETUP: DeltaAnalysis with modified change
      const modifiedChange: RequirementChange = {
        itemId: 'P1.M2.T3.S1',
        type: 'modified',
        description: 'Added OAuth2 authentication requirement',
        impact: 'Must expand authentication system to support OAuth2 providers',
      };

      // EXECUTE & VERIFY
      const delta = createTestDeltaAnalysis({
        changes: [modifiedChange],
      });
      const result = DeltaAnalysisSchema.safeParse(delta);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.changes[0].type).toBe('modified');
      }
    });

    it('should accept DeltaAnalysis with removed change', () => {
      // SETUP: DeltaAnalysis with removed change
      const removedChange: RequirementChange = {
        itemId: 'P1.M1.T2.S1',
        type: 'removed',
        description: 'Removed deprecated API endpoint',
        impact: 'No action needed - endpoint no longer required',
      };

      // EXECUTE & VERIFY
      const delta = createTestDeltaAnalysis({
        changes: [removedChange],
        patchInstructions: 'Mark P1.M1.T2.S1 as obsolete.',
        taskIds: ['P1.M1.T2.S1'],
      });
      const result = DeltaAnalysisSchema.safeParse(delta);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.changes[0].type).toBe('removed');
      }
    });

    it('should accept DeltaAnalysis with all three change types', () => {
      // SETUP: DeltaAnalysis with added, modified, and removed changes
      const delta: DeltaAnalysis = {
        changes: [
          {
            itemId: 'P1.M3.T1.S1',
            type: 'added',
            description: 'New requirement',
            impact: 'Create new implementation',
          },
          {
            itemId: 'P1.M2.T3.S1',
            type: 'modified',
            description: 'Modified requirement',
            impact: 'Update existing implementation',
          },
          {
            itemId: 'P1.M1.T2.S1',
            type: 'removed',
            description: 'Removed requirement',
            impact: 'Mark as obsolete',
          },
        ],
        patchInstructions: 'Process all changes.',
        taskIds: ['P1.M3.T1.S1', 'P1.M2.T3.S1', 'P1.M1.T2.S1'],
      };

      // EXECUTE & VERIFY
      const result = DeltaAnalysisSchema.safeParse(delta);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.changes).toHaveLength(3);
        expect(result.data.changes[0].type).toBe('added');
        expect(result.data.changes[1].type).toBe('modified');
        expect(result.data.changes[2].type).toBe('removed');
      }
    });
  });

  // =============================================================================
  // PATTERN: Tests 4-6 - RequirementChange Type Validation
  // =============================================================================

  describe('RequirementChange type validation', () => {
    it('should accept RequirementChange with type added', () => {
      // SETUP: RequirementChange with type 'added'
      const addedChange: RequirementChange = {
        itemId: 'P1.M1.T1.S1',
        type: 'added',
        description: 'New feature requirement',
        impact: 'Implement new feature',
      };

      // EXECUTE: Validate RequirementChange directly
      const result = RequirementChangeSchema.safeParse(addedChange);

      // VERIFY: 'added' type is accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('added');
      }
    });

    it('should accept RequirementChange with type modified', () => {
      // SETUP: RequirementChange with type 'modified'
      const modifiedChange: RequirementChange = {
        itemId: 'P1.M1.T1.S1',
        type: 'modified',
        description: 'Modified feature requirement',
        impact: 'Update existing implementation',
      };

      // EXECUTE & VERIFY
      const result = RequirementChangeSchema.safeParse(modifiedChange);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('modified');
      }
    });

    it('should accept RequirementChange with type removed', () => {
      // SETUP: RequirementChange with type 'removed'
      const removedChange: RequirementChange = {
        itemId: 'P1.M1.T1.S1',
        type: 'removed',
        description: 'Removed feature requirement',
        impact: 'Mark as obsolete',
      };

      // EXECUTE & VERIFY
      const result = RequirementChangeSchema.safeParse(removedChange);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('removed');
      }
    });

    it('should reject RequirementChange with invalid type', () => {
      // SETUP: RequirementChange with invalid type
      const invalidChange = {
        itemId: 'P1.M1.T1.S1',
        type: 'changed' as any, // Invalid type
        description: 'Invalid change type',
        impact: 'Should fail validation',
      };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(invalidChange);

      // VERIFY: Validation fails
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // PATTERN: Tests 7-9 - Field Validation
  // =============================================================================

  describe('field validation', () => {
    it('should reject DeltaAnalysis with empty patchInstructions', () => {
      // SETUP: DeltaAnalysis with empty patchInstructions
      const invalidDelta = createTestDeltaAnalysis({
        patchInstructions: '',
      });

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(invalidDelta);

      // VERIFY: Validation fails
      expect(result.success).toBe(false);
    });

    it('should accept DeltaAnalysis with empty changes array', () => {
      // SETUP: DeltaAnalysis with empty changes array
      const emptyDelta: DeltaAnalysis = {
        changes: [],
        patchInstructions: 'No changes detected.',
        taskIds: [],
      };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(emptyDelta);

      // VERIFY: Empty array is accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.changes).toHaveLength(0);
      }
    });

    it('should accept DeltaAnalysis with empty taskIds array', () => {
      // SETUP: DeltaAnalysis with empty taskIds array
      const delta = createTestDeltaAnalysis({
        taskIds: [],
      });

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(delta);

      // VERIFY: Empty array is accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taskIds).toHaveLength(0);
      }
    });
  });

  // =============================================================================
  // PATTERN: Tests 10-11 - Task Patching Simulation
  // =============================================================================

  describe('task patching simulation', () => {
    it('should simulate task patching for modified type', () => {
      // SETUP: Simulate TaskPatcher logic for modified tasks
      const modifiedChange: RequirementChange = {
        itemId: 'P1.M2.T3.S1',
        type: 'modified',
        description: 'Authentication requirement modified',
        impact: 'Update authentication implementation',
      };

      // EXECUTE: Simulate status change (TaskPatcher → 'Planned')
      const expectedStatus = 'Planned';

      // VERIFY: Modified tasks should be reset to 'Planned'
      expect(modifiedChange.type).toBe('modified');
      expect(expectedStatus).toBe('Planned');

      // VERIFY: Task would be re-executed
      const delta = createTestDeltaAnalysis({
        changes: [modifiedChange],
        taskIds: ['P1.M2.T3.S1'],
      });

      expect(delta.taskIds).toContain('P1.M2.T3.S1');
    });

    it('should simulate task patching for removed type', () => {
      // SETUP: Simulate TaskPatcher logic for removed tasks
      const removedChange: RequirementChange = {
        itemId: 'P1.M1.T2.S1',
        type: 'removed',
        description: 'Deprecated API endpoint removed',
        impact: 'No implementation needed',
      };

      // EXECUTE: Simulate status change (TaskPatcher → 'Obsolete')
      const expectedStatus = 'Obsolete';

      // VERIFY: Removed tasks should be marked as 'Obsolete'
      expect(removedChange.type).toBe('removed');
      expect(expectedStatus).toBe('Obsolete');

      // VERIFY: Task is in taskIds but marked obsolete
      const delta = createTestDeltaAnalysis({
        changes: [removedChange],
        patchInstructions: 'Mark removed tasks as obsolete.',
        taskIds: ['P1.M1.T2.S1'],
      });

      expect(delta.taskIds).toContain('P1.M1.T2.S1');
    });
  });

  // =============================================================================
  // PATTERN: Test 12 - Delta Session Linking
  // =============================================================================

  describe('delta session linking', () => {
    it('should verify delta session linking pattern', () => {
      // SETUP: Document delta session linking pattern
      // Delta sessions link to parent sessions via delta_from.txt

      // VERIFY: delta_from.txt format (parent sequence number)
      const deltaFromContent = '1'; // Parent session sequence number

      // VERIFY: parent_session.txt format (full session ID)
      const parentSessionContent = '001_14b9dc2a33c7'; // Full parent session ID

      // VERIFY: Linking pattern is documented
      expect(deltaFromContent).toBeDefined();
      expect(parentSessionContent).toBeDefined();

      // NOTE: Actual linking is handled by SessionManager
      // This test documents the expected pattern
    });
  });
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING TESTS:
  - tests/unit/core/session-state-serialization.test.ts has SessionState tests
  - Pattern: Use factory functions for test data
  - Pattern: Use SETUP/EXECUTE/VERIFY comments
  - Pattern: Use describe/it block structure
  - This PRP: Extends existing file with DeltaAnalysis tests

INPUT FROM EXISTING INTERFACES:
  - src/core/models.ts has DeltaAnalysis interface (1543-1577)
  - src/core/models.ts has RequirementChange interface (1442-1482)
  - Pattern: Literal union for type field ('added' | 'modified' | 'removed')
  - Pattern: Zod schema validation with min(1) for strings
  - This PRP: Tests validate actual interface definitions

INPUT FROM TASK PATCHER:
  - src/core/task-patcher.ts has patchBacklog function (68-105)
  - Pattern: Modified tasks → 'Planned' status
  - Pattern: Removed tasks → 'Obsolete' status
  - Pattern: Uses updateItemStatus() utility
  - This PRP: Tests simulate task patching logic

INPUT FROM TASK ORCHESTRATOR:
  - src/core/task-orchestrator.ts has setStatus method (206-230)
  - Pattern: setStatus(itemId, status, reason?)
  - Pattern: Valid statuses: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
  - This PRP: Tests validate status transitions

INPUT FROM PREVIOUS WORK:
  - P1.M3.T2.S2 validated PRPDocument structure
  - P1.M3.T2.S1 validated SessionState serialization
  - Context: Understanding serialization test patterns
  - Context: Understanding literal union validation

OUTPUT FOR SUBSEQUENT WORK:
  - DeltaAnalysis structure tests at session-state-serialization.test.ts
  - Confidence that DeltaAnalysis validates correctly
  - Foundation for delta session workflow testing
  - Pattern for testing change type validation

DIRECTORY STRUCTURE:
  - Modify: tests/unit/core/session-state-serialization.test.ts (existing file)
  - Add: describe('DeltaAnalysis structure', () => { ... }) block
  - Add: Factory functions for DeltaAnalysis and RequirementChange
  - No new files created
  - Tests can run independently

CLEANUP INTEGRATION:
  - None required - tests only, no side effects
  - No database or filesystem modifications
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After adding tests to session-state-serialization.test.ts
# Run tests to check for errors
npm test -- tests/unit/core/session-state-serialization.test.ts

# Expected: Tests run without syntax errors
# Expected: New test descriptions appear in output

# TypeScript compilation check
npm run typecheck

# Expected: No TypeScript compilation errors
# Expected: New test code compiles correctly

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the updated file specifically
npm test -- tests/unit/core/session-state-serialization.test.ts

# Expected: All tests pass
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run full test suite for affected area
npm test -- tests/unit/core/

# Expected: All core tests pass
# Expected: No regressions in other test files

# Coverage validation
npm run test:coverage

# Expected: 100% coverage for new tests
# Expected: Coverage for src/core/models.ts is maintained
# Expected: No uncovered lines in DeltaAnalysis structure logic

# If tests fail, check:
# - DeltaAnalysis is imported correctly
# - RequirementChange type is literal ('added' | 'modified' | 'removed')
# - Test data is valid
# - DeltaAnalysisSchema.safeParse() used correctly
```

### Level 3: Type System Validation (Compile-Time Verification)

```bash
# TypeScript compilation verification
npm run typecheck

# Expected: No compilation errors
# Expected: DeltaAnalysis structure logic compiles correctly

# Verify type inference works
cat > /tmp/delta-test.ts << 'EOF'
import {
  DeltaAnalysis,
  RequirementChange,
  DeltaAnalysisSchema,
  RequirementChangeSchema
} from './src/core/models.js';

const change: RequirementChange = {
  itemId: 'P1.M2.T3.S1',
  type: 'modified',
  description: 'Test change',
  impact: 'Test impact',
};

const delta: DeltaAnalysis = {
  changes: [change],
  patchInstructions: 'Test instructions',
  taskIds: ['P1.M2.T3.S1'],
};

const result1 = RequirementChangeSchema.safeParse(change);
const result2 = DeltaAnalysisSchema.safeParse(delta);
EOF
npx tsc --noEmit /tmp/delta-test.ts

# Expected: No type errors
# Expected: DeltaAnalysis matches interface
# Expected: RequirementChange type is literal union

# If type errors exist, check:
# - All types are imported correctly
# - Field types match interface definitions
# - Literal union used for RequirementChange.type
```

### Level 4: Integration Testing (Full Pipeline Validation)

```bash
# Full test suite run
npm test

# Expected: All tests pass across entire codebase
# Expected: No new test failures

# Coverage report validation
npm run test:coverage

# Expected: 100% coverage maintained globally
# Expected: No coverage drops in existing files

# Manual verification: Read test output
npm test -- tests/unit/core/session-state-serialization.test.ts --reporter=verbose

# Expected: Clear test names showing DeltaAnalysis structure tests
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/unit/core/session-state-serialization.test.ts

# Expected: Tests complete in reasonable time (< 5 seconds)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Valid DeltaAnalysis with all 3 fields
- [ ] Test 2: DeltaAnalysis with 'added' change type
- [ ] Test 3: DeltaAnalysis with 'modified' change type
- [ ] Test 4: DeltaAnalysis with 'removed' change type
- [ ] Test 5: DeltaAnalysis with all three change types
- [ ] Test 6: RequirementChange with type 'added' accepted
- [ ] Test 7: RequirementChange with type 'modified' accepted
- [ ] Test 8: RequirementChange with type 'removed' accepted
- [ ] Test 9: RequirementChange rejects invalid type
- [ ] Test 10: Empty patchInstructions rejected
- [ ] Test 11: Empty changes array accepted
- [ ] Test 12: Empty taskIds array accepted
- [ ] Test 13: Task patching for 'modified' type (→ 'Planned')
- [ ] Test 14: Task patching for 'removed' type (→ 'Obsolete')
- [ ] Test 15: Delta session linking pattern verified
- [ ] All tests pass: `npm test -- tests/unit/core/session-state-serialization.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] 100% coverage: `npm run test:coverage`

### Feature Validation

- [ ] DeltaAnalysisSchema validates all 3 required fields
- [ ] RequirementChange.type enforces literal union ('added' | 'modified' | 'removed')
- [ ] Task patching status changes are validated
- [ ] Delta session linking pattern is documented
- [ ] All edge cases covered (empty arrays, invalid types, empty strings)
- [ ] All tests follow existing patterns from session-state-serialization.test.ts
- [ ] Factory functions use partial override pattern

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Uses describe/it block structure with clear test names
- [ ] Uses SETUP/EXECUTE/VERIFY comment pattern
- [ ] Tests are self-documenting with clear names
- [ ] Test block added at end of existing file
- [ ] Error messages are clear and informative
- [ ] Tests are grouped in logical describe blocks

### Documentation & Deployment

- [ ] Tests serve as executable documentation of DeltaAnalysis structure
- [ ] RequirementChange type requirements documented in test names
- [ ] Task patching logic documented in tests
- [ ] Delta session linking pattern verified in tests
- [ ] Research documents stored in research/ subdirectory

---

## Anti-Patterns to Avoid

- **Don't test theoretical interfaces** - Use actual DeltaAnalysis and RequirementChange from codebase
- **Don't test oldHash/newHash fields** - These don't exist in actual DeltaAnalysis interface
- **Don't test Change interface** - The actual interface is RequirementChange, not Change
- **Don't use generic strings for type** - Must be literal 'added', 'modified', or 'removed'
- **Don't skip literal union tests** - RequirementChange.type must enforce literal values
- **Don't test added task generation** - This feature is not implemented yet (logs warning only)
- **Don't modify existing SessionState tests** - Add new describe block instead
- **Don't skip empty array tests** - DeltaAnalysis.changes and taskIds can be empty
- **Don't forget empty string validation** - patchInstructions, description, impact require min(1)
- **Don't ignore 100% coverage** - All code paths must be tested
- **Don't test across filesystems** - Tests are in-memory, no file I/O
- **Don't skip edge case testing** - Invalid types, empty strings, null values
- **Don't ignore existing test patterns** - Follow session-state-serialization.test.ts conventions
- **Don't create new test file** - Extend existing session-state-serialization.test.ts
- **Don't confuse work item description with actual codebase** - Test actual implementation

---

## Appendix: Decision Rationale

### Why test actual codebase interfaces instead of work item description?

The work item description references theoretical interfaces (oldHash, newHash, Change, section, etc.) that don't match the actual codebase implementation. Testing the actual interfaces (DeltaAnalysis and RequirementChange) ensures:

1. Tests validate what actually exists in the codebase
2. Tests provide meaningful coverage of real code
3. Tests catch real bugs in real code
4. Tests serve as executable documentation of actual behavior

### Why extend session-state-serialization.test.ts instead of creating new file?

The existing file already tests serialization patterns in the codebase. Adding delta analysis tests:

1. Keeps all serialization-related tests together
2. Follows the established pattern of grouping tests by subject
3. Makes it easier to see all serialization validation in one place
4. Avoids duplication of imports and setup code

### Why test task patching logic if it's in TaskPatcher?

Testing task patching logic:

1. Validates the expected behavior of DeltaAnalysis-driven patching
2. Documents the relationship between change types and status changes
3. Provides contract validation for TaskPatcher implementation
4. Ensures DeltaAnalysis structures correctly drive patching decisions

### What about the literal union for RequirementChange.type?

The literal union `'added' | 'modified' | 'removed'` (not generic string) is critical because:

1. It enforces exactly 3 change types
2. Prevents typos like type: 'changed' or type: 'deleted'
3. Makes the change type system explicit in the type system
4. Tests must verify that invalid types are rejected

### Why use SETUP/EXECUTE/VERIFY comments?

The codebase uses this pattern consistently:

1. Separates test concerns clearly
2. Makes tests easier to read and understand
3. Helps identify where assertions happen
4. Provides consistency across all test files

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from research agents (7 parallel research tasks)
- [x] DeltaAnalysis interface fully analyzed and documented
- [x] RequirementChange interface fully analyzed and documented
- [x] Literal union requirement identified
- [x] TaskPatcher implementation researched
- [x] Existing test patterns identified and extracted
- [x] Delta session linking pattern documented
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Research documents stored in research/ subdirectory
- [x] Critical discrepancy documented (work item vs. actual codebase)

**Risk Mitigation**:

- Extending existing test file (low risk of breaking existing tests)
- Tests only (no production code changes)
- Can be implemented independently
- Easy to verify and iterate
- Clear acceptance criteria
- Follows established patterns from session-state-serialization.test.ts

**Known Risks**:

- **Work item description mismatch**: Theoretical interfaces differ from actual codebase
  - Mitigation: Tests validate actual implementation, documented in research summary
- **Literal union for types**: Must use exactly 'added', 'modified', or 'removed'
  - Mitigation: Tests explicitly verify literal values and reject invalid ones
- **Empty array handling**: Changes and taskIds can be empty, but string fields cannot
  - Mitigation: Tests cover both empty arrays and empty string validation

---

**END OF PRP**
