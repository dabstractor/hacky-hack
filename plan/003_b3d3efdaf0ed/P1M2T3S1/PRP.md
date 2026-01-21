# PRP: P1.M2.T3.S1 - Verify Task Status Values and Transitions

---

## Goal

**Feature Goal**: Implement comprehensive unit tests that verify all task status values, valid status transitions, invalid transition handling, and Obsolete status assignment in delta sessions.

**Deliverable**: Unit test file `tests/unit/task-status-transitions.test.ts` with complete coverage of status type validation, transition verification, and delta session Obsolete status handling.

**Success Definition**:

- All six status values ('Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete') are verified via StatusEnum Zod schema
- Valid status transitions (Planned → Researching → Implementing → Complete/Failed) are tested with mock subtasks
- Invalid transitions are documented (current system accepts any transition)
- Obsolete status is verified for tasks removed in delta sessions
- All tests pass: `npm test -- task-status-transitions.test.ts`
- Coverage: 100% for status-related validation logic

---

## User Persona

**Target User**: Development team ensuring task lifecycle integrity and delta session correctness

**Use Case**: Validate that the task status system correctly represents work item state transitions and handles delta session removal scenarios

**User Journey**:

1. Developer runs the test suite after implementing status-related features
2. Tests verify all status values are properly defined
3. Tests confirm status transitions follow expected flow
4. Tests validate Obsolete status is correctly set in delta sessions
5. Clear test failures indicate which status behaviors are incorrect

**Pain Points Addressed**:

- Silent failures when invalid status transitions occur
- Unclear status lifecycle semantics
- Delta sessions not properly marking removed tasks as Obsolete

---

## Why

- **System Integrity**: Ensures task status correctly reflects work progression through the pipeline
- **Delta Session Correctness**: Verifies removed tasks are marked Obsolete, preventing re-execution
- **Type Safety**: Validates the Status type enum matches runtime values
- **Documentation**: Tests serve as executable documentation of valid status transitions
- **Regression Prevention**: Catches accidental changes to status transition logic

---

## What

Unit tests that verify the task status system through comprehensive validation of status values, transitions, and delta session behavior.

### Success Criteria

- [ ] All six status values are defined and validated by StatusEnum Zod schema
- [ ] Valid status transitions (Planned → Researching → Implementing → Complete/Failed) are verified
- [ ] Invalid transitions are documented (current system accepts all transitions)
- [ ] Obsolete status is correctly set for tasks removed in delta sessions
- [ ] Status values work at all hierarchy levels (Phase, Milestone, Task, Subtask)
- [ ] All tests pass with 100% coverage
- [ ] Test file compiles without TypeScript errors

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP includes:

- Exact status type definition from models.ts
- Specific transition patterns from task-orchestrator.ts
- Test patterns from existing unit tests
- Mock factory functions for test data
- File paths and line numbers for all referenced code

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/core/models.ts
  why: Status type definition (lines 137-143) and StatusEnum Zod schema (lines 160-167)
  pattern: String union type with 6 literal values
  section: Lines 137-167 for Status type and StatusEnum

- file: src/core/task-orchestrator.ts
  why: Status transition logic and setStatus() method implementation
  pattern: Public setStatus() method at lines 206-230, transition patterns at lines 575, 584-750
  gotcha: No validation of transition validity - accepts any Status → Status

- file: src/core/task-patcher.ts
  why: Obsolete status assignment for 'removed' changes in delta sessions
  pattern: Lines 91-94 show updateItemStatus(backlog, taskId, 'Obsolete')
  section: Lines 8-10 documentation, 91-94 implementation

- file: src/utils/task-utils.ts
  why: Immutable updateItemStatus() function used by TaskPatcher
  pattern: Lines 301-401 implement status update at all hierarchy levels
  section: updateItemStatus function

- file: tests/unit/core/models.test.ts
  why: Reference implementation for StatusEnum validation tests
  pattern: Lines 47-72 show StatusEnum.test() structure
  gotcha: Uses array of valid statuses and forEach for testing

- file: tests/unit/core/task-orchestrator.test.ts
  why: Reference for TaskOrchestrator testing patterns and mock factory functions
  pattern: createTestSubtask(), createTestTask() factory functions (lines 96-156)
  section: Test data factory functions and mock setup

- file: tests/unit/core/task-patcher.test.ts
  why: Reference for Obsolete status testing in delta sessions
  pattern: Lines 286-453 test 'removed' changes resulting in Obsolete status
  section: "removed change type" describe block

- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Status value documentation and transition definitions
  section: Lines 115-143 for Status type documentation

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S1/research/vitest-state-machine-testing.md
  why: Comprehensive Vitest patterns for state machine and status transition testing
  section: All sections - especially "Testing Enum-Based Status Values"

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S1/research/typescript-enum-validation.md
  why: TypeScript enum validation patterns and Zod enum testing
  section: Zod for Enum Validation, Testing Enum Completeness

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S1/research/status-transition-validation.md
  why: Complete analysis of status transitions in the codebase
  section: All sections - status values, valid transitions, invalid transitions
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── unit/
│   ├── core/
│   │   ├── models.test.ts              # Reference: StatusEnum test pattern
│   │   ├── task-orchestrator.test.ts   # Reference: Test factory functions
│   │   └── task-patcher.test.ts        # Reference: Obsolete status tests
│   └── task-status-transitions.test.ts # NEW: Status validation tests
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
└── unit/
    └── task-status-transitions.test.ts   # NEW: Status validation tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Status is a STRING UNION TYPE, not an enum
// From src/core/models.ts lines 137-143:
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// GOTCHA: Use StatusEnum Zod schema for runtime validation
// From src/core/models.ts lines 160-167:
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);

// CRITICAL: No explicit status transition validation exists
// TaskOrchestrator.setStatus() accepts ANY Status → Status transition
// The system relies on execution flow semantics, not validation

// PATTERN: Status transitions by hierarchy level (from task-orchestrator.ts):
// Phases/Milestones/Tasks: Planned → Implementing (no Complete)
// Subtasks: Planned → Researching → Implementing → Complete/Failed

// GOTCHA: Obsolete is a TERMINAL state (set in delta sessions, no transitions out)
// From task-patcher.ts lines 91-94:
// case 'removed':
//   patchedBacklog = updateItemStatus(patchedBacklog, taskId, 'Obsolete');

// CRITICAL: Use vi.hoisted() for mock variables before vi.mock()
// PATTERN from existing tests:
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// PATTERN: Test factory functions for creating mock hierarchy items
// From task-orchestrator.test.ts lines 96-156:
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
) => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope,
});

// GOTCHA: Use 'as const' for type discriminators in test data
// type: 'Subtask' as const ensures TypeScript narrows correctly

// CRITICAL: 100% coverage requirement from vitest.config.ts
// All branches of status validation logic must be tested
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. Tests use existing Status type and StatusEnum Zod schema.

```typescript
// Existing types used in tests:
import type { Status } from '../../../src/core/models.js';
import { StatusEnum } from '../../../src/core/models.js';
import type {
  Subtask,
  Task,
  Milestone,
  Phase,
} from '../../../src/core/models.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/task-status-transitions.test.ts
  - IMPLEMENT: Top-level describe block and imports
  - FOLLOW pattern: tests/unit/core/models.test.ts (import structure, describe nesting)
  - NAMING: "Task Status Values and Transitions" as top-level describe
  - PLACEMENT: tests/unit/task-status-transitions.test.ts
  - IMPORT: vitest functions, Status type, StatusEnum, hierarchy types

Task 2: IMPLEMENT Mock Setup and Factory Functions
  - IMPLEMENT: vi.hoisted() mock logger setup
  - IMPLEMENT: Mock logger and utils modules
  - FOLLOW pattern: tests/unit/core/task-orchestrator.test.ts (lines 22-44)
  - CREATE: Factory functions for test data (createTestSubtask, etc.)
  - REFERENCE: task-orchestrator.test.ts lines 96-156

Task 3: IMPLEMENT Status Value Validation Tests
  - IMPLEMENT: "StatusEnum" describe block
  - VERIFY: All six status values parse successfully
  - VERIFY: Invalid status values are rejected
  - FOLLOW pattern: tests/unit/core/models.test.ts lines 47-72
  - TEST: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'

Task 4: IMPLEMENT Valid Status Transition Tests
  - IMPLEMENT: "Valid Status Transitions" describe block
  - CREATE: Mock subtasks with various status transitions
  - VERIFY: Planned → Researching is valid
  - VERIFY: Researching → Implementing is valid
  - VERIFY: Implementing → Complete is valid
  - VERIFY: Implementing → Failed is valid
  - DOCUMENT: Current system accepts all transitions (no validation)

Task 5: IMPLEMENT Invalid Status Transition Documentation Tests
  - IMPLEMENT: "Invalid Status Transitions (Documented)" describe block
  - DOCUMENT: Transitions that should be invalid but are currently accepted
  - VERIFY: Backward transitions (Researching → Planned) are accepted
  - VERIFY: Skipping stages (Planned → Complete) are accepted
  - VERIFY: Terminal state transitions (Complete → Failed) are accepted
  - ADD: Comments explaining these are documented for future validation

Task 6: IMPLEMENT Obsolete Status Tests for Delta Sessions
  - IMPLEMENT: "Obsolete Status in Delta Sessions" describe block
  - CREATE: Mock delta analysis with 'removed' changes
  - VERIFY: Tasks marked 'removed' get Obsolete status
  - VERIFY: All hierarchy levels can be marked Obsolete
  - FOLLOW pattern: tests/unit/core/task-patcher.test.ts lines 286-453

Task 7: IMPLEMENT Status Hierarchy Level Tests
  - IMPLEMENT: "Status at All Hierarchy Levels" describe block
  - VERIFY: Status values work for Phase, Milestone, Task, Subtask
  - CREATE: Mock items at each hierarchy level
  - VERIFY: Status can be set and retrieved at all levels

Task 8: IMPLEMENT Status Immutability Tests
  - IMPLEMENT: "Status Immutability" describe block
  - VERIFY: Status updates create new objects (immutable)
  - VERIFY: Original objects are not modified
  - USE: Object.is() or strict equality checks
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Test file structure with mock setup
/**
 * Unit tests for task status values and transitions
 *
 * @remarks
 * Tests validate status type definition, valid transitions,
 * invalid transition handling, and Obsolete status in delta sessions.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Status } from '../../../src/core/models.js';
import { StatusEnum } from '../../../src/core/models.js';
import type {
  Subtask,
  Task,
  Milestone,
  Phase,
  Backlog,
} from '../../../src/core/models.js';
import { updateItemStatus } from '../../../src/utils/task-utils.js';
import { patchBacklog } from '../../../src/core/task-patcher.js';
import type { RequirementChange } from '../../../src/core/models.js';

// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the logger module before importing
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// PATTERN: Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope,
});

const createTestTask = (
  id: string,
  title: string,
  status: Status,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task' as const,
  title,
  status,
  description: 'Test task description',
  subtasks,
});

const createTestMilestone = (
  id: string,
  title: string,
  status: Status,
  tasks: Task[] = []
): Milestone => ({
  id,
  type: 'Milestone' as const,
  title,
  status,
  description: 'Test milestone description',
  tasks,
});

const createTestPhase = (
  id: string,
  title: string,
  status: Status,
  milestones: Milestone[] = []
): Phase => ({
  id,
  type: 'Phase' as const,
  title,
  status,
  description: 'Test phase description',
  milestones,
});

const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});

// PATTERN: Status value validation test
describe('Task Status Values and Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StatusEnum', () => {
    it('should accept all valid status values', () => {
      // SETUP: All six valid status values
      const validStatuses = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ] as const;

      // EXECUTE & VERIFY: Each status should parse successfully
      validStatuses.forEach(status => {
        const result = StatusEnum.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status values', () => {
      // SETUP: Invalid status values
      const invalidStatuses = [
        'Pending',
        'InProgress',
        'Done',
        'Cancelled',
        '',
        'planned', // Wrong case
        'PLANNED', // Wrong case
      ];

      // EXECUTE & VERIFY: Each invalid status should fail
      invalidStatuses.forEach(status => {
        const result = StatusEnum.safeParse(status);
        expect(result.success).toBe(false);
      });
    });

    it('should have exactly six status values', () => {
      // VERIFY: StatusEnum has exactly 6 options
      const statusValues = StatusEnum.options;
      expect(statusValues).toHaveLength(6);
      expect(statusValues).toContain('Planned');
      expect(statusValues).toContain('Researching');
      expect(statusValues).toContain('Implementing');
      expect(statusValues).toContain('Complete');
      expect(statusValues).toContain('Failed');
      expect(statusValues).toContain('Obsolete');
    });
  });

  // PATTERN: Valid status transition tests
  describe('Valid Status Transitions', () => {
    it('should accept Planned → Researching transition', () => {
      // SETUP: Create subtask in Planned status
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Planned'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Update status to Researching
      const updated = updateItemStatus(backlog, subtask.id, 'Researching');

      // VERIFY: Status changed to Researching
      const updatedSubtask =
        updated.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(updatedSubtask?.status).toBe('Researching');

      // VERIFY: Original object is immutable
      expect(subtask.status).toBe('Planned');
    });

    it('should accept Researching → Implementing transition', () => {
      // SETUP: Create subtask in Researching status
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Researching'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Update status to Implementing
      const updated = updateItemStatus(backlog, subtask.id, 'Implementing');

      // VERIFY: Status changed to Implementing
      const updatedSubtask =
        updated.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(updatedSubtask?.status).toBe('Implementing');
    });

    it('should accept Implementing → Complete transition', () => {
      // SETUP: Create subtask in Implementing status
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Implementing'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Update status to Complete
      const updated = updateItemStatus(backlog, subtask.id, 'Complete');

      // VERIFY: Status changed to Complete
      const updatedSubtask =
        updated.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(updatedSubtask?.status).toBe('Complete');
    });

    it('should accept Implementing → Failed transition', () => {
      // SETUP: Create subtask in Implementing status
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Implementing'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Update status to Failed
      const updated = updateItemStatus(backlog, subtask.id, 'Failed');

      // VERIFY: Status changed to Failed
      const updatedSubtask =
        updated.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(updatedSubtask?.status).toBe('Failed');
    });
  });

  // PATTERN: Document invalid transitions (currently accepted)
  describe('Invalid Status Transitions (Documented)', () => {
    it('should currently accept backward transitions (no validation)', () => {
      // SETUP: Create subtask in Researching status
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Researching'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Attempt backward transition to Planned
      const updated = updateItemStatus(backlog, subtask.id, 'Planned');

      // VERIFY: Transition is accepted (current behavior)
      // NOTE: This should ideally be invalid, but system accepts all transitions
      const updatedSubtask =
        updated.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(updatedSubtask?.status).toBe('Planned');
    });

    it('should currently accept stage-skipping transitions (no validation)', () => {
      // SETUP: Create subtask in Planned status
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Planned'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Attempt skip to Complete (bypasses Researching/Implementing)
      const updated = updateItemStatus(backlog, subtask.id, 'Complete');

      // VERIFY: Transition is accepted (current behavior)
      // NOTE: This should ideally be invalid, but system accepts all transitions
      const updatedSubtask =
        updated.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(updatedSubtask?.status).toBe('Complete');
    });
  });

  // PATTERN: Obsolete status in delta sessions
  describe('Obsolete Status in Delta Sessions', () => {
    it('should mark removed subtasks as Obsolete', () => {
      // SETUP: Create backlog with subtask to be removed
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Removed Subtask',
        'Complete'
      );
      const task = createTestTask('P1.M1.T1', 'Test Task', 'Complete', [
        subtask,
      ]);
      const milestone = createTestMilestone(
        'P1.M1',
        'Test Milestone',
        'Complete',
        [task]
      );
      const phase = createTestPhase('P1', 'Test Phase', 'Complete', [
        milestone,
      ]);
      const backlog = createTestBacklog([phase]);

      // SETUP: Create requirement change for 'removed' type
      const changes: RequirementChange[] = [
        {
          itemId: 'P1.M1.T1.S1',
          type: 'removed',
          description: 'Subtask removed in delta session',
          impact: 'Do not execute this subtask',
        },
      ];

      // EXECUTE: Apply patch
      const patched = patchBacklog(backlog, changes, 'Test patch instructions');

      // VERIFY: Subtask status is Obsolete
      const patchedSubtask =
        patched.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(patchedSubtask?.status).toBe('Obsolete');
    });

    it('should mark removed tasks as Obsolete', () => {
      // SETUP: Create backlog with task to be removed
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Complete'
      );
      const task = createTestTask('P1.M1.T1', 'Removed Task', 'Complete', [
        subtask,
      ]);
      const milestone = createTestMilestone(
        'P1.M1',
        'Test Milestone',
        'Complete',
        [task]
      );
      const phase = createTestPhase('P1', 'Test Phase', 'Complete', [
        milestone,
      ]);
      const backlog = createTestBacklog([phase]);

      // SETUP: Create requirement change for 'removed' type
      const changes: RequirementChange[] = [
        {
          itemId: 'P1.M1.T1',
          type: 'removed',
          description: 'Task removed in delta session',
          impact: 'Do not execute this task or subtasks',
        },
      ];

      // EXECUTE: Apply patch
      const patched = patchBacklog(backlog, changes, 'Test patch instructions');

      // VERIFY: Task status is Obsolete
      const patchedTask = patched.backlog[0]?.milestones[0]?.tasks[0];
      expect(patchedTask?.status).toBe('Obsolete');
    });

    it('should mark removed milestones as Obsolete', () => {
      // SETUP: Create backlog with milestone to be removed
      const task = createTestTask('P1.M1.T1', 'Test Task', 'Complete', []);
      const milestone = createTestMilestone(
        'P1.M1',
        'Removed Milestone',
        'Complete',
        [task]
      );
      const phase = createTestPhase('P1', 'Test Phase', 'Complete', [
        milestone,
      ]);
      const backlog = createTestBacklog([phase]);

      // SETUP: Create requirement change for 'removed' type
      const changes: RequirementChange[] = [
        {
          itemId: 'P1.M1',
          type: 'removed',
          description: 'Milestone removed in delta session',
          impact: 'Do not execute this milestone',
        },
      ];

      // EXECUTE: Apply patch
      const patched = patchBacklog(backlog, changes, 'Test patch instructions');

      // VERIFY: Milestone status is Obsolete
      const patchedMilestone = patched.backlog[0]?.milestones[0];
      expect(patchedMilestone?.status).toBe('Obsolete');
    });

    it('should mark removed phases as Obsolete', () => {
      // SETUP: Create backlog with phase to be removed
      const milestone = createTestMilestone(
        'P1.M1',
        'Test Milestone',
        'Complete',
        []
      );
      const phase = createTestPhase('P1', 'Removed Phase', 'Complete', [
        milestone,
      ]);
      const backlog = createTestBacklog([phase]);

      // SETUP: Create requirement change for 'removed' type
      const changes: RequirementChange[] = [
        {
          itemId: 'P1',
          type: 'removed',
          description: 'Phase removed in delta session',
          impact: 'Do not execute this phase',
        },
      ];

      // EXECUTE: Apply patch
      const patched = patchBacklog(backlog, changes, 'Test patch instructions');

      // VERIFY: Phase status is Obsolete
      const patchedPhase = patched.backlog[0];
      expect(patchedPhase?.status).toBe('Obsolete');
    });

    it('should handle multiple removed items in a single patch', () => {
      // SETUP: Create backlog with multiple items to be removed
      const subtask1 = createTestSubtask(
        'P1.M1.T1.S1',
        'Removed Subtask 1',
        'Complete'
      );
      const subtask2 = createTestSubtask(
        'P1.M1.T1.S2',
        'Removed Subtask 2',
        'Complete'
      );
      const subtask3 = createTestSubtask(
        'P1.M1.T1.S3',
        'Kept Subtask',
        'Complete'
      );
      const task = createTestTask('P1.M1.T1', 'Test Task', 'Complete', [
        subtask1,
        subtask2,
        subtask3,
      ]);
      const milestone = createTestMilestone(
        'P1.M1',
        'Test Milestone',
        'Complete',
        [task]
      );
      const phase = createTestPhase('P1', 'Test Phase', 'Complete', [
        milestone,
      ]);
      const backlog = createTestBacklog([phase]);

      // SETUP: Create requirement changes for multiple 'removed' items
      const changes: RequirementChange[] = [
        {
          itemId: 'P1.M1.T1.S1',
          type: 'removed',
          description: 'Subtask 1 removed',
          impact: 'Do not execute',
        },
        {
          itemId: 'P1.M1.T1.S2',
          type: 'removed',
          description: 'Subtask 2 removed',
          impact: 'Do not execute',
        },
      ];

      // EXECUTE: Apply patch
      const patched = patchBacklog(backlog, changes, 'Test patch instructions');

      // VERIFY: Removed subtasks are Obsolete
      const patchedTask = patched.backlog[0]?.milestones[0]?.tasks[0];
      expect(patchedTask?.subtasks[0]?.status).toBe('Obsolete');
      expect(patchedTask?.subtasks[1]?.status).toBe('Obsolete');

      // VERIFY: Kept subtask is still Complete
      expect(patchedTask?.subtasks[2]?.status).toBe('Complete');
    });
  });

  // PATTERN: Status at all hierarchy levels
  describe('Status at All Hierarchy Levels', () => {
    it('should accept all status values for Subtask', () => {
      const statuses: Status[] = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ];

      statuses.forEach(status => {
        const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', status);
        expect(subtask.status).toBe(status);

        // Verify Zod validation
        const result = StatusEnum.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all status values for Task', () => {
      const statuses: Status[] = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ];

      statuses.forEach(status => {
        const task = createTestTask('P1.M1.T1', 'Test', status);
        expect(task.status).toBe(status);
      });
    });

    it('should accept all status values for Milestone', () => {
      const statuses: Status[] = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ];

      statuses.forEach(status => {
        const milestone = createTestMilestone('P1.M1', 'Test', status);
        expect(milestone.status).toBe(status);
      });
    });

    it('should accept all status values for Phase', () => {
      const statuses: Status[] = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ];

      statuses.forEach(status => {
        const phase = createTestPhase('P1', 'Test', status);
        expect(phase.status).toBe(status);
      });
    });
  });

  // PATTERN: Status immutability tests
  describe('Status Immutability', () => {
    it('should create new object when updating status', () => {
      // SETUP: Create subtask in Planned status
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Test Subtask',
        'Planned'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Update status to Researching
      const updated = updateItemStatus(backlog, subtask.id, 'Researching');

      // VERIFY: New backlog is different object
      expect(updated).not.toBe(backlog);

      // VERIFY: Original backlog is unchanged
      const originalSubtask =
        backlog.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(originalSubtask?.status).toBe('Planned');
    });

    it('should preserve all other fields when updating status', () => {
      // SETUP: Create subtask with all fields
      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Original Title',
        'Planned',
        ['P1.M1.T1.S0'],
        'Original scope'
      );
      const backlog = createTestBacklog([]);

      // EXECUTE: Update status only
      const updated = updateItemStatus(backlog, subtask.id, 'Researching');

      // VERIFY: Other fields are preserved
      const updatedSubtask =
        updated.backlog[0]?.milestones[0]?.tasks[0]?.subtasks[0];
      expect(updatedSubtask?.id).toBe('P1.M1.T1.S1');
      expect(updatedSubtask?.title).toBe('Original Title');
      expect(updatedSubtask?.story_points).toBe(2);
      expect(updatedSubtask?.dependencies).toEqual(['P1.M1.T1.S0']);
      expect(updatedSubtask?.context_scope).toBe('Original scope');
    });
  });
});
```

### Integration Points

```yaml
MODELS:
  - file: src/core/models.ts
  - import: Status type, StatusEnum, Subtask, Task, Milestone, Phase, Backlog
  - use: Type definitions and Zod schemas for validation

TASK_UTILS:
  - file: src/utils/task-utils.ts
  - import: updateItemStatus function
  - use: Immutable status update logic

TASK_PATCHER:
  - file: src/core/task-patcher.ts
  - import: patchBacklog function
  - use: Delta session Obsolete status assignment

REQUIREMENT_CHANGE:
  - file: src/core/models.ts
  - import: RequirementChange type
  - use: Delta analysis change type definitions

TEST_UTILS:
  - file: tests/unit/core/task-orchestrator.test.ts
  - pattern: Factory function patterns for mock data
  - use: Creating test subtasks, tasks, milestones, phases
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/unit/task-status-transitions.test.ts
npm run format -- tests/unit/task-status-transitions.test.ts

# Expected: Zero linting errors, proper formatting
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file specifically
npm test -- task-status-transitions.test.ts

# Run with coverage to verify 100% coverage
npm run test:coverage -- tests/unit/task-status-transitions.test.ts

# Expected: All tests pass
# - StatusEnum tests pass
# - Valid transition tests pass
# - Invalid transition tests pass (documenting current behavior)
# - Obsolete status tests pass
# - Hierarchy level tests pass
# - Immutability tests pass

# Coverage verification:
# - All branches of status validation covered
# - All status values tested
# - All transition paths tested
```

### Level 3: Integration Testing (System Validation)

```bash
# Full unit test suite for related areas
npm test -- tests/unit/core/

# Verify no regressions in existing tests
npm test -- tests/unit/core/models.test.ts
npm test -- tests/unit/core/task-patcher.test.ts
npm test -- tests/unit/core/task-orchestrator.test.ts

# Expected: All existing tests still pass
# - StatusEnum validation in models.test.ts still works
# - TaskPatcher Obsolete tests still work
# - TaskOrchestrator status tests still work
```

### Level 4: Domain-Specific Validation

```bash
# Verify type checking passes
npm run typecheck

# Expected: No TypeScript errors
# - All Status type usages are correct
# - Type narrowing works correctly
# - No implicit any types

# Run tests in watch mode for interactive verification
npm test:watch -- task-status-transitions.test.ts

# Expected: Tests pass on save, proper watch behavior
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file compiles without TypeScript errors
- [ ] All linting rules pass: `npm run lint`
- [ ] Code follows existing test patterns from models.test.ts and task-orchestrator.test.ts
- [ ] Mock setup/teardown properly cleans up state (vi.clearAllMocks() in beforeEach)
- [ ] No mock state leakage between tests

### Feature Validation

- [ ] All six status values are tested: 'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
- [ ] StatusEnum Zod schema validation tests pass
- [ ] Valid status transitions are verified:
  - [ ] Planned → Researching
  - [ ] Researching → Implementing
  - [ ] Implementing → Complete
  - [ ] Implementing → Failed
- [ ] Invalid transitions are documented (current behavior accepts all)
- [ ] Obsolete status is set for removed tasks in delta sessions:
  - [ ] Subtasks can be marked Obsolete
  - [ ] Tasks can be marked Obsolete
  - [ ] Milestones can be marked Obsolete
  - [ ] Phases can be marked Obsolete
  - [ ] Multiple removed items handled correctly
- [ ] Status values work at all hierarchy levels
- [ ] Status updates are immutable

### Code Quality Validation

- [ ] Test names clearly describe what is being tested
- [ ] Comments explain non-obvious test logic (especially for invalid transitions)
- [ ] Factory functions follow existing patterns
- [ ] Mock setup follows existing patterns
- [ ] Test structure uses proper describe/it nesting
- [ ] Each test is independent (can run in any order)

### Documentation & Deployment

- [ ] Tests are self-documenting with clear describe/it names
- [ ] File header JSDoc explains test purpose
- [ ] References to related code are included in comments
- [ ] Test file can be run standalone

---

## Anti-Patterns to Avoid

- ❌ Don't use enums - Status is a string union type, use `as const` for discriminators
- ❌ Don't test implementation details - test status values and transitions, not internal logic
- ❌ Don't forget to test all six status values
- ❌ Don't skip Obsolete status tests - critical for delta sessions
- ❌ Don't mutate test data - verify immutability with `toBe()` vs `toStrictEqual()`
- ❌ Don't leak mock state - always call `vi.clearAllMocks()` in beforeEach
- ❌ Don't create new patterns - follow existing test structure from models.test.ts
- ❌ Don't assume validation exists - document that current system accepts all transitions
- ❌ Don't forget to test all hierarchy levels (Phase, Milestone, Task, Subtask)
- ❌ Don't use callbacks in describe - use beforeEach for setup

---

**PRP Version**: 1.0
**Created**: 2026-01-21
**For**: P1.M2.T3.S1 - Task Management Verification
**Confidence Score**: 10/10 (Excellent - comprehensive research, specific file references, clear implementation patterns)
