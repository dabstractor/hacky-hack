# Groundswell Framework Guide

> Comprehensive guide to the Groundswell framework integration in the PRP Pipeline, covering workflow patterns, agent systems, MCP tool registration, caching, observability, and extensibility.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

## Table of Contents

- [Quick Reference](#quick-reference)
- [Overview](#overview)
  - [What is Groundswell?](#what-is-groundswell)
  - [Installation and Setup](#installation-and-setup)
  - [Integration Points](#integration-points)
- [Core Concepts](#core-concepts)
  - [Workflow](#workflow)
  - [Agent](#agent)
  - [Prompt](#prompt)
  - [MCP (Model Context Protocol)](#mcp-model-context-protocol)
- [Workflow Patterns](#workflow-patterns)
  - [Extending the Workflow Class](#extending-the-workflow-class)
  - [@Step Decorator](#step-decorator)
  - [@Task Decorator](#task-decorator)
  - [@ObservedState Decorator](#observedstate-decorator)
  - [Parent-Child Workflows](#parent-child-workflows)
  - [Graceful Shutdown](#graceful-shutdown)
- [Agent System](#agent-system)
  - [Agent Factory Pattern](#agent-factory-pattern)
  - [Four Agent Personas](#four-agent-personas)
  - [Agent Configuration](#agent-configuration)
  - [Prompt Creation with Zod Schemas](#prompt-creation-with-zod-schemas)
  - [Reflection and Retry](#reflection-and-retry)
- [MCP Tool Registration](#mcp-tool-registration)
  - [MCPHandler Pattern](#mcphandler-pattern)
  - [Tool Schema Definition](#tool-schema-definition)
  - [Tool Executor Implementation](#tool-executor-implementation)
  - [Tool Examples](#tool-examples)
  - [Tool Naming Convention](#tool-naming-convention)
- [Caching](#caching)
  - [Custom PRP Cache (Filesystem-Based)](#custom-prp-cache-filesystem-based)
  - [SHA-256 Cache Key Generation](#sha-256-cache-key-generation)
  - [Cache Metrics and Monitoring](#cache-metrics-and-monitoring)
  - [Cache TTL and Expiration](#cache-ttl-and-expiration)
- [Observability](#observability)
  - [WorkflowTreeDebugger](#workflowtreedebugger)
  - [Observer Pattern](#observer-pattern)
  - [Logging and Correlation IDs](#logging-and-correlation-ids)
  - [Progress Tracking](#progress-tracking)
- [Examples](#examples)
  - [Creating a New Workflow](#creating-a-new-workflow)
  - [Adding a New Agent Persona](#adding-a-new-agent-persona)
  - [Implementing a New MCP Tool](#implementing-a-new-mcp-tool)
  - [Adding Caching to a Workflow](#adding-caching-to-a-workflow)
- [See Also](#see-also)

---

## Quick Reference

Key Groundswell exports used in the PRP Pipeline:

| Export | Purpose | Usage |
|--------|---------|-------|
| `Workflow` | Base class for workflows | `class MyWorkflow extends Workflow` |
| `@Step` | Step decorator for timing tracking | `@Step({ trackTiming: true })` |
| `createAgent` | Agent factory function | `createAgent({ name, system })` |
| `createPrompt` | Prompt factory with Zod validation | `createPrompt({ user, responseFormat })` |
| `MCPHandler` | Base class for MCP tools | `class MyMCP extends MCPHandler` |
| `WorkflowTreeDebugger` | ASCII tree visualization | `new WorkflowTreeDebugger(workflow)` |

Common decorator patterns:

| Pattern | Purpose | Production Usage |
|---------|---------|------------------|
| `@Step({ trackTiming: true })` | Track execution timing | **Always used** |
| `@Task({ concurrent: true })` | Parallel child workflow execution | **Not used** (sequential preferred) |
| `@ObservedState()` | Mark fields for state snapshots | **Not used** (public fields instead) |

---

## Overview

### What is Groundswell?

Groundswell is a **hierarchical workflow orchestration engine** with full observability for AI agent systems. It provides:

- **Workflow Management**: Hierarchical task containers with status tracking, event emission, and parent-child relationships
- **Agent Wrappers**: Lightweight wrappers around the Anthropic SDK with tool integration, caching, and reflection
- **Prompt Validation**: Type-safe prompt definitions with Zod schema validation
- **MCP Integration**: Model Context Protocol support for extensible tool systems
- **Observability**: Built-in logging, state observation, and tree-based debugging

Groundswell enables the PRP Pipeline to orchestrate complex multi-agent workflows with built-in retry logic, caching, and comprehensive error handling.

### Installation and Setup

The PRP Pipeline uses Groundswell as a **local dependency** linked via `npm link`:

```bash
# Build and link Groundswell (in ~/projects/groundswell)
cd ~/projects/groundswell
npm run build
npm link

# Link Groundswell in hacky-hack
cd ~/projects/hacky-hack
npm link groundswell
```

**Requirements**: Node.js 18+, TypeScript 5.2+

**Documentation**: [Groundswell README](~/projects/groundswell/README.md)

### Integration Points

Groundswell is integrated throughout the PRP Pipeline:

| Component | Groundswell Feature | Location |
|-----------|---------------------|----------|
| Main Pipeline | Workflow class, @Step decorator | `src/workflows/prp-pipeline.ts` |
| Agent Creation | createAgent factory | `src/agents/agent-factory.ts` |
| Prompt Generation | createPrompt with Zod | `src/agents/prompts/*.ts` |
| Tool System | MCPHandler extensions | `src/tools/*.mcp.ts` |
| Caching | Custom filesystem cache | `src/agents/prp-generator.ts` |
| Retry Logic | Custom wrapper (not Groundswell's) | `src/utils/retry.ts` |

---

## Core Concepts

### Workflow

Workflows are hierarchical task containers that manage execution status, emit events, and support parent-child relationships.

```typescript
import { Workflow, Step } from 'groundswell';

class MyWorkflow extends Workflow {
  // Public state fields (NOT @ObservedState - see gotchas below)
  currentPhase: string = 'init';
  completedTasks: number = 0;

  constructor(data: string) {
    super('MyWorkflow');
    // Input validation and initialization
  }

  @Step({ trackTiming: true })
  async processStep(): Promise<void> {
    this.currentPhase = 'processing';
    // Step logic here
  }

  async run(): Promise<void> {
    this.setStatus('running');
    try {
      await this.processStep();
      this.setStatus('completed');
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Status Lifecycle**: `idle → running → completed/failed/cancelled`

### Agent

Agents are lightweight wrappers around the Anthropic SDK that execute prompts, manage tool invocation cycles, and integrate with caching and reflection systems.

```typescript
import { createAgent } from 'groundswell';

const agent = createAgent({
  name: 'MyAgent',
  system: 'You are a helpful assistant.',
  model: 'GLM-4.7',
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  mcps: [BASH_MCP, FILESYSTEM_MCP],
});

const result = await agent.prompt(prompt);
```

### Prompt

Prompts are immutable value objects that define what to send to an agent and how to validate the response using Zod schemas.

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';

const prompt = createPrompt({
  user: 'Analyze this code',
  data: { code: 'function foo() { return 42; }' },
  responseFormat: z.object({
    bugs: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high']),
  }),
});

const result = await agent.prompt(prompt);
// result is typed: { bugs: string[], severity: 'low' | 'medium' | 'high' }
```

### MCP (Model Context Protocol)

MCP enables extensible tool systems by defining tools with JSON Schema input validation and async executors.

```typescript
import { MCPHandler } from 'groundswell';

class MyMCP extends MCPHandler {
  readonly name = 'my-mcp';
  readonly transport = 'inprocess' as const;
  readonly tools = [myTool];

  constructor() {
    super();
    this.registerServer({ name: this.name, transport: this.transport, tools: this.tools });
    this.registerToolExecutor('my-mcp', 'my_tool', async (input) => {
      return { result: `processed: ${input.param}` };
    });
  }
}
```

---

## Workflow Patterns

### Extending the Workflow Class

All workflows in the PRP Pipeline extend the `Workflow` base class. The main pipeline (`PRPPipeline`) demonstrates this pattern:

**From**: `src/workflows/prp-pipeline.ts:140-305`

```typescript
export class PRPPipeline extends Workflow {
  // Public state fields (NOT @ObservedState - compatibility issues)
  sessionManager: SessionManager;
  taskOrchestrator: TaskOrchestrator;
  currentPhase: string = 'init';
  completedTasks: number = 0;
  shutdownRequested: boolean = false;

  constructor(prdPath: string, scope?: Scope, mode?: 'normal' | 'bug-hunt' | 'validate', ...) {
    super('PRPPipeline');

    if (!prdPath || prdPath.trim() === '') {
      throw new Error('PRP path cannot be empty');
    }

    // Initialize fields
    this.#prdPath = prdPath;
    this.#scope = scope;
    this.mode = mode ?? 'normal';
    // ... more initialization
  }

  async run(): Promise<PipelineResult> {
    this.setStatus('running');

    try {
      await this.initializeSession();
      await this.decomposePRD();
      await this.executeBacklog();
      await this.runQACycle();
      this.setStatus('completed');
      return result;
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Key Points**:
- Call `super(name)` in constructor with workflow name
- Use public fields for state (not `@ObservedState` - see gotchas below)
- Manage status lifecycle: `idle → running → completed/failed`
- Implement `run()` method with proper error handling

### @Step Decorator

The `@Step` decorator wraps methods with event emission, timing tracking, and error handling.

**All production workflows use `@Step({ trackTiming: true })`**:

**From**: `src/workflows/prp-pipeline.ts:1245`

```typescript
@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  this.logger.info('[PRPPipeline] Starting cleanup and state preservation');
  // ... cleanup logic
}
```

**Custom step name example**:

**From**: `src/workflows/prp-pipeline.ts:508`

```typescript
@Step({ trackTiming: true, name: 'handleDelta' })
async handleDelta(): Promise<void> {
  this.currentPhase = 'delta_handling';
  // ... delta handling logic
}
```

**Decorator Options**:

| Option | Type | Default | Production Value |
|--------|------|---------|------------------|
| `trackTiming` | boolean | `true` | `true` (always enabled) |
| `name` | string | method name | Custom for one step only |
| `snapshotState` | boolean | `false` | Never used |
| `logStart` | boolean | `false` | Never used |
| `logFinish` | boolean | `false` | Never used |

### @Task Decorator

**CRITICAL GOTCHA**: The `@Task` decorator is **NOT used in production code**.

**Reason**: Sequential execution is preferred for simplicity and predictability.

**Pattern**: Direct workflow instantiation without decorator:

```typescript
// Production pattern (from prp-pipeline.ts:548)
const workflow = new DeltaAnalysisWorkflow(
  oldPRD,
  newPRD,
  completedTaskIds
);
const delta: DeltaAnalysis = await workflow.run();
```

**What @Task does** (if you were to use it):

```typescript
@Task()
async createChild(): Promise<ChildWorkflow> {
  return new ChildWorkflow('child', this); // Automatically attached
}

@Task({ concurrent: true })
async createWorkers(): Promise<WorkerWorkflow[]> {
  return [
    new WorkerWorkflow('worker1', 100, this), // Runs in parallel
    new WorkerWorkflow('worker2', 150, this),
  ];
}
```

### @ObservedState Decorator

**CRITICAL GOTCHA**: The `@ObservedState` decorator is **NOT used in production code**.

**Reason**: Test environment compatibility issues.

**Production Pattern**: Use public state fields instead:

```typescript
// Production pattern (from prp-pipeline.ts:158-176)
export class PRPPipeline extends Workflow {
  // Public fields (no decorator)
  currentPhase: string = 'init';
  completedTasks: number = 0;
  shutdownRequested: boolean = false;
  currentTaskId: string | null = null;
}
```

**What @ObservedState does** (if you were to use it):

```typescript
import { ObservedState } from 'groundswell';

class MyWorkflow extends Workflow {
  @ObservedState()
  progress = 0;

  @ObservedState({ redact: true })  // Shown as '***'
  apiKey = 'secret';

  @ObservedState({ hidden: true })   // Excluded from snapshots
  internalState = {};
}
```

### Parent-Child Workflows

Workflows form a hierarchy. Pass the parent to the constructor:

**From**: `src/workflows/prp-pipeline.ts:548-553`

```typescript
// Create child workflow with parent reference
const workflow = new DeltaAnalysisWorkflow(
  oldPRD,
  newPRD,
  completedTaskIds
);
// DeltaAnalysisWorkflow constructor: super('DeltaAnalysisWorkflow')
// No explicit parent passed - uses default behavior
```

**Pattern for explicit parent-child**:

```typescript
class ChildWorkflow extends Workflow {
  constructor(name: string, parent: Workflow) {
    super(name, parent); // Pass parent as second parameter
  }

  async run(): Promise<void> {
    this.setStatus('running');
    // ... child logic
    this.setStatus('completed');
  }
}

class ParentWorkflow extends Workflow {
  async spawnChild(): Promise<ChildWorkflow> {
    return new ChildWorkflow('Child', this); // 'this' is parent
  }

  async run(): Promise<void> {
    this.setStatus('running');
    const child = await this.spawnChild();
    await child.run();

    // Access children
    console.log(this.children.length); // 1
    this.setStatus('completed');
  }
}
```

**Key Point**: Pass `parent` (or `this`) as the second parameter to the constructor.

### Graceful Shutdown

The pipeline implements graceful shutdown via SIGINT/SIGTERM signal handlers:

**From**: `src/workflows/prp-pipeline.ts:321-355`

```typescript
#setupSignalHandlers(): void {
  // SIGINT handler (Ctrl+C)
  this.#sigintHandler = () => {
    this.#sigintCount++;

    if (this.#sigintCount > 1) {
      this.logger.warn('Duplicate SIGINT received - shutdown already in progress');
      return;
    }

    this.logger.info('SIGINT received, initiating graceful shutdown');
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGINT';
  };

  // SIGTERM handler (kill command)
  this.#sigtermHandler = () => {
    this.logger.info('SIGTERM received, initiating graceful shutdown');
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGTERM';
  };

  // Register handlers
  process.on('SIGINT', this.#sigintHandler);
  process.on('SIGTERM', this.#sigtermHandler);
}
```

**Cleanup in finally block**:

**From**: `src/workflows/prp-pipeline.ts:1740-1743`

```typescript
async run(): Promise<PipelineResult> {
  // ... execution logic
} finally {
  // Always cleanup, even if interrupted or errored
  await this.cleanup();
}
```

**Signal handler removal**:

**From**: `src/workflows/prp-pipeline.ts:1309-1317`

```typescript
// Remove signal listeners to prevent memory leaks
if (this.#sigintHandler) {
  process.off('SIGINT', this.#sigintHandler);
}
if (this.#sigtermHandler) {
  process.off('SIGTERM', this.#sigtermHandler);
}
```

---

## Agent System

### Agent Factory Pattern

The PRP Pipeline uses a factory pattern for creating agents with consistent configuration.

**From**: `src/agents/agent-factory.ts:150-176`

```typescript
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  // Use getModel() to resolve model tier to actual model name
  const model = getModel('sonnet'); // All personas use sonnet → GLM-4.7

  // Persona-specific naming
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;

  // Readonly configuration object
  return {
    name,
    system: `You are a ${persona} agent.`,
    model,
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      // Map environment variables for SDK compatibility
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}
```

**Persona-specific agent creation**:

**From**: `src/agents/agent-factory.ts:195-204`

```typescript
export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug({ persona: 'architect', model: config.model }, 'Creating agent');
  return createAgent(config);
}
```

### Four Agent Personas

The PRP Pipeline uses four specialized agent personas:

| Persona | Max Tokens | System Prompt | Purpose |
|---------|------------|---------------|---------|
| **Architect** | 8192 | `TASK_BREAKDOWN_PROMPT` | PRD analysis, task breakdown |
| **Researcher** | 4096 | `PRP_BLUEPRINT_PROMPT` | PRP generation, codebase research |
| **Coder** | 4096 | `PRP_BUILDER_PROMPT` | Code implementation from PRPs |
| **QA** | 4096 | `BUG_HUNT_PROMPT` | Validation, bug hunting |

**Persona Token Limits**:

**From**: `src/agents/agent-factory.ts:118-123`

```typescript
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,  // Higher limit for complex reasoning
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;
```

**All agents use GLM-4.7 model** (via `getModel('sonnet')`).

### Agent Configuration

All agents share a common configuration structure:

**From**: `src/agents/agent-factory.ts:91-109`

```typescript
export interface AgentConfig {
  readonly name: string;              // Agent identifier
  readonly system: string;            // System prompt
  readonly model: string;             // GLM-4.7
  readonly enableCache: boolean;      // true for all agents
  readonly enableReflection: boolean; // true for all agents
  readonly maxTokens: number;         // Persona-specific
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly ANTHROPIC_BASE_URL: string;
  };
}
```

**MCP Tools Shared Across All Agents**:

**From**: `src/agents/agent-factory.ts:56-68`

```typescript
// Singleton MCP server instances
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();

// Combined array passed to all agents
const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP];
```

### Prompt Creation with Zod Schemas

Prompts use Zod schemas for type-safe response validation:

**From**: `src/agents/prompts/architect-prompt.ts`

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';

// Define response schema
const BacklogSchema = z.object({
  backlog: z.array(z.object({
    id: z.string(),
    title: z.string(),
    milestones: z.array(z.object({
      id: z.string(),
      tasks: z.array(z.object({
        id: z.string(),
        subtasks: z.array(z.object({
          id: z.string(),
          title: z.string(),
          context_scope: z.string(),
        })),
      })),
    })),
  })),
});

// Create prompt with schema
export function createArchitectPrompt(prdContent: string): Prompt<BacklogSchema> {
  return createPrompt({
    user: 'Analyze this PRD and create a task backlog',
    data: { prd: prdContent },
    responseFormat: BacklogSchema,
    enableReflection: true,
  });
}
```

**Usage**:

```typescript
const architectAgent = createArchitectAgent();
const prompt = createArchitectPrompt(prdContent);
const result = await architectAgent.prompt(prompt);
// result is typed as BacklogSchema
```

### Reflection and Retry

**IMPORTANT**: The PRP Pipeline uses a **custom retry wrapper**, NOT Groundswell's `executeWithReflection`.

**Custom Retry Implementation**:

**From**: `src/utils/retry.ts`

```typescript
export interface AgentRetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const AGENT_RETRY_CONFIG: AgentRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

export async function retryAgentPrompt<T>(
  promptFn: () => Promise<T>,
  context: { agentType: string; operation: string }
): Promise<T> {
  // Custom exponential backoff retry logic
  // ...
}
```

**Usage in Pipeline**:

**From**: `src/workflows/prp-pipeline.ts:665-668`

```typescript
const result = await retryAgentPrompt(
  () => architectAgent.prompt(architectPrompt),
  { agentType: 'Architect', operation: 'decomposePRD' }
);
```

**Why custom instead of Groundswell's reflection?**

1. **Exponential backoff**: Custom delay timing
2. **Agent-specific context**: Pass agent type and operation for logging
3. **Flexible retry configuration**: Configurable max retries and delays

---

## MCP Tool Registration

### MCPHandler Pattern

All MCP tools in the PRP Pipeline extend the `MCPHandler` base class:

**From**: `src/tools/bash-mcp.ts:251-277`

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

export class BashMCP extends MCPHandler {
  // Server name for MCPServer interface
  public readonly name = 'bash';

  // Transport type for MCPServer interface
  public readonly transport = 'inprocess' as const;

  // Tools for MCPServer interface
  public readonly tools = [bashTool];

  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // PATTERN: Register tool executor
    this.registerToolExecutor(
      'bash',
      'execute_bash',
      executeBashCommand as ToolExecutor
    );
  }
}
```

### Tool Schema Definition

Tools are defined with JSON Schema input validation:

**From**: `src/tools/bash-mcp.ts:82-108`

```typescript
const bashTool: Tool = {
  name: 'execute_bash',
  description: 'Execute shell commands with optional working directory and timeout.',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for command execution (optional)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)',
        minimum: 1000,
        maximum: 300000,
      },
    },
    required: ['command'],
  },
};
```

### Tool Executor Implementation

Tool executors are async functions that process input and return results:

**From**: `src/tools/bash-mcp.ts:131-241`

```typescript
interface BashToolInput {
  command: string;
  cwd?: string;
  timeout?: number;
}

interface BashToolResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

async function executeBashCommand(input: BashToolInput): Promise<BashToolResult> {
  const { command, cwd, timeout = DEFAULT_TIMEOUT } = input;

  // PATTERN: Validate working directory exists
  const workingDir = cwd ? resolve(cwd) : undefined;

  // PATTERN: Use spawn() to prevent shell injection
  const args = command.split(' ');
  const executable = args[0] ?? '';

  let child: ChildProcess;
  try {
    child = spawn(executable, args.slice(1), {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
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

  // PATTERN: Timeout handler with SIGTERM then SIGKILL
  return new Promise(resolve => {
    // ... timeout and result handling
  });
}
```

### Tool Examples

#### BashMCP (Single Tool)

**From**: `src/tools/bash-mcp.ts`

```typescript
export class BashMCP extends MCPHandler {
  readonly name = 'bash';
  readonly transport = 'inprocess' as const;
  readonly tools = [bashTool];  // Single tool

  constructor() {
    super();
    this.registerServer({ name: this.name, transport: this.transport, tools: this.tools });
    this.registerToolExecutor('bash', 'execute_bash', executeBashCommand as ToolExecutor);
  }
}
```

#### FilesystemMCP (Multiple Tools)

**From**: `src/tools/filesystem-mcp.ts:487-534`

```typescript
export class FilesystemMCP extends MCPHandler {
  public readonly name = 'filesystem';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [
    fileReadTool,
    fileWriteTool,
    globFilesTool,
    grepSearchTool,
  ];  // Four tools

  constructor() {
    super();
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // Register each tool executor
    this.registerToolExecutor('filesystem', 'file_read', readFile as ToolExecutor);
    this.registerToolExecutor('filesystem', 'file_write', writeFile as ToolExecutor);
    this.registerToolExecutor('filesystem', 'glob_files', globFiles as ToolExecutor);
    this.registerToolExecutor('filesystem', 'grep_search', grepSearch as ToolExecutor);
  }
}
```

#### GitMCP (Version Control Operations)

**From**: `src/tools/git-mcp.ts:479-510`

```typescript
export class GitMCP extends MCPHandler {
  public readonly name = 'git';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [
    gitStatusTool,
    gitDiffTool,
    gitAddTool,
    gitCommitTool,
  ];  // Four Git tools

  constructor() {
    super();
    this.registerServer({ name: this.name, transport: this.transport, tools: this.tools });
    this.registerToolExecutor('git', 'git_status', gitStatus as ToolExecutor);
    this.registerToolExecutor('git', 'git_diff', gitDiff as ToolExecutor);
    this.registerToolExecutor('git', 'git_add', gitAdd as ToolExecutor);
    this.registerToolExecutor('git', 'git_commit', gitCommit as ToolExecutor);
  }
}
```

### Tool Naming Convention

**CRITICAL**: MCP tool names use the format `serverName__toolName` (double underscore).

**Examples**:

| Server | Tool | Full Name |
|--------|------|-----------|
| `bash` | `execute_bash` | `bash__execute_bash` |
| `filesystem` | `file_read` | `filesystem__file_read` |
| `filesystem` | `file_write` | `filesystem__file_write` |
| `filesystem` | `glob_files` | `filesystem__glob_files` |
| `filesystem` | `grep_search` | `filesystem__grep_search` |
| `git` | `git_status` | `git__git_status` |
| `git` | `git_diff` | `git__git_diff` |
| `git` | `git_add` | `git__git_add` |
| `git` | `git_commit` | `git__git_commit` |

---

## Caching

### Custom PRP Cache (Filesystem-Based)

**CRITICAL GOTCHA**: The PRP Pipeline uses a **custom filesystem-based cache**, NOT Groundswell's `defaultCache`.

**Reason**: Need persistent cache across runs (memory cache doesn't persist).

**Implementation**: `src/agents/prp-generator.ts`

**Cache Location**: `{sessionPath}/prps/.cache/{taskId}.json`

```typescript
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;      // SHA-256 for change detection
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;      // Full PRP for easy retrieval
}
```

### SHA-256 Cache Key Generation

Cache keys are generated from task inputs to detect changes:

**From**: `src/agents/prp-generator.ts:225-250`

```typescript
#computeTaskHash(task: Task | Subtask, _backlog: Backlog): string {
  // Build input object based on type
  let input: Record<string, unknown>;

  if (task.type === 'Task') {
    // Task hash includes: id, title, description
    input = {
      id: task.id,
      title: task.title,
      description: (task as Task).description,
    };
  } else {
    // Subtask hash includes: id, title, context_scope
    input = {
      id: task.id,
      title: task.title,
      context_scope: (task as Subtask).context_scope,
    };
  }

  // Deterministic JSON serialization (no whitespace)
  const jsonString = JSON.stringify(input, null, 0);

  // SHA-256 hash for collision resistance
  return createHash('sha256').update(jsonString).digest('hex');
}
```

**Excluded from hash**: Fields that don't affect PRP content:
- `status` (changes during execution)
- `dependencies` (structural, not content)
- `story_points` (metadata)

### Cache Metrics and Monitoring

Cache hits/misses are tracked for monitoring:

**From**: `src/agents/prp-generator.ts:145-148, 363-375`

```typescript
// Counter fields
#cacheHits: number = 0;
#cacheMisses: number = 0;

// Log metrics
#logCacheMetrics(): void {
  const total = this.#cacheHits + this.#cacheMisses;
  const hitRatio = total > 0 ? (this.#cacheHits / total) * 100 : 0;

  this.#logger.info(
    {
      hits: this.#cacheHits,
      misses: this.#cacheMisses,
      hitRatio: hitRatio.toFixed(1),
    },
    'PRP cache metrics'
  );
}
```

**Sample Output**:

```
PRP cache metrics: hits=15, misses=5, hitRatio=75.0
```

### Cache TTL and Expiration

Cache entries expire after 24 hours:

**From**: `src/agents/prp-generator.ts:151, 263-272`

```typescript
readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours

async #isCacheRecent(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < this.CACHE_TTL_MS;
  } catch {
    return false;  // File doesn't exist or can't be read
  }
}
```

**Cache Bypass**: Use `--no-cache` CLI flag to force regeneration.

---

## Observability

### WorkflowTreeDebugger

Groundswell's `WorkflowTreeDebugger` provides ASCII tree visualization of workflow execution:

```typescript
import { WorkflowTreeDebugger } from 'groundswell';

const workflow = new PRPPipeline(prdPath);
const debugger_ = new WorkflowTreeDebugger(workflow);

await workflow.run();

// ASCII tree output
console.log(debugger_.toTreeString());
// PRPPipeline [completed]
//   DeltaAnalysisWorkflow [completed]
//   BugHuntWorkflow [completed]
```

**Status Symbols**:

| Symbol | Status |
|--------|--------|
| `o` | idle |
| `-` | running |
| `+` | completed |
| `x` | failed |
| `/` | cancelled |

### Observer Pattern

Observers can be attached to workflows to receive events:

```typescript
import { WorkflowObserver, LogEntry, WorkflowEvent } from 'groundswell';

const observer: WorkflowObserver = {
  onLog(entry: LogEntry): void {
    console.log(`[${entry.level}] ${entry.message}`);
  },

  onEvent(event: WorkflowEvent): void {
    console.log(`Event: ${event.type}`);
  },

  onStateUpdated(node: WorkflowNode): void {
    console.log(`State updated: ${node.name}`);
  },

  onTreeChanged(root: WorkflowNode): void {
    console.log('Tree structure changed');
  },
};

workflow.addObserver(observer);
```

**Event Types**:

| Type | Description |
|------|-------------|
| `stepStart` | Step execution started |
| `stepEnd` | Step completed (includes duration) |
| `taskStart` | Task execution started |
| `taskEnd` | Task completed |
| `childAttached` | Child workflow attached |
| `stateSnapshot` | State snapshot captured |
| `error` | Error occurred |
| `treeUpdated` | Tree structure changed |

### Logging and Correlation IDs

The pipeline uses correlation logging for tracing workflow execution:

**From**: `src/workflows/prp-pipeline.ts:228, 285-289`

```typescript
// Generate correlation ID
readonly #correlationId: string = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Create correlation logger
this.correlationLogger = getLogger('PRPPipeline').child({
  correlationId: this.#correlationId,
});

// Usage
this.correlationLogger.info('[PRPPipeline] Starting workflow', {
  correlationId: this.#correlationId,
  prdPath: this.#prdPath,
});
```

**Sample Log Output**:

```
[PRPPipeline] Starting workflow correlationId=1706051234567-abc123, prdPath=./PRD.md
```

### Progress Tracking

Progress is tracked and reported every 5 tasks:

**From**: `src/workflows/prp-pipeline.ts:791-795`

```typescript
// Log progress every 5 tasks
if (this.completedTasks % 5 === 0) {
  this.logger.info(
    `[PRPPipeline] ${this.#progressTracker?.formatProgress()}`
  );
}
```

**Progress Bar Format** (40 character width):

```
[████████████████████████░░░░░░░░░░░░] 60% (12/20 tasks)
```

---

## Examples

### Creating a New Workflow

Create a new workflow by extending the `Workflow` class:

```typescript
import { Workflow, Step } from 'groundswell';

export class MyCustomWorkflow extends Workflow {
  // Public state fields (NOT @ObservedState)
  currentPhase: string = 'init';
  itemsProcessed: number = 0;

  constructor(inputData: string) {
    super('MyCustomWorkflow');

    // Input validation
    if (!inputData || inputData.trim() === '') {
      throw new Error('inputData must be a non-empty string');
    }

    // Store input
    this.inputData = inputData;
  }

  @Step({ trackTiming: true })
  async processInput(): Promise<void> {
    this.currentPhase = 'processing';
    // Process input logic here
    this.itemsProcessed = 10;
  }

  @Step({ trackTiming: true })
  async generateOutput(): Promise<string> {
    this.currentPhase = 'generating';
    return `Processed ${this.itemsProcessed} items`;
  }

  async run(): Promise<string> {
    this.setStatus('running');

    try {
      await this.processInput();
      const result = await this.generateOutput();
      this.setStatus('completed');
      return result;
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Usage**:

```typescript
const workflow = new MyCustomWorkflow('sample-input');
const result = await workflow.run();
console.log(result); // "Processed 10 items"
```

### Adding a New Agent Persona

Add a new agent persona to the factory:

```typescript
// 1. Update AgentPersona type
export type AgentPersona = 'architect' | 'researcher' | 'coder' | 'qa' | 'designer';

// 2. Add token limit
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
  designer: 6144,  // New persona
} as const;

// 3. Create system prompt
export const DESIGNER_PROMPT = `
You are a Designer agent specializing in UI/UX design.
Create design specifications, wireframes, and user flows.
`;

// 4. Create factory function
export function createDesignerAgent(): Agent {
  const baseConfig = createBaseConfig('designer');
  const config = {
    ...baseConfig,
    system: DESIGNER_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug({ persona: 'designer', model: config.model }, 'Creating agent');
  return createAgent(config);
}
```

**Usage**:

```typescript
const designerAgent = createDesignerAgent();
const result = await designerAgent.prompt(designPrompt);
```

### Implementing a New MCP Tool

Implement a new MCP tool by extending `MCPHandler`:

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// Define input/result interfaces
interface DatabaseToolInput {
  query: string;
  database?: string;
}

interface DatabaseToolResult {
  success: boolean;
  rows?: unknown[];
  error?: string;
}

// Define tool schema
const databaseTool: Tool = {
  name: 'execute_query',
  description: 'Execute a SQL database query',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL query to execute',
      },
      database: {
        type: 'string',
        description: 'Database name (optional)',
      },
    },
    required: ['query'],
  },
};

// Implement executor
async function executeDatabaseQuery(input: DatabaseToolInput): Promise<DatabaseToolResult> {
  const { query, database = 'default' } = input;

  try {
    // Execute query
    const rows = await db.query(query);
    return { success: true, rows };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Create MCP handler
export class DatabaseMCP extends MCPHandler {
  public readonly name = 'database';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [databaseTool];

  constructor() {
    super();
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });
    this.registerToolExecutor('database', 'execute_query', executeDatabaseQuery as ToolExecutor);
  }
}
```

**Register with agents**:

```typescript
// In agent-factory.ts
const DATABASE_MCP = new DatabaseMCP();
const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP, DATABASE_MCP];
```

**Tool name**: `database__execute_query` (double underscore format)

### Adding Caching to a Workflow

Add caching to a workflow using the custom PRP cache pattern:

```typescript
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

class CachedWorkflow extends Workflow {
  readonly CACHE_DIR = join(process.cwd(), '.cache');
  readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  async getCachedResult<T>(key: string): Promise<T | null> {
    const cachePath = join(this.CACHE_DIR, `${key}.json`);

    try {
      // Check if cache exists and is recent
      const stats = await stat(cachePath);
      const age = Date.now() - stats.mtimeMs;

      if (age > this.CACHE_TTL_MS) {
        return null; // Expired
      }

      // Load and parse cached data
      const content = await readFile(cachePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null; // Cache miss or error
    }
  }

  async setCachedResult<T>(key: string, value: T): Promise<void> {
    const cachePath = join(this.CACHE_DIR, `${key}.json`);

    // Create cache directory if needed
    await mkdir(this.CACHE_DIR, { recursive: true });

    // Write cached data
    await writeFile(cachePath, JSON.stringify(value, null, 2), 'utf-8');
  }

  computeCacheKey(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  @Step({ trackTiming: true })
  async processWithCache(input: string): Promise<string> {
    const cacheKey = this.computeCacheKey(input);

    // Try cache first
    const cached = await this.getCachedResult<string>(cacheKey);
    if (cached) {
      this.logger.info('Cache hit');
      return cached;
    }

    // Cache miss - process and cache result
    this.logger.info('Cache miss - processing');
    const result = await this.expensiveOperation(input);

    await this.setCachedResult(cacheKey, result);
    return result;
  }

  async expensiveOperation(input: string): Promise<string> {
    // Simulate expensive computation
    return `Processed: ${input}`;
  }
}
```

---

## See Also

- **[Architecture Overview](./ARCHITECTURE.md)** - High-level system architecture and design
- **[CLI Reference](./CLI_REFERENCE.md)** - Command-line interface documentation
- **[Configuration](./CONFIGURATION.md)** - Environment variables and settings
- **[Workflows](./WORKFLOWS.md)** - Pipeline workflow documentation
- **[Installation Guide](./INSTALLATION.md)** - Setup instructions including Groundswell linking
- **[Groundswell Documentation](~/projects/groundswell/README.md)** - Official Groundswell library docs
- **[Groundswell Workflow Guide](~/projects/groundswell/docs/workflow.md)** - Detailed workflow documentation
- **[Groundswell Agent Guide](~/projects/groundswell/docs/agent.md)** - Agent creation and configuration
- **[Groundswell Prompt Guide](~/projects/groundswell/docs/prompt.md)** - Prompt creation with Zod

---

**Groundswell Framework Guide Version**: 1.0.0
**Last Updated**: 2026-01-23
**For PRP Pipeline Version**: 0.1.0
