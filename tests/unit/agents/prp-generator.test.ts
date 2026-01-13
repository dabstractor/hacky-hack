/**
 * Unit tests for PRPGenerator class
 *
 * @remarks
 * Tests validate PRPGenerator class from src/agents/prp-generator.ts with comprehensive
 * coverage of happy path, retry scenarios, and error handling.
 *
 * Mocks are used for all external dependencies - no real I/O or LLM calls are performed.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PRPGenerator,
  PRPGenerationError,
  PRPFileError,
} from '../../../src/agents/prp-generator.js';
import type { SessionManager } from '../../../src/core/session-manager.js';
import type {
  PRPDocument,
  Backlog,
  Subtask,
} from '../../../src/core/models.js';

// Mock the agent-factory module
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createResearcherAgent: vi.fn(),
}));

// Mock the prp-blueprint-prompt module
vi.mock('../../../src/agents/prompts/prp-blueprint-prompt.js', () => ({
  createPRPBlueprintPrompt: vi.fn(),
}));

// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

// Import mocked modules
import { createResearcherAgent } from '../../../src/agents/agent-factory.js';
import { createPRPBlueprintPrompt } from '../../../src/agents/prompts/prp-blueprint-prompt.js';
import { mkdir, writeFile } from 'node:fs/promises';

// Cast mocked functions
const mockCreateResearcherAgent = createResearcherAgent as any;
const mockCreatePRPBlueprintPrompt = createPRPBlueprintPrompt as any;
const mockMkdir = mkdir as any;
const mockWriteFile = writeFile as any;

// Factory functions for test data
const createMockSessionManager = (sessionPath: string): SessionManager => {
  return {
    currentSession: {
      metadata: {
        id: '001_14b9dc2a33c7',
        hash: '14b9dc2a33c7',
        path: sessionPath,
        createdAt: new Date(),
        parentSession: null,
      },
      prdSnapshot: '# PRD Content',
      taskRegistry: { backlog: [] },
      currentItemId: null,
    },
  } as SessionManager;
};

const createMockSubtask = (id: string, title: string): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status: 'Planned',
  story_points: 3,
  dependencies: [],
  context_scope: 'Implement the feature',
});

const createMockBacklog = (): Backlog => ({
  backlog: [],
});

const createMockPRPDocument = (taskId: string): PRPDocument => ({
  taskId,
  objective: 'Implement feature X',
  context: '## Context\nFull context here',
  implementationSteps: ['Step 1: Create file', 'Step 2: Implement logic'],
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
      description: 'Manual review',
      command: null,
      manual: true,
    },
  ],
  successCriteria: [
    { description: 'Feature works as expected', satisfied: false },
    { description: 'Tests pass', satisfied: false },
  ],
  references: ['https://example.com/docs'],
});

const createMockAgent = () => ({
  prompt: vi.fn(),
});

describe('agents/prp-generator', () => {
  const sessionPath = '/tmp/test-session';
  let mockSessionManager: SessionManager;
  let mockAgent: ReturnType<typeof createMockAgent>;

  beforeEach(() => {
    // Setup mock session manager
    mockSessionManager = createMockSessionManager(sessionPath);

    // Setup mock agent
    mockAgent = createMockAgent();
    mockCreateResearcherAgent.mockReturnValue(mockAgent);

    // Setup mock prompt
    const mockPrompt = { system: 'system', user: 'user', responseFormat: {} };
    mockCreatePRPBlueprintPrompt.mockReturnValue(mockPrompt);

    // Setup file system mocks
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create PRPGenerator with session path', () => {
      // EXECUTE
      const generator = new PRPGenerator(mockSessionManager);

      // VERIFY: Session manager and path are set
      expect(generator.sessionManager).toBe(mockSessionManager);
      expect(generator.sessionPath).toBe(sessionPath);
    });

    it('should cache Researcher Agent in constructor', () => {
      // EXECUTE
      new PRPGenerator(mockSessionManager);

      // VERIFY: createResearcherAgent was called once
      expect(mockCreateResearcherAgent).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no active session', () => {
      // SETUP: Session manager with null current session
      const emptySessionManager = { currentSession: null } as SessionManager;

      // EXECUTE & VERIFY: Constructor throws
      expect(() => new PRPGenerator(emptySessionManager)).toThrow(
        'Cannot create PRPGenerator: no active session'
      );
    });
  });

  describe('generate', () => {
    it('should successfully generate PRP on first attempt', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S2', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      mockAgent.prompt.mockResolvedValue(mockPRP);

      const generator = new PRPGenerator(mockSessionManager);

      // EXECUTE
      const result = await generator.generate(task, backlog);

      // VERIFY: PRP document is returned
      expect(result).toEqual(mockPRP);
      expect(result.taskId).toBe(task.id);

      // VERIFY: Prompt was created with correct parameters
      expect(mockCreatePRPBlueprintPrompt).toHaveBeenCalledWith(
        task,
        backlog,
        expect.stringContaining('hacky-hack')
      );

      // VERIFY: Agent was called once
      expect(mockAgent.prompt).toHaveBeenCalledTimes(1);

      // VERIFY: File was written
      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('prps'), {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('should write PRP file with correct filename', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S2', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      mockAgent.prompt.mockResolvedValue(mockPRP);

      const generator = new PRPGenerator(mockSessionManager);

      // EXECUTE
      await generator.generate(task, backlog);

      // VERIFY: File was written with sanitized filename (dots replaced with underscores)
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringMatching(/P1_M2_T2_S2\.md$/),
        expect.stringContaining('# PRP for P1.M2.T2.S2'),
        { mode: 0o644 }
      );
    });

    it('should retry on failure and succeed on second attempt', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S1', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      // First attempt fails, second succeeds
      mockAgent.prompt
        .mockRejectedValueOnce(new Error('LLM timeout'))
        .mockResolvedValueOnce(mockPRP);

      const generator = new PRPGenerator(mockSessionManager);

      // EXECUTE
      const result = await generator.generate(task, backlog);

      // VERIFY: PRP is returned after retry
      expect(result).toEqual(mockPRP);

      // VERIFY: Agent was called twice (failed once, succeeded once)
      expect(mockAgent.prompt).toHaveBeenCalledTimes(2);

      // VERIFY: File was written
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it(
      'should throw PRPGenerationError after max retries exhausted',
      async () => {
        // SETUP
        const task = createMockSubtask('P1.M2.T2.S1', 'Test Subtask');
        const backlog = createMockBacklog();

        // All attempts fail
        mockAgent.prompt.mockRejectedValue(new Error('LLM service down'));

        const generator = new PRPGenerator(mockSessionManager);

        // EXECUTE & VERIFY
        await expect(generator.generate(task, backlog)).rejects.toThrow(
          PRPGenerationError
        );

        // VERIFY: Agent was called 3 times (max retries)
        expect(mockAgent.prompt).toHaveBeenCalledTimes(3);

        // VERIFY: Error contains task ID and attempt count
        try {
          await generator.generate(task, backlog);
        } catch (error) {
          expect(error).toBeInstanceOf(PRPGenerationError);
          const prpError = error as PRPGenerationError;
          expect(prpError.taskId).toBe(task.id);
          expect(prpError.attempt).toBe(3);
        }
      },
      { timeout: 10000 }
    );

    it('should use exponential backoff for retries', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S1', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      // Fail twice, succeed on third
      mockAgent.prompt
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(mockPRP);

      const generator = new PRPGenerator(mockSessionManager);
      const startTime = Date.now();

      // EXECUTE
      await generator.generate(task, backlog);

      const elapsedTime = Date.now() - startTime;

      // VERIFY: Delay was applied (exponential backoff: 1s + 2s = 3s minimum)
      // Allow some tolerance for test execution time
      expect(elapsedTime).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('PRPGenerationError', () => {
    it('should create error with correct properties', () => {
      // EXECUTE
      const originalError = new Error('LLM failed');
      const error = new PRPGenerationError('P1.M2.T2.S1', 3, originalError);

      // VERIFY: Error has correct properties
      expect(error.name).toBe('PRPGenerationError');
      expect(error.taskId).toBe('P1.M2.T2.S1');
      expect(error.attempt).toBe(3);
      expect(error.message).toContain('P1.M2.T2.S1');
      expect(error.message).toContain('3');
      expect(error.message).toContain('LLM failed');
    });
  });

  describe('PRPFileError', () => {
    it('should create error with correct properties', () => {
      // EXECUTE
      const originalError = new Error('EACCES: permission denied');
      const error = new PRPFileError(
        'P1.M2.T2.S1',
        '/tmp/test-session/prps/P1M2T2S1.md',
        originalError
      );

      // VERIFY: Error has correct properties
      expect(error.name).toBe('PRPFileError');
      expect(error.taskId).toBe('P1.M2.T2.S1');
      expect(error.filePath).toBe('/tmp/test-session/prps/P1M2T2S1.md');
      expect(error.message).toContain('P1.M2.T2.S1');
      expect(error.message).toContain('/tmp/test-session/prps/P1M2T2S1.md');
      expect(error.message).toContain('permission denied');
    });
  });

  describe('PRP markdown formatting', () => {
    it('should format PRP as valid markdown', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S2', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      mockAgent.prompt.mockResolvedValue(mockPRP);

      const generator = new PRPGenerator(mockSessionManager);

      // EXECUTE
      await generator.generate(task, backlog);

      // VERIFY: File content contains all required sections
      const writeCall = mockWriteFile.mock.calls[0];
      const markdownContent = writeCall[1];

      expect(markdownContent).toContain('# PRP for P1.M2.T2.S2');
      expect(markdownContent).toContain('## Objective');
      expect(markdownContent).toContain('Implement feature X');
      expect(markdownContent).toContain('## Context');
      expect(markdownContent).toContain('## Implementation Steps');
      expect(markdownContent).toContain('1. Step 1: Create file');
      expect(markdownContent).toContain('2. Step 2: Implement logic');
      expect(markdownContent).toContain('## Validation Gates');
      expect(markdownContent).toContain('### Level 1: 1');
      expect(markdownContent).toContain('npm run lint');
      expect(markdownContent).toContain('## Success Criteria');
      expect(markdownContent).toContain('- [ ] Feature works as expected');
      expect(markdownContent).toContain('## References');
    });

    it('should handle null command for manual validation levels', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S2', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      mockAgent.prompt.mockResolvedValue(mockPRP);

      const generator = new PRPGenerator(mockSessionManager);

      // EXECUTE
      await generator.generate(task, backlog);

      // VERIFY: Manual validation level shows "Manual validation required"
      const writeCall = mockWriteFile.mock.calls[0];
      const markdownContent = writeCall[1];

      expect(markdownContent).toContain('Manual validation required');
    });
  });

  describe('file write errors', () => {
    it('should throw PRPFileError when mkdir fails', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S2', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      mockAgent.prompt.mockResolvedValue(mockPRP);
      mockMkdir.mockRejectedValue(new Error('EACCES: permission denied'));

      const generator = new PRPGenerator(mockSessionManager);

      // EXECUTE & VERIFY
      await expect(generator.generate(task, backlog)).rejects.toThrow(
        PRPFileError
      );
    });

    it('should throw PRPFileError when writeFile fails', async () => {
      // SETUP
      const task = createMockSubtask('P1.M2.T2.S2', 'Test Subtask');
      const backlog = createMockBacklog();
      const mockPRP = createMockPRPDocument(task.id);

      mockAgent.prompt.mockResolvedValue(mockPRP);
      mockWriteFile.mockRejectedValue(new Error('ENOSPC: no space left'));

      const generator = new PRPGenerator(mockSessionManager);

      // EXECUTE & VERIFY
      await expect(generator.generate(task, backlog)).rejects.toThrow(
        PRPFileError
      );
    });
  });
});
