/**
 * Unit tests for scope parsing and resolution functions
 *
 * @remarks
 * Tests validate all utility functions in src/core/scope-resolver.ts with 100% coverage.
 * Tests follow the Setup/Execute/Verify pattern with comprehensive edge case coverage.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  parseScope,
  resolveScope,
  isScopeType,
  isScope,
  ScopeParseError,
  type Scope,
  type ScopeType,
} from '../../../src/core/scope-resolver.js';
import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
} from '../../../src/core/models.js';
import type { HierarchyItem } from '../../../src/utils/task-utils.js';

// Test fixtures
const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

const createTestTask = (
  id: string,
  title: string,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task',
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
  type: 'Milestone',
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
  type: 'Phase',
  title,
  status: 'Planned',
  description: 'Test phase description',
  milestones,
});

const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});

// Comprehensive test backlog with multiple levels
const createComplexBacklog = (): Backlog => {
  const subtask1: Subtask = createTestSubtask(
    'P1.M1.T1.S1',
    'Subtask 1',
    'Complete'
  );
  const subtask2: Subtask = createTestSubtask(
    'P1.M1.T1.S2',
    'Subtask 2',
    'Planned'
  );
  const subtask3: Subtask = createTestSubtask(
    'P1.M1.T2.S1',
    'Subtask 3',
    'Planned'
  );
  const subtask4: Subtask = createTestSubtask(
    'P1.M2.T1.S1',
    'Subtask 4',
    'Planned'
  );
  const subtask5: Subtask = createTestSubtask(
    'P2.M1.T1.S1',
    'Subtask 5',
    'Planned'
  );

  const task1: Task = createTestTask('P1.M1.T1', 'Task 1', [
    subtask1,
    subtask2,
  ]);
  const task2: Task = createTestTask('P1.M1.T2', 'Task 2', [subtask3]);
  const task3: Task = createTestTask('P1.M2.T1', 'Task 3', [subtask4]);
  const task4: Task = createTestTask('P2.M1.T1', 'Task 4', [subtask5]);

  const milestone1: Milestone = createTestMilestone('P1.M1', 'Milestone 1', [
    task1,
    task2,
  ]);
  const milestone2: Milestone = createTestMilestone('P1.M2', 'Milestone 2', [
    task3,
  ]);
  const milestone3: Milestone = createTestMilestone('P2.M1', 'Milestone 3', [
    task4,
  ]);

  const phase1: Phase = createTestPhase('P1', 'Phase 1', [
    milestone1,
    milestone2,
  ]);
  const phase2: Phase = createTestPhase('P2', 'Phase 2', [milestone3]);

  return createTestBacklog([phase1, phase2]);
};

describe('core/scope-resolver', () => {
  describe('ScopeType', () => {
    describe('GIVEN a valid scope type value', () => {
      it('SHOULD pass isScopeType type guard', () => {
        expect(isScopeType('phase')).toBe(true);
        expect(isScopeType('milestone')).toBe(true);
        expect(isScopeType('task')).toBe(true);
        expect(isScopeType('subtask')).toBe(true);
        expect(isScopeType('all')).toBe(true);
      });
    });

    describe('GIVEN an invalid scope type value', () => {
      it('SHOULD fail isScopeType type guard', () => {
        expect(isScopeType('invalid')).toBe(false);
        expect(isScopeType('Phase')).toBe(false); // Case sensitive
        expect(isScopeType('')).toBe(false);
        expect(isScopeType(null)).toBe(false);
        expect(isScopeType(undefined)).toBe(false);
      });
    });
  });

  describe('Scope interface', () => {
    describe('GIVEN a valid Scope object', () => {
      it('SHOULD pass isScope type guard for "all" type', () => {
        const scope: Scope = { type: 'all' };
        expect(isScope(scope)).toBe(true);
      });

      it('SHOULD pass isScope type guard for scoped types with id', () => {
        const phaseScope: Scope = { type: 'phase', id: 'P1' };
        expect(isScope(phaseScope)).toBe(true);

        const milestoneScope: Scope = { type: 'milestone', id: 'P1.M1' };
        expect(isScope(milestoneScope)).toBe(true);
      });
    });

    describe('GIVEN an invalid Scope object', () => {
      it('SHOULD fail isScope type guard for non-object', () => {
        expect(isScope(null)).toBe(false);
        expect(isScope(undefined)).toBe(false);
        expect(isScope('string')).toBe(false);
        expect(isScope(123)).toBe(false);
      });

      it('SHOULD fail isScope type guard for invalid type', () => {
        expect(isScope({ type: 'invalid' })).toBe(false);
      });

      it('SHOULD fail isScope type guard for missing id when type is not "all"', () => {
        expect(isScope({ type: 'phase' })).toBe(false);
        expect(isScope({ type: 'milestone' })).toBe(false);
      });
    });
  });

  describe('ScopeParseError', () => {
    describe('GIVEN a ScopeParseError instance', () => {
      it('SHOULD have correct name and message', () => {
        const error = new ScopeParseError('invalid', 'valid format');
        expect(error.name).toBe('ScopeParseError');
        expect(error.message).toContain('invalid');
        expect(error.message).toContain('valid format');
      });

      it('SHOULD have context properties', () => {
        const error = new ScopeParseError('XYZ', 'P1');
        expect(error.invalidInput).toBe('XYZ');
        expect(error.expectedFormat).toBe('P1');
      });

      it('SHOULD convert to string correctly', () => {
        const error = new ScopeParseError('test', 'expected');
        const str = error.toString();
        expect(str).toContain('ScopeParseError');
        expect(str).toContain('test');
      });
    });
  });

  describe('parseScope()', () => {
    describe('GIVEN a valid scope string', () => {
      it('SHOULD parse "all" correctly', () => {
        const result = parseScope('all');
        expect(result).toEqual({ type: 'all' });
        expect(result.type).toBe('all');
        expect(result.id).toBeUndefined();
      });

      it('SHOULD parse phase scope "P1"', () => {
        const result = parseScope('P1');
        expect(result).toEqual({ type: 'phase', id: 'P1' });
      });

      it('SHOULD parse phase scope "P10"', () => {
        const result = parseScope('P10');
        expect(result).toEqual({ type: 'phase', id: 'P10' });
      });

      it('SHOULD parse milestone scope "P1.M1"', () => {
        const result = parseScope('P1.M1');
        expect(result).toEqual({ type: 'milestone', id: 'P1.M1' });
      });

      it('SHOULD parse milestone scope "P10.M5"', () => {
        const result = parseScope('P10.M5');
        expect(result).toEqual({ type: 'milestone', id: 'P10.M5' });
      });

      it('SHOULD parse task scope "P1.M1.T1"', () => {
        const result = parseScope('P1.M1.T1');
        expect(result).toEqual({ type: 'task', id: 'P1.M1.T1' });
      });

      it('SHOULD parse task scope "P2.M3.T10"', () => {
        const result = parseScope('P2.M3.T10');
        expect(result).toEqual({ type: 'task', id: 'P2.M3.T10' });
      });

      it('SHOULD parse subtask scope "P1.M1.T1.S1"', () => {
        const result = parseScope('P1.M1.T1.S1');
        expect(result).toEqual({ type: 'subtask', id: 'P1.M1.T1.S1' });
      });

      it('SHOULD parse subtask scope "P5.M10.T20.S99"', () => {
        const result = parseScope('P5.M10.T20.S99');
        expect(result).toEqual({ type: 'subtask', id: 'P5.M10.T20.S99' });
      });

      it('SHOULD trim whitespace', () => {
        const result = parseScope('  P1  ');
        expect(result).toEqual({ type: 'phase', id: 'P1' });
      });

      it('SHOULD handle case "all" with whitespace', () => {
        const result = parseScope('  all  ');
        expect(result).toEqual({ type: 'all' });
      });
    });

    describe('GIVEN an invalid scope string', () => {
      it('SHOULD throw ScopeParseError for empty string', () => {
        expect(() => parseScope('')).toThrow(ScopeParseError);
        expect(() => parseScope('')).toThrow('non-empty scope string');
      });

      it('SHOULD throw ScopeParseError for whitespace only', () => {
        expect(() => parseScope('   ')).toThrow(ScopeParseError);
      });

      it('SHOULD throw ScopeParseError for invalid format', () => {
        expect(() => parseScope('XYZ')).toThrow(ScopeParseError);
        expect(() => parseScope('XYZ')).toThrow('phase format');
      });

      it('SHOULD throw ScopeParseError for lowercase "p1"', () => {
        expect(() => parseScope('p1')).toThrow(ScopeParseError);
      });

      it('SHOULD throw ScopeParseError for malformed milestone "P1.X1"', () => {
        expect(() => parseScope('P1.X1')).toThrow(ScopeParseError);
        expect(() => parseScope('P1.X1')).toThrow('milestone format');
      });

      it('SHOULD throw ScopeParseError for malformed task "P1.M1.X1"', () => {
        expect(() => parseScope('P1.M1.X1')).toThrow(ScopeParseError);
        expect(() => parseScope('P1.M1.X1')).toThrow('task format');
      });

      it('SHOULD throw ScopeParseError for malformed subtask "P1.M1.T1.X1"', () => {
        expect(() => parseScope('P1.M1.T1.X1')).toThrow(ScopeParseError);
        expect(() => parseScope('P1.M1.T1.X1')).toThrow('subtask format');
      });

      it('SHOULD throw ScopeParseError for too many components', () => {
        expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow(ScopeParseError);
        expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow(
          'valid scope format'
        );
      });

      it('SHOULD throw ScopeParseError for missing numbers', () => {
        expect(() => parseScope('P')).toThrow(ScopeParseError);
        expect(() => parseScope('P.M')).toThrow(ScopeParseError);
        expect(() => parseScope('P.M.T')).toThrow(ScopeParseError);
        expect(() => parseScope('P.M.T.S')).toThrow(ScopeParseError);
      });

      it('SHOULD include expected format in error message', () => {
        try {
          parseScope('invalid');
        } catch (error) {
          expect(error).toBeInstanceOf(ScopeParseError);
          if (error instanceof ScopeParseError) {
            expect(error.expectedFormat).toBeDefined();
            expect(error.invalidInput).toBe('invalid');
          }
        }
      });

      it('SHOULD preserve input in error context', () => {
        try {
          parseScope('P1.INVALID');
        } catch (error) {
          if (error instanceof ScopeParseError) {
            expect(error.invalidInput).toBe('P1.INVALID');
          }
        }
      });
    });

    describe('GIVEN edge cases', () => {
      it('SHOULD handle single digit phase numbers', () => {
        const result = parseScope('P0');
        expect(result.type).toBe('phase');
        expect(result.id).toBe('P0');
      });

      it('SHOULD handle large numbers', () => {
        const result = parseScope('P999.M999.T999.S999');
        expect(result.type).toBe('subtask');
        expect(result.id).toBe('P999.M999.T999.S999');
      });
    });
  });

  describe('resolveScope()', () => {
    const testBacklog = createComplexBacklog();

    describe('GIVEN "all" scope', () => {
      it('SHOULD return all leaf subtasks', () => {
        const scope: Scope = { type: 'all' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toHaveLength(5); // S1, S2, S3, S4, S5
        expect(result.every(item => item.type === 'Subtask')).toBe(true);
      });

      it('SHOULD return empty array for empty backlog', () => {
        const emptyBacklog: Backlog = createTestBacklog([]);
        const scope: Scope = { type: 'all' };
        const result = resolveScope(emptyBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return subtasks from all phases', () => {
        const scope: Scope = { type: 'all' };
        const result = resolveScope(testBacklog, scope);

        const ids = result.map(item => item.id);
        expect(ids).toContain('P1.M1.T1.S1');
        expect(ids).toContain('P1.M1.T1.S2');
        expect(ids).toContain('P1.M1.T2.S1');
        expect(ids).toContain('P1.M2.T1.S1');
        expect(ids).toContain('P2.M1.T1.S1');
      });
    });

    describe('GIVEN phase scope', () => {
      it('SHOULD return phase and all descendants', () => {
        const scope: Scope = { type: 'phase', id: 'P1' };
        const result = resolveScope(testBacklog, scope);

        expect(result.length).toBeGreaterThan(0);
        // First item should be the phase itself
        expect(result[0].id).toBe('P1');
        expect(result[0].type).toBe('Phase');
      });

      it('SHOULD return phase, milestones, tasks, and subtasks', () => {
        const scope: Scope = { type: 'phase', id: 'P1' };
        const result = resolveScope(testBacklog, scope);

        const types = new Set(result.map(item => item.type));
        expect(types.has('Phase')).toBe(true);
        expect(types.has('Milestone')).toBe(true);
        expect(types.has('Task')).toBe(true);
        expect(types.has('Subtask')).toBe(true);
      });

      it('SHOULD preserve DFS pre-order traversal', () => {
        const scope: Scope = { type: 'phase', id: 'P1' };
        const result = resolveScope(testBacklog, scope);

        // Phase should be first
        expect(result[0].id).toBe('P1');
        // Milestone M1 should come before M2
        const m1Index = result.findIndex(item => item.id === 'P1.M1');
        const m2Index = result.findIndex(item => item.id === 'P1.M2');
        expect(m1Index).toBeLessThan(m2Index);
      });

      it('SHOULD return correct items for P2 phase', () => {
        const scope: Scope = { type: 'phase', id: 'P2' };
        const result = resolveScope(testBacklog, scope);

        expect(result[0].id).toBe('P2');
        expect(result[0].type).toBe('Phase');
        expect(result).toHaveLength(4); // P2, M1, T1, S1
      });
    });

    describe('GIVEN milestone scope', () => {
      it('SHOULD return milestone and all descendants', () => {
        const scope: Scope = { type: 'milestone', id: 'P1.M1' };
        const result = resolveScope(testBacklog, scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1.M1');
        expect(result[0].type).toBe('Milestone');
      });

      it('SHOULD return milestone, tasks, and subtasks', () => {
        const scope: Scope = { type: 'milestone', id: 'P1.M1' };
        const result = resolveScope(testBacklog, scope);

        const types = new Set(result.map(item => item.type));
        expect(types.has('Milestone')).toBe(true);
        expect(types.has('Task')).toBe(true);
        expect(types.has('Subtask')).toBe(true);
        // Should not include Phase
        expect(types.has('Phase')).toBe(false);
      });

      it('SHOULD preserve DFS pre-order traversal within milestone', () => {
        const scope: Scope = { type: 'milestone', id: 'P1.M1' };
        const result = resolveScope(testBacklog, scope);

        // Milestone should be first
        expect(result[0].id).toBe('P1.M1');
        // Task T1 should come before T2
        const t1Index = result.findIndex(item => item.id === 'P1.M1.T1');
        const t2Index = result.findIndex(item => item.id === 'P1.M1.T2');
        expect(t1Index).toBeLessThan(t2Index);
      });

      it('SHOULD return correct items for P1.M2 milestone', () => {
        const scope: Scope = { type: 'milestone', id: 'P1.M2' };
        const result = resolveScope(testBacklog, scope);

        expect(result[0].id).toBe('P1.M2');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('GIVEN task scope', () => {
      it('SHOULD return task and subtasks', () => {
        const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
        const result = resolveScope(testBacklog, scope);

        expect(result.length).toBe(3); // Task + 2 subtasks
        expect(result[0].id).toBe('P1.M1.T1');
        expect(result[0].type).toBe('Task');
      });

      it('SHOULD return subtasks after task', () => {
        const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
        const result = resolveScope(testBacklog, scope);

        expect(result[1].type).toBe('Subtask');
        expect(result[2].type).toBe('Subtask');
        expect(result[1].id).toBe('P1.M1.T1.S1');
        expect(result[2].id).toBe('P1.M1.T1.S2');
      });

      it('SHOULD return correct items for task with single subtask', () => {
        const scope: Scope = { type: 'task', id: 'P1.M1.T2' };
        const result = resolveScope(testBacklog, scope);

        expect(result.length).toBe(2); // Task + 1 subtask
        expect(result[0].id).toBe('P1.M1.T2');
        expect(result[1].id).toBe('P1.M1.T2.S1');
      });
    });

    describe('GIVEN subtask scope', () => {
      it('SHOULD return single subtask', () => {
        const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S1' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('P1.M1.T1.S1');
        expect(result[0].type).toBe('Subtask');
      });

      it('SHOULD return only the subtask, not parent task', () => {
        const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S2' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('P1.M1.T1.S2');
        expect(result[0].type).toBe('Subtask');
      });
    });

    describe('GIVEN non-existent ID', () => {
      it('SHOULD return empty array for non-existent phase', () => {
        const scope: Scope = { type: 'phase', id: 'P999' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for non-existent milestone', () => {
        const scope: Scope = { type: 'milestone', id: 'P1.M999' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for non-existent task', () => {
        const scope: Scope = { type: 'task', id: 'P1.M1.T999' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for non-existent subtask', () => {
        const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S999' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for completely invalid ID', () => {
        const scope: Scope = { type: 'phase', id: 'INVALID' };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });
    });

    describe('GIVEN empty backlog', () => {
      it('SHOULD return empty array for phase scope', () => {
        const emptyBacklog: Backlog = createTestBacklog([]);
        const scope: Scope = { type: 'phase', id: 'P1' };
        const result = resolveScope(emptyBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for "all" scope', () => {
        const emptyBacklog: Backlog = createTestBacklog([]);
        const scope: Scope = { type: 'all' };
        const result = resolveScope(emptyBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for any scope type', () => {
        const emptyBacklog: Backlog = createTestBacklog([]);
        const allScope: Scope = { type: 'all' };
        const phaseScope: Scope = { type: 'phase', id: 'P1' };
        const taskScope: Scope = { type: 'task', id: 'P1.M1.T1' };

        expect(resolveScope(emptyBacklog, allScope)).toEqual([]);
        expect(resolveScope(emptyBacklog, phaseScope)).toEqual([]);
        expect(resolveScope(emptyBacklog, taskScope)).toEqual([]);
      });
    });

    describe('GIVEN scope without id (edge case)', () => {
      it('SHOULD return empty array for phase type without id', () => {
        // This is technically an invalid Scope object, but we handle it gracefully
        const scope = { type: 'phase' as ScopeType };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for milestone type without id', () => {
        const scope = { type: 'milestone' as ScopeType };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for task type without id', () => {
        const scope = { type: 'task' as ScopeType };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });

      it('SHOULD return empty array for subtask type without id', () => {
        const scope = { type: 'subtask' as ScopeType };
        const result = resolveScope(testBacklog, scope);

        expect(result).toEqual([]);
      });
    });

    describe('GIVEN single item hierarchies', () => {
      it('SHOULD handle backlog with only one phase', () => {
        const phase = createTestPhase('P1', 'Single Phase');
        const backlog = createTestBacklog([phase]);
        const scope: Scope = { type: 'phase', id: 'P1' };
        const result = resolveScope(backlog, scope);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('P1');
      });

      it('SHOULD handle backlog with only one milestone', () => {
        const subtask = createTestSubtask('P1.M1.T1.S1', 'S1');
        const task = createTestTask('P1.M1.T1', 'T1', [subtask]);
        const milestone = createTestMilestone('P1.M1', 'M1', [task]);
        const phase = createTestPhase('P1', 'P1', [milestone]);
        const backlog = createTestBacklog([phase]);
        const scope: Scope = { type: 'milestone', id: 'P1.M1' };
        const result = resolveScope(backlog, scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1.M1');
      });

      it('SHOULD handle backlog with only one task', () => {
        const subtask = createTestSubtask('P1.M1.T1.S1', 'S1');
        const task = createTestTask('P1.M1.T1', 'T1', [subtask]);
        const milestone = createTestMilestone('P1.M1', 'M1', [task]);
        const phase = createTestPhase('P1', 'P1', [milestone]);
        const backlog = createTestBacklog([phase]);
        const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
        const result = resolveScope(backlog, scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1.M1.T1');
      });

      it('SHOULD handle backlog with only one subtask', () => {
        const subtask = createTestSubtask('P1.M1.T1.S1', 'S1');
        const task = createTestTask('P1.M1.T1', 'T1', [subtask]);
        const milestone = createTestMilestone('P1.M1', 'M1', [task]);
        const phase = createTestPhase('P1', 'P1', [milestone]);
        const backlog = createTestBacklog([phase]);
        const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S1' };
        const result = resolveScope(backlog, scope);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('P1.M1.T1.S1');
      });
    });
  });

  describe('integration', () => {
    describe('GIVEN parse and resolve flow', () => {
      it('SHOULD parse and resolve "all" scope', () => {
        const scope = parseScope('all');
        const result = resolveScope(createComplexBacklog(), scope);

        expect(result.every(item => item.type === 'Subtask')).toBe(true);
        expect(result.length).toBe(5);
      });

      it('SHOULD parse and resolve phase scope', () => {
        const scope = parseScope('P1');
        const result = resolveScope(createComplexBacklog(), scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1');
        expect(result[0].type).toBe('Phase');
      });

      it('SHOULD parse and resolve milestone scope', () => {
        const scope = parseScope('P1.M1');
        const result = resolveScope(createComplexBacklog(), scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1.M1');
        expect(result[0].type).toBe('Milestone');
      });

      it('SHOULD parse and resolve task scope', () => {
        const scope = parseScope('P1.M1.T1');
        const result = resolveScope(createComplexBacklog(), scope);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('P1.M1.T1');
        expect(result[0].type).toBe('Task');
      });

      it('SHOULD parse and resolve subtask scope', () => {
        const scope = parseScope('P1.M1.T1.S1');
        const result = resolveScope(createComplexBacklog(), scope);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('P1.M1.T1.S1');
        expect(result[0].type).toBe('Subtask');
      });

      it('SHOULD handle invalid parse then resolve', () => {
        let scope: Scope;
        try {
          scope = parseScope('invalid');
        } catch (error) {
          // Expected to throw
          expect(error).toBeInstanceOf(ScopeParseError);
          return;
        }
        // Should not reach here
        expect(true).toBe(false);
      });
    });

    describe('GIVEN typical workflow scenarios', () => {
      it('SHOULD support getting all work for a milestone', () => {
        // Parse "P1.M1" to get milestone 1 of phase 1
        const scope = parseScope('P1.M1');
        const items = resolveScope(createComplexBacklog(), scope);

        // Should include milestone, its tasks, and their subtasks
        expect(items[0].id).toBe('P1.M1');
        expect(items.some(i => i.id === 'P1.M1.T1')).toBe(true);
        expect(items.some(i => i.id === 'P1.M1.T1.S1')).toBe(true);
      });

      it('SHOULD support getting all pending work', () => {
        // Parse "all" to get all leaf subtasks (the executable units)
        const scope = parseScope('all');
        const items = resolveScope(createComplexBacklog(), scope);

        // All should be subtasks
        expect(items.every(i => i.type === 'Subtask')).toBe(true);
        // Should have items from both phases
        const ids = items.map(i => i.id);
        expect(ids.some(i => i.startsWith('P1.'))).toBe(true);
        expect(ids.some(i => i.startsWith('P2.'))).toBe(true);
      });

      it('SHOULD support resuming from specific task', () => {
        // Parse "P1.M1.T2" to resume from task 2
        const scope = parseScope('P1.M1.T2');
        const items = resolveScope(createComplexBacklog(), scope);

        // First item should be the task
        expect(items[0].id).toBe('P1.M1.T2');
        // Followed by its subtasks
        expect(items[1].id).toBe('P1.M1.T2.S1');
      });

      it('SHOULD support executing single subtask', () => {
        // Parse specific subtask ID
        const scope = parseScope('P2.M1.T1.S1');
        const items = resolveScope(createComplexBacklog(), scope);

        // Should return just that one subtask
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('P2.M1.T1.S1');
      });
    });

    describe('GIVEN type safety with discriminated unions', () => {
      it('SHOULD narrow type correctly for "all" scope', () => {
        const scope = parseScope('all');
        if (scope.type === 'all') {
          // TypeScript should know id is undefined here
          expect(scope.id).toBeUndefined();
        }
      });

      it('SHOULD narrow type correctly for scoped types', () => {
        const scope = parseScope('P1');
        if (scope.type !== 'all') {
          // TypeScript should know id is string here
          expect(scope.id).toBeDefined();
          expect(typeof scope.id).toBe('string');
        }
      });

      it('SHOULD work with switch statement on type', () => {
        const scope = parseScope('P1.M1');
        let id: string | undefined;

        switch (scope.type) {
          case 'all':
            id = undefined;
            break;
          case 'phase':
          case 'milestone':
          case 'task':
          case 'subtask':
            id = scope.id;
            break;
        }

        expect(id).toBe('P1.M1');
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('SHOULD handle phase with no milestones', () => {
      const phase = createTestPhase('P1', 'Empty', []);
      const backlog = createTestBacklog([phase]);
      const scope: Scope = { type: 'phase', id: 'P1' };
      const result = resolveScope(backlog, scope);

      expect(result).toHaveLength(1); // Just the phase
      expect(result[0].id).toBe('P1');
    });

    it('SHOULD handle milestone with no tasks', () => {
      const milestone = createTestMilestone('P1.M1', 'Empty', []);
      const phase = createTestPhase('P1', 'P1', [milestone]);
      const backlog = createTestBacklog([phase]);
      const scope: Scope = { type: 'milestone', id: 'P1.M1' };
      const result = resolveScope(backlog, scope);

      expect(result).toHaveLength(1); // Just the milestone
      expect(result[0].id).toBe('P1.M1');
    });

    it('SHOULD handle task with no subtasks', () => {
      const task = createTestTask('P1.M1.T1', 'Empty', []);
      const milestone = createTestMilestone('P1.M1', 'M1', [task]);
      const phase = createTestPhase('P1', 'P1', [milestone]);
      const backlog = createTestBacklog([phase]);
      const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
      const result = resolveScope(backlog, scope);

      expect(result).toHaveLength(1); // Just the task
      expect(result[0].id).toBe('P1.M1.T1');
    });

    it('SHOULD handle "all" with no subtasks in backlog', () => {
      const task = createTestTask('P1.M1.T1', 'T1', []);
      const milestone = createTestMilestone('P1.M1', 'M1', [task]);
      const phase = createTestPhase('P1', 'P1', [milestone]);
      const backlog = createTestBacklog([phase]);
      const scope: Scope = { type: 'all' };
      const result = resolveScope(backlog, scope);

      expect(result).toEqual([]); // No leaf subtasks exist
    });

    it('SHOULD handle multiple phases correctly', () => {
      const phase1 = createTestPhase('P1', 'Phase 1');
      const phase2 = createTestPhase('P2', 'Phase 2');
      const phase3 = createTestPhase('P3', 'Phase 3');
      const backlog = createTestBacklog([phase1, phase2, phase3]);

      const scope1 = parseScope('P1');
      const scope2 = parseScope('P2');
      const scope3 = parseScope('P3');

      expect(resolveScope(backlog, scope1)[0].id).toBe('P1');
      expect(resolveScope(backlog, scope2)[0].id).toBe('P2');
      expect(resolveScope(backlog, scope3)[0].id).toBe('P3');
    });

    it('SHOULD preserve immutability of backlog', () => {
      const backlog = createComplexBacklog();
      const originalJSON = JSON.stringify(backlog);

      const scope = parseScope('all');
      resolveScope(backlog, scope);

      expect(JSON.stringify(backlog)).toEqual(originalJSON);
    });
  });
});
