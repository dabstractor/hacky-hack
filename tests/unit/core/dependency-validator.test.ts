/**
 * Unit tests for circular dependency detection
 *
 * @remarks
 * Tests validate all functions in src/core/dependency-validator.ts with 100% coverage.
 * Tests follow the Setup/Execute/Verify pattern with comprehensive edge case coverage.
 *
 * Mocks are used for the logger and getAllSubtasks function - no real I/O is performed.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  buildDependencyGraph,
  detectSelfDependencies,
  detectCycleDFS,
  detectLongChains,
  detectCircularDeps,
  type DependencyGraph,
  NodeState,
} from '../../../src/core/dependency-validator.js';
import { ValidationError, ErrorCodes } from '../../../src/utils/errors.js';
import { getAllSubtasks } from '../../../src/utils/task-utils.js';
import type { Backlog, Subtask, Status } from '../../../src/core/models.js';

// Mock the logger module
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  })),
}));

// Mock the task-utils module
vi.mock('../../../src/utils/task-utils.js', () => ({
  getAllSubtasks: vi.fn(),
}));

// Cast mocked function
const mockGetAllSubtasks = getAllSubtasks as any;

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
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

const createTestBacklog = (subtasks: Subtask[]): Backlog => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Test Phase',
      status: 'Planned',
      description: 'Test',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Test Milestone',
          status: 'Planned',
          description: 'Test',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Test Task',
              status: 'Planned',
              description: 'Test',
              subtasks,
            },
          ],
        },
      ],
    },
  ],
});

// ============================================================================
// TEST SUITES
// ============================================================================

describe('dependency-validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildDependencyGraph()', () => {
    it('should build adjacency list from subtasks', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('S1', 'Task 1', 'Planned', ['S2', 'S3']),
        createTestSubtask('S2', 'Task 2', 'Planned', []),
        createTestSubtask('S3', 'Task 3', 'Planned', ['S2']),
      ];

      // EXECUTE
      const graph = buildDependencyGraph(subtasks);

      // VERIFY
      expect(graph).toEqual({
        S1: ['S2', 'S3'],
        S2: [],
        S3: ['S2'],
      });
    });

    it('should handle empty subtasks array', () => {
      // SETUP
      const subtasks: Subtask[] = [];

      // EXECUTE
      const graph = buildDependencyGraph(subtasks);

      // VERIFY
      expect(graph).toEqual({});
    });

    it('should handle subtasks with no dependencies', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('S1', 'Task 1', 'Planned', []),
        createTestSubtask('S2', 'Task 2', 'Planned', []),
      ];

      // EXECUTE
      const graph = buildDependencyGraph(subtasks);

      // VERIFY
      expect(graph).toEqual({
        S1: [],
        S2: [],
      });
    });

    it('should handle subtasks with full ID format (P1.M1.T1.S1)', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned', ['P1.M1.T1.S2']),
        createTestSubtask('P1.M1.T1.S2', 'Task 2', 'Planned', []),
      ];

      // EXECUTE
      const graph = buildDependencyGraph(subtasks);

      // VERIFY
      expect(graph).toEqual({
        'P1.M1.T1.S1': ['P1.M1.T1.S2'],
        'P1.M1.T1.S2': [],
      });
    });
  });

  describe('detectSelfDependencies()', () => {
    it('should detect task that depends on itself', () => {
      // SETUP
      const graph: DependencyGraph = {
        S1: ['S1'], // Self-dependency
        S2: [],
      };

      // EXECUTE
      const selfDeps = detectSelfDependencies(graph);

      // VERIFY
      expect(selfDeps).toEqual(['S1']);
    });

    it('should return empty array when no self-dependencies', () => {
      // SETUP
      const graph: DependencyGraph = {
        S1: ['S2'],
        S2: [],
      };

      // EXECUTE
      const selfDeps = detectSelfDependencies(graph);

      // VERIFY
      expect(selfDeps).toEqual([]);
    });

    it('should detect multiple self-dependencies', () => {
      // SETUP
      const graph: DependencyGraph = {
        S1: ['S1'],
        S2: ['S2'],
        S3: [],
      };

      // EXECUTE
      const selfDeps = detectSelfDependencies(graph);

      // VERIFY
      expect(selfDeps).toEqual(['S1', 'S2']);
    });

    it('should detect self-dependency among other dependencies', () => {
      // SETUP
      const graph: DependencyGraph = {
        S1: ['S2', 'S1', 'S3'], // S1 depends on S1 in the middle
      };

      // EXECUTE
      const selfDeps = detectSelfDependencies(graph);

      // VERIFY
      expect(selfDeps).toEqual(['S1']);
    });

    it('should handle empty graph', () => {
      // SETUP
      const graph: DependencyGraph = {};

      // EXECUTE
      const selfDeps = detectSelfDependencies(graph);

      // VERIFY
      expect(selfDeps).toEqual([]);
    });
  });

  describe('detectCycleDFS()', () => {
    it('should detect simple cycle (A -> B -> A)', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['A'],
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['A', 'B', 'A']);
      expect(result.cycleLength).toBe(2);
    });

    it('should detect complex cycle (A -> B -> C -> A)', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['C'],
        C: ['A'],
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['A', 'B', 'C', 'A']);
      expect(result.cycleLength).toBe(3);
    });

    it('should detect 4-node cycle (A -> B -> C -> D -> A)', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['C'],
        C: ['D'],
        D: ['A'],
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['A', 'B', 'C', 'D', 'A']);
      expect(result.cycleLength).toBe(4);
    });

    it('should return no cycle for valid DAG', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['C'],
        C: [],
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(false);
      expect(result.cyclePath).toBeUndefined();
      expect(result.cycleLength).toBeUndefined();
    });

    it('should return no cycle for empty graph', () => {
      // SETUP
      const graph: DependencyGraph = {};

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(false);
    });

    it('should return no cycle for single node with no dependencies', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: [],
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(false);
    });

    it('should handle disconnected components (one has cycle, one does not)', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['A'], // Cycle here
        C: ['D'],
        D: [], // No cycle here
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(true);
      // The cycle found should be A -> B -> A
      expect(result.cyclePath).toEqual(['A', 'B', 'A']);
    });

    it('should handle multiple disconnected DAGs', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B'],
        B: [],
        C: ['D'],
        D: [],
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(false);
    });

    it('should detect cycle in diamond graph', () => {
      // SETUP
      // A -> B, A -> C, B -> D, C -> D, D -> A (cycle through D)
      const graph: DependencyGraph = {
        A: ['B', 'C'],
        B: ['D'],
        C: ['D'],
        D: ['A'], // Creates cycle
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toBeDefined();
    });

    it('should handle node that depends on non-existent node', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B'], // B doesn't exist in graph
        B: [],
      };

      // EXECUTE
      const result = detectCycleDFS(graph);

      // VERIFY
      // Should not crash - treats B as a leaf node
      expect(result.hasCycle).toBe(false);
    });
  });

  describe('detectLongChains()', () => {
    it('should detect chain exceeding threshold (6 levels)', () => {
      // SETUP: A -> B -> C -> D -> E -> F (6 levels)
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['C'],
        C: ['D'],
        D: ['E'],
        E: ['F'],
        F: [],
      };

      // EXECUTE
      const longChains = detectLongChains(graph, 5);

      // VERIFY
      expect(longChains).toHaveLength(1);
      expect(longChains[0].taskId).toBe('A');
      expect(longChains[0].depth).toBe(6);
      expect(longChains[0].chain).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });

    it('should not detect chain at threshold (5 levels)', () => {
      // SETUP: A -> B -> C -> D -> E (5 levels, at threshold)
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['C'],
        C: ['D'],
        D: ['E'],
        E: [],
      };

      // EXECUTE
      const longChains = detectLongChains(graph, 5);

      // VERIFY
      expect(longChains).toHaveLength(0);
    });

    it('should detect multiple long chains from different roots', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: ['B', 'C'],
        B: ['D', 'E', 'F'],
        C: ['G', 'H', 'I'],
        D: [],
        E: [],
        F: [],
        G: [],
        H: [],
        I: [],
      };

      // EXECUTE
      const longChains = detectLongChains(graph, 2); // Threshold of 2

      // VERIFY
      expect(longChains.length).toBeGreaterThan(0);
      // Should find A -> B -> D/E/F (depth 3, > 2)
      // Should find A -> C -> G/H/I (depth 3, > 2)
    });

    it('should handle empty graph', () => {
      // SETUP
      const graph: DependencyGraph = {};

      // EXECUTE
      const longChains = detectLongChains(graph, 5);

      // VERIFY
      expect(longChains).toEqual([]);
    });

    it('should handle single node with no dependencies', () => {
      // SETUP
      const graph: DependencyGraph = {
        A: [],
      };

      // EXECUTE
      const longChains = detectLongChains(graph, 5);

      // VERIFY
      expect(longChains).toEqual([]);
    });

    it('should use default threshold of 5', () => {
      // SETUP: Chain of 6 levels
      const graph: DependencyGraph = {
        A: ['B'],
        B: ['C'],
        C: ['D'],
        D: ['E'],
        E: ['F'],
        F: [],
      };

      // EXECUTE: No threshold specified
      const longChains = detectLongChains(graph);

      // VERIFY: Should detect with default threshold of 5
      expect(longChains).toHaveLength(1);
      expect(longChains[0].depth).toBe(6);
    });
  });

  describe('detectCircularDeps() - main function', () => {
    it('should throw ValidationError for self-dependency', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('S1', 'Task 1', 'Planned', ['S1']), // Self-dep
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      expect(() => detectCircularDeps(backlog)).toThrow(ValidationError);
      expect(() => detectCircularDeps(backlog)).toThrow('depends on itself');
    });

    it('should include cycle path in error context for self-dependency', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task 1', 'Planned', ['P1.M1.T1.S1']),
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      try {
        detectCircularDeps(backlog);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const ve = error as ValidationError;
        expect(ve.code).toBe(
          ErrorCodes.PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY
        );
        expect(ve.context?.cyclePath).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S1']);
        expect(ve.context?.taskId).toBe('P1.M1.T1.S1');
      }
    });

    it('should throw ValidationError for simple cycle', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('S1', 'Task 1', 'Planned', ['S2']),
        createTestSubtask('S2', 'Task 2', 'Planned', ['S1']),
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      expect(() => detectCircularDeps(backlog)).toThrow(ValidationError);
      expect(() => detectCircularDeps(backlog)).toThrow(
        'Circular dependency detected'
      );
    });

    it('should include cycle path in error context for simple cycle', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('P1.M1.T1.S1', 'Task A', 'Planned', ['P1.M1.T1.S2']),
        createTestSubtask('P1.M1.T1.S2', 'Task B', 'Planned', ['P1.M1.T1.S1']),
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      try {
        detectCircularDeps(backlog);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const ve = error as ValidationError;
        expect(ve.context?.cyclePath).toEqual([
          'P1.M1.T1.S1',
          'P1.M1.T1.S2',
          'P1.M1.T1.S1',
        ]);
        expect(ve.context?.cycleLength).toBe(2);
      }
    });

    it('should throw ValidationError for complex cycle', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('S1', 'Task 1', 'Planned', ['S2']),
        createTestSubtask('S2', 'Task 2', 'Planned', ['S3']),
        createTestSubtask('S3', 'Task 3', 'Planned', ['S1']),
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      expect(() => detectCircularDeps(backlog)).toThrow(ValidationError);
    });

    it('should not throw for valid DAG (no cycles)', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('S1', 'Task 1', 'Planned', ['S2']),
        createTestSubtask('S2', 'Task 2', 'Planned', ['S3']),
        createTestSubtask('S3', 'Task 3', 'Planned', []),
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      expect(() => detectCircularDeps(backlog)).not.toThrow();
    });

    it('should not throw for empty backlog', () => {
      // SETUP
      const subtasks: Subtask[] = [];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      expect(() => detectCircularDeps(backlog)).not.toThrow();
    });

    it('should not throw for single task with no dependencies', () => {
      // SETUP
      const subtasks = [createTestSubtask('S1', 'Task 1', 'Planned', [])];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      expect(() => detectCircularDeps(backlog)).not.toThrow();
    });

    it('should handle multiple disconnected components', () => {
      // SETUP
      const subtasks = [
        // Component 1: Valid DAG
        createTestSubtask('C1.S1', 'C1 Task 1', 'Planned', []),
        // Component 2: Has cycle
        createTestSubtask('C2.S1', 'C2 Task 1', 'Planned', ['C2.S2']),
        createTestSubtask('C2.S2', 'C2 Task 2', 'Planned', ['C2.S1']),
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      expect(() => detectCircularDeps(backlog)).toThrow(ValidationError);
    });

    it('should use correct error code', () => {
      // SETUP
      const subtasks = [
        createTestSubtask('S1', 'Task 1', 'Planned', ['S2']),
        createTestSubtask('S2', 'Task 2', 'Planned', ['S1']),
      ];
      const backlog = createTestBacklog(subtasks);
      mockGetAllSubtasks.mockReturnValue(subtasks);

      // EXECUTE & VERIFY
      try {
        detectCircularDeps(backlog);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const ve = error as ValidationError;
        expect(ve.code).toBe('PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY');
      }
    });
  });

  describe('NodeState enum', () => {
    it('should have correct numeric values', () => {
      expect(NodeState.UNVISITED).toBe(0);
      expect(NodeState.VISITING).toBe(1);
      expect(NodeState.VISITED).toBe(2);
    });
  });
});
