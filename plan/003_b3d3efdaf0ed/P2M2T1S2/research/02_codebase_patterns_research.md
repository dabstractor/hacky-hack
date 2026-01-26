# Codebase Groundswell Usage Patterns Research

## Summary of Findings

This document summarizes all Groundswell usage patterns found in the hacky-hack codebase, organized by feature area.

## 1. Workflow Patterns

### Workflow Classes Found

| File                                        | Class                   | Purpose                     |
| ------------------------------------------- | ----------------------- | --------------------------- |
| `/src/workflows/prp-pipeline.ts`            | `PRPPipeline`           | Main pipeline orchestration |
| `/src/workflows/bug-hunt-workflow.ts`       | `BugHuntWorkflow`       | QA bug testing workflow     |
| `/src/workflows/delta-analysis-workflow.ts` | `DeltaAnalysisWorkflow` | PRD comparison workflow     |
| `/src/workflows/fix-cycle-workflow.ts`      | `FixCycleWorkflow`      | Bug fix iteration workflow  |
| `/src/workflows/hello-world.ts`             | `HelloWorldWorkflow`    | Example workflow            |

### Constructor Patterns

**Pattern 1: Simple Constructor with Validation**

```typescript
// File: /src/workflows/bug-hunt-workflow.ts:76-86
constructor(prdContent: string, completedTasks: Task[]) {
  super('BugHuntWorkflow');

  // Input validation
  if (typeof prdContent !== 'string' || prdContent.trim() === '') {
    throw new Error('prdContent must be a non-empty string');
  }

  if (!Array.isArray(completedTasks)) {
    throw new Error('completedTasks must be an array');
  }

  // Initialize properties
  this.prdContent = prdContent;
  this.completedTasks = completedTasks;
}
```

**Pattern 2: Dependency Injection**

```typescript
// File: /src/workflows/fix-cycle-workflow.ts:100-116
constructor(
  testResults: TestResults,
  prdContent: string,
  taskOrchestrator: TaskOrchestrator,
  sessionManager: SessionManager
) {
  super('FixCycleWorkflow');

  if (testResults.bugs.length === 0) {
    throw new Error('FixCycleWorkflow requires testResults with bugs to fix');
  }

  this.testResults = testResults;
  this.prdContent = prdContent;
  this.taskOrchestrator = taskOrchestrator;
  this.sessionManager = sessionManager;
}
```

**Pattern 3: Complex Configuration**

```typescript
// File: /src/workflows/prp-pipeline.ts:250-305
constructor(
  prdPath: string,
  scope?: Scope,
  mode?: 'normal' | 'bug-hunt' | 'validate',
  noCache: boolean = false,
  continueOnError: boolean = false,
  maxTasks?: number,
  maxDuration?: number,
  planDir?: string
) {
  super('PRPPipeline');

  // Generate correlation ID
  this.#correlationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Store configuration
  this.#prdPath = prdPath;
  this.#scope = scope;
  this.mode = mode ?? 'normal';
  // ... more configuration

  // Create correlation logger
  this.correlationLogger = getLogger('PRPPipeline').child({
    correlationId: this.#correlationId,
  });

  // Setup signal handlers
  this.#setupSignalHandlers();
}
```

### Status Tracking Pattern

```typescript
async run(): Promise<TestResults> {
  this.setStatus('running');

  try {
    // Execute steps
    await this.analyzeScope();
    await this.creativeE2ETesting();
    await this.adversarialTesting();

    const results = await this.generateReport();

    this.setStatus('completed');
    return results;
  } catch (error) {
    this.setStatus('failed');
    throw error;
  }
}
```

### Correlation Logging Pattern

```typescript
// File: /src/workflows/bug-hunt-workflow.ts:93-106
const correlationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
this.correlationLogger = getLogger('BugHuntWorkflow').child({
  correlationId,
});

this.correlationLogger.info('[BugHuntWorkflow] Initialized', {
  correlationId,
  prdLength: prdContent.length,
  tasksCount: completedTasks.length,
});
```

## 2. @Step Decorator Usage

### All Steps Use trackTiming: true

Every `@Step` decorator in the production codebase uses `trackTiming: true`:

```typescript
// File: /src/workflows/bug-hunt-workflow.ts
@Step({ trackTiming: true })
async analyzeScope(): Promise<void> { }

@Step({ trackTiming: true })
async creativeE2ETesting(): Promise<void> { }

@Step({ trackTiming: true })
async adversarialTesting(): Promise<void> { }

@Step({ trackTiming: true })
async generateReport(): Promise<TestResults> { }
```

### Custom Step Names

Only one step uses a custom name:

```typescript
// File: /src/workflows/prp-pipeline.ts:508
@Step({ trackTiming: true, name: 'handleDelta' })
async handleDelta(): Promise<void> { }
```

### Step Error Handling Pattern

```typescript
@Step({ trackTiming: true })
async executeFixes(): Promise<void> {
  this.logger.info('[FixCycleWorkflow] Phase 2: Executing fixes');

  for (const fixTask of this.#fixTasks) {
    try {
      await this.taskOrchestrator.executeSubtask(fixTask);
      successCount++;
    } catch (error) {
      failureCount++;
      this.logger.error(`[FixCycleWorkflow] Fix task ${fixTask.id} failed`);
      // Don't throw - continue with next fix
    }
  }
}
```

## 3. @ObservedState Decorator Usage

### Important: NOT Used in Production

**Finding**: The `@ObservedState` decorator is **NOT used in production code**. It only appears in test files.

**Reason**: Compatibility issues with the test environment (decorator API version mismatch).

### Production Pattern: Public State Fields

Instead of `@ObservedState`, production workflows use public state fields:

```typescript
// File: /src/workflows/prp-pipeline.ts:142-177
export class PRPPipeline extends Workflow {
  // Public Observed State Fields (tracked by Groundswell)

  /** Session state manager */
  sessionManager: SessionManager;

  /** Task execution orchestrator */
  taskOrchestrator: TaskOrchestrator;

  /** Correlation logger */
  correlationLogger: Logger;

  /** PRP Runtime */
  runtime: PRPRuntime | null = null;

  /** Current pipeline phase */
  currentPhase: string = 'init';

  /** Pipeline execution mode */
  mode: 'normal' | 'bug-hunt' | 'validate' = 'normal';

  /** Total number of subtasks */
  totalTasks: number = 0;

  /** Number of completed subtasks */
  completedTasks: number = 0;

  /** Whether graceful shutdown has been requested */
  shutdownRequested: boolean = false;

  /** ID of the currently executing task */
  currentTaskId: string | null = null;

  /** Reason for shutdown */
  shutdownReason: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT' | null = null;
}
```

### Child Workflow Pattern

```typescript
// File: /src/workflows/bug-hunt-workflow.ts:48-59
export class BugHuntWorkflow extends Workflow {
  /** Original PRD content */
  prdContent: string;

  /** List of completed tasks */
  completedTasks: Task[];

  /** Generated test results */
  testResults: TestResults | null = null;

  /** Correlation logger */
  private correlationLogger: Logger;
}
```

## 4. @Task Decorator Usage

### Important: NOT Used in Production

**Finding**: The `@Task` decorator is **NOT used in production workflows**. It only appears in test files.

**Reason**: Production workflows execute child workflows sequentially without decorator-based attachment.

### Production Pattern: Direct Instantiation

```typescript
// File: /src/workflows/prp-pipeline.ts:992-1023
// Direct instantiation without @Task
const bugHuntWorkflow = new BugHuntWorkflow(prdContent, completedTasks);
const testResults = await bugHuntWorkflow.run();

if (testResults.hasBugs) {
  const fixCycleWorkflow = new FixCycleWorkflow(
    testResults,
    prdContent,
    this.taskOrchestrator,
    this.sessionManager
  );

  const fixResults = await fixCycleWorkflow.run();
}
```

### Test Pattern: @Task for Parent-Child

```typescript
// File: /tests/integration/groundswell/workflow.test.ts:259-268
class ParentWorkflow extends Workflow {
  @Task()
  async spawnChild(): Promise<ChildWorkflow> {
    return new ChildWorkflow('ChildWorkflow', this);
  }

  async run(): Promise<void> {
    await this.spawnChild();
  }
}

// Verify relationship
expect(parent.children.length).toBe(1);
expect(child.parent).toBe(parent);
```

## 5. Agent Creation Patterns

### Agent Factory Pattern

**File**: `/src/agents/agent-factory.ts`

**Persona Token Limits**:

```typescript
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;
```

**Base Configuration Builder**:

```typescript
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  const model = getModel('sonnet'); // All use GLM-4.7
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;
  const system = `You are a ${persona} agent.`;

  return {
    name,
    system,
    model,
    enableCache: true, // Caching enabled
    enableReflection: true, // Reflection enabled
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}
```

**Architect Agent**:

```typescript
// File: /src/agents/agent-factory.ts:195-204
export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,
    mcps: MCP_TOOLS,
  };
  return createAgent(config);
}
```

**Researcher Agent**:

```typescript
// File: /src/agents/agent-factory.ts:223-235
export function createResearcherAgent(): Agent {
  const baseConfig = createBaseConfig('researcher');
  const config = {
    ...baseConfig,
    system: PRP_BLUEPRINT_PROMPT,
    mcps: MCP_TOOLS,
  };
  return createAgent(config);
}
```

**Coder Agent**:

```typescript
// File: /src/agents/agent-factory.ts:254-263
export function createCoderAgent(): Agent {
  const baseConfig = createBaseConfig('coder');
  const config = {
    ...baseConfig,
    system: PRP_BUILDER_PROMPT,
    mcps: MCP_TOOLS,
  };
  return createAgent(config);
}
```

**QA Agent**:

```typescript
// File: /src/agents/agent-factory.ts:282-291
export function createQAAgent(): Agent {
  const baseConfig = createBaseConfig('qa');
  const config = {
    ...baseConfig,
    system: BUG_HUNT_PROMPT,
    mcps: MCP_TOOLS,
  };
  return createAgent(config);
}
```

### MCP Tools Array

```typescript
// File: /src/agents/agent-factory.ts:56-68
// Singleton MCP server instances
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();

// Combined array for agent integration
const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP];
```

## 6. MCP Tool Implementation Patterns

### MCPHandler Extension Pattern

**All MCP tools extend MCPHandler**:

```typescript
// File: /src/tools/bash-mcp.ts:251-277
export class BashMCP extends MCPHandler {
  public readonly name = 'bash';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [bashTool];

  constructor() {
    super();

    // Register server
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // Register tool executor
    this.registerToolExecutor(
      'bash',
      'execute_bash',
      executeBashCommand as ToolExecutor
    );
  }
}
```

### Tool Schema Pattern

```typescript
// File: /src/tools/bash-mcp.ts:82-108
const bashTool: Tool = {
  name: 'execute_bash',
  description: 'Execute shell commands...',
  input_schema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The shell command to execute' },
      cwd: { type: 'string', description: 'Working directory...' },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds...',
        minimum: 1000,
        maximum: 300000,
      },
    },
    required: ['command'],
  },
};
```

### Multi-Tool MCP Pattern

```typescript
// File: /src/tools/filesystem-mcp.ts:487-533
export class FilesystemMCP extends MCPHandler {
  public readonly name = 'filesystem';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [
    fileReadTool,
    fileWriteTool,
    globFilesTool,
    grepSearchTool,
  ];

  constructor() {
    super();

    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // Register multiple tool executors
    this.registerToolExecutor(
      'filesystem',
      'file_read',
      readFile as ToolExecutor
    );
    this.registerToolExecutor(
      'filesystem',
      'file_write',
      writeFile as ToolExecutor
    );
    this.registerToolExecutor(
      'filesystem',
      'glob_files',
      globFiles as ToolExecutor
    );
    this.registerToolExecutor(
      'filesystem',
      'grep_search',
      grepSearch as ToolExecutor
    );
  }
}
```

## 7. Prompt Creation Patterns

### createPrompt with responseFormat Pattern

```typescript
// File: /src/agents/prompts/bug-hunt-prompt.ts:127-142
export function createBugHuntPrompt(
  prd: string,
  completedTasks: Task[]
): Prompt<TestResults> {
  return createPrompt({
    user: constructUserPrompt(prd, completedTasks),
    system: BUG_HUNT_PROMPT,
    responseFormat: TestResultsSchema,
    enableReflection: true,
  });
}
```

### Reflection Enabled in All Prompts

All agent prompts have `enableReflection: true`:

| Prompt                      | File                                                   | Purpose        |
| --------------------------- | ------------------------------------------------------ | -------------- |
| `createArchitectPrompt`     | `/src/agents/prompts/architect-prompt.ts:51-67`        | Task breakdown |
| `createPRPBlueprintPrompt`  | `/src/agents/prompts/prp-blueprint-prompt.ts:255-270`  | PRP generation |
| `createBugHuntPrompt`       | `/src/agents/prompts/bug-hunt-prompt.ts:127-142`       | Bug testing    |
| `createDeltaAnalysisPrompt` | `/src/agents/prompts/delta-analysis-prompt.ts:128-143` | PRD comparison |

### Zod Schema Patterns

**Custom Validation**:

```typescript
// File: /src/core/models.ts:30
export const ContextScopeSchema: z.ZodType<string> = z
  .string()
  .min(1, 'Context scope is required')
  .superRefine((value, ctx) => {
    const prefix = 'CONTRACT DEFINITION:\n';
    if (!value.startsWith(prefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'context_scope must start with "CONTRACT DEFINITION:"',
      });
    }
  });
```

**Schema Parsing**:

```typescript
// Runtime validation
return PRPDocumentSchema.parse(metadata.prp);

// Result validation after LLM call
const validated = PRPDocumentSchema.parse(result);
```

## 8. Cache Implementation

### Custom PRP Cache (NOT Groundswell defaultCache)

**Important**: The codebase does **NOT** use Groundswell's `defaultCache`. It implements a custom filesystem-based PRP cache.

```typescript
// File: /src/agents/prp-generator.ts:90-151
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;
}

export class PRPGenerator {
  readonly #noCache: boolean;
  #cacheHits: number = 0;
  #cacheMisses: number = 0;
  readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
}
```

### SHA-256 Cache Key Generation

```typescript
// File: /src/agents/prp-generator.ts:212-249
#computeTaskHash(task: Task | Subtask, backlog: Backlog): string {
  let input: Record<string, unknown>;

  if (task.type === 'Task') {
    input = {
      id: task.id,
      title: task.title,
      description: (task as Task).description,
    };
  } else {
    input = {
      id: task.id,
      title: task.title,
      context_scope: (task as Subtask).context_scope,
    };
  }

  const jsonString = JSON.stringify(input, null, 0);
  return createHash('sha256').update(jsonString).digest('hex');
}
```

### Cache Check and Retrieval

```typescript
// File: /src/agents/prp-generator.ts:404-431
if (!this.#noCache) {
  const cachePath = this.getCachePath(task.id);
  const currentHash = this.#computeTaskHash(task, backlog);

  if (await this.#isCacheRecent(cachePath)) {
    const cachedPRP = await this.#loadCachedPRP(task.id);

    if (cachedPRP) {
      const cachedMetadata = await this.#loadCacheMetadata(task.id);
      if (cachedMetadata?.taskHash === currentHash) {
        this.#cacheHits++;
        this.#logger.info({ taskId: task.id }, 'PRP cache HIT');
        return cachedPRP;
      }
    }
  }

  this.#cacheMisses++;
}
```

## 9. Retry Logic

### Custom Retry Wrapper

**NOT using Groundswell's executeWithReflection**:

```typescript
// File: /src/utils/retry.ts:629-637
export async function retryAgentPrompt<T>(
  agentPromptFn: () => Promise<T>,
  context: { agentType: string; operation: string }
): Promise<T> {
  return retry(agentPromptFn, {
    ...AGENT_RETRY_CONFIG, // maxAttempts: 3, baseDelay: 1000ms
    onRetry: createDefaultOnRetry(`${context.agentType}.${context.operation}`),
  });
}
```

### Agent Retry Configuration

```typescript
// File: /src/utils/retry.ts:597-605
const AGENT_RETRY_CONFIG: Required<
  Omit<RetryOptions, 'isRetryable' | 'onRetry'>
> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
};
```

### Usage Pattern

```typescript
// File: /src/workflows/prp-pipeline.ts:655-668
const architectAgent = createArchitectAgent();
const architectPrompt = createArchitectPrompt(prdContent);

const _result = await retryAgentPrompt(
  () => architectAgent.prompt(architectPrompt),
  { agentType: 'Architect', operation: 'decomposePRD' }
);
```

## 10. Observability Patterns

### Logger Usage

```typescript
// File: /src/utils/logger.ts
export function getLogger(context: string, options?: LoggerConfig): Logger;
export function clearLoggerCache(): void;
```

### Logger Locations

| Location                          | Usage               |
| --------------------------------- | ------------------- |
| `/src/index.ts:109`               | App logger          |
| `/src/agents/agent-factory.ts:46` | AgentFactory logger |
| `/src/agents/prp-executor.ts:198` | PRPExecutor logger  |
| `/src/core/task-patcher.ts:26`    | TaskPatcher logger  |

### Observer Pattern (Tests Only)

```typescript
// File: /tests/integration/groundswell/workflow.test.ts:171-181
const observer: WorkflowObserver = {
  onLog: () => {},
  onEvent: event => events.push(event),
  onStateUpdated: () => {},
  onTreeChanged: () => {},
};

workflow.addObserver(observer);
```

## 11. Graceful Shutdown Patterns

### Signal Handler Registration

```typescript
// File: /src/workflows/prp-pipeline.ts:321-355
#setupSignalHandlers(): void {
  this.#sigintHandler = () => {
    this.#sigintCount++;

    if (this.#sigintCount > 1) {
      return; // Already in progress
    }

    this.logger.info('[PRPPipeline] SIGINT received, initiating graceful shutdown');
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGINT';
  };

  this.#sigtermHandler = () => {
    this.logger.info('[PRPPipeline] SIGTERM received, initiating graceful shutdown');
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGTERM';
  };

  process.on('SIGINT', this.#sigintHandler);
  process.on('SIGTERM', this.#sigtermHandler);
}
```

### Shutdown Request Check

```typescript
// After each task
if (this.shutdownRequested) {
  this.logger.info('[PRPPipeline] Shutdown requested, finishing current task');

  const progress = this.#progressTracker?.getProgress();
  this.logger.info(
    `[PRPPipeline] Shutting down: ${progress?.completed}/${progress?.total} tasks complete`
  );

  this.currentPhase = 'shutdown_interrupted';
  break;
}
```

### Cleanup in Finally Block

```typescript
// File: /src/workflows/prp-pipeline.ts:1740-1743
} finally {
  // Always cleanup, even if interrupted or errored
  await this.cleanup();
}
```

### Cleanup Step

```typescript
// File: /src/workflows/prp-pipeline.ts:1245-1329
@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  this.logger.info('[PRPPipeline] Starting cleanup and state preservation');

  try {
    // Stop resource monitoring
    if (this.#resourceMonitor) {
      this.#resourceMonitor.stop();
    }

    // Save current state
    if (this.sessionManager?.currentSession?.taskRegistry) {
      await this.sessionManager.flushUpdates();
      await this.sessionManager.saveBacklog(backlog);
    }

    // Remove signal listeners
    if (this.#sigintHandler) {
      process.off('SIGINT', this.#sigintHandler);
    }
    if (this.#sigtermHandler) {
      process.off('SIGTERM', this.#sigtermHandler);
    }

    this.currentPhase = 'shutdown_complete';
  } catch (error) {
    this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
  }
}
```

## 12. Progress Tracking Pattern

```typescript
// File: /src/workflows/prp-pipeline.ts:753-795
this.#progressTracker = progressTracker({
  backlog,
  logInterval: 5, // Log progress every 5 tasks
  barWidth: 40,
});

while (await this.taskOrchestrator.processNextItem()) {
  this.completedTasks = this.#countCompletedTasks();

  const currentItemId = this.taskOrchestrator.currentItemId ?? 'unknown';
  this.#progressTracker?.recordComplete(currentItemId);

  // Log progress every 5 tasks
  if (this.completedTasks % 5 === 0) {
    this.logger.info(
      `[PRPPipeline] ${this.#progressTracker?.formatProgress()}`
    );
  }

  // Check shutdown
  if (this.shutdownRequested) {
    break;
  }
}
```

## Key Differences from Groundswell Documentation

| Feature                 | Groundswell Docs       | Codebase Usage                  |
| ----------------------- | ---------------------- | ------------------------------- |
| `@ObservedState`        | Decorator for state    | Public fields (not used)        |
| `@Task`                 | Decorator for children | Direct instantiation (not used) |
| `defaultCache`          | Built-in LLM cache     | Custom filesystem cache         |
| `executeWithReflection` | Reflection wrapper     | Custom retry wrapper            |
| `INTROSPECTION_TOOLS`   | 6 navigation tools     | Not used in production          |

## Reasons for Differences

1. **@ObservedState**: Test environment compatibility issues
2. **@Task**: Sequential execution preferred, simpler pattern
3. **defaultCache**: Need persistent cache across runs (filesystem vs memory)
4. **executeWithReflection**: Custom retry logic with exponential backoff
5. **INTROSPECTION_TOOLS**: Agent doesn't need workflow hierarchy inspection
