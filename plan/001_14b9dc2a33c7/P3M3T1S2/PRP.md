# PRP for P3.M3.T1.S2: Create PRP Executor

---

## Goal

**Feature Goal**: Create `PRPExecutor` class that executes PRP documents via the Coder Agent with Progressive Validation (4-level gates), automatic fix-and-retry on validation failures, and structured execution results.

**Deliverable**: `src/agents/prp-executor.ts` containing `PRPExecutor` class with:

- `execute(prp: PRPDocument, prpPath: string): Promise<ExecutionResult>` method
- Progressive validation gate execution (Level 1 → Level 2 → Level 3 → Level 4)
- Fix-and-retry logic on validation failures (up to 2 retry attempts)
- Integration with `createCoderAgent()` and BashMCP for command execution
- Structured `ExecutionResult` with validation results and artifacts

**Success Definition**:

- `PRPExecutor.execute()` successfully runs PRP through all 4 validation levels
- Validation failures trigger automatic fix-and-retry with Coder Agent
- Returns structured `ExecutionResult` with success status, validation gate results, and artifacts
- Fix-and-retry attempts up to 2 times (1 initial + 2 retries = 3 total attempts)
- All existing tests continue to pass
- New tests validate PRP execution scenarios with mocked agents
- Full type safety with TypeScript

## User Persona (if applicable)

**Target User**: PRP Pipeline system (internal automation - TaskOrchestrator)

**Use Case**: The Task Orchestrator delegates PRP execution to `PRPExecutor` when processing a Subtask. The executor coordinates Coder Agent execution, runs progressive validation gates, handles fix-and-retry on failures, and returns structured execution results for downstream processing.

**User Journey**:

1. Task Orchestrator selects next Subtask from execution queue
2. PRPGenerator creates PRPDocument and writes to `{sessionPath}/prps/{taskId}.md`
3. Task Orchestrator creates `PRPExecutor` instance
4. Calls `execute(prpDocument, prpPath)` with the PRP
5. PRPExecutor creates Coder Agent and injects PRP path into prompt
6. Coder Agent reads PRP, plans implementation, and executes code changes
7. PRPExecutor runs validation gates in sequence (Level 1 → 2 → 3 → 4)
8. If validation fails, PRPExecutor triggers fix-and-retry (up to 2 times)
9. Returns `ExecutionResult` with success status, validation results, artifacts
10. Task Orchestrator uses result to update subtask status and continue pipeline

**Pain Points Addressed**:

- Eliminates manual PRP execution bottleneck
- Provides consistent, structured PRP execution with validation
- Enables automatic error recovery through fix-and-retry
- Captures validation results for debugging and audit trails
- Handles the complexity of progressive validation gate coordination

## Why

- **Core Pipeline Component**: PRP execution is the bridge between PRP generation and completed code. Without automated PRP execution, the pipeline cannot function end-to-end.
- **Progressive Validation**: The 4-level validation system (syntax → lint → unit → integration) catches errors early and provides clear feedback for fixes.
- **Fix-and-Retry**: LLM-generated code often has minor issues; automatic retry with error context enables self-healing execution.
- **Structured Results**: `ExecutionResult` provides audit trail of what was executed, what validation ran, and what artifacts were produced.
- **Integration with Coder Agent**: Leverages existing `createCoderAgent()` and `PRP_BUILDER_PROMPT` for consistent code generation.

## What

### System Behavior

The `PRPExecutor` class:

1. Accepts a `PRPDocument` and its file path as input
2. Creates a Coder Agent via `createCoderAgent()`
3. Injects the PRP file path into `PRP_BUILDER_PROMPT` with placeholder substitution
4. Executes the Coder Agent with the injected prompt
5. Parses the JSON result from the Coder Agent
6. Runs progressive validation gates in sequence (Level 1 → Level 2 → Level 3 → Level 4)
7. For each validation gate:
   - If `command` exists and not `manual`, execute via BashMCP
   - Check exit code for success/failure
   - Capture stdout/stderr for debugging
8. If any validation gate fails:
   - Trigger fix-and-retry (up to 2 times)
   - Provide validation error context to Coder Agent
   - Re-run validation gates
9. Return `ExecutionResult` with:
   - `success`: boolean indicating overall success
   - `validationResults`: array of `ValidationGateResult` for each level
   - `artifacts`: array of file paths created/modified
   - `error`: error message if failed

### Success Criteria

- [ ] `PRPExecutor` class created in `src/agents/prp-executor.ts`
- [ ] `execute()` method accepts `PRPDocument` and file path, returns `ExecutionResult`
- [ ] Creates Coder Agent via `createCoderAgent()`
- [ ] Injects PRP file path into `PRP_BUILDER_PROMPT` with `$PRP_FILE_PATH` substitution
- [ ] Executes Coder Agent and parses JSON result
- [ ] Runs all 4 validation gates in sequence
- [ ] Executes non-manual gates via BashMCP
- [ ] Implements fix-and-retry logic (up to 2 retries)
- [ ] Returns structured `ExecutionResult` with all fields populated
- [ ] Unit tests for happy path, validation failure, fix-and-retry scenarios
- [ ] Integration test with mock Coder Agent
- [ ] Zero regressions in existing test suite

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact file paths to all dependencies (Coder Agent, BashMCP, models)
- Complete code patterns for agent creation and prompt construction
- Groundswell API usage with specific method signatures
- BashMCP tool usage pattern for command execution
- Validation gate execution pattern from PRPDocument
- Fix-and-retry logic configuration from external research
- Specific test patterns matching existing codebase
- Interface definitions for all types used

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: src/agents/agent-factory.ts
  why: createCoderAgent() implementation, PRP_BUILDER_PROMPT constant, MCP_TOOLS array
  pattern: Factory function returning Groundswell Agent with persona config
  gotcha: configureEnvironment() must be called before any agent creation (already done at module load)

- file: src/agents/prompts.ts (lines 614-685)
  why: PRP_BUILDER_PROMPT system prompt with placeholder for PRP file path
  pattern: Contains $PRP_FILE_PATH placeholder that must be substituted with actual PRP path
  critical: The prompt instructs agent to read PRP file first, then execute progressive validation

- file: src/core/models.ts (lines 1114-1223)
  why: PRPDocument interface definition, ValidationGate interface
  pattern: Zod schema validation for structured output
  fields: taskId, objective, context, implementationSteps, validationGates (level 1-4), successCriteria, references

- file: src/core/models.ts (lines 918-962)
  why: ValidationGate interface with level, description, command, manual fields
  pattern: Union type level: 1 | 2 | 3 | 4, command can be null
  gotcha: manual=true gates should be skipped (not executed via BashMCP)

- file: src/tools/bash-mcp.ts
  why: execute_bash tool for running validation commands
  pattern: spawn() with shell: false, cwd and timeout parameters
  gotcha: Tool name is 'bash__execute_bash', not 'execute_bash'

- file: plan/001_14b9dc2a33c7/P3M3T1S1/PRP.md
  why: Previous PRP that produces PRPDocument - understand the contract
  pattern: PRPGenerator returns Promise<PRPDocument>, writes to {sessionPath}/prps/{taskId}.md
  critical: This is the input contract for PRPExecutor

- file: src/agents/prp-generator.ts
  why: Reference for retry pattern, error handling, file path construction
  pattern: Exponential backoff retry loop with Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  gotcha: Use .js extensions for imports even though source is .ts

- file: tests/unit/config/environment.test.ts
  why: Test pattern reference for vitest describe/it/expect syntax
  pattern: afterEach cleanup, vi.clearAllMocks(), mocking external dependencies

- docfile: plan/001_14b9dc2a33c7/P3M3T1S2/research/validation_research.md
  why: Research findings on progressive validation, fix-and-retry patterns
  section: Fix-and-Retry Pattern, BashMCP Command Execution

- url: https://github.com/anthropics/groundswell
  why: Groundswell Agent API documentation for .prompt() method
  critical: Agent.prompt() returns Promise<z.infer<Schema>>

- url: https://eslint.org/docs/latest/use/node-api
  why: ESLint Node.js API for programmatic linting (if needed for Level 1)

- url: https://vitest.dev/api/
  why: Vitest API for programmatic test execution (if needed for Level 2)
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts       # createCoderAgent() - USE THIS
│   ├── prp-generator.ts       # PRPGenerator - reference for patterns
│   └── prompts/
│       ├── index.ts           # Prompt exports
│       └── (prompt files)
├── config/
│   ├── environment.ts         # configureEnvironment(), getModel()
│   └── constants.ts           # Environment variable names
├── core/
│   ├── models.ts              # PRPDocument, ValidationGate, ExecutionResult types
│   ├── session-manager.ts     # SessionManager class
│   └── task-orchestrator.ts   # WILL CALL PRPExecutor (future integration)
├── tools/
│   ├── bash-mcp.ts           # BashMCP.execute_bash() - USE THIS
│   ├── filesystem-mcp.ts      # FilesystemMCP
│   └── git-mcp.ts            # GitMCP
└── utils/
    └── task-utils.ts          # Task utilities

tests/
├── unit/
│   ├── agents/
│   │   └── agent-factory.test.ts
│   └── config/
│       └── environment.test.ts
└── integration/
    └── (integration tests)
```

### Desired Codebase Tree with Files to be Added

```bash
src/
├── agents/
│   ├── agent-factory.ts       # EXISTING - createCoderAgent()
│   ├── prp-generator.ts       # EXISTING - PRPGenerator
│   ├── prp-executor.ts        # NEW - PRPExecutor class
│   └── prompts.ts             # EXISTING - PRP_BUILDER_PROMPT

tests/
├── unit/
│   └── agents/
│       ├── prp-generator.test.ts  # EXISTING
│       └── prp-executor.test.ts   # NEW - Unit tests for PRPExecutor
└── integration/
    └── prp-executor-integration.test.ts  # NEW - Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports must use .js extension
// Even though source is .ts, imports must reference .js
import { createCoderAgent } from './agent-factory.js';
import { PRP_BUILDER_PROMPT } from './prompts.js';

// CRITICAL: configureEnvironment() is called at module load time in agent-factory.ts
// Do NOT call configureEnvironment() again in PRPExecutor

// GOTCHA: Groundswell Agent.prompt() returns z.infer<typeof Schema>
// The return type is automatically inferred from responseFormat
// For PRP_BUILDER_PROMPT, it returns string (raw response), not a typed object
const result = await agent.prompt(prompt);

// CRITICAL: PRP_BUILDER_PROMPT has $PRP_FILE_PATH placeholder
// Must substitute with actual PRP file path before passing to agent
const injectedPrompt = PRP_BUILDER_PROMPT.replace('$PRP_FILE_PATH', prpPath);

// CRITICAL: BashMCP tool name is 'bash__execute_bash' (with double underscore)
// The execute_bash() method is on the BashMCP class instance
const bashMCP = new BashMCP();
const result = await bashMCP.execute_bash({
  command: 'npm test',
  cwd: process.cwd(),
});

// PATTERN: ValidationGate.command can be null
// Always check if command exists before executing
if (gate.command && !gate.manual) {
  // Execute via BashMCP
}

// PATTERN: ValidationGate.level is union type 1 | 2 | 3 | 4
// Use === for comparison, not >=
if (gate.level === 1) {
  /* Level 1: Syntax */
}

// PATTERN: Fix-and-retry with exponential backoff
// Max 2 retries (1 initial + 2 retries = 3 total attempts)
const maxFixAttempts = 3;
const baseDelay = 2000; // 2 seconds for fix attempts
const maxDelay = 30000; // 30 seconds max

// PATTERN: Coder Agent returns JSON in specific format
// { result: "success" | "error" | "issue", message: string }
// Must parse this from string response
const coderResult = JSON.parse(coderResponse);

// GOTCHA: Validation gates are sequential
// Each level must pass before proceeding to next
// Stop on first failure and trigger fix-and-retry
```

## Implementation Blueprint

### Data Models and Structure

Create new types for execution results:

```typescript
// Result from a single validation gate execution
interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly success: boolean;
  readonly command: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly skipped: boolean; // true if manual or no command
}

// Overall execution result
interface ExecutionResult {
  readonly success: boolean;
  readonly validationResults: ValidationGateResult[];
  readonly artifacts: string[]; // files created/modified
  readonly error?: string; // error message if failed
  readonly fixAttempts: number; // number of fix attempts made
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/agents/prp-executor.ts
  - IMPLEMENT: PRPExecutor class with constructor and execute() method
  - CLASS STRUCTURE:
    * Constructor: readonly sessionPath, readonly coderAgent (Agent), readonly bashMCP (BashMCP)
    * Public method: async execute(prp: PRPDocument, prpPath: string): Promise<ExecutionResult>
  - NAMING: PascalCase class, camelCase methods/properties
  - PLACEMENT: src/agents/ directory (sibling to prp-generator.ts)
  - DEPENDENCIES: Import from agent-factory.js, models.js, bash-mcp.js

Task 2: IMPLEMENT execute() method - Initial Execution
  - STEP 1: Inject PRP file path into PRP_BUILDER_PROMPT
  - STEP 2: Create execution prompt with substituted path
  - STEP 3: Execute coderAgent.prompt(prompt) and capture response
  - STEP 4: Parse JSON result from Coder Agent
  - STEP 5: Check result field - if "error" or "issue", return failed ExecutionResult immediately
  - STEP 6: If "success", proceed to validation gates
  - ERROR HANDLING: Wrap in try/catch, return failed ExecutionResult on exception

Task 3: IMPLEMENT runValidationGates() method
  - CREATE: Private method async runValidationGates(prp: PRPDocument): Promise<ValidationGateResult[]>
  - LOGIC: Iterate through prp.validationGates in order (by level)
  - FOR EACH GATE:
    * Check if gate.manual === true or gate.command === null → skip, mark skipped=true
    * Execute gate.command via bashMCP.execute_bash({ command, cwd: this.sessionPath })
    * Capture success, stdout, stderr, exitCode
    * Create ValidationGateResult object
    * If !success, return early with current results (stop sequential execution)
  - RETURN: Array of ValidationGateResult for all executed gates

Task 4: IMPLEMENT fixAndRetry() method
  - CREATE: Private method async fixAndRetry(prp: PRPDocument, failedGates: ValidationGateResult[], attempt: number): Promise<boolean>
  - PARAMS: failedGates from previous run, attempt number (1, 2)
  - LOGIC:
    * Build error context from failed gates (description + stderr)
    * Create fix prompt with error context
    * Execute coderAgent.prompt(fixPrompt)
    * Re-run validation gates via runValidationGates()
    * Return true if all gates pass, false otherwise
  - DELAY: Add exponential backoff delay before retry (2s → 4s)
  - MAX ATTEMPTS: Limit to 2 fix attempts (3 total including initial)

Task 5: INTEGRATE fix-and-retry into execute() method
  - AFTER initial validation gate run:
    * Check if all validation results have success=true
    * If any failed and fixAttempts < 2:
      * Call fixAndRetry() with failed gates
      * Increment fixAttempts counter
      * Repeat until all pass or max attempts reached
  - FINAL RESULT: Build ExecutionResult with all validation results and artifacts
  - ERROR HANDLING: If fix attempts exhausted, return failed ExecutionResult with error message

Task 6: CREATE custom error classes
  - IMPLEMENT: PRPExecutionError extends Error
  - FIELDS: taskId, prpPath, originalError
  - IMPLEMENT: ValidationError extends Error
  - FIELDS: level, command, stdout, stderr
  - PLACEMENT: Export from src/agents/prp-executor.ts
  - USAGE: Throw these errors for specific failure scenarios

Task 7: CREATE tests/unit/agents/prp-executor.test.ts
  - SETUP: Mock createCoderAgent to return mock agent, mock BashMCP
  - TEST: execute() successfully calls agent.prompt() and returns ExecutionResult
  - TEST: runValidationGates() executes non-manual gates in sequence
  - TEST: runValidationGates() skips manual gates
  - TEST: fixAndRetry() triggers on validation failure
  - TEST: fixAndRetry() limits to 2 attempts
  - TEST: execute() returns failed ExecutionResult when all fix attempts exhausted
  - PATTERN: Use vitest describe/it/expect syntax
  - FIXTURES: Mock prp, sessionPath, agent responses

Task 8: CREATE tests/integration/prp-executor-integration.test.ts
  - SETUP: Use real createCoderAgent() and BashMCP
  - MOCK: Mock agent.prompt() to return canned JSON (no real LLM call)
  - TEST: Full execute() flow with real dependencies
  - TEST: Validation gate execution with real BashMCP
  - TEST: Fix-and-retry flow with mock agent responses
  - SKIP: Mark as test.skip if running in CI without API credentials
```

### Implementation Patterns & Key Details

````typescript
// File: src/agents/prp-executor.ts

// CRITICAL: Import patterns - use .js extensions for ES modules
import { createCoderAgent } from './agent-factory.js';
import { PRP_BUILDER_PROMPT } from './prompts.js';
import type { Agent } from 'groundswell';
import type {
  PRPDocument,
  ValidationGate,
  Task,
  Subtask,
} from '../core/models.js';
import { BashMCP } from '../tools/bash-mcp.js';
import type { BashToolResult } from '../tools/bash-mcp.js';

/**
 * Result from a single validation gate execution
 */
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

/**
 * Overall PRP execution result
 */
export interface ExecutionResult {
  readonly success: boolean;
  readonly validationResults: ValidationGateResult[];
  readonly artifacts: string[];
  readonly error?: string;
  readonly fixAttempts: number;
}

/**
 * Custom error for PRP execution failures
 */
export class PRPExecutionError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly prpPath: string,
    originalError: unknown
  ) {
    super(
      `Failed to execute PRP for ${taskId} at ${prpPath}: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'PRPExecutionError';
  }
}

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  constructor(
    public readonly level: number,
    public readonly command: string,
    public readonly stdout: string,
    public readonly stderr: string
  ) {
    super(
      `Validation failed at Level ${level} for command "${command}":\n${stderr}`
    );
    this.name = 'ValidationError';
  }
}

/**
 * PRP Executor for automated PRP execution with progressive validation
 *
 * @remarks
 * Orchestrates the Coder Agent to execute PRPs, runs progressive
 * validation gates (4 levels), and implements fix-and-retry logic
 * for handling validation failures.
 */
export class PRPExecutor {
  /** Path to session directory (for working directory context) */
  readonly sessionPath: string;

  /** Coder Agent instance for PRP execution */
  readonly #coderAgent: Agent;

  /** BashMCP instance for running validation commands */
  readonly #bashMCP: BashMCP;

  /**
   * Creates a new PRPExecutor instance
   *
   * @param sessionPath - Path to session directory for working directory context
   */
  constructor(sessionPath: string) {
    this.sessionPath = sessionPath;
    this.#coderAgent = createCoderAgent();
    this.#bashMCP = new BashMCP();
  }

  /**
   * Executes a PRP with progressive validation and fix-and-retry
   *
   * @param prp - The PRPDocument to execute
   * @param prpPath - File path to the PRP markdown file (for Coder Agent to read)
   * @returns ExecutionResult with validation results and artifacts
   */
  async execute(prp: PRPDocument, prpPath: string): Promise<ExecutionResult> {
    let fixAttempts = 0;
    const maxFixAttempts = 2;

    // STEP 1: Inject PRP path into prompt
    const injectedPrompt = PRP_BUILDER_PROMPT.replace(
      /\$PRP_FILE_PATH/g,
      prpPath
    );

    try {
      // STEP 2: Execute Coder Agent
      console.log(`Executing PRP for ${prp.taskId}...`);
      const coderResponse = await this.#coderAgent.prompt(injectedPrompt);

      // STEP 3: Parse JSON result
      const coderResult = this.#parseCoderResult(coderResponse as string);

      // If Coder Agent reported error, return failed result
      if (coderResult.result !== 'success') {
        return {
          success: false,
          validationResults: [],
          artifacts: [],
          error: coderResult.message,
          fixAttempts: 0,
        };
      }

      // STEP 4: Run validation gates with fix-and-retry
      let validationResults: ValidationGateResult[] = [];

      while (fixAttempts <= maxFixAttempts) {
        validationResults = await this.#runValidationGates(prp);

        // Check if all gates passed
        const allPassed = validationResults.every(r => r.success || r.skipped);

        if (allPassed) {
          break; // Success!
        }

        // If we have more fix attempts available
        if (fixAttempts < maxFixAttempts) {
          fixAttempts++;
          const delay = Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000);
          console.warn(
            `Validation failed for ${prp.taskId}. ` +
              `Fix attempt ${fixAttempts}/${maxFixAttempts} in ${delay}ms...`
          );
          await this.#sleep(delay);

          // Trigger fix attempt
          await this.#fixAndRetry(prp, validationResults, fixAttempts);
        } else {
          break; // Exhausted fix attempts
        }
      }

      // STEP 5: Build final result
      const allPassed = validationResults.every(r => r.success || r.skipped);

      return {
        success: allPassed,
        validationResults,
        artifacts: [], // TODO: Extract artifacts from Coder Agent output
        error: allPassed
          ? undefined
          : 'Validation failed after all fix attempts',
        fixAttempts,
      };
    } catch (error) {
      return {
        success: false,
        validationResults: [],
        artifacts: [],
        error: error instanceof Error ? error.message : String(error),
        fixAttempts,
      };
    }
  }

  /**
   * Runs all validation gates from the PRP in sequence
   *
   * @param prp - The PRPDocument containing validation gates
   * @returns Array of ValidationGateResult for each executed gate
   * @private
   */
  async #runValidationGates(prp: PRPDocument): Promise<ValidationGateResult[]> {
    const results: ValidationGateResult[] = [];

    // Sort gates by level to ensure sequential execution
    const sortedGates = [...prp.validationGates].sort(
      (a, b) => a.level - b.level
    );

    for (const gate of sortedGates) {
      // Skip manual gates or gates with no command
      if (gate.manual || !gate.command) {
        results.push({
          level: gate.level,
          description: gate.description,
          success: true, // Skipped gates count as "passed"
          command: gate.command,
          stdout: '',
          stderr: '',
          exitCode: null,
          skipped: true,
        });
        continue;
      }

      // Execute command via BashMCP
      const result = await this.#bashMCP.execute_bash({
        command: gate.command,
        cwd: this.sessionPath,
        timeout: 120000, // 2 minute timeout for validation commands
      });

      const gateResult: ValidationGateResult = {
        level: gate.level,
        description: gate.description,
        success: result.success,
        command: gate.command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode ?? null,
        skipped: false,
      };

      results.push(gateResult);

      // Stop sequential execution on first failure
      if (!gateResult.success) {
        console.error(
          `Validation Level ${gate.level} failed: ${gate.description}\n` +
            `Command: ${gate.command}\n` +
            `Exit Code: ${result.exitCode}\n` +
            `Stderr: ${result.stderr}`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Triggers fix-and-retry by providing error context to Coder Agent
   *
   * @param prp - The PRPDocument being executed
   * @param failedGates - Validation gates that failed
   * @param attemptNumber - Current fix attempt number (1 or 2)
   * @private
   */
  async #fixAndRetry(
    prp: PRPDocument,
    failedGates: ValidationGateResult[],
    attemptNumber: number
  ): Promise<void> {
    // Build error context
    const errorContext = failedGates
      .filter(g => !g.success && !g.skipped)
      .map(
        g => `
Level ${g.level}: ${g.description}
Command: ${g.command}
Exit Code: ${g.exitCode}
Output: ${g.stdout}
Error: ${g.stderr}
      `
      )
      .join('\n');

    // Create fix prompt
    const fixPrompt = `
The previous implementation failed validation. Please fix the issues.

PRP Task ID: ${prp.taskId}
Failed Validation Gates:
${errorContext}

Fix Attempt: ${attemptNumber}/2

Please analyze the validation failures and fix the implementation.
Focus on the specific errors reported above.

Output your result in the same JSON format:
{
  "result": "success" | "error" | "issue",
  "message": "Detailed explanation"
}
    `.trim();

    // Execute fix attempt
    await this.#coderAgent.prompt(fixPrompt);
  }

  /**
   * Parses JSON result from Coder Agent response
   *
   * @param response - Raw string response from Coder Agent
   * @returns Parsed result object
   * @private
   */
  #parseCoderResult(response: string): { result: string; message: string } {
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;

      return JSON.parse(jsonStr);
    } catch (error) {
      // If parsing fails, assume error
      return {
        result: 'error',
        message: `Failed to parse Coder Agent response: ${response}`,
      };
    }
  }

  /**
   * Sleep utility for delays
   *
   * @param ms - Milliseconds to sleep
   * @private
   */
  #sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// PATTERN: Export type for convenience
export type { PRPDocument, ValidationGate };
````

### Integration Points

```yaml
CODER_AGENT:
  - import: createCoderAgent from './agents/agent-factory.js'
  - usage: this.#coderAgent = createCoderAgent()
  - pattern: Singleton agent instance cached in private field

PROMPT_SYSTEM:
  - import: PRP_BUILDER_PROMPT from './agents/prompts.js'
  - usage: const injectedPrompt = PRP_BUILDER_PROMPT.replace(/\$PRP_FILE_PATH/g, prpPath)
  - parameters: $PRP_FILE_PATH placeholder in prompt

BASH_MCP:
  - usage: this.#bashMCP.execute_bash({ command, cwd, timeout })
  - pattern: Check result.success for pass/fail
  - error: result.stderr contains error output

MODELS:
  - import: PRPDocument, ValidationGate from './core/models.js'
  - validation: Access prp.validationGates array
  - return type: Promise<ExecutionResult> from execute() method

TASK_ORCHESTRATOR (FUTURE):
  - integration: Will call new PRPExecutor(sessionPath).execute(prp, prpPath)
  - usage: After PRPGenerator completes, TaskOrchestrator calls PRPExecutor
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- src/agents/prp-executor.ts    # ESLint with auto-fix
npm run format -- src/agents/prp-executor.ts  # Prettier formatting
npm run check -- src/agents/prp-executor.ts   # TypeScript type checking

# Project-wide validation
npm run lint    # Check all files
npm run format  # Format all files
npm run check   # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test PRPExecutor specifically
npm test -- tests/unit/agents/prp-executor.test.ts

# Run with coverage
npm test -- --coverage tests/unit/agents/prp-executor.test.ts

# Full test suite for agents
npm test -- tests/unit/agents/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests (requires valid dependencies)
npm test -- tests/integration/prp-executor-integration.test.ts

# Manual verification (if real Agent available)
# Create test script that instantiates PRPExecutor with mock PRP
# and calls execute() to verify flow

# Expected: PRP executes, validation gates run, result returned correctly
```

### Level 4: End-to-End Validation

```bash
# Verify integration with existing components
npm test -- tests/unit/agents/agent-factory.test.ts    # Verify coder agent creation
npm test -- tests/unit/tools/bash-mcp.test.ts         # Verify bash command execution
npm test -- tests/unit/core/models.test.ts            # Verify type definitions

# Run full test suite
npm test

# Expected: All existing tests still pass, no regressions introduced
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] `PRPExecutor` class created in `src/agents/prp-executor.ts`
- [ ] `execute()` method accepts `PRPDocument` and file path, returns `ExecutionResult`
- [ ] Creates Coder Agent via `createCoderAgent()`
- [ ] Injects PRP file path into `PRP_BUILDER_PROMPT`
- [ ] Runs all 4 validation gates in sequence
- [ ] Executes non-manual gates via BashMCP
- [ ] Implements fix-and-retry logic (up to 2 retries)
- [ ] Returns structured `ExecutionResult` with all fields populated
- [ ] Unit tests cover happy path, validation failure, fix-and-retry scenarios
- [ ] Integration test validates full flow

### Code Quality Validation

- [ ] Follows existing codebase patterns (prp-generator.ts structure)
- [ ] File placement matches desired codebase tree structure
- [ ] Uses `.js` extensions for ES module imports
- [ ] Private fields use `#` prefix
- [ ] Readonly public fields for immutability
- [ ] Proper error handling with custom error types
- [ ] Console logging for fix attempts

### Documentation & Deployment

- [ ] Comprehensive JSDoc comments on all public methods
- [ ] Module-level JSDoc explains purpose and usage
- [ ] Example usage in JSDoc @example blocks
- [ ] Error types are well-documented with field descriptions

---

## Anti-Patterns to Avoid

- ❌ Don't call `configureEnvironment()` in PRPExecutor (already done in agent-factory.ts)
- ❌ Don't create a new Coder Agent for each `execute()` call (cache in constructor)
- ❌ Don't skip validation gates - all 4 levels must execute
- ❌ Don't run validation gates in parallel - must be sequential
- ❌ Don't ignore manual gates - skip them but include in results
- ❌ Don't throw generic errors - use custom `PRPExecutionError` and `ValidationError`
- ❌ Don't forget to substitute `$PRP_FILE_PATH` placeholder in prompt
- ❌ Don't use sync operations - always use async/await
- ❌ Don't use `.ts` extensions in imports - ES modules require `.js`
- ❌ Don't exceed 2 fix attempts - this is the maximum retry limit
- ❌ Don't assume Coder Agent returns valid JSON - parse with error handling
