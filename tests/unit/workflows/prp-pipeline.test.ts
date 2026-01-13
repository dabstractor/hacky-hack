/**
 * Unit tests for PRPPipeline class
 *
 * @remarks
 * Tests validate PRPPipeline class from src/workflows/prp-pipeline.ts with comprehensive coverage.
 * Tests follow the Setup/Execute/Verify pattern with comprehensive edge case coverage.
 *
 * Mocks are used for all SessionManager, TaskOrchestrator, and agent operations - no real I/O is performed.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PRPPipeline } from '../../../src/workflows/prp-pipeline.js';
import { Backlog, SessionState, Status } from '../../../src/core/models.js';

// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock SessionManager
vi.mock('../../../src/core/session-manager.js', () => ({
  SessionManager: vi.fn().mockImplementation(() => ({
    currentSession: null,
    initialize: vi.fn(),
    saveBacklog: vi.fn(),
  })),
}));

// Mock TaskOrchestrator
vi.mock('../../../src/core/task-orchestrator.js', () => ({
  TaskOrchestrator: vi.fn().mockImplementation(() => ({
    processNextItem: vi.fn(),
  })),
}));

// Mock agent factory
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));

// Mock prompts
vi.mock('../../../src/agents/prompts.js', () => ({
  TASK_BREAKDOWN_PROMPT: 'Mock TASK_BREAKDOWN_PROMPT',
}));

// Import mocked modules
import { readFile } from 'node:fs/promises';
import { createArchitectAgent } from '../../../src/agents/agent-factory.js';
import { SessionManager as SessionManagerClass } from '../../../src/core/session-manager.js';

// Cast mocked functions
const mockReadFile = readFile as any;
const mockCreateArchitectAgent = createArchitectAgent as any;
// Get reference to mocked constructor for test setup
const MockSessionManagerClass = SessionManagerClass as any;

// Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
) => ({
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

const createTestSession = (backlog: Backlog): SessionState => ({
  metadata: {
    id: '001_14b9dc2a33c7',
    hash: '14b9dc2a33c7',
    path: '/plan/001_14b9dc2a33c7',
    createdAt: new Date(),
    parentSession: null,
  },
  prdSnapshot: '# Test PRD',
  taskRegistry: backlog,
  currentItemId: null,
});

// Create mock SessionManager factory
function createMockSessionManager(session: SessionState | null) {
  const mock = {
    currentSession: session,
    initialize: vi.fn().mockResolvedValue(session),
    saveBacklog: vi.fn().mockResolvedValue(undefined),
  };
  // Set the mock instance to be returned by SessionManager constructor
  MockSessionManagerClass.mockImplementation(() => mock);
  return mock;
}

// Create mock TaskOrchestrator factory
function createMockTaskOrchestrator() {
  return {
    processNextItem: vi.fn(),
    sessionManager: {},
  };
}

describe('PRPPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset SessionManager mock
    MockSessionManagerClass.mockImplementation(() => ({
      currentSession: null,
      initialize: vi.fn().mockResolvedValue({ currentSession: null }),
      saveBacklog: vi.fn().mockResolvedValue(undefined),
    }));
    // Setup default mocks
    mockReadFile.mockResolvedValue(
      JSON.stringify({ backlog: [createTestPhase('P1', 'Phase 1', 'Planned')] })
    );
    mockCreateArchitectAgent.mockReturnValue({
      prompt: vi.fn().mockResolvedValue({
        backlog: createTestBacklog([]),
      }),
    });
  });

  afterEach(() => {
    // Clean up signal listeners to prevent memory leaks
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
  });

  describe('constructor', () => {
    it('should throw if prdPath is empty', () => {
      // EXECUTE & VERIFY
      expect(() => new PRPPipeline('')).toThrow('PRP path cannot be empty');
    });

    it('should throw if prdPath is only whitespace', () => {
      // EXECUTE & VERIFY
      expect(() => new PRPPipeline('   ')).toThrow('PRP path cannot be empty');
    });

    it('should initialize ObservedState fields with default values', () => {
      // EXECUTE
      const pipeline = new PRPPipeline('./test.md');

      // VERIFY
      expect(pipeline.currentPhase).toBe('init');
      expect(pipeline.totalTasks).toBe(0);
      expect(pipeline.completedTasks).toBe(0);
      expect(pipeline.runtime).toBeNull();
    });
  });

  describe('decomposePRD', () => {
    it('should skip backlog generation if backlog exists', async () => {
      // SETUP
      const backlog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
            createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
              createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
            ]),
          ]),
        ]),
      ]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // EXECUTE
      await pipeline.decomposePRD();

      // VERIFY
      expect(mockCreateArchitectAgent).not.toHaveBeenCalled();
      expect(pipeline.currentPhase).toBe('prd_decomposed');
    });

    it('should call createArchitectAgent for new session', async () => {
      // SETUP
      const backlog = createTestBacklog([]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // EXECUTE
      await pipeline.decomposePRD();

      // VERIFY
      expect(mockCreateArchitectAgent).toHaveBeenCalled();
    });

    it('should update currentPhase to prd_decomposed', async () => {
      // SETUP
      const backlog = createTestBacklog([]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // EXECUTE
      await pipeline.decomposePRD();

      // VERIFY
      expect(pipeline.currentPhase).toBe('prd_decomposed');
    });
  });

  describe('executeBacklog', () => {
    it('should call processNextItem until false returned', async () => {
      // SETUP
      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE
      await pipeline.executeBacklog();

      // VERIFY
      expect((mockOrchestrator as any).processNextItem).toHaveBeenCalledTimes(
        3
      );
    });

    it('should update currentPhase to backlog_complete', async () => {
      // SETUP
      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValueOnce(false);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE
      await pipeline.executeBacklog();

      // VERIFY
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });

    it('should throw if processNextItem throws', async () => {
      // SETUP
      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockRejectedValue(new Error('Execution failed'));

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE & VERIFY
      await expect(pipeline.executeBacklog()).rejects.toThrow(
        'Execution failed'
      );
    });

    it('should throw safety error after max iterations', async () => {
      // SETUP
      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValue(true);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE & VERIFY
      await expect(pipeline.executeBacklog()).rejects.toThrow(
        'Execution exceeded 10000 iterations'
      );
    });
  });

  describe('runQACycle', () => {
    it('should skip QA if not all tasks complete', async () => {
      // SETUP
      const backlog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Implementing', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
            createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
              createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
              createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Complete'),
            ]),
          ]),
        ]),
      ]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;
      pipeline.totalTasks = 2;

      // EXECUTE
      await pipeline.runQACycle();

      // VERIFY
      expect(pipeline.currentPhase).toBe('qa_skipped');
    });

    it('should set qa_complete phase when all tasks complete', async () => {
      // SETUP
      const backlog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Complete', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Complete', [
            createTestTask('P1.M1.T1', 'Task 1', 'Complete', [
              createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
              createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Complete'),
            ]),
          ]),
        ]),
      ]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // EXECUTE
      await pipeline.runQACycle();

      // VERIFY
      expect(pipeline.currentPhase).toBe('qa_complete');
    });
  });

  describe('run', () => {
    it('should call all workflow steps in order', async () => {
      // SETUP
      const mockSession = createTestSession(createTestBacklog([]));
      const mockManager = createMockSessionManager(mockSession);

      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValue(false);

      // Create pipeline AFTER setting up mocks
      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // Mock step methods
      const initSpy = vi.spyOn(pipeline, 'initializeSession');
      const decomposeSpy = vi.spyOn(pipeline, 'decomposePRD');
      const executeSpy = vi.spyOn(pipeline, 'executeBacklog');
      const qaSpy = vi.spyOn(pipeline, 'runQACycle');

      // EXECUTE
      await pipeline.run();

      // VERIFY
      expect(initSpy).toHaveBeenCalled();
      expect(decomposeSpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalled();
      expect(qaSpy).toHaveBeenCalled();
    });

    it('should return PipelineResult with success true on completion', async () => {
      // SETUP
      const mockSession = createTestSession(createTestBacklog([]));
      const mockManager = createMockSessionManager(mockSession);

      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValue(false);

      // Create pipeline AFTER setting up mocks
      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE
      const result = await pipeline.run();

      // VERIFY
      expect(result.success).toBe(true);
      expect(result.sessionPath).toBe('/plan/001_14b9dc2a33c7');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.phases).toEqual([]);
    });

    it('should return PipelineResult with success false on error', async () => {
      // SETUP
      const mockError = new Error('Test error');
      // Create mock manager that will error
      const errorManager: any = {
        initialize: vi.fn().mockRejectedValue(mockError),
        currentSession: null,
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      // Override the mock to return error manager
      MockSessionManagerClass.mockImplementation(() => errorManager);

      const pipeline = new PRPPipeline('./test.md');

      // EXECUTE
      const result = await pipeline.run();

      // VERIFY
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(result.duration).toBeGreaterThan(0);

      // Reset mock to default for other tests
      MockSessionManagerClass.mockImplementation(() => ({
        currentSession: null,
        initialize: vi.fn().mockResolvedValue({ currentSession: null }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      }));
    });

    it('should include phase summaries in result', async () => {
      // SETUP
      const backlog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Complete', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Complete', []),
          createTestMilestone('P1.M2', 'Milestone 2', 'Planned', []),
        ]),
      ]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValue(false);

      // Create pipeline AFTER setting up mocks
      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE
      const result = await pipeline.run();

      // VERIFY
      expect(result.phases).toHaveLength(1);
      expect(result.phases[0].id).toBe('P1');
      expect(result.phases[0].totalMilestones).toBe(2);
      expect(result.phases[0].completedMilestones).toBe(1);
    });
  });

  describe('private helper methods - behavior verification', () => {
    it('should count all subtasks in backlog', async () => {
      // SETUP
      const backlog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Planned', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
            createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
              createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
              createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned'),
            ]),
            createTestTask('P1.M1.T2', 'Task 2', 'Planned', [
              createTestSubtask('P1.M1.T2.S1', 'Subtask 1', 'Planned'),
            ]),
          ]),
        ]),
      ]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // EXECUTE - decomposePRD will call #countTasks
      pipeline.totalTasks = 0;
      await pipeline.decomposePRD();

      // VERIFY - totalTasks should be updated
      expect(pipeline.totalTasks).toBe(3);
    });

    it('should build phase summary array', async () => {
      // SETUP
      const backlog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Complete', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Complete', []),
          createTestMilestone('P1.M2', 'Milestone 2', 'Planned', []),
        ]),
        createTestPhase('P2', 'Phase 2', 'Planned', [
          createTestMilestone('P2.M1', 'Milestone 1', 'Planned', []),
        ]),
      ]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValue(false);

      // Create pipeline AFTER setting up mocks
      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE
      const result = await pipeline.run();

      // VERIFY
      expect(result.phases).toHaveLength(2);
      expect(result.phases[0]).toEqual({
        id: 'P1',
        title: 'Phase 1',
        status: 'Complete',
        totalMilestones: 2,
        completedMilestones: 1,
      });
      expect(result.phases[1]).toEqual({
        id: 'P2',
        title: 'Phase 2',
        status: 'Planned',
        totalMilestones: 1,
        completedMilestones: 0,
      });
    });
  });

  describe('graceful shutdown', () => {
    it('should initialize shutdown state fields with default values', () => {
      // EXECUTE
      const pipeline = new PRPPipeline('./test.md');

      // VERIFY
      expect(pipeline.shutdownRequested).toBe(false);
      expect(pipeline.currentTaskId).toBeNull();
      expect(pipeline.shutdownReason).toBeNull();
    });

    it('should set shutdownRequested to true and reason to SIGINT on SIGINT', () => {
      // SETUP
      const pipeline = new PRPPipeline('./test.md');
      const originalListeners = (process as any)._events?.SIGINT?.length ?? 0;

      // EXECUTE - Emit SIGINT event
      process.emit('SIGINT');

      // VERIFY
      expect(pipeline.shutdownRequested).toBe(true);
      expect(pipeline.shutdownReason).toBe('SIGINT');

      // Cleanup: Remove our test listener
      const listeners = (process as any)._events?.SIGINT;
      if (listeners && typeof listeners.length === 'number' && listeners.length > originalListeners) {
        process.removeAllListeners('SIGINT');
      }
    });

    it('should set shutdownRequested to true and reason to SIGTERM on SIGTERM', () => {
      // SETUP
      const pipeline = new PRPPipeline('./test.md');
      const originalListeners = (process as any)._events?.SIGTERM?.length ?? 0;

      // EXECUTE - Emit SIGTERM event
      process.emit('SIGTERM');

      // VERIFY
      expect(pipeline.shutdownRequested).toBe(true);
      expect(pipeline.shutdownReason).toBe('SIGTERM');

      // Cleanup: Remove our test listener
      const listeners = (process as any)._events?.SIGTERM;
      if (listeners && typeof listeners.length === 'number' && listeners.length > originalListeners) {
        process.removeAllListeners('SIGTERM');
      }
    });

    it('should break executeBacklog loop when shutdownRequested is true', async () => {
      // SETUP
      const pipeline = new PRPPipeline('./test.md');
      let callCount = 0;

      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          // Set shutdownRequested after first call
          if (callCount === 2) {
            pipeline.shutdownRequested = true;
          }
          return callCount < 4; // Would normally return true 4 times
        });

      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE
      await pipeline.executeBacklog();

      // VERIFY - should have stopped early due to shutdownRequested
      expect(callCount).toBe(2);
      expect(pipeline.currentPhase).toBe('shutdown_interrupted');
    });

    it('should call cleanup in finally block even on error', async () => {
      // SETUP
      const mockError = new Error('Test error');
      const mockManager: any = {
        initialize: vi.fn().mockRejectedValue(mockError),
        currentSession: null,
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // Spy on cleanup method
      const cleanupSpy = vi
        .spyOn(pipeline, 'cleanup')
        .mockResolvedValue(undefined);

      // EXECUTE
      await pipeline.run();

      // VERIFY - cleanup should be called even though initialize failed
      expect(cleanupSpy).toHaveBeenCalled();
      cleanupSpy.mockRestore();
    });

    it('should save backlog in cleanup when session exists', async () => {
      // SETUP
      const backlog = createTestBacklog([
        createTestPhase('P1', 'Phase 1', 'Implementing', [
          createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
            createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
              createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete'),
              createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned'),
            ]),
          ]),
        ]),
      ]);
      const mockSession = createTestSession(backlog);
      const mockManager = createMockSessionManager(mockSession);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // EXECUTE
      await pipeline.cleanup();

      // VERIFY
      expect(mockManager.saveBacklog).toHaveBeenCalledWith(backlog);
      expect(pipeline.currentPhase).toBe('shutdown_complete');
    });

    it('should include shutdownInterrupted in PipelineResult', async () => {
      // SETUP
      const mockSession = createTestSession(createTestBacklog([]));
      const mockManager = createMockSessionManager(mockSession);

      const mockOrchestrator = createMockTaskOrchestrator();
      (mockOrchestrator as any).processNextItem = vi
        .fn()
        .mockResolvedValue(false);

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // EXECUTE - normal completion
      const result = await pipeline.run();

      // VERIFY
      expect(result.shutdownInterrupted).toBe(false);
      expect(result.shutdownReason).toBeUndefined();
    });

    it('should include shutdownInterrupted true when shutdown requested', async () => {
      // SETUP
      const mockError = new Error('Test error');
      const mockManager: any = {
        initialize: vi.fn().mockRejectedValue(mockError),
        currentSession: null,
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };

      const pipeline = new PRPPipeline('./test.md');
      (pipeline as any).sessionManager = mockManager;

      // Set shutdown flags before error
      pipeline.shutdownRequested = true;
      pipeline.shutdownReason = 'SIGINT';

      // EXECUTE
      const result = await pipeline.run();

      // VERIFY
      expect(result.shutdownInterrupted).toBe(true);
      expect(result.shutdownReason).toBe('SIGINT');
    });

    it('should log warning on duplicate SIGINT', () => {
      // SETUP
      const pipeline = new PRPPipeline('./test.md');
      const warnSpy = vi.spyOn((pipeline as any).logger, 'warn');

      // EXECUTE - Emit SIGINT twice
      process.emit('SIGINT');
      process.emit('SIGINT');

      // VERIFY
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate SIGINT received')
      );

      // Cleanup
      process.removeAllListeners('SIGINT');
      warnSpy.mockRestore();
    });
  });
});
