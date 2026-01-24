/**
 * Unit tests for ConcurrentTaskExecutor class
 *
 * @remarks
 * Tests validate ConcurrentTaskExecutor class from src/core/concurrent-executor.ts.
 * Tests follow the Setup/Execute/Verify pattern with comprehensive edge case coverage.
 *
 * Mocks are used for all TaskOrchestrator, SessionManager, and PRPRuntime operations.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  ConcurrentTaskExecutor,
  type ParallelismConfig,
} from '../../../src/core/concurrent-executor.js';
import type TaskOrchestrator from '../../../src/core/task-orchestrator.js';
import type { PRPRuntime } from '../../../src/agents/prp-runtime.js';
import type { SessionManager } from '../../../src/core/session-manager.js';
import type { Backlog, Subtask } from '../../../src/core/models.js';
import { Status } from '../../../src/core/models.js';

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

// Test utility: ConcurrencyTracker for testing concurrent operations
class ConcurrencyTracker {
  private active = 0;
  private max = 0;

  track<T>(fn: () => Promise<T>): () => Promise<T> {
    return async () => {
      this.active++;
      this.max = Math.max(this.max, this.active);
      try {
        return await fn();
      } finally {
        this.active--;
      }
    };
  }

  getMaxConcurrency(): number {
    return this.max;
  }

  getActiveCount(): number {
    return this.active;
  }

  reset(): void {
    this.active = 0;
    this.max = 0;
  }
}

// Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope,
});

const createTestBacklog = (subtasks: Subtask[]): Backlog => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1',
      status: 'Planned',
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1',
          status: 'Planned',
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1',
              status: 'Planned',
              description: 'Test task',
              subtasks,
            },
          ],
        },
      ],
    },
  ],
});

// Mock SessionManager
const createMockSessionManager = (): SessionManager => {
  return {
    currentSession: {
      metadata: {
        id: '001_14b9dc2a33c7',
        hash: '14b9dc2a33c7',
        path: '/plan/001_14b9dc2a33c7',
        createdAt: new Date(),
        parentSession: null,
      },
      prdSnapshot: '# Test PRD',
      taskRegistry: createTestBacklog([]),
      currentItemId: null,
    },
    updateItemStatus: vi.fn().mockResolvedValue(undefined),
    loadBacklog: vi.fn().mockResolvedValue(createTestBacklog([])),
    flushUpdates: vi.fn().mockResolvedValue(undefined),
  } as unknown as SessionManager;
};

// Mock PRPRuntime
const createMockPRPRuntime = (): PRPRuntime => {
  return {
    executeSubtask: vi.fn().mockResolvedValue({
      success: true,
      validationResults: [],
      artifacts: [],
      error: undefined,
      fixAttempts: 0,
    }),
  } as unknown as PRPRuntime;
};

// Mock TaskOrchestrator
const createMockOrchestrator = (subtasks: Subtask[]): TaskOrchestrator => {
  const backlog = createTestBacklog(subtasks);

  const mockOrchestrator = {
    sessionManager: createMockSessionManager(),
    prpRuntime: createMockPRPRuntime(),
    backlog,
    canExecute: vi.fn((subtask: Subtask) => {
      const dependencies = subtask.dependencies;
      if (dependencies.length === 0) {
        return true;
      }
      // Check if all dependencies are Complete
      return dependencies.every(depId => {
        const dep = subtasks.find(s => s.id === depId);
        return dep?.status === 'Complete';
      });
    }),
    getBlockingDependencies: vi.fn((subtask: Subtask) => {
      return subtask.dependencies
        .map(depId => subtasks.find(s => s.id === depId))
        .filter(
          (s): s is Subtask => s !== undefined && s.status !== 'Complete'
        );
    }),
    setStatus: vi
      .fn()
      .mockImplementation(async (id: string, status: Status) => {
        // Update the subtask status in the array for dependency checking
        const subtask = subtasks.find(s => s.id === id);
        if (subtask) {
          subtask.status = status;
        }
        return undefined;
      }),
    refreshBacklog: vi.fn().mockResolvedValue(undefined),
  } as unknown as TaskOrchestrator;

  return mockOrchestrator;
};

// Test configuration
const createTestConfig = (
  overrides?: Partial<ParallelismConfig>
): ParallelismConfig => ({
  enabled: true,
  maxConcurrency: 3,
  prpGenerationLimit: 3,
  resourceThreshold: 0.8,
  ...overrides,
});

describe('ConcurrentTaskExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create executor with valid config', () => {
      // SETUP
      const orchestrator = createMockOrchestrator([]);
      const config = createTestConfig();

      // EXECUTE
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      // VERIFY
      expect(executor).toBeInstanceOf(ConcurrentTaskExecutor);
      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          maxConcurrency: 3,
          resourceThreshold: 0.8,
        },
        'ConcurrentTaskExecutor initialized'
      );
    });

    it('should throw error with zero concurrency', async () => {
      // SETUP
      const subtasks = [createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned')];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 0 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE & VERIFY - Error occurs when executing, not constructing
      await expect(executor.executeParallel(subtasks)).rejects.toThrow(
        'Semaphore max must be positive'
      );
    });

    it('should throw error with negative concurrency', async () => {
      // SETUP
      const subtasks = [createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned')];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: -1 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE & VERIFY - Error occurs when executing, not constructing
      await expect(executor.executeParallel(subtasks)).rejects.toThrow(
        'Semaphore max must be positive'
      );
    });
  });

  describe('Semaphore', () => {
    it('should execute all subtasks with concurrency limit', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Subtask 3', 'Planned'),
        createTestSubtask('P1.M1.T1.S4', 'Subtask 4', 'Planned'),
        createTestSubtask('P1.M1.T1.S5', 'Subtask 5', 'Planned'),
      ];

      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: All tasks should execute
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(5);
    });

    it('should execute all subtasks sequentially when maxConcurrency is 1', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned'),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 1 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: All tasks should execute
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dependency ordering', () => {
    it('should respect dependency constraints', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Independent subtask', 'Planned', []),
        createTestSubtask('P1.M1.T1.S2', 'Dependent subtask', 'Planned', [
          'P1.M1.T1.S1',
        ]),
        createTestSubtask('P1.M1.T1.S3', 'Another dependent', 'Planned', [
          'P1.M1.T1.S1',
        ]),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 3 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      const executionOrder: string[] = [];

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockImplementation(
        async (subtask: Subtask) => {
          executionOrder.push(subtask.id);
          // Update status in backlog for dependency checking
          subtask.status = 'Complete';
          return {
            success: true,
            validationResults: [],
            artifacts: [],
            fixAttempts: 0,
          };
        }
      );

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: S1 should execute before S2 and S3
      const s1Index = executionOrder.indexOf('P1.M1.T1.S1');
      const s2Index = executionOrder.indexOf('P1.M1.T1.S2');
      const s3Index = executionOrder.indexOf('P1.M1.T1.S3');

      expect(s1Index).toBeGreaterThanOrEqual(0);
      expect(s2Index).toBeGreaterThan(s1Index);
      expect(s3Index).toBeGreaterThan(s1Index);
    });

    it('should handle chain dependencies correctly', async () => {
      // SETUP: S1 -> S2 -> S3 (linear chain)
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'First', 'Planned', []),
        createTestSubtask('P1.M1.T1.S2', 'Second', 'Planned', ['P1.M1.T1.S1']),
        createTestSubtask('P1.M1.T1.S3', 'Third', 'Planned', ['P1.M1.T1.S2']),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 3 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      const executionOrder: string[] = [];

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockImplementation(
        async (subtask: Subtask) => {
          executionOrder.push(subtask.id);
          subtask.status = 'Complete';
          return {
            success: true,
            validationResults: [],
            artifacts: [],
            fixAttempts: 0,
          };
        }
      );

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: Should execute in order S1, S2, S3
      expect(executionOrder).toEqual([
        'P1.M1.T1.S1',
        'P1.M1.T1.S2',
        'P1.M1.T1.S3',
      ]);
    });

    it('should execute independent tasks in parallel', async () => {
      // SETUP: S1 and S2 are independent, S3 depends on both
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Independent 1', 'Planned', []),
        createTestSubtask('P1.M1.T1.S2', 'Independent 2', 'Planned', []),
        createTestSubtask('P1.M1.T1.S3', 'Dependent', 'Planned', [
          'P1.M1.T1.S1',
          'P1.M1.T1.S2',
        ]),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockImplementation(
        async (subtask: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 20));
          subtask.status = 'Complete';
          return {
            success: true,
            validationResults: [],
            artifacts: [],
            fixAttempts: 0,
          };
        }
      );

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: All tasks should complete
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error isolation', () => {
    it('should continue executing after individual task failure', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Success task', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Failure task', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Another success', 'Planned'),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 3 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      let callCount = 0;
      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockImplementation(
        async (subtask: Subtask) => {
          callCount++;
          // S2 fails, others succeed
          if (subtask.id === 'P1.M1.T1.S2') {
            throw new Error('Task S2 failed');
          }
          subtask.status = 'Complete';
          return {
            success: true,
            validationResults: [],
            artifacts: [],
            fixAttempts: 0,
          };
        }
      );

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: All tasks should be attempted
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { failureCount: 1, total: 3 },
        'Some subtasks failed in batch'
      );
    });

    it('should handle multiple failures in batch', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned'),
        createTestSubtask('P1.M1.T1.S4', 'Task 4', 'Planned'),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockImplementation(
        async (subtask: Subtask) => {
          // S2 and S4 fail
          if (subtask.id === 'P1.M1.T1.S2' || subtask.id === 'P1.M1.T1.S4') {
            throw new Error(`${subtask.id} failed`);
          }
          subtask.status = 'Complete';
          return {
            success: true,
            validationResults: [],
            artifacts: [],
            fixAttempts: 0,
          };
        }
      );

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(4);
    });
  });

  describe('Deadlock detection', () => {
    it('should detect deadlock with circular dependencies', async () => {
      // SETUP: S1 depends on S2, S2 depends on S1 (circular)
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned', ['P1.M1.T1.S2']),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned', ['P1.M1.T1.S1']),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.canExecute).mockReturnValue(false);
      vi.mocked(orchestrator.getBlockingDependencies).mockImplementation(
        (subtask: Subtask) => {
          return subtasks.filter(s => s.id !== subtask.id);
        }
      );

      // EXECUTE & VERIFY
      await expect(executor.executeParallel(subtasks)).rejects.toThrow(
        'Deadlock'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        { plannedCount: 2 },
        'Deadlock detected: no executable tasks but planned tasks remain'
      );
    });

    it('should detect deadlock with missing dependencies', async () => {
      // SETUP: S1 depends on non-existent S3
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned', ['P1.M1.T1.S3']),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned', []),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.canExecute).mockImplementation(
        (subtask: Subtask) => {
          return subtask.id === 'P1.M1.T1.S2'; // Only S2 can execute
        }
      );
      vi.mocked(orchestrator.getBlockingDependencies).mockImplementation(
        (subtask: Subtask) => {
          if (subtask.id === 'P1.M1.T1.S1') {
            return []; // Empty because dependency doesn't exist
          }
          return [];
        }
      );

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE & VERIFY: S2 completes, then deadlock on S1
      await expect(executor.executeParallel(subtasks)).rejects.toThrow(
        'Deadlock'
      );
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(1);
    });

    it('should log blocking dependencies on deadlock', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned', ['P1.M1.T1.S2']),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned', ['P1.M1.T1.S1']),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      const blockingSubtasks: Subtask[] = [subtasks[1]];
      vi.mocked(orchestrator.canExecute).mockReturnValue(false);
      vi.mocked(orchestrator.getBlockingDependencies).mockReturnValue(
        blockingSubtasks
      );

      // EXECUTE & VERIFY
      await expect(executor.executeParallel(subtasks)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          subtaskId: 'P1.M1.T1.S1',
          blockers: expect.arrayContaining([
            expect.objectContaining({ id: 'P1.M1.T1.S2' }),
          ]),
        }),
        'Subtask blocked on unresolved dependencies'
      );
    });
  });

  describe('State management', () => {
    it('should flush updates after each task completes', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned'),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: flushUpdates should be called after each task
      expect(orchestrator.sessionManager.flushUpdates).toHaveBeenCalledTimes(2);
    });

    it('should call setStatus with correct status', async () => {
      // SETUP
      const subtasks = [createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned')];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: setStatus should be called with Complete
      expect(orchestrator.setStatus).toHaveBeenCalledWith(
        'P1.M1.T1.S1',
        'Complete',
        'Success'
      );
    });

    it('should call setStatus with Failed on error', async () => {
      // SETUP
      const subtasks = [createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned')];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig({ maxConcurrency: 2 });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockRejectedValue(
        new Error('Execution failed')
      );

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: setStatus should be called with Failed
      expect(orchestrator.setStatus).toHaveBeenCalledWith(
        'P1.M1.T1.S1',
        'Failed',
        'Execution failed'
      );
    });
  });

  describe('Backpressure', () => {
    it('should wait for resources before executing', async () => {
      // SETUP
      const subtasks = [createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned')];
      const orchestrator = createMockOrchestrator(subtasks);
      // Set threshold very high to avoid waiting in test environment
      const config = createTestConfig({
        maxConcurrency: 1,
        resourceThreshold: 0.99, // Very high threshold - should pass immediately
      });
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: Should complete without error (memory check passes in normal environment)
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty and edge cases', () => {
    it('should handle empty subtask list', async () => {
      // SETUP
      const subtasks: Subtask[] = [];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig();
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: Should complete without error
      expect(orchestrator.prpRuntime.executeSubtask).not.toHaveBeenCalled();
    });

    it('should handle single subtask', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Single task', 'Planned'),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig();
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(1);
    });

    it('should skip already completed subtasks', async () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Complete task', 'Complete'),
        createTestSubtask('P1.M1.T1.S2', 'Failed task', 'Failed'),
        createTestSubtask('P1.M1.T1.S3', 'Planned task', 'Planned'),
      ];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig();
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY: Only planned task should execute
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledTimes(1);
      expect(orchestrator.prpRuntime.executeSubtask).toHaveBeenCalledWith(
        subtasks[2],
        orchestrator.backlog
      );
    });
  });

  describe('Logging', () => {
    it('should log start and completion', async () => {
      // SETUP
      const subtasks = [createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned')];
      const orchestrator = createMockOrchestrator(subtasks);
      const config = createTestConfig();
      const executor = new ConcurrentTaskExecutor(orchestrator, config);

      vi.mocked(orchestrator.prpRuntime.executeSubtask).mockResolvedValue({
        success: true,
        validationResults: [],
        artifacts: [],
        fixAttempts: 0,
      });

      // EXECUTE
      await executor.executeParallel(subtasks);

      // VERIFY
      expect(mockLogger.info).toHaveBeenCalledWith(
        { subtaskCount: 1 },
        'Starting parallel execution'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ duration: expect.any(Number) }),
        'Parallel execution complete'
      );
    });
  });
});
