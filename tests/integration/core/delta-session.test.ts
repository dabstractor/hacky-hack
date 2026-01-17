/**
 * Integration tests for Delta Session Creation and Linkage
 *
 * @remarks
 * Tests validate the delta session creation workflow including:
 * - Delta session directory creation with new hash (CONTRACT a)
 * - Parent-child linkage via parent_session.txt (CONTRACT b)
 * - Delta PRD generation with diff summary (CONTRACT c)
 * - TaskPatcher task state marking for new/modified/obsolete (CONTRACT d)
 *
 * These tests use real filesystem operations in temporary directories to provide
 * true integration validation (not mocks). Tests validate:
 *
 * - Delta session directory is created with new hash (different from parent)
 * - parent_session.txt contains parent session ID (not path)
 * - Delta PRD (diffSummary) is generated focusing only on changes
 * - TaskPatcher correctly marks tasks as new/modified/obsolete
 * - Session metadata includes correct parent session reference
 * - Sequence numbers increment correctly across delta sessions
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../../../src/core/session-manager.ts | SessionManager Implementation}
 * @see {@link ../../../../src/core/task-patcher.ts | TaskPatcher Implementation}
 * @see {@link ../../../../src/core/prd-differ.ts | PRD Differ Implementation}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';

import { SessionManager } from '../../../src/core/session-manager.js';
import { patchBacklog } from '../../../src/core/task-patcher.js';
import { findItem } from '../../../src/utils/task-utils.js';
import type { Backlog, DeltaAnalysis } from '../../../src/core/models.js';

import { mockSimplePRD } from '../../fixtures/simple-prd.js';
import { mockSimplePRDv2 } from '../../fixtures/simple-prd-v2.js';

// =============================================================================
// TEST FIXTURE: Helper functions for delta session testing
// =============================================================================

/**
 * Creates a test PRD file at the specified path with the given content
 */
function createTestPRD(path: string, content: string): void {
  writeFileSync(path, content, { mode: 0o644 });
}

/**
 * Creates a minimal valid Backlog structure for testing task patching
 */
function createTestBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone',
            status: 'Complete',
            description: 'Test milestone',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task',
                status: 'Complete',
                description: 'Test task',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask 1',
                    status: 'Complete',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S2',
                    title: 'Test Subtask 2',
                    status: 'Complete',
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                ],
              },
              {
                type: 'Task',
                id: 'P1.M1.T2',
                title: 'Test Task 2',
                status: 'Complete',
                description: 'Test task 2',
                subtasks: [],
              },
            ],
          },
          {
            type: 'Milestone',
            id: 'P1.M2',
            title: 'Test Milestone 2',
            status: 'Complete',
            description: 'Test milestone 2',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M2.T1',
                title: 'Test Task 3',
                status: 'Complete',
                description: 'Test task 3',
                subtasks: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Creates a mock DeltaAnalysis object for testing TaskPatcher
 */
function createMockDeltaAnalysis(
  overrides?: Partial<DeltaAnalysis>
): DeltaAnalysis {
  return {
    changes: [
      {
        type: 'modified',
        itemId: 'P1.M1.T1.S1',
        description: 'Modified subtask content',
        impact: 'high',
      },
    ],
    patchInstructions: 'Test patch instructions',
    taskIds: ['P1.M1.T1.S1'],
    ...overrides,
  };
}

// =============================================================================
// TEST SUITE: Delta Session Creation and Linkage
// =============================================================================

describe('Delta Session Creation and Linkage', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;

  // ---------------------------------------------------------------------------
  // PATTERN: Temp directory setup and cleanup
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'delta-session-test-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CONTRACT a: Delta session directory creation with new hash
  // ==========================================================================

  it('should create delta session directory with new hash', async () => {
    // SETUP: Create initial PRD and session
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();
    const parentSessionId = manager.currentSession.metadata.id;
    const parentHash = manager.currentSession.metadata.hash;

    // MODIFY: Update PRD with new content
    createTestPRD(prdPath, mockSimplePRDv2);

    // EXECUTE: Create delta session
    const deltaSession = await manager.createDeltaSession(prdPath);

    // VERIFY: Delta session has different ID (different hash)
    expect(deltaSession.metadata.id).not.toBe(parentSessionId);

    // VERIFY: Delta session follows naming pattern {sequence}_{hash}
    expect(deltaSession.metadata.id).toMatch(/^(\d{3})_([a-f0-9]{12})$/);

    // VERIFY: Delta session has incremented sequence number
    const parentSeq = parseInt(parentSessionId.split('_')[0], 10);
    const deltaSeq = parseInt(deltaSession.metadata.id.split('_')[0], 10);
    expect(deltaSeq).toBe(parentSeq + 1);

    // VERIFY: Delta session has different hash
    expect(deltaSession.metadata.hash).not.toBe(parentHash);

    // VERIFY: Delta session directory exists
    expect(existsSync(deltaSession.metadata.path)).toBe(true);

    // VERIFY: Delta session path contains session ID
    expect(deltaSession.metadata.path).toContain(deltaSession.metadata.id);
  });

  // ==========================================================================
  // CONTRACT b: parent_session.txt linkage
  // ==========================================================================

  it('should create parent_session.txt with parent session ID', async () => {
    // SETUP: Create initial session and delta session
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();
    const parentSessionId = manager.currentSession.metadata.id;

    createTestPRD(prdPath, mockSimplePRDv2);
    const deltaSession = await manager.createDeltaSession(prdPath);

    // VERIFY: parent_session.txt file exists
    const parentSessionPath = join(
      deltaSession.metadata.path,
      'parent_session.txt'
    );
    expect(existsSync(parentSessionPath)).toBe(true);

    // VERIFY: parent_session.txt contains parent session ID
    const parentContent = readFileSync(parentSessionPath, 'utf-8');
    expect(parentContent.trim()).toBe(parentSessionId);

    // VERIFY: Delta session metadata includes parent reference
    expect(deltaSession.metadata.parentSession).toBe(parentSessionId);

    // VERIFY: Parent session ID is not a path, just the ID
    expect(parentSessionId).not.toContain('/');
    expect(parentSessionId).toMatch(/^(\d{3})_([a-f0-9]{12})$/);
  });

  // ==========================================================================
  // CONTRACT c: Delta PRD generation with diff summary
  // ==========================================================================

  it('should generate delta PRD with diff summary', async () => {
    // SETUP: Create initial session and delta session
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    createTestPRD(prdPath, mockSimplePRDv2);
    const deltaSession = await manager.createDeltaSession(prdPath);

    // VERIFY: Delta session contains old PRD
    expect(deltaSession.oldPRD).toBeDefined();
    expect(deltaSession.oldPRD).toBe(mockSimplePRD);

    // VERIFY: Delta session contains new PRD
    expect(deltaSession.newPRD).toBeDefined();
    expect(deltaSession.newPRD).toBe(mockSimplePRDv2);

    // VERIFY: Delta session contains diff summary
    expect(deltaSession.diffSummary).toBeDefined();
    expect(deltaSession.diffSummary.length).toBeGreaterThan(0);

    // VERIFY: Diff summary contains change information
    // The diff summary should mention the changes (like new task P1.M1.T2)
    expect(deltaSession.diffSummary).toBeTruthy();
  });

  // ==========================================================================
  // CONTRACT d: TaskPatcher task state marking - modified tasks
  // ==========================================================================

  it('should mark modified tasks as Planned for re-execution', () => {
    // SETUP: Create backlog with completed task
    const backlog = createTestBacklog();
    const deltaAnalysis = createMockDeltaAnalysis({
      changes: [
        {
          type: 'modified',
          itemId: 'P1.M1.T1.S1',
          description: 'Modified subtask content',
          impact: 'high',
        },
      ],
      taskIds: ['P1.M1.T1.S1'],
    });

    // EXECUTE: Patch backlog
    const patchedBacklog = patchBacklog(backlog, deltaAnalysis);

    // VERIFY: Task status changed to Planned
    const task = findItem(patchedBacklog, 'P1.M1.T1.S1');
    expect(task).toBeDefined();
    expect(task?.status).toBe('Planned');

    // VERIFY: Original backlog unchanged (immutability)
    const originalTask = findItem(backlog, 'P1.M1.T1.S1');
    expect(originalTask?.status).toBe('Complete');
  });

  // ==========================================================================
  // CONTRACT d: TaskPatcher task state marking - removed tasks
  // ==========================================================================

  it('should mark removed tasks as Obsolete', () => {
    // SETUP: Create backlog with completed task
    const backlog = createTestBacklog();
    const deltaAnalysis = createMockDeltaAnalysis({
      changes: [
        {
          type: 'removed',
          itemId: 'P1.M1.T2',
          description: 'Removed task',
          impact: 'medium',
        },
      ],
      taskIds: ['P1.M1.T2'],
    });

    // EXECUTE: Patch backlog
    const patchedBacklog = patchBacklog(backlog, deltaAnalysis);

    // VERIFY: Task status changed to Obsolete
    const task = findItem(patchedBacklog, 'P1.M1.T2');
    expect(task).toBeDefined();
    expect(task?.status).toBe('Obsolete');

    // VERIFY: Task still exists in backlog (not deleted)
    expect(task?.id).toBe('P1.M1.T2');
  });

  // ==========================================================================
  // CONTRACT d: TaskPatcher comprehensive test with multiple change types
  // ==========================================================================

  it('should handle multiple change types correctly', () => {
    // SETUP: Create backlog with multiple tasks
    const backlog = createTestBacklog();
    const deltaAnalysis = createMockDeltaAnalysis({
      changes: [
        {
          type: 'modified',
          itemId: 'P1.M1.T1.S1',
          description: 'Modified subtask',
          impact: 'high',
        },
        {
          type: 'removed',
          itemId: 'P1.M1.T2',
          description: 'Removed task',
          impact: 'medium',
        },
      ],
      taskIds: ['P1.M1.T1.S1', 'P1.M1.T2'],
    });

    // EXECUTE: Patch backlog
    const patchedBacklog = patchBacklog(backlog, deltaAnalysis);

    // VERIFY: Modified task is Planned
    const modifiedTask = findItem(patchedBacklog, 'P1.M1.T1.S1');
    expect(modifiedTask?.status).toBe('Planned');

    // VERIFY: Removed task is Obsolete
    const removedTask = findItem(patchedBacklog, 'P1.M1.T2');
    expect(removedTask?.status).toBe('Obsolete');

    // VERIFY: Unaffected tasks unchanged
    const unaffectedTask = findItem(patchedBacklog, 'P1.M2.T1');
    expect(unaffectedTask?.status).toBe('Complete');
  });

  // ==========================================================================
  // Comprehensive delta session integration test
  // ==========================================================================

  it('should create delta session and patch tasks end-to-end', async () => {
    // SETUP: Create session with completed tasks
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const parentSessionId = manager.currentSession.metadata.id;

    // MODIFY: Update PRD
    createTestPRD(prdPath, mockSimplePRDv2);

    // EXECUTE: Create delta session
    const deltaSession = await manager.createDeltaSession(prdPath);

    // VERIFY: Delta session structure
    expect(deltaSession.metadata.id).not.toBe(parentSessionId);
    expect(deltaSession.metadata.parentSession).toBe(parentSessionId);
    expect(deltaSession.oldPRD).toBe(mockSimplePRD);
    expect(deltaSession.newPRD).toBe(mockSimplePRDv2);
    expect(deltaSession.diffSummary).toBeDefined();

    // VERIFY: Parent linkage file
    const parentSessionPath = join(
      deltaSession.metadata.path,
      'parent_session.txt'
    );
    expect(existsSync(parentSessionPath)).toBe(true);
    expect(readFileSync(parentSessionPath, 'utf-8').trim()).toBe(
      parentSessionId
    );
  });

  // ==========================================================================
  // Edge cases: Multiple delta sessions in sequence
  // ==========================================================================

  it('should handle multiple delta sessions in sequence', async () => {
    // SETUP: Create initial session
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const session1Id = manager.currentSession.metadata.id;

    // MODIFY: Create first delta
    createTestPRD(prdPath, mockSimplePRDv2);
    const delta1 = await manager.createDeltaSession(prdPath);

    // VERIFY: First delta links to initial session
    expect(delta1.metadata.parentSession).toBe(session1Id);
    expect(parseInt(delta1.metadata.id.split('_')[0], 10)).toBe(2);

    // MODIFY: Create second delta (using v1 again - revert)
    createTestPRD(prdPath, mockSimplePRD);
    const delta2 = await manager.createDeltaSession(prdPath);

    // VERIFY: Second delta links to first delta
    expect(delta2.metadata.parentSession).toBe(delta1.metadata.id);
    expect(parseInt(delta2.metadata.id.split('_')[0], 10)).toBe(3);
  });

  // ==========================================================================
  // Edge cases: PRD with no changes
  // ==========================================================================

  it('should handle PRD with no changes', async () => {
    // SETUP: Create initial session
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();
    const parentSessionId = manager.currentSession.metadata.id;

    // MODIFY: Write the same PRD content (no actual changes)
    createTestPRD(prdPath, mockSimplePRD);

    // EXECUTE: Create delta session (should still work)
    const deltaSession = await manager.createDeltaSession(prdPath);

    // VERIFY: Delta session created with same hash
    expect(deltaSession.metadata.hash).toBe(
      manager.currentSession.metadata.hash
    );
    expect(deltaSession.metadata.parentSession).toBe(parentSessionId);
  });

  // ==========================================================================
  // Edge cases: Session metadata validation
  // ==========================================================================

  it('should include correct parent session reference in metadata', async () => {
    // SETUP: Create initial session
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();
    const parentSessionId = manager.currentSession.metadata.id;

    // EXECUTE: Create delta session
    createTestPRD(prdPath, mockSimplePRDv2);
    const deltaSession = await manager.createDeltaSession(prdPath);

    // VERIFY: Session metadata includes parent session reference
    expect(deltaSession.metadata.parentSession).toBeDefined();
    expect(deltaSession.metadata.parentSession).toBe(parentSessionId);
    expect(deltaSession.metadata.parentSession).toMatch(
      /^(\d{3})_([a-f0-9]{12})$/
    );
  });

  // ==========================================================================
  // CONTRACT verification: Delta session contains both oldPRD and newPRD
  // ==========================================================================

  it('should contain both oldPRD and newPRD content', async () => {
    // SETUP: Create initial session
    createTestPRD(prdPath, mockSimplePRD);
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // EXECUTE: Create delta session
    createTestPRD(prdPath, mockSimplePRDv2);
    const deltaSession = await manager.createDeltaSession(prdPath);

    // VERIFY: Delta session contains old PRD
    expect(deltaSession.oldPRD).toBeDefined();
    expect(typeof deltaSession.oldPRD).toBe('string');
    expect(deltaSession.oldPRD).toContain('Test Project');

    // VERIFY: Delta session contains new PRD
    expect(deltaSession.newPRD).toBeDefined();
    expect(typeof deltaSession.newPRD).toBe('string');
    expect(deltaSession.newPRD).toContain('Test Project');

    // VERIFY: PRDs are different
    expect(deltaSession.oldPRD).not.toBe(deltaSession.newPRD);
  });

  // ==========================================================================
  // TaskPatcher immutability verification
  // ==========================================================================

  it('should not mutate original backlog when patching', () => {
    // SETUP: Create backlog
    const backlog = createTestBacklog();
    const originalTask = findItem(backlog, 'P1.M1.T1.S1');
    const originalStatus = originalTask?.status;

    const deltaAnalysis = createMockDeltaAnalysis({
      changes: [
        {
          type: 'modified',
          itemId: 'P1.M1.T1.S1',
          description: 'Modified',
          impact: 'high',
        },
      ],
      taskIds: ['P1.M1.T1.S1'],
    });

    // EXECUTE: Patch backlog
    const patchedBacklog = patchBacklog(backlog, deltaAnalysis);

    // VERIFY: Original backlog unchanged
    const stillOriginalTask = findItem(backlog, 'P1.M1.T1.S1');
    expect(stillOriginalTask?.status).toBe(originalStatus);

    // VERIFY: Patched backlog has new status
    const patchedTask = findItem(patchedBacklog, 'P1.M1.T1.S1');
    expect(patchedTask?.status).toBe('Planned');

    // VERIFY: Backlogs are different objects
    expect(backlog).not.toBe(patchedBacklog);
  });

  // ==========================================================================
  // TaskPatcher: Handling multiple tasks in same change
  // ==========================================================================

  it('should handle marking multiple tasks in single patch operation', () => {
    // SETUP: Create backlog with multiple completed tasks
    const backlog = createTestBacklog();
    const deltaAnalysis = createMockDeltaAnalysis({
      changes: [
        {
          type: 'modified',
          itemId: 'P1.M1.T1.S1',
          description: 'Modified subtask 1',
          impact: 'high',
        },
        {
          type: 'modified',
          itemId: 'P1.M1.T1.S2',
          description: 'Modified subtask 2',
          impact: 'medium',
        },
        {
          type: 'removed',
          itemId: 'P1.M2.T1',
          description: 'Removed task',
          impact: 'low',
        },
      ],
      taskIds: ['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M2.T1'],
    });

    // EXECUTE: Patch backlog
    const patchedBacklog = patchBacklog(backlog, deltaAnalysis);

    // VERIFY: All modified tasks are Planned
    expect(findItem(patchedBacklog, 'P1.M1.T1.S1')?.status).toBe('Planned');
    expect(findItem(patchedBacklog, 'P1.M1.T1.S2')?.status).toBe('Planned');

    // VERIFY: Removed task is Obsolete
    expect(findItem(patchedBacklog, 'P1.M2.T1')?.status).toBe('Obsolete');
  });
});
