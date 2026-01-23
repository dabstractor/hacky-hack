# Groundswell Library Research

## Source Documentation

**Local Path**: `~/projects/groundswell/`

**Official Documentation**:
- README.md: https://github.com/groundswell-ai/groundswell (main reference)
- docs/workflow.md - Hierarchical task orchestration
- docs/agent.md - LLM execution with caching and reflection
- docs/prompt.md - Type-safe prompt definitions with Zod

**Example Files**: 11 comprehensive examples in `~/projects/groundswell/examples/examples/`

## Key Exports and API

### Core Classes
- `Workflow` - Hierarchical workflow orchestration engine
- `Agent` - Lightweight wrapper around Anthropic SDK
- `Prompt` - Immutable value objects for LLM prompts
- `MCPHandler` - Model Context Protocol tool handler

### Factory Functions
- `createWorkflow()` - Functional workflow creation
- `createAgent()` - Agent factory
- `createPrompt()` - Prompt factory with Zod schema validation

### Decorators
- `@Step` - Lifecycle events and timing tracking
- `@Task` - Child workflow spawning
- `@ObservedState` - State snapshot field marking

### Caching
- `LLMCache` - LLM response cache class
- `defaultCache` - Default cache instance
- `generateCacheKey` - Deterministic SHA-256 cache key generation

### Reflection
- `ReflectionManager` - Error recovery with retry
- `executeWithReflection` - Reflection execution wrapper

### Introspection
- `INTROSPECTION_TOOLS` - 6 tools for workflow hierarchy navigation
- `handleInspectCurrentNode`, etc. - Individual tool handlers

### Debugging
- `WorkflowTreeDebugger` - Tree visualization and debugging
- `Observable` - Observer pattern interfaces

## @Step Decorator

**Purpose**: Emit lifecycle events and track step execution timing

**Configuration Options**:
```typescript
interface StepOptions {
  name?: string;           // Custom step name (default: method name)
  trackTiming?: boolean;   // Include duration in events (default: true)
  snapshotState?: boolean; // Capture state snapshot (default: false)
  logStart?: boolean;      // Log at step start (default: false)
  logFinish?: boolean;     // Log at step end (default: false)
}
```

**Example**:
```typescript
@Step({ trackTiming: true, snapshotState: true })
async processData(): Promise<void> {
  // Step logic here
}
```

## @Task Decorator

**Purpose**: Spawn and manage child workflows with automatic attachment

**Configuration Options**:
```typescript
interface TaskOptions {
  name?: string;       // Custom task name (default: method name)
  concurrent?: boolean; // Run returned workflows in parallel (default: false)
}
```

**Behavior**:
- Workflow objects automatically attached as children
- Non-workflow objects silently skipped (lenient validation)
- Duck-typing: any object with `id` property treated as workflow-like

**Example**:
```typescript
@Task({ concurrent: true })
async createWorkers(): Promise<WorkerWorkflow[]> {
  return [
    new WorkerWorkflow('worker1', this),
    new WorkerWorkflow('worker2', this),
  ];  // Both run concurrently via Promise.all()
}
```

## @ObservedState Decorator

**Purpose**: Mark fields for inclusion in state snapshots

**Configuration Options**:
```typescript
interface ObservedStateOptions {
  hidden?: boolean;  // Exclude from snapshots entirely
  redact?: boolean;  // Show as '***' in snapshots
}
```

**Example**:
```typescript
@ObservedState()
progress: number = 0;

@ObservedState({ redact: true })
apiKey: string = 'secret';

@ObservedState({ hidden: true })
internalState = {};
```

## Workflow Class

**Constructor Patterns**:
```typescript
// Simple
class MyWorkflow extends Workflow {
  constructor() {
    super('MyWorkflow');
  }
}

// With parameters
class DataWorkflow extends Workflow {
  constructor(data: string) {
    super('DataWorkflow');
    this.data = data;
  }
}

// Parent-child relationship
class ChildWorkflow extends Workflow {
  constructor(name: string, parent: Workflow) {
    super(name);
    // Automatically attached to parent
  }
}
```

**Key Methods**:
- `run()` - Main execution method
- `setStatus(status)` - Set workflow status
- `attachChild(child)` - Manually attach child workflow
- `snapshotState()` - Capture current state
- `addObserver(observer)` - Add event observer
- `removeObserver(observer)` - Remove observer

**Status Values**: `'idle' | 'running' | 'completed' | 'failed' | 'cancelled'`

## Agent Creation

**Factory Function**:
```typescript
import { createAgent } from 'groundswell';

const agent = createAgent({
  name: 'MyAgent',
  system: 'You are a helpful assistant.',
  model: 'claude-sonnet-4-20250514',
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  temperature: 0.7,
  tools: [],           // Optional: direct tools
  mcps: [],            // Optional: MCP servers
  skills: [],          // Optional: skills to load
  hooks: {},           // Optional: lifecycle hooks
  env: {               // Optional: environment variables
    ANTHROPIC_API_KEY: 'key',
  },
});
```

**Configuration Priority**: Prompt-level > Execution-level > Agent-level

## Prompt Creation

**Factory Function**:
```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';

const prompt = createPrompt({
  user: 'Analyze this code',
  data: { code: 'function foo() {}' },
  system: 'You are a code analyst.',
  responseFormat: z.object({
    bugs: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high']),
  }),
  enableReflection: true,
  tools: [],
  mcps: [],
  hooks: {},
});
```

**Key Features**:
- Immutable (frozen on creation)
- Type-safe via Zod schema inference
- Data injection via XML-like formatting
- `withData()` for creating variations

## MCP Tool Registration

**MCPHandler Pattern**:
```typescript
import { MCPHandler } from 'groundswell';

class MyMCP extends MCPHandler {
  readonly name = 'my-mcp';
  readonly transport = 'inprocess' as const;

  constructor() {
    super();

    // Register server
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: [myTool],
    });

    // Register tool executor
    this.registerToolExecutor('my-mcp', 'my_tool', async (input) => {
      return { result: 'success' };
    });
  }
}
```

**Tool Schema**:
```typescript
const tool = {
  name: 'my_tool',
  description: 'Performs an operation',
  input_schema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'A parameter' },
    },
    required: ['param1'],
  },
};
```

**Tool Naming**: `serverName__toolName` (double underscore)

## Caching System

**Enable Caching**:
```typescript
import { defaultCache } from 'groundswell';

const agent = createAgent({ enableCache: true });

// First call hits API, caches result
const result1 = await agent.prompt(prompt);

// Second call returns cached result
const result2 = await agent.prompt(prompt);

// View metrics
const metrics = defaultCache.metrics();
// { hits: 1, misses: 1, hitRate: 50, size: 1, sizeBytes: 1024 }
```

**Cache Key Components**:
- User message
- Data payload
- System prompt
- Model
- Temperature
- Max tokens
- Tools
- MCP servers
- Response format schema

**Manual Cache Operations**:
```typescript
await defaultCache.set(key, value, { ttl: 3600000, prefix: 'agent1' });
const value = await defaultCache.get(key);
await defaultCache.bust(key);           // Remove specific key
await defaultCache.bustPrefix('agent1'); // Remove all with prefix
await defaultCache.clear();              // Clear all
```

## Reflection (Error Recovery)

**Enable Reflection**:
```typescript
const agent = createAgent({ enableReflection: true });

// Or at prompt level
const prompt = createPrompt({
  user: 'Complex question',
  enableReflection: true,
  responseFormat: schema,
});

// Or at execution level
const result = await agent.prompt(prompt, {
  enableReflection: true,
});
```

**Reflection Prefix** (added to system prompt):
```
Before answering, reflect on your reasoning step by step.
Consider alternative approaches and potential errors.
Then provide your final answer.
```

## Observability Features

**WorkflowTreeDebugger**:
```typescript
import { WorkflowTreeDebugger } from 'groundswell';

const workflow = new MyWorkflow('Root');
const debugger_ = new WorkflowTreeDebugger(workflow);

await workflow.run();

// ASCII tree visualization
console.log(debugger_.toTreeString());
// Root [completed]
//   Child-1 [completed]
//   Child-2 [failed]

// Formatted logs
console.log(debugger_.toLogString());

// Statistics
console.log(debugger_.getStats());
// { totalNodes: 3, byStatus: { completed: 2, failed: 1 } }

// Find node
const node = debugger_.getNode(workflowId);

// Subscribe to events
debugger_.events.subscribe({
  next: (event) => console.log(event.type),
});
```

**Observer Pattern**:
```typescript
const observer = {
  onLog(entry: LogEntry): void {
    console.log(`[${entry.level}] ${entry.message}`);
  },
  onEvent(event: WorkflowEvent): void {
    console.log(`Event: ${event.type}`);
  },
  onStateUpdated(node: WorkflowNode): void {
    console.log(`State: ${node.name}`);
  },
  onTreeChanged(root: WorkflowNode): void {
    console.log('Tree updated');
  },
};

workflow.addObserver(observer);
```

## Event Types

| Type            | Description                         |
| --------------- | ----------------------------------- |
| `stepStart`     | Step execution started              |
| `stepEnd`       | Step completed, includes `duration` |
| `taskStart`     | Task execution started              |
| `taskEnd`       | Task completed                      |
| `childAttached` | Child workflow attached             |
| `stateSnapshot` | State snapshot captured             |
| `error`         | Error occurred                      |
| `treeUpdated`   | Tree structure changed              |

## Version Information

**Current Version**: 0.0.3 (actively developed)

**Requirements**:
- Node.js 18+
- TypeScript 5.2+

**Installation**:
```bash
npm install groundswell
```

**Local Development** (for this project):
```bash
# In groundswell project
cd ~/projects/groundswell
npm link

# In hacky-hack project
cd ~/projects/hacky-hack
npm link groundswell
```

**Vitest Path Alias** (vitest.config.ts):
```typescript
resolve: {
  alias: {
    groundswell: new URL('../groundswell/dist/index.js', import.meta.url).pathname
  }
}
```

## Best Practices

1. **Always extend Workflow** for class-based workflows
2. **Use @Step({ trackTiming: true })** for all production steps
3. **Pass parent (this) to child workflows** for proper hierarchy
4. **Enable caching** for repeated prompts
5. **Use Zod schemas** for type-safe prompt responses
6. **Use MCPHandler** for tool registration
7. **Add observers** for production monitoring
8. **Use WorkflowTreeDebugger** for debugging

## Common Gotchas

1. **Cannot attach child to multiple parents** - must `detachChild()` first
2. **Decorator metadata requires** `emitDecoratorMetadata` in tsconfig.json
3. **Cache keys are deterministic** - same inputs always produce same key
4. **@Task decorator is lenient** - non-workflow returns are silently skipped
5. **Status transitions** - idle → running → completed/failed/cancelled
6. **State snapshots** require `@ObservedState()` decorator or manual `snapshotState()`
