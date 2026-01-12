import {
  SessionMetadata,
  SessionState,
  DeltaSession,
  Backlog,
  Phase
} from '../../src/core/models.js';

// Verify SessionMetadata interface
const metadata: SessionMetadata = {
  id: '001_14b9dc2a33c7',
  hash: '14b9dc2a33c7',
  path: 'plan/001_14b9dc2a33c7',
  createdAt: new Date('2024-01-12T10:00:00Z'),
  parentSession: null
};

console.log('SessionMetadata:', metadata);

// Verify SessionState interface
const phase: Phase = {
  id: 'P1',
  type: 'Phase',
  title: 'Phase 1',
  status: 'Planned',
  description: 'Test phase',
  milestones: []
};

const backlog: Backlog = { backlog: [phase] };

const state: SessionState = {
  metadata: metadata,
  prdSnapshot: '# PRD Content\n...',
  taskRegistry: backlog,
  currentItemId: 'P1.M1.T1.S1'
};

console.log('SessionState:', state);

// Verify DeltaSession interface
const delta: DeltaSession = {
  metadata: {
    id: '002_a3f8e9d12b4',
    hash: 'a3f8e9d12b4',
    path: 'plan/002_a3f8e9d12b4',
    createdAt: new Date(),
    parentSession: '001_14b9dc2a33c7'
  },
  prdSnapshot: '# Updated PRD\n...',
  taskRegistry: backlog,
  currentItemId: null,
  oldPRD: '# Original PRD\n...',
  newPRD: '# Updated PRD\n...',
  diffSummary: 'Added new feature X'
};

console.log('DeltaSession:', delta);

// Verify type narrowing works
function processSession(session: SessionState): string {
  if ('oldPRD' in session) {
    const delta = session as DeltaSession;
    return `Delta session from ${delta.metadata.parentSession}`;
  }
  return `Initial session ${session.metadata.id}`;
}

console.log('Type narrowing test:');
console.log('  State:', processSession(state));
console.log('  Delta:', processSession(delta));

console.log('\nAll type validations passed!');
