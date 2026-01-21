# Integration Test Patterns Research

## Overview

This document captures integration test patterns used in the hacky-hack codebase for creating the Architect Agent integration test.

## Mock Setup Patterns

### Pattern 1: Top-Level Module Mocking (vi.mock)

Used for mocking Groundswell dependencies at module level:

```typescript
// Must be at top level before imports (hoisting required)
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// Import after mocking
import { Anthropic } from '@anthropic-ai/sdk';
```

**Source**: `tests/integration/groundswell/agent-prompt.test.ts:39-45`

### Pattern 2: Agent Factory Mocking

Used to avoid MCP server registration issues:

```typescript
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(() => ({
    prompt: vi.fn(),
  })),
}));

import { createArchitectAgent } from '../../src/agents/agent-factory.js';
```

**Source**: `tests/integration/architect-agent.test.ts:27-34`

### Pattern 3: Selective Groundswell Mocking

Preserve some real functions while mocking others:

```typescript
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});
```

**Source**: From existing codebase patterns

### Pattern 4: vi.hoisted() for Mock Variables

Used when mock factory needs variables:

```typescript
const { mockLogger, mockGenerate } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn() },
  mockGenerate: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

**Source**: `tests/integration/core/task-orchestrator-runtime.test.ts`

## Test Structure Conventions

### SETUP/EXECUTE/VERIFY Pattern

Every test uses this three-phase structure with comments:

```typescript
it('should generate valid backlog matching BacklogSchema', async () => {
  // SETUP: Read PRD and create agent
  vi.stubEnv(
    'ANTHROPIC_AUTH_TOKEN',
    process.env.ANTHROPIC_API_KEY || 'test-key'
  );
  const prdContent = await readFile(PRD_PATH, 'utf-8');
  const architect = createArchitectAgent();
  const prompt = createArchitectPrompt(prdContent);

  // EXECUTE: Call agent
  const result = await architect.prompt(prompt);

  // VERIFY: Validate against BacklogSchema
  const validation = BacklogSchema.safeParse(result);
  expect(validation.success).toBe(true);
});
```

**Source**: `tests/integration/architect-agent.test.ts:74-101`

### Describe Block Organization

```typescript
describe('integration/architect-agent', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('setup', () => {
    it('should read PRD.md from project root', async () => { ... });
    it('should create architect agent using factory', () => { ... });
  });

  describe('architect output validation', () => {
    it('should generate valid backlog matching BacklogSchema', async () => { ... });
    it('should contain at least one phase with proper nesting', async () => { ... });
  });
});
```

**Source**: `tests/integration/architect-agent.test.ts:39-73`

## Environment Variable Management

### Pattern for Environment Variable Stubbing

```typescript
describe('createBaseConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY', () => {
    // SETUP
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token-123');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    const config = createBaseConfig('architect');

    // VERIFY
    expect(config.env.ANTHROPIC_API_KEY).toBe('test-token-123');
  });
});
```

### Environment Variables Required for Tests

```bash
ANTHROPIC_API_KEY=z.ai_api_key_here
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
```

**Note**: Global test setup (`tests/setup.ts`) validates z.ai endpoint and blocks Anthropic's API.

## Zod Schema Validation Patterns

### Pattern 1: safeParse for Non-Throwing Validation

```typescript
const validation = BacklogSchema.safeParse(result);

expect(validation.success).toBe(true);

if (validation.success) {
  expect(validation.data.backlog).toBeInstanceOf(Array);
  expect(validation.data.backlog.length).toBeGreaterThan(0);
}
```

**Source**: `tests/integration/architect-agent.test.ts:97-103`

### Pattern 2: Traversal Validation for Nested Structures

```typescript
it('should validate story_points are integers in range [1, 21]', async () => {
  const result = await architect.prompt(prompt);
  const validation = BacklogSchema.safeParse(result);

  expect(validation.success).toBe(true);
  if (validation.success) {
    const validateStoryPoints = (backlog: Backlog) => {
      for (const phase of backlog.backlog) {
        for (const milestone of phase.milestones) {
          for (const task of milestone.tasks) {
            for (const subtask of task.subtasks) {
              expect(Number.isInteger(subtask.story_points)).toBe(true);
              expect(subtask.story_points).toBeGreaterThanOrEqual(1);
              expect(subtask.story_points).toBeLessThanOrEqual(21);
            }
          }
        }
      }
    };

    validateStoryPoints(validation.data);
  }
});
```

**Source**: `tests/integration/architect-agent.test.ts:281-297`

### Pattern 3: SafeValidateResponse with Type Narrowing

```typescript
const result = prompt.safeValidateResponse({ value: 42 });

expect(result.success).toBe(true);
if (result.success === true) {
  expect(result.data).toEqual({ value: 42 });
} else {
  // TypeScript knows result.error is ZodError
  expect(result.error.issues).toBeDefined();
}
```

**Source**: `tests/integration/groundswell/agent-prompt.test.ts:347-365`

## Test Fixture Patterns

### Factory Functions for Test Data

```typescript
const createTestBacklog = (): Backlog => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Test Phase',
      status: 'Planned',
      description: 'Test description',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Test Milestone',
          status: 'Planned',
          description: 'Test',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Test Task',
              status: 'Planned',
              description: 'Test',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Test Subtask',
                  status: 'Planned',
                  story_points: 2,
                  dependencies: [],
                  context_scope: 'Test',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
```

**Source**: `tests/integration/architect-agent.test.ts:106-146`

## Timeout Configuration

For LLM calls, use longer timeouts:

```typescript
it(
  'should generate valid backlog',
  async () => {
    // test code
  },
  { timeout: 30000 }
);
```

**Source**: `tests/integration/architect-agent.test.ts:160`

## File Paths and Import Extensions

### ES Module Requirements

All imports must use `.js` extensions:

```typescript
import { createArchitectAgent } from '../../src/agents/agent-factory.js';
import { BacklogSchema } from '../../src/core/models.js';
```

**Reason**: The project uses ES modules, and `.js` is required even for TypeScript files.

## Real LLM vs Mock Testing

### USE_REAL_LLM Flag Pattern

```typescript
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true';

if (USE_REAL_LLM) {
  // EXECUTE: Real LLM call with timeout
  const result = await architect.prompt(prompt);
  // VERIFY: Validate against schema
} else {
  // MOCK: Return fixture data for fast, deterministic testing
  const mockBacklog: Backlog = {
    /* ... */
  };
  vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);
  const result = await architect.prompt(prompt);
  // VERIFY: Validate fixture data
}
```

**Source**: `tests/integration/architect-agent.test.ts:92-158`

## Cleanup Patterns

### afterEach Cleanup

```typescript
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

**Source**: `tests/integration/architect-agent.test.ts:41-44`

### Global Hooks (tests/setup.ts)

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  validateApiEndpoint();
  // Reset unhandled rejections tracking
});

afterEach(() => {
  // Check for unhandled rejections
  vi.unstubAllEnvs();
  // Force GC if available
});
```

## Common Test Locations

| Test Type   | Directory                        | Pattern                                                |
| ----------- | -------------------------------- | ------------------------------------------------------ |
| Integration | `tests/integration/`             | `*-agent.test.ts`, `*-integration.test.ts`             |
| Unit        | `tests/unit/`                    | Mirror source structure                                |
| Groundswell | `tests/integration/groundswell/` | Component-specific                                     |
| Core System | `tests/integration/core/`        | `session-manager.test.ts`, `task-orchestrator.test.ts` |

## Verification Patterns

### Mock Verification

```typescript
expect(createAgent).toHaveBeenCalledWith(
  expect.objectContaining({
    name: 'ArchitectAgent',
    system: TASK_BREAKDOWN_PROMPT,
    maxTokens: 8192,
  })
);
```

### File Write Verification

```typescript
const prpCall = mockWriteFile.mock.calls.find(
  (call: any[]) => call[0] && call[0].toString().endsWith('P3_M3_T1_S1.md')
);
expect(prpCall).toBeDefined();
expect(prpCall![1]).toContain('# PRP for P3.M3.T3.S1');
```

**Source**: `tests/integration/prp-generator-integration.test.ts`

## Summary Table: Mock Patterns

| Test File                           | Mock Pattern                                   | Test Focus            |
| ----------------------------------- | ---------------------------------------------- | --------------------- |
| `architect-agent.test.ts`           | `vi.mock('../../src/agents/agent-factory.js')` | PRD decomposition     |
| `groundswell/agent-prompt.test.ts`  | `vi.mock('@anthropic-ai/sdk')`                 | Agent/Prompt creation |
| `task-orchestrator-runtime.test.ts` | `vi.mock('agent-factory')` with `vi.hoisted()` | Queue behavior        |
| `prp-generator-integration.test.ts` | `vi.mock('node:fs/promises')`                  | File generation       |
