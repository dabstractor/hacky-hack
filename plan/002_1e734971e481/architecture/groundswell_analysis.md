# Groundswell Library Analysis

**Research Date:** 2026-01-15  
**Library Location:** `/home/dustin/projects/groundswell`  
**Version:** 0.0.3  
**Status:** ✅ Accessible and Production-Ready

---

## Executive Summary

The Groundswell library is a **hierarchical workflow orchestration engine with full observability** built on TypeScript. It provides a robust foundation for building AI-powered workflows with hierarchical task management, state persistence, and seamless integration with the Anthropic Claude API via z.ai/Anthropic SDK.

**Key Findings:**
- ✅ Library exists and is fully accessible at `~/projects/groundswell`
- ✅ Comprehensive API with Workflow, Agent, Prompt, and MCPHandler classes
- ✅ Full decorator support with `@Step`, `@Task`, and `@ObservedState`
- ✅ Built-in caching, reflection, and introspection capabilities
- ✅ Production-ready with extensive test coverage (50+ test cases)
- ✅ Well-documented with examples and PRD specification

---

## 1. Library Overview

### Location & Structure
```
/home/dustin/projects/groundswell/
├── src/
│   ├── core/           # Core classes (Workflow, Agent, Prompt, MCPHandler)
│   ├── decorators/     # @Step, @Task, @ObservedState
│   ├── types/          # TypeScript type definitions
│   ├── cache/          # LRU caching implementation
│   ├── reflection/     # Multi-level error recovery
│   ├── tools/          # Introspection tools
│   ├── debugger/       # WorkflowTreeDebugger
│   └── utils/          # Helper utilities
├── examples/           # 11 comprehensive examples
├── docs/              # Detailed documentation
└── dist/              # Compiled JavaScript output
```

### Dependencies
- `@anthropic-ai/sdk: ^0.71.1` - Anthropic API integration
- `zod: ^3.23.0` - Schema validation
- `lru-cache: ^10.4.3` - LLM response caching
- **Requirements:** Node.js 18+, TypeScript 5.2+

---

## 2. Core API Surface

### 2.1 Primary Classes

#### **Workflow** (`src/core/workflow.ts`)
The base class for all workflows. Supports both class-based and functional patterns.

**Key Properties:**
```typescript
class Workflow<T = unknown> {
  readonly id: string;
  parent: Workflow | null;
  children: Workflow[];
  status: WorkflowStatus; // 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
  protected readonly logger: WorkflowLogger;
  readonly node: WorkflowNode;
}
```

**Key Methods:**
- `constructor(name?: string | WorkflowConfig, parent?: Workflow)` - Overloaded constructor
- `async run(...args: unknown[]): Promise<T>` - Execute the workflow
- `attachChild(child: Workflow): void` - Attach child workflow with validation
- `detachChild(child: Workflow): void` - Detach child for reparenting
- `setStatus(status: WorkflowStatus): void` - Update workflow status
- `snapshotState(): void` - Capture and emit state snapshot
- `emitEvent(event: WorkflowEvent): void` - Emit events to observers
- `addObserver(observer: WorkflowObserver): void` - Add observer (root only)
- `isDescendantOf(ancestor: Workflow): boolean` - Check hierarchy relationship

**Usage Patterns:**

**Class-Based:**
```typescript
class MyWorkflow extends Workflow {
  @Step({ snapshotState: true })
  async processItem() {
    // Step logic
  }

  async run() {
    this.setStatus('running');
    await this.processItem();
    this.setStatus('completed');
  }
}

const workflow = new MyWorkflow('MyWorkflow');
await workflow.run();
```

**Functional:**
```typescript
const workflow = createWorkflow(
  { name: 'MyWorkflow', enableReflection: true },
  async (ctx) => {
    const result1 = await ctx.step('step1', async () => {
      return await fetchData();
    });
    
    const result2 = await ctx.step('step2', async () => {
      return await processData(result1);
    });
    
    return result2;
  }
);

const { data, node, duration } = await workflow.run();
```

---

#### **Agent** (`src/core/agent.ts`)
Lightweight wrapper around Anthropic SDK for LLM execution.

**Constructor:**
```typescript
constructor(config: AgentConfig = {})
```

**AgentConfig Interface:**
```typescript
interface AgentConfig {
  name?: string;
  system?: string;
  tools?: Tool[];
  mcps?: MCPServer[];
  skills?: Skill[];
  hooks?: AgentHooks;
  env?: Record<string, string>;
  enableReflection?: boolean;
  enableCache?: boolean;
  model?: string; // Default: 'claude-sonnet-4-20250514'
  maxTokens?: number; // Default: 4096
  temperature?: number;
}
```

**Key Methods:**
- `async prompt<T>(prompt: Prompt<T>, overrides?: PromptOverrides): Promise<T>` - Execute prompt
- `async promptWithMetadata<T>(prompt: Prompt<T>, overrides?: PromptOverrides): Promise<PromptResult<T>>` - Execute with metadata
- `async reflect<T>(prompt: Prompt<T>, overrides?: PromptOverrides): Promise<T>` - Execute with reflection
- `getMcpHandler(): MCPHandler` - Access MCP handler for custom tool registration

**PromptResult Interface:**
```typescript
interface PromptResult<T> {
  data: T;              // Validated response
  usage: TokenUsage;    // Token counts
  duration: number;     // Milliseconds
  toolCalls: number;    // Tool invocation count
}
```

---

#### **Prompt** (`src/core/prompt.ts`)
Immutable type-safe prompt definition with Zod validation.

**Constructor:**
```typescript
constructor(config: PromptConfig<T>)
```

**PromptConfig Interface:**
```typescript
interface PromptConfig<T> {
  user: string;                    // User message
  data?: Record<string, unknown>;  // Structured data injection
  responseFormat: z.ZodType<T>;    // Zod schema for validation
  system?: string;                 // System prompt override
  tools?: Tool[];                  // Tools override
  mcps?: MCPServer[];              // MCPs override
  skills?: Skill[];                // Skills override
  hooks?: AgentHooks;              // Hooks override
  enableReflection?: boolean;      // Enable reflection
}
```

**Key Methods:**
- `validateResponse(data: unknown): T` - Validate response (throws on error)
- `safeValidateResponse(data: unknown): { success: true; data: T } | { success: false; error: z.ZodError }` - Safe validation
- `buildUserMessage(): string` - Build formatted user message with data
- `withData(newData: Record<string, unknown>): Prompt<T>` - Immutable data update
- `getData(): Record<string, unknown>` - Get prompt data
- `getResponseFormat(): z.ZodType<T>` - Get response schema

**Example:**
```typescript
import { z } from 'zod';
import { createPrompt, createAgent } from 'groundswell';

const analysisPrompt = createPrompt({
  user: 'Analyze this code for bugs',
  data: { 
    code: 'function foo() { return 42; }' 
  },
  responseFormat: z.object({
    bugs: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high']),
    recommendations: z.array(z.string()).optional(),
  }),
});

const agent = createAgent({
  name: 'CodeAnalyzer',
  enableCache: true,
});

const result = await agent.prompt(analysisPrompt);
// result is typed as { bugs: string[], severity: 'low' | 'medium' | 'high', ... }
```

---

#### **MCPHandler** (`src/core/mcp-handler.ts`)
Manages MCP (Model Context Protocol) server connections and tool execution.

**Key Methods:**
- `registerServer(server: MCPServer): void` - Register MCP server
- `unregisterServer(name: string): void` - Unregister server
- `registerToolExecutor(serverName: string, toolName: string, executor: ToolExecutor): void` - Register custom executor
- `getTools(): Tool[]` - Get all tools in Anthropic format
- `executeTool(toolName: string, input: unknown): Promise<ToolResult>` - Execute tool
- `hasTool(toolName: string): boolean` - Check if tool exists
- `getServerNames(): string[]` - Get registered server names

**MCPServer Interface:**
```typescript
interface MCPServer {
  name: string;
  version?: string;
  transport: 'stdio' | 'inprocess';
  command?: string;      // For stdio transport
  args?: string[];       // For stdio transport
  tools?: Tool[];        // Tools provided by server
  env?: Record<string, string>;
}
```

**Example:**
```typescript
const agent = createAgent({
  name: 'DataProcessor',
  mcps: [
    {
      name: 'filesystem',
      transport: 'inprocess',
      tools: [
        {
          name: 'read_file',
          description: 'Read a file from disk',
          input_schema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
            },
            required: ['path'],
          },
        },
      ],
    },
  ],
});

// Register executor
agent.getMcpHandler().registerToolExecutor(
  'filesystem',
  'read_file',
  async (input) => {
    return await fs.readFile(input.path, 'utf-8');
  }
);
```

---

### 2.2 Decorators

#### **@Step** (`src/decorators/step.ts`)
Emits lifecycle events and tracks step execution timing.

**Options:**
```typescript
interface StepOptions {
  name?: string;              // Custom step name (default: method name)
  trackTiming?: boolean;      // Include duration in event (default: true)
  snapshotState?: boolean;    // Capture state snapshot (default: false)
  logStart?: boolean;         // Log message at step start (default: false)
  logFinish?: boolean;        // Log message at step end (default: false)
}
```

**Example:**
```typescript
class DataProcessor extends Workflow {
  @Step({ trackTiming: true, snapshotState: true, logStart: true })
  async processData(): Promise<string[]> {
    // Step logic
    return ['item1', 'item2'];
  }
}
```

**Events Emitted:**
- `stepStart` - When step begins execution
- `stepEnd` - When step completes (includes duration if trackTiming is true)
- `error` - If step throws (includes state snapshot and logs)

---

#### **@Task** (`src/decorators/task.ts`)
Spawns and manages child workflows.

**Options:**
```typescript
interface TaskOptions {
  name?: string;                      // Custom task name (default: method name)
  concurrent?: boolean;               // Run workflows in parallel (default: false)
  errorMergeStrategy?: {              // Error merging for concurrent tasks
    enabled: boolean;
    maxMergeDepth?: number;
    combine?(errors: WorkflowError[]): WorkflowError;
  };
}
```

**Behavior:**
- Workflow objects (with `id` property) are automatically attached as children
- Non-workflow objects are silently skipped (lenient validation)
- Original return value is always preserved
- Duck-typing: any object with `id` property is treated as workflow-like

**Examples:**

**Single Child:**
```typescript
@Task()
async createChild(): Promise<ChildWorkflow> {
  return new ChildWorkflow('child1', this);
}
```

**Multiple Concurrent Children:**
```typescript
@Task({ concurrent: true })
async createWorkers(): Promise<WorkerWorkflow[]> {
  return [
    new WorkerWorkflow('worker1', 100, this),
    new WorkerWorkflow('worker2', 150, this),
  ];
}
```

**Mixed Return (only workflows attached):**
```typescript
@Task()
async mixedReturn(): Promise<(Workflow | string)[]> {
  return [
    new ChildWorkflow('child1', this),  // Attached
    'some string',                       // Skipped
    new ChildWorkflow('child2', this),  // Attached
  ];
}
```

**Events Emitted:**
- `taskStart` - When task begins
- `taskEnd` - When task completes
- `error` - If task fails (with optional merged errors for concurrent tasks)

---

#### **@ObservedState** (`src/decorators/observed-state.ts`)
Marks fields for state snapshots.

**Metadata:**
```typescript
interface StateFieldMetadata {
  hidden?: boolean;   // Not shown in debugger
  redact?: boolean;   // Shown as '***' in debugger
}
```

**Example:**
```typescript
class MyWorkflow extends Workflow {
  @ObservedState()
  progress: number = 0;

  @ObservedState({ redact: true })  // Shown as '***'
  apiKey: string = 'secret';

  @ObservedState({ hidden: true })  // Not shown at all
  internalState: string = 'internal';
}
```

---

### 2.3 Factory Functions

**Convenience functions for dynamic creation:**

```typescript
// Create workflow
const workflow = createWorkflow(
  { name: 'DataPipeline', enableReflection: true },
  async (ctx) => {
    const data = await ctx.step('fetch', () => fetchData());
    return data;
  }
);

// Create agent
const agent = createAgent({
  name: 'Analyst',
  system: 'You analyze data.',
  enableCache: true,
});

// Create prompt
const prompt = createPrompt({
  user: 'Analyze this',
  data: { values: [1, 2, 3] },
  responseFormat: z.object({
    summary: z.string(),
  }),
});

// Quick workflow (shorthand)
const workflow = quickWorkflow('ProcessData', async (ctx) => {
  return await ctx.step('process', () => processData());
});

// Quick agent (shorthand)
const agent = quickAgent('Helper', 'You are helpful.');
```

---

## 3. Hierarchical Task Management

### 3.1 Parent-Child Relationships

**Automatic Attachment:**
```typescript
class ParentWorkflow extends Workflow {
  @Task()
  async spawnChild(): Promise<ChildWorkflow> {
    // Child automatically attached to parent
    return new ChildWorkflow('child1', this);
  }
}
```

**Manual Attachment:**
```typescript
const parent = new Workflow('Parent');
const child = new Workflow('Child');

// Manual attachment
parent.attachChild(child);

// Validation:
// - Throws if child already has different parent
// - Throws if child is ancestor of parent (circular reference)
// - Uses isDescendantOf() for cycle detection
```

**Reparenting:**
```typescript
const parent1 = new Workflow('Parent1');
const parent2 = new Workflow('Parent2');
const child = new Workflow('Child', parent1);

// Detach from parent1
parent1.detachChild(child);

// Attach to parent2
parent2.attachChild(child);

// Observer events propagate correctly after reparenting
```

### 3.2 Hierarchical State

**Workflow Tree:**
```
ParentWorkflow
├── children: Workflow[]
├── parent: Workflow | null
├── node: WorkflowNode
│   ├── parent: WorkflowNode | null
│   ├── children: WorkflowNode[]
│   ├── status: WorkflowStatus
│   ├── logs: LogEntry[]
│   ├── events: WorkflowEvent[]
│   └── stateSnapshot: SerializedWorkflowState | null
```

**Tree Traversal:**
```typescript
// Get root workflow
const root = workflow.getRoot();

// Check if workflow is descendant
if (child.isDescendantOf(parent)) {
  console.log('Child is in parent hierarchy');
}

// Traverse hierarchy
let current: Workflow | null = workflow;
while (current) {
  console.log(current.node.name);
  current = current.parent;
}
```

### 3.3 Event Propagation

Events propagate from children to root observers:

```typescript
// Root workflow
const root = new Workflow('Root');
root.addObserver(observer);

// Child workflow
const child = new Workflow('Child', root);

// When child emits event:
child.emitEvent({ type: 'stepStart', node: child.node, step: 'process' });

// Observer at root receives event
// Event includes full hierarchy context
```

---

## 4. State Persistence

### 4.1 Observed State

**Marking Fields:**
```typescript
class DataProcessor extends Workflow {
  @ObservedState()
  progress: number = 0;

  @ObservedState()
  processedItems: string[] = [];

  @ObservedState({ redact: true })
  apiKey: string = 'sk-xxx';
}
```

### 4.2 State Snapshots

**Manual Snapshot:**
```typescript
// Capture and emit state snapshot
workflow.snapshotState();

// Snapshot stored in workflow.node.stateSnapshot
// Observers notified via onStateUpdated()
```

**Automatic Snapshot (via @Step):**
```typescript
@Step({ snapshotState: true })
async processItem(): Promise<void> {
  this.progress = 50;
  // Snapshot automatically captured after step completes
}
```

**Snapshot Format:**
```typescript
interface SerializedWorkflowState {
  [key: string]: unknown;  // All @ObservedState fields
}
```

### 4.3 State in Errors

Errors include full state context:

```typescript
interface WorkflowError {
  message: string;
  original: unknown;
  workflowId: string;
  stack?: string;
  state: SerializedWorkflowState;  // Snapshot at error time
  logs: LogEntry[];                // Logs from this node only
}
```

---

## 5. Agent Creation & Tool Registration

### 5.1 Creating Agents

**Basic Agent:**
```typescript
const agent = createAgent({
  name: 'Assistant',
  system: 'You are a helpful assistant.',
});
```

**Agent with Tools:**
```typescript
const calculatorTool: Tool = {
  name: 'calculate',
  description: 'Perform arithmetic operations',
  input_schema: {
    type: 'object',
    properties: {
      operation: { type: 'string', enum: ['add', 'subtract'] },
      a: { type: 'number' },
      b: { type: 'number' },
    },
    required: ['operation', 'a', 'b'],
  },
};

const agent = createAgent({
  name: 'Calculator',
  tools: [calculatorTool],
  enableCache: true,
});
```

**Agent with MCP:**
```typescript
const agent = createAgent({
  name: 'FileSystemAgent',
  mcps: [
    {
      name: 'filesystem',
      transport: 'inprocess',
      tools: [readFileTool, writeFileTool],
    },
  ],
});
```

### 5.2 Tool Registration

**Direct Tools:**
```typescript
const agent = createAgent({
  name: 'Agent',
  tools: [tool1, tool2, tool3],
});
```

**MCP Tools (inprocess):**
```typescript
const agent = createAgent({
  name: 'Agent',
  mcps: [
    {
      name: 'mytools',
      transport: 'inprocess',
      tools: [tool1, tool2],
    },
  ],
});

// Register executors
agent.getMcpHandler().registerToolExecutor('mytools', 'tool1', async (input) => {
  return await executeTool1(input);
});
```

**Tool Execution Flow:**
1. Agent calls Anthropic API with tool definitions
2. API returns tool_use request
3. Agent executes tool (direct or via MCP)
4. Pre/post hooks called (if configured)
5. Tool result sent back to API
6. Loop continues until final response

### 5.3 Hooks

**Agent Hooks:**
```typescript
const agent = createAgent({
  name: 'Agent',
  hooks: {
    preToolUse: [
      async (ctx: PreToolUseContext) => {
        console.log(`Calling tool: ${ctx.toolName}`);
      },
    ],
    postToolUse: [
      async (ctx: PostToolUseContext) => {
        console.log(`Tool result: ${ctx.toolOutput}`);
      },
    ],
    sessionStart: [
      async (ctx: SessionStartContext) => {
        console.log(`Session started: ${ctx.agentId}`);
      },
    ],
    sessionEnd: [
      async (ctx: SessionEndContext) => {
        console.log(`Session ended: ${ctx.totalDuration}ms`);
      },
    ],
  },
});
```

---

## 6. Prompt Templates & Structured Output

### 6.1 Creating Prompts

**Basic Prompt:**
```typescript
const prompt = createPrompt({
  user: 'What is the capital of France?',
  responseFormat: z.object({
    answer: z.string(),
    confidence: z.number(),
  }),
});
```

**Prompt with Data:**
```typescript
const prompt = createPrompt({
  user: 'Analyze this code for bugs',
  data: {
    code: 'function foo() { return 42; }',
    language: 'javascript',
  },
  responseFormat: z.object({
    bugs: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high']),
  }),
});

// Data is automatically formatted as XML tags:
// <code>
// "function foo() { return 42; }"
// </code>
// <language>
// "javascript"
// </language>
```

### 6.2 Structured Output

**Zod Schema Validation:**
```typescript
const analysisSchema = z.object({
  bugs: z.array(z.object({
    line: z.number(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })),
  recommendations: z.array(z.string()),
});

const prompt = createPrompt({
  user: 'Analyze this code',
  responseFormat: analysisSchema,
});

const result = await agent.prompt(prompt);
// result is fully typed with inference from schema
```

**Immutable Updates:**
```typescript
const basePrompt = createPrompt({
  user: 'Process this data',
  data: { items: [1, 2, 3] },
  responseFormat: z.object({ count: z.number() }),
});

// Create new prompt with updated data (immutable)
const updatedPrompt = basePrompt.withData({ items: [4, 5, 6] });
```

### 6.3 Prompt Overrides

**Per-Prompt Configuration:**
```typescript
const agent = createAgent({
  name: 'Agent',
  system: 'Default system prompt',
  temperature: 0.7,
});

const prompt = createPrompt({
  user: 'Generate creative response',
  responseFormat: z.object({ text: z.string() }),
});

// Override for this specific prompt
const result = await agent.prompt(prompt, {
  system: 'Creative system prompt',
  temperature: 0.9,
  maxTokens: 2048,
});
```

---

## 7. Integration with z.ai/Anthropic API

### 7.1 Authentication

**Environment Variable:**
```typescript
// Groundswell automatically uses ANTHROPIC_API_KEY
process.env.ANTHROPIC_API_KEY = 'sk-ant-xxx';

const agent = createAgent({
  name: 'Agent',
});
// Agent automatically picks up the API key
```

### 7.2 Model Configuration

**Default Model:**
```typescript
// Default: claude-sonnet-4-20250514
const agent = createAgent({
  name: 'Agent',
});
```

**Custom Model:**
```typescript
const agent = createAgent({
  name: 'Agent',
  model: 'claude-opus-4-20250514',  // Opus
  maxTokens: 8192,
  temperature: 0.5,
});
```

**Per-Prompt Model:**
```typescript
const result = await agent.prompt(prompt, {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
});
```

### 7.3 API Configuration

**Request Parameters:**
```typescript
interface AgentConfig {
  model?: string;          // Model identifier
  maxTokens?: number;      // Max tokens in response (default: 4096)
  temperature?: number;    // Response randomness (0-1)
  tools?: Tool[];          // Available tools
  system?: string;         // System prompt
}
```

**API Call Flow:**
1. Agent builds messages from prompt
2. Merges configuration (Prompt > Overrides > Config)
3. Checks cache (if enabled)
4. Calls Anthropic API with merged config
5. Handles tool use loop
6. Validates response with Zod schema
7. Caches result (if enabled)

### 7.4 Tool Invocation

**Tool Definition:**
```typescript
const tool: Tool = {
  name: 'get_weather',
  description: 'Get weather for a location',
  input_schema: {
    type: 'object',
    properties: {
      location: { type: 'string' },
      units: { type: 'string', enum: ['celsius', 'fahrenheit'] },
    },
    required: ['location'],
  },
};
```

**Tool Registration:**
```typescript
agent.getMcpHandler().registerToolExecutor('weather', 'get_weather', async (input) => {
  return await weatherService.getWeather(input.location, input.units);
});
```

**Tool Loop:**
```typescript
// Agent automatically handles:
// 1. API returns tool_use request
// 2. Agent executes tool
// 3. Result sent back to API
// 4. Loop continues until final response
```

---

## 8. Configuration Requirements

### 8.1 Environment Variables

**Required:**
```bash
# Anthropic API key
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

**Optional (Agent-level):**
```typescript
const agent = createAgent({
  name: 'Agent',
  env: {
    CUSTOM_VAR: 'value',  // Available during agent execution
  },
});
```

### 8.2 Build Configuration

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16",
    "moduleResolution": "Node16",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 8.3 Runtime Requirements

**Node.js Version:**
- Minimum: Node.js 18+
- Recommended: Node.js 20+

**TypeScript Version:**
- Minimum: TypeScript 5.2+

---

## 9. Advanced Features

### 9.1 Caching

**Enable Caching:**
```typescript
const agent = createAgent({
  name: 'Agent',
  enableCache: true,
});

const result1 = await agent.prompt(prompt);  // API call
const result2 = await agent.prompt(prompt);  // Cached

console.log(defaultCache.metrics());
// { hits: 1, misses: 1, hitRate: 50, size: 1, sizeBytes: 1234 }
```

**Cache Configuration:**
```typescript
import { LLMCache } from 'groundswell';

const cache = new LLMCache({
  maxItems: 1000,           // Maximum items
  maxSizeBytes: 52428800,   // 50MB
  defaultTTLMs: 3600000,    // 1 hour
});
```

**Cache Key:**
```typescript
// Deterministic SHA-256 key based on:
// - User message
// - Data
// - System prompt
// - Model
// - Temperature
// - Max tokens
// - Tools/MCPs/Skills
// - Response format schema
```

### 9.2 Reflection

**Enable Reflection:**
```typescript
// Workflow-level
const workflow = createWorkflow(
  { name: 'MyWorkflow', enableReflection: true },
  async (ctx) => {
    await ctx.step('unreliable', async () => {
      // If this fails, reflection will analyze and retry
    });
  }
);

// Agent-level
const agent = createAgent({
  name: 'Agent',
  enableReflection: true,
});

// Prompt-level
const prompt = createPrompt({
  user: 'Execute this task',
  responseFormat: z.object({ result: z.string() }),
  enableReflection: true,  // Enable for this prompt only
});
```

**Reflection Behavior:**
- Analyzes errors with self-correction prompt
- Determines if retry is worthwhile
- Revises prompt data or system prompt
- Retries with modifications
- Multi-level: workflow, agent, prompt

### 9.3 Introspection Tools

**Built-in Tools:**
```typescript
import { INTROSPECTION_TOOLS, createAgent } from 'groundswell';

const agent = createAgent({
  name: 'IntrospectionAgent',
  tools: INTROSPECTION_TOOLS,  // 6 tools for hierarchy navigation
});

// Available tools:
// 1. inspect_current_node - Get current workflow node info
// 2. read_ancestor_chain - Get all ancestors up to root
// 3. list_siblings_children - List siblings and children
// 4. inspect_prior_outputs - Inspect prior step outputs
// 5. inspect_cache_status - Check cache hit/miss status
// 6. request_spawn_workflow - Spawn child workflow
```

**Use Cases:**
- Agents can inspect their position in workflow hierarchy
- Access prior step outputs for context
- Make decisions about spawning child workflows
- Understand workflow topology

### 9.4 Observability

**WorkflowTreeDebugger:**
```typescript
const workflow = new MyWorkflow('MyWorkflow');
const debugger = new WorkflowTreeDebugger(workflow);

await workflow.run();

// Tree visualization
console.log(debugger.toTreeString());

// Logs
console.log(debugger.toLogString());

// Statistics
console.log(debugger.getStats());
// { totalNodes: 10, byStatus: {...}, totalLogs: 25, totalEvents: 30 }
```

**Observer Pattern:**
```typescript
class MyObserver implements WorkflowObserver {
  onLog(entry: LogEntry): void {
    console.log(`[${entry.level}] ${entry.message}`);
  }

  onEvent(event: WorkflowEvent): void {
    console.log(`Event: ${event.type}`);
  }

  onStateUpdated(node: WorkflowNode): void {
    console.log(`State updated: ${node.id}`);
  }

  onTreeChanged(root: WorkflowNode): void {
    console.log('Tree structure changed');
  }
}

const observer = new MyObserver();
workflow.addObserver(observer);
```

---

## 10. Examples & Documentation

### 10.1 Available Examples

Located in `/home/dustin/projects/groundswell/examples/examples/`:

1. **01-basic-workflow.ts** - Simple workflow with status management
2. **02-decorator-options.ts** - All decorator options demonstrated
3. **03-parent-child.ts** - Hierarchical workflows with @Task
4. **04-observers-debugger.ts** - Observers and tree debugger
5. **05-error-handling.ts** - Error handling and state snapshots
6. **06-concurrent-tasks.ts** - Parallel task execution
7. **07-agent-loops.ts** - Agent loops and tool invocation
8. **08-sdk-features.ts** - Tools, MCPs, hooks, skills
9. **09-reflection.ts** - Multi-level reflection
10. **10-introspection.ts** - Introspection tools
11. **11-reparenting-workflows.ts** - Workflow reparenting

### 10.2 Running Examples

```bash
cd ~/projects/groundswell

# Run all examples interactively
npm run start:all

# Run specific example
npm run start:basic
npm run start:parent-child
npm run start:agent-loops
npm run start:reflection
```

### 10.3 Documentation

Located in `/home/dustin/projects/groundswell/docs/`:

- **workflow.md** - Workflow documentation (13KB)
- **agent.md** - Agent documentation (9KB)
- **prompt.md** - Prompt documentation (9KB)

**Full LLM Documentation:**
```bash
npm run generate:llms
# Generates llms_full.txt with complete API reference
```

---

## 11. Key Insights for PRD Implementation

### 11.1 Alignment with PRD Requirements

**Hierarchical Task Management:**
- ✅ Full parent-child relationship support
- ✅ Automatic attachment via @Task decorator
- ✅ Event propagation from children to root
- ✅ Tree traversal and hierarchy validation
- ✅ Reparenting support with observer propagation

**State Persistence:**
- ✅ @ObservedState decorator for marking fields
- ✅ Manual and automatic state snapshots
- ✅ State included in error context
- ✅ State validation and redaction support

**Agent Creation:**
- ✅ createAgent() factory function
- ✅ Comprehensive AgentConfig interface
- ✅ System prompt, tools, MCPs, skills support
- ✅ Lifecycle hooks (pre/post tool, session start/end)
- ✅ Environment variable passthrough

**Tool Registration:**
- ✅ Direct tool registration via AgentConfig
- ✅ MCP server support (inprocess, stdio)
- ✅ Custom tool executors via MCPHandler
- ✅ Tool invocation loop handled automatically
- ✅ Introspection tools for hierarchy navigation

**Prompt Templates:**
- ✅ createPrompt() factory function
- ✅ Immutable value objects
- ✅ Data injection with XML formatting
- ✅ Zod schema validation for structured output
- ✅ Per-prompt overrides (system, tools, model, etc.)

**z.ai/Anthropic API Integration:**
- ✅ Uses @anthropic-ai/sdk v0.71.1
- ✅ Automatic ANTHROPIC_API_KEY pickup
- ✅ Model configuration (claude-sonnet-4, claude-opus-4)
- ✅ Token usage tracking
- ✅ Tool use loop handling
- ✅ Temperature, max_tokens, stop_sequences support

### 11.2 Production Readiness

**Test Coverage:**
- ✅ 50+ test cases across unit, integration, and adversarial suites
- ✅ Tests for decorators, workflows, agents, caching
- ✅ Edge case coverage (circular references, concurrent failures)
- ✅ 100% test pass rate maintained

**Recent Fixes (v0.0.3):**
- ✅ WorkflowLogger.child() signature fixed
- ✅ Promise.allSettled() for concurrent task errors
- ✅ ErrorMergeStrategy implementation
- ✅ Observer error logging improved
- ✅ Tree debugger optimized (O(k) instead of O(n))
- ✅ Workflow name validation
- ✅ isDescendantOf() public API

**Documentation:**
- ✅ Comprehensive README with quick start
- ✅ 11 executable examples
- ✅ Detailed API documentation
- ✅ PRD with full technical specification
- ✅ Changelog with detailed change history

### 11.3 Integration Recommendations

**For Task Management System:**
1. Use `Workflow` as base class for all tasks
2. Use `@Task` decorator for spawning subtasks
3. Use `@ObservedState` for task progress tracking
4. Use `WorkflowTreeDebugger` for visualization

**For Agent System:**
1. Use `createAgent()` with appropriate tools/MCPs
2. Use `createPrompt()` with Zod schemas for validation
3. Enable caching for repeated prompts
4. Use reflection for error recovery

**For State Management:**
1. Mark stateful fields with `@ObservedState`
2. Use `snapshotState()` for checkpoints
3. Use state snapshots in error handling
4. Leverage state in workflow tree debugger

**For Tool System:**
1. Register tools via AgentConfig or MCP servers
2. Use inprocess transport for custom tools
3. Implement tool executors for MCP tools
4. Use introspection tools for agent awareness

---

## 12. Conclusion

The Groundswell library is **production-ready** and provides a comprehensive foundation for building the hierarchical task management system described in the PRD. Key strengths:

1. **Complete API Coverage:** All required classes (Workflow, Agent, Prompt, MCPHandler) are fully implemented
2. **Decorator Support:** @Step, @Task, and @ObservedState provide elegant workflow definition
3. **Hierarchical Management:** Full parent-child support with validation and reparenting
4. **State Persistence:** Built-in snapshot system with error context
5. **Tool Integration:** Direct and MCP-based tool registration with custom executors
6. **Structured Output:** Zod-based validation for type-safe agent responses
7. **Observability:** Tree debugger, observer pattern, and comprehensive events
8. **Caching & Reflection:** Built-in LRU cache and multi-level error recovery
9. **Well-Documented:** Examples, API docs, and PRD with full specification
10. **Tested:** 50+ test cases with 100% pass rate

**Recommendation:** Proceed with using Groundswell as the foundation for the task management system. The library provides all necessary capabilities and is well-maintained with active development (latest version 0.0.3 as of 2026-01-12).

---

## Appendix A: Quick Reference

### Import Paths
```typescript
import {
  // Core classes
  Workflow,
  Agent,
  Prompt,
  MCPHandler,
  
  // Decorators
  Step,
  Task,
  ObservedState,
  
  // Factory functions
  createWorkflow,
  createAgent,
  createPrompt,
  quickWorkflow,
  quickAgent,
  
  // Debugger
  WorkflowTreeDebugger,
  
  // Caching
  LLMCache,
  defaultCache,
  generateCacheKey,
  
  // Reflection
  ReflectionManager,
  executeWithReflection,
  
  // Introspection
  INTROSPECTION_TOOLS,
  
  // Utilities
  Observable,
  generateId,
} from 'groundswell';
```

### Type Imports
```typescript
import type {
  WorkflowStatus,
  WorkflowNode,
  LogLevel,
  LogEntry,
  SerializedWorkflowState,
  StateFieldMetadata,
  WorkflowError,
  WorkflowEvent,
  WorkflowObserver,
  StepOptions,
  TaskOptions,
  ErrorMergeStrategy,
  Tool,
  ToolResult,
  MCPServer,
  Skill,
  AgentHooks,
  TokenUsage,
  AgentConfig,
  PromptOverrides,
  PromptConfig,
  WorkflowContext,
  WorkflowConfig,
  WorkflowResult,
} from 'groundswell';
```

---

**End of Analysis**
