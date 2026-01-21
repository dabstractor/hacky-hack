# Comprehensive Testing Patterns Report: Context Injection and Agent Context Management

## Executive Summary

This report synthesizes best practices for testing context injection and agent context management in TypeScript/Vitest environments, with a focus on PRP (Product Requirement Prompt) systems and AI agent development. Based on analysis of existing codebase patterns and external research, this document provides actionable testing strategies for:

1. Context assembly mocking and verification
2. Prompt construction and template injection
3. Context validation and schema checking
4. Token limit/size management
5. Delta context merging
6. File-based context loading
7. Context injection verification

## Overview of Testing Approaches

### Key Testing Categories

1. **Unit Testing**: Isolated testing of individual components (context extractors, schema validators)
2. **Integration Testing**: Testing the flow between components (context → prompt → agent)
3. **Validation Testing**: Testing data integrity and constraints (schema validation, token limits)
4. **Performance Testing**: Testing efficiency and resource usage (token counting, context size)
5. **Error Handling Testing**: Testing edge cases and failure scenarios (invalid data, corrupted files)

## Testing Patterns Repository

### File Structure

```
plan/003_b3d3efdaf0ed/P1M2T2S2/research/
├── vitest-typescript-context-injection-patterns.md
├── context-validation-schema-testing-patterns.md
└── comprehensive-testing-patterns-report.md (this file)
```

## 1. Context Assembly Mocking and Verification Patterns

### Pattern 1: Hierarchical Mock Data Structure

**Key Insight**: Create realistic, multi-level mock data that reflects the actual system hierarchy.

```typescript
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
            // Complete task hierarchy including subtasks
          ],
        },
      ],
    },
  ],
};
```

### Pattern 2: Context Extraction Verification

**Best Practice**: Test each level of context extraction independently and in combination.

```typescript
describe('context extraction', () => {
  it('should extract Phase description for parent context', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    const prompt = createPRPBlueprintPrompt(task, mockBacklog);
    expect(prompt.user).toContain(
      'Groundswell agent integration and prompt system'
    );
  });

  it('should include dependency context for Subtask with dependencies', () => {
    const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
    const prompt = createPRPBlueprintPrompt(task, mockBacklog);
    expect(prompt.user).toContain('Dependencies: P2.M2.T2.S1');
  });
});
```

## 2. Prompt Construction and Template Injection Patterns

### Pattern 3: Template Placeholder Testing

**Key Insight**: Verify both the inclusion of actual content and the presence of placeholders for LLM replacement.

```typescript
it('should replace <item_title> and <item_description> placeholders', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);

  // Verify actual content is included
  expect(prompt.user).toContain(task.title);

  // Verify placeholders are still present
  expect(prompt.user).toContain('<item_title>');
});
```

### Pattern 4: Conditional Content Injection

**Best Practice**: Test both positive and negative cases for conditional content.

```typescript
describe('conditional content injection', () => {
  it('should include codebase path when provided', () => {
    const codebasePath = '/home/dustin/projects/hacky-hack';
    const prompt = createPRPBlueprintPrompt(
      mockTask,
      mockBacklog,
      codebasePath
    );
    expect(prompt.user).toContain('Codebase Analysis');
    expect(prompt.user).toContain(codebasePath);
  });

  it('should not include codebase section when path is not provided', () => {
    const prompt = createPRPBlueprintPrompt(mockTask, mockBacklog);
    expect(prompt.user).not.toContain('The codebase is located at:');
  });
});
```

## 3. Context Validation and Schema Testing Patterns

### Pattern 5: Comprehensive Schema Validation

**Key Insight**: Test both valid and invalid cases for all schema validations.

```typescript
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
    const invalidScope = 'This is missing the required prefix';
    const result = ContextScopeSchema.safeParse(invalidScope);
    expect(result.success).toBe(false);
  });
});
```

### Pattern 6: Complex Object Validation

**Best Practice**: Test nested structures and required field validation.

```typescript
it('should validate PRPDocument structure', () => {
  const validPRP: PRPDocument = {
    taskId: 'P1.M2.T2.S2',
    objective: 'Add PRP document interfaces',
    context: '## Context\n...',
    implementationSteps: ['Step 1'],
    validationGates: [
      {
        level: 1,
        description: 'Syntax check',
        command: 'npm run lint',
        manual: false,
      },
    ],
    successCriteria: [
      { description: 'All interfaces added', satisfied: false },
    ],
    references: ['https://example.com'],
  };

  const result = PRPDocumentSchema.safeParse(validPRP);
  expect(result.success).toBe(true);
});
```

## 4. Token Limit/Size Management Testing Patterns

### Pattern 7: Token Counting and Budget Management

**Key Insight**: Implement token estimation and validate against LLM limits.

```typescript
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

describe('Token Budget Management', () => {
  const MAX_TOKENS = 8000;

  it('should validate context size within limits', () => {
    const largeContext = 'x'.repeat(MAX_TOKENS * 4);
    const tokens = estimateTokens(largeContext);
    expect(tokens).toBeLessThanOrEqual(MAX_TOKENS);
  });

  it('should truncate contexts when they exceed limits', () => {
    const oversized = 'x'.repeat(MAX_TOKENS * 6);
    const truncated = truncateContext(oversized, MAX_TOKENS);
    expect(estimateTokens(truncated)).toBeLessThanOrEqual(MAX_TOKENS);
  });
});
```

### Pattern 8: Context Optimization Testing

**Best Practice**: Test that context optimization reduces token usage while preserving essential information.

```typescript
it('should optimize context for token efficiency', () => {
  const verbose =
    'This is a very verbose description with unnecessary details that consume many tokens.';
  const optimized = optimizeContextForTokens(verbose);

  expect(estimateTokens(optimized)).toBeLessThan(estimateTokens(verbose));
  expect(optimized).toContain('necessary details');
});
```

## 5. Delta Context Merging Tests

### Pattern 9: PRD Delta Analysis

**Key Insight**: Test detection of different types of changes (added, modified, removed).

```typescript
describe('PRD Delta Analysis', () => {
  it('should detect added requirements', () => {
    const oldPRD = '# PRD\n## Phase 1: Foundation\n- Set up project structure';
    const newPRD =
      '# PRD\n## Phase 1: Foundation\n- Set up project structure\n- Add TypeScript configuration';

    const delta = analyzePRDDelta(oldPRD, newPRD);
    expect(delta.changes[0].type).toBe('added');
    expect(delta.changes[0].description).toContain('TypeScript configuration');
  });

  it('should generate patch instructions', () => {
    const delta = analyzePRDDelta(oldPRD, newPRD);
    expect(delta.patchInstructions).toContain('re-execute');
    expect(delta.patchInstructions).toContain('TypeScript');
  });
});
```

### Pattern 10: Task Patching Logic

**Best Practice**: Test identification of tasks requiring re-execution versus those that can be reused.

```typescript
it('should identify tasks requiring re-execution', () => {
  const deltaAnalysis = {
    changes: [
      {
        itemId: 'P1.M2.T3.S1',
        type: 'modified',
        description: 'Added validation rules',
      },
    ],
    taskIds: ['P1.M2.T3.S1'],
  };

  const tasksToReexecute = identifyTasksToReexecute(deltaAnalysis);
  expect(tasksToReexecute).toContain('P1.M2.T3.S1');
});
```

## 6. File-based Context Loading Tests

### Pattern 11: Architecture Documentation Loading

**Key Insight**: Test loading and parsing of various file formats with error handling.

```typescript
describe('File Context Loader', () => {
  it('should load architecture documentation', async () => {
    const architecture = await loadArchitectureDocumentation(
      '/path/to/architecture/'
    );
    expect(architecture.systemContext).toBeDefined();
    expect(architecture.agentDefinitions).toBeDefined();
  });

  it('should handle missing documentation files gracefully', async () => {
    const architecture =
      await loadArchitectureDocumentation('/nonexistent/path/');
    expect(architecture.systemContext).toBe(
      'No system context documentation available'
    );
  });
});
```

### Pattern 12: Session State Persistence

**Best Practice**: Test save/load cycles and data integrity validation.

```typescript
it('should save and load session state without data loss', async () => {
  const originalState = createMockSessionState();
  await saveSessionState(originalState, '/tmp/session.json');
  const loadedState = await loadSessionState('/tmp/session.json');

  expect(loadedState).toEqual(originalState);
  expect(loadedState.metadata.createdAt).toBeInstanceOf(Date);
});
```

## 7. Context Injection Verification Testing Patterns

### Pattern 13: End-to-End Context Flow

**Key Insight**: Test that context flows correctly through the entire pipeline from extraction to agent prompt.

```typescript
describe('End-to-End Context Injection', () => {
  it('should inject complete context into agent prompt', async () => {
    const agent = createResearcherAgent();
    const prompt = createPRPBlueprintPrompt(mockSubtask, mockBacklog);

    const result = await agent.prompt(prompt);

    // Verify result contains expected context elements
    expect(result.objective).toContain(mockSubtask.title);
    expect(result.context).toContain('CONTRACT DEFINITION:');
  });
});
```

### Pattern 14: Context Verification Utilities

**Best Practice**: Create utilities to verify all required context elements are present.

```typescript
function verifyContextInjection(
  prompt: Prompt,
  expectedContext: ExpectedContext
): boolean {
  const checks = [
    prompt.user.includes(expectedContext.taskTitle),
    prompt.user.includes(expectedContext.parentContext),
    prompt.user.includes(expectedContext.dependencies),
    prompt.user.includes(expectedContext.contractDefinition),
  ];

  return checks.every(check => check === true);
}

it('should verify complete context injection', () => {
  const prompt = createPRPBlueprintPrompt(mockSubtask, mockBacklog);
  const expectedContext = {
    taskTitle: mockSubtask.title,
    parentContext: 'Phase 2: Core Agent System',
    dependencies: 'P2.M2.T2.S1',
    contractDefinition: 'CONTRACT DEFINITION:',
  };

  expect(verifyContextInjection(prompt, expectedContext)).toBe(true);
});
```

## Best Practices Summary

### 1. Test Data Management

- **Structured Mock Data**: Create hierarchical mock data that matches real scenarios
- **Test Fixtures**: Share common test data across multiple tests
- **Edge Cases**: Include empty dependencies, missing descriptions, invalid formats

### 2. Testing Strategy

- **Granular Testing**: Test each component independently
- **Integration Testing**: Test the complete flow
- **Performance Testing**: Monitor context size and token usage
- **Error Handling**: Test failure scenarios and recovery

### 3. Validation Best Practices

- **Schema Validation**: Use Zod for runtime validation
- **Type Safety**: Leverage TypeScript for compile-time checks
- **Contract Testing**: Validate API contracts and data formats

### 4. Performance Considerations

- **Token Management**: Implement token counting and budgeting
- **Context Optimization**: Test context reduction while preserving essential information
- **Caching**: Test caching mechanisms for frequently accessed context

### 5. Error Handling

- **Graceful Degradation**: Handle missing data gracefully
- **Clear Error Messages**: Provide informative error messages
- **Recovery Mechanisms**: Test automatic recovery from errors

## Implementation Checklist

### Phase 1: Basic Unit Tests

- [ ] Implement context extraction tests
- [ ] Add schema validation tests
- [ ] Create token counting tests
- [ ] Write prompt construction tests

### Phase 2: Integration Tests

- [ ] Add end-to-end context flow tests
- [ ] Implement agent prompt verification
- [ ] Create delta context merging tests
- [ ] Add file-based context loading tests

### Phase 3: Advanced Testing

- [ ] Implement performance benchmarking
- [ ] Add property-based testing
- [ ] Create chaos testing for error scenarios
- [ ] Add integration with CI/CD pipeline

## Recommended Tools and Libraries

### Testing Frameworks

- **Vitest**: Modern testing framework for Vite projects
- **Jest**: Popular testing framework with TypeScript support
- **Testing Library**: For component testing

### Validation Libraries

- **Zod**: Schema validation and type inference
- **Yup**: Alternative validation library
- **Typebox**: TypeScript-first schema validation

### Utilities

- **fast-check**: Property-based testing
- **vitest-benchmark**: Performance benchmarking
- **msw**: Mock Service Worker for API mocking

## Conclusion

Comprehensive testing of context injection and agent context management requires a multi-layered approach that combines unit, integration, and validation testing. By implementing the patterns outlined in this report, teams can ensure robust context management in their AI agent systems while maintaining type safety and performance.

The key to success is:

1. **Structured testing** with clear separation of concerns
2. **Comprehensive validation** of all data transformations
3. **Performance awareness** with token management and optimization
4. **Error resilience** with graceful degradation and recovery mechanisms

These patterns can be adapted to various AI agent systems and prompt engineering workflows, providing a solid foundation for testing complex context injection systems.
