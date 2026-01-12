# Groundswell Library API Reference

**Location:** `~/projects/groundswell`
**Purpose:** Core framework for PRP Pipeline implementation
**Access:** Local npm link (`npm link ~/projects/groundswell`)

## Core Exports

### Main Classes
- `Workflow` - Base class for all workflow implementations
- `Agent` - LLM execution wrapper around Anthropic SDK
- `Prompt<T>` - Immutable type-safe prompt definitions
- `MCPHandler` - Tool and MCP server management

### Factory Functions
- `createWorkflow(config, executor)` - Create functional workflows
- `createAgent(config)` - Create agent instances
- `createPrompt(config)` - Create prompt instances

### Decorators
- `@Step(opts)` - Mark methods as workflow steps
- `@Task(opts)` - Mark methods that return child workflows
- `@ObservedState(meta)` - Mark fields for state snapshots

## Workflow System

### Class-Based Pattern

```typescript
import { Workflow, Step, ObservedState, Task } from 'groundswell';

class PRPPipeline extends Workflow {
  @ObservedState()
  currentPhase: string = 'init';

  @ObservedState({ redact: true })
  apiKey: string = 'secret';

  @Step({ trackTiming: true, snapshotState: true })
  async initializeSession(): Promise<SessionConfig> {
    this.currentPhase = 'initializing';
    // Implementation here
    return sessionConfig;
  }

  @Task({ concurrent: true })
  async executePhase(): Promise<PhaseWorkflow[]> {
    // Returns array of child workflows to run in parallel
    return this.phases.map(p => new PhaseWorkflow(p, this));
  }

  async run(): Promise<ExecutionResult> {
    this.setStatus('running');
    const result = await this.initializeSession();
    const phases = await this.executePhase();
    this.setStatus('completed');
    return { result, phases };
  }
}
```

### Functional Pattern

```typescript
const workflow = createWorkflow(
  { name: 'DataPipeline', enableReflection: true },
  async (ctx) => {
    const loaded = await ctx.step('load', async () => fetchData());
    const processed = await ctx.step('process', async () => transform(loaded));
    return processed;
  }
);
```

### Decorator Options

**@Step:**
```typescript
@Step({
  name: 'CustomName',          // Custom step name
  trackTiming: true,           // Track execution duration (default: true)
  snapshotState: true,         // Capture state snapshot after completion
  logStart: true,              // Log message at step start
  logFinish: true,             // Log message at step end (includes duration)
})
async myStep() { /* ... */ }
```

**@Task:**
```typescript
@Task({
  name: 'CustomTaskName',      // Custom task name
  concurrent: true,            // Run returned workflows in parallel
})
async createChildren(): Promise<ChildWorkflow[]> {
  return [new ChildWorkflow('child1', this)];
}
```

**@ObservedState:**
```typescript
@ObservedState({ redact: true })   // Shows as '***' in snapshots
apiKey: string = 'secret';

@ObservedState({ hidden: true })   // Excluded from snapshots
internalState: object = {};
```

## Agent System

### Agent Creation

```typescript
import { createAgent } from 'groundswell';

const agent = createAgent({
  name: 'PRPAgent',
  system: 'You are a PRP pipeline expert...',
  model: 'claude-sonnet-4-20250514',  // Or 'GLM-4.7' for z.ai
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  temperature: 0.1,
  mcps: [customMCPServer],
  tools: [customTools],
  hooks: {
    onPreToolUse: (ctx) => { /* ... */ },
    onPostToolUse: (ctx) => { /* ... */ },
  },
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
});
```

### Agent Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Agent identifier for logging |
| `system` | string | System prompt for the agent |
| `model` | string | Model identifier (e.g., `GLM-4.7`) |
| `enableCache` | boolean | Enable LLM response caching (default: true) |
| `enableReflection` | boolean | Enable error recovery with analysis |
| `maxTokens` | number | Maximum tokens in response |
| `temperature` | number | Sampling temperature (0-1) |
| `mcps` | MCP[] | Array of MCP servers |
| `tools` | Tool[] | Array of tool definitions |
| `hooks` | object | Lifecycle hooks |
| `env` | object | Environment variable overrides |

## MCP Integration (Tools)

### Tool Schema Definition

```typescript
const bashTool: Tool = {
  name: 'execute_bash',
  description: 'Execute shell commands',
  input_schema: {
    type: 'object',
    properties: {
      command: { type: 'string' },
      cwd: { type: 'string' },
    },
    required: ['command'],
  },
};
```

### MCP Server Registration

```typescript
import { MCPHandler } from 'groundswell';

const mcpHandler = new MCPHandler();

// Register MCP server
mcpHandler.registerServer({
  name: 'bash',
  transport: 'inprocess',
  tools: [bashTool],
});

// Register tool executor
mcpHandler.registerToolExecutor('bash', 'execute_bash', async (input) => {
  const { command, cwd } = input as { command: string; cwd?: string };
  return executeBashCommand(command, cwd);
});
```

### Tool Execution in Workflows

```typescript
class MyWorkflow extends Workflow {
  private mcpHandler = new MCPHandler();

  @Step()
  async runCommand(): Promise<string> {
    return await this.mcpHandler.executeTool('bash__execute_bash', {
      command: 'npm run test',
      cwd: './my-project',
    });
  }
}
```

### Tool Categories for PRP Pipeline

**Required Tools:**
1. **BashTool** - Execute shell commands (git, npm, tests)
2. **FileTool** - Read/write files (PRP generation, code editing)
3. **GrepTool** - Search codebases (pattern matching)
4. **GlobTool** - File path matching
5. **WebSearchTool** - External documentation research
6. **GitTool** - Version control operations

## Prompt System

### Prompt Creation with Zod Schemas

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';

const analysisPrompt = createPrompt({
  user: 'Analyze this codebase for security vulnerabilities',
  data: {
    codebasePath: './src',
    focusAreas: ['auth', 'data_validation', 'dependencies'],
  },
  responseFormat: z.object({
    vulnerabilities: z.array(z.object({
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      location: z.string(),
      recommendation: z.string(),
    })),
    score: z.number().min(0).max(100),
    summary: z.string(),
  }),
  system: 'You are an expert security analyst...',
  enableReflection: true,
});
```

### Prompt Execution

```typescript
const result = await agent.prompt(analysisPrompt);
// Result is fully typed:
// {
//   vulnerabilities: Array<{
//     severity: 'low' | 'medium' | 'high' | 'critical',
//     description: string,
//     location: string,
//     recommendation: string,
//   }>,
//   score: number,
//   summary: string,
// }
```

### Prompt Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `user` | string | User prompt template |
| `system` | string | System prompt |
| `data` | object | Data to inject into template |
| `responseFormat` | ZodSchema | Schema for structured output |
| `enableReflection` | boolean | Enable reflection for this prompt |

## State Management

### Observed State Pattern

```typescript
class PRPPipeline extends Workflow {
  @ObservedState()
  publicData: string = 'visible-value';

  @ObservedState({ redact: true })
  apiKey: string = 'secret';  // Shows as '***' in snapshots

  @ObservedState({ hidden: true })
  internalState: object = {};  // Excluded from snapshots

  @Step({ snapshotState: true })
  async processData() {
    this.publicData = 'updated';
    // State automatically captured after step completes
  }
}
```

### State Metadata Options

- **No options:** Full visibility in snapshots
- `{ redact: true }`: Shows as `'***'` in snapshots
- `{ hidden: true }`: Excluded from snapshots entirely

## Configuration

### Environment Variables

Groundswell expects standard Anthropic environment variables:

```bash
# Required
export ANTHROPIC_API_KEY="your-api-key-here"

# Optional - Custom base URL (for z.ai)
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"

# Optional - Default model selection
export ANTHROPIC_DEFAULT_MODEL="GLM-4.7"
```

### Programmatic Configuration

```typescript
const agent = createAgent({
  name: 'CustomAgent',
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_AUTH_TOKEN,  // Map from shell env
    ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
  },
});
```

## Advanced Features

### Hierarchical Workflows

```typescript
class ParentWorkflow extends Workflow {
  @Task()
  async spawnChildren(): Promise<ChildWorkflow[]> {
    return [
      new ChildWorkflow('child1', this),
      new ChildWorkflow('child2', this),
    ];
  }
}

class ChildWorkflow extends Workflow {
  constructor(id: string, parent: ParentWorkflow) {
    super(id, parent);
  }
}
```

### Event System

Groundswell emits events for:
- Step start/end
- Task start/end
- Errors and failures
- State snapshots
- Tool usage

### Caching

LLM responses are cached using SHA-256 keys:
- Deterministic prompts return cached responses
- Saves cost and latency
- Automatic cache invalidation on prompt changes

### Reflection

Multi-level error recovery:
1. **Automatic Retry:** Retry failed LLM calls
2. **Error Analysis:** Agent analyzes failure
3. **Corrective Action:** Agent attempts fix
4. **Verification:** Validate correction success

## Implementation Patterns for PRP Pipeline

### Pattern 1: Main Pipeline Workflow

```typescript
class PRPPipeline extends Workflow {
  @ObservedState()
  sessionPath: string;

  @ObservedState()
  taskRegistry: TaskRegistry;

  @Step()
  async initializeSession() {
    const hash = this.hashPRD(this.prdPath);
    this.sessionPath = `plan/001_${hash}`;
    await this.createSessionDirectory();
  }

  @Task()
  async executeBacklog() {
    const tasks = this.taskRegistry.getPendingTasks();
    return tasks.map(task => new TaskWorkflow(task, this));
  }
}
```

### Pattern 2: Agent with Tools

```typescript
const coderAgent = createAgent({
  name: 'CoderAgent',
  system: CODER_SYSTEM_PROMPT,
  model: 'GLM-4.7',
  mcps: [
    new BashMCP(),
    new FilesystemMCP(),
    new GitMCP(),
  ],
});
```

### Pattern 3: Structured Prompt Execution

```typescript
const architectPrompt = createPrompt({
  user: prdContent,
  system: ARCHITECT_SYSTEM_PROMPT,
  responseFormat: z.object({
    backlog: z.array(TaskSchema),
  }),
});

const { backlog } = await agent.prompt(architectPrompt);
```

## Key Takeaways

1. **Class-Based Workflows:** Extends `Workflow` for complex stateful operations
2. **Hierarchical Tasks:** Use `@Task({ concurrent: true })` for parallel sub-workflows
3. **Type-Safe Prompts:** Zod schemas enforce strict JSON output structure
4. **MCP Tools:** Standardized tool interface for LLM capabilities
5. **State Snapshots:** `@ObservedState()` provides audit trail and recovery
6. **Caching + Reflection:** Built-in optimization and error recovery

## Next Steps for Implementation

1. Link Groundswell locally: `npm link ~/projects/groundswell`
2. Implement `TaskRegistry` class with `@ObservedState` fields
3. Create `PRPPipeline` workflow class
4. Port system prompts from `PROMPTS.md` to `createPrompt()` calls
5. Implement MCP tools for bash, file, and git operations
