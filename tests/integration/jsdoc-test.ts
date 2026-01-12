import { Subtask } from '../../src/core/models.js';

// Hover over 'subtask' in an IDE to see JSDoc
// This test verifies the file compiles (JSDoc syntax errors prevent compilation)
const subtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test',
  status: 'Planned',
  story_points: 1,
  dependencies: [],
  context_scope: 'Test'
};

console.log('JSDoc parse test: TypeScript compiled successfully with JSDoc comments');
