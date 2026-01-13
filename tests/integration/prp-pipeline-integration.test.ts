/**
 * Integration tests for PRPPipeline class
 *
 * @remarks
 * Tests validate end-to-end PRPPipeline workflow with real SessionManager and TaskOrchestrator.
 * Agent calls are mocked to avoid LLM dependencies. File system operations use temp directories.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';
import type { Backlog, Status } from '../../src/core/models.js';

// Mock agent factory to avoid LLM calls
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));

// Mock fs/promises read to return parsed tasks.json for architect result
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn((path: string) => {
      if (path.includes('tasks.json')) {
        // Return the actual file content for tests
        return actual.readFile(path, 'utf-8');
      }
      return actual.readFile(path, 'utf-8');
    }),
  };
});

import { readFile } from 'node:fs/promises';

describe('PRPPipeline Integration Tests', () => {
  let tempDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'prp-pipeline-test-'));
    prdPath = join(tempDir, 'PRD.md');
  });

  afterEach(() => {
    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  // Helper to create a test PRD file
  const createTestPRD = (
    content: string = '# Test PRD\n\nThis is a test PRD.'
  ) => {
    const fs = require('node:fs');
    fs.writeFileSync(prdPath, content);
  };

  // Helper to create a minimal tasks.json in session directory
  const createTasksJson = (sessionPath: string, backlog: Backlog) => {
    const fs = require('node:fs');
    const tasksPath = join(sessionPath, 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify(backlog, null, 2));
  };

  describe('full run() workflow with new session', () => {
    it('should complete workflow successfully for new session', async () => {
      // SETUP: Create test PRD
      createTestPRD();

      // Mock architect agent to write tasks.json
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);

      // Mock readFile - return PRD content when reading PRD, empty backlog for tasks.json
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        if (path.includes(prdPath)) {
          return '# Test PRD\n\nThis is a test PRD.';
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(prdPath);
      const result = await pipeline.run();

      // VERIFY
      expect(result.success).toBe(true);
      expect(result.sessionPath).toContain('/plan/');
      expect(result.totalTasks).toBe(0);
      expect(result.completedTasks).toBe(0);
      expect(result.failedTasks).toBe(0);
      expect(result.finalPhase).toBe('qa_complete');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.phases).toEqual([]);
      expect(result.bugsFound).toBe(0);
    });

    it('should generate session directory with prd_snapshot.md and tasks.json', async () => {
      // SETUP
      createTestPRD();

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(prdPath);
      const result = await pipeline.run();

      // VERIFY: Check session directory exists
      expect(existsSync(result.sessionPath)).toBe(true);

      // Verify prd_snapshot.md exists
      const prdSnapshotPath = join(result.sessionPath, 'prd_snapshot.md');
      expect(existsSync(prdSnapshotPath)).toBe(true);
      const prdSnapshot = readFileSync(prdSnapshotPath, 'utf-8');
      expect(prdSnapshot).toContain('# Test PRD');

      // Verify tasks.json exists
      const tasksPath = join(result.sessionPath, 'tasks.json');
      expect(existsSync(tasksPath)).toBe(true);
    });
  });

  describe('full run() workflow with existing session', () => {
    it('should reuse existing session when PRD hash matches', async () => {
      // SETUP: Create initial session
      createTestPRD();

      // First run creates the session
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      const pipeline1 = new PRPPipeline(prdPath);
      const result1 = await pipeline1.run();
      const sessionPath = result1.sessionPath;

      // Second run should reuse session
      vi.clearAllMocks();
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      const pipeline2 = new PRPPipeline(prdPath);
      const result2 = await pipeline2.run();

      // VERIFY
      expect(result2.sessionPath).toBe(sessionPath);
      expect(result2.success).toBe(true);
    });

    it('should skip backlog generation for existing session with backlog', async () => {
      // SETUP: Create session with existing backlog
      createTestPRD();

      // First run to create session
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      const pipeline1 = new PRPPipeline(prdPath);
      await pipeline1.run();

      // Second run - architect should not be called (existing backlog)
      vi.clearAllMocks();
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      const pipeline2 = new PRPPipeline(prdPath);
      await pipeline2.run();

      // VERIFY: Architect agent not called for existing session with backlog
      expect(mockAgent.prompt).not.toHaveBeenCalled();
    });
  });

  describe('state transitions through all phases', () => {
    it('should transition through all phases correctly', async () => {
      // SETUP
      createTestPRD();

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      // EXECUTE
      const pipeline = new PRPPipeline(prdPath);

      // Run the pipeline
      await pipeline.run();

      // VERIFY: Final phase is qa_complete (all phases completed)
      expect(pipeline.currentPhase).toBe('qa_complete');
    });

    it('should update task counts during execution', async () => {
      // SETUP
      createTestPRD();

      // Create backlog with subtasks
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
                        status: 'Complete' as Status,
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
      const pipeline = new PRPPipeline(prdPath);
      const result = await pipeline.run();

      // VERIFY
      expect(result.totalTasks).toBe(1);
      expect(result.completedTasks).toBe(1);
    });
  });

  describe('PipelineResult summary accuracy', () => {
    it('should return accurate phase summaries', async () => {
      // SETUP
      createTestPRD();

      // Create backlog with multiple phases
      const backlog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Complete' as Status,
            description: 'Test phase 1',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Complete' as Status,
                description: 'Test milestone',
                tasks: [],
              },
              {
                id: 'P1.M2',
                type: 'Milestone',
                title: 'Milestone 2',
                status: 'Planned' as Status,
                description: 'Test milestone',
                tasks: [],
              },
            ],
          },
          {
            id: 'P2',
            type: 'Phase',
            title: 'Phase 2',
            status: 'Planned' as Status,
            description: 'Test phase 2',
            milestones: [],
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
      const pipeline = new PRPPipeline(prdPath);
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
        totalMilestones: 0,
        completedMilestones: 0,
      });
    });

    it('should calculate duration correctly', async () => {
      // SETUP
      createTestPRD();

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      // EXECUTE
      const startTime = performance.now();
      const pipeline = new PRPPipeline(prdPath);
      const result = await pipeline.run();
      const endTime = performance.now();

      // VERIFY
      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });
  });

  describe('error handling', () => {
    it('should return failed result on error', async () => {
      // SETUP: Create invalid PRD path
      const invalidPath = join(tempDir, 'nonexistent.md');

      // EXECUTE
      const pipeline = new PRPPipeline(invalidPath);
      const result = await pipeline.run();

      // VERIFY
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.finalPhase).toBe('init'); // Phase should not change if init fails
    });

    it('should handle scope parameter correctly', async () => {
      // SETUP
      createTestPRD();

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
      };
      const { createArchitectAgent } =
        await import('../../src/agents/agent-factory.js');
      (createArchitectAgent as any).mockReturnValue(mockAgent);
      (readFile as any).mockImplementation((path: string) => {
        if (path.includes('tasks.json')) {
          return JSON.stringify({ backlog: [] });
        }
        return '';
      });

      // EXECUTE with scope
      const pipeline = new PRPPipeline(prdPath, { type: 'phase', id: 'P1' });
      const result = await pipeline.run();

      // VERIFY
      expect(result.success).toBe(true);
    });
  });
});
