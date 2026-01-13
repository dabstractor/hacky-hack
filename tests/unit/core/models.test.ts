/**
 * Unit tests for task hierarchy Zod schemas
 *
 * @remarks
 * Tests validate Zod schemas for all task hierarchy types with 100% coverage
 * of src/core/models.ts schema definitions.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  StatusEnum,
  ItemTypeEnum,
  SubtaskSchema,
  TaskSchema,
  MilestoneSchema,
  PhaseSchema,
  BacklogSchema,
  ValidationGateSchema,
  SuccessCriterionSchema,
  PRPDocumentSchema,
  PRPArtifactSchema,
  type Subtask,
  type Task,
  type Milestone,
  type Phase,
  type Backlog,
  type ValidationGate,
  type SuccessCriterion,
  type PRPDocument,
  type PRPArtifact,
} from '../../../src/core/models.js';

describe('core/models Zod Schemas', () => {
  describe('StatusEnum', () => {
    it('should accept valid status values', () => {
      // SETUP: Valid status values
      const validStatuses = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ] as const;

      // EXECUTE & VERIFY: Each status should parse successfully
      validStatuses.forEach(status => {
        const result = StatusEnum.safeParse(status);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(status);
        }
      });
    });

    it('should reject invalid status values', () => {
      // SETUP: Invalid status value
      const invalidStatus = 'InvalidStatus';

      // EXECUTE
      const result = StatusEnum.safeParse(invalidStatus);

      // VERIFY: Should fail validation
      expect(result.success).toBe(false);
    });

    it('should expose all enum values via options property', () => {
      // EXECUTE & VERIFY: Check .options property
      expect(StatusEnum.options).toEqual([
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
        'Obsolete',
      ]);
    });
  });

  describe('ItemTypeEnum', () => {
    it('should accept valid item type values', () => {
      // SETUP: Valid item type values
      const validTypes = ['Phase', 'Milestone', 'Task', 'Subtask'] as const;

      // EXECUTE & VERIFY: Each type should parse successfully
      validTypes.forEach(type => {
        const result = ItemTypeEnum.safeParse(type);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(type);
        }
      });
    });

    it('should reject invalid item type values', () => {
      // SETUP: Invalid item type value
      const invalidType = 'InvalidType';

      // EXECUTE
      const result = ItemTypeEnum.safeParse(invalidType);

      // VERIFY: Should fail validation
      expect(result.success).toBe(false);
    });

    it('should expose all enum values via options property', () => {
      // EXECUTE & VERIFY: Check .options property
      expect(ItemTypeEnum.options).toEqual([
        'Phase',
        'Milestone',
        'Task',
        'Subtask',
      ]);
    });
  });

  describe('SubtaskSchema', () => {
    const validSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Create Zod schemas',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: 'src/core/models.ts only',
    };

    it('should parse valid subtask', () => {
      // SETUP: Valid subtask data
      const data = { ...validSubtask };

      // EXECUTE
      const result = SubtaskSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSubtask);
      }
    });

    it('should reject subtask with invalid id format', () => {
      // SETUP: Invalid ID format
      const invalid = { ...validSubtask, id: 'invalid-id' };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject subtask with wrong type literal', () => {
      // SETUP: Wrong type discriminator
      const invalid = { ...validSubtask, type: 'Task' };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject subtask with empty title', () => {
      // SETUP: Empty title
      const invalid = { ...validSubtask, title: '' };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject subtask with title too long', () => {
      // SETUP: Title exceeding 200 characters
      const invalid = { ...validSubtask, title: 'a'.repeat(201) };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject subtask with invalid status', () => {
      // SETUP: Invalid status value
      const invalid = { ...validSubtask, status: 'InvalidStatus' };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject subtask with negative story_points', () => {
      // SETUP: Negative story points
      const invalid = { ...validSubtask, story_points: -1 };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject subtask with story_points exceeding maximum', () => {
      // SETUP: Story points > 21
      const invalid = { ...validSubtask, story_points: 22 };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject subtask with non-integer story_points', () => {
      // SETUP: Non-integer story points
      const invalid = { ...validSubtask, story_points: 2.5 };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should accept subtask with empty dependencies array', () => {
      // SETUP: Subtask with empty dependencies
      const withEmptyDeps = { ...validSubtask, dependencies: [] };

      // EXECUTE
      const result = SubtaskSchema.safeParse(withEmptyDeps);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should accept subtask with dependencies', () => {
      // SETUP: Subtask with dependencies
      const withDeps = {
        ...validSubtask,
        dependencies: ['P1.M1.T1.S1', 'P1.M1.T1.S2'],
      };

      // EXECUTE
      const result = SubtaskSchema.safeParse(withDeps);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject subtask with empty context_scope', () => {
      // SETUP: Empty context scope
      const invalid = { ...validSubtask, context_scope: '' };

      // EXECUTE
      const result = SubtaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('TaskSchema', () => {
    const validTask: Task = {
      id: 'P1.M1.T1',
      type: 'Task',
      title: 'Define Task Models',
      status: 'Planned',
      description: 'Create TypeScript interfaces for task hierarchy',
      subtasks: [],
    };

    it('should parse valid task with empty subtasks', () => {
      // SETUP: Valid task data
      const data = { ...validTask };

      // EXECUTE
      const result = TaskSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid task with nested subtasks', () => {
      // SETUP: Task with subtasks
      const withSubtasks: Task = {
        ...validTask,
        subtasks: [
          {
            id: 'P1.M1.T1.S1',
            type: 'Subtask',
            title: 'Create interfaces',
            status: 'Complete',
            story_points: 2,
            dependencies: [],
            context_scope: 'src/core/',
          },
        ],
      };

      // EXECUTE
      const result = TaskSchema.safeParse(withSubtasks);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject task with invalid id format', () => {
      // SETUP: Invalid ID format
      const invalid = { ...validTask, id: 'invalid-id' };

      // EXECUTE
      const result = TaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject task with wrong type literal', () => {
      // SETUP: Wrong type discriminator
      const invalid = { ...validTask, type: 'Subtask' };

      // EXECUTE
      const result = TaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject task with empty title', () => {
      // SETUP: Empty title
      const invalid = { ...validTask, title: '' };

      // EXECUTE
      const result = TaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject task with missing description', () => {
      // SETUP: Empty description
      const invalid = { ...validTask, description: '' };

      // EXECUTE
      const result = TaskSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject task with invalid subtask in array', () => {
      // SETUP: Task with invalid subtask
      const withInvalidSubtask = {
        ...validTask,
        subtasks: [
          {
            id: 'invalid',
            type: 'Subtask',
            title: 'Bad subtask',
            status: 'Planned',
            story_points: 1,
            dependencies: [],
            context_scope: 'test',
          },
        ],
      };

      // EXECUTE
      const result = TaskSchema.safeParse(withInvalidSubtask);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('MilestoneSchema', () => {
    const validMilestone: Milestone = {
      id: 'P1.M1',
      type: 'Milestone',
      title: 'Project Initialization',
      status: 'Complete',
      description: 'Foundation setup and environment configuration',
      tasks: [],
    };

    it('should parse valid milestone with empty tasks', () => {
      // SETUP: Valid milestone data
      const data = { ...validMilestone };

      // EXECUTE
      const result = MilestoneSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid milestone with nested tasks', () => {
      // SETUP: Milestone with tasks
      const withTasks: Milestone = {
        ...validMilestone,
        tasks: [
          {
            id: 'P1.M1.T1',
            type: 'Task',
            title: 'Task 1',
            status: 'Planned',
            description: 'First task',
            subtasks: [],
          },
        ],
      };

      // EXECUTE
      const result = MilestoneSchema.safeParse(withTasks);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid milestone with multi-level nesting', () => {
      // SETUP: Milestone with tasks that have subtasks
      const withNestedTasks: Milestone = {
        ...validMilestone,
        tasks: [
          {
            id: 'P1.M1.T1',
            type: 'Task',
            title: 'Task 1',
            status: 'Planned',
            description: 'First task',
            subtasks: [
              {
                id: 'P1.M1.T1.S1',
                type: 'Subtask',
                title: 'Subtask 1',
                status: 'Planned',
                story_points: 1,
                dependencies: [],
                context_scope: 'Test scope',
              },
            ],
          },
        ],
      };

      // EXECUTE
      const result = MilestoneSchema.safeParse(withNestedTasks);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject milestone with invalid id format', () => {
      // SETUP: Invalid ID format
      const invalid = { ...validMilestone, id: 'invalid-id' };

      // EXECUTE
      const result = MilestoneSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject milestone with wrong type literal', () => {
      // SETUP: Wrong type discriminator
      const invalid = { ...validMilestone, type: 'Task' };

      // EXECUTE
      const result = MilestoneSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject milestone with empty description', () => {
      // SETUP: Empty description
      const invalid = { ...validMilestone, description: '' };

      // EXECUTE
      const result = MilestoneSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject milestone with invalid task in array', () => {
      // SETUP: Milestone with invalid task
      const withInvalidTask = {
        ...validMilestone,
        tasks: [
          {
            id: 'invalid',
            type: 'Task',
            title: 'Bad task',
            status: 'Planned',
            description: 'Bad',
            subtasks: [],
          },
        ],
      };

      // EXECUTE
      const result = MilestoneSchema.safeParse(withInvalidTask);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('PhaseSchema', () => {
    const validPhase: Phase = {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1: Foundation',
      status: 'Planned',
      description: 'Project initialization',
      milestones: [],
    };

    it('should parse valid phase with empty milestones', () => {
      // SETUP: Valid phase data
      const data = { ...validPhase };

      // EXECUTE
      const result = PhaseSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid phase with nested milestones', () => {
      // SETUP: Phase with milestones
      const withMilestones: Phase = {
        ...validPhase,
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Milestone 1',
            status: 'Planned',
            description: 'First milestone',
            tasks: [],
          },
        ],
      };

      // EXECUTE
      const result = PhaseSchema.safeParse(withMilestones);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject phase with invalid id format', () => {
      // SETUP: Invalid ID format
      const invalid = { ...validPhase, id: 'invalid' };

      // EXECUTE
      const result = PhaseSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject phase with wrong type literal', () => {
      // SETUP: Wrong type discriminator
      const invalid = { ...validPhase, type: 'Task' };

      // EXECUTE
      const result = PhaseSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject phase with empty description', () => {
      // SETUP: Empty description
      const invalid = { ...validPhase, description: '' };

      // EXECUTE
      const result = PhaseSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject phase with invalid milestone in array', () => {
      // SETUP: Phase with invalid milestone
      const withInvalidMilestone = {
        ...validPhase,
        milestones: [
          {
            id: 'invalid',
            type: 'Milestone',
            title: 'Bad milestone',
            status: 'Planned',
            description: 'Bad',
            tasks: [],
          },
        ],
      };

      // EXECUTE
      const result = PhaseSchema.safeParse(withInvalidMilestone);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('BacklogSchema', () => {
    const validBacklog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Planned',
          description: 'First phase',
          milestones: [],
        },
      ],
    };

    it('should parse valid backlog with phases', () => {
      // SETUP: Valid backlog data
      const data = { ...validBacklog };

      // EXECUTE
      const result = BacklogSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse empty backlog', () => {
      // SETUP: Empty backlog
      const empty: Backlog = { backlog: [] };

      // EXECUTE
      const result = BacklogSchema.safeParse(empty);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse backlog with multiple phases', () => {
      // SETUP: Backlog with multiple phases
      const multiPhase: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Complete',
            description: 'First phase',
            milestones: [],
          },
          {
            id: 'P2',
            type: 'Phase',
            title: 'Phase 2',
            status: 'Planned',
            description: 'Second phase',
            milestones: [],
          },
        ],
      };

      // EXECUTE
      const result = BacklogSchema.safeParse(multiPhase);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject backlog with invalid phase in array', () => {
      // SETUP: Backlog with invalid phase
      const withInvalidPhase = {
        backlog: [
          {
            id: 'invalid',
            type: 'Phase',
            title: 'Bad phase',
            status: 'Planned',
            description: 'Bad',
            milestones: [],
          },
        ],
      };

      // EXECUTE
      const result = BacklogSchema.safeParse(withInvalidPhase);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('Deep Nesting Validation', () => {
    it('should validate 4-level deep hierarchy', () => {
      // SETUP: Complete 4-level hierarchy (Backlog > Phase > Milestone > Task > Subtask)
      const deepBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'First phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Planned',
                description: 'First milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Planned',
                    description: 'First task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1',
                        status: 'Planned',
                        story_points: 1,
                        dependencies: [],
                        context_scope: 'Test scope',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      // EXECUTE
      const result = BacklogSchema.safeParse(deepBacklog);

      // VERIFY: Complete 4-level hierarchy should validate
      expect(result.success).toBe(true);
    });

    it('should validate complex hierarchy with multiple items at each level', () => {
      // SETUP: Complex hierarchy with multiple items at each level
      const complexBacklog: Backlog = {
        backlog: [
          {
            id: 'P1',
            type: 'Phase',
            title: 'Phase 1',
            status: 'Planned',
            description: 'First phase',
            milestones: [
              {
                id: 'P1.M1',
                type: 'Milestone',
                title: 'Milestone 1',
                status: 'Complete',
                description: 'First milestone',
                tasks: [
                  {
                    id: 'P1.M1.T1',
                    type: 'Task',
                    title: 'Task 1',
                    status: 'Complete',
                    description: 'First task',
                    subtasks: [
                      {
                        id: 'P1.M1.T1.S1',
                        type: 'Subtask',
                        title: 'Subtask 1.1',
                        status: 'Complete',
                        story_points: 2,
                        dependencies: [],
                        context_scope: 'Scope 1',
                      },
                      {
                        id: 'P1.M1.T1.S2',
                        type: 'Subtask',
                        title: 'Subtask 1.2',
                        status: 'Complete',
                        story_points: 3,
                        dependencies: ['P1.M1.T1.S1'],
                        context_scope: 'Scope 2',
                      },
                    ],
                  },
                  {
                    id: 'P1.M1.T2',
                    type: 'Task',
                    title: 'Task 2',
                    status: 'Planned',
                    description: 'Second task',
                    subtasks: [],
                  },
                ],
              },
              {
                id: 'P1.M2',
                type: 'Milestone',
                title: 'Milestone 2',
                status: 'Planned',
                description: 'Second milestone',
                tasks: [],
              },
            ],
          },
        ],
      };

      // EXECUTE
      const result = BacklogSchema.safeParse(complexBacklog);

      // VERIFY: Complex hierarchy should validate
      expect(result.success).toBe(true);
    });
  });

  describe('ValidationGateSchema', () => {
    const validGate: ValidationGate = {
      level: 1,
      description: 'Syntax & Style validation',
      command: 'npm run lint && npm run type-check',
      manual: false,
    };

    it('should parse valid validation gate for level 1', () => {
      // SETUP: Valid level 1 gate
      const data = { ...validGate };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validGate);
      }
    });

    it('should parse valid validation gate for level 2', () => {
      // SETUP: Valid level 2 gate
      const level2Gate: ValidationGate = {
        level: 2,
        description: 'Unit Tests validation',
        command: 'npm test',
        manual: false,
      };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(level2Gate);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid validation gate for level 3', () => {
      // SETUP: Valid level 3 gate
      const level3Gate: ValidationGate = {
        level: 3,
        description: 'Integration Testing validation',
        command: 'npm run test:integration',
        manual: false,
      };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(level3Gate);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid validation gate for level 4 with null command', () => {
      // SETUP: Valid level 4 gate (manual validation)
      const level4Gate: ValidationGate = {
        level: 4,
        description: 'Manual end-to-end testing',
        command: null,
        manual: true,
      };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(level4Gate);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject validation gate with invalid level', () => {
      // SETUP: Invalid level (not 1-4)
      const invalid = { ...validGate, level: 5 };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject validation gate with level 0', () => {
      // SETUP: Invalid level 0
      const invalid = { ...validGate, level: 0 };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject validation gate with empty description', () => {
      // SETUP: Empty description
      const invalid = { ...validGate, description: '' };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject validation gate with missing command field', () => {
      // SETUP: Missing command (undefined instead of string | null)
      const invalid = { ...validGate, command: undefined };

      // EXECUTE
      const result = ValidationGateSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('SuccessCriterionSchema', () => {
    const validCriterion: SuccessCriterion = {
      description: 'All four interfaces added to src/core/models.ts',
      satisfied: true,
    };

    it('should parse valid satisfied criterion', () => {
      // SETUP: Valid satisfied criterion
      const data = { ...validCriterion };

      // EXECUTE
      const result = SuccessCriterionSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCriterion);
      }
    });

    it('should parse valid unsatisfied criterion', () => {
      // SETUP: Valid unsatisfied criterion
      const unsatisfied: SuccessCriterion = {
        description: 'All validation gates passing',
        satisfied: false,
      };

      // EXECUTE
      const result = SuccessCriterionSchema.safeParse(unsatisfied);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject criterion with empty description', () => {
      // SETUP: Empty description
      const invalid = { ...validCriterion, description: '' };

      // EXECUTE
      const result = SuccessCriterionSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject criterion with non-boolean satisfied', () => {
      // SETUP: Invalid satisfied field
      const invalid = { ...validCriterion, satisfied: 'yes' };

      // EXECUTE
      const result = SuccessCriterionSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject criterion with missing satisfied field', () => {
      // SETUP: Missing satisfied field - Zod catches this at runtime
      const invalid = { description: validCriterion.description };

      // EXECUTE
      const result = SuccessCriterionSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('PRPDocumentSchema', () => {
    const validPRP: PRPDocument = {
      taskId: 'P1.M2.T2.S2',
      objective: 'Add PRP document interfaces to models.ts',
      context: '# All Needed Context\n\nComplete context for implementation...',
      implementationSteps: [
        'Create ValidationGate interface',
        'Create ValidationGateSchema',
      ],
      validationGates: [
        {
          level: 1,
          description: 'Syntax & Style validation',
          command: 'npm run validate',
          manual: false,
        },
        {
          level: 2,
          description: 'Unit Tests validation',
          command: 'npm test',
          manual: false,
        },
        {
          level: 3,
          description: 'Integration Testing validation',
          command: 'npm run test:integration',
          manual: false,
        },
        {
          level: 4,
          description: 'Manual validation',
          command: null,
          manual: true,
        },
      ],
      successCriteria: [
        { description: 'All interfaces added', satisfied: true },
        { description: 'All tests passing', satisfied: false },
      ],
      references: [
        'https://github.com/anthropics/claude-code',
        'src/core/models.ts',
      ],
    };

    it('should parse valid PRP document', () => {
      // SETUP: Valid PRP data
      const data = { ...validPRP };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPRP);
      }
    });

    it('should parse PRP with empty arrays', () => {
      // SETUP: PRP with empty arrays
      const minimalPRP: PRPDocument = {
        taskId: 'P1.M1.T1.S1',
        objective: 'Test objective',
        context: '# Context',
        implementationSteps: [],
        validationGates: [],
        successCriteria: [],
        references: [],
      };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(minimalPRP);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject PRP with empty taskId', () => {
      // SETUP: Empty taskId
      const invalid = { ...validPRP, taskId: '' };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject PRP with empty objective', () => {
      // SETUP: Empty objective
      const invalid = { ...validPRP, objective: '' };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject PRP with empty context', () => {
      // SETUP: Empty context
      const invalid = { ...validPRP, context: '' };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject PRP with empty implementation step', () => {
      // SETUP: Empty implementation step
      const invalid = {
        ...validPRP,
        implementationSteps: ['', 'Valid step'],
      };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject PRP with invalid validation gate', () => {
      // SETUP: Invalid validation gate in array
      const invalid = {
        ...validPRP,
        validationGates: [
          {
            level: 5, // Invalid level
            description: 'Invalid gate',
            command: 'test',
            manual: false,
          },
        ],
      };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject PRP with invalid success criterion', () => {
      // SETUP: Invalid success criterion in array
      const invalid = {
        ...validPRP,
        successCriteria: [
          {
            description: '', // Empty description
            satisfied: true,
          },
        ],
      };

      // EXECUTE
      const result = PRPDocumentSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });

  describe('PRPArtifactSchema', () => {
    const validArtifact: PRPArtifact = {
      taskId: 'P1.M2.T2.S2',
      prpPath: 'plan/001_14b9dc2a33c7/P1M2T2S2/PRP.md',
      status: 'Generated',
      generatedAt: new Date('2024-01-12T10:00:00Z'),
    };

    it('should parse valid artifact with Generated status', () => {
      // SETUP: Valid artifact with Generated status
      const data = { ...validArtifact };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validArtifact);
      }
    });

    it('should parse valid artifact with Executing status', () => {
      // SETUP: Valid artifact with Executing status
      const executing: PRPArtifact = {
        ...validArtifact,
        status: 'Executing',
      };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(executing);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid artifact with Completed status', () => {
      // SETUP: Valid artifact with Completed status
      const completed: PRPArtifact = {
        ...validArtifact,
        status: 'Completed',
      };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(completed);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid artifact with Failed status', () => {
      // SETUP: Valid artifact with Failed status
      const failed: PRPArtifact = {
        ...validArtifact,
        status: 'Failed',
      };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(failed);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid artifact with current date', () => {
      // SETUP: Valid artifact with current date
      const current: PRPArtifact = {
        ...validArtifact,
        generatedAt: new Date(),
      };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(current);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject artifact with empty taskId', () => {
      // SETUP: Empty taskId
      const invalid = { ...validArtifact, taskId: '' };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject artifact with empty prpPath', () => {
      // SETUP: Empty prpPath
      const invalid = { ...validArtifact, prpPath: '' };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject artifact with invalid status', () => {
      // SETUP: Invalid status
      const invalid = { ...validArtifact, status: 'InProgress' };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject artifact with invalid generatedAt', () => {
      // SETUP: Invalid date string (not a Date object)
      const invalid = {
        ...validArtifact,
        generatedAt: '2024-01-12' as unknown as Date,
      };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject artifact with string date instead of Date object', () => {
      // SETUP: String instead of Date
      const invalid = {
        ...validArtifact,
        generatedAt: '2024-01-12T10:00:00Z' as unknown as Date,
      };

      // EXECUTE
      const result = PRPArtifactSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });
  });
});
