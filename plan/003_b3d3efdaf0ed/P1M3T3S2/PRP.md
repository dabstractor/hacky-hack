# Product Requirement Prompt (PRP): P1.M3.T3.S2 - Verify progressive validation levels

---

## Goal

**Feature Goal**: Create an integration test file that verifies the 4-level progressive validation system in PRP_BUILDER_PROMPT works as specified, ensuring each validation level executes sequentially, fails appropriately, and triggers the fix cycle with retry logic.

**Deliverable**: Integration test file `tests/integration/progressive-validation.test.ts` with comprehensive verification of:

- Level 1 (Syntax & Style): Linting/formatting tool execution and error detection
- Level 2 (Unit Tests): Unit test execution with coverage enforcement
- Level 3 (Integration Tests): Integration testing validation
- Level 4 (Creative & Domain-Specific): MCP tools, performance, security validation
- Sequential progression: Each level must pass before proceeding to next
- Fix cycle: Failure triggers retry with exponential backoff (max 2 attempts)
- Mock validation commands and results throughout

**Success Definition**: All tests pass, verifying:

- PRP_BUILDER_PROMPT contains all 4 validation level specifications
- Each level has clear execution commands and validation criteria
- "Each level must pass before proceeding" instruction is present
- Failure protocol instructions include fix cycle with retry logic
- Mock patterns for BashMCP command execution work correctly
- Validation gate stopping behavior on failure is verified
- Retry logic with exponential backoff (2s, 4s, max 30s) is tested

## Why

- **PRP Execution Contract Verification**: Validates that the PRP_BUILDER_PROMPT properly specifies the 4-level validation system as defined in system_context.md
- **Quality Assurance**: Ensures progressive validation catches errors early (Level 1) before progressing to more expensive tests (Levels 2-4)
- **Fix Cycle Validation**: Verifies that validation failures trigger appropriate fix-and-retry behavior, not immediate failure
- **Regression Prevention**: Catches regressions in the PRP execution prompt structure that could break the progressive validation contract
- **Complementary to P1M3T3S1**: P1M3T3S1 verifies the prompt's process flow structure; this subtask (P1M3T3S2) verifies the validation level specifications within that flow

**Critical Gap**: While `tests/integration/prp-execute-prompt.test.ts` (P1M3T3S1) verifies the overall process flow structure, it does not comprehensively verify:

- The specific 4-level validation system specifications
- Sequential progression requirements ("Each level must pass before proceeding")
- Fix cycle retry logic with exponential backoff
- Mock validation command patterns for testing PRP executor behavior

## What

Integration tests that verify the PRP_BUILDER_PROMPT progressive validation system specifications, ensuring 4-level validation with sequential progression and fix cycle retry logic.

### Success Criteria

- [ ] PRP_BUILDER_PROMPT contains Level 1 (Syntax & Style) specifications
- [ ] PRP_BUILDER_PROMPT contains Level 2 (Unit Tests) specifications
- [ ] PRP_BUILDER_PROMPT contains Level 3 (Integration Tests) specifications
- [ ] PRP_BUILDER_PROMPT contains Level 4 (Creative & Domain-Specific) specifications
- [ ] Prompt specifies "Each level must pass before proceeding to the next"
- [ ] Failure Protocol includes fix cycle instructions with retry logic
- [ ] Tests follow integration test patterns from `tests/integration/`
- [ ] Mock patterns for BashMCP command execution are tested
- [ ] Sequential progression (stop on failure) is verified
- [ ] Retry logic with exponential backoff is tested

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Complete PRP_BUILDER_PROMPT content from `src/agents/prompts.ts`
- PRPExecutor validation gate implementation from `src/agents/prp-executor.ts`
- System context progressive validation specifications from `plan/003_b3d3efdaf0ed/docs/system_context.md`
- Existing integration test patterns from `tests/integration/prp-execute-prompt.test.ts` (P1M3T3S1)
- PRP executor integration test patterns from `tests/integration/prp-executor-integration.test.ts`
- ValidationGate interface from `src/core/models.ts`
- Mock patterns for BashMCP and agent factory

### Documentation & References

```yaml
# MUST READ - PRP_BUILDER_PROMPT constant with validation level specs
- file: src/agents/prompts.ts
  why: Contains PRP_BUILDER_PROMPT with all 4 validation levels and failure protocol
  lines: 614-685 (PRP_BUILDER_PROMPT constant)
  pattern: Progressive validation section with Level 1-4 specifications
  gotcha: Uses $PRP_FILE_PATH placeholder for PRP path injection

# MUST READ - PRPExecutor validation gate implementation
- file: src/agents/prp-executor.ts
  why: Shows how validation gates are executed sequentially with fix cycle
  lines: 335-396 (#runValidationGates method), 271-299 (fix-and-retry loop)
  pattern: Sort gates by level, execute sequentially, break on first failure
  gotcha: Skips manual gates (level 4 typically) and gates with null command
  gotcha: Max 2 fix attempts with exponential backoff (2s, 4s, max 30s)

# MUST READ - System context progressive validation specification
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Defines the 4-level validation system contract
  section: "Progressive Validation System" (Level 1-4 descriptions, Fix Cycle)
  pattern: Each level builds on previous, failure stops chain, fix cycle with retry
  gotcha: Level 4 can be manual validation without commands

# MUST READ - Related subtask test for process flow (P1M3T3S1)
- file: tests/integration/prp-execute-prompt.test.ts
  why: Reference pattern for testing PRP_BUILDER_PROMPT content structure
  lines: 148-177 (Progressive Validation test suite)
  pattern: describe blocks for each validation level, string containment assertions
  gotcha: Tests verify prompt content, not actual execution behavior

# MUST READ - PRP executor integration test patterns
- file: tests/integration/prp-executor-integration.test.ts
  why: Shows how to test validation gate execution with mocked BashMCP
  lines: 77-196 (describe blocks with real BashMCP execution)
  pattern: Mock agent factory, create mock PRP with validationGates, verify results
  gotcha: Uses createCoderAgent mock to avoid LLM calls
  gotcha: Tests capture stdout/stderr from actual BashMCP command execution

# MUST READ - ValidationGate interface definition
- file: src/core/models.ts
  why: Defines the structure of validation gates used in PRP documents
  lines: 1000-1044 (ValidationGate interface)
  pattern: level (1-4), description, command (string | null), manual (boolean)
  gotcha: command can be null for manual validation, manual=true skips execution

# MUST READ - BashMCP tool for command execution
- file: src/tools/bash-mcp.ts
  why: Shows how validation commands are executed safely
  lines: 131-241 (executeBashCommand function)
  pattern: Uses spawn() with argument arrays to prevent shell injection
  gotcha: 2-minute timeout for validation commands (configurable)

# MUST READ - Agent factory mock patterns
- file: tests/integration/prp-executor-integration.test.ts
  why: Shows how to mock createCoderAgent to avoid LLM calls
  lines: 16-32 (vi.mock setup), 79-87 (beforeEach mock setup)
  pattern: vi.mock with factory, mockReturnValue for agent instances
  gotcha: Must mock before imports (hoisting required by vi.mock)

# MUST READ - Integration test file patterns
- file: tests/integration/prp-pipeline-integration.test.ts
  why: Reference for integration test structure and patterns
  lines: 1-100+ (full test file structure)
  pattern: describe/it blocks, SETUP/EXECUTE/VERIFY comments, mock factory
  gotcha: Integration tests can use real dependencies (BashMCP) with mocked agents
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   ├── prp-execute-prompt.test.ts          # P1M3T3S1: Process flow verification
│   ├── prp-executor-integration.test.ts    # Reference: Validation gate execution patterns
│   ├── prp-pipeline-integration.test.ts    # Reference: Integration test structure
│   └── progressive-validation.test.ts      # NEW: This PRP's deliverable
│
└── unit/
    ├── agents/
    │   └── prompts.test.ts                 # Reference: Prompt testing patterns
    └── core/
        └── models.test.ts                  # ValidationGate schema tests

src/
├── agents/
│   ├── prompts.ts                          # Lines 614-685: PRP_BUILDER_PROMPT
│   ├── prp-executor.ts                     # Lines 335-396: #runValidationGates
│   └── agent-factory.ts                    # createCoderAgent function
├── tools/
│   └── bash-mcp.ts                         # Lines 131-241: executeBashCommand
└── core/
    └── models.ts                           # Lines 1000-1044: ValidationGate interface

plan/003_b3d3efdaf0ed/
├── docs/
│   └── system_context.md                   # Progressive validation system contract
└── P1M3T3S2/
    ├── PRP.md                              # This file
    └── research/                           # Research documents
```

### Desired Codebase Tree (new test file structure)

```bash
tests/integration/progressive-validation.test.ts   # NEW: Progressive validation tests
├── File header with JSDoc comments
├── Import statements (vitest, PRP_BUILDER_PROMPT, PRPExecutor, etc.)
├── vi.mock for agent-factory (to avoid LLM calls)
│
├── describe('integration: agents/prp-builder-prompt > progressive validation levels')
│   ├── describe('Level 1: Syntax & Style')
│   │   ├── it('should contain Level 1 validation specifications')
│   │   ├── it('should specify linting and formatting tools')
│   │   └── it('should require immediate feedback')
│   │
│   ├── describe('Level 2: Unit Tests')
│   │   ├── it('should contain Level 2 validation specifications')
│   │   ├── it('should specify unit test execution')
│   │   └── it('should enforce coverage thresholds')
│   │
│   ├── describe('Level 3: Integration Tests')
│   │   ├── it('should contain Level 3 validation specifications')
│   │   ├── it('should specify integration testing')
│   │   └── it('should validate system-level behavior')
│   │
│   ├── describe('Level 4: Creative & Domain-Specific')
│   │   ├── it('should contain Level 4 validation specifications')
│   │   ├── it('should specify MCP tool validation')
│   │   └── it('should include performance and security checks')
│   │
│   └── describe('sequential progression requirement')
│       ├── it('should specify each level must pass before proceeding')
│       └── it('should emphasize stopping on first failure')
│
├── describe('integration: agents/prp-builder-prompt > failure protocol')
│   ├── describe('fix cycle specifications')
│   │   ├── it('should include fix cycle instructions in Failure Protocol')
│   │   ├── it('should specify max 2 retry attempts')
│   │   └── it('should specify exponential backoff delays')
│   │
│   └── describe('error context for fixes')
│       └── it('should instruct to use patterns from PRP to fix issues')
│
├── describe('integration: prp-executor > validation gate execution')
│   ├── beforeEach: Setup mock agent and PRPExecutor
│   │
│   ├── describe('sequential execution with mocked BashMCP')
│   │   ├── it('should execute Level 1 then Level 2 then Level 3')
│   │   ├── it('should stop on first failure and not execute remaining levels')
│   │   └── it('should skip manual validation gates')
│   │
│   ├── describe('fix cycle with retry logic')
│   │   ├── it('should trigger fix attempt on validation failure')
│   │   ├── it('should retry validation after fix attempt')
│   │   ├── it('should use exponential backoff (2s, 4s, max 30s)')
│   │   └── it('should stop after max 2 fix attempts')
│   │
│   └── describe('validation result tracking')
│       ├── it('should capture stdout and stderr from commands')
│       ├── it('should record exit codes for failed gates')
│       └── it('should mark skipped gates with skipped=true')
│
└── describe('integration: prp-builder-prompt > sample output logging')
    └── it('should log progressive validation specifications for inspection')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: PRP_BUILDER_PROMPT uses $PRP_FILE_PATH placeholder
// From src/agents/prompts.ts line 614
export const PRP_BUILDER_PROMPT = `
# Execute BASE PRP

## PRP File: (path provided below)
...
`;
// GOTCHA: The placeholder is replaced in PRPExecutor.execute() with actual PRP path
// GOTCHA: In tests, verify the placeholder exists, not the actual path

// CRITICAL: Validation levels are defined in "Progressive Validation" section
// From src/agents/prompts.ts lines around 148-177
// Contains:
// **Level 1**: syntax & style validation
// **Level 2**: unit test validation
// **Level 3**: integration testing
// **Level 4**: Execute specified validation from PRP
// GOTCHA: Each level is specified with **Level X** markdown format

// CRITICAL: "Each level must pass before proceeding" is key contract
// From src/agents/prompts.ts
expect(PRP_BUILDER_PROMPT).toContain('Each level must pass before proceeding to the next');
// GOTCHA: This exact phrase (or close variant) must be present for sequential validation

// CRITICAL: Failure Protocol includes fix cycle instructions
// From src/agents/prompts.ts
expect(PRP_BUILDER_PROMPT).toContain('**Failure Protocol**');
expect(PRP_BUILDER_PROMPT).toContain('use the patterns and gotchas from the PRP to fix issues');
expect(PRP_BUILDER_PROMPT).toContain('re-run validation until passing');
// GOTCHA: Fix instructions are in Failure Protocol section

// CRITICAL: PRPExecutor sorts gates by level before execution
// From src/agents/prp-executor.ts lines 338-341
const sortedGates = [...prp.validationGates].sort((a, b) => a.level - b.level);
// GOTCHA: Gates execute in order 1 -> 2 -> 3 -> 4 regardless of PRP order

// CRITICAL: PRPExecutor stops sequential execution on first failure
// From src/agents/prp-executor.ts lines 379-392
if (!gateResult.success) {
  this.#logger.error({ level, description, command, exitCode, stderr }, 'Validation gate failed');
  break; // Stop sequential execution on first failure
}
// GOTCHA: Level 2 failure means Level 3 and 4 never execute

// CRITICAL: Fix cycle uses exponential backoff with max delay
// From src/agents/prp-executor.ts line 287
const delay = Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000);
// GOTCHA: Delay sequence: 2s (attempt 1), 4s (attempt 2), max 30s cap

// CRITICAL: Max fix attempts is 2 (1 initial + 2 retries = 3 total)
// From src/agents/prp-executor.ts line 240
const maxFixAttempts = 2;
// GOTCHA: After 3 total validation runs (1 initial + 2 retries), system gives up

// CRITICAL: Manual gates are skipped automatically
// From src/agents/prp-executor.ts lines 344-357
if (gate.manual || gate.command === null) {
  results.push({ /* marked as skipped */ });
  continue;
}
// GOTCHA: Level 4 gates with manual=true never execute commands

// CRITICAL: Mock agent factory must be before imports
// From tests/integration/prp-executor-integration.test.ts lines 16-31
vi.mock('../../src/agents/agent-factory.js', () => ({
  createCoderAgent: vi.fn(),
}));
// GOTCHA: vi.mock must be at top level before import statements

// CRITICAL: Mock agent setup pattern
// From tests/integration/prp-executor-integration.test.ts lines 79-87
beforeEach(() => {
  mockAgent = {
    prompt: vi.fn(),
  };
  mockCreateCoderAgent.mockReturnValue(mockAgent);
});
// GOTCHA: Reset mocks in beforeEach, clear in afterEach

// CRITICAL: Mock PRP document factory
// From tests/integration/prp-executor-integration.test.ts lines 36-75
const createMockPRPDocument = (
  taskId: string,
  validationGates?: PRPDocument['validationGates']
): PRPDocument => ({
  taskId,
  objective: 'Implement feature X',
  context: '## Context\nFull context here',
  implementationSteps: ['Step 1', 'Step 2'],
  validationGates: validationGates ?? [/* default 4-level gates */],
  successCriteria: [{ description: 'Feature works', satisfied: false }],
  references: ['https://example.com/docs'],
});
// GOTCHA: validationGates can be overridden for specific test scenarios

// CRITICAL: Mock agent response must be valid JSON
// From tests/integration/prp-executor-integration.test.ts lines 100-105
mockAgent.prompt.mockResolvedValue(
  JSON.stringify({
    result: 'success',
    message: 'Implementation complete',
  })
);
// GOTCHA: JSON string format expected, not plain object

// CRITICAL: Integration tests use real BashMCP with mock agent
// From tests/integration/prp-executor-integration.test.ts
const executor = new PRPExecutor(sessionPath);
// GOTCHA: BashMCP is real (executes actual shell commands), agent is mocked
// GOTCHA: Use 'echo' and 'false' commands for safe testing

// CRITICAL: Test timeout for slow operations
// From tests/integration/prp-executor-integration.test.ts line 195
it('should handle validation gate failure', async () => {
  // ...
}, { timeout: 10000 }); // 10 second timeout
// GOTCHA: Fix cycle tests with retries need longer timeout

// CRITICAL: Verify validation gate results structure
// From src/agents/prp-executor.ts lines 38-55
export interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly success: boolean;
  readonly command: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly skipped: boolean;
}
// GOTCHA: All fields must be verified in tests

// CRITICAL: Vitest import statement
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// GOTCHA: Must import all used vitest functions explicitly

// CRITICAL: Import paths must use .js extensions
import { PRPExecutor } from '../../src/agents/prp-executor.js';
import type { PRPDocument, ValidationGate } from '../../src/core/models.js';
// GOTCHA: TypeScript files use .js extension in imports

// CRITICAL: Expected test file location
// File: tests/integration/progressive-validation.test.ts
// GOTCHA: Integration tests go in tests/integration/, not tests/unit/

// CRITICAL: Test naming convention
describe('integration: agents/prp-builder-prompt > progressive validation levels', () => {
  // GOTCHA: Use "integration:" prefix and describe full test path

// CRITICAL: String containment assertions for prompt content
it('should define Level 1: syntax & style validation', () => {
  expect(PRP_BUILDER_PROMPT).toContain('**Level 1**');
  expect(PRP_BUILDER_PROMPT).toContain('syntax & style validation');
});
// GOTCHA: Use .toContain() for substring matching
```

## Implementation Blueprint

### Data Models and Structure

The tests use existing models from the codebase:

```typescript
// From src/core/models.ts
interface PRPDocument {
  taskId: string;
  objective: string;
  context: string;
  implementationSteps: string[];
  validationGates: ValidationGate[];
  successCriteria: SuccessCriterion[];
  references: string[];
}

interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly command: string | null;
  readonly manual: boolean;
}

interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly success: boolean;
  readonly command: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly skipped: boolean;
}

interface ExecutionResult {
  readonly success: boolean;
  readonly validationResults: ValidationGateResult[];
  readonly artifacts: string[];
  readonly error?: string;
  readonly fixAttempts: number;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/integration/progressive-validation.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPLEMENT: Import statements (vitest, PRP_BUILDER_PROMPT, models, etc.)
  - IMPLEMENT: vi.mock for agent-factory module
  - IMPLEMENT: Top-level describe block structure
  - IMPLEMENT: afterEach cleanup for mocks
  - FOLLOW pattern: tests/integration/prp-execute-prompt.test.ts
  - NAMING: progressive-validation.test.ts
  - PLACEMENT: tests/integration/ directory
  - DEPENDENCIES: None (first task)

Task 2: IMPLEMENT prompt content verification tests (Level 1-4)
  - ADD: describe('progressive validation levels')
  - IMPLEMENT: describe('Level 1: Syntax & Style')
    - IMPLEMENT: it('should contain Level 1 validation specifications')
      - VERIFY: PRP_BUILDER_PROMPT contains '**Level 1**'
      - VERIFY: PRP_BUILDER_PROMPT contains 'syntax & style validation'
    - IMPLEMENT: it('should specify linting and formatting tools')
      - VERIFY: Mentions tools like ruff, eslint, prettier, mypy
    - IMPLEMENT: it('should require immediate feedback')
      - VERIFY: Mentions immediate feedback or fast execution
  - IMPLEMENT: describe('Level 2: Unit Tests')
    - IMPLEMENT: it('should contain Level 2 validation specifications')
      - VERIFY: PRP_BUILDER_PROMPT contains '**Level 2**'
      - VERIFY: PRP_BUILDER_PROMPT contains 'unit test validation'
    - IMPLEMENT: it('should specify unit test execution')
      - VERIFY: Mentions pytest, jest, vitest, or similar
    - IMPLEMENT: it('should enforce coverage thresholds')
      - VERIFY: Mentions coverage requirements or thresholds
  - IMPLEMENT: describe('Level 3: Integration Tests')
    - IMPLEMENT: it('should contain Level 3 validation specifications')
      - VERIFY: PRP_BUILDER_PROMPT contains '**Level 3**'
      - VERIFY: PRP_BUILDER_PROMPT contains 'integration testing'
    - IMPLEMENT: it('should specify integration testing')
      - VERIFY: Mentions API endpoints, service integration
    - IMPLEMENT: it('should validate system-level behavior')
      - VERIFY: Mentions system validation or end-to-end tests
  - IMPLEMENT: describe('Level 4: Creative & Domain-Specific')
    - IMPLEMENT: it('should contain Level 4 validation specifications')
      - VERIFY: PRP_BUILDER_PROMPT contains '**Level 4**'
      - VERIFY: PRP_BUILDER_PROMPT contains 'Execute specified validation from PRP'
    - IMPLEMENT: it('should specify MCP tool validation')
      - VERIFY: Mentions MCP tools or domain-specific validation
    - IMPLEMENT: it('should include performance and security checks')
      - VERIFY: Mentions performance benchmarks or security scanning
  - FOLLOW pattern: tests/integration/prp-execute-prompt.test.ts lines 148-177
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test suite

Task 3: IMPLEMENT sequential progression verification tests
  - ADD: describe('sequential progression requirement')
  - IMPLEMENT: it('should specify each level must pass before proceeding')
    - VERIFY: PRP_BUILDER_PROMPT contains 'Each level must pass before proceeding'
    - VERIFY: Mentions sequential execution or ordering
  - IMPLEMENT: it('should emphasize stopping on first failure')
    - VERIFY: Mentions stopping on failure or fail-fast behavior
  - SETUP: Use string containment assertions
  - FOLLOW pattern: tests/integration/prp-execute-prompt.test.ts line 174-176
  - DEPENDENCIES: Task 2 (level tests)
  - PLACEMENT: After level tests

Task 4: IMPLEMENT failure protocol verification tests
  - ADD: describe('failure protocol')
  - ADD: describe('fix cycle specifications')
    - IMPLEMENT: it('should include fix cycle instructions in Failure Protocol')
      - VERIFY: PRP_BUILDER_PROMPT contains '**Failure Protocol**'
      - VERIFY: Mentions fix cycle or retry logic
    - IMPLEMENT: it('should specify max 2 retry attempts')
      - VERIFY: Mentions max attempts or retry limit
    - IMPLEMENT: it('should specify exponential backoff delays')
      - VERIFY: Mentions backoff or delay between retries
  - ADD: describe('error context for fixes')
    - IMPLEMENT: it('should instruct to use patterns from PRP to fix issues')
      - VERIFY: Mentions using PRP patterns for fixes
      - VERIFY: Mentions re-running validation until passing
  - SETUP: Use string assertions for prompt content
  - FOLLOW pattern: tests/integration/prp-execute-prompt.test.ts lines 205-226
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: After progression tests

Task 5: IMPLEMENT PRPExecutor integration tests with mocked BashMCP
  - ADD: describe('integration: prp-executor > validation gate execution')
  - SETUP: beforeEach to create mockAgent and PRPExecutor
  - SETUP: Create createMockPRPDocument helper function
  - SETUP: Mock createCoderAgent to return mockAgent
  - ADD: afterEach to clear mocks
  - IMPLEMENT: describe('sequential execution with mocked BashMCP')
    - SETUP: Create PRP with 4 validation gates (all passing)
    - IMPLEMENT: it('should execute Level 1 then Level 2 then Level 3')
      - SETUP: Mock agent.prompt to return success JSON
      - EXECUTE: await executor.execute(prp, prpPath)
      - VERIFY: result.validationResults has 4 entries
      - VERIFY: Level 1, 2, 3 executed in order
    - IMPLEMENT: it('should stop on first failure and not execute remaining levels')
      - SETUP: Create PRP where Level 2 fails (command: 'false')
      - EXECUTE: await executor.execute(prp, prpPath)
      - VERIFY: Level 1 passed, Level 2 failed
      - VERIFY: Level 3 and 4 were not executed (skipped or absent)
    - IMPLEMENT: it('should skip manual validation gates')
      - SETUP: Create PRP with Level 4 manual=true
      - EXECUTE: await executor.execute(prp, prpPath)
      - VERIFY: Level 4 has skipped=true
      - VERIFY: Level 4 has stdout='', stderr='', exitCode=null
  - SETUP: Import PRPExecutor, PRPDocument, ValidationGate types
  - FOLLOW pattern: tests/integration/prp-executor-integration.test.ts lines 77-224
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: Second main test suite (after prompt content tests)

Task 6: IMPLEMENT fix cycle retry logic tests
  - ADD: describe('fix cycle with retry logic')
  - SETUP: Create PRP with failing Level 2 gate
  - IMPLEMENT: it('should trigger fix attempt on validation failure')
    - SETUP: Mock agent.prompt twice (initial + fix attempt)
    - SETUP: First call returns error, second returns success
    - EXECUTE: await executor.execute(prp, prpPath)
    - VERIFY: agent.prompt called 2 times (initial + 1 fix)
    - VERIFY: result.fixAttempts === 1
  - IMPLEMENT: it('should retry validation after fix attempt')
    - SETUP: Mock agent to return success on second call
    - EXECUTE: await executor.execute(prp, prpPath)
    - VERIFY: After fix, all validation gates pass
  - IMPLEMENT: it('should use exponential backoff (2s, 4s, max 30s)')
    - SETUP: Create spy on setTimeout or measure actual delays
    - EXECUTE: await executor.execute with 2 fix attempts
    - VERIFY: Delays follow exponential pattern (2s, 4s, max 30s)
  - IMPLEMENT: it('should stop after max 2 fix attempts')
    - SETUP: Mock agent to always return failure
    - EXECUTE: await executor.execute(prp, prpPath)
    - VERIFY: result.fixAttempts === 2 (max attempts)
    - VERIFY: result.success === false
  - SETUP: Use vi.useFakeTimers() for timing tests if needed
  - FOLLOW pattern: tests/integration/prp-executor-integration.test.ts (retry behavior)
  - DEPENDENCIES: Task 5 (executor integration tests)
  - PLACEMENT: After sequential execution tests

Task 7: IMPLEMENT validation result tracking tests
  - ADD: describe('validation result tracking')
  - IMPLEMENT: it('should capture stdout and stderr from commands')
    - SETUP: Create PRP with commands that output to stdout/stderr
    - EXECUTE: await executor.execute(prp, prpPath)
    - VERIFY: Each result has stdout and stderr populated
  - IMPLEMENT: it('should record exit codes for failed gates')
    - SETUP: Create PRP with failing command
    - EXECUTE: await executor.execute(prp, prpPath)
    - VERIFY: Failed gate has exitCode !== 0
  - IMPLEMENT: it('should mark skipped gates with skipped=true')
    - SETUP: Create PRP with manual=true gate
    - EXECUTE: await executor.execute(prp, prpPath)
    - VERIFY: Manual gate has skipped=true, success=true
  - SETUP: Use echo commands for stdout, 'false' for failures
  - FOLLOW pattern: tests/integration/prp-executor-integration.test.ts lines 280-327
  - DEPENDENCIES: Task 5 (executor integration tests)
  - PLACEMENT: After fix cycle tests

Task 8: IMPLEMENT sample output logging test
  - ADD: describe('sample output logging')
  - IMPLEMENT: it('should log progressive validation specifications for inspection')
    - LOG: PRP_BUILDER_PROMPT length
    - LOG: Contains Level 1 verification
    - LOG: Contains Level 2 verification
    - LOG: Contains Level 3 verification
    - LOG: Contains Level 4 verification
    - LOG: Contains sequential progression requirement
    - LOG: Contains failure protocol with fix cycle
    - VERIFY: All assertions pass
  - SETUP: Use console.log for test output
  - FOLLOW pattern: tests/integration/prp-execute-prompt.test.ts lines 253-284
  - DEPENDENCIES: All previous tasks
  - PLACEMENT: Final test suite

Task 9: VERIFY test completeness and run tests
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Mock patterns match existing integration tests
  - VERIFY: All 4 validation levels covered
  - VERIFY: Sequential progression tested
  - VERIFY: Fix cycle with retry logic tested
  - VERIFY: Manual gate skipping tested
  - RUN: npx vitest run tests/integration/progressive-validation.test.ts
  - VERIFY: All tests pass
  - DOCUMENT: Any implementation gaps discovered
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Integration test for Progressive Validation Levels in PRP_BUILDER_PROMPT
 *
 * @remarks
 * Tests validate the 4-level progressive validation system specified in
 * PRP_BUILDER_PROMPT, ensuring:
 * - Level 1 (Syntax & Style): Linting/formatting validation
 * - Level 2 (Unit Tests): Unit test execution with coverage
 * - Level 3 (Integration Tests): System-level validation
 * - Level 4 (Creative & Domain-Specific): MCP tools, performance, security
 * - Sequential progression: Each level must pass before proceeding
 * - Fix cycle: Failure triggers retry with exponential backoff
 *
 * This integration test validates:
 * - Prompt content specifications for all 4 levels
 * - PRPExecutor execution behavior with mocked BashMCP
 * - Sequential progression and stop-on-failure behavior
 * - Fix cycle with exponential backoff (max 2 attempts)
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/agents/prompts.ts | PRP_BUILDER_PROMPT}
 * @see {@link ../../src/agents/prp-executor.ts | PRPExecutor}
 * @see {@link ../../../plan/003_b3d3efdaf0ed/docs/system_context.md | System Context}
 */

// PATTERN: Import statements
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRP_BUILDER_PROMPT } from '../../src/agents/prompts.js';
import { PRPExecutor } from '../../src/agents/prp-executor.js';
import type { PRPDocument, ValidationGate } from '../../src/core/models.js';

// PATTERN: Mock agent factory (must be before imports)
vi.mock('../../src/agents/agent-factory.js', () => ({
  createCoderAgent: vi.fn(),
}));

// PATTERN: Import after mock
import { createCoderAgent } from '../../src/agents/agent-factory.js';
const mockCreateCoderAgent = createCoderAgent as any;

// PATTERN: Helper function for mock PRP creation
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

// PATTERN: Test suite structure
describe('integration: agents/prp-builder-prompt > progressive validation levels', () => {
  // CLEANUP: Always restore mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Level 1: Syntax & Style', () => {
    it('should contain Level 1 validation specifications', () => {
      // VERIFY
      expect(PRP_BUILDER_PROMPT).toContain('**Level 1**');
      expect(PRP_BUILDER_PROMPT).toContain('syntax & style validation');
    });

    it('should specify linting and formatting tools', () => {
      // VERIFY
      expect(PRP_BUILDER_PROMPT).toMatch(/lint|format|ruff|eslint|prettier/i);
    });
  });

  // ... more describe/it blocks for each level
});

// PATTERN: PRPExecutor integration test structure
describe('integration: prp-executor > validation gate execution', () => {
  const sessionPath = process.cwd();
  let mockAgent: any;

  beforeEach(() => {
    // SETUP: Create mock agent
    mockAgent = {
      prompt: vi.fn(),
    };
    mockCreateCoderAgent.mockReturnValue(mockAgent);
  });

  afterEach(() => {
    // CLEANUP: Clear all mocks
    vi.clearAllMocks();
  });

  describe('sequential execution with mocked BashMCP', () => {
    it('should execute Level 1 then Level 2 then Level 3', async () => {
      // SETUP
      const prp = createMockPRPDocument('P1.M3.T3.S2');
      const prpPath = '/tmp/test-session/prps/P1M3T3S2.md';

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

      // VERIFY: All gates executed
      expect(result.validationResults).toHaveLength(4);

      // VERIFY: Sequential execution (Level 1, 2, 3, 4)
      const level1Result = result.validationResults.find(r => r.level === 1);
      const level2Result = result.validationResults.find(r => r.level === 2);
      const level3Result = result.validationResults.find(r => r.level === 3);

      expect(level1Result?.success).toBe(true);
      expect(level2Result?.success).toBe(true);
      expect(level3Result?.success).toBe(true);
    });

    it('should stop on first failure and not execute remaining levels', async () => {
      // SETUP: Level 2 will fail
      const customValidationGates: PRPDocument['validationGates'] = [
        {
          level: 1,
          description: 'Syntax check',
          command: 'echo "Level 1 passed"',
          manual: false,
        },
        {
          level: 2,
          description: 'Failing test',
          command: 'false', // Unix command that exits with code 1
          manual: false,
        },
        {
          level: 3,
          description: 'Integration tests',
          command: 'echo "Should not reach here"',
          manual: false,
        },
        {
          level: 4,
          description: 'Manual review',
          command: null,
          manual: true,
        },
      ];
      const prp = createMockPRPDocument('P1.M3.T3.S2', customValidationGates);
      const prpPath = '/tmp/test-session/prps/P1M3T3S2.md';

      mockAgent.prompt.mockResolvedValue(
        JSON.stringify({
          result: 'success',
          message: 'Implementation complete',
        })
      );

      const executor = new PRPExecutor(sessionPath);

      // EXECUTE
      const result = await executor.execute(prp, prpPath);

      // VERIFY: Level 2 failed and stopped execution
      expect(result.success).toBe(false);

      const level1Result = result.validationResults.find(r => r.level === 1);
      const level2Result = result.validationResults.find(r => r.level === 2);

      expect(level1Result?.success).toBe(true);
      expect(level2Result?.success).toBe(false);
      expect(level2Result?.exitCode).toBe(1);

      // Level 3 should not have executed (stopped on Level 2 failure)
      const level3Result = result.validationResults.find(
        r => r.level === 3 && !r.skipped
      );
      expect(level3Result).toBeUndefined();
    });
  });
});

// PATTERN: Sample output logging test
describe('sample output logging', () => {
  it('should log progressive validation specifications for inspection', () => {
    console.log('\n=== Progressive Validation Specifications ===');
    console.log('Prompt length:', PRP_BUILDER_PROMPT.length);

    console.log('\n=== Level 1: Syntax & Style ===');
    console.log(
      '✓ Contains **Level 1**:',
      PRP_BUILDER_PROMPT.includes('**Level 1**')
    );
    console.log(
      '✓ Contains syntax & style:',
      PRP_BUILDER_PROMPT.includes('syntax & style')
    );

    console.log('\n=== Level 2: Unit Tests ===');
    console.log(
      '✓ Contains **Level 2**:',
      PRP_BUILDER_PROMPT.includes('**Level 2**')
    );
    console.log(
      '✓ Contains unit test:',
      PRP_BUILDER_PROMPT.includes('unit test')
    );

    console.log('\n=== Level 3: Integration Tests ===');
    console.log(
      '✓ Contains **Level 3**:',
      PRP_BUILDER_PROMPT.includes('**Level 3**')
    );
    console.log(
      '✓ Contains integration:',
      PRP_BUILDER_PROMPT.includes('integration')
    );

    console.log('\n=== Level 4: Creative & Domain-Specific ===');
    console.log(
      '✓ Contains **Level 4**:',
      PRP_BUILDER_PROMPT.includes('**Level 4**')
    );
    console.log(
      '✓ Contains specified validation:',
      PRP_BUILDER_PROMPT.includes('Execute specified validation')
    );

    console.log('\n=== Sequential Progression ===');
    console.log(
      '✓ Contains sequential requirement:',
      PRP_BUILDER_PROMPT.includes('Each level must pass')
    );

    console.log('\n=== Failure Protocol ===');
    console.log(
      '✓ Contains Failure Protocol:',
      PRP_BUILDER_PROMPT.includes('**Failure Protocol**')
    );
    console.log(
      '✓ Contains fix cycle:',
      PRP_BUILDER_PROMPT.includes('fix issues')
    );

    // VERIFY: All assertions pass
    expect(PRP_BUILDER_PROMPT).toBeDefined();
  });
});
```

### Integration Points

```yaml
PROMPT_CONSTANTS:
  - PRP_BUILDER_PROMPT: System prompt for Coder Agent with validation specs
  - Location: src/agents/prompts.ts lines 614-685

EXECUTION_CLASSES:
  - PRPExecutor: Orchestrates PRP execution with validation
  - Location: src/agents/prp-executor.ts
  - Methods: execute(prp, prpPath), #runValidationGates(prp)

MODELS_AND_TYPES:
  - PRPDocument: Complete PRP structure with validationGates array
  - ValidationGate: Single gate definition (level, description, command, manual)
  - ValidationGateResult: Result from single gate execution
  - ExecutionResult: Overall execution result with all validation results

MOCK_PATTERNS:
  - vi.mock('../../src/agents/agent-factory.js'): Mock agent factory
  - mockAgent.prompt.mockResolvedValue(): Mock LLM responses
  - createMockPRPDocument(): Helper for creating test PRPs

TEST_UTILITIES:
  - Vitest: describe, it, expect, vi, beforeEach, afterEach
  - BashMCP: Real shell command execution (safe with echo/false)
  - Mock timing: vi.useFakeTimers() for retry delay tests

VALIDATION_BEHAVIOR:
  - Sequential execution: Level 1 -> 2 -> 3 -> 4
  - Stop on failure: Break loop on first failed gate
  - Manual gates: Skipped automatically (command === null or manual === true)
  - Fix cycle: Max 2 attempts with exponential backoff
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/integration/progressive-validation.test.ts --fix

# Check TypeScript types
npx tsc --noEmit tests/integration/progressive-validation.test.ts

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the progressive validation file
npx vitest run tests/integration/progressive-validation.test.ts

# Run with coverage
npx vitest run tests/integration/progressive-validation.test.ts --coverage

# Run all integration tests to ensure no breakage
npx vitest run tests/integration/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify related tests still pass
npx vitest run tests/integration/prp-execute-prompt.test.ts
npx vitest run tests/integration/prp-executor-integration.test.ts

# Verify prompt content tests
npx vitest run tests/unit/agents/prompts.test.ts

# Expected: All related tests pass
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/progressive-validation.test.ts

# Check test file follows project conventions
head -50 tests/integration/progressive-validation.test.ts
# Should see: JSDoc comments, describe blocks, proper imports

# Verify all test categories are present
grep -n "describe.*Level 1" tests/integration/progressive-validation.test.ts
grep -n "describe.*Level 2" tests/integration/progressive-validation.test.ts
grep -n "describe.*Level 3" tests/integration/progressive-validation.test.ts
grep -n "describe.*Level 4" tests/integration/progressive-validation.test.ts
grep -n "describe.*sequential" tests/integration/progressive-validation.test.ts
grep -n "describe.*failure protocol" tests/integration/progressive-validation.test.ts
grep -n "describe.*fix cycle" tests/integration/progressive-validation.test.ts

# Expected: Test file well-structured, all categories present
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] Test file structure follows project patterns
- [ ] Tests use vi.mock for agent factory
- [ ] Tests import with .js extensions
- [ ] All describe blocks have clear, descriptive names
- [ ] Helper functions use existing patterns
- [ ] Tests use SETUP/EXECUTE/VERIFY pattern

### Feature Validation

- [ ] PRP_BUILDER_PROMPT contains all 4 validation level specifications
- [ ] Each level (1-4) has clear description and validation criteria
- [ ] Sequential progression requirement is present and tested
- [ ] Failure protocol includes fix cycle instructions
- [ ] Fix cycle with exponential backoff is tested
- [ ] Mock validation commands work correctly
- [ ] Sequential execution stops on failure
- [ ] Manual gates are skipped appropriately
- [ ] Retry logic with max 2 attempts is verified
- [ ] Validation result tracking is complete

### Code Quality Validation

- [ ] Follows existing integration test patterns from tests/integration/
- [ ] Helper functions match patterns from existing tests
- [ ] Test file location matches conventions (tests/integration/)
- [ ] Tests verify both prompt content and execution behavior
- [ ] Mock data matches real PRP document structure

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Test names clearly describe what is being tested
- [ ] Complementary to P1M3T3S1 (process flow) without duplication
- [ ] Tests verify system_context.md progressive validation contract

---

## Anti-Patterns to Avoid

- ❌ Don't duplicate tests from prp-execute-prompt.test.ts (focus on validation levels)
- ❌ Don't test PRP executor internals (test via execute() method only)
- ❌ Don't use real LLM calls (always mock agent.prompt)
- ❌ Don't skip testing sequential progression (stop on failure)
- ❌ Don't skip testing manual gate skipping behavior
- ❌ Don't skip testing fix cycle with exponential backoff
- ❌ Don't use unsafe shell commands in tests (use echo, false, true)
- ❌ Don't forget to mock agent-factory before imports
- ❌ Don't skip testing all 4 validation levels
- ❌ Don't forget to clear mocks in afterEach
- ❌ Don't test implementation details (test input/output contract)
- ❌ Don't skip testing validation result structure (stdout, stderr, exitCode)

---

**PRP Version:** 1.0
**Work Item:** P1.M3.T3.S2
**Created:** 2026-01-21
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**

- Complete PRP_BUILDER_PROMPT content specifications with exact line numbers
- Comprehensive integration test patterns from existing test files
- PRPExecutor implementation details with validation gate execution logic
- Mock patterns for agent factory and BashMCP command execution
- Clear implementation tasks with proper dependencies
- All contract requirements from system_context.md covered
- File paths and code examples provided for all references
- Test structure follows project patterns exactly
- Sequential progression and fix cycle testing specified with examples
