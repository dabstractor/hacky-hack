# Integration Test Patterns Research

**Project:** hacky-hack
**Task:** P1.M1.T3.S3 - Research existing integration test patterns
**Date:** 2026-01-19
**Author:** Research Agent

---

## Executive Summary

This document catalogs existing integration test patterns in the codebase to guide implementation of Researcher Agent integration tests. Key findings include:

- **Mock-first approach**: Mock Groundswell/LLM calls, keep real BashMCP/tools
- **Dynamic imports**: Use `vi.importActual()` and dynamic imports to preserve real implementations
- **SETUP/EXECUTE/VERIFY pattern**: Consistent test structure across all files
- **File I/O mocking**: Targeted mocking of fs operations while preserving test setup

---

## 1. Integration Test File Structure

### 1.1 Directory Layout

```
tests/
├── integration/
│   ├── agents/                      # Agent-specific integration tests
│   │   └── architect-agent-integration.test.ts
│   ├── core/                        # Core component integration tests
│   │   ├── task-orchestrator.test.ts
│   │   ├── session-manager.test.ts
│   │   └── delta-session.test.ts
│   ├── groundswell/                 # Groundswell library tests
│   │   ├── agent-prompt.test.ts
│   │   ├── mcp.test.ts
│   │   └── workflow.test.ts
│   ├── utils/                       # Utility integration tests
│   │   └── error-handling.test.ts
│   ├── agents.test.ts               # Agent factory integration tests
│   ├── architect-agent.test.ts      # Architect agent output tests
│   ├── prp-blueprint-agent.test.ts  # PRP blueprint prompt tests
│   ├── prp-executor-integration.test.ts
│   ├── prp-generator-integration.test.ts
│   ├── tools.test.ts                # MCP tools integration tests
│   └── ...other integration tests
└── e2e/                            # End-to-end tests
    ├── pipeline.test.ts
    └── delta.test.ts
```

### 1.2 File Naming Conventions

| Pattern | Description | Examples |
|---------|-------------|----------|
| `{component}.test.ts` | Standard integration tests | `agents.test.ts`, `tools.test.ts` |
| `{component}-integration.test.ts` | Explicit integration marker | `prp-executor-integration.test.ts`, `prp-generator-integration.test.ts` |
| `agent-{persona}.test.ts` | Persona-specific tests | `architect-agent.test.ts` |
| `{category}/{component}-integration.test.ts` | Category-subgrouped | `agents/architect-agent-integration.test.ts` |

### 1.3 Header Documentation Pattern

```typescript
/**
 * Integration test for {Component Name}
 *
 * @remarks
 * Tests validate {what the tests validate}.
 * {Additional context about mocking strategy}
 * {Dependencies on other successful implementations}
 *
 * @testPath integration/{test-file-name}
 * @covers {functions/classes being tested}
 * @validation {what is being validated}
 *
 * @see {@link ./other-file.test.ts} - Related test file
 * @see {@link ../../path/to/source.ts} - Implementation file
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */
```

---

## 2. Mock Setup Patterns

### 2.1 Groundswell Mocking (Recommended for Agent Tests)

**Location:** `tests/integration/agents/architect-agent-integration.test.ts`

```typescript
// =============================================================================
// MOCK SETUP: Groundswell (NOT agent-factory)
// =============================================================================
// CRITICAL: Mock Groundswell, NOT agent-factory
// This allows testing the real createArchitectAgent() function
// We mock createAgent() which the factory calls internally
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// =============================================================================
// DYNAMIC IMPORTS - Load after mocks are established
// =============================================================================

/**
 * Dynamic import for Groundswell
 *
 * @remarks
 * Ensures mocks are applied before Groundswell loads.
 * The vi.mock() above intercepts the import and provides
 * mock functions for createAgent and createPrompt.
 */
async function loadGroundswell() {
  return await import('groundswell');
}
```

**Key Points:**
- Use `vi.importActual()` to preserve non-mocked exports (MCPHandler, types)
- Mock `createAgent` and `createPrompt`, NOT the agent factory
- Dynamic imports ensure mocks are applied before loading

### 2.2 Agent Factory Mocking (Alternative Pattern)

**Location:** `tests/integration/agents.test.ts`

```typescript
// Pattern: Mock at top level before imports (hoisting required by vi.mock)
// Use importOriginal to preserve MCPHandler and other exports needed by MCP tools
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import after mocking - get mocked versions
import { createAgent, createPrompt } from 'groundswell';

// Setup createAgent to return mock agent
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
```

### 2.3 Anthropic SDK Mocking

**Location:** `tests/integration/groundswell/agent-prompt.test.ts`

```typescript
/**
 * Mock Anthropic SDK to prevent accidental API calls
 *
 * @remarks
 * Groundswell Agent initializes the Anthropic SDK in constructor.
 * Mocking ensures tests are isolated and don't make external API calls.
 * This is required by the z.ai API endpoint enforcement.
 */
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));
```

### 2.4 Module-Level Mocking Pattern

**Location:** `tests/integration/agents.test.ts`

```typescript
// =============================================================================
// MOCK PATTERN: Groundswell createAgent and createPrompt
// =============================================================================

// Pattern: Mock at top level before imports (hoisting required by vi.mock)
// Use importOriginal to preserve MCPHandler and other exports needed by MCP tools
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import after mocking - get mocked versions
import { createAgent, createPrompt } from 'groundswell';

// =============================================================================
// MOCK FIXTURES: Reusable test data
// =============================================================================

// Mock Agent with prompt method (pattern from architect-agent.test.ts)
const mockAgent = {
  prompt: vi.fn(),
};

// Setup createAgent to return mock agent
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
```

---

## 3. SETUP/EXECUTE/VERIFY Pattern

### 3.1 Standard Test Structure

**Location:** `tests/integration/architect-agent.test.ts`

```typescript
describe('integration/architect-agent', () => {
  // CLEANUP: Always restore mocks after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('architect output validation', () => {
    it('should generate valid backlog matching BacklogSchema', async () => {
      // SETUP: Read PRD and create agent
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', process.env.ANTHROPIC_API_KEY || 'test-key');
      vi.stubEnv('ANTHROPIC_BASE_URL', process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic');

      const prdContent = await readFile(PRD_PATH, 'utf-8');
      const architect = createArchitectAgent();
      const prompt = createArchitectPrompt(prdContent);

      // MOCK: Return fixture data for fast, deterministic testing
      const mockBacklog: Backlog = { /* ... */ };
      vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);

      // EXECUTE: Call agent
      const result = await architect.prompt(prompt);

      // VERIFY: Validate against BacklogSchema
      const validation = BacklogSchema.safeParse(result);
      expect(validation.success).toBe(true);
      expect(validation.data).toEqual(mockBacklog);
    });
  });
});
```

### 3.2 Comment Annotation Pattern

All integration tests follow this comment structure:

```typescript
// SETUP: {what is being set up}
// EXECUTE: {what action is being performed}
// VERIFY: {what is being asserted}
```

**Example from PRP Executor:**

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

---

## 4. Test Hook Patterns

### 4.1 beforeAll for Dynamic Imports

**Location:** `tests/integration/agents/architect-agent-integration.test.ts`

```typescript
describe('integration/agents/architect-agent-integration', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  // ---------------------------------------------------------------------------
  // HOOKS: Setup and cleanup
  // ---------------------------------------------------------------------------

  /**
   * Load Groundswell dynamically before all tests
   *
   * @remarks
   * Must use dynamic import to ensure vi.mock() is applied.
   * The mock provides createAgent and createPrompt spies.
   */
  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  /**
   * Clear mocks before each test
   *
   * @remarks
   * Ensures each test starts with clean mock state.
   * Prevents mock call counts from accumulating across tests.
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Cleanup after each test
   *
   * @remarks
   * - Unstub environment variables to prevent cross-test pollution
   * - Clear all mocks to reset spy call counts
   * - Following pattern from tests/integration/groundswell/agent-prompt.test.ts
   */
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });
});
```

### 4.2 Environment Variable Management

```typescript
// Pattern: Stub environment variables for each test
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
});

// Pattern: Restore environment after each test
afterEach(() => {
  vi.unstubAllEnvs();
});
```

---

## 5. Assertion Patterns for Agent Testing

### 5.1 Schema Validation

**Location:** `tests/integration/agents/architect-agent-integration.test.ts`

```typescript
it('should validate output against BacklogSchema', async () => {
  // SETUP: Import and create mock agent
  const { BacklogSchema } = await import('/home/dustin/projects/hacky-hack/src/core/models.js');
  const { createArchitectAgent } = await import('/home/dustin/projects/hacky-hack/src/agents/agent-factory.js');
  const { createArchitectPrompt } = await import('/home/dustin/projects/hacky-hack/src/agents/prompts/architect-prompt.js');

  // SETUP: Create mock agent with controlled response
  const mockBacklog = createMockBacklog();
  const mockAgent = {
    id: 'test-agent-id',
    name: 'ArchitectAgent',
    prompt: vi.fn().mockResolvedValue(mockBacklog),
  };
  (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

  // EXECUTE: Call architect agent
  const architect = createArchitectAgent();
  const prompt = createArchitectPrompt('# Test PRD');
  const result = await architect.prompt(prompt);

  // VERIFY: Result validates against BacklogSchema
  const validation = BacklogSchema.safeParse(result);
  expect(validation.success).toBe(true);
});
```

### 5.2 ID Format Validation

```typescript
it('should validate all ID formats', async () => {
  // SETUP: Import and create mock agent
  const { BacklogSchema } = await import('/home/dustin/projects/hacky-hack/src/core/models.js');

  // ...setup code...

  // VERIFY: Validate against schema
  const validation = BacklogSchema.safeParse(result);
  expect(validation.success).toBe(true);

  if (validation.success) {
    // VERIFY: Phase IDs match /^P\d+$/
    for (const phase of validation.data.backlog) {
      expect(phase.id).toMatch(/^P\d+$/);
      expect(phase.type).toBe('Phase');

      // VERIFY: Milestone IDs match /^P\d+\.M\d+$/
      for (const milestone of phase.milestones) {
        expect(milestone.id).toMatch(/^P\d+\.M\d+$/);
        expect(milestone.type).toBe('Milestone');

        // VERIFY: Task IDs match /^P\d+\.M\d+\.T\d+$/
        for (const task of milestone.tasks) {
          expect(task.id).toMatch(/^P\d+\.M\d+\.T\d+$/);
          expect(task.type).toBe('Task');

          // VERIFY: Subtask IDs match /^P\d+\.M\d+\.T\d+\.S\d+$/
          for (const subtask of task.subtasks) {
            expect(subtask.id).toMatch(/^P\d+\.M\d+\.T\d+\.S\d+$/);
            expect(subtask.type).toBe('Subtask');
          }
        }
      }
    }
  }
});
```

### 5.3 Content Validation

```typescript
it('should contain Research-Driven Architecture section', async () => {
  // SETUP: Import TASK_BREAKDOWN_PROMPT
  const { TASK_BREAKDOWN_PROMPT } = await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

  // VERIFY: Contains key phrases from Research-Driven Architecture section
  expect(TASK_BREAKDOWN_PROMPT).toContain('RESEARCH-DRIVEN ARCHITECTURE');
  expect(TASK_BREAKDOWN_PROMPT).toContain('SPAWN SUBAGENTS');
  expect(TASK_BREAKDOWN_PROMPT).toContain('$SESSION_DIR/architecture/');
  expect(TASK_BREAKDOWN_PROMPT).toContain('VALIDATE BEFORE BREAKING DOWN');
});
```

### 5.4 Configuration Verification

```typescript
it('should create architect agent with GLM-4.7 model', async () => {
  // SETUP: Import real agent-factory after mocks are applied
  const { createArchitectAgent } = await import('/home/dustin/projects/hacky-hack/src/agents/agent-factory.js');
  const { TASK_BREAKDOWN_PROMPT } = await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

  // SETUP: Configure mock agent return value
  const mockAgent = {
    id: 'test-agent-id',
    name: 'ArchitectAgent',
    prompt: vi.fn(),
  };
  (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

  // EXECUTE: Create architect agent
  createArchitectAgent();

  // VERIFY: createAgent called with GLM-4.7 model
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'ArchitectAgent',
      model: 'GLM-4.7',
      system: TASK_BREAKDOWN_PROMPT,
      maxTokens: 8192,
      enableCache: true,
      enableReflection: true,
    })
  );
});
```

---

## 6. BashMCP Mocking Patterns

### 6.1 Real BashMCP with Mocked Agent

**Location:** `tests/integration/prp-executor-integration.test.ts`

**Strategy:** Use real BashMCP, mock only the agent.prompt() call

```typescript
/**
 * Integration tests for PRPExecutor class
 *
 * @remarks
 * Tests validate PRPExecutor class with real dependencies but mocked LLM calls.
 * Uses actual createCoderAgent() and BashMCP instances but mocks agent.prompt()
 * to avoid real API calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRPExecutor } from '../../src/agents/prp-executor.js';
import type { PRPDocument } from '../../src/core/models.js';

// Mock the agent-factory module but preserve real BashMCP
vi.mock('../../src/agents/agent-factory.js', () => {
  const actual = vi.importActual('../../src/agents/agent-factory.js');
  return {
    ...(actual as any),
    createCoderAgent: vi.fn(),
  };
});

// Import after mocking
import { createCoderAgent } from '../../src/agents/agent-factory.js';

const mockCreateCoderAgent = createCoderAgent as any;

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

    // VERIFY: All validation gates executed with real BashMCP
    expect(result.success).toBe(true);
    expect(result.validationResults).toHaveLength(4);

    const level1Result = result.validationResults.find(r => r.level === 1);
    expect(level1Result?.stdout).toContain('Syntax check passed');
  });
});
```

### 6.2 Full ChildProcess Mocking

**Location:** `tests/integration/tools.test.ts`

**Strategy:** Mock `node:child_process` spawn for complete control

```typescript
// =============================================================================
// MOCK PATTERN: Module-level mocking with hoisting
// All mocks must be at top level before imports due to hoisting
// =============================================================================

// Mock child_process for BashMCP
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Import after mocking - get mocked versions
import { spawn, type ChildProcess } from 'node:child_process';

// Create typed mock references
const mockSpawn = vi.mocked(spawn);

// =============================================================================
// MOCK FACTORY: createMockChild for ChildProcess
// =============================================================================

/**
 * Creates a realistic mock of Node.js ChildProcess that emits
 * data events and closes with the specified exit code.
 */
function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          // Simulate async data emission
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        // Simulate async close
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

describe('BashMCP.executeTool', () => {
  let bashMCP: BashMCP;

  beforeEach(() => {
    bashMCP = new BashMCP();
    mockExistsSync.mockReturnValue(true);
    mockRealpathSync.mockImplementation((path: unknown) => path as string);
  });

  it('should execute bash command via executeTool() and return result', async () => {
    vi.useRealTimers(); // Use real timers for mock child timing

    // SETUP
    const mockChild = createMockChild({ stdout: 'hello world', exitCode: 0 });
    mockSpawn.mockReturnValue(mockChild);

    // EXECUTE
    const toolResult = await bashMCP.executeTool('bash__execute_bash', {
      command: 'echo hello world',
    });
    const result = parseToolResult(toolResult);

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('hello world');

    vi.useFakeTimers(); // Restore fake timers for other tests
  });
});
```

### 6.3 Stdio/Error Handling Patterns

```typescript
it('should capture stdout and stderr from real BashMCP commands', async () => {
  // SETUP
  const customValidationGates: PRPDocument['validationGates'] = [
    {
      level: 1,
      description: 'Echo test',
      command: 'echo "Hello from stdout"',
      manual: false,
    },
  ];
  const prp = createMockPRPDocument('P1.M2.T2.S2', customValidationGates);

  // Mock Coder Agent
  mockAgent.prompt.mockResolvedValue(
    JSON.stringify({
      result: 'success',
      message: 'Implementation complete',
    })
  );

  const executor = new PRPExecutor(sessionPath);

  // EXECUTE
  const result = await executor.execute(prp, prpPath);

  // VERIFY: Output was captured
  const level1Result = result.validationResults.find(r => r.level === 1);
  expect(level1Result?.stdout).toContain('Hello from stdout');
});

it('should handle command that returns non-zero exit code', async () => {
  vi.useRealTimers();

  // SETUP
  const mockChild = createMockChild({
    stdout: 'some output',
    stderr: 'error message',
    exitCode: 1,
  });
  mockSpawn.mockReturnValue(mockChild);

  // EXECUTE
  const toolResult = await bashMCP.executeTool('bash__execute_bash', {
    command: 'failing-command',
  });
  const result = parseToolResult(toolResult);

  vi.useFakeTimers();

  // VERIFY
  expect(result.success).toBe(false);
  expect(result.exitCode).toBe(1);
  expect(result.error).toBe('Command failed with exit code 1');
});
```

---

## 7. File I/O Mocking Patterns

### 7.1 Targeted Mocking for Specific Paths

**Location:** `tests/integration/prp-generator-integration.test.ts`

```typescript
// Mock node:fs/promises for PRP file operations only
vi.mock('node:fs/promises', async () => {
  const actualFs = await vi.importActual('node:fs/promises');
  return {
    ...actualFs,
    // Mock mkdir and writeFile for PRP operations only
    mkdir: vi.fn((path: string, options: any) => {
      // Check if this is a PRP directory operation
      if (path && path.toString().includes('prps')) {
        return Promise.resolve(undefined);
      }
      // Use real mkdir for test setup
      return actualFs.mkdir(path, options);
    }),
    writeFile: vi.fn((path: string, data: any, options: any) => {
      // Check if this is a PRP file write operation
      if (path && path.toString().includes('prps')) {
        return Promise.resolve(undefined);
      }
      // Use real writeFile for test setup
      return actualFs.writeFile(path, data, options);
    }),
  };
});

// Import mocked functions
const mockMkdir = mkdir as any;
const mockWriteFile = writeFile as any;
```

### 7.2 Path-Based Mock Routing

**Location:** `tests/integration/prp-pipeline-shutdown.test.ts`

```typescript
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFile: vi.fn((path: string) => {
      // If reading PRD.md, return test PRD
      if (path.includes('PRD.md')) {
        return actual.readFile(path, 'utf-8');
      }
      // If reading tasks.json, return test backlog
      if (path.includes('tasks.json')) {
        return actual.readFile(path, 'utf-8');
      }
      // Default to real implementation
      return actual.readFile(path, 'utf-8');
    }),
  };
});
```

### 7.3 Complete Filesystem Mocking

**Location:** `tests/integration/tools.test.ts`

```typescript
// Mock node:fs for BashMCP (cwd validation), FilesystemMCP, and GitMCP
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path: unknown) => path as string),
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

// Import after mocking
import { promises as fs, existsSync, realpathSync } from 'node:fs';

// Create typed mock references
const mockExistsSync = vi.mocked(existsSync);
const mockRealpathSync = vi.mocked(realpathSync);
const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockMkdir = vi.mocked(fs.mkdir);

describe('FilesystemMCP.executeTool', () => {
  let fsMCP: FilesystemMCP;

  beforeEach(() => {
    fsMCP = new FilesystemMCP();
  });

  it('should read file with encoding via executeTool()', async () => {
    // SETUP
    const content = 'file content here';
    mockReadFile.mockResolvedValue(content as any);

    // EXECUTE
    const toolResult = await fsMCP.executeTool('filesystem__file_read', {
      path: './test.txt',
      encoding: 'utf-8',
    });
    const result = parseToolResult(toolResult);

    // VERIFY
    expect(result.success).toBe(true);
    expect(result.content).toBe(content);
    expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
      encoding: 'utf-8',
    });
  });
});
```

---

## 8. Test Data Factory Patterns

### 8.1 Factory Functions

**Location:** `tests/integration/prp-executor-integration.test.ts`

```typescript
// Factory function for test data
const createMockPRPDocument = (
  taskId: string,
  validationGates?: PRPDocument['validationGates']
): PRPDocument => ({
  taskId,
  objective: 'Implement feature X',
  context: '## Context\nFull context here',
  implementationSteps: ['Step 1: Create file', 'Step 2: Implement logic'],
  validationGates: validationGates ?? [
    {
      level: 1,
      description: 'Syntax check',
      command: 'echo "Syntax check passed"',
      manual: false,
    },
    {
      level: 2,
      description: 'Unit tests',
      command: 'echo "Unit tests passed"',
      manual: false,
    },
    {
      level: 3,
      description: 'Integration tests',
      command: 'echo "Integration tests passed"',
      manual: false,
    },
    {
      level: 4,
      description: 'Manual review',
      command: null,
      manual: true,
    },
  ],
  successCriteria: [
    { description: 'Feature works as expected', satisfied: false },
    { description: 'Tests pass', satisfied: false },
  ],
  references: ['https://example.com/docs'],
});
```

### 8.2 Complex Object Factories

**Location:** `tests/integration/agents/architect-agent-integration.test.ts`

```typescript
/**
 * Factory function for creating valid mock Backlog data
 *
 * @remarks
 * Returns a minimal valid Backlog that satisfies BacklogSchema validation.
 * Used for testing agent output schema compliance.
 *
 * @returns Valid Backlog object with Phase > Milestone > Task > Subtask hierarchy
 */
const createMockBacklog = () => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase' as const,
      title: 'Phase 1: Test',
      status: 'Planned' as const,
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone' as const,
          title: 'Milestone 1.1',
          status: 'Planned' as const,
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task' as const,
              title: 'Task 1.1.1',
              status: 'Planned' as const,
              description: 'Test task',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask' as const,
                  title: 'Subtask 1.1.1.1',
                  status: 'Planned' as const,
                  story_points: 2,
                  dependencies: [],
                  context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test research findings.
2. INPUT: None.
3. LOGIC: Test logic implementation.
4. OUTPUT: Test output for next subtask.`,
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

### 8.3 Reusable Fixtures

**Location:** `tests/integration/agents.test.ts`

```typescript
// =============================================================================
// MOCK FIXTURES: Reusable test data
// =============================================================================

// Test fixture: Sample PRD content
const mockPRDContent =
  '# Test PRD\n\nThis is a test PRD for integration testing.';

// Test fixture: Sample Subtask
const mockSubtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test Subtask',
  status: 'Planned',
  story_points: 2,
  dependencies: [],
  context_scope: 'Test context scope for implementation',
};

// Test fixture: Sample Task
const mockTask: Task = {
  id: 'P1.M1.T1',
  type: 'Task',
  title: 'Test Task',
  status: 'Planned',
  description: 'Test task description',
  subtasks: [mockSubtask],
};

// Test fixture: Sample Backlog
const mockBacklog: Backlog = {
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
          tasks: [mockTask],
        },
      ],
    },
  ],
};
```

---

## 9. Timeout Patterns

### 9.1 LLM Call Timeouts

**Location:** `tests/integration/architect-agent.test.ts`

```typescript
it(
  'should generate valid backlog matching BacklogSchema',
  async () => {
    // test code...
  },
  { timeout: 30000 }
); // Longer timeout for LLM calls
```

### 9.2 Conditional Timeouts

```typescript
it('should handle validation gate failure with real BashMCP', async () => {
  // test code...
}, { timeout: 10000 }); // Standard timeout for Bash operations
```

---

## 10. Documentation Patterns

### 10.1 Test Suite Documentation

```typescript
/**
 * Integration tests for Agent Factory and Prompt Generators
 *
 * @remarks
 * Tests validate the complete flow: agent factory → Groundswell agents → Prompt generators
 * Mocks Groundswell dependencies to prevent real LLM calls and MCP server registration issues.
 *
 * Test coverage goals:
 * - 100% coverage for src/agents/agent-factory.ts
 * - Validates system prompt assignments for all agent types
 * - Validates Prompt<T> typing and Zod schema associations for all prompt generators
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */
```

### 10.2 Test Group Documentation

```typescript
// =============================================================================
// TEST SUITE 1: Basic Agent Creation
// =============================================================================
// =============================================================================
// TEST SUITE 2: Prompt Creation with Zod Schema
// =============================================================================
// =============================================================================
// TEST SUITE 3: validateResponse() Method
// =============================================================================
```

### 10.3 Inline Pattern Comments

```typescript
// PATTERN: Test-wide constants
const PRD_PATH = resolve(process.cwd(), 'PRD.md');
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true';

// PATTERN: Test 1 - Verify setup and agent creation
describe('setup', () => { /* ... */ });

// PATTERN: Test 2 - Validate architect output structure
describe('architect output validation', () => { /* ... */ });

// PATTERN: Test 3 - Validate hierarchy structure
// PATTERN: Test 4 - Validate story_points
// PATTERN: Test 5 - Log sample output
```

---

## 11. Mock Reset Patterns

### 11.1 Complete Cleanup

```typescript
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

### 11.2 Selective Cleanup

```typescript
beforeEach(() => {
  // Clear mock calls before each test
  mockWriteFile.mockClear();
  mockMkdir.mockClear();
});
```

### 11.3 Mock Restoration

```typescript
// Real/Timer management
vi.useRealTimers(); // Use real timers for async operations

// Test code...

vi.useFakeTimers(); // Restore fake timers for other tests
```

---

## 12. Real vs Mocked LLM Pattern

### 12.1 Environment Variable Control

**Location:** `tests/integration/architect-agent.test.ts`

```typescript
// PATTERN: Test-wide constants
const PRD_PATH = resolve(process.cwd(), 'PRD.md');
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true'; // Flag for real vs mocked

describe('architect output validation', () => {
  it('should generate valid backlog matching BacklogSchema', async () => {
    // SETUP: Read PRD and create agent
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', process.env.ANTHROPIC_API_KEY || 'test-key');
    vi.stubEnv('ANTHROPIC_BASE_URL', process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic');

    const prdContent = await readFile(PRD_PATH, 'utf-8');
    const architect = createArchitectAgent();
    const prompt = createArchitectPrompt(prdContent);

    // DECISION: Use mock or real LLM based on flag
    if (USE_REAL_LLM) {
      // EXECUTE: Real LLM call with timeout
      const result = await architect.prompt(prompt);

      // VERIFY: Validate against BacklogSchema
      const validation = BacklogSchema.safeParse(result);
      expect(validation.success).toBe(true);
    } else {
      // MOCK: Return fixture data for fast, deterministic testing
      const mockBacklog: Backlog = { /* ... */ };
      vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);

      // EXECUTE: Call agent
      const result = await architect.prompt(prompt);

      // VERIFY: Validate against BacklogSchema
      const validation = BacklogSchema.safeParse(result);
      expect(validation.success).toBe(true);
    }
  });
});
```

---

## 13. Sample Logging Patterns

### 13.1 Test Output Logging

**Location:** `tests/integration/architect-agent.test.ts`

```typescript
it('should log sample output for inspection', async () => {
  // SETUP: Similar to above test
  const prdContent = await readFile(PRD_PATH, 'utf-8');
  const architect = createArchitectAgent();
  const prompt = createArchitectPrompt(prdContent);

  if (USE_REAL_LLM) {
    const result = await architect.prompt(prompt);

    // LOG: Sample output for manual inspection
    console.log('\n=== Architect Agent Sample Output ===');
    console.log('Total Phases:', result.backlog.length);

    if (result.backlog.length > 0) {
      const firstPhase = result.backlog[0];
      console.log('\nFirst Phase:', firstPhase.id, '-', firstPhase.title);

      if (firstPhase.milestones.length > 0) {
        const firstMilestone = firstPhase.milestones[0];
        console.log('  First Milestone:', firstMilestone.id, '-', firstMilestone.title);

        if (firstMilestone.tasks.length > 0) {
          const firstTask = firstMilestone.tasks[0];
          console.log('    First Task:', firstTask.id, '-', firstTask.title);

          if (firstTask.subtasks.length > 0) {
            const firstSubtask = firstTask.subtasks[0];
            console.log('      First Subtask:', firstSubtask.id);
            console.log('        Title:', firstSubtask.title);
            console.log('        Story Points:', firstSubtask.story_points);
          }
        }
      }
    }

    // LOG: Full JSON sample (truncated for size)
    console.log('\n=== Full Backlog JSON (first 500 chars) ===');
    console.log(JSON.stringify(result, null, 2).slice(0, 500) + '...');
  }
});
```

---

## 14. Summary Table: Mock Strategies

| Test Type | Mock Strategy | Real Components |
|-----------|--------------|-----------------|
| Agent Factory Integration | Mock Groundswell `createAgent`/`createPrompt` | Agent factory functions, MCP tools |
| Agent Output Validation | Mock `agent.prompt()` | Agent creation, prompt generation |
| PRP Executor | Mock `createCoderAgent`, agent.prompt() | Real BashMCP |
| MCP Tools | Mock `node:child_process`, `node:fs` | Tool execution logic |
| File I/O | Targeted mocking by path pattern | Test file operations |

---

## 15. Recommended Test File Template for Researcher Agent

Based on the patterns analyzed, here's a template for the Researcher Agent integration test:

```typescript
/**
 * Integration tests for Researcher Agent
 *
 * @remarks
 * Tests validate Researcher Agent configuration, PRP_BLUEPRINT_PROMPT validation,
 * and PRPDocumentSchema output compliance. These tests verify the agent-factory integration
 * with Groundswell, proper configuration values, and prompt structure requirements.
 *
 * @testPath integration/agents/researcher-agent-integration
 * @covers createResearcherAgent, PRP_BLUEPRINT_PROMPT, createPRPBlueprintPrompt
 * @validation Configuration, Prompt Structure, Schema Compliance
 *
 * @see {@link ../../src/agents/agent-factory.ts} - createResearcherAgent factory
 * @see {@link ../../PROMPTS.md} - PRP_BLUEPRINT_SYSTEM_PROMPT definition
 */

import { afterEach, describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';

// =============================================================================
// MOCK SETUP: Groundswell (NOT agent-factory)
// =============================================================================
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

async function loadGroundswell() {
  return await import('groundswell');
}

// =============================================================================
// TEST FIXTURE: Mock PRPDocument Data
// =============================================================================
const createMockPRPDocument = () => ({ /* ... */ });

// =============================================================================
// TEST SUITE: Researcher Agent Integration
// =============================================================================
describe('integration/agents/researcher-agent-integration', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

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

  describe('createResearcherAgent configuration', () => {
    it('should create researcher agent with correct model', async () => {
      // SETUP
      const { createResearcherAgent } = await import('/home/dustin/projects/hacky-hack/src/agents/agent-factory.js');
      const { PRP_BLUEPRINT_PROMPT } = await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

      const mockAgent = {
        id: 'test-agent-id',
        name: 'ResearcherAgent',
        prompt: vi.fn(),
      };
      (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

      // EXECUTE
      createResearcherAgent();

      // VERIFY
      expect(gs.createAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ResearcherAgent',
          model: 'GLM-4.7',
          system: PRP_BLUEPRINT_PROMPT,
          maxTokens: 4096,
          enableCache: true,
          enableReflection: true,
        })
      );
    });
  });

  describe('PRP_BLUEPRINT_PROMPT validation', () => {
    it('should contain required sections', async () => {
      // SETUP
      const { PRP_BLUEPRINT_PROMPT } = await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');

      // VERIFY
      expect(PRP_BLUEPRINT_PROMPT).toContain('PRP CREATION MISSION');
      expect(PRP_BLUEPRINT_PROMPT).toContain('IMPLEMENTATION STEPS');
      expect(PRP_BLUEPRINT_PROMPT).toContain('VALIDATION GATES');
    });
  });

  describe('agent output validation', () => {
    it('should validate output against PRPDocumentSchema', async () => {
      // SETUP
      const { PRPDocumentSchema } = await import('/home/dustin/projects/hacky-hack/src/core/models.js');
      const { createResearcherAgent } = await import('/home/dustin/projects/hacky-hack/src/agents/agent-factory.js');
      const { createPRPBlueprintPrompt } = await import('/home/dustin/projects/hacky-hack/src/agents/prompts/prp-blueprint-prompt.js');

      const mockPRPDocument = createMockPRPDocument();
      const mockAgent = {
        id: 'test-agent-id',
        name: 'ResearcherAgent',
        prompt: vi.fn().mockResolvedValue(mockPRPDocument),
      };
      (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

      // EXECUTE
      const researcher = createResearcherAgent();
      const prompt = createPRPBlueprintPrompt(/* test data */);
      const result = await researcher.prompt(prompt);

      // VERIFY
      const validation = PRPDocumentSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });
  });
});
```

---

## 16. Key Takeaways

### Do's:
1. **Mock Groundswell, NOT agent-factory** - This allows testing real factory functions
2. **Use dynamic imports** - Ensures mocks are applied before loading
3. **Follow SETUP/EXECUTE/VERIFY pattern** - Consistent test structure
4. **Use factory functions** - Create reusable test data
5. **Mock selectively** - Keep real BashMCP when possible
6. **Clean up after each test** - `vi.unstubAllEnvs()` and `vi.clearAllMocks()`
7. **Document patterns** - Use @remarks, @see, and inline comments

### Don'ts:
1. **Don't mock agent-factory directly** - Use Groundswell mocks instead
2. **Don't forget to unstub environments** - Prevents cross-test pollution
3. **Don't use hardcoded timeouts** - Use { timeout: N } for slow tests
4. **Don't skip real BashMCP when unnecessary** - Prefer real over mocked
5. **Don't mix mock strategies** - Choose one approach per test file

---

## 17. References

- **Vitest Documentation:** https://vitest.dev/guide/
- **Test Files Analyzed:**
  - `tests/integration/agents/architect-agent-integration.test.ts`
  - `tests/integration/architect-agent.test.ts`
  - `tests/integration/agents.test.ts`
  - `tests/integration/prp-executor-integration.test.ts`
  - `tests/integration/prp-generator-integration.test.ts`
  - `tests/integration/prp-blueprint-agent.test.ts`
  - `tests/integration/tools.test.ts`
  - `tests/integration/groundswell/agent-prompt.test.ts`

---

**End of Research Document**
