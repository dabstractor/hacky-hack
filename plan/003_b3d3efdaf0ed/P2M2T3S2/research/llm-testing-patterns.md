# LLM Agent Testing Patterns

## Groundswell Mocking Pattern (Critical)

```typescript
// Mock at top level before imports (hoisting required by vi.mock)
// Use importOriginal to preserve MCPHandler and other exports needed by MCP tools
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,  // Preserve ALL exports
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import after mocking - get mocked versions
import { createAgent, createPrompt } from 'groundswell';

// Mock Agent with prompt method
const mockAgent = {
  prompt: vi.fn(),
};

// Mock Prompt object (Groundswell Prompt<T> type)
const mockPrompt = {
  user: '',
  system: '',
  responseFormat: BacklogSchema,
  enableReflection: true,
};

// Setup mocks to return predictable values
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);
```

## Key Benefits

- Preserves other exports (MCPHandler, MCPServer) via `importActual`
- Prevents real LLM API calls during tests
- Enables deterministic testing with controlled responses
- Avoids MCP server registration issues in test environments

## Real vs Mocked LLM Calls Pattern

```typescript
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true';

if (USE_REAL_LLM) {
  // EXECUTE: Real LLM call with timeout
  const result = await architect.prompt(prompt);
  // VERIFY: Validate against BacklogSchema
  const validation = BacklogSchema.safeParse(result);
  expect(validation.success).toBe(true);
} else {
  // MOCK: Return fixture data for fast, deterministic testing
  const mockBacklog: Backlog = { /* fixture data */ };
  vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);
}
```

## Prompt Content Testing

```typescript
describe('prompt content validation', () => {
  it('TASK_BREAKDOWN_PROMPT should contain expected header', () => {
    expect(TASK_BREAKDOWN_PROMPT).toContain('LEAD TECHNICAL ARCHITECT');
    expect(TASK_BREAKDOWN_PROMPT).toContain('PROJECT SYNTHESIZER');
  });

  it('PRP_BLUEPRINT_PROMPT should contain template placeholders', () => {
    expect(PRP_BLUEPRINT_PROMPT).toContain('<item_title>');
    expect(PRP_BLUEPRINT_PROMPT).toContain('<item_description>');
  });
});
```

## Multi-Agent Orchestration Testing

```typescript
describe('Multi-agent orchestration', () => {
  it('should pass MCP tools to all agent creators', () => {
    // SETUP: Stub environment variables
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE: Create all agent types
    createArchitectAgent();
    createResearcherAgent();
    createCoderAgent();
    createQAAgent();

    // VERIFY: All agents were created with mcps parameter
    expect(createAgent).toHaveBeenCalledTimes(4);

    // Check each call had mcps parameter
    vi.mocked(createAgent).mock.calls.forEach(call => {
      const config = call[0];
      expect(config).toHaveProperty('mcps');
      expect(Array.isArray(config.mcps)).toBe(true);
    });
  });
});
```

## External Resources

- LangChain Testing Guide: https://python.langchain.com/docs/guides/evaluation/testing
- Anthropic Claude Documentation: https://docs.anthropic.com/claude/reference/testing
- OpenAI Testing Best Practices: https://platform.openai.com/docs/guides/production-testing
- LlamaIndex Testing Patterns: https://docs.llamaindex.ai/en/stable/optimizing/testing
- Prompt Engineering Guide: https://www.promptingguide.ai/
- LangSmith Documentation: https://docs.smith.langchain.com/
- Zod Documentation: https://zod.dev/
