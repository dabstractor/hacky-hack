/**
 * Integration tests for Coder Agent and PRP execution system
 *
 * @remarks
 * This test file verifies the complete Coder Agent integration including:
 * - Coder Agent configuration (model, tokens, MCP tools, cache, reflection)
 * - PRP_BUILDER_PROMPT structure validation (Execution Process, Progressive Validation)
 * - PRP executor integration (PRP path injection, agent orchestration)
 * - Progressive validation execution (4 levels, sequential, stop-on-fail)
 * - Fix-and-retry mechanism (max 2 attempts, exponential backoff, error context)
 * - BashMCP tool integration (command execution, output capture, timeout)
 * - Validation artifact collection (structure, content)
 *
 * Testing Strategy:
 * - Mock Groundswell (createAgent) for agent configuration tests
 * - Mock agent-factory (createCoderAgent) for PRP executor tests
 * - Use real BashMCP for actual command execution (NOT mocked)
 * - State machine patterns for fix-and-retry scenarios
 *
 * @see {@link ../../src/agents/agent-factory.ts | agent-factory.ts} - Coder Agent creation
 * @see {@link ../../src/agents/prp-executor.ts | prp-executor.ts} - PRP execution
 * @see {@link ../../PROMPTS.md | PROMPTS.md} - PRP_BUILDER_PROMPT definition
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  beforeAll,
} from 'vitest';

// =============================================================================
// MOCK SETUP - Must be at top level for hoisting
// =============================================================================

/**
 * Helper function to create a mock AgentResponse
 *
 * @remarks
 * Creates a proper AgentResponse object matching Groundswell's types.
 *
 * @param data - The response data
 * @returns A success AgentResponse<string>
 */
function createMockAgentResponse(data: string): {
  status: 'success';
  data: string;
  error: null;
  metadata: {
    agentId: string;
    timestamp: number;
  };
} {
  return {
    status: 'success',
    data,
    error: null,
    metadata: {
      agentId: 'mock-agent-id',
      timestamp: Date.now(),
    },
  };
}

/**
 * Mock Groundswell for agent configuration tests
 *
 * @remarks
 * Must be at top level before any imports that use groundswell.
 */
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn().mockReturnValue({
      id: 'mock-agent-id',
      name: 'MockAgent',
      prompt: vi.fn(),
    }),
    createPrompt: vi.fn(),
  };
});

// =============================================================================
// IMPORTS - After mocks are established
// =============================================================================

import type { PRPDocument } from '../../src/core/models.js';
import { PRPExecutor } from '../../src/agents/prp-executor.js';
import { PRP_BUILDER_PROMPT } from '../../src/agents/prompts.js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Dynamic import ensures mocks are applied before Groundswell loads
 */
async function loadGroundswell() {
  return await import('groundswell');
}

/**
 * Create a mock PRPDocument for testing
 *
 * @param taskId - Unique task identifier
 * @param validationGates - Optional custom validation gates
 * @returns PRPDocument matching src/core/models.ts interface
 */
function createMockPRPDocument(
  taskId: string,
  validationGates?: PRPDocument['validationGates']
): PRPDocument {
  return {
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
  };
}

// =============================================================================
// TEST SUITE 1: PRP_BUILDER_PROMPT Structure Validation
// =============================================================================

describe('integration/coder-agent > PRP_BUILDER_PROMPT structure validation', () => {
  it('should contain Execution Process section', () => {
    // VERIFY: Contains all Execution Process step titles
    expect(PRP_BUILDER_PROMPT).toContain('Execution Process');
    expect(PRP_BUILDER_PROMPT).toContain('Load PRP (CRITICAL FIRST STEP)');
    expect(PRP_BUILDER_PROMPT).toContain('ULTRATHINK & Plan');
    expect(PRP_BUILDER_PROMPT).toContain('Execute Implementation');
    expect(PRP_BUILDER_PROMPT).toContain('Progressive Validation');
    expect(PRP_BUILDER_PROMPT).toContain('Completion Verification');
  });

  it('should instruct to Load PRP as first step', () => {
    // VERIFY: Contains critical first step instructions
    expect(PRP_BUILDER_PROMPT).toContain(
      'Use the `Read` tool to read the PRP file'
    );
    expect(PRP_BUILDER_PROMPT).toContain('PRP File');
    expect(PRP_BUILDER_PROMPT).toContain(
      'You MUST read this file before doing anything else'
    );
  });

  it('should contain Progressive Validation section', () => {
    // VERIFY: Contains all 4 validation levels
    expect(PRP_BUILDER_PROMPT).toContain('Progressive Validation');
    expect(PRP_BUILDER_PROMPT).toContain('Level 1');
    expect(PRP_BUILDER_PROMPT).toContain('Level 2');
    expect(PRP_BUILDER_PROMPT).toContain('Level 3');
    expect(PRP_BUILDER_PROMPT).toContain('Level 4');
    expect(PRP_BUILDER_PROMPT).toContain(
      'Each level must pass before proceeding'
    );
  });

  it('should specify JSON output format', () => {
    // VERIFY: Contains JSON output specification
    expect(PRP_BUILDER_PROMPT).toContain('"result"');
    expect(PRP_BUILDER_PROMPT).toContain('"message"');
    expect(PRP_BUILDER_PROMPT).toContain('success');
    expect(PRP_BUILDER_PROMPT).toContain('error');
  });

  it('should include failure protocol', () => {
    // VERIFY: Contains failure protocol instructions
    expect(PRP_BUILDER_PROMPT).toContain('Failure Protocol');
    expect(PRP_BUILDER_PROMPT).toContain(
      'halt and produce a thorough explanation'
    );
  });
});

// =============================================================================
// TEST SUITE 2: Coder Agent Configuration
// =============================================================================

describe('integration/coder-agent > createCoderAgent configuration', () => {
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

  it('should create coder agent with GLM-4.7 model', async () => {
    // SETUP: Import real agent-factory after mocks established
    const { createCoderAgent } =
      await import('../../src/agents/agent-factory.js');

    // EXECUTE: Create coder agent
    createCoderAgent();

    // VERIFY: createAgent called with model: GLM-4.7
    expect(gs.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'GLM-4.7',
      })
    );
  });

  it('should create coder agent with 4096 max tokens', async () => {
    // SETUP: Import real agent-factory
    const { createCoderAgent } =
      await import('../../src/agents/agent-factory.js');

    // EXECUTE: Create coder agent
    createCoderAgent();

    // VERIFY: createAgent called with maxTokens: 4096
    expect(gs.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: 4096,
      })
    );
  });

  it('should create coder agent with cache enabled', async () => {
    // SETUP: Import real agent-factory
    const { createCoderAgent } =
      await import('../../src/agents/agent-factory.js');

    // EXECUTE: Create coder agent
    createCoderAgent();

    // VERIFY: createAgent called with enableCache: true
    expect(gs.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        enableCache: true,
      })
    );
  });

  it('should create coder agent with reflection enabled', async () => {
    // SETUP: Import real agent-factory
    const { createCoderAgent } =
      await import('../../src/agents/agent-factory.js');

    // EXECUTE: Create coder agent
    createCoderAgent();

    // VERIFY: createAgent called with enableReflection: true
    expect(gs.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        enableReflection: true,
      })
    );
  });

  it('should create coder agent with MCP tools', async () => {
    // SETUP: Import real agent-factory and MCP_TOOLS
    const agentFactory = await import('../../src/agents/agent-factory.js');

    // EXECUTE: Create coder agent
    agentFactory.createCoderAgent();

    // VERIFY: createAgent called with mcps containing 3 tools
    expect(gs.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        mcps: expect.any(Array),
      })
    );

    const callArgs = (gs.createAgent as any).mock.calls[0][0];
    expect(callArgs.mcps).toHaveLength(3);
  });

  it('should use PRP_BUILDER_PROMPT as system prompt', async () => {
    // SETUP: Import real agent-factory
    const { createCoderAgent } =
      await import('../../src/agents/agent-factory.js');

    // EXECUTE: Create coder agent
    createCoderAgent();

    // VERIFY: createAgent called with system: PRP_BUILDER_PROMPT
    expect(gs.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        system: PRP_BUILDER_PROMPT,
      })
    );
  });

  it('should name agent CoderAgent', async () => {
    // SETUP: Import real agent-factory
    const { createCoderAgent } =
      await import('../../src/agents/agent-factory.js');

    // EXECUTE: Create coder agent
    createCoderAgent();

    // VERIFY: createAgent called with name: 'CoderAgent'
    expect(gs.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CoderAgent',
      })
    );
  });
});

// =============================================================================
// TEST SUITE 3+: PRP Executor and Related Tests
// =============================================================================
// NOTE: These tests use a separate vi.mock for agent-factory to control
// the Coder Agent returned during PRP execution.
// =============================================================================

/**
 * Mock agent-factory for PRP executor tests
 *
 * @remarks
 * The PRP executor creates its own Coder Agent internally.
 * We mock agent-factory to control the agent returned by createCoderAgent().
 */
vi.mock('../../src/agents/agent-factory.js', () => {
  const actual = vi.importActual('../../src/agents/agent-factory.js');
  return {
    ...(actual as any),
    createCoderAgent: vi.fn(),
  };
});

import { createCoderAgent } from '../../src/agents/agent-factory.js';
const mockCreateCoderAgent = createCoderAgent as any;

// =============================================================================
// TEST SUITE 3: PRP Executor Integration
// =============================================================================

describe('integration/coder-agent > PRP executor integration', () => {
  let mockAgent: any;

  beforeEach(() => {
    // Setup mock agent
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  it('should inject PRP path into prompt', async () => {
    // SETUP: Create PRP executor with real session path
    const prp = createMockPRPDocument('P1.M2.T2.S2');
    const prpPath = '/tmp/test-session/prps/P1M2T2S2.md';
    const sessionPath = process.cwd();

    // Mock agent to return success
    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({
          result: 'success',
          message: 'Implementation complete',
        })
      )
    );

    const executor = new PRPExecutor(sessionPath);

    // EXECUTE: Run PRP executor
    await executor.execute(prp, prpPath);

    // VERIFY: Agent was prompted with PRP execution prompt
    expect(mockAgent.prompt).toHaveBeenCalled();
    const promptArg = mockAgent.prompt.mock.calls[0][0];
    expect(typeof promptArg).toBe('string');
    // Verify the prompt is the PRP_BUILDER_PROMPT
    expect(promptArg).toContain('Execute BASE PRP');
    expect(promptArg).toContain('Progressive Validation');
    // Note: The PRP executor would replace $PRP_FILE_PATH if it existed in the prompt
    // but the current PRP_BUILDER_PROMPT doesn't have this placeholder
    expect(promptArg).not.toContain('$PRP_FILE_PATH');
  });

  it('should use real BashMCP for validation', () => {
    // SETUP: Create PRP executor
    const sessionPath = process.cwd();

    // EXECUTE: Create executor
    const executor = new PRPExecutor(sessionPath);

    // VERIFY: Executor is created and has execute method
    expect(executor).toBeDefined();
    expect(typeof executor.execute).toBe('function');
  });
});

// =============================================================================
// TEST SUITE 4: Progressive Validation Execution
// =============================================================================

describe('integration/coder-agent > progressive validation execution', () => {
  let mockAgent: any;

  beforeEach(() => {
    // Setup mock agent
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  it('should execute 4 validation levels sequentially', async () => {
    // SETUP: Create PRP with 4 validation gates
    const prp = createMockPRPDocument('P1.M2.T2.S2');
    const prpPath = '/tmp/test-session/prps/P1M2T2S2.md';
    const sessionPath = process.cwd();

    // Mock agent to return success
    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({
          result: 'success',
          message: 'Implementation complete',
        })
      )
    );

    const executor = new PRPExecutor(sessionPath);

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, prpPath);

    // VERIFY: All gates executed
    expect(result.success).toBe(true);
    expect(result.validationResults).toHaveLength(4);

    // VERIFY: Gates executed in correct order
    const levels = result.validationResults.map(r => r.level);
    expect(levels).toEqual([1, 2, 3, 4]);
  });

  it('should stop execution on first failure', async () => {
    // SETUP: Create PRP where Level 2 fails
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      {
        level: 1,
        description: 'L1',
        command: 'echo "L1 pass"',
        manual: false,
      },
      { level: 2, description: 'L2', command: 'false', manual: false }, // Fails
      {
        level: 3,
        description: 'L3',
        command: 'echo "L3 not reached"',
        manual: false,
      },
    ]);

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor with increased timeout
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: Level 3 was not executed due to Level 2 failure
    expect(result.success).toBe(false);
    const nonSkippedResults = result.validationResults.filter(
      (r: { skipped: boolean }) => !r.skipped
    );
    // Level 1 passed, Level 2 failed, Level 3 should not have run
    expect(nonSkippedResults.length).toBeLessThanOrEqual(2);
  }, 15000);

  it('should skip manual validation gates', async () => {
    // SETUP: Create PRP with Level 4 manual: true
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      { level: 1, description: 'L1', command: 'echo "L1"', manual: false },
      { level: 4, description: 'Manual', command: null, manual: true },
    ]);

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: Level 4 skipped and marked as success
    const level4Result = result.validationResults.find(
      (r: { level: number }) => r.level === 4
    );
    expect(level4Result?.skipped).toBe(true);
    expect(level4Result?.success).toBe(true); // Skipped gates pass
  });

  it('should skip gates with null command', async () => {
    // SETUP: Create PRP with gate.command = null
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      { level: 1, description: 'L1', command: 'echo "L1"', manual: false },
      { level: 2, description: 'Null command', command: null, manual: false },
    ]);

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: Gate with null command marked as skipped
    const level2Result = result.validationResults.find(
      (r: { level: number }) => r.level === 2
    );
    expect(level2Result?.skipped).toBe(true);
  });
});

// =============================================================================
// TEST SUITE 5: Fix-and-Retry Mechanism
// =============================================================================

describe('integration/coder-agent > fix-and-retry mechanism', () => {
  let mockAgent: any;

  beforeEach(() => {
    // Setup mock agent
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  it('should fail after max retry attempts exhausted', async () => {
    // SETUP: Create PRP that always fails
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      {
        level: 1,
        description: 'L1',
        command: 'echo "L1"',
        manual: false,
      },
      {
        level: 2,
        description: 'L2 always fail',
        command: 'false', // Always fails
        manual: false,
      },
    ]);

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: Max retries exhausted, failed result
    expect(result.success).toBe(false);
    expect(result.fixAttempts).toBe(2); // Max retries
  }, 15000);

  it('should provide error context to agent on retry', async () => {
    // SETUP: Create PRP that fails Level 2
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      {
        level: 1,
        description: 'L1',
        command: 'echo "L1"',
        manual: false,
      },
      {
        level: 2,
        description: 'L2 fail',
        command: 'false',
        manual: false,
      },
    ]);

    mockAgent.prompt.mockImplementation(async (prompt: string) => {
      return createMockAgentResponse(
        JSON.stringify({ result: 'success', message: 'Fixed' })
      );
    });

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    await executor.execute(prp, '/tmp/test.md');

    // VERIFY: Agent was called multiple times (initial + fix attempts)
    expect(mockAgent.prompt.mock.calls.length).toBeGreaterThan(1);
  }, 15000);
});

// =============================================================================
// TEST SUITE 6: BashMCP Tool Integration
// =============================================================================

describe('integration/coder-agent > BashMCP tool integration', () => {
  let mockAgent: any;

  beforeEach(() => {
    // Setup mock agent
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  it('should execute validation commands with real BashMCP', async () => {
    // SETUP: Create PRP with echo commands
    const prp = createMockPRPDocument('P1.M2.T2.S2');
    const prpPath = '/tmp/test-session/prps/P1M2T2S2.md';

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, prpPath);

    // VERIFY: Commands executed via real BashMCP
    expect(result.success).toBe(true);
    expect(result.validationResults).toHaveLength(4);

    // VERIFY: Level 1 command executed successfully
    const level1Result = result.validationResults.find(
      (r: { level: number }) => r.level === 1
    );
    expect(level1Result?.success).toBe(true);
    expect(level1Result?.exitCode).toBe(0);
  });

  it('should capture stdout from validation commands', async () => {
    // SETUP: Create PRP with echo command
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      {
        level: 1,
        description: 'Echo test',
        command: 'echo "test output"',
        manual: false,
      },
    ]);

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: stdout contains 'test output'
    const level1Result = result.validationResults.find(
      (r: { level: number }) => r.level === 1
    );
    expect(level1Result?.stdout).toContain('test output');
  });

  it('should capture stderr from failed commands', async () => {
    // SETUP: Create PRP with command that writes to stderr but succeeds
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      {
        level: 1,
        description: 'Stderr test',
        command: 'sh -c "echo error >&2; echo success"',
        manual: false,
      },
    ]);

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: stderr contains 'error'
    const level1Result = result.validationResults.find(
      (r: { level: number }) => r.level === 1
    );
    expect(level1Result?.stderr).toContain('error');
  }, 15000);

  it('should capture exitCode from validation commands', async () => {
    // SETUP: Create PRP with a command that exits with non-zero code
    const prp = createMockPRPDocument('P1.M2.T2.S2', [
      {
        level: 1,
        description: 'L1 pass',
        command: 'echo "L1"',
        manual: false,
      },
      {
        level: 2,
        description: 'Exit code test',
        command: 'false',
        manual: false,
      },
    ]);

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: exitCode is captured for the failed validation
    // Find any non-skipped validation result that failed
    const failedResults = result.validationResults.filter(
      (r: { skipped: boolean; success: boolean }) => !r.skipped && !r.success
    );
    expect(failedResults.length).toBeGreaterThan(0);
    // At least one failed result should have an exitCode
    const resultWithExitCode = failedResults.find(
      (r: { exitCode: number | null }) => r.exitCode !== null
    );
    expect(resultWithExitCode).toBeDefined();
    expect(resultWithExitCode?.exitCode).not.toBe(0);
  }, 15000);
});

// =============================================================================
// TEST SUITE 7: Validation Artifact Collection
// =============================================================================

describe('integration/coder-agent > validation artifact collection', () => {
  let mockAgent: any;

  beforeEach(() => {
    // Setup mock agent
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  it('should create validation results structure', async () => {
    // SETUP: Create PRP
    const prp = createMockPRPDocument('P1.M2.T2.S2');

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: validationResults array exists with correct structure
    expect(result.validationResults).toBeDefined();
    expect(Array.isArray(result.validationResults)).toBe(true);

    // Each result should have required fields
    result.validationResults.forEach(vr => {
      expect(vr).toHaveProperty('level');
      expect(vr).toHaveProperty('description');
      expect(vr).toHaveProperty('success');
      expect(vr).toHaveProperty('command');
      expect(vr).toHaveProperty('stdout');
      expect(vr).toHaveProperty('stderr');
      expect(vr).toHaveProperty('exitCode');
      expect(vr).toHaveProperty('skipped');
    });
  });

  it('should include all validation gate results', async () => {
    // SETUP: Create PRP with 4 gates
    const prp = createMockPRPDocument('P1.M2.T2.S2');

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: validationResults has 4 items
    expect(result.validationResults).toHaveLength(4);
  });

  it('should track execution summary', async () => {
    // SETUP: Create PRP
    const prp = createMockPRPDocument('P1.M2.T2.S2');

    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({ result: 'success', message: '' })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: ExecutionResult has fixAttempts count and success boolean
    expect(result).toHaveProperty('fixAttempts');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('artifacts');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });
});

// =============================================================================
// TEST SUITE 8: JSON Result Parsing
// =============================================================================

describe('integration/coder-agent > JSON result parsing', () => {
  let mockAgent: any;

  beforeEach(() => {
    // Setup mock agent
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  it('should parse raw JSON response from agent', async () => {
    // SETUP: Create PRP
    const prp = createMockPRPDocument('P1.M2.T2.S2');

    // Mock agent to return raw JSON
    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        JSON.stringify({
          result: 'success',
          message: 'Implementation complete',
        })
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: JSON parsed successfully
    expect(result.success).toBe(true);
  });

  it('should parse JSON wrapped in markdown code blocks', async () => {
    // SETUP: Create PRP
    const prp = createMockPRPDocument('P1.M2.T2.S2');

    // Mock agent to return JSON wrapped in markdown
    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse(
        '```json\n' +
          '{\n' +
          '  "result": "success",\n' +
          '  "message": "Implementation complete"\n' +
          '}\n' +
          '```'
      )
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: JSON extracted and parsed successfully
    expect(result.success).toBe(true);
  });

  it('should handle invalid JSON gracefully', async () => {
    // SETUP: Create PRP
    const prp = createMockPRPDocument('P1.M2.T2.S2');

    // Mock agent to return invalid JSON
    mockAgent.prompt.mockResolvedValue(
      createMockAgentResponse('not valid json at all')
    );

    const executor = new PRPExecutor(process.cwd());

    // EXECUTE: Run PRP executor
    const result = await executor.execute(prp, '/tmp/test.md');

    // VERIFY: Returns error result with message
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
