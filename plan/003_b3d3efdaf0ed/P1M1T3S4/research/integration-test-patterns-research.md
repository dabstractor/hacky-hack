# Integration Test Patterns Research

## Overview

This document captures integration test patterns used in the codebase for testing QA agents, workflows, and bug hunting functionality.

## Test File Locations

### Integration Test Directory Structure

```
tests/
├── integration/
│   ├── architect-agent.test.ts              # Architect Agent tests
│   ├── researcher-agent.test.ts             # Researcher Agent tests
│   ├── bug-hunt-workflow-integration.test.ts # BugHuntWorkflow tests
│   ├── fix-cycle-workflow-integration.test.ts # FixCycleWorkflow tests
│   ├── prp-executor-integration.test.ts     # PRP executor tests
│   ├── prp-generator-integration.test.ts    # PRP generator tests
│   └── groundswell/
│       ├── agent-prompt.test.ts             # Groundswell Agent/Prompt tests
│       └── workflow.test.ts                 # Groundswell Workflow tests
└── setup.ts                                  # Global test setup
```

## Mock Setup Patterns

### Pattern 1: Agent Factory Mock

Used for testing workflows that create agents.

```typescript
// Mock at top level BEFORE imports
vi.mock('../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));

// Import after mock
import { createQAAgent } from '../../src/agents/agent-factory.js';

// Cast mocked functions
const mockCreateQAAgent = createQAAgent as any;

// In test setup
beforeEach(() => {
  vi.clearAllMocks();
  mockCreateQAAgent.mockReturnValue({
    prompt: vi.fn(),
  });
});
```

### Pattern 2: Prompt Function Mock

Used for testing prompt generation logic.

```typescript
// Mock at top level
vi.mock('../../src/agents/prompts/bug-hunt-prompt.js', () => ({
  createBugHuntPrompt: vi.fn(),
}));

import { createBugHuntPrompt } from '../../src/agents/prompts/bug-hunt-prompt.js';

const mockCreateBugHuntPrompt = createBugHuntPrompt as any;

// In test setup
beforeEach(() => {
  mockCreateBugHuntPrompt.mockReturnValue({
    user: 'prompt',
    system: 'system',
    responseFormat: TestResultsSchema,
    enableReflection: true,
  });
});
```

### Pattern 3: Groundswell Mock

Used for testing agent factory functions directly.

```typescript
// Mock Groundswell, NOT agent-factory
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Dynamic import
async function loadGroundswell() {
  return await import('groundswell');
}

describe('tests', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });
});
```

## Test Data Factory Patterns

### Test Task Factory

```typescript
const createTestTask = (
  id: string,
  title: string,
  status: 'Complete' | 'Failed' | 'Planned' = 'Complete',
  description?: string
): Task => ({
  id,
  type: 'Task',
  title,
  status,
  description: description ?? `Description for ${title}`,
  subtasks: [],
});
```

### Test Bug Factory

```typescript
const createTestBug = (
  id: string,
  severity: 'critical' | 'major' | 'minor' | 'cosmetic',
  title: string,
  description: string,
  reproduction: string,
  location?: string
): Bug => ({
  id,
  severity,
  title,
  description,
  reproduction,
  location,
});
```

### Test Results Factory

```typescript
const createTestResults = (
  hasBugs: boolean,
  bugs: Bug[],
  summary: string,
  recommendations: string[]
): TestResults => ({
  hasBugs,
  bugs,
  summary,
  recommendations,
});
```

## Test Structure Patterns

### Pattern 1: Full Workflow Execution Test

```typescript
describe('full run() workflow execution', () => {
  it('should complete workflow successfully with no bugs found', async () => {
    // SETUP: Create test data
    const prdContent = '# Test PRD\n\n## Requirements\nBuild a feature.';
    const completedTasks = [
      createTestTask('P1.M1.T1', 'Setup Project'),
      createTestTask('P1.M2.T1', 'Implement Core'),
    ];
    const expectedResults = createTestResults(
      false,
      [],
      'All tests passed successfully',
      []
    );

    // Mock QA agent to return clean results
    const mockAgent = {
      prompt: vi.fn().mockResolvedValue(expectedResults),
    };
    mockCreateQAAgent.mockReturnValue(mockAgent);
    mockCreateBugHuntPrompt.mockReturnValue({
      user: 'prompt',
      system: 'system',
    });

    // EXECUTE
    const workflow = new BugHuntWorkflow(prdContent, completedTasks);
    const results = await workflow.run();

    // VERIFY
    expect(results).toEqual(expectedResults);
    expect(results.hasBugs).toBe(false);
    expect(results.bugs).toHaveLength(0);
    expect(workflow.testResults).toEqual(expectedResults);
  });
});
```

### Pattern 2: Phase Execution Order Test

```typescript
it('should execute all phases in correct order', async () => {
  // SETUP
  const prdContent = '# PRD';
  const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
  const expectedResults = createTestResults(false, [], 'OK', []);

  const callOrder: string[] = [];
  const mockAgent = {
    prompt: vi.fn().mockResolvedValue(expectedResults),
  };

  mockCreateQAAgent.mockImplementation(() => {
    callOrder.push('createQAAgent');
    return mockAgent;
  });
  mockCreateBugHuntPrompt.mockImplementation(() => {
    callOrder.push('createBugHuntPrompt');
    return { user: 'prompt', system: 'system' };
  });

  // EXECUTE
  const workflow = new BugHuntWorkflow(prdContent, completedTasks);
  await workflow.run();

  // VERIFY - phases execute in order
  expect(mockAgent.prompt).toHaveBeenCalled();
  expect(callOrder).toContain('createQAAgent');
  expect(callOrder).toContain('createBugHuntPrompt');
});
```

### Pattern 3: Error Handling Test

```typescript
it('should handle QA agent errors gracefully', async () => {
  // SETUP
  const prdContent = '# PRD';
  const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
  const mockError = new Error('QA agent API timeout');
  const mockAgent = {
    prompt: vi.fn().mockRejectedValue(mockError),
  };
  mockCreateQAAgent.mockReturnValue(mockAgent);
  mockCreateBugHuntPrompt.mockReturnValue({});

  // EXECUTE & VERIFY
  const workflow = new BugHuntWorkflow(prdContent, completedTasks);
  await expect(workflow.run()).rejects.toThrow('QA agent API timeout');

  // Verify workflow status is failed
  expect(workflow.status).toBe('failed');
});
```

### Pattern 4: State Machine Test (Multi-call Scenarios)

```typescript
it('should retry on validation failure up to 2 times', async () => {
  // SETUP
  let validationRunCount = 0;
  let agentPromptCount = 0;

  // Agent state machine: initial + 2 fix attempts
  const mockAgent = {
    prompt: vi.fn().mockImplementation(async () => {
      agentPromptCount++;
      return JSON.stringify({ result: 'success', message: 'Fixed' });
    }),
  };

  // BashMCP state machine: fail Level 2 twice, then pass
  vi.spyOn(BashMCP.prototype, 'execute_bash').mockImplementation(
    async ({ command }: any) => {
      validationRunCount++;
      if (validationRunCount === 2) {
        return {
          success: false,
          stdout: '',
          stderr: 'Test failed',
          exitCode: 1,
        };
      }
      if (validationRunCount === 5) {
        return {
          success: false,
          stdout: '',
          stderr: 'Test failed',
          exitCode: 1,
        };
      }
      return { success: true, stdout: '', stderr: '', exitCode: 0 };
    }
  );

  const executor = new PRPExecutor(process.cwd());

  // EXECUTE
  const result = await executor.execute(prp, '/tmp/test.md');

  // VERIFY: Retried 2 times
  expect(result.fixAttempts).toBe(2);
  expect(result.success).toBe(true);
  expect(agentPromptCount).toBe(3); // Initial + 2 fix attempts
});
```

## Test Organization

### Describe Block Structure

```typescript
describe('QA Agent Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('full run() workflow execution', () => {
    // Tests for complete workflow execution
  });

  describe('TestResults with various bug scenarios', () => {
    // Tests for different bug severity combinations
  });

  describe('workflow with different PRD and task scenarios', () => {
    // Tests for edge cases (empty tasks, large PRDs, etc.)
  });

  describe('error handling and recovery', () => {
    // Tests for error scenarios
  });

  describe('workflow observability', () => {
    // Tests for status transitions and state tracking
  });
});
```

## Verification Patterns

### Factory Function Verification

```typescript
it('should call createQAAgent with correct configuration', () => {
  const { createQAAgent } = require('../../src/agents/agent-factory.js');

  createQAAgent();

  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'QAAgent',
      model: 'GLM-4.7',
      maxTokens: 4096,
      enableCache: true,
      enableReflection: true,
    })
  );
});
```

### Mock Invocation Verification

```typescript
// Verify function was called with specific arguments
expect(mockCreateBugHuntPrompt).toHaveBeenCalledWith(
  prdContent,
  completedTasks
);

// Verify function was called specific number of times
expect(mockAgent.prompt).toHaveBeenCalledTimes(2);

// Verify specific call arguments
const completedTasksArg = mockBugHuntWorkflow.mock.calls[0][1];
expect(completedTasksArg).toHaveLength(2);
```

### Array/Collection Verification

```typescript
// Count bugs by severity
expect(results.bugs.filter(b => b.severity === 'critical')).toHaveLength(1);
expect(results.bugs.filter(b => b.severity === 'major')).toHaveLength(1);

// Verify array contents
expect(completedTasksArg[0].id).toBe('P1.M1.T1');
expect(completedTasksArg[1].id).toBe('P1.M1.T3');
```

## Global Test Setup

Location: `tests/setup.ts`

### API Endpoint Validation

```typescript
beforeAll(() => {
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? '';
  if (baseUrl === 'https://api.anthropic.com') {
    throw new Error('Tests must use z.ai API endpoint, not api.anthropic.com');
  }
});
```

### Cleanup Hooks

```typescript
beforeEach(() => {
  // Clear mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Unstub environments after each test
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

## Key Import Patterns

### ES Module Imports (.js extensions required)

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BugHuntWorkflow } from '../../src/workflows/bug-hunt-workflow.js';
import type { Task, TestResults, Bug } from '../../src/core/models.js';
import { TestResultsSchema } from '../../src/core/models.js';
```

### Type Imports

```typescript
import type { Task, TestResults, Bug } from '../../src/core/models.js';
import type { TaskOrchestrator } from '../../src/core/task-orchestrator.js';
import type { SessionManager } from '../../src/core/session-manager.js';
```

## Common Gotchas

1. **Mock hoisting**: `vi.mock()` must be at top level, before imports
2. **ES modules**: Use `.js` extensions for all imports
3. **Mock casting**: Cast mocked functions to `any` for access to mock methods
4. **Clear mocks**: Use `vi.clearAllMocks()` in `beforeEach`
5. **Environment cleanup**: Use `vi.unstubAllEnvs()` in `afterEach`
6. **Async tests**: Always `await` async operations or use `expect().rejects.toThrow()`

## References

- `tests/integration/bug-hunt-workflow-integration.test.ts` - BugHuntWorkflow test patterns
- `tests/integration/fix-cycle-workflow-integration.test.ts` - FixCycleWorkflow test patterns
- `tests/integration/groundswell/agent-prompt.test.ts` - Groundswell Agent/Prompt test patterns
- `tests/setup.ts` - Global test setup and API validation
