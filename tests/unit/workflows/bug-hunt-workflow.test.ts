/**
 * Unit tests for BugHuntWorkflow class
 *
 * @remarks
 * Tests validate BugHuntWorkflow class from src/workflows/bug-hunt-workflow.ts
 * with comprehensive coverage. Tests follow the Setup/Execute/Verify pattern.
 *
 * Mocks are used for all agent operations - no real I/O is performed.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BugHuntWorkflow } from '../../../src/workflows/bug-hunt-workflow.js';
import type { Task, TestResults, Bug } from '../../../src/core/models.js';

// Mock agent factory
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));

// Mock bug hunt prompt
vi.mock('../../../src/agents/prompts/bug-hunt-prompt.js', () => ({
  createBugHuntPrompt: vi.fn(),
}));

// Import mocked modules
import { createQAAgent } from '../../../src/agents/agent-factory.js';
import { createBugHuntPrompt } from '../../../src/agents/prompts/bug-hunt-prompt.js';

// Cast mocked functions
const mockCreateQAAgent = createQAAgent as any;
const mockCreateBugHuntPrompt = createBugHuntPrompt as any;

// Factory functions for test data
const createTestTask = (
  id: string,
  title: string,
  description?: string
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Complete',
  description: description ?? `Description for ${title}`,
  subtasks: [],
});

const createTestBug = (
  id: string,
  severity: 'critical' | 'major' | 'minor' | 'cosmetic',
  title: string,
  description: string,
  reproduction: string
): Bug => ({
  id,
  severity,
  title,
  description,
  reproduction,
});

const createTestResults = (
  hasBugs: boolean,
  bugs: Bug[],
  summary: string,
  recommendations: string[]
): TestResults => ({
  hasBugs,
  bugs,
  summary,
  recommendations,
});

describe('BugHuntWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    mockCreateQAAgent.mockReturnValue({
      prompt: vi.fn(),
    });
    mockCreateBugHuntPrompt.mockReturnValue({});
  });

  describe('constructor', () => {
    it('should throw if prdContent is empty', () => {
      // EXECUTE & VERIFY
      expect(() => new BugHuntWorkflow('', [])).toThrow(
        'prdContent must be a non-empty string'
      );
    });

    it('should throw if prdContent is only whitespace', () => {
      // EXECUTE & VERIFY
      expect(() => new BugHuntWorkflow('   ', [])).toThrow(
        'prdContent must be a non-empty string'
      );
    });

    it('should throw if prdContent is not a string', () => {
      // EXECUTE & VERIFY
      expect(() => new BugHuntWorkflow('' as any, [])).toThrow(
        'prdContent must be a non-empty string'
      );
    });

    it('should throw if completedTasks is not an array', () => {
      // EXECUTE & VERIFY
      expect(
        () => new BugHuntWorkflow('PRD content', 'not an array' as any)
      ).toThrow('completedTasks must be an array');
    });

    it('should initialize ObservedState fields with provided values', () => {
      // SETUP
      const prdContent = '# PRD\n## Requirements\nBuild a feature.';
      const completedTasks = [
        createTestTask('P1.M1.T1', 'Setup Project', 'Initial setup'),
        createTestTask('P1.M2.T1', 'Implement Core', 'Core logic'),
      ];

      // EXECUTE
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);

      // VERIFY
      expect(workflow.prdContent).toBe(prdContent);
      expect(workflow.completedTasks).toEqual(completedTasks);
    });

    it('should initialize testResults as null', () => {
      // EXECUTE
      const workflow = new BugHuntWorkflow('PRD content', []);

      // VERIFY
      expect(workflow.testResults).toBeNull();
    });

    it('should accept empty completedTasks array', () => {
      // EXECUTE
      const workflow = new BugHuntWorkflow('PRD content', []);

      // VERIFY
      expect(workflow.completedTasks).toEqual([]);
    });
  });

  describe('analyzeScope', () => {
    it('should execute without error', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);

      // EXECUTE - should not throw
      await workflow.analyzeScope();

      // VERIFY - method completes successfully
      expect(workflow.prdContent).toBe('PRD content');
    });

    it('should log PRD analysis details', async () => {
      // SETUP
      const prdContent = '# Test PRD\n## Requirements\nSome requirements';
      const tasks = [
        createTestTask('P1.M1.T1', 'Task 1'),
        createTestTask('P1.M2.T1', 'Task 2'),
      ];
      const workflow = new BugHuntWorkflow(prdContent, tasks);

      // Spy on logger
      const logSpy = vi.spyOn(workflow.logger, 'info');

      // EXECUTE
      await workflow.analyzeScope();

      // VERIFY
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] Phase 1: Scope Analysis'
      );
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] Analyzing PRD requirements...',
        { prdLength: prdContent.length }
      );
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] Completed tasks for testing:',
        {
          count: 2,
          tasks: ['P1.M1.T1: Task 1', 'P1.M2.T1: Task 2'],
        }
      );
    });
  });

  describe('creativeE2ETesting', () => {
    it('should execute without error', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);

      // EXECUTE
      await workflow.creativeE2ETesting();

      // VERIFY
      expect(workflow.prdContent).toBe('PRD content');
    });

    it('should log E2E test categories', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const logSpy = vi.spyOn(workflow.logger, 'info');

      // EXECUTE
      await workflow.creativeE2ETesting();

      // VERIFY
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] Phase 2: Creative E2E Testing'
      );
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] E2E test categories:',
        [
          'Happy Path Testing',
          'Edge Case Testing',
          'Workflow Testing',
          'Integration Testing',
          'Error Handling',
          'State Testing',
          'Concurrency Testing',
          'Regression Testing',
        ]
      );
    });
  });

  describe('adversarialTesting', () => {
    it('should execute without error', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);

      // EXECUTE
      await workflow.adversarialTesting();

      // VERIFY
      expect(workflow.prdContent).toBe('PRD content');
    });

    it('should log adversarial test categories', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const logSpy = vi.spyOn(workflow.logger, 'info');

      // EXECUTE
      await workflow.adversarialTesting();

      // VERIFY
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] Phase 3: Adversarial Testing'
      );
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] Adversarial test categories:',
        [
          'Unexpected Inputs',
          'Missing Features',
          'Incomplete Features',
          'Implicit Requirements',
          'User Experience Issues',
          'Security Concerns',
          'Performance Issues',
        ]
      );
    });
  });

  describe('generateReport', () => {
    it('should call createQAAgent to get agent', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          hasBugs: false,
          bugs: [],
          summary: 'No bugs found',
          recommendations: [],
        }),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      await workflow.generateReport();

      // VERIFY
      expect(mockCreateQAAgent).toHaveBeenCalled();
    });

    it('should call createBugHuntPrompt with correct parameters', async () => {
      // SETUP
      const prdContent = '# Test PRD';
      const completedTasks = [
        createTestTask('P1.M1.T1', 'Task 1'),
        createTestTask('P1.M2.T1', 'Task 2'),
      ];
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          hasBugs: false,
          bugs: [],
          summary: 'No bugs found',
          recommendations: [],
        }),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      await workflow.generateReport();

      // VERIFY
      expect(mockCreateBugHuntPrompt).toHaveBeenCalledWith(
        prdContent,
        completedTasks
      );
    });

    it('should call agent.prompt with the prompt', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const prompt = { user: 'test prompt', system: 'system' };
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          hasBugs: false,
          bugs: [],
          summary: 'No bugs found',
          recommendations: [],
        }),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue(prompt);

      // EXECUTE
      await workflow.generateReport();

      // VERIFY
      expect(mockAgent.prompt).toHaveBeenCalledWith(prompt);
    });

    it('should store result in testResults field', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const expectedResult = createTestResults(
        true,
        [
          createTestBug(
            'BUG-001',
            'critical',
            'Login fails',
            'Auth error',
            'Steps to reproduce'
          ),
        ],
        'Found 1 critical bug',
        ['Fix auth']
      );
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      await workflow.generateReport();

      // VERIFY
      expect(workflow.testResults).toEqual(expectedResult);
    });

    it('should return TestResults result', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const expectedResult = createTestResults(
        false,
        [],
        'All tests passed',
        []
      );
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const result = await workflow.generateReport();

      // VERIFY
      expect(result).toEqual(expectedResult);
    });

    it('should log bug report summary', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const testResults = createTestResults(
        true,
        [
          createTestBug('BUG-001', 'critical', 'Bug 1', 'Desc 1', 'Rep 1'),
          createTestBug('BUG-002', 'major', 'Bug 2', 'Desc 2', 'Rep 2'),
          createTestBug('BUG-003', 'minor', 'Bug 3', 'Desc 3', 'Rep 3'),
          createTestBug('BUG-004', 'cosmetic', 'Bug 4', 'Desc 4', 'Rep 4'),
        ],
        'Found 4 bugs',
        ['Fix all']
      );
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(testResults),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});
      const logSpy = vi.spyOn(workflow.logger, 'info');

      // EXECUTE
      await workflow.generateReport();

      // VERIFY
      expect(logSpy).toHaveBeenCalledWith(
        '[BugHuntWorkflow] Bug report generated',
        {
          hasBugs: true,
          bugCount: 4,
          criticalCount: 1,
          majorCount: 1,
          minorCount: 1,
          cosmeticCount: 1,
        }
      );
    });

    it('should propagate errors from agent.prompt', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const mockError = new Error('Agent failed');
      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(mockError),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE & VERIFY
      await expect(workflow.generateReport()).rejects.toThrow(
        'Bug report generation failed: Agent failed'
      );
    });

    it('should propagate errors from createQAAgent', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      mockCreateQAAgent.mockImplementation(() => {
        throw new Error('Factory failed');
      });
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE & VERIFY
      await expect(workflow.generateReport()).rejects.toThrow(
        'Bug report generation failed: Factory failed'
      );
    });

    it('should propagate errors from createBugHuntPrompt', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      mockCreateBugHuntPrompt.mockImplementation(() => {
        throw new Error('Prompt creation failed');
      });

      // EXECUTE & VERIFY
      await expect(workflow.generateReport()).rejects.toThrow(
        'Bug report generation failed: Prompt creation failed'
      );
    });

    it('should handle empty bugs array', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const expectedResult = createTestResults(false, [], 'No bugs found', []);
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const result = await workflow.generateReport();

      // VERIFY
      expect(result.bugs).toEqual([]);
      expect(result.hasBugs).toBe(false);
    });
  });

  describe('run', () => {
    it('should call all phase methods in order', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const expectedResult = createTestResults(
        false,
        [],
        'All tests passed',
        []
      );
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // Spy on phase methods
      const analyzeScopeSpy = vi.spyOn(workflow, 'analyzeScope');
      const creativeE2ETestingSpy = vi.spyOn(workflow, 'creativeE2ETesting');
      const adversarialTestingSpy = vi.spyOn(workflow, 'adversarialTesting');
      const generateReportSpy = vi.spyOn(workflow, 'generateReport');

      // EXECUTE
      await workflow.run();

      // VERIFY
      expect(analyzeScopeSpy).toHaveBeenCalled();
      expect(creativeE2ETestingSpy).toHaveBeenCalled();
      expect(adversarialTestingSpy).toHaveBeenCalled();
      expect(generateReportSpy).toHaveBeenCalled();
    });

    it('should return TestResults', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const expectedResult = createTestResults(
        true,
        [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Rep')],
        'Found bugs',
        ['Fix']
      );
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const result = await workflow.run();

      // VERIFY
      expect(result).toEqual(expectedResult);
    });

    it('should set status to running before execution', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          hasBugs: false,
          bugs: [],
          summary: 'No bugs',
          recommendations: [],
        }),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // Spy on setStatus
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      // EXECUTE
      await workflow.run();

      // VERIFY - setStatus('running') should be called before setStatus('completed')
      expect(setStatusSpy).toHaveBeenNthCalledWith(1, 'running');
      expect(setStatusSpy).toHaveBeenNthCalledWith(2, 'completed');
    });

    it('should set status to completed after successful execution', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          hasBugs: false,
          bugs: [],
          summary: 'No bugs',
          recommendations: [],
        }),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // Spy on setStatus
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      // EXECUTE
      await workflow.run();

      // VERIFY
      expect(setStatusSpy).toHaveBeenCalledWith('completed');
    });

    it('should propagate errors from phase methods', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(new Error('Phase failed')),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE & VERIFY
      await expect(workflow.run()).rejects.toThrow('Phase failed');
    });

    it('should set status to failed on error', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(new Error('Test error')),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // Spy on setStatus
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      // EXECUTE
      try {
        await workflow.run();
      } catch {
        // Expected error
      }

      // VERIFY
      expect(setStatusSpy).toHaveBeenCalledWith('running');
      expect(setStatusSpy).toHaveBeenCalledWith('failed');
    });

    it('should not set status to completed on error', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(new Error('Test error')),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // Spy on setStatus
      const setStatusSpy = vi.spyOn(workflow, 'setStatus');

      // EXECUTE
      try {
        await workflow.run();
      } catch {
        // Expected error
      }

      // VERIFY - should be called with 'running' and 'failed' but not 'completed'
      expect(setStatusSpy).toHaveBeenCalledWith('running');
      expect(setStatusSpy).not.toHaveBeenCalledWith('completed');
    });

    it('should update testResults field after successful run', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const expectedResult = createTestResults(
        true,
        [createTestBug('BUG-001', 'major', 'Bug', 'Desc', 'Rep')],
        'Found bugs',
        ['Fix']
      );
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      await workflow.run();

      // VERIFY
      expect(workflow.testResults).toEqual(expectedResult);
    });

    it('should handle workflow with completedTasks provided', async () => {
      // SETUP
      const completedTasks = [
        createTestTask('P1.M1.T1', 'Task 1', 'First task'),
        createTestTask('P1.M2.T1', 'Task 2', 'Second task'),
        createTestTask('P1.M3.T1.S1', 'Subtask 1', 'Subtask'),
      ];
      const workflow = new BugHuntWorkflow('PRD content', completedTasks);
      const expectedResult = createTestResults(false, [], 'All good', []);
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const result = await workflow.run();

      // VERIFY
      expect(mockCreateBugHuntPrompt).toHaveBeenCalledWith(
        'PRD content',
        completedTasks
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle workflow with no completedTasks', async () => {
      // SETUP
      const workflow = new BugHuntWorkflow('PRD content', []);
      const expectedResult = createTestResults(
        false,
        [],
        'No tasks to test',
        []
      );
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResult),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const result = await workflow.run();

      // VERIFY
      expect(mockCreateBugHuntPrompt).toHaveBeenCalledWith('PRD content', []);
      expect(result).toEqual(expectedResult);
    });

    it('should preserve prdContent and completedTasks fields during run', async () => {
      // SETUP
      const prdContent = '# Test PRD\n## Requirements\nSome requirements';
      const completedTasks = [
        createTestTask('P1.M1.T1', 'Task 1'),
        createTestTask('P1.M2.T1', 'Task 2'),
      ];
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          hasBugs: false,
          bugs: [],
          summary: 'No bugs',
          recommendations: [],
        }),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      await workflow.run();

      // VERIFY
      expect(workflow.prdContent).toBe(prdContent);
      expect(workflow.completedTasks).toEqual(completedTasks);
    });
  });
});
