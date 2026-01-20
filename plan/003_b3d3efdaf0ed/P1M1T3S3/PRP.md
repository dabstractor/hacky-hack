# Product Requirement Prompt (PRP): P1.M1.T3.S3 - Verify Coder Agent and PRP execution

---

## Goal

**Feature Goal**: Verify Coder Agent is correctly integrated with proper configuration, PRP_BUILDER_PROMPT structure compliance, and PRP executor validation system through comprehensive integration tests.

**Deliverable**: Integration test file `tests/integration/coder-agent.test.ts` with test cases covering:
- Coder Agent configuration verification (model, tokens, MCP tools, cache)
- PRP_BUILDER_PROMPT structure validation (Execution Process, Progressive Validation, 4-level validation gates)
- PRP executor integration (PRP path injection, agent orchestration, result parsing)
- Progressive validation execution (4 levels sequential, stop-on-fail, manual gate skipping)
- Fix-and-retry mechanism (max 2 attempts, exponential backoff, error context)
- BashMCP tool integration (validation command execution, timeout handling, output capture)
- Validation artifact collection (validation-results.json, execution-summary.md structure)
- Mock PRP file, validation commands, and BashMCP tool for deterministic testing

**Success Definition**: All tests pass, verifying:
- Coder Agent created with correct config (GLM-4.7, 4096 tokens, MCP tools: BASH, FILESYSTEM, GIT)
- PRP_BUILDER_PROMPT contains all required sections (Execution Process, Progressive Validation, JSON output format)
- PRP executor loads PRP file before execution (critical first step)
- 4-level progressive validation runs sequentially with stop-on-fail behavior
- Fix-and-retry mechanism retries up to 2 times with exponential backoff (2s, 4s, capped at 30s)
- Validation artifacts are collected with correct structure (validation-results.json, execution-summary.md)
- BashMCP executes validation commands with proper timeout (120s), output capture (stdout/stderr/exitCode)
- Mock PRP file can be created and parsed correctly for testing

## Why

- Coder Agent is responsible for executing PRPs and implementing features
- The PRP_BUILDER_PROMPT is critical for ensuring proper PRP execution flow
- PRP executor orchestrates the complete implementation lifecycle
- Progressive validation catches errors early through 4-level gate system
- Fix-and-retry mechanism handles implementation bugs automatically
- BashMCP integration ensures safe command execution for validation
- Configuration errors would cause PRP execution failures
- Prompt structure errors would cause incomplete or incorrect execution
- Validation gate bugs could allow broken code to pass
- No existing tests verify Coder Agent integration setup or PRP executor end-to-end flow

## What

Integration tests that verify Coder Agent is correctly configured, PRP executor properly orchestrates execution, and validation system works as designed.

### Success Criteria

- [ ] Coder Agent configuration validated (model: GLM-4.7, maxTokens: 4096, MCP tools: BASH_MCP, FILESYSTEM_MCP, GIT_MCP)
- [ ] PRP_BUILDER_PROMPT contains Execution Process section with 5 steps
- [ ] PRP_BUILDER_PROMPT contains Progressive Validation section with 4 levels
- [ ] PRP_BUILDER_PROMPT specifies JSON output format with result/message fields
- [ ] PRP executor injects PRP file path into prompt ($PRP_FILE_PATH placeholder)
- [ ] PRP executor loads PRP before execution (critical first step verified)
- [ ] Progressive validation runs 4 levels sequentially (1 → 2 → 3 → 4)
- [ ] Stop-on-fail behavior verified (execution stops at first failing gate)
- [ ] Manual gates (manual: true or command: null) are skipped automatically
- [ ] Fix-and-retry retries up to 2 times (3 total attempts)
- [ ] Exponential backoff verified (2s, 4s, capped at 30s)
- [ ] Error context provided to agent on retry (level, command, stdout, stderr)
- [ ] BashMCP executes validation commands with proper timeout
- [ ] BashMCP captures stdout, stderr, and exitCode correctly
- [ ] Validation artifacts have correct structure (validation-results.json with gate results)
- [ ] Mock PRP file can be created and parsed for deterministic testing

## All Needed Context

### Context Completeness Check

*This PRP passes the "No Prior Knowledge" test:*
- Exact file paths and patterns to follow from existing tests
- Coder Agent configuration values from source code
- PRP_BUILDER_PROMPT structure from PROMPTS.md and prompts.ts
- PRP executor implementation details from prp-executor.ts
- Mock setup patterns for Groundswell agents and BashMCP
- Research documents with detailed implementation guidance

### Documentation & References

```yaml
# MUST READ - Coder Agent configuration
- file: src/agents/agent-factory.ts
  why: Contains createCoderAgent() with exact configuration values
  lines: 254-263 (createCoderAgent function)
  lines: 118-123 (PERSONA_TOKEN_LIMITS)
  lines: 150-176 (createBaseConfig function)
  lines: 56-68 (MCP_TOOLS constant)
  pattern: Factory function that calls createAgent with config
  gotcha: Coder uses maxTokens: 4096, all 3 MCP tools (BASH, FILESYSTEM, GIT)

# MUST READ - PRP_BUILDER_PROMPT structure
- file: PROMPTS.md
  why: Contains the full PRP_EXECUTE_PROMPT (PRP_BUILDER_PROMPT) that Coder Agent uses
  lines: 641-714 (complete PRP_EXECUTE_PROMPT)
  lines: 649-669 (Execution Process with 5 steps)
  lines: 671-685 (Progressive Validation with 4 levels)
  lines: 691-698 (JSON output format specification)
  pattern: Markdown prompt with numbered sections
  gotcha: Critical first step is "Load PRP" - must read PRP file before execution

# MUST READ - PRP executor implementation
- file: src/agents/prp-executor.ts
  why: Contains complete PRP execution flow with validation and retry logic
  lines: 194-202 (constructor with agent and BashMCP creation)
  lines: 238-322 (execute method - main flow)
  lines: 242-246 (PRP path injection into prompt)
  lines: 249-255 (agent execution with retryAgentPrompt)
  lines: 258 (JSON result parsing)
  lines: 271-299 (validation gates with fix-and-retry loop)
  lines: 302-312 (final result building)
  lines: 335-396 (#runValidationGates - sequential execution)
  lines: 411-458 (#fixAndRetry - error context and retry)
  lines: 471-485 (#parseCoderResult - JSON parsing)
  pattern: Private methods with # prefix, error handling, state management
  gotcha: Max fix attempts is 2, delay formula: Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000)

# MUST READ - PRPDocument and ValidationGate schemas
- file: src/core/models.ts
  why: Contains PRPDocument and ValidationGate interfaces for validation
  lines: 966-1073 (ValidationGate interface and ValidationGateSchema)
  lines: 1148-1305 (PRPDocument interface and PRPDocumentSchema)
  pattern: Zod schema with unions for level (1|2|3|4), nullable command
  gotcha: command can be null (manual validation), level is literal union

# MUST READ - BashMCP implementation
- file: src/tools/bash-mcp.ts
  why: Contains execute_bash() method used by PRP executor for validation
  lines: 299-301 (execute_bash direct method)
  lines: 131-241 (executeBashCommand - spawn execution)
  lines: 158-171 (spawn with shell: false for safety)
  lines: 179-191 (timeout handling with SIGTERM + SIGKILL)
  lines: 194-207 (output capture for stdout/stderr)
  pattern: Safe command execution, timeout protection, output capture
  gotcha: Default timeout 30s, validation timeout 120s (2 minutes)

# MUST READ - Existing PRP executor integration test (reference patterns)
- file: tests/integration/prp-executor-integration.test.ts
  why: Shows existing test patterns for PRP executor testing
  lines: 17-33 (mock setup preserving real BashMCP)
  lines: 94-130 (real BashMCP execution test)
  lines: 132-196 (real failure handling test)
  pattern: Real BashMCP with mocked agent.prompt()
  gotcha: This test validates PRPExecutor, NOT Coder Agent configuration

# MUST READ - Groundswell Agent/Prompt test patterns
- file: tests/integration/groundswell/agent-prompt.test.ts
  why: Shows patterns for mocking @anthropic-ai/sdk and testing Groundswell integration
  lines: 39-45 (mock pattern for Anthropic SDK)
  lines: 52-54 (dynamic import function)
  lines: 232-263 (validateResponse() test patterns)
  pattern: vi.mock at top level, dynamic import, SETUP/EXECUTE/VERIFY
  gotcha: Must use .js extensions for imports

# MUST READ - Test setup and global hooks
- file: tests/setup.ts
  why: Contains z.ai API safeguard and global cleanup patterns
  lines: 56-120 (z.ai API endpoint validation)
  lines: 162-180 (beforeEach hooks)
  lines: 189-229 (afterEach hooks with rejection tracking)
  pattern: Global test file with automatic API validation
  gotcha: Tests fail if ANTHROPIC_BASE_URL is api.anthropic.com

# MUST READ - Previous PRP for parallel context
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S2/PRP.md
  why: Previous work item (Researcher Agent integration) provides test patterns to follow
  section: "Implementation Blueprint" (test structure, mock setup)

# MUST READ - Research documents (in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S3/research/prp-executor-research.md
  why: Complete PRP executor implementation, validation gates, retry logic
  section: "PRP Executor Implementation" (key methods, flow, line numbers)

- docfile: plan/003_b3d3efdaf0ed/P1M1T3S3/research/integration-test-patterns-research.md
  why: Integration test patterns, mock setup, validation approaches
  section: "Mock Setup Patterns" (vi.mock, dynamic import patterns)

- docfile: plan/003_b3d3efdaf0ed/P1M1T3S3/research/coder-agent-research.md
  why: Coder Agent configuration, prompt structure, test coverage gaps
  section: "Coder Agent Configuration" (exact config values)
```

### Current Codebase Tree (test directories)

```bash
tests/
├── integration/
│   ├── agents.test.ts                      # Agent factory integration tests
│   ├── architect-agent.test.ts             # Architect Agent output tests
│   ├── prp-blueprint-agent.test.ts         # PRP Blueprint Prompt tests
│   ├── prp-executor-integration.test.ts    # PRPExecutor integration (exists)
│   ├── prp-generator-integration.test.ts   # PRPGenerator integration
│   ├── tools.test.ts                       # MCP tools tests (BashMCP patterns)
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
        ├── agent-factory.test.ts           # Agent factory unit tests
        └── prp-executor.test.ts            # PRPExecutor unit tests
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── integration/
│   ├── coder-agent.test.ts                 # NEW: Coder Agent integration tests
│   ├── agents.test.ts                      # Existing
│   ├── prp-executor-integration.test.ts    # Existing (keep, different focus)
│   └── [other existing test files...]
```

**New File**: `tests/integration/coder-agent.test.ts`
- Tests Coder Agent configuration from agent-factory
- Tests PRP_BUILDER_PROMPT structure validation
- Tests PRP executor integration (PRP loading, path injection)
- Tests progressive validation (4 levels, sequential, stop-on-fail)
- Tests fix-and-retry mechanism (2 attempts, exponential backoff)
- Tests BashMCP tool integration (command execution, output capture)
- Tests validation artifact structure
- Uses vi.mock for Groundswell, not agent-factory (to test real factory)

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Coder Agent uses maxTokens: 4096 (same as Researcher, QA)
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,    // Larger for complex task decomposition
  researcher: 4096,   // Standard for PRP generation
  coder: 4096,        // Standard for PRP execution
  qa: 4096,
} as const;

// CRITICAL: PRP_BUILDER_PROMPT references "Read tool" for loading PRP
// This is the CRITICAL FIRST STEP - agent must read PRP file before execution
// The prompt contains "$PRP_FILE_PATH" placeholder that executor replaces

// CRITICAL: Progressive validation has 4 levels, executed sequentially
// Level 1: Syntax & Style (linting, formatting, type checking)
// Level 2: Unit Tests (component validation)
// Level 3: Integration Testing (system validation)
// Level 4: Manual/Creative (often manual: true)
// Stop-on-fail: Execution stops at first failing gate

// GOTCHA: MCP servers are singletons registered at module load time
// This prevents re-registration across tests
// Use vi.mock('groundswell') to avoid MCP registration issues

// CRITICAL: Tests MUST use .js extensions for imports (ES modules)
import { createCoderAgent } from '../../src/agents/agent-factory.js';

// GOTCHA: Global test setup (tests/setup.ts) blocks Anthropic API
// Tests will fail if ANTHROPIC_BASE_URL is https://api.anthropic.com
// Must use https://api.z.ai/api/anthropic

// CRITICAL: Use vi.mock() at top level BEFORE imports (hoisting required)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});

// GOTCHA: When testing agent-factory, mock Groundswell NOT agent-factory
// We want to test the REAL createCoderAgent() function
// So we mock createAgent() which it calls internally

// CRITICAL: Fix-and-retry has max 2 attempts (3 total: 1 initial + 2 retries)
// Delay formula: Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000)
// Progression: 2s, 4s, 8s, 16s, 30s (capped)

// CRITICAL: Validation gate timeout is 120 seconds (2 minutes)
// Default BashMCP timeout is 30 seconds
// PRP executor passes timeout: 120000 to execute_bash()

// CRITICAL: Manual gates are skipped automatically
// Skip if gate.manual === true OR gate.command === null
// Skipped gates count as passed (success: true, skipped: true)

// GOTCHA: PRP executor uses #runValidationGates (private method)
// Can't test directly, but can verify behavior through execute()

// CRITICAL: BashMCP has two execution paths
// 1. executeTool() - MCP protocol (for MCP server)
// 2. execute_bash() - Direct method (used by PRP executor)
// PRP executor calls: await this.#bashMCP.execute_bash({ command, cwd, timeout })

// GOTCHA: Command parsing uses simple space split (line 150 of bash-mcp.ts)
// Vulnerable to quoted arguments
// Production systems should use proper shell parsing

// CRITICAL: Validation artifacts are TODO (line 307 of prp-executor.ts)
// artifacts: [] // TODO: Extract artifacts from Coder Agent output
// Test should verify structure exists but content is empty array

// GOTCHA: JSON parsing handles markdown code blocks
// Agent may return: ```json\n{...}\n``` OR raw JSON
// #parseCoderResult handles both cases

// CRITICAL: PRP path injection replaces $PRP_FILE_PATH globally
// const injectedPrompt = PRP_BUILDER_PROMPT.replace(/\$PRP_FILE_PATH/g, prpPath);
// Must verify path is correctly injected
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from `src/core/models.ts`:

```typescript
// Import existing types for use in tests
import type { PRPDocument, ValidationGate, ValidationGateResult } from '../../src/core/models.js';
import { PRPDocumentSchema, ValidationGateSchema } from '../../src/core/models.js';

// Mock fixture for PRPDocument
const createMockPRPDocument = (
  taskId: string,
  validationGates?: ValidationGate[]
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

// Mock fixture for minimal PRP (no validation gates)
const createMinimalPRPDocument = (taskId: string): PRPDocument => ({
  taskId,
  objective: 'Test objective',
  context: 'Test context',
  implementationSteps: ['Step 1'],
  validationGates: [],
  successCriteria: [],
  references: [],
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/coder-agent.test.ts
  - IMPLEMENT: File header with JSDoc comments describing test purpose
  - IMPLEMENT: Import statements for Vitest, types, mocks
  - IMPLEMENT: Top-level vi.mock() for Groundswell (NOT agent-factory)
  - FOLLOW pattern: tests/integration/prp-executor-integration.test.ts (mock setup)
  - NAMING: coder-agent.test.ts (distinguished from prp-executor-integration.test.ts)
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT mock setup with dynamic imports
  - IMPLEMENT: vi.mock('groundswell') with createAgent mock
  - IMPLEMENT: Dynamic import function for Groundswell
  - IMPLEMENT: Mock createAgent to return object with prompt() method
  - DEPENDENCIES: Task 1 (file created)

Task 3: IMPLEMENT main describe block and hooks
  - IMPLEMENT: Main describe block 'integration/coder-agent'
  - IMPLEMENT: beforeAll to load Groundswell dynamically
  - IMPLEMENT: beforeEach to clear mocks
  - IMPLEMENT: afterEach to unstub environments
  - FOLLOW pattern: tests/integration/groundswell/agent-prompt.test.ts (test structure)
  - DEPENDENCIES: Task 2 (mock setup complete)

Task 4: IMPLEMENT coder agent configuration tests
  - CREATE: describe block 'createCoderAgent configuration'
  - IMPLEMENT: test 'should create coder agent with GLM-4.7 model'
    - SETUP: Import PRP_BUILDER_PROMPT from prompts.js
    - EXECUTE: Call createCoderAgent()
    - VERIFY: createAgent called with model: 'GLM-4.7'
  - IMPLEMENT: test 'should create coder agent with 4096 max tokens'
    - VERIFY: createAgent called with maxTokens: 4096
  - IMPLEMENT: test 'should create coder agent with cache enabled'
    - VERIFY: createAgent called with enableCache: true
  - IMPLEMENT: test 'should create coder agent with reflection enabled'
    - VERIFY: createAgent called with enableReflection: true
  - IMPLEMENT: test 'should create coder agent with MCP tools'
    - VERIFY: createAgent called with mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP]
  - IMPLEMENT: test 'should use PRP_BUILDER_PROMPT as system prompt'
    - VERIFY: createAgent called with system: PRP_BUILDER_PROMPT
  - DEPENDENCIES: Task 3 (test structure complete)

Task 5: IMPLEMENT PRP_BUILDER_PROMPT structure validation tests
  - CREATE: describe block 'PRP_BUILDER_PROMPT structure validation'
  - IMPLEMENT: test 'should contain Execution Process section'
    - VERIFY: Prompt contains 'Execution Process'
    - VERIFY: Prompt contains 'Load PRP (CRITICAL FIRST STEP)'
    - VERIFY: Prompt contains 'ULTRATHINK & Plan'
    - VERIFY: Prompt contains 'Execute Implementation'
    - VERIFY: Prompt contains 'Progressive Validation'
    - VERIFY: Prompt contains 'Completion Verification'
  - IMPLEMENT: test 'should instruct to Load PRP as first step'
    - VERIFY: Prompt contains 'Use the `Read` tool to read the PRP file'
    - VERIFY: Prompt contains 'You MUST read this file before doing anything else'
  - IMPLEMENT: test 'should contain Progressive Validation section'
    - VERIFY: Prompt contains 'Progressive Validation'
    - VERIFY: Prompt contains 'Level 1: Run syntax & style validation'
    - VERIFY: Prompt contains 'Level 2: Execute unit test validation'
    - VERIFY: Prompt contains 'Level 3: Run integration testing'
    - VERIFY: Prompt contains 'Level 4: Execute specified validation'
    - VERIFY: Prompt contains 'Each level must pass before proceeding'
  - IMPLEMENT: test 'should specify JSON output format'
    - VERIFY: Prompt contains '"result": "success" | "error" | "issue"'
    - VERIFY: Prompt contains '"message": "Detailed explanation"'
  - IMPLEMENT: test 'should include failure protocol'
    - VERIFY: Prompt contains 'Failure Protocol'
    - VERIFY: Prompt contains 'halt and produce a thorough explanation'
  - DEPENDENCIES: Task 4 (configuration tests validate agent setup)

Task 6: IMPLEMENT PRP executor integration tests
  - CREATE: describe block 'PRP executor integration'
  - IMPLEMENT: test 'should inject PRP path into prompt'
    - SETUP: Mock PRP executor with real session path
    - SETUP: Spy on PRP_BUILDER_PROMPT.replace to verify $PRP_FILE_PATH replacement
    - EXECUTE: Execute PRP with mock agent
    - VERIFY: $PRP_FILE_PATH replaced with actual PRP path
  - IMPLEMENT: test 'should use real BashMCP for validation'
    - SETUP: Create PRPExecutor instance
    - VERIFY: #bashMCP is real BashMCP instance (not mocked)
  - DEPENDENCIES: Task 5 (prompt structure tests complete)

Task 7: IMPLEMENT progressive validation tests
  - CREATE: describe block 'progressive validation execution'
  - IMPLEMENT: test 'should execute 4 validation levels sequentially'
    - SETUP: Create PRP with 4 validation gates (echo commands)
    - EXECUTE: Run PRP executor with mocked agent returning success
    - VERIFY: All 4 gates executed in order
    - VERIFY: Execution order: 1, 2, 3, 4
  - IMPLEMENT: test 'should stop execution on first failure'
    - SETUP: Create PRP where Level 2 fails (use `false` command)
    - EXECUTE: Run PRP executor
    - VERIFY: Level 3 not executed
    - VERIFY: Only results for Level 1, Level 2, Level 4 (skipped)
  - IMPLEMENT: test 'should skip manual validation gates'
    - SETUP: Create PRP with Level 4 manual: true
    - EXECUTE: Run PRP executor
    - VERIFY: Level 4 marked as skipped
    - VERIFY: Level 4 has success: true (skipped gates pass)
  - IMPLEMENT: test 'should skip gates with null command'
    - SETUP: Create PRP with gate.command = null
    - EXECUTE: Run PRP executor
    - VERIFY: Gate marked as skipped
  - DEPENDENCIES: Task 6 (executor integration tests complete)

Task 8: IMPLEMENT fix-and-retry mechanism tests
  - CREATE: describe block 'fix-and-retry mechanism'
  - IMPLEMENT: test 'should retry on validation failure up to 2 times'
    - SETUP: Mock agent.prompt() state machine (fail, then pass)
    - SETUP: Mock BashMCP state machine (fail Level 2 twice, then pass)
    - EXECUTE: Run PRP executor
    - VERIFY: fixAttempts equals 2
    - VERIFY: Success after retries
  - IMPLEMENT: test 'should fail after max retry attempts exhausted'
    - SETUP: Mock BashMCP to always fail Level 2
    - EXECUTE: Run PRP executor
    - VERIFY: fixAttempts equals 2 (max)
    - VERIFY: success is false
  - IMPLEMENT: test 'should use exponential backoff for retries'
    - SETUP: Mock time and track delay calls
    - EXECUTE: Run PRP executor with failure scenario
    - VERIFY: Delays: 2000ms, 4000ms (or capped at 30000ms)
    - VERIFY: Formula: Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000)
  - IMPLEMENT: test 'should provide error context to agent on retry'
    - SETUP: Mock agent.prompt() to capture fix prompts
    - EXECUTE: Run PRP executor with validation failure
    - VERIFY: Fix prompt contains failed level
    - VERIFY: Fix prompt contains command that failed
    - VERIFY: Fix prompt contains stdout/stderr from failure
  - DEPENDENCIES: Task 7 (progressive validation tests complete)

Task 9: IMPLEMENT BashMCP integration tests
  - CREATE: describe block 'BashMCP tool integration'
  - IMPLEMENT: test 'should execute validation commands with real BashMCP'
    - SETUP: Create PRP with echo commands
    - EXECUTE: Run PRP executor with real BashMCP
    - VERIFY: Commands executed via BashMCP.execute_bash()
    - VERIFY: Output captured correctly
  - IMPLEMENT: test 'should capture stdout from validation commands'
    - SETUP: Create PRP with 'echo "test output"'
    - EXECUTE: Run PRP executor
    - VERIFY: stdout contains 'test output'
  - IMPLEMENT: test 'should capture stderr from failed commands'
    - SETUP: Create PRP with command that writes to stderr
    - EXECUTE: Run PRP executor
    - VERIFY: stderr contains error message
  - IMPLEMENT: test 'should capture exitCode from validation commands'
    - SETUP: Create PRP with `exit 42` command
    - EXECUTE: Run PRP executor
    - VERIFY: exitCode is 42
  - IMPLEMENT: test 'should use 120 second timeout for validation gates'
    - SETUP: Create PRP with long-running command
    - VERIFY: timeout: 120000 passed to execute_bash()
  - DEPENDENCIES: Task 8 (retry tests complete)

Task 10: IMPLEMENT validation artifact tests
  - CREATE: describe block 'validation artifact collection'
  - IMPLEMENT: test 'should create validation results structure'
    - SETUP: Create PRP and execute
    - VERIFY: validationResults array exists
    - VERIFY: Each result has level, description, success, command, stdout, stderr, exitCode, skipped
  - IMPLEMENT: test 'should include all validation gate results'
    - SETUP: Create PRP with 4 gates
    - EXECUTE: Run PRP executor
    - VERIFY: validationResults has 4 items
  - IMPLEMENT: test 'should track execution summary'
    - SETUP: Create PRP and execute
    - VERIFY: ExecutionResult has fixAttempts count
    - VERIFY: ExecutionResult has success boolean
    - VERIFY: ExecutionResult has artifacts array (currently empty TODO)
  - DEPENDENCIES: Task 9 (BashMCP tests complete)

Task 11: IMPLEMENT JSON parsing tests
  - CREATE: describe block 'JSON result parsing'
  - IMPLEMENT: test 'should parse raw JSON response from agent'
    - SETUP: Mock agent to return raw JSON
    - EXECUTE: Run PRP executor
    - VERIFY: JSON parsed successfully
  - IMPLEMENT: test 'should parse JSON wrapped in markdown code blocks'
    - SETUP: Mock agent to return ```json\n{...}\n```
    - EXECUTE: Run PRP executor
    - VERIFY: JSON extracted and parsed successfully
  - IMPLEMENT: test 'should handle invalid JSON gracefully'
    - SETUP: Mock agent to return invalid JSON
    - EXECUTE: Run PRP executor
    - VERIFY: Returns error result with message
  - DEPENDENCIES: Task 10 (artifact tests complete)

Task 12: VERIFY all tests follow project patterns
  - VERIFY: Test file uses vi.mock for Groundswell (NOT agent-factory)
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock variables use proper hoisting patterns
  - VERIFY: Test file location matches conventions (tests/integration/)
  - VERIFY: afterEach cleanup includes vi.unstubAllEnvs()
  - VERIFY: Tests validate real createCoderAgent() (not mocked)
  - VERIFY: Tests use real BashMCP (not mocked)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Top-level Groundswell mock (tests real agent-factory)
import { afterEach, beforeEach, describe, expect, it, vi, beforeAll } from 'vitest';

// CRITICAL: Mock Groundswell, NOT agent-factory
// This allows testing the real createCoderAgent() function
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Dynamic import ensures mocks are applied
async function loadGroundswell() {
  return await import('groundswell');
}

// PATTERN: Test structure with beforeAll for dynamic imports
describe('integration/coder-agent', () => {
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

  // ... tests
});

// PATTERN: Configuration verification test
it('should create coder agent with GLM-4.7 model', () => {
  // SETUP: Import real agent-factory after mocks
  const { createCoderAgent } = require('../../src/agents/agent-factory.js');
  const { PRP_BUILDER_PROMPT } = require('../../src/agents/prompts.js');

  // EXECUTE: Create coder agent
  createCoderAgent();

  // VERIFY: createAgent called with correct config
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'CoderAgent',
      model: 'GLM-4.7',
      system: PRP_BUILDER_PROMPT,
      maxTokens: 4096,
      enableCache: true,
      enableReflection: true,
    })
  );
});

// PATTERN: MCP tools verification
it('should create coder agent with MCP tools', () => {
  const { createCoderAgent } = require('../../src/agents/agent-factory.js');
  const { BASH_MCP, FILESYSTEM_MCP, GIT_MCP } = require('../../src/tools/index.js');

  // EXECUTE
  createCoderAgent();

  // VERIFY: MCP tools passed to config
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP],
    })
  );
});

// PATTERN: Prompt structure validation test
it('should contain Execution Process section', () => {
  // SETUP: Import PRP_BUILDER_PROMPT
  const { PRP_BUILDER_PROMPT } = require('../../src/agents/prompts.js');

  // VERIFY: Contains key phrases from Execution Process section
  expect(PRP_BUILDER_PROMPT).toContain('Execution Process');
  expect(PRP_BUILDER_PROMPT).toContain('Load PRP (CRITICAL FIRST STEP)');
  expect(PRP_BUILDER_PROMPT).toContain('ULTRATHINK & Plan');
  expect(PRP_BUILDER_PROMPT).toContain('Execute Implementation');
  expect(PRP_BUILDER_PROMPT).toContain('Progressive Validation');
  expect(PRP_BUILDER_PROMPT).toContain('Completion Verification');
});

// PATTERN: PRP loading instruction validation
it('should instruct to Load PRP as first step', () => {
  const { PRP_BUILDER_PROMPT } = require('../../src/agents/prompts.js');

  expect(PRP_BUILDER_PROMPT).toContain('Use the `Read` tool to read the PRP file');
  expect(PRP_BUILDER_PROMPT).toContain('$PRP_FILE_PATH');
  expect(PRP_BUILDER_PROMPT).toContain('You MUST read this file before doing anything else');
});

// PATTERN: Progressive validation verification
it('should contain Progressive Validation section', () => {
  const { PRP_BUILDER_PROMPT } = require('../../src/agents/prompts.js');

  expect(PRP_BUILDER_PROMPT).toContain('Progressive Validation');
  expect(PRP_BUILDER_PROMPT).toContain('Level 1: Run syntax & style validation');
  expect(PRP_BUILDER_PROMPT).toContain('Level 2: Execute unit test validation');
  expect(PRP_BUILDER_PROMPT).toContain('Level 3: Run integration testing');
  expect(PRP_BUILDER_PROMPT).toContain('Level 4: Execute specified validation');
  expect(PRP_BUILDER_PROMPT).toContain('Each level must pass before proceeding');
});

// PATTERN: Sequential execution test with state machine
it('should execute 4 validation levels sequentially', async () => {
  // SETUP
  const { PRPExecutor } = require('../../src/agents/prp-executor.js');
  const { createCoderAgent } = require('../../src/agents/agent-factory.js');
  const prp = createMockPRPDocument('P1.M2.T2.S2');
  const prpPath = '/tmp/test-session/prps/P1M2T2S2.md';
  const sessionPath = process.cwd();

  // Mock agent to return success
  const mockAgent = {
    prompt: vi.fn().mockResolvedValue(JSON.stringify({
      result: 'success',
      message: 'Implementation complete',
    })),
  };
  (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

  // Track execution order
  const executionOrder: number[] = [];
  const originalExecuteBash = BashMCP.prototype.execute_bash;
  vi.spyOn(BashMCP.prototype, 'execute_bash').mockImplementation(async ({ command }: any) => {
    if (command.includes('Level 1')) executionOrder.push(1);
    if (command.includes('Level 2')) executionOrder.push(2);
    if (command.includes('Level 3')) executionOrder.push(3);
    if (command.includes('Level 4')) return { success: true, stdout: '', stderr: '', exitCode: 0, skipped: true };
    return { success: true, stdout: '', stderr: '', exitCode: 0 };
  });

  const executor = new PRPExecutor(sessionPath);

  // EXECUTE
  const result = await executor.execute(prp, prpPath);

  // VERIFY: Gates executed in order
  expect(executionOrder).toEqual([1, 2, 3]);
  expect(result.success).toBe(true);
});

// PATTERN: Stop-on-fail behavior test
it('should stop execution on first failure', async () => {
  // SETUP
  const { PRPExecutor } = require('../../src/agents/prp-executor.js');
  const prp = createMockPRPDocument('P1.M2.T2.S2', [
    { level: 1, description: 'L1', command: 'echo "L1 pass"', manual: false },
    { level: 2, description: 'L2', command: 'false', manual: false }, // Fails
    { level: 3, description: 'L3', command: 'echo "L3 not reached"', manual: false },
  ]);

  const mockAgent = {
    prompt: vi.fn().mockResolvedValue(JSON.stringify({ result: 'success', message: '' })),
  };
  (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

  let level3Executed = false;
  vi.spyOn(BashMCP.prototype, 'execute_bash').mockImplementation(async ({ command }: any) => {
    if (command.includes('L3')) level3Executed = true;
    if (command.includes('L2')) {
      return { success: false, stdout: '', stderr: 'Test failed', exitCode: 1 };
    }
    return { success: true, stdout: '', stderr: '', exitCode: 0 };
  });

  const executor = new PRPExecutor(process.cwd());

  // EXECUTE
  const result = await executor.execute(prp, '/tmp/test.md');

  // VERIFY: Level 3 was not executed
  expect(level3Executed).toBe(false);
  const nonSkippedResults = result.validationResults.filter(r => !r.skipped);
  expect(nonSkippedResults).toHaveLength(2); // Only Level 1 and Level 2
});

// PATTERN: Manual gate skipping test
it('should skip manual validation gates', async () => {
  // SETUP
  const { PRPExecutor } = require('../../src/agents/prp-executor.js');
  const prp = createMockPRPDocument('P1.M2.T2.S2', [
    { level: 1, description: 'L1', command: 'echo "L1"', manual: false },
    { level: 4, description: 'Manual', command: null, manual: true },
  ]);

  const mockAgent = {
    prompt: vi.fn().mockResolvedValue(JSON.stringify({ result: 'success', message: '' })),
  };
  (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

  const executor = new PRPExecutor(process.cwd());

  // EXECUTE
  const result = await executor.execute(prp, '/tmp/test.md');

  // VERIFY: Level 4 skipped
  const level4Result = result.validationResults.find(r => r.level === 4);
  expect(level4Result?.skipped).toBe(true);
  expect(level4Result?.success).toBe(true); // Skipped gates pass
});

// PATTERN: Fix-and-retry with state machine
it('should retry on validation failure up to 2 times', async () => {
  // SETUP
  const { PRPExecutor } = require('../../src/agents/prp-executor.js');
  const prp = createMockPRPDocument('P1.M2.T2.S2');

  let validationRunCount = 0;
  let agentPromptCount = 0;

  // Agent state machine: initial + 2 fix attempts
  const mockAgent = {
    prompt: vi.fn().mockImplementation(async () => {
      agentPromptCount++;
      return JSON.stringify({ result: 'success', message: 'Fixed' });
    }),
  };
  (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

  // BashMCP state machine: fail Level 2 twice, then pass
  vi.spyOn(BashMCP.prototype, 'execute_bash').mockImplementation(async ({ command }: any) => {
    validationRunCount++;
    // First run: Level 1 pass, Level 2 fail
    if (validationRunCount === 2) {
      return { success: false, stdout: '', stderr: 'Test failed', exitCode: 1 };
    }
    // Second run: Level 2 fail again
    if (validationRunCount === 5) {
      return { success: false, stdout: '', stderr: 'Test failed', exitCode: 1 };
    }
    // Third run: all pass
    return { success: true, stdout: '', stderr: '', exitCode: 0 };
  });

  const executor = new PRPExecutor(process.cwd());

  // EXECUTE
  const result = await executor.execute(prp, '/tmp/test.md');

  // VERIFY: Retried 2 times
  expect(result.fixAttempts).toBe(2);
  expect(result.success).toBe(true);
  expect(agentPromptCount).toBe(3); // Initial + 2 fix attempts
});

// PATTERN: Error context verification
it('should provide error context to agent on retry', async () => {
  // SETUP
  const { PRPExecutor } = require('../../src/agents/prp-executor.js');
  const prp = createMockPRPDocument('P1.M2.T2.S2');

  let fixPromptReceived = '';
  const mockAgent = {
    prompt: vi.fn().mockImplementation(async (prompt: string) => {
      if (prompt.includes('Fix Attempt')) {
        fixPromptReceived = prompt;
      }
      return JSON.stringify({ result: 'success', message: 'Fixed' });
    }),
  };
  (gs.createAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

  vi.spyOn(BashMCP.prototype, 'execute_bash').mockImplementation(async ({ command }: any) => {
    if (command.includes('Level 2')) {
      return { success: false, stdout: 'test stdout', stderr: 'test stderr', exitCode: 1 };
    }
    return { success: true, stdout: '', stderr: '', exitCode: 0 };
  });

  const executor = new PRPExecutor(process.cwd());

  // EXECUTE
  await executor.execute(prp, '/tmp/test.md');

  // VERIFY: Fix prompt contains error details
  expect(fixPromptReceived).toContain('Level 2');
  expect(fixPromptReceived).toContain('test stdout');
  expect(fixPromptReceived).toContain('test stderr');
  expect(fixPromptReceived).toContain('Fix Attempt: 1/2');
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN TESTS:
  - Tests use mocks for agent.prompt() calls
  - Tests use real BashMCP for validation command execution
  - Focus on Coder Agent configuration and PRP executor behavior
  - Mock Groundswell agent.prompt() calls

MOCK INTEGRATIONS:
  - Mock: groundswell (createAgent) - control agent creation
  - Mock: agent.prompt() - control LLM responses (avoid real API calls)
  - Real: src/agents/agent-factory.js (test real factory)
  - Real: src/agents/prompts.js (import real PRP_BUILDER_PROMPT)
  - Real: src/agents/prp-executor.ts (test real executor)
  - Real: src/tools/bash-mcp.js (test real BashMCP)

DEPENDENCY ON PREVIOUS WORK ITEMS:
  - P1.M1.T3.S1 provides Architect Agent integration test patterns
  - P1.M1.T3.S2 provides Researcher Agent integration test patterns
  - Reference for mock setup and validation patterns

PARALLEL CONTEXT:
  - P1.M1.T3.S2 (Verify Researcher Agent and PRP generation) - running in parallel
  - That PRP tests Researcher Agent configuration
  - This PRP tests Coder Agent configuration
  - No overlap or conflict in test coverage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/coder-agent.test.ts
# OR
npx eslint tests/integration/coder-agent.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- tests/integration/coder-agent.test.ts
# OR
npx vitest run tests/integration/coder-agent.test.ts

# Run with coverage
npm test -- --coverage tests/integration/coder-agent.test.ts

# Run all agent-related tests to ensure no breakage
npm test -- tests/unit/agents/agent-factory.test.ts
npm test -- tests/unit/agents/prp-executor.test.ts
npm test -- tests/integration/prp-executor-integration.test.ts

# Expected: All tests pass, good coverage for Coder Agent configuration
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full integration test suite still passes
npm test -- tests/integration/
# OR
npx vitest run tests/integration/

# Check that existing tests still work
npx vitest run tests/integration/groundswell/
npx vitest run tests/integration/agents.test.ts

# Expected: All existing integration tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/coder-agent.test.ts

# Check test file follows project conventions
head -100 tests/integration/coder-agent.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/integration/coder-agent.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage for Coder Agent configuration
npm test -- --coverage tests/integration/coder-agent.test.ts
# Should see coverage for createCoderAgent, PRP executor, validation gates

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npm test -- tests/integration/coder-agent.test.ts`
- [ ] No linting errors: `npm run lint tests/integration/coder-agent.test.ts`
- [ ] Coverage shows Coder Agent configuration tested
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] Coder Agent configuration verified (GLM-4.7, 4096, cache, reflection, MCP tools)
- [ ] PRP_BUILDER_PROMPT contains Execution Process section (5 steps)
- [ ] PRP_BUILDER_PROMPT contains Progressive Validation section (4 levels)
- [ ] PRP_BUILDER_PROMPT specifies JSON output format (result, message)
- [ ] PRP executor injects PRP path ($PRP_FILE_PATH placeholder)
- [ ] Progressive validation runs sequentially (1 → 2 → 3 → 4)
- [ ] Stop-on-fail behavior verified
- [ ] Manual gates skipped automatically
- [ ] Fix-and-retry retries up to 2 times
- [ ] Exponential backoff verified (2s, 4s, capped at 30s)
- [ ] Error context provided on retry
- [ ] BashMCP executes commands with 120s timeout
- [ ] BashMCP captures stdout/stderr/exitCode
- [ ] Validation results have correct structure
- [ ] JSON parsing handles raw and markdown-wrapped JSON

### Code Quality Validation

- [ ] Follows existing integration test patterns from agent-prompt.test.ts
- [ ] Uses SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.mock for Groundswell (not agent-factory)
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes vi.unstubAllEnvs()
- [ ] Tests use dynamic import pattern for Groundswell
- [ ] State machines used for fix-and-retry scenarios

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Complex validations (progressive validation, retry) have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Documentation of validation gate system

---

## Anti-Patterns to Avoid

- ❌ Don't mock createCoderAgent - test the real factory function
- ❌ Don't mock BashMCP - use real BashMCP for validation execution
- ❌ Don't test unit-level behavior - focus on integration scenarios
- ❌ Don't use real LLM calls - always use mocks for deterministic testing
- ❌ Don't skip vi.unstubAllEnvs() in afterEach
- ❌ Don't use setTimeout without proper waiting/awaiting
- ❌ Don't forget to validate both configuration AND prompt content
- ❌ Don't test aspirational features as implemented - verify prompt contains instructions
- ❌ Don't duplicate existing tests from prp-executor-integration.test.ts
- ❌ Don't test LLM output quality - focus on configuration and execution flow
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't hardcode configuration values - use imports from source
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific
- ❌ Don't forget to verify sequential order in validation tests
- ❌ Don't mock the entire agent-factory - mock Groundswell instead
- ❌ Don't skip testing the critical "Load PRP first" instruction
- ❌ Don't forget to test manual gate skipping behavior
- ❌ Don't test state machines without proper call counting
- ❌ Don't use fake timers for timeout tests - use real timers

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T3.S3
**Created:** 2026-01-19
**Status:** Ready for Implementation
