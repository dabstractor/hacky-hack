/**
 * Integration tests for scope resolution and execution
 *
 * @remarks
 * Tests validate scope string parsing, backlog filtering,
 * and execution queue isolation. Tests verify complete flow:
 * CLI scope parsing -> ScopeResolver -> TaskOrchestrator queue.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

import { SessionManager } from '../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';
import { parseScope, ScopeParseError } from '../../src/core/scope-resolver.js';
import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
} from '../../src/core/models.js';
import type { Scope } from '../../src/core/scope-resolver.js';
import { mockSimplePRD } from '../fixtures/simple-prd.js';

// =============================================================================
// MOCK SETUP
// =============================================================================

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
// TEST CONSTANTS
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
  context_scope:
    'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test scope\n2. INPUT: None\n3. LOGIC: Test logic\n4. OUTPUT: Test output',
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

async function createSessionWithBacklog(
  backlog: Backlog,
  planDir: string,
  _prdPath: string
): Promise<string> {
  // Hash the PRD to get the session hash (same as SessionManager.initialize())
  const prdHash = createHash('sha256').update(mockSimplePRD).digest('hex');
  const sessionHash = prdHash.substring(0, 12);

  // Create session directory with correct format: 002_<hash>
  // (sequence 001 is used by setupTestEnvironment)
  const sessionDir = join(planDir, `002_${sessionHash}`);

  // Create required subdirectories
  for (const dir of [
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
  writeFileSync(join(sessionDir, 'prd_snapshot.md'), mockSimplePRD);
  writeFileSync(join(sessionDir, 'delta_from.txt'), '');

  return sessionDir;
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

  const sessionManager = new SessionManager(prdPath, planDir, 3);

  return { tempDir, prdPath, sessionManager };
}

// =============================================================================
// Test Suites
// =============================================================================

describe('Scope Resolution Integration Tests', () => {
  let tempDir: string;
  let prdPath: string;
  let sessionManager: SessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    const env = setupTestEnvironment();
    tempDir = env.tempDir;
    prdPath = env.prdPath;
    sessionManager = env.sessionManager;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ===========================================================================
  // Phase Scope Filtering Tests
  // ===========================================================================

  describe('Phase Scope Filtering', () => {
    it('should filter backlog to Phase 3 only when scope is P3', async () => {
      // SETUP: Create backlog with P1, P2, P3
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // EXECUTE: Create orchestrator with P3 scope
      const scope: Scope = { type: 'phase', id: 'P3' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains P3 phase + all descendants (1 phase + 2 milestones + 4 tasks + 8 subtasks = 15 items)
      expect(queue.length).toBe(15);
      expect(
        queue.every(item => item.id === 'P3' || item.id.startsWith('P3.'))
      ).toBe(true);

      // VERIFY: P3 phase is in queue
      expect(queue.some(item => item.id === 'P3')).toBe(true);

      // VERIFY: P3 milestones are in queue
      expect(queue.some(item => item.id === 'P3.M3')).toBe(true);
      expect(queue.some(item => item.id === 'P3.M4')).toBe(true);

      // VERIFY: P3 tasks are in queue
      expect(queue.some(item => item.id === 'P3.M3.T1')).toBe(true);
      expect(queue.some(item => item.id === 'P3.M3.T2')).toBe(true);
      expect(queue.some(item => item.id === 'P3.M4.T1')).toBe(true);
      expect(queue.some(item => item.id === 'P3.M4.T2')).toBe(true);

      // VERIFY: No P1 or P2 items in queue
      expect(queue.some(item => item.id.startsWith('P1.'))).toBe(false);
      expect(queue.some(item => item.id.startsWith('P2.'))).toBe(false);
    });

    it('should filter backlog to Phase 1 only when scope is P1', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'phase', id: 'P1' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains P1 phase + all descendants (1 phase + 2 milestones + 4 tasks + 8 subtasks = 15 items)
      expect(queue.length).toBe(15);
      expect(
        queue.every(item => item.id === 'P1' || item.id.startsWith('P1.'))
      ).toBe(true);

      // VERIFY: P1 phase is in queue
      expect(queue.some(item => item.id === 'P1')).toBe(true);

      // VERIFY: No P2 or P3 items in queue
      expect(queue.some(item => item.id.startsWith('P2.'))).toBe(false);
      expect(queue.some(item => item.id.startsWith('P3.'))).toBe(false);
    });

    it('should filter backlog to Phase 2 only when scope is P2', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'phase', id: 'P2' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains P2 phase + all descendants (1 phase + 2 milestones + 4 tasks + 8 subtasks = 15 items)
      expect(queue.length).toBe(15);
      expect(
        queue.every(item => item.id === 'P2' || item.id.startsWith('P2.'))
      ).toBe(true);

      // VERIFY: P2 phase is in queue
      expect(queue.some(item => item.id === 'P2')).toBe(true);

      // VERIFY: No P1 or P3 items in queue
      expect(queue.some(item => item.id.startsWith('P1.'))).toBe(false);
      expect(queue.some(item => item.id.startsWith('P3.'))).toBe(false);
    });
  });

  // ===========================================================================
  // Milestone Scope Filtering Tests
  // ===========================================================================

  describe('Milestone Scope Filtering', () => {
    it('should filter backlog to Milestone 4 only when scope is P3.M4', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'milestone', id: 'P3.M4' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains P3.M4 milestone + all descendants (1 milestone + 2 tasks + 4 subtasks = 7 items)
      expect(queue.length).toBe(7);
      expect(
        queue.every(item => item.id === 'P3.M4' || item.id.startsWith('P3.M4.'))
      ).toBe(true);

      // VERIFY: P3.M4 milestone is in queue
      expect(queue.some(item => item.id === 'P3.M4')).toBe(true);

      // VERIFY: P3.M4 tasks are in queue
      expect(queue.some(item => item.id === 'P3.M4.T1')).toBe(true);
      expect(queue.some(item => item.id === 'P3.M4.T2')).toBe(true);

      // VERIFY: No other milestones in queue
      expect(queue.some(item => item.id.startsWith('P3.M3.'))).toBe(false);
      expect(queue.some(item => item.id.startsWith('P1.'))).toBe(false);
      expect(queue.some(item => item.id.startsWith('P2.'))).toBe(false);
    });

    it('should filter backlog to P1.M2 only when scope is P1.M2', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'milestone', id: 'P1.M2' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains P1.M2 milestone + all descendants (1 milestone + 2 tasks + 4 subtasks = 7 items)
      expect(queue.length).toBe(7);
      expect(
        queue.every(item => item.id === 'P1.M2' || item.id.startsWith('P1.M2.'))
      ).toBe(true);

      // VERIFY: P1.M2 milestone is in queue
      expect(queue.some(item => item.id === 'P1.M2')).toBe(true);

      // VERIFY: No other milestones in queue
      expect(queue.some(item => item.id.startsWith('P1.M1.'))).toBe(false);
    });

    it('should include parent milestone but not parent phase in execution queue for milestone scope', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'milestone', id: 'P2.M1' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Milestone is in queue, but parent phase is not
      expect(queue.some(item => item.id === 'P2.M1')).toBe(true);
      expect(queue.some(item => item.id === 'P2')).toBe(false);

      // VERIFY: Queue contains milestone + tasks + subtasks (1 milestone + 2 tasks + 4 subtasks = 7 items)
      expect(queue.length).toBe(7);
    });
  });

  // ===========================================================================
  // Task Scope Filtering Tests
  // ===========================================================================

  describe('Task Scope Filtering', () => {
    it('should filter backlog to Task 3 only when scope is P1.M2.T3', async () => {
      // First, create a custom backlog with the exact task structure needed
      const subtasks = [
        createTestSubtask('P1.M2.T3.S1', 'Subtask 1'),
        createTestSubtask('P1.M2.T3.S2', 'Subtask 2'),
        createTestSubtask('P1.M2.T3.S3', 'Subtask 3'),
      ];
      const task = createTestTask('P1.M2.T3', 'Task 3', subtasks);
      const milestone = createTestMilestone('P1.M2', 'Milestone 2', [task]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'task', id: 'P1.M2.T3' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains task + all subtasks (1 task + 3 subtasks = 4 items)
      expect(queue.length).toBe(4);
      expect(
        queue.every(
          item => item.id === 'P1.M2.T3' || item.id.startsWith('P1.M2.T3.')
        )
      ).toBe(true);

      // VERIFY: Task is in queue
      expect(queue.some(item => item.id === 'P1.M2.T3')).toBe(true);
    });

    it('should include parent task but not parent milestone or phase in execution queue for task scope', async () => {
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Subtask 1'),
        createTestSubtask('P1.M1.T1.S2', 'Subtask 2'),
      ];
      const task = createTestTask('P1.M1.T1', 'Task 1', subtasks);
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', [task]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Task is in queue, but parent milestone and phase are not
      expect(queue.some(item => item.id === 'P1.M1.T1')).toBe(true);
      expect(queue.some(item => item.id === 'P1.M1')).toBe(false);
      expect(queue.some(item => item.id === 'P1')).toBe(false);

      // VERIFY: Queue contains task + subtasks (1 task + 2 subtasks = 3 items)
      expect(queue.length).toBe(3);
    });

    it('should exclude other tasks in same milestone', async () => {
      const task1Subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'T1S1'),
        createTestSubtask('P1.M1.T1.S2', 'T1S2'),
      ];
      const task2Subtasks = [
        createTestSubtask('P1.M1.T2.S1', 'T2S1'),
        createTestSubtask('P1.M1.T2.S2', 'T2S2'),
      ];
      const task1 = createTestTask('P1.M1.T1', 'Task 1', task1Subtasks);
      const task2 = createTestTask('P1.M1.T2', 'Task 2', task2Subtasks);
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', [
        task1,
        task2,
      ]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains T1 + its subtasks, not T2 (1 task + 2 subtasks = 3 items)
      expect(queue.length).toBe(3);
      expect(
        queue.every(
          item => item.id === 'P1.M1.T1' || item.id.startsWith('P1.M1.T1.')
        )
      ).toBe(true);
      expect(queue.some(item => item.id.startsWith('P1.M1.T2.'))).toBe(false);

      // VERIFY: T1 task is in queue
      expect(queue.some(item => item.id === 'P1.M1.T1')).toBe(true);
    });
  });

  // ===========================================================================
  // Subtask Scope Filtering Tests
  // ===========================================================================

  describe('Subtask Scope Filtering', () => {
    it('should filter backlog to Subtask 1 only when scope is P1.M2.T3.S1', async () => {
      const subtasks = [
        createTestSubtask('P1.M2.T3.S1', 'Subtask 1'),
        createTestSubtask('P1.M2.T3.S2', 'Subtask 2'),
      ];
      const task = createTestTask('P1.M2.T3', 'Task 3', subtasks);
      const milestone = createTestMilestone('P1.M2', 'Milestone 2', [task]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'subtask', id: 'P1.M2.T3.S1' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains only the single subtask
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe('P1.M2.T3.S1');
      expect(queue[0].type).toBe('Subtask');
    });

    it('should include only the subtask (not parent task) in execution queue for subtask scope', async () => {
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Subtask 1'),
        createTestSubtask('P1.M1.T1.S2', 'Subtask 2'),
      ];
      const task = createTestTask('P1.M1.T1', 'Task 1', subtasks);
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', [task]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S1' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Only S1 in queue, no parent task
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe('P1.M1.T1.S1');
      expect(queue.some(item => item.id === 'P1.M1.T1')).toBe(false);
    });

    it('should exclude sibling subtasks', async () => {
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Subtask 1'),
        createTestSubtask('P1.M1.T1.S2', 'Subtask 2'),
        createTestSubtask('P1.M1.T1.S3', 'Subtask 3'),
      ];
      const task = createTestTask('P1.M1.T1', 'Task 1', subtasks);
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', [task]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S2' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Only S2, not S1 or S3
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe('P1.M1.T1.S2');
    });
  });

  // ===========================================================================
  // "all" Scope Tests
  // ===========================================================================

  describe('"all" Scope', () => {
    it('should return all leaf subtasks when scope is "all"', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Test with undefined scope (defaults to 'all')
      const orchestrator = new TaskOrchestrator(sessionManager);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains all 24 subtasks (8 per phase)
      expect(queue.length).toBe(24);
      expect(queue.every(item => item.type === 'Subtask')).toBe(true);
    });

    it('should return subtasks from all phases', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'all' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Items from all three phases
      const hasP1 = queue.some(item => item.id.startsWith('P1.'));
      const hasP2 = queue.some(item => item.id.startsWith('P2.'));
      const hasP3 = queue.some(item => item.id.startsWith('P3.'));

      expect(hasP1).toBe(true);
      expect(hasP2).toBe(true);
      expect(hasP3).toBe(true);
    });

    it('should not include parent items in execution queue', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const orchestrator = new TaskOrchestrator(sessionManager);
      const queue = orchestrator.executionQueue;

      // VERIFY: No phases, milestones, or tasks in queue
      expect(queue.some(item => item.type === 'Phase')).toBe(false);
      expect(queue.some(item => item.type === 'Milestone')).toBe(false);
      expect(queue.some(item => item.type === 'Task')).toBe(false);
      expect(queue.every(item => item.type === 'Subtask')).toBe(true);
    });
  });

  // ===========================================================================
  // Invalid Scope Handling Tests
  // ===========================================================================

  describe('Invalid Scope Handling', () => {
    it('should throw ScopeParseError for empty string', () => {
      expect(() => parseScope('')).toThrow(ScopeParseError);
      expect(() => parseScope('')).toThrow('non-empty scope string');
    });

    it('should throw ScopeParseError for malformed scope', () => {
      expect(() => parseScope('P1.X1')).toThrow(ScopeParseError);
      expect(() => parseScope('P1.X1')).toThrow('milestone format');
    });

    it('should throw ScopeParseError for invalid task format', () => {
      expect(() => parseScope('P1.M1.X1')).toThrow(ScopeParseError);
      expect(() => parseScope('P1.M1.X1')).toThrow('task format');
    });

    it('should throw ScopeParseError for too many components', () => {
      expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow(ScopeParseError);
      expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow('valid scope format');
    });

    it('should throw ScopeParseError for lowercase phase', () => {
      expect(() => parseScope('p1')).toThrow(ScopeParseError);
      expect(() => parseScope('p1')).toThrow('phase format');
    });
  });

  // ===========================================================================
  // Non-Existent ID Handling Tests
  // ===========================================================================

  describe('Non-Existent ID Handling', () => {
    it('should return empty execution queue for non-existent phase', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'phase', id: 'P999' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      expect(queue).toEqual([]);
    });

    it('should return empty execution queue for non-existent milestone', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'milestone', id: 'P1.M999' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      expect(queue).toEqual([]);
    });

    it('should return empty execution queue for non-existent task', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'task', id: 'P1.M1.T999' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      expect(queue).toEqual([]);
    });

    it('should return empty execution queue for non-existent subtask', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S999' };
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      expect(queue).toEqual([]);
    });
  });

  // ===========================================================================
  // Mid-Execution Scope Change Tests
  // ===========================================================================

  describe('Mid-Execution Scope Change', () => {
    it('should rebuild execution queue when setScope is called', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Start with all items
      const orchestrator = new TaskOrchestrator(sessionManager);
      const initialQueueLength = orchestrator.executionQueue.length;

      // Change to P1.M2 scope
      await orchestrator.setScope({ type: 'milestone', id: 'P1.M2' });
      const newQueueLength = orchestrator.executionQueue.length;

      // VERIFY: Queue was rebuilt with new scope
      expect(initialQueueLength).toBe(24); // All subtasks
      expect(newQueueLength).toBe(7); // P1.M2 milestone + 2 tasks + 4 subtasks
    });

    it('should replace queue (not append) when scope changes', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Start with P1 scope
      const orchestrator = new TaskOrchestrator(sessionManager, {
        type: 'phase',
        id: 'P1',
      });
      expect(orchestrator.executionQueue.length).toBe(15);

      // Change to P2 scope
      await orchestrator.setScope({ type: 'phase', id: 'P2' });

      // VERIFY: Queue only has P2 items, not P1 + P2
      expect(orchestrator.executionQueue.length).toBe(15);
      expect(
        orchestrator.executionQueue.every(
          item => item.id === 'P2' || item.id.startsWith('P2.')
        )
      ).toBe(true);
      expect(
        orchestrator.executionQueue.some(item => item.id.startsWith('P1.'))
      ).toBe(false);
    });

    it('should support narrowing scope from phase to milestone', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Start with P3 phase
      const orchestrator = new TaskOrchestrator(sessionManager, {
        type: 'phase',
        id: 'P3',
      });
      expect(orchestrator.executionQueue.length).toBe(15);

      // Narrow to P3.M4 milestone
      await orchestrator.setScope({ type: 'milestone', id: 'P3.M4' });

      // VERIFY: Queue narrowed to only P3.M4 items
      expect(orchestrator.executionQueue.length).toBe(7);
      expect(
        orchestrator.executionQueue.every(
          item => item.id === 'P3.M4' || item.id.startsWith('P3.M4.')
        )
      ).toBe(true);
    });
  });

  // ===========================================================================
  // Integration Tests: Parse and Resolve Flow
  // ===========================================================================

  describe('Integration: Parse and Resolve Flow', () => {
    it('should parse and resolve "all" scope end-to-end', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Parse scope string
      const scope = parseScope('all');
      expect(scope.type).toBe('all');

      // Create orchestrator with parsed scope
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: All subtasks in queue
      expect(queue.length).toBe(24);
      expect(queue.every(item => item.type === 'Subtask')).toBe(true);
    });

    it('should parse and resolve phase scope end-to-end', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Parse and resolve
      const scope = parseScope('P3');
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Only P3 items (phase + all descendants = 15 items)
      expect(queue.length).toBe(15);
      expect(
        queue.every(item => item.id === 'P3' || item.id.startsWith('P3.'))
      ).toBe(true);
    });

    it('should parse and resolve milestone scope end-to-end', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope = parseScope('P3.M4');
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains milestone + all descendants (1 milestone + 2 tasks + 4 subtasks = 7 items)
      expect(queue.length).toBe(7);
      expect(
        queue.every(item => item.id === 'P3.M4' || item.id.startsWith('P3.M4.'))
      ).toBe(true);
    });

    it('should parse and resolve task scope end-to-end', async () => {
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'S1'),
        createTestSubtask('P1.M1.T1.S2', 'S2'),
      ];
      const task = createTestTask('P1.M1.T1', 'Task 1', subtasks);
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', [task]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope = parseScope('P1.M1.T1');
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      // VERIFY: Queue contains task + all subtasks (1 task + 2 subtasks = 3 items)
      expect(queue.length).toBe(3);
      expect(
        queue.every(
          item => item.id === 'P1.M1.T1' || item.id.startsWith('P1.M1.T1.')
        )
      ).toBe(true);
    });

    it('should parse and resolve subtask scope end-to-end', async () => {
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'S1'),
        createTestSubtask('P1.M1.T1.S2', 'S2'),
      ];
      const task = createTestTask('P1.M1.T1', 'Task 1', subtasks);
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', [task]);
      const phase = createTestPhase('P1', 'Phase 1', [milestone]);
      const backlog: Backlog = { backlog: [phase] };

      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      const scope = parseScope('P1.M1.T1.S1');
      const orchestrator = new TaskOrchestrator(sessionManager, scope);
      const queue = orchestrator.executionQueue;

      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe('P1.M1.T1.S1');
    });
  });

  // ===========================================================================
  // Cross-Scope Isolation Tests
  // ===========================================================================

  describe('Cross-Scope Isolation', () => {
    it('should ensure no cross-scope leakage between phases', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Test each phase scope independently
      const p1Scope: Scope = { type: 'phase', id: 'P1' };
      const p2Scope: Scope = { type: 'phase', id: 'P2' };
      const p3Scope: Scope = { type: 'phase', id: 'P3' };

      const p1Orchestrator = new TaskOrchestrator(sessionManager, p1Scope);
      const p2Orchestrator = new TaskOrchestrator(sessionManager, p2Scope);
      const p3Orchestrator = new TaskOrchestrator(sessionManager, p3Scope);

      // VERIFY: Each scope only contains its own items (including the phase itself)
      expect(
        p1Orchestrator.executionQueue.every(
          item => item.id === 'P1' || item.id.startsWith('P1.')
        )
      ).toBe(true);
      expect(
        p2Orchestrator.executionQueue.every(
          item => item.id === 'P2' || item.id.startsWith('P2.')
        )
      ).toBe(true);
      expect(
        p3Orchestrator.executionQueue.every(
          item => item.id === 'P3' || item.id.startsWith('P3.')
        )
      ).toBe(true);
    });

    it('should ensure no cross-scope leakage between milestones', async () => {
      const backlog = createMultiPhaseBacklog();
      const planDir = join(tempDir, 'plan');
      await createSessionWithBacklog(backlog, planDir, prdPath);
      await sessionManager.initialize();

      // Test P3 milestones
      const p3m3Scope: Scope = { type: 'milestone', id: 'P3.M3' };
      const p3m4Scope: Scope = { type: 'milestone', id: 'P3.M4' };

      const p3m3Orchestrator = new TaskOrchestrator(sessionManager, p3m3Scope);
      const p3m4Orchestrator = new TaskOrchestrator(sessionManager, p3m4Scope);

      // VERIFY: No cross-leakage (including the milestone itself)
      expect(
        p3m3Orchestrator.executionQueue.every(
          item => item.id === 'P3.M3' || item.id.startsWith('P3.M3.')
        )
      ).toBe(true);
      expect(
        p3m3Orchestrator.executionQueue.some(item =>
          item.id.startsWith('P3.M4.')
        )
      ).toBe(false);

      expect(
        p3m4Orchestrator.executionQueue.every(
          item => item.id === 'P3.M4' || item.id.startsWith('P3.M4.')
        )
      ).toBe(true);
      expect(
        p3m4Orchestrator.executionQueue.some(item =>
          item.id.startsWith('P3.M3.')
        )
      ).toBe(false);
    });
  });
});
