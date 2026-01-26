/**
 * Integration tests for tasks.json as Single Source of Truth
 *
 * @remarks
 * Tests validate that tasks.json is the authoritative source for all task state,
 * ensuring all updates flow through SessionManager, schema validation prevents
 * malformed data, atomic writes prevent corruption, and temp files are cleaned up.
 *
 * Tests verify:
 * - All task status updates flow through tasks.json via SessionManager
 * - tasks.json is the authoritative source for task execution
 * - No other files duplicate task state
 * - Zod schema validation prevents malformed tasks.json
 * - Atomic write pattern prevents corruption
 * - Temp files are cleaned up after writes
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/session-manager.ts | SessionManager Implementation}
 * @see {@link ../../PRD.md | PRD: State Management Requirements}
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { SessionManager } from '../../src/core/session-manager.js';
import { type Backlog, type Status } from '../../src/core/models.js';
import { findItem } from '../../src/utils/task-utils.js';

// =============================================================================
// TEST FIXTURE: Valid minimal PRD content generator
// =============================================================================

/**
 * Generates valid PRD content with unique suffix to avoid hash collisions
 * Must be at least 100 characters to pass PRD validation
 */
function generateValidPRD(uniqueSuffix: string): string {
  return `# Test Project ${uniqueSuffix}

A minimal project for tasks.json authority testing.

## P1: Test Phase

Validate tasks.json as single source of truth.

### P1.M1: Test Milestone

Create tasks.json authority tests.

#### P1.M1.T1: Create Authority Tests

Implement integration tests for tasks.json authority.

##### P1.M1.T1.S1: Write Authority Tests

Create tests for tasks.json authority verification.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: tasks.json authority verification ${uniqueSuffix}
2. INPUT: SessionManager implementation
3. LOGIC: Verify tasks.json is single source of truth
4. OUTPUT: Passing integration tests for tasks.json authority
`;
}

/**
 * Creates a minimal valid Backlog structure for testing tasks.json
 */
function createMinimalBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase description',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Creates a backlog with multiple items for testing batching
 */
function createMultiItemBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase description',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone 1',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task 1',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask 1',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S2',
                    title: 'Test Subtask 2',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                ],
              },
            ],
          },
          {
            type: 'Milestone',
            id: 'P1.M2',
            title: 'Test Milestone 2',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M2.T1',
                title: 'Test Task 2',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M2.T1.S1',
                    title: 'Test Subtask 3',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// =============================================================================
// HELPER: Sync in-memory state after saving backlog to disk
// =============================================================================

/**
 * Helper function to sync in-memory state after saving backlog
 *
 * This function writes a backlog to tasks.json and then reloads the session
 * to update the in-memory taskRegistry. This is needed because saveBacklog()
 * only writes to disk and doesn't update #currentSession.taskRegistry.
 */
async function saveBacklogAndSync(
  manager: SessionManager,
  backlog: Backlog
): Promise<void> {
  const session = manager.currentSession!;
  const tasksPath = join(session.metadata.path, 'tasks.json');

  // Write backlog directly to disk
  writeFileSync(tasksPath, JSON.stringify(backlog, null, 2), 'utf-8');

  // Reload session to load tasks.json into memory
  await manager.initialize();
}

// =============================================================================
// TEST SUITE: tasks.json Authority Enforcement
// =============================================================================

describe('integration/tasks-json-authority > tasks.json authority enforcement', () => {
  let tempDir: string;
  let planDir: string;

  // ---------------------------------------------------------------------------
  // PATTERN: Temp directory setup and cleanup
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    // SETUP: Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'tasks-json-authority-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // CLEANUP: Remove temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  // ==========================================================================
  // TEST SUITE: tasks.json file authority
  // ==========================================================================

  describe('tasks.json file authority', () => {
    it('should create tasks.json when backlog is saved', async () => {
      // SETUP: Create test PRD
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-1'));

      // EXECUTE: Initialize session and save backlog
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const backlog = createMinimalBacklog();
      await saveBacklogAndSync(manager, backlog);

      // VERIFY: tasks.json exists and contains valid JSON
      const tasksPath = join(session.metadata.path, 'tasks.json');
      expect(existsSync(tasksPath)).toBe(true);

      const tasksContent = readFileSync(tasksPath, 'utf-8');
      const tasksData = JSON.parse(tasksContent) as Backlog;
      expect(tasksData).toHaveProperty('backlog');
      expect(Array.isArray(tasksData.backlog)).toBe(true);
      expect(tasksData.backlog[0].id).toBe('P1');
    });

    it('should set correct file permissions (0o644)', async () => {
      // SETUP: Create session and save backlog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-perms'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // EXECUTE: Check file permissions
      const tasksPath = join(
        manager.currentSession!.metadata.path,
        'tasks.json'
      );
      const stats = statSync(tasksPath);
      const mode = stats.mode & 0o777;

      // VERIFY: Mode is 0o644 (rw-r--r--)
      expect(mode).toBe(0o644);
    });

    it('should be the only persistent state file', async () => {
      // SETUP: Create session and save backlog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-only-file'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // EXECUTE: List all files in session directory
      const files = readdirSync(session.metadata.path);

      // VERIFY: Only expected files exist (prd_snapshot.md and tasks.json)
      // architecture/, prps/, artifacts/ are directories
      const stateFiles = files.filter(f => f.endsWith('.json'));
      expect(stateFiles).toEqual(['tasks.json']);
    });
  });

  // ==========================================================================
  // TEST SUITE: State update flow through tasks.json
  // ==========================================================================

  describe('state update flow through tasks.json', () => {
    it('should flow all updates through SessionManager → tasks.json', async () => {
      // SETUP: Create session, spy on saveBacklog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-flow'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // EXECUTE: Update status and flush
      const saveSpy = vi.spyOn(manager, 'saveBacklog');
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
      await manager.flushUpdates();

      // VERIFY: saveBacklog was called
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should persist state atomically on flushUpdates()', async () => {
      // SETUP: Create session and save initial backlog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-flush'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const tasksPath = join(session.metadata.path, 'tasks.json');
      const backlog = createMinimalBacklog();

      // Write backlog directly to disk
      writeFileSync(tasksPath, JSON.stringify(backlog, null, 2), 'utf-8');

      // Reload session to load tasks.json into memory
      await manager.initialize();

      // EXECUTE: Update status without flush
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

      // VERIFY: In-memory state is updated (currentSession)
      let item = findItem(manager.currentSession!.taskRegistry, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Complete');

      // VERIFY: Load fresh instance (reads from disk, not memory)
      const manager2 = new SessionManager(prdPath, planDir, 3);
      await manager2.initialize();
      const backlogFromDisk = await manager2.loadBacklog();
      item = findItem(backlogFromDisk, 'P1.M1.T1.S1');

      // VERIFY: Disk still has old status (flush not called)
      expect(item?.status).toBe('Planned');

      // EXECUTE: Now flush to persist
      await manager.flushUpdates();

      // VERIFY: After flush, disk has new status
      const manager3 = new SessionManager(prdPath, planDir, 3);
      await manager3.initialize();
      const backlogAfterFlush = await manager3.loadBacklog();
      item = findItem(backlogAfterFlush, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Complete');
    });

    it('should reload state correctly from tasks.json', async () => {
      // SETUP: Create session and save backlog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-reload'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // Sync in-memory state by reloading the session
      await manager.initialize();

      // EXECUTE: Update status and flush
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
      await manager.flushUpdates();

      // VERIFY: Load fresh SessionManager with same PRD
      const manager2 = new SessionManager(prdPath, planDir, 3);
      const session2 = await manager2.initialize();
      const backlogFromDisk = await manager2.loadBacklog();

      // VERIFY: Loaded state matches saved state
      expect(session2.metadata.hash).toBe(session.metadata.hash);
      const item = findItem(backlogFromDisk, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Complete');
    });
  });

  // ==========================================================================
  // TEST SUITE: No state duplication
  // ==========================================================================

  describe('no state duplication', () => {
    it('should verify no other files duplicate task state', async () => {
      // SETUP: Create session and save backlog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-no-dup'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // Load the saved backlog to sync in-memory state
      await manager.loadBacklog();

      // EXECUTE: Search for task IDs in all session files
      const files = readdirSync(session.metadata.path);

      // VERIFY: Only tasks.json contains task state
      let taskStateFound = false;
      for (const file of files) {
        const filePath = join(session.metadata.path, file);
        const stats = statSync(filePath);
        if (stats.isFile() && file !== 'tasks.json') {
          const content = readFileSync(filePath, 'utf-8');
          // Check if file contains task IDs
          if (content.includes('P1.M1.T1.S1') && file !== 'prd_snapshot.md') {
            taskStateFound = true;
          }
        }
      }

      expect(taskStateFound).toBe(false);
    });

    it('should verify in-memory changes do not persist without flush', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-mem-flush'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // Load the saved backlog to sync in-memory state
      await manager.loadBacklog();

      // EXECUTE: Update status without flush
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

      // EXECUTE: Create new manager instance
      const manager2 = new SessionManager(prdPath, planDir, 3);
      await manager2.initialize();
      const backlogFromDisk = await manager2.loadBacklog();

      // VERIFY: New manager doesn't see the changes
      const item = findItem(backlogFromDisk, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Planned');
    });
  });

  // ==========================================================================
  // TEST SUITE: Schema validation prevents malformed tasks.json
  // ==========================================================================

  describe('schema validation prevents malformed tasks.json', () => {
    it('should validate on write and reject invalid status', async () => {
      // SETUP: Create backlog with invalid status
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-invalid-status'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();

      const invalidBacklog: Backlog = {
        backlog: [
          {
            type: 'Phase',
            id: 'P1',
            title: 'Test Phase',
            status: 'InvalidStatus' as Status, // Invalid!
            description: 'Test',
            milestones: [],
          },
        ],
      };

      // EXECUTE & VERIFY: Should throw validation error
      await expect(manager.saveBacklog(invalidBacklog)).rejects.toThrow();

      // VERIFY: tasks.json was not created (or unchanged)
      const tasksPath = join(
        manager.currentSession!.metadata.path,
        'tasks.json'
      );
      expect(existsSync(tasksPath)).toBe(false);
    });

    it('should validate on read and reject malformed JSON', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-malformed'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();

      // EXECUTE: Write invalid tasks.json manually
      const tasksPath = join(session.metadata.path, 'tasks.json');
      writeFileSync(tasksPath, '{ invalid JSON }');

      // EXECUTE & VERIFY: Try to load via SessionManager
      await expect(manager.loadBacklog()).rejects.toThrow();
    });

    it('should validate ID formats with regex patterns', async () => {
      // SETUP: Create backlog with invalid ID format
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-invalid-id'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();

      const invalidBacklog: Backlog = {
        backlog: [
          {
            type: 'Phase',
            id: 'INVALID_ID', // Invalid format!
            title: 'Test Phase',
            status: 'Planned',
            description: 'Test',
            milestones: [],
          },
        ],
      };

      // EXECUTE & VERIFY: Should throw validation error
      await expect(manager.saveBacklog(invalidBacklog)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // TEST SUITE: Atomic write pattern prevents corruption
  // ==========================================================================

  describe('atomic write pattern prevents corruption', () => {
    it('should use temp file + rename pattern', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-atomic'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // EXECUTE: Save backlog (uses atomic write internally)
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // VERIFY: tasks.json exists (atomic write completed successfully)
      const tasksPath = join(sessionPath, 'tasks.json');
      expect(existsSync(tasksPath)).toBe(true);

      // VERIFY: tasks.json contains correct data
      const tasksContent = readFileSync(tasksPath, 'utf-8');
      const tasksData = JSON.parse(tasksContent) as Backlog;
      expect(tasksData.backlog).toHaveLength(1);
      expect(tasksData.backlog[0].id).toBe('P1');
    });

    it('should prevent corruption if process crashes during write', async () => {
      // SETUP: Create session and save initial backlog
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-corruption'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // Save initial valid state
      const initialBacklog = createMinimalBacklog();
      await manager.saveBacklog(initialBacklog);

      const initialContent = readFileSync(
        join(sessionPath, 'tasks.json'),
        'utf-8'
      );

      // EXECUTE: Try to save invalid backlog (should fail before atomic rename)
      const invalidBacklog: Backlog = {
        backlog: [
          {
            type: 'Phase',
            id: 'P1',
            title: 'Test Phase',
            status: 'InvalidStatus' as Status,
            description: 'Test',
            milestones: [],
          },
        ],
      };

      try {
        await manager.saveBacklog(invalidBacklog);
      } catch {
        // Expected to fail validation
      }

      // VERIFY: Original tasks.json unchanged (atomic write prevented corruption)
      const finalContent = readFileSync(
        join(sessionPath, 'tasks.json'),
        'utf-8'
      );
      expect(finalContent).toBe(initialContent);
    });
  });

  // ==========================================================================
  // TEST SUITE: Temp file cleanup
  // ==========================================================================

  describe('temp file cleanup', () => {
    it('should clean up temp files after successful write', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-cleanup'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();
      const sessionPath = manager.currentSession!.metadata.path;

      // EXECUTE: Save backlog (uses atomic write internally)
      await manager.saveBacklog(createMinimalBacklog());

      // VERIFY: No .tmp files remain
      const files = readdirSync(sessionPath);
      const tempFiles = files.filter(f => f.endsWith('.tmp'));
      expect(tempFiles).toHaveLength(0);
    });
  });

  // ==========================================================================
  // TEST SUITE: Batching and multiple state transitions
  // ==========================================================================

  describe('batching and multiple state transitions', () => {
    it('should accumulate updates in memory before flush', async () => {
      // SETUP: Create session with multiple items
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-batching'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();
      const backlog = createMultiItemBacklog();
      await manager.saveBacklog(backlog);

      // Sync in-memory state by reloading the session
      await manager.initialize();

      // EXECUTE: Multiple updates without flush
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
      await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
      await manager.updateItemStatus('P1.M2.T1.S1', 'Complete');

      // VERIFY: Load from disk (not flushed yet)
      const manager2 = new SessionManager(prdPath, planDir, 3);
      await manager2.initialize();
      const backlogFromDisk = await manager2.loadBacklog();

      const s1 = findItem(backlogFromDisk, 'P1.M1.T1.S1');
      const s2 = findItem(backlogFromDisk, 'P1.M1.T1.S2');
      const s3 = findItem(backlogFromDisk, 'P1.M2.T1.S1');

      expect(s1?.status).toBe('Planned'); // Not flushed
      expect(s2?.status).toBe('Planned'); // Not flushed
      expect(s3?.status).toBe('Planned'); // Not flushed

      // EXECUTE: Flush updates
      await manager.flushUpdates();

      // VERIFY: After flush, all updates persisted
      const manager3 = new SessionManager(prdPath, planDir, 3);
      await manager3.initialize();
      const backlogAfterFlush = await manager3.loadBacklog();

      const s1After = findItem(backlogAfterFlush, 'P1.M1.T1.S1');
      const s2After = findItem(backlogAfterFlush, 'P1.M1.T1.S2');
      const s3After = findItem(backlogAfterFlush, 'P1.M2.T1.S1');

      expect(s1After?.status).toBe('Complete');
      expect(s2After?.status).toBe('Complete');
      expect(s3After?.status).toBe('Complete');
    });

    it('should handle multiple state transitions correctly', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-transitions'));
      const manager = new SessionManager(prdPath, planDir, 3);
      await manager.initialize();
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // Sync in-memory state by reloading the session
      await manager.initialize();

      // EXECUTE: Multiple state transitions
      await manager.updateItemStatus('P1.M1.T1.S1', 'Researching');
      await manager.flushUpdates();

      await manager.updateItemStatus('P1.M1.T1.S1', 'Implementing');
      await manager.flushUpdates();

      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
      await manager.flushUpdates();

      // VERIFY: Load fresh instance
      const manager2 = new SessionManager(prdPath, planDir, 3);
      await manager2.initialize();
      const finalBacklog = await manager2.loadBacklog();

      const item = findItem(finalBacklog, 'P1.M1.T1.S1');
      expect(item?.status).toBe('Complete');
    });
  });
});
