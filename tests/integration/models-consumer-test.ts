import { Backlog, Phase } from '../../src/core/models.js';

const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Phase 1',
  status: 'Planned',
  description: 'Test phase',
  milestones: []
};

const backlog: Backlog = {
  backlog: [phase]
};

console.log('Consumer test passed!');
console.log('Backlog has', backlog.backlog.length, 'phase(s)');
