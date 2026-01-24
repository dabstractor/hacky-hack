/**
 * Integration tests for ArtifactsCommand class
 *
 * @remarks
 * Tests validate the ArtifactsCommand class with real file operations,
 * including artifact discovery, loading, and display functionality.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { ArtifactsCommand } from '../../src/cli/commands/artifacts.js';
import { writeFile } from 'node:fs/promises';
import type { SessionState } from '../../src/core/models.js';

// =============================================================================
// Test Constants
// =============================================================================

const TEST_ARTIFACTS = {
  'validation-results.json': JSON.stringify([
    {
      level: 1,
      description: 'Syntax & Style validation',
      success: true,
      command: 'npm run lint',
      stdout: 'All files pass linting',
      stderr: '',
      exitCode: 0,
      skipped: false,
    },
  ]),
  'execution-summary.md': `# Execution Summary

**Status**: Success

## Validation Results

✓ Level 1: Syntax & Style validation - PASSED

## Artifacts Created

- src/utils/session-helper.ts
- tests/unit/utils/session-helper.test.ts
`,
  'artifacts-list.json': JSON.stringify([
    'src/utils/session-helper.ts',
    'tests/unit/utils/session-helper.test.ts',
  ]),
};

const TEST_ARTIFACTS_2 = {
  'validation-results.json': JSON.stringify([
    {
      level: 1,
      description: 'Syntax & Style validation',
      success: false,
      command: 'npm run lint',
      stdout: '',
      stderr: 'Lint error found',
      exitCode: 1,
      skipped: false,
    },
  ]),
  'execution-summary.md': `# Execution Summary

**Status**: Failed

## Validation Results

✗ Level 1: Syntax & Style validation - FAILED

## Error

Lint errors need to be fixed.
`,
  'artifacts-list.json': JSON.stringify(['src/utils/broken-file.ts']),
};

// =============================================================================
// Test Suite
// =============================================================================

describe('ArtifactsCommand Integration', () => {
  let tempDir: string;
  let planDir: string;
  let sessionDir: string;
  let artifactsDir1: string;
  let artifactsDir2: string;
  let originalExit: (code: number) => never;

  beforeEach(() => {
    // Mock process.exit to prevent test termination
    originalExit = process.exit;
    process.exit = vi.fn((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as never;

    // Create temporary directory structure
    tempDir = mkdtempSync('/tmp/artifacts-test-XXXXXX');
    planDir = join(tempDir, 'plan');
    sessionDir = join(planDir, '001_abc123def456');
    artifactsDir1 = join(sessionDir, 'artifacts', 'P1_M1_T1_S1');
    artifactsDir2 = join(sessionDir, 'artifacts', 'P1_M1_T1_S2');

    // Create directory structure
    mkdirSync(artifactsDir1, { recursive: true });
    mkdirSync(artifactsDir2, { recursive: true });

    // Write session files
    writeFileSync(
      join(sessionDir, 'tasks.json'),
      JSON.stringify({
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
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
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Basic test scope.\n2. INPUT: Test data.\n3. LOGIC: Implement test.\n4. OUTPUT: Test output.',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Complete',
                        story_points: 2,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Basic test scope.\n2. INPUT: Test data from S1.\n3. LOGIC: Implement test.\n4. OUTPUT: Test output for consumption.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
    );

    writeFileSync(join(sessionDir, 'prd_snapshot.md'), '# Test PRD\n');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('list subcommand', () => {
    it('should list all artifacts with table output', async () => {
      // Write test artifacts
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
        writeFileSync(join(artifactsDir2, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('list', { output: 'table' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('P1.M1.T1.S1');
      expect(output).toContain('P1.M1.T1.S2');

      consoleLogSpy.mockRestore();
    });

    it('should list all artifacts with JSON output', async () => {
      // Write test artifacts
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('list', { output: 'json' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);

      consoleLogSpy.mockRestore();
    });

    it('should show no artifacts message when artifacts directory does not exist', async () => {
      // Remove artifacts directory
      rmSync(join(sessionDir, 'artifacts'), { recursive: true });

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('list', { output: 'table' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No artifacts found')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('view subcommand', () => {
    it('should view artifacts for a specific task', async () => {
      // Write test artifacts
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('view', {
        taskId: 'P1.M1.T1.S1',
        output: 'table',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('P1.M1.T1.S1');
      expect(output).toContain('validation-results.json');
      expect(output).toContain('execution-summary.md');
      expect(output).toContain('artifacts-list.json');

      consoleLogSpy.mockRestore();
    });

    it('should view artifacts in JSON format', async () => {
      // Write test artifacts
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('view', {
        taskId: 'P1.M1.T1.S1',
        output: 'json',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('taskId', 'P1.M1.T1.S1');
      expect(parsed).toHaveProperty('validationResults');

      consoleLogSpy.mockRestore();
    });

    it('should show message when task has no artifacts', async () => {
      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('view', {
        taskId: 'P1.M1.T9.S9', // Non-existent task
        output: 'table',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No artifacts found')
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle partial artifacts (some files missing)', async () => {
      // Write only validation-results.json
      writeFileSync(
        join(artifactsDir1, 'validation-results.json'),
        TEST_ARTIFACTS['validation-results.json']
      );

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('view', {
        taskId: 'P1.M1.T1.S1',
        output: 'table',
      });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('diff subcommand', () => {
    it('should diff artifacts between two tasks', async () => {
      // Write test artifacts with different content
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
      }
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS_2)) {
        writeFileSync(join(artifactsDir2, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('diff', {
        task1Id: 'P1.M1.T1.S1',
        task2Id: 'P1.M1.T1.S2',
        output: 'table',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('P1.M1.T1.S1');
      expect(output).toContain('P1.M1.T1.S2');

      consoleLogSpy.mockRestore();
    });

    it('should show no differences when artifacts are identical', async () => {
      // Write identical artifacts
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
        writeFileSync(join(artifactsDir2, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('diff', {
        task1Id: 'P1.M1.T1.S1',
        task2Id: 'P1.M1.T1.S2',
        output: 'table',
      });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should output diff in JSON format', async () => {
      // Write test artifacts
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
      }
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS_2)) {
        writeFileSync(join(artifactsDir2, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('diff', {
        task1Id: 'P1.M1.T1.S1',
        task2Id: 'P1.M1.T1.S2',
        output: 'json',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('task1Id', 'P1.M1.T1.S1');
      expect(parsed).toHaveProperty('task2Id', 'P1.M1.T1.S2');
      expect(parsed).toHaveProperty('hasChanges');

      consoleLogSpy.mockRestore();
    });

    it('should handle missing artifacts for first task', async () => {
      // Only write artifacts for second task
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir2, filename), content);
      }

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('diff', {
        task1Id: 'P1.M1.T1.S1',
        task2Id: 'P1.M1.T1.S2',
        output: 'table',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No artifacts found')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('color output', () => {
    it('should respect NO_COLOR environment variable', async () => {
      // Write test artifacts
      for (const [filename, content] of Object.entries(TEST_ARTIFACTS)) {
        writeFileSync(join(artifactsDir1, filename), content);
      }

      // Set NO_COLOR
      process.env.NO_COLOR = '1';

      const command = new ArtifactsCommand(planDir);
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await command.execute('view', {
        taskId: 'P1.M1.T1.S1',
        output: 'table',
        color: false,
      });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      delete process.env.NO_COLOR;
    });
  });
});
