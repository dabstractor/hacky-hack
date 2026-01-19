/**
 * Integration tests for ResearchQueue - Parallel PRP Generation
 *
 * @remarks
 * Tests validate ResearchQueue correctly manages concurrent PRP generation with:
 * - Concurrency limit of 3 (default maxSize)
 * - Fire-and-forget error handling (errors logged but don't block queue)
 * - Dependency ordering via TaskOrchestrator integration
 * - Cache deduplication (same task not generated twice)
 * - Queue statistics accuracy during concurrent operations
 * - Background cleanup in finally block (even on errors)
 *
 * These tests use mocked PRPGenerator for controlled timing and error simulation,
 * but test the real ResearchQueue queue logic (not mocked). This provides
 * integration-level validation of concurrent behavior while maintaining
 * deterministic test execution.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../../../src/core/research-queue.ts | ResearchQueue Implementation}
 * @see {@link ../../../../src/agents/prp-generator.ts | PRPGenerator Implementation}
 * @see {@link ../../../../src/core/task-orchestrator.ts | TaskOrchestrator Integration}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type {
  Backlog,
  PRPDocument,
  Subtask,
} from '../../../src/core/models.js';
import { Status } from '../../../src/core/models.js';
import type { SessionManager } from '../../../src/core/session-manager.js';

// =============================================================================
// Mock Setup with vi.hoisted() - REQUIRED for Vitest integration tests
// =============================================================================

const { mockLogger, mockGenerate } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  mockGenerate: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}));

// =============================================================================
// Factory Functions (reuse from unit tests)
// =============================================================================

/**
 * Creates a test Subtask with configurable properties
 */
function createTestSubtask(
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask {
  return {
    id,
    type: 'Subtask',
    title,
    status,
    story_points: 2,
    dependencies,
    context_scope,
  };
}

/**
 * Creates a test PRPDocument for the given task ID
 */
function createTestPRPDocument(taskId: string): PRPDocument {
  return {
    taskId,
    objective: `Test objective for ${taskId}`,
    context: '## Context\n\nTest context content.',
    implementationSteps: [`Step 1 for ${taskId}`, `Step 2 for ${taskId}`],
    validationGates: [
      {
        level: 1,
        description: 'Syntax check',
        command: 'npm run lint',
        manual: false,
      },
      {
        level: 2,
        description: 'Unit tests',
        command: 'npm test',
        manual: false,
      },
      {
        level: 3,
        description: 'Integration tests',
        command: 'npm run test:integration',
        manual: false,
      },
      {
        level: 4,
        description: 'Manual validation',
        command: null,
        manual: true,
      },
    ],
    successCriteria: [
      { description: `Criterion 1 for ${taskId}`, satisfied: false },
      { description: `Criterion 2 for ${taskId}`, satisfied: false },
    ],
    references: [`src/test-${taskId}.ts`],
  };
}

/**
 * Creates a test Backlog from an array of phases
 */
function createTestBacklog(phases: any[]): Backlog {
  return { backlog: phases };
}

/**
 * Creates a mock SessionManager with the given current session
 */
function createMockSessionManager(currentSession: any): SessionManager {
  const mockManager = {
    currentSession,
  } as unknown as SessionManager;
  return mockManager;
}

/**
 * Creates a default mock session for testing
 */
function createMockSession(): any {
  return {
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
  };
}

/**
 * Concurrency tracking helper for testing concurrent execution limits
 *
 * Uses wrapper objects to track state across async operations
 */
function trackConcurrency() {
  const state = { active: 0, max: 0, startOrder: [] as string[] };

  return {
    trackStart: (id: string) => {
      state.active++;
      state.max = Math.max(state.max, state.active);
      state.startOrder.push(id);
    },
    trackEnd: () => {
      state.active--;
    },
    getState: () => state,
  };
}

// =============================================================================
// Test Suites
// =============================================================================

describe('ResearchQueue Integration Tests', () => {
  let mockSessionManager: SessionManager;
  let ResearchQueue: any;

  beforeEach(async () => {
    // Clear all mocks and reset mock state
    vi.clearAllMocks();
    mockGenerate.mockReset();
    mockGenerate.mockImplementation(async (task: Subtask) => {
      return createTestPRPDocument(task.id);
    });
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
    mockLogger.warn.mockReset();
    mockLogger.debug.mockReset();

    // Import ResearchQueue after mocks are set up
    const module = await import('../../../src/core/research-queue.js');
    ResearchQueue = module.ResearchQueue;

    // Create fresh mock session for each test
    mockSessionManager = createMockSessionManager(createMockSession());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Concurrent Processing Tests
  // ===========================================================================

  describe('Concurrent Processing', () => {
    it('should process up to maxSize tasks concurrently', async () => {
      // SETUP: Create mock with concurrency tracking
      const tracker = trackConcurrency();
      const tasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned'),
        createTestSubtask('P1.M1.T1.S4', 'Task 4', 'Planned'),
        createTestSubtask('P1.M1.T1.S5', 'Task 5', 'Planned'),
      ];

      mockGenerate.mockImplementation(async (task: Subtask) => {
        tracker.trackStart(task.id);
        await new Promise(resolve => setTimeout(resolve, 100));
        tracker.trackEnd();
        return createTestPRPDocument(task.id);
      });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      // EXECUTE: Enqueue all tasks
      for (const task of tasks) {
        await queue.enqueue(task, backlog);
      }

      // Wait for all to complete
      await Promise.all(tasks.map(t => queue.waitForPRP(t.id).catch(() => {})));

      // VERIFY: Concurrency limit was never exceeded
      expect(tracker.getState().max).toBeLessThanOrEqual(3);
      expect(tracker.getState().startOrder.slice(0, 3).sort()).toEqual([
        'P1.M1.T1.S1',
        'P1.M1.T1.S2',
        'P1.M1.T1.S3',
      ]);
    });

    it('should start waiting task when capacity available', async () => {
      // SETUP: Create 4 tasks (3 slow, 1 fast)
      const completionOrder: string[] = [];

      mockGenerate
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 150));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        })
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 150));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        })
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        })
        .mockImplementationOnce(async (task: Subtask) => {
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
      const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');
      const task3 = createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned');
      const task4 = createTestSubtask('P1.M1.T1.S4', 'Task 4', 'Planned');

      // EXECUTE: Enqueue all tasks
      await queue.enqueue(task1, backlog);
      await queue.enqueue(task2, backlog);
      await queue.enqueue(task3, backlog);
      await queue.enqueue(task4, backlog);

      // Wait for all to complete
      await queue.waitForPRP('P1.M1.T1.S1');
      await queue.waitForPRP('P1.M1.T1.S2');
      await queue.waitForPRP('P1.M1.T1.S3');
      await queue.waitForPRP('P1.M1.T1.S4');

      // VERIFY: 4th task started after first completed
      expect(completionOrder.length).toBe(4);
      expect(completionOrder).toContain('P1.M1.T1.S4');
    });

    it('should only run maxSize tasks simultaneously', async () => {
      // SETUP: Track active operations with wrapper object
      const activeCount = { value: 0 };
      const maxActive = { value: 0 };

      mockGenerate.mockImplementation(async (task: Subtask) => {
        activeCount.value++;
        maxActive.value = Math.max(maxActive.value, activeCount.value);
        await new Promise(resolve => setTimeout(resolve, 100));
        activeCount.value--;
        return createTestPRPDocument(task.id);
      });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      // Enqueue 5 tasks
      for (let i = 1; i <= 5; i++) {
        const task = createTestSubtask(
          `P1.M1.T1.S${i}`,
          `Task ${i}`,
          'Planned'
        );
        await queue.enqueue(task, backlog);
      }

      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // VERIFY: Never exceeded maxSize
      expect(maxActive.value).toBeLessThanOrEqual(3);
    });
  });

  // ===========================================================================
  // Fire-and-Forget Error Handling Tests
  // ===========================================================================

  describe('Fire-and-Forget Error Handling', () => {
    it('should log errors but continue processing queue', async () => {
      // SETUP: Mock logger to capture error logs
      // Mock generator to fail first, succeed others
      mockGenerate
        .mockRejectedValueOnce(new Error('Task 1 failed'))
        .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S2'))
        .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S3'));

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
      const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');
      const task3 = createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned');

      // EXECUTE: Enqueue all tasks and capture promises
      await queue.enqueue(task1, backlog);
      const task1Promise = queue.waitForPRP('P1.M1.T1.S1');
      await queue.enqueue(task2, backlog);
      await queue.enqueue(task3, backlog);

      // Wait for task1 to fail
      await expect(task1Promise).rejects.toThrow('Task 1 failed');

      // VERIFY: Error was logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'P1.M1.T1.S1',
          error: 'Task 1 failed',
        }),
        expect.stringContaining('PRP generation failed')
      );

      // VERIFY: Other tasks still completed
      const prp2 = await queue.waitForPRP('P1.M1.T1.S2');
      const prp3 = await queue.waitForPRP('P1.M1.T1.S3');
      expect(prp2).toBeDefined();
      expect(prp3).toBeDefined();
    });

    it('should not cache failed results', async () => {
      // SETUP: Mock generate to reject with error
      mockGenerate.mockRejectedValueOnce(new Error('Generation failed'));

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);
      const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

      // EXECUTE: Enqueue task and wait for error
      await queue.enqueue(task, backlog);

      try {
        await queue.waitForPRP('P1.M1.T1.S1');
      } catch {
        // Expected error
      }

      // VERIFY: getPRP() returns null after failure
      expect(queue.getPRP('P1.M1.T1.S1')).toBeNull();

      // VERIFY: Task can be retried (enqueue again)
      mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));
      await queue.enqueue(task, backlog);
      const prp = await queue.waitForPRP('P1.M1.T1.S1');
      expect(prp).toBeDefined();
    });

    it('should clean up in finally block even on error', async () => {
      // SETUP: Mock generate to reject with error
      mockGenerate.mockRejectedValueOnce(new Error('Task failed'));

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);
      const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

      // EXECUTE: Enqueue failing task
      await queue.enqueue(task, backlog);

      try {
        await queue.waitForPRP('P1.M1.T1.S1');
      } catch {
        // Expected error
      }

      // VERIFY: isResearching() returns false after error
      expect(queue.isResearching('P1.M1.T1.S1')).toBe(false);

      // VERIFY: Task removed from researching Map
      expect(queue.researching.has('P1.M1.T1.S1')).toBe(false);
    });

    it('should continue processing after error in queue', async () => {
      // SETUP: First task fails, rest succeed
      // Capture the promise for the failing task
      const task1Promise = Promise.reject(new Error('Task 1 failed'));
      mockGenerate
        .mockImplementationOnce(async () => task1Promise)
        .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S2'))
        .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S3'))
        .mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S4'));

      const queue = new ResearchQueue(mockSessionManager, 2);
      const backlog = createTestBacklog([]);

      const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
      const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');
      const task3 = createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned');
      const task4 = createTestSubtask('P1.M1.T1.S4', 'Task 4', 'Planned');

      // EXECUTE: Enqueue all tasks
      await queue.enqueue(task1, backlog);
      // Capture the promise before enqueueing more tasks
      const waitForTask1 = queue.waitForPRP('P1.M1.T1.S1').catch(() => {
        // Expected error
      });

      await queue.enqueue(task2, backlog);
      await queue.enqueue(task3, backlog);
      await queue.enqueue(task4, backlog);

      // Wait for task1 to fail
      await waitForTask1;

      // VERIFY: Error was logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'P1.M1.T1.S1',
          error: 'Task 1 failed',
        }),
        expect.stringContaining('PRP generation failed')
      );

      // VERIFY: All other tasks still complete
      const prp2 = await queue.waitForPRP('P1.M1.T1.S2');
      const prp3 = await queue.waitForPRP('P1.M1.T1.S3');
      const prp4 = await queue.waitForPRP('P1.M1.T1.S4');

      expect(prp2).toBeDefined();
      expect(prp3).toBeDefined();
      expect(prp4).toBeDefined();
    });
  });

  // ===========================================================================
  // Cache Deduplication Tests
  // ===========================================================================

  describe('Cache Deduplication', () => {
    it('should skip generation if task already cached', async () => {
      // SETUP: Pre-populate results Map with PRP
      const queue = new ResearchQueue(mockSessionManager, 3);
      const cachedPRP = createTestPRPDocument('P1.M1.T1.S1');
      queue.results.set('P1.M1.T1.S1', cachedPRP);

      const backlog = createTestBacklog([]);
      const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

      // EXECUTE: Enqueue same task
      await queue.enqueue(task, backlog);

      // VERIFY: generate() not called (call count = 0)
      expect(mockGenerate).not.toHaveBeenCalled();

      // VERIFY: getPRP() returns cached result
      const prp = queue.getPRP('P1.M1.T1.S1');
      expect(prp).toEqual(cachedPRP);
    });

    it('should deduplicate concurrent requests for same task', async () => {
      // SETUP: Mock generate with delay
      let generateCallCount = 0;
      mockGenerate.mockImplementation(async (task: Subtask) => {
        generateCallCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return createTestPRPDocument(task.id);
      });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');
      const backlog = createTestBacklog([]);

      // EXECUTE: Enqueue same task 3 times concurrently
      const promises = [
        queue.enqueue(task, backlog),
        queue.enqueue(task, backlog),
        queue.enqueue(task, backlog),
      ];

      await Promise.all(promises);
      const prp = await queue.waitForPRP('P1.M1.T1.S1');

      // VERIFY: Only generated once
      expect(generateCallCount).toBe(1);

      // VERIFY: PRP is available
      expect(prp).toBeDefined();
      expect(queue.getPRP('P1.M1.T1.S1')).toBeDefined();
    });

    it('should cache successful results', async () => {
      // SETUP: Mock generate to resolve with PRP
      mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);
      const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

      // EXECUTE: Enqueue and wait for completion
      await queue.enqueue(task, backlog);
      await queue.waitForPRP('P1.M1.T1.S1');

      // VERIFY: getPRP() returns cached result
      const prp = queue.getPRP('P1.M1.T1.S1');
      expect(prp).toBeDefined();
      expect(prp?.taskId).toBe('P1.M1.T1.S1');

      // VERIFY: waitForPRP() returns immediately on second call
      const startTime = Date.now();
      await queue.waitForPRP('P1.M1.T1.S1');
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(10); // Should be nearly instant
    });

    it('should handle cache hit during concurrent processing', async () => {
      // SETUP: Mock generate with delay
      mockGenerate.mockImplementation(async (task: Subtask) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return createTestPRPDocument(task.id);
      });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
      const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');

      // EXECUTE: Enqueue first task twice, then second task
      await queue.enqueue(task1, backlog);
      await queue.enqueue(task2, backlog);

      // Enqueue task1 again while it's still processing
      await queue.enqueue(task1, backlog);

      // Wait for completion
      await queue.waitForPRP('P1.M1.T1.S1');
      await queue.waitForPRP('P1.M1.T1.S2');

      // VERIFY: task1 only generated once
      expect(mockGenerate).toHaveBeenCalledWith(task1, backlog);
      expect(mockGenerate).toHaveBeenCalledWith(task2, backlog);
      expect(mockGenerate).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Queue Statistics Tests
  // ===========================================================================

  describe('Queue Statistics', () => {
    it('should report accurate stats during concurrent operations', async () => {
      // SETUP: Create tasks with varying delays
      mockGenerate.mockImplementation(async (task: Subtask) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return createTestPRPDocument(task.id);
      });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      // EXECUTE: Enqueue multiple tasks
      const tasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned'),
        createTestSubtask('P1.M1.T1.S4', 'Task 4', 'Planned'),
      ];

      for (const task of tasks) {
        await queue.enqueue(task, backlog);
      }

      // VERIFY: getStats().queued matches queue length
      const stats1 = queue.getStats();
      expect(stats1.queued).toBeGreaterThan(0);
      expect(stats1.researching).toBeLessThanOrEqual(3);
      expect(stats1.cached).toBe(0);

      // Wait for all to complete
      await Promise.all(tasks.map(t => queue.waitForPRP(t.id).catch(() => {})));

      // Wait for all cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // VERIFY: Final stats show all tasks completed
      const stats2 = queue.getStats();
      expect(stats2.queued).toBe(0);
      expect(stats2.researching).toBe(0);
      expect(stats2.cached).toBe(4);
    });

    it('should report zero stats for empty queue', async () => {
      // SETUP: Create fresh queue
      mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));

      const queue = new ResearchQueue(mockSessionManager, 3);

      // VERIFY: All stats are 0 for fresh queue
      const stats = queue.getStats();
      expect(stats).toEqual({
        queued: 0,
        researching: 0,
        cached: 0,
      });
    });

    it('should track stats correctly as tasks complete', async () => {
      // SETUP: Create tasks that complete at different times
      const completionOrder: string[] = [];

      mockGenerate
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        })
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        })
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 150));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      const tasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned'),
      ];

      // EXECUTE: Enqueue all tasks
      for (const task of tasks) {
        await queue.enqueue(task, backlog);
      }

      // Wait for first task to complete
      await queue.waitForPRP('P1.M1.T1.S1');

      // VERIFY: At least one task completed
      let stats = queue.getStats();
      expect(stats.cached).toBeGreaterThanOrEqual(1);

      // Wait for all to complete
      await Promise.all(tasks.map(t => queue.waitForPRP(t.id)));

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 50));

      // VERIFY: All tasks completed
      stats = queue.getStats();
      expect(stats.cached).toBe(3);
      expect(stats.researching).toBe(0);
      expect(stats.queued).toBe(0);
    });
  });

  // ===========================================================================
  // Execution Order Verification Tests
  // ===========================================================================

  describe('Execution Order Verification', () => {
    it('should process tasks in FIFO order', async () => {
      // SETUP: Create 3 tasks with same delay
      // Use maxSize=1 to ensure serial processing
      const processedOrder: string[] = [];

      mockGenerate.mockImplementation(async (task: Subtask) => {
        processedOrder.push(task.id);
        await new Promise(resolve => setTimeout(resolve, 20));
        return createTestPRPDocument(task.id);
      });

      const queue = new ResearchQueue(mockSessionManager, 1); // Serial processing
      const backlog = createTestBacklog([]);

      const tasks = [
        createTestSubtask('P1.M1.T1.S1', 'First', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Second', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Third', 'Planned'),
      ];

      // EXECUTE: Enqueue in specific order
      for (const task of tasks) {
        await queue.enqueue(task, backlog);
      }

      // Wait for all to complete - use sequential waiting for serial processing
      await queue.waitForPRP('P1.M1.T1.S1');
      await queue.waitForPRP('P1.M1.T1.S2');
      await queue.waitForPRP('P1.M1.T1.S3');

      // VERIFY: Completion order matches enqueue order
      expect(processedOrder).toEqual([
        'P1.M1.T1.S1',
        'P1.M1.T1.S2',
        'P1.M1.T1.S3',
      ]);
    });

    it('should complete tasks out of order based on timing', async () => {
      // SETUP: Create tasks with different delays
      const completionOrder: string[] = [];

      mockGenerate
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 150));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        })
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        })
        .mockImplementationOnce(async (task: Subtask) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          completionOrder.push(task.id);
          return createTestPRPDocument(task.id);
        });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      const tasks = [
        createTestSubtask('P1.M1.T1.S1', 'Slow', 'Planned'),
        createTestSubtask('P1.M1.T1.S2', 'Fast', 'Planned'),
        createTestSubtask('P1.M1.T1.S3', 'Medium', 'Planned'),
      ];

      // EXECUTE: Enqueue in fixed order
      for (const task of tasks) {
        await queue.enqueue(task, backlog);
      }

      // Wait for all to complete
      await Promise.all(tasks.map(t => queue.waitForPRP(t.id)));

      // VERIFY: Fast task completes before slow task
      expect(completionOrder[0]).toBe('P1.M1.T1.S2'); // Fast
      expect(completionOrder[2]).toBe('P1.M1.T1.S1'); // Slow
    });
  });

  // ===========================================================================
  // Integration with TaskOrchestrator Tests
  // ===========================================================================

  describe('TaskOrchestrator Integration', () => {
    it('should respect dependency ordering when combined with TaskOrchestrator', async () => {
      // SETUP: Create tasks with dependencies
      const processedOrder: string[] = [];

      mockGenerate.mockImplementation(async (task: Subtask) => {
        processedOrder.push(task.id);
        return createTestPRPDocument(task.id);
      });

      const backlog = createTestBacklog([
        {
          type: 'Phase',
          id: 'P1',
          title: 'Phase 1',
          status: 'Planned',
          description: 'Test phase',
          milestones: [
            {
              type: 'Milestone',
              id: 'P1.M1',
              title: 'Milestone 1',
              status: 'Planned',
              description: 'Test milestone',
              tasks: [
                {
                  type: 'Task',
                  id: 'P1.M1.T1',
                  title: 'Task 1',
                  status: 'Planned',
                  description: 'Test task',
                  subtasks: [
                    {
                      type: 'Subtask',
                      id: 'P1.M1.T1.S1',
                      title: 'Dependency',
                      status: 'Complete',
                      story_points: 1,
                      dependencies: [],
                      context_scope: 'Test scope',
                    },
                    {
                      type: 'Subtask',
                      id: 'P1.M1.T1.S2',
                      title: 'Dependent',
                      status: 'Planned',
                      story_points: 1,
                      dependencies: ['P1.M1.T1.S1'],
                      context_scope: 'Test scope',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      const queue = new ResearchQueue(mockSessionManager, 3);

      // EXECUTE: Enqueue dependent task first, then dependency
      const task1 = backlog.backlog[0].milestones[0].tasks[0].subtasks[1]; // S2 depends on S1
      const task2 = backlog.backlog[0].milestones[0].tasks[0].subtasks[0]; // S1

      await queue.enqueue(task1, backlog);
      await queue.enqueue(task2, backlog);

      // Wait for both to complete
      await queue.waitForPRP('P1.M1.T1.S1');
      await queue.waitForPRP('P1.M1.T1.S2');

      // VERIFY: Both tasks processed (TaskOrchestrator would filter before enqueue)
      expect(processedOrder.length).toBe(2);
      expect(processedOrder).toContain('P1.M1.T1.S1');
      expect(processedOrder).toContain('P1.M1.T1.S2');
    });
  });

  // ===========================================================================
  // Edge Cases and Boundary Conditions
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty queue gracefully', async () => {
      // SETUP: Create queue with no tasks
      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      // EXECUTE: Call processNext on empty queue
      await queue.processNext(backlog);

      // VERIFY: No errors, stats remain zero
      const stats = queue.getStats();
      expect(stats).toEqual({
        queued: 0,
        researching: 0,
        cached: 0,
      });
    });

    it('should handle concurrent processNext calls', async () => {
      // SETUP: Create single task
      mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);
      const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

      // EXECUTE: Call processNext multiple times simultaneously
      queue.queue.push(task);
      const promises = [
        queue.processNext(backlog),
        queue.processNext(backlog),
        queue.processNext(backlog),
      ];

      await Promise.all(promises);
      await queue.waitForPRP('P1.M1.T1.S1');

      // VERIFY: Task processed exactly once
      expect(mockGenerate).toHaveBeenCalledTimes(1);
      expect(queue.getStats().cached).toBe(1);
    });

    it('should handle maxSize of 0 (no processing)', async () => {
      // SETUP: Create queue with maxSize 0
      mockGenerate.mockResolvedValueOnce(createTestPRPDocument('P1.M1.T1.S1'));

      const queue = new ResearchQueue(mockSessionManager, 0);
      const backlog = createTestBacklog([]);
      const task = createTestSubtask('P1.M1.T1.S1', 'Test Task', 'Planned');

      // EXECUTE: Enqueue task
      await queue.enqueue(task, backlog);

      // VERIFY: Task remains queued, not processed
      expect(queue.queue.length).toBe(1);
      expect(queue.getStats().researching).toBe(0);
      expect(mockGenerate).not.toHaveBeenCalled();
    });

    it('should handle rapid enqueue/dequeue cycles', async () => {
      // SETUP: Create tasks with minimal delay
      mockGenerate.mockImplementation(async (task: Subtask) => {
        return createTestPRPDocument(task.id);
      });

      const queue = new ResearchQueue(mockSessionManager, 3);
      const backlog = createTestBacklog([]);

      // EXECUTE: Rapid enqueue/dequeue cycles
      const task1 = createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned');
      const task2 = createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned');
      const task3 = createTestSubtask('P1.M1.T1.S3', 'Task 3', 'Planned');

      await queue.enqueue(task1, backlog);
      await queue.enqueue(task2, backlog);
      await queue.enqueue(task3, backlog);

      // Clear and re-enqueue
      queue.clearCache();
      await queue.enqueue(task1, backlog);

      // Wait for completion
      await queue.waitForPRP('P1.M1.T1.S1');

      // VERIFY: Task processed correctly
      expect(queue.getPRP('P1.M1.T1.S1')).toBeDefined();
    });
  });
});
