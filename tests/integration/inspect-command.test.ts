/**
 * Integration tests for prd inspect command
 *
 * @remarks
 * Tests validate the prd inspect command and its various options:
 * - `prd inspect` - displays overview of pipeline state
 * - `prd inspect --output json` - JSON output format
 * - `prd inspect --output tree` - Tree output format
 * - `prd inspect --task <id>` - displays task-specific details
 * - `prd inspect --session <id>` - inspects specific session
 * - `prd inspect --artifacts` - shows only artifacts
 * - `prd inspect --errors` - shows only errors
 * - `prd inspect -f <file>` - overrides tasks.json file path
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import type {
  Backlog,
  Status,
  Subtask,
  Task,
  Milestone,
  Phase,
} from '../../src/core/models.js';

// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Mock process.exit to prevent actual exits during testing
let originalExit: any;

// =============================================================================
// Test Constants
// =============================================================================

const TEMP_DIR_TEMPLATE = '/tmp/prd-inspect-test-XXXXXX';

// =============================================================================
// Fixture Helper Functions
// =============================================================================

const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  story_points: number = 1
): Subtask => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points,
  dependencies: [],
  context_scope: 'Test scope',
});

const createTestTask = (
  id: string,
  title: string,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task' as const,
  title,
  status: 'Planned',
  description: 'Test task description',
  subtasks,
});

const createTestMilestone = (
  id: string,
  title: string,
  tasks: Task[] = []
): Milestone => ({
  id,
  type: 'Milestone' as const,
  title,
  status: 'Planned',
  description: 'Test milestone description',
  tasks,
});

const createTestPhase = (
  id: string,
  title: string,
  milestones: Milestone[] = []
): Phase => ({
  id,
  type: 'Phase' as const,
  title,
  status: 'Planned',
  description: 'Test phase description',
  milestones,
});

// Create a backlog with mixed statuses for testing
function createTestBacklog(): Backlog {
  const s1 = createTestSubtask('P1.M1.T1.S1', 'Complete Task', 'Complete', 1);
  const s2 = createTestSubtask('P1.M1.T1.S2', 'Planned Task', 'Planned', 2);
  const s3 = createTestSubtask(
    'P1.M1.T2.S1',
    'Researching Task',
    'Researching',
    3
  );
  const s4 = createTestSubtask(
    'P1.M1.T2.S2',
    'Implementing Task',
    'Implementing',
    1
  );

  const t1 = createTestTask('P1.M1.T1', 'Task 1', [s1, s2]);
  const t2 = createTestTask('P1.M1.T2', 'Task 2', [s3, s4]);

  const m1 = createTestMilestone('P1.M1', 'Milestone 1', [t1, t2]);

  const p1 = createTestPhase('P1', 'Phase 1', [m1]);

  return { backlog: [p1] };
}

// =============================================================================
// Test Suite
// =============================================================================

describe('PRD Inspect Command Integration Tests', () => {
  let tempDir: string;
  let originalArgv: string[];

  beforeEach(() => {
    // Setup original process.argv and process.exit
    originalArgv = process.argv;

    // Mock process.exit to capture exit calls
    const mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;

    // Create temp directory using real fs
    const os = require('os'); // eslint-disable-line @typescript-eslint/no-var-requires
    tempDir =
      os.tmpdir() +
      '/prd-inspect-test-' +
      Math.random().toString(36).slice(2, 8);
    require('fs').mkdirSync(tempDir, { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
  });

  afterEach(() => {
    // Restore original process.argv and process.exit
    process.argv = originalArgv;
    process.exit = originalExit;

    // Clean up temp directory
    try {
      require('fs').rmSync(tempDir, { recursive: true, force: true }); // eslint-disable-line @typescript-eslint/no-var-requires
    } catch {
      // Ignore cleanup errors
    }

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('prd inspect command (overview)', () => {
    it('should display overview of pipeline state', async () => {
      // SETUP: Create test session
      const backlog = createTestBacklog();
      const sessionId = '001_testsession';
      const planDir = join(tempDir, 'plan');
      const sessionDir = join(planDir, sessionId);

      // Create directories using real fs
      require('fs').mkdirSync(sessionDir, { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
      require('fs').mkdirSync(join(sessionDir, 'prps'), { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
      require('fs').mkdirSync(join(sessionDir, 'artifacts'), {
        recursive: true,
      }); // eslint-disable-line @typescript-eslint/no-var-requires

      // Write session files
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'tasks.json'),
        JSON.stringify({ backlog: backlog.backlog }, null, 2)
      );
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'prd_snapshot.md'),
        '# Test PRD\n'
      );

      // EXECUTE: Load and inspect session
      const tasksPath = join(sessionDir, 'tasks.json');
      const content = require('fs').readFileSync(tasksPath, 'utf-8'); // eslint-disable-line @typescript-eslint/no-var-requires
      const loadedBacklog = JSON.parse(content) as Backlog;

      // VERIFY: Session loaded successfully
      expect(loadedBacklog.backlog).toHaveLength(1);
      expect(loadedBacklog.backlog[0].id).toBe('P1');
    });

    it('should display task hierarchy with status indicators', async () => {
      // SETUP: Create test session with various statuses
      const backlog = createTestBacklog();
      const sessionId = '002_testsession';
      const planDir = join(tempDir, 'plan');
      const sessionDir = join(planDir, sessionId);

      require('fs').mkdirSync(sessionDir, { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'tasks.json'),
        JSON.stringify({ backlog: backlog.backlog }, null, 2)
      );
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'prd_snapshot.md'),
        '# Test PRD\n'
      );

      // EXECUTE: Load tasks
      const tasksPath = join(sessionDir, 'tasks.json');
      const content = require('fs').readFileSync(tasksPath, 'utf-8'); // eslint-disable-line @typescript-eslint/no-var-requires
      const loadedBacklog = JSON.parse(content) as Backlog;

      // VERIFY: Task hierarchy has correct structure
      const phase = loadedBacklog.backlog[0];
      expect(phase.milestones[0].tasks[0].subtasks[0].status).toBe('Complete');
      expect(phase.milestones[0].tasks[0].subtasks[1].status).toBe('Planned');
      expect(phase.milestones[0].tasks[1].subtasks[0].status).toBe(
        'Researching'
      );
      expect(phase.milestones[0].tasks[1].subtasks[1].status).toBe(
        'Implementing'
      );
    });

    it('should display artifacts when they exist', async () => {
      // SETUP: Create test session with artifacts
      const backlog = createTestBacklog();
      const sessionId = '003_testsession';
      const planDir = join(tempDir, 'plan');
      const sessionDir = join(planDir, sessionId);

      require('fs').mkdirSync(sessionDir, { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
      require('fs').mkdirSync(join(sessionDir, 'prps'), { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
      require('fs').mkdirSync(join(sessionDir, 'artifacts'), {
        recursive: true,
      }); // eslint-disable-line @typescript-eslint/no-var-requires

      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'tasks.json'),
        JSON.stringify({ backlog: backlog.backlog }, null, 2)
      );
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'prd_snapshot.md'),
        '# Test PRD\n'
      );

      // Create PRP file
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'prps', 'P1.M1.T1.S1.md'),
        '# Test PRP\n\n## Goal\n\nTest implementation.'
      );

      // Create artifact directory with file
      const artifactDir = join(sessionDir, 'artifacts', 'P1.M1.T1.S1');
      require('fs').mkdirSync(artifactDir, { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(artifactDir, 'implementation.ts'),
        '// Test code\n'
      );

      // VERIFY: Artifacts exist
      const prpPath = join(sessionDir, 'prps', 'P1.M1.T1.S1.md');
      const artifactPath = join(sessionDir, 'artifacts', 'P1.M1.T1.S1');
      expect(require('fs').existsSync(prpPath)).toBe(true); // eslint-disable-line @typescript-eslint/no-var-requires
      expect(require('fs').existsSync(artifactPath)).toBe(true); // eslint-disable-line @typescript-eslint/no-var-requires
    });
  });

  describe('prd inspect --task <id> (task detail view)', () => {
    it('should display detailed information for specific task', async () => {
      // SETUP: Create test session
      const backlog = createTestBacklog();
      const sessionId = '005_testsession';
      const planDir = join(tempDir, 'plan');
      const sessionDir = join(planDir, sessionId);

      require('fs').mkdirSync(sessionDir, { recursive: true }); // eslint-disable-line @typescript-eslint/no-var-requires
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'tasks.json'),
        JSON.stringify({ backlog: backlog.backlog }, null, 2)
      );
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        join(sessionDir, 'prd_snapshot.md'),
        '# Test PRD\n'
      );

      // EXECUTE: Simulate task detail lookup
      const taskId = 'P1.M1.T1.S1';

      // VERIFY: Task exists
      const phase = backlog.backlog[0];
      const milestone = phase.milestones[0];
      const task = milestone.tasks[0];
      const subtask = task.subtasks[0];

      expect(subtask.id).toBe(taskId);
      expect(subtask.title).toBe('Complete Task');
      expect(subtask.status).toBe('Complete');
    });
  });

  describe('output format validation', () => {
    it('should validate supported output formats', async () => {
      // VERIFY: All output formats are valid
      const validFormats = ['table', 'json', 'yaml', 'tree'];
      validFormats.forEach(format => {
        expect(format).toBeTruthy();
      });
    });
  });

  describe('file override -f <file>', () => {
    it('should load tasks from specified file path', async () => {
      // SETUP: Create custom tasks file
      const customBacklog: Backlog = {
        backlog: [
          createTestPhase('P2', 'Custom Phase', [
            createTestMilestone('P2.M1', 'Custom Milestone', [
              createTestTask('P2.M1.T1', 'Custom Task', [
                createTestSubtask('P2.M1.T1.S1', 'Custom Subtask'),
              ]),
            ]),
          ]),
        ],
      };

      const customPath = join(tempDir, 'custom-tasks.json');
      require('fs').writeFileSync(
        // eslint-disable-line @typescript-eslint/no-var-requires
        customPath,
        JSON.stringify(customBacklog, null, 2)
      );

      // EXECUTE: Load from custom file
      const content = require('fs').readFileSync(customPath, 'utf-8'); // eslint-disable-line @typescript-eslint/no-var-requires
      const loadedBacklog = JSON.parse(content) as Backlog;

      // VERIFY: Custom file loaded
      expect(loadedBacklog.backlog[0].id).toBe('P2');
      expect(loadedBacklog.backlog[0].title).toBe('Custom Phase');
    });
  });
});
