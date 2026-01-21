# Testing Patterns Summary: Context Injection and Agent Context Management

## Quick Reference Guide

This document provides a concise summary of testing patterns for context injection and agent context management in TypeScript/Vitest environments.

## 1. Mocking and Verification Patterns

### Hierarchical Mock Data
```typescript
const mockBacklog: Backlog = {
  backlog: [
    {
      id: 'P2',
      type: 'Phase',
      title: 'Phase 2: Core Agent System',
      status: 'Planned',
      description: 'Groundswell agent integration',
      milestones: [
        // ... complete hierarchy
      ],
    },
  ],
};
```

### Context Extraction Verification
```typescript
it('should include parent context', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);
  expect(prompt.user).toContain('Parent Context');
  expect(prompt.user).toContain('Groundswell agent integration');
});
```

## 2. Prompt Construction Patterns

### Template Placeholder Testing
```typescript
it('should replace placeholders', () => {
  const task = mockBacklog.backlog[0].milestones[0].tasks[0].subtasks[1];
  const prompt = createPRPBlueprintPrompt(task, mockBacklog);
  expect(prompt.user).toContain(task.title);    // Actual content
  expect(prompt.user).toContain('<item_title>'); // Placeholder for LLM
});
```

### Conditional Content Injection
```typescript
it('should conditionally include codebase path', () => {
  const codebasePath = '/home/dustin/projects/hacky-hack';
  const prompt = createPRPBlueprintPrompt(task, mockBacklog, codebasePath);
  expect(prompt.user).toContain('Codebase Analysis');
});
```

## 3. Schema Validation Patterns

### Context Scope Validation
```typescript
describe('Context Scope Schema', () => {
  it('should validate correct format', () => {
    const validScope = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Research findings.
2. INPUT: Data from S1.
3. LOGIC: Implement feature.
4. OUTPUT: Feature for consumption.`;

    const result = ContextScopeSchema.safeParse(validScope);
    expect(result.success).toBe(true);
  });
});
```

### PRPDocument Validation
```typescript
it('should validate PRPDocument structure', () => {
  const prp: PRPDocument = {
    taskId: 'P1.M2.T2.S2',
    objective: 'Test objective',
    context: '# Context\n...',
    implementationSteps: ['Step 1'],
    validationGates: [{ level: 1, description: 'Check', command: 'npm test', manual: false }],
    successCriteria: [{ description: 'Criteria', satisfied: false }],
    references: [],
  };

  const result = PRPDocumentSchema.safeParse(prp);
  expect(result.success).toBe(true);
});
```

## 4. Token Management Patterns

### Token Counting
```typescript
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

it('should respect token limits', () => {
  const context = 'x'.repeat(8000 * 4); // 8000 tokens
  const tokens = estimateTokens(context);
  expect(tokens).toBeLessThanOrEqual(8000);
});
```

### Context Truncation
```typescript
it('should truncate oversized contexts', () => {
  const oversized = 'x'.repeat(10000);
  const truncated = truncateContext(oversized, 2000);
  expect(estimateTokens(truncated)).toBeLessThanOrEqual(2000);
});
```

## 5. Delta Context Merging

### PRD Delta Analysis
```typescript
it('should detect added requirements', () => {
  const oldPRD = '# PRD\n- Task 1';
  const newPRD = '# PRD\n- Task 1\n- Task 2 (added)';

  const delta = analyzePRDDelta(oldPRD, newPRD);
  expect(delta.changes[0].type).toBe('added');
});
```

### Task Patching
```typescript
it('should identify tasks to re-execute', () => {
  const delta = { changes: [{ itemId: 'P1.M2.T3.S1' }], taskIds: ['P1.M2.T3.S1'] };
  const tasks = identifyTasksToReexecute(delta);
  expect(tasks).toContain('P1.M2.T3.S1');
});
```

## 6. File-based Context Loading

### Architecture Documentation
```typescript
it('should load architecture docs', async () => {
  const arch = await loadArchitectureDocumentation('/path/to/docs/');
  expect(arch.systemContext).toBeDefined();
  expect(arch.agentDefinitions).toHaveLength(3);
});
```

### Session State Persistence
```typescript
it('should save and load session state', async () => {
  const state = createMockSessionState();
  await saveSessionState(state, '/tmp/session.json');
  const loaded = await loadSessionState('/tmp/session.json');
  expect(loaded).toEqual(state);
});
```

## 7. Context Injection Verification

### End-to-End Testing
```typescript
it('should inject complete context', async () => {
  const agent = createResearcherAgent();
  const prompt = createPRPBlueprintPrompt(task, backlog);
  const result = await agent.prompt(prompt);

  expect(result.objective).toContain(task.title);
  expect(result.context).toContain('CONTRACT DEFINITION:');
});
```

### Context Verification Utility
```typescript
function verifyContext(prompt: Prompt, expected: string[]): boolean {
  return expected.every(item => prompt.user.includes(item));
}

it('should verify all context elements', () => {
  const prompt = createPRPBlueprintPrompt(task, backlog);
  const expected = [task.title, 'Parent Context', 'Dependencies'];
  expect(verifyContext(prompt, expected)).toBe(true);
});
```

## Best Practices Checklist

### Unit Testing
- [ ] Test each context extraction function independently
- [ ] Validate schema parsing and validation
- [ ] Test token counting and budget management
- [ ] Verify template placeholder replacement

### Integration Testing
- [ ] Test complete context flow extraction → prompt → agent
- [ ] Test delta context merging and task patching
- [ ] Test file-based context loading and persistence
- [ ] Test error handling and recovery

### Performance Testing
- [ ] Benchmark context extraction performance
- [ ] Test token budget optimization
- [ ] Validate context truncation effectiveness
- [ ] Test memory usage for large contexts

### Error Handling
- [ ] Test invalid data formats
- [ ] Test missing files and corrupted data
- [ ] Test circular references and edge cases
- [ ] Test graceful degradation

## Key Testing Insights

1. **Hierarchy Matters**: Test each level of the task hierarchy separately
2. **Validation is Crucial**: Use Zod schemas for runtime validation
3. **Tokens Count**: Implement token counting and budgeting
4. **Delta Changes**: Test PRD diffing and task patching logic
5. **File Loading**: Test document loading with error handling
6. **End-to-End**: Verify complete context injection pipeline

## Resources

### Documentation
- [Vitest Guide](https://vitest.dev/guide/)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html)

### Examples
- `/tests/unit/agents/prompts/prp-blueprint-prompt.test.ts`
- `/tests/unit/core/models.test.ts`
- `/tests/unit/core/prd-differ.test.ts`

### Tools
- `vitest` - Testing framework
- `zod` - Schema validation
- `fast-check` - Property-based testing
- `vitest-benchmark` - Performance testing

## Quick Start

1. **Set up test environment**:
   ```bash
   npm install -D vitest @vitest/jsdom
   ```

2. **Create test structure**:
   ```
   tests/
   ├── unit/
   │   ├── agents/prompts/
   │   └── core/
   ├── integration/
   └── fixtures/
   ```

3. **Write first test**:
   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('Context Extraction', () => {
     it('should extract parent context', () => {
       // Test implementation
     });
   });
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

This summary provides a quick reference for implementing comprehensive testing patterns for context injection and agent context management systems.