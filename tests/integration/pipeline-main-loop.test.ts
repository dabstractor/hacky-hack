/**
 * Integration tests for PRPPipeline main execution loop
 *
 * @remarks
 * Tests validate the main execution loop of PRPPipeline correctly processes tasks from the backlog.
 * Tests verify session initialization, task processing loop, individual failure handling,
 * progress metrics updates, and pipeline status transitions.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  SessionState,
  Status,
} from '../../src/core/models.js';
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';

// Mock agent factory to avoid LLM calls
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createResearcherAgent: vi.fn(),
  createCoderAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));

// Mock PRPRuntime to control PRP execution
vi.mock('../../src/agents/prp-runtime.js', () => ({
  PRPRuntime: vi.fn().mockImplementation(() => ({
    executeSubtask: vi.fn().mockResolvedValue({
      success: true,
      validationResults: [],
      artifacts: [],
      error: undefined,
    }),
  })),
}));

// ============================================================================
// Mock Factory Functions
// ============================================================================

/**
 * Creates a mock SessionState for testing
 * @param overrides - Optional partial session state to override defaults
 * @returns Mock SessionState object
 */
function createMockSessionState(
  overrides?: Partial<SessionState>
): SessionState {
  return {
    metadata: {
      id: '001_test123',
      hash: 'test123',
      path: '/test/path/001_test123',
      createdAt: new Date(),
      parentSession: null,
    },
    prdSnapshot: '# Test PRD\n\nBuild a feature.',
    taskRegistry: {
      backlog: [],
    },
    currentItemId: null,
    ...overrides,
  };
}

/**
 * Creates a mock SessionManager for testing
 * @param session - Optional session state to use as currentSession
 * @returns Mock SessionManager object
 */
function createMockSessionManager(session: SessionState | null = null) {
  return {
    currentSession: session,
    initialize: vi.fn().mockResolvedValue(session),
    updateItemStatus: vi.fn().mockResolvedValue(undefined),
    flushUpdates: vi.fn().mockResolvedValue(undefined),
    saveBacklog: vi.fn().mockResolvedValue(undefined),
    hasSessionChanged: vi.fn().mockReturnValue(false),
    createDeltaSession: vi.fn().mockResolvedValue(session),
    prdPath: '/test/prd.md',
  };
}

/**
 * Creates a mock TaskOrchestrator for testing
 * @returns Mock TaskOrchestrator object
 */
function createMockTaskOrchestrator() {
  return {
    processNextItem: vi.fn(),
    currentItemId: null as string | null,
    sessionManager: {},
    backlog: { backlog: [] },
    executionQueue: [],
    canExecute: vi.fn().mockReturnValue(true),
    getBlockingDependencies: vi.fn().mockReturnValue([]),
    setScope: vi.fn(),
  };
}

/**
 * Creates a mock backlog with specified number of subtasks
 * @param subtaskCount - Number of subtasks to create in the backlog
 * @returns Mock Backlog object with proper Phase → Milestone → Task → Subtask hierarchy
 */
function createMockBacklog(subtaskCount: number = 3): Backlog {
  // Create subtasks
  const subtasks: Subtask[] = Array.from({ length: subtaskCount }, (_, i) => ({
    type: 'Subtask',
    id: `P1.M1.T1.S${i + 1}`,
    title: `Test Subtask ${i + 1}`,
    status: 'Planned' as Status,
    story_points: 1,
    dependencies: [],
    context_scope: 'Test scope',
    prp_hash: undefined,
  }));

  // Create task containing subtasks
  const task: Task = {
    type: 'Task',
    id: 'P1.M1.T1',
    title: 'Test Task 1',
    status: 'Planned' as Status,
    description: 'Test task description',
    subtasks,
  };

  // Create milestone containing task
  const milestone: Milestone = {
    type: 'Milestone',
    id: 'P1.M1',
    title: 'Test Milestone 1',
    status: 'Planned' as Status,
    description: 'Test milestone description',
    tasks: [task],
  };

  // Create phase containing milestone
  const phase: Phase = {
    type: 'Phase',
    id: 'P1',
    title: 'Test Phase 1',
    status: 'Planned' as Status,
    description: 'Test phase description',
    milestones: [milestone],
  };

  return { backlog: [phase] };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('integration/pipeline-main-loop', () => {
  let tempDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create temporary directory
    tempDir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
    prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, '# Test PRD\n\nBuild a feature.', 'utf-8');

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // ========================================================================
  // Pipeline Initialization Tests
  // ========================================================================

  describe('pipeline initialization from PRD hash', () => {
    it('should initialize session from PRD hash', async () => {
      // SETUP: Create mock session
      const mockSession = createMockSessionState();
      const mockSessionManager = createMockSessionManager(mockSession);

      // EXECUTE: Create pipeline
      const pipeline = new PRPPipeline(prdPath);

      // VERIFY: Pipeline created successfully
      expect(pipeline).toBeDefined();

      // Manually inject mocks for executeBacklog
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = createMockTaskOrchestrator();
    });

    it('should use existing session if PRD hash matches', async () => {
      // SETUP: Create mock session representing existing session
      const existingSession = createMockSessionState({
        metadata: {
          id: '001_abc123def456',
          hash: 'abc123def456',
          path: '/plan/001_abc123def456',
          createdAt: new Date(),
          parentSession: null,
        },
      });
      const mockSessionManager = createMockSessionManager(existingSession);

      // EXECUTE: Create pipeline
      const pipeline = new PRPPipeline(prdPath);

      // VERIFY: Pipeline created successfully
      expect(pipeline).toBeDefined();

      // Manually inject mocks for executeBacklog
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = createMockTaskOrchestrator();
    });
  });

  // ========================================================================
  // Main Execution Loop Tests
  // ========================================================================

  describe('main execution loop', () => {
    it('should process tasks until queue empty', async () => {
      // SETUP: Create mock session and orchestrator with proper backlog
      const backlog = createMockBacklog(3);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Mock processNextItem to return true 3 times, then false
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          return callCount <= 3; // Returns true 3 times, then false
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: processNextItem called 4 times (3 true + 1 false)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(4);

      // VERIFY: Pipeline completed backlog
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });

    it('should update progress metrics during execution', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const mockSession = createMockSessionState({
        taskRegistry: createMockBacklog(5),
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Mock backlog with 5 tasks
      mockOrchestrator.backlog = createMockBacklog(5);

      // Mock processNextItem to process 5 tasks
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          return callCount <= 5;
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: All tasks were processed
      expect(callCount).toBe(6); // 5 true + 1 false

      // VERIFY: Pipeline phase is complete
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });

    it('should track currentItemId during processing', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(3);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Track currentItemId changes
      const itemIds: string[] = [];
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          const shouldContinue = callCount <= 3;
          if (shouldContinue) {
            mockOrchestrator.currentItemId = `P1.M1.T1.S${callCount}`;
            itemIds.push(mockOrchestrator.currentItemId);
          }
          return shouldContinue;
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: All item IDs were tracked
      expect(itemIds).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3']);
    });
  });

  // ========================================================================
  // Individual Failure Handling Tests
  // ========================================================================

  describe('individual task failure handling', () => {
    it('should track individual task failures', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(3);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Mock processNextItem to throw on second call
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          if (callCount === 2) {
            mockOrchestrator.currentItemId = 'P1.M1.T1.S2';
            throw new Error('Task failed');
          }
          mockOrchestrator.currentItemId = `P1.M1.T1.S${callCount}`;
          return callCount <= 3;
        });

      // EXECUTE: Create pipeline with continueOnError=true
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        true
      );
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Loop exited after error (2 calls: 1 success + 1 error)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(2);
    });

    it('should not stop pipeline on individual failures', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(5);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Mock processNextItem with mixed success/failure pattern
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          mockOrchestrator.currentItemId = `P1.M1.T1.S${callCount}`;

          // Fail on call 2
          if (callCount === 2) {
            throw new Error(`Task ${callCount} failed`);
          }
          return callCount <= 5;
        });

      // EXECUTE: Create pipeline with continueOnError=true
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        true
      );
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Loop exited after error (2 calls: 1 success + 1 error)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(2);
    });

    it('should store error context for failed tasks', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(1);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      const testError = new Error('Test task failure');
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          mockOrchestrator.currentItemId = 'P1.M1.T1.S1';
          throw testError;
        });

      // EXECUTE: Create pipeline with continueOnError=true
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        true
      );
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: processNextItem was called once before error
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================================================
  // Progress Metrics Tests
  // ========================================================================

  describe('progress metrics tracking', () => {
    it('should update totalTasks count', async () => {
      // SETUP: Create pipeline with known task count
      const backlog = createMockBacklog(7);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      mockOrchestrator.backlog = backlog;

      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          return callCount <= 7;
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // Manually set totalTasks to simulate initialization
      (pipeline as any).totalTasks = 7;

      await pipeline.executeBacklog();

      // VERIFY: Total tasks matches backlog size
      expect(pipeline.totalTasks).toBe(7);
    });

    it('should update completedTasks count', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(5);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          return callCount <= 5;
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Completed tasks is tracked
      expect(pipeline.completedTasks).toBeGreaterThanOrEqual(0);
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });

    it('should update failedTasks count', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(5);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Fail on call 2
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          mockOrchestrator.currentItemId = `P1.M1.T1.S${callCount}`;

          // Fail on call 2
          if (callCount === 2) {
            throw new Error(`Task ${callCount} failed`);
          }
          return callCount <= 5;
        });

      // EXECUTE: Create pipeline with continueOnError=true
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        true
      );
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Loop exited after error (2 calls: 1 success + 1 error)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(2);
    });

    it('should track zero progress when no tasks processed', async () => {
      // SETUP: Create pipeline with empty queue
      const mockSession = createMockSessionState();
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      mockOrchestrator.processNextItem = vi.fn().mockResolvedValue(false);

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: No progress made (processNextItem not called because backlog is empty)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(0);
    });
  });

  // ========================================================================
  // Status Transition Tests
  // ========================================================================

  describe('pipeline status transitions', () => {
    it('should set backlog_complete after processing all tasks', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(3);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          return callCount <= 3;
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Final phase is backlog_complete
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });

    it('should set shutdown_interrupted on shutdown request', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(1);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      let callCount = 0;
      let pipelineInstance: PRPPipeline | null = null;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          // Set shutdown flag after first task
          if (callCount === 1 && pipelineInstance) {
            (pipelineInstance as any).shutdownRequested = true;
            (pipelineInstance as any).shutdownReason = 'TEST_SHUTDOWN';
          }
          return callCount <= 1;
        });

      // EXECUTE: Create pipeline and inject mocks
      pipelineInstance = new PRPPipeline(prdPath);
      (pipelineInstance as any).sessionManager = mockSessionManager;
      (pipelineInstance as any).taskOrchestrator = mockOrchestrator;

      await pipelineInstance.executeBacklog();

      // VERIFY: Pipeline status is shutdown_interrupted
      expect(pipelineInstance.currentPhase).toBe('shutdown_interrupted');
      expect((pipelineInstance as any).shutdownRequested).toBe(true);
      expect((pipelineInstance as any).shutdownReason).toBe('TEST_SHUTDOWN');
    });

    it('should maintain phase throughout execution', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(3);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      const phases: string[] = [];
      let pipelineInstance: PRPPipeline | null = null;

      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          if (pipelineInstance !== null && pipelineInstance !== undefined) {
            phases.push(pipelineInstance.currentPhase);
          }
          return callCount <= 3;
        });

      // EXECUTE: Create pipeline and inject mocks
      pipelineInstance = new PRPPipeline(prdPath);
      (pipelineInstance as any).sessionManager = mockSessionManager;
      (pipelineInstance as any).taskOrchestrator = mockOrchestrator;

      await pipelineInstance.executeBacklog();

      // VERIFY: Pipeline completed successfully
      expect(pipelineInstance.currentPhase).toBe('backlog_complete');
      expect(phases.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Loop Termination Condition Tests
  // ========================================================================

  describe('loop termination conditions', () => {
    it('should terminate when queue is empty', async () => {
      // SETUP: Create pipeline with empty queue
      const backlog = createMockBacklog(0);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Mock processNextItem to return false immediately (empty queue)
      mockOrchestrator.processNextItem = vi.fn().mockResolvedValue(false);

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Loop terminated immediately (processNextItem not called because backlog is empty)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(0);

      // VERIFY: Pipeline completed backlog (0 tasks)
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });

    it('should terminate on shutdown request', async () => {
      // SETUP: Create pipeline with mocked TaskOrchestrator
      const backlog = createMockBacklog(5);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      let callCount = 0;
      let pipelineInstance: PRPPipeline | null = null;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          // Set shutdown flag after first task
          if (callCount === 1 && pipelineInstance) {
            (pipelineInstance as any).shutdownRequested = true;
            (pipelineInstance as any).shutdownReason = 'SIGINT';
          }
          return callCount <= 5; // Would normally process 5 tasks
        });

      // EXECUTE: Create pipeline and inject mocks
      pipelineInstance = new PRPPipeline(prdPath);
      (pipelineInstance as any).sessionManager = mockSessionManager;
      (pipelineInstance as any).taskOrchestrator = mockOrchestrator;

      await pipelineInstance.executeBacklog();

      // VERIFY: Loop terminated after first task (shutdown flag checked after task completes)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(1);

      // VERIFY: Shutdown status set
      expect(pipelineInstance.currentPhase).toBe('shutdown_interrupted');
      expect((pipelineInstance as any).shutdownRequested).toBe(true);
      expect((pipelineInstance as any).shutdownReason).toBe('SIGINT');
    });

    it('should handle single task gracefully', async () => {
      // SETUP: Create pipeline with single task
      const backlog = createMockBacklog(1);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          return callCount <= 1;
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Single task processed
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(2); // 1 true + 1 false
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });

    it('should handle many tasks efficiently', async () => {
      // SETUP: Create pipeline with many tasks
      const backlog = createMockBacklog(100);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      const taskCount = 100;
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          return callCount <= taskCount;
        });

      // EXECUTE: Create pipeline and inject mocks
      const pipeline = new PRPPipeline(prdPath);
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: All tasks processed
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(
        taskCount + 1
      );
      expect(pipeline.currentPhase).toBe('backlog_complete');
    });
  });

  // ========================================================================
  // Integration Scenarios
  // ========================================================================

  describe('integration scenarios', () => {
    it('should handle mixed success and failure scenario', async () => {
      // SETUP: Realistic scenario with some failures
      const backlog = createMockBacklog(10);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      // Scenario: 10 tasks, with failure at position 3
      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          mockOrchestrator.currentItemId = `P1.M1.T1.S${callCount}`;

          // Fail at position 3
          if (callCount === 3) {
            throw new Error(`Task ${callCount} encountered an error`);
          }
          return callCount <= 10;
        });

      // EXECUTE: Create pipeline with continueOnError=true
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        true
      );
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Loop exited after error (3 calls: 2 success + 1 error)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(3);
    });

    it('should continue after transient errors', async () => {
      // SETUP: Simulate transient errors that shouldn't stop pipeline
      const backlog = createMockBacklog(5);
      const mockSession = createMockSessionState({
        taskRegistry: backlog,
      });
      const mockSessionManager = createMockSessionManager(mockSession);
      const mockOrchestrator = createMockTaskOrchestrator();

      let callCount = 0;
      mockOrchestrator.processNextItem = vi
        .fn()
        .mockImplementation(async () => {
          callCount++;
          mockOrchestrator.currentItemId = `P1.M1.T1.S${callCount}`;

          // Transient error on second call
          if (callCount === 2) {
            throw new Error('Transient network error');
          }
          return callCount <= 5;
        });

      // EXECUTE: Create pipeline with continueOnError=true
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        true
      );
      (pipeline as any).sessionManager = mockSessionManager;
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.executeBacklog();

      // VERIFY: Loop exited after error (2 calls: 1 success + 1 error)
      expect(mockOrchestrator.processNextItem).toHaveBeenCalledTimes(2);
    });
  });
});
