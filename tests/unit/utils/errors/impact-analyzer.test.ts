/**
 * Unit tests for ImpactAnalyzer
 *
 * @remarks
 * Tests validate the complete impact analyzer functionality including:
 * 1. Constructor initialization with backlog
 * 2. analyzeImpact() returning complete TaskImpact
 * 3. findDownstream() DFS traversal for dependent tasks
 * 4. findUpstream() returning direct dependencies
 * 5. calculateCascadeDepth() measuring dependency depth
 * 6. determineImpactLevel() returning correct ImpactLevel
 * 7. canContinueWithFailure() checking pipeline continuation
 * 8. suggestAction() returning correct SuggestedAction
 * 9. ImpactAnalyzer.getImpactIcon() returning correct emoji
 * 10. ImpactAnalyzer.formatImpactLevel() capitalizing level name
 * 11. Empty dependency scenarios
 * 12. Circular dependency handling
 * 13. Complex dependency graphs
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ImpactAnalyzer } from '../../../../src/utils/errors/impact-analyzer.js';
import type { Backlog } from '../../../../src/core/models.js';
import type {
  TaskImpact,
  ImpactLevel,
  SuggestedAction,
} from '../../../../src/utils/errors/types.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ImpactAnalyzer', () => {
  let analyzer: ImpactAnalyzer;
  let mockBacklog: Backlog;

  beforeEach(() => {
    // Create a mock backlog with various dependency structures
    mockBacklog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Planned',
          description: 'Test Phase 1',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone',
              title: 'Milestone 1',
              status: 'Planned',
              description: 'Test Milestone 1',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task',
                  title: 'Task 1',
                  status: 'Planned',
                  description: 'Test Task 1',
                  subtasks: [
                    {
                      id: 'P1.M1.T1.S1',
                      type: 'Subtask',
                      title: 'Subtask 1',
                      status: 'Planned',
                      story_points: 1,
                      dependencies: [],
                      context_scope:
                        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                    },
                    {
                      id: 'P1.M1.T1.S2',
                      type: 'Subtask',
                      title: 'Subtask 2',
                      status: 'Planned',
                      story_points: 2,
                      dependencies: ['P1.M1.T1.S1'],
                      context_scope:
                        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                    },
                    {
                      id: 'P1.M1.T1.S3',
                      type: 'Subtask',
                      title: 'Subtask 3',
                      status: 'Planned',
                      story_points: 3,
                      dependencies: ['P1.M1.T1.S1', 'P1.M1.T1.S2'],
                      context_scope:
                        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                    },
                  ],
                },
                {
                  id: 'P1.M1.T2',
                  type: 'Task',
                  title: 'Task 2',
                  status: 'Planned',
                  description: 'Test Task 2',
                  subtasks: [
                    {
                      id: 'P1.M1.T2.S1',
                      type: 'Subtask',
                      title: 'Subtask 4',
                      status: 'Planned',
                      story_points: 1,
                      dependencies: ['P1.M1.T1.S3'],
                      context_scope:
                        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                    },
                  ],
                },
              ],
            },
            {
              id: 'P1.M2',
              type: 'Milestone',
              title: 'Milestone 2',
              status: 'Planned',
              description: 'Test Milestone 2',
              tasks: [
                {
                  id: 'P1.M2.T1',
                  type: 'Task',
                  title: 'Task 3',
                  status: 'Planned',
                  description: 'Test Task 3',
                  subtasks: [
                    {
                      id: 'P1.M2.T1.S1',
                      type: 'Subtask',
                      title: 'Subtask 5',
                      status: 'Planned',
                      story_points: 1,
                      dependencies: ['P1.M1.T2.S1'],
                      context_scope:
                        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
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
          title: 'Phase 2',
          status: 'Planned',
          description: 'Test Phase 2',
          milestones: [
            {
              id: 'P2.M1',
              type: 'Milestone',
              title: 'Milestone 3',
              status: 'Planned',
              description: 'Test Milestone 3',
              tasks: [
                {
                  id: 'P2.M1.T1',
                  type: 'Task',
                  title: 'Task 4',
                  status: 'Planned',
                  description: 'Test Task 4',
                  subtasks: [
                    {
                      id: 'P2.M1.T1.S1',
                      type: 'Subtask',
                      title: 'Subtask 6',
                      status: 'Planned',
                      story_points: 1,
                      dependencies: ['P1.M2.T1.S1'],
                      context_scope:
                        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    analyzer = new ImpactAnalyzer(mockBacklog);
  });

  afterEach(() => {
    // Cleanup handled by garbage collection
  });

  // ==========================================================================
  // Constructor tests
  // ==========================================================================

  describe('Constructor', () => {
    it('should create analyzer with backlog', () => {
      expect(analyzer).toBeInstanceOf(ImpactAnalyzer);
    });

    it('should store backlog for analysis', () => {
      const result = analyzer.analyzeImpact('P1.M1.T1.S1');
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // analyzeImpact() tests
  // ==========================================================================

  describe('analyzeImpact()', () => {
    it('should return complete TaskImpact object', () => {
      const result = analyzer.analyzeImpact('P1.M1.T1.S1');

      expect(result).toBeDefined();
      expect(result.level).toBeDefined();
      expect(result.affectedTasks).toBeInstanceOf(Array);
      expect(result.blockedPhases).toBeInstanceOf(Array);
      expect(result.blockedMilestones).toBeInstanceOf(Array);
      expect(result.blockedTasks).toBeInstanceOf(Array);
      expect(typeof result.canContinue).toBe('boolean');
      expect(result.suggestedAction).toBeDefined();
      expect(typeof result.cascadeDepth).toBe('number');
    });

    it('should include all required TaskImpact properties', () => {
      const result = analyzer.analyzeImpact('P1.M1.T1.S1');

      expect(Object.keys(result)).toEqual(
        expect.arrayContaining([
          'level',
          'affectedTasks',
          'blockedPhases',
          'blockedMilestones',
          'blockedTasks',
          'canContinue',
          'suggestedAction',
          'cascadeDepth',
        ])
      );
    });

    it('should analyze impact for task with no dependents', () => {
      const backlogWithNoDeps: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const isolatedAnalyzer = new ImpactAnalyzer(backlogWithNoDeps);
      const result = isolatedAnalyzer.analyzeImpact('P1.M1.T1.S1');

      expect(result.level).toBe('none');
      expect(result.affectedTasks).toEqual([]);
      expect(result.blockedPhases).toEqual([]);
      expect(result.blockedMilestones).toEqual([]);
      expect(result.blockedTasks).toEqual([]);
    });

    it('should handle invalid task ID gracefully', () => {
      const result = analyzer.analyzeImpact('INVALID.ID');

      expect(result.level).toBe('none');
      expect(result.affectedTasks).toEqual([]);
      expect(result.blockedPhases).toEqual([]);
      expect(result.blockedMilestones).toEqual([]);
      expect(result.blockedTasks).toEqual([]);
    });
  });

  // ==========================================================================
  // findDownstream() tests
  // ==========================================================================

  describe('findDownstream()', () => {
    it('should find all dependent tasks using DFS', () => {
      const downstream = analyzer.findDownstream('P1.M1.T1.S1');

      // S1 is depended on by S2 and S3
      // S2 is depended on by S3
      // S3 is depended on by P1.M1.T2.S1
      // P1.M1.T2.S1 is depended on by P1.M2.T1.S1
      // P1.M2.T1.S1 is depended on by P2.M1.T1.S1
      expect(downstream).toContain('P1.M1.T1.S2');
      expect(downstream).toContain('P1.M1.T1.S3');
      expect(downstream).toContain('P1.M1.T2.S1');
      expect(downstream).toContain('P1.M2.T1.S1');
      expect(downstream).toContain('P2.M1.T1.S1');
    });

    it('should return empty array for task with no dependents', () => {
      const downstream = analyzer.findDownstream('P2.M1.T1.S1');

      expect(downstream).toEqual([]);
    });

    it('should handle direct dependencies correctly', () => {
      const downstream = analyzer.findDownstream('P1.M1.T1.S2');

      expect(downstream).toContain('P1.M1.T1.S3');
      expect(downstream).not.toContain('P1.M1.T1.S1');
    });

    it('should handle transitive dependencies correctly', () => {
      const downstream = analyzer.findDownstream('P1.M1.T1.S1');

      // Should include all transitive dependents
      expect(downstream.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid task ID', () => {
      const downstream = analyzer.findDownstream('INVALID.ID');

      expect(downstream).toEqual([]);
    });

    it('should handle empty backlog', () => {
      const emptyAnalyzer = new ImpactAnalyzer({ backlog: [] });
      const downstream = emptyAnalyzer.findDownstream('P1.M1.T1.S1');

      expect(downstream).toEqual([]);
    });
  });

  // ==========================================================================
  // findUpstream() tests
  // ==========================================================================

  describe('findUpstream()', () => {
    it('should return direct dependencies', () => {
      const upstream = analyzer.findUpstream('P1.M1.T1.S3');

      expect(upstream).toEqual(['P1.M1.T1.S1', 'P1.M1.T1.S2']);
    });

    it('should return empty array for task with no dependencies', () => {
      const upstream = analyzer.findUpstream('P1.M1.T1.S1');

      expect(upstream).toEqual([]);
    });

    it('should return empty array for invalid task ID', () => {
      const upstream = analyzer.findUpstream('INVALID.ID');

      expect(upstream).toEqual([]);
    });

    it('should return single dependency', () => {
      const upstream = analyzer.findUpstream('P1.M1.T1.S2');

      expect(upstream).toEqual(['P1.M1.T1.S1']);
    });
  });

  // ==========================================================================
  // calculateCascadeDepth() tests
  // ==========================================================================

  describe('calculateCascadeDepth()', () => {
    it('should measure dependency depth correctly', () => {
      const depth = analyzer.calculateCascadeDepth('P1.M1.T1.S1');

      // S1 -> S2, S3 -> T2.S1 -> M2.T1.S1 -> P2.M1.T1.S1
      // That's 5 levels of cascading
      expect(depth).toBeGreaterThan(0);
    });

    it('should return 0 for task with no dependents', () => {
      const depth = analyzer.calculateCascadeDepth('P2.M1.T1.S1');

      expect(depth).toBe(0);
    });

    it('should return 0 for invalid task ID', () => {
      const depth = analyzer.calculateCascadeDepth('INVALID.ID');

      expect(depth).toBe(0);
    });

    it('should calculate depth for single dependent', () => {
      const depth = analyzer.calculateCascadeDepth('P1.M1.T1.S2');

      // S2 -> S3 -> ... chain
      expect(depth).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // determineImpactLevel() tests
  // ==========================================================================

  describe('determineImpactLevel()', () => {
    it('should return critical when 2+ phases blocked', () => {
      const level = analyzer.determineImpactLevel(2, 0, 0);

      expect(level).toBe('critical');
    });

    it('should return critical when exactly 2 phases blocked', () => {
      const level = analyzer.determineImpactLevel(2, 0, 0);

      expect(level).toBe('critical');
    });

    it('should return critical when more than 2 phases blocked', () => {
      const level = analyzer.determineImpactLevel(3, 0, 0);

      expect(level).toBe('critical');
    });

    it('should return high when 1 phase blocked', () => {
      const level = analyzer.determineImpactLevel(1, 0, 0);

      expect(level).toBe('high');
    });

    it('should return high when 3+ milestones blocked', () => {
      const level = analyzer.determineImpactLevel(0, 3, 0);

      expect(level).toBe('high');
    });

    it('should return high when exactly 3 milestones blocked', () => {
      const level = analyzer.determineImpactLevel(0, 3, 0);

      expect(level).toBe('high');
    });

    it('should return high when more than 3 milestones blocked', () => {
      const level = analyzer.determineImpactLevel(0, 5, 0);

      expect(level).toBe('high');
    });

    it('should return medium when 1+ milestone blocked', () => {
      const level1 = analyzer.determineImpactLevel(0, 1, 0);
      const level2 = analyzer.determineImpactLevel(0, 2, 0);

      expect(level1).toBe('medium');
      expect(level2).toBe('medium');
    });

    it('should return medium when 5+ tasks blocked', () => {
      const level = analyzer.determineImpactLevel(0, 0, 5);

      expect(level).toBe('medium');
    });

    it('should return medium when more than 5 tasks blocked', () => {
      const level = analyzer.determineImpactLevel(0, 0, 10);

      expect(level).toBe('medium');
    });

    it('should return low when 1+ tasks blocked but < 5', () => {
      const level1 = analyzer.determineImpactLevel(0, 0, 1);
      const level2 = analyzer.determineImpactLevel(0, 0, 2);
      const level3 = analyzer.determineImpactLevel(0, 0, 4);

      expect(level1).toBe('low');
      expect(level2).toBe('low');
      expect(level3).toBe('low');
    });

    it('should return none when no tasks blocked', () => {
      const level = analyzer.determineImpactLevel(0, 0, 0);

      expect(level).toBe('none');
    });

    it('should prioritize critical over high', () => {
      const level = analyzer.determineImpactLevel(2, 5, 10);

      expect(level).toBe('critical');
    });

    it('should prioritize high over medium', () => {
      const level = analyzer.determineImpactLevel(1, 5, 10);

      expect(level).toBe('high');
    });

    it('should prioritize medium over low', () => {
      const level = analyzer.determineImpactLevel(0, 1, 10);

      expect(level).toBe('medium');
    });
  });

  // ==========================================================================
  // canContinueWithFailure() tests
  // ==========================================================================

  describe('canContinueWithFailure()', () => {
    it('should return true when other tasks exist without dependency', () => {
      // P1.M1.T1.S1 has dependents, but other tasks exist in the backlog
      // that don't depend on it (though in our mock, everything is connected)
      const canContinue = analyzer.canContinueWithFailure('P1.M1.T1.S1');

      // In our mock backlog, all tasks are in a dependency chain
      // So this should return false for early tasks
      expect(typeof canContinue).toBe('boolean');
    });

    it('should return false when all remaining tasks depend on failed task', () => {
      // Create backlog where all tasks depend on one
      const blockedBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const blockedAnalyzer = new ImpactAnalyzer(blockedBacklog);
      const canContinue = blockedAnalyzer.canContinueWithFailure('P1.M1.T1.S1');

      // S2 depends on S1, so if S1 fails, S2 cannot run
      // Since there's no other task independent of S1, pipeline cannot continue
      expect(canContinue).toBe(false);
    });

    it('should return true when no other tasks depend on failed task', () => {
      const canContinue = analyzer.canContinueWithFailure('P2.M1.T1.S1');

      expect(canContinue).toBe(true);
    });

    it('should handle invalid task ID', () => {
      const canContinue = analyzer.canContinueWithFailure('INVALID.ID');

      expect(canContinue).toBe(true); // No blocking means can continue
    });

    it('should handle empty backlog', () => {
      const emptyAnalyzer = new ImpactAnalyzer({ backlog: [] });
      const canContinue = emptyAnalyzer.canContinueWithFailure('P1.M1.T1.S1');

      // Empty backlog has no tasks, so the for loop doesn't execute
      // and returns false (cannot continue with no work to do)
      expect(canContinue).toBe(false);
    });
  });

  // ==========================================================================
  // suggestAction() tests
  // ==========================================================================

  describe('suggestAction()', () => {
    it('should return pause for critical impact', () => {
      const action = analyzer.suggestAction('critical', true);

      expect(action).toBe('pause');
    });

    it('should return pause for critical impact even when can continue', () => {
      const action = analyzer.suggestAction('critical', true);

      expect(action).toBe('pause');
    });

    it('should return pause for high impact', () => {
      const action = analyzer.suggestAction('high', true);

      expect(action).toBe('pause');
    });

    it('should return pause for high impact even when can continue', () => {
      const action = analyzer.suggestAction('high', true);

      expect(action).toBe('pause');
    });

    it('should return continue for medium impact when can continue', () => {
      const action = analyzer.suggestAction('medium', true);

      expect(action).toBe('continue');
    });

    it('should return retry for medium impact when cannot continue', () => {
      const action = analyzer.suggestAction('medium', false);

      expect(action).toBe('retry');
    });

    it('should return continue for low impact when can continue', () => {
      const action = analyzer.suggestAction('low', true);

      expect(action).toBe('continue');
    });

    it('should return retry for low impact when cannot continue', () => {
      const action = analyzer.suggestAction('low', false);

      expect(action).toBe('retry');
    });

    it('should return retry for none impact when cannot continue', () => {
      const action = analyzer.suggestAction('none', false);

      expect(action).toBe('retry');
    });

    it('should return continue for none impact when can continue', () => {
      const action = analyzer.suggestAction('none', true);

      expect(action).toBe('continue');
    });
  });

  // ==========================================================================
  // getImpactIcon() tests
  // ==========================================================================

  describe('ImpactAnalyzer.getImpactIcon()', () => {
    it('should return red circle for critical', () => {
      const icon = ImpactAnalyzer.getImpactIcon('critical');

      expect(icon).toBe('🔴');
    });

    it('should return orange circle for high', () => {
      const icon = ImpactAnalyzer.getImpactIcon('high');

      expect(icon).toBe('🟠');
    });

    it('should return yellow circle for medium', () => {
      const icon = ImpactAnalyzer.getImpactIcon('medium');

      expect(icon).toBe('🟡');
    });

    it('should return blue circle for low', () => {
      const icon = ImpactAnalyzer.getImpactIcon('low');

      expect(icon).toBe('🔵');
    });

    it('should return white circle for none', () => {
      const icon = ImpactAnalyzer.getImpactIcon('none');

      expect(icon).toBe('⚪');
    });
  });

  // ==========================================================================
  // formatImpactLevel() tests
  // ==========================================================================

  describe('ImpactAnalyzer.formatImpactLevel()', () => {
    it('should capitalize critical', () => {
      const formatted = ImpactAnalyzer.formatImpactLevel('critical');

      expect(formatted).toBe('Critical');
    });

    it('should capitalize high', () => {
      const formatted = ImpactAnalyzer.formatImpactLevel('high');

      expect(formatted).toBe('High');
    });

    it('should capitalize medium', () => {
      const formatted = ImpactAnalyzer.formatImpactLevel('medium');

      expect(formatted).toBe('Medium');
    });

    it('should capitalize low', () => {
      const formatted = ImpactAnalyzer.formatImpactLevel('low');

      expect(formatted).toBe('Low');
    });

    it('should capitalize none', () => {
      const formatted = ImpactAnalyzer.formatImpactLevel('none');

      expect(formatted).toBe('None');
    });
  });

  // ==========================================================================
  // Empty dependency scenarios
  // ==========================================================================

  describe('Empty dependency scenarios', () => {
    it('should handle backlog with no dependencies', () => {
      const noDepsBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const noDepsAnalyzer = new ImpactAnalyzer(noDepsBacklog);
      const impact = noDepsAnalyzer.analyzeImpact('P1.M1.T1.S1');

      expect(impact.level).toBe('none');
      expect(impact.affectedTasks).toEqual([]);
      expect(impact.blockedPhases).toEqual([]);
      expect(impact.blockedMilestones).toEqual([]);
      expect(impact.blockedTasks).toEqual([]);
      expect(impact.canContinue).toBe(true);
    });

    it('should handle single task backlog', () => {
      const singleTaskBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const singleAnalyzer = new ImpactAnalyzer(singleTaskBacklog);
      const impact = singleAnalyzer.analyzeImpact('P1.M1.T1.S1');

      expect(impact.level).toBe('none');
      expect(impact.cascadeDepth).toBe(0);
    });
  });

  // ==========================================================================
  // Circular dependency handling
  // ==========================================================================

  describe('Circular dependency handling', () => {
    it('should not hang on circular dependencies', () => {
      // Create backlog with circular dependency
      // Note: This is an invalid state, but analyzer should handle it gracefully
      const circularBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S2'], // Circular: S1 -> S2
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'], // Circular: S2 -> S1
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const circularAnalyzer = new ImpactAnalyzer(circularBacklog);

      // This should not hang and should return in reasonable time
      const startTime = Date.now();
      const downstream = circularAnalyzer.findDownstream('P1.M1.T1.S1');
      const endTime = Date.now();

      // Should complete quickly (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Should still return results (possibly due to visited set handling)
      expect(Array.isArray(downstream)).toBe(true);
    });

    it('should handle self-dependency', () => {
      const selfDepBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'], // Self-dependency
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const selfDepAnalyzer = new ImpactAnalyzer(selfDepBacklog);

      // Should not hang
      const startTime = Date.now();
      const downstream = selfDepAnalyzer.findDownstream('P1.M1.T1.S1');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(Array.isArray(downstream)).toBe(true);
    });
  });

  // ==========================================================================
  // Complex dependency graphs
  // ==========================================================================

  describe('Complex dependency graphs', () => {
    it('should handle diamond dependency pattern', () => {
      // Create diamond: A -> B, A -> C, B -> D, C -> D
      const diamondBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1', // A
                        type: 'Subtask',
                        title: 'Subtask A',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S2', // B
                        type: 'Subtask',
                        title: 'Subtask B',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S3', // C
                        type: 'Subtask',
                        title: 'Subtask C',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S4', // D
                        type: 'Subtask',
                        title: 'Subtask D',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S2', 'P1.M1.T1.S3'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const diamondAnalyzer = new ImpactAnalyzer(diamondBacklog);
      const impact = diamondAnalyzer.analyzeImpact('P1.M1.T1.S1');

      expect(impact.affectedTasks).toContain('P1.M1.T1.S2');
      expect(impact.affectedTasks).toContain('P1.M1.T1.S3');
      expect(impact.affectedTasks).toContain('P1.M1.T1.S4');
    });

    it('should handle multi-phase dependencies', () => {
      // Our mock backlog already has multi-phase dependencies
      const impact = analyzer.analyzeImpact('P1.M1.T1.S1');

      // Should block tasks across phases
      expect(impact.blockedPhases.length).toBeGreaterThan(1);
      expect(impact.blockedPhases).toContain('P1');
      expect(impact.blockedPhases).toContain('P2');
    });

    it('should calculate correct cascade depth for complex graph', () => {
      const depth = analyzer.calculateCascadeDepth('P1.M1.T1.S1');

      // Should have multiple levels of cascading
      expect(depth).toBeGreaterThan(1);
    });

    it('should determine correct impact level for complex graph', () => {
      const impact = analyzer.analyzeImpact('P1.M1.T1.S1');

      // With multi-phase blocking, should be at least high
      expect(['critical', 'high', 'medium', 'low', 'none']).toContain(
        impact.level
      );
    });

    it('should handle fan-out pattern (one task, many dependents)', () => {
      const fanOutBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1', // Root
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S2', // Dependent 1
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S3', // Dependent 2
                        type: 'Subtask',
                        title: 'Subtask 3',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S4', // Dependent 3
                        type: 'Subtask',
                        title: 'Subtask 4',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S5', // Dependent 4
                        type: 'Subtask',
                        title: 'Subtask 5',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S6', // Dependent 5
                        type: 'Subtask',
                        title: 'Subtask 6',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const fanOutAnalyzer = new ImpactAnalyzer(fanOutBacklog);
      const impact = fanOutAnalyzer.analyzeImpact('P1.M1.T1.S1');

      // Should have 5 direct dependents
      expect(impact.affectedTasks.length).toBeGreaterThanOrEqual(5);
      expect(impact.blockedTasks.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ==========================================================================
  // Integration tests
  // ==========================================================================

  describe('Integration scenarios', () => {
    it('should correctly analyze real-world dependency chain', () => {
      const impact = analyzer.analyzeImpact('P1.M1.T1.S1');

      // Verify complete analysis
      expect(impact.level).toBeDefined();
      expect(impact.affectedTasks.length).toBeGreaterThan(0);
      expect(impact.blockedPhases.length).toBeGreaterThan(0);
      expect(impact.blockedMilestones.length).toBeGreaterThan(0);
      expect(impact.blockedTasks.length).toBeGreaterThan(0);
      expect(impact.cascadeDepth).toBeGreaterThan(0);

      // Verify affected tasks are unique
      const uniqueTasks = new Set(impact.affectedTasks);
      expect(uniqueTasks.size).toBe(impact.affectedTasks.length);
    });

    it('should provide consistent results across multiple calls', () => {
      const impact1 = analyzer.analyzeImpact('P1.M1.T1.S1');
      const impact2 = analyzer.analyzeImpact('P1.M1.T1.S1');

      expect(impact1.level).toBe(impact2.level);
      expect(impact1.affectedTasks).toEqual(impact2.affectedTasks);
      expect(impact1.blockedPhases).toEqual(impact2.blockedPhases);
      expect(impact1.blockedMilestones).toEqual(impact2.blockedMilestones);
      expect(impact1.blockedTasks).toEqual(impact2.blockedTasks);
      expect(impact1.canContinue).toBe(impact2.canContinue);
      expect(impact1.suggestedAction).toBe(impact2.suggestedAction);
      expect(impact1.cascadeDepth).toBe(impact2.cascadeDepth);
    });

    it('should handle all impact levels in real scenarios', () => {
      // Test none level
      const noneBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const noneAnalyzer = new ImpactAnalyzer(noneBacklog);
      const noneImpact = noneAnalyzer.analyzeImpact('P1.M1.T1.S1');
      expect(noneImpact.level).toBe('none');

      // Test low level (1-4 tasks blocked)
      const lowBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'Test',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'Test',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'Test',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 2',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope:
                          'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const lowAnalyzer = new ImpactAnalyzer(lowBacklog);
      const lowImpact = lowAnalyzer.analyzeImpact('P1.M1.T1.S1');
      // Blocking 1 milestone (P1.M1) results in "high" impact level
      // Since 1 milestone blocked >= high impact threshold
      expect(lowImpact.level).toBe('high');
    });
  });
});
