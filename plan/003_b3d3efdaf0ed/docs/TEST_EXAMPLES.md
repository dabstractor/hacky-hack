# Test Examples

> Comprehensive, annotated test examples demonstrating all testing patterns used in the PRP Pipeline codebase. Each example includes complete, executable code with clear explanations of when to use each pattern.

**Status**: Published
**Last Updated**: 2026-01-25
**Version**: 1.0.0

## Table of Contents

- [Overview](#overview)
- [Unit Test Examples](#unit-test-examples)
  - [Utility Function Tests](#utility-function-tests)
  - [Class with Mocked Dependencies](#class-with-mocked-dependencies)
- [Integration Test Examples](#integration-test-examples)
  - [Agent with Mocked LLM](#agent-with-mocked-llm)
  - [Workflow with Mocked Components](#workflow-with-mocked-components)
- [E2E Test Examples](#e2e-test-examples)
- [Mocking Patterns Reference](#mocking-patterns-reference)
- [Test File Organization](#test-file-organization)
- [Common Test Scenarios](#common-test-scenarios)
- [See Also](#see-also)

---

## Overview

This document provides practical, executable test examples for every testing pattern used in the PRP Pipeline codebase. Each example is extracted from real test files and demonstrates:

- **Complete code** - Copy-paste ready with all imports
- **AAA pattern** - Clear ARRANGE-ACT-ASSERT comments
- **Real patterns** - Actual code from `tests/` directory
- **When to use** - Clear guidance on when each pattern applies

### Test Types Covered

| Test Type                   | Location             | Use When                                    | Speed    |
| --------------------------- | -------------------- | ------------------------------------------- | -------- |
| **Unit - Utility Function** | `tests/unit/utils/`  | Testing pure functions with no dependencies | < 1ms    |
| **Unit - Class with Mocks** | `tests/unit/core/`   | Testing classes with external dependencies  | < 1ms    |
| **Integration - Agent**     | `tests/integration/` | Testing Groundswell agent integration       | 10-50ms  |
| **Integration - Workflow**  | `tests/integration/` | Testing multi-component workflows           | 50-200ms |
| **E2E - Pipeline**          | `tests/e2e/`         | Testing complete user workflows             | 1-30s    |

---

## Unit Test Examples

### Utility Function Tests

**When to use**: Testing pure functions with no external dependencies - functions that take input and return output based solely on their inputs.

**Key patterns**:

- No mocking required (pure functions)
- Multiple test cases for edge cases
- Parameterized tests with `it.each()`
- Table-driven test approach

**Example from**: `tests/unit/utils/errors.test.ts`

```typescript
/**
 * Unit tests for Error hierarchy
 *
 * @remarks
 * Tests validate error class functionality including type guards,
 * serialization, and context sanitization.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ErrorCodes,
  PipelineErrorContext,
  PipelineError,
  SessionError,
  isSessionError,
} from '../../../src/utils/errors.js';

describe('Error hierarchy', () => {
  beforeEach(() => {
    // No state to clear for this module
  });

  afterEach(() => {
    // No cleanup needed
  });

  // ========================================================================
  // ErrorCodes constant tests
  // ========================================================================

  describe('ErrorCodes constant', () => {
    it('should export all error codes', () => {
      // ARRANGE: Error codes are defined as constants

      // ACT & ASSERT: Session errors
      expect(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED).toBe(
        'PIPELINE_SESSION_LOAD_FAILED'
      );
      expect(ErrorCodes.PIPELINE_SESSION_SAVE_FAILED).toBe(
        'PIPELINE_SESSION_SAVE_FAILED'
      );

      // ACT & ASSERT: Task errors
      expect(ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED).toBe(
        'PIPELINE_TASK_EXECUTION_FAILED'
      );
      expect(ErrorCodes.PIPELINE_TASK_VALIDATION_FAILED).toBe(
        'PIPELINE_TASK_VALIDATION_FAILED'
      );
    });

    it('should have all codes follow naming pattern', () => {
      // ARRANGE: Get all error code values
      const allCodes = Object.values(ErrorCodes);
      const pattern = /^PIPELINE_[A-Z]+_[A-Z_]+$/;

      // ACT & ASSERT: Verify naming convention
      for (const code of allCodes) {
        expect(code).toMatch(pattern);
      }
    });
  });

  // ========================================================================
  // PipelineErrorContext interface tests
  // ========================================================================

  describe('PipelineErrorContext interface', () => {
    it('should accept common context properties', () => {
      // ARRANGE: Define context with common properties
      const context: PipelineErrorContext = {
        sessionPath: '/path/to/session',
        taskId: 'P1.M1.T1',
        operation: 'loadSession',
        cause: 'File not found',
      };

      // ACT & ASSERT: Verify all properties are accessible
      expect(context.sessionPath).toBe('/path/to/session');
      expect(context.taskId).toBe('P1.M1.T1');
      expect(context.operation).toBe('loadSession');
      expect(context.cause).toBe('File not found');
    });

    it('should accept additional arbitrary properties', () => {
      // ARRANGE: Context with custom fields
      const context: PipelineErrorContext = {
        customField: 'custom value',
        attempt: 3,
        maxAttempts: 5,
        success: false,
      };

      // ACT & ASSERT: Custom properties are preserved
      expect(context.customField).toBe('custom value');
      expect(context.attempt).toBe(3);
      expect(context.maxAttempts).toBe(5);
      expect(context.success).toBe(false);
    });
  });

  // ========================================================================
  // SessionError class tests
  // ========================================================================

  describe('SessionError class', () => {
    it('should create SessionError with message only', () => {
      // ARRANGE: Error message
      const errorMessage = 'Session load failed';

      // ACT: Create error instance
      const error = new SessionError(errorMessage);

      // ASSERT: Verify error properties
      expect(error instanceof SessionError).toBe(true);
      expect(error.message).toBe(errorMessage);
    });

    it('should have correct error code', () => {
      // ARRANGE: Create error
      const error = new SessionError('Test error');

      // ACT & ASSERT: Verify error code
      expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
    });

    it('should accept context', () => {
      // ARRANGE: Context object
      const context: PipelineErrorContext = {
        sessionPath: '/path/to/session',
        taskId: 'P1.M1.T1',
      };

      // ACT: Create error with context
      const error = new SessionError('Test error', context);

      // ASSERT: Context is preserved
      expect(error.context).toEqual(context);
    });
  });

  // ========================================================================
  // Type guard tests (parameterized)
  // ========================================================================

  describe('isSessionError type guard', () => {
    it.each([
      ['SessionError instance', new SessionError('Test'), true],
      ['plain Error', new Error('Test'), false],
      ['null', null, false],
      ['undefined', undefined, false],
      ['string', 'error', false],
      ['number', 123, false],
      ['object', {}, false],
      ['array', [], false],
    ])('should return %s for %s', (description, value, expected) => {
      // ARRANGE: Test value from parameterized cases

      // ACT: Run type guard
      const result = isSessionError(value);

      // ASSERT: Verify result matches expectation
      expect(result).toBe(expected);
    });
  });

  // ========================================================================
  // Context sanitization tests
  // ========================================================================

  describe('Context sanitization', () => {
    const sensitiveFields = [
      'apiKey',
      'token',
      'password',
      'secret',
      'authorization',
      'email',
    ];

    it.each(sensitiveFields)('should redact %s field', field => {
      // ARRANGE: Create error with sensitive field
      const error = new SessionError('Test error', {
        [field]: `secret-${field}-value`,
      });

      // ACT: Serialize to JSON
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      // ASSERT: Sensitive field is redacted
      expect(context?.[field]).toBe('[REDACTED]');
    });

    it('should not redact non-sensitive fields', () => {
      // ARRANGE: Error with safe fields
      const error = new SessionError('Test error', {
        taskId: 'P1.M1.T1',
        sessionPath: '/path/to/session',
        operation: 'loadSession',
        attempt: 3,
      });

      // ACT: Serialize to JSON
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      // ASSERT: Safe fields are preserved
      expect(context?.taskId).toBe('P1.M1.T1');
      expect(context?.sessionPath).toBe('/path/to/session');
      expect(context?.operation).toBe('loadSession');
      expect(context?.attempt).toBe(3);
    });
  });
});
```

**Explanation**: This example demonstrates:

- **Pure function testing** - No mocks needed, testing input/output behavior
- **Multiple test cases** - Covers happy paths, edge cases, and error conditions
- **Parameterized tests** - `it.each()` for testing multiple inputs with same logic
- **Type guard testing** - Verifying type narrowing functions work correctly
- **Data-driven tests** - Table-based approach for sensitive field redaction

**See also**: `tests/unit/utils/errors.test.ts:1-1074` for the complete test file.

---

### Class with Mocked Dependencies

**When to use**: Testing classes that depend on external modules (file system, network, databases). Mock all dependencies to test the class in isolation.

**Key patterns**:

- Mock external modules at top level before imports
- Use `vi.mocked()` for type-safe mock access
- Set up mock return values in `beforeEach`
- Clear mocks in `afterEach` for test isolation

**Example from**: `tests/unit/core/session-manager.test.ts`

```typescript
/**
 * Unit tests for SessionManager class
 *
 * @remarks
 * Tests validate SessionManager class with 100% coverage.
 * Mocks are used for all file system, crypto, and session-utils operations.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SessionManager } from '../../../src/core/session-manager.js';
import {
  hashPRD,
  createSessionDirectory,
  readTasksJSON,
  writeTasksJSON,
  SessionFileError,
} from '../../../src/core/session-utils.js';
import {
  updateItemStatus as updateItemStatusUtil,
  findItem,
} from '../../../src/utils/task-utils.js';
import { PRDValidator } from '../../../src/utils/prd-validator.js';
import { ValidationError } from '../../../src/utils/errors.js';
import type { Backlog } from '../../../src/core/models.js';
import { Status } from '../../../src/core/models.js';

// =============================================================================
// MOCK PATTERN: Mock dependencies at top level before imports
// =============================================================================

// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Mock the node:fs module for synchronous operations
vi.mock('node:fs', () => ({
  statSync: vi.fn(),
  readdir: vi.fn(),
}));

// Mock the session-utils module
vi.mock('../../../src/core/session-utils.js', () => ({
  hashPRD: vi.fn(),
  createSessionDirectory: vi.fn(),
  readTasksJSON: vi.fn(),
  writeTasksJSON: vi.fn(),
  SessionFileError: class extends Error {
    readonly path: string;
    constructor(message: string, path: string) {
      super(message);
      this.name = 'SessionFileError';
      this.path = path;
    }
  },
}));

// Mock task-utils module
vi.mock('../../../src/utils/task-utils.js', () => ({
  updateItemStatus: vi.fn(),
  findItem: vi.fn(),
}));

// Mock PRD validator
vi.mock('../../../src/utils/prd-validator.js', () => ({
  PRDValidator: {
    validate: vi.fn(),
  },
}));

// =============================================================================
// IMPORT MOCKED MODULES
// =============================================================================

import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { statSync, readdir as readdirSync } from 'node:fs';

// =============================================================================
// TEST FIXTURES: Reusable test data
// =============================================================================

const mockBacklog: Backlog = {
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Test Phase',
      status: 'Planned' as Status,
      description: 'Test description',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Test Milestone',
          status: 'Planned' as Status,
          description: 'Test',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Test Task',
              status: 'Planned' as Status,
              description: 'Test',
              subtasks: [],
            },
          ],
        },
      ],
    },
  ],
};

const mockPRDHash = 'abc123def456';
const mockSessionPath = '/path/to/session/abc123def456';

// =============================================================================
// TEST SUITES
// =============================================================================

describe('SessionManager', () => {
  // CLEANUP: Clear mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Constructor tests
  // ========================================================================

  describe('constructor', () => {
    it('should create session with correct properties', () => {
      // ARRANGE: Mock hashPRD to return hash
      vi.mocked(hashPRD).mockReturnValue(mockPRDHash);

      // ARRANGE: Mock createSessionDirectory to return path
      vi.mocked(createSessionDirectory).mockReturnValue(mockSessionPath);

      // ACT: Create SessionManager instance
      const manager = new SessionManager(
        '/path/to/PRD.md',
        'PRD content',
        mockBacklog
      );

      // ASSERT: Verify properties
      expect(manager.prdPath).toBe('/path/to/PRD.md');
      expect(manager.prdContent).toBe('PRD content');
      expect(manager.backlog).toEqual(mockBacklog);
      expect(manager.prdHash).toBe(mockPRDHash);
      expect(manager.sessionPath).toBe(mockSessionPath);
    });

    it('should call hashPRD with PRD content', () => {
      // ARRANGE: Setup mock
      vi.mocked(hashPRD).mockReturnValue(mockPRDHash);
      vi.mocked(createSessionDirectory).mockReturnValue(mockSessionPath);

      // ACT: Create manager
      const prdContent = 'Test PRD content';
      new SessionManager('/path/to/PRD.md', prdContent, mockBacklog);

      // ASSERT: Verify hashPRD was called
      expect(hashPRD).toHaveBeenCalledWith(prdContent);
    });

    it('should call createSessionDirectory with hash', () => {
      // ARRANGE: Setup mock
      vi.mocked(hashPRD).mockReturnValue(mockPRDHash);
      vi.mocked(createSessionDirectory).mockReturnValue(mockSessionPath);

      // ACT: Create manager
      new SessionManager('/path/to/PRD.md', 'PRD content', mockBacklog);

      // ASSERT: Verify createSessionDirectory was called
      expect(createSessionDirectory).toHaveBeenCalledWith(mockPRDHash);
    });
  });

  // ========================================================================
  // saveSession() tests
  // ========================================================================

  describe('saveSession', () => {
    it('should write PRD snapshot and tasks JSON', async () => {
      // ARRANGE: Setup mocks
      vi.mocked(hashPRD).mockReturnValue(mockPRDHash);
      vi.mocked(createSessionDirectory).mockReturnValue(mockSessionPath);
      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(writeTasksJSON).mockResolvedValue(undefined);

      // ARRANGE: Create manager
      const manager = new SessionManager(
        '/path/to/PRD.md',
        'PRD content',
        mockBacklog
      );

      // ACT: Save session
      await manager.saveSession();

      // ASSERT: Verify PRD snapshot was written
      expect(writeFile).toHaveBeenCalledWith(
        `${mockSessionPath}/prd_snapshot.md`,
        'PRD content'
      );

      // ASSERT: Verify tasks JSON was written
      expect(writeTasksJSON).toHaveBeenCalledWith(mockSessionPath, mockBacklog);
    });

    it('should propagate errors from writeFile', async () => {
      // ARRANGE: Setup mocks with error
      vi.mocked(hashPRD).mockReturnValue(mockPRDHash);
      vi.mocked(createSessionDirectory).mockReturnValue(mockSessionPath);
      vi.mocked(writeFile).mockRejectedValue(new Error('Write failed'));

      // ARRANGE: Create manager
      const manager = new SessionManager(
        '/path/to/PRD.md',
        'PRD content',
        mockBacklog
      );

      // ACT & ASSERT: Should throw error
      await expect(manager.saveSession()).rejects.toThrow('Write failed');
    });
  });

  // ========================================================================
  // loadSession() tests
  // ========================================================================

  describe('loadSession', () => {
    it('should read existing session from directory', async () => {
      // ARRANGE: Setup mocks
      vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as any);
      vi.mocked(readFile).mockResolvedValue(
        Buffer.from('PRD content from file')
      );
      vi.mocked(readTasksJSON).mockResolvedValue(mockBacklog);

      // ACT: Load session
      const manager = await SessionManager.loadSession(mockSessionPath);

      // ASSERT: Verify manager properties
      expect(manager.sessionPath).toBe(mockSessionPath);
      expect(manager.prdContent).toBe('PRD content from file');
      expect(manager.backlog).toEqual(mockBacklog);
    });

    it('should throw SessionFileError if directory does not exist', async () => {
      // ARRANGE: Mock stat to throw error
      vi.mocked(stat).mockRejectedValue(new Error('Not found'));

      // ACT & ASSERT: Should throw SessionFileError
      await expect(
        SessionManager.loadSession('/nonexistent/path')
      ).rejects.toThrow(SessionFileError);
    });
  });

  // ========================================================================
  // updateItemStatus() tests
  // ========================================================================

  describe('updateItemStatus', () => {
    it('should update status and save session', async () => {
      // ARRANGE: Setup mocks
      vi.mocked(hashPRD).mockReturnValue(mockPRDHash);
      vi.mocked(createSessionDirectory).mockReturnValue(mockSessionPath);
      vi.mocked(updateItemStatusUtil).mockReturnValue(mockBacklog);
      vi.mocked(writeTasksJSON).mockResolvedValue(undefined);

      // ARRANGE: Create manager
      const manager = new SessionManager(
        '/path/to/PRD.md',
        'PRD content',
        mockBacklog
      );

      // ACT: Update item status
      await manager.updateItemStatus('P1.M1.T1', 'Complete');

      // ASSERT: Verify updateItemStatusUtil was called
      expect(updateItemStatusUtil).toHaveBeenCalledWith(
        mockBacklog,
        'P1.M1.T1',
        'Complete'
      );

      // ASSERT: Verify session was saved
      expect(writeTasksJSON).toHaveBeenCalledWith(mockSessionPath, mockBacklog);
    });
  });
});
```

**Explanation**: This example demonstrates:

- **Module-level mocking** - All mocks declared before imports
- **Type-safe mocks** - `vi.mocked()` provides TypeScript inference
- **Mock factories** - Reusable test data fixtures
- **Dependency injection verification** - Confirming mocks are called correctly
- **Error propagation** - Testing how errors flow through the class

**See also**: `tests/unit/core/session-manager.test.ts` for the complete test file.

---

## Integration Test Examples

### Agent with Mocked LLM

**When to use**: Testing Groundswell agent integration. The agent creates real configurations but mocks the LLM API calls.

**Key patterns**:

- **CRITICAL**: Use `vi.importActual()` to preserve Groundswell exports
- Mock `createAgent` and `createPrompt` but preserve `MCPHandler`, `MCPServer`
- Verify agent configuration is correct
- Test prompt generation with schemas

**Example from**: `tests/integration/agents.test.ts`

```typescript
/**
 * Integration tests for agent factory and prompt generators
 *
 * @remarks
 * Tests validate the complete flow: agent factory → Groundswell agents → Prompt generators
 * Mocks Groundswell dependencies to prevent real LLM calls and MCP server registration issues.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// MOCK PATTERN: Groundswell createAgent and createPrompt
// =============================================================================

// Pattern: Mock at top level before imports (hoisting required by vi.mock)
// CRITICAL: Use importActual to preserve MCPHandler and other exports needed by MCP tools
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual, // PRESERVE non-mocked exports (MCPHandler, MCPServer)
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import after mocking - get mocked versions
import { createAgent, createPrompt } from 'groundswell';

// Import agent factory functions and system prompts
import {
  createBaseConfig,
  createArchitectAgent,
  createResearcherAgent,
  createCoderAgent,
  createQAAgent,
} from '../../src/agents/agent-factory.js';
import {
  TASK_BREAKDOWN_PROMPT,
  PRP_BLUEPRINT_PROMPT,
  PRP_BUILDER_PROMPT,
  BUG_HUNT_PROMPT,
} from '../../src/agents/prompts.js';

// Import prompt generator functions
import { createArchitectPrompt } from '../../src/agents/prompts/architect-prompt.js';
import { createPRPBlueprintPrompt } from '../../src/agents/prompts/prp-blueprint-prompt.js';
import { createBugHuntPrompt } from '../../src/agents/prompts/bug-hunt-prompt.js';

// Import types and schemas for validation
import type {
  Backlog,
  PRPDocument,
  TestResults,
  DeltaAnalysis,
} from '../../src/core/models.js';
import type { Task, Subtask } from '../../src/core/models.js';
import {
  BacklogSchema,
  PRPDocumentSchema,
  TestResultsSchema,
  DeltaAnalysisSchema,
} from '../../src/core/models.js';

// =============================================================================
// MOCK FIXTURES: Reusable test data
// =============================================================================

// Mock Agent with prompt method (pattern from architect-agent.test.ts)
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

// Setup createAgent to return mock agent
vi.mocked(createAgent).mockReturnValue(mockAgent as never);

// Setup createPrompt to return mock prompt
vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);

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

// =============================================================================
// TEST SUITE: createBaseConfig() Environment Variable Mapping
// =============================================================================

describe('createBaseConfig', () => {
  // CLEANUP: Restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY', () => {
    // SETUP: Set environment variables
    // Note: configureEnvironment() runs at module load time, mapping AUTH_TOKEN -> API_KEY.
    // Since it already ran, we stub API_KEY directly to test createBaseConfig reads it correctly.
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token-123');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    const config = createBaseConfig('architect');

    // VERIFY: Environment mapping is correct
    expect(config.env.ANTHROPIC_API_KEY).toBe('test-token-123');
    expect(config.env.ANTHROPIC_BASE_URL).toBe(
      'https://api.z.ai/api/anthropic'
    );
  });

  it('should include all required AgentConfig properties', () => {
    // SETUP
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    const config = createBaseConfig('architect');

    // VERIFY: All required properties exist
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('system');
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('enableCache');
    expect(config).toHaveProperty('enableReflection');
    expect(config).toHaveProperty('maxTokens');
    expect(config).toHaveProperty('env');
  });

  it('should set persona-specific token limits', () => {
    // SETUP
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE & VERIFY: Architect gets 8192 tokens
    expect(createBaseConfig('architect').maxTokens).toBe(8192);

    // EXECUTE & VERIFY: Other personas get 4096 tokens
    expect(createBaseConfig('researcher').maxTokens).toBe(4096);
    expect(createBaseConfig('coder').maxTokens).toBe(4096);
    expect(createBaseConfig('qa').maxTokens).toBe(4096);
  });

  it('should generate correct agent names from personas', () => {
    // SETUP
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE & VERIFY: Agent names follow Persona → PersonaAgent pattern
    expect(createBaseConfig('architect').name).toBe('ArchitectAgent');
    expect(createBaseConfig('researcher').name).toBe('ResearcherAgent');
    expect(createBaseConfig('coder').name).toBe('CoderAgent');
    expect(createBaseConfig('qa').name).toBe('QaAgent');
  });
});

// =============================================================================
// TEST SUITE: Agent Creators Use Correct System Prompts
// =============================================================================

describe('createArchitectAgent', () => {
  // CLEANUP: Clear mock calls after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create architect agent with TASK_BREAKDOWN_PROMPT', () => {
    // SETUP: Stub environment variables
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    const agent = createArchitectAgent();

    // VERIFY: createAgent was called with correct config
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ArchitectAgent',
        system: TASK_BREAKDOWN_PROMPT,
        maxTokens: 8192,
        model: 'GLM-4.7',
        enableCache: true,
        enableReflection: true,
      })
    );

    // VERIFY: Agent has prompt method
    expect(agent.prompt).toBeDefined();
  });

  it('should include MCP tools in architect agent config', () => {
    // SETUP
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    createArchitectAgent();

    // VERIFY: mcps parameter was passed
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        mcps: expect.any(Array),
      })
    );
  });
});

describe('createResearcherAgent', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create researcher agent with PRP_BLUEPRINT_PROMPT', () => {
    // SETUP
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    const agent = createResearcherAgent();

    // VERIFY: createAgent was called with correct config
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ResearcherAgent',
        system: PRP_BLUEPRINT_PROMPT,
        maxTokens: 4096,
        model: 'GLM-4.7',
        enableCache: true,
        enableReflection: true,
      })
    );

    // VERIFY: Agent has prompt method
    expect(agent.prompt).toBeDefined();
  });

  it('should include MCP tools in researcher agent config', () => {
    // SETUP
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    // EXECUTE
    createResearcherAgent();

    // VERIFY: mcps parameter was passed
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        mcps: expect.any(Array),
      })
    );
  });
});

// =============================================================================
// TEST SUITE: Prompt Generators Return Correct Prompt<T> Types
// =============================================================================

describe('createArchitectPrompt', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create architect prompt with BacklogSchema', () => {
    // SETUP
    const prdContent = '# Test PRD\n\nThis is a test.';

    // EXECUTE
    const prompt = createArchitectPrompt(prdContent);

    // VERIFY: createPrompt was called with correct config
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: prdContent,
        system: TASK_BREAKDOWN_PROMPT,
        responseFormat: BacklogSchema,
        enableReflection: true,
      })
    );

    // NOTE: TypeScript generic type Prompt<Backlog> is compile-time only
    // Runtime tests validate createPrompt was called with correct schema
  });
});

describe('createPRPBlueprintPrompt', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create PRP blueprint prompt with PRPDocumentSchema', () => {
    // SETUP: Create test task and backlog
    const task: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: 'Test context scope',
    };

    const backlog: Backlog = {
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
                  subtasks: [task],
                },
              ],
            },
          ],
        },
      ],
    };

    // EXECUTE
    const prompt = createPRPBlueprintPrompt(task, backlog, '/test/path');

    // VERIFY: createPrompt was called with correct config
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining(task.title),
        system: PRP_BLUEPRINT_PROMPT,
        responseFormat: PRPDocumentSchema,
        enableReflection: true,
      })
    );
  });

  it('should include codebase path in user prompt when provided', () => {
    // SETUP
    const codebasePath = '/home/dustin/projects/hacky-hack';
    const prompt = createPRPBlueprintPrompt(
      mockSubtask,
      mockBacklog,
      codebasePath
    );

    // VERIFY: User prompt contains codebase path
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining(codebasePath),
      })
    );
  });
});

describe('createBugHuntPrompt', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create bug hunt prompt with TestResultsSchema', () => {
    // SETUP
    const prd = '# Test PRD';
    const completedTasks: Task[] = [
      {
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Test Task',
        status: 'Complete',
        description: 'Test',
        subtasks: [],
      },
    ];

    // EXECUTE
    const prompt = createBugHuntPrompt(prd, completedTasks);

    // VERIFY: createPrompt was called with correct config
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining(prd),
        system: BUG_HUNT_PROMPT,
        responseFormat: TestResultsSchema,
        enableReflection: true,
      })
    );
  });

  it('should include completed tasks in user prompt', () => {
    // SETUP
    const prd = '# Test PRD';
    const completedTasks: Task[] = [
      {
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Completed Task 1',
        status: 'Complete',
        description: 'First completed task',
        subtasks: [],
      },
      {
        id: 'P1.M1.T2',
        type: 'Task',
        title: 'Completed Task 2',
        status: 'Complete',
        description: 'Second completed task',
        subtasks: [],
      },
    ];

    // EXECUTE
    const prompt = createBugHuntPrompt(prd, completedTasks);

    // VERIFY: User prompt contains completed task IDs
    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining('P1.M1.T1'),
      })
    );

    expect(createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining('P1.M1.T2'),
      })
    );
  });
});
```

**Explanation**: This example demonstrates:

- **Groundswell mocking pattern** - The most critical pattern in the codebase
- **Preserving exports** - `vi.importActual()` ensures MCP tools work
- **Schema validation** - Testing Zod schemas are passed correctly
- **Environment setup** - Proper `vi.stubEnv()` usage with cleanup

**GOTCHA**: If you don't use `vi.importActual()` when mocking Groundswell, you'll get "MCP server 'undefined' is already registered" errors because `MCPHandler` and `MCPServer` are not preserved.

**See also**: `tests/integration/agents.test.ts:1-682` for the complete test file.

---

### Workflow with Mocked Components

**When to use**: Testing multi-component workflows where multiple services interact. Use real implementations of workflow classes but mock external dependencies.

**Key patterns**:

- Mock external dependencies (agents, prompts)
- Use real workflow implementations
- Test component interaction
- Verify error propagation

**Example from**: `tests/integration/bug-hunt-workflow-integration.test.ts`

```typescript
/**
 * Integration tests for BugHuntWorkflow class
 *
 * @remarks
 * Tests validate end-to-end BugHuntWorkflow workflow execution.
 * Agent calls are mocked to avoid LLM dependencies while preserving
 * full workflow orchestration testing.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BugHuntWorkflow } from '../../src/workflows/bug-hunt-workflow.js';
import type { Task, TestResults, Bug } from '../../src/core/models.js';

// =============================================================================
// MOCK PATTERN: Mock agent factory to avoid LLM calls
// =============================================================================

vi.mock('../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));

// Mock bug hunt prompt
vi.mock('../../src/agents/prompts/bug-hunt-prompt.js', () => ({
  createBugHuntPrompt: vi.fn(),
}));

// =============================================================================
// IMPORT MOCKED MODULES
// =============================================================================

import { createQAAgent } from '../../src/agents/agent-factory.js';
import { createBugHuntPrompt } from '../../src/agents/prompts/bug-hunt-prompt.js';

// Cast mocked functions for type-safe access
const mockCreateQAAgent = createQAAgent as any;
const mockCreateBugHuntPrompt = createBugHuntPrompt as any;

// =============================================================================
// TEST FIXTURES: Factory functions for test data
// =============================================================================

const createTestTask = (
  id: string,
  title: string,
  description?: string
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Complete',
  description: description ?? `Description for ${title}`,
  subtasks: [],
});

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

// =============================================================================
// TEST SUITES
// =============================================================================

describe('BugHuntWorkflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    mockCreateQAAgent.mockReturnValue({
      prompt: vi.fn(),
    });
    mockCreateBugHuntPrompt.mockReturnValue({});
  });

  // ========================================================================
  // Full workflow execution tests
  // ========================================================================

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

      // EXECUTE: Run workflow
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      const results = await workflow.run();

      // VERIFY: Results match expected
      expect(results).toEqual(expectedResults);
      expect(results.hasBugs).toBe(false);
      expect(results.bugs).toHaveLength(0);
      expect(results.summary).toBe('All tests passed successfully');
      expect(results.recommendations).toEqual([]);

      // Verify workflow status
      expect(workflow.testResults).toEqual(expectedResults);
    });

    it('should complete workflow successfully with bugs found', async () => {
      // SETUP
      const prdContent =
        '# Test PRD\n\n## Requirements\nBuild a login feature.';
      const completedTasks = [
        createTestTask('P1.M1.T1', 'Setup Project'),
        createTestTask('P1.M2.T1', 'Implement Login'),
      ];
      const expectedResults = createTestResults(
        true,
        [
          createTestBug(
            'BUG-001',
            'critical',
            'Login fails with empty password',
            'Authentication throws unhandled exception',
            '1. Navigate to /login\n2. Leave password empty\n3. Click Submit',
            'src/services/auth.ts:45'
          ),
          createTestBug(
            'BUG-002',
            'major',
            'No input validation',
            'Username accepts special characters',
            '1. Navigate to /login\n2. Enter special chars in username\n3. Observe validation passes',
            'src/components/LoginForm.tsx:23'
          ),
        ],
        'Found 2 bugs during testing: 1 critical, 1 major',
        ['Add password validation', 'Add username character validation']
      );

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
      expect(results.hasBugs).toBe(true);
      expect(results.bugs).toHaveLength(2);
      expect(results.bugs[0].severity).toBe('critical');
      expect(results.bugs[1].severity).toBe('major');
      expect(workflow.testResults).toEqual(expectedResults);
    });

    it('should execute all phases in correct order', async () => {
      // SETUP
      const prdContent = '# PRD';
      const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
      const expectedResults = createTestResults(false, [], 'OK', []);

      const callOrder: string[] = [];
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResults),
      };

      // Track call order
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
  });

  // ========================================================================
  // TestResults with various bug scenarios
  // ========================================================================

  describe('TestResults with various bug scenarios', () => {
    it('should handle TestResults with all severity levels', async () => {
      // SETUP
      const prdContent = '# PRD';
      const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
      const expectedResults = createTestResults(
        true,
        [
          createTestBug('BUG-001', 'critical', 'Critical Bug', 'Desc', 'Rep'),
          createTestBug('BUG-002', 'major', 'Major Bug', 'Desc', 'Rep'),
          createTestBug('BUG-003', 'minor', 'Minor Bug', 'Desc', 'Rep'),
          createTestBug('BUG-004', 'cosmetic', 'Cosmetic Bug', 'Desc', 'Rep'),
        ],
        'Found bugs at all severity levels',
        ['Fix critical', 'Fix major', 'Fix minor', 'Fix cosmetic']
      );

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResults),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      const results = await workflow.run();

      // VERIFY: All severity levels present
      expect(results.bugs).toHaveLength(4);
      expect(results.bugs.filter(b => b.severity === 'critical')).toHaveLength(
        1
      );
      expect(results.bugs.filter(b => b.severity === 'major')).toHaveLength(1);
      expect(results.bugs.filter(b => b.severity === 'minor')).toHaveLength(1);
      expect(results.bugs.filter(b => b.severity === 'cosmetic')).toHaveLength(
        1
      );
    });

    it('should handle TestResults with only minor and cosmetic bugs', async () => {
      // SETUP
      const prdContent = '# PRD';
      const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
      const expectedResults = createTestResults(
        false, // hasBugs false because no critical/major
        [
          createTestBug('BUG-001', 'minor', 'Minor Bug', 'Desc', 'Rep'),
          createTestBug('BUG-002', 'cosmetic', 'Cosmetic Bug', 'Desc', 'Rep'),
        ],
        'Found minor and cosmetic issues',
        ['Fix minor', 'Fix cosmetic']
      );

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResults),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      const results = await workflow.run();

      // VERIFY
      expect(results.hasBugs).toBe(false);
      expect(results.bugs).toHaveLength(2);
    });
  });

  // ========================================================================
  // Error handling and recovery
  // ========================================================================

  describe('error handling and recovery', () => {
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

      // EXECUTE & VERIFY: Error should propagate
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      await expect(workflow.run()).rejects.toThrow('QA agent API timeout');

      // Verify workflow status is failed
      expect(workflow.status).toBe('failed');
    });

    it('should preserve state after error', async () => {
      // SETUP
      const prdContent = '# PRD';
      const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(new Error('Error')),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      try {
        await workflow.run();
      } catch {
        // Expected error
      }

      // VERIFY - state preserved
      expect(workflow.prdContent).toBe(prdContent);
      expect(workflow.completedTasks).toEqual(completedTasks);
    });
  });

  // ========================================================================
  // Workflow observability
  // ========================================================================

  describe('workflow observability', () => {
    it('should update testResults after run', async () => {
      // SETUP
      const prdContent = '# PRD';
      const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
      const expectedResults = createTestResults(
        true,
        [createTestBug('BUG-001', 'major', 'Bug', 'Desc', 'Rep')],
        'Found bugs',
        ['Fix']
      );

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResults),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);
      expect(workflow.testResults).toBeNull();

      await workflow.run();

      // VERIFY
      expect(workflow.testResults).toEqual(expectedResults);
    });

    it('should transition status through lifecycle', async () => {
      // SETUP
      const prdContent = '# PRD';
      const completedTasks = [createTestTask('P1.M1.T1', 'Task')];
      const expectedResults = createTestResults(false, [], 'OK', []);

      const mockAgent = {
        prompt: vi.fn().mockResolvedValue(expectedResults),
      };
      mockCreateQAAgent.mockReturnValue(mockAgent);
      mockCreateBugHuntPrompt.mockReturnValue({});

      // EXECUTE
      const workflow = new BugHuntWorkflow(prdContent, completedTasks);

      // Initial status
      expect(workflow.status).toBe('idle');

      await workflow.run();

      // Final status
      expect(workflow.status).toBe('completed');
    });
  });
});
```

**Explanation**: This example demonstrates:

- **Multi-component testing** - Workflow orchestrates multiple mocked components
- **Factory functions** - Reusable test data creation
- **Call order verification** - Ensuring components interact in the right sequence
- **State preservation** - Verifying workflow state after errors
- **Lifecycle testing** - Status transitions through workflow execution

**See also**: `tests/integration/bug-hunt-workflow-integration.test.ts:1-522` for the complete test file.

---

## E2E Test Examples

### Full Pipeline E2E Tests

**When to use**: Validating complete end-to-end workflows from start to finish. Use minimal mocking (only external services) and real implementations for core logic.

**Key patterns**:

- Real implementations with mocked external services
- Temporary file system for isolation
- Real timers for async operations
- Multi-level assertions (structure, filesystem, content, behavior)
- Performance thresholds

**Example from**: `tests/e2e/pipeline.test.ts`

```typescript
/**
 * End-to-end tests for PRPPipeline workflow
 *
 * @remarks
 * Tests validate complete PRPPipeline workflow with all dependencies mocked:
 * - LLM agents (Architect, Researcher, Coder) return predefined responses
 * - MCP tools (Bash, Filesystem, Git) return success
 * - Temporary directories are created and cleaned up for each test
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// =============================================================================
// MOCK PATTERN: Module-level mocking with hoisting
// =============================================================================

// Mock groundswell for createAgent, createPrompt
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Mock agent factory
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createResearcherAgent: vi.fn(),
  createCoderAgent: vi.fn(),
}));

// Mock fs/promises for file operations - only mock readFile, let others work
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

// Mock node:fs for existsSync, realpathSync, mkdtempSync, rmSync
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    realpathSync: vi.fn((path: unknown) => path as string),
  };
});

// Mock child_process for BashMCP
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock simple-git for GitMCP
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));

// =============================================================================
// IMPORT MOCKED MODULES
// =============================================================================

import { createAgent, createPrompt } from 'groundswell';
import { spawn } from 'node:child_process';
import {
  createArchitectAgent,
  createResearcherAgent,
  createCoderAgent,
} from '../../src/agents/agent-factory.js';
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';
import { mockSimplePRD } from '../fixtures/simple-prd.js';
import type { Backlog, Status } from '../../src/core/models.js';

// =============================================================================
// MOCK FIXTURES
// =============================================================================

// Mock Agent with prompt method
const mockAgent = {
  prompt: vi.fn(),
};

// Mock Prompt object
const mockPrompt = {
  user: '',
  system: '',
  responseFormat: {},
  enableReflection: true,
};

// Setup createAgent to return mock agent
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);

// Mock git instance
const mockGitInstance = {
  status: vi.fn().mockResolvedValue({
    current: 'main',
    files: [],
    is_clean: () => true,
  }),
  diff: vi.fn().mockResolvedValue(''),
  add: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue({
    commit: 'abc123',
    branch: 'main',
  }),
};

// =============================================================================
// MOCK FACTORY: createMockChild for ChildProcess
// =============================================================================

function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {},
  mockTimeouts: NodeJS.Timeout[] = []
) {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          const id = setTimeout(() => callback(Buffer.from(stdout)), 5);
          if (mockTimeouts) {
            mockTimeouts.push(id);
          }
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          const id = setTimeout(() => callback(Buffer.from(stderr)), 5);
          if (mockTimeouts) {
            mockTimeouts.push(id);
          }
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        const id = setTimeout(() => callback(exitCode), 10);
        if (mockTimeouts) {
          mockTimeouts.push(id);
        }
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as import('node:child_process').ChildProcess;
}

// =============================================================================
// MOCK FACTORY: createMockBacklog
// =============================================================================

function createMockBacklog(): Backlog {
  return {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        title: 'Test Phase',
        status: 'Complete' as Status,
        description: 'Validate pipeline functionality with minimal complexity',
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Test Milestone',
            status: 'Complete' as Status,
            description: 'Create a simple hello world implementation',
            tasks: [
              {
                id: 'P1.M1.T1',
                type: 'Task',
                title: 'Create Hello World',
                status: 'Complete' as Status,
                description:
                  'Implement a basic hello world function with tests',
                subtasks: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

// =============================================================================
// TEST SUITE: E2E Pipeline Tests
// =============================================================================

describe('E2E Pipeline Tests', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;
  let mockTimeouts: NodeJS.Timeout[] = [];

  beforeEach(() => {
    // Clear mock timeouts array
    mockTimeouts = [];

    // Clear all mocks
    vi.clearAllMocks();

    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'e2e-pipeline-test-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');

    // Write PRD file
    writeFileSync(prdPath, mockSimplePRD);

    // Setup agent mocks
    vi.mocked(createArchitectAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createResearcherAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createCoderAgent).mockReturnValue(mockAgent as never);

    // Setup agent prompt to return backlog (no subtask execution)
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklog() });

    // Setup readFile mock to return Buffer objects (not strings)
    // This matches production behavior where readFile(path) returns Buffer,
    // which is required by TextDecoder.decode() in readUTF8FileStrict()
    vi.mocked(readFile).mockImplementation(path => {
      const pathStr = String(path);
      if (pathStr.includes('tasks.json')) {
        return Promise.resolve(
          Buffer.from(JSON.stringify(createMockBacklog()), 'utf-8')
        );
      }
      if (pathStr.includes('PRD.md')) {
        return Promise.resolve(Buffer.from(mockSimplePRD, 'utf-8'));
      }
      return Promise.resolve(Buffer.from('', 'utf-8'));
    });

    // Setup existsSync mock
    vi.mocked(existsSync).mockReturnValue(true);

    // Setup spawn mock for BashMCP
    vi.mocked(spawn).mockReturnValue(
      createMockChild({ stdout: '', exitCode: 0 }, mockTimeouts) as never
    );

    // CRITICAL: Use real timers for async mock behavior
    vi.useRealTimers();
  });

  afterEach(() => {
    // Clean up mock timeouts to prevent dangling promises
    mockTimeouts.forEach(clearTimeout);
    mockTimeouts = [];

    // Cleanup temp directory
    rmSync(tempDir, { recursive: true, force: true });

    // Restore fake timers
    vi.useFakeTimers();
  });

  // =============================================================================
  // TEST: Full Pipeline Workflow
  // =============================================================================

  it('should complete full pipeline workflow successfully', async () => {
    // ARRANGE: All mocks configured in beforeEach

    // ACT: Run pipeline
    const start = performance.now();
    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );
    const result = await pipeline.run();
    const duration = performance.now() - start;

    // ASSERT: Verify result structure
    expect(result.success).toBe(true);
    expect(result.sessionPath).toBeDefined();
    expect(result.totalTasks).toBe(0); // Empty subtask array
    expect(result.completedTasks).toBe(0);
    expect(result.failedTasks).toBe(0);
    // With 0 subtasks, QA may fail (no completed tasks to test) - accept qa_failed or qa_complete
    expect(['qa_complete', 'qa_failed']).toContain(result.finalPhase);
    expect(result.bugsFound).toBe(0);
    expect(duration).toBeLessThan(30000); // <30 seconds

    // ASSERT: Verify session directory exists
    expect(existsSync(result.sessionPath)).toBe(true);

    // ASSERT: Verify prd_snapshot.md exists
    const prdSnapshotPath = join(result.sessionPath, 'prd_snapshot.md');
    expect(existsSync(prdSnapshotPath)).toBe(true);

    // ASSERT: Verify tasks.json exists
    const tasksPath = join(result.sessionPath, 'tasks.json');
    expect(existsSync(tasksPath)).toBe(true);

    // LOG: Execution time
    console.log(`E2E test completed in ${duration.toFixed(0)}ms`);
  });

  it('should create valid prd_snapshot.md in session directory', async () => {
    // ACT: Run pipeline
    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );
    const result = await pipeline.run();

    // ASSERT: Verify prd_snapshot.md exists and contains correct content
    const prdSnapshotPath = join(result.sessionPath, 'prd_snapshot.md');
    expect(existsSync(prdSnapshotPath)).toBe(true);

    const prdSnapshot = readFileSync(prdSnapshotPath, 'utf-8');
    expect(prdSnapshot).toContain('# Test Project');
    expect(prdSnapshot).toContain('## P1: Test Phase');
  });

  it('should create valid tasks.json with complete subtask status', async () => {
    // ACT: Run pipeline
    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );
    const result = await pipeline.run();

    // ASSERT: Verify tasks.json exists and is valid
    const tasksPath = join(result.sessionPath, 'tasks.json');
    expect(existsSync(tasksPath)).toBe(true);

    // Read and parse tasks.json
    const tasksJson = JSON.parse(readFileSync(tasksPath, 'utf-8'));

    // Verify backlog structure
    expect(tasksJson.backlog).toBeDefined();
    expect(tasksJson.backlog).toHaveLength(1);
    expect(tasksJson.backlog[0].id).toBe('P1');

    // Verify milestone structure
    expect(tasksJson.backlog[0].milestones).toHaveLength(1);
    expect(tasksJson.backlog[0].milestones[0].id).toBe('P1.M1');

    // Verify task structure
    expect(tasksJson.backlog[0].milestones[0].tasks).toHaveLength(1);
    expect(tasksJson.backlog[0].milestones[0].tasks[0].id).toBe('P1.M1.T1');

    // Verify subtasks array is empty (0 subtasks for fast E2E test)
    const subtasks = tasksJson.backlog[0].milestones[0].tasks[0].subtasks;
    expect(subtasks).toHaveLength(0);
  });

  it('should handle error when PRD file does not exist', async () => {
    // ACT: Try to create pipeline with non-existent PRD
    const invalidPath = join(tempDir, 'nonexistent.md');
    const pipeline = new PRPPipeline(
      invalidPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );
    const result = await pipeline.run();

    // ASSERT: Should fail gracefully
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.finalPhase).toBe('init'); // Phase should not change if init fails
  });

  it('should complete execution in under 30 seconds', async () => {
    // ACT: Run pipeline with timing
    const start = performance.now();
    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );
    const result = await pipeline.run();
    const duration = performance.now() - start;

    // ASSERT: Should complete quickly with mocked dependencies
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(30000);

    // LOG timing for reference
    console.log(
      `Pipeline execution completed in ${duration.toFixed(0)}ms (< 30000ms target)`
    );
  });
});

// =============================================================================
// KEY IMPLEMENTATION DETAILS
// =============================================================================

// 1. MODULE MOCKING WITH HOISTING
// All vi.mock() calls are at top level before imports
// Use vi.importActual() to preserve real exports (MCPHandler from groundswell)

// 2. TYPED MOCK REFERENCES
// vi.mocked(createAgent) provides type-safe mock access
// Use .mockReturnValue(), .mockResolvedValue() for return values

// 3. CHILDPROCESS MOCK FACTORY
// createMockChild() returns realistic ChildProcess with async event emission
// Uses setTimeout to simulate async data emission (5ms data, 10ms close)

// 4. TEMPORARY DIRECTORY MANAGEMENT
// mkdtempSync() creates unique temp dir for each test
// rmSync() in afterEach cleans up recursively with force flag

// 5. REAL TIMERS FOR ASYNC MOCKS
// vi.useRealTimers() allows setTimeout in mocks to work
// vi.useFakeTimers() restores fake timers after test

// 6. FILE SYSTEM MOCKS
// readFile checks path to return different content (tasks.json vs PRD.md)
// existsSync returns true for all paths in this test

// 7. EXECUTION TIME MEASUREMENT
// performance.now() provides millisecond precision
// Assert <30 seconds but log actual duration
```

**Explanation**: This example demonstrates:

- **Real implementations** - Pipeline code is not mocked, only external dependencies
- **Temporary file system** - `mkdtempSync()` creates isolated test directories
- **Real timers** - `vi.useRealTimers()` required for async mock behavior
- **Mock factories** - `createMockChild()` creates realistic ChildProcess mocks
- **Multi-level assertions** - Structure, filesystem, content, and timing
- **Cleanup** - Proper timeout and directory cleanup in `afterEach`

**GOTCHA**: E2E tests require `vi.useRealTimers()` because the mocks use `setTimeout` for async event emission. Without real timers, the mock events will never fire.

**See also**: `tests/e2e/pipeline.test.ts:1-522` for the complete test file.

---

## Mocking Patterns Reference

### Groundswell Agent Mocking (CRITICAL)

**The most important mocking pattern in this codebase.**

```typescript
// =============================================================================
// MOCK PATTERN: Groundswell createAgent and createPrompt
// =============================================================================

// Pattern: Mock at top level before imports (hoisting required by vi.mock)
// CRITICAL: Use importActual to preserve MCPHandler and other exports needed by MCP tools
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual, // PRESERVE non-mocked exports (MCPHandler, MCPServer)
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import AFTER mocking - get mocked versions
import { createAgent, createPrompt } from 'groundswell';

// Setup mocks to return predictable values
const mockAgent = {
  prompt: vi.fn(),
};

const mockPrompt = {
  user: '',
  system: '',
  responseFormat: BacklogSchema,
  enableReflection: true,
};

vi.mocked(createAgent).mockReturnValue(mockAgent as never);
vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);
```

**Why this pattern is critical**:

- **Hoisting**: `vi.mock()` must be at top level before imports
- **Preserve exports**: `MCPHandler` and `MCPServer` are needed by MCP tools
- **Prevent errors**: Without preserving exports, MCP server registration fails with "server 'undefined' is already registered"

**Gotcha**: If you completely mock Groundswell without `vi.importActual()`, MCP tool registration will fail because `MCPHandler` will be undefined.

---

### File System Mocking

```typescript
// Mock fs module
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

describe('File operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read file content', () => {
    const mockContent = 'file content';
    vi.mocked(readFileSync).mockReturnValue(mockContent);

    const content = readFileSync('/path/to/file.txt', 'utf-8');

    expect(content).toBe(mockContent);
    expect(readFileSync).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
  });

  it('should write file content', () => {
    const content = 'new content';

    writeFileSync('/path/to/file.txt', content, 'utf-8');

    expect(writeFileSync).toHaveBeenCalledWith(
      '/path/to/file.txt',
      content,
      'utf-8'
    );
  });
});
```

---

### Environment Variable Mocking

```typescript
describe('Environment configuration', () => {
  afterEach(() => {
    // CRITICAL: Restore after each test
    vi.unstubAllEnvs();
  });

  it('should use test API endpoint', () => {
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');

    const config = createBaseConfig('architect');

    expect(config.env.ANTHROPIC_BASE_URL).toBe(
      'https://api.z.ai/api/anthropic'
    );
    expect(config.env.ANTHROPIC_API_KEY).toBe('test-key-123');
  });

  it('should handle missing environment variables', () => {
    delete process.env.ANTHROPIC_API_KEY;

    const config = createBaseConfig('architect');

    expect(config.env.ANTHROPIC_API_KEY).toBe('');
  });
});
```

**CRITICAL**: Always call `vi.unstubAllEnvs()` in `afterEach` to prevent test pollution.

---

### Mock Verification

After mocking, verify the mocks were called correctly:

```typescript
it('should call createAgent with correct parameters', () => {
  createArchitectAgent();

  // Verify called once
  expect(createAgent).toHaveBeenCalledTimes(1);

  // Verify called with specific parameters
  expect(createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'ArchitectAgent',
      model: 'GLM-4.7',
      maxTokens: 8192,
    })
  );

  // Verify specific parameter value
  expect(createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      system: expect.stringContaining('LEAD TECHNICAL ARCHITECT'),
    })
  );
});
```

---

## Test File Organization

### Directory Structure

```bash
tests/
├── setup.ts                    # Global test configuration
├── unit/                       # Unit tests (80 files)
│   ├── agents/                 # Agent factory and prompts
│   ├── config/                 # Configuration tests
│   ├── core/                   # Core business logic
│   ├── tools/                  # MCP tool tests
│   ├── utils/                  # Utility function tests
│   └── workflows/              # Workflow tests
├── integration/                # Integration tests (42 files)
│   ├── agents.test.ts          # Groundswell integration
│   ├── bug-hunt-workflow-integration.test.ts
│   └── prp-pipeline-integration.test.ts
├── e2e/                        # End-to-end tests (2 files)
│   ├── pipeline.test.ts        # Complete pipeline workflow
│   └── delta.test.ts           # Delta session E2E
├── fixtures/                   # Reusable test data
│   ├── mock-delta-data.ts
│   ├── prp-samples.ts
│   └── simple-prd.ts
└── validation/                 # Validation tests
```

### File Naming Conventions

- **Unit tests**: `<module>.test.ts` (e.g., `agent-factory.test.ts`)
- **Integration tests**: `<feature>.test.ts` or `<feature>-integration.test.ts`
- **E2E tests**: `<workflow>.test.ts`

### Test Organization Mirroring Source

Tests mirror the source code structure:

```bash
# Source structure
src/
├── agents/
│   ├── agent-factory.ts
│   └── prompts/
├── core/
│   ├── session-manager.ts
│   └── task-orchestrator.ts
└── tools/

# Test structure mirrors source
tests/
├── unit/
│   ├── agents/
│   │   ├── agent-factory.test.ts
│   │   └── prompts/
│   ├── core/
│   │   ├── session-manager.test.ts
│   │   └── task-orchestrator.test.ts
│   └── tools/
```

---

## Common Test Scenarios

### Parameterized Tests

Use `it.each()` for testing multiple inputs with the same logic:

```typescript
describe('createBaseConfig', () => {
  const personas: AgentPersona[] = ['architect', 'researcher', 'coder', 'qa'];

  it.each(personas)('should return valid config for %s persona', persona => {
    // EXECUTE
    const config = createBaseConfig(persona);

    // VERIFY: Required properties exist
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('system');
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('enableCache');
    expect(config).toHaveProperty('enableReflection');
    expect(config).toHaveProperty('maxTokens');
    expect(config).toHaveProperty('env');
  });
});

// Table-driven approach
describe('isSessionError type guard', () => {
  it.each([
    ['SessionError instance', new SessionError('Test'), true],
    ['plain Error', new Error('Test'), false],
    ['null', null, false],
    ['undefined', undefined, false],
    ['string', 'error', false],
  ])('should return %s for %s', (description, value, expected) => {
    const result = isSessionError(value);
    expect(result).toBe(expected);
  });
});
```

---

### Error Handling Tests

Test error propagation and handling:

```typescript
describe('error handling', () => {
  it('should throw validation error for invalid input', () => {
    expect(() => createUser({ email: 'invalid' })).toThrow(
      'Email must be a valid email address'
    );
  });

  it('should propagate errors from dependencies', async () => {
    const mockError = new Error('Database connection failed');
    vi.mocked(db.query).mockRejectedValue(mockError);

    await expect(fetchUser('123')).rejects.toThrow(
      'Database connection failed'
    );
  });

  it('should preserve error chain with cause', () => {
    const originalError = new Error('Network timeout');
    const wrappedError = new AgentError(
      'Agent operation failed',
      { operation: 'generatePRP' },
      originalError
    );

    const wrappedWithCause = wrappedError as unknown as { cause?: Error };
    expect(wrappedWithCause.cause).toBe(originalError);
    expect(wrappedWithCause.cause?.message).toBe('Network timeout');
  });
});
```

---

### Async Operation Tests

Test async operations properly:

```typescript
describe('async operations', () => {
  it('should resolve with correct value', async () => {
    const result = await asyncFunction();
    expect(result).toBe('expected value');
  });

  it('should handle async errors', async () => {
    vi.mocked(dependency.asyncMethod).mockRejectedValue(new Error('Failed'));

    await expect(asyncFunction()).rejects.toThrow('Failed');
  });

  it('should handle timeout', async () => {
    // Use real timers for timeout tests
    vi.useRealTimers();

    const promise = slowOperation(1000);

    // Fast-forward time (if using fake timers)
    // vi.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeDefined();
  });
});
```

---

### Fixture Factory Pattern

Create reusable test data with factory functions:

```typescript
// Factory function with overrides
const createTestTask = (
  id: string,
  title: string,
  description?: string,
  overrides: Partial<Task> = {}
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Planned',
  description: description ?? `Description for ${title}`,
  subtasks: [],
  ...overrides,
});

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

// Usage in tests
it('should handle task with custom status', () => {
  const task = createTestTask('P1.M1.T1', 'Test Task', undefined, {
    status: 'Complete',
  });
  expect(task.status).toBe('Complete');
});
```

---

## See Also

### Project Documentation

- **[TESTING.md](./TESTING.md)** - Testing strategy and philosophy (source of truth)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and component interactions
- **[CLI_REFERENCE.md](./CLI_REFERENCE.md)** - Command-line interface reference
- **[CUSTOM_AGENTS.md](./CUSTOM_AGENTS.md)** - Creating custom agents with Groundswell
- **[CUSTOM_TOOLS.md](./CUSTOM_TOOLS.md)** - MCP tool development guide

### Research Documentation

- **[LLM Agent Testing Best Practices](./research/llm-agent-testing-best-practices.md)** - Comprehensive testing patterns for LLM agents

### External Resources

- **[Vitest Documentation](https://vitest.dev/guide/)** - Official Vitest documentation
- **[Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)** - Mocking strategies and patterns
- **[Vitest Coverage Guide](https://vitest.dev/guide/coverage.html)** - Coverage configuration and thresholds
- **[Vitest Configuration](https://vitest.dev/config/)** - Complete vitest.config.ts reference

### Key Files

- **[vitest.config.ts](../vitest.config.ts)** - Test configuration and coverage thresholds
- **[tests/setup.ts](../tests/setup.ts)** - Global test setup and API validation
- **[tests/integration/agents.test.ts](../tests/integration/agents.test.ts)** - Groundswell integration test examples
- **[tests/unit/agents/agent-factory.test.ts](../tests/unit/agents/agent-factory.test.ts)** - Unit test examples with environment mocking
- **[tests/e2e/pipeline.test.ts](../tests/e2e/pipeline.test.ts)** - Complete E2E pipeline test example
- **[tests/unit/utils/errors.test.ts](../tests/unit/utils/errors.test.ts)** - Pure function testing examples
- **[tests/integration/bug-hunt-workflow-integration.test.ts](../tests/integration/bug-hunt-workflow-integration.test.ts)** - Workflow integration examples
