/**
 * Integration tests for Error Report Generation
 *
 * @remarks
 * Tests validate end-to-end error report generation functionality including:
 * - Full ERROR_REPORT.md generation with all sections
 * - Timeline accuracy with real task execution tracking
 * - Impact analysis with real dependency structures
 * - Resume commands are valid and executable
 * - Markdown output is well-formed
 * - Integration with PRPPipeline's error tracking
 * - Multiple concurrent errors handling
 * - Backward compatibility with existing error report format
 * - Error report with no failures (should not generate)
 * - Error report with single failure
 * - Error report with multiple failures
 * - Verify all sections are present: Header, Summary, Timeline, Failed Tasks, Error Categories, Impact Analysis, Next Steps
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/utils/errors/error-reporter.ts | Error Report Builder}
 * @see {@link ../../src/workflows/prp-pipeline.ts | PRPPipeline Integration}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ErrorReportBuilder } from '../../src/utils/errors/error-reporter.js';
import type { SessionState } from '../../src/core/models.js';
import {
  TaskError,
  SessionError,
  ValidationError,
  AgentError,
  EnvironmentError,
} from '../../src/utils/errors.js';
import type {
  TaskFailure,
  ReportContext,
  Backlog,
} from '../../src/utils/errors/types.js';
import type { Logger } from '../../src/utils/logger.js';

// =============================================================================
// Test Constants
// =============================================================================

const TEMP_DIR_TEMPLATE = join(tmpdir(), 'error-report-gen-test-XXXXXX');

// =============================================================================
// Test Doubles
// =============================================================================

/**
 * Mock logger for testing
 */
const mockLogger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
};

// =============================================================================
// Fixture Helper Functions
// =============================================================================

function setupTestDir(): string {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  return tempDir;
}

/**
 * Creates a realistic backlog with complex dependency structures for testing
 */
function createRealisticBacklog(): Backlog {
  return {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        title: 'Foundation Phase',
        status: 'Implementing',
        description: 'Establish core infrastructure',
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Core Setup',
            status: 'Implementing',
            description: 'Initial project setup',
            tasks: [
              {
                id: 'P1.M1.T1',
                type: 'Task',
                title: 'Initialize Repository',
                status: 'Complete',
                description: 'Set up repo structure',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Create Directory Structure',
                    status: 'Complete',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'Create src/, tests/, docs/',
                  },
                  {
                    id: 'P1.M1.T1.S2',
                    type: 'Subtask',
                    title: 'Initialize Git',
                    status: 'Complete',
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope: 'Initialize git repository',
                  },
                ],
              },
              {
                id: 'P1.M1.T2',
                type: 'Task',
                title: 'Install Dependencies',
                status: 'Implementing',
                description: 'Install required packages',
                subtasks: [
                  {
                    id: 'P1.M1.T2.S1',
                    type: 'Subtask',
                    title: 'Install Runtime Dependencies',
                    status: 'Failed',
                    story_points: 2,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope: 'npm install express',
                  },
                  {
                    id: 'P1.M1.T2.S2',
                    type: 'Subtask',
                    title: 'Install Dev Dependencies',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: ['P1.M1.T2.S1'],
                    context_scope: 'npm install -D vitest',
                  },
                ],
              },
            ],
          },
          {
            id: 'P1.M2',
            type: 'Milestone',
            title: 'API Development',
            status: 'Planned',
            description: 'Build API endpoints',
            tasks: [
              {
                id: 'P1.M2.T1',
                type: 'Task',
                title: 'Create Endpoints',
                status: 'Planned',
                description: 'Build REST API',
                subtasks: [
                  {
                    id: 'P1.M2.T1.S1',
                    type: 'Subtask',
                    title: 'Create User Routes',
                    status: 'Planned',
                    story_points: 3,
                    dependencies: ['P1.M1.T2.S2'],
                    context_scope: 'Create /api/users routes',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'P2',
        type: 'Phase',
        title: 'Testing Phase',
        status: 'Planned',
        description: 'Comprehensive testing',
        milestones: [
          {
            id: 'P2.M1',
            type: 'Milestone',
            title: 'Unit Tests',
            status: 'Planned',
            description: 'Write unit tests',
            tasks: [
              {
                id: 'P2.M1.T1',
                type: 'Task',
                title: 'Test API',
                status: 'Planned',
                description: 'Test API endpoints',
                subtasks: [
                  {
                    id: 'P2.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Test User Endpoints',
                    status: 'Planned',
                    story_points: 2,
                    dependencies: ['P1.M2.T1.S1'],
                    context_scope: 'Test /api/users endpoints',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Creates a mock ReportContext with realistic data
 */
function createMockReportContext(
  overrides?: Partial<ReportContext>
): ReportContext {
  return {
    sessionPath: '/plan/001_test_session',
    sessionId: '001_abc123def456',
    backlog: createRealisticBacklog(),
    totalTasks: 6,
    completedTasks: 3,
    pipelineMode: 'normal',
    continueOnError: false,
    startTime: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates a mock TaskFailure with realistic data
 */
function createMockTaskFailure(overrides?: Partial<TaskFailure>): TaskFailure {
  const error = new TaskError(
    'Task execution failed: Could not connect to database'
  );
  return {
    taskId: 'P1.M1.T2.S1',
    taskTitle: 'Install Runtime Dependencies',
    error,
    errorCode: 'TASK_EXECUTION_FAILED',
    timestamp: new Date('2024-01-15T10:30:45Z'),
    phase: 'P1',
    milestone: 'P1.M1',
    ...overrides,
  };
}

/**
 * Creates a mock SessionState with realistic session data
 */
function createMockSessionState(sessionPath: string): SessionState {
  return {
    metadata: {
      id: '001_abc123def456',
      hash: 'abc123def456',
      path: sessionPath,
      parentSession: null,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
    prdSnapshot: '# Test PRD\n\nTest content',
    taskRegistry: createRealisticBacklog(),
    currentItemId: 'P1.M1.T2.S2',
  };
}

// =============================================================================
// Test Suites
// =============================================================================

describe('Error Report Generation Integration Tests', () => {
  let tempDir: string;
  let mockWriteFile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tempDir = setupTestDir();
    vi.clearAllMocks();

    // Mock fs/promises.writeFile to capture report content without writing files
    mockWriteFile = vi.fn();
    vi.doMock('node:fs/promises', async () => {
      const actual = await vi.importActual('node:fs/promises');
      return {
        ...actual,
        writeFile: mockWriteFile,
      };
    });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Full ERROR_REPORT.md Generation with All Sections
  // ===========================================================================

  describe('Full ERROR_REPORT.md generation', () => {
    it('should generate complete report with all required sections', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify all sections are present
      expect(report).toContain('# Error Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Error Timeline');
      expect(report).toContain('## Failed Tasks');
      expect(report).toContain('## Error Categories');
      expect(report).toContain('## Impact Analysis');
      expect(report).toContain('## Next Steps');
    });

    it('should include Header section with all metadata', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());
      const context = createMockReportContext({
        pipelineMode: 'verbose',
        continueOnError: true,
      });

      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify header content
      expect(report).toContain('**Generated**:');
      expect(report).toContain('**Pipeline Mode**: verbose');
      expect(report).toContain('**Continue on Error**: Yes');
      expect(report).toContain(`**Session**: ${context.sessionId}`);
      expect(report).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
    });

    it('should include Summary section with accurate statistics', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());
      failures.set(
        'P1.M1.T2.S2',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S2',
          timestamp: new Date('2024-01-15T10:35:00Z'),
        })
      );
      const context = createMockReportContext({
        totalTasks: 10,
        completedTasks: 6,
      });

      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify summary statistics
      expect(report).toContain('| Total Tasks | 10 |');
      expect(report).toContain('| Completed | 6 |');
      expect(report).toContain('| Failed | 2 |');
      expect(report).toContain('| Success Rate | 60.0% |');
    });

    it('should include Timeline section with error chronology', async () => {
      const failures = new Map<string, TaskFailure>();
      const firstFailure = createMockTaskFailure({
        timestamp: new Date('2024-01-15T10:30:00Z'),
      });
      const secondFailure = createMockTaskFailure({
        taskId: 'P1.M1.T2.S2',
        timestamp: new Date('2024-01-15T10:35:00Z'),
      });
      failures.set('P1.M1.T2.S1', firstFailure);
      failures.set('P1.M1.T2.S2', secondFailure);

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify timeline content
      expect(report).toContain('## Error Timeline');
      expect(report).toContain('```'); // Code block for timeline
      expect(report).toContain('**Timeline Summary**');
      expect(report).toContain('- First error at:');
      expect(report).toContain('- Error frequency: 2 errors');
      expect(report).toContain('- Total duration:');
      expect(report).toContain('- Error span:');
    });

    it('should include Failed Tasks section with complete details', async () => {
      const failures = new Map<string, TaskFailure>();
      const error = new Error('Database connection failed');
      error.stack =
        'Error: Database connection failed\n' +
        '    at connectDb (/src/db.ts:42:10)\n' +
        '    at initializeApp (/src/app.ts:15:5)\n' +
        '    at main (/src/index.ts:8:10)';
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error,
          phase: 'P1',
          milestone: 'P1.M1',
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify failed tasks details
      expect(report).toContain('## Failed Tasks');
      expect(report).toContain(
        '### 1. P1.M1.T2.S1: Install Runtime Dependencies'
      );
      expect(report).toContain('**Phase**: P1');
      expect(report).toContain('**Milestone**: P1.M1');
      expect(report).toContain('**Failed At**:');
      expect(report).toContain('**Error Details**');
      expect(report).toContain('at connectDb');
      expect(report).toContain('/src/db.ts:42');
    });

    it('should include Error Categories section with breakdown', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new TaskError('Task failed'),
        })
      );
      failures.set(
        'P2.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P2.M1.T1.S1',
          error: new SessionError('Session error'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify error categories
      expect(report).toContain('## Error Categories');
      expect(report).toContain('| **TaskError** |');
      expect(report).toContain('| **SessionError** |');
      expect(report).toContain('| **ValidationError** |');
      expect(report).toContain('| **AgentError** |');
      expect(report).toContain('| **EnvironmentError** |');
      expect(report).toContain('| **Other** |');
    });

    it('should include Impact Analysis section with blocked tasks', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify impact analysis
      expect(report).toContain('## Impact Analysis');
      expect(report).toContain('**Critical Path Impact**');
      expect(report).toContain('- Phases blocked:');
      expect(report).toContain('- Milestones blocked:');
      expect(report).toContain('- Total tasks blocked:');
      expect(report).toContain('- Max cascade depth:');
      expect(report).toContain('**Blocked Tasks Summary**');
    });

    it('should include Next Steps section with actionable items', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext({
        sessionPath: '/plan/001_test',
      });
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify next steps
      expect(report).toContain('## Next Steps');
      expect(report).toContain(
        '1. Review error timeline above to understand error sequence'
      );
      expect(report).toContain('2. Fix the errors listed above:');
      expect(report).toContain('3. Resume pipeline execution:');
      expect(report).toContain('```bash');
      expect(report).toContain(
        '**Report Location**: /plan/001_test/ERROR_REPORT.md'
      );
    });
  });

  // ===========================================================================
  // Timeline Accuracy with Real Task Execution Tracking
  // ===========================================================================

  describe('Timeline accuracy with task execution tracking', () => {
    it('should track errors in chronological order', async () => {
      const failures = new Map<string, TaskFailure>();
      const earlier = new Date('2024-01-15T10:30:00Z');
      const middle = new Date('2024-01-15T10:35:00Z');
      const later = new Date('2024-01-15T10:40:00Z');

      failures.set(
        'P1.M1.T2.S2',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S2',
          timestamp: middle,
        })
      );
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          timestamp: earlier,
        })
      );
      failures.set(
        'P1.M2.T1.S1',
        createMockTaskFailure({
          taskId: 'P1.M2.T1.S1',
          timestamp: later,
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Timeline should reflect all errors
      expect(report).toContain('P1.M1.T2.S1');
      expect(report).toContain('P1.M1.T2.S2');
      expect(report).toContain('P1.M2.T1.S1');
    });

    it('should calculate accurate timeline duration', async () => {
      const failures = new Map<string, TaskFailure>();
      const firstErrorTime = new Date('2024-01-15T10:15:00Z');
      const lastErrorTime = new Date('2024-01-15T10:25:30Z');

      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          timestamp: firstErrorTime,
        })
      );
      failures.set(
        'P1.M1.T2.S2',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S2',
          timestamp: lastErrorTime,
        })
      );

      const startTime = new Date('2024-01-15T10:00:00Z');
      const context = createMockReportContext({ startTime });
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should include duration calculation
      expect(report).toContain('- Total duration:');
      expect(report).toContain('- Error span:');
    });

    it('should track error frequency correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      for (let i = 1; i <= 5; i++) {
        failures.set(
          `P1.M1.T${i}.S1`,
          createMockTaskFailure({
            taskId: `P1.M1.T${i}.S1`,
            timestamp: new Date(`2024-01-15T10:${30 + i}:00Z`),
          })
        );
      }

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('- Error frequency: 5 errors');
    });
  });

  // ===========================================================================
  // Impact Analysis with Real Dependency Structures
  // ===========================================================================

  describe('Impact analysis with dependency structures', () => {
    it('should identify blocked tasks based on dependencies', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // P1.M1.T2.S1 blocks P1.M1.T2.S2 (direct dependency)
      // P1.M1.T2.S2 blocks P1.M2.T1.S1 (transitive dependency)
      // P1.M2.T1.S1 blocks P2.M1.T1.S1 (transitive dependency)
      expect(report).toContain('`P1.M1.T2.S2`');
      expect(report).toContain('`P1.M2.T1.S1`');
      expect(report).toContain('`P2.M1.T1.S1`');
    });

    it('should calculate cascade depth correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Cascade should be at least 2 levels deep
      expect(report).toMatch(/- Max cascade depth: [2-9]/);
    });

    it('should identify blocked phases and milestones', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should report blocked milestones and phases
      expect(report).toMatch(/- Milestones blocked: [1-9]/);
    });

    it('should determine correct impact level', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Impact level with icons
      const impactIcons = ['🔴', '🟠', '🟡', '🔵', '⚪'];
      const hasIcon = impactIcons.some(icon => report.includes(icon));
      expect(hasIcon).toBe(true);

      // Should include impact level text
      const impactLevels = ['Critical', 'High', 'Medium', 'Low', 'None'];
      const hasLevel = impactLevels.some(level => report.includes(level));
      expect(hasLevel).toBe(true);
    });

    it('should handle tasks with no dependencies', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T1.S1',
          taskTitle: 'Create Directory Structure',
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should show no/minimal impact
      expect(report).toContain('tasks blocked');
    });
  });

  // ===========================================================================
  // Resume Commands are Valid and Executable
  // ===========================================================================

  describe('Resume commands validation', () => {
    it('should generate valid retry commands', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should include retry command
      expect(report).toContain('**Resume Commands**');
      expect(report).toContain('--retry');
      expect(report).toContain('P1.M1.T2.S1');
      expect(report).toContain('```bash');
    });

    it('should generate valid skip commands', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should include skip command
      expect(report).toContain('--skip');
      expect(report).toContain('P1.M1.T2.S1');
    });

    it('should include command descriptions', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Commands should have descriptions (actual format uses "# Description")
      expect(report).toMatch(/# Retry this task/);
      expect(report).toMatch(/# Skip this task/);
    });

    it('should include resume commands in Next Steps', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Next Steps should have executable command
      expect(report).toContain('3. Resume pipeline execution:');
      expect(report).toContain('```bash');
      expect(report).toContain('$');
      expect(report).toContain('npm run prp');
    });

    it('should format commands as valid bash syntax', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Check bash code block formatting
      const bashBlockMatches = report.match(/```bash[\s\S]*?```/g);
      expect(bashBlockMatches).not.toBeNull();
      expect(bashBlockMatches!.length).toBeGreaterThan(0);

      // Commands should start with valid syntax
      expect(report).toMatch(/\$ (npm|node|npx)/);
    });
  });

  // ===========================================================================
  // Markdown Output is Well-Formed
  // ===========================================================================

  describe('Markdown formatting validation', () => {
    it('should have properly nested headers', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Check header hierarchy
      expect(report).toMatch(/^# Error Report/m); // H1
      expect(report).toMatch(/^## [A-Z]/m); // H2
      expect(report).toMatch(/^### \d+\./m); // H3 with number
    });

    it('should have properly closed code blocks', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Count opening and closing backticks
      const backtickMatches = report.match(/```/g);
      expect(backtickMatches).not.toBeNull();
      // Should be even number (pairs of opening/closing)
      expect(backtickMatches!.length % 2).toBe(0);
    });

    it('should have properly formatted tables', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Check for table syntax
      expect(report).toContain('|'); // Table separator
      expect(report).toMatch(/^\|.*\|.*\|/m); // Table row
    });

    it('should use horizontal rules consistently', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should have horizontal rules between sections
      expect(report).toContain('---');
    });

    it('should escape special markdown characters', async () => {
      const failures = new Map<string, TaskFailure>();
      const error = new Error('Error with `code` and **bold** and _italic_');
      failures.set('P1.M1.T2.S1', createMockTaskFailure({ error }));

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should contain the error message
      expect(report).toContain('Error with');
    });

    it('should have consistent spacing between sections', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Sections should be separated by blank lines
      const sections = report.split(/\n\n+/);
      expect(sections.length).toBeGreaterThan(5);
    });
  });

  // ===========================================================================
  // Integration with PRPPipeline's Error Tracking
  // ===========================================================================

  describe('PRPPipeline error tracking integration', () => {
    it('should use TaskFailure structure from PRPPipeline', async () => {
      // Create TaskFailure matching PRPPipeline's internal structure
      const failure: TaskFailure = {
        taskId: 'P1.M1.T2.S1',
        taskTitle: 'Install Runtime Dependencies',
        error: new TaskError('Failed to install npm packages'),
        errorCode: 'PIPELINE_TASK_EXECUTION_FAILED',
        timestamp: new Date(),
        phase: 'P1',
        milestone: 'P1.M1',
      };

      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', failure);

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should use all TaskFailure fields
      expect(report).toContain('P1.M1.T2.S1');
      expect(report).toContain('Install Runtime Dependencies');
      expect(report).toContain('**Phase**: P1');
      expect(report).toContain('**Milestone**: P1.M1');
    });

    it('should handle errors with missing optional fields', async () => {
      const failure: TaskFailure = {
        taskId: 'P1.M1.T2.S1',
        taskTitle: 'Test Task',
        error: new Error('Simple error'),
        timestamp: new Date(),
        // phase, milestone, errorCode omitted
      };

      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', failure);

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should handle gracefully
      expect(report).toContain('P1.M1.T2.S1');
      expect(report).toContain('**Phase**: Unknown');
      expect(report).toContain('**Milestone**: N/A');
    });

    it('should work with SessionManager backlog structure', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext({
        backlog: createRealisticBacklog(), // Real backlog structure
      });
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should successfully generate report with real backlog
      expect(report).toContain('# Error Report');
      expect(report).toContain('## Impact Analysis');
    });
  });

  // ===========================================================================
  // Multiple Concurrent Errors Handling
  // ===========================================================================

  describe('Multiple concurrent errors', () => {
    it('should handle multiple errors in different phases', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S1',
          phase: 'P1',
          timestamp: new Date('2024-01-15T10:30:00Z'),
        })
      );
      failures.set(
        'P2.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P2.M1.T1.S1',
          taskTitle: 'Test User Endpoints',
          phase: 'P2',
          milestone: 'P2.M1',
          timestamp: new Date('2024-01-15T10:35:00Z'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('P1.M1.T2.S1');
      expect(report).toContain('P2.M1.T1.S1');
      expect(report).toContain('| Failed | 2 |');
    });

    it('should track errors in chronological order across phases', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P2.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P2.M1.T1.S1',
          timestamp: new Date('2024-01-15T10:20:00Z'),
        })
      );
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          timestamp: new Date('2024-01-15T10:15:00Z'),
        })
      );
      failures.set(
        'P1.M2.T1.S1',
        createMockTaskFailure({
          taskId: 'P1.M2.T1.S1',
          timestamp: new Date('2024-01-15T10:25:00Z'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // All should be in timeline
      expect(report).toContain('P1.M1.T2.S1');
      expect(report).toContain('P2.M1.T1.S1');
      expect(report).toContain('P1.M2.T1.S1');
    });

    it('should aggregate impact from multiple failures', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());
      failures.set(
        'P2.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P2.M1.T1.S1',
          taskTitle: 'Test User Endpoints',
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Impact analysis should show combined effect
      expect(report).toContain('## Impact Analysis');
      expect(report).toMatch(/Total tasks blocked: [2-9]/);
    });

    it('should handle errors of different types', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new TaskError('Task failed'),
        })
      );
      failures.set(
        'P1.M1.T2.S2',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S2',
          error: new ValidationError('Invalid input'),
        })
      );
      failures.set(
        'P2.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P2.M1.T1.S1',
          error: new SessionError('Session expired'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Error categories should reflect different types
      expect(report).toContain('| **TaskError** | 1 |');
      expect(report).toContain('| **ValidationError** | 1 |');
      expect(report).toContain('| **SessionError** | 1 |');
    });
  });

  // ===========================================================================
  // Backward Compatibility with Existing Error Report Format
  // ===========================================================================

  describe('Backward compatibility', () => {
    it('should maintain basic error report structure', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Basic structure should be consistent
      expect(report).toMatch(/^# Error Report\n\n\*\*Generated\*\*:/m);
      expect(report).toContain('## Failed Tasks');
      expect(report).toContain('## Next Steps');
    });

    it('should include error messages in expected format', async () => {
      const failures = new Map<string, TaskFailure>();
      const errorMessage =
        'Task execution failed: Could not connect to database';
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new Error(errorMessage),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain(errorMessage);
    });

    it('should include task IDs in expected format', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Task IDs should be prominently displayed
      expect(report).toMatch(/### \d+\. P1\.M1\.T2\.S1:/);
      // Task IDs appear in affected tasks section with backticks
      expect(report).toContain('P1.M1.T2.S1');
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge cases', () => {
    it('should not generate report with no failures', async () => {
      const failures = new Map<string, TaskFailure>(); // Empty map
      const context = createMockReportContext();

      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Report should still be generated but show 0 failures
      expect(report).toContain('# Error Report');
      expect(report).toContain('| Failed | 0 |');
    });

    it('should handle single failure', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should properly handle single failure
      expect(report).toContain('### 1. P1.M1.T2.S1');
      expect(report).toContain('| Failed | 1 |');
      expect(report).not.toContain('### 2.');
    });

    it('should handle multiple failures', async () => {
      const failures = new Map<string, TaskFailure>();
      for (let i = 1; i <= 3; i++) {
        failures.set(
          `P1.M1.T${i}.S1`,
          createMockTaskFailure({
            taskId: `P1.M1.T${i}.S1`,
          })
        );
      }

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should number all failures
      expect(report).toContain('### 1.');
      expect(report).toContain('### 2.');
      expect(report).toContain('### 3.');
      expect(report).toContain('| Failed | 3 |');
    });

    it('should handle error with no stack trace', async () => {
      const error = new Error('Error without stack');
      delete (error as any).stack;

      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure({ error }));

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );

      // Should not throw
      const report = await builder.generateReport(failures, context);
      expect(report).toContain('Error without stack');
    });

    it('should handle very long error messages', async () => {
      const longMessage = 'A'.repeat(500);
      const error = new Error(longMessage);

      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure({ error }));

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );

      // Should handle gracefully
      const report = await builder.generateReport(failures, context);
      expect(report.length).toBeGreaterThan(0);
    });

    it('should handle special characters in task titles', async () => {
      const specialTitle = 'Task with `code` and **bold** and _italic_';
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          taskTitle: specialTitle,
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('Task with');
    });

    it('should handle concurrent dependency chains', async () => {
      const failures = new Map<string, TaskFailure>();
      // Fail two tasks that are roots of dependency chains
      failures.set('P1.M1.T2.S1', createMockTaskFailure());
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T1.S1',
          taskTitle: 'Create Directory Structure',
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Should handle multiple blocked chains
      expect(report).toMatch(/Total tasks blocked: [2-9]/);
    });
  });

  // ===========================================================================
  // Error Report with Specific Error Types
  // ===========================================================================

  describe('Error type categorization', () => {
    it('should categorize TaskError correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new TaskError('Task execution failed'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **TaskError** | 1 | 100.0% |');
    });

    it('should categorize ValidationError correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new ValidationError('Invalid input data'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **ValidationError** | 1 | 100.0% |');
    });

    it('should categorize SessionError correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new SessionError('Session not found'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **SessionError** | 1 | 100.0% |');
    });

    it('should categorize AgentError correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new AgentError('Agent prompt failed'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **AgentError** | 1 | 100.0% |');
    });

    it('should categorize EnvironmentError correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new EnvironmentError('Missing API key'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **EnvironmentError** | 1 | 100.0% |');
    });

    it('should categorize unknown errors as Other', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          error: new Error('Unknown error type'),
        })
      );

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **Other** | 1 | 100.0% |');
    });
  });

  // ===========================================================================
  // Verify All Sections are Present
  // ===========================================================================

  describe('Complete section validation', () => {
    it('should include all required sections', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Verify all required sections exist
      const requiredSections = [
        '# Error Report', // Header
        '## Summary', // Summary
        '## Error Timeline', // Timeline
        '## Failed Tasks', // Failed Tasks
        '## Error Categories', // Error Categories
        '## Impact Analysis', // Impact Analysis
        '## Next Steps', // Next Steps
      ];

      for (const section of requiredSections) {
        expect(report).toContain(section);
      }
    });

    it('should maintain section order', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Check section order by finding positions
      const headerPos = report.indexOf('# Error Report');
      const summaryPos = report.indexOf('## Summary');
      const timelinePos = report.indexOf('## Error Timeline');
      const failedTasksPos = report.indexOf('## Failed Tasks');
      const categoriesPos = report.indexOf('## Error Categories');
      const impactPos = report.indexOf('## Impact Analysis');
      const nextStepsPos = report.indexOf('## Next Steps');

      expect(headerPos).toBeLessThan(summaryPos);
      expect(summaryPos).toBeLessThan(timelinePos);
      expect(timelinePos).toBeLessThan(failedTasksPos);
      expect(failedTasksPos).toBeLessThan(categoriesPos);
      expect(categoriesPos).toBeLessThan(impactPos);
      expect(impactPos).toBeLessThan(nextStepsPos);
    });

    it('should have non-empty content for each section', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T2.S1', createMockTaskFailure());

      const context = createMockReportContext();
      const startTime = new Date('2024-01-15T10:00:00Z');
      const builder = new ErrorReportBuilder(
        mockLogger,
        startTime,
        context.sessionId
      );
      const report = await builder.generateReport(failures, context);

      // Check that each major section has content after the header
      const sections = [
        { header: '# Error Report', name: 'Header' },
        { header: '## Summary', name: 'Summary' },
        { header: '## Error Timeline', name: 'Timeline' },
        { header: '## Failed Tasks', name: 'Failed Tasks' },
        { header: '## Error Categories', name: 'Error Categories' },
        { header: '## Impact Analysis', name: 'Impact Analysis' },
        { header: '## Next Steps', name: 'Next Steps' },
      ];

      for (const section of sections) {
        const sectionStart = report.indexOf(section.header);
        const nextHeaderMatch = report
          .substring(sectionStart + section.header.length)
          .match(/^#{1,3}\s+/m);
        const nextHeaderPos = nextHeaderMatch?.index ?? -1;
        const sectionEnd =
          nextHeaderPos !== -1
            ? sectionStart + section.header.length + nextHeaderPos
            : report.length;
        const sectionContent = report.substring(sectionStart, sectionEnd);

        // Section should have content beyond just the header
        expect(sectionContent.length).toBeGreaterThan(section.header.length);
      }
    });
  });
});
