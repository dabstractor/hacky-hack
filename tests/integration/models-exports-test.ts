// Verify the module can be imported (TypeScript types are compile-time only)
import { Backlog, Phase, Status, ItemType } from '../../src/core/models.js';

// TypeScript types are erased at runtime, so we verify by using them
const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Phase 1',
  status: 'Planned',
  description: 'Test',
  milestones: [],
};

const backlog: Backlog = { backlog: [phase] };

// Verify types work correctly
const status: Status = 'Complete';
const itemType: ItemType = 'Subtask';

console.log('Module imports successfully!');
console.log(
  'All types are accessible (TypeScript types are compile-time only)'
);
console.log('Backlog has', backlog.backlog.length, 'phase(s)');
