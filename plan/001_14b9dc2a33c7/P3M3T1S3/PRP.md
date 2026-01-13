# PRP for P3.M3.T1.S3: Integrate PRP Generation and Execution

---

## Goal

**Feature Goal**: Create `PRPRuntime` class that orchestrates the complete inner loop workflow: Research (PRP generation) → Implementation (PRP execution) → Validation → Artifact collection, with full status management and error handling.

**Deliverable**: `src/agents/prp-runtime.ts` containing `PRPRuntime` class with:

- `executeSubtask(subtask: Subtask, backlog: Backlog): Promise<ExecutionResult>` method
- Integrated `PRPGenerator` for research phase
- Integrated `PRPExecutor` for implementation phase
- Status management through `TaskOrchestrator.setStatus()`
- Artifact directory creation at `{sessionPath}/artifacts/{subtask.id}/`
- Structured `ExecutionResult` for orchestration feedback

**Success Definition**:

- `PRPRuntime.executeSubtask()` successfully orchestrates the complete inner loop
- Status transitions: `Researching` → `Implementing` → `Complete`/`Failed`
- PRPs generated and written to `{sessionPath}/prps/{taskId}.md`
- PRPs executed with progressive validation via `PRPExecutor`
- Artifacts directory created and populated
- Returns structured `ExecutionResult` for downstream orchestration
- All existing tests continue to pass
- New tests validate PRPRuntime orchestration scenarios
- Full type safety with TypeScript

## User Persona (if applicable)

**Target User**: TaskOrchestrator (internal pipeline automation)

**Use Case**: The TaskOrchestrator delegates subtask execution to `PRPRuntime` when processing the execution queue. The runtime orchestrates PRP generation (research), PRP execution (implementation), status management, and artifact collection.

**User Journey**:

1. TaskOrchestrator selects next Subtask from execution queue
2. Creates `PRPRuntime` instance with orchestrator reference
3. Calls `executeSubtask(subtask, backlog)`
4. PRPRuntime sets status to `Researching`
5. Generates PRP via `PRPGenerator.generate()`
6. Sets status to `Implementing`
7. Executes PRP via `PRPExecutor.execute()`
8. Creates artifacts directory at `{sessionPath}/artifacts/{subtask.id}/`
9. Writes execution artifacts (validation results, etc.)
10. Sets status to `Complete` or `Failed` based on result
11. Returns `ExecutionResult` for orchestration
12. TaskOrchestrator continues pipeline processing

**Pain Points Addressed**:

- Eliminates manual orchestration of research → implementation → validation
- Provides consistent status tracking for visibility and debugging
- Centralizes artifact management for audit trails
- Handles error propagation and recovery at orchestration level
- Simplifies TaskOrchestrator by delegating complex inner loop logic

## Why

- **Complete Inner Loop**: The inner loop (research → implementation → validation) is the core execution unit. Without automated orchestration, the pipeline cannot function autonomously.
- **Status Visibility**: Each phase of execution needs explicit status tracking (`Researching` → `Implementing`) for monitoring, debugging, and audit trails.
- **Artifact Management**: Execution artifacts (validation results, logs, generated files) must be collected and organized for debugging and reference.
- **Separation of Concerns**: TaskOrchestrator handles queue management and delegation; PRPRuntime handles the actual execution workflow.
- **Error Handling**: Coordinated error handling across PRP generation and execution with proper status transitions to `Failed`.
- **Dependency Integration**: Both `PRPGenerator` (P3.M3.T1.S1) and `PRPExecutor` (P3.M3.T1.S2) exist as separate components; PRPRuntime integrates them.

## What

### System Behavior

The `PRPRuntime` class:

1. Accepts a `Subtask`, `Backlog`, and `TaskOrchestrator` reference in `executeSubtask()`
2. Sets subtask status to `Researching` via orchestrator
3. Generates PRP via `PRPGenerator.generate(subtask, backlog)`
4. Sets subtask status to `Implementing` via orchestrator
5. Constructs PRP file path: `{sessionPath}/prps/{taskId}.md`
6. Creates artifacts directory: `{sessionPath}/artifacts/{subtask.id}/`
7. Executes PRP via `PRPExecutor.execute(prp, prpPath)`
8. Writes execution artifacts to artifacts directory
9. Sets subtask status to `Complete` or `Failed` based on result
10. Returns `ExecutionResult` with success status and artifacts

### Success Criteria

- [ ] `PRPRuntime` class created in `src/agents/prp-runtime.ts`
- [ ] `executeSubtask()` method accepts `Subtask`, `Backlog`, returns `ExecutionResult`
- [ ] Status progression: `Researching` → `Implementing` → `Complete`/`Failed`
- [ ] PRP generation via `PRPGenerator.generate()` completes successfully
- [ ] PRP execution via `PRPExecutor.execute()` completes with validation
- [ ] Artifacts directory created at `{sessionPath}/artifacts/{subtask.id}/`
- [ ] Execution artifacts written (validation results, summary)
- [ ] Returns structured `ExecutionResult` with all fields populated
- [ ] Unit tests for happy path, PRP generation failure, execution failure
- [ ] Integration test with mocked dependencies
- [ ] Zero regressions in existing test suite

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact file paths to all dependencies (PRPGenerator, PRPExecutor, TaskOrchestrator)
- Complete code patterns for status management and error handling
- Exact method signatures and return types
- Directory structure patterns for session paths and artifacts
- Specific test patterns matching existing codebase
- Interface definitions for all types used
- PRPExecutor contract from previous work item (P3.M3.T1.S2)
- PRPGenerator contract from previous work item (P3.M3.T1.S1)

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: src/agents/prp-generator.ts
  why: PRPGenerator class - generate() method, file path patterns
  pattern: Constructor takes SessionManager, generate() returns Promise<PRPDocument>
  gotcha: PRP file written to {sessionPath}/prps/{taskId}.md (taskId sanitized with underscores)

- file: src/agents/prp-executor.ts
  why: PRPExecutor class - execute() method, ExecutionResult interface
  pattern: Constructor takes sessionPath, execute() returns Promise<ExecutionResult>
  critical: This is the CONTRACT from P3.M3.T1.S2 - assume it exists exactly as specified

- file: src/core/task-orchestrator.ts (lines 163-192, 530-606)
  why: setStatus() method, executeSubtask() pattern for status progression
  pattern: await this.setStatus(itemId, status, reason) for logging and persistence
  critical: Status progression must be: Researching → Implementing → Complete/Failed

- file: src/core/models.ts (lines 1114-1223)
  why: PRPDocument interface, Status type definition
  fields: taskId (string), objective, context, implementationSteps, validationGates, successCriteria, references

- file: src/core/session-manager.ts
  why: currentSession.metadata.path for session path, updateItemStatus() pattern
  pattern: sessionManager.currentSession.metadata.path returns session directory path

- file: src/agents/agent-factory.ts
  why: createResearcherAgent(), createCoderAgent() - understand agent creation
  pattern: Factory functions returning Groundswell Agent instances
  gotcha: configureEnvironment() already called at module load

- file: plan/001_14b9dc2a33c7/P3M3T1S2/PRP.md
  why: PRPExecutor contract - this is the EXACT specification of what exists
  critical: PRPExecutor.execute(prp, prpPath) returns Promise<ExecutionResult>
  fields: success, validationResults, artifacts, error, fixAttempts

- file: plan/001_14b9dc2a33c7/P3M3T1S1/PRP.md
  why: PRPGenerator contract - this is the EXACT specification of what exists
  critical: PRPGenerator.generate(task, backlog) returns Promise<PRPDocument>

- file: tests/unit/agents/prp-generator.test.ts
  why: Test pattern reference for PRPGenerator mocking
  pattern: Mock SessionManager, mock agent.prompt(), validate generate() calls

- url: https://www.typescriptlang.org/docs/handbook/2/classes.html#private-protected-and-modifier
  why: TypeScript private field syntax (# prefix) for internal state

- url: https://nodejs.org/api/fs.html#fsmkdirpath-options
  why: fs/promises.mkdir() with recursive: true for directory creation
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts       # createResearcherAgent(), createCoderAgent()
│   ├── prp-generator.ts       # PRPGenerator - USE THIS (from P3.M3.T1.S1)
│   ├── prp-executor.ts        # PRPExecutor - USE THIS (from P3.M3.T1.S2)
│   └── prompts.ts             # PRP_BUILDER_PROMPT
├── core/
│   ├── models.ts              # PRPDocument, Status, Subtask, Backlog types
│   ├── session-manager.ts     # SessionManager class
│   ├── task-orchestrator.ts   # TaskOrchestrator.setStatus() - USE THIS
│   └── scope-resolver.ts      # Scope types and utilities
├── tools/
│   ├── bash-mcp.ts           # BashMCP for validation commands
│   ├── filesystem-mcp.ts      # FilesystemMCP for artifact writing
│   └── git-mcp.ts            # GitMCP
└── utils/
    └── task-utils.ts          # Task utilities

tests/
├── unit/
│   ├── agents/
│   │   ├── agent-factory.test.ts
│   │   └── prp-generator.test.ts
│   ├── config/
│   │   └── environment.test.ts
│   └── core/
│       └── task-orchestrator.test.ts
└── integration/
    └── (integration tests)
```

### Desired Codebase Tree with Files to be Added

```bash
src/
├── agents/
│   ├── agent-factory.ts       # EXISTING - createResearcherAgent(), createCoderAgent()
│   ├── prp-generator.ts       # EXISTING - PRPGenerator (from P3.M3.T1.S1)
│   ├── prp-executor.ts        # EXISTING - PRPExecutor (from P3.M3.T1.S2)
│   └── prp-runtime.ts         # NEW - PRPRuntime class

tests/
├── unit/
│   └── agents/
│       ├── prp-generator.test.ts  # EXISTING
│       ├── prp-executor.test.ts   # EXISTING (from P3.M3.T1.S2)
│       └── prp-runtime.test.ts    # NEW - Unit tests for PRPRuntime
└── integration/
    └── prp-runtime-integration.test.ts  # NEW - Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports must use .js extension
// Even though source is .ts, imports must reference .js
import { PRPGenerator } from './prp-generator.js';
import { PRPExecutor } from './prp-executor.js';
import type { TaskOrchestrator } from '../core/task-orchestrator.js';

// CRITICAL: PRPGenerator constructor takes SessionManager
const generator = new PRPGenerator(sessionManager);

// CRITICAL: PRPExecutor constructor takes sessionPath (string)
const executor = new PRPExecutor(sessionPath);

// CRITICAL: Status progression must follow exact sequence
// Researching → Implementing → Complete OR Failed
await orchestrator.setStatus(
  subtask.id,
  'Researching',
  'Starting PRP generation'
);
await orchestrator.setStatus(
  subtask.id,
  'Implementing',
  'Starting implementation'
);

// CRITICAL: PRP file path uses sanitized taskId (dots → underscores)
// File is written to {sessionPath}/prps/{sanitizedTaskId}.md
const sanitizedId = subtask.id.replace(/\./g, '_');
const prpPath = join(sessionPath, 'prps', `${sanitizedId}.md`);

// CRITICAL: Artifacts directory path pattern
const artifactsDir = join(sessionPath, 'artifacts', subtask.id);
await mkdir(artifactsDir, { recursive: true });

// PATTERN: TaskOrchestrator.setStatus() is async, must be awaited
// The reason parameter is only for logging, not stored
await orchestrator.setStatus(itemId, status, 'Reason for status change');

// PATTERN: Always wrap execution in try/catch for proper error handling
// Set status to Failed on exception with error details
try {
  // ... execution ...
  await orchestrator.setStatus(subtask.id, 'Complete', 'Success');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  await orchestrator.setStatus(
    subtask.id,
    'Failed',
    `Execution failed: ${errorMessage}`
  );
  throw error; // Re-throw for upstream handling
}

// GOTCHA: PRPExecutor returns ExecutionResult with fixAttempts field
// This indicates how many fix-and-retry attempts were made
const result = await executor.execute(prp, prpPath);
console.log(`Fix attempts: ${result.fixAttempts}`);

// PATTERN: Use join() from 'node:path' for cross-platform path construction
import { join } from 'node:path';
const artifactsDir = join(sessionPath, 'artifacts', subtask.id);

// PATTERN: TaskOrchestrator is passed as constructor parameter
// Use its public setStatus() method for status updates
// Do NOT access private fields (use public API only)
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from codebase:

```typescript
// Re-export from existing modules
import type {
  PRPDocument, // From src/core/models.js
  Subtask, // From src/core/models.js
  Backlog, // From src/core/models.js
  Status, // From src/core/models.js
} from '../core/models.js';

import type {
  ExecutionResult, // From src/agents/prp-executor.js (defined in P3.M3.T1.S2)
} from './prp-executor.js';

import type {
  TaskOrchestrator, // From src/core/task-orchestrator.js
} from '../core/task-orchestrator.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/agents/prp-runtime.ts
  - IMPLEMENT: PRPRuntime class with constructor and executeSubtask() method
  - CLASS STRUCTURE:
    * Constructor: readonly orchestrator (TaskOrchestrator), readonly sessionPath (string)
    * Private fields: #generator (PRPGenerator), #executor (PRPExecutor)
    * Public method: async executeSubtask(subtask: Subtask, backlog: Backlog): Promise<ExecutionResult>
  - NAMING: PascalCase class, camelCase methods/properties
  - PLACEMENT: src/agents/ directory (sibling to prp-generator.ts and prp-executor.ts)
  - DEPENDENCIES: Import from prp-generator.js, prp-executor.js, task-orchestrator.js, models.js

Task 2: IMPLEMENT constructor
  - ACCEPT: orchestrator (TaskOrchestrator) for status management
  - EXTRACT: sessionPath from orchestrator.sessionManager.currentSession.metadata.path
  - CREATE: PRPGenerator instance with sessionManager
  - CREATE: PRPExecutor instance with sessionPath
  - STORE: All in readonly or private fields
  - ERROR HANDLING: Throw if no active session (null check on currentSession)

Task 3: IMPLEMENT executeSubtask() - Research Phase
  - STEP 1: Set status to 'Researching' via orchestrator.setStatus()
  - STEP 2: Log research phase start
  - STEP 3: Call this.#generator.generate(subtask, backlog)
  - STEP 4: Store returned PRPDocument for execution phase
  - ERROR HANDLING: Wrap in try/catch, set status to 'Failed' on exception
  - PROGRESSION: On success, proceed to Implementation phase

Task 4: IMPLEMENT executeSubtask() - Implementation Phase
  - STEP 1: Set status to 'Implementing' via orchestrator.setStatus()
  - STEP 2: Log implementation phase start
  - STEP 3: Construct PRP file path (sanitize taskId, join with sessionPath/prps/)
  - STEP 4: Create artifacts directory at {sessionPath}/artifacts/{subtask.id}/
  - STEP 5: Call this.#executor.execute(prp, prpPath)
  - STEP 6: Write execution artifacts (validation results, summary)
  - ERROR HANDLING: Wrap in try/catch, set status to 'Failed' on exception

Task 5: IMPLEMENT executeSubtask() - Completion Phase
  - ON SUCCESS: Set status to 'Complete' via orchestrator.setStatus()
  - ON FAILURE: Set status to 'Failed' via orchestrator.setStatus() with error message
  - RETURN: ExecutionResult from executor (or failed result on exception)
  - LOGGING: Log final status and result summary

Task 6: IMPLEMENT artifact writing utility
  - CREATE: Private method #writeArtifacts(artifactsDir: string, result: ExecutionResult): Promise<void>
  - WRITE: validation-results.json with all validation gate results
  - WRITE: execution-summary.md with human-readable summary
  - WRITE: artifacts-list.json with list of generated files
  - ERROR HANDLING: Log errors but don't fail execution (artifacts are secondary)

Task 7: CREATE custom error class
  - IMPLEMENT: PRPRuntimeError extends Error
  - FIELDS: subtaskId, phase, originalError
  - USAGE: Throw this error for runtime-specific failures
  - PLACEMENT: Export from src/agents/prp-runtime.ts

Task 8: CREATE tests/unit/agents/prp-runtime.test.ts
  - SETUP: Mock TaskOrchestrator, PRPGenerator, PRPExecutor
  - TEST: executeSubtask() calls generate() and sets Researching status
  - TEST: executeSubtask() calls execute() and sets Implementing status
  - TEST: executeSubtask() sets Complete status on success
  - TEST: executeSubtask() sets Failed status on generation error
  - TEST: executeSubtask() sets Failed status on execution error
  - TEST: executeSubtask() creates artifacts directory
  - TEST: executeSubtask() returns ExecutionResult
  - PATTERN: Use vitest describe/it/expect syntax
  - FIXTURES: Mock subtask, backlog, prp, executionResult

Task 9: CREATE tests/integration/prp-runtime-integration.test.ts
  - SETUP: Use real TaskOrchestrator, PRPGenerator, PRPExecutor
  - MOCK: Mock agent.prompt() calls (no real LLM calls)
  - TEST: Full executeSubtask() flow with real dependencies
  - TEST: Status progression through Researching → Implementing → Complete
  - TEST: Artifacts directory creation and file writing
  - SKIP: Mark as test.skip if running in CI without API credentials
```

### Implementation Patterns & Key Details

````typescript
// File: src/agents/prp-runtime.ts

// CRITICAL: Import patterns - use .js extensions for ES modules
import { PRPGenerator } from './prp-generator.js';
import { PRPExecutor } from './prp-executor.js';
import type { TaskOrchestrator } from '../core/task-orchestrator.js';
import type { SessionManager } from '../core/session-manager.js';
import type { PRPDocument, Subtask, Backlog, Status } from '../core/models.js';
import type { ExecutionResult } from './prp-executor.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Custom error for PRP Runtime failures
 *
 * @remarks
 * Thrown when the runtime orchestration fails at any phase.
 * Includes subtask ID and phase for debugging.
 */
export class PRPRuntimeError extends Error {
  constructor(
    public readonly subtaskId: string,
    public readonly phase: 'Research' | 'Implementation',
    originalError: unknown
  ) {
    super(
      `PRP Runtime failed for ${subtaskId} during ${phase} phase: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'PRPRuntimeError';
  }
}

/**
 * PRP Runtime for orchestrating research → implementation → validation
 *
 * @remarks
 * Orchestrates the complete inner loop workflow:
 * 1. Research Phase: Generate PRP via PRPGenerator (status: Researching)
 * 2. Implementation Phase: Execute PRP via PRPExecutor (status: Implementing)
 * 3. Artifact Collection: Write validation results and summaries
 * 4. Status Update: Complete or Failed based on execution result
 *
 * This class integrates PRPGenerator and PRPExecutor with TaskOrchestrator
 * for full lifecycle management.
 *
 * @example
 * ```typescript
 * const runtime = new PRPRuntime(orchestrator);
 * const result = await runtime.executeSubtask(subtask, backlog);
 * if (result.success) {
 *   console.log('Subtask completed successfully');
 * }
 * ```
 */
export class PRPRuntime {
  /** Task Orchestrator for status management */
  readonly #orchestrator: TaskOrchestrator;

  /** Path to session directory */
  readonly #sessionPath: string;

  /** PRP Generator for research phase */
  readonly #generator: PRPGenerator;

  /** PRP Executor for implementation phase */
  readonly #executor: PRPExecutor;

  /**
   * Creates a new PRPRuntime instance
   *
   * @param orchestrator - Task Orchestrator for status management
   * @throws {Error} If no active session exists
   */
  constructor(orchestrator: TaskOrchestrator) {
    this.#orchestrator = orchestrator;

    // Extract session path from orchestrator's session manager
    const sessionManager = (orchestrator as any)
      .sessionManager as SessionManager;
    const currentSession = sessionManager.currentSession;

    if (!currentSession) {
      throw new Error('Cannot create PRPRuntime: no active session');
    }

    this.#sessionPath = currentSession.metadata.path;

    // Create PRPGenerator and PRPExecutor instances
    this.#generator = new PRPGenerator(sessionManager);
    this.#executor = new PRPExecutor(this.#sessionPath);
  }

  /**
   * Executes a subtask through the complete inner loop
   *
   * @remarks
   * Orchestrates research (PRP generation) → implementation (PRP execution) → validation.
   * Manages status progression through Researching → Implementing → Complete/Failed.
   * Creates artifacts directory and writes execution results.
   *
   * @param subtask - The subtask to execute
   * @param backlog - The full backlog for context
   * @returns Execution result with validation results and artifacts
   * @throws {PRPRuntimeError} If orchestration fails
   */
  async executeSubtask(
    subtask: Subtask,
    backlog: Backlog
  ): Promise<ExecutionResult> {
    // eslint-disable-next-line no-console -- Expected logging for status transitions
    console.log(
      `[PRPRuntime] Starting execution for ${subtask.id}: ${subtask.title}`
    );

    try {
      // PHASE 1: Research - Generate PRP
      await this.#orchestrator.setStatus(
        subtask.id,
        'Researching',
        'Starting PRP generation'
      );
      // eslint-disable-next-line no-console -- Expected logging for phase tracking
      console.log(`[PRPRuntime] Research Phase: ${subtask.id}`);

      const prp = await this.#generator.generate(subtask, backlog);
      // eslint-disable-next-line no-console -- Expected logging for phase completion
      console.log(`[PRPRuntime] PRP generated for ${subtask.id}`);

      // PHASE 2: Implementation - Execute PRP
      await this.#orchestrator.setStatus(
        subtask.id,
        'Implementing',
        'Starting PRP execution'
      );
      // eslint-disable-next-line no-console -- Expected logging for phase tracking
      console.log(`[PRPRuntime] Implementation Phase: ${subtask.id}`);

      // Construct PRP file path (sanitize taskId: replace dots with underscores)
      const sanitizedId = subtask.id.replace(/\./g, '_');
      const prpPath = join(this.#sessionPath, 'prps', `${sanitizedId}.md`);

      // Create artifacts directory
      const artifactsDir = join(this.#sessionPath, 'artifacts', subtask.id);
      await mkdir(artifactsDir, { recursive: true });
      // eslint-disable-next-line no-console -- Expected logging for directory creation
      console.log(`[PRPRuntime] Artifacts directory: ${artifactsDir}`);

      // Execute PRP
      const result = await this.#executor.execute(prp, prpPath);

      // Write execution artifacts
      await this.#writeArtifacts(artifactsDir, result);

      // PHASE 3: Update final status
      if (result.success) {
        await this.#orchestrator.setStatus(
          subtask.id,
          'Complete',
          'Implementation completed successfully'
        );
        // eslint-disable-next-line no-console -- Expected logging for success
        console.log(`[PRPRuntime] Complete: ${subtask.id}`);
      } else {
        await this.#orchestrator.setStatus(
          subtask.id,
          'Failed',
          result.error ?? 'Execution failed'
        );
        // eslint-disable-next-line no-console -- Expected logging for failure
        console.error(`[PRPRuntime] Failed: ${subtask.id} - ${result.error}`);
      }

      return result;
    } catch (error) {
      // Set status to Failed on any exception
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.#orchestrator.setStatus(
        subtask.id,
        'Failed',
        `Execution failed: ${errorMessage}`
      );

      // eslint-disable-next-line no-console -- Expected error logging
      console.error(`[PRPRuntime] ERROR: ${subtask.id} - ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        // eslint-disable-next-line no-console -- Expected error logging
        console.error(`[PRPRuntime] Stack trace: ${error.stack}`);
      }

      // Return failed execution result
      return {
        success: false,
        validationResults: [],
        artifacts: [],
        error: errorMessage,
        fixAttempts: 0,
      };
    }
  }

  /**
   * Writes execution artifacts to artifacts directory
   *
   * @remarks
   * Creates validation-results.json, execution-summary.md, and artifacts-list.json.
   * Errors during artifact writing are logged but don't fail execution.
   *
   * @param artifactsDir - Path to artifacts directory
   * @param result - Execution result to write
   * @private
   */
  async #writeArtifacts(
    artifactsDir: string,
    result: ExecutionResult
  ): Promise<void> {
    try {
      // Write validation results as JSON
      const validationResultsPath = join(
        artifactsDir,
        'validation-results.json'
      );
      await writeFile(
        validationResultsPath,
        JSON.stringify(result.validationResults, null, 2),
        { mode: 0o644 }
      );

      // Write execution summary as markdown
      const summaryPath = join(artifactsDir, 'execution-summary.md');
      const summary = this.#formatExecutionSummary(result);
      await writeFile(summaryPath, summary, { mode: 0o644 });

      // Write artifacts list as JSON
      const artifactsListPath = join(artifactsDir, 'artifacts-list.json');
      await writeFile(
        artifactsListPath,
        JSON.stringify(result.artifacts, null, 2),
        { mode: 0o644 }
      );

      // eslint-disable-next-line no-console -- Expected logging for artifact writing
      console.log(`[PRPRuntime] Artifacts written to: ${artifactsDir}`);
    } catch (error) {
      // Log error but don't fail execution
      // eslint-disable-next-line no-console -- Expected error logging for non-critical operation
      console.warn(
        `[PRPRuntime] Failed to write artifacts: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Formats execution result as markdown summary
   *
   * @param result - Execution result to format
   * @returns Markdown string representation
   * @private
   */
  #formatExecutionSummary(result: ExecutionResult): string {
    const status = result.success ? 'Success' : 'Failed';
    const validationDetails = result.validationResults
      .map(
        v => `
### Level ${v.level}: ${v.description}

- Status: ${v.success ? 'PASSED' : 'FAILED'}
- Command: ${v.command ?? 'N/A'}
- Skipped: ${v.skipped ? 'Yes' : 'No'}
${!v.success ? `- Exit Code: ${v.exitCode}\n- Error: ${v.stderr}` : ''}
      `
      )
      .join('\n');

    return `# Execution Summary

**Status**: ${status}
**Fix Attempts**: ${result.fixAttempts}
${result.error ? `**Error**: ${result.error}` : ''}

## Validation Results

${validationDetails || 'No validation results available.'}

## Artifacts

${result.artifacts.length > 0 ? result.artifacts.map(a => `- ${a}`).join('\n') : 'No artifacts recorded.'}
`;
  }
}
````

### Integration Points

```yaml
TASK_ORCHESTRATOR:
  - import: TaskOrchestrator from '../core/task-orchestrator.js'
  - usage: const runtime = new PRPRuntime(orchestrator)
  - integration: runtime.executeSubtask() will be called from executeSubtask()
  - pattern: orchestrator.setStatus() for all status transitions

PRP_GENERATOR:
  - import: PRPGenerator from './prp-generator.js'
  - usage: this.#generator = new PRPGenerator(sessionManager)
  - method: await this.#generator.generate(subtask, backlog)
  - returns: Promise<PRPDocument>

PRP_EXECUTOR:
  - import: PRPExecutor from './prp-executor.js'
  - usage: this.#executor = new PRPExecutor(sessionPath)
  - method: await this.#executor.execute(prp, prpPath)
  - returns: Promise<ExecutionResult>

SESSION_MANAGER:
  - access: (orchestrator as any).sessionManager
  - usage: currentSession.metadata.path for sessionPath
  - integration: Passed to PRPGenerator constructor

FILESYSTEM:
  - artifacts directory: join(sessionPath, 'artifacts', subtask.id)
  - prp file: join(sessionPath, 'prps', sanitizedTaskId + '.md')
  - create: mkdir(artifactsDir, { recursive: true })
  - write: writeFile(path, content, { mode: 0o644 })
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- src/agents/prp-runtime.ts     # ESLint with auto-fix
npm run format -- src/agents/prp-runtime.ts   # Prettier formatting
npm run check -- src/agents/prp-runtime.ts    # TypeScript type checking

# Project-wide validation
npm run lint    # Check all files
npm run format  # Format all files
npm run check   # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test PRPRuntime specifically
npm test -- tests/unit/agents/prp-runtime.test.ts

# Run with coverage
npm test -- --coverage tests/unit/agents/prp-runtime.test.ts

# Full test suite for agents
npm test -- tests/unit/agents/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests (requires valid dependencies)
npm test -- tests/integration/prp-runtime-integration.test.ts

# Test full flow with mocked LLM calls
npm test -- tests/integration/prp-runtime-integration.test.ts -t "should execute subtask through complete inner loop"

# Expected: PRPRuntime orchestrates generate() and execute() correctly
```

### Level 4: End-to-End Validation

```bash
# Verify integration with existing components
npm test -- tests/unit/agents/prp-generator.test.ts    # Verify PRP generation
npm test -- tests/unit/agents/prp-executor.test.ts     # Verify PRP execution
npm test -- tests/unit/core/task-orchestrator.test.ts  # Verify orchestrator integration

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

- [ ] `PRPRuntime` class created in `src/agents/prp-runtime.ts`
- [ ] `executeSubtask()` method accepts `Subtask` and `Backlog`, returns `ExecutionResult`
- [ ] Status progression: `Researching` → `Implementing` → `Complete`/`Failed`
- [ ] PRP generation via `PRPGenerator.generate()` called correctly
- [ ] PRP execution via `PRPExecutor.execute()` called correctly
- [ ] Artifacts directory created at `{sessionPath}/artifacts/{subtask.id}/`
- [ ] Execution artifacts written (validation-results.json, execution-summary.md, artifacts-list.json)
- [ ] Returns structured `ExecutionResult` with all fields populated
- [ ] Unit tests cover happy path, generation failure, execution failure
- [ ] Integration test validates full flow

### Code Quality Validation

- [ ] Follows existing codebase patterns (prp-generator.ts, prp-executor.ts structure)
- [ ] File placement matches desired codebase tree structure
- [ ] Uses `.js` extensions for ES module imports
- [ ] Private fields use `#` prefix
- [ ] Readonly public fields for immutability
- [ ] Proper error handling with custom `PRPRuntimeError` type
- [ ] Console logging for phase transitions and errors

### Documentation & Deployment

- [ ] Comprehensive JSDoc comments on all public methods
- [ ] Module-level JSDoc explains purpose and usage
- [ ] Example usage in JSDoc @example blocks
- [ ] Error type is well-documented with field descriptions

---

## Anti-Patterns to Avoid

- ❌ Don't access private fields on TaskOrchestrator - use public `setStatus()` method
- ❌ Don't call `configureEnvironment()` - already done in agent-factory.ts
- ❌ Don't skip status transitions - must follow Researching → Implementing → Complete/Failed
- ❌ Don't hardcode session paths - extract from orchestrator.sessionManager
- ❌ Don't forget to sanitize taskId for PRP file path (replace dots with underscores)
- ❌ Don't fail execution on artifact writing errors - log and continue
- ❌ Don't use sync operations - always use async/await
- ❌ Don't use `.ts` extensions in imports - ES modules require `.js`
- ❌ Don't create new PRPGenerator/PRPExecutor instances per executeSubtask() call - cache in constructor
- ❌ Don't throw generic errors - use custom `PRPRuntimeError` for specific failures
- ❌ Don't ignore ExecutionResult.fixAttempts - this indicates retry activity
