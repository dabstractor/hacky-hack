/**
 * PRP (Product Requirement Prompt) sample fixtures at various quality levels
 *
 * @remarks
 * Provides test fixtures for quality gate validation testing. These samples
 * represent PRPs at different quality levels:
 * - COMPLETE_PRP: Passes all quality gates
 * - INCOMPLETE_CONTEXT_PRP: Missing required context sections
 * - VAGUE_PRP: Low information density, vague content
 * - MISSING_SECTIONS_PRP: Missing required PRP sections
 *
 * @see {@link ../../tests/unit/prp-quality-gates.test.ts | Quality Gates Tests}
 */

import type { PRPDocument } from '../../src/core/models.js';

/**
 * Complete PRP sample - passes all quality gates
 *
 * @remarks
 * This fixture represents a high-quality PRP with:
 * - Complete context with all required sections
 * - Specific file paths and code examples
 * - Clear implementation steps
 * - All validation gates defined
 * - Self-contained with explicit references
 */
export const COMPLETE_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S1',
  objective: 'Create TypeScript interfaces for task hierarchy',
  context: `
## All Needed Context

### Context Completeness Check
Complete - all required context included for implementation.

### Documentation & References
\`\`\`yaml
# MUST READ - TypeScript interface patterns
- url: https://www.typescriptlang.org/docs/handbook/interfaces.html
  why: Reference for TypeScript interface best practices
  section: "readonly properties" for immutability

# Reference implementation - existing models
- file: src/core/models.ts
  why: Contains existing TypeScript patterns to follow
  pattern: readonly properties, JSDoc comments, Zod schemas
\`\`\`

### Current Codebase Tree
\`\`\`bash
src/
├── agents/
└── core/
    └── models.ts    # Existing model definitions
\`\`\`

### Desired Codebase Tree
\`\`\`bash
src/
├── agents/
└── core/
    └── models.ts    # Extended with Phase, Milestone, Task, Subtask interfaces
\`\`\`

### Known Gotchas & Library Quirks
\`\`\`typescript
// CRITICAL: Use readonly properties for interface immutability
// All model interfaces use readonly to prevent mutation
// Pattern: readonly fieldName: type;

// CRITICAL: Export both interface and Zod schema
// Pattern: export interface Name { ... }
//         export const NameSchema: z.ZodType<Name> = z.object({...});

// GOTCHA: Zod schemas must use z.ZodType<T> for type inference
// Don't use z.object() directly without generic type parameter
\`\`\`
`,
  implementationSteps: [
    'Create Phase interface with readonly id and title properties',
    'Create Milestone interface with readonly properties',
    'Create Task interface with dependencies array',
    'Create Subtask interface',
    'Create Zod schemas for each interface using z.ZodType<T> pattern',
    'Export all interfaces and schemas from models.ts',
  ],
  validationGates: [
    {
      level: 1,
      description: 'Syntax & Style validation',
      command: 'npx tsc --noEmit',
      manual: false,
    },
    {
      level: 2,
      description: 'Unit tests',
      command: 'uv run vitest tests/unit/core/models.test.ts',
      manual: false,
    },
    {
      level: 3,
      description: 'Integration tests',
      command: 'uv run vitest tests/integration/',
      manual: false,
    },
    {
      level: 4,
      description: 'Manual verification',
      command: null,
      manual: true,
    },
  ],
  successCriteria: [
    {
      description: 'Phase interface defined with readonly properties',
      satisfied: false,
    },
    { description: 'Milestone interface defined', satisfied: false },
    {
      description: 'Task interface defined with dependencies',
      satisfied: false,
    },
    { description: 'Subtask interface defined', satisfied: false },
    { description: 'All Zod schemas exported', satisfied: false },
    { description: 'TypeScript compiles without errors', satisfied: false },
  ],
  references: [
    'https://www.typescriptlang.org/docs/handbook/interfaces.html',
    'src/core/models.ts',
  ],
};

/**
 * Incomplete PRP sample - fails context completeness check
 *
 * @remarks
 * This fixture has minimal context without the required subsections:
 * - Missing "Documentation & References" section
 * - Missing "Current Codebase Tree" section
 * - Missing "Desired Codebase Tree" section
 * - Missing "Known Gotchas & Library Quirks" section
 */
export const INCOMPLETE_CONTEXT_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S2',
  objective: 'Add validation logic',
  context: `
## Context

Some basic context here but missing the required subsections.
This should fail the context completeness check.
`,
  implementationSteps: ['Step 1: Add validation', 'Step 2: Test it'],
  validationGates: [
    {
      level: 1,
      description: 'Syntax check',
      command: 'npx tsc --noEmit',
      manual: false,
    },
    { level: 2, description: 'Unit tests', command: 'npm test', manual: false },
    {
      level: 3,
      description: 'Integration tests',
      command: 'npm run test:integration',
      manual: false,
    },
    { level: 4, description: 'Manual review', command: null, manual: true },
  ],
  successCriteria: [{ description: 'Validation added', satisfied: false }],
  references: [],
};

/**
 * Vague PRP sample - fails information density check
 *
 * @remarks
 * This fixture contains generic, low-information content:
 * - Generic phrases like "properly", "best practices", "good coding standards"
 * - No specific file paths or concrete examples
 * - No specific commands or implementation details
 * - Low information-to-token ratio
 */
export const VAGUE_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S3',
  objective: 'Implement the feature',
  context: `
## Context

Please implement the feature properly. Follow best practices.
Use good coding standards and make sure it works well.

The implementation should be clean and well-structured.
Make sure to test everything properly.

### Documentation
Check the docs for more info about how to do this correctly.
`,
  implementationSteps: [
    'Do the implementation',
    'Make it work',
    'Test it',
    'Clean up the code',
  ],
  validationGates: [
    { level: 1, description: 'Test', command: 'npm test', manual: false },
    { level: 2, description: 'Test', command: 'npm test', manual: false },
    { level: 3, description: 'Test', command: 'npm test', manual: false },
    { level: 4, description: 'Manual', command: null, manual: true },
  ],
  successCriteria: [{ description: 'Feature works', satisfied: false }],
  references: [],
};

/**
 * PRP with missing sections - fails template structure compliance
 *
 * @remarks
 * This fixture has empty context and minimal arrays:
 * - Empty context string
 * - Empty implementation steps
 * - Empty success criteria
 * - Minimal validation gates
 */
export const MISSING_SECTIONS_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S4',
  objective: 'Create something',
  context: '',
  implementationSteps: [],
  validationGates: [
    { level: 1, description: 'Test', command: 'npm test', manual: false },
    { level: 2, description: 'Test', command: 'npm test', manual: false },
    { level: 3, description: 'Test', command: 'npm test', manual: false },
    { level: 4, description: 'Manual', command: null, manual: true },
  ],
  successCriteria: [],
  references: [],
};

/**
 * PRP with undefined references - fails "No Prior Knowledge" test
 *
 * @remarks
 * This fixture references files and resources without proper context:
 * - Uses "some file" instead of specific paths
 * - References "the docs" without URL
 * - Mentions "that module" without specifying which one
 */
export const UNDEFINED_REFERENCES_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S5',
  objective: 'Modify some module',
  context: `
## Context

You need to modify some file in the src directory.
Check the docs for more information about this.

The module in question should be updated based on that other file.
Look at the examples folder for reference.
`,
  implementationSteps: ['Find the right file', 'Make the changes', 'Test it'],
  validationGates: [
    { level: 1, description: 'Test', command: 'npm test', manual: false },
    { level: 2, description: 'Test', command: 'npm test', manual: false },
    { level: 3, description: 'Test', command: 'npm test', manual: false },
    { level: 4, description: 'Manual', command: null, manual: true },
  ],
  successCriteria: [{ description: 'Changes made', satisfied: false }],
  references: ['some file', 'the docs'],
};

/**
 * PRP with moderate information density
 *
 * @remarks
 * This fixture has some specific information but not as complete as COMPLETE_PRP:
 * - Has some file paths
 * - Some implementation details
 * - Missing comprehensive gotchas
 */
export const MODERATE_DENSITY_PRP: PRPDocument = {
  taskId: 'P1.M1.T1.S6',
  objective: 'Add error handling to API calls',
  context: `
## Context

### Context Completeness Check
Moderate - has basic references but missing detailed gotchas.

### Documentation & References
Check https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API for fetch patterns.
See src/api/handler.ts for current implementation.

### Current Codebase Tree
\`\`\`bash
src/
└── api/
    ├── handler.ts
    └── client.ts
\`\`\`

### Desired Codebase Tree
\`\`\`bash
src/
└── api/
    ├── handler.ts    # With error handling
    ├── client.ts     # With retry logic
    └── errors.ts     # New error types
\`\`\`

### Known Gotchas
Network errors need different handling than HTTP errors.

### Implementation
Wrap fetch calls in src/api/client.ts with try-catch. Handle network errors and HTTP errors.
Add error types to src/api/errors.ts.
`,
  implementationSteps: [
    'Create error types in src/api/errors.ts',
    'Wrap fetch calls in src/api/client.ts with try-catch',
    'Add error logging to src/api/handler.ts',
  ],
  validationGates: [
    {
      level: 1,
      description: 'Type check',
      command: 'npx tsc --noEmit',
      manual: false,
    },
    { level: 2, description: 'Unit tests', command: 'npm test', manual: false },
    {
      level: 3,
      description: 'Integration tests',
      command: 'npm run test:integration',
      manual: false,
    },
    { level: 4, description: 'Manual', command: null, manual: true },
  ],
  successCriteria: [{ description: 'Error handling added', satisfied: false }],
  references: [
    'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
    'src/api/handler.ts',
  ],
};
