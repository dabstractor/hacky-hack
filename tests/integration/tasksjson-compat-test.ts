import { Backlog } from '../../src/core/models.js';
import { readFileSync } from 'fs';

// Read the actual tasks.json file
const tasksJsonPath = 'plan/001_14b9dc2a33c7/tasks.json';
const tasksJson = JSON.parse(readFileSync(tasksJsonPath, 'utf-8'));

// Verify it matches the Backlog interface
const backlog: Backlog = tasksJson;

console.log('tasks.json compatibility test passed!');
console.log('Backlog has', backlog.backlog.length, 'phase(s)');

// Find first subtask and verify its structure
for (const phase of backlog.backlog) {
  for (const milestone of phase.milestones) {
    for (const task of milestone.tasks) {
      if (task.subtasks.length > 0) {
        const subtask = task.subtasks[0];
        console.log('Sample subtask:', {
          id: subtask.id,
          type: subtask.type,
          title: subtask.title,
          status: subtask.status,
          story_points: subtask.story_points
        });
        break;
      }
    }
    break;
  }
}
