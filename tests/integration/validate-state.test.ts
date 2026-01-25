/**
 * Integration tests for validate-state command
 *
 * @module tests/integration/validate-state
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, dirname } from 'node:path';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { ValidateStateCommand } from '../../src/cli/commands/validate-state.js';
import type { Backlog } from '../../src/core/models.js';
import {
  validateBacklogState,
  repairBacklog,
  createBackup,
} from '../../src/core/state-validator.js';

describe('validate-state command', () => {
  const testDir = resolve('/tmp/validate-state-test');
  const sessionDir = resolve(testDir, '001_testsession');
  const tasksPath = resolve(sessionDir, 'tasks.json');
  const prdPath = resolve(testDir, 'PRD.md');

  // Helper to create a minimal valid backlog
  function createValidBacklog(): Backlog {
    return {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Planned',
          description: 'Test phase',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone',
              title: 'Milestone 1',
              status: 'Planned',
              description: 'Test milestone',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task',
                  title: 'Task 1',
                  status: 'Planned',
                  description: 'Test task',
                  subtasks: [
                    {
                      id: 'P1.M1.T1.S1',
                      type: 'Subtask',
                      title: 'Subtask 1',
                      status: 'Planned',
                      story_points: 1,
                      dependencies: [],
                      context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test research note
2. INPUT: Test input
3. LOGIC: Test logic
4. OUTPUT: Test output`,
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

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(sessionDir, { recursive: true });
    // Create minimal PRD file
    await writeFile(prdPath, '# Test PRD\n\nTest content.');
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('should validate clean backlog successfully', () => {
    it('should pass validation for a valid backlog', async () => {
      const backlog = createValidBacklog();
      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const command = new ValidateStateCommand(testDir, prdPath);

      // Mock process.exit to capture exit code
      const originalExit = process.exit;
      let exitCode = 0;
      process.exit = (code?: number) => {
        exitCode = code ?? 0;
        throw new Error('exit');
      };

      try {
        await command.execute({
          output: 'json',
          file: tasksPath,
          autoRepair: false,
          backup: true,
          maxBackups: 5,
        });
      } catch (e) {
        // Expected exit
      }

      process.exit = originalExit;

      expect(exitCode).toBe(0);
    });
  });

  describe('should detect orphaned dependencies', () => {
    it('should detect dependencies to non-existent tasks', async () => {
      const backlog = createValidBacklog();
      // Add an orphaned dependency
      backlog.backlog[0].milestones[0].tasks[0].subtasks[0].dependencies = [
        'P1.M1.T1.S2',
      ];

      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const validation = validateBacklogState(backlog);

      expect(validation.isValid).toBe(false);
      expect(validation.orphanedDependencies).toHaveLength(1);
      expect(validation.orphanedDependencies?.[0].taskId).toBe('P1.M1.T1.S1');
      expect(validation.orphanedDependencies?.[0].missingTaskId).toBe(
        'P1.M1.T1.S2'
      );
    });
  });

  describe('should detect circular dependencies', () => {
    it('should detect circular dependency in tasks', async () => {
      const backlog = createValidBacklog();
      // Add a second subtask that depends on the first
      backlog.backlog[0].milestones[0].tasks[0].subtasks.push({
        id: 'P1.M1.T1.S2',
        type: 'Subtask',
        title: 'Subtask 2',
        status: 'Planned',
        story_points: 1,
        dependencies: ['P1.M1.T1.S1'],
        context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test
2. INPUT: Test
3. LOGIC: Test
4. OUTPUT: Test`,
      });
      // Make first subtask depend on second (circular)
      backlog.backlog[0].milestones[0].tasks[0].subtasks[0].dependencies = [
        'P1.M1.T1.S2',
      ];

      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const validation = validateBacklogState(backlog);

      expect(validation.isValid).toBe(false);
      expect(validation.circularDependencies).toHaveLength(1);
      expect(validation.circularDependencies?.[0].cycle).toContain(
        'P1.M1.T1.S1'
      );
      expect(validation.circularDependencies?.[0].cycle).toContain(
        'P1.M1.T1.S2'
      );
    });
  });

  describe('should detect status inconsistencies', () => {
    it('should detect parent Complete with incomplete child', async () => {
      const backlog = createValidBacklog();
      // Mark parent as Complete but child as Planned
      backlog.backlog[0].status = 'Complete';
      backlog.backlog[0].milestones[0].status = 'Planned';

      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const validation = validateBacklogState(backlog);

      expect(validation.statusInconsistencies).toHaveLength(1);
      expect(validation.statusInconsistencies?.[0].parentId).toBe('P1');
      expect(validation.statusInconsistencies?.[0].childId).toBe('P1.M1');
    });
  });

  describe('should create backup before repair', () => {
    it('should create timestamped backup file', async () => {
      const backlog = createValidBacklog();
      // Add orphaned dependency
      backlog.backlog[0].milestones[0].tasks[0].subtasks[0].dependencies = [
        'NONEXISTENT',
      ];

      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const backupPath = await createBackup(tasksPath, 5);

      expect(backupPath).toMatch(/tasks\.json\.backup\.\d{4}-\d{2}-\d{2}T/);
      const backupExists = await readFile(backupPath, 'utf-8');
      expect(backupExists).toContain('NONEXISTENT');
    });
  });

  describe('should repair orphaned dependencies', () => {
    it('should remove orphaned dependencies', async () => {
      const backlog = createValidBacklog();
      backlog.backlog[0].milestones[0].tasks[0].subtasks[0].dependencies = [
        'NONEXISTENT',
      ];

      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const validation = validateBacklogState(backlog);
      const backupPath = await createBackup(tasksPath, 5);
      const repairResult = await repairBacklog(backlog, validation, backupPath);

      expect(repairResult.repaired).toBe(true);
      expect(repairResult.repairs.orphanedDependencies).toBe(1);
      expect(
        backlog.backlog[0].milestones[0].tasks[0].subtasks[0].dependencies
      ).toEqual([]);
    });
  });

  describe('should repair circular dependencies', () => {
    it('should remove last edge in cycle', async () => {
      const backlog = createValidBacklog();
      // Add a second subtask
      backlog.backlog[0].milestones[0].tasks[0].subtasks.push({
        id: 'P1.M1.T1.S2',
        type: 'Subtask',
        title: 'Subtask 2',
        status: 'Planned',
        story_points: 1,
        dependencies: ['P1.M1.T1.S1'],
        context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test
2. INPUT: Test
3. LOGIC: Test
4. OUTPUT: Test`,
      });
      // Create circular dependency
      backlog.backlog[0].milestones[0].tasks[0].subtasks[0].dependencies = [
        'P1.M1.T1.S2',
      ];

      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const validation = validateBacklogState(backlog);
      const backupPath = await createBackup(tasksPath, 5);
      const repairResult = await repairBacklog(backlog, validation, backupPath);

      expect(repairResult.repaired).toBe(true);
      expect(repairResult.repairs.circularDependencies).toBe(1);

      // Re-validate should pass
      const revalidation = validateBacklogState(backlog);
      expect(revalidation.circularDependencies).toHaveLength(0);
    });
  });

  describe('should output json format', () => {
    it('should produce valid JSON output', async () => {
      const backlog = createValidBacklog();
      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const command = new ValidateStateCommand(testDir, prdPath);

      // Capture console output
      const originalLog = console.log;
      let output = '';
      console.log = (data: unknown) => {
        output += String(data);
      };

      // Mock process.exit
      const originalExit = process.exit;
      process.exit = () => {
        throw new Error('exit');
      };

      try {
        await command.execute({
          output: 'json',
          file: tasksPath,
          autoRepair: false,
          backup: true,
          maxBackups: 5,
        });
      } catch (e) {
        // Expected exit
      }

      console.log = originalLog;
      process.exit = originalExit;

      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.isValid).toBe(true);
    });
  });

  describe('should return exit code 0 for valid state', () => {
    it('should exit with 0 for valid backlog', async () => {
      const backlog = createValidBacklog();
      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const command = new ValidateStateCommand(testDir, prdPath);

      // Mock process.exit
      const originalExit = process.exit;
      let exitCode = 0;
      process.exit = (code?: number) => {
        exitCode = code ?? 0;
        throw new Error('exit');
      };

      try {
        await command.execute({
          output: 'json',
          file: tasksPath,
          autoRepair: false,
          backup: true,
          maxBackups: 5,
        });
      } catch (e) {
        // Expected exit
      }

      process.exit = originalExit;

      expect(exitCode).toBe(0);
    });
  });

  describe('should return exit code 1 for errors', () => {
    it('should exit with 1 for invalid backlog', async () => {
      const backlog = createValidBacklog();
      // Add orphaned dependency
      backlog.backlog[0].milestones[0].tasks[0].subtasks[0].dependencies = [
        'NONEXISTENT',
      ];
      await writeFile(tasksPath, JSON.stringify(backlog, null, 2));

      const command = new ValidateStateCommand(testDir, prdPath);

      // Mock process.exit
      const originalExit = process.exit;
      let exitCode = 0;
      process.exit = (code?: number) => {
        exitCode = code ?? 0;
        throw new Error('exit');
      };

      try {
        await command.execute({
          output: 'json',
          file: tasksPath,
          autoRepair: false,
          backup: true,
          maxBackups: 5,
        });
      } catch (e) {
        // Expected exit
      }

      process.exit = originalExit;

      expect(exitCode).toBe(1);
    });
  });
});
