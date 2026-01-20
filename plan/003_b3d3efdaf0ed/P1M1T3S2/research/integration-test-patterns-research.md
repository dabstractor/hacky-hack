# Integration Test Patterns Research

## Overview

This document provides comprehensive research on existing integration test patterns in the codebase, specifically for mocking Groundswell agents, file operations, and verifying Researcher Agent behavior.

## Existing Integration Test Files

### Test Directory Structure

```
tests/
├── integration/
│   ├── agents.test.ts                      # Groundswell Agent/Prompt tests
│   ├── architect-agent.test.ts             # Architect output validation
│   ├── prp-blueprint-agent.test.ts         # PRP Blueprint Prompt tests
│   ├── prp-generator-integration.test.ts   # PRPGenerator integration
│   ├── prp-executor-integration.test.ts    # PRPExecutor integration
│   ├── groundswell/
│   │   ├── agent-prompt.test.ts            # Groundswell Agent/Prompt tests
│   │   ├── workflow.test.ts                # Groundswell Workflow tests
│   │   └── mcp.test.ts                     # Groundswell MCP tests
│   └── core/
│       ├── session-manager.test.ts         # Session Manager tests
│       ├── task-orchestrator.test.ts       # Task Orchestrator tests
│       └── research-queue.test.ts          # ResearchQueue tests
├── setup.ts                                # Global test setup with API validation
└── unit/
    └── agents/
        └── agent-factory.test.ts           # Agent factory unit tests
```

## Mock Setup Patterns

### 1. Top-Level Module Mocking (vi.mock)

**File**: `tests/integration/agents.test.ts` (lines 22-31)

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

**Key Points**:
- Mock at top level before imports (hoisting required)
- Use `vi.importActual()` to preserve real implementations
- Return spread actual with mocked functions

### 2. Dynamic Import Pattern

**File**: `tests/integration/groundswell/agent-prompt.test.ts` (lines 52-54)

```typescript
async function loadGroundswell() {
  return await import('groundswell');
}
```

**Usage with beforeAll**:

```typescript
describe('integration/groundswell/agent-prompt', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  // tests use gs.createAgent, gs.createPrompt
});
```

### 3. Node Module Mocking

**File**: `tests/integration/tools.test.ts` (lines 27-40)

```typescript
// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock node:fs
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path: unknown) => path as string),
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));
```

### 4. Partial Mocking with Real Implementation

**File**: `tests/integration/prp-generator-integration.test.ts` (lines 33-48)

```typescript
vi.mock('node:fs/promises', async importOriginal => {
  const actualFs = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actualFs,
    mkdir: vi.fn((path: string, options: any) => {
      // Use real mkdir for test setup
      return actualFs.mkdir(path, options);
    }),
    writeFile: vi.fn((path: string, data: any, options: any) => {
      // Use real writeFile for test setup
      return actualFs.writeFile(path, data, options);
    }),
  };
});
```

## Test Structure Patterns

### 1. Main Describe Block with Hooks

**File**: `tests/integration/prp-executor-integration.test.ts` (lines 77-91)

```typescript
describe('integration: agents/prp-executor', () => {
  const sessionPath = process.cwd();
  let mockAgent: any;

  beforeEach(() => {
    // Setup mock agent with real-ish behavior
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Nested describe blocks
  describe('execute() with real dependencies', () => {
    // Individual test cases
  });
});
```

### 2. Test-Wide Constants

**File**: `tests/integration/prp-blueprint-agent.test.ts` (lines 21-22)

```typescript
const TASKS_PATH = resolve(process.cwd(), 'plan/001_14b9dc2a33c7/tasks.json');
const _USE_REAL_LLM = process.env.USE_REAL_LLM === 'true';
```

### 3. Cleanup Pattern

**File**: `tests/integration/prp-blueprint-agent.test.ts` (lines 26-29)

```typescript
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

**Used in multiple files**: `vi.unstubAllEnvs()` + `vi.clearAllMocks()`

## SETUP/EXECUTE/VERIFY Pattern

**File**: `tests/integration/prp-executor-integration.test.ts` (lines 95-130)

```typescript
it('should successfully execute PRP with mocked agent and real BashMCP', async () => {
  // SETUP
  const prp = createMockPRPDocument('P1.M2.T2.S2');
  const prpPath = '/tmp/test-session/prps/P1M2T2S2.md';

  // Mock Coder Agent to return success
  mockAgent.prompt.mockResolvedValue(
    JSON.stringify({
      result: 'success',
      message: 'Implementation complete',
    })
  );

  const executor = new PRPExecutor(sessionPath);

  // EXECUTE
  const result = await executor.execute(prp, prpPath);

  // VERIFY: Execution succeeded
  expect(result.success).toBe(true);
  expect(result.fixAttempts).toBe(0);
  expect(result.validationResults).toHaveLength(4);
});
```

## Mocking Agent.prompt() Calls

### 1. Mock Agent with Prompt Method

**File**: `tests/integration/prp-executor-integration.test.ts` (lines 83-86)

```typescript
mockAgent = {
  prompt: vi.fn(),
};
mockCreateCoderAgent.mockReturnValue(mockAgent);
```

### 2. Mock Prompt Return Value

**File**: `tests/integration/prp-executor-integration.test.ts` (lines 100-105)

```typescript
mockAgent.prompt.mockResolvedValue(
  JSON.stringify({
    result: 'success',
    message: 'Implementation complete',
  })
);
```

### 3. Mock Groundswell Agent Creation

**File**: `tests/integration/groundswell/agent-prompt.test.ts` (lines 39-45)

```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));
```

## File System Operation Mocking

### 1. Real FS Imports for Validation

**File**: `tests/integration/core/delta-session.test.ts` (lines 29-34)

```typescript
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
```

### 2. Helper Functions for File Operations

**File**: `tests/integration/core/delta-session.test.ts` (lines 54-56)

```typescript
function createTestPRD(path: string, content: string): void {
  writeFileSync(path, content, { mode: 0o644 });
}
```

### 3. Mocked File Operations with Selective Real Implementation

**File**: `tests/integration/prp-generator-integration.test.ts` (lines 33-48)

```typescript
mkdir: vi.fn((path: string, options: any) => {
  // Use real mkdir for test setup
  return actualFs.mkdir(path, options);
}),
writeFile: vi.fn((path: string, data: any) => {
  // Use real writeFile for test setup
  return actualFs.writeFile(path, data);
}),
```

## Prompt Content and Structure Validation

### 1. Prompt Structure Validation

**File**: `tests/integration/prp-blueprint-agent.test.ts` (lines 95-111)

```typescript
expect(prompt).toBeDefined();
expect(typeof prompt.user).toBe('string');
expect(typeof prompt.systemOverride).toBe('string');
expect(prompt.responseFormat).toBeDefined();
expect(prompt.enableReflection).toBe(true);
```

### 2. Content Validation

**File**: `tests/integration/prp-blueprint-agent.test.ts` (lines 102-110)

```typescript
expect(prompt.user).toContain(subtask.title);
expect(prompt.user).toContain(subtask.context_scope);
expect(prompt.user).toContain('Dependencies:');
expect(prompt.user).toContain('Parent Context');
expect(prompt.systemOverride).toContain('Create PRP for Work Item');
expect(prompt.systemOverride).toContain('PRP Creation Mission');
```

### 3. Prompt Schema Validation

**File**: `tests/integration/groundswell/agent-prompt.test.ts` (lines 181-194)

```typescript
expect(prompt1.id).not.toBe(prompt2.id);
expect(prompt.user).toBe('Hello world');
expect(prompt.data).toEqual({ key: 'value' });
```

## Mocking Subagent Spawning

### Current Implementation Gap

The codebase references "subagent spawning" in prompts but doesn't implement it:
- No batch tools system
- Single cached agent instance
- Manual agent creation only

### Testing Approach

Since subagent spawning is not implemented:
1. Mock the single agent.prompt() call
2. Test that prompt CONTAINS instructions to spawn subagents
3. Verify prompt structure without testing actual spawning

Example test pattern:

```typescript
it('should prompt Researcher to spawn subagents for codebase analysis', () => {
  const { PRP_CREATE_PROMPT } = require('../../src/agents/prompts.js');

  // VERIFY: Prompt contains subagent spawning instructions
  expect(PRP_CREATE_PROMPT).toContain('spawn subagents');
  expect(PRP_CREATE_PROMPT).toContain('batch tools');
  expect(PRP_CREATE_PROMPT).toContain('TodoWrite');
});
```

## Mocking Cache Operations

### 1. Mock File System for Cache

**File**: `tests/unit/agents/prp-generator.test.ts` (lines 467-632)

```typescript
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
}));
```

### 2. Mock stat() for TTL Checking

```typescript
vi.mocked(stat).mockResolvedValue({
  mtimeMs: Date.now() - 1000, // 1 second ago (recent)
} as any);
```

### 3. Mock readFile() for Cache Loading

```typescript
vi.mocked(readFile).mockResolvedValue(
  JSON.stringify({
    taskId: 'P1.M1.T1.S1',
    taskHash: 'abc123',
    createdAt: Date.now(),
    accessedAt: Date.now(),
    version: '1.0',
    prp: mockPRPDocument,
  })
);
```

## Global Test Setup

**File**: `tests/setup.ts`

### 1. z.ai API Safeguard (lines 56-120)

```typescript
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL;
if (ANTHROPIC_BASE_URL === 'https://api.anthropic.com' || !ANTHROPIC_BASE_URL) {
  console.error('ERROR: Cannot run tests against production Anthropic API');
  process.exit(1);
}
```

### 2. BeforeEach Hooks (lines 162-180)

```typescript
beforeEach(() => {
  // Clear mocks
  vi.clearAllMocks();
  // Reset environment
  // Setup test directories
});
```

### 3. AfterEach Hooks (lines 189-229)

```typescript
afterEach(async () => {
  // Clean up test directories
  // Unstub environments
  // Clear mocks
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

## Best Practices for Researcher Agent Tests

1. **Mock Groundswell, NOT agent-factory**
   - Test real createResearcherAgent() function
   - Mock createAgent() which it calls internally

2. **Use vi.mock at Top Level**
   - Before any imports
   - Use vi.importActual() to preserve real implementations

3. **Dynamic Import Pattern**
   - Use beforeAll to load mocked modules
   - Store in variable for test access

4. **SETUP/EXECUTE/VERIFY Comments**
   - Clear test structure documentation
   - Makes tests self-documenting

5. **Cleanup in afterEach**
   - Always vi.unstubAllEnvs()
   - Always vi.clearAllMocks()

6. **Mock File Operations Selectively**
   - Use real implementation for test setup
   - Mock only the operations under test

7. **Test Prompt Content, Not Subagent Spawning**
   - Verify prompt contains correct instructions
   - Don't test unimplemented subagent features

8. **Mock Cache Operations**
   - stat() for TTL checking
   - readFile() for cache loading
   - writeFile() for cache saving
   - mkdir() for directory creation

9. **Verify Schema Validation**
   - Test PRPDocumentSchema.parse() behavior
   - Test error handling for invalid schemas
