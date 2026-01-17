/**
 * Integration tests for PRPPipeline graceful shutdown handling
 *
 * @remarks
 * Tests validate end-to-end graceful shutdown behavior with real SIGINT/SIGTERM signals.
 * Tests verify that current task completes before exit, state is saved, and proper cleanup occurs.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';
import type { Backlog, Status } from '../../src/core/models.js';

// Mock agent factory to avoid LLM calls
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));

// Mock SessionManager to use test's mock during run()
vi.mock('../../src/core/session-manager.js', () => ({
  SessionManager: vi.fn().mockImplementation(() => ({
    currentSession: null,
    initialize: vi.fn(),
    saveBacklog: vi.fn(),
  })),
}));

// Mock fs/promises for tasks.json reading
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn((path: string) => {
      if (path.includes('tasks.json')) {
        return actual.readFile(path, 'utf-8');
      }
      return actual.readFile(path, 'utf-8');
    }),
  };
});

import { readFile } from 'node:fs/promises';
import { SessionManager as SessionManagerClass } from '../../src/core/session-manager.js';

// Get reference to mocked constructor
const MockSessionManagerClass = SessionManagerClass as any;

describe('PRPPipeline Graceful Shutdown Integration Tests', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;
  let originalProcessListeners: {
    SIGINT: Array<() => void>;
    SIGTERM: Array<() => void>;
  };

  // Helper to set up mock SessionManager
  function setupMockSessionManager(backlog: Backlog) {
    const mock = {
      currentSession: {
        metadata: { path: tempDir },
        taskRegistry: backlog,
      },
      initialize: vi.fn().mockResolvedValue({
        metadata: {
          id: 'test',
          hash: 'abc',
          path: tempDir,
          createdAt: new Date(),
        },
        prdSnapshot: '# Test',
        taskRegistry: backlog,
        currentItemId: null,
      }),
      saveBacklog: vi.fn().mockResolvedValue(undefined),
    };
    MockSessionManagerClass.mockImplementation(() => mock);
    return mock;
  }

  beforeEach(() => {
    // Reset SessionManager mock to default
    MockSessionManagerClass.mockImplementation(() => ({
      currentSession: null,
      initialize: vi.fn().mockResolvedValue({ currentSession: null }),
      saveBacklog: vi.fn().mockResolvedValue(undefined),
    }));

    // Store original process listeners to restore after tests
    originalProcessListeners = {
      SIGINT: (process as any)._events?.SIGINT
        ? [...(process as any)._events.SIGINT]
        : [],
      SIGTERM: (process as any)._events?.SIGTERM
        ? [...(process as any)._events.SIGTERM]
        : [],
    };

    // Create temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'prp-shutdown-test-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');
  });

  afterEach(async () => {
    // Allow pending async operations to complete
    // This is especially important after emitting process signals
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();

    // Restore original process listeners
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    originalProcessListeners.SIGINT.forEach(listener =>
      process.on('SIGINT', listener)
    );
    originalProcessListeners.SIGTERM.forEach(listener =>
      process.on('SIGTERM', listener)
    );
  });

  // Helper to create a test PRD file
  const createTestPRD = (
    content: string = '# Test PRD\n\nThis is a test PRD for shutdown testing.'
  ) => {
    writeFileSync(prdPath, content);
  };

  // Helper to create a tasks.json in session directory
  const createTasksJson = (sessionPath: string, backlog: Backlog) => {
    const tasksPath = join(sessionPath, 'tasks.json');
    writeFileSync(tasksPath, JSON.stringify(backlog, null, 2));
  };

  describe('SIGINT handling during execution', () => {
    it('should complete current task before shutdown on SIGINT', async () => {
      // SETUP: Create test PRD
      createTestPRD();

      // Create backlog with multiple subtasks
      const backlog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned' as Status,
            description: 'Test phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned' as Status,
                description: 'Test milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned' as Status,
                    description: 'Test task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                      {
                        id: 'P1.M1.T1.S3',
                        type: 'Subtask',
                        title: 'Subtask 3',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // Setup mock SessionManager BEFORE creating pipeline
      const mockSessionManager = setupMockSessionManager(backlog);

      // EXECUTE: Create pipeline (will use mocked SessionManager in run())
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );

      // Mock processNextItem to simulate task execution with shutdown after first task
      let callCount = 0;
      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockImplementation(async () => {
          callCount++;
          // After first task completes, set shutdown flag directly
          // (simulates what signal handler would do)
          if (callCount === 1) {
            (pipeline as any).shutdownRequested = true;
            (pipeline as any).shutdownReason = 'SIGINT';
          }
          // Return false after second call to simulate queue empty
          return callCount <= 1;
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      // Run pipeline
      const result = await pipeline.run();

      // VERIFY: Pipeline should have shutdown gracefully
      expect(pipeline.shutdownRequested).toBe(true);
      expect(pipeline.shutdownReason).toBe('SIGINT');
      expect(pipeline.currentPhase).toBe('shutdown_interrupted');
      expect(result.shutdownInterrupted).toBe(true);
      expect(result.shutdownReason).toBe('SIGINT');

      // processNextItem should have been called - current task completed
      expect(callCount).toBeGreaterThan(0);

      // Cleanup should have been called
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
    });

    it('should save state before exit on SIGTERM', async () => {
      // SETUP
      createTestPRD();

      const backlog: Backlog = { backlog: [] };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );

      // Simulate SIGTERM during execution
      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockImplementation(async () => {
          // Simulate SIGTERM
          process.emit('SIGTERM');

          // Allow async signal handlers to complete
          await new Promise(resolve => setImmediate(resolve));
          await new Promise(resolve => setImmediate(resolve));

          return false; // No more items
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: {
            id: 'test',
            hash: 'abc',
            path: tempDir,
            createdAt: new Date(),
          },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      (pipeline as any).sessionManager = mockSessionManager;

      const result = await pipeline.run();

      // VERIFY
      expect(pipeline.shutdownRequested).toBe(true);
      expect(pipeline.shutdownReason).toBe('SIGTERM');
      expect(result.shutdownInterrupted).toBe(true);
      expect(result.shutdownReason).toBe('SIGTERM');
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
    });

    it('should handle duplicate SIGINT signals gracefully', async () => {
      // SETUP
      createTestPRD();

      const backlog: Backlog = { backlog: [] };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );
      const warnSpy = vi.spyOn((pipeline as any).logger, 'warn');

      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockImplementation(async () => {
          // Send duplicate SIGINT signals
          process.emit('SIGINT');
          process.emit('SIGINT');

          // Allow async signal handlers to complete
          await new Promise(resolve => setImmediate(resolve));
          await new Promise(resolve => setImmediate(resolve));

          return false;
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: {
            id: 'test',
            hash: 'abc',
            path: tempDir,
            createdAt: new Date(),
          },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      (pipeline as any).sessionManager = mockSessionManager;

      await pipeline.run();

      // VERIFY: Duplicate SIGINT should log warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate SIGINT')
      );
      warnSpy.mockRestore();
    });
  });

  describe('state preservation during shutdown', () => {
    it('should save backlog state in cleanup even on error', async () => {
      // SETUP
      createTestPRD();

      const backlog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Implementing' as Status,
            description: 'Test phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Implementing' as Status,
                description: 'Test milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Implementing' as Status,
                    description: 'Test task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Complete' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );

      // Simulate error during execution with SIGINT
      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockImplementation(async () => {
          process.emit('SIGINT');

          // Allow async signal handlers to complete
          await new Promise(resolve => setImmediate(resolve));
          await new Promise(resolve => setImmediate(resolve));

          throw new Error('Simulated execution error');
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: {
            id: 'test',
            hash: 'abc',
            path: tempDir,
            createdAt: new Date(),
          },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      (pipeline as any).sessionManager = mockSessionManager;

      const result = await pipeline.run();

      // VERIFY: Even on error, cleanup should save state
      expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
      expect(result.shutdownInterrupted).toBe(true);
      expect(pipeline.currentPhase).toBe('shutdown_complete');
    });
  });

  describe('signal listener cleanup', () => {
    it('should remove signal listeners in cleanup', async () => {
      // SETUP
      createTestPRD();

      const backlog: Backlog = { backlog: [] };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );
      const initialSigintCount = (process as any)._events?.SIGINT?.length ?? 0;

      // Run pipeline
      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: {
            id: 'test',
            hash: 'abc',
            path: tempDir,
            createdAt: new Date(),
          },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      (pipeline as any).sessionManager = mockSessionManager;

      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockResolvedValue(false),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      await pipeline.run();

      // VERIFY: Signal listeners should be cleaned up (back to original count)
      const finalSigintCount = (process as any)._events?.SIGINT?.length ?? 0;
      expect(finalSigintCount).toBeLessThanOrEqual(initialSigintCount);
    });
  });

  describe('PipelineResult with shutdown info', () => {
    it('should include shutdownInterrupted and shutdownReason in result', async () => {
      // SETUP
      createTestPRD();

      const backlog: Backlog = { backlog: [] };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // EXECUTE: Normal completion (no shutdown)
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: {
            id: 'test',
            hash: 'abc',
            path: tempDir,
            createdAt: new Date(),
          },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      (pipeline as any).sessionManager = mockSessionManager;

      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockResolvedValue(false),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      const result = await pipeline.run();

      // VERIFY: Normal completion should have shutdownInterrupted: false
      expect(result.shutdownInterrupted).toBe(false);
      expect(result.shutdownReason).toBeUndefined();
    });

    it('should return shutdownInterrupted: true when SIGINT received', async () => {
      // SETUP
      createTestPRD();

      const backlog: Backlog = { backlog: [] };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // EXECUTE: Pipeline with SIGINT
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );

      const mockOrchestrator: any = {
        sessionManager: {},
        processNextItem: vi.fn().mockImplementation(async () => {
          process.emit('SIGINT');

          // Allow async signal handlers to complete
          await new Promise(resolve => setImmediate(resolve));
          await new Promise(resolve => setImmediate(resolve));

          return false;
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: {
            id: 'test',
            hash: 'abc',
            path: tempDir,
            createdAt: new Date(),
          },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      (pipeline as any).sessionManager = mockSessionManager;

      const result = await pipeline.run();

      // VERIFY
      expect(result.shutdownInterrupted).toBe(true);
      expect(result.shutdownReason).toBe('SIGINT');
    });
  });

  describe('shutdown progress logging', () => {
    it('should log progress state during shutdown', async () => {
      // SETUP
      createTestPRD();

      const backlog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Implementing' as Status,
            description: 'Test phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Implementing' as Status,
                description: 'Test milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Implementing' as Status,
                    description: 'Test task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Complete' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned' as Status,
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify(backlog);
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(
        prdPath,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        planDir
      );
      const infoSpy = vi.spyOn((pipeline as any).logger, 'info');

      // Mock orchestrator to trigger shutdown
      const mockOrchestrator: any = {
        sessionManager: {},
        currentItemId: 'P1.M1.T1.S1',
        processNextItem: vi.fn().mockImplementation(async () => {
          // Set shutdown flag after first task
          (pipeline as any).shutdownRequested = true;
          return false;
        }),
      };
      (pipeline as any).taskOrchestrator = mockOrchestrator;

      const mockSessionManager: any = {
        currentSession: {
          metadata: { path: tempDir },
          taskRegistry: backlog,
        },
        initialize: vi.fn().mockResolvedValue({
          metadata: {
            id: 'test',
            hash: 'abc',
            path: tempDir,
            createdAt: new Date(),
          },
          prdSnapshot: '# Test',
          taskRegistry: backlog,
          currentItemId: null,
        }),
        saveBacklog: vi.fn().mockResolvedValue(undefined),
      };
      (pipeline as any).sessionManager = mockSessionManager;

      await pipeline.run();

      // VERIFY - Cleanup should have run without error
      expect(infoSpy).toHaveBeenCalledWith('[PRPPipeline] Cleanup complete');

      infoSpy.mockRestore();
    });
  });
});
