# Groundswell Library Research Report

## 1. Official Documentation

### Repository Information
- **Repository URL**: https://github.com/groundswell-ai/groundswell
- **Local Path**: `/home/dustin/projects/groundswell`
- **NPM Package**: `groundswell` (version 0.0.1)
- **Description**: Hierarchical workflow orchestration engine with full observability
- **Requirements**: Node.js 18+, TypeScript 5.2+

### Core Documentation Files

| File | Path | Description |
|------|------|-------------|
| Main README | `/home/dustin/projects/groundswell/README.md` | Quick start guide, API reference, examples |
| PRD | `/home/dustin/projects/groundswell/PRD.md` | Complete product requirements document |
| Workflow Docs | `/home/dustin/projects/groundswell/docs/workflow.md` | Workflow usage guide |
| Agent Docs | `/home/dustin/projects/groundswell/docs/agent.md` | Agent configuration and usage |
| Prompt Docs | `/home/dustin/projects/groundswell/docs/prompt.md` | Prompt creation with Zod schemas |
| Examples README | `/home/dustin/projects/groundswell/examples/README.md` | Example files overview |
| CHANGELOG | `/home/dustin/projects/groundswell/CHANGELOG.md` | Version history and changes |

### Example Files

| Example | Path | Topics Covered |
|---------|------|----------------|
| 01-basic-workflow | `/home/dustin/projects/groundswell/examples/examples/01-basic-workflow.ts` | Basic workflow creation, logging, status management |
| 02-decorator-options | `/home/dustin/projects/groundswell/examples/examples/02-decorator-options.ts` | All decorator options (@Step, @Task, @ObservedState) |
| 03-parent-child | `/home/dustin/projects/groundswell/examples/examples/03-parent-child.ts` | Hierarchical workflows |
| 04-observers-debugger | `/home/dustin/projects/groundswell/examples/examples/04-observers-debugger.ts` | Observers and debugging |
| 05-error-handling | `/home/dustin/projects/groundswell/examples/examples/05-error-handling.ts` | Error patterns and retry |
| 06-concurrent-tasks | `/home/dustin/projects/groundswell/examples/examples/06-concurrent-tasks.ts` | Parallel execution |
| 07-agent-loops | `/home/dustin/projects/groundswell/examples/examples/07-agent-loops.ts` | Agent.prompt() in workflow loops |
| 08-sdk-features | `/home/dustin/projects/groundswell/examples/examples/08-sdk-features.ts` | Tools, MCPs, hooks |
| 09-reflection | `/home/dustin/projects/groundswell/examples/examples/09-reflection.ts` | Multi-level reflection |
| 10-introspection | `/home/dustin/projects/groundswell/examples/examples/10-introspection.ts` | Introspection tools |
| 11-reparenting-workflows | `/home/dustin/projects/groundswell/examples/examples/11-reparenting-workflows.ts` | Workflow reparenting patterns |

---

## 2. Key Patterns and Code Examples

### 2.1 Workflow Class Extension and Decorators

#### @Workflow Decorator (Base Class)

```typescript
import { Workflow, Step, ObservedState } from 'groundswell';

class DataProcessor extends Workflow {
  @ObservedState()
  progress = 0;

  @Step({ trackTiming: true, snapshotState: true })
  async process(): Promise<string[]> {
    this.progress = 100;
    return ['item1', 'item2', 'item3'];
  }

  async run(): Promise<string[]> {
    this.setStatus('running');
    const result = await this.process();
    this.setStatus('completed');
    return result;
  }
}

const workflow = new DataProcessor('DataProcessor');
const result = await workflow.run();
```

**File**: `/home/dustin/projects/groundswell/examples/examples/01-basic-workflow.ts`

#### @Step Decorator Options

```typescript
// Default - timing tracked automatically
@Step()
async basicStep(): Promise<void> { }

// Disable timing for performance-critical code
@Step({ trackTiming: false })
async highFrequencyStep(): Promise<void> { }

// Full configuration
@Step({
  name: 'CustomStepName',
  snapshotState: true,      // Capture state after step
  trackTiming: true,        // Track duration (default: true)
  logStart: true,           // Log at step start
  logFinish: true,          // Log at step end
})
async monitoredStep(): Promise<void> { }
```

**File**: `/home/dustin/projects/groundswell/README.md` (lines 118-151)

#### @Task Decorator

```typescript
// Standard usage - return single workflow
@Task()
async createChild(): Promise<ChildWorkflow> {
  return new ChildWorkflow('child1', this);  // Attached as child
}

// Return multiple workflows
@Task({ concurrent: true })
async createWorkers(): Promise<WorkerWorkflow[]> {
  return [
    new WorkerWorkflow('worker1', 100, this),  // Attached
    new WorkerWorkflow('worker2', 150, this),  // Attached
  ];  // Both run concurrently
}

// Mixed return - only workflows are attached
@Task()
async mixedReturn(): Promise<(Workflow | string)[]> {
  return [
    new ChildWorkflow('child1', this),  // Attached
    'some string',                       // Skipped (not a workflow)
    new ChildWorkflow('child2', this),  // Attached
  ];
}
```

**File**: `/home/dustin/projects/groundswell/README.md` (lines 176-207)

**Important Notes**:
- Uses duck-typing: any object with an `id` property is treated as workflow-like
- Non-workflow objects are silently skipped (not attached)
- Use `concurrent: true` for automatic parallel execution

#### @ObservedState Decorator

```typescript
@ObservedState()
progress: number = 0;

@ObservedState({ redact: true })  // Shown as '***'
apiKey: string = 'secret';

@ObservedState({ hidden: true })  // Excluded from snapshots
internalState: object = {};
```

**File**: `/home/dustin/projects/groundswell/README.md` (lines 219-225)

---

### 2.2 Agent Creation and Configuration

#### createAgent Factory Function

```typescript
import { createAgent, createPrompt } from 'groundswell';
import { z } from 'zod';

const agent = createAgent({
  name: 'AnalysisAgent',
  model: 'claude-sonnet-4-20250514',
  system: 'You are a helpful assistant.',
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  temperature: 0.7,
});

const prompt = createPrompt({
  user: 'Analyze this code for bugs',
  data: { code: 'function foo() { return 42; }' },
  responseFormat: z.object({
    bugs: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high']),
  }),
});

const result = await agent.prompt(prompt);
// result is typed: { bugs: string[], severity: 'low' | 'medium' | 'high' }
```

**File**: `/home/dustin/projects/groundswell/src/core/factory.ts` (lines 60-62)

#### Agent Configuration Hierarchy

Configuration follows a three-level override hierarchy:

1. **Prompt-level** (highest priority)
2. **Execution-level** (via `PromptOverrides`)
3. **Agent-level** (lowest priority)

```typescript
const agent = createAgent({
  system: 'Default system prompt',  // Agent-level
  model: 'claude-sonnet-4-20250514',
});

const prompt = createPrompt({
  user: 'Hello',
  system: 'Override system prompt',  // Prompt-level (wins)
  responseFormat: z.object({ response: z.string() }),
});

// Or override at execution time
const result = await agent.prompt(prompt, {
  model: 'claude-opus-4-5-20251101',  // Execution-level override
});
```

**File**: `/home/dustin/projects/groundswell/docs/agent.md` (lines 64-86)

#### Quick Agent Factory

```typescript
import { quickAgent } from 'groundswell';

const agent = quickAgent('Helper', 'You are a helpful assistant.');
```

---

### 2.3 MCP Tool Registration and Implementation

#### MCPHandler Registration

```typescript
import { MCPHandler } from 'groundswell';
import type { Tool } from 'groundswell';

const mcpHandler = new MCPHandler();

// Define a custom tool
const calculatorTool: Tool = {
  name: 'calculate',
  description: 'Performs arithmetic operations',
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
      },
      a: { type: 'number' },
      b: { type: 'number' },
    },
    required: ['operation', 'a', 'b'],
  },
};

// Register MCP server with tools
mcpHandler.registerServer({
  name: 'demo',
  transport: 'inprocess',
  tools: [calculatorTool],
});

// Register tool executor
mcpHandler.registerToolExecutor('demo', 'calculate', async (input) => {
  const { operation, a, b } = input;
  switch (operation) {
    case 'add': return { result: a + b };
    case 'subtract': return { result: a - b };
    case 'multiply': return { result: a * b };
    case 'divide': return { result: a / b };
  }
});

// Use with agent
const agent = createAgent({
  tools: mcpHandler.getTools(),
});
```

**File**: `/home/dustin/projects/groundswell/examples/examples/08-sdk-features.ts` (lines 300-322)

#### Tool Execution Flow

1. Agent sends prompt to API
2. API requests tool use
3. Agent executes tool via MCP handler
4. Result sent back to API
5. Loop continues until no more tool calls
6. Final response validated and returned

**Full tool example file**: `/home/dustin/projects/groundswell/examples/examples/08-sdk-features.ts`

#### Tool Names

Tools use full name format: `serverName__toolName`

```typescript
// Execute using full name
const result = await mcpHandler.executeTool('demo__calculate', {
  operation: 'add',
  a: 10,
  b: 5
});
```

---

### 2.4 Caching Usage

#### Default Cache

```typescript
import { createAgent, defaultCache } from 'groundswell';

const agent = createAgent({ enableCache: true });

const result1 = await agent.prompt(prompt);  // API call
const result2 = await agent.prompt(prompt);  // Cached

// Cache metrics
console.log(defaultCache.metrics());
// { hits: 1, misses: 1, hitRate: 50, size: 1, sizeBytes: 1234 }
```

**File**: `/home/dustin/projects/groundswell/README.md` (lines 231-240)

#### Cache Key Generation

Cache keys are deterministic SHA-256 hashes of:
- User message
- Data
- System prompt
- Model
- Temperature
- Max tokens
- Tools
- MCP servers
- Skills
- Response format schema

```typescript
import { generateCacheKey } from 'groundswell';

const keyInputs = {
  user: 'Analyze this',
  data: { code: 'foo' },
  system: 'You are helpful',
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokens: 4096,
  tools: [],
  mcps: [],
  skills: [],
  responseFormatSchema: schema,
};

const key = await generateCacheKey(keyInputs);
```

#### Cache Operations

```typescript
import { defaultCache } from 'groundswell';

// Clear all cache
await defaultCache.clear();

// Bust by prefix (agent ID)
await defaultCache.bustPrefix(agent.id);

// Get individual item
const item = defaultCache.get(key);

// Set item
defaultCache.set(key, value, { ttl: 3600000 });

// Check if exists
const exists = defaultCache.has(key);
```

#### Custom Cache Configuration

```typescript
import { LLMCache } from 'groundswell';

const customCache = new LLMCache({
  maxItems: 500,           // Default: 1000
  maxSizeBytes: 25_000_000, // Default: 50MB
  defaultTTLMs: 7_200_000,  // Default: 1 hour
});
```

**File**: `/home/dustin/projects/groundswell/src/cache/cache.ts`

---

### 2.5 Reflection Usage

#### ReflectionManager

```typescript
import {
  ReflectionManager,
  executeWithReflection,
  createReflectionConfig,
  DEFAULT_REFLECTION_CONFIG
} from 'groundswell';

// Create reflection manager
const reflectionManager = new ReflectionManager(
  createReflectionConfig({
    enabled: true,
    maxAttempts: 3,
    retryDelayMs: 100,
  })
);

// Execute with reflection wrapper
await executeWithReflection(
  () => unreliableStep(),
  reflectionManager,
  (error, attempt, history) => ({
    level: 'workflow',
    failedNode: mockNode,
    error,
    attemptNumber: attempt,
    previousAttempts: history,
  })
);
```

**File**: `/home/dustin/projects/groundswell/examples/examples/09-reflection.ts` (lines 328-342)

#### Three Levels of Reflection

1. **Prompt-level**: `enableReflection` on prompt config
   ```typescript
   const prompt = createPrompt({
     user: 'Complex question',
     enableReflection: true,
     responseFormat: schema,
   });
   ```

2. **Agent-level**: `agent.reflect()` method
   ```typescript
   const result = await agent.reflect(prompt);
   // System prompt gets reflection prefix:
   // "Before answering, reflect on your reasoning..."
   ```

3. **Workflow-level**: Step failure retry with `executeWithReflection()`
   ```typescript
   await executeWithReflection(
     () => step.method(),
     reflectionManager,
     contextBuilder
   );
   ```

**Full example**: `/home/dustin/projects/groundswell/examples/examples/09-reflection.ts`

#### Reflection Configuration

```typescript
// Defaults
console.log(DEFAULT_REFLECTION_CONFIG);
// { enabled: false, maxAttempts: 3, retryDelayMs: 100 }

// Custom config
const config = createReflectionConfig({
  enabled: true,
  maxAttempts: 5,
  retryDelayMs: 500,
});
```

---

### 2.6 Observability Features

#### WorkflowTreeDebugger

```typescript
import { WorkflowTreeDebugger } from 'groundswell';

const workflow = new MyWorkflow('Root');
const debugger = new WorkflowTreeDebugger(workflow);

await workflow.run();

// ASCII tree
console.log(debugger.toTreeString());
// Root [completed]
//   Child-1 [completed]
//   Child-2 [completed]

// Formatted logs
console.log(debugger.toLogString());

// Statistics
console.log(debugger.getStats());
// { totalNodes: 3, byStatus: { completed: 3 }, totalLogs: 10, totalEvents: 15 }

// Find node by ID
const node = debugger.getNode(workflow.id);
```

**File**: `/home/dustin/projects/groundswell/docs/workflow.md` (lines 327-355)

#### Status Symbols

| Symbol | Status |
|--------|--------|
| ○ | idle |
| ◐ | running |
| ✓ | completed |
| ✗ | failed |
| ⊘ | cancelled |

#### Observers

```typescript
import { WorkflowObserver, LogEntry, WorkflowEvent, WorkflowNode } from 'groundswell';

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

const workflow = new MyWorkflow('Root');
workflow.addObserver(observer);
await workflow.run();
```

**Event Types**: `stepStart`, `stepEnd`, `taskStart`, `taskEnd`, `childAttached`, `stateSnapshot`, `error`, `treeUpdated`

#### Introspection Tools

```typescript
import { INTROSPECTION_TOOLS, createAgent } from 'groundswell';

const agent = createAgent({
  name: 'IntrospectionAgent',
  tools: INTROSPECTION_TOOLS,  // 6 tools for hierarchy navigation
});
```

**Available Tools**:
1. `inspect_current_node` - "Where am I?"
2. `read_ancestor_chain` - "What's above me?"
3. `list_siblings_children` - "What's around me?"
4. `inspect_prior_outputs` - "What happened before?"
5. `inspect_cache_status` - "Is this cached?"
6. `request_spawn_workflow` - "Can I create children?"

**File**: `/home/dustin/projects/groundswell/examples/examples/10-introspection.ts`

---

## 3. Best Practices and Gotchas

### 3.1 Common Pitfalls

#### 1. Attaching Child to Multiple Parents (CRITICAL)

**WRONG** - This now throws an error:
```typescript
const parent1 = new Workflow({ name: 'parent1' });
const parent2 = new Workflow({ name: 'parent2' });
const child = new Workflow({ name: 'child' });

parent1.attachChild(child);
parent2.attachChild(child);  // ERROR: child already has a parent
```

**RIGHT** - Use detachChild first:
```typescript
parent1.attachChild(child);
parent1.detachChild(child);  // Detach first
parent2.attachChild(child);  // Now works correctly
```

**Source**: CHANGELOG v0.0.2, lines 108-131

#### 2. Circular Reference Detection

The `attachChild()` method prevents attaching an ancestor as a child:
```typescript
const root = new Workflow({ name: 'root' });
const child = new Workflow({ name: 'child', parent: root });

// This will throw: Cannot attach ancestor as child
root.attachChild(child);
```

#### 3. trackTiming Default Behavior

```typescript
@Step()
async basicStep(): Promise<void> { }
// Timing is tracked by default (trackTiming: true)
```

Only set `trackTiming: false` for performance-critical code with high-frequency execution.

**Source**: README.md, line 130

#### 4. @Task Lenient Validation

Methods returning non-Workflow objects are silently skipped:
```typescript
@Task()
async returnsData(): Promise<string> {
  return 'just some data';  // Returned as-is, no attachment attempted
}
```

This enables flexible method designs and duck-typing.

**Source**: README.md, line 159

---

### 3.2 Performance Considerations

#### 1. Use Concurrent Tasks for Parallel Execution

```typescript
// Sequential (slow)
for (const item of items) {
  const worker = await this.createWorker(item);
  await worker.run();
}

// Parallel with @Task (fast)
@Task({ concurrent: true })
async createWorkers(): Promise<Worker[]> {
  return items.map(item => new Worker(item, this));
}
```

#### 2. Disable Timing for High-Frequency Steps

```typescript
@Step({ trackTiming: false })
async highFrequencyStep(): Promise<void> {
  // Executed many times per second
}
```

#### 3. Use Cache for Repeated Prompts

```typescript
const agent = createAgent({ enableCache: true });
const result = await agent.prompt(prompt);  // First call
const cached = await agent.prompt(prompt);  // Cached result
```

#### 4. Tree Debugger Optimization

The tree debugger uses incremental node map updates for `childDetached` events, avoiding O(n) full rebuilds.

**Source**: CHANGELOG v0.0.3, line 20

---

### 3.3 Recommended Patterns

#### 1. State Snapshot on Error

```typescript
@Step({ snapshotState: true })
async process(): Promise<void> {
  this.currentItem = 'item-1';
  throw new Error('Processing failed');
  // State is captured automatically on error
}
```

#### 2. Retry Pattern with Backoff

```typescript
class RetryWorkflow extends Workflow {
  @ObservedState()
  attempt = 0;

  @Step()
  async unreliableOperation(): Promise<void> {
    this.attempt++;
    if (this.attempt < 3) {
      throw new Error('Temporary failure');
    }
  }

  async run(): Promise<void> {
    const maxAttempts = 3;

    while (this.attempt < maxAttempts) {
      try {
        await this.unreliableOperation();
        break;
      } catch (error) {
        if (this.attempt >= maxAttempts) throw error;
        await this.delay(1000 * this.attempt); // backoff
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
```

**Source**: `/home/dustin/projects/groundswell/docs/workflow.md` (lines 402-433)

#### 3. Error Isolation in Parent-Child Workflows

```typescript
class ResilientParent extends Workflow {
  async run(): Promise<void> {
    for (const config of this.childConfigs) {
      const child = new ChildWorkflow(config, this);

      try {
        await child.run();
      } catch (error) {
        this.logger.warn(`Child failed: ${error.message}`);
        // Continue with other children
      }
    }
  }
}
```

#### 4. Fan-Out / Fan-In Architecture

```typescript
class Pipeline extends Workflow {
  @Step()
  async fanOut(): Promise<string[]> {
    const workers = this.items.map(
      item => new Worker(item, this)
    );

    // Run all in parallel
    return Promise.all(workers.map(w => w.run()));
  }

  @Step()
  async fanIn(results: string[]): Promise<void> {
    this.aggregatedResult = results.join(',');
  }
}
```

---

### 3.4 Configuration Tips

#### 1. Agent Model Selection

```typescript
// For complex reasoning
const agent = createAgent({
  model: 'claude-opus-4-5-20251101',
});

// For faster responses
const agent = createAgent({
  model: 'claude-sonnet-4-20250514',
});

// Default model
const agent = createAgent();
// Uses: claude-sonnet-4-20250514
```

#### 2. Reflection Configuration

```typescript
// Agent-level (default for all prompts)
const agent = createAgent({
  enableReflection: true,
});

// Prompt-level (override for specific prompt)
const prompt = createPrompt({
  user: 'Complex analysis',
  enableReflection: true,
  responseFormat: schema,
});

// Execution-level (override for this call)
const result = await agent.prompt(prompt, {
  enableReflection: true,
});
```

#### 3. Schema Validation with Zod

Use Zod's `.describe()` for better API hints:

```typescript
const schema = z.object({
  summary: z.string().describe('Brief summary in 2-3 sentences'),
  keyPoints: z.array(z.string()).describe('Main takeaways'),
  score: z.number().min(0).max(100).describe('Quality score'),
});
```

#### 4. Redact Sensitive State

```typescript
@ObservedState({ redact: true })
apiKey: string = 'secret-key';  // Shows as '***' in snapshots
```

---

## 4. Error Handling Patterns

### 4.1 WorkflowError Structure

```typescript
interface WorkflowError {
  message: string;           // Error message
  original: unknown;         // Original error
  workflowId: string;        // Workflow ID
  stack?: string;            // Stack trace
  state: Record<string, unknown>;  // State snapshot at error
  logs: LogEntry[];          // Logs from this node only
}
```

### 4.2 Error Handling with @Step

```typescript
class MyWorkflow extends Workflow {
  @ObservedState()
  currentItem = '';

  @Step({ snapshotState: true })
  async process(): Promise<void> {
    this.currentItem = 'item-1';
    throw new Error('Processing failed');
  }

  async run(): Promise<void> {
    try {
      await this.process();
    } catch (error) {
      const wfError = error as WorkflowError;

      console.log(wfError.message);     // 'Processing failed'
      console.log(wfError.workflowId);  // workflow ID
      console.log(wfError.state);       // { currentItem: 'item-1' }
      console.log(wfError.logs);        // logs up to error
      console.log(wfError.stack);       // stack trace
    }
  }
}
```

### 4.3 Concurrent Task Error Merging

```typescript
@Task({
  concurrent: true,
  errorMergeStrategy: {
    enabled: true,
    combine: (errors) => ({
      message: `${errors.length} tasks failed`,
      original: errors,
      workflowId: this.id,
      state: getObservedState(this),
      logs: [],
    }),
  },
})
async createWorkers(): Promise<Worker[]> {
  return items.map(item => new Worker(item, this));
}
```

**Source**: CHANGELOG v0.0.3, lines 16-17

---

## 5. API Reference Summary

### Core Classes

| Class | Factory | Description |
|-------|---------|-------------|
| `Workflow` | `createWorkflow()` | Hierarchical task container |
| `Agent` | `createAgent()` | LLM execution wrapper |
| `Prompt` | `createPrompt()` | Type-safe prompt definition |
| `MCPHandler` | `new MCPHandler()` | Tool registration and execution |
| `LLMCache` | `defaultCache` | LRU cache for LLM responses |
| `ReflectionManager` | `new ReflectionManager()` | Multi-level reflection |
| `WorkflowTreeDebugger` | `new WorkflowTreeDebugger()` | Tree visualization |

### Decorators

| Decorator | Purpose | Key Options |
|-----------|---------|-------------|
| `@Step` | Wrap methods with events | `name`, `snapshotState`, `trackTiming`, `logStart`, `logFinish` |
| `@Task` | Spawn child workflows | `name`, `concurrent`, `errorMergeStrategy` |
| `@ObservedState` | Mark fields for snapshots | `redact`, `hidden` |

### Factory Functions

```typescript
// Workflow factories
createWorkflow<T>(config: WorkflowConfig, executor: WorkflowExecutor<T>): Workflow<T>
quickWorkflow<T>(name: string, executor: WorkflowExecutor<T>): Workflow<T>

// Agent factory
createAgent(config: AgentConfig): Agent
quickAgent(name: string, system?: string): Agent

// Prompt factory
createPrompt<T>(config: PromptConfig<T>): Prompt<T>
```

---

## 6. Running Examples

```bash
# Build the project
npm run build

# Run all examples interactively
npm run start:all

# Run individual examples
npm run start:basic           # Basic workflow
npm run start:decorators      # Decorator options
npm run start:parent-child    # Hierarchical workflows
npm run start:observers       # Observers and debugger
npm run start:errors          # Error handling
npm run start:concurrent      # Concurrent tasks
npm run start:agent-loops     # Agent loops
npm run start:sdk-features    # Tools, MCPs, hooks
npm run start:reflection      # Multi-level reflection
npm run start:introspection   # Introspection tools
npm run start:reparenting     # Reparenting workflows
```

**Source**: `/home/dustin/projects/groundswell/examples/README.md`

---

## 7. Version History

### Version 0.0.3 (2026-01-12)

**Fixed**:
- WorkflowLogger.child() signature
- Promise.allSettled for concurrent tasks
- ErrorMergeStrategy implementation
- Console.error to logger replacement
- Tree debugger optimization
- Workflow name validation
- trackTiming default documentation

**Added**:
- Public `isDescendantOf()` method

### Version 0.0.2 (2026-01-12)

**Fixed**:
- attachChild() parent validation
- Circular reference detection
- Observer event propagation

**Added**:
- `detachChild()` method
- `childDetached` event type
- `isDescendantOf()` helper

### Version 0.0.1 (2025-01-10)

Initial release with hierarchical workflow engine.

**Full changelog**: `/home/dustin/projects/groundswell/CHANGELOG.md`

---

## 8. External Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.1",
    "lru-cache": "^10.4.3",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.2.0",
    "vitest": "^1.0.0"
  }
}
```

**Source**: `/home/dustin/projects/groundswell/package.json`

---

## 9. TypeScript Types Reference

Key type definitions are located in:

| File | Path | Types |
|------|------|-------|
| Main types | `/home/dustin/projects/groundswell/src/types/index.ts` | WorkflowStatus, WorkflowNode, LogEntry, WorkflowError, etc. |
| Decorator types | `/home/dustin/projects/groundswell/src/types/decorators.ts` | StepOptions, TaskOptions, StateFieldMetadata |
| Agent types | `/home/dustin/projects/groundswell/src/types/agent.ts` | AgentConfig, AgentHooks, TokenUsage |
| Prompt types | `/home/dustin/projects/groundswell/src/types/prompt.ts` | PromptConfig, PromptOverrides |
| Workflow context | `/home/dustin/projects/groundswell/src/types/workflow-context.ts` | WorkflowConfig, WorkflowContext, WorkflowResult |
| Reflection | `/home/dustin/projects/groundswell/src/types/reflection.ts` | ReflectionConfig, ReflectionContext, ReflectionEntry |

---

## 10. Additional Resources

### Test Files

Test files provide excellent usage examples:

- `/home/dustin/projects/groundswell/src/__tests__/integration/agent-workflow.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/integration/tree-mirroring.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/agent.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/prompt.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/cache.test.ts`
- `/home/dustin/projects/groundswell/src/__tests__/unit/reflection.test.ts`

### Source Files

Key implementation files:

- `/home/dustin/projects/groundswell/src/core/workflow.ts` - Workflow base class
- `/home/dustin/projects/groundswell/src/core/agent.ts` - Agent implementation
- `/home/dustin/projects/groundswell/src/core/prompt.ts` - Prompt class
- `/home/dustin/projects/groundswell/src/core/mcp-handler.ts` - MCP tool handler
- `/home/dustin/projects/groundswell/src/cache/cache.ts` - LLM cache implementation
- `/home/dustin/projects/groundswell/src/reflection/reflection.ts` - Reflection manager
- `/home/dustin/projects/groundswell/src/tools/introspection.ts` - Introspection tools
- `/home/dustin/projects/groundswell/src/decorators/step.ts` - @Step decorator
- `/home/dustin/projects/groundswell/src/decorators/task.ts` - @Task decorator
- `/home/dustin/projects/groundswell/src/decorators/observed-state.ts` - @ObservedState decorator

---

## Summary

This research report provides comprehensive documentation for the Groundswell library, covering:

1. Official documentation locations and example files
2. Complete code examples for all major patterns
3. Common pitfalls and best practices
4. Performance considerations
5. Configuration tips
6. Error handling patterns
7. API reference
8. Version history and changelog

All file paths are absolute and reference the local Groundswell project at `/home/dustin/projects/groundswell`.
