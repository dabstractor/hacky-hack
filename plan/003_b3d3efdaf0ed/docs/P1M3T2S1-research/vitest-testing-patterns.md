# Vitest Integration Test Patterns

## Standard Test File Structure

From analysis of existing tests in `tests/integration/`:

```typescript
import { afterEach, describe, expect, it, vi, beforeAll } from 'vitest';

// MOCK SETUP: Mock Groundswell, NOT agent-factory
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// DYNAMIC IMPORT FUNCTION
async function loadGroundswell() {
  return await import('groundswell');
}

describe('integration/[component-name]', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  // SETUP HOOKS
  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // TEST GROUPS
  describe('specific feature group', () => {
    it('should do something specific', async () => {
      // SETUP
      // EXECUTE
      // VERIFY
    });
  });
});
```

## Mock Agent Configuration Pattern

```typescript
// SETUP: Configure mock agent return value
const mockAgent = {
  id: 'test-agent-id',
  name: 'ResearcherAgent',
  prompt: vi.fn(),
};
(gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

// VERIFY: createAgent called with expected configuration
expect(gs.createAgent).toHaveBeenCalledWith(
  expect.objectContaining({
    name: 'ResearcherAgent',
    model: 'GLM-4.7',
    maxTokens: 4096,
    enableCache: true,
    enableReflection: true,
  })
);
```

## Mock Agent with Deterministic Response

```typescript
// SETUP: Create mock agent with controlled response
const mockPRP = createMockPRPDocument('P1.M1.T1.S1');
const mockAgent = {
  id: 'test-agent-id',
  name: 'ResearcherAgent',
  prompt: vi.fn().mockResolvedValue(mockPRP),
};
(gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

// EXECUTE: Call agent
const researcher = createResearcherAgent();
const result = await researcher.prompt({ user: 'test', system: 'test' });

// VERIFY: Returns expected structure
expect(result).toEqual(mockPRP);
expect(result.taskId).toBe('P1.M1.T1.S1');
```

## Test Data Factory Pattern

```typescript
// Mock data factory functions
const createMockPRPDocument = (taskId: string) => ({
  taskId,
  objective: 'Test objective',
  context: 'Test context',
  implementationSteps: ['Step 1', 'Step 2', 'Step 3'],
  validationGates: [
    { level: 1, description: 'Syntax & Style', command: 'npm test', manual: false },
    { level: 2, description: 'Unit Tests', command: 'npm run lint', manual: false },
    { level: 3, description: 'Integration', command: null, manual: true },
    { level: 4, description: 'Manual', command: 'npm run build', manual: true },
  ],
  successCriteria: [
    { description: 'Test criterion 1', satisfied: false },
    { description: 'Test criterion 2', satisfied: false },
  ],
  references: ['Reference 1', 'Reference 2'],
});
```

## Prompt Content Validation Pattern

```typescript
// Verify prompt contains required sections
it('should contain Research Process section', async () => {
  const { PRP_BLUEPRINT_PROMPT } = await import('src/agents/prompts.js');

  expect(PRP_BLUEPRINT_PROMPT).toContain('Research Process');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Codebase Analysis in depth');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Internal Research at scale');
  expect(PRP_BLUEPRINT_PROMPT).toContain('External Research at scale');
  expect(PRP_BLUEPRINT_PROMPT).toContain('User Clarification');
});
```

## Schema Validation Pattern

```typescript
// Validate output against Zod schema
it('should validate output against PRPDocumentSchema', async () => {
  const { PRPDocumentSchema } = await import('src/core/models.js');
  const mockPRP = createMockPRPDocument('P1.M1.T1.S1');

  const result = PRPDocumentSchema.safeParse(mockPRP);

  expect(result.success).toBe(true);
});
```

## Important Test Patterns

1. **Mock Groundswell, NOT agent-factory**: This allows testing the real factory function
2. **Dynamic imports after mock**: Ensures vi.mock() is applied before importing
3. **Cleanup in afterEach**: Always vi.unstubAllEnvs() and vi.clearAllMocks()
4. **Deterministic mock outputs**: Use same mock data for consistent test results
5. **Test content, not functionality**: For aspirational features, verify prompt contains instructions

## References

- `tests/integration/researcher-agent.test.ts` - Comprehensive example
- `tests/integration/architect-agent-integration.test.ts` - Agent factory testing
- `tests/integration/groundswell/agent-prompt.test.ts` - Groundswell API testing
