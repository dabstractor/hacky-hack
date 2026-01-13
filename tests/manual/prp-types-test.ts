import {
  ValidationGate,
  SuccessCriterion,
  PRPDocument,
  PRPArtifact,
} from '../../src/core/models.js';

// Verify ValidationGate interface for all levels
console.log('Testing ValidationGate interface...');

const level1Gate: ValidationGate = {
  level: 1,
  description: 'Syntax & Style validation',
  command: 'npm run lint && npm run type-check',
  manual: false,
};
console.log('  Level 1 gate:', level1Gate);

const level2Gate: ValidationGate = {
  level: 2,
  description: 'Unit Tests validation',
  command: 'npm test',
  manual: false,
};
console.log('  Level 2 gate:', level2Gate);

const level3Gate: ValidationGate = {
  level: 3,
  description: 'Integration Testing validation',
  command: 'npm run test:integration',
  manual: false,
};
console.log('  Level 3 gate:', level3Gate);

const level4Gate: ValidationGate = {
  level: 4,
  description: 'Manual end-to-end testing',
  command: null,
  manual: true,
};
console.log('  Level 4 gate:', level4Gate);

// Verify SuccessCriterion interface
console.log('\nTesting SuccessCriterion interface...');

const satisfiedCriterion: SuccessCriterion = {
  description: 'All four interfaces added to src/core/models.ts',
  satisfied: true,
};
console.log('  Satisfied criterion:', satisfiedCriterion);

const unsatisfiedCriterion: SuccessCriterion = {
  description: 'All validation gates passing',
  satisfied: false,
};
console.log('  Unsatisfied criterion:', unsatisfiedCriterion);

// Verify PRPDocument interface
console.log('\nTesting PRPDocument interface...');

const prp: PRPDocument = {
  taskId: 'P1.M2.T2.S2',
  objective: 'Add TypeScript interfaces and Zod schemas to src/core/models.ts',
  context:
    '# All Needed Context\n\nThis PRP provides complete context for implementation...',
  implementationSteps: [
    'Create ValidationGate interface and schema',
    'Create SuccessCriterion interface and schema',
    'Create PRPDocument interface and schema',
    'Create PRPArtifact interface and schema',
    'Create manual test file',
    'Add Zod schema tests to models.test.ts',
  ],
  validationGates: [level1Gate, level2Gate, level3Gate, level4Gate],
  successCriteria: [satisfiedCriterion, unsatisfiedCriterion],
  references: [
    'https://github.com/anthropics/claude-code',
    'src/core/models.ts',
    'PROMPTS.md',
  ],
};
console.log('  PRP Document:', prp);

// Verify PRPArtifact interface for all status types
console.log('\nTesting PRPArtifact interface...');

const generatedArtifact: PRPArtifact = {
  taskId: 'P1.M2.T2.S2',
  prpPath: 'plan/001_14b9dc2a33c7/P1M2T2S2/PRP.md',
  status: 'Generated',
  generatedAt: new Date('2024-01-12T10:00:00Z'),
};
console.log('  Generated artifact:', generatedArtifact);

const executingArtifact: PRPArtifact = {
  taskId: 'P1.M2.T2.S2',
  prpPath: 'plan/001_14b9dc2a33c7/P1M2T2S2/PRP.md',
  status: 'Executing',
  generatedAt: new Date('2024-01-12T10:00:00Z'),
};
console.log('  Executing artifact:', executingArtifact);

const completedArtifact: PRPArtifact = {
  taskId: 'P1.M2.T2.S2',
  prpPath: 'plan/001_14b9dc2a33c7/P1M2T2S2/PRP.md',
  status: 'Completed',
  generatedAt: new Date('2024-01-12T10:00:00Z'),
};
console.log('  Completed artifact:', completedArtifact);

const failedArtifact: PRPArtifact = {
  taskId: 'P1.M2.T2.S2',
  prpPath: 'plan/001_14b9dc2a33c7/P1M2T2S2/PRP.md',
  status: 'Failed',
  generatedAt: new Date('2024-01-12T10:00:00Z'),
};
console.log('  Failed artifact:', failedArtifact);

// Test type narrowing on status field
console.log('\nTesting type narrowing on status field...');

function processArtifact(artifact: PRPArtifact): string {
  switch (artifact.status) {
    case 'Generated':
      return `PRP generated at ${artifact.generatedAt.toISOString()}`;
    case 'Executing':
      return `PRP currently executing for ${artifact.taskId}`;
    case 'Completed':
      return `PRP completed successfully`;
    case 'Failed':
      return `PRP execution failed`;
    default: {
      // NOTE: All status types are covered above, so this should never be reached
      const _exhaustive: never = artifact.status;
      return _exhaustive;
    }
  }
}

console.log('  Generated:', processArtifact(generatedArtifact));
console.log('  Executing:', processArtifact(executingArtifact));
console.log('  Completed:', processArtifact(completedArtifact));
console.log('  Failed:', processArtifact(failedArtifact));

// Test readonly properties (compile-time check)
console.log('\nTesting readonly properties...');

// NOTE: Uncommenting the following lines would cause TypeScript errors:
// level1Gate.level = 2;  // Error: Cannot assign to readonly property
// prp.taskId = 'P1.M2.T2.S3';  // Error: Cannot assign to readonly property

// Test nullable fields
console.log('\nTesting nullable fields...');

const manualGate: ValidationGate = {
  level: 4,
  description: 'Manual validation',
  command: null, // null is valid for command field
  manual: true,
};
console.log('  Manual gate with null command:', manualGate);

// NOTE: The following would cause a TypeScript error because command must be string | null:
// const invalidGate: ValidationGate = {
//   level: 1,
//   description: 'Test',
//   command: undefined,  // Error: Type 'undefined' is not assignable to type 'string | null'
//   manual: false,
// };

console.log('\nAll PRP type validations passed!');
