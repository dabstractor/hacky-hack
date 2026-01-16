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
  RequirementChangeSchema,
  DeltaAnalysisSchema,
  BugSeverityEnum,
  BugSchema,
  TestResultsSchema,
  type Subtask,
  type Task,
  type Milestone,
  type Phase,
  type Backlog,
  type ValidationGate,
  type SuccessCriterion,
  type PRPDocument,
  type PRPArtifact,
  type RequirementChange,
  type DeltaAnalysis,
  type BugSeverity,
  type Bug,
  type TestResults,
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

  describe('RequirementChangeSchema', () => {
    const validChange: RequirementChange = {
      itemId: 'P1.M2.T3.S1',
      type: 'modified',
      description: 'Added validation for negative numbers',
      impact: 'Update implementation to reject negative story_points values',
    };

    it('should parse valid RequirementChange with type added', () => {
      // SETUP: Valid change with type 'added'
      const added: RequirementChange = {
        ...validChange,
        type: 'added',
      };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(added);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(added);
      }
    });

    it('should parse valid RequirementChange with type modified', () => {
      // SETUP: Valid change with type 'modified'
      const modified: RequirementChange = {
        ...validChange,
        type: 'modified',
      };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(modified);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(modified);
      }
    });

    it('should parse valid RequirementChange with type removed', () => {
      // SETUP: Valid change with type 'removed'
      const removed: RequirementChange = {
        ...validChange,
        type: 'removed',
      };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(removed);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(removed);
      }
    });

    it('should accept valid milestone ID format', () => {
      // SETUP: Change with milestone ID
      const milestoneChange: RequirementChange = {
        ...validChange,
        itemId: 'P2.M1',
      };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(milestoneChange);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should accept valid task ID format', () => {
      // SETUP: Change with task ID
      const taskChange: RequirementChange = {
        ...validChange,
        itemId: 'P1.M2.T3',
      };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(taskChange);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject RequirementChange with invalid type', () => {
      // SETUP: Invalid type value
      const invalid = { ...validChange, type: 'invalid' as const };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject RequirementChange with empty itemId', () => {
      // SETUP: Empty itemId
      const invalid = { ...validChange, itemId: '' };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject RequirementChange with empty description', () => {
      // SETUP: Empty description
      const invalid = { ...validChange, description: '' };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject RequirementChange with empty impact', () => {
      // SETUP: Empty impact
      const invalid = { ...validChange, impact: '' };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should accept RequirementChange with single character strings', () => {
      // SETUP: Minimum valid strings (min(1) boundary)
      const minStrings: RequirementChange = {
        itemId: 'P',
        type: 'added',
        description: 'A',
        impact: 'I',
      };

      // EXECUTE
      const result = RequirementChangeSchema.safeParse(minStrings);

      // VERIFY
      expect(result.success).toBe(true);
    });
  });

  describe('DeltaAnalysisSchema', () => {
    const validAnalysis: DeltaAnalysis = {
      changes: [
        {
          itemId: 'P1.M2.T3.S1',
          type: 'modified',
          description: 'Added validation for negative numbers',
          impact:
            'Update implementation to reject negative story_points values',
        },
      ],
      patchInstructions: 'Re-execute P1.M2.T3.S1 to apply validation changes',
      taskIds: ['P1.M2.T3.S1'],
    };

    it('should parse valid DeltaAnalysis with single change', () => {
      // SETUP: Valid delta analysis with single change
      const data = { ...validAnalysis };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validAnalysis);
      }
    });

    it('should parse valid DeltaAnalysis with multiple changes', () => {
      // SETUP: Delta analysis with multiple changes
      const multiChange: DeltaAnalysis = {
        changes: [
          {
            itemId: 'P5.M1.T1',
            type: 'added',
            description: 'New feature: Production deployment pipeline',
            impact:
              'Implement full deployment workflow with staging and production environments',
          },
          {
            itemId: 'P1.M2.T3.S1',
            type: 'modified',
            description: 'Extended story_points range from 13 to 21',
            impact:
              'Update validation in SubtaskSchema to allow values up to 21',
          },
          {
            itemId: 'P2.M3.T2',
            type: 'removed',
            description: 'Removed deprecated parallel research feature',
            impact: 'Remove P2.M3.T2 and all subtasks from task registry',
          },
        ],
        patchInstructions:
          'Execute P5.M1.T1 for new feature. Re-execute P1.M2.T3.S1 for schema update.',
        taskIds: ['P5.M1.T1', 'P1.M2.T3.S1', 'P2.M3.T2'],
      };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(multiChange);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid DeltaAnalysis with empty changes array', () => {
      // SETUP: Delta analysis with no changes
      const noChanges: DeltaAnalysis = {
        changes: [],
        patchInstructions: 'No changes detected between PRD versions',
        taskIds: [],
      };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(noChanges);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse valid DeltaAnalysis with empty taskIds array', () => {
      // SETUP: Delta analysis with changes but no task IDs (edge case)
      const withEmptyTaskIds: DeltaAnalysis = {
        changes: [
          {
            itemId: 'P1.M1.T1',
            type: 'modified',
            description: 'Minor documentation update',
            impact: 'No code changes required',
          },
        ],
        patchInstructions: 'Documentation changes only, no re-execution needed',
        taskIds: [],
      };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(withEmptyTaskIds);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject DeltaAnalysis with empty patchInstructions', () => {
      // SETUP: Empty patch instructions
      const invalid = { ...validAnalysis, patchInstructions: '' };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject DeltaAnalysis with invalid change in changes array', () => {
      // SETUP: Delta analysis with invalid change in array
      const withInvalidChange = {
        ...validAnalysis,
        changes: [
          {
            itemId: 'P1.M2.T3.S1',
            type: 'invalid',
            description: 'Test',
            impact: 'Test',
          },
        ],
      };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(withInvalidChange);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject DeltaAnalysis with change missing required field', () => {
      // SETUP: Delta analysis with change missing description
      const withMissingField = {
        ...validAnalysis,
        changes: [
          {
            itemId: 'P1.M2.T3.S1',
            type: 'modified' as const,
            description: '',
            impact: 'Test',
          },
        ],
      };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(withMissingField);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should parse DeltaAnalysis with all three change types present', () => {
      // SETUP: Delta analysis containing all change types
      const allTypes: DeltaAnalysis = {
        changes: [
          {
            itemId: 'P1',
            type: 'added' as const,
            description: 'A',
            impact: 'I',
          },
          {
            itemId: 'P2',
            type: 'modified' as const,
            description: 'M',
            impact: 'I',
          },
          {
            itemId: 'P3',
            type: 'removed' as const,
            description: 'R',
            impact: 'I',
          },
        ],
        patchInstructions: 'All change types present',
        taskIds: ['P1', 'P2', 'P3'],
      };

      // EXECUTE
      const result = DeltaAnalysisSchema.safeParse(allTypes);

      // VERIFY
      expect(result.success).toBe(true);
    });
  });

  describe('BugSeverityEnum', () => {
    it('should accept all four valid severity values', () => {
      // SETUP: Valid severity values
      const validSeverities = [
        'critical',
        'major',
        'minor',
        'cosmetic',
      ] as const;

      // EXECUTE & VERIFY: Each severity should parse successfully
      validSeverities.forEach(severity => {
        const result = BugSeverityEnum.safeParse(severity);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(severity);
        }
      });
    });

    it('should reject invalid severity values', () => {
      // SETUP: Invalid severity value
      const invalidSeverity = 'invalid';

      // EXECUTE
      const result = BugSeverityEnum.safeParse(invalidSeverity);

      // VERIFY: Should fail validation
      expect(result.success).toBe(false);
    });

    it('should reject uppercase severity values', () => {
      // SETUP: Uppercase severity (not valid per contract)
      const uppercaseSeverity = 'Critical';

      // EXECUTE
      const result = BugSeverityEnum.safeParse(uppercaseSeverity);

      // VERIFY: Should fail - contract specifies lowercase
      expect(result.success).toBe(false);
    });

    it('should expose all enum values via options property', () => {
      // EXECUTE & VERIFY: Check .options property
      expect(BugSeverityEnum.options).toEqual([
        'critical',
        'major',
        'minor',
        'cosmetic',
      ]);
    });
  });

  describe('BugSchema', () => {
    const validBug: Bug = {
      id: 'BUG-001',
      severity: 'critical',
      title: 'Login fails with empty password',
      description: 'Unhandled exception when password field is empty',
      reproduction:
        '1. Navigate to /login\n2. Leave password empty\n3. Click Submit',
      location: 'src/services/auth.ts:45',
    };

    it('should parse valid bug with all fields including location', () => {
      // SETUP: Valid bug data
      const data = { ...validBug };

      // EXECUTE
      const result = BugSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validBug);
      }
    });

    it('should parse valid bug without optional location field', () => {
      // SETUP: Valid bug without location
      const bugWithoutLocation = {
        id: 'BUG-002',
        severity: 'major' as const,
        title: 'Button alignment issue',
        description: 'Submit button is misaligned on mobile',
        reproduction: 'Open app on mobile device',
      };

      // EXECUTE
      const result = BugSchema.safeParse(bugWithoutLocation);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject bug with empty id', () => {
      // SETUP: Empty id
      const invalid = { ...validBug, id: '' };

      // EXECUTE
      const result = BugSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject bug with invalid severity', () => {
      // SETUP: Invalid severity value
      const invalid = { ...validBug, severity: 'urgent' as const };

      // EXECUTE
      const result = BugSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject bug with empty title', () => {
      // SETUP: Empty title
      const invalid = { ...validBug, title: '' };

      // EXECUTE
      const result = BugSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject bug with title exceeding 200 characters', () => {
      // SETUP: Title too long
      const invalid = { ...validBug, title: 'a'.repeat(201) };

      // EXECUTE
      const result = BugSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject bug with empty description', () => {
      // SETUP: Empty description
      const invalid = { ...validBug, description: '' };

      // EXECUTE
      const result = BugSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject bug with empty reproduction steps', () => {
      // SETUP: Empty reproduction
      const invalid = { ...validBug, reproduction: '' };

      // EXECUTE
      const result = BugSchema.safeParse(invalid);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should accept all four severity levels', () => {
      // SETUP: Test each severity level
      const severities: BugSeverity[] = [
        'critical',
        'major',
        'minor',
        'cosmetic',
      ];

      severities.forEach(severity => {
        const bugWithSeverity = { ...validBug, severity };
        const result = BugSchema.safeParse(bugWithSeverity);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('TestResultsSchema', () => {
    const validBug: Bug = {
      id: 'BUG-001',
      severity: 'critical',
      title: 'Auth fails',
      description: 'Authentication error',
      reproduction: 'Try to login',
    };

    const validResults: TestResults = {
      hasBugs: true,
      bugs: [validBug],
      summary: 'Found 1 critical bug during testing',
      recommendations: ['Add input validation'],
    };

    it('should parse valid test results with bugs', () => {
      // SETUP: Valid results with bugs
      const data = { ...validResults };

      // EXECUTE
      const result = TestResultsSchema.safeParse(data);

      // VERIFY
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validResults);
      }
    });

    it('should parse valid test results with empty bugs array', () => {
      // SETUP: Valid results with no bugs
      const resultsNoBugs: TestResults = {
        hasBugs: false,
        bugs: [],
        summary: 'All tests passed successfully',
        recommendations: [],
      };

      // EXECUTE
      const result = TestResultsSchema.safeParse(resultsNoBugs);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse test results with hasBugs set to true', () => {
      // SETUP: Results indicating bugs exist
      const resultsWithBugs = {
        hasBugs: true,
        bugs: [{ ...validBug }],
        summary: 'Critical issues found',
        recommendations: ['Fix bugs'],
      };

      // EXECUTE
      const result = TestResultsSchema.safeParse(resultsWithBugs);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should parse test results with hasBugs set to false', () => {
      // SETUP: Results indicating no bugs
      const resultsNoBugsFlag = {
        hasBugs: false,
        bugs: [],
        summary: 'No issues detected',
        recommendations: [],
      };

      // EXECUTE
      const result = TestResultsSchema.safeParse(resultsNoBugsFlag);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should reject test results missing required summary field', () => {
      // SETUP: Missing summary
      const missingSummary = {
        hasBugs: false,
        bugs: [],
        recommendations: [],
      };

      // EXECUTE
      const result = TestResultsSchema.safeParse(missingSummary);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should reject test results with invalid nested bug', () => {
      // SETUP: Invalid bug in bugs array
      const invalidNestedBug = {
        hasBugs: true,
        bugs: [{ ...validBug, severity: 'invalid' as const }],
        summary: 'Test with invalid bug',
        recommendations: [],
      };

      // EXECUTE
      const result = TestResultsSchema.safeParse(invalidNestedBug);

      // VERIFY
      expect(result.success).toBe(false);
    });

    it('should accept test results with multiple bugs', () => {
      // SETUP: Multiple bugs of different severities
      const multiBugResults: TestResults = {
        hasBugs: true,
        bugs: [
          {
            id: 'BUG-001',
            severity: 'critical',
            title: 'C1',
            description: 'D1',
            reproduction: 'R1',
          },
          {
            id: 'BUG-002',
            severity: 'major',
            title: 'C2',
            description: 'D2',
            reproduction: 'R2',
          },
          {
            id: 'BUG-003',
            severity: 'minor',
            title: 'C3',
            description: 'D3',
            reproduction: 'R3',
          },
          {
            id: 'BUG-004',
            severity: 'cosmetic',
            title: 'C4',
            description: 'D4',
            reproduction: 'R4',
          },
        ],
        summary: 'Found 4 bugs across all severity levels',
        recommendations: ['Fix critical first', 'Then major', 'Then minor'],
      };

      // EXECUTE
      const result = TestResultsSchema.safeParse(multiBugResults);

      // VERIFY
      expect(result.success).toBe(true);
    });

    it('should accept test results with empty recommendations array', () => {
      // SETUP: No specific recommendations
      const noRecommendations: TestResults = {
        hasBugs: true,
        bugs: [{ ...validBug }],
        summary: 'Bug found but no specific recommendations',
        recommendations: [],
      };

      // EXECUTE
      const result = TestResultsSchema.safeParse(noRecommendations);

      // VERIFY
      expect(result.success).toBe(true);
    });
  });

  // =============================================================================
  // TypeScript Type System Tests
  // =============================================================================

  describe('TypeScript type definitions', () => {
    describe('Subtask type structure', () => {
      it('should have correct property types', () => {
        expectTypeOf<Subtask>()
          .toHaveProperty('id')
          .toBeString();

        expectTypeOf<Subtask>()
          .toHaveProperty('type')
          .extract<'type'>()
          .toEqualTypeOf<'Subtask'>();

        expectTypeOf<Subtask>()
          .toHaveProperty('title')
          .toBeString();

        expectTypeOf<Subtask>()
          .toHaveProperty('status')
          .toEqualTypeOf<Status>();

        expectTypeOf<Subtask>()
          .toHaveProperty('story_points')
          .toBeNumber();

        expectTypeOf<Subtask>()
          .toHaveProperty('dependencies')
          .toBeArray();

        expectTypeOf<Subtask>()
          .toHaveProperty('context_scope')
          .toBeString();
      });

      it('should have readonly properties', () => {
        // SETUP: Create a sample subtask
        const sample: Subtask = {
          id: 'P1.M1.T1.S1',
          type: 'Subtask',
          title: 'Test',
          status: 'Planned',
          story_points: 2,
          dependencies: [],
          context_scope: 'Test',
        };

        // VERIFY: Cannot reassign readonly property (compile-time check)
        // @ts-expect-error - Property is readonly
        sample.id = 'P1.M1.T1.S2';

        // @ts-expect-error - Property is readonly
        sample.type = 'Task';
      });

      it('should match Zod schema inference', () => {
        type InferredSubtask = z.infer<typeof SubtaskSchema>;
        expectTypeOf<InferredSubtask>().toEqualTypeOf<Subtask>();
      });
    });

    describe('Task type structure', () => {
      it('should have correct property types', () => {
        expectTypeOf<Task>()
          .toHaveProperty('id')
          .toBeString();

        expectTypeOf<Task>()
          .toHaveProperty('type')
          .extract<'type'>()
          .toEqualTypeOf<'Task'>();

        expectTypeOf<Task>()
          .toHaveProperty('title')
          .toBeString();

        expectTypeOf<Task>()
          .toHaveProperty('status')
          .toEqualTypeOf<Status>();

        expectTypeOf<Task>()
          .toHaveProperty('description')
          .toBeString();

        expectTypeOf<Task>()
          .toHaveProperty('subtasks')
          .toBeArray();
      });

      it('should have subtasks array of Subtask type', () => {
        expectTypeOf<Task>()
          .toHaveProperty('subtasks')
          .toMatchTypeOf<Subtask[]>();
      });

      it('should have readonly properties', () => {
        const sample: Task = {
          id: 'P1.M1.T1',
          type: 'Task',
          title: 'Test',
          status: 'Planned',
          description: 'Test',
          subtasks: [],
        };

        // @ts-expect-error - Property is readonly
        sample.id = 'P1.M1.T2';
      });

      it('should match Zod schema inference', () => {
        type InferredTask = z.infer<typeof TaskSchema>;
        expectTypeOf<InferredTask>().toEqualTypeOf<Task>();
      });
    });

    describe('Milestone type structure', () => {
      it('should have correct property types', () => {
        expectTypeOf<Milestone>()
          .toHaveProperty('id')
          .toBeString();

        expectTypeOf<Milestone>()
          .toHaveProperty('type')
          .extract<'type'>()
          .toEqualTypeOf<'Milestone'>();

        expectTypeOf<Milestone>()
          .toHaveProperty('title')
          .toBeString();

        expectTypeOf<Milestone>()
          .toHaveProperty('status')
          .toEqualTypeOf<Status>();

        expectTypeOf<Milestone>()
          .toHaveProperty('description')
          .toBeString();

        expectTypeOf<Milestone>()
          .toHaveProperty('tasks')
          .toBeArray();
      });

      it('should have tasks array of Task type', () => {
        expectTypeOf<Milestone>()
          .toHaveProperty('tasks')
          .toMatchTypeOf<Task[]>();
      });

      it('should match Zod schema inference', () => {
        type InferredMilestone = z.infer<typeof MilestoneSchema>;
        expectTypeOf<InferredMilestone>().toEqualTypeOf<Milestone>();
      });
    });

    describe('Phase type structure', () => {
      it('should have correct property types', () => {
        expectTypeOf<Phase>()
          .toHaveProperty('id')
          .toBeString();

        expectTypeOf<Phase>()
          .toHaveProperty('type')
          .extract<'type'>()
          .toEqualTypeOf<'Phase'>();

        expectTypeOf<Phase>()
          .toHaveProperty('title')
          .toBeString();

        expectTypeOf<Phase>()
          .toHaveProperty('status')
          .toEqualTypeOf<Status>();

        expectTypeOf<Phase>()
          .toHaveProperty('description')
          .toBeString();

        expectTypeOf<Phase>()
          .toHaveProperty('milestones')
          .toBeArray();
      });

      it('should have milestones array of Milestone type', () => {
        expectTypeOf<Phase>()
          .toHaveProperty('milestones')
          .toMatchTypeOf<Milestone[]>();
      });

      it('should match Zod schema inference', () => {
        type InferredPhase = z.infer<typeof PhaseSchema>;
        expectTypeOf<InferredPhase>().toEqualTypeOf<Phase>();
      });
    });

    describe('Status enum type', () => {
      it('should have all 6 status values', () => {
        type StatusValues = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete';
        expectTypeOf<Status>().toEqualTypeOf<StatusValues>();
      });

      it('should match Zod schema inference', () => {
        type InferredStatus = z.infer<typeof StatusEnum>;
        expectTypeOf<InferredStatus>().toEqualTypeOf<Status>();
      });
    });

    describe('ItemType enum type', () => {
      it('should have all 4 item type values', () => {
        type ItemTypeValues = 'Phase' | 'Milestone' | 'Task' | 'Subtask';
        expectTypeOf<ItemType>().toEqualTypeOf<ItemTypeValues>();
      });

      it('should match Zod schema inference', () => {
        type InferredItemType = z.infer<typeof ItemTypeEnum>;
        expectTypeOf<InferredItemType>().toEqualTypeOf<ItemType>();
      });
    });
  });

  // =============================================================================
  // Story Points Validation Tests (Range: 1-21 integers)
  // =============================================================================

  describe('Story points validation', () => {
    const validSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: 'Test',
    };

    const validPoints = [1, 2, 3, 5, 8, 13, 21, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20];
    const invalidPoints = [0, 22, -1, 1.5, 100, 21.5];

    test.each(validPoints)('should accept valid story_points (1-21): %d', (points) => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        story_points: points,
      });
      expect(result.success).toBe(true);
    });

    test.each(invalidPoints)('should reject invalid story_points: %d', (points) => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        story_points: points,
      });
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // ID Format Validation Tests
  // =============================================================================

  describe('ID format validation', () => {
    describe('Subtask ID format', () => {
      const validSubtask: Subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask',
        title: 'Test',
        status: 'Planned',
        story_points: 2,
        dependencies: [],
        context_scope: 'Test',
      };

      const validSubtaskIds = ['P1.M1.T1.S1', 'P123.M456.T789.S999', 'P99.M99.T99.S99'];
      const invalidSubtaskIds = [
        'P1.M1.T1',          // Missing S segment
        'P1.M1.T1.S1.S2',    // Extra segment
        'p1.m1.t1.s1',       // Lowercase letters
        'P1-M1-T1-S1',       // Wrong separator
        'P1.M1.T1.S',        // Missing number after S
        'P1.M1.T1.S1a',      // Non-numeric suffix
      ];

      test.each(validSubtaskIds)('should accept valid Subtask ID: %s', (id) => {
        const result = SubtaskSchema.safeParse({ ...validSubtask, id });
        expect(result.success).toBe(true);
      });

      test.each(invalidSubtaskIds)('should reject invalid Subtask ID: %s', (id) => {
        const result = SubtaskSchema.safeParse({ ...validSubtask, id });
        expect(result.success).toBe(false);
      });
    });

    describe('Task ID format', () => {
      const validTask: Task = {
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        subtasks: [],
      };

      const validTaskIds = ['P1.M1.T1', 'P123.M456.T789', 'P99.M99.T99'];
      const invalidTaskIds = [
        'P1.M1',             // Missing T segment
        'P1.M1.T1.S1',       // Extra S segment
        'p1.m1.t1',          // Lowercase letters
        'P1-M1-T1',          // Wrong separator
        'P1.M1.T',           // Missing number after T
      ];

      test.each(validTaskIds)('should accept valid Task ID: %s', (id) => {
        const result = TaskSchema.safeParse({ ...validTask, id });
        expect(result.success).toBe(true);
      });

      test.each(invalidTaskIds)('should reject invalid Task ID: %s', (id) => {
        const result = TaskSchema.safeParse({ ...validTask, id });
        expect(result.success).toBe(false);
      });
    });

    describe('Milestone ID format', () => {
      const validMilestone: Milestone = {
        id: 'P1.M1',
        type: 'Milestone',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        tasks: [],
      };

      const validMilestoneIds = ['P1.M1', 'P123.M456', 'P99.M99'];
      const invalidMilestoneIds = [
        'P1',                // Missing M segment
        'P1.M1.T1',          // Extra T segment
        'p1.m1',             // Lowercase letters
        'P1-M1',             // Wrong separator
        'P1.M',              // Missing number after M
      ];

      test.each(validMilestoneIds)('should accept valid Milestone ID: %s', (id) => {
        const result = MilestoneSchema.safeParse({ ...validMilestone, id });
        expect(result.success).toBe(true);
      });

      test.each(invalidMilestoneIds)('should reject invalid Milestone ID: %s', (id) => {
        const result = MilestoneSchema.safeParse({ ...validMilestone, id });
        expect(result.success).toBe(false);
      });
    });

    describe('Phase ID format', () => {
      const validPhase: Phase = {
        id: 'P1',
        type: 'Phase',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        milestones: [],
      };

      const validPhaseIds = ['P1', 'P123', 'P99'];
      const invalidPhaseIds = [
        'P1.M1',             // Extra M segment
        'p1',                // Lowercase letter
        'Phase1',            // Wrong format
        '1',                 // Missing P prefix
        'P',                 // Missing number
      ];

      test.each(validPhaseIds)('should accept valid Phase ID: %s', (id) => {
        const result = PhaseSchema.safeParse({ ...validPhase, id });
        expect(result.success).toBe(true);
      });

      test.each(invalidPhaseIds)('should reject invalid Phase ID: %s', (id) => {
        const result = PhaseSchema.safeParse({ ...validPhase, id });
        expect(result.success).toBe(false);
      });
    });
  });

  // =============================================================================
  // Type Discriminator Validation Tests
  // =============================================================================

  describe('Type discriminator validation', () => {
    describe('Subtask type discriminator', () => {
      const validSubtask: Subtask = {
        id: 'P1.M1.T1.S1',
        type: 'Subtask',
        title: 'Test',
        status: 'Planned',
        story_points: 2,
        dependencies: [],
        context_scope: 'Test',
      };

      const invalidTypes = ['Phase', 'Milestone', 'Task', 'Invalid', 'SubTask'];

      test.each(invalidTypes)('should reject invalid type: %s', (type) => {
        const result = SubtaskSchema.safeParse({
          ...validSubtask,
          type: type as any,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Task type discriminator', () => {
      const validTask: Task = {
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        subtasks: [],
      };

      const invalidTypes = ['Phase', 'Milestone', 'Subtask', 'Invalid'];

      test.each(invalidTypes)('should reject invalid type: %s', (type) => {
        const result = TaskSchema.safeParse({
          ...validTask,
          type: type as any,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Milestone type discriminator', () => {
      const validMilestone: Milestone = {
        id: 'P1.M1',
        type: 'Milestone',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        tasks: [],
      };

      const invalidTypes = ['Phase', 'Task', 'Subtask', 'Invalid'];

      test.each(invalidTypes)('should reject invalid type: %s', (type) => {
        const result = MilestoneSchema.safeParse({
          ...validMilestone,
          type: type as any,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Phase type discriminator', () => {
      const validPhase: Phase = {
        id: 'P1',
        type: 'Phase',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        milestones: [],
      };

      const invalidTypes = ['Milestone', 'Task', 'Subtask', 'Invalid'];

      test.each(invalidTypes)('should reject invalid type: %s', (type) => {
        const result = PhaseSchema.safeParse({
          ...validPhase,
          type: type as any,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  // =============================================================================
  // Nested Hierarchy Validation Tests
  // =============================================================================

  describe('Nested hierarchy validation', () => {
    it('should validate 4-level deep hierarchy (Phase > Milestone > Task > Subtask)', () => {
      // SETUP: Complete 4-level hierarchy
      const deepPhase: Phase = {
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
                    story_points: 2,
                    dependencies: [],
                    context_scope: 'Test scope',
                  },
                ],
              },
            ],
          },
        ],
      };

      // EXECUTE
      const result = PhaseSchema.safeParse(deepPhase);

      // VERIFY: Complete 4-level hierarchy should validate
      expect(result.success).toBe(true);
    });

    it('should validate complex hierarchy with multiple items at each level', () => {
      // SETUP: Complex hierarchy with multiple items at each level
      const complexPhase: Phase = {
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
      };

      // EXECUTE
      const result = PhaseSchema.safeParse(complexPhase);

      // VERIFY: Complex hierarchy should validate
      expect(result.success).toBe(true);
    });

    it('should report correct nested error paths', () => {
      // SETUP: Task with invalid subtask
      const taskWithInvalidSubtask: Task = {
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Task 1',
        status: 'Planned',
        description: 'Test task',
        subtasks: [
          {
            id: 'INVALID-ID',  // Invalid ID format
            type: 'Subtask',
            title: 'Test',
            status: 'Planned',
            story_points: 1,
            dependencies: [],
            context_scope: 'Test',
          },
        ],
      };

      // EXECUTE
      const result = TaskSchema.safeParse(taskWithInvalidSubtask);

      // VERIFY
      expect(result.success).toBe(false);
      if (!result.success) {
        const subtaskError = result.error.issues.find(
          (issue) => issue.path.includes('subtasks')
        );
        expect(subtaskError?.path).toEqual(['subtasks', 0, 'id']);
      }
    });
  });
});
