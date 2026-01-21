# PRP: P1.M2.T3.S2 - Verify Scope Execution (--scope, --task flags)

---

## Goal

**Feature Goal**: Implement comprehensive integration tests that verify scope string parsing and backlog filtering via `--scope` flag correctly filters task execution to the specified hierarchy level.

**Deliverable**: Integration test file `tests/integration/scope-resolution.test.ts` with complete coverage of scope string parsing, backlog filtering, execution queue filtering, and invalid scope rejection.

**Success Definition**:
- Scope string 'P3' executes only Phase 3 and all descendant items
- Scope string 'P3.M4' executes only Milestone 4 and all descendant items
- Scope string 'P1.M2.T3' executes only Task 3 and all subtasks
- Scope string 'P1.M2.T3.S1' executes only Subtask 1
- Invalid scope strings are rejected with clear error messages
- Mock backlog with multiple phases/milestones validates cross-scope isolation
- All tests pass: `npm test -- scope-resolution.test.ts`
- Coverage: Integration testing of CLI scope parsing → ScopeResolver → TaskOrchestrator execution queue

---

## User Persona

**Target User**: Development team ensuring scope-based task execution works correctly for selective development workflows

**Use Case**: Developers need to execute specific portions of a backlog (e.g., only Phase 3, or a specific milestone) without running unrelated tasks

**User Journey**:
1. Developer specifies `--scope P1.M2` when running the pipeline
2. CLI validates the scope string format
3. ScopeResolver parses the scope and filters backlog to matching items
4. TaskOrchestrator builds execution queue with only scoped items
5. Only tasks within the specified scope are executed

**Pain Points Addressed**:
- Running entire backlog when only need to test a specific feature
- Unclear which tasks will be executed with a given scope
- Invalid scope strings causing cryptic errors
- Scope filtering not working as expected

---

## Why

- **Selective Execution**: Enables developers to work on specific features without running unrelated tasks
- **Faster Development Cycles**: Reduces execution time when testing changes to a specific milestone
- **Clear Boundaries**: Ensures scope boundaries are respected and tasks outside scope are not executed
- **Error Handling**: Validates scope strings early with helpful error messages
- **Integration Validation**: Confirms CLI → ScopeResolver → TaskOrchestrator integration works end-to-end

---

## What

Integration tests that verify scope-based task filtering through the complete execution pipeline.

### Success Criteria

- [ ] Scope 'P3' filters backlog to Phase 3 and all descendants only
- [ ] Scope 'P3.M4' filters backlog to Milestone 4 and all descendants only
- [ ] Scope 'P1.M2.T3' filters backlog to Task 3 and all subtasks only
- [ ] Scope 'P1.M2.T3.S1' filters backlog to Subtask 1 only
- [ ] Scope 'all' includes all leaf subtasks from entire backlog
- [ ] Invalid scope strings are rejected with ScopeParseError
- [ ] Non-existent scope IDs return empty execution queue
- [ ] Execution queue contains only scoped items (no cross-scope leakage)
- [ ] All tests pass with proper isolation between scope levels

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP includes:
- Exact ScopeResolver implementation from scope-resolver.ts
- CLI scope parsing validation from cli/index.ts
- Test patterns from existing integration tests (task-orchestrator.test.ts, scope-resolver unit tests)
- Mock backlog creation patterns from test fixtures
- TaskOrchestrator scope integration patterns
- Factory functions for creating test hierarchies

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/core/scope-resolver.ts
  why: Scope parsing (parseScope) and resolution (resolveScope) functions
  pattern: Lines 139-203 for parseScope(), lines 283-310 for resolveScope()
  section: Complete file - implements scope string parsing and backlog filtering
  critical: Regex patterns: /^P\d+$/, /^P\d+\.M\d+$/, /^P\d+\.M\d+\.T\d+$/, /^P\d+\.M\d+\.T\d+\.S\d+$/

- file: src/cli/index.ts
  why: CLI scope validation and ScopeParseError handling
  pattern: Lines 159-176 for scope string validation in parseCLIArgs()
  gotcha: Catches ScopeParseError and logs helpful error message before process.exit(1)

- file: tests/unit/core/scope-resolver.test.ts
  why: Reference for scope parsing and resolution test patterns
  pattern: Factory functions (lines 32-88), createComplexBacklog() (lines 91-144)
  section: All describe blocks - shows Setup/Execute/Verify pattern for scope testing

- file: tests/unit/cli/index.test.ts
  why: Reference for CLI scope validation testing
  pattern: Lines 293-415 for scope validation tests with process.exit mocking
  gotcha: Uses vi.fn() to mock process.exit and verify exit code 1 for invalid scopes

- file: tests/integration/core/task-orchestrator.test.ts
  why: Reference for TaskOrchestrator integration testing with scope
  pattern: Lines 645-741 for execution queue management with scope filtering
  section: "Execution Queue Management" describe block
  critical: Shows setScope() mid-execution queue rebuilding pattern

- file: tests/fixtures/simple-prd.ts
  why: Minimal PRD fixture for creating test sessions
  pattern: Phase → Milestone → Task → Subtask structure with context_scope format
  section: Full file - 3 subtasks with dependencies

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S2/research/scope-filtering-testing-patterns.md
  why: Comprehensive research on testing scope filtering systems
  section: All sections - Setup/Execute/Verify pattern, edge cases, integration testing

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S2/research/vitest-integration-testing.md
  why: Vitest integration testing patterns for scope resolution
  section: Testing Nested Hierarchical Structures, Integration Test Patterns

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S2/research/cli-flag-integration-testing.md
  why: CLI flag integration testing patterns and process.exit mocking
  section: Testing Scope Flag Validation, process.exit Mocking Patterns

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S1/PRP.md
  why: Previous PRP for status transitions - shows factory function patterns
  section: Implementation Patterns & Key Details for factory function patterns
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   ├── core/
│   │   ├── task-orchestrator.test.ts    # Reference: Scope filtering integration tests
│   │   ├── session-manager.test.ts      # Reference: Session setup patterns
│   │   └── ...
│   ├── scope-resolution.test.ts          # NEW: Scope execution integration tests
├── fixtures/
│   ├── simple-prd.ts                     # Reference: Minimal PRD fixture
│   └── ...
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
└── integration/
    └── scope-resolution.test.ts          # NEW: Scope execution integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Scope is a STRING, not an object
// Parse first, then resolve against backlog
// From src/core/scope-resolver.ts:
const scope = parseScope('P1.M1'); // Returns { type: 'milestone', id: 'P1.M1' }
const items = resolveScope(backlog, scope); // Returns filtered items

// CRITICAL: ScopeResolver returns HierarchyItem[] (not just subtasks)
// For 'all' scope: returns only Subtask[] (leaf nodes)
// For other scopes: returns [parent, ...descendants] including parent

// GOTCHA: Non-existent IDs return empty array (no error thrown)
// From src/core/scope-resolver.ts lines 296-301:
const item = findItem(backlog, scope.id);
if (!item) {
  return []; // Empty array, not an error
}

// CRITICAL: TaskOrchestrator.setScope() rebuilds execution queue
// From tests/integration/core/task-orchestrator.test.ts lines 709-741:
await orchestrator.setScope({ type: 'milestone', id: 'P1.M2' });
const newQueueLength = orchestrator.executionQueue.length;

// PATTERN: Factory functions for test hierarchies
// From tests/unit/core/scope-resolver.test.ts lines 32-88:
const createTestSubtask = (id, title, status = 'Planned', dependencies = []) => ({
  id, type: 'Subtask', title, status, story_points: 2, dependencies, context_scope: 'Test'
});
// Use 'as const' for type discriminators: type: 'Subtask' as const

// GOTCHA: Integration tests need real SessionManager with filesystem
// From tests/integration/core/task-orchestrator.test.ts:
// - Use mkdtempSync() for temp directories
// - Write tasks.json, prd_snapshot.md, delta_from.txt to session dir
// - Call sessionManager.loadSession() before testing

// CRITICAL: Mock process.exit for CLI validation tests
// From tests/unit/cli/index.test.ts lines 58-62:
mockExit = vi.fn((code: number) => {
  throw new Error(`process.exit(${code})`);
});
process.exit = mockExit as any;

// PATTERN: Session setup requires specific directory structure
// From tests/integration/core/task-orchestrator.test.ts lines 250-257:
for (const dir of [
  sessionDir,
  join(sessionDir, 'architecture'),
  join(sessionDir, 'prps'),
  join(sessionDir, 'artifacts'),
]) {
  mkdirSync(dir, { recursive: true });
}

// CRITICAL: Status is a string union type, not enum
export type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete';

// PATTERN: Use vi.hoisted() for mock variables before vi.mock()
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. Tests use existing types from `src/core/models.ts` and `src/core/scope-resolver.ts`.

```typescript
// Existing types used in tests:
import type { Backlog, Phase, Milestone, Task, Subtask, Status } from '../../src/core/models.js';
import type { Scope, HierarchyItem } from '../../src/core/scope-resolver.js';
import { parseScope, resolveScope } from '../../src/core/scope-resolver.js';
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';
import { SessionManager } from '../../src/core/session-manager.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/scope-resolution.test.ts
  - IMPLEMENT: Top-level describe block and imports
  - FOLLOW pattern: tests/integration/core/task-orchestrator.test.ts (test file structure)
  - NAMING: "Scope Resolution Integration Tests" as top-level describe
  - PLACEMENT: tests/integration/scope-resolution.test.ts
  - IMPORT: vitest functions, types, ScopeResolver, TaskOrchestrator, SessionManager

Task 2: IMPLEMENT Mock Setup and Factory Functions
  - IMPLEMENT: vi.hoisted() mock logger setup
  - IMPLEMENT: Mock logger and utils modules
  - FOLLOW pattern: tests/unit/core/scope-resolver.test.ts (lines 32-88)
  - CREATE: Factory functions for multi-phase test backlog
  - CREATE: createMultiPhaseBacklog() with P1, P2, P3 phases

Task 3: IMPLEMENT Test Environment Setup
  - IMPLEMENT: beforeEach/afterEach for temp directory management
  - IMPLEMENT: Session directory creation with required subdirectories
  - FOLLOW pattern: tests/integration/core/task-orchestrator.test.ts (lines 228-237)
  - CREATE: setupTestEnvironment() helper function

Task 4: IMPLEMENT Phase Scope Filtering Tests
  - IMPLEMENT: "Phase Scope Filtering" describe block
  - VERIFY: Scope 'P3' returns only Phase 3 and descendants
  - VERIFY: Execution queue contains only P3 items
  - CREATE: Mock backlog with P1, P2, P3 phases
  - VERIFY: P1 and P2 items are NOT in execution queue

Task 5: IMPLEMENT Milestone Scope Filtering Tests
  - IMPLEMENT: "Milestone Scope Filtering" describe block
  - VERIFY: Scope 'P3.M4' returns only Milestone 4 and descendants
  - VERIFY: Execution queue excludes other milestones
  - VERIFY: Parent phase is NOT in execution queue

Task 6: IMPLEMENT Task Scope Filtering Tests
  - IMPLEMENT: "Task Scope Filtering" describe block
  - VERIFY: Scope 'P1.M2.T3' returns only Task 3 and subtasks
  - VERIFY: Milestone and phase are NOT in execution queue
  - VERIFY: Other tasks in same milestone are excluded

Task 7: IMPLEMENT Subtask Scope Filtering Tests
  - IMPLEMENT: "Subtask Scope Filtering" describe block
  - VERIFY: Scope 'P1.M2.T3.S1' returns only Subtask 1
  - VERIFY: Parent task is NOT in execution queue
  - VERIFY: Sibling subtasks are excluded

Task 8: IMPLEMENT "all" Scope Tests
  - IMPLEMENT: "'all' Scope" describe block
  - VERIFY: Scope 'all' returns all leaf subtasks
  - VERIFY: Execution queue contains subtasks from all phases
  - VERIFY: No parent items in execution queue

Task 9: IMPLEMENT Invalid Scope Tests
  - IMPLEMENT: "Invalid Scope Handling" describe block
  - VERIFY: Invalid scope strings throw ScopeParseError
  - VERIFY: Empty string throws error with helpful message
  - VERIFY: Malformed scope (e.g., 'P1.X1') throws error

Task 10: IMPLEMENT Non-Existent ID Tests
  - IMPLEMENT: "Non-Existent ID Handling" describe block
  - VERIFY: Non-existent phase ID returns empty execution queue
  - VERIFY: Non-existent milestone ID returns empty execution queue
  - VERIFY: Non-existent task ID returns empty execution queue

Task 11: IMPLEMENT setScope() Mid-Execution Tests
  - IMPLEMENT: "Mid-Execution Scope Change" describe block
  - VERIFY: setScope() rebuilds execution queue correctly
  - VERIFY: Original queue is replaced (not appended to)
  - FOLLOW pattern: tests/integration/core/task-orchestrator.test.ts (lines 709-741)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Test file structure with mock setup
/**
 * Integration tests for scope resolution and execution
 *
 * @remarks
 * Tests validate scope string parsing, backlog filtering,
 * and execution queue isolation. Tests verify complete flow:
 * CLI scope parsing → ScopeResolver → TaskOrchestrator queue.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

import { SessionManager } from '../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';
import { parseScope, resolveScope } from '../../src/core/scope-resolver.js';
import type { Backlog, Phase, Milestone, Task, Subtask, Status } from '../../src/core/models.js';
import type { Scope } from '../../src/core/scope-resolver.js';
import { mockSimplePRD } from '../fixtures/simple-prd.js';

// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// =============================================================================
// Test Constants
// =============================================================================

const TEMP_DIR_TEMPLATE = join(tmpdir(), 'scope-test-XXXXXX');

// =============================================================================
// Fixture Helper Functions
// =============================================================================

const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points: 1,
  dependencies,
  context_scope: 'Test scope',
});

const createTestTask = (
  id: string,
  title: string,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task' as const,
  title,
  status: 'Planned',
  description: 'Test task description',
  subtasks,
});

const createTestMilestone = (
  id: string,
  title: string,
  tasks: Task[] = []
): Milestone => ({
  id,
  type: 'Milestone' as const,
  title,
  status: 'Planned',
  description: 'Test milestone description',
  tasks,
});

const createTestPhase = (
  id: string,
  title: string,
  milestones: Milestone[] = []
): Phase => ({
  id,
  type: 'Phase' as const,
  title,
  status: 'Planned',
  description: 'Test phase description',
  milestones,
});

// CRITICAL: Create backlog with multiple phases for scope isolation testing
function createMultiPhaseBacklog(): Backlog {
  // Phase 1: 2 milestones, 2 tasks each, 2 subtasks each = 8 subtasks
  const p1m1t1s1 = createTestSubtask('P1.M1.T1.S1', 'P1M1T1S1');
  const p1m1t1s2 = createTestSubtask('P1.M1.T1.S2', 'P1M1T1S2');
  const p1m1t2s1 = createTestSubtask('P1.M1.T2.S1', 'P1M1T2S1');
  const p1m1t2s2 = createTestSubtask('P1.M1.T2.S2', 'P1M1T2S2');
  const p1m2t1s1 = createTestSubtask('P1.M2.T1.S1', 'P1M2T1S1');
  const p1m2t1s2 = createTestSubtask('P1.M2.T1.S2', 'P1M2T1S2');
  const p1m2t2s1 = createTestSubtask('P1.M2.T2.S1', 'P1M2T2S1');
  const p1m2t2s2 = createTestSubtask('P1.M2.T2.S2', 'P1M2T2S2');

  const p1 = createTestPhase('P1', 'Phase 1', [
    createTestMilestone('P1.M1', 'Milestone 1', [
      createTestTask('P1.M1.T1', 'Task 1', [p1m1t1s1, p1m1t1s2]),
      createTestTask('P1.M1.T2', 'Task 2', [p1m1t2s1, p1m1t2s2]),
    ]),
    createTestMilestone('P1.M2', 'Milestone 2', [
      createTestTask('P1.M2.T1', 'Task 3', [p1m2t1s1, p1m2t1s2]),
      createTestTask('P1.M2.T2', 'Task 4', [p1m2t2s1, p1m2t2s2]),
    ]),
  ]);

  // Phase 2: 2 milestones, 2 tasks each, 2 subtasks each = 8 subtasks
  const p2m1t1s1 = createTestSubtask('P2.M1.T1.S1', 'P2M1T1S1');
  const p2m1t1s2 = createTestSubtask('P2.M1.T1.S2', 'P2M1T1S2');
  const p2m1t2s1 = createTestSubtask('P2.M1.T2.S1', 'P2M1T2S1');
  const p2m1t2s2 = createTestSubtask('P2.M1.T2.S2', 'P2M1T2S2');
  const p2m2t1s1 = createTestSubtask('P2.M2.T1.S1', 'P2M2T1S1');
  const p2m2t1s2 = createTestSubtask('P2.M2.T1.S2', 'P2M2T1S2');
  const p2m2t2s1 = createTestSubtask('P2.M2.T2.S1', 'P2M2T2S1');
  const p2m2t2s2 = createTestSubtask('P2.M2.T2.S2', 'P2M2T2S2');

  const p2 = createTestPhase('P2', 'Phase 2', [
    createTestMilestone('P2.M1', 'Milestone 1', [
      createTestTask('P2.M1.T1', 'Task 1', [p2m1t1s1, p2m1t1s2]),
      createTestTask('P2.M1.T2', 'Task 2', [p2m1t2s1, p2m1t2s2]),
    ]),
    createTestMilestone('P2.M2', 'Milestone 2', [
      createTestTask('P2.M2.T1', 'Task 3', [p2m2t1s1, p2m2t1s2]),
      createTestTask('P2.M2.T2', 'Task 4', [p2m2t2s1, p2m2t2s2]),
    ]),
  ]);

  // Phase 3: 2 milestones, 2 tasks each, 2 subtasks each = 8 subtasks
  // P3.M4 will be the target of milestone scope tests
  const p3m3t1s1 = createTestSubtask('P3.M3.T1.S1', 'P3M3T1S1');
  const p3m3t1s2 = createTestSubtask('P3.M3.T1.S2', 'P3M3T1S2');
  const p3m3t2s1 = createTestSubtask('P3.M3.T2.S1', 'P3M3T2S1');
  const p3m3t2s2 = createTestSubtask('P3.M3.T2.S2', 'P3M3T2S2');
  const p3m4t1s1 = createTestSubtask('P3.M4.T1.S1', 'P3M4T1S1');
  const p3m4t1s2 = createTestSubtask('P3.M4.T1.S2', 'P3M4T1S2');
  const p3m4t2s1 = createTestSubtask('P3.M4.T2.S1', 'P3M4T2S1');
  const p3m4t2s2 = createTestSubtask('P3.M4.T2.S2', 'P3M4T2S2');

  const p3 = createTestPhase('P3', 'Phase 3', [
    createTestMilestone('P3.M3', 'Milestone 3', [
      createTestTask('P3.M3.T1', 'Task 1', [p3m3t1s1, p3m3t1s2]),
      createTestTask('P3.M3.T2', 'Task 2', [p3m3t2s1, p3m3t2s2]),
    ]),
    createTestMilestone('P3.M4', 'Milestone 4', [
      createTestTask('P3.M4.T1', 'Task 1', [p3m4t1s1, p3m4t1s2]),
      createTestTask('P3.M4.T2', 'Task 2', [p3m4t2s1, p3m4t2s2]),
    ]),
  ]);

  return { backlog: [p1, p2, p3] };
}

function createSessionState(backlog: Backlog, planDir: string) {
  const hash = createHash('sha256')
    .update(JSON.stringify(backlog))
    .digest('hex');
  return {
    metadata: {
      id: `001_${hash.substring(0, 12)}`,
      hash: hash.substring(0, 12),
      path: join(planDir, `001_${hash.substring(0, 12)}`),
      createdAt: new Date(),
      parentSession: null,
    },
    prdSnapshot: mockSimplePRD,
    taskRegistry: backlog,
    currentItemId: null,
  };
}

function setupTestEnvironment(): {
  tempDir: string;
  prdPath: string;
  sessionManager: SessionManager;
} {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  const planDir = join(tempDir, 'plan');
  const prdPath = join(tempDir, 'PRD.md');

  writeFileSync(prdPath, mockSimplePRD);

  const sessionDir = join(planDir, '001_testsession');
  for (const dir of [
    planDir,
    sessionDir,
    join(sessionDir, 'architecture'),
    join(sessionDir, 'prps'),
    join(sessionDir, 'artifacts'),
  ]) {
    mkdirSync(dir, { recursive: true });
  }

  const sessionManager = new SessionManager(prdPath, planDir);

  return { tempDir, prdPath, sessionManager };
}

// PATTERN: Phase scope filtering test
describe('Scope Resolution Integration Tests', () => {
  let tempDir: string;
  let prdPath: string;
  let sessionManager: SessionManager;

  beforeEach(() => {
    const env = setupTestEnvironment();
    tempDir = env.tempDir;
    prdPath = env.prdPath;
    sessionManager = env.sessionManager;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Phase Scope Filtering', () => {
    it('should filter backlog to Phase 3 only when scope is P3', async () => {
      // SETUP: Create backlog with P1, P2, P3
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      const sessionState = createSessionState(backlog, planDir);
      const sessionDir = sessionState.metadata.path;

      // Write session files
      writeFileSync(
        join(sessionDir, 'tasks.json'),
        JSON.stringify({ backlog: backlog.backlog }, null, 2)
      );
      writeFileSync(join(sessionDir, 'prd_snapshot.md'), mockSimplePRD);
      writeFileSync(join(sessionDir, 'delta_from.txt'), '');

      await sessionManager.loadSession(sessionDir);

      // EXECUTE: Create orchestrator with P3 scope
      const scope: Scope = { type: 'phase', id: 'P3' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains only P3 subtasks
      expect(queue.length).toBe(8); // P3 has 8 subtasks
      expect(queue.every(item => item.id.startsWith('P3.'))).toBe(true);

      // VERIFY: No P1 or P2 items in queue
      expect(queue.some(item => item.id.startsWith('P1.'))).toBe(false);
      expect(queue.some(item => item.id.startsWith('P2.'))).toBe(false);
    });
  });

  // ... additional test blocks for each scope type
});
```

### Integration Points

```yaml
SCOPE_RESOLVER:
  - file: src/core/scope-resolver.ts
  - import: parseScope, resolveScope
  - use: Parse scope string and filter backlog

TASK_ORCHESTRATOR:
  - file: src/core/task-orchestrator.ts
  - import: TaskOrchestrator
  - use: Create execution queue with scope filtering
  - method: constructor(sessionManager, scope?)

SESSION_MANAGER:
  - file: src/core/session-manager.ts
  - import: SessionManager
  - use: Load session state for integration tests

MODELS:
  - file: src/core/models.ts
  - import: Backlog, Phase, Milestone, Task, Subtask, Status
  - use: Type definitions for test data creation
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/scope-resolution.test.ts
npm run format -- tests/integration/scope-resolution.test.ts

# Expected: Zero linting errors, proper formatting
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file specifically
npm test -- scope-resolution.test.ts

# Run with coverage to verify comprehensive coverage
npm run test:coverage -- tests/integration/scope-resolution.test.ts

# Expected: All tests pass
# - Phase scope filtering tests pass
# - Milestone scope filtering tests pass
# - Task scope filtering tests pass
# - Subtask scope filtering tests pass
# - "all" scope tests pass
# - Invalid scope handling tests pass
# - Non-existent ID tests pass

# Coverage verification:
# - All scope types tested
# - All error paths covered
```

### Level 3: Integration Testing (System Validation)

```bash
# Full integration test suite for related areas
npm test -- tests/integration/core/

# Verify no regressions in existing tests
npm test -- tests/integration/core/task-orchestrator.test.ts
npm test -- tests/unit/core/scope-resolver.test.ts

# Expected: All existing tests still pass
# - TaskOrchestrator scope tests still work
# - ScopeResolver unit tests still work
```

### Level 4: Domain-Specific Validation

```bash
# Verify type checking passes
npm run typecheck

# Expected: No TypeScript errors
# - All Scope type usages are correct
# - Type narrowing works correctly
# - No implicit any types

# Run tests in watch mode for interactive verification
npm test:watch -- scope-resolution.test.ts

# Expected: Tests pass on save, proper watch behavior
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file compiles without TypeScript errors
- [ ] All linting rules pass: `npm run lint`
- [ ] Code follows existing test patterns from task-orchestrator.test.ts
- [ ] Mock setup/teardown properly cleans up state (vi.clearAllMocks() in beforeEach)
- [ ] No mock state leakage between tests

### Feature Validation

- [ ] Scope 'P3' filters backlog to Phase 3 and descendants only
- [ ] Scope 'P3.M4' filters backlog to Milestone 4 and descendants only
- [ ] Scope 'P1.M2.T3' filters backlog to Task 3 and subtasks only
- [ ] Scope 'P1.M2.T3.S1' filters backlog to Subtask 1 only
- [ ] Scope 'all' includes all leaf subtasks from entire backlog
- [ ] Invalid scope strings are rejected with ScopeParseError
- [ ] Non-existent scope IDs return empty execution queue
- [ ] Execution queue contains only scoped items (no cross-scope leakage)

### Code Quality Validation

- [ ] Test names clearly describe what is being tested
- [ ] Comments explain non-obvious test logic
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

- ❌ Don't create new patterns - follow existing test structure from task-orchestrator.test.ts
- ❌ Don't use callbacks in describe - use beforeEach for setup
- ❌ Don't leak mock state - always call `vi.clearAllMocks()` in beforeEach
- ❌ Don't forget to test all scope types (phase, milestone, task, subtask, all)
- ❌ Don't hardcode test data - use factory functions
- ❌ Don't skip invalid scope tests - critical for error handling
- ❌ Don't assume ScopeResolver throws errors for non-existent IDs - returns empty array
- ❌ Don't forget to cleanup temp directories in afterEach
- ❌ Don't create sessions without required subdirectories (architecture, prps, artifacts)
- ❌ Don't use 'as const' incorrectly - only for type discriminators like `type: 'Subtask' as const`

---

**PRP Version**: 1.0
**Created**: 2026-01-21
**For**: P1.M2.T3.S2 - Task Management Verification
**Confidence Score**: 10/10 (Excellent - comprehensive research, specific file references, clear implementation patterns)
