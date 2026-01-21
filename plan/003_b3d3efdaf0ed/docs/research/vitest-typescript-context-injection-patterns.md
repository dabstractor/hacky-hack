# Vitest/TypeScript Testing Patterns for Context Injection and Agent Context Management

## Overview

This research document explores best practices for testing context injection and agent context management in TypeScript/Vitest environments, specifically for PRP (Product Requirement Prompt) systems and AI agent development.

## 1. Mocking and Verifying Context Assembly Functions

### Pattern 1: Structured Mock Data with Schemas

```typescript
// tests/unit/agents/prompts/prp-blueprint-prompt.test.ts

const mockBacklog: Backlog = {
  backlog: [
    {
      id: 'P2',
      type: 'Phase',
      title: 'Phase 2: Core Agent System',
      status: 'Planned',
      description: 'Groundswell agent integration and prompt system',
      milestones: [
        {
          id: 'P2.M2',
          type: 'Milestone',
          title: 'Milestone 2.2: PRP System',
          status: 'Planned',
          description: 'PRP generation and execution system',
          tasks: [
            // ... complete task hierarchy
          ],
        },
      ],
    },
  ],
};
```

### Pattern 2: Context Extraction Verification

```typescript
it('should extract parent context (Phase, Milestone, Task)', () => {
  // SETUP: Get a test subtask
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];

  // EXECUTE: Generate the prompt
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  // VERIFY: Parent context is included
  expect(prompt.user).toContain('Parent Context');
  expect(prompt.user).toContain(
    'Groundswell agent integration and prompt system'
  ); // Phase description
  expect(prompt.user).toContain('PRP generation and execution system'); // Milestone description
});
```

### Pattern 3: Hierarchical Context Testing

```typescript
describe('context extraction', () => {
  it('should extract Phase description for parent context', () => {
    // Test each level of hierarchy independently
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    const prompt = createPRPBlueprintPrompt(task, mockBacklog);

    expect(prompt.user).toContain('Groundswell agent integration and prompt system');
  });

  it('should extract Milestone description for parent context', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    const prompt = createPRPBlueprintPrompt(task, mockBacklog);

    expect(prompt.user).toContain('PRP generation and execution system');
  });

  it('should extract Task description for parent context when input is Subtask', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    const prompt = createPRPBlueprintPrompt(task, mockBacklog);

    expect(prompt.user).toContain('Build prompt generators for PRP creation');
  });
});
```

## 2. Testing Prompt Construction and Template Injection

### Pattern 4: Template Placeholder Replacement Verification

```typescript
it('should replace <item_title> and <item_description> placeholders', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  // Verify actual content is included
  expect(prompt.user).toContain(task.title);

  // Verify placeholders are still present for LLM replacement
  expect(prompt.user).toContain('<item_title>');
});
```

### Pattern 5: Conditional Content Injection

```typescript
describe('conditional content injection', () => {
  it('should include codebase path when provided', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    const codebasePath = '/home/dustin/projects/hacky-hack';

    const prompt = createPRPBlueprintPrompt(task, mockBacklog, codebasePath);

    expect(prompt.user).toContain('Codebase Analysis');
    expect(prompt.user).toContain(codebasePath);
  });

  it('should not include codebase section when path is not provided', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    const prompt = createPRPBlueprintPrompt(task, mockBacklog);

    expect(prompt.user).not.toContain('The codebase is located at:');
  });
});
```

### Pattern 6: Context Scope Contract Validation

```typescript
it('should include context_scope for Subtask input', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  expect(prompt.user).toContain(task.context_scope);
  expect(prompt.user).toContain('Context Scope:');
});
```

## 3. Unit Testing Context Gathering and Injection Logic

### Pattern 7: Dependency Context Testing

```typescript
it('should include dependency context for Subtask with dependencies', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  expect(prompt.user).toContain('Dependencies:');
  expect(prompt.user).toContain('P2.M2.T2.S1');
});

it('should handle Subtask with no dependencies', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[0];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  expect(prompt.user).toContain('Dependencies: None');
});
```

### Pattern 8: Task Type Differentiation

```typescript
it('should include description for Task input', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0] as Task;
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  expect(prompt.user).toContain(task.description);
  expect(prompt.user).toContain('Description:');
});

it('should handle Task input (not just Subtask)', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0] as Task;
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  expect(prompt).toBeDefined();
  expect(prompt.user).toContain(task.title);
  expect(prompt.user).toContain('Description:');
});
```

## 4. Testing Session State and Caching Mechanisms

### Pattern 9: Session State Serialization Tests

```typescript
// tests/unit/core/session-state-serialization.test.ts

describe('Session State Serialization', () => {
  it('should serialize and deserialize SessionState without data loss', () => {
    const originalState: SessionState = {
      metadata: mockMetadata,
      prdSnapshot: '# PRD Content\n...',
      taskRegistry: mockBacklog,
      currentItemId: 'P1.M1.T1.S1',
    };

    const serialized = JSON.stringify(originalState);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(originalState);
    expect(deserialized.metadata.createdAt).toBeInstanceOf(Date);
  });

  it('should handle delta session serialization', () => {
    const deltaSession: DeltaSession = {
      ...originalState,
      oldPRD: '# Original PRD\n...',
      newPRD: '# Updated PRD\n...',
      diffSummary: 'Added new feature',
    };

    const serialized = JSON.stringify(deltaSession);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.oldPRD).toBeDefined();
    expect(deserialized.newPRD).toBeDefined();
    expect(deserialized.diffSummary).toBeDefined();
  });
});
```

### Pattern 10: Session Hash Detection Tests

```typescript
// tests/unit/core/session-hash-detection.test.ts

describe('Session Hash Detection', () => {
  it('should detect PRD changes requiring delta session', () => {
    const originalHash = 'abc123def456';
    const newHash = 'xyz789abc123';

    const needsDelta = calculateHashDifference(originalHash, newHash);
    expect(needsDelta).toBe(true);
  });

  it('should identify unchanged PRD for session reuse', () => {
    const originalHash = 'abc123def456';
    const currentHash = 'abc123def456';

    const canReuse = canReuseSession(originalHash, currentHash);
    expect(canReuse).toBe(true);
  });
});
```

## 5. Testing Context Validation and Schema Checking

### Pattern 11: Zod Schema Validation Tests

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

  it('should reject invalid context_scope format', () => {
    const invalidScope = 'This is not a valid contract definition';

    const result = ContextScopeSchema.safeParse(invalidScope);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(1);
  });

  it('should validate PRPDocument structure', () => {
    const prpDocument: PRPDocument = {
      taskId: 'P1.M2.T2.S2',
      objective: 'Add PRP document interfaces',
      context: '# Context\n...',
      implementationSteps: ['Step 1'],
      validationGates: [
        { level: 1, description: 'Syntax check', command: 'npm run lint', manual: false }
      ],
      successCriteria: [{ description: 'All interfaces added', satisfied: false }],
      references: ['https://example.com'],
    };

    const result = PRPDocumentSchema.safeParse(prpDocument);
    expect(result.success).toBe(true);
  });
});
```

## 6. Best Practices for Context Injection Testing

### Practice 1: Comprehensive Mock Data
- Create realistic, hierarchical mock data that matches the actual data structures
- Include edge cases (empty dependencies, missing descriptions, etc.)
- Use test fixtures shared across multiple tests

### Practice 2: Granular Verification
- Test individual pieces of context injection separately
- Verify both positive cases (content should be present) and negative cases (content should be absent)
- Test hierarchy traversal from leaf to root

### Practice 3: Integration Testing
- Test that injected context flows through the entire prompt generation pipeline
- Verify that the final prompt contains all expected context sections
- Test the interaction between different context types

### Practice 4: Performance Testing
```typescript
// Benchmark context extraction performance
import { benchmark } from 'vitest';

describe('context extraction performance', () => {
  benchmark('extract parent context', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    extractParentContext(task.id, mockBacklog);
  }, { iterations: 1000 });

  benchmark('construct user prompt', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    constructUserPrompt(task, mockBacklog);
  }, { iterations: 1000 });
});
```

### Practice 5: Error Handling Tests
```typescript
describe('error handling', () => {
  it('should handle invalid task ID gracefully', () => {
    const invalidTask = { ...mockSubtask, id: 'INVALID.ID' };

    expect(() => {
      createPRPBlueprintPrompt(invalidTask, mockBacklog);
    }).toThrow();
  });

  it('should handle missing parent items gracefully', () => {
    const taskWithMissingParent = {
      ...mockSubtask,
      id: 'P99.M99.T99.S99'
    };

    const prompt = createPRPBlueprintPrompt(taskWithMissingParent, mockBacklog);
    expect(prompt.user).toContain('No parent context (root level item)');
  });
});
```

## 7. Advanced Testing Patterns

### Pattern 12: Context Token Estimation
```typescript
// Estimate token usage for context injection
function estimateContextTokens(context: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(context.length / 4);
}

it('should respect token limits for context injection', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  const userPromptTokens = estimateContextTokens(prompt.user);
  expect(userPromptTokens).toBeLessThan(8000); // Typical LLM context limit
});
```

### Pattern 13: Delta Context Merging
```typescript
// tests/unit/core/prd-differ.test.ts
describe('Delta Context Merging', () => {
  it('should merge context changes correctly', () => {
    const oldContext = 'Old PRD content';
    const newContext = 'Updated PRD content';
    const changes = analyzePRDChanges(oldContext, newContext);

    expect(changes.changes).toHaveLength(1);
    expect(changes.patchInstructions).toContain('re-execute');
  });

  it('should identify unchanged tasks for reuse', () => {
    const oldPRD = 'Original PRD';
    const newPRD = 'Updated PRD with minor changes';
    const analysis = analyzePRDChanges(oldPRD, newPRD);

    expect(analysis.taskIds).toHaveLength(1); // Only changed tasks need re-execution
  });
});
```

## Conclusion

These testing patterns provide a comprehensive approach to testing context injection and agent context management in TypeScript/Vitest environments. The key principles are:

1. **Structure**: Use hierarchical mock data that matches real-world scenarios
2. **Granularity**: Test each piece of context injection independently
3. **Integration**: Verify the complete context flow through the system
4. **Validation**: Use schema validation for structured data
5. **Performance**: Monitor context extraction and injection performance
6. **Error Handling**: Test edge cases and failure scenarios

These patterns can be adapted to various AI agent systems and prompt engineering workflows.