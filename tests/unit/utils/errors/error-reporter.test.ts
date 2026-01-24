/**
 * Unit tests for ErrorReportBuilder
 *
 * @remarks
 * Tests validate the comprehensive error report generation functionality including:
 * 1. Constructor initialization with logger, startTime, sessionId
 * 2. generateReport() returns complete markdown report with all sections
 * 3. generateReport() correctly passes ReportContext to all components
 * 4. Report sections include: Header, Summary, Timeline, Failed Tasks, Categories, Impact, Next Steps
 * 5. Failed tasks section includes all details (title, phase, milestone, stack trace, etc.)
 * 6. Empty failures map returns minimal report
 * 7. Multiple failures are all included in report
 * 8. Markdown format is well-formed
 * 9. Report integrates all error reporting components
 * 10. Helper methods: calculatePercentage(), formatDuration()
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ErrorReportBuilder,
  ImpactAnalyzer,
} from '../../../../src/utils/errors/error-reporter.js';
import { TaskError, SessionError } from '../../../../src/utils/errors.js';
import type {
  TaskFailure,
  ReportContext,
  TaskImpact,
  SuggestedFix,
  FormattedStackTrace,
  StackFrame,
} from '../../../../src/utils/errors/types.js';
import type { Logger } from '../../../../src/utils/logger.js';
import type { Backlog } from '../../../../src/core/models.js';

// =============================================================================
// TEST DOUBLES
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

/**
 * Mock backlog for testing
 */
const mockBacklog: Backlog = {
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1',
      status: 'Implementing',
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1',
          status: 'Implementing',
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1',
              status: 'Failed',
              description: 'Test task',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Subtask 1',
                  status: 'Failed',
                  story_points: 1,
                  dependencies: [],
                  context_scope:
                    'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test logic\n4. OUTPUT: Test output',
                },
                {
                  id: 'P1.M1.T1.S2',
                  type: 'Subtask',
                  title: 'Subtask 2',
                  status: 'Planned',
                  story_points: 1,
                  dependencies: ['P1.M1.T1.S1'],
                  context_scope:
                    'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test logic\n4. OUTPUT: Test output',
                },
              ],
            },
            {
              id: 'P1.M1.T2',
              type: 'Task',
              title: 'Task 2',
              status: 'Planned',
              description: 'Test task 2',
              subtasks: [
                {
                  id: 'P1.M1.T2.S1',
                  type: 'Subtask',
                  title: 'Subtask 1',
                  status: 'Planned',
                  story_points: 1,
                  dependencies: ['P1.M1.T1.S1'],
                  context_scope:
                    'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test logic\n4. OUTPUT: Test output',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Create a mock ReportContext
 */
function createMockReportContext(
  overrides?: Partial<ReportContext>
): ReportContext {
  return {
    sessionPath: '/path/to/session',
    sessionId: 'test-session-123',
    backlog: mockBacklog,
    totalTasks: 10,
    completedTasks: 5,
    pipelineMode: 'normal',
    continueOnError: false,
    startTime: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

/**
 * Create a mock TaskFailure
 */
function createMockTaskFailure(overrides?: Partial<TaskFailure>): TaskFailure {
  const error = new TaskError('Task execution failed');
  return {
    taskId: 'P1.M1.T1.S1',
    taskTitle: 'Test Task Failed',
    error,
    errorCode: 'PIPELINE_TASK_EXECUTION_FAILED',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    phase: 'P1',
    milestone: 'P1.M1',
    ...overrides,
  };
}

/**
 * Create a mock FormattedStackTrace
 */
function createMockStackTrace(
  overrides?: Partial<FormattedStackTrace>
): FormattedStackTrace {
  return {
    message: 'Test error message',
    errorType: 'TaskError',
    frames: [
      {
        functionName: 'executeTask',
        filePath: '/project/src/tasks/task.ts',
        line: 42,
        column: 10,
        isUserCode: true,
        relevanceScore: 0.9,
      },
      {
        functionName: 'processSubtask',
        filePath: '/project/src/tasks/subtask.ts',
        line: 15,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      },
    ],
    sourceContext: {
      file: '/project/src/tasks/task.ts',
      line: 42,
      column: 10,
      codeLines: [
        'async function executeTask() {',
        '  const result = await process();',
        '  return result.value;',
        '}',
      ],
      errorLineIndex: 1,
    },
    ...overrides,
  };
}

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ErrorReportBuilder', () => {
  let builder: ErrorReportBuilder;
  let startTime: Date;

  beforeEach(() => {
    startTime = new Date('2024-01-15T10:00:00Z');
    builder = new ErrorReportBuilder(mockLogger, startTime, 'test-session-123');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Constructor tests
  // ========================================================================

  describe('Constructor', () => {
    it('should create builder with logger, startTime, and sessionId', () => {
      const testStartTime = new Date('2024-01-15T10:00:00Z');
      const testBuilder = new ErrorReportBuilder(
        mockLogger,
        testStartTime,
        'session-abc'
      );

      expect(testBuilder).toBeInstanceOf(ErrorReportBuilder);
    });

    it('should initialize all internal components', () => {
      // Builder should create instances of all required components
      expect(builder).toBeDefined();
    });
  });

  // ========================================================================
  // generateReport() tests
  // ========================================================================

  describe('generateReport()', () => {
    it('should return complete markdown report with all sections', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Check all sections are present
      expect(report).toContain('# Error Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Error Timeline');
      expect(report).toContain('## Failed Tasks');
      expect(report).toContain('## Error Categories');
      expect(report).toContain('## Impact Analysis');
      expect(report).toContain('## Next Steps');
    });

    it('should correctly pass ReportContext to all components', async () => {
      const failures = new Map<string, TaskFailure>();
      const mockError = new TaskError('Test error');
      failures.set('P1.M1.T1.S1', {
        taskId: 'P1.M1.T1.S1',
        taskTitle: 'Test Task',
        error: mockError,
        timestamp: new Date(),
        phase: 'P1',
        milestone: 'P1.M1',
      });

      const context = createMockReportContext({
        sessionId: 'custom-session-id',
        pipelineMode: 'verbose',
        continueOnError: true,
        sessionPath: '/custom/path',
      });

      const report = await builder.generateReport(failures, context);

      // Verify context values are used in report
      expect(report).toContain('custom-session-id');
      expect(report).toContain('verbose');
      expect(report).toContain('Yes'); // Continue on Error
      expect(report).toContain('/custom/path');
    });

    it('should handle empty failures map and return minimal report', async () => {
      const failures = new Map<string, TaskFailure>();
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Should still have all sections
      expect(report).toContain('# Error Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Error Timeline');
      expect(report).toContain('## Failed Tasks');
      expect(report).toContain('## Error Categories');
      expect(report).toContain('## Impact Analysis');
      expect(report).toContain('## Next Steps');

      // Failed count should be 0
      expect(report).toContain('| Failed | 0 |');
    });

    it('should include multiple failures in report', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T1.S1',
          taskTitle: 'First Failed Task',
        })
      );
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S1',
          taskTitle: 'Second Failed Task',
          timestamp: new Date('2024-01-15T10:35:00Z'),
        })
      );

      const context = createMockReportContext();
      const report = await builder.generateReport(failures, context);

      // Both tasks should be in report
      expect(report).toContain('First Failed Task');
      expect(report).toContain('Second Failed Task');
      expect(report).toContain('P1.M1.T1.S1');
      expect(report).toContain('P1.M1.T2.S1');

      // Failed count should be 2
      expect(report).toContain('| Failed | 2 |');
    });

    it('should generate well-formed markdown', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Check for proper markdown headers
      expect(report).toMatch(/^# Error Report/m);
      expect(report).toMatch(/^## Summary/m);
      expect(report).toMatch(/^### \d+\. /m); // Numbered subsections

      // Check for proper markdown tables
      expect(report).toContain('|'); // Table separator
      expect(report).toMatch(/^\|.*\|.*\|.*\|$/m); // Table row

      // Check for code blocks
      expect(report).toContain('```');
      expect(report).toContain('```typescript');
      expect(report).toContain('```bash');

      // Check for horizontal rules
      expect(report).toContain('---');
    });
  });

  // ========================================================================
  // Report Header section tests
  // ========================================================================

  describe('Report Header section', () => {
    it('should include Generated timestamp in ISO format', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Generated**:');
      expect(report).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include Pipeline Mode from context', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({ pipelineMode: 'verbose' });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Pipeline Mode**: verbose');
    });

    it('should include Continue on Error flag from context', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({ continueOnError: true });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Continue on Error**: Yes');
    });

    it('should show No for Continue on Error when false', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({ continueOnError: false });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Continue on Error**: No');
    });

    it('should include Session ID from context', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({ sessionId: 'my-session-456' });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Session**: my-session-456');
    });
  });

  // ========================================================================
  // Summary section tests
  // ========================================================================

  describe('Summary section', () => {
    it('should include Total Tasks count from context', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({ totalTasks: 25 });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| Total Tasks | 25 |');
    });

    it('should include Completed Tasks count from context', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({ completedTasks: 15 });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| Completed | 15 |');
    });

    it('should include Failed tasks count', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      failures.set('P1.M1.T2.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| Failed | 2 |');
    });

    it('should calculate Success Rate correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({
        totalTasks: 10,
        completedTasks: 5,
      });

      const report = await builder.generateReport(failures, context);

      // Success rate = (5 / 10) * 100 = 50.0%
      expect(report).toContain('| Success Rate | 50.0% |');
    });

    it('should handle zero total tasks for success rate', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({
        totalTasks: 0,
        completedTasks: 0,
      });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| Success Rate | 0.0% |');
    });
  });

  // ========================================================================
  // Error Timeline section tests
  // ========================================================================

  describe('Error Timeline section', () => {
    it('should include timeline entries from failures', async () => {
      const failures = new Map<string, TaskFailure>();
      const timestamp = new Date('2024-01-15T10:30:00Z');
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          timestamp,
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('## Error Timeline');
      expect(report).toContain('```');
      expect(report).toContain('P1.M1.T1.S1');
    });

    it('should include timeline summary statistics', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Timeline Summary**');
      expect(report).toContain('- First error at:');
      expect(report).toContain('- Error frequency:');
      expect(report).toContain('- Total duration:');
    });

    it('should include error span when there are multiple errors', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          timestamp: new Date('2024-01-15T10:30:00Z'),
        })
      );
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S1',
          timestamp: new Date('2024-01-15T10:35:00Z'),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('- Error span:');
    });

    it('should format duration in human-readable format', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({
        startTime: new Date('2024-01-15T10:00:00Z'),
      });

      const report = await builder.generateReport(failures, context);

      // Duration should be formatted like "5m 30s" or "1h 15m"
      expect(report).toMatch(/- Total duration: \d+[hms]\s*\d*[hms]/);
    });
  });

  // ========================================================================
  // Failed Tasks section tests
  // ========================================================================

  describe('Failed Tasks section', () => {
    it('should include task title for each failure', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          taskTitle: 'Authentication Failed',
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('Authentication Failed');
    });

    it('should include phase for each failure', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          phase: 'P1',
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Phase**: P1');
    });

    it('should include milestone for each failure', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          milestone: 'P1.M1',
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Milestone**: P1.M1');
    });

    it('should include timestamp for each failure', async () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          timestamp,
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Failed At**: 2024-01-15T10:30:00.000Z');
    });

    it('should include stack trace with function names and file paths', async () => {
      const failures = new Map<string, TaskFailure>();
      const error = new Error('Test error');
      error.stack =
        'Error: Test error\n' +
        '    at executeTask (/project/src/tasks/task.ts:42:10)\n' +
        '    at processSubtask (/project/src/tasks/subtask.ts:15:5)\n' +
        '    at runMicrotasks (<internal>)\n';

      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error,
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Error Details**');
      expect(report).toContain('```typescript');
      expect(report).toContain('at executeTask');
      expect(report).toContain('/project/src/tasks/task.ts:42');
    });

    it('should include source context with code lines when available', async () => {
      // This test verifies the structure when source context is available
      // The actual source context extraction depends on file existence
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // The report should have the error details section
      expect(report).toContain('**Error Details**');
    });

    it('should include affected tasks with impact level icon', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Should contain impact section with icon
      expect(report).toContain('**Affected Tasks**');
      // Impact icon should be one of: 🔴, 🟠, 🟡, 🔵, ⚪
      expect(report).toMatch(/🔴|🟠|🟡|🔵|⚪/);
    });

    it('should list affected task IDs', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Should show affected tasks (P1.M1.T1.S2 and P1.M1.T2.S1 depend on P1.M1.T1.S1)
      expect(report).toMatch(/tasks blocked/);
      expect(report).toContain('`P1.M1.T1.S2`');
      expect(report).toContain('`P1.M1.T2.S1`');
    });

    it('should include suggested fixes with priority', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Suggested Fixes**');
      // Should have priority numbers like "1.", "2.", etc.
      expect(report).toMatch(/\d+\.\s+\*\*/);
    });

    it('should include commands for suggested fixes when available', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Should have bash code blocks for commands
      expect(report).toMatch(/```bash[\s\S]*?\$/);
    });

    it('should include resume commands as bash code blocks', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Resume Commands**');
      expect(report).toContain('```bash');
      expect(report).toContain('npm run prp');
      expect(report).toContain('--retry');
    });

    it('should include skip command in resume commands', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('--skip');
    });

    it('should number multiple failures sequentially', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S1',
          taskTitle: 'Second Task',
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('### 1.');
      expect(report).toContain('### 2.');
    });
  });

  // ========================================================================
  // Error Categories section tests
  // ========================================================================

  describe('Error Categories section', () => {
    it('should categorize TaskError correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error: new TaskError('Task failed'),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('## Error Categories');
      expect(report).toContain('| **TaskError** | 1 |');
      expect(report).toContain('| **ValidationError** | 0 |');
    });

    it('should categorize SessionError correctly', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error: new SessionError('Session failed'),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **SessionError** | 1 |');
      expect(report).toContain('| **TaskError** | 0 |');
    });

    it('should calculate percentage for each category', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error: new TaskError('Task failed'),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // With 1 total task, percentage should be 100.0%
      expect(report).toContain('| **TaskError** | 1 | 100.0% |');
    });

    it('should handle multiple errors of same category', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error: new TaskError('Task 1 failed'),
        })
      );
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S1',
          error: new TaskError('Task 2 failed'),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('| **TaskError** | 2 |');
    });

    it('should show 0.0% for empty categories', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // All empty categories should show 0.0%
      expect(report).toMatch(
        /\|\s+\*\*ValidationError\*\*\s+\|\s+0\s+\|\s+0\.0%\s+\|/
      );
      expect(report).toMatch(
        /\|\s+\*\*AgentError\*\*\s+\|\s+0\s+\|\s+0\.0%\s+\|/
      );
    });
  });

  // ========================================================================
  // Impact Analysis section tests
  // ========================================================================

  describe('Impact Analysis section', () => {
    it('should include blocked tasks summary', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('## Impact Analysis');
      expect(report).toContain('**Blocked Tasks Summary**');
      expect(report).toContain('- Total blocked:');
    });

    it('should show phases blocked count', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toMatch(/- Phases blocked:\s+\d+/);
    });

    it('should show milestones blocked count', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toMatch(/- Milestones blocked:\s+\d+/);
    });

    it('should include max cascade depth', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toMatch(/- Max cascade depth:\s+\d+/);
    });

    it('should show overall impact level with icon', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Critical Path Impact**');
      // Should have impact icon and level name
      expect(report).toMatch(/🔴|🟠|🟡|🔵|⚪/);
    });
  });

  // ========================================================================
  // Next Steps section tests
  // ========================================================================

  describe('Next Steps section', () => {
    it('should include numbered list of errors to fix', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error: new TaskError('Authentication failed'),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('## Next Steps');
      expect(report).toContain('2. Fix the errors listed above:');
      expect(report).toContain('1. **P1.M1.T1.S1**');
    });

    it('should include location information for each error', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          phase: 'P1',
          error: new TaskError('Task failed'),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toMatch(/- Location:\s+P1/);
    });

    it('should include resume command in Next Steps', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('3. Resume pipeline execution:');
      expect(report).toContain('```bash');
      expect(report).toContain('npm run prp');
    });

    it('should include report location', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext({
        sessionPath: '/my/session/path',
      });

      const report = await builder.generateReport(failures, context);

      expect(report).toContain(
        '**Report Location**: /my/session/path/ERROR_REPORT.md'
      );
    });
  });

  // ========================================================================
  // Integration tests
  // ========================================================================

  describe('Integration', () => {
    it('should integrate all error reporting components', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      failures.set(
        'P1.M1.T2.S1',
        createMockTaskFailure({
          taskId: 'P1.M1.T2.S1',
          taskTitle: 'Second Task',
          error: new SessionError('Session load failed'),
          phase: 'P1',
          milestone: 'P1.M1',
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Verify all components are integrated
      expect(report).toContain('# Error Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Error Timeline');
      expect(report).toContain('## Failed Tasks');
      expect(report).toContain('P1.M1.T1.S1');
      expect(report).toContain('P1.M1.T2.S1');
      expect(report).toContain('## Error Categories');
      expect(report).toContain('## Impact Analysis');
      expect(report).toContain('## Next Steps');
    });

    it('should maintain consistent markdown formatting throughout', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set('P1.M1.T1.S1', createMockTaskFailure());
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Check that sections are separated by blank lines
      const sections = report.split(/\n\n+/);
      expect(sections.length).toBeGreaterThan(5);

      // Check that code blocks are properly closed
      const codeBlocks = report.match(/```/g);
      expect(codeBlocks).not.toBeNull();
      expect(codeBlocks!.length % 2).toBe(0); // Even number of opening/closing
    });
  });

  // ========================================================================
  // Helper methods tests
  // ========================================================================

  describe('Helper methods', () => {
    describe('#calculatePercentage() behavior', () => {
      it('should calculate correct percentage for normal values', async () => {
        const failures = new Map<string, TaskFailure>();
        failures.set('P1.M1.T1.S1', createMockTaskFailure());
        const context = createMockReportContext();

        const report = await builder.generateReport(failures, context);

        // With 1 failure out of 1 total, should be 100.0%
        expect(report).toContain('100.0%');
      });

      it('should return 0.0% when total is zero', async () => {
        const failures = new Map<string, TaskFailure>();
        failures.set('P1.M1.T1.S1', createMockTaskFailure());
        const context = createMockReportContext({
          totalTasks: 0,
          completedTasks: 0,
        });

        const report = await builder.generateReport(failures, context);

        expect(report).toContain('0.0%');
      });

      it('should format to one decimal place', async () => {
        const failures = new Map<string, TaskFailure>();
        failures.set('P1.M1.T1.S1', createMockTaskFailure());
        const failures2 = new Map<string, TaskFailure>();
        failures2.set(
          'P1.M1.T2.S1',
          createMockTaskFailure({
            taskId: 'P1.M1.T2.S1',
          })
        );
        failures2.set(
          'P1.M1.T3.S1',
          createMockTaskFailure({
            taskId: 'P1.M1.T3.S1',
          })
        );
        const context = createMockReportContext();

        const report = await builder.generateReport(failures2, context);

        // Should have one decimal place format
        expect(report).toMatch(/\d+\.\d+%/);
      });
    });

    describe('#formatDuration() behavior', () => {
      it('should format seconds correctly', async () => {
        const failures = new Map<string, TaskFailure>();
        failures.set('P1.M1.T1.S1', createMockTaskFailure());
        const context = createMockReportContext({
          startTime: new Date(Date.now() - 5000), // 5 seconds ago
        });

        const report = await builder.generateReport(failures, context);

        // Should show duration formatted with time units (h, m, or s)
        expect(report).toMatch(/Total duration:\s+\d+[hms]/);
      });

      it('should format minutes and seconds correctly', async () => {
        const failures = new Map<string, TaskFailure>();
        failures.set('P1.M1.T1.S1', createMockTaskFailure());
        const context = createMockReportContext({
          startTime: new Date(Date.now() - 65000), // 1m 5s ago
        });

        const report = await builder.generateReport(failures, context);

        // Should show time units (h, m, or s)
        expect(report).toMatch(/Total duration:\s+[\d:hms\s]+/);
      });

      it('should format hours and minutes correctly', async () => {
        const failures = new Map<string, TaskFailure>();
        failures.set('P1.M1.T1.S1', createMockTaskFailure());
        const context = createMockReportContext({
          startTime: new Date(Date.now() - 3665000), // 1h 1m 5s ago
        });

        const report = await builder.generateReport(failures, context);

        // Should show hours format
        expect(report).toMatch(/Total duration:\s+\d+h/);
      });
    });
  });

  // ========================================================================
  // Static methods tests
  // ========================================================================

  describe('ImpactAnalyzer static methods', () => {
    describe('getImpactIcon()', () => {
      it('should return correct icon for critical impact', () => {
        expect(ImpactAnalyzer.getImpactIcon('critical')).toBe('🔴');
      });

      it('should return correct icon for high impact', () => {
        expect(ImpactAnalyzer.getImpactIcon('high')).toBe('🟠');
      });

      it('should return correct icon for medium impact', () => {
        expect(ImpactAnalyzer.getImpactIcon('medium')).toBe('🟡');
      });

      it('should return correct icon for low impact', () => {
        expect(ImpactAnalyzer.getImpactIcon('low')).toBe('🔵');
      });

      it('should return correct icon for none impact', () => {
        expect(ImpactAnalyzer.getImpactIcon('none')).toBe('⚪');
      });
    });

    describe('formatImpactLevel()', () => {
      it('should capitalize impact level correctly', () => {
        expect(ImpactAnalyzer.formatImpactLevel('critical')).toBe('Critical');
        expect(ImpactAnalyzer.formatImpactLevel('high')).toBe('High');
        expect(ImpactAnalyzer.formatImpactLevel('medium')).toBe('Medium');
        expect(ImpactAnalyzer.formatImpactLevel('low')).toBe('Low');
        expect(ImpactAnalyzer.formatImpactLevel('none')).toBe('None');
      });
    });
  });

  // ========================================================================
  // Edge cases tests
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle failure without phase or milestone', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          phase: undefined,
          milestone: undefined,
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('**Phase**: Unknown');
      expect(report).toContain('**Milestone**: N/A');
    });

    it('should handle failure without error code', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error: new Error('Generic error'),
          errorCode: undefined,
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Should not throw, should handle gracefully
      expect(report).toContain('Generic error');
    });

    it('should handle very long error messages', async () => {
      const longMessage = 'A'.repeat(500);
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          error: new Error(longMessage),
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      // Should include the error (possibly truncated)
      expect(report.length).toBeGreaterThan(0);
    });

    it('should handle special characters in task titles', async () => {
      const failures = new Map<string, TaskFailure>();
      failures.set(
        'P1.M1.T1.S1',
        createMockTaskFailure({
          taskTitle: 'Task with `code` and **bold**',
        })
      );
      const context = createMockReportContext();

      const report = await builder.generateReport(failures, context);

      expect(report).toContain('Task with');
    });
  });
});
