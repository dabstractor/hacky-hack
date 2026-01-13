# PRP for P3.M3.T1.S1: Create PRP Generator

---

## Goal

**Feature Goal**: Create `PRPGenerator` class that orchestrates the Researcher Agent to generate comprehensive Product Requirement Prompts (PRPs) for any Task or Subtask in the backlog, with automatic file persistence and error recovery.

**Deliverable**: `src/agents/prp-generator.ts` containing `PRPGenerator` class with:

- `generate(task, backlog)` method that returns `Promise<PRPDocument>`
- Automatic PRP file creation at `{sessionPath}/prps/{taskId}.md`
- Retry logic with exponential backoff (up to 3 attempts)
- Integration with `createPRPBlueprintPrompt()` and `createResearcherAgent()`

**Success Definition**:

- `PRPGenerator.generate()` successfully creates PRP for any Task/Subtask
- Generated PRP files are written to correct session directory
- Retry logic handles transient LLM failures gracefully
- All existing tests continue to pass
- New tests validate PRP generation scenarios
- Full type safety with TypeScript

## User Persona (if applicable)

**Target User**: PRP Pipeline system (internal automation)

**Use Case**: The Task Orchestrator delegates PRP generation to `PRPGenerator` when processing a Subtask. The generator coordinates Researcher Agent execution, persists results to disk, and returns structured `PRPDocument` for downstream execution.

**User Journey**:

1. Task Orchestrator selects next Subtask from execution queue
2. Creates `PRPGenerator` instance with session path
3. Calls `generate(subtask, backlog)`
4. Researcher Agent generates PRP content via LLM
5. PRP is persisted to `{sessionPath}/prps/{taskId}.md`
6. `PRPDocument` is returned for PRP Executor to consume

**Pain Points Addressed**:

- Eliminates manual PRP creation bottleneck
- Provides consistent, structured PRP generation
- Enables reliable resume capability with persisted PRPs
- Handles LLM transient failures with retry logic

## Why

- **Core Pipeline Component**: PRP generation is the bridge between task breakdown and code implementation. Without automated PRP generation, the pipeline cannot function end-to-end.
- **Consistency**: Manual PRP creation leads to inconsistent quality and missing context. Automated generation ensures every PRP has complete hierarchical context.
- **Research Integration**: Leverages external research findings on Plan-and-Execute agent patterns for reliable LLM-based document generation.
- **Resume Capability**: Persisted PRPs enable the pipeline to resume from any point without re-generating completed work.
- **Error Recovery**: Retry logic ensures transient LLM failures don't block pipeline progress.

## What

### System Behavior

The `PRPGenerator` class:

1. Accepts a `Task` or `Subtask` and the full `Backlog` as input
2. Constructs a Researcher Agent prompt using `createPRPBlueprintPrompt()`
3. Creates a Researcher Agent via `createResearcherAgent()`
4. Executes the agent with retry logic (up to 3 attempts)
5. Validates the response against `PRPDocumentSchema`
6. Writes the PRP markdown to `{sessionPath}/prps/{taskId}.md`
7. Returns the structured `PRPDocument` for downstream use

### Success Criteria

- [ ] `PRPGenerator` class created in `src/agents/prp-generator.ts`
- [ ] `generate()` method accepts `Task | Subtask` and `Backlog`
- [ ] PRP files written to `{sessionPath}/prps/{taskId}.md`
- [ ] Retry logic with exponential backoff (1s → 2s → 4s)
- [ ] Integration with existing `createResearcherAgent()` and `createPRPBlueprintPrompt()`
- [ ] Unit tests for happy path, retry scenarios, and error handling
- [ ] Integration test with mock Researcher Agent
- [ ] Zero regressions in existing test suite

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact file paths to all dependencies
- Complete code patterns for agent creation and prompt construction
- Groundswell API usage with specific method signatures
- File system patterns matching existing session management
- Retry logic configuration from external research
- Specific test patterns matching existing codebase

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: src/agents/agent-factory.ts
  why: Agent creation pattern, createResearcherAgent() implementation, MCP_TOOLS array
  pattern: Factory function returning Groundswell Agent with persona config
  gotcha: configureEnvironment() must be called before any agent creation (already done at module load)

- file: src/agents/prompts/prp-blueprint-prompt.ts
  why: createPRPBlueprintPrompt() function signature and usage pattern
  pattern: Returns Prompt<PRPDocument> with responseFormat validation
  critical: Takes (task, backlog, codebasePath) and injects hierarchical context

- file: src/core/models.ts (lines 1114-1223)
  why: PRPDocument interface definition and PRPDocumentSchema validation
  pattern: Zod schema validation for structured output
  fields: taskId, objective, context, implementationSteps, validationGates, successCriteria, references

- file: src/core/session-manager.ts
  why: Session path access pattern, directory structure
  pattern: session.metadata.path gives absolute path to session directory
  gotcha: Always check currentSession is not null before accessing

- file: src/core/task-orchestrator.ts (lines 1-100)
  why: Integration point - PRPGenerator will be called from here
  pattern: Uses sessionManager.currentSession for state access
  critical: This is where PRPGenerator will be instantiated and invoked

- docfile: plan/001_14b9dc2a33c7/docs/research_llm_agent_prp_generation.md
  why: External research on agent patterns, retry logic configuration
  section: Error Handling and Retry Patterns (Section 4)
  config: Max retries: 3, Base delay: 1000ms, Exponential backoff with jitter

- docfile: plan/001_14b9dc2a33c7/docs/research_code_examples.ts
  why: Production-ready TypeScript retry implementation
  section: Retry Logic with Exponential Backoff
  pattern: try/catch with retry loop, delay calculation with Math.min()

- url: https://github.com/anthropics/groundswell
  why: Groundswell Agent API documentation for .prompt() method
  critical: Agent.prompt() returns Promise<z.infer<Schema>>

- url: https://www.typescriptlang.org/docs/handbook/2/classes.html
  why: TypeScript class patterns for constructor properties and private fields
  pattern: readonly public fields, #private fields for internal state
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts       # createResearcherAgent() - USE THIS
│   ├── prompts/
│   │   └── prp-blueprint-prompt.ts  # createPRPBlueprintPrompt() - USE THIS
│   └── prompts.ts             # PRP_BLUEPRINT_PROMPT constant
├── config/
│   ├── environment.ts         # configureEnvironment(), getModel()
│   └── constants.ts           # Environment variable names
├── core/
│   ├── models.ts              # PRPDocument, PRPDocumentSchema
│   ├── session-manager.ts     # SessionManager class (session path access)
│   ├── scope-resolver.ts      # Scope type (from P3M2T2S2)
│   └── task-orchestrator.ts   # WILL CALL PRPGenerator (future integration)
├── tools/
│   ├── bash-mcp.ts           # BashMCP - used by all agents
│   ├── filesystem-mcp.ts      # FilesystemMCP - used by all agents
│   └── git-mcp.ts            # GitMCP - used by all agents
└── utils/
    └── task-utils.ts          # findItem(), getDependencies(), isSubtask()

tests/
├── unit/
│   └── agents/
│       └── (prp-generator tests go here)
└── integration/
    └── (prp-generator integration tests go here)
```

### Desired Codebase Tree with Files to be Added

```bash
src/
├── agents/
│   ├── agent-factory.ts       # EXISTING - createResearcherAgent()
│   ├── prp-generator.ts       # NEW - PRPGenerator class
│   └── prompts/
│       └── prp-blueprint-prompt.ts  # EXISTING - createPRPBlueprintPrompt()

tests/
├── unit/
│   └── agents/
│       └── prp-generator.test.ts  # NEW - Unit tests for PRPGenerator
└── integration/
    └── prp-generator-integration.test.ts  # NEW - Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports must use .js extension
// Even though source is .ts, imports must reference .js
import { createResearcherAgent } from './agents/agent-factory.js';

// CRITICAL: configureEnvironment() is called at module load time in agent-factory.ts
// This maps ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY automatically
// Do NOT call configureEnvironment() again in PRPGenerator

// GOTCHA: Groundswell Agent.prompt() returns z.infer<typeof Schema>
// The return type is automatically inferred from responseFormat
// Cast result to PRPDocument after schema validation
const result = (await agent.prompt(prompt)) as PRPDocument;

// CRITICAL: createPRPBlueprintPrompt() returns Prompt<PRPDocument>
// The responseFormat is already set to PRPDocumentSchema
// Do NOT specify responseFormat again when calling agent.prompt()

// PATTERN: Session path access via SessionManager
const sessionPath = sessionManager.currentSession?.metadata.path;
// Always check for null - currentSession can be null if not initialized

// PATTERN: File system operations use node:fs/promises
import { mkdir, writeFile } from 'node:fs/promises';
// Always use recursive: true for mkdir to create parent directories

// PATTERN: Retry logic from external research
// Base delay: 1000ms, Exponential backoff: 2^n, Max retries: 3
for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    return await operation();
  } catch (error) {
    if (attempt === maxRetries - 1) throw error;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// GOTCHA: PRP directory structure
// PRPs are stored at: {sessionPath}/prps/{taskId}.md
// The "prps" directory may not exist - create it with mkdir
// taskId format: "P1M2T2S2" (dots removed for filename safety)
```

## Implementation Blueprint

### Data Models and Structure

No new models required. Uses existing:

- `PRPDocument` from `src/core/models.js`
- `Backlog`, `Task`, `Subtask` from `src/core/models.js`
- `Agent` from `groundswell` library

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/agents/prp-generator.ts
  - IMPLEMENT: PRPGenerator class with constructor and generate() method
  - CLASS STRUCTURE:
    * Constructor: readonly sessionManager, sessionPath (extracted from manager)
    * Private field: #researcherAgent (cached Researcher Agent instance)
    * Public method: async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument>
  - NAMING: PascalCase class, camelCase methods/properties
  - PLACEMENT: src/agents/ directory (sibling to agent-factory.ts)
  - DEPENDENCIES: Import from agent-factory.js, models.js, prp-blueprint-prompt.js

Task 2: IMPLEMENT generate() method logic
  - STEP 1: Create Researcher Agent using createResearcherAgent()
  - STEP 2: Build prompt using createPRPBlueprintPrompt(task, backlog, process.cwd())
  - STEP 3: Execute agent.prompt(prompt) with retry logic wrapper
  - STEP 4: Validate result against PRPDocumentSchema (redundant but safe)
  - STEP 5: Generate safe filename from taskId (replace dots with underscores)
  - STEP 6: Create prps directory if not exists (mkdir recursive)
  - STEP 7: Write PRP markdown content to {sessionPath}/prps/{taskId}.md
  - STEP 8: Return PRPDocument object
  - ERROR HANDLING: Throw custom PRPGenerationError on final failure
  - LOGGING: Console.log each retry attempt with attempt number

Task 3: IMPLEMENT retry logic with exponential backoff
  - PATTERN: Wrap agent.prompt() call in retry loop
  - CONFIG: maxRetries = 3, baseDelay = 1000ms, maxDelay = 30000ms
  - DELAY CALCULATION: Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  - SLEEP: Use setTimeout wrapped in Promise for delay
  - LOGGING: Log "Retry attempt N/3" before each retry
  - FINAL THROW: Re-throw original error after last attempt
  - REFERENCE: plan/001_14b9dc2a33c7/docs/research_code_examples.ts (lines 200-250)

Task 4: IMPLEMENT PRP file writing
  - FILENAME: Sanitize taskId by replacing '.' with '_' (e.g., "P1.M2.T2.S2" → "P1M2T2S2")
  - DIRECTORY: Create path.join(sessionPath, 'prps') directory with recursive: true
  - CONTENT: Extract markdown from PRPDocument or format PRPDocument as markdown
  - WRITE: Use writeFile with mode: 0o644 (read/write owner, read others)
  - ERROR HANDLING: Throw PRPFileError if write fails
  - GOTCHA: PRP markdown format should match PRP_TEMPLATE structure from user's request

Task 5: CREATE custom error classes
  - IMPLEMENT: PRPGenerationError extends Error
  - FIELDS: taskId, attempt, originalError
  - IMPLEMENT: PRPFileError extends Error
  - FIELDS: taskId, filePath, originalError
  - PLACEMENT: Export from src/agents/prp-generator.ts
  - USAGE: Throw these errors for specific failure scenarios

Task 6: CREATE tests/unit/agents/prp-generator.test.ts
  - SETUP: Mock createResearcherAgent to return mock agent
  - TEST: generate() successfully calls agent.prompt() and returns PRPDocument
  - TEST: generate() creates prps directory and writes file
  - TEST: retry logic retries on failure and succeeds on second attempt
  - TEST: retry logic throws after max retries exhausted
  - TEST: PRPGenerationError thrown with correct properties on failure
  - PATTERN: Use vitest describe/it/expect syntax (matches existing tests)
  - FIXTURES: Mock task, backlog, session objects

Task 7: CREATE tests/integration/prp-generator-integration.test.ts
  - SETUP: Use real createResearcherAgent() and createPRPBlueprintPrompt()
  - MOCK: Mock agent.prompt() to return canned PRPDocument (no real LLM call)
  - TEST: Full generate() flow with real dependencies
  - TEST: PRP file written to correct location with correct content
  - TEST: Integration with SessionManager for session path access
  - SKIP: Mark as test.skip if running in CI without API credentials

Task 8: VERIFY existing tests still pass
  - RUN: npm test to ensure no regressions
  - CHECK: All existing agent-factory tests pass
  - CHECK: All prp-blueprint-prompt tests pass
  - CHECK: All session-manager tests pass
```

### Implementation Patterns & Key Details

```typescript
// File: src/agents/prp-generator.ts

// CRITICAL: Import patterns - use .js extensions for ES modules
import { createResearcherAgent } from './agent-factory.js';
import { createPRPBlueprintPrompt } from './prompts/prp-blueprint-prompt.js';
import type { Agent } from 'groundswell';
import type { PRPDocument, Task, Subtask, Backlog } from '../core/models.js';
import { PRPDocumentSchema } from '../core/models.js';
import type { SessionManager } from '../core/session-manager.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Custom error for PRP generation failures
 */
export class PRPGenerationError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly attempt: number,
    originalError: unknown
  ) {
    super(
      `Failed to generate PRP for ${taskId} after ${attempt} attempts: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'PRPGenerationError';
  }
}

/**
 * Custom error for PRP file write failures
 */
export class PRPFileError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly filePath: string,
    originalError: unknown
  ) {
    super(
      `Failed to write PRP file for ${taskId} to ${filePath}: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'PRPFileError';
  }
}

/**
 * PRP Generator for automated Product Requirement Prompt creation
 *
 * @remarks
 * Orchestrates the Researcher Agent to generate comprehensive PRPs
 * for any Task or Subtask in the backlog. Handles retry logic, file
 * persistence, and error recovery.
 */
export class PRPGenerator {
  /** Session manager for accessing session state and paths */
  readonly sessionManager: SessionManager;

  /** Path to session directory (extracted for convenience) */
  readonly sessionPath: string;

  /** Cached Researcher Agent instance */
  #researcherAgent: Agent;

  /**
   * Creates a new PRPGenerator instance
   *
   * @param sessionManager - Session state manager
   * @throws {Error} If no session is currently loaded
   */
  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;

    // Extract session path from current session
    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot create PRPGenerator: no active session');
    }
    this.sessionPath = currentSession.metadata.path;

    // Cache Researcher Agent for reuse
    this.#researcherAgent = createResearcherAgent();
  }

  /**
   * Generates a PRP for the given task or subtask
   *
   * @param task - The Task or Subtask to generate a PRP for
   * @param backlog - The full Backlog for context extraction
   * @returns Generated PRPDocument with all PRP content
   * @throws {PRPGenerationError} If generation fails after all retries
   * @throws {PRPFileError} If PRP file cannot be written
   */
  async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
    // Retry configuration (from external research)
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Step 1: Build prompt with task context
        const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());

        // Step 2: Execute Researcher Agent
        console.log(
          `Generating PRP for ${task.id} (attempt ${attempt + 1}/${maxRetries})...`
        );
        const result = await this.#researcherAgent.prompt(prompt);

        // Step 3: Validate against schema (defensive programming)
        const validated = PRPDocumentSchema.parse(result);

        // Step 4: Write PRP to file
        await this.#writePRPToFile(validated);

        return validated;
      } catch (error) {
        // If this was the last attempt, throw custom error
        if (attempt === maxRetries - 1) {
          throw new PRPGenerationError(task.id, attempt + 1, error);
        }

        // Calculate exponential backoff delay
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        // Log retry attempt
        console.warn(
          `PRP generation attempt ${attempt + 1} failed for ${task.id}. ` +
            `Retrying in ${delay}ms...`
        );
        console.warn(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new PRPGenerationError(task.id, maxRetries, 'Unknown error');
  }

  /**
   * Writes PRP content to markdown file in session directory
   *
   * @param prp - The PRPDocument to write
   * @throws {PRPFileError} If file write fails
   * @private
   */
  async #writePRPToFile(prp: PRPDocument): Promise<void> {
    // Sanitize taskId for filename (replace dots with underscores)
    const filename = prp.taskId.replace(/\./g, '_') + '.md';

    // Create prps directory path
    const prpsDir = join(this.sessionPath, 'prps');
    const filePath = join(prpsDir, filename);

    try {
      // Create prps directory if it doesn't exist
      await mkdir(prpsDir, { recursive: true });

      // Format PRP as markdown (TODO: match PRP_TEMPLATE structure)
      const markdown = this.#formatPRPAsMarkdown(prp);

      // Write PRP file with proper permissions
      await writeFile(filePath, markdown, { mode: 0o644 });

      console.log(`PRP written to: ${filePath}`);
    } catch (error) {
      throw new PRPFileError(prp.taskId, filePath, error);
    }
  }

  /**
   * Formats PRPDocument as markdown string
   *
   * @param prp - The PRPDocument to format
   * @returns Markdown string representation of the PRP
   * @private
   */
  #formatPRPAsMarkdown(prp: PRPDocument): string {
    // TODO: Implement proper markdown formatting matching PRP_TEMPLATE
    // For now, return a basic structure
    return `# PRP for ${prp.taskId}

## Objective

${prp.objective}

## Context

${prp.context}

## Implementation Steps

${prp.implementationSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Validation Gates

${prp.validationGates.map((gate, i) => `### Level ${i + 1}: ${gate.level}\n\n${gate.commands.join('\n')}`).join('\n\n')}

## Success Criteria

${prp.successCriteria.map(c => `- [ ] ${c.description}`).join('\n')}

## References

${prp.references.map(r => `- ${r}`).join('\n')}
`;
  }
}

// PATTERN: Export type for convenience
export type { PRPDocument };
```

### Integration Points

```yaml
AGENT_FACTORY:
  - import: createResearcherAgent from './agents/agent-factory.js'
  - usage: this.#researcherAgent = createResearcherAgent()
  - pattern: Singleton agent instance cached in private field

PROMPT_SYSTEM:
  - import: createPRPBlueprintPrompt from './agents/prompts/prp-blueprint-prompt.js'
  - usage: const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd())
  - parameters: task (Task|Subtask), backlog (Backlog), codebasePath (string)

SESSION_MANAGER:
  - access: sessionManager.currentSession.metadata.path
  - validation: Check currentSession is not null before accessing
  - path structure: {sessionPath}/prps/{taskId}.md

FILE_SYSTEM:
  - directory: Create prps directory with recursive: true
  - write: Use writeFile with mode: 0o644
  - path: Use node:path.join for cross-platform compatibility

MODELS:
  - import: PRPDocument, Task, Subtask, Backlog from './core/models.js'
  - validation: PRPDocumentSchema.parse(result) for defensive validation
  - return type: Promise<PRPDocument> from generate() method
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- src/agents/prp-generator.ts    # ESLint with auto-fix
npm run format -- src/agents/prp-generator.ts  # Prettier formatting
npm run check -- src/agents/prp-generator.ts   # TypeScript type checking

# Project-wide validation
npm run lint    # Check all files
npm run format  # Format all files
npm run check   # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test PRPGenerator specifically
npm test -- src/agents/prp-generator.test.ts

# Run with coverage
npm test -- --coverage src/agents/prp-generator.test.ts

# Full test suite for agents
npm test -- tests/unit/agents/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests (requires valid API credentials)
npm test -- tests/integration/prp-generator-integration.test.ts

# Manual verification (if API credentials available)
# Create test script that instantiates PRPGenerator with real SessionManager
# and calls generate() with a simple subtask

# Expected: PRP file created at correct path, valid PRPDocument returned
```

### Level 4: End-to-End Validation

```bash
# Verify integration with existing components
npm test -- tests/unit/agents/agent-factory.test.ts    # Verify agent creation
npm test -- tests/unit/agents/prompts/  # Verify prompt generation
npm test -- tests/unit/core/session-manager.test.ts   # Verify session access

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

- [ ] `PRPGenerator` class created in `src/agents/prp-generator.ts`
- [ ] `generate()` method accepts `Task | Subtask` and `Backlog`
- [ ] PRP files written to `{sessionPath}/prps/{taskId}.md`
- [ ] Retry logic with exponential backoff (1s → 2s → 4s)
- [ ] `PRPGenerationError` and `PRPFileError` custom error classes
- [ ] Integration with `createResearcherAgent()` and `createPRPBlueprintPrompt()`
- [ ] Unit tests cover happy path, retry, and error scenarios
- [ ] Integration test validates full flow with real dependencies

### Code Quality Validation

- [ ] Follows existing codebase patterns (agent-factory.ts structure)
- [ ] File placement matches desired codebase tree structure
- [ ] Uses `.js` extensions for ES module imports
- [ ] Private fields use `#` prefix
- [ ] Readonly public fields for immutability
- [ ] Proper error handling with custom error types
- [ ] Console logging for retry attempts

### Documentation & Deployment

- [ ] Comprehensive JSDoc comments on all public methods
- [ ] Module-level JSDoc explains purpose and usage
- [ ] Example usage in JSDoc @example blocks
- [ ] Error types are well-documented with field descriptions
- [ ] File structure follows existing patterns (9 directories, 19 files)

---

## Anti-Patterns to Avoid

- ❌ Don't call `configureEnvironment()` in PRPGenerator (already done in agent-factory.ts)
- ❌ Don't create a new Researcher Agent for each `generate()` call (cache in constructor)
- ❌ Don't use sync file operations - always use `node:fs/promises`
- ❌ Don't skip retry logic - LLM calls are unreliable
- ❌ Don't throw generic errors - use custom `PRPGenerationError` and `PRPFileError`
- ❌ Don't forget to check `currentSession` is not null before accessing
- ❌ Don't hardcode file paths - use `node:path.join` for cross-platform compatibility
- ❌ Don't skip `mkdir` with `recursive: true` - prps directory may not exist
- ❌ Don't use `.ts` extensions in imports - ES modules require `.js`
- ❌ Don't skip Zod validation after agent.prompt() - defensive programming
