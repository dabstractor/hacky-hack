/**
 * Unit tests for ArtifactsCommand class
 *
 * @remarks
 * Tests validate the ArtifactsCommand class methods including:
 * - Session discovery and loading
 * - List execution with various output formats
 * - View execution for artifact content display
 * - Diff execution for artifact comparison
 * - Error handling for missing sessions, invalid task IDs
 * - Output formatting for table and JSON formats
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  ArtifactsCommand,
  type ArtifactMetadata,
  type ArtifactContent,
  type ArtifactDiff,
  type ArtifactsListOptions,
  type ArtifactsViewOptions,
  type ArtifactsDiffOptions,
} from '../../../../src/cli/commands/artifacts.js';
import type { SessionState, Status } from '../../../../src/core/models.js';
import { SessionManager } from '../../../../src/core/session-manager.js';

// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the SessionManager with hoisted variables
const { mockLoadSession, mockListSessions, mockFindLatestSession } = vi.hoisted(
  () => ({
    mockLoadSession: vi.fn(),
    mockListSessions: vi.fn(),
    mockFindLatestSession: vi.fn(),
  })
);

vi.mock('../../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Mock the SessionManager
vi.mock('../../../../src/core/session-manager.js', () => {
  return {
    SessionManager: class {
      static listSessions = mockListSessions;
      static findLatestSession = mockFindLatestSession;
      async loadSession(...args: unknown[]) {
        return mockLoadSession(...args);
      }
      constructor(...args: unknown[]) {
        // Instance method mock
      }
    },
  };
});

// Import mocked modules
import { readFile, access, stat, readdir } from 'node:fs/promises';

const mockReadFile = readFile as any;
const mockAccess = access as any;
const mockStat = stat as any;
const mockReaddir = readdir as any;

// =============================================================================
// Test Constants
// =============================================================================

const mockPlanDir = '/tmp/test-plan';
const mockPrdPath = '/tmp/test-PRD.md';

// =============================================================================
// Fixture Helper Functions
// =============================================================================

function createMockSessionState(
  overrides?: Partial<SessionState>
): SessionState {
  return {
    metadata: {
      id: '001_14b9dc2a33c7',
      hash: '14b9dc2a33c7',
      path: '/tmp/test-plan/001_14b9dc2a33c7',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      parentSession: null,
    },
    prdSnapshot: '# Test PRD\n',
    taskRegistry: {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1: Foundation',
          status: 'Complete',
          description: 'Test phase',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone',
              title: 'Milestone 1',
              status: 'Complete',
              description: 'Test milestone',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task',
                  title: 'Task 1',
                  status: 'Complete',
                  description: 'Test task',
                  subtasks: [
                    {
                      id: 'P1.M1.T1.S1',
                      type: 'Subtask',
                      title: 'Subtask 1',
                      status: 'Complete',
                      story_points: 1,
                      dependencies: [],
                      context_scope: 'Test scope',
                    },
                    {
                      id: 'P1.M1.T1.S2',
                      type: 'Subtask',
                      title: 'Subtask 2',
                      status: 'Planned',
                      story_points: 2,
                      dependencies: ['P1.M1.T1.S1'],
                      context_scope: 'Test scope',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    currentItemId: 'P1.M1.T1.S2',
    ...overrides,
  };
}

function createMockArtifacts(
  sessionPath: string,
  taskId: string
): Record<string, unknown> {
  const taskDir = taskId.replace(/\./g, '_');
  return {
    [`${sessionPath}/artifacts/${taskDir}/validation-results.json`]:
      JSON.stringify([
        {
          level: 1,
          description: 'Syntax & Style validation',
          success: true,
          command: 'npm run lint',
          stdout: 'All good',
          stderr: '',
          exitCode: 0,
          skipped: false,
        },
      ]),
    [`${sessionPath}/artifacts/${taskDir}/execution-summary.md`]:
      '# Execution Summary\n\n**Status**: Success\n\n## Validation Results\n\n✓ Level 1: Syntax & Style validation - PASSED',
    [`${sessionPath}/artifacts/${taskDir}/artifacts-list.json`]: JSON.stringify(
      ['src/file1.ts', 'src/file2.ts']
    ),
  };
}

// =============================================================================
// Test Suite
// =============================================================================

describe('ArtifactsCommand', () => {
  let artifactsCommand: ArtifactsCommand;
  let mockSessionState: SessionState;

  beforeEach(() => {
    artifactsCommand = new ArtifactsCommand(mockPlanDir, mockPrdPath);
    mockSessionState = createMockSessionState();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default directories', () => {
      const defaultCommand = new ArtifactsCommand();
      expect(defaultCommand).toBeDefined();
    });

    it('should create instance with custom directories', () => {
      const customCommand = new ArtifactsCommand(
        '/custom/plan',
        '/custom/PRD.md'
      );
      expect(customCommand).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      mockListSessions.mockResolvedValue([mockSessionState.metadata]);
      mockFindLatestSession.mockResolvedValue(mockSessionState.metadata);
      mockLoadSession.mockResolvedValue(mockSessionState);

      // Mock file operations
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['P1_M1_T1_S1']);
      mockStat.mockResolvedValue({
        isDirectory: vi.fn(() => true),
        isFile: vi.fn(() => false),
        size: 100,
      });
    });

    it('should execute list action with default options', async () => {
      // Mock no artifacts directory
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const options: ArtifactsListOptions = {
        output: 'table',
      };

      await expect(
        artifactsCommand.execute('list', options)
      ).resolves.not.toThrow();
    });

    it('should execute view action with valid task ID', async () => {
      const sessionPath = mockSessionState.metadata.path;
      const mockArtifacts = createMockArtifacts(sessionPath, 'P1.M1.T1.S1');

      // Mock file reads
      mockReadFile.mockImplementation((filePath: string) => {
        if (mockArtifacts[filePath]) {
          return mockArtifacts[filePath];
        }
        throw new Error('File not found');
      });

      const options: ArtifactsViewOptions = {
        taskId: 'P1.M1.T1.S1',
        output: 'table',
      };

      await expect(
        artifactsCommand.execute('view', options)
      ).resolves.not.toThrow();
    });

    it('should execute diff action with valid task IDs', async () => {
      const sessionPath = mockSessionState.metadata.path;
      const mockArtifacts1 = createMockArtifacts(sessionPath, 'P1.M1.T1.S1');
      const mockArtifacts2 = createMockArtifacts(sessionPath, 'P1.M1.T1.S2');

      // Mock file reads
      mockReadFile.mockImplementation((filePath: string) => {
        if (mockArtifacts1[filePath]) return mockArtifacts1[filePath];
        if (mockArtifacts2[filePath]) return mockArtifacts2[filePath];
        throw new Error('File not found');
      });

      const options: ArtifactsDiffOptions = {
        task1Id: 'P1.M1.T1.S1',
        task2Id: 'P1.M1.T1.S2',
        output: 'table',
      };

      await expect(
        artifactsCommand.execute('diff', options)
      ).resolves.not.toThrow();
    });

    it('should throw error for unknown action', async () => {
      const processExitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit(1)');
        });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        await artifactsCommand.execute('unknown' as any, {} as any);
      } catch (error) {
        expect((error as Error).message).toBe('process.exit(1)');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown action')
      );

      processExitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('list subcommand', () => {
    beforeEach(() => {
      mockListSessions.mockResolvedValue([mockSessionState.metadata]);
      mockFindLatestSession.mockResolvedValue(mockSessionState.metadata);
      mockLoadSession.mockResolvedValue(mockSessionState);
    });

    it('should display message when no artifacts found', async () => {
      // Mock no artifacts directory
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const options: ArtifactsListOptions = {
        output: 'table',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('list', options);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No artifacts found')
      );

      consoleLogSpy.mockRestore();
    });

    it('should list artifacts in table format', async () => {
      // Mock file operations
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['P1_M1_T1_S1']);
      mockStat.mockResolvedValue({
        isDirectory: vi.fn(() => true),
        isFile: vi.fn(() => false),
        size: 100,
      });

      const options: ArtifactsListOptions = {
        output: 'table',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('list', options);

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should list artifacts in JSON format', async () => {
      // Mock file operations
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['P1_M1_T1_S1']);
      mockStat.mockResolvedValue({
        isDirectory: vi.fn(() => true),
        isFile: vi.fn(() => false),
        size: 100,
      });

      const options: ArtifactsListOptions = {
        output: 'json',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('list', options);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(() => JSON.parse(output)).not.toThrow();

      consoleLogSpy.mockRestore();
    });

    it('should output empty array when no artifacts found in JSON format', async () => {
      // Mock no artifacts directory
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const options: ArtifactsListOptions = {
        output: 'json',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('list', options);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);

      consoleLogSpy.mockRestore();
    });
  });

  describe('view subcommand', () => {
    beforeEach(() => {
      mockListSessions.mockResolvedValue([mockSessionState.metadata]);
      mockFindLatestSession.mockResolvedValue(mockSessionState.metadata);
      mockLoadSession.mockResolvedValue(mockSessionState);
    });

    it('should display artifact content for valid task', async () => {
      // Mock file operations
      mockAccess.mockResolvedValue(undefined);
      const sessionPath = mockSessionState.metadata.path;
      const mockArtifacts = createMockArtifacts(sessionPath, 'P1.M1.T1.S1');

      mockReadFile.mockImplementation((filePath: string) => {
        if (mockArtifacts[filePath]) return mockArtifacts[filePath];
        throw new Error('File not found');
      });

      const options: ArtifactsViewOptions = {
        taskId: 'P1.M1.T1.S1',
        output: 'table',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('view', options);

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should display message when no artifacts found for task', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const options: ArtifactsViewOptions = {
        taskId: 'P1.M1.T9.S9',
        output: 'table',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('view', options);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No artifacts found')
      );

      consoleLogSpy.mockRestore();
    });

    it('should output JSON format when requested', async () => {
      // Mock file operations
      mockAccess.mockResolvedValue(undefined);
      const sessionPath = mockSessionState.metadata.path;
      const mockArtifacts = createMockArtifacts(sessionPath, 'P1.M1.T1.S1');

      mockReadFile.mockImplementation((filePath: string) => {
        if (mockArtifacts[filePath]) return mockArtifacts[filePath];
        throw new Error('File not found');
      });

      const options: ArtifactsViewOptions = {
        taskId: 'P1.M1.T1.S1',
        output: 'json',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('view', options);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(() => JSON.parse(output)).not.toThrow();

      consoleLogSpy.mockRestore();
    });

    it('should output JSON error when no artifacts found and JSON format requested', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const options: ArtifactsViewOptions = {
        taskId: 'P1.M1.T9.S9',
        output: 'json',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('view', options);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('error', 'No artifacts found');
      expect(parsed).toHaveProperty('taskId', 'P1.M1.T9.S9');

      consoleLogSpy.mockRestore();
    });
  });

  describe('diff subcommand', () => {
    beforeEach(() => {
      mockListSessions.mockResolvedValue([mockSessionState.metadata]);
      mockFindLatestSession.mockResolvedValue(mockSessionState.metadata);
      mockLoadSession.mockResolvedValue(mockSessionState);
    });

    it('should display diff between two tasks', async () => {
      // Mock file operations
      mockAccess.mockResolvedValue(undefined);
      const sessionPath = mockSessionState.metadata.path;
      const mockArtifacts1 = createMockArtifacts(sessionPath, 'P1.M1.T1.S1');
      const mockArtifacts2 = createMockArtifacts(sessionPath, 'P1.M1.T1.S2');

      // Modify second artifacts to have different content
      mockArtifacts2[
        `${sessionPath}/artifacts/P1_M1_T1_S2/validation-results.json`
      ] = JSON.stringify([
        {
          level: 1,
          description: 'Syntax & Style validation',
          success: false,
          command: 'npm run lint',
          stdout: '',
          stderr: 'Lint errors found',
          exitCode: 1,
          skipped: false,
        },
      ]);

      mockReadFile.mockImplementation((filePath: string) => {
        if (mockArtifacts1[filePath]) return mockArtifacts1[filePath];
        if (mockArtifacts2[filePath]) return mockArtifacts2[filePath];
        throw new Error('File not found');
      });

      const options: ArtifactsDiffOptions = {
        task1Id: 'P1.M1.T1.S1',
        task2Id: 'P1.M1.T1.S2',
        output: 'table',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('diff', options);

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should display message when first task has no artifacts', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const options: ArtifactsDiffOptions = {
        task1Id: 'P1.M1.T9.S9',
        task2Id: 'P1.M1.T1.S1',
        output: 'table',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('diff', options);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No artifacts found')
      );

      consoleLogSpy.mockRestore();
    });

    it('should output JSON format when requested', async () => {
      // Mock file operations
      mockAccess.mockResolvedValue(undefined);
      const sessionPath = mockSessionState.metadata.path;
      const mockArtifacts1 = createMockArtifacts(sessionPath, 'P1.M1.T1.S1');
      const mockArtifacts2 = createMockArtifacts(sessionPath, 'P1.M1.T1.S2');

      mockReadFile.mockImplementation((filePath: string) => {
        if (mockArtifacts1[filePath]) return mockArtifacts1[filePath];
        if (mockArtifacts2[filePath]) return mockArtifacts2[filePath];
        throw new Error('File not found');
      });

      const options: ArtifactsDiffOptions = {
        task1Id: 'P1.M1.T1.S1',
        task2Id: 'P1.M1.T1.S2',
        output: 'json',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('diff', options);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(() => JSON.parse(output)).not.toThrow();

      consoleLogSpy.mockRestore();
    });

    it('should output JSON error when first task has no artifacts and JSON format requested', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const options: ArtifactsDiffOptions = {
        task1Id: 'P1.M1.T9.S9',
        task2Id: 'P1.M1.T1.S1',
        output: 'json',
      };

      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await artifactsCommand.execute('diff', options);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('error', 'No artifacts found');

      consoleLogSpy.mockRestore();
    });
  });
});
