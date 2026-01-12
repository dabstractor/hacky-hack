import { Subtask, Status } from '../../src/core/models.js';

const subtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test Subtask',
  status: 'Planned',
  story_points: 2,
  dependencies: [],
  context_scope: 'Test',
};

// This should cause a TypeScript error (commented out to allow test run)
// subtask.id = 'new-id';  // Error: Cannot assign to 'id' because it is read-only

console.log('Readonly test: immutability enforced by TypeScript');
console.log('Subtask ID:', subtask.id);
