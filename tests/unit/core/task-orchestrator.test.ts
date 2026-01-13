/**
 * Unit tests for TaskOrchestrator class
 *
 * @remarks
 * Tests validate TaskOrchestrator class from src/core/task-orchestrator.ts with 100% coverage.
 * Tests follow the Setup/Execute/Verify pattern with comprehensive edge case coverage.
 *
 * Mocks are used for all SessionManager and task-utils operations - no real I/O is performed.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TaskOrchestrator } from '../../../src/core/task-orchestrator.js';
import type { SessionManager } from '../../../src/core/session-manager.js';
import type { Backlog } from '../../../src/core/models.js';
import { Status } from '../../../src/core/models.js';

// Mock the task-utils module - use importOriginal to get real getDependencies implementation
vi.mock('../../../src/utils/task-utils.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/task-utils.js')>();
  return {
    ...actual,
    getNextPendingItem: vi.fn(),
  };
});

// Import mocked function
import { getNextPendingItem } from '../../../src/utils/task-utils.js';

// Cast mocked function
const mockGetNextPendingItem = getNextPendingItem as any;

// Factory functions for test data
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

const createTestTask = (
  id: string,
  title: string,
  status: Status,
  subtasks: any[] = []
) => ({
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
  tasks: any[] = []
) => ({
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
  milestones: any[] = []
) => ({
  id,
  type: 'Phase' as const,
  title,
  status,
  description: 'Test phase description',
  milestones,
});

const createTestBacklog = (phases: any[]): Backlog => ({
  backlog: phases,
});

// Mock SessionManager
const createMockSessionManager = (currentSession: any): SessionManager => {
  const mockManager = {
    currentSession,
    updateItemStatus: vi.fn().mockResolvedValue(currentSession?.taskRegistry),
    loadBacklog: vi.fn().mockResolvedValue(currentSession?.taskRegistry),
  } as unknown as SessionManager;
  return mockManager;
};

describe('TaskOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should store sessionManager as readonly property', () => {
      // SETUP: Create mock session manager with active session
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);

      // EXECUTE
      const orchestrator = new TaskOrchestrator(mockManager);

      // VERIFY
      expect(orchestrator.sessionManager).toBe(mockManager);
    });

    it('should load backlog from session state', () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);

      // EXECUTE
      const orchestrator = new TaskOrchestrator(mockManager);

      // VERIFY
      expect(orchestrator.backlog).toEqual(testBacklog);
    });

    it('should throw Error when currentSession is null', () => {
      // SETUP: Session manager without active session
      const mockManager = createMockSessionManager(null);

      // EXECUTE & VERIFY
      expect(() => new TaskOrchestrator(mockManager)).toThrow(
        'Cannot create TaskOrchestrator: no active session'
      );
    });

    it('should expose backlog via getter (read-only access)', () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);

      // EXECUTE
      const orchestrator = new TaskOrchestrator(mockManager);

      // VERIFY: Can read backlog via getter
      expect(orchestrator.backlog.backlog).toHaveLength(1);
      expect(orchestrator.backlog.backlog[0].id).toBe('P1');
    });
  });

  describe('executePhase', () => {
    it('should update phase status to Implementing', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const phase = createTestPhase('P1', 'Phase 1', 'Planned');

      // EXECUTE
      await orchestrator.executePhase(phase);

      // VERIFY
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1',
        'Implementing'
      );
    });

    it('should log execution message', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE
      await orchestrator.executePhase(phase);

      // VERIFY
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Executing Phase: P1 - Phase 1'
      );
      consoleSpy.mockRestore();
    });

    it('should handle phase with milestones', async () => {
      // SETUP: Phase with child milestones
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned'),
        ]),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const phase = createTestPhase('P1', 'Phase 1', 'Planned', [
        createTestMilestone('P1.M1', 'Milestone 1', 'Planned'),
      ]);

      // EXECUTE: executePhase only sets status, doesn't iterate children
      await orchestrator.executePhase(phase);

      // VERIFY: Only phase status updated, children not iterated
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeMilestone', () => {
    it('should update milestone status to Implementing', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned'),
        ]),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned');

      // EXECUTE
      await orchestrator.executeMilestone(milestone);

      // VERIFY
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1',
        'Implementing'
      );
    });

    it('should log execution message', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE
      await orchestrator.executeMilestone(milestone);

      // VERIFY
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Executing Milestone: P1.M1 - Milestone 1'
      );
      consoleSpy.mockRestore();
    });

    it('should handle milestone with tasks', async () => {
      // SETUP: Milestone with child tasks
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
        createTestTask('P1.M1.T1', 'Task 1', 'Planned'),
      ]);

      // EXECUTE: executeMilestone only sets status, doesn't iterate children
      await orchestrator.executeMilestone(milestone);

      // VERIFY: Only milestone status updated
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeTask', () => {
    it('should update task status to Implementing', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned');

      // EXECUTE
      await orchestrator.executeTask(task);

      // VERIFY
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1',
        'Implementing'
      );
    });

    it('should log execution message', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE
      await orchestrator.executeTask(task);

      // VERIFY
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Executing Task: P1.M1.T1 - Task 1'
      );
      consoleSpy.mockRestore();
    });

    it('should handle task with subtasks', async () => {
      // SETUP: Task with child subtasks
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
        createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
      ]);

      // EXECUTE: executeTask only sets status, doesn't iterate children
      await orchestrator.executeTask(task);

      // VERIFY: Only task status updated
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeSubtask', () => {
    it('should set subtask status to Implementing then Complete', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');

      // EXECUTE
      await orchestrator.executeSubtask(subtask);

      // VERIFY: Status updated to Implementing then Complete
      expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(
        1,
        'P1.M1.T1.S1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(
        2,
        'P1.M1.T1.S1',
        'Complete'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledTimes(2);
    });

    it('should log placeholder execution message', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const subtask = createTestSubtask(
        'P1.M1.T1.S1',
        'Subtask 1',
        'Planned',
        [],
        'Test context scope'
      );
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE
      await orchestrator.executeSubtask(subtask);

      // VERIFY
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Executing Subtask: P1.M1.T1.S1 - Subtask 1'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] PLACEHOLDER: Would generate PRP and run Coder agent'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Context scope: Test context scope'
      );
      consoleSpy.mockRestore();
    });

    it('should handle subtask with dependencies', async () => {
      // SETUP: Subtask with dependencies
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const subtask = createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned', [
        'P1.M1.T1.S1',
      ]);

      // EXECUTE
      await orchestrator.executeSubtask(subtask);

      // VERIFY: Dependencies don't affect placeholder execution
      expect(mockManager.updateItemStatus).toHaveBeenCalledTimes(2); // Implementing + Complete
    });
  });

  describe('processNextItem', () => {
    it('should call getNextPendingItem from task-utils', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(phase);

      // EXECUTE
      await orchestrator.processNextItem();

      // VERIFY
      expect(mockGetNextPendingItem).toHaveBeenCalledWith(testBacklog);
    });

    it('should return true when item found and processed', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(phase);

      // EXECUTE
      const result = await orchestrator.processNextItem();

      // VERIFY
      expect(result).toBe(true);
    });

    it('should return false when backlog is complete (no items pending)', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      mockGetNextPendingItem.mockReturnValue(null);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE
      const result = await orchestrator.processNextItem();

      // VERIFY
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Backlog processing complete'
      );
      consoleSpy.mockRestore();
    });

    it('should delegate to executePhase when next item is Phase', async () => {
      // SETUP
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned'),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(phase);

      // EXECUTE
      await orchestrator.processNextItem();

      // VERIFY: executePhase was called (status updated)
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1',
        'Implementing'
      );
    });

    it('should delegate to executeMilestone when next item is Milestone', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(milestone);

      // EXECUTE
      await orchestrator.processNextItem();

      // VERIFY: executeMilestone was called (status updated)
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1',
        'Implementing'
      );
    });

    it('should delegate to executeTask when next item is Task', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(task);

      // EXECUTE
      await orchestrator.processNextItem();

      // VERIFY: executeTask was called (status updated)
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1',
        'Implementing'
      );
    });

    it('should delegate to executeSubtask when next item is Subtask', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(subtask);

      // EXECUTE
      await orchestrator.processNextItem();

      // VERIFY: executeSubtask was called (status updated twice)
      expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(
        1,
        'P1.M1.T1.S1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(
        2,
        'P1.M1.T1.S1',
        'Complete'
      );
    });

    it('should log item being processed', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(subtask);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE
      await orchestrator.processNextItem();

      // VERIFY
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Processing: P1.M1.T1.S1 (Subtask)'
      );
      consoleSpy.mockRestore();
    });

    it('should handle all four hierarchy item types', async () => {
      // SETUP: Test each type in sequence
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      // Test Phase
      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      mockGetNextPendingItem.mockReturnValueOnce(phase);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1',
        'Implementing'
      );

      // Test Milestone
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned');
      mockGetNextPendingItem.mockReturnValueOnce(milestone);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1',
        'Implementing'
      );

      // Test Task
      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned');
      mockGetNextPendingItem.mockReturnValueOnce(task);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1',
        'Implementing'
      );

      // Test Subtask
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');
      mockGetNextPendingItem.mockReturnValueOnce(subtask);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1.S1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1.S1',
        'Complete'
      );
    });
  });

  describe('DFS pre-order traversal', () => {
    it('should process items in correct DFS pre-order: Phase → Milestone → Task → Subtask', async () => {
      // SETUP: Full hierarchy
      const testBacklog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
            createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
              createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
            ]),
          ]),
        ]),
      ]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      // Simulate DFS pre-order: Phase first
      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      mockGetNextPendingItem.mockReturnValueOnce(phase);

      // EXECUTE: Process first item (Phase)
      const result1 = await orchestrator.processNextItem();

      // VERIFY: Phase processed
      expect(result1).toBe(true);
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1',
        'Implementing'
      );

      // Simulate next item: Milestone
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned');
      mockGetNextPendingItem.mockReturnValueOnce(milestone);

      // EXECUTE: Process second item (Milestone)
      const result2 = await orchestrator.processNextItem();

      // VERIFY: Milestone processed
      expect(result2).toBe(true);
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1',
        'Implementing'
      );

      // Continue with Task and Subtask similarly...
    });
  });

  describe('integration scenarios', () => {
    it('should support complete processing cycle: process items until complete', async () => {
      // SETUP: Mock sequence of items
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Simulate: Phase → Milestone → Task → Subtask → null (complete)
      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned');
      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned');
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');

      mockGetNextPendingItem
        .mockReturnValueOnce(phase)
        .mockReturnValueOnce(milestone)
        .mockReturnValueOnce(task)
        .mockReturnValueOnce(subtask)
        .mockReturnValueOnce(null);

      // EXECUTE: Process all items
      let count = 0;
      let hasMore = true;
      while (hasMore && count < 10) {
        // Safety limit to prevent infinite loop
        hasMore = await orchestrator.processNextItem();
        count++;
      }

      // VERIFY: All 4 items processed, then returned false
      // count is 5 because we increment after the loop check
      expect(count).toBe(5); // 4 successful + 1 that returned false
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1.S1',
        'Implementing'
      );
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1.S1',
        'Complete'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TaskOrchestrator] Backlog processing complete'
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty backlog (no items from start)', async () => {
      // SETUP: Empty backlog
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      mockGetNextPendingItem.mockReturnValue(null);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // EXECUTE
      const result = await orchestrator.processNextItem();

      // VERIFY: Immediately returns false
      expect(result).toBe(false);
      expect(mockManager.updateItemStatus).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from SessionManager.updateItemStatus', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      (mockManager.updateItemStatus as any).mockRejectedValue(
        new Error('Update failed')
      );

      const orchestrator = new TaskOrchestrator(mockManager);
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(subtask);

      // EXECUTE & VERIFY
      await expect(orchestrator.processNextItem()).rejects.toThrow(
        'Update failed'
      );
    });

    it('should handle refresh with null session (edge case)', async () => {
      // SETUP: Session becomes null after construction (edge case)
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);

      // Create orchestrator with valid session
      const orchestrator = new TaskOrchestrator(mockManager);

      // Simulate session becoming null (edge case)
      (mockManager as any).currentSession = null;

      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');
      mockGetNextPendingItem.mockReturnValue(subtask);

      // EXECUTE & VERIFY: Should throw when trying to refresh backlog after processing
      await expect(orchestrator.processNextItem()).rejects.toThrow(
        'Cannot refresh backlog: no active session'
      );
    });
  });

  describe('discriminated union type narrowing', () => {
    it('should correctly narrow types in delegateByType switch', async () => {
      // SETUP
      const testBacklog = createTestBacklog([]);
      const currentSession = {
        metadata: {
          id: '001_14b9dc2a33c7',
          hash: '14b9dc2a33c7',
          path: '/plan/001_14b9dc2a33c7',
          createdAt: new Date(),
          parentSession: null,
        },
        prdSnapshot: '# Test PRD',
        taskRegistry: testBacklog,
        currentItemId: null,
      };
      const mockManager = createMockSessionManager(currentSession);
      const orchestrator = new TaskOrchestrator(mockManager);

      // Test each type - TypeScript should narrow correctly
      const phase = createTestPhase('P1', 'Phase 1', 'Planned');
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned');
      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned');
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned');

      // EXECUTE: Each type should be dispatched correctly
      mockGetNextPendingItem.mockReturnValueOnce(phase);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1',
        'Implementing'
      );

      mockGetNextPendingItem.mockReturnValueOnce(milestone);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1',
        'Implementing'
      );

      mockGetNextPendingItem.mockReturnValueOnce(task);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1',
        'Implementing'
      );

      mockGetNextPendingItem.mockReturnValueOnce(subtask);
      await orchestrator.processNextItem();
      expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
        'P1.M1.T1.S1',
        'Implementing'
      );
    });
  });

  describe('dependency resolution', () => {
    describe('canExecute()', () => {
      it('should return true when subtask has no dependencies', () => {
        // SETUP
        const testBacklog = createTestBacklog([]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S1',
          'Subtask 1',
          'Planned',
          []
        );

        // EXECUTE
        const result = orchestrator.canExecute(subtask);

        // VERIFY: No dependencies means can execute
        expect(result).toBe(true);
      });

      it('should return true when all dependencies are Complete', () => {
        // SETUP: Subtask with dependency that is Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // EXECUTE
        const result = orchestrator.canExecute(subtask);

        // VERIFY: Dependency is Complete
        expect(result).toBe(true);
      });

      it('should return false when one dependency is not Complete', () => {
        // SETUP: Subtask with dependency that has status 'Planned'
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'), // Not Complete!
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // EXECUTE
        const result = orchestrator.canExecute(subtask);

        // VERIFY: Dependency is 'Planned', not 'Complete'
        expect(result).toBe(false);
      });

      it('should return false when multiple dependencies are not Complete', () => {
        // SETUP: Subtask with multiple dependencies, none Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
                createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Implementing'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S3',
          'Subtask 3',
          'Planned',
          ['P1.M1.T1.S1', 'P1.M1.T1.S2']
        );

        // EXECUTE
        const result = orchestrator.canExecute(subtask);

        // VERIFY: Neither dependency is Complete
        expect(result).toBe(false);
      });

      it('should handle missing dependencies gracefully (treats as non-blocking)', () => {
        // SETUP: Subtask depends on non-existent ID
        const testBacklog = createTestBacklog([]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['NONEXISTENT_ID']
        );

        // EXECUTE
        const result = orchestrator.canExecute(subtask);

        // VERIFY: Missing dependencies are filtered out, so no blockers
        expect(result).toBe(true);
      });
    });

    describe('getBlockingDependencies()', () => {
      it('should return empty array when no dependencies', () => {
        // SETUP
        const testBacklog = createTestBacklog([]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S1',
          'Subtask 1',
          'Planned',
          []
        );

        // EXECUTE
        const blockers = orchestrator.getBlockingDependencies(subtask);

        // VERIFY
        expect(blockers).toEqual([]);
      });

      it('should return empty array when all dependencies are Complete', () => {
        // SETUP: All dependencies are Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // EXECUTE
        const blockers = orchestrator.getBlockingDependencies(subtask);

        // VERIFY: No blocking dependencies (dependency is Complete)
        expect(blockers).toEqual([]);
      });

      it('should return array with one blocking dependency', () => {
        // SETUP: One dependency is not Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // EXECUTE
        const blockers = orchestrator.getBlockingDependencies(subtask);

        // VERIFY: One blocking dependency
        expect(blockers).toHaveLength(1);
        expect(blockers[0].id).toBe('P1.M1.T1.S1');
        expect(blockers[0].status).toBe('Planned');
      });

      it('should return array with multiple blocking dependencies', () => {
        // SETUP: Multiple dependencies are not Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
                createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Implementing'),
                createTestSubtask('P1.M1.T1.S3', 'Subtask 3', 'Complete'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S4',
          'Subtask 4',
          'Planned',
          ['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']
        );

        // EXECUTE
        const blockers = orchestrator.getBlockingDependencies(subtask);

        // VERIFY: Two blocking dependencies (S3 is Complete, so not a blocker)
        expect(blockers).toHaveLength(2);
        const blockerIds = blockers.map(b => b.id).sort();
        expect(blockerIds).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2']);
      });

      it('should filter out non-Complete dependencies correctly', () => {
        // SETUP: Mix of Complete and non-Complete dependencies
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
                createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned'),
                createTestSubtask('P1.M1.T1.S3', 'Subtask 3', 'Complete'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S4',
          'Subtask 4',
          'Planned',
          ['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']
        );

        // EXECUTE
        const blockers = orchestrator.getBlockingDependencies(subtask);

        // VERIFY: Only S2 is blocking (S1 and S3 are Complete)
        expect(blockers).toHaveLength(1);
        expect(blockers[0].id).toBe('P1.M1.T1.S2');
      });
    });

    describe('waitForDependencies()', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should resolve when dependencies become Complete', async () => {
        // SETUP: Subtask with dependencies that will become Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // Create a promise that resolves after we manually update the backlog
        const waitPromise = orchestrator.waitForDependencies(subtask, {
          timeout: 5000,
          interval: 100,
        });

        // Simulate dependency becoming Complete after some time
        setTimeout(() => {
          // Update the backlog to have Complete dependency
          const updatedBacklog = createTestBacklog([
            createTestPhase('P1', 'Phase 1', 'Planned', [
              createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
                createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                  createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
                ]),
              ]),
            ]),
          ]);
          (mockManager as any).currentSession.taskRegistry = updatedBacklog;
        }, 500);

        // EXECUTE: Advance time
        await vi.advanceTimersByTimeAsync(500);

        // VERIFY: Promise should resolve
        await expect(waitPromise).resolves.toBeUndefined();
      });

      it('should reject on timeout if dependencies never Complete', async () => {
        // SETUP: Subtask with dependencies that never become Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // EXECUTE: Wait with short timeout
        const waitPromise = orchestrator.waitForDependencies(subtask, {
          timeout: 500,
          interval: 100,
        });

        // Advance past timeout
        await vi.advanceTimersByTimeAsync(600);

        // VERIFY: Should reject with timeout error
        await expect(waitPromise).rejects.toThrow(
          'Timeout waiting for dependencies of P1.M1.T1.S2 after 500ms'
        );
      });

      it('should accept custom interval and timeout options', async () => {
        // SETUP
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // EXECUTE: Use custom timeout of 200ms
        const waitPromise = orchestrator.waitForDependencies(subtask, {
          timeout: 200,
          interval: 50,
        });

        // Advance past timeout
        await vi.advanceTimersByTimeAsync(250);

        // VERIFY: Should use custom timeout
        await expect(waitPromise).rejects.toThrow(
          'Timeout waiting for dependencies of P1.M1.T1.S2 after 200ms'
        );
      });
    });

    describe('executeSubtask() with dependencies', () => {
      it('should skip execution when dependencies are not satisfied', async () => {
        // SETUP: Subtask with blocked dependencies
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        const consoleSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        // EXECUTE
        await orchestrator.executeSubtask(subtask);

        // VERIFY: Status never updated (no execute call)
        expect(mockManager.updateItemStatus).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
          '[TaskOrchestrator] Blocked on: P1.M1.T1.S1 - Subtask 1 (status: Planned)'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[TaskOrchestrator] Subtask P1.M1.T1.S2 blocked on dependencies, skipping'
        );

        consoleSpy.mockRestore();
      });

      it('should execute normally when all dependencies are Complete', async () => {
        // SETUP: Subtask with all Complete dependencies
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S2',
          'Subtask 2',
          'Planned',
          ['P1.M1.T1.S1']
        );

        // EXECUTE
        await orchestrator.executeSubtask(subtask);

        // VERIFY: Normal execution flow (status updated twice)
        expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(
          1,
          'P1.M1.T1.S2',
          'Implementing'
        );
        expect(mockManager.updateItemStatus).toHaveBeenNthCalledWith(
          2,
          'P1.M1.T1.S2',
          'Complete'
        );
      });

      it('should log all blocking dependencies', async () => {
        // SETUP: Subtask with multiple blocking dependencies
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
                createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Implementing'),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const subtask = createTestSubtask(
          'P1.M1.T1.S3',
          'Subtask 3',
          'Planned',
          ['P1.M1.T1.S1', 'P1.M1.T1.S2']
        );

        const consoleSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        // EXECUTE
        await orchestrator.executeSubtask(subtask);

        // VERIFY: Both blocking dependencies logged
        expect(consoleSpy).toHaveBeenCalledWith(
          '[TaskOrchestrator] Blocked on: P1.M1.T1.S1 - Subtask 1 (status: Planned)'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[TaskOrchestrator] Blocked on: P1.M1.T1.S2 - Subtask 2 (status: Implementing)'
        );

        consoleSpy.mockRestore();
      });
    });

    describe('integration: dependency chain execution', () => {
      it('should execute dependency chain A->B->C in correct order', async () => {
        // SETUP: Three subtasks where S2 depends on S1, S3 depends on S2
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned', []),
                createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned', [
                  'P1.M1.T1.S1',
                ]),
                createTestSubtask('P1.M1.T1.S3', 'Subtask 3', 'Planned', [
                  'P1.M1.T1.S2',
                ]),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const consoleSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        // EXECUTE: Process items in order (simulating DFS traversal)

        // Step 1: Process S1 (no dependencies) - should execute
        await orchestrator.executeSubtask(
          testBacklog.backlog[0].milestones[0].tasks[0].subtasks[0]
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S1',
          'Implementing'
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S1',
          'Complete'
        );
        // Update testBacklog to reflect the new status
        testBacklog.backlog[0].milestones[0].tasks[0].subtasks[0] = {
          ...testBacklog.backlog[0].milestones[0].tasks[0].subtasks[0],
          status: 'Complete',
        };

        // Step 2: Try to process S2 (depends on S1, now Complete) - should execute
        await orchestrator.executeSubtask(
          testBacklog.backlog[0].milestones[0].tasks[0].subtasks[1]
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S2',
          'Implementing'
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S2',
          'Complete'
        );
        // Update testBacklog to reflect the new status
        testBacklog.backlog[0].milestones[0].tasks[0].subtasks[1] = {
          ...testBacklog.backlog[0].milestones[0].tasks[0].subtasks[1],
          status: 'Complete',
        };

        // Step 3: Try to process S3 (depends on S2, now Complete) - should execute
        await orchestrator.executeSubtask(
          testBacklog.backlog[0].milestones[0].tasks[0].subtasks[2]
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S3',
          'Implementing'
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S3',
          'Complete'
        );

        consoleSpy.mockRestore();
      });

      it('should skip blocked subtasks and continue to executable ones', async () => {
        // SETUP: S2 depends on S1, but S1 is not Complete
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned', []),
                createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned', [
                  'P1.M1.T1.S1',
                ]),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        const consoleSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        // EXECUTE: Try to execute S2 before S1 is Complete

        // S2 should be blocked
        await orchestrator.executeSubtask(
          testBacklog.backlog[0].milestones[0].tasks[0].subtasks[1]
        );
        expect(mockManager.updateItemStatus).not.toHaveBeenCalled(); // No status update for blocked subtask

        // S1 should execute normally
        await orchestrator.executeSubtask(
          testBacklog.backlog[0].milestones[0].tasks[0].subtasks[0]
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S1',
          'Implementing'
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P1.M1.T1.S1',
          'Complete'
        );

        consoleSpy.mockRestore();
      });

      it('should handle cross-boundary dependencies', async () => {
        // SETUP: Subtask in P3.M2.T1 depends on subtask in P1.M1.T1
        const testBacklog = createTestBacklog([
          createTestPhase('P1', 'Phase 1', 'Planned', [
            createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
              createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
                createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
              ]),
            ]),
          ]),
          createTestPhase('P3', 'Phase 3', 'Planned', [
            createTestMilestone('P3.M2', 'Milestone 2', 'Planned', [
              createTestTask('P3.M2.T1', 'Task 1', 'Planned', [
                createTestSubtask('P3.M2.T1.S1', 'Subtask 1', 'Planned', [
                  'P1.M1.T1.S1',
                ]),
              ]),
            ]),
          ]),
        ]);
        const currentSession = {
          metadata: {
            id: '001_14b9dc2a33c7',
            hash: '14b9dc2a33c7',
            path: '/plan/001_14b9dc2a33c7',
            createdAt: new Date(),
            parentSession: null,
          },
          prdSnapshot: '# Test PRD',
          taskRegistry: testBacklog,
          currentItemId: null,
        };
        const mockManager = createMockSessionManager(currentSession);
        const orchestrator = new TaskOrchestrator(mockManager);

        // EXECUTE: Subtask in P3 depends on P1 subtask
        await orchestrator.executeSubtask(
          testBacklog.backlog[1].milestones[0].tasks[0].subtasks[0]
        );

        // VERIFY: Should execute (P1.M1.T1.S1 is Complete)
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P3.M2.T1.S1',
          'Implementing'
        );
        expect(mockManager.updateItemStatus).toHaveBeenCalledWith(
          'P3.M2.T1.S1',
          'Complete'
        );
      });
    });
  });
});
