/**
 * Unit tests for InspectCommand class
 *
 * @remarks
 * Tests validate the InspectCommand class methods including:
 * - Session discovery and loading
 * - Overview execution with various output formats
 * - Task detail execution
 * - Error handling for missing sessions, invalid task IDs
 * - Output formatting for table, json, yaml, tree formats
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  InspectCommand,
  type InspectorOptions,
} from '../../../../src/cli/commands/inspect.js';
import type {
  SessionState,
  Phase,
  Status,
} from '../../../../src/core/models.js';
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

vi.mock('../../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Mock the node:fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  mkdtempSync: vi.fn(() => '/tmp/inspect-test-XXXXXX'),
  statSync: vi.fn(() => ({
    isFile: vi.fn(() => true),
    isDirectory: vi.fn(() => true),
    mtime: new Date(),
  })),
  readdirSync: vi.fn(() => []),
}));

// Mock the SessionManager
vi.mock('../../../../src/core/session-manager.js', () => {
  const mockLoadSession = vi.fn();
  const MockedSessionManager = class {
    static async listSessions(...args: any[]) {
      return vi.mocked(MockedSessionManager).listSessions(...args);
    }
    static async findLatestSession(...args: any[]) {
      return vi.mocked(MockedSessionManager).findLatestSession(...args);
    }
    static async loadSession(...args: any[]) {
      return mockLoadSession(...args);
    }
    constructor(...args: any[]) {
      // Instance method mock
    }
  };
  MockedSessionManager.listSessions = vi.fn();
  MockedSessionManager.findLatestSession = vi.fn();
  return {
    SessionManager: MockedSessionManager,
  };
});

// Import mocked modules
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const mockExistsSync = existsSync as any;
const mockReadFileSync = readFileSync as any;
const mockReaddirSync = readdirSync as any;

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

// =============================================================================
// Test Suite
// =============================================================================

describe('InspectCommand', () => {
  let inspectCommand: InspectCommand;

  beforeEach(() => {
    inspectCommand = new InspectCommand(mockPlanDir, mockPrdPath);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default directories', () => {
      const defaultInspect = new InspectCommand();
      expect(defaultInspect).toBeDefined();
    });

    it('should create instance with custom directories', () => {
      const customInspect = new InspectCommand(
        '/custom/plan',
        '/custom/PRD.md'
      );
      expect(customInspect).toBeDefined();
    });
  });

  describe('execute', () => {
    const mockSessionState = createMockSessionState();

    beforeEach(() => {
      vi.mocked(SessionManager).listSessions.mockResolvedValue([
        mockSessionState.metadata,
      ]);
      vi.mocked(SessionManager).findLatestSession.mockResolvedValue(
        mockSessionState.metadata
      );
      vi.mocked(SessionManager).loadSession.mockResolvedValue(mockSessionState);
    });

    it('should execute overview with default options', async () => {
      const options: InspectorOptions = {
        output: 'table',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).resolves.not.toThrow();
    });

    it('should execute overview with json output format', async () => {
      const options: InspectorOptions = {
        output: 'json',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).resolves.not.toThrow();
    });

    it('should execute overview with tree output format', async () => {
      const options: InspectorOptions = {
        output: 'tree',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).resolves.not.toThrow();
    });

    it('should execute task detail with --task flag', async () => {
      const options: InspectorOptions = {
        output: 'table',
        task: 'P1.M1.T1.S1',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).resolves.not.toThrow();
    });

    it('should execute with artifacts-only filter', async () => {
      const options: InspectorOptions = {
        output: 'table',
        artifactsOnly: true,
        verbose: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).resolves.not.toThrow();
    });

    it('should execute with errors-only filter', async () => {
      const options: InspectorOptions = {
        output: 'table',
        artifactsOnly: false,
        verbose: false,
        errorsOnly: true,
      };

      await expect(inspectCommand.execute(options)).resolves.not.toThrow();
    });

    it('should throw error when no sessions found', async () => {
      vi.mocked(SessionManager).listSessions.mockResolvedValue([]);
      vi.mocked(SessionManager).findLatestSession.mockResolvedValue(null);

      const options: InspectorOptions = {
        output: 'table',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).rejects.toThrow(
        'No sessions found'
      );
    });

    it('should throw error when session not found by hash', async () => {
      vi.mocked(SessionManager).listSessions.mockResolvedValue([
        mockSessionState.metadata,
      ]);

      const options: InspectorOptions = {
        output: 'table',
        session: 'nonexistent',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).rejects.toThrow(
        'Session not found: nonexistent'
      );
    });

    it('should throw error when task not found', async () => {
      const options: InspectorOptions = {
        output: 'table',
        task: 'INVALID_TASK_ID',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).rejects.toThrow(
        'Task not found: INVALID_TASK_ID'
      );
    });

    it('should throw error when specified file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const options: InspectorOptions = {
        output: 'table',
        file: '/nonexistent/file.json',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      await expect(inspectCommand.execute(options)).rejects.toThrow(
        'File not found: /nonexistent/file.json'
      );
    });
  });

  describe('output formatting', () => {
    const mockSessionState = createMockSessionState();

    beforeEach(() => {
      vi.mocked(SessionManager).listSessions.mockResolvedValue([
        mockSessionState.metadata,
      ]);
      vi.mocked(SessionManager).findLatestSession.mockResolvedValue(
        mockSessionState.metadata
      );
      vi.mocked(SessionManager).loadSession.mockResolvedValue(mockSessionState);
    });

    it('should format output as JSON', async () => {
      const options: InspectorOptions = {
        output: 'json',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(() => JSON.parse(output)).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should format output as table', async () => {
      const options: InspectorOptions = {
        output: 'table',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('PRD Pipeline State Inspector');

      consoleSpy.mockRestore();
    });

    it('should format output as tree', async () => {
      const options: InspectorOptions = {
        output: 'tree',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Tree View');

      consoleSpy.mockRestore();
    });
  });

  describe('task detail view', () => {
    const mockSessionState = createMockSessionState();

    beforeEach(() => {
      vi.mocked(SessionManager).listSessions.mockResolvedValue([
        mockSessionState.metadata,
      ]);
      vi.mocked(SessionManager).findLatestSession.mockResolvedValue(
        mockSessionState.metadata
      );
      vi.mocked(SessionManager).loadSession.mockResolvedValue(mockSessionState);

      // Mock PRP file exists
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('prps') || path.includes('artifacts');
      });

      // Mock PRP file content
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('.md')) {
          return '# Test PRP Content\n\n## Goal\n\nTest implementation.';
        }
        return '{}';
      });
    });

    it('should display task detail for valid task ID', async () => {
      const options: InspectorOptions = {
        output: 'table',
        task: 'P1.M1.T1.S1',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Task Details: P1.M1.T1.S1');

      consoleSpy.mockRestore();
    });

    it('should show verbose PRP content when --verbose flag is set', async () => {
      const options: InspectorOptions = {
        output: 'table',
        task: 'P1.M1.T1.S1',
        verbose: true,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Test PRP Content');

      consoleSpy.mockRestore();
    });

    it('should display dependencies for subtasks', async () => {
      const options: InspectorOptions = {
        output: 'table',
        task: 'P1.M1.T1.S2',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Dependencies');

      consoleSpy.mockRestore();
    });

    it('should show artifact information when artifacts exist', async () => {
      // Mock artifact directory with files
      mockReaddirSync.mockReturnValue(['file1.ts', 'file2.ts']);

      const options: InspectorOptions = {
        output: 'table',
        task: 'P1.M1.T1.S1',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should show error information for failed tasks', async () => {
      const failedSessionState = createMockSessionState({
        taskRegistry: {
          backlog: [
            {
              id: 'P1',
              type: 'Phase',
              title: 'Phase 1',
              status: 'Failed',
              description: 'Test',
              milestones: [
                {
                  id: 'P1.M1',
                  type: 'Milestone',
                  title: 'Milestone 1',
                  status: 'Failed',
                  description: 'Test',
                  tasks: [
                    {
                      id: 'P1.M1.T1',
                      type: 'Task',
                      title: 'Task 1',
                      status: 'Failed',
                      description: 'Test',
                      subtasks: [
                        {
                          id: 'P1.M1.T1.S1',
                          type: 'Subtask',
                          title: 'Failed Subtask',
                          status: 'Failed',
                          story_points: 1,
                          dependencies: [],
                          context_scope: 'Test',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      vi.mocked(SessionManager).loadSession.mockResolvedValue(
        failedSessionState
      );

      const options: InspectorOptions = {
        output: 'table',
        task: 'P1.M1.T1.S1',
        verbose: false,
        artifactsOnly: false,
        errorsOnly: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await inspectCommand.execute(options);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Error Information');

      consoleSpy.mockRestore();
    });
  });
});
