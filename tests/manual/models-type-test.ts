import {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
  ItemType,
} from '../../src/core/models.js';

// Verify Status type works
const status1: Status = 'Planned';
const status2: Status = 'Complete';
// @ts-expect-error - Invalid status should error
const status3: Status = 'Invalid';

// Verify ItemType type works
const type1: ItemType = 'Subtask';
const type2: ItemType = 'Phase';
// @ts-expect-error - Invalid type should error
const type3: ItemType = 'Invalid';

// Verify Subtask interface
const subtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test Subtask',
  status: 'Planned',
  story_points: 2,
  dependencies: ['P1.M1.T1.S0'],
  context_scope: 'Test scope',
};

// Verify Task interface
const task: Task = {
  id: 'P1.M1.T1',
  type: 'Task',
  title: 'Test Task',
  status: 'Planned',
  description: 'Test description',
  subtasks: [subtask],
};

// Verify Milestone interface
const milestone: Milestone = {
  id: 'P1.M1',
  type: 'Milestone',
  title: 'Test Milestone',
  status: 'Planned',
  description: 'Test description',
  tasks: [task],
};

// Verify Phase interface
const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Test Phase',
  status: 'Planned',
  description: 'Test description',
  milestones: [milestone],
};

// Verify Backlog interface
const backlog: Backlog = {
  backlog: [phase],
};

console.log('All type validations passed!');
console.log('Backlog:', JSON.stringify(backlog, null, 2));
