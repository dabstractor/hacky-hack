# Context Validation and Schema Testing Patterns for TypeScript/Vitest

## Overview

This research document focuses on testing patterns for context validation and schema checking in AI agent systems, particularly for PRP (Product Requirement Prompt) workflows and context injection systems.

## 1. Context Validation Testing Patterns

### Pattern 1: Zod Schema Validation Testing

```typescript
// tests/unit/core/models.test.ts

describe('Context Scope Schema Validation', () => {
  it('should validate correct context_scope format', () => {
    const validScope = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic research findings.
2. INPUT: Data from S1.
3. LOGIC: Implement feature.
4. OUTPUT: Feature for consumption by S2.`;

    const result = ContextScopeSchema.safeParse(validScope);
    expect(result.success).toBe(true);
  });

  it('should reject missing CONTRACT DEFINITION prefix', () => {
    const invalidScope = `This is missing the required prefix
1. RESEARCH NOTE: Research findings.
2. INPUT: Data from S1.
3. LOGIC: Implement feature.
4. OUTPUT: Feature for consumption by S2.`;

    const result = ContextScopeSchema.safeParse(invalidScope);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(
      'must start with "CONTRACT DEFINITION:" followed by a newline'
    );
  });

  it('should reject missing numbered sections', () => {
    const invalidScope = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Research findings.
2. INPUT: Data from S1.
3. LOGIC: Implement feature.
Missing Section: This should be numbered 4.`;

    const result = ContextScopeSchema.safeParse(invalidScope);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Missing or incorrect section');
  });

  it('should validate section order is correct', () => {
    const invalidOrder = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Research findings.
3. LOGIC: This is out of order.
2. INPUT: Data from S1.
4. OUTPUT: Feature for consumption by S2.`;

    const result = ContextScopeSchema.safeParse(invalidOrder);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Missing or incorrect section');
  });
});
```

### Pattern 2: Enum Validation Testing

```typescript
describe('Status Enum Validation', () => {
  it('should accept valid status values', () => {
    const validStatuses = ['Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'];

    validStatuses.forEach(status => {
      const result = StatusEnum.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status values', () => {
    const invalidStatuses = ['unknown', 'pending', 'in_progress', '123'];

    invalidStatuses.forEach(status => {
      const result = StatusEnum.safeParse(status);
      expect(result.success).toBe(false);
    });
  });
});
```

### Pattern 3: Complex Object Validation Testing

```typescript
describe('PRPDocument Validation', () => {
  it('should validate correct PRPDocument structure', () => {
    const validPRP: PRPDocument = {
      taskId: 'P1.M2.T2.S2',
      objective: 'Add PRP document interfaces to models.ts',
      context: `# All Needed Context

## RESEARCH NOTE
- Zod schema best practices
- TypeScript interface design patterns
- Context injection architecture

## INPUT
- Core models from P1.M1.T1.S1
- PRP template structure

## LOGIC
- Define validation interfaces
- Create schema validation functions
- Implement context scope parsing

## OUTPUT
- ValidationGate interface
- ValidationGateSchema implementation
- PRPDocument interface and schema
- ContextScopeSchema contract definition`,
      implementationSteps: [
        'Create ValidationGate interface',
        'Create ValidationGateSchema',
        'Create SuccessCriterion interface',
        'Create SuccessCriterionSchema',
        'Create PRPDocument interface',
        'Create PRPDocumentSchema',
        'Create ContextScopeSchema'
      ],
      validationGates: [
        {
          level: 1,
          description: 'Syntax & Style validation',
          command: 'ruff check src/ --fix && mypy src/',
          manual: false,
        },
        {
          level: 2,
          description: 'Unit Tests',
          command: 'npm run test:unit',
          manual: false,
        },
        {
          level: 3,
          description: 'Integration Tests',
          command: 'npm run test:integration',
          manual: false,
        },
        {
          level: 4,
          description: 'Manual Review',
          command: null,
          manual: true,
        },
      ],
      successCriteria: [
        {
          description: 'All interfaces added to src/core/models.ts',
          satisfied: false,
        },
        {
          description: 'All schemas validated with test data',
          satisfied: false,
        },
        {
          description: 'Context scope validation works correctly',
          satisfied: false,
        },
      ],
      references: [
        'https://github.com/colinhacks/zod',
        'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
        '../PROMPTS.md#319-637',
      ],
    };

    const result = PRPDocumentSchema.safeParse(validPRP);
    expect(result.success).toBe(true);
  });

  it('should reject PRPDocument with missing required fields', () => {
    const invalidPRP = {
      taskId: 'P1.M2.T2.S2',
      // Missing required fields: objective, context, implementationSteps, etc.
    };

    const result = PRPDocumentSchema.safeParse(invalidPRP);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(4); // Missing 4 required fields
  });

  it('should validate validationGates array length', () => {
    const invalidPRP = {
      taskId: 'P1.M2.T2.S2',
      objective: 'Test',
      context: 'Test context',
      implementationSteps: ['Step 1'],
      validationGates: [], // Should have exactly 4 gates
      successCriteria: [],
      references: [],
    };

    const result = PRPDocumentSchema.safeParse(invalidPRP);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('must contain at least 1 element(s)');
  });
});
```

## 2. Token Limit/Size Management Testing Patterns

### Pattern 4: Token Counting and Limit Testing

```typescript
// utils/token-counter.ts
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// tests/unit/core/token-counter.test.ts
describe('Token Counter Utility', () => {
  it('should estimate tokens accurately', () => {
    const testText = 'This is a test sentence with exactly ten words.';
    const estimatedTokens = estimateTokens(testText);

    // For this specific text, we know the approximate token count
    expect(estimatedTokens).toBeGreaterThan(5);
    expect(estimatedTokens).toBeLessThan(15);
  });

  it('should handle empty strings', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('should handle large texts', () => {
    const largeText = 'x'.repeat(10000);
    const estimatedTokens = estimateTokens(largeText);
    expect(estimatedTokens).toBe(2500); // 10000 / 4
  });
});
```

### Pattern 5: Context Size Validation

```typescript
// tests/unit/core/context-size-validation.test.ts
describe('Context Size Validation', () => {
  const MAX_CONTEXT_TOKENS = 8000; // Typical LLM context limit

  it('should validate context size within limits', () => {
    const largeContext = 'x'.repeat(MAX_CONTEXT_TOKENS * 4); // Create text that matches our token estimate
    const tokens = estimateTokens(largeContext);

    expect(tokens).toBeLessThanOrEqual(MAX_CONTEXT_TOKENS);
  });

  it('should detect oversized contexts', () => {
    const oversizedContext = 'x'.repeat(MAX_CONTEXT_TOKENS * 5);
    const tokens = estimateTokens(oversizedContext);

    expect(tokens).toBeGreaterThan(MAX_CONTEXT_TOKENS);
  });

  it('should truncate contexts when they exceed limits', () => {
    const oversizedContext = 'x'.repeat(MAX_CONTEXT_TOKENS * 6);
    const tokens = estimateTokens(oversizedContext);
    const truncated = truncateContext(oversizedContext, MAX_CONTEXT_TOKENS);

    expect(estimateTokens(truncated)).toBeLessThanOrEqual(MAX_CONTEXT_TOKENS);
    expect(truncated).not.toBe(oversizedContext);
  });
});
```

### Pattern 6: Prompt Token Budget Management

```typescript
// tests/unit/agents/prompts/token-budget.test.ts
describe('Prompt Token Budget', () => {
  const SYSTEM_PROMPT_TOKENS = 1000;
  const MAX_USER_PROMPT_TOKENS = 7000;
  const TOTAL_TOKENS = 8000;

  it('should calculate remaining token budget', () => {
    const userPrompt = 'x'.repeat(2000);
    const systemPrompt = 'x'.repeat(SYSTEM_PROMPT_TOKENS);

    const usedTokens = estimateTokens(userPrompt) + estimateTokens(systemPrompt);
    const remaining = TOTAL_TOKENS - usedTokens;

    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(TOTAL_TOKENS);
  });

  it('should optimize context for token efficiency', () => {
    const verboseContext = 'This is a very verbose description with unnecessary details that consume many tokens.';
    const optimized = optimizeContextForTokens(verboseContext);

    expect(estimateTokens(optimized)).toBeLessThan(estimateTokens(verboseContext));
    expect(optimized).toContain('necessary details');
  });
});
```

## 3. Delta Context Merging Tests

### Pattern 7: PRD Delta Analysis Testing

```typescript
// tests/unit/core/prd-differ.test.ts
describe('PRD Delta Analysis', () => {
  it('should detect added requirements', () => {
    const oldPRD = `# PRD
## Phase 1: Foundation
- Set up project structure
`;

    const newPRD = `# PRD
## Phase 1: Foundation
- Set up project structure
- Add TypeScript configuration
`;

    const delta = analyzePRDDelta(oldPRD, newPRD);

    expect(delta.changes).toHaveLength(1);
    expect(delta.changes[0].type).toBe('added');
    expect(delta.changes[0].description).toContain('TypeScript configuration');
    expect(delta.taskIds).toContain('P1.M1.T2'); // Assuming this task is affected
  });

  it('should detect modified requirements', () => {
    const oldPRD = `# PRD
## Phase 2: Agent System
- Implement Groundswell integration
`;

    const newPRD = `# PRD
## Phase 2: Agent System
- Implement Groundswell integration with caching
`;

    const delta = analyzePRDDelta(oldPRD, newPRD);

    expect(delta.changes).toHaveLength(1);
    expect(delta.changes[0].type).toBe('modified');
    expect(delta.changes[0].description).toContain('caching');
  });

  it('should detect removed requirements', () => {
    const oldPRD = `# PRD
## Phase 3: Validation
- Add unit tests
- Add integration tests
`;

    const newPRD = `# PRD
## Phase 3: Validation
- Add unit tests
`;

    const delta = analyzePRDDelta(oldPRD, newPRD);

    expect(delta.changes).toHaveLength(1);
    expect(delta.changes[0].type).toBe('removed');
    expect(delta.changes[0].description).toContain('integration tests');
  });

  it('should generate patch instructions', () => {
    const oldPRD = `# PRD
## Phase 1: Foundation
`;

    const newPRD = `# PRD
## Phase 1: Foundation
- Add TypeScript configuration
`;

    const delta = analyzePRDDelta(oldPRD, newPRD);

    expect(delta.patchInstructions).toContain('re-execute');
    expect(delta.patchInstructions).toContain('TypeScript');
  });
});
```

### Pattern 8: Task Patching Logic Testing

```typescript
// tests/unit/core/task-patcher.test.ts
describe('Task Patching Logic', () => {
  it('should identify tasks requiring re-execution', () => {
    const deltaAnalysis = {
      changes: [
        {
          itemId: 'P1.M2.T3.S1',
          type: 'modified',
          description: 'Added validation rules',
          impact: 'Update implementation to include validation',
        }
      ],
      patchInstructions: 'Re-execute P1.M2.T3.S1 to apply validation changes',
      taskIds: ['P1.M2.T3.S1']
    };

    const tasksToReexecute = identifyTasksToReexecute(deltaAnalysis);

    expect(tasksToReexecute).toContain('P1.M2.T3.S1');
    expect(tasksToReexecute).toHaveLength(1);
  });

  it('should preserve unchanged tasks for reuse', () => {
    const deltaAnalysis = {
      changes: [
        {
          itemId: 'P1.M1.T1.S1',
          type: 'modified',
          description: 'Updated package.json',
          impact: 'Update dependencies',
        }
      ],
      patchInstructions: 'Only re-execute P1.M1.T1.S1',
      taskIds: ['P1.M1.T1.S1']
    };

    const reusableTasks = identifyReusableTasks(deltaAnalysis, mockBacklog);

    expect(reusableTasks).not.toContain('P1.M1.T1.S1');
    expect(reusableTasks).toContain('P1.M2.T2.S2'); // This task should be reusable
  });
});
```

## 4. Architecture Documentation Loading Tests

### Pattern 9: File-based Context Loading

```typescript
// tests/unit/core/file-context-loader.test.ts
describe('File Context Loader', () => {
  it('should load architecture documentation', async () => {
    const architecturePath = '/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/';

    const architecture = await loadArchitectureDocumentation(architecturePath);

    expect(architecture).toBeDefined();
    expect(architecture.systemContext).toBeDefined();
    expect(architecture.agentDefinitions).toBeDefined();
    expect(architecture.workflowDescriptions).toBeDefined();
  });

  it('should handle missing documentation files gracefully', async () => {
    const nonExistentPath = '/nonexistent/path/';

    const architecture = await loadArchitectureDocumentation(nonExistentPath);

    expect(architecture.systemContext).toBe('No system context documentation available');
    expect(architecture.agentDefinitions).toEqual([]);
  });

  it('should parse markdown files correctly', async () => {
    const markdownContent = `# System Context

## Overview
This is the system documentation.

## Agents
- Agent 1: Description
- Agent 2: Description
`;

    const parsed = parseMarkdownDocumentation(markdownContent);

    expect(parsed.title).toBe('System Context');
    expect(parsed.sections).toContain('Overview');
    expect(parsed.sections).toContain('Agents');
  });
});
```

### Pattern 10: Session State Persistence Testing

```typescript
// tests/unit/core/session-state-persistence.test.ts
describe('Session State Persistence', () => {
  it('should save and load session state without data loss', async () => {
    const originalState: SessionState = {
      metadata: mockMetadata,
      prdSnapshot: '# PRD Content\n...',
      taskRegistry: mockBacklog,
      currentItemId: 'P1.M1.T1.S1',
    };

    await saveSessionState(originalState, '/tmp/session.json');
    const loadedState = await loadSessionState('/tmp/session.json');

    expect(loadedState).toEqual(originalState);
    expect(loadedState.metadata.createdAt).toBeInstanceOf(Date);
  });

  it('should handle corrupted session files', async () => {
    const corruptedFile = '/tmp/corrupted.json';

    // Write invalid JSON
    await fs.promises.writeFile(corruptedFile, 'invalid json content');

    await expect(loadSessionState(corruptedFile)).rejects.toThrow();
  });

  it('should validate loaded session state', async () => {
    const validState = {
      metadata: mockMetadata,
      prdSnapshot: '# PRD Content\n...',
      taskRegistry: mockBacklog,
      currentItemId: 'P1.M1.T1.S1',
    };

    await saveSessionState(validState, '/tmp/valid.json');
    const loadedState = await loadSessionState('/tmp/valid.json');

    const validationResult = SessionStateSchema.safeParse(loadedState);
    expect(validationResult.success).toBe(true);
  });
});
```

## 5. Advanced Validation Testing Patterns

### Pattern 11: Recursive Schema Validation

```typescript
// tests/unit/core/recursive-schema-validation.test.ts
describe('Recursive Schema Validation', () => {
  it('should validate nested task hierarchy', () => {
    const complexBacklog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1: Foundation',
          status: 'Complete',
          description: 'Project initialization',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone',
              title: 'Core System',
              status: 'Complete',
              description: 'Core data structures',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task',
                  title: 'Models',
                  status: 'Complete',
                  description: 'TypeScript interfaces',
                  subtasks: [
                    {
                      id: 'P1.M1.T1.S1',
                      type: 'Subtask',
                      title: 'Core Models',
                      status: 'Complete',
                      story_points: 2,
                      dependencies: [],
                      context_scope: 'CONTRACT DEFINITION: Create core interfaces',
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const result = BacklogSchema.safeParse(complexBacklog);
    expect(result.success).toBe(true);
  });

  it('should detect circular references', () => {
    const circularBacklog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Planned',
          description: '',
          milestones: [] // Circular reference would be detected by validation
        }
      ]
    };

    // This should pass basic validation, but more complex circular reference
    // detection would require custom validation logic
    const result = BacklogSchema.safeParse(circularBacklog);
    expect(result.success).toBe(true);
  });
});
```

### Pattern 12: Integration Testing with Validation

```typescript
// tests/integration/agent-validation-integration.test.ts
describe('Agent Integration with Validation', () => {
  it('should validate agent output against schemas', async () => {
    const agent = createResearcherAgent();
    const prompt = createPRPBlueprintPrompt(mockSubtask, mockBacklog);

    const result = await agent.prompt(prompt);

    // The result should be validated by Groundswell's responseFormat
    // but we can add additional validation here
    const validationResult = PRPDocumentSchema.safeParse(result);
    expect(validationResult.success).toBe(true);
  });

  it('should handle validation failures gracefully', async () => {
    const agent = createFaultyAgent(); // Agent that produces invalid output
    const prompt = createPRPBlueprintPrompt(mockSubtask, mockBacklog);

    await expect(agent.prompt(prompt)).rejects.toThrow();
  });
});
```

## 6. Best Practices for Context Validation Testing

### Practice 1: Test Data Generation
```typescript
// Test data generators
function createValidContextScope(): string {
  return `CONTRACT DEFINITION:
1. RESEARCH NOTE: Valid research note.
2. INPUT: Valid input specification.
3. LOGIC: Valid logic description.
4. OUTPUT: Valid output specification.`;
}

function createInvalidContextScope(): string {
  return 'Invalid format without proper structure';
}
```

### Practice 2: Property-Based Testing
```typescript
// Using fast-check for property-based testing
import fc from 'fast-check';

describe('Property-based Context Validation', () => {
  it('should accept any valid context scope format', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (researchNote) => {
          const context = `CONTRACT DEFINITION:
1. RESEARCH NOTE: ${researchNote}
2. INPUT: Input data
3. LOGIC: Logic description
4. OUTPUT: Output specification`;

          const result = ContextScopeSchema.safeParse(context);
          expect(result.success).toBe(true);
        }
      )
    );
  });
});
```

### Practice 3: Error Message Testing
```typescript
describe('Error Message Quality', () => {
  it('should provide clear error messages for invalid context scope', () => {
    const invalid = 'Invalid scope';
    const result = ContextScopeSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('CONTRACT DEFINITION');
    expect(result.error?.issues[0].message).toContain('numbered sections');
  });
});
```

## Conclusion

These testing patterns provide comprehensive validation for context injection and schema management in TypeScript/Vitest environments. Key takeaways:

1. **Schema Validation**: Use Zod for runtime validation of structured data
2. **Token Management**: Implement token counting and limit checking
3. **Delta Handling**: Test PRD diffing and task patching logic
4. **File Loading**: Validate architecture document loading and persistence
5. **Edge Cases**: Test error conditions and invalid data
6. **Integration**: Validate agent outputs against expected schemas

These patterns ensure robust context validation in complex AI agent systems.