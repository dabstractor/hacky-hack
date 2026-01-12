import {
  Phase,
  Milestone,
  Task,
  Subtask,
  ItemType,
} from '../../src/core/models.js';

function processItem(item: Phase | Milestone | Task | Subtask): string {
  // Type narrowing using the 'type' discriminator
  switch (item.type) {
    case 'Phase':
      return `Phase ${item.id} has ${item.milestones.length} milestones`;
    case 'Milestone':
      return `Milestone ${item.id} has ${item.tasks.length} tasks`;
    case 'Task':
      return `Task ${item.id} has ${item.subtasks.length} subtasks`;
    case 'Subtask':
      return `Subtask ${item.id} has ${item.dependencies.length} dependencies`;
    default:
      // This should never happen if types are correct
      const _exhaustiveCheck: never = item;
      return _exhaustiveCheck;
  }
}

const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Phase 1',
  status: 'Planned',
  description: 'Test',
  milestones: [],
};

console.log('Type narrowing test:', processItem(phase));
