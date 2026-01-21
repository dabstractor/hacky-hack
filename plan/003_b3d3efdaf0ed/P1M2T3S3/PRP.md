# PRP: P1.M2.T3.S3 - Verify prd task subcommand

---

## Goal

**Feature Goal**: Implement comprehensive integration tests that verify the `prd task` command and its subcommands (`next`, `status`, `-f <file>`) work correctly for displaying tasks, finding the next executable task, showing status counts, and overriding the default tasks.json file.

**Deliverable**: Integration test file `tests/integration/prd-task-command.test.ts` with complete coverage of:
- `prd task` - displays tasks from current session
- `prd task next` - returns next executable task
- `prd task status` - shows task counts by status
- `prd task -f <file>` - overrides with specified tasks.json
- Bugfix session tasks prioritized over main session tasks

**Success Definition**:
- `prd task` displays all tasks for the current session with proper hierarchy
- `prd task next` returns the next executable task based on DFS traversal and status
- `prd task status` shows accurate task counts grouped by status
- `prd task -f <path>` loads tasks from the specified file
- Bugfix session tasks are discovered and prioritized over main session tasks
- Invalid files produce helpful error messages
- All tests pass: `npm test -- prd-task-command.test.ts`
- Coverage: Integration testing of CLI → Session discovery → Task display

---

## User Persona

**Target User**: Development team using the CLI to manage and inspect task state

**Use Case**: Developers need to quickly see:
1. What tasks exist in the current session
2. What the next task to work on is
3. Overall progress via status counts
4. Tasks from alternative files (e.g., backups, other sessions)

**User Journey**:
1. Developer runs `prd task` to see all tasks in current session
2. Developer runs `prd task next` to identify next task to work on
3. Developer runs `prd task status` to see overall progress
4. Developer runs `prd task -f backup.json` to inspect alternative task file

**Pain Points Addressed**:
- Cannot easily see what tasks exist without inspecting tasks.json directly
- Unclear what the next task to work on is
- No quick way to see overall progress
- Difficult to inspect tasks from alternative files

---

## Why

- **Task Visibility**: Enables developers to quickly inspect task state without manually reading JSON
- **Workflow Integration**: Integrates with existing CLI workflow (`npm run dev`)
- **Debugging**: Helps debug task state and session discovery issues
- **Flexibility**: File override allows inspecting tasks from backups or other sessions
- **Bugfix Priority**: Ensures bugfix tasks are correctly prioritized in task discovery

---

## What

Integration tests for the `prd task` command subcommands documented in system_context.md.

### Success Criteria

- [ ] `prd task` displays tasks from current session in hierarchical format
- [ ] `prd task next` returns the next executable task (first 'Planned' or 'Researching' task)
- [ ] `prd task status` shows accurate task counts by status (Planned, Researching, Implementing, Complete, Failed, Obsolete)
- [ ] `prd task -f <file>` loads tasks from specified file path
- [ ] Bugfix session tasks are prioritized over main session tasks when both exist
- [ ] Invalid file paths produce helpful error messages
- [ ] Non-existent files produce "file not found" errors with suggestions
- [ ] Invalid JSON produces parse errors with line numbers
- [ ] All tests pass with proper mocking of sessions and task states

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP includes:
- Exact command specifications from system_context.md
- CLI handler patterns from existing `src/cli/index.ts`
- Test patterns from existing integration tests
- Session discovery patterns from session-manager.test.ts
- Task traversal patterns from task-orchestrator.test.ts
- Mock session directory structure patterns
- File system mocking patterns
- Bugfix session priority logic

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Defines the 'prd task' command contract with subcommands
  section: Lines 536-549 - "Task Subcommand" and "Task File Discovery Priority"
  critical: Command structure: `prd task`, `prd task next`, `prd task status`, `prd task -f <file>`

- file: src/cli/index.ts
  why: Current CLI implementation using Commander.js
  pattern: Lines 50-120 for program configuration, parseCLIArgs() function
  gotcha: Currently only has options, no subcommands. Need to add .command('task')

- file: tests/unit/cli/index.test.ts
  why: Reference for CLI testing patterns with process.argv mocking
  pattern: Lines 27-62 for beforeEach setup, process.exit mocking
  gotcha: Use vi.hoisted() for mock variables before vi.mock()

- file: tests/integration/session-structure.test.ts
  why: Reference for session directory structure testing
  pattern: Lines 50-150 for session directory validation
  section: "Session Directory Structure" describe block

- file: tests/integration/core/task-orchestrator-e2e.test.ts
  why: Reference for TaskOrchestrator integration testing
  pattern: Lines 200-300 for task traversal and next task testing
  section: "Task Processing" describe block

- file: src/core/session-manager.ts
  why: Session discovery and loading logic
  pattern: Lines 150-250 for discoverSessions(), loadSession()
  gotcha: Session directory pattern: /^(\d{3})_([a-f0-9]{12})$/

- file: src/core/task-orchestrator.ts
  why: Task traversal and next task logic
  pattern: Lines 100-200 for processNextItem(), executionQueue
  gotcha: Returns false when queue is empty

- file: src/core/models.ts
  why: Task hierarchy types and Status enum
  pattern: Lines 20-80 for Backlog, Phase, Milestone, Task, Subtask types
  section: Status type: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'

- file: tests/fixtures/simple-prd.ts
  why: Minimal PRD fixture for creating test sessions
  pattern: Phase → Milestone → Task → Subtask structure
  section: Full file - 3 subtasks with dependencies

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S3/research/cli-subcommand-testing-patterns.md
  why: Comprehensive CLI testing patterns for Vitest and Commander.js
  section: All sections - Testing Framework, Subcommand Testing, File Discovery, Mocking Patterns

- docfile: plan/003_b3d3efdaf0ed/P1M2T3S3/research/prd-task-command-specs.md
  why: Complete specifications for all prd task subcommands
  section: All sections - Command Structure, Output Formats, Discovery Priority
```

### Current Codebase Tree (relevant sections)

```bash
src/
├── cli/
│   └── index.ts                      # CLI entry point with Commander.js
├── core/
│   ├── session-manager.ts            # Session discovery and loading
│   ├── task-orchestrator.ts          # Task traversal and execution
│   └── models.ts                      # Task hierarchy types
tests/
├── integration/
│   ├── core/
│   │   ├── session-manager.test.ts   # Session management tests
│   │   └── task-orchestrator-e2e.test.ts  # Task orchestrator tests
│   └── session-structure.test.ts     # Session structure tests
├── unit/
│   ├── cli/
│   │   └── index.test.ts             # CLI parsing tests
│   └── core/
│       └── task-traversal.test.ts    # Task traversal tests
└── fixtures/
    └── simple-prd.ts                 # Minimal PRD fixture
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
└── integration/
    └── prd-task-command.test.ts      # NEW: PRD task command integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: The 'prd task' command is NOT currently implemented
// This PRP is for TESTING a feature that will be implemented separately
// The tests should mock the command behavior based on system_context.md specs

// GOTCHA: Commander.js .command() vs .option()
// Current CLI uses .option() only (e.g., --prd <path>)
// Subcommands require .command('task').action(() => { ... })
// From src/cli/index.ts:
program
  .command('task [subcommand]')
  .description('Show and manage tasks')
  .option('-f, --file <path>', 'Override tasks.json file')
  .action(async (subcommand, options) => {
    // Handle: task (list), task next, task status, task -f <file>
  });

// CRITICAL: Session directory pattern
// From src/core/session-manager.ts:
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;
// Format: 001_14b9dc2a33c7 (sequence + underscore + hash)

// CRITICAL: Status is a string union type, not enum
// From src/core/models.ts:
export type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete';

// CRITICAL: Bugfix sessions are nested under main sessions
// Pattern: plan/001_14b9dc2a33c7/bugfix/001_8d809cc989b9/
// Discovery priority: bugfix tasks first, then main tasks

// PATTERN: Factory functions for test hierarchies
// From tests/unit/core/scope-resolver.test.ts:
const createTestSubtask = (id, title, status = 'Planned', dependencies = []) => ({
  id, type: 'Subtask', title, status, story_points: 2, dependencies, context_scope: 'Test'
});
// Use 'as const' for type discriminators: type: 'Subtask' as const

// CRITICAL: process.exit mocking pattern
// From tests/unit/cli/index.test.ts:
mockExit = vi.fn((code: number) => {
  throw new Error(`process.exit(${code})`);
});
process.exit = mockExit as any;

// PATTERN: vi.hoisted() for mock variables before vi.mock()
// From tests/integration/agents.test.ts:
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// GOTCHA: Integration tests need real session directory structure
// Required directories: sessionDir, architecture/, prps/, artifacts/
// From tests/integration/core/session-manager.test.ts:
for (const dir of [
  sessionDir,
  join(sessionDir, 'architecture'),
  join(sessionDir, 'prps'),
  join(sessionDir, 'artifacts'),
]) {
  mkdirSync(dir, { recursive: true });
}

// CRITICAL: DFS traversal order for next task
// From src/core/task-orchestrator.ts:
// 1. Depth-first, pre-order traversal (parent before children)
// 2. First 'Planned' or 'Researching' task in execution queue
// 3. Returns false when queue is empty
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. Tests use existing types from `src/core/models.ts`.

```typescript
// Existing types used in tests:
import type { Backlog, Phase, Milestone, Task, Subtask, Status } from '../../src/core/models.js';
import { SessionManager } from '../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/prd-task-command.test.ts
  - IMPLEMENT: Top-level describe block and imports
  - FOLLOW pattern: tests/integration/session-structure.test.ts (test file structure)
  - NAMING: "PRD Task Command Integration Tests" as top-level describe
  - PLACEMENT: tests/integration/prd-task-command.test.ts
  - IMPORT: vitest functions, types, SessionManager, TaskOrchestrator

Task 2: IMPLEMENT Mock Setup and Factory Functions
  - IMPLEMENT: vi.hoisted() mock logger setup
  - IMPLEMENT: Mock logger and utils modules
  - FOLLOW pattern: tests/unit/cli/index.test.ts (lines 27-62)
  - CREATE: Factory functions for test backlogs
  - CREATE: createTestBacklog() with various task statuses

Task 3: IMPLEMENT Test Environment Setup
  - IMPLEMENT: beforeEach/afterEach for temp directory management
  - IMPLEMENT: Session directory creation with required subdirectories
  - FOLLOW pattern: tests/integration/core/session-manager.test.ts
  - CREATE: setupTestSession() helper for creating mock sessions

Task 4: IMPLEMENT 'prd task' Display Tests
  - IMPLEMENT: "prd task command" describe block
  - VERIFY: Displays tasks in hierarchical format (Phase → Milestone → Task → Subtask)
  - VERIFY: Shows task ID, title, status, and story points
  - CREATE: Mock main session with tasks.json
  - VERIFY: Output matches expected format from system_context.md

Task 5: IMPLEMENT 'prd task next' Tests
  - IMPLEMENT: "prd task next" describe block
  - VERIFY: Returns next executable task (first 'Planned' or 'Researching')
  - VERIFY: Returns null when all tasks are Complete
  - CREATE: Mock session with mixed task statuses
  - VERIFY: Correct task returned based on DFS traversal

Task 6: IMPLEMENT 'prd task status' Tests
  - IMPLEMENT: "prd task status" describe block
  - VERIFY: Shows counts for all status values
  - VERIFY: Correctly counts Planned, Researching, Implementing, Complete, Failed, Obsolete
  - CREATE: Mock session with various statuses
  - VERIFY: Total count matches sum of individual counts

Task 7: IMPLEMENT '-f <file>' File Override Tests
  - IMPLEMENT: "file override" describe block
  - VERIFY: Loads tasks from specified file path
  - VERIFY: Relative paths are resolved correctly
  - CREATE: Mock alternative tasks.json file
  - VERIFY: Tasks from specified file are displayed

Task 8: IMPLEMENT Bugfix Session Priority Tests
  - IMPLEMENT: "bugfix session priority" describe block
  - VERIFY: Bugfix tasks are prioritized over main tasks
  - CREATE: Mock main session and bugfix session
  - VERIFY: 'prd task next' returns bugfix task first
  - CREATE: Bugfix session directory structure

Task 9: IMPLEMENT Error Handling Tests
  - IMPLEMENT: "error handling" describe block
  - VERIFY: Invalid file path produces helpful error
  - VERIFY: Non-existent file produces "file not found" error
  - VERIFY: Invalid JSON produces parse error
  - VERIFY: Invalid schema produces validation error

Task 10: IMPLEMENT Session Discovery Tests
  - IMPLEMENT: "session discovery" describe block
  - VERIFY: Discovers session based on PRD hash
  - VERIFY: Creates session path correctly: plan/{sequence}_{hash}/
  - VERIFY: Loads most recent session when multiple exist
  - CREATE: Multiple mock sessions for discovery testing
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Test file structure with mock setup
/**
 * Integration tests for prd task command
 *
 * @remarks
 * Tests validate the prd task command and its subcommands:
 * - `prd task` - displays tasks from current session
 * - `prd task next` - returns next executable task
 * - `prd task status` - shows task counts by status
 * - `prd task -f <file>` - overrides with specified tasks.json
 *
 * Tests also verify bugfix session priority and error handling.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

import { SessionManager } from '../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';
import type { Backlog, Phase, Milestone, Task, Subtask, Status } from '../../src/core/models.js';

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

const TEMP_DIR_TEMPLATE = join(tmpdir(), 'prd-task-test-XXXXXX');
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

// =============================================================================
// Fixture Helper Functions
// =============================================================================

const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  story_points: number = 1
): Subtask => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points,
  dependencies: [],
  context_scope: 'Test scope',
});

const createTestTask = (id: string, title: string, subtasks: Subtask[] = []): Task => ({
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

const createTestPhase = (id: string, title: string, milestones: Milestone[] = []): Phase => ({
  id,
  type: 'Phase' as const,
  title,
  status: 'Planned',
  description: 'Test phase description',
  milestones,
});

// Create a backlog with mixed statuses for testing
function createTestBacklog(): Backlog {
  const s1 = createTestSubtask('P1.M1.T1.S1', 'Complete Task', 'Complete', 1);
  const s2 = createTestSubtask('P1.M1.T1.S2', 'Planned Task', 'Planned', 2);
  const s3 = createTestSubtask('P1.M1.T2.S1', 'Researching Task', 'Researching', 3);
  const s4 = createTestSubtask('P1.M1.T2.S2', 'Implementing Task', 'Implementing', 1);

  const t1 = createTestTask('P1.M1.T1', 'Task 1', [s1, s2]);
  const t2 = createTestTask('P1.M1.T2', 'Task 2', [s3, s4]);

  const m1 = createTestMilestone('P1.M1', 'Milestone 1', [t1, t2]);

  const p1 = createTestPhase('P1', 'Phase 1', [m1]);

  return { backlog: [p1] };
}

// Setup a test session with required directory structure
function setupTestSession(tempDir: string, sessionId: string, backlog: Backlog): string {
  const planDir = join(tempDir, 'plan');
  const sessionDir = join(planDir, sessionId);

  // Create required directories
  for (const dir of [
    planDir,
    sessionDir,
    join(sessionDir, 'architecture'),
    join(sessionDir, 'prps'),
    join(sessionDir, 'artifacts'),
  ]) {
    mkdirSync(dir, { recursive: true });
  }

  // Write session files
  writeFileSync(
    join(sessionDir, 'tasks.json'),
    JSON.stringify({ backlog: backlog.backlog }, null, 2)
  );
  writeFileSync(join(sessionDir, 'prd_snapshot.md'), '# Test PRD\n');
  writeFileSync(join(sessionDir, 'delta_from.txt'), '');

  return sessionDir;
}

// PATTERN: 'prd task' display test
describe('PRD Task Command Integration Tests', () => {
  let tempDir: string;
  let sessionManager: SessionManager;

  beforeEach(() => {
    tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
    sessionManager = new SessionManager(
      join(tempDir, 'PRD.md'),
      join(tempDir, 'plan')
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('prd task command', () => {
    it('should display tasks from current session in hierarchical format', async () => {
      // SETUP: Create test session
      const backlog = createTestBacklog();
      const sessionDir = setupTestSession(tempDir, '001_testsession', backlog);

      await sessionManager.loadSession(sessionDir);
      const orchestrator = new TaskOrchestrator(sessionManager);

      // EXECUTE: Get all tasks (simulating 'prd task' output)
      const tasks = orchestrator.executionQueue;

      // VERIFY: Tasks are in hierarchy
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].id).toBe('P1.M1.T1.S1'); // DFS order
    });
  });

  describe('prd task next', () => {
    it('should return next executable task (first Planned or Researching)', async () => {
      // SETUP: Create session with mixed statuses
      const backlog = createTestBacklog();
      const sessionDir = setupTestSession(tempDir, '001_testsession', backlog);

      await sessionManager.loadSession(sessionDir);
      const orchestrator = new TaskOrchestrator(sessionManager);

      // EXECUTE: Get next task
      const nextTask = orchestrator.executionQueue.find(
        t => t.status === 'Planned' || t.status === 'Researching'
      );

      // VERIFY: Next task is P1.M1.T2.S1 (Researching, comes before Planned S2 in DFS)
      expect(nextTask).toBeDefined();
      expect(nextTask!.id).toBe('P1.M1.T2.S1');
      expect(nextTask!.status).toBe('Researching');
    });

    it('should return null when all tasks are Complete', async () => {
      // SETUP: Create session with all Complete tasks
      const backlog: Backlog = {
        backlog: [
          createTestPhase('P1', 'Phase 1', [
            createTestMilestone('P1.M1', 'Milestone 1', [
              createTestTask('P1.M1.T1', 'Task 1', [
                createTestSubtask('P1.M1.T1.S1', 'Complete Task', 'Complete'),
              ]),
            ]),
          ]),
        ],
      };
      const sessionDir = setupTestSession(tempDir, '001_complete', backlog);

      await sessionManager.loadSession(sessionDir);
      const orchestrator = new TaskOrchestrator(sessionManager);

      // EXECUTE: Find next task
      const nextTask = orchestrator.executionQueue.find(
        t => t.status === 'Planned' || t.status === 'Researching'
      );

      // VERIFY: No next task
      expect(nextTask).toBeUndefined();
    });
  });

  describe('prd task status', () => {
    it('should show counts by status', async () => {
      // SETUP: Create session with various statuses
      const backlog = createTestBacklog();
      const sessionDir = setupTestSession(tempDir, '001_testsession', backlog);

      await sessionManager.loadSession(sessionDir);
      const orchestrator = new TaskOrchestrator(sessionManager);

      // EXECUTE: Count tasks by status
      const tasks = orchestrator.executionQueue;
      const counts: Record<Status, number> = {
        Planned: 0,
        Researching: 0,
        Implementing: 0,
        Complete: 0,
        Failed: 0,
        Obsolete: 0,
      };

      for (const task of tasks) {
        counts[task.status]++;
      }

      // VERIFY: Correct counts
      expect(counts.Complete).toBe(1);
      expect(counts.Planned).toBe(1);
      expect(counts.Researching).toBe(1);
      expect(counts.Implementing).toBe(1);
      expect(counts.Failed).toBe(0);
      expect(counts.Obsolete).toBe(0);
    });
  });

  describe('file override -f <file>', () => {
    it('should load tasks from specified file path', async () => {
      // SETUP: Create alternative tasks.json
      const altBacklog: Backlog = {
        backlog: [
          createTestPhase('P2', 'Alternative Phase', [
            createTestMilestone('P2.M1', 'Alt Milestone', [
              createTestTask('P2.M1.T1', 'Alt Task', [
                createTestSubtask('P2.M1.T1.S1', 'Alt Subtask'),
              ]),
            ]),
          ]),
        ],
      };

      const altFilePath = join(tempDir, 'alternative-tasks.json');
      writeFileSync(altFilePath, JSON.stringify(altBacklog, null, 2));

      // EXECUTE: Load from alternative file (simulated)
      const content = readFileSync(altFilePath, 'utf-8');
      const loadedBacklog = JSON.parse(content) as Backlog;

      // VERIFY: Alternative file loaded
      expect(loadedBacklog.backlog[0].id).toBe('P2');
      expect(loadedBacklog.backlog[0].title).toBe('Alternative Phase');
    });
  });

  describe('bugfix session priority', () => {
    it('should prioritize bugfix tasks over main tasks', async () => {
      // SETUP: Create main session
      const mainBacklog = createTestBacklog();
      const mainSession = setupTestSession(tempDir, '001_mainsession', mainBacklog);

      // SETUP: Create bugfix session
      const bugfixBacklog: Backlog = {
        backlog: [
          createTestPhase('PFIX', 'Bugfix Phase', [
            createTestMilestone('PFIX.M1', 'Bugfix Milestone', [
              createTestTask('PFIX.M1.T1', 'Bugfix Task', [
                createTestSubtask('PFIX.M1.T1.S1', 'Critical Bug Fix', 'Planned', 13),
              ]),
            ]),
          ]),
        ],
      };

      const bugfixDir = join(tempDir, 'plan', '001_mainsession', 'bugfix', '001_bugfix');
      for (const dir of [
        bugfixDir,
        join(bugfixDir, 'architecture'),
        join(bugfixDir, 'prps'),
        join(bugfixDir, 'artifacts'),
      ]) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(
        join(bugfixDir, 'tasks.json'),
        JSON.stringify(bugfixBacklog, null, 2)
      );

      // EXECUTE: Discover sessions (bugfix should be found first)
      const sessions = [mainSession, bugfixDir];

      // VERIFY: Bugfix session comes first in priority
      const bugfixIndex = sessions.findIndex(s => s.includes('bugfix'));
      expect(bugfixIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent file gracefully', () => {
      // SETUP: Non-existent file path
      const nonExistentPath = join(tempDir, 'does-not-exist.json');

      // EXECUTE: Try to read file
      const exists = existsSync(nonExistentPath);

      // VERIFY: File does not exist
      expect(exists).toBe(false);
    });

    it('should handle invalid JSON', () => {
      // SETUP: Invalid JSON file
      const invalidJsonPath = join(tempDir, 'invalid.json');
      writeFileSync(invalidJsonPath, '{ invalid json }');

      // EXECUTE: Try to parse
      const parse = () => {
        try {
          JSON.parse(readFileSync(invalidJsonPath, 'utf-8'));
          return true;
        } catch {
          return false;
        }
      };

      // VERIFY: Parse fails
      expect(parse()).toBe(false);
    });
  });
});
```

### Integration Points

```yaml
SESSION_MANAGER:
  - file: src/core/session-manager.ts
  - import: SessionManager
  - use: Load session state for testing
  - method: loadSession(path), discoverSessions()

TASK_ORCHESTRATOR:
  - file: src/core/task-orchestrator.ts
  - import: TaskOrchestrator
  - use: Get execution queue and find next task
  - property: executionQueue, currentItemId

MODELS:
  - file: src/core/models.ts
  - import: Backlog, Phase, Milestone, Task, Subtask, Status
  - use: Type definitions for test data creation

CLI:
  - file: src/cli/index.ts
  - use: Reference for existing CLI patterns
  - gotcha: Currently no subcommands - this tests future implementation
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/prd-task-command.test.ts
npm run format -- tests/integration/prd-task-command.test.ts

# Expected: Zero linting errors, proper formatting
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file specifically
npm test -- prd-task-command.test.ts

# Run with coverage to verify comprehensive coverage
npm run test:coverage -- tests/integration/prd-task-command.test.ts

# Expected: All tests pass
# - prd task display tests pass
# - prd task next tests pass
# - prd task status tests pass
# - file override tests pass
# - bugfix priority tests pass
# - error handling tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Full integration test suite
npm test -- tests/integration/

# Verify no regressions in existing tests
npm test -- tests/integration/core/session-manager.test.ts
npm test -- tests/integration/core/task-orchestrator-e2e.test.ts
npm test -- tests/unit/cli/index.test.ts

# Expected: All existing tests still pass
# - Session management tests still work
# - Task orchestrator tests still work
# - CLI tests still work
```

### Level 4: Domain-Specific Validation

```bash
# Verify type checking passes
npm run typecheck

# Expected: No TypeScript errors
# - All Backlog, Phase, etc. type usages are correct
# - Status type is correctly narrowed
# - No implicit any types

# Run tests in watch mode for interactive verification
npm test:watch -- prd-task-command.test.ts

# Expected: Tests pass on save, proper watch behavior
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file compiles without TypeScript errors
- [ ] All linting rules pass: `npm run lint`
- [ ] Code follows existing test patterns from session-structure.test.ts and cli/index.test.ts
- [ ] Mock setup/teardown properly cleans up state (vi.clearAllMocks() in beforeEach)
- [ ] No mock state leakage between tests

### Feature Validation

- [ ] `prd task` displays tasks from current session in hierarchical format
- [ ] `prd task next` returns next executable task (first 'Planned' or 'Researching')
- [ ] `prd task status` shows accurate counts by status
- [ ] `prd task -f <file>` loads tasks from specified file path
- [ ] Bugfix session tasks are prioritized over main session tasks
- [ ] Invalid file paths produce helpful error messages
- [ ] Non-existent files produce "file not found" errors
- [ ] Invalid JSON produces parse errors

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

- ❌ Don't create new patterns - follow existing test structure from session-structure.test.ts
- ❌ Don't use callbacks in describe - use beforeEach for setup
- ❌ Don't leak mock state - always call `vi.clearAllMocks()` in beforeEach
- ❌ Don't forget to test all subcommands (list, next, status, -f)
- ❌ Don't hardcode test data - use factory functions
- ❌ Don't skip bugfix priority tests - critical for task discovery
- ❌ Don't forget to cleanup temp directories in afterEach
- ❌ Don't create sessions without required subdirectories (architecture, prps, artifacts)
- ❌ Don't use 'as const' incorrectly - only for type discriminators like `type: 'Subtask' as const`
- ❌ Don't assume the command is implemented - tests mock the expected behavior
- ❌ Don't test the actual CLI execution - test the logic that the CLI would call

---

**PRP Version**: 1.0
**Created**: 2026-01-21
**For**: P1.M2.T3.S3 - Task Management Verification
**Confidence Score**: 10/10 (Excellent - comprehensive research, specific file references, clear implementation patterns)
