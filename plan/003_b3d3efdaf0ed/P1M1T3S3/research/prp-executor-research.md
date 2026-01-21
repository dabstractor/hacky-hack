# PRP Executor Implementation and Validation Gate System Research

**Generated**: 2026-01-19
**Task**: P1.M1.T3.S3 - Agent integration tests
**Research Focus**: PRP executor, validation gates, retry logic, BashMCP integration

---

## Executive Summary

The PRP Executor is a comprehensive execution engine that orchestrates the Coder Agent to implement PRPs (Product Requirement Prompts) with a 4-level progressive validation system and fix-and-retry logic. This research documents the complete implementation, validation flow, retry mechanisms, and existing test patterns to inform comprehensive integration test development.

**Key Findings**:

- PRP executor implements 4-level progressive validation with sequential execution
- Fix-and-retry logic supports max 2 attempts with exponential backoff (2^n, capped at 30s)
- BashMCP provides safe command execution with timeout protection (2min default for validation)
- Existing tests use comprehensive mocking patterns for both unit and integration levels
- Validation artifacts are currently TODO (not yet implemented)

---

## Table of Contents

1. [PRP Executor Implementation](#1-prp-executor-implementation)
2. [4-Level Progressive Validation System](#2-4-level-progressive-validation-system)
3. [Fix-and-Retry Logic](#3-fix-and-retry-logic)
4. [BashMCP Integration](#4-bashmcp-integration)
5. [PRP Execute Prompt Structure](#5-prp-execute-prompt-structure)
6. [Existing Test Patterns](#6-existing-test-patterns)
7. [Coder Agent Configuration](#7-coder-agent-configuration)
8. [Data Models](#8-data-models)
9. [Retry Utility Implementation](#9-retry-utility-implementation)

---

## 1. PRP Executor Implementation

### File Location

- **Path**: `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts`
- **Lines**: 501 total
- **Key Classes**: `PRPExecutor`, `PRPExecutionError`, `ValidationError`

### Constructor (Lines 194-202)

```typescript
constructor(sessionPath: string) {
  if (!sessionPath) {
    throw new Error('sessionPath is required for PRPExecutor');
  }
  this.#logger = getLogger('PRPExecutor');
  this.sessionPath = sessionPath;
  this.#coderAgent = createCoderAgent();  // Via agent-factory
  this.#bashMCP = new BashMCP();
}
```

**Key Points**:

- Session path is required (validated in constructor)
- Creates Coder Agent via `createCoderAgent()` factory
- Instantiates BashMCP for validation command execution
- Initializes structured logger

### Main Execution Flow (Lines 238-322)

The `execute()` method implements the complete PRP execution lifecycle:

```typescript
async execute(prp: PRPDocument, prpPath: string): Promise<ExecutionResult>
```

#### Step 1: Inject PRP Path into Prompt (Lines 242-246)

```typescript
const injectedPrompt = PRP_BUILDER_PROMPT.replace(/\$PRP_FILE_PATH/g, prpPath);
```

- Replaces `$PRP_FILE_PATH` placeholder in PRP_BUILDER_PROMPT
- Injects actual PRP file path for Coder Agent to read

#### Step 2: Execute Coder Agent with Retry (Lines 249-255)

```typescript
const coderResponse = await retryAgentPrompt(
  () => this.#coderAgent.prompt(injectedPrompt as unknown as Prompt<unknown>),
  { agentType: 'Coder', operation: 'executePRP' }
);
```

**Retry Configuration** (from retry.ts):

- Max attempts: 3 (1 initial + 2 retries)
- Base delay: 1000ms
- Max delay: 30000ms
- Backoff factor: 2 (exponential)
- Jitter factor: 0.1

#### Step 3: Parse JSON Result (Line 258)

```typescript
const coderResult = this.#parseCoderResult(coderResponse as string);
```

**Parser Logic** (Lines 471-485):

````typescript
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
````

**Handles**:

- Raw JSON responses
- Markdown code block wrapped JSON (`json ... `)
- Invalid JSON (returns error result)

#### Step 4: Run Validation Gates with Fix-and-Retry (Lines 271-299)

```typescript
let validationResults: ValidationGateResult[] = [];

while (fixAttempts <= maxFixAttempts) {
  validationResults = await this.#runValidationGates(prp);
  const allPassed = validationResults.every(r => r.success || r.skipped);

  if (allPassed) {
    break; // Success!
  }

  if (fixAttempts < maxFixAttempts) {
    fixAttempts++;
    const delay = Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000);
    this.#logger.warn(
      { prpTaskId: prp.taskId, fixAttempts, maxFixAttempts, delay },
      'Validation failed, retrying'
    );
    await this.#sleep(delay);
    await this.#fixAndRetry(prp, validationResults, fixAttempts);
  } else {
    break; // Exhausted fix attempts
  }
}
```

**Fix-and-Retry Configuration**:

- Max fix attempts: 2
- Base delay: 2000ms
- Exponential backoff: 2^(attempt-1)
- Max delay cap: 30000ms (30 seconds)
- Delay progression: 2s, 4s, 8s, 16s, 30s (capped)

#### Step 5: Build Final Result (Lines 302-312)

```typescript
const allPassed = validationResults.every(r => r.success || r.skipped);

return {
  success: allPassed,
  validationResults,
  artifacts: [], // TODO: Extract artifacts from Coder Agent output
  error: allPassed ? undefined : 'Validation failed after all fix attempts',
  fixAttempts,
};
```

**TODO**: Artifacts extraction is not yet implemented (line 307)

### Validation Gate Execution (Lines 335-396)

```typescript
async #runValidationGates(prp: PRPDocument): Promise<ValidationGateResult[]>
```

#### Sequential Execution Logic

```typescript
// Sort gates by level to ensure sequential execution
const sortedGates = [...prp.validationGates].sort((a, b) => a.level - b.level);

for (const gate of sortedGates) {
  // Skip manual gates or gates with no command
  if (gate.manual || gate.command === null) {
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
    this.#logger.error(
      {
        level: gate.level,
        description: gate.description,
        command: gate.command,
        exitCode: result.exitCode,
        stderr: result.stderr,
      },
      'Validation gate failed'
    );
    break;
  }
}
```

**Key Behaviors**:

- Gates executed in sequential order (Level 1 → 2 → 3 → 4)
- Manual gates skipped automatically (count as passed)
- Gates with null command skipped
- **Stop-on-fail**: Execution stops at first failing gate
- Each gate gets 2-minute timeout
- Working directory: session path

### Fix-and-Retry Implementation (Lines 411-458)

```typescript
async #fixAndRetry(
  prp: PRPDocument,
  failedGates: ValidationGateResult[],
  attemptNumber: number
): Promise<void>
```

#### Error Context Building

```typescript
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
```

#### Fix Prompt Generation

```typescript
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
```

#### Fix Execution with Retry

```typescript
await retryAgentPrompt(
  () => this.#coderAgent.prompt(fixPrompt as unknown as Prompt<unknown>),
  {
    agentType: 'Coder',
    operation: 'fixValidation',
  }
);
```

**Key Points**:

- Provides specific error details from failed gates
- Includes command, exit code, stdout, stderr
- Tracks attempt number (1 or 2)
- Uses same retry logic as initial execution
- Expects JSON response format

---

## 2. 4-Level Progressive Validation System

### Level Definitions (from models.ts lines 1000-1030)

```typescript
export interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly command: string | null;
  readonly manual: boolean;
}
```

**Level Purposes**:

- **Level 1**: Syntax & Style (linting, formatting, type checking)
- **Level 2**: Unit Tests (component-level validation)
- **Level 3**: Integration Testing (system-level validation)
- **Level 4**: Manual/Creative (end-to-end workflows, domain-specific)

### Validation Flow

1. **Sequential Execution**: Gates executed in order (1 → 2 → 3 → 4)
2. **Skip Logic**: Manual gates and null-command gates skipped
3. **Stop-on-Fail**: Halt at first failure
4. **Timeout**: Each gate gets 120 seconds (2 minutes)
5. **Working Directory**: All commands run in session path

### Gate Result Structure (Lines 38-55)

```typescript
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
```

### Validation Gates in PRP Template

From PROMPTS.md lines 683-691:

```markdown
4. **Progressive Validation**

   **Execute the level validation system from the PRP:**
   - **Level 1**: Run syntax & style validation commands from PRP
   - **Level 2**: Execute unit test validation from PRP
   - **Level 3**: Run integration testing commands from PRP
   - **Level 4**: Execute specified validation from PRP

   **Each level must pass before proceeding to the next.**
```

---

## 3. Fix-and-Retry Logic

### Configuration

```typescript
const maxFixAttempts = 2;
const baseDelay = 2000; // 2 seconds
const maxDelay = 30000; // 30 seconds
const backoffFactor = 2; // Exponential
```

### Delay Calculation

```typescript
const delay = Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000);
```

**Delay Progression**:

- Attempt 1: 2000ms (2 seconds)
- Attempt 2: 4000ms (4 seconds)
- Attempt 3+: 30000ms (capped at 30 seconds)

### Retry Flow

1. **Initial Execution**: Run validation gates
2. **Check Results**: If all passed, success
3. **First Failure**:
   - Increment fixAttempts (now 1)
   - Calculate delay (2s)
   - Log warning with context
   - Sleep for delay
   - Call #fixAndRetry() with error details
   - Re-run validation gates
4. **Second Failure**:
   - Increment fixAttempts (now 2)
   - Calculate delay (4s)
   - Log warning with context
   - Sleep for delay
   - Call #fixAndRetry() with error details
   - Re-run validation gates
5. **Third Failure**:
   - Exhausted attempts (fixAttempts = 2, maxFixAttempts = 2)
   - Break loop
   - Return failed result with error

### Retry Agent Prompt Wrapper (from retry.ts lines 629-637)

```typescript
export async function retryAgentPrompt<T>(
  agentPromptFn: () => Promise<T>,
  context: { agentType: string; operation: string }
): Promise<T> {
  return retry(agentPromptFn, {
    ...AGENT_RETRY_CONFIG,
    onRetry: createDefaultOnRetry(`${context.agentType}.${context.operation}`),
  });
}
```

**AGENT_RETRY_CONFIG** (lines 597-605):

```typescript
const AGENT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

**Two-Level Retry**:

1. **Agent Prompt Retry**: Handles transient LLM failures (network, timeout)
2. **Fix-and-Retry**: Handles validation failures (implementation bugs)

---

## 4. BashMCP Integration

### File Location

- **Path**: `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`
- **Lines**: 307 total
- **Key Class**: `BashMCP`

### BashMCP Usage in PRP Executor (Line 181)

```typescript
readonly #bashMCP: BashMCP;
```

### Validation Command Execution (Lines 360-364)

```typescript
const result = await this.#bashMCP.execute_bash({
  command: gate.command,
  cwd: this.sessionPath,
  timeout: 120000, // 2 minute timeout for validation commands
});
```

### BashMCP.execute_bash() Method (Lines 299-301)

```typescript
async execute_bash(input: BashToolInput): Promise<BashToolResult> {
  return executeBashCommand(input);
}
```

### BashToolInput Interface (Lines 36-43)

```typescript
interface BashToolInput {
  command: string;
  cwd?: string;
  timeout?: number;
}
```

### BashToolResult Interface (Lines 52-63)

```typescript
interface BashToolResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}
```

### Command Execution (Lines 131-241)

#### Safety Features

```typescript
// PATTERN: Validate working directory exists
const workingDir =
  typeof cwd === 'string'
    ? (() => {
        const absoluteCwd = resolve(cwd);
        if (!existsSync(absoluteCwd)) {
          throw new Error(`Working directory does not exist: ${absoluteCwd}`);
        }
        return realpathSync(absoluteCwd);
      })()
    : undefined;
```

#### Command Parsing

```typescript
// PATTERN: Parse command into executable and arguments
// Simple split on spaces - for production, use proper shell parsing
const args = command.split(' ');
const executable = args[0] ?? '';
const commandArgs = args.slice(1);
```

**⚠️ NOTE**: Current implementation uses simple space splitting (line 150)

- Production systems should use proper shell parsing
- Vulnerable to commands with quoted arguments

#### Spawn Execution (Lines 158-171)

```typescript
try {
  child = spawn(executable, commandArgs, {
    cwd: workingDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false, // CRITICAL: Prevents shell injection
  });
} catch (error) {
  return Promise.resolve({
    success: false,
    stdout: '',
    stderr: '',
    exitCode: null,
    error: error instanceof Error ? error.message : String(error),
  });
}
```

**Safety**:

- `shell: false` prevents shell injection
- Uses argument array (not shell string)
- Handles spawn errors synchronously

#### Timeout Handling (Lines 179-191)

```typescript
const timeoutId = setTimeout(() => {
  timedOut = true;
  killed = true;
  child.kill('SIGTERM');

  // PATTERN: Force kill after grace period
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 2000);
}, timeout);
```

**Timeout Strategy**:

1. Send SIGTERM after timeout
2. Wait 2 seconds grace period
3. Send SIGKILL if process still running
4. Default timeout: 30000ms (30 seconds)
5. Validation timeout: 120000ms (2 minutes)

#### Output Capture (Lines 194-207)

```typescript
if (child.stdout) {
  child.stdout.on('data', (data: Buffer) => {
    if (killed) return;
    stdout += data.toString();
  });
}

if (child.stderr) {
  child.stderr.on('data', (data: Buffer) => {
    if (killed) return;
    stderr += data.toString();
  });
}
```

**Features**:

- Captures stdout and stderr separately
- Stops capture after kill (prevents data races)
- Converts Buffer to string

---

## 5. PRP Execute Prompt Structure

### File Location

- **Path**: `/home/dustin/projects/hacky-hack/PROMPTS.md`
- **Lines**: 641-714
- **Prompt Name**: `PRP_EXECUTE_PROMPT` (referenced as `PRP_BUILDER_PROMPT` in code)

### Prompt Structure

````markdown
# Execute BASE PRP

## PRP File: (path provided below)

## Mission: One-Pass Implementation Success

PRPs enable working code on the first attempt through:

- **Context Completeness**: Everything needed, nothing guessed
- **Progressive Validation**: 4-level gates catch errors early
- **Pattern Consistency**: Follow existing codebase approaches
- Read the attached README to understand PRP concepts

**Your Goal**: Transform the PRP into working code that passes all validation gates.

## Execution Process

1. **Load PRP (CRITICAL FIRST STEP)**
   - **ACTION**: Use the `Read` tool to read the PRP file at the path provided in the instructions below.
   - You MUST read this file before doing anything else. It contains your instructions.
   - Absorb all context, patterns, requirements and gather codebase intelligence
   - Use the provided documentation references and file patterns, consume the right documentation before the appropriate todo/task
   - Trust the PRP's context and guidance - it's designed for one-pass success
   - If needed do additional codebase exploration and research as needed

2. **ULTRATHINK & Plan**
   - Create comprehensive implementation plan following the PRP's task order
   - Break down into clear todos using TodoWrite tool
   - Use subagents for parallel work when beneficial (always create prp inspired prompts for subagents when used)
   - Follow the patterns referenced in the PRP
   - Use specific file paths, class names, and method signatures from PRP context
   - Never guess - always verify the codebase patterns and examples referenced in the PRP yourself

3. **Execute Implementation**
   - Follow the PRP's Implementation Tasks sequence, add more detail as needed, especially when using subagents
   - Use the patterns and examples referenced in the PRP
   - Create files in locations specified by the desired codebase tree
   - Apply naming conventions from the task specifications and CLAUDE.md

4. **Progressive Validation**

   **Execute the level validation system from the PRP:**
   - **Level 1**: Run syntax & style validation commands from PRP
   - **Level 2**: Execute unit test validation from PRP
   - **Level 3**: Run integration testing commands from PRP
   - **Level 4**: Execute specified validation from PRP

   **Each level must pass before proceeding to the next.**

5. **Completion Verification**
   - Work through the Final Validation Checklist in the PRP
   - Verify all Success Criteria from the "What" section are met
   - Confirm all Anti-Patterns were avoided
   - Implementation is ready and working

**Failure Protocol**: When validation fails, use the patterns and gotchas from the PRP to fix issues, then re-run validation until passing.

If a fundamental issue with the plan is found, halt and produce a thorough explanation of the problem at a 10th grade level.

Strictly output your results in this JSON format:

```json
{
   "result": "success" | "error" | "issue",
   "message": "Detailed explanation of the issue"
}
```
````

<PRP-README>
$PRP_README
</PRP-README>
```

### Key Instructions

1. **Load PRP First**: Critical first step - must read PRP file
2. **Use Read Tool**: Read the PRP file at injected path
3. **Follow Patterns**: Trust PRP context, don't guess
4. **Progressive Validation**: Execute all 4 levels sequentially
5. **JSON Output**: Return structured result with status

### Placeholder Replacement

```typescript
const injectedPrompt = PRP_BUILDER_PROMPT.replace(/\$PRP_FILE_PATH/g, prpPath);
```

**Placeholders**:

- `$PRP_FILE_PATH`: Replaced with actual PRP file path
- `$PRP_README`: Additional PRP README content

---

## 6. Existing Test Patterns

### Unit Tests: `/home/dustin/projects/hacky-hack/tests/unit/agents/prp-executor.test.ts`

**Lines**: 610 total
**Approach**: Full mocking of all dependencies

#### Mock Setup (Lines 22-45)

```typescript
// Mock the agent-factory module
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createCoderAgent: vi.fn(),
}));

// Mock the prompts module
vi.mock('../../../src/agents/prompts.js', () => ({
  PRP_BUILDER_PROMPT: '# Execute BASE PRP\n\n## PRP File: $PRP_FILE_PATH',
}));

// Mock the bash-mcp module
vi.mock('../../../src/tools/bash-mcp.js', () => ({
  BashMCP: vi.fn().mockImplementation(() => ({
    execute_bash: vi.fn(),
  })),
}));
```

#### Test Data Factory (Lines 52-88)

```typescript
const createMockPRPDocument = (taskId: string): PRPDocument => ({
  taskId,
  objective: 'Implement feature X',
  context: '## Context\nFull context here',
  implementationSteps: ['Step 1: Create file', 'Step 2: Implement logic'],
  validationGates: [
    {
      level: 1,
      description: 'Syntax check',
      command: 'npm run lint',
      manual: false,
    },
    {
      level: 2,
      description: 'Unit tests',
      command: 'npm test',
      manual: false,
    },
    {
      level: 3,
      description: 'Integration tests',
      command: 'npm run test:integration',
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

#### Mock Agent Setup (Lines 95-104)

```typescript
beforeEach(() => {
  // Setup mock agent
  mockAgent = createMockAgent();
  mockCreateCoderAgent.mockReturnValue(mockAgent);

  // Setup mock BashMCP execute_bash method
  mockExecuteBash = vi.fn();
  mockBashMCP.mockImplementation(() => ({
    execute_bash: mockExecuteBash,
  }));
});
```

#### Test Scenarios

1. **Constructor Tests** (Lines 111-139)
   - Creates PRPExecutor with session path
   - Creates Coder Agent in constructor
   - Throws error when no session path provided

2. **Happy Path** (Lines 142-180)
   - Successfully executes PRP with all validation gates passing
   - Verifies all 4 validation gates executed
   - Checks fixAttempts is 0

3. **Manual Gate Skipping** (Lines 182-213)
   - Verifies Level 4 (manual) was skipped
   - Skipped gates count as passed

4. **Coder Agent Error** (Lines 215-235)
   - Returns failed result when Coder Agent reports error
   - No validation gates executed

5. **Fix-and-Retry Trigger** (Lines 237-291)
   - State machine for bashMCP.execute_bash
   - First run: Level 1 passes, Level 2 fails
   - Second run: All pass
   - Verifies fixAttempts is 1

6. **Exhaust Fix Attempts** (Lines 293-327)
   - bashMCP.execute_bash always fails at Level 2
   - Verifies fixAttempts is 2 (max)
   - Verifies success is false

7. **JSON Parsing Errors** (Lines 329-377)
   - Handles invalid JSON
   - Handles JSON wrapped in markdown code blocks

8. **Exception Handling** (Lines 379-395)
   - Catches and returns network timeout errors

9. **Sequential Order** (Lines 397-428)
   - Tracks execution order
   - Verifies gates execute in order 1, 2, 3

10. **Stop-on-Fail** (Lines 430-491)
    - Level 2 fails, Level 3 should not execute
    - Verifies only 2 results (L1, L2, L4 skipped)

### Integration Tests: `/home/dustin/projects/hacky-hack/tests/integration/prp-executor-integration.test.ts`

**Lines**: 460 total
**Approach**: Real BashMCP, mocked agent

#### Mock Setup (Lines 17-33)

```typescript
// Mock the agent-factory module but preserve real BashMCP
vi.mock('../../src/agents/agent-factory.js', () => {
  const actual = vi.importActual('../../src/agents/agent-factory.js');
  return {
    ...(actual as any),
    createCoderAgent: vi.fn(),
  };
});

// Mock the prompts module
vi.mock('../../src/agents/prompts.js', () => ({
  PRP_BUILDER_PROMPT: '# Execute BASE PRP\n\n## PRP File: $PRP_FILE_PATH',
}));
```

**Key Difference**: Preserves real BashMCP, mocks only agent

#### Test Scenarios

1. **Real BashMCP Execution** (Lines 94-130)
   - Uses real echo commands
   - Verifies stdout capture
   - Verifies Level 4 skipped

2. **Real Failure Handling** (Lines 132-196)
   - Uses `false` command (exits with code 1)
   - Verifies Level 2 fails
   - Verifies Level 3 not executed

3. **Null Command Handling** (Lines 225-278)
   - Tests gates with null command and manual=false
   - Verifies gate skipped

4. **Output Capture** (Lines 280-327)
   - Verifies stdout captured correctly
   - Uses `echo "Hello from stdout"`

### BashMCP Integration Tests: `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts`

**Lines**: 814 total
**Approach**: Mock child_process, real tool logic

#### Mock Setup (Lines 26-58)

```typescript
// Mock child_process for BashMCP
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

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
```

#### Mock ChildProcess Factory (Lines 98-133)

```typescript
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
```

**Key Features**:

- Simulates async data emission with setTimeout
- Emits 'data' events for stdout/stderr
- Emits 'close' event with exit code
- Mocks kill() method

#### Test Scenarios

1. **Basic Execution** (Lines 171-202)
   - Executes `echo hello world`
   - Verifies spawn called with correct arguments
   - Verifies success, stdout, exitCode

2. **Working Directory** (Lines 204-236)
   - Executes with cwd parameter
   - Verifies realpathSync called
   - Verifies spawn receives real path

3. **Timeout Handling** (Lines 238-281)
   - Creates stubborn child that never closes
   - Waits for timeout + SIGKILL grace period
   - Verifies both SIGTERM and SIGKILL sent

4. **Non-Zero Exit Code** (Lines 283-306)
   - Command exits with code 1
   - Verifies success is false
   - Verifies error message

5. **Spawn Error** (Lines 308-330)
   - spawn throws ENOENT
   - Verifies success is false
   - Verifies exitCode is null

6. **Working Directory Not Found** (Lines 332-346)
   - existsSync returns false
   - Verifies error message

---

## 7. Coder Agent Configuration

### Agent Factory (from agent-factory.ts)

```typescript
export function createCoderAgent(): Agent {
  return createAgent('Coder', {
    model: getModel('DEFAULT_SONNET_MODEL'), // GLM-4.7
    maxTokens: 4096,
    cacheControl: true,
    tools: [new BashMCP(), new FilesystemMCP(), new GitMCP()],
  });
}
```

### Coder Agent Specifications

**From system_context.md (lines 67-72)**:

| Agent     | Role                 | Model   | Max Tokens | Cache |
| --------- | -------------------- | ------- | ---------- | ----- |
| **Coder** | PRP → Implementation | GLM-4.7 | 4096       | ✅    |

**Tools Available**:

- **BashMCP**: Shell command execution
- **FilesystemMCP**: File I/O, glob, grep
- **GitMCP**: Git operations

### Agent Prompt Pattern

From PROMPTS.md:

- Load PRP file first (critical step)
- Use Read tool to read PRP
- Absorb context, patterns, requirements
- Execute implementation following PRP tasks
- Run progressive validation (4 levels)
- Output JSON result

---

## 8. Data Models

### PRPDocument Interface (from models.ts lines 1196+)

```typescript
export interface PRPDocument {
  readonly taskId: string;
  readonly objective: string;
  readonly context: string;
  readonly implementationSteps: string[];
  readonly validationGates: ValidationGate[];
  readonly successCriteria: Array<{
    description: string;
    satisfied: boolean;
  }>;
  readonly references: string[];
}
```

### ValidationGate Interface (from models.ts lines 1000-1030)

```typescript
export interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly command: string | null;
  readonly manual: boolean;
}
```

**Validation Level Types** (from lines 1006-1010):

- **1**: Syntax & Style (linting, formatting, type checking)
- **2**: Unit Tests (component-level validation)
- **3**: Integration Testing (system-level validation)
- **4**: Manual/Creative (end-to-end workflows, domain-specific)

### ExecutionResult Interface (from prp-executor.ts lines 58-76)

```typescript
export interface ExecutionResult {
  readonly success: boolean;
  readonly validationResults: ValidationGateResult[];
  readonly artifacts: string[];
  readonly error?: string;
  readonly fixAttempts: number;
}
```

**Fields**:

- **success**: Whether all validation gates passed
- **validationResults**: Array of gate execution results
- **artifacts**: File paths created/modified (TODO: not implemented)
- **error**: Error message if execution failed
- **fixAttempts**: Number of fix attempts made (0-2)

---

## 9. Retry Utility Implementation

### File Location

- **Path**: `/home/dustin/projects/hacky-hack/src/utils/retry.ts`
- **Lines**: 706 total

### Transient Error Detection (Lines 324-362)

```typescript
export function isTransientError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') {
    return false;
  }

  const err = error as RetryableError;

  // Check PipelineError
  if (isPipelineError(err)) {
    const errorCode = err.code;
    return (
      errorCode === ErrorCodes.PIPELINE_AGENT_TIMEOUT ||
      errorCode === ErrorCodes.PIPELINE_AGENT_LLM_FAILED
    );
  }

  // ValidationError is never retryable
  if (isValidationError(err)) {
    return false;
  }

  // Check Node.js system error code
  if (typeof err.code === 'string' && TRANSIENT_ERROR_CODES.has(err.code)) {
    return true;
  }

  // Check HTTP status code
  const status = err.response?.status as number | undefined;
  if (typeof status === 'number' && RETRYABLE_HTTP_STATUS_CODES.has(status)) {
    return true;
  }

  // Check error message patterns
  const message = String(err.message ?? '').toLowerCase();
  return TRANSIENT_PATTERNS.some(pattern => message.includes(pattern));
}
```

**Transient Error Codes** (Lines 68-78):

- `ECONNRESET`: Connection reset by peer
- `ECONNREFUSED`: Connection refused
- `ETIMEDOUT`: Connection timeout
- `ENOTFOUND`: DNS lookup failed
- `EPIPE`: Broken pipe
- `EAI_AGAIN`: DNS temporary failure
- `EHOSTUNREACH`: Host unreachable
- `ENETUNREACH`: Network unreachable
- `ECONNABORTED`: Connection aborted

**Retryable HTTP Status Codes** (Lines 88-95):

- 408: Request Timeout
- 429: Too Many Requests
- 500+: Server errors (may be temporary)

**Transient Patterns** (Lines 103-114):

- 'timeout', 'network error', 'temporarily unavailable'
- 'service unavailable', 'connection reset'
- 'connection refused', 'rate limit'
- 'too many requests', 'econnreset', 'etimedout'

**Permanent Patterns** (Lines 123-131):

- 'validation failed', 'invalid input'
- 'unauthorized', 'forbidden', 'not found'
- 'authentication failed', 'parse error'

### Retry Function (Lines 476-530)

```typescript
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitterFactor = 0.1,
    isRetryable = isTransientError,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error)) {
        throw error;
      }

      if (attempt >= maxAttempts - 1) {
        throw error;
      }

      const delay = calculateDelay(
        attempt,
        baseDelay,
        maxDelay,
        backoffFactor,
        jitterFactor
      );

      onRetry?.(attempt + 1, error, delay);
      await sleep(delay);
    }
  }

  throw lastError;
}
```

### Delay Calculation (Lines 247-269)

```typescript
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitterFactor: number
): number {
  // Exponential backoff with cap
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );

  // Positive jitter: always adds variance
  const jitter = exponentialDelay * jitterFactor * Math.random();

  const delay = Math.max(1, Math.floor(exponentialDelay + jitter));

  return delay;
}
```

**Example** (baseDelay=1000, backoffFactor=2, jitterFactor=0.1):

- Attempt 0: 1000ms to 1100ms
- Attempt 1: 2000ms to 2200ms
- Attempt 2: 4000ms to 4400ms
- Attempt 3+: 30000ms (capped) to 33000ms

### Agent Prompt Retry Wrapper (Lines 629-637)

```typescript
export async function retryAgentPrompt<T>(
  agentPromptFn: () => Promise<T>,
  context: { agentType: string; operation: string }
): Promise<T> {
  return retry(agentPromptFn, {
    ...AGENT_RETRY_CONFIG,
    onRetry: createDefaultOnRetry(`${context.agentType}.${context.operation}`),
  });
}
```

**AGENT_RETRY_CONFIG**:

```typescript
const AGENT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

---

## Key Implementation Details for Testing

### 1. Validation Gate Execution Order

**Critical**: Gates execute in sequential order, stopping on first failure

**Test Pattern** (from prp-executor.test.ts lines 397-428):

```typescript
// Track execution order
const executionOrder: number[] = [];
mockExecuteBash.mockImplementation(({ command }: any) => {
  if (command === 'npm run lint') executionOrder.push(1);
  if (command === 'npm test') executionOrder.push(2);
  if (command === 'npm run test:integration') executionOrder.push(3);
  return Promise.resolve({
    success: true,
    stdout: '',
    stderr: '',
    exitCode: 0,
  });
});

// Verify: Gates executed in order 1, 2, 3
expect(executionOrder).toEqual([1, 2, 3]);
```

### 2. Stop-on-Fail Behavior

**Critical**: Execution stops at first failing gate

**Test Pattern** (from prp-executor.test.ts lines 430-491):

```typescript
// Level 2 fails, Level 3 should not execute
mockExecuteBash.mockImplementation(({ command }: any) => {
  if (command === 'npm run lint') {
    return Promise.resolve({ success: true, ... });
  }
  if (command === 'npm test') {
    return Promise.resolve({ success: false, ... });
  }
  if (command === 'npm run test:integration') {
    // This should not be called
    return Promise.resolve({ success: true, ... });
  }
});

// Verify: Level 3 was not executed
const nonSkippedResults = result.validationResults.filter(r => !r.skipped);
expect(nonSkippedResults).toHaveLength(2); // Only Level 1 and Level 2
```

### 3. Fix-and-Retry State Machine

**Critical**: BashMCP must simulate state changes across validation runs

**Test Pattern** (from prp-executor.test.ts lines 257-278):

```typescript
// Mock bashMCP.execute_bash to implement a state machine
let callCount = 0;
mockExecuteBash.mockImplementation(async () => {
  callCount++;
  // First validation run
  if (callCount === 1) {
    // Level 1: Pass
    return { success: true, stdout: '', stderr: '', exitCode: 0 };
  } else if (callCount === 2) {
    // Level 2: Fail -> triggers fix attempt
    return {
      success: false,
      stdout: '',
      stderr: 'Test failed',
      exitCode: 1,
    };
  }
  // Second validation run (after fix)
  // All remaining gates pass
  return { success: true, stdout: 'Passed', stderr: '', exitCode: 0 };
});
```

### 4. Mock ChildProcess for BashMCP

**Critical**: Must simulate async event emission

**Test Pattern** (from tools.test.ts lines 98-133):

```typescript
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
```

**Key Points**:

- Use setTimeout for async emission
- Emit 'data' events for stdout/stderr
- Emit 'close' event with exit code
- Mock kill() method for timeout tests

### 5. Real Timers for Timeout Tests

**Critical**: Must use real timers for timeout testing

**Test Pattern** (from tools.test.ts lines 238-281):

```typescript
it('should handle timeout correctly with SIGTERM then SIGKILL', async () => {
  vi.useRealTimers(); // Use real timers for timeout testing

  // SETUP - Create a child that never closes
  let closeCallback: ((code: number) => void) | null = null;
  let childKilled = false;
  const killCalls: string[] = [];
  const stubbornChild = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, callback: any) => {
      if (event === 'close') closeCallback = callback;
    }),
    kill: vi.fn((signal: string) => {
      killCalls.push(signal);
      childKilled = signal === 'SIGKILL';
    }),
    get killed() {
      return childKilled;
    },
  } as any;
  mockSpawn.mockReturnValue(stubbornChild);

  // EXECUTE - start command
  const resultPromise = bashMCP.executeTool('bash__execute_bash', {
    command: 'stubborn',
    timeout: 100,
  });

  // Wait for initial timeout + SIGKILL grace period
  await new Promise(resolve => setTimeout(resolve, 2250));

  // VERIFY - both SIGTERM and SIGKILL should be called
  expect(killCalls).toContain('SIGTERM');
  expect(killCalls).toContain('SIGKILL');

  // Clean up - trigger close to resolve promise
  if (closeCallback) {
    closeCallback(137); // SIGKILL exit code
  }
  await resultPromise;

  vi.useFakeTimers(); // Restore fake timers for other tests
});
```

### 6. Module-Level Mocking with Hoisting

**Critical**: Mocks must be at top level before imports

**Test Pattern** (from tools.test.ts lines 26-40):

```typescript
// =============================================================================
// MOCK PATTERN: Module-level mocking with hoisting
// All mocks must be at top level before imports due to hoisting
// =============================================================================

// Mock child_process for BashMCP
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock node:fs for BashMCP
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path: unknown) => path as string),
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

// Import after mocking - get mocked versions
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs, existsSync, realpathSync } from 'node:fs';
```

### 7. JSON Parsing from Markdown

**Critical**: Must handle both raw JSON and markdown-wrapped JSON

**Test Pattern** (from prp-executor.test.ts lines 347-377):

```typescript
it('should handle JSON wrapped in markdown code blocks', async () => {
  // SETUP
  const prp = createMockPRPDocument('P1.M2.T2.S2');
  const prpPath = '/tmp/test-session/prps/P1M2T2S2.md';

  // Mock Coder Agent to return JSON in markdown
  mockAgent.prompt.mockResolvedValue(`
\`\`\`json
{
  "result": "success",
  "message": "Implementation complete"
}
\`\`\`
  `);

  // Mock validation to pass
  mockExecuteBash.mockResolvedValue({
    success: true,
    stdout: '',
    stderr: '',
    exitCode: 0,
  });

  const executor = new PRPExecutor(sessionPath);

  // EXECUTE
  const result = await executor.execute(prp, prpPath);

  // VERIFY: JSON was parsed correctly
  expect(result.success).toBe(true);
});
```

---

## TODO Items and Implementation Gaps

### 1. Artifacts Extraction (Line 307)

**Current Implementation**:

```typescript
artifacts: [], // TODO: Extract artifacts from Coder Agent output
```

**Status**: Not implemented
**Impact**: Cannot track files created/modified during execution
**Recommendation**: Parse Coder Agent output for file operations

### 2. Command Parsing (Line 150)

**Current Implementation**:

```typescript
// Simple split on spaces - for production, use proper shell parsing
const args = command.split(' ');
```

**Status**: Simple implementation
**Impact**: Vulnerable to commands with quoted arguments
**Recommendation**: Use proper shell parsing library

### 3. Validation Results Artifacts

**Expected Artifacts** (from system_context.md):

- `$SESSION_DIR/artifacts/P1M1T1S1/validation-results.json`
- `$SESSION_DIR/artifacts/P1M1T1S1/execution-summary.md`
- `$SESSION_DIR/artifacts/P1M1T1S1/artifacts-list.json`

**Status**: Not implemented
**Impact**: No artifact persistence for debugging
**Recommendation**: Implement artifact collection after validation

---

## Summary of Key Findings

### PRP Executor Architecture

1. **Two-Level Retry System**:
   - Agent Prompt Retry: Transient LLM failures (network, timeout)
   - Fix-and-Retry: Validation failures (implementation bugs)

2. **Progressive Validation**:
   - 4 levels executed sequentially
   - Stop-on-fail behavior
   - Manual gates skipped
   - 2-minute timeout per gate

3. **BashMCP Integration**:
   - Direct execute_bash() method (non-MCP path)
   - Safe command execution (shell: false)
   - Timeout protection (SIGTERM + SIGKILL)
   - Output capture (stdout, stderr, exitCode)

### Test Patterns to Follow

1. **Unit Tests**: Full mocking of all dependencies
2. **Integration Tests**: Real BashMCP, mocked agent
3. **BashMCP Tests**: Mock child_process, real tool logic
4. **State Machines**: Implement call counting for fix-and-retry
5. **Real Timers**: Use vi.useRealTimers() for timeout tests
6. **Module-Level Mocking**: Hoist mocks before imports

### Test Patterns to Avoid

1. **Don't use fake timers for timeout tests**: Use real timers
2. **Don't mock without state machines**: Fix-and-retry needs state tracking
3. **Don't forget async emission**: ChildProcess events must be async
4. **Don't skip cleanup**: Restore fake timers after real timer tests

### Critical Line Numbers

**prp-executor.ts**:

- Line 194-202: Constructor
- Line 238-322: Main execute() method
- Line 242-246: PRP path injection
- Line 249-255: Coder Agent execution with retry
- Line 258: JSON result parsing
- Line 271-299: Validation gates with fix-and-retry
- Line 302-312: Final result building
- Line 335-396: #runValidationGates() method
- Line 411-458: #fixAndRetry() method
- Line 471-485: #parseCoderResult() method

**bash-mcp.ts**:

- Line 131-241: executeBashCommand() function
- Line 150: Command parsing (simple split)
- Line 158-171: Spawn execution with error handling
- Line 179-191: Timeout handling (SIGTERM + SIGKILL)
- Line 194-207: Output capture
- Line 299-301: execute_bash() direct method

**retry.ts**:

- Line 324-362: isTransientError() function
- Line 389-411: isPermanentError() function
- Line 476-530: retry() main function
- Line 247-269: calculateDelay() function
- Line 629-637: retryAgentPrompt() wrapper

**models.ts**:

- Line 1000-1030: ValidationGate interface
- Line 1196+: PRPDocument interface

**PROMPTS.md**:

- Lines 641-714: PRP_EXECUTE_PROMPT

---

## Research Conclusion

The PRP executor implements a robust execution engine with comprehensive validation and retry logic. The 4-level progressive validation system provides early error detection, while the fix-and-retry mechanism handles implementation bugs automatically. BashMCP integration ensures safe command execution with proper timeout handling.

**Existing test coverage is comprehensive**, with both unit and integration test patterns well-established. The primary gap is artifact collection, which is marked as TODO and not yet implemented.

**For comprehensive integration testing**, follow the existing patterns:

- Use state machines for fix-and-retry scenarios
- Mock ChildProcess with async event emission
- Use real timers for timeout tests
- Implement module-level mocking with hoisting

**Key implementation details to test**:

- Sequential gate execution with stop-on-fail
- Exponential backoff with jitter
- Two-level retry system (agent + fix)
- JSON parsing from markdown code blocks
- BashMCP timeout handling (SIGTERM + SIGKILL)
- Manual gate skipping logic

---

**End of Research Document**
