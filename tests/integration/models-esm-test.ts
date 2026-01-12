// Test ESM import with .js extension
import { Backlog, Status, ItemType } from '../../src/core/models.js';

console.log('ESM import successful!');
console.log('Available Status values:', [
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
console.log('Available ItemType values:', [
  'Phase',
  'Milestone',
  'Task',
  'Subtask',
]);
